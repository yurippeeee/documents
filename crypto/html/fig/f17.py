# 17 章 ディフィー・ヘルマンと楕円曲線暗号 の図（figures.py の関数・定数をそのまま使う）
# 色の約束: 公開 = 青、秘密 = 赤（ALI）、共有した鍵・結果 = SIG
# ほかの章の fNN.py と名前が衝突しないよう、補助関数と定数には _e17 を付ける
import re as _e17_re

_E17_BL = "var(--blue)"
_E17_BS = "rgba(47,111,158,.14)"


def _e17_T(x, y, s, a="middle", sz=11.5, c=MUT, b=False, mono=False):
    """T と同じだが、^{…} を上付き、_{…} を下付きにする"""
    if c == LIN:
        c = MUT
    out, cur = [], 0.0
    for p in _e17_re.split(r"(\^\{[^}]*\}|_\{[^}]*\})", s):
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


def _e17_kind(kind):
    return {"pub": (_E17_BL, _E17_BS), "sec": (ALI, ASOFT), "res": (SIG, SSOFT), "neu": (LIN, PAN)}[kind]


def _e17_box(x, y, w, h, t1, t2=None, kind="neu", sz=12.5, ssz=10.5, mono1=False):
    c, fl = _e17_kind(kind)
    col = INK if kind == "neu" else c
    o = [RECT(x, y, w, h, 8, fl, c, 1.5 if kind != "neu" else 1.2)]
    if t2:
        o.append(_e17_T(x + w / 2, y + h / 2 - 3, t1, "middle", sz, col, True, mono1))
        o.append(_e17_T(x + w / 2, y + h / 2 + ssz + 3, t2, "middle", ssz, MUT))
    else:
        o.append(_e17_T(x + w / 2, y + h / 2 + sz * 0.36, t1, "middle", sz, col, True, mono1))
    return "".join(o)


# ---------- 実数の楕円曲線を描く補助 ----------
def _e17_frame(o, px, py, pw, ph, xr, yr, axes=True):
    """描画枠 (px, py, pw, ph) に x 範囲 xr、y 範囲 yr を対応させる。X, Y を返す"""
    X = lambda x: px + (x - xr[0]) / (xr[1] - xr[0]) * pw
    Y = lambda y: py + ph - (y - yr[0]) / (yr[1] - yr[0]) * ph
    o.append(RECT(px, py, pw, ph, 6, PAN, LIN, 1))
    if axes:
        if xr[0] < 0 < xr[1]:
            o.append(W(X(0), py + 2, X(0), py + ph - 2, c=LIN, lw=1))
        if yr[0] < 0 < yr[1]:
            o.append(W(px + 2, Y(0), px + pw - 2, Y(0), c=LIN, lw=1))
    return X, Y


def _e17_curve(o, a, b, X, Y, xr, yr, c=INK, lw=2.0):
    """y^2 = x^3 + a x + b の実数の点を描く（右端は描画範囲で切る）"""
    f = lambda x: x ** 3 + a * x + b
    N = 900
    xs = [xr[0] + (xr[1] - xr[0]) * i / N for i in range(N + 1)]
    segs, cur = [], []
    for x in xs:
        if f(x) >= 0:
            cur.append(x)
        elif cur:
            segs.append(cur); cur = []
    if cur:
        segs.append(cur)
    def root(lo, hi):
        for _ in range(60):
            m = (lo + hi) / 2
            if (f(lo) >= 0) == (f(m) >= 0):
                lo = m
            else:
                hi = m
        return (lo + hi) / 2
    step = (xr[1] - xr[0]) / N
    ym2 = yr[1] ** 2
    for sg in segs:
        x0, x1 = sg[0], sg[-1]
        if x0 > xr[0] + step / 2:
            x0 = root(x0 - step, x0)
        if x1 < xr[1] - step / 2:
            x1 = root(x1 + step, x1)
        if f(x1) > ym2:              # 右端が上下にはみ出すなら、はみ出す手前で切る
            lo, hi = x0, x1
            for _ in range(60):
                m = (lo + hi) / 2
                if f(m) > ym2 and all(f(t) > ym2 for t in (m,)):
                    hi = m
                else:
                    lo = m
            x1 = lo
            sg = [x for x in sg if x < x1]
        pts = [x0] + sg + [x1]
        up = [(X(x), Y(max(yr[0], min(yr[1], max(0, f(x)) ** 0.5)))) for x in pts]
        dn = [(X(x), Y(max(yr[0], min(yr[1], -(max(0, f(x)) ** 0.5))))) for x in pts]
        o.append(PL(dn[::-1] + up, c, lw))


def _e17_pt(o, X, Y, x, y, lab, c, fill=True, dx=8, dy=-8, anchor="start", sz=12):
    o.append(CIRC(X(x), Y(y), 5.5, c, 1.8, c if fill else PAN))
    o.append(_e17_T(X(x) + dx, Y(y) + dy, lab, anchor, sz, c, True))


