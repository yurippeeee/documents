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


# =====================================================================
# 1 節: 例の 1 日と、仕様の条件
# =====================================================================
def _f24_maskring(cx, cy, R, mf, n=144, c=MUT):
    """スカイプロットの上の、遮る範囲（地平線と、遮る仰角の線の間）。"""
    outer = [skyxy(cx, cy, R, 0.0, 360.0 * i / n) for i in range(n + 1)]
    inner = [skyxy(cx, cy, R, mf(360.0 * i / n), 360.0 * i / n) for i in range(n, -1, -1)]
    return PL(outer + inner, c=c, lw=0.8, fill=soft(c))


def _f24_use_fig():
    o = []
    o.append(T(14, 18, "(a) 例の 1 日（屋外 8 時間・屋内 16 時間）", "start", 11, INK, True))
    p = Plot(60, 46, 620, 26, (0, 24), (0, 1))
    o.append(RECT(p.x, p.y, p.w, p.h, 3, soft(MUT), MUT, 1.0))
    names = ["家", "職場", "職場", "家"]
    ins = [(0, 7.5), (9.5, 12.25), (13.25, 16.75), (21.75, 24)]
    for (a, b), nm in zip(ins, names):
        o.append(T(p.X((a + b) / 2), p.y + 17, nm + "（屋内）" if b - a > 2.5 else nm, "middle", 9.5, MUT, True))
    for (a, b), nm in zip(_F24_OUT, ["移動", "昼", "外回り・帰り道"]):
        a, b = a / 3.6e6, b / 3.6e6
        o.append(RECT(p.X(a), p.y, p.X(b) - p.X(a), p.h, 2, soft(GRN), GRN, 1.3))
        o.append(T(p.X((a + b) / 2), p.y + 17, nm, "middle", 9.5, GRN, True))
        for k in range(int(round((b - a) * 60 / 10))):
            xx = p.X(a + (k + 0.5) * 10 / 60)
            o.append(W(xx, p.y - 7, xx, p.y - 2, c=GRN, lw=1.0))
    o.append(T(p.X(24), p.y - 10, "緑の刻み: 記録（実際は 60 s ごと。図は 10 分ごとに描いた）", "end", 9, GRN))
    for h in range(0, 25, 3):
        o.append(W(p.X(h), p.y + p.h, p.X(h), p.y + p.h + 4, c=MUT, lw=1))
        o.append(T(p.X(h), p.y + p.h + 15, "%d 時" % h, "middle", 9, MUT))
    # (b) 3 つの条件
    o.append(T(14, 118, "(b) 仕様の条件になる 3 つの場面（東京・4 つの衛星系・時刻 0）", "start", 11, INK, True))
    sats_all = _f24_vis(_F24_SYS4)
    scenes = [("開けた空", lambda az: 10.0, GRN, ["精度・TTFF・受信の強さ", "・充電中の C/N0（1〜5 行）"]),
              ("通り（幅 18 m・高さ 24 m）", _f24_canyon, GLD, ["位置が出る時間の割合", "（2 行。22 章 1 節）"]),
              ("屋内", None, ALI, ["位置は出なくてよい。電池を", "むだにしない（9 行）"])]
    for k, (nm, mf, c, rows) in enumerate(scenes):
        cx, cy, R = 120 + k * 230, 228, 62
        o.append(T(cx, 140, nm, "middle", 10.5, c, True))
        if mf is not None:
            o.append(sky(cx, cy, R, [], labels=False, rings=(30, 60), dirs=True))
            o.append(_f24_maskring(cx, cy, R, mf, c=MUT if k == 0 else GLD))
            for q in sats_all:
                x, y = skyxy(cx, cy, R, q[1], q[2])
                o.append(D(x, y, GNSS_SYSC[q[3]] if q[1] > mf(q[2]) else FNT, 3.2))
            nv = sum(1 for q in sats_all if q[1] > mf(q[2]))
            o.append(T(cx, cy + R + 30, "直接届く衛星 %d 機" % nv, "middle", 9.5, c, True))
        else:
            o.append(CIRC(cx, cy, R, c=MUT, lw=1.3, fill=soft(ALI)))
            for q in sats_all:
                x, y = skyxy(cx, cy, R, q[1], q[2])
                o.append(CIRC(x, y, 3.0, c=FNT, lw=1.0))
            o.append(T(cx, cy - 4, "屋根と壁で", "middle", 9.5, ALI, True, halo=True))
            o.append(T(cx, cy + 10, "10〜30 dB 弱まる", "middle", 9.5, ALI, True, halo=True))
            o.append(T(cx, cy + R + 30, "（3 章 3 節の代表値）", "middle", 9.5, ALI))
        _f24_lines(o, cx, cy + R + 48, rows, 9.5, INK, 13, "middle")
    o.append(LEGEND(160, 390, [(SIG, "GPS"), (PUR, "GLONASS"), (GRN, "Galileo"), (GLD, "BeiDou"), (MUT, "遮る範囲")], 9.5))
    return SVG(700, 400, o, "例の機器の使い方（例の値）。(b) の空は 1 章の近似の配置、遮る範囲は仰角マスク 10°（開けた空）と 22 章 1 節の通りのモデル。")


F["e24_use"] = _f24_use_fig()


# =====================================================================
# 2 節: 回路の構成
# =====================================================================
def _f24_tag(x, y, ch, c=MUT):
    """章の札（右上などに置く）。"""
    s, w = CHIP(x, y, ch, c, 8.5, 3)
    return s


