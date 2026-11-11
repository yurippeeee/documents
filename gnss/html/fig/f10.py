# -*- coding: utf-8 -*-
# 10 章 モジュールの回路 の図
import numpy as _f10_np

# ---- 例の値（本文・デモと同じ） ----
_F10_L1 = 1575.42                     # L1 [MHz]
_F10_HB = 1.023                       # 主ローブの半分の幅 [MHz]
_F10_CN0 = 47.5                       # 9 章の例の C/N0 [dB-Hz]（電源の雑音が無いとき）
_F10_INT = (40.0, 20e3)               # 例のモデル: モジュールの中の電源の回路の PSRR（直流の値 [dB]、折れる周波数 [Hz]）
_F10_EXT = (60.0, 10e3)               # 例のモデル: 外付けの LDO の PSRR
_F10_V1 = 1.0                         # 例のモデル: RF の段に残った揺れがこの大きさ [mVpp] で N_p = N_0
_F10_IBK = 15e-6                      # バックアップの電流 [A]
_F10_VMIN = 1.65                      # バックアップ電源の最低の電圧 [V]


def _f10_psrr(f, a0db, fp):
    """例のモデルの PSRR [dB]: 20 log10 |1 + A0/(1 + j f/fp)|。"""
    a0 = 10 ** (a0db / 20.0)
    return 20 * math.log10(abs(1 + a0 / (1 + 1j * f / fp)))


def _f10_cn0(vr, f, ldo, v1=_F10_V1):
    """スイッチング電源の出力の揺れ vr [mVpp]・周波数 f [Hz]・外付けの LDO の有無 → (PSRR の合計, RF の段の揺れ, N_p/N_0, C/N0)。"""
    att = _f10_psrr(f, *_F10_INT) + (_f10_psrr(f, *_F10_EXT) if ldo else 0.0)
    v = vr * 10 ** (-att / 20.0)
    q = (v / v1) ** 2
    return att, v, q, _F10_CN0 - 10 * math.log10(1 + q)


# ---- 例の NMEA の文（12 章の形。w10.js の _w10_nmea と同じ作り方） ----
_F10_SATS = {
    "GP": [(5, 45, 123, 47), (13, 62, 45, 49), (15, 30, 210, 44), (18, 15, 300, 38), (20, 72, 280, 50),
           (23, 25, 150, 42), (24, 40, 330, 45), (29, 10, 60, 36), (30, 5, 250, None), (31, 2, 100, None)],
    "GL": [(66, 35, 20, 43), (67, 55, 110, 46), (76, 20, 250, 40), (77, 48, 300, 44), (82, 8, 180, None), (83, 3, 140, None)],
    "GA": [(2, 40, 70, 45), (7, 65, 200, 48), (8, 22, 320, 41), (13, 30, 140, 43), (26, 50, 260, 46), (30, 12, 30, 37), (33, 4, 190, None)],
    "GB": [(6, 55, 190, 42), (9, 62, 210, 44), (16, 48, 170, 43), (19, 33, 60, 45), (20, 70, 320, 47), (29, 25, 280, 41),
           (35, 15, 110, 38), (44, 6, 40, None)],
}


def _f10_nmea(nsys=2, kinds=("GGA", "RMC", "GSA", "GSV", "VTG", "GLL")):
    """例の文の並び [(種類, 文（$ から CR LF まで）)]。nsys は衛星系の数（GPS・GLONASS・Galileo・BeiDou の順）。"""
    talk = ["GP", "GL", "GA", "GB"][:nsys]
    used = [[s[0] for s in _F10_SATS[t] if s[3] is not None] for t in talk]
    nused = sum(len(u) for u in used)
    bodies = []
    for k in kinds:
        if k == "GGA":
            bodies.append((k, "GNGGA,092750.00,3540.86000,N,13946.02000,E,1,%02d,0.80,3.3,M,36.7,M,," % nused))
        elif k == "RMC":
            bodies.append((k, "GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"))
        elif k == "GSA":
            for u in used:
                bodies.append((k, "GNGSA,A,3," + ",".join(["%02d" % v for v in u] + [""] * (12 - len(u))) + ",1.50,0.80,1.27"))
        elif k == "GSV":
            for t in talk:
                ss = _F10_SATS[t]
                nm = (len(ss) + 3) // 4
                for m in range(nm):
                    fl = [t + "GSV", str(nm), str(m + 1), "%02d" % len(ss)]
                    for s in ss[4 * m:4 * m + 4]:
                        fl += ["%02d" % s[0], "%02d" % s[1], "%03d" % s[2], "" if s[3] is None else "%02d" % s[3]]
                    bodies.append((k, ",".join(fl)))
        elif k == "VTG":
            bodies.append((k, "GNVTG,,T,,M,0.012,N,0.022,K,A"))
        elif k == "GLL":
            bodies.append((k, "GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A"))
    out = []
    for k, b in bodies:
        x = 0
        for ch in b:
            x ^= ord(ch)
        out.append((k, "$%s*%02X\r\n" % (b, x)))
    return out


