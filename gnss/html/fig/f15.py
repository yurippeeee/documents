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
    lines = sub if isinstance(sub, list) else (wrap(sub, max(4, int((w - 10) / ssz))) if sub else [])
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
    o.append(_f15_vbox(290, r1 - 27, 104, 54, "urx", ["リングバッファ", "（2 節）"], TEA))
    o.append(_f15_vbox(290, r2 - 27, 104, 54, "pps_cap・n", ["割り込みだけ", "が書く（4 節）"], TEA, ssz=9))
    # 主のループ
    mx, mw = 414, 158
    o.append(_f15_vbox(mx, 52, mw, 58, "gnss_poll", ["uart_read → nmea_feed", "（12 章）・fix_tick"], SIG))
    o.append(_f15_vbox(mx, 128, mw, 50, "epoch_feed", ["同じ時刻の GGA と RMC", "を 1 組に（4 節）"], SIG))
    o.append(_f15_vbox(mx, 196, mw, 58, "epoch_done", ["状態機械と判断（3 節）", "pps_label（4 節）"], SIG))
    o.append(_f15_vbox(mx, 272, mw, 46, "電源の管理", "起動・設定・待機（5 節）", PUR, mono=False))
    # 使う側
    o.append(_f15_vbox(590, 176, 102, 98, "use_epoch", ["記録・表示・制御", "（位置・時刻・状態", "と、使うかの判断）"], GRN))
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
    age = [(0, 1.0), (t_ep, 1.0 + t_ep), (t_ep, t_ep), (1 + t_ep, 1 + t_ep), (1 + t_ep, t_ep), (t1, t1 - 1)]
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
    x0, x1, tmax = 126, 560, 9.0
    X = lambda t: x0 + t / tmax * (x1 - x0)
    tb = 10.0 / 9.6       # 1 バイトの時間 [ms]
    nby = 8
    e2 = 0.2 + 3 * tb     # LF を受け終わる時刻
    for yb, good in ((20, True), (170, False)):
        o.append(T(14, yb, "(a) 良い例: 割り込みは読む・入れる・数えるだけ" if good else
                   "(b) 悪い例: LF を受けた割り込みの中で、文を解析して記録まで書く（5 ms。例の値）", "start", 11, GRN if good else ALI, True))
        yl, yi, yr, ym = yb + 26, yb + 56, yb + 86, yb + 114
        o.append(T(x0 - 8, yl + 4, "線の上のバイト", "end", 9.5, INK, True))
        for i in range(nby):
            a, b = 0.2 + i * tb, 0.2 + (i + 1) * tb
            lab = "LF" if i == 2 else ("$" if i == 3 else "")
            o.append(RECT(X(a), yl - 8, X(b) - X(a) - 1, 16, 2, SSOFT, SIG, 0.8))
            if lab:
                o.append(T((X(a) + X(b)) / 2, yl + 4, lab, "middle", 9, SIG, True, True))
        o.append(T(x0 - 8, yi + 4, "割り込み", "end", 9.5, GLD, True))
        if good:
            for i in range(nby):
                e = 0.2 + (i + 1) * tb
                o.append(RECT(X(e), yi - 9, 2.4, 18, 0, GLD, GLD, 0))
            o.append(T(x1 + 8, yi + 4, "1 バイトごとに数 µs", "start", 9.5, GLD, True))
            o.append(T(x0 - 8, yr + 4, "リングバッファ", "end", 9.5, TEA, True))
            for i in range(nby):
                o.append(D(X(0.2 + (i + 1) * tb) + 1, yr, TEA, 3))
            o.append(T(x1 + 8, yr + 4, "全部入る", "start", 9.5, GRN, True))
            o.append(T(x0 - 8, ym + 4, "主のループ", "end", 9.5, SIG, True))
            o.append(RECT(X(5.0), ym - 8, X(5.6) - X(5.0), 16, 2, SSOFT, SIG, 0.8))
            o.append(T(x1 + 8, ym - 2, "たまった分を後で", "start", 9.5, SIG, True))
            o.append(T(x1 + 8, ym + 11, "解析（12 章 4 節）", "start", 9.5, SIG, True))
        else:
            for i in range(2):
                o.append(RECT(X(0.2 + (i + 1) * tb), yi - 9, 2.4, 18, 0, GLD, GLD, 0))
            o.append(RECT(X(e2), yi - 9, X(e2 + 5.0) - X(e2), 18, 2, ASOFT, ALI, 1.0))
            o.append(T((X(e2) + X(e2 + 5.0)) / 2, yi + 4, "解析・記録の書き込み 5 ms", "middle", 9.5, ALI, True))
            o.append(T(x0 - 8, yr - 2, "受信データ", "end", 9.5, TEA, True))
            o.append(T(x0 - 8, yr + 10, "レジスタ", "end", 9.5, TEA, True))
            a = 0.2 + 4 * tb
            o.append(RECT(X(a), yr - 7, X(e2 + 5.0) - X(a), 14, 2, TSOFT, TEA, 0.8))
            o.append(T(X(a) + 4, yr + 4, "4 つ目（$）を置いたまま", "start", 9, TEA, True))
            nlost = 0
            for i in range(4, nby):
                e = 0.2 + (i + 1) * tb
                if e < e2 + 5.0:
                    xx = X(e); nlost += 1
                    o.append(W(xx - 5, yl + 12, xx + 5, yl + 22, c=ALI, lw=2))
                    o.append(W(xx - 5, yl + 22, xx + 5, yl + 12, c=ALI, lw=2))
            o.append(T(x1 + 8, yl + 4, "オーバーラン:", "start", 9.5, ALI, True))
            o.append(T(x1 + 8, yl + 18, "%d バイトを失う" % nlost, "start", 9.5, ALI, True))
    p_y = 170 + 104
    for v in range(0, 10):
        o.append(W(X(v), p_y, X(v), p_y + 4, c=MUT, lw=1))
        o.append(T(X(v), p_y + 16, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, p_y + 31, "時間 [ms]（9600 bit/s で 1 バイト 1.04 ms）", "middle", 10, MUT))
    return SVG(700, p_y + 38, o, "受信の割り込みの中でする仕事の比べ（受信データレジスタが 1 バイトの UART の例。FIFO があっても、その深さのバイトが届く時間を超えれば同じく失う）。")


F["e15_isr"] = _f15_isr_fig()


