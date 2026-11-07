# -*- coding: utf-8 -*-
# 20 章 BLE のセキュリティ の図

def _f20_dev(x, y, w, h, name, c, sz=10.5, sub=None):
    """機器・スマートフォンなどの箱（左上が x, y）。"""
    o = [RECT(x, y, w, h, 6, soft(c), c, 1.3)]
    if sub:
        o.append(T(x + w / 2, y + h / 2 - 2, name, "middle", sz, c, True))
        o.append(T(x + w / 2, y + h / 2 + 12, sub, "middle", 9, MUT))
    else:
        o.append(T(x + w / 2, y + h / 2 + sz * 0.38, name, "middle", sz, c, True))
    return "".join(o)

def _f20_panel(x, y, w, h, title, c, ref):
    """枠と、左上の題・右上の対策の参照。"""
    return (RECT(x, y, w, h, 8, PAN, LIN, 1.1) + T(x + 10, y + 18, title, "start", 11.5, c, True)
            + T(x + w - 10, y + 18, ref, "end", 9.5, GRN, True))

# ---- 1 節: 4 つの脅威 ----
def _f20_threats():
    o = []
    W_, H_ = 338, 138
    P = [(10, 10), (352, 10), (10, 158), (352, 158)]
    # (1) 受動的な盗聴
    x, y = P[0]
    o.append(_f20_panel(x, y, W_, H_, "受動的な盗聴", ALI, "→ 3 節 LESC"))
    o.append(_f20_dev(x + 14, y + 34, 70, 28, "機器", SIG))
    o.append(_f20_dev(x + W_ - 104, y + 34, 90, 28, "スマートフォン", PUR, sz=10))
    o.append(DARR(x + 88, y + 48, x + W_ - 108, y + 48, c=INK, lw=1.4))
    o.append(T(x + W_ / 2 - 8, y + 42, "ペアリング・データ", "middle", 9.5, INK, halo=True))
    o.append(W(x + W_ / 2 - 8, y + 52, x + W_ / 2 - 8, y + 78, c=ALI, lw=1.2, dash="3 2"))
    o.append(_f20_dev(x + W_ / 2 - 58, y + 80, 100, 26, "記録する者", ALI, sz=10))
    o.append(T(x + 14, y + 126, "電波を受けて記録するだけ。両端は気づけない。", "start", 9.5, MUT))
    # (2) 中間者攻撃
    x, y = P[1]
    o.append(_f20_panel(x, y, W_, H_, "中間者攻撃（MITM）", ALI, "→ 4 節 数値比較など"))
    o.append(_f20_dev(x + 12, y + 40, 62, 28, "機器", SIG))
    o.append(_f20_dev(x + W_ / 2 - 40, y + 40, 80, 28, "攻撃者", ALI))
    o.append(_f20_dev(x + W_ - 104, y + 40, 92, 28, "スマートフォン", PUR, sz=10))
    o.append(DARR(x + 76, y + 54, x + W_ / 2 - 42, y + 54, c=ALI, lw=1.4))
    o.append(DARR(x + W_ / 2 + 42, y + 54, x + W_ - 106, y + 54, c=ALI, lw=1.4))
    o.append(T((x + 76 + x + W_ / 2 - 42) / 2, y + 86, "鍵 1", "middle", 10, ALI, True))
    o.append(T((x + W_ / 2 + 42 + x + W_ - 106) / 2, y + 86, "鍵 2", "middle", 10, ALI, True))
    o.append(T(x + 14, y + 112, "両端は相手と直接つながったつもりでいる。", "start", 9.5, MUT))
    o.append(T(x + 14, y + 128, "通信は攻撃者を通り、読まれ、書き換えられる。", "start", 9.5, MUT))
    # (3) 追跡
    x, y = P[2]
    o.append(_f20_panel(x, y, W_, H_, "追跡", ALI, "→ 6 節 RPA"))
    for k, (pl, tm) in enumerate((("駅", "8:50"), ("会社", "9:30"), ("店", "18:10"))):
        bx = x + 14 + k * 108
        o.append(RECT(bx, y + 30, 98, 58, 6, SCR, LIN, 1.0))
        o.append(T(bx + 49, y + 46, "%s %s" % (pl, tm), "middle", 10, INK, True))
        o.append(T(bx + 49, y + 64, "C5:31:7A:", "middle", 9.5, ALI, True, True))
        o.append(T(bx + 49, y + 78, "20:9B:44", "middle", 9.5, ALI, True, True))
    o.append(T(x + 14, y + 108, "どこでも同じアドレスが聞こえるので、", "start", 9.5, MUT))
    o.append(T(x + 14, y + 124, "中身を読めなくても、同じ持ち主の動きと分かる。", "start", 9.5, MUT))
    # (4) なりすまし
    x, y = P[3]
    o.append(_f20_panel(x, y, W_, H_, "なりすまし", ALI, "→ 7 節 パーミッション"))
    o.append(_f20_dev(x + 14, y + 40, 116, 30, "偽のスマートフォン", ALI, sz=10))
    o.append(_f20_dev(x + W_ - 120, y + 40, 106, 30, "機器（鍵）", SIG))
    o.append(ARR(x + 134, y + 55, x + W_ - 124, y + 55, c=ALI, lw=1.5))
    o.append(T((x + 134 + x + W_ - 124) / 2, y + 49, "「開けて」", "middle", 10, ALI, True, halo=True))
    o.append(T(x + 14, y + 104, "正規の相手のふりをして接続し、", "start", 9.5, MUT))
    o.append(T(x + 14, y + 120, "命令を書き込む・偽のデータを渡す。", "start", 9.5, MUT))
    return SVG(700, 306, o, "BLE の通信を襲う者ができる 4 つのこと。右上は、それを防ぐ仕組みを扱う節。電波は近くの誰でも受信でき、誰でも送信できるので、記録・割り込み・聞き取り・ふりをすることは、どれも特別な装置なしに起こりうる。")
