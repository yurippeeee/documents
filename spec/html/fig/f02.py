# -*- coding: utf-8 -*-
# 02 章 設計書の書き方 の図（数値は、ガイドの設計の例の値と、この章で置いた例の値。本文の表と同じ値を使う）
import math as _f02_m

# =====================================================================
# 補助
# =====================================================================
def _f02_cell(x, y, w, h, lines, tc=INK, fill="none", c=LIN, sz=9.5, b=False, a="middle", lw=1.0, lh=None, pad=6, mono=False):
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


def _f02_lines(x, y, lines, a="start", sz=9.5, c=MUT, b=False, lh=None, mono=False):
    lh = lh or sz * 1.36
    return "".join(T(x, y + i * lh, l, a, sz, c, b, mono) for i, l in enumerate(lines) if l)


def _f02_page(x, y, w, h, c=PUR, fold=14, fill=PAN):
    """文書の 1 ページ（右上の角を折った形）。"""
    pts = [(x, y), (x + w - fold, y), (x + w, y + fold), (x + w, y + h), (x, y + h), (x, y)]
    return (PL(pts, c=c, lw=1.3, fill=fill)
            + PL([(x + w - fold, y), (x + w - fold, y + fold), (x + w, y + fold)], c=c, lw=1.0))


def _f02_chip(x, y, s, c=SIG, sz=9.5, a="start", mono=False):
    return CHIP(x, y, s, c, sz, 4, a, mono)[0]


def _f02_num(x, y, k, c=ALI, r=7.5):
    """丸で囲んだ番号（悪い例の指摘に使う）。"""
    return CIRC(x, y, r, c=c, lw=1.4, fill=SCR) + T(x, y + 3.4, str(k), "middle", 9.5, c, True)


def _f02_check(x, y, ok, r=6):
    """○（満たす）か ×（満たさない）の印。"""
    if ok:
        return CIRC(x, y, r, c=GRN, lw=2.0)
    return W(x - r, y - r, x + r, y + r, c=ALI, lw=2.2) + W(x - r, y + r, x + r, y - r, c=ALI, lw=2.2)


# =====================================================================
# 1 節: 仕様 → 方式設計 → 詳細設計 → コード（SR-F04 が段ごとに細かくなる）
# =====================================================================
def _f02_levels():
    o = []
    xs = [14, 160, 330, 600]
    for x, h in zip(xs, ["段（書く文書）", "決めること", "SR-F04 の例", "確かめる試験"]):
        o.append(T(x, 17, h, "start", 10, MUT, True))
    rows = [
        ("仕様", "システム仕様書", SIG, ["外から見て、", "満たすべきこと"],
         ["52 560 件（記録の間隔 10 分で 365 日分）", "以上の記録を保存できること"], ["システム試験", "（ST-）"]),
        ("方式設計", "方式設計書", PUR, ["部分に分け、", "要求を割り当てる"],
         ["記録用フラッシュ DS-H03 と、記録の", "ソフトウェア DS-S02 が受け持つ。記録の", "記憶は 410.6 KiB 以上が要る → 4 Mbit"], ["結合試験"]),
        ("詳細設計", "詳細設計書", PUR, ["部分の中を、作る人が", "迷わずに作れるまで"],
         ["記録のモジュール: セクタを順に使い、", "満ちたら最も古い記録から上書きする。", "関数と、呼んでよい条件（6 節）"], ["単体試験"]),
        ("コード", "ソースコード", MUT, ["詳細設計のとおりに", "手順を書く"],
         ["rec_append() の本体。手順はコードが", "示すので、設計書には写さない（6 節）"], ["コードの", "レビュー"]),
    ]
    y0, rh, gap = 28, 64, 14
    for k, (nm, doc, c, dec, ex, tst) in enumerate(rows):
        y = y0 + k * (rh + gap)
        o.append(RECT(14, y, 136, rh, 7, soft(c), c, 1.4))
        o.append(T(82, y + rh / 2 - 4, nm, "middle", 12, c, True))
        o.append(T(82, y + rh / 2 + 13, doc, "middle", 9.5, MUT))
        o.append(_f02_lines(160, y + rh / 2 - 5, dec, "start", 10, INK, lh=15))
        o.append(RECT(330, y, 258, rh, 6, SCR, c, 1.0))
        if k == 0:
            o.append(_f02_chip(338, y + 18, "SR-F04", SIG, 9.5, mono=True))
            o.append(_f02_lines(338, y + 35, ex, "start", 10, INK, lh=14))
        else:
            o.append(_f02_lines(338, y + rh / 2 - (len(ex) - 1) * 7 + 3.5, ex, "start", 10, INK, lh=14))
        o.append(_f02_lines(644, y + rh / 2 + 4 - (len(tst) - 1) * 6.5, tst, "middle", 9.5, GRN, True, lh=13))
        if k < 3:
            o.append(ARR(82, y + rh + 1, 82, y + rh + gap - 1, c=MUT, lw=1.4, head=6))
            o.append(ARR(459, y + rh + 1, 459, y + rh + gap - 1, c=MUT, lw=1.4, head=6))
    yb = y0 + 4 * (rh + gap) - gap
    o.append(T(14, yb + 18, "下の段ほど細かく決める。どの段も、上の段の決めたことを入力にする", "start", 9.5, MUT))
    return SVG(700, yb + 26, o, "1 つの要求が段ごとに細かくなる様子（記録の件数の要求 SR-F04 の例。右の列は、各段の決めたことを確かめる試験）。")
F["e02_levels"] = _f02_levels()


# =====================================================================
# 1 節: 割り当ての表と、派生要求
# =====================================================================
_F02_DS = [("H01", "マイコン", ""), ("H02", "センサ", ""), ("H03", "フラッシュ", ""), ("H04", "水晶", ""), ("H05", "ボタン", "と LED"), ("H06", "電池ホルダ", "電圧測定"),
           ("S01", "測定", ""), ("S02", "記録", ""), ("S03", "通信", ""), ("S04", "操作と", "表示"), ("S05", "時刻と", "監視")]
_F02_ALLOC = [  # (ID, 要点, 受け持つ列（番号）、予算で配るか)
    ("SR-F01", "温度と湿度を測る", [1, 6], False),
    ("SR-F04", "52 560 件を保存する", [2, 7], False),
    ("SR-F06", "長押しで開始・停止", [4, 9, 6], False),
    ("SR-F13", "電池少を知らせる", [5, 10, 9, 8], False),
    ("SR-I01", "BLE で通信する", [0, 8], False),
    ("SR-P04", "30 日で ±60 秒以内", [3, 10], False),
    ("SR-R03", "止まっても 10 秒で復帰", [0, 10], False),
    ("SR-W02", "電池で 1 年以上", list(range(11)), True),
]


def _f02_alloc():
    o = []
    o.append(T(14, 16, "(a) 割り当ての表", "start", 11.5, INK, True))
    x0, cw = 166, 47
    o.append(RECT(x0, 24, cw * 6, 16, 3, soft(TEA), TEA, 1.0))
    o.append(T(x0 + cw * 3, 36, "ハードウェア（DS-H）", "middle", 9.5, TEA, True))
    o.append(RECT(x0 + cw * 6 + 2, 24, cw * 5 - 2, 16, 3, soft(PUR), PUR, 1.0))
    o.append(T(x0 + cw * 6 + cw * 2.5 + 1, 36, "ソフトウェア（DS-S）", "middle", 9.5, PUR, True))
    for j, (i_, n1, n2) in enumerate(_F02_DS):
        cx = x0 + cw * (j + 0.5)
        c = TEA if j < 6 else PUR
        o.append(T(cx, 53, i_, "middle", 9.5, c, True, True))
        o.append(T(cx, 66, n1, "middle", 9.5, INK))
        if n2:
            o.append(T(cx, 78, n2, "middle", 9.5, INK))
    yt, rh = 84, 22
    o.append(T(14, 78, "要求（SR）", "start", 9.5, SIG, True))
    for r, (sid, txt, cols, bud) in enumerate(_F02_ALLOC):
        y = yt + r * rh
        o.append(RECT(14, y, x0 - 14 + cw * 11, rh, 0, soft(SIG) if r % 2 == 0 else "none", LIN, 0.6))
        o.append(T(18, y + 15, sid, "start", 9.5, SIG, True, True))
        o.append(T(64, y + 15, txt, "start", 9.5, INK))
        for j in range(11):
            cx, cy = x0 + cw * (j + 0.5), y + rh / 2
            if j in cols:
                col = TEA if j < 6 else PUR
                if bud:
                    o.append(CIRC(cx, cy, 5, c=col, lw=1.6))
                else:
                    o.append(D(cx, cy, col, 5.2))
    for j in range(12):
        o.append(W(x0 + cw * j, yt, x0 + cw * j, yt + rh * len(_F02_ALLOC), c=LIN, lw=0.6))
    yl = yt + rh * len(_F02_ALLOC) + 18
    o.append(D(20, yl - 4, INK, 5.2))
    o.append(T(30, yl, "受け持つ", "start", 9.5, MUT))
    o.append(CIRC(92, yl - 4, 5, c=INK, lw=1.6))
    o.append(T(102, yl, "電力の予算（5 節）で部分ごとの上限に分けてから受け持つ", "start", 9.5, MUT))
    # (b) 派生要求
    yb = yl + 30
    o.append(T(14, yb, "(b) 割り当てから生まれる派生要求（例の値）", "start", 11.5, INK, True))
    chains = [
        ("SR-F04", ["52 560 件以上を保存する"], ["52 560 件 × 8 B = 420 480 B", "= 410.6 KiB"],
         "DS-H03 の派生要求", ["記録の記憶 410.6 KiB 以上"], ["4 Mbit（512 KiB）を選ぶ", "余りは 101.4 KiB"]),
        ("SR-P04", ["30 日で ±60 秒以内（25 °C）"], ["60 s ÷ (30 × 86 400 s)", "= 23.1 × 10⁻⁶"],
         "DS-H04 の派生要求", ["25 °C で ±23.1 ppm 以内"], ["±20 ppm の水晶を選ぶ", "30 日で最大 51.8 秒"]),
        ("SR-P05", ["52 560 件を 60 秒以内に読む"], ["420 480 B ÷ 60 s", "= 7 008 B/s"],
         "DS-S03 の派生要求", ["読み出し 7.0 KB/s 以上"], ["20 KB/s（例のスマートフォン）", "なら 21 秒で読める"]),
    ]
    for k, (sid, req, calc, dlab, der, pick) in enumerate(chains):
        x = 14 + k * 231
        w = 210
        y = yb + 12
        o.append(RECT(x, y, w, 36, 6, soft(SIG), SIG, 1.2))
        o.append(T(x + 8, y + 15, sid, "start", 9.5, SIG, True, True))
        o.append(T(x + 8, y + 29, req[0], "start", 9.5, INK))
        o.append(ARR(x + 24, y + 37, x + 24, y + 72, c=MUT, lw=1.3, head=6))
        o.append(_f02_lines(x + 36, y + 52, calc, "start", 9.5, MUT, lh=13))
        y2 = y + 74
        o.append(RECT(x, y2, w, 36, 6, soft(PUR), PUR, 1.2))
        o.append(T(x + 8, y2 + 15, dlab, "start", 9.5, PUR, True))
        o.append(T(x + 8, y2 + 29, der[0], "start", 10, INK, True))
        o.append(ARR(x + 24, y2 + 37, x + 24, y2 + 52, c=MUT, lw=1.3, head=6))
        y3 = y2 + 54
        o.append(RECT(x, y3, w, 36, 6, soft(TEA) if k < 2 else soft(PUR), TEA if k < 2 else PUR, 1.0))
        o.append(_f02_lines(x + 8, y3 + 15, pick, "start", 9.5, INK, lh=13))
    yend = yb + 12 + 74 + 54 + 36
    return SVG(700, yend + 8, o, "要求の割り当ての表と、派生要求の例（DS- の番号は、この章の例で置いた番号。DS-H06 は電池ホルダと電圧を測る回路。SR-W02 は 5 節の電力の予算で分ける）。")
