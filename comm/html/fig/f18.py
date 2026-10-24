# -*- coding: utf-8 -*-
# 18 章 接続と GATT の図
# 色: スマートフォン（セントラル・GATT のクライアント）= PUR、機器 TH-01（ペリフェラル・GATT のサーバ）= SIG、
#     リンク層 = SIG、L2CAP = GRN、ATT・GATT = PUR、時間・タイマ = TEA、誤り = ALI

def _f18_field(o, x, y, w, h, name, val, c, nsz=9.5, vsz=9.5, fill=None):
    """名前（上）と値（下、等幅）を入れた欄。"""
    o.append(RECT(x, y, w, h, 4, fill or soft(c), c, 1.2))
    if val is None:
        o.append(T(x + w / 2, y + h / 2 + nsz * 0.38, name, "middle", nsz, c, True))
    else:
        o.append(T(x + w / 2, y + h / 2 - 3, name, "middle", nsz, c, True))
        o.append(T(x + w / 2, y + h / 2 + vsz + 1, val, "middle", vsz, INK, False, True))

def _f18_hexbox(o, x, y, hx, c, sz=10, h=20, fill=None):
    """16 進のバイトの列を入れた箱。返り値は幅。"""
    w = tw(hx, sz, True) + 12
    o.append(RECT(x, y, w, h, 3, fill or (soft(c) if c != MUT else SCR), c, 1.1))
    o.append(T(x + w / 2, y + h / 2 + sz * 0.36, hx, "middle", sz, INK, True, True))
    return w

# ---- 1 節: CONNECT_IND ----
def _f18_connind():
    o = []
    o.append(T(350, 18, "CONNECT_IND のペイロード（34 バイト）", "middle", 11.5, INK, True))
    u, x0, y0 = 14, 112, 30
    xx = x0
    for nm, nb, c in (("InitA", 6, MUT), ("AdvA", 6, MUT), ("接続の設定（LLData）", 22, PUR)):
        w = nb * u
        o.append(RECT(xx, y0, w, 28, 4, soft(c), c, 1.3))
        o.append(T(xx + w / 2, y0 + 18, nm, "middle", 10.5, c if c != MUT else INK, True))
        o.append(T(xx + w / 2, y0 + 41, "%d バイト" % nb, "middle", 9, MUT))
        xx += w
    lx0, lx1 = x0 + 12 * u, x0 + 34 * u
    F = [("アクセスアドレス", 4, 96, "71 9E 3C 5A", ["この接続の印", "（乱数で選ぶ）"], SIG),
         ("CRCInit", 3, 72, "2B 6E 8A", ["CRC の", "初期値"], SIG),
         ("WinSize", 1, 56, "02", ["送信窓の", "長さ 2.5 ms"], TEA),
         ("WinOffset", 2, 60, "00 00", ["送信窓の", "ずれ 0 ms"], TEA),
         ("Interval", 2, 60, "18 00", ["24 × 1.25 ms", "= 30 ms"], TEA),
         ("Latency", 2, 60, "04 00", ["L = 4", ""], TEA),
         ("Timeout", 2, 60, "90 01", ["400 × 10 ms", "= 4 s"], TEA),
         ("ChM", 5, 120, "FF FF FF FF 1F", ["37 本の", "チャネルを全部使う"], GLD),
         ("Hop・SCA", 1, 64, "A7", ["Hop 7", "SCA 5"], GLD)]
    tot = sum(f[2] for f in F)
    x, y1 = (700 - tot) / 2, 104
    o.append(W(lx0, y0 + 48, x, y1, c=PUR, lw=1, dash="3 3"))
    o.append(W(lx1, y0 + 48, x + tot, y1, c=PUR, lw=1, dash="3 3"))
    for nm, nb, w, hx, mean, c in F:
        _f18_field(o, x, y1, w, 38, nm, hx, c, nsz=9.5, vsz=9.5)
        o.append(T(x + w / 2, y1 + 51, "%d バイト" % nb, "middle", 9, MUT))
        for k, ln in enumerate(mean):
            if ln:
                o.append(T(x + w / 2, y1 + 70 + k * 13, ln, "middle", 9.5, INK))
        x += w
    o.append(T(350, y1 + 112, "2 バイト以上の値はリトルエンディアン。最後のバイトは、下位 5 ビットがホップ量（7）、上位 3 ビットが SCA（5）。", "middle", 10, MUT))
    return SVG(700, y1 + 124, o, "CONNECT_IND のペイロード。イニシエータのアドレス（InitA）とアドバタイザのアドレス（AdvA）に続く 22 バイトに、接続の設定が入る。値は例である。Interval = 0x0018 = 24 で接続間隔 30 ms、Timeout = 0x0190 = 400 で監視タイムアウト 4 s、ChM の 37 ビットがすべて 1 なので、37 本のデータチャネルをすべて使う。")
F["e18_connind"] = _f18_connind()

def _f18_connect():
    o = []
    yc, yp, ph = 70, 140, 22          # セントラルとペリフェラルの行（パケットの箱の上端）
    o.append(T(14, yc + 10, "セントラル", "start", 10.5, PUR, True))
    o.append(T(14, yc + 24, "（イニシエータ）", "start", 9.5, MUT))
    o.append(T(14, yp + 10, "ペリフェラル", "start", 10.5, SIG, True))
    o.append(T(14, yp + 24, "（アドバタイザ）", "start", 9.5, MUT))
    for y in (yc + ph, yp + ph):
        o.append(W(112, y, 690, y, c=LIN, lw=1))
    # アドバタイズと CONNECT_IND
    o.append(RECT(118, yp, 62, ph, 3, SSOFT, SIG, 1.2)); o.append(T(149, yp + 15, "ADV_IND", "middle", 9.5, SIG, True))
    o.append(RECT(190, yc, 86, ph, 3, PSOFT, PUR, 1.2)); o.append(T(233, yc + 15, "CONNECT_IND", "middle", 9.5, PUR, True))
    o.append(ARR(149, yp - 2, 149, yc + ph + 6, c=SIG, lw=1.1, head=5))
    o.append(ARR(233, yc + ph + 2, 233, yp - 4, c=PUR, lw=1.1, head=5))
    o.append(T(190, 30, "ADV_IND も CONNECT_IND も ch 37", "middle", 9.5, MUT))
    o.append(DIM(180, yp + 34, 190, yp + 34, None, c=MUT))
    o.append(T(185, yp + 48, "150 µs", "middle", 9, MUT))
    # 送信窓
    xw0, xw1 = 330, 378
    o.append(DIM(276, yc - 10, xw0, yc - 10, None, c=TEA))
    o.append(T(303, yc - 16, "1.25 ms + WinOffset", "middle", 9.5, TEA))
    o.append(RECT(xw0, yc - 4, xw1 - xw0, ph + 8, 3, "none", TEA, 1.2, dash="4 3"))
    o.append(T(xw0 - 6, yc + ph + 16, "送信窓", "end", 9.5, TEA))
    # 接続イベント
    anchors = [340, 478, 616]
    chs = [7, 14, 21]
    for i, xa in enumerate(anchors):
        o.append(W(xa, 48, xa, yp + ph + 4, c=FNT, lw=1, dash="2 3"))
        o.append(RECT(xa, yc, 16, ph, 2, PSOFT, PUR, 1.2))
        o.append(RECT(xa + 20, yp, 16, ph, 2, SSOFT, SIG, 1.2))
        o.append(ARR(xa + 8, yc + ph + 1, xa + 26, yp - 1, c=MUT, lw=1, head=5))
        o.append(T(xa + 18, 28, "接続イベント %d" % i, "middle", 9.5, INK, True))
        o.append(T(xa + 18, 41, "ch %d" % chs[i], "middle", 9.5, GLD, True))
    o.append(T(anchors[0], yp + ph + 18, "アンカーポイント", "middle", 9.5, MUT))
    o.append(DIM(anchors[0], yp + ph + 30, anchors[1], yp + ph + 30, None, c=TEA))
    o.append(T((anchors[0] + anchors[1]) / 2, yp + ph + 44, "接続間隔（例 30 ms）", "middle", 9.5, TEA))
    o.append(DIM(anchors[1], yp + ph + 30, anchors[2], yp + ph + 30, None, c=TEA))
    o.append(T((anchors[1] + anchors[2]) / 2, yp + ph + 44, "接続間隔", "middle", 9.5, TEA))
    o.append(T(690, yp + ph + 64, "（時間の目盛は正確ではない）", "end", 9.5, MUT))
    return SVG(700, yp + ph + 72, o, "接続の始まり。イニシエータは ADV_IND を受け取った 150 µs 後に CONNECT_IND を送る。その終わりから 1.25 ms + WinOffset の後の送信窓の中で、セントラルが最初のパケットを送り、その時刻が最初のアンカーポイントになる。以後、接続間隔ごとに、毎回別のデータチャネル（ホップ量 7 なら 7、14、21、…）で接続イベントを行う。")