# 1 節: DH の流れ
def _f17_dhflow():
    o = []
    o.append(RECT(260, 10, 300, 40, 9, _E17_BS, _E17_BL, 1.5))
    o.append(T(410, 35, "公開のパラメータ: p = 23、g = 5", "middle", 13, _E17_BL, True))
    o.append(RECT(316, 62, 188, 262, 10, SCR, LIN, 1, "5,4"))
    o.append(T(150, 82, "Alice", "middle", 13.5, INK, True))
    o.append(T(410, 82, "通信路", "middle", 12.5, MUT, True))
    o.append(T(670, 82, "Bob", "middle", 13.5, INK, True))
    rows = [(96, "① 秘密の a = 6 を選ぶ", "① 秘密の b = 15 を選ぶ", "sec"),
            (146, "② A = 5^{6} mod 23 = 8", None, "pub"),
            (196, None, "③ B = 5^{15} mod 23 = 19", "pub"),
            (258, "④ K = 19^{6} mod 23 = 2", "④ K = 8^{15} mod 23 = 2", "res")]
    for y, ta, tb, kind in rows:
        if ta:
            o.append(_e17_box(40, y, 220, 36, ta, None, kind, 12.5, mono1=False))
        if tb:
            o.append(_e17_box(560, y, 220, 36, tb, None, kind, 12.5))
    o.append(ARR(262, 176, 556, 176, _E17_BL, 2))
    o.append(T(410, 170, "A = 8", "middle", 12, _E17_BL, True, True))
    o.append(ARR(558, 226, 264, 226, _E17_BL, 2))
    o.append(T(410, 220, "B = 19", "middle", 12, _E17_BL, True, True))
    o.append(T(410, 256, "Eve に見えるもの", "middle", 11, MUT, True))
    o.append(T(410, 272, "p、g、A = 8、B = 19", "middle", 11, _E17_BL, True))
    o.append(T(410, 294, "見えないもの", "middle", 11, MUT, True))
    o.append(T(410, 310, "a、b、K", "middle", 11, ALI, True))
    return SVG(820, 334, o, "p = 23、g = 5（5 は法 23 の原始根）、a = 6、b = 15 の例。送られるのは A と B だけで、"
               "両者が最後に計算する K = 2 は一度も通信路を流れない。")
F["e17_dhflow"] = _f17_dhflow()


# 1 節: 絵の具のたとえ
def _e17_paint(o, x, y, comps, lab=None, w=72, h=34):
    cols = {"g": (_E17_BS, _E17_BL), "a": (SSOFT, SIG), "b": (ASOFT, ALI)}
    sw = w / len(comps)
    o.append(RECT(x, y, w, h, 8, PAN, MUT, 1.3))
    for i, c in enumerate(comps):
        fl, st = cols[c]
        o.append(RECT(x + i * sw + 3, y + 3, sw - 6, h - 6, 5, fl, st, 1.2))
        o.append(T(x + i * sw + sw / 2, y + h / 2 + 4.5, c, "middle", 13, st, True, True))
    if lab:
        o.append(T(x + w / 2, y + h + 15, lab, "middle", 10.5, MUT))

def _f17_paint():
    o = []
    o.append(T(140, 22, "Alice", "middle", 13.5, INK, True))
    o.append(T(680, 22, "Bob", "middle", 13.5, INK, True))
    o.append(RECT(330, 8, 160, 250, 10, SCR, LIN, 1, "5,4"))
    o.append(T(410, 26, "通信路（Eve）", "middle", 12, MUT, True))
    # ① 公開の色と秘密の色
    _e17_paint(o, 374, 40, ["g"], "公開の色 g")
    _e17_paint(o, 60, 40, ["g"], "公開の色")
    _e17_paint(o, 160, 40, ["a"], "秘密の色 a")
    _e17_paint(o, 588, 40, ["g"], "公開の色")
    _e17_paint(o, 688, 40, ["b"], "秘密の色 b")
    o.append(T(20, 62, "①", "start", 13, INK, True))
    # ② 混ぜて送る
    o.append(T(20, 134, "②", "start", 13, INK, True))
    _e17_paint(o, 104, 112, ["g", "a"], "g + a を送る")
    _e17_paint(o, 644, 112, ["g", "b"], "g + b を送る")
    o.append(ARR(178, 129, 540, 211, SIG, 1.6))
    o.append(ARR(642, 129, 104, 211, ALI, 1.6))
    o.append(T(410, 104, "混ざった色は見えるが、", "middle", 10.5, INK))
    o.append(T(410, 119, "a や b は取り出せない", "middle", 10.5, ALI, True))
    # ③ 受け取った色に自分の秘密の色を混ぜる
    o.append(T(20, 236, "③", "start", 13, INK, True))
    _e17_paint(o, 64, 214, ["g", "b"], "受け取った g + b")
    o.append(T(146, 236, "+", "middle", 16, INK, True))
    _e17_paint(o, 156, 214, ["a"], None, 40)
    o.append(T(206, 236, "→", "middle", 14, INK, True))
    _e17_paint(o, 216, 214, ["g", "a", "b"], None, 96)
    _e17_paint(o, 506, 214, ["g", "a"], "受け取った g + a")
    o.append(T(588, 236, "+", "middle", 16, INK, True))
    _e17_paint(o, 598, 214, ["b"], None, 40)
    o.append(T(648, 236, "→", "middle", 14, INK, True))
    _e17_paint(o, 658, 214, ["g", "a", "b"], None, 96)
    o.append(T(264, 266, "同じ色 g + a + b", "middle", 11, SIG, True))
    o.append(T(706, 266, "同じ色 g + a + b", "middle", 11, SIG, True))
    return SVG(820, 280, o, "絵の具のたとえ。① 全員が公開の色 g を持ち、Alice と Bob はそれぞれ秘密の色を持つ。"
               "② 自分の秘密の色を g に混ぜたものだけを送る。Eve には g と、通信路を通る 2 つの混ざった色が見えている。③ 受け取った色に自分の秘密の色を混ぜると、"
               "どちらも g + a + b になる。")
