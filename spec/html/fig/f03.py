# -*- coding: utf-8 -*-
# 03 章 実例 システム仕様書（温湿度ロガー LG-SYS-001 版 1.0）の図

# ---- 本文と同じ値（例の値） ----
_F03_CAP = 52560          # SR-F04 の件数
_F03_UP, _F03_LO = 8.0, 2.0   # SR-F10 の初期値 [°C]

# =====================================================================
# 図の部品
# =====================================================================
def _f03_person(x, y, c=GLD, s=1.0):
    """人の印（(x, y) は足もと）。"""
    return (CIRC(x, y - 30 * s, 7 * s, c=c, lw=1.4, fill=soft(c))
            + PATH("M%g,%g Q%g,%g %g,%g Q%g,%g %g,%g Z" % (x - 12 * s, y, x - 12 * s, y - 20 * s, x, y - 20 * s, x + 12 * s, y - 20 * s, x + 12 * s, y), c=c, lw=1.4, fill=soft(c)))


def _f03_phone(x, y, c=GLD, s=1.0):
    """スマートフォンの印（(x, y) は中心）。"""
    return (RECT(x - 10 * s, y - 17 * s, 20 * s, 34 * s, 4, SCR, c, 1.4)
            + RECT(x - 7 * s, y - 13 * s, 14 * s, 22 * s, 1.5, soft(c), "none", 0)
            + D(x, y + 12.5 * s, c, 1.5))


def _f03_logger(x, y, led=None, s=1.0):
    """ロガーの印（(x, y) は中心）。led は点いている LED の色（None なら消えている）。"""
    o = [RECT(x - 24 * s, y - 15 * s, 48 * s, 30 * s, 6, SSOFT, SIG, 1.5)]
    o.append(CIRC(x + 12 * s, y - 4 * s, 4 * s, c=led or MUT, lw=1.2, fill=led or SCR))
    o.append(CIRC(x - 11 * s, y + 3 * s, 5 * s, c=SIG, lw=1.2, fill=PAN))
    return "".join(o)


def _f03_coin(x, y, c=GLD, r=10):
    """コイン形の電池の印。"""
    return CIRC(x, y, r, c=c, lw=1.4, fill=soft(c)) + CIRC(x, y, r * 0.62, c=c, lw=0.9) + W(x - 3, y, x + 3, y, c=c, lw=1.3) + W(x, y - 3, x, y + 3, c=c, lw=1.3)


def _f03_carton(x, y, w, h):
    """段ボールの箱（(x, y) は左上）。"""
    return (RECT(x, y, w, h, 2, MSOFT, MUT, 1.3) + W(x, y, x + w * 0.18, y - 9, x + w * 0.82, y - 9, x + w, y, c=MUT, lw=1.2)
            + W(x + w / 2, y, x + w / 2, y + h * 0.35, c=MUT, lw=1, dash="3 2"))


def _f03_flash(x, y, c, w=4.0, h=12):
    """LED の 1 回の点灯（(x, y) は点灯の始まりの、帯の上の端）。"""
    return RECT(x, y, w, h, 1, c, c, 0.8)


def _f03_lines(x, y, lines, a="start", sz=10, c=INK, b=False, lh=None):
    lh = lh or sz * 1.45
    return "".join(T(x, y + i * lh, l, a, sz, c, b) for i, l in enumerate(lines))


# =====================================================================
# 1 節: 仕様書の構成
# =====================================================================
def _f03_toc():
    o = []
    o.append(T(14, 20, "LG-SYS-001 温湿度ロガー システム仕様書 版 1.0", "start", 12, INK, True))
    rows = [
        ("1", "文書の情報と目的", "表 1-1〜1-5", ["版・改訂履歴・目的と範囲・記述の約束", "ロガーに固有の言葉・参照する文書"], None),
        ("2", "システムの概要と境界", "図 2-1・2-2、表 2-1・2-2", ["使われ方と利用者（管理者・作業者）", "ロガーの内と外の境目と、6 つのやり取り"], None),
        ("3", "動作モードと操作", "図 3-1〜3-5、表 3-1〜3-6", ["ユースケースとシナリオ・2 つの状態遷移表", "LED の 7 つの表示と、重なったときの決まり"], None),
        ("4", "機能の要求", "図 4-1、表 4-1〜4-6", ["機能の要求 20 件（理由と検証の方法を付ける）"], [("SR-F", 13), ("SR-U", 4), ("SR-I", 3)]),
        ("5", "性能・電源・環境・信頼性の要求", "図 5-1〜5-3、表 5-1〜5-5", ["機能以外の要求 21 件"], [("SR-P", 6), ("SR-W", 3), ("SR-E", 4), ("SR-R", 4), ("SR-S", 2), ("SR-C", 2)]),
        ("6", "検証の方法", "表 6-1", ["41 件の要求の検証の方法と、試験の番号", "ST-001〜ST-041（要求 1 件に 1 つ）"], None),
    ]
    y0, rh = 34, 48
    o.append(RECT(14, y0, 572, rh * 6 + 4, 8, PAN, LIN, 1.2))
    for k, (num, name, refs, what, chips) in enumerate(rows):
        y = y0 + 2 + k * rh
        c = GRN if num == "6" else SIG
        if k:
            o.append(W(22, y, 578, y, c=LIN, lw=0.8))
        o.append(CIRC(36, y + 22, 11, c=c, lw=1.4, fill=soft(c)))
        o.append(T(36, y + 26, num, "middle", 11.5, c, True))
        o.append(T(56, y + 20, name, "start", 11, INK, True))
        o.append(T(56, y + 37, refs, "start", 9.5, MUT))
        o.append(T(318, y + 20, what[0], "start", 10, INK))
        if len(what) > 1:
            o.append(T(318, y + 37, what[1], "start", 10, INK))
        if chips:
            xx = 318
            for lab, n in chips:
                s_, w_ = CHIP(xx, y + 37, "%s %d" % (lab, n), SIG, 9.5, 4)
                o.append(s_)
                xx += w_ + 5
    # 右の括弧: 前提（1〜3）・要求（4・5）・確かめ方（6）
    def brace(ya, yb, lab, sub, c):
        o.append(W(596, ya + 4, 602, ya + 4, 602, yb - 4, 596, yb - 4, c=c, lw=1.6))
        o.append(T(610, (ya + yb) / 2 - 2, lab, "start", 11, c, True))
        if sub:
            o.append(T(610, (ya + yb) / 2 + 13, sub, "start", 9.5, MUT))
    b0 = y0 + 2
    brace(b0, b0 + 3 * rh, "前提", "（1〜3）", INK)
    brace(b0 + 3 * rh, b0 + 5 * rh, "要求", "41 件", SIG)
    brace(b0 + 5 * rh, b0 + 6 * rh, "確かめ方", None, GRN)
    # 矢印: 要求は前提の用語と表を使う／確かめ方は要求の全部を確かめる
    o.append(ARR(672, b0 + 3 * rh + 14, 672, b0 + 3 * rh - 14, c=SIG, lw=1.4, head=6))
    o.append(T(686, b0 + 3 * rh + 4, "使う", "end", 9.5, SIG, True, halo=True))
    o.append(ARR(672, b0 + 5 * rh + 12, 672, b0 + 5 * rh - 14, c=GRN, lw=1.4, head=6))
    o.append(T(686, b0 + 5 * rh + 2, "確かめる", "end", 9.5, GRN, True, halo=True))
    return SVG(700, y0 + rh * 6 + 14, o, "仕様書 LG-SYS-001 版 1.0 の構成（番号は仕様書の中の番号で、この章の 1〜6 節に当たる。右の括弧は、各部分の役割）。")
F["e03_toc"] = _f03_toc()


