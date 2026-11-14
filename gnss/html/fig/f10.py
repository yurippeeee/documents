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
    o.append(T(mx + mw / 2, my + 38, "（例: L1・複数の衛星系）", "middle", 9.5, MUT))
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
        (462, 62, 228, 90, "通信（4 節）", GLD, ["TXD・RXD: UART", "初め 9600 bit/s・8N1・3.3 V", "1 秒に 1 回、文を出す",
                                                "SDA・SCL（I2C）か SPI でも読める"]),
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


# =====================================================================
# 2 節: 電源の雑音が受信に入る 2 つの道と、L1 の近くに落ちる高調波
# =====================================================================
def _f10_wavy(x1, x2, y, amp=5, per=14):
    d = "M %g %g" % (x1, y)
    n = max(2, int((x2 - x1) / per * 8))
    for i in range(1, n + 1):
        x = x1 + (x2 - x1) * i / n
        d += " L %g %g" % (x, y + amp * math.sin(2 * math.pi * (x - x1) / per))
    return d


def _f10_noisepath_fig():
    o = []
    o.append(T(14, 18, "(a) 電源の雑音が受信に入る 2 つの道", "start", 11.5, INK, True))
    # モジュールの範囲
    o.append(RECT(330, 30, 262, 160, 10, "none", MUT, 1.1, dash="5 4"))
    o.append(T(586, 44, "モジュールの中", "end", 9.5, MUT, True))
    # 道 1
    y1 = 70
    o.append(T(14, y1 - 22, "道 1: 電源の線", "start", 10, ALI, True))
    o.append(BOX(14, y1 - 18, 96, 36, "スイッチング", "電源", c=ALI, sz=9.5, ssz=9.5, sc=ALI))
    o.append(ARR(110, y1, 128, y1, c=ALI, lw=1.6))
    o.append(BOX(128, y1 - 18, 84, 36, "外付けの", "LDO", c=PUR, sz=9.5, ssz=9.5, sc=PUR))
    o.append(ARR(212, y1, 236, y1, c=ALI, lw=1.6))
    o.append(BOX(236, y1 - 18, 84, 36, "電源の端子", None, c=MUT, sz=9.5))
    o.append(ARR(320, y1, 344, y1, c=ALI, lw=1.6))
    o.append(BOX(344, y1 - 18, 96, 36, "中の電源の", "回路", c=PUR, sz=9.5, ssz=9.5, sc=PUR))
    o.append(ARR(440, y1, 458, y1, c=ALI, lw=1.6))
    o.append(BOX(458, y1 - 18, 124, 36, "局部発振器・", "A/D 変換", c=SIG, sz=9.5, ssz=9.5, sc=SIG))
    o.append(T(170, y1 + 32, "揺れを小さくする", "middle", 9, PUR, True))
    o.append(T(392, y1 + 32, "小さくする（製品による）", "middle", 9, PUR, True))
    o.append(T(520, y1 + 32, "位相と標本が揺れる", "middle", 9, SIG))
    o.append(ARR(582, y1, 604, y1, c=ALI, lw=1.6))
    o.append(T(608, y1 - 4, "帯域の中に", "start", 9.5, ALI, True))
    o.append(T(608, y1 + 10, "不要な成分", "start", 9.5, ALI, True))
    # 道 2
    y2 = 152
    o.append(T(14, y2 - 24, "道 2: 空間と基板", "start", 10, ALI, True))
    o.append(BOX(14, y2 - 18, 96, 36, "スイッチの", "入れ切り", c=ALI, sz=9.5, ssz=9.5, sc=ALI))
    o.append(PATH(_f10_wavy(110, 226, y2), c=ALI, lw=1.6))
    o.append(_head(220, y2, 234, y2, ALI, 7))
    o.append(T(168, y2 + 26, "高調波（20 章）", "middle", 9, ALI, True))
    o.append(BOX(236, y2 - 18, 84, 36, "アンテナ・", "RF の配線", c=SIG, sz=9.5, ssz=9.5, sc=SIG))
    o.append(T(278, y2 + 32, "離す（11 章）", "middle", 9, GRN, True))
    o.append(ARR(320, y2, 344, y2, c=ALI, lw=1.6))
    o.append(BOX(344, y2 - 18, 96, 36, "SAW フィルタ", None, c=SIG, sz=9.5))
    o.append(T(392, y2 + 32, "L1 の中は通す", "middle", 9, ALI, True))
    o.append(ARR(440, y2, 458, y2, c=ALI, lw=1.6))
    o.append(BOX(458, y2 - 18, 124, 36, "LNA・混合器", None, c=SIG, sz=9.5))
    o.append(ARR(582, y2, 604, y2, c=ALI, lw=1.6))
    o.append(T(608, y2 - 4, "帯域の中の", "start", 9.5, ALI, True))
    o.append(T(608, y2 + 10, "雑音になる", "start", 9.5, ALI, True))
    # (b) L1 の近くの高調波
    yb = 218
    o.append(T(14, yb, "(b) L1 の近くに落ちる高調波（スイッチング周波数の整数倍）", "start", 11.5, INK, True))
    lo, hi = _F10_L1 - 3.0, _F10_L1 + 3.0
    rows = [(0.5, "500 kHz", ALI), (2.7, "2.7 MHz", GRN)]
    for k, (fs, lab, c) in enumerate(rows):
        p = Plot(150, yb + 22 + k * 64, 520, 40, (lo, hi), (0, 1))
        o.append(RECT(p.X(_F10_L1 - _F10_HB), p.y, p.X(_F10_L1 + _F10_HB) - p.X(_F10_L1 - _F10_HB), p.h, 0, SSOFT, "none", 0))
        o.append(W(p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.1))
        o.append(W(p.X(_F10_L1), p.y, p.X(_F10_L1), p.y + p.h, c=SIG, lw=1, dash="3 3"))
        n0 = int(math.ceil(lo / fs)); n1 = int(math.floor(hi / fs))
        nin = []
        for n in range(n0, n1 + 1):
            f = n * fs
            inb = abs(f - _F10_L1) <= _F10_HB
            cc = ALI if inb else MUT
            o.append(W(p.X(f), p.y + p.h, p.X(f), p.y + 6, c=cc, lw=2.2 if inb else 1.4))
            if inb:
                nin.append(n)
        o.append(T(14, p.y + 18, lab, "start", 10.5, c, True))
        if nin:
            o.append(T(14, p.y + 33, "%d 本が帯域の中" % len(nin), "start", 9.5, ALI, True))
        else:
            o.append(T(14, p.y + 33, "帯域の中に無い", "start", 9.5, GRN, True))
        if k == 1:
            for n in range(n0, n1 + 1):
                o.append(T(p.X(n * fs), p.y - 3, "n = %d" % n, "middle", 9, MUT, halo=True))
        else:
            o.append(T(p.X(nin[0] * fs) - 4, p.y - 3, "n = %d〜%d（0.5 MHz おき）" % (nin[0], nin[-1]), "start", 9, ALI, True, halo=True))
    p = Plot(150, yb + 22 + 64, 520, 40, (lo, hi), (0, 1))
    for v in range(1573, 1579):
        o.append(W(p.X(v), p.y + p.h, p.X(v), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, "%d" % v, "middle", 9.5, MUT))
    o.append(T(p.X(_F10_L1), p.y + p.h + 30, "周波数 f [MHz]（青い帯は L1 の主ローブ ±1.023 MHz）", "middle", 10, MUT))
    return SVG(700, yb + 22 + 64 + 40 + 40, o, "(a) 電源の雑音の 2 つの道。(b) スイッチング周波数 500 kHz と 2.7 MHz の高調波（例の値）の、L1 の近くの並び。")


F["e10_noisepath"] = _f10_noisepath_fig()


# =====================================================================
# 2 節: PSRR の周波数特性（例のモデル）と、C/N0 の下がりと頭打ち
# =====================================================================
def _f10_fhz(v):
    return {1e3: "1 k", 1e4: "10 k", 1e5: "100 k", 1e6: "1 M", 1e7: "10 M"}.get(v, "")