F["e17_paint"] = _f17_paint()


# 1 節: 中間者攻撃
def _f17_mitm():
    o = []
    xs = {"A": 110, "M": 410, "B": 710}
    o.append(T(xs["A"], 22, "Alice", "middle", 13.5, INK, True))
    o.append(T(xs["M"], 22, "Mallory（中間者）", "middle", 13.5, ALI, True))
    o.append(T(xs["B"], 22, "Bob", "middle", 13.5, INK, True))
    for k in xs:
        o.append(W(xs[k], 30, xs[k], 190, c=LIN, lw=1.2, dash="4,4"))
    o.append(_e17_box(20, 36, 180, 30, "a = 6（秘密）", None, "sec", 12))
    o.append(_e17_box(320, 36, 180, 30, "m = 9（秘密）", None, "sec", 12))
    o.append(_e17_box(620, 36, 180, 30, "b = 15（秘密）", None, "sec", 12))
    # Alice → Mallory、Mallory → Bob
    o.append(ARR(xs["A"] + 2, 92, xs["M"] - 4, 92, _E17_BL, 1.8))
    o.append(T(260, 86, "A = 8", "middle", 11.5, _E17_BL, True, True))
    o.append(ARR(xs["M"] + 2, 92, xs["B"] - 4, 92, ALI, 1.8))
    o.append(_e17_T(560, 86, "5^{9} mod 23 = 11（Alice のふり）", "middle", 11, ALI, True))
    # Bob → Mallory、Mallory → Alice
    o.append(ARR(xs["B"] - 2, 128, xs["M"] + 4, 128, _E17_BL, 1.8))
    o.append(T(560, 122, "B = 19", "middle", 11.5, _E17_BL, True, True))
    o.append(ARR(xs["M"] - 2, 128, xs["A"] + 4, 128, ALI, 1.8))
    o.append(T(260, 122, "11（Bob のふり）", "middle", 11, ALI, True))
    # 鍵
    o.append(_e17_box(20, 150, 180, 44, "K_{1} = 11^{6} mod 23 = 9", "Bob との鍵だと思っている", "res", 12, 10))
    o.append(RECT(300, 150, 220, 64, 8, ASOFT, ALI, 1.5))
    o.append(_e17_T(410, 170, "K_{1} = 8^{9} mod 23 = 9", "middle", 12, ALI, True))
    o.append(_e17_T(410, 190, "K_{2} = 19^{9} mod 23 = 10", "middle", 12, ALI, True))
    o.append(T(410, 207, "両方を知っている", "middle", 10, MUT))
    o.append(_e17_box(620, 150, 180, 44, "K_{2} = 11^{15} mod 23 = 10", "Alice との鍵だと思っている", "res", 12, 10))
    # 中継
    o.append(_e17_box(20, 236, 180, 34, "鍵 9 で暗号化して送る", None, "neu", 11.5))
    o.append(ARR(202, 253, 298, 253, INK, 1.6))
    o.append(_e17_box(300, 236, 220, 34, "鍵 9 で復号して読み、鍵 10 で暗号化", None, "sec", 11))
    o.append(ARR(522, 253, 618, 253, INK, 1.6))
    o.append(_e17_box(620, 236, 180, 34, "鍵 10 で復号する", None, "neu", 11.5))
    return SVG(820, 284, o, "p = 23、g = 5 の DH に、Mallory が秘密の値 m = 9 で割り込んだ場合。Alice と Bob は"
               "それぞれ Mallory と鍵を共有したことに気づかず、Mallory は中継しながらすべての通信を読める。")
F["e17_mitm"] = _f17_mitm()


# 1 節: 前方秘匿性
def _f17_fs():
    o = []
    x0, x1 = 170, 760
    def row(y, title, tc, fs):
        o.append(T(20, y - 30, title, "start", 12.5, tc, True))
        o.append(ARR(x0, y + 30, x1 + 30, y + 30, MUT, 1.2))
        o.append(T(x1 + 30, y + 46, "時間", "end", 10, MUT))
        o.append(RECT(20, y - 12, 136, 40, 8, ASOFT, ALI, 1.4))
        o.append(T(88, y + 4, "長期秘密鍵", "middle", 11.5, ALI, True))
        o.append(T(88, y + 20, "（サーバが何年も使う）", "middle", 9.5, MUT))
        for i, xx in enumerate([200, 340, 480]):
            o.append(RECT(xx, y - 12, 110, 40, 8, PAN, LIN, 1.2))
            o.append(_e17_T(xx + 55, y + 4, "通信 %d: 鍵 K_{%d}" % (i + 1, i + 1), "middle", 11, INK, True))
            if fs:
                o.append(T(xx + 55, y + 20, "a, b は終了後に消す", "middle", 9.5, SIG))
            else:
                o.append(T(xx + 55, y + 20, "K を長期鍵で運ぶ", "middle", 9.5, ALI))
        o.append(T(640, y - 4, "後で長期秘密鍵が", "middle", 11, ALI, True))
        o.append(T(640, y + 12, "漏れる", "middle", 11, ALI, True))
        o.append(W(700, y - 16, 692, y + 4, 704, y + 4, 694, y + 26, c=ALI, lw=2))
    row(60, "長期秘密鍵で共通鍵を運ぶ方式（TLS 1.2 までの RSA 鍵交換、16 章 8 節）", ALI, False)
    o.append(RECT(200, 104, 390, 26, 6, ASOFT, ALI, 1))
    o.append(_e17_T(395, 122, "保存されていた通信 1〜3 の K_{1}〜K_{3} が復号され、すべて読まれる", "middle", 11, ALI, True))
    row(196, "使い捨ての DH（DHE / ECDHE）。長期秘密鍵は署名にだけ使う", SIG, True)
    o.append(RECT(200, 240, 390, 26, 6, SSOFT, SIG, 1))
    o.append(_e17_T(395, 258, "K_{1}〜K_{3} の計算に要る a, b はもう無いので、過去の通信は読めない", "middle", 11, SIG, True))
    return SVG(820, 278, o, "前方秘匿性。共通鍵を毎回使い捨ての DH で作れば、長期秘密鍵が後で漏れても、過去の通信は守られる。")
