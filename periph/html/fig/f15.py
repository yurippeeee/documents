# -*- coding: utf-8 -*-
# 15 章 異常に備える の図

# ---- 補助: 添字付きの記号・回路の部品 ----
def _f15_m(x, y, parts, a="start", sz=12, c=INK, b=False):
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

def _f15_resh(x1, x2, y, c=INK, lw=1.5, h=5, n=6):
    dx = (x2 - x1 - 8) / n
    pts = [(x1, y), (x1 + 4, y)]
    for i in range(n):
        pts.append((x1 + 4 + dx * (i + 0.5), y + (h if i % 2 == 0 else -h)))
    pts += [(x2 - 4, y), (x2, y)]
    return PL(pts, c=c, lw=lw)

def _f15_resv(x, y1, y2, c=INK, lw=1.5, h=5, n=6, dash=None):
    dy = (y2 - y1 - 8) / n
    pts = [(x, y1), (x, y1 + 4)]
    for i in range(n):
        pts.append((x + (h if i % 2 == 0 else -h), y1 + 4 + dy * (i + 0.5)))
    pts += [(x, y2 - 4), (x, y2)]
    return PL(pts, c=c, lw=lw, dash=dash)

def _f15_gnd(x, y, c=MUT):
    return (W(x, y, x, y + 5, c=c, lw=1.4) + W(x - 8, y + 5, x + 8, y + 5, c=c, lw=1.6)
            + W(x - 5, y + 9, x + 5, y + 9, c=c, lw=1.4) + W(x - 2, y + 13, x + 2, y + 13, c=c, lw=1.2))

def _f15_capv(x, y1, y2, c=INK, lw=1.5):
    ym = (y1 + y2) / 2
    return (W(x, y1, x, ym - 3, c=c, lw=lw) + W(x - 8, ym - 3, x + 8, ym - 3, c=c, lw=2)
            + W(x - 8, ym + 3, x + 8, ym + 3, c=c, lw=2) + W(x, ym + 3, x, y2, c=c, lw=lw))

def _f15_caph(x1, x2, y, c=INK, lw=1.5):
    xm = (x1 + x2) / 2
    return (W(x1, y, xm - 3, y, c=c, lw=lw) + W(xm - 3, y - 8, xm - 3, y + 8, c=c, lw=2)
            + W(xm + 3, y - 8, xm + 3, y + 8, c=c, lw=2) + W(xm + 3, y, x2, y, c=c, lw=lw))

def _f15_fet(x, yc, c=SIG):
    """N チャネル MOSFET の簡単な記号。x はドレイン・ソースの線、yc は中心。ゲートは (x - 22, yc)。"""
    o = W(x, yc - 22, x, yc - 10, x - 10, yc - 10, c=INK, lw=1.5)
    o += W(x, yc + 22, x, yc + 10, x - 10, yc + 10, c=INK, lw=1.5)
    o += W(x - 10, yc - 14, x - 10, yc + 14, c=c, lw=2)
    o += W(x - 15, yc - 12, x - 15, yc + 12, c=c, lw=2) + W(x - 22, yc, x - 15, yc, c=c, lw=1.5)
    o += _head(x - 1, yc + 10, x - 9, yc + 10, INK, 5)
    return o

# ---- 1 節: プログラムがピンを決めていない時間 ----
def _f15_phases():
    o = []
    x0, x1 = 150, 690
    X = lambda u: x0 + u / 100.0 * (x1 - x0)
    segs = [(0, 9, "立ち上がり", MUT), (9, 17, "リセット", MUT), (17, 32, "起動の処理", GLD), (32, 54, "動く", SIG),
            (54, 64, "止まる", ALI), (64, 72, "リセット", MUT), (72, 82, "起動", GLD), (82, 100, "動く", SIG)]
    ext = lambda a: a in (0, 9, 17, 64, 72)
    who = [(0, 32, GRN, "外付けの抵抗"), (32, 54, SIG, "プログラム"), (54, 64, ALI, "最後の値"), (64, 82, GRN, "外付けの抵抗"), (82, 100, SIG, "プログラム")]
    # 上: マイコンの電源電圧（模式図）
    yv0, yv1 = 30, 62
    o.append(T(x0 - 10, 50, "マイコンの電源", "end", 10, INK, True))
    o.append(PL([(X(0), yv1), (X(9), yv0 + 4), (X(12), yv0), (X(100), yv0)], c=GLD, lw=2))
    o.append(W(X(0), yv1 - 12, X(100), yv1 - 12, c=MUT, lw=1, dash="4 3"))
    o.append(T(X(100), yv1 - 16, "POR のしきい値", "end", 9, MUT, halo=True))
    rows = [(78, "マイコンの段階"), (112, "ピンを決めるもの"), (146, "負荷の入力")]
    for y, lab in rows:
        o.append(T(x0 - 10, y + 15, lab, "end", 10, INK, True))
    for a, b, lab, c in segs:
        y = rows[0][0]
        o.append(RECT(X(a), y, X(b) - X(a), 22, 2, soft(c), c, 1.1))
        o.append(T((X(a) + X(b)) / 2, y + 15, lab, "middle", 9.5 if X(b) - X(a) > 50 else 9, c, True))
        y = rows[2][0]
        if ext(a):
            o.append(RECT(X(a), y, X(b) - X(a), 22, 2, GSOFT, GRN, 1.1))
            o.append(T((X(a) + X(b)) / 2, y + 15, "切", "middle", 9.5, GRN, True))
        elif lab == "止まる":
            o.append(RECT(X(a), y, X(b) - X(a), 22, 2, ASOFT, ALI, 1.2))
            o.append(T((X(a) + X(b)) / 2, y + 15, "入ったまま", "middle", 9, ALI, True))
        else:
            o.append(RECT(X(a), y, X(b) - X(a), 22, 2, SCR, LIN, 1))
            # プログラムが入れ切りする（模式図）
            k = 0
            u = a + 2
            while u + 4 <= b:
                if k % 2 == 0:
                    o.append(RECT(X(u), y + 3, X(min(u + 5, b - 1)) - X(u), 16, 2, PSOFT, PUR, 0.9))
                u += 5; k += 1
            if lab == "動く" and a == 32:
                o.append(RECT(X(52), y + 3, X(54) - X(52), 16, 0, PSOFT, PUR, 0.9))
    for a, b, c2, t2 in who:
        y = rows[1][0]
        o.append(RECT(X(a), y, X(b) - X(a), 22, 2, soft(c2), c2, 1.1))
        o.append(T((X(a) + X(b)) / 2, y + 15, t2, "middle", 9.5, c2, True))
    # 注記
    yn = 186
    o.append(DIM(X(17), yn, X(32), yn, None, c=GLD))
    o.append(T((X(17) + X(32)) / 2, yn + 15, "ブートローダ・初期化", "middle", 9, GLD))
    o.append(T((X(17) + X(32)) / 2, yn + 28, "数十 µs〜数百 ms", "middle", 9, GLD))
    o.append(DIM(X(54), yn, X(64), yn, None, c=ALI))
    o.append(T((X(54) + X(64)) / 2, yn + 15, "ウォッチドッグの時間", "middle", 9, ALI))
    o.append(T((X(54) + X(64)) / 2, yn + 28, "（4 節）", "middle", 9, ALI))
    o.append(T(14, yn + 50, "デバッガでプログラムを止めた間も「最後の値のまま」になる。ウォッチドッグも数えない設定のものが多い。", "start", 9.5, ALI))
    o.append(T(14, yn + 66, "緑の間は、プログラムは何もできない。負荷の入力を外付けの抵抗で切る側に引いておくと、切になる。紫はプログラムが入れている間。", "start", 9.5, GRN))
    return SVG(700, yn + 76, o, "電源を入れてから動き出すまでと、プログラムが止まってウォッチドッグでリセットされるまでの、ピンを決めるもの（時間は模式図）。電源の立ち上がり・リセット・起動の処理の間は外付けの抵抗が、プログラムが止まった間は最後に出した値が、負荷の入力を決める。")
