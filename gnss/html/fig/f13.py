# -*- coding: utf-8 -*-
# 13 章 バイナリプロトコルと設定 の図
import math as _f13_m
import numpy as _f13_np


# =====================================================================
# 例のフレームと文（本文・C の試験・w13.js と同じ値）
# =====================================================================
def _f13_ck(bs):
    """フレッチャーのチェックサム（8 bit の和を 2 つ）。"""
    a = b = 0
    for x in bs:
        a = (a + x) & 255
        b = (b + a) & 255
    return a, b


def _f13_frame(cls, mid, body=()):
    """同期・クラス・ID・長さ（リトルエンディアン）・本体・チェックサムを並べたフレーム。"""
    body = list(body)
    L = len(body)
    h = [cls, mid, L & 255, L >> 8]
    a, b = _f13_ck(h + body)
    return [0xB5, 0x62] + h + body + [a, b]


_F13_R5 = _f13_frame(6, 8, [0xC8, 0, 1, 0, 1, 0])        # 間隔 200 ms（5 Hz）の設定
_F13_ACK = _f13_frame(5, 1, [6, 8])                     # その ACK
_F13_A24 = _f13_frame(5, 1, [6, 0x24])                  # 動きのモデルの設定（06 24）への ACK（本体に $ がある）
_F13_S8 = _f13_frame(6, 8, [0xB5, 0x62, 1, 0, 1, 0])    # 本体に B5 62 がある（間隔 0x62B5 = 25 269 ms）
_F13_P92 = _f13_frame(1, 7, [(k * 7 + 3) & 255 for k in range(92)])   # 長いフレーム（本体 92 バイト。中身は例）

# 10 章の例の文（f10.py の _f10_nmea と同じ作り方）
_F13_SATS = {
    "GP": [(5, 45, 123, 47), (13, 62, 45, 49), (15, 30, 210, 44), (18, 15, 300, 38), (20, 72, 280, 50),
           (23, 25, 150, 42), (24, 40, 330, 45), (29, 10, 60, 36), (30, 5, 250, None), (31, 2, 100, None)],
    "GL": [(66, 35, 20, 43), (67, 55, 110, 46), (76, 20, 250, 40), (77, 48, 300, 44), (82, 8, 180, None), (83, 3, 140, None)],
    "GA": [(2, 40, 70, 45), (7, 65, 200, 48), (8, 22, 320, 41), (13, 30, 140, 43), (26, 50, 260, 46), (30, 12, 30, 37), (33, 4, 190, None)],
    "GB": [(6, 55, 190, 42), (9, 62, 210, 44), (16, 48, 170, 43), (19, 33, 60, 45), (20, 70, 320, 47), (29, 25, 280, 41),
           (35, 15, 110, 38), (44, 6, 40, None)],
}


def _f13_nmea(nsys=2, kinds=("GGA", "RMC", "GSA", "GSV", "VTG", "GLL")):
    talk = ["GP", "GL", "GA", "GB"][:nsys]
    used = [[s[0] for s in _F13_SATS[t] if s[3] is not None] for t in talk]
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
                ss = _F13_SATS[t]
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


def _f13_nb(nsys=2, kinds=("GGA", "RMC", "GSA", "GSV", "VTG", "GLL")):
    return sum(len(s) for k, s in _f13_nmea(nsys, kinds))


_F13_ALL = _f13_nb(2)                                   # 626 バイト（10 章の例の 11 文）
_F13_GGA = len(_f13_nmea(2, ("GGA",))[0][1])            # 73 バイト
_F13_TC = 0.12                                          # 位置を求めてから出し始めるまで [s]（例の値。10 章 5 節の図と同じ）

# 色の約束（この章の中）: 同期 MUT・クラスと ID PUR・長さ GLD・本体 SIG・チェックサム GRN・文の文字 TEA
_F13_FC = {"sync": MUT, "cls": PUR, "id": PUR, "len": GLD, "body": SIG, "ck": GRN}


def _f13_role(i, n):
    """フレームの i バイト目の欄（n はフレームのバイトの数）。"""
    if i < 2:
        return "sync"
    if i == 2:
        return "cls"
    if i == 3:
        return "id"
    if i < 6:
        return "len"
    if i >= n - 2:
        return "ck"
    return "body"


def _f13_cell(x, y, w, h, txt, c, sz=11, fill=None, tc=INK, lw=1.1):
    return RECT(x, y, w, h, 3, fill or soft(c), c, lw) + T(x + w / 2, y + h / 2 + sz * 0.36, txt, "middle", sz, tc, True, True)


def _f13_brk(x1, x2, y, c, down=True, h=6, lw=1.2):
    """横向きの括弧（down=True なら下に開く）。"""
    s = 1 if down else -1
    return W(x1, y - s * h, x1, y, x2, y, x2, y - s * h, c=c, lw=lw)


# =====================================================================
# 1 節: 同じ値を、文字とバイナリで送る
# =====================================================================
def _f13_values_fig():
    o = []
    o.append(T(14, 18, "同じ値を、文字の文（12 章の GGA の欄）と 2 進の数で送る（東京の例の点）", "start", 11.5, INK, True))
    rows = [
        ("緯度 35.6810000°", "3540.86000,N", 356810000, "10⁻⁷ 度"),
        ("経度 139.7670000°", "13946.02000,E", 1397670000, "10⁻⁷ 度"),
        ("楕円体高 40.0 m", "3.3,M,36.7,M", 40000, "mm"),
    ]
    o.append(T(150, 42, "文字（ASCII。1 文字 1 バイト）", "start", 10, TEA, True))
    o.append(T(442, 42, "2 進の数（32 ビットの整数を 4 バイトで）", "start", 10, SIG, True))
    y = 56
    cw = 15
    tot_t = 0
    for lab, txt, v, unit in rows:
        o.append(T(14, y + 17, lab, "start", 10.5, INK, True))
        for k, ch in enumerate(txt):
            o.append(_f13_cell(150 + k * cw, y + 2, cw - 1.5, 22, ch, TEA, 10.5))
        tot_t += len(txt)
        o.append(T(150 + len(txt) * cw + 6, y + 17, "%d B" % len(txt), "start", 10, TEA, True))
        o.append(ARR(372, y + 13, 434, y + 13, c=MUT, lw=1.4, head=6))
        hx = "%08X" % v
        o.append(T(442, y + 9, "%s = 0x%s（%s）" % (format(v, ",").replace(",", " "), hx, unit), "start", 9.5, MUT, False, True))
        bs = [(v >> (8 * k)) & 255 for k in range(4)]
        for k, b in enumerate(bs):
            o.append(_f13_cell(442 + k * 36, y + 15, 33, 22, "%02X" % b, SIG, 10.5))
        o.append(T(442 + 4 * 36 + 6, y + 31, "4 B", "start", 10, SIG, True))
        y += 58
    o.append(T(442, y + 2, "下位のバイト（0x%s）から先に送る" % ("%08X" % rows[0][2])[6:8], "start", 9.5, SIG, False))
    o.append(T(14, y + 24, "合わせて: 文字 %d バイト（区切りのカンマと N・E・M を含む）→ 2 進 12 バイト" % tot_t, "start", 10, INK, True))
    return SVG(700, y + 36, o, "同じ値の、文字と 2 進の数の表し方。2 進の側は 12 章 5 節で文字から求めた整数そのもの（バイトの並べ方は 1 節の例の形式）。")


F["e13_values"] = _f13_values_fig()


# =====================================================================
# 1 節: フレームの欄（例の 5 Hz の設定）
# =====================================================================
def _f13_framefig():
    o = []
    fr = _F13_R5
    n = len(fr)
    o.append(T(14, 18, "例のフレーム: 位置を求める間隔を 200 ms（1 秒に 5 回）にする設定（例の形式の古い版）", "start", 11.5, INK, True))
    cw, x0, yc, h = 46, 28, 66, 34
    xs = [x0 + i * cw for i in range(n)]
    groups = [("同期", 0, 2), ("クラス", 2, 3), ("ID", 3, 4), ("長さ", 4, 6), ("本体（6 バイト）", 6, 12), ("チェックサム", 12, 14)]
    for name, a, b in groups:
        c = _F13_FC[_f13_role(a, n)]
        o.append(T((xs[a] + xs[b - 1] + cw - 3) / 2, yc - 9, name, "middle", 10.5, c, True))
    for i, v in enumerate(fr):
        c = _F13_FC[_f13_role(i, n)]
        o.append(_f13_cell(xs[i], yc, cw - 3, h, "%02X" % v, c, 12))
        o.append(T(xs[i] + (cw - 3) / 2, yc + h + 12, str(i), "middle", 8.5, FNT, False, True))
    # 欄の意味
    y1 = yc + h + 30
    def note(a, b, lines, c):
        xm = (xs[a] + xs[b - 1] + cw - 3) / 2
        o.append(W(xm, yc + h + 17, xm, y1 - 10, c=c, lw=1))
        for k, (t, bb) in enumerate(lines):
            o.append(TX(xm, y1 + k * 14, t, "middle", 9.5, c if bb else INK, bb))
    note(0, 2, [("B5 62", True), ("頭の印", False)], MUT)
    note(2, 3, [("0x06", True), ("設定", False)], PUR)
    note(3, 4, [("0x08", True), ("間隔", False)], PUR)
    note(4, 6, [("06 00 → 0x0006", True), ("= 6（本体の", False), ("バイトの数）", False)], GLD)
    note(6, 8, [("C8 00 → 200", True), ("測る間隔 [ms]", False)], SIG)
    note(8, 10, [("01 00 → 1", True), ("何回測るごとに", False), ("位置を出すか", False)], SIG)
    note(10, 12, [("01 00 → 1", True), ("時刻の基準", False), ("（1 = GPS 時刻）", False)], SIG)
    note(12, 14, [("DE 6A", True), ("CK_A・CK_B", False)], GRN)
    # チェックサムの範囲と、フレームの長さ
    yb = y1 + 50
    o.append(_f13_brk(xs[2], xs[11] + cw - 3, yb, GRN, down=True, h=7))
    o.append(T((xs[2] + xs[11] + cw - 3) / 2, yb + 15, "チェックサムを計算する範囲: クラスから本体の終わりまで（10 バイト。同期は入れない）", "middle", 10, GRN, True))
    o.append(_f13_brk(xs[0], xs[13] + cw - 3, yb + 30, MUT, down=True, h=7))
    o.append(T((xs[0] + xs[13] + cw - 3) / 2, yb + 45, "フレーム全体 = 本体 6 バイト + 8 バイト = 14 バイト。2 バイトの数は下位のバイトが先（長さ 0x0006 → 06 00、200 = 0x00C8 → C8 00）", "middle", 10, INK, False))
    return SVG(700, yb + 56, o, "例の形式のフレームの欄（クラス 0x06・ID 0x08 の本体の並びは、例の形式の古い版のもの。版と製品で違う）。数字の下の小さな番号は、フレームの頭から数えたバイトの位置。")