# =====================================================================
# 図の補助（回路の記号）
# =====================================================================
def _f10_res_h(o, x1, x2, y, c=INK):
    """横向きの抵抗（ジグザグ）。"""
    n = 6; w = (x2 - x1) / n
    pts = [(x1, y)]
    for i in range(n):
        pts.append((x1 + w * (i + 0.5), y + (-5 if i % 2 == 0 else 5)))
    pts.append((x2, y))
    o.append(PL(pts, c=c, lw=1.5))


def _f10_res_v(o, x, y1, y2, c=INK):
    """縦向きの抵抗（ジグザグ）。"""
    n = 6; h = (y2 - y1) / n
    pts = [(x, y1)]
    for i in range(n):
        pts.append((x + (-5 if i % 2 == 0 else 5), y1 + h * (i + 0.5)))
    pts.append((x, y2))
    o.append(PL(pts, c=c, lw=1.5))


def _f10_cap_v(o, x, y, c=INK, w=12):
    """縦の線の途中のコンデンサ（横の 2 枚の板。y は 2 枚の中央）。"""
    o.append(W(x - w, y - 3, x + w, y - 3, c=c, lw=2))
    o.append(W(x - w, y + 3, x + w, y + 3, c=c, lw=2))


def _f10_cap_h(o, x, y, c=INK):
    """横の線の途中のコンデンサ（縦の 2 枚の板）。"""
    o.append(W(x - 3, y - 9, x - 3, y + 9, c=c, lw=2))
    o.append(W(x + 3, y - 9, x + 3, y + 9, c=c, lw=2))


def _f10_gnd(o, x, y, c=MUT):
    """グラウンドの記号（上の点 (x, y) に線がつながる）。"""
    o.append(W(x - 9, y, x + 9, y, c=c, lw=1.6))
    o.append(W(x - 6, y + 4, x + 6, y + 4, c=c, lw=1.4))
    o.append(W(x - 3, y + 8, x + 3, y + 8, c=c, lw=1.2))


def _f10_diode_h(o, x, y, c=INK, d=1, s=7):
    """横向きのダイオード（d=1 で右向きに電流を通す）。x は中心。"""
    a, b = x - d * s, x + d * s
    o.append(PL([(a, y - s), (a, y + s), (b, y)], c=c, lw=1.4, fill=PAN))
    o.append(W(b, y - s, b, y + s, c=c, lw=1.8))


def _f10_ind_v(o, x, y1, y2, c=INK):
    """縦向きのコイル（半円の連なり）。"""
    n = 4; h = (y2 - y1) / n
    d = "M %g %g" % (x, y1)
    for i in range(n):
        d += " a %g %g 0 0 1 0 %g" % (h / 2, h / 2, h)
    o.append(PATH(d, c=c, lw=1.5))


def _f10_cell(o, x, y, c=INK):
    """電池の記号（縦。(x, y) は中央。上が +）。"""
    o.append(W(x - 11, y - 4, x + 11, y - 4, c=c, lw=1.8))
    o.append(W(x - 6, y + 4, x + 6, y + 4, c=c, lw=3))
    o.append(T(x + 15, y - 1, "+", "start", 9, c, True))


def _f10_lines(o, x, y, lines, sz=9.5, c=INK, lh=13.5, a="start"):
    """複数行の文字（各行は (文字, 色, 太字, 添字を使うか) か、ただの文字）。"""
    for i, l in enumerate(lines):
        if isinstance(l, tuple):
            s, cc, bb = l[0], l[1], l[2] if len(l) > 2 else False
            tx = l[3] if len(l) > 3 else False
        else:
            s, cc, bb, tx = l, c, False, False
        if tx:
            o.append(TX(x, y + i * lh, s, a, sz, cc, bb))
        else:
            o.append(T(x, y + i * lh, s, a, sz, cc, bb))