F["e15_phases"] = _f15_phases()

# ---- 1 節: リセットの間にゲートの電圧を上げるもの ----
def _f15_vg(R, Ilk=1e-6, Rpu=None, VDD=3.3):
    if Rpu is None:
        return Ilk * R
    return R * (VDD + Ilk * Rpu) / (R + Rpu)

def _f15_vpk(R, tr, Cgd=0.1e-9, Cgs=1e-9, dV=12.0):
    tau = R * (Cgs + Cgd)
    return R * Cgd * dV / tr * (1 - math.exp(-tr / tau))

def _f15_pull():
    o = []
    # 左: 回路
    o.append(T(14, 20, "リセットの間のゲート", "start", 11, INK, True))
    yg = 120                                   # ゲートの線の高さ
    o.append(RECT(14, yg - 54, 86, 100, 6, SSOFT, SIG, 1.3))
    o.append(T(22, yg + 22, "マイコンの", "start", 10, SIG, True))
    o.append(T(22, yg + 36, "ピン（入力）", "start", 10, SIG, True))
    # 内蔵のプルアップ（破線。リセットの間に入るピンだけ）
    o.append(W(78, yg - 46, 92, yg - 46, c=TEA, lw=1.2) + W(85, yg - 46, 85, yg - 40, c=TEA, lw=1.2))
    o.append(_f15_resv(85, yg - 40, yg - 10, c=TEA, lw=1.2, n=4, dash="3 2") + W(85, yg - 10, 85, yg, 100, yg, c=TEA, lw=1.2))
    o.append(_f15_m(77, yg - 22, [("R", "pu", True)], "end", 10, TEA))
    o.append(T(22, yg - 40, "VDD", "start", 9, TEA))
    o.append(W(100, yg, 210, yg, c=INK, lw=1.5) + D(170, yg, INK, 2.6))
    # 漏れ電流の矢印
    o.append(ARR(128, yg + 34, 128, yg + 6, c=GLD, lw=1.4, head=6))
    o.append(_f15_m(134, yg + 30, [("I", "lk", True)], "start", 11, GLD, True))
    # R to GND
    o.append(W(170, yg, 170, yg + 10, c=SIG, lw=1.5) + _f15_resv(170, yg + 10, yg + 46, c=SIG, n=5) + _f15_gnd(170, yg + 46, SIG))
    o.append(_f15_m(181, yg + 32, [("R", None, True)], "start", 12, SIG, True))
    # MOSFET
    xf = 254
    o.append(W(210, yg, xf - 22, yg, c=INK, lw=1.5) + _f15_fet(xf, yg, SIG))
    o.append(W(xf, yg + 22, xf, yg + 32, c=INK, lw=1.5) + _f15_gnd(xf, yg + 32))
    o.append(_f15_m(xf - 26, yg - 6, [("V", "g", True)], "end", 11, INK, True))
    # Cgd（点線でゲートとドレインの間）
    o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (xf - 18, yg - 4, xf - 34, yg - 30, xf - 20, yg - 40, xf, yg - 30), c=PUR, lw=1.2, dash="3 2"))
    o.append(_f15_m(xf - 34, yg - 40, [("C", "gd", True)], "end", 10, PUR))
    # ドレインから負荷と 12 V
    o.append(W(xf, yg - 22, xf, yg - 46, c=INK, lw=1.5))
    o.append(RECT(xf - 16, yg - 74, 32, 28, 4, PSOFT, PUR, 1.2) + T(xf, yg - 56, "負荷", "middle", 9.5, PUR, True))
    o.append(W(xf, yg - 74, xf, yg - 84, c=GLD, lw=1.5))
    o.append(T(xf, yg - 90, "12 V（立ち上がる）", "middle", 9.5, GLD, True))
    o.append(T(14, yg + 74, "上げるもの: 漏れ電流、リセットの間の内蔵のプルアップ", "start", 9.5, MUT))
    o.append(T(14, yg + 88, "（破線。入るピンだけ）、負荷の電源の立ち上がり（容量）", "start", 9.5, MUT))
    # 右: 例の値でのゲートの電圧
    cases = [("漏れ電流 1 µA だけ・100 kΩ", _f15_vg(100e3), GRN),
             ("漏れ電流 1 µA だけ・1 MΩ", _f15_vg(1e6), GLD),
             ("内蔵 30 kΩ が入る・100 kΩ", _f15_vg(100e3, Rpu=30e3), ALI),
             ("内蔵 30 kΩ が入る・10 kΩ", _f15_vg(10e3, Rpu=30e3), ALI),
             ("内蔵 30 kΩ が入る・4.7 kΩ", _f15_vg(4.7e3, Rpu=30e3), GRN),
             ("電源が 10 µS で立ち上がる・100 kΩ".replace("µS", "µs"), _f15_vpk(100e3, 10e-6), ALI),
             ("電源が 1 ms で立ち上がる・100 kΩ", _f15_vpk(100e3, 1e-3), GRN)]
    xb, wb, y0, rh = 470, 200, 46, 24
    vmax = 3.0
    Xv = lambda v: xb + v / vmax * wb
    o.append(T(xb + wb / 2, 20, "ゲートの電圧の最大（例の値）", "middle", 11, INK, True))
    for v in (0, 1, 2, 3):
        o.append(W(Xv(v), y0 - 6, Xv(v), y0 + len(cases) * rh, c=GRD, lw=1))
        o.append(T(Xv(v), y0 + len(cases) * rh + 14, "%d V" % v, "middle", 9, MUT))
    for i, (lab, v, c) in enumerate(cases):
        y = y0 + i * rh
        o.append(T(xb - 8, y + 13, lab, "end", 9.5, INK))
        o.append(RECT(xb, y + 3, max(Xv(min(v, vmax)) - xb, 1.2), 14, 2, soft(c), c, 1.1))
        o.append(T(Xv(min(v, vmax)) + 4, y + 14, "%.2f V" % v, "start", 9.5, c, True, halo=True))
    o.append(W(Xv(0.8), y0 - 8, Xv(0.8), y0 + len(cases) * rh, c=ALI, lw=1.3, dash="5 3"))
    o.append(W(Xv(0.5), y0 - 8, Xv(0.5), y0 + len(cases) * rh, c=GRN, lw=1.3, dash="2 3"))
    o.append(T(Xv(0.8) + 3, y0 - 10, "しきい値 0.8 V", "start", 9, ALI, True))
    o.append(T(Xv(0.5) - 3, y0 - 10, "許す 0.5 V", "end", 9, GRN, True))
    yl = y0 + len(cases) * rh + 34
    o.append(T(xb + wb, yl, "4.7 kΩ にすると、ピンが H の間に 0.70 mA が流れる", "end", 9.5, MUT))
    return SVG(700, yl + 10, o, "リセットの間のゲートの電圧（例の値: VDD 3.3 V、しきい値の最小 0.8 V に余裕 0.3 V、漏れ電流 1 µA、ゲートとドレインの間の容量 0.1 nF・ゲートとソースの間 1 nF、負荷の電源 12 V）。リセットの間に内蔵のプルアップが入るピンでは、普通のプルダウンでは足りない。速く立ち上がる負荷の電源も、容量を通してゲートを持ち上げる。")