F["e18_connect"] = _f18_connect()

def _f18_event():
    lanes = [("セントラル", PUR), ("ペリフェラル", SIG)]
    msgs = [
        (0, 1, "データ A（SN 0・NESN 0）", {"c": PUR}),
        (1, 0, "空（SN 0・NESN 1）", {"c": SIG, "sub": "NESN が 1 に進んだ → A は届いた"}),
        (0, 1, "データ B（SN 1・NESN 1）", {"c": PUR, "lost": True, "sub": "雑音で CRC が合わず、捨てられる"}),
        (1, 0, "前と同じ空（SN 0・NESN 1）", {"c": SIG, "sub": "NESN が 1 のまま → B は届いていない"}),
        (0, 1, "データ B を送り直す（SN 1・NESN 1）", {"c": PUR}),
        (1, 0, "空（SN 1・NESN 0）", {"c": SIG, "sub": "NESN が 0 に進んだ → B は届いた"}),
        ("gap", "眠る"),
    ]
    return SEQFIG(lanes, msgs, "1 つの接続イベントの中のやり取り（1 本のデータチャネルで、パケットの間は 150 µs）。パケットのヘッダの SN は自分のパケットの 1 ビットの番号、NESN は相手から次に受け取りたい番号で、05 章 4 節のストップアンドウェイトと同じ確認応答になる。CRC が合わないパケットは捨てられ、送り手は相手の NESN が進まないのを見て送り直す。送るものが無くなったら、2 台とも次のアンカーポイントまで眠る。", w=640, dy=38)
F["e18_event"] = _f18_event()

def _f18_latency():
    o = []
    x0, dx, n = 70, 46, 13
    yc, yp = 58, 112
    X = lambda k: x0 + k * dx
    o.append(T(14, yc + 12, "セントラル", "start", 10.5, PUR, True))
    o.append(T(14, yp + 12, "ペリフェラル", "start", 10.5, SIG, True))
    listen = {0, 5, 7, 12}
    for k in range(n):
        o.append(W(X(k), 34, X(k), yp + 26, c=GRD, lw=1))
        o.append(RECT(X(k) - 7, yc, 14, 16, 2, PSOFT, PUR, 1.1))
        if k in listen:
            o.append(RECT(X(k) - 7, yp, 14, 16, 2, SSOFT, SIG, 1.4))
        else:
            o.append(RECT(X(k) - 7, yp, 14, 16, 2, "none", FNT, 1, dash="2 2"))
        o.append(T(X(k), yp + 40, str(k), "middle", 9.5, MUT))
    o.append(T(X(6), yp + 56, "接続イベントの番号（接続間隔 I = 30 ms ごと）", "middle", 9.5, MUT))
    # セントラルのデータ
    xd = X(0) + 12
    o.append(D(xd, 40, ALI, 4))
    o.append(T(xd + 8, 30, "セントラルのデータができる（イベント 0 の直後）", "start", 9.5, ALI))
    o.append(W(xd, 44, X(5), 44, c=ALI, lw=1.4, dash="4 3"))
    o.append(ARR(X(5), 44, X(5), yc - 1, c=ALI, lw=1.4, head=5))
    o.append(ARR(X(5), yc + 17, X(5), yp - 1, c=ALI, lw=1.6, head=6))
    o.append(DIM(X(0), yp + 70, X(5), yp + 70, None, c=ALI))
    o.append(T(X(2.5), yp + 84, "最大 (1 + L)I = 5 × 30 = 150 ms", "middle", 9.5, ALI, True))
    # ペリフェラルのデータ
    xq = X(6) + 14
    o.append(D(xq, yp + 8, GRN, 4))
    o.append(ARR(xq + 4, yp + 8, X(7) - 9, yp + 8, c=GRN, lw=1.4, head=6))
    o.append(T(X(6) - 6, yp - 10, "ペリフェラルのデータ: 次の接続イベントで起きて送る（最大 I）", "start", 9.5, GRN, halo=True))
    o.append(LEGEND(400, 20, [(SIG, "ペリフェラルが受信する"), (FNT, "休む")]))
    return SVG(700, yp + 96, o, "ペリフェラルレイテンシ L = 4、接続間隔 I = 30 ms の例。セントラルはすべての接続イベントで送るが、ペリフェラルは送るものが無ければ続けて 4 回まで休める。セントラルのデータは、ペリフェラルが次に受信する接続イベントまで、最大 (1 + L)I = 150 ms 待つ。ペリフェラルは送るものがあれば次の接続イベントで起き、そこから数えて 4 回まで、また休める。")
F["e18_latency"] = _f18_latency()

def _f18_super():
    o = []
    X = lambda t: 150 + t * 0.44
    rows = [(70, 300, False), (170, 1000, True)]
    for t in range(0, 1201, 200):
        o.append(T(X(t), 30, "%d ms" % t, "middle", 9.5, MUT))
    o.append(T(14, 30, "時刻", "start", 9.5, MUT))
    xl = X(400)
    o.append(W(xl, 38, xl, 222, c=GLD, lw=1.3, dash="5 3"))
    o.append(T(xl + 4, 236, "2(1 + L)I = 400 ms", "middle", 9.5, GLD, True))
    for y, to, good in rows:
        c = GRN if good else ALI
        o.append(T(14, y + 4, "監視タイムアウト", "start", 10, INK, True))
        o.append(T(14, y + 19, "%s" % ("1 s（良い例）" if good else "300 ms（悪い例）"), "start", 10, c, True))
        o.append(W(X(0), y, X(1200), y, c=LIN, lw=1.2))
        end = 1200 if good else 300
        for t in range(0, 1201, 200):
            if t > end:
                o.append(CIRC(X(t), y, 6, FNT, 1, "none", "2 2"))
                continue
            if t == 200:
                o.append(CIRC(X(t), y, 6, ALI, 1.2, ASOFT))
                o.append(W(X(t) - 5, y - 5, X(t) + 5, y + 5, c=ALI, lw=1.8) + W(X(t) - 5, y + 5, X(t) + 5, y - 5, c=ALI, lw=1.8))
            else:
                o.append(CIRC(X(t), y, 6, GRN, 1.4, GSOFT))
        # タイマ
        yb = y + 16
        if good:
            for a, b in ((0, 400), (400, 600), (600, 800), (800, 1000), (1000, 1200)):
                o.append(RECT(X(a), yb, X(b) - X(a) - 2, 8, 2, TSOFT, TEA, 1))
            o.append(T(X(410), yb + 24, "2 番目の機会（400 ms）で届き、タイマを計り直す。接続は保たれる", "start", 9.5, GRN))
            o.append(T(X(1000), y - 12, "タイマは 1 s に届かない", "middle", 9.5, MUT))
        else:
            o.append(RECT(X(0), yb, X(300) - X(0), 8, 2, ASOFT, ALI, 1))
            o.append(W(X(300), y - 16, X(300), y + 26, c=ALI, lw=2))
            o.append(T(X(300) + 6, y - 12, "300 ms: 何も届かないので切断と判断", "start", 9.5, ALI, True, halo=True))
            o.append(T(X(410), yb + 24, "400 ms の機会を待たずに切れてしまう", "start", 9.5, MUT))
    o.append(T(14, 260, "○ ペリフェラルが受信する機会（(1 + L)I = 200 ms ごと）　× 雑音で失われた機会　帯: 監視のタイマ", "start", 9.5, MUT))
    return SVG(700, 272, o, "監視タイムアウトの条件（接続間隔 I = 50 ms、L = 3 の例）。やり取りは (1 + L)I = 200 ms ごとの機会にしか起きない。200 ms の機会が失われたとき、監視タイムアウトが 2(1 + L)I = 400 ms より短い（上）と、次の機会が来る前に切断と判断してしまう。400 ms より長い（下）と、次の機会で届いて接続が保たれる。")
