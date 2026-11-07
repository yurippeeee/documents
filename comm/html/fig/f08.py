# -*- coding: utf-8 -*-
# 08 章 ネットワークに参加する の図
# アドレスは文書の例のための範囲（IPv4: RFC 5737、IPv6: RFC 3849、MAC: RFC 7042）を使う。

def _f08_ip(s):
    return [int(x) for x in s.split(".")]

def _f08_bits(s):
    """'192.168.1.23' → 32 文字の 0/1"""
    return "".join(format(v, "08b") for v in _f08_ip(s))

def _f08_lb(x, y, s, a="middle", sz=10, c=MUT, b=False, mono=False):
    """背景（図の地の色）付きの文字。線の上に置く文字が読めるようにする。"""
    w = tw(s, sz, mono) + 8
    x0 = x - (w / 2 if a == "middle" else (w - 4 if a == "end" else 4))
    return RECT(x0, y - sz * 0.95, w, sz * 1.3, 3, SCR, "none", 0) + T(x, y, s, a, sz, c, b, mono)

def _f08_note(cx, y, w, lines, c, sz=9.5, b0=False):
    """ライフラインの上に置く注記の箱（下の線を隠す）。cx は中心、y は上端。"""
    h = len(lines) * (sz + 4.5) + 8
    o = [RECT(cx - w / 2, y, w, h, 5, SCR, "none", 0), RECT(cx - w / 2, y, w, h, 5, soft(c), c, 1)]
    for i, l in enumerate(lines):
        o.append(T(cx, y + 6 + sz + i * (sz + 4.5), l, "middle", sz, c, b0 and i == 0))
    return "".join(o)

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
    def row(y, label, bits, n, kind, ref=None):
        s = []
        lc = {"addr": INK, "mask": GLD, "res": SIG}[kind]
        s.append(T(xb - 12, y, label, "end", 10.5, lc, kind != "addr"))
        for i, ch in enumerate(bits):
            if kind == "mask":
                c = GLD if ch == "1" else FNT
            elif kind == "res":
                c = (ALI if (ref and ref[i] != ch) else SIG) if i < n else FNT
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
            s.append(row(y, "AND マスク", r, n, "res", ref))
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
    return SVG(700, y - 4, o, "アドレスとマスクのビットごとの AND（筆算の形）。金の帯がネットワーク部で、AND をとるとネットワーク部だけが残り、残りのビットは 0 になる。結果が自分と等しければ同じサブネット（中）、違えば外（赤は自分と違うビット）。下の段のように、同じアドレスでもマスクが /26 なら 192.168.1.100 は外になる。")
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
    o.append(_f08_lb((xs[0] + xs[1]) / 2, y1 - 20, "① ARP の要求（ブロードキャスト）", "middle", 10.5, SIG, True))
    o.append(_f08_lb((xs[0] + xs[1]) / 2, y1 - 6, "「192.168.1.1 の MAC アドレスは？」", "middle", 10, INK))
    o.append(_f08_lb((xs[0] + xs[1]) / 2, y1 + 15, "宛先 MAC = FF:FF:FF:FF:FF:FF（全員）", "middle", 9.5, MUT, False, True))
    # 受け取った側の判断
    o.append(_f08_note(xs[1], y1 + 26, 140, ["自分ではない → 捨てる"], MUT))
    o.append(_f08_note(xs[2], y1 + 26, 192, ["自分のアドレス → 答える", "機器の IP と MAC の組を覚える"], GLD))
    # ② 応答
    y2 = 196
    o.append(ARR(xs[2], y2, xs[0] + 1, y2, c=GLD, lw=1.8))
    o.append(_f08_lb((xs[1] + xs[2]) / 2, y2 - 20, "② ARP の応答（機器だけに）", "middle", 10.5, GLD, True))
    o.append(_f08_lb((xs[1] + xs[2]) / 2, y2 - 6, "「192.168.1.1 は 00:00:5E:00:53:01」", "middle", 10, INK))
    o.append(_f08_lb((xs[1] + xs[2]) / 2, y2 + 15, "宛先 MAC = 00:00:5E:00:53:23", "middle", 9.5, MUT, False, True))
    # ③ キャッシュ
    o.append(_f08_note(xs[0], 222, 184, ["③ ARP キャッシュに記録する", "期限が切れるまで問い合わせない"], SIG, b0=True))
    # ④ 本来のデータ
    y4 = 300
    o.append(ARR(xs[0], y4, xs[2] - 1, y4, c=INK, lw=1.8))
    o.append(_f08_lb((xs[1] + xs[2]) / 2 - 20, y4 - 20, "④ IP パケットを入れたフレーム", "middle", 10.5, INK, True))
    o.append(_f08_lb((xs[1] + xs[2]) / 2 - 20, y4 - 6, "宛先 MAC = ルータの 00:00:5E:00:53:01", "middle", 9.5, MUT, False, True))
    return SVG(700, 338, o, "ARP でデフォルトゲートウェイ（ルータ）の MAC アドレスを知る手順。要求はリンクの全員に届くが、答えるのは尋ねられた IP アドレスを持つ機器だけである。得た組は ARP キャッシュに記録し、期限が切れるまで使う。")
F["e08_arp_seq"] = _f08_arp_seq()

def _f08_arp_bytes():
    o = []
    u = 34
    x0 = 12
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
    xl = x0 + 8 * u + 16
    o.append(T(xl, y + 24, "HW の種類 1 = Ethernet、プロトコル 0x0800 = IPv4、", "start", 9.5, MUT))
    o.append(T(xl, y + 38, "MAC アドレスの長さ 6、IP アドレスの長さ 4（バイト）、", "start", 9.5, MUT))
    o.append(T(xl, y + 52, "操作 1 = 要求（応答では 2）", "start", 9.5, PUR))
    y2 = y + 8 + h + 6
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
    y += 18
    o.append(T(x0, y, "(c) 誤り: サーバの IP アドレスで ARP の要求を出す", "start", 11, ALI, True))
    o.append(RECT(x0, y + 10, 330, 30, 4, ASOFT, ALI, 1.2))
    o.append(T(x0 + 165, y + 30, "ARP の要求「203.0.113.10 の MAC アドレスは？」", "middle", 10, ALI))
    o.append(ARR(x0 + 336, y + 25, x0 + 380, y + 25, c=ALI, lw=1.6))
    o.append(T(x0 + 388, y + 22, "リンクの中に 203.0.113.10 を持つ機器はいない", "start", 10, ALI))
    o.append(T(x0 + 388, y + 37, "→ 答えが返らず、送れない", "start", 10, ALI, True))
    o.append(T(x0 + 640, y + 32, "×", "middle", 15, ALI, True))
    return SVG(700, y + 54, o, "宛先ごとのフレームの宛先 MAC アドレスと、IP パケットの宛先 IP アドレス。外の宛先では、MAC アドレスはデフォルトゲートウェイ（ルータ）のもの、IP アドレスはサーバのものになる。ルータは IP の宛先を見て次の区間へ送り、リンク層のヘッダを付け替える。")
F["e08_arp_mac"] = _f08_arp_mac()

