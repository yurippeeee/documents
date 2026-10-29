# -*- coding: utf-8 -*-
# 24 章 1 つの機器の通信を設計する の図

_F24_DAY = 86400.0
_F24_YEAR = 86400.0 * 365

def _f24_life(cap_mAh, I):
    """容量 [mAh] と平均電流 [A] から寿命 [年]。"""
    return cap_mAh * 1e-3 * 3600 / I / _F24_YEAR

# B の予算（工夫した接続の時間 t [s] から平均電流 [A]）: 眠り 5 µA、測定 40 µC × 144、接続 100 mA × t × 24、
# メッセージ 2.4 mC × 24、時刻合わせ 2.4 mC × 2
def _f24_IB(t):
    return 5e-6 + (40e-6 * 144 + 0.1 * t * 24 + 2.4e-3 * 24 + 2.4e-3 * 2) / _F24_DAY


def _f24_box(o, x, y, w, h, title, lines, c, fill, dash=None, tsz=11, lsz=9, lh=12.5):
    """角の丸い箱に、太字の題と、手で区切った行を中央にそろえて置く。"""
    o.append(RECT(x, y, w, h, 8, fill, c, 1.4, dash))
    tot = tsz * 1.2 + len(lines) * lh
    yy = y + h / 2 - tot / 2 + tsz * 0.95
    o.append(T(x + w / 2, yy, title, "middle", tsz, INK, True))
    for i, l in enumerate(lines):
        o.append(T(x + w / 2, yy + tsz * 0.35 + lsz * 1.05 + i * lh, l, "middle", lsz, MUT))

# ---- 1 節: 要求を時間の軸に ----
def _f24_req():
    o = []
    bx = [(16, 110, "温湿度センサ", "電池で動く", SIG),
          (190, 150, "家の AP（案 B）", "ゲートウェイ（案 A）", GLD),
          (410, 110, "クラウド", "記録を蓄える", GRN),
          (590, 94, "スマートフォン", "アプリ", PUR)]
    y0, bh = 26, 48
    for x, w, t, sub, c in bx:
        o.append(BOX(x, y0, w, bh, t, sub, c, soft(c), INK, sz=11, ssz=9.5))
    ym = y0 + bh / 2
    o.append(ARR(128, ym, 188, ym, c=SIG, lw=1.6))
    o.append(T(158, ym - 7, "1 時間ごと", "middle", 9.5, SIG, True))
    o.append(ARR(342, ym, 408, ym, c=GLD, lw=1.6))
    o.append(DARR(522, ym, 588, ym, c=PUR, lw=1.5))
    o.append(T(555, ym - 7, "見る・設定", "middle", 9.5, PUR, True))
    o.append(W(71, y0 + bh + 2, 71, 96, 637, 96, 637, y0 + bh + 8, c=PUR, lw=1.3, dash="4 3"))
    o.append(ARR(637, 90, 637, y0 + bh + 2, c=PUR, lw=1.3))
    o.append(T(354, 112, "最初の設定は、スマートフォンから BLE で（6 節）", "middle", 10, PUR))
    # 時間の軸
    o.append(T(16, 144, "R1・R3・R4 を時間の軸の上に（2 時間分）", "start", 11, INK, True))
    x0, x1 = 150, 680
    X = lambda m: x0 + m * (x1 - x0) / 120.0
    ym1, ys, yd, yax = 176, 210, 268, 318
    o.append(T(140, ym1 + 4, "測る（R1）", "end", 10, SIG, True))
    o.append(T(140, ys + 4, "送る", "end", 10, SIG, True))
    o.append(T(140, yd + 4, "下り（R4）", "end", 10, PUR, True))
    for k in range(12):
        m = 10 * k
        o.append(D(X(m), ym1, SIG, 4))
        o.append(T(X(m), ym1 - 9, str(k % 6 + 1), "middle", 9, MUT))
    for m in (50, 110):
        o.append(RECT(X(m) - 34, ys - 11, 68, 22, 5, SSOFT, SIG, 1.3))
        o.append(T(X(m), ys + 4, "6 件を送る", "middle", 10, SIG, True))
        o.append(W(X(m), ym1 + 5, X(m), ys - 12, c=SIG, lw=1, dash="2 2"))
    o.append(DIM(X(0), ys + 24, X(50), ys + 24, None, c=SIG))
    o.append(T(X(25), ys + 40, "最初の件は 50 分待つ（R3: 1 時間以内）", "middle", 9.5, SIG))
    # 下り: 送った直後に変えた設定
    o.append(PL([(X(52), yd - 7), (X(52) + 6, yd), (X(52), yd + 7), (X(52) - 6, yd)], c=PUR, lw=1.2, fill=PSOFT))
    o.append(T(X(52) + 10, yd - 10, "送った直後に設定を変えた", "start", 9.5, PUR))
    o.append(ARR(X(52) + 8, yd, X(110) - 3, yd, c=PUR, lw=1.4, dash="5 3"))
    o.append(T(X(110), yd - 10, "次の接続で届く", "end", 9.5, PUR, True))
    o.append(DIM(X(50), yd + 20, X(110), yd + 20, None, c=PUR))
    o.append(T(X(80), yd + 35, "最大 1 時間", "middle", 9.5, PUR))
    # 目盛
    o.append(W(x0, yax, x1, yax, c=MUT, lw=1.1))
    for m in range(0, 121, 10):
        o.append(W(X(m), yax, X(m), yax + 4, c=MUT, lw=1))
        o.append(T(X(m), yax + 16, str(m), "middle", 9, MUT))
    o.append(T(x0 - 10, yax + 16, "分", "end", 9.5, MUT))
    return SVG(700, yax + 26, o, "例の機器の要求を時間の軸に並べたもの。10 分ごとに測り（R1）、6 件たまったら送る。最初に測った件は 50 分待ってから送られる（R3）。送った直後に変えた設定は、次の接続まで最大 1 時間待つ（R4）。最初の設定だけは、スマートフォンから BLE で直接渡す。")