# =====================================================================
# 1 節: 書くことと、任せること
# =====================================================================
def _f03_scope():
    o = []
    xl, wl, xr, wr = 14, 300, 360, 230
    o.append(T(xl, 20, "この仕様書に書く（外から見える「何を」）", "start", 11, SIG, True))
    o.append(T(xr, 20, "書かない（「どう」作る・試す）", "start", 11, PUR, True))
    o.append(T(686, 20, "任せる文書", "end", 11, MUT, True))
    rows = [
        ("SR-P06", ["短押しから 10 秒以内に、", "アプリが接続を始められる"], ["受付中は 100 ms ごとに", "アドバタイズする（電波で知らせる）"], "LG-DES-001", PUR),
        ("SR-F04", ["52 560 件以上の記録を", "保存できる"], ["SPI のフラッシュ 4 Mbit に、", "1 件 8 バイトで書く"], "LG-DES-001", PUR),
        ("SR-W02", ["使い方の条件で、新しい電池で", "1 年以上記録を続けられる"], ["スリープの電流 2.0 µA。", "状態ごとの電流の予算"], "LG-DES-001", PUR),
        ("SR-I03", ["データの形式は", "LG-ICD-001 に従う"], ["記録 1 件のバイトの並びと、", "やり取りの手順"], "LG-ICD-001", SIG),
        ("表 6-1", ["ST ごとに、確かめることと", "合格の基準"], ["試験の手順・機材・", "記録の用紙"], "LG-TST-001", GRN),
    ]
    y0, rh = 32, 54
    for k, (rid, left, right, doc, dc) in enumerate(rows):
        y = y0 + k * rh
        o.append(RECT(xl, y, wl, rh - 10, 6, SSOFT, SIG, 1.2))
        s_, w_ = CHIP(xl + 8, y + 18, rid, SIG, 9.5, 4)
        o.append(s_)
        o.append(T(xl + 16 + w_, y + 18, left[0], "start", 10, INK))
        o.append(T(xl + 16 + w_, y + 34, left[1], "start", 10, INK))
        o.append(ARR(xl + wl + 4, y + (rh - 10) / 2, xr - 4, y + (rh - 10) / 2, c=MUT, lw=1.3, head=6))
        rc = PUR if dc == PUR else (GRN if dc == GRN else SIG)
        o.append(RECT(xr, y, wr, rh - 10, 6, soft(rc), rc, 1.2, dash="4 3"))
        o.append(T(xr + 10, y + 18, right[0], "start", 10, INK))
        o.append(T(xr + 10, y + 34, right[1], "start", 10, INK))
        s2, w2 = CHIP(686, y + 26, doc, dc, 9.5, 4, "end")
        o.append(s2)
    yb = y0 + 5 * rh + 8
    o.append(T(xl, yb, "右の列は、要求を満たす作り方・試し方の 1 つである。右の列を変えても、左の列は変わらない。", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "この仕様書が決めることと、ほかの文書に任せることの例（右の列の値は、04 章の設計書の例の値）。")
F["e03_scope"] = _f03_scope()


# =====================================================================
# 2 節: 使われ方
# =====================================================================
def _f03_usage():
    o = []
    xs = [14, 188, 362, 536]
    pw, py, ph = 150, 30, 214
    tit = [("① 出荷の前", "管理者"), ("② 輸送・保管", "最長 1 年"), ("③ 受け取り", "作業者"), ("④ 電池の交換", "管理者")]
    for k, x in enumerate(xs):
        o.append(RECT(x, py, pw, ph, 8, PAN, LIN, 1.2))
        o.append(T(x + 10, py + 19, tit[k][0], "start", 11, INK, True))
        o.append(T(x + pw - 10, py + 19, tit[k][1], "end", 9.5, MUT))
        if k < 3:
            o.append(ARR(x + pw + 3, py + 70, x + pw + 21, py + 70, c=MUT, lw=1.5, head=6))
    # ① 管理者が設定して開始
    x = xs[0]
    o.append(_f03_person(x + 30, py + 96))
    o.append(_f03_phone(x + 72, py + 70))
    o.append(_f03_logger(x + 118, py + 72, GRN))
    o.append(W(x + 82, py + 66, x + 94, py + 70, c=GLD, lw=1, dash="2 2"))
    o.append(_f03_lines(x + 10, py + 124, ["アプリで設定する", "（PIN を入れる）", "長押しで記録を開始", "→ 緑を 3 回"], sz=9.5, c=INK))
    # ② 箱の中で記録。温度が上限を超える
    x = xs[1]
    o.append(_f03_carton(x + 16, py + 52, 54, 34))
    o.append(_f03_logger(x + 43, py + 72, ALI, 0.62))
    p = Plot(x + 82, py + 40, 58, 46, (0, 10), (0, 12))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1))
    o.append(W(p.x, p.Y(8), p.x + p.w, p.Y(8), c=ALI, lw=1, dash="3 2"))
    pts = [(0, 5), (2, 5.2), (3.5, 6), (4.5, 9.4), (5.5, 9.8), (6.5, 6.5), (8, 5.3), (10, 5.1)]
    o.append(p.line(pts, c=SIG, lw=1.6))
    o.append(T(p.x + p.w + 1, p.Y(8) - 3, "8.0", "end", 9, ALI, halo=True))
    o.append(_f03_lines(x + 10, py + 124, ["10 分ごとに記録", "8.0 °C より高い記録に", "警報の印", "→ 赤を 2 回、10 秒ごと"], sz=9.5, c=INK))
    # ③ 作業者が読み出して確認
    x = xs[2]
    o.append(_f03_person(x + 30, py + 96))
    o.append(_f03_logger(x + 78, py + 76, GRN))
    o.append(_f03_phone(x + 124, py + 70))
    o.append(W(x + 104, py + 72, x + 112, py + 70, c=GLD, lw=1, dash="2 2"))
    o.append(_f03_lines(x + 10, py + 124, ["短押し → 2 分以内に接続", "差分の読み出し", "（52 560 件でも 60 秒以内）", "警報を見て確認の操作"], sz=9.5, c=INK))
    # ④ 電池を替える
    x = xs[3]
    o.append(_f03_person(x + 30, py + 96))
    o.append(_f03_logger(x + 84, py + 66, ALI))
    o.append(_f03_coin(x + 124, py + 96))
    o.append(ARR(x + 118, py + 86, x + 104, py + 78, c=GLD, lw=1.2, head=5))
    o.append(_f03_lines(x + 10, py + 124, ["電池少の表示（赤・緑）", "工具なしで電池を替える", "記録と設定は残る", "→ 長押しで記録を再開"], sz=9.5, c=INK))
    return SVG(700, py + ph + 10, o, "図 2-1 ロガーの使われ方（1 回の出荷の例。表示と時間は 3〜5 の要求のとおり）。")
F["e03_usage"] = _f03_usage()


# =====================================================================
# 2 節: コンテキスト図
# =====================================================================
def _f03_context():
    o = []
    bx, by, bw, bh = 250, 122, 200, 92
    o.append(RECT(bx, by, bw, bh, 10, SSOFT, SIG, 2.2))
    o.append(T(bx + bw / 2, by + 34, "ロガー", "middle", 13, SIG, True))
    o.append(T(bx + bw / 2, by + 54, "この仕様書の対象", "middle", 10, MUT))
    o.append(T(bx + bw / 2, by + 70, "（システムの境界）", "middle", 10, MUT))
    # 外の相手
    o.append(_f03_person(80, 78))
    o.append(T(80, 96, "管理者・作業者", "middle", 10.5, GLD, True))
    o.append(_f03_phone(620, 58))
    o.append(T(620, 92, "アプリ", "middle", 10.5, GLD, True))
    o.append(T(620, 107, "（スマートフォン）", "middle", 9.5, MUT))
    o.append(RECT(30, 252, 108, 34, 8, GOSOFT, GLD, 1.3))
    o.append(T(84, 274, "周囲の空気", "middle", 10.5, GLD, True))
    o.append(_f03_coin(620, 262, GLD, 13))
    o.append(T(620, 294, "電池 CR2032", "middle", 10.5, GLD, True))
    o.append(RECT(262, 286, 176, 34, 8, GOSOFT, GLD, 1.3))
    o.append(T(350, 308, "置かれる環境", "middle", 10.5, GLD, True))
    # ① ② 利用者
    o.append(ARR(112, 70, bx - 2, by + 14, c=GLD, lw=1.6))
    o.append(T(178, 82, "① ボタンの操作", "middle", 10, INK, True, halo=True))
    o.append(ARR(bx - 2, by + 36, 112, 92, c=SIG, lw=1.6))
    o.append(T(150, 128, "② LED の表示", "middle", 10, INK, True, halo=True))
    # ③ アプリ
    o.append(DARR(bx + bw + 2, by + 16, 596, 66, c=SIG, lw=1.6))
    o.append(T(512, 84, "③ 記録・設定・時刻・", "middle", 10, INK, True, halo=True))
    o.append(T(512, 98, "操作の指示", "middle", 10, INK, True, halo=True))
    o.append(T(530, 130, "BLE。形式は LG-ICD-001", "middle", 9.5, SIG, False, halo=True))
    o.append(T(686, 140, "アプリの中（画面・保存）", "end", 9.5, MUT))
    o.append(T(686, 154, "は対象の外", "end", 9.5, MUT))
    # ④ 周囲の空気
    o.append(ARR(138, 260, bx - 2, by + bh - 16, c=GLD, lw=1.6))
    o.append(T(186, 236, "④ 温度・湿度", "middle", 10, INK, True, halo=True))
    # ⑤ 電池
    o.append(ARR(604, 254, bx + bw + 2, by + bh - 16, c=GLD, lw=1.6))
    o.append(T(548, 232, "⑤ 電力", "middle", 10, INK, True, halo=True))
    # ⑥ 環境
    o.append(ARR(350, 284, 350, by + bh + 2, c=GLD, lw=1.6))
    o.append(T(358, 254, "⑥ 温度・湿度・ほこり・", "start", 10, INK, True, halo=True))
    o.append(T(358, 268, "水・落下の衝撃", "start", 10, INK, True, halo=True))
    return SVG(700, 330, o, "図 2-2 コンテキスト図（矢印の番号は表 2-2 の番号。金色は対象の外）。")
