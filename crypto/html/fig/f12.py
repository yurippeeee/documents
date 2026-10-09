# 12 章 暗号の基礎概念と古典暗号 の図（figures.py の関数・定数をそのまま使う）
# 他章のファイルと名前がぶつからないよう、この章の補助関数・定数は _c12 で始める。

_C12B = "var(--blue)"
_C12BS = "var(--blue-soft)"


def _c12_tx(x, y, parts, a="middle", sz=12, c=INK, b=False, mono=False):
    """添字付きの文字列。parts は (文字列, "" / "sub" / "sup") の列"""
    o, cur = [], 0.0
    for s, k in parts:
        off = {"": 0.0, "sub": sz * 0.32, "sup": -sz * 0.42}[k]
        o.append('<tspan dy="%g" font-size="%g">%s</tspan>' % (off - cur, sz * (0.72 if k else 1), E(s)))
        cur = off
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="%s" font-weight="%s">%s</text>'
            % (x, y, a, sz, c, MONO if mono else "var(--sans)", "700" if b else "400", "".join(o)))


def _c12_person(x, y, c, fill, name=None, sub=None, nc=None):
    """人のアイコン。(x, y) は頭の中心。名前は足元に書く"""
    o = [CIRC(x, y, 8.5, c, 1.6, fill)]
    o.append('<path d="M%g,%g L%g,%g Q%g,%g %g,%g Q%g,%g %g,%g L%g,%g Z" fill="%s" stroke="%s" stroke-width="1.6"/>'
             % (x - 15, y + 30, x - 15, y + 23, x - 15, y + 12, x, y + 12, x + 15, y + 12, x + 15, y + 23,
                x + 15, y + 30, fill, c))
    if name:
        o.append(T(x, y + 47, name, "middle", 12, nc or c, True))
    if sub:
        o.append(T(x, y + 62, sub, "middle", 10.5, MUT))
    return "".join(o)


def _c12_key(x, y, c, s=1.0, lab=None):
    """鍵のアイコン。(x, y) は輪の中心。lab は輪の右上に書く文字"""
    r = 5.2 * s
    o = [CIRC(x, y, r, c, 1.9 * s, PAN)]
    o.append(W(x + r, y, x + r + 15 * s, y, c=c, lw=2.1 * s))
    o.append(W(x + r + 9 * s, y, x + r + 9 * s, y + 5 * s, c=c, lw=2.1 * s))
    o.append(W(x + r + 15 * s, y, x + r + 15 * s, y + 6 * s, c=c, lw=2.1 * s))
    if lab:
        o.append(T(x + r + 8 * s, y - 7 * s, lab, "middle", 11.5, c, True))
    return "".join(o)


def _c12_cells(x, y, s, cw=24, ch=26, fills=None, cols=None, tcols=None, sz=12.5, bold=None, mono=True, gap=3):
    """1 文字を 1 マスに描く。fills/cols/tcols は位置ごとの塗り・枠・文字の色（辞書）"""
    o = []
    for i, ch_ in enumerate(s):
        f = (fills or {}).get(i, PAN)
        c = (cols or {}).get(i, LIN)
        tc = (tcols or {}).get(i, INK)
        o.append(RECT(x + i * cw, y, cw - gap, ch, 4, f, c, 1.3))
        o.append(T(x + i * cw + (cw - gap) / 2, y + ch / 2 + sz * 0.36, ch_, "middle", sz, tc,
                   bool(bold and i in bold), mono))
    return "".join(o)


def _c12_box(x, y, w, h, title, sub=None, c=LIN, fill=PAN, tc=INK, sz=12.5, ssz=11, mono_sub=True):
    """題と中身を 2 行で書く箱"""
    o = [RECT(x, y, w, h, 8, fill, c, 1.5)]
    if sub is None:
        o.append(T(x + w / 2, y + h / 2 + sz * 0.36, title, "middle", sz, tc, True))
    else:
        o.append(T(x + w / 2, y + h / 2 - 4, title, "middle", sz, tc, True))
        o.append(T(x + w / 2, y + h / 2 + 13, sub, "middle", ssz, INK, False, mono_sub))
    return "".join(o)


def _c12_oracle(x, y, w, h, title, c=INK):
    """オラクル（中身の見えない箱）。鍵のアイコン入り"""
    o = [RECT(x, y, w, h, 8, SCR, c, 1.6, "5,3")]
    o.append(T(x + w / 2, y + 20, title, "middle", 12, c, True))
    o.append(_c12_key(x + w / 2 - 12, y + 38, MUT, 0.9))
    o.append(T(x + w / 2, y + h - 9, "鍵は見えない", "middle", 10, MUT))
    return "".join(o)


# ---------------------------------------------------------------- 1 節
# 1. 登場人物と通信路
def _f12_parties():
    o = []
    # 上段: 盗聴者
    o.append(T(20, 24, "盗聴者（受動的な攻撃者）: 通信路を流れるものを見る", "start", 13, ALI, True))
    yb = 74
    o.append(RECT(120, yb - 11, 520, 22, 11, SCR, LIN, 1.2))
    o.append(T(140, yb + 4, "通信路", "start", 10.5, MUT))
    o.append(ARR(470, yb, 626, yb, MUT, 1.6))
    o.append(RECT(290, yb - 15, 170, 30, 6, PAN, INK, 1.4))
    o.append(T(375, yb + 5, "ATTACK AT DAWN", "middle", 12.5, INK, True, True))
    o.append(_c12_person(70, 52, SIG, SSOFT, "送信者", "Alice"))
    o.append(_c12_person(690, 52, _C12B, _C12BS, "受信者", "Bob"))
    o.append(W(375, yb + 16, 375, 112, c=ALI, lw=1.5, dash="4,3"))
    o.append(_c12_person(375, 124, ALI, ASOFT))
    o.append(T(408, 140, "盗聴者（Eve）", "start", 12, ALI, True))
    o.append(T(408, 158, "内容をそのまま読める", "start", 11.5, INK))
    # 下段: 能動的な攻撃者
    y0 = 214
    o.append(T(20, y0, "能動的な攻撃者: 流れるものを書き換える・偽のデータを送り込む", "start", 13, ALI, True))
    yb2 = y0 + 50
    o.append(RECT(120, yb2 - 11, 520, 22, 11, SCR, LIN, 1.2))
    o.append(RECT(150, yb2 - 15, 170, 30, 6, PAN, INK, 1.4))
    o.append(T(235, yb2 + 5, "ATTACK AT DAWN", "middle", 12.5, INK, True, True))
    o.append(ARR(322, yb2, 350, yb2, MUT, 1.6))
    o.append(RECT(430, yb2 - 15, 170, 30, 6, ASOFT, ALI, 1.6))
    o.append(T(515, yb2 + 5, "RETREAT AT SIX", "middle", 12.5, ALI, True, True))
    o.append(ARR(602, yb2, 626, yb2, MUT, 1.6))
    o.append(ARR(402, yb2, 428, yb2, ALI, 1.6))
    o.append(_c12_person(70, yb2 - 22, SIG, SSOFT, "送信者", "Alice"))
    o.append(_c12_person(690, yb2 - 22, _C12B, _C12BS, "受信者", "Bob"))
    o.append(_c12_person(376, yb2 - 34, ALI, ASOFT))
    o.append(T(376, yb2 + 34, "能動的な攻撃者（Mallory）", "middle", 12, ALI, True))
    o.append(T(376, yb2 + 52, "途中で書き換えて Bob へ流す", "middle", 11.5, INK))
    return SVG(760, 330, o, "暗号を使わない場合。通信路を流れるものは攻撃者に見られる。盗聴者は内容をそのまま読み、"
               "能動的な攻撃者は内容を書き換えて受信者に届けることもできる。")