def _f24_block_fig():
    o = []
    o.append(T(14, 18, "ロガーの回路（値は例の値。札の数字は、決めるのに使った章）", "start", 11, INK, True))
    yc = 86
    # アンテナ
    o.append(RECT(22, yc - 24, 48, 48, 3, soft(GLD), GLD, 1.4))
    o.append(RECT(30, yc - 16, 32, 32, 2, soft(GLD), GLD, 1.2))
    o.append(D(52, yc - 4, GLD, 2.6))
    _f24_lines(o, 46, yc + 42, ["パッチ 25 mm 角", "右旋・パッシブ"], 9, INK, 12, "middle")
    o.append(_f24_tag(30, yc - 32, "8"))
    o.append(_f24_tag(46, yc - 32, "22"))
    o.append(ARR(72, yc, 112, yc, c=SIG, lw=1.6, head=6))
    o.append(T(92, yc - 8, "50 Ω", "middle", 9, SIG, True))
    o.append(T(92, yc + 14, "2 cm", "middle", 9, SIG))
    o.append(_f24_tag(84, yc + 30, "11"))
    # LNA（三角）と SAW
    o.append(PL([(114, yc - 20), (114, yc + 20), (150, yc)], c=SIG, lw=1.5, fill=soft(SIG)))
    o.append(T(124, yc + 4, "LNA", "start", 9, SIG, True))
    _f24_lines(o, 132, yc + 36, ["1 dB", "18 dB"], 9, INK, 12, "middle")
    o.append(_f24_tag(124, yc - 26, "9"))
    o.append(ARR(152, yc, 170, yc, c=SIG, lw=1.6, head=6))
    o.append(RECT(172, yc - 16, 52, 32, 5, soft(SIG), SIG, 1.4))
    o.append(T(198, yc + 4, "SAW", "middle", 10, SIG, True))
    _f24_lines(o, 198, yc + 32, ["1.5 dB", "1559〜", "1606 MHz"], 9, INK, 12, "middle")
    o.append(_f24_tag(190, yc - 24, "9"))
    o.append(ARR(226, yc, 256, yc, c=SIG, lw=1.6, head=6))
    # モジュール
    mx, my, mw, mh = 258, 42, 140, 150
    o.append(RECT(mx, my, mw, mh, 8, PAN, SIG, 1.6))
    o.append(T(mx + mw / 2, my + 20, "GNSS モジュール", "middle", 11, INK, True))
    _f24_lines(o, mx + mw / 2, my + 38, ["L1・4 つの衛星系", "捕捉 35 mA・追尾 25 mA", "バックアップ 15 µA"], 9, MUT, 13, "middle")
    o.append(_f24_tag(mx + mw - 18, my - 6, "10"))
    for yy, lab in ((my + 112, "電源"), (my + 134, "バックアップ")):
        o.append(T(mx + 5, yy + 3.5, lab, "start", 8.5, MUT))
    for yy, lab in ((my + 90, "TXD・RXD"), (my + 116, "1PPS（使わない）"), (my + 138, "リセット")):
        o.append(T(mx + mw - 5, yy + 3.5, lab, "end", 8.5, MUT))
    # UART・1PPS・リセット → マイコン
    ux = 478
    o.append(DARR(mx + mw, my + 90, ux, my + 90, c=PUR, lw=1.4, head=5))
    o.append(T((mx + mw + ux) / 2, my + 84, "UART 9600 bit/s", "middle", 9, PUR, True))
    o.append(T((mx + mw + ux) / 2, my + 104, "GGA・RMC だけ", "middle", 9, PUR))
    o.append(_f24_tag(430, my + 66, "13"))
    o.append(ARR(ux, my + 138, mx + mw, my + 138, c=PUR, lw=1.3, head=5))
    o.append(T((mx + mw + ux) / 2, my + 151, "オープンドレイン", "middle", 8.5, PUR))
    # マイコンとフラッシュ
    o.append(RECT(ux, my, 104, 150, 8, PAN, PUR, 1.6))
    o.append(T(ux + 52, my + 20, "マイコン", "middle", 11, INK, True))
    _f24_lines(o, ux + 52, my + 38, ["RTC で起きる", "動作 3 mA", "停止 2 µA"], 9, MUT, 13, "middle")
    o.append(_f24_tag(ux + 84, my - 6, "15"))
    o.append(DARR(ux + 104, my + 30, 602, my + 30, c=PUR, lw=1.3, head=5))
    o.append(T(592, my + 24, "SPI", "end", 9, PUR, True))
    o.append(RECT(604, my + 8, 86, 50, 6, PAN, PUR, 1.4))
    _f24_lines(o, 647, my + 29, ["フラッシュ", "8 MB"], 9.5, INK, 14, "middle", True)
    o.append(T(647, my + 76, "1 件 32 B（4 節）", "middle", 9, MUT))
    # 電源の木
    yp = 268
    o.append(T(14, 224, "電源", "start", 10.5, INK, True))
    o.append(RECT(14, yp - 20, 62, 40, 6, PAN, MUT, 1.3))
    _f24_lines(o, 45, yp - 3, ["USB", "5 V"], 9.5, INK, 13, "middle", True)
    o.append(ARR(78, yp, 102, yp, c=MUT, lw=1.5, head=6))
    o.append(RECT(104, yp - 20, 110, 40, 6, soft(ALI), ALI, 1.4))
    _f24_lines(o, 159, yp - 3, ["充電の回路", "スイッチング 2 MHz"], 9, INK, 13, "middle", True)
    o.append(_f24_tag(196, yp - 26, "20"))
    o.append(ARR(216, yp, 240, yp, c=MUT, lw=1.5, head=6))
    o.append(RECT(242, yp - 20, 100, 40, 6, soft(GRN), GRN, 1.4))
    _f24_lines(o, 292, yp - 3, ["電池 Li-ion", "2000 mAh"], 9, INK, 13, "middle", True)
    o.append(_f24_tag(326, yp - 26, "13"))
    for dy, nm, dst, c in ((-24, "LDO 3.3 V（いつも）", "マイコン・フラッシュ・バックアップの端子", PUR),
                           (24, "LDO 3.3 V（EN で入れ切り）", "モジュールの電源・LNA（EN はマイコン）", SIG)):
        o.append(W(344, yp, 360, yp, 360, yp + dy, 372, yp + dy, c=MUT, lw=1.4))
        o.append(_head(360, yp + dy, 374, yp + dy, MUT, 6))
        o.append(RECT(376, yp + dy - 13, 130, 26, 5, soft(c), c, 1.3))
        o.append(T(441, yp + dy + 4, nm, "middle", 9, INK, True))
        o.append(ARR(508, yp + dy, 522, yp + dy, c=c, lw=1.4, head=6))
        o.append(T(526, yp + dy + 4, dst, "start", 8.5, c, True))
    o.append(_f24_tag(368, yp - 46, "10"))
    return SVG(700, 312, o, "例のロガーの回路の構成（部品の値は例の値）。RF の段は 9 章の例と同じ並び、モジュールは 10 章の例。")