F["e03_context"] = _f03_context()


# =====================================================================
# 3 節: シナリオ（シーケンス図）
# =====================================================================
_F03_LANES_A = [("管理者", GLD), ("ロガー", SIG), ("アプリ", GLD)]
_F03_LANES_W = [("作業者", GLD), ("ロガー", SIG), ("アプリ", GLD)]


def _f03_seq_start():
    msgs = [
        (0, 1, "短押し", {"sub": "SR-U02"}),
        (1, 0, "状態の応答（赤 1 回 = 停止中）", {"c": SIG}),
        ("note", 1, "接続の受付中（2 分）", {"c": SIG}),
        (0, 2, "接続を操作する"),
        (2, 1, "接続（短押しから 10 秒以内）", {"sub": "SR-P06"}),
        (1, 1, "時刻を合わせる（SR-F08）", {"c": SIG}),
        (2, 1, "設定と PIN", {"sub": "間隔・上限・下限・動作（SR-F12・SR-S01）"}),
        (1, 2, "受け付けた", {"c": SIG, "dash": True}),
        ("note", 2, "例外: PIN が違えば\n設定を受け付けない", {"c": ALI}),
        (2, 1, "切断"),
        (0, 1, "長押し（3 秒）", {"sub": "SR-F06"}),
        (1, 0, "開始の応答（緑 3 回）", {"c": SIG, "sub": "SR-U04"}),
        ("note", 1, "記録中: すぐに 1 件目、以後 10 分ごとに記録", {"c": SIG}),
    ]
    return SEQFIG(_F03_LANES_A, msgs, "図 3-1 シナリオ UC-1「記録を始める」（正常の流れと例外。時間は上から下へ進む。矢印の下の ID は、その動きを決める要求）。", w=700, dy=34)
F["e03_seq_start"] = _f03_seq_start()


def _f03_seq_read():
    msgs = [
        ("note", 1, "記録中・警報の表示（赤 2 回、10 秒ごと）", {"c": ALI}),
        (0, 1, "短押し", {"sub": "SR-U02"}),
        (1, 0, "状態の応答（緑 1 回 = 記録中）", {"c": SIG}),
        ("note", 1, "接続の受付中（2 分）\n例外: 2 分以内に接続が無ければ通信なしへ", {"c": SIG}),
        (0, 2, "読み出しを操作する"),
        (2, 1, "接続（短押しから 10 秒以内）", {"sub": "SR-P06"}),
        (1, 1, "時刻を合わせる（SR-F08）", {"c": SIG}),
        (2, 1, "差分の読み出しを求める", {"sub": "SR-F07"}),
        (1, 2, "前回の後の記録", {"c": SIG, "sub": "52 560 件でも 60 秒以内（SR-P05）"}),
        (2, 2, "誤りを調べる（SR-R02）"),
        (2, 0, "警報の印のある記録を示す"),
        (0, 2, "確認の操作", {"sub": "SR-F11"}),
        (2, 1, "確認"),
        (1, 1, "警報の表示を止める", {"c": SIG}),
        (2, 1, "切断"),
    ]
    return SEQFIG(_F03_LANES_W, msgs, "図 3-2 シナリオ UC-3「記録を読み出す」（警報の印のある記録を読み出す例）。", w=700, dy=34)
F["e03_seq_read"] = _f03_seq_read()


def _f03_seq_batt():
    msgs = [
        ("note", 1, "記録中・電池少の表示（赤・緑、10 秒ごと）", {"c": ALI}),
        (0, 1, "電池を外す（工具を使わない）", {"sub": "SR-W03"}),
        ("note", 1, "記録と設定は残る（SR-W03・SR-R01）", {"c": SIG}),
        (0, 1, "新しい電池を入れる"),
        ("note", 1, "停止中・時刻未設定", {"c": SIG}),
        (0, 1, "長押し（3 秒）", {"sub": "SR-F06"}),
        (1, 0, "開始の応答（緑 3 回）", {"c": SIG}),
        ("note", 1, "記録に時刻未設定の印（SR-F09）", {"c": GLD}),
        (0, 1, "短押し"),
        (0, 2, "接続を操作する"),
        (2, 1, "接続", {"sub": "SR-P06"}),
        (1, 1, "時刻を合わせる（SR-F08）", {"c": SIG}),
        ("note", 1, "これより後の記録には印を付けない", {"c": SIG}),
        (2, 1, "切断"),
    ]
    return SEQFIG(_F03_LANES_A, msgs, "図 3-3 シナリオ UC-6「電池を替える」（記録中に電池少になった例）。", w=700, dy=34)
F["e03_seq_batt"] = _f03_seq_batt()


# =====================================================================
# 3 節: 状態遷移図
# =====================================================================
_F03_SM = {"stop": (112, 96), "rec": (282, 96), "dead": (197, 276)}      # 主のモード（デモ w03_device と同じ配置）
_F03_SC = {"none": (446, 96), "adv": (616, 96), "conn": (531, 276)}     # 通信の状態