F["e24_req"] = _f24_req()

# ---- 2 節: 方式を比べる ----
def _f24_methods():
    o = []
    rows = [("A: BLE + ゲートウェイ（送るときだけ）", 2.05, SIG, "○", "△"),
            ("BLE（接続を保つ。間隔 4 s）", 3.52, SIG, "○", "△"),
            ("LoRaWAN（クラス A・SF7）", 3.3, GRN, "×", "△"),
            ("LTE-M（PSM）", 23.0, GRN, "○", "×"),
            ("B: Wi-Fi（送るときだけ・6 件ずつ）", 50.7, SIG, "○", "○"),
            ("Wi-Fi（つなぎ続ける・DTIM 周期 10）", 286.0, SIG, "○", "○")]
    x0, x1, lo, hi = 250, 505, 1.0, 400.0
    X = lambda v: x0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (x1 - x0)
    y0, rh = 46, 30
    o.append(T((x0 + x1) / 2, 18, "1 時間ごとに送るときの平均電流（対数目盛）", "middle", 10.5, INK, True))
    o.append(T(585, 18, "R7 更新", "middle", 10, INK, True))
    o.append(T(648, 18, "R8 設備", "middle", 10, INK, True))
    yb = y0 + len(rows) * rh
    for v in (1, 3, 10, 30, 100, 300):
        o.append(W(X(v), y0 - 6, X(v), yb, c=GRD, lw=1))
        o.append(T(X(v), yb + 14, "%g µA" % v, "middle", 9, MUT))
    for v, lab, c in ((5.02, "CR2032 で 5 年の上限 5.02 µA", ALI), (45.7, "2000 mAh で 5 年の上限 45.7 µA", ALI)):
        o.append(W(X(v), y0 - 10, X(v), yb + 2, c=c, lw=1.4, dash="5 3"))
    o.append(T(X(5.02) + 4, y0 - 12, "CR2032 で 5 年の上限 5.02 µA", "start", 9, ALI))
    o.append(T(X(45.7) - 4, yb + 28, "2000 mAh で 5 年の上限 45.7 µA", "end", 9, ALI))
    for i, (name, v, c, r7, r8) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(x0 - 8, y + 15, name, "end", 10, INK, name.startswith(("A:", "B:"))))
        o.append(RECT(x0, y + 4, X(v) - x0, rh - 10, 3, soft(c), c, 1.3))
        o.append(T(X(v) + 5, y + 16, "%g µA" % v, "start", 9.5, c, True, halo=True))
        for xx, mk in ((585, r7), (648, r8)):
            cc = GRN if mk == "○" else (GLD if mk == "△" else ALI)
            o.append(T(xx, y + 16, mk, "middle", 12, cc, True))
    o.append(W(x0, yb, x1, yb, c=MUT, lw=1.1))
    o.append(T(16, yb + 48, "R7: 500 KB を数分以内に取り込めるか（22 章 7 節）。R8: ○ 家の AP だけ、△ ゲートウェイを足す、× 月々の回線の契約が要る。", "start", 9.5, MUT))
    return SVG(700, yb + 58, o, "4 つの方式を、1 時間ごとに送るときの平均電流（各章の例の値）と、更新・設備の要求で比べたもの。A（BLE）は CR2032 でも 5 年の上限を下回る。B（Wi-Fi）は 2000 mAh の上限 45.7 µA をわずかに超える。LoRaWAN は更新を、LTE-M は費用の要求を満たさない。")
