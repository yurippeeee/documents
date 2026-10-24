# -*- coding: utf-8 -*-
# 07 章 階層とカプセル化 の図
# 層の色: アプリケーション層 PUR、TLS TEA、トランスポート層 GRN、ネットワーク層 GLD、リンク層 SIG、物理層 MUT

def _f07_brace(x1, x2, y, label, c=MUT, up=False, sz=9.5, tc=None):
    """水平の括弧（x1〜x2）と文字。up=True で文字を上に置く。"""
    d = -5 if up else 5
    o = W(x1, y - d, x1, y, x2, y, x2, y - d, c=c, lw=1.2)
    if label:
        o += T((x1 + x2) / 2, y - 6 if up else y + sz + 4, label, "middle", sz, tc or c)
    return o

# ---- 1 節: 4 つの層 ----
def _f07_layers4():
    o = []
    L = [("アプリケーション層", "意味のあるデータにする", "トピック・URL など（13・14 章）", PUR),
         ("トランスポート層", "機器の中のどのプログラムへ。確実さ（TCP）", "ポート番号（4 節）", GRN),
         ("ネットワーク層", "宛先の機器まで。途中はルータが中継", "IP アドレス（3 節）", GLD),
         ("リンク層", "同じリンクの隣の機器まで（物理層を含む）", "MAC アドレス（2 節）", SIG)]
    ys = [46, 116, 174, 232]
    lh = 50
    xa, wa = 20, 268
    xb, wb = 300, 178
    xc, wc = 540, 150
    o.append(T(xa + wa / 2, 24, "インターネットの 4 つの層", "middle", 11.5, INK, True))
    o.append(T(xb + wb / 2, 24, "宛先を表すもの", "middle", 11.5, INK, True))
    o.append(T(xc + wc / 2, 24, "OSI の 7 層（名前だけ）", "middle", 11.5, INK, True))
    osi = ["7 アプリケーション層", "6 プレゼンテーション層", "5 セッション層", "4 トランスポート層",
           "3 ネットワーク層", "2 データリンク層", "1 物理層"]
    oh, og = 28, 7.67
    oy = [46 + k * (oh + og) for k in range(7)]
    groups = [(0, 2), (3, 3), (4, 4), (5, 6)]
    for i, (name, job, addr, c) in enumerate(L):
        y = ys[i]
        g0, g1 = groups[i]
        o.append(PL([(xb + wb, y + 3), (xb + wb, y + lh - 3), (xc, oy[g1] + oh), (xc, oy[g0])], c="none", lw=0, fill=soft(c), op=0.8))
        o.append(RECT(xa, y, wa, lh, 6, soft(c), c, 1.3))
        o.append(T(xa + 12, y + 20, name, "start", 12, c, True))
        o.append(T(xa + 12, y + 38, job, "start", 10, INK))
        o.append(RECT(xb, y, wb, lh, 6, PAN, c, 1.3))
        o.append(T(xb + wb / 2, y + lh / 2 + 4, addr, "middle", 10.5, c, True))
    for k, nm in enumerate(osi):
        c = [PUR, PUR, PUR, GRN, GLD, SIG, MUT][k]
        o.append(RECT(xc, oy[k], wc, oh, 5, PAN, c, 1.1))
        o.append(T(xc + 10, oy[k] + oh / 2 + 3.6, nm, "start", 10, INK))
    # TLS の位置
    o.append(RECT(xa + 30, 99, wa - 60, 14, 4, TSOFT, TEA, 1.0, dash="4 3"))
    o.append(T(xa + wa / 2, 109.5, "TLS（使う場合はここに入る。12 章）", "middle", 9.5, TEA, True))
    yb = 232 + lh + 26
    o.append(T(20, yb, "上の層ほど、利用者に近い仕事をする。OSI の番号で、リンク層を L2、ネットワーク層を L3、トランスポート層を L4 と呼ぶことがある。", "start", 10, MUT))
    return SVG(700, yb + 10, o, "インターネットで使う 4 つの層と、各層が使う宛先の表し方。右は、国際規格の OSI の 7 層の名前と、4 つの層との対応である。4 つの層の分け方では、ビットを電気の信号や電波にする物理層をリンク層に含める。")
