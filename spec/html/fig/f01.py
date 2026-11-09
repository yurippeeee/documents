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
    """文字列を幅 maxw [px] で折り返した行のリスト（行頭に句読点や閉じ括弧を置かない）。
    最後の行が短く残るときは、行の数を変えずに、行の長さをそろえ直す。"""
    lines = _f01_lines1(text, maxw, sz)
    if len(lines) > 1 and tw(lines[-1], sz) < 0.3 * maxw:
        m = sum(tw(tk, sz) for tk in _f01_tokens(text)) / len(lines) + 2
        while m < maxw:
            cand = _f01_lines1(text, m, sz)
            if len(cand) <= len(lines):
                return cand
            m += 4
    return lines


def _f01_lines1(text, maxw, sz):
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


def _f01_lines_n(text, maxw, sz):
    return len(_f01_lines(text, maxw, sz))


def _f01_text(x, y, text, maxw, sz=10, c=INK, b=False, a="start", lh=None, halo=False):
    """折り返して書く。返り値 (svg, 行数)。"""
    lh = lh or sz * 1.42
    ls = _f01_lines(text, maxw, sz)
    return "".join(T(x, y + i * lh, l, a, sz, c, b, halo=halo) for i, l in enumerate(ls)), len(ls)


def _f01_rich_lines(toks, maxw, sz):
    lines, cur, cw = [], [], 0.0
    for tk, c, b in toks:
        w = tw(tk, sz)
        if cur and cw + w > maxw and tk[0] not in _F01_NOLEAD and tk != " ":
            lines.append(cur); cur, cw = [], 0.0
        cur.append((tk, c, b)); cw += w
    if cur:
        lines.append(cur)
    return lines


def _f01_rich_wrap(segs, maxw, sz):
    """_f01_rich の折り返しだけを行う（描かない）。返り値は行のリスト。"""
    toks = []
    for text, c, b in segs:
        for tk in _f01_tokens(text):
            toks.append((tk, c, b))
    lines = _f01_rich_lines(toks, maxw, sz)
    if len(lines) > 1 and sum(tw(t, sz) for t, _, _ in lines[-1]) < 0.3 * maxw:
        m = sum(tw(t, sz) for t, _, _ in toks) / len(lines) + 2
        while m < maxw:
            cand = _f01_rich_lines(toks, m, sz)
            if len(cand) <= len(lines):
                lines = cand
                break
            m += 4
    return lines


