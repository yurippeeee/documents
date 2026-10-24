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
    links = ["Wi-Fi", "Ethernet", "光回線", "…"]
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
        o.append(T(xm, cy("ln") - 9, lk, "middle", 9, SIG, True))
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
    o.append(T((pos[5][0] + pos[5][1]) / 2, ye, "上の層のデータ", "middle", 9.5, MUT))
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
    o.append(BOX(382, 58, 120, 94, "PHY", "ビットと線の上の信号を変換する", MUT, MSOFT, INK, sz=11.5, ssz=9.5))
    o.append(T(442, 168, "（外付けの IC）", "middle", 9.5, MUT))
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
    sub = {"アドレス 1": "AP", "アドレス 2": "機器", "アドレス 3": "ルータ", "ペイロード": "上の層のデータ"}
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
    ef = [("宛先 MAC", "ルータ", 84), ("送信元 MAC", "機器", 84), ("EtherType", "2", 66), ("ペイロード", "上の層のデータ", 92), ("FCS", "4", 40)]
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
    o.append(T(612, 128, "ペイロードは", "start", 9.5, GLD))
    o.append(T(612, 141, "そのまま", "start", 9.5, GLD))
    o.append(T(150, 122, "AP がヘッダを", "end", 10, ALI, True))
    o.append(T(150, 136, "付け替える", "end", 10, ALI, True))
    yl = y2 + h + 30
    o.append(T(14, yl, "アドレス 1 = この電波を受け取る機器（AP）、アドレス 2 = 送った機器、アドレス 3 = リンク層の最終の宛先（ルータ）。", "start", 10, INK))
    o.append(T(14, yl + 17, "AP は受け取るたびにすぐ ACK を返し、来なければ機器が送り直す（05 章の ARQ をリンク層で行う）。", "start", 10, INK))
    o.append(T(14, yl + 34, "LLC/SNAP は、ペイロードの種類を示す 8 バイト（最後の 2 バイトが EtherType）。", "start", 10, INK))
    o.append(T(14, yl + 51, "暗号化（WPA2 の CCMP）を使うと、さらに 16 バイト増える（09 章）。", "start", 10, INK))
    return SVG(700, yl + 61, o, "Wi-Fi（IEEE 802.11）のデータのフレームと、アクセスポイント（AP）による付け替え。電波の上では、受け取る機器（AP）とリンク層の最終の宛先（ルータ）が違うので、アドレスを 3 つ持つ。AP は、ペイロード（上の層のデータ）はそのままにして、ヘッダを Ethernet の形に付け替える。ヘッダの大きさはフレームの種類によって違う（この例は QoS のデータのフレームで 26 バイト）。")
F["e07_wifi"] = _f07_wifi()

# ---- 3 節: IP ----
def _f07_bits(x, y, fields, bw=13, rh=26, sz=10, nums=True):
    """32 ビットを 1 行にしたヘッダの図。fields = [(名前, ビット数, 色[, 破線]), ...]。
    32 の倍数のビット数で行の先頭から始まる欄は、1 つの縦長の箱にする。返り値は (svg, 高さ, 1 行目の上端の y)。"""
    o = []
    y0 = y
    if nums:
        for b in (0, 8, 16, 24, 31):
            o.append(T(x + (b + 0.5) * bw, y + 9, str(b), "middle", 8.5, FNT, False, True))
        y0 = y + 14
    pos = 0
    for f in fields:
        name, nb, c = f[0], f[1], f[2]
        dash = f[3] if len(f) > 3 else None
        r, col = divmod(pos, 32)
        if col == 0 and nb % 32 == 0 and nb > 32:
            k = nb // 32
            o.append(RECT(x, y0 + r * rh, 32 * bw, k * rh, 3, soft(c), c, 1.2, dash))
            o.append(T(x + 16 * bw, y0 + r * rh + k * rh / 2 + sz * 0.38, name, "middle", sz, c, True))
            pos += nb
            continue
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

def _f07_addr():
    o = []
    o.append(T(20, 24, "IPv4 アドレス（32 ビット = 4 バイト）", "start", 11.5, GLD, True))
    nums = [("192", "C0", "1100 0000"), ("0", "00", "0000 0000"), ("2", "02", "0000 0010"), ("10", "0A", "0000 1010")]
    cx = [176, 280, 384, 488]
    o.append(T(120, 54, "10 進", "end", 10, MUT))
    o.append(T(120, 78, "16 進", "end", 10, MUT))
    o.append(T(120, 100, "2 進", "end", 10, MUT))
    for i, (d, h, b) in enumerate(nums):
        o.append(RECT(cx[i] - 45, 36, 90, 74, 6, GOSOFT, GLD, 1.1))
        o.append(T(cx[i], 56, d, "middle", 16, INK, True, True))
        o.append(T(cx[i], 79, h, "middle", 12, GLD, True, True))
        o.append(T(cx[i], 100, b, "middle", 10.5, MUT, False, True))
        if i < 3:
            o.append(T((cx[i] + cx[i + 1]) / 2, 57, ".", "middle", 18, INK, True, True))
    o.append(T(548, 62, "1 バイトずつ 10 進で", "start", 10, MUT))
    o.append(T(548, 76, "書き、点で区切る", "start", 10, MUT))
    # IPv6
    y = 148
    o.append(T(20, y, "IPv6 アドレス（128 ビット = 16 バイト）", "start", 11.5, GLD, True))
    o.append(T(120, y + 32, "省いた形", "end", 10, MUT))
    o.append(T(138, y + 33, "2001:db8::a", "start", 16, INK, True, True))
    o.append(T(120, y + 66, "省かない形", "end", 10, MUT))
    groups = ["2001", "0db8", "0000", "0000", "0000", "0000", "0000", "000a"]
    sz = 13
    cw = sz * 0.6
    xx = 138
    for i, g in enumerate(groups):
        lead = len(g) - len(g.lstrip("0")) if g.strip("0") else 4
        for j, ch in enumerate(g):
            if 2 <= i <= 6:
                c = ALI
            elif j < lead:
                c = FNT
            else:
                c = INK
            o.append(T(xx + cw / 2, y + 67, ch, "middle", sz, c, i not in range(2, 7) and j >= lead, True))
            xx += cw
        if i < 7:
            o.append(T(xx + cw / 2, y + 67, ":", "middle", sz, MUT, False, True))
            xx += cw
    x_end = xx
    o.append(_f07_brace(138 + 10 * cw, 138 + 39 * cw - 10 * cw - 1, y + 78, "0 だけの組が 5 つ続く → ::", ALI, sz=10))
    o.append(T(x_end + 14, y + 62, "16 ビットずつ 8 つの組に分け、", "start", 10, MUT))
    o.append(T(x_end + 14, y + 76, "16 進で書いてコロンで区切る", "start", 10, MUT))
    o.append(T(20, y + 118, "省き方: ① 各組の先頭の 0 は省ける（0db8 → db8、000a → a）。② 0 だけの組が続く所は、1 か所だけ :: にまとめられる。", "start", 10.5, INK))
    return SVG(700, y + 130, o, "IP アドレスの書き方。IPv4 は 4 バイトを 1 バイトずつ 10 進で書く。IPv6 は 16 バイトを 16 ビットずつ 16 進で書き、0 を省く。どちらの例も、説明用に予約された範囲のアドレスである（IPv4 は RFC 5737、IPv6 は RFC 3849）。")
