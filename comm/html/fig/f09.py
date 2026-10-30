# -*- coding: utf-8 -*-
# 09 章 Wi-Fi の図

_F09_TB = 102.4          # ビーコン間隔 [ms]（100 TU）

def _f09_hump(p, fc, bw, y_top, y_base, c, op=0.35, dash=None, lw=1.4, fill=True):
    """中心 fc [MHz]、幅 bw [MHz] の信号の形（台形）。p は横軸の Plot。"""
    e = min(2.0, bw * 0.12)
    pts = [(p.X(fc - bw / 2), y_base), (p.X(fc - bw / 2 + e), y_top), (p.X(fc + bw / 2 - e), y_top), (p.X(fc + bw / 2), y_base)]
    return PL(pts, c=c, lw=lw, dash=dash, fill=soft(c) if fill else "none", op=op if fill else None)

# ---- 1 節: AP とステーション ----
def _f09_bss():
    o = []
    o.append(BOX(275, 12, 150, 46, "ルータ", "DHCP のサーバも兼ねる", GLD, GOSOFT, INK, sz=11.5, ssz=9.5))
    o.append(ARR(275, 30, 128, 30, c=GLD, lw=1.6))
    o.append(T(120, 34, "インターネットへ", "end", 10.5, GLD))
    o.append(W(350, 58, 350, 76, 100, 76, 100, 102, c=GLD, lw=1.6))
    o.append(W(350, 76, 450, 76, 450, 102, c=GLD, lw=1.6))
    o.append(T(358, 71, "Ethernet", "start", 9.5, GLD))
    regs = [(20, 350, 100, "AP 1（1 階）", "00:00:5E:00:53:A0", 6), (370, 680, 450, "AP 2（2 階）", "00:00:5E:00:53:B0", 11)]
    for x0, x1, ax, nm, bssid, ch in regs:
        o.append(RECT(x0, 92, x1 - x0, 214, 12, "none", SIG, 1.2, dash="5 4"))
        o.append(BOX(ax - 60, 102, 120, 38, nm, None, GLD, GOSOFT, INK, sz=11))
        o.append(T(ax + 72, 114, "SSID: home", "start", 10.5, INK, True))
        o.append(T(ax + 72, 130, "BSSID: " + bssid, "start", 9.5, MUT, False, True))
        o.append(T(ax + 72, 146, "チャネル %d" % ch, "start", 10.5, SIG, True))
    # ステーション
    sts = [(40, "機器", "このシリーズの機器", SIG, 100), (190, "スマートフォン", None, PUR, 100), (390, "PC", None, MUT, 450)]
    for x, nm, sub, c, ax in sts:
        o.append(BOX(x, 226, 120, 44, nm, sub, c, soft(c), INK, sz=11, ssz=9))
        o.append(W(ax, 141, x + 60, 225, c=c, lw=1.5, dash="3 4"))
    o.append(T(160, 196, "電波", "middle", 9.5, MUT))
    o.append(T(30, 296, "AP 1 とつながったステーション（BSS）", "start", 9.5, SIG))
    o.append(T(380, 296, "AP 2 とつながったステーション（BSS）", "start", 9.5, SIG))
    o.append(T(350, 330, "同じ SSID の AP が何台あってもよい。AP が出す 1 つのネットワーク（BSS）は、BSSID（AP の MAC アドレス）で区別する。", "middle", 10, INK))
    return SVG(700, 344, o, "家庭の Wi-Fi の例。2 台の AP が同じ SSID（home）を出し、それぞれ別のチャネルを使っている。ステーション（機器・スマートフォン・PC）は、どちらか 1 台の AP につながる。AP は Ethernet でルータにつながり、ルータがインターネットとの間を取り次ぐ。家庭では、ルータと AP が 1 つの箱に入っていることが多い。")
F["e09_bss"] = _f09_bss()

# ---- 1 節: 2.4 GHz 帯のチャネル ----
def _f09_channels():
    o = []
    p = Plot(50, 40, 630, 150, (2398, 2496), (0, 1))
    yb, yt = 190, 78
    # ISM 帯
    o.append(RECT(p.X(2400), 30, p.X(2483.5) - p.X(2400), yb - 30, 0, MSOFT, "none", 0, op=0.55))
    hl = {1: SIG, 6: GRN, 11: PUR}
    for n in range(1, 14):
        fc = 2407 + 5 * n
        if n in hl:
            continue
        o.append(_f09_hump(p, fc, 20, yt, yb, FNT, fill=False, lw=1.0, dash="3 3"))
    for n, c in hl.items():
        o.append(_f09_hump(p, 2407 + 5 * n, 20, yt, yb, c, op=0.45, lw=1.8))
    o.append(_f09_hump(p, 2484, 22, yt + 20, yb, MUT, fill=False, lw=1.1, dash="2 3"))
    for n in range(1, 14):
        fc = 2407 + 5 * n
        o.append(T(p.X(fc), yt - 8, str(n), "middle", 10.5, hl.get(n, MUT), n in hl, True))
        o.append(W(p.X(fc), yb, p.X(fc), yb + 4, c=MUT, lw=1))
    o.append(T(p.X(2484), yt + 12, "14", "middle", 10, MUT, False, True))
    o.append(T(p.X(2484) + 2, yt - 8, "日本のみ（802.11b）", "middle", 9, MUT))
    o.append(T(p.X(2398), yt - 8, "チャネル", "start", 9.5, MUT))
    o.append(W(p.X(2398), yb, p.X(2496), yb, c=MUT, lw=1.2))
    for f in range(2400, 2500, 10):
        o.append(T(p.X(f), yb + 16, str(f), "middle", 9.5, MUT))
    o.append(T(p.X(2496), yb + 32, "周波数 [MHz]", "end", 10, MUT))
    # 帯域幅の寸法（チャネル 6）
    o.append(DIM(p.X(2427), yb - 22, p.X(2447), yb - 22, None, c=GRN))
    o.append(T(p.X(2437), yb - 30, "20 MHz", "middle", 10, GRN, True))
    # 中心の間隔（1 と 2）
    o.append(T(p.X(2400) + 4, 46, "2.4 GHz 帯（2400〜2483.5 MHz）", "start", 10, MUT))
    yl = yb + 52
    o.append(LEGEND(50, yl, [(SIG, "チャネル 1（2412 MHz）"), (GRN, "6（2437 MHz）"), (PUR, "11（2462 MHz）")]))
    o.append(T(50, yl + 20, "中心は 5 MHz おき（2407 + 5n MHz）だが、信号の幅は 20 MHz。1・6・11 は中心が 25 MHz ずつ離れ、互いに重ならない。", "start", 10, INK))
    o.append(T(50, yl + 38, "破線は、そのほかのチャネル。番号の差が 3 以下のチャネルどうしは、信号が重なる。", "start", 10, MUT))
    return SVG(700, yl + 50, o, "2.4 GHz 帯のチャネル（20 MHz 幅の信号。台形は信号が使う周波数の範囲を簡単に描いたもので、実際の信号の裾はもっと広い）。チャネル n の中心は 2407 + 5n MHz。日本では、IEEE 802.11b に限ってチャネル 14（2484 MHz）も使える。")
F["e09_channels"] = _f09_channels()