# =====================================================================
# 2 節: リングバッファの埋まり方（最も悪い位相で、処理の遅れ 0.3 s ごとに読む）
# =====================================================================
def _f15_fill_fig():
    o = []
    cases = [(9600, 1, 0.3, 2.2, 600, (256, 512), "(a) 9600 bit/s・1 Hz・1 回 626 B（10 章の例）"),
             (115200, 5, 0.3, 1.45, 2200, (1024, 2048), "(b) 115 200 bit/s・5 Hz・1 回 626 B（13 章の更新レートを上げた例）")]
    yb = 18
    for rb, rate, tp, secs, ymax, (bad, good), title in cases:
        o.append(T(14, yb, title, "start", 11, INK, True))
        p = Plot(96, yb + 40, 470, 130, (0, secs), (0, ymax))
        tb = 10.0 / rb
        # 文の届く時間の帯と、読む時刻
        tu, tc = 1.0 / rate, 0.12
        o.append(T(p.x - 8, yb + 26, "文", "end", 9.5, GLD, True))
        m = 0
        while m * tu + tc < secs:
            a = m * tu + tc
            o.append(RECT(p.X(a), yb + 18, max(1.0, p.X(min(a + _F15_NB * tb, secs)) - p.X(a)), 10, 1, GOSOFT, GLD, 0.8))
            m += 1
        r = tc
        while r <= secs + 1e-9:
            o.append(PL([(p.X(r), yb + 33), (p.X(r) - 4, yb + 26 + 0), (p.X(r) + 4, yb + 26)], c=SIG, lw=1, fill=SIG))
            r += tp
        o.append(T(p.x + p.w + 6, yb + 26, "▼ 主のループ", "start", 9, SIG, True))
        o.append(T(p.x + p.w + 6, yb + 38, "が読む", "start", 9, SIG, True))
        pts = _f15_fillsim(rb, rate, tp, secs)
        o.append(p.axes(xl="時間 t [s]" if rb == 115200 else None, yl="量 [B]", xt=[x * 0.2 for x in range(int(secs / 0.2) + 1)],
                        xfmt=lambda v: "%g" % round(v, 1)))
        o.append(p.clip([(min(t, secs), v) for t, v in pts], c=TEA, lw=1.4))
        for lev, c, lab in ((bad, ALI, "%d B: あふれる" % bad), (good, GRN, "%d B: 足りる" % good)):
            o.append(W(p.x, p.Y(lev), p.x + p.w, p.Y(lev), c=c, lw=1.3, dash="5 3"))
            o.append(T(p.x + p.w + 6, p.Y(lev) + 4, lab, "start", 9.5, c, True))
        mx = max(v for t, v in pts)
        n = _f15_ntp(tp, _F15_NB, tu, rb)
        tmx = [t for t, v in pts if v == mx][0]
        o.append(T(p.X(tmx) + 6, p.Y(mx) - 4, "最大 %d B = n(0.3 s)" % n, "start", 9.5, TEA, True, halo=True))
        yb += 214
    return SVG(700, yb + 6, o, "リングバッファの中の量（1 回分の最初のバイトが届く直前に読み、その後 0.3 s ごとに読む、最も悪い場合。1 ビットの時間を単位にバイトごとに計算）。")


F["e15_fill"] = _f15_fill_fig()


# =====================================================================
# 2 節: 処理の遅れと、要る大きさ
# =====================================================================
def _f15_size_fig():
    o = []
    p = Plot(80, 30, 470, 250, (0, 1.6), (0, 2600))
    o.append(p.axes(xl="処理の遅れ t_p [s]", yl="届くバイトの数の最大 n [B]", xt=[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6],
                    yt=[0, 500, 1000, 1500, 2000, 2500], xfmt=lambda v: "%g" % v))
    for lev in (512, 1024, 2048):
        o.append(W(p.x, p.Y(lev), p.x + p.w, p.Y(lev), c=FNT, lw=1, dash="2 3"))
        o.append(T(p.x + p.w + 4, p.Y(lev) + 4, "%d B" % lev, "start", 9.5, MUT))
    ts = [i * 0.0005 for i in range(3201)]
    for rb, rate, c, lab in ((9600, 1, SIG, "9600 bit/s・1 Hz"), (115200, 5, GRN, "115 200 bit/s・5 Hz")):
        o.append(p.clip([(t, _f15_ntp(t, _F15_NB, 1.0 / rate, rb)) for t in ts], c=c, lw=2.2))
        o.append(p.clip([(0, 0), (1.6, rb / 10.0 * 1.6)], c=c, lw=1.1, dash="5 3"))
    for rb, rate, c in ((9600, 1, SIG), (115200, 5, GRN)):
        n = _f15_ntp(0.3, _F15_NB, 1.0 / rate, rb)
        o.append(D(p.X(0.3), p.Y(n), c, 4.5))
        o.append(T(p.X(0.3) + 8, p.Y(n) + (14 if rb == 9600 else -6), "%d B" % n, "start", 10, c, True, halo=True))
    o.append(T(p.X(0.82), p.Y(626) - 8, "1 秒未満なら 1 回分の 626 B で止まる", "middle", 9.5, SIG, True, halo=True))
    o.append(T(p.X(1.0), p.Y(2200), "破線: 続けて届くとした見積もり", "start", 9.5, MUT, halo=True))
    o.append(T(p.X(1.0), p.Y(2200) + 13, "（速さ × 時間。comm 4 章 5 節）", "start", 9.5, MUT, halo=True))
    o.append(LEGL(110, 324, [(SIG, None, "9600 bit/s・1 Hz（t_tx 0.652 s）"), (GRN, None, "115 200 bit/s・5 Hz（t_tx 0.054 s、0.2 s ごとに 626 B）")], 9.5))
    return SVG(700, 334, o, "2 節の式で求めた、処理の遅れの間に届くバイトの数の最大（1 回分 626 B。点は本文の 0.3 s）。横の点線は 2 のべき乗の大きさ。")


F["e15_size"] = _f15_size_fig()


# =====================================================================
# 3 節: 測位の状態の決め方
# =====================================================================
def _f15_kinds_fig():
    o = []
    o.append(T(14, 18, "同じ時刻の GGA と RMC の欄から決める（上ほど良い）", "start", 11.5, INK, True))
    hx = [14, 128, 196, 256, 316]
    for x, h in zip(hx, ["測位の状態", "GGA の品質", "RMC の状態", "衛星の数", "求め方"]):
        o.append(T(x, 42, h, "start", 10, MUT, True))
    rows = [(6, "4", "A", "", "RTK（17 章）。整数を決めた解"),
            (5, "5", "A", "", "RTK（17 章）。整数が決まる前"),
            (4, "2", "A", "", "補正を使った（DGNSS・SBAS。16 章）"),
            (3, "1", "A", "4 以上", "単独（6 章）"),
            (2, "1", "A", "3", "単独。高さを決めた値に置く"),
            (1, "0・6", "V", "", "どれかなら（推測の 6 は 19 章）"),
            (0, "—", "—", "", "正しい文が 3 s 来ない（時間で決める）")]
    y = 64
    for st, q, rs, ns, how in rows:
        c = _F15_SC[st]
        s, w = CHIP(hx[0], y + 4, _F15_SN[st], c, 10.5)
        o.append(s)
        o.append(T(hx[1] + 20, y + 4, q, "middle", 10.5, INK, True, True))
        o.append(T(hx[2] + 20, y + 4, rs, "middle", 10.5, INK, True, True))
        o.append(T(hx[3] + 18, y + 4, ns, "middle", 10, INK))
        o.append(T(hx[4], y + 4, how, "start", 10, INK, halo=True))
        y += 30
    # 右: 水平の誤差の目安（代表値）
    p = Plot(482, 54, 200, 180, (0.01, 30), (0, 1), xlog=True)
    o.append(T(482, 42, "水平の誤差の目安 [m]（代表値）", "start", 10, MUT, True))
    rng = {6: (0.01, 0.05, "数 cm"), 5: (0.1, 0.5, "数十 cm"), 4: (0.5, 2.0, "1 m 前後"), 3: (2.0, 10.0, "数 m（7 章）"), 2: (3.0, 25.0, "高さが使えない")}
    yy = 64
    for st, q, rs, ns, how in rows:
        if st in rng:
            a, b, lab = rng[st]
            c = _F15_SC[st]
            o.append(RECT(p.X(a), yy - 7, p.X(b) - p.X(a), 14, 3, soft(c), c, 1.0))
            o.append(T(p.X(b) + 4 if b < 3 else p.X(a) - 4, yy + 4, lab, "start" if b < 3 else "end", 9, c, True, halo=True))
        yy += 30
    for v, lab in ((0.01, "0.01"), (0.1, "0.1"), (1, "1"), (10, "10")):
        o.append(W(p.X(v), 56, p.X(v), 252, c=GRD, lw=1))
        o.append(T(p.X(v), 266, lab, "middle", 9.5, MUT))
    return SVG(700, 274, o, "測位の状態（Fix の種類）の決め方。誤差の目安は開けた空の代表値で、受信機・衛星の並び・補正の情報によって大きく変わる。")