F["e17_fs"] = _f17_fs()


# 2 節: 実数で描いた曲線の形
def _f17_curves():
    o = []
    panels = [(-1, 1, "y^{2} = x^{3} − x + 1", "4a^{3} + 27b^{2} = 23", True, None),
              (-1, 0, "y^{2} = x^{3} − x", "4a^{3} + 27b^{2} = −4", True, None),
              (0, 0, "y^{2} = x^{3}", "4a^{3} + 27b^{2} = 0", False, (0, 0, "尖った点")),
              (-3, 2, "y^{2} = x^{3} − 3x + 2", "4a^{3} + 27b^{2} = 0", False, (1, 0, "自分と交わる点"))]
    for i, (a, b, ttl, disc, good, sing) in enumerate(panels):
        px = 16 + i * 200
        o.append(_e17_T(px + 90, 22, ttl, "middle", 12, INK, True))
        o.append(_e17_T(px + 90, 40, disc, "middle", 10.5, SIG if good else ALI, True))
        X, Y = _e17_frame(o, px, 50, 180, 150, (-2.5, 2.3), (-3.2, 3.2))
        _e17_curve(o, a, b, X, Y, (-2.5, 2.3), (-3.2, 3.2), SIG if good else ALI, 2)
        if sing:
            o.append(CIRC(X(sing[0]), Y(sing[1]), 9, ALI, 1.6))
            if i == 2:
                o.append(T(X(sing[0]) + 14, Y(sing[1]) - 14, sing[2], "start", 10.5, ALI, True))
            else:
                o.append(T(X(1), Y(-2.85), sing[2], "middle", 10.5, ALI, True))
        o.append(T(px + 90, 220, "使える" if good else "使えない（特異点がある）", "middle", 11.5, SIG if good else ALI, True))
    return SVG(820, 232, o, "係数と座標を実数として描いた楕円曲線。左の 2 つは 4a³ + 27b² ≠ 0 で、なめらかな曲線になる"
               "（2 つ目のように 2 つの部分に分かれることもある）。右の 2 つは 4a³ + 27b² = 0 で、特異点（丸印）がある。")
F["e17_curves"] = _f17_curves()