# ---- 1 節: CSMA/CA と 1 回の送信の時間 ----
def _f09_airtime():
    o = []
    s = 3.0                      # px / µs
    x0 = 120
    X = lambda t: x0 + t * s
    y1, y2, h = 72, 150, 30
    o.append(T(14, y1 + 20, "機器（送る）", "start", 11, SIG, True))
    o.append(T(14, y2 + 20, "AP（受ける）", "start", 11, GLD, True))
    o.append(W(x0 - 6, y1 + h + 1, X(196), y1 + h + 1, c=FNT, lw=1))
    o.append(W(x0 - 6, y2 + h + 1, X(196), y2 + h + 1, c=FNT, lw=1))
    # 直前のほかの機器の送信
    o.append(RECT(18, y1 - 50, x0 - 22, 22, 3, MSOFT, MUT, 1.0, dash="3 3"))
    o.append(T(18 + (x0 - 22) / 2, y1 - 35, "ほかの機器が送信中", "middle", 9.5, MUT))
    o.append(W(x0, y1 - 56, x0, y2 + h + 8, c=MUT, lw=1, dash="2 3"))
    o.append(T(x0 + 4, y1 - 46, "チャネルが空いた", "start", 9.5, MUT))
    for a_, b_, lab in ((0, 28, "空き 28 µs"), (28, 95.5, "乱数の待ち（平均 67.5 µs）")):
        o.append(RECT(X(a_), y1, (b_ - a_) * s, h, 3, TSOFT, TEA, 1.1, dash="4 3" if a_ else None))
        o.append(T((X(a_) + X(b_)) / 2, y1 + 19, lab, "middle", 9.5, TEA, True))
    # データのフレーム
    a = 95.5
    xx = a
    for d, c, lab in ((20, SIG, "前置き 20"), (20, SIG, "ビット 20"), (6, MUT, "")):
        o.append(RECT(X(xx), y1, d * s, h, 2, soft(c), c, 1.2))
        if lab:
            o.append(T(X(xx) + d * s / 2, y1 + 19, lab, "middle", 9.5, c, True))
        xx += d
    o.append(T(X(a + 43), y1 + h + 13, "6", "middle", 9, MUT))
    o.append(DIM(X(a), y1 - 10, X(a + 46), y1 - 10, None, c=SIG))
    o.append(T(X(a + 23), y1 - 16, "データのフレーム 46 µs（128 バイト、54 Mbps）", "middle", 9.5, SIG, True))
    # 届く・10 µs・ACK
    te = a + 46
    t_ack = te + 10
    o.append(ARR(X(te), y1 + h + 2, X(te), y2 - 2, c=SIG, lw=1.3, head=6))
    o.append(T(X(te) - 6, (y1 + h + y2) / 2 + 4, "届く", "end", 9.5, SIG))
    o.append(RECT(X(t_ack), y2, 34 * s, h, 3, GOSOFT, GLD, 1.2))
    o.append(T(X(t_ack) + 17 * s, y2 + 19, "ACK 34 µs", "middle", 9.5, GLD, True))
    o.append(DIM(X(te), y2 + h + 10, X(t_ack), y2 + h + 10, None, c=MUT))
    o.append(T(X(te + 5), y2 + h + 24, "10 µs", "middle", 9.5, MUT))
    o.append(ARR(X(t_ack + 34), y2 - 2, X(t_ack + 34), y1 + h + 2, c=GLD, lw=1.3, head=6))
    o.append(T(X(t_ack + 34) - 6, (y1 + h + y2) / 2 + 4, "ACK が届く", "end", 9.5, GLD))
    # 時間軸
    ya = y2 + h + 40
    o.append(W(x0, ya, X(196), ya, c=MUT, lw=1.1))
    for t in (0, 50, 100, 150, 185.5):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, ("%g" % t), "middle", 9.5, ALI if t == 185.5 else MUT, t == 185.5))
    o.append(T(x0, ya + 32, "時間 [µs]（チャネルが空いた時刻を 0 とする）", "start", 9.5, MUT))
    # 比べる棒
    yb = ya + 48
    o.append(T(x0 - 8, yb + 13, "合計", "end", 10, INK, True))
    o.append(RECT(x0, yb, 185.5 * s, 18, 3, ASOFT, ALI, 1.1))
    o.append(T(x0 + 185.5 * s - 6, yb + 13, "185.5 µs", "end", 10, ALI, True))
    o.append(T(x0 - 8, yb + 39, "ビットだけ", "end", 10, INK, True))
    o.append(RECT(x0, yb + 26, 19 * s, 18, 3, SSOFT, SIG, 1.1))
    o.append(T(x0 + 19 * s + 8, yb + 39, "19 µs（128 × 8 ÷ 54 Mbps）。待ち時間と前置きと ACK が大半を占める", "start", 10, SIG))
    return SVG(700, yb + 56, o, "CSMA/CA で、07 章 5 節の 20 バイトの測定値（Wi-Fi のフレームで 128 バイト）を 1 回送る時間（IEEE 802.11g の方式、データ 54 Mbps・ACK 24 Mbps、短いスロット 9 µs の場合）。チャネルが空いてから決まった時間と乱数の時間だけ待って送り、AP は受け取ってから 10 µs 後に ACK を返す。乱数の待ちは 0〜135 µs で、図は平均の値。")
F["e09_airtime"] = _f09_airtime()

# ---- 2 節: ビーコンの中身 ----
_F09_BEACON = {
    "hdr": [("制御", 2, "80 00"), ("時間", 2, "00 00"), ("宛先（アドレス 1）", 6, "FF FF FF FF FF FF"),
            ("送信元（アドレス 2）", 6, "00 00 5E 00 53 A0"), ("アドレス 3 = BSSID", 6, "00 00 5E 00 53 A0"), ("順番", 2, "50 1F")],
    "fix": [("AP の時計（µs）", 8, "9D 2B 1C 05 00 00 00 00"), ("ビーコン間隔", 2, "64 00"), ("能力", 2, "11 04")],
    "elems": [("SSID", 0, "68 6F 6D 65", "\"home\""),
              ("使える速さ", 1, "82 84 8B 96 0C 12 18 24", "1・2・5.5・11・6・9・12・18 Mbps"),
              ("チャネル", 3, "06", "チャネル 6"),
              ("TIM（4 節）", 5, "00 03 00 00", "DTIM の数 0・DTIM 周期 3・…"),
              (None, None, None, "国の情報（ID 7）・802.11g の情報（ID 42）・追加の速さ（ID 50）の 3 つ、合わせて 17 バイト"),
              ("暗号化の方式（3 節）", 48, "01 00 00 0F AC 04 01 00 00 0F AC 04 01 00 00 0F AC 02 00 00", None)],
}

def _f09_fieldrow(x, y, fields, unit, h, c):
    """[(名前, バイト数, 16 進), ...] を横に並べる。名前は箱の上、値は箱の中。"""
    o = []
    xx = x
    for nm, nb, hx in fields:
        w = nb * unit
        o.append(RECT(xx, y, w, h, 3, soft(c), c, 1.2))
        o.append(T(xx + w / 2, y - 5, nm, "middle", 9.5, c, True))
        o.append(T(xx + w / 2, y + h / 2 + 3.5, hx, "middle", 9.5, INK, False, True))
        o.append(T(xx + w / 2, y + h + 12, "%d" % nb, "middle", 8.5, MUT))
        xx += w
    return "".join(o)

def _f09_beacon():
    o = []
    B = _F09_BEACON
    o.append(T(14, 22, "MAC ヘッダ（24 バイト）", "start", 11, SIG, True))
    o.append(_f09_fieldrow(46, 46, B["hdr"], 26, 24, SIG))
    o.append(T(14, 112, "本体の先頭の決まった欄（12 バイト）", "start", 11, GLD, True))
    o.append(_f09_fieldrow(46, 136, B["fix"], 36, 24, GLD))
    o.append(T(46 + 12 * 36 + 14, 152, "← 0x0064 = 100 TU（リトルエンディアン）", "start", 9.5, MUT))
    y = 200
    o.append(T(14, y - 10, "要素の列（ID 1 バイト・長さ 1 バイト・値。03 章 7 節の TLV）", "start", 11, PUR, True))
    u, xv = 17, 186
    for nm, eid, hx, note in B["elems"]:
        if nm is None:
            o.append(T(xv, y + 15, "… " + note, "start", 9.5, MUT))
            y += 26
            continue
        nb = len(hx.split())
        o.append(T(xv - 10, y + 16, "%s（ID %d）" % (nm, eid), "end", 10, PUR, True))
        o.append(RECT(xv, y, 2 * u, 22, 2, PSOFT, PUR, 1.2))
        o.append(T(xv + u, y + 15, "%02X" % eid, "middle", 9.5, PUR, True, True))
        o.append(RECT(xv + 2 * u, y, 2 * u, 22, 2, PSOFT, PUR, 1.2))
        o.append(T(xv + 3 * u, y + 15, "%02X" % nb, "middle", 9.5, PUR, True, True))
        vw = max(nb * u, tw(hx, 9.5, True) + 10) if nb <= 8 else tw(hx, 9.5, True) + 10
        o.append(RECT(xv + 4 * u, y, vw, 22, 2, PAN, PUR, 1.0))
        o.append(T(xv + 4 * u + vw / 2, y + 15, hx, "middle", 9.5, INK, False, True))
        if note:
            o.append(T(xv + 4 * u + vw + 8, y + 15, note, "start", 9.5, MUT))
        y += 30
    o.append(T(xv - 10, y + 16, "FCS", "end", 10, SIG, True))
    o.append(RECT(xv, y, 4 * 2 * u, 22, 2, SSOFT, SIG, 1.2))
    o.append(T(xv + 4 * u, y + 15, "（4 バイト）", "middle", 9.5, SIG))
    o.append(T(xv + 8 * u + 10, y + 15, "合計 24 + 12 + 64 + 4 = 104 バイト", "start", 10, INK, True))
    return SVG(700, y + 34, o, "ビーコンのバイトの例（SSID が home の AP。BSSID は文書の例のために予約された範囲の MAC アドレス）。ヘッダと本体の 2 バイト以上の欄はリトルエンディアン。要素は ID と長さで区切られているので、受け手は知らない ID の要素を読み飛ばせる。暗号化の方式の要素の中身は 3 節で扱う方式（WPA2-PSK・CCMP）を表す。")
