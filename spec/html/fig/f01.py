# -*- coding: utf-8 -*-
# 01 章 システム仕様書の書き方 の図
import re as _f01_re

# =====================================================================
# 補助
# =====================================================================
# 折り返しの単位: 英数字の並び（"SR-P06"・"0.5 °C"・"10 秒" のように、数と単位はつなげる）と、それ以外の 1 文字
_F01_TOK = _f01_re.compile(r"[\x21-\x7E°µ±−×〜]+(?: [°µ%][\x21-\x7E]*| [^\x00-\x7F\s])?|.", _f01_re.S)
_F01_NOLEAD = "。、，．・）」』】〉》”’!?！？,.:;：；"


def _f01_tokens(text):
    return _F01_TOK.findall(str(text))


def _f01_lines(text, maxw, sz):
    """文字列を幅 maxw [px] で折り返した行のリスト（行頭に句読点や閉じ括弧を置かない）。"""
    lines, cur, cw = [], "", 0.0
    for tk in _f01_tokens(text):
        w = tw(tk, sz)
        if cur and cw + w > maxw and tk[0] not in _F01_NOLEAD and tk != " ":
            lines.append(cur.rstrip()); cur, cw = "", 0.0
            if tk == " ":
                continue
        cur += tk; cw += w
    if cur.strip():
        lines.append(cur.rstrip())
    return lines


def _f01_text(x, y, text, maxw, sz=10, c=INK, b=False, a="start", lh=None, halo=False):
    """折り返して書く。返り値 (svg, 行数)。"""
    lh = lh or sz * 1.42
    ls = _f01_lines(text, maxw, sz)
    return "".join(T(x, y + i * lh, l, a, sz, c, b, halo=halo) for i, l in enumerate(ls)), len(ls)


def _f01_rich(x, y, segs, maxw, sz=10.5, lh=None, a="start"):
    """色と太さの違う部分 segs = [(文字, 色, 太字), ...] をつないで、幅 maxw で折り返して書く。返り値 (svg, 行数)。"""
    lh = lh or sz * 1.45
    toks = []
    for text, c, b in segs:
        for tk in _f01_tokens(text):
            toks.append((tk, c, b))
    lines, cur, cw = [], [], 0.0
    for tk, c, b in toks:
        w = tw(tk, sz)
        if cur and cw + w > maxw and tk[0] not in _F01_NOLEAD and tk != " ":
            lines.append(cur); cur, cw = [], 0.0
        cur.append((tk, c, b)); cw += w
    if cur:
        lines.append(cur)
    o = []
    for i, L in enumerate(lines):
        runs = []
        for tk, c, b in L:
            if runs and runs[-1][1] == c and runs[-1][2] == b:
                runs[-1][0] += tk
            else:
                runs.append([tk, c, b])
        if runs:
            runs[-1][0] = runs[-1][0].rstrip()
        lw = sum(tw(r[0], sz) for r in runs)
        x0 = x - (lw / 2 if a == "middle" else (lw if a == "end" else 0))
        yy = y + i * lh
        if _CHECK:
            _BOXES.append((x0, yy - sz * 0.82, x0 + lw, yy + sz * 0.22, "".join(r[0] for r in runs)))
        o.append('<text x="%g" y="%g" font-size="%g" font-family="var(--sans)">%s</text>' % (
            round(x0, 2), round(yy, 2), sz,
            "".join('<tspan fill="%s" font-weight="%s">%s</tspan>' % (c, "700" if b else "400", E(t)) for t, c, b in runs)))
    return "".join(o), len(lines)


def _f01_person(x, y, c=GLD, s=1.0):
    """人の印（頭と胴）。(x, y) は足もと。"""
    return (CIRC(x, y - 22 * s, 5.5 * s, c=c, lw=1.5, fill=soft(c))
            + PATH("M%g,%g Q%g,%g %g,%g Z" % (x - 9 * s, y, x, y - 26 * s, x + 9 * s, y), c=c, lw=1.5, fill=soft(c)))


def _f01_box(x, y, w, h, c, lw=1.4, r=7, dash=None, fill=None):
    return RECT(x, y, w, h, r, fill or soft(c), c, lw, dash)


def _f01_chip(x, y, text, c, sz=9.5, a="end"):
    """右寄せ（a="end"）または左寄せの小さな札。y はベースライン。"""
    return CHIP(x, y, text, c, sz, 4, a)[0]


