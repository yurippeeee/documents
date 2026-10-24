# -*- coding: utf-8 -*-
# 06 章 無線モジュールとつなぐ — AT コマンドと HCI の図

# 振り分けの色（図とデモで同じにする）
_F06_K = {"echo": MUT, "interim": GRN, "ok": SIG, "err": ALI, "urc": GLD, "data": PUR, "prompt": TEA, "nl": FNT}


def _f06_cell(x, y, b, c, cw=21, h=24, hexrow=True, sz=12):
    """1 バイトのます。印字できない CR・LF・空白は小さな略号で書く。"""
    o = []
    if b in (13, 10, 32, 0):
        lab = {13: "CR", 10: "LF", 32: "SP", 0: "00"}[b]
        o.append(RECT(x + 1, y, cw - 2, h, 3, PAN, FNT if c is None else c, 1.0))
        o.append(T(x + cw / 2, y + h / 2 + 3, lab, "middle", 7.5, MUT, False, True))
    else:
        cc = INK if c is None else c
        o.append(RECT(x + 1, y, cw - 2, h, 3, soft(cc), cc, 1.1))
        o.append(T(x + cw / 2, y + h / 2 + 4.5, chr(b), "middle", sz, INK, True, True))
    if hexrow:
        o.append(T(x + cw / 2, y + h + 11, "%02X" % b, "middle", 7.5, MUT, False, True))
    return "".join(o)


def _f06_bracket(x0, x1, y, label, c, sz=10, b=True, lines=None):
    """下向きの括弧（ます目の下に置き、範囲に名前を付ける）。"""
    o = [W(x0 + 1, y, x0 + 1, y + 5, x1 - 1, y + 5, x1 - 1, y, c=c, lw=1.3)]
    if label:
        o.append(T((x0 + x1) / 2, y + 18, label, "middle", sz, c, b))
    for k, l in enumerate(lines or []):
        o.append(T((x0 + x1) / 2, y + 31 + k * 13, l, "middle", sz - 1, MUT))
    return "".join(o)


# ---- 1 節: 4 つの構成 ----
def _f06_configs():
    o = []
    cw, gap, x00 = 166, 8, 10
    APP = ("アプリケーション", PUR, False)
    TLS = ("TLS", TEA, False)
    TCP = ("TCP/IP", GRN, False)
    LL = ("リンク層", SIG, False)
    RF = ("無線の回路", MUT, False)
    cols = [
        ("(a)", "SoC 1 つ", None, [APP, TLS, TCP, LL, RF], "SoC（1 つのチップ）", None),
        ("(b)", "ホスト + AT のモジュール", [APP, ("命令の組み立て・応答の解析", INK, False)],
         [TLS, TCP, LL, RF], "無線モジュール", ("UART", "文字の命令（製品ごと）")),
        ("(c)", "ホスト + コプロセッサ", [APP, ("TCP/IP（ホストに置く形）", GRN, True)],
         [("TCP/IP（こちらに置く形）", GRN, True), LL, RF], "ネットワークコプロセッサ", ("SPI・SDIO", "2 進のパケット（製品ごと）")),
        ("(d)", "ホスト + BLE のコントローラ", [APP, ("BLE のホストの層", PUR, False)],
         [LL, RF], "コントローラ", ("UART・USB", "HCI（標準）")),
    ]
    bh, pitch = 22, 27

    def layers(x, y, L):
        q = []
        for i, (nm, c, dsh) in enumerate(L):
            yy = y + i * pitch
            q.append(RECT(x + 12, yy, cw - 24, bh, 5, soft(c) if c != INK else PAN, c if c != INK else LIN, 1.2, dash="4 3" if dsh else None))
            q.append(T(x + cw / 2, yy + 15, nm, "middle", 10, c if c != INK else INK, True))
        return "".join(q), len(L) * pitch - (pitch - bh)

    ybot = 0
    for i, (k, sub, host, dev, devname, bus) in enumerate(cols):
        x = x00 + i * (cw + gap)
        o.append(T(x + cw / 2, 18, k, "middle", 12.5, INK, True))
        o.append(T(x + cw / 2, 34, sub, "middle", 10, MUT))
        y = 44
        if host:
            s, hh = layers(x, y + 22, host)
            o.append(RECT(x, y, cw, 22 + hh + 8, 10, PAN, SIG, 1.6))
            o.append(T(x + 10, y + 15, "ホスト（マイコン）", "start", 10, SIG, True))
            o.append(s)
            y2 = y + 22 + hh + 8
            yd = y2 + 42
            o.append(DARR(x + 30, y2 + 3, x + 30, yd - 3, c=INK, lw=1.6))
            o.append(T(x + 44, y2 + 18, bus[0], "start", 10, INK, True))
            o.append(T(x + 44, y2 + 32, bus[1], "start", 9, MUT))
            s, hh = layers(x, yd + 22, dev)
            o.append(RECT(x, yd, cw, 22 + hh + 8, 10, PAN, MUT, 1.6))
            o.append(T(x + 10, yd + 15, devname, "start", 10, MUT, True))
            o.append(s)
            yb = yd + 22 + hh + 8
        else:
            s, hh = layers(x, y + 22, dev)
            o.append(RECT(x, y, cw, 22 + hh + 8, 10, PAN, SIG, 1.6))
            o.append(T(x + 10, y + 15, devname, "start", 10, SIG, True))
            o.append(s)
            yb = y + 22 + hh + 8
        ybot = max(ybot, yb)
        if k == "(a)":
            o.append(T(x + cw / 2, yb + 18, "すべてを 1 つのチップで", "middle", 9.5, MUT))
            o.append(T(x + cw / 2, yb + 31, "動かす", "middle", 9.5, MUT))
        if k == "(c)":
            o.append(T(x + cw / 2, yb + 18, "破線の TCP/IP は、どちらに", "middle", 9.5, MUT))
            o.append(T(x + cw / 2, yb + 31, "置くかが製品によって違う", "middle", 9.5, MUT))
        if k == "(d)":
            o.append(T(x + cw / 2, yb + 18, "BLE のホストの層は", "middle", 9.5, MUT))
            o.append(T(x + cw / 2, yb + 31, "L2CAP・ATT・GATT など（16 章）", "middle", 9.5, MUT))
    return SVG(700, ybot + 40, o, "無線をマイコンに組み込む 4 つの構成。角の丸い大きな四角がチップ、その中の箱がそのチップで動く処理である。(b)〜(d) では処理が 2 つのチップに分かれ、上のホストが下のチップに命令を送る。境目の位置と、境目を流れるものの形（製品ごとの文字の命令・製品ごとの 2 進のパケット・標準の HCI）が構成ごとに違う。")
