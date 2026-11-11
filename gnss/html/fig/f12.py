# -*- coding: utf-8 -*-
# 12 章 NMEA を読む — 文の形式とチェックサム の図
import numpy as _f12_np

# =====================================================================
# 例の値（本文・デモと同じ。check.py で確かめた）
#   東京（1 章の例の点）、6 章・7 章の 8 つの GPS の衛星（時刻 0）。時刻と日付は 10 章と同じ例の値
# =====================================================================
_F12_TOK = GNSS_TOKYO
_F12_D2R = math.pi / 180


def _f12_cks(body):
    """NMEA のチェックサム（中身の全部の文字の排他的論理和）。"""
    x = 0
    for ch in body:
        x ^= ord(ch)
    return x


def _f12_sent(body):
    """$ と *hh を付けた文（CR LF は付けない）。"""
    return "$%s*%02X" % (body, _f12_cks(body))


# 3 章 3 節の C/N0 のモデル（例のアンテナ・290 K の熱雑音だけ）
_F12_LAM = 299792458.0 / 1575.42e6


def _f12_rng(el):
    th = el * _F12_D2R
    return math.sqrt(26560e3 ** 2 - (6371e3 * math.cos(th)) ** 2) - 6371e3 * math.sin(th)


def _f12_lfs(r):
    return 20 * math.log10(4 * math.pi * r / _F12_LAM)


_F12_EIRP = -128.5 - 30 + _f12_lfs(_f12_rng(5.0)) + 0.5
_F12_N0 = 10 * math.log10(1.380649e-23 * 290) + 30


def _f12_cn0(el):
    return _F12_EIRP + 30 - _f12_lfs(_f12_rng(el)) - 0.5 + (3.0 - 8.0 * ((90.0 - el) / 85.0) ** 2) - _F12_N0


def _f12_vis(t=0.0, sysn="GPS"):
    """東京から見える衛星 [(番号, 仰角, 方位角, C/N0)]（番号の順）。GPS の番号は PRN 番号。"""
    out = []
    for s in gnss_const():
        if s["sys"] != sysn:
            continue
        el, az, d = elaz(*_F12_TOK, sat_ecef(s, t))
        if el > 0:
            out.append((int(s["nm"][1:]), el, az, _f12_cn0(el)))
    return sorted(out)


_F12_VIS = _f12_vis()                              # PRN 2, 3, 5, 6, 9, 13, 16, 22


def _f12_dops(vis):
    G = []
    for _, el, az, _c in vis:
        e, a = el * _F12_D2R, az * _F12_D2R
        G.append([-math.cos(e) * math.sin(a), -math.cos(e) * math.cos(a), -math.sin(e), 1.0])
    G = _f12_np.array(G)
    H = _f12_np.linalg.inv(G.T @ G)
    return math.sqrt(H[0, 0] + H[1, 1] + H[2, 2]), math.sqrt(H[0, 0] + H[1, 1]), math.sqrt(H[2, 2])


_F12_PDOP, _F12_HDOP, _F12_VDOP = _f12_dops(_F12_VIS)
_F12_LAT, _F12_LON = "3540.86000", "13946.02000"
_F12_GGA = "GPGGA,092750.00,%s,N,%s,E,1,%02d,%.2f,3.3,M,36.7,M,," % (_F12_LAT, _F12_LON, len(_F12_VIS), _F12_HDOP)
_F12_RMC = "GPRMC,092750.00,A,%s,N,%s,E,0.012,,111126,,,A" % (_F12_LAT, _F12_LON)
_F12_GSA = ("GPGSA,A,3," + ",".join(["%02d" % q[0] for q in _F12_VIS] + [""] * (12 - len(_F12_VIS)))
            + ",%.2f,%.2f,%.2f" % (_F12_PDOP, _F12_HDOP, _F12_VDOP))


def _f12_gsv(vis, talk="GP", idoff=0):
    nm = (len(vis) + 3) // 4
    out = []
    for m in range(nm):
        f = [talk + "GSV", str(nm), str(m + 1), "%02d" % len(vis)]
        for q in vis[4 * m:4 * m + 4]:
            f += ["%02d" % (q[0] + idoff), "%02d" % round(q[1]), "%03d" % (round(q[2]) % 360), "%02d" % round(q[3])]
        out.append(",".join(f))
    return out


_F12_GSV = _f12_gsv(_F12_VIS)
_F12_VTG = "GPVTG,,T,,M,0.012,N,0.022,K,A"
_F12_GLL = "GPGLL,%s,N,%s,E,092750.00,A,A" % (_F12_LAT, _F12_LON)
_F12_EPOCH = [("GGA", _F12_GGA), ("RMC", _F12_RMC), ("GSA", _F12_GSA)] + [("GSV", g) for g in _F12_GSV] + [("VTG", _F12_VTG), ("GLL", _F12_GLL)]
_F12_KC = {"GGA": SIG, "RMC": PUR, "GSA": GRN, "GSV": GLD, "VTG": TEA, "GLL": MUT}   # 10 章の図と同じ色


# =====================================================================
# 図の補助
# =====================================================================
def _f12_mono(x, y, segs, sz=10.5, cw=None, b=False, a="start", halo=False):
    """等幅の文字を 1 文字ずつ位置を決めて描く（フォントの幅の違いで欄の位置がずれないように）。
    segs = [(文字, 色), ...]。1 文字の幅は cw（既定 0.6 sz）。返り値は svg。"""
    cw = cw or 0.6 * sz
    n = sum(len(t) for t, _ in segs)
    if a == "middle":
        x -= n * cw / 2
    elif a == "end":
        x -= n * cw
    if _CHECK and n:
        _BOXES.append((x, y - sz * 0.82, x + n * cw, y + sz * 0.22, "".join(t for t, _ in segs)))
    hs = ' stroke="%s" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' % SCR if halo else ""
    o = ['<text y="%g" font-size="%g" font-family="var(--mono)" font-weight="%s"%s>' % (round(y, 2), sz, "700" if b else "400", hs)]
    k = 0
    for t, c in segs:
        if not t:
            continue
        xs = " ".join("%g" % round(x + (k + i) * cw, 2) for i in range(len(t)))
        o.append('<tspan x="%s" fill="%s">%s</tspan>' % (xs, c, E(t)))
        k += len(t)
    o.append("</text>")
    return "".join(o)


def _f12_brk(x1, x2, y, c, down=True, h=5):
    """横の括弧（下向き: 両端が上に立つ）。"""
    s = -1 if down else 1
    return W(x1, y + s * h, x1, y, x2, y, x2, y + s * h, c=c, lw=1.2)


def _f12_fields(body):
    """中身をカンマで分けた欄の [(欄の番号, 頭の文字の位置, 文字)]（空の欄も残す）。"""
    out, pos = [], 0
    for k, f in enumerate(body.split(",")):
        out.append((k, pos, f))
        pos += len(f) + 1
    return out


# =====================================================================
# 1 節: 文字の行が並んだもの — バイトの列と、1 回分の 7 文
# =====================================================================
def _f12_role(ch):
    if ch == "$":
        return SIG
    if ch == ",":
        return TEA
    if ch in "*":
        return PUR
    if ch in "\r\n":
        return GLD
    return None


def _f12_cells(o, x, y, chars, cw=26, ck=None):
    """1 文字ずつの箱（上に文字、下に 16 進）。ck は * の後の 2 桁の位置（色をチェックサムにする）。"""
    for i, ch in enumerate(chars):
        c = PUR if (ck is not None and i in ck) else _f12_role(ch)
        xx = x + i * cw
        o.append(RECT(xx, y, cw - 2, 40, 3, soft(c) if c else PAN, c or LIN, 1.0))
        if ch in "\r\n":
            o.append(T(xx + cw / 2 - 1, y + 18, "CR" if ch == "\r" else "LF", "middle", 10, c, True))
        else:
            o.append(T(xx + cw / 2 - 1, y + 18, ch, "middle", 13, c or INK, True, True))
        o.append(T(xx + cw / 2 - 1, y + 34, "%02X" % ord(ch), "middle", 9.5, c or MUT, False, True))