F["e07_layers4"] = _f07_layers4()

def _f07_path():
    o = []
    nodes = [("温度センサ", "（機器）", SIG, "end"), ("アクセスポイント", "", GLD, "link"),
             ("家庭のルータ", "", GLD, "net"), ("途中のルータ", "（多数）", GLD, "net"), ("サーバ", "", GRN, "end")]
    xs = [12, 157, 302, 447, 592]
    bw = 96
    rows = {"app": 54, "tr": 82, "nw": 110, "ln": 138}
    rh = 24
    names = {"app": ("アプリケーション", PUR), "tr": ("トランスポート", GRN), "nw": ("ネットワーク", GLD), "ln": ("リンク", SIG)}
    links = ["Wi-Fi", "Ethernet", "光回線など", "…"]
    # データの通り道（箱の後ろに描く）
    cy = lambda r: rows[r] + rh / 2
    pts = [(xs[0] + bw / 2, cy("app")), (xs[0] + bw / 2, cy("ln"))]
    for k in (1, 2, 3):
        x = xs[k]
        if nodes[k][3] == "link":
            pts += [(x + bw / 4, cy("ln")), (x + 3 * bw / 4, cy("ln"))]
        else:
            pts += [(x + bw / 4, cy("ln")), (x + bw / 4, cy("nw")), (x + 3 * bw / 4, cy("nw")), (x + 3 * bw / 4, cy("ln"))]
    pts += [(xs[4] + bw / 2, cy("ln")), (xs[4] + bw / 2, cy("app") + 6)]
    o.append(PL(pts, c=SIG, lw=2.6))
    o.append(_head(xs[4] + bw / 2, cy("ln"), xs[4] + bw / 2, cy("app") + 4, SIG, 8))
    for k, (nm, sub, c, kind) in enumerate(nodes):
        x = xs[k]
        o.append(T(x + bw / 2, 20, nm, "middle", 11, c, True))
        if sub:
            o.append(T(x + bw / 2, 34, sub, "middle", 9.5, c))
        o.append(RECT(x - 4, 44, bw + 8, 128, 8, "none", c, 1.2, dash="3 3"))
        rs = ["app", "tr", "nw", "ln"] if kind == "end" else (["nw", "ln"] if kind == "net" else ["ln"])
        for r in rs:
            nm2, cc = names[r]
            if r == "ln" and kind != "end":
                for h in (0, 1):
                    o.append(RECT(x + h * bw / 2 + 1, rows[r], bw / 2 - 2, rh, 4, PAN, "none", 0))
                    o.append(RECT(x + h * bw / 2 + 1, rows[r], bw / 2 - 2, rh, 4, soft(cc), cc, 1.1))
                    o.append(T(x + h * bw / 2 + bw / 4, rows[r] + 16, nm2, "middle", 9.5, cc, True))
            else:
                o.append(RECT(x, rows[r], bw, rh, 4, PAN, "none", 0))
                o.append(RECT(x, rows[r], bw, rh, 4, soft(cc), cc, 1.1))
                o.append(T(x + bw / 2, rows[r] + 16, nm2, "middle", 9.5, cc, True))
    for k, lk in enumerate(links):
        xm = (xs[k] + bw + xs[k + 1]) / 2
        o.append(T(xm, cy("ln") - 9, lk, "middle", 9.5, SIG, True))
    # 括弧
    y1 = 192
    for k in range(4):
        o.append(_f07_brace(xs[k] + bw / 2 + 4, xs[k + 1] + bw / 2 - 4, y1, None, SIG))
    o.append(T(xs[0] + bw / 2, y1 + 15, "リンク層: 隣の機器まで。区間ごとに、リンク層のヘッダを付け替える", "start", 10, SIG))
    y2 = 228
    o.append(_f07_brace(xs[0] + bw / 2, xs[4] + bw / 2, y2, None, GLD))
    o.append(T(350, y2 + 15, "ネットワーク層: 機器からサーバまで（途中のルータは、宛先の IP アドレスを見て次へ渡す）", "middle", 10, GLD))
    y3 = 264
    o.append(W(xs[0] + bw / 2, y3, xs[4] + bw / 2, y3, c=PUR, lw=1.2, dash="2 4"))
    o.append(D(xs[0] + bw / 2, y3, PUR, 4))
    o.append(D(xs[4] + bw / 2, y3, PUR, 4))
    o.append(T(350, y3 + 17, "トランスポート層・アプリケーション層: 両端の機器だけが読み書きする", "middle", 10, PUR))
    return SVG(700, y3 + 28, o, "温度センサからサーバまでの経路と、途中の機器が扱う層。青い線はデータの通り道。アクセスポイントはリンク層だけを扱い、Wi-Fi と Ethernet の間でフレームを付け替える。ルータはネットワーク層まで上がって次の行き先を決める。トランスポート層より上は、両端の機器だけが扱う。家庭では、アクセスポイントとルータが 1 台にまとまっていることが多い。")