F["e20_threats"] = _f20_threats()

# ---- 2 節: ペアリングの 3 段階 ----
def _f20_phases():
    o = []
    xc, xp = 260, 560
    o.append(_f20_dev(xc - 95, 12, 190, 30, "セントラル（スマートフォン）", PUR, sz=10.5))
    o.append(_f20_dev(xp - 75, 12, 150, 30, "ペリフェラル（機器）", SIG, sz=10.5))
    bands = [(52, 122, "段階 1", "機能の交換", "暗号化なし", MUT),
             (128, 206, "段階 2", "鍵の生成", "LESC かレガシー（3 節）", MUT),
             (212, 256, "", "暗号化の開始", "リンク層", TEA),
             (262, 330, "段階 3", "鍵の配布", "暗号化済み", TEA)]
    for y0, y1, a, b, c_, col in bands:
        o.append(RECT(8, y0, 684, y1 - y0, 6, soft(col), "none", 0, op=0.55))
        if a:
            o.append(T(16, y0 + 18, a, "start", 11, INK, True))
            o.append(T(16, y0 + 34, b, "start", 10.5, INK, True))
            o.append(T(16, y0 + 50, c_, "start", 9, MUT))
        else:
            o.append(T(16, y0 + 18, b, "start", 10.5, TEA, True))
            o.append(T(16, y0 + 34, c_, "start", 9, MUT))
    o.append(W(xc, 42, xc, 214, c=PUR, lw=1.2, dash="3 4"))
    o.append(W(xp, 42, xp, 214, c=SIG, lw=1.2, dash="3 4"))
    o.append(W(xc, 236, xc, 336, c=TEA, lw=3))
    o.append(W(xp, 236, xp, 336, c=TEA, lw=3))
    # 段階 1
    o.append(ARR(xc, 72, xp, 72, c=INK, lw=1.6))
    o.append(T((xc + xp) / 2, 66, "Pairing Request", "middle", 10.5, INK, True, halo=True))
    o.append(T((xc + xp) / 2, 86, "IO 能力・OOB・認証の要求・鍵の最大長・配る鍵", "middle", 9.5, MUT, halo=True))
    o.append(ARR(xp, 110, xc, 110, c=INK, lw=1.6))
    o.append(T((xc + xp) / 2, 104, "Pairing Response", "middle", 10.5, INK, True, halo=True))
    # 段階 2
    for k, yy in enumerate((146, 164, 182)):
        a, b = (xc, xp) if k % 2 == 0 else (xp, xc)
        o.append(ARR(a, yy, b, yy, c=INK, lw=1.3))
    o.append(T((xc + xp) / 2, 140, "鍵を作るためのやり取り（数往復）", "middle", 10, INK, halo=True))
    o.append(T(xc - 8, 200, "暗号化の鍵が決まる", "end", 9.5, GRN, True))
    o.append(T(xp + 8, 200, "暗号化の鍵が決まる", "start", 9.5, GRN, True))
    # 暗号化の開始
    o.append(ARR(xc, 226, xp, 226, c=TEA, lw=1.5))
    o.append(ARR(xp, 244, xc, 244, c=TEA, lw=1.5))
    o.append(T((xc + xp) / 2, 221, "暗号化を始める", "middle", 10, TEA, True, halo=True))
    o.append(T(xc - 8, 250, "以後、太い線の区間は暗号化", "end", 9, TEA))
    # 段階 3
    o.append(ARR(xp, 288, xc, 288, c=TEA, lw=1.5))
    o.append(T((xc + xp) / 2, 282, "識別の鍵（6 節）など", "middle", 10, TEA, halo=True))
    o.append(ARR(xc, 316, xp, 316, c=TEA, lw=1.5))
    o.append(T((xc + xp) / 2, 310, "識別の鍵など（配ると決めたものだけ）", "middle", 10, TEA, halo=True))
    o.append(T(16, 352, "ペアリングは SMP が L2CAP の決まったチャネルの上で行う。以後のデータは AES-CCM で暗号化し、MIC を付けて送る。", "start", 9.5, MUT))
    return SVG(700, 362, o, "ペアリングの 3 段階。段階 1 で互いの能力と要求を知らせ合い、段階 2 で盗聴者に知られない鍵を作り、その鍵でリンクを暗号化してから、段階 3 で長く使う鍵を配る。段階 2 の中身は 3 節で見る。")
F["e20_phases"] = _f20_phases()

