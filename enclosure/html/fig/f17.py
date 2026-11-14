# -*- coding: utf-8 -*-
# ===================== 17. 試作から量産へ =====================

STEEL = "color-mix(in srgb,var(--muted) 30%,var(--panel))"
PLAS = "color-mix(in srgb,var(--blue) 22%,var(--panel))"

def _p17(pts, c=INK, lw=1.4, fill=PAN, dash=None):
    d = " ".join("%g,%g" % (round(x, 2), round(y, 2)) for x, y in pts)
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return '<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"%s/>' % (d, fill, c, lw, da)

def _num(x, y, n, c=SIG):
    return CIRC(x, y, 9, c, 1.4, PAN) + T(x, y + 4, str(n), "middle", 10.5, c, True)


def _stages():
    o = []
    items = [("外観モック", None, LIN), ("機能試作", None, LIN), ("EVT", None, SIG), ("DVT", None, SIG),
             ("PVT", None, SIG), ("量産", None, INK)]
    s, _ = flowright(25, 46, items, w=120, bh=40, gap=18, c=LIN, fill=PAN)
    o.append(s)
    meth = [["FDM", "光造形", "切削"], ["FDM", "SLS / MJF", "光造形"], ["切削", "真空注型", "簡易型"],
            ["量産金型", "（T1 以降）"], ["量産金型", "量産ライン"], ["量産金型", "量産ライン"]]
    chk = [["大きさ・形", "色・持ちやすさ"], ["組み立て", "配線・ボタン", "干渉"], ["機能・性能", "強度・熱の傾向"],
           ["規格試験", "落下・防水", "EMC"], ["作りやすさ", "歩留まり", "工程の安定"], ["抜き取り検査", "Cpk の推移"]]
    o.append(T(18, 92, "手法", "start", 10, MUT, True))
    o.append(T(18, 168, "確かめる", "start", 10, MUT, True))
    for i in range(6):
        cx = 25 + 60 + i * 138
        for j, m in enumerate(meth[i]):
            o.append(T(cx, 108 + j * 16, m, "middle", 10.5, INK))
        for j, m in enumerate(chk[i]):
            o.append(T(cx, 184 + j * 16, m, "middle", 10.5, SIG if i >= 2 else MUT))
    o.append(W(18, 154, 842, 154, c=LIN, lw=1))
    o.append(ARR(60, 246, 800, 246, ALI, 1.6, 8))
    o.append(T(430, 238, "右へ行くほど量産品に近く、1 回の作り直しの費用と時間が大きい", "middle", 10.5, ALI))
    return SVG(860, 262, o, "試作の段階と、各段階で使う手法・確かめること。EVT / DVT / PVT は 01 章の定義による。")
F["e17_stages"] = _stages()


def _dfm():
    o = []
    # 断面（ふた形）: 抜き勾配つきの壁
    o.append(T(260, 22, "成形品の断面（DFM レビューで見る場所）", "middle", 12, INK, True))
    outer = [(60, 70), (460, 70), (474, 210), (460, 210), (448, 84), (330, 84), (330, 170), (316, 170), (316, 84),
             (226, 84), (226, 150), (198, 150), (198, 84), (72, 84), (60 + 0 - 14 + 14 + 12 - 12, 210 - 0), (46, 210)]
    o.append(_p17(outer, INK, 1.4, PLAS))
    # スナップの爪（アンダーカット）
    o.append(_p17([(452, 150), (440, 158), (452, 166)], INK, 1.2, PLAS))
    o.append(W(30, 210, 490, 210, c=ALI, lw=1.3, dash="6,4"))
    o.append(T(488, 226, "パーティングライン", "end", 10, ALI))
    o.append(_num(40, 140, 1)); o.append(W(49, 140, 58, 140, c=SIG, lw=1))
    o.append(_num(130, 50, 2)); o.append(W(130, 59, 130, 70, c=SIG, lw=1))
    o.append(_num(212, 176, 3)); o.append(W(212, 167, 212, 150, c=SIG, lw=1))
    o.append(_num(212, 50, 4)); o.append(W(212, 59, 212, 70, c=ALI, lw=1))
    o.append(T(224, 54, "ひけ", "start", 9.5, ALI))
    o.append(_num(410, 160, 5)); o.append(W(419, 160, 440, 158, c=SIG, lw=1))
    o.append(_num(323, 194, 6)); o.append(W(323, 185, 323, 170, c=SIG, lw=1))
    o.append(_num(380, 50, 7)); o.append(W(380, 59, 380, 70, c=SIG, lw=1))
    o.append(T(260, 250, "④ のように壁より厚いリブは、外面にひけを作る（悪い例として描いている）", "middle", 10, FNT))
    items = ["抜き勾配（立ち壁の傾き）", "肉厚の均一さ", "リブの厚さ・高さ", "外面のひけ（リブの裏）",
             "アンダーカット（スナップの爪）", "ボス・エジェクタの位置", "ゲート・ウェルド・反り"]
    for i, t in enumerate(items):
        y = 46 + i * 28
        o.append(_num(560, y, i + 1, ALI if i == 3 else SIG))
        o.append(T(576, y + 4, t, "start", 11, INK))
    return SVG(860, 262, o, "DFM レビューで確かめる主な場所。金型を発注する前に、業者と図面・3D データで確認する。")
