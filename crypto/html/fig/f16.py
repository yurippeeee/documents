# 16 章 RSA の図（figures.py の関数・定数をそのまま使う）
# 色の約束: 公開 = 青、秘密 = 赤（ALI）、平文・計算結果 = SIG
# ほかの章の fNN.py と名前が衝突しないよう、補助関数と定数には _r16 を付ける

_R16_BL = "var(--blue)"
_R16_BS = "rgba(47,111,158,.14)"


import re as _r16_re

def _r16_T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=False):
    """T と同じだが、^{…} を上付き、_{…} を下付きにする"""
    if c == LIN:
        c = MUT
    out, cur = [], 0.0
    for p in _r16_re.split(r"(\^\{[^}]*\}|_\{[^}]*\})", s):
        if not p:
            continue
        if p.startswith("^{") or p.startswith("_{"):
            t = -sz * 0.38 if p[0] == "^" else sz * 0.2
            out.append('<tspan dy="%g" font-size="%g">%s</tspan>' % (t - cur, sz * 0.72, E(p[2:-1])))
            cur = t
        else:
            out.append('<tspan dy="%g">%s</tspan>' % (-cur, E(p)) if cur else E(p))
            cur = 0.0
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="%s" font-weight="%s">%s</text>'
            % (x, y, a, sz, c, MONO if mono else "var(--sans)", "700" if b else "400", "".join(out)))


def _r16_kind(kind):
    """kind: 'pub'（公開）/ 'sec'（秘密）/ 'res'（結果）/ 'neu'（どちらでもない）→ (線の色, 塗り)"""
    return {"pub": (_R16_BL, _R16_BS), "sec": (ALI, ASOFT), "res": (SIG, SSOFT), "neu": (LIN, PAN)}[kind]


def _r16_box(x, y, w, h, t1, t2=None, kind="neu", sz=13, ssz=11, mono1=False, tc=None):
    """1 行目（太字）と 2 行目（説明）を持つ箱"""
    c, fl = _r16_kind(kind)
    col = tc if tc else (INK if kind == "neu" else c)
    o = [RECT(x, y, w, h, 9, fl, c, 1.6 if kind != "neu" else 1.3)]
    if t2:
        o.append(_r16_T(x + w / 2, y + h / 2 - 3, t1, "middle", sz, col, True, mono1))
        o.append(_r16_T(x + w / 2, y + h / 2 + ssz + 3, t2, "middle", ssz, MUT))
    else:
        o.append(_r16_T(x + w / 2, y + h / 2 + sz * 0.36, t1, "middle", sz, col, True, mono1))
    return "".join(o)


def _r16_cells(x, y, vals, cw, ch, hl=(), hlc=SIG, hlf=SSOFT, sz=12, mono=True, c=LIN, fill=PAN):
    """値を 1 マスずつ横に並べる。hl は強調するマスの番号の集合"""
    o = []
    for i, v in enumerate(vals):
        on = i in hl
        o.append(RECT(x + i * cw, y, cw - 4, ch, 4, hlf if on else fill, hlc if on else c, 1.5 if on else 1.1))
        o.append(T(x + i * cw + (cw - 4) / 2, y + ch / 2 + sz * 0.36, str(v), "middle", sz,
                   hlc if on else INK, on, mono))
    return "".join(o)


# 1 節: 誰が何を持つか
def _f16_roles():
    o = []
    # 公開の場所
    o.append(RECT(300, 12, 220, 64, 10, _R16_BS, _R16_BL, 1.6))
    o.append(T(410, 38, "Bob の公開鍵", "middle", 14, _R16_BL, True))
    o.append(T(410, 60, "誰でも見られる場所に置く", "middle", 11, MUT))
    # Alice
    o.append(RECT(20, 112, 220, 124, 12, PAN, LIN, 1.4))
    o.append(T(130, 136, "Alice（送信者）", "middle", 13.5, INK, True))
    o.append(_r16_box(36, 152, 76, 32, "平文", None, "res", 12))
    o.append(ARR(114, 168, 146, 168, INK, 1.5))
    o.append(_r16_box(148, 152, 76, 32, "暗号文", None, "neu", 12))
    o.append(T(130, 210, "② Bob の公開鍵で暗号化", "middle", 11.5, _R16_BL, True))
    # Bob
    o.append(RECT(580, 112, 220, 124, 12, PAN, LIN, 1.4))
    o.append(T(690, 136, "Bob（受信者）", "middle", 13.5, INK, True))
    o.append(_r16_box(596, 152, 76, 32, "暗号文", None, "neu", 12))
    o.append(ARR(674, 168, 706, 168, INK, 1.5))
    o.append(_r16_box(708, 152, 76, 32, "平文", None, "res", 12))
    o.append(T(690, 210, "③ 自分の秘密鍵で復号", "middle", 11.5, ALI, True))
    o.append(_r16_box(632, 246, 116, 30, "秘密鍵", None, "sec", 12))
    o.append(T(690, 292, "Bob だけが持つ", "middle", 11, ALI))
    # 公開・取得の矢印
    o.append(ARR(690, 110, 524, 52, _R16_BL, 1.6))
    o.append(T(640, 66, "① 鍵の組を作り、", "start", 11, _R16_BL, True))
    o.append(T(640, 82, "公開鍵だけを置く", "start", 11, _R16_BL, True))
    o.append(ARR(296, 52, 130, 108, _R16_BL, 1.6))
    o.append(T(186, 66, "取ってくる", "end", 11, _R16_BL, True))
    # 通信路
    o.append(ARR(242, 168, 576, 168, INK, 2))
    o.append(T(410, 158, "暗号文を送る（通信路）", "middle", 11.5, INK, True))
    # Eve
    o.append(RECT(300, 232, 220, 62, 10, SCR, MUT, 1.3, "5,3"))
    o.append(T(410, 254, "Eve（盗聴者）", "middle", 12.5, INK, True))
    o.append(T(410, 274, "見える: 公開鍵と暗号文", "middle", 11, INK))
    o.append(T(410, 289, "見えない: 秘密鍵", "middle", 11, ALI))
    o.append(W(410, 230, 410, 176, c=MUT, lw=1.3, dash="4,3"))
    return SVG(820, 304, o, "RSA での役割分担。鍵の組を作るのは受信者の Bob で、公開鍵を誰でも見られる場所に置く。"
               "送信者の Alice はそれで暗号化し、Bob は自分だけが持つ秘密鍵で復号する。盗聴者の Eve には公開鍵と暗号文が見えている。")