F["e12_parties"] = _f12_parties()


# 2. 暗号化して送る流れ
def _f12_flow():
    o = []
    y, h = 86, 50
    o.append(RECT(282, y - 22, 196, h + 44, 12, "none", LIN, 1.3, "6,4"))
    o.append(T(380, y - 8, "通信路", "middle", 10.5, MUT))
    o.append(_c12_box(18, y, 142, h, "平文 P", "ATTACK AT DAWN", SIG, SSOFT, SIG))
    o.append(ARR(162, y + h / 2, 183, y + h / 2, MUT, 1.6))
    o.append(RECT(186, y, 78, h, 8, PAN, INK, 1.5))
    o.append(T(225, y + 20, "暗号化", "middle", 12, INK, True))
    o.append(_c12_tx(225, y + 39, [("E", ""), ("K", "sub")], "middle", 13, INK, False))
    o.append(ARR(266, y + h / 2, 291, y + h / 2, MUT, 1.6))
    o.append(_c12_box(294, y, 172, h, "暗号文 C", "DWWDFN DW GDZQ", INK, PAN, INK))
    o.append(ARR(468, y + h / 2, 493, y + h / 2, MUT, 1.6))
    o.append(RECT(496, y, 78, h, 8, PAN, INK, 1.5))
    o.append(T(535, y + 20, "復号", "middle", 12, INK, True))
    o.append(_c12_tx(535, y + 39, [("D", ""), ("K", "sub")], "middle", 13, INK, False))
    o.append(ARR(576, y + h / 2, 597, y + h / 2, MUT, 1.6))
    o.append(_c12_box(600, y, 142, h, "平文 P", "ATTACK AT DAWN", _C12B, _C12BS, _C12B))
    # 鍵
    o.append(_c12_key(214, 40, SIG, 1.0, "K"))
    o.append(_c12_key(524, 40, SIG, 1.0, "K"))
    o.append(W(225, 50, 225, y - 2, c=SIG, lw=1.4))
    o.append(W(535, 50, 535, y - 2, c=SIG, lw=1.4))
    o.append(PL([(250, 32), (300, 18), (460, 18), (512, 32)], SIG, 1.4, "5,4"))
    o.append(T(380, 13, "同じ鍵 K を前もって安全な手段で共有しておく", "middle", 11, SIG))
    o.append(T(225, y + h + 20, "送信者が行う", "middle", 11, MUT))
    o.append(T(535, y + h + 20, "受信者が行う", "middle", 11, MUT))
    # 攻撃者
    o.append(W(380, y + h + 23, 380, 182, c=ALI, lw=1.5, dash="4,3"))
    o.append(_c12_person(380, 196, ALI, ASOFT))
    o.append(T(412, 210, "攻撃者", "start", 12, ALI, True))
    o.append(T(412, 228, "C は見えるが、K を知らないので P に戻せない", "start", 11.5, INK))
    return SVG(760, 250, o, "暗号を使う場合。通信路には暗号文 C だけを流す。暗号文の例は 4 節のシーザー暗号（鍵 3）で作った"
               "（空白はそのまま残した）。")
F["e12_flow"] = _f12_flow()


# 3. ケルクホフスの原理: 何を秘密にするか
def _f12_kerckhoffs():
    o = []
    def chip(x, y, name, secret):
        c, fl = (ALI, ASOFT) if secret else (_C12B, _C12BS)
        o.append(RECT(x, y, 120, 30, 15, fl, c, 1.5))
        o.append(T(x + 60, y + 20, "%s: %s" % (name, "秘密" if secret else "公開"), "middle", 12, c, True))
    def panel(x0, title, tc, sec_method, rows):
        o.append(RECT(x0, 12, 356, 290, 12, PAN, tc, 1.5))
        o.append(T(x0 + 178, 36, title, "middle", 13, tc, True))
        chip(x0 + 46, 50, "方式", sec_method)
        chip(x0 + 190, 50, "鍵", True)
        y = 104
        for lab, lines, c in rows:
            o.append(T(x0 + 16, y, lab, "start", 11.5, MUT, True))
            for j, l in enumerate(lines):
                o.append(T(x0 + 16, y + 20 + j * 18, l, "start", 12, c))
            y += 26 + 18 * len(lines) + 6
    panel(14, "方式を秘密にする（隠蔽によるセキュリティ）", ALI, True, [
        ("方式の仕様が漏れたら", ["方式を作り直し、すべての機器と", "ソフトを入れ替える必要がある"], INK),
        ("方式の検証", ["公開の場で調べられていない"], INK),
        ("例", ["A5/1、CSS、Crypto-1 は", "解析されて破られた"], ALI)])
    panel(390, "鍵だけを秘密にする（ケルクホフスの原理）", SIG, False, [
        ("鍵が漏れたら", ["その鍵を新しい鍵に", "替えるだけでよい"], INK),
        ("方式の検証", ["世界中の研究者が攻撃を試し、", "耐えた方式だけが残る"], INK),
        ("例", ["AES は 20 年以上、実用的な", "破り方が見つかっていない"], SIG)])
    return SVG(760, 314, o, "何を秘密にするかで、秘密が漏れたときの被害と、方式を検証できるかどうかが変わる。")
F["e12_kerckhoffs"] = _f12_kerckhoffs()