F["e06_configs"] = _f06_configs()


# ---- 2 節: AT コマンドの形 ----
def _f06_atline():
    o = []
    cw = 21
    o.append(T(20, 30, "ホスト → モジュール", "start", 11, SIG, True))
    cmd = b"AT+CSQ\r\n"
    for i, ch in enumerate(cmd):
        o.append(_f06_cell(170 + i * cw, 14, ch, SIG if ch not in (13, 10) else None))
    o.append(T(170 + 8 * cw + 14, 30, "命令の文字の後に CR LF（0D 0A）を付けて送る", "start", 10, MUT))
    o.append(T(20, 84, "モジュール → ホスト（エコーを止めていない場合）", "start", 11, MUT, True))
    resp = b"AT+CSQ\r\n" + b"\r\n+CSQ: 20,99\r\n" + b"\r\nOK\r\n"
    kinds = [_F06_K["echo"]] * 8 + [_F06_K["interim"]] * 15 + [_F06_K["ok"]] * 6
    x0, y0 = 22, 94
    for i, ch in enumerate(resp):
        c = None if ch in (13, 10) else kinds[i]
        o.append(_f06_cell(x0 + i * cw, y0, ch, c))
    yb = y0 + 24 + 18
    o.append(_f06_bracket(x0, x0 + 8 * cw, yb, "エコー", _F06_K["echo"], lines=["送った命令がそのまま返る"]))
    o.append(_f06_bracket(x0 + 8 * cw, x0 + 23 * cw, yb, "中間応答", _F06_K["interim"], lines=["結果の値を載せた行"]))
    o.append(_f06_bracket(x0 + 23 * cw, x0 + 29 * cw, yb, "最終応答", _F06_K["ok"], lines=["処理の終わり"]))
    y3 = yb + 62
    o.append(T(20, y3, "各行は前後を CR LF で囲んで送られるので、CR・LF で区切ると空の行ができる（空の行は捨てる）。", "start", 10, MUT))
    o.append(T(20, y3 + 22, "+CSQ: 20,99 の 20 = 受信している電波の強さの段階: −113 + 2 × 20 = −73 dBm。99 = 受信の誤り率は不明。", "start", 10.5, INK))
    return SVG(700, y3 + 34, o, "AT+CSQ（受信している電波の強さを聞く。3GPP TS 27.007 の命令）を送ったときのバイト。ます目の中は文字、下は 16 進の値。モジュールの応答は、エコー・中間応答・最終応答の 3 種類の行でできている。")
F["e06_atline"] = _f06_atline()


def _f06_atseq():
    lanes = [("ホスト（マイコン）", SIG), ("無線モジュール", MUT), ("アクセスポイント・サーバ", GRN)]
    U_ = _F06_K["urc"]
    msgs = [
        (0, 1, 'AT+CWJAP="home","secret12"', {"mono": True, "c": SIG}),
        (1, 2, "アクセスポイントへ接続（09 章）", {"dash": True, "c": MUT}),
        (1, 0, "WIFI CONNECTED", {"c": U_, "mono": True}),
        (1, 0, "WIFI GOT IP", {"c": U_, "mono": True}),
        (1, 0, "OK", {"c": SIG, "mono": True, "b": True}),
        ("span", 0, 5, "最大 15 s 待つ\n（ESP-AT の既定）", {"c": TEA, "side": -1}),
        (0, 1, 'AT+CIPSTART="TCP","example.com",80', {"mono": True, "c": SIG}),
        (1, 2, "名前を引き、TCP でつなぐ（08・10 章）", {"dash": True, "c": MUT}),
        (1, 0, "CONNECT", {"c": U_, "mono": True}),
        (1, 0, "OK", {"c": SIG, "mono": True, "b": True}),
        (0, 1, "AT+CIPSEND=5", {"mono": True, "c": SIG}),
        (1, 0, "OK", {"c": SIG, "mono": True, "b": True}),
        (1, 0, ">（プロンプト。改行は続かない）", {"c": _F06_K["prompt"]}),
        (0, 1, "hello（5 バイトのデータ）", {"c": _F06_K["data"]}),
        (1, 2, "TCP で送る", {"dash": True, "c": MUT}),
        (1, 0, "SEND OK（スタックに渡した）", {"c": SIG, "b": True}),
    ]
    s, h = seq(lanes, msgs, x=10, y=12, w=680, label_sz=10, dy=31)
    return SVG(700, h + 20, [s], "ESP-AT で、アクセスポイントにつなぎ、サーバへ TCP でつないで 5 バイトを送る流れ。命令は 1 つずつ送り、最終応答（OK・SEND OK）を待ってから次を送る。金色の行は命令の応答ではなく、モジュールの状態が変わったことの知らせ（3 節の URC）で、命令を送っていないときにも届く。")
F["e06_atseq"] = _f06_atseq()


# ---- 3 節: URC と行の解析 ----
_F06_S1 = b"AT+CSQ\r\n" + b"\r\n+IPD,12:T=23.5\r\nOK\r\n" + b"\r\n+CSQ: 20,99\r\n" + b"\r\nOK\r\n"


def _f06_s1_kinds():
    k = []
    k += ["echo"] * 6 + ["nl"] * 2           # AT+CSQ CR LF
    k += ["nl"] * 2 + ["urc"] * 8            # CR LF +IPD,12:
    k += ["data"] * 12                       # T=23.5 CR LF OK CR LF
    k += ["nl"] * 2 + ["interim"] * 11 + ["nl"] * 2
    k += ["nl"] * 2 + ["ok"] * 2 + ["nl"] * 2
    assert len(k) == len(_F06_S1)
    return k