F["e18_super"] = _f18_super()

# ---- 2 節: L2CAP と ATT ----
def _f18_l2cap():
    o = []
    y1 = 30
    o.append(T(20, y1 - 10, "リンク層のパケット（接続中のデータのパケット）", "start", 10.5, SIG, True))
    L1 = [("プリアンブル", 70, "1 バイト", MUT), ("アクセスアドレス", 104, "4 バイト", SIG), ("ヘッダ", 64, "2 バイト", SIG),
          ("ペイロード", 300, "0〜27 バイト（既定）", SIG), ("CRC", 60, "3 バイト", SIG)]
    x = 40
    xs = {}
    for nm, w, sub, c in L1:
        o.append(RECT(x, y1, w, 26, 4, soft(c), c, 1.2))
        o.append(T(x + w / 2, y1 + 17, nm, "middle", 10, c if c != MUT else INK, True))
        o.append(T(x + w / 2, y1 + 40, sub, "middle", 9, MUT))
        xs[nm] = (x, x + w)
        x += w
    y2 = 104
    px0, px1 = xs["ペイロード"]
    L2 = [("長さ", 60, "2", GRN), ("チャネル ID", 84, "2", GRN), ("オペコード", 78, "1", PUR), ("パラメータ", 196, "", PUR)]
    tot = sum(f[1] for f in L2)
    x = (px0 + px1) / 2 - tot / 2
    o.append(W(px0, y1 + 46, x, y2, c=SIG, lw=1, dash="3 3"))
    o.append(W(px1, y1 + 46, x + tot, y2, c=SIG, lw=1, dash="3 3"))
    xs2 = []
    for nm, w, nb, c in L2:
        o.append(RECT(x, y2, w, 26, 4, soft(c), c, 1.2))
        o.append(T(x + w / 2, y2 + 17, nm, "middle", 10, c, True))
        xs2.append((x, w))
        x += w
    o.append(T(xs2[0][0], y2 - 8, "ペイロードの中身", "start", 10.5, INK, True))
    a0 = xs2[0][0]
    o.append(DIM(a0, y2 + 36, a0 + 144, y2 + 36, None, c=GRN))
    o.append(T(a0 + 72, y2 + 50, "L2CAP のヘッダ 4 バイト", "middle", 9.5, GRN, True))
    b0 = xs2[2][0]
    o.append(DIM(b0, y2 + 36, b0 + 274, y2 + 36, None, c=PUR))
    o.append(T(b0 + 137, y2 + 50, "ATT の PDU", "middle", 9.5, PUR, True))
    # 例
    y3 = 186
    o.append(T(xs2[0][0], y3 - 8, "例: ハンドル 0x000A を読む Read Request", "start", 10.5, INK, True))
    ex = [("03 00", GRN, "長さ 3"), ("04 00", GRN, "0x0004 = ATT"), ("0A", PUR, "Read Request"), ("0A 00", PUR, "ハンドル 0x000A")]
    for (hx, c, lab), (xx, w) in zip(ex, xs2):
        o.append(RECT(xx, y3, w, 22, 3, soft(c), c, 1.1))
        o.append(T(xx + w / 2, y3 + 15, hx, "middle", 10, INK, True, True))
        o.append(T(xx + w / 2, y3 + 36, lab, "middle", 9.5, c))
    nx = 22
    o.append(RECT(nx - 8, 100, 160, 84, 6, MSOFT, LIN, 1))
    o.append(T(nx, 120, "固定のチャネル ID", "start", 10, INK, True))
    for i, (cid, nm) in enumerate((("0x0004", "ATT"), ("0x0005", "LE シグナリング"), ("0x0006", "SMP"))):
        o.append(T(nx, 140 + i * 16, cid, "start", 9.5, GRN, True, True))
        o.append(T(nx + 46, 140 + i * 16, nm, "start", 9.5, INK))
    return SVG(700, y3 + 48, o, "接続中のリンク層のパケットのペイロードには、L2CAP のパケットが入る。L2CAP のヘッダは、後ろのデータの長さとチャネル ID の 4 バイト（どちらもリトルエンディアン）。チャネル ID が 0x0004 なら、中身は ATT の PDU である。")
F["e18_l2cap"] = _f18_l2cap()

def _f18_attr():
    o = []
    cols = [("ハンドル", 104, "0x000A", True, ["16 ビットの番号。", "読み書きの相手を指す"], SIG),
            ("属性の型", 206, "5C3A0002-…（温度）", True, ["UUID。何の値かを表す", ""], SIG),
            ("属性の値", 136, "29 09", True, ["0〜512 バイトの列", "（23.45 °C）"], SIG),
            ("パーミッション", 170, "読む: 可・書く: 不可", False, ["サーバの中の決まり。", "PDU では送らない"], MUT)]
    x, y = 40, 34
    o.append(T(350, 18, "属性の例（3 節の表の 0x000A）", "middle", 11, INK, True))
    for nm, w, val, mono, notes, c in cols:
        o.append(RECT(x, y, w, 22, 0, soft(c), c, 1.2))
        o.append(T(x + w / 2, y + 15, nm, "middle", 10, c if c != MUT else INK, True))
        o.append(RECT(x, y + 22, w, 28, 0, PAN, c, 1.2, dash=None if c != MUT else "4 3"))
        o.append(T(x + w / 2, y + 41, val, "middle", 10, INK, False, mono and not val.startswith("読")))
        for k, ln in enumerate(notes):
            if ln:
                o.append(T(x + w / 2, y + 68 + k * 14, ln, "middle", 9.5, MUT))
        x += w
    return SVG(700, y + 96, o, "属性は、ハンドル・型・値・パーミッションの 4 つを持つ。クライアントはハンドルを指定して値を読み書きする。パーミッションはサーバが要求を受け付けるかを決めるのに使い、PDU の中には現れない。")
F["e18_attr"] = _f18_attr()

def _f18_roles():
    o = []
    panels = [(14, "(a) スマートフォンが機器の値を読む（よくある形）", ("ATT のクライアント", "ATT のサーバ"), (("要求（読む・書く）", 1), ("応答・通知", -1))),
              (360, "(b) 機器がスマートフォンの時刻を読む", ("ATT のサーバ", "ATT のクライアント"), (("要求（読む）", -1), ("応答", 1)))]
    for x0, title, att, arr in panels:
        o.append(T(x0, 20, title, "start", 10.5, INK, True))
        for k, (nm, c, ll) in enumerate((("スマートフォン", PUR, "セントラル"), ("機器 TH-01", SIG, "ペリフェラル"))):
            bx = x0 + k * 204
            o.append(RECT(bx, 34, 122, 92, 8, soft(c), c, 1.4))
            o.append(T(bx + 61, 54, nm, "middle", 11, c, True))
            s, w = CHIP(bx + 61, 80, ll, MUT, 9.5, a="middle"); o.append(s)
            s, w = CHIP(bx + 61, 108, att[k], GLD if "サーバ" in att[k] else TEA, 9.5, a="middle"); o.append(s)
        for (lab, d), y in zip(arr, (70, 104)):
            o.append(ARR(x0 + 126, y, x0 + 200, y, c=MUT, lw=1.3, head=6) if d > 0 else ARR(x0 + 200, y, x0 + 126, y, c=MUT, lw=1.3, head=6))
            o.append(T(x0 + 163, y - 8, lab, "middle", 9.5, INK))
    o.append(T(14, 150, "灰色の札: リンク層の役割（どちらが接続を始めたか）。色の札: ATT の役割（データを持つのがサーバ、読み書きするのがクライアント）。", "start", 9.5, MUT))
    return SVG(700, 162, o, "リンク層の役割（セントラル・ペリフェラル）と ATT の役割（クライアント・サーバ）は別の軸である。(a) が多いが、(b) のように、ペリフェラルの機器がクライアントになることもある。1 台が両方の役を同時に持つこともできる。")