F["e09_beacon"] = _f09_beacon()

# ---- 2 節: パッシブスキャンとアクティブスキャン ----
def _f09_scan():
    o = []
    x0, x1 = 118, 640
    S = (x1 - x0) / 1400.0                 # px / ms
    X = lambda t: x0 + t * S
    aps = {1: 37.0, 6: 71.0, 11: 15.0}     # AP のいるチャネルと、そのビーコンの位相 [ms]
    yp = 40
    o.append(T(14, yp + 15, "パッシブ", "start", 11, SIG, True))
    o.append(T(14, yp + 29, "1 チャネル 106.4 ms", "start", 9, MUT))
    t = 0.0
    for n in range(1, 14):
        d = 104.4
        o.append(RECT(X(t), yp, d * S, 24, 2, soft(SIG) if n in aps else PAN, SIG if n in aps else LIN, 1.0))
        o.append(T(X(t) + d * S / 2, yp + 16, str(n), "middle", 9.5, SIG if n in aps else MUT, n in aps, True))
        if n in aps:
            o.append(RECT(X(t + aps[n]), yp - 7, 2.2 * S + 1, 9, 1, GLD, GLD, 0.8))
        t += 106.4
    o.append(T(X(1383.2) + 5, yp + 16, "1383 ms", "start", 10, SIG, True))
    ya = 96
    o.append(T(14, ya + 15, "アクティブ", "start", 11, PUR, True))
    o.append(T(14, ya + 29, "20 ms か 40 ms", "start", 9, MUT))
    t = 0.0
    for n in range(1, 14):
        d = 40.0 if n in aps else 20.0
        o.append(RECT(X(t), ya, d * S, 24, 2, soft(PUR) if n in aps else PAN, PUR if n in aps else LIN, 1.0))
        if n in aps:
            o.append(T(X(t) + d * S / 2, ya + 16, str(n), "middle", 9, PUR, True, True))
        t += d + 2
    o.append(T(X(346) + 5, ya + 16, "346 ms", "start", 10, PUR, True))
    o.append(W(x0, ya + 40, x1, ya + 40, c=MUT, lw=1.1))
    for tt in (0, 200, 400, 600, 800, 1000, 1200, 1400):
        o.append(W(X(tt), ya + 40, X(tt), ya + 44, c=MUT, lw=1))
        o.append(T(X(tt), ya + 56, str(tt), "middle", 9.5, MUT))
    o.append(T(x0, ya + 72, "時間 [ms]（13 チャネル。AP はチャネル 1・6・11 にいる。金色の印はビーコン）", "start", 9.5, MUT))
    # 下段左: パッシブの 1 チャネル
    yz = 206
    o.append(RECT(10, yz - 18, 330, 166, 8, "none", SIG, 1.0, dash="4 3"))
    o.append(T(20, yz, "パッシブの 1 チャネル（拡大）", "start", 10.5, SIG, True))
    zS = 1.4
    ZX = lambda tt: 80 + tt * zS
    yb = yz + 40
    o.append(DIM(ZX(-40), yb - 10, ZX(62.4), yb - 10, None, c=GLD))
    o.append(T(ZX(11.2), yb - 16, "T_B = 102.4 ms", "middle", 9.5, GLD, True))
    for tb in (-40.0, 62.4, 164.8):
        o.append(RECT(ZX(tb), yb, 2 * zS + 1.5, 12, 1, GLD, GLD, 0.8))
    o.append(T(ZX(164.8) - 4, yb + 10, "ビーコン", "end", 9.5, GLD))
    yw = yb + 22
    o.append(RECT(ZX(0), yw, 104.4 * zS, 26, 3, SSOFT, SIG, 1.2))
    o.append(T(ZX(52.2), yw + 17, "待つ時間 t_d", "middle", 10, SIG, True))
    o.append(W(ZX(62.4), yb + 12, ZX(62.4), yw, c=GLD, lw=1, dash="2 2"))
    o.append(T(20, yw + 46, "t_d ≥ T_B + t_b（ビーコン 1 つの時間）なら、", "start", 9.5, INK))
    o.append(T(20, yw + 60, "ビーコンの時刻がどこでも、必ず 1 つ丸ごと入る", "start", 9.5, INK))
    # 下段右: アクティブの 1 チャネル
    rx = 360
    o.append(RECT(rx - 10, yz - 18, 340, 166, 8, "none", PUR, 1.0, dash="4 3"))
    o.append(T(rx, yz, "アクティブの 1 チャネル（拡大）", "start", 10.5, PUR, True))
    aS = 6.0
    AX = lambda tt: rx + 50 + tt * aS
    ay = yz + 34
    o.append(T(rx + 44, ay + 15, "AP あり", "end", 9.5, PUR))
    o.append(RECT(AX(0), ay, 40 * aS, 22, 3, PSOFT, PUR, 1.1))
    o.append(RECT(AX(0), ay, 4, 22, 1, PUR, PUR, 0.6))
    for tr in (3.0, 5.5):
        o.append(RECT(AX(tr), ay + 6, 1.2 * aS, 10, 1, GLD, GLD, 0.6))
    o.append(T(AX(10), ay + 15, "応答（数 ms で届く）", "start", 9.5, GLD))
    o.append(T(AX(40), ay + 36, "最大 40 ms まで待つ", "end", 9.5, PUR))
    ay2 = ay + 52
    o.append(T(rx + 44, ay2 + 15, "AP なし", "end", 9.5, MUT))
    o.append(RECT(AX(0), ay2, 20 * aS, 22, 3, PAN, LIN, 1.1))
    o.append(RECT(AX(0), ay2, 4, 22, 1, PUR, PUR, 0.6))
    o.append(T(AX(20) + 6, ay2 + 15, "最小の 20 ms で次へ", "start", 9.5, MUT))
    o.append(T(rx, ay2 + 44, "左端の印がプローブ要求（SSID を空にして全員に尋ねる）", "start", 9.5, INK))
    return SVG(700, yz + 156, o, "パッシブスキャンとアクティブスキャンの時間（ビーコン間隔 102.4 ms、ビーコン 1 つを受ける時間 2 ms、チャネルの切り替え 2 ms、アクティブの最小 20 ms・最大 40 ms とした例）。パッシブはビーコンを待つので、どのチャネルでもビーコン間隔より長くかかる。アクティブは、AP のいないチャネルを短い時間で済ませられる。")
F["e09_scan"] = _f09_scan()

# ---- 3 節: 接続の手順 ----
def _f09_join():
    lanes = [("機器", SIG), ("AP", GLD), ("ルータ（DHCP のサーバ）", GLD)]
    msgs = [
        (0, 1, "プローブ要求（SSID = home）", {"c": PUR}),
        (1, 0, "プローブ応答", {"c": PUR, "dash": True}),
        ("span", 0, 2, "スキャン\n（2 節）", {"c": PUR, "side": -1}),
        (0, 1, "① 認証の要求", {"c": SIG}),
        (1, 0, "認証の応答（成功）", {"c": GLD}),
        (0, 1, "② アソシエーション要求", {"c": SIG, "sub": "SSID・速さ・暗号化の方式・リッスン間隔"}),
        (1, 0, "アソシエーション応答", {"c": GLD, "sub": "結果・AID = 5"}),
        (1, 0, "③ 4 ウェイハンドシェイク 1/4", {"c": TEA}),
        (0, 1, "2/4", {"c": TEA}),
        (1, 0, "3/4", {"c": TEA}),
        (0, 1, "4/4", {"c": TEA}),
        ("span", 0, 4, "鍵を確かめ、\n作る", {"c": TEA, "side": -1}),
        ("note", 0, "リンクアップ（08 章 7 節）", {"c": GRN}),
        (0, 2, "DHCP の DISCOVER …（08 章 3 節）", {"c": GRN, "dash": True}),
    ]
    s, h = seq(lanes, msgs, x=96, y=12, w=590, dy=30)
    o = [s]
    o.append(T(14, h + 26, "WPA3 では、① の認証のフレームで SAE のやり取りをする。宛先が 1 台のフレームには、受け手が ACK を返す（図では省いた）。", "start", 10, MUT))
    return SVG(700, h + 40, o, "AP につなぐ手順。スキャンで AP を見つけ、認証とアソシエーションで AP の一覧に加わり（AID を受け取る）、4 ウェイハンドシェイクで鍵を確かめて作る。4 ウェイハンドシェイクが終わるとリンクアップになり、08 章の DHCP を始める。家庭ではルータと AP が 1 つの箱のことが多いが、役割を分けて描いた。")
