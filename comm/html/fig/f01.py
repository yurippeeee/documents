# -*- coding: utf-8 -*-
# 01 章 組み込み通信の全体像 の図

def _f01_sub(x, y, base, sub, a="middle", sz=12, c=INK, b=False):
    """添字付きの記号（例 I と a で I_a）。"""
    w = tw(base, sz) + tw(sub, sz * 0.72)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    return ('<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-style="italic" font-weight="%s">%s'
            '<tspan dy="3" font-size="%g" font-style="normal">%s</tspan></text>' % (x0, y, sz, c, "700" if b else "400", E(base), sz * 0.72, E(sub)))

# ---- 1 節: 何が何とつながるか ----
def _f01_topology():
    o = []
    rows = [("温湿度センサ", "BLE", "スマートフォン", PUR, "携帯網・Wi-Fi"),
            ("スマートロック", "Wi-Fi", "アクセスポイント", GLD, ""),
            ("水道メータ", "LoRaWAN・LTE-M", "ゲートウェイ・基地局", GLD, ""),
            ("工場の機器", "RS-485", "制御盤のコントローラ", GLD, "Ethernet")]
    y0, dy, bh = 34, 70, 46
    xb, xr, xi, xs = 16, 262, 474, 540
    o.append(T(xb + 65, 20, "組み込み機器", "middle", 11, SIG, True))
    o.append(T(xr + 70, 20, "中継する機器", "middle", 11, GLD, True))
    o.append(T(xs + 75, 20, "サーバ", "middle", 11, GRN, True))
    for i, (dev, link, rel, rc, link2) in enumerate(rows):
        y = y0 + i * dy
        o.append(BOX(xb, y, 130, bh, dev, None, SIG, SSOFT, INK, sz=11.5))
        o.append(BOX(xr, y, 136, bh, rel, None, rc, soft(rc), INK, sz=11))
        o.append(DARR(xb + 134, y + bh / 2, xr - 4, y + bh / 2, c=SIG, lw=1.6))
        o.append(T((xb + 130 + xr) / 2, y + bh / 2 - 7, link, "middle", 10, SIG, True))
        o.append(DARR(xr + 140, y + bh / 2, xi - 2, y + bh / 2, c=GLD, lw=1.6))
        if link2:
            o.append(T((xr + 136 + xi) / 2, y + bh / 2 - 7, link2, "middle", 9.5, GLD))
    yb, ye = y0 - 4, y0 + 3 * dy + bh + 4
    o.append(RECT(xi, yb, 34, ye - yb, 8, GOSOFT, GLD, 1.3))
    o.append(T(xi + 17, (yb + ye) / 2, "インターネット", "middle", 11, GLD, True, rot=-90))
    o.append(BOX(xs, y0 + dy - 6, 150, 2 * dy - 6, "サーバ（クラウド）", "データを蓄え、指示を返す", GRN, GSOFT, INK, sz=12))
    o.append(DARR(xi + 38, y0 + 1.5 * dy + bh / 2 - 12, xs - 4, y0 + 1.5 * dy + bh / 2 - 12, c=GRN, lw=1.8))
    yl = ye + 26
    o.append(T(16, yl, "↔ どの経路も、データは両方向に流れる。", "start", 10.5, MUT))
    o.append(T(16, yl + 17, "上り（機器 → サーバ）: 測定値・状態。下り（サーバ → 機器）: 設定・命令・ファームウェアの更新。", "start", 10.5, MUT))
    return SVG(700, yl + 28, o, "組み込み機器が外と通信する 4 つの典型的な経路。機器は、スマートフォン・アクセスポイント・ゲートウェイなどの中継する機器を通して、インターネットの先のサーバとつながる。工場の機器のように、近くの機器と配線でつなぐ場合もある。")
F["e01_topology"] = _f01_topology()