F["e24_block"] = _f24_block_fig()


# =====================================================================
# 2 節: LNA の要否（システム雑音温度の内訳と、仰角 30° の衛星の C/N0）
# =====================================================================
_F24_STC = {"アンテナ": TEA, "線": MUT, "SAW": GLD, "LNA": SIG, "チップの増幅器": PUR}


def _f24_lna_fig():
    o = []
    cfgs = [("(a) パッチ → LNA → SAW", "選ぶ構成（9 章の例の並び）", dict(), GRN),
            ("(b) パッチ → SAW → LNA", "SAW を LNA の前に（9 章 3 節）", dict(saw="before"), MUT),
            ("(c) パッチ → SAW", "LNA なし", dict(lna=False), ALI),
            ("(d) パッチだけ", "LNA も SAW もなし", dict(lna=False, saw="none"), MUT),
            ("(e) チップ → LNA → SAW", "直線偏波で 3 dB 損（8 章 2 節）", dict(ant="chip"), MUT)]
    o.append(T(14, 18, "LNA の有無と置き場所（線と筐体は 3 節で足す。仰角 30° の衛星）", "start", 11, INK, True))
    p = Plot(250, 52, 220, 44 * 5 - 8, (0, 700), (0, 1))
    q = Plot(516, 52, 170, 44 * 5 - 8, (38, 50), (0, 1))
    o.append(TX(p.x + p.w / 2, 42, "システム雑音温度 T_{sys} の内訳 [K]", "middle", 9.5, MUT, True))
    o.append(TX(q.x + q.w / 2, 42, "C/N_0 [dB-Hz]", "middle", 9.5, MUT, True))
    for v in (0, 200, 400, 600):
        o.append(W(p.X(v), p.y - 2, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 14, "%d" % v, "middle", 9, MUT))
    for v in (38, 41, 44, 47, 50):
        o.append(W(q.X(v), q.y - 2, q.X(v), q.y + p.h, c=GRD, lw=1))
        o.append(T(q.X(v), q.y + q.h + 14, "%d" % v, "middle", 9, MUT))
    o.append(W(q.X(41), q.y - 4, q.X(41), q.y + q.h, c=GLD, lw=1.6, dash="5 3"))
    o.append(T(q.X(41) + 3, q.y + q.h + 28, "仕様 41（1 節）", "middle", 9, GLD, True))
    for k, (nm, sub, kw, c) in enumerate(cfgs):
        y = 52 + k * 44
        o.append(T(14, y + 14, nm, "start", 10, INK, True))
        o.append(T(14, y + 28, sub, "start", 9, MUT))
        st = _f24_stages(kw.get("ant", "patch"), kw.get("lna", True), kw.get("saw", "after"), 0.0)
        ts, parts = _f24_tsys(st)
        segs = [("アンテナ", 100.0)]
        for nm2, cval in parts:
            key = "チップの増幅器" if nm2.startswith("チップ") else nm2
            if segs[-1][0] == key:
                segs[-1] = (key, segs[-1][1] + cval)
            else:
                segs.append((key, cval))
        x = p.X(0)
        for key, cval in segs:
            w = p.X(cval) - p.X(0)
            o.append(RECT(x, y + 4, max(w, 0.6), 22, 1, soft(_F24_STC[key]), _F24_STC[key], 1.0))
            x += w
        o.append(T(x + 5, y + 19, "%.0f K" % ts, "start", 9.5, INK, True))
        cn = _f24_cn0(30.0, case=False, line_cm=0.0, **kw)
        o.append(W(q.X(38), y + 15, q.X(cn), y + 15, c=soft(c) if c != MUT else GRD, lw=6))
        o.append(D(q.X(cn), y + 15, c if c != MUT else INK, 4.5))
        o.append(T(q.X(cn) + (8 if cn < 46.5 else -8), y + 19, "%.1f" % cn, "start" if cn < 46.5 else "end", 9.5, c if c != MUT else INK, True, halo=True))
    o.append(LEGEND(250, 52 + 5 * 44 + 36, [(TEA, "アンテナ（100 K）"), (SIG, "LNA"), (GLD, "SAW"), (PUR, "チップの増幅器")], 9.5))
    return SVG(700, 52 + 5 * 44 + 46, o, "9 章 1 節のフリスの式と 3 章 1 節の回線計算で求めた値（受信電力 −128.6 dBm、アンテナの雑音温度 100 K。部品の値は 9 章の例）。")


F["e24_lna"] = _f24_lna_fig()