def _f06_urc():
    o = []
    kinds = _f06_s1_kinds()
    cw, per = 25, 26
    o.append(T(20, 18, "モジュールから届いたバイト（AT+CSQ の応答を待つ間に、サーバからの 12 バイトが +IPD で届いた）", "start", 10.5, INK, True))
    x0, y0 = 25, 28
    for i, ch in enumerate(_F06_S1):
        r, q = divmod(i, per)
        k = kinds[i]
        c = _F06_K[k] if k != "nl" else (_F06_K["data"] if 18 <= i < 30 else None)
        o.append(_f06_cell(x0 + q * cw, y0 + r * 50, ch, c, cw=cw))
    ly = y0 + 2 * 50 + 6
    o.append(LEGEND(25, ly, [(_F06_K["echo"], "エコー"), (_F06_K["urc"], "URC（+IPD の頭）"), (_F06_K["data"], "データ"),
                             (_F06_K["interim"], "中間応答"), (_F06_K["ok"], "最終応答")]))
    yt = ly + 34
    rows_bad = [("AT+CSQ", "エコー", _F06_K["echo"]),
                ("+IPD,12:T=23.5", "URC（データは T=23.5 だけと読む）", _F06_K["urc"]),
                ("OK", "× 最終応答と読み、命令を終える", ALI),
                ("+CSQ: 20,99", "× 待っていない行（値が失われる）", ALI),
                ("OK", "× 待っていない最終応答", ALI)]
    rows_good = [("AT+CSQ", "エコー", _F06_K["echo"]),
                 ("+IPD,12:", "URC: 後に 12 バイトのデータ", _F06_K["urc"]),
                 (r"T=23.5\r\nOK\r\n", "データ（12 バイト）", _F06_K["data"]),
                 ("+CSQ: 20,99", "中間応答（−73 dBm）", _F06_K["interim"]),
                 ("OK", "最終応答: AT+CSQ の終わり", _F06_K["ok"])]
    for side, (title, tc, rows) in enumerate((("行の中身だけで読む解析器（悪い例）", ALI, rows_bad),
                                              ("長さの分はデータとして読む解析器（良い例）", GRN, rows_good))):
        x = 10 + side * 345
        o.append(RECT(x, yt, 335, 30 + len(rows) * 24 + 8, 8, PAN, tc, 1.4))
        o.append(T(x + 12, yt + 20, title, "start", 11, tc, True))
        for j, (line, kind, c) in enumerate(rows):
            yy = yt + 46 + j * 24
            o.append(T(x + 12, yy, line, "start", 10, INK, False, True))
            o.append(T(x + 122, yy, "→ " + kind, "start", 10, c, c != _F06_K["echo"]))
    h = yt + 30 + 5 * 24 + 8 + 10
    return SVG(700, h, o, "命令の応答の途中に、URC（+IPD）が割り込んで届いた例。データの中に CR LF と OK が入っている。左のように行の中身だけで振り分けると、データの中の OK を最終応答と誤り、その後の応答がすべてずれる。右のように +IPD の長さの分を行として見ずに読めば、正しく振り分けられる。")
F["e06_urc"] = _f06_urc()


def _f06_parser():
    o = []
    # 上: 処理の流れ
    o.append(BOX(8, 34, 98, 52, "受信の割り込み", "04 章 2 節", GLD, GOSOFT, INK, sz=10, ssz=9))
    o.append(BOX(118, 34, 92, 52, "リングバッファ", "04 章 3 節", GLD, GOSOFT, INK, sz=10, ssz=9))
    o.append(ARR(107, 60, 116, 60, c=MUT, lw=1.5))
    o.append(RECT(222, 8, 470, 126, 10, "none", SIG, 1.3, dash="5 4"))
    o.append(T(232, 126, "通信タスク（05 章 2 節）", "start", 9.5, SIG, True))
    o.append(ARR(211, 60, 238, 60, c=MUT, lw=1.5))
    o.append(BOX(240, 36, 112, 48, "at_feed", "バイトを区切る", SIG, SSOFT, SIG, sz=11, ssz=9.5))
    o.append(BOX(410, 36, 112, 48, "at_classify", "行を振り分ける", SIG, SSOFT, SIG, sz=11, ssz=9.5))
    o.append(ARR(354, 60, 408, 60, c=MUT, lw=1.5))
    o.append(T(381, 54, "行", "middle", 9.5, MUT, True))
    o.append(BOX(564, 16, 120, 28, "命令の状態機械", None, SIG, PAN, INK, sz=10))
    o.append(BOX(564, 58, 120, 28, "URC の処理", None, GLD, PAN, INK, sz=10))
    o.append(BOX(564, 100, 120, 28, "アプリケーション", None, PUR, PAN, INK, sz=10))
    o.append(ARR(524, 50, 562, 32, c=SIG, lw=1.4))
    o.append(T(536, 36, "応答", "end", 9, SIG))
    o.append(ARR(524, 70, 562, 72, c=GLD, lw=1.4))
    o.append(T(543, 84, "URC", "middle", 9, GLD))
    # プロンプト: at_feed から命令の状態機械へ（上を回る）
    o.append(W(296, 35, 296, 22, 556, 22, c=TEA, lw=1.4))
    o.append(ARR(550, 22, 562, 24, c=TEA, lw=1.4))
    o.append(T(420, 18, "プロンプト", "middle", 9, TEA, True))
    # データ: at_feed からアプリケーションへ（下を回る）
    o.append(W(296, 85, 296, 114, 556, 114, c=PUR, lw=1.4))
    o.append(ARR(550, 114, 562, 114, c=PUR, lw=1.4))
    o.append(T(420, 109, "データ（写さずに渡す）", "middle", 9, PUR, True))
    # 下: at_feed の 2 つの状態
    y = 168
    o.append(T(20, y - 12, "at_feed の状態（構造体に覚えておくので、どこで分かれて届いてもよい）", "start", 10.5, INK, True))
    o.append(D(22, y + 22, INK, 5))
    o.append(ARR(28, y + 22, 44, y + 22, c=INK, lw=1.4, head=6))
    o.append(RECT(46, y, 300, 128, 10, SSOFT, SIG, 1.6))
    o.append(T(58, y + 20, "行を読んでいる（data_left = 0）", "start", 11, SIG, True))
    L = ["CR か LF: たまった行を渡す（空の行は捨てる）", "行の先頭の >: プロンプトを渡す", "それ以外: line にためる",
         "line が +IPD,<n>: になった: n を覚える"]
    for k, l in enumerate(L):
        o.append(T(58, y + 44 + k * 21, l, "start", 10, INK))
    o.append(RECT(440, y, 246, 128, 10, PSOFT, PUR, 1.6))
    o.append(T(452, y + 20, "データを読んでいる", "start", 11, PUR, True))
    L2 = ["届いた分（多くても残りの数まで）を", "そのままデータとして渡す", "渡した数だけ data_left を減らす"]
    for k, l in enumerate(L2):
        o.append(T(452, y + 44 + k * 21, l, "start", 10, INK))
    o.append(ARR(348, y + 40, 438, y + 40, c=PUR, lw=1.6))
    o.append(T(393, y + 33, "+IPD,<n>:", "middle", 9.5, PUR, True, True))
    o.append(ARR(438, y + 100, 348, y + 100, c=SIG, lw=1.6))
    o.append(T(393, y + 93, "残り 0", "middle", 9.5, SIG, True))
    return SVG(700, y + 140, o, "受信のバイトが解析器を通る流れ（上）と、at_feed の 2 つの状態（下）。割り込みハンドラはリングバッファに入れるだけにし、通信タスクが取り出して解析する。at_feed は読みかけの行とデータの読み残しを覚えているので、バイトがどこで分かれて届いても、同じ行・プロンプト・データを渡す。")