# ---------------------------------------------------------------- 2 節
# 4. 共通鍵暗号と公開鍵暗号
def _f12_symasym():
    o = []
    def row(y, enc, dec):
        o.append(_c12_person(48, y - 20, SIG, SSOFT, "送信者"))
        o.append(_c12_person(712, y - 20, _C12B, _C12BS, "受信者"))
        for x, w, t, c in [(100, 70, "平文", LIN), (205, 110, enc, INK), (350, 60, "暗号文", LIN),
                           (445, 110, dec, INK), (590, 70, "平文", LIN)]:
            o.append(RECT(x, y - 18, w, 36, 7, PAN, c, 1.5 if c == INK else 1.3))
            o.append(T(x + w / 2, y + 5, t, "middle", 11.5, INK, True))
        for x1 in (172, 317, 412, 557):
            o.append(ARR(x1, y, x1 + 30, y, MUT, 1.5))
    # 上段: 共通鍵
    o.append(T(20, 22, "共通鍵暗号: 送信者と受信者が同じ鍵 K を持つ", "start", 13, SIG, True))
    y = 96
    row(y, "K で暗号化", "K で復号")
    o.append(_c12_key(242, y - 38, SIG, 1.0))
    o.append(_c12_key(482, y - 38, SIG, 1.0))
    o.append(T(232, y - 44, "K", "end", 12, SIG, True))
    o.append(T(472, y - 44, "K", "end", 12, SIG, True))
    o.append(T(380, y + 44, "K は通信を始める前に、通信路以外の安全な手段で渡しておく必要がある（鍵配送問題）", "middle", 11.5, ALI))
    # 下段: 公開鍵
    y0 = 184
    o.append(T(20, y0, "公開鍵暗号: 受信者が公開鍵と秘密鍵の組を作り、公開鍵だけを公開する", "start", 13, _C12B, True))
    y = y0 + 108
    row(y, "公開鍵で暗号化", "秘密鍵で復号")
    by = y0 + 20
    o.append(RECT(176, by, 170, 32, 8, _C12BS, _C12B, 1.4, "5,3"))
    o.append(_c12_key(196, by + 16, _C12B, 0.85))
    o.append(T(220, by + 21, "公開鍵（誰でも見られる）", "start", 11, _C12B, True))
    o.append(_c12_key(668, by + 16, _C12B, 0.85))
    o.append(ARR(658, by + 16, 350, by + 16, _C12B, 1.3))
    o.append(T(504, by + 9, "受信者が公開鍵を公開する", "middle", 11, _C12B))
    o.append(ARR(260, by + 32, 260, y - 21, _C12B, 1.3))
    o.append(T(268, by + 52, "受信者の公開鍵を使う", "start", 11, _C12B))
    o.append(_c12_key(486, y - 38, INK, 1.0))
    o.append(T(476, y - 44, "秘密鍵", "end", 11.5, INK, True))
    o.append(T(500, y + 40, "秘密鍵は受信者だけが持つ", "middle", 11.5, INK))
    return SVG(760, 346, o, "共通鍵暗号では同じ鍵で暗号化と復号を行う。公開鍵暗号では、暗号化に使う公開鍵は攻撃者に知られてもよく、"
               "復号に使う秘密鍵だけを受信者が守る。")
F["e12_symasym"] = _f12_symasym()


# 5. 必要な鍵の数
def _f12_keycount():
    import math as _m
    o = []
    names = "ABCDE"
    def ring(cx, cy, r):
        return [(cx + r * _m.sin(2 * _m.pi * i / 5), cy - r * _m.cos(2 * _m.pi * i / 5)) for i in range(5)]
    o.append(T(190, 24, "共通鍵暗号: 2 人の組ごとに 1 個", "middle", 13, SIG, True))
    P = ring(190, 140, 84)
    k = 0
    for i in range(5):
        for j in range(i + 1, 5):
            o.append(W(P[i][0], P[i][1], P[j][0], P[j][1], c=SIG, lw=1.6))
            k += 1
    for (x, y), nm in zip(P, names):
        o.append(CIRC(x, y, 17, SIG, 1.8, PAN))
        o.append(T(x, y + 5, nm, "middle", 13, INK, True))
    o.append(T(190, 258, "線 1 本が鍵 1 個: 5 × 4 / 2 = 10 個", "middle", 12, INK, True))
    o.append(T(570, 24, "公開鍵暗号: 1 人 1 組", "middle", 13, _C12B, True))
    Q = ring(570, 140, 84)
    o.append(RECT(520, 116, 100, 48, 8, _C12BS, _C12B, 1.3, "5,3"))
    o.append(T(570, 134, "公開鍵の一覧", "middle", 11, _C12B, True))
    o.append(T(570, 152, "5 個", "middle", 11, _C12B))
    for (x, y), nm in zip(Q, names):
        o.append(CIRC(x, y, 17, _C12B, 1.8, PAN))
        o.append(T(x, y + 5, nm, "middle", 13, INK, True))
        dx = 30 if x >= 570 else -52
        o.append(_c12_key(x + dx, y - 8, _C12B, 0.75))
        o.append(_c12_key(x + dx, y + 8, INK, 0.75))
    o.append(T(570, 258, "公開鍵（青）と秘密鍵の組が 5 組", "middle", 12, INK, True))
    o.append(T(380, 290, "100 人なら、共通鍵暗号では 4950 個、公開鍵暗号では 100 組", "middle", 12.5, ALI, True))
    return SVG(760, 306, o, "5 人（A〜E）が互いに 1 対 1 で通信する場合。共通鍵暗号では組の数だけ鍵が要るが、"
               "公開鍵暗号では各人が自分の組を 1 つ持てばよい。")
F["e12_keycount"] = _f12_keycount()


# 6. ハイブリッド暗号
def _f12_hybrid():
    o = []
    def row(y, title, tc, items, note):
        o.append(T(20, y - 30, title, "start", 13, tc, True))
        x = 20
        for i, (w, t1, t2, c, fl) in enumerate(items):
            o.append(RECT(x, y - 20, w, 44, 7, fl, c, 1.4))
            if t2:
                o.append(T(x + w / 2, y - 3, t1, "middle", 11.5, INK, True))
                o.append(T(x + w / 2, y + 14, t2, "middle", 10.5, MUT))
            else:
                o.append(T(x + w / 2, y + 6, t1, "middle", 11.5, INK, True))
            if i < len(items) - 1:
                o.append(ARR(x + w + 2, y + 2, x + w + 20, y + 2, MUT, 1.5))
            x += w + 22
        o.append(T(20, y + 46, note, "start", 11.5, tc))
    row(58, "① 公開鍵暗号で、共通鍵 K を受信者に届ける", _C12B, [
        (120, "共通鍵 K", "送信者が乱数で作る", SIG, SSOFT),
        (150, "受信者の公開鍵で", "K を暗号化", _C12B, _C12BS),
        (120, "暗号化した K", "短いデータ", INK, PAN),
        (150, "受信者の秘密鍵で", "K を取り出す", INK, PAN),
        (106, "共通鍵 K", "両者が共有", SIG, SSOFT)],
        "公開鍵暗号は遅いが、送るのは数十バイトの K だけなので問題にならない")
    row(180, "② 共通鍵暗号で、データ本体を暗号化する", SIG, [
        (120, "データ本体", "大量", INK, PAN),
        (150, "K で暗号化", "AES など", SIG, SSOFT),
        (120, "暗号文", "大量", INK, PAN),
        (150, "K で復号", "AES など", SIG, SSOFT),
        (106, "データ本体", None, INK, PAN)],
        "共通鍵暗号は速いので、大量のデータに使う")
    return SVG(760, 250, o, "ハイブリッド暗号。遅い公開鍵暗号は鍵を届けるだけに使い、データ本体は速い共通鍵暗号で暗号化する。")