# ---- 3 節: DHCP ----
def _f08_lane_heads(xs, heads, ybot):
    """シーケンス図の頭とライフライン。heads = [(名前, 1 行目, 2 行目, 色, 破線か)]"""
    o = []
    for x, (nm, l1, l2, c, dsh) in zip(xs, heads):
        o.append(RECT(x - 86, 10, 172, 52, 8, soft(c), c, 1.3, dash="4 3" if dsh else None))
        o.append(T(x, 28, nm, "middle", 11.5, c, True))
        o.append(T(x, 42, l1, "middle", 9.5, INK, False, True))
        if l2:
            o.append(T(x, 55, l2, "middle", 9, MUT))
        o.append(W(x, 62, x, ybot, c=c, lw=1.2, dash="3 4"))
    return "".join(o)

def _f08_bcast(xs, y, c):
    """左端から右へのブロードキャスト（途中の各ライフラインに矢じり）"""
    o = [W(xs[0], y, xs[-1] - 5, y, c=c, lw=1.8)]
    for x in xs[1:]:
        o.append(ARR(x - 30, y, x - 1, y, c=c, lw=1.8))
    return "".join(o)

def _f08_dhcp_seq():
    o = []
    xs = [100, 360, 600]
    o.append(_f08_lane_heads(xs, [("機器", "00:00:5E:00:53:23", "まだアドレスが無い", SIG, False),
                                  ("サーバ A（ルータ）", "192.168.1.1", None, GLD, False),
                                  ("サーバ B（いれば）", "192.168.1.2", None, MUT, True)], 392))
    y = 104
    o.append(_f08_bcast(xs, y, SIG))
    o.append(_f08_lb(230, y - 21, "① DISCOVER（ブロードキャスト）", "middle", 10.5, SIG, True))
    o.append(_f08_lb(230, y - 7, "「アドレスを貸してほしい」", "middle", 10, INK))
    o.append(_f08_lb(230, y + 15, "0.0.0.0:68 → 255.255.255.255:67、xid = 3903F326", "middle", 9, MUT, False, True))
    y = 162
    o.append(ARR(xs[1], y, xs[0] + 1, y, c=GLD, lw=1.8))
    o.append(_f08_lb(230, y - 7, "② OFFER「192.168.1.23 を貸せる」", "middle", 10, GLD, True))
    o.append(_f08_lb(230, y + 14, "マスク・ゲートウェイ・DNS サーバ・リース 86400 s", "middle", 9, MUT))
    y = 210
    o.append(ARR(xs[2], y, xs[0] + 1, y, c=MUT, lw=1.6, dash="6 4"))
    o.append(_f08_lb(480, y - 7, "② OFFER「192.168.1.150 を貸せる」", "middle", 10, MUT, True))
    y = 266
    o.append(_f08_bcast(xs, y, SIG))
    o.append(_f08_lb(230, y - 21, "③ REQUEST（ブロードキャスト）", "middle", 10.5, SIG, True))
    o.append(_f08_lb(230, y - 7, "「A の 192.168.1.23 を借りる」", "middle", 10, INK))
    o.append(_f08_lb(230, y + 15, "サーバの識別子（オプション 54）= 192.168.1.1", "middle", 9, MUT, False, True))
    o.append(_f08_note(xs[2], y + 24, 164, ["選ばれなかった →", "取っておいたアドレスを戻す"], MUT))
    y = 334
    o.append(ARR(xs[1], y, xs[0] + 1, y, c=GLD, lw=1.8))
    o.append(_f08_lb(230, y - 7, "④ ACK「貸した。リース 86400 s」", "middle", 10, GLD, True))
    o.append(_f08_note(xs[0], 350, 180, ["ARP で重複を確かめてから", "使い始める（推奨）"], SIG))
    return SVG(700, 400, o, "DHCP でアドレスを借りる 4 つのメッセージ（サーバが 2 台ある場合）。機器はアドレスを持たないので、DISCOVER と REQUEST をブロードキャストで送る。REQUEST に選んだサーバの識別子を入れるので、選ばれなかったサーバも結果を知る。")
F["e08_dhcp_seq"] = _f08_dhcp_seq()

def _f08_resend(t0, t_end, L=24.0, min_h=60 / 3600.0):
    """RFC 2131 の延長の再送: t_end までの残りの半分（60 s 以上）ごとに送る時刻の列"""
    ts, t = [t0], t0
    while True:
        w = max((t_end - t) / 2, min_h)
        if t + w >= t_end:
            break
        t += w
        ts.append(t)
    return ts

def _f08_lease():
    o = []
    x0, w = 120, 500
    X = lambda h: x0 + h / 24.0 * w
    yA, yB, bh = 50, 166, 26
    # T1 は両方の段に共通。T2 と L は延長できなかった下の段だけのもの
    o.append(W(X(12), 34, X(12), yB + bh + 8, c=GLD, lw=1.1, dash="4 3"))
    o.append(T(X(12), 26, "T1 = 0.5 L（12 時間）", "middle", 10, GLD, True))
    for h_, lab in ((21, "T2 = 0.875 L"), (24, "L")):
        o.append(W(X(h_), yB - 34, X(h_), yB + bh + 8, c=ALI, lw=1.1, dash="4 3"))
        o.append(T(X(h_) + (0 if h_ == 24 else -4), yB - 38, lab, "middle" if h_ == 24 else "end", 10, ALI, True))
    # 上の段: サーバが答える
    o.append(T(x0 - 10, yA + 12, "サーバが答える", "end", 10.5, INK, True))
    o.append(T(x0 - 10, yA + 25, "（ふつう）", "end", 9.5, MUT))
    o.append(RECT(X(0), yA, X(12) - X(0), bh, 3, GSOFT, GRN, 1.2))
    o.append(T((X(0) + X(12)) / 2, yA + 17, "借りている", "middle", 10, GRN, True))
    o.append(RECT(X(12), yA, X(24) - X(12), bh, 3, GSOFT, GRN, 1.2))
    o.append(T((X(12) + X(24)) / 2, yA + 17, "延長された（ここから新しい 24 時間）", "middle", 10, GRN, True))
    o.append(ARR(X(24), yA + bh / 2, X(24) + 26, yA + bh / 2, c=GRN, lw=1.6))
    o.append(D(X(12), yA + bh / 2, GLD, 4.5))
    o.append(T(X(12) + 6, yA + bh + 14, "REQUEST → ACK", "start", 9.5, GLD))
    # 下の段: サーバが答えない
    o.append(T(x0 - 10, yB + 12, "サーバが答えない", "end", 10.5, INK, True))
    o.append(T(x0 - 10, yB + 25, "（止まっている）", "end", 9.5, MUT))
    o.append(RECT(X(0), yB, X(12) - X(0), bh, 3, GSOFT, GRN, 1.2))
    o.append(T((X(0) + X(12)) / 2, yB + 17, "借りている", "middle", 10, GRN, True))
    o.append(RECT(X(12), yB, X(21) - X(12), bh, 3, GOSOFT, GLD, 1.2))
    o.append(RECT(X(21), yB, X(24) - X(21), bh, 3, ASOFT, ALI, 1.2))
    for t in _f08_resend(12, 21):
        o.append(W(X(t), yB - 7, X(t), yB + bh + 2, c=GLD, lw=1.6))
    for t in _f08_resend(21, 24):
        o.append(W(X(t), yB - 7, X(t), yB + bh + 2, c=ALI, lw=1.6))
    o.append(T(X(12) + 4, yB + bh + 16, "サーバへ直接 REQUEST", "start", 9.5, GLD))
    o.append(T(X(24), yB + bh + 30, "全員へブロードキャストで REQUEST", "end", 9.5, ALI))
    o.append(T(X(24) + 6, yB + 12, "失効", "start", 10, ALI, True))
    o.append(T(X(24) + 6, yB + 25, "→ DISCOVER", "start", 9, ALI))
    # 間隔の注記
    yI = yB - 14
    for a, b, lab in ((12, 16.5, "4.5 時間"), (16.5, 18.75, "2.25 時間")):
        o.append(DIM(X(a), yI, X(b), yI, None, c=GLD))
        o.append(T((X(a) + X(b)) / 2, yI - 5, lab, "middle", 9, GLD))
    # 時間軸
    ya = yB + bh + 44
    o.append(W(X(0), ya, X(24), ya, c=MUT, lw=1))
    for h_ in range(0, 25, 3):
        o.append(W(X(h_), ya, X(h_), ya + 4, c=MUT, lw=1))
        o.append(T(X(h_), ya + 16, "%d 時間" % h_ if h_ in (0, 24) else str(h_), "middle", 9.5, MUT))
    o.append(T(X(12), ya + 32, "リースを借りてからの時間（L = 86400 秒 = 24 時間の例）", "middle", 10, MUT))
    return SVG(700, ya + 42, o, "リースの時間軸（リース時間 L = 24 時間の例）。T1 で貸したサーバに延長を求め、答えが無ければ T2 から全員に求める。送り直す間隔は残り時間の半分ずつ（60 秒以上）なので、縦線はだんだん密になる。L を過ぎたらアドレスを使うのをやめる。上の段では T1 で延長できたので、次の T1 は 24 時間後になる。")