F["e07_path"] = _f07_path()

# ---- 2 節: リンク層 ----
def _f07_mac():
    o = []
    by = ["00", "00", "5E", "00", "53", "0A"]
    x0, y0, bw = 130, 40, 72
    o.append(T(x0 - 14, y0 + 23, "MAC アドレス", "end", 11, SIG, True))
    for i, b in enumerate(by):
        o.append(RECT(x0 + i * bw, y0, bw - 6, 34, 5, SSOFT, SIG, 1.3))
        o.append(T(x0 + i * bw + (bw - 6) / 2, y0 + 23, b, "middle", 14, INK, True, True))
        if i < 5:
            o.append(T(x0 + i * bw + bw - 3, y0 + 23, ":", "middle", 13, MUT, True, True))
        o.append(T(x0 + i * bw + (bw - 6) / 2, y0 - 8, "%d バイト目" % (i + 1), "middle", 9, MUT))
    o.append(_f07_brace(x0, x0 + 3 * bw - 6, y0 + 44, "OUI: 製造者の番号（IEEE が割り当てる）", SIG, sz=10))
    o.append(_f07_brace(x0 + 3 * bw, x0 + 6 * bw - 6, y0 + 44, "製造者が 1 台ずつ割り当てる", SIG, sz=10))
    # 1 バイト目のビット
    yb = 140
    o.append(T(x0 - 12, yb + 12, "1 バイト目の", "end", 10, MUT))
    o.append(T(x0 - 12, yb + 25, "8 ビット", "end", 10, MUT))
    o.append(W(x0 + (bw - 6) / 2, y0 + 36, x0 + (bw - 6) / 2, y0 + 64, c=FNT, lw=1, dash="2 3"))
    ww = 32
    for k in range(8):
        bit = 7 - k
        c = ALI if bit in (0, 1) else LIN
        o.append(RECT(x0 + k * ww, yb, ww - 3, 26, 3, ASOFT if bit in (0, 1) else PAN, c, 1.2))
        o.append(T(x0 + k * ww + (ww - 3) / 2, yb + 17, "0", "middle", 11, INK, True, True))
        o.append(T(x0 + k * ww + (ww - 3) / 2, yb - 5, "b%d" % bit, "middle", 9, MUT, False, True))
    xn = x0 + 8 * ww + 16
    o.append(T(xn, yb + 2, "b1（U/L）: 0 = 製造時に割り当てた、世界で 1 つの値", "start", 10, ALI))
    o.append(T(xn + 74, yb + 16, "1 = 機器や管理者が自分で決めた値", "start", 10, ALI))
    o.append(T(xn, yb + 34, "b0（I/G）: 0 = 1 台宛て、1 = グループ宛て", "start", 10, ALI))
    o.append(T(20, yb + 62, "FF:FF:FF:FF:FF:FF は、同じリンクのすべての機器宛て（ブロードキャスト。08 章）。", "start", 10.5, INK))
    return SVG(700, yb + 74, o, "MAC アドレスの例（00:00:5E:00:53:0A。説明用に予約された値）。48 ビット（6 バイト）を 16 進で書き、コロンで区切る。上位 3 バイトが製造者の番号なので、製造時に割り当てた値は世界で重ならない。1 バイト目の最下位の 2 ビットは、アドレスの種類を表す。")
