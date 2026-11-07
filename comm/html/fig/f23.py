# -*- coding: utf-8 -*-
# 23 章 通信コードを検証する の図

# ---- 1 節: 層を分けて、ホストで動かす ----
def _f23_layers():
    o = []
    xl, xr, w = 20, 380, 300
    o.append(T(xl + w / 2, 20, "機器の中（ターゲット）", "middle", 12, INK, True))
    o.append(T(xr + w / 2, 20, "PC の上（ホストでのテスト）", "middle", 12, INK, True))
    # 上の段
    o.append(BOX(xl, 32, w, 40, "アプリケーション", None, PUR, PSOFT, PUR, sz=11.5))
    o.append(BOX(xr, 32, w, 40, "テスト", "入力を与え、結果を期待と比べる（assert）", GRN, GSOFT, GRN, sz=11.5, ssz=9.5))
    # 部品（同じコード）
    for x in (xl, xr):
        o.append(RECT(x, 84, w, 92, 8, SSOFT, SIG, 1.6))
        o.append(T(x + w / 2, 102, "部品（同じソースをコンパイルする）", "middle", 11, SIG, True))
        o.append(T(x + 12, 124, "解析器: at_feed・mqtt_rx_feed・chunk_feed", "start", 9.5, INK, False))
        o.append(T(x + 12, 142, "状態機械: fsm_handle・saw_send・reconn_fail", "start", 9.5, INK, False))
        o.append(T(x + 12, 160, "バッファと計算: リングバッファ・CRC", "start", 9.5, INK, False))
    o.append(DARR(xl + w + 6, 130, xr - 6, 130, c=SIG, lw=1.6))
    o.append(T((xl + w + xr) / 2, 122, "同じ", "middle", 10, SIG, True))
    # 境目
    yb = 192
    for x in (xl, xr):
        o.append(W(x, yb, x + w, yb, c=ALI, lw=1.5, dash="6 4"))
    o.append(T(xl + w / 2, yb - 4, "", "middle", 9, ALI))
    o.append(T(350, yb + 4, "境目", "middle", 10, ALI, True, halo=True))
    o.append(T(xl + 4, yb + 18, "仮に置いた関数: tick_now()・link_send_data()・uart_hw_read()・flash_write()", "start", 9.5, ALI))
    # 下の段
    hw = [("タイマ", "ティック"), ("UART・無線", "送受信"), ("フラッシュ", "書き込み")]
    fk = [("偽物の時計", "テストが値を決める"), ("書き留める送信", "台本の受信"), ("模型のフラッシュ", "途中で電源を切る")]
    bw = (w - 16) / 3
    for i, (a, b) in enumerate(hw):
        o.append(BOX(xl + i * (bw + 8), 214, bw, 46, a, b, MUT, MSOFT, INK, sz=10.5, ssz=9))
    for i, (a, b) in enumerate(fk):
        o.append(BOX(xr + i * (bw + 8), 214, bw, 46, a, b, GLD, GOSOFT, INK, sz=10.5, ssz=9))
    o.append(T(xl + w / 2, 280, "本物のハードウェア", "middle", 10, MUT, True))
    o.append(T(xr + w / 2, 280, "差し替えた偽物（依存の差し替え）", "middle", 10, GLD, True))
    return SVG(700, 292, o, "ホストでのテストの層の分け方。解析器・状態機械・バッファのように、入力から出力と次の状態を計算するだけの部品は、機器でも PC でも同じソースをコンパイルして動かせる。ハードウェアに触る関数（これまでの章で「仮に置く関数」としたもの）が境目で、PC の上ではそれを、テストが操作できる偽物に替える。")
F["e23_layers"] = _f23_layers()


def _f23_fakeclock():
    o = []
    x0, x1 = 186, 680
    t0, t1 = -17, 6           # 一周（0）に対する相対の時刻
    X = lambda t: x0 + (t - t0) / (t1 - t0) * (x1 - x0)
    lab = {-16: "0xFFFFFFF0", -8: "0xFFFFFFF8", 0: "0x00000000", 4: "0x00000004"}
    ya = 36
    o.append(T(12, ya + 4, "偽物の時計", "start", 10, MUT))
    o.append(W(x0, ya, x1, ya, c=MUT, lw=1.2))
    for t in range(t0 + 1, t1):
        o.append(W(X(t), ya - 3, X(t), ya + 3, c=FNT, lw=1))
    for t, s in lab.items():
        o.append(W(X(t), ya - 6, X(t), ya + 6, c=MUT, lw=1.3))
        o.append(T(X(t), ya - 10, s, "middle", 9, INK if t != 4 else TEA, t == 4, True))
    o.append(T(X(0), ya + 18, "一周", "middle", 9, MUT))
    o.append(T(X(4), ya + 18, "期限", "middle", 9, TEA, True))
    rows = [("正しい比較", "(int32_t)(now − deadline) ≥ 0", "all", True),
            ("誤った比較", "now ≥ deadline", "all", False),
            ("最初の版のテスト", "期限の前後 2 か所だけで呼ぶ", "two", None)]
    for i, (nm, sub, mode, ok) in enumerate(rows):
        y = 84 + i * 62
        o.append(T(12, y - 2, nm, "start", 10.5, INK, True))
        o.append(T(12, y + 13, sub, "start", 8.5, MUT, False, True))
        o.append(W(x0, y + 4, x1, y + 4, c=GRD, lw=1))
        if mode == "all":
            for t in range(-16, 5):
                if ok:
                    c = GRN if t == 4 else SIG
                    o.append(D(X(t), y + 4, c, 4 if t == 4 else 3))
                else:
                    if t == -16:
                        o.append(D(X(t), y + 4, ALI, 4.5))
                    else:
                        o.append(D(X(t), y + 4, FNT, 2.2))
            if ok:
                o.append(T(X(-16), y + 22, "各ティックで saw_poll: 送り直さない", "start", 9.5, SIG))
                o.append(T(X(4) + 8, y - 6, "送り直す", "start", 9.5, GRN, True))
            else:
                o.append(T(X(-16) + 8, y - 6, "送った直後に送り直す（期限の前）", "start", 9.5, ALI, True))
                o.append(T(X(-16) + 8, y + 22, "assert で止まる → 誤りに気づく", "start", 9.5, ALI, True))
        else:
            for t in (3, 4):
                o.append(D(X(t), y + 4, PUR, 4))
            o.append(T(X(3) - 8, y + 8, "1 ティック前と期限ちょうどだけ", "end", 9.5, PUR))
            o.append(T(X(-16), y + 26, "誤りが起きる区間（一周の前）で一度も呼ばないので、誤った比較でも通ってしまう", "start", 9.5, ALI))
    return SVG(700, 84 + 2 * 62 + 40, o, "偽物の時計を一周の直前（0xFFFFFFF0）から進め、点の時刻に saw_poll を呼ぶテスト。期限は一周の後の 0x00000004。誤った比較 now ≥ deadline は、一周の前の時刻で期限を過ぎたと判断するので、送った直後に送り直し、テストはそこで止まる。期限の前後 2 か所だけで呼ぶテストは、その区間を試さないので誤りを見逃す。")