# 2 節: 点の足し算（弦・接線・垂直線）
def _f17_add():
    o = []
    a, b = -1, 1
    # (1) P + Q
    o.append(T(140, 20, "① P + Q（P ≠ Q）", "middle", 12.5, INK, True))
    xr, yr = (-1.8, 3.8), (-6.2, 6.2)
    X, Y = _e17_frame(o, 16, 30, 248, 250, xr, yr)
    _e17_curve(o, a, b, X, Y, xr, yr, MUT, 1.8)
    o.append(PL([(X(-1.6), Y(-2 * -1.6 + 1)), (X(3.5), Y(-2 * 3.5 + 1))], _E17_BL, 1.6))
    o.append(W(X(3), Y(-5), X(3), Y(5), c=SIG, lw=1.4, dash="4,3"))
    _e17_pt(o, X, Y, 0, 1, "P", INK, True, -10, -6, "end")
    _e17_pt(o, X, Y, 1, -1, "Q", INK, True, 8, 16)
    _e17_pt(o, X, Y, 3, -5, "R′", _E17_BL, False, -10, 4, "end")
    _e17_pt(o, X, Y, 3, 5, "P + Q", SIG, True, -10, 4, "end")
    o.append(T(140, 300, "直線と曲線の 3 つ目の交点 R′ を", "middle", 10.5, INK))
    o.append(T(140, 315, "x 軸で折り返した点が P + Q", "middle", 10.5, INK))
    # (2) P + P
    o.append(T(410, 20, "② P + P（接線）", "middle", 12.5, INK, True))
    xr2, yr2 = (-1.8, 2.4), (-3.1, 3.1)
    X2, Y2 = _e17_frame(o, 286, 30, 248, 250, xr2, yr2)
    _e17_curve(o, a, b, X2, Y2, xr2, yr2, MUT, 1.8)
    o.append(PL([(X2(-1.7), Y2(-1.7)), (X2(2.3), Y2(2.3))], _E17_BL, 1.6))
    o.append(W(X2(-1), Y2(-1), X2(-1), Y2(1), c=SIG, lw=1.4, dash="4,3"))
    _e17_pt(o, X2, Y2, 1, 1, "P", INK, True, 10, 14)
    _e17_pt(o, X2, Y2, -1, -1, "R′", _E17_BL, False, 10, 14)
    _e17_pt(o, X2, Y2, -1, 1, "2P", SIG, True, 10, -6)
    o.append(T(410, 300, "P での接線は P で曲線に接し、", "middle", 10.5, INK))
    o.append(T(410, 315, "もう 1 点 R′ で交わる", "middle", 10.5, INK))
    # (3) P + (-P)
    o.append(T(680, 20, "③ P + (−P)（垂直線）", "middle", 12.5, INK, True))
    X3, Y3 = _e17_frame(o, 556, 30, 248, 250, xr2, yr2)
    _e17_curve(o, a, b, X3, Y3, xr2, yr2, MUT, 1.8)
    o.append(W(X3(0), Y3(-3.0), X3(0), Y3(2.95), c=_E17_BL, lw=1.6))
    o.append(ARR(X3(0), Y3(2.2), X3(0), 26, _E17_BL, 1.6))
    o.append(T(X3(0) + 8, 44, "O へ", "start", 11, _E17_BL, True))
    _e17_pt(o, X3, Y3, 0, 1, "P", INK, True, 10, -6)
    _e17_pt(o, X3, Y3, 0, -1, "−P", INK, True, 10, 14)
    o.append(T(680, 300, "曲線上に 3 つ目の交点が無い。", "middle", 10.5, INK))
    o.append(T(680, 315, "無限遠点 O を交点とみなし P + (−P) = O", "middle", 10.5, INK))
    return SVG(820, 326, o, "y² = x³ − x + 1 での点の足し算。① P = (0, 1)、Q = (1, −1) を通る直線は R′ = (3, −5) でも交わり、"
               "P + Q = (3, 5)。② P = (1, 1) での接線は R′ = (−1, −1) で交わり、2P = (−1, 1)。③ x 座標が同じ 2 点を通る直線は垂直になる。")
F["e17_add"] = _f17_add()


# 2 節: 公式の導出（3 次方程式の 3 根）
def _f17_cubic():
    o = []
    a, b = -1, 1
    o.append(T(140, 20, "曲線と直線 y = −2x + 1", "middle", 12.5, INK, True))
    xr, yr = (-1.8, 3.8), (-6.2, 6.2)
    X, Y = _e17_frame(o, 16, 30, 248, 250, xr, yr)
    _e17_curve(o, a, b, X, Y, xr, yr, MUT, 1.8)
    o.append(PL([(X(-1.6), Y(-2 * -1.6 + 1)), (X(3.5), Y(-2 * 3.5 + 1))], _E17_BL, 1.6))
    for (x, y, lab) in [(0, 1, "x = 0"), (1, -1, "x = 1"), (3, -5, "x = 3")]:
        o.append(CIRC(X(x), Y(y), 5, SIG, 1.6, SIG))
        o.append(W(X(x), Y(y), X(x), Y(0), c=SIG, lw=1, dash="3,3"))
        o.append(T(X(x) + 6, Y(0) - 6 if y < 0 else Y(0) + 14, lab, "start", 10.5, SIG, True))
    # 右: f(x)
    o.append(_e17_T(560, 20, "f(x) = (x^{3} − x + 1) − (−2x + 1)^{2}", "middle", 12.5, INK, True))
    xr2, yr2 = (-0.9, 3.9), (-3.5, 3.5)
    X2, Y2 = _e17_frame(o, 296, 30, 290, 250, xr2, yr2)
    fx = lambda x: x ** 3 - 4 * x ** 2 + 3 * x
    xs = [xr2[0] + (xr2[1] - xr2[0]) * i / 600 for i in range(601)]
    pts = [(X2(x), Y2(fx(x))) for x in xs if yr2[0] <= fx(x) <= yr2[1]]
    o.append(PL(pts, _E17_BL, 2))
    for r in (0, 1, 3):
        o.append(CIRC(X2(r), Y2(0), 5, SIG, 1.6, SIG))
        o.append(T(X2(r), Y2(0) + 18, str(r), "middle", 11, SIG, True, True))
    o.append(T(X2(3.75), Y2(0) - 6, "x", "end", 10.5, MUT))
    o.append(_e17_T(600, 120, "= x^{3} − 4x^{2} + 3x", "start", 12, INK, True))
    o.append(T(600, 142, "= x(x − 1)(x − 3)", "start", 12, INK, True))
    o.append(_e17_T(600, 182, "x^{2} の係数 −4 = −λ^{2}", "start", 11.5, _E17_BL, True))
    o.append(T(600, 204, "（傾き λ = −2）", "start", 11, MUT))
    o.append(T(600, 238, "根の和 0 + 1 + 3 = 4", "start", 11.5, SIG, True))
    o.append(_e17_T(600, 258, "= λ^{2}", "start", 11.5, SIG, True))
    return SVG(820, 290, o, "左の 3 つの交点の x 座標 0、1、3 は、曲線の式から直線の式を引いた 3 次式 f(x) = 0 の 3 つの根である。"
               "3 根の和は x² の係数の符号を変えたものに等しい。")
