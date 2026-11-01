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
        [("止めている間の", "暗電流", 1), ("クランキング・", "ロードダンプ", 1), ("ACC の線を", "読む", 0), ("ハイサイドで", "負荷を切る", 0), ("下がったら", "保持して守る", 1)],
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
            ("直した後・0 °C", 0.913, 1.10, "7.0 年"), ("直した後・−20 °C", 0.860, 1.10, "6.5 年")]
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

# ---- 3 節: USB の扇風機の回し始め ----
# 13 章 1 節のモータの式に、ファンのトルク c ω² を負荷として入れた模型（例の値）。電源の電流 = D × モータの電流 + 20 mA
_F16_FAN = dict(V=5.0, R=5.0, L=0.5e-3, k=0.01, J=2e-6)
_F16_FAN["c"] = _F16_FAN["k"] * 0.35 / ((5.0 - 5.0 * 0.35) / _F16_FAN["k"]) ** 2

def _f16_fan(Dmax, tr, T, dt=1e-5, every=200):
    p = _F16_FAN
    i = w = 0.0
    pts = [(0.0, 0.02)]
    pk = 0.0
    n = int(T / dt)
    for s in range(1, n + 1):
        t = s * dt
        D = Dmax if tr <= 0 else min(Dmax, Dmax * t / tr)
        i += (D * p["V"] - p["R"] * i - p["k"] * w) / p["L"] * dt
        w += (p["k"] * i - p["c"] * w * w) / p["J"] * dt
        sup = D * i + 0.02
        pk = max(pk, sup)
        if s % every == 0 or (tr <= 0 and s < 400 and s % 10 == 0):
            pts.append((t, sup))
    return pts, pk