# ---- 2 節: Pairing Request・Response と認証の要求 ----
def _f20_authreq():
    o = []
    names = ["コード", "IO 能力", "OOB", "認証の要求", "鍵の最大長", "配る鍵（C）", "配る鍵（P）"]
    bw, x0 = 92, 32
    rows = [("Pairing Request（セントラルが送る）", ["01", "04", "00", "0D", "10", "02", "02"],
             ["Request", "KeyboardDisplay", "持っていない", "下に展開", "16 バイト", "識別の鍵", "識別の鍵"], 18),
            ("Pairing Response（ペリフェラルが返す）", ["02", "03", "00", "09", "10", "02", "02"],
             ["Response", "NoInputNoOutput", "持っていない", "下に展開", "16 バイト", "識別の鍵", "識別の鍵"], 116)]
    for title, vals, means, y in rows:
        o.append(T(x0, y + 4, title, "start", 11, INK, True))
        for k in range(7):
            xx = x0 + k * bw
            c = ALI if k == 3 else (SIG if k == 1 else MUT)
            o.append(RECT(xx, y + 12, bw - 4, 40, 4, soft(c), c, 1.2))
            o.append(T(xx + (bw - 4) / 2, y + 27, names[k], "middle", 9.5, c, True))
            o.append(T(xx + (bw - 4) / 2, y + 45, "0x" + vals[k], "middle", 11, INK, True, True))
            o.append(T(xx + (bw - 4) / 2, y + 68, means[k], "middle", 9, MUT))
    # 0x0D と 0x09 の展開
    y = 212
    o.append(T(x0, y, "認証の要求（1 バイト）のビット", "start", 11, INK, True))
    bits = [("b7〜b5", "そのほか", 3, MUT), ("b4", "キー入力の通知", 1, MUT), ("b3", "SC", 1, GRN),
            ("b2", "MITM", 1, ALI), ("b1〜b0", "ボンディング", 2, SIG)]
    cw = 48
    xx = x0 + 150
    for lab, nm, n, c in bits:
        o.append(RECT(xx, y + 10, n * cw - 3, 22, 3, soft(c), c, 1.1))
        o.append(T(xx + (n * cw - 3) / 2, y + 25, lab, "middle", 9.5, c, True))
        o.append(T(xx + (n * cw - 3) / 2, y + 47, nm, "middle", 9, c, True))
        xx += n * cw
    for k, (v, lab) in enumerate((("0x0D", "000 0 1 1 01"), ("0x09", "000 0 1 0 01"))):
        yy = y + 70 + k * 22
        o.append(T(x0 + 140, yy, "%s =" % v, "end", 10.5, INK, True, True))
        xx = x0 + 150
        for (lb, nm, n, c), bv in zip(bits, lab.split(" ")):
            o.append(T(xx + (n * cw - 3) / 2, yy, bv, "middle", 11, c, True, True))
            xx += n * cw
    o.append(T(x0 + 150 + 8 * cw + 12, y + 70, "MITM あり・SC・保存", "start", 9.5, INK))
    o.append(T(x0 + 150 + 8 * cw + 12, y + 92, "MITM なし・SC・保存", "start", 9.5, INK))
    o.append(T(x0, y + 120, "C・P は、セントラル・ペリフェラルが段階 3 で配る鍵。両端の SC が 1 なので LESC になる。どの確かめ方になるかは 4 節で決まる。", "start", 9.5, MUT))
    return SVG(700, y + 132, o, "スマートフォン（数字の表示と入力ができる）と、画面もボタンもない機器の、Pairing Request と Pairing Response の例。認証の要求の 1 バイトのうち、ボンディング・MITM・SC のビットが、鍵を保存するか、中間者攻撃への保護を求めるか、LE Secure Connections に対応するかを表す。")
F["e20_authreq"] = _f20_authreq()