F["e15_pull"] = _f15_pull()

# ---- 2 節: 異常の場面ごとに守るもの ----
_F15_MECH = {"d": (GRN, "既定の状態"), "w": (SIG, "ウォッチドッグ"), "p": (GLD, "部品の選び方"), "s": (PUR, "プログラム"), "h": (TEA, "マイコンに頼らない")}

def _f15_matrix():
    o = []
    cols = ["1 リセットの間", "2 プログラムの停止", "3 電源が切れた", "4 センサの故障", "5 スイッチの故障"]
    rows = [("ヒータ", "切る", [("d", "抵抗で切る側に"), ("w", "リセットで 1 へ"), ("p", "電源が無ければ切れる"), ("s", "見つけて切る"), ("h", "2 つ目のリレー・サーモスタット")]),
            ("モータ（扉）", "止める", [("d", "ドライバの入力を止める側に"), ("w", "リセットで 1 へ"), ("p", "切れると効くブレーキ"), ("s", "見つけて止める"), ("h", "扉のスイッチで電源を切る")]),
            ("電磁弁（水を送る）", "閉じる", [("d", "抵抗で閉じる側に"), ("w", "リセットで 1 へ"), ("p", "ノーマルクローズの弁"), ("s", "見つけて閉じる"), ("h", "2 つ目の弁を直列に")]),
            ("電気錠（避難口）", "開く", [("d", "抵抗で開く側に"), ("w", "リセットで 1 へ"), ("p", "電気が切れると外れる錠"), ("s", "見つけて開ける"), ("h", "手で開けられる機構")]),
            ("余熱を逃がすファン", "回す", [("d", "抵抗で回す側に"), ("w", "リセットで 1 へ"), ("p", "—（熱も出ない）"), ("s", "見つけて回す"), ("h", "温度スイッチで直接回す")])]
    xl, xc0, cw, y0, rh = 14, 128, 112, 30, 50
    for j, t in enumerate(cols):
        o.append(T(xc0 + j * cw + cw / 2, 20, t, "middle", 10, INK, True))
    o.append(T(xl, 20, "アクチュエータ", "start", 10, INK, True))
    for i, (nm, st, cells) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(xl, y + 21, nm, "start", 10, PUR, True))
        s, w = CHIP(xl, y + 40, "安全: " + st, GRN, sz=9)
        o.append(s)
        for j, (k, txt) in enumerate(cells):
            c, _ = _F15_MECH[k]
            x = xc0 + j * cw
            o.append(RECT(x + 3, y + 4, cw - 6, rh - 8, 5, soft(c), c, 1.1))
            lines = wrap(txt, 10)
            for q, l in enumerate(lines):
                o.append(T(x + cw / 2, y + rh / 2 + 4 + (q - (len(lines) - 1) / 2) * 13, l, "middle", 9.5, c, True))
    yl = y0 + len(rows) * rh + 18
    o.append(LEGEND(xl, yl, [(_F15_MECH[k][0], _F15_MECH[k][1]) for k in ("d", "w", "p", "s", "h")]))
    o.append(T(xl, yl + 20, "5 の場面では、スイッチが入ったまま壊れているので、プログラムもリセットも効かない。マイコンの外の別の止め方が要る。", "start", 9.5, ALI))
    return SVG(700, yl + 30, o, "アクチュエータと異常の場面ごとに、安全な状態を何が保証するか（例の決め方）。場面 2 はウォッチドッグのリセットで場面 1 に持ち込む。場面 5（スイッチの短絡・溶着）は、2 つ目のスイッチやインタロックのような、マイコンに頼らない止め方でしか守れない。")
F["e15_matrix"] = _f15_matrix()