F["e16_roles"] = _f16_roles()


# 1 節: 鍵生成の手順（公開するものと秘密にするもの）
def _f16_keygen():
    o = []
    o.append(T(200, 24, "公開するもの", "middle", 13, _R16_BL, True))
    o.append(T(560, 24, "秘密にするもの", "middle", 13, ALI, True))
    o.append(W(380, 14, 380, 386, c=LIN, lw=1.2, dash="5,4"))
    # 行 1: p, q
    o.append(_r16_box(430, 42, 120, 52, "p = 61", "① 素数", "sec", 14, 11, True))
    o.append(_r16_box(570, 42, 120, 52, "q = 53", "① 素数", "sec", 14, 11, True))
    # 行 2: n, φ
    o.append(_r16_box(80, 134, 240, 56, "n = pq = 3233", "② 法", "pub", 14, 11, True))
    o.append(_r16_box(440, 134, 240, 56, "φ(n) = 60 × 52 = 3120", "③ (p − 1)(q − 1)", "sec", 14, 11, True))
    # 行 3: e, d
    o.append(_r16_box(80, 230, 240, 56, "e = 17", "④ gcd(e, φ(n)) = 1 となるように選ぶ", "pub", 14, 10.5, True))
    o.append(_r16_box(440, 230, 240, 56, "d = 2753", "⑤ ed ≡ 1 (mod φ(n))（拡張ユークリッド）", "sec", 14, 10.5, True))
    # 行 4: 鍵
    o.append(RECT(80, 326, 240, 52, 10, _R16_BL, _R16_BL, 1.6))
    o.append(T(200, 357, "公開鍵 (n, e) = (3233, 17)", "middle", 13.5, PAN, True))
    o.append(RECT(440, 326, 240, 52, 10, ALI, ALI, 1.6))
    o.append(T(560, 357, "秘密鍵 d = 2753", "middle", 13.5, PAN, True))
    # 矢印
    o.append(ARR(470, 96, 250, 132, MUT, 1.4))
    o.append(ARR(610, 96, 300, 132, MUT, 1.4))
    o.append(ARR(500, 96, 520, 132, MUT, 1.4))
    o.append(ARR(630, 96, 610, 132, MUT, 1.4))
    o.append(ARR(560, 192, 560, 228, MUT, 1.4))
    o.append(ARR(440, 182, 322, 240, MUT, 1.3))
    o.append(T(392, 226, "条件", "middle", 10.5, MUT))
    o.append(ARR(322, 266, 438, 266, MUT, 1.4))
    o.append(ARR(200, 288, 200, 324, MUT, 1.4))
    o.append(W(80, 162, 58, 162, 58, 352, 72, 352, c=MUT, lw=1.4))
    o.append(ARR(66, 352, 78, 352, MUT, 1.4, 6))
    o.append(ARR(560, 288, 560, 324, MUT, 1.4))
    return SVG(760, 392, o, "1 節の手順を p = 61、q = 53、e = 17 で行った結果。矢印は、どの値からどの値を計算するかを表す。"
               "公開するのは n と e だけで、それ以外はすべて秘密にする。")
F["e16_keygen"] = _f16_keygen()


# 2 節: 繰り返し二乗法による暗号化と復号
def _r16_chain(o, y0, title, base_vals, bits, prods, x0=112, cw=58, final_note=None):
    o.append(_r16_T(20, y0, title, "start", 13, INK, True))
    yh, yc, yb, yp = y0 + 24, y0 + 32, y0 + 82, y0 + 96
    o.append(T(x0 - 12, yh + 0, "指数", "end", 10.5, MUT))
    o.append(T(x0 - 12, yc + 20, "値", "end", 10.5, MUT))
    o.append(T(x0 - 12, yb, "2 進の桁", "end", 10.5, MUT))
    o.append(T(x0 - 12, yp + 17, "掛けた結果", "end", 10.5, MUT))
    sel = {i for i, b in enumerate(bits) if b == 1}
    for i in range(len(base_vals)):
        o.append(T(x0 + i * cw + (cw - 4) / 2, yh, str(2 ** i), "middle", 10.5, MUT, False, True))
        o.append(T(x0 + i * cw + (cw - 4) / 2, yb, str(bits[i]), "middle", 12, SIG if i in sel else MUT, i in sel, True))
    o.append(_r16_cells(x0, yc, base_vals, cw, 28, hl=sel, sz=12))
    last = None
    for i in sorted(sel):
        v = prods[i]
        fin = i == max(sel)
        o.append(RECT(x0 + i * cw, yp, cw - 4, 26, 4, SSOFT if fin else PAN, SIG if fin else MUT, 1.6 if fin else 1.1))
        o.append(T(x0 + i * cw + (cw - 4) / 2, yp + 17.5, str(v), "middle", 12, SIG if fin else INK, fin, True))
        if last is not None:
            o.append(ARR(x0 + last * cw + cw - 2, yp + 13, x0 + i * cw - 2, yp + 13, MUT, 1.1, 5))
        last = i
    if final_note:
        o.append(T(x0 + len(base_vals) * cw + 8, yp + 17.5, final_note, "start", 11.5, SIG, True))

def _f16_sqmul():
    o = []
    _r16_chain(o, 22, "暗号化: C = 65^{17} mod 3233（17 = 2^{4} + 2^{0}）",
               [65, 992, 1232, 1547, 789], [1, 0, 0, 0, 1], {0: 65, 4: 2790},
               final_note="→ C = 2790")
    o.append(W(20, 150, 800, 150, c=LIN, lw=1))
    _r16_chain(o, 176, "復号: 2790^{2753} mod 3233（2753 = 2^{11} + 2^{9} + 2^{7} + 2^{6} + 2^{0}）",
               [2790, 2269, 1425, 301, 77, 2696, 632, 1765, 1846, 134, 1791, 545],
               [1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1],
               {0: 2790, 6: 1295, 7: 3177, 9: 2195, 11: 65})
    o.append(T(20, 318, "値の行は、左から右へ 2 乗を繰り返したもの（毎回 3233 で割った余り）。2 進の桁が 1 の列（色付き）だけを順に掛け合わせる。",
               "start", 11.5, INK))
    return SVG(820, 332, o, "1 節の鍵での暗号化（上）と復号（下）。「指数」は各列の値が底の何乗か、「2 進の桁」はその列の 2 のべきが"
               "指数（17 や 2753）の 2 進表示に含まれるか（1）否か（0）を表す。左から 2⁰、2¹、2²、… の桁の順に並べてある。")