F["e08_lease"] = _f08_lease()

def _f08_dhcp_states():
    o = []
    sw, sh = 116, 44
    P = {"INIT-REBOOT": (110, 58), "REBOOTING": (290, 58), "INIT": (110, 172), "SELECTING": (290, 172),
         "REQUESTING": (460, 172), "BOUND": (620, 172), "RENEWING": (620, 296), "REBINDING": (430, 296)}
    sub = {"INIT-REBOOT": "前のアドレスあり", "REBOOTING": "確かめてもらう", "INIT": "何も無い", "SELECTING": "OFFER を待つ",
           "REQUESTING": "ACK を待つ", "BOUND": "借りている", "RENEWING": "延長を求める", "REBINDING": "全員に求める"}
    col = {"BOUND": GRN, "RENEWING": GLD, "REBINDING": ALI}
    for k, (x, y) in P.items():
        o.append(STATE(x, y, sw, sh, k, col.get(k, SIG), sub[k], start=(k in ("INIT", "INIT-REBOOT"))))
    def E(a, b, lab, dx1=0, dy1=0, dx2=0, dy2=0, bend=0.0, loff=(0, 0), c=MUT):
        (x1, y1), (x2, y2) = P[a], P[b]
        return EDGE(x1 + dx1, y1 + dy1, x2 + dx2, y2 + dy2, lab, bend, c=c, loff=loff)
    h = sw / 2
    o.append(E("INIT", "SELECTING", "DISCOVER", h, 0, -h - 2, 0, loff=(0, -4)))
    o.append(E("SELECTING", "REQUESTING", "REQUEST", h, 0, -h - 2, 0, loff=(0, -4)))
    o.append(E("REQUESTING", "BOUND", "ACK", h, 0, -h - 2, 0, c=GRN, loff=(0, -4)))
    o.append(E("INIT-REBOOT", "REBOOTING", "REQUEST", h, 0, -h - 2, 0, loff=(0, -4)))
    o.append(E("REBOOTING", "BOUND", "ACK", h, 6, -30, -sh / 2 - 2, c=GRN, loff=(14, -8)))
    o.append(E("REBOOTING", "INIT", "NAK", -30, sh / 2, 30, -sh / 2 - 2, c=ALI, loff=(-14, 4)))
    o.append(E("BOUND", "RENEWING", "T1", -14, sh / 2, -14, -sh / 2 - 2, c=GLD, loff=(-12, 4)))
    o.append(E("RENEWING", "BOUND", "ACK", 14, -sh / 2, 14, sh / 2 + 2, c=GRN, loff=(14, 4)))
    o.append(E("RENEWING", "REBINDING", "T2", -h, 0, h + 2, 0, c=ALI, loff=(0, -4)))
    o.append(E("REBINDING", "BOUND", "ACK", 30, -sh / 2, -40, sh / 2 + 2, c=GRN, loff=(-10, -2)))
    o.append(E("REBINDING", "INIT", "L を過ぎた", -h, 0, 20, sh / 2 + 2, c=ALI, loff=(-18, 14)))
    yl = 348
    o.append(T(20, yl, "T1: 貸したサーバへ直接 REQUEST。T2: 全員へブロードキャストで REQUEST。L を過ぎたらアドレスを使うのをやめる。", "start", 10, MUT))
    return SVG(700, yl + 12, o, "機器の側の DHCP の状態機械（RFC 2131 の図を簡単にしたもの。重複が見つかったときの DECLINE などは省いた）。下の段は INIT から DISCOVER で始める流れ、上の段は前に借りたアドレスを覚えていて REQUEST から始める流れである。")
F["e08_dhcp_states"] = _f08_dhcp_states()