# ---- 2 節: 階層 ----
def _f01_layers():
    o = []
    L1 = [("アプリケーション層", "MQTT・HTTP など（13・14 章）", PUR), ("TLS", "暗号化と相手の確認（12 章）", TEA),
          ("トランスポート層", "TCP・UDP（10・11 章）", GRN), ("ネットワーク層", "IP（07・08 章）", GLD), ("リンク層", "Wi-Fi・Ethernet（07・09 章）", SIG)]
    L2 = [("アプリケーション", "機器ごとのデータ（18 章）", PUR), ("GATT・ATT", "属性の読み書き（18 章）", PUR),
          ("L2CAP", "上の層への振り分け（16 章）", GRN), ("リンク層", "接続・再送・暗号化（16〜20 章）", SIG), ("物理層", "2.4 GHz の電波（16 章）", MUT)]
    jobs = ["意味のあるデータにする", "盗み見と改ざんを防ぐ", "確実に・順番どおりに", "宛先の機器まで届ける", "隣の機器まで届ける"]
    o.append(T(260, 22, "インターネットへ（Wi-Fi の例）", "middle", 12, INK, True))
    o.append(T(560, 22, "BLE", "middle", 12, INK, True))
    lh, gap = 44, 6
    for x0, L in ((140, L1), (440, L2)):
        for i, (name, sub, c) in enumerate(L):
            y = 36 + i * (lh + gap)
            o.append(RECT(x0, y, 240, lh, 6, soft(c), c, 1.3))
            o.append(T(x0 + 12, y + 18, name, "start", 11.5, c, True))
            o.append(T(x0 + 12, y + 35, sub, "start", 9.5, MUT))
    h1 = len(L1) * (lh + gap) - gap
    for i, j in enumerate(jobs):
        o.append(T(128, 36 + i * (lh + gap) + lh / 2 + 4, j, "end", 10, MUT))
    o.append(ARR(400, 40, 400, 36 + h1 - 4, c=FNT, lw=1.4))
    o.append(T(410, 36 + h1 / 2, "送るときは上から下へ", "middle", 9.5, FNT, rot=90))
    yb = 36 + h1 + 24
    o.append(T(350, yb, "各層は 1 つの仕事だけを受け持ち、すぐ下の層を使い、すぐ上の層に仕事を提供する。", "middle", 10.5, MUT))
    return SVG(700, yb + 12, o, "階層に分けたプロトコルスタックの例。左はインターネットにつなぐ場合（Wi-Fi の例）、右は BLE。左端の文字は、インターネットの側の各層が受け持つ仕事。括弧の中はこのシリーズで扱う章。")
F["e01_layers"] = _f01_layers()

def _f01_wrap():
    o = []
    lv = [("Wi-Fi のヘッダ", SIG), ("IP のヘッダ", GLD), ("TCP のヘッダ", GRN), ("TLS のヘッダ", TEA), ("MQTT のヘッダ", PUR)]
    x0, y0, w0, h0, m = 14, 16, 672, 150, 11
    for i, (name, c) in enumerate(lv):
        x, y = x0 + i * m, y0 + i * 22
        w, h = w0 - 2 * i * m, h0 - i * 26
        o.append(RECT(x, y, w, h, 7, soft(c), c, 1.3, op=None))
        o.append(T(x + 8, y + 15, name, "start", 10.5, c, True))
    xd, yd = x0 + 5 * m + 8, y0 + 5 * 22 + 2
    o.append(RECT(xd, yd, w0 - 2 * 5 * m - 16, 22, 5, PAN, INK, 1.4))
    o.append(T(x0 + w0 / 2, yd + 15, "温度 23.5 °C（送りたいデータ）", "middle", 11, INK, True))
    return SVG(700, y0 + h0 + 14, o, "1 つの値を送るとき、各層は自分の仕事に必要な情報（ヘッダ）を前に付けて、下の層に渡す。受け手は下の層から順にヘッダを外していく。各層が足す大きさは 07 章で数える。")
F["e01_wrap"] = _f01_wrap()