F["e16_sqmul"] = _f16_sqmul()


# 2 節: e = 65537 と d の 2 進表示
def _f16_ebits():
    o = []
    eb = format(65537, "b")
    o.append(T(20, 26, "e = 65537 の 2 進表示（17 桁）", "start", 12.5, _R16_BL, True))
    o.append(_r16_cells(20, 36, list(eb), 24, 26, hl={i for i, b in enumerate(eb) if b == "1"},
                        hlc=_R16_BL, hlf=_R16_BS, sz=12))
    o.append(T(450, 54, "2 乗 16 回 + 掛け算 1 回 = 17 回", "start", 12, INK, True))
    import random as _rnd
    r = _rnd.Random(16)
    db = "1" + "".join(r.choice("01") for _ in range(16))
    o.append(T(20, 98, "d の 2 進表示のイメージ（2048 ビットの鍵なら 2048 桁。先頭の 17 桁だけを示す）", "start", 12.5, ALI, True))
    o.append(_r16_cells(20, 108, list(db), 24, 26, hl={i for i, b in enumerate(db) if b == "1"},
                        hlc=ALI, hlf=ASOFT, sz=12))
    o.append(T(432, 126, "…", "middle", 14, MUT, True))
    o.append(T(450, 116, "1 はおよそ半分", "start", 11, MUT))
    o.append(T(450, 138, "2 乗 約 2047 回 + 掛け算 約 1024 回", "start", 12, INK, True))
    return SVG(760, 156, o, "繰り返し二乗法の手間は、指数の桁数（2 乗の回数）と 1 の個数（掛け算の回数）で決まる。"
               "公開指数 e は小さく 1 の少ない値を選べるが、秘密指数 d は n とほぼ同じ桁数のランダムな数になる。")
F["e16_ebits"] = _f16_ebits()


# 3 節: M^k mod n の列（n = 55）
def _f16_cycle():
    o = []
    n = 55
    o.append(_r16_T(20, 22, "M = 2（n = 55 と互いに素）: 2^{k} mod 55", "start", 13, INK, True))
    x0, cw = 112, 30
    for r in range(3):
        y = 34 + r * 32
        ks = list(range(1 + 20 * r, 21 + 20 * r))
        vals = [pow(2, k, n) for k in ks]
        o.append(T(x0 - 10, y + 18, "k = %d〜%d" % (ks[0], ks[-1]), "end", 10.5, MUT))
        o.append(_r16_cells(x0, y, vals, cw, 26, hl={i for i, v in enumerate(vals) if v == 2}, sz=11))
    o.append(T(x0 + 13, 146, "↑ k = 1", "start", 10.5, SIG, True))
    o.append(T(x0 + 13, 160, "k = 21、41（= φ(n) + 1）でも 2 に戻る。20 ごとに同じ並びを繰り返すので、k = 81（= ed）も 2", "start", 10.5, SIG))
    # 下段: M = 10
    o.append(T(20, 194, "M = 10（p = 5 の倍数）: 法 5 と法 11 に分けて見る", "start", 13, INK, True))
    x1, cw2 = 112, 52
    rows = [("法 5", [pow(10, k, 5) for k in range(1, 11)]),
            ("法 11", [pow(10, k, 11) for k in range(1, 11)]),
            ("法 55", [pow(10, k, 55) for k in range(1, 11)])]
    for j in range(10):
        o.append(T(x1 + j * cw2 + 24, 216, "k = %d" % (j + 1), "middle", 10, MUT))
    for r, (lab, vals) in enumerate(rows):
        y = 224 + r * 32
        o.append(T(x1 - 10, y + 18, lab, "end", 11, INK, True))
        hl = {j for j in range(10) if j % 2 == 0}
        o.append(_r16_cells(x1, y, vals, cw2, 26, hl=hl, sz=12))
    o.append(T(x1 + 10 * cw2 + 6, 241, "常に 0（M ≡ 0）", "start", 10.5, MUT))
    o.append(T(x1 + 10 * cw2 + 6, 273, "10 と 1 を交互", "start", 10.5, MUT))
    o.append(T(x1 + 10 * cw2 + 6, 305, "k が奇数なら 10", "start", 10.5, SIG, True))
    return SVG(800, 330, o, "p = 5、q = 11、n = 55、φ(n) = 40、e = 3、d = 27（ed = 81）の例。色付きのマスは M と同じ値。"
               "上段は Mᵏ mod n を k = 1 から順に並べ、20 個ずつ折り返した。下段は k が奇数の列に色を付けた。")
F["e16_cycle"] = _f16_cycle()


# 3 節: CRT を使った復号
def _f16_crt():
    o = []
    o.append(_r16_box(20, 116, 100, 56, "C = 2790", "暗号文", "neu", 13.5, 10.5, True))
    lanes = [(40, "法 p = 61", ["2790 mod 61 = 45", "2753 mod 60 = 53", "45^{53} mod 61 = 4"], "m_{p} = 4"),
             (190, "法 q = 53", ["2790 mod 53 = 34", "2753 mod 52 = 49", "34^{49} mod 53 = 12"], "m_{q} = 12")]
    subs = ["暗号文を小さな法へ", "指数を p − 1 で割った余りへ", "小さなべき乗"]
    xs = [158, 330, 502]
    for y, lab, items, res in lanes:
        o.append(T(158, y - 10, lab, "start", 12, INK, True))
        for k, (x, it) in enumerate(zip(xs, items)):
            sub = subs[k] if y == 40 else subs[k].replace("p − 1", "q − 1")
            o.append(_r16_box(x, y, 156, 52, it, sub, "res" if k == 2 else "neu", 12, 10, True))
            if k:
                o.append(ARR(x - 14, y + 26, x - 2, y + 26, MUT, 1.3, 5))
        o.append(ARR(120, 144, 154, y + 26, MUT, 1.3, 5))
        o.append(ARR(660, y + 26, 694, 144, MUT, 1.3, 5))
        o.append(_r16_T(664, y + 26 + (-12 if y == 40 else 22), res, "start", 11.5, SIG, True))
    o.append(_r16_box(696, 112, 112, 64, "M = 65", "中国剰余定理で合わせる", "res", 15, 9.5, True))
    o.append(T(20, 272, "法 3233・指数 2753 のべき乗 1 本の代わりに、法も指数も約半分の桁数のべき乗を 2 本行う。",
               "start", 11.5, INK))
    o.append(T(20, 292, "1 本あたりの手間は約 1/8 になり、全体で約 4 倍速い（15 章 3 節）。", "start", 11.5, INK))
    return SVG(820, 306, o, "1 節の鍵で C = 2790 を復号する計算を、法 61 と法 53 に分けて行う。"
               "指数を p − 1、q − 1 で割った余りに減らしてよいのは、フェルマーの小定理による。")
