# -*- coding: utf-8 -*-
# 24 章 総合演習 — GNSS ロガーを設計する の図
# 図の数値は、下のモデル（前の章の例の値と式をそのまま使ったもの）で計算する。w24.js の _w24_* と同じ計算で、
# 4 節の電力のモデルは、ホストで動かした C（15 章の部品 + この章のロガーのコード）の模擬と、起きた回ごとに一致することを確かめてある。
import numpy as _f24_np

_F24_D = math.pi / 180
_F24_C = 299792458.0
_F24_KB = 1.380649e-23
_F24_L1 = 1575.42e6
_F24_LAM = _F24_C / _F24_L1                 # L1 の波長 19.03 cm
_F24_TOK = GNSS_TOKYO
_F24_SYS4 = ("GPS", "GLONASS", "Galileo", "BeiDou")
_F24_SYSN = {"GPS": "GPS", "GLONASS": "GLONASS", "Galileo": "Galileo", "BeiDou": "BeiDou", "QZSS": "みちびき"}


def _f24_f(v, d=1):
    """負の数の − を全角の負号にした数。"""
    s = ("%%.%df" % d) % v
    if s.lstrip("-").strip("0.") == "":
        s = s.lstrip("-")
    return s.replace("-", "−")


# =====================================================================
# 2・3 節: C/N0 の見積もり（3 章 1・3 節の回線計算、9 章 1 節のフリスの式、11 章の線の損失、22 章 2 節の離調）
# =====================================================================
def _f24_prx(el):
    """利得 0 dBi のアンテナで受ける電力 [dBm]（3 章 1 節: EIRP 26.4 dBW、大気 0.5 dB、軌道の半径 26 560 km）。"""
    R, a = 6371e3, 26560e3
    r = math.sqrt(a * a - (R * math.cos(el * _F24_D)) ** 2) - R * math.sin(el * _F24_D)
    return 56.4 - 20 * math.log10(4 * math.pi * r / _F24_LAM) - 0.5


def _f24_ga(el):
    """3 章 3 節の例のアンテナ（パッチ）の右旋の利得 [dBi]: 真上 +3、仰角 30° で −1、5° で −5。"""
    return 3.0 - 8.0 * ((90.0 - el) / 85.0) ** 2


_F24_LNA = (18.0, 1.0)                      # LNA（9 章の例: 利得 18 dB・雑音指数 1 dB）
_F24_SAW = (-1.5, 1.5)                      # SAW フィルタ（挿入損失 1.5 dB）
_F24_RX = [(20.0, 3.0), (68.5, 3.0)]        # 受信用のチップの増幅器 2 つ（9 章 1 節で 3 dB と仮に置いた）
_F24_ACT = [(18.0, 1.0), (-1.5, 1.5), (11.5, 2.0)]   # 9 章 5 節の例のアクティブアンテナ（28 dB）
_F24_LDB = 0.07                             # LNA の前の線の損失 [dB/cm]（11 章 2 節の例の線）


def _f24_stages(ant="patch", lna=True, saw="after", line_cm=2.0, cable_m=3.0, cab_db=0.5):
    """段の並び [(名前, 利得 dB, 雑音指数 dB)]。ant: patch・chip（パッシブ）・active（外付けのアクティブアンテナ）。"""
    st = []
    if ant == "active":
        st += [("アンテナの LNA", 18.0, 1.0), ("アンテナの SAW", -1.5, 1.5), ("アンテナの増幅器", 11.5, 2.0)]
        L = cab_db * cable_m
        if L > 0:
            st.append(("ケーブル", -L, L))
    else:
        if line_cm > 0:
            L = _F24_LDB * line_cm
            st.append(("線", -L, L))
        if saw == "before":
            st.append(("SAW", -1.5, 1.5))
        if lna:
            st.append(("LNA", 18.0, 1.0))
        if saw == "after":
            st.append(("SAW", -1.5, 1.5))
    st += [("チップの増幅器 1", 20.0, 3.0), ("チップの増幅器 2", 68.5, 3.0)]
    return st


def _f24_tsys(st, tant=100.0):
    """フリスの式（9 章 1 節）: アンテナの端子に換算したシステム雑音温度 [K] と、段ごとの寄与 [K]。"""
    g, out = 1.0, []
    for nm, G, NF in st:
        out.append((nm, (10 ** (NF / 10) - 1) * 290.0 / g))
        g *= 10 ** (G / 10)
    return tant + sum(c for _, c in out), out