def _f01_rich(x, y, segs, maxw, sz=10.5, lh=None, a="start"):
    """色と太さの違う部分 segs = [(文字, 色, 太字), ...] をつないで、幅 maxw で折り返して書く。返り値 (svg, 行数)。"""
    lh = lh or sz * 1.45
    lines = _f01_rich_wrap(segs, maxw, sz)
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
    labs = ["利用者の目的に合うか", "この文書のとおりにできているか", "文書のとおりか", "文書のとおりか"]
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
         [("SR-F05", SIG, True), (" 記録が記録の容量に達したときの動作を、「上書き」と「記録を止める」から設定できること", INK, False)],
         "セクタに順に書き、最後まで来たら先頭のセクタを消して書く（止める設定なら書かない）"),
        ("ウォッチドッグタイマを 8 秒に設定すること",
         "ほかの方法を選べない。何秒で戻り、何を失ってはいけないかが決まっていない",
         [("SR-R03", SIG, True), (" ソフトウェアが止まったときは、10 秒以内に自動で、止まる前の主のモードの動作に戻ること（記録と設定を保持することは ", INK, False), ("SR-R05", SIG, True), ("）", INK, False)],
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
    o.append(T(px, py + 16, "作業者・管理者", "middle", 11, GLD, True))
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
    o.append(T(mx - 16, my - 10, "作業者・管理者", "end", 11, GLD, True))
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


# =====================================================================
# 3 節: シナリオのシーケンス図（記録を読み出す: 正常の流れと、例外の流れ 2 つ）
# =====================================================================
def _f01_seqfig():
    o = []
    o.append(T(14, 18, "正常の流れ: 記録を読み出す", "start", 11.5, GRN, True))
    lanes = [("作業者", GLD), ("ロガー", SIG), ("アプリ", GLD)]
    msgs = [
        (0, 1, "短押し", {"dy": 26}),
        (1, 0, "LED で状態を示す", {"c": SIG, "dy": 26}),
        (1, 1, "受付を始める（2 分）", {"c": SIG, "dy": 26}),
        (2, 1, "接続する", {"sub": "短押しから 10 秒以内（SR-P06）", "dy": 26}),
        (2, 1, "時刻を送る", {"sub": "SR-F08", "dy": 26}),
        (2, 1, "前回より後の記録を求める", {"sub": "SR-F07", "dy": 26}),
        (1, 2, "記録（LG-ICD-001 の形式）", {"c": SIG, "sub": "SR-I03", "dy": 26}),
        (2, 2, "誤りを調べる（SR-R02）", {"dy": 26}),
        (2, 1, "切断する", {"dy": 26}),
        (1, 1, "通信なしに戻る", {"c": SIG, "dy": 26}),
    ]
    s, h = seq(lanes, msgs, x=10, y=30, w=440, dy=30)
    o.append(s)
    # 例外の流れ
    X1, W1 = 470, 220
    o.append(W(X1 - 8, 12, X1 - 8, 30 + h, c=LIN, lw=0.8))
    o.append(T(X1, 18, "例外の流れ 1: 接続されない", "start", 11, GLD, True))
    s1, h1 = seq([("ロガー", SIG), ("アプリ", GLD)], [
        ("note", 0, "受付中", {"c": SIG}),
        ("gap", "2 分たつ", {"lane": 0}),
        (0, 0, "通信なしに戻る", {"c": SIG, "dy": 22}),
    ], x=X1, y=30, w=W1, dy=28, tail=10)
    o.append(s1)
    y2 = 30 + h1 + 26
    o.append(T(X1, y2 - 8, "例外の流れ 2: 送る途中で切れる", "start", 11, ALI, True))
    s2, h2 = seq([("ロガー", SIG), ("アプリ", GLD)], [
        (1, 0, "前回より後を求める", {"dy": 26}),
        (0, 1, "記録を送る", {"c": SIG, "lost": True, "dy": 26}),
        ("note", 0, "接続が切れる", {"c": ALI}),
        ("gap", "次の短押し", {"lane": 0}),
        (1, 0, "前回より後を求める", {"dy": 26}),
    ], x=X1, y=y2, w=W1, dy=28, tail=10)
    o.append(s2)
    yq = y2 + h2 + 4
    o.append(_f01_box(X1, yq, W1, 66, ALI, 1.3, 6))
    o.append(T(X1 + 10, yq + 18, "決まっていない:", "start", 10, ALI, True))
    o.append(_f01_text(X1 + 10, yq + 34, "途中で切れた読み出しを「前回の読み出し」に含めるか（どこから送り直すか）", W1 - 20, 9.5, INK)[0])
    H = max(30 + h, yq + 66) + 10
    return SVG(700, H, o, "「記録を読み出す」のシナリオのシーケンス図（時間は上から下へ進む）。")
F["e01_seq"] = _f01_seqfig()


# =====================================================================
# 3 節: 主のモードの状態遷移図と状態遷移表（本文の例。電池の入れ直しなどが決まっていない）
# =====================================================================
_F01_EV = [("長押し",), ("アプリから", "開始"), ("アプリから", "停止"), ("記録の時刻",), ("容量に", "達した"), ("電池が", "尽きる"), ("電池を", "入れ直す")]
_F01_ST = ["停止中", "記録中", "電池切れ"]
# マスの中身: (行の文字, 種類)。種類 t=遷移, s=とどまる（すること）, n=起きない, u=未定
_F01_TBL = [
    [(["緑 3 回", "→ 記録中"], "t"), (["→ 記録中"], "t"), (["何もしない"], "s"), (["起きない"], "n"), (["起きない"], "n"), (["→ 電池切れ"], "t"), (["未定"], "u")],
    [(["赤 3 回", "→ 停止中"], "t"), (["何もしない"], "s"), (["→ 停止中"], "t"), (["測定して", "記録"], "s"), (["上書き: 上書き", "止める: → 停止中"], "t"), (["→ 電池切れ"], "t"), (["未定"], "u")],
    [(["未定"], "u"), (["起きない"], "n"), (["起きない"], "n"), (["起きない"], "n"), (["起きない"], "n"), (["起きない"], "n"), (["未定"], "u")],
]


def _f01_stt():
    o = []
    o.append(T(14, 18, "(a) 状態遷移図", "start", 11.5, INK, True))
    y = 116
    P = {"停止中": (150, 104), "記録中": (420, 104), "電池切れ": (620, 104)}
    h = 40
    for nm, (x, w) in P.items():
        o.append(STATE(x, y, w, h, nm, SIG, start=(nm == "停止中")))
    o.append(T(P["停止中"][0] - 52 - 34, y + 20, "初めて電池", "middle", 9.5, MUT))
    o.append(T(P["停止中"][0] - 52 - 34, y + 33, "を入れる", "middle", 9.5, MUT))
    xs, xr, xb = P["停止中"][0], P["記録中"][0], P["電池切れ"][0]
    # 停止中 → 記録中（上の弧）
    o.append(CARR(xs + 30, y - h / 2 - 2, xr - 40, y - h / 2 - 2, 0.22, GRN, 1.6))
    o.append(T((xs + xr) / 2 - 6, y - 64, "長押し・アプリから開始 / 緑を 3 回点滅", "middle", 9.5, GRN, True, halo=True))
    # 記録中 → 停止中（下の弧）
    o.append(CARR(xr - 40, y + h / 2 + 2, xs + 30, y + h / 2 + 2, 0.22, MUT, 1.6))
    o.append(T((xs + xr) / 2 - 6, y + 62, "長押し・アプリから停止 / 赤を 3 回点滅", "middle", 9.5, INK, True, halo=True))
    o.append(T((xs + xr) / 2 - 6, y + 76, "容量に達した [止める設定]", "middle", 9.5, INK, True, halo=True))
    # 記録中 の自分への遷移
    o.append(SELF(xr, y - h / 2, None, SIG, 16))
    o.append(T(xr + 18, y - 46, "記録の時刻 / 測定して記録", "start", 9.5, SIG, True, halo=True))
    o.append(T(xr + 18, y - 32, "容量に達した [上書きの設定] / 上書き", "start", 9.5, SIG, True, halo=True))
    # → 電池切れ
    o.append(ARR(xr + 52 + 2, y + 4, xb - 52 - 2, y + 4, c=MUT, lw=1.5, head=6))
    o.append(T((xr + 52 + xb - 52) / 2, y - 2, "電池が尽きる", "middle", 9.5, INK, True, halo=True))
    o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (xs, y + h / 2, xs + 20, y + 118, xb - 20, y + 118, xb, y + h / 2 + 8), c=MUT, lw=1.5))
    o.append(_head(xb - 2, y + h / 2 + 30, xb, y + h / 2 + 2, MUT, 7))
    o.append(T((xs + xb) / 2 + 60, y + 100, "電池が尽きる", "middle", 9.5, INK, True, halo=True))
    # (b) 状態遷移表
    y0 = 262
    o.append(T(14, y0 - 10, "(b) 状態遷移表（行が状態、列が出来事。マスに、すること → 次の状態）", "start", 11.5, INK, True))
    x0, cw0, cw, rh, hh = 14, 72, 87.7, 36, 34
    o.append(RECT(x0, y0, cw0, hh, 0, MSOFT, LIN, 1))
    o.append(T(x0 + cw0 / 2, y0 + 21, "状態 ＼ 出来事", "middle", 9, MUT, True))
    for j, ev in enumerate(_F01_EV):
        xx = x0 + cw0 + j * cw
        o.append(RECT(xx, y0, cw, hh, 0, MSOFT, LIN, 1))
        for k, l in enumerate(ev):
            o.append(T(xx + cw / 2, y0 + (21 if len(ev) == 1 else 15 + k * 12), l, "middle", 9.5, INK, True))
    for i, st in enumerate(_F01_ST):
        yy = y0 + hh + i * rh
        o.append(RECT(x0, yy, cw0, rh, 0, SSOFT, LIN, 1))
        o.append(T(x0 + cw0 / 2, yy + rh / 2 + 4, st, "middle", 10.5, SIG, True))
        for j, (ls, kind) in enumerate(_F01_TBL[i]):
            xx = x0 + cw0 + j * cw
            fill = {"u": ASOFT, "n": MSOFT}.get(kind, SCR)
            o.append(RECT(xx, yy, cw, rh, 0, fill, LIN, 1))
            col = {"u": ALI, "n": MUT}.get(kind, INK)
            for k, l in enumerate(ls):
                o.append(T(xx + cw / 2, yy + (rh / 2 + 4 if len(ls) == 1 else 15 + k * 13), l, "middle", 9 if len(l) > 7 else 9.5, col, kind == "u"))
    ye = y0 + hh + 3 * rh
    o.append(LEGEND(14, ye + 22, [(ALI, "未定（決めていない組み合わせ）"), (MUT, "起きない組み合わせ")], 9.5, 18))
    o.append(T(686, ye + 22, "仕様に書かない状態: 眠っている・測っている・書き込んでいる（設計書に書く）", "end", 9.5, PUR))
    return SVG(700, ye + 32, o, "ロガーの主のモードの状態遷移図と状態遷移表（説明のための書きかけの例。(a) と (b) は同じ内容で、赤いマスは (a) に表れない抜け）。")