F["e17_cubic"] = _f17_cubic()


# 2 節: GF(17) 上の点
def _f17_gf17():
    o = []
    P, cs = 17, 20
    x0, y0 = 60, 380
    X = lambda x: x0 + x * cs + cs / 2
    Y = lambda y: y0 - y * cs - cs / 2
    o.append(RECT(x0, y0 - P * cs, P * cs, P * cs, 4, PAN, LIN, 1))
    for i in range(P):
        o.append(T(X(i), y0 + 14, str(i), "middle", 9.5, MUT, False, True))
        o.append(T(x0 - 6, Y(i) + 3.5, str(i), "end", 9.5, MUT, False, True))
    o.append(T(x0 + P * cs / 2, y0 + 32, "x", "middle", 11, MUT, True))
    o.append(T(x0 - 30, y0 - P * cs / 2, "y", "middle", 11, MUT, True))
    o.append(W(x0, y0 - 8.5 * cs, x0 + P * cs, y0 - 8.5 * cs, c=FNT, lw=1, dash="4,4"))
    tab = {1: (5, 1), 2: (6, 3), 3: (10, 6), 4: (3, 1), 5: (9, 16), 6: (16, 13), 7: (0, 6), 8: (13, 7), 9: (7, 6),
           10: (7, 11), 11: (13, 10), 12: (0, 11), 13: (16, 4), 14: (9, 1), 15: (3, 16), 16: (10, 11), 17: (6, 14), 18: (5, 16)}
    for k in range(1, 10):
        (xa, ya), (xb, yb) = tab[k], tab[19 - k]
        o.append(W(X(xa), Y(ya), X(xb), Y(yb), c=LIN, lw=1.2))
    for k, (x, y) in tab.items():
        g = k == 1
        o.append(CIRC(X(x), Y(y), 6.5 if g else 5, _E17_BL if g else SIG, 1.6, _E17_BL if g else SSOFT))
        o.append(T(X(x) + 8, Y(y) - 5, ("G" if g else "%dG" % k), "start", 10, _E17_BL if g else INK, g, True))
    o.append(T(440, 60, "y² = x³ + 2x + 2（法 17）", "start", 13, INK, True))
    o.append(T(440, 86, "点は 18 個と無限遠点 O の 19 個", "start", 11.5, INK))
    o.append(T(440, 110, "各点の横の数字 k は、その点が kG", "start", 11.5, INK))
    o.append(T(440, 128, "（G = (5, 1) の k 倍）であることを表す", "start", 11.5, INK))
    o.append(T(440, 166, "破線 y = 8.5 について対称:", "start", 11.5, INK, True))
    o.append(T(440, 186, "(x, y) と (x, 17 − y) は、法 17 で", "start", 11.5, INK))
    o.append(T(440, 204, "y と −y なので P と −P の関係", "start", 11.5, INK))
    o.append(T(440, 236, "線で結んだ kG と (19 − k)G は対になる:", "start", 11.5, INK))
    o.append(T(440, 254, "kG + (19 − k)G = 19G = O", "start", 11.5, SIG, True))
    return SVG(760, 420, o, "法 17 の曲線上の点は、なめらかな曲線ではなく格子点の散らばりになる。それでも 2 節の公式で足し算ができ、"
               "G = (5, 1) を足していくと 18 個の点を 1 回ずつ通って、19G = O に戻る。")
F["e17_gf17"] = _f17_gf17()


# 3 節: ダブル・アンド・アッド
def _f17_dbladd():
    o = []
    o.append(_e17_T(20, 22, "13G を求める（13 = 2^{3} + 2^{2} + 2^{0}、2 進で 1101）", "start", 13, INK, True))
    x0, cw = 140, 150
    labs = ["G", "2G", "4G", "8G"]
    pts = ["(5, 1)", "(6, 3)", "(3, 1)", "(13, 7)"]
    bits = [1, 0, 1, 1]
    o.append(T(x0 - 14, 50, "2 倍を繰り返す", "end", 10.5, MUT))
    o.append(T(x0 - 14, 112, "13 の 2 進の桁", "end", 10.5, MUT))
    o.append(T(x0 - 14, 124, "（2⁰ の桁から）", "end", 9.5, MUT))
    o.append(T(x0 - 14, 155, "足した結果", "end", 10.5, MUT))
    for i in range(4):
        on = bits[i] == 1
        o.append(RECT(x0 + i * cw, 36, cw - 30, 52, 6, SSOFT if on else PAN, SIG if on else LIN, 1.5 if on else 1.1))
        o.append(T(x0 + i * cw + (cw - 30) / 2, 56, labs[i], "middle", 13, SIG if on else INK, True))
        o.append(T(x0 + i * cw + (cw - 30) / 2, 77, pts[i], "middle", 12, SIG if on else INK, on, True))
        o.append(T(x0 + i * cw + (cw - 30) / 2, 112, str(bits[i]), "middle", 13, SIG if on else MUT, on, True))
        if i:
            o.append(ARR(x0 + i * cw - 28, 62, x0 + i * cw - 4, 62, MUT, 1.3, 5))
            o.append(T(x0 + i * cw - 16, 54, "2 倍", "middle", 9.5, MUT))
    res = {0: ("G", "(5, 1)"), 2: ("G + 4G = 5G", "(9, 16)"), 3: ("5G + 8G = 13G", "(16, 4)")}
    last = None
    for i, (l1, l2) in res.items():
        fin = i == 3
        o.append(RECT(x0 + i * cw, 128, cw - 30, 46, 6, SSOFT if fin else PAN, SIG if fin else MUT, 1.6 if fin else 1.1))
        o.append(T(x0 + i * cw + (cw - 30) / 2, 147, l1, "middle", 11.5, SIG if fin else INK, True, True))
        o.append(T(x0 + i * cw + (cw - 30) / 2, 165, l2, "middle", 11.5, SIG if fin else INK, fin, True))
        if last is not None:
            o.append(ARR(x0 + last * cw + cw - 28, 151, x0 + i * cw - 4, 151, MUT, 1.3, 5))
            o.append(ARR(x0 + i * cw + 16, 90, x0 + i * cw + 16, 126, SIG, 1.1, 5))
        last = i
    o.append(T(20, 206, "2 倍 3 回と足し算 2 回の計 5 回で済む（G を 1 つずつ足すと 12 回）。", "start", 11.5, INK))
    o.append(T(20, 226, "01 章 6 節の繰り返し二乗法（3¹³ mod 17 を 2 乗 3 回と掛け算 2 回で求めた）の「2 乗」を「2 倍」に、「掛ける」を「足す」に置き換えたもの。",
               "start", 11, MUT))
    return SVG(820, 240, o, "2 節の曲線（法 17、G = (5, 1)）で 13G を計算する。上の行は 2 倍を繰り返したもの、"
               "下の行は 13 の 2 進の桁が 1 の列の点（色付き）を順に足したもの。")