F["e07_addr"] = _f07_addr()

def _f07_ipv4():
    o = []
    x = 20
    f = [("版", 4, GLD), ("ヘッダ長", 4, GLD), ("サービスの種類", 8, GLD), ("全長", 16, GLD),
         ("識別子", 16, GLD), ("フラグ", 3, GLD), ("フラグメントオフセット", 13, GLD),
         ("TTL", 8, GLD), ("プロトコル", 8, GLD), ("ヘッダチェックサム", 16, GLD),
         ("送信元アドレス", 32, GLD), ("宛先アドレス", 32, GLD)]
    rh = 32
    s, h, y0 = _f07_bits(x, 22, f, bw=13, rh=rh, sz=10)
    o.append(T(x, 14, "ビットの番号", "start", 8.5, FNT))
    o.append(s)
    yo = y0 + 5 * rh
    o.append(RECT(x, yo, 32 * 13, 22, 3, "none", GLD, 1.1, dash="4 3"))
    o.append(T(x + 16 * 13, yo + 15, "オプション（ヘッダ長が 5 より大きいときだけ。普通は無い）", "middle", 9.5, MUT))
    notes = [("45 00 00 4A", "版 4・ヘッダ長 5（× 4 = 20 バイト）・全長 74"),
             ("1C 46 40 00", "識別子・フラグ・オフセット（6 節）"),
             ("40 06 20 58", "TTL 64・プロトコル 6（TCP）・チェックサム"),
             ("C0 00 02 0A", "送信元 192.0.2.10"),
             ("CB 00 71 05", "宛先 203.0.113.5")]
    xn = x + 32 * 13 + 14
    o.append(T(xn, 14, "5 節の例の値", "start", 9.5, MUT, True))
    for i, (hx, t) in enumerate(notes):
        yy = y0 + i * rh
        o.append(T(xn, yy + 13, hx, "start", 10.5, INK, True, True))
        o.append(T(xn, yy + 27, t, "start", 9.5, MUT))
    yl = yo + 46
    o.append(T(x, yl, "プロトコルの値:", "start", 10.5, INK, True))
    xx = x + 100
    for t in ("1 = ICMP", "6 = TCP（4 節）", "17 = UDP（4 節）"):
        c, w = CHIP(xx, yl, t, GLD, 10)
        o.append(c); xx += w + 10
    return SVG(700, yl + 14, o, "IPv4 のヘッダ（オプションが無いとき 20 バイト）。1 行が 32 ビット（4 バイト）で、上の行から順に送る。2 バイト以上の欄は、ネットワークバイトオーダ（ビッグエンディアン）で並べる。右は 5 節の例の値。")
F["e07_ipv4"] = _f07_ipv4()