def _f16_usb():
    o = []
    pa = Plot(64, 34, 262, 170, (0, 1.5), (0, 1.5))
    pb = Plot(418, 34, 262, 170, (0, 2.5), (0, 0.3))
    o.append(pa.axes(xl="時間 [s]", yl="電源の電流 [A]", xt=[0, 0.5, 1.0, 1.5], yt=[0, 0.5, 1.0, 1.5], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(pb.axes(xl="時間 [s]", yl="電源の電流 [A]", xt=[0, 0.5, 1.0, 1.5, 2.0, 2.5], yt=[0, 0.1, 0.2, 0.3], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    o.append(T(pa.x, 22, "(a) 強（デューティ比 1.0）", "start", 11, INK, True))
    o.append(T(pb.x, 22, "(b) 弱（デューティ比 0.5）", "start", 11, INK, True))
    a1, k1 = _f16_fan(1.0, 0, 1.5)
    a2, k2 = _f16_fan(1.0, 0.5, 1.5)
    b1, k3 = _f16_fan(0.5, 0, 2.5)
    b2, k4 = _f16_fan(0.5, 2.0, 2.5)
    for lv, lab, c, dy in ((1.35, "BC 1.2・Type-C 1.5 A の 9 割", MUT, -5), (0.9, "専用の AC アダプタ 1 A の 9 割", GLD, 13)):
        o.append(pa.line([(0, lv), (1.5, lv)], c=c, lw=1.2, dash="6 4"))
        o.append(T(pa.X(1.5) - 2, pa.Y(lv) + dy, lab, "end", 9.5, c, halo=True))
    o.append(pb.line([(0, 0.09), (2.5, 0.09)], c=GLD, lw=1.2, dash="6 4"))
    o.append(T(pb.X(1.15), pb.Y(0.09) - 5, "ふつうのポート 100 mA の 9 割", "middle", 9.5, GLD, halo=True))
    o.append(pa.line(a1, c=ALI, lw=2))
    o.append(pa.line(a2, c=GRN, lw=2))
    o.append(pb.line(b1, c=ALI, lw=2))
    o.append(pb.line(b2, c=GRN, lw=2))
    o.append(T(pa.X(0.05), pa.Y(k1) - 6, "一気に回す: 最大 %.2f A" % k1, "start", 9.5, ALI, True, halo=True))
    o.append(T(pa.X(0.62), pa.Y(k2) - 8, "0.5 s で上げる: 最大 %.2f A" % k2, "start", 9.5, GRN, True, halo=True))
    o.append(T(pb.X(0.08), pb.Y(k3) + 4, "一気に回す: 最大 %.2f A" % k3, "start", 9.5, ALI, True, halo=True))
    o.append(T(pb.X(0.9), pb.Y(0.05) + 22, "2 s で上げる: 最大 %d mA" % round(k4 * 1000), "start", 9.5, GRN, True, halo=True))
    return SVG(700, 250, o, "卓上の扇風機の、回し始めの電源の電流（マイコンと LED の 20 mA を含む。13 章 1 節のモータの式に、速さの 2 乗に比例するファンのトルクを入れて計算した例の値）。一気に強で回すと拘束電流の 1 A が流れ、専用の AC アダプタの予算を超える。デューティ比を 0.5 s かけて上げると最大 0.42 A になる。ふつうのポートでは、弱を 2 s かけて上げれば 90 mA に収まる。")
F["e16_usb"] = _f16_usb()

# ---- 4 節: 電気ポットの構成と守り ----
def _f16_pot():
    o = []
    yb = 168
    o.append(W(10, yb, 690, yb, c=GRN, lw=1.6, dash="7 4"))
    o.append(T(14, yb - 8, "二次側（触れる側）", "start", 10, GRN, True))
    o.append(T(14, yb + 17, "一次側（商用電源）", "start", 10, ALI, True))
    o.append(T(686, yb - 8, "絶縁の境界", "end", 10, GRN, True))
    # 二次側
    o.append(BOX(262, 22, 210, 78, "マイコン", "上がる速さ・上限・停電の後始末・ウォッチドッグ", SIG, SSOFT, INK, sz=12, ssz=9.5))
    o.append(CHIP(240, 40, "①", SIG, 9.5, a="middle")[0])
    o.append(BOX(520, 34, 120, 46, "表示とボタン", None, MUT, PAN, INK, sz=10.5))
    o.append(W(472, 57, 520, 57, c=MUT, lw=1.3))
    # 境界をまたぐ部品
    parts = [(134, 84, "絶縁電源", "2 W・22 µF"), (228, 84, "交流の検出", "フォトカプラ"), (322, 72, "リレー", "コイル｜接点"),
             (404, 72, "SSR", "光で絶縁"), (486, 140, "サーミスタ", "ヒータから絶縁して付ける")]
    for x, w, nm, sub in parts:
        o.append(RECT(x, yb - 26, w, 52, 6, PAN, INK, 1.3))
        o.append(T(x + w / 2, yb - 8, nm, "middle", 10.5, INK, True, halo=True))
        o.append(T(x + w / 2, yb + 15, sub, "middle", 9, MUT, halo=True))
    # 二次側の線
    o.append(W(176, yb - 26, 176, 62, c=GLD, lw=1.4) + ARR(176, 62, 260, 62, c=GLD, lw=1.4))
    o.append(T(212, 56, "12 V・3.3 V", "middle", 9.5, GLD))
    o.append(W(270, yb - 26, 270, 112, c=TEA, lw=1.3) + ARR(270, 112, 300, 102, c=TEA, lw=1.3))
    o.append(ARR(358, 100, 358, yb - 28, c=PUR, lw=1.3))
    o.append(ARR(440, 100, 440, yb - 28, c=PUR, lw=1.3))
    o.append(W(556, yb - 26, 556, 120, 480, 120, c=TEA, lw=1.3) + ARR(480, 120, 455, 102, c=TEA, lw=1.3))
    o.append(CHIP(364, 128, "②", GRN, 9.5)[0])
    o.append(CHIP(446, 128, "②", GRN, 9.5)[0])
    # 一次側: 商用電源とヒータの道
    ym = 254
    o.append(BOX(14, 206, 86, 62, "商用電源", "100 V・50/60 Hz", ALI, ASOFT, INK, sz=10.5, ssz=9))
    o.append(W(100, 222, 270, 222, 270, yb + 26, c=ALI, lw=1.3))
    o.append(W(176, 222, 176, yb + 26, c=ALI, lw=1.3))
    o.append(W(100, ym, 112, ym, c=ALI, lw=1.6))
    xs = [(112, 80, "温度ヒューズ", ALI), (202, 86, "サーモスタット", ALI), (318, 80, "リレーの接点", PUR), (402, 76, "SSR の出力", PUR), (500, 92, "ヒータ 1 kW", ALI)]
    prev = 112
    for x, w, nm, c in xs:
        if x > prev:
            o.append(W(prev, ym, x, ym, c=ALI, lw=1.6))
        o.append(RECT(x, ym - 14, w, 28, 5, soft(c), c, 1.3))
        o.append(T(x + w / 2, ym + 4, nm, "middle", 9.5, INK, True))
        prev = x + w
    o.append(W(prev, ym, 650, ym, 650, 292, 57, 292, 57, 268, c=ALI, lw=1.6))
    o.append(W(358, yb + 26, 358, ym - 14, c=PUR, lw=1.2, dash="3 3"))
    o.append(W(440, yb + 26, 440, ym - 14, c=PUR, lw=1.2, dash="3 3"))
    o.append(W(546, ym - 14, 546, yb + 26, c=TEA, lw=1.2, dash="2 3"))
    # 守りの番号
    o.append(CHIP(318, 316, "③ 2 つ目のスイッチ", PUR, 9.5)[0])
    o.append(CHIP(112, 316, "④ マイコンに頼らない保護", ALI, 9.5)[0])
    yl = 342
    o.append(T(14, yl, "① マイコンの判定　② リセットの間はプルダウンで切る（既定の状態）　③ SSR が短絡しても切れるリレー　④ 決めた温度で開く・溶ける部品", "start", 9.5, MUT))
    return SVG(700, yl + 10, o, "電気ポットの構成と守りの置き場所（模式図）。利用者が触れる二次側と、商用電源の電位にある一次側を絶縁し、境界をまたぐ部品（絶縁電源・交流の検出・リレー・SSR・サーミスタの取り付け）で絶縁を保つ。ヒータの電流の道には、マイコンが入れ切りするリレーと SSR に加えて、マイコンに頼らない温度ヒューズとサーモスタットを直列に入れる。絶縁の種類と距離は規格で決まる。")
F["e16_pot"] = _f16_pot()

def _f16_dry():
    o = []
    p = Plot(70, 22, 470, 210, (0, 30), (15, 100))
    o.append(p.axes(xl="ヒータを入れてからの時間 [s]", yl="温度 [°C]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[20, 40, 60, 80, 100], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    P, Cb, tau, dt = 1000.0, 400.0, 5.0, 0.01
    # 空: 底の板とサーミスタ（一次遅れ）。1 秒ごとに読み、差が 1 K を超えることが 3 回続いたら切る
    Tp = Ts = 20.0; t = 0.0; on = True; reads = [20.0]; cnt = 0; tdet = None; plate = [(0, 20.0)]; sens = [(0, 20.0)]
    while t < 30 - 1e-9:
        if on:
            Tp += P / Cb * dt
        Ts += (Tp - Ts) / tau * dt
        t += dt
        if abs(t - round(t)) < dt / 2:
            reads.append(Ts)
            cnt = cnt + 1 if reads[-1] - reads[-2] > 1.0 else 0
            if cnt >= 3 and on:
                on = False; tdet = round(t); Tdet = Tp; Sdet = Ts
        plate.append((t, Tp)); sens.append((t, Ts))
    o.append(p.line([(0, 20), (30, 20 + 30 * P / Cb)], c=ALI, lw=1.2, dash="4 4"))
    o.append(T(p.X(25.5), p.Y(20 + 25.5 * P / Cb) - 4, "切らないと", "end", 9.5, ALI, halo=True))
    o.append(p.line([(0, 20), (30, 50)], c=MUT, lw=1.1, dash="2 3"))
    o.append(T(p.X(29.5), p.Y(49.5) - 6, "1 K/s", "end", 9.5, MUT, halo=True))
    for m, c, lab in ((2000, GRN, "水 2 L"), (200, GLD, "水 200 g")):
        r = P / (Cb + 4.18 * m)
        o.append(p.line([(0, 20), (30, 20 + 30 * r)], c=c, lw=2))
        o.append(T(p.X(30) + 6, p.Y(20 + 30 * r) + 4, "%s（%.3f K/s）" % (lab, r) if m == 2000 else "%s（%.2f K/s）" % (lab, r), "start", 9.5, c, True))
    o.append(p.line(plate, c=ALI, lw=2.2))
    o.append(p.line(sens, c=ALI, lw=1.4, dash="5 3"))
    o.append(D(p.X(tdet), p.Y(Tdet), ALI, 4))
    o.append(D(p.X(tdet), p.Y(Sdet), ALI, 3.4))
    o.append(T(p.X(tdet) + 8, p.Y(Tdet) - 8, "%.1f s で気づいて切る（底の板 %.0f °C）" % (tdet, Tdet), "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(30) + 6, p.Y(Tdet) + 4, "空（切った後）", "start", 9.5, ALI, True))
    o.append(T(p.X(9), p.Y(16.5), "空のとき　実線: 底の板　破線: サーミスタの読み（遅れ 5 s）", "start", 9.5, ALI, halo=True))
    return SVG(700, 280, o, "空だきと、水があるときの温度の上がり方（ヒータ 1 kW、本体の熱容量 400 J/K、サーミスタの読みは時定数 5 s で遅れて追いつく。例の値）。水 2 L では 0.114 K/s だが、空では 2.5 K/s で上がる。1 秒ごとの読みの差が 1 K を超えることが 3 回続いたら切ると、空だきには 6.0 s で気づく。水 200 g でも 0.81 K/s で、判定の 1 K/s より遅い。")
F["e16_dry"] = _f16_dry()

# ---- 5 節: クランキングの間の電源 ----
def _f16_crank():
    o = []
    p = Plot(70, 24, 520, 200, (0, 2.5), (0, 15))
    o.append(p.axes(xl="時間 [s]", yl="電圧 [V]", xt=[0, 0.5, 1.0, 1.5, 2.0, 2.5], yt=[0, 3, 6, 9, 12, 15], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    C, V2 = 470e-6, 4.0
    line = [(0, 12.6), (0.5, 12.6), (0.5, 4.2), (1.5, 4.2), (1.6, 14.0), (2.5, 14.0)]
    o.append(p.line(line, c=GLD, lw=2))
    def cap(P1, P2):
        pts = [(0, 12.2), (0.5, 12.2)]
        v = 12.2; t = 0.5; dt = 0.001; reset = None
        while t < 1.5 - 1e-9:
            P = P2 if P2 is not None else P1
            v = math.sqrt(max(v * v - 2 * P * dt / C, 0)); t += dt
            if v <= V2 and reset is None:
                reset = t
            if reset is not None:
                v = max(v, 3.8)
            pts.append((t, v))
        pts += [(1.6, 13.6), (2.5, 13.6)]
        return pts, reset
    a, ra = cap(0.1, None)
    b, rb = cap(0.1, 0.005)
    o.append(RECT(p.X(ra), p.Y(15), p.X(1.5) - p.X(ra), p.h, 0, ASOFT, "none", 0, op=0.55))
    o.append(T((p.X(ra) + p.X(1.5)) / 2, p.Y(14.2), "電源が止まり、リセット", "middle", 9.5, ALI, True, halo=True))
    o.append(p.line([(0, 4.0), (2.5, 4.0)], c=MUT, lw=1.1, dash="6 4"))
    o.append(T(p.X(2.5) - 2, p.Y(4.0) + 13, "4.0 V: 電源が 3.3 V を保てる下限", "end", 9.5, MUT, halo=True))
    o.append(p.line([(0, 9.0), (0.48, 9.0)], c=MUT, lw=1.0, dash="2 3"))
    o.append(T(p.X(0.02), p.Y(9.0) - 5, "9 V で気づく", "start", 9.5, MUT, halo=True))
    o.append(p.line(a, c=ALI, lw=2))
    o.append(p.line(b, c=GRN, lw=2))
    o.append(T(p.X(0.04), p.Y(12.6) - 6, "電源の線（ダイオードの手前）", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.9), p.Y(4.2) + 14, "クランキング 4.2 V・1 s（例の値）", "middle", 9.5, GLD, halo=True))
    o.append(T(p.X(0.82) + 4, p.Y(6.2), "0.1 W のまま: %.2f s で 4.0 V" % (ra - 0.5), "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(0.62), p.Y(11.0) + 16, "気づいて 5 mW に: 1.5 s で 11.3 V", "start", 9.5, GRN, True, halo=True))
    o.append(T(p.X(1.65), p.Y(13.6) + 14, "エンジンがかかると 14 V 前後", "start", 9.5, GLD, halo=True))
    o.append(LEGEND(600, 60, [(GLD, "電源の線")], gap=8))
    o.append(T(600, 80, "保持のコンデンサ", "start", 9.5, INK, True))
    o.append(T(600, 95, "（電源の入力）", "start", 9.5, MUT))
    o.append(LEGEND(600, 115, [(ALI, "0.1 W のまま")], gap=8))
    o.append(LEGEND(600, 133, [(GRN, "5 mW に減らす")], gap=8))
    return SVG(700, 272, o, "弱ったバッテリでクランキングが 1 s 続いたときの、電源の線と保持のコンデンサの電圧（模式的な形と例の値。実際の波形は規格と車両のメーカの要求で確かめる）。コンデンサ 470 µF は 0.1 W のままなら 0.31 s で 4.0 V を割るが、9 V を下回ったことに気づいて 5 mW に減らせば、1 s を越せる。")
F["e16_crank"] = _f16_crank()

# ---- 6 節: 冬の 1 週間のエネルギーの収支 ----
_F16_WEEK = [("晴れ", -8, 1), ("曇り", -8, -2), ("雪", -10, -4), ("雪", -12, -6), ("晴れ", -14, -3), ("曇り", -10, -3), ("晴れ", -9, 0)]
_F16_FAC = {"晴れ": 0.6, "曇り": 0.12, "雪": 0.0}

def _f16_week_sim(dTsun, tau_h, adapt, Ppanel=0.5, Emax_wh=1.6, soc0=0.6, eta=0.8, Pbase=1e-3, Erep=2.7, Thold=5 * 86400.0, dt=60.0):
    """1 分刻み。戻り値: 点の列 [(日, 蓄え Wh, 電池の温度, 気温, 充電中か, 間隔 s, 動いているか)]、止まった時間 [h]、入ったエネルギー [Wh]。"""
    E = soc0 * Emax_wh * 3600; Emax = Emax_wh * 3600; Tb = _F16_WEEK[0][1]
    out = []; down = 0.0; inJ = 0.0
    for k in range(int(7 * 86400 / dt)):
        t = k * dt; d = int(t // 86400); h = (t % 86400) / 3600
        w, tmin, tmax = _F16_WEEK[d]
        Ta = (tmin + tmax) / 2 - (tmax - tmin) / 2 * math.cos(2 * math.pi * (h - 4) / 24)
        irr = _F16_FAC[w] * math.sin(math.pi * (h - 8) / 8) if 8 <= h <= 16 else 0.0
        Tb += (Ta + dTsun * irr - Tb) / (tau_h * 3600) * dt
        chg = Tb >= 0 and Tb <= 45 and irr > 0 and E < Emax
        if chg:
            add = eta * Ppanel * irr * dt; E = min(Emax, E + add); inJ += add
        if adapt:
            pt = E / Thold - Pbase
            Tr = 3600.0 if pt <= 0 else min(3600.0, max(300.0, Erep / pt))
        else:
            Tr = 300.0
        run = E > 0
        if run:
            E = max(0.0, E - (Pbase + Erep / Tr) * dt)
        else:
            down += dt
        out.append((t / 86400, E / 3600, Tb, Ta, chg, Tr, run))
    return out, down / 3600, inJ / 3600

def _f16_week():
    o = []
    A, dA, iA = _f16_week_sim(3.0, 2.0, False)
    B, dB, iB = _f16_week_sim(3.0, 2.0, True)
    Cc, dC, iC = _f16_week_sim(15.0, 4.0, True)
    x0, wd = 70, 600
    dw = wd / 7.0
    for d, (w, lo, hi) in enumerate(_F16_WEEK):
        xc = x0 + d * dw + dw / 2
        o.append(T(xc, 16, "%d 日目 %s" % (d + 1, w), "middle", 10, INK, True))
        o.append(T(xc, 30, "%s〜%s °C" % (str(lo).replace("-", "−"), str(hi).replace("-", "−")), "middle", 9.5, MUT))
    pt = Plot(x0, 42, wd, 110, (0, 7), (-16, 12))
    o.append(pt.axes(yl="温度 [°C]", xt=[], yt=[-15, -10, -5, 0, 5, 10], yfmt=lambda v: ("%g" % v).replace("-", "−")))
    for d in range(1, 7):
        o.append(W(pt.X(d), pt.y, pt.X(d), pt.y + pt.h, c=GRD, lw=1))
    o.append(pt.line([(0, 0), (7, 0)], c=ALI, lw=1.2, dash="6 4"))
    o.append(pt.line([(r[0], r[3]) for r in A[::10]], c=MUT, lw=1.1))
    o.append(pt.line([(r[0], r[2]) for r in A[::10]], c=TEA, lw=1.5, dash="5 3"))
    o.append(pt.line([(r[0], r[2]) for r in Cc[::10]], c=TEA, lw=2))
    o.append(T(pt.X(7) - 4, pt.Y(0) - 5, "0 °C より冷たい間は充電しない", "end", 9.5, ALI, halo=True))
    # 充電した時間の帯
    yc = pt.y + pt.h + 8
    for k, (S, lab, c) in enumerate(((A, "(a)(b) 充電", GLD), (Cc, "(c) 充電", GRN))):
        yy = yc + k * 13
        o.append(T(x0 - 6, yy + 8, lab, "end", 9, c, True))
        o.append(RECT(x0, yy, wd, 9, 1, PAN, LIN, 0.8))
        st = None
        for r in S + [(7, 0, 0, 0, False, 0, True)]:
            if r[4] and st is None:
                st = r[0]
            if not r[4] and st is not None:
                o.append(RECT(pt.X(st), yy, max(1.5, pt.X(r[0]) - pt.X(st)), 9, 0, soft(c), c, 0.8)); st = None
    pe = Plot(x0, yc + 40, wd, 150, (0, 7), (0, 1.7))
    o.append(pe.axes(xl="日", yl="蓄え [Wh]", xt=list(range(8)), yt=[0, 0.4, 0.8, 1.2, 1.6], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    st = None
    for r in A + [(7, 1, 0, 0, False, 0, True)]:
        if not r[6] and st is None:
            st = r[0]
        if r[6] and st is not None:
            o.append(RECT(pe.X(st), pe.y, pe.X(r[0]) - pe.X(st), pe.h, 0, ASOFT, "none", 0, op=0.6)); en = r[0]
            o.append(T((pe.X(st) + pe.X(r[0])) / 2, pe.y + 14, "(a) が止まる %.0f 時間" % dA, "middle", 9.5, ALI, True, halo=True)); st = None
    for S, c in ((A, ALI), (B, GLD), (Cc, GRN)):
        o.append(pe.line([(r[0], r[1]) for r in S[::10]], c=c, lw=2))
    mB = min(r[1] for r in B); mC = min(r[1] for r in Cc)
    o.append(T(pe.X(0.1), pe.Y(1.55), "(a) 日陰・5 分ごと", "start", 9.5, ALI, True, halo=True))
    o.append(T(pe.X(2.6), pe.Y(1.55), "(b) 日陰・蓄えに合わせる（最少 %.2f Wh）" % mB, "start", 9.5, GLD, True, halo=True))
    o.append(T(pe.X(2.6), pe.Y(1.38), "(c) 日なた・断熱・蓄えに合わせる（最少 %.2f Wh）" % mC, "start", 9.5, GRN, True, halo=True))
    o.append(LEGEND(x0, pe.y + pe.h + 44, [(MUT, "気温"), (TEA, "電池の温度（破線は日陰の箱、実線は日なたで断熱）")]))
    return SVG(700, pe.y + pe.h + 54, o, "冬の 1 週間の電池の温度と蓄え（例の値の天気と気温、1 分刻みの計算）。日陰の箱では、電池が 0 °C に届いて充電できたのは 1 日目の 2.1 時間だけで、5 分ごとに送り続ける (a) は 5 日目の夜に止まる。送る間隔を蓄えに合わせる (b) は止まらず、電池を日の当たる側に置いて断熱すると (c)、充電できる時間が延びて余裕が増す。")
F["e16_week"] = _f16_week()

# ---- 7 節: 負荷が取る電流 ----
def _f16_loads():
    o = []
    rows = [("センサ（待機〜測る間）", 1e-7, 1e-3, None, TEA, "08 章"),
            ("抵抗のセンサの分圧", 1.5e-6, 1.5e-4, None, TEA, "09 章"),
            ("閉じたスイッチのプルアップ", 5e-6, 7.5e-5, None, TEA, "07・11 章"),
            ("LED", 1e-3, 2e-2, None, PUR, "12 章"),
            ("リレーのコイル（保持〜吸引）", 1.5e-2, 3e-2, None, PUR, "12 章"),
            ("ソレノイド（数 W〜十数 W）", 0.25, 1.5, None, PUR, "12 章"),
            ("DC モータ（13 章の例）", 0.5, 0.5, 6.0, PUR, "13 章"),
            ("ステッピングモータ", 0.2, 2.0, None, PUR, "13 章"),
            ("サーボモータ（動き始め）", None, None, (0.3, 3.0), PUR, "13 章"),
            ("ヒータ（AC 100 V・80 W〜1 kW）", 0.8, 10.0, None, ALI, "14 章")]
    p = Plot(214, 30, 420, len(rows) * 22, (1e-7, 30), (0, len(rows)), xlog=True)
    for v in [1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 0.1, 1, 10]:
        xx = p.X(v)
        o.append(W(xx, p.y - 4, xx, p.y + p.h, c=GRD, lw=1))
        lab = {1e-7: "0.1 µA", 1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA", 1e-2: "10 mA", 0.1: "100 mA", 1: "1 A", 10: "10 A"}[v]
        o.append(T(xx, p.y + p.h + 14, lab, "middle", 9.5, MUT))
    for v, lab, c in ((0.015, "CR2032", SIG), (0.1, "100 mA", GLD), (0.5, "500 mA", GLD)):
        xx = p.X(v)
        o.append(W(xx, p.y - 6, xx, p.y + p.h, c=c, lw=1.2, dash="4 3"))
    o.append(T(p.X(0.015), p.y - 10, "CR2032", "middle", 9, SIG, True, halo=True))
    o.append(T(p.X(0.1), p.y - 21, "100 mA", "middle", 9, GLD, True, halo=True))
    o.append(T(p.X(0.5), p.y - 10, "500 mA", "middle", 9, GLD, True, halo=True))
    for i, (nm, lo, hi, pk, c, ch) in enumerate(rows):
        y = p.y + i * 22 + 4
        o.append(T(p.x - 8, y + 11, nm, "end", 10, INK))
        o.append(T(p.x + p.w + 8, y + 11, ch, "start", 9.5, MUT))
        if lo is not None:
            x1, x2 = p.X(lo), p.X(hi)
            o.append(RECT(x1, y + 3, max(x2 - x1, 5), 12, 3, soft(c), c, 1.3))
        if pk is not None:
            if isinstance(pk, tuple):
                o.append(RECT(p.X(pk[0]), y + 6, p.X(pk[1]) - p.X(pk[0]), 6, 2, "none", c, 1.3, dash="3 2"))
            else:
                o.append(W(p.X(hi) + 5, y + 9, p.X(pk), y + 9, c=c, lw=1.3, dash="3 2"))
                o.append(D(p.X(pk), y + 9, ALI, 4))
                o.append(T(p.X(pk), y + 1, "起動 %g A" % pk, "middle", 9, ALI, True, halo=True))
    yl = p.y + p.h + 34
    o.append(T(p.x - 160, yl, "太い帯: ふつうに流れる範囲（代表値）　破線: 回し始め・動き始めに流れる電流", "start", 9.5, MUT))
    o.append(T(p.x - 160, yl + 16, "縦の破線: CR2032 が短い間に流せる十数 mA（03 章 3 節）、USB の設定の前の 100 mA、USB 2.0 の 500 mA（02 章 3 節）", "start", 9.5, MUT))
    return SVG(700, yl + 26, o, "負荷が電源から取る電流の大きさ（代表値と、前の章の例の値。横軸は対数目盛）。センサとスイッチは mA 以下、LED も数十 mA 以下だが、リレーからヒータまでは数十 mA〜A で、モータは回し始めにその数倍〜十数倍が流れる。縦の破線は、電源の側の上限の例。")
F["e16_loads"] = _f16_loads()

# ---- 8 節: 段と章の対応 ----
def _f16_tools():
    o = []
    use = {1: [1, 2, 6], 2: [2, 3], 3: [2, 3], 4: [3, 6], 5: [3, 6], 6: [3, 6], 7: [2, 7], 8: [4], 9: [4], 10: [4, 6],
           11: [4], 12: [5], 13: [5, 6], 14: [5, 6], 15: [6], 16: [1, 2, 3, 4, 5, 6, 7]}
    xl, cw, y0, rh = 150, 32, 40, 26
    for n in range(1, 17):
        o.append(T(xl + (n - 0.5) * cw, y0 - 10, "%02d" % n, "middle", 10, INK, True, mono=True))
    for j, (nm, c) in enumerate(_F16_STEPS):
        y = y0 + j * rh
        o.append(T(xl - 10, y + rh / 2 + 4, "%d. %s" % (j + 1, nm), "end", 10.5, c, True))
        o.append(W(xl, y + rh, xl + 16 * cw, y + rh, c=GRD, lw=1))
        for n in range(1, 17):
            if (j + 1) in use[n]:
                o.append(D(xl + (n - 0.5) * cw, y + rh / 2, c, 6))
    for n in range(0, 17):
        o.append(W(xl + n * cw, y0 - 4, xl + n * cw, y0 + 7 * rh, c=GRD, lw=1))
    yb = y0 + 7 * rh + 18
    o.append(T(xl, yb, "● その段で使う道具がある章（8 節の表の「段」の列と同じ）", "start", 9.5, MUT))
    return SVG(700, yb + 10, o, "設計の手順の段ごとに、道具を扱った章。電力の予算と電源の構成は 01〜07 章、測り方は 08〜11 章、駆動は 12〜14 章が受け持ち、異常への備えは多くの章にまたがって、15 章でまとめた。")
F["e16_tools"] = _f16_tools()