def _f24_n0(tsys):
    return 10 * math.log10(_F24_KB * tsys) + 30


# 22 章 2 節: 8 章のパッチのモデル（2 つのモードの共振回路、Q = 100）と、離調の傾向のモデル（ξ0 = 1 %、h_e = 3 mm）
_F24_Q = 100.0


def _f24_patch(f, shift):
    f0 = _F24_L1 + shift; Z0 = 50.0; Q = _F24_Q
    K = lambda fk: 1 / (1 + 1j * Q * (f / fk - fk / f))
    ku, kv = K(f0 * (1 - 1 / (2 * Q))), K(f0 * (1 + 1 / (2 * Q)))
    Z = Z0 * (ku + kv); G = (Z - Z0) / (Z + Z0)
    I = 1 / (Z0 + Z); Vu, Vv = I * Z0 * ku, I * Z0 * kv
    return G, abs(Vu - 1j * Vv) ** 2 / 2, abs(Vu + 1j * Vv) ** 2 / 2


def _f24_l1(shift):
    """共振が shift [Hz] ずれたときの L1 での S11 [dB]・軸比 [dB]・右旋の損失 [dB]。"""
    G, PR, PL = _f24_patch(_F24_L1, shift)
    aR, aL = math.sqrt(PR), math.sqrt(PL)
    return dict(s11=20 * math.log10(max(abs(G), 1e-6)), ar=20 * math.log10((aR + aL) / max(abs(aR - aL), 1e-12)),
                rhcp=-10 * math.log10(PR / 0.25))


def _f24_df(ep, hp, dp, xi0=0.010, he=3.0):
    """樹脂（比誘電率 ep・厚さ hp・隙間 dp [mm]）による共振のずれ [Hz]（22 章 2 節の近似）。"""
    return -(ep - 1) * xi0 * math.exp(-dp / he) * (1 - math.exp(-hp / he)) * _F24_L1 / 2


_F24_DF = _f24_df(2.8, 2.0, 1.0)            # 例の筐体（ABS 2 mm・隙間 1 mm）: −4.94 MHz
_F24_PRE = 5.0e6                            # 筐体に入れたときに合うよう、共振を 5 MHz 上げたアンテナ（例）


def _f24_case_loss(pretune=True):
    return _f24_l1(_F24_DF + (_F24_PRE if pretune else 0.0))["rhcp"]


def _f24_cn0(el, ant="patch", lna=True, saw="after", line_cm=2.0, case=True, pretune=True, att=0.0, cable_m=3.0):
    """仰角 el [°] の衛星の C/N0 [dB-Hz]。チップ（直線偏波）は右旋を受けて 3 dB 損する（8 章 2 節）。"""
    ts, _ = _f24_tsys(_f24_stages(ant, lna, saw, line_cm, cable_m))
    g = _f24_ga(el) - (3.01 if ant == "chip" else 0.0)
    loss = (_f24_case_loss(pretune) if (case and ant != "active") else 0.0) + att
    return _f24_prx(el) + g - loss - _f24_n0(ts)


_F24_SPEC_CN0 = 41.0                        # 仕様: 仰角 30° で 41 dB-Hz（捕捉の目安 35 dB-Hz + 木の葉などの 6 dB）
_F24_ACQ, _F24_TRK = 35.0, 25.0             # 捕捉と追尾の目安（3 章 6 節・20 章 4 節の代表値）


# =====================================================================
# 4 節: ロガーの 1 日の電力（13 章 5 節の平均の電流を、15 章 5 節の手順と例の 1 日で数え直したもの）
# =====================================================================
_F24_P = dict(Tu=60000, TU_MAX=1800000, WAIT_FIX=45000, STOP=100, POLL=10, T_HOT=2000, T_WARM=30000, T_EPH=7200000,
              UPN=3, RMC=147, I_ACQ=35.0, I_TRK=25.0, I_BK=0.015, I_LNA=3.0, I_MCU=3.0, I_SLP=0.002, I_AON=0.006,
              backoff=True, Qb=2000.0, SD=0.02)
