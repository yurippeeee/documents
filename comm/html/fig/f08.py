# -*- coding: utf-8 -*-
# 08 章 ネットワークに参加する の図
# アドレスは文書の例のための範囲（IPv4: RFC 5737、IPv6: RFC 3849、MAC: RFC 7042）を使う。

def _f08_ip(s):
    return [int(x) for x in s.split(".")]

def _f08_bits(s):
    """'192.168.1.23' → 32 文字の 0/1"""
    return "".join(format(v, "08b") for v in _f08_ip(s))

def _f08_dev(x, y, w, h, name, addr, c, sub=None, sz=11.5):
    """機器の箱（名前と、その下にアドレス）。"""
    o = [RECT(x, y, w, h, 8, soft(c), c, 1.4)]
    lines = [addr] + ([sub] if sub else [])
    tot = sz * 1.2 + len(lines) * 13
    yy = y + h / 2 - tot / 2 + sz * 0.9
    o.append(T(x + w / 2, yy, name, "middle", sz, c, True))
    for i, l in enumerate(lines):
        o.append(T(x + w / 2, yy + 15 + i * 13, l, "middle", 9.5, INK if i == 0 else MUT, False, i == 0))
    return "".join(o)

# ---- 1 節: 同じネットワークの中と外 ----
def _f08_lan():
    o = []
    # 家庭のネットワーク
    o.append(RECT(10, 26, 404, 214, 12, "none", MUT, 1.2, dash="5 4"))
    o.append(T(22, 44, "家庭のネットワーク", "start", 10.5, MUT, True))
    o.append(_f08_dev(28, 62, 132, 52, "機器", "192.168.1.23", SIG))
    o.append(_f08_dev(28, 168, 132, 52, "PC", "192.168.1.40", PUR))
    # リンク（同じ Wi-Fi・Ethernet）
    xb = 214
    o.append(W(xb, 58, xb, 226, c=SIG, lw=3))
    o.append(W(160, 88, xb, 88, c=SIG, lw=1.6))
    o.append(W(160, 194, xb, 194, c=SIG, lw=1.6))
    o.append(W(xb, 140, 270, 140, c=SIG, lw=1.6))
    o.append(T(xb - 6, 232, "1 つのリンク（Wi-Fi・Ethernet）", "middle", 9.5, SIG))
    # ルータ
    o.append(RECT(270, 104, 132, 74, 8, GOSOFT, GLD, 1.6))
    o.append(T(336, 124, "ルータ", "middle", 11.5, GLD, True))
    o.append(T(336, 141, "192.168.1.1", "middle", 9.5, INK, False, True))
    o.append(T(336, 156, "外へ運ぶ（07 章 3 節）", "middle", 9, MUT))
    # インターネットとサーバ
    o.append(RECT(440, 100, 100, 82, 18, GOSOFT, GLD, 1.3))
    o.append(T(490, 145, "インターネット", "middle", 10.5, GLD, True))
    o.append(W(402, 141, 440, 141, c=GLD, lw=2))
    o.append(W(540, 141, 566, 141, c=GLD, lw=2))
    o.append(_f08_dev(566, 112, 124, 58, "サーバ", "203.0.113.10", GRN))
    # 経路の矢印
    o.append(CARR(96, 116, 96, 166, 0.35, c=SIG, lw=2.2))
    o.append(T(40, 146, "①", "middle", 12, SIG, True))
    o.append(PATH("M160,72 C240,52 300,60 330,102", c=GLD, lw=2.2))
    o.append(ARR(326, 97, 333, 104, c=GLD, lw=2.2))
    o.append(PATH("M402,116 C470,70 560,70 610,110", c=GLD, lw=2.2, dash="6 4"))
    o.append(ARR(606, 105, 613, 112, c=GLD, lw=2.2))
    o.append(T(258, 52, "②", "middle", 12, GLD, True))
    yl = 262
    o.append(T(18, yl, "① 宛先が同じリンクにいる（PC）: フレームを宛先に直接届ける。", "start", 10.5, SIG))
    o.append(T(18, yl + 18, "② 宛先が外にいる（サーバ）: フレームをルータに渡し、ルータが IP の宛先を見てその先へ運ぶ。", "start", 10.5, GLD))
    return SVG(700, yl + 30, o, "家庭のネットワークの例。リンク層のフレームは同じリンクにつながった機器の間でしか届かないので、機器は宛先ごとに、直接届けるか（①）、ルータに渡すか（②）を決める。アドレスは文書の例のための範囲（RFC 5737）のもの。")
F["e08_lan"] = _f08_lan()

