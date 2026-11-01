# -*- coding: utf-8 -*-
# 16 章 条件別の設計ガイド の図

# ---- 補助 ----
def _f16_m(x, y, parts, a="start", sz=12, c=INK, b=False):
    """添字付きの記号を並べた文字。parts = [(文字, 添字, 斜体か), ...]。添字の後の文字は次の tspan の dy で元の高さに戻す。"""
    w = 0.0
    for s, sub, it in parts:
        w += tw(s, sz) + (tw(sub, sz * 0.72) if sub else 0)
    x0 = x - (w / 2 if a == "middle" else (w if a == "end" else 0))
    if _CHECK:
        _BOXES.append((x0, y - sz * 0.82, x0 + w, y + sz * 0.22 + 2, "".join(p[0] + (p[1] or "") for p in parts)))
    o = ['<text x="%g" y="%g" text-anchor="start" font-size="%g" fill="%s" font-family="var(--sans)" font-weight="%s"'
         ' stroke="%s" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' % (round(x0, 2), y, sz, c, "700" if b else "400", SCR)]
    pend = 0
    for s, sub, it in parts:
        o.append('<tspan font-style="%s"%s>%s</tspan>' % ("italic" if it else "normal", (' dy="%g"' % pend) if pend else "", E(s)))
        pend = 0
        if sub:
            o.append('<tspan dy="3" font-size="%g">%s</tspan>' % (sz * 0.72, E(sub)))
            pend = -3
    o.append("</text>")
    return "".join(o)

def _f16_fmt(v, d=3):
    s = ("%." + str(d) + "g") % v
    return s.replace("-", "−")

# 段の名前と色（1 節の図と 8 節の図で共通）
_F16_STEPS = [("条件の書き出し", MUT), ("電力の予算", GLD), ("電源の構成", GLD), ("測り方の設計", TEA),
              ("駆動の設計", PUR), ("異常への備え", GRN), ("確かめ", SIG)]

# ---- 1 節: 設計の手順 ----
def _f16_flow():
    o = []
    rows = [("4 つの軸を数と範囲で書く（電圧・温度・年数・回数・止まったら何が起きるか）", "01 章"),
            ("部品と動作ごとの平均電流とピーク電流を表にし、電源が出せる量と比べる", "01・03・05・07・08 章"),
            ("電源の種類・レギュレータ・入口の保護・予備の電源・電源電圧の監視", "02・04・05・06 章"),
            ("センサのつなぎ方と電源・基準電圧・周期・フィルタ・故障の検出", "08〜11 章"),
            ("スイッチ・PWM・突入電流・動かす順番", "12〜14 章"),
            ("安全な状態・既定の状態・ウォッチドッグ・停電と復電・縮退", "06・15 章"),
            ("最も悪い条件（低温・使い終わりの電池・低い入力・重い負荷）で計算と測定", "07 章・テストシリーズ")]
    x0, bw, bh, y0, dy = 70, 150, 34, 58, 48
    o.append(RECT(x0, 10, 600, 30, 7, MSOFT, MUT, 1.2))
    o.append(T(x0 + 300, 30, "使用条件の 4 つの軸（電源・負荷・環境・使われ方）　01 章 2 節", "middle", 11, INK, True))
    o.append(ARR(x0 + bw / 2, 40, x0 + bw / 2, y0 - 2, c=MUT, lw=1.4))
    for i, ((nm, c), (txt, ch)) in enumerate(zip(_F16_STEPS, rows)):
        y = y0 + i * dy
        o.append(RECT(x0, y, bw, bh, 7, soft(c), c, 1.4))
        o.append(T(x0 + 14, y + bh / 2 + 4.5, str(i + 1), "middle", 12, c, True))
        o.append(T(x0 + 28, y + bh / 2 + 4.5, nm, "start", 12, INK, True))
        o.append(T(x0 + bw + 14, y + 14, txt, "start", 10, INK))
        o.append(T(x0 + bw + 14, y + 29, ch, "start", 9.5, MUT))
        if i < 6:
            o.append(ARR(x0 + bw / 2, y + bh, x0 + bw / 2, y + dy - 2, c=MUT, lw=1.4))
    # 戻る矢印（7 段目から 2・3 段目へ）
    y7 = y0 + 6 * dy + bh / 2
    xl = 36
    o.append(W(x0, y7, xl, y7, xl, y0 + dy + bh / 2, c=ALI, lw=1.4, dash="5 3"))
    o.append(ARR(xl, y0 + dy + bh / 2, x0 - 2, y0 + dy + bh / 2, c=ALI, lw=1.4, dash="5 3"))
    o.append(W(xl, y0 + 2 * dy + bh / 2, x0 - 6, y0 + 2 * dy + bh / 2, c=ALI, lw=1.2, dash="5 3"))
    o.append(_head(xl, y0 + 2 * dy + bh / 2, x0 - 2, y0 + 2 * dy + bh / 2, ALI, 6))
    o.append(T(xl - 8, y0 + 4.5 * dy, "基準を満たさなければ戻る", "middle", 10, ALI, rot=-90))
    yb = y0 + 6 * dy + bh + 20
    o.append(T(x0, yb, "各段で確かめることを「確かめること・基準・値・判定・読む節」の 1 行にして並べたものが、チェックの表である。", "start", 10, MUT))
    return SVG(700, yb + 10, o, "設計の手順の 7 つの段。使用条件を数で書き出し、電力の予算・電源の構成・測り方・駆動・異常への備えを順に決め、最後に最も悪い条件で確かめる。確かめで基準を満たさなければ、前の段（多くは予算か電源の構成）へ戻る。右の章は、その段で使う道具を扱った章。")