F["e18_roles"] = _f18_roles()

def _f18_pdu():
    o = []
    blocks = [("(a) 値を読む", [("0A", PUR, "Read Request"), ("0A 00", SIG, "ハンドル 0x000A")],
               [("0B", PUR, "Read Response"), ("29 09", SIG, "値（23.45 °C）")]),
              ("(b) 無いハンドルを読む", [("0A", PUR, "Read Request"), ("20 00", SIG, "ハンドル 0x0020")],
               [("01", ALI, "Error Response"), ("0A", PUR, "誤った要求 0x0A"), ("20 00", SIG, "そのハンドル"), ("01", ALI, "Invalid Handle")]),
              ("(c) 読むだけの値に書く", [("12", PUR, "Write Request"), ("0A 00", SIG, "ハンドル 0x000A"), ("00 00", SIG, "書きたい値")],
               [("01", ALI, "Error Response"), ("12", PUR, "誤った要求 0x12"), ("0A 00", SIG, "そのハンドル"), ("03", ALI, "Write Not Permitted")])]
    bw = 230
    ymax = 0
    for i, (title, req, rsp) in enumerate(blocks):
        x = 10 + i * bw
        o.append(T(x + 4, 20, title, "start", 10.5, INK, True))
        y = 32
        for lab, rows in (("要求（クライアント → サーバ）", req), ("返す PDU（サーバ → クライアント）", rsp)):
            o.append(T(x + 4, y + 12, lab, "start", 9.5, MUT))
            y += 20
            for hx, c, t in rows:
                w = _f18_hexbox(o, x + 4, y, hx, c, 10)
                o.append(T(x + 58, y + 14, t, "start", 9.5, c if c in (ALI,) else INK))
                y += 24
            y += 6
        ymax = max(ymax, y)
    return SVG(700, ymax + 4, o, "ATT の PDU の例（3 節の表の機器）。(a) Read Request に Read Response で値を返す。(b)(c) 応答できない要求には、誤った要求のオペコード・ハンドル・誤りの番号を入れた 5 バイトの Error Response を返す。")
F["e18_pdu"] = _f18_pdu()

# ---- 3 節: GATT ----
_F18_KC = {"svc": PUR, "decl": GLD, "val": SIG, "desc": TEA}
_F18_TABLE = [
    ("0x0001", "0x2800 プライマリサービス宣言", "00 18", "Generic Access（0x1800）", "svc"),
    ("0x0002", "0x2803 キャラクタリスティック宣言", "02 03 00 00 2A", "Read・値は 0x0003・UUID 0x2A00", "decl"),
    ("0x0003", "0x2A00（Device Name）", "54 48 2D 30 31", "機器の名前 \"TH-01\"", "val"),
    ("0x0004", "0x2800 プライマリサービス宣言", "0F 18", "Battery Service（0x180F）", "svc"),
    ("0x0005", "0x2803 キャラクタリスティック宣言", "12 06 00 19 2A", "Read・Notify・値は 0x0006・UUID 0x2A19", "decl"),
    ("0x0006", "0x2A19（Battery Level）", "57", "電池の残り 87 %", "val"),
    ("0x0007", "0x2902 CCCD", "00 00", "通知を受けるか（いまは受けない）", "desc"),
    ("0x0008", "0x2800 プライマリサービス宣言", "45 B8 … 01 00 3A 5C", "独自のサービス（5C3A0001-…）", "svc"),
    ("0x0009", "0x2803 キャラクタリスティック宣言", "32 0A 00 45 B8 … 02 00 3A 5C", "Read・Notify・Indicate・値は 0x000A", "decl"),
    ("0x000A", "5C3A0002-…（温度）", "29 09", "23.45 °C（0.01 °C 単位）", "val"),
    ("0x000B", "0x2902 CCCD", "00 00", "通知・指示を受けるか", "desc"),
    ("0x000C", "0x2803 キャラクタリスティック宣言", "0A 0D 00 45 B8 … 03 00 3A 5C", "Read・Write・値は 0x000D", "decl"),
    ("0x000D", "5C3A0003-…（測定の間隔）", "3C 00", "60 s（1 s 単位）", "val"),
]

def _f18_table():
    o = []
    cx = [(16, 58, "ハンドル"), (78, 172, "型"), (254, 172, "値（16 進）"), (430, 258, "意味")]
    y0, rh = 18, 21
    for x, w, t in cx:
        o.append(T(x + 4, y0 + 10, t, "start", 10, INK, True))
    y = y0 + 18
    groups = []
    for i, (h, ty, v, m, k) in enumerate(_F18_TABLE):
        c = _F18_KC[k]
        o.append(RECT(16, y, 672, rh - 2, 3, soft(c), c, 0.9))
        o.append(T(20, y + 14, h, "start", 10, INK, k == "svc", True))
        o.append(T(82, y + 14, ty, "start", 9.5, c, k == "svc"))
        o.append(T(258, y + 14, v, "start", 9.5, INK, False, True))
        o.append(T(434, y + 14, m, "start", 9.5, INK, k == "svc"))
        y += rh
    yl = y + 18
    o.append(LEGEND(16, yl, [(PUR, "サービス宣言"), (GLD, "キャラクタリスティック宣言"), (SIG, "キャラクタリスティックの値"), (TEA, "記述子")]))
    return SVG(700, yl + 10, o, "温湿度センサ TH-01 の属性の表（例）。サービス宣言から次のサービス宣言の手前までが 1 つのサービスで、その中にキャラクタリスティック宣言・値・記述子が並ぶ。値はリトルエンディアンで、UUID 0x2A19 は 19 2A と並ぶ。128 ビットの UUID（16 バイト）は途中を … で省いた。")
F["e18_table"] = _f18_table()

def _f18_decl():
    o = []
    o.append(T(20, 20, "キャラクタリスティック宣言 0x0009 の値（19 バイト）", "start", 10.5, INK, True))
    parts = [("32", 90, "プロパティ"), ("0A 00", 120, "値のハンドル 0x000A"), ("45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 02 00 3A 5C", 420, "キャラクタリスティックの UUID（5C3A0002-…）")]
    x = 40
    for hx, w, lab in parts:
        o.append(RECT(x, 30, w, 24, 3, GOSOFT, GLD, 1.2))
        o.append(T(x + w / 2, 46, hx, "middle", 10, INK, True, True))
        o.append(T(x + w / 2, 70, lab, "middle", 9.5, GLD))
        x += w
    # ビット
    bits = [(7, "0x80", ["Extended", "Properties"]), (6, "0x40", ["署名付きの", "書き込み"]), (5, "0x20", ["Indicate", ""]), (4, "0x10", ["Notify", ""]),
            (3, "0x08", ["Write", ""]), (2, "0x04", ["Write Without", "Response"]), (1, "0x02", ["Read", ""]), (0, "0x01", ["Broadcast", ""])]
    v = 0x32
    bx, bw, by = 40, 80, 110
    o.append(T(20, by - 14, "プロパティ 0x32 = 0b0011_0010 のビット", "start", 10.5, INK, True))
    for i, (b, hx, nm) in enumerate(bits):
        on = (v >> b) & 1
        c = SIG if on else MUT
        x = bx + i * bw
        o.append(RECT(x, by, bw, 26, 0, soft(c) if on else PAN, c if on else LIN, 1.2))
        o.append(T(x + bw / 2, by + 18, "b%d = %d" % (b, on), "middle", 10.5, c if on else MUT, bool(on), True))
        o.append(T(x + bw / 2, by + 40, hx, "middle", 9.5, MUT, False, True))
        for k, ln in enumerate(nm):
            if ln:
                o.append(T(x + bw / 2, by + 56 + k * 13, ln, "middle", 9.5, c if on else INK, bool(on)))
    o.append(T(350, by + 100, "この値には Read・Notify・Indicate ができる。Write のビットは 0 なので、クライアントは書けないと分かる。", "middle", 10, INK))
    return SVG(700, by + 112, o, "キャラクタリスティック宣言の値は、プロパティ 1 バイト・値のハンドル 2 バイト・UUID（2 か 16 バイト）。プロパティの各ビットが、クライアントがその値にできることを表す。3 節の表の温度の宣言では 0x32 で、Read（0x02）・Notify（0x10）・Indicate（0x20）が立っている。")