F["e17_dbladd"] = _f17_dbladd()


# 3 節: 鍵長の比較
def _f17_cost():
    o = []
    levels = [(112, 2048, 224), (128, 3072, 256), (192, 7680, 384), (256, 15360, 512)]
    x0, x1, vmax = 150, 700, 15360.0
    L = lambda v: (x1 - x0) * v / vmax
    o.append(T(20, 22, "同じ安全性に必要な鍵の長さ（ビット）", "start", 12.5, INK, True))
    o.append(RECT(470, 10, 14, 12, 3, _E17_BS, _E17_BL, 1.2))
    o.append(T(490, 21, "RSA・DH（法 p）", "start", 11, _E17_BL, True))
    o.append(RECT(620, 10, 14, 12, 3, SSOFT, SIG, 1.2))
    o.append(T(640, 21, "楕円曲線", "start", 11, SIG, True))
    for i, (sec, rsa, ec) in enumerate(levels):
        y = 44 + i * 58
        o.append(T(x0 - 12, y + 20, "%d ビット安全" % sec, "end", 11.5, INK, True))
        o.append(RECT(x0, y, L(rsa), 18, 3, _E17_BS, _E17_BL, 1.2))
        o.append(T(x0 + L(rsa) + 6, y + 14, str(rsa), "start", 11, _E17_BL, True, True))
        o.append(RECT(x0, y + 22, max(3, L(ec)), 18, 3, SSOFT, SIG, 1.2))
        o.append(T(x0 + L(ec) + 8, y + 36, str(ec), "start", 11, SIG, True, True))
    return SVG(780, 280, o, "米国 NIST などが示す推定値（15 章 5 節の表に 192 ビットの行を加えた）を、長さを比べられるように並べた。"
               "楕円曲線では、鍵の長さが安全性のビット数のほぼ 2 倍で済む。")
F["e17_cost"] = _f17_cost()


# 4 節: ECDH
def _f17_ecdh():
    o = []
    o.append(RECT(130, 8, 310, 36, 8, _E17_BS, _E17_BL, 1.4))
    o.append(T(285, 31, "公開: 2 節の曲線（法 17）と G = (5, 1)", "middle", 12, _E17_BL, True))
    o.append(T(90, 66, "Alice", "middle", 13, INK, True))
    o.append(T(480, 66, "Bob", "middle", 13, INK, True))
    o.append(_e17_box(20, 76, 140, 30, "d_{A} = 3（秘密）", None, "sec", 12))
    o.append(_e17_box(410, 76, 140, 30, "d_{B} = 7（秘密）", None, "sec", 12))
    o.append(_e17_box(20, 116, 140, 30, "Q_{A} = 3G = (10, 6)", None, "pub", 11.5))
    o.append(_e17_box(410, 116, 140, 30, "Q_{B} = 7G = (0, 6)", None, "pub", 11.5))
    o.append(ARR(162, 131, 406, 166, _E17_BL, 1.6))
    o.append(ARR(408, 131, 164, 166, _E17_BL, 1.6))
    o.append(_e17_T(285, 132, "Q_{A} と Q_{B} を交換", "middle", 10.5, _E17_BL, True))
    o.append(_e17_box(20, 168, 140, 44, "3Q_{B} = 21G", "= 2G = (6, 3)", "res", 12, 11))
    o.append(_e17_box(410, 168, 140, 44, "7Q_{A} = 21G", "= 2G = (6, 3)", "res", 12, 11))
    o.append(T(285, 236, "21 = 19 + 2 で 19G = O なので 21G = 2G", "middle", 11, INK))
    # 右: 点の位置
    P, cs, xg, yg = 17, 13, 590, 248
    X = lambda x: xg + x * cs + cs / 2
    Y = lambda y: yg - y * cs - cs / 2
    o.append(RECT(xg, yg - P * cs, P * cs, P * cs, 4, PAN, LIN, 1))
    allp = [(0, 6), (0, 11), (3, 1), (3, 16), (5, 1), (5, 16), (6, 3), (6, 14), (7, 6), (7, 11), (9, 1), (9, 16),
            (10, 6), (10, 11), (13, 7), (13, 10), (16, 4), (16, 13)]
    for (x, y) in allp:
        o.append(D(X(x), Y(y), FNT, 2.6))
    marks = [((5, 1), "G", _E17_BL), ((10, 6), "Q_{A}", ALI), ((0, 6), "Q_{B}", ALI), ((6, 3), "共有した点", SIG)]
    for (x, y), lab, c in marks:
        o.append(CIRC(X(x), Y(y), 5.5, c, 1.6, c))
        o.append(_e17_T(X(x) + 7, Y(y) - 5, lab, "start", 10.5, c, True))
    o.append(T(xg + P * cs / 2, yg + 16, "曲線上の点（法 17）", "middle", 10, MUT))
    return SVG(820, 270, o, "ECDH は DH の gᵃ を aG に置き換えたものである。両者が最後に得る点 (6, 3) は通信路を流れていない。")