# ---- 3 節: 4 つの物差し ----
_F01_TECH = [  # 名前, 種類, 距離 [m] (min, max, 破線の延長), 速さ [bps] (min, max)
    ("UART", "有線", (0.1, 5, None), (9600, 3e6)),
    ("RS-485", "有線", (1, 1200, None), (1e5, 1e7)),
    ("Ethernet", "有線", (1, 100, None), (1e7, 1e9)),
    ("BLE", "近距離無線", (1, 50, 400), (1.25e5, 2e6)),
    ("IEEE 802.15.4", "近距離無線", (1, 50, 300), (2.2e5, 2.8e5)),
    ("Wi-Fi", "近距離無線", (1, 50, None), (1e6, 1.5e8)),
    ("LoRaWAN", "LPWA", (1000, 15000, None), (250, 1.1e4)),
    ("LTE-M", "LPWA", (100, 10000, None), (1e5, 1e6)),
    ("NB-IoT", "LPWA", (100, 15000, None), (2e4, 1.5e5)),
]
_F01_CC = {"有線": GLD, "近距離無線": SIG, "LPWA": GRN}

def _f01_dist(v):
    return ("%g m" % v) if v < 1000 else ("%g km" % (v / 1000))
def _f01_rate(v):
    if v >= 1e9: return "%g G" % (v / 1e9)
    if v >= 1e6: return "%g M" % (v / 1e6)
    if v >= 1e3: return "%g k" % (v / 1e3)
    return "%g" % v

def _f01_rate_range():
    o = []
    n = len(_F01_TECH)
    rh, y0 = 27, 40
    pd = Plot(118, y0, 270, n * rh, (0.1, 30000), (0, n), xlog=True)
    pr = Plot(420, y0, 268, n * rh, (100, 1e9), (0, n), xlog=True)
    o.append(T(pd.x + pd.w / 2, 22, "届く距離", "middle", 11.5, INK, True))
    o.append(T(pr.x + pr.w / 2, 22, "物理層の速さ [bps]", "middle", 11.5, INK, True))
    for p, ticks, f in ((pd, [0.1, 1, 10, 100, 1000, 10000], _f01_dist), (pr, [100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9], _f01_rate)):
        for v in ticks:
            xx = p.X(v)
            o.append(W(xx, y0 - 4, xx, y0 + n * rh, c=GRD, lw=1))
            o.append(T(xx, y0 + n * rh + 15, f(v), "middle", 9.5, MUT))
        o.append(W(p.x, y0 + n * rh, p.x + p.w, y0 + n * rh, c=MUT, lw=1.1))
    for i, (name, cat, d, r) in enumerate(_F01_TECH):
        yy = y0 + i * rh + 5
        c = _F01_CC[cat]
        o.append(T(108, yy + 12, name, "end", 11, INK, True))
        o.append(RECT(pd.X(d[0]), yy, pd.X(d[1]) - pd.X(d[0]), rh - 10, 4, soft(c), c, 1.3))
        if d[2]:
            o.append(RECT(pd.X(d[1]), yy, pd.X(d[2]) - pd.X(d[1]), rh - 10, 4, "none", c, 1.1, dash="4 3"))
        o.append(RECT(pr.X(r[0]), yy, max(pr.X(r[1]) - pr.X(r[0]), 4), rh - 10, 4, soft(c), c, 1.3))
    yl = y0 + n * rh + 38
    o.append(LEGEND(118, yl, [(GLD, "有線"), (SIG, "近距離の無線"), (GRN, "LPWA（遠くへ少ない電力で。21 章）")]))
    o.append(T(118, yl + 20, "破線: BLE の LE Coded（見通しの良い場所）や、IEEE 802.15.4 の中継で届く距離を広げた場合。", "start", 9.5, MUT))
    return SVG(700, yl + 30, o, "主な通信方式の、届く距離と物理層の速さ（どちらも代表値で、横軸は対数目盛）。距離は使う場所・アンテナ・送信電力で大きく変わる。LTE-M と NB-IoT の距離は、機器から携帯の基地局までの距離である。")
F["e01_rate_range"] = _f01_rate_range()