# ---- 2 節: インタロック ----
def _f15_interlock():
    o = []
    def door_sw(x, y, opened, c=TEA):
        """普段閉じていて、扉が開くと開く接点（横向き）。"""
        o.append(D(x, y, c, 2.6) + D(x + 30, y, c, 2.6))
        o.append(W(x, y, x + 30, y - (12 if opened else 0), c=c, lw=1.8))
    for k, (title, good) in enumerate((("(a) マイコンが読むだけ", False), ("(b) 負荷の電流の道に入れる", True))):
        x0 = 14 + k * 350
        c = GRN if good else ALI
        o.append(T(x0, 20, title, "start", 11, c, True))
        o.append(RECT(x0, 44, 50, 30, 4, GOSOFT, GLD, 1.3) + T(x0 + 25, 63, "電源", "middle", 10, GLD, True))
        o.append(RECT(x0, 124, 70, 40, 6, SSOFT, SIG, 1.3) + T(x0 + 35, 148, "マイコン", "middle", 10, SIG, True))
        xd = x0 + 190
        o.append(RECT(xd, 44, 70, 30, 4, PSOFT, PUR, 1.3) + T(xd + 35, 63, "ドライバ", "middle", 10, PUR, True))
        o.append(CIRC(xd + 35, 112, 16, PUR, 1.5, PSOFT) + T(xd + 35, 116, "M", "middle", 11, PUR, True))
        o.append(W(xd + 35, 74, xd + 35, 96, c=PUR, lw=1.5))
        # マイコン → ドライバの入力（L 字）
        o.append(W(x0 + 70, 154, xd + 8, 154, c=SIG, lw=1.4) + ARR(xd + 8, 154, xd + 8, 76, c=SIG, lw=1.4, head=6))
        o.append(T(x0 + 120, 168, "回す・止める", "middle", 9, SIG))
        if not good:
            o.append(W(x0 + 50, 59, xd, 59, c=GLD, lw=1.6))
            door_sw(x0 + 20, 200, True)
            o.append(W(x0 + 35, 164, x0 + 35, 186, x0 + 20, 186, x0 + 20, 200, c=TEA, lw=1.2))
            o.append(T(x0 + 60, 204, "扉のスイッチ（読むだけ）", "start", 9.5, TEA, True))
            o.append(T(x0, 236, "プログラムが止まると、扉が開いても", "start", 9.5, ALI))
            o.append(T(x0, 250, "モータは止まらない（14 章 5 節と同じ）", "start", 9.5, ALI))
        else:
            o.append(W(x0 + 50, 59, x0 + 80, 59, c=GLD, lw=1.6))
            door_sw(x0 + 80, 59, False)
            o.append(W(x0 + 110, 59, xd, 59, c=GLD, lw=1.6))
            o.append(T(x0 + 95, 44, "扉のスイッチ", "middle", 9.5, TEA, True))
            o.append(T(x0 + 120, 84, "扉が開くと開く", "start", 9, TEA))
            # 状態を読む（破線）
            o.append(W(x0 + 110, 59, x0 + 110, 96, c=TEA, lw=1.1, dash="3 2") + ARR(x0 + 110, 96, x0 + 62, 122, c=TEA, lw=1.1, head=5, dash="3 2"))
            o.append(T(x0 + 92, 112, "状態を読むだけ", "start", 9, TEA, halo=True))
            o.append(T(x0, 236, "扉が開けば、プログラムが何を出しても", "start", 9.5, GRN))
            o.append(T(x0, 250, "ドライバに電源が来ない。線が切れても止まる", "start", 9.5, GRN))
    return SVG(700, 260, o, "扉が開いている間はモータを回さないためのインタロック。(a) 扉のスイッチをマイコンが読むだけでは、プログラムが止まっていれば止まらない。(b) 普段は閉じていて扉が開くと開く接点を、ドライバの電源の線に入れる。マイコンは状態を読んで記録するだけにする。")
F["e15_interlock"] = _f15_interlock()

# ---- 3 節: 共有する道に生じる電圧 ----
def _f15_shared():
    o = []
    def bat(x, y):
        o.append(RECT(x, y, 46, 86, 5, GOSOFT, GLD, 1.4))
        o.append(T(x + 23, y + 28, "電池", "middle", 9.5, GLD, True))
        o.append(_f15_m(x + 23, y + 46, [("E", None, True)], "middle", 10, GLD))
        o.append(_f15_m(x + 23, y + 64, [("R", "in", True)], "middle", 10, GLD))
        o.append(T(x + 51, y + 12, "+", "start", 11, GLD, True) + T(x + 51, y + 82, "−", "start", 11, GLD, True))
    def box(x, y, w, h, t, c, sub=None):
        o.append(RECT(x, y, w, h, 5, soft(c), c, 1.3))
        o.append(T(x + w / 2, y + (h / 2 + 4 if not sub else h / 2 - 2), t, "middle", 9.5, c, True))
        if sub:
            o.append(T(x + w / 2, y + h / 2 + 11, sub, "middle", 8.5, c))
    # ---- (a) 分け合う ----
    o.append(T(14, 20, "(a) 線を分け合う", "start", 11, ALI, True))
    bat(14, 44)
    yp, yn = 56, 124
    o.append(PL([(60, yp), (140, yp)], c=ASOFT, lw=8) + PL([(60, yn), (140, yn)], c=ASOFT, lw=8))
    o.append(W(60, yp, 78, yp, c=INK, lw=1.5) + _f15_resh(78, 122, yp) + W(122, yp, 150, yp, c=INK, lw=1.5))
    o.append(W(60, yn, 78, yn, c=INK, lw=1.5) + _f15_resh(78, 122, yn) + W(122, yn, 150, yn, c=INK, lw=1.5))
    o.append(_f15_m(100, yp - 10, [("R", "s", True)], "middle", 10, ALI))
    o.append(_f15_m(100, yn + 22, [("R", "g", True), ("（GND の側）", None, False)], "middle", 9.5, ALI))
    o.append(W(150, 40, 150, 100, c=INK, lw=1.5) + D(150, yp, INK, 2.6))
    o.append(W(150, 40, 176, 40, c=INK, lw=1.5) + W(150, 100, 176, 100, c=INK, lw=1.5))
    box(176, 28, 92, 24, "モータ", PUR)
    box(176, 88, 92, 24, "マイコン", SIG)
    o.append(W(268, 40, 284, 40, 284, yn, 150, yn, c=INK, lw=1.5) + W(268, 100, 276, 100, 276, yn, c=INK, lw=1.5) + D(276, yn, INK, 2.4) + D(150, yn, INK, 2.6))
    # センサは電池の − に GND をつなぐ
    box(176, 150, 92, 24, "センサ", TEA)
    o.append(W(176, 162, 66, 162, 66, yn, c=TEA, lw=1.2, dash="4 3") + D(66, yn, TEA, 2.4))
    o.append(ARR(222, 150, 222, 114, c=TEA, lw=1.2, head=5))
    o.append(T(14, 196, "モータの電流が分け合う線を流れると、マイコンの電源が下がり、", "start", 9.5, ALI))
    o.append(T(14, 210, "GND が持ち上がる。例: 1.33 A × 0.05 Ω = 67 mV。電池の − に", "start", 9.5, ALI))
    o.append(T(14, 224, "つないだセンサの読みは、12 ビットの ADC で 83 LSB ずれる", "start", 9.5, ALI))
    # ---- (b) 電池の端子で分ける ----
    bx = 364
    o.append(T(bx, 20, "(b) 電池の端子で道を分ける", "start", 11, GRN, True))
    bat(bx, 44)
    xp = bx + 46
    o.append(W(xp, 52, 430, 52, 430, 36, 560, 36, c=PUR, lw=1.6))
    box(560, 24, 92, 24, "モータ", PUR)
    o.append(W(652, 36, 664, 36, 664, 138, 430, 138, 430, 128, xp, 128, c=PUR, lw=1.6))
    o.append(RECT(574, 52, 64, 18, 3, SCR, LIN, 0.8) + T(606, 65, "そばにコンデンサ", "middle", 8.5, PUR))
    o.append(W(xp, 62, 450, 62, 450, 92, 474, 92, c=SIG, lw=1.4))
    o.append(PL([(474, 86), (474, 98), (485, 92)], c=SIG, lw=1.2, fill=SSOFT) + W(485, 86, 485, 98, c=SIG, lw=1.6))
    o.append(W(485, 92, 560, 92, c=SIG, lw=1.4) + D(510, 92, SIG, 2.4) + _f15_capv(510, 92, 112, c=SIG) + W(510, 112, 510, 116, c=SIG, lw=1.4))
    box(560, 80, 92, 24, "マイコン", SIG)
    o.append(W(606, 104, 606, 116, 440, 116, 440, 118, xp, 118, c=SIG, lw=1.4) + D(510, 116, SIG, 2.4))
    o.append(T(470, 80, "ダイオード", "middle", 8.5, SIG))
    o.append(T(518, 130, "コンデンサ", "start", 8.5, SIG))
    box(560, 150, 92, 24, "センサ", TEA)
    o.append(W(560, 162, 520, 162, 520, 116, c=TEA, lw=1.2, dash="4 3") + D(520, 116, TEA, 2.4))
    o.append(T(bx, 196, "モータの電流はマイコンの線を通らない。分け合うのは電池の", "start", 9.5, GRN))
    o.append(T(bx, 210, "内部抵抗だけで、短い落ち込みの間はコンデンサが支える（13 章 7 節）。", "start", 9.5, GRN))
    o.append(T(bx, 224, "センサの GND はマイコンの GND の所につなぐ", "start", 9.5, GRN))
    return SVG(700, 234, o, "負荷とマイコンが電源の道を分け合うと、負荷の電流が分け合う部分に電圧を生み、マイコンの電源が下がり（電源の揺れ）、GND の電位が動く（グラウンドバウンス）。(b) のように電池の端子で道を分け、PWM の速い電流はモータのそばのコンデンサとの間で閉じるようにする（例の値）。")