F["e23_fakeclock"] = _f23_fakeclock()


# ---- 2 節: 故障注入 ----
def _f23_faults():
    o = []
    names = [("喪失", "届かない"), ("遅延", "延びる・揺れる"), ("重複", "2 回届く"), ("順番の入れ替え", "後のものが先に"), ("破損", "ビットが変わる")]
    pw = 136
    for k, (nm, sub) in enumerate(names):
        x = 10 + k * (pw + 2)
        xs, xr = x + 22, x + pw - 22
        o.append(T(x + pw / 2, 18, nm, "middle", 11, ALI if k in (0, 3, 4) else INK, True))
        o.append(T(x + pw / 2, 33, sub, "middle", 9.5, MUT))
        o.append(T(xs, 52, "送", "middle", 9.5, SIG, True))
        o.append(T(xr, 52, "受", "middle", 9.5, GRN, True))
        o.append(W(xs, 58, xs, 196, c=SIG, lw=1.1, dash="3 4"))
        o.append(W(xr, 58, xr, 196, c=GRN, lw=1.1, dash="3 4"))
        if k == 0:
            o.append(ARR(xs, 70, xr, 86, c=INK, lw=1.5, head=6))
            fx, fy = xs + (xr - xs) * 0.6, 112 + 16 * 0.6
            o.append(W(xs, 112, fx, fy, c=ALI, lw=1.5, dash="5 3"))
            o.append(W(fx - 5, fy - 5, fx + 5, fy + 5, c=ALI, lw=2)); o.append(W(fx - 5, fy + 5, fx + 5, fy - 5, c=ALI, lw=2))
            o.append(ARR(xs, 150, xr, 166, c=INK, lw=1.5, head=6))
        elif k == 1:
            o.append(ARR(xs, 70, xr, 86, c=INK, lw=1.5, head=6))
            o.append(ARR(xs, 100, xr, 150, c=TEA, lw=1.6, head=6))
            o.append(ARR(xs, 160, xr, 182, c=INK, lw=1.5, head=6))
            o.append(T(xr - 4, 140, "遅い", "end", 9, TEA, True))
        elif k == 2:
            o.append(ARR(xs, 80, xr, 100, c=INK, lw=1.5, head=6))
            o.append(ARR(xs, 80, xr, 136, c=ALI, lw=1.5, head=6))
            o.append(T(xr - 4, 152, "同じもの", "end", 9, ALI, True))
        elif k == 3:
            o.append(ARR(xs, 72, xr, 168, c=ALI, lw=1.5, head=6))
            o.append(ARR(xs, 104, xr, 128, c=INK, lw=1.5, head=6))
            o.append(T(xs + 4, 70, "1", "start", 9.5, ALI, True, True))
            o.append(T(xs + 4, 102, "2", "start", 9.5, INK, True, True))
            o.append(T(xr - 4, 186, "2 → 1 の順", "end", 9, ALI, True))
        else:
            o.append(ARR(xs, 90, xr, 110, c=INK, lw=1.5, head=6))
            o.append(T((xs + xr) / 2, 84, "41", "middle", 9.5, INK, True, True, halo=True))
            o.append(T(xr - 4, 128, "43", "end", 10, ALI, True, True))
            o.append(T(xr - 4, 142, "b1 が反転", "end", 9, ALI))
    return SVG(700, 204, o, "通信路の 5 つの故障。矢印は送り手（送）から受け手（受）へのメッセージで、下へ行くほど後の時刻。喪失・順番の入れ替え・破損は、受け手が気づかなければ、そのまま上の層に間違いとして渡る。")
F["e23_faults"] = _f23_faults()


_F23_RES = [  # 故障, [(A), (B), (C)] の各値: (正しく, 壊れたまま, 重複, 順番違い, 正しく渡せず, 送った回数)
    ("喪失 10 %",        [(899, 0, 0, 0, 101, 1000), (1000, 0, 0, 0, 0, 1236), (1000, 0, 0, 0, 0, 1236)]),
    ("重複 10 %",        [(1000, 0, 101, 0, 0, 1000), (1000, 0, 0, 0, 0, 1000), (1000, 0, 0, 0, 0, 1000)]),
    ("破損 10 %",        [(901, 99, 0, 0, 99, 1000), (1000, 0, 0, 0, 0, 1233), (1000, 0, 0, 0, 0, 1233)]),
    ("入れ替え 10 %",    [(901, 0, 0, 99, 0, 1000), (932, 0, 56, 13, 55, 1179), (1000, 0, 0, 0, 0, 1225)]),
    ("4 つを 5 % ずつ", [(863, 49, 43, 43, 95, 1000), (961, 0, 36, 3, 36, 1299), (1000, 0, 0, 0, 0, 1328)]),
]