# =====================================================================
# 3 節: 基板の配置（上から見た図。寸法は例の値）
# =====================================================================
def _f24_layout_fig():
    o = []
    o.append(T(14, 18, "基板の配置（上から見た図、70 × 45 mm・4 層。寸法は例の値）", "start", 11, INK, True))
    x0, y0, k = 20, 40, 5.6
    X = lambda v: x0 + k * v
    Y = lambda v: y0 + k * v
    R = lambda a, b, w, h, **kw: RECT(X(a), Y(b), k * w, k * h, kw.get("r", 2), kw.get("fill", PAN), kw.get("c", LIN), kw.get("lw", 1.2), kw.get("dash"))
    # 区画
    o.append(R(0, 0, 70, 45, r=4, fill=SCR, c=MUT, lw=1.4))
    zones = [(0, 44, "RF", SIG), (44, 58.5, "ディジタル", PUR), (58.5, 70, "電源", ALI)]
    for a, b, nm, c in zones:
        o.append(RECT(X(a) + 2, Y(0) + 2, k * (b - a) - 4, k * 45 - 4, 3, soft(c), "none", 0, op=0.55))
        o.append(T(X((a + b) / 2), Y(45) + 14, nm, "middle", 9.5, c, True))
    # 電池（地板の裏）
    o.append(R(6, 3, 60, 40, r=4, fill="none", c=GRN, lw=1.3, dash="6 4"))
    o.append(T(X(36), Y(44.2) - 3, "電池 60 × 40 mm（地板の裏）", "middle", 9, GRN, True, halo=True))
    # アンテナとキープアウト
    o.append(R(1, 7, 31, 31, r=3, fill="none", c=GLD, lw=1.2, dash="3 3"))
    o.append(R(4, 10, 25, 25, r=2, fill=soft(GLD), c=GLD, lw=1.5))
    o.append(R(6, 12, 21, 21, r=1, fill=soft(GLD), c=GLD, lw=1.0))
    fx, fy = 20.7, 22.5
    o.append(T(X(16.5), Y(15.5), "パッチ 25 mm", "middle", 9, GLD, True, halo=True))
    o.append(T(X(16.5), Y(37.6) + 6, "キープアウト 3 mm", "middle", 8.5, GLD, False, halo=True))
    # RF の線（50 Ω・2 cm）とビアの柵
    pts = [(fx, fy), (33, fy), (37, fy)]
    o.append(PL([(X(a), Y(b)) for a, b in pts], c=SIG, lw=2.0))
    o.append(D(X(fx), Y(fy), SIG, 2.6))
    for v in _f24_np.arange(30.0, 37.1, 4.5 * 0.5):
        o.append(D(X(v), Y(fy - 1.6), MUT, 1.3)); o.append(D(X(v), Y(fy + 1.6), MUT, 1.3))
    # LNA・SAW とシールドケース
    o.append(R(35.5, 16.5, 8.5, 12, r=1, fill="none", c=TEA, lw=1.4, dash="2 2"))
    o.append(R(37, 21, 2.6, 3, r=0.5, fill=soft(SIG), c=SIG, lw=1.2))
    o.append(R(40.4, 21.4, 2.6, 2.2, r=0.5, fill=soft(SIG), c=SIG, lw=1.2))
    o.append(W(X(39.6), Y(22.5), X(40.4), Y(22.5), c=SIG, lw=1.6))
    o.append(W(X(43), Y(22.5), X(46), Y(22.5), c=SIG, lw=1.6))
    o.append(T(X(39.8), Y(16) - 3, "LNA・SAW", "middle", 8.5, SIG, True, halo=True))
    # モジュール・マイコン・フラッシュ
    o.append(R(46, 17.5, 10, 10, r=1, fill=soft(SIG), c=SIG, lw=1.3))
    o.append(T(X(51), Y(23.3), "モジュール", "middle", 8.5, SIG, True, halo=True))
    o.append(R(47.5, 31, 7, 7, r=1, fill=soft(PUR), c=PUR, lw=1.2))
    o.append(T(X(51), Y(35.2), "マイコン", "middle", 8.5, PUR, True, halo=True))
    o.append(R(47.5, 6, 7, 6, r=1, fill=soft(PUR), c=PUR, lw=1.2))
    o.append(T(X(51), Y(9.7), "フラッシュ", "middle", 8, PUR, True, halo=True))
    # 電源の区画
    o.append(R(60, 5, 7, 7, r=1, fill=soft(ALI), c=ALI, lw=1.2))
    o.append(T(X(63.5), Y(8.9), "充電", "middle", 8.5, ALI, True, halo=True))
    o.append(R(60, 14.5, 7, 5, r=1, fill=soft(ALI), c=ALI, lw=1.0))
    o.append(T(X(63.5), Y(17.6), "LC", "middle", 8.5, ALI, True, halo=True))
    o.append(R(60, 22, 5, 9, r=1, fill=PAN, c=MUT, lw=1.0))
    o.append(T(X(62.5), Y(27.1), "LDO", "middle", 8.5, MUT, True, halo=True))
    o.append(R(65.5, 32, 4.5, 9, r=1, fill=PAN, c=MUT, lw=1.2))
    o.append(T(X(65.2), Y(43.2), "USB", "middle", 8.5, MUT, True, halo=True))
    # アンテナから充電の回路までの距離
    o.append(DARR(X(16.5), Y(5), X(60), Y(5), c=ALI, lw=1.1, head=5))
    o.append(T(X(38), Y(5) - 4, "43.5 mm", "middle", 9, ALI, True, halo=True))
    # 右の説明
    nx = 430
    notes = [("11", SIG, ["50 Ω の線: 幅 0.35 mm・2 cm", "損失 0.14 dB（LNA の前）"]),
             ("11", MUT, ["ビアの柵: 間隔 4.5 mm 以下", "（L1 の 1/10 波長の目安）"]),
             ("11", GLD, ["キープアウト: アンテナの周り", "に部品と銅を置かない"]),
             ("21", TEA, ["シールドケース: LNA と SAW。", "つなぐ点の間隔 9.5 mm 以下"]),
             ("22", ALI, ["充電の回路（2 MHz）は電源の", "区画の端に、アンテナから離す"]),
             ("22", GRN, ["電池・USB の金属は地板の裏", "か端に（アンテナの近傍界の外）"])]
    for i, (ch, c, ls) in enumerate(notes):
        yy = 52 + i * 42
        s, w = CHIP(nx, yy, ch, c, 8.5, 3)
        o.append(s)
        _f24_lines(o, nx + 24, yy, ls, 9, INK, 13)
    return SVG(700, 318, o, "基板の配置の例（4 層の FR-4、2 層目がグラウンド。11 章の例の基板）。左から RF・ディジタル・電源の区画に分けた。")


F["e24_layout"] = _f24_layout_fig()


# =====================================================================
# 3 節: 筐体の断面と離調（22 章 2 節のモデル）
# =====================================================================
def _f24_ar(f, shift):
    G, PR, PL = _f24_patch(f, shift)
    aR, aL = math.sqrt(PR), math.sqrt(PL)
    return 20 * math.log10((aR + aL) / max(abs(aR - aL), 1e-12))