F["e01_stt"] = _f01_stt()


# =====================================================================
# 3 節: 互いにほぼ独立な 2 つの状態を、1 つの表にまとめた場合と、分けた場合
# =====================================================================
def _f01_grid(x, y, nr, nc, c, cell=12, gap=2, bad=()):
    o = []
    for i in range(nr):
        for j in range(nc):
            k = (i, j) in bad
            o.append(RECT(x + j * (cell + gap), y + i * (cell + gap), cell, cell, 2, ASOFT if k else soft(c), ALI if k else c, 0.9))
    return "".join(o)


def _f01_split():
    o = []
    # (a) まとめた場合
    o.append(T(14, 18, "(a) 1 つの表にまとめる", "start", 11.5, ALI, True))
    main = ["停止中", "記録中", "電池切れ"]
    com = ["通信なし", "受付中", "接続中"]
    gx, gy, bw, bh = 86, 46, 80, 24
    for j, cn in enumerate(com):
        o.append(T(gx + j * (bw + 6) + bw / 2, gy - 8, cn, "middle", 9.5, TEA, True))
    for i, mn in enumerate(main):
        o.append(T(gx - 8, gy + i * (bh + 6) + 16, mn, "end", 9.5, SIG, True))
        for j in range(3):
            bx, by = gx + j * (bw + 6), gy + i * (bh + 6)
            imp = (i == 2 and j > 0)
            o.append(RECT(bx, by, bw, bh, 5, MSOFT if imp else PSOFT, MUT if imp else PUR, 1.1, "3 3" if imp else None))
            if imp:
                o.append(W(bx + 6, by + 5, bx + bw - 6, by + bh - 5, c=MUT, lw=1.2))
                o.append(W(bx + 6, by + bh - 5, bx + bw - 6, by + 5, c=MUT, lw=1.2))
            else:
                o.append(T(bx + bw / 2, by + 16, "%s・%s" % (mn[:2], com[j][:2]), "middle", 9, PUR))
    o.append(T(gx, gy + 3 * (bh + 6) + 10, "組み合わせ 9 − 起きない 2 = 7 状態", "start", 9.5, INK, True))
    yg = 176
    o.append(_f01_grid(gx, yg, 7, 11, PUR))
    o.append(T(gx + 11 * 14 + 10, yg + 30, "7 状態", "start", 10, INK))
    o.append(T(gx + 11 * 14 + 10, yg + 46, "× 11 出来事", "start", 10, INK))
    o.append(T(gx + 11 * 14 + 10, yg + 72, "77 マス", "start", 13, ALI, True))
    o.append(W(352, 10, 352, 290, c=LIN, lw=0.8))
    # (b) 分けた場合
    X = 370
    o.append(T(X, 18, "(b) 2 つの表に分ける", "start", 11.5, GRN, True))
    o.append(T(X, 44, "主のモード", "start", 10, SIG, True))
    o.append(T(X + 76, 44, "停止中・記録中・電池切れ", "start", 9.5, MUT))
    o.append(_f01_grid(X, 54, 3, 7, SIG))
    o.append(T(X + 7 * 14 + 10, 78, "3 × 7 = 21 マス", "start", 10.5, INK, True))
    o.append(T(X, 122, "通信の状態", "start", 10, TEA, True))
    o.append(T(X + 76, 122, "通信なし・受付中・接続中", "start", 9.5, MUT))
    o.append(_f01_grid(X, 132, 3, 6, TEA))
    o.append(T(X + 6 * 14 + 10, 156, "3 × 6 = 18 マス", "start", 10.5, INK, True))
    o.append(T(X, 210, "合わせて 39 マス", "start", 13, GRN, True))
    o.append(T(X, 234, "2 つの表のつながりは出来事で書く:", "start", 9.5, INK, True))
    o.append(T(X, 250, "・アプリから開始・停止は、接続中にだけ起きる", "start", 9.5, MUT))
    o.append(T(X, 266, "・電池が尽きる・入れ直すと、通信なしへ", "start", 9.5, MUT))
    o.append(LEGEND(gx, 290, [(PUR, "まとめた状態"), (MUT, "起きない組み合わせ")], 9.5, 16))
    return SVG(700, 300, o, "主のモード（出来事 7 つ）と通信の状態（出来事 6 つ。電池が尽きる・電池を入れ直すは両方に共通）を、1 つの表にまとめた場合と分けた場合のマスの数（出来事は 03 章の表 3-3・3-4 と同じ）。")
F["e01_split"] = _f01_split()


# =====================================================================
# 4 節: 要求文の部品（色で分ける）
# =====================================================================
_F01_ROLE = {"ID": (MUT, "ID"), "subj": (TEA, "主語"), "cond": (GLD, "条件"), "num": (SIG, "数値・単位・許容差"),
             "act": (PUR, "動作"), "end": (GRN, "文末"), "subj0": (TEA, "主語（省略）")}


