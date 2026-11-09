# -*- coding: utf-8 -*-
# 04 章 実例 設計書（温湿度ロガー LG-DES-001 版 1.0）の図。数値は s04/check.py で検算した例の値（本文の表と同じ）。

# =====================================================================
# 本文と同じ値
# =====================================================================
_F04_Q = 180.0                 # 設計で使う容量 [mAh]
_F04_LIM = _F04_Q / 8760 * 1000.0   # 電力の予算の上限 [µA]
# 電力の予算（表 5-1）: (部品, 状態, 平均電流への寄与 [µA], 04 章で足した項目か)
_F04_PB = [
    ("マイコン", "眠り", 1.999900, False), ("マイコン", "動作（測定と記録）", 0.005500, False),
    ("マイコン", "動作（表示を始める）", 0.001023, True), ("マイコン", "動作（電池の電圧を測る）", 0.000833, True),
    ("マイコン", "送信（受付）", 0.138889, False), ("マイコン", "送信（接続）", 0.099206, False),
    ("センサ", "待機", 0.050000, False), ("センサ", "測定", 0.002500, False),
    ("フラッシュ", "眠り", 0.499999, False), ("フラッシュ", "書き込み（記録）", 0.005833, False),
    ("フラッシュ", "書き込み（印）", 0.000417, True), ("フラッシュ", "消去", 0.001471, False),
    ("電圧を測る回路", "試しの負荷", 0.002222, True),
    ("LED", "記録中の表示", 1.333333, False), ("LED", "通信中の表示", 0.029762, False), ("LED", "状態の応答", 0.000463, False)]
_F04_TOT = sum(v for _, _, v, _ in _F04_PB)    # 4.1714 µA
# 電池寿命の比べ（図 5-1 の (b)）: (名前, 補足, 寿命 [年], 仕様を変えるか)
_F04_CASES = [("本文の設計（A）", None, 4.926, False), ("電池少の期間（41 日）を入れる", None, 4.890, False),
              ("警報の表示が続く", None, 3.732, False), ("−20 °C で使い続ける（121 mAh）", None, 3.309, False),
              ("代案 B: 常に 1 秒ごと", "SR-U06 の変更が要る", 1.465, True), ("代案 C: 常に 100 ms ごと", "SR-U06 の変更が要る", 0.198, True)]

# 51 件の要求（仕様書の表 6-1 の順。ST の番号はこの順に 001〜051）と、受け持つ設計の要素
_F04_DS = ["H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08", "S01", "S02", "S03", "S04", "S05", "S06", "S07",
           "D01", "D02", "D03", "B01", "B02", "B03", "B04"]
_F04_DSN = {"H01": "マイコン", "H02": "温湿度センサ", "H03": "記録用フラッシュ", "H04": "時計の水晶", "H05": "ボタンと LED",
            "H06": "電池ホルダと電圧を測る回路", "H07": "アンテナ", "H08": "筐体", "S01": "測定", "S02": "記録", "S03": "通信",
            "S04": "操作と表示", "S05": "時刻と監視", "S06": "設定", "S07": "基盤", "D01": "記録の形式", "D02": "フラッシュの配置",
            "D03": "設定の形式", "B01": "電力の予算", "B02": "メモリの予算", "B03": "処理時間の予算", "B04": "費用の予算"}
_F04_REQ = [
    ("F01", "温度と湿度を測る", "H02 H04 S01 S05"), ("F02", "記録の間隔 1〜60 分", "S01 S03 S06 D03"),
    ("F03", "1 件の記録を保存", "S01 S02 D01"), ("F04", "52 560 件以上", "H03 S02 D02 B02"),
    ("F05", "容量に達したとき", "S02 S06 D03"), ("F06", "長押しで開始・停止", "H05 S01 S04"),
    ("F07", "全部・差分の読み出し", "S02 S03 S06"), ("F08", "接続のたびに時刻", "S03 S05"),
    ("F09", "時刻未設定の印", "S05 D01"), ("F10", "警報の印", "S01 D01"),
    ("F11", "確認まで警報の表示", "S03 S04 S06"), ("F12", "アプリから設定", "S03 S06 D03"),
    ("F13", "電池少を 14 日前に", "H06 S03 S04 S05"), ("F14", "アプリから開始・停止", "S01 S03"),
    ("F15", "警報を LED で", "H05 S01 S04"), ("F16", "上限と下限の範囲", "S03 D03"),
    ("F17", "設定を保持", "H03 S06 D03"), ("F18", "状態遷移表のとおり", "S01 S03 S04"),
    ("U01", "ボタン 1 個・短押し・長押し", "H05 S04"), ("U02", "状態の応答", "S04"), ("U03", "LED の表示の表", "H05 S04"),
    ("U04", "開始で緑 3 回", "S04"), ("U05", "1〜3 秒は何もしない", "S04"), ("U06", "2 分間受け付ける", "S03"),
    ("U07", "停止で赤 3 回", "S04"),
    ("I01", "BLE 4.2 以上", "H01 S07"), ("I02", "見通し 10 m", "H01 H07"), ("I03", "LG-ICD-001 に従う", "S03 D01"),
    ("P01", "温度の誤差", "H02 S01"), ("P02", "湿度の誤差", "H02 S01"), ("P03", "記録の時刻 ±2 秒", "S05 B03"),
    ("P04", "30 日で ±60 秒", "H04 S05"), ("P05", "読み出し 60 秒以内", "H01 S02 S03 B03"), ("P06", "10 秒以内に接続", "H01 S03 S04"),
    ("W01", "CR2032 1 個", "H06 H08"), ("W02", "電池寿命 1 年", "H01 H02 H03 H05 B01"), ("W03", "工具なしで交換", "H08"),
    ("W04", "交換しても保持", "H03 S02 S06 D02 D03"),
    ("E01", "−20〜+60 °C で動く", "H01 H02 H03 H08"), ("E02", "−30〜+70 °C で保存", "H03 H08"), ("E03", "IP54 相当", "H08"),
    ("E04", "1.0 m の落下", "H06 H08"),
    ("R01", "10 年保持", "H03 D02"), ("R02", "誤りを検出できる", "S03 D02"), ("R03", "10 秒以内に戻る", "H01 S05 S06"),
    ("R04", "1 分間隔で 5 年", "H03 S02 B02"), ("R05", "止まっても保持", "S02 S06 D03"),
    ("S01", "PIN", "S03 S06"), ("S02", "電波法", "H01 H07"), ("C01", "大きさと重さ", "H08"), ("C02", "部品の費用", "B04"),
]


# =====================================================================
# 補助
# =====================================================================
def _f04_cell(x, y, w, h, lines, tc=INK, fill="none", c=LIN, sz=9.5, b=False, a="middle", lw=1.0, lh=None, pad=6, mono=False):
    """表のマス（枠と、縦に中央をそろえた複数行の文字）。"""
    o = [RECT(x, y, w, h, 0, fill, c, lw)]
    if isinstance(lines, str):
        lines = [lines]
    lh = lh or sz * 1.32
    n = len(lines)
    y0 = y + h / 2 - (n - 1) * lh / 2 + sz * 0.35
    xx = x + w / 2 if a == "middle" else (x + pad if a == "start" else x + w - pad)
    for i, l in enumerate(lines):
        if l:
            o.append(T(xx, y0 + i * lh, l, a, sz, tc, b, mono))
    return "".join(o)


def _f04_lines(x, y, lines, a="start", sz=9.5, c=MUT, b=False, lh=None, mono=False):
    lh = lh or sz * 1.36
    return "".join(T(x, y + i * lh, l, a, sz, c, b, mono) for i, l in enumerate(lines) if l)


def _f04_page(x, y, w, h, c=PUR, fold=12, fill=PAN):
    """文書の 1 ページ（右上の角を折った形）。"""
    pts = [(x, y), (x + w - fold, y), (x + w, y + fold), (x + w, y + h), (x, y + h), (x, y)]
    return (PL(pts, c=c, lw=1.3, fill=fill)
            + PL([(x + w - fold, y), (x + w - fold, y + fold), (x + w, y + fold)], c=c, lw=1.0))


def _f04_chip(x, y, s, c=SIG, sz=9.5, a="start", mono=False):
    return CHIP(x, y, s, c, sz, 4, a, mono)[0]


def _f04_chipw(s, sz=9.5, mono=False):
    return tw(s, sz, mono) + 8


def _f04_num(x, y, k, c=PUR, r=7.5):
    """丸で囲んだ番号（手順の番号）。"""
    return CIRC(x, y, r, c=c, lw=1.4, fill=SCR) + T(x, y + 3.4, str(k), "middle", 9.5, c, True)


def _f04_part(x, y, w, h, did, nm, sub=None, c=TEA, sz=10):
    """ブロック図の部品（ID・名前・補足）。"""
    o = [RECT(x, y, w, h, 6, soft(c), c, 1.4)]
    n = 2 + (1 if sub else 0)
    yy = y + h / 2 - (n - 1) * 6.8 + 3.5
    o.append(T(x + w / 2, yy, did, "middle", 9.5, c, True, True))
    o.append(T(x + w / 2, yy + 14, nm, "middle", sz, INK, True))
    if sub:
        o.append(T(x + w / 2, yy + 28, sub, "middle", 9.5, MUT))
    return "".join(o)


def _f04_actor(x, y, w, h, nm, sub=None):
    """外の相手（金色の箱）。"""
    o = [RECT(x, y, w, h, 8, soft(GLD), GLD, 1.3)]
    if sub:
        o.append(T(x + w / 2, y + h / 2 - 2, nm, "middle", 10, GLD, True))
        o.append(T(x + w / 2, y + h / 2 + 12, sub, "middle", 9.5, MUT))
    else:
        o.append(T(x + w / 2, y + h / 2 + 4, nm, "middle", 10, GLD, True))
    return "".join(o)


def _f04_zig(x1, y, x2, c=SIG, n=7, a=5):
    pts = [(x1, y)]
    for k in range(1, n + 1):
        pts.append((x1 + (x2 - x1) * k / (n + 1), y + (a if k % 2 else -a)))
    pts.append((x2, y))
    return PL(pts, c=c, lw=1.3)