F["e12_hybrid"] = _f12_hybrid()


# ---------------------------------------------------------------- 3 節
# 7. 4 つの攻撃モデル
def _f12_models():
    o = []
    def panel(x0, y0, num, title, sub):
        o.append(RECT(x0, y0, 362, 150, 12, PAN, LIN, 1.4))
        o.append(T(x0 + 14, y0 + 24, "%s %s" % (num, title), "start", 13, INK, True))
        o.append(T(x0 + 14, y0 + 140, sub, "start", 11, MUT))
    # ① 暗号文単独
    x0, y0 = 14, 12
    panel(x0, y0, "①", "暗号文単独攻撃（COA）", "手に入るのは暗号文だけ")
    for i, s in enumerate(["C₁", "C₂", "C₃"]):
        o.append(RECT(x0 + 30 + i * 62, y0 + 44, 50, 28, 6, PAN, INK, 1.3))
        o.append(T(x0 + 55 + i * 62, y0 + 63, s, "middle", 12.5, INK, True))
    o.append(T(x0 + 222, y0 + 63, "…", "middle", 13, MUT))
    o.append(_c12_person(x0 + 300, y0 + 52, ALI, ASOFT))
    o.append(ARR(x0 + 240, y0 + 70, x0 + 280, y0 + 80, ALI, 1.4))
    # ② 既知平文
    x0, y0 = 384, 12
    panel(x0, y0, "②", "既知平文攻撃（KPA）", "平文と暗号文の組が手に入る")
    for i, s in enumerate(["(P₁, C₁)", "(P₂, C₂)"]):
        o.append(RECT(x0 + 24 + i * 96, y0 + 44, 86, 28, 6, PAN, INK, 1.3))
        o.append(T(x0 + 67 + i * 96, y0 + 63, s, "middle", 12, INK, True))
    o.append(T(x0 + 222, y0 + 63, "…", "middle", 13, MUT))
    o.append(_c12_person(x0 + 300, y0 + 52, ALI, ASOFT))
    o.append(ARR(x0 + 240, y0 + 70, x0 + 280, y0 + 80, ALI, 1.4))
    # ③ 選択平文
    x0, y0 = 14, 176
    panel(x0, y0, "③", "選択平文攻撃（CPA）", "好きな平文を暗号化させられる")
    o.append(_c12_person(x0 + 42, y0 + 54, ALI, ASOFT))
    o.append(_c12_oracle(x0 + 196, y0 + 38, 140, 82, "暗号化のオラクル"))
    o.append(ARR(x0 + 66, y0 + 62, x0 + 192, y0 + 62, INK, 1.5))
    o.append(T(x0 + 128, y0 + 55, "P（自分で選ぶ）", "middle", 11, INK))
    o.append(ARR(x0 + 192, y0 + 100, x0 + 66, y0 + 100, ALI, 1.5))
    o.append(T(x0 + 128, y0 + 116, "C を受け取る", "middle", 11, ALI))
    # ④ 選択暗号文
    x0, y0 = 384, 176
    panel(x0, y0, "④", "選択暗号文攻撃（CCA）", "好きな暗号文を復号させられる（解読したいものを除く）")
    o.append(_c12_person(x0 + 42, y0 + 54, ALI, ASOFT))
    o.append(_c12_oracle(x0 + 196, y0 + 38, 140, 82, "復号のオラクル"))
    o.append(ARR(x0 + 66, y0 + 62, x0 + 192, y0 + 62, INK, 1.5))
    o.append(T(x0 + 128, y0 + 55, "C（自分で選ぶ）", "middle", 11, INK))
    o.append(ARR(x0 + 192, y0 + 100, x0 + 66, y0 + 100, ALI, 1.5))
    o.append(T(x0 + 128, y0 + 116, "P を受け取る", "middle", 11, ALI))
    return SVG(760, 340, o, "4 つの攻撃モデル。番号が大きいほど攻撃者が多くを手に入れられる。③④の点線の箱がオラクルで、"
               "中の鍵を見せずに暗号化や復号の結果だけを返す。")
F["e12_models"] = _f12_models()


# 8. パディングオラクル攻撃
def _f12_padding():
    o = []
    o.append(_c12_person(70, 70, ALI, ASOFT, "攻撃者", nc=ALI))
    x0, y0, w, h = 440, 22, 300, 136
    o.append(RECT(x0, y0, w, h, 12, PAN, INK, 1.6))
    o.append(T(x0 + 18, y0 + 26, "サーバ（鍵 K を持つ）", "start", 13, INK, True))
    o.append(_c12_key(x0 + 220, y0 + 20, MUT, 0.9))
    for i, s in enumerate(["① 受け取った暗号文を K で復号する", "② 末尾のパディングの形式を検査する",
                           "③ 正しければ処理を続け、", "　 正しくなければエラーを返す"]):
        o.append(T(x0 + 18, y0 + 54 + i * 21, s, "start", 12, INK))
    o.append(ARR(110, 60, x0 - 4, 60, INK, 1.6))
    o.append(T(270, 50, "細工した暗号文 C′", "middle", 12, INK, True))
    o.append(ARR(x0 - 4, 118, 110, 118, ALI, 1.6))
    o.append(T(270, 110, "OK ／「復号に失敗しました」", "middle", 12, ALI, True))
    o.append(T(270, 138, "答えは 1 ビット（エラーかどうか）だけ", "middle", 11, MUT))
    o.append(T(20, 190, "C′ を少しずつ変えて何千回も送り、エラーになるかどうかの答えを集めると、", "start", 12, INK))
    o.append(T(20, 210, "復号結果を 1 バイトずつ特定できる。サーバは、パディングの正しさに答える「復号のオラクル」になっている。",
               "start", 12, INK))
    return SVG(760, 226, o, "パディングオラクル攻撃。サーバは復号結果を返していないが、エラーの有無を返すだけで、"
               "選択暗号文攻撃の相手として使われてしまう。")
F["e12_padding"] = _f12_padding()


# ---------------------------------------------------------------- 4 節
_C12_AL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
_C12_PERM = "CWGNBOFRYDJHSKTZUAMELXQVIP"   # 単一換字式暗号の対応表の例（A→C, B→W, …）