F["e07_mac"] = _f07_mac()

def _f07_eth():
    o = []
    fs = [("プリアンブル", "7 バイト", 76, MUT), ("SFD", "1", 32, MUT), ("宛先 MAC", "6 バイト", 112, SIG),
          ("送信元 MAC", "6 バイト", 112, SIG), ("EtherType", "2 バイト", 66, SIG), ("ペイロード", "46〜1500 バイト", 126, GLD),
          ("FCS", "4 バイト", 50, SIG), ("空き", "12 バイト分", 66, MUT)]
    x0, y0, h = 30, 64, 42
    xx = x0
    pos = []
    for nm, sub, w, c in fs:
        dash = "4 3" if c == MUT else None
        o.append(RECT(xx, y0, w, h, 4, soft(c) if c != MUT else SCR, c, 1.3, dash=dash))
        o.append(T(xx + w / 2, y0 + 18, nm, "middle", 10 if nm == "プリアンブル" else 10.5, c if c != MUT else INK, True))
        o.append(T(xx + w / 2, y0 + 33, sub, "middle", 9.5, MUT))
        pos.append((xx, xx + w))
        xx += w
    # 上の括弧: Ethernet フレーム
    o.append(_f07_brace(pos[2][0], pos[6][1], y0 - 10, "Ethernet フレーム（64〜1518 バイト）", SIG, up=True, sz=10.5, tc=SIG))
    o.append(T(pos[0][0] + (pos[1][1] - pos[0][0]) / 2, y0 - 16, "線の上だけ", "middle", 9.5, MUT))
    o.append(T((pos[7][0] + pos[7][1]) / 2, y0 - 16, "線の上だけ", "middle", 9.5, MUT))
    # 下の括弧
    yb = y0 + h + 10
    o.append(_f07_brace(pos[2][0], pos[4][1], yb, "ヘッダ 14 バイト", SIG, sz=10))
    o.append(_f07_brace(pos[6][0] + 2, pos[6][1] - 2, yb, "検査の値", SIG, sz=10))
    o.append(_f07_brace(pos[0][0], pos[1][1], yb, "始まりの合図", MUT, sz=9.5))
    o.append(_f07_brace(pos[7][0], pos[7][1], yb, "次まで空ける", MUT, sz=9.5))
    o.append(_f07_brace(pos[2][0], pos[5][1], yb + 30, "FCS を計算する範囲（CRC-32。03 章）", SIG, sz=10))
    # 例の値
    ye = yb + 72
    o.append(T(x0, ye, "例", "start", 10, MUT, True))
    vals = [(2, "00:00:5E:00:53:01"), (3, "00:00:5E:00:53:0A"), (4, "08 00"), (6, "1C 0D D7 6C")]
    for k, v in vals:
        o.append(T((pos[k][0] + pos[k][1]) / 2, ye, v, "middle", 9, INK, False, True))
    o.append(T((pos[2][0] + pos[2][1]) / 2, ye + 14, "（ルータ）", "middle", 9.5, MUT))
    o.append(T((pos[3][0] + pos[3][1]) / 2, ye + 14, "（機器）", "middle", 9.5, MUT))
    o.append(T((pos[4][0] + pos[4][1]) / 2, ye + 14, "（IPv4）", "middle", 9.5, MUT))
    o.append(T((pos[5][0] + pos[5][1]) / 2, ye, "IP パケットなど", "middle", 9.5, MUT))
    # EtherType の値
    yt = ye + 40
    o.append(T(x0, yt, "EtherType の値:", "start", 10.5, INK, True))
    xx = x0 + 100
    for t in ("0x0800 = IPv4（3 節）", "0x86DD = IPv6（3 節）", "0x0806 = ARP（08 章）"):
        s, w = CHIP(xx, yt, t, SIG, 10, mono=False)
        o.append(s); xx += w + 12
    yl = yt + 28
    o.append(T(x0, yl, "1 フレームごとに足されるもの: ヘッダ 14 + FCS 4 = 18 バイト。線の上では、さらに 8 + 12 = 20 バイト分の時間がかかる。", "start", 10.5, INK))
    return SVG(700, yl + 12, o, "Ethernet フレームの形。宛先 MAC アドレスから FCS までがフレームで、受け手の MAC の回路が受け取るのはこの部分である。線の上では、その前に受け手が時刻を合わせるためのプリアンブルと始まりの印（SFD）が、後に次のフレームまでの空きが入る。ペイロードが 46 バイトより短いときは、0 を詰めて 46 バイトにする。")