# =====================================================================
# 1 節: 端子を役割で分けた 6 つの組と、例のモジュールの値
# =====================================================================
def _f10_pins_fig():
    o = []
    mx, my, mw, mh = 268, 34, 164, 300
    o.append(RECT(mx, my, mw, mh, 10, PAN, INK, 1.6))
    o.append(T(mx + mw / 2, my + 22, "GNSS モジュール", "middle", 12, INK, True))
    o.append(T(mx + mw / 2, my + 38, "（例: L1・多衛星系）", "middle", 9.5, MUT))
    o.append(T(mx + mw / 2, my + mh - 12, "端子の名前は例", "middle", 9, MUT))
    # 左の端子と右の端子: (y, 名前, 色, 箱の番号)
    left = [(92, "VCC", PUR, 0), (112, "GND", MUT, 0), (164, "V_BCKP", PUR, 1), (210, "GND", MUT, 2), (228, "RF_IN", SIG, 2),
            (246, "GND", MUT, 2), (272, "VCC_RF", SIG, 2), (292, "ANT_DET", SIG, 2)]
    right = [(92, "TXD", GLD, 3), (112, "RXD", GLD, 3), (136, "SDA・SCL", GLD, 3), (190, "1PPS", GRN, 4),
             (246, "RESET_N", INK, 5), (268, "BOOT", INK, 5), (290, "WAKEUP", INK, 5)]
    # 説明の箱: (x, y, w, h, 題, 色, 行)
    boxes = [
        (10, 62, 228, 64, "電源（2 節）", PUR, ["VCC: 3.3 V（3.0〜3.6 V で動く）", "捕捉中 35 mA・追尾中 25 mA", "GND: 全部をグラウンドの面へ"]),
        (10, 138, 228, 50, "バックアップ電源（3 節）", PUR, ["V_BCKP: 1.65〜3.6 V", "主の電源を切っている間 15 µA"]),
        (10, 202, 228, 104, "RF の入力とアンテナ（9・11 章）", SIG, ["RF_IN: 50 Ω の線でアンテナへ", "両側の GND: 戻る電流の道",
                                                          "VCC_RF: アクティブアンテナの給電", "ANT_DET: 開放・短絡の判定を入れる",
                                                          "（給電 3.3 V・15 mA、9 章の例）"]),
        (462, 62, 228, 104, "通信（4 節）", GLD, ["TXD・RXD: UART", "初め 9600 bit/s・8N1・3.3 V", "1 秒に 1 回、文を出す",
                                                "（例の 11 文で 626 バイト）", "SDA・SCL（I2C）か SPI でも読める"]),
        (462, 172, 228, 50, "時刻（5 節）", GRN, ["1PPS: 立ち上がりが秒の頭", "幅 100 ms・3.3 V"]),
        (462, 236, 228, 76, "制御（6 節）", INK, ["RESET_N: 10 ms 以上 L でリセット", "BOOT: 起動の選択（ふだんは開ける）",
                                                 "WAKEUP: 省電力の動作から起こす"]),
    ]
    for (x, y, w, h, tt, c, ls) in boxes:
        o.append(RECT(x, y, w, h, 7, soft(c), c, 1.2))
        o.append(T(x + 10, y + 17, tt, "start", 10.5, c, True))
        _f10_lines(o, x + 10, y + 33, ls, 9.5, INK, 13.5)
    for (y, nm, c, k) in left:
        o.append(RECT(mx - 7, y - 5, 14, 10, 2, soft(c), c, 1.2))
        o.append(T(mx + 12, y + 3.5, nm, "start", 9.5, c, True, True))
        bx = boxes[k]
        o.append(W(mx - 7, y, bx[0] + bx[2], min(max(y, bx[1] + 8), bx[1] + bx[3] - 8), c=c, lw=1.1))
    for (y, nm, c, k) in right:
        o.append(RECT(mx + mw - 7, y - 5, 14, 10, 2, soft(c), c, 1.2))
        o.append(T(mx + mw - 12, y + 3.5, nm, "end", 9.5, c, True, True))
        bx = boxes[k]
        o.append(W(mx + mw + 7, y, bx[0], min(max(y, bx[1] + 8), bx[1] + bx[3] - 8), c=c, lw=1.1))
    return SVG(700, 344, o, "モジュールの端子の 6 つの組と、例のモジュールの値（端子の名前と値はどれも例。製品によって違う）。")


F["e10_pins"] = _f10_pins_fig()