def _f01_sentence(x, y, parts, sz=11.5):
    """要求文を部品ごとに色の箱で囲み、下に部品の名前を書く。返り値 (svg, 右端の x)。"""
    o, xx = [], x
    for text, role in parts:
        c, lab = _F01_ROLE[role]
        w = max(tw(text, sz), tw(lab, 9)) + 10
        o.append(RECT(xx, y - sz - 5, w, sz + 12, 5, soft(c), c, 1.1, "4 3" if role == "subj0" else None))
        o.append(T(xx + w / 2, y + 1, text, "middle", sz, MUT if role == "subj0" else INK, role in ("ID",), role == "ID"))
        o.append(T(xx + w / 2, y + 20, lab, "middle", 9, c, True))
        xx += w + 4
    return "".join(o), xx


def _f01_anatomy():
    o = []
    rows = [
        [("SR-P03", "ID"), ("各記録の時刻は、", "subj"), ("ロガーの時計で予定した測定の時刻から", "cond"), ("±2 秒以内", "num"), ("であること", "end")],
        [("SR-P06", "ID"), ("短押しから", "cond"), ("10 秒以内に、", "num"), ("アプリが", "subj"), ("接続を始められる", "act"), ("こと", "end")],
        [("SR-F09", "ID"), ("電池を入れてから最初に時刻を合わせるまでの記録には、", "cond"), ("（ロガーは）", "subj0"), ("時刻未設定の印を付ける", "act"), ("こと", "end")],
    ]
    y = 34
    for r in rows:
        s, _ = _f01_sentence(14, y, r)
        o.append(s)
        y += 58
    return SVG(700, y - 20, o, "要求文の部品（ロガーの要求の例。主語を省いた文の主語はシステム）。")
F["e01_anatomy"] = _f01_anatomy()


# =====================================================================
# 4 節: 悪い例と直した例（曖昧な言葉・条件の抜け・1 文に 2 つ・否定だけ）
# =====================================================================
def _f01_badgood():
    o = []
    C = [(14, 66), (86, 206), (298, 178), (482, 204)]
    heads = [("問題", INK), ("悪い例", ALI), ("何が困るか", MUT), ("直した例", GRN)]
    for (x, w), (t, c) in zip(C, heads):
        o.append(T(x + 4, 20, t, "start", 11, c, True))
    rows = [
        ("曖昧な言葉", [("ボタンを押したら、", INK, False), ("速やかに", ALI, True), ("アプリとつながること", INK, False)],
         "「速やか」が何秒かは人によって違い、試験の合否が決まらない",
         [("SR-P06", SIG, True), (" 短押しから ", INK, False), ("10 秒以内に", GRN, True), ("、アプリが接続を始められること", INK, False)]),
        ("条件の抜け", [("温度の誤差は ±0.5 °C 以内であること", INK, False)],
         "どの温度で測るかが無い。−20 °C で 0.8 °C ずれたら合格かが決まらない",
         [("SR-P01", SIG, True), (" 温度の誤差は、", INK, False), ("0 °C 以上 40 °C 以下で", GRN, True), (" ±0.5 °C 以内、", INK, False),
          ("−20 °C 以上 0 °C 未満と 40 °C より高く 60 °C 以下で", GRN, True), (" ±1.0 °C 以内であること", INK, False)]),
        ("1 文に 2 つ", [("温度と湿度を 10 分ごとに測定して記録し、", INK, False), ("また", ALI, True), ("上限を超えたら LED で知らせること", INK, False)],
         "測定は合格で LED が不合格のとき、この要求の合否が決まらない。1 つの試験に結べない",
         [("SR-F01", SIG, True), (" 測定する・", INK, False), ("SR-F03", SIG, True), (" 記録する・", INK, False), ("SR-F15", SIG, True), (" LED で知らせる、の 3 つに分け、それぞれに試験を結ぶ", INK, False)]),
        ("否定だけ", [("誤った時刻で記録", INK, False), ("しないこと", ALI, True)],
         "電池を入れた直後は正しい時刻を知らないので満たせない。何を試せば合格かも決まらない",
         [("SR-F09", SIG, True), (" 電池を入れてから最初に時刻を合わせるまでの記録には、", INK, False), ("時刻未設定の印を付ける", GRN, True), ("こと", INK, False)]),
    ]
    y = 30
    for name, bad, why, good in rows:
        nl = max(len(_f01_rich_wrap(bad, C[1][1] - 20, 10.5)) * 15.2, _f01_lines_n(why, C[2][1] - 14, 9.5) * 13.5, len(_f01_rich_wrap(good, C[3][1] - 20, 10)) * 14.5)
        RH = max(74, nl + 26)
        o.append(RECT(C[0][0], y, C[0][1], RH - 6, 5, MSOFT, LIN, 1))
        o.append(_f01_text(C[0][0] + C[0][1] / 2, y + 22, name, C[0][1] - 8, 10, INK, True, "middle")[0])
        o.append(_f01_box(C[1][0], y, C[1][1], RH - 6, ALI, 1.1, 5))
        o.append(_f01_rich(C[1][0] + 8, y + 18, bad, C[1][1] - 20, 10.5)[0])
        o.append(_f01_text(C[2][0] + 6, y + 17, why, C[2][1] - 14, 9.5, MUT)[0])
        o.append(_f01_box(C[3][0], y, C[3][1], RH - 6, GRN, 1.1, 5))
        o.append(_f01_rich(C[3][0] + 8, y + 18, good, C[3][1] - 20, 10)[0])
        o.append(ARR(C[2][0] + C[2][1] - 4, y + RH / 2 - 3, C[3][0] - 2, y + RH / 2 - 3, c=MUT, lw=1.2, head=5))
        y += RH
    return SVG(700, y + 2, o, "要求文の悪い例と直した例（ロガーの例。赤は問題の言葉、緑は直して足した条件と数値）。")
F["e01_badgood"] = _f01_badgood()