# =====================================================================
# 1 節: 文書の木（誰が書き、何を決め、どの試験仕様書と対になるか）
# =====================================================================
def _f01_tree():
    o = []
    X0, W0 = 36, 318          # 文書の列
    XT, WT = 452, 150         # 試験仕様書の列
    xc = X0 + W0 / 2
    # ステークホルダー
    o.append(_f01_box(X0, 12, W0, 40, GLD))
    o.append(T(X0 + 12, 30, "ステークホルダー", "start", 12, GLD, True))
    o.append(T(X0 + 12, 45, "利用者・発注者・製造・保守・法規の機関", "start", 10, INK))
    for k in range(3):
        o.append(_f01_person(X0 + W0 - 60 + k * 20, 46, GLD, 0.62))
    rows = [
        (76, "要求仕様書", "LG-REQ-001", SIG, "書く: 発注者・企画の担当", "何がほしいか（ステークホルダーの言葉で）", None),
        (156, "システム仕様書", "LG-SYS-001", SIG, "書く: システム全体の担当（発注者と合意）", "外から見て何をするか（合否が決まる形で）", ("01・03 章", SIG)),
        (236, "方式設計書", "LG-DES-001", PUR, "書く: 方式設計の担当", "どんな部分に分け、要求をどこに受け持たせるか", ("02・04 章", PUR)),
        (316, "詳細設計書", "LG-DES-001", PUR, "書く: 部分ごとの担当", "部分の中をどう作るか", ("02・04 章", PUR)),
    ]
    H = 58
    for y, name, did, c, who, what, ch in rows:
        o.append(_f01_box(X0, y, W0, H, c))
        o.append(T(X0 + 12, y + 19, name, "start", 12.5, c, True))
        o.append(T(X0 + 12 + tw(name, 12.5) + 8, y + 19, did, "start", 9.5, MUT, False, True))
        o.append(T(X0 + 12, y + 36, who, "start", 10, MUT))
        o.append(T(X0 + 12, y + 51, what, "start", 10, INK, True))
        if ch:
            o.append(_f01_chip(X0 + W0 - 8, y + 19, ch[0], ch[1]))
    # 詳細設計書の中の部分
    # 作る
    yb = 400
    o.append(_f01_box(X0, yb, W0, 34, MUT))
    o.append(T(xc, yb + 22, "作る（プログラム・回路と基板・筐体）", "middle", 11, INK, True))
    # 下向きの矢印（上の文書が下の文書の入力）
    ys = [52, 134, 214, 294, 374]
    ye = [76, 156, 236, 316, 400]
    for k in range(5):
        o.append(ARR(xc, ys[k] + 1, xc, ye[k] - 2, c=MUT, lw=1.6, head=7))
    o.append(T(xc + 10, 70, "下の文書の入力になる（下を書く人が読む）", "start", 9.5, MUT, halo=True))
    # 合意の点線（ステークホルダーとシステム仕様書）
    o.append(W(X0 - 8, 32, X0 - 22, 32, X0 - 22, 185, X0 - 2, 185, c=GLD, lw=1.3, dash="4 3"))
    o.append(_head(X0 - 12, 185, X0 - 1, 185, GLD, 6))
    o.append(T(X0 - 26, 112, "合意", "middle", 9.5, GLD, True, rot=-90))
    # 試験仕様書の列
    o.append(T(XT + WT / 2, 66, "対になる試験仕様書", "middle", 11, GRN, True))
    o.append(T(XT + WT / 2, 80, "（試験の担当が書く）", "middle", 9.5, MUT))
    for i, (y, name, did, c, who, what, ch) in enumerate(rows):
        yy = y + H / 2
        o.append(_f01_box(XT, yy - 17 + (0 if i else 6), WT, 34, GRN))
        o.append(T(XT + WT / 2, yy + 5 + (0 if i else 6), "試験仕様書" + ("  LG-TST-001" if i == 1 else ""), "middle", 11 if i != 1 else 10.5, GRN, True))
        o.append(ARR(X0 + W0 + 2, yy + (0 if i else 6), XT - 2, yy + (0 if i else 6), c=GRN, lw=1.4, head=6, dash="5 3"))
    o.append(T((X0 + W0 + XT) / 2, 156 + H / 2 - 7, "合否の基準", "middle", 9.5, GRN, True, halo=True))
    # 右端: 試験で確かめるもの
    o.append(T(XT + WT + 12, 76 + H / 2 + 10, "作った物を", "start", 9.5, MUT))
    o.append(T(XT + WT + 12, 76 + H / 2 + 23, "この基準で", "start", 9.5, MUT))
    o.append(T(XT + WT + 12, 76 + H / 2 + 36, "確かめる", "start", 9.5, MUT))
    o.append(W(XT + WT + 6, 112, XT + WT + 6, 345, c=GRN, lw=1.2))
    o.append(W(XT + WT + 2, 112, XT + WT + 6, 112, c=GRN, lw=1.2))
    o.append(W(XT + WT + 2, 345, XT + WT + 6, 345, c=GRN, lw=1.2))
    o.append(LEGEND(X0, 456, [(GLD, "システムの外の人と組織"), (SIG, "要求と仕様"), (PUR, "設計"), (GRN, "試験")], 9.5, 18))
    return SVG(700, 466, o, "開発で書く文書の木（このシリーズでの呼び方。LG- で始まる番号は、例のロガーの文書番号）。")