# 9. 単一換字式暗号の対応表
def _f12_subst():
    o = []
    x0, cw = 92, 25
    o.append(T(x0 - 12, 34, "平文", "end", 12, MUT, True))
    o.append(T(x0 - 12, 66, "暗号文", "end", 12, MUT, True))
    hl = {"A": (_C12B, _C12BS), "T": (SIG, SSOFT)}
    f1 = {i: hl[ch][1] for i, ch in enumerate(_C12_AL) if ch in hl}
    c1 = {i: hl[ch][0] for i, ch in enumerate(_C12_AL) if ch in hl}
    o.append(_c12_cells(x0, 16, _C12_AL, cw, 26, f1, c1, None, 12))
    o.append(_c12_cells(x0, 48, _C12_PERM, cw, 26, f1, c1, None, 12))
    o.append(T(x0, 96, "鍵 = この対応表（26 文字の並べ替え）。表を逆向きに引けば復号できる。", "start", 12, INK))
    p, c = "ATTACKATDAWN", "".join(_C12_PERM[ord(ch) - 65] for ch in "ATTACKATDAWN")
    fp = {i: hl[ch][1] for i, ch in enumerate(p) if ch in hl}
    cp = {i: hl[ch][0] for i, ch in enumerate(p) if ch in hl}
    x1 = 200
    o.append(T(x1 - 12, 146, "平文", "end", 12, MUT, True))
    o.append(T(x1 - 12, 196, "暗号文", "end", 12, MUT, True))
    o.append(_c12_cells(x1, 128, p, 30, 28, fp, cp, None, 13.5, set(fp)))
    o.append(_c12_cells(x1, 178, c, 30, 28, fp, cp, None, 13.5, set(fp)))
    for i in range(len(p)):
        o.append(ARR(x1 + i * 30 + 13.5, 158, x1 + i * 30 + 13.5, 175, MUT, 1.2, 5))
    o.append(T(x1 + 380, 146, "A は 4 回とも C に、", "start", 12, _C12B, True))
    o.append(T(x1 + 380, 166, "T は 3 回とも E になる", "start", 12, SIG, True))
    return SVG(760, 222, o, "単一換字式暗号の例。対応表を 1 つだけ使うので、同じ平文の文字は文中のどこにあっても同じ暗号文の文字になる。")
F["e12_subst"] = _f12_subst()


# 10. シーザー暗号（k = 3）
def _f12_caesar():
    o = []
    x0, cw = 92, 25
    k = 3
    wrap = {i for i in range(26) if i + k >= 26}
    o.append(T(x0 - 12, 34, "平文 P", "end", 12, MUT, True))
    o.append(T(x0 - 12, 104, "暗号文 C", "end", 12, MUT, True))
    fl = {i: ASOFT for i in wrap}; cl = {i: ALI for i in wrap}
    o.append(_c12_cells(x0, 16, _C12_AL, cw, 26, fl, cl, None, 12))
    for i in range(26):
        o.append(T(x0 + i * cw + 11, 56, str(i), "middle", 9.5, MUT, False, True))
        o.append(ARR(x0 + i * cw + 11, 61, x0 + i * cw + 11, 80, ALI if i in wrap else FNT, 1.1, 4.5))
    ct = "".join(_C12_AL[(i + k) % 26] for i in range(26))
    o.append(_c12_cells(x0, 86, ct, cw, 26, fl, cl, None, 12))
    for i in range(26):
        o.append(T(x0 + i * cw + 11, 126, str((i + k) % 26), "middle", 9.5, MUT, False, True))
    o.append(T(x0 + 23 * cw - 4, 150, "23 + 3 = 26 ≡ 0 なので X は A に戻る（mod 26）", "end", 11.5, ALI))
    o.append(T(x0, 186, "例:", "start", 12, MUT, True))
    o.append(T(x0 + 34, 186, "ATTACKATDAWN", "start", 14, INK, True, True))
    o.append(ARR(x0 + 160, 181, x0 + 196, 181, MUT, 1.6))
    o.append(T(x0 + 206, 186, "DWWDFNDWGDZQ", "start", 14, ALI, True, True))
    o.append(T(x0 + 330, 186, "（どの文字も 3 つ後ろの文字になる）", "start", 11.5, MUT))
    return SVG(760, 202, o, "シーザー暗号（鍵 k = 3）。上の段の文字が、真下の段の文字に置き換わる。")
F["e12_caesar"] = _f12_caesar()


# 11. シーザー暗号の全数探索
def _f12_caesarbrute():
    o = []
    ct = "DWWDFNDWGDZQ"
    o.append(T(20, 24, "暗号文 DWWDFNDWGDZQ を、k = 1〜25 のすべての鍵で復号した結果", "start", 13, INK, True))
    cw, ch, x0, y0 = 146, 34, 16, 40
    for k in range(1, 26):
        r, c = divmod(k - 1, 5)
        x, y = x0 + c * cw, y0 + r * (ch + 6)
        p = "".join(_C12_AL[(ord(q) - 65 - k) % 26] for q in ct)
        ok = k == 3
        o.append(RECT(x, y, cw - 8, ch, 6, SSOFT if ok else PAN, SIG if ok else LIN, 1.8 if ok else 1.1))
        o.append(T(x + 8, y + 22, "k=%d" % k, "start", 10.5, SIG if ok else MUT, ok, True))
        o.append(T(x + 42, y + 22, p, "start", 11.5, SIG if ok else INK, ok, True))
    o.append(T(20, 262, "意味のある文になるのは k = 3 の ATTACKATDAWN だけなので、鍵は 3 と分かる。", "start", 12, INK))
    return SVG(760, 276, o, "シーザー暗号の全数探索。鍵は 25 通りしかないので、全部試しても一瞬で終わる。")
F["e12_caesarbrute"] = _f12_caesarbrute()


# 12. アフィン暗号: a = 7（1 対 1）と a = 2（衝突）
def _f12_affine():
    o = []
    x0, cw = 128, 23.5
    def panel(y0, a, b, title, tc):
        o.append(T(16, y0, title, "start", 13, tc, True))
        img = [(a * p + b) % 26 for p in range(26)]
        cnt = [img.count(c) for c in range(26)]
        coll ={p for p in range(26) if cnt[img[p]] > 1 and img[p] == img[0]}
        o.append(T(x0 - 10, y0 + 30, "平文 P", "end", 11.5, MUT, True))
        o.append(_c12_cells(x0, y0 + 13, _C12_AL, cw, 24, None, None, None, 11.5))
        o.append(T(x0 - 10, y0 + 62, "C = %dP + %d" % (a, b), "end", 11.5, MUT, True))
        f2 = {p: ASOFT for p in coll}; c2 = {p: ALI for p in coll}
        o.append(_c12_cells(x0, y0 + 45, "".join(_C12_AL[v] for v in img), cw, 24, f2, c2, None, 11.5))
        o.append(T(x0 - 10, y0 + 100, "暗号文の文字", "end", 11.5, MUT, True))
        o.append(_c12_cells(x0, y0 + 83, _C12_AL, cw, 24, None, None, {c: FNT for c in range(26) if cnt[c] == 0}, 11.5))
        o.append(T(x0 - 10, y0 + 128, "現れる回数", "end", 11.5, MUT, True))
        for c in range(26):
            col = SIG if cnt[c] == 1 else (ALI if cnt[c] > 1 else FNT)
            o.append(T(x0 + c * cw + 10, y0 + 128, str(cnt[c]), "middle", 12, col, cnt[c] > 1, True))
    panel(22, 7, 3, "a = 7, b = 3: gcd(7, 26) = 1。どの暗号文の文字もちょうど 1 回ずつ現れる（復号できる）", SIG)
    panel(192, 2, 3, "a = 2, b = 3: gcd(2, 26) = 2。A と N がどちらも D になる（復号できない）", ALI)
    o.append(T(16, 346, "a = 2 では暗号文に現れるのは B, D, F, … の 13 文字だけで、それぞれ 2 つの平文の文字から来る。",
               "start", 11.5, INK))
    return SVG(760, 360, o, "アフィン暗号の対応表。a の逆元があるとき（上）は 1 対 1 に対応し、無いとき（下）は異なる平文の文字が"
               "同じ暗号文の文字になる。")