# ---- 3 節: LE Secure Connections の流れ ----
def _f20_lesc():
    o = []
    xc, xm, xp = 130, 350, 570
    o.append(_f20_dev(xc - 90, 10, 180, 28, "セントラル", PUR))
    o.append(T(xm, 28, "電波の上（記録した者に見えるもの）", "middle", 10.5, ALI, True))
    o.append(_f20_dev(xp - 90, 10, 180, 28, "ペリフェラル", SIG))
    o.append(RECT(xm - 105, 44, 210, 266, 8, ASOFT, ALI, 1.0, dash="4 3", op=0.6))
    # 1. 鍵の組
    for x in (xc, xp):
        o.append(RECT(x - 92, 50, 184, 40, 6, PAN, LIN, 1.2))
        o.append(T(x, 66, "① 鍵の組を作る", "middle", 10.5, INK, True))
        o.append(T(x, 82, "秘密鍵（出さない）・公開鍵", "middle", 9.5, MUT))
    # 2. 公開鍵の交換
    o.append(ARR(xc + 92, 104, xp - 92, 116, c=INK, lw=1.4))
    o.append(ARR(xp - 92, 126, xc + 92, 138, c=INK, lw=1.4))
    o.append(T(xm, 106, "② 公開鍵 C", "middle", 10, INK, True, halo=True))
    o.append(T(xm, 140, "公開鍵 P", "middle", 10, INK, True, halo=True))
    # 3. DHKey
    for x, s in ((xc, "自分の秘密鍵 + 公開鍵 P"), (xp, "自分の秘密鍵 + 公開鍵 C")):
        o.append(RECT(x - 92, 156, 184, 40, 6, GSOFT, GRN, 1.3))
        o.append(T(x, 172, "③ DHKey を計算", "middle", 10.5, GRN, True))
        o.append(T(x, 188, s, "middle", 9.5, MUT))
    o.append(T(xm, 168, "秘密鍵が無いので", "middle", 9.5, ALI, True))
    o.append(T(xm, 182, "DHKey を計算できない", "middle", 9.5, ALI, True))
    # 4. 確認値
    o.append(ARR(xp - 92, 212, xc + 92, 212, c=TEA, lw=1.4))
    o.append(ARR(xc + 92, 230, xp - 92, 230, c=TEA, lw=1.4))
    o.append(ARR(xp - 92, 248, xc + 92, 248, c=TEA, lw=1.4))
    o.append(T(xm, 207, "④ 確認値・乱数（f4）", "middle", 10, TEA, True, halo=True))
    o.append(T(xm, 264, "利用者がどう確かめるかは 4 節", "middle", 9.5, TEA))
    # 5. LTK
    for x in (xc, xp):
        o.append(RECT(x - 92, 274, 184, 40, 6, TSOFT, TEA, 1.3))
        o.append(T(x, 290, "⑤ f5 で LTK を導く", "middle", 10.5, TEA, True))
        o.append(T(x, 306, "f6 の値で最後に確かめ合う", "middle", 9.5, MUT))
    o.append(T(xm, 296, "LTK は電波に乗らない", "middle", 9.5, ALI, True))
    o.append(T(14, 336, "記録した者が知るのは、公開鍵・乱数・確認値だけである。DHKey と LTK を求めるには、楕円曲線の離散対数を解く必要がある。", "start", 9.5, MUT))
    return SVG(700, 346, o, "LE Secure Connections の段階 2。両端は公開鍵だけを送り合い、自分の秘密鍵と相手の公開鍵から同じ DHKey を計算し、そこから LTK を導く。中央の枠は電波の上を流れるもので、ここから DHKey は計算できない。")
F["e20_lesc"] = _f20_lesc()