F["e01_tree"] = _f01_tree()


# =====================================================================
# 1 節: V 字モデル
# =====================================================================
def _f01_vmodel():
    o = []
    BW, BH, SH = 150, 40, 40
    lv = [("要求仕様書", "LG-REQ-001", SIG, "受け入れ試験", "使われる場所で"), ("システム仕様書", "LG-SYS-001", SIG, "システム試験", "システム全体（LG-TST-001）"),
          ("方式設計書", "LG-DES-001", PUR, "結合試験", "部分をつないで"), ("詳細設計書", "LG-DES-001", PUR, "単体試験", "部分を 1 つずつ")]
    ys = [30, 96, 162, 228]
    xl = [36 + SH * k for k in range(4)]
    xr = [700 - 36 - BW - SH * k for k in range(4)]
    labs = ["妥当性確認: 利用者の目的に合うか", "検証: この文書のとおりにできているか", "検証", "検証"]
    for k, (nm, did, c, tn, sub) in enumerate(lv):
        y = ys[k]
        o.append(_f01_box(xl[k], y, BW, BH, c))
        o.append(T(xl[k] + 10, y + 17, nm, "start", 12, c, True))
        o.append(T(xl[k] + 10, y + 32, did, "start", 9.5, MUT, False, True))
        o.append(_f01_box(xr[k], y, BW, BH, GRN))
        o.append(T(xr[k] + 10, y + 17, tn, "start", 12, GRN, True))
        o.append(T(xr[k] + 10, y + 32, sub, "start", 9.5, MUT))
        ya = y + BH / 2
        cc = GLD if k == 0 else GRN
        o.append(DARR(xl[k] + BW + 3, ya, xr[k] - 3, ya, c=cc, lw=1.3, head=6))
        o.append(T((xl[k] + BW + xr[k]) / 2, ya - 6, labs[k], "middle", 9.5, cc, True, halo=True))
    for k in range(3):
        o.append(ARR(xl[k] + 26, ys[k] + BH + 1, xl[k + 1] + 26, ys[k + 1] - 2, c=MUT, lw=1.5, head=6))
        o.append(ARR(xr[k + 1] + BW - 26, ys[k + 1] - 1, xr[k] + BW - 26, ys[k] + BH + 2, c=MUT, lw=1.5, head=6))
    yb, bw2 = 290, 200
    o.append(_f01_box(350 - bw2 / 2, yb, bw2, 34, MUT))
    o.append(T(350, yb + 22, "作る（プログラム・回路・筐体）", "middle", 11, INK, True))
    o.append(ARR(xl[3] + 26, ys[3] + BH + 1, 350 - bw2 / 2 + 8, yb + 8, c=MUT, lw=1.5, head=6))
    o.append(ARR(350 + bw2 / 2 - 8, yb + 8, xr[3] + BW - 26, ys[3] + BH + 2, c=MUT, lw=1.5, head=6))
    o.append(T(16, 170, "上から順に詳しくする", "middle", 10, MUT, True, rot=-90))
    o.append(T(684, 170, "下から順に組み上げて確かめる", "middle", 10, MUT, True, rot=90))
    o.append(T(350, 346, "試験仕様書は、同じ高さの左の文書と同じ時期に書く", "middle", 9.5, GRN))
    o.append(ARR(140, 358, 560, 358, c=FNT, lw=1.2, head=6))
    o.append(T(566, 362, "時間", "start", 9.5, MUT))
    return SVG(700, 370, o, "V 字モデル（同じ高さの左右が対応し、左の文書が右の試験の合否の基準になる）。")