F["e15_shared"] = _f15_shared()

# ---- 3 節: リセットが繰り返す（平均化した PWM の模型を細かい時間刻みで解く） ----
def _f15_dipsim(E=4.8, Rin=1.6, C=1000e-6, split=False, Cm=1000e-6, tacc=0.0, T=0.3, dt=10e-6,
                Vbor=2.7, Vhys=0.1, Vdo=0.3, VD=0.3, Imcu=10e-3, Irst=1e-3, tpor=3e-3, tboot=50e-3,
                Rm=2.0, L=1e-3, k=0.02, J=1e-5, TL=0.01):
    V = E; Vm = E - VD if split else E; I = 0.0; w = 0.0
    st = "RUN"; t_st = 0.0; started = None; nxt = tboot
    out = []; resets = []; t = 0.0; n = 0; vmin = E
    while t < T:
        vmcu = min(3.3, max(0.0, (Vm if split else V) - Vdo))
        if st == "RUN" and vmcu < Vbor:
            st = "RESET"; t_st = t; resets.append(t); started = None
        elif st == "RESET" and vmcu > Vbor + Vhys:
            st = "POR"; t_st = t
        elif st == "POR" and t - t_st >= tpor:
            st = "RUN"; nxt = t + tboot
        if st == "RUN" and started is None and t >= nxt:
            started = t
        D = 0.0
        if st == "RUN" and started is not None:
            D = 1.0 if tacc <= 0 else min(1.0, (t - started) / tacc)
        I = max(0.0, I + (D * V - Rm * I - k * w) / L * dt)
        tq = k * I - TL
        w = 0.0 if (w <= 0 and tq < 0) else max(0.0, w + tq / J * dt)
        imcu = Irst if st != "RUN" else Imcu
        isup = (E - V) / Rin
        if split:
            idd = max(0.0, (V - VD - Vm) / 0.05)
            Vm += (idd - imcu) / Cm * dt
            V += (isup - D * I - idd) / C * dt
        else:
            V += (isup - D * I - imcu) / C * dt
        vmin = min(vmin, V)
        if n % 25 == 0:
            out.append((t * 1e3, V, vmcu, D * I))
        t += dt; n += 1
    return out, resets, vmin

def _f15_loop():
    o = []
    cases = [("(a) 一気に回し始める", dict(), ALI),
             ("(b) 0.12 s かけて加速する（13 章 3 節）", dict(tacc=0.12), GRN),
             ("(c) マイコンの側をダイオードと 1000 µF で分ける", dict(split=True), GRN)]
    y = 14
    for title, kw, tc in cases:
        pts, resets, vmin = _f15_dipsim(**kw)
        o.append(T(14, y + 12, title, "start", 10.5, tc, True))
        p = Plot(70, y + 22, 520, 70, (0, 300), (2.0, 5.0))
        o.append(p.axes(xt=[0, 50, 100, 150, 200, 250, 300], yt=[2, 3, 4, 5], xfmt=lambda v: "", yfmt=lambda v: "%d" % v))
        o.append(T(p.x - 30, p.y + p.h / 2 + 4, "V", "middle", 9.5, MUT))
        o.append(p.line([(0, 2.7), (300, 2.7)], c=ALI, lw=1.1, dash="5 3"))
        o.append(p.line([(a, b) for a, b, c_, d in pts], c=GLD, lw=1.6))
        o.append(p.line([(a, c_) for a, b, c_, d in pts], c=SIG, lw=1.6))
        for r in resets:
            o.append(W(p.X(r * 1e3), p.y, p.X(r * 1e3), p.y + 8, c=ALI, lw=1.6))
        # 電流の帯
        q = Plot(70, y + 98, 520, 24, (0, 300), (0, 2.0))
        o.append(W(q.x, q.y + q.h, q.x + q.w, q.y + q.h, c=MUT, lw=1))
        o.append(q.line([(a, d) for a, b, c_, d in pts], c=PUR, lw=1.3))
        o.append(T(q.x - 6, q.y + 16, "電流", "end", 9, PUR))
        if resets:
            lines = ["リセット %d 回" % len(resets), "（赤の印）。", "モータは回らない"]
        elif kw.get("split"):
            lines = ["リセットなし。", "マイコンの電源の", "最低 %.2f V" % min(c_ for a, b, c_, d in pts)]
        else:
            lines = ["リセットなし。", "電源の線の", "最低 %.2f V" % vmin]
        for i, l in enumerate(lines):
            o.append(T(600, y + 44 + i * 13, l, "start", 9.5, tc, True))
        y += 136
    for v in (0, 50, 100, 150, 200, 250, 300):
        o.append(T(70 + v / 300.0 * 520, y - 8, "%d" % v, "middle", 9, MUT))
    o.append(T(330, y + 8, "時間 [ms]（起動して 50 ms でモータを回し始める）", "middle", 9.5, MUT))
    o.append(LEGEND(70, y + 28, [(GLD, "電源の線の電圧"), (SIG, "マイコンの電源"), (ALI, "BOR 2.7 V"), (PUR, "モータの電流（0〜2 A）")]))
    return SVG(700, y + 38, o, "使い終わりの電池（4.8 V・1.6 Ω）で 13 章の例のモータを回すとき（例の値、細かい時間刻みで解いた値）。(a) 回し始めて 1.9 ms で BOR がかかり、リセットでモータが止まると電圧が戻り、起動してまた回して、55 ms ごとにリセットを繰り返す。(b) 加速をゆっくりにすると起動電流が下がり、(c) マイコンの側を分けると、電源の線が下がってもマイコンの電源は保たれる。")