# ---- 3 節: レガシーの TK の候補の数と LESC ----
def _f20_legacy():
    o = []
    p = Plot(230, 20, 400, 150, (0, 40), (0, 4))
    for v in (0, 10, 20, 30, 40):
        xx = p.X(v)
        o.append(W(xx, 20, xx, 170, c=GRD, lw=1))
        o.append(T(xx, 186, {0: "1", 10: "10¹⁰", 20: "10²⁰", 30: "10³⁰", 40: "10⁴⁰"}[v], "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, 204, "TK の候補の数（横軸は桁数で目盛った対数）", "middle", 10, MUT))
    items = [("レガシー: 何もしない", "TK = 0", 0, "1 通り", ALI),
             ("レガシー: 6 桁を入れる", "TK = 6 桁の数字", 6, "10⁶ 通り", ALI),
             ("レガシー: OOB", "TK = 16 バイト", math.log10(2 ** 128), "2¹²⁸ 通り", GRN)]
    for k, (nm, sub, lg, lab, c) in enumerate(items):
        y = 26 + k * 40
        o.append(T(220, y + 12, nm, "end", 10.5, INK, True))
        o.append(T(220, y + 26, sub, "end", 9, MUT))
        o.append(RECT(p.X(0), y + 4, max(p.X(lg) - p.X(0), 3), 22, 3, soft(c), c, 1.2))
        o.append(T(p.X(lg) + 8, y + 19, lab, "start", 10, c, True))
    y = 26 + 3 * 40
    o.append(T(220, y + 12, "LESC（どの確かめ方でも）", "end", 10.5, INK, True))
    o.append(T(p.X(0) + 4, y + 19, "TK を使わない。記録した値から DHKey は計算できない", "start", 10, GRN, True))
    o.append(T(p.X(0), 226, "赤: 記録を手に入れた者が、候補を全部試し終えられる数。緑: 試し終えられない。", "start", 9.5, MUT))
    return SVG(700, 238, o, "レガシーペアリングで、利用者のすることごとに TK が取りうる値の数。電波に乗る値は TK から計算されているので、記録した者は候補を順に試して正しい TK を確かめられる。何もしない場合と 6 桁の数字では全部を試せてしまう。LESC は TK を使わない。")
F["e20_legacy"] = _f20_legacy()

# ---- 4 節: 数値比較で中間者に気づく ----
def _f20_nc():
    o = []
    def screen(x, y, num, c):
        return RECT(x, y, 92, 26, 4, SCR, c, 1.4) + T(x + 46, y + 18, num, "middle", 13, c, True, True)
    # 左: 中間者なし
    x = 10
    o.append(_f20_panel(x, 10, 338, 168, "中間者がいない", GRN, ""))
    o.append(_f20_dev(x + 14, 40, 104, 26, "スマートフォン", PUR, sz=10))
    o.append(_f20_dev(x + 220, 40, 104, 26, "機器", SIG))
    o.append(DARR(x + 120, 53, x + 218, 53, c=INK, lw=1.3))
    o.append(screen(x + 20, 76, "482 931", GRN))
    o.append(screen(x + 226, 76, "482 931", GRN))
    o.append(T(x + 169, 128, "同じ → 利用者が「はい」を押す", "middle", 10.5, GRN, True))
    o.append(T(x + 169, 150, "両端は同じ公開鍵の組から計算している", "middle", 9.5, MUT))
    # 右: 中間者あり
    x = 352
    o.append(_f20_panel(x, 10, 338, 168, "中間者がいる", ALI, ""))
    o.append(_f20_dev(x + 10, 40, 100, 26, "スマートフォン", PUR, sz=10))
    o.append(_f20_dev(x + 128, 40, 82, 26, "攻撃者", ALI))
    o.append(_f20_dev(x + 228, 40, 100, 26, "機器", SIG))
    o.append(DARR(x + 112, 53, x + 126, 53, c=ALI, lw=1.3))
    o.append(DARR(x + 212, 53, x + 226, 53, c=ALI, lw=1.3))
    o.append(screen(x + 14, 76, "482 931", ALI))
    o.append(screen(x + 232, 76, "105 377", ALI))
    o.append(T(x + 169, 128, "違う → 「いいえ」でペアリングをやめる", "middle", 10.5, ALI, True))
    o.append(T(x + 169, 150, "両端が見た公開鍵が違う（攻撃者の鍵）", "middle", 9.5, MUT))
    o.append(T(10, 198, "数字は例。6 桁の値は、両端が送り合った公開鍵と乱数から計算する。中間者が割り込むと、両端の値は 10⁶ 分の 1 の確率でしか一致しない。", "start", 9.5, MUT))
    return SVG(700, 208, o, "数値比較のアソシエーションモデル。両端の画面に出る 6 桁が同じかどうかを利用者が確かめることで、途中で公開鍵がすり替えられていないことを確かめる。Just Works ではこの確認をしないので、右の状況に気づけない。")
F["e20_nc"] = _f20_nc()

# ---- 4 節: モデルの決まり方 ----
def _f20_select():
    o = []
    o.append(_f20_dev(20, 18, 170, 34, "段階 1 の交換が終わる", INK, sz=10.5))
    o.append(ARR(190, 35, 236, 35, c=MUT, lw=1.4))
    o.append(BOX(238, 12, 250, 46, "OOB のデータがあるか", "LESC: どちらか一方 ／ レガシー: 両方", GLD, GOSOFT, INK, sz=11, ssz=9))
    o.append(ARR(488, 35, 556, 35, c=GRN, lw=1.4))
    o.append(T(522, 29, "はい", "middle", 10, GRN, True))
    o.append(_f20_dev(558, 18, 124, 34, "OOB", GRN, sz=11))
    o.append(ARR(363, 58, 363, 92, c=MUT, lw=1.4))
    o.append(T(370, 80, "いいえ", "start", 10, MUT, True))
    o.append(BOX(238, 94, 250, 46, "両端とも MITM のフラグが 0 か", "どちらも中間者への保護を求めない", GLD, GOSOFT, INK, sz=11, ssz=9))
    o.append(ARR(488, 117, 556, 117, c=ALI, lw=1.4))
    o.append(T(522, 111, "はい", "middle", 10, ALI, True))
    o.append(_f20_dev(558, 100, 124, 34, "Just Works", ALI, sz=11))
    o.append(ARR(363, 140, 363, 174, c=MUT, lw=1.4))
    o.append(T(370, 162, "いいえ", "start", 10, MUT, True))
    o.append(BOX(238, 176, 250, 40, "IO 能力の表で決める（次の図）", None, SIG, SSOFT, INK, sz=11))
    o.append(T(20, 238, "LESC かレガシーかは、両端の SC のフラグで先に決まっている（両方 1 なら LESC）。", "start", 9.5, MUT))
    return SVG(700, 250, o, "アソシエーションモデルの決まり方。OOB のデータがあれば OOB、なければ MITM のフラグを見て、どちらも求めていなければ Just Works、求めていれば両端の IO 能力の組で決める。")
F["e20_select"] = _f20_select()

# ---- 4 節: IO 能力とアソシエーションモデルの表（LESC） ----
_F20_IO = ["DisplayOnly", "DisplayYesNo", "KeyboardOnly", "NoInputNoOutput", "KeyboardDisplay"]
# 行 = セントラル（Pairing Request を送る側）、列 = ペリフェラル。値: (モデル, 向き, レガシーでの違い)
_F20_TAB = [
    [("JW", "", None), ("JW", "", None), ("PE", "C 表示 → P 入力", None), ("JW", "", None), ("PE", "C 表示 → P 入力", None)],
    [("JW", "", None), ("NC", "", "Just Works"), ("PE", "C 表示 → P 入力", None), ("JW", "", None), ("NC", "", "パスキー（C 表示）")],
    [("PE", "P 表示 → C 入力", None), ("PE", "P 表示 → C 入力", None), ("PE", "両方に入力", None), ("JW", "", None), ("PE", "P 表示 → C 入力", None)],
    [("JW", "", None)] * 5,
    [("PE", "P 表示 → C 入力", None), ("NC", "", "パスキー（P 表示）"), ("PE", "C 表示 → P 入力", None), ("JW", "", None), ("NC", "", "パスキー（C 表示）")],
]
_F20_MNAME = {"JW": ("Just Works", ALI), "NC": ("数値比較", GRN), "PE": ("パスキー入力", SIG)}

def _f20_assoc():
    o = []
    x0, y0, hw, cw, hh, ch = 10, 30, 130, 110, 40, 50
    o.append(T(x0 + hw + 5 * cw / 2, 18, "ペリフェラル（Pairing Response を返す側）の IO 能力", "middle", 10.5, SIG, True))
    o.append(T(x0 + 4, y0 + 16, "セントラルの", "start", 9.5, PUR, True))
    o.append(T(x0 + 4, y0 + 30, "IO 能力 ＼", "start", 9.5, PUR, True))
    for j, nm in enumerate(_F20_IO):
        xx = x0 + hw + j * cw
        o.append(RECT(xx + 1, y0, cw - 2, hh - 2, 4, SSOFT, SIG, 1.0))
        o.append(T(xx + cw / 2, y0 + 24, nm, "middle", 9.5, SIG, True))
    for i, nm in enumerate(_F20_IO):
        yy = y0 + hh + i * ch
        o.append(RECT(x0, yy + 1, hw - 4, ch - 2, 4, PSOFT, PUR, 1.0))
        o.append(T(x0 + (hw - 4) / 2, yy + ch / 2 + 4, nm, "middle", 9.5, PUR, True))
        for j in range(5):
            m, d, leg = _F20_TAB[i][j]
            name, c = _F20_MNAME[m]
            xx = x0 + hw + j * cw
            o.append(RECT(xx + 1, yy + 1, cw - 2, ch - 2, 4, soft(c), c, 1.0, dash="4 3" if leg else None))
            lines = [(name, 10, c, True)]
            if d:
                lines.append((d, 9, INK, False))
            if leg:
                lines.append(("レガシーでは", 8.5, MUT, False))
                lines.append((leg, 8.5, MUT, False))
            tot = len(lines)
            for k, (s, sz, cc, b) in enumerate(lines):
                o.append(T(xx + cw / 2, yy + ch / 2 + 4 + (k - (tot - 1) / 2) * 12, s, "middle", sz, cc, b))
    yl = y0 + hh + 5 * ch + 20
    o.append(LEGEND(x0, yl, [(ALI, "Just Works: 中間者を防げない"), (GRN, "数値比較"), (SIG, "パスキー入力")]))
    o.append(T(x0, yl + 20, "C = セントラル、P = ペリフェラル。「C 表示 → P 入力」は、セントラルが 6 桁を表示し、利用者がペリフェラルに入力する。", "start", 9.5, MUT))
    o.append(T(x0, yl + 37, "破線の枠: レガシーペアリングでは結果が違う欄（レガシーには数値比較が無い）。", "start", 9.5, MUT))
    return SVG(700, yl + 47, o, "LE Secure Connections で、OOB を使わず、少なくとも一方が MITM のフラグを立てたときのアソシエーションモデル（Bluetooth Core Specification の表による）。行がセントラル、列がペリフェラルの IO 能力。NoInputNoOutput を含む組は、すべて Just Works になる。")
F["e20_assoc"] = _f20_assoc()

# ---- 5 節: ボンディング ----
def _f20_bond():
    o = []
    def seg(x, y, w, txt, c, sz=9.5):
        return RECT(x, y, w, 26, 4, soft(c), c, 1.2) + T(x + w / 2, y + 17, txt, "middle", sz, c, True)
    o.append(T(14, 22, "1 回目の接続", "start", 11, INK, True))
    x = 120
    for w, t, c in ((70, "接続", MUT), (210, "ペアリング（段階 1〜3）", TEA), (120, "暗号化したデータ", GRN)):
        o.append(seg(x, 8, w, t, c)); x += w + 4
    o.append(ARR(300, 36, 300, 60, c=GLD, lw=1.4))
    o.append(RECT(214, 62, 290, 34, 6, GOSOFT, GLD, 1.2))
    o.append(T(359, 77, "両端がフラッシュに保存（ボンド）", "middle", 10, GLD, True))
    o.append(T(359, 91, "相手のアドレス・識別の鍵・LTK", "middle", 9, MUT))
    o.append(T(14, 126, "2 回目以降", "start", 11, INK, True))
    x = 120
    for w, t, c in ((70, "接続", MUT), (200, "保存した LTK で暗号化を始める", GLD), (120, "暗号化したデータ", GRN)):
        o.append(seg(x, 112, w, t, c, 9.5 if w > 100 else 9.5)); x += w + 4
    o.append(ARR(359, 98, 300, 110, c=GLD, lw=1.4))
    o.append(T(530, 129, "利用者の操作は要らない", "start", 9.5, GRN, True))
    # 食い違い
    y = 156
    for k, (title, a, b, c_) in enumerate((
            ("スマートフォンだけが消した", ["スマートフォン: 鍵が無い", "→ ペアリングからやり直す"], ["機器: 古いボンドが残る", "→ 上書きを許すかを機器が決める"], GLD),
            ("機器だけが消した", ["スマートフォン: 古い LTK で", "暗号化を始めようとする"], ["機器: 鍵が無いので失敗", "→ 両方で消してやり直す"], ALI))):
        x = 10 + k * 344
        o.append(RECT(x, y, 336, 100, 8, PAN, LIN, 1.1))
        o.append(T(x + 10, y + 20, title, "start", 11, c_, True))
        o.append(_f20_dev(x + 8, y + 32, 158, 56, "", PUR))
        o.append(_f20_dev(x + 170, y + 32, 158, 56, "", SIG))
        for q, s in enumerate(a):
            o.append(T(x + 87, y + 54 + q * 16, s, "middle", 9.5, INK))
        for q, s in enumerate(b):
            o.append(T(x + 249, y + 54 + q * 16, s, "middle", 9.5, INK))
    return SVG(700, y + 110, o, "ボンディング。1 回目にペアリングで作った鍵を両端が保存し、2 回目からはペアリングをせずに暗号化を始める（上）。片方だけがボンドを消すと、記憶が食い違う（下）。")
F["e20_bond"] = _f20_bond()

# ---- 6 節: RPA の形と ah の計算（Core Specification の例。AES は計算して確かめた値） ----
def _f20_rpa():
    o = []
    # 48 ビット
    o.append(T(14, 20, "解決可能なプライベートアドレス（48 ビット。人が読む順）", "start", 11, INK, True))
    o.append(RECT(14, 30, 300, 40, 5, SSOFT, SIG, 1.4))
    o.append(T(164, 47, "prand（上位 24 ビット）", "middle", 10, SIG, True))
    o.append(T(164, 63, "70 81 94", "middle", 12, INK, True, True))
    o.append(RECT(314, 30, 300, 40, 5, GSOFT, GRN, 1.4))
    o.append(T(464, 47, "hash（下位 24 ビット）", "middle", 10, GRN, True))
    o.append(T(464, 63, "0D FB AA", "middle", 12, INK, True, True))
    o.append(W(30, 72, 30, 84, c=ALI, lw=1.2))
    _x1 = 24 + tw("0x70 = 0b", 10, True)
    _x2 = _x1 + tw("01", 11, True)
    o.append(T(24, 98, "0x70 = 0b", "start", 10, MUT, False, True))
    o.append(T(_x1, 98, "01", "start", 11, ALI, True, True))
    o.append(T(_x2, 98, "11_0000", "start", 10, MUT, False, True))
    o.append(T(160, 98, "← 最上位の 2 ビット 01 が RPA の印", "start", 9.5, ALI, True))
    # ah の筆算
    y = 128
    o.append(T(14, y, "hash = ah(IRK, prand) の計算", "start", 11, INK, True))
    rows = [("鍵（IRK）", "EC 02 34 A3 57 C8 AD 05 34 10 10 A6 0A 39 7D 9B", None, MUT),
            ("入力 16 バイト", "00 00 00 00 00 00 00 00 00 00 00 00 00 70 81 94", (13, SIG), MUT),
            ("AES-128 の結果", "15 9D 5F B7 2E BE 23 11 A4 8C 1B DC C4 0D FB AA", (13, GRN), MUT)]
    xb = 130
    step = tw("00 ", 11, True)
    for k, (lab, hexs, hl, c) in enumerate(rows):
        yy = y + 24 + k * 26
        o.append(T(xb - 10, yy, lab, "end", 10, INK, True))
        bs = hexs.split(" ")
        for q, b in enumerate(bs):
            cc = INK
            if hl and q >= hl[0]:
                cc = hl[1]
                o.append(RECT(xb + q * step - 2, yy - 13, step - 2, 18, 3, soft(hl[1]), "none", 0))
            o.append(T(xb + q * step, yy, b, "start", 11, cc, bool(hl and q >= hl[0]), True))
    o.append(T(xb + 16 * step + 6, y + 50, "← 13 バイトの 0 + prand", "start", 9.5, SIG))
    o.append(T(xb + 16 * step + 6, y + 76, "← 下位 3 バイトが hash", "start", 9.5, GRN))
    o.append(T(14, y + 106, "電波に乗る順（最下位のバイトから。17 章 7 節）:", "start", 10, INK))
    o.append(T(330, y + 106, "AA FB 0D 94 81 70", "start", 11, INK, True, True))
    return SVG(700, y + 118, o, "解決可能なプライベートアドレスの形と、hash の計算（Bluetooth Core Specification の例の値。AES-128 は実際に計算して確かめた）。上位 24 ビットは乱数 prand、下位 24 ビットは、13 バイトの 0 と prand をつないだ 16 バイトを IRK で AES-128 暗号化した結果の下位 3 バイトである。")
F["e20_rpa"] = _f20_rpa()

# ---- 6 節: アドレスが変わる様子と解決（IRK_A は上の例、IRK_B は仮の値。hash は AES で計算した値） ----
def _f20_resolve():
    o = []
    addrs = [("10:00", "70:81:94:0D:FB:AA"), ("10:15", "5A:3C:17:63:D0:C2"), ("10:30", "4F:11:E2:6C:80:90")]
    xs = [250, 400, 550]
    o.append(T(14, 22, "機器 A のアドバタイズ", "start", 11, SIG, True))
    o.append(ARR(170, 34, 690, 34, c=MUT, lw=1.2))
    o.append(T(690, 50, "時刻", "end", 9.5, MUT))
    for x, (tm, ad) in zip(xs, addrs):
        o.append(W(x, 28, x, 40, c=MUT, lw=1.2))
        o.append(T(x, 22, tm, "middle", 9.5, MUT))
        o.append(RECT(x - 68, 56, 136, 24, 4, SSOFT, SIG, 1.2))
        o.append(T(x, 72, ad, "middle", 10, INK, True, True))
    # IRK を持たない観測者
    y = 104
    o.append(T(14, y + 16, "IRK を持たない観測者", "start", 10.5, ALI, True))
    for k, x in enumerate(xs):
        o.append(RECT(x - 60, y, 120, 26, 4, ASOFT, ALI, 1.1))
        o.append(T(x, y + 17, "知らない機器 %d" % (k + 1), "middle", 10, ALI, True))
    o.append(T(14, y + 34, "（毎回別の機器に見える）", "start", 9, MUT))
    # IRK を持つ相手
    y = 152
    o.append(T(14, y + 16, "IRK_A と IRK_B を", "start", 10.5, GRN, True))
    o.append(T(14, y + 31, "持つスマートフォン", "start", 10.5, GRN, True))
    for x in xs:
        o.append(RECT(x - 60, y, 120, 26, 4, GSOFT, GRN, 1.1))
        o.append(T(x, y + 17, "機器 A と解決", "middle", 10, GRN, True))
    # 10:00 の計算
    y = 202
    o.append(T(14, y + 14, "10:00 のアドレスの解決（prand = 70 81 94、hash = 0D FB AA）", "start", 10, INK, True))
    o.append(T(30, y + 36, "ah(IRK_B, 708194) = 74 05 1E", "start", 10.5, INK, False, True))
    o.append(T(300, y + 36, "≠ 0D FB AA → 機器 B ではない", "start", 10, ALI, True))
    o.append(T(30, y + 58, "ah(IRK_A, 708194) = 0D FB AA", "start", 10.5, INK, False, True))
    o.append(T(300, y + 58, "= hash → 機器 A", "start", 10, GRN, True))
    return SVG(700, y + 70, o, "15 分ごとに RPA を作り直す機器 A の例。IRK を持たない観測者には 3 つの別の機器に見えるが、ボンドで IRK を受け取った相手は、手元の IRK ごとに hash を計算し直して、どれも機器 A だと解決できる（IRK_B は別の機器の仮の値。値はすべて AES で計算した）。")
F["e20_resolve"] = _f20_resolve()

# ---- 7 節: セキュリティモード 1 のレベル ----
def _f20_levels():
    o = []
    lv = [("レベル 1", "暗号化しない", "ペアリングしない", MUT),
          ("レベル 2", "暗号化する", "Just Works", GLD),
          ("レベル 3", "+ 中間者を防ぐ", "レガシーのパスキー・OOB", SIG),
          ("レベル 4", "+ LESC・16 バイトの鍵", "LESC で認証したもの", GRN)]
    bw, base = 160, 168
    for k, (a, b, c_, col) in enumerate(lv):
        x = 20 + k * (bw + 8)
        h = 52 + k * 30
        o.append(RECT(x, base - h, bw, h, 6, soft(col), col, 1.3))
        o.append(T(x + bw / 2, base - h + 20, a, "middle", 11.5, col, True))
        o.append(T(x + bw / 2, base - h + 37, b, "middle", 9.5, INK))
        o.append(T(x + bw / 2, base + 18, c_, "middle", 9.5, MUT))
    o.append(T(20, base + 46, "例: 画面もボタンもない機器（NoInputNoOutput）で OOB も無い → どの相手ともレベル 2 まで。", "start", 9.5, INK))
    o.append(T(20, base + 63, "例: 6 桁を表示して「はい」を受けられる機器 + スマートフォン（LESC の数値比較）→ レベル 4。", "start", 9.5, INK))
    return SVG(700, base + 74, o, "セキュリティモード 1 のレベル。上のレベルほど守りが強い。どのレベルに届くかは、両端の IO 能力と方式（4 節）で決まる。下の文字は、そのレベルになるペアリング。")
F["e20_levels"] = _f20_levels()

# ---- 7 節: 属性の条件と誤りの応答 ----
def _f20_perm():
    lanes = [("GATT クライアント（スマートフォン）", PUR), ("GATT サーバ（機器）", SIG)]
    msgs = [(0, 1, "Write Request（パスフレーズの値）"),
            ("note", 1, "条件: 認証が必要（レベル 3 以上）\nいまの接続: 暗号化していない", {"c": ALI}),
            (1, 0, "Error Response（認証が足りない）", {"c": ALI}),
            (0, 1, "ペアリング（数値比較）と暗号化", {"c": TEA, "dash": True}),
            ("note", 1, "接続はレベル 4 になった", {"c": TEA}),
            (0, 1, "Write Request（もう一度）"),
            ("note", 1, "条件を満たすので書き込む", {"c": GRN}),
            (1, 0, "Write Response", {"c": GRN})]
    return SEQFIG(lanes, msgs, "暗号化や認証が必要な属性を、条件を満たさない接続で書き込もうとしたときのやり取りの例。サーバは ATT の誤りの応答で不足を知らせ、クライアントはペアリングと暗号化をしてから、もう一度書き込む。", w=700)
F["e20_perm"] = _f20_perm()
