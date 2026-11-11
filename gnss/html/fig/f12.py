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
    o.append(T(14, yb, "(b) 話者 ID の例（書き方は規格の版とモジュールによる）", "start", 11.5, INK, True))
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