F["e12_affine"] = _f12_affine()


# 13. 頻度分析: 単一換字式暗号では出現回数が並べ替わるだけ
_C12_TEXT = ("THE ART OF SECRET WRITING IS VERY OLD. JULIUS CAESAR SHIFTED EACH LETTER OF HIS MESSAGES BY THREE "
             "PLACES IN THE ALPHABET, AND FOR CENTURIES SIMILAR METHODS WERE THOUGHT TO BE SAFE. THE WEAKNESS OF "
             "THESE METHODS IS THAT EACH LETTER OF THE PLAINTEXT IS ALWAYS REPLACED BY THE SAME LETTER OF THE "
             "CIPHERTEXT. IN ENGLISH THE LETTER E APPEARS MORE OFTEN THAN ANY OTHER LETTER, FOLLOWED BY T AND A, "
             "SO THE MOST COMMON LETTER IN THE CIPHERTEXT IS PROBABLY THE IMAGE OF E. SCHOLARS IN BAGHDAD "
             "DESCRIBED THIS METHOD MORE THAN A THOUSAND YEARS AGO, AND IT STILL WORKS AGAINST ANY CIPHER THAT "
             "KEEPS THE STATISTICS OF THE LANGUAGE. A GOOD CIPHER MUST HIDE THESE STATISTICS COMPLETELY, SO THAT "
             "THE CIPHERTEXT LOOKS LIKE A RANDOM STRING OF LETTERS TO ANYONE WHO DOES NOT KNOW THE KEY.")


def _f12_freq():
    o = []
    letters = [ch for ch in _C12_TEXT if "A" <= ch <= "Z"]
    n = len(letters)
    pc = [letters.count(ch) for ch in _C12_AL]
    cc = [0] * 26
    for i, v in enumerate(pc):
        cc[ord(_C12_PERM[i]) - 65] += v
    mx = max(pc)
    x0, bw, H = 70, 25, 72
    hl = {"E": (SIG, SSOFT), "T": (_C12B, _C12BS), "A": (ALI, ASOFT)}
    def chart(base, counts, colmap):
        o.append(W(x0 - 4, base, x0 + 26 * bw, base, c=LIN, lw=1.2))
        for i in range(26):
            hgt = counts[i] / mx * H
            c, fl = colmap.get(i, (FNT, SCR))
            o.append(RECT(x0 + i * bw + 3, base - hgt, bw - 6, hgt, 2, fl if c != FNT else LIN, c, 1.2))
            o.append(T(x0 + i * bw + bw / 2, base + 14, _C12_AL[i], "middle", 11, c if c != FNT else MUT, c != FNT, True))
            if c != FNT:
                o.append(T(x0 + i * bw + bw / 2, base - hgt - 5, str(counts[i]), "middle", 10.5, c, True))
    top = {i: hl[ch] for i, ch in enumerate(_C12_AL) if ch in hl}
    bot = {ord(_C12_PERM[ord(ch) - 65]) - 65: hl[ch] for ch in hl}
    o.append(T(x0, 20, "平文の各文字の出現回数（英文の例、%d 文字）" % n, "start", 12.5, INK, True))
    chart(118, pc, top)
    chart(274, cc, bot)
    o.append(T(x0, 310, "単一換字式暗号（前の図の対応表）で暗号化した後の、暗号文の各文字の出現回数", "start", 12.5, INK, True))
    for ch, (c, fl) in hl.items():
        i = ord(ch) - 65
        j = ord(_C12_PERM[i]) - 65
        o.append(ARR(x0 + i * bw + bw / 2, 138, x0 + j * bw + bw / 2, 274 - cc[j] / mx * H - 20, c, 1.4, 6))
    o.append(T(x0 + 26 * bw + 6, 196, "E → B", "start", 11.5, SIG, True))
    o.append(T(x0 + 26 * bw + 6, 214, "T → E", "start", 11.5, _C12B, True))
    o.append(T(x0 + 26 * bw + 6, 232, "A → C", "start", 11.5, ALI, True))
    return SVG(760, 322, o, "単一換字式暗号では、各文字の出現回数はそのまま別の文字に移るだけである。暗号文で最も多い B（91 回）は、"
               "平文で最も多い E の置き換え先である。")
F["e12_freq"] = _f12_freq()


# 14. ヴィジュネル暗号の例（ATTACK, 鍵 KEY）
def _f12_vigenere():
    o = []
    p, key = "ATTACK", "KEY"
    kc = [(SIG, SSOFT), (_C12B, _C12BS), (ALI, ASOFT)]
    x0, cw = 150, 92
    rows = ["位置 i", "平文 P", "鍵の文字", "P + 鍵", "暗号文 C"]
    for r, nm in enumerate(rows):
        o.append(T(x0 - 14, 36 + r * 36, nm, "end", 12, MUT, True))
    for i, ch in enumerate(p):
        x = x0 + i * cw
        kk = key[i % 3]; c, fl = kc[i % 3]
        s = (ord(ch) - 65) + (ord(kk) - 65)
        o.append(T(x + 40, 36, str(i), "middle", 11.5, MUT, False, True))
        o.append(RECT(x, 54, 80, 28, 6, PAN, INK if ch == "T" else LIN, 1.6 if ch == "T" else 1.2))
        o.append(T(x + 40, 73, "%s (%d)" % (ch, ord(ch) - 65), "middle", 12.5, INK, ch == "T", True))
        o.append(RECT(x, 90, 80, 28, 6, fl, c, 1.3))
        o.append(T(x + 40, 109, "%s (%d)" % (kk, ord(kk) - 65), "middle", 12.5, c, True, True))
        o.append(T(x + 40, 145, str(s) if s < 26 else "%d → %d" % (s, s - 26), "middle", 12, INK, False, True))
        cch = _C12_AL[s % 26]
        o.append(RECT(x, 162, 80, 28, 6, PAN, INK, 1.4))
        o.append(T(x + 40, 181, "%s (%d)" % (cch, s % 26), "middle", 12.5, INK, True, True))
    o.append(T(x0 + 1.5 * cw + 40, 214, "同じ T が X と R になる（鍵の文字が E と Y で違う）", "middle", 11.5, ALI, True))
    o.append(T(x0 + 1.5 * cw + 40, 232, "2 つの A はどちらも鍵の K に当たったので、どちらも K になる", "middle", 11.5, SIG))
    return SVG(760, 244, o, "ヴィジュネル暗号。鍵 KEY を繰り返して並べ、平文の文字と鍵の文字を mod 26 で足す。"
               "鍵の文字ごとに、ずらし量の違うシーザー暗号を使っていることになる。")