def _f03_states():
    o = []
    w, h = 96, 40
    o.append(T(14, 18, "(a) 主のモード", "start", 11.5, INK, True))
    o.append(T(366, 18, "(b) 通信の状態", "start", 11.5, INK, True))
    o.append(W(352, 30, 352, 330, c=LIN, lw=0.8))
    (xs, ys), (xr, yr), (xd, yd) = _F03_SM["stop"], _F03_SM["rec"], _F03_SM["dead"]
    o.append(STATE(xs, ys, w, h, "停止中", SIG))
    o.append(STATE(xr, yr, w, h, "記録中", SIG))
    o.append(STATE(xd, yd, w, h, "電池切れ", ALI))
    # 開始（電池を入れる）: 上から
    o.append(D(xs - 30, 40, INK, 5))
    o.append(ARR(xs - 30, 46, xs - 30, ys - h / 2 - 1, c=INK, lw=1.4, head=6))
    o.append(T(xs - 22, 44, "電池を入れる", "start", 9.5, INK, True))
    # 停止中 → 記録中（上の弧）、記録中 → 停止中（下の弧）
    o.append(CARR(xs + w / 2, ys - 8, xr - w / 2, yr - 8, 0.22, SIG, 1.6))
    o.append(T((xs + xr) / 2, ys - 34, "長押し・アプリから開始", "middle", 9.5, SIG, True, halo=True))
    o.append(T((xs + xr) / 2, ys - 21, "/ すぐに 1 件記録", "middle", 9.5, SIG, False, halo=True))
    o.append(CARR(xr - w / 2, yr + 8, xs + w / 2, ys + 8, 0.22, SIG, 1.6))
    o.append(T((xs + xr) / 2, ys + 33, "長押し・アプリから停止", "middle", 9.5, SIG, True, halo=True))
    o.append(T((xs + xr) / 2, ys + 46, "容量に達した", "middle", 9.5, SIG, False, halo=True))
    o.append(T((xs + xr) / 2, ys + 59, "（記録を止める）", "middle", 9.5, SIG, False, halo=True))
    # 記録中の自分への遷移（右）
    o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (xr + w / 2, yr - 10, xr + w / 2 + 40, yr - 26, xr + w / 2 + 40, yr + 26, xr + w / 2 + 6, yr + 12), c=SIG, lw=1.4))
    o.append(PL([(xr + w / 2 + 1, yr + 9), (xr + w / 2 + 10, yr + 8), (xr + w / 2 + 6, yr + 16)], c=SIG, lw=1, fill=SIG))
    o.append(T(xr + w / 2 + 2, yr - 30, "記録の時刻", "start", 9.5, SIG, True))
    o.append(T(xr + w / 2 + 2, yr + 42, "/ 1 件保存", "start", 9.5, SIG, False))
    # → 電池切れ
    o.append(ARR(xs + 4, ys + h / 2 + 2, xd - 30, yd - h / 2 - 2, c=ALI, lw=1.5))
    o.append(ARR(xr - 4, yr + h / 2 + 2, xd + 30, yd - h / 2 - 2, c=ALI, lw=1.5))
    o.append(T(18, 196, "電池の残りで", "start", 9.5, ALI, True))
    o.append(T(18, 209, "記録を続けられない", "start", 9.5, ALI, True))
    o.append(T(270, 196, "（記録中から", "start", 9.5, ALI))
    o.append(T(270, 209, "も同じ）", "start", 9.5, ALI))
    # 電池切れ → 停止中（左を回る）
    xl = 30
    o.append(W(xd - w / 2, yd, xl, yd, xl, ys + 8, c=GLD, lw=1.5))
    o.append(ARR(xl, ys + 8, xs - w / 2 - 1, ys + 8, c=GLD, lw=1.5, head=6))
    o.append(T(xl + 6, yd + 30, "電池を替える / 時刻未設定にする", "start", 9.5, GLD, True))
    o.append(T(xl + 6, yd + 43, "（どの主のモードからも停止中へ）", "start", 9.5, GLD))
    # ---- (b) 通信の状態 ----
    (xn, yn), (xa, ya), (xc, yc) = _F03_SC["none"], _F03_SC["adv"], _F03_SC["conn"]
    o.append(STATE(xn, yn, w, h, "通信なし", SIG))
    o.append(STATE(xa, ya, 112, h, "接続の受付中", SIG))
    o.append(STATE(xc, yc, w, h, "接続中", SIG))
    o.append(D(xn, 40, INK, 5))
    o.append(ARR(xn, 46, xn, yn - h / 2 - 1, c=INK, lw=1.4, head=6))
    o.append(T(xn + 8, 44, "電池を入れる", "start", 9.5, INK, True))
    o.append(CARR(xn + w / 2, yn - 8, xa - 56, ya - 8, 0.22, SIG, 1.6))
    o.append(T((xn + xa) / 2 - 4, yn - 34, "短押し", "middle", 9.5, SIG, True, halo=True))
    o.append(T((xn + xa) / 2 - 4, yn - 21, "/ 2 分を数え始める", "middle", 9.5, SIG, False, halo=True))
    o.append(CARR(xa - 56, ya + 8, xn + w / 2, yn + 8, 0.22, SIG, 1.6))
    o.append(T((xn + xa) / 2 - 4, yn + 33, "2 分たつ", "middle", 9.5, SIG, True, halo=True))
    o.append(SELF(xa + 24, ya - h / 2, None, SIG, 16))
    o.append(T(xa + 24, ya - 64, "短押し / 数え直す", "middle", 9.5, SIG, True))
    o.append(ARR(xa - 6, ya + h / 2 + 2, xc + 24, yc - h / 2 - 2, c=SIG, lw=1.6))
    o.append(T(xa + 6, 176, "アプリが接続する", "start", 9.5, SIG, True))
    o.append(T(xa + 6, 189, "/ 時刻を合わせる", "start", 9.5, SIG, False))
    o.append(ARR(xc - 24, yc - h / 2 - 2, xn + 6, yn + h / 2 + 2, c=SIG, lw=1.6))
    o.append(T(xn - 2, 196, "接続が", "end", 9.5, SIG, True))
    o.append(T(xn - 2, 209, "切れる", "end", 9.5, SIG, True))
    o.append(T(366, 318, "主のモードが電池切れになったとき・電池を替えたときは、", "start", 9.5, ALI))
    o.append(T(366, 331, "どの状態からも通信なしへ", "start", 9.5, ALI))
    return SVG(700, 342, o, "図 3-4 状態遷移図（(a) と (b) は、それぞれ 1 つずつの状態を同時にとる。矢印の文字は「出来事 / 動作」。全部の組み合わせは表 3-3・表 3-4）。")
F["e03_states"] = _f03_states()