# =====================================================================
# 4 節: 検証の方法の選び方
# =====================================================================
def _f01_methods():
    o = []
    qx, qw = 22, 322
    rx, rw = 390, 298
    qs = [
        ("見る、寸法や重さを測る、図面や部品表を調べる、で分かるか", "検査（I）", "SR-C01 大きさと重さ・SR-W01 電池の種類・SR-S02 電波法の適合", GLD),
        ("操作して、できることを見せれば足りるか（数値の合否の基準が無い）", "実演（D）", "SR-W03 工具を使わずに電池を交換できる", PUR),
        ("決めた条件で動かして測り、合否の基準と比べられるか（時間と費用の範囲で）", "試験（T）", "SR-P06 接続までの時間・SR-P01 温度の誤差・SR-F10 警報の印", GRN),
    ]
    o.append(_f01_box(qx, 10, 120, 28, SIG))
    o.append(T(qx + 60, 29, "要求", "middle", 11.5, SIG, True))
    y = 56
    for i, (q, m, ex, c) in enumerate(qs):
        o.append(ARR(qx + 60, y - 18 if i == 0 else y - 20, qx + 60, y - 2, c=MUT, lw=1.4, head=6))
        o.append(RECT(qx, y, qw, 48, 8, PAN, MUT, 1.2))
        o.append(_f01_text(qx + 12, y + 20, q, qw - 24, 10, INK)[0])
        o.append(ARR(qx + qw + 2, y + 24, rx - 2, y + 24, c=c, lw=1.6, head=6))
        o.append(T((qx + qw + rx) / 2, y + 18, "はい", "middle", 9.5, c, True, halo=True))
        o.append(_f01_box(rx, y + 2, rw, 44, c))
        o.append(T(rx + 10, y + 19, m, "start", 11.5, c, True))
        o.append(_f01_text(rx + 10, y + 36, ex, rw - 20, 9.5, INK)[0])
        o.append(T(qx + 68, y + 64, "いいえ", "start", 9.5, MUT))
        y += 78
    o.append(ARR(qx + 60, y - 20, qx + 60, y - 2, c=MUT, lw=1.4, head=6))
    o.append(_f01_box(qx, y, qw + 2 + (rx - qx - qw - 2) + rw, 46, SIG))
    o.append(T(qx + 12, y + 19, "解析（A）", "start", 11.5, SIG, True))
    o.append(T(qx + 90, y + 19, "計算・模擬・部品のデータで示す。短い試験で測った値を使ってよい", "start", 10, INK))
    o.append(T(qx + 12, y + 37, "SR-R01 10 年の保持・SR-R04 5 年の使用・SR-W02 1 年の電池寿命（試験では年単位かかる）・SR-C02 部品の費用", "start", 9.5, INK))
    return SVG(700, y + 54, o, "検証の方法の選び方（上から順に問う。例はロガーの要求）。")
F["e01_methods"] = _f01_methods()