def _f24_case_fig():
    o = []
    o.append(T(14, 18, "(a) アンテナの所の断面（左端から 42 mm まで。寸法は例の値）", "start", 11, INK, True))
    k = 7.4
    x0, y0 = 52, 36
    X = lambda v: x0 + k * v
    Y = lambda v: y0 + k * v
    xe = 42.0
    # 筐体（外形の高さ 22 mm）: 上の壁 2・隙間 1・パッチ 4・基板 1.6・空き 1.4・電池 8・空き 2・下の壁 2
    o.append(PATH("M%g,%g H%g M%g,%g H%g" % (X(xe), Y(0), X(0) + 6, X(0) + 6, Y(22), X(xe)), c=MUT, lw=1.3))
    o.append(RECT(X(0), Y(0), k * (xe + 3), k * 22, 6, soft(MUT), MUT, 1.3))
    o.append(RECT(X(2), Y(2), k * (xe + 3), k * 18, 3, SCR, MUT, 0.8))
    o.append(RECT(X(xe), Y(-0.5), k * 3.2, k * 23, 0, PAN, "none", 0))
    for i in range(6):
        yy = Y(0) + i * k * 22 / 5.0
        o.append(W(X(xe) + (4 if i % 2 else 0), yy - 2, X(xe) + (0 if i % 2 else 4), yy + k * 22 / 5.0 - 2, c=FNT, lw=1))
    o.append(T(X(21), Y(1.35) + 1, "ABS（比誘電率 2.8・厚さ 2 mm）", "middle", 9, MUT, True))
    # はみ出した電界（パッチの縁から地板へ回り込む線。上へ h_e = 3 mm ほどで弱まる）
    for xe_, sg in ((5.0, -1), (30.0, 1)):
        for r in (1.2, 2.4, 3.6):
            o.append(PATH("M%g,%g Q%g,%g %g,%g" % (X(xe_), Y(3.2), X(xe_ + sg * r * 0.9), Y(3.0 - r * 0.75), X(xe_ + sg * r), Y(7)),
                          c=GLD, lw=1.0, dash="3 2"))
    o.append(T(X(34.2), Y(2.75), "はみ出した電界", "start", 8.5, GLD, True, halo=True))
    o.append(RECT(X(5), Y(3), k * 25, k * 4, 1, soft(GLD), GLD, 1.4))
    o.append(T(X(17.5), Y(5.4) + 1, "パッチ 25 mm 角・厚さ 4 mm", "middle", 9, GLD, True, halo=True))
    o.append(RECT(X(2), Y(7), k * (xe + 1), k * 1.6, 0, soft(GRN), GRN, 1.0))
    o.append(RECT(X(33), Y(4.6), k * 7, k * 2.4, 1, soft(SIG), SIG, 1.0))
    o.append(T(X(36.5), Y(6.2), "LNA", "middle", 8.5, SIG, True))
    o.append(RECT(X(6), Y(10), k * (xe - 4), k * 8, 3, soft(GRN), GRN, 1.2, "5 3"))
    o.append(T(X(22), Y(14.4), "電池 60 × 40 × 8 mm（地板の裏）", "middle", 9, GRN, True))
    o.append(T(X(36.5), Y(9.8), "基板（地板）", "middle", 8.5, GRN, True, halo=True))
    # 寸法（左）
    for a, b, lab in ((0, 2, "2"), (2, 3, "1"), (3, 7, "4"), (7, 8.6, "1.6"), (10, 18, "8"), (0, 22, "22")):
        xx = X(-1.2) if lab != "22" else X(-4.6)
        o.append(W(xx - 3, Y(a), xx + 3, Y(a), c=MUT, lw=0.8)); o.append(W(xx - 3, Y(b), xx + 3, Y(b), c=MUT, lw=0.8))
        o.append(W(xx, Y(a), xx, Y(b), c=MUT, lw=0.8))
        o.append(T(xx - 4, (Y(a) + Y(b)) / 2 + 3, lab, "end", 8.5, MUT))
    o.append(T(X(-4.6) + 2, Y(0) - 5, "[mm]", "middle", 8.5, MUT))
    o.append(T(14, Y(22) + 20, "外形 78 × 52 × 22 mm（仕様の 80 × 55 × 25 mm 以下）", "start", 9.5, INK, True))
    o.append(T(14, Y(22) + 38, "樹脂は、はみ出した電界の 0.35 % の場所に入る（22 章 2 節の近似）:", "start", 9.5, GLD, True))
    o.append(TX(14, Y(22) + 54, "Δf ≈ −(ε_p − 1) ξ_p f_0 / 2 = −(2.8 − 1) × 0.35 % × 1575.42 MHz / 2 = −4.9 MHz", "start", 9.5, ALI, True))
    # (b) 軸比の周波数特性
    p = Plot(488, 50, 192, 150, (1560, 1590), (0, 12))
    o.append(T(456, 18, "(b) 筐体に入れた後の軸比", "start", 11, INK, True))
    o.append(p.axes(xl="周波数 f [MHz]", yl="軸比 [dB]", xt=[1560, 1570, 1580, 1590], yt=[0, 3, 6, 9, 12]))
    o.append(W(p.X(1575.42), p.y, p.X(1575.42), p.y + p.h, c=SIG, lw=1.2, dash="4 3"))
    o.append(T(p.X(1575.42) + 3, p.y + 11, "L1", "start", 9, SIG, True, halo=True))
    fs = _f24_np.linspace(1560, 1590, 301)
    for shift, c in ((_F24_DF, ALI), (_F24_DF + _F24_PRE, GRN)):
        o.append(p.clip([(f, _f24_ar(f * 1e6, shift)) for f in fs], c=c, lw=2))
    r0, r1 = _f24_l1(_F24_DF), _f24_l1(_F24_DF + _F24_PRE)
    o.append(D(p.X(1575.42), p.Y(r0["ar"]), ALI, 3.6)); o.append(D(p.X(1575.42), p.Y(r1["ar"]), GRN, 3.6))
    yb = p.y + p.h + 48
    o.append(T(456, yb, "合わせないアンテナ（−4.9 MHz）", "start", 9, ALI, True))
    o.append(T(456, yb + 13, "軸比 %.1f dB・右旋の損失 %.2f dB" % (r0["ar"], r0["rhcp"]), "start", 9, INK))
    o.append(T(456, yb + 26, "（S11 は %.1f dB でよく合って見える）" % r0["s11"], "start", 9, MUT))
    o.append(T(456, yb + 44, "共振を 5 MHz 上げたアンテナ（+0.06 MHz）", "start", 9, GRN, True))
    o.append(T(456, yb + 57, "軸比 %.2f dB・右旋の損失 %.2f dB" % (r1["ar"], r1["rhcp"]), "start", 9, INK))
    return SVG(700, 330, o, "例の筐体（ABS 2 mm・隙間 1 mm）での離調。(b) は 8 章のパッチのモデル（Q = 100）で計算した（22 章 2 節と同じモデル）。")