def _f12_stream_fig():
    o = []
    gga = _f12_sent(_F12_GGA) + "\r\n"
    rmc = _f12_sent(_F12_RMC) + "\r\n"
    o.append(T(14, 18, "(a) UART で届くバイトの列（1 回分の初めと、GGA から RMC への境目。下の段は 16 進の値）", "start", 11.5, INK, True))
    c1 = gga[:24]
    _f12_cells(o, 24, 30, c1)
    o.append(T(24 + 24 * 26 + 8, 56, "…", "start", 13, MUT, True))
    tail = gga[-12:]                     # "6.7,M,,*54\r\n"
    c2 = tail + rmc[:11]
    ckp = [len(tail) - 4, len(tail) - 3]
    o.append(T(14, 110, "…", "start", 13, MUT, True))
    x2 = 30
    _f12_cells(o, x2, 84, c2, ck=ckp)
    o.append(T(x2 + len(c2) * 26 + 6, 110, "…", "start", 13, MUT, True))
    # 境目の注記
    xa, xb = x2, x2 + len(tail) * 26 - 2
    o.append(_f12_brk(xa, xb, 132, MUT))
    o.append(T((xa + xb) / 2, 148, "GGA の終わり（* とチェックサム、CR LF）", "middle", 9.5, INK))
    xc, xd = x2 + len(tail) * 26, x2 + len(c2) * 26 - 2
    o.append(_f12_brk(xc, xd, 132, SIG))
    o.append(T((xc + xd) / 2, 148, "次の文（RMC）の頭", "middle", 9.5, SIG, True))
    leg = [(SIG, "$ 文の頭"), (TEA, ", 欄の区切り"), (PUR, "* とチェックサム（3 節）"), (GLD, "CR LF 文の終わり")]
    o.append(LEGEND(24, 172, leg, 10, 22))
    # (b) 1 回分の 7 文
    yb = 202
    o.append(T(14, yb, "(b) 1 回分の 7 文（端末に表示したとき）と、それぞれの長さ（$ から LF まで）", "start", 11.5, INK, True))
    y = yb + 22
    tot = 0
    for k, s in _F12_EPOCH:
        line = _f12_sent(s)
        n = len(line) + 2
        tot += n
        o.append(_f12_mono(14, y, [(line, INK)], 9.5))
        c = _F12_KC[k]
        o.append(T(430, y, k, "start", 10, c, True))
        o.append(RECT(462, y - 9, n * 2.6, 11, 2, soft(c), c, 1.0))
        o.append(T(462 + n * 2.6 + 6, y, "%d B" % n, "start", 9.5, c, True))
        y += 17
    o.append(T(14, y + 8, "合計 %d B。1 秒に 1 回なら、データ量は %d B/s（9600 bit/s・8N1 で送ると %.2f s）" % (tot, tot, tot * 10 / 9600.0),
               "start", 10, INK, True))
    return SVG(700, y + 18, o, "モジュールが出すバイトの列（例の文。6 章・7 章の東京の 8 つの GPS の衛星、時刻と日付は例の値）。")


F["e12_stream"] = _f12_stream_fig()


# =====================================================================
# 1 節: 文の部分 — 話者 ID・文の種類・欄・チェックサム
# =====================================================================
def _f12_anatomy_fig():
    o = []
    body = _F12_GGA
    line = _f12_sent(body)
    sz, cw, x0, yt = 11, 6.6, 92, 66
    X = lambda i: x0 + i * cw            # i 番目の文字の左端
    o.append(T(14, 18, "(a) 文の部分（例の GGA）", "start", 11.5, INK, True))
    segs = [("$", SIG), ("GP", GRN), ("GGA", INK), (line[6:-3], MUT), ("*", PUR), (line[-2:], PUR)]
    o.append(_f12_mono(x0, yt, segs, sz, cw, True))
    xe = X(len(line))
    for j, lab in enumerate(("CR", "LF")):
        o.append(RECT(xe + 2 + j * 22, yt - 11, 20, 15, 3, soft(GLD), GLD, 1.0))
        o.append(T(xe + 12 + j * 22, yt, lab, "middle", 9.5, GLD, True))
    xend = xe + 2 + 44
    # 上の注記
    o.append(T(x0 - 6, yt, "文の頭", "end", 10, SIG, True))
    o.append(W(X(2), yt - 12, X(2), 48, c=GRN, lw=1.1))
    o.append(T(X(2) + 4, 44, "話者 ID（2 文字）", "end", 10, GRN, True))
    o.append(W(X(4.5), yt - 12, X(4.5), 32, c=INK, lw=1.1))
    o.append(T(X(4.5) + 6, 30, "文の種類（3 文字）", "start", 10, INK, True))
    xs = X(len(line) - 3)
    o.append(W(xs + 3, yt - 12, xs + 3, 48, c=PUR, lw=1.1))
    o.append(T(xs + 3, 44, "* の後の 16 進 2 桁: チェックサム（3 節）", "end", 10, PUR, True))
    o.append(W(xe + 23, yt - 13, xe + 23, 32, c=GLD, lw=1.1))
    o.append(T(xe + 23, 28, "CR LF: 文の終わり", "middle", 10, GLD, True))
    # 下の注記
    o.append(_f12_brk(X(5), X(len(line) - 3), yt + 8, TEA))
    o.append(T((X(5) + X(len(line) - 3)) / 2, yt + 24, "欄（カンマで区切った %d 個。2 節）" % (len(body.split(",")) - 1), "middle", 10, TEA, True))
    o.append(_f12_brk(X(1), X(len(line) - 3), yt + 32, INK))
    o.append(T((X(1) + X(len(line) - 3)) / 2, yt + 48, "中身（$ と * の間）%d 文字（76 文字以下）" % len(body), "middle", 10, INK, True))
    o.append(DIM(x0, yt + 62, xend, yt + 62))
    o.append(T((x0 + xend) / 2, yt + 80, "$ から LF まで %d 文字（規格では 82 文字以下とされる）" % (len(line) + 2), "middle", 10, INK, True))
    # (b) 話者 ID
    yb = 182
    o.append(T(14, yb, "(b) $ の直後の 2 文字（話者 ID）の例（書き方は規格の版とモジュールによる）", "start", 11.5, INK, True))
    tl = [("GP", "GPS", SIG), ("GL", "GLONASS", PUR), ("GA", "Galileo", GRN), ("GB・BD", "BeiDou", GLD), ("GQ", "みちびき", TEA), ("GN", "複数の衛星系", INK)]
    for k, (t, nm, c) in enumerate(tl):
        xx = 14 + k * 113
        o.append(RECT(xx, yb + 10, 105, 46, 6, soft(c), c, 1.2))
        o.append(T(xx + 52.5, yb + 31, t, "middle", 13, c, True, True))
        o.append(T(xx + 52.5, yb + 48, nm, "middle", 10, INK))
    # (c) 文の種類
    yc = yb + 84
    o.append(T(14, yc, "(c) 文の種類の例", "start", 11.5, INK, True))
    kinds = [("GGA", "測位の結果（時刻・位置・高さ）", SIG), ("RMC", "時刻・日付・位置・速さ", PUR), ("GSA", "使った衛星と DOP", GRN),
             ("GSV", "見えている衛星（仰角・方位角・C/N_0）", GLD), ("VTG", "速さと進む向き", TEA), ("GLL", "緯度・経度と時刻", MUT),
             ("$P…", "モジュールの作り手が独自に決めた文", INK)]
    for k, (t, d, c) in enumerate(kinds):
        col, row = divmod(k, 4)
        xx, yy = 14 + col * 346, yc + 22 + row * 21
        o.append(T(xx, yy, t, "start", 11, c, True, True))
        o.append(TX(xx + 44, yy, d, "start", 10, INK))
    return SVG(700, yc + 22 + 3 * 21 + 14, o, "NMEA 0183 の文の形（例の GGA）と、話者 ID・文の種類の例。")


F["e12_anatomy"] = _f12_anatomy_fig()


# =====================================================================
# 2 節: 欄ごとに色を付け、右の欄へ線を引いて意味を書く図の部品
# =====================================================================
def _f12_grp(body, fa, fb=None):
    """中身の欄 fa〜fb の、文（$ を含む）の中の文字の範囲 (i0, i1)。"""
    fl = _f12_fields(body)
    fb = fa if fb is None else fb
    return fl[fa][1] + 1, fl[fb][1] + 1 + len(fl[fb][2])


def _f12_annot(o, line, groups, x0, ys, y1, sz=10, xl=452, dy=18, lsz=10):
    """文 line を描き、groups = [(i0, i1, 色, 説明)] の範囲から右の欄へ線を引いて説明を書く（TX の書き方が使える）。
    右にある範囲ほど上の行に置くので、線は交わらない。返り値は最後の行の y。"""
    cw = 0.6 * sz
    cols = [MUT] * len(line)
    for i0, i1, c, _ in groups:
        for i in range(i0, i1):
            cols[i] = c
    segs, cur, run = [], None, ""
    for ch, c in zip(line, cols):
        if c != cur and run:
            segs.append((run, cur)); run = ""
        cur = c; run += ch
    segs.append((run, cur))
    o.append(_f12_mono(x0, ys, segs, sz, cw, True))
    order = sorted(range(len(groups)), key=lambda k: -groups[k][0])
    yr = y1
    for r, k in enumerate(order):
        i0, i1, c, lab = groups[k]
        xa, xb = x0 + i0 * cw, x0 + i1 * cw
        if i1 - i0 < 0.5:
            xa, xb = xa - 2.5, xa + 2.5
        xc = (xa + xb) / 2
        yr = y1 + r * dy
        o.append(_f12_brk(xa + 0.6, xb - 0.6, ys + 5, c))
        o.append(W(xc, ys + 5, xc, yr - 4, xl, yr - 4, c=c, lw=1.0))
        o.append(TX(xl + 6, yr, lab, "start", lsz, c, True))
    return yr