# =====================================================================
# 5 節: 機能以外の要求が設計を縛る
# =====================================================================
def _f01_nfr():
    o = []
    L = [("SR-F01", "温度と湿度を測る", "機能", MUT), ("SR-W02", "電池で 1 年（条件付き）", "電源", SIG), ("SR-C01", "60 × 40 × 15 mm・30 g", "制約", SIG),
         ("SR-E03", "防塵・防水 IP54 相当", "環境", SIG), ("SR-P01", "温度の誤差 ±0.5 °C", "性能", SIG), ("SR-R01", "記録を 10 年保持", "信頼性", SIG),
         ("SR-C02", "部品の費用 1 500 円", "制約", SIG)]
    R = ["温湿度センサをマイコンにつなぐ", "眠っている間の電流が数 µA のマイコン", "接続の受付中だけアドバタイズする", "CR2032 1 個が入る小さな基板と筐体",
         "ボタンとケースの合わせ目の防水", "誤差の小さいセンサを、熱を出す部品から離す", "データを 20 年保持するフラッシュ", "BLE を内蔵したマイコンで部品を減らす"]
    links = {0: [0], 1: [1, 2], 2: [3, 7], 3: [4, 3], 4: [5], 5: [6], 6: [7, 1]}
    lx, lw, rx, rw = 14, 236, 430, 256
    o.append(T(lx, 18, "要求", "start", 11.5, SIG, True))
    o.append(T(rx, 18, "縛られて決まる設計（例）", "start", 11.5, PUR, True))
    ly = [32 + i * 42 for i in range(len(L))]
    ry = [30 + i * 37 for i in range(len(R))]
    for i, js in links.items():
        for j in js:
            y1, y2 = ly[i] + 16, ry[j] + 14
            c = MUT if i == 0 else SIG
            o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (lx + lw, y1, lx + lw + 90, y1, rx - 90, y2, rx - 2, y2), c=c, lw=1.4 if i else 1.2, dash="4 3" if i == 0 else None))
            o.append(_head(rx - 12, y2, rx - 1, y2, c, 6))
    for i, (sid, txt, kind, c) in enumerate(L):
        y = ly[i]
        o.append(RECT(lx, y, lw, 32, 6, MSOFT if i == 0 else SSOFT, c, 1.2, "4 3" if i == 0 else None))
        o.append(T(lx + 8, y + 21, sid, "start", 10, c, True, True))
        o.append(T(lx + 60, y + 21, txt, "start", 10, INK))
        o.append(_f01_chip(lx + lw - 6, y + 21, kind, MUT if i == 0 else SIG, 9))
    for j, t in enumerate(R):
        y = ry[j]
        o.append(_f01_box(rx, y, rw, 28, PUR, 1.1, 6))
        o.append(T(rx + 8, y + 18, t, "start", 10, INK))
    yb = max(ly[-1] + 32, ry[-1] + 28) + 22
    o.append(T(lx, yb, "機能の要求（破線）は、多くの部品と作り方で満たせる。機能以外の要求（実線）が、部品と作り方を決めていく。", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "ロガーの要求と、それに縛られて決まる設計（線は「この要求があるから、この設計にした」の関係。設計は例）。")
F["e01_nfr"] = _f01_nfr()


# =====================================================================
# 5 節: 使い方の条件で、同じロガーの電池寿命が何倍も変わる（この章の簡単な模型。w01.js の _w01_life と同じ計算）
# =====================================================================
_F01_Q = 180.0          # 設計で使う電池の容量 [mAh]
_F01_ISL = 2.55         # 眠りの電流 [µA]（25 °C。マイコン 2.0 + センサ 0.05 + フラッシュ 0.5）
_F01_QREC = 3.0 * 8 + 0.3 * 5 + 5 * 0.7 + 10 * 45 / 512   # 記録 1 回 [µC]（大まかに置いた値）
_F01_QADV = 5.0 * 2.0   # アドバタイズ 1 回 [µC]（100 ms ごと）
_F01_WIN = 120.0        # 接続の受付の窓 [s]
_F01_ICON = 1.0         # 接続中の平均の電流 [mA]
_F01_TCON = 5.0         # 読み出しのとき、接続までのアドバタイズの時間 [s]
_F01_QLED = 2.0 * 20    # LED の点灯 1 回 [µC]（2 mA × 20 ms）。記録中の表示は 30 秒ごとに 1 回、警報の表示は 30 秒ごとに 2 回


def _f01_life(interval=10, press=1, reads=1, conn=1.0, temp=25, alarm=False):
    """返り値 (眠り, 記録, 受付, 読み出し, LED の電流 [µA], 合計 [µA], 電池寿命 [年])。
    interval: 記録の間隔 [分]、press: 短押し [回/日]、reads: 読み出し [回/週]、conn: 接続の長さ [分]、temp: 周囲の温度 [°C]、
    alarm: 警報の表示が続く（30 秒ごとの表示が、記録中の表示の緑 1 回から、警報の表示の赤 2 回に代わる）。"""
    k = 1.5 ** ((temp - 25) / 10.0) if temp > 25 else 1.0
    i_sl = _F01_ISL * k
    i_rec = _F01_QREC / (interval * 60.0)
    i_adv = press * (_F01_QADV / 0.1 * _F01_WIN) / 86400.0
    i_rd = reads * (_F01_QADV / 0.1 * _F01_TCON + _F01_ICON * 1000 * conn * 60) / (7 * 86400.0)
    i_led = (2 if alarm else 1) * _F01_QLED / 30.0
    tot = i_sl + i_rec + i_adv + i_rd + i_led
    return i_sl, i_rec, i_adv, i_rd, i_led, tot, _F01_Q * 1000 / tot / 8760.0


_F01_CASES = [
    ("SR-W02 の条件", "10 分・25 °C・週 1 回 1 分の読み出し・短押し 1 日 1 回・警報なし", dict()),
    ("使い方が最も軽い", "60 分・25 °C・読み出しも短押しもしない", dict(interval=60, press=0, reads=0)),
    ("記録の間隔 1 分", "ほかは SR-W02 の条件と同じ", dict(interval=1)),
    ("警報の表示が続く", "上限と下限を初期値のまま 25 °C で使う", dict(alarm=True)),
    ("毎日 5 分ずつ読み出す", "ほかは SR-W02 の条件と同じ", dict(reads=7, conn=5)),
    ("周囲 60 °C", "ほかは SR-W02 の条件と同じ", dict(temp=60)),
    ("1 日 10 回、5 分ずつ読み出す", "短押しも 1 日 10 回", dict(press=10, reads=70, conn=5)),
    ("全部が重い", "1 分・60 °C・警報あり・1 日 10 回 5 分の読み出し・短押し 1 日 20 回", dict(interval=1, press=20, reads=70, conn=5, temp=60, alarm=True)),
]


def _f01_profile():
    o = []
    n = len(_F01_CASES)
    p = Plot(330, 30, 340, n * 36, (0, 6), (0, n))
    for v in range(0, 7):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, "%d" % v, "middle", 9.5, MUT))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    o.append(T(p.x + p.w / 2, p.y + p.h + 32, "電池寿命 [年]", "middle", 10, MUT))
    for i, (name, cond, kw) in enumerate(_F01_CASES):
        L = _f01_life(**kw)[-1]
        y = p.y + 4 + i * 36
        c = GRN if L >= 1 else ALI
        o.append(T(14, y + 12, name, "start", 10.5, SIG if i == 0 else INK, True))
        o.append(T(14, y + 26, cond, "start", 9, MUT))
        o.append(RECT(p.x, y + 4, p.X(L) - p.x, 20, 3, soft(c), SIG if i == 0 else c, 2.2 if i == 0 else 1.2))
        o.append(T(max(p.X(L), p.X(1)) + 6, y + 18, "%.1f 年" % L, "start", 10, c, True, halo=True))
    o.append(W(p.X(1), p.y - 6, p.X(1), p.y + p.h, c=ALI, lw=1.6, dash="5 3"))
    o.append(T(p.X(1) + 4, p.y - 10, "要求の 1 年", "start", 9.5, ALI, True))
    return SVG(700, p.y + p.h + 42, o, "使い方の条件を変えたときの、同じロガーの電池寿命（この章の簡単な模型。容量 180 mAh、眠りの電流 2.55 µA（25 °C）、記録 1 回 30 µC、受付 1 回 12 mC、接続 1 分 60 mC、記録中の LED の表示 1.33 µA（警報の表示が続くと 2.67 µA）。どれも例の値）。")
F["e01_profile"] = _f01_profile()


# =====================================================================
# 6 節: トレーサビリティの網とマトリクス（この節の例。w01.js の _W01_TR と同じデータ）
# =====================================================================
_F01_TU = ["1 温湿度を後で確かめる", "2 逸脱にすぐ気づく", "3 電池の交換は年 1 回", "4 5 年使い 10 年残す"]
_F01_TS = [("SR-F01", "測定"), ("SR-F02", "記録の間隔"), ("SR-F04", "記録の容量"), ("SR-F10", "警報の印"), ("SR-P01", "温度の誤差"),
           ("SR-W02", "電池寿命"), ("SR-R01", "記録の保持"), ("SR-R04", "5 年の使用")]
_F01_TD = [("DS-H01", "マイコン"), ("DS-H02", "温湿度センサ"), ("DS-H03", "記録用フラッシュ"), ("DS-S01", "測定と記録の処理"),
           ("DS-S02", "警報と LED の処理"), ("DS-D01", "記録 1 件の形式"), ("DS-B01", "電力の予算"), ("DS-S09", "デバッグ用の命令")]
_F01_TT = [("ST-001", "測定"), ("ST-002", "記録の間隔"), ("ST-004", "記録の容量"), ("ST-010", "警報の印"), ("ST-029", "温度の誤差"), ("ST-036", "電池寿命（解析）"),
           ("ST-046", "書き換え回数（解析）")]   # 番号は 03 章の表 6-1 と同じ