F["e18_decl"] = _f18_decl()

def _f18_uuid():
    o = []
    o.append(T(14, 20, "(a) 16 ビットの UUID 0x180F を 128 ビットにする", "start", 10.5, INK, True))
    o.append(T(14, 46, "128 ビット", "start", 9.5, MUT))
    x = 100
    for st, c in (("0000", MUT), ("180F", SIG), ("-0000-1000-8000-00805F9B34FB", MUT)):
        o.append(T(x, 46, st, "start", 12, c, c == SIG, True))
        x += tw(st, 12, True)
    o.append(T(100, 64, "基準 UUID 0000xxxx-0000-1000-8000-00805F9B34FB の xxxx に 180F を入れたもの", "start", 9.5, MUT))
    o.append(T(14, 98, "PDU の順", "start", 9.5, MUT))
    le = "FB 34 9B 5F 80 00 00 80 00 10 00 00 0F 18 00 00".split()
    for i, b in enumerate(le):
        hi = i in (12, 13)
        o.append(RECT(100 + i * 34, 84, 30, 20, 3, SSOFT if hi else PAN, SIG if hi else LIN, 1.1))
        o.append(T(115 + i * 34, 98, b, "middle", 10, SIG if hi else INK, hi, True))
    o.append(T(100, 120, "リトルエンディアン（左が先に送るバイト）。0x180F は 0F 18 の順に入る", "start", 9.5, MUT))
    yb = 150
    o.append(T(14, yb, "(b) 独自の UUID 5C3A0002-8E2F-4B7D-A1C6-3F9E0D27B845 を PDU に並べる", "start", 10.5, INK, True))
    be = "5C 3A 00 02 8E 2F 4B 7D A1 C6 3F 9E 0D 27 B8 45".split()
    xs, x = [], 100
    for i, b in enumerate(be):
        if i in (4, 6, 8, 10):
            x += 8
        xs.append(x)
        x += 34
    y1, y2 = yb + 14, yb + 84
    o.append(T(14, y1 + 14, "文字の順", "start", 9.5, MUT))
    o.append(T(14, y2 + 14, "PDU の順", "start", 9.5, MUT))
    for i in range(16):
        j = 15 - i
        o.append(W(xs[i] + 15, y1 + 20, 116 + j * 34 + 15, y2, c=FNT, lw=0.9))
    for i, b in enumerate(be):
        hi = i in (2, 3)
        o.append(RECT(xs[i], y1, 30, 20, 3, SSOFT if hi else PAN, SIG if hi else LIN, 1.1))
        o.append(T(xs[i] + 15, y1 + 14, b, "middle", 10, SIG if hi else INK, hi, True))
    for j, b in enumerate(reversed(be)):
        hi = j in (12, 13)
        o.append(RECT(116 + j * 34, y2, 30, 20, 3, SSOFT if hi else PAN, SIG if hi else LIN, 1.1))
        o.append(T(131 + j * 34, y2 + 14, b, "middle", 10, SIG if hi else INK, hi, True))
    return SVG(700, y2 + 32, o, "UUID の書き方と並べ方。(a) 16 ビットの UUID は、基準 UUID の xxxx の位置に番号を入れた 128 ビットの UUID の略記である。(b) PDU の中では、UUID を 128 ビットの整数としてリトルエンディアンで並べるので、文字で書いた順とバイトの順が逆になる。青は、製品の中で変えて使う部分（0002）。")
F["e18_uuid"] = _f18_uuid()

# ---- 4 節: 読む・書く・通知する ----
def _f18_disc():
    lanes = [("スマートフォン（クライアント）", PUR), ("TH-01（サーバ）", SIG)]
    msgs = [
        (0, 1, "Read By Group Type（0x0001〜0xFFFF、型 0x2800）", {"c": PUR, "sub": "10 01 00 FF FF 00 28"}),
        (1, 0, "0x0001〜0x0003 は 0x1800、0x0004〜0x0007 は 0x180F", {"c": SIG, "sub": "11 06 01 00 03 00 00 18 04 00 07 00 0F 18"}),
        (0, 1, "Read By Group Type（0x0008〜0xFFFF）", {"c": PUR, "sub": "10 08 00 FF FF 00 28"}),
        (1, 0, "0x0008〜0x000D は 5C3A0001-…", {"c": SIG, "sub": "11 14 08 00 0D 00 45 B8 … 01 00 3A 5C"}),
        (0, 1, "Read By Group Type（0x000E〜0xFFFF）", {"c": PUR, "sub": "10 0E 00 FF FF 00 28"}),
        (1, 0, "Error Response: Attribute Not Found → サービスは 3 つ", {"c": ALI, "sub": "01 10 0E 00 0A"}),
        ("span", 0, 6, "サービス\nの探索", {"c": PUR, "side": -1}),
        (0, 1, "Read By Type（0x0008〜0x000D、型 0x2803）", {"c": PUR, "sub": "08 08 00 0D 00 03 28"}),
        (1, 0, "宣言 0x0009: 32・値 0x000A・5C3A0002-…", {"c": SIG, "sub": "09 15 09 00 32 0A 00 45 B8 … 02 00 3A 5C"}),
        (0, 1, "Read By Type（0x000A〜0x000D）", {"c": PUR, "sub": "08 0A 00 0D 00 03 28"}),
        (1, 0, "宣言 0x000C: 0A・値 0x000D・5C3A0003-…", {"c": SIG, "sub": "09 15 0C 00 0A 0D 00 45 B8 … 03 00 3A 5C"}),
        (0, 1, "Read By Type（0x000D〜0x000D）", {"c": PUR, "sub": "08 0D 00 0D 00 03 28"}),
        (1, 0, "Error Response: Attribute Not Found", {"c": ALI, "sub": "01 08 0D 00 0A"}),
        ("span", 0, 6, "キャラクタ\nリスティック\nの探索", {"c": GLD, "side": -1}),
        (0, 1, "Find Information（0x000B〜0x000B）", {"c": PUR, "sub": "04 0B 00 0B 00"}),
        (1, 0, "0x000B は 0x2902（CCCD）", {"c": SIG, "sub": "05 01 0B 00 02 29"}),
        ("span", 0, 2, "記述子\nの探索", {"c": TEA, "side": -1}),
    ]
    s, h = seq(lanes, msgs, x=96, y=12, w=594, dy=30, label_sz=10)
    return SVG(700, h + 20, [s], "3 節の表の探索（ATT_MTU 23）。サービス、独自のサービスの中のキャラクタリスティック、温度の値の後ろの記述子の順に調べる。範囲の中に見つからないと Error Response（0x0A）が返り、そこで次へ進む。128 ビットの UUID の宣言は 1 つで 21 バイトの組なので、1 往復で 1 つずつしか集められない。")
F["e18_disc"] = _f18_disc()

def _f18_ops():
    o = []
    lanes = [("クライアント", PUR), ("サーバ", SIG)]
    P1 = [("Read（読む）", [(0, 1, "Read Request", {"c": PUR, "sub": "0A 0A 00"}), (1, 0, "Read Response", {"c": SIG, "sub": "0B 29 09"})]),
          ("Write（書いて結果を受け取る）", [(0, 1, "Write Request", {"c": PUR, "sub": "12 0D 00 0A 00"}), (1, 0, "Write Response", {"c": SIG, "sub": "13"})]),
          ("Write Command（書くだけ）", [(0, 1, "Write Command", {"c": PUR, "sub": "52 0D 00 0A 00"}), ("space", 18)])]
    P2 = [("Notification（通知）", [(1, 0, "Notification", {"c": SIG, "sub": "1B 0A 00 39 09"}), (1, 0, "Notification", {"c": SIG, "sub": "1B 0A 00 3E 09"}), (1, 0, "Notification", {"c": SIG, "sub": "1B 0A 00 42 09"})]),
          ("Indication（指示）と Confirmation（確認）", [(1, 0, "Indication", {"c": SIG, "sub": "1D 0A 00 39 09"}), (0, 1, "Confirmation", {"c": PUR, "sub": "1E"}), (1, 0, "次の Indication", {"c": SIG, "sub": "1D 0A 00 3E 09"})])]
    hmax = 0
    for i, (title, ms) in enumerate(P1):
        x = 8 + i * 230
        o.append(T(x + 112, 18, title, "middle", 10.5, INK, True))
        s, h = seq(lanes, ms, x=x, y=28, w=224, dy=32, label_sz=10)
        o.append(s); hmax = max(hmax, h)
    o.append(T(8 + 2 * 230 + 112, 28 + hmax - 26, "何も返らない", "middle", 9.5, MUT, halo=True))
    y2 = 28 + hmax + 30
    for i, (title, ms) in enumerate(P2):
        x = 8 + i * 345
        o.append(T(x + 170, y2 - 10, title, "middle", 10.5, INK, True))
        s, h = seq(lanes, ms, x=x, y=y2, w=338, dy=32, label_sz=10)
        o.append(s)
        h2 = h
    return SVG(700, y2 + h2 + 8, o, "読む・書く・通知の PDU（3 節の表の機器。温度 0x000A、測定の間隔 0x000D）。Write Command には応答が無く、クライアントは結果を知らない。通知は確認なしで続けて送れる。指示は、確認（0x1E）が届くまで次を送らない。温度の値 39 09・3E 09・42 09 は 23.61・23.66・23.70 °C。")