F["e06_parser"] = _f06_parser()


def _f06_classify():
    o = []
    qs = [("①", "送った命令と同じ行か", "エコー（捨てる）", _F06_K["echo"]),
          ("②", "OK・ERROR・+CME ERROR:・SEND OK・SEND FAIL か", "最終応答", _F06_K["ok"]),
          ("③", "待っている命令の中間応答の頭（AT+CSQ なら +CSQ:）で始まるか", "中間応答", _F06_K["interim"]),
          ("④", "URC の頭（WIFI ・CLOSED・+CEREG: など）で始まるか", "URC", _F06_K["urc"]),
          ("⑤", "命令の応答を待っているか", None, None)]
    x, w, h, pitch, y0 = 46, 420, 34, 52, 16
    for i, (n, q, res, c) in enumerate(qs):
        y = y0 + i * pitch
        o.append(RECT(x, y, w, h, 7, PAN, LIN, 1.3))
        o.append(T(x + 12, y + 22, n, "start", 12, INK, True))
        o.append(T(x + 34, y + 22, q, "start", 10.5, INK))
        if res:
            o.append(ARR(x + w + 2, y + h / 2, x + w + 58, y + h / 2, c=c, lw=1.6))
            o.append(T(x + w + 30, y + h / 2 - 5, "はい", "middle", 9, c))
            o.append(RECT(x + w + 60, y + 4, 154, h - 8, 6, soft(c), c, 1.3))
            o.append(T(x + w + 137, y + h / 2 + 4, res, "middle", 10.5, c, True))
        if i < len(qs) - 1:
            o.append(ARR(x + 40, y + h + 1, x + 40, y + pitch - 1, c=MUT, lw=1.4))
            o.append(T(x + 50, y + h + 13, "いいえ", "start", 9, MUT))
    y = y0 + 4 * pitch
    o.append(ARR(x + w + 2, y + h / 2, x + w + 58, y + h / 2, c=_F06_K["interim"], lw=1.6))
    o.append(T(x + w + 30, y + h / 2 - 5, "はい", "middle", 9, _F06_K["interim"]))
    o.append(RECT(x + w + 60, y + 4, 154, h - 8, 6, soft(_F06_K["interim"]), _F06_K["interim"], 1.3))
    o.append(T(x + w + 137, y + h / 2 + 4, "中間応答（頭の無い応答）", "middle", 10, _F06_K["interim"], True))
    o.append(ARR(x + 40, y + h + 1, x + 40, y + h + 24, c=_F06_K["urc"], lw=1.6))
    o.append(T(x + 50, y + h + 13, "いいえ", "start", 9, MUT))
    o.append(RECT(x, y + h + 26, 220, 26, 6, soft(_F06_K["urc"]), _F06_K["urc"], 1.3))
    o.append(T(x + 110, y + h + 43, "URC（知らない知らせ）", "middle", 10.5, _F06_K["urc"], True))
    # ①〜③ は命令を待っているときだけ
    yb0, yb1 = y0 + 2, y0 + 2 * pitch + h - 2
    o.append(W(x - 8, yb0, x - 14, yb0, x - 14, yb1, x - 8, yb1, c=SIG, lw=1.3))
    o.append(T(x - 22, (yb0 + yb1) / 2, "命令を待っているときだけ調べる", "middle", 9.5, SIG, rot=-90))
    return SVG(700, y + h + 62, o, "区切った 1 行を振り分ける順番。③ を ④ より先に調べるので、+CEREG: のように応答にも URC にも使われる頭の行は、その命令の応答を待っている間は中間応答、待っていない間は URC になる。")
F["e06_classify"] = _f06_classify()


def _f06_cmdsm():
    o = []
    yA, yB = 92, 226
    o.append(STATE(100, yA, 112, 44, "待機", SIG, start=True))
    o.append(STATE(360, yA, 150, 44, "最終応答を待つ", SIG))
    o.append(STATE(598, yA, 164, 44, "プロンプトを待つ", TEA))
    o.append(STATE(598, yB, 164, 44, "送った結果を待つ", TEA))
    # 待機 ⇄ 最終応答を待つ
    o.append(ARR(157, yA - 8, 284, yA - 8, c=SIG, lw=1.6))
    o.append(T(220, yA - 28, "命令を送る", "middle", 10, SIG, True))
    o.append(T(220, yA - 15, "（タイマを始める）", "middle", 9, MUT))
    o.append(ARR(284, yA + 8, 157, yA + 8, c=SIG, lw=1.6))
    o.append(T(220, yA + 25, "OK・ERROR", "middle", 10, SIG, True))
    o.append(T(220, yA + 38, "（結果を渡す）", "middle", 9, MUT))
    # 自分への遷移
    o.append(SELF(360, yA - 22, None, c=GRN))
    o.append(T(360, yA - 62, "エコーは捨て、中間応答は値を覚える", "middle", 9.5, GRN))
    # CIPSEND の 2 段
    o.append(ARR(436, yA, 514, yA, c=TEA, lw=1.6))
    o.append(T(475, yA - 20, "OK", "middle", 10, TEA, True))
    o.append(T(475, yA - 8, "（CIPSEND）", "middle", 8.5, MUT))
    o.append(ARR(598, yA + 23, 598, yB - 23, c=TEA, lw=1.6))
    o.append(T(608, yA + 62, "> を受けた:", "start", 10, TEA, True))
    o.append(T(608, yA + 76, "n バイトを送る", "start", 9.5, MUT))
    # 送った結果 → 待機（下を回る）
    o.append(W(515, yB, 80, yB, 80, yA + 26, c=TEA, lw=1.5))
    o.append(ARR(80, yA + 34, 80, yA + 23, c=TEA, lw=1.5))
    o.append(T(300, yB - 7, "SEND OK・SEND FAIL（結果を渡す）", "middle", 9.5, TEA, True))
    # タイムアウト（最終応答を待つ → 待機）
    o.append(W(360, yA + 23, 360, yA + 66, 122, yA + 66, c=ALI, lw=1.5, dash="5 3"))
    o.append(ARR(122, yA + 60, 122, yA + 24, c=ALI, lw=1.5))
    o.append(T(250, yA + 80, "タイムアウト: 送り直すか、リセットする", "middle", 9.5, ALI))
    o.append(T(20, yB + 40, "URC はどの状態でも URC の処理に渡し、状態は変えない。どの状態にもタイムアウトを置く（図では 1 つだけ示した）。", "start", 9.5, MUT))
    return SVG(700, yB + 52, o, "命令の状態機械。たいていの命令は「最終応答を待つ」から OK か ERROR で待機に戻る。AT+CIPSEND=n は、OK の後にプロンプトを待ち、n バイトを送り、SEND OK か SEND FAIL を受け取って待機に戻る。")