# =====================================================================
# 2 節: GGA
# =====================================================================
def _f12_gga_fig():
    o = []
    body = _F12_GGA
    line = _f12_sent(body)
    o.append(T(14, 18, "(a) GGA の欄（東京の例。右の説明は、線でつないだ欄の意味と値）", "start", 11.5, INK, True))
    G = lambda a, b=None: _f12_grp(body, a, b)
    grs = [(1, 6, INK, "GPS で求めた GGA"),
           G(1) + (SIG, "時刻 09:27:50.00（UTC）"),
           G(2, 3) + (GLD, "緯度: 北緯 35°40.86′（35.681°）"),
           G(4, 5) + (GLD, "経度: 東経 139°46.02′（139.767°）"),
           G(6) + (GRN, "測位の品質 1（単独で求めた）"),
           G(7) + (TEA, "使った衛星の数 8"),
           G(8) + (TEA, "HDOP 0.95"),
           G(9, 10) + (PUR, "標高 3.3 m"),
           G(11, 12) + (PUR, "ジオイド高 36.7 m"),
           G(13, 14) + (MUT, "補正の年齢と基準局（空。16 章）"),
           (len(line) - 3, len(line), MUT, "チェックサム（3 節）")]
    yl = _f12_annot(o, line, grs, 14, 46, 72)
    # (b) 測位の品質の値
    yb = yl + 34
    o.append(T(14, yb, "(b) 測位の品質の主な値（ほかの値もある。版による）", "start", 11.5, INK, True))
    qs = [("0", "位置が求まっていない（緯度・経度を使わない）", ALI), ("1", "単独で求めた（1〜7 章の方法）", GRN), ("2", "補正を使って求めた（DGNSS。16 章）", PUR),
          ("4・5", "RTK で求めた（17 章）", PUR), ("6", "慣性センサなどで推測した（19 章）", GLD)]
    for k, (v, d, c) in enumerate(qs):
        yy = yb + 22 + k * 19
        o.append(RECT(14, yy - 13, 38, 17, 4, soft(c), c, 1.0))
        o.append(T(33, yy, v, "middle", 11, c, True, True))
        o.append(T(60, yy, d, "start", 10, INK))
    # (c) 高さの欄
    xc0 = 420
    o.append(T(xc0 - 14, yb, "(c) 高さの欄（縦は誇張して描いた）", "start", 11.5, INK, True))
    ye, yg, yp = yb + 116, yb + 62, yb + 36          # 楕円体・ジオイド・点の y
    xa, xb = xc0 - 4, xc0 + 250
    o.append(W(xa, ye, xb, ye, c=MUT, lw=1.6))
    o.append(T(xb, ye + 14, "楕円体", "end", 10, MUT, True))
    pts = [(xa + i * (xb - xa) / 40.0, yg + 4 * math.sin(i / 40.0 * 5.0)) for i in range(41)]
    o.append(PL(pts, c=TEA, lw=1.6))
    o.append(T(xb, yg - 8, "ジオイド", "end", 10, TEA, True))
    xq = xc0 + 120
    ygq = yg + 4 * math.sin((xq - xa) / (xb - xa) * 5.0)
    o.append(D(xq, yp, GLD, 4.5))
    o.append(T(xq + 8, yp - 4, "受信機", "start", 10, GLD, True))
    o.append(DIM(xq - 26, ye, xq - 26, ygq))
    o.append(T(xq - 32, (ye + ygq) / 2 + 4, "ジオイド高 36.7 m", "end", 10, PUR, True))
    o.append(DIM(xq - 26, ygq, xq - 26, yp))
    o.append(T(xq - 32, (ygq + yp) / 2 + 4, "標高 3.3 m", "end", 10, PUR, True))
    o.append(DIM(xq + 40, ye, xq + 40, yp))
    o.append(T(xq + 46, (ye + yp) / 2 + 8, "楕円体高 40.0 m", "start", 10, GLD, True))
    o.append(T(xq + 46, (ye + yp) / 2 + 22, "= 3.3 + 36.7", "start", 10, GLD))
    return SVG(700, max(yb + 22 + 4 * 19 + 12, ye + 24), o, "GGA の欄（東京の例。測位の品質の値と高さの関係を添えた）。")


F["e12_gga"] = _f12_gga_fig()


# =====================================================================
# 2 節: RMC
# =====================================================================
def _f12_rmc_fig():
    o = []
    body = _F12_RMC
    line = _f12_sent(body)
    o.append(T(14, 18, "(a) RMC の欄（GGA と同じ時刻の文）", "start", 11.5, INK, True))
    G = lambda a, b=None: _f12_grp(body, a, b)
    grs = [(1, 6, INK, "GPS で求めた RMC"),
           G(1) + (SIG, "時刻 09:27:50.00（UTC）"),
           G(2) + (GRN, "状態 A: 有効（V は警告）"),
           G(3, 4) + (GLD, "緯度: 北緯 35°40.86′"),
           G(5, 6) + (GLD, "経度: 東経 139°46.02′"),
           G(7) + (TEA, "速さ 0.012 ノット（0.022 km/h）"),
           G(8) + (TEA, "進む向き（空: 止まっている）"),
           G(9) + (SIG, "日付: 11 日・11 月・26 年"),
           G(10, 11) + (MUT, "磁気の偏角と向き（空）"),
           G(12) + (GRN, "モード A: 単独（2.3 版から）"),
           (len(line) - 3, len(line), MUT, "チェックサム（3 節）")]
    yl = _f12_annot(o, line, grs, 14, 46, 72)
    yb = yl + 34
    # (b) 速さと進む向き
    o.append(T(14, yb, "(b) 速さと進む向き", "start", 11.5, INK, True))
    cx, cy, R = 120, yb + 86, 46
    o.append(CIRC(cx, cy, R, c=MUT, lw=1.2, fill=SCR))
    o.append(T(cx, cy - R - 8, "真北 0°", "middle", 9.5, INK, True))
    o.append(T(cx + R + 6, cy + 4, "東 90°", "start", 9.5, INK))
    o.append(T(cx, cy + R + 16, "南 180°", "middle", 9.5, INK))
    o.append(T(cx - R - 6, cy + 4, "西 270°", "end", 9.5, INK))
    a = 60 * _F12_D2R
    o.append(ARR(cx, cy, cx + R * 0.85 * math.sin(a), cy - R * 0.85 * math.cos(a), c=TEA, lw=2.2))
    o.append(PATH("M%g,%g A%g,%g 0 0,1 %g,%g" % (cx, cy - 24, 24, 24, cx + 24 * math.sin(a), cy - 24 * math.cos(a)), c=TEA, lw=1.4))
    o.append(T(cx + 8, cy - 28, "向き", "start", 9.5, TEA, True, halo=True))
    xt = 236
    o.append(T(xt, yb + 40, "進む向き: 真北から時計回りに測った角 [°]", "start", 10, INK))
    o.append(T(xt, yb + 58, "（止まっていると決まらないので、空にすることがある）", "start", 10, MUT))
    o.append(T(xt, yb + 86, "速さ: 1 ノット = 1 時間に 1852 m = 0.514 m/s", "start", 10, INK))
    o.append(T(xt, yb + 104, "例の 0.012 ノットは 6 mm/s（止まっていても、雑音で 0 にならない）", "start", 10, MUT))
    o.append(T(xt, yb + 132, "モード: A 単独・D 補正を使った・E 推測・N 無効 など（版による）", "start", 10, INK))
    return SVG(700, cy + R + 28, o, "RMC の欄（東京の例）。")


F["e12_rmc"] = _f12_rmc_fig()


# =====================================================================
# 2 節: GSA
# =====================================================================
def _f12_gsa_fig():
    o = []
    body = _F12_GSA
    line = _f12_sent(body)
    o.append(T(14, 18, "(a) GSA の欄（使った衛星と DOP）", "start", 11.5, INK, True))
    G = lambda a, b=None: _f12_grp(body, a, b)
    grs = [(1, 6, INK, "GPS で求めた GSA"),
           G(1) + (MUT, "A: 2 次元と 3 次元を自動で切り替える"),
           G(2) + (GRN, "3: 3 次元の位置（1 なし・2 は 2 次元）"),
           G(3, 14) + (SIG, "使った衛星の PRN 番号（12 欄。8 機）"),
           G(15) + (GLD, "PDOP %.2f" % _F12_PDOP),
           G(16) + (GLD, "HDOP %.2f" % _F12_HDOP),
           G(17) + (GLD, "VDOP %.2f" % _F12_VDOP),
           (len(line) - 3, len(line), MUT, "チェックサム（3 節）")]
    yl = _f12_annot(o, line, grs, 14, 46, 72, xl=360)
    # (b) 使った衛星のスカイプロット
    yb = yl + 34
    o.append(T(14, yb, "(b) 使った 8 機の空の並び（東京・時刻 0。数字は PRN 番号）", "start", 11.5, INK, True))
    cx, cy, R = 150, yb + 128, 92
    o.append(sky(cx, cy, R, [(q[1], q[2], "%d" % q[0], SIG) for q in _F12_VIS], dot=4.4, sz=10))
    xt = 330
    o.append(T(xt, cy - 40, "7 章 4 節の東京の 8 つの衛星と同じ並びなので、", "start", 10, INK))
    o.append(T(xt, cy - 22, "PDOP %.2f・HDOP %.2f・VDOP %.2f も同じ値になる" % (_F12_PDOP, _F12_HDOP, _F12_VDOP), "start", 10, INK))
    o.append(T(xt, cy - 4, "（仰角マスク 0°。見えている衛星を全部使った）", "start", 10, MUT))
    yb = cy + R + 26
    return SVG(700, yb, o, "GSA の欄と、使った衛星の空の並び。")


F["e12_gsa"] = _f12_gsa_fig()