# =====================================================================
# 3 節: ボタンと LED のタイミング
# =====================================================================
def _f03_led():
    o = []
    # (a) 押す長さ
    o.append(T(14, 18, "(a) ボタンの押し方（押し始めからの時間）", "start", 11.5, INK, True))
    x0, x1 = 170, 650
    X = lambda t: x0 + (x1 - x0) * t / 4.0
    yz = 30
    for a, b, lab, c in ((0, 1, "短押し", SIG), (1, 3, "どちらでもない（応えない）", MUT), (3, 4, "長押し", SIG)):
        o.append(RECT(X(a), yz, X(b) - X(a), 18, 2, soft(c), c, 1))
        o.append(T((X(a) + X(b)) / 2, yz + 13, lab, "middle", 9.5, c, True))
    ex = [(0.5, "0.5 秒押して離す", "離したときに状態の応答", 0.5, SIG), (1.5, "1.5 秒押して離す", "何もしない", None, MUT), (3.5, "3.5 秒押して離す", "3 秒の時点で開始・停止の応答", 3.0, SIG)]
    for k, (d, lab, res, tr, c) in enumerate(ex):
        y = 66 + k * 20
        o.append(T(14, y + 4, lab, "start", 9.5, INK))
        o.append(RECT(X(0), y - 5, X(d) - X(0), 10, 2, GOSOFT, GLD, 1))
        if tr is not None:
            o.append(D(X(tr), y, SIG, 4.2))
            o.append(T(X(tr) + 8, y + 4, res, "start", 9.5, c, True, halo=True))
        else:
            o.append(T(X(d) + 8, y + 4, res, "start", 9.5, c, True, halo=True))
    for t in range(5):
        o.append(W(X(t), 120, X(t), 124, c=MUT, lw=1))
        o.append(T(X(t), 136, "%d 秒" % t if t else "0", "middle", 9.5, MUT))
        o.append(W(X(t), yz + 18, X(t), 116, c=GRD, lw=1))
    o.append(W(X(0), 120, X(4), 120, c=MUT, lw=1))
    # (b) 表示の形
    yb = 166
    o.append(W(14, yb - 12, 686, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 6, "(b) 表示の形（1 回の点灯 20 ms・間隔 0.3 秒）", "start", 11.5, INK, True))
    bx0, bx1 = 170, 390
    BX = lambda t: bx0 + (bx1 - bx0) * t / 1.0
    rows = [("開始の応答", "GGG", "長押しで開始したとき 1 度"), ("停止の応答", "RRR", "長押しで止めたとき 1 度"),
            ("状態の応答", "G", "短押しで離したとき 1 度（停止中は赤）"), ("警報の表示", "RR", "10 秒ごと（確認の操作まで）"),
            ("電池少の表示", "RG", "10 秒ごと"), ("通信中の表示", "G", "2 秒ごと（接続の受付中・接続中）")]
    for k, (nm, pat, when) in enumerate(rows):
        y = yb + 22 + k * 22
        o.append(T(14, y + 10, nm, "start", 10, INK, True))
        o.append(W(bx0, y + 13, bx1, y + 13, c=LIN, lw=0.8))
        for j, ch in enumerate(pat):
            o.append(_f03_flash(BX(0.3 * j), y + 1, GRN if ch == "G" else ALI, 4.4, 12))
        o.append(T(410, y + 10, when, "start", 9.5, MUT))
    ya = yb + 22 + 6 * 22 + 4
    for t in (0, 0.3, 0.6, 0.9):
        o.append(W(BX(t), ya, BX(t), ya + 4, c=MUT, lw=1))
        o.append(T(BX(t), ya + 15, ("%g 秒" % t) if t else "0", "middle", 9.5, MUT))
    o.append(W(bx0, ya, bx1, ya, c=MUT, lw=1))
    o.append(LEGEND(560, yb + 6, [(GRN, "緑"), (ALI, "赤")], 9.5, 14))
    # (c) 重なりの例
    yc = ya + 44
    o.append(W(14, yc - 14, 686, yc - 14, c=LIN, lw=0.8))
    o.append(T(14, yc + 4, "(c) 重なりの例（記録中で、警報の印と電池少がある。0 秒に短押し）", "start", 11.5, INK, True))
    cx0, cx1 = 40, 676
    CX = lambda t: cx0 + (cx1 - cx0) * t / 31.0
    yy = yc + 34
    o.append(W(cx0, yy + 14, cx1, yy + 14, c=LIN, lw=0.8))
    o.append(_f03_flash(CX(0), yy, GRN))
    for t in range(2, 31, 2):
        if t % 10 == 0:
            o.append(RECT(CX(t) - 1, yy - 1, 6, 14, 1, "none", MUT, 1, dash="2 2"))
            continue
        o.append(_f03_flash(CX(t), yy, GRN, 3.4, 12))
    for t, pat in ((10, "RR"), (20, "RG"), (30, "RR")):
        for j, ch in enumerate(pat):
            o.append(_f03_flash(CX(t + 0.3 * j) + (3 if j else 0), yy, GRN if ch == "G" else ALI, 3.4, 12))
    o.append(T(CX(0), yy - 8, "状態の応答", "start", 9.5, GRN, True))
    o.append(T(CX(5), yy - 8, "通信中（2 秒ごと）", "middle", 9.5, GRN))
    o.append(T(CX(10), yy - 8, "警報", "middle", 9.5, ALI, True))
    o.append(T(CX(20), yy - 8, "電池少", "middle", 9.5, ALI, True))
    o.append(T(CX(30), yy - 8, "警報", "middle", 9.5, ALI, True))
    o.append(T(CX(15), yy + 48, "破線の枠: 重なったので省いた通信中の表示（優先順位 5 < 3・4）", "middle", 9.5, MUT))
    o.append(T(CX(25), yy - 22, "警報と電池少は 10 秒ごとに交互", "middle", 9.5, ALI))
    for t in (0, 10, 20, 30):
        o.append(W(CX(t), yy + 14, CX(t), yy + 18, c=MUT, lw=1))
        o.append(T(CX(t), yy + 28 if t not in (10, 20) else yy + 28, "%d 秒" % t if t else "0", "middle", 9.5, MUT))
    return SVG(700, yy + 58, o, "図 3-5 ボタンの押し方と LED の表示のタイミング（表 3-5・表 3-6 のとおり。(c) の点灯は形が見えるように太く描いた）。")
F["e03_led"] = _f03_led()


# =====================================================================
# 4 節: 記録 1 件の中身と、印が付く場面
# =====================================================================
def _f03_record():
    o = []
    o.append(T(14, 18, "(a) 記録 1 件の中身", "start", 11.5, INK, True))
    y = 28
    cells = [(14, 176, "時刻", "年・月・日・時・分・秒"), (190, 140, "温度", "0.1 °C きざみ"), (330, 120, "湿度", "1 %RH きざみ")]
    for x, w, t, s in cells:
        o.append(RECT(x, y, w, 46, 4, SSOFT, SIG, 1.3))
        o.append(T(x + w / 2, y + 19, t, "middle", 11, SIG, True))
        o.append(T(x + w / 2, y + 36, s, "middle", 9.5, MUT))
    o.append(RECT(450, y, 236, 46, 4, SSOFT, SIG, 1.3))
    o.append(T(568, y + 19, "状態の印（4 つ）", "middle", 11, SIG, True))
    xx = 458
    for lab, c in (("警報", ALI), ("時刻未設定", GLD), ("電池少", ALI), ("測定異常", MUT)):
        s_, w_ = CHIP(xx, y + 38, lab, c, 9, 3)
        o.append(s_)
        xx += w_ + 4
    o.append(T(686, y + 62, "形式（バイトの並び）は LG-ICD-001 で決める", "end", 9.5, MUT))
    # (b) 記録の並びの例
    yb = 110
    o.append(W(14, yb - 12, 686, yb - 12, c=LIN, lw=0.8))
    o.append(T(14, yb + 6, "(b) 記録の並びの例（記録の間隔 10 分・警報の上限と下限は初期値）", "start", 11.5, INK, True))
    x0, cw = 168, 43
    CXc = lambda k: x0 + cw * (k - 0.5)       # k 番目（1 から）の記録の中心
    temps = [5.1, 5.0, 5.2, 5.0, 7.6, 8.0, 8.4, 8.9, 7.8, None, 5.4, 5.2]
    marks = {"警報の印": ([7, 8], ALI), "時刻未設定の印": ([1, 2, 3], GLD), "電池少の印": ([11, 12], ALI), "測定異常の印": ([10], MUT)}
    # 出来事
    ev = [(0.5, "電池を入れて長押し", yb + 26, "start"), (3.5, "接続（時刻を合わせる）", yb + 42, "middle"),
          (9.5, "読み出し（全部）・確認の操作", yb + 26, "middle"), (10.5, "電池少と判定", yb + 42, "start")]
    ytop, ybot = yb + 50, yb + 236
    for pos, lab, yl, an in ev:
        xe = x0 + cw * pos - cw / 2 + (0 if pos != 0.5 else 0)
        xe = x0 + cw * (pos - 0.5) if pos != 0.5 else x0 - 2
        if pos == 10.5:
            xe = x0 + cw * 10
        if pos == 3.5:
            xe = x0 + cw * 3
        if pos == 9.5:
            xe = x0 + cw * 9
        o.append(W(xe, yl + 4, xe, ybot, c=FNT, lw=1, dash="3 3"))
        o.append(T(xe + (4 if an == "start" else 0), yl, lab, an, 9.5, INK, True, halo=True))
    rl = [("番号", yb + 66), ("温度 [°C]", yb + 88)] + [(k, yb + 110 + 20 * i) for i, k in enumerate(marks)] + [("警報の表示", yb + 196), ("読み出し", yb + 222)]
    for lab, yy in rl:
        o.append(T(14, yy + 4, lab, "start", 10, INK, True))
    for k in range(1, 13):
        cx = CXc(k)
        o.append(T(cx, yb + 70, str(k), "middle", 10, MUT, True))
        tv = temps[k - 1]
        hot = tv is not None and (tv > _F03_UP or tv < _F03_LO)
        o.append(T(cx, yb + 92, "—" if tv is None else "%.1f" % tv, "middle", 10, ALI if hot else INK, hot))
    for i, (k, (ids, c)) in enumerate(marks.items()):
        yy = yb + 110 + 20 * i
        o.append(W(x0, yy + 8, x0 + cw * 12, yy + 8, c=LIN, lw=0.6))
        for j in ids:
            o.append(RECT(CXc(j) - 14, yy - 5, 28, 12, 3, soft(c), c, 1.1))
            o.append(T(CXc(j), yy + 4, "印", "middle", 9, c, True))
    o.append(T(CXc(6), yb + 106, "8.0 ちょうどは印なし", "middle", 9, MUT, halo=True))
    yy = yb + 196
    o.append(RECT(CXc(7) - 14, yy - 6, x0 + cw * 9 - (CXc(7) - 14), 12, 3, ASOFT, ALI, 1.1))
    o.append(T(x0 + cw * 9 + 6, yy + 4, "確認の操作で止まる", "start", 9.5, ALI, True))
    yy = yb + 222
    o.append(W(CXc(1) - 14, yy - 6, CXc(1) - 14, yy, CXc(9) + 14, yy, CXc(9) + 14, yy - 6, c=GRN, lw=1.4))
    o.append(T((CXc(1) + CXc(9)) / 2, yy + 14, "1 回目（全部の読み出し）: 1〜9", "middle", 9.5, GRN, True))
    o.append(W(CXc(10) - 14, yy - 6, CXc(10) - 14, yy, CXc(12) + 14, yy, CXc(12) + 14, yy - 6, c=GRN, lw=1.4))
    o.append(T((CXc(10) + CXc(12)) / 2, yy + 14, "2 回目（差分）: 10〜12", "middle", 9.5, GRN, True))
    return SVG(700, yb + 248, o, "図 4-1 記録 1 件の中身と、状態の印が付く場面の例（温度は例の値。2 回目の読み出しは差分の読み出し）。")