F["e06_cmdsm"] = _f06_cmdsm()


# ---- 4 節: コマンドモードとデータモード ----
def _f06_modes():
    o = []
    xL = 118
    o.append(ARR(560, 16, 690, 16, c=MUT, lw=1.2))
    o.append(T(552, 20, "時間", "end", 9.5, MUT))
    rows = [(46, "ホスト → モジュール"), (96, "モジュール → ホスト")]
    for y, nm in rows:
        o.append(T(xL - 8, y + 4, nm, "end", 10, INK, True))
        o.append(W(xL, y + 14, 690, y + 14, c=GRD, lw=1))

    def box(x, w, y, txt, c, mono=True, sz=9.5):
        return RECT(x, y - 10, w, 22, 4, soft(c), c, 1.2) + T(x + w / 2, y + 5, txt, "middle", sz, c, True, mono)
    # コマンドモード
    o.append(box(122, 82, 46, "AT+CIPMODE=1", SIG))
    o.append(box(176, 30, 96, "OK", SIG))
    o.append(box(212, 70, 46, "AT+CIPSEND", SIG))
    o.append(box(256, 42, 96, "OK >", SIG))
    # データモード
    for x0, w in ((306, 44), (360, 30), (400, 50)):
        o.append(box(x0, w, 46, "データ", PUR, False))
    for x0, w in ((330, 50), (420, 30)):
        o.append(box(x0, w, 96, "データ", PUR, False))
    # +++ とガードタイム
    o.append(DIM(452, 74, 520, 74, None, c=TEA))
    o.append(T(486, 69, "空き > G", "middle", 9, TEA, True))
    o.append(box(522, 36, 46, "+++", TEA))
    o.append(DIM(560, 74, 628, 74, None, c=TEA))
    o.append(T(594, 69, "空き > G", "middle", 9, TEA, True))
    o.append(box(632, 58, 46, "AT…", SIG))
    o.append(T(661, 96, "ESP-AT は", "middle", 8.5, MUT))
    o.append(T(661, 108, "1 秒待つ", "middle", 8.5, MUT))
    # 状態の帯
    yb = 140
    o.append(T(xL - 8, yb + 15, "モジュールの状態", "end", 10, INK, True))
    segs = [(122, 302, "コマンドモード", SIG), (302, 628, "データモード（透過モード）: バイトはそのまま TCP へ", PUR), (628, 690, "コマンド", SIG)]
    for a, b_, t, c in segs:
        o.append(RECT(a, yb, b_ - a, 22, 3, soft(c), c, 1.2))
        o.append(T((a + b_) / 2, yb + 15, t, "middle", 9.5 if b_ - a > 100 else 9, c, True))
    o.append(T(xL, yb + 48, "データモードの間は、モジュールから届くバイトがすべて相手からのデータになり、URC はデータと区別できない。", "start", 10, MUT))
    o.append(T(xL, yb + 66, "G はガードタイム（ESP-AT は 20 ms、1 秒程度の製品もある）。区別の手がかりは時間の空きだけである。", "start", 10, MUT))
    return SVG(700, yb + 78, o, "透過モードに入り、+++ でコマンドモードに戻るまでの時間の流れ（横の長さは時間に比例していない）。透過モードでは、ホストが送るバイトも相手から届くバイトも、命令の行や +IPD の頭なしにそのまま流れる。戻るには、前後にガードタイムより長い空きを置いて +++ だけを送る。")
F["e06_modes"] = _f06_modes()


def _f06_escape():
    o = []
    cw, gw = 27, 54
    rows = [
        ("連続して送るデータの", "途中の +++", [("a", 0, PUR), ("b", 0, PUR), ("+", 0, PUR), ("+", 0, PUR), ("+", 0, PUR), ("c", 0, PUR), ("d", 0, PUR)],
         "データとして送る", "前の空きが 0 なので合図ではない", GRN),
        ("前後を空けて送った", "+++（戻る合図）", [("…", 0, MUT), ("+", 1, TEA), ("+", 0, TEA), ("+", 0, TEA), ("A", 1, SIG)],
         "コマンドモードに戻る", "意図どおり", GRN),
        ("1 秒ごとに送る 3 バイトの", "通し番号が 2B 2B 2B", [("2B", 0, PUR), ("2B", 0, PUR), ("2A", 0, PUR), ("2B", 1, ALI), ("2B", 0, ALI), ("2B", 0, ALI), ("…", 1, MUT)],
         "誤ってコマンドモードに戻る", "データのつもりが合図になる", ALI),
    ]
    y = 22
    for (l1, l2, cells, verdict, why, vc) in rows:
        o.append(T(14, y + 10, l1, "start", 10, INK, True))
        o.append(T(14, y + 24, l2, "start", 10, INK, True))
        x = 176
        for k, (ch, gap_before, c) in enumerate(cells):
            if gap_before:
                o.append(DIM(x + 2, y + 34, x + gw - 2, y + 34, None, c=TEA))
                o.append(T(x + gw / 2, y + 48, "1 s", "middle", 9, TEA, True))
                x += gw
            o.append(RECT(x + 1, y + 2, cw - 2, 26, 3, soft(c), c, 1.2))
            o.append(T(x + cw / 2, y + 20, ch, "middle", 10 if len(ch) > 1 else 12, INK, True, True))
            x += cw
        o.append(T(490, y + 12, verdict, "start", 10.5, vc, True))
        o.append(T(490, y + 27, why, "start", 9.5, MUT))
        y += 70
    o.append(T(14, y - 6, "0x2B は + の文字コード。115200 bps・8N1 で続けて送るバイトの間は 0（1 バイトは 86.8 µs）、ガードタイムは 20 ms（ESP-AT）〜1 s 程度。", "start", 9.5, MUT))
    return SVG(700, y + 6, o, "+++ を戻る合図と読むかどうかは、前後の時間の空きだけで決まる。データの途中の +++ は前の空きが無いので合図にならない（上）。前後を空けた +++ は合図になる（中）。ところが、1 秒ごとに 3 バイトだけを送る機器で、値がたまたま 2B 2B 2B になると、データのつもりでも合図になってしまう（下。悪い例）。")
F["e06_escape"] = _f06_escape()