_F01_TUS = {0: [0, 1, 2, 4], 1: [3], 2: [5], 3: [6, 7]}
_F01_TSD = {0: [1, 3], 1: [3, 6], 2: [2, 5], 3: [4], 4: [1], 5: [0, 6], 6: [2], 7: [2, 3]}
_F01_TST = {0: [0], 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [], 7: [6]}


def _f01_trace():
    o = []
    CH = 1      # 変える要求（SR-F02）
    dsd = set(_F01_TSD[CH])                                                    # 直接の設計
    ind = set(i for i, js in _F01_TSD.items() if i != CH and dsd & set(js))   # 同じ設計を使うほかの要求
    stt = set(_F01_TST[CH]) | set(j for i in ind for j in _F01_TST[i])
    o.append(T(14, 18, "(a) 網: SR-F02 を変えるとき、影響の広がり", "start", 11.5, INK, True))
    xu, wu, xs, ws, xr, wr = 14, 132, 184, 140, 406, 178
    nh = 20
    ys = [52 + i * 40 for i in range(8)]
    yu = [ys[0] + 30, ys[3], ys[5], ys[6] + 20]
    yd = [48 + i * 24 for i in range(8)]
    yt = [yd[-1] + 46 + i * 24 for i in range(len(_F01_TT))]
    def link(x1, y1, x2, y2, c, lw, dash=None):
        return PATH("M%g,%g C%g,%g %g,%g %g,%g" % (x1, y1, (x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2), c=c, lw=lw, dash=dash)
    for u, js in _F01_TUS.items():
        for j in js:
            o.append(link(xu + wu, yu[u] + nh / 2, xs, ys[j] + nh / 2, FNT, 1.0))
    for i, js in _F01_TSD.items():
        for j in js:
            hot = i == CH
            o.append(link(xs + ws, ys[i] + nh / 2, xr, yd[j] + nh / 2, SIG if hot else (GLD if i in ind and j in dsd else PSOFT if False else FNT), 2.2 if hot else (1.6 if i in ind and j in dsd else 1.0), None if hot else ("4 3" if i in ind and j in dsd else None)))
    for i, js in _F01_TST.items():
        for j in js:
            hot = i == CH or i in ind
            o.append(link(xs + ws, ys[i] + nh / 2, xr, yt[j] + nh / 2, (SIG if i == CH else GLD) if hot else FNT, 2.2 if i == CH else (1.6 if hot else 1.0), "4 3" if (hot and i != CH) else None))
    for u, t in enumerate(_F01_TU):
        o.append(RECT(xu, yu[u], wu, nh, 4, GOSOFT, GLD, 1))
        o.append(T(xu + 6, yu[u] + 14, t, "start", 9.5, INK))
    for i, (sid, t) in enumerate(_F01_TS):
        notest = not _F01_TST[i]
        c = SIG if i == CH else (GLD if i in ind else (ALI if notest else SIG))
        o.append(RECT(xs, ys[i], ws, nh, 4, ASOFT if notest else (SSOFT if i != CH else SIG), c, 2.0 if (i == CH or i in ind) else 1.1, "4 2" if i in ind else None))
        o.append(T(xs + 6, ys[i] + 14, sid, "start", 9.5, SCR if i == CH else c, True, True))
        o.append(T(xs + 52, ys[i] + 14, t, "start", 9.5, SCR if i == CH else INK))
    for j, (did, t) in enumerate(_F01_TD):
        noreq = not any(j in js for js in _F01_TSD.values())
        c = ALI if noreq else PUR
        o.append(RECT(xr, yd[j], wr, nh, 4, ASOFT if noreq else PSOFT, SIG if j in dsd else c, 2.0 if j in dsd else 1.0))
        o.append(T(xr + 6, yd[j] + 14, did, "start", 9.5, c, True, True))
        o.append(T(xr + 54, yd[j] + 14, t, "start", 9.5, INK))
    for j, (tid, t) in enumerate(_F01_TT):
        o.append(RECT(xr, yt[j], wr, nh, 4, GSOFT, SIG if j in stt else GRN, 2.0 if j in stt else 1.0))
        o.append(T(xr + 6, yt[j] + 14, tid, "start", 9.5, GRN, True, True))
        o.append(T(xr + 54, yt[j] + 14, t, "start", 9.5, INK))
    o.append(T(xu, ys[0] - 8, "要求仕様書の項目", "start", 9.5, GLD, True))
    o.append(T(xs, ys[0] - 8, "システムの要求", "start", 9.5, SIG, True))
    o.append(T(xr, yd[0] - 8, "設計の要素", "start", 9.5, PUR, True))
    o.append(T(xr, yt[0] - 8, "システム試験", "start", 9.5, GRN, True))
    xn = xr + wr + 10
    o.append(T(xn, yd[3] + 4, "← 変える", "start", 9.5, SIG, True))
    o.append(T(xn, yd[3] + 17, "要求が使う", "start", 9.5, SIG, True))
    o.append(T(xn, yd[7] + 14, "← 要求が無い", "start", 9.5, ALI, True))
    for j in sorted(stt):
        o.append(T(xn, yt[j] + 14, "← 確かめ直す", "start", 9.5, SIG if j in _F01_TST[CH] else GLD, True))
    o.append(T(xs + ws, ys[6] - 4, "試験が無い", "end", 9.5, ALI, True, halo=True))
    o.append(LEGL(14, yt[-1] + 44, [(SIG, None, "SR-F02 に直接つながる"), (GLD, "4 3", "同じ設計の要素を通して広がる")], 9.5, 18))
    # (b) マトリクス
    y0 = yt[-1] + 76
    o.append(T(14, y0, "(b) トレーサビリティマトリクス（行がシステムの要求、列が設計の要素とシステム試験）", "start", 11.5, INK, True))
    mx, cw, rh = 146, 22, 18
    hy = y0 + 64
    cols = [(d, PUR) for d, _ in _F01_TD] + [(t, GRN) for t, _ in _F01_TT]
    for k, (cid, c) in enumerate(cols):
        x = mx + k * cw + (12 if k >= 8 else 0)
        o.append(T(x + cw / 2 + 3, hy - 6, cid, "start", 9, c, True, True, rot=-90))
    for i, (sid, t) in enumerate(_F01_TS):
        y = hy + i * rh
        o.append(T(mx - 6, y + 13, "%s %s" % (sid, t), "end", 9.5, INK, i == CH))
        for k in range(len(cols)):
            x = mx + k * cw + (12 if k >= 8 else 0)
            if k < 8:
                on = k in _F01_TSD[i]; bad = (k == 7)
            else:
                on = (k - 8) in _F01_TST[i]; bad = not _F01_TST[i]
            fill = ASOFT if bad else (SSOFT if i == CH else SCR)
            o.append(RECT(x, y, cw, rh, 0, fill, LIN, 0.8))
            if on:
                o.append(D(x + cw / 2, y + rh / 2, SIG if i == CH else INK, 4))
    ye = hy + 8 * rh
    xe = mx + len(cols) * cw + 12
    o.append(T(xe + 10, hy + 6 * rh + 13, "← 空の行: 試験の無い要求", "start", 9.5, ALI, True))
    o.append(T(mx + 7 * cw + cw / 2, ye + 14, "↑ 空の列: 要求の無い設計", "middle", 9.5, ALI, True))
    return SVG(700, ye + 24, o, "要求・設計・試験のトレーサビリティ（要求と ST の番号は 03 章の表 6-1 と同じ。載せた要求の選び方、要求仕様書の項目、DS の ID と対応は、この節の説明のための例。ロガーの設計の要素は 04 章 6 節）。")
F["e01_trace"] = _f01_trace()


# =====================================================================
# 6 節: 版の管理 — ベースラインと変更要求
# =====================================================================
def _f01_baseline():
    o = []
    X = lambda t: 92 + t * 5.8     # t: 週
    y1, y2, y3 = 66, 196, 236
    o.append(T(14, y1 + 4, "LG-SYS-001", "start", 10, SIG, True, True))
    o.append(T(14, y1 + 17, "仕様書", "start", 9.5, MUT))
    o.append(W(X(0), y1, X(100), y1, c=SIG, lw=2))
    o.append(RECT(X(0), y1 - 40, X(30) - X(0), 18, 3, MSOFT, "none", 0))
    o.append(T((X(0) + X(30)) / 2, y1 - 27, "下書き: 書く人が直す", "middle", 9.5, MUT, True))
    o.append(RECT(X(36), y1 - 40, X(100) - X(36), 18, 3, SSOFT, "none", 0))
    o.append(T((X(36) + X(100)) / 2, y1 - 27, "ベースライン: 変更要求を通してだけ変える", "middle", 9.5, SIG, True))
    for t, lab in ((2, "0.1"), (14, "0.2")):
        o.append(CIRC(X(t), y1, 7, c=MUT, lw=1.6, fill=SCR))
        o.append(T(X(t), y1 + 24, "版 " + lab, "middle", 9.5, MUT, True))
    for t0, t1, lab in ((21, 32, "レビュー"), (56, 84, "変更要求 CR-001")):
        o.append(RECT(X(t0), y1 - 12, X(t1) - X(t0), 24, 5, SCR, "none", 0))
        o.append(RECT(X(t0), y1 - 12, X(t1) - X(t0), 24, 5, GOSOFT, GLD, 1.2))
        o.append(T((X(t0) + X(t1)) / 2, y1 + 4, lab, "middle", 9.5, GLD, True))
    o.append(CIRC(X(36), y1, 9, c=SIG, lw=2.6, fill=SCR))
    o.append(CIRC(X(36), y1, 9, c=SIG, lw=2.6, fill=SSOFT))
    o.append(T(X(36), y1 + 26, "版 1.0（承認）", "middle", 10, SIG, True))
    o.append(CIRC(X(90), y1, 9, c=SIG, lw=2.6, fill=SCR))
    o.append(CIRC(X(90), y1, 9, c=SIG, lw=2.6, fill=SSOFT))
    o.append(T(X(90), y1 + 26, "版 1.1", "middle", 10, SIG, True))
    # 変更要求の中身
    bx, by, bw = X(41), y1 + 40, 690 - X(41)
    o.append(W(X(70), y1 + 12, X(70), by, c=GLD, lw=1.1, dash="3 3"))
    o.append(_f01_box(bx, by, bw, 62, GLD, 1.1, 6))
    o.append(T(bx + 8, by + 17, "CR-001: SR-F02 の記録の間隔の下限を 1 分から 30 秒に（例）", "start", 9.5, INK, True))
    o.append(T(bx + 8, by + 33, "影響（網をたどる）: DS-S01・DS-B01 → 要求 SR-F01・SR-R04・SR-W02", "start", 9.5, INK))
    o.append(T(bx + 8, by + 49, "確かめ直す試験: ST-001・ST-002・ST-036・ST-046", "start", 9.5, INK))
    # 設計書と試験仕様書
    for y, nm, sub, c in ((y2, "LG-DES-001", "設計書", PUR), (y3, "LG-TST-001", "試験仕様書", GRN)):
        o.append(T(14, y + 4, nm, "start", 10, c, True, True))
        o.append(T(14, y + 17, sub, "start", 9.5, MUT))
        o.append(RECT(X(38), y - 9, X(90) - X(38), 18, 4, soft(c), c, 1.1))
        o.append(T(X(39.5), y + 4, "入力: LG-SYS-001 版 1.0", "start", 9.5, INK))
        o.append(RECT(X(91), y - 9, X(100) - X(91), 18, 4, soft(c), SIG, 1.8))
        o.append(T(X(95.5), y + 4, "版 1.1", "middle", 9.5, INK, True))
    o.append(ARR(X(35), y1 + 32, X(37), y2 - 11, c=FNT, lw=1.1, head=5))
    o.append(ARR(X(91), y1 + 32, X(92.5), by - 2, c=SIG, lw=1.4, head=6))
    o.append(T(X(92.5) - 4, y2 - 16, "改訂", "end", 9.5, SIG, True, halo=True))
    o.append(ARR(X(10), y3 + 30, X(100), y3 + 30, c=FNT, lw=1.2, head=6))
    o.append(T(X(100) + 4, y3 + 34, "時間", "start", 9.5, MUT))
    return SVG(700, y3 + 42, o, "仕様書の版と、設計書・試験仕様書が入力にする版（版と変更要求の番号は、この節の説明のための例）。")
F["e01_baseline"] = _f01_baseline()