F["e15_loop"] = _f15_loop()

# ---- 4 節: 止まってから安全な状態まで ----
def _f15_chain():
    o = []
    x0, x1, tmax = 170, 680, 900.0
    X = lambda t: x0 + t / tmax * (x1 - x0)
    Ts, J, TW, eps = 100.0, 10.0, 150.0, 0.10
    t1 = Ts + J; t2 = t1 + TW / (1 - eps)
    rows = [("ヒータ（SSR）", [(0, t1, "合図まで", GLD), (t1, t2, "数え終えるまで", SIG), (t2, t2 + 10, "", PUR)], t2 + 10, "SSR は次のゼロクロスで切れる（≤ 10 ms）"),
            ("モータ（惰性で止まる）", [(0, t1, "合図まで", GLD), (t1, t2, "数え終えるまで", SIG), (t2, t2 + 550, "惰性で止まる（13 章 3 節）", PUR)], t2 + 550, "")]
    y0 = 40
    o.append(T(x0 - 10, 22, "プログラムが止まる →", "end", 9.5, ALI, True))
    o.append(W(X(0), 26, X(0), y0 + 2 * 46 + 6, c=ALI, lw=1.4, dash="4 3"))
    for i, (lab, segs, tend, note) in enumerate(rows):
        y = y0 + i * 46
        o.append(T(x0 - 10, y + 16, lab, "end", 10, PUR, True))
        for a, b, t, c in segs:
            o.append(RECT(X(a), y, X(b) - X(a), 24, 2, soft(c), c, 1.1))
            if t and X(b) - X(a) > tw(t, 9) + 4:
                o.append(T((X(a) + X(b)) / 2, y + 16, t, "middle", 9, c, True))
        o.append(T(X(tend) + 5, y + 16, "%.0f ms" % tend, "start", 9.5, INK, True))
        if note:
            o.append(T(X(tend) + 50, y + 16, note, "start", 9, PUR))
    ya = y0 + 2 * 46 + 8
    o.append(W(X(0), ya, X(tmax), ya, c=MUT, lw=1))
    for t in range(0, 901, 100):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9, MUT))
    o.append(T(X(tmax), ya + 30, "ms", "end", 9, MUT))
    # 内訳の式
    o.append(_f15_m(X(t1 / 2), y0 - 6, [("T", "s", True), (" + ", None, False), ("J", None, True)], "middle", 10, GLD))
    o.append(_f15_m(X((t1 + t2) / 2), y0 - 6, [("T", "W", True), ("/(1 − ε)", None, False)], "middle", 10, SIG))
    # 危険の育つ速さ
    yb = ya + 50
    o.append(T(14, yb, "危険が育つ速さと比べる", "start", 10.5, INK, True))
    o.append(T(14, yb + 18, "ヒータの板（14 章の例）: 最大の電力でも 1 秒に 0.2 K。287 ms の間に 0.06 K 上がるだけで、間に合う。", "start", 9.5, GRN))
    o.append(T(14, yb + 34, "挟み込み（13 章 4 節）: 拘束と決める 0.15 s でもけがをさせうる。ウォッチドッグでは守れない → インタロック・力の上限。", "start", 9.5, ALI))
    return SVG(700, yb + 44, o, "プログラムが止まってからアクチュエータが止まるまで（例の値: 監視の周期 100 ms、ばらつき 10 ms、ウォッチドッグの時間 150 ms、発振器のずれ 10 %）。ウォッチドッグのリセットまで 277 ms かかり、さらにアクチュエータが止まる時間が加わる。")
F["e15_chain"] = _f15_chain()