# ---- 5 節: HCI ----
def _f06_hcisplit():
    o = []
    # 左: (d) 2 つのチップ
    o.append(T(190, 18, "(d) ホストとコントローラを分ける", "middle", 11.5, INK, True))
    host = [("アプリケーション", PUR), ("GATT・ATT・SMP・GAP", PUR), ("L2CAP", GRN)]
    ctl = [("リンク層", SIG), ("物理層（無線の回路）", MUT)]
    x, w = 40, 220
    o.append(RECT(x - 10, 30, w + 20, 18 + 3 * 28 + 8, 10, PAN, SIG, 1.6))
    o.append(T(x, 44, "ホスト（マイコン・PC）: BLE のホスト", "start", 10, SIG, True))
    for i, (nm, c) in enumerate(host):
        yy = 52 + i * 28
        o.append(RECT(x, yy, w, 22, 5, soft(c), c, 1.2))
        o.append(T(x + w / 2, yy + 15, nm, "middle", 10, c, True))
    yh = 30 + 18 + 3 * 28 + 8
    o.append(DARR(x + 40, yh + 3, x + 40, yh + 49, c=INK, lw=1.8))
    o.append(T(x + 54, yh + 20, "HCI（UART・USB）", "start", 10.5, INK, True))
    o.append(T(x + 54, yh + 36, "コマンド ↓ ・ イベント ↑ ・ ACL データ ↕", "start", 9.5, MUT))
    yc = yh + 52
    o.append(RECT(x - 10, yc, w + 20, 18 + 2 * 28 + 8, 10, PAN, MUT, 1.6))
    o.append(T(x, yc + 14, "コントローラ（無線のチップ）", "start", 10, MUT, True))
    for i, (nm, c) in enumerate(ctl):
        yy = yc + 22 + i * 28
        o.append(RECT(x, yy, w, 22, 5, soft(c), c, 1.2))
        o.append(T(x + w / 2, yy + 15, nm, "middle", 10, c, True))
    ye = yc + 18 + 2 * 28 + 8
    o.append(T(x + w + 18, 90, "ms の単位で", "start", 9.5, MUT))
    o.append(T(x + w + 18, 104, "動けばよい", "start", 9.5, MUT))
    o.append(T(x + w + 18, yc + 40, "決まった時刻に", "start", 9.5, ALI))
    o.append(T(x + w + 18, yc + 54, "µs の精度で", "start", 9.5, ALI))
    o.append(T(x + w + 18, yc + 68, "送受信する", "start", 9.5, ALI))
    # 右: (a) 1 つの SoC
    xr, wr = 430, 220
    o.append(T(xr + wr / 2, 18, "(a) 1 つの SoC", "middle", 11.5, INK, True))
    o.append(RECT(xr - 10, 30, wr + 20, 52 + 5 * 28 + 30 - 6 + 8 - 30, 10, PAN, SIG, 1.6))
    o.append(T(xr, 44, "SoC", "start", 10, SIG, True))
    allL = host + ctl
    for i, (nm, c) in enumerate(allL):
        yy = 52 + i * 28 + (30 if i >= 3 else 0)
        o.append(RECT(xr, yy, wr, 22, 5, soft(c), c, 1.2))
        o.append(T(xr + wr / 2, yy + 15, nm, "middle", 10, c, True))
    yl = 52 + 3 * 28 + 1
    o.append(W(xr - 4, yl, xr + wr + 4, yl, c=INK, lw=1.4, dash="5 4"))
    o.append(T(xr + wr / 2, yl + 20, "HCI（チップの中のソフトウェアの境目）", "middle", 9.5, INK))
    return SVG(700, ye + 12, o, "BLE のスタックをホスト（L2CAP より上）とコントローラ（リンク層と物理層）に分ける。(d) では両者が別のチップで、HCI のパケットを UART や USB で運ぶ。(a) の SoC でも同じ境目があり、HCI はチップの中のソフトウェアの境目になる。")
F["e06_hcisplit"] = _f06_hcisplit()


def _f06_h4():
    o = []
    u = 44
    x0 = 150
    rows = [("HCI コマンド", "ホスト → コントローラ", [("種類", 1, SIG, "01"), ("命令の番号", 2, GLD, "OGF・OCF"), ("長さ", 1, TEA, "n"), ("パラメータ", 6, PUR, "n バイト")]),
            ("HCI イベント", "コントローラ → ホスト", [("種類", 1, SIG, "04"), ("番号", 1, GLD, "例 0E"), ("長さ", 1, TEA, "n"), ("パラメータ", 7, PUR, "n バイト")]),
            ("ACL データ", "両方向", [("種類", 1, SIG, "02"), ("ハンドル・フラグ", 2, GLD, "12 + 4 ビット"), ("長さ", 2, TEA, "n（2 バイト）"), ("データ（L2CAP）", 5, PUR, "n バイト")])]
    y = 14
    for nm, sub, fields in rows:
        o.append(T(x0 - 12, y + 16, nm, "end", 11, INK, True))
        o.append(T(x0 - 12, y + 31, sub, "end", 9, MUT))
        s, h = BYTES(x0, y, fields, unit=u, h=36, sz=10, offs=False)
        o.append(s)
        y += 54
    o.append(T(x0, y + 2, "長さ = その後に続くバイト数。1 バイトの欄はそのまま、2 バイトの欄はリトルエンディアン（下位のバイトが先）。", "start", 9.5, MUT))
    # 命令の番号のビット
    y += 26
    o.append(T(x0 - 12, y + 30, "命令の番号", "end", 11, INK, True))
    o.append(T(x0 - 12, y + 45, "（16 ビット）", "end", 9, MUT))
    bw = 26
    bits = format(0x0C03, "016b")
    for k in range(16):
        bit = 15 - k
        c = SIG if bit >= 10 else GLD
        xx = x0 + k * bw
        o.append(T(xx + bw / 2, y + 10, str(bit), "middle", 8, FNT, False, True))
        o.append(RECT(xx + 1, y + 16, bw - 2, 24, 3, soft(c), c, 1.1))
        o.append(T(xx + bw / 2, y + 33, bits[k], "middle", 11, INK, True, True))
    o.append(_f06_bracket(x0, x0 + 6 * bw, y + 46, "OGF（命令の群）= 0x03", SIG, sz=9.5))
    o.append(_f06_bracket(x0 + 6 * bw, x0 + 16 * bw, y + 46, "OCF（群の中の番号）= 0x003", GLD, sz=9.5))
    o.append(T(x0 + 16 * bw + 14, y + 25, "= 0x0C03", "start", 11, INK, True, True))
    o.append(T(x0 + 16 * bw + 14, y + 40, "（HCI_Reset）", "start", 9.5, MUT))
    return SVG(700, y + 80, o, "H4 の 3 種類のパケットの形（上）と、命令の番号の作り方（下。HCI_Reset の例）。先頭の 1 バイトで種類が分かり、続くヘッダの長さの欄で残りのバイト数が分かる。区切り文字も CRC も無い。")