F["e03_record"] = _f03_record()


# =====================================================================
# 5 節: 時刻の 2 つの要求
# =====================================================================
def _f03_time():
    o = []
    o.append(T(14, 18, "(a) SR-P03: 予定の時刻からのずれ", "start", 11.5, INK, True))
    o.append(T(360, 18, "(b) SR-P04: 時刻を合わせてからのずれ", "start", 11.5, INK, True))
    # (a) 10 分ごとの予定の時刻と、1 つの拡大
    x0, x1, y = 30, 330, 56
    X = lambda m: x0 + (x1 - x0) * m / 20.0
    o.append(W(x0, y, x1, y, c=MUT, lw=1.2))
    for m, lab in ((0, "10:00"), (10, "10:10"), (20, "10:20")):
        o.append(W(X(m), y - 6, X(m), y + 6, c=SIG, lw=2))
        o.append(T(X(m), y + 20, lab, "middle", 9.5, SIG, True))
    o.append(T(x1, y - 12, "ロガーの時計で予定した測定の時刻", "end", 9.5, MUT))
    zx0, zx1, zy = 50, 310, 150
    Z = lambda s: zx0 + (zx1 - zx0) * (s + 3) / 6.0
    o.append(W(X(10), y + 26, Z(-3), zy - 26, c=FNT, lw=1, dash="3 3"))
    o.append(W(X(10), y + 26, Z(3), zy - 26, c=FNT, lw=1, dash="3 3"))
    o.append(RECT(Z(-2), zy - 22, Z(2) - Z(-2), 28, 3, GSOFT, GRN, 1.2))
    o.append(T(Z(0), zy - 30, "記録の時刻はこの中（±2 秒）", "middle", 9.5, GRN, True, halo=True))
    o.append(W(zx0, zy + 6, zx1, zy + 6, c=MUT, lw=1.2))
    for s in range(-3, 4):
        o.append(W(Z(s), zy + 6, Z(s), zy + 10, c=MUT, lw=1))
        o.append(T(Z(s), zy + 22, ("%+d 秒" % s).replace("-", "−") if s else "10:10", "middle", 9.5, MUT))
    o.append(W(Z(0), zy - 22, Z(0), zy + 6, c=SIG, lw=2))
    o.append(D(Z(0.8), zy - 8, INK, 4.2))
    o.append(T(Z(0.8) + 7, zy - 4, "例 +0.8 秒", "start", 9.5, INK, True, halo=True))
    o.append(T(30, zy + 48, "測る量: ロガーの時計の上での、測定の時刻のずれ", "start", 9.5, MUT))
    # (b) 30 日のずれ
    p = Plot(424, 36, 250, 108, (0, 30), (-90, 90))
    o.append(p.axes(xt=[0, 7, 14, 21, 28], yt=[-60, 0, 60], yfmt=lambda v: ("%+d" % v).replace("-", "−") if v else "0"))
    o.append(T(p.x + p.w / 2, p.y + p.h + 31, "時刻を合わせてからの日数 [日]", "middle", 10, MUT))
    o.append(T(p.x - 40, p.y + p.h / 2, "ずれ [秒]", "middle", 10, MUT, rot=-90))
    o.append(p.line([(0, 0), (30, 45)], c=SIG, lw=2))
    saw = []
    for k in range(5):
        a = 7 * k
        b = min(30, 7 * k + 7)
        saw += [(a, 0), (b, 1.5 * (b - a))]
    o.append(p.line(saw, c=PUR, lw=1.6, dash="5 3"))
    o.append(W(p.X(30), p.Y(-60), p.X(30), p.Y(60), c=GRN, lw=3))
    o.append(W(p.X(30) - 5, p.Y(60), p.X(30) + 5, p.Y(60), c=GRN, lw=2))
    o.append(W(p.X(30) - 5, p.Y(-60), p.X(30) + 5, p.Y(-60), c=GRN, lw=2))
    o.append(T(p.X(30) - 6, p.Y(-60) + 16, "30 日後に ±60 秒以内", "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(2), p.Y(52), "例: 合わせ直さない", "start", 9.5, SIG, True, halo=True))
    o.append(T(p.X(8), p.Y(-22), "例: 1 週間に 1 回の読み出しで", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(8), p.Y(-22) + 13, "合わせ直す（SR-F08）", "start", 9.5, PUR, True, halo=True))
    o.append(T(360, zy + 48, "測る量: 正しい時刻からの、ロガーの時計のずれ（25 °C）", "start", 9.5, MUT))
    return SVG(700, zy + 58, o, "図 5-1 時刻の 2 つの要求（(b) の線は例のずれ方。SR-P04 が決めるのは 30 日後の値である）。")
F["e03_time"] = _f03_time()


# =====================================================================
# 5 節: 使い方の条件の 1 週間（SR-W02）
# =====================================================================
def _f03_week():
    o = []
    x0, x1 = 150, 680
    X = lambda d: x0 + (x1 - x0) * d / 7.0
    rows = [("周囲の温度", 34), ("測定", 62), ("警報の表示", 90), ("短押し", 118), ("読み出し", 146)]
    for lab, y in rows:
        o.append(T(14, y + 4, lab, "start", 10, INK, True))
    y = rows[0][1]
    o.append(W(x0, y, x1, y, c=GLD, lw=2))
    o.append(T((x0 + x1) / 2, y - 6, "25 °C（初期値の上限 8.0 °C より高い）", "middle", 9.5, GLD, True, halo=True))
    y = rows[1][1]
    o.append(RECT(x0, y - 8, x1 - x0, 14, 2, SSOFT, SIG, 1))
    o.append(T((x0 + x1) / 2, y + 3, "10 分ごと（1 週間に 1 008 回）", "middle", 9.5, SIG, True))
    y = rows[2][1]
    o.append(RECT(x0, y - 8, x1 - x0, 14, 2, ASOFT, ALI, 1))
    o.append(T((x0 + x1) / 2, y + 3, "赤を 2 回、10 秒ごと（1 週間に 60 480 回）", "middle", 9.5, ALI, True))
    y = rows[3][1]
    for d in range(7):
        xx = X(d + 9 / 24.0)
        o.append(PL([(xx, y - 7), (xx - 5, y + 3), (xx + 5, y + 3)], c=GLD, lw=1, fill=GLD))
    o.append(T(X(0.42) + 10, y + 3, "1 日に 1 回（例 9:00）。そのたびに接続の受付 2 分", "start", 9.5, GLD, True, halo=True))
    y = rows[4][1]
    xr = X(6 + 9 / 24.0)
    o.append(D(xr, y, PUR, 4.6))
    o.append(T(xr - 8, y + 4, "1 週間に 1 回（接続 1 分）", "end", 9.5, PUR, True))
    ya = 166
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for d in range(8):
        o.append(W(X(d), ya, X(d), ya + 4, c=MUT, lw=1))
        o.append(T(X(d), ya + 16, ("%d 日" % d) if d else "0", "middle", 9.5, MUT))
    # 拡大: 7 日目の 9:00〜9:05
    zt = 206
    Zx0, Zx1 = 150, 680
    Zs = lambda s: Zx0 + (Zx1 - Zx0) * s / 300.0
    o.append(W(xr, ya + 22, Zx0, zt - 4, c=FNT, lw=1, dash="3 3"))
    o.append(W(xr, ya + 22, Zx1, zt - 4, c=FNT, lw=1, dash="3 3"))
    o.append(RECT(14, zt, 672, 150, 6, "none", LIN, 1))
    o.append(T(22, zt + 16, "拡大: 7 日目の 9:00〜9:05", "start", 10, INK, True))
    zr = [("ボタン", zt + 40), ("通信の状態", zt + 62), ("LED", zt + 86), ("測定", zt + 110)]
    for lab, y in zr:
        o.append(T(22, y + 4, lab, "start", 10, INK, True))
    y = zr[0][1]
    o.append(PL([(Zs(0), y - 7), (Zs(0) - 5, y + 3), (Zs(0) + 5, y + 3)], c=GLD, lw=1, fill=GLD))
    o.append(T(Zs(0) + 9, y + 4, "短押し（状態の応答: 緑 1 回）", "start", 9.5, GLD, True))
    y = zr[1][1]
    o.append(RECT(Zs(0), y - 7, Zs(20) - Zs(0), 14, 2, SSOFT, SIG, 1))
    o.append(RECT(Zs(20), y - 7, Zs(80) - Zs(20), 14, 2, PSOFT, PUR, 1))
    o.append(T((Zs(20) + Zs(80)) / 2, y + 4, "接続中（読み出し 1 分）", "middle", 9.5, PUR, True))
    o.append(T(Zs(0) + 2, y - 11, "受付中", "start", 9, SIG, True))
    o.append(T(Zs(84), y + 4, "通信なし", "start", 9.5, MUT))
    y = zr[2][1]
    o.append(_f03_flash(Zs(0), y - 6, GRN, 2.4, 12))
    for s in range(2, 80, 2):
        if s % 10:
            o.append(_f03_flash(Zs(s), y - 6, GRN, 1.4, 8))
    for s in range(10, 301, 10):
        o.append(_f03_flash(Zs(s), y - 6, ALI, 2.4, 12))
    o.append(T(678, zt + 16, "赤: 警報の表示（10 秒ごと）　緑: 通信中の表示（2 秒ごと。警報と重なる回は省く）", "end", 9.5, MUT))
    y = zr[3][1]
    o.append(W(Zs(240), y - 8, Zs(240), y + 6, c=SIG, lw=2.4))
    o.append(T(Zs(240) + 6, y + 4, "記録（例 9:04）", "start", 9.5, SIG, True))
    yz = zt + 128
    o.append(W(Zx0, yz, Zx1, yz, c=MUT, lw=1))
    for s, lab in ((0, "9:00"), (60, "9:01"), (120, "9:02"), (180, "9:03"), (240, "9:04"), (300, "9:05")):
        o.append(W(Zs(s), yz, Zs(s), yz + 4, c=MUT, lw=1))
        o.append(T(Zs(s), yz + 16, lab, "middle", 9.5, MUT))
    return SVG(700, zt + 158, o, "図 5-2 SR-W02 の使い方の条件の 1 週間（下は 7 日目の 9:00〜9:05 の拡大。短押しと読み出しの時刻は例）。")
F["e03_week"] = _f03_week()


# =====================================================================
# 5 節: 温度と湿度の範囲ごとの要求
# =====================================================================
def _f03_ranges():
    o = []
    o.append(T(14, 18, "(a) 温度", "start", 11.5, INK, True))
    x0, x1 = 170, 680
    X = lambda t: x0 + (x1 - x0) * (t + 40) / 120.0
    bars = [("保存（電池なし）", "SR-E02", -30, 70, GLD), ("動作", "SR-E01", -20, 60, GLD), ("警報の上限・下限の設定", "SR-F10", -20, 60, SIG)]
    for k, (lab, rid, a, b, c) in enumerate(bars):
        y = 34 + k * 26
        o.append(T(14, y + 12, lab, "start", 10, INK, True))
        o.append(T(160, y + 12, rid, "end", 9.5, c, True))
        o.append(RECT(X(a), y, X(b) - X(a), 16, 3, soft(c), c, 1.2))
        o.append(T(X(a) - 4, y + 12, ("%+d" % a).replace("-", "−"), "end", 9.5, c))
        o.append(T(X(b) + 4, y + 12, ("%+d" % b).replace("-", "−"), "start", 9.5, c))
    yk = 34 + 2 * 26
    o.append(RECT(X(2), yk - 3, X(8) - X(2), 22, 2, SIG, SIG, 1))
    o.append(T(X(8) + 6, yk + 30, "初期値 2.0〜8.0", "start", 9.5, SIG, True, halo=True))
    # 誤差の許容差（SR-P01）
    p = Plot(x0, 128, x1 - x0, 70, (-40, 80), (-1.5, 1.5))
    o.append(T(14, p.y + 30, "温度の誤差の許容差", "start", 10, INK, True))
    o.append(T(160, p.y + 46, "SR-P01", "end", 9.5, SIG, True))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1))
    for a, b, e in ((-20, 0, 1.0), (0, 40, 0.5), (40, 60, 1.0)):
        o.append(RECT(p.X(a), p.Y(e), p.X(b) - p.X(a), p.Y(-e) - p.Y(e), 0, SSOFT, SIG, 1.2))
        o.append(T((p.X(a) + p.X(b)) / 2, p.Y(e) - 4, "±%.1f °C" % e, "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(-30), p.Y(0) + 16, "要求なし", "middle", 9.5, MUT))
    o.append(T(p.X(70), p.Y(0) + 16, "要求なし", "middle", 9.5, MUT))
    o.append(T(p.X(0), p.Y(-1.0) + 15, "0 °C と 40 °C は ±0.5 °C の側", "middle", 9.5, MUT))
    ya = 222
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1))
    for t in range(-40, 81, 20):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, ("%+d" % t).replace("-", "−") if t else "0", "middle", 9.5, MUT))
        o.append(W(X(t), 30, X(t), ya, c=GRD, lw=1))
    o.append(T(x1, ya + 32, "温度 [°C]", "end", 10, MUT))
    # (b) 湿度
    yb = 268
    o.append(W(14, yb - 6, 686, yb - 6, c=LIN, lw=0.8))
    o.append(T(14, yb + 12, "(b) 湿度", "start", 11.5, INK, True))
    H = lambda v: x0 + (x1 - x0) * v / 100.0
    y = yb + 24
    o.append(T(14, y + 12, "動作（結露しない）", "start", 10, INK, True))
    o.append(T(160, y + 12, "SR-E01", "end", 9.5, GLD, True))
    o.append(RECT(H(0), y, H(95) - H(0), 16, 3, GOSOFT, GLD, 1.2))
    o.append(T(H(95) + 4, y + 12, "95", "start", 9.5, GLD))
    y = yb + 50
    o.append(T(14, y + 12, "湿度の誤差", "start", 10, INK, True))
    o.append(T(160, y + 12, "SR-P02", "end", 9.5, SIG, True))
    o.append(RECT(H(20), y, H(80) - H(20), 16, 3, SSOFT, SIG, 1.2))
    o.append(T(H(50), y + 12, "±3 %RH（25 °C のとき）", "middle", 9.5, SIG, True))
    o.append(T(H(10), y + 12, "要求なし", "middle", 9.5, MUT))
    o.append(T(H(90), y + 12, "要求なし", "middle", 9.5, MUT))
    yh = yb + 80
    o.append(W(x0, yh, x1, yh, c=MUT, lw=1))
    for v in range(0, 101, 20):
        o.append(W(H(v), yh, H(v), yh + 4, c=MUT, lw=1))
        o.append(T(H(v), yh + 16, str(v), "middle", 9.5, MUT))
    o.append(T(x1, yh + 32, "相対湿度 [%RH]", "end", 10, MUT))
    return SVG(700, yh + 40, o, "図 5-3 温度と湿度の範囲ごとの要求（金色は置かれる環境の範囲、青はロガーの働きの範囲）。")