def _f10_psrr_fig():
    o = []
    o.append(T(14, 18, "(a) PSRR の周波数特性（例のモデル）", "start", 11.5, INK, True))
    p = Plot(66, 40, 262, 190, (1e3, 1e7), (0, 100), xlog=True)
    o.append(p.axes(xl="雑音の周波数 f [Hz]", yl="PSRR [dB]", xt=[1e3, 1e4, 1e5, 1e6, 1e7], yt=[0, 20, 40, 60, 80, 100], xfmt=_f10_fhz))
    fs = _f10_np.logspace(3, 7, 200)
    ext = [(f, _f10_psrr(f, *_F10_EXT)) for f in fs]
    itn = [(f, _f10_psrr(f, *_F10_INT)) for f in fs]
    tot = [(f, _f10_psrr(f, *_F10_EXT) + _f10_psrr(f, *_F10_INT)) for f in fs]
    o.append(p.clip(tot, c=GRN, lw=2.4))
    o.append(p.clip(ext, c=SIG, lw=1.8, dash="6 3"))
    o.append(p.clip(itn, c=PUR, lw=1.8, dash="2 3"))
    for f, lab in ((5e5, "500 kHz"), (2e6, "2 MHz")):
        o.append(W(p.X(f), p.y, p.X(f), p.y + p.h, c=FNT, lw=1, dash="3 3"))
        o.append(T(p.X(f), p.y - 4, lab, "middle", 9, MUT, True))
        a = _f10_psrr(f, *_F10_EXT) + _f10_psrr(f, *_F10_INT)
        b = _f10_psrr(f, *_F10_INT)
        o.append(D(p.X(f), p.Y(a), GRN, 3.6))
        o.append(T(p.X(f) + 5, p.Y(a) - 6, "%.1f" % a, "start", 9.5, GRN, True, halo=True))
        o.append(D(p.X(f), p.Y(b), PUR, 3.6))
        o.append(T(p.X(f) + 5, p.Y(b) - 5, "%.1f" % b, "start", 9.5, PUR, True, halo=True))
    o.append(LEGL(30, 290, [(GRN, None, "合わせた値"), (SIG, "6 3", "外付けの LDO"), (PUR, "2 3", "中の電源の回路")], sz=9.5, gap=12))
    # (b) C/N0
    o.append(TX(372, 18, "(b) 揺れの大きさと C/N_0（例のモデル）", "start", 11.5, INK, True))
    q = Plot(430, 40, 250, 190, (1, 300), (20, 50), xlog=True)
    o.append(q.axes(xl="スイッチング電源の出力の揺れ [mVpp]", yl="C/N_0 [dB-Hz]", xt=[1, 10, 100], yt=[20, 25, 30, 35, 40, 45, 50],
                    xfmt=lambda v: "%g" % v))
    o.append(W(q.x, q.Y(_F10_CN0), q.x + q.w, q.Y(_F10_CN0), c=GRN, lw=1, dash="5 3"))
    o.append(T(q.x + 4, q.Y(_F10_CN0) - 5, "頭打ち 47.5", "start", 9, GRN, True, halo=True))
    o.append(W(q.x, q.Y(25), q.x + q.w, q.Y(25), c=MUT, lw=1, dash="3 3"))
    o.append(T(q.x + q.w - 4, q.Y(25) + 13, "追尾の目安 25", "end", 9, MUT, True, halo=True))
    vs = _f10_np.logspace(0, math.log10(300), 160)
    cases = [(2e6, False, ALI, None, "2 MHz・LDO なし"), (2e6, True, GLD, "6 3", "2 MHz・LDO あり"), (5e5, True, GRN, None, "500 kHz・LDO あり")]
    for f, ldo, c, dash, lab in cases:
        o.append(q.clip([(v, _f10_cn0(v, f, ldo)[3]) for v in vs], c=c, lw=2.2, dash=dash))
        y = _f10_cn0(20, f, ldo)[3]
        o.append(D(q.X(20), q.Y(y), c, 4))
        o.append(T(q.X(20) + 6, q.Y(y) + (12 if y < 30 else -6), "%.1f" % y, "start", 9.5, c, True, halo=True))
    o.append(W(q.X(20), q.y, q.X(20), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(20), q.y - 4, "20 mVpp", "middle", 9, MUT, True))
    o.append(LEGL(372, 290, [(ALI, None, "2 MHz・LDO なし"), (GLD, "6 3", "2 MHz・LDO あり")], sz=9.5, gap=12))
    o.append(LEGL(372, 308, [(GRN, None, "500 kHz・LDO あり")], sz=9.5, gap=12))
    return SVG(700, 318, o, "PSRR（例のモデル。外付けの LDO 60 dB・10 kHz、中の電源の回路 40 dB・20 kHz）と、RF の段に残った揺れ 1 mVpp で雑音の密度が熱雑音と同じになるとした例のモデルの C/N0。")


F["e10_psrr"] = _f10_psrr_fig()