F["e02_alloc"] = _f02_alloc()


# =====================================================================
# 1 節: 設計書の目次の型
# =====================================================================
def _f02_toc():
    o = []
    x, y, w, h = 14, 10, 430, 342
    o.append(_f02_page(x, y, w, h, PUR))
    o.append(T(x + 14, y + 24, "方式設計書", "start", 12.5, PUR, True))
    o.append(T(x + 100, y + 24, "（ロガーでは LG-DES-001）", "start", 9.5, MUT))
    items = [
        ("1 文書の情報と設計の入力", "文書番号・版・改訂履歴、入力にした仕様書の番号と版", "1 節"),
        ("2 構成", "部品の構成の図、部品を選んだ理由、要求の受け持ちの表", "1・2 節"),
        ("3 インタフェース", "ピン、バスのやり取り、データの並び、関数の決まり", "3 節"),
        ("4 振る舞い", "中の状態の表、処理の分け方、やり取りの順、時間割", "4 節"),
        ("5 資源の見積もり", "電力・メモリ・処理時間の見積もりと目標、実測の欄", "5 節"),
        ("6 決めた理由の記録", "背景・比べた案・決めたこと・理由・影響", "6 節"),
        ("7 異常時の処理", "異常ごとの見つけ方・処置・利用者への見え方", "6 節"),
        ("8 試験とのつながり", "要求・設計・試験の対応表", "01 章 6 節"),
    ]
    for k, (t1, t2, sec) in enumerate(items):
        yy = y + 50 + k * 36
        o.append(W(x + 12, yy - 13, x + w - 12, yy - 13, c=LIN, lw=0.7))
        o.append(T(x + 16, yy + 2, t1, "start", 10.5, INK, True))
        o.append(T(x + 30, yy + 17, t2, "start", 9.5, MUT))
        o.append(_f02_chip(x + w - 14, yy + 2, "→ " + sec, SIG, 9.5, "end"))
    # 詳細設計書
    x2, y2, w2, h2 = 462, 10, 224, 226
    o.append(_f02_page(x2, y2, w2, h2, PUR))
    o.append(T(x2 + 14, y2 + 24, "詳細設計書", "start", 12.5, PUR, True))
    o.append(T(x2 + 14, y2 + 42, "ソフトウェアの部分ごとに繰り返す", "start", 9.5, MUT))
    o.append(RECT(x2 + 12, y2 + 52, w2 - 24, 140, 5, soft(PUR), PUR, 1.0, dash="4 3"))
    sub = ["責任（何を受け持つか）", "持つデータ", "関数（引数・戻り値）", "呼んでよい条件と、", "戻った後に成り立つこと", "失敗したときの返し方", "資源（メモリ・時間）"]
    for k, s in enumerate(sub):
        ind = 30 if k == 4 else 22
        o.append(T(x2 + ind, y2 + 72 + k * 17, s, "start", 9.5, INK))
    o.append(_f02_chip(x2 + w2 - 14, y2 + h2 - 14, "→ 6 節", SIG, 9.5, "end"))
    # 入力と出力
    yi = 256
    o.append(RECT(x2, yi, w2, 42, 6, soft(SIG), SIG, 1.1))
    o.append(T(x2 + 10, yi + 17, "入力: システム仕様書", "start", 9.5, SIG, True))
    o.append(T(x2 + 10, yi + 32, "LG-SYS-001 版 1.0（03 章）を 1 に書く", "start", 9.5, INK))
    yo = 306
    o.append(RECT(x2, yo, w2, 42, 6, soft(GRN), GRN, 1.1))
    o.append(T(x2 + 10, yo + 17, "出力: 8 の対応表から", "start", 9.5, GRN, True))
    o.append(T(x2 + 10, yo + 32, "試験仕様書 LG-TST-001 へ", "start", 9.5, INK))
    return SVG(700, 360, o, "方式設計書と詳細設計書の目次の型（右の札は、書き方を説明する節）。")
F["e02_toc"] = _f02_toc()


# =====================================================================
# 2 節: ブロック図 — 悪い例と良い例
# =====================================================================
def _f02_block():
    o = []
    # ---- (a) 悪い例 ----
    o.append(T(14, 16, "(a) 悪い例", "start", 11.5, ALI, True))
    bx = {"U1": (168, 62, 64, 40), "U2": (292, 30, 52, 26), "U3": (292, 96, 52, 26), "Y1": (178, 24, 44, 22),
          "SW1": (60, 34, 52, 24), "D1": (60, 76, 52, 24), "BT1": (60, 120, 52, 24), "ANT1": (292, 138, 52, 22)}
    for nm, (x, y, w, h) in bx.items():
        o.append(RECT(x, y, w, h, 3, PAN, MUT, 1.2))
        o.append(T(x + w / 2, y + h / 2 + 4, nm, "middle", 10, INK, True, True))
    ln = [((232, 76), (292, 43)), ((232, 90), (292, 109)), ((200, 62), (200, 46)), ((112, 46), (168, 70)),
          ((112, 88), (168, 84)), ((112, 132), (168, 96)), ((232, 98), (292, 149)), ((86, 120), (86, 100))]
    for (a, b) in ln:
        o.append(W(a[0], a[1], b[0], b[1], c=MUT, lw=1.2))
    o.append(_f02_num(262, 60, 1))
    o.append(_f02_num(34, 96, 2))
    o.append(_f02_num(262, 128, 3))
    o.append(_f02_num(150, 120, 4))
    o.append(_f02_num(140, 150, 5))
    probs = ["線が電源か、バスか、1 本の信号かが分からない", "外の相手（利用者・アプリ・周囲の空気）と、",
             "システムの境界が無い", "バスの種類と速さが書いていない", "U1 などの記号では、部品の役割が分からない",
             "電池の電圧を測る線が無い（SR-F13 を受け持つ", "部品が見当たらない）"]
    yy = 30
    for k, txt in zip([1, 2, None, 3, 4, 5, None], probs):
        if k:
            o.append(_f02_num(392, yy - 4, k))
        o.append(T(406, yy, txt, "start", 9.5, ALI if k else ALI))
        yy += 21 if k is None or k in (3, 4) else 17
    o.append(W(14, 176, 686, 176, c=LIN, lw=0.8))
    # ---- (b) 良い例 ----
    Y = 184
    o.append(T(14, Y + 16, "(b) 良い例", "start", 11.5, GRN, True))
    o.append(RECT(150, Y + 26, 406, 302, 10, "none", SIG, 1.4, dash="6 4"))
    o.append(T(160, Y + 42, "ロガー（システムの境界）", "start", 10, SIG, True))

    def part(x, y, w, h, did, nm, sub=None):
        o.append(RECT(x, y, w, h, 6, soft(TEA), TEA, 1.4))
        o.append(T(x + w / 2, y + 15, did, "middle", 9.5, TEA, True, True))
        o.append(T(x + w / 2, y + 30, nm, "middle", 10, INK, True))
        if sub:
            o.append(T(x + w / 2, y + 44, sub, "middle", 9.5, MUT))
    part(162, Y + 54, 104, 50, "DS-H05", "ボタンと LED")
    part(322, Y + 54, 116, 42, "DS-H04", "水晶 32.768 kHz")
    part(470, Y + 54, 76, 42, "", "アンテナ")
    part(320, Y + 120, 120, 76, "DS-H01", "マイコン", "（BLE を内蔵）")
    part(162, Y + 132, 104, 50, "DS-H03", "記録用フラッシュ")
    part(470, Y + 132, 76, 50, "DS-H02", "温湿度センサ")
    part(280, Y + 236, 160, 60, "DS-H06", "電池ホルダと", "電圧を測る回路")
    # 電源（太い線）
    o.append(W(360, Y + 236, 360, Y + 196, c=INK, lw=3))
    o.append(W(280, Y + 256, 214, Y + 256, 214, Y + 182, c=INK, lw=3))
    o.append(W(440, Y + 256, 508, Y + 256, 508, Y + 182, c=INK, lw=3))
    o.append(T(366, Y + 222, "3 V", "start", 9.5, INK, True, halo=True))
    # バス（青緑の太い線と、種類・速さ）
    o.append(W(266, Y + 157, 320, Y + 157, c=TEA, lw=3.2))
    o.append(T(293, Y + 150, "SPI", "middle", 9.5, TEA, True, halo=True))
    o.append(T(293, Y + 172, "8 MHz", "middle", 9.5, TEA, False, halo=True))
    o.append(W(440, Y + 157, 470, Y + 157, c=TEA, lw=3.2))
    o.append(T(455, Y + 150, "I2C", "middle", 9.5, TEA, True, halo=True))
    o.append(T(455, Y + 172, "400 kHz", "middle", 9.5, TEA, False, halo=True))
    # 1 本の信号（細い線と向き）
    o.append(W(266, Y + 68, 300, Y + 68, 300, Y + 130, c=MUT, lw=1.3))
    o.append(ARR(300, Y + 130, 320, Y + 130, c=MUT, lw=1.3, head=6))
    o.append(W(320, Y + 142, 288, Y + 142, 288, Y + 90, c=MUT, lw=1.3))
    o.append(ARR(288, Y + 90, 266, Y + 90, c=MUT, lw=1.3, head=6))
    o.append(T(305, Y + 112, "GPIO", "start", 9.5, MUT, False, halo=True))
    o.append(ARR(380, Y + 96, 380, Y + 118, c=MUT, lw=1.3, head=6))
    o.append(W(440, Y + 132, 456, Y + 132, 456, Y + 75, 470, Y + 75, c=MUT, lw=1.3))
    o.append(T(410, Y + 228, "電圧", "end", 9.5, MUT, False, halo=True))
    o.append(ARR(414, Y + 236, 414, Y + 198, c=MUT, lw=1.3, head=6))
    # 外の相手（コンテキスト図と同じ）
    o.append(RECT(14, Y + 54, 112, 58, 8, soft(GLD), GLD, 1.3))
    o.append(T(70, Y + 78, "利用者", "middle", 10.5, GLD, True))
    o.append(T(70, Y + 94, "（管理者・作業者）", "middle", 9.5, MUT))
    o.append(ARR(126, Y + 66, 162, Y + 66, c=GLD, lw=1.5, head=6))
    o.append(T(144, Y + 61, "押す", "middle", 9.5, GLD, False, halo=True))
    o.append(ARR(162, Y + 96, 126, Y + 96, c=GLD, lw=1.5, head=6))
    o.append(T(144, Y + 110, "見る", "middle", 9.5, GLD, False, halo=True))
    o.append(RECT(14, Y + 258, 112, 50, 8, soft(GLD), GLD, 1.3))
    o.append(T(70, Y + 280, "電池 CR2032", "middle", 10.5, GLD, True))
    o.append(T(70, Y + 296, "（利用者が入れる）", "middle", 9.5, MUT))
    o.append(ARR(126, Y + 283, 280, Y + 283, c=GLD, lw=1.5, head=6))
    o.append(T(176, Y + 277, "電力", "middle", 9.5, GLD, False, halo=True))
    o.append(W(70, Y + 112, 70, Y + 258, c=GLD, lw=1.3, dash="4 3"))
    o.append(T(76, Y + 190, "替える", "start", 9.5, GLD, False, halo=True))
    o.append(RECT(580, Y + 50, 106, 52, 8, soft(GLD), GLD, 1.3))
    o.append(T(633, Y + 72, "スマートフォン", "middle", 10, GLD, True))
    o.append(T(633, Y + 88, "のアプリ", "middle", 10, GLD, True))
    zz = [(546, Y + 75)]
    for k in range(1, 8):
        zz.append((546 + k * 4.5, Y + 75 + (5 if k % 2 else -5)))
    zz.append((580, Y + 75))
    o.append(PL(zz, c=SIG, lw=1.3))
    o.append(T(563, Y + 64, "BLE", "middle", 9.5, SIG, True, halo=True))
    o.append(RECT(580, Y + 132, 106, 50, 8, soft(GLD), GLD, 1.3))
    o.append(T(633, Y + 153, "周囲の空気", "middle", 10, GLD, True))
    o.append(T(633, Y + 169, "（温度・湿度）", "middle", 9.5, MUT))
    o.append(ARR(580, Y + 157, 548, Y + 157, c=GLD, lw=1.5, head=6))
    # 凡例
    yl = Y + 350
    o.append(W(16, yl - 4, 44, yl - 4, c=INK, lw=3))
    o.append(T(50, yl, "電源", "start", 9.5, MUT))
    o.append(W(92, yl - 4, 120, yl - 4, c=TEA, lw=3.2))
    o.append(T(126, yl, "バス（種類と速さを書く）", "start", 9.5, MUT))
    o.append(ARR(252, yl - 4, 280, yl - 4, c=MUT, lw=1.3, head=6))
    o.append(T(286, yl, "1 本の信号（向き）", "start", 9.5, MUT))
    o.append(RECT(384, yl - 10, 26, 12, 3, "none", SIG, 1.3, dash="4 3"))
    o.append(T(416, yl, "システムの境界", "start", 9.5, MUT))
    o.append(RECT(506, yl - 10, 22, 12, 3, soft(GLD), GLD, 1.1))
    o.append(T(534, yl, "外の相手（コンテキスト図と同じ）", "start", 9.5, MUT))
    return SVG(700, yl + 10, o, "同じロガーのブロック図の悪い例と良い例（(b) の DS- は設計の要素の ID、バスの速さは例の値）。")