F["e03_ranges"] = _f03_ranges()


# =====================================================================
# 6 節: 検証の方法の内訳と、選んだ理由
# =====================================================================
_F03_MCNT = [("F", "機能", (12, 1, 0, 0)), ("U", "操作と表示", (4, 0, 0, 0)), ("I", "外部インタフェース", (2, 0, 1, 0)),
             ("P", "性能", (6, 0, 0, 0)), ("W", "電源", (0, 1, 1, 1)), ("E", "環境", (4, 0, 0, 0)),
             ("R", "信頼性", (2, 2, 0, 0)), ("S", "安全とセキュリティ", (1, 0, 1, 0)), ("C", "制約", (0, 1, 1, 0))]


def _f03_methods():
    o = []
    cols = [("T", "試験"), ("A", "解析"), ("I", "検査"), ("D", "実演"), ("計", "")]
    cx0, cw, rh, y0 = 176, 44, 24, 30
    for j, (a, b) in enumerate(cols):
        o.append(T(cx0 + cw * j + cw / 2, y0 + 4, a, "middle", 11, GRN if j < 4 else INK, True))
        if b:
            o.append(T(cx0 + cw * j + cw / 2, y0 + 18, b, "middle", 9.5, MUT))
    tot = [0, 0, 0, 0]
    for i, (k, nm, cnt) in enumerate(_F03_MCNT):
        y = y0 + 28 + i * rh
        o.append(T(14, y + 15, "SR-%s" % k, "start", 10, SIG, True))
        o.append(T(56, y + 15, nm, "start", 10, INK))
        for j, n in enumerate(cnt):
            tot[j] += n
            o.append(RECT(cx0 + cw * j + 2, y + 2, cw - 4, rh - 4, 3, GSOFT if n else SCR, GRN if n else LIN, 1))
            if n:
                o.append(T(cx0 + cw * j + cw / 2, y + 16, str(n), "middle", 10.5, GRN, True))
        o.append(T(cx0 + cw * 4 + cw / 2, y + 16, str(sum(cnt)), "middle", 10.5, INK, True))
    y = y0 + 28 + 9 * rh
    o.append(W(14, y + 2, cx0 + cw * 5, y + 2, c=MUT, lw=1))
    o.append(T(14, y + 20, "計", "start", 10.5, INK, True))
    for j, n in enumerate(tot + [sum(tot)]):
        o.append(T(cx0 + cw * j + cw / 2, y + 20, str(n), "middle", 11, GRN if j < 4 else INK, True))
    # 右: 選んだ理由
    rx = 420
    blocks = [("T 試験 31 件", ["数値と条件があり、測って合否を決められる"]),
              ("A 解析 5 件", ["結果が出るまで待てない: SR-W02（1 年）・", "SR-R01（10 年）・SR-R04（5 年）。計算で示す:", "SR-F13（14 日）・SR-C02（費用）"]),
              ("I 検査 4 件", ["見るか、資料と記録を調べれば分かる:", "SR-W01・SR-C01・SR-I01・SR-S02"]),
              ("D 実演 1 件", ["利用者の操作を見せて確かめる: SR-W03"])]
    yy = y0 + 4
    for t, lines in blocks:
        o.append(T(rx, yy, t, "start", 11, GRN, True))
        for k, l in enumerate(lines):
            o.append(T(rx, yy + 16 + 14 * k, l, "start", 9.5, INK))
        yy += 30 + 14 * len(lines)
    return SVG(700, y + 32, o, "検証の方法の内訳（区分ごとの件数）と、方法を選んだ理由（方法の定義は 01 章 4 節）。")