F["e09_join"] = _f09_join()

# ---- 3 節: PBKDF2 の計算の途中 ----
_F09_PB = {   # パスフレーズ "password"、SSID "IEEE"（Python の hashlib で計算した値）
    1: ["65090d43d50200c4f06aa6db32201cd0f7c6f90e", "7e2a5af5fc25118baf40ca6c8ab4c83bd2dfd75b",
        "d8975141b22d130905937e23255947d938d6bb1d", "c0ff793d9d74714785c45b7cae924b0ca235a048",
        "f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b"],
    2: ["e6c725690d69c6cac157e926dd1c2e544c5c5151", "7e1c66b1c916dd77eb0dca677f590241641f50e5",
        "caa659b9c36ed40d81ba57f6f58a16a5489d778e", "e284963a20d0cc07e3aef3842a9d559c639b317e",
        "135a70e23aed762e9710a12e4888f197a3680415"],
}
def _f09_hx(h, a=4, b=4):
    bs = [h[i:i + 2] for i in range(0, len(h), 2)]
    return " ".join(bs[:a]) + " … " + " ".join(bs[-b:])

def _f09_pbkdf2():
    o = []
    o.append(T(14, 22, "P = \"password\"（パスフレーズ。HMAC の鍵）、S = \"IEEE\"（SSID）", "start", 10.5, INK, True))
    cols = [(14, 1, SIG), (360, 2, PUR)]
    for x, i, c in cols:
        v = _F09_PB[i]
        o.append(T(x, 48, "ブロック %d: S の後に 00 00 00 %02X を付ける" % (i, i), "start", 10.5, c, True))
        rows = [("", "U1 = HMAC(P, S ‖ %d)" % i, v[0]), ("⊕", "U2 = HMAC(P, U1)", v[1]), ("⊕", "U3 = HMAC(P, U2)", v[2]),
                ("", "⋮（U4 〜 U4095 も同じく）", None), ("⊕", "U4096 = HMAC(P, U4095)", v[3])]
        y = 72
        for op, lab, hx in rows:
            if op:
                o.append(T(x + 6, y, op, "middle", 11, c, True))
            o.append(T(x + 18, y, lab, "start", 9.5, MUT))
            if hx:
                o.append(T(x + 330, y, _f09_hx(hx), "end", 9.5, INK, False, True))
            y += 20
        o.append(W(x + 14, y - 12, x + 332, y - 12, c=c, lw=1.4))
        o.append(T(x + 18, y + 4, "T%d（XOR した結果）" % i, "start", 10, c, True))
        o.append(T(x + 330, y + 4, _f09_hx(v[4]), "end", 9.5, c, True, True))
    o.append(T(14, 196, "PMK（32 バイト）= T1 の 20 バイト ‖ T2 の先頭 12 バイト（T2 の残り 8 バイトは使わない）", "start", 10.5, INK, True))
    x, y, u = 14, 210, 20.6
    pm = _F09_PB[1][4] + _F09_PB[2][4]
    for k in range(40):
        bb = pm[2 * k:2 * k + 2]
        c = SIG if k < 20 else (PUR if k < 32 else FNT)
        o.append(RECT(x + k * u * 0.82, y, u * 0.82 - 1, 22, 2, soft(c) if k < 32 else PAN, c, 1.0, dash=None if k < 32 else "2 2"))
        o.append(T(x + k * u * 0.82 + u * 0.41 - 0.5, y + 15, bb, "middle", 8.5, INK if k < 32 else FNT, False, True))
    o.append(T(14, y + 44, "f4 2c 6f c5 … 2e 83 fe 1b 13 5a 70 e2 … 97 10 a1 2e は、IEEE 802.11i に載っている例の値と一致する。", "start", 10, MUT))
    return SVG(700, y + 56, o, "PBKDF2 の計算の途中の値（パスフレーズ \"password\"、SSID \"IEEE\"。各 20 バイトのうち先頭と末尾の 4 バイトを示した）。U1 を作った後は、直前の値を入力にした HMAC を 4095 回繰り返し、4096 個の値をすべて XOR する。これを 2 つ作って、先頭の 32 バイトを PMK にする。")
F["e09_pbkdf2"] = _f09_pbkdf2()

# ---- 3 節: 4 ウェイハンドシェイク ----
def _f09_4way():
    lanes = [("機器", SIG), ("AP", GLD)]
    msgs = [
        ("note", 0, "PMK（パスフレーズと SSID から）", {"c": TEA}),
        ("space", -46),
        ("note", 1, "PMK（同じ計算で）", {"c": TEA}),
        (1, 0, "1/4  ANonce", {"c": GLD, "b": True}),
        ("note", 0, "SNonce を作る\nPTK = PMK・MAC × 2・ANonce・SNonce\nから HMAC-SHA1 で作る", {"c": SIG}),
        (0, 1, "2/4  SNonce ＋ 確認の値（KCK）", {"c": SIG, "b": True}),
        ("note", 1, "同じ計算で PTK を作り、確認の値を確かめる\n→ 機器は同じ PMK を持つ", {"c": GLD}),
        (1, 0, "3/4  GTK（KEK で暗号化）＋ 確認の値", {"c": GLD, "b": True}),
        ("note", 0, "確認の値を確かめる\n→ AP も同じ PMK を持つ", {"c": SIG}),
        (0, 1, "4/4  受け取った（確認の値）", {"c": SIG, "b": True}),
        ("note", 0, "TK・GTK を使い始める", {"c": GRN}),
        ("space", -44),
        ("note", 1, "TK・GTK を使い始める", {"c": GRN}),
    ]
    s, h = seq(lanes, msgs, x=10, y=12, w=440, dy=30)
    o = [s]
    # 右: 鍵の関係
    px = 470
    o.append(T(px, 30, "鍵の関係", "start", 11.5, INK, True))
    o.append(BOX(px, 42, 210, 34, "PMK 32 バイト", "電波に乗せない", TEA, TSOFT, TEA, sz=11, ssz=9))
    o.append(ARR(px + 105, 78, px + 105, 102, c=MUT, lw=1.3, head=6))
    o.append(T(px + 112, 94, "＋ 2 つの乱数・2 つの MAC", "start", 9, MUT))
    o.append(T(px, 120, "PTK 48 バイト（接続のたびに変わる）", "start", 10, SIG, True))
    for k, (nm, sub, c) in enumerate((("KCK", "確認の値の鍵", SIG), ("KEK", "鍵を包む鍵", SIG), ("TK", "フレームの暗号化", SIG))):
        xx = px + k * 72
        o.append(RECT(xx, 128, 68, 30, 3, SSOFT, SIG, 1.2))
        o.append(T(xx + 34, 148, nm, "middle", 10.5, SIG, True, True))
        o.append(T(xx + 34, 172, sub, "middle", 9, MUT))
        o.append(T(xx + 34, 186, "16 バイト", "middle", 8.5, MUT))
    o.append(BOX(px, 206, 210, 34, "GTK", None, GLD, GOSOFT, GLD, sz=11))
    o.append(T(px, 256, "AP が作る、全員あてのフレーム", "start", 9, MUT))
    o.append(T(px, 270, "（ブロードキャスト）の暗号化の鍵", "start", 9, MUT))
    return SVG(700, max(h + 24, 290), o, "4 ウェイハンドシェイク。PMK は送らず、2 つの乱数（ANonce・SNonce）と PMK から PTK を作り、PTK の一部（KCK）で付けた確認の値で、相手が同じ PMK を持つことを確かめ合う。3 つ目で AP は全員あての鍵 GTK を、KEK で暗号化して渡す。以後のデータは TK と GTK で暗号化する。")