F["e02_block"] = _f02_block()


# =====================================================================
# 2 節: ハードウェアとソフトウェアの分担
# =====================================================================
def _f02_hwsw():
    o = []
    o.append(T(14, 16, "(a) 機能を、時間の細かさと変える見込みで並べる", "start", 11.5, INK, True))
    p = Plot(56, 30, 316, 200, (1e-7, 100.0), (0, 1), xlog=True)
    # 領域
    o.append(RECT(p.x, p.y, p.X(1e-5) - p.x, p.h, 0, soft(TEA), "none", 0))
    o.append(RECT(p.X(1e-3), p.y, p.x + p.w - p.X(1e-3), p.Y(0.5) - p.y, 0, soft(PUR), "none", 0))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, "none", LIN, 1.0))
    o.append(T(p.x + 4, p.y + 14, "回路・周辺の回路", "start", 9.5, TEA, True))
    o.append(T(p.X(1e-3) + 4, p.y + 14, "ソフトウェア", "start", 9.5, PUR, True))
    o.append(T(p.X(2e-4), p.Y(0.30), "比べて決める", "middle", 9.5, MUT, True))
    for v, s in ((1e-7, "100 ns"), (1e-5, "10 µs"), (1e-3, "1 ms"), (1e-1, "100 ms"), (10.0, "10 s")):
        o.append(W(p.X(v), p.y + p.h, p.X(v), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, s, "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 31, "反応や制御に要る時間の細かさ", "middle", 10, MUT))
    o.append(T(p.x - 8, p.y + 10, "高い", "end", 9.5, MUT))
    o.append(T(p.x - 8, p.y + p.h - 2, "低い", "end", 9.5, MUT))
    o.append(T(p.x - 36, p.y + p.h / 2, "後から変える見込み", "middle", 10, MUT, rot=-90))
    pts = [  # (時間, 見込み, 文字, 置き方, dx, dy)
        (1e-6, 0.13, "BLE の電波（1 µs）", "start", 6, -6),
        (2.5e-6, 0.36, "I2C の信号（2.5 µs）", "start", 6, -6),
        (3.05e-5, 0.10, "時刻を数える（30.5 µs・眠る間も）", "start", 6, 4),
        (5e-3, 0.52, "チャタリングの除去（5 ms）", "middle", 0, -10),
        (2e-2, 0.86, "LED の点滅の仕方（20 ms）", "end", -7, 4),
        (1.0, 0.72, "短押し・長押し（1・3 s）", "end", -7, 4),
        (60.0, 0.62, "警報の判定", "end", -7, -6),
    ]
    for t, yv, s, a, dx, dy in pts:
        c = TEA if t < 1e-4 else (PUR if yv > 0.55 else INK)
        o.append(D(p.X(t), p.Y(yv), c, 4))
        o.append(T(p.X(t) + dx, p.Y(yv) + dy, s, a, 9.5, c, True, halo=True))
    # (b) チャタリングの除去の比べ方
    xb = 400
    o.append(T(xb, 16, "(b) チャタリングの除去の比べ方", "start", 11.5, INK, True))
    cw = [62, 112, 112]
    hdr = ["観点", "回路で", "ソフトウェアで"]
    xx = xb
    for w, h in zip(cw, hdr):
        o.append(_f02_cell(xx, 26, w, 24, h, INK, SCR, LIN, 9.5, True))
        xx += w
    rows = [
        ("部品", (["抵抗 1・コンデンサ 1"], ASOFT), (["なし（タイマと", "ピンの割り込み）"], GSOFT)),
        ("費用", (["1 台 2 円（例）"], ASOFT), (["0 円"], GSOFT)),
        ("時間", (["部品の値としきい値", "のばらつきで変わる"], "none"), (["5 ms ごとに 3 回で", "15 ms 以内と決まる"], GSOFT)),
        ("電力", (["増えない"], "none"), (["押す間 5 ms ごとに", "起きる（0.0002 µA）"], "none")),
        ("変える", (["基板を作り直す"], ASOFT), (["プログラムを直す"], GSOFT)),
    ]
    y = 50
    for nm, a, b in rows:
        o.append(_f02_cell(xb, y, cw[0], 34, nm, INK, "none", LIN, 9.5, True))
        o.append(_f02_cell(xb + cw[0], y, cw[1], 34, a[0], INK, a[1], LIN, 9.5))
        o.append(_f02_cell(xb + cw[0] + cw[1], y, cw[2], 34, b[0], INK, b[1], LIN, 9.5))
        y += 34
    o.append(T(xb, y + 18, "ロガーの決め方: ソフトウェアで行う", "start", 10, PUR, True))
    o.append(T(xb, y + 33, "（緑は良い側、赤は悪い側、色なしは差が小さい）", "start", 9.5, MUT))
    return SVG(700, 276, o, "ハードウェアとソフトウェアの分担（(a) はロガーの機能の位置を示す地図で、時間の細かさは例の値。(b) の費用と電力は例の値）。")
F["e02_hwsw"] = _f02_hwsw()


# =====================================================================
# 3 節: ピン割り当て — 悪い例と良い例
# =====================================================================
def _f02_pins():
    o = []
    o.append(T(14, 16, "(a) 悪い例", "start", 11.5, ALI, True))
    rows_a = [("P02", "SCL"), ("P13", "フラッシュの CS"), ("P20", "ボタン"), ("P21", "赤の LED")]
    o.append(_f02_cell(14, 24, 44, 20, "ピン", INK, SCR, LIN, 9.5, True))
    o.append(_f02_cell(58, 24, 120, 20, "名前", INK, SCR, LIN, 9.5, True))
    for k, (p_, n_) in enumerate(rows_a):
        o.append(_f02_cell(14, 44 + k * 20, 44, 20, p_, INK, "none", LIN, 9.5, False, mono=True))
        o.append(_f02_cell(58, 44 + k * 20, 120, 20, n_, INK, "none", LIN, 9.5, False, "start"))
    probs = ["向き（入力か出力か）が無い", "論理（L で選ぶのか H で選ぶのか）が無い", "リセットの後と、眠る間の状態が無い",
             "電気的な条件（プルアップ・電流）が無い"]
    for k, s in enumerate(probs):
        o.append(_f02_num(204, 40 + k * 20 - 4, k + 1))
        o.append(T(218, 40 + k * 20, s, "start", 9.5, ALI))
    o.append(W(14, 136, 686, 136, c=LIN, lw=0.8))
    # (b) 良い例
    yb = 144
    o.append(T(14, yb + 16, "(b) 良い例", "start", 11.5, GRN, True))
    cw = [38, 76, 90, 168, 100, 96, 104]
    hd = ["ピン", "信号の名前", "向き", "論理と電気的な条件", "リセットの後", "眠る間", "つなぐ先"]
    new = [False, False, True, True, True, True, False]
    x = 14
    for w, h, nw in zip(cw, hd, new):
        o.append(_f02_cell(x, yb + 26, w, 24, h, GRN if nw else INK, GSOFT if nw else SCR, LIN, 9.5, True))
        x += w
    rows = [
        ("P02", "I2C_SCL", ["出力", "（オープンドレイン）"], ["外付けのプルアップ 10 kΩ", "（VDD へ）"], ["入力（Hi-Z）", "プルアップで H"], ["H（バスは休み）"], ["温湿度センサ", "DS-H02"]),
        ("P13", "FLASH_CS", ["出力"], ["負論理（L で選ぶ）", "外付けのプルアップ 100 kΩ"], ["入力（Hi-Z）", "→ H（選ばない）"], ["H（選ばない）"], ["記録用フラッシュ", "DS-H03"]),
        ("P20", "BUTTON", ["入力"], ["負論理（押すと L）", "内蔵のプルアップ"], ["入力", "（プルアップ）"], ["入力（立ち下がり", "で起こす）"], ["ボタン", "DS-H05"]),
        ("P21", "LED_RED", ["出力"], ["正論理（H で点灯）", "直列の抵抗で 2 mA"], ["入力（Hi-Z）", "→ 消灯"], ["L（消灯）"], ["赤の LED", "DS-H05"]),
    ]
    y = yb + 50
    for r in rows:
        x = 14
        for j, (w, v) in enumerate(zip(cw, r)):
            o.append(_f02_cell(x, y, w, 36, v, INK, "none", LIN, 9.5, False, mono=(j < 2)))
            x += w
        y += 36
    o.append(T(14, y + 18, "緑の見出しの列が、(a) に無い列。つなぐ先には設計の要素の ID を書く（ピンの番号と信号の名前は例）", "start", 9.5, MUT))
    return SVG(700, y + 26, o, "ピン割り当ての表の悪い例と良い例（ロガーのピンのうち 4 本。抵抗の値と電流は例の値）。")
F["e02_pins"] = _f02_pins()


# =====================================================================
# 3 節: I2C の 1 回の測定のタイミング図
# =====================================================================
def _f02_i2c():
    o = []
    o.append(T(14, 16, "(a) 1 回の測定のやり取り（400 kHz・センサのアドレス 0x44。どれも例の値）", "start", 11.5, INK, True))
    rows = [("バス", 50), ("センサ", 100), ("マイコン", 142)]
    for nm, yy in rows:
        o.append(T(14, yy + 4, nm, "start", 10, INK, True))

    def bus(x, segs, y=50, h=26):
        out = []
        for lab, w, c in segs:
            out.append(RECT(x, y - h / 2, w, h, 2, soft(c), c, 1.0))
            out.append(T(x + w / 2, y + 4, lab, "middle", 9.5, c, True))
            x += w
        return "".join(out), x
    s1, xa1 = bus(106, [("S", 14, MUT), ("0x44 W", 44, PUR), ("A", 14, TEA), ("命令 2 B", 70, PUR), ("A", 14, TEA), ("P", 14, MUT)])
    o.append(s1)
    xa0 = 106
    xb0, xb1 = xa1 + 10, xa1 + 110
    s2, xc1 = bus(xb1 + 10, [("S", 14, MUT), ("0x44 R", 44, PUR), ("A", 14, TEA), ("結果 6 B（温度・湿度と誤り検出）", 182, TEA), ("NA", 22, PUR), ("P", 14, MUT)])
    o.append(s2)
    xc0 = xb1 + 10
    o.append(W(xb0, 50, xb1, 50, c=MUT, lw=1.2, dash="3 3"))
    for xx in (xa1 + 5, xb1 + 5):
        o.append(W(xx - 4, 40, xx + 2, 60, c=FNT, lw=1.2))
        o.append(W(xx + 1, 40, xx + 7, 60, c=FNT, lw=1.2))
    # センサ
    for x0_, x1_, t_, c_, f_ in ((xa0, xa1, "待機 0.05 µA", MUT, PAN), (xb0, xb1, "測る 0.3 mA", TEA, soft(TEA)), (xc0, xc1, "待機", MUT, PAN)):
        o.append(RECT(x0_, 90, x1_ - x0_, 20, 2, f_, c_ if c_ != MUT else LIN, 1.1))
        o.append(T((x0_ + x1_) / 2, 104, t_, "middle", 9.5, c_, c_ != MUT))
    # マイコン
    for x0_, x1_, t_, c_, f_ in ((xa0, xa1, "動作", PUR, soft(PUR)), (xb0, xb1, "眠る", MUT, PAN), (xc0, xc1, "動作", PUR, soft(PUR))):
        o.append(RECT(x0_, 132, x1_ - x0_, 20, 2, f_, c_ if c_ != MUT else LIN, 1.1))
        o.append(T((x0_ + x1_) / 2, 146, t_, "middle", 9.5, c_, c_ != MUT))
    # 時間
    o.append(DIM(xa0, 170, xa1, 170, None, c=MUT))
    o.append(T((xa0 + xa1) / 2, 185, "72.5 µs（3 バイト）", "middle", 9.5, MUT))
    o.append(DIM(xb0, 170, xb1, 170, None, c=GLD))
    o.append(T((xb0 + xb1) / 2, 185, "待つ 5 ms", "middle", 9.5, GLD, True))
    o.append(DIM(xc0, 170, xc1, 170, None, c=MUT))
    o.append(T((xc0 + xc1) / 2, 185, "162.5 µs（7 バイト）", "middle", 9.5, MUT))
    o.append(T(14, 205, "S: 始め　W: 書く　R: 読む　A: 受け取りの合図（ACK）　NA: もう要らないという合図　P: 終わり", "start", 9.5, MUT))
    o.append(W(14, 216, 686, 216, c=LIN, lw=0.8))
    # (b) 最初の 1 バイトの拡大
    y0 = 222
    o.append(T(14, y0 + 16, "(b) 最初の 1 バイトの拡大", "start", 11.5, INK, True))
    bw, x0 = 50.0, 130
    ys, yd, hh = y0 + 50, y0 + 98, 24     # SCL・SDA の H の高さ
    o.append(T(14, ys + 16, "SCL", "start", 10, INK, True, True))
    o.append(T(14, yd + 16, "SDA", "start", 10, INK, True, True))
    scl = [(x0 - 60, ys), (x0 - 8, ys), (x0 - 8, ys + hh)]
    for b in range(9):
        xb = x0 + b * bw
        scl += [(xb + 0.4 * bw, ys + hh), (xb + 0.4 * bw, ys), (xb + 0.85 * bw, ys), (xb + 0.85 * bw, ys + hh)]
    scl.append((x0 + 9 * bw + 30, ys + hh))
    o.append(PL(scl, c=SIG, lw=1.8))
    bits = [1, 0, 0, 0, 1, 0, 0, 0, 0]
    labs = ["1", "0", "0", "0", "1", "0", "0", "W", "A"]
    lvl = lambda v: yd if v else yd + hh
    sda = [(x0 - 60, yd), (x0 - 24, yd), (x0 - 24, yd + hh)]
    for b, v in enumerate(bits):
        xb = x0 + b * bw
        sda += [(xb + 2, sda[-1][1]), (xb + 2, lvl(v))]
    xe = x0 + 9 * bw + 2
    sda += [(xe, lvl(0)), (xe, yd), (xe + 28, yd)]
    o.append(PL(sda, c=PUR, lw=1.8))
    o.append(RECT(x0 + 8 * bw + 2, yd - 5, bw, hh + 10, 3, "none", TEA, 1.3, dash="3 2"))
    for b, s in enumerate(labs):
        c = TEA if s == "A" else PUR
        o.append(T(x0 + b * bw + 0.62 * bw, yd + hh + 17, s, "middle", 10, c, True, True))
    o.append(T(x0 + 3.5 * bw, yd + hh + 33, "アドレス 0x44 の 7 ビット（1000100）", "middle", 9.5, PUR))
    o.append(T(x0 + 8.62 * bw, yd + hh + 33, "センサが L にする", "middle", 9.5, TEA))
    o.append(T(x0 - 66, ys - 10, "始め: SCL が H の間に SDA を下げる", "start", 9.5, MUT))
    o.append(T(x0 + 2.2 * bw, ys - 10, "SDA は SCL が L の間に変える", "start", 9.5, MUT))
    o.append(DIM(x0 + 5.4 * bw, ys - 14, x0 + 6.4 * bw, ys - 14, None, c=GLD))
    o.append(T(x0 + 6.5 * bw, ys - 10, "1 ビット 2.5 µs", "start", 9.5, GLD, True))
    return SVG(700, yd + hh + 42, o, "センサとの I2C の 1 回の測定のタイミング図（(a) の横の長さは、区間ごとに縮めたり伸ばしたりして描いた）。")
F["e02_i2c"] = _f02_i2c()


# =====================================================================
# 3 節: 記録 1 件の形式とエンディアン
# =====================================================================
def _f02_bytes():
    o = []
    o.append(T(14, 16, "(a) 記録 1 件（8 バイト。リトルエンディアン）の形式", "start", 11.5, INK, True))
    x0, u, y = 56, 78, 46
    fields = [("時刻", 4, PUR, "符号なし 32 ビット・秒", ["40", "8A", "E6", "30"]),
              ("温度", 2, PUR, "符号付き 16 ビット・0.01 °C", ["00", "02"]),
              ("湿度", 1, PUR, "1 %RH 単位", ["2D"]),
              ("状態の印", 1, PUR, "ビットごと", ["00"])]
    for b in range(8):
        o.append(T(x0 + b * u + u / 2, y - 8, "%d" % b, "middle", 9.5, FNT, False, True))
    o.append(T(x0 - 8, y - 8, "位置", "end", 9.5, FNT))
    xx = x0
    for fi, (nm, nb, c, sub, hx) in enumerate(fields):
        w = nb * u
        o.append(RECT(xx, y, w, 40, 4, soft(c) if fi % 2 == 0 else PAN, c, 1.3))
        o.append(T(xx + w / 2, y + 16, nm, "middle", 10.5, c, True))
        o.append(T(xx + w / 2, y + 32, sub, "middle", 9.5, INK))
        for k, h in enumerate(hx):
            o.append(RECT(xx + k * u + 6, y + 48, u - 12, 22, 3, SCR, c, 1.0))
            o.append(T(xx + k * u + u / 2, y + 63, h, "middle", 10.5, INK, True, True))
        xx += w
    o.append(T(x0 - 8, y + 63, "例", "end", 9.5, FNT))
    notes = [
        (x0, ["基準の時刻からの秒", "（基準の日時も、データの", "形式として決める）"]),
        (x0 + 4 * u, ["−20.00〜+60.00 °C を", "−2000〜6000 で表す", "80 00 は「測れなかった」"]),
        (x0 + 6 * u, ["0〜100", "FF は「測れ", "なかった」"]),
        (x0 + 7 * u, ["警報・時刻", "未設定・電池", "少など"]),
    ]
    for x, ls in notes:
        o.append(_f02_lines(x + 4, y + 90, ls, "start", 9.5, MUT, lh=13))
    # (b) 読み方の比較
    yb = 184
    o.append(W(14, yb - 8, 686, yb - 8, c=LIN, lw=0.8))
    o.append(T(14, yb + 10, "(b) 温度の欄 00 02 の読み方", "start", 11.5, INK, True))

    def row(y, title, c, ok, order, val, res, note):
        o.append(T(14, y + 4, title, "start", 10, c, True))
        bx = 214
        for k, h in enumerate(["00", "02"]):
            o.append(RECT(bx + k * 40, y - 12, 34, 22, 3, SCR, PUR, 1.0))
            o.append(T(bx + k * 40 + 17, y + 3, h, "middle", 10.5, INK, True, True))
        o.append(ARR(bx + 80, y, bx + 100, y, c=MUT, lw=1.3, head=6))
        o.append(T(bx + 106, y + 4, order, "start", 10, INK, True, True))
        o.append(ARR(bx + 196, y, bx + 216, y, c=MUT, lw=1.3, head=6))
        o.append(T(bx + 222, y + 4, val, "start", 10, INK, True))
        o.append(ARR(bx + 300, y, bx + 320, y, c=MUT, lw=1.3, head=6))
        o.append(T(bx + 326, y + 4, res, "start", 11, c, True))
        o.append(_f02_check(bx + 412, y, ok))
        o.append(T(214, y + 22, note, "start", 9.5, c))
    row(yb + 40, "決めたとおり（リトルエンディアン）", GRN, True, "0x0200", "= 512", "5.12 °C", "小さい桁のバイト 00 が先。上限 8.0 °C と下限 2.0 °C の間なので、警報は出ない")
    row(yb + 90, "逆の順（ビッグエンディアン）", ALI, False, "0x0002", "= 2", "0.02 °C", "下限 2.0 °C を下回ったとして、起きていない警報が出る")
    return SVG(700, yb + 122, o, "記録 1 件の形式と、エンディアンを取り違えたときの読み誤り（例の記録: 5.12 °C・45 %RH・印なし。時刻のバイトは例）。")
F["e02_bytes"] = _f02_bytes()


# =====================================================================
# 4 節: 仕様の状態 → 中の状態とタスク
# =====================================================================
def _f02_refine():
    o = []
    o.append(T(14, 16, "(a) 仕様の状態（外から見える）", "start", 11.5, SIG, True))
    o.append(T(270, 16, "(b) 設計の中の状態と、受け持つタスク", "start", 11.5, PUR, True))
    # (a) 主のモード
    o.append(T(14, 40, "主のモード", "start", 10, MUT, True))
    o.append(STATE(70, 72, 84, 30, "停止中", SIG))
    o.append(STATE(196, 72, 84, 30, "記録中", SIG))
    o.append(STATE(133, 146, 92, 30, "電池切れ", SIG))
    o.append(CARR(112, 64, 154, 64, 0.25, SIG, 1.4))
    o.append(CARR(154, 80, 112, 80, 0.25, SIG, 1.4))
    o.append(T(133, 48, "長押し", "middle", 9.5, SIG, False, halo=True))
    o.append(T(133, 104, "長押し", "middle", 9.5, SIG, False, halo=True))
    o.append(ARR(76, 88, 112, 130, c=SIG, lw=1.3, head=6))
    o.append(ARR(190, 88, 156, 130, c=SIG, lw=1.3, head=6))
    o.append(T(88, 124, "電池が尽きる", "end", 9.5, SIG, False, halo=True))
    o.append(T(178, 124, "電池が尽きる", "start", 9.5, SIG, False, halo=True))
    # (a) 通信の状態
    o.append(T(14, 214, "通信の状態", "start", 10, MUT, True))
    o.append(STATE(56, 244, 74, 28, "通信なし", SIG))
    o.append(STATE(200, 244, 92, 28, "接続の受付中", SIG))
    o.append(STATE(130, 304, 68, 28, "接続中", SIG))
    o.append(ARR(94, 238, 153, 238, c=SIG, lw=1.3, head=6))
    o.append(T(124, 232, "短押し", "middle", 9.5, SIG, False, halo=True))
    o.append(ARR(153, 251, 94, 251, c=SIG, lw=1.3, head=6))
    o.append(T(124, 265, "2 分たつ", "middle", 9.5, SIG, False, halo=True))
    o.append(ARR(196, 259, 160, 289, c=SIG, lw=1.3, head=6))
    o.append(T(186, 290, "アプリが接続", "start", 9.5, SIG, False, halo=True))
    o.append(ARR(100, 289, 64, 259, c=SIG, lw=1.3, head=6))
    o.append(T(76, 290, "接続が切れる", "end", 9.5, SIG, False, halo=True))
    o.append(W(254, 28, 254, 330, c=LIN, lw=0.8))
    # (b) 測定タスク
    o.append(RECT(270, 28, 416, 156, 10, "none", PUR, 1.3, dash="6 4"))
    o.append(T(280, 44, "測定タスク", "start", 10.5, PUR, True))
    o.append(STATE(320, 100, 76, 30, "停止中", PUR))
    o.append(RECT(390, 36, 288, 140, 10, soft(SIG), SIG, 1.0))
    o.append(T(398, 52, "仕様の「記録中」", "start", 9.5, SIG, True))
    o.append(STATE(440, 140, 70, 30, "待ち", PUR))
    o.append(STATE(534, 74, 76, 30, "測定中", PUR))
    o.append(STATE(626, 140, 84, 30, "書き込み中", PUR))
    o.append(ARR(462, 124, 508, 90, c=PUR, lw=1.4, head=6))
    o.append(T(462, 114, "記録の時刻", "end", 9.5, PUR, False, halo=True))
    o.append(ARR(560, 90, 604, 124, c=PUR, lw=1.4, head=6))
    o.append(T(598, 98, "測定の完了", "start", 9.5, PUR, False, halo=True))
    o.append(ARR(584, 146, 476, 146, c=PUR, lw=1.4, head=6))
    o.append(T(530, 166, "書き込みの完了", "middle", 9.5, PUR, False, halo=True))
    o.append(ARR(358, 94, 495, 74, c=PUR, lw=1.4, head=6))
    o.append(T(430, 76, "長押し（すぐ 1 件目）", "middle", 9.5, PUR, False, halo=True))
    o.append(ARR(405, 136, 352, 116, c=PUR, lw=1.4, head=6))
    o.append(T(352, 140, "長押し", "middle", 9.5, PUR, False, halo=True))
    # (b) 通信タスク
    o.append(RECT(270, 196, 416, 134, 10, "none", PUR, 1.3, dash="6 4"))
    o.append(T(280, 212, "通信タスク", "start", 10.5, PUR, True))
    o.append(STATE(318, 262, 72, 28, "通信なし", PUR))
    o.append(STATE(426, 262, 88, 28, "接続の受付中", PUR))
    o.append(RECT(486, 204, 192, 118, 10, soft(SIG), SIG, 1.0))
    o.append(T(494, 220, "仕様の「接続中」", "start", 9.5, SIG, True))
    o.append(STATE(582, 244, 132, 28, "やり取りを待つ", PUR))
    o.append(STATE(582, 300, 132, 28, "読み出し中", PUR))
    o.append(ARR(355, 256, 381, 256, c=PUR, lw=1.3, head=6))
    o.append(T(368, 248, "短押し", "middle", 9.5, PUR, False, halo=True))
    o.append(ARR(381, 269, 355, 269, c=PUR, lw=1.3, head=6))
    o.append(T(368, 284, "2 分たつ", "middle", 9.5, PUR, False, halo=True))
    o.append(ARR(471, 256, 515, 247, c=PUR, lw=1.3, head=6))
    o.append(T(482, 240, "アプリが接続", "end", 9.5, PUR, False, halo=True))
    o.append(CARR(556, 258, 556, 286, 0.35, PUR, 1.3))
    o.append(CARR(608, 286, 608, 258, 0.35, PUR, 1.3))
    o.append(T(530, 276, "要求", "end", 9.5, PUR, False, halo=True))
    o.append(T(634, 276, "送り終わり", "start", 9.5, PUR, False, halo=True))
    o.append(CARR(516, 314, 318, 277, -0.2, PUR, 1.3))
    o.append(T(420, 324, "接続が切れる", "middle", 9.5, PUR, False, halo=True))
    return SVG(700, 338, o, "仕様の状態（左。ロガーの仕様書の表 3-2〜3-4 から、主な遷移だけを描いた）を、設計で中の状態に分け、タスクに受け持たせる（右）。電池切れの扱いは 04 章。")
F["e02_refine"] = _f02_refine()


# =====================================================================
# 4 節: 測定 1 回のシーケンス図
# =====================================================================
F["e02_seq"] = SEQFIG(
    [("RTC", TEA), ("測定タスク", PUR), ("温湿度センサ", TEA), ("記録用フラッシュ", TEA)],
    [
        (0, 1, "記録の時刻（割り込みで知らせる）"),
        (1, 2, "測定の命令（I2C）"),
        ("note", 2, "測る（5 ms・0.3 mA）", {"c": TEA}),
        (1, 1, "測定の完了（5 ms のタイマ）", {"c": PUR}),
        ("span", 1, 2, "眠って\n待つ", {"c": MUT, "side": -1}),
        (1, 2, "結果を読む（I2C）"),
        (2, 1, "温度と湿度の 6 B", {"dash": True, "c": TEA}),
        (1, 1, "換算・警報の判定・1 件を作る", {"c": PUR}),
        (1, 3, "起こして 1 件を送る（SPI）"),
        ("note", 3, "書き込み（0.7 ms・5 mA）", {"c": TEA}),
        (1, 3, "状態を読む"),
        ("span", 1, 2, "眠って\n待つ", {"c": MUT, "side": -1}),
        (3, 1, "書き終わった", {"dash": True, "c": TEA}),
        (1, 3, "眠らせる"),
        (1, 0, "次の記録の時刻を設定する"),
        ("note", 1, "眠る（次の記録の時刻まで）", {"c": PUR}),
    ],
    "測定 1 回のシーケンス図（時間は上から下へ進む。矢印の長さは時間に比例しない。破線は応答）。", w=700, dy=30, label_sz=10)


# =====================================================================
# 4 節: 測定 1 回の時間割と電流
# =====================================================================
_F02_TL = {  # 時間割（ms）。5 節の予算と同じ値
    "mcu": [(-0.5, 0, "眠り"), (0, 0.3, "動作"), (0.3, 5.3, "眠り"), (5.3, 6.0, "動作"), (6.0, 6.7, "眠り"), (6.7, 6.8, "動作"), (6.8, 7.5, "眠り")],
    "sen": [(-0.5, 0.3, "待機"), (0.3, 5.3, "測る 0.3 mA"), (5.3, 7.5, "待機")],
    "fla": [(-0.5, 5.7, "眠り 0.5 µA"), (5.7, 6.0, "受"), (6.0, 6.7, "書く"), (6.7, 6.8, ""), (6.8, 7.5, "眠り")],
}


def _f02_timeline():
    o = []
    x0, x1, t0, t1 = 120, 684, -0.5, 7.5
    X = lambda t: x0 + (t - t0) / (t1 - t0) * (x1 - x0)
    # 中の状態
    st = [(-0.5, 0, "待ち", MUT), (0, 5.3, "測定中", PUR), (5.3, 6.7, "書き込み中", PUR), (6.7, 7.5, "待ち", MUT)]
    yS = 40
    o.append(T(14, yS + 14, "中の状態", "start", 10, INK, True))
    for a, b, s, c in st:
        o.append(RECT(X(a), yS, X(b) - X(a), 20, 3, soft(c), c, 1.1))
        o.append(T((X(a) + X(b)) / 2, yS + 14, s, "middle", 9.5, c, True))
    for t, s in ((0, "記録の時刻"), (5.3, "測定の完了"), (6.7, "書き込みの完了")):
        o.append(W(X(t), yS - 6, X(t), 218, c=GLD, lw=1.1, dash="4 3"))
        o.append(T(X(t), yS - 10, s, "middle", 9.5, GLD, True, halo=True))
    rows = [("マイコン", "mcu", 84, PUR), ("センサ", "sen", 124, TEA), ("フラッシュ", "fla", 164, TEA)]
    for nm, key, y, c in rows:
        o.append(T(14, y + 14, nm, "start", 10, INK, True))
        for a, b, s in _F02_TL[key]:
            on = s not in ("眠り", "待機", "眠り 0.5 µA")
            o.append(RECT(X(a), y, X(b) - X(a), 20, 2, soft(c) if on else PAN, c if on else LIN, 1.0))
            if s and tw(s, 9.5) + 4 < X(b) - X(a):
                o.append(T((X(a) + X(b)) / 2, y + 14, s, "middle", 9.5, c if on else MUT, on))
    # マイコンの動作の長さ
    for a, b, s, dy in ((0, 0.3, "0.3 ms", -6), (5.3, 6.0, "0.4 + 0.3 ms", -6), (6.7, 6.8, "0.1 ms", -6)):
        o.append(T((X(a) + X(b)) / 2, 84 + dy, s, "middle", 9.5, PUR, True, halo=True))
    o.append(T(14, 196, "フラッシュ: 受 = 1 件を受け取る（0.3 ms）、書く = 書き込み 0.7 ms・5 mA", "start", 9.5, MUT))
    # 電流
    p = Plot(x0, 232, x1 - x0, 92, (t0, t1), (1e-3, 10.0), ylog=True)
    o.append(p.axes(xl="時間 [ms]（記録の時刻を 0 とする）", yl=None, xt=[0, 1, 2, 3, 4, 5, 6, 7], yt=[1e-3, 1e-2, 1e-1, 1, 10],
                    yfmt=lambda v: {1e-3: "1 µA", 1e-2: "10 µA", 1e-1: "0.1 mA", 1: "1 mA", 10: "10 mA"}[v]))
    o.append(T(14, 276, "電流の合計", "start", 10, INK, True))
    o.append(T(14, 290, "（対数の目盛）", "start", 9.5, MUT))
    seg = [(-0.5, 0.00255), (0, 3.00055), (0.3, 0.3025), (5.3, 3.00055), (5.7, 3.02505), (6.0, 5.00205), (6.7, 3.02505), (6.8, 0.00255), (7.5, 0.00255)]
    o.append(p.steps(seg, c=SIG, lw=2))
    o.append(T(X(2.8), p.Y(0.3025) - 6, "0.30 mA（センサが測る）", "middle", 9.5, SIG, True, halo=True))
    o.append(T(X(7.2), p.Y(0.00255) - 6, "2.55 µA", "middle", 9.5, SIG, True, halo=True))
    o.append(T(X(6.35), p.Y(5.0) - 6, "5 mA", "middle", 9.5, SIG, True, halo=True))
    o.append(T(X(0.15), p.Y(3.0) - 6, "3.0 mA", "start", 9.5, SIG, True, halo=True))
    return SVG(700, 368, o, "測定 1 回の時間割と電流（例の値。マイコンの動作は合わせて 1.1 ms。電流は対数の目盛）。")
F["e02_timeline"] = _f02_timeline()


# =====================================================================
# 5 節: 電力の予算（内訳と、設計の違いによる電池寿命）
# =====================================================================
_F02_Q = 180.0       # 設計で使う容量 [mAh]
_F02_PB = [  # (部品, 状態, 平均電流への寄与 [µA])。本文の表と同じ値（s02/power2.py で計算）
    ("マイコン", "眠り", 1.999901), ("マイコン", "動作", 0.0055), ("マイコン", "送信（受付）", 0.138889), ("マイコン", "送信（接続）", 0.099206),
    ("センサ", "待機", 0.05), ("センサ", "測定", 0.0025), ("フラッシュ", "眠り", 0.499999), ("フラッシュ", "書き込み", 0.005833),
    ("フラッシュ", "消去", 0.001471), ("LED", "記録中の表示", 1.333333), ("LED", "通信中の表示", 0.029762), ("LED", "状態の応答", 0.000463)]
# 本文の設計から 1 か所だけを変えたときの電池寿命 [年]（s02/power2.py）
_F02_CASES = [("本文の設計", 4.931), ("記録の間隔を 1 分にする", 4.774), ("警報の表示が続く", 3.736),
              ("表示の点灯を 150 ms にする", 1.577), ("フラッシュを眠らせ忘れる", 0.717)]


def _f02_power():
    o = []
    tot = sum(v for _, _, v in _F02_PB)
    lim = _F02_Q / 8760 * 1000
    n = len(_F02_PB) + 1
    o.append(T(14, 16, "(a) 平均電流の内訳（本文の設計）", "start", 11.5, INK, True))
    xb0, xb1 = 196, 424
    X = lambda v: xb0 + (math.log10(v) + 4) / 6 * (xb1 - xb0)
    y0, rh = 34, 21
    for v, s in ((1e-4, "0.0001"), (1e-2, "0.01"), (1.0, "1"), (100.0, "100")):
        o.append(W(X(v), y0 - 2, X(v), y0 + rh * n + 2, c=GRD, lw=1))
        o.append(T(X(v), y0 + rh * n + 16, s, "middle", 9.5, MUT))
    o.append(T((xb0 + xb1) / 2, y0 + rh * n + 32, "平均電流 [µA]（対数の目盛）", "middle", 10, MUT))
    items = _F02_PB + [("合計", "", tot)]
    for k, (pt, st, v) in enumerate(items):
        y = y0 + k * rh
        last = k == len(items) - 1
        c = PUR if last else TEA
        o.append(T(xb0 - 8, y + 14, (pt + " " + st) if st else pt, "end", 9.5, INK, last or st in ("眠り", "記録中の表示")))
        o.append(RECT(xb0, y + 4, X(v) - xb0, rh - 8, 2, soft(c), c, 1.1))
        o.append(T(X(v) + 4, y + 14, ("%.4f" % v if v < 0.01 else ("%.3f" % v if v < 1 else "%.2f" % v)) + " µA", "start", 9.5, c, True, halo=True))
    o.append(W(X(lim), y0 - 2, X(lim), y0 + rh * n, c=SIG, lw=1.6))
    o.append(T(X(lim) - 30, y0 - 6, "上限 20.5 µA（1 年）", "start", 9.5, SIG, True, halo=True))
    # (b) 設計の違いと電池寿命
    xl = 470
    o.append(T(xl - 10, 16, "(b) 電池寿命（Q = 180 mAh）", "start", 11.5, INK, True))
    L0, L1 = xl, 676
    XL = lambda v: L0 + v / 6.0 * (L1 - L0)
    yb = 50
    for k, (s, L) in enumerate(_F02_CASES):
        y = yb + k * 50
        ok = L >= 1
        c = GRN if ok else ALI
        o.append(T(L0, y, s, "start", 9.5, INK, k == 0))
        o.append(T(L1, y, ("%.1f 年" % L) if L >= 1 else ("%.2f 年" % L), "end", 9.5, c, True))
        o.append(RECT(L0, y + 6, XL(L) - L0, 16, 2, soft(c), c, 1.1))
        # 要求の 1 年と目標の 2 年の線は、棒の帯の中だけに引く（題と値の文字に掛けない）
        o.append(W(XL(1), y + 3, XL(1), y + 25, c=SIG, lw=1.6))
        o.append(W(XL(2), y + 3, XL(2), y + 25, c=PUR, lw=1.3, dash="4 3"))
    ya = yb + len(_F02_CASES) * 50 - 14
    for v in range(7):
        o.append(W(XL(v), ya, XL(v), ya + 4, c=MUT, lw=1))
        o.append(T(XL(v), ya + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(W(L0, ya, L1, ya, c=MUT, lw=1))
    o.append(T((L0 + L1) / 2, ya + 32, "電池寿命 [年]", "middle", 10, MUT))
    o.append(LEGL(L0 - 6, ya + 50, [(SIG, None, "要求 1 年"), (PUR, "4 3", "目標 2 年")], 9.5, 12))
    H = max(y0 + rh * n + 44, ya + 62)
    return SVG(700, H, o, "ロガーの電力の予算（SR-W02 の使い方の条件、例の値。(b) の 4 つの変更は、本文の設計から 1 か所だけを変えたもの。眠らせ忘れたフラッシュのスタンバイの電流は 25 µA、続く警報の表示は記録中の表示に代わって 30 秒ごとに 2 回点くとした）。")
F["e02_power"] = _f02_power()


# =====================================================================
# 5 節: メモリの予算（地図と目標）
# =====================================================================
def _f02_mem():
    o = []
    x0, x1 = 156, 596
    bars = [
        ("マイコンのフラッシュ", "（プログラム）512 KB", 512.0, [("BLE のスタック", 152), ("RTOS と|ドライバ", 24), ("アプリ", 48), ("定数", 8)], 0.5, "KB"),
        ("マイコンの RAM", "64 KB", 64.0, [("BLE のスタック", 18), ("タスクの|スタック", 10), ("ヒープ", 6), ("読み出しの|バッファ", 8), ("変数", 2)], 0.7, "KB"),
        ("記録用フラッシュ", "512 KiB", 512.0, [("設定", 8), ("記録 52 560 件（104 セクタ）", 416.0)], None, "KiB"),
    ]
    y = 30
    for nm, sub, cap, segs, tgt, unit in bars:
        o.append(T(14, y + 14, nm, "start", 10, INK, True))
        o.append(T(14, y + 28, sub, "start", 9.5, MUT))
        X = lambda v, cap=cap: x0 + v / cap * (x1 - x0)
        o.append(RECT(x0, y, x1 - x0, 32, 3, PAN, LIN, 1.0))
        acc = 0.0
        below = []
        for k, (s, v) in enumerate(segs):
            xa, xb = X(acc), X(acc + v)
            o.append(RECT(xa, y, xb - xa, 32, 0, soft(PUR) if k % 2 == 0 else PSOFT, PUR, 1.0))
            lines = s.split("|") if "|" in s else [s]
            lab = lines + ["%g" % round(v, 1)]
            if max(tw(l, 9.5) for l in lab) + 6 < xb - xa and len(lab) <= 2:
                for i, l in enumerate(lab):
                    o.append(T((xa + xb) / 2, y + 14 + i * 12, l, "middle", 9.5, PUR, i == 0))
            elif len(lab) == 3 and max(tw(l, 9.5) for l in lab) + 6 < xb - xa:
                for i, l in enumerate(lab):
                    o.append(T((xa + xb) / 2, y + 11 + i * 10, l, "middle", 9, PUR, i < 2))
            else:
                below.append(((xa + xb) / 2, s.replace("|", "") + " %g" % round(v, 1)))
            acc += v
        used = acc
        xf = X(used)
        o.append(T((xf + x1) / 2, y + 20, "空き %g" % round(cap - used, 1), "middle", 9.5, MUT))
        for i, (xc, s) in enumerate(below):
            yy = y + 46 + i * 13
            o.append(W(xc, y + 32, xc, yy - 9, c=PUR, lw=0.8))
            o.append(T(xc + 3, yy, s, "start", 9.5, PUR))
        o.append(T(x1 + 6, y + 14, "%g %s" % (round(used, 1), unit), "start", 9.5, INK, True))
        o.append(T(x1 + 6, y + 28, "%.0f %%" % (used / cap * 100), "start", 9.5, INK, True))
        if tgt:
            xt = X(cap * tgt)
            o.append(W(xt, y - 6, xt, y + 38, c=GRN, lw=1.6, dash="5 3"))
            o.append(T(xt + 3, y - 8, "目標 %d %%" % (tgt * 100), "start", 9.5, GRN, True, halo=True))
        y += 78 + (13 * max(0, len(below) - 1))
    o.append(T(14, y - 4, "記録用フラッシュは、1 セクタ（4 KiB）に記録を 510 件入れる（初めの 16 B は、通し番号と誤りを見つける符号）", "start", 9.5, MUT))
    o.append(T(14, y + 10, "空きの使い方（消去を先に済ませる分など）は 04 章で決める", "start", 9.5, MUT))
    return SVG(700, y + 18, o, "メモリの地図と目標（大きさは例の値。数字の単位は、マイコンの記憶が KB（1 KB = 1024 B）、記録用フラッシュが KiB）。")
F["e02_mem"] = _f02_mem()


# =====================================================================
# 5 節: 処理時間の予算（最も混む場面の時間割）
# =====================================================================
_F02_CPU = [  # (処理, 受け持つタスク, 起こすもの, 周期 [ms], 最悪実行時間 [ms], 締め切り [ms])。優先度の高い順
    ("無線の処理", "BLE のスタック", "接続イベント", 15.0, 2.0, 15.0),
    ("ボタンを読む", "操作タスク", "5 ms のタイマ", 5.0, 0.1, 5.0),
    ("読み出しの用意", "通信タスク", "接続イベントの後", 15.0, 6.0, 15.0),
    ("測定と記録", "測定タスク", "RTC（1 分ごと）", 60000.0, 1.1, 2000.0),
]


def _f02_sched(tasks, tmax):
    """優先度の固定した、割り込んで動く時間割（全部の処理が時刻 0 に起きる場合）。tasks = [(周期, 最悪実行時間), …]（優先度の高い順）。
    返り値 (runs = [(番号, 始め, 終わり, その仕事が起きた時刻)], jobs = [(番号, 起きた時刻, 終わった時刻 or None)])。w02.js の _w02_sched と同じ計算。"""
    n = len(tasks)
    q = [[] for _ in range(n)]
    nxt = [0.0] * n
    t, runs, jobs = 0.0, [], []
    while t < tmax - 1e-9:
        for i, (Tp, C) in enumerate(tasks):
            while nxt[i] <= t + 1e-9:
                q[i].append([nxt[i], C])
                nxt[i] += Tp
        k = next((i for i in range(n) if q[i]), None)
        tn = min(min(nxt), tmax)
        if k is None:
            t = tn
            continue
        te = min(t + q[k][0][1], tn)
        rl = q[k][0][0]
        if runs and runs[-1][0] == k and runs[-1][3] == rl and abs(runs[-1][2] - t) < 1e-9:
            runs[-1] = (k, runs[-1][1], te, rl)
        else:
            runs.append((k, t, te, rl))
        q[k][0][1] -= te - t
        if q[k][0][1] <= 1e-9:
            jobs.append((k, q[k][0][0], te))
            q[k].pop(0)
        t = te
    for i in range(n):
        for r, _ in q[i]:
            jobs.append((i, r, None))
    return runs, jobs


def _f02_cpu():
    o = []
    tasks = [(T_, C_) for _, _, _, T_, C_, _ in _F02_CPU]
    runs, jobs = _f02_sched(tasks, 30.0)
    U = sum(C_ / T_ for T_, C_ in tasks)
    # 最悪応答時間（最初の仕事 = 全部が同時に起きた場合）
    R = {}
    for k, r, f in jobs:
        if r == 0 and k not in R:
            R[k] = f
    o.append(T(14, 16, "(a) 処理時間の予算（例の値。上の行ほど優先度が高い）", "start", 11.5, INK, True))
    cw = [182, 112, 58, 88, 60, 78, 58, 36]
    hd = ["処理（受け持つもの）", "起こすもの", "周期 T_i", "最悪実行時間 C_i", "C_i / T_i", "最悪応答時間", "締め切り", "判定"]
    x = 14
    for w, h in zip(cw, hd):
        o.append(RECT(x, 24, w, 22, 0, SCR, LIN, 1.0))
        o.append(TX(x + w / 2, 39, h, "middle", 9.5, INK, True))
        x += w
    for k, (nm, who, why, T_, C_, D_) in enumerate(_F02_CPU):
        y = 46 + k * 22
        ok = R[k] <= D_ + 1e-9
        vals = [nm + "（" + who + "）", why, ("%g ms" % T_) if T_ < 1000 else "60 s", "%g ms" % C_, "%.3f" % (C_ / T_) if C_ / T_ >= 0.001 else "0.00002",
                "%.1f ms" % R[k], ("%g ms" % D_) if D_ < 1000 else "2 s", "○" if ok else "×"]
        x = 14
        for j, (w, v) in enumerate(zip(cw, vals)):
            c = (GRN if ok else ALI) if j == 7 else INK
            o.append(_f02_cell(x, y, w, 22, v, c, "none", LIN, 9.5, j == 7, "start" if j == 0 else "middle"))
            x += w
    o.append(TX(14, 46 + 4 * 22 + 16, "利用率 U = Σ C_i / T_i = 0.553（55 %）。締め切りは次に同じ処理が起きる時刻。測定だけは SR-P03（±2 秒）から 2 s", "start", 9.5, INK, True))
    # (b) 時間割
    yb = 160
    o.append(T(14, yb + 12, "(b) 全部が同時に起きた場合の時間割（0〜30 ms）", "start", 11.5, INK, True))
    x0, x1 = 130, 680
    X = lambda t: x0 + t / 30.0 * (x1 - x0)
    cols = [SIG, GLD, PUR, TEA]
    for k, (nm, who, why, T_, C_, _) in enumerate(_F02_CPU):
        y = yb + 24 + k * 30
        o.append(T(x0 - 8, y + 15, nm, "end", 9.5, INK, True))
        o.append(RECT(x0, y, x1 - x0, 22, 0, "none", LIN, 0.6))
        t = 0.0
        while t <= 30.0 + 1e-9 and T_ < 1000:
            o.append(ARR(X(t), y + 30, X(t), y + 22, c=MUT, lw=1, head=4))
            t += T_
        if T_ >= 1000:
            o.append(ARR(X(0), y + 30, X(0), y + 22, c=MUT, lw=1, head=4))
    for k, a, b, _ in runs:
        y = yb + 24 + k * 30
        o.append(RECT(X(a), y + 2, max(X(b) - X(a), 1.2), 18, 1, soft(cols[k]), cols[k], 1.0))
    for k in R:
        y = yb + 24 + k * 30
        if R[k] > 2.5:
            o.append(T(X(R[k]) + 3, y + 15, "%.1f ms で終わる" % R[k], "start", 9.5, cols[k], True, halo=True))
    ya = yb + 24 + 4 * 30 + 4
    for v in range(0, 31, 5):
        o.append(W(X(v), ya, X(v), ya + 4, c=MUT, lw=1))
        o.append(T(X(v), ya + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, ya + 32, "時間 [ms]（小さな矢印は、処理が起きる時刻）", "middle", 10, MUT))
    return SVG(700, ya + 40, o, "ロガーの最も混む場面（読み出しの接続中に、記録の間隔 1 分の測定と、ボタンの操作が重なる）の処理時間の予算。時間割は、優先度の高い処理が低い処理に割り込む動き方で描いた。")
F["e02_cpu"] = _f02_cpu()


# =====================================================================
# 6 節: 代案の比較（重み付けの点数）
# =====================================================================
_F02_TR_W = [35, 20, 20, 15, 10]
_F02_TR = [  # (観点, [(A の評点, 事実), (B …), (C …)])
    ("費用（SR-C02）", [(5, ["1 台 40 円"]), (1, ["1 台 650 円"]), (5, ["0 円"])]),
    ("ソフトウェアの手間", [(2, ["4 KiB ごとの消去を", "管理する"]), (5, ["バイトごとに", "上書きできる"]), (3, ["消去を管理する"])]),
    ("電池が抜けたときの強さ", [(2, ["消去・書き込みの途中", "で抜けると壊れうる"]), (4, ["書き込みは", "µs で終わる"]), (2, ["書き込みの途中で", "抜けると壊れうる"])]),
    ("手に入れやすさ", [(5, ["作る会社が多い"]), (3, ["作る会社が少ない"]), (5, ["マイコンと同じ"])]),
    ("電力（SR-W02）", [(4, ["眠り 0.5 µA"]), (5, ["眠り 0.1 µA"]), (5, ["増えない"])]),
]


def _f02_trade():
    o = []
    xc = [14, 176, 236, 386, 536, 686]
    heads = [("観点（関係する要求）", None), ("重み", None), ("A 外付けの", "NOR フラッシュ"), ("B 外付けの", "FRAM"), ("C マイコンの内蔵の", "フラッシュの空き")]
    for j, (h1, h2) in enumerate(heads):
        c = INK if j < 2 else (GRN if j == 2 else (INK if j == 3 else MUT))
        o.append(_f02_cell(xc[j], 6, xc[j + 1] - xc[j], 38, [h1, h2] if h2 else [h1], c, SCR, LIN, 9.5, True))
    # 必須の条件
    y = 44
    o.append(_f02_cell(xc[0], y, xc[1] - xc[0], 32, ["必須: 記録の記憶", "410.6 KiB 以上（SR-F04）"], SIG, soft(SIG), LIN, 9.5, True))
    o.append(_f02_cell(xc[1], y, xc[2] - xc[1], 32, "—", MUT, soft(SIG), LIN, 9.5))
    for j, (txt, ok) in enumerate((("512 KiB", True), ("512 KiB", True), ("空き 280 KB", False))):
        x = xc[2 + j]
        o.append(_f02_cell(x, y, xc[3 + j] - x, 32, "", INK, soft(SIG), LIN))
        o.append(T(x + 14, y + 20, txt, "start", 10, INK if ok else ALI, True))
        o.append(_f02_check(x + 124, y + 16, ok))
    y += 32
    for i, (crit, cells) in enumerate(_F02_TR):
        h = 44
        o.append(_f02_cell(xc[0], y, xc[1] - xc[0], h, crit, INK, "none", LIN, 9.5, True, "start"))
        o.append(_f02_cell(xc[1], y, xc[2] - xc[1], h, "", INK, "none", LIN))
        o.append(T(xc[1] + 8, y + 26, "%d" % _F02_TR_W[i], "start", 10.5, PUR, True))
        o.append(RECT(xc[1] + 30, y + 17, _F02_TR_W[i] * 0.7, 12, 2, soft(PUR), PUR, 1.0))
        for j, (sc, fact) in enumerate(cells):
            x = xc[2 + j]
            o.append(_f02_cell(x, y, xc[3 + j] - x, h, "", INK, "none", LIN))
            c = GRN if sc >= 4 else (ALI if sc <= 2 else MUT)
            for m in range(5):
                o.append(RECT(x + 8 + m * 11, y + 7, 9, 9, 1.5, c if m < sc else "none", c, 1.0))
            o.append(T(x + 66, y + 15, "%d" % sc, "start", 9.5, c, True))
            o.append(_f02_lines(x + 8, y + 29 if len(fact) == 1 else y + 27, fact, "start", 9.5, INK, lh=12))
        y += h
    # 点数
    sc = []
    for j in range(3):
        sc.append(sum(_F02_TR_W[i] * _F02_TR[i][1][j][0] for i in range(5)))
    o.append(_f02_cell(xc[0], y, xc[1] - xc[0], 40, ["点数", "（重み × 評点の和）"], INK, SCR, LIN, 9.5, True))
    o.append(_f02_cell(xc[1], y, xc[2] - xc[1], 40, "計 100", PUR, SCR, LIN, 9.5, True))
    for j in range(3):
        x = xc[2 + j]
        w = xc[3 + j] - x
        o.append(_f02_cell(x, y, w, 40, "", INK, SCR, LIN))
        c = GRN if j == 0 else (INK if j == 1 else MUT)
        o.append(RECT(x + 8, y + 22, (w - 16) * sc[j] / 500.0, 10, 2, soft(c), c, 1.0))
        o.append(T(x + 8, y + 16, "%d 点" % sc[j], "start", 10.5, c, True))
        if j == 0:
            o.append(T(x + w - 8, y + 16, "選ぶ", "end", 10, GRN, True))
        if j == 2:
            o.append(T(x + w - 8, y + 16, "外した", "end", 10, ALI, True))
    o.append(RECT(xc[2] + 1, 7, xc[3] - xc[2] - 2, y + 40 - 8, 4, "none", GRN, 2.2))
    o.append(RECT(xc[4], 44 + 32, xc[5] - xc[4], y - 44 - 32, 0, MSOFT, "none", 0, op=0.9))
    yend = y + 40
    o.append(T(14, yend + 16, "評点は 1〜5（5 が最も良い。緑は 4 以上、赤は 2 以下）", "start", 9.5, MUT))
    return SVG(700, yend + 24, o, "記録を保存する部品の代案の比較（費用・電流・重みは例の値。重みの合計は 100）。")
F["e02_trade"] = _f02_trade()


# =====================================================================
# 6 節: モジュールの約束と、書きすぎの悪い例
# =====================================================================
def _f02_contract():
    o = []
    o.append(T(14, 16, "(a) モジュールの約束", "start", 11.5, INK, True))
    o.append(RECT(14, 62, 138, 58, 8, soft(PUR), PUR, 1.4))
    o.append(T(83, 86, "測定タスク", "middle", 11, PUR, True))
    o.append(T(83, 103, "（呼ぶ側）", "middle", 9.5, MUT))
    o.append(RECT(486, 30, 200, 120, 8, soft(PUR), PUR, 1.4))
    o.append(T(586, 52, "記録のモジュール", "middle", 11, PUR, True))
    o.append(T(586, 68, "（DS-S02）", "middle", 9.5, MUT, False, True))
    o.append(_f02_lines(498, 92, ["資源: RAM 300 B", "CPU の最悪実行時間 0.4 ms", "戻るまで最悪 46 ms（消去の分）"], "start", 9.5, INK, lh=15))
    o.append(ARR(152, 80, 486, 80, c=INK, lw=1.6))
    o.append(T(319, 74, "rec_append(r)", "middle", 10.5, INK, True, True, halo=True))
    o.append(ARR(486, 104, 152, 104, c=INK, lw=1.4, dash="5 3"))
    o.append(T(319, 120, "REC_OK・REC_FULL・REC_ERR_FLASH", "middle", 9.5, INK, False, True, halo=True))
    o.append(RECT(170, 4, 298, 56, 6, soft(SIG), SIG, 1.1))
    o.append(T(180, 20, "事前条件（呼ぶ側が守る）", "start", 9.5, SIG, True))
    o.append(_f02_lines(186, 34, ["rec_init が成功している・呼ぶのは測定タスクだけ", "割り込みの処理の中から呼ばない"], "start", 9.5, INK, lh=13))
    o.append(RECT(170, 128, 298, 56, 6, soft(GRN), GRN, 1.1))
    o.append(T(180, 144, "事後条件（REC_OK で戻ったら成り立つ）", "start", 9.5, GRN, True))
    o.append(_f02_lines(186, 158, ["その 1 件は、電池を外しても失われない", "件数が 1 増える（上書きのときは変わらない）"], "start", 9.5, INK, lh=13))
    o.append(W(14, 196, 686, 196, c=LIN, lw=0.8))
    # (b) 書き方の比較
    y0 = 204
    o.append(T(14, y0 + 16, "(b) 詳細設計書の書き方", "start", 11.5, INK, True))
    o.append(_f02_page(14, y0 + 26, 326, 150, ALI))
    o.append(T(26, y0 + 46, "悪い例: 手順をコードのように書く", "start", 10, ALI, True))
    bad = ["1. i に 0 を入れる", "2. buf[i] に r の i バイト目を入れる", "3. i に 1 を足し、8 未満なら 2. へ", "4. spi_write(addr, buf, 8) を呼ぶ", "5. addr に 8 を足す"]
    o.append(_f02_lines(30, y0 + 64, bad, "start", 9.5, INK, lh=14))
    o.append(T(26, y0 + 146, "コードと同じ手順を写している", "start", 9.5, ALI))
    o.append(T(26, y0 + 160, "なぜ読み返すのか、いつ消去するのかが無い", "start", 9.5, ALI))
    o.append(_f02_page(360, y0 + 26, 326, 150, GRN))
    o.append(T(372, y0 + 46, "良い例: 約束と理由を書く", "start", 10, GRN, True))
    good = [("書いた後に読み返し、同じときだけ REC_OK を返す", INK), ("（理由: 書けなかったら書き直し、記録を失わない。SR-F03）", MUT),
            ("セクタの最後の件を書いたら、次のセクタを先に消す", INK), ("（理由: 書く前に消去が要る。45 ms は 5 節の予算に入れた）", MUT),
            ("書き込みの位置は RAM に持ち、起動のときに求め直す", INK)]
    for i, (s, c) in enumerate(good):
        o.append(T(376, y0 + 64 + i * 14, s, "start", 9.5, c))
    o.append(T(372, y0 + 146, "コードから読み取れない約束と理由", "start", 9.5, GRN))
    o.append(T(372, y0 + 160, "手順はコードとそのコメントに任せる", "start", 9.5, GRN))
    return SVG(700, y0 + 184, o, "記録のモジュールの約束（上）と、詳細設計書の書き方の悪い例と良い例（下）。値は例の値。")
F["e02_contract"] = _f02_contract()