def _f07_csum():
    o = []
    sz, lh = 12, 17.5
    xl, xr = 112, 476
    o.append(T(20, 22, "送る側: チェックサムの欄を 0 にして計算する", "start", 11, GLD, True))
    rows = [("4500", "版・ヘッダ長・サービスの種類"), ("004A", "全長 74"), ("1C46", "識別子"), ("4000", "フラグ・オフセット"),
            ("4006", "TTL 64・プロトコル 6"), ("0000", "チェックサム（計算の間は 0）"), ("C000", "送信元 192.0.…"),
            ("020A", "…2.10"), ("CB00", "宛先 203.0.…"), ("7105", "…113.5")]
    y = 46
    for i, (v, t) in enumerate(rows):
        o.append(T(xl, y, v, "end", sz, ALI if v == "0000" else INK, False, True))
        o.append(T(xl + 14, y, t, "start", 9.5, MUT))
        if i == len(rows) - 1:
            o.append(T(xl - 4 * sz * 0.6 - 10, y, "+", "end", sz, INK, False, True))
        y += lh
    o.append(W(xl - 5 * sz * 0.6 - 4, y - 12, xl + 2, y - 12, c=INK, lw=1.2))
    o.append(T(xl, y + 2, "2DFA5", "end", sz, INK, True, True))
    o.append(T(xl + 14, y + 2, "16 ビットずつの和（2 が上にあふれた）", "start", 9.5, MUT))
    y += lh + 4
    o.append(T(xl, y, "DFA5", "end", sz, INK, False, True))
    o.append(T(xl, y + lh, "2", "end", sz, ALI, False, True))
    o.append(T(xl - 4 * sz * 0.6 - 10, y + lh, "+", "end", sz, INK, False, True))
    o.append(T(xl + 14, y + lh, "あふれた桁を下に足し戻す", "start", 9.5, ALI))
    y += 2 * lh
    o.append(W(xl - 5 * sz * 0.6 - 4, y - 12, xl + 2, y - 12, c=INK, lw=1.2))
    o.append(T(xl, y + 2, "DFA7", "end", sz, INK, True, True))
    y += lh + 6
    o.append(T(xl, y + 2, "2058", "end", sz + 1, GLD, True, True))
    o.append(T(xl + 14, y + 2, "ビットを反転（FFFF − DFA7）→ 欄に入れる値", "start", 9.5, GLD, True))
    ybot = y
    # 受ける側
    o.append(T(372, 22, "受ける側: 欄の 2058 も含めて計算する", "start", 11, GRN, True))
    y = 46 + lh * 2
    o.append(T(xr, y, "2DFA5", "end", sz, INK, False, True))
    o.append(T(xr + 14, y, "欄以外の 9 つの和（左と同じ）", "start", 9.5, MUT))
    y += lh
    o.append(T(xr, y, "2058", "end", sz, GLD, False, True))
    o.append(T(xr - 5 * sz * 0.6 - 10, y, "+", "end", sz, INK, False, True))
    o.append(T(xr + 14, y, "チェックサムの欄", "start", 9.5, MUT))
    y += lh
    o.append(W(xr - 5 * sz * 0.6 - 4, y - 12, xr + 2, y - 12, c=INK, lw=1.2))
    o.append(T(xr, y + 2, "2FFFD", "end", sz, INK, True, True))
    y += lh + 4
    o.append(T(xr, y, "FFFD", "end", sz, INK, False, True))
    o.append(T(xr, y + lh, "2", "end", sz, ALI, False, True))
    o.append(T(xr - 4 * sz * 0.6 - 10, y + lh, "+", "end", sz, INK, False, True))
    o.append(T(xr + 14, y + lh, "あふれた桁を足し戻す", "start", 9.5, ALI))
    y += 2 * lh
    o.append(W(xr - 5 * sz * 0.6 - 4, y - 12, xr + 2, y - 12, c=INK, lw=1.2))
    o.append(T(xr, y + 2, "FFFF", "end", sz, INK, True, True))
    y += lh + 6
    o.append(T(xr, y + 2, "0000", "end", sz + 1, GRN, True, True))
    o.append(T(xr + 14, y + 2, "反転して 0 なら、誤りは見つからない", "start", 9.5, GRN, True))
    return SVG(700, max(ybot, y) + 16, o, "5 節の例の IPv4 ヘッダ（20 バイト）のヘッダチェックサムの計算（16 進）。ヘッダを 16 ビットずつ 10 個に区切って足し、16 ビットからあふれた桁を下に足し戻し、ビットを反転する。受ける側は欄の値も含めて同じ計算をし、0 になるかを確かめる。")
F["e07_csum"] = _f07_csum()

def _f07_ipv6():
    o = []
    x = 20
    f = [("版", 4, GLD), ("トラフィッククラス", 8, GLD), ("フローラベル", 20, GLD),
         ("ペイロード長", 16, GLD), ("次ヘッダ", 8, GLD), ("ホップリミット", 8, GLD),
         ("送信元アドレス（16 バイト）", 128, GLD), ("宛先アドレス（16 バイト）", 128, GLD)]
    rh = 22
    s, h, y0 = _f07_bits(x, 10, f, bw=13, rh=rh, sz=10)
    o.append(s)
    xn = x + 32 * 13 + 14
    o.append(T(xn, y0 + 9, "トラフィッククラス = IPv4 のサービスの種類", "start", 9.5, MUT))
    o.append(T(xn, y0 + 21, "フローラベル: 一続きのパケットに付ける印", "start", 9.5, MUT))
    o.append(T(xn, y0 + rh + 13, "ペイロード長: ヘッダの後ろの長さ", "start", 9.5, MUT))
    o.append(T(xn, y0 + rh + 26, "次ヘッダ = IPv4 のプロトコル", "start", 9.5, MUT))
    o.append(T(xn, y0 + rh + 39, "ホップリミット = IPv4 の TTL", "start", 9.5, MUT))
    o.append(T(xn, y0 + 2 * rh + 2 * rh + 4, "例: 2001:db8::a", "start", 9.5, MUT, False, True))
    o.append(T(xn, y0 + 6 * rh + 2 * rh + 4, "例: 2001:db8::5", "start", 9.5, MUT, False, True))
    yb = y0 + 10 * rh + 24
    o.append(T(x, yb, "IPv4 との違い: ヘッダは 40 バイトに決まっていて、ヘッダチェックサムとフラグメントの欄が無い。", "start", 10.5, INK))
    o.append(T(x, yb + 17, "ペイロード長は、IPv4 の全長と違い、ヘッダの 40 バイトを含まない。", "start", 10.5, INK))
    return SVG(700, yb + 28, o, "IPv6 のヘッダ（40 バイト）。40 バイトのうち 32 バイトを 2 つのアドレスが占める。欄が少なく長さも決まっているので、ルータの処理が簡単になる。アドレスの種類などの詳細は Matter シリーズ 03 章で扱っている。")
F["e07_ipv6"] = _f07_ipv6()