F["e01_vmodel"] = _f01_vmodel()


# =====================================================================
# 1 節: 何を（仕様）と、どう（設計）— 仕様書に設計を書いた悪い例と、直した例
# =====================================================================
def _f01_whathow():
    o = []
    cols = [(14, 248, ALI, "悪い例: 仕様書に書いた設計"), (270, 214, SIG, "直した例: 仕様書（外から見えること）"), (492, 194, PUR, "設計書（中の作り）")]
    for x, w, c, t in cols:
        o.append(T(x + 2, 22, t, "start", 11, c, True))
    rows = [
        ("受付中は、100 ms ごとにアドバタイズすること",
         "間隔を変えるたびに仕様書を改訂する。100 ms で送っていても、何秒でつながるかは確かめていない",
         [("SR-P06", SIG, True), (" 短押しから 10 秒以内に、アプリが接続を始められること", INK, False)],
         "受付中は 100 ms ごとにアドバタイズする（理由: SR-P06 の 10 秒と、電池寿命 SR-W02 の釣り合い）"),
        ("記録はフラッシュのセクタに順に書き、最後まで来たら先頭に戻って上書きすること",
         "書き方を変えられない。止めるか上書きするかを利用者が選べることが書かれていない",
         [("SR-F05", SIG, True), (" 記録が容量に達したときの動作を「最も古い記録から上書きする」「記録を止める」から設定できること", INK, False)],
         "セクタに順に書き、最後まで来たら先頭のセクタを消して書く（止める設定なら書かない）"),
        ("ウォッチドッグタイマを 8 秒に設定すること",
         "ほかの方法を選べない。何秒で戻り、何を失ってはいけないかが決まっていない",
         [("SR-R03", SIG, True), (" ソフトウェアが止まったときは 10 秒以内に自動で復帰し、記録と設定を失わないこと", INK, False)],
         "ウォッチドッグタイマ（8 秒）でリセットし、起動のときに記録の続きの位置を探す"),
    ]
    y, RH = 34, 96
    for bad, why, spec, des in rows:
        o.append(_f01_box(cols[0][0], y, cols[0][1], RH - 8, ALI, 1.2, 6))
        s, n = _f01_text(cols[0][0] + 9, y + 18, bad, cols[0][1] - 26, 10.5, INK, True)
        o.append(s)
        s2, n2 = _f01_text(cols[0][0] + 9, y + 20 + n * 15, "困る: " + why, cols[0][1] - 24, 9.5, ALI)
        o.append(s2)
        o.append(_f01_box(cols[1][0], y, cols[1][1], RH - 8, SIG, 1.2, 6))
        o.append(_f01_rich(cols[1][0] + 9, y + 18, spec, cols[1][1] - 24, 10.5)[0])
        o.append(_f01_box(cols[2][0], y, cols[2][1], RH - 8, PUR, 1.2, 6))
        o.append(_f01_text(cols[2][0] + 9, y + 18, des, cols[2][1] - 24, 10, INK)[0])
        o.append(ARR(cols[0][0] + cols[0][1] + 1, y + 20, cols[1][0] - 1, y + 20, c=MUT, lw=1.2, head=5))
        o.append(ARR(cols[1][0] + cols[1][1] + 1, y + 20, cols[2][0] - 1, y + 20, c=MUT, lw=1.2, head=5))
        y += RH
    o.append(T(cols[2][0] + 2, y + 6, "設計書は、仕様書の ID を引いて理由を書く", "start", 9.5, PUR))
    return SVG(700, y + 14, o, "仕様書に設計（どう作るか）を書いた悪い例と、仕様書と設計書に分けて書き直した例（ロガーの例）。")
F["e01_whathow"] = _f01_whathow()


# =====================================================================
# 1 節: 検証と妥当性確認（10 分の間隔では、扉を開けた 4 分の逸脱が記録に残らない）
# =====================================================================
def _f01_temp(t, t0=12.0, t1=16.0, base=5.0, amb=20.0, tau_up=5.0, tau_dn=1.5):
    """例の温度（°C）: 冷蔵の箱の扉を 12〜16 分に開けた（例の値。s01/check.py と同じ）。"""
    if t < t0:
        return base
    if t <= t1:
        return base + (amb - base) * (1 - math.exp(-(t - t0) / tau_up))
    pk = base + (amb - base) * (1 - math.exp(-(t1 - t0) / tau_up))
    return base + (pk - base) * math.exp(-(t - t1) / tau_dn)