F["e17_ecdh"] = _f17_ecdh()


# 4 節: ECDSA の署名と検証
def _f17_ecdsa():
    o = []
    o.append(RECT(16, 10, 380, 220, 12, PAN, LIN, 1.3))
    o.append(T(206, 32, "署名（秘密鍵 d = 7、z = 10）", "middle", 12.5, ALI, True))
    rows = [("① 乱数 k = 5 を選ぶ", "sec"), ("kG = 5G = (9, 16)", "neu"), ("② r = 9 mod 19 = 9", "neu"),
            ("③ s = k^{−1}(z + rd) = 4 × 73 mod 19 = 7", "neu")]
    for i, (t, kind) in enumerate(rows):
        o.append(_e17_box(32, 46 + i * 40, 348, 30, t, None, kind, 12))
    o.append(T(206, 222, "署名は (r, s) = (9, 7)", "middle", 12.5, ALI, True))
    o.append(ARR(398, 120, 428, 120, INK, 1.8))
    o.append(RECT(430, 10, 374, 220, 12, PAN, LIN, 1.3))
    o.append(T(617, 32, "検証（公開鍵 Q = 7G = (0, 6)）", "middle", 12.5, _E17_BL, True))
    rows2 = [("① w = s^{−1} = 7^{−1} mod 19 = 11", "neu"), ("u_{1} = zw = 15、u_{2} = rw = 4", "neu"),
             ("② u_{1}G + u_{2}Q = 15G + 28G = 5G", "neu"), ("= (9, 16)", "neu")]
    for i, (t, kind) in enumerate(rows2):
        o.append(_e17_box(446, 46 + i * 40, 342, 30, t, None, kind, 12))
    o.append(T(617, 222, "③ x 座標 9 = r なので有効", "middle", 12.5, SIG, True))
    return SVG(820, 240, o, "4 節の例（2 節の曲線、G の位数 n = 19）。計算はすべて法 19 で行う。"
               "検証者は k を知らないが、u₁G + u₂Q を計算すると署名のときと同じ点 kG に戻る。")
F["e17_ecdsa"] = _f17_ecdsa()


# 4 節: k の再利用
def _f17_nonce():
    o = []
    o.append(_e17_box(20, 30, 230, 44, "z_{1} = 10 の署名", "(r, s_{1}) = (9, 7)", "neu", 12.5, 12))
    o.append(_e17_box(20, 96, 230, 44, "z_{2} = 4 の署名", "(r, s_{2}) = (9, 2)", "neu", 12.5, 12))
    o.append(T(135, 164, "同じ k = 5 を使ったので r が同じ", "middle", 11, ALI, True))
    o.append(ARR(252, 85, 300, 85, ALI, 1.8))
    o.append(RECT(304, 20, 500, 132, 10, ASOFT, ALI, 1.4))
    o.append(_e17_T(320, 46, "s_{1} − s_{2} = k^{−1}(z_{1} − z_{2}) なので", "start", 12, INK, True))
    o.append(_e17_T(320, 70, "k = (z_{1} − z_{2}) / (s_{1} − s_{2}) = 6 / 5 ≡ 6 × 4 ≡ 5", "start", 12, ALI, True, True))
    o.append(_e17_T(320, 102, "s_{1} = k^{−1}(z_{1} + rd) を d について解くと", "start", 12, INK, True))
    o.append(_e17_T(320, 126, "d = r^{−1}(s_{1}k − z_{1}) = 9^{−1} × 25 ≡ 17 × 6 ≡ 7", "start", 12, ALI, True, True))
    o.append(T(554, 176, "→ 秘密鍵 d = 7 が計算できてしまう", "middle", 12.5, ALI, True))
    return SVG(820, 190, o, "同じ乱数 k で 2 つの署名を作った場合（計算はすべて法 19）。公開されている署名とハッシュ値だけから、"
               "k と秘密鍵 d が求まる。")
F["e17_nonce"] = _f17_nonce()