F["e15_kinds"] = _f15_kinds_fig()


# =====================================================================
# 3 節: 状態遷移図
# =====================================================================
def _f15_fsm_fig():
    o = []
    cx, w, h = 196, 150, 32
    ys = {6: 36, 5: 82, 4: 128, 3: 174, 2: 220, 1: 272, 0: 344}
    for st, y in ys.items():
        o.append(STATE(cx, y + h / 2, w, h, _F15_SN[st], _F15_SC[st]))
    # 上がる（右）
    xr = cx + w / 2 + 22
    o.append(ARR(xr, ys[1] + 12, xr, ys[6] + 6, c=GRN, lw=2.6, head=10))
    for st in range(1, 7):
        o.append(W(cx + w / 2, ys[st] + 12, xr, ys[st] + 12, c=GRN, lw=0.9, dash="2 2"))
    _f15_lines(o, xr + 10, ys[5] + 4, ["上がる: 今より良い種類の", "組が 3 回続いたら、続い", "た中で最も悪い種類へ", "（UP_N）"], 9.5, GRN, 14, "start", True)
    # 下がる（左）
    xl = cx - w / 2 - 22
    o.append(ARR(xl, ys[6] + 6, xl, ys[1] + 22, c=ALI, lw=2.6, head=10))
    for st in range(1, 7):
        o.append(W(cx - w / 2, ys[st] + 16, xl, ys[st] + 16, c=ALI, lw=0.9, dash="2 2"))
    _f15_lines(o, xl - 8, ys[5] + 4, ["下がる:", "悪い種類の", "組が 1 回来", "たら、すぐ", "その種類へ"], 9.5, ALI, 14, "end", True)
    # 年齢の時間切れ（2D 以上 → 測位なし）
    xa = 440
    o.append(W(xa - 6, ys[6] + 4, xa, ys[6] + 4, xa, ys[2] + 28, xa - 6, ys[2] + 28, c=GLD, lw=1.4))
    o.append(W(xa, ys[2] + 28, xa, ys[1] + 24, c=GLD, lw=1.4, dash="5 3"))
    o.append(ARR(xa, ys[1] + 24, cx + w / 2 + 2, ys[1] + 24, c=GLD, lw=1.4, dash="5 3"))
    _f15_lines(o, xa + 8, ys[6] + 14, ["時間切れ（2D 以上から）:", "位置の年齢が 2.5 s を", "超えた（AGE_MAX_MS）"], 9.5, GLD, 14, "start", True)
    # 文なしへ・文なしから
    o.append(ARR(cx + 30, ys[1] + h, cx + 30, ys[0] - 1, c=ALI, lw=1.6, dash="5 3"))
    _f15_lines(o, cx + 38, ys[1] + h + 22, ["時間切れ: 正しい文が 3 s 来ない", "（どの状態からも。LOST_MS）"], 9.5, ALI, 14, "start", True)
    o.append(ARR(cx - 30, ys[0], cx - 30, ys[1] + h + 1, c=SIG, lw=1.6))
    _f15_lines(o, cx - 38, ys[1] + h + 22, ["正しい文が届いた", "（gnss_poll）"], 9.5, SIG, 14, "end", True)
    # 使ってよいか
    bx, by, bw = 470, 150, 218
    o.append(RECT(bx, by, bw, 186, 8, PAN, INK, 1.2))
    o.append(T(bx + 10, by + 18, "使ってよいか（組ごと。fix_judge）", "start", 10.5, INK, True))
    checks = ["状態機械が 3D 以上", "衛星の数 5 以上", "HDOP 2.0 以下", "前の位置からの飛びが"]
    yy = by + 40
    for t in checks:
        o.append(T(bx + 12, yy, "□ " + t, "start", 10, INK))
        yy += 20
    o.append(T(bx + 26, yy - 4, "50 m/s × 経った時間 + 30 m 以内", "start", 9.5, INK))
    o.append(T(bx + 26, yy + 10, "（3 回続けば受け入れる）", "start", 9.5, MUT))
    o.append(T(bx + 12, yy + 32, "全部満たせば使う。満たさない", "start", 10, GRN, True))
    o.append(T(bx + 12, yy + 46, "ものがあれば、理由を付けて使わない", "start", 10, ALI, True))
    o.append(T(bx + bw, by + 200, "しきい値はどれも例の値", "end", 9, MUT))
    return SVG(700, 386, o, "測位の状態の状態機械（3 節の fix_epoch・fix_tick）と、組ごとの判断（fix_judge）。時間はどれも例の値。")


F["e15_fsm"] = _f15_fsm_fig()


# =====================================================================
# 3 節: 走行の例（組の値 → 組の種類 → 状態機械 → 判断）。デモの「本文の例」と同じ筋書き
# =====================================================================
def _f15_scn_spec():
    """秒ごとの (品質, 衛星の数, HDOP の欄, RMC の状態, 緯度の入れ替わり) か None（文が来ない）。"""
    sp = []
    for k in range(30):
        if k <= 4:
            sp.append((1, 9, "0.90", "A", False))
        elif k <= 10:
            sp.append((5 if k == 6 else 4, 9, "0.90", "A", False))
        elif k <= 12:
            sp.append((1, 4, "2.80", "A", False))
        elif k <= 17:
            sp.append((0, 0, "99.99", "V", False))
        elif k <= 20:
            sp.append((1, 8, "1.10", "A", False))
        elif k <= 23:
            sp.append(None)
        else:
            sp.append((1, 8, "1.00", "A", k == 27))
    return sp


def _f15_scn_record(sp):
    out = []
    for k, x in enumerate(sp):
        t0 = _F15_T0 + 1000 * k
        out.append((t0, "PPS"))
        if x is None:
            continue
        q, ns, hd, st, swap = x
        t = _f15_hms(k)
        lon = "139%08.5f" % (46.02 + 10.0 / (111194.9 / 60.0 * _f15_m.cos(_f15_m.radians(35.681))) * k)
        lat = "3504.86000" if swap else "3540.86000"
        if st == "V":
            bodies = ["GPGGA,%s.00,,,,,0,00,99.99,,,,,," % t, "GPRMC,%s.00,V,,,,,,,111126,,,N" % t]
        else:
            bodies = ["GPGGA,%s.00,%s,N,%s,E,%d,%02d,%s,3.3,M,36.7,M,," % (t, lat, lon, q, ns, hd),
                      "GPRMC,%s.00,A,3540.86000,N,%s,E,19.438,90.0,111126,,,A" % (t, lon)]
        bodies += [_F15_GSA, _F15_GSV1, _F15_GSV2]
        cum = 0
        for b in bodies:
            s = "$%s*%02X" % (b, _f15_ck(b))
            cum += len(s) + 2
            out.append((t0 + _F15_TC + int(round(cum * 10.0 / _F15_BAUD * 1000)), s))
    return out