def _f08_dhcp_retx():
    import random as _r
    o = []
    x0, w, tmax = 70, 600, 135.0
    X = lambda t: x0 + t / tmax * w
    centers = [0, 4, 12, 28, 60, 124]
    ys = 52
    o.append(T(x0 - 10, ys + 5, "中心の値", "end", 10, INK, True))
    for k, t in enumerate(centers):
        if k:
            o.append(RECT(X(t - k), ys - 9, X(t + k) - X(t - k), 18, 3, SSOFT, SIG, 1, dash="3 2"))
        o.append(W(X(t), ys - 12, X(t), ys + 12, c=SIG, lw=2.2))
    # 回の番号と時刻（狭いところは上下にずらす）
    labs = [("1 回目", "0 s"), ("2", "4 ± 1"), ("3", "12 ± 2"), ("4 回目", "28 ± 3"), ("5 回目", "60 ± 4"), ("6 回目", "124 ± 5")]
    for k, (t, (a, b)) in enumerate(zip(centers, labs)):
        up = k in (1, 2)
        if k == 1:
            o.append(T(X(t), ys - 30, "2 回目 4 ± 1 s", "start", 9.5, SIG, True))
            o.append(W(X(t), ys - 26, X(t), ys - 13, c=SIG, lw=1))
        elif k == 2:
            o.append(T(X(t) + 2, ys + 36, "3 回目 12 ± 2 s", "start", 9.5, SIG, True))
            o.append(W(X(t), ys + 13, X(t), ys + 26, c=SIG, lw=1))
        else:
            o.append(T(X(t), ys - 18, a, "middle", 9.5, SIG, True))
            o.append(T(X(t), ys + 26, b + ("" if k == 0 else " s"), "middle", 9.5, SIG))
    # 間隔
    yi = ys + 52
    for a, b, lab in ((12, 28, "16 ± 1"), (28, 60, "32 ± 1"), (60, 124, "64 ± 1（以後 64 で止める）")):
        o.append(DIM(X(a) + 2, yi, X(b) - 2, yi, None, c=MUT))
        o.append(T((X(a) + X(b)) / 2, yi - 5, lab, "middle", 9.5, MUT))
    o.append(T(X(2), yi + 4, "4 ± 1、8 ± 1", "middle", 9, MUT))
    # 20 台の機器の送信の時刻
    yd = yi + 30
    o.append(T(x0 - 10, yd + 24, "20 台", "end", 10, INK, True))
    o.append(T(x0 - 10, yd + 38, "（例）", "end", 9.5, MUT))
    rnd = _r.Random(8)
    for d in range(20):
        t = 0.0
        yy = yd + 4 + d * 3.6
        for k in range(6):
            o.append(D(X(t), yy, PUR, 1.7))
            if k < 5:
                t += min(4 * 2 ** k, 64) + rnd.uniform(-1, 1)
    yb = yd + 4 + 20 * 3.6 + 10
    o.append(W(x0, yb, x0 + w, yb, c=MUT, lw=1))
    for t in range(0, 136, 20):
        o.append(W(X(t), yb, X(t), yb + 4, c=MUT, lw=1))
        o.append(T(X(t), yb + 16, "%d" % t, "middle", 9.5, MUT))
    o.append(T(x0 + w / 2, yb + 32, "1 回目の DISCOVER からの時間 [s]", "middle", 10, MUT))
    return SVG(700, yb + 42, o, "サーバが答えないときの DISCOVER の再送の時刻（RFC 2131 の推奨: 4 秒から倍にして最大 64 秒、各間隔に −1〜+1 秒の乱数）。k 回目の送信は、中心の値 ± (k − 1) 秒の範囲（点線の枠）に入る。下は、同時に起動した 20 台の機器の送信の例で、回を重ねるほど時刻がばらける。")
F["e08_dhcp_retx"] = _f08_dhcp_retx()

# ---- 4 節: DNS ----
def _f08_dns_path():
    o = []
    o.append(_f08_dev(16, 126, 128, 60, "機器", "リゾルバ", SIG))
    o.append(RECT(236, 116, 156, 80, 8, GOSOFT, GLD, 1.4))
    o.append(T(314, 140, "DNS サーバ", "middle", 11.5, GLD, True))
    o.append(T(314, 156, "ルータ・プロバイダ", "middle", 9.5, MUT))
    o.append(T(314, 171, "答えをキャッシュする", "middle", 9.5, MUT))
    srv = [("ルートのサーバ", "「com はあちら」", 22), ("com のサーバ", "「example.com はあちら」", 124), ("example.com のサーバ", "「203.0.113.10。300 秒覚えてよい」", 226)]
    for nm, ans, y in srv:
        o.append(RECT(500, y, 186, 52, 8, GSOFT, GRN, 1.3))
        o.append(T(593, y + 21, nm, "middle", 11, GRN, True))
        o.append(T(593, y + 39, ans, "middle", 9.5, INK))
    # 機器 ↔ DNS サーバ
    o.append(ARR(146, 146, 234, 146, c=SIG, lw=1.8))
    o.append(ARR(234, 170, 146, 170, c=GLD, lw=1.8))
    o.append(T(190, 140, "①", "middle", 11, SIG, True))
    o.append(T(190, 186, "⑧", "middle", 11, GLD, True))
    # DNS サーバ ↔ 各サーバ
    for k, (nm, ans, y) in enumerate(srv):
        cy = y + 26
        sx, sy = 392, 140 + k * 16
        o.append(ARR(sx, sy - 4, 498, cy - 6, c=GLD, lw=1.4))
        o.append(ARR(498, cy + 6, sx, sy + 4, c=GRN, lw=1.4, dash="5 3"))
        o.append(T(450, (sy + cy) / 2 - (12 if k == 0 else (-14 if k == 2 else 9)), "%s %s" % ("②④⑥"[k], "③⑤⑦"[k]), "middle", 10, MUT, True))
    o.append(T(16, 214, "① 機器: 「mqtt.example.com の IPv4 アドレスは？」", "start", 10, SIG))
    o.append(T(16, 230, "⑧ DNS サーバ: 「203.0.113.10。300 秒覚えてよい」", "start", 10, GLD))
    o.append(T(16, 266, "機器が送るのは ① の質問 1 つだけ。②〜⑦ は DNS サーバが行い、", "start", 10, INK))
    o.append(T(16, 282, "答えをキャッシュする。2 回目からは ① と ⑧ だけで終わる。", "start", 10, INK))
    return SVG(700, 294, o, "名前解決の経路。機器のリゾルバは DNS サーバに 1 つ質問するだけで、DNS サーバが上位の区分から順にたどって答えを得る（②④⑥ が質問、③⑤⑦ が答え）。答えには、それを覚えておいてよい時間（下で定義する TTL）が付いている。")
F["e08_dns_path"] = _f08_dns_path()