F["e16_flow"] = _f16_flow()

def _f16_heavy():
    o = []
    conds = ["電池", "USB・AC アダプタ", "商用電源に直結", "車の電源", "屋外・環境発電"]
    cells = [  # (文字の 2 行, 重いか) を 2〜6 段について
        [("寿命と", "パルスの底", 1), ("電池の種類・", "静止電流", 1), ("測るときだけ", "電源を入れる", 0), ("大きな動作を", "重ねない", 0), ("尽きかけたら", "段階で止まる", 0)],
        [("電流の予算と", "回し始めの電流", 1), ("ケーブル・", "抜き差し・突入", 1), ("PC と GND を", "共有する", 0), ("時間をかけて", "上げる", 0), ("抜かれたら", "書き始めない", 0)],
        [("待機電力", "", 0), ("絶縁・", "サージ", 1), ("絶縁した", "信号で受ける", 0), ("ゼロクロス・", "サイクル単位", 0), ("停電・復電・", "過熱と空だき", 1)],
        [("止めている間の", "暗電流", 1), ("クランキング・", "ロードダンプ", 1), ("ACC の線を", "読む", 0), ("ノイズに", "強く切る", 0), ("下がったら", "保持して守る", 1)],
        [("1 週間の", "エネルギーの収支", 1), ("低温で充電", "できない時間", 1), ("結露・", "長い配線と雷", 1), ("寒いときは", "仕事を減らす", 0), ("故障したら", "縮退運転", 0)]]
    xl, cw, y0, rh = 128, 112, 46, 44
    for j in range(5):
        nm, c = _F16_STEPS[j + 1]
        xc = xl + j * cw + cw / 2
        o.append(T(xc, 18, "%d. %s" % (j + 2, nm), "middle", 10.5, c, True))
    o.append(T(xl + 2.5 * cw, 34, "（1 段目の書き出しと 7 段目の確かめは、どの条件でも同じように行う）", "middle", 9.5, MUT))
    for i, cn in enumerate(conds):
        y = y0 + i * rh
        o.append(T(xl - 10, y + rh / 2 + 4, cn, "end", 11, INK, True))
        for j, (l1, l2, hv) in enumerate(cells[i]):
            x = xl + j * cw
            c = _F16_STEPS[j + 1][1]
            o.append(RECT(x + 3, y + 3, cw - 6, rh - 6, 5, soft(c) if hv else PAN, c if hv else LIN, 1.6 if hv else 1.0))
            if hv:
                o.append(D(x + 12, y + 12, c, 3.6))
            if l2:
                o.append(T(x + cw / 2, y + rh / 2 - 2, l1, "middle", 9.5, INK if hv else MUT, hv == 1))
                o.append(T(x + cw / 2, y + rh / 2 + 11, l2, "middle", 9.5, INK if hv else MUT, hv == 1))
            else:
                o.append(T(x + cw / 2, y + rh / 2 + 4, l1, "middle", 9.5, INK if hv else MUT, hv == 1))
    yb = y0 + 5 * rh + 18
    o.append(D(xl + 6, yb - 4, GLD, 3.6))
    o.append(T(xl + 16, yb, "色の付いた枠: その条件で特に重い段（2〜6 節の例の機器で、チェックの表の中心になる所）", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "電源の条件ごとに、2〜6 段で主に確かめること。電池と屋外では電力の予算が、USB・AC アダプタと車では電源の構成が重く、商用電源に直結する機器では絶縁と異常への備えが安全を決める。")
F["e16_heavy"] = _f16_heavy()

# ---- 2 節: 電池の機器の電力の予算 ----
_F16_BUD = [  # 行の名前, はじめ [µA], 直した後 [µA], 読む節, 直し方
    ("眠り（マイコン・RTC）", 2.00, 2.00, "07 章 1 節", ""),
    ("処理（3 mA・4 ms）", 0.20, 0.20, "01 章 4 節", ""),
    ("送信（10 mA・3 ms）", 0.50, 0.50, "01 章 4 節", ""),
    ("温度センサ", 2.10, 0.22, "08 章 3 節", "測るときだけ入れる"),
    ("電池の電圧の分圧", 1.50, 0.0, "09 章 2 節", "内部の基準で測る"),
    ("コンデンサの漏れ電流", 0.0, 0.10, "04 章 1 節", "100 µF を足した分"),
    ("LED（1 日 10 回）", 0.0116, 0.0116, "12 章 2 節", ""),
    ("自己放電（1 年に 1 %）", 0.2511, 0.2511, "03 章 5 節", "")]

def _f16_budget():
    o = []
    x0, sc, y0, rh = 168, 125.0, 34, 30
    o.append(T(x0, 16, "1 行ごとの平均電流 [µA]（値は例の値。1 分ごとに起きる）", "start", 10.5, INK, True))
    o.append(LEGEND(470, 16, [(ALI, "はじめの設計"), (GRN, "直した設計")]))
    for k in range(0, 3):
        xx = x0 + k * sc
        o.append(W(xx, y0 - 4, xx, y0 + len(_F16_BUD) * rh, c=GRD, lw=1))
        o.append(T(xx, y0 + len(_F16_BUD) * rh + 13, "%d" % k, "middle", 9.5, MUT))
    for i, (nm, a, b, ch, how) in enumerate(_F16_BUD):
        y = y0 + i * rh
        o.append(T(x0 - 8, y + 12, nm, "end", 10, INK))
        o.append(T(x0 - 8, y + 24, ch, "end", 9, MUT))
        for k, (v, c) in enumerate(((a, ALI), (b, GRN))):
            yy = y + 3 + k * 12
            o.append(RECT(x0, yy, max(v * sc, 0.8), 10, 2, soft(c), c, 1.1))
            o.append(T(x0 + v * sc + 6, yy + 9, "%.2f" % v if v >= 0.1 or v == 0 else "%.3f" % v, "start", 9.5, c, True))
        if how:
            o.append(T(560, y + 19, "→ " + how, "start", 9.5, GRN))
    # 合計の積み上げ
    yt = y0 + len(_F16_BUD) * rh + 34
    sc2 = 62.0
    o.append(T(x0 - 8, yt + 4, "合計", "end", 10.5, INK, True))
    cols = [MUT, PUR, GLD, TEA, ALI, SIG, PUR, GLD]
    for k, (tot_idx, c0) in enumerate(((1, ALI), (2, GRN))):
        yy = yt - 8 + k * 16
        xx = x0
        for i, row in enumerate(_F16_BUD):
            v = row[tot_idx]
            if v <= 0:
                continue
            o.append(RECT(xx, yy, v * sc2, 12, 1, soft(c0), c0, 0.9))
            xx += v * sc2
        tot = sum(r[tot_idx] for r in _F16_BUD)
        o.append(T(xx + 6, yy + 10, "%.2f µA" % tot, "start", 10, c0, True))
    o.append(T(x0, yt + 32, "積み上げの区切りは、上の行の順（眠り・処理・送信・センサ・分圧・漏れ・LED・自己放電）。", "start", 9.5, MUT))
    return SVG(700, yt + 42, o, "冷蔵庫に入れる温度の記録計の電力の予算（CR2032、1 分ごとに測って記録し、送る。値は例の値）。はじめの設計では、眠っている間に流れ続けるセンサの待機と分圧が半分あまりを占める。センサを測るときだけ入れ、分圧をやめると、100 µF のコンデンサの漏れ電流を足しても、合計は 6.56 µA から 3.28 µA になる。")
F["e16_budget"] = _f16_budget()

def _f16_capacity():
    o = []
    # 03・04 章の模型で求めた割合（本文と同じ値）
    rows = [("はじめ・0 °C", 0.781, 28.74, "2.5 年"), ("はじめ・−20 °C", 0.123, 28.74, "すぐ止まる"),
            ("直した後・0 °C", 0.913, 1.10, "6.9 年"), ("直した後・−20 °C", 0.860, 1.10, "6.5 年")]
    x0, wd, y0, rh = 150, 420, 40, 40
    sc = wd / 220.0
    for k in (0, 50, 100, 150, 200, 220):
        xx = x0 + k * sc
        o.append(W(xx, y0 - 6, xx, y0 + 4 * rh - 6, c=GRD, lw=1))
        o.append(T(xx, y0 + 4 * rh + 8, "%d" % k, "middle", 9.5, MUT))
    o.append(T(x0 + wd / 2, y0 + 4 * rh + 24, "CR2032 の公称容量 220 mAh の内訳 [mAh]", "middle", 10, MUT))
    o.append(T(x0 + wd + 12, 26, "電池寿命", "start", 10.5, INK, True))
    for i, (nm, u, st, life) in enumerate(rows):
        y = y0 + i * rh
        use = u * 220.0
        o.append(T(x0 - 8, y + 15, nm, "end", 10.5, INK, True))
        good = use - st
        xx = x0
        if good > 0:
            o.append(RECT(xx, y, good * sc, 20, 2, GSOFT, GRN, 1.2))
            if good * sc > 120:
                o.append(T(xx + good * sc / 2, y + 14, "寿命の間に使える %.1f mAh" % good, "middle", 9.5, GRN, True))
            xx += good * sc
            o.append(RECT(xx, y, st * sc, 20, 2, GOSOFT, GLD, 1.2))
            xx += st * sc
        else:
            o.append(RECT(xx, y, use * sc, 20, 2, GOSOFT, GLD, 1.2))
            xx += use * sc
        o.append(RECT(xx, y, x0 + wd - xx, 20, 2, MSOFT, MUT, 1.0, dash="3 2"))
        if x0 + wd - xx > 150:
            o.append(T((xx + x0 + wd) / 2, y + 14, "パルスの底で使えない %.0f %%" % ((1 - u) * 100), "middle", 9.5, MUT))
        o.append(T(x0 + wd + 12, y + 15, life, "start", 11, ALI if i < 2 else GRN, True))
    yl = y0 + 4 * rh + 46
    o.append(LEGEND(x0 - 60, yl, [(GRN, "寿命の間に使える"), (GLD, "出荷までの保管で失う"), (MUT, "パルスの底が 2.2 V を割って使えない")]))
    o.append(T(x0 - 60, yl + 18, "はじめ・−20 °C: 使える 27.1 mAh より、保管で失う 28.7 mAh のほうが大きく、何も残らない。", "start", 9.5, ALI))
    return SVG(700, yl + 28, o, "使える電荷の内訳と電池寿命。パルスの底で使える割合は 03 章 4 節と 04 章 1 節の CR2032 の模型の値（はじめは LED と送信が重なる 15 mA・3 ms、直した後は 20 ms の LED のパルスで決まる）。寿命は、使える分から保管の分を引き、自己放電を含む平均電流（6.56 µA・3.28 µA）で割った時間。")
F["e16_capacity"] = _f16_capacity()