_F15_SCN = _F15Sim().run(_f15_scn_record(_f15_scn_spec()), tail=1500)


def _f15_judge_fig():
    o = []
    sp = _f15_scn_spec()
    sim = _F15_SCN
    x0, x1, tend = 132, 684, 31.0
    X = lambda t: x0 + t / tend * (x1 - x0)          # t は秒（パルス 0 からの時間）
    cw = X(1) - X(0)
    # 場面
    scenes = [(0, 5, "開けた空"), (5, 11, "RTK（補正つき）"), (11, 13, "ビル街"), (13, 18, "トンネル"), (18, 21, "出た"),
              (21, 24, "文が止まる"), (24, 30, "戻る")]
    y = 22
    for a, b, lab in scenes:
        o.append(W(X(a) + 2, y + 6, X(b) - 2, y + 6, c=MUT, lw=1.2))
        o.append(W(X(a) + 2, y + 2, X(a) + 2, y + 6, c=MUT, lw=1.2))
        o.append(W(X(b) - 2, y + 2, X(b) - 2, y + 6, c=MUT, lw=1.2))
        o.append(T((X(a) + X(b)) / 2, y, lab, "middle", 9.5, INK, True))
    rows = [("q", 50, "品質"), ("ns", 72, "衛星の数"), ("hd", 104, "HDOP"), ("kind", 140, "組の種類"), ("st", 170, "状態機械"),
            ("why", 200, "判断")]
    for key, yy, lab in rows:
        o.append(T(x0 - 8, yy + 4, lab, "end", 10, INK, True))
    # 組の値
    by_k = {(o_["t"] - 34070000) // 1000: o_ for o_ in sim.out}
    for k, x in enumerate(sp):
        xc = X(k + 0.27)
        if x is None:
            o.append(T(xc, 54, "—", "middle", 9, MUT))
            continue
        q, ns, hd, st, swap = x
        o.append(T(xc, 54, "%d" % q, "middle", 9.5, INK, False, True))
        o.append(T(xc, 76, "%d" % ns, "middle", 9.5, INK, False, True))
    # HDOP の小さなグラフ（しきい値 2.0）
    hp = Plot(x0, 88, x1 - x0, 26, (0, tend), (0, 3.2))
    o.append(W(x0, hp.Y(2.0), x1, hp.Y(2.0), c=ALI, lw=0.9, dash="4 3"))
    o.append(T(x1 + 2, hp.Y(2.0) + 4, "2.0", "start", 8.5, ALI))
    pts = []
    for k, x in enumerate(sp):
        if x is None or x[3] == "V":
            if pts:
                o.append(hp.steps(pts + [(pts[-1][0] + 1, pts[-1][1])], c=GLD, lw=1.6)); pts = []
            continue
        pts.append((k + 0.27, float(x[2])))
    if pts:
        o.append(hp.steps(pts + [(pts[-1][0] + 1, pts[-1][1])], c=GLD, lw=1.6))
    # 組の種類
    for k in range(30):
        e = by_k.get(k)
        if e is None:
            continue
        kd = _f15_kind(e["g"], e["r"]["st"])
        o.append(RECT(X(k + 0.27) - cw / 2 + 1, 132, cw - 2, 16, 2, soft(_F15_SC[kd]), _F15_SC[kd], 1.0))
    # 状態機械（100 ms ごとの記録）
    segs, cur, t0 = [], None, 0.0
    for tm, st in sim.hist:
        t = (tm - _F15_T0) / 1000.0
        if t < 0 or t > tend:
            continue
        if st != cur:
            if cur is not None:
                segs.append((t0, t, cur))
            cur, t0 = st, t
    segs.append((t0, tend, cur))
    for a, b, st in segs:
        o.append(RECT(X(a), 160, X(b) - X(a), 20, 0, soft(_F15_SC[st]), _F15_SC[st], 1.0))
        if X(b) - X(a) > tw(_F15_SN[st], 9) + 6:
            o.append(T((X(a) + X(b)) / 2, 174, _F15_SN[st], "middle", 9, _F15_SC[st], True))
    # 判断
    syms = {0: "●", 1: "状", 2: "衛", 3: "H", 4: "飛"}
    for k in range(30):
        e = by_k.get(k)
        if e is None:
            continue
        w = e["why"]
        o.append(T(X(k + 0.27), 205, syms[w], "middle", 10 if w else 11, _F15_WC[w], True))
    # 注記
    o.append(T(X(8.6), 230, "フロートとフィックスが交互 → 3 組続いた中の悪い方（フロート）へ、その後 3 組でフィックスへ", "middle", 9, TEA, True))
    o.append(T(X(22.7), 246, "年齢 2.5 s で測位なし、3 s で文なし", "middle", 9, ALI, True))
    o.append(T(X(27.3), 262, "66.6 km の飛び（12 章 3 節）", "middle", 9, ALI, True))
    # 時間の目盛
    for v in range(0, 31, 5):
        o.append(W(X(v), 270, X(v), 274, c=MUT, lw=1))
        o.append(T(X(v), 286, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, 301, "時間 [s]（組は各秒の 0.27 s 後にそろう）", "middle", 10, MUT))
    o.append(T(14, 322, "判断: ● 使う　状 状態機械が 3D 未満　衛 衛星の数　H HDOP　飛 前の位置からの飛び", "start", 9.5, MUT))
    o.append(LEGEND(14, 340, [(_F15_SC[i], _F15_SN[i]) for i in range(7)], 9.5, 10))
    return SVG(700, 350, o, "走行の例の組の値と、組ごとの種類・状態機械の状態・判断（本文の C と同じ手順で計算。値は例）。")


F["e15_judge"] = _f15_judge_fig()


# =====================================================================
# 4 節: 同じ時刻の文を 1 組にする
# =====================================================================
def _f15_epoch_fig():
    o = []
    o.append(T(14, 18, "届いた順の文（大きさは時間に比例しない。:50 は時刻の欄の秒）", "start", 11, INK, True))
    secs = [50, 51, 52, None, 54]
    x, y = 14, 34
    cells = {}
    for i, s in enumerate(secs):
        xs = 14 + i * 136
        if s is None:
            o.append(T(xs + 62, y + 18, "1 秒分が", "middle", 9.5, ALI, True))
            o.append(T(xs + 62, y + 31, "全部抜けた（:53）", "middle", 9.5, ALI, True))
            continue
        for j, (k, w) in enumerate((("GGA", 36), ("RMC", 36), ("GSA…GLL", 52))):
            cx0 = xs + [0, 38, 76][j]
            c = SIG if k == "GGA" else (PUR if k == "RMC" else MUT)
            lost = (s == 51 and k == "RMC")
            o.append(RECT(cx0, y, w, 34, 3, soft(c), c, 1.0, dash="4 2" if lost else None))
            o.append(T(cx0 + w / 2, y + 14, k, "middle", 9.5, c, True))
            o.append(T(cx0 + w / 2, y + 27, (":%d" % s) if k != "GSA…GLL" else "時刻なし", "middle", 9 if k != "GSA…GLL" else 8.5, INK if k != "GSA…GLL" else MUT, False, k != "GSA…GLL"))
            if lost:
                o.append(W(cx0 + 4, y + 4, cx0 + w - 4, y + 30, c=ALI, lw=1.8))
                o.append(W(cx0 + 4, y + 30, cx0 + w - 4, y + 4, c=ALI, lw=1.8))
            cells[(s, k)] = (cx0, cx0 + w)
    o.append(T(14 + 1 * 136 + 38 + 18, y + 48, "抜けた", "middle", 9, ALI, True))
    # 組
    yb = 108
    o.append(T(14, yb, "epoch_feed が作る組と、そのときの動作", "start", 11, INK, True))
    groups = [(50, GRN, ["GGA と RMC が", "そろった:", "すぐ epoch_done へ"]),
              (51, ALI, ["RMC が無いまま :52 の", "文が来た: 閉じて", "n_part を 1 増やす"]),
              (52, GRN, ["そろった:", "epoch_done へ"]),
              (54, ALI, ["前の組から 2 s:", "n_gap を 1 増やす", "（そろえば渡す）"])]
    for s, c, lines in groups:
        i = secs.index(s)
        xs = 14 + i * 136
        o.append(W(xs, yb + 12, xs, yb + 18, xs + 112, yb + 18, xs + 112, yb + 12, c=c, lw=1.4))
        o.append(T(xs + 56, yb + 34, "組 :%d" % s, "middle", 10.5, c, True))
        _f15_lines(o, xs + 56, yb + 50, lines, 9.5, c, 13, "middle", True)
    # 時刻の差
    o.append(T(14, yb + 112, "組を閉じるのは、時刻の違う GGA か RMC が来たとき。時刻の差が更新の間隔（1000 ms）でなければ時刻の飛び", "start", 9.5, MUT))
    o.append(T(14, yb + 126, "とする（0 時をまたぐときの −86 399 000 ms は飛びではない）。", "start", 9.5, MUT))
    return SVG(700, yb + 134, o, "時刻の欄で GGA と RMC を 1 組にまとめる様子（12 章の例の文。:51 の RMC と :53 の 1 秒分を抜いた例）。")


F["e15_epoch"] = _f15_epoch_fig()


# =====================================================================
# 4 節: 取りこぼしを見つける
# =====================================================================
def _f15_lost_fig():
    o = []
    hx = [14, 140, 316, 460]
    for x, h in zip(hx, ["どこで", "何が起きた", "増える数え", "主な原因と直し方"]):
        o.append(T(x, 18, h, "start", 10, MUT, True))
    rows = [("UART", GLD, "割り込みが間に合わない", "n_rxerr", ["割り込みを短く（1 節）・割り込みを", "止める区間を短く"]),
            ("リングバッファ", TEA, "満杯で新しいバイトを捨てた", "n_drop・rb_max", ["大きさを n(t_p) 以上に（2 節）・", "処理の遅れを短く"]),
            ("文", SIG, "化けた・切れた・長すぎる", "n_bad", ["線の雑音・ボーレートのずれ・", "上の 2 段で失ったバイト"]),
            ("組", PUR, "GGA か RMC が無い", "n_part", ["上の段で失った文"]),
            ("組", PUR, "時刻が更新の間隔だけ進まない", "n_gap", ["負荷率 100 % 超えでモジュールが", "捨てた（13 章 3 節）・文が止まった"]),
            ("位置", GRN, "チェックサムが見逃した", "飛び（USE_JUMP）", ["2 文字の入れ替わりなど", "（12 章 3 節）"]),
            ("1PPS", GLD, "パルスか組が抜けた・遅れすぎ", "n_nolabel・pps_late", ["負荷率を見直す（4 節）"])]
    y = 40
    for where, c, what, cnt, fix in rows:
        o.append(RECT(10, y - 4, 680, 38, 4, "none", LIN, 0.6))
        s, w = CHIP(hx[0], y + 15, where, c, 10)
        o.append(s)
        o.append(T(hx[1], y + 19, what, "start", 10, INK))
        s, w = CHIP(hx[2], y + 15, cnt, ALI, 9.5, mono=True)
        o.append(s)
        _f15_lines(o, hx[3], y + 12 if len(fix) == 2 else y + 19, fix, 9.5, INK, 13)
        y += 42
    o.append(T(14, y + 12, "1 バイトを捨てると、その文の n_bad が増え、それが GGA か RMC なら n_part も増える（上の段から下の段へ伝わる）。", "start", 9.5, MUT))
    return SVG(700, y + 20, o, "取りこぼしが起きた段と、それを見つける数え（12 章 4 節の n_bad と、この章の数え）。")


F["e15_lost"] = _f15_lost_fig()


# =====================================================================
# 4 節: 1PPS との対応
# =====================================================================
def _f15_pps_fig():
    o = []
    o.append(T(14, 18, "(a) 前の組の後のパルスがちょうど 1 つのときだけ、名前を付ける（パルスから 0.27 s で組がそろう例）", "start", 11, INK, True))
    x0, x1 = 90, 680
    X = lambda t: x0 + t / 6.0 * (x1 - x0)
    yp, ye = 56, 100
    o.append(T(x0 - 8, yp + 4, "1PPS", "end", 10, GRN, True))
    o.append(T(x0 - 8, ye + 4, "秒の頭の組", "end", 10, SIG, True))
    pulses = [0, 1, 2, 4, 5]
    for s in range(6):
        o.append(W(X(s), 30, X(s), 150, c=FNT, lw=1, dash="3 3"))
        o.append(T(X(s), 162, "%d s" % s, "middle", 9.5, MUT))
    for s in pulses:
        o.append(PL([(X(s) - 6, yp + 8), (X(s), yp + 8), (X(s), yp - 8), (X(s) + 12, yp - 8), (X(s) + 12, yp + 8), (X(s) + 18, yp + 8)], c=GRN, lw=2))
    o.append(T(X(3) + 6, yp - 12, "パルスが抜けた", "start", 9, ALI, True))
    eps = [(0, 1, True), (2, 2, False), (3, 0, False), (4, 1, True), (5, 1, True)]
    for s, k, ok in eps:
        xe = X(s + 0.27)
        o.append(D(xe, ye, SIG, 5))
        o.append(T(xe, ye + 22, "k = %d" % k, "middle", 9.5, SIG, True, True))
        c = GRN if ok else ALI
        if ok:
            o.append(ARR(xe - 3, ye - 6, X(s) + 2, yp + 10, c=GRN, lw=1.5, head=6))
            o.append(T(xe + 6, ye - 8, "%d s と付ける" % s, "start", 9, GRN, True, halo=True))
        else:
            o.append(T(xe, ye + 36, "付けない", "middle", 9.5, ALI, True))
    o.append(T(X(1.27), ye + 4, "組 1 が抜けた", "middle", 9, ALI, True))
    o.append(T(X(2.27), ye + 50, "（パルスが 2 つ）", "middle", 9, ALI))
    o.append(T(X(3.27), ye + 50, "（パルスが 0）", "middle", 9, ALI))
    # (b) 負荷率 130 %
    yb = 196
    o.append(T(14, yb, "(b) 9600 bit/s・2 Hz（負荷率 130 %）: パルスから秒の頭の組がそろうまでが増えていく", "start", 11, INK, True))
    p = Plot(90, yb + 20, 420, 150, (0, 5.2), (0, 1.4))
    o.append(p.axes(xl="組の時刻（秒の頭）[s]", yl="遅れ [s]", xt=[0, 1, 2, 3, 4, 5], yt=[0, 0.5, 1.0], xfmt=lambda v: "%d" % v))
    tb = 10.0 / 9600
    tx = _F15_NB * tb
    lat = []
    for s in range(6):
        m = 2 * s
        start = 0.12 + m * tx if m * 0.5 + 0.12 < 0.12 + m * tx else m * 0.5 + 0.12
        c_ = start + (_F15_S11[0][1] + _F15_S11[1][1]) * tb
        lat.append((s, c_ - s))
    o.append(W(p.x, p.Y(0.5), p.x + p.w, p.Y(0.5), c=GLD, lw=1.3, dash="5 3"))
    o.append(T(p.x + p.w + 4, p.Y(0.5) + 4, "LAT_MAX 0.5 s", "start", 9.5, GLD, True))
    o.append(W(p.x, p.Y(1.0), p.x + p.w, p.Y(1.0), c=ALI, lw=1.1, dash="2 3"))
    o.append(T(p.x + p.w + 4, p.Y(1.0) + 4, "1 s（これを超えると", "start", 9.5, ALI, True))
    o.append(T(p.x + p.w + 4, p.Y(1.0) + 17, "1 秒ずれた名前になる）", "start", 9.5, ALI, True))
    o.append(p.clip([(s, v) for s, v in lat], c=SIG, lw=1.6))
    for s, v in lat:
        if v > 1.4:
            continue
        c = GRN if v < 0.5 else (GLD if v < 1.0 else ALI)
        o.append(D(p.X(s), p.Y(v), c, 4.5))
        o.append(T(p.X(s) + 7, p.Y(v) + 4, "%.2f s" % v, "start", 9.5, c, True, halo=True))
    s1 = lat[1]
    o.append(T(p.X(1) + 7, p.Y(s1[1]) - 12, "ここで pps_late を立てて止める", "start", 9.5, GLD, True, halo=True))
    return SVG(700, yb + 210, o, "1PPS に名前を付ける条件（4 節の pps_label）。(b) の文の並びは 13 章 3 節と同じ（前の組を送り終えるまで待ち、捨てない例）。")


F["e15_pps"] = _f15_pps_fig()


# =====================================================================
# 5 節: 起動から止めるまで（電源の管理の状態機械）
# =====================================================================
def _f15_boot_fig():
    o = []
    S = {"off": (92, 76, 156, PUR, "切れている", "バックアップだけ 15 µA"),
         "wait": (282, 76, 150, SIG, "文を待つ", "主の電源を入れた・35 mA"),
         "cfg": (456, 76, 146, SIG, "設定を確かめる", "13 章 6 節"),
         "fix": (616, 76, 132, GLD, "測位を待つ", "捕捉中 35 mA"),
         "run": (616, 236, 132, GRN, "動作", "追尾中 25 mA"),
         "stop": (282, 236, 150, PUR, "止める", "命令 → 信号 → 電源")}
    h = 50
    for k, (x, y, w, c, nm, sub) in S.items():
        o.append(STATE(x, y, w, h, nm, c, sub))
    def r(k): return S[k][0] + S[k][2] / 2
    def l(k): return S[k][0] - S[k][2] / 2
    o.append(EDGE(r("off"), 76, l("wait"), 76, None, c=SIG))
    o.append(EDGE(r("wait"), 76, l("cfg"), 76, None, c=SIG))
    o.append(EDGE(r("cfg"), 76, l("fix"), 76, None, c=SIG))
    o.append(EDGE(616, 76 + h / 2, 616, 236 - h / 2, None, c=GRN))
    o.append(EDGE(l("run"), 236, r("stop"), 236, None, c=PUR))
    o.append(EDGE(l("stop") + 10, 236 - h / 2, 92, 76 + h / 2, None, c=PUR))
    _f15_lines(o, 186, 120, ["起きる時刻・", "必要なとき"], 9, SIG, 12, "middle", True)
    _f15_lines(o, 369, 120, ["正しい文", "（文なしを出た）"], 9, SIG, 12, "middle", True)
    _f15_lines(o, 536, 120, ["読み出した値", "が合った"], 9, SIG, 12, "middle", True)
    _f15_lines(o, 624, 150, ["状態機械が", "3D 以上（3 節）"], 9, GRN, 12, "start", True)
    _f15_lines(o, 454, 254, ["使い終わった・", "周期の分だけ動いた"], 9, PUR, 12, "middle", True)
    _f15_lines(o, 120, 178, ["停止の ACK を受け、", "TX を L にしてから", "主の電源を切った"], 9, PUR, 12, "middle", True)
    # 自分への遷移と時間切れ
    o.append(SELF(282, 76 - h / 2, None, GLD))
    o.append(T(282, 12, "2 s 来なければ次の通信の速さ（13 章 3 節）", "middle", 9, GLD, True))
    o.append(SELF(456, 76 - h / 2, None, GLD))
    o.append(T(484, 36, "違えば送り、ACK を待つ", "start", 9, GLD, True))
    o.append(W(616 - 66 + 8, 76 + h / 2, 400, 236 - h / 2 + 2, c=ALI, lw=1.5, dash="5 3"))
    o.append(_head(410, 236 - h / 2 - 6, 400, 236 - h / 2 + 2, ALI, 7))
    _f15_lines(o, 462, 150, ["時間切れ: 45 s で", "位置が出ない → 止める", "（次の間隔を 2 倍に）"], 9, ALI, 12, "end", True)
    _f15_lines(o, 282, 290, ["全部の速さで文が来ないとき: リセットの端子で", "やり直し、それでも来なければ故障として知らせる"], 9, ALI, 12, "middle", True)
    o.append(T(14, 330, "切っていた時間が、バックアップ電源の保持時間（10 章 3 節）より短ければ、次はホットスタートで位置が速く出る。", "start", 9.5, MUT))
    return SVG(700, 340, o, "モジュールの電源を管理する状態機械（電流と時間は例の値）。")


F["e15_boot"] = _f15_boot_fig()


# =====================================================================
# 5 節: 電池を守る 2 つの工夫（13 章 5 節の式と例の値）
# =====================================================================
def _f15_iavg(Tu, tacq=2.0, ttrk=0.0, Iacq=35.0, Itrk=25.0, Ibk=0.015, twarm=30.0, teph=7200.0):
    """13 章 5 節の平均の電流 [mA]（周期 Tu < teph のとき、エフェメリスを受け直す分を足す）。"""
    q = Iacq * tacq + Itrk * ttrk + Ibk * (Tu - tacq - ttrk)
    return q / Tu + (Iacq * (twarm - tacq) / teph if Tu < teph else 0.0)


def _f15_backoff(T=7200.0, t0=60.0, tmax=1800.0, tw=45.0, Iacq=35.0, Ibk=0.015, grow=True):
    """屋内で捕捉できないときの、時刻 [s] ごとの使った電荷 [mAh] と、起きた時刻の並び。"""
    wakes, t, iv = [], 0.0, t0
    while t < T:
        wakes.append(t)
        t += iv
        if grow:
            iv = min(iv * 2, tmax)
    pts, q, last = [(0.0, 0.0)], 0.0, 0.0
    for w in wakes:
        q += Ibk * (w - last) / 3600.0; pts.append((w / 60.0, q))
        e = min(w + tw, T)
        q += Iacq * (e - w) / 3600.0; pts.append((e / 60.0, q))
        last = e
    q += Ibk * (T - last) / 3600.0; pts.append((T / 60.0, q))
    return pts, wakes


def _f15_power_fig():
    o = []
    o.append(T(14, 18, "(a) 屋内で 2 時間、捕捉できないとき（起きるたびに上限の 45 s まで探す）", "start", 11, INK, True))
    p = Plot(80, 60, 330, 150, (0, 120), (0, 75))
    o.append(p.axes(xl="時間 [分]", yl="使った電荷 [mAh]", xt=[0, 20, 40, 60, 80, 100, 120], yt=[0, 25, 50, 75]))
    fixed, wf = _f15_backoff(grow=False)
    back, wb = _f15_backoff(grow=True)
    o.append(p.line([(0, 0), (120, 70)], c=ALI, lw=2))
    o.append(p.line(fixed, c=GLD, lw=2))
    o.append(p.line(back, c=GRN, lw=2.2))
    for w in wb:
        o.append(W(p.X(w / 60.0), 42, p.X(w / 60.0), 52, c=GRN, lw=1.6))
    o.append(T(p.x, 36, "間隔を延ばしたときに起きる時刻", "start", 9, GRN, True))
    o.append(T(p.X(118), p.Y(70) - 6, "探し続ける 35 mA: 70 mAh", "end", 9.5, ALI, True, halo=True))
    o.append(T(p.X(118), p.Y(fixed[-1][1]) - 8, "60 s ごと: %.1f mAh" % fixed[-1][1], "end", 9.5, GLD, True, halo=True))
    o.append(T(p.X(118), p.Y(back[-1][1]) - 8, "2 倍ずつ延ばす: %.1f mAh" % back[-1][1], "end", 9.5, GRN, True, halo=True))
    o.append(T(p.X(118), p.Y(back[-1][1]) - 22, "（60 s から始め、上限 30 分。%d 回起きる）" % len(wb), "end", 9, GRN, halo=True))
    # (b) 電池の残りで切り替える
    o.append(T(462, 18, "(b) 電池 2000 mAh の残りと方式", "start", 11, INK, True))
    q = Plot(500, 60, 186, 150, (0, 90), (0, 100))
    o.append(q.axes(xl="日数", yl="電池の残り [%]", xt=[0, 30, 60, 90], yt=[0, 50, 100]))
    Qb = 2000.0
    I1, I60, I600 = 25.0, _f15_iavg(60.0), _f15_iavg(600.0)
    d_cont = Qb / I1 / 24.0
    d_60 = Qb / I60 / 24.0
    t1 = 0.5 * Qb / I1 / 24.0
    t2 = t1 + 0.3 * Qb / I60 / 24.0
    t3 = t2 + 0.2 * Qb / I600 / 24.0
    o.append(q.line([(0, 100), (d_cont, 0)], c=ALI, lw=1.8))
    o.append(q.line([(0, 100), (d_60, 0)], c=GLD, lw=1.8, dash="5 3"))
    o.append(q.line([(0, 100), (t1, 50), (t2, 20), (t3, 0)], c=GRN, lw=2.2))
    o.append(T(q.X(30), q.Y(54), "60 s ごとのまま %.0f 日" % d_60, "start", 9, GLD, True, halo=True))
    o.append(T(q.X(t3) - 2, q.Y(2) - 6, "切り替え %.0f 日" % t3, "end", 9, GRN, True, halo=True))
    o.append(T(q.X(14), q.Y(90), "連続のまま %.1f 日" % d_cont, "start", 9, ALI, True, halo=True))
    _f15_lines(o, 462, 252, ["切り替え（例）: 残り 50 % までは",
                             "連続（1 s ごと・%.0f mA）、20 %% までは" % I1,
                             "60 s ごと（%.2f mA）、その後は" % I60,
                             "10 分ごと（%.2f mA）に位置を出す" % I600], 9.5, GRN, 14, "start", True)
    o.append(T(14, 260, "60 s ごとに 45 s 探す: 平均 %.1f mA" % (35.0 * 45 / 60), "start", 9.5, GLD, True))
    o.append(T(14, 274, "（位置が出るときの %.2f mA の %.0f 倍）" % (I60, 35.0 * 45 / 60 / I60), "start", 9.5, GLD))
    return SVG(700, 310, o, "13 章 5 節の例の値（捕捉中 35 mA・追尾中 25 mA・バックアップ 15 µA、ホット 2 s・ウォーム 30 s・エフェメリス 2 時間）で計算した、電池を守る 2 つの工夫の効果。")


F["e15_power"] = _f15_power_fig()


# =====================================================================
# 6 節: 試験の構成（ホストでの再生と HIL）
# =====================================================================
def _f15_harness_fig():
    o = []
    o.append(T(14, 18, "(a) ホストで: 記録の再生による試験", "start", 11, SIG, True))
    o.append(T(366, 18, "(b) 実機で: HIL", "start", 11, PUR, True))
    bl = [(36, "記録（時刻 [ms] と文・PPS）", ["Python で作り、誤りを混ぜる"], TEA),
          (100, "replay と試験の時計", ["仮に置く関数の中身を、記録と", "試験の時計に置き換える"], SIG),
          (172, "本文の C をそのまま", ["gnss_rx_isr・gnss_poll・epoch_feed・", "fix_epoch・fix_judge・pps_label"], SIG),
          (244, "結果（組ごとの状態と判断・数え）", ["use_epoch と mclock_pps が書き出す"], GRN)]
    for y, t, sub, c in bl:
        o.append(RECT(20, y, 300, 52, 7, soft(c), c, 1.2))
        o.append(T(170, y + 18, t, "middle", 10.5, c, True))
        _f15_lines(o, 170, y + 33, sub, 9, INK, 12, "middle")
    for y in (88, 152, 224):
        o.append(ARR(170, y, 170, y + 12, c=MUT, lw=1.6))
    o.append(RECT(20, 312, 140, 40, 7, GSOFT, GRN, 1.2))
    o.append(T(90, 330, "期待の値", "middle", 10, GRN, True))
    o.append(T(90, 344, "（同じ手順の Python）", "middle", 9, INK))
    o.append(RECT(180, 312, 140, 40, 7, PAN, INK, 1.2))
    o.append(T(250, 336, "比べる → 一致", "middle", 10, INK, True))
    o.append(ARR(170, 296, 230, 312, c=MUT, lw=1.4))
    o.append(ARR(160, 332, 180, 332, c=MUT, lw=1.4))
    o.append(T(170, 372, "確かめること: 解析と判断の手順（速く、何千回でも）", "middle", 9.5, SIG, True))
    # HIL
    hb = [(36, "PC（記録を流す）", ["同じ記録を、9600 bit/s の UART と", "ディジタルの出力（1PPS）で送る"], PUR),
          (124, "実機のファームウェア", ["本物の割り込み・タイマの捕獲・", "リングバッファ・主のループ"], SIG),
          (212, "PC（結果を集めて比べる）", ["デバッグの線などで結果と数え", "（n_drop・rb_max）を受け取る"], GRN)]
    for y, t, sub, c in hb:
        o.append(RECT(376, y, 300, 60, 7, soft(c), c, 1.2))
        o.append(T(526, y + 20, t, "middle", 10.5, c, True))
        _f15_lines(o, 526, y + 36, sub, 9, INK, 12, "middle")
    o.append(ARR(526, 96, 526, 124, c=PUR, lw=1.8))
    o.append(T(534, 114, "RX・捕獲の端子", "start", 9, PUR, True))
    o.append(ARR(526, 184, 526, 212, c=GRN, lw=1.8))
    _f15_lines(o, 526, 300, ["確かめること: 割り込みの時間・リングバッファの", "大きさ（主のループをわざと遅らせる）・捕獲",
                             "（embtest 15 章）"], 9.5, PUR, 14, "middle", True)
    return SVG(700, 384, o, "記録の再生による試験（ホスト）と HIL の構成。")


F["e15_harness"] = _f15_harness_fig()


# =====================================================================
# 6 節: 誤りを混ぜた 60 s の記録と、結果
# =====================================================================
_F15_REC = _f15_record()
_F15_RUN = _F15Sim().run(_F15_REC)
# ホストの C（test15r.c）の結果（本文の C をそのまま動かした値。モデルと比べて図に印を付ける）
_F15_CRES = dict(n_bad=2, n_part=2, n_gap=2, n_nolabel=7, labels=34, epochs=52)


def _f15_replay_fig():
    o = []
    sim = _F15_RUN
    x0, x1, tend = 110, 684, 64.0
    X = lambda t: x0 + t / tend * (x1 - x0)
    cw = X(1) - X(0)
    # 混ぜた誤り
    marks = [(5, "1"), (8, "2"), (11, "3"), (14, "4"), (17, "5"), (21.5, "6"), (24.6, "7"), (28, "8"), (42, "9"), (51.5, "10")]
    o.append(T(x0 - 8, 30, "混ぜた誤り", "end", 10, ALI, True))
    for s, lab in marks:
        o.append(CIRC(X(s + 0.5), 26, 8, c=ALI, lw=1.3, fill=ASOFT))
        o.append(T(X(s + 0.5), 30, lab, "middle", 8.5 if len(lab) > 1 else 9.5, ALI, True))
    # 1PPS
    o.append(T(x0 - 8, 58, "1PPS", "end", 10, GRN, True))
    pps = [(t - _F15_T0) / 1000.0 for t, s in _F15_REC if s == "PPS"]
    for t in pps:
        o.append(W(X(t), 50, X(t), 60, c=GRN, lw=1.4))
    # 組（そろった・そろわない）
    o.append(T(x0 - 8, 84, "組", "end", 10, SIG, True))
    done = {(e["t"] - 34070000) // 1000 for e in sim.out}
    have_any = {((t - _F15_T0) // 1000) for t, s in _F15_REC if s != "PPS"}
    for k in range(60):
        if k in done:
            o.append(RECT(X(k + 0.15), 76, cw * 0.7, 12, 1, GSOFT, GRN, 0.8))
        elif k in have_any:
            o.append(RECT(X(k + 0.15), 76, cw * 0.7, 12, 1, ASOFT, ALI, 0.8))
    # 状態機械
    o.append(T(x0 - 8, 112, "状態機械", "end", 10, INK, True))
    segs, cur, t0 = [], None, 0.0
    for tm, st in sim.hist:
        t = (tm - _F15_T0) / 1000.0
        if t < 0 or t > tend:
            continue
        if st != cur:
            if cur is not None:
                segs.append((t0, t, cur))
            cur, t0 = st, t
    segs.append((t0, tend, cur))
    for a, b, st in segs:
        o.append(RECT(X(a), 102, max(0.6, X(b) - X(a)), 16, 0, soft(_F15_SC[st]), _F15_SC[st], 0.9))
        if X(b) - X(a) > tw(_F15_SN[st], 9) + 4:
            o.append(T((X(a) + X(b)) / 2, 114, _F15_SN[st], "middle", 9, _F15_SC[st], True))
    # 判断
    o.append(T(x0 - 8, 140, "判断", "end", 10, INK, True))
    syms = {0: "●", 1: "状", 2: "衛", 3: "H", 4: "飛"}
    for e in sim.out:
        k = (e["t"] - 34070000) // 1000
        w = e["why"]
        o.append(T(X(k + 0.5), 144, syms[w], "middle", 8 if w == 0 else 8.5, _F15_WC[w], True))
    for v in range(0, 61, 10):
        o.append(W(X(v), 152, X(v), 156, c=MUT, lw=1))
        o.append(T(X(v), 168, "%d" % v, "middle", 9.5, MUT))
    o.append(T((x0 + x1) / 2, 183, "記録の時間 [s]（0 が 09:27:50 の秒）", "middle", 10, MUT))
    # 誤りの一覧
    yl = 206
    for i, (key, s, txt) in enumerate(_F15_FAULTS):
        col, row = i // 5, i % 5
        o.append(T(14 + col * 236, yl + row * 15, "%d. %d s: %s" % (i + 1, s, txt), "start", 9.5, INK))
    # 結果の表
    tx = 486
    o.append(T(tx, yl - 4, "", "start", 9.5, INK))
    hdr = [(tx, "数え", "start"), (tx + 116, "期待", "end"), (tx + 160, "C", "end"), (tx + 196, "", "end")]
    for x, h, a in hdr:
        o.append(T(x, yl, h, a, 9.5, MUT, True))
    vals = [("n_bad", sim.n_bad, _F15_CRES["n_bad"]), ("n_part", sim.n_part, _F15_CRES["n_part"]),
            ("n_gap", sim.n_gap, _F15_CRES["n_gap"]), ("n_nolabel", sim.n_nolabel, _F15_CRES["n_nolabel"]),
            ("1PPS の名前", len(sim.labels), _F15_CRES["labels"]), ("渡した組", len(sim.out), _F15_CRES["epochs"])]
    for i, (nm, a, b) in enumerate(vals):
        y = yl + 15 * (i + 1)
        o.append(T(tx, y, nm, "start", 9.5, INK, False, nm.startswith("n_")))
        o.append(T(tx + 116, y, "%d" % a, "end", 9.5, INK, True))
        o.append(T(tx + 160, y, "%d" % b, "end", 9.5, INK, True))
        o.append(T(tx + 196, y, "一致" if a == b else "違う", "end", 9.5, GRN if a == b else ALI, True))
    o.append(T(14, yl + 118, "組: 緑はそろって渡した組、赤はそろわずに捨てた組。判断の記号は 3 節の図と同じ（● 使う・状・衛・H・飛）。", "start", 9.5, MUT))
    o.append(LEGEND(14, yl + 136, [(_F15_SC[i], _F15_SN[i]) for i in range(7)], 9.5, 10))
    return SVG(700, yl + 146, o, "誤りを混ぜた 60 s の記録（12 章の例の文、9600 bit/s・1 Hz）を流した結果。期待の値は同じ手順の Python、C は本文のコードをホストで動かした値。")


F["e15_replay"] = _f15_replay_fig()