def _f01_vv():
    o = []
    # (a) 2 つの問い
    o.append(T(14, 20, "(a) 2 つの問い", "start", 11.5, INK, True))
    bx, bw = 24, 190
    items = [(34, "利用者の目的", "例: 温度の逸脱を見逃したくない", GLD), (134, "仕様書", "例: 10 分ごとに記録する（SR-F01・SR-F02）", SIG),
             (236, "作った物", "ロガー", MUT)]
    for y, t, s, c in items:
        o.append(_f01_box(bx, y, bw, 50 if c == SIG else 44, c))
        o.append(T(bx + 10, y + 18, t, "start", 11.5, c if c != MUT else INK, True))
        o.append(_f01_text(bx + 10, y + 34, s, bw - 16, 9.5, INK)[0])
    o.append(DARR(bx + 40, 80, bx + 40, 132, c=GLD, lw=1.4, head=6))
    o.append(T(bx + 50, 102, "妥当性確認", "start", 10.5, GLD, True))
    o.append(T(bx + 50, 117, "正しい物を決めたか", "start", 9.5, GLD))
    o.append(DARR(bx + 40, 186, bx + 40, 234, c=GRN, lw=1.4, head=6))
    o.append(T(bx + 50, 205, "検証", "start", 10.5, GRN, True))
    o.append(T(bx + 50, 220, "決めたとおりに作ったか", "start", 9.5, GRN))
    # (b) 例: 温度と記録
    o.append(T(240, 20, "(b) 例: 冷蔵の箱の扉を 4 分開けた", "start", 11.5, INK, True))
    p = Plot(286, 40, 390, 178, (0, 40), (0, 16))
    o.append(RECT(p.X(0), p.Y(8), p.w, p.Y(2) - p.Y(8), 0, GSOFT, "none", 0))
    o.append(p.axes(xl="時間 [分]", yl="温度 [°C]", xt=[0, 10, 20, 30, 40], yt=[0, 2, 4, 6, 8, 10, 12, 14, 16]))
    o.append(T(p.X(39.4), p.Y(2) + 13, "警報の範囲 2.0〜8.0 °C（SR-F10 の初期値）", "end", 9.5, GRN, True, halo=True))
    pts = [(t / 20.0, _f01_temp(t / 20.0)) for t in range(0, 801)]
    o.append(p.line(pts, c=GLD, lw=2.0))
    o.append(T(p.X(16.6), p.Y(13.6), "本当の温度（最高 13.3 °C）", "start", 9.5, GLD, True, halo=True))
    o.append(RECT(p.X(12), p.y + 2, p.X(16) - p.X(12), 9, 2, GOSOFT, GLD, 0.8))
    o.append(T(p.X(11.4), p.y + 10, "扉を開けた", "end", 9.5, GLD, halo=True))
    for t in range(11, 20):
        o.append(CIRC(p.X(t), p.Y(_f01_temp(t)), 2.6, c=MUT, lw=1.1, fill=SCR))
    o.append(T(p.X(19.4), p.Y(_f01_temp(19)) - 9, "1 分の間隔なら記録に残る", "start", 9.5, MUT, halo=True))
    for t in range(0, 41, 10):
        o.append(D(p.X(t), p.Y(_f01_temp(t)), SIG, 4.6))
    o.append(T(p.X(30), p.Y(5) + 16, "10 分ごとの記録（どれも範囲の中）", "middle", 9.5, SIG, True, halo=True))
    yv = 270
    o.append(T(240, yv, "検証: 合格（10 分ごとに記録している）", "start", 10.5, GRN, True))
    o.append(T(240, yv + 17, "妥当性確認: 8 °C を超えた 4.4 分が記録に残らず、利用者の目的に合わない", "start", 10.5, ALI, True))
    return SVG(700, yv + 27, o, "検証と妥当性確認（(b) の温度は例の値。記録の間隔は SR-F02 の初期値 10 分）。")
F["e01_vv"] = _f01_vv()