F["e06_h4"] = _f06_h4()


def _f06_reset():
    o = []
    cw = 56

    def strip(x, y, bs, cols):
        q = []
        for i, (b, c) in enumerate(zip(bs, cols)):
            xx = x + i * cw
            q.append(RECT(xx + 1, y, cw - 2, 30, 4, soft(c), c, 1.3))
            q.append(T(xx + cw / 2, y + 20, "%02X" % b, "middle", 13, INK, True, True))
        return "".join(q)
    x0 = 150
    # 上: コマンド
    o.append(T(x0 - 14, 38, "ホスト →", "end", 10.5, SIG, True))
    o.append(T(x0 - 14, 52, "コントローラ", "end", 10.5, SIG, True))
    o.append(T(x0, 18, "HCI_Reset（コマンド）", "start", 11, SIG, True))
    o.append(strip(x0, 28, [0x01, 0x03, 0x0C, 0x00], [SIG, GLD, GLD, TEA]))
    yb = 28 + 30 + 6
    o.append(_f06_bracket(x0, x0 + cw, yb, "種類", SIG, sz=9.5, lines=["コマンド"]))
    o.append(_f06_bracket(x0 + cw, x0 + 3 * cw, yb, "命令の番号 0x0C03", GLD, sz=9.5, lines=["（下位のバイトが先）"]))
    o.append(_f06_bracket(x0 + 3 * cw, x0 + 4 * cw, yb, "長さ", TEA, sz=9.5, lines=["0"]))
    # 下: イベント
    y2 = 160
    o.append(T(x0 - 14, y2 + 10, "コントローラ", "end", 10.5, GRN, True))
    o.append(T(x0 - 14, y2 + 24, "→ ホスト", "end", 10.5, GRN, True))
    o.append(T(x0, y2 - 30, "Command Complete（イベント）", "start", 11, GRN, True))
    bs = [0x04, 0x0E, 0x04, 0x01, 0x03, 0x0C, 0x00]
    cols = [SIG, GLD, TEA, PUR, PUR, PUR, PUR]
    o.append(strip(x0, y2, bs, cols))
    yb2 = y2 + 30 + 6
    o.append(_f06_bracket(x0, x0 + cw, yb2, "種類", SIG, sz=9.5, lines=["イベント"]))
    o.append(_f06_bracket(x0 + cw, x0 + 2 * cw, yb2, "番号 0x0E", GLD, sz=9.5))
    o.append(_f06_bracket(x0 + 2 * cw, x0 + 3 * cw, yb2, "長さ", TEA, sz=9.5, lines=["4 バイト"]))
    o.append(_f06_bracket(x0 + 3 * cw, x0 + 4 * cw, yb2, "送ってよい", PUR, sz=9.5, lines=["命令の数 1"]))
    o.append(_f06_bracket(x0 + 4 * cw, x0 + 6 * cw, yb2, "終わった命令 0x0C03", PUR, sz=9.5))
    o.append(_f06_bracket(x0 + 6 * cw, x0 + 7 * cw, yb2, "状態", PUR, sz=9.5, lines=["00 = 成功"]))
    o.append(W(x0 + 3 * cw + 1, y2 - 3, x0 + 3 * cw + 1, y2 - 8, x0 + 7 * cw - 1, y2 - 8, x0 + 7 * cw - 1, y2 - 3, c=PUR, lw=1.3))
    o.append(T(x0 + 5 * cw, y2 - 13, "パラメータ（4 バイト）", "middle", 9.5, PUR, True))
    o.append(T(20, yb2 + 62, "0x0E は Command Complete（命令の処理が終わった）。時間のかかる命令には、まず 0x0F（Command Status: 受け付けた）が返る。", "start", 10, INK))
    return SVG(700, yb2 + 74, o, "リセットの命令 HCI_Reset（上）と、コントローラが返す Command Complete のイベント（下）。イベントのパラメータには、いま送ってよい命令の数、終わった命令の番号、命令ごとの戻り値（ここでは成功を表す状態 0x00）が入る。")
F["e06_reset"] = _f06_reset()


def _f06_hciflow():
    lanes = [("ホスト（BLE のホスト）", SIG), ("コントローラ", MUT), ("相手の機器", PUR)]
    A = _F06_K["urc"]
    msgs = [
        (0, 1, "HCI_Reset", {"c": SIG}),
        (1, 0, "Command Complete（送ってよい命令 1）", {"c": SIG}),
        (0, 1, "HCI_LE_Read_Buffer_Size", {"c": SIG}),
        (1, 0, "Command Complete（251 バイト × 3 つ）", {"c": SIG}),
        (0, 1, "HCI_LE_Create_Connection", {"c": SIG}),
        (1, 0, "Command Status（受け付けた）", {"c": SIG}),
        (1, 2, "接続の要求（電波）", {"dash": True, "c": MUT}),
        (1, 0, "LE Connection Complete（ハンドル 0x0040）", {"c": A}),
        (0, 1, "ACL データ × 3（残り 3 → 0）", {"c": _F06_K["data"]}),
        (1, 2, "相手へ送る", {"dash": True, "c": MUT}),
        ("note", 0, "残り 0: 送らずに待つ", {"c": ALI}),
        (1, 0, "Number Of Completed Packets（2 つ空いた）", {"c": A}),
        (0, 1, "ACL データ × 2（残り 2 → 0）", {"c": _F06_K["data"]}),
    ]
    s, h = seq(lanes, msgs, x=10, y=12, w=680, label_sz=10, dy=31)
    return SVG(700, h + 20, [s], "HCI の流れの制御。命令は、Command Complete・Command Status が運ぶ「送ってよい命令の数」の範囲で 1 つずつ送る。ACL データは、最初に聞いた置き場所の数（例: 3 つ）を超えて送らず、Number Of Completed Packets で空いた数が戻るのを待つ。金色のイベントは命令と関係なく届く知らせで、AT コマンドの URC にあたる。")
F["e06_hciflow"] = _f06_hciflow()