F["e09_4way"] = _f09_4way()

# ---- 3 節: 辞書攻撃（WPA2 と WPA3） ----
def _f09_dict():
    o = []
    for k, (title, c, ok) in enumerate((("WPA2-PSK: 記録すれば、手元で何度でも試せる", ALI, False),
                                        ("WPA3-SAE: 記録しても、手元では試せない", GRN, True))):
        x = 14 + k * 346
        o.append(T(x, 22, title, "start", 11, c, True))
        o.append(BOX(x, 36, 84, 32, "機器", None, SIG, SSOFT, SIG, sz=10.5))
        o.append(BOX(x + 226, 36, 84, 32, "AP", None, GLD, GOSOFT, GLD, sz=10.5))
        o.append(DARR(x + 88, 52, x + 222, 52, c=MUT, lw=1.4))
        o.append(T(x + 155, 46, "4 ウェイハンドシェイク" if not ok else "SAE（認証のフレーム）", "middle", 9.5, MUT))
        o.append(BOX(x + 104, 90, 104, 32, "攻撃者", "近くで記録する", ALI, ASOFT, ALI, sz=10, ssz=8.5))
        o.append(ARR(x + 156, 70, x + 156, 88, c=ALI, lw=1.3, head=6))
        if not ok:
            lines = [("記録: 2 つの乱数・MAC・確認の値", INK),
                     ("手元の計算機で、候補ごとに", INK),
                     ("PMK → PTK → 確認の値 を計算して比べる", INK),
                     ("12345678 → 合わない", MUT), ("password1 → 合わない", MUT), ("home2024 → 一致", ALI)]
        else:
            lines = [("記録からは、候補が正しいかを", INK),
                     ("確かめる手がかりが得られない", INK),
                     ("試すには AP と実際にやり取りする", INK),
                     ("（1 回のやり取りで 1 つの候補）", MUT),
                     ("後でパスワードが漏れても、", INK),
                     ("記録した通信は復号できない", INK)]
        yy = 144
        for s_, cc in lines:
            o.append(T(x + 8, yy, s_, "start", 10, cc, cc == ALI))
            yy += 17
        o.append(RECT(x, 128, 326, 112, 8, "none", c, 1.2, dash="4 3"))
    return SVG(700, 252, o, "WPA2-PSK と WPA3-SAE の、辞書攻撃（ありそうな候補を順に試す攻撃）への強さ。WPA2-PSK では、記録した 4 ウェイハンドシェイクと候補から計算した値を比べられるので、AP に気づかれずに何度でも試せる。WPA3-SAE では、候補を試すたびに AP とのやり取りが要る。")
F["e09_dict"] = _f09_dict()

# ---- 4 節: 省電力モードの時間軸 ----
def _f09_ps():
    o = []
    X = lambda k: 96 + k * 92.0          # k 番目のビーコンの位置（102.4 ms ごと。縮尺どおりではない）
    yA, yD = 92, 204                      # AP の行、機器の行（眠りの線）
    o.append(T(14, yA + 4, "AP", "start", 11, GLD, True))
    o.append(T(14, yD - 8, "機器", "start", 11, SIG, True))
    o.append(T(14, yD + 6, "（電流）", "start", 9, MUT))
    o.append(W(80, yA, 690, yA, c=FNT, lw=1))
    cnt = [0, 2, 1, 0, 2, 1, 0]
    for k in range(7):
        dt = cnt[k] == 0
        o.append(RECT(X(k) - 4, yA - 18, 8, 18, 1, GLD if dt else GOSOFT, GLD, 1.0))
        o.append(T(X(k), yA + 13, str(cnt[k]), "middle", 9, GLD, dt, True))
        if dt:
            o.append(T(X(k), yA - 24, "DTIM", "middle", 9.5, GLD, True))
        else:
            o.append(W(X(k), yA + 44, X(k), yD - 4, c=FNT, lw=1, dash="2 3"))
    # 届くフレームと、AP が預かる時間
    xa = 128
    o.append(ARR(xa, 30, xa, yA - 22, c=SIG, lw=1.4, head=6))
    o.append(T(xa + 6, 34, "機器あてのフレームがルータから届く", "start", 9.5, SIG))
    o.append(RECT(xa, yA + 22, X(3) - xa, 18, 2, SSOFT, SIG, 1.0))
    o.append(T((xa + X(3)) / 2, yA + 35, "AP が預かる（TIM の AID 5 が 1）", "middle", 9.5, SIG))
    xb = X(3) + 46
    o.append(ARR(xb, 30, xb, yA - 22, c=PUR, lw=1.4, head=6))
    o.append(T(xb + 6, 34, "ARP の要求（全員あて）が届く", "start", 9.5, PUR))
    o.append(RECT(xb, yA + 22, X(6) - xb, 18, 2, PSOFT, PUR, 1.0))
    o.append(T((xb + X(6)) / 2, yA + 35, "次の DTIM まで預かる", "middle", 9.5, PUR))
    # 機器の電流の形（眠り・ビーコンの時だけ起きる）
    hi = yD - 34
    pts = [(80, yD)]
    for k, wdt in ((0, 7), (3, 18), (6, 18)):
        xx = X(k) - 5
        pts += [(xx, yD), (xx, hi), (xx + wdt, hi), (xx + wdt, yD)]
    pts.append((690, yD))
    o.append(PL(pts, c=SIG, lw=2))
    o.append(T(X(0) + 10, hi + 4, "起きてビーコンを受ける", "start", 9.5, SIG))
    o.append(T(X(3) + 16, hi + 12, "PS-Poll で受け取る", "start", 9.5, SIG))
    o.append(T(X(6) - 8, hi + 4, "全員あてを受ける", "end", 9.5, PUR))
    o.append(T(X(1) + 46, yD - 6, "眠る（ビーコンを聞かない）", "middle", 9, MUT))
    o.append(DIM(X(0), yD + 16, X(3), yD + 16, None, c=TEA))
    o.append(T((X(0) + X(3)) / 2, yD + 31, "DTIM 周期 3 × 102.4 ms = 307.2 ms ごとに起きる", "middle", 9.5, TEA))
    # 下: k = 3 の拡大
    yz = yD + 54
    o.append(RECT(14, yz, 672, 96, 8, "none", SIG, 1.0, dash="4 3"))
    o.append(T(24, yz + 18, "拡大（DTIM の 1 回分。縮尺どおりではない）", "start", 10, SIG, True))
    steps = [("ビーコン", "TIM: AID 5 = 1", GLD, 0), ("PS-Poll", "「送って」", SIG, 1), ("データ", "More Data = 0", GLD, 0), ("ACK", None, SIG, 1)]
    xx = 70
    for nm, sub, c, row in steps:
        yy = yz + 32 + row * 30
        o.append(RECT(xx, yy, 104, 24, 3, soft(c), c, 1.2))
        o.append(T(xx + 52, yy + 16, nm, "middle", 10, c, True))
        if sub:
            o.append(T(xx + 110, yy + 16, sub, "start", 9, MUT))
        xx += 140
    o.append(T(60, yz + 48, "AP", "end", 9.5, GLD, True))
    o.append(T(60, yz + 78, "機器", "end", 9.5, SIG, True))
    o.append(T(xx - 20, yz + 78, "→ 眠る", "start", 10, SIG, True))
    return SVG(700, yz + 104, o, "省電力モードの時間軸（DTIM 周期 3 の例。AID 5 の機器）。ビーコンの下の数字は、TIM に入っている「次の DTIM までのビーコンの数」。機器は DTIM のビーコンの時だけ起きる。AP は、眠っている機器あてのフレームを預かり、TIM でそのことを知らせる。機器は PS-Poll を送って受け取る。全員あてのフレーム（ARP の要求など）は、DTIM のビーコンの直後にまとめて送られる。")
F["e09_ps"] = _f09_ps()

# ---- 4 節: TIM の中身 ----
def _f09_timbits(x, y, byte_no, val, hl, c):
    """部分ビットマップの 1 バイト（b7〜b0）と、各ビットの AID。"""
    o = []
    o.append(T(x - 8, y + 16, "全体の %d バイト目 = %02X" % (byte_no, val), "end", 9.5, INK, True, False))
    for i in range(8):
        b = 7 - i
        aid = byte_no * 8 + b
        on = (val >> b) & 1
        xx = x + i * 30
        o.append(RECT(xx, y, 28, 22, 2, soft(c) if on else PAN, c if on else LIN, 1.4 if on else 1.0))
        o.append(T(xx + 14, y + 15, str(on), "middle", 10.5, c if on else MUT, bool(on), True))
        o.append(T(xx + 14, y + 36, ("(%d)" % aid) if aid == 0 else str(aid), "middle", 9, c if aid in hl else (FNT if aid == 0 else MUT), aid in hl))
    o.append(T(x + 8 * 30 + 6, y + 36, "← AID", "start", 9, MUT))
    return "".join(o)

