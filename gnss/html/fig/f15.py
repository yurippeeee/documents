# -*- coding: utf-8 -*-
# 15 章 組み込みでの実装 — 受信・解析・状態の管理 の図
# 図の数値は、下のモデル（本文の C と同じ手順の Python）で計算する。C の試験・デモの値と一致することを確かめてある。

# ---- 15 章のモデル（本文の C と同じ手順を Python で。図の計算と、C・デモの値の確かめに使う） ----
import math as _f15_m

_F15_T0 = 1000              # 記録の初めのパルスの時刻 [ms]（マイコンの時計）
_F15_TC = 120               # パルスから文が出始めるまで [ms]（13 章 3 節の例の 0.12 s）
_F15_BAUD = 9600
_F15_N = 60                 # 記録の長さ [s]
_F15_GSA = "GPGSA,A,3,02,03,05,06,09,13,16,22,,,,,1.61,0.95,1.30"
_F15_GSV1 = "GPGSV,2,1,08,02,41,316,47,03,26,125,45,05,09,269,41,06,52,045,48"
_F15_GSV2 = "GPGSV,2,2,08,09,75,187,50,13,21,068,44,16,04,171,40,22,46,235,48"
# 混ぜる誤り（記号, 秒, 説明）。デモと同じ並び
_F15_FAULTS = [("bad", 5, "GGA の 1 文字が化けた"), ("normc", 8, "RMC が抜けた"), ("cut", 11, "GSV の途中の 10 バイトが抜けた"),
               ("gap", 14, "1 秒分の文が全部抜けた"), ("swap", 17, "GGA の緯度の 2 文字が入れ替わった"),
               ("city", 20, "ビル街（HDOP 2.6・衛星 4）"), ("nopps", 25, "パルスが 1 つ抜けた"),
               ("tunnel", 26, "トンネル（品質 0）"), ("stop", 40, "文が 5 秒止まった"), ("dgnss", 50, "補正つき（品質 2）")]


def _f15_ck(body):
    x = 0
    for ch in body:
        x ^= ord(ch)
    return x