F["e17_dfm"] = _dfm()


def _tooling():
    o = []
    r1 = [("DFM・仕様決め", "1〜2 週"), ("金型設計", "1〜3 週"), ("金型加工", "3〜6 週"), ("T0 試打ち", "最初の成形", SIG, SSOFT)]
    s, _ = flowright(40, 60, r1, w=170, bh=52, gap=40, c=LIN, fill=PAN)
    o.append(s)
    r2 = [("測定・評価", "約 1 週"), ("金型修正", "1〜3 週 / 回", ALI, ASOFT), ("T1, T2, …", "次の試打ち", SIG, SSOFT),
          ("シボ・仕上げ", "1〜2 週"), ("初品承認 → 量産", "検査と承認", INK, PAN)]
    s, _ = flowright(24, 190, r2, w=140, bh=52, gap=28, c=LIN, fill=PAN)
    o.append(s)
    o.append(PL([(755, 86), (755, 126), (94, 126), (94, 160)], MUT, 1.6))
    o.append(ARR(94, 150, 94, 163, MUT, 1.6, 7))
    # 繰り返しループ: T1 → 測定・評価
    t1x = 24 + 2 * 168 + 70
    o.append(PL([(t1x, 216), (t1x, 246), (94, 246), (94, 220)], SIG, 1.6, "5,4"))
    o.append(ARR(94, 232, 94, 218, SIG, 1.6, 7))
    o.append(T((t1x + 94) / 2, 262, "寸法・外観が図面に合うまで繰り返す", "middle", 10.5, SIG))
    o.append(T(430, 296, "期間は手のひら大の部品 1 点の代表的な目安。大きさ・スライドの数・業者・国内外で大きく変わる", "middle", 10, FNT))
    o.append(T(640, 262, "シボは寸法が決まってから入れる", "middle", 10, MUT))
    return SVG(860, 310, o, "金型の発注から量産までの流れ。修正 2 回で、発注から初品承認までおよそ 2〜4 か月が目安になる。")
F["e17_tooling"] = _tooling()


def _steelsafe():
    o = []
    for k, (title, col) in enumerate([("金型を削る → 成形品の肉が増える（容易）", SIG),
                                      ("金型に鋼を足す → 成形品の肉が減る（困難）", ALI)]):
        px = 20 + k * 425
        o.append(RECT(px, 12, 405, 250, 10, "none", col, 1.4))
        o.append(T(px + 202, 36, title, "middle", 12, col, True))
        # 鋼のブロック
        o.append(RECT(px + 30, 60, 345, 140, 0, STEEL, MUT, 1.2))
        o.append(T(px + 40, 76, "金型（鋼）", "start", 10, INK))
        # 空洞 = 成形品
        o.append(RECT(px + 60, 92, 285, 20, 0, PLAS, GRN, 1.2))
        o.append(RECT(px + 192, 112, 20, 48, 0, PLAS, GRN, 1.2))
        o.append(W(px + 192, 111, px + 212, 111, c=PLAS, lw=2.2))
        o.append(T(px + 290, 106, "成形品", "middle", 10, INK))
        if k == 0:
            o.append(RECT(px + 192, 160, 20, 24, 0, SSOFT, SIG, 1.4, "4,3"))
            o.append(_lead17(px + 212, 172, px + 240, 172, "削って溝を深くする", SIG))
            o.append(T(px + 202, 222, "リブが高くなる。工作機械で削るだけ", "middle", 10.5, INK))
            o.append(T(px + 202, 240, "→ 不確かな寸法はこちらで合わせられる側に置く", "middle", 10, SIG, True))
        else:
            o.append(RECT(px + 192, 136, 20, 24, 0, ASOFT, ALI, 1.4))
            o.append(_lead17(px + 212, 148, px + 240, 148, "溶接で肉盛り → 削り直し", ALI))
            o.append(T(px + 202, 222, "リブが低くなる。溶接か入れ子の作り直しが要る", "middle", 10.5, INK))
            o.append(T(px + 202, 240, "→ 日程と費用がかかり、外観に跡が出ることもある", "middle", 10, ALI, True))
    return SVG(860, 274, o, "スチールセーフの考え方（断面）。最初の金型では、不確かな寸法を「金型を削れば合わせられる側」に寄せておく。")

def _lead17(x1, y1, x2, y2, s, c):
    return W(x1, y1, x2, y2, c=c, lw=1) + T(x2 + 4, y2 + 4, s, "start", 10.5, c, True)

F["e17_steelsafe"] = _steelsafe()