# =====================================================================
# 1 節: 例の回路の全体
# =====================================================================
def _f10_ant(o, x, y, c=SIG):
    """アクティブアンテナの記号（パッチと覆い）。(x, y) は覆いの下の中央。"""
    o.append(PATH("M %g %g Q %g %g %g %g" % (x - 26, y, x, y - 34, x + 26, y), c=c, lw=1.4, fill=soft(c)))
    o.append(W(x - 26, y, x + 26, y, c=c, lw=1.6))
    o.append(RECT(x - 12, y - 10, 24, 6, 1, c, c, 1))


def _f10_overall_fig():
    o = []
    # モジュール
    mx, my, mw, mh = 286, 122, 150, 214
    o.append(RECT(mx, my, mw, mh, 10, PAN, INK, 1.6))
    o.append(T(mx + mw / 2, my + 112, "GNSS モジュール", "middle", 11, INK, True))
    o.append(T(mx + mw / 2, my + 127, "（例）", "middle", 9.5, MUT))
    def pin(x, y, nm, c, side):
        o.append(RECT(x - 5, y - 5, 10, 10, 2, soft(c), c, 1.1))
        if side == "l":
            o.append(T(x + 9, y + 3.5, nm, "start", 9, c, True, True))
        elif side == "r":
            o.append(T(x - 9, y + 3.5, nm, "end", 9, c, True, True))
        elif side == "t":
            o.append(T(x, y + 17, nm, "middle", 9, c, True, True))
        else:
            o.append(T(x, y - 9, nm, "middle", 9, c, True, True))
    # 上: RF の入力・給電・監視
    pin(306, my, "RF_IN", SIG, "t"); pin(356, my, "VCC_RF", SIG, "t"); pin(406, my, "ANT_DET", SIG, "t")
    # 左: 電源・バックアップ・GND
    pin(mx, 168, "VCC", PUR, "l"); pin(mx, 244, "V_BCKP", PUR, "l"); pin(mx, 306, "GND", MUT, "l")
    # 右: 通信・1PPS・制御
    pin(mx + mw, 160, "TXD", GLD, "r"); pin(mx + mw, 182, "RXD", GLD, "r"); pin(mx + mw, 216, "1PPS", GRN, "r")
    pin(mx + mw, 254, "RESET_N", INK, "r"); pin(mx + mw, 284, "WAKEUP", INK, "r")
    # 下: 起動の選択
    pin(361, my + mh, "BOOT", INK, "b")
    # ---- アンテナ・同軸・バイアス T・監視（9 章） ----
    _f10_ant(o, 44, 80)
    o.append(T(44, 98, "アクティブアンテナ", "middle", 9.5, SIG, True))
    o.append(T(44, 112, "（LNA 入り。9 章）", "middle", 9, MUT))
    yc = 74
    o.append(W(70, yc, 250, yc, c=TEA, lw=4))
    o.append(W(70, yc, 250, yc, c=INK, lw=1.2))
    o.append(T(160, yc - 8, "同軸ケーブル", "middle", 9.5, TEA, True, halo=True))
    o.append(T(160, yc + 18, "芯線に RF と直流", "middle", 9, MUT))
    o.append(D(262, yc, INK, 3))
    o.append(W(250, yc, 280, yc, c=INK, lw=1.4))
    _f10_cap_h(o, 286, yc)
    o.append(W(292, yc, 306, yc, 306, my - 5, c=SIG, lw=1.4))
    o.append(T(286, yc + 24, "C", "middle", 9.5, SIG, True))
    o.append(W(262, yc, 262, 64, c=INK, lw=1.4))
    _f10_ind_v(o, 262, 34, 64)
    o.append(T(254, 52, "L", "end", 9.5, PUR, True))
    o.append(W(262, 34, 262, 28, 296, 28, c=PUR, lw=1.4))
    _f10_res_h(o, 296, 330, 28, PUR)
    o.append(W(330, 28, 356, 28, 356, my - 5, c=PUR, lw=1.4))
    o.append(TX(313, 15, "R_s 22 Ω", "middle", 9, PUR, True, halo=True))
    o.append(D(296, 28, PUR, 2.6)); o.append(D(330, 28, PUR, 2.6))
    o.append(W(296, 28, 296, 48, 384, 48, c=MUT, lw=1, dash="3 2"))
    o.append(W(330, 28, 330, 40, 384, 40, c=MUT, lw=1, dash="3 2"))
    o.append(RECT(384, 32, 50, 24, 4, soft(SIG), SIG, 1.1))
    o.append(T(409, 48, "比較器", "middle", 9, SIG, True))
    o.append(W(406, 56, 406, my - 5, c=SIG, lw=1.2))
    o.append(T(446, 36, "監視（9 章 6 節）", "start", 9, SIG, True))
    o.append(T(446, 50, "開放 3 mA 未満", "start", 9, MUT))
    o.append(T(446, 63, "短絡 50 mA 超", "start", 9, MUT))
    o.append(T(196, 116, "バイアス T（9 章 5 節）", "middle", 9, PUR, True))
    # ---- 電源（2 節）。LDO の EN で主の電源を入れ切りする（6 節） ----
    o.append(BOX(8, 150, 76, 36, "電池・5 V", None, c=PUR, sz=9.5))
    o.append(ARR(84, 168, 102, 168, c=PUR, lw=1.4))
    o.append(BOX(102, 150, 66, 36, "LDO", "EN 付き", c=PUR, sz=10, ssz=8.5))
    o.append(T(135, 144, "2 節", "middle", 9, PUR, True))
    o.append(W(168, 168, mx - 5, 168, c=PUR, lw=1.4))
    o.append(D(230, 168, PUR, 2.8))
    o.append(W(230, 168, 230, 186, c=PUR, lw=1.2))
    _f10_cap_v(o, 230, 189, PUR, 9)
    o.append(W(230, 192, 230, 200, c=PUR, lw=1.2))
    _f10_gnd(o, 230, 200)
    o.append(T(244, 190, "10 µF", "start", 8.5, PUR))
    o.append(T(244, 201, "+ 0.1 µF", "start", 8.5, PUR))
    # ---- バックアップ電源（3 節） ----
    o.append(BOX(150, 226, 82, 36, "電池か", "キャパシタ", c=PUR, sz=9.5, ssz=9.5, sc=PUR))
    o.append(T(191, 276, "3 節", "middle", 9, PUR, True))
    o.append(W(232, 244, 246, 244, c=PUR, lw=1.4))
    _f10_diode_h(o, 254, 244, PUR)
    o.append(W(262, 244, mx - 5, 244, c=PUR, lw=1.4))
    # ---- GND ----
    o.append(W(mx - 5, 306, 262, 306, 262, 314, c=MUT, lw=1.4))
    _f10_gnd(o, 262, 314)
    # ---- マイコン ----
    cx = 566
    o.append(RECT(cx, 140, 124, 168, 9, PAN, INK, 1.5))
    o.append(T(cx + 62, 324, "マイコン", "middle", 11, INK, True))
    rows = [(160, "受信（RX）", GLD, 1), (182, "送信（TX）", GLD, -1), (216, "タイマの入力", GRN, 1), (254, "GPIO（OD）", INK, -1), (284, "GPIO", INK, -1)]
    for (y, nm, c, d) in rows:
        o.append(T(cx + 8, y + 3.5, nm, "start", 9, c, True))
        if d > 0:
            o.append(ARR(mx + mw + 5, y, cx - 2, y, c=c, lw=1.4, head=6))
        else:
            o.append(ARR(cx, y, mx + mw + 7, y, c=c, lw=1.4, head=6))
    o.append(T(501, 152, "UART（4 節）", "middle", 9, GLD, True, halo=True))
    o.append(T(501, 208, "1PPS（5 節）", "middle", 9, GRN, True, halo=True))
    o.append(T(501, 246, "リセット（6 節）", "middle", 9, INK, True, halo=True))
    o.append(T(501, 276, "起こす（6 節）", "middle", 9, INK, True, halo=True))
    # LDO の EN（マイコンから）
    o.append(W(cx + 62, 330, cx + 62, 392, 135, 392, 135, 198, c=GLD, lw=1.2, dash="4 3"))
    o.append(_head(135, 205, 135, 187, GLD, 6))
    o.append(T(440, 386, "EN: 主の電源を入れ切りする（6 節）", "middle", 9, GLD, True, halo=True))
    # 起動の選択: 試験の点
    o.append(W(361, my + mh + 5, 361, 358, c=INK, lw=1.2))
    o.append(CIRC(361, 363, 5, c=INK, lw=1.4, fill=SCR))
    o.append(T(372, 367, "試験の点（ふだんは開ける。6 節）", "start", 9, INK))
    return SVG(700, 402, o, "例の回路の全体（部品の値は例）。各部分を、括弧の中の節で決める。")


F["e10_overall"] = _f10_overall_fig()