def _f09_tim():
    o = []
    o.append(T(14, 22, "例 1: AID 3 と 13 の機器あてのフレームを預かっている", "start", 11, SIG, True))
    f1 = [("ID", 1, "05"), ("長さ", 1, "05"), ("DTIM の数", 2, "00"), ("DTIM 周期", 2, "03"), ("ビットマップ制御", 3, "00"), ("部分ビットマップ", 3, "08 20")]
    o.append(_f09_fieldrow(40, 48, f1, 40, 24, GLD))
    o.append(_f09_timbits(250, 100, 0, 0x08, (3, 13), SIG))
    o.append(_f09_timbits(250, 146, 1, 0x20, (3, 13), SIG))
    o.append(T(250, 200, "AID k のビット: k ÷ 8 バイト目（整数の割り算）の、下から k % 8 ビット目", "start", 9.5, INK))
    y2 = 238
    o.append(T(14, y2, "例 2: AID 130 の機器あて（0 でないバイトの範囲だけを送る）", "start", 11, PUR, True))
    f2 = [("ID", 1, "05"), ("長さ", 1, "04"), ("DTIM の数", 2, "00"), ("DTIM 周期", 2, "03"), ("ビットマップ制御", 3, "10"), ("部分ビットマップ", 3, "04")]
    o.append(_f09_fieldrow(40, y2 + 26, f2, 40, 24, GLD))
    lines = ["ビットマップ制御 0x10 = 0b0001_0000：上位 7 ビットは 8 → 部分ビットマップの先頭は全体の 8 × 2 = 16 バイト目",
             "部分ビットマップ 04 = 0b0000_0100：16 バイト目の下から 2 ビット目 → AID = 16 × 8 + 2 = 130",
             "0〜15 バイト目はすべて 0 なので送らない（16 バイト分短くなる）。最下位ビットは、全員あてを預かっているときに 1"]
    for i, l in enumerate(lines):
        o.append(T(40, y2 + 86 + i * 18, l, "start", 9.5, INK if i < 2 else MUT))
    return SVG(700, y2 + 86 + 3 * 18 + 6, o, "TIM の要素のバイト。AID ごとに 1 ビットを割り当てた最大 251 バイトのビットの並びのうち、0 でないバイトを含む範囲（部分ビットマップ）だけを送り、その先頭の位置をビットマップ制御に入れる。各ビットの下の数が AID。AID 0 のビットは使わない。")
F["e09_tim"] = _f09_tim()

# ---- 4 節: 電流の形と平均電流 ----
_F09_IS, _F09_IA, _F09_TA = 0.1, 50.0, 3.0          # mA, mA, ms（代表値）
_F09_QK, _F09_TK = 2.4, 60.0                         # mC, s
def _f09_avg(D):
    return _F09_IS + (_F09_IA - _F09_IS) * _F09_TA / (D * _F09_TB), _F09_QK / _F09_TK

def _f09_current():
    o = []
    o.append(T(14, 20, "電流の形（0〜1.2 秒。縮尺どおりではない）", "start", 10.5, INK, True))
    o.append(T(470, 20, "平均電流の内訳 [mA]", "start", 10.5, INK, True))
    x0, x1 = 80, 440
    Xt = lambda t: x0 + t / 1200.0 * (x1 - x0)
    rows = [(1, 52.0), (3, 132.8), (10, 291.2)]
    scale = 135 / 1.7
    for i, (D, life) in enumerate(rows):
        y = 52 + i * 62
        o.append(T(14, y + 4, "DTIM %d" % D, "start", 10.5, SIG, True))
        base, top = y + 14, y - 14
        pts = [(x0, base)]
        t = 0.0
        while t <= 1200:
            xx = Xt(t)
            pts += [(xx, base), (xx, top), (xx + 3, top), (xx + 3, base)]
            t += D * _F09_TB
        pts.append((x1, base))
        o.append(PL(pts, c=SIG, lw=1.6))
        avg, kp = _f09_avg(D)
        tot = avg + kp
        xb = 470
        segs = [(_F09_IS, GRN), (avg - _F09_IS, SIG), (kp, TEA)]
        xx = xb
        for v, c in segs:
            o.append(RECT(xx, y - 10, v * scale, 18, 2, soft(c), c, 1.0))
            xx += v * scale
        o.append(T(xx + 6, y + 3, "%.2f" % tot, "start", 10, INK, True))
        o.append(T(xb, y + 24, "寿命 %.0f 日・遅れ最大 %.2f 秒" % (life, D * _F09_TB / 1000), "start", 9, MUT))
    o.append(LEGEND(470, 236, [(GRN, "眠り"), (SIG, "ビーコン"), (TEA, "キープアライブ")], sz=9.5, gap=10))
    o.append(T(14, 250, "1 回起きる: 50 mA × 3 ms、眠り 100 µA、キープアライブ 2.4 mC / 60 秒、電池 2000 mAh（代表値の例）", "start", 9.5, MUT))
    return SVG(700, 262, o, "DTIM 周期を変えたときの電流の形と平均電流（例の値）。機器は DTIM ごとにビーコンを受けるために起きる。DTIM 周期を 3 倍にすると、ビーコンの分の平均電流は 1/3 になるが、眠っている間の電流とキープアライブの分は変わらないので、合計の減り方は小さくなっていく。")
F["e09_current"] = _f09_current()

# ---- 4 節: つなぎ続けるか、送るときだけつなぐか ----
def _f09_stay():
    o = []
    Id, Qc = 0.005, 150.0                     # mA, mC
    p = Plot(90, 22, 560, 220, (10, 86400), (0.003, 30), xlog=True, ylog=True)
    xt = [10, 60, 600, 3600, 86400]
    xf = {10: "10 秒", 60: "1 分", 600: "10 分", 3600: "1 時間", 86400: "1 日"}
    o.append(p.axes(xl="測定値を送る間隔 T_r", yl="平均電流 [mA]", xt=xt, yt=[0.01, 0.1, 1, 10],
                    xfmt=lambda v: xf[v], yfmt=lambda v: "%g" % v))
    pts = []
    for k in range(81):
        t = 10 ** (1 + k * (math.log10(86400) - 1) / 80)
        pts.append((t, Id + Qc / t))
    o.append(p.line(pts, c=PUR, lw=2.4))
    for dt, c, lab, side in ((3, GLD, "DTIM 3", -1), (10, SIG, "DTIM 10", 1)):
        avg, kp = _f09_avg(dt)
        IA = avg + kp
        o.append(p.line([(10, IA), (86400, IA)], c=c, lw=2))
        o.append(T(p.X(86400) - 4, p.Y(IA) - 6, "つなぎ続ける（%s）%.3f mA" % (lab, IA), "end", 9.5, c, True))
        Ts = Qc / (IA - Id)
        o.append(W(p.X(Ts), p.Y(0.003), p.X(Ts), p.Y(IA), c=c, lw=1, dash="3 3"))
        o.append(D(p.X(Ts), p.Y(IA), c, 4.2))
        o.append(T(p.X(Ts) + side * 5, p.Y(0.0055), "T_r* ≈ %.0f 秒" % Ts, "start" if side > 0 else "end", 9.5, c, True))
    o.append(T(p.X(24), p.Y(14), "送るときだけつなぐ: I_d + Q_c / T_r", "start", 9.5, PUR, True))
    o.append(D(p.X(3600), p.Y(Id + Qc / 3600), PUR, 4.2))
    o.append(T(p.X(3600) + 6, p.Y(Id + Qc / 3600) + 14, "1 時間ごと: %.3f mA" % (Id + Qc / 3600), "start", 9.5, PUR, True))
    return SVG(700, 292, o, "測定値を送る間隔と平均電流（例の値: 1 回の接続 150 mC、深い眠り 5 µA。つなぎ続ける場合はキープアライブ 60 秒を含む。両軸とも対数目盛）。送る間隔が T_r* より長ければ、送るときだけつなぐほうが平均電流は小さい。ただし、その間はサーバから機器へ何も届かない。")