F["e18_ops"] = _f18_ops()

def _f18_ntfind():
    o = []
    for p, (x0, title, ind) in enumerate(((10, "通知", False), (360, "指示", True))):
        o.append(T(x0 + 10, 16, title + ("（Handle Value Indication）" if ind else "（Handle Value Notification）"), "start", 10.5, INK, True))
        for k, (nm, c) in enumerate((("サーバ（機器）", SIG), ("クライアント", PUR))):
            cx = x0 + 10 + k * 200
            o.append(T(cx + 65, 168, nm, "middle", 10, c, True))
            o.append(RECT(cx, 48, 130, 30, 5, PSOFT, PUR, 1.2)); o.append(T(cx + 65, 68, "ATT（ホスト）", "middle", 10, PUR, True))
            o.append(RECT(cx, 120, 130, 30, 5, SSOFT, SIG, 1.2)); o.append(T(cx + 65, 140, "リンク層", "middle", 10, SIG, True))
        sx, cx = x0 + 10, x0 + 210
        o.append(ARR(sx + 40, 78, sx + 40, 120, c=INK, lw=1.3, head=6))
        o.append(T(sx + 46, 102, "1D…" if ind else "1B…", "start", 9.5, INK, False, True))
        o.append(ARR(sx + 130, 130, cx, 130, c=INK, lw=1.4, head=6))
        o.append(T((sx + 130 + cx) / 2, 125, "パケット", "middle", 9.5, INK))
        o.append(ARR(cx, 144, sx + 130, 144, c=SIG, lw=1.2, head=5, dash="4 3"))
        o.append(T((sx + 130 + cx) / 2, 158, "NESN で確認", "middle", 9.5, SIG))
        o.append(ARR(cx + 40, 120, cx + 40, 78, c=INK, lw=1.3, head=6))
        if ind:
            o.append(W(cx + 100, 48, cx + 100, 36, sx + 100, 36, sx + 100, 42, c=ALI, lw=1.5))
            o.append(ARR(sx + 100, 40, sx + 100, 47, c=ALI, lw=1.5, head=6))
            o.append(T((sx + cx) / 2 + 100, 31, "確認（1E）", "middle", 9.5, ALI, True, halo=True))
            o.append(T((sx + cx) / 2 + 65, 196, "確認が、相手の ATT まで届いたことを知らせる", "middle", 9.5, ALI, True))
            o.append(T((sx + cx) / 2 + 65, 212, "確認が来るまで、次の指示は送れない", "middle", 9.5, INK))
        else:
            o.append(T((sx + cx) / 2 + 65, 196, "ATT の確認は無い。リンク層が届くまで送り直す", "middle", 9.5, INK))
            o.append(T((sx + cx) / 2 + 65, 212, "続けていくつでも送れる", "middle", 9.5, INK))
    o.append(T(350, 238, "どちらも、接続が切れたり、送る側の送信の列がいっぱいで送れなかったりすれば、相手に届かない（7 節）。", "middle", 9.5, MUT))
    return SVG(700, 246, o, "通知と指示の比べ方。リンク層は、どちらのパケットも 1 節の SN・NESN で確かめて送り直す。指示ではさらに、相手の ATT（ホストの層）が受け取ったときに確認（Handle Value Confirmation）を返すので、サーバは相手のアプリケーションの層まで届いたことを知る。")
F["e18_ntfind"] = _f18_ntfind()

# ---- 5 節: MTU ----
def _f18_mtu():
    o = []
    rows = [("ATT_MTU 23（既定）", "通知・書き込み", [("L2CAP", "4", GRN, 80), ("オペコード", "1", PUR, 74), ("ハンドル", "2", PUR, 70), ("値", "20", SIG, 150)], "リンク層のペイロード 27 バイト（既定の上限）"),
            ("ATT_MTU 23（既定）", "Read Response", [("L2CAP", "4", GRN, 80), ("オペコード", "1", PUR, 74), ("値", "22", SIG, 220)], "27 バイト"),
            ("ATT_MTU 247", "通知・書き込み", [("L2CAP", "4", GRN, 80), ("オペコード", "1", PUR, 74), ("ハンドル", "2", PUR, 70), ("値", "244", SIG, 300)], "251 バイト（リンク層を広げたときの上限。19 章）")]
    y = 26
    for title, op, fs, right in rows:
        o.append(T(14, y + 13, title, "start", 10, INK, True))
        o.append(T(14, y + 27, op, "start", 9.5, MUT))
        x = 150
        for nm, nb, c, w in fs:
            o.append(RECT(x, y, w, 30, 3, soft(c), c, 1.2))
            o.append(T(x + w / 2, y + 19, "%s %s" % (nm, nb), "middle", 10, c, True))
            x += w
        xe = x
        o.append(DIM(150 + 80, y + 40, xe, y + 40, None, c=PUR))
        mt = sum(int(f[1]) for f in fs[1:])
        o.append(T((230 + xe) / 2, y + 54, "ATT の PDU %d バイト（≦ ATT_MTU）" % mt, "middle", 9.5, PUR))
        o.append(T(xe + 8, y + 19, right if len(right) < 12 else "", "start", 9.5, MUT))
        if len(right) >= 12:
            o.append(T(xe - (xe - 150) / 2, y - 6, right, "middle", 9.5, MUT))
        y += 86
    o.append(T(14, y - 8, "（箱の幅はバイト数に比例していない）", "start", 9.5, MUT))
    return SVG(700, y, o, "ATT_MTU と、1 つの PDU で運べる値の長さ。値に使えるのは、ATT_MTU からオペコード（1）と値の前のパラメータ（通知・書き込みならハンドルの 2）を引いた残りである。既定の 23 に L2CAP のヘッダ 4 バイトを足すと 27 バイトで、既定のリンク層のペイロードにちょうど入る。")
F["e18_mtu"] = _f18_mtu()

def _f18_mtuex():
    lanes = [("クライアント", PUR), ("サーバ", SIG)]
    msgs = [(0, 1, "Exchange MTU Request（受け取れる大きさ 247）", {"c": PUR, "sub": "02 F7 00"}),
            (1, 0, "Exchange MTU Response（受け取れる大きさ 100）", {"c": SIG, "sub": "03 64 00"}),
            ("note", 0, "ATT_MTU = 小さいほうの 100", {"c": TEA}),
            ("note", 1, "通知の値は 97 バイトまで", {"c": TEA})]
    return SEQFIG(lanes, msgs, "MTU の交換（値は例）。クライアントとサーバが、それぞれ受け取れる大きさをリトルエンディアンの 2 バイトで知らせ、2 台とも小さいほうを ATT_MTU として使う。交換は 1 つの接続で 1 回だけ。", w=620, dy=34)
F["e18_mtuex"] = _f18_mtuex()