F["e03_methods"] = _f03_methods()


# =====================================================================
# 6 節: 要求から試験へ（SR-F10 → ST-010）
# =====================================================================
def _f03_st_example():
    o = []
    o.append(T(14, 18, "要求 SR-F10 の部品", "start", 11.5, INK, True))
    parts = [("条件", "記録の温度が警報の上限より高いか、警報の下限より低いとき", GLD),
             ("動作", "その記録に警報の印を付け、LED で知らせる（警報の表示）", SIG),
             ("数値", "上限 8.0 °C・下限 2.0 °C（初期値）。設定は −20.0〜+60.0 °C・0.1 °C きざみ", SIG),
             ("境目", "上限・下限に等しいときは印を付けない（表 1-4 の定義）", ALI)]
    for k, (a, b, c) in enumerate(parts):
        y = 30 + k * 22
        s_, w_ = CHIP(14, y + 13, a, c, 9.5, 5)
        o.append(s_)
        o.append(T(64, y + 13, b, "start", 10, INK))
    # 試験の点（2 つの境目の拡大）
    yt = 140
    o.append(W(14, yt - 14, 686, yt - 14, c=LIN, lw=0.8))
    o.append(T(14, yt + 4, "試験の点（記録の温度。境目の前後を 0.1 °C きざみで）", "start", 11.5, INK, True))
    segs = [(40, 320, 1.7, 2.3, _F03_LO, [1.9, 2.0, 2.1]), (380, 660, 7.7, 8.3, _F03_UP, [7.9, 8.0, 8.1])]
    ya = yt + 60
    for xa, xb, ta, tb, edge, pts in segs:
        Xs = lambda t, xa=xa, xb=xb, ta=ta, tb=tb: xa + (xb - xa) * (t - ta) / (tb - ta)
        lo = edge == _F03_LO
        o.append(RECT(Xs(ta), ya - 14, Xs(edge) - Xs(ta), 14, 0, ASOFT if lo else GSOFT, "none", 0))
        o.append(RECT(Xs(edge), ya - 14, Xs(tb) - Xs(edge), 14, 0, GSOFT if lo else ASOFT, "none", 0))
        o.append(W(Xs(ta), ya, Xs(tb), ya, c=MUT, lw=1.2))
        for i in range(7):
            t = ta + 0.1 * i
            o.append(W(Xs(t), ya, Xs(t), ya + 4, c=MUT, lw=1))
            o.append(T(Xs(t), ya + 16, "%.1f" % t, "middle", 9.5, MUT))
        o.append(W(Xs(edge), ya - 22, Xs(edge), ya, c=INK, lw=1.4, dash="3 2"))
        o.append(T(Xs(edge), ya - 28, ("下限 %.1f °C" if lo else "上限 %.1f °C") % edge, "middle", 9.5, INK, True, halo=True))
        for t in pts:
            alarm = t < _F03_LO or t > _F03_UP
            c = ALI if alarm else GRN
            o.append(D(Xs(t), ya, c, 5.2))
            o.append(T(Xs(t), ya + 34, "印あり" if alarm else "印なし", "middle", 9.5, c, True))
    o.append(T(350, ya + 4, "…", "middle", 12, MUT, True))
    o.append(T(350, ya - 28, "（間は印なし）", "middle", 9.5, MUT))
    # 刺激・観測・判定
    yb = ya + 58
    o.append(W(14, yb - 10, 686, yb - 10, c=LIN, lw=0.8))
    boxes = [("刺激", ["恒温槽で、記録の温度が", "境目の前後になるようにする"], GLD),
             ("観測", ["読み出した記録の温度と", "警報の印、LED の警報の表示"], SIG),
             ("判定", ["どの記録も「印がある」⇔「温度 > 8.0", "または温度 < 2.0」。印の後は警報の表示"], GRN)]
    bw = [190, 196, 252]
    xx = 14
    for k, (t, lines, c) in enumerate(boxes):
        o.append(RECT(xx, yb, bw[k], 56, 6, soft(c), c, 1.3))
        o.append(T(xx + 10, yb + 18, t, "start", 11, c, True))
        for j, l in enumerate(lines):
            o.append(T(xx + 10, yb + 34 + 14 * j, l, "start", 9.5, INK))
        if k < 2:
            o.append(ARR(xx + bw[k] + 2, yb + 28, xx + bw[k] + 14, yb + 28, c=MUT, lw=1.4, head=5))
        xx += bw[k] + 16
    o.append(T(14, yb + 76, "設定の範囲の点: −20.0 °C と +60.0 °C は受け付け、−20.1 °C と +60.1 °C は受け付けない", "start", 9.5, MUT))
    return SVG(700, yb + 86, o, "要求 SR-F10 から試験 ST-010 へ（試験の点は例。手順と機材は LG-TST-001 で決める）。")
F["e03_st_example"] = _f03_st_example()