F["e24_case"] = _f24_case_fig()


# =====================================================================
# 3 節: C/N0 の見積もり（仕上げた設計。仰角 30° の衛星の回線計算と、空の衛星ごとの値）
# =====================================================================
def _f24_cn0_fig():
    o = []
    o.append(T(14, 18, "(a) 仰角 30° の衛星の回線計算（3 章 1 節の表の形）", "start", 11, INK, True))
    p30 = _f24_prx(30.0); g30 = _f24_ga(30.0); lc = _f24_case_loss(True)
    st = _f24_stages()
    ts, parts = _f24_tsys(st)
    n0 = _f24_n0(ts)
    cn = p30 + g30 - lc - n0
    rows = [("0 dBi で受ける電力（3 章 1 節）", "%s dBm" % _f24_f(p30, 2), INK),
            ("アンテナの利得（仰角 30°。3 章 3 節の例）", "%s dB" % _f24_f(g30, 2), GLD),
            ("筐体（共振を合わせたアンテナ。22 章 2 節）", "−%.2f dB" % lc, GLD),
            ("受信電力 C", "%s dBm" % _f24_f(p30 + g30 - lc, 2), SIG)]
    y = 44
    for nm, v, c in rows:
        o.append(T(24, y, nm, "start", 9.5, c, c == SIG))
        o.append(T(392, y, v, "end", 9.5, c, True))
        y += 19
    o.append(W(24, y - 13, 392, y - 13, c=LIN, lw=0.8))
    y += 6
    o.append(TX(24, y, "システム雑音温度 T_{sys}（9 章 1 節のフリスの式）", "start", 9.5, TEA, True))
    o.append(T(392, y, "%.1f K" % ts, "end", 9.5, TEA, True))
    y += 17
    segs = [("アンテナ", 100.0)] + [(nm if not nm.startswith("チップ") else "チップの増幅器", c) for nm, c in parts]
    agg = []
    for nm, c in segs:
        if agg and agg[-1][0] == nm:
            agg[-1] = (nm, agg[-1][1] + c)
        else:
            agg.append((nm, c))
    xs = 24
    for nm, c in agg:
        w = 360 * c / ts
        col = _F24_STC.get(nm, MUT)
        o.append(RECT(xs, y, max(w, 0.8), 14, 1, soft(col), col, 1.0))
        xs += w
    y += 30
    lab = "  ".join("%s %.1f" % (nm, c) for nm, c in agg)
    o.append(T(24, y, lab + " [K]", "start", 8.5, MUT))
    y += 22
    o.append(TX(24, y, "N_0 = k_B T_{sys}", "start", 9.5, TEA, True))
    o.append(T(392, y, "%s dBm/Hz" % _f24_f(n0, 2), "end", 9.5, TEA, True))
    y += 20
    o.append(W(24, y - 13, 392, y - 13, c=LIN, lw=0.8))
    y += 4
    o.append(TX(24, y, "C/N_0 = C − N_0", "start", 10.5, GRN, True))
    o.append(T(392, y, "%.2f dB-Hz" % cn, "end", 10.5, GRN, True))
    y += 22
    o.append(T(24, y, "仕様 41 dB-Hz に対する余裕", "start", 9.5, INK))
    o.append(T(392, y, "%.1f dB" % (cn - _F24_SPEC_CN0), "end", 9.5, INK, True))
    y += 18
    o.append(T(24, y, "捕捉の目安 35 dB-Hz に対する余裕（木の葉などに使える）", "start", 9.5, INK))
    o.append(T(392, y, "%.1f dB" % (cn - _F24_ACQ), "end", 9.5, INK, True))
    # (b) 仰角と C/N0（空の衛星）
    o.append(TX(428, 18, "(b) 仰角と C/N_0（東京・時刻 0）", "start", 11, INK, True))
    q = Plot(470, 40, 210, 190, (0, 90), (30, 55))
    o.append(q.axes(xl="仰角 θ [°]", yl="C/N_0 [dB-Hz]", xt=[0, 30, 60, 90], yt=[30, 35, 40, 45, 50, 55]))
    els = _f24_np.linspace(1, 90, 90)
    o.append(q.line([(e, _f24_cn0(e, lna=False)) for e in els], c=ALI, lw=1.6, dash="5 3"))
    o.append(q.line([(e, _f24_cn0(e)) for e in els], c=GRN, lw=2.2))
    for v, c, lab in ((35.0, ALI, "捕捉の目安 35"), ):
        o.append(W(q.x, q.Y(v), q.x + q.w, q.Y(v), c=c, lw=1, dash="2 3"))
        o.append(T(q.x + q.w - 2, q.Y(v) - 4, lab, "end", 8.5, c, False, halo=True))
    o.append(D(q.X(30), q.Y(_F24_SPEC_CN0), GLD, 3.4))
    o.append(T(q.X(30) + 6, q.Y(_F24_SPEC_CN0) + 12, "仕様（30° で 41）", "start", 8.5, GLD, True, halo=True))
    for s in _f24_vis(_F24_SYS4):
        if s[1] > 5:
            o.append(D(q.X(s[1]), q.Y(_f24_cn0(s[1])), GNSS_SYSC[s[3]], 2.8))
    o.append(LEGL(440, 274, [(GRN, None, "仕上げた設計"), (ALI, "5 3", "LNA なし（2 節の (c)）")], 9, 12))
    o.append(T(440, 292, "点: 見えている 4 つの衛星系の衛星（仰角 5° より上）", "start", 8.5, MUT))
    return SVG(700, 304, o, "仕上げた設計（パッチ → 2 cm の線 → LNA → SAW → モジュール、共振を合わせたアンテナ）の C/N0 の見積もり。雑音は 9 章の例の段。")