F["e12_vigenere"] = _f12_vigenere()


# 15. カシスキー・テスト
def _f12_kasiski():
    o = []
    p = "THEENEMYKNOWSTHESYSTEMANDTHEKEYISTHEONLYSECRET"
    key = "KEY"
    c = "".join(_C12_AL[(ord(a) - 65 + ord(key[i % 3]) - 65) % 26] for i, a in enumerate(p))
    x0, cw = 70, 14.8
    the = [0, 13, 25, 33]
    g1 = {0, 1, 2, 33, 34, 35}
    g2 = {13, 14, 15, 25, 26, 27}
    o.append(T(x0 - 10, 24, "位置", "end", 11, MUT, True))
    for i in range(0, len(p), 5):
        o.append(T(x0 + i * cw + 6.5, 24, str(i), "middle", 9.5, MUT, False, True))
    def row(y, s, lab, fills, cols, tcols):
        o.append(T(x0 - 10, y + 15, lab, "end", 11, MUT, True))
        for i, ch in enumerate(s):
            f = fills.get(i, PAN); cl = cols.get(i, LIN)
            o.append(RECT(x0 + i * cw, y, cw - 1.6, 21, 2.5, f, cl, 1))
            o.append(T(x0 + i * cw + 6.6, y + 15, ch, "middle", 10.5, tcols.get(i, INK), False, True))
    thep = {i + j for i in the for j in range(3)}
    row(34, p, "平文", {i: SCR for i in thep}, {i: MUT for i in thep}, {})
    kcol = [SIG, _C12B, ALI]
    row(60, "".join(key[i % 3] for i in range(len(p))), "鍵", {}, {}, {i: kcol[i % 3] for i in range(len(p))})
    row(86, c, "暗号文", {**{i: SSOFT for i in g1}, **{i: _C12BS for i in g2}},
        {**{i: SIG for i in g1}, **{i: _C12B for i in g2}}, {})
    # 間隔の括弧
    def brace(i, j, y, col, lab):
        xa, xb = x0 + i * cw + 6.6, x0 + j * cw + 6.6
        o.append(W(xa, 110, xa, y, c=col, lw=1.4))
        o.append(W(xb, 110, xb, y, c=col, lw=1.4))
        o.append(DARR(xa, y, xb, y, col, 1.4, 5))
        o.append(T((xa + xb) / 2, y - 5, lab, "middle", 11.5, col, True))
    brace(0, 33, 144, SIG, "DLC の間隔 33 = 3 × 11")
    brace(13, 25, 174, _C12B, "XFO の間隔 12 = 3 × 4")
    o.append(T(x0, 206, "平文の THE は位置 0, 13, 25, 33 にある。間隔が 3 の倍数の組（0 と 33、13 と 25）だけが同じ鍵の文字", "start", 11.5, INK))
    o.append(T(x0, 224, "で暗号化され、暗号文でも一致する。位置 0 と 13（間隔 13）の THE は、暗号文では DLC と XFO で一致しない。",
               "start", 11.5, INK))
    o.append(T(x0, 250, "暗号文の繰り返しの間隔 33 と 12 の最大公約数は 3 → 鍵長は 3（または 1）と推定できる", "start", 12, SIG, True))
    return SVG(760, 266, o, "カシスキー・テストの例。平文は「敵は方式を知っている。鍵だけが秘密である」という意味の英文で、"
               "鍵 KEY のヴィジュネル暗号で暗号化した。")
F["e12_kasiski"] = _f12_kasiski()


# ---------------------------------------------------------------- 5 節
def _c12_xorblock(x, y, rows, cw=26, hl_row=None, lab_w=58):
    """rows = [(ラベル, ビット列, 色, 塗り), …]。最後の行の前に横線を引く"""
    o = []
    for r, (lab, s, c, fl) in enumerate(rows):
        yy = y + r * 34 + (6 if r == len(rows) - 1 else 0)
        o.append(T(x + lab_w - 10, yy + 18, lab, "end", 12.5, c, True))
        o.append(_c12_cells(x + lab_w, yy, s, cw, 26, {i: fl for i in range(len(s))} if fl else None,
                            {i: c for i in range(len(s))} if fl else None, None, 12.5))
    ly = y + (len(rows) - 1) * 34
    o.append(W(x + lab_w - 2, ly, x + lab_w + len(rows[0][1]) * cw, ly, c=INK, lw=1.4))
    return "".join(o)


# 16. ワンタイムパッドの暗号化と復号
def _f12_otp():
    o = []
    P, K = "10110010", "01101011"
    Cc = "".join("1" if a != b else "0" for a, b in zip(P, K))
    o.append(T(30, 22, "暗号化（送信者）", "start", 13, SIG, True))
    o.append(_c12_xorblock(20, 34, [("P", P, INK, None), ("⊕ K", K, SIG, SSOFT), ("C", Cc, INK, SCR)]))
    o.append(T(410, 22, "復号（受信者）", "start", 13, _C12B, True))
    o.append(_c12_xorblock(400, 34, [("C", Cc, INK, None), ("⊕ K", K, SIG, SSOFT), ("P", P, _C12B, _C12BS)]))
    o.append(T(380, 164, "同じ鍵 K をもう一度 XOR すると、K ⊕ K = 0 なので P に戻る", "middle", 12, INK))
    return SVG(760, 178, o, "ワンタイムパッド（8 ビットの例）。鍵 K は平文と同じ長さで、一様ランダムに選び、1 回しか使わない。")
F["e12_otp"] = _f12_otp()