def _f08_and():
    o = []
    cw = 6.9                     # 等幅 11.5 px の 1 文字の幅
    xb, og = 196, 8              # ビットの始まり、8 ビットごとの隙間
    def bx(i):                   # 第 i ビット（0 = 最上位）の中心の x
        return xb + i * cw + (i // 8) * og + cw / 2
    xr = bx(31) + cw / 2 + 14    # 結果の 10 進の位置
    def row(y, label, bits, n, kind):
        s = []
        lc = {"addr": INK, "mask": GLD, "res": SIG}[kind]
        s.append(T(xb - 12, y, label, "end", 10.5, lc, kind != "addr"))
        for i, ch in enumerate(bits):
            if kind == "mask":
                c = GLD if ch == "1" else FNT
            elif kind == "res":
                c = SIG if i < n else FNT
            else:
                c = INK if i < n else MUT
            s.append(T(bx(i), y, ch, "middle", 11.5, c, kind == "res" and i < n, True))
        return "".join(s)
    def dec(bits):
        return ".".join(str(int(bits[k:k + 8], 2)) for k in range(0, 32, 8))
    def andb(a, m):
        return "".join("1" if (x == "1" and y == "1") else "0" for x, y in zip(a, m))
    def block(y0, n, items):
        """items = [(ラベル, アドレス, 判定 or None)]。返り値 (svg, 次の y)"""
        s = []
        mbits = "1" * n + "0" * (32 - n)
        rows = 1 + 2 * len(items)
        rh = 17
        top = y0 + 8
        # ネットワーク部の帯
        s.append(RECT(bx(0) - cw / 2 - 3, top, bx(n - 1) - bx(0) + cw + 6, rows * rh + 6, 4, GOSOFT, "none", 0))
        s.append(T(bx(0) - cw / 2, y0, "ネットワーク部（上位 %d ビット）" % n, "start", 9.5, GLD, True))
        y = top + 15
        s.append(row(y, "マスク /%d" % n, mbits, n, "mask"))
        s.append(T(xr, y, dec(mbits), "start", 10.5, GLD, False, True))
        ref = None
        for lab, a, verdict in items:
            y += rh
            ab = _f08_bits(a)
            s.append(W(xb - 120, y - 13, bx(31) + 8, y - 13, c=LIN, lw=1))
            s.append(row(y, "%s %s" % (lab, a), ab, n, "addr"))
            y += rh
            r = andb(ab, mbits)
            s.append(row(y, "AND マスク", r, n, "res"))
            s.append(T(xr, y, dec(r), "start", 10.5, SIG, True, True))
            if ref is None:
                ref = r
            if verdict:
                same = (r == ref)
                s.append(T(xr + 96, y, verdict, "start", 10.5, GRN if same else ALI, True))
        return "".join(s), y + 22
    s1, y = block(20, 24, [("自分", "192.168.1.23", None), ("PC", "192.168.1.40", "自分と同じ → 中"), ("サーバ", "203.0.113.10", "違う → 外")])
    o.append(s1)
    s2, y = block(y + 6, 26, [("自分", "192.168.1.23", None), ("宛先", "192.168.1.100", "違う → 外")])
    o.append(s2)
    return SVG(700, y - 4, o, "アドレスとマスクのビットごとの AND（筆算の形）。金の帯がネットワーク部で、AND をとるとネットワーク部だけが残り、残りのビットは 0 になる。結果が自分と等しければ同じサブネット（中）、違えば外。下の段のように、同じアドレスでもマスクが /26 なら 192.168.1.100 は外になる。")
F["e08_and"] = _f08_and()

# ---- 2 節: ARP ----
def _f08_arp_seq():
    o = []
    xs = [110, 350, 590]
    heads = [("機器", "192.168.1.23", "00:00:5E:00:53:23", SIG), ("PC", "192.168.1.40", "00:00:5E:00:53:40", PUR),
             ("ルータ", "192.168.1.1", "00:00:5E:00:53:01", GLD)]
    for x, (nm, ip_, mac, c) in zip(xs, heads):
        o.append(RECT(x - 82, 10, 164, 52, 8, soft(c), c, 1.3))
        o.append(T(x, 28, nm, "middle", 11.5, c, True))
        o.append(T(x, 42, ip_, "middle", 9.5, INK, False, True))
        o.append(T(x, 55, mac, "middle", 9, MUT, False, True))
        o.append(W(x, 62, x, 330, c=c, lw=1.2, dash="3 4"))
    # ① 要求（ブロードキャスト）
    y1 = 100
    o.append(W(xs[0], y1, xs[2] - 5, y1, c=SIG, lw=1.8))
    o.append(ARR(xs[1] - 30, y1, xs[1] - 1, y1, c=SIG, lw=1.8))
    o.append(ARR(xs[2] - 30, y1, xs[2] - 1, y1, c=SIG, lw=1.8))
    o.append(T((xs[0] + xs[1]) / 2, y1 - 20, "① ARP の要求（ブロードキャスト）", "middle", 10.5, SIG, True))
    o.append(T((xs[0] + xs[1]) / 2, y1 - 6, "「192.168.1.1 の MAC アドレスは？」", "middle", 10, INK))
    o.append(T((xs[0] + xs[1]) / 2, y1 + 15, "宛先 MAC = FF:FF:FF:FF:FF:FF（全員）", "middle", 9.5, MUT, False, True))
    # 受け取った側の判断
    o.append(RECT(xs[1] - 70, y1 + 26, 140, 22, 5, MSOFT, MUT, 1))
    o.append(T(xs[1], y1 + 41, "自分ではない → 捨てる", "middle", 9.5, MUT))
    o.append(RECT(xs[2] - 96, y1 + 26, 192, 36, 5, GOSOFT, GLD, 1))
    o.append(T(xs[2], y1 + 41, "自分のアドレス → 答える", "middle", 9.5, GLD))
    o.append(T(xs[2], y1 + 55, "機器の IP と MAC の組を覚える", "middle", 9.5, GLD))
    # ② 応答
    y2 = 196
    o.append(ARR(xs[2], y2, xs[0] + 1, y2, c=GLD, lw=1.8))
    o.append(T((xs[0] + xs[2]) / 2, y2 - 20, "② ARP の応答（機器だけに）", "middle", 10.5, GLD, True))
    o.append(T((xs[0] + xs[2]) / 2, y2 - 6, "「192.168.1.1 は 00:00:5E:00:53:01」", "middle", 10, INK))
    o.append(T((xs[0] + xs[2]) / 2, y2 + 15, "宛先 MAC = 00:00:5E:00:53:23", "middle", 9.5, MUT, False, True))
    # ③ キャッシュ
    o.append(RECT(xs[0] - 92, 222, 184, 36, 5, SSOFT, SIG, 1))
    o.append(T(xs[0], 237, "③ ARP キャッシュに記録する", "middle", 9.5, SIG, True))
    o.append(T(xs[0], 251, "期限が切れるまで問い合わせない", "middle", 9.5, SIG))
    # ④ 本来のデータ
    y4 = 300
    o.append(ARR(xs[0], y4, xs[2] - 1, y4, c=INK, lw=1.8))
    o.append(T((xs[0] + xs[2]) / 2, y4 - 6, "④ IP パケットを入れたフレーム（宛先 MAC = ルータの 00:00:5E:00:53:01）", "middle", 10, INK))
    return SVG(700, 338, o, "ARP でデフォルトゲートウェイ（ルータ）の MAC アドレスを知る手順。要求はリンクの全員に届くが、答えるのは尋ねられた IP アドレスを持つ機器だけである。得た組は ARP キャッシュに記録し、期限が切れるまで使う。")
F["e08_arp_seq"] = _f08_arp_seq()

def _f08_arp_bytes():
    o = []
    u = 33
    x0 = 20
    o.append(T(x0, 18, "Ethernet のヘッダ（14 バイト。07 章 2 節）", "start", 11, SIG, True))
    s, h = BYTES(x0, 26, [("宛先 MAC", 6, SIG, "FF FF FF FF FF FF"), ("送信元 MAC", 6, SIG, "00 00 5E 00 53 23"),
                          ("種類", 2, GLD, "08 06")], unit=u, h=36, sz=10)
    o.append(s)
    o.append(T(x0 + 14 * u + 10, 50, "← 0x0806 = ARP", "start", 10, GLD))
    y = 26 + h + 14
    o.append(T(x0, y, "ARP の要求（28 バイト）", "start", 11, PUR, True))
    s, h = BYTES(x0, y + 8, [("HW の種類", 2, MUT, "00 01"), ("プロトコル", 2, MUT, "08 00"), ("MAC 長", 1, MUT, "06"),
                             ("IP 長", 1, MUT, "04"), ("操作", 2, PUR, "00 01")], unit=u, h=36, sz=9.5)
    o.append(s)
    ya = y + 8 + 36 + 28
    for xx, t in ((x0 + u, "1 = Ethernet"), (x0 + 3 * u, "0x0800 = IPv4"), (x0 + 4.5 * u, "6"), (x0 + 5.5 * u, "4"), (x0 + 7 * u, "1 = 要求")):
        o.append(T(xx, ya, t, "middle", 9.5, MUT))
    o.append(T(x0 + 8 * u + 12, y + 30, "← 応答では 2", "start", 10, PUR))
    y2 = ya + 14
    s, h = BYTES(x0, y2, [("送信元 MAC", 6, SIG, "00 00 5E 00 53 23"), ("送信元 IP", 4, SIG, "C0 A8 01 17"),
                          ("宛先 MAC", 6, ALI, "00 00 00 00 00 00"), ("宛先 IP", 4, GLD, "C0 A8 01 01")], unit=u, h=36, sz=10)
    o.append(s)
    yb = y2 + 36 + 28
    for xx, t, c in ((x0 + 3 * u, "機器の MAC アドレス", MUT), (x0 + 8 * u, "192.168.1.23", MUT),
                     (x0 + 13 * u, "知らないので 0", ALI), (x0 + 18 * u, "192.168.1.1（尋ねる相手）", GLD)):
        o.append(T(xx, yb, t, "middle", 9.5, c))
    yn = yb + 24
    o.append(T(x0, yn, "応答では、ルータが送信元に自分の MAC アドレスと IP アドレスを、宛先に機器の組を入れて返す。", "start", 10, INK))
    o.append(T(x0, yn + 16, "Ethernet のデータは最低 46 バイトなので、28 バイトの後ろを 18 バイトの 0 で埋めて送る。", "start", 10, MUT))
    return SVG(700, yn + 28, o, "ARP の要求のバイト列（機器 192.168.1.23 が 192.168.1.1 の MAC アドレスを尋ねる例）。16 ビットの値はビッグエンディアンで並ぶ。宛先の MAC アドレスの欄は、まだ知らないので 0 にしておく。")
F["e08_arp_bytes"] = _f08_arp_bytes()

def _f08_frame(x, y, fields, h=30):
    """フレームの欄を横に並べる。fields = [(幅, 上の文字, 下の文字, 色)]"""
    o = []
    xx = x
    for w, top, val, c in fields:
        o.append(RECT(xx, y, w, h, 3, soft(c), c, 1.2))
        o.append(T(xx + w / 2, y + 12, top, "middle", 9, c, True))
        o.append(T(xx + w / 2, y + 25, val, "middle", 9, INK, False, True))
        xx += w
    return "".join(o)

def _f08_arp_mac():
    o = []
    x0 = 20
    rows = [("(a) 同じサブネットの PC へ", "ARP で聞く相手: 192.168.1.40（宛先そのもの）", GRN,
             [(122, "宛先 MAC", "00:00:5E:00:53:40", SIG), (122, "送信元 MAC", "00:00:5E:00:53:23", SIG), (44, "種類", "08 00", GLD),
              (116, "送信元 IP", "192.168.1.23", GLD), (116, "宛先 IP", "192.168.1.40", GLD), (90, "データ", "…", PUR)], "○"),
            ("(b) 外のサーバへ（正しい）", "ARP で聞く相手: 192.168.1.1（デフォルトゲートウェイ）", GRN,
             [(122, "宛先 MAC", "00:00:5E:00:53:01", SIG), (122, "送信元 MAC", "00:00:5E:00:53:23", SIG), (44, "種類", "08 00", GLD),
              (116, "送信元 IP", "192.168.1.23", GLD), (116, "宛先 IP", "203.0.113.10", GLD), (90, "データ", "…", PUR)], "○")]
    y = 22
    for title, note, c, fields, mark in rows:
        o.append(T(x0, y, title, "start", 11, INK, True))
        o.append(T(x0 + 250, y, note, "start", 10, c))
        o.append(_f08_frame(x0, y + 10, fields))
        o.append(T(x0 + 640, y + 32, mark, "middle", 15, c, True))
        y += 70
    # (b) の注釈: 宛先 MAC はルータ、宛先 IP はサーバ
    o.append(T(x0 + 61, y - 16, "ルータの MAC", "middle", 9.5, SIG, True))
    o.append(T(x0 + 462, y - 16, "サーバの IP（最後まで変わらない）", "middle", 9.5, GLD, True))
    # (c) 誤り
    y += 6
    o.append(T(x0, y, "(c) 誤り: サーバの IP アドレスで ARP の要求を出す", "start", 11, ALI, True))
    o.append(RECT(x0, y + 10, 330, 30, 4, ASOFT, ALI, 1.2))
    o.append(T(x0 + 165, y + 30, "ARP の要求「203.0.113.10 の MAC アドレスは？」", "middle", 10, ALI))
    o.append(ARR(x0 + 336, y + 25, x0 + 380, y + 25, c=ALI, lw=1.6))
    o.append(T(x0 + 388, y + 22, "リンクの中に 203.0.113.10 を持つ機器はいない", "start", 10, ALI))
    o.append(T(x0 + 388, y + 37, "→ 答えが返らず、送れない", "start", 10, ALI, True))
    o.append(T(x0 + 640, y + 32, "×", "middle", 15, ALI, True))
    return SVG(700, y + 54, o, "宛先ごとのフレームの宛先 MAC アドレスと、IP パケットの宛先 IP アドレス。外の宛先では、MAC アドレスはデフォルトゲートウェイ（ルータ）のもの、IP アドレスはサーバのものになる。ルータは IP の宛先を見て次の区間へ送り、リンク層のヘッダを付け替える。")
F["e08_arp_mac"] = _f08_arp_mac()