def _f07_hops():
    o = []
    nodes = [("機器", SIG, 16, 90), ("ルータ R1", GLD, 222, 90), ("ルータ R2", GLD, 412, 90), ("サーバ", GRN, 604, 90)]
    for nm, c, x, w in nodes:
        o.append(RECT(x, 16, w, 32, 7, soft(c), c, 1.4))
        o.append(T(x + w / 2, 37, nm, "middle", 11, c, True))
    lk = ["リンク 1", "リンク 2", "リンク 3"]
    ytop = 32
    frames = [("R1", "機器", "64"), ("R2", "R1", "63"), ("サーバ", "R2", "62")]
    for k in range(3):
        xa = nodes[k][2] + nodes[k][3]
        xb = nodes[k + 1][2]
        o.append(ARR(xa + 2, ytop, xb - 2, ytop, c=SIG, lw=1.8))
        xm = (xa + xb) / 2
        o.append(T(xm, ytop - 6, lk[k], "middle", 9.5, SIG, True))
        fy = 70 + k * 66
        fx = max(10, min(690 - 220, xm - 110))
        o.append(W(xm, ytop + 4, xm, fy - 2, c=FNT, lw=1, dash="2 3"))
        d, sname, ttl = frames[k]
        o.append(RECT(fx, fy, 88, 52, 4, SSOFT, SIG, 1.2))
        o.append(T(fx + 44, fy + 14, "リンク層のヘッダ", "middle", 9, SIG, True))
        o.append(T(fx + 44, fy + 30, "宛先: " + d, "middle", 10, INK))
        o.append(T(fx + 44, fy + 44, "送信元: " + sname, "middle", 10, INK))
        o.append(RECT(fx + 88, fy, 132, 52, 4, GOSOFT, GLD, 1.2))
        o.append(T(fx + 154, fy + 14, "192.0.2.10 →", "middle", 10, INK, False, True))
        o.append(T(fx + 154, fy + 28, "203.0.113.5", "middle", 10, INK, False, True))
        o.append(T(fx + 154, fy + 44, "TTL " + ttl, "middle", 10.5, ALI, True))
    o.append(T(16, 214, "MAC アドレスは", "start", 10, SIG, True))
    o.append(T(16, 228, "区間ごとに変わる", "start", 10, SIG, True))
    o.append(T(690, 92, "IP アドレスは", "end", 10, GLD, True))
    o.append(T(690, 106, "変わらない", "end", 10, GLD, True))
    o.append(T(690, 128, "TTL は 1 ずつ減る", "end", 10, ALI, True))
    # ルータの手順
    ys = 286
    o.append(T(16, ys - 10, "ルータの中の手順", "start", 11, GLD, True))
    steps = ["① 自分宛てのフレームを受け取り、リンク層のヘッダを外す",
             "② 宛先の IP アドレスで経路表を引き、次に渡す相手を決める",
             "③ TTL を 1 減らし、チェックサムを計算し直す（0 になれば捨てる）",
             "④ 次のリンクのヘッダを付けて、送り出す"]
    bw, gap = 156, 15
    for i, t in enumerate(steps):
        x = 16 + i * (bw + gap)
        o.append(BOX(x, ys, bw, 62, None, t, GLD, PAN, INK, ssz=9.5, sc=INK))
        if i < 3:
            o.append(ARR(x + bw + 1, ys + 31, x + bw + gap - 1, ys + 31, c=GLD, lw=1.4, head=6))
    o.append(T(16, ys + 86, "家庭のルータの多くは、このとき送信元の IP アドレスとポート番号も書き換える（NAT。08 章）。この図は書き換えの無い場合。", "start", 10, MUT))
    return SVG(700, ys + 96, o, "パケットが 2 つのルータを通ってサーバへ届くまで。リンク層のヘッダ（MAC アドレス）は区間ごとに付け替えられるが、IP ヘッダの送信元と宛先のアドレスは変わらない。ルータを 1 つ通るたびに TTL が 1 減る。")
F["e07_hops"] = _f07_hops()

# ---- 4 節: TCP と UDP ----
def _f07_ports():
    o = []
    o.append(RECT(16, 28, 300, 214, 10, SSOFT, SIG, 1.5))
    o.append(T(28, 46, "機器（192.0.2.10）", "start", 11, SIG, True))
    o.append(BOX(30, 58, 128, 38, "MQTT の送受信", None, PUR, PAN, PUR, sz=10.5))
    o.append(BOX(174, 58, 128, 38, "時刻合わせ（NTP）", None, PUR, PAN, PUR, sz=10.5))
    o.append(BOX(30, 132, 128, 30, "TCP", None, GRN, GSOFT, GRN, sz=11))
    o.append(BOX(174, 132, 128, 30, "UDP", None, GRN, GSOFT, GRN, sz=11))
    o.append(BOX(30, 196, 272, 30, "IP", None, GLD, GOSOFT, GLD, sz=11))
    # 受け取ったときの振り分け（上向き）
    for xc, port, proto in ((94, "49500", "6"), (238, "49501", "17")):
        o.append(ARR(xc, 194, xc, 164, c=GLD, lw=1.4, head=6))
        o.append(T(xc + 6, 184, "プロトコル " + proto, "start", 9.5, GLD))
        o.append(ARR(xc, 130, xc, 98, c=GRN, lw=1.4, head=6))
        o.append(T(xc + 6, 118, "宛先ポート", "start", 9.5, GRN))
        o.append(T(xc + 6, 129, port, "start", 9.5, GRN, True, True))
    # サーバ
    o.append(BOX(470, 30, 214, 78, "MQTT のサーバ", "203.0.113.5 ・ TCP ポート 1883", GRN, GSOFT, INK, sz=11, ssz=10))
    o.append(BOX(470, 152, 214, 78, "NTP のサーバ", "198.51.100.7 ・ UDP ポート 123", GRN, GSOFT, INK, sz=11, ssz=10))
    o.append(DARR(320, 92, 466, 70, c=GRN, lw=1.6))
    o.append(T(394, 70, "TCP 49500 ↔ 1883", "middle", 10, GRN, True, True))
    o.append(DARR(320, 170, 466, 190, c=GRN, lw=1.6))
    o.append(T(394, 166, "UDP 49501 ↔ 123", "middle", 10, GRN, True, True))
    yb = 268
    o.append(T(16, yb, "受け取ると、IP ヘッダのプロトコル番号で TCP か UDP かを選び、宛先ポート番号でプログラムを選ぶ。", "start", 10.5, INK))
    o.append(T(16, yb + 18, "1 つのやり取りは、送信元と宛先の IP アドレス・ポート番号、プロトコルの 5 つの値で区別される。", "start", 10.5, INK))
    return SVG(700, yb + 28, o, "ポート番号による振り分け。機器は 2 つのプログラムで通信していて、スタックが空いている番号（49500 と 49501）を送信元ポートに選ぶ。サーバは、サービスごとに決まった番号（MQTT は 1883、NTP は 123）で待つ。返事はポート番号を入れ替えて届き、機器はそれを見てプログラムに渡す。")
F["e07_ports"] = _f07_ports()