def _cpk():
    import math as _m
    o = []
    x0, x1, base, hh = 60, 560, 210, 150
    def X(v):
        return x0 + (v - 49.85) / 0.30 * (x1 - x0)
    mu, sg = 50.03, 0.02
    pts = []
    for i in range(301):
        v = 49.85 + 0.30 * i / 300
        pts.append((X(v), base - hh * _m.exp(-0.5 * ((v - mu) / sg) ** 2)))
    # 規格外（USL の右）を塗る
    tail = [(X(50.10), base)] + [p for p in pts if p[0] >= X(50.10)] + [(X(50.15), base)]
    o.append(_p17(tail, "none", 0, ASOFT))
    o.append(PL(pts, SIG, 2.2))
    o.append(W(x0 - 10, base, x1 + 10, base, c=MUT, lw=1.2))
    for v, lab, c in [(49.90, "LSL 49.90", ALI), (50.10, "USL 50.10", ALI)]:
        o.append(W(X(v), 40, X(v), base, c=c, lw=1.6))
        o.append(T(X(v), 34, lab, "middle", 10.5, c, True))
    o.append(W(X(50.00), 50, X(50.00), base, c=FNT, lw=1, dash="4,3"))
    o.append(T(X(50.00), base + 16, "50.00（中央）", "middle", 9.5, FNT))
    o.append(W(X(mu), 56, X(mu), base, c=SIG, lw=1.2, dash="2,3"))
    o.append(T(X(mu) + 6, 52, "μ = 50.03", "start", 10.5, SIG, True))
    o.append(DIM(X(49.90), base + 32, X(mu), base + 32, None, INK))
    o.append(DIM(X(mu), base + 32, X(50.10), base + 32, None, INK))
    o.append(T((X(49.90) + X(mu)) / 2, base + 48, "μ − LSL = 0.13 = 6.5σ", "middle", 10, INK))
    o.append(T((X(mu) + X(50.10)) / 2 + 20, base + 48, "USL − μ = 0.07 = 3.5σ", "middle", 10, INK))
    o.append(DIM(X(mu - 3 * sg), base + 66, X(mu + 3 * sg), base + 66, None, MUT))
    o.append(T(X(mu), base + 82, "± 3σ（99.73 %）", "middle", 10, MUT))
    o.append(T(X(50.13), base - 20, "規格外", "middle", 9.5, ALI))
    # 右の計算
    bx = 600
    o.append(RECT(bx, 40, 240, 190, 10, PAN, LIN, 1.2))
    o.append(T(bx + 120, 64, "σ = 0.02 mm の例", "middle", 11, INK, True))
    o.append(T(bx + 16, 94, "Cp = 0.20 / (6 × 0.02)", "start", 10.5, INK, False, True))
    o.append(T(bx + 16, 114, "   = 1.67", "start", 10.5, SIG, True, True))
    o.append(T(bx + 16, 144, "Cpk = 0.07 / (3 × 0.02)", "start", 10.5, INK, False, True))
    o.append(T(bx + 16, 164, "    = 1.17", "start", 10.5, ALI, True, True))
    o.append(T(bx + 16, 194, "平均を中央へ戻すと", "start", 10, MUT))
    o.append(T(bx + 16, 212, "Cpk → 1.67", "start", 10.5, SIG, True, True))
    return SVG(860, 306, o, "工程能力指数。ばらつきが小さくても（Cp が大きくても）、平均がずれていれば Cpk は小さくなる。")
F["e17_cpk"] = _cpk()


def _ecn():
    o = []
    items = [("変更の依頼", "何を・なぜ"), ("影響の確認", "金型・はめあい・再評価・在庫"), ("承認", "設計・品質・製造・購買"),
             ("版数を上げる", "図面と 3D データ", SIG, SSOFT), ("実施と切り替え", "どのロットから")]
    s, _ = flowright(20, 50, items, w=148, bh=58, gap=20, c=LIN, fill=PAN)
    o.append(s)
    # 図面の版数欄の例
    x, y = 150, 112
    cols = [("版", 50), ("変更内容", 300), ("日付", 120), ("切り替えロット", 120)]
    o.append(T(x, y - 6, "図面の改訂欄（例）", "start", 10.5, INK, True))
    rows = [("A", "初版", "—", "—"), ("B", "スナップの掛かり 0.6 → 0.8 mm（金型を削る）", "2026-05", "L2605-01")]
    yy = y
    xx = x
    for name, w in cols:
        o.append(RECT(xx, yy, w, 24, 0, SCR, LIN, 1))
        o.append(T(xx + w / 2, yy + 16, name, "middle", 10, MUT, True))
        xx += w
    for r, row in enumerate(rows):
        yy = y + 24 * (r + 1)
        xx = x
        for (name, w), v in zip(cols, row):
            o.append(RECT(xx, yy, w, 24, 0, PAN, LIN, 1))
            o.append(T(xx + w / 2, yy + 16, v, "middle", 10, SIG if r == 1 else INK, r == 1))
            xx += w
    return SVG(860, 200, o, "設計変更の流れと、図面の版数の記録の例（値は説明用）。版数と切り替えロットから、影響を受ける製品をたどれる。")
F["e17_ecn"] = _ecn()