# ---- 4 節: 機器の中の構成 ----
def _f01_arch():
    o = []
    # (a) 無線内蔵マイコン
    o.append(T(115, 22, "(a) 無線を内蔵したマイコン", "middle", 11.5, INK, True))
    o.append(RECT(20, 34, 190, 150, 10, SSOFT, SIG, 1.6))
    o.append(T(30, 50, "1 つのチップ", "start", 10, SIG, True))
    for xx, ww, nm in ((30, 48, "CPU"), (82, 48, "RAM"), (134, 66, "フラッシュ")):
        o.append(BOX(xx, 58, ww, 30, nm, None, LIN, PAN, INK, sz=10.5))
    o.append(BOX(30, 96, 170, 30, "無線の回路", None, SIG, PAN, SIG, sz=10.5))
    o.append(T(115, 146, "アプリケーション・スタック・", "middle", 10, MUT))
    o.append(T(115, 160, "ドライバがすべてこの中で動く", "middle", 10, MUT))
    o.append(W(200, 111, 224, 111, 224, 84, c=SIG, lw=1.6) + W(217, 84, 231, 84, c=SIG, lw=1.6) + W(220, 89, 228, 89, c=SIG, lw=1.4))
    # (b) マイコン + 無線モジュール
    o.append(T(360, 22, "(b) マイコン + 無線モジュール", "middle", 11.5, INK, True))
    o.append(BOX(245, 52, 100, 110, "マイコン", "アプリケーションと、モジュールへの命令", LIN, PAN, INK, sz=11, ssz=9.5))
    o.append(RECT(380, 40, 105, 134, 10, SSOFT, SIG, 1.6))
    o.append(T(432, 58, "無線モジュール", "middle", 11, SIG, True))
    o.append(BOX(390, 68, 85, 40, "CPU", "スタックが動く", LIN, PAN, INK, sz=10, ssz=9))
    o.append(BOX(390, 116, 85, 30, "無線の回路", None, SIG, PAN, SIG, sz=10))
    o.append(DARR(347, 107, 378, 107, c=GLD, lw=1.6))
    o.append(T(362, 98, "UART", "middle", 9.5, GLD, True))
    o.append(T(362, 190, "命令は AT コマンドなど（06 章）", "middle", 10, MUT))
    # (c) ゲートウェイ
    o.append(T(600, 22, "(c) ゲートウェイ", "middle", 11.5, INK, True))
    o.append(RECT(520, 34, 162, 150, 10, GOSOFT, GLD, 1.6))
    o.append(T(530, 50, "Linux などが動く", "start", 10, GLD, True))
    o.append(BOX(530, 60, 66, 32, "BLE", None, SIG, PAN, SIG, sz=10.5))
    o.append(BOX(606, 60, 66, 32, "LoRa", None, GRN, PAN, GRN, sz=10.5))
    o.append(BOX(530, 102, 142, 32, "Ethernet・LTE", None, GLD, PAN, GLD, sz=10.5))
    o.append(T(601, 154, "近くの機器を集めて", "middle", 10, MUT))
    o.append(T(601, 168, "インターネットへ中継する", "middle", 10, MUT))
    return SVG(700, 204, o, "通信の機能を機器に入れる 3 つの形。(a) 無線の回路を内蔵したマイコン 1 つで、通信のソフトウェアもすべて動かす。(b) 無線と通信のソフトウェアをモジュールに任せ、マイコンは命令を送る。(c) 近くの機器のデータを集めて中継するゲートウェイ。詳しくは 06 章。")
F["e01_arch"] = _f01_arch()

def _f01_firmware():
    o = []
    L = [("アプリケーション", "測る・判断する・送るものを決める", PUR),
         ("プロトコルスタック", "TCP/IP・TLS・MQTT・BLE のホストなど", GRN),
         ("ドライバ", "UART・無線の回路などの周辺回路を操作する", GLD),
         ("ハードウェア", "マイコンの周辺回路・無線の回路", MUT)]
    s, h = STACK(120, 16, 460, L, lh=34, gap=6, sz=11.5, ssz=10)
    o.append(s)
    o.append(RECT(590, 16, 90, 34 * 3 + 12, 8, MSOFT, MUT, 1.2, dash="4 3"))
    o.append(T(635, 16 + (34 * 3 + 12) / 2 - 4, "RTOS", "middle", 11, MUT, True))
    o.append(T(635, 16 + (34 * 3 + 12) / 2 + 11, "（使う場合）", "middle", 9.5, MUT))
    o.append(T(110, 16 + 17 + 4, "ソフトウェア", "end", 10, MUT))
    o.append(T(110, 16 + 3 * 40 + 17 + 4, "ハードウェア", "end", 10, MUT))
    return SVG(700, 16 + h + 14, o, "ファームウェア（機器の中のソフトウェア）の層。プロトコルスタックはドライバを通して周辺回路を使う。RTOS を使う場合は、各層の処理をタスクに分けて動かす（OS シリーズ）。")