# =====================================================================
# 2 節: GSV
# =====================================================================
def _f12_gsv_fig():
    o = []
    o.append(T(14, 18, "(a) GSV の 2 つの文（1 つの文に 4 機ずつ。色の帯が 1 機分の 4 つの欄）", "start", 11.5, INK, True))
    sz, cw, x0 = 10, 6.0, 14
    ys = [60, 86]
    bandc = [SIG, TEA]
    for j, body in enumerate(_F12_GSV):
        line = _f12_sent(body)
        fl = _f12_fields(body)
        for s in range(4):
            i0 = fl[4 + 4 * s][1] + 1
            i1 = fl[7 + 4 * s][1] + 1 + len(fl[7 + 4 * s][2])
            c = bandc[s % 2]
            o.append(RECT(x0 + i0 * cw - 1, ys[j] - 11, (i1 - i0) * cw + 2, 15, 3, soft(c), "none", 0))
        hl = (j == 0)
        cols = [(line[:13], INK), (line[13:], INK)]
        o.append(_f12_mono(x0, ys[j], cols, sz, cw, True))
    # 1 つ目の文の初めの欄と、1 機分の欄の意味
    body = _F12_GSV[0]
    fl = _f12_fields(body)
    cxs = lambda f: x0 + (fl[f][1] + 1 + len(fl[f][2]) / 2.0) * cw
    yA = 112
    notes = [(1, "全部の文の数 2", GLD), (2, "何番目の文か 2", GLD), (3, "見えている衛星 8", GLD)]
    for k, (f, lab, c) in enumerate(notes):
        x = cxs(f)
        o.append(W(x, ys[1] + 5, x, yA + k * 17 - 4, c=c, lw=1.0))
        o.append(W(x, yA + k * 17 - 4, x + 4, yA + k * 17 - 4, c=c, lw=1.0))
        o.append(T(x + 6, yA + k * 17, lab, "start", 10, c, True))
    q0 = _F12_VIS[0]
    i0 = fl[4][1] + 1
    i1 = fl[7][1] + 1 + len(fl[7][2])
    xa, xb = x0 + i0 * cw, x0 + i1 * cw
    o.append(_f12_brk(xa, xb, 44, SIG, down=False))
    o.append(TX(xb + 6, 46, "PRN %d・仰角 %d°・方位角 %d°・C/N_0 %d dB-Hz" % (q0[0], round(q0[1]), round(q0[2]), round(q0[3])), "start", 10, SIG, True))
    # (b) スカイプロット
    yb = yA + 3 * 17 + 22
    cx, cy, R = 150, yb + 120, 92
    o.append(T(14, yb, "(b) 仰角と方位角を描いた（数字は PRN 番号）", "start", 11.5, INK, True))
    o.append(sky(cx, cy, R, [(q[1], q[2], "%d" % q[0], SIG) for q in _F12_VIS], dot=4.4, sz=10))
    x2, y2 = skyxy(cx, cy, R, q0[1], q0[2])
    o.append(CIRC(x2, y2, 8, c=SIG, lw=1.8))
    # (c) C/N0 の棒
    o.append(TX(330, yb, "(c) C/N_0（3 章 3 節の例のアンテナで計算した値）", "start", 11.5, INK, True))
    p = Plot(380, yb + 18, 300, 150, (0, len(_F12_VIS)), (30, 55))
    o.append(p.axes(yl="C/N_0 [dB-Hz]", xt=[], yt=[30, 35, 40, 45, 50, 55], grid=True))
    for k, q in enumerate(_F12_VIS):
        xa = p.X(k + 0.18); xb = p.X(k + 0.82)
        v = round(q[3])
        o.append(RECT(xa, p.Y(v), xb - xa, p.Y(30) - p.Y(v), 2, soft(SIG), SIG, 2.0 if k == 0 else 1.0))
        o.append(T((xa + xb) / 2, p.Y(v) - 4, "%d" % v, "middle", 9.5, SIG, True))
        o.append(T((xa + xb) / 2, p.Y(30) + 14, "%d" % q[0], "middle", 10, INK, True))
        o.append(T((xa + xb) / 2, p.Y(30) + 28, "%d°" % round(q[1]), "middle", 9.5, MUT))
    o.append(T(p.x - 8, p.Y(30) + 14, "PRN", "end", 9.5, INK, True))
    o.append(T(p.x - 8, p.Y(30) + 28, "仰角", "end", 9.5, MUT))
    return SVG(700, cy + R + 22, o, "GSV の欄と、それを描いたスカイプロットと C/N0（東京の例。丸で囲んだのは、帯の付いた 1 機目の PRN 2）。")


F["e12_gsv"] = _f12_gsv_fig()


# =====================================================================
# 3 節: 排他的論理和の筆算と、ビットの位置ごとの 1 の数
# =====================================================================
def _f12_b8(v):
    s = format(v, "08b")
    return s[:4] + " " + s[4:]


def _f12_crc16(b):
    """CRC-16/CCITT-FALSE（組み込み通信シリーズ 3 章 5 節と同じ）。"""
    c = 0xFFFF
    for x in b.encode():
        c ^= x << 8
        for _ in range(8):
            c = ((c << 1) ^ 0x1021) & 0xFFFF if c & 0x8000 else (c << 1) & 0xFFFF
    return c


def _f12_xor_fig():
    o = []
    body = _F12_GGA
    o.append(T(14, 18, "(a) 1 文字ずつ排他的論理和をとる（中身の初めの 3 文字）", "start", 11.5, INK, True))
    xl, xh, xb = 70, 128, 186          # 文字・16 進・2 進の列
    cwb = 15.0                          # 2 進の 1 桁の幅
    def bits(x, y, v, c, b=False):
        s = format(v, "08b")
        for i, ch in enumerate(s):
            o.append(T(x + i * cwb + (6 if i >= 4 else 0), y, ch, "middle", 12, c, b, True))
    for i in range(8):
        o.append(T(xb + i * cwb + (6 if i >= 4 else 0), 40, "b%d" % (7 - i), "middle", 9.5, MUT))
    rows = []
    acc = 0
    y = 58
    for k, ch in enumerate(body[:3]):
        v = ord(ch)
        if k == 0:
            o.append(T(xl, y, "'%s'" % ch, "middle", 11, INK, False, True))
            o.append(T(xh, y, "0x%02X" % v, "middle", 11, INK, False, True))
            bits(xb, y, v, INK)
            acc = v
            y += 20
            continue
        o.append(T(40, y, "⊕", "middle", 13, PUR, True))
        o.append(T(xl, y, "'%s'" % ch, "middle", 11, INK, False, True))
        o.append(T(xh, y, "0x%02X" % v, "middle", 11, INK, False, True))
        bits(xb, y, v, INK)
        o.append(W(30, y + 7, xb + 8 * cwb + 6, y + 7, c=MUT, lw=1.0))
        acc ^= v
        y += 22
        o.append(T(xh, y, "0x%02X" % acc, "middle", 11, PUR, True, True))
        bits(xb, y, acc, PUR, True)
        y += 20
    o.append(T(xb + 4 * cwb + 3, y + 2, "⋮（中身の %d 文字まで続ける）" % len(body), "middle", 10, MUT))
    o.append(T(xb + 4 * cwb + 3, y + 22, "= 0x%02X  → 文の * の後の %02X" % (_f12_cks(body), _f12_cks(body)), "middle", 11, PUR, True))
    # 規則の表
    xr = 420
    o.append(T(xr, 40, "1 つのビットの排他的論理和", "start", 10, INK, True))
    for k, (a, b) in enumerate(((0, 0), (0, 1), (1, 0), (1, 1))):
        o.append(T(xr + 10, 62 + k * 18, "%d ⊕ %d = %d" % (a, b, a ^ b), "start", 11, PUR if a ^ b else INK, False, True))
    o.append(T(xr, 62 + 4 * 18 + 4, "違えば 1、同じなら 0（C の ^）", "start", 10, MUT))
    # (b) ビットの表
    yb = y + 52
    o.append(T(14, yb, "(b) 中身の %d 文字の各ビット（塗ったますが 1）と、ビットの位置ごとの 1 の数" % len(body), "start", 11.5, INK, True))
    x0, cw, ch_ = 44, 8.0, 12.0
    yc = yb + 26
    for i, c in enumerate(body):
        o.append(T(x0 + i * cw + cw / 2, yc, c, "middle", 9.5, INK, False, True))
    yg = yc + 6
    cnt = []
    for r in range(8):
        bit = 7 - r
        yy = yg + r * ch_
        o.append(T(x0 - 6, yy + ch_ - 3, "b%d" % bit, "end", 9.5, MUT))
        n = 0
        for i, c in enumerate(body):
            on = (ord(c) >> bit) & 1
            n += on
            o.append(RECT(x0 + i * cw + 0.5, yy + 0.5, cw - 1, ch_ - 1, 1, SIG if on else SCR, SIG if on else LIN, 0.5))
        cnt.append(n)
        odd = n % 2
        o.append(T(x0 + len(body) * cw + 32, yy + ch_ - 2, "%d" % n, "end", 10, PUR if odd else INK, odd, True))
        o.append(T(x0 + len(body) * cw + 42, yy + ch_ - 2, "奇数 → 1" if odd else "偶数 → 0", "start", 10, PUR if odd else MUT, odd))
    xr0 = x0 + len(body) * cw
    o.append(T(xr0 + 8, yc, "1 の数", "start", 9.5, MUT))
    ye = yg + 8 * ch_ + 20
    res = "".join(str(cnt[r] % 2) for r in range(8))
    o.append(T(xr0 + 96, ye, "b7〜b0 = %s %s = 0x%02X" % (res[:4], res[4:], _f12_cks(body)), "end", 11, PUR, True))
    return SVG(700, ye + 12, o, "例の GGA のチェックサム（中身は $ と * の間の %d 文字）。" % len(body))


F["e12_xor"] = _f12_xor_fig()