# =====================================================================
# 2 節: システムの境界があいまいなときと、決めたとき
# =====================================================================
def _f01_boundary():
    o = []
    o.append(T(14, 20, "(a) 境界があいまい: 読み出しが遅いとき、誰の不具合かが決まらない", "start", 11.5, ALI, True))
    xs = [40, 240, 440]
    nm = [("ロガー", SIG), ("スマートフォン", GLD), ("アプリ", GLD)]
    y0 = 54
    for x, (t, c) in zip(xs, nm):
        o.append(_f01_box(x, y0, 132, 36, c))
        o.append(T(x + 66, y0 + 23, t, "middle", 11.5, c, True))
    o.append(ARR(172, y0 + 18, 238, y0 + 18, c=MUT, lw=1.5, head=6))
    o.append(T(205, y0 + 12, "BLE", "middle", 9.5, MUT, halo=True))
    o.append(ARR(372, y0 + 18, 438, y0 + 18, c=MUT, lw=1.5, head=6))
    qs = [(106, "送り方？"), (205, "電波？"), (306, "BLE の処理？"), (506, "表示の処理？")]
    for x, t in qs:
        o.append(T(x, y0 + 56, t, "middle", 10, ALI, True))
    o.append(T(600, y0 + 14, "記録 52 560 件の", "start", 10, INK))
    o.append(T(600, y0 + 28, "読み出しに 90 秒", "start", 10, INK, True))
    o.append(T(600, y0 + 42, "（要求は 60 秒）", "start", 10, INK))
    o.append(T(40, y0 + 82, "ロガーの開発「アプリが遅い」", "start", 10, MUT))
    o.append(T(572, y0 + 82, "アプリの開発「ロガーが遅い」", "end", 10, MUT))
    o.append(W(14, 152, 686, 152, c=LIN, lw=0.8))
    # (b)
    yb = 176
    o.append(T(14, yb, "(b) 境界を決めた: ロガーだけを対象にし、境界で測る", "start", 11.5, GRN, True))
    o.append(RECT(28, yb + 18, 176, 92, 10, "none", SIG, 1.6, "6 4"))
    o.append(T(36, yb + 34, "システムの境界", "start", 9.5, SIG, True))
    o.append(_f01_box(52, yb + 46, 132, 36, SIG))
    o.append(T(118, yb + 69, "ロガー", "middle", 11.5, SIG, True))
    o.append(_f01_box(300, yb + 46, 200, 36, GLD))
    o.append(T(400, yb + 62, "例のスマートフォンと", "middle", 10, GLD, True))
    o.append(T(400, yb + 76, "試験用のアプリ（基準にする）", "middle", 10, GLD, True))
    o.append(ARR(184, yb + 64, 298, yb + 64, c=SIG, lw=1.6, head=6))
    o.append(T(241, yb + 58, "BLE", "middle", 9.5, SIG, halo=True))
    o.append(W(204, yb + 22, 204, yb + 104, c=SIG, lw=2.2))
    s, n = _f01_rich(36, yb + 128, [("SR-P05", SIG, True), (" 接続してから、記録 52 560 件の読み出しを 60 秒以内に終えること（例のスマートフォンで、見通し 2 m）", INK, False)], 460, 10.5)
    o.append(s)
    o.append(_f01_box(520, yb + 40, 166, 48, MUT, 1.1, 6, dash="4 3"))
    o.append(T(603, yb + 58, "アプリの表示の速さは", "middle", 9.5, MUT))
    o.append(T(603, yb + 72, "アプリの仕様書で決め、", "middle", 9.5, MUT))
    o.append(T(603, yb + 85, "アプリの開発が試す", "middle", 9.5, MUT))
    o.append(T(36, yb + 128 + n * 15 + 6, "→ ロガーの合否は、境界をまたぐ所で測って決まる", "start", 10.5, GRN, True))
    return SVG(700, yb + 128 + n * 15 + 16, o, "システムの境界を決めないときと、決めたとき（読み出しの時間の要求 SR-P05 の例）。")
F["e01_boundary"] = _f01_boundary()