# =====================================================================
# 1 節: 設計書の構成と、入力・出力の文書（図 1-1）
# =====================================================================
def _f04_toc():
    o = []
    o.append(T(14, 18, "LG-DES-001 温湿度ロガー 設計書 版 1.0 の構成", "start", 12, INK, True))
    xs = [14, 152, 330, 574, 686]     # 入力 | 節 | 決めること | 出力
    heads = [("入力（仕様書の表など）", SIG), ("設計書の節", PUR), ("決めること（主な ID）", PUR), ("出力", GRN)]
    for k, (h, c) in enumerate(heads):
        o.append(T(xs[k] + 4, 42, h, "start", 10, c, True))
    rows = [
        (["表 1-1・1-5"], "1 文書の情報と", "設計の入力", ["版・入力の文書・決めることと", "任せること・設計を縛る要求"], [("—", MUT)]),
        (["表 4-1〜4-6・5-1〜5-5"], "2 方式設計", None, ["ブロック図・部品と選んだ理由・", "電流の上限（DS-H01〜H08・DS-S01〜S07）"], [("LG-HW-001", TEA)]),
        (["表 2-2", "LG-ICD-001 版 1.0"], "3 インタフェース", "の設計", ["ピン・バスの命令・GATT・", "記録とフラッシュの形式（DS-D01〜D03）"], [("LG-HW-001", TEA), ("コード", PUR)]),
        (["表 3-2〜3-6"], "4 ソフトウェア", "の設計", ["層・タスク・中の状態遷移表・", "測定と読み出しの流れ"], [("コード", PUR), ("単体試験", GRN)]),
        (["表 5-1〜5-5"], "5 資源の見積もり", None, ["電力・メモリ・処理時間・費用の予算", "（DS-B01〜B04）・設計判断 03・04"], [("結合試験", GRN)]),
        (["表 6-1"], "6 異常時の設計と", "試験へのつながり", ["異常時の処理・起動の手順・", "要求と設計と試験の対応"], [("LG-TST-001", GRN)]),
    ]
    y0, rh, gap = 52, 46, 6
    o.append(_f04_page(xs[1] - 6, y0 - 4, xs[3] - xs[1] - 14, len(rows) * (rh + gap) + 2, PUR, 12, "none"))
    for k, (ins, t1, t2, dec, outs) in enumerate(rows):
        y = y0 + k * (rh + gap)
        # 入力
        for j, s in enumerate(ins):
            o.append(_f04_chip(xs[0], y + 16 + j * 19, s, SIG, 9.5))
        o.append(ARR(xs[1] - 30, y + rh / 2, xs[1] - 9, y + rh / 2, c=SIG, lw=1.2, head=5))
        # 節
        o.append(RECT(xs[1], y, xs[2] - xs[1] - 8, rh, 5, soft(PUR), PUR, 1.1))
        if t2:
            o.append(T(xs[1] + 8, y + 19, t1, "start", 10, PUR, True))
            o.append(T(xs[1] + 22, y + 34, t2, "start", 10, PUR, True))
        else:
            o.append(T(xs[1] + 8, y + rh / 2 + 4, t1, "start", 10, PUR, True))
        # 決めること
        o.append(_f04_lines(xs[2] + 2, y + 19, dec, "start", 9.5, INK, lh=14))
        # 出力
        o.append(ARR(xs[3] - 18, y + rh / 2, xs[3] - 2, y + rh / 2, c=MUT, lw=1.2, head=5))
        xx = xs[3] + 2
        for s, c in outs:
            if s == "—":
                o.append(T(xx, y + rh / 2 + 4, "—", "start", 9.5, MUT))
                continue
            o.append(_f04_chip(xx, y + rh / 2 + 4, s, c, 9.5))
            xx += _f04_chipw(s) + 4
    yb = y0 + len(rows) * (rh + gap) + 18
    o.append(T(14, yb, "入力: LG-SYS-001 版 1.0 の表と LG-ICD-001 版 1.0。出力: 回路図と部品表 LG-HW-001・コード・試験（単体・結合・システム）", "start", 9.5, MUT))
    return SVG(700, yb + 8, o, "図 1-1 設計書の構成と、各節の入力と出力（左の表の番号は仕様書 LG-SYS-001 の表の番号）。")
F["e04_toc"] = _f04_toc()


# =====================================================================
# 1 節: この文書が決めること・任せること（図 1-2）
# =====================================================================
def _f04_scope():
    o = []
    xs = [14, 214, 470, 686]
    heads = [("仕様書が決めた（何を）", SIG), ("この設計書が決める（どう）", PUR), ("ほかに任せる（任せる先）", MUT)]
    for k, (h, c) in enumerate(heads):
        o.append(RECT(xs[k], 8, xs[k + 1] - xs[k] - 6, 24, 4, soft(c), c, 1.1))
        o.append(T(xs[k] + 8, 25, h, "start", 10, c if c != MUT else INK, True))
    rows = [
        (("SR-U06", ["短押しから 2 分間、接続を", "受け付けること"]),
         ["短押しの後の 2 分だけ、100 ms ごとに", "アドバタイズする。2 分は通信タスク", "が数える（3.3・4.3）"],
         ["アドバタイズの中身: LG-ICD-001", "関数の中の手順: コード"]),
        (("SR-F04", ["52 560 件以上の記録を保存", "できること"]),
         ["4 Mbit の NOR フラッシュのうち 126 セクタを、", "1 セクタ 510 件で順に回して使う", "（3.4・3.5）"],
         ["番地を計算する手順: コード", "部品の型番: LG-HW-001 の部品表"]),
        (("SR-R03", ["止まったら 10 秒以内に、", "止まる前の主のモードに戻る"]),
         ["ウォッチドッグ 8 秒。合図は全部の", "タスクが待ちに入ってから送る。", "リセットの原因で起動を分ける（6.2）"],
         ["ウォッチドッグのレジスタの", "設定: コード（ドライバ）"]),
        (("SR-C01", ["60 × 40 × 15 mm 以内、", "30 g 以下であること"]),
         ["部品を 8 つの要素と受動部品に", "限る。筐体はパッキンで閉じる", "（2.2）"],
         ["基板と筐体の図面:", "LG-HW-001・筐体の図面"]),
    ]
    y, rh = 38, 62
    for k, (spec, des, other) in enumerate(rows):
        yy = y + k * (rh + 6)
        o.append(RECT(xs[0], yy, xs[1] - xs[0] - 6, rh, 5, "none", SIG, 1.0))
        o.append(_f04_chip(xs[0] + 8, yy + 18, spec[0], SIG, 9.5, mono=True))
        o.append(_f04_lines(xs[0] + 8, yy + 36, spec[1], "start", 9.5, INK, lh=13))
        o.append(RECT(xs[1], yy, xs[2] - xs[1] - 6, rh, 5, soft(PUR), PUR, 1.0))
        o.append(_f04_lines(xs[1] + 8, yy + 19, des, "start", 9.5, INK, lh=14))
        o.append(RECT(xs[2], yy, xs[3] - xs[2], rh, 5, "none", LIN, 1.0))
        o.append(_f04_lines(xs[2] + 8, yy + 26, other, "start", 9.5, MUT, lh=14))
        o.append(ARR(xs[1] - 6, yy + rh / 2, xs[1] - 1, yy + rh / 2, c=MUT, lw=1.1, head=5))
        o.append(ARR(xs[2] - 6, yy + rh / 2, xs[2] - 1, yy + rh / 2, c=MUT, lw=1.1, head=5))
    yb = y + len(rows) * (rh + 6) + 10
    o.append(T(14, yb, "左ほど外から見えることで、右ほど作り方の細部になる。この設計書は真ん中の列を書き、理由を添える", "start", 9.5, MUT))
    return SVG(700, yb + 8, o, "図 1-2 この設計書が決めることと、ほかの文書とコードに任せること（4 つの要求の例）。")
F["e04_scope"] = _f04_scope()


# =====================================================================
# 2 節: ブロック図（図 2-1）
# =====================================================================
def _f04_block():
    o = []
    Y = 6
    o.append(RECT(150, Y + 22, 412, 336, 10, "none", SIG, 1.4, dash="6 4"))
    o.append(T(160, Y + 40, "DS-H08 筐体（システムの境界）", "start", 10, SIG, True))
    o.append(_f04_part(166, Y + 54, 112, 52, "DS-H05", "ボタンと LED", "緑・赤 各 2 mA"))
    o.append(_f04_part(320, Y + 52, 116, 44, "DS-H04", "水晶 32.768 kHz"))
    o.append(_f04_part(470, Y + 52, 80, 44, "DS-H07", "アンテナ"))
    o.append(_f04_part(318, Y + 128, 120, 84, "DS-H01", "マイコン", "BLE を内蔵"))
    o.append(_f04_part(166, Y + 142, 112, 56, "DS-H03", "記録用フラッシュ", "NOR 4 Mbit"))
    o.append(_f04_part(470, Y + 142, 80, 56, "DS-H02", "温湿度", "センサ"))
    o.append(_f04_part(288, Y + 268, 176, 60, "DS-H06", "電池ホルダと", "電圧を測る回路"))
    # 電源（太い線）
    o.append(W(376, Y + 268, 376, Y + 212, c=INK, lw=3))
    o.append(W(288, Y + 290, 222, Y + 290, 222, Y + 198, c=INK, lw=3))
    o.append(W(464, Y + 290, 510, Y + 290, 510, Y + 198, c=INK, lw=3))
    o.append(T(382, Y + 246, "3 V", "start", 9.5, INK, True, halo=True))
    # バス
    o.append(W(278, Y + 170, 318, Y + 170, c=TEA, lw=3.2))
    o.append(T(298, Y + 163, "SPI", "middle", 9.5, TEA, True, halo=True))
    o.append(T(298, Y + 185, "8 MHz", "middle", 9.5, TEA, False, halo=True))
    o.append(W(438, Y + 170, 470, Y + 170, c=TEA, lw=3.2))
    o.append(T(454, Y + 163, "I2C", "middle", 9.5, TEA, True, halo=True))
    o.append(T(454, Y + 185, "400 kHz", "middle", 9.5, TEA, False, halo=True))
    # 1 本の信号
    o.append(W(278, Y + 70, 300, Y + 70, 300, Y + 136, c=MUT, lw=1.3))
    o.append(ARR(300, Y + 136, 318, Y + 136, c=MUT, lw=1.3, head=6))
    o.append(T(304, Y + 120, "BUTTON", "start", 9, MUT, False, True, halo=True))
    o.append(W(318, Y + 150, 290, Y + 150, 290, Y + 92, c=MUT, lw=1.3))
    o.append(ARR(290, Y + 92, 278, Y + 92, c=MUT, lw=1.3, head=6))
    o.append(T(286, Y + 112, "LED ×2", "end", 9, MUT, False, False, halo=True))
    o.append(W(360, Y + 96, 360, Y + 128, c=MUT, lw=1.3))
    o.append(W(396, Y + 96, 396, Y + 128, c=MUT, lw=1.3))
    o.append(T(378, Y + 116, "XL", "middle", 9, MUT, False, True, halo=True))
    o.append(W(438, Y + 140, 456, Y + 140, 456, Y + 74, 470, Y + 74, c=SIG, lw=1.3))
    o.append(T(452, Y + 112, "RF", "end", 9, SIG, False, True, halo=True))
    o.append(ARR(424, Y + 268, 424, Y + 214, c=MUT, lw=1.3, head=6))
    o.append(T(428, Y + 238, "VBAT_ADC", "start", 9, MUT, False, True, halo=True))
    o.append(ARR(334, Y + 212, 334, Y + 266, c=MUT, lw=1.3, head=6))
    o.append(T(330, Y + 254, "VBAT_EN", "end", 9, MUT, False, True, halo=True))
    # 外の相手
    o.append(_f04_actor(14, Y + 54, 112, 56, "利用者", "（管理者・作業者）"))
    o.append(ARR(126, Y + 66, 166, Y + 66, c=GLD, lw=1.5, head=6))
    o.append(T(146, Y + 61, "押す", "middle", 9.5, GLD, False, halo=True))
    o.append(ARR(166, Y + 98, 126, Y + 98, c=GLD, lw=1.5, head=6))
    o.append(T(146, Y + 112, "見る", "middle", 9.5, GLD, False, halo=True))
    o.append(_f04_actor(14, Y + 274, 112, 50, "電池 CR2032", "（利用者が入れる）"))
    o.append(ARR(126, Y + 299, 288, Y + 299, c=GLD, lw=1.5, head=6))
    o.append(T(207, Y + 293, "電力", "middle", 9.5, GLD, False, halo=True))
    o.append(W(70, Y + 110, 70, Y + 274, c=GLD, lw=1.3, dash="4 3"))
    o.append(T(76, Y + 200, "替える", "start", 9.5, GLD, False, halo=True))
    o.append(_f04_actor(580, Y + 46, 106, 54, "スマートフォン", "のアプリ"))
    o.append(_f04_zig(550, Y + 74, 580))
    o.append(T(565, Y + 62, "BLE", "middle", 9.5, SIG, True, halo=True))
    o.append(_f04_actor(580, Y + 146, 106, 50, "周囲の空気", "（温度・湿度）"))
    o.append(ARR(580, Y + 171, 552, Y + 171, c=GLD, lw=1.5, head=6))
    # 凡例
    yl = Y + 380
    o.append(W(16, yl - 4, 44, yl - 4, c=INK, lw=3))
    o.append(T(50, yl, "電源", "start", 9.5, MUT))
    o.append(W(92, yl - 4, 120, yl - 4, c=TEA, lw=3.2))
    o.append(T(126, yl, "バス", "start", 9.5, MUT))
    o.append(ARR(164, yl - 4, 192, yl - 4, c=MUT, lw=1.3, head=6))
    o.append(T(198, yl, "1 本の信号（ピンの名前は表 3-1）", "start", 9.5, MUT))
    o.append(RECT(384, yl - 10, 26, 12, 3, "none", SIG, 1.3, dash="4 3"))
    o.append(T(416, yl, "システムの境界", "start", 9.5, MUT))
    o.append(RECT(506, yl - 10, 22, 12, 3, soft(GLD), GLD, 1.1))
    o.append(T(534, yl, "外の相手（仕様書の図 2-2）", "start", 9.5, MUT))
    return SVG(700, yl + 10, o, "図 2-1 ロガーのブロック図（DS- は設計の要素の ID。バスの速さと電流は例の値）。")