# =====================================================================
# 3 節: チェックサムが見逃す誤り（例の GGA の緯度の欄）
# =====================================================================
def _f12_miss_fig():
    o = []
    body = _F12_GGA
    S0 = _f12_cks(body)
    cases = [("(a) 1 文字が化けた", "3540.85000", [(6, "6", "5")], "1 文字だけ"),
             ("(b) 2 文字の同じビットが反転した", "3541.87000", [(3, "0", "1"), (6, "6", "7")], "北へ 1.87 km"),
             ("(c) 2 文字が入れ替わった", "3504.86000", [(2, "4", "0"), (3, "0", "4")], "南へ 66.6 km")]
    o.append(T(14, 18, "送った緯度の欄 3540.86000（チェックサム 54）が、届くまでに化けた 3 つの例", "start", 11.5, INK, True))
    o.append(T(300, 40, "化けた分 e（反転したビットが 1）", "start", 10, MUT, True))
    o.append(T(520, 40, "受ける側の計算", "start", 10, MUT, True))
    y = 66
    for title, lat, chg, shift in cases:
        b2 = body.replace(_F12_LAT, lat)
        S1 = _f12_cks(b2)
        o.append(T(14, y, title, "start", 11, INK, True))
        # 送った・届いた
        cw = 7.2
        for j, (lab, s) in enumerate((("送った", _F12_LAT), ("届いた", lat))):
            yy = y + 20 + j * 18
            o.append(T(64, yy, lab, "end", 10, MUT))
            for i in [c[0] for c in chg]:
                o.append(RECT(74 + i * cw - 0.5, yy - 11, cw + 1, 15, 2, soft(ALI), "none", 0))
            o.append(_f12_mono(74, yy, [(s, ALI if j else INK)], 12, cw, j == 1))
        # e のビット
        ee = 0
        for k, (i, a, b) in enumerate(chg):
            e = ord(a) ^ ord(b)
            ee ^= e
            yy = y + 20 + k * 18
            o.append(_f12_mono(300, yy, [("'%s'→'%s'" % (a, b), INK), ("  e = ", MUT), (_f12_b8(e), ALI)], 10.5))
        if len(chg) > 1:
            yy = y + 20 + len(chg) * 18
            o.append(W(300 + 9 * 6.3, yy - 13, 300 + 20 * 6.3, yy - 13, c=MUT, lw=1))
            o.append(_f12_mono(300, yy, [("     ⊕ = ", MUT), (_f12_b8(ee), GRN if ee else ALI)], 10.5, None, True))
        ok = S1 != S0
        c = GRN if ok else ALI
        o.append(T(520, y + 20, "0x%02X と、付いてきた %02X" % (S1, S0), "start", 10.5, INK, False))
        o.append(T(520, y + 38, "違う → 気づく" if ok else "同じ → 見逃す", "start", 11, c, True))
        o.append(T(520, y + 56, shift if not ok else "（e ≠ 0 なので必ず違う）", "start", 10, c if not ok else MUT, not ok))
        y += 92
    # CRC との比べ
    o.append(W(14, y - 22, 686, y - 22, c=LIN, lw=0.8))
    crc0 = _f12_crc16(body)
    vals = "・".join("%04X" % _f12_crc16(body.replace(_F12_LAT, lat)) for _, lat, _, _ in cases)
    o.append(T(14, y - 2, "比べ: CRC-16（組み込み通信シリーズ 3 章の CCITT-FALSE）で検査したなら、送った中身は %04X、" % crc0, "start", 10, MUT))
    o.append(T(14, y + 15, "届いた中身 (a)〜(c) は %s で、3 つとも気づく（NMEA 0183 の形は変えられない）" % vals, "start", 10, MUT))
    return SVG(700, y + 25, o, "チェックサム（排他的論理和）が気づく誤りと、見逃す誤り（例の GGA の緯度の欄）。")


F["e12_miss"] = _f12_miss_fig()


# =====================================================================
# 4 節: 状態機械（C の nmea_feed と同じ処理を Python で書いたもの。図の状態はこれで求める）
# =====================================================================
_F12_STN = ["待つ", "中身", "上の桁", "下の桁", "終わり"]
_F12_STC = [MUT, SIG, PUR, PUR, GLD]


def _f12_hex(ch):
    return int(ch, 16) if ch in "0123456789ABCDEFabcdef" else -1


def _f12_feed(s, mx=82):
    """1 文字ずつ入れ、文字ごとの (入れた後の状態, 結果 or None) を返す（C の nmea_feed と同じ）。"""
    st, n, sm, got, out = 0, 0, 0, 0, []
    for ch in s:
        c, res = ord(ch), None
        if ch == "$":
            res = None if st == 0 else "ERR_CUT"
            st, n, sm = 1, 0, 0
        elif st == 1:
            if ch == "*":
                st = 2
            elif c < 0x20 or c > 0x7E:
                st, res = 0, "ERR_FORM"
            elif n >= mx - 6:
                st, res = 0, "ERR_LONG"
            else:
                n += 1; sm ^= c
        elif st in (2, 3):
            h = _f12_hex(ch)
            if h < 0:
                st, res = 0, "ERR_FORM"
            elif st == 2:
                got, st = h << 4, 3
            else:
                got, st = got | h, 4
        elif st == 4:
            if ch == "\n":
                st, res = 0, ("OK" if got == sm else "ERR_SUM")
            elif ch != "\r":
                st, res = 0, "ERR_FORM"
        out.append((st, res))
    return out


def _f12_fsm_fig():
    o = []
    y = 150
    P = {0: (80, 96), 1: (240, 100), 2: (380, 92), 3: (500, 92), 4: (630, 92)}
    h = 44
    for k in range(5):
        x, w = P[k]
        o.append(STATE(x, y, w, h, _F12_STN[k], _F12_STC[k], ["ST_WAIT", "ST_BODY", "ST_CK1", "ST_CK2", "ST_END"][k]))
    def xr(k): return P[k][0] + P[k][1] / 2
    def xl(k): return P[k][0] - P[k][1] / 2
    labs = {0: "$", 1: "*", 2: "16 進", 3: "16 進"}
    for k in range(4):
        o.append(ARR(xr(k), y, xl(k + 1), y, c=INK, lw=1.5))
        o.append(T((xr(k) + xl(k + 1)) / 2, y - 7, labs[k], "middle", 10, INK, True, k < 2, halo=True))
    top, bot = y - h / 2, y + h / 2
    # 自分への遷移
    o.append(SELF(80, top, None, MUT))
    o.append(T(80, top - 40, "$ 以外は", "middle", 9.5, MUT))
    o.append(T(80, top - 28, "読み捨てる", "middle", 9.5, MUT))
    o.append(SELF(212, top, None, SIG))
    o.append(T(196, top - 40, "表示できる文字は", "middle", 9.5, SIG, True))
    o.append(T(196, top - 28, "ためて XOR をとる", "middle", 9.5, SIG, True))
    o.append(SELF(652, top, None, GLD))
    o.append(T(656, top - 40, "CR は", "middle", 9.5, GLD, True))
    o.append(T(656, top - 28, "読み飛ばす", "middle", 9.5, GLD, True))
    # $ はどの状態からでも
    yb = 58
    for x in (380, 500, 612):
        o.append(W(x, top, x, yb, c=SIG, lw=1.3, dash="5 3"))
    o.append(W(612, yb, 262, yb, c=SIG, lw=1.3, dash="5 3"))
    o.append(ARR(262, yb, 262, top - 1, c=SIG, lw=1.3, dash="5 3"))
    o.append(T(437, yb - 7, "$（どの状態でも）: それまでの文を捨て、新しい文の中身を始める → NMEA_ERR_CUT", "middle", 10, SIG, True, halo=True))
    # 誤り
    ye = bot + 38
    for x in (240, 380, 500, 612):
        o.append(W(x, bot, x, ye, c=ALI, lw=1.3))
    o.append(W(612, ye, 100, ye, c=ALI, lw=1.3))
    o.append(ARR(100, ye, 100, bot + 1, c=ALI, lw=1.3))
    o.append(T(356, ye + 16, "誤り（* の前に CR・LF が来た、16 進でない、76 文字を超えた など）: 次の $ まで読み捨てる", "middle", 10, ALI, True))
    o.append(T(356, ye + 31, "→ NMEA_ERR_FORM・NMEA_ERR_LONG", "middle", 10, ALI, False, True))
    # 終わり → 待つ（文がそろった）
    yo = ye + 52
    o.append(W(652, bot, 652, yo, 62, yo, c=GRN, lw=1.6))
    o.append(ARR(62, yo, 62, bot + 1, c=GRN, lw=1.6))
    o.append(T(356, yo + 16, "LF: ためた XOR と、届いたチェックサムを比べる → 合えば NMEA_OK（文が 1 つそろう）、違えば NMEA_ERR_SUM", "middle", 10, GRN, True))
    return SVG(700, yo + 26, o, "1 文字ずつ読む状態機械（4 節の nmea_feed）。箱の下は C のコードの状態の名前。")


F["e12_fsm"] = _f12_fsm_fig()


# =====================================================================
# 4 節: 入れた文字の列と、状態の移り変わり（テストの入力）
# =====================================================================
_F12_VTGS = _f12_sent(_F12_VTG) + "\r\n"
_F12_CASES = [
    ("正しい文", _F12_VTGS),
    ("1 文字が化けた（0.012 → 0.013）", _F12_VTGS.replace("0.012", "0.013")),
    ("文の途中から受け始めた", _F12_VTGS[-13:] + _F12_VTGS),
    ("文の途中で次の $ が来た（切れた文）", _F12_VTGS[:17] + _F12_VTGS),
    ("* が + に化けた（チェックサムの欄が無い形）", _F12_VTGS.replace("*", "+")),
    ("取りこぼしで 2 つの文がつながった", _f12_sent(_F12_GGA)[:-4] + _f12_sent(_F12_RMC)[1:30]),
]
_F12_RN = {"OK": "NMEA_OK", "ERR_SUM": "NMEA_ERR_SUM", "ERR_CUT": "NMEA_ERR_CUT", "ERR_FORM": "NMEA_ERR_FORM", "ERR_LONG": "NMEA_ERR_LONG"}