F["e07_eth"] = _f07_eth()

def _f07_macphy():
    o = []
    o.append(RECT(20, 30, 290, 132, 10, SSOFT, SIG, 1.5))
    o.append(T(30, 48, "マイコン", "start", 11, SIG, True))
    o.append(BOX(30, 58, 70, 34, "CPU", None, LIN, PAN, INK, sz=10.5))
    o.append(BOX(30, 104, 70, 34, "RAM", None, LIN, PAN, INK, sz=10.5))
    o.append(BOX(176, 58, 124, 94, "MAC", "フレームの組み立てと分解・FCS の計算と確認・宛先の判定", SIG, PAN, SIG, sz=11.5, ssz=9.5))
    o.append(DARR(102, 121, 174, 121, c=SIG, lw=1.3))
    o.append(T(138, 113, "DMA（04 章）", "middle", 9, SIG))
    o.append(BOX(382, 58, 120, 94, "PHY", "ビットを線の信号にする（外付けの IC）", MUT, MSOFT, INK, sz=11.5, ssz=9.5))
    o.append(DARR(302, 84, 380, 84, c=SIG, lw=1.6))
    o.append(T(341, 76, "RMII", "middle", 10, SIG, True))
    o.append(DARR(302, 126, 380, 126, c=MUT, lw=1.2))
    o.append(T(341, 118, "MDIO", "middle", 10, MUT, True))
    o.append(BOX(522, 70, 62, 70, "トランス", "絶縁", MUT, PAN, INK, sz=10.5, ssz=9))
    o.append(BOX(602, 70, 58, 70, "RJ45", "コネクタ", MUT, PAN, INK, sz=10.5, ssz=9))
    o.append(W(504, 105, 520, 105, c=MUT, lw=1.6))
    o.append(W(586, 105, 600, 105, c=MUT, lw=1.6))
    o.append(W(662, 105, 692, 105, c=MUT, lw=2.4))
    o.append(T(678, 96, "線", "middle", 9.5, MUT))
    o.append(T(20, 188, "RMII: 送信と受信それぞれ 2 ビット幅の信号と、50 MHz の基準クロックで、MAC と PHY の間でビットを運ぶ。", "start", 10, INK))
    o.append(T(20, 205, "MDIO: PHY の設定と状態（リンクがつながったか、速さはいくつか）を読み書きする信号。", "start", 10, INK))
    return SVG(700, 216, o, "Ethernet を内蔵したマイコンの典型的な構成。リンク層の処理をする MAC の回路はマイコンの中にあり、物理層の信号を扱う PHY は外付けの IC にすることが多い。PHY と線の間には、絶縁のためのトランスとコネクタが入る。")
F["e07_macphy"] = _f07_macphy()