# 17. n = 2 のとき: どの平文にも、暗号文 10 を作る鍵がちょうど 1 つある
def _f12_otpall():
    o = []
    bits = ["00", "01", "10", "11"]
    c = "10"
    x0, y0, cw, ch = 120, 50, 64, 34
    o.append(T(x0 + 2 * cw, 22, "鍵 k", "middle", 12, MUT, True))
    o.append(T(x0 - 50, y0 + 2 * ch + 4, "平文 p", "middle", 12, MUT, True))
    for j, k in enumerate(bits):
        o.append(T(x0 + j * cw + cw / 2, y0 - 10, k, "middle", 12.5, SIG, True, True))
    for i, p in enumerate(bits):
        o.append(T(x0 - 12, y0 + i * ch + 22, p, "end", 12.5, INK, True, True))
        for j, k in enumerate(bits):
            v = format(int(p, 2) ^ int(k, 2), "02b")
            on = v == c
            o.append(RECT(x0 + j * cw + 3, y0 + i * ch + 3, cw - 6, ch - 6, 5, ASOFT if on else PAN, ALI if on else LIN, 1.8 if on else 1))
            o.append(T(x0 + j * cw + cw / 2, y0 + i * ch + 22, v, "middle", 12.5, ALI if on else MUT, on, True))
    o.append(T(x0 + 2 * cw, y0 + 4 * ch + 22, "表の中身は暗号文 p ⊕ k", "middle", 11, MUT))
    x1 = 440
    o.append(T(x1, 40, "暗号文 c = 10 を見たとき", "start", 13, ALI, True))
    for i, p in enumerate(bits):
        k = format(int(p, 2) ^ int(c, 2), "02b")
        o.append(T(x1, 72 + i * 26, "p = %s なら k = %s" % (p, k), "start", 12.5, INK, False, True))
    o.append(T(x1, 186, "どの平文にも鍵が 1 つずつあり、", "start", 12, INK))
    o.append(T(x1, 206, "4 つの鍵は確率 1/4 ずつで選ばれる", "start", 12, INK))
    return SVG(760, 230, o, "2 ビットのワンタイムパッド。赤の枠が暗号文 10 になる組で、どの行（平文）にもどの列（鍵）にも 1 つずつある。"
               "暗号文 10 からは、4 つの平文のどれも同じ程度にありうる。")
F["e12_otpall"] = _f12_otpall()


# 18. 鍵を再利用すると鍵が消える
def _f12_reuse():
    o = []
    P1, P2, K = "10110010", "01100111", "01101011"
    x = lambda a, b: "".join("1" if p != q else "0" for p, q in zip(a, b))
    C1, C2 = x(P1, K), x(P2, K)
    o.append(T(20, 22, "同じ鍵 K で 2 つの平文を暗号化", "start", 13, INK, True))
    o.append(_c12_xorblock(10, 34, [("P₁", P1, INK, None), ("⊕ K", K, SIG, SSOFT), ("C₁", C1, INK, SCR)], 22, lab_w=48))
    o.append(_c12_xorblock(10, 154, [("P₂", P2, INK, None), ("⊕ K", K, SIG, SSOFT), ("C₂", C2, INK, SCR)], 22, lab_w=48))
    o.append(T(300, 22, "攻撃者は C₁ と C₂ を XOR する", "start", 13, ALI, True))
    o.append(_c12_xorblock(290, 34, [("C₁", C1, INK, None), ("⊕ C₂", C2, INK, None), ("", x(C1, C2), ALI, ASOFT)], 26, lab_w=70))
    o.append(T(300, 172, "平文どうしの XOR", "start", 13, INK, True))
    o.append(_c12_xorblock(290, 184, [("P₁", P1, INK, None), ("⊕ P₂", P2, INK, None)], 26, lab_w=70))
    o.append(_c12_cells(360, 258, x(P1, P2), 26, 26, {i: ASOFT for i in range(8)}, {i: ALI for i in range(8)}, None, 12.5))
    o.append(T(590, 112, "← 一致する", "start", 12, ALI, True))
    o.append(T(590, 132, "K が消えた", "start", 12, ALI, True))
    o.append(W(574, 101, 574, 270, c=ALI, lw=1.2, dash="4,3"))
    return SVG(760, 296, o, "同じ鍵を 2 回使うと、C₁ ⊕ C₂ = (P₁ ⊕ K) ⊕ (P₂ ⊕ K) = P₁ ⊕ P₂ となり、鍵が消えて平文どうしの XOR が現れる。")
F["e12_reuse"] = _f12_reuse()


# ---------------------------------------------------------------- 6 節
# 19. 拡散: 古典暗号と AES の比較
def _f12_diffusion():
    o = []
    o.append(RECT(14, 12, 300, 210, 12, PAN, ALI, 1.4))
    o.append(T(164, 36, "ヴィジュネル暗号（鍵 KEY）", "middle", 13, ALI, True))
    o.append(T(30, 70, "平文", "start", 11.5, MUT, True)); o.append(T(30, 140, "暗号文", "start", 11.5, MUT, True))
    o.append(_c12_cells(90, 54, "ATTACK", 30, 26, None, None, None, 13))
    o.append(_c12_cells(90, 86, "ATTACH", 30, 26, {5: ASOFT}, {5: ALI}, None, 13, {5}))
    o.append(_c12_cells(90, 124, "KXRKGI", 30, 26, None, None, None, 13))
    o.append(_c12_cells(90, 156, "KXRKGF", 30, 26, {5: ASOFT}, {5: ALI}, None, 13, {5}))
    o.append(T(164, 206, "平文 1 文字の変化 → 暗号文も 1 文字だけ", "middle", 11.5, ALI, True))
    x0 = 330
    o.append(RECT(x0, 12, 416, 210, 12, PAN, SIG, 1.4))
    o.append(T(x0 + 208, 36, "AES-128（鍵 000102…0e0f）", "middle", 13, SIG, True))
    p1, p2 = "00112233445566778899aabbccddeeff", "00112233445566778899aabbccddeefe"
    c1, c2 = "69c4e0d86a7b0430d8cdb78070b4c55a", "c32d9c183e5b132e3e43fd740aa1290f"
    def hexrow(y, s, ref, lab):
        o.append(T(x0 + 14, y, lab, "start", 11, MUT, True))
        for i, ch in enumerate(s):
            d = ref is not None and ch != ref[i]
            o.append(T(x0 + 84 + i * 10, y, ch, "middle", 12, ALI if d else INK, d, True))
    hexrow(70, p1, None, "平文 1")
    hexrow(94, p2, p1, "平文 2")
    hexrow(140, c1, None, "暗号文 1")
    hexrow(164, c2, c1, "暗号文 2")
    o.append(T(x0 + 208, 206, "平文 1 ビットの変化 → 128 ビット中 62 ビットが変わる", "middle", 11.5, SIG, True))
    return SVG(760, 234, o, "拡散の比較。古典暗号では平文の変化がその場所にとどまるが、AES では 1 ビットの変化が暗号文全体に広がる"
               "（16 進表示で赤が変わった桁）。AES の値は FIPS 197 の例の平文と鍵で計算した。")
F["e12_diffusion"] = _f12_diffusion()