def _f08_dns_bytes():
    o = []
    x0 = 14
    o.append(T(x0, 18, "質問（34 バイト）: ヘッダ 12 バイト", "start", 11, SIG, True))
    s, h = BYTES(x0, 26, [("ID", 2, SIG, "1A 2B"), ("フラグ", 2, GLD, "01 00"), ("質問の数", 2, MUT, "00 01"),
                          ("答えの数", 2, MUT, "00 00"), ("権威の数", 2, MUT, "00 00"), ("追加の数", 2, MUT, "00 00")], unit=40, h=36, sz=10)
    o.append(s)
    o.append(T(x0 + 12 * 40 + 12, 42, "RD = 1", "start", 10, GLD))
    o.append(T(x0 + 12 * 40 + 12, 56, "（最後まで調べてほしい）", "start", 9.5, MUT))
    y = 26 + h + 12
    o.append(T(x0, y, "質問の部分: 名前（ラベルごとに長さを先に）・型・クラス", "start", 11, SIG, True))
    labs = [("04", None), ("mqtt", "6D 71 74 74"), ("07", None), ("example", "65 78 61 6D 70 6C 65"), ("03", None), ("com", "63 6F 6D"), ("00", None)]
    u = 27
    xx, yy, bh = x0, y + 10, 36
    for t, hexs in labs:
        if hexs is None:
            o.append(RECT(xx, yy, u, bh, 3, GOSOFT, GLD, 1.2))
            o.append(T(xx + u / 2, yy + 15, "長さ", "middle", 8.5, GLD, True))
            o.append(T(xx + u / 2, yy + 29, t, "middle", 9.5, INK, False, True))
            xx += u
        else:
            n = len(t)
            o.append(RECT(xx, yy, n * u, bh, 3, SSOFT, SIG, 1.2))
            o.append(T(xx + n * u / 2, yy + 15, "“%s”" % t, "middle", 10, SIG, True))
            o.append(T(xx + n * u / 2, yy + 29, hexs, "middle", 9, INK, False, True))
            xx += n * u
    o.append(RECT(xx, yy, 2 * u, bh, 3, PSOFT, PUR, 1.2))
    o.append(T(xx + u, yy + 15, "型", "middle", 10, PUR, True))
    o.append(T(xx + u, yy + 29, "00 01", "middle", 9, INK, False, True))
    o.append(RECT(xx + 2 * u, yy, 2 * u, bh, 3, PSOFT, PUR, 1.2))
    o.append(T(xx + 3 * u, yy + 15, "クラス", "middle", 9.5, PUR, True))
    o.append(T(xx + 3 * u, yy + 29, "00 01", "middle", 9, INK, False, True))
    o.append(T(x0, yy + bh + 15, "名前 18 バイト（4 + 1 + 7 + 1 + 3 + 1 + 長さ 0 の終わり 1）", "start", 9.5, MUT))
    o.append(T(xx + 2 * u, yy + bh + 15, "A = 1・IN = 1", "middle", 9.5, PUR))
    # 答え
    y = yy + bh + 46
    o.append(T(x0, y, "答え（50 バイト）: ヘッダ（ID 1A 2B、フラグ 81 80、質問の数 1、答えの数 1）+ 同じ質問 + 答えのレコード", "start", 11, GRN, True))
    s, h = BYTES(x0, y + 10, [("名前", 2, GLD, "C0 0C"), ("型", 2, PUR, "00 01"), ("クラス", 2, PUR, "00 01"),
                             ("TTL", 4, TEA, "00 00 01 2C"), ("長さ", 2, MUT, "00 04"), ("データ", 4, GRN, "CB 00 71 0A")], unit=40, h=36, sz=10)
    o.append(s)
    ya = y + 10 + 36 + 28
    for xc, t, c in ((x0 + 40, "12 バイト目の", GLD), (x0 + 3 * 40, "A", PUR), (x0 + 5 * 40, "IN", PUR), (x0 + 8 * 40, "300 秒", TEA),
                     (x0 + 11 * 40, "4 バイト", MUT), (x0 + 14 * 40, "203.0.113.10", GRN)):
        o.append(T(xc, ya, t, "middle", 9.5, c))
    o.append(T(x0 + 40, ya + 13, "名前を指す", "middle", 9.5, GLD))
    return SVG(700, ya + 24, o, "mqtt.example.com の A レコードを尋ねる質問と、その答えのバイト列（ID 0x1A2B の例。16 ビットと 32 ビットの値はビッグエンディアン）。名前はラベルごとに長さを先に書き、長さ 0 で終わる。答えのレコードの名前 C0 0C は、メッセージの 12 バイト目（質問の名前）を指す。")
F["e08_dns_bytes"] = _f08_dns_bytes()

def _f08_dns_flags():
    o = []
    bw, x0 = 24, 160
    fields = [("QR", 1, SIG), ("Opcode", 4, MUT), ("AA", 1, MUT), ("TC", 1, MUT), ("RD", 1, GLD), ("RA", 1, GLD), ("Z", 3, MUT), ("RCODE", 4, ALI)]
    xx = x0
    for nm, n, c in fields:
        o.append(T(xx + n * bw / 2, 20, nm, "middle", 10, c, True))
        o.append(W(xx + 2, 26, xx + n * bw - 2, 26, c=c, lw=2))
        xx += n * bw
    o.append(T(x0 - 10, 20, "ビット 15 → 0", "end", 9.5, MUT))
    rows = [("質問", 0x0100, "RD = 1"), ("答え（成功）", 0x8180, "QR = 1、RA = 1、RCODE = 0"), ("答え（名前が無い）", 0x8183, "RCODE = 3（NXDOMAIN）")]
    y = 36
    for lab, v, note in rows:
        o.append(T(x0 - 10, y + 18, "%s 0x%04X" % (lab, v), "end", 10, INK, True))
        xx = x0
        b = format(v, "016b")
        k = 0
        for nm, n, c in fields:
            for j in range(n):
                bit = b[k]
                o.append(RECT(xx, y, bw, 26, 2, soft(c) if bit == "1" else SCR, c if bit == "1" else LIN, 1.1))
                o.append(T(xx + bw / 2, y + 18, bit, "middle", 11, c if bit == "1" else FNT, bit == "1", True))
                xx += bw
                k += 1
        y += 34
        o.append(T(x0 + 16 * bw + 10, y - 16, note, "start", 9.5, MUT))
    return SVG(700, y + 4, o, "DNS のヘッダのフラグ（16 ビット）。QR は質問（0）か答え（1）か、RD は最後まで調べてほしいか、RA はそれができるサーバか、RCODE は結果（0 成功、2 サーバの失敗、3 名前が無い）を表す。")
F["e08_dns_flags"] = _f08_dns_flags()

def _f08_dns_ttl():
    o = []
    x0, w, tmax = 140, 520, 720.0
    X = lambda t: x0 + t / tmax * w
    y1, y2, bh = 40, 120, 24
    o.append(T(x0 - 10, y1 + 16, "機器のキャッシュ", "end", 10.5, SIG, True))
    o.append(RECT(X(0), y1, X(300) - X(0), bh, 3, SSOFT, SIG, 1.2))
    o.append(T((X(0) + X(300)) / 2, y1 + 16, "覚えている（TTL 300 秒）", "middle", 10, SIG, True))
    o.append(RECT(X(420), y1, X(720) - X(420), bh, 3, SSOFT, SIG, 1.2))
    o.append(T((X(420) + X(720)) / 2, y1 + 16, "新しい答えを覚えている", "middle", 10, SIG, True))
    # 使うとき（帯の下に印を付ける）
    for t, lab, c in ((0, "質問 → 答え", GLD), (150, "キャッシュから", SIG), (270, "キャッシュから", ALI), (420, "期限切れ → 質問", GLD)):
        o.append(W(X(t), y1 + bh, X(t), y1 + bh + 8, c=c, lw=2))
        o.append(D(X(t), y1 + bh + 8, c, 3))
        o.append(T(X(t) + (3 if t == 0 else 0), y1 + bh + 22, lab, "start" if t == 0 else "middle", 9.5, c, t == 270))
    o.append(T(X(270), y1 + bh + 35, "（古いアドレス）", "middle", 9.5, ALI, True))
    o.append(T(X(300), y1 - 8, "300 秒で忘れる", "middle", 9.5, MUT))
    o.append(W(X(300), y1 - 4, X(300), y1 + bh, c=MUT, lw=1.2, dash="3 3"))
    # サーバのアドレス
    o.append(T(x0 - 10, y2 + 16, "名前に対応する", "end", 10.5, GRN, True))
    o.append(T(x0 - 10, y2 + 30, "アドレス", "end", 10.5, GRN, True))
    o.append(RECT(X(0), y2, X(250) - X(0), bh, 3, GSOFT, GRN, 1.2))
    o.append(T((X(0) + X(250)) / 2, y2 + 16, "203.0.113.10", "middle", 10, GRN, True, True))
    o.append(RECT(X(250), y2, X(720) - X(250), bh, 3, GOSOFT, GLD, 1.2))
    o.append(T((X(250) + X(720)) / 2 + 30, y2 + 16, "203.0.113.20（移転した）", "middle", 10, GLD, True, True))
    o.append(T(X(250), y2 + bh + 16, "管理する側が書き換え", "middle", 9.5, GLD))
    ya = y2 + bh + 34
    o.append(W(X(0), ya, X(720), ya, c=MUT, lw=1))
    for t in range(0, 721, 120):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, str(t), "middle", 9.5, MUT))
    o.append(T(X(360), ya + 32, "時間 [s]", "middle", 10, MUT))
    return SVG(700, ya + 42, o, "機器のリゾルバのキャッシュ（TTL 300 秒の例）。TTL の間は質問を送らずに覚えている答えを使い、切れた後に必要になったら問い合わせ直す。名前に対応するアドレスが 250 秒の時点で変わっても、270 秒の時点ではまだ古い答えを使う。古い答えを使うのは、答えを得てから TTL の時間が過ぎるまでである。")