# =====================================================================
# 2 節: コンテキスト図
# =====================================================================
def _f01_context():
    o = []
    cx, cy, bw, bh = 350, 140, 172, 92
    L, R = cx - bw / 2, cx + bw / 2
    o.append(RECT(L, cy - bh / 2, bw, bh, 12, SSOFT, SIG, 2.4))
    o.append(T(cx, cy - 4, "ロガー", "middle", 15, SIG, True))
    o.append(T(cx, cy + 16, "（システム）", "middle", 10.5, SIG))
    # 作業者（左）
    px, py = 62, 90
    o.append(_f01_person(px, py, GLD, 1.15))
    o.append(T(px, py + 16, "作業者", "middle", 11, GLD, True))
    o.append(ARR(px + 22, cy - 30, L - 2, cy - 30, c=GLD, lw=1.6, head=6))
    o.append(T((px + 22 + L) / 2, cy - 36, "ボタン（短押し・長押し）", "middle", 10, INK, halo=True))
    o.append(ARR(L - 2, cy - 8, px + 22, cy - 8, c=SIG, lw=1.6, head=6))
    o.append(T((px + 22 + L) / 2, cy + 6, "LED（緑・赤の点滅）", "middle", 10, INK, halo=True))
    # 電池（左下）
    bx, by = 22, 158
    o.append(_f01_box(bx, by, 104, 38, TEA))
    o.append(T(bx + 52, by + 16, "電池", "middle", 11, TEA, True))
    o.append(T(bx + 52, by + 31, "CR2032 1 個", "middle", 9.5, MUT))
    o.append(ARR(bx + 104, by + 22, L - 2, by + 22, c=TEA, lw=1.6, head=6))
    o.append(T((bx + 104 + L) / 2 + 20, by + 16, "電力", "middle", 10, INK, halo=True))
    o.append(ARR(px, py + 22, px, by - 2, c=GLD, lw=1.2, head=6, dash="4 3"))
    o.append(T(px - 6, py + 38, "交換する", "end", 9.5, GLD, halo=True))
    # アプリ（右）
    ax, ay, aw, ah = 584, 112, 104, 56
    o.append(_f01_box(ax, ay, aw, ah, GLD))
    o.append(T(ax + aw / 2, ay + 23, "スマートフォン", "middle", 10.5, GLD, True))
    o.append(T(ax + aw / 2, ay + 40, "のアプリ", "middle", 10.5, GLD, True))
    o.append(ARR(R + 2, cy - 22, ax - 2, cy - 22, c=SIG, lw=1.6, head=6))
    o.append(T((R + ax) / 2, cy - 28, "記録・状態の印・電池の残り", "middle", 10, INK, halo=True))
    o.append(ARR(ax - 2, cy + 18, R + 2, cy + 18, c=GLD, lw=1.6, head=6))
    o.append(T((R + ax) / 2, cy + 34, "時刻・設定・PIN・", "middle", 10, INK, halo=True))
    o.append(T((R + ax) / 2, cy + 48, "読み出しの要求・開始と停止", "middle", 10, INK, halo=True))
    o.append(T((R + ax) / 2, cy + 3, "BLE", "middle", 9.5, MUT, True))
    # 管理者（右上）
    mx, my = 636, 68
    o.append(_f01_person(mx, my, GLD, 1.15))
    o.append(T(mx - 16, my - 10, "管理者", "end", 11, GLD, True))
    o.append(W(mx, my + 2, mx, ay - 2, c=GLD, lw=1.2, dash="3 3"))
    o.append(T(mx + 8, my + 28, "操作", "start", 9.5, GLD))
    # 周囲の環境（下）
    ex, ey, ew = cx - 115, 264, 230
    o.append(_f01_box(ex, ey, ew, 40, GLD))
    o.append(T(cx, ey + 17, "周囲の環境", "middle", 11, GLD, True))
    o.append(T(cx, ey + 32, "保管の倉庫・輸送の箱", "middle", 9.5, MUT))
    o.append(ARR(cx - 40, ey - 2, cx - 40, cy + bh / 2 + 2, c=GLD, lw=1.6, head=6))
    o.append(T(cx - 48, 238, "温度・湿度（測る）", "end", 10, INK, halo=True))
    o.append(ARR(cx + 40, ey - 2, cx + 40, cy + bh / 2 + 2, c=GLD, lw=1.3, head=6, dash="4 3"))
    o.append(T(cx + 48, 238, "落下・塵・水（耐える）", "start", 10, INK, halo=True))
    o.append(T(14, 326, "矢印はやり取りするものの向き。実線は情報と電力、破線は人の作業と環境からの負荷。", "start", 9.5, MUT))
    return SVG(700, 336, o, "ロガーのコンテキスト図（箱の中の作りは描かない）。")
F["e01_context"] = _f01_context()