F["e04_block"] = _f04_block()


# =====================================================================
# 2 節: 電力の予算を部品の上限に分ける（図 2-2）
# =====================================================================
_F04_CAPS = [  # (名前, 上限 [µA], 見積もり [µA], 受け持つ要素, 色)
    ("マイコンの眠り", 3.0, 1.9999, "DS-H01", PUR),
    ("フラッシュの眠り", 1.0, 0.5, "DS-H03・DS-S02", TEA),
    ("センサの待機", 0.2, 0.05, "DS-H02", GRN),
    ("LED の表示", 2.0, 1.3646, "DS-H05・DS-S04", GLD),
    ("無線（受付と接続）", 0.5, 0.2381, "DS-S03", SIG),
    ("測定と記録の動作", 0.2, 0.0157, "DS-S01・DS-S02", ALI),
    ("電池の電圧の測定", 0.1, 0.0031, "DS-H06・DS-S05", MUT),
]


def _f04_derived():
    o = []
    x0, x1 = 150, 676
    vmax = 21.0
    X = lambda v: x0 + v / vmax * (x1 - x0)
    tgt = _F04_LIM / 2
    caps = sum(c for _, c, _, _, _ in _F04_CAPS)
    o.append(T(14, 18, "(a) 上限 20.5 µA の半分を、部品ごとの電流の上限に分ける", "start", 11.5, INK, True))
    rows = [("上限（SR-W02・Q）", 36), ("部品ごとの上限", 76), ("見積もり（5.1）", 126)]
    for lab, y in rows:
        o.append(T(x0 - 8, y + 15, lab, "end", 10, INK, True))
    # 上限
    o.append(RECT(X(0), 36, X(_F04_LIM) - X(0), 22, 2, soft(SIG), SIG, 1.2))
    o.append(T(X(_F04_LIM) - 6, 51, "20.5 µA", "end", 9.5, SIG, True))
    # 部品ごとの上限（積み上げ）
    acc = 0.0
    for nm, cap, est, ids, c in _F04_CAPS + [("予備", tgt - caps, 0.0, "", LIN)]:
        xa, xb = X(acc), X(acc + cap)
        o.append(RECT(xa, 76, xb - xa, 28, 0, soft(c) if c != LIN else PAN, c if c != LIN else MUT, 1.0, dash=None if c != LIN else "3 2"))
        if xb - xa > 22:
            o.append(T((xa + xb) / 2, 94, "%g" % round(cap, 2), "middle", 9.5, c if c != LIN else MUT, True))
        acc += cap
    o.append(W(X(tgt), 68, X(tgt), 110, c=PUR, lw=1.6, dash="5 3"))
    o.append(T(X(tgt) + 4, 66, "目標 10.3 µA（余裕 2 倍）", "start", 9.5, PUR, True, halo=True))
    # 見積もり（積み上げ）
    acc = 0.0
    for nm, cap, est, ids, c in _F04_CAPS:
        xa, xb = X(acc), X(acc + est)
        o.append(RECT(xa, 126, max(xb - xa, 0.8), 28, 0, soft(c), c, 1.0))
        acc += est
    o.append(T(X(acc) + 6, 144, "4.17 µA", "start", 9.5, INK, True))
    # 目盛
    ya = 166
    o.append(W(X(0), ya, X(vmax), ya, c=MUT, lw=1))
    for v in range(0, 22, 2):
        o.append(W(X(v), ya, X(v), ya + 4, c=MUT, lw=1))
        o.append(T(X(v), ya + 15, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, ya + 30, "平均電流 [µA]", "middle", 10, MUT))
    # (b) 派生要求の表
    yb = ya + 50
    o.append(W(14, yb - 10, 686, yb - 10, c=LIN, lw=0.8))
    o.append(T(14, yb + 8, "(b) 部品の派生要求（電流の上限）と、選んだ部品と設計の見積もり", "start", 11.5, INK, True))
    cw = [190, 130, 130, 220]
    hd = ["項目", "派生要求（上限）", "見積もり", "受け持つ設計の要素"]
    x = 14
    for w, h in zip(cw, hd):
        o.append(_f04_cell(x, yb + 18, w, 22, h, INK, SCR, LIN, 9.5, True))
        x += w
    for k, (nm, cap, est, ids, c) in enumerate(_F04_CAPS):
        y = yb + 40 + k * 22
        x = 14
        o.append(RECT(x + 6, y + 6, 10, 10, 2, soft(c), c, 1.0))
        o.append(_f04_cell(x, y, cw[0], 22, nm, INK, "none", LIN, 9.5, False, "start", pad=22))
        x += cw[0]
        o.append(_f04_cell(x, y, cw[1], 22, "%g µA 以下" % cap, PUR, "none", LIN, 9.5, True))
        x += cw[1]
        es = ("%.2f" % est) if est >= 0.1 else ("%.3f" % est)
        o.append(_f04_cell(x, y, cw[2], 22, es + " µA", INK, "none", LIN, 9.5))
        x += cw[2]
        o.append(_f04_cell(x, y, cw[3], 22, ids, MUT, "none", LIN, 9.5, False, "start", mono=False))
    yend = yb + 40 + len(_F04_CAPS) * 22
    o.append(T(14, yend + 16, "予備 %.2f µA は、部品の電流のばらつきと、後から足す機能のために残す" % (tgt - caps), "start", 9.5, MUT))
    return SVG(700, yend + 24, o, "図 2-2 SR-W02 の電力の上限を部品ごとの上限に分けた派生要求（例の値。見積もりは表 5-1 の項目を部品ごとにまとめた値）。")
F["e04_derived"] = _f04_derived()


# =====================================================================
# 3 節: センサとフラッシュのやり取り（図 3-1）
# =====================================================================
def _f04_frames(x, y, segs, h=26, sz=9.5):
    """横に並ぶ欄（バスの 1 回のやり取り）。segs = [(文字, 幅, 色), ...]。返り値 (svg, 右端の x)。"""
    o = []
    for lab, w, c in segs:
        o.append(RECT(x, y, w, h, 2, soft(c), c, 1.0))
        o.append(T(x + w / 2, y + h / 2 + sz * 0.38, lab, "middle", sz, c, True))
        x += w
    return "".join(o), x