def _f12_trace_fig():
    o = []
    o.append(T(14, 18, "入れた文字の列（上）と、1 文字ごとの状態（下の帯）。▲ は nmea_feed が結果を返した文字", "start", 11.5, INK, True))
    xx = 14
    for k, nm in ((0, "待つ"), (1, "中身"), (2, "上の桁・下の桁"), (4, "終わり")):
        o.append(RECT(xx, 28, 12, 10, 2, soft(_F12_STC[k]), _F12_STC[k], 1.0))
        o.append(T(xx + 16, 37, nm, "start", 10, INK))
        xx += 30 + tw(nm, 10)
    o.append(RECT(xx + 6, 28, 12, 10, 2, MSOFT, MUT, 1.0))
    o.append(T(xx + 22, 37, "CR・LF の文字（灰色のます）", "start", 10, INK))
    cw, x0 = 6.6, 14
    y = 64
    for title, s in _F12_CASES:
        tr = _f12_feed(s)
        # 長い入力は中を省く（中身の途中）
        idx = list(range(len(s)))
        gap = None
        if len(s) > 66:
            keep_a, keep_b = 22, 26
            gap = (keep_a, len(s) - keep_b)
            idx = list(range(keep_a)) + list(range(len(s) - keep_b, len(s)))
        o.append(T(x0, y, title, "start", 10.5, INK, True))
        yc = y + 18
        xpos = {}
        x = x0
        for j, i in enumerate(idx):
            if gap and i == gap[1]:
                o.append(T(x + 42, yc, "…（%d 文字）…" % (gap[1] - gap[0]), "middle", 9.5, MUT))
                o.append(RECT(x + 4, yc + 4, 76, 8, 1, soft(SIG), SIG, 0.6))
                x += 84
            xpos[i] = x
            ch = s[i]
            st, res = tr[i]
            if ch in "\r\n":
                o.append(RECT(x + 0.5, yc - 10, cw - 1, 12, 1, MSOFT, MUT, 0.6))
            else:
                o.append(T(x + cw / 2, yc, ch, "middle", 11, INK, False, True))
            o.append(RECT(x + 0.3, yc + 4, cw - 0.6, 8, 0, soft(_F12_STC[st]), _F12_STC[st], 0.6))
            x += cw
        # 結果
        rs = [(i, r) for i, (st, r) in enumerate(tr) if r]
        notes = []
        for i, r in rs:
            xp = xpos.get(i)
            if xp is None:
                continue
            c = GRN if r == "OK" else ALI
            o.append(PL([(xp + cw / 2, yc + 14), (xp + cw / 2 - 4, yc + 21), (xp + cw / 2 + 4, yc + 21)], c=c, lw=1, fill=c))
            notes.append((xp + cw / 2, _F12_RN[r], c))
        for j, (xp, lab, c) in enumerate(notes):
            o.append(T(xp, yc + 33, lab, "middle" if 40 < xp < 600 else ("start" if xp <= 40 else "end"), 9.5, c, True, True))
        y += 66
    return SVG(700, y - 10, o, "4 節のコードに入れた文字の列と、そのときの状態（ホストで動かした結果と同じ。長い入力は中身の途中を省いた）。")


F["e12_trace"] = _f12_trace_fig()


# =====================================================================
# 5 節: float で表せる点の刻みと、整数・文の桁の刻み
# =====================================================================
def _f12_m_per_deg():
    a, f = 6378137.0, 1 / 298.257223563
    e2 = f * (2 - f)
    B = 35.681 * _F12_D2R
    M = a * (1 - e2) / (1 - e2 * math.sin(B) ** 2) ** 1.5
    N = a / math.sqrt(1 - e2 * math.sin(B) ** 2)
    return M * _F12_D2R, N * math.cos(B) * _F12_D2R      # 1 度あたりの南北・東西の長さ [m]