F["e01_firmware"] = _f01_firmware()

# ---- 5 節: 間欠動作と平均電流 ----
def _f01_duty():
    o = []
    x0, x1, yb, ytop = 60, 680, 190, 52
    ys = yb - 14                      # 眠っている間の電流（誇張して描く）
    period = 240
    starts = [100, 100 + period, 100 + 2 * period]
    wa = 34
    pts = [(x0, ys)]
    for s in starts:
        pts += [(s, ys), (s, ytop), (s + wa, ytop), (s + wa, ys)]
    pts.append((x1, ys))
    o.append(W(x0, yb, x1 + 4, yb, c=MUT, lw=1.2))
    o.append(W(x0, yb, x0, 30, c=MUT, lw=1.2))
    o.append(T(x1, yb + 16, "時間", "end", 10, MUT))
    o.append(T(x0 - 6, 40, "電流", "end", 10, MUT))
    o.append(PL(pts, c=SIG, lw=2))
    ya = yb - 52
    o.append(W(x0, ya, x1, ya, c=ALI, lw=1.6, dash="6 4"))
    o.append(T(starts[1] + wa + 16, ya - 7, "平均電流", "start", 10.5, ALI))
    o.append(_f01_sub(starts[1] + wa + 82, ya - 6, "I", "avg", "start", 12, ALI, True))
    s = starts[0]
    o.append(_f01_sub(s + wa + 8, ytop + 14, "I", "a", "start", 12, SIG, True))
    o.append(T(s + wa + 30, ytop + 14, "起きている間の電流（例 8 mA）", "start", 10.5, SIG))
    o.append(DIM(s, ytop - 12, s + wa, ytop - 12, None, c=MUT))
    o.append(_f01_sub(s + wa / 2, ytop - 17, "t", "a", "middle", 12, INK))
    o.append(T(s + wa + 8, ytop - 13, "起きている時間（例 50 ms）", "start", 10, MUT))
    o.append(DIM(starts[1], yb + 22, starts[2], yb + 22, None, c=MUT))
    o.append(T((starts[1] + starts[2]) / 2, yb + 38, "周期 T（例 60 s）", "middle", 10.5, INK))
    o.append(_f01_sub(starts[0] + wa + 12, ys - 6, "I", "s", "start", 12, SIG, True))
    o.append(T(starts[0] + wa + 32, ys - 6, "眠っている間（例 2 µA）", "start", 10, SIG))
    return SVG(700, yb + 50, o, "間欠動作する機器の電流（縦・横とも縮尺どおりではない。実際には起きている時間は周期の 1/1200 で、眠っている間の電流は起きている間の 1/4000）。平均電流は、1 周期に流れる電荷を周期で割ったもの。")
F["e01_duty"] = _f01_duty()