F["e08_dns_ttl"] = _f08_dns_ttl()

# ---- 5 節: NAT ----
def _f08_nat():
    o = []
    xs = [92, 352, 610]
    heads = [("機器", "192.168.1.23", "プライベートアドレス", SIG, False), ("ルータ（NAPT）", "中 192.168.1.1", "外 198.51.100.7", GLD, False),
             ("サーバ", "203.0.113.10", "ポート 8883", GRN, False)]
    for x, (nm, l1, l2, c, dsh) in zip(xs, heads):
        o.append(RECT(x - 84, 10, 168, 52, 8, soft(c), c, 1.3))
        o.append(T(x, 28, nm, "middle", 11.5, c, True))
        o.append(T(x, 42, l1, "middle", 9.5, INK, False, True))
        o.append(T(x, 55, l2, "middle", 9, MUT, False, l2.startswith("外")))
        o.append(W(x, 62, x, 318, c=c, lw=1.2, dash="3 4"))
    def pkt(x1, x2, y, src, dst, c, hi=None, num=""):
        s = [ARR(x1, y, x2 + (1 if x2 < x1 else -1), y, c=c, lw=1.8)]
        cx = (x1 + x2) / 2
        s.append(_f08_lb(cx, y - 21, num + " 送信元 " + src, "middle", 9, ALI if hi == "src" else INK, hi == "src", True))
        s.append(_f08_lb(cx, y - 7, "宛先 " + dst, "middle", 9, ALI if hi == "dst" else INK, hi == "dst", True))
        return "".join(s)
    y = 104
    o.append(pkt(xs[0], xs[1], y, "192.168.1.23:50001", "203.0.113.10:8883", SIG, None, "①"))
    o.append(pkt(xs[1], xs[2], y, "198.51.100.7:40001", "203.0.113.10:8883", GLD, "src", "②"))
    o.append(_f08_note(xs[1], y + 10, 150, ["送信元を書き換え、", "変換表に 1 行を記録"], GLD))
    y = 192
    o.append(pkt(xs[2], xs[1], y, "203.0.113.10:8883", "198.51.100.7:40001", GRN, None, "③"))
    o.append(pkt(xs[1], xs[0], y, "203.0.113.10:8883", "192.168.1.23:50001", GLD, "dst", "④"))
    o.append(_f08_note(xs[1], y + 10, 150, ["表を引いて", "宛先を書き戻す"], GLD))
    y = 286
    o.append(ARR(xs[2], y, xs[1] + 8, y, c=ALI, lw=1.8, dash="6 4"))
    o.append(_f08_lb((xs[1] + xs[2]) / 2, y - 21, "⑤ 外から始まるパケット", "middle", 9.5, ALI, True))
    o.append(_f08_lb((xs[1] + xs[2]) / 2, y - 7, "宛先 198.51.100.7:40002", "middle", 9, INK, False, True))
    o.append(T(xs[1] - 4, y + 5, "×", "end", 16, ALI, True))
    o.append(T(xs[1] - 22, y - 2, "表に行が無い →", "end", 10, ALI, True))
    o.append(T(xs[1] - 22, y + 12, "どの機器か分からず捨てる", "end", 10, ALI))
    # 変換表
    yt = 330
    o.append(T(20, yt, "ルータの変換表", "start", 11, GLD, True))
    cols = [("内側（機器）", 150), ("外側（ルータ）", 150), ("相手（サーバ）", 150)]
    xx = 140
    for nm, w in cols:
        o.append(RECT(xx, yt - 14, w, 20, 0, GOSOFT, GLD, 1))
        o.append(T(xx + w / 2, yt, nm, "middle", 10, GLD, True))
        xx += w
    vals = ["192.168.1.23:50001", "198.51.100.7:40001", "203.0.113.10:8883"]
    xx = 140
    for (nm, w), v in zip(cols, vals):
        o.append(RECT(xx, yt + 6, w, 22, 0, SCR, GLD, 1))
        o.append(T(xx + w / 2, yt + 21, v, "middle", 9.5, INK, False, True))
        xx += w
    return SVG(700, yt + 40, o, "NAPT の動き。機器から出ていくパケット（①）の送信元を、ルータが自分のグローバルアドレスとポート番号に書き換え（②）、その組を変換表に記録する。答え（③）は表を引いて宛先を書き戻す（④）。外から始まるパケット（⑤）は、表に対応する行が無いので捨てられる。")
F["e08_nat"] = _f08_nat()

def _f08_nat_hold():
    o = []
    x0, w, tmax = 170, 500, 200.0
    X = lambda t: x0 + t / tmax * w
    Th = 60.0
    rows = [("(a) 25 秒ごと", "すべて届く", 25, set(), True),
            ("(b) 25 秒ごと", "2 回続けて失われる", 25, {25, 50}, False),
            ("(c) 90 秒ごと", "すべて届く", 90, set(), False)]
    rh, gap, y = 62, 26, 30
    tn = 150.0     # サーバからの通知
    o.append(T(X(tn), 16, "サーバからの通知（150 秒）", "middle", 9.5, PUR, True))
    for lab, sub, Tk, lost, ok in rows:
        P = Plot(x0, y, w, rh, (0, tmax), (0, 80))
        o.append(T(x0 - 12, y + 22, lab, "end", 10.5, INK, True))
        o.append(T(x0 - 12, y + 37, sub, "end", 9.5, ALI if lost else MUT))
        o.append(RECT(x0, y, w, rh, 2, SCR, LIN, 1))
        o.append(P.line([(0, Th), (tmax, Th)], c=ALI, lw=1.1, dash="5 3"))
        # 時計（最後に通ってからの時間）の折れ線
        sends = [t for t in range(0, int(tmax) + 1, Tk)]
        pts, last, dead = [], 0.0, None
        t = 0.0
        events = [s for s in sends if s not in lost]
        k = 0
        while t < tmax:
            nxt = next((s for s in events if s > t + 1e-9), None)
            end = min(nxt if nxt is not None else tmax, tmax)
            if last + Th <= end:          # 次に通る前に保持時間に達する
                pts += [(t, t - last), (last + Th, Th)]
                dead = last + Th
                break
            pts += [(t, t - last), (end, end - last)]
            if nxt is None or nxt >= tmax:
                break
            last = nxt
            t = nxt
        o.append(P.line(pts, c=SIG, lw=1.8))
        for s in sends:
            c = ALI if s in lost else SIG
            o.append(W(X(s), y + rh, X(s), y + rh + 6, c=c, lw=2))
            if s in lost:
                o.append(T(X(s), y + rh + 17, "×", "middle", 11, ALI, True))
        if dead is not None:
            o.append(RECT(X(dead), y, X(tmax) - X(dead), rh, 2, ASOFT, "none", 0))
            o.append(D(X(dead), P.Y(Th), ALI, 4))
            o.append(T(X(dead) + 6, y + 32, "%d 秒で行が消える" % dead, "start", 9.5, ALI, True))
        # 通知
        okn = dead is None or tn < dead
        o.append(D(X(tn), y + rh / 2 + 10, GRN if okn else ALI, 5))
        o.append(T(X(tn) + 8, y + rh / 2 + 14, "届く" if okn else "捨てられる", "start", 10, GRN if okn else ALI, True))
        y += rh + gap
    o.append(T(x0 + w - 4, 30 + rh - Th / 80.0 * rh - 4, "保持時間 60 秒", "end", 9, ALI))
    ya = y - gap + 8
    for t in range(0, 201, 25):
        o.append(T(X(t), ya + 12, str(t), "middle", 9.5, MUT))
    o.append(T(X(100), ya + 28, "時間 [s]（縦は、行を最後にパケットが通ってからの時間。下の短い線は送った時刻）", "middle", 9.5, MUT))
    return SVG(700, ya + 38, o, "変換表の行の時計（保持時間 60 秒の例）。パケットが通るたびに 0 に戻り、60 秒に達すると行が消える。(a) は 25 < 60 なので保たれる。(b) は 2 回続けて失われ、届く間隔が 75 秒に延びるので消える（条件 25 < 60 / 3 を満たさない）。(c) は 90 ≧ 60 なので消える。行が消えた後のサーバからの通知は捨てられる。")