# ---- 4 節: ウィンドウウォッチドッグ ----
def _f15_window():
    o = []
    Topen, TW, eps = 75.0, 150.0, 0.10
    o_lo, o_hi = Topen / (1 + eps), Topen / (1 - eps)
    c_lo, c_hi = TW / (1 + eps), TW / (1 - eps)
    # 上: 前の合図からの時間の物差し
    x0, x1, tm = 150, 690, 200.0
    R = lambda t: x0 + t / tm * (x1 - x0)
    y = 34
    o.append(T(x0 - 10, y + 18, "前の合図からの時間", "end", 10, INK, True))
    for a, b, f, c, lab in ((0, o_lo, ASOFT, ALI, "早すぎる"), (o_lo, o_hi, MSOFT, MUT, ""), (o_hi, c_lo, GSOFT, GRN, "窓（受け付ける）"),
                            (c_lo, c_hi, MSOFT, MUT, ""), (c_hi, tm, ASOFT, ALI, "遅すぎる")):
        o.append(RECT(R(a), y, R(b) - R(a), 28, 2, f, c, 1.1))
        if lab:
            o.append(T((R(a) + R(b)) / 2, y + 18, lab, "middle", 9.5, c, True))
    o.append(W(R(0), y - 4, R(0), y + 32, c=SIG, lw=2.2))
    for t, lab in ((o_lo, "68"), (o_hi, "83"), (c_lo, "136"), (c_hi, "167")):
        o.append(T(R(t), y + 42, lab, "middle", 9, MUT))
    o.append(T(R(tm), y + 42, "ms", "end", 9, MUT))
    o.append(T((R(o_lo) + R(o_hi)) / 2, y - 6, "開く", "middle", 9, MUT))
    o.append(T((R(c_lo) + R(c_hi)) / 2, y - 6, "閉じる", "middle", 9, MUT))
    o.append(T(R(0) + 4, y - 6, "合図", "start", 9, SIG, True))
    # 下: 3 つの場合
    x0, x1, tmax = 150, 690, 480.0
    X = lambda t: x0 + t / tmax * (x1 - x0)
    lanes = [("(a) 正常", [0, 104, 196, 303, 398], None, GRN, "間隔 90〜110 ms。どの合図も窓の中"),
             ("(b) ループが速く回る", [0, 104, 129], ("early", 129), ALI, "25 ms で次の合図 → 窓が開く前なのでリセット"),
             ("(c) タスクが止まる", [0, 104], ("late", 104 + c_hi), ALI, "合図が来ないまま窓が閉じてリセット")]
    y = 112
    for lab, sig, rst, c, note in lanes:
        o.append(T(x0 - 10, y + 16, lab, "end", 10, c, True))
        o.append(W(X(0), y + 12, X(tmax), y + 12, c=LIN, lw=1))
        for i, s0 in enumerate(sig):
            nxt = sig[i + 1] if i + 1 < len(sig) else None
            if nxt is None and rst and rst[0] == "early":
                continue
            end = nxt if nxt is not None else (rst[1] if rst else tmax)
            # 窓（緑）を、次の合図か終わりまで描く
            a, b = s0 + o_hi, min(s0 + c_lo, end, tmax)
            if b > a:
                o.append(RECT(X(a), y + 2, X(b) - X(a), 20, 2, GSOFT, GRN, 1.1))
        for s0 in sig:
            o.append(W(X(s0), y - 2, X(s0), y + 26, c=SIG, lw=2.2))
        if rst:
            tx = rst[1]
            o.append(W(X(tx) - 6, y + 6, X(tx) + 6, y + 18, c=ALI, lw=2.2) + W(X(tx) - 6, y + 18, X(tx) + 6, y + 6, c=ALI, lw=2.2))
        o.append(T(X(tmax), y + 40, note, "end", 9.5, c))
        y += 54
    ya = y - 6
    o.append(W(X(0), ya, X(tmax), ya, c=MUT, lw=1))
    for t in range(0, 481, 50):
        o.append(W(X(t), ya, X(t), ya + 4, c=MUT, lw=1))
        o.append(T(X(t), ya + 16, "%d" % t, "middle", 9, MUT))
    o.append(T(X(tmax), ya + 30, "時間 [ms]", "end", 9, MUT))
    o.append(LEGEND(14, ya + 50, [(SIG, "合図"), (GRN, "窓（ずれで最も狭くなった場合）"), (ALI, "リセット")]))
    return SVG(700, ya + 60, o, "ウィンドウウォッチドッグ（例の値: 窓 75〜150 ms、発振器のずれ ±10 %）。前の合図から、窓が開く前に来た合図も、窓が閉じるまでに来ない合図も、リセットになる。境目は発振器のずれで動く（灰色）ので、正常な合図の間隔（90〜110 ms）が、最も狭くなった窓（83〜136 ms）に入るように決める。")
F["e15_window"] = _f15_window()

# ---- 5 節: 故障ごとの扱い ----
def _f15_faults():
    o = []
    cols = [("故障", 126), ("見つけ方", 132), ("止める", 128), ("続ける", 148), ("戻し方", 136)]
    rows = [(["室温のセンサ"], ["妥当性の検査", "（10 章 6 節）"], ["室温に合わせる暖房"], ["弱い決まった出力の暖房・", "送風・遠くからの操作"], ["検査が続けて通れば", "自動で"], GLD),
            (["過熱を見張るセンサ"], ["妥当性の検査"], ["暖房（すべて）"], ["送風（余熱を逃がす）・", "知らせる"], ["利用者が直して", "操作するまで"], ALI),
            (["ファンが回らない"], ["回転や電流", "（13 章 4 節）"], ["暖房・ファン"], ["知らせる"], ["利用者が直して", "操作するまで"], ALI),
            (["切ったのに", "ヒータに電流"], ["電流の測り", "（14 章 5 節）"], ["すべて。2 つ目の", "スイッチで切る"], ["知らせる"], ["修理するまで"], ALI),
            (["無線"], ["応答が無い"], ["遠くからの操作"], ["本体での操作のすべて"], ["つながれば自動で"], GLD)]
    x = 14
    xs = []
    for t, w in cols:
        xs.append(x); x += w
    y0, rh = 30, 42
    for (t, w), xx in zip(cols, xs):
        o.append(T(xx + 4, 20, t, "start", 10, INK, True))
    for i, r in enumerate(rows):
        y = y0 + i * rh
        o.append(W(14, y, 684, y, c=LIN, lw=1))
        c = r[5]
        for j, ((t, w), xx) in enumerate(zip(cols, xs)):
            lines = r[j]
            cc = PUR if j == 0 else (c if j in (2, 4) else (GRN if j == 3 else INK))
            for q, l in enumerate(lines):
                o.append(T(xx + 4, y + rh / 2 + 4 + (q - (len(lines) - 1) / 2) * 13, l, "start", 9.5, cc, j == 0))
    o.append(W(14, y0 + len(rows) * rh, 684, y0 + len(rows) * rh, c=LIN, lw=1))
    yl = y0 + len(rows) * rh + 20
    o.append(LEGEND(14, yl, [(GLD, "一時的なことがある故障: 自動で戻す"), (ALI, "安全にかかわる故障: 利用者が戻すまで止めたまま"), (GRN, "続ける機能")]))
    return SVG(700, yl + 10, o, "ファンヒータに、過熱を見張る 2 つ目の温度センサ・ファンの回転の確かめ・ヒータの電流の測り・無線を足した機器で、故障ごとに止めるものと続けるものを決めた表（例の決め方）。守りに使う部品が壊れたら、守られていた機能も止める。")
F["e15_faults"] = _f15_faults()