def _f23_results():
    o = []
    cols = ["(A) 素朴な方式", "(B) ストップアンドウェイト + CRC（1 ビットの番号）", "(C) (B) の番号を 16 ビットに"]
    x0, cw, rh = 112, 196, 62
    for j, c in enumerate(cols):
        xx = x0 + j * cw
        lines = ["(A) 素朴な方式", "番号・CRC・ACK なし"] if j == 0 else (["(B) 05 章の方式 + CRC", "番号は 1 ビット"] if j == 1 else ["(C) (B) の番号を", "16 ビットにしたもの"])
        o.append(T(xx + cw / 2, 18, lines[0], "middle", 10.5, INK, True))
        o.append(T(xx + cw / 2, 32, lines[1], "middle", 9.5, MUT))
    for i, (fault, vals) in enumerate(_F23_RES):
        y = 42 + i * rh
        o.append(T(x0 - 8, y + rh / 2 + 4, fault, "end", 10.5, INK, True))
        for j, v in enumerate(vals):
            ok, bad, dup, order, lost, tx = v
            xx = x0 + j * cw
            good = (ok == 1000 and bad == 0 and dup == 0 and order == 0)
            o.append(RECT(xx + 3, y + 3, cw - 6, rh - 6, 5, GSOFT if good else ASOFT, GRN if good else ALI, 1.1))
            o.append(T(xx + 10, y + 21, "正しく渡した %d" % ok, "start", 10, GRN if good else INK, True))
            probs = []
            if bad: probs.append("壊れたまま %d" % bad)
            if dup: probs.append("重複 %d" % dup)
            if order: probs.append("順番違い %d" % order)
            if lost and lost != bad: probs.append("渡せず %d" % lost)
            elif lost: probs.append("渡せず %d" % lost)
            if probs:
                for q in range(0, len(probs), 2):
                    o.append(T(xx + 10, y + 38 + (q // 2) * 14, "・".join(probs[q:q + 2]), "start", 9.5, ALI, True))
            else:
                o.append(T(xx + 10, y + 38, "送った回数 %d" % tx, "start", 9.5, MUT))
    yb = 42 + 5 * rh + 16
    for q, l in enumerate(["1000 個のメッセージを送る試験を、種を変えて 200 回行った平均（四捨五入）。",
                           "遅延はいつも 2〜4、ACK を待つ時間は 20、入れ替えではさらに +50（単位はティック）。",
                           "「4 つ」は喪失・重複・破損・入れ替え。「正しく渡した」は順番どおりに 1 回だけ渡した数。「渡せず」は一度も正しく渡せなかった数。",
                           "「送った回数」は再送を含むデータの送信の数。"]):
        o.append(T(20, yb + q * 14, l, "start", 9.5, MUT))
    return SVG(700, yb + 4 * 14, o, "故障のある通信路の上で、3 つの方式で 1000 個のメッセージを送った結果。緑の枠はすべてを 1 回ずつ正しく渡したもの。(B) は喪失・重複・破損には強いが、入れ替えがあると重複と取りこぼしを起こす。番号を 16 ビットにした (C) は、どの故障でもすべてを正しく渡した。")
F["e23_results"] = _f23_results()


def _f23_reorder():
    o = []
    xs, xr = 180, 470
    y0 = 52
    o.append(RECT(xs - 46, 10, 92, 28, 7, SSOFT, SIG, 1.3)); o.append(T(xs, 29, "送り手", "middle", 11.5, SIG, True))
    o.append(RECT(xr - 46, 10, 92, 28, 7, GSOFT, GRN, 1.3)); o.append(T(xr, 29, "受け手", "middle", 11.5, GRN, True))
    yend = 470
    o.append(W(xs, 38, xs, yend, c=SIG, lw=1.2, dash="3 4"))
    o.append(W(xr, 38, xr, yend, c=GRN, lw=1.2, dash="3 4"))
    def msg(y1, y2, lab, c=INK, b=False):
        o.append(ARR(xs, y1, xr, y2, c=c, lw=1.6, head=7))
        o.append(T((xs + xr) / 2, (y1 + y2) / 2 - 6, lab, "middle", 10, c, b, halo=True))
    def ack(y1, y2, lab):
        o.append(ARR(xr, y1, xs, y2, c=GRN, lw=1.3, head=6, dash="5 3"))
        o.append(T((xs + xr) / 2, (y1 + y2) / 2 - 5, lab, "middle", 9, GRN, False, halo=True))
    def rnote(y, s, c=MUT, b=False):
        o.append(T(xr + 10, y + 4, s, "start", 9.5, c, b))
    # 14 番の最初の写し: 遅れる（入れ替え）
    o.append(ARR(xs, y0, xr, 382, c=PUR, lw=1.8, head=7))
    o.append(T(xs + 24, y0 + 30, "14 番（番号 0）", "start", 10, PUR, True, halo=True))
    o.append(T(xs + 24, y0 + 44, "この写しが遅れる", "start", 9, PUR, False, halo=True))
    o.append(W(xs - 10, y0, xs - 15, y0, xs - 15, y0 + 60, xs - 10, y0 + 60, c=TEA, lw=1.3))
    o.append(T(xs - 20, y0 + 34, "20 ティック待つ", "end", 9.5, TEA))
    msg(y0 + 62, y0 + 78, "再送 14 番（0）")
    rnote(y0 + 78, "14 番を渡す。次は番号 1")
    ack(y0 + 86, y0 + 102, "ACK 0")
    msg(y0 + 112, y0 + 128, "15 番（1）")
    rnote(y0 + 128, "15 番を渡す。次は 0")
    ack(y0 + 136, y0 + 152, "ACK 1")
    msg(y0 + 162, y0 + 178, "16 番（0）")
    rnote(y0 + 178, "16 番を渡す。次は 1")
    ack(y0 + 186, y0 + 202, "ACK 0")
    msg(y0 + 212, y0 + 228, "17 番（1）")
    rnote(y0 + 228, "17 番を渡す。次は 0")
    ack(y0 + 236, y0 + 252, "ACK 1")
    rnote(330, "遅れていた 14 番（番号 0）が届く", PUR, True)
    rnote(346, "待っている番号と同じなので", ALI)
    rnote(362, "18 番として渡す ×", ALI, True)
    msg(y0 + 290, y0 + 352, "18 番（0）")
    rnote(y0 + 354, "番号 0 は済んだので", ALI)
    rnote(y0 + 368, "重複として捨てる ×", ALI, True)
    ack(y0 + 368, y0 + 384, "ACK 0")
    o.append(T(xs - 10, y0 + 392, "18 番は届いたと思う", "end", 9.5, SIG))
    o.append(D(xr, 382, ALI, 4.5))
    return SVG(700, yend + 10, o, "番号が 1 ビットのストップアンドウェイトが、順番の入れ替えで誤る様子（2 節の試験の記録から、種の番号 1 の最初の誤りの前後）。遅れていた 14 番の最初の写しは、受け手が番号 0 を待っている時に届いたので、新しいメッセージ（18 番）として渡された。その後に届いた本物の 18 番は重複として捨てられ、送り手は ACK を受け取るので、18 番は気づかれずに失われる。")
F["e23_reorder"] = _f23_reorder()


# ---- 3 節: ファジング ----
def _f23_funnel():
    o = []
    stages = ["入力の数", "① 印 0xA5 が合う", "② 残りの長さが合う", "③ TLV の長さの検査を通る", "④ 誤りのある所に届く"]
    rnd = [2000000, 7702, 32, 2, 0]
    mut = [200000, 167337, 62069, 42099, 628]
    p = Plot(250, 44, 290, 5 * 40, (1e-7, 1), (0, 5), xlog=True)
    o.append(T(250 + 145, 18, "その段まで届いた入力の割合（対数目盛）", "middle", 10.5, INK, True))
    for v, s in ((1e-6, "0.0001 %"), (1e-4, "0.01 %"), (1e-2, "1 %"), (1, "100 %")):
        o.append(W(p.X(v), 36, p.X(v), 44 + 5 * 40, c=GRD, lw=1))
        o.append(T(p.X(v), 44 + 5 * 40 + 14, s, "middle", 9, MUT))
    for i, st in enumerate(stages):
        y = 44 + i * 40
        o.append(T(240, y + 22, st, "end", 10, INK, i == 4))
        for k, (arr, c, tot) in enumerate(((rnd, MUT, 2000000), (mut, SIG, 200000))):
            frac = arr[i] / tot
            yy = y + 6 + k * 14
            if frac > 0:
                o.append(RECT(p.x, yy, p.X(frac) - p.x, 11, 2, soft(c), c, 1.1))
                s = "%s 個（%s）" % (format(arr[i], ","), ("%.3g %%" % (frac * 100)) if frac < 1 else "100 %")
                o.append(T(p.X(frac) + 5, yy + 9.5, s, "start", 8.5, c, True))
            else:
                o.append(T(p.x + 4, yy + 9.5, "0 個", "start", 8.5, ALI, True))
    yl = 44 + 5 * 40 + 34
    o.append(LEGEND(250, yl, [(MUT, "乱数で作った入力（200 万個）"), (SIG, "コーパスを変異させた入力（20 万個）")]))
    return SVG(700, yl + 12, o, "わざと誤りを入れた小さな解析器（型 0x09 の値を 8 バイトの配列に写すとき、長さを確かめない）に、2 通りの入力を与えたとき、各段の検査をいくつ通ったか。乱数の入力は最初の 2 つの検査でほぼすべて捨てられ、誤りのある所には 1 つも届かない。正しい入力を少しだけ変えた入力は、形をほぼ保つので奥まで届く。")
F["e23_funnel"] = _f23_funnel()


def _f23_asan():
    o = []
    cells = [("name[8]", 8, SIG), ("temp", 2, GRN), ("hum", 2, GRN), ("flags", 4, PUR)]
    u = 17
    for k, (title, ok) in enumerate((("サニタイザなし", False), ("サニタイザあり（-fsanitize=address）", True))):
        x0 = 20 + k * 350
        o.append(T(x0, 20, title, "start", 11.5, INK, True))
        xx = x0
        y = 36
        for nm, n, c in cells:
            if ok and nm == "temp":
                o.append(RECT(xx, y, 3 * u, 30, 3, ASOFT, ALI, 1.2, dash="3 2"))
                o.append(T(xx + 1.5 * u, y + 19, "赤い帯", "middle", 9, ALI, True))
                xx += 3 * u
            o.append(RECT(xx, y, n * u, 30, 3, soft(c), c, 1.2))
            o.append(T(xx + n * u / 2, y + 19, nm, "middle", 9.5, c, True))
            xx += n * u
        # 12 バイトを書く
        o.append(T(x0, y + 50, "名前に 12 バイトを書く:", "start", 10, INK))
        xw = x0
        for b in range(12):
            over = b >= 8
            if ok and over:
                if b == 8:
                    o.append(RECT(x0 + 8 * u, y + 58, u, 18, 2, ALI, ALI, 1))
                    o.append(T(x0 + 8.5 * u, y + 71, "×", "middle", 11, SCR, True))
                continue
            o.append(RECT(xw + b * u, y + 58, u, 18, 2, ASOFT if over else SSOFT, ALI if over else SIG, 1))
        if not ok:
            o.append(T(x0, y + 98, "9〜12 バイト目が temp と hum を黙って書き換える。", "start", 9.5, ALI))
            o.append(T(x0, y + 113, "その場では何も起きず、後で温度が化けたり、", "start", 9.5, MUT))
            o.append(T(x0, y + 128, "別の所で落ちたりする。落ちないこともある。", "start", 9.5, MUT))
        else:
            o.append(T(x0, y + 98, "検査のコードが赤い帯に触れたことに気づき、", "start", 9.5, GRN))
            o.append(T(x0, y + 113, "9 バイト目を書いた所でプログラムを止める:", "start", 9.5, GRN))
            o.append(T(x0, y + 130, "ERROR: AddressSanitizer: …-buffer-overflow", "start", 9, ALI, True, True))
            o.append(T(x0, y + 144, "WRITE of size 1 … parse.c:42（ファイルと行）", "start", 9, ALI, False, True))
    return SVG(700, 196, o, "配列の外に書いたときの、サニタイザの有無による違い（変数の並びは説明のための例）。サニタイザは変数の間に、触れてはいけない領域（赤い帯）を置き、読み書きのたびに確かめる。そのため、外に触れたその場で止まり、どの行で何バイトを書いたかが分かる。")
F["e23_asan"] = _f23_asan()


def _f23_fuzzloop():
    o = []
    y = 54
    o.append(BOX(20, y, 140, 70, "コーパス", "正しい入力と、新しい分岐を通った入力", GLD, GOSOFT, INK, sz=11.5, ssz=9))
    o.append(BOX(200, y, 130, 70, "変異", "1 つ選び、ビット反転・書き換え・足す・消す", PUR, PSOFT, INK, sz=11.5, ssz=9))
    o.append(RECT(370, y - 6, 150, 82, 8, SSOFT, SIG, 1.4))
    o.append(T(445, y + 16, "試す", "middle", 11.5, INK, True))
    o.append(T(445, y + 34, "LLVMFuzzerTestOneInput", "middle", 9, INK, False, True))
    o.append(T(445, y + 50, "サニタイザ付き", "middle", 9, MUT))
    o.append(T(445, y + 64, "性質の検査", "middle", 9, MUT))
    o.append(ARR(160, y + 35, 198, y + 35, c=MUT, lw=1.6))
    o.append(ARR(330, y + 35, 368, y + 35, c=MUT, lw=1.6))
    o.append(BOX(560, 24, 124, 50, "新しい分岐を通った", None, GLD, GOSOFT, GLD, sz=10.5))
    o.append(BOX(560, 110, 124, 50, "止まった・abort", None, ALI, ASOFT, ALI, sz=10.5))
    o.append(ARR(520, y + 22, 558, 52, c=GLD, lw=1.5))
    o.append(ARR(520, y + 50, 558, 132, c=ALI, lw=1.5))
    o.append(W(622, 24, 622, 12, 90, 12, c=GLD, lw=1.5))          # コーパスへ戻る（箱の上を通す）
    o.append(ARR(90, 12, 90, y - 1, c=GLD, lw=1.5))
    o.append(T(356, 26, "コーパスに加える（次からはこの入力も変異のもとになる）", "middle", 9.5, GLD, False, halo=True))
    o.append(W(445, y + 76, 445, 166, 265, 166, c=MUT, lw=1.3))   # 次の入力へ（箱の下を通す）
    o.append(ARR(265, 166, 265, y + 71, c=MUT, lw=1.3))
    o.append(T(355, 182, "どちらでもなければ、次の入力へ（1 秒に数十万回）", "middle", 9.5, MUT))
    o.append(T(622, 180, "入力を crash-… に保存して終わる", "middle", 9.5, ALI, True))
    o.append(T(622, 194, "→ 単体テストの入力として残す", "middle", 9.5, MUT))
    return SVG(700, 204, o, "libFuzzer の繰り返し。コーパスから入力を選んで変異させ、入口の関数に渡して試す。試した入力が新しい分岐を通ればコーパスに加えるので、奥の分岐まで届く入力が少しずつ増える。サニタイザか性質の検査（abort）で止まったら、その入力をファイルに残して終わる。")
F["e23_fuzzloop"] = _f23_fuzzloop()


# ---- 4 節: キャプチャ ----
def _f23_where():
    o = []
    # Wi-Fi と IP
    o.append(T(20, 20, "Wi-Fi・IP", "start", 11, INK, True))
    o.append(BOX(20, 30, 90, 44, "機器", None, SIG, SSOFT, SIG, sz=11))
    o.append(BOX(170, 26, 130, 52, "PC を AP に", "tcpdump・netem", GLD, GOSOFT, INK, sz=10.5, ssz=9))
    o.append(BOX(360, 26, 120, 52, "スイッチ", "ミラーポート", GLD, GOSOFT, INK, sz=10.5, ssz=9))
    o.append(BOX(540, 30, 140, 44, "サーバ", None, GRN, GSOFT, GRN, sz=11))
    o.append(W(110, 52, 168, 52, c=SIG, lw=1.6, dash="4 3"))
    o.append(T(139, 46, "Wi-Fi", "middle", 9, SIG))
    o.append(W(300, 52, 358, 52, c=MUT, lw=1.6))
    o.append(W(480, 52, 538, 52, c=MUT, lw=1.6))
    o.append(T(510, 46, "…", "middle", 10, MUT))
    o.append(T(350, 96, "IP より上がそのまま見える。TLS の中身は鍵のログが無いと読めない。サーバの側では届いたものしか見えない。", "middle", 9.5, MUT))
    # BLE
    y = 120
    o.append(T(20, y + 8, "BLE", "start", 11, INK, True))
    o.append(BOX(20, y + 18, 90, 44, "機器", None, SIG, SSOFT, SIG, sz=11))
    o.append(RECT(420, y + 12, 260, 58, 8, PSOFT, PUR, 1.4))
    o.append(T(430, y + 28, "スマートフォン・ゲートウェイ", "start", 10, PUR, True))
    o.append(BOX(430, y + 34, 100, 30, "コントローラ", None, SIG, PAN, SIG, sz=9.5))
    o.append(BOX(570, y + 34, 100, 30, "ホスト", None, PUR, PAN, PUR, sz=9.5))
    o.append(W(530, y + 49, 570, y + 49, c=ALI, lw=2.2))
    o.append(T(550, y + 84, "HCI のログ（btsnoop）", "middle", 9.5, ALI, True))
    o.append(T(550, y + 97, "ACL データは平文で見える", "middle", 9, MUT))
    o.append(W(110, y + 40, 428, y + 40, c=SIG, lw=1.6, dash="4 3"))
    o.append(T(170, y + 34, "電波（リンク層）", "middle", 9, SIG))
    o.append(BOX(240, y + 52, 110, 38, "BLE スニファ", None, ALI, ASOFT, ALI, sz=10))
    o.append(W(295, y + 52, 295, y + 42, c=ALI, lw=1.4))
    o.append(T(295, y + 104, "空パケット・送り直しも見える。", "middle", 9, MUT))
    o.append(T(295, y + 117, "暗号化されていれば LTK が要る", "middle", 9, MUT))
    # UART
    y = 262
    o.append(T(20, y + 8, "UART", "start", 11, INK, True))
    o.append(BOX(20, y + 18, 110, 44, "ホストのマイコン", None, SIG, SSOFT, SIG, sz=10))
    o.append(BOX(400, y + 18, 120, 44, "無線モジュール", None, GLD, GOSOFT, GLD, sz=10))
    o.append(W(130, y + 32, 398, y + 32, c=SIG, lw=1.5))
    o.append(W(130, y + 50, 398, y + 50, c=PUR, lw=1.5))
    o.append(T(180, y + 28, "TX → RX", "middle", 9, SIG))
    o.append(T(180, y + 64, "RX ← TX", "middle", 9, PUR))
    for xx, yy in ((260, y + 32), (330, y + 50)):
        o.append(D(xx, yy, ALI, 3.5))
        o.append(W(xx, yy, xx, y + 78, c=ALI, lw=1.2))
    o.append(RECT(230, y + 78, 130, 26, 5, ASOFT, ALI, 1.1))
    o.append(T(295, y + 95, "変換器の RX（2 つ）", "middle", 9.5, ALI, True))
    o.append(T(540, y + 36, "流れるバイトそのもの。", "start", 9.5, MUT))
    o.append(T(540, y + 51, "ロジックアナライザなら", "start", 9.5, MUT))
    o.append(T(540, y + 66, "信号の形も見える", "start", 9.5, MUT))
    return SVG(700, y + 114, o, "どこで写し取るか（赤が写し取る道具の位置）。Wi-Fi・IP は、機器がつながる AP を PC にするか、スイッチのミラーポートで写す。BLE のリンク層はスニファで電波から、ホストとコントローラの間は HCI のログで写す。UART は線に変換器の RX をつなぐか、ロジックアナライザで写す。")
F["e23_where"] = _f23_where()


def _f23_pcap():
    o = []
    o.append(T(20, 18, "ファイルの頭（24 バイト。この例はリトルエンディアンで書かれている）", "start", 10.5, INK, True))
    f1 = [("印", 4, GLD, "D4 C3 B2 A1"), ("版", 4, MUT, "02 00 04 00"), ("時差", 4, MUT, "00 00 00 00"),
          ("精度", 4, MUT, "00 00 00 00"), ("写す最大長", 4, SIG, "00 00 04 00"), ("リンクの種類", 4, PUR, "01 00 00 00")]
    s, h = BYTES(20, 28, f1, unit=27, h=38, sz=9.5)
    o.append(s)
    notes = ["0xA1B2C3D4", "2.4", "0", "0", "262144", "1 = Ethernet"]
    for i, n in enumerate(notes):
        o.append(T(20 + i * 108 + 54, 28 + 38 + 27, n, "middle", 9, MUT))
    y2 = 28 + h + 26
    o.append(T(20, y2, "パケットごとの頭（16 バイト）と中身", "start", 10.5, INK, True))
    f2 = [("時刻 [s]", 4, TEA, "0E C5 DC 6A"), ("時刻 [µs]", 4, TEA, "DE 8E 08 00"), ("写した長さ", 4, SIG, "4A 00 00 00"),
          ("もとの長さ", 4, SIG, "4A 00 00 00"), ("中身（74 バイト）", 8, PUR, "00 00 … 08 00 …")]
    s2, h2 = BYTES(20, y2 + 10, f2, unit=27, h=38, sz=9.5)
    o.append(s2)
    notes2 = ["1792853262", "560862", "74", "74", "Ethernet の頭から"]
    xs = [20 + 54, 20 + 108 + 54, 20 + 216 + 54, 20 + 324 + 54, 20 + 432 + 108]
    for x, n in zip(xs, notes2):
        o.append(T(x, y2 + 10 + 38 + 27, n, "middle", 9, MUT))
    yb = y2 + 10 + h2 + 22
    o.append(T(20, yb, "この後に、次のパケットの頭（16 バイト）と中身が続く。写す最大長より長いパケットは、途中まで写して「もとの長さ」に本当の長さを残す。", "start", 9.5, MUT))
    return SVG(700, yb + 12, o, "tcpdump で写し取った pcap のファイルの先頭（この章の PC で、ループバックを写したもの）。数値は書いた計算機のエンディアンで書かれ、読む側は先頭の印のバイトの並びで見分ける。リンクの種類 1 は、中身が Ethernet の頭から始まることを表す。")
F["e23_pcap"] = _f23_pcap()


def _f23_tlskey():
    o = []
    # 流れ
    o.append(BOX(20, 30, 150, 50, "TLS のライブラリ", "開発のための版だけ", TEA, TSOFT, INK, sz=10.5, ssz=9))
    o.append(BOX(250, 30, 170, 50, "keys.log", "鍵の元になる値の一覧", ALI, ASOFT, INK, sz=10.5, ssz=9))
    o.append(BOX(500, 30, 180, 50, "Wireshark", "tls.keylog_file に指定", PUR, PSOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(170, 55, 248, 55, c=MUT, lw=1.5))
    o.append(ARR(420, 55, 498, 55, c=MUT, lw=1.5))
    o.append(T(209, 48, "書き出す", "middle", 9, MUT))
    o.append(T(459, 48, "読ませる", "middle", 9, MUT))
    o.append(T(250, 98, "1 行の形: SERVER_HANDSHAKE_TRAFFIC_SECRET <ClientHello の乱数> <値>", "start", 9, MUT, False, True))
    # 比べる
    y = 116
    o.append(T(20, y + 10, "鍵のログなし", "start", 11, ALI, True))
    o.append(T(370, y + 10, "鍵のログあり", "start", 11, GRN, True))
    left = ["Client Hello", "Server Hello, Change Cipher Spec, Application Data …", "Application Data", "Application Data", "Application Data"]
    for i, l in enumerate(left):
        o.append(T(20, y + 30 + i * 15, l, "start", 9, INK, False, True))
    o.append(T(20, y + 30 + 5 * 15 + 6, "中身は暗号文のまま（長さと時刻だけが分かる）", "start", 9.5, ALI))
    right = ["Decrypted TLS (397 bytes)", "Decrypted TLS (78 bytes)", "…", "復号した中身:", "PUBLISH dev/1/telemetry T=23.5"]
    for i, l in enumerate(right):
        o.append(T(370, y + 30 + i * 15, l, "start", 9, GRN if i == 4 else INK, i == 4, True))
    o.append(T(370, y + 30 + 5 * 15 + 6, "（試験で送った文字の行がそのまま読める）", "start", 9.5, MUT))
    return SVG(700, y + 30 + 5 * 15 + 18, o, "TLS 1.3 の接続を写し取って、鍵のログの有無で比べた結果（この章の PC で、openssl s_server と s_client -keylogfile を使い、tshark 4.2 で読んだもの）。鍵のログがあれば中身を読めるので、このファイルは通信を読める鍵と同じに扱い、出荷する機器では決して書き出さない。")
F["e23_tlskey"] = _f23_tlskey()


def _f23_btsnoop():
    o = []
    o.append(T(20, 18, "ファイルの頭（16 バイト。数値はビッグエンディアン）", "start", 10.5, INK, True))
    f1 = [("識別 \"btsnoop\\0\"", 8, GLD, "62 74 73 6E 6F 6F 70 00"), ("版", 4, MUT, "00 00 00 01"), ("データリンク", 4, PUR, "00 00 03 EA")]
    s, h = BYTES(20, 28, f1, unit=27, h=38, sz=9.5)
    o.append(s)
    o.append(T(20 + 12 * 27 + 54, 28 + 38 + 27, "1002 = H4", "middle", 9, MUT))
    y2 = 28 + h + 26
    o.append(T(20, y2, "記録 1: HCI_Reset（ホストが送った）", "start", 10.5, INK, True))
    f2 = [("もとの長さ", 4, SIG, "00 00 00 04"), ("記録した長さ", 4, SIG, "00 00 00 04"), ("印", 4, ALI, "00 00 00 02"),
          ("取りこぼし", 4, MUT, "00 00 00 00"), ("時刻 [µs]", 8, TEA, "00 E3 1F 97 AC 07 48 00")]
    s2, h2 = BYTES(20, y2 + 10, f2, unit=27, h=38, sz=9.5)
    o.append(s2)
    o.append(T(20, y2 + 10 + h2 + 8, "中身: 01 03 0C 00（H4 の種類 01 = コマンド、命令の番号 0x0C03、パラメータの長さ 0）", "start", 9.5, INK, False))
    o.append(T(20, y2 + 10 + h2 + 23, "印 = 2: ビット 0 = 0（ホストが送った）、ビット 1 = 1（コマンドかイベント）。記録 2 の Command Complete は印 = 3", "start", 9.5, MUT))
    y3 = y2 + 10 + h2 + 46
    o.append(T(20, y3, "tshark で読んだ結果", "start", 10.5, INK, True))
    lines = ["1  10:00:00.000000  host → controller  HCI_CMD 4 Sent Reset",
             "2  10:00:00.001530  controller → host  HCI_EVT 7 Rcvd Command Complete (Reset)"]
    for i, l in enumerate(lines):
        o.append(T(20, y3 + 18 + i * 15, l, "start", 9.5, GRN, False, True))
    return SVG(700, y3 + 18 + 2 * 15 + 6, o, "この章の btsnoop_write で書いたファイルの中身と、それを Wireshark（tshark 4.2）で読んだ結果。06 章 5 節の HCI_Reset とその Command Complete が、向き・種類・時刻とともに読める。")
F["e23_btsnoop"] = _f23_btsnoop()


# ---- 5 節: ログと計測 ----
_F23_TEXTLINE = "[171.234] #1052 c3 MQTT: CONNECTING->UP rc=0 ok\n"

def _f23_logrec():
    o = []
    n = len(_F23_TEXTLINE.encode())
    o.append(T(20, 18, "文字で書いた 1 行（%d バイト）" % n, "start", 10.5, INK, True))
    o.append(RECT(20, 26, 660, 30, 4, MSOFT, MUT, 1.2))
    o.append(T(30, 46, _F23_TEXTLINE.replace("\n", "\\n"), "start", 11, INK, False, True))
    o.append(T(20, 76, "同じ内容のバイナリの記録（12 バイト。リトルエンディアン）", "start", 10.5, INK, True))
    f = [("通し番号", 4, GLD, "1C 04 00 00"), ("ティック", 4, TEA, "E2 9C 02 00"), ("出来事", 1, PUR, "21"),
         ("接続", 1, SIG, "03"), ("値", 2, GRN, "05 03")]
    s, h = BYTES(20, 86, f, unit=40, h=40, sz=9.5)
    o.append(s)
    notes = [(20 + 80, "1052"), (20 + 240, "171234 ms"), (20 + 340, "0x21"), (20 + 380, "3"), (20 + 440, "3 → 5")]
    for x, t in notes:
        o.append(T(x, 86 + 40 + 28, t, "middle", 9, MUT))
    o.append(T(540, 104, "出来事 0x21 =", "start", 9.5, MUT))
    o.append(T(540, 118, "MQTT の状態の遷移", "start", 9.5, MUT))
    o.append(T(540, 132, "値 = 前 3・後 5", "start", 9.5, MUT))
    o.append(T(20, 176, "番号から文字への表（0x21 → \"MQTT\"、状態 3 → \"CONNECTING\" …）はサーバの側に置く。機器は番号だけを持つ。", "start", 9.5, MUT))
    return SVG(700, 186, o, "同じ出来事を、文字の 1 行と、決まった欄のバイナリの記録で書いたもの。バイナリの記録は 4 分の 1 の大きさで、欄の位置が決まっているので、サーバのプログラムが並べ替え・数え・絞り込みをしやすい。")
F["e23_logrec"] = _f23_logrec()


def _f23_logflow():
    o = []
    srcs = [("状態機械", "遷移・時間切れ"), ("ドライバ・ISR", "捨てたバイト・CRC の誤り"), ("起動の処理", "リセットの理由")]
    for i, (a, b) in enumerate(srcs):
        o.append(BOX(20, 20 + i * 56, 130, 46, a, b, SIG, SSOFT, INK, sz=10.5, ssz=9))
        o.append(ARR(150, 43 + i * 56, 188, 98, c=MUT, lw=1.3))
    o.append(BOX(190, 74, 110, 48, "log_event()", "写すだけ（短く）", PUR, PSOFT, INK, sz=10.5, ssz=9))
    o.append(ARR(300, 98, 336, 98, c=MUT, lw=1.5))
    # リング
    cx, cy, r = 390, 98, 46
    o.append(CIRC(cx, cy, r, c=TEA, lw=10))
    o.append(CIRC(cx, cy, r, c=SCR, lw=7))
    o.append(T(cx, cy - 2, "RAM の", "middle", 9.5, TEA, True))
    o.append(T(cx, cy + 12, "リング", "middle", 9.5, TEA, True))
    o.append(T(cx, cy + r + 18, "満杯なら古いものを上書き", "middle", 9, MUT))
    o.append(ARR(cx + r + 6, 98, 478, 98, c=MUT, lw=1.5))
    o.append(RECT(480, 70, 100, 56, 8, GOSOFT, GLD, 1.4))
    o.append(T(530, 90, "送る係", "middle", 10.5, INK, True))
    o.append(T(530, 105, "log_copy で写し", "middle", 9, MUT))
    o.append(T(530, 118, "まとめて送る", "middle", 9, MUT))
    o.append(ARR(580, 98, 600, 98, c=MUT, lw=1.5))
    o.append(RECT(602, 64, 90, 68, 8, GSOFT, GRN, 1.4))
    o.append(T(647, 86, "サーバ", "middle", 10.5, INK, True))
    o.append(T(647, 102, "抜けを数える", "middle", 9, MUT))
    o.append(T(647, 116, "番号を文字に", "middle", 9, MUT))
    o.append(T(530, 146, "MQTT（QoS 1）。PUBACK が来てから進む", "middle", 9, MUT))
    # カウンタ
    o.append(BOX(190, 182, 300, 44, "カウンタ（起動から増え続ける数）", "再送・つなぎ直し・捨てたバイト・RSSI の最小", SIG, SSOFT, INK, sz=10.5, ssz=9))
    o.append(W(490, 204, 662, 204, c=MUT, lw=1.3))
    o.append(ARR(662, 204, 662, 134, c=MUT, lw=1.3))
    o.append(T(575, 198, "1 時間ごとに報告", "middle", 9, MUT))
    o.append(T(440, 244, "サーバは 2 つの報告の差 ÷ 時間で割合を求める", "middle", 9, MUT))
    o.append(RECT(20, 196, 150, 46, 8, ASOFT, ALI, 1.4))
    o.append(T(95, 215, "0 にしない RAM", "middle", 10, INK, True))
    o.append(T(95, 231, "リセットの理由など", "middle", 9, MUT))
    return SVG(700, 252, o, "ログと計測の流れ。出来事の元は log_event で記録を写すだけにし、送る係のタスクが通し番号の順にまとめてサーバへ送る。カウンタは定期的に報告し、サーバが報告の差から割合を求める。リセットの理由のように消えては困る記録は、別の場所に残す。")
F["e23_logflow"] = _f23_logflow()


# ---- 6 節: 試験のための機能 ----
def _f23_builds():
    o = []
    for k, (title, extra, c) in enumerate((("デバッグ版（TEST_HOOKS = 1）", True, GLD), ("出荷版（TEST_HOOKS = 0）", False, GRN))):
        x0 = 20 + k * 350
        o.append(T(x0 + 155, 20, title, "middle", 11.5, c, True))
        y = 32
        if extra:
            hooks = ["故障注入のスイッチ（種を記録）", "強制切断の命令", "時計を進める（5 分で一周）", "TLS の鍵の書き出し", "UART のコンソール"]
            for i, hname in enumerate(hooks):
                o.append(RECT(x0, y + i * 26, 310, 22, 4, GOSOFT, GLD, 1.1))
                o.append(T(x0 + 10, y + i * 26 + 15, hname, "start", 9.5, INK))
            y += len(hooks) * 26 + 6
        else:
            o.append(RECT(x0, y, 310, 22 * 5 + 4 * 6 - 2, 4, "none", FNT, 1, dash="4 3"))
            o.append(T(x0 + 155, y + 56, "試験のための機能は無い", "middle", 10, MUT, True))
            o.append(T(x0 + 155, y + 72, "（nm で名前が無いことを確かめる）", "middle", 9.5, MUT))
            y += 5 * 26 + 6
        o.append(RECT(x0, y, 310, 26, 4, SSOFT, SIG, 1.2))
        o.append(T(x0 + 155, y + 17, "ログとカウンタの報告（秘密は書かない）", "middle", 9.5, SIG, True))
        o.append(RECT(x0, y + 32, 310, 40, 4, PAN, INK, 1.4))
        o.append(T(x0 + 155, y + 50, "通信のコード", "middle", 10.5, INK, True))
        o.append(T(x0 + 155, y + 64, "解析器・状態機械・バッファ（両方で同じ）", "middle", 9, MUT))
    yb = 32 + 5 * 26 + 6 + 32 + 40 + 22
    o.append(T(20, yb, "デバッグ版: ホストでのテストと、実機の上の故障注入に使う。", "start", 9.5, MUT))
    o.append(T(370, yb, "出荷版: 最後の試験は、機器の外から起こす故障", "start", 9.5, MUT))
    o.append(T(370, yb + 14, "（netem・電波を弱める）で行う。", "start", 9.5, MUT))
    return SVG(700, yb + 24, o, "デバッグ版と出荷版の違い。2 つの違いは、試験のための機能があるかどうかだけにとどめる。試験のための機能は、出荷版に残ると誰でも通信を妨げたり読んだりできる入口になるので、入っていないことをビルドしたファイルで確かめる。")
F["e23_builds"] = _f23_builds()