def _f04_bus():
    o = []
    o.append(T(14, 18, "(a) センサとの測定 1 回（I2C 400 kHz・アドレス 0x44）", "start", 11.5, INK, True))
    yb = 34
    o.append(T(14, yb + 17, "バス", "start", 10, INK, True))
    s1, xa1 = _f04_frames(66, yb, [("S", 14, MUT), ("44 W", 40, PUR), ("A", 14, TEA), ("命令 2 B", 62, PUR), ("A", 14, TEA), ("P", 14, MUT)])
    o.append(s1)
    xg0, xg1 = xa1 + 8, xa1 + 96
    o.append(W(xg0, yb + 13, xg1, yb + 13, c=MUT, lw=1.2, dash="3 3"))
    for xx in (xg0 + 30, xg0 + 36):
        o.append(W(xx - 3, yb + 3, xx + 3, yb + 23, c=FNT, lw=1.2))
    s2, xc1 = _f04_frames(xg1 + 8, yb, [("S", 14, MUT), ("44 R", 40, PUR), ("A", 14, TEA), ("温度 2 B", 52, TEA), ("CRC", 30, TEA),
                                         ("湿度 2 B", 52, TEA), ("CRC", 30, TEA), ("NA", 22, PUR), ("P", 14, MUT)])
    o.append(s2)
    o.append(DIM(66, yb + 36, xa1, yb + 36, None, c=MUT))
    o.append(T((66 + xa1) / 2, yb + 50, "72.5 µs", "middle", 9.5, MUT))
    o.append(DIM(xg0, yb + 36, xg1, yb + 36, None, c=GLD))
    o.append(T((xg0 + xg1) / 2, yb + 50, "待つ 5 ms（眠る）", "middle", 9.5, GLD, True))
    o.append(DIM(xg1 + 8, yb + 36, xc1, yb + 36, None, c=MUT))
    o.append(T((xg1 + 8 + xc1) / 2, yb + 50, "162.5 µs", "middle", 9.5, MUT))
    # 失敗したときの決まり
    yr = yb + 64
    rules = [("A が返らない", ["1 ms おいて初めからやり直す。3 回続けば、", "測定異常の 1 件（温度 80 00・湿度 FF）を書く"]),
             ("CRC-8 が合わない", ["1 回だけ読み直す。また合わなければ、", "上と同じく測定異常の 1 件を書く"])]
    for k, (t, ls) in enumerate(rules):
        x = 14 + k * 340
        o.append(RECT(x, yr, 330, 50, 6, soft(ALI), ALI, 1.0))
        o.append(T(x + 10, yr + 17, t, "start", 10, ALI, True))
        o.append(_f04_lines(x + 116, yr + 17, ls, "start", 9.5, INK, lh=14))
    o.append(T(14, yr + 68, "S: 始め　W: 書く　R: 読む　A: 受け取りの合図　NA: もう要らない　P: 終わり　44: アドレス 0x44", "start", 9.5, MUT))
    # (b) SPI
    y0 = yr + 92
    o.append(W(14, y0 - 12, 686, y0 - 12, c=LIN, lw=0.8))
    o.append(T(14, y0 + 6, "(b) 記録 1 件を書く命令の並び（SPI 8 MHz。横の長さは時間に比例しない）", "start", 11.5, INK, True))
    ys = y0 + 22
    o.append(T(14, ys + 17, "SPI", "start", 10, INK, True))
    seq = [("AB", 30, PUR, ["戻す"]), (None, 34, GLD, ["30 µs"]), ("06", 26, PUR, ["許可"]), ("02 番地 記録 8 B", 100, PUR, ["書く"]),
           (None, 70, GLD, ["0.7 ms", "（05 で待つ）"]), ("03 番地 8 B", 80, TEA, ["読み返して", "比べる"]), ("06", 26, PUR, ["許可"]),
           ("02 番地+7 印 1 B", 100, PUR, ["書き終わりの", "印を書く"]), (None, 44, GLD, ["0.05 ms"]), ("05", 26, TEA, ["状態"]), ("B9", 30, PUR, ["眠らせる"])]
    x = 96
    xr = []
    for lab, w, c, sub in seq:
        if lab is None:
            o.append(W(x + 2, ys + 13, x + w - 2, ys + 13, c=GLD, lw=1.2, dash="3 3"))
            o.append(_f04_lines(x + w / 2, ys + 44, sub, "middle", 9.5, GLD, True, lh=13))
        else:
            o.append(RECT(x + 2, ys, w - 4, 26, 3, soft(c), c, 1.1))
            o.append(T(x + w / 2, ys + 17, lab, "middle", 9.5, c, True, True))
            o.append(_f04_lines(x + w / 2, ys + 44, sub, "middle", 9.5, INK, lh=13))
        xr.append((x, x + w))
        x += w
    # フラッシュの状態（命令の欄の位置から決める）
    yf = ys + 76
    o.append(T(14, yf + 14, "フラッシュ", "start", 10, INK, True))
    st = [(70, xr[0][0], "眠り", MUT), (xr[0][0], xr[3][1], "受ける", TEA), (xr[4][0], xr[4][1], "書く 5 mA", PUR),
          (xr[5][0], xr[7][1], "受ける・読む", TEA), (xr[8][0], xr[8][1], "書く", PUR), (xr[9][0], xr[10][1], "", TEA), (xr[10][1], 686, "眠り", MUT)]
    for a, b, s_, c in st:
        on = c != MUT
        o.append(RECT(a, yf, b - a, 20, 2, soft(c) if on else PAN, c if on else LIN, 1.0))
        if s_ and tw(s_, 9.5) + 4 < b - a:
            o.append(T((a + b) / 2, yf + 14, s_, "middle", 9.5, c if on else MUT, on))
    # 印のビット
    yi = yf + 38
    o.append(T(14, yi, "状態の印（記録の 8 バイト目）の変わり方:", "start", 10, INK, True))
    bits = [("1", ALI), ("0", MUT), ("0", MUT), ("0", MUT), ("0", PUR), ("0", PUR), ("0", PUR), ("0", PUR)]
    for j, (b, c) in enumerate(bits):
        o.append(RECT(250 + j * 18, yi - 13, 16, 18, 2, soft(c) if c != MUT else PAN, c, 1.0))
        o.append(T(259 + j * 18, yi, b, "middle", 10, c, True, True))
    o.append(ARR(402, yi - 4, 432, yi - 4, c=MUT, lw=1.3, head=6))
    for j, b in enumerate("00000000"):
        c = GRN if j == 0 else (MUT if j < 4 else PUR)
        o.append(RECT(440 + j * 18, yi - 13, 16, 18, 2, soft(c) if c != MUT else PAN, c, 1.0))
        o.append(T(449 + j * 18, yi, b, "middle", 10, c, True, True))
    o.append(T(250, yi + 18, "書いた直後（ビット 7 = 1: 書きかけ）", "start", 9.5, ALI))
    o.append(T(440, yi + 18, "印を書いた後（ビット 7 = 0）", "start", 9.5, GRN))
    o.append(T(14, yi + 36, "印のほかのビットは、警報などの印の例（ここでは印なし）。ビット 7 だけを 0 にするので、記録の値は変わらない", "start", 9.5, MUT))
    return SVG(700, yi + 44, o, "図 3-1 センサとの I2C の測定 1 回と、記録用フラッシュへ記録 1 件を書く SPI の命令の並び（番号は例の部品の命令。時間は例の値）。")
F["e04_bus"] = _f04_bus()


# =====================================================================
# 3 節: 記録の形式と記録用フラッシュの配置（図 3-2）
# =====================================================================
def _f04_fields(x, y, fields, unit, h=34, sz=9.5):
    """バイトの欄。fields = [(名前, バイト数, 色, 2 行目 or None), ...]。"""
    o = []
    for nm, nb, c, sub in fields:
        w = nb * unit
        o.append(RECT(x, y, w, h, 3, soft(c) if c not in (MUT, LIN) else PAN, c if c != LIN else MUT, 1.1))
        if sub:
            o.append(T(x + w / 2, y + h / 2 - 2, nm, "middle", sz, c, True))
            o.append(T(x + w / 2, y + h / 2 + 11, sub, "middle", sz - 0.5, MUT))
        else:
            o.append(T(x + w / 2, y + h / 2 + 3.5, nm, "middle", sz, c, True))
        x += w
    return "".join(o), x


def _f04_layout():
    o = []
    # (a) 配置
    o.append(T(14, 18, "(a) 記録用フラッシュの配置（DS-D02。4 Mbit = 4 KiB × 128 セクタ）", "start", 11.5, INK, True))
    x0, x1, ya = 60, 680, 40
    u = (x1 - x0) / 128.0
    o.append(RECT(x0, ya, 2 * u, 26, 0, PUR, PUR, 1.0))
    o.append(RECT(x0 + 2 * u, ya, 126 * u, 26, 0, soft(PUR), PUR, 1.0))
    for k in range(2, 128, 8):
        o.append(W(x0 + k * u, ya, x0 + k * u, ya + 26, c=PUR, lw=0.4))
    o.append(T(x0 + 2 * u + 63 * u, ya + 17, "記録の領域（セクタ 2〜127 の 126 セクタ）", "middle", 10, PUR, True))
    o.append(W(x0 + u, ya + 26, x0 + u, ya + 40, c=PUR, lw=1))
    o.append(T(x0 - 6, ya + 52, "設定の面 A・B（セクタ 0・1）", "start", 9.5, PUR, True))
    o.append(T(14, ya + 17, "番地", "start", 9.5, MUT))
    for k, lab in ((0, "0x00000"), (128, "0x7FFFF")):
        o.append(T(x0 + k * u, ya - 4, lab, "end" if k else "start", 9, MUT, False, True))
    # (b) セクタ 1 つ
    yb = 120
    o.append(W(14, yb - 12, 686, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 6, "(b) 記録のセクタ 1 つ（4 096 B）。初めの 16 B がセクタの頭、残りが記録 510 件", "start", 11.5, INK, True))
    sx0, sx1, ys = 60, 680, yb + 16
    o.append(RECT(sx0, ys, 40, 24, 0, soft(GLD), GLD, 1.1))
    o.append(T(sx0 + 20, ys + 16, "頭", "middle", 9.5, GLD, True))
    xx = sx0 + 40
    for k, lab in enumerate(["記録 0", "記録 1", "記録 2", "…", "記録 508", "記録 509"]):
        w = (sx1 - sx0 - 40) / 6.0
        o.append(RECT(xx, ys, w, 24, 0, soft(PUR) if lab != "…" else PAN, PUR, 1.0))
        o.append(T(xx + w / 2, ys + 16, lab, "middle", 9.5, PUR, lab != "…"))
        xx += w
    o.append(T(sx1, ys + 40, "510 件 × 8 B = 4 080 B", "end", 9.5, MUT))
    # 頭の拡大
    yh = ys + 50
    o.append(W(sx0, ys + 24, 46, yh, c=GLD, lw=0.8, dash="3 3"))
    o.append(W(sx0 + 40, ys + 24, 46 + 16 * 34, yh, c=GLD, lw=0.8, dash="3 3"))
    s, _ = _f04_fields(46, yh, [("印 4C 47", 2, GLD, "セクタの目印"), ("通し番号", 4, GLD, "開くたびに 1 増やす"), ("頭の CRC", 2, GLD, "16 ビット"),
                                ("記録の CRC-32", 4, GLD, "満ちたときに書く"), ("予備", 4, MUT, "FF のまま")], 34, 36)
    o.append(s)
    o.append(T(46 + 16 * 34 + 8, yh + 22, "16 B", "start", 9.5, GLD, True))
    # (c) 記録 1 件
    yc = yh + 64
    o.append(W(14, yc - 12, 686, yc - 12, c=LIN, lw=0.8))
    o.append(T(14, yc + 6, "(c) 記録 1 件（DS-D01。8 B・リトルエンディアン。形式は LG-ICD-001 の記録と同じ）", "start", 11.5, INK, True))
    s, xe = _f04_fields(46, yc + 16, [("時刻", 4, PUR, "2000-01-01 からの秒"), ("温度", 2, PUR, "0.01 °C 単位"), ("湿度", 1, PUR, "%RH"),
                                       ("状態の印", 1, PUR, "下のビット")], 44, 36)
    o.append(s)
    o.append(_f04_lines(46, yc + 70, ["測れなかった値: 温度 80 00（−32 768）・湿度 FF", "状態の印のビット 7: 0 = 書き終わり・1 = 書きかけ", "ほかのビット: 1 で印あり"], "start", 9.5, MUT, lh=15))
    # 状態の印のビット
    bx = 420
    bits = [("7", "書き終わり", GRN), ("6", "予備", MUT), ("5", "予備", MUT), ("4", "予備", MUT), ("3", "測定異常", PUR), ("2", "電池少", PUR),
            ("1", "時刻未設定", PUR), ("0", "警報", PUR)]
    o.append(W(46 + 7 * 44 + 22, yc + 52, bx + 4, yc + 62, c=PUR, lw=0.8, dash="3 3"))
    for j, (n, nm, c) in enumerate(bits):
        x = bx + j * 33
        o.append(RECT(x, yc + 56, 31, 18, 2, soft(c) if c != MUT else PAN, c, 1.0))
        o.append(T(x + 15.5, yc + 69, n, "middle", 9.5, c, True, True))
    for j, (n, nm, c) in enumerate(bits):
        if nm == "予備" and n != "5":
            continue
        x = bx + j * 33 + 15.5
        lab = "予備（0）" if nm == "予備" else nm
        o.append(T(x, yc + 88 + (0 if j % 2 == 0 else 13), lab, "middle", 9, c, nm != "予備"))
    # (d) 設定の面
    yd = yc + 134
    o.append(W(14, yd - 12, 686, yd - 12, c=LIN, lw=0.8))
    o.append(T(14, yd + 6, "(d) 設定の面（DS-D03。32 B。面 A と面 B に交互に書き、版の番号の大きいほうを使う）", "start", 11.5, INK, True))
    r1 = [("版の番号", 4, PUR, None), ("間隔", 1, PUR, None), ("動作", 1, PUR, None), ("上限", 2, PUR, None), ("下限", 2, PUR, None),
          ("モード", 1, PUR, None), ("警報", 1, PUR, None), ("前回の読み出しの位置", 4, PUR, None)]
    r2 = [("PIN の照合の値", 8, PUR, None), ("予備", 6, MUT, None), ("CRC-16", 2, GLD, None)]
    s, _ = _f04_fields(46, yd + 16, r1, 38.5, 26)
    o.append(s)
    s, _ = _f04_fields(46, yd + 50, r2, 38.5, 26)
    o.append(s)
    o.append(T(46, yd + 20 + 0, "", "start", 9, MUT))
    o.append(T(46 + 16 * 38.5 + 4, yd + 34, "0〜15", "start", 9, MUT, False, True))
    o.append(T(46 + 16 * 38.5 + 4, yd + 68, "16〜31", "start", 9, MUT, False, True))
    o.append(_f04_lines(46, yd + 94, ["間隔: 記録の間隔（分）　動作: 容量に達したときの動作　上限・下限: 警報の上限と下限（0.01 °C 単位）",
                                      "モード: 主のモード（電池を入れ直したときは使わない。6.2）　警報: 確認していない警報の有無"], "start", 9.5, MUT, lh=14))
    return SVG(700, yd + 120, o, "図 3-2 記録用フラッシュの配置と、セクタの頭・記録 1 件・設定の面の形式（どれも例の値。バイトの順は左から）。")