F["e24_cn0"] = _f24_cn0_fig()


# =====================================================================
# 4 節: ファームウェアの構成（15 章の部品と、この章で足す部分）
# =====================================================================
def _f24_fw_fig():
    o = []
    o.append(T(14, 18, "ファームウェアの構成（青: 15 章の部品をそのまま使う、緑: この章で足す）", "start", 11, INK, True))
    # 左: 15 章の受信の流れ
    items = [("gnss_rx_isr", "UART の受信の割り込み（15 章 2 節）"),
             ("リングバッファ", "1024 B（GGA と RMC で 1 回 141 B）"),
             ("gnss_poll", "主のループから（15 章 4 節）"),
             ("nmea_feed", "1 文字ずつ確かめる（12 章 4 節）"),
             ("epoch_feed", "GGA と RMC を組にする（15 章 4 節）"),
             ("fix_epoch・fix_judge", "状態機械（15 章 3 節）")]
    x0, w0, h0 = 14, 276, 30
    for i, (nm, sub) in enumerate(items):
        y = 34 + i * 42
        o.append(RECT(x0, y, w0, h0, 6, soft(SIG), SIG, 1.3))
        o.append(T(x0 + 8, y + 19, nm, "start", 10, SIG, True, True))
        o.append(T(x0 + w0 - 8, y + 19, sub, "end", 8.5, MUT))
        if i < len(items) - 1:
            o.append(ARR(x0 + 40, y + h0, x0 + 40, y + 42, c=SIG, lw=1.4, head=6))
    yu = 34 + 6 * 42
    o.append(ARR(x0 + 40, yu - 12, x0 + 40, yu, c=SIG, lw=1.4, head=6))
    o.append(RECT(x0, yu, w0, 40, 6, soft(GRN), GRN, 1.5))
    o.append(T(x0 + 8, yu + 17, "use_epoch（ブロック A）", "start", 10, GRN, True, True))
    o.append(T(x0 + 8, yu + 32, "使ってよい組なら 32 B の記録をフラッシュへ・got = 1", "start", 8.5, INK))
    # 右: 起きて、記録して、眠る（ブロック B）
    o.append(T(330, 44, "logger_step（ブロック B）: 起きて、記録して、眠る", "start", 10.5, GRN, True))
    S = {"SLEEP": (420, 96, "眠る", "LG_SLEEP・2 µA"), "TXT": (600, 96, "文を待つ", "LG_WAIT_TXT"),
         "CFG": (600, 186, "設定を確かめる", "LG_CONFIG"), "FIX": (600, 276, "測位を待つ", "LG_WAIT_FIX"),
         "STOP": (420, 276, "止める", "LG_STOP")}
    for kk, (x, y, nm, sub) in S.items():
        o.append(STATE(x, y, 128, 44, nm, GRN if kk != "SLEEP" else PUR, sub))
    o.append(EDGE(484, 96, 536, 96, None, c=GRN))
    o.append(T(510, 76, "起きる時刻", "middle", 8.5, GRN, True))
    o.append(T(510, 64, "電源を入れる", "middle", 8.5, GRN))
    o.append(EDGE(600, 118, 600, 164, None, c=GRN))
    o.append(T(608, 140, "sm.st が文なしを出た", "start", 8.5, GRN, True))
    o.append(T(608, 152, "（2 s で次の速さへ）", "start", 8.5, MUT))
    o.append(EDGE(600, 208, 600, 254, None, c=GRN))
    o.append(T(608, 234, "cfg_step が 1", "start", 8.5, GRN, True))
    o.append(EDGE(536, 276, 484, 276, None, c=GRN))
    o.append(T(510, 268, "got = 1", "middle", 8.5, GRN, True))
    o.append(T(510, 292, "か 45 s", "middle", 8.5, ALI, True))
    o.append(EDGE(420, 254, 420, 118, None, c=PUR))
    _f24_lines(o, 412, 150, ["停止の ACK →", "電源を切る", "間隔: 記録したら 60 s、", "出なければ 2 倍", "（上限 30 分）"], 8.5, PUR, 12, "end", True)
    # use_epoch → got の矢印
    o.append(CARR(x0 + w0, yu + 20, 600, 299, -0.16, GRN, 1.2, 6, "4 3"))
    o.append(T(452, 336, "got = 1 にする", "middle", 8.5, GRN, True, halo=True))
    # 主のループ（ブロック C）
    yb = 370
    o.append(RECT(330, yb - 16, 360, 30, 6, PAN, MUT, 1.2))
    o.append(T(510, yb + 3, "主のループ: gnss_poll → logger_step → 眠る間は RTC を待つ", "middle", 9, INK, True))
    return SVG(700, 396, o, "ロガーのファームウェアの構成。15 章の部品の名前と型は変えずに、use_epoch の中身と、電源の管理（15 章 5 節の状態機械）を足した。")


F["e24_fw"] = _f24_fw_fig()