F["e16_crt"] = _f16_crt()


# 4 節: 署名の流れ（暗号化との比較と数値例）
def _f16_sign():
    o = []
    rows = [(34, "暗号化", ["平文 M", "暗号文 C", "平文 M"],
             [("公開鍵 (n, e) で（誰でも）", _R16_BL), ("秘密鍵 d で（Bob だけ）", ALI)]),
            (92, "署名", ["ハッシュ値 h", "署名 σ", "h に戻るか確かめる"],
             [("秘密鍵 d で（Bob だけ）", ALI), ("公開鍵 (n, e) で（誰でも）", _R16_BL)])]
    xs = [(96, 230), (366, 500), (636, 800)]
    for y, lab, nodes, arrs in rows:
        o.append(T(20, y + 5, lab, "start", 13, INK, True))
        for (x1, x2), nd in zip(xs, nodes):
            o.append(RECT(x1, y - 14, x2 - x1, 28, 7, PAN, LIN, 1.2))
            o.append(T((x1 + x2) / 2, y + 4.5, nd, "middle", 12, INK, True))
        for k, (al, ac) in enumerate(arrs):
            xa, xb = xs[k][1], xs[k + 1][0]
            o.append(ARR(xa + 4, y, xb - 4, y, ac, 2))
            o.append(T((xa + xb) / 2, y - 8, al, "middle", 10.5, ac, True))
    o.append(W(20, 128, 800, 128, c=LIN, lw=1))
    # 数値例
    o.append(RECT(20, 142, 330, 172, 12, PAN, LIN, 1.3))
    o.append(T(185, 164, "Bob（署名する人）", "middle", 13, INK, True))
    o.append(_r16_box(36, 180, 116, 34, "メッセージ", None, "neu", 12))
    o.append(ARR(154, 197, 194, 197, MUT, 1.4))
    o.append(T(174, 190, "H", "middle", 10.5, MUT, True))
    o.append(_r16_box(196, 180, 136, 34, "h = 123", None, "neu", 13, mono1=True))
    o.append(ARR(264, 216, 264, 254, ALI, 1.6))
    o.append(_r16_T(272, 240, "h^{d} mod n", "start", 11, ALI, True))
    o.append(_r16_box(196, 256, 136, 34, "σ = 2746", None, "sec", 13, mono1=True))
    o.append(ARR(352, 228, 424, 228, INK, 2))
    o.append(T(388, 216, "メッセージ", "middle", 10.5, INK, True))
    o.append(T(388, 246, "と σ を送る", "middle", 10.5, INK, True))
    o.append(RECT(426, 142, 374, 172, 12, PAN, LIN, 1.3))
    o.append(T(613, 164, "検証する人（公開鍵を持つ誰でも）", "middle", 13, INK, True))
    o.append(_r16_box(442, 180, 150, 34, "届いたメッセージ", None, "neu", 12))
    o.append(ARR(594, 197, 630, 197, MUT, 1.4))
    o.append(T(612, 190, "H", "middle", 10.5, MUT, True))
    o.append(_r16_box(632, 180, 110, 34, "123", None, "neu", 13, mono1=True))
    o.append(_r16_box(442, 256, 150, 34, "届いた σ = 2746", None, "neu", 12))
    o.append(ARR(594, 273, 630, 273, _R16_BL, 1.6))
    o.append(_r16_T(612, 300, "σ^{e} mod n", "middle", 10.5, _R16_BL, True))
    o.append(_r16_box(632, 256, 110, 34, "123", None, "pub", 13, mono1=True))
    o.append(T(687, 241, "=", "middle", 20, SIG, True))
    o.append(T(752, 236, "一致", "start", 11.5, SIG, True))
    o.append(T(752, 252, "→ 有効", "start", 11.5, SIG, True))
    return SVG(820, 326, o, "上: 暗号化と署名で、2 つの鍵の役割が入れ替わる。下: 1 節の鍵（n = 3233、e = 17、d = 2753）で"
               "ハッシュ値 h = 123 に署名し、検証する例。H はハッシュ関数。")
F["e16_sign"] = _f16_sign()


# 5 節: 攻撃者が平文にたどり着く経路
def _f16_attack():
    o = []
    o.append(RECT(20, 46, 140, 110, 10, _R16_BS, _R16_BL, 1.6))
    o.append(T(90, 68, "公開されている", "middle", 12, _R16_BL, True))
    for k, t in enumerate(["n = 3233", "e = 17", "C = 2790"]):
        o.append(T(90, 94 + k * 21, t, "middle", 12.5, INK, True, True))
    o.append(RECT(232, 74, 100, 54, 9, ASOFT, ALI, 1.6))
    o.append(T(282, 97, "p = 61", "middle", 12.5, ALI, True, True))
    o.append(T(282, 116, "q = 53", "middle", 12.5, ALI, True, True))
    for x, t1 in [(410, "φ(n) = 3120"), (570, "d = 2753"), (720, "M = 65")]:
        kind = "res" if t1.startswith("M") else "sec"
        o.append(_r16_box(x, 74, 100 if x < 700 else 82, 54, t1, None, kind, 12.5, 12, True))
    # 矢印
    o.append(ARR(162, 101, 228, 101, ALI, 3))
    o.append(T(195, 90, "素因数分解", "middle", 11, ALI, True))
    o.append(T(195, 122, "難しい", "middle", 11, ALI, True))
    for xa, xb, lab in [(334, 406, "(p−1)(q−1)"), (512, 566, "逆元"), (672, 716, "C^{d}")]:
        o.append(ARR(xa, 101, xb, 101, SIG, 1.8))
        o.append(_r16_T((xa + xb) / 2, 90, lab, "middle", 10.5, SIG, True))
        o.append(T((xa + xb) / 2, 122, "易しい", "middle", 10.5, SIG))
    o.append(T(490, 40, "1 節の手順 ③⑤ と同じ計算", "middle", 11, MUT))
    o.append(W(410, 48, 570, 48, c=MUT, lw=1))
    # 直接の経路
    o.append(W(90, 158, 90, 194, 761, 194, c=MUT, lw=1.5, dash="6,4"))
    o.append(ARR(761, 194, 761, 132, MUT, 1.5))
    o.append(T(420, 186, "C から M を直接求める（法 n での e 乗根、RSA 問題）", "middle", 11.5, INK, True))
    o.append(T(420, 212, "素因数分解を経由しない効率のよい方法は知られていない", "middle", 11, MUT))
    return SVG(820, 226, o, "1 節の鍵で、盗聴者が平文 65 にたどり着く経路。上の経路は最初の素因数分解だけが難しく、"
               "あとは Bob の鍵生成と同じ易しい計算である。")