def _f07_udptcp():
    o = []
    x = 20
    o.append(T(x, 16, "UDP のヘッダ（8 バイト）", "start", 11.5, GRN, True))
    s, h, y0 = _f07_bits(x, 24, [("送信元ポート", 16, GRN), ("宛先ポート", 16, GRN), ("長さ", 16, GRN), ("チェックサム", 16, GRN)], bw=13, rh=26)
    o.append(s)
    xn = x + 32 * 13 + 14
    o.append(T(xn, y0 + 17, "ポート番号（0〜65535）", "start", 9.5, MUT))
    o.append(T(xn, y0 + 26 + 11, "長さ = ヘッダ + データ [バイト]", "start", 9.5, MUT))
    o.append(T(xn, y0 + 26 + 24, "チェックサム: 誤りの検査（本文）", "start", 9.5, MUT))
    y = y0 + h + 20
    o.append(T(x, y, "TCP のヘッダ（20 バイト + オプション）", "start", 11.5, GRN, True))
    f = [("送信元ポート", 16, GRN), ("宛先ポート", 16, GRN), ("シーケンス番号", 32, GRN), ("確認応答番号", 32, GRN),
         ("ヘッダ長", 4, GRN), ("予約", 4, GRN), ("フラグ", 8, GRN), ("ウィンドウ", 16, GRN),
         ("チェックサム", 16, GRN), ("緊急ポインタ", 16, GRN), ("オプション（0〜40 バイト）", 32, GRN, "4 3")]
    s, h2, y1 = _f07_bits(x, y + 8, f, bw=13, rh=26)
    o.append(s)
    notes = ["ポート番号は UDP と同じ位置", "送るバイトにつけた番号（10 章）", "次に欲しいバイトの番号（10 章）",
             "ヘッダ長 × 4 = ヘッダのバイト数", "フラグ: SYN・ACK・FIN など（10 章）", "ヘッダ長が 5 より大きいときだけ"]
    for i, t in enumerate(notes):
        if t:
            o.append(T(xn, y1 + i * 26 + 17, t, "start", 9.5, MUT))
    yb = y1 + h2 - 14 + 22
    return SVG(700, yb, o, "UDP と TCP のヘッダ。どちらも先頭の 4 バイトが送信元と宛先のポート番号である。UDP はそのほかに長さとチェックサムだけを持つ。TCP は確実に届けるための欄（シーケンス番号・確認応答番号・ウィンドウなど）を持ち、その働きは 10 章で扱う。")
F["e07_udptcp"] = _f07_udptcp()

# ---- 5 節: カプセル化 ----
def _f07_wire(ip_len):
    """IP パケット ip_len バイトを Ethernet で送るときの、線の上のバイト数（詰め物・プリアンブル・空きを含む）"""
    return 14 + max(46, ip_len) + 4 + 20

def _f07_mqtt_hdr(n, topic=10):
    """MQTT の PUBLISH（QoS 0）のヘッダの大きさ: 固定ヘッダ 1 + 残りの長さ 1〜4 + トピック名の長さ 2 + トピック名"""
    rem = 2 + topic + n
    rl = 1 if rem < 128 else (2 if rem < 16384 else (3 if rem < 2097152 else 4))
    return 1 + rl + 2 + topic

def _f07_nest():
    o = []
    s = 4.4
    X0 = 118
    parts = [("前 8", 8, MUT), ("Ethernet 14", 14, SIG), ("IPv4 20", 20, GLD), ("TCP 20", 20, GRN), ("MQTT 14", 14, PUR),
             ("データ 20", 20, INK), ("FCS", 4, SIG), ("空き 12", 12, MUT)]
    starts = {}
    xx = X0
    for nm, nb, c in parts:
        starts[nm] = (xx, xx + nb * s)
        xx += nb * s
    rows = [("データ", ["データ 20"], 20),
            ("MQTT のメッセージ", ["MQTT 14", "データ 20"], 34),
            ("TCP のセグメント", ["TCP 20", "MQTT 14", "データ 20"], 54),
            ("IP パケット", ["IPv4 20", "TCP 20", "MQTT 14", "データ 20"], 74),
            ("Ethernet フレーム", ["Ethernet 14", "IPv4 20", "TCP 20", "MQTT 14", "データ 20", "FCS"], 92),
            ("線の上", ["前 8", "Ethernet 14", "IPv4 20", "TCP 20", "MQTT 14", "データ 20", "FCS", "空き 12"], 112)]
    cmap = {nm: c for nm, nb, c in parts}
    y0, rh, gap = 26, 30, 12
    o.append(T(X0 + 76 * s + 10 * s, 14, "アプリケーションのデータ（20 バイト）", "middle", 10, INK, True))
    for i, (lab, ps, tot) in enumerate(rows):
        y = y0 + i * (rh + gap)
        x_left = starts[ps[0]][0]
        x_right = starts[ps[-1]][1]
        for nm in ps:
            a, b = starts[nm]
            c = cmap[nm]
            fill = PAN if c == INK else (SCR if c == MUT else soft(c))
            o.append(RECT(a, y, b - a, rh, 3, fill, c, 1.3, dash="3 2" if c == MUT else None))
            fsz = 9.5 if (b - a) >= tw(nm, 9.5) + 4 else 9
            txt = nm if (b - a) >= tw(nm, fsz) + 4 else nm.split(" ")[-1]
            if nm == "FCS":
                txt = "4"
            o.append(T((a + b) / 2, y + rh / 2 + 3.6, txt, "middle", fsz, c if c != MUT else INK, True))
        o.append(T(x_left - 8, y + rh / 2 + 4, lab, "end", 10.5, INK, True))
        o.append(T(x_right + 8, y + rh / 2 + 4, "%d バイト%s" % (tot, "分" if lab == "線の上" else ""), "start", 10.5, INK))
    yb = y0 + 6 * (rh + gap) + 6
    o.append(T(16, yb, "前 8 = プリアンブル 7 + SFD 1、FCS = 4 バイト、空き 12 = フレーム間の空き。横の長さは、どの欄もバイト数に比例させてある。", "start", 10, MUT))
    return SVG(700, yb + 12, o, "20 バイトのデータを MQTT・TCP・IPv4・Ethernet で送るときのカプセル化。上の層の 1 まとまりが、そのまま下の層のペイロードになり、各層が自分のヘッダ（Ethernet は末尾の FCS も）を足す。線の上では 112 バイト分の時間がかかり、そのうちデータは 20 バイトである。")
F["e07_nest"] = _f07_nest()