F["e13_frame"] = _f13_framefig()


# =====================================================================
# 1 節: フレッチャーのチェックサムの筆算と、入れ替わり
# =====================================================================
def _f13_fletcher_fig():
    o = []
    bs = _F13_R5[2:-2]
    n = len(bs)
    names = ["クラス", "ID", "長さ", "長さ", "本体", "本体", "本体", "本体", "本体", "本体"]
    roles = ["cls", "id", "len", "len", "body", "body", "body", "body", "body", "body"]
    o.append(TX(14, 18, "(a) 筆算: 1 バイトずつ足して CK_A を、CK_A の途中の値を足して CK_B を求める（8 bit の足し算）", "start", 11.5, INK, True))
    cols = [(28, "i", "middle"), (74, "欄", "middle"), (130, "a_i", "middle"), (238, "CK_A（途中の和 A_i）", "middle"), (378, "CK_B（A_1 + … + A_i）", "middle"),
            (520, "重み n − i + 1", "middle"), (628, "重み × a_i", "middle")]
    yh = 44
    for x, t, a in cols:
        o.append(TX(x, yh, t, a, 10, MUT, True))
    o.append(W(14, yh + 6, 686, yh + 6, c=LIN, lw=0.8))
    A = B = 0
    S = 0
    y = yh + 22
    for i, a in enumerate(bs):
        A0, B0 = A, B
        A = (A + a) & 255
        B = (B + A) & 255
        w = n - i
        S += w * a
        c = _F13_FC[roles[i]]
        o.append(T(28, y, str(i + 1), "middle", 10, MUT, False, True))
        o.append(T(74, y, names[i], "middle", 10, c, True))
        o.append(_f13_cell(113, y - 13, 34, 18, "%02X" % a, c, 10.5))
        o.append(T(244, y, "%02X + %02X =" % (A0, a), "end", 10, MUT, False, True))
        o.append(T(250, y, "%02X" % A, "start", 10.5, INK, True, True))
        if A0 + a > 255:
            o.append(T(272, y, "−100", "start", 9, FNT, False, True))
        o.append(T(384, y, "%02X + %02X =" % (B0, A), "end", 10, MUT, False, True))
        o.append(T(390, y, "%02X" % B, "start", 10.5, INK, True, True))
        if B0 + A > 255:
            o.append(T(412, y, "−100", "start", 9, FNT, False, True))
        o.append(T(520, y, "%d" % w, "middle", 10, MUT, False, True))
        o.append(T(680, y, "%d × %d = %d" % (w, a, w * a), "end", 10, INK if a else FNT, False, True))
        y += 19
    o.append(W(14, y - 11, 686, y - 11, c=LIN, lw=0.8))
    o.append(TX(244, y + 6, "CK_A =", "end", 10.5, GRN, True))
    o.append(_f13_cell(250, y - 8, 34, 20, "%02X" % A, GRN, 11))
    o.append(TX(384, y + 6, "CK_B =", "end", 10.5, GRN, True))
    o.append(_f13_cell(390, y - 8, 34, 20, "%02X" % B, GRN, 11))
    o.append(T(680, y + 6, "和 %d = %d × 256 + %d" % (S, S // 256, S % 256), "end", 10, INK, True, True))
    o.append(TX(680, y + 21, "→ %d = 0x%02X（CK_B と同じ）" % (S % 256, S % 256), "end", 10, GRN, True))
    o.append(T(14, y + 21, "−100: 16 進の 100（= 256）を超えた分を捨てた", "start", 9, FNT, False))
    # (b) 入れ替わり
    yb = y + 52
    o.append(T(14, yb, "(b) 200 を上位のバイトから並べてしまった（C8 00 → 00 C8）: 受ける側は 0xC800 = 51 200 ms と読む", "start", 11.5, INK, True))
    sw = list(bs)
    sw[4], sw[5] = sw[5], sw[4]
    for r, (lab, arr) in enumerate((("送るはずの 10 バイト", bs), ("届いた 10 バイト", sw))):
        yy = yb + 16 + r * 28
        o.append(T(150, yy + 15, lab, "end", 10, INK, True))
        for k, v in enumerate(arr):
            c = ALI if (r == 1 and k in (4, 5)) else _F13_FC[roles[k]]
            o.append(_f13_cell(160 + k * 32, yy, 29, 21, "%02X" % v, c, 10.5))
    yt = yb + 86
    hdr = [(14, "検査の方法", "start"), (330, "送るはずの値", "middle"), (450, "届いた値", "middle"), (540, "誤りに", "start")]
    for x, t, a in hdr:
        o.append(T(x, yt, t, a, 10, MUT, True))
    o.append(W(14, yt + 6, 686, yt + 6, c=LIN, lw=0.8))
    def xr(arr):
        x = 0
        for v in arr:
            x ^= v
        return x
    rows = [("排他的論理和（12 章の文と同じ方法）", "%02X" % xr(bs), "%02X" % xr(sw), "気づかない", ALI),
            ("8 bit の和（CK_A だけ）", "%02X" % (sum(bs) & 255), "%02X" % (sum(sw) & 255), "気づかない", ALI),
            ("フレッチャー（CK_A・CK_B）", "%02X %02X" % _f13_ck(bs), "%02X %02X" % _f13_ck(sw), "気づく（CK_B が変わる）", GRN)]
    for j, (m, a, b, r, c) in enumerate(rows):
        yy = yt + 22 + j * 19
        o.append(TX(14, yy, m, "start", 10, INK, j == 2))
        o.append(T(330, yy, a, "middle", 10.5, INK, True, True))
        o.append(T(450, yy, b, "middle", 10.5, ALI if a != b else INK, True, True))
        o.append(TX(540, yy, r, "start", 10, c, True))
    return SVG(700, yt + 22 + 3 * 19 + 2, o, "例の 5 Hz の設定のチェックサムの筆算（右の 2 列は、導出の式の重みで CK_B を計算し直したもの）と、2 バイトの入れ替わりに対する 3 つの検査の結果。")


F["e13_fletcher"] = _f13_fletcher_fig()


# =====================================================================
# 2 節: 同じ線に、文とフレームが混ざる
# =====================================================================
def _f13_vtg():
    b = "GNVTG,,T,,M,0.012,N,0.022,K,A"
    x = 0
    for ch in b:
        x ^= ord(ch)
    return "$%s*%02X\r\n" % (b, x)


def _f13_line_fig():
    o = []
    o.append(T(14, 18, "UART で届くバイトの並び（例: VTG の文 → 06 24 の命令への ACK のフレーム → 次の GGA の文の頭）", "start", 11.5, INK, True))
    vtg = [ord(c) for c in _f13_vtg()]
    gga = [ord(c) for c in "$GNGGA,"]
    seq_ = [("t", v) for v in vtg] + [("f", v) for v in _F13_A24] + [("t", v) for v in gga]
    nf = len(_F13_A24)
    per, cw, x0 = 26, 25.4, 20
    fi = 0
    pos = {}
    for k, (kind, v) in enumerate(seq_):
        r, cidx = divmod(k, per)
        x = x0 + cidx * cw
        y = 44 + r * 88
        if kind == "t":
            c = TEA
        else:
            c = _F13_FC[_f13_role(fi, nf)]
            pos[fi] = (x, y)
            fi += 1
        o.append(RECT(x, y, cw - 2, 24, 3, soft(c), c, 1))
        o.append(T(x + (cw - 2) / 2, y + 16, "%02X" % v, "middle", 9.5, INK, True, True))
        ch = "CR" if v == 13 else ("LF" if v == 10 else (chr(v) if 0x20 <= v <= 0x7E else "·"))
        o.append(T(x + (cw - 2) / 2, y + 38, ch, "middle", 10 if len(ch) == 1 else 8, c if kind == "t" else FNT, kind == "t", len(ch) == 1))
    for r in range(2):
        o.append(T(x0 - 4, 44 + r * 88 + 16, "", "end", 9, MUT))
    # 注記
    xb, yb = pos[0]
    o.append(W(xb + 10, yb - 3, xb + 10, yb - 14, c=MUT, lw=1))
    o.append(T(xb + 10, yb - 18, "0xB5 は文の中に現れない（文は 0x20〜0x7E と CR・LF だけ）", "middle", 9.5, MUT, True, halo=True))
    xd, yd = pos[7]
    o.append(W(xd + 11, yd + 44, xd + 11, yd + 56, c=SIG, lw=1))
    o.append(T(xd + 11, yd + 68, "本体の 0x24 は、文字として読むと $（命令の ID 0x24 を返した値）", "middle", 9.5, SIG, True, halo=True))
    xk, yk = pos[8]
    o.append(T(xk + 25, yk + 84, "チェックサムの 32 5B も、文字なら 2 と [", "middle", 9, GRN, False, halo=True))
    o.append(LEGEND(20, 236, [(TEA, "文の文字（下は ASCII の文字）"), (MUT, "同期"), (PUR, "クラスと ID"), (GLD, "長さ"), (SIG, "本体"), (GRN, "チェックサム")], 9.5, 12))
    return SVG(700, 248, o, "同じ UART に、文とフレームが続けて出る例（ACK の形は 6 節。本体の 06 24 は、動きのモデルの設定の命令のクラスと ID（例の形式の古い版））。")


F["e13_line"] = _f13_line_fig()


# =====================================================================
# 2 節: 受信の流れと状態機械
# =====================================================================
def _f13_fsm_fig():
    o = []
    # 上の段: バイトの行き先
    o.append(BOX(14, 30, 196, 44, "受けたバイト c", "戻したバイトを先に、無ければ UART", c=INK, sz=11, ssz=9))
    o.append(ARR(210, 52, 258, 52, c=INK, lw=1.5))
    o.append(BOX(258, 30, 176, 44, "フレームの外で、c ≠ B5 ?", None, c=GLD, fill=GOSOFT, tc=GLD, sz=10.5))
    o.append(ARR(434, 52, 488, 52, c=TEA, lw=1.5))
    o.append(T(461, 46, "はい", "middle", 9.5, TEA, True))
    o.append(BOX(488, 30, 198, 44, "12 章の状態機械", "nmea_feed（文の文字）", c=TEA, fill=TSOFT, tc=TEA, sz=11, ssz=9))
    o.append(ARR(346, 74, 346, 104, c=SIG, lw=1.5))
    o.append(T(352, 94, "いいえ: bin_feed へ", "start", 9.5, SIG, True))
    # 状態
    y = 150
    P = [(84, "待つ", "BS_WAIT", MUT), (246, "同期 2", "BS_SYNC2", MUT), (414, "見出し", "BS_HEAD", GLD), (590, "本体", "BS_BODY", SIG)]
    w, h = 108, 42
    for x, nm, cn, c in P:
        o.append(STATE(x, y, w, h, nm, c, cn))
    labs = ["B5", "62", "4 バイト"]
    for k in range(3):
        xa, xb = P[k][0] + w / 2, P[k + 1][0] - w / 2
        o.append(ARR(xa, y, xb, y, c=INK, lw=1.5))
        o.append(T((xa + xb) / 2, y - 7, labs[k], "middle", 9.5, INK, True, k < 2, halo=True))
    o.append(T(414, y - h / 2 - 10, "同期の 1 バイト目から、受けたバイトを raw にためる", "middle", 9, MUT, halo=True))
    o.append(SELF(84, y - h / 2, None, MUT))
    o.append(T(84, y - h / 2 - 36, "B5 以外は", "middle", 9, MUT))
    o.append(T(84, y - h / 2 - 25, "読み捨てる", "middle", 9, MUT))
    o.append(SELF(590, y - h / 2, None, SIG))
    o.append(T(590, y - h / 2 - 36, "本体はどの値でも受ける", "middle", 9, SIG, True))
    o.append(T(590, y - h / 2 - 25, "（B5 も $ も頭とみなさない）", "middle", 9, SIG, True))
    # 終わり（そろった・誤り）
    yo = y + 62
    o.append(W(590, y + h / 2, 590, yo, 70, yo, c=GRN, lw=1.6))
    o.append(ARR(70, yo, 70, y + h / 2 + 1, c=GRN, lw=1.6))
    o.append(T(330, yo - 6, "長さ + 2 バイトそろった: チェックサムが合う → BIN_OK（use_frame へ）", "middle", 9.5, GRN, True, halo=True))
    ye = yo + 34
    for x in (246, 414, 610):
        o.append(W(x, y + h / 2, x, ye, c=ALI, lw=1.3))
    o.append(W(610, ye, 98, ye, c=ALI, lw=1.3))
    o.append(ARR(98, ye, 98, y + h / 2 + 1, c=ALI, lw=1.3))
    o.append(T(356, ye + 15, "誤り: 2 バイト目が 62 でない → BIN_ERR_SYNC、長さ > 256 → BIN_ERR_LONG、チェックサムが違う → BIN_ERR_SUM", "middle", 9.5, ALI, True))
    o.append(T(356, ye + 32, "誤りのとき（gnss_poll）: raw の 2 バイト目から後を、まだ読んでいないバイトの前に戻して、もう一度読む", "middle", 9.5, GLD, True))
    return SVG(700, ye + 42, o, "受けたバイトの行き先（上）と、bin_feed の状態機械（下）。箱の下は C のコードの状態の名前。")


F["e13_fsm"] = _f13_fsm_fig()


# =====================================================================
# 2 節: 試験の入力と結果（C のコードと同じ計算を Python で）
# =====================================================================
def _f13_poll(stream, rescan=True):
    """gnss_poll（2 節）と同じ流れ。返り値: [(種類, 入力の何バイト目で起きたか, 中身)]。文は 12 章の nmea_feed と同じ判定。"""
    st, raw, rpos, ln = 0, [], [], 0
    back, bpos = [], []
    nst, nbuf, nsum, ngot = 0, [], 0, 0
    ev = []
    i = 0
    def hexv(c):
        ch = chr(c) if c < 128 else ""
        return int(ch, 16) if ch and ch in "0123456789ABCDEFabcdef" else -1
    while True:
        if back:
            c, ci = back.pop(0), bpos.pop(0)
        elif i < len(stream):
            c, ci = stream[i], i
            i += 1
        else:
            break
        if st == 0 and c != 0xB5:
            sc = c - 256 if c >= 128 else c
            if sc == 0x24:
                if nst != 0:
                    ev.append(("NERR", ci, "CUT"))
                nst, nbuf, nsum = 1, [], 0
                continue
            if nst == 0:
                continue
            if nst == 1:
                if sc == 0x2A:
                    nst = 2
                elif not (0x20 <= sc <= 0x7E) or len(nbuf) >= 76:
                    nst = 0
                    ev.append(("NERR", ci, "FORM"))
                else:
                    nbuf.append(sc)
                    nsum ^= sc
            elif nst in (2, 3):
                h = hexv(c)
                if h < 0:
                    nst = 0
                    ev.append(("NERR", ci, "FORM"))
                elif nst == 2:
                    ngot, nst = h << 4, 3
                else:
                    ngot, nst = ngot | h, 4
            elif nst == 4:
                if sc == 0x0D:
                    continue
                nst = 0
                if sc != 0x0A:
                    ev.append(("NERR", ci, "FORM"))
                elif ngot == nsum:
                    ev.append(("NOK", ci, "".join(chr(x) for x in nbuf[2:5])))
                else:
                    ev.append(("NERR", ci, "SUM"))
            continue
        if st == 0:
            st, raw, rpos = 1, [c], [ci]
            continue
        raw.append(c)
        rpos.append(ci)
        res = None
        if st == 1:
            if c == 0x62:
                st = 2
            else:
                res = "SYNC"
        elif st == 2:
            if len(raw) == 6:
                ln = raw[4] | (raw[5] << 8)
                if ln > 256:
                    res = "LONG"
                else:
                    st = 3
        elif st == 3:
            if len(raw) == 8 + ln:
                a, b = _f13_ck(raw[2:6 + ln])
                if a == raw[6 + ln] and b == raw[7 + ln]:
                    ev.append(("BOK", ci, "%02X %02X" % (raw[2], raw[3])))
                    st = 0
                else:
                    res = "SUM"
        if res:
            ev.append(("BERR", ci, res))
            st = 0
            if rescan:
                back[:0] = raw[1:]
                bpos[:0] = rpos[1:]
    return ev


def _f13_trace_cases():
    gga = [ord(c) for c in _f13_nmea(2, ("GGA",))[0][1]]
    rmc = [ord(c) for c in _f13_nmea(2, ("RMC",))[0][1]]
    R5, ACK = list(_F13_R5), list(_F13_ACK)
    def mod(fr, k, v):
        f = list(fr)
        for kk, vv in zip(k, v):
            f[kk] = vv
        return f
    C = []
    C.append(("正しいフレーム（5 Hz の設定）", [("設定", R5, None)]))
    C.append(("本体の 1 バイトが化けた（C8 → C9）", [("設定", mod(R5, [6], [0xC9]), [6]), ("ACK", ACK, None)]))
    C.append(("2 バイトの入れ替わり（C8 00 → 00 C8）", [("設定", mod(R5, [6, 7], [0, 0xC8]), [6, 7]), ("ACK", ACK, None)]))
    C.append(("8 バイトで切れた", [("設定", R5[:8], [7]), ("ACK", ACK, None), ("GGA", gga, None)]))
    C.append(("長いフレーム（本体 92 B）が 20 バイトで切れた", [("長い", list(_F13_P92[:20]), [19]), ("ACK", ACK, None), ("GGA", gga, None), ("設定", R5, None)]))
    C.append(("長さの欄が 1024 に化けた", [("設定", mod(R5, [4, 5], [0, 4]), [4, 5]), ("ACK", ACK, None)]))
    C.append(("長さの欄が 6 → 70 に化けた", [("設定", mod(R5, [4], [70]), [4]), ("ACK", ACK, None), ("GGA", gga, None), ("設定", R5, None)]))
    C.append(("本体に B5 62 がある（間隔 0x62B5 ms）", [("設定", list(_F13_S8), None), ("ACK", ACK, None)]))
    C.append(("その本体の B5 62 から受け始めた", [("設定", list(_F13_S8[6:]), [6]), ("ACK", ACK, None), ("設定", R5, None)]))
    C.append(("文とフレームが混ざる（ACK の本体に $）", [("GGA", gga, None), ("ACK", ACK, None), ("ACK", list(_F13_A24), None), ("RMC", rmc, None)]))
    return C


def _f13_trace_fig():
    o = []
    o.append(T(14, 18, "入れたバイトの並び（帯の長さはバイトの数）と、取り出せたメッセージ（✓）・捨てたもの（×）", "start", 11.5, INK, True))
    o.append(T(470, 40, "2 バイト目から探し直す", "middle", 10, GRN, True))
    o.append(T(612, 40, "探し直さない", "middle", 10, ALI, True))
    y = 62
    sc = 2.6
    for title, msgs in _f13_trace_cases():
        o.append(T(14, y, title, "start", 10, INK, True))
        stream, spans = [], []
        for nm, bs, bad in msgs:
            spans.append((nm, len(stream), len(stream) + len(bs), bad))
            stream += bs
        evr = _f13_poll(stream, True)
        evn = _f13_poll(stream, False)
        sc = min(2.6, 396.0 / len(stream))
        x = 14
        yb = y + 6
        for nm, a, e, bad in spans:
            isf = stream[a] == 0xB5 and nm not in ("GGA", "RMC")
            c = SIG if isf else TEA
            if bad is not None and not isf and nm in ("設定", "長い"):
                c = SIG
            if nm in ("設定", "長い", "ACK"):
                c = SIG
            wd = (e - a) * sc
            o.append(RECT(x, yb, wd - 1, 16, 2, soft(c), c, 1))
            if wd > tw(nm, 9) + 4:
                o.append(T(x + wd / 2, yb + 12, nm, "middle", 9, c, True))
            if bad:
                for k in bad:
                    xx = x + (k + 0.5) * sc
                    o.append(W(xx - 3, yb - 3, xx + 3, yb + 3, c=ALI, lw=1.8))
                    o.append(W(xx - 3, yb + 3, xx + 3, yb - 3, c=ALI, lw=1.8))
            x += wd
        # 結果
        for col, ev in ((420, evr), (566, evn)):
            xx = col
            for nm, a, e, bad in spans:
                ok = any(k in ("BOK", "NOK") and ci == e - 1 for k, ci, _ in ev)
                err = [z for k, ci, z in ev if k in ("BERR", "NERR") and a <= ci < e]
                lab = nm + ("✓" if ok else "×")
                cc = GRN if ok else ALI
                o.append(T(xx, yb + 12, lab, "start", 9.5, cc, True))
                xx += tw(lab, 9.5) + 6
        y += 40
    o.append(T(14, y + 2, "× の印は、化けた・切れたバイト。結果は、ホストの gcc で動かした 2 節のコードと同じ（Python に移し替えて描いた）", "start", 9.5, MUT))
    return SVG(700, y + 12, o, "2 節のコードの試験の入力と結果（ACK は 5 Hz の設定への応答、GGA・RMC は 10 章の例の文、長いフレームの中身は例）。")


F["e13_trace"] = _f13_trace_fig()


# =====================================================================
# 3 節: 出す文と更新レート・ボーレートで決まる負荷率
# =====================================================================
def _f13_select_fig():
    o = []
    o.append(T(14, 18, "1 回に出すバイトの数と、負荷率（GPS と GLONASS、8N1。10 章 4 節の例の文）", "start", 11.5, INK, True))
    rows = [("初めの 11 文（GGA・RMC・GSA ×2・GSV ×5・VTG・GLL）", _F13_ALL, TEA),
            ("GGA・RMC・GSA ×2", _f13_nb(2, ("GGA", "RMC", "GSA")), TEA),
            ("GGA・RMC", _f13_nb(2, ("GGA", "RMC")), TEA),
            ("バイナリの位置・速度・時刻のフレーム 1 つ（例: 本体 92 B）", 100, SIG)]
    cols = [(1, 9600), (2, 9600), (5, 9600), (10, 9600), (5, 115200), (10, 115200)]
    xb, wb = 14, 250
    xc0, cwid = 300, 64
    yh = 46
    o.append(T(xb, yh, "出すもの", "start", 10, MUT, True))
    o.append(T(xb + 180, yh, "1 回のバイト数", "end", 10, MUT, True))
    o.append(T(xc0 - 6, yh - 14, "更新レート", "end", 9, MUT))
    o.append(T(xc0 - 6, yh, "ボーレート [bit/s]", "end", 9, MUT))
    for j, (f, R) in enumerate(cols):
        x = xc0 + j * cwid + cwid / 2
        o.append(T(x, yh - 14, "%d Hz" % f, "middle", 10, INK, True))
        o.append(T(x, yh, format(R, ",").replace(",", " "), "middle", 9.5, MUT))
    o.append(W(14, yh + 6, 686, yh + 6, c=LIN, lw=0.8))
    y = yh + 16
    for lab, nb, c in rows:
        o.append(T(xb, y + 12, lab, "start", 9.5, INK, True))
        ww = 200.0 * nb / _F13_ALL
        o.append(RECT(xb, y + 18, ww, 12, 2, soft(c), c, 1))
        o.append(T(xb + ww + 5, y + 28, "%d B" % nb, "start", 9.5, c, True))
        for j, (f, R) in enumerate(cols):
            ld = 10.0 * nb * f / R
            cc = GRN if ld < 0.8 else (GLD if ld <= 1.0 else ALI)
            x = xc0 + j * cwid
            o.append(RECT(x + 3, y + 4, cwid - 6, 28, 4, soft(cc), cc, 1))
            o.append(T(x + cwid / 2, y + 23, "%.0f %%" % (ld * 100) if ld >= 0.095 else "%.1f %%" % (ld * 100), "middle", 10.5, cc, True))
        y += 44
    o.append(LEGEND(xc0, y + 8, [(GRN, "80 % 未満"), (GLD, "80〜100 %"), (ALI, "100 % を超える（送り切れない）")], 9.5, 12))
    return SVG(700, y + 18, o, "出すものと、更新レート・ボーレートを変えたときの負荷率 10 N_B f_u / R_B（文は 10 章の例。バイナリのフレームの本体の長さは例の形式の値）。".replace("N_B f_u / R_B", "×（1 回のバイト数）×（更新レート）÷（ボーレート）"))


F["e13_select"] = _f13_select_fig()


# =====================================================================
# 3 節: 位置の遅れ
# =====================================================================
def _f13_latency_fig():
    o = []
    tc = _F13_TC
    # (a) 1 Hz・9600 bit/s の時間の並び
    o.append(T(14, 18, "(a) 1 Hz・9600 bit/s・例の 11 文（626 B）: 位置を求めた時刻から、GGA を受け終わるまで", "start", 11.5, INK, True))
    p = Plot(110, 34, 560, 150, (-0.1, 2.4), (0, 1.3))
    X = p.X
    yl = 40
    for k in range(3):
        o.append(W(X(k), yl - 4, X(k), yl + 52, c=INK, lw=1.4))
        o.append(T(X(k), yl - 8, "%d s" % k, "middle", 9.5, INK, True))
    o.append(T(100, yl + 12, "位置を求める", "end", 9.5, INK, True))
    ttx = 10.0 * _F13_ALL / 9600
    tg = 10.0 * _F13_GGA / 9600
    yt = yl + 22
    o.append(T(100, yt + 12, "TXD の文", "end", 9.5, GLD, True))
    for k in range(3):
        a = k + tc
        if a > 2.4:
            break
        o.append(RECT(X(a), yt, X(min(a + tg, 2.4)) - X(a), 16, 0, SSOFT, SIG, 1))
        o.append(RECT(X(a + tg), yt, X(min(a + ttx, 2.4)) - X(a + tg), 16, 0, GOSOFT, GLD, 1))
    o.append(T(X(tc + tg) + 3, yt + 12, "GGA の後の 10 文（0.65 s で全部）", "start", 9, GLD, True, halo=True))
    o.append(DIM(X(0), yt + 30, X(tc), yt + 30, None, c=MUT))
    o.append(TX(X(tc / 2), yt + 43, "t_c 0.12 s", "middle", 9, MUT, True, halo=True))
    o.append(DIM(X(tc), yt + 30, X(tc + tg), yt + 30, None, c=SIG))
    o.append(T(X(tc + tg) + 4, yt + 43, "GGA 73 B: 0.076 s → 位置の遅れ %.2f s" % (tc + tg), "start", 9, SIG, True, halo=True))
    # 使う位置の古さ
    q = Plot(110, 124, 560, 80, (-0.1, 2.4), (0, 1.3))
    o.append(q.axes(xl="時間 t [s]", yl="古さ [s]", xt=[0, 0.5, 1, 1.5, 2], yt=[0, 0.5, 1.0], xfmt=lambda v: "%g" % v))
    o.append(T(q.x + 6, q.y + 10, "使う側が持っている最新の位置の古さ", "start", 9, GLD, True, halo=True))
    td = tc + tg
    pts = []
    for k in range(-1, 3):
        a = k + td
        b = k + 1 + td
        pts += [(max(a, -0.1), max(a, -0.1) - k), (min(b, 2.4), min(b, 2.4) - k)]
    o.append(q.clip(pts, c=GLD, lw=2))
    mean = td + 0.5
    o.append(W(q.x, q.Y(mean), q.x + q.w, q.Y(mean), c=GLD, lw=1, dash="5 3"))
    o.append(T(q.X(2.38), q.Y(mean) - 5, "平均 %.2f s = 遅れ + 0.5 s" % mean, "end", 9, GLD, True, halo=True))
    # (b) 遅れの変わり方
    yb = 262
    o.append(T(14, yb, "(b) 回ごとの GGA の遅れ（負荷率が 100 % を超えると、増え続ける）", "start", 11.5, INK, True))
    r = Plot(110, yb + 16, 330, 150, (0, 10), (0, 3.5))
    o.append(r.axes(xl="時間 t [s]", yl="位置の遅れ t_d [s]", xt=[0, 2, 4, 6, 8, 10], yt=[0, 1, 2, 3]))
    cases = [(1, 9600, _F13_ALL, SIG, "1 Hz・9600（65 %）: 0.20 s"), (5, 115200, _F13_ALL, GRN, "5 Hz・115 200（27 %）: 0.13 s"), (2, 9600, _F13_ALL, ALI, "2 Hz・9600（130 %）")]
    for f, R, nb, c, lab in cases:
        Tu, tx = 1.0 / f, 10.0 * nb / R
        pts = []
        for m in range(int(10 * f) + 1):
            d = tc + 10.0 * _F13_GGA / R + m * max(0.0, tx - Tu)
            pts.append((m * Tu, d))
        o.append(r.clip(pts, c=c, lw=2))
        for t_, d in pts:
            o.append(D(r.X(t_), r.Y(d), c, 2.2))
    o.append(T(r.X(9.8), r.Y(3.24) - 8, "1 秒に 0.30 s ずつ増える", "end", 9.5, ALI, True, halo=True))
    o.append(LEGL(40, yb + 212, [(c, None, lab) for f, R, nb, c, lab in cases], 9.5, 12))
    # (c) 動いている機器
    o.append(T(470, yb + 26, "(c) 100 km/h で動くとき、使う位置の", "start", 10.5, INK, True))
    o.append(T(470, yb + 41, "平均の後れ（平均の古さ × 速さ）", "start", 10.5, INK, True))
    v = 100 / 3.6
    bars = [("1 Hz・9600", tc + 10.0 * _F13_GGA / 9600 + 0.5, SIG), ("5 Hz・115 200", tc + 10.0 * _F13_GGA / 115200 + 0.1, GRN),
            ("10 Hz・115 200", tc + 10.0 * _F13_GGA / 115200 + 0.05, GRN)]
    yy = yb + 62
    for lab, age, c in bars:
        d = v * age
        o.append(T(560, yy + 11, lab, "end", 9.5, INK, True))
        o.append(RECT(566, yy, d * 5.0, 14, 2, soft(c), c, 1))
        o.append(T(566 + d * 5.0 + 4, yy + 11, "%.1f m" % d, "start", 9.5, c, True))
        o.append(T(560, yy + 24, "古さ %.2f s" % age, "end", 8.5, MUT))
        yy += 36
    o.append(T(470, yy + 8, "計算の時間 0.12 s が、どの場合にも残る", "start", 9, MUT))
    return SVG(700, yb + 224, o, "位置の遅れと、使う位置の古さ（t_c = 0.12 s と文の長さは例の値。モジュールの中のバッファがあふれる前まで描いた）。".replace("t_c", "計算の時間"))


F["e13_latency"] = _f13_latency_fig()


# =====================================================================
# 3 節: 通信の速さを変える順番
# =====================================================================
def _f13_baud_fig():
    o = []
    lanes = [("マイコン", SIG), ("モジュール", TEA)]
    W3 = 226
    panels = [
        ("(a) 正しい順番", [
            ("note", 0, "9600 bit/s"), ("note", 1, "9600 bit/s"),
            (0, 1, "速さを 115 200 にする", {"sub": "（9600 bit/s で送る）"}),
            ("note", 1, "115 200 に変える"),
            ("note", 0, "送り終えてから\n115 200 に変える"),
            (1, 0, "文・フレーム（115 200）", {"c": GRN}),
            ("note", 0, "チェックサムが合う\n→ 変えられた", {"c": GRN}),
        ]),
        ("(b) 先にマイコンを変えた", [
            ("note", 0, "先に 115 200 に変える", {"c": ALI}),
            (0, 1, "命令（115 200）", {"lost": True, "sub": "9600 で読むので化ける"}),
            ("note", 1, "9600 のまま"),
            (1, 0, "文（9600）", {"lost": True, "sub": "115 200 で読むので化ける"}),
            ("note", 0, "どちらも通じない", {"c": ALI}),
        ]),
        ("(c) 保存せずに入れ直した", [
            ("note", 1, "電源を入れ直す\n→ 9600 に戻る", {"c": ALI}),
            (1, 0, "文（9600）", {"lost": True, "sub": "115 200 で読むので化ける"}),
            ("note", 0, "2 s 届かない\n→ 9600 を試す"),
            (1, 0, "文（9600）", {"c": GRN}),
            (0, 1, "設定を送り直す"),
        ]),
    ]
    hmax = 0
    for k, (title, msgs) in enumerate(panels):
        x = 6 + k * (W3 + 8)
        o.append(T(x + 4, 18, title, "start", 11, INK, True))
        sv, h = seq(lanes, msgs, x=x, y=30, w=W3, head_h=26, dy=30, label_sz=9.5)
        o.append(sv)
        hmax = max(hmax, h)
    return SVG(700, hmax + 40, o, "通信の速さ（ボーレート）を 9600 から 115 200 bit/s に変える手順（速さは例の値）。上から下へ時間が進む。")


F["e13_baud"] = _f13_baud_fig()


# =====================================================================
# 4 節: 受ける衛星系
# =====================================================================
def _f13_gnss_vis(t, systems, mask=10.0):
    out = []
    for s in gnss_const():
        if s["sys"] not in systems:
            continue
        el, az, d = elaz(*GNSS_TOKYO, sat_ecef(s, t))
        if el > mask:
            out.append((el, az, s["sys"]))
    return out


def _f13_hdop(v):
    us = []
    for q in v:
        if q[2] not in us:
            us.append(q[2])
    rows = []
    for el, az, sy in v:
        e, a = _f13_m.radians(el), _f13_m.radians(az)
        r = [-_f13_m.cos(e) * _f13_m.sin(a), -_f13_m.cos(e) * _f13_m.cos(a), -_f13_m.sin(e)] + [0.0] * len(us)
        r[3 + us.index(sy)] = 1.0
        rows.append(r)
    G = _f13_np.array(rows)
    if G.shape[0] < G.shape[1]:
        return float("nan")
    H = _f13_np.linalg.inv(G.T @ G)
    return _f13_m.sqrt(H[0, 0] + H[1, 1])


_F13_COMBOS = [("GPS",), ("GPS", "GLONASS"), ("GPS", "GLONASS", "Galileo"), ("GPS", "GLONASS", "Galileo", "BeiDou")]


def _f13_combo_stats():
    out = []
    for c in _F13_COMBOS:
        ns, hs = [], []
        for k in range(24 * 6 + 1):
            v = _f13_gnss_vis(k * 600.0, c)
            ns.append(len(v))
            hs.append(_f13_hdop(v))
        hs.sort()
        out.append((sorted(ns)[len(ns) // 2], min(ns), max(ns), hs[len(hs) // 2]))
    return out


_F13_CSTAT = _f13_combo_stats()


def _f13_gnss_fig():
    o = []
    o.append(T(14, 18, "(a) 衛星系ごとの搬送波の周波数（L1 の近く。帯は信号の主な幅）", "start", 11.5, INK, True))
    p = Plot(40, 40, 620, 60, (1555, 1610), (0, 1))
    bands = [("BeiDou B1I", 1561.098 - 2.046, 1561.098 + 2.046, GLD, 0),
             ("Galileo E1", 1575.42 - 2.046, 1575.42 + 2.046, GRN, 0),
             ("GPS・みちびき L1 C/A", 1575.42 - 1.023, 1575.42 + 1.023, SIG, 1),
             ("GLONASS G1（衛星ごとに 0.5625 MHz ずつ違う）", 1598.0625 - 0.511, 1605.375 + 0.511, PUR, 0)]
    for nm, a, b, c, lev in bands:
        yy = p.y + 8 + lev * 16 if nm.startswith("GPS") else p.y + 8
        if nm.startswith("GPS"):
            yy = p.y + 24
        o.append(RECT(p.X(a), yy, p.X(b) - p.X(a), 14, 2, soft(c), c, 1.1))
    o.append(T(p.X(1561.098), p.y + 4, "BeiDou B1I", "middle", 9.5, GLD, True))
    o.append(T(p.X(1575.42), p.y + 4, "Galileo E1", "middle", 9.5, GRN, True))
    o.append(T(p.X(1575.42) + 22, p.y + 35, "GPS・みちびき L1 C/A", "start", 9.5, SIG, True))
    o.append(T(p.X(1601.7), p.y + 4, "GLONASS G1（FDMA）", "middle", 9.5, PUR, True))
    yax = p.y + 46
    o.append(W(p.x, yax, p.x + p.w, yax, c=MUT, lw=1.2))
    for f in range(1555, 1611, 5):
        o.append(W(p.X(f), yax, p.X(f), yax + 4, c=MUT, lw=1))
        o.append(T(p.X(f), yax + 15, "%d" % f, "middle", 9, MUT))
    o.append(T(p.x + p.w / 2, yax + 30, "周波数 f [MHz]", "middle", 10, MUT))
    # 1 つの RF の道で通す幅の例
    yr = yax + 44
    o.append(T(14, yr, "1 つの RF フロントエンドが一度に通す幅の例:", "start", 10, INK, True))
    spans = [("GPS・Galileo・みちびきだけ", 1573.2, 1577.6, SIG), ("BeiDou B1I も", 1558.9, 1577.6, GLD), ("GLONASS も", 1573.2, 1606.0, PUR)]
    for k, (nm, a, b, c) in enumerate(spans):
        yy = yr + 12 + k * 15
        o.append(DARR(p.X(a), yy, p.X(b), yy, c=c, lw=1.4, head=5))
        o.append(T(p.X(b) + 6 if b < 1590 else p.X(a) - 6, yy + 4, nm, "start" if b < 1590 else "end", 9.5, c, True))
    # (b) 組み合わせ
    yb = yr + 76
    o.append(T(14, yb, "(b) 受ける衛星系を増やすと（東京・24 時間の中央値・仰角マスク 10°。バイトの数は 10 章 4 節の例の文）", "start", 11.5, INK, True))
    hdr = [(14, "受ける衛星系", "start"), (300, "使える衛星の数", "middle"), (430, "HDOP", "middle"), (560, "1 回の文のバイト数", "middle"), (660, "9600・1 Hz", "middle")]
    for x, t, a in hdr:
        o.append(T(x, yb + 22, t, a, 10, MUT, True))
    o.append(W(14, yb + 28, 686, yb + 28, c=LIN, lw=0.8))
    names = ["GPS", "GPS + GLONASS", "GPS + GLONASS + Galileo", "GPS + GLONASS + Galileo + BeiDou"]
    for k, (nm, st) in enumerate(zip(names, _F13_CSTAT)):
        yy = yb + 46 + k * 26
        med, mn, mx, hd = st
        nb = _f13_nb(k + 1)
        o.append(T(14, yy, nm, "start", 10, INK, True))
        o.append(RECT(240, yy - 11, med * 3.0, 13, 2, SSOFT, SIG, 1))
        o.append(T(240 + med * 3.0 + 4, yy, "%d（%d〜%d）" % (med, mn, mx), "start", 9.5, SIG, True))
        o.append(RECT(400, yy - 11, hd * 50, 13, 2, GOSOFT, GLD, 1))
        o.append(T(400 + hd * 50 + 4, yy, "%.2f" % hd, "start", 9.5, GLD, True))
        o.append(RECT(500, yy - 11, nb * 0.1, 13, 2, TSOFT, TEA, 1))
        o.append(T(500 + nb * 0.1 + 4, yy, "%d B" % nb, "start", 9.5, TEA, True))
        ld = 10.0 * nb / 9600
        o.append(T(680, yy, "%.0f %%" % (ld * 100), "end", 10, ALI if ld > 1 else (GLD if ld > 0.8 else GRN), True))
    return SVG(700, yb + 46 + 4 * 26 - 4, o, "受ける衛星系の周波数と、組み合わせごとの衛星の数・HDOP・文の長さ（衛星の数と HDOP は 1 章の近似の配置で、7 章 4 節と同じく衛星系ごとに時計のずれの未知数を置いて計算した。RF フロントエンドの幅は例）。")


F["e13_gnss"] = _f13_gnss_fig()


# =====================================================================
# 4 節: 動きのモデル（例のモデル: 1 軸ずつの等速度のフィルタで、見込む加速度だけを変える。中身は 19 章）
# =====================================================================
_F13_DYN = [("止まっている", 0.0, SIG), ("歩く", 0.3, PUR), ("車", 3.0, GLD), ("空", 30.0, TEA)]   # 見込む加速度の大きさ [m/s²]（例のモデルの値）


def _f13_kf(z, dt, qa, R):
    F_ = _f13_np.array([[1.0, dt], [0.0, 1.0]])
    q = qa * qa
    Q = q * _f13_np.array([[dt ** 3 / 3, dt ** 2 / 2], [dt ** 2 / 2, dt]])
    x = _f13_np.array([z[0], 0.0])
    P = _f13_np.diag([R, 100.0])
    static = qa == 0.0
    out = []
    for k, zk in enumerate(z):
        if k:
            x = F_ @ x
            P = F_ @ P @ F_.T + Q
            if static:
                x[1] = 0.0
                P[1, :] = 0.0
                P[:, 1] = 0.0
        S = P[0, 0] + R
        K = P[:, 0] / S
        x = x + K * (zk - x[0])
        P = P - _f13_np.outer(K, P[0, :])
        if static:
            x[1] = 0.0
        out.append(x[0])
    return _f13_np.array(out)


def _f13_dyn_fig():
    o = []
    rng = _f13_np.random.default_rng(13)
    sig, dt = 2.0, 0.2
    o.append(T(14, 18, "(a) 止まっている機器（2 分。灰色の点が毎回の位置、色の点がならした位置）", "start", 11.5, INK, True))
    N = 600
    ze, zn = rng.normal(0, sig, N), rng.normal(0, sig, N)
    pw = 160
    for k, (nm, qa, c) in enumerate([_F13_DYN[0], _F13_DYN[2], _F13_DYN[3]]):
        x0 = 20 + k * 226
        p = Plot(x0 + 24, 40, pw, pw, (-6, 6), (-6, 6))
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
        for v in (-4, 0, 4):
            o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
            o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
        for a, b in zip(ze[::2], zn[::2]):
            if abs(a) < 6 and abs(b) < 6:
                o.append(D(p.X(a), p.Y(b), FNT, 1.3))
        fe, fn = _f13_kf(ze, dt, qa, sig ** 2), _f13_kf(zn, dt, qa, sig ** 2)
        for a, b in zip(fe[25::2], fn[25::2]):
            if abs(a) < 6 and abs(b) < 6:
                o.append(D(p.X(a), p.Y(b), c, 1.6))
        rms = float(_f13_np.sqrt(_f13_np.mean(fe[100:] ** 2 + fn[100:] ** 2)))
        o.append(T(p.x + p.w / 2, p.y + p.h + 16, "%sのモデル: ふらつき %.1f m" % (nm, rms), "middle", 10, c, True))
        for v in (-4, 0, 4):
            o.append(T(p.X(v), p.y + p.h + 30, "%d" % v, "middle", 8.5, MUT))
        o.append(T(p.x - 4, p.y + 9, "北 [m]", "end", 8.5, MUT))
    o.append(T(350, 262, "東 [m]（毎回の位置の誤差は東・北それぞれ 2 m（1σ）の例。ふらつきは、ならした位置の 2 乗平均の平方根）", "middle", 9, MUT))
    # (b) 曲がる車
    yb = 290
    o.append(T(14, yb, "(b) 15 m/s（54 km/h）で走り、半径 25 m で左へ曲がる車（緑の太い帯が本当の道。1 秒に 5 回）", "start", 11.5, INK, True))
    v, R0, t1 = 15.0, 25.0, 6.0
    ta = _f13_m.pi / 2 * R0 / v
    def truth(tt):
        if tt < t1:
            return (v * tt, 0.0)
        if tt < t1 + ta:
            a = (tt - t1) * v / R0
            return (v * t1 + R0 * _f13_m.sin(a), R0 * (1 - _f13_m.cos(a)))
        return (v * t1 + R0, R0 + v * (tt - t1 - ta))
    ts = [k * dt for k in range(int(14 / dt))]
    Pt = _f13_np.array([truth(tt) for tt in ts])
    Z = Pt + rng.normal(0, sig, Pt.shape)
    q = Plot(70, yb + 14, 330, 236, (40, 150), (-14, 66))
    o.append(RECT(q.x, q.y, q.w, q.h, 0, SCR, LIN, 0.8))
    o.append(q.axes(xl="東 [m]", yl="北 [m]", xt=[40, 60, 80, 100, 120, 140], yt=[0, 20, 40, 60]))
    o.append(q.clip([tuple(p_) for p_ in Pt], c=GSOFT, lw=9))
    o.append(q.clip([tuple(p_) for p_ in Pt], c=GRN, lw=1.2, dash="5 3"))
    for a, b in Z:
        if 40 < a < 150 and -14 < b < 66:
            o.append(D(q.X(a), q.Y(b), FNT, 1.4))
    errs = []
    for nm, qa, c in _F13_DYN[1:]:
        fe, fn = _f13_kf(Z[:, 0], dt, qa, sig ** 2), _f13_kf(Z[:, 1], dt, qa, sig ** 2)
        o.append(q.clip(list(zip(fe, fn)), c=c, lw=1.8))
        e = _f13_np.hypot(fe - Pt[:, 0], fn - Pt[:, 1])
        errs.append((nm, c, float(e.max()), float(_f13_np.sqrt(_f13_np.mean(e[10:28] ** 2)))))
    xr = 430
    o.append(T(xr, yb + 34, "ならした位置の誤差", "start", 10.5, INK, True))
    o.append(T(xr + 150, yb + 52, "曲がり角で最大", "end", 9.5, MUT, True))
    o.append(T(xr + 260, yb + 52, "まっすぐの所", "end", 9.5, MUT, True))
    for k, (nm, c, mx, rs) in enumerate(errs):
        yy = yb + 74 + k * 24
        o.append(W(xr, yy - 4, xr + 22, yy - 4, c=c, lw=2.2))
        o.append(T(xr + 28, yy, "%sのモデル" % nm, "start", 10, c, True))
        o.append(T(xr + 150, yy, "%.1f m" % mx, "end", 10, ALI if mx > 8 else INK, True))
        o.append(T(xr + 260, yy, "%.1f m" % rs, "end", 10, ALI if rs > 2 else INK, True))
    return SVG(700, yb + 290, o, "動きのモデルの働き（例のモデル: 受信機の中のフィルタを、見込む加速度の大きさ（止まっている 0・歩く 0.3・車 3・空 30 m/s²）だけを変えた簡単なもので計算した。毎回の位置の誤差は回ごとに独立とした。中身は 19 章）。")


F["e13_dyn"] = _f13_dyn_fig()


# =====================================================================
# 5 節: 省電力の 3 つの方式（電流の形）と平均の電流
# =====================================================================
_F13_IA, _F13_IT, _F13_IB = 35.0, 25.0, 0.015          # 捕捉中・追尾中・バックアップ [mA]（10 章の例の値）
_F13_TH, _F13_TW, _F13_TE = 2.0, 30.0, 7200.0          # ホットスタート・ウォームスタートの TTFF [s]、エフェメリスの有効な時間 [s]（例の値）
_F13_QB = 2000.0                                       # 電池の容量 [mAh]（例の値）


def _f13_iavg(Tu, ttrk=0.0, agnss=False, teph=_F13_TE):
    """平均の電流 [mA]（5 節の式。周期的に起きる方式）。"""
    if Tu <= _F13_TH + ttrk:
        return _F13_IT
    if agnss or Tu < teph:
        q = _F13_IA * _F13_TH + _F13_IT * ttrk + _F13_IB * (Tu - _F13_TH - ttrk)
        return q / Tu + (0.0 if agnss else _F13_IA * (_F13_TW - _F13_TH) / teph)
    q = _F13_IA * _F13_TW + _F13_IT * ttrk + _F13_IB * (Tu - _F13_TW - ttrk)
    return q / Tu


def _f13_modes_fig():
    o = []
    rows = [("(a) 連続: 追尾を続ける", "s"), ("(b) 周期的に起きる: 60 s ごとに起きて、位置が出たら眠る", "s"), ("(c) 必要なときだけ: マイコンが起こす（12 時間の例）", "h")]
    y = 14
    for k, (title, unit) in enumerate(rows):
        o.append(T(14, y + 4, title, "start", 11, INK, True))
        p = Plot(96, y + 14, 560, 76, (0, 150) if unit == "s" else (0, 12), (0.01, 100), ylog=True)
        o.append(p.axes(xl=("時間 t [s]" if unit == "s" else "時間 [時]") if k == 2 else None, yl=None, xt=[0, 30, 60, 90, 120, 150] if unit == "s" else [0, 2, 4, 6, 8, 10, 12],
                        yt=[0.01, 0.1, 1, 10, 100], yfmt=lambda v: ("%g" % v), sz=9))
        o.append(T(p.x - 34, p.y + p.h / 2 + 3, "電流", "end", 9, MUT))
        o.append(T(p.x - 34, p.y + p.h / 2 + 15, "[mA]", "end", 9, MUT))
        if k == 0:
            pts = [(0, _F13_IA), (_F13_TH, _F13_IA), (_F13_TH, _F13_IT), (150, _F13_IT)]
            o.append(p.line(pts, c=SIG, lw=2))
            o.append(T(p.X(75), p.Y(_F13_IT) + 14, "25 mA（はじめの 2 s は捕捉の 35 mA）", "middle", 9.5, SIG, True, halo=True))
            o.append(T(p.X(148), p.y + p.h - 6, "平均 25 mA", "end", 10, SIG, True, halo=True))
        elif k == 1:
            pts = [(0, _F13_IB)]
            for t0 in (0, 60, 120):
                pts += [(t0, _F13_IB), (t0, _F13_IA), (t0 + _F13_TH, _F13_IA), (t0 + _F13_TH, _F13_IB)]
            pts.append((150, _F13_IB))
            o.append(p.line(pts, c=GLD, lw=2))
            o.append(T(p.X(4), p.Y(_F13_IA) + 3, "35 mA × 2 s（ホットスタート）", "start", 9.5, GLD, True, halo=True))
            o.append(T(p.X(30), p.Y(_F13_IB) - 6, "15 µA で眠る", "middle", 9.5, GLD, True, halo=True))
            o.append(T(p.X(148), p.y + 12, "平均 %.2f mA" % _f13_iavg(60.0), "end", 10, GLD, True, halo=True))
            o.append(T(p.X(148), p.y + 25, "（2 時間に 1 回の 30 s を含む）", "end", 9, GLD, False, halo=True))
        else:
            wakes = [(1.0, False), (2.5, False), (8.0, True), (10.5, False)]
            pts = [(0, _F13_IB)]
            for t0, warm in wakes:
                d = (_F13_TW if warm else _F13_TH) / 3600.0
                pts += [(t0, _F13_IB), (t0, _F13_IA), (t0 + d, _F13_IA), (t0 + d, _F13_IB)]
            pts.append((12, _F13_IB))
            o.append(p.line(pts, c=PUR, lw=2))
            for t0, warm in wakes:
                o.append(T(p.X(t0) + 4, p.Y(_F13_IA) + 4, "30 s（ウォーム）" if warm else "2 s", "start", 9, ALI if warm else PUR, True, halo=True))
            o.append(T(p.X(5.25), p.Y(1.0), "前の位置から 5.5 時間 > エフェメリスの有効な時間", "middle", 9, ALI, False, halo=True))
            q = (3 * _F13_IA * _F13_TH + _F13_IA * _F13_TW) * 1.0 + _F13_IB * 12 * 3600
            o.append(T(p.X(11.9), p.Y(0.25), "平均 %.3f mA" % (q / (12 * 3600)), "end", 10, PUR, True, halo=True))
        y += 118
    return SVG(700, y + 14, o, "省電力の 3 つの方式の電流の形（電流は 10 章の例の値、TTFF はホット 2 s・ウォーム 30 s、エフェメリスの有効な時間は 2 時間とした例。縦軸は対数の目盛）。")


F["e13_modes"] = _f13_modes_fig()


def _f13_avg_fig():
    o = []
    o.append(TX(14, 18, "周期的に起きる間隔 T_u と、平均の電流・電池の持ち時間（2000 mAh）", "start", 11.5, INK, True))
    p = Plot(80, 34, 520, 300, (1, 86400), (0.01, 100), xlog=True, ylog=True)
    o.append(RECT(p.X(7200), p.y, p.X(14400) - p.X(7200), p.h, 0, ASOFT, "none", 0))
    o.append(T(p.X(10200), p.y + 12, "有効な時間", "middle", 9, ALI, True, halo=True))
    o.append(T(p.X(10200), p.y + 24, "2〜4 時間", "middle", 9, ALI, True, halo=True))
    xt = [1, 10, 60, 600, 3600, 36000, 86400]
    o.append(p.axes(xl="周期（起きる間隔）T_u", yl=None, xt=xt, yt=[0.01, 0.1, 1, 10, 100], xfmt=lambda v: {1: "1 s", 10: "10 s", 60: "1 分", 600: "10 分", 3600: "1 時間", 36000: "10 時間", 86400: "1 日"}[v], yfmt=lambda v: "%g" % v))
    o.append(T(p.x - 40, p.y + p.h / 2 - 4, "平均の電流", "middle", 10, MUT, rot=-90))
    o.append(T(p.x - 26, p.y + p.h / 2 - 4, "[mA]", "middle", 10, MUT, rot=-90))
    Ts = list(_f13_np.logspace(0, _f13_m.log10(86400), 400))
    o.append(p.line([(1, _F13_IT), (86400, _F13_IT)], c=SIG, lw=2))
    o.append(T(p.X(600), p.Y(_F13_IT) - 6, "連続 25 mA", "middle", 9.5, SIG, True, halo=True))
    cyc = [(t, _f13_iavg(t)) for t in Ts if t > _F13_TH]
    o.append(p.clip(cyc, c=GLD, lw=2.4))
    ag = [(t, _f13_iavg(t, agnss=True)) for t in Ts if t > _F13_TH]
    o.append(p.clip(ag, c=GRN, lw=1.8, dash="6 3"))
    fl = _F13_IA * (_F13_TW - _F13_TH) / _F13_TE
    o.append(W(p.X(600), p.Y(fl), p.X(7200), p.Y(fl), c=GLD, lw=1, dash="2 3"))
    o.append(T(p.X(120), p.Y(fl) + 4, "下げ止まり %.2f mA" % fl, "end", 9, GLD, True, halo=True))
    # 印
    tb = _F13_IA * _F13_TH / (_F13_IT - _F13_IB - fl)
    for t_, lab, dx, dy, a in ((tb, "損益分岐 %.1f s" % tb, 8, -8, "start"), (60, "60 s: %.2f mA" % _f13_iavg(60), 8, -8, "start"),
                               (3600, "1 時間: %.2f mA" % _f13_iavg(3600), 6, 16, "start"), (14400, "4 時間: %.3f mA（毎回 30 s）" % _f13_iavg(14400), -6, 16, "end")):
        I = _f13_iavg(t_)
        o.append(D(p.X(t_), p.Y(I), INK, 3.4))
        o.append(T(p.X(t_) + dx, p.Y(I) + dy, lab, a, 9.5, INK, True, halo=True))
    o.append(LEGL(80, p.y + p.h + 46, [(SIG, None, "連続"), (GLD, None, "周期的に起きる（エフェメリスを受け直す）"), (GRN, "6 3", "A-GNSS でエフェメリスを受け取る")], 9.5, 14))
    # 右の目盛: 電池の持ち時間
    for life, lab in ((24 * 10, "10 日"), (24 * 100, "100 日"), (24 * 365, "1 年"), (24 * 365 * 10, "10 年")):
        I = _F13_QB / life
        if 0.01 <= I <= 100:
            o.append(W(p.x + p.w, p.Y(I), p.x + p.w + 4, p.Y(I), c=MUT, lw=1))
            o.append(T(p.x + p.w + 7, p.Y(I) + 3, lab, "start", 9, MUT))
    o.append(T(p.x + p.w + 8, p.y - 6, "持ち時間", "start", 9, MUT, True))
    return SVG(700, p.y + p.h + 58, o, "周期的に起きる方式の平均の電流（5 節の式。電流は 10 章の例の値、TTFF はホット 2 s・ウォーム 30 s、エフェメリスの有効な時間 2 時間、位置が出た後の追尾 0 s。右の目盛は 2000 mAh の電池の持ち時間）。")


F["e13_avg"] = _f13_avg_fig()


# =====================================================================
# 6 節: ACK・NAK と、送り直し
# =====================================================================
def _f13_ack_fig():
    o = []
    lanes = [("マイコン", SIG), ("モジュール", TEA)]
    W2 = 336
    panels = [
        ("(a) 受け入れた → 読み出して比べる", [
            (0, 1, "設定 06 08（200 ms）"),
            (1, 0, "ACK 05 01（本体 06 08）", {"c": GRN}),
            (0, 1, "読み出し 06 08（本体なし）"),
            (1, 0, "06 08（200 ms）", {"c": GRN}),
            ("note", 0, "送った本体と同じ → 済み", {"c": GRN}),
        ]),
        ("(b) 受け入れない", [
            (0, 1, "設定 06 08（20 ms）"),
            ("note", 1, "範囲の外の値（例）"),
            (1, 0, "NAK 05 00（本体 06 08）", {"c": ALI}),
            ("note", 0, "CMD_NAK: 値を見直す", {"c": ALI}),
        ]),
        ("(c) 応答が失われた → 送り直す", [
            (0, 1, "設定 06 08（1 回目）"),
            (1, 0, "ACK", {"lost": True, "sub": "化けて捨てられた"}),
            ("span", 0, 2, "1000 ms\n待つ", {"c": GLD, "side": -1}),
            (0, 1, "同じフレーム（2 回目）"),
            (1, 0, "ACK 05 01", {"c": GRN}),
        ]),
        ("(d) 応答が無い → 3 回で諦める", [
            (0, 1, "設定（1 回目）", {"lost": True}),
            (0, 1, "設定（2 回目）", {"lost": True}),
            (0, 1, "設定（3 回目）", {"lost": True}),
            ("span", 0, 3, "1000 ms\nずつ", {"c": GLD, "side": -1}),
            ("note", 0, "CMD_FAIL: 線・速さ・電源を確かめる", {"c": ALI}),
        ]),
    ]
    ys = [0, 0]
    hrow = 0
    for k, (title, msgs) in enumerate(panels):
        col, row = k % 2, k // 2
        x = 10 + col * (W2 + 8)
        y0 = 14 + row * (hrow + 30) if row else 14
        o.append(T(x + 4, y0 + 4, title, "start", 11, INK, True))
        sv, h = seq(lanes, msgs, x=x + 18, y=y0 + 14, w=W2 - 18, head_h=24, dy=30, label_sz=9.5)
        o.append(sv)
        if row == 0:
            hrow = max(hrow, h)
        ys[row] = max(ys[row], y0 + 14 + h)
    return SVG(700, max(ys) + 8, o, "命令と応答の 4 つの場合（クラスと ID は例の形式。待つ時間 1000 ms・3 回は 6 節のコードの例の値。ホストの試験では、模擬のモジュールが 30 ms 後に応答する）。")


F["e13_ack"] = _f13_ack_fig()


# =====================================================================
# 6 節: 設定はどこに入り、いつまで残るか
# =====================================================================
def _f13_layers_fig():
    o = []
    o.append(T(14, 18, "(a) 設定の入る所（例の形式の新しい版の考え方。版と製品で違う）", "start", 11.5, INK, True))
    L = [("今使う設定（RAM）", "受信機は、ここにある値で動く", SIG), ("バックアップ電源のメモリ（10 章 3 節）", "主の電源を切っても、バックアップ電源がある間は残る", GLD),
         ("フラッシュメモリ", "電源が無くても残る。書き換えの回数に限りがある", PUR)]
    for k, (nm, sub, c) in enumerate(L):
        yy = 34 + k * 44
        o.append(RECT(130, yy, 330, 36, 6, soft(c), c, 1.4))
        o.append(T(142, yy + 15, nm, "start", 10.5, c, True))
        o.append(T(142, yy + 29, sub, "start", 9, INK))
    o.append(ARR(110, 40, 110, 150, c=INK, lw=1.5))
    o.append(T(104, 52, "送るときに", "end", 9.5, INK, True))
    o.append(T(104, 65, "書く層を", "end", 9.5, INK, True))
    o.append(T(104, 78, "選ぶ", "end", 9.5, INK, True))
    o.append(ARR(480, 150, 480, 40, c=GRN, lw=1.5))
    o.append(T(488, 80, "起動のとき、下の層の値で", "start", 9.5, GRN, True))
    o.append(T(488, 93, "今使う設定を作り直す", "start", 9.5, GRN, True))
    o.append(T(488, 112, "（無ければ初めの値）", "start", 9.5, GRN, False))
    # (b) どれが残るか
    yb = 184
    o.append(T(14, yb, "(b) 書いた所と、電源を切って入れ直した後", "start", 11.5, INK, True))
    hdr = [(14, "書いた所", "start"), (420, "主の電源だけを切った", "middle"), (590, "バックアップ電源も尽きた", "middle")]
    for x, t, a in hdr:
        o.append(T(x, yb + 22, t, a, 10, MUT, True))
    o.append(W(14, yb + 28, 686, yb + 28, c=LIN, lw=0.8))
    rows = [("今使う設定だけ", "初めの値に戻る", "初めの値に戻る"),
            ("今使う設定とバックアップ電源のメモリ", "残る", "初めの値に戻る"),
            ("フラッシュメモリにも", "残る", "残る")]
    for k, (a, b, c_) in enumerate(rows):
        yy = yb + 48 + k * 24
        o.append(T(14, yy, a, "start", 10, INK, True))
        for x, v in ((420, b), (590, c_)):
            cc = GRN if v == "残る" else ALI
            o.append(RECT(x - 66, yy - 14, 132, 20, 4, soft(cc), cc, 1))
            o.append(T(x, yy, v, "middle", 10, cc, True))
    o.append(T(14, yb + 48 + 3 * 24 + 4, "通信の速さが初めの値に戻ると、マイコンとモジュールの速さが合わなくなる（3 節の図の (c)）。", "start", 9.5, ALI, True))
    return SVG(700, yb + 48 + 3 * 24 + 14, o, "設定の入る所と、電源を切った後に残るか（例の形式の新しい版の考え方を簡単にしたもの。古い版では、今の設定を保存する命令を別に送る）。")


F["e13_layers"] = _f13_layers_fig()