F["e08_nat_hold"] = _f08_nat_hold()

# ---- 6 節: IPv6 ----
def _f08_v6():
    o = []
    def panel(x0, title, dev_addr, router_lines, rule, c_r):
        s = []
        s.append(T(x0 + 165, 20, title, "middle", 11.5, INK, True))
        s.append(RECT(x0 + 4, 32, 150, 176, 10, "none", MUT, 1.1, dash="5 4"))
        s.append(T(x0 + 14, 48, "家庭の中", "start", 9.5, MUT, True))
        s.append(_f08_dev(x0 + 14, 58, 130, 48, "機器", dev_addr, SIG))
        s.append(RECT(x0 + 172, 82, 150, 70, 8, soft(c_r), c_r, 1.4))
        for i, l in enumerate(router_lines):
            s.append(T(x0 + 247, 101 + i * 15, l, "middle", 11 if i == 0 else 9.5, c_r if i == 0 else INK, i == 0, i == 1))
        # 中から外: 通る
        s.append(ARR(x0 + 144, 74, x0 + 172 + 150 + 20, 74, c=GRN, lw=1.8))
        s.append(T(x0 + 252, 68, "中から始める: 通る", "middle", 9.5, GRN, True))
        # 外から中: 捨てる
        s.append(ARR(x0 + 342, 178, x0 + 326, 178, c=ALI, lw=1.8, dash="5 3"))
        s.append(T(x0 + 324, 182, "×", "end", 15, ALI, True))
        s.append(T(x0 + 247, 196, "外から始める: 捨てる", "middle", 9.5, ALI, True))
        s.append(T(x0 + 247, 212, rule, "middle", 9.5, ALI))
        return "".join(s)
    o.append(panel(0, "IPv4（NAT）", "192.168.1.23", ["ルータ（NAT）", "198.51.100.7", "変換表"], "（変換表に行が無い）", GLD))
    o.append(panel(352, "IPv6（防火壁）", "2001:db8:1:2::23", ["ルータ（防火壁）", "2001:db8:1:2::1", "通してよい通信の表"], "（表に行が無い）", GLD))
    o.append(W(350, 30, 350, 220, c=LIN, lw=1))
    yb = 244
    o.append(RECT(20, yb - 16, 660, 46, 8, GSOFT, GRN, 1.2))
    o.append(T(350, yb + 2, "どちらでも、機器の側から接続を張り、表の行の保持時間より短い間隔で通信し続ける。", "middle", 10.5, GRN, True))
    o.append(T(350, yb + 19, "IPv6 では機器ごとにグローバルアドレスを持てるが、外から始まる接続が通らないことは変わらない。", "middle", 10, INK))
    return SVG(700, yb + 40, o, "IPv4 の NAT と、IPv6 の家庭のルータの防火壁の比較。IPv6 の機器はグローバルアドレス（図は文書の例のための範囲 2001:db8::/32 のもの）を持つが、多くのルータは外から始まる通信を通さない。どちらの表の行にも保持時間がある。")
F["e08_v6"] = _f08_v6()

# ---- 7 節: 参加の手順 ----
def _f08_join_sm():
    o = []
    x, sw, sh = 190, 128, 40
    ys = {"DOWN": 40, "DHCP": 106, "ARP": 172, "DNS": 238, "TCP": 304, "UP": 370}
    names = [("DOWN", "リンクダウン", "リンクアップを待つ", MUT), ("DHCP", "DHCP", "アドレスを借りる", SIG), ("ARP", "ARP", "ゲートウェイの MAC", SIG),
             ("DNS", "DNS", "名前 → アドレス", SIG), ("TCP", "接続中", "TCP の接続（10 章）", SIG), ("UP", "つながった", "通信できる", GRN)]
    for k, nm, sub, c in names:
        o.append(STATE(x, ys[k], sw, sh, nm, c, sub, start=(k == "DOWN")))
    xw, yw = 560, 238
    o.append(STATE(xw, yw, sw, sh, "待つ", GLD, "バックオフ（05 章 5 節）"))
    # 下へ進む遷移
    downs = [("DOWN", "DHCP", "リンクアップ"), ("DHCP", "ARP", "ACK を受けた"), ("ARP", "DNS", "ARP の応答"),
             ("DNS", "TCP", "A レコード"), ("TCP", "UP", "接続できた")]
    for a, b, lab in downs:
        o.append(ARR(x, ys[a] + sh / 2, x, ys[b] - sh / 2 - 1, c=GRN, lw=1.6))
        o.append(T(x + 8, (ys[a] + ys[b]) / 2 + 4, lab, "start", 9.5, GRN))
    # ARP → DHCP（左を回る）
    o.append(CARR(x - sw / 2, ys["ARP"], x - sw / 2, ys["DHCP"] + 4, 0.55, c=ALI, lw=1.4))
    o.append(T(x - sw / 2 - 42, (ys["ARP"] + ys["DHCP"]) / 2 + 4, "3 回答えなし", "end", 9.5, ALI))
    # 待つへ
    xr = x + sw / 2
    o.append(ARR(xr, ys["DHCP"] + 8, xw - sw / 2 + 10, yw - sh / 2 - 1, c=ALI, lw=1.4))
    o.append(T(xr + 64, ys["DHCP"] + 34, "30 秒で終わらない", "start", 9.5, ALI))
    o.append(ARR(xr, ys["DNS"] + 8, xw - sw / 2 - 1, yw + 8, c=ALI, lw=1.4))
    o.append(T((xr + xw - sw / 2) / 2, ys["DNS"] + 22, "4 回答えなし・NXDOMAIN", "middle", 9.5, ALI))
    o.append(ARR(xr, ys["TCP"], xw - sw / 2 + 14, yw + sh / 2 + 1, c=ALI, lw=1.4))
    o.append(T(xr + 74, ys["TCP"] + 2, "失敗・10 秒", "start", 9.5, ALI))
    o.append(ARR(xr, ys["UP"], xw - 10, yw + sh / 2 + 1, c=ALI, lw=1.4))
    o.append(T(xr + 110, ys["UP"] - 4, "接続が切れた", "start", 9.5, ALI))
    # 待つ → やり直す段
    yt = ys["DHCP"] - 8
    o.append(W(xw, yw - sh / 2, xw, yt, xr + 8, yt, c=GLD, lw=1.4))
    o.append(ARR(xr + 12, yt, xr + 1, yt, c=GLD, lw=1.4))
    o.append(T((xr + xw) / 2 + 30, yt - 6, "待ち終わり: DHCP で止まったなら DHCP へ", "middle", 9.5, GLD))
    o.append(ARR(xw - sw / 2, yw - 8, xr + 1, ys["DNS"] - 8, c=GLD, lw=1.4))
    o.append(T((xr + xw - sw / 2) / 2, ys["DNS"] - 14, "待ち終わり: ほかは DNS へ", "middle", 9.5, GLD))
    # どこからでも
    yn = 300
    o.append(RECT(440, yn + 12, 252, 66, 8, MSOFT, MUT, 1.1))
    o.append(T(452, yn + 30, "どの状態からでも:", "start", 10, INK, True))
    o.append(T(452, yn + 48, "リンクダウン → 接続を閉じて「リンクダウン」へ", "start", 9.5, INK))
    o.append(T(452, yn + 66, "リースが切れた → 接続を閉じて「DHCP」へ", "start", 9.5, INK))
    return SVG(700, 402, o, "ネットワークへの参加の状態機械。リンクアップから DHCP・ゲートウェイの ARP・DNS・接続の順に進み（緑）、各段で期限までに進めなければ、待ってからやり直すか前の段に戻る（赤と金）。リンクダウンとリースの喪失は、どの状態からでも同じに扱う。")