def _f01_life():
    o = []
    Is, Ia, ta, C = 2e-6, 8e-3, 0.05, 0.220
    yr = lambda T_: C / (Is + (Ia - Is) * ta / T_) / 24 / 365
    p = Plot(80, 20, 590, 250, (1, 1e5), (0.03, 30), xlog=True, ylog=True)
    xt = [1, 10, 100, 1000, 1e4, 1e5]
    xf = lambda v: {1: "1 s", 10: "10 s", 100: "100 s", 1000: "1000 s", 1e4: "10⁴ s", 1e5: "10⁵ s"}[v]
    o.append(p.axes(xl="周期 T（何秒ごとに起きるか）", yl="電池寿命 [年]", xt=xt, yt=[0.1, 1, 10], xfmt=xf, yfmt=lambda v: "%g" % v))
    # 2 つの漸近線
    o.append(p.line([(1, C / Is / 24 / 365), (1e5, C / Is / 24 / 365)], c=GRN, lw=1.4, dash="6 4"))
    Tmax = 20 * 24 * 365 * Ia * ta / C
    o.append(p.line([(1, C * 1 / (Ia * ta) / 24 / 365), (Tmax, 20)], c=GLD, lw=1.4, dash="6 4"))
    pts = [(10 ** (k / 20.0), yr(10 ** (k / 20.0))) for k in range(0, 101)]
    o.append(p.line(pts, c=SIG, lw=2.4))
    o.append(T(p.X(1e5) - 4, p.Y(C / Is / 24 / 365) - 7, "眠っている間の電流だけで決まる上限 12.6 年", "end", 10, GRN))
    _ang = -math.degrees(math.atan((250 / 3.0) / (590 / 5.0)))
    o.append(T(p.X(2.0), p.Y(2.0 * C / (Ia * ta) / 24 / 365) - 17, "起きている間の電荷だけで決まる線", "start", 10, GLD, rot=_ang))
    Ts = ta * (Ia - Is) / Is
    o.append(W(p.X(Ts), p.Y(0.03), p.X(Ts), p.Y(yr(Ts)), c=FNT, lw=1, dash="3 3"))
    o.append(D(p.X(Ts), p.Y(yr(Ts)), ALI, 4.2))
    o.append(T(p.X(Ts) + 8, p.Y(yr(Ts)) + 16, "T* = 200 s（2 つの寄与が等しい）", "start", 10, ALI))
    o.append(D(p.X(60), p.Y(yr(60)), SIG, 4.2))
    o.append(T(p.X(60) + 8, p.Y(yr(60)) + 18, "T = 60 s で 2.9 年", "start", 10, SIG, True))
    return SVG(700, 318, o, "周期を変えたときの電池寿命（例の値: 眠っている間 2 µA、起きている間 8 mA を 50 ms、電池 220 mAh。両軸とも対数目盛）。周期が短い間は起きている間の電荷で寿命が決まり、周期を 2 倍にすると寿命もほぼ 2 倍になる。周期が T* を大きく超えると、眠っている間の電流で決まる上限に近づき、それ以上は伸びない。")
F["e01_life"] = _f01_life()

# ---- 6 節: シリーズの地図 ----
def _f01_map():
    o = []
    parts = [("第 I 部 線の上のバイト", SIG, ["01 全体像", "02 UART", "03 フレーミングと誤り検出", "04 割り込み・DMA", "05 状態機械とタイムアウト", "06 無線モジュール"]),
             ("第 II 部 インターネットへ", GRN, ["07 階層とカプセル化", "08 DHCP・DNS・NAT", "09 Wi-Fi", "10 TCP", "11 ソケットと lwIP", "12 TLS", "13 MQTT", "14 HTTP と CoAP", "15 つなぎ続ける"]),
             ("第 III 部 BLE", PUR, ["16 BLE の全体像", "17 アドバタイズ", "18 接続と GATT", "19 速さと電力", "20 セキュリティ"]),
             ("第 IV 部 遠く・大きく・確かに", GLD, ["21 LPWA", "22 大きなデータ", "23 検証", "24 設計"])]
    cw, gap, x0, y0 = 162, 12, 16, 12
    for k, (title, c, chs) in enumerate(parts):
        x = x0 + k * (cw + gap)
        o.append(RECT(x, y0, cw, 30, 7, soft(c), c, 1.4))
        o.append(T(x + cw / 2, y0 + 19, title, "middle", 10, c, True))
        for i, ch in enumerate(chs):
            yy = y0 + 40 + i * 27
            o.append(RECT(x + 6, yy, cw - 12, 22, 5, PAN, LIN, 1.1))
            o.append(T(x + 14, yy + 15, ch, "start", 10.5, INK))
    return SVG(700, y0 + 40 + 9 * 27 + 8, o, "このシリーズの 4 つの部と各章。第 I 部で 1 本の線の上のバイトの扱い（どの通信方式でも使う道具）を、第 II 部でインターネット、第 III 部で BLE、第 IV 部で遠距離の無線・大きなデータ・検証・設計を扱う。")
F["e01_map"] = _f01_map()