F["e09_stay"] = _f09_stay()

# ---- 5 節: 切断を知る 3 つの道 ----
def _f09_lost():
    o = []
    pw = 222
    titles = [("(a) 切断の通知", GLD), ("(b) ビーコンロス", ALI), ("(c) AP による切り離し", PUR)]
    for i, (tt, c) in enumerate(titles):
        x = 12 + i * (pw + 6)
        o.append(RECT(x, 8, pw, 236, 8, "none", c, 1.1, dash="4 3"))
        o.append(T(x + 10, 28, tt, "start", 11, c, True))
        o.append(T(x + 10, 60, "AP", "start", 10, GLD, True))
        o.append(T(x + 10, 128, "機器", "start", 10, SIG, True))
        o.append(W(x + 46, 56, x + pw - 10, 56, c=FNT, lw=1))
        o.append(W(x + 46, 124, x + pw - 10, 124, c=FNT, lw=1))
    # (a)
    x = 12
    o.append(ARR(x + 110, 60, x + 110, 118, c=GLD, lw=1.6, head=7))
    o.append(T(x + 116, 84, "認証解除", "start", 9.5, GLD, True))
    o.append(T(x + 116, 98, "（理由 3）", "start", 9.5, GLD))
    lines_a = ["すぐに分かる。", "理由の番号で、次に", "することを決める", "（偽の通知は PMF で防ぐ）"]
    # (b)
    xb = 12 + pw + 6
    for k in range(7):
        xx = xb + 56 + k * 22
        if k < 2:
            o.append(RECT(xx - 3, 44, 6, 12, 1, GLD, GLD, 0.8))
            o.append(D(xx, 124, GRN, 3.4))
        else:
            o.append(RECT(xx - 3, 44, 6, 12, 1, "none", FNT, 0.8, dash="2 2"))
            o.append(T(xx, 128, "×", "middle", 11, ALI, True))
            o.append(T(xx, 144, str(k - 1), "middle", 9, ALI, False, True))
    o.append(T(xb + 100, 80, "電源が切れた", "middle", 9.5, ALI, True))
    o.append(W(xb + 89, 40, xb + 89, 64, c=ALI, lw=1.6))
    o.append(T(xb + pw - 10, 160, "N 回で切断と判断", "end", 9.5, ALI, True))
    lines_b = ["通知は来ない。聞くはずの", "ビーコンが続けて来ないことで", "気づく。気づくまで N D T_B"]
    # (c)
    xc = 12 + 2 * (pw + 6)
    o.append(T(xc + 50, 78, "長い間、何も来ない", "start", 9, PUR))
    o.append(T(xc + 50, 92, "→ 一覧から外す", "start", 9, PUR))
    o.append(ARR(xc + 170, 120, xc + 170, 62, c=SIG, lw=1.4, head=6))
    o.append(T(xc + 164, 114, "データを送る", "end", 9, SIG))
    o.append(ARR(xc + 192, 62, xc + 192, 120, c=GLD, lw=1.4, head=6))
    o.append(T(xc + 198, 150, "認証解除（理由 7）", "end", 9, GLD, True))
    lines_c = ["次に送るまで気づかない。", "定期的に送れば（キープ", "アライブ）一覧に残る"]
    for x, ls, c in ((12, lines_a, GLD), (xb, lines_b, ALI), (xc, lines_c, PUR)):
        for j, l in enumerate(ls):
            o.append(T(x + 10, 182 + j * 16, l, "start", 9.5, INK))
    return SVG(700, 252, o, "機器が、AP とのつながりが切れたことを知る 3 つの道。(a) AP が理由の番号付きの通知を送る。(b) AP が消えると通知は来ないので、ビーコンが N 回続けて受け取れないことで判断する。(c) AP が黙って機器を一覧から外した場合は、機器が次にデータを送ったときに初めて分かる。")
F["e09_lost"] = _f09_lost()

# ---- 5 節: ビーコンロスの判定と、誤った判断の回数 ----
def _f09_bloss():
    o = []
    o.append(T(14, 20, "数え方（N = 5）: 受け取れなければ 1 増やし、受け取れたら 0 に戻す", "start", 10.5, INK, True))
    seq_ = "oxxoooxxxxoxoooxxxxx"
    x0, dx = 40, 32
    c_ = 0
    for k, ch in enumerate(seq_):
        xx = x0 + k * dx
        if ch == "o":
            c_ = 0
            o.append(D(xx, 44, GRN, 5))
        else:
            c_ += 1
            o.append(T(xx, 49, "×", "middle", 14, ALI, True))
        o.append(T(xx, 68, str(c_), "middle", 10, ALI if c_ >= 5 else (MUT if c_ == 0 else INK), c_ >= 5, True))
    xe = x0 + (len(seq_) - 1) * dx
    o.append(T(xe + 4, 88, "5 回続けて → 切断と判断", "end", 10, ALI, True))
    o.append(T(14, 88, "（○ 受け取れた、× 失われた。下の数は数えている値）", "start", 9.5, MUT))
    # グラフ
    p = Plot(90, 124, 470, 200, (1, 15), (1e-6, 1e4), ylog=True)
    o.append(p.axes(xl="切断と判断する回数 N（下）と、AP が消えてから気づくまでの時間（上、N × 102.4 ms）",
                    yl="1 日の誤った判断の回数", xt=[1, 3, 5, 7, 9, 11, 13, 15], yt=[1e-6, 1e-4, 1e-2, 1, 100, 1e4],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: {1e-6: "10⁻⁶", 1e-4: "10⁻⁴", 1e-2: "0.01", 1: "1", 100: "100", 1e4: "10⁴"}[v]))
    for N in (5, 10, 15):
        o.append(T(p.X(N), p.y - 6, "%.1f 秒" % (N * 0.1024), "middle", 9, TEA))
    n = 86400 / 0.1024
    for pp, c in ((0.01, GRN), (0.05, SIG), (0.10, GLD), (0.20, ALI)):
        pts = []
        for k in range(0, 141):
            N = 1 + k * 0.1
            v = n * (1 - pp) * pp ** N
            if 1e-6 <= v <= 1e4:
                pts.append((N, v))
        o.append(p.line(pts, c=c, lw=2))
        Nl = max(N for N, v in pts)
        lab_N = min(Nl, 14.6)
        vv = n * (1 - pp) * pp ** lab_N
        o.append(T(p.X(lab_N) + 4, p.Y(max(vv, 1e-6)) - 4, "p = %d %%" % round(pp * 100), "start", 9.5, c, True))
    for v, lab in ((1, "1 日に 1 回"), (1 / 365.0, "1 年に 1 回")):
        o.append(p.line([(1, v), (15, v)], c=MUT, lw=1, dash="4 3"))
        o.append(T(p.X(15) + 6, p.Y(v) + 4, lab, "start", 9.5, MUT))
    return SVG(700, 368, o, "ビーコンロスの数え方と、AP が生きているのに切断と判断してしまう 1 日の回数 n(1 − p)p^N（ビーコンを 102.4 ms ごとに聞き、それぞれが互いに関係なく確率 p で失われる場合）。N を 1 増やすたびに回数は p 倍になり、気づくまでの時間は 102.4 ms 延びる。")
F["e09_bloss"] = _f09_bloss()