def _f18_long():
    o = []
    lanes = [("クライアント", PUR), ("サーバ", SIG)]
    A = [(0, 1, "Read Request", {"c": PUR, "sub": "0A 30 00"}),
         (1, 0, "Read Response（0〜21）", {"c": SIG, "sub": "0B + 22 バイト"}),
         (0, 1, "Read Blob Request（22 から）", {"c": PUR, "sub": "0C 30 00 16 00"}),
         (1, 0, "Read Blob Response（22〜43）", {"c": SIG, "sub": "0D + 22 バイト"}),
         (0, 1, "Read Blob Request（44 から）", {"c": PUR, "sub": "0C 30 00 2C 00"}),
         (1, 0, "Read Blob Response（44〜49）", {"c": SIG, "sub": "0D + 6 バイト"}),
         ("note", 0, "22 バイトより短い → 終わり", {"c": TEA})]
    B = [(0, 1, "Prepare Write（0〜17）", {"c": PUR, "sub": "16 30 00 00 00 + 18 バイト"}),
         (1, 0, "同じ内容を返す", {"c": SIG, "sub": "17 30 00 00 00 + 18 バイト"}),
         (0, 1, "Prepare Write（18〜35）", {"c": PUR, "sub": "16 30 00 12 00 + 18 バイト"}),
         (1, 0, "同じ内容を返す", {"c": SIG, "sub": "17 …"}),
         (0, 1, "Prepare Write（36〜49）", {"c": PUR, "sub": "16 30 00 24 00 + 14 バイト"}),
         (1, 0, "同じ内容を返す", {"c": SIG, "sub": "17 …"}),
         (0, 1, "Execute Write（書く）", {"c": PUR, "sub": "18 01"}),
         (1, 0, "Execute Write Response", {"c": SIG, "sub": "19"})]
    o.append(T(192, 18, "(a) 50 バイトの値を読む", "middle", 10.5, INK, True))
    o.append(T(539, 18, "(b) 50 バイトの値を書く", "middle", 10.5, INK, True))
    s1, h1 = seq(lanes, A, x=6, y=28, w=372, dy=30, label_sz=10)
    s2, h2 = seq(lanes, B, x=384, y=28, w=310, dy=30, label_sz=10)
    o += [s1, s2]
    return SVG(700, 28 + max(h1, h2) + 8, o, "ATT_MTU 23 で、50 バイトの値（ハンドルを 0x0030 とする）を読み書きする。(a) Read Response に入るのは 22 バイトなので、Read Blob でオフセットを進めて続きを読み、22 バイトより短い応答で終わる。(b) Prepare Write で 18 バイトずつ預け、返ってきた内容を確かめてから、Execute Write でまとめて書かせる。")
F["e18_long"] = _f18_long()

# ---- 6 節: 設計 ----
def _f18_design():
    o = []
    svcs = [("Generic Access（0x1800。スタックが用意）", PUR, [("機器の名前", "0x2A00", "R", "文字列 \"TH-01\"", "")]),
            ("Device Information（0x180A）", PUR, [("製造者名", "0x2A29", "R", "文字列", ""), ("ファームウェアの版", "0x2A26", "R", "文字列 \"1.2.0\"", "")]),
            ("Battery Service（0x180F）", PUR, [("電池の残り", "0x2A19", "R N", "uint8（%）", "")]),
            ("測定（独自。5C3A0001-…）", SIG, [("温度", "5C3A0002-…", "R N I", "sint16（0.01 °C）", ""),
                                            ("測定の間隔", "5C3A0003-…", "R W", "uint16（s）", "書くには暗号化"),
                                            ("コントロールポイント", "5C3A0004-…", "W I", "命令 1 + パラメータ", "書くには認証"),
                                            ("形の版", "5C3A0005-…", "R", "uint8（いまは 1）", "")]),
            ("Generic Attribute（0x1801）", PUR, [("Service Changed", "0x2A05", "I", "変わったハンドルの範囲", "")])]
    hx = [(30, "キャラクタリスティック"), (196, "UUID"), (326, "プロパティ"), (420, "値の形"), (566, "パーミッション")]
    for x, t in hx:
        o.append(T(x, 18, t, "start", 9.5, MUT, True))
    y = 26
    for name, c, chars in svcs:
        o.append(RECT(14, y, 672, 22, 4, soft(c), c, 1.2))
        o.append(T(22, y + 15, name, "start", 10, c, True))
        y += 24
        for nm, u, pr, fm, pm in chars:
            o.append(RECT(14, y, 672, 20, 3, PAN, LIN, 0.8))
            o.append(T(30, y + 14, nm, "start", 10, INK))
            o.append(T(196, y + 14, u, "start", 9.5, INK, False, True))
            xx = 326
            for p in pr.split():
                cc = {"R": SIG, "N": GRN, "I": ALI, "W": GLD}[p]
                s, w = CHIP(xx, y + 14, p, cc, 9, pad=4, mono=True); o.append(s); xx += w + 4
            o.append(T(420, y + 14, fm, "start", 9.5, INK))
            if pm:
                o.append(T(566, y + 14, pm, "start", 9.5, ALI))
            y += 22
        y += 4
    o.append(T(14, y + 14, "R = Read、W = Write、N = Notify、I = Indicate。値はどれもリトルエンディアン。UUID の 5C3A0001-… は例として乱数で作ったもの。", "start", 9.5, MUT))
    return SVG(700, y + 24, o, "TH-01 の GATT の設計の例。標準のサービス（機器の情報・電池）と、独自の測定のサービスに分けた。設定の値とコントロールポイントの書き込みには、暗号化や認証を求める。表が変わったことは Service Changed の指示で知らせる。")
F["e18_design"] = _f18_design()

def _f18_format():
    o = []
    o.append(T(14, 18, "悪い例", "start", 11, ALI, True))
    o.append(T(360, 18, "良い例", "start", 11, GRN, True))
    rows_bad = [("文字で送る \"23.45\"", "32 33 2E 34 35", "5 バイト。桁数で長さが変わり、受け手は文字を解析する"),
                ("JSON で送る {\"t\":23.45,\"h\":41.25}", "7B 22 74 22 3A … 35 7D", "21 バイト。ATT_MTU 23 の通知（20 バイト）に入らない")]
    rows_good = [("0.01 °C 単位の sint16", "29 09", "2 バイト。読むのは 2 バイトの整数だけ"),
                 ("温度 sint16 と湿度 uint16（0.01 %）を決まった順に", "29 09 1D 10", "4 バイト。湿度 41.25 % は 4125 = 0x101D")]
    for x0, rows, c in ((14, rows_bad, ALI), (360, rows_good, GRN)):
        y = 30
        for title, hx, note in rows:
            o.append(RECT(x0, y, 326, 72, 6, soft(c), c, 1.1))
            o.append(T(x0 + 10, y + 18, title, "start", 10, INK, True))
            _f18_hexbox(o, x0 + 10, y + 26, hx, c, 10, fill=PAN)
            o.append(T(x0 + 10, y + 64, note, "start", 9.5, c))
            y += 82
    return SVG(700, 30 + 2 * 82 + 4, o, "値の形の比べ方。文字や JSON は長く、桁数で長さが変わり、受け手に文字の解析が要る。03 章 6 節の固定小数点にしてリトルエンディアンで並べると、温度は 2 バイト、温度と湿度を合わせても 4 バイトで、ATT_MTU 23 のままでも通知に収まる。")
F["e18_format"] = _f18_format()

def _f18_ctrl():
    lanes = [("スマートフォン", PUR), ("TH-01", SIG), ("AP", GLD)]
    msgs = [(0, 1, "CCCD に 02 00（指示を有効に）", {"c": PUR}),
            (1, 0, "Write Response", {"c": SIG}),
            (0, 1, "01 + SSID（命令 1: SSID を設定）", {"c": PUR, "sub": "01 4D 79 … 46 69（\"MyHomeWiFi\"）"}),
            (1, 0, "Write Response", {"c": SIG}),
            (0, 1, "02 + パスフレーズ（命令 2）", {"c": PUR, "sub": "長いので、長い書き込みか MTU の交換"}),
            (1, 0, "Write Response", {"c": SIG}),
            (0, 1, "03（命令 3: 接続を試せ）", {"c": PUR}),
            (1, 0, "Write Response（受け付けた）", {"c": SIG}),
            (1, 2, "接続（09 章 3 節）", {"c": SIG}),
            (2, 1, "つながった", {"c": GLD}),
            (1, 0, "Indication: 03 00（命令 3・成功）", {"c": SIG, "sub": "失敗なら 03 01 など"}),
            (0, 1, "Confirmation", {"c": PUR})]
    return SEQFIG(lanes, msgs, "コントロールポイントで Wi-Fi のプロビジョニング（09 章 6 節）を行う例（命令の番号と結果の形は、この章で決めた例）。命令は Write Request で受け付けたことを返し、時間のかかる結果は、あとで指示で返す。結果に命令の番号を入れておけば、どの命令の結果かが分かる。", w=700, dy=32)