def _f07_dump():
    o = []
    import struct as _st, zlib as _z
    def _cs(b):
        if len(b) % 2:
            b += b"\x00"
        t = sum((b[i] << 8) | b[i + 1] for i in range(0, len(b), 2))
        while t >> 16:
            t = (t & 0xFFFF) + (t >> 16)
        return (~t) & 0xFFFF
    dev_ip, srv_ip = bytes([192, 0, 2, 10]), bytes([203, 0, 113, 5])
    payload = b'{"t":23.5,"h":41.25}'
    topic = b"dev/1/temp"
    mq = bytes([0x30, 2 + len(topic) + len(payload)]) + _st.pack(">H", len(topic)) + topic + payload
    tcp0 = _st.pack(">HHIIBBHHH", 49500, 1883, 0x1000, 0x2000, 5 << 4, 0x18, 2920, 0, 0)
    ps = dev_ip + srv_ip + _st.pack(">BBH", 0, 6, len(tcp0) + len(mq))
    tcp = tcp0[:16] + _st.pack(">H", _cs(ps + tcp0 + mq)) + tcp0[18:]
    ip0 = _st.pack(">BBHHHBBH4s4s", 0x45, 0, 20 + len(tcp) + len(mq), 0x1C46, 0x4000, 64, 6, 0, dev_ip, srv_ip)
    ip = ip0[:10] + _st.pack(">H", _cs(ip0)) + ip0[12:]
    body = bytes.fromhex("00005E005301") + bytes.fromhex("00005E00530A") + b"\x08\x00" + ip + tcp + mq
    fr = body + _st.pack("<I", _z.crc32(body) & 0xFFFFFFFF)
    assert len(fr) == 92
    ranges = [(0, 14, SIG), (14, 34, GLD), (34, 54, GRN), (54, 68, PUR), (68, 88, INK), (88, 92, SIG)]
    def colof(i):
        for a, b, c in ranges:
            if a <= i < b:
                return c
    marks = {12: "①", 14: "②", 23: "③", 34: "④", 36: "④", 54: "⑤"}
    x0, y0, cw, ch, pitch = 62, 30, 29, 24, 36
    o.append(T(16, 16, "オフセット", "start", 9, MUT))
    o.append(T(x0 + 16 * cw + 18, 16, "文字として読むと", "start", 9, MUT))
    for i, b in enumerate(fr):
        r, c_ = divmod(i, 16)
        x, y = x0 + c_ * cw, y0 + r * pitch
        c = colof(i)
        fill = PAN if c == INK else soft(c)
        o.append(RECT(x + 1, y, cw - 2, ch, 3, fill, c, 1.0 if c != INK else 0.8))
        o.append(T(x + cw / 2, y + 16, "%02X" % b, "middle", 10.5, INK, False, True))
        if i in marks:
            o.append(T(x + cw / 2, y - 3, marks[i], "middle", 9, ALI, True))
        if c_ == 0:
            o.append(T(16, y + 16, "%04X" % i, "start", 10, FNT, False, True))
    for r in range(6):
        seg = fr[r * 16:(r + 1) * 16]
        txt = "".join(chr(b) if 32 <= b < 127 else "." for b in seg)
        o.append(T(x0 + 16 * cw + 18, y0 + r * pitch + 16, txt, "start", 10, MUT, False, True))
    yl = y0 + 6 * pitch + 8
    o.append(LEGEND(16, yl, [(SIG, "Ethernet（ヘッダ 14・FCS 4）"), (GLD, "IPv4 20"), (GRN, "TCP 20"), (PUR, "MQTT 14"), (MUT, "データ 20")], sz=10, gap=14))
    notes = ["① 08 00: EtherType（IPv4）", "② 45: 版 4・ヘッダ長 5", "③ 06: プロトコル（TCP）",
             "④ C1 5C・07 5B: ポート 49500・1883", "⑤ 30 20: MQTT の固定ヘッダ（13 章）"]
    for i, t in enumerate(notes):
        o.append(T(16 + (i % 3) * 228, yl + 24 + (i // 3) * 17, t, "start", 10, INK))
    return SVG(700, yl + 52, o, "上の図の Ethernet フレーム（92 バイト）を 16 進で並べたもの（TCP のシーケンス番号などの値は例）。左上から右へ、行の順に線へ送り出す。チェックサムと FCS は、実際の計算で求めた値である。")
F["e07_dump"] = _f07_dump()

def _f07_eff():
    o = []
    p = Plot(80, 26, 590, 236, (1, 1000), (0, 100), xlog=True)
    o.append(p.axes(xl="アプリケーションのデータの大きさ n [バイト]（対数目盛）", yl="効率 [%]", xt=[1, 10, 20, 100, 1000], yt=[0, 20, 40, 50, 60, 80, 100],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    stacks = [("UDP / IPv4 / Ethernet", lambda n: 28 + n, SIG),
              ("MQTT / TCP / IPv4 / Ethernet", lambda n: 40 + _f07_mqtt_hdr(n) + n, PUR),
              ("MQTT / TLS / TCP / IPv4 / Ethernet", lambda n: 40 + 22 + _f07_mqtt_hdr(n) + n, TEA)]
    for nm, ipl, c in stacks:
        pts = []
        for k in range(0, 301):
            n = 10 ** (k / 100.0)
            nn = int(round(n))
            pts.append((n, 100.0 * nn / _f07_wire(ipl(nn))))
        o.append(p.line(pts, c=c, lw=2.2))
        e20 = 100.0 * 20 / _f07_wire(ipl(20))
        o.append(D(p.X(20), p.Y(e20), c, 4))
    o.append(W(p.X(20), p.Y(0), p.X(20), p.Y(40), c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(1.25), p.Y(92), "n = 20 のとき", "start", 10.5, INK, True))
    o.append(T(p.X(1.25), p.Y(92) + 17, "UDP: 23.3 %", "start", 10, SIG))
    o.append(T(p.X(1.25), p.Y(92) + 33, "MQTT: 17.9 %", "start", 10, PUR))
    o.append(T(p.X(1.25), p.Y(92) + 49, "MQTT + TLS: 14.9 %", "start", 10, TEA))
    o.append(W(p.X(92), p.Y(0), p.X(92), p.Y(50), p.X(1), p.Y(50), c=PUR, lw=1, dash="3 3"))
    o.append(D(p.X(92), p.Y(50), PUR, 4))
    o.append(W(p.X(92), p.Y(50), p.X(170), p.Y(30), c=PUR, lw=1, dash="2 2"))
    o.append(T(p.X(170) + 4, p.Y(30) + 12, "n = H = 92 で 50 %", "start", 10, PUR, True))
    o.append(LEGEND(80, 312, [(c, nm) for nm, _, c in stacks], sz=10, gap=18))
    return SVG(700, 322, o, "データの大きさと効率（Ethernet の線の上のバイト数に対するデータの割合）。各層が足すバイト数 H はデータの大きさによらないので、データが H より小さいと効率は 50 % を下回る。UDP の線が左端で曲がっているのは、ペイロードを 46 バイトにするための詰め物が入るからである。")
F["e07_eff"] = _f07_eff()

# ---- 6 節: MTU・MSS とフラグメンテーション ----
def _f07_mtu():
    o = []
    def row(y, x0, segs, lab):
        xx = x0
        for nm, w, c in segs:
            fill = PAN if c == INK else soft(c)
            o.append(RECT(xx, y, w, 30, 3, fill, c, 1.3))
            o.append(T(xx + w / 2, y + 19, nm, "middle", 10, c if c != INK else INK, True))
            xx += w
        o.append(T(x0 - 8, y + 19, lab, "end", 10.5, INK, True))
        return xx
    for blk, (ipn, iph, mss, y0) in enumerate((("IPv4", 20, 1460, 28), ("IPv6", 40, 1440, 182))):
        o.append(T(16, y0 - 8, "%s の場合" % ipn, "start", 11.5, GLD, True))
        xF = 130
        row(y0, xF, [("Ethernet 14", 76, SIG), ("IP パケット ≦ 1500 = MTU", 440, GLD), ("FCS 4", 50, SIG)], "フレーム ≦ 1518")
        row(y0 + 40, xF + 76, [("%s %d" % (ipn, iph), 70, GLD), ("TCP のセグメント ≦ %d" % (1500 - iph), 370, GRN)], "IP パケット")
        row(y0 + 80, xF + 76 + 70, [("TCP 20", 60, GRN), ("データ ≦ %d = MSS" % mss, 310, INK)], "セグメント")
        o.append(W(xF + 76, y0 + 32, xF + 76, y0 + 38, c=FNT, lw=1))
        o.append(T(xF + 76 + 70 + 60 + 155, y0 + 132, "MSS = %d − %d − 20 = %d" % (1500, iph, mss), "middle", 10.5, PUR, True))
    yb = 342
    o.append(T(16, yb, "MTU の例:", "start", 10.5, INK, True))
    xx = 90
    for t in ("Ethernet 1500", "Wi-Fi 1500（多くの場合）", "PPPoE の回線 1492", "IPv6 が求める最小 1280"):
        c, w = CHIP(xx, yb, t, GLD, 10)
        o.append(c); xx += w + 10
    o.append(T(16, yb + 24, "横の長さは縮尺どおりではない。TCP のオプションが付くと、そのぶん 1 つのセグメントで運べるデータは減る。", "start", 10, MUT))
    return SVG(700, yb + 34, o, "MTU と MSS の関係（Ethernet の場合）。MTU は、1 つのフレームに入れられる IP パケットの最大の大きさ（Ethernet では 1500 バイト）。MSS は、そこから IP と TCP のヘッダを引いた、1 つのセグメントで運べるデータの最大の大きさである。")
F["e07_mtu"] = _f07_mtu()

def _f07_frag():
    o = []
    sc = 0.15
    x0 = 176
    hw_ip, hw_udp = 40, 26
    y = 34
    o.append(T(16, 18, "送りたい IP パケット（UDP のデータ 3000 バイト）: 全長 20 + 8 + 3000 = 3028 バイト", "start", 11, INK, True))
    o.append(T(16, y + 19, "元のパケット", "start", 10.5, INK, True))
    o.append(RECT(x0 - hw_ip, y, hw_ip, 30, 3, GOSOFT, GLD, 1.3))
    o.append(T(x0 - hw_ip / 2, y + 19, "IP 20", "middle", 9.5, GLD, True))
    o.append(RECT(x0, y, hw_udp, 30, 3, GSOFT, GRN, 1.3))
    o.append(T(x0 + hw_udp / 2, y + 19, "UDP", "middle", 9, GRN, True))
    o.append(RECT(x0 + hw_udp, y, 3000 * sc, 30, 3, PAN, INK, 1.0))
    o.append(T(x0 + hw_udp + 1500 * sc, y + 19, "データ 3000", "middle", 10, INK, True))
    xd = lambda b: x0 + hw_udp + (b - 8) * sc if b >= 8 else x0 + b * hw_udp / 8
    o.append(_f07_brace(x0, x0 + hw_udp + 3000 * sc, y + 40, "IP のペイロード 3008 バイトを 1480 バイトずつに分ける（1480 = 1500 − 20 で、8 の倍数）", GLD, sz=10))
    frs = [(0, 1480, 1), (1480, 2960, 1), (2960, 3008, 0)]
    yf = y + 84
    for k, (a, b, mf) in enumerate(frs):
        yy = yf + k * 52
        xa, xb = xd(a), xd(b)
        o.append(RECT(xa - hw_ip, yy, hw_ip, 30, 3, GOSOFT, GLD, 1.3))
        o.append(T(xa - hw_ip / 2, yy + 19, "IP 20", "middle", 9.5, GLD, True))
        if a == 0:
            o.append(RECT(xa, yy, hw_udp, 30, 3, GSOFT, GRN, 1.3))
            o.append(T(xa + hw_udp / 2, yy + 19, "UDP", "middle", 9, GRN, True))
            o.append(RECT(xa + hw_udp, yy, xb - xa - hw_udp, 30, 3, PAN, INK, 1.0))
            o.append(T(xa + hw_udp + (xb - xa - hw_udp) / 2, yy + 19, "ペイロードの 0〜1479", "middle", 9.5, INK))
        else:
            o.append(RECT(xa, yy, max(xb - xa, 7), 30, 3, PAN, INK, 1.0))
            if xb - xa > 80:
                o.append(T((xa + xb) / 2, yy + 19, "ペイロードの %d〜%d" % (a, b - 1), "middle", 9.5, INK))
        o.append(T(16, yy + 19, "フラグメント %d" % (k + 1), "start", 10.5, GLD, True))
        info = "オフセット %d ÷ 8 = %d・MF = %d・全長 %d" % (a, a // 8, mf, 20 + b - a)
        if b - a < 100:
            o.append(T(690, yy + 44, "ペイロードの %d〜%d（%d バイト）・%s" % (a, b - 1, b - a, info), "end", 9.5, ALI))
        else:
            o.append(T((xa - hw_ip + xb) / 2, yy + 44, info, "middle", 9.5, MUT))
    yb = yf + 3 * 52 + 14
    o.append(T(16, yb, "3 つとも識別子は同じ（例 0x1C47）。受け手は識別子が同じものを集めてオフセットの順に並べ、", "start", 10, INK))
    o.append(T(16, yb + 16, "MF = 0 の最後のものまで隙間なくそろったら、元のパケットに戻す。", "start", 10, INK))
    return SVG(700, yb + 26, o, "IPv4 のフラグメンテーションの例（MTU 1500）。IP のペイロードを 8 の倍数の大きさに分け、それぞれに IP ヘッダを付けて送る。オフセットは、そのフラグメントのデータが元のペイロードの何バイト目から始まるかを 8 で割った値。最後のもの以外は MF（続きがある）を 1 にする。UDP のヘッダは最初のフラグメントにしか無い。")
F["e07_frag"] = _f07_frag()

def _f07_loss():
    o = []
    p = Plot(80, 20, 520, 230, (1, 45), (0, 1))
    o.append(p.axes(xl="フラグメントの数 k", yl="全部届く確率", xt=[1, 5, 10, 20, 30, 45], yt=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    for pr, c in ((0.001, GRN), (0.01, SIG), (0.05, GLD), (0.1, ALI)):
        pts = [(k, (1 - pr) ** k) for k in range(1, 46)]
        o.append(p.line(pts, c=c, lw=2.2))
        o.append(T(p.X(45) + 8, p.Y((1 - pr) ** 45) + 4, "p = %g %%（%.2f）" % (pr * 100, (1 - pr) ** 45), "start", 10, c, True))
    o.append(D(p.X(3), p.Y(0.99 ** 3), SIG, 4.2))
    o.append(W(p.X(3), p.Y(0.99 ** 3), p.X(6), p.Y(0.78) - 4, c=SIG, lw=1, dash="2 2"))
    o.append(T(p.X(6) + 4, p.Y(0.78) + 8, "k = 3、p = 1 % で 0.970", "start", 10, SIG, True))
    o.append(D(p.X(45), p.Y(0.99 ** 45), SIG, 4.2))
    return SVG(700, 300, o, "1 つのフラグメントが失われる確率を p としたとき、k 個のフラグメントが全部届く確率 (1 − p)^k。右端の k = 45 は、IPv4 の最大の大きさ（全長 65535 バイト）の UDP を MTU 1500 で送ったときのフラグメントの数。括弧の中は k = 45 のときの値。")
F["e07_loss"] = _f07_loss()

def _f07_segfrag():
    o = []
    for side, (title, ok, x0) in enumerate((("良い例: TCP が MSS ごとに分ける", True, 16), ("悪い例: IP がフラグメントに分ける", False, 362))):
        c = GRN if ok else ALI
        o.append(T(x0, 22, title, "start", 11.5, c, True))
        for k in range(3):
            y = 38 + k * 44
            lost = (k == 1)
            if ok:
                segs = [("IP", 30, GLD), ("TCP", 34, GRN), ("データ %d" % (1460 if k < 2 else 80), 150 if k < 2 else 56, INK)]
            else:
                segs = ([("IP", 30, GLD), ("UDP", 30, GRN), ("データ 1472", 154, INK)] if k == 0 else
                        [("IP", 30, GLD), ("データ %d" % (1480 if k == 1 else 48), 184 if k == 1 else 56, INK)])
            xx = x0
            for nm, w, cc in segs:
                fill = PAN if cc == INK else soft(cc)
                o.append(RECT(xx, y, w, 28, 3, fill, cc, 1.2, dash="4 3" if lost else None))
                o.append(T(xx + w / 2, y + 18, nm, "middle", 9.5, cc if cc != INK else INK, True))
                xx += w
            if lost:
                o.append(W(xx + 12, y + 6, xx + 28, y + 22, c=ALI, lw=2.2))
                o.append(W(xx + 12, y + 22, xx + 28, y + 6, c=ALI, lw=2.2))
                o.append(T(xx + 34, y + 18, "失われた", "start", 10, ALI, True))
        yb = 38 + 3 * 44 + 6
        if ok:
            lines = ["各セグメントに IP と TCP のヘッダがあり、", "1 つずつ独立に届く。", "失われた 2 つ目だけを送り直す（10 章）。"]
        else:
            lines = ["ポート番号（UDP のヘッダ）は 1 つ目にしか無い。", "2 つ目が失われると、受け手は 1・3 つ目も捨てる。", "そろうまで、受け手は RAM に持ち続ける。"]
        for i, l in enumerate(lines):
            o.append(T(x0, yb + 6 + i * 16, l, "start", 10, c if i == 2 else INK, i == 2))
    o.append(W(350, 30, 350, 250, c=LIN, lw=1))
    o.append(T(16, 270, "UDP でも、アプリケーションがデータを MTU に収まる大きさ（IPv4 なら 1472 バイト以下）に分けて送れば、左と同じ形になる。", "start", 10.5, INK))
    return SVG(700, 282, o, "3000 バイトのデータを送る 2 つの方法。左は TCP が MSS（1460 バイト）ごとのセグメントに分けるので、IP パケットは MTU を超えない。右は 1 つの UDP のデータグラムを IP が 3 つのフラグメントに分ける。1 つでも失われると全体が届かず、届いた分も無駄になる。")
F["e07_segfrag"] = _f07_segfrag()