def _f12_float_fig():
    o = []
    mn, me = _f12_m_per_deg()
    f32 = _f12_np.float32
    lat0, lon0 = 35.681, 139.767
    # (a) 3 m 四方
    o.append(T(14, 18, "(a) float（32 ビット）で表せる点（東京の例の点のまわり 3 m 四方）", "start", 11.5, INK, True))
    S, cx, cy = 220.0, 166, 154
    sc = S / 3.0
    o.append(RECT(cx - S / 2, cy - S / 2, S, S, 2, SCR, LIN, 1.0))
    lats, lons = [], []
    v = f32(lat0)
    for _ in range(12):
        v = _f12_np.nextafter(v, f32(0))
    for _ in range(25):
        lats.append(float(v)); v = _f12_np.nextafter(v, f32(100))
    v = f32(lon0)
    for _ in range(4):
        v = _f12_np.nextafter(v, f32(0))
    for _ in range(9):
        lons.append(float(v)); v = _f12_np.nextafter(v, f32(200))
    pts = []
    for la in lats:
        for lo in lons:
            x = (lo - lon0) * me; y = (la - lat0) * mn
            if abs(x) <= 1.5 and abs(y) <= 1.5:
                pts.append((cx + x * sc, cy - y * sc))
    for px, py in pts:
        o.append(D(px, py, GLD, 2.6))
    sx = (float(f32(lon0)) - lon0) * me; sy = (float(f32(lat0)) - lat0) * mn
    o.append(CIRC(cx, cy, 5, c=GRN, lw=2.0))
    o.append(T(cx + 9, cy - 10, "文の値（35.681°, 139.767°）", "start", 9.5, GRN, True, halo=True))
    o.append(CIRC(cx + sx * sc, cy - sy * sc, 4.5, c=GLD, lw=1.6, fill=GLD))
    o.append(T(cx + 9, cy + 20, "float に入れた値（西へ %.2f m）" % (-sx), "start", 9.5, GLD, True, halo=True))
    lo_s = sorted(set(round(p[0], 2) for p in pts)); la_s = sorted(set(round(p[1], 2) for p in pts))
    if len(lo_s) >= 2:
        o.append(DIM(lo_s[0], cy + S / 2 + 12, lo_s[1], cy + S / 2 + 12))
        o.append(T((lo_s[0] + lo_s[1]) / 2, cy + S / 2 + 28, "東西 %.2f m" % ((lons[1] - lons[0]) * me), "middle", 10, GLD, True))
    o.append(DIM(cx - S / 2 - 12, la_s[0], cx - S / 2 - 12, la_s[1]))
    o.append(T(cx - S / 2 - 16, (la_s[0] + la_s[1]) / 2 + 4, "%.2f m" % ((lats[1] - lats[0]) * mn), "end", 10, GLD, True))
    o.append(T(cx, cy - S / 2 - 6, "北 ↑（金の点だけが表せる）", "middle", 9.5, MUT))
    # (b) 6 cm 四方
    x2 = 450
    o.append(T(x2 + 110, 40, "(b) 整数と文の刻み（6 cm 四方）", "middle", 11.5, INK, True))
    S2, cx2, cy2 = 200.0, x2 + 110, 160
    sc2 = S2 / 0.06
    o.append(RECT(cx2 - S2 / 2, cy2 - S2 / 2, S2, S2, 2, SCR, LIN, 1.0))
    for i in range(-4, 5):
        for j in range(-4, 5):
            x = j * 1e-7 * me; y = i * 1e-7 * mn
            if abs(x) <= 0.03 and abs(y) <= 0.03:
                o.append(D(cx2 + x * sc2, cy2 - y * sc2, SIG, 2.4))
    for i in range(-2, 3):
        for j in range(-2, 3):
            x = j * 1e-5 / 60 * me; y = i * 1e-5 / 60 * mn
            if abs(x) <= 0.03 and abs(y) <= 0.03:
                px, py = cx2 + x * sc2, cy2 - y * sc2
                o.append(W(px - 5, py, px + 5, py, c=PUR, lw=1.4)); o.append(W(px, py - 5, px, py + 5, c=PUR, lw=1.4))
    o.append(CIRC(cx2, cy2, 7, c=GRN, lw=1.8))
    o.append(LEGEND(cx2 - S2 / 2 - 60, cy2 + S2 / 2 + 22, [(SIG, "10⁻⁷ 度の整数"), (PUR, "文の分の小数 5 桁（+）")], 10, 16))
    # (c) 刻みの比べ
    yc = 312
    o.append(T(14, yc, "(c) 刻み（隣の点との距離。東京の緯度で計算した。対数の目盛）", "start", 11.5, INK, True))
    items = [("float の経度（東西）", (float(lons[1]) - float(lons[0])) * me, ALI),
             ("float の緯度（南北）", (lats[1] - lats[0]) * mn, ALI),
             ("文の分の小数 4 桁（南北）", 1e-4 / 60 * mn, PUR),
             ("文の分の小数 5 桁（南北）", 1e-5 / 60 * mn, PUR),
             ("10⁻⁷ 度の整数（南北）", 1e-7 * mn, SIG),
             ("double の経度（東西）", 2.0 ** (7 - 52) * me, GRN)]
    p = Plot(214, yc + 14, 440, 6 * 22, (1e-3, 10), (0, 1), xlog=True)
    for k, (lab, v, c) in enumerate(items):
        yy = p.y + k * 22 + 4
        o.append(T(p.x - 8, yy + 11, lab, "end", 10, INK))
        vv = max(v, 1.2e-3)
        o.append(RECT(p.x, yy, p.X(vv) - p.x, 14, 2, soft(c), c, 1.0))
        txt = ("%.2f m" % v) if v >= 0.3 else (("%.3g cm" % (v * 100)) if v >= 1e-3 else "%.1f × 10⁻⁹ m（目盛より小さい）" % (v * 1e9))
        o.append(T(p.X(vv) + 6, yy + 11, txt, "start", 10, c, True))
    for t, lab in ((1e-3, "1 mm"), (1e-2, "1 cm"), (1e-1, "10 cm"), (1, "1 m"), (10, "10 m")):
        o.append(W(p.X(t), p.y + p.h, p.X(t), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(t), p.y + p.h + 16, lab, "middle", 9.5, MUT))
    o.append(W(p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    o.append(T(p.x + p.w / 2, p.y + p.h + 32, "刻み（隣の点との距離）[m]", "middle", 10, MUT))
    return SVG(700, p.y + p.h + 40, o, "緯度・経度を数として持つときの刻み（東京の例の点 35.681°, 139.767°。1 度の長さは WGS 84 の楕円体で計算した）。")


F["e12_float"] = _f12_float_fig()


# =====================================================================
# 5 節: 度分形式 → 10⁻⁷ 度の整数（筆算）と、GGA を数値にした結果
# =====================================================================
def _f12_g(v):
    return "{:,}".format(v).replace(",", " ")


def _f12_dm_fig():
    o = []
    o.append(T(14, 18, "度分形式から 10⁻⁷ 度の整数へ（nmea_dm_e7 の手順）", "start", 11.5, INK, True))
    cols = [("緯度", _F12_LAT, 2, "N"), ("経度", _F12_LON, 3, "E")]
    for k, (nm, s, nd, hemi) in enumerate(cols):
        x0 = 14 + k * 346
        ip, fr = s.split(".")
        d, mi = int(ip) // 100, int(ip) % 100
        f6 = (fr + "000000")[:6]
        m6 = mi * 1000000 + int(f6)
        q = (m6 + 3) // 6
        v = d * 10000000 + q
        y = 46
        o.append(T(x0, y, "%s %s,%s" % (nm, s, hemi), "start", 11, GLD, True))
        # 文字の分け方
        y += 24
        cw = 9.0
        segs = [(s[:nd], GLD), (s[nd:nd + 2], SIG), (s[nd + 2:], PUR)]
        o.append(_f12_mono(x0 + 16, y, segs, 15, cw, True))
        xs = x0 + 16
        o.append(_f12_brk(xs, xs + nd * cw, y + 6, GLD))
        o.append(T(xs + nd * cw / 2, y + 22, "度 %d" % d, "middle", 10, GLD, True))
        o.append(_f12_brk(xs + nd * cw + 1, xs + (nd + 2) * cw, y + 6, SIG))
        o.append(T(xs + (nd + 1) * cw, y + 36, "分の整数 %d" % mi, "middle", 10, SIG, True))
        o.append(_f12_brk(xs + (nd + 2) * cw + 1, xs + len(s) * cw, y + 6, PUR))
        o.append(T(xs + (nd + 2) * cw + (len(s) - nd - 2) * cw / 2 + 18, y + 22, "分の小数 → 6 桁 %s" % f6, "start", 10, PUR, True))
        # 計算
        rows = [("m₆ = %d × 1 000 000 + %s" % (mi, _f12_g(int(f6))), "= %s" % _f12_g(m6), "10⁻⁶ 分", INK),
                ("(m₆ + 3) ÷ 6", "= %s" % _f12_g(q), "10⁻⁷ 度（あまりは捨てる）", INK),
                ("%d × 10 000 000 + %s" % (d, _f12_g(q)), "= %s" % _f12_g(v), "10⁻⁷ 度", GLD)]
        yy = y + 66
        for a, b, u, c in rows:
            o.append(T(x0 + 8, yy, a, "start", 10.5, INK, False, True))
            yy += 17
            o.append(T(x0 + 24, yy, b, "start", 11, c, True, True))
            o.append(T(x0 + 24 + tw(b, 11, True) + 8, yy, u, "start", 9.5, MUT))
            yy += 21
        o.append(T(x0 + 8, yy + 2, "→ %d.%07d°（%s）" % (v // 10000000, v % 10000000, "北緯" if hemi == "N" else "東経"), "start", 10.5, GLD, True))
    return SVG(700, 284, o, "度分形式の緯度・経度を、浮動小数点を使わずに 10⁻⁷ 度の整数に直す手順（例の GGA の値）。")


F["e12_dm"] = _f12_dm_fig()


# =====================================================================
# 6 節: strtok は空の欄を飛ばす
# =====================================================================
def _f12_boxes(o, x, y, fields, sz=11, hl=None, c0=INK):
    """欄を箱で並べ、下に [番号] を書く。hl = {番号: 色}。返り値 {番号: 箱の中心の x}。"""
    cw = 0.6 * sz
    cen = {}
    for k, f in enumerate(fields):
        w = max(22, len(f) * cw + 10)
        c = (hl or {}).get(k, LIN)
        o.append(RECT(x, y - 15, w, 22, 3, soft(c) if c != LIN else PAN, c, 1.2 if c != LIN else 1.0))
        if f:
            o.append(_f12_mono(x + w / 2, y, [(f, c if c != LIN else c0)], sz, cw, False, "middle"))
        o.append(T(x + w / 2, y + 22, "[%d]" % k, "middle", 9.5, c if c != LIN else MUT, c != LIN))
        cen[k] = x + w / 2
        x += w + 4
    return cen


def _f12_strtok_fig():
    o = []
    body = "GPGGA,092750.00,,,,,0,00,99.99,,,,,,"
    o.append(T(14, 18, "位置が出ていない間の GGA の中身を、2 つの方法で欄に分ける", "start", 11.5, INK, True))
    o.append(_f12_mono(14, 42, [(body, INK)], 11))
    # (a) strtok
    ya = 78
    o.append(T(14, ya, "(a) strtok(s, \",\") で分けた（空の欄が消え、後ろの欄の番号がずれる）", "start", 11, ALI, True))
    toks = [t for t in body.split(",") if t]
    cen = _f12_boxes(o, 14, ya + 30, toks, hl={2: ALI, 4: ALI})
    o.append(W(cen[2], ya + 56, cen[2], ya + 70, 14 + 250, ya + 70, c=ALI, lw=1.0))
    o.append(T(268, ya + 74, "f[2] を緯度として読むと \"0\"（本当は [6] の測位の品質）", "start", 10, ALI, True))
    o.append(W(cen[4], ya + 56, cen[4], ya + 88, 14 + 250, ya + 88, c=ALI, lw=1.0))
    o.append(T(268, ya + 92, "f[4] を経度として読むと \"99.99\"（本当は [8] の HDOP）。f[6] は無い", "start", 10, ALI, True))
    # (b) nmea_split
    yb = ya + 124
    o.append(T(14, yb, "(b) 空の欄も残して分けた（4 節の nmea_split）", "start", 11, GRN, True))
    fl = body.split(",")
    cen = _f12_boxes(o, 14, yb + 30, fl, hl={2: GRN, 6: GRN})
    o.append(W(cen[2], yb + 56, cen[2], yb + 70, 330, yb + 70, c=GRN, lw=1.0))
    o.append(T(334, yb + 74, "[2] 緯度は空（位置が無い）", "start", 10, GRN, True))
    o.append(W(cen[6], yb + 56, cen[6], yb + 88, 330, yb + 88, c=GRN, lw=1.0))
    o.append(T(334, yb + 92, "[6] 測位の品質は 0（位置が無い）", "start", 10, GRN, True))
    return SVG(700, yb + 104, o, "空の欄のある文を、strtok と、空の欄を残す方法で分けた結果（[k] は欄の番号 f[k]）。")


F["e12_strtok"] = _f12_strtok_fig()


# =====================================================================
# 6 節: 桁の数と、版で増えた欄
# =====================================================================
def _f12_versions_fig():
    o = []
    mn, me = _f12_m_per_deg()
    o.append(T(14, 18, "(a) 分の小数の桁の数が違う緯度の欄（どれも同じ 35°40.86′）", "start", 11.5, INK, True))
    o.append(T(200, 40, "数字が続く限り読む（5 節）", "start", 10, GRN, True))
    o.append(T(430, 40, "小数を 5 桁と決め打ちして読む", "start", 10, ALI, True))
    rows = ["3540.8600", "3540.86000", "3540.8600000"]
    y = 62
    for s in rows:
        ip, fr = s.split(".")
        o.append(_f12_mono(30, y, [(ip + ".", INK), (fr, PUR)], 12))
        o.append(T(30 + len(s) * 7.2 + 8, y, "（%d 桁）" % len(fr), "start", 9.5, MUT))
        o.append(T(200, y, "356 810 000（35.6810000°）", "start", 10.5, GRN, True, True))
        mm = int(ip) % 100 + int(fr) / 1e5
        if abs(mm - 40.86) < 1e-9:
            o.append(T(430, y, "40.86′ 正しい", "start", 10.5, GRN, True))
        elif mm < 60:
            o.append(T(430, y, "%.3f′ → 南へ %.2f km ずれる" % (mm, (40.86 - mm) / 60 * mn / 1e3), "start", 10.5, ALI, True))
        else:
            o.append(T(430, y, "%.0f′（60 分を超える）→ 誤り" % mm, "start", 10.5, ALI, True))
        y += 20
    o.append(T(30, y + 2, "時刻の欄も 092750・092750.00・092750.000 の形がある（5 節の nmea_time_ms はどれも 34 070 000 ms）", "start", 10, MUT))
    # (b) 版で増えた欄
    yb = y + 34
    o.append(T(14, yb, "(b) 版で文の後ろに増えた欄（紫）。頭からの番号で読めば、同じ番号の欄は同じ意味", "start", 11.5, INK, True))
    base = "GPRMC,092750.00,A,%s,N,%s,E,0.012,,111126,," % (_F12_LAT, _F12_LON)
    vars_ = [("RMC（2.2 版まで）", base, None),
             ("RMC（2.3 版から）", base + ",A", "モード"),
             ("RMC（4.1 版から）", base + ",A,V", "航法の状態"),
             ("GSA（4.1 版から）", _F12_GSA + ",1", "衛星系の番号"),
             ("GSV（4.1 版から）", _F12_GSV[0] + ",1", "信号の番号")]
    y = yb + 24
    cw = 5.7
    for lab, b, add in vars_:
        line = _f12_sent(b)
        o.append(T(14, y, lab, "start", 10, INK, True))
        n_add = 0 if add is None else 2          # 増えた欄（, と 1 文字）
        head, tail = line[:len(line) - 3 - n_add], line[len(line) - 3 - n_add:len(line) - 3]
        x0 = 140
        o.append(_f12_mono(x0, y, [(head, INK), (tail, PUR), (line[-3:], MUT)], 9.5, cw))
        if add:
            o.append(T(x0 + len(line) * cw + 8, y, "+ " + add, "start", 10, PUR, True))
        y += 20
    fl = _f12_fields(base)
    o.append(T(14, y + 6, "RMC の [9] は、どの版でも日付（111126）。後ろに知らない欄があれば読み飛ばし、欄が足りなければ「無い」として扱う", "start", 10, GRN, True))
    return SVG(700, y + 16, o, "桁の数と版による文の違い（例の値。版の番号は、規格の変更の一般的な説明による）。")


F["e12_versions"] = _f12_versions_fig()


# =====================================================================
# 6 節: 位置が出ていない間の文と、UTC の時刻
# =====================================================================
def _f12_nofix_fig():
    o = []
    o.append(T(14, 18, "(a) 電源を入れてから位置が出るまでの文（例。時間と文の値は製品による）", "start", 11.5, INK, True))
    stages = [("電源を入れた直後", "GPGGA,,,,,,0,00,99.99,,,,,,", "GPRMC,,V,,,,,,,,,,N", "0", "V", False),
              ("時刻が分かった（位置はまだ）", "GPGGA,092720.00,,,,,0,00,99.99,,,,,,", "GPRMC,092720.00,V,,,,,,,111126,,,N", "0", "V", False),
              ("位置が出た（TTFF）", _F12_GGA, _F12_RMC, "1", "A", True)]
    o.append(T(560, 40, "品質・状態", "middle", 10, MUT, True))
    o.append(T(650, 40, "位置を", "middle", 10, MUT, True))
    y = 60
    for k, (lab, g, r, q, st, use) in enumerate(stages):
        c = GRN if use else ALI
        o.append(T(14, y, "%d. %s" % (k + 1, lab), "start", 10.5, INK, True))
        o.append(_f12_mono(30, y + 18, [(_f12_sent(g), INK)], 9.5))
        o.append(_f12_mono(30, y + 34, [(_f12_sent(r), INK)], 9.5))
        o.append(T(560, y + 26, "%s・%s" % (q, st), "middle", 13, c, True, True))
        o.append(T(650, y + 26, "使う" if use else "使わない", "middle", 11, c, True))
        y += 58
    o.append(ARR(470, 52, 470, y - 30, c=MUT, lw=1.2))
    o.append(T(476, (52 + y - 30) / 2, "時間", "start", 9.5, MUT))
    # (b) UTC と日本の時刻
    yb = y + 4
    o.append(T(14, yb, "(b) 文の時刻は UTC。日本の時刻（UTC + 9 時間）に直すと、日付が変わることがある", "start", 11.5, INK, True))
    p = Plot(70, yb + 22, 600, 76, (0, 48), (0, 1))
    def axis(yy, lab, off, c):
        o.append(T(p.x - 8, yy + 4, lab, "end", 10, c, True))
        o.append(W(p.x, yy, p.x + p.w, yy, c=c, lw=1.4))
        for hh in range(0, 49, 6):
            x = p.X(hh)
            o.append(W(x, yy - 3, x, yy + 3, c=c, lw=1))
            t = (hh + off) % 24
            o.append(T(x, yy + 15, "%d 時" % t, "middle", 9.5, MUT))
        for d in (0, 24):
            x = p.X(d - off) if 0 <= d - off <= 48 else None
            if x is not None:
                o.append(W(x, yy - 9, x, yy + 3, c=c, lw=2))
    yu, yj = yb + 40, yb + 92
    axis(yu, "UTC", 0, SIG)
    axis(yj, "日本", 9, GLD)
    o.append(T(p.X(0) + 4, yu - 12, "11 月 11 日", "start", 9.5, SIG, True))
    o.append(T(p.X(24) + 4, yu - 12, "11 月 12 日", "start", 9.5, SIG, True))
    o.append(T(p.X(-9 + 24) + 22, yj - 12, "← 日本ではここから 11 月 12 日", "start", 9.5, GLD, True, halo=True))
    for hh, mm, lab in ((9, 27.83, "092750.00"), (15, 30, "153000.00")):
        tt = hh + mm / 60
        x = p.X(tt)
        o.append(W(x, yu, x, yj, c=PUR, lw=1.2, dash="3 2"))
        o.append(D(x, yu, PUR, 3.5)); o.append(D(x, yj, PUR, 3.5))
    o.append(W(p.X(9.46), yj, p.X(9.46), yj + 28, c=PUR, lw=1.0, dash="3 2"))
    o.append(T(p.X(9.46) - 4, yj + 40, "092750.00 → 日本の 18:27:50（11 月 11 日）", "start", 10, PUR, True, halo=True))
    o.append(W(p.X(15.5), yj, p.X(15.5), yj + 44, c=PUR, lw=1.0, dash="3 2"))
    o.append(T(p.X(15.5) - 4, yj + 56, "153000.00 → 日本の 0:30:00（11 月 12 日。日付が進む）", "start", 10, PUR, True, halo=True))
    o.append(T(14, yj + 78, "GGA には日付が無いので、同じ時刻の RMC の日付と組み合わせる（同じ時刻の文をまとめる処理は 15 章）", "start", 10, MUT))
    return SVG(700, yj + 88, o, "位置が出ていない間の文と、UTC の時刻（例の値）。")


F["e12_nofix"] = _f12_nofix_fig()



# =====================================================================
# 5 節: GGA の欄から struct gga へ（nmea_gga。ホストで動かした値）
# =====================================================================
def _f12_gga2c_fig():
    o = []
    o.append(T(14, 18, "例の GGA の欄（上）を、nmea_gga で struct gga（下）に直した値（ホストで動かした結果）", "start", 11.5, INK, True))
    fl = _F12_GGA.split(",")
    use = {1: SIG, 2: GLD, 3: GLD, 4: GLD, 5: GLD, 6: GRN, 7: TEA, 8: TEA, 9: PUR, 11: PUR}
    cen = _f12_boxes(o, 14, 52, fl, 10.5, hl=use)
    mem = [("t_ms", "34 070 000", "nmea_time_ms", [1], SIG), ("lat", "356 810 000", "nmea_dm_e7", [2, 3], GLD),
           ("lon", "1 397 670 000", "nmea_dm_e7", [4, 5], GLD), ("quality", "1", "nmea_fix", [6], GRN), ("nsat", "8", "nmea_fix", [7], TEA),
           ("hdop_c", "95", "nmea_fix", [8], TEA), ("alt_mm", "3 300", "nmea_fix", [9], PUR), ("sep_mm", "36 700", "nmea_fix", [11], PUR)]
    yb, gap = 142, 6
    wds = [86, 90, 104, 70, 62, 72, 72, 72]
    xs0 = [12]
    for w_ in wds[:-1]:
        xs0.append(xs0[-1] + w_ + gap)
    for k, (nm, v, fn, src, c) in enumerate(mem):
        x, bw = xs0[k], wds[k]
        o.append(RECT(x, yb, bw, 58, 5, soft(c), c, 1.2))
        o.append(T(x + bw / 2, yb + 16, nm, "middle", 10.5, c, True, True))
        o.append(T(x + bw / 2, yb + 33, v, "middle", 10.5, INK, True, True))
        o.append(T(x + bw / 2, yb + 49, fn, "middle", 9.5, MUT))
        xs = sum(cen[i] for i in src) / len(src)
        for i in src:
            o.append(W(cen[i], 82, xs, 98, c=c, lw=1.0))
        o.append(ARR(xs, 98, x + bw / 2, yb - 2, c=c, lw=1.3, head=6))
    o.append(T(14, yb + 80, "has_pos = 1（[2]〜[5] が読めた）、has_alt = 1（[9]・[11] が読めた）。[10]・[12] の単位と、[13]・[14] の補正の欄は使わない", "start", 10, MUT))
    o.append(T(14, yb + 98, "alt_mm + sep_mm = 40 000 mm（楕円体高 40.0 m。2 節）、t_ms = 34 070 000 ms は 9 時 27 分 50 秒（UTC）", "start", 10, MUT))
    return SVG(700, yb + 108, o, "GGA の欄と、構造体の値の対応（[k] は欄の番号 f[k]。下の箱の小さい文字は変換に使う関数。hdop_c は HDOP の 100 倍、alt_mm・sep_mm は mm）。")


F["e12_gga2c"] = _f12_gga2c_fig()