F["e18_ctrl"] = _f18_ctrl()

# ---- 7 節: 実装 ----
def _f18_impl():
    o = []
    o.append(RECT(14, 30, 316, 236, 10, PSOFT, PUR, 1.4))
    o.append(T(24, 48, "アプリケーション", "start", 11, PUR, True))
    o.append(BOX(30, 60, 120, 40, "測定タスク", None, PUR, PAN, INK, sz=10.5))
    o.append(BOX(168, 62, 146, 36, "値の列", "リングバッファ", TEA, PAN, INK, sz=10, ssz=9))
    o.append(ARR(150, 80, 168, 80, c=MUT, lw=1.3, head=5))
    o.append(BOX(30, 128, 284, 54, "通信タスク", "イベントループ。イベントを 1 つずつ処理する", PUR, PAN, INK, sz=10.5, ssz=9.5))
    o.append(ARR(241, 98, 241, 128, c=MUT, lw=1.3, head=5))
    o.append(BOX(30, 214, 284, 32, "イベントのキュー", None, TEA, PAN, INK, sz=10))
    o.append(ARR(172, 214, 172, 184, c=MUT, lw=1.3, head=5))
    o.append(RECT(400, 30, 286, 236, 10, GSOFT, GRN, 1.4))
    o.append(T(410, 48, "BLE のスタック（ホスト）", "start", 11, GRN, True))
    o.append(BOX(416, 58, 254, 34, "属性の表", "アプリケーションが静的に定義して登録", PUR, PAN, INK, sz=10, ssz=9))
    o.append(BOX(416, 102, 254, 40, "ATT・GATT のサーバ", "探索・読み書き・MTU の交換に答える", GRN, PAN, INK, sz=10, ssz=9))
    o.append(BOX(416, 152, 254, 34, "送信の列", "接続イベントで送るまで置く（数個〜）", GRN, PAN, INK, sz=10, ssz=9))
    o.append(BOX(416, 196, 254, 30, "L2CAP", None, GRN, PAN, INK, sz=10))
    o.append(BOX(416, 236, 254, 22, "HCI の先のコントローラ（リンク層）", None, SIG, SSOFT, INK, sz=9.5))
    # 矢印
    o.append(ARR(416, 122, 316, 150, c=GRN, lw=1.4, head=6, dash="5 3"))
    o.append(T(366, 122, "読まれた・", "middle", 9.5, GRN, halo=True))
    o.append(T(366, 135, "書かれた", "middle", 9.5, GRN, halo=True))
    o.append(ARR(314, 170, 416, 170, c=PUR, lw=1.5, head=6))
    o.append(T(365, 164, "通知を送る", "middle", 9.5, PUR, halo=True))
    o.append(ARR(400, 236, 316, 236, c=GRN, lw=1.4, head=6, dash="5 3"))
    o.append(T(358, 212, "接続・切断・", "middle", 9.5, GRN, halo=True))
    o.append(T(358, 225, "CCCD・MTU・", "middle", 9.5, GRN, halo=True))
    o.append(T(358, 254, "送り終えた", "middle", 9.5, GRN, halo=True))
    o.append(T(14, 284, "実線: アプリケーションがスタックの関数を呼ぶ。破線: スタックがコールバックで知らせる（キューに入れるだけにする）。", "start", 9.5, MUT))
    return SVG(700, 294, o, "実装の構成。属性の表は静的に定義して起動時に登録する。探索・読み書き・MTU の交換への応答と、リンク層への送り出しはスタックが受け持つ。アプリケーションは、コールバックで受けた出来事を通信タスクのイベントループで処理し、値が変わったら通知を送る。")
F["e18_impl"] = _f18_impl()

def _f18_txq():
    o = []
    X = lambda t: 150 + t * 50
    panels = [(28, "悪い例: BLE_BUSY が返った値を捨てる", False), (178, "良い例: 値を残し、「送り終えた」の知らせで続きを送る", True)]
    ev = [(4.6, "接続イベント 1"), (9.2, "接続イベント 2")]
    for y0, title, good in panels:
        c = GRN if good else ALI
        o.append(T(14, y0, title, "start", 10.5, c, True))
        ry = [y0 + 24, y0 + 62, y0 + 100]
        for lab, y in zip(("測定の値", "送信の列（3 つ）", "相手に届いた"), ry):
            o.append(T(14, y + 4, lab, "start", 9.5, MUT))
            o.append(W(X(0) - 10, y, 690, y, c=GRD, lw=1))
        for t, nm in ev:
            o.append(W(X(t), y0 + 12, X(t), ry[2] + 12, c=TEA, lw=1.2, dash="4 3"))
            o.append(T(X(t), y0 + 128, nm, "middle", 9.5, TEA))
        for i in range(6):
            x = X(i * 0.7)
            o.append(CIRC(x, ry[0], 8, SIG, 1.2, SSOFT)); o.append(T(x, ry[0] + 4, str(i + 1), "middle", 9.5, SIG, True))
            if i < 3:
                o.append(RECT(x - 8, ry[1] - 8, 16, 16, 3, GSOFT, GRN, 1.1)); o.append(T(x, ry[1] + 4, str(i + 1), "middle", 9.5, GRN, True))
                o.append(ARR(x, ry[0] + 9, x, ry[1] - 9, c=MUT, lw=1, head=4))
            elif not good:
                o.append(W(x - 6, ry[1] - 6, x + 6, ry[1] + 6, c=ALI, lw=2) + W(x - 6, ry[1] + 6, x + 6, ry[1] - 6, c=ALI, lw=2))
            else:
                o.append(RECT(x - 8, ry[1] - 8, 16, 16, 3, GOSOFT, GLD, 1.1, dash="3 2")); o.append(T(x, ry[1] + 4, str(i + 1), "middle", 9.5, GLD, True))
        if not good:
            o.append(T(X(2.1) + 14, ry[1] + 22, "BUSY → 4・5・6 を捨てた", "start", 9.5, ALI, True))
        else:
            o.append(T(X(2.1) + 14, ry[1] + 22, "BUSY → 残して待つ", "start", 9.5, GLD, True))
            for k in range(3):
                x = X(5.2 + k * 0.7)
                o.append(RECT(x - 8, ry[1] - 8, 16, 16, 3, GSOFT, GRN, 1.1)); o.append(T(x, ry[1] + 4, str(k + 4), "middle", 9.5, GRN, True))
            o.append(T(X(5.0), ry[1] - 14, "送り終えた → 続きを置く", "start", 9.5, GRN))
        for k in range(3):
            x = X(4.6) + 14 + k * 20
            o.append(RECT(x - 8, ry[2] - 8, 16, 16, 3, SSOFT, SIG, 1.1)); o.append(T(x, ry[2] + 4, str(k + 1), "middle", 9.5, SIG, True))
            if good:
                x2 = X(9.2) + 14 + k * 20
                o.append(RECT(x2 - 8, ry[2] - 8, 16, 16, 3, SSOFT, SIG, 1.1)); o.append(T(x2, ry[2] + 4, str(k + 4), "middle", 9.5, SIG, True))
        if not good:
            o.append(T(X(9.2) - 10, ry[2] + 4, "4・5・6 は届かない", "end", 9.5, ALI, True))
    return SVG(700, 318, o, "送信の列がいっぱいのときの扱い。測定の値 1〜6 が、接続イベントの前に続けてできた場合。列に置けるのは 3 つまでなので、4 つ目からは BLE_BUSY が返る。悪い例では値を捨ててしまう。良い例では値を残しておき、接続イベントで送り終えたという知らせを受けてから列に置くので、次の接続イベントで届く。")
F["e18_txq"] = _f18_txq()