# ---- 5 節: 異常なリセットの回数で段階を下げる ----
def _f15_modes():
    o = []
    st = [(120, "通常", GRN, "故障ごとの表で縮退する"), (360, "縮退", GLD, "ヒータとファンを止め、知らせる"), (600, "安全な停止", ALI, "出力をすべて切り、知らせるだけ")]
    yc = 86
    for x, nm, c, sub in st:
        o.append(STATE(x, yc, 150, 50, nm, c))
        o.append(T(x, yc + 46, sub, "middle", 9.5, c))
    o.append(EDGE(196, yc - 10, 284, yc - 10, None, c=ALI))
    o.append(T(240, yc - 36, "異常なリセットが", "middle", 9.5, ALI))
    o.append(T(240, yc - 22, "続けて 3 回", "middle", 9.5, ALI, True))
    o.append(EDGE(436, yc - 10, 524, yc - 10, None, c=ALI))
    o.append(T(480, yc - 36, "異常なリセットが", "middle", 9.5, ALI))
    o.append(T(480, yc - 22, "続けて 6 回", "middle", 9.5, ALI, True))
    o.append(EDGE(284, yc + 12, 196, yc + 12, None, c=GRN))
    o.append(T(240, yc + 26, "10 分続けて正常", "middle", 9.5, GRN))
    # 安全な停止 → 通常（下を回る）
    o.append(PATH("M%g,%g C%g,%g %g,%g %g,%g" % (600, yc + 60, 560, yc + 130, 160, yc + 130, 120, yc + 62), c=GRN, lw=1.5))
    o.append(_head(126, yc + 74, 120, yc + 62, GRN, 7))
    o.append(T(360, yc + 130, "利用者が入れ直す・電源を入れ直す（POR）と、回数を 0 に戻す", "middle", 9.5, GRN, True))
    o.append(T(14, yc + 156, "異常なリセット: BOR とウォッチドッグによるもの。回数はリセットで消えない RAM に、確かめの値と一緒に数える。", "start", 9.5, MUT))
    o.append(T(14, yc + 172, "1・2 回目は、待つ時間を延ばしてからやり直す（3 節）。電源が POR より下まで下がると数えられない。", "start", 9.5, MUT))
    return SVG(700, yc + 182, o, "異常なリセットの回数で、縮退の段階を下げる（例の決め方: 3 回で縮退、6 回で安全な停止）。決めた時間正常に動くか、利用者が入れ直すと、回数を 0 に戻す。")
F["e15_modes"] = _f15_modes()

# ---- 6 節: 起動の手順 ----
def _f15_boot():
    o = []
    steps = [("リセット・電源が入る", MUT), ("1 ピンを切る側の値にしてから出力に", GRN), ("2 原因と記録を読み、段階を決める", SIG),
             ("3 電源・センサ・スイッチを確かめる", SIG), ("4 原因ごとに、再開してよいものを決める", GLD), ("5 危なくないものから、間を空けて入れる", PUR)]
    x, w, h, y0, dy = 14, 290, 30, 14, 44
    for i, (t, c) in enumerate(steps):
        y = y0 + i * dy
        o.append(RECT(x, y, w, h, 7, soft(c), c, 1.3))
        o.append(T(x + w / 2, y + 20, t, "middle", 10, c, True))
        if i + 1 < len(steps):
            o.append(ARR(x + w / 2, y + h, x + w / 2, y + dy - 1, c=MUT, lw=1.3, head=6))
    # 4 の分かれ
    y4 = y0 + 4 * dy + h / 2
    rows = [("POR", ["前の状態が分からない。危険な動作は", "利用者の操作を待つ（06 章 4 節）"]),
            ("BOR", ["重い負荷をすぐ動かさず、待つ時間を", "延ばす。続けば縮退（3・5 節）"]),
            ("ウォッチドッグ", ["プログラムの誤りを疑って記録する。", "危険な動作は利用者の操作を待つ"]),
            ("更新の試しの起動", ["自己診断を通してから動かし、", "確定する（この節の後半）"])]
    xr, yr0, rh = 360, 12, 58
    for i, (nm, txt) in enumerate(rows):
        y = yr0 + i * rh
        o.append(RECT(xr, y, 326, rh - 6, 6, GOSOFT, GLD, 1.1))
        o.append(T(xr + 8, y + 16, nm, "start", 10, GLD, True))
        for q, l in enumerate(txt):
            o.append(T(xr + 8, y + 31 + q * 13, l, "start", 9, INK))
        o.append(W(x + w + 4, y4, xr - 14, y + (rh - 6) / 2, c=GLD, lw=1.1, dash="3 2"))
    return SVG(700, y0 + 6 * dy, o, "原因によらず同じ手順で起動する。危険なアクチュエータのピンを最初に切る側にし、原因と記録・電源・センサ・スイッチを確かめてから、原因ごとの決まりで再開してよいものを選ぶ。")
F["e15_boot"] = _f15_boot()

# ---- 6 節: 更新の間 ----
def _f15_update():
    o = []
    x0, x1 = 120, 690
    segs = [(0, 26, "古い版が動く（取り込み）", SIG, "制御している", PUR),
            (26, 38, "手順で止める", SIG, "安全な状態へ", GRN),
            (38, 60, "ブートローダ（例 19 s）", MUT, "既定の状態（切）", GRN),
            (60, 80, "新しい版の試しの起動", GLD, "既定の状態のまま", GRN),
            (80, 100, "確定して動く", SIG, "再開", PUR)]
    X = lambda u: x0 + u / 100.0 * (x1 - x0)
    for y, lab in ((30, "プログラム"), (66, "アクチュエータ")):
        o.append(T(x0 - 10, y + 16, lab, "end", 10, INK, True))
    for a, b, t1, c1, t2, c2 in segs:
        for y, t, c in ((30, t1, c1), (66, t2, c2)):
            o.append(RECT(X(a), y, X(b) - X(a), 24, 2, soft(c), c, 1.1))
            lines = [t] if X(b) - X(a) >= tw(t, 9) + 6 else wrap(t, max(3, int((X(b) - X(a) - 6) / 9)))
            for q, l in enumerate(lines[:2]):
                o.append(T((X(a) + X(b)) / 2, y + 16 + (q - (len(lines[:2]) - 1) / 2) * 11, l, "middle", 9 if len(lines) == 1 else 8.5, c, True))
    # 自己診断に通らない → ロールバック
    yb = 116
    o.append(ARR(X(71), 56, X(71), yb - 2, c=ALI, lw=1.3, head=6))
    o.append(RECT(X(54), yb, X(100) - X(54), 26, 5, ASOFT, ALI, 1.1))
    o.append(T((X(54) + X(100)) / 2, yb + 17, "自己診断に通らない・固まる → ブートローダが元の版に戻す", "middle", 9, ALI, True))
    notes = ["切り替えの前: 動作の途中・利用者が使っている間・電池の電圧が下限に近いときは切り替えない（05 章 6 節）。",
             "ブートローダの間: アクチュエータのピンに触らない。止められないウォッチドッグには合図を送る。",
             "試しの起動: 起動の手順の 1〜3 と、全タスクのチェックイン（4 節）を確かめてから、危険なアクチュエータを動かす。"]
    for i, t in enumerate(notes):
        o.append(T(14, yb + 50 + i * 16, t, "start", 9.5, MUT))
    return SVG(700, yb + 50 + 3 * 16, o, "ファームウェアの更新の間のプログラムとアクチュエータ（長さは模式図。入れ替えの時間は組み込み通信シリーズ 22 章 6 節の例）。切り替えの前に手順で止め、ブートローダと試しの起動の間は既定の状態で待ち、確かめてから再開する。")
F["e15_update"] = _f15_update()