def _f07_wifi():
    o = []
    # Wi-Fi のフレーム（機器 → AP）
    wf = [("制御", 2, 40), ("時間", 2, 40), ("アドレス 1", 6, 84), ("アドレス 2", 6, 84), ("アドレス 3", 6, 84),
          ("順番", 2, 40), ("QoS", 2, 40), ("LLC/SNAP", 8, 68), ("ペイロード", None, 92), ("FCS", 4, 40)]
    x0, y1, h = 74, 52, 40
    o.append(T(14, 24, "機器 → AP: Wi-Fi のフレーム", "start", 11.5, SIG, True))
    xx = x0; px = {}
    sub = {"アドレス 1": "AP", "アドレス 2": "機器", "アドレス 3": "ルータ", "LLC/SNAP": "EtherType を含む", "ペイロード": "IP パケット"}
    for nm, nb, w in wf:
        c = GLD if nm == "ペイロード" else SIG
        o.append(RECT(xx, y1, w, h, 4, soft(c), c, 1.2))
        o.append(T(xx + w / 2, y1 + 17, nm, "middle", 10 if w > 50 else 9.5, c, True))
        s2 = sub.get(nm, "%d" % nb if nb else "")
        if nm.startswith("アドレス"):
            o.append(T(xx + w / 2, y1 + 32, s2, "middle", 10, INK, True))
        else:
            o.append(T(xx + w / 2, y1 + 32, s2, "middle", 9, MUT))
        px[nm] = (xx, xx + w)
        xx += w
    o.append(T(x0 - 8, y1 + 25, "Wi-Fi", "end", 10.5, SIG, True))
    o.append(_f07_brace(px["制御"][0], px["QoS"][1], y1 - 6, "ヘッダ 26 バイト（この例。24〜32 バイト）", SIG, up=True, sz=10))
    # Ethernet のフレーム（AP → ルータ）
    y2 = 176
    o.append(T(14, y2 - 12, "AP → ルータ:", "start", 11.5, SIG, True))
    o.append(T(14, y2 + 4, "Ethernet のフレーム", "start", 11.5, SIG, True))
    ef = [("宛先 MAC", "ルータ", 84), ("送信元 MAC", "機器", 84), ("EtherType", "2", 66), ("ペイロード", "IP パケット", 92), ("FCS", "4", 40)]
    xx = 260; qx = {}
    for nm, s2, w in ef:
        c = GLD if nm == "ペイロード" else SIG
        o.append(RECT(xx, y2, w, h, 4, soft(c), c, 1.2))
        o.append(T(xx + w / 2, y2 + 17, nm, "middle", 10, c, True))
        o.append(T(xx + w / 2, y2 + 32, s2, "middle", 10 if nm.endswith("MAC") else 9, INK if nm.endswith("MAC") else MUT, nm.endswith("MAC")))
        qx[nm] = (xx, xx + w)
        xx += w

    mid = lambda p: (p[0] + p[1]) / 2
    o.append(ARR(mid(px["アドレス 3"]), y1 + h + 2, mid(qx["宛先 MAC"]), y2 - 2, c=ALI, lw=1.4, head=6))
    o.append(ARR(mid(px["アドレス 2"]), y1 + h + 2, mid(qx["送信元 MAC"]), y2 - 2, c=ALI, lw=1.4, head=6))
    o.append(ARR(mid(px["LLC/SNAP"]), y1 + h + 2, mid(qx["EtherType"]), y2 - 2, c=FNT, lw=1.2, head=6))
    o.append(ARR(mid(px["ペイロード"]), y1 + h + 2, mid(qx["ペイロード"]), y2 - 2, c=GLD, lw=1.4, head=6))
    o.append(T(612, 128, "IP パケットは", "start", 9.5, GLD))
    o.append(T(612, 141, "そのまま", "start", 9.5, GLD))
    o.append(T(150, 122, "AP がヘッダを", "end", 10, ALI, True))
    o.append(T(150, 136, "付け替える", "end", 10, ALI, True))
    yl = y2 + h + 30
    o.append(T(14, yl, "アドレス 1 = この電波を受け取る機器（AP）、アドレス 2 = 送った機器、アドレス 3 = リンク層の最終の宛先（ルータ）。", "start", 10, INK))
    o.append(T(14, yl + 17, "AP は受け取るたびにすぐ ACK を返し、来なければ機器が送り直す（05 章の ARQ をリンク層で行う）。", "start", 10, INK))
    o.append(T(14, yl + 34, "暗号化（WPA2 の CCMP）を使うと、さらに 16 バイト増える（09 章）。", "start", 10, INK))
    return SVG(700, yl + 44, o, "Wi-Fi（IEEE 802.11）のデータのフレームと、アクセスポイント（AP）による付け替え。電波の上では、受け取る機器（AP）とリンク層の最終の宛先（ルータ）が違うので、アドレスを 3 つ持つ。AP は、ペイロードの IP パケットはそのままにして、ヘッダを Ethernet の形に付け替える。ヘッダの大きさはフレームの種類によって違う（この例は QoS のデータのフレームで 26 バイト）。")
F["e07_wifi"] = _f07_wifi()