F["e16_attack"] = _f16_attack()


# 5 節: 素因数分解に必要な計算量
def _f16_factor():
    o = []
    X0, X1, Y0, Y1 = 78, 730, 300, 30
    xm, ym = 8192.0, 260.0
    X = lambda b: X0 + (X1 - X0) * b / xm
    Y = lambda v: Y0 - (Y0 - Y1) * v / ym
    for v in [0, 64, 128, 192, 256]:
        o.append(W(X0, Y(v), X1, Y(v), c=LIN, lw=0.8))
        o.append(T(X0 - 8, Y(v) + 4, str(v), "end", 10.5, MUT, False, True))
    for b in [0, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192]:
        o.append(W(X(b), Y0, X(b), Y0 + 4, c=MUT, lw=1))
        o.append(T(X(b), Y0 + 17, str(b), "middle", 10, MUT, False, True))
    o.append(W(X0, Y0, X1, Y0, c=MUT, lw=1.3))
    o.append(W(X0, Y0, X0, Y1 - 6, c=MUT, lw=1.3))
    o.append(T((X0 + X1) / 2, Y0 + 36, "n のビット数", "middle", 11.5, INK, True))
    o.append(T(20, 20, "必要な計算量（2 の何乗回か）", "start", 11.5, INK, True))
    # 目安線
    o.append(W(X0, Y(128), X1, Y(128), c=ALI, lw=1.4, dash="6,4"))
    o.append(_r16_T(X1, Y(128) - 6, "2^{128} 回（現実には不可能とされる目安）", "end", 10.5, ALI, True))
    # 試し割り・ρ 法
    o.append(PL([(X(0), Y(0)), (X(520), Y(260))], MUT, 2))
    o.append(PL([(X(0), Y(0)), (X(1040), Y(260))], _R16_BL, 2))
    o.append(W(X(470), Y(235), X(1500), Y(240), c=MUT, lw=0.9))
    o.append(T(X(1500) + 4, Y(240) + 4, "試し割り（約 √n 回）", "start", 11, MUT, True))
    o.append(W(X(860), Y(215), X(1500), Y(212), c=_R16_BL, lw=0.9))
    o.append(T(X(1500) + 4, Y(212) + 4, "ポラードの ρ 法（約 n の 4 乗根 回）", "start", 11, _R16_BL, True))
    # GNFS（NIST の推定値）
    pts = [(1024, 80), (2048, 112), (3072, 128), (7680, 192)]
    o.append(PL([(X(b), Y(v)) for b, v in pts], SIG, 2.4))
    for b, v in pts:
        o.append(D(X(b), Y(v), SIG, 4))
        o.append(T(X(b) + 6, Y(v) + 16, "%d → %d" % (b, v), "start", 10, SIG, True, True))
    o.append(T(X(5300), Y(176), "一般数体ふるい法（推定値）", "middle", 11, SIG, True))
    # RSA-250
    o.append(W(X(829), Y0, X(829), Y(40), c=FNT, lw=1.2, dash="3,3"))
    o.append(T(X(829) + 4, Y(36), "RSA-250（829 ビット）", "start", 10, MUT))
    o.append(T(X(829) + 4, Y(26), "2020 年に分解", "start", 10, MUT))
    return SVG(760, 344, o, "n を素因数分解するのに必要な計算量の目安。試し割りと ρ 法は"
               "ビット数に比例して増えるが、一般数体ふるい法は増え方がずっと緩やかである。"
               "一般数体ふるい法の値は、鍵長の比較（15 章 5 節）に使われる米国 NIST の推定値。")
F["e16_factor"] = _f16_factor()


# 5 節: 同じ平文は同じ暗号文になる（辞書攻撃）
def _f16_dict():
    o = []
    o.append(_r16_box(20, 70, 170, 60, "C = 391", "Eve が盗聴した暗号文", "neu", 15, 11, True))
    o.append(T(330, 26, "Eve が候補を公開鍵で暗号化する", "middle", 12.5, INK, True))
    cands = [(100, 1773), (200, 2616), (300, 391)]
    for k, (m, c) in enumerate(cands):
        y = 40 + k * 46
        hit = c == 391
        o.append(_r16_box(236, y, 110, 34, "候補 %d" % m, None, "res" if hit else "neu", 12.5))
        o.append(ARR(348, y + 17, 388, y + 17, _R16_BL, 1.4))
        o.append(_r16_box(390, y, 200, 34, "%d^{17} mod 3233 = %d" % (m, c), None, "pub" if hit else "neu", 12, mono1=True))
        o.append(T(606, y + 22, "一致" if hit else "×", "start", 12.5, SIG if hit else MUT, True))
        o.append(W(192, 100, 214, 100, 214, y + 17, 232, y + 17, c=FNT, lw=1, dash="3,3"))
    o.append(T(650, 154, "→ 平文は 300", "start", 13, SIG, True))
    o.append(T(20, 196, "秘密鍵は一度も使っていない。候補が少ないと、公開鍵だけで平文が特定される。", "start", 11.5, INK))
    return SVG(760, 210, o, "入札額が 100、200、300 のどれかだと分かっている場合。教科書どおりの RSA は同じ平文を必ず同じ暗号文にするので、"
               "Eve は候補を自分で暗号化して見比べるだけで平文を知る。")
F["e16_dict"] = _f16_dict()