# =====================================================================
# 2 節: 電流の変化と、電源の電圧の下がり
# =====================================================================
def _f10_current_fig():
    o = []
    o.append(T(14, 18, "(a) 電源を入れてからの電流（例: コールドスタート）", "start", 11.5, INK, True))
    p = Plot(66, 40, 262, 170, (-5, 60), (0, 60))
    o.append(p.axes(xl="電源を入れてからの時間 t [s]", yl="電流 [mA]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[0, 10, 20, 30, 40, 50, 60]))
    o.append(p.steps([(-5, 0), (0, 35), (32, 25), (60, 25)], c=PUR, lw=2.4))
    o.append(W(p.x, p.Y(50), p.x + p.w, p.Y(50), c=ALI, lw=1.1, dash="5 3"))
    o.append(T(p.X(-3), p.Y(50) - 5, "+ アンテナ 15 mA = 50 mA", "start", 9.5, ALI, True, halo=True))
    o.append(T(p.X(16), p.Y(35) - 6, "捕捉中 35 mA", "middle", 9.5, PUR, True, halo=True))
    o.append(T(p.X(46), p.Y(25) - 6, "追尾中 25 mA", "middle", 9.5, PUR, True, halo=True))
    o.append(W(p.X(32), p.Y(25), p.X(32), p.Y(8), c=MUT, lw=1, dash="3 3"))
    o.append(T(p.X(32) + 4, p.Y(8) + 4, "最初の位置（例 32 s）", "start", 9, MUT, False, halo=True))
    o.append(T(p.X(0) + 4, p.Y(4), "35 mA の立ち上がり", "start", 9, ALI, True, halo=True))
    # (b) 電圧の下がり
    o.append(TX(372, 18, "(b) 35 mA の立ち上がりと電圧の下がり", "start", 11.5, INK, True))
    q = Plot(430, 40, 250, 170, (0.47, 47), (1, 1000), xlog=True, ylog=True)
    o.append(q.axes(xl="電源の端子のそばの容量 C_d [µF]", yl="下がり ΔV [mV]", xt=[1, 10], yt=[1, 10, 100, 1000],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    di, dt, esr = 35e-3, 5e-6, 0.01
    cs = _f10_np.logspace(math.log10(0.47), math.log10(47), 120)
    o.append(q.clip([(c, (di * dt / (c * 1e-6) + di * esr) * 1e3) for c in cs], c=ALI, lw=2.4))
    o.append(W(q.x, q.Y(300), q.x + q.w, q.Y(300), c=MUT, lw=1, dash="5 3"))
    o.append(T(q.x + q.w - 4, q.Y(300) - 5, "下限 3.0 V までの余裕 300 mV", "end", 9, MUT, True, halo=True))
    for c in (1.0, 10.0):
        v = (di * dt / (c * 1e-6) + di * esr) * 1e3
        o.append(D(q.X(c), q.Y(v), ALI, 4))
        o.append(T(q.X(c) + 7, q.Y(v) - 6, "%g µF: %.0f mV" % (c, v), "start", 9.5, ALI, True, halo=True))
    o.append(TX(372, 262, "ΔV ≈ ΔI·Δt/C_d + ΔI·R_{ESR}（35 mA・5 µs・10 mΩ）", "start", 9.5, INK))
    return SVG(700, 272, o, "例のモジュールの電流と、電流が立ち上がったときの電源の電圧の下がり（LDO が追いつくまでの時間 5 µs は代表値）。")


F["e10_current"] = _f10_current_fig()


# =====================================================================
# 2 節: TCXO の温度の急な変化と、PLL の位相のずれ・追尾の目安
# =====================================================================
_F10_BL = 15.0
_F10_WN = _F10_BL * 8 * 0.707 / (1 + 4 * 0.707 ** 2)     # 2 次の PLL（ζ = 0.707）の固有角周波数 [rad/s]


def _f10_psi(sT, rate):
    """温度の変わる速さ rate [°C/s]・周波数の変わり方 sT [ppm/°C] → 2 次の PLL の位相のずれ [°]。"""
    fdot = sT * 1e-6 * rate * _F10_L1 * 1e6
    return math.degrees(2 * math.pi * fdot / _F10_WN ** 2)


def _f10_need(dyn):
    """位相のずれ dyn [°] があるとき、3σ + dyn = 45° になる C/N0 [dB-Hz]（5 章 4 節の目安。1 ms・15 Hz）。"""
    if dyn >= 45:
        return None
    def sig(x):
        c = 10 ** (x / 10)
        return math.degrees(math.sqrt(_F10_BL / c * (1 + 1 / (2 * 1e-3 * c))))
    lo, hi = 10.0, 90.0
    for _ in range(80):
        m = (lo + hi) / 2
        if 3 * sig(m) + dyn > 45:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def _f10_tcxo_fig():
    o = []
    o.append(TX(14, 18, "(a) 位相のずれ ψ_e（2 次の PLL、帯域 15 Hz）", "start", 11.5, INK, True))
    p = Plot(66, 40, 262, 170, (0, 2), (0, 90))
    o.append(p.axes(xl="温度の変わる速さ [°C/s]", yl="位相のずれ ψ_e [°]", xt=[0, 0.5, 1, 1.5, 2], yt=[0, 15, 30, 45, 60, 75, 90],
                    xfmt=lambda v: "%g" % v))
    slopes = [(0.02, GRN, "0.02 ppm/°C"), (0.05, GLD, "0.05 ppm/°C（例）"), (0.1, ALI, "0.1 ppm/°C")]
    rs = _f10_np.linspace(0, 2, 81)
    for sT, c, lab in slopes:
        o.append(p.clip([(r, _f10_psi(sT, r)) for r in rs], c=c, lw=2.2))
    o.append(W(p.x, p.Y(45), p.x + p.w, p.Y(45), c=MUT, lw=1, dash="5 3"))
    o.append(T(p.x + p.w - 4, p.Y(45) - 5, "目安 45°", "end", 9, MUT, True, halo=True))
    v = _f10_psi(0.05, 1.0)
    o.append(D(p.X(1), p.Y(v), GLD, 4.5))
    o.append(T(p.X(1) + 7, p.Y(v) + 14, "%.1f°" % v, "start", 9.5, GLD, True, halo=True))
    o.append(LEGL(30, 262, [(c, None, lab) for sT, c, lab in slopes], sz=9.5, gap=12))
    # (b) 追尾の目安の C/N0
    o.append(TX(372, 18, "(b) 追尾を続けられる C/N_0 の目安", "start", 11.5, INK, True))
    q = Plot(430, 40, 250, 170, (0, 2), (24, 45))
    o.append(q.axes(xl="温度の変わる速さ [°C/s]", yl="C/N_0 [dB-Hz]", xt=[0, 0.5, 1, 1.5, 2], yt=[25, 30, 35, 40, 45],
                    xfmt=lambda v: "%g" % v))
    for sT, c, lab in slopes:
        pts = []
        for r in rs:
            nd = _f10_need(_f10_psi(sT, r))
            if nd is None or nd > 45:
                break
            pts.append((r, nd))
        o.append(q.clip(pts, c=c, lw=2.2))
        if len(pts) < len(rs):
            x_end = pts[-1][0] if pts else 0
            o.append(T(q.X(x_end) + 2, q.y + 12, "×", "start", 11, c, True))
    nd0 = _f10_need(0.0); nd1 = _f10_need(_f10_psi(0.05, 1.0))
    o.append(D(q.X(0), q.Y(nd0), INK, 4))
    o.append(T(q.X(0) + 7, q.Y(25.0), "止まっていれば %.1f" % nd0, "start", 9.5, INK, True, halo=True))
    o.append(D(q.X(1), q.Y(nd1), GLD, 4.5))
    o.append(T(q.X(1) + 7, q.Y(nd1) + 4, "%.1f" % nd1, "start", 9.5, GLD, True, halo=True))
    o.append(T(372, 262, "× の先は、ずれだけで 45° を超え、どの C/N0 でも追えない", "start", 9.5, MUT))
    return SVG(700, 272, o, "TCXO の温度が一定の速さで変わるときの、PLL の位相のずれと追尾の目安（周波数の変わり方は例の値。5 章 4 節の 2 次の PLL・1 ms の積分）。")


F["e10_tcxo"] = _f10_tcxo_fig()


# =====================================================================
# 3 節: 主の電源を切っている間に保つものと、電源を切っていた時間
# =====================================================================
_F10_TAX = [(60, "1 分"), (600, "10 分"), (3600, "1 時間"), (86400, "1 日"), (604800, "1 週間"), (2592000, "1 か月"), (31536000, "1 年")]


def _f10_keep_fig():
    o = []
    o.append(T(14, 18, "(a) 主の電源を切っている間のモジュールの中", "start", 11.5, INK, True))
    o.append(RECT(120, 30, 460, 150, 10, PAN, INK, 1.5))
    o.append(T(130, 46, "GNSS モジュール（例）", "start", 10, INK, True))
    # 主の電源の側（止まっている）
    o.append(RECT(132, 54, 196, 116, 8, MSOFT, MUT, 1.1, dash="4 3"))
    o.append(T(230, 72, "主の電源の側（止まる）", "middle", 10, MUT, True))
    for i, s in enumerate(["RF フロントエンド", "ベースバンド処理・CPU", "フラッシュメモリ"]):
        o.append(RECT(146, 82 + i * 28, 168, 22, 4, SCR, FNT, 1))
        o.append(T(230, 97 + i * 28, s, "middle", 9.5, MUT))
    # バックアップの側
    o.append(RECT(342, 54, 226, 116, 8, PSOFT, PUR, 1.4))
    o.append(T(455, 72, "バックアップ電源の側（動き続ける）", "middle", 10, PUR, True))
    o.append(RECT(354, 82, 74, 78, 5, SCR, PUR, 1.1))
    o.append(T(391, 106, "RTC", "middle", 11, PUR, True))
    o.append(T(391, 122, "32.768 kHz", "middle", 9, INK))
    o.append(T(391, 136, "の水晶で", "middle", 9, INK))
    o.append(T(391, 150, "時刻を数える", "middle", 9, INK))
    o.append(RECT(436, 82, 122, 78, 5, SCR, PUR, 1.1))
    o.append(T(497, 96, "メモリ", "middle", 10, PUR, True))
    for i, s in enumerate(["エフェメリス", "アルマナック", "最後の位置", "TCXO の周波数のずれ・設定"]):
        o.append(T(446, 110 + i * 13, s, "start", 8.8, INK))
    # 端子
    o.append(W(60, 80, 120, 80, c=FNT, lw=1.6))
    o.append(T(14, 76, "VCC", "start", 9.5, MUT, True, True))
    o.append(T(14, 92, "切れている", "start", 9, ALI, True))
    o.append(W(84, 72, 100, 88, c=ALI, lw=2)); o.append(W(84, 88, 100, 72, c=ALI, lw=2))
    o.append(W(600, 112, 568, 112, c=PUR, lw=1.8))
    o.append(T(604, 108, "V_BCKP", "start", 9.5, PUR, True, True))
    o.append(T(604, 124, "15 µA（例）", "start", 9.5, PUR, True))
    # (b) 電源を切っていた時間
    yb = 206
    o.append(T(14, yb, "(b) 電源を切っていた時間と、次のスタート（バックアップ電源が保っている間。代表値）", "start", 11.5, INK, True))
    p = Plot(150, yb + 14, 520, 120, (30, 4e7), (0, 1), xlog=True)
    X = p.X
    rows = [(yb + 26, "RTC の誤差（20 ppm）"), (yb + 56, "エフェメリス"), (yb + 84, "アルマナック"), (yb + 112, "次のスタート")]
    for y, lab in rows:
        o.append(T(140, y + 13, lab, "end", 10, INK, True))
    # RTC の誤差
    errs = {60: "1.2 ms", 3600: "72 ms", 86400: "1.7 s", 604800: "12 s", 2592000: "52 s", 31536000: "10.5 分"}
    for t, s in errs.items():
        o.append(D(X(t), rows[0][0] + 9, PUR, 3))
        o.append(T(X(t), rows[0][0] + 24, s, "middle", 9, PUR, True))
    o.append(W(X(30), rows[0][0] + 9, X(4e7), rows[0][0] + 9, c=PUR, lw=1, dash="2 3"))
    # エフェメリス: 2 時間まで確か、2〜4 時間で切れる
    y = rows[1][0]
    o.append(RECT(X(30), y, X(7200) - X(30), 18, 3, GSOFT, GRN, 1.1))
    o.append(RECT(X(7200), y, X(14400) - X(7200), 18, 3, "none", GRN, 1, dash="3 2"))
    o.append(T((X(30) + X(7200)) / 2, y + 13, "有効", "middle", 9.5, GRN, True))
    o.append(T(X(14400) + 4, y + 13, "2〜4 時間で使えなくなる", "start", 9.5, GRN))
    y = rows[2][0]
    o.append(RECT(X(30), y, X(1209600) - X(30), 18, 3, GOSOFT, GLD, 1.1))
    o.append(RECT(X(1209600), y, X(5184000) - X(1209600), 18, 3, "none", GLD, 1, dash="3 2"))
    o.append(T((X(30) + X(1209600)) / 2, y + 13, "使える", "middle", 9.5, GLD, True))
    o.append(T(X(5184000) - 2, y - 3, "2 週間〜2 か月", "end", 9, GLD))
    y = rows[3][0]
    segs = [(30, 7200, "ホット", GRN), (14400, 1209600, "ウォーム", GLD), (5184000, 4e7, "コールド", ALI)]
    for a, b, lab, c in segs:
        o.append(RECT(X(a), y, X(b) - X(a), 18, 3, soft(c), c, 1.1))
        if lab:
            o.append(T((X(a) + X(b)) / 2, y + 13, lab, "middle", 9.5, c, True))
    o.append(RECT(X(7200), y, X(14400) - X(7200), 18, 0, "none", MUT, 1, dash="3 2"))
    o.append(RECT(X(1209600), y, X(5184000) - X(1209600), 18, 0, "none", MUT, 1, dash="3 2"))
    for t, s in _F10_TAX:
        o.append(W(X(t), y + 18, X(t), y + 22, c=MUT, lw=1))
        o.append(T(X(t), y + 32, s, "middle", 9, MUT))
    return SVG(700, yb + 158, o, "(a) バックアップ電源で動き続ける部分（構成は例）。(b) 電源を切っていた時間と RTC の誤差・軌道の情報・次のスタート（破線の枠は、境目がこの範囲にあること）。")


F["e10_keep"] = _f10_keep_fig()


# =====================================================================
# 3 節: バックアップ電源の回路（一次電池とキャパシタ）
# =====================================================================
def _f10_bkckt_fig():
    o = []
    # (a) 一次電池
    o.append(T(14, 18, "(a) コイン形の一次電池", "start", 11.5, INK, True))
    o.append(W(60, 64, 60, 50, 120, 50, c=PUR, lw=1.4))
    _f10_cell(o, 60, 74, PUR)
    o.append(W(60, 78, 60, 110, c=PUR, lw=1.4))
    _f10_gnd(o, 60, 110)
    o.append(T(46, 78, "CR2032", "end", 9.5, PUR, True))
    o.append(T(46, 92, "220 mAh", "end", 9, MUT))
    o.append(T(46, 104, "（例）", "end", 9, MUT))
    _f10_diode_h(o, 128, 50, PUR)
    o.append(W(136, 50, 230, 50, c=PUR, lw=1.4))
    o.append(RECT(230, 34, 100, 96, 8, PAN, INK, 1.4))
    o.append(T(280, 92, "モジュール", "middle", 10, INK, True))
    o.append(RECT(225, 45, 10, 10, 2, soft(PUR), PUR, 1.1))
    o.append(T(240, 54, "V_BCKP", "start", 9, PUR, True, True))
    o.append(T(128, 76, "ダイオード", "middle", 9.5, PUR, True))
    o.append(T(128, 90, "電池へ流れ込む", "middle", 9, INK))
    o.append(T(128, 103, "電流を止める", "middle", 9, INK))
    o.append(T(128, 116, "（充電させない）", "middle", 9, INK))
    o.append(T(14, 152, "モジュールの中で止める製品もある", "start", 9.5, MUT))
    # (b) キャパシタ
    x0 = 352
    o.append(T(x0, 18, "(b) スーパーキャパシタ（電源が入っている間に充電）", "start", 11.5, INK, True))
    o.append(T(x0, 52, "VCC 3.3 V", "start", 9.5, PUR, True))
    o.append(W(x0 + 62, 48, x0 + 76, 48, c=PUR, lw=1.4))
    _f10_diode_h(o, x0 + 84, 48, PUR)
    o.append(W(x0 + 92, 48, x0 + 104, 48, c=PUR, lw=1.4))
    _f10_res_h(o, x0 + 104, x0 + 140, 48, PUR)
    o.append(W(x0 + 140, 48, x0 + 232, 48, c=PUR, lw=1.4))
    o.append(TX(x0 + 122, 34, "R 1 kΩ", "middle", 9.5, PUR, True))
    o.append(D(x0 + 172, 48, PUR, 2.8))
    o.append(W(x0 + 172, 48, x0 + 172, 84, c=PUR, lw=1.4))
    _f10_cap_v(o, x0 + 172, 87, PUR, 11)
    o.append(W(x0 + 172, 90, x0 + 172, 112, c=PUR, lw=1.4))
    _f10_gnd(o, x0 + 172, 112)
    o.append(TX(x0 + 186, 84, "C_b 0.2 F", "start", 9.5, PUR, True))
    o.append(RECT(x0 + 232, 32, 96, 96, 8, PAN, INK, 1.4))
    o.append(T(x0 + 280, 92, "モジュール", "middle", 10, INK, True))
    o.append(RECT(x0 + 227, 43, 10, 10, 2, soft(PUR), PUR, 1.1))
    o.append(T(x0 + 242, 52, "V_BCKP", "start", 9, PUR, True, True))
    o.append(T(x0 + 84, 74, "ダイオード", "middle", 9.5, PUR, True))
    o.append(T(x0 + 84, 88, "電源を切ったとき", "middle", 9, INK))
    o.append(T(x0 + 84, 101, "逆に流れ出るのを", "middle", 9, INK))
    o.append(T(x0 + 84, 114, "止める", "middle", 9, INK))
    o.append(TX(x0, 146, "V_0 = 3.3 − 0.3 = 3.0 V（ダイオードの分だけ低い）", "start", 9.5, INK))
    o.append(TX(x0, 162, "R は空の C_b への電流を 3 mA までにする", "start", 9.5, INK))
    o.append(TX(x0, 178, "満ちるまで: 時定数 RC_b = 200 s、3 倍の 10 分で 95 %", "start", 9.5, INK))
    o.append(W(x0 - 14, 26, x0 - 14, 182, c=LIN, lw=0.8))
    return SVG(700, 188, o, "バックアップ電源の 2 つの回路（部品の値は例）。")


F["e10_bkckt"] = _f10_bkckt_fig()


# =====================================================================
# 3 節: 保持時間（キャパシタの電圧の下がり方と、電流と保持時間）
# =====================================================================
def _f10_hold_fig():
    o = []
    o.append(TX(14, 18, "(a) キャパシタの電圧（V_0 = 3.0 V、16 µA）", "start", 11.5, INK, True))
    p = Plot(66, 40, 262, 170, (0, 6), (1.4, 3.2))
    o.append(p.axes(xl="主の電源を切ってからの時間 [時間]", yl="電圧 v [V]", xt=[0, 1, 2, 3, 4, 5, 6], yt=[1.4, 1.8, 2.2, 2.6, 3.0],
                    yfmt=lambda v: "%.1f" % v))
    o.append(RECT(p.X(2), p.y, p.X(4) - p.X(2), p.h, 0, GSOFT, "none", 0))
    o.append(T(p.X(3), p.y + 14, "エフェメリス", "middle", 9, GRN, True, halo=True))
    o.append(T(p.X(3), p.y + 27, "2〜4 時間", "middle", 9, GRN, True, halo=True))
    o.append(W(p.x, p.Y(_F10_VMIN), p.x + p.w, p.Y(_F10_VMIN), c=ALI, lw=1, dash="5 3"))
    o.append(TX(p.x + p.w - 4, p.Y(_F10_VMIN) + 14, "V_{min} = 1.65 V", "end", 9.5, ALI, True, halo=True))
    I = _F10_IBK + 1e-6
    for C, c, dash in ((0.2, GRN, None), (0.1, GLD, "6 3")):
        th = C * (3.0 - _F10_VMIN) / I / 3600
        o.append(p.clip([(0, 3.0), (th, _F10_VMIN)], c=c, lw=2.4, dash=dash))
        o.append(D(p.X(th), p.Y(_F10_VMIN), c, 4))
        o.append(T(p.X(th) - 6, p.Y(_F10_VMIN) - 8, "%g F: %.1f 時間" % (C, th), "end", 9.5, c, True, halo=True))
    # (b) 電流と保持時間
    o.append(TX(372, 18, "(b) バックアップの電流と保持時間", "start", 11.5, INK, True))
    q = Plot(430, 40, 250, 170, (1, 100), (0.1, 1e5), xlog=True, ylog=True)
    ylab = {0.1: "6 分", 1: "1 時間", 10: "10 時間", 100: "4 日", 1000: "6 週", 1e4: "1.1 年", 1e5: "11 年"}
    o.append(q.axes(xl="バックアップの電流 I_{bk} [µA]", yl="保持時間", xt=[1, 10, 100], yt=[0.1, 1, 10, 100, 1000, 1e4, 1e5],
                    xfmt=lambda v: "%g" % v, yfmt=lambda v: ylab.get(v, "")))
    o.append(RECT(q.x, q.Y(4), q.w, q.Y(2) - q.Y(4), 0, GSOFT, "none", 0))
    o.append(RECT(q.x, q.Y(1440), q.w, q.Y(336) - q.Y(1440), 0, GOSOFT, "none", 0))
    Is = _f10_np.logspace(0, 2, 60)
    lines = [("CR2032", SIG, lambda i: 220e3 / (i + 0.25)),
             ("1 F", PUR, lambda i: 1.0 * 1.35 / ((i + 1) * 1e-6) / 3600),
             ("0.2 F", GRN, lambda i: 0.2 * 1.35 / ((i + 1) * 1e-6) / 3600),
             ("0.1 F", GLD, lambda i: 0.1 * 1.35 / ((i + 1) * 1e-6) / 3600)]
    o.append(W(q.X(15), q.y, q.X(15), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(q.X(15), q.y - 4, "15 µA", "middle", 9, MUT, True))
    vals = {"CR2032": "1.6 年", "1 F": "23 時間", "0.2 F": "4.7 時間", "0.1 F": "2.3 時間"}
    for nm, c, fn in lines:
        o.append(q.clip([(i, fn(i)) for i in Is], c=c, lw=2.2))
        v = fn(15)
        o.append(D(q.X(15), q.Y(v), c, 3.6))
        if nm == "0.1 F":
            o.append(T(q.X(15) - 6, q.Y(v) + 12, "%s: %s" % (nm, vals[nm]), "end", 9, c, True, halo=True))
        else:
            o.append(T(q.X(15) + 6, q.Y(v) - 4, "%s: %s" % (nm, vals[nm]), "start", 9, c, True, halo=True))
    o.append(LEGEND(372, 270, [(GRN, "ホットに要る 2〜4 時間"), (GLD, "ウォームに要る数週間")], sz=9.5, gap=14))
    return SVG(700, 280, o, "保持時間（例の値: キャパシタ 3.0 V から 1.65 V まで、漏れ電流 1 µA。CR2032 は 220 mAh・自己放電 1 年に 1 %）。")


F["e10_hold"] = _f10_hold_fig()


# =====================================================================
# 4 節: 通信の端子の電圧（送る側の H と、受ける側のしきい値）
# =====================================================================
def _f10_levels_fig():
    o = []
    # (題, 送る側, 送る側の H [V], 受ける側, 受ける側の電源 [V], 間にレベル変換, 判定, 判定の色, 説明 2 行)
    cases = [("(a) 同じ 3.3 V", "モジュール", 3.3, "マイコン", 3.3, False, "正しく伝わる", GRN, ["H 3.3 V は", "V_IH より高い"]),
             ("(b) 3.3 V → 1.8 V", "モジュール", 3.3, "マイコン", 1.8, False, "電流が流れ込む", ALI, ["3.3 V が 1.8 V の", "電源より高い"]),
             ("(c) 1.8 V → 3.3 V", "マイコン", 1.8, "モジュール", 3.3, False, "1 と読まれない", ALI, ["1.8 V が", "V_IH 2.31 V に届かない"]),
             ("(d) レベル変換を入れる", "マイコン", 1.8, "モジュール", 3.3, True, "正しく伝わる", GRN, ["3.3 V に変えて", "から送る"])]
    pw = 172
    for i, (tt, snd, vh, rcv, vdd, lv, verdict, vc, ex) in enumerate(cases):
        x0 = 8 + i * pw
        o.append(T(x0 + 4, 18, tt, "start", 10.5, INK, True))
        o.append(BOX(x0 + 2, 30, 66, 34, snd, "%.1f V" % vh, c=GLD, sz=9.5, ssz=9))
        o.append(BOX(x0 + 98, 30, 66, 34, rcv, "%.1f V" % vdd, c=GLD, sz=9.5, ssz=9))
        if lv:
            o.append(RECT(x0 + 72, 38, 22, 18, 3, soft(PUR), PUR, 1.1))
            o.append(T(x0 + 83, 51, "変換", "middle", 7.5, PUR, True))
        else:
            o.append(ARR(x0 + 68, 47, x0 + 97, 47, c=GLD, lw=1.4, head=6))
        # 受ける側の電圧の目盛（0〜4 V）
        bx, by, bh = x0 + 104, 82, 150
        Y = lambda v: by + bh - v / 4.0 * bh
        vil, vih, vmx = 0.3 * vdd, 0.7 * vdd, vdd + 0.3
        o.append(RECT(bx, Y(vil), 40, Y(0) - Y(vil), 0, MSOFT, MUT, 0.8))
        o.append(RECT(bx, Y(vih), 40, Y(vil) - Y(vih), 0, GOSOFT, GLD, 0.8))
        o.append(RECT(bx, Y(vmx), 40, Y(vih) - Y(vmx), 0, GSOFT, GRN, 0.8))
        o.append(RECT(bx, Y(4.0), 40, Y(vmx) - Y(4.0), 0, ASOFT, ALI, 0.8))
        o.append(T(bx + 20, Y(vil / 2) + 3.5, "0", "middle", 9.5, MUT, True))
        o.append(T(bx + 20, Y((vil + vih) / 2) + 3.5, "？", "middle", 9.5, GLD, True))
        o.append(T(bx + 20, Y((vih + vmx) / 2) + 3.5, "1", "middle", 9.5, GRN, True))
        o.append(T(bx + 44, Y(vih) + 3.5, "%.2f" % vih, "start", 8.5, MUT))
        o.append(T(bx + 44, Y(vmx) + 3.5, "%.1f" % vmx, "start", 8.5, ALI))
        # 届く H の電圧
        va = vdd if lv else vh
        c = GRN if vc == GRN else ALI
        o.append(W(x0 + 20, Y(va), bx - 2, Y(va), c=c, lw=2))
        o.append(_head(x0 + 20, Y(va), bx, Y(va), c, 7))
        o.append(T(x0 + 22, Y(va) - 5, "H %.1f V" % va, "start", 9.5, c, True, halo=True))
        o.append(T(x0 + 86, 252, verdict, "middle", 10, vc, True))
        _f10_lines(o, x0 + 86, 268, [(ex[0], INK, False, True), (ex[1], INK, False, True)], 9, INK, 13, "middle")
    o.append(T(8 + 104 + 20, 76, "受ける側", "middle", 9, MUT))
    o.append(LEGEND(14, 306, [(MUT, "0 と読む"), (GLD, "決まらない"), (GRN, "1 と読む"), (ALI, "保護ダイオードに電流")], sz=9.5, gap=14))
    return SVG(700, 316, o, "送る側の H の電圧と、受ける側のしきい値（例: 0 と 1 を分けるしきい値は受ける側の電源の電圧の 0.3 倍と 0.7 倍、入れてよい最大は電源の電圧 + 0.3 V）。")


F["e10_levels"] = _f10_levels_fig()


# =====================================================================
# 4 節: 例の文のバイト数と、線の上の時間の使われ方
# =====================================================================
def _f10_bytes_fig():
    o = []
    ss = _f10_nmea(2)
    tot = sum(len(s) for k, s in ss)
    o.append(T(14, 18, "(a) 1 回に出す例の文（GPS と GLONASS、11 文）", "start", 11.5, INK, True))
    kinds = [("GGA", "位置"), ("RMC", "時刻・位置・速度"), ("GSA", "使った衛星と DOP"), ("GSV", "見えている衛星"), ("VTG", "速度"), ("GLL", "緯度・経度")]
    cols = {"GGA": SIG, "RMC": PUR, "GSA": GRN, "GSV": GLD, "VTG": TEA, "GLL": MUT}
    x0, w0 = 214, 400
    for i, (k, lab) in enumerate(kinds):
        ls = [len(s) for kk, s in ss if kk == k]
        y = 32 + i * 22
        o.append(T(x0 - 8, y + 12, "%s（%s）%s" % (k, lab, " ×%d" % len(ls) if len(ls) > 1 else ""), "end", 9.5, INK))
        xx = x0
        for l in ls:
            ww = w0 * l / 300.0
            o.append(RECT(xx, y, ww, 16, 2, soft(cols[k]), cols[k], 1.1))
            if ww > 22:
                o.append(T(xx + ww / 2, y + 12, "%d" % l, "middle", 8.5, cols[k], True))
            xx += ww
        o.append(T(xx + 6, y + 12, "%d B" % sum(ls), "start", 9.5, cols[k], True))
    o.append(T(x0, 32 + 6 * 22 + 12, "合計 %d バイト（1 文は $ から CR LF まで。中身は例）" % tot, "start", 10, INK, True))
    # (b) 線の上の時間
    yb = 196
    o.append(T(14, yb, "(b) 線の上の時間（8N1。濃い所が送っている時間）", "start", 11.5, INK, True))
    p = Plot(214, yb + 14, 460, 132, (0, 2), (0, 1))
    rows = [(9600, 1, "9600 bit/s・1 回/s"), (9600, 2, "9600 bit/s・2 回/s"), (115200, 5, "115 200 bit/s・5 回/s")]
    for r, (baud, rate, lab) in enumerate(rows):
        y = p.y + 8 + r * 44
        load = tot * 10.0 * rate / baud
        c = ALI if load > 1 else GLD
        o.append(T(p.x - 8, y + 11, lab, "end", 9.5, INK, True))
        o.append(T(p.x - 8, y + 24, "負荷率 %.0f %%" % (load * 100), "end", 9.5, c, True))
        o.append(RECT(p.x, y, p.w, 18, 2, SCR, LIN, 0.8))
        # 待ち行列: エポックごとに tot バイトが来て、1 秒に baud/10 バイトずつ送る
        t, q, busy = 0.0, 0.0, []
        epochs = [k / rate for k in range(int(2 * rate) + 1)]
        tb = None
        rate_b = baud / 10.0
        for k, te in enumerate(epochs):
            if k > 0:
                dt = te - epochs[k - 1]
                if q > 0:
                    send = min(q, rate_b * dt)
                    tend = epochs[k - 1] + send / rate_b
                    busy.append((epochs[k - 1], min(tend, 2.0)))
                    q -= send
            q += tot
        for a, b in busy:
            o.append(RECT(p.X(a), y, max(p.X(b) - p.X(a), 1), 18, 0, soft(c), c, 1))
        for te in epochs[:-1]:
            o.append(W(p.X(te), y - 3, p.X(te), y + 21, c=INK, lw=1.2))
        if load > 1:
            back = tot * len([e for e in epochs if e < 2.0]) - 2.0 * rate_b
            o.append(T(p.X(2.0) - 4, y + 32, "2 s までに %d B がたまる（1 秒に %d B ずつ増える）" % (round(back), round(tot * rate - rate_b)),
                       "end", 9, ALI, True, halo=True))
        elif rate == 1:
            o.append(T(p.X(tot * 10.0 / baud) + 4, y + 13, "%.2f s" % (tot * 10.0 / baud), "start", 9, c, True))
    for v in (0, 0.5, 1, 1.5, 2):
        o.append(W(p.X(v), p.y + p.h, p.X(v), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, "%g" % v, "middle", 9.5, MUT))
    o.append(T(p.x + p.w / 2, p.y + p.h + 30, "時間 t [s]（縦の線は、位置を出す時刻）", "middle", 10, MUT))
    return SVG(700, yb + 14 + 132 + 40, o, "例の文のバイト数と、ボーレートと 1 秒に出す回数を変えたときの線の上の時間（文は例。12 章の形で作り、長さを数えた）。")


F["e10_bytes"] = _f10_bytes_fig()


# =====================================================================
# 4 節: UART・I2C・SPI の比べ
# =====================================================================
def _f10_ifaces_fig():
    o = []
    cw, x0 = 200, 100
    heads = [("UART", GLD), ("I2C", PUR), ("SPI", SIG)]
    for i, (nm, c) in enumerate(heads):
        xc = x0 + i * cw + cw / 2
        o.append(T(xc, 20, nm, "middle", 12, c, True))
        # モジュールとマイコンの箱
        bx = x0 + i * cw + 12
        o.append(RECT(bx, 32, 54, 112, 6, PAN, INK, 1.2))
        o.append(T(bx + 27, 152 + 4, "モジュール", "middle", 9, INK, True))
        o.append(RECT(bx + 122, 32, 54, 112, 6, PAN, INK, 1.2))
        o.append(T(bx + 149, 152 + 4, "マイコン", "middle", 9, INK, True))
        a, b = bx + 54, bx + 122
        if nm == "UART":
            wires = [(60, "TXD → RX", 1), (90, "RXD ← TX", -1)]
        elif nm == "I2C":
            wires = [(64, "SDA（両向き）", 0), (108, "SCL（クロック）", -1)]
        else:
            wires = [(52, "SCK（クロック）", -1), (78, "MOSI", -1), (104, "MISO", 1), (130, "CS", -1)]
        for (y, lab, d) in wires:
            if d > 0:
                o.append(ARR(a + 2, y, b - 2, y, c=c, lw=1.4, head=6))
            elif d < 0:
                o.append(ARR(b - 2, y, a + 2, y, c=c, lw=1.4, head=6))
            else:
                o.append(DARR(a + 2, y, b - 2, y, c=c, lw=1.4, head=6))
            o.append(T((a + b) / 2, y - 5, lab, "middle", 8.5, c, True, halo=True))
    rows = [("線の数", ["2（と GND）", "2（と GND。プルアップ）", "4（と GND）"]),
            ("送り始める", ["モジュール（文が", "マイコン（読みに", "マイコン（クロック"]),
            ("", ["できたらすぐ）", "行ったとき）", "を出したとき）"]),
            ("速さ（例）", ["9600〜921 600 bit/s", "100・400 kHz", "数 MHz"]),
            ("文がたまる所", ["マイコンの受信の", "モジュールの中の", "モジュールの中の"]),
            ("", ["バッファ（15 章）", "バッファ（製品による）", "バッファ（製品による）"])]
    y = 182
    for lab, vals in rows:
        if lab:
            o.append(W(14, y - 13, 686, y - 13, c=LIN, lw=0.6))
            o.append(T(14, y, lab, "start", 9.5, INK, True))
        for i, v in enumerate(vals):
            o.append(T(x0 + i * cw + cw / 2, y, v, "middle", 9.5, INK))
        y += 16 if not lab else 18
    return SVG(700, y + 2, o, "モジュールから読み出す 3 つの方式（速さは例の値。端子の名前は例）。")


F["e10_ifaces"] = _f10_ifaces_fig()


# =====================================================================
# 5 節: 1PPS の出力の形
# =====================================================================
def _f10_pps_fig():
    o = []
    o.append(T(14, 18, "(a) 1PPS と文（例: 幅 100 ms、9600 bit/s で 1 秒に 1 回）", "start", 11.5, INK, True))
    p = Plot(150, 30, 520, 120, (-0.2, 3.0), (0, 1))
    X = p.X
    for s in (0, 1, 2):
        o.append(W(X(s), p.y - 2, X(s), p.y + 108, c=FNT, lw=1, dash="3 3"))
        o.append(T(X(s), p.y + 122, "%d s" % s, "middle", 9.5, MUT))
    # 1PPS の波形
    y0, y1 = p.y + 40, p.y + 10
    pts = [(X(-0.2), y0)]
    for s in (0, 1, 2):
        pts += [(X(s), y0), (X(s), y1), (X(s + 0.1), y1), (X(s + 0.1), y0)]
    pts.append((X(3.0), y0))
    o.append(PL(pts, c=GRN, lw=2.2))
    o.append(T(140, y1 + 18, "1PPS", "end", 10, GRN, True))
    o.append(T(140, y1 + 31, "0 / 3.3 V", "end", 9, MUT))
    o.append(DIM(X(1), y1 - 6, X(1.1), y1 - 6, None, c=GRN))
    o.append(T(X(1.1) + 6, y1 - 3, "幅 100 ms", "start", 9, GRN, True, halo=True))
    o.append(T(X(0) + 4, y0 + 13, "立ち上がりが秒の頭", "start", 9, GRN, True, halo=True))
    # 文
    yt = p.y + 68
    for s in (0, 1, 2):
        o.append(RECT(X(s + 0.12), yt, X(s + 0.12 + 0.652) - X(s + 0.12), 18, 2, GOSOFT, GLD, 1))
    o.append(T(X(0.12 + 0.326), yt + 13, "文 626 B（0.65 s）", "middle", 9, GLD, True))
    o.append(T(140, yt + 13, "TXD の文", "end", 10, GLD, True))
    o.append(T(X(1.5), yt + 34, "どの文の時刻がどのパルスの秒かは、製品による（14 章 2 節）", "middle", 9, MUT, halo=True))
    # (b) 立ち上がりの拡大
    yb = 196
    o.append(T(14, yb, "(b) 立ち上がりの拡大（例: 2 ns）", "start", 11.5, INK, True))
    q = Plot(70, yb + 16, 250, 92, (-5, 20), (0, 4))
    o.append(q.axes(xl="時間 [ns]", yl="電圧 [V]", xt=[0, 5, 10, 15, 20], yt=[0, 1, 2, 3, 4]))
    o.append(q.line([(-5, 0), (0, 0), (2, 3.3), (20, 3.3)], c=GRN, lw=2.2))
    o.append(W(q.x, q.Y(2.31), q.x + q.w, q.Y(2.31), c=MUT, lw=1, dash="4 3"))
    o.append(TX(q.x + q.w - 4, q.Y(2.31) + 13, "V_IH 2.31 V", "end", 9, MUT, True, halo=True))
    # (c) 位置が出る前
    o.append(T(372, yb, "(c) 位置と時刻が求まる前（例）", "start", 11.5, INK, True))
    r = Plot(380, yb + 20, 300, 60, (-0.2, 3.0), (0, 1))
    yy0, yy1 = r.y + 50, r.y + 20
    pts = [(r.X(-0.2), yy0)]
    for s in (0.37, 1.37, 2.37):
        pts += [(r.X(s), yy0), (r.X(s), yy1), (r.X(s + 0.1), yy1), (r.X(s + 0.1), yy0)]
    pts.append((r.X(3.0), yy0))
    o.append(PL(pts, c=ALI, lw=1.8, dash="4 3"))
    for s in (0, 1, 2):
        o.append(W(r.X(s), r.y + 8, r.X(s), r.y + 56, c=FNT, lw=1, dash="3 3"))
    _f10_lines(o, 380, r.y + 76, ["出さないか、秒の頭に合っていない", "パルスを出す（設定と製品による）"], 9.5, ALI, 14)
    return SVG(700, yb + 156, o, "1PPS の出力の形（例の値）。秒の頭は、受信機が求めた時刻の秒の変わり目。")


F["e10_pps"] = _f10_pps_fig()


# =====================================================================
# 5 節: 長い線の反射（直列の抵抗の有無）
# =====================================================================
def _f10_line(ro, rt, z0=50.0, td=10.0, vs=3.3, tr=2.0, tmax=100.0, n=1001):
    """理想の線（特性インピーダンス z0、片道 td [ns]）の、開いた端の電圧 [V]。立ち上がり tr [ns] の傾きで重ね合わせる。"""
    rs = ro + rt
    gs = (rs - z0) / (rs + z0)
    v1 = vs * z0 / (rs + z0)
    ts = _f10_np.linspace(0, tmax, n)
    v = _f10_np.zeros(n)
    for k in range(60):
        v += v1 * 2 * gs ** k * _f10_np.clip((ts - (2 * k + 1) * td) / tr, 0, 1)
    return ts, v


def _f10_ppsline_fig():
    o = []
    o.append(T(14, 18, "(a) 1PPS の出力からマイコンの入力まで（例の値）", "start", 11.5, INK, True))
    y = 62
    o.append(BOX(14, y - 22, 96, 44, "1PPS の出力", None, c=GRN, sz=10))
    o.append(TX(62, y + 36, "V_s 3.3 V・R_o 10 Ω", "middle", 9, GRN, True))
    o.append(W(110, y, 150, y, c=INK, lw=1.4))
    _f10_res_h(o, 150, 196, y, GLD)
    o.append(TX(173, y - 12, "R_t", "middle", 10, GLD, True))
    o.append(T(173, y + 22, "0 か 40 Ω", "middle", 9, GLD, True))
    o.append(W(196, y, 230, y, c=INK, lw=1.4))
    o.append(W(230, y, 520, y, c=TEA, lw=4))
    o.append(W(230, y, 520, y, c=INK, lw=1.2))
    o.append(TX(375, y - 10, "ケーブル 2 m（Z_0 = 50 Ω、片道 10 ns）", "middle", 9.5, TEA, True, halo=True))
    o.append(W(520, y, 560, y, c=INK, lw=1.4))
    o.append(BOX(560, y - 22, 126, 44, "マイコンの入力", "ほぼ開いた端", c=INK, sz=10, ssz=9))
    o.append(T(375, y + 26, "線の端で波が反射し、往復する", "middle", 9.5, MUT))
    # (b) 波形
    yb = 122
    o.append(T(14, yb, "(b) マイコンの入力の電圧（保護ダイオードは無いものとした計算）", "start", 11.5, INK, True))
    p = Plot(70, yb + 18, 520, 170, (0, 100), (-0.5, 6))
    o.append(p.axes(xl="立ち上がりを出してからの時間 [ns]", yl="電圧 [V]", xt=[0, 20, 40, 60, 80, 100], yt=[0, 1, 2, 3, 4, 5, 6]))
    for v, lab, c in ((3.6, "3.3 V + 0.3 V（入れてよい最大）", ALI), (2.31, "V_IH 2.31 V", MUT)):
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=c, lw=1, dash="4 3"))
        o.append(TX(p.x + p.w + 4, p.Y(v) + 3.5, lab if v < 3 else "最大 3.6", "start", 9, c, True))
    ts, va = _f10_line(10, 0)
    ts, vb = _f10_line(10, 40)
    o.append(p.clip(list(zip(ts, va)), c=ALI, lw=2.2))
    o.append(p.clip(list(zip(ts, vb)), c=GRN, lw=2.4))
    o.append(T(p.X(12), p.Y(5.5) - 4, "5.5 V", "start", 9.5, ALI, True, halo=True))
    o.append(TX(p.X(33), p.Y(1.83) + 13, "1.8 V（V_IH を割る）", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(70, yb + 236, [(ALI, None, "R_t なし（R_o 10 Ω）: 行き過ぎと戻り"), (GRN, None, "R_t = 40 Ω（R_o + R_t = Z_0）: 1 回で 3.3 V")], sz=9.5))
    return SVG(700, yb + 246, o, "長いケーブルの反射（理想の線、立ち上がり 2 ns として重ね合わせで計算。値は例）。")


F["e10_ppsline"] = _f10_ppsline_fig()


# =====================================================================
# 6 節: 電源の状態と、次に電源を入れたときのスタート
# =====================================================================
def _f10_states_fig():
    o = []
    A = (130, 92); B = (570, 92); Cc = (130, 262); Dd = (570, 262)
    o.append(STATE(A[0], A[1], 184, 58, "動作", GRN, "捕捉中 35 mA・追尾中 25 mA"))
    o.append(STATE(B[0], B[1], 184, 58, "バックアップだけ", PUR, "主の電源を切る。15 µA"))
    o.append(STATE(Cc[0], Cc[1], 184, 58, "省電力の動作", GLD, "眠りと起きるを繰り返す（13 章）"))
    o.append(STATE(Dd[0], Dd[1], 184, 58, "すべて切れた", ALI, "0 µA。時刻も軌道の情報も無い"))
    o.append(EDGE(A[0] + 92, A[1] - 12, B[0] - 92, B[1] - 12, "LDO の EN（負荷スイッチ）で主の電源を切る", c=PUR, lc=PUR))
    o.append(EDGE(B[0] - 92, B[1] + 12, A[0] + 92, B[1] + 12, None, c=GRN))
    o.append(T((A[0] + B[0]) / 2, A[1] + 30, "主の電源を入れる: 2〜4 時間以内ならホット、", "middle", 9.5, GRN, True, halo=True))
    o.append(T((A[0] + B[0]) / 2, A[1] + 44, "数週間以内ならウォーム（3 節）", "middle", 9.5, GRN, True, halo=True))
    o.append(EDGE(A[0] - 40, A[1] + 29, Cc[0] - 40, Cc[1] - 29, None, c=GLD))
    o.append(T(A[0] - 46, (A[1] + Cc[1]) / 2 - 4, "コマンド", "end", 9.5, GLD, True))
    o.append(T(A[0] - 46, (A[1] + Cc[1]) / 2 + 10, "（13 章）", "end", 9.5, GLD, True))
    o.append(EDGE(Cc[0] + 40, Cc[1] - 29, A[0] + 40, A[1] + 29, None, c=GRN))
    o.append(T(A[0] + 46, (A[1] + Cc[1]) / 2 - 4, "起こす入力・", "start", 9.5, GRN, True))
    o.append(T(A[0] + 46, (A[1] + Cc[1]) / 2 + 10, "決めた時刻", "start", 9.5, GRN, True))
    o.append(EDGE(B[0] + 40, B[1] + 29, Dd[0] + 40, Dd[1] - 29, None, c=ALI))
    o.append(T(B[0] + 46, (B[1] + Dd[1]) / 2 - 4, "保持時間を過ぎる", "start", 9.5, ALI, True))
    o.append(T(B[0] + 46, (B[1] + Dd[1]) / 2 + 10, "（3 節）", "start", 9.5, ALI, True))
    o.append(EDGE(Dd[0] - 92, Dd[1] - 18, A[0] + 70, A[1] + 29, None, c=ALI, dash="5 3"))
    o.append(T(350, 222, "電源を入れる:", "middle", 9.5, ALI, True, halo=True))
    o.append(T(350, 236, "コールドスタート", "middle", 9.5, ALI, True, halo=True))
    return SVG(700, 300, o, "モジュールの電源の状態と、次に電源を入れたときのスタート（電流は例の値。境目の時間は代表値）。")


F["e10_states"] = _f10_states_fig()


# =====================================================================
# 6 節: 電源投入の順番（悪い順番と良い順番）
# =====================================================================
def _f10_seq_panel(o, y0, good):
    """タイミング図 1 枚。y0 は題の高さ。"""
    o.append(T(14, y0, "(a) 悪い順番: 主の電源を切っても、マイコンが H を出し続ける" if not good else
               "(b) 良い順番: 切る前に信号を L（か入力）にし、文を確かめてから送る", "start", 11, ALI if not good else GRN, True))
    xs, xe = 190, 680
    tA, tB, tC = 0.28, 0.55, 0.62    # 主の電源を切る・入れる・文が出る（全体を 1 とした位置）
    X = lambda t: xs + (xe - xs) * t
    rows = [("主の電源（VCC）", PUR), ("バックアップ電源", PUR), ("マイコンの TX → RXD", GLD), ("モジュールの文（TXD）", GLD)]
    hh = 22
    for i, (lab, c) in enumerate(rows):
        y = y0 + 16 + i * 32
        o.append(T(xs - 10, y + 15, lab, "end", 9.5, INK, True))
        yH, yL = y + 2, y + hh
        if i == 0:
            if good:
                o.append(PL([(xs, yH), (X(tA), yH), (X(tA) + 18, yL), (X(tB), yL), (X(tB) + 6, yH), (xe, yH)], c=c, lw=2))
            else:
                ym = y + 8
                o.append(PL([(xs, yH), (X(tA), yH), (X(tA) + 12, ym), (X(tB), ym), (X(tB) + 6, yH), (xe, yH)], c=c, lw=2))
                o.append(RECT(X(tA) + 12, ym - 2, X(tB) - X(tA) - 12, yL - ym + 2, 0, ASOFT, "none", 0))
                o.append(T((X(tA) + X(tB)) / 2, ym + 12, "0 まで下がらない", "middle", 9, ALI, True, halo=True))
        elif i == 1:
            o.append(PL([(xs, yH), (xe, yH)], c=c, lw=2))
            o.append(T(xe - 4, yL, "ずっと入っている", "end", 9, MUT))
        elif i == 2:
            if good:
                t0, t1 = tA - 0.05, tC + 0.06
                o.append(PL([(xs, yH), (X(t0), yH), (X(t0) + 4, yL), (X(t1), yL), (X(t1) + 4, yH), (xe, yH)], c=c, lw=2))
                o.append(T((X(t0) + X(t1)) / 2, yL - 5, "L か入力", "middle", 9, GRN, True, halo=True))
            else:
                o.append(PL([(xs, yH), (xe, yH)], c=ALI, lw=2))
                o.append(T((X(tA) + X(tB)) / 2, yH + 15, "H のまま → 保護ダイオードから流れ込む", "middle", 9, ALI, True, halo=True))
        else:
            for t in (0.03, 0.15):
                o.append(RECT(X(t), y + 4, 34, hh - 6, 2, GOSOFT, GLD, 1))
            if good:
                for t in (tC, tC + 0.12, tC + 0.24):
                    o.append(RECT(X(t), y + 4, 34, hh - 6, 2, GOSOFT, GLD, 1))
                o.append(T(X(tC) - 4, y + 15, "文を確かめて →", "end", 9, GRN, True, halo=True))
            else:
                o.append(T(X(tC) + 10, y + 15, "× 正しく起動しない（文が出ない）", "start", 9.5, ALI, True))
    yb = y0 + 16 + 4 * 32
    for t, lab in ((tA, "主の電源を切る"), (tB, "入れ直す")):
        o.append(W(X(t), y0 + 10, X(t), yb, c=FNT, lw=1, dash="3 3"))
        o.append(T(X(t), yb + 12, lab, "middle", 9, MUT, True))
    return yb + 22


def _f10_seq_fig():
    o = []
    y = _f10_seq_panel(o, 18, False)
    y = _f10_seq_panel(o, y + 14, True)
    return SVG(700, y + 2, o, "電源投入の順番（タイミングは模式図）。")


F["e10_seq"] = _f10_seq_fig()