# ---- 5 節: つなぎ直しの状態機械 ----
def _f09_reconn():
    o = []
    o.append(STATE(120, 52, 170, 44, "つながっている", GRN, "リンクアップ・サーバに接続済み"))
    o.append(STATE(400, 52, 210, 44, "DHCP から接続まで", GRN, "前のアドレスで REQUEST（08 章）"))
    o.append(STATE(120, 190, 170, 44, "待つ", TEA, "指数バックオフ + ジッタ"))
    o.append(STATE(370, 190, 170, 44, "前の AP につなぐ", SIG, "前のチャネル・BSSID だけ"))
    o.append(STATE(600, 190, 160, 44, "全部のチャネル", SIG, "スキャンしてつなぐ"))
    o.append(STATE(600, 310, 170, 44, "設定を受け付ける", PUR, "6 節。利用者に知らせる"))
    o.append(EDGE(120, 76, 120, 166, None, 0, ALI))
    o.append(T(130, 114, "ビーコンロス・切断の通知", "start", 9.5, ALI))
    o.append(T(130, 128, "→ TCP を閉じる", "start", 9.5, ALI))
    o.append(EDGE(205, 190, 283, 190, "時間が来た", 0, MUT, loff=(0, -6)))
    o.append(EDGE(370, 166, 380, 76, "リンクアップ", 0, GRN, loff=(-34, 0), lc=GRN))
    o.append(EDGE(455, 190, 518, 190, "見つからない", 0, MUT, loff=(0, -6)))
    o.append(EDGE(580, 166, 470, 76, "リンクアップ", 0, GRN, loff=(36, 6), lc=GRN))
    o.append(EDGE(295, 52, 207, 52, "サーバにつながった", 0, GRN, loff=(0, -6), lc=GRN))
    o.append(EDGE(600, 214, 130, 214, "失敗 → 次は 2 倍待つ", 0.12, MUT, loff=(0, 34)))
    o.append(EDGE(640, 214, 640, 286, None, 0, PUR))
    o.append(T(632, 250, "理由 15 が K 回続く", "end", 9.5, PUR))
    return SVG(700, 344, o, "Wi-Fi のつなぎ直しの状態機械（05 章 1 節の形）。切れたら TCP を閉じ、バックオフとジッタで待ってから、前の AP のチャネルだけを調べてつなぐ。見つからなければ全部のチャネルを調べる。パスフレーズの誤りを示す理由 15 が続いたら、つなぎ直しを止めて設定を受け付ける状態に移る。リンクアップの後は 08 章 7 節の手順に戻る。")
F["e09_reconn"] = _f09_reconn()

# ---- 6 節: プロビジョニングの 3 つの方法 ----
def _f09_prov():
    o = []
    cols = [("SoftAP", "機器が AP になる", "Wi-Fi（機器の AP）",
             ["スマートフォンを機器の AP に", "つなぎ替える", "機器の AP を WPA2 に（ラベルの", "パスワード）するか公開鍵で暗号化", "結果は AP とステーションを同時に", "動かせれば返せる"]),
            ("BLE", "機器が BLE で知らせる", "BLE（GATT に書く）",
             ["アプリで機器を選ぶ", "（Wi-Fi はつないだまま）", "ペアリング（20 章）か", "アプリでの暗号化", "結果は同じ BLE の接続で", "返せる"]),
            ("QR コード（DPP）", "ラベルに公開鍵", "Wi-Fi（DPP の手順）",
             ["ラベルの QR コードを読む", "", "読んだ公開鍵で機器を確かめ、", "暗号化して渡す", "機器と設定する側の両方の", "対応が要る"])]
    for i, (nm, sub, path, notes) in enumerate(cols):
        x = 12 + i * 228
        o.append(RECT(x, 8, 220, 300, 8, "none", PUR, 1.0, dash="4 3"))
        o.append(T(x + 110, 28, nm, "middle", 12, PUR, True))
        o.append(BOX(x + 10, 42, 84, 40, "スマホ", None, PUR, PSOFT, PUR, sz=10.5))
        o.append(BOX(x + 126, 42, 84, 40, "機器", sub, SIG, SSOFT, SIG, sz=10.5, ssz=8))
        o.append(ARR(x + 96, 62, x + 124, 62, c=PUR, lw=1.6, head=6))
        o.append(T(x + 10, 102, path + " で", "start", 9.5, PUR, True))
        o.append(T(x + 10, 116, "SSID とパスフレーズを渡す", "start", 9, MUT))
        o.append(BOX(x + 126, 126, 84, 34, "家の AP", None, GLD, GOSOFT, GLD, sz=10.5))
        o.append(ARR(x + 168, 84, x + 168, 124, c=SIG, lw=1.4, head=6, dash="4 3"))
        o.append(T(x + 160, 108, "つなぐ", "end", 9, SIG))
        heads = ["利用者がすること", "守り方", "結果を返せるか"]
        for j in range(3):
            yy = 184 + j * 42
            o.append(T(x + 10, yy, heads[j], "start", 9.5, PUR, True))
            o.append(T(x + 10, yy + 15, notes[2 * j], "start", 9, INK))
            if notes[2 * j + 1]:
                o.append(T(x + 10, yy + 29, notes[2 * j + 1], "start", 9, INK))
    return SVG(700, 316, o, "Wi-Fi の設定（SSID とパスフレーズ）を、画面の無い機器にスマートフォンから渡す 3 つの方法。どれも、渡す経路を暗号化し、機器が家の AP につなげたかどうかを利用者に返すことが大切である。")
F["e09_prov"] = _f09_prov()

# ---- 6 節: SoftAP の流れ ----
def _f09_softap():
    lanes = [("スマートフォン", PUR), ("機器", SIG), ("家の AP", GLD)]
    msgs = [
        ("note", 1, "AP を始める（SENSOR-1A2B、WPA2）", {"c": SIG}),
        (0, 1, "機器の AP につなぐ（ラベルのパスワード）", {"c": PUR}),
        (0, 1, "近くの AP の一覧を求める（HTTP）", {"c": PUR}),
        (1, 0, "スキャンの結果（2 節）", {"c": SIG, "dash": True}),
        (0, 1, "SSID = home、パスフレーズ", {"c": PUR, "b": True}),
        (1, 2, "接続を試す（3 節の手順）", {"c": SIG}),
        (2, 1, "4 ウェイハンドシェイク成功", {"c": GLD, "dash": True}),
        (1, 0, "結果: つながった", {"c": GRN, "b": True}),
        ("note", 1, "保存して、AP をやめる", {"c": GRN}),
        (0, 2, "スマートフォンは家の AP に戻る", {"c": PUR, "dash": True}),
    ]
    s, h = seq(lanes, msgs, x=10, y=12, w=680, dy=30)
    return SVG(700, h + 20, [s], "SoftAP でのプロビジョニングの流れ。機器は一時的に AP になり、スマートフォンから家の SSID とパスフレーズを受け取る。AP とステーションを同時に動かせる SoC なら、自分の AP を保ったまま家の AP への接続を試し、結果をスマートフォンに返してから AP をやめられる。")
F["e09_softap"] = _f09_softap()

# ---- 6 節: 受け取った設定の扱い（悪い例と良い例） ----
def _f09_prov_sm():
    o = []
    o.append(T(14, 22, "悪い例: 確かめずに保存する", "start", 11, ALI, True))
    o.append(T(366, 22, "良い例: つながってから保存し、結果を返す", "start", 11, GRN, True))
    # 悪い例
    o.append(STATE(150, 62, 170, 36, "設定を受け取る", PUR))
    o.append(STATE(150, 132, 180, 36, "すぐ保存して通常へ", ALI))
    o.append(STATE(150, 202, 220, 36, "つながらない（打ち間違い）", ALI))
    o.append(EDGE(150, 80, 150, 113, None, 0, MUT))
    o.append(EDGE(150, 150, 150, 183, None, 0, MUT))
    o.append(T(150, 244, "設定を受け付けないので、やり直せない。", "middle", 9.5, ALI))
    o.append(T(150, 260, "利用者には何が悪いのか分からない", "middle", 9.5, ALI))
    # 良い例
    o.append(STATE(530, 62, 170, 36, "設定を受け取る", PUR))
    o.append(STATE(530, 132, 170, 36, "家の AP で試す", SIG))
    o.append(STATE(450, 202, 140, 36, "理由を返す", GLD))
    o.append(STATE(620, 202, 140, 36, "保存して通常へ", GRN))
    o.append(EDGE(530, 80, 530, 113, None, 0, MUT))
    o.append(EDGE(560, 150, 600, 183, None, 0, GRN))
    o.append(T(590, 162, "成功", "start", 9.5, GRN))
    o.append(EDGE(500, 150, 470, 183, None, 0, GLD))
    o.append(T(478, 162, "失敗", "end", 9.5, GLD))
    o.append(EDGE(395, 184, 445, 70, None, -0.12, GLD))
    o.append(T(392, 118, "設定を", "end", 9.5, GLD))
    o.append(T(392, 132, "受け付けたまま", "end", 9.5, GLD))
    o.append(EDGE(620, 220, 620, 250, None, 0, MUT))
    o.append(T(560, 266, "ボタンの長押しで、保存した設定を消して最初に戻る", "middle", 9.5, MUT))
    return SVG(700, 280, o, "受け取った Wi-Fi の設定の扱い。左は、確かめる前に保存して設定を受け付けない状態に移るので、パスフレーズを打ち間違えると機器が二度とつながらない。右は、家の AP につながることを確かめてから保存し、失敗したら理由を返して設定を受け付けたままにする。")
F["e09_prov_sm"] = _f09_prov_sm()