F["e24_methods"] = _f24_methods()

# ---- 3 節: 接続の各段の時間 ----
_F24_STAGES = [("起動と Wi-Fi の回路の準備", "この章の代表値", 0.3, 0.3),
               ("スキャン", "前回のチャネルだけ（09 章 2 節）", 0.346, 0.042),
               ("PMK の計算", "保存した PMK を使う（09 章 3 節）", 0.5, 0.0),
               ("認証・アソシエーション・4 ウェイ", "この章の代表値", 0.05, 0.05),
               ("DHCP", "REQUEST から・確認は最初だけ（08 章 3 節）", 5.51, 0.005),
               ("ARP と DNS", "08 章 7 節の値", 0.035, 0.035),
               ("TCP と TLS 1.3", "セッションの再開（12 章 6 節）", 1.963, 0.60),
               ("MQTT の接続", "往復 1 回", 0.1, 0.1)]

def _f24_conn():
    o = []
    x0, x1, lo, hi = 262, 600, 0.001, 10.0
    X = lambda v: x0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (x1 - x0)
    y0, rh = 40, 42
    o.append(RECT(x0, 12, 12, 10, 2, MSOFT, MUT, 1.1))
    o.append(T(x0 + 17, 21, "工夫しないとき", "start", 10, MUT))
    o.append(RECT(x0 + 130, 12, 12, 10, 2, SSOFT, SIG, 1.1))
    o.append(T(x0 + 147, 21, "工夫したとき", "start", 10, SIG))
    yb = y0 + len(_F24_STAGES) * rh
    for v, lab in ((0.001, "1 ms"), (0.01, "10 ms"), (0.1, "0.1 s"), (1, "1 s"), (10, "10 s")):
        o.append(W(X(v), y0 - 4, X(v), yb, c=GRD, lw=1))
        o.append(T(X(v), yb + 14, lab, "middle", 9, MUT))
    for i, (name, tool, tb, ta) in enumerate(_F24_STAGES):
        y = y0 + i * rh
        o.append(T(x0 - 10, y + 15, name, "end", 10.5, INK, True))
        o.append(T(x0 - 10, y + 30, tool, "end", 9, SIG if tool != "この章の代表値" else MUT))
        o.append(RECT(x0, y + 4, X(tb) - x0, 13, 2, MSOFT, MUT, 1.1))
        o.append(T(X(tb) + 5, y + 15, ("%g s" % tb), "start", 9, MUT))
        if ta > 0:
            o.append(RECT(x0, y + 20, X(ta) - x0, 13, 2, SSOFT, SIG, 1.2))
            o.append(T(X(ta) + 5, y + 31, ("%g s" % ta), "start", 9, SIG, True))
        else:
            o.append(T(x0 + 4, y + 31, "0（計算しない）", "start", 9, SIG, True))
    o.append(W(x0, yb, x1, yb, c=MUT, lw=1.1))
    o.append(T(16, yb + 38, "合計（× 100 mA）: 工夫しないとき 8.80 s（880 mC）、工夫したとき 1.13 s（113 mC）。いちばん効くのは DHCP の重複の確認と TLS。", "start", 10, INK))
    return SVG(700, yb + 48, o, "Wi-Fi の接続 1 回の各段の時間（対数目盛）。灰色は工夫しないとき、青は前の章の道具で縮めたとき。重複の確認（5.5 s）と TLS の証明書の確認（1.96 s）が大きく、どちらも縮められる。起動と回路の準備の 0.3 s は、どの道具でも縮まない。")
F["e24_conn"] = _f24_conn()

# ---- 3 節: 予算の積み上げ ----
_F24_SEGC = [("眠り", MUT), ("測定", TEA), ("接続", SIG), ("メッセージ", PUR), ("時刻合わせ", GLD), ("速いアドバタイズ", GRN)]