# 5 節: ブラインディング攻撃
def _f16_blind():
    o = []
    o.append(T(170, 22, "Eve（攻撃者）", "middle", 13, INK, True))
    o.append(T(650, 22, "オラクル（復号するサーバ）", "middle", 13, INK, True))
    o.append(W(170, 32, 170, 278, c=LIN, lw=1.2, dash="4,4"))
    o.append(W(650, 32, 650, 278, c=LIN, lw=1.2, dash="4,4"))
    o.append(RECT(20, 40, 300, 62, 8, PAN, LIN, 1.2))
    o.append(_r16_T(32, 60, "① r = 2 を選び、C を r^{e} 倍する", "start", 11.5, INK, True))
    o.append(_r16_T(32, 82, "C' = 2790 × 2^{17} mod 3233", "start", 11.5, INK, False, True))
    o.append(T(32, 97, "= 2790 × 1752 mod 3233 = 3017", "start", 11.5, ALI, True, True))
    o.append(ARR(172, 120, 646, 120, INK, 1.8))
    o.append(T(410, 112, "「3017 を復号して」", "middle", 11.5, INK, True))
    o.append(RECT(500, 132, 300, 62, 8, PAN, LIN, 1.2))
    o.append(T(512, 152, "② 3017 ≠ 2790 なので断らない", "start", 11.5, INK, True))
    o.append(_r16_T(512, 174, "3017^{2753} mod 3233 = 130", "start", 11.5, INK, False, True))
    o.append(T(512, 189, "（秘密鍵 d で復号）", "start", 10.5, MUT))
    o.append(ARR(648, 210, 174, 210, INK, 1.8))
    o.append(T(410, 202, "「130」", "middle", 11.5, INK, True))
    o.append(RECT(20, 222, 300, 56, 8, SSOFT, SIG, 1.4))
    o.append(T(32, 242, "③ r で割る（r の逆元を掛ける）", "start", 11.5, INK, True))
    o.append(_r16_T(32, 264, "130 × 2^{−1} ≡ 130 × 1617 ≡ 65", "start", 11.5, SIG, True, True))
    o.append(_r16_T(410, 302, "オラクルが返すのは (C r^{e})^{d} ≡ C^{d} r^{ed} ≡ M r (mod n)", "middle", 12, INK, True))
    return SVG(820, 316, o, "オラクルは狙いの暗号文 C = 2790 そのものの復号は断るが、ほかの暗号文なら復号して返す。"
               "Eve は C を rᵉ 倍して別の暗号文に見せかけ、返ってきた Mr を r で割って M = 65 を得る。")
F["e16_blind"] = _f16_blind()


# 5 節: 小さな e と短い平文
def _f16_lowexp():
    o = []
    n = 3127
    X0, X1 = 60, 700
    X = lambda v: X0 + (X1 - X0) * v / 3500.0
    o.append(T(20, 22, "n = 3127（= 53 × 59）、e = 3 のとき", "start", 12.5, INK, True))
    y = 66
    o.append(RECT(X(0), y - 8, X(n) - X(0), 16, 4, _R16_BS, _R16_BL, 1.2))
    o.append(T(X(0), y + 26, "0", "middle", 10.5, MUT, False, True))
    o.append(T(X(n), y + 26, "n = 3127", "middle", 10.5, _R16_BL, True, True))
    o.append(W(X(n), y - 14, X(n), y + 14, c=_R16_BL, lw=1.6))
    # 14^3
    o.append(D(X(2744), y, SIG, 5))
    o.append(_r16_T(X(2744), y - 16, "14^{3} = 2744", "middle", 11.5, SIG, True, True))
    # 15^3
    o.append(D(X(3375), y, ALI, 5))
    o.append(_r16_T(X(3375), y - 16, "15^{3} = 3375", "middle", 11.5, ALI, True, True))
    o.append(W(X(3375), y + 7, X(3375), y + 30, X(248), y + 30, c=ALI, lw=1.3))
    o.append(ARR(X(248), y + 30, X(248), y + 10, ALI, 1.3, 6))
    o.append(T((X(3375) + X(248)) / 2, y + 44, "n を引いて 0 以上 n 未満に戻す", "middle", 10.5, ALI))
    o.append(D(X(248), y, ALI, 4))
    o.append(T(X(248), y - 16, "248", "middle", 11, ALI, True, True))
    o.append(_r16_T(420, y + 70, "14^{3} は n 未満なので、余りを取っても変わらず C = 2744。普通の 3 乗根で 14 が出る", "middle", 11, SIG))
    o.append(_r16_T(420, y + 86, "15^{3} は n を超えるので C = 3375 − 3127 = 248 になり、248 の 3 乗根は整数にならない", "middle", 11, ALI))
    # 実際の大きさ
    y2 = 206
    o.append(T(20, y2 - 18, "実際の大きさ（ビット数を長さで表す）", "start", 12.5, INK, True))
    o.append(RECT(200, y2, 500, 22, 4, _R16_BS, _R16_BL, 1.2))
    o.append(T(190, y2 + 15, "n: 2048 ビット", "end", 11, _R16_BL, True))
    o.append(RECT(200, y2 + 32, 500 * 384 / 2048.0, 22, 4, SSOFT, SIG, 1.2))
    o.append(_r16_T(190, y2 + 47, "M^{3}: 384 ビット", "end", 11, SIG, True))
    o.append(_r16_T(200 + 500 * 384 / 2048.0 + 10, y2 + 47, "M が 128 ビットの鍵なら M^{3} は n よりずっと小さい", "start", 11, INK))
    return SVG(760, 268, o, "パディングなしで e = 3 を使い、平文 M が短いと、M³ が n に届かず、"
               "暗号文は M³ そのものになる。法 n の計算をしていないのと同じなので、整数の 3 乗根で M が求まる。")
F["e16_lowexp"] = _f16_lowexp()


# 6 節: PKCS#1 v1.5 の形式
def _f16_pkcs():
    o = []
    o.append(T(20, 22, "n が 2048 ビット（256 バイト）、M が 32 バイトの鍵の場合", "start", 12.5, INK, True))
    segs = [("00", None, 46, "neu"), ("02", None, 46, "neu"),
            ("PS: 0 でない乱数", "8 バイト以上（この例では 221 バイト）", 380, "res"),
            ("00", "区切り", 46, "neu"), ("M", "32 バイト", 160, "pub")]
    x = 40
    for t1, t2, w, kind in segs:
        o.append(_r16_box(x, 38, w - 4, 52, t1, t2, kind, 13 if len(t1) < 4 else 12.5, 10, t1 in ("00", "02")))
        x += w
    o.append(DARR(40, 106, 714, 106, MUT, 1.1, 5))
    o.append(T(377, 122, "合計 256 バイト（n とほぼ同じ大きさの整数になる）", "middle", 11, MUT))
    o.append(T(20, 150, "復号した側は、先頭が 00 02 か、乱数の後に区切りの 00 があるかを検査してから M を取り出す。", "start", 11.5, INK))
    o.append(T(20, 170, "幅は正確な比率ではない。", "start", 10.5, FNT))
    return SVG(760, 184, o, "PKCS#1 v1.5 の暗号化用パディング。平文 M の前に乱数を詰め、n とほぼ同じ大きさの整数にしてから e 乗する。")