F["e04_layout"] = _f04_layout()


# =====================================================================
# 3 節: リングバッファと起動時の走査（図 3-3）
# =====================================================================
def _f04_strip(x, y, states, fills=None, cw=4.5, h=22):
    """126 のセクタの帯。states[k] は "full"・"cur"・"spare"・"erased"・"unused"。fills は書いているセクタの埋まり方（0〜1）。"""
    o = []
    for k, s in enumerate(states):
        xx = x + k * cw
        if s == "full":
            o.append(RECT(xx, y, cw, h, 0, soft(PUR), PUR, 0.5))
        elif s == "cur":
            o.append(RECT(xx, y, cw, h, 0, SCR, PUR, 0.8))
            f = (fills or {}).get(k, 0.5)
            if f > 0:
                o.append(RECT(xx, y + h * (1 - f), cw, h * f, 0, PUR, PUR, 0.5))
        elif s == "spare":
            o.append(RECT(xx, y, cw, h, 0, soft(GRN), GRN, 0.8))
        elif s == "erased":
            o.append(RECT(xx, y, cw, h, 0, soft(GLD), GLD, 0.8))
        else:
            o.append(RECT(xx, y, cw, h, 0, PAN, LIN, 0.4))
    return "".join(o)


def _f04_ring():
    o = []
    o.append(T(14, 18, "(a) 記録の 126 セクタの使われ方（上書きの設定。1 マスが 1 セクタ = 510 件）", "start", 11.5, INK, True))
    x0, cw = 120, 4.0
    rows = [
        ("① 初めて満ちる前", ["full"] * 50 + ["cur"] + ["spare"] + ["unused"] * 74, {50: 100 / 510}, "25 600 件", 50, None),
        ("② 回り込みの直前", ["full"] * 124 + ["cur"] + ["spare"], {124: 509 / 510}, "63 749 件", 124, 0),
        ("③ 回り込みの直後", ["erased"] + ["full"] * 124 + ["cur"], {125: 1 / 510}, "63 241 件", 125, 1),
    ]
    for r, (lab, st, fl, cnt, cur, old) in enumerate(rows):
        y = 40 + r * 62
        o.append(T(14, y + 15, lab, "start", 10, INK, True))
        o.append(_f04_strip(x0, y, st, fl, cw))
        o.append(T(x0 + 126 * cw + 8, y + 15, cnt, "start", 10, PUR, True))
        xc = x0 + cur * cw + cw / 2
        o.append(ARR(xc, y + 38, xc, y + 24, c=PUR, lw=1.2, head=5))
        o.append(T(xc, y + 50, "書いている", "middle" if 20 < cur < 110 else ("end" if cur >= 110 else "start"), 9.5, PUR, True))
        if r == 1:
            xo = x0 + old * cw + cw / 2
            o.append(ARR(xo, y + 38, xo, y + 24, c=MUT, lw=1.2, head=5))
            o.append(T(xo - 2, y + 50, "最も古い", "start", 9.5, MUT, True))
            xs = x0 + 125 * cw + cw / 2
            o.append(W(xs, y + 24, xs, y + 30, xs - 60, y + 30, c=GRN, lw=1))
            o.append(T(xs - 64, y + 34, "空きのセクタ", "end", 9.5, GRN, True))
        if r == 0:
            xs = x0 + 51 * cw + cw / 2
            o.append(W(xs, y + 24, xs + 40, y + 44, c=GRN, lw=1))
            o.append(T(xs + 44, y + 50, "空きのセクタ（消してある）", "start", 9.5, GRN, True))
        if r == 2:
            xo = x0 + cw / 2
            o.append(ARR(xo, y + 38, xo, y + 24, c=GLD, lw=1.2, head=5))
            o.append(T(xo - 2, y + 50, "最も古いセクタ（510 件）を消し、次の空きのセクタにした", "start", 9.5, GLD, True))
    yl = 40 + 3 * 62 + 2
    items = [(soft(PUR), PUR, "満ちたセクタ"), (SCR, PUR, "書いているセクタ"), (soft(GRN), GRN, "空きのセクタ"), (soft(GLD), GLD, "消したばかり"),
             (PAN, LIN, "まだ使っていない（消してある）")]
    xx = 14
    for f, c, t in items:
        o.append(RECT(xx, yl - 9, 12, 12, 1, f, c, 1.0))
        o.append(T(xx + 17, yl + 1, t, "start", 9.5, MUT))
        xx += 30 + tw(t, 9.5)
    o.append(T(14, yl + 20, "止める設定では、② の書いているセクタが満ちたところ（125 セクタ = 63 750 件）で止める", "start", 9.5, MUT))
    # (b) 起動時の走査
    yb = yl + 44
    o.append(W(14, yb - 12, 686, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 6, "(b) 起動時の走査（電池を入れたときと、ソフトウェアが止まって戻ったとき。8 MHz で約 11 ms）", "start", 11.5, INK, True))
    steps = [
        ("126 のセクタの頭を読む（2.5 ms）", ["頭の CRC が合うもののうち、通し番号の", "最も大きいセクタが「書いているセクタ」"]),
        ("書いているセクタを頭から読む（4.1 ms）", ["最後に書いた記録の次が書き込みの位置。", "書き終わりの印が 1 の記録は書きかけで使わない"]),
        ("空きのセクタを読む（4.1 ms）", ["全部が FF でなければ（消去の途中で電池が", "抜けた）、消し直してから使う"]),
        ("設定の 2 面を読む", ["CRC の合う面のうち、版の番号の", "大きいほうを使う"]),
    ]
    for k, (t, ls) in enumerate(steps):
        x = 14 + (k % 2) * 340
        y = yb + 18 + (k // 2) * 72
        o.append(RECT(x, y, 330, 64, 6, soft(PUR), PUR, 1.0))
        o.append(_f04_num(x + 16, y + 17, k + 1))
        o.append(T(x + 30, y + 21, t, "start", 10, PUR, True))
        o.append(_f04_lines(x + 30, y + 39, ls, "start", 9.5, INK, lh=13.5))
    # 書いているセクタの終わりの拡大（② の手順の例）
    yz = yb + 18 + 2 * 72 + 8
    o.append(T(14, yz + 16, "② の例:", "start", 10, INK, True))
    slots = [("記録", PUR, True), ("記録", PUR, True), ("記録", PUR, True), ("書きかけ", ALI, True), ("FF", MUT, False), ("FF", MUT, False), ("FF", MUT, False)]
    for j, (s, c, used) in enumerate(slots):
        x = 80 + j * 62
        o.append(RECT(x, yz + 2, 58, 22, 3, soft(c) if c != MUT else PAN, c, 1.0))
        o.append(T(x + 29, yz + 17, s, "middle", 9.5, c, True))
    o.append(ARR(80 + 4 * 62 + 29, yz + 42, 80 + 4 * 62 + 29, yz + 26, c=GRN, lw=1.4, head=6))
    o.append(T(80 + 4 * 62 + 40, yz + 46, "ここから書く（書きかけの場所は飛ばす）", "start", 9.5, GRN, True))
    return SVG(700, yz + 56, o, "図 3-3 記録のリングバッファの 3 つの時点と、起動時の走査の手順（件数と時間は例の値）。")
F["e04_ring"] = _f04_ring()


# =====================================================================
# 4 節: ソフトウェアの層（図 4-1）
# =====================================================================
def _f04_layers():
    o = []
    bands = [("アプリケーション", "タスク", 24, 64), ("サービス", "モジュール", 118, 64), ("基盤（DS-S07）", "", 212, 50), ("ハードウェア", "", 292, 36)]
    for nm, sub, y, h in bands:
        o.append(RECT(14, y, 672, h, 6, "none", LIN, 1.0))
        o.append(T(22, y + h / 2 + (-2 if sub else 4), nm, "start", 10, INK, True))
        if sub:
            o.append(T(22, y + h / 2 + 12, sub, "start", 9.5, MUT))
    cols = [140, 330, 520]
    tasks = [("測定タスク", "DS-S01", "測定・換算・警報・主のモード"), ("通信タスク", "DS-S03", "受付・GATT・読み出し・PIN"),
             ("操作タスク", "DS-S04", "ボタン・LED の表示")]
    mods = [("記録", "DS-S02", "rec_append・rec_read"), ("設定", "DS-S06", "set_read・set_write"),
            ("時刻と監視", "DS-S05", "time_now・bat_judge")]
    for x, (nm, did, sub) in zip(cols, tasks):
        o.append(RECT(x, 32, 156, 48, 6, soft(PUR), PUR, 1.3))
        o.append(T(x + 8, 50, nm, "start", 10.5, PUR, True))
        o.append(T(x + 148, 50, did, "end", 9.5, PUR, True, True))
        o.append(T(x + 8, 69, sub, "start", 9.5, INK))
    for x, (nm, did, sub) in zip(cols, mods):
        o.append(RECT(x, 126, 156, 48, 6, PSOFT, PUR, 1.1))
        o.append(T(x + 8, 144, nm, "start", 10.5, PUR, True))
        o.append(T(x + 148, 144, did, "end", 9.5, PUR, True, True))
        o.append(T(x + 8, 163, sub, "start", 9.5, INK, False, True))
    base = [(140, 90, "RTOS"), (238, 130, "BLE のスタック"), (376, 300, "ドライバ（I2C・SPI・ADC・GPIO・RTC・WDT）")]
    for x, w, nm in base:
        o.append(RECT(x, 220, w, 34, 5, soft(MUT), MUT, 1.0))
        o.append(T(x + w / 2, 241, nm, "middle", 9.5, INK, True))
    hw = ["H01 マイコン", "H02 センサ", "H03 フラッシュ", "H04 水晶", "H05 ボタン・LED", "H06 電圧"]
    for k, nm in enumerate(hw):
        x = 140 + k * 91
        o.append(RECT(x, 298, 87, 24, 4, soft(TEA), TEA, 1.0))
        o.append(T(x + 43.5, 314, nm, "middle", 9, TEA, True))
    # 呼ぶ（実線・同じ列の下の層へ）
    for x, lab in zip(cols, ["rec_append", "set_write", "time_now"]):
        o.append(ARR(x + 78, 80, x + 78, 126, c=INK, lw=1.3, head=6))
        o.append(T(x + 84, 106, lab, "start", 9, INK, False, True, halo=True))
    for x, lab in zip(cols, ["SPI", "SPI", "RTC・WDT・ADC"]):
        o.append(ARR(x + 78, 174, x + 78, 220, c=INK, lw=1.3, head=6))
        o.append(T(x + 84, 200, lab, "start", 9, INK, False, True, halo=True))
    # 知らせる（破線・箱の間の隙間を上へ）
    for xg, xt, lab in ((128, 140, "記録の時刻"), (313, 330, "BLE の出来事"), (503, 520, "ボタン")):
        o.append(W(xg, 220, xg, 56, c=GLD, lw=1.3, dash="5 3"))
        o.append(ARR(xg, 56, xt, 56, c=GLD, lw=1.3, head=6))
        o.append(T(xg - 3 if xg > 130 else xg + 3, 199, lab, "end" if xg > 130 else "start", 9, GLD, True, halo=True))
    # 凡例
    yl = 348
    o.append(ARR(16, yl - 4, 44, yl - 4, c=INK, lw=1.3, head=6))
    o.append(T(50, yl, "呼ぶ（上の層から下の層だけ）", "start", 9.5, MUT))
    o.append(ARR(206, yl - 4, 234, yl - 4, c=GLD, lw=1.3, head=6, dash="5 3"))
    o.append(T(240, yl, "知らせる（イベント。下から上）", "start", 9.5, MUT))
    o.append(W(416, yl - 4, 444, yl - 4, c=ALI, lw=1.3))
    o.append(W(424, yl - 10, 436, yl + 2, c=ALI, lw=1.8))
    o.append(W(424, yl + 2, 436, yl - 10, c=ALI, lw=1.8))
    o.append(T(450, yl, "下から上の関数を呼ぶ（しない）", "start", 9.5, ALI, True))
    return SVG(700, yl + 10, o, "図 4-1 ソフトウェアの層と、層の間の呼び方（矢印は主なものだけ。rec_read は通信タスクが、bat_judge は測定タスクが呼ぶ）。")
F["e04_layers"] = _f04_layers()


# =====================================================================
# 4 節: 測定 1 回のシーケンス図（図 4-2）
# =====================================================================
F["e04_seq_meas"] = SEQFIG(
    [("RTC", TEA), ("測定タスク", PUR), ("温湿度センサ", TEA), ("記録（DS-S02）", PUR), ("記録用フラッシュ", TEA)],
    [
        (0, 1, "記録の時刻（割り込み）"),
        (1, 2, "測定の命令（I2C）"),
        ("note", 2, "測る 5 ms", {"c": TEA}),
        (1, 1, "5 ms のタイマで起きる", {"c": PUR}),
        ("span", 1, 2, "眠って\n待つ", {"c": MUT, "side": -1}),
        (1, 2, "結果を読む（I2C）"),
        (2, 1, "6 B（温度・湿度・CRC）", {"dash": True, "c": TEA}),
        (1, 1, "CRC・換算・警報の判定", {"c": PUR}),
        (1, 3, "rec_append(1 件)"),
        (3, 4, "戻す・許可・記録 8 B"),
        ("note", 4, "書く 0.7 ms", {"c": TEA}),
        (3, 4, "状態・読み返す"),
        (4, 3, "8 B（比べる）", {"dash": True, "c": TEA}),
        (3, 4, "許可・印の 1 B"),
        ("note", 4, "書く 0.05 ms", {"c": TEA}),
        (3, 4, "状態・眠らせる"),
        (3, 1, "REC_OK", {"dash": True, "c": PUR}),
        ("note", 1, "1 時間に 1 回は\n電池の電圧も測る", {"c": GLD}),
        (1, 0, "次の記録の時刻を設定する"),
        ("note", 1, "眠る", {"c": PUR}),
    ],
    "図 4-2 測定 1 回のシーケンス図（時間は上から下へ。矢印の長さは時間に比例しない。破線は応答）。", w=700, dy=28, label_sz=10)


# =====================================================================
# 4 節: 読み出しのシーケンス図（図 4-3）
# =====================================================================
F["e04_seq_read"] = SEQFIG(
    [("アプリ", GLD), ("通信タスク", PUR), ("記録（DS-S02）", PUR), ("設定（DS-S06）", PUR)],
    [
        (0, 1, "接続（受付の窓の中）", {"c": GLD}),
        (1, 1, "アドバタイズと 2 分を止める", {"c": PUR}),
        (0, 1, "時刻を書く", {"c": GLD}),
        (1, 1, "時計を合わせる（時刻未設定を解く）", {"c": PUR}),
        (0, 1, "読み出しの指示（差分）", {"c": GLD}),
        (1, 3, "前回の読み出しの位置を読む"),
        (3, 1, "位置", {"dash": True, "c": PUR}),
        (1, 2, "rec_read(位置, 30 件)"),
        (2, 1, "記録 30 件", {"dash": True, "c": PUR}),
        (1, 0, "通知（番号・記録 30 件・CRC）", {"c": SIG}),
        ("gap", "通知を 1 752 回まで（52 560 件で約 21 秒）"),
        (1, 0, "終わりの通知（最後の番号）", {"c": SIG}),
        (0, 1, "受け取りの確認", {"c": GLD}),
        (1, 3, "前回の読み出しの位置を書く（設定の 2 面）"),
        ("note", 1, "途中で切れたら、ここへ来ないので\n前回の位置は変わらない", {"c": ALI}),
        (0, 1, "切断", {"c": GLD}),
        (1, 1, "通信なしへ", {"c": PUR}),
    ],
    "図 4-3 差分の読み出しのシーケンス図（記録の 30 件は 1 回の通知に入る件数。時間は例のスマートフォンの例の値）。", w=700, dy=28, label_sz=10)


# =====================================================================
# 5 節: 電力の予算の内訳と、設計と使い方の違いによる電池寿命（図 5-1）
# =====================================================================
def _f04_power():
    o = []
    o.append(T(14, 16, "(a) 平均電流の内訳（表 5-1。＊はこの設計で足した項目）", "start", 11.5, INK, True))
    xb0, xb1 = 176, 404
    X = lambda v: xb0 + (math.log10(max(v, 1e-4)) + 4) / 6 * (xb1 - xb0)
    y0, rh = 42, 17
    n = len(_F04_PB) + 1
    for v, s in ((1e-4, "0.0001"), (1e-2, "0.01"), (1.0, "1"), (100.0, "100")):
        o.append(W(X(v), y0 - 2, X(v), y0 + rh * n + 2, c=GRD, lw=1))
        o.append(T(X(v), y0 + rh * n + 16, s, "middle", 9.5, MUT))
    o.append(T((xb0 + xb1) / 2, y0 + rh * n + 32, "平均電流 [µA]（対数の目盛）", "middle", 10, MUT))
    items = [(p + " " + s + ("＊" if add else ""), v, add) for p, s, v, add in _F04_PB] + [("合計", _F04_TOT, False)]
    big = max(v for _, v, _ in items[:-1])
    o.append(W(X(_F04_LIM), y0 - 2, X(_F04_LIM), y0 + rh * n, c=SIG, lw=1.6))
    for k, (lab, v, add) in enumerate(items):
        y = y0 + k * rh
        last = k == len(items) - 1
        c = PUR if last else (GLD if add else TEA)
        o.append(T(xb0 - 6, y + 12.5, lab, "end", 9.5, INK, last or v >= 0.4))
        o.append(RECT(xb0, y + 3, X(v) - xb0, rh - 6, 2, soft(c), c, 1.0))
        txt = ("%.4f" % v) if v < 0.01 else (("%.3f" % v) if v < 1 else ("%.2f" % v))
        o.append(T(X(v) + 4, y + 12.5, txt + " µA", "start", 9.5, c, True, halo=True))
    o.append(T(X(_F04_LIM) - 2, y0 - 5, "上限 20.5 µA", "end", 9.5, SIG, True, halo=True))
    # (b) 電池寿命
    xl = 444
    o.append(T(xl, 16, "(b) 電池寿命（Q = 180 mAh）", "start", 11.5, INK, True))
    L0, L1 = xl + 4, 680
    XL = lambda v: L0 + v / 6.0 * (L1 - L0)
    yb = 48
    ya = yb + len(_F04_CASES) * 40 + 4
    # 要求と目標の線は、名前と値の文字より先に描き、文字の縁取りで線を隠す
    o.append(W(XL(1), yb - 10, XL(1), ya, c=SIG, lw=1.6))
    o.append(W(XL(2), yb - 10, XL(2), ya, c=PUR, lw=1.3, dash="5 3"))
    for k, (nm, sub, L, chg) in enumerate(_F04_CASES):
        y = yb + k * 40 + (8 if k >= 5 else 0)
        c = GRN if L >= 2 else (GLD if L >= 1 else ALI)
        o.append(T(L0, y, nm, "start", 9.5, INK, k == 0, halo=True))
        o.append(RECT(L0, y + 5, max(XL(L) - L0, 1.5), 14, 2, soft(c), c, 1.1))
        lab = ("%.1f 年" % L) if L >= 1 else ("%.2f 年" % L)
        if XL(L) - L0 > 60:
            o.append(T(XL(L) - 4, y + 16, lab, "end", 9.5, c, True))
            xe = XL(L)
        else:
            o.append(T(XL(L) + 4, y + 16, lab, "start", 9.5, c, True, halo=True))
            xe = XL(L) + 4 + tw(lab, 9.5)
        if sub:
            o.append(T(max(xe + 14, XL(2) + 8), y + 16, sub, "start", 9, ALI, True, halo=True))
    for v in range(0, 7):
        o.append(W(XL(v), ya, XL(v), ya + 4, c=MUT, lw=1))
        o.append(T(XL(v), ya + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(W(L0, ya, L1, ya, c=MUT, lw=1))
    o.append(T((L0 + L1) / 2, ya + 31, "電池寿命 [年]", "middle", 10, MUT))
    o.append(LEGL(L0, ya + 50, [(SIG, None, "要求 1 年"), (PUR, "5 3", "目標 2 年（余裕 2 倍）")], 9.5, 12))
    H = max(y0 + rh * n + 42, ya + 60)
    return SVG(700, H, o, "図 5-1 ロガーの電力の予算（SR-W02 の使い方の条件、25 °C、例の値）。(b) は本文の設計から 1 か所だけを変えた電池寿命で、代案 B・C は 5.2 の設計判断の代案。")
F["e04_power"] = _f04_power()


# =====================================================================
# 5 節: 電池少と電池切れの判定（図 5-2）。電池の模型は、電源と周辺の制御シリーズ 3 章の CR2032 の例の値
# =====================================================================
_F04_CRE = [(0, 3.20), (0.02, 3.05), (0.1, 3.00), (0.3, 2.96), (0.5, 2.92), (0.7, 2.87), (0.8, 2.82), (0.88, 2.74), (0.93, 2.60), (0.97, 2.40), (1.0, 2.00)]
_F04_CRR = [(0, 15.0), (0.5, 17.0), (0.7, 20.0), (0.8, 25.0), (0.9, 40.0), (0.95, 60.0), (1.0, 120.0)]


def _f04_ip(pts, x):
    if x <= pts[0][0]:
        return pts[0][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return pts[-1][1]


def _f04_v(x, T=25.0, I=0.0, tp=0.001):
    """取り出した割合 x の CR2032 に、電流 I [A] を tp [s] 流したときの端子電圧 [V]。"""
    r = _f04_ip(_F04_CRR, x) * 1.4 ** ((25.0 - T) / 10.0) * (0.55 + 0.45 * (1 - math.exp(-tp / 0.005)))
    return _f04_ip(_F04_CRE, x) - I * r


def _f04_cross(f):
    lo, hi = 0.0, 1.0
    for _ in range(80):
        m = (lo + hi) / 2
        if f(m) > 0:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def _f04_lowbat():
    o = []
    o.append(T(14, 16, "(a) 電池の終わりの近くの電圧（25 °C）", "start", 11.5, INK, True))
    p = Plot(64, 34, 330, 222, (160.0, 216.0), (1.8, 3.0))
    o.append(p.axes(xl="電池から取り出した電荷 [mAh]", yl=None, xt=[160, 170, 180, 190, 200, 210], yt=[1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0],
                    yfmt=lambda v: "%.1f" % v))
    o.append(T(p.x - 40, p.y + p.h / 2, "電池の電圧 [V]", "middle", 10, MUT, rot=-90))
    qs = [160 + 0.25 * k for k in range(0, 225)]
    cur = {"rest": [], "test": [], "er": []}
    for q in qs:
        x = q / 220.0
        cur["rest"].append((q, _f04_v(x)))
        cur["test"].append((q, _f04_v(x, 25, 0.008, 0.001)))
        cur["er"].append((q, _f04_v(x, 25, 0.010, 0.045)))
    o.append(p.clip(cur["rest"], c=MUT, lw=1.6))
    o.append(p.clip(cur["er"], c=TEA, lw=1.6))
    o.append(p.clip(cur["test"], c=PUR, lw=2.2))
    for v, c, lab, dy in ((2.57, PUR, "電池少", -2), (2.50, PUR, "電池切れ", 9), (2.0, ALI, "下限 2.0 V", 3)):
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=c, lw=1.0, dash="4 3"))
        o.append(T(p.x + p.w + 4, p.Y(v) + dy, lab, "start", 9, c, True))
    xl = _f04_cross(lambda x: _f04_v(x, 25, 0.008, 0.001) - 2.57)
    xe = _f04_cross(lambda x: _f04_v(x, 25, 0.008, 0.001) - 2.50)
    xf = _f04_cross(lambda x: _f04_v(x, 25, 0.010, 0.045) - 2.0)
    xr = _f04_cross(lambda x: _f04_v(x) - 2.40)
    o.append(D(p.X(xl * 220), p.Y(2.57), PUR, 4))
    o.append(D(p.X(xe * 220), p.Y(2.50), PUR, 4))
    # 41 日の括弧
    yb = p.Y(2.92)
    o.append(W(p.X(xl * 220), p.Y(2.57) - 6, p.X(xl * 220), yb, c=GRN, lw=1, dash="2 2"))
    o.append(W(p.X(xe * 220), p.Y(2.50) - 6, p.X(xe * 220), yb, c=GRN, lw=1, dash="2 2"))
    o.append(DARR(p.X(xl * 220), yb, p.X(xe * 220), yb, c=GRN, lw=1.2, head=5))
    o.append(T(p.X(xl * 220) - 4, yb - 6, "電池少から電池切れまで 5.4 mAh = 41 日", "end", 9.5, GRN, True, halo=True))
    # 点の番号（説明は図の下）
    def _mark(q, v, k, c, dx, dy):
        x, y = p.X(q), p.Y(v)
        o.append(CIRC(x + dx, y + dy, 7, c=c, lw=1.2, fill=SCR))
        o.append(T(x + dx, y + dy + 3.4, str(k), "middle", 9, c, True))
    _mark(xl * 220, 2.57, 1, PUR, -12, -10)
    _mark(xe * 220, 2.50, 2, PUR, -10, 14)
    o.append(W(p.X(xf * 220) - 4, p.Y(2.0) - 4, p.X(xf * 220) + 4, p.Y(2.0) + 4, c=ALI, lw=2))
    o.append(W(p.X(xf * 220) - 4, p.Y(2.0) + 4, p.X(xf * 220) + 4, p.Y(2.0) - 4, c=ALI, lw=2))
    _mark(xf * 220, 2.0, 3, ALI, -14, 12)
    o.append(CIRC(p.X(xr * 220), p.Y(2.40), 4, c=ALI, lw=1.6, fill=SCR))
    _mark(xr * 220, 2.40, 4, ALI, -12, -12)
    o.append(LEGL(14, p.y + p.h + 52, [(PUR, None, "試しの負荷 8 mA・1 ms をかけた電圧（測る値）")], 9.5, 14))
    o.append(LEGL(14, p.y + p.h + 70, [(TEA, None, "セクタの消去 10 mA・45 ms の底"), (MUT, None, "休んでいるときの電圧")], 9.5, 14))
    notes = ["1 電池少（2.57 V を下回る）  2 電池切れ（2.50 V を下回る）", "3 消去の底が 2.0 V を割る（リセットが起きる）",
             "4 休んでいるときの電圧で決めた電池切れ（2.40 V。3 より遅い）"]
    o.append(_f04_lines(14, p.y + p.h + 90, notes, "start", 9.5, MUT, lh=14))
    # (b) 温度ごとの、電池切れの判定までに使える電荷
    xb = 448
    o.append(T(xb, 16, "(b) 電池切れの判定までに使える電荷", "start", 11.5, INK, True))
    q0, q1 = xb + 8, 676
    XQ = lambda v: q0 + v / 220.0 * (q1 - q0)
    rows = []
    for T_ in (25.0, 0.0, -20.0):
        xe_ = _f04_cross(lambda x: _f04_v(x, T_, 0.008, 0.001) - 2.50)
        rows.append((T_, xe_ * 220, _f04_v(xe_, T_, 0.010, 0.045)))
    for k, (T_, q, vb) in enumerate(rows):
        y = 40 + k * 56
        lab = ("%d °C" % T_).replace("-", "−")
        o.append(T(q0, y + 10, lab, "start", 10, INK, True))
        c = GRN if q >= _F04_Q else GLD
        o.append(RECT(q0, y + 16, XQ(q) - q0, 16, 2, soft(c), c, 1.1))
        o.append(T(XQ(q) - 4, y + 28, "%.0f mAh" % q, "end", 9.5, c, True))
        o.append(T(q0, y + 46, "そのときの消去の底 %.2f V（下限 2.0 V）" % vb, "start", 9, MUT))
    o.append(W(XQ(_F04_Q), 30, XQ(_F04_Q), 40 + 3 * 56 - 4, c=PUR, lw=1.4, dash="5 3"))
    o.append(T(XQ(_F04_Q) - 3, 216, "設計で使う容量 Q", "end", 9.5, PUR, True, halo=True))
    o.append(T(XQ(_F04_Q) - 3, 229, "180 mAh", "end", 9.5, PUR, True, halo=True))
    for v in (0, 50, 100, 150, 200):
        o.append(W(XQ(v), 240, XQ(v), 244, c=MUT, lw=1))
        o.append(T(XQ(v), 256, "%d" % v, "middle", 9.5, MUT))
    o.append(W(q0, 240, q1, 240, c=MUT, lw=1))
    o.append(T((q0 + q1) / 2, 272, "電荷 [mAh]", "middle", 10, MUT))
    o.append(_f04_lines(xb, 296, ["寒いほど内部抵抗が大きく、測る値が早く下がる。", "電池切れは早く来るが、消去の底は 2.0 V を割らない"], "start", 9.5, MUT, lh=14))
    return SVG(700, max(p.y + p.h + 124, 316), o, "図 5-2 試しの負荷をかけた電圧で決める電池少と電池切れ（電池は電源と周辺の制御シリーズ 3 章の CR2032 の例の模型、220 mAh で放電した割合を電荷に直した。日数は電池少の間の平均電流 5.51 µA で数えた）。")
F["e04_lowbat"] = _f04_lowbat()


# =====================================================================
# 5 節: 余裕の一覧（見積もりと実測）（図 5-3）
# =====================================================================
_F04_BUD = [  # (項目, 要求の限り, 見積もり, 割合, 目標の割合 or None, 試験)
    ("平均電流（DS-B01）", "20.5 µA 以下（SR-W02）", "4.17 µA", 4.1714 / 20.548, 0.5, "ST-036"),
    ("電池少から電池切れまで", "14 日以上（SR-F13）", "41 日（誤差込み 27 日）", 14 / 26.7, None, "ST-013"),
    ("記録の容量（DS-D02）", "52 560 件以上（SR-F04）", "63 240 件以上", 52560 / 63240, None, "ST-004"),
    ("記録の保持", "10 年以上（SR-R01）", "20 年（部品の資料）", 10 / 20, None, "ST-043"),
    ("書き換え（設定の面）", "10 万回以下（SR-R04）", "9 125 回（5 年）", 9125 / 1e5, None, "ST-046"),
    ("読み出しの時間", "60 s 以下（SR-P05）", "23.4 s", 23.37 / 60, None, "ST-033"),
    ("時計のずれ（30 日）", "±60 s 以下（SR-P04）", "±51.8 s", 51.84 / 60, None, "ST-032"),
    ("止まってから戻るまで", "10 s 以下（SR-R03）", "8.2 s", 8.2 / 10, None, "ST-045"),
    ("部品の費用（DS-B04）", "1 500 円以下（SR-C02）", "1 170 円", 1170 / 1500, None, "ST-051"),
    ("プログラムの記憶（DS-B02）", "512 KB", "232 KB", 232 / 512, 0.5, "検査"),
    ("RAM（DS-B02）", "64 KB", "44 KB", 44 / 64, 0.7, "試験"),
    ("利用率（DS-B03）", "100 %", "55 %", 0.5534, 0.7, "試験"),
]


def _f04_budget():
    o = []
    cw = [150, 146, 134, 150, 50, 42]
    hd = ["項目", "要求の限り", "見積もり", "上限に対する割合", "確かめ方", "実測"]
    x = 14
    for w, h in zip(cw, hd):
        o.append(_f04_cell(x, 6, w, 24, h, INK, SCR, LIN, 9.5, True))
        x += w
    rh = 24
    for k, (nm, lim, est, r, tg, st) in enumerate(_F04_BUD):
        y = 30 + k * rh
        x = 14
        o.append(_f04_cell(x, y, cw[0], rh, nm, INK, "none", LIN, 9.5, False, "start"))
        x += cw[0]
        o.append(_f04_cell(x, y, cw[1], rh, lim, SIG, "none", LIN, 9.5, False, "start"))
        x += cw[1]
        o.append(_f04_cell(x, y, cw[2], rh, est, PUR, "none", LIN, 9.5, True, "start"))
        x += cw[2]
        o.append(_f04_cell(x, y, cw[3], rh, "", INK, "none", LIN))
        bw = cw[3] - 44
        c = GRN if r <= (tg if tg else 0.7) else (GLD if r <= 1.0 else ALI)
        o.append(RECT(x + 4, y + 6, bw * min(r, 1.0), 12, 2, soft(c), c, 1.0))
        o.append(T(x + cw[3] - 4, y + 16, "%d %%" % round(r * 100), "end", 9.5, c, True))
        if tg:
            o.append(W(x + 4 + bw * tg, y + 3, x + 4 + bw * tg, y + rh - 3, c=PUR, lw=1.4, dash="3 2"))
        x += cw[3]
        o.append(_f04_cell(x, y, cw[4], rh, st, GRN if st.startswith("ST") else MUT, "none", LIN, 9, False, "middle", mono=st.startswith("ST")))
        x += cw[4]
        o.append(_f04_cell(x, y, cw[5], rh, "（後）", FNT, "none", LIN, 9))
    yb = 30 + len(_F04_BUD) * rh + 16
    o.append(T(14, yb, "割合は、上限のある項目は 見積もり ÷ 上限、下限のある項目は 下限 ÷ 見積もり（どちらも 100 % 以下なら満たす）", "start", 9.5, MUT))
    o.append(T(14, yb + 15, "緑: 70 % 以下（目標のある行は目標以下）　金: 100 % 以下　紫の破線: 目標", "start", 9.5, MUT))
    return SVG(700, yb + 24, o, "図 5-3 資源と要求の数値の余裕の一覧（例の値。実測の欄は試作と試験の後に書く。メモリと利用率は 02 章 5 節の見積もり）。")
F["e04_budget"] = _f04_budget()


# =====================================================================
# 6 節: 起動の手順（図 6-1）
# =====================================================================
def _f04_boot():
    o = []
    cx = 350
    o.append(RECT(cx - 70, 8, 140, 28, 14, soft(MUT), MUT, 1.2))
    o.append(T(cx, 27, "リセット", "middle", 10.5, INK, True))
    o.append(ARR(cx, 36, cx, 52, c=MUT, lw=1.3, head=6))
    o.append(RECT(cx - 150, 52, 300, 30, 6, soft(PUR), PUR, 1.2))
    o.append(T(cx, 72, "リセットの理由を読み、残しておく", "middle", 10, PUR, True))
    o.append(ARR(cx, 82, cx, 98, c=MUT, lw=1.3, head=6))
    o.append(RECT(cx - 200, 98, 400, 44, 6, soft(PUR), PUR, 1.2))
    o.append(T(cx, 116, "起動時の走査（3.5。約 11 ms）", "middle", 10, PUR, True))
    o.append(T(cx, 132, "書き込みの位置・最も古い記録・書きかけの記録・設定", "middle", 9.5, INK))
    # 分かれる
    o.append(W(cx, 142, cx, 154, c=MUT, lw=1.3))
    o.append(W(170, 154, 530, 154, c=MUT, lw=1.3))
    o.append(ARR(170, 154, 170, 168, c=MUT, lw=1.3, head=6))
    o.append(ARR(530, 154, 530, 168, c=MUT, lw=1.3, head=6))
    brs = [(30, "電源の投入（電池を入れた）", SIG, ["主のモードを停止中にする（表 3-3）", "時計を 2000-01-01 00:00:00 から数え始める", "（時刻未設定。SR-F09）", "設定と確認していない警報は設定の面から戻す"]),
           (390, "ウォッチドッグ（ソフトウェアが止まった）", ALI, ["主のモードを設定の面の値に戻す（SR-R03）", "時計は RTC の値のまま使う", "記録中なら次の記録の時刻を設定する", "電池少は 1 時間ごとの測定で決め直す"])]
    for x, t, c, ls in brs:
        o.append(RECT(x, 168, 280, 100, 6, soft(c), c, 1.2))
        o.append(T(x + 140, 186, t, "middle", 10, c, True))
        o.append(_f04_lines(x + 12, 206, ls, "start", 9.5, INK, lh=15))
    o.append(W(170, 268, 170, 282, 530, 282, 530, 268, c=MUT, lw=1.3))
    o.append(ARR(cx, 282, cx, 296, c=MUT, lw=1.3, head=6))
    o.append(RECT(cx - 150, 296, 300, 30, 6, soft(PUR), PUR, 1.2))
    o.append(T(cx, 316, "タスクを始め、イベントを待って眠る", "middle", 10, PUR, True))
    # 時間
    yt = 352
    o.append(W(14, yt - 10, 686, yt - 10, c=LIN, lw=0.8))
    o.append(T(14, yt + 6, "ソフトウェアが止まってから戻るまで（最悪の場合）", "start", 10.5, INK, True))
    x0, x1 = 60, 660
    X = lambda t: x0 + t / 11.0 * (x1 - x0)
    yb = yt + 22
    o.append(RECT(X(0), yb, X(8) - X(0), 20, 2, soft(ALI), ALI, 1.0))
    o.append(T((X(0) + X(8)) / 2, yb + 14, "ウォッチドッグが数える 8 s（合図が途絶える）", "middle", 9.5, ALI, True))
    o.append(RECT(X(8), yb, X(8.2) - X(8), 20, 2, soft(PUR), PUR, 1.0))
    o.append(T(X(8.2) + 4, yb + 14, "起動 0.2 s", "start", 9.5, PUR, True))
    o.append(W(X(10), yb - 6, X(10), yb + 28, c=SIG, lw=1.8))
    o.append(T(X(10) + 4, yb - 2, "SR-R03 の 10 s", "start", 9.5, SIG, True, halo=True))
    ya = yb + 32
    o.append(W(X(0), ya, X(11), ya, c=MUT, lw=1))
    for t in range(0, 12, 2):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 15, "%d" % t, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, ya + 30, "止まってからの時間 [s]", "middle", 10, MUT))
    return SVG(700, ya + 38, o, "図 6-1 リセットの理由で分けた起動の手順と、止まってから戻るまでの時間（ウォッチドッグの時間と起動の時間は例の値）。")