def _f06_h4loss():
    o = []
    P = [[0x04, 0x0E, 0x04, 0x01, 0x03, 0x0C, 0x00], [0x04, 0x0E, 0x07, 0x01, 0x02, 0x20, 0x00, 0xFB, 0x00, 0x03],
         [0x04, 0x13, 0x05, 0x01, 0x40, 0x00, 0x01, 0x00], [0x04, 0x05, 0x04, 0x00, 0x40, 0x00, 0x13]]
    names = ["Command Complete（Reset）", "Command Complete（大きさ）", "Number Of Completed Packets", "Disconnection Complete"]
    pc = [SIG, GRN, GLD, PUR]
    cw, x0 = 20, 22

    def cell(x, y, b, c, fill=None):
        return RECT(x + 1, y, cw - 2, 24, 3, fill or soft(c), c, 1.1) + T(x + cw / 2, y + 16, "%02X" % b, "middle", 8.5, INK, True, True)
    o.append(T(x0, 18, "全部届いた場合（ホストが受け取る、コントローラからの 4 つのイベント）", "start", 10.5, GRN, True))
    y = 28
    x = x0
    for p, c, nm in zip(P, pc, names):
        for b in p:
            o.append(cell(x, y, b, c))
            x += cw
    x = x0
    for k, (p, c, nm) in enumerate(zip(P, pc, names)):
        o.append(_f06_bracket(x, x + len(p) * cw, y + 28, None, c))
        o.append(T(x + len(p) * cw / 2, y + 46 + (12 if k % 2 else 0), nm, "middle", 9, c, True))
        x += len(p) * cw
    # 欠けた場合
    y2 = 128
    o.append(T(x0, y2 - 10, "2 つ目のイベントの先頭の 04 が欠けた場合（悪い例）", "start", 10.5, ALI, True))
    flat = [b for p in P for b in p]
    lost = flat[:7] + flat[8:]
    x = x0
    roles = []
    for i, b in enumerate(lost):
        if i < 7:
            roles.append((SIG, None))
        elif i < 10:
            roles.append((MUT, PAN))
        elif i == 10:
            roles.append((ALI, None))
        elif i < 15:
            roles.append((ALI, None))
        else:
            roles.append((ALI, ASOFT))
    for i, b in enumerate(lost):
        if i == 7:
            o.append(RECT(x + 2, y2 + 2, cw - 4, 20, 3, "none", ALI, 1.2, dash="3 2"))
            o.append(T(x + cw / 2, y2 + 16, "×", "middle", 11, ALI, True))
            x += cw
        c, fill = roles[i]
        o.append(cell(x, y2, b, c, fill))
        x += cw
    yb = y2 + 28
    xs = lambda i: x0 + (i + (1 if i >= 7 else 0)) * cw
    o.append(_f06_bracket(xs(0), xs(7) - cw, yb, "正しく読む", SIG, sz=9))
    o.append(_f06_bracket(xs(7), xs(10), yb, "読み捨て", MUT, sz=9, b=False, lines=["種類の値でない"]))
    o.append(_f06_bracket(xs(10), xs(15), yb, "02 を ACL と読む", ALI, sz=9, lines=["長さ 00FB = 251"]))
    o.append(_f06_bracket(xs(15), xs(len(lost)), yb, "後のイベントを ACL のデータとして飲み込む", ALI, sz=9,
                          lines=["さらに 235 バイトを待ち続ける"]))
    return SVG(700, yb + 62, o, "H4 は長さだけで区切るので、1 バイトの喪失で区切りが狂う例。2 つ目のイベントの種類のバイト 04 が欠けると、受け手は 0E・07・01 を種類として読めずに捨て、次の 02 を ACL データの始まりと読む。続く 4 バイトの長さの欄は 0x00FB = 251 となり、後のイベントを ACL のデータとして飲み込んだうえ、さらに 235 バイトを待ち続ける。")
F["e06_h4loss"] = _f06_h4loss()


# ---- 6 節: どの構成を選ぶか ----
def _f06_choose():
    o = []
    qx, qw, qh = 20, 380, 46
    rx, rw = 470, 214
    qs = [(20, "アプリケーションと通信の処理を、1 つの", "無線内蔵マイコン（SoC）に載せられるか", "(a) SoC 1 つ", "例: 電池で動く BLE のセンサ", SIG),
          (112, "方式は BLE か", None, "(d) ホスト + BLE のコントローラ", "例: Linux のゲートウェイの BLE", PUR),
          (204, "多くのデータを速く送るか、TCP/IP を", "細かく制御する必要があるか", "(c) ホスト + コプロセッサ", "例: Linux のゲートウェイの Wi-Fi", GRN)]
    for i, (y, l1, l2, res, ex, c) in enumerate(qs):
        o.append(RECT(qx, y, qw, qh, 8, PAN, LIN, 1.3))
        if l2:
            o.append(T(qx + qw / 2, y + 19, l1, "middle", 10.5, INK, True))
            o.append(T(qx + qw / 2, y + 35, l2, "middle", 10.5, INK, True))
        else:
            o.append(T(qx + qw / 2, y + 28, l1, "middle", 10.5, INK, True))
        o.append(ARR(qx + qw + 2, y + qh / 2, rx - 2, y + qh / 2, c=c, lw=1.6))
        o.append(T((qx + qw + rx) / 2, y + qh / 2 - 6, "はい", "middle", 9.5, c, True))
        o.append(RECT(rx, y, rw, qh, 8, soft(c), c, 1.4))
        o.append(T(rx + rw / 2, y + 19, res, "middle", 10.5, c, True))
        o.append(T(rx + rw / 2, y + 36, ex, "middle", 9.5, MUT))
        o.append(ARR(qx + 60, y + qh + 1, qx + 60, y + 92 - 1, c=MUT, lw=1.4))
        o.append(T(qx + 70, y + qh + 26, "いいえ", "start", 9.5, MUT))
    y = 296
    o.append(RECT(rx - 250, y, rw + 250, qh, 8, soft(GLD), GLD, 1.4))
    o.append(T(rx - 250 + (rw + 250) / 2, y + 19, "(b) ホスト + AT コマンドのモジュール", "middle", 10.5, GLD, True))
    o.append(T(rx - 250 + (rw + 250) / 2, y + 36, "例: すでにある小さなマイコンの製品に Wi-Fi を足す", "middle", 9.5, MUT))
    o.append(W(qx + 60, y - 1 + 0, qx + 60, y + qh / 2, rx - 252, y + qh / 2, c=MUT, lw=1.4))
    o.append(ARR(rx - 262, y + qh / 2, rx - 252, y + qh / 2, c=MUT, lw=1.4))
    o.append(T(20, y + qh + 26, "どの構成でも、電波の認証は認証済みモジュールを使うと手間が少ない。消費電力は 2 つのチップなら眠っている間の電流の和になる。", "start", 9.5, MUT))
    return SVG(700, y + qh + 38, o, "構成を選ぶ目安。上から順に問い、はいなら右の構成を選ぶ。実際には費用・部品の入手・開発の手間・ファームウェアの更新の方法も合わせて決める。")
F["e06_choose"] = _f06_choose()