F["e16_pkcs"] = _f16_pkcs()


# 6 節: Bleichenbacher 攻撃
def _f16_bleich():
    o = []
    o.append(T(130, 22, "Eve", "middle", 13, INK, True))
    o.append(T(330, 22, "サーバ（秘密鍵を持つ）", "middle", 13, INK, True))
    o.append(W(130, 32, 130, 240, c=LIN, lw=1.2, dash="4,4"))
    o.append(W(330, 32, 330, 240, c=LIN, lw=1.2, dash="4,4"))
    o.append(ARR(132, 70, 326, 70, INK, 1.6))
    o.append(_r16_T(229, 62, "C s^{e} mod n", "middle", 11.5, INK, True, True))
    o.append(T(229, 86, "（s を変えて何度も送る）", "middle", 10, MUT))
    o.append(RECT(250, 100, 160, 44, 6, PAN, LIN, 1.2))
    o.append(T(330, 118, "復号して、先頭が", "middle", 10.5, INK))
    o.append(T(330, 134, "00 02 かを検査", "middle", 10.5, INK))
    o.append(ARR(326, 172, 134, 172, ALI, 1.6))
    o.append(T(229, 164, "形式が正しい / 正しくない", "middle", 10.5, ALI, True))
    o.append(T(229, 188, "（エラーの違い）", "middle", 10, MUT))
    o.append(T(130, 222, "答えは 1 ビット", "middle", 10.5, MUT))
    # 範囲が狭まる
    x0, x1 = 470, 790
    o.append(T(x0, 22, "EM（パディング後の平文）の候補の範囲", "start", 12, INK, True))
    bars = [(48, 0.0, 1.0, "最初: 00 02 で始まる [2B, 3B)"), (102, 0.30, 0.62, "「正しい」の答えが 1 つ増えると狭まる"),
            (156, 0.41, 0.50, "さらに答えを集める"), (210, 0.455, 0.462, "最後は 1 つの値に決まる")]
    for y, a, b, lab in bars:
        o.append(RECT(x0, y, x1 - x0, 18, 4, PAN, LIN, 1))
        o.append(RECT(x0 + (x1 - x0) * a, y, max(3, (x1 - x0) * (b - a)), 18, 3, ASOFT, ALI, 1.4))
        o.append(T(x0, y + 34, lab, "start", 10.5, INK))
    return SVG(820, 256, o, "サーバが「パディングの形式が正しいか」を答えてしまうと、選択暗号文攻撃のオラクルになる。"
               "n が k バイトのとき B を 2 の 8(k − 2) 乗とすると、EM が 00 02 で始まることは 2B ≤ EM < 3B と同じである。")
F["e16_bleich"] = _f16_bleich()


# 6 節: OAEP の構造
def _f16_oaep():
    o = []
    # 入力
    o.append(_r16_box(40, 24, 160, 40, "seed（乱数）", None, "res", 12.5))
    segs = [("lHash", 90), ("00 … 00", 120), ("01", 40), ("M", 110)]
    x = 300
    o.append(T(300, 18, "DB", "start", 11, MUT, True))
    for t, w in segs:
        o.append(_r16_box(x, 24, w - 3, 40, t, None, "pub" if t == "M" else "neu", 12))
        x += w
    xc_s, xc_d = 120, 480
    # 1 回目: seed → MGF → ⊕ DB
    o.append(W(xc_s, 64, xc_s, 210, c=MUT, lw=1.5))
    o.append(W(xc_s, 104, 216, 104, c=MUT, lw=1.5))
    o.append(_r16_box(218, 90, 74, 28, "MGF", None, "neu", 11.5))
    o.append(ARR(292, 104, xc_d - 13, 104, MUT, 1.5))
    o.append(W(xc_d, 64, xc_d, 91, c=MUT, lw=1.5))
    o.append(CIRC(xc_d, 104, 12, INK, 1.5, PAN))
    o.append(T(xc_d, 109.5, "⊕", "middle", 16, INK, True))
    o.append(ARR(xc_d, 116, xc_d, 140, MUT, 1.5))
    o.append(_r16_box(300, 142, 360, 36, "maskedDB", None, "neu", 12))
    # 2 回目: maskedDB → MGF → ⊕ seed
    o.append(W(xc_d, 178, xc_d, 210, c=MUT, lw=1.5))
    o.append(W(xc_d, 210, 294, 210, c=MUT, lw=1.5))
    o.append(_r16_box(218, 196, 74, 28, "MGF", None, "neu", 11.5))
    o.append(ARR(216, 210, xc_s + 14, 210, MUT, 1.5))
    o.append(CIRC(xc_s, 210, 12, INK, 1.5, PAN))
    o.append(T(xc_s, 215.5, "⊕", "middle", 16, INK, True))
    o.append(ARR(xc_s, 222, xc_s, 248, MUT, 1.5))
    o.append(_r16_box(40, 250, 160, 36, "maskedSeed", None, "neu", 12))
    # 出力
    o.append(T(20, 316, "EM =", "start", 12.5, INK, True))
    o.append(_r16_box(64, 298, 50, 30, "00", None, "neu", 12, mono1=True))
    o.append(_r16_box(118, 298, 160, 30, "maskedSeed", None, "neu", 12))
    o.append(_r16_box(282, 298, 378, 30, "maskedDB", None, "neu", 12))
    o.append(T(680, 108, "乱数 seed の影響が", "start", 10.5, MUT))
    o.append(T(680, 123, "DB 全体に広がる", "start", 10.5, MUT))
    o.append(T(680, 214, "受信側は逆順にほどき、", "start", 10.5, MUT))
    o.append(T(680, 229, "lHash と 01 を検査する", "start", 10.5, MUT))
    return SVG(820, 340, o, "OAEP の構造。MGF はハッシュ関数から作る関数で、入力から必要な長さの擬似乱数を作る。"
               "lHash は決まった値（ラベルのハッシュ値）で、復号後の検査に使う。⊕ は XOR。")
F["e16_oaep"] = _f16_oaep()