def _f15_hms(k):
    s = 34070 + k
    return "%02d%02d%02d" % (s // 3600, s // 60 % 60, s % 60)


def _f15_epoch_sents(k, on):
    """秒 k の文の並び（中身）。on は入れる誤りの記号の集合。"""
    t = _f15_hms(k)
    lon = "139%08.5f" % (46.02 + 10.0 / (111194.9 / 60.0 * _f15_m.cos(_f15_m.radians(35.681))) * k)
    if "tunnel" in on and 26 <= k <= 30:
        return [("GGA", "GPGGA,%s.00,,,,,0,00,99.99,,,,,," % t), ("RMC", "GPRMC,%s.00,V,,,,,,,111126,,,N" % t),
                ("GSA", "GPGSA,A,1,,,,,,,,,,,,,99.99,99.99,99.99"), ("GSV", "GPGSV,1,1,00"),
                ("VTG", "GPVTG,,T,,M,,N,,K,N"), ("GLL", "GPGLL,,,,,%s.00,V,N" % t)]
    q, ns, hd, gsa, md, dg = "1", "08", "0.95", _F15_GSA, "A", ","
    if "city" in on and k in (20, 21):
        ns, hd, gsa = "06", "2.60", "GPGSA,A,3,02,03,06,09,16,22,,,,,,,3.10,2.60,1.70"
    if "city" in on and k in (22, 23):
        ns, hd, gsa = "04", "3.50", "GPGSA,A,3,02,06,09,22,,,,,,,,,4.90,3.50,3.40"
    if "dgnss" in on and 50 <= k <= 53:
        q, md, dg = "2", "D", "1.0,0000"
    lat = "3504.86000" if ("swap" in on and k == 17) else "3540.86000"
    gga = "GPGGA,%s.00,%s,N,%s,E,%s,%s,%s,3.3,M,36.7,M,%s" % (t, lat, lon, q, ns, hd, dg)
    return [("GGA", gga), ("RMC", "GPRMC,%s.00,A,3540.86000,N,%s,E,19.438,90.0,111126,,,%s" % (t, lon, md)),
            ("GSA", gsa), ("GSV", _F15_GSV1), ("GSV", _F15_GSV2), ("VTG", "GPVTG,90.0,T,,M,19.438,N,36.000,K,%s" % md),
            ("GLL", "GPGLL,3540.86000,N,%s,E,%s.00,A,%s" % (lon, t, md))]


def _f15_record(on=None):
    """記録の列 [(時刻 [ms], 文 or "PPS")]。文は $ から * とチェックサムまで（CR LF は試験の側で付ける）。"""
    on = set(k for k, _, _ in _F15_FAULTS) if on is None else set(on)
    out = []
    for k in range(_F15_N):
        t0 = _F15_T0 + 1000 * k
        nopps = ("nopps" in on and k == 25) or ("tunnel" in on and 26 <= k <= 30)
        if not nopps:
            out.append((t0, "PPS"))
        if ("gap" in on and k == 14) or ("stop" in on and 40 <= k <= 44):
            continue
        cum = 0
        for kind, body in _f15_epoch_sents(k, on):
            s = "$%s*%02X" % (body, _f15_ck(body))
            cum += len(s) + 2
            tt = t0 + _F15_TC + int(round(cum * 10.0 / _F15_BAUD * 1000))
            if "bad" in on and k == 5 and kind == "GGA":
                s = s.replace("3540.86000", "3540.85000")
            if "normc" in on and k == 8 and kind == "RMC":
                continue
            if "cut" in on and k == 11 and s.startswith("$GPGSV,2,1"):
                s = s[:20] + s[30:]
            out.append((tt, s))
    return out


# ---- 12 章の解析（nmea_feed・nmea_split・数値への直し）と、この章の組・状態機械・判断（C と同じ手順） ----
def _f15_feed(st, c):
    """12 章の nmea_feed。st = [状態, 中身, 和, 届いたチェックサム]。返り値は "NONE"・"OK"・"ERR_*"。"""
    if c == "$":
        res = "NONE" if st[0] == 0 else "ERR_CUT"
        st[0], st[1], st[2] = 1, "", 0
        return res
    o = ord(c)
    hv = int(c, 16) if c in "0123456789abcdefABCDEF" else -1
    if st[0] == 0:
        return "NONE"
    if st[0] == 1:
        if c == "*":
            st[0] = 2; return "NONE"
        if 0x20 <= o <= 0x7E:
            if len(st[1]) >= 76:
                st[0] = 0; return "ERR_LONG"
            st[1] += c; st[2] ^= o; return "NONE"
    elif st[0] == 2:
        if hv >= 0:
            st[3] = hv << 4; st[0] = 3; return "NONE"
    elif st[0] == 3:
        if hv >= 0:
            st[3] |= hv; st[0] = 4; return "NONE"
    elif st[0] == 4:
        if c == "\r":
            return "NONE"
        if c == "\n":
            st[0] = 0
            return "OK" if st[3] == st[2] else "ERR_SUM"
    st[0] = 0
    return "ERR_FORM"


def _f15_tms(s):
    if len(s) < 6 or not s[:6].isdigit():
        return -1
    h, mi, se = int(s[0:2]), int(s[2:4]), int(s[4:6])
    rest, ms, w = s[6:], 0, 100
    if rest.startswith("."):
        for ch in rest[1:]:
            if not ch.isdigit():
                return -1
            ms += int(ch) * w; w //= 10
    elif rest:
        return -1
    if h > 23 or mi > 59 or se > 60:
        return -1
    return ((h * 60 + mi) * 60 + se) * 1000 + ms


def _f15_dm(s, hemi, maxdeg):
    """12 章の nmea_dm_e7（10⁻⁷ 度の整数。誤りは None）。"""
    i, ip, nd = 0, 0, 0
    while i < len(s) and s[i].isdigit():
        nd += 1
        if nd > 5:
            return None
        ip = ip * 10 + int(s[i]); i += 1
    if nd < 3:
        return None
    deg = ip // 100
    if deg > maxdeg or ip % 100 >= 60:
        return None
    if i < len(s) and s[i] == ".":
        i += 1
    m6 = 0
    for _ in range(6):
        m6 *= 10
        if i < len(s) and s[i].isdigit():
            m6 += int(s[i]); i += 1
    while i < len(s) and s[i].isdigit():
        i += 1
    if i != len(s):
        return None
    m6 += (ip % 100) * 1000000
    v = deg * 10000000 + (m6 + 3) // 6
    if v > maxdeg * 10000000:
        return None
    if hemi in ("S", "W"):
        v = -v
    elif hemi not in ("N", "E"):
        return None
    return v


def _f15_fix(s, dec):
    """12 章の nmea_fix（"3.3", dec = 3 → 3300。誤りは None）。"""
    if s in ("", "-", ".", "-."):
        return None
    neg = s.startswith("-")
    t = s[1:] if neg else s
    if t.count(".") > 1 or not t.replace(".", "").isdigit():
        return None
    a, _, b = t.partition(".")
    v = int((a or "0") + (b + "0" * dec)[:dec])
    return -v if neg else v


def _f15_gga(body):
    f = body.split(",")
    if len(f) < 15 or len(f[0]) != 5 or f[0][2:] != "GGA":
        return None
    lat, lon = _f15_dm(f[2], f[3][:1], 90), _f15_dm(f[4], f[5][:1], 180)
    q = _f15_fix(f[6], 0)
    ns = _f15_fix(f[7], 0)
    hd = _f15_fix(f[8], 2)
    return dict(t=_f15_tms(f[1]), q=q or 0, ns=ns or 0, pos=(lat is not None and lon is not None), lat=lat, lon=lon,
                hdop=-1 if hd is None else hd, age=f[13])


def _f15_rmc(body):
    f = body.split(",")
    if len(f) < 10 or len(f[0]) != 5 or f[0][2:] != "RMC":
        return None
    d = _f15_fix(f[9], 0) if len(f[9]) == 6 else None
    return dict(t=_f15_tms(f[1]), st=f[2][:1], date=-1 if d is None else d)


_F15_ST = ["文なし", "測位なし", "2D", "3D", "補正つき", "RTK フロート", "RTK フィックス"]
_F15_WHY = ["使う", "状態", "衛星の数", "HDOP", "飛び"]


def _f15_kind(g, st):
    if st != "A" or not g["pos"]:
        return 1
    return {1: 3 if g["ns"] >= 4 else 2, 2: 4, 5: 5, 4: 6}.get(g["q"], 1)


class _F15Sim:
    """本文の C（gnss_rx_isr・gnss_poll・epoch_feed・fix_*・pps_label）と同じ手順。"""
    UP_N, AGE_MAX, LOST = 3, 2500, 3000
    NSAT_MIN, HDOP_MAX, V_MAX, JUMP_M = 5, 200, 50.0, 30.0

    def __init__(self, rb_size=1024):
        self.ring, self.rb_size = [], rb_size
        self.n_drop = self.rb_max = 0
        self.rx = [0, "", 0, 0]
        self.n_bad = self.n_part = self.n_gap = 0
        self.ep = dict(t=-1, have=0, g=None, r=None)
        self.st, self.cand, self.ncand, self.t_fix, self.t_ok = 0, 0, 0, 0, 0
        self.ref = dict(ok=0, nj=0, lat=0, lon=0, t=0)
        self.pps_cap = self.pps_n = self.ep_n = 0
        self.n_nolabel, self.pps_late = 0, 0
        self.labels, self.out, self.hist = [], [], []
        self.now = 0

    # 2 節: 割り込み（1 文をまとめて入れる）と uart_read
    def isr(self, data):
        for ch in data:
            if len(self.ring) == self.rb_size:
                self.n_drop += 1
            else:
                self.ring.append(ch)
            self.rb_max = max(self.rb_max, len(self.ring))

    # 4 節: 組
    def epoch_feed(self, body):
        b = body
        ty = b[2:5] if len(b) > 5 and b[5] == "," else ""
        if ty == "GGA":
            g = _f15_gga(b)
            if g is None:
                return
            t, bit = g["t"], 1
        elif ty == "RMC":
            r = _f15_rmc(b)
            if r is None:
                return
            t, bit = r["t"], 2
        else:
            return
        if t < 0:
            return
        e = self.ep
        if t != e["t"]:
            if e["t"] >= 0:
                d = t - e["t"]
                if e["have"] != 3:
                    self.n_part += 1
                if d != 1000 and d != 1000 - 86400000:
                    self.n_gap += 1
            e["t"], e["have"] = t, 0
        if e["have"] & bit:
            return
        if bit == 1:
            e["g"] = g
        else:
            e["r"] = r
        e["have"] |= bit
        if e["have"] == 3:
            self.epoch_done()

    # 3 節: 状態機械と判断
    def fix_epoch(self, k):
        if k >= 2:
            self.t_fix = self.now
        if k < self.st:
            self.st, self.ncand = k, 0
        elif k > self.st:
            self.cand = k if (self.ncand == 0 or k < self.cand) else self.cand
            self.ncand += 1
            if self.ncand >= self.UP_N:
                self.st, self.ncand = self.cand, 0
        else:
            self.ncand = 0

    def fix_tick(self):
        if (self.now - self.t_ok) % (1 << 32) > self.LOST:
            self.st, self.ncand = 0, 0
        elif self.st >= 2 and (self.now - self.t_fix) % (1 << 32) > self.AGE_MAX:
            self.st, self.ncand = 1, 0

    def judge(self, g):
        if self.st < 3:
            return 1
        if g["ns"] < self.NSAT_MIN:
            return 2
        if g["hdop"] < 0 or g["hdop"] > self.HDOP_MAX:
            return 3
        r = self.ref
        if r["ok"]:
            dn = (g["lat"] - r["lat"]) * 0.0111195
            de = (g["lon"] - r["lon"]) * 0.0111195 * _f15_m.cos(g["lat"] * 1.745329e-9)
            lim = self.V_MAX * (self.now - r["t"]) / 1000.0 + self.JUMP_M
            if dn * dn + de * de > lim * lim:
                r["nj"] += 1
                if r["nj"] < 3:
                    return 4
        r.update(ok=1, nj=0, lat=g["lat"], lon=g["lon"], t=self.now)
        return 0

    def epoch_done(self):
        e = self.ep
        self.fix_epoch(_f15_kind(e["g"], e["r"]["st"]))
        w = self.judge(e["g"])
        self.out.append(dict(t=e["t"], st=self.st, why=w, rx=self.now, g=e["g"], r=e["r"]))
        if e["t"] % 1000 == 0 and self.st >= 2 and e["r"]["date"] >= 0:
            self.pps_label(e)

    # 4 節: 1PPS
    def pps_isr(self):
        self.pps_cap = self.now * 10000 % (1 << 32)
        self.pps_n += 1

    def pps_label(self, e):
        n, cap = self.pps_n, self.pps_cap
        k = n - self.ep_n
        self.ep_n = n
        if k == 1 and (self.now * 10000 - cap) % (1 << 32) >= 5000000:
            self.pps_late = 1
        if k != 1 or self.pps_late:
            self.n_nolabel += 1
            return
        self.labels.append((cap, e["t"]))

    # 12 章 4 節の gnss_poll
    def poll(self):
        while self.ring:
            c = self.ring.pop(0)
            res = _f15_feed(self.rx, c)
            if res == "OK":
                self.t_ok = self.now
                if self.st == 0:
                    self.st = 1
                self.epoch_feed(self.rx[1])
            elif res != "NONE":
                self.n_bad += 1
        self.fix_tick()

    def run(self, rec, tail=6000):
        """6 節の replay と同じ: 1 ms ずつ時計を進め、10 ms ごとに主のループを回す。"""
        for t, s in rec + [(None, None)]:
            stop = t if t is not None else self.now + tail
            while self.now < stop:
                self.now += 1
                if self.now % 10 == 0:
                    self.poll()
                    if self.now % 100 == 0:
                        self.hist.append((self.now, self.st))
            if t is None:
                break
            if s == "PPS":
                self.pps_isr()
            else:
                self.isr(s + "\r\n")
        return self


# =====================================================================
# 図の共通の値と部品
# =====================================================================
_F15_SC = [ALI, MUT, GLD, SIG, PUR, TEA, GRN]          # 測位の状態の色（文なし・測位なし・2D・3D・補正つき・RTK フロート・RTK フィックス）
_F15_SN = ["文なし", "測位なし", "2D", "3D", "補正つき", "RTK フロート", "RTK フィックス"]
_F15_WC = [GRN, MUT, GLD, GLD, ALI]                      # 判断の色（使う・状態・衛星・HDOP・飛び）
_F15_WN = ["使う", "状態が足りない", "衛星の数", "HDOP", "飛び"]


def _f15_s11():
    """10 章 4 節の例の 11 文（GPS と GLONASS、626 B）の (種類, 長さ [B])。"""
    sats = {"GP": [(5, 45, 123, 47), (13, 62, 45, 49), (15, 30, 210, 44), (18, 15, 300, 38), (20, 72, 280, 50),
                   (23, 25, 150, 42), (24, 40, 330, 45), (29, 10, 60, 36), (30, 5, 250, None), (31, 2, 100, None)],
            "GL": [(66, 35, 20, 43), (67, 55, 110, 46), (76, 20, 250, 40), (77, 48, 300, 44), (82, 8, 180, None), (83, 3, 140, None)]}
    used = [[s[0] for s in sats[t] if s[3] is not None] for t in ("GP", "GL")]
    b = [("GGA", "GNGGA,092750.00,3540.86000,N,13946.02000,E,1,%02d,0.80,3.3,M,36.7,M,," % sum(len(u) for u in used)),
         ("RMC", "GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A")]
    for u in used:
        b.append(("GSA", "GNGSA,A,3," + ",".join(["%02d" % v for v in u] + [""] * (12 - len(u))) + ",1.50,0.80,1.27"))
    for t in ("GP", "GL"):
        ss = sats[t]; nm = (len(ss) + 3) // 4
        for m in range(nm):
            fl = [t + "GSV", str(nm), str(m + 1), "%02d" % len(ss)]
            for s in ss[4 * m:4 * m + 4]:
                fl += ["%02d" % s[0], "%02d" % s[1], "%03d" % s[2], "" if s[3] is None else "%02d" % s[3]]
            b.append(("GSV", ",".join(fl)))
    b.append(("VTG", "GNVTG,,T,,M,0.012,N,0.022,K,A"))
    b.append(("GLL", "GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A"))
    return [(k, len("$%s*%02X\r\n" % (s, _f15_ck(s)))) for k, s in b]


_F15_S11 = _f15_s11()
_F15_NB = sum(l for k, l in _F15_S11)                     # 626 B


def _f15_ntp(tp, nb, tu, rb):
    """2 節の式: 長さ tp [s] の間に届くバイトの数の最大（負荷率 100 % 以下）。"""
    k = int(math.floor(tp / tu + 1e-12))
    return k * nb + min(nb, int(math.floor((tp - k * tu) * rb / 10.0 + 1e-9)))


def _f15_fillsim(rb, rate, tp, secs, nb=None):
    """2 節の図とデモと同じ計算: 1 ビットの時間を単位に、届くバイトと読む時刻を進める。
    モジュールは 1/rate s ごとに、パルスから 0.12 s 後に nb バイトを続けて送る（前の回が終わるまで待つ）。
    主のループは、1 回分の最初のバイトが届く直前（0.12 s）に読み、その後 tp ごとに読む。返り値: [(時刻 [s], 量 [B])]。"""
    nb = nb or _F15_NB
    tu = rb // rate; tc = rb * 12 // 100; tpb = int(round(tp * rb)); end = int(secs * rb)
    pts, q, m, bi, start, busy = [(0.0, 0)], 0, 0, 0, tc, 0
    nxt, nread = tc + 10, tc
    t = 0
    while t <= end:
        ev = min(nxt, nread)
        if ev > end:
            break
        t = ev
        if t == nxt:
            pts.append((t / rb, q)); q += 1; pts.append((t / rb, q))
            bi += 1
            if bi == nb:
                busy = nxt; bi = 0; m += 1
                start = max(m * tu + tc, busy); nxt = start + 10
            else:
                nxt += 10
        if t == nread:
            pts.append((t / rb, q)); q = 0; pts.append((t / rb, q)); nread += tpb
    pts.append((secs, q))
    return pts


def _f15_lines(o, x, y, lines, sz=10, c=INK, lh=14, a="start", b=False):
    for i, l in enumerate(lines):
        o.append(T(x, y + i * lh, l, a, sz, c, b))


def _f15_vbox(x, y, w, h, title, sub, c, mono=True, ssz=9.5):
    """題（関数の名前など。等幅）と説明（小さい文字、折り返す）の箱。"""
    o = [RECT(x, y, w, h, 7, soft(c), c, 1.3)]
    lines = wrap(sub, max(4, int((w - 10) / ssz))) if sub else []
    tot = 13 + len(lines) * ssz * 1.3
    yy = y + h / 2 - tot / 2 + 10
    o.append(T(x + w / 2, yy, title, "middle", 11, c, True, mono))
    for i, l in enumerate(lines):
        o.append(T(x + w / 2, yy + 14 + i * ssz * 1.3, l, "middle", ssz, INK))
    return "".join(o)


# =====================================================================
# 1 節: 全体の構成
# =====================================================================
def _f15_arch_fig():
    o = []
    # 列の題
    cols = [(150, 120, GLD, "割り込み"), (290, 104, TEA, "受け渡し"), (414, 158, SIG, "主のループ"), (590, 102, GRN, "使う側")]
    for x, w, c, t in cols:
        o.append(RECT(x - 6, 30, w + 12, 300, 8, "none", c, 1.0, dash="4 3"))
        o.append(T(x + w / 2, 22, t, "middle", 11.5, c, True))
    # モジュール
    o.append(RECT(10, 40, 100, 282, 8, PAN, INK, 1.5))
    o.append(T(60, 62, "GNSS", "middle", 11.5, INK, True))
    o.append(T(60, 77, "モジュール", "middle", 11.5, INK, True))
    o.append(T(60, 92, "（10 章）", "middle", 9.5, MUT))
    r1, r2, r3, r4 = 108, 196, 262, 306
    for y, lab in ((r1, "TXD（文）"), (r2, "1PPS"), (r4, "EN・RXD")):
        o.append(T(104, y - 5, lab, "end", 9.5, INK, True))
    # 割り込み
    o.append(_f15_vbox(150, r1 - 27, 120, 54, "gnss_rx_isr", "UART の受信（2 節）", GLD))
    o.append(_f15_vbox(150, r2 - 27, 120, 54, "pps_isr", "1PPS の捕獲（4 節）", GLD))
    o.append(_f15_vbox(150, r3 - 22, 120, 44, "now_ms", "1 ms のティック", GLD))
    # 受け渡し
    o.append(_f15_vbox(290, r1 - 27, 104, 54, "urx", "リングバッファ（2 節）", TEA))
    o.append(_f15_vbox(290, r2 - 27, 104, 54, "pps_cap・n", "割り込みだけが書く", TEA, ssz=9))
    # 主のループ
    mx, mw = 414, 158
    o.append(_f15_vbox(mx, 52, mw, 58, "gnss_poll", "uart_read → nmea_feed（12 章）・fix_tick", SIG))
    o.append(_f15_vbox(mx, 128, mw, 50, "epoch_feed", "同じ時刻の GGA と RMC を 1 組に（4 節）", SIG))
    o.append(_f15_vbox(mx, 196, mw, 58, "epoch_done", "状態機械と判断（3 節）・pps_label（4 節）", SIG))
    o.append(_f15_vbox(mx, 272, mw, 46, "電源の管理", "起動・設定・待機（5 節）", PUR, mono=False))
    # 使う側
    o.append(_f15_vbox(590, 176, 102, 98, "use_epoch", "記録・表示・制御（位置・時刻・状態と、使うかの判断）", GRN))
    # 矢印
    o.append(ARR(110, r1, 150, r1, c=INK, lw=1.6))
    o.append(T(130, r1 + 14, "1 B", "middle", 9, MUT))
    o.append(ARR(270, r1, 290, r1, c=GLD, lw=1.6))
    o.append(ARR(394, r1, 414, r1 - 22, c=TEA, lw=1.6))
    o.append(ARR(110, r2, 150, r2, c=INK, lw=1.6))
    o.append(ARR(270, r2, 290, r2, c=GLD, lw=1.6))
    o.append(ARR(394, r2 + 10, 414, r2 + 22, c=TEA, lw=1.6))
    o.append(ARR(270, r3, 414, r3 - 30, c=GLD, lw=1.2, dash="4 3"))
    o.append(T(300, r3 + 2, "時刻", "start", 9, GLD))
    o.append(ARR(mx + mw / 2, 110, mx + mw / 2, 128, c=SIG, lw=1.6))
    o.append(ARR(mx + mw / 2, 178, mx + mw / 2, 196, c=SIG, lw=1.6))
    o.append(ARR(mx + mw, 225, 590, 225, c=GRN, lw=1.8))
    o.append(W(mx, 300, 380, 300, 380, r4, c=PUR, lw=1.6))
    o.append(ARR(380, r4, 110, r4, c=PUR, lw=1.6))
    o.append(T(245, r4 - 6, "主の電源・停止の命令（10・13 章）", "middle", 9.5, PUR, True, halo=True))
    return SVG(700, 340, o, "ファームウェアの構成（割り込みの中は値を置くだけ。関数の名前は本文のコード、括弧は扱う節と章）。")


F["e15_arch"] = _f15_arch_fig()


# =====================================================================
# 1 節: 1 秒の中の時間の並び（9600 bit/s・1 Hz・626 B）
# =====================================================================
def _f15_time_fig():
    o = []
    x0, x1, t1 = 132, 684, 1.32
    X = lambda t: x0 + t / t1 * (x1 - x0)
    tb = 10.0 / 9600
    t_s = 0.12
    t_e = t_s + _F15_NB * tb
    t_ep = t_s + (_F15_S11[0][1] + _F15_S11[1][1]) * tb          # GGA と RMC がそろう
    rows = {"pps": 34, "txd": 68, "isr": 104, "ring": 140, "main": 188, "age": 222}
    for s in (0, 1):
        o.append(W(X(s), 24, X(s), 300, c=FNT, lw=1, dash="3 3"))
    # 1PPS
    y = rows["pps"]
    o.append(T(x0 - 8, y + 4, "1PPS", "end", 10, GRN, True))
    pts = [(X(0), y + 8)]
    for s in (0, 1):
        pts += [(X(s), y + 8), (X(s), y - 8), (X(s + 0.1), y - 8), (X(s + 0.1), y + 8)]
    pts.append((X(t1), y + 8))
    o.append(PL(pts, c=GRN, lw=2))
    # 文
    y = rows["txd"]
    o.append(T(x0 - 8, y + 4, "TXD の文", "end", 10, GLD, True))
    tt = t_s
    for i, (k, l) in enumerate(_F15_S11):
        c = SIG if k == "GGA" else (PUR if k == "RMC" else GLD)
        o.append(RECT(X(tt), y - 8, X(tt + l * tb) - X(tt) - 0.6, 16, 1, soft(c), c, 0.9))
        tt += l * tb
    o.append(T(X(t_s) + 1, y - 13, "GGA・RMC", "start", 9, SIG, True))
    o.append(T(X(t_e) + 6, y + 4, "626 B を 0.652 s", "start", 9.5, GLD, True))
    # 割り込み
    y = rows["isr"]
    o.append(T(x0 - 8, y + 4, "受信の割り込み", "end", 10, GLD, True))
    o.append(RECT(X(t_s), y - 6, X(t_e) - X(t_s), 12, 1, GOSOFT, GLD, 0.8))
    o.append(T((X(t_s) + X(t_e)) / 2, y + 4, "1 バイトごとに 1 回（1.04 ms ごと・数 µs）", "middle", 9, GLD, True, halo=True))
    # リングバッファの量（10 ms ごとに読む）
    y = rows["ring"]
    o.append(T(x0 - 8, y - 6, "リングバッファ", "end", 10, TEA, True))
    o.append(T(x0 - 8, y + 8, "の量（10 B まで）", "end", 9, TEA))
    pts, q, k = [(X(0), y + 12)], 0, 0
    nxt = t_s + tb
    rd = 0.01
    tcur = 0.0
    while tcur < t1:
        tn = min(nxt if nxt < t_e + 1e-9 else 9, rd)
        if tn > t1:
            break
        tcur = tn
        if abs(tn - rd) < 1e-12 or tn == rd:
            pts.append((X(tn), y + 12 - q * 2.2)); q = 0; pts.append((X(tn), y + 12)); rd += 0.01
        else:
            pts.append((X(tn), y + 12 - q * 2.2)); q += 1; pts.append((X(tn), y + 12 - q * 2.2)); nxt += tb
    pts.append((X(t1), y + 12))
    o.append(PL(pts, c=TEA, lw=1.0))
    # 主のループ
    y = rows["main"]
    o.append(T(x0 - 8, y - 4, "主のループ", "end", 10, SIG, True))
    o.append(T(x0 - 8, y + 10, "（10 ms ごと）", "end", 9, SIG))
    for i in range(int(t1 / 0.01) + 1):
        xx = X(i * 0.01)
        o.append(W(xx, y - 2, xx, y + 4, c=SIG, lw=0.5))
    o.append(D(X(t_ep), y + 1, SIG, 4.5))
    o.append(W(X(t_ep), y - 6, X(t_ep), rows["txd"] + 10, c=SIG, lw=1, dash="2 2"))
    o.append(T(X(t_ep) + 8, y - 6, "GGA と RMC がそろう（0.27 s）: 状態機械・判断・使う側へ（3・4 節）", "start", 9.5, SIG, True, halo=True))
    # 位置の年齢
    y = rows["age"]
    p = Plot(x0, y, x1 - x0, 50, (0, t1), (0, 1.4))
    o.append(T(x0 - 8, y + 20, "使う側の位置", "end", 10, GRN, True))
    o.append(T(x0 - 8, y + 34, "の年齢 [s]", "end", 9.5, GRN))
    for v in (0, 0.5, 1.0):
        o.append(W(x0, p.Y(v), x1, p.Y(v), c=GRD, lw=0.8))
        o.append(T(x0 + 4, p.Y(v) - 2, "%g" % v, "start", 8.5, MUT))
    age = [(0, 1.0), (t_ep, 1.0 + t_ep), (t_ep, t_ep), (t1, t1)]
    o.append(p.line(age, c=GRN, lw=2))
    o.append(T(X(0.72), p.Y(0.9), "0.27〜1.27 s（4 節）", "middle", 9, GRN, True, halo=True))
    # 時間の目盛
    for v in (0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2):
        o.append(W(X(v), 284, X(v), 288, c=MUT, lw=1))
        o.append(T(X(v), 300, "%g" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, 316, "パルスからの時間 t [s]", "middle", 10, MUT))
    return SVG(700, 324, o, "例のモジュール（9600 bit/s・1 秒に 1 回・10 章の例の 11 文 626 B）の 1 秒の中の時間の使われ方。文はパルスの 0.12 s 後から出る（13 章 3 節の例の値）。")


F["e15_time"] = _f15_time_fig()


# =====================================================================
# 1 節: 割り込みの中でしてよいこと・いけないこと
# =====================================================================
def _f15_isr_fig():
    o = []
    x0, x1, tmax = 126, 684, 9.0
    X = lambda t: x0 + t / tmax * (x1 - x0)
    tb = 10.0 / 9.6       # 1 バイトの時間 [ms]
    nby = 8
    for panel, (yb, good) in enumerate(((22, True), (166, False))):
        o.append(T(14, yb, "(a) 良い例: 割り込みは読む・入れる・数えるだけ" if good else
                   "(b) 悪い例: LF を受けた割り込みの中で、文を解析して記録まで書く（5 ms。例の値）", "start", 11, GRN if good else ALI, True))
        yl, yr, yi, ym = yb + 26, yb + 58, yb + 88, yb + 116
        o.append(T(x0 - 8, yl + 4, "線の上のバイト", "end", 9.5, INK, True))
        for i in range(nby):
            a, b = 0.2 + i * tb, 0.2 + (i + 1) * tb
            lab = "LF" if i == 2 else ("$" if i == 3 else "")
            o.append(RECT(X(a), yl - 8, X(b) - X(a) - 1, 16, 2, SSOFT, SIG, 0.8))
            if lab:
                o.append(T((X(a) + X(b)) / 2, yl + 4, lab, "middle", 9, SIG, True, True))
        if good:
            o.append(T(x0 - 8, yi + 4, "割り込み", "end", 9.5, GLD, True))
            for i in range(nby):
                e = 0.2 + (i + 1) * tb
                o.append(RECT(X(e), yi - 9, 2.4, 18, 0, GLD, GLD, 0))
            o.append(T(X(0.2 + 1 * tb) + 6, yi - 10, "1 バイトごとに数 µs", "start", 9, GLD, True, halo=True))
            o.append(T(x0 - 8, ym + 4, "主のループ", "end", 9.5, SIG, True))
            o.append(RECT(X(5.0), ym - 8, X(5.6) - X(5.0), 16, 2, SSOFT, SIG, 0.8))
            o.append(T(X(5.6) + 6, ym + 4, "10 ms ごとに、たまった分を解析（12 章の nmea_feed）", "start", 9, SIG, True))
            o.append(T(x0 - 8, yr + 4, "リングバッファ", "end", 9.5, TEA, True))
            for i in range(nby):
                e = 0.2 + (i + 1) * tb
                o.append(D(X(e) + 1, yr, TEA, 3))
            o.append(T(X(0.2 + 8 * tb) + 8, yr + 4, "全部入る", "start", 9.5, GRN, True))
        else:
            e2 = 0.2 + 3 * tb
            o.append(T(x0 - 8, yi + 4, "割り込み", "end", 9.5, GLD, True))
            for i in range(2):
                e = 0.2 + (i + 1) * tb
                o.append(RECT(X(e), yi - 9, 2.4, 18, 0, GLD, GLD, 0))
            o.append(RECT(X(e2), yi - 9, X(e2 + 5.0) - X(e2), 18, 2, ASOFT, ALI, 1.0))
            o.append(T((X(e2) + X(e2 + 5.0)) / 2, yi + 4, "解析・記録の書き込み 5 ms", "middle", 9.5, ALI, True))
            o.append(T(x0 - 8, yr - 2, "受信データ", "end", 9.5, TEA, True))
            o.append(T(x0 - 8, yr + 10, "レジスタ", "end", 9.5, TEA, True))
            a = 0.2 + 4 * tb
            o.append(RECT(X(a), yr - 7, X(e2 + 5.0) - X(a), 14, 2, TSOFT, TEA, 0.8))
            o.append(T(X(a) + 4, yr + 4, "4 つ目を置いたまま", "start", 9, TEA, True))
            for i in range(4, nby):
                e = 0.2 + (i + 1) * tb
                if e < e2 + 5.0:
                    xx = X(e)
                    o.append(W(xx - 5, yl + 12, xx + 5, yl + 22, c=ALI, lw=2))
                    o.append(W(xx - 5, yl + 22, xx + 5, yl + 12, c=ALI, lw=2))
            o.append(T(X(e2 + 5.0) + 6, yl + 22, "オーバーラン: 4 バイトを失う", "start", 9.5, ALI, True))
    p_y = 166 + 126
    for v in range(0, 10):
        o.append(W(X(v), p_y, X(v), p_y + 4, c=MUT, lw=1))
        o.append(T(X(v), p_y + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, p_y + 31, "時間 [ms]（9600 bit/s で 1 バイト 1.04 ms）", "middle", 10, MUT))
    return SVG(700, p_y + 38, o, "受信の割り込みの中でする仕事の比べ（受信データレジスタが 1 バイトの UART の例。FIFO があっても、その深さのバイトが届く時間を超えれば同じく失う）。")


F["e15_isr"] = _f15_isr_fig()