# =====================================================================
# 4 節: ホストの試験の結果（C の模擬と、このモデルは 3 日の 1494 回が全部一致した）
# =====================================================================
def _f24_test_fig():
    o = []
    P = _F24_P
    o.append(T(14, 18, "(a) 1 回起きたとき（ホットスタート・屋外）", "start", 11, INK, True))
    p = Plot(70, 40, 300, 150, (0, 5), (0, 1))
    # 状態の帯
    yb = p.y
    segs = [(0, 1.08, "文を待つ", PUR), (1.08, 1.09, "", GRN), (1.09, 4.15, "測位を待つ", GRN), (4.15, 4.25, "", ALI)]
    for a, b, nm, c in segs:
        o.append(RECT(p.X(a), yb, max(p.X(b) - p.X(a), 1.2), 18, 1, soft(c), c, 1.0))
        if nm:
            o.append(T(p.X((a + b) / 2), yb + 13, nm, "middle", 9, c, True))
    o.append(T(p.x - 6, yb + 13, "状態", "end", 9, MUT))
    o.append(T(p.X(4.25) + 4, yb + 13, "止める", "start", 9, ALI, True))
    # 組
    ye = yb + 52
    o.append(T(p.x - 6, ye + 4, "組", "end", 9, MUT))
    for t, lab, c in ((1, "位置なし", MUT), (2, "位置 1", SIG), (3, "2", SIG), (4, "3 → 3D", GRN)):
        o.append(W(p.X(t), ye - 8, p.X(t), ye + 8, c=c, lw=1.6))
        o.append(T(p.X(t), ye - 12, lab, "middle", 9, c, True, halo=True))
    o.append(W(p.x, ye, p.x + p.w, ye, c=GRD, lw=1))
    o.append(D(p.X(4.15), ye + 18, GRN, 3.4))
    o.append(T(p.X(4.15) - 4, ye + 22, "記録（4.15 s）", "end", 9, GRN, True))
    # 電流
    q = Plot(70, ye + 36, 300, 60, (0, 5), (0, 40))
    o.append(q.axes(xl="電源を入れてからの時間 [s]", yl=None, xt=[0, 1, 2, 3, 4, 5], yt=[0, 25, 35], sz=9))
    o.append(T(q.x - 34, q.y + 10, "電流", "middle", 9, MUT)); o.append(T(q.x - 34, q.y + 22, "[mA]", "middle", 9, MUT))
    o.append(q.steps([(0, 35), (2, 25), (4.25, 0.015), (5, 0.015)], c=TEA, lw=2))
    o.append(T(q.X(1), q.Y(35) - 4, "捕捉 35", "middle", 8.5, TEA, True, halo=True))
    o.append(T(q.X(3.1), q.Y(25) - 4, "追尾 25", "middle", 8.5, TEA, True, halo=True))
    # (b) 2 日目の 09:15〜13:35
    o.append(T(14, 290, "(b) 例の 1 日の 09:15〜13:35（2 日目。縦の線: 起きた回）", "start", 11, INK, True))
    t0, t1 = 9 * 60 + 15, 13 * 60 + 35
    r = Plot(60, 312, 620, 40, (t0, t1), (0, 1))
    o.append(RECT(r.x, r.y, r.w, r.h, 2, soft(MUT), MUT, 0.8))
    for a, b in _F24_OUT:
        a, b = max(a / 6e4, t0), min(b / 6e4, t1)
        if b > a:
            o.append(RECT(r.X(a), r.y, r.X(b) - r.X(a), r.h, 1, soft(GRN), GRN, 1.0))
    o.append(T(r.X(t0) + 4, r.y + r.h + 13, "屋外", "start", 9, GRN, True))
    o.append(T(r.X(11 * 60), r.y + r.h + 13, "屋内", "middle", 9, MUT, True))
    o.append(T(r.X(12 * 60 + 45), r.y + r.h + 13, "屋外", "middle", 9, GRN, True))
    o.append(T(r.X(13 * 60 + 25), r.y + r.h + 13, "屋内", "middle", 9, MUT, True))
    prev_fail = None
    for a, b, kind, ok, tf in _F24_DAY["wakes"]:
        m = (a % 86400000) / 6e4
        if not (t0 <= m <= t1):
            continue
        c = (GLD if kind == "warm" else GRN) if ok else ALI
        h = 14 if ok else 30
        o.append(W(r.X(m), r.y + r.h - h, r.X(m), r.y + r.h, c=c, lw=1.4 if ok else 2.0))
        if not ok and prev_fail is not None and m - prev_fail >= 15 and m < 12 * 60 + 15:
            o.append(T(r.X((m + prev_fail) / 2), r.y - 4, "%d 分" % round(m - prev_fail), "middle", 8.5, ALI, True))
        prev_fail = m if not ok else None
    for h in range(10, 14):
        o.append(W(r.X(h * 60), r.y + r.h, r.X(h * 60), r.y + r.h + 3, c=MUT, lw=1))
        o.append(T(r.X(h * 60), r.y + r.h + 26, "%d 時" % h, "middle", 9, MUT))
    o.append(T(r.X(9 * 60 + 37), r.y - 4, "2・4・8 分", "middle", 8.5, ALI, True))
    o.append(DARR(r.X(12 * 60 + 15), r.y + r.h + 36, r.X(12 * 60 + 30.5), r.y + r.h + 36, c=GLD, lw=1.1, head=5))
    o.append(T(r.X(12 * 60 + 15) - 6, r.y + r.h + 40, "外に出てから最初の記録まで 15 分（12:30 のウォームスタート）", "end", 9, GLD, True))
    # (c) 試験のまとめ
    cnt = {"hot": 0, "warm": 0, "fail": 0}
    for a, b, kind, ok, tf in _F24_DAY["wakes"]:
        cnt[kind if ok else "fail"] += 1
    o.append(T(420, 18, "(c) 例の 1 日の 2 日目（C の模擬とモデルが一致）", "start", 11, INK, True))
    rows = [("記録した回（ホット）", "%d 回" % cnt["hot"], "4.25 s", GRN),
            ("記録した回（ウォーム）", "%d 回" % cnt["warm"], "32.25 s", GLD),
            ("位置が出ずに止めた回", "%d 回" % cnt["fail"], "45.11 s", ALI)]
    o.append(T(560, 44, "回数", "end", 9, MUT, True)); o.append(T(684, 44, "電源を入れていた時間", "end", 9, MUT, True))
    for i, (nm, n, on, c) in enumerate(rows):
        y = 64 + i * 20
        o.append(T(420, y, nm, "start", 9.5, c, True))
        o.append(T(560, y, n, "end", 9.5, INK, True))
        o.append(T(684, y, on, "end", 9.5, INK, True))
    _f24_lines(o, 420, 140, ["3 日分（1494 回起きる）を、本文の C と", "15 章の部品をホストで動かして模擬した。",
                             "起きた時刻・止めた時刻・記録の時刻が、", "モデル（Python）とすべて一致した。",
                             "記録 1365 件のチェックサムとうるう秒の数、", "n_bad・n_part・n_gap はすべて期待どおり。"], 9, INK, 14)
    return SVG(700, 412, o, "4 節のロガーのコードの試験（模擬のモジュール: 電源を入れた 1 s 後から 1 秒ごとに GGA と RMC を出し、屋外で TTFF が過ぎると位置が出る）。")


F["e24_test"] = _f24_test_fig()