_F24_H, _F24_M = 3600000, 60000
_F24_OUT = [(7 * _F24_H + 30 * _F24_M, 9 * _F24_H + 30 * _F24_M), (12 * _F24_H + 15 * _F24_M, 13 * _F24_H + 15 * _F24_M),
            (16 * _F24_H + 45 * _F24_M, 21 * _F24_H + 45 * _F24_M)]      # 例の 1 日: 屋外 8 時間


def _f24_outdoor(t, out):
    d = t % 86400000
    return any(a <= d < b for a, b in out)


def _f24_cp(t, poll):
    return -(-t // poll) * poll


def _f24_sim(days=2, p=None, out=None):
    """起きた回の並び [(電源を入れた時刻, 切った時刻, "hot"/"warm", 記録したか, 位置が出た組の時刻)]（時刻は ms）。"""
    p = p or _F24_P
    out = _F24_OUT if out is None else out
    t_wake, iv, t_eph, wakes = 0, p["Tu"], None, []
    while t_wake < days * 86400000:
        t_on = _f24_cp(t_wake, p["POLL"])
        warm = (t_eph is None) or (t_on - t_eph >= p["T_EPH"])
        ttff = p["T_WARM"] if warm else p["T_HOT"]
        k, nfix, t_fix, t_rec = 1, 0, None, None
        while 1000 * k <= p["WAIT_FIX"] + 1000:
            E = t_on + 1000 * k
            if E - t_on >= ttff and _f24_outdoor(E, out):
                nfix += 1
                t_fix = E if t_fix is None else t_fix
                if nfix >= p["UPN"]:
                    t_done = _f24_cp(E + p["RMC"], p["POLL"])
                    if t_done - t_on <= p["WAIT_FIX"]:
                        t_rec = t_done
                    break
            else:
                nfix = 0
            k += 1
        if t_rec is not None:
            t_off = _f24_cp(t_rec + p["STOP"], p["POLL"])
            if warm:
                t_eph = t_fix
        else:
            t_off = _f24_cp(t_on + p["WAIT_FIX"] + p["POLL"] + p["STOP"], p["POLL"])
        ok = t_rec is not None
        wakes.append((t_on, t_off, "warm" if warm else "hot", ok, t_fix if ok else None))
        iv = p["Tu"] if ok else (min(iv * 2, p["TU_MAX"]) if p["backoff"] else p["Tu"])
        t_wake = max(t_wake + iv, t_off)
    return wakes


def _f24_charge(wakes, t0, t1, p=None):
    """[t0, t1) の電荷 [mAh] の内訳（捕捉・追尾・LNA・マイコン・バックアップ・止まったマイコン・いつも流れる分）。"""
    p = p or _F24_P
    Q = dict(acq=0.0, trk=0.0, lna=0.0, mcu=0.0, bk=0.0, slp=0.0, aon=0.0)
    on_total = 0
    for a, b, kind, ok, tf in wakes:
        a2, b2 = max(a, t0), min(b, t1)
        if b2 <= a2:
            continue
        on = b2 - a2; on_total += on
        if tf is not None:
            fx = min(max(tf, a2), b2)
            Q["acq"] += p["I_ACQ"] * (fx - a2); Q["trk"] += p["I_TRK"] * (b2 - fx)
        else:
            Q["acq"] += p["I_ACQ"] * on
        Q["lna"] += p["I_LNA"] * on; Q["mcu"] += p["I_MCU"] * on
    off = (t1 - t0) - on_total
    Q["bk"] = p["I_BK"] * off; Q["slp"] = p["I_SLP"] * off; Q["aon"] = p["I_AON"] * (t1 - t0)
    return {k: v / 3.6e6 for k, v in Q.items()}


def _f24_day(p=None, out=None):
    """2 日目（前の日から続く状態）の電荷の内訳 [mAh]・起きた回・電池の日数。"""
    p = p or _F24_P
    w = _f24_sim(3, p, out)
    Q = _f24_charge(w, 86400000, 2 * 86400000, p)
    sd = p["Qb"] * p["SD"] / 30.0            # 自己放電（1 か月に 2 %）を 1 日あたりの電荷に直す [mAh]
    tot = sum(Q.values())
    day = [x for x in w if 86400000 <= x[0] < 2 * 86400000]
    return dict(Q=Q, tot=tot, sd=sd, days=p["Qb"] / (tot + sd), wakes=day, all=w)


_F24_DAY = _f24_day()                        # 例の 1 日: 42.67 mAh + 自己放電 1.33 mAh → 45.4 日


# =====================================================================
# 5 節: 衛星系の数と精度（7 章 6 節の誤差の予算 × DOP、22 章 1 節の通り）
# =====================================================================
_F24_UERE = math.sqrt(1.5 ** 2 + 3.5 ** 2 + 0.4 ** 2 + 1.0 ** 2 + 0.5 ** 2)   # 7 章 6 節: 3.99 m
_F24_UERE_SBAS = math.sqrt(0.5 ** 2 + 0.7 ** 2 + 0.4 ** 2 + 1.0 ** 2 + 0.5 ** 2)   # 16 章 6 節: 1.47 m


def _f24_vis(systems, t=0.0, mask=0.0):
    out = []
    for s in gnss_const():
        if s["sys"] not in systems:
            continue
        el, az, d = elaz(*_F24_TOK, sat_ecef(s, t))
        if el > mask:
            out.append((s["nm"], el, az, s["sys"]))
    return sorted(out, key=lambda q: -q[1])


def _f24_G(sats):
    us = []
    for q in sats:
        if q[3] not in us:
            us.append(q[3])
    rows = []
    for nm, el, az, sy in sats:
        e, a = el * _F24_D, az * _F24_D
        r = [-math.cos(e) * math.sin(a), -math.cos(e) * math.cos(a), -math.sin(e)] + [0.0] * len(us)
        r[3 + us.index(sy)] = 1.0
        rows.append(r)
    return _f24_np.array(rows), len(us)


def _f24_ell(C2):
    a, b, c = C2[0][0], C2[0][1], C2[1][1]
    m = (a + c) / 2
    r = math.sqrt(((a - c) / 2) ** 2 + b * b)
    return math.sqrt(m + r), math.sqrt(max(m - r, 0.0))


def _f24_pin(R, s1, s2, n=2000):
    ph = _f24_np.linspace(0, 2 * math.pi, n, endpoint=False)
    q = _f24_np.cos(ph) ** 2 / s1 ** 2 + _f24_np.sin(ph) ** 2 / s2 ** 2
    return float(_f24_np.mean((1 - _f24_np.exp(-R * R * q / 2)) / q) / (s1 * s2))


def _f24_rad(p, s1, s2):
    lo, hi = 0.0, 10 * (s1 + s2)
    for _ in range(60):
        m = (lo + hi) / 2
        if _f24_pin(m, s1, s2) < p:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def _f24_canyon(az, als=45.0, h=24.0, w=18.0):
    """22 章 1 節の通り（向き 45°・幅 18 m・高さ 24 m）で遮る仰角 [°]。"""
    return math.degrees(math.atan(2 * h / w * abs(math.sin((az - als) * _F24_D))))


def _f24_acc(systems):
    """24 時間（10 分おき・仰角マスク 10°）の R95 の中央値の倍率（UERE を掛けると [m]）と、通りの中で解ける時間の割合。"""
    rs, ok = [], 0
    for k in range(0, 24 * 6 + 1):
        vis = _f24_vis(systems, k * 600.0, 10.0)
        Gm, nu = _f24_G(vis)
        H = _f24_np.linalg.inv(Gm.T @ Gm)
        s1, s2 = _f24_ell(H[:2, :2])
        rs.append(_f24_rad(0.95, s1, s2))
        st = [q for q in _f24_vis(systems, k * 600.0) if q[1] > _f24_canyon(q[2])]
        if st:
            Gs, ns = _f24_G(st)
            ok += len(st) >= 3 + ns
    return float(_f24_np.median(rs)), ok / 145.0


_F24_SETS = [("GPS",), ("GPS", "GLONASS"), ("GPS", "GLONASS", "Galileo"), _F24_SYS4]
_F24_ACC = [_f24_acc(s) for s in _F24_SETS]   # GPS 8.21 m・0 %、+GLONASS 5.23 m・50 %、+Galileo 4.18 m・89 %、4 つ 3.61 m・99 %


# =====================================================================
# 5 節: 1 回に出す文のバイトの数（10 章 4 節と同じ文の作り方）
# =====================================================================
_F24_SATS = {"GP": [[5, 45, 123, 47], [13, 62, 45, 49], [15, 30, 210, 44], [18, 15, 300, 38], [20, 72, 280, 50], [23, 25, 150, 42], [24, 40, 330, 45], [29, 10, 60, 36], [30, 5, 250, None], [31, 2, 100, None]],
             "GL": [[66, 35, 20, 43], [67, 55, 110, 46], [76, 20, 250, 40], [77, 48, 300, 44], [82, 8, 180, None], [83, 3, 140, None]],
             "GA": [[2, 40, 70, 45], [7, 65, 200, 48], [8, 22, 320, 41], [13, 30, 140, 43], [26, 50, 260, 46], [30, 12, 30, 37], [33, 4, 190, None]],
             "GB": [[6, 55, 190, 42], [9, 62, 210, 44], [16, 48, 170, 43], [19, 33, 60, 45], [20, 70, 320, 47], [29, 25, 280, 41], [35, 15, 110, 38], [44, 6, 40, None]]}
_F24_KINDS = ["GGA", "RMC", "GSA", "GSV", "VTG", "GLL"]


def _f24_nmea(nsys, kinds=_F24_KINDS):
    """10 章 4 節の例の文（衛星系 nsys 個）。[(種類, 文)]。"""
    talk = ["GP", "GL", "GA", "GB"][:nsys]
    used = [[s[0] for s in _F24_SATS[t] if s[3] is not None] for t in talk]
    nused = sum(len(u) for u in used)
    bodies = []
    for k in kinds:
        if k == "GGA":
            bodies.append((k, "GNGGA,092750.00,3540.86000,N,13946.02000,E,1,%02d,0.80,3.3,M,36.7,M,," % nused))
        elif k == "RMC":
            bodies.append((k, "GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"))
        elif k == "GSA":
            for u in used:
                f = ["%02d" % x for x in u] + [""] * (12 - len(u))
                bodies.append((k, "GNGSA,A,3," + ",".join(f) + ",1.50,0.80,1.27"))
        elif k == "GSV":
            for t in talk:
                ss = _F24_SATS[t]; nm = (len(ss) + 3) // 4
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


def _f24_nbytes(nsys, kinds=_F24_KINDS):
    return sum(len(s) for _, s in _f24_nmea(nsys, kinds))


# =====================================================================
# 6 節: 充電の回路の揺れ（10 章 2 節の例のモデル）と、LC フィルタ（21 章 3 節）
# =====================================================================
def _f24_psrr(f, a0db, fp):
    a0 = 10 ** (a0db / 20); x = f / fp; d = 1 + x * x
    return 20 * math.log10(math.hypot(1 + a0 / d, -a0 * x / d))


_F24_FSW, _F24_VR = 2.0e6, 20.0             # 充電の回路: スイッチング 2 MHz・出力の揺れ 20 mVpp（10 章 2 節の例と同じ値）
_F24_ATT = _f24_psrr(_F24_FSW, 40.0, 20e3) + _f24_psrr(_F24_FSW, 60.0, 10e3)   # 中の電源の回路 + LDO: 17.2 dB
_F24_Q0 = (_F24_VR * 10 ** (-_F24_ATT / 20) / 1.0) ** 2   # N_p/N_0 = 7.60（21 章 3 節の q0）
_F24_LP, _F24_CP = 2.2e-6, 10e-6            # 21 章 3 節の例の LC フィルタ（Q = 1 にダンピング）
_F24_FLC = 1 / (2 * math.pi * math.sqrt(_F24_LP * _F24_CP))


def _f24_af(f, Q=1.0):
    x = f / _F24_FLC
    return -20 * math.log10(abs(1 / complex(1 - x * x, x / Q)))


def _f24_drop(af):
    return 10 * math.log10(1 + _F24_Q0 * 10 ** (-af / 10))


# =====================================================================
# 描く部品
# =====================================================================
def _f24_chips(x, y, labels, c=SIG, sz=9, gap=4):
    """札を横に並べる。返り値 (svg, 右端の x)。"""
    o, xx = [], x
    for lab in labels:
        s, w = CHIP(xx, y, lab, c, sz, 4)
        o.append(s); xx += w + gap
    return "".join(o), xx


def _f24_lines(o, x, y, lines, sz=9.5, c=MUT, lh=13, a="start", b=False, halo=False):
    for i, l in enumerate(lines):
        o.append(T(x, y + i * lh, l, a, sz, c, b, halo=halo))


# =====================================================================
# 1 節: 設計の流れ
# =====================================================================
def _f24_flow_fig():
    o = []
    steps = [("1 節", "仕様を決める", PUR, ["23"], ["使い方から仕様の表", "（10 の項目と条件）"]),
             ("2 節", "回路と部品", SIG, ["3", "8", "9", "10", "13"], ["C/N0（部品の段）", "部品ごとの電流"]),
             ("3 節", "基板と筐体", SIG, ["11", "21", "22"], ["線の損失・離調", "→ C/N0、大きさ"]),
             ("4 節", "ファームウェア", SIG, ["12", "13", "14", "15"], ["起きてから記録まで", "→ 1 日の電荷・電池"]),
             ("5 節", "精度を上げる", SIG, ["7", "16", "17", "18", "19"], ["R95・通りで解ける", "割合・文の長さ"]),
             ("6 節", "評価して仕上げる", GRN, ["20", "21", "23"], ["充電中の C/N0", "仕様の表で判定"])]
    o.append(T(14, 18, "ロガーの設計の流れと、各段で使う章（札の数字は章）", "start", 11.5, INK, True))
    bw, gap, x0, y0 = 104, 12, 14, 64
    xs = [x0 + k * (bw + gap) + bw / 2 for k in range(6)]
    # 戻る矢印（上）
    o.append(CARR(xs[5], y0 - 2, xs[1], y0 - 2, -0.075, ALI, 1.4, 7, "5 3"))
    o.append(T((xs[1] + xs[5]) / 2, y0 - 26, "満たさない行があれば、その値を決めた段に戻って直す", "middle", 9.5, ALI, True, halo=True))
    for k, (sec, nm, c, chs, outs) in enumerate(steps):
        x = x0 + k * (bw + gap)
        o.append(RECT(x, y0, bw, 52, 7, soft(c), c, 1.5))
        o.append(T(x + bw / 2, y0 + 20, sec, "middle", 10, c, True))
        o.append(T(x + bw / 2, y0 + 39, nm, "middle", 10.5, INK, True))
        if k < 5:
            o.append(ARR(x + bw + 1, y0 + 26, x + bw + gap - 1, y0 + 26, c=MUT, lw=1.4, head=6))
        rows = [chs[:3], chs[3:]] if len(chs) > 3 else [chs]
        for r, row in enumerate(rows):
            wsum = sum(tw(sv, 9) + 8 for sv in row) + 4 * (len(row) - 1)
            sv, _ = _f24_chips(x + (bw - wsum) / 2, y0 + 74 + r * 20, row, c, 9)
            o.append(sv)
        _f24_lines(o, x + bw / 2, y0 + 128, outs, 9, INK, 13, "middle")
    # 仕様の値（1 節）と設計の値（2〜5 節）が 6 節の判定に集まる
    yg, yp, ytop = y0 + 166, y0 + 190, y0 + 148
    for x in xs[1:5]:
        o.append(W(x, ytop, x, yg, c=GLD, lw=1.4))
    o.append(W(xs[1], yg, xs[5] - 10, yg, c=GLD, lw=1.4))
    o.append(ARR(xs[5] - 10, yg, xs[5] - 10, ytop, c=GLD, lw=1.5, head=6))
    o.append(T((xs[1] + xs[2]) / 2, yg + 14, "設計の値（2〜5 節で見積もる）", "middle", 9.5, GLD, True))
    o.append(W(xs[0], ytop, xs[0], yp, c=PUR, lw=1.4))
    o.append(W(xs[0], yp, xs[5] + 10, yp, c=PUR, lw=1.4))
    o.append(ARR(xs[5] + 10, yp, xs[5] + 10, ytop, c=PUR, lw=1.5, head=6))
    o.append(T((xs[3] + xs[4]) / 2, yp + 14, "仕様の値と条件（1 節の表）", "middle", 9.5, PUR, True))
    return SVG(700, y0 + 214, o, "設計の流れ。各段で前の章の道具を使って値を見積もり、最後に仕様の表と比べて判定する。")


F["e24_flow"] = _f24_flow_fig()