def _f24_stack(o, x0, y, h, scale, vals, minlab=40):
    x = x0
    for k, v in enumerate(vals):
        if v <= 0:
            continue
        nm, c = _F24_SEGC[k]
        w = v * scale
        o.append(RECT(x, y, max(w, 1.2), h, 2, soft(c), c, 1.1))
        lab = "%s %s" % (nm, ("%.2f" % v) if v < 10 else ("%.1f" % v))
        if w > tw(lab, 9.5) + 8:
            o.append(T(x + w / 2, y + h / 2 + 3.5, lab, "middle", 9.5, c, True))
        x += w
    return x

def _f24_budget():
    o = []
    x0 = 190
    # B
    o.append(T(16, 18, "案 B（Wi-Fi・2000 mAh）", "start", 11, INK, True))
    sB = 440 / 55.0
    yB = 30
    o.append(W(x0, yB - 4, x0, yB + 76, c=MUT, lw=1.1))
    for v in range(0, 56, 10):
        o.append(W(x0 + v * sB, yB + 76, x0 + v * sB, yB + 80, c=MUT, lw=1))
        o.append(T(x0 + v * sB, yB + 92, "%d" % v, "middle", 9, MUT))
    o.append(T(x0 + 55 * sB, yB + 92, "µA", "start", 9, MUT))
    bars = [("各章の値のまま", [5.0, 0.0667, 41.67, 4.0, 0.0556, 0], "50.8 µA → 4.5 年"),
            ("接続を工夫し、まとめて送る", [5.0, 0.0667, 31.44, 0.667, 0.0556, 0], "37.2 µA → 6.1 年")]
    for i, (lab, vals, res) in enumerate(bars):
        y = yB + 6 + i * 36
        o.append(T(x0 - 8, y + 16, lab, "end", 10, INK))
        xe = _f24_stack(o, x0, y, 24, sB, vals)
        o.append(T(xe + 6, y + 16, res, "start", 9.5, INK, True, halo=True))
    o.append(W(x0 + 45.66 * sB, yB - 4, x0 + 45.66 * sB, yB + 76, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(x0 + 45.66 * sB - 4, yB + 108, "5 年の上限 45.7 µA", "end", 9.5, ALI))
    # A
    yA = 168
    o.append(T(16, yA - 12, "案 A（BLE・CR2032）", "start", 11, INK, True))
    sA = 440 / 6.0
    o.append(W(x0, yA - 4, x0, yA + 36, c=MUT, lw=1.1))
    for v in range(0, 7):
        o.append(W(x0 + v * sA, yA + 36, x0 + v * sA, yA + 40, c=MUT, lw=1))
        o.append(T(x0 + v * sA, yA + 52, "%d" % v, "middle", 9, MUT))
    o.append(T(x0 + 6 * sA + 6, yA + 52, "µA", "start", 9, MUT))
    o.append(T(x0 - 8, yA + 22, "送るときだけ接続", "end", 10, INK))
    xe = _f24_stack(o, x0, yA + 6, 24, sA, [2.0, 0.0667, 0.0487, 0, 0, 0.047])
    o.append(T(xe + 6, yA + 22, "2.16 µA → 11.6 年", "start", 9.5, INK, True))
    o.append(W(x0 + 5.02 * sA, yA - 4, x0 + 5.02 * sA, yA + 36, c=ALI, lw=1.4, dash="5 3"))
    o.append(T(x0 + 5.02 * sA - 4, yA + 68, "5 年の上限 5.02 µA", "end", 9.5, ALI))
    # 凡例と注
    o.append(LEGEND(16, yA + 92, [(c, nm) for nm, c in _F24_SEGC]))
    o.append(T(16, yA + 112, "横軸の目盛は上と下で違う（上は 0〜55 µA、下は 0〜6 µA）。B は接続の項が、A は眠りの項が大半を占める。", "start", 9.5, MUT))
    return SVG(700, yA + 122, o, "3 つの電力の予算を、動作ごとの平均電流の積み上げで比べたもの。B は各章の値のままでは 5 年の上限を超え、接続の各段を工夫し 6 件を 1 つのメッセージにまとめて上限を下回る。A は眠りの電流がほとんどを占め、CR2032 の上限の半分にも届かない。")
F["e24_budget"] = _f24_budget()

# ---- 4 節: ファームウェアの構造 ----
def _f24_fw():
    o = []
    c1, w1 = 16, 150
    c2, w2 = 226, 250
    c3, w3 = 516, 168
    _f24_box(o, c1, 14, w1, 44, "RTC", ["眠る間も時刻を数える"], TEA, TSOFT)
    _f24_box(o, c1, 92, w1, 64, "測定タスク", ["10 分ごとに測り、", "1 件を作る"], SIG, SSOFT)
    _f24_box(o, c1, 196, w1, 64, "送信待ちの列", ["フラッシュ 36 KB", "7 日分（15 章 3 節）"], MUT, PAN)
    _f24_box(o, c1, 296, w1, 84, "保てる RAM", ["失敗の回数", "次に試す時刻", "TLS のチケット", "ログとカウンタ"], TEA, PAN, dash="4 3")
    o.append(RECT(c2, 92, w2, 168, 8, SSOFT, SIG, 1.6))
    o.append(T(c2 + w2 / 2, 110, "通信タスク（接続の持ち主）", "middle", 11, SIG, True))
    items = [("状態機械: 参加の手順（08 章 7 節）", "＋ 再接続の方針（15 章 2 節）"),
             ("MQTT: 確認待ち 4 つ・受信 512 バイト", "（13 章 6 節）"),
             ("時刻合わせ（15 章 1 節）", "シャドウの差分の反映（15 章 6 節）")]
    for k, (a, b) in enumerate(items):
        yy = 122 + k * 44
        o.append(RECT(c2 + 10, yy, w2 - 20, 38, 5, PAN, LIN, 1))
        o.append(T(c2 + w2 / 2, yy + 16, a, "middle", 9.5, INK))
        o.append(T(c2 + w2 / 2, yy + 30, b, "middle", 9.5, MUT))
    _f24_box(o, c2, 296, 119, 84, "TCP/IP", ["tcpip スレッド", "pbuf 18.0 KB", "ヒープ 16 KB"], GRN, GSOFT)
    _f24_box(o, c2 + 131, 296, 119, 84, "TLS", ["送受信のバッファ", "22.9 KB", "（12 章 6 節）"], TEA, TSOFT)
    _f24_box(o, c2, 400, w2, 30, "Wi-Fi のドライバ", [], SIG, PAN, tsz=10.5)
    _f24_box(o, c3, 92, w3, 64, "設定タスク", ["設定のときだけ動く", "GATT のサーバ（18 章 6 節）"], PUR, PSOFT)
    _f24_box(o, c3, 196, w3, 44, "BLE のスタック", [], PUR, PAN, tsz=10.5)
    _f24_box(o, c3, 296, w3, 84, "監視タスク", ["全タスクのチェックインが", "そろえば知らせる", "（05 章 6 節）"], ALI, ASOFT)
    _f24_box(o, c3, 400, w3, 30, "ウォッチドッグタイマ", [], ALI, PAN, tsz=10.5)
    xm = c1 + w1 / 2
    o.append(ARR(xm, 58, xm, 90, c=TEA, lw=1.5))
    o.append(T(xm + 6, 78, "起こす", "start", 9.5, TEA))
    o.append(ARR(xm, 156, xm, 194, c=SIG, lw=1.5))
    o.append(T(xm + 6, 179, "1 件を書く", "start", 9.5, SIG))
    gm = (c1 + w1 + c2) / 2
    o.append(ARR(c1 + w1 + 2, 124, c2 - 2, 124, c=SIG, lw=1.5))
    o.append(T(gm, 117, "依頼", "middle", 9.5, SIG, True))
    o.append(DARR(c1 + w1 + 2, 228, c2 - 2, 228, c=MUT, lw=1.4))
    o.append(T(gm, 221, "読む", "middle", 9.5, MUT, True))
    o.append(T(gm, 245, "確認済み", "middle", 9, MUT))
    o.append(ARR(c2 + 60, 262, c2 + 60, 294, c=GRN, lw=1.5))
    o.append(ARR(c2 + 190, 262, c2 + 190, 294, c=TEA, lw=1.5))
    o.append(ARR(c2 + 60, 382, c2 + 60, 398, c=SIG, lw=1.5))
    o.append(ARR(c3 + w3 / 2, 158, c3 + w3 / 2, 194, c=PUR, lw=1.5))
    o.append(ARR(c3 + w3 / 2, 382, c3 + w3 / 2, 398, c=ALI, lw=1.5))
    return SVG(700, 440, o, "案 B のファームウェアの部品の配置。測定タスクは RTC に起こされて 1 件をフラッシュの列に書き、送る時刻なら通信タスクに頼む。通信タスクは接続の持ち主で、列の古い件から送る。設定タスク（BLE）は設定のときだけ動く。監視タスクは全タスクが進んでいるときだけウォッチドッグタイマに知らせる。眠る間に消えては困る小さな状態は、保てる RAM に置く。")
F["e24_fw"] = _f24_fw()

# ---- 5 節: 起きてから眠るまで ----
def _f24_flow():
    lanes = [("機器", SIG), ("AP", GLD), ("ルータ（DHCP・DNS）", GLD), ("クラウド", GRN)]
    msgs = [("note", 0, "RTC の時刻で起き、測る", {"c": SIG}),
            (0, 1, "プローブ要求（前回のチャネル）", {"c": SIG}),
            (1, 0, "プローブ応答", {"c": GLD}),
            (0, 1, "認証・アソシエーション", {"c": SIG, "sub": "4 ウェイ（保存した PMK で）"}),
            ("span", 3, 3, "0.39 s\n起動を含む", {"c": SIG}),
            (0, 2, "DHCP REQUEST（前のアドレス）", {"c": SIG}),
            (2, 0, "DHCP ACK", {"c": GLD}),
            (0, 2, "ARP・DNS の質問", {"c": SIG}),
            (2, 0, "答え", {"c": GLD}),
            ("span", 3, 4, "0.04 s", {"c": GLD}),
            (0, 3, "TCP の接続", {"c": GRN}),
            (0, 3, "ClientHello（チケット）", {"c": TEA}),
            (3, 0, "ServerHello … Finished", {"c": TEA}),
            ("span", 3, 3, "0.6 s", {"c": TEA}),
            (0, 3, "CONNECT", {"c": PUR}),
            (3, 0, "CONNACK", {"c": PUR}),
            (0, 3, "PUBLISH（たまった件・QoS 1）", {"c": PUR}),
            (3, 0, "PUBACK", {"c": PUR}),
            (3, 0, "シャドウの差分（desired）", {"c": GRN}),
            (0, 3, "reported", {"c": GRN}),
            (0, 3, "DISCONNECT", {"c": PUR}),
            ("note", 0, "Wi-Fi を止め、次の起床を\nRTC に設定して眠る", {"c": SIG})]
    return SEQFIG(lanes, msgs, "送る時刻に起きてから眠るまで（案 B、3 節の工夫した接続）。右の括弧は各段の時間の目安（3 節の表の値）。測定値を送った後に、シャドウの差分を受け取って設定を反映する。新しいファームウェアがあれば、この接続のまま更新を始める（6 節）。", w=700, dy=30)
F["e24_flow"] = _f24_flow()

# ---- 5 節: 失敗の費用と待ち方 ----
def _f24_fail():
    o = []
    groups = [("AP が見つからない（1 回 69 mC）", 0.0688),
              ("DNS が答えない（1 回 0.84 C）", 0.8402),
              ("サーバに届かない（1 回 1.04 C）", 1.0432)]
    ways = [("毎時そのまま試す", 24, ALI), ("上限 8 時間で延ばす", 3, GLD), ("上限 24 時間で延ばす", 1, GRN)]
    x0, x1, lo, hi = 200, 600, 0.5, 500.0
    X = lambda v: x0 + (math.log10(v) - math.log10(lo)) / (math.log10(hi) - math.log10(lo)) * (x1 - x0)
    y = 20
    rows_y = []
    for gname, q in groups:
        o.append(T(16, y + 10, gname, "start", 10.5, INK, True))
        y += 18
        for wname, n, c in ways:
            I = q * n / _F24_DAY * 1e6
            o.append(T(x0 - 8, y + 12, wname, "end", 9.5, MUT))
            o.append(RECT(x0, y + 2, X(I) - x0, 13, 2, soft(c), c, 1.2))
            o.append(T(X(I) + 5, y + 13, "%.3g µA" % I, "start", 9.5, c, True, halo=True))
            y += 18
        y += 10
    yb = y
    for v in (1, 10, 100):
        o.append(W(X(v), 22, X(v), yb, c=GRD, lw=1))
        o.append(T(X(v), yb + 14, "%g µA" % v, "middle", 9, MUT))
    o.append(W(X(37.2), 22, X(37.2), yb, c=SIG, lw=1.4, dash="5 3"))
    o.append(T(X(37.2) + 4, yb + 28, "3 節の予算の全体 37.2 µA", "start", 9.5, SIG, True))
    o.append(W(x0, yb, x1, yb, c=MUT, lw=1.1))
    o.append(T(16, yb + 46, "止まっている間の平均電流の上乗せ（対数目盛）。上限 8 時間なら 1 日 3 回、上限 24 時間なら 1 日 1 回試す。", "start", 9.5, MUT))
    return SVG(700, yb + 56, o, "一時的な失敗が続く間、試すたびに失う電荷と、次に試すまでの待ち方による平均電流の上乗せ。失敗に気づくまでの時間（期限）が長い段ほど 1 回の電荷が大きい。毎時そのまま試すと、DNS やサーバの失敗では予算全体の 6〜8 倍になる。待ちを延ばせば上乗せは小さくなるが、直ってから次に試すまでの遅れが延びる。")
F["e24_fail"] = _f24_fail()

# ---- 6 節: 製品の一生 ----
def _f24_life_fig():
    o = []
    top = [(16, 150, "工場", ["デバイス ID と資格情報", "（15 章 5 節）", "トラストアンカー", "（12 章 4 節）"], MUT),
           (196, 150, "最初の設定", ["BLE で SSID と", "パスフレーズを渡す", "（09 章 6 節・18 章 6 節）", "OOB でペアリング（20 章）"], PUR),
           (376, 150, "毎時の報告", ["起きて測り、1 時間ごとに", "つないで送る", "（3〜5 節）"], SIG),
           (556, 128, "手放す", ["設定と鍵を消す", "サーバの側で", "資格情報を無効にする"], ALI)]
    yt, ht = 24, 100
    for x, w, t, lines, c in top:
        _f24_box(o, x, yt, w, ht, t, lines, c, soft(c), tsz=11.5)
    for xa, xb in ((166, 196), (346, 376), (526, 556)):
        o.append(ARR(xa + 2, yt + ht / 2, xb - 2, yt + ht / 2, c=MUT, lw=1.6))
    low = [(196, 150, "設定の変更", ["シャドウの差分を", "次の接続で受け取る", "（15 章 6 節。1 時間以内）"], PUR),
           (376, 150, "更新", ["22 章の手順", "500 KB で 8.8 s・0.88 C", "（22 章 7 節）"], GRN),
           (556, 128, "資格情報の更新", ["有効期間の半分で", "（15 章 5 節）", "正しい時刻が要る"], TEA)]
    yl, hl = 184, 84
    for x, w, t, lines, c in low:
        _f24_box(o, x, yl, w, hl, t, lines, c, soft(c))
        o.append(DARR(451, yt + ht + 3, x + w / 2, yl - 3, c=c, lw=1.4))
    o.append(T(16, yl + 30, "どの出来事も、", "start", 10, MUT))
    o.append(T(16, yl + 46, "送る時刻の接続の中で", "start", 10, MUT))
    o.append(T(16, yl + 62, "行う（別に起きない）", "start", 10, MUT))
    return SVG(700, yl + hl + 12, o, "機器の一生の出来事と、そこで使う道具。工場で入れた ID と資格情報で、最初の設定の後から毎時の報告が始まる。設定の変更・更新・資格情報の更新は、どれも 1 時間ごとの接続の中で行う。手放すときは、機器の設定と鍵を消し、サーバの側でも資格情報を受け付けないようにする。")
F["e24_life"] = _f24_life_fig()

# ---- 6 節: 接続の時間と寿命 ----
def _f24_metrics():
    o = []
    p = Plot(80, 20, 580, 230, (0.5, 3.0), (0, 12))
    o.append(p.axes(xl="接続 1 回の時間の平均 [s]（100 mA）", yl="電池寿命 [年]（2000 mAh）", xt=[0.5, 1.0, 1.5, 2.0, 2.5, 3.0], yt=[0, 2, 4, 6, 8, 10, 12],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    pts = [(0.5 + k * 0.025, _f24_life(2000, _f24_IB(0.5 + k * 0.025))) for k in range(0, 101)]
    o.append(p.line([(0.5, 5), (3.0, 5)], c=ALI, lw=1.3, dash="6 4"))
    o.append(T(p.X(3.0) - 4, p.Y(5) - 6, "R5: 5 年", "end", 10, ALI, True))
    o.append(p.line(pts, c=SIG, lw=2.2))
    tstar = 1.4354
    o.append(W(p.X(tstar), p.Y(0), p.X(tstar), p.Y(5), c=ALI, lw=1, dash="3 3"))
    o.append(T(p.X(tstar) + 4, p.Y(0.6), "1.44 s を超えると 5 年に届かない", "start", 9.5, ALI))
    marks = [(0.742, "暗号エンジン + 再開", None),
             (1.132, "この章の設計 1.13 s", None),
             (1.632, "PMK を毎回計算", (470, 92)),
             (2.495, "TLS を毎回最初から", (470, 112))]
    for t, lab, lead in marks:
        L = _f24_life(2000, _f24_IB(t))
        c = SIG if t == 1.132 else MUT
        o.append(D(p.X(t), p.Y(L), c, 4.2))
        txt = "%s（%.1f 年）" % (lab, L)
        if lead:
            o.append(W(p.X(t), p.Y(L) - 4, lead[0] - 4, lead[1] - 4, c=FNT, lw=1))
            o.append(T(lead[0], lead[1], txt, "start", 9.5, c, False, halo=True))
        else:
            o.append(T(p.X(t) + 8, p.Y(L) - 8, txt, "start", 9.5, c, t == 1.132, halo=True))
    return SVG(700, 300, o, "接続 1 回の時間の平均から見積もった電池寿命（案 B の予算。接続のほかの項は 3 節の値のまま）。機器が報告する接続の時間をこの式に入れれば、機器ごとの残りの寿命を見積もれる。1.44 s を超えた機器は、R5 の 5 年に届かない。")
F["e24_metrics"] = _f24_metrics()

# ---- 7 節: 章と節の対応 ----
_F24_MAP = [("01 全体像", [1, 3]), ("02 UART", []), ("03 フレーミングと誤り検出", [1]), ("04 割り込み・DMA", [4]),
            ("05 状態機械とタイムアウト", [4, 5]), ("06 無線モジュール", [4]), ("07 階層とカプセル化", [3]),
            ("08 DHCP・DNS・NAT", [3, 5]), ("09 Wi-Fi", [2, 3, 6]), ("10 TCP", [3, 5]), ("11 ソケットと lwIP", [4, 5]),
            ("12 TLS", [3, 5, 6]), ("13 MQTT", [3, 5]), ("14 HTTP と CoAP", [6]), ("15 つなぎ続ける", [1, 3, 4, 5, 6]),
            ("16 BLE の全体像", [2, 6]), ("17 アドバタイズ", [3, 6]), ("18 接続と GATT", [6]), ("19 速さと電力", [2, 3]),
            ("20 セキュリティ", [6]), ("21 LPWA", [2]), ("22 大きなデータ", [2, 6]), ("23 検証", [5, 6]), ("24 設計", [1, 3])]

def _f24_map():
    o = []
    cols = ["1 要求", "2 方式", "3 予算", "4 構造", "5 失敗", "6 運用"]
    x0, cw, y0, rh = 230, 74, 40, 15.5
    for k, cn in enumerate(cols):
        o.append(T(x0 + (k + 0.5) * cw, 26, cn, "middle", 10, INK, True))
    for i, (name, secs) in enumerate(_F24_MAP):
        n = int(name[:2])
        c = SIG if n <= 6 else (GRN if n <= 15 else (PUR if n <= 20 else GLD))
        y = y0 + i * rh
        if i % 2 == 0:
            o.append(RECT(16, y - 1, x0 + 6 * cw - 16, rh, 0, MSOFT, "none", 0, op=0.5))
        o.append(T(x0 - 10, y + 11, name, "end", 9.5, c, n == 24))
        for s in secs:
            o.append(D(x0 + (s - 0.5) * cw, y + 7, c, 4.6))
    yb = y0 + len(_F24_MAP) * rh
    for k in range(7):
        o.append(W(x0 + k * cw, y0 - 4, x0 + k * cw, yb, c=GRD, lw=1))
    o.append(LEGEND(16, yb + 20, [(SIG, "第 I 部"), (GRN, "第 II 部"), (PUR, "第 III 部"), (GLD, "第 IV 部")]))
    o.append(T(16, yb + 38, "02 章の道具は、開発中のログの出口や、06 章の構成 (b) を選んだときに使う。", "start", 9.5, MUT))
    return SVG(700, yb + 48, o, "各章の道具が、この章の設計のどの節で使われたか（点）。電力の予算（3 節）と失敗への備え（5 節）は、第 II 部と第 III 部の多くの章の道具を組み合わせている。15 章の道具は 1〜6 節のほとんどで使われる。")
F["e24_map"] = _f24_map()