F["e08_join_sm"] = _f08_join_sm()

def _f08_join_time():
    o = []
    x0, w, tmax = 200, 470, 8.0
    X = lambda t: x0 + t / tmax * w
    # 仮定（代表値）: LAN の往復 5 ms、DNS の答え 30 ms、サーバまでの往復 100 ms
    rows = [("(a) 1 つも失われない", [("DHCP", 0, 0.010, GLD), ("ARP", 0.010, 0.015, SIG), ("DNS", 0.015, 0.045, PUR), ("接続", 0.045, 0.145, GRN)], "0.145 秒"),
            ("(b) DISCOVER が 1 回失われる", [("待つ", 0, 4.0, ALI), ("DHCP", 4.0, 4.010, GLD), ("ARP", 4.010, 4.015, SIG), ("DNS", 4.015, 4.045, PUR), ("接続", 4.045, 4.145, GRN)], "4.145 秒"),
            ("(c) DNS の答えが 1 回失われる", [("DHCP", 0, 0.010, GLD), ("ARP", 0.010, 0.015, SIG), ("待つ", 0.015, 2.015, ALI), ("DNS", 2.015, 2.045, PUR), ("接続", 2.045, 2.145, GRN)], "2.145 秒"),
            ("(d) 重複の確認（RFC 5227）", [("DHCP", 0, 0.010, GLD), ("確認 4〜7 秒", 0.010, 5.5, TEA), ("ARP", 5.5, 5.505, SIG), ("DNS", 5.505, 5.535, PUR), ("接続", 5.535, 5.635, GRN)], "4.1〜7.1 秒")]
    y, bh, gap = 30, 22, 22
    for lab, segs, tot in rows:
        o.append(T(x0 - 10, y + 15, lab, "end", 10, INK, True))
        o.append(RECT(X(0), y, w, bh, 3, SCR, LIN, 1))
        for nm, a, b, c in segs:
            ww = max(X(b) - X(a), 1.6)
            o.append(RECT(X(a), y, ww, bh, 2, soft(c), c, 1.1, dash="4 3" if nm == "待つ" else None))
            if ww > tw(nm, 9.5) + 6:
                o.append(T(X(a) + ww / 2, y + 15, nm if nm != "待つ" else "再送を待つ", "middle", 9.5, c, True))
        end = segs[-1][2]
        o.append(T(X(end) + 6, y + 15, tot, "start", 10, INK, True))
        if lab.startswith("(d)"):
            o.append(T(X(5.5) + 4, y + bh + 12, "（4〜7 秒の乱数。図は 5.5 秒の例）", "start", 9, TEA))
        y += bh + gap
    # 拡大: (a) の内訳
    o.append(T(x0 - 10, y + 14, "(a) を拡大", "end", 10, MUT, True))
    x1, w1, t1 = x0, 470, 0.16
    X1 = lambda t: x1 + t / t1 * w1
    # 拡大した内訳の文字: 細い DHCP と ARP は引き出し線で 2 段に分け、DNS は右へずらす
    pos = {"DHCP": (X1(0), 2, "start"), "ARP": (X1(0.0125) - 2, 1, "start"), "DNS": (X1(0.015) + 54, 1, "start"), "接続": (X1(0.095), 1, "middle")}
    for nm, a, b, c in rows[0][1]:
        o.append(RECT(X1(a), y, X1(b) - X1(a), bh, 2, soft(c), c, 1.1))
        xx, ln, an = pos[nm]
        yy = y + bh + 13 * ln
        if nm in ("DHCP", "ARP"):
            o.append(W((X1(a) + X1(b)) / 2, y + bh, (X1(a) + X1(b)) / 2, yy - 9, c=c, lw=1))
        o.append(T(xx, yy, "%s %d ms" % (nm, round((b - a) * 1000)), an, 9, c, True))
    yb = y + bh + 44
    for t in range(0, 9):
        o.append(W(X(t), 24, X(t), y - gap + 6, c=GRD, lw=1))
    for t in range(0, 9):
        o.append(T(X(t), 20, "%d s" % t, "middle", 9, MUT))
    o.append(T(20, yb + 6, "仮定（代表値）: LAN の中の往復 5 ms、DNS サーバの答えまで 30 ms、サーバまでの往復 100 ms。", "start", 9.5, MUT))
    o.append(T(20, yb + 21, "DHCP の再送の間隔は乱数を省いて 4 秒とした。リンクアップまでの時間（09 章）は含まない。", "start", 9.5, MUT))
    return SVG(700, yb + 31, o, "起動から接続までの時間の内訳。1 つも失われなければ 0.2 秒もかからないが、DHCP のメッセージが 1 つ失われると 4 秒、DNS の答えが 1 つ失われると 2 秒の待ちが足される。受け取ったアドレスの重複の確認を RFC 5227 の手順どおりに行うと、それだけで 4〜7 秒かかる。")
F["e08_join_time"] = _f08_join_time()