F["e04_boot"] = _f04_boot()


# =====================================================================
# 6 節: トレーサビリティマトリクス（図 6-2）
# =====================================================================
def _f04_trace():
    o = []
    cw, rh = 11.6, 13.2
    halves = [_F04_REQ[:25], _F04_REQ[25:]]
    groups = [("H", 8, TEA, "ハードウェア"), ("S", 7, PUR, "ソフトウェア"), ("D", 3, PUR, "形式"), ("B", 4, GLD, "予算")]
    y0 = 64
    for hi, rows in enumerate(halves):
        x0 = 14 + hi * 346
        xm = x0 + 46
        # 群の見出し
        xx = xm
        for g, n, c, nm in groups:
            o.append(RECT(xx, 8, n * cw, 14, 2, soft(c), c, 0.8))
            o.append(T(xx + n * cw / 2, 19, g, "middle", 9, c, True))
            xx += n * cw
        # 列の番号
        for j, d in enumerate(_F04_DS):
            c = TEA if d[0] == "H" else (GLD if d[0] == "B" else PUR)
            o.append(T(xm + j * cw + cw / 2 + 3, y0 - 6, d[1:], "start", 8.5, c, False, True, rot=-90))
        o.append(T(xm + 22 * cw + 6, y0 - 6, "試験", "start", 9, GRN, True))
        for r, (rid, nm, ds) in enumerate(rows):
            y = y0 + r * rh
            if r % 2 == 0:
                o.append(RECT(x0, y, 46 + 22 * cw + 44, rh, 0, soft(SIG), "none", 0, op=0.45))
            o.append(T(x0 + 2, y + rh - 3.5, "SR-" + rid, "start", 8.5, SIG, True, True))
            got = ds.split()
            for j, d in enumerate(_F04_DS):
                if d in got:
                    c = TEA if d[0] == "H" else (GLD if d[0] == "B" else PUR)
                    o.append(D(xm + j * cw + cw / 2, y + rh / 2, c, 3.2))
            st = 1 + _F04_REQ.index((rid, nm, ds))
            o.append(T(xm + 22 * cw + 6, y + rh - 3.5, "ST-%03d" % st, "start", 8.5, GRN, True, True))
        for j in range(23):
            o.append(W(xm + j * cw, y0, xm + j * cw, y0 + len(rows) * rh, c=LIN, lw=0.4))
        o.append(RECT(x0, y0, 46 + 22 * cw + 44, len(rows) * rh, 0, "none", LIN, 0.8))
    # 列ごとの数（全部の要求で）
    yc = y0 + 26 * rh + 18
    cnt = [sum(1 for _, _, ds in _F04_REQ if d in ds.split()) for d in _F04_DS]
    o.append(T(14, yc, "列ごとの要求の数（51 件の合計）:", "start", 9.5, INK, True))
    o.append(T(14, yc + 16, "  ".join("%s %d" % (d, c) for d, c in zip(_F04_DS[:11], cnt[:11])), "start", 9, MUT, False, True))
    o.append(T(14, yc + 30, "  ".join("%s %d" % (d, c) for d, c in zip(_F04_DS[11:], cnt[11:])), "start", 9, MUT, False, True))
    o.append(T(14, yc + 48, "空の行も空の列も無い: どの要求にも設計の要素と試験があり、どの要素にも要求がある", "start", 9.5, GRN, True))
    return SVG(700, yc + 56, o, "図 6-2 要求・設計の要素・システム試験のトレーサビリティマトリクス（列の番号は DS- の後ろ。試験の番号は仕様書の表 6-1）。")
F["e04_trace"] = _f04_trace()