# 7 節: 素数を共有した 2 つの鍵
def _f16_gcd():
    o = []
    o.append(T(20, 22, "公開鍵の n だけを使う", "start", 12.5, INK, True))
    o.append(_r16_box(20, 36, 190, 50, "n₁ = 3233", "鍵 1（実は 61 × 53）", "pub", 14, 10.5, True))
    o.append(_r16_box(20, 100, 190, 50, "n₂ = 4331", "鍵 2（実は 61 × 71）", "pub", 14, 10.5, True))
    o.append(T(250, 22, "ユークリッドの互除法", "start", 12.5, INK, True))
    steps = ["4331 = 1 × 3233 + 1098", "3233 = 2 × 1098 + 1037", "1098 = 1 × 1037 + 61", "1037 = 17 × 61 + 0"]
    for k, s in enumerate(steps):
        o.append(T(250, 50 + k * 26, s, "start", 12.5, INK, False, True))
    o.append(T(250, 158, "→ gcd(4331, 3233) = 61", "start", 12.5, ALI, True, True))
    o.append(ARR(212, 93, 240, 93, MUT, 1.4))
    o.append(ARR(470, 140, 510, 140, MUT, 1.4))
    o.append(_r16_box(514, 36, 226, 50, "3233 ÷ 61 = 53", "鍵 1 の p, q が分かる", "sec", 13, 10.5, True))
    o.append(_r16_box(514, 100, 226, 50, "4331 ÷ 61 = 71", "鍵 2 の p, q が分かる", "sec", 13, 10.5, True))
    o.append(T(20, 190, "どちらの鍵も φ(n) と d が計算でき、完全に破れる。互除法は 2048 ビットの数でも一瞬で終わる。", "start", 11.5, INK))
    return SVG(760, 204, o, "2 つの鍵がたまたま同じ素数 61 を使っていた場合。素因数分解をしなくても、"
               "最大公約数を取るだけで共通の素数が出てくる。")
F["e16_gcd"] = _f16_gcd()


# 7 節: 繰り返し二乗法の演算の並び（タイミング・電力解析）
def _f16_trace():
    o = []
    d = 2753
    bits = [(d >> i) & 1 for i in range(12)]
    o.append(T(20, 22, "d = 2753 の 2 進の桁（2⁰ の桁から順に）", "start", 12.5, INK, True))
    o.append(_r16_cells(20, 32, bits, 26, 24, hl={i for i, b in enumerate(bits) if b}, hlc=ALI, hlf=ASOFT, sz=12))
    def strip(y, title, const):
        o.append(T(20, y - 8, title, "start", 12, INK, True))
        x = 20
        for i, b in enumerate(bits):
            if b or const:
                dummy = const and not b
                o.append(RECT(x, y + (4 if dummy else 0), 22, 34 if not dummy else 30, 3,
                              SCR if dummy else ASOFT, FNT if dummy else ALI, 1.2, "3,2" if dummy else None))
                o.append(T(x + 11, y + 22, "掛", "middle", 10.5, MUT if dummy else ALI, True))
                x += 24
            if i < 11:
                o.append(RECT(x, y + 10, 22, 24, 3, _R16_BS, _R16_BL, 1.2))
                o.append(T(x + 11, y + 26, "2", "middle", 10.5, _R16_BL, True))
                x += 24
            x += 6
        return x
    xe = strip(92, "ふつうの実装: 桁が 1 のときだけ掛け算をする", False)
    o.append(T(xe + 6, 114, "演算 16 回", "start", 11, INK, True))
    o.append(T(20, 148, "掛け算（赤）の位置から、d の 1 の桁がそのまま読める", "start", 11, ALI, True))
    xc = strip(192, "定数時間の実装: どの桁でも掛け算をする（桁が 0 のときは結果を捨てる）", True)
    o.append(T(xc + 6, 214, "演算 23 回", "start", 11, INK, True))
    o.append(T(20, 248, "どの桁でも同じ並びになるので、時間や波形から桁は読めない", "start", 11, SIG, True))
    return SVG(820, 262, o, "繰り返し二乗法（2 乗を繰り返し、桁が 1 のときに掛ける）が行う演算を時間の順に並べた模式図。"
               "「2」は 2 乗、「掛」は掛け算。処理時間や消費電力の波形はこの並びを反映する。")
F["e16_trace"] = _f16_trace()


# 8 節: TLS での RSA の役割の変化
def _f16_tls():
    o = []
    def panel(x0, title, tc):
        o.append(RECT(x0, 12, 380, 262, 12, PAN, LIN, 1.3))
        o.append(T(x0 + 190, 36, title, "middle", 13, tc, True))
        o.append(_r16_box(x0 + 16, 52, 110, 34, "クライアント", None, "neu", 12))
        o.append(_r16_box(x0 + 254, 52, 110, 34, "サーバ", None, "neu", 12))
    panel(20, "TLS 1.2 までの RSA 鍵交換", ALI)
    o.append(T(36, 112, "① 共通鍵の素を乱数で作る", "start", 11, INK))
    o.append(ARR(90, 138, 330, 138, _R16_BL, 1.8))
    o.append(T(210, 129, "サーバの RSA 公開鍵で暗号化して送る", "middle", 10.5, _R16_BL, True))
    o.append(T(384, 154, "② RSA 秘密鍵で復号", "end", 11, ALI))
    o.append(T(36, 182, "以後の通信は、その共通鍵で暗号化する", "start", 11, INK))
    o.append(RECT(32, 202, 356, 60, 8, ASOFT, ALI, 1.2))
    o.append(T(210, 224, "RSA 秘密鍵が後で漏れると、保存されていた", "middle", 11, ALI, True))
    o.append(T(210, 242, "過去の通信の共通鍵も復号され、すべて読まれる", "middle", 11, ALI, True))
    panel(420, "TLS 1.3", SIG)
    o.append(T(436, 112, "① ECDHE で共通鍵を作る（17 章）", "start", 11, INK))
    o.append(DARR(490, 138, 730, 138, SIG, 1.8))
    o.append(T(610, 129, "使い捨ての値を交換", "middle", 10.5, SIG, True))
    o.append(T(784, 154, "② RSA 秘密鍵で署名し、本物と示す", "end", 11, ALI))
    o.append(T(436, 182, "RSA 秘密鍵は認証（署名）にだけ使う", "start", 11, INK))
    o.append(RECT(432, 202, 356, 60, 8, SSOFT, SIG, 1.2))
    o.append(T(610, 224, "RSA 秘密鍵が後で漏れても、過去の通信の", "middle", 11, SIG, True))
    o.append(T(610, 242, "共通鍵は計算できない（前方秘匿性）", "middle", 11, SIG, True))
    return SVG(820, 286, o, "HTTPS などで使う TLS での RSA の使われ方。TLS 1.3 では RSA で共通鍵を運ぶ方式が廃止され、"
               "RSA は相手が本物であることを示す署名にだけ使われる。")
F["e16_tls"] = _f16_tls()
