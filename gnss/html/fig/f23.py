# -*- coding: utf-8 -*-
# 23 章 評価と試験 — C/N0・TTFF・精度の測り方 の図
# 乱数は widgets.js の U.rng(seed) と同じ列を使い、デモ（wjs/w23.js）と同じ手順で計算する（同じ種なら同じ値になる）。
import numpy as _f23_np
from scipy.signal import lfilter as _f23_lfilter

_F23_C = 299792458.0
_F23_D2R = math.pi / 180
_F23_KB = 1.380649e-23


# =====================================================================
# 乱数（U.rng と同じ。状態は 1 回ごとに 0x6D2B79F5 ずつ増えるので、k 番目の値を並べて計算できる）
# =====================================================================
_F23_M = 0xFFFFFFFF


def _f23_uni(seed, n, start=0):
    """U.rng(seed) の next() を start 回呼んだ後の n 個の値。"""
    u64 = _f23_np.uint64
    a0 = (seed & _F23_M) or 1
    k = _f23_np.arange(start + 1, start + n + 1, dtype=_f23_np.uint64)
    a = (u64(a0) + k * u64(0x6D2B79F5)) & u64(_F23_M)
    t = ((a ^ (a >> u64(15))) * (u64(1) | a)) & u64(_F23_M)
    t2 = ((t ^ (t >> u64(7))) * (u64(61) | t)) & u64(_F23_M)
    t = ((t + t2) & u64(_F23_M)) ^ t
    return ((t ^ (t >> u64(14))) & u64(_F23_M)).astype(_f23_np.float64) / 4294967296.0


def _f23_normals(seed, n, start=0):
    """U.rng(seed).normal() を n 回呼んだ値（start は、それまでに呼んだ next() の回数）。"""
    u = _f23_uni(seed, 2 * n, start)
    return _f23_np.sqrt(-2 * _f23_np.log(1 - u[0::2])) * _f23_np.cos(2 * _f23_np.pi * u[1::2])


class _F23Rng:
    """U.rng(seed) と同じ列を 1 つずつ出す。"""
    def __init__(self, seed):
        self.a = (seed & _F23_M) or 1

    def next(self):
        a = (self.a + 0x6D2B79F5) & _F23_M
        self.a = a
        t = ((a ^ (a >> 15)) * (1 | a)) & _F23_M
        t = ((t + (((t ^ (t >> 7)) * (61 | t)) & _F23_M)) & _F23_M) ^ t
        return ((t ^ (t >> 14)) & _F23_M) / 4294967296.0

    def normal(self):
        u = 1 - self.next()
        v = self.next()
        return math.sqrt(-2 * math.log(u)) * math.cos(2 * math.pi * v)


def _f23_f(v, d=1):
    """負の数の − を全角の負号にした数。"""
    s = ("%%.%df" % d) % v
    if s.lstrip("-").strip("0.") == "":
        s = s.lstrip("-")
    return s.replace("-", "−")


def _f23_med(v):
    s = sorted(v)
    n = len(s)
    return s[n // 2] if n % 2 else 0.5 * (s[n // 2 - 1] + s[n // 2])


def _f23_q(v, p):
    """小さい順に並べて、割合 p の回がそれ以下になる値（ceil(p n) 番目）。"""
    s = sorted(v)
    k = max(1, math.ceil(p * len(s) - 1e-9))
    return s[k - 1]


# =====================================================================
# 衛星の並び（1 章の近似の配置、GPS・東京・仰角マスク 10°）。1 分ごとの (GᵀG)⁻¹ の東・北・上の部分
# =====================================================================
_F23_TOK = GNSS_TOKYO
_F23_MASK = 10.0


def _f23_vis(t):
    out = []
    for s in gnss_const():
        if s["sys"] != "GPS":
            continue
        el, az, _ = elaz(*_F23_TOK, sat_ecef(s, t))
        if el > _F23_MASK:
            out.append((s["nm"], el, az))
    return out


def _f23_Henu(vis):
    G = _f23_np.array([[-math.cos(e * _F23_D2R) * math.sin(a * _F23_D2R), -math.cos(e * _F23_D2R) * math.cos(a * _F23_D2R),
                        -math.sin(e * _F23_D2R), 1.0] for _, e, a in vis])
    return _f23_np.linalg.inv(G.T @ G)[:3, :3]


_F23_HS = _f23_np.array([_f23_Henu(_f23_vis(k * 60.0)) for k in range(1440)])
_F23_LS = _f23_np.linalg.cholesky(_F23_HS)
_F23_HDOP = _f23_np.sqrt(_F23_HS[:, 0, 0] + _F23_HS[:, 1, 1])

# 7 章 6 節の誤差の予算（1σ、代表値）: ゆっくり変わる部分と速く変わる部分
_F23_SSLOW = math.sqrt(1.5 ** 2 + 3.5 ** 2 + 0.4 ** 2)    # 衛星の時計と軌道・電離層・対流圏 3.83 m
_F23_SFAST = math.sqrt(1.0 ** 2 + 0.5 ** 2)               # マルチパス・受信機の雑音 1.12 m
_F23_UERE = math.hypot(_F23_SSLOW, _F23_SFAST)            # 3.99 m
_F23_TAU = 1800.0                                         # 相関の時間 τ_c [s]


def _f23_record(seed, n, t0=0, dt=1.0):
    """静止の記録（東・北・上の誤差 [m]、n×3）。t0 は始める時刻 [s]、dt は値の間隔 [s]。
    乱数は 1 エポックに 6 つ（ゆっくり変わる部分の 3 つ、速く変わる部分の 3 つ）。デモの _w23_record と同じ。"""
    z = _f23_normals(seed, 6 * n).reshape(n, 6)
    phi = math.exp(-dt / _F23_TAU)
    s = math.sqrt(1 - phi * phi)
    a = _f23_np.empty((n, 3))
    for j in range(3):
        x = z[:, j]
        a[0, j] = x[0]
        if n > 1:
            a[1:, j] = _f23_lfilter([s], [1, -phi], x[1:], zi=[phi * x[0]])[0]
    v = _F23_SSLOW * a + _F23_SFAST * z[:, 3:6]
    idx = (_f23_np.floor((t0 + _f23_np.arange(n) * dt) / 60.0).astype(int)) % 1440
    return _f23_np.einsum('kij,kj->ki', _F23_LS[idx], v)


def _f23_outliers(seed, n, t0=0, dt=1.0):
    """NLOS を思わせる外れ値（デモの _w23_outliers と同じ）: 10 分ごとに確率 0.1 で、20〜100 s 続く
    水平 20〜60 m・上下 ±(10〜40) m のずれ。返り値は n×3 の足す値。"""
    g = _F23Rng(seed)
    add = _f23_np.zeros((n, 3))
    T = n * dt
    b = 0.0
    while b < T:
        if g.next() < 0.1:
            st = b + g.next() * 600
            du = 20 + 80 * g.next()
            mag = 20 + 40 * g.next()
            ang = 2 * math.pi * g.next()
            up = (10 + 30 * g.next()) * (1 if g.next() < 0.5 else -1)
            i0 = int(math.ceil(st / dt - 1e-9))
            i1 = min(n, int(math.ceil((st + du) / dt - 1e-9)))
            if i0 < i1:
                add[i0:i1, 0] += mag * math.sin(ang)
                add[i0:i1, 1] += mag * math.cos(ang)
                add[i0:i1, 2] += up
        b += 600
    return add


def _f23_stats(d):
    dh = _f23_np.hypot(d[:, 0], d[:, 1])
    return dict(cep=_f23_med(dh), r95=_f23_q(dh, 0.95), d2=2 * math.sqrt(float(_f23_np.mean(dh ** 2))),
                v95=_f23_q(_f23_np.abs(d[:, 2]), 0.95), me=float(d[:, 0].mean()), mn=float(d[:, 1].mean()))


# 7 章の見積もり（24 時間の中央値、10 分ごと）と、1 日の並びを全部まぜた値（多くの日の記録の値）
def _f23_ell(C2):
    a, b, c = C2[0][0], C2[0][1], C2[1][1]
    m = (a + c) / 2
    r = math.sqrt(((a - c) / 2) ** 2 + b * b)
    return math.sqrt(m + r), math.sqrt(max(m - r, 0.0))


def _f23_pin(R, s1, s2, n=720):
    ph = _f23_np.linspace(0, 2 * math.pi, n, endpoint=False)
    q = _f23_np.cos(ph) ** 2 / s1 ** 2 + _f23_np.sin(ph) ** 2 / s2 ** 2
    return float(_f23_np.mean((1 - _f23_np.exp(-R * R * q / 2)) / q) / (s1 * s2))


def _f23_solve(f, p, hi):
    lo = 0.0
    for _ in range(50):
        m = (lo + hi) / 2
        if f(m) < p:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


_F23_E = [(_f23_ell(H[:2, :2]), math.sqrt(H[2, 2])) for H in _F23_HS]


def _f23_mix():
    from scipy.special import erf
    E = [(a * _F23_UERE, b * _F23_UERE, v * _F23_UERE) for (a, b), v in _F23_E]
    pm = lambda R: _f23_np.mean([_f23_pin(R, a, b, 240) for a, b, _ in E])
    vm = lambda R: _f23_np.mean([erf(R / (v * math.sqrt(2))) for _, _, v in E])
    cep = _f23_solve(pm, 0.5, 40.0)
    r95 = _f23_solve(pm, 0.95, 60.0)
    v95 = _f23_solve(vm, 0.95, 80.0)
    d2 = 2 * _F23_UERE * math.sqrt(float(_f23_np.mean(_F23_HDOP ** 2)))
    med = []
    for k in range(0, 1441, 10):
        H = _F23_HS[k % 1440]
        a, b = _f23_ell(H[:2, :2])
        med.append((_f23_solve(lambda R: _f23_pin(R, a, b, 720), 0.5, 10.0), _f23_solve(lambda R: _f23_pin(R, a, b, 720), 0.95, 10.0),
                    1.96 * math.sqrt(H[2, 2])))
    m7 = [float(_f23_np.median([q[i] for q in med])) * _F23_UERE for i in range(3)]
    return dict(cep=cep, r95=r95, v95=v95, d2=d2), dict(cep=m7[0], r95=m7[1], v95=m7[2])


_F23_MIX, _F23_CH7 = _f23_mix()

# 本文の例の記録（種 1・24 時間・1 秒ごと）と外れ値（種 1 + 7777）
_F23_REC = _f23_record(1, 86400)
_F23_OUT = _f23_outliers(1 + 7777, 86400)
_F23_ST = _f23_stats(_F23_REC)
_F23_ST_O = _f23_stats(_F23_REC + _F23_OUT)


# 記録の長さごとの CEP と R95 の推定のばらつき（デモの「100 本の記録」と同じ手順。6 時間以上は 10 s ごとの値で計算）
_F23_LENS = [(600, "10 分"), (3600, "1 時間"), (21600, "6 時間"), (86400, "24 時間")]


def _f23_mc(L, nrec=100, seed=2300):
    g = _F23Rng(seed + L)
    dt = 10.0 if L >= 21600 else 1.0
    n = int(round(L / dt))
    out = []
    for r in range(nrec):
        t0 = math.floor(g.next() * 1440) * 60
        d = _f23_record(100000 + 7919 * r + L, n, t0, dt)
        st = _f23_stats(d)
        out.append((st["cep"], st["r95"], math.hypot(st["me"], st["mn"])))
    return out


_F23_MC = {L: _f23_mc(L) for L, _ in _F23_LENS}


# =====================================================================
# 2 節: 感度の試験のモデル（デモの _w23_track・_w23_acq と同じ）
# =====================================================================
_F23_TE = 290.0 * (10 ** 0.1 - 1)                          # 3 章 5 節の 1 段の例（NF 1 dB）の雑音温度 75.1 K


def _f23_n0(Tin):
    return 10 * math.log10(_F23_KB * (Tin + _F23_TE)) + 30


_F23_N0SKY = _f23_n0(100.0)                                # −176.2 dBm/Hz（アンテナの雑音温度 100 K）
_F23_N0SIM = _f23_n0(290.0)                                # −173.0 dBm/Hz（シミュレータの出力の 290 K）
_F23_CACQ, _F23_CTRK = 32.0, 17.0                          # 例の受信機のしきい値 [dB-Hz]（1 機を 50 % で捕捉・1 段で 50 % 見失う）


def _f23_track(seed, ctrk=_F23_CTRK, step=1.0, dwell=60, P0=-130.0, Pend=-170.0, nsat=8, n0=None):
    """追尾感度の試験: P0 から刻み step [dB]・1 段 dwell [s] で下げる。1 秒ごとに、追尾中の衛星は
    確率 min(1, (ln2/60) e^{−(c − ctrk)/0.4}) で見失う。返り値 (読んだ値, [(段の電力, 段の終わりの機数, 1 段の間 4 機以上だったか)], 1 秒ごとの機数)。"""
    n0 = _F23_N0SIM if n0 is None else n0
    g = _F23Rng(seed)
    h0 = math.log(2) / 60.0
    trk = [True] * nsat
    P = P0
    rows, cnt, last = [], [], None
    while P >= Pend - 1e-9:
        ok = True
        c = P - n0
        h = min(1.0, h0 * math.exp(-(c - ctrk) / 0.4))
        for _ in range(dwell):
            n = 0
            for i in range(nsat):
                u = g.next()
                if trk[i] and u < h:
                    trk[i] = False
                if trk[i]:
                    n += 1
            cnt.append(n)
            if n < 4:
                ok = False
        rows.append((P, sum(trk), ok))
        if ok:
            last = P
        if sum(trk) < 4:
            break
        P = round(P - step, 6)
    return last, rows, cnt


def _f23_pfix(c, cacq=_F23_CACQ, nsat=8):
    p = 1 / (1 + math.exp(-(c - cacq) / 0.7))
    from math import comb
    return sum(comb(nsat, j) * p ** j * (1 - p) ** (nsat - j) for j in range(4, nsat + 1))


def _f23_acq(seed, cacq=_F23_CACQ, step=1.0, K=10, P0=-134.0, Pend=-148.0, nsat=8, n0=None):
    """捕捉感度の試験: 段ごとに K 回のコールドスタート。1 機が制限時間内に見つかる確率は 1/(1 + e^{−(c − cacq)/0.7})、
    4 機以上で位置が出る。返り値 (読んだ値, [(段の電力, 位置が出た回数)])。9 割以上の最も弱い段を読む（強い段から順に）。"""
    n0 = _F23_N0SIM if n0 is None else n0
    g = _F23Rng(seed)
    rows, last, stop = [], None, False
    P = P0
    while P >= Pend - 1e-9:
        c = P - n0
        p = 1 / (1 + math.exp(-(c - cacq) / 0.7))
        ok = 0
        for _ in range(K):
            m = 0
            for i in range(nsat):
                if g.next() < p:
                    m += 1
            if m >= 4:
                ok += 1
        rows.append((P, ok))
        if not stop and ok >= math.ceil(0.9 * K - 1e-9):
            last = P
        elif not stop:
            stop = True
        P = round(P - step, 6)
    return last, rows


_F23_TRK = _f23_track(1)
_F23_ACQ = _f23_acq(1)


# =====================================================================
# 3 節: TTFF のモデル（5 章 5 節の手順と時間。デモの _w23_ttff1 と同じ）
# =====================================================================
_F23_TS = {"cold": 1.6368, "warm": 0.09207, "hot": 0.055242}   # 5 章のモデルの探す時間（45 dB-Hz・同時に 4000 ビン）
_F23_SKY = {"open": (9, 0.0), "blocked": (5, 0.1)}              # 見えている衛星の数・サブフレームを読み誤る確率


def _f23_ttff1(mode, sky, g):
    ton = g.next() * 30
    ns, pm = _F23_SKY[sky]
    if mode == "hot":
        ta = _F23_TS["hot"] + 0.3
        tt = ton + ta
        return ta + (math.ceil(tt - 1e-9) - tt)
    ta = _F23_TS[mode] + 0.3 + 1.0
    t0 = (ton + ta) % 30
    ends = []
    for _ in range(ns):
        E = []
        for i in range(1, 4):
            s0 = 6 * (i - 1)
            while s0 < t0 - 1e-9:
                s0 += 30
            n = 0
            while True:
                ok = g.next() < 1 - pm
                n += 1
                if ok or n >= 12:
                    break
                s0 += 30
            E.append(s0 + 6)
        ends.append(max(E))
    ends.sort()
    return ta + ends[3] - t0


def _f23_ttff(mode, sky, n, seed):
    g = _F23Rng(seed)
    return [_f23_ttff1(mode, sky, g) for _ in range(n)]


def _f23_ttff_rep(mode, sky, n, reps, seed):
    """同じ n 回の試験を reps 回くり返したときの (中央値, 95 % の値) の並び（デモの「1000 回くり返す」と同じ）。"""
    g = _F23Rng(seed * 31 + 5)
    out = []
    for _ in range(reps):
        v = [_f23_ttff1(mode, sky, g) for _ in range(n)]
        out.append((_f23_med(v), _f23_q(v, 0.95)))
    return out


def _f23_pu(k, n, conf=0.95):
    """n 回のうち k 回超えたときの、超える割合の上側の信頼限界（クロッパー・ピアソン）。"""
    from scipy.stats import beta
    return 1.0 if k >= n else float(beta.ppf(conf, k + 1, n - k))


# =====================================================================
# 図の部品
# =====================================================================
def _f23_ttl(o, x, y, s):
    o.append(T(x, y, s, "start", 11.5, INK, True))


def _f23_card(o, x, y, w, h, c, title, lines, sz=9.5):
    o.append(RECT(x, y, w, h, 7, soft(c), c, 1.3))
    o.append(T(x + w / 2, y + 17, title, "middle", 11, c, True))
    for i, l in enumerate(lines):
        o.append(TX(x + 7, y + 36 + i * 14, l, "start", sz, INK))


def _f23_ant(x, y, c=SIG, s=1.0):
    """アンテナの印（パッチを横から見た形）。(x, y) は板の上面の中央。"""
    return (RECT(x - 13 * s, y, 26 * s, 5 * s, 1, soft(c), c, 1.2) + RECT(x - 17 * s, y + 5 * s, 34 * s, 3 * s, 1, c, c, 1)
            + W(x, y + 8 * s, x, y + 16 * s, c=c, lw=1.4))


# =====================================================================
# 1 節: 測る項目と、比べる基準
# =====================================================================
def _f23_num(o, x, y, k, c):
    """丸の中の番号（図の中の場所と、下のカードを対応させる）。"""
    o.append(CIRC(x, y, 8.5, c=c, lw=1.4, fill=SCR))
    o.append(T(x, y + 3.6, str(k), "middle", 10, c, True))


def _f23_items_fig():
    o = []
    # 上: 受信機の流れ
    y = 30
    bx = [(12, 116, "衛星の電波", "空かシミュレータ", PUR), (164, 84, "アンテナ", None, SIG), (288, 120, "受信機", "（モジュール）", SIG),
          (448, 104, "UART の文", "GSV・GGA", SIG), (590, 98, "記録する PC", None, MUT)]
    for x, w, t1, t2, c in bx:
        o.append(BOX(x, y, w, 44, t1, t2, c=c, fill=soft(c) if c != MUT else PAN, sz=11, ssz=9.5))
    for (x1, w1, _, _, _), (x2, _, _, _, _) in zip(bx[:-1], bx[1:]):
        o.append(ARR(x1 + w1 + 2, y + 22, x2 - 2, y + 22, c=SIG, lw=1.6))
    # 1PPS と電源
    o.append(ARR(380, y + 46, 380, y + 82, c=GLD, lw=1.6))
    o.append(BOX(332, y + 84, 96, 26, "1PPS", None, c=GLD, fill=soft(GLD), sz=10))
    o.append(ARR(268, y + 98, 316, y + 48, c=GRN, lw=1.4))
    o.append(BOX(176, y + 86, 92, 26, "電源", None, c=GRN, fill=soft(GRN), sz=10))
    # 番号
    _f23_num(o, 268, y + 10, 1, PUR)
    _f23_num(o, 500, y - 1, 2, SIG)
    _f23_num(o, 222, y + 124, 3, GRN)
    _f23_num(o, 541, y + 54, 3, GRN)
    _f23_num(o, 459, y + 54, 4, GLD)
    _f23_num(o, 446, y + 97, 5, ALI)
    # 下: 項目のカード
    cards = [
        ("感度", PUR, ["見る所: RF の入力の", "電力と、捕捉・追尾", "基準: シミュレータの", "電力（損失を引く）", "数: 最も弱い段", "[dBm]（2 節）"]),
        ("C/N_0", SIG, ["見る所: GSV の C/N_0", "基準: 同じ時刻の", "基準の受信機", "数: 衛星と時間で", "平均した差 [dB]", "（2 節）"]),
        ("TTFF", GRN, ["見る所: 電源を入れて", "から最初の GGA", "基準: 同じ時計", "数: 中央値・", "95 % の値 [s]", "（3 節）"]),
        ("位置の精度", GLD, ["見る所: GGA の位置", "基準: 基準点の座標", "数: CEP・R95・", "上下の 95 % [m]", "（4 節）"]),
        ("時刻の精度", ALI, ["見る所: 1PPS の", "立ち上がり", "基準: 基準の 1PPS", "数: 一定の差と", "95 % の値 [ns]", "（4 節）"]),
    ]
    cw, gap, cy = 128, 9, 172
    for k, (nm, c, lines) in enumerate(cards):
        x = 12 + k * (cw + gap)
        o.append(RECT(x, cy, cw, 128, 7, soft(c), c, 1.3))
        _f23_num(o, x + 16, cy + 14, k + 1, c)
        o.append(TX(x + cw / 2 + 8, cy + 18, nm, "middle", 11, c, True))
        for i, l in enumerate(lines):
            o.append(TX(x + 7, cy + 38 + i * 14, l, "start", 9.5, INK))
    return SVG(700, 310, o, "機器の GNSS の性能の項目と、見る所・比べる基準・まとめる数。番号は、上の図の見る所（消費電流は電源の電流で測る）。")


F["e23_items"] = _f23_items_fig()


# =====================================================================
# 1 節: 同じ機器でも、測るたびに値が変わる
# =====================================================================
def _f23_cn0sky(nm, t, seed):
    """空の C/N0 の例 [dB-Hz]: 34 + 14 sin(仰角) + 反射の揺れ（1 次の自己回帰、30 s・1 dB）を整数に丸めた値。"""
    s = [q for q in gnss_const() if q["nm"] == nm][0]
    el = _f23_np.array([elaz(*_F23_TOK, sat_ecef(s, float(x)))[0] for x in t])
    dt = float(t[1] - t[0])
    z = _f23_normals(seed, len(t))
    phi = math.exp(-dt / 30.0)
    m = _f23_np.empty(len(t))
    m[0] = z[0]
    m[1:] = _f23_lfilter([math.sqrt(1 - phi * phi)], [1, -phi], z[1:], zi=[phi * z[0]])[0]
    c = _f23_np.round(34 + 14 * _f23_np.sin(el * _F23_D2R) + m)
    return el, _f23_np.where(el > _F23_MASK, c, _f23_np.nan)


def _f23_vary_fig():
    o = []
    # (a) C/N0
    o.append(TX(10, 18, "(a) C/N_0（同じ受信機）", "start", 11.5, INK, True))
    p = Plot(52, 34, 170, 150, (0, 6), (25, 50))
    o.append(p.axes(xl="時刻 [時間]", yl="C/N_0 [dB-Hz]", xt=[0, 2, 4, 6], yt=[30, 40, 50]))
    t = _f23_np.arange(0, 6 * 3600 + 1, 60.0)
    for nm, c, sd in (("G2", SIG, 11), ("G16", GRN, 12), ("G1", GLD, 13)):
        el, cn = _f23_cn0sky(nm, t, sd)
        seg = []
        for x, v in zip(t, cn):
            if v == v:
                seg.append((x / 3600, float(v)))
            elif seg:
                o.append(p.line(seg, c=c, lw=1.2)); seg = []
        if seg:
            o.append(p.line(seg, c=c, lw=1.2))
    o.append(LEGL(14, 236, [(SIG, None, "G2"), (GRN, None, "G16"), (GLD, None, "G1")], 9.5, 10))
    # (b) TTFF 20 回
    _f23_ttl(o, 248, 18, "(b) TTFF（コールド、20 回）")
    q = Plot(290, 34, 160, 150, (0, 21), (15, 45))
    o.append(q.axes(xl="回", yl="TTFF [s]", xt=[1, 5, 10, 15, 20], yt=[20, 30, 40], xfmt=lambda v: "%d" % v))
    v = _f23_ttff("cold", "open", 20, 1)
    for i, x in enumerate(v):
        o.append(D(q.X(i + 1), q.Y(x), GRN, 3.2))
    o.append(T(q.X(20.5), q.Y(min(v)) + 14, "最小 %s s" % _f23_f(min(v), 1), "end", 9.5, GRN, True, halo=True))
    o.append(T(q.X(20.5), q.Y(max(v)) - 7, "最大 %s s" % _f23_f(max(v), 1), "end", 9.5, GRN, True, halo=True))
    # (c) 水平の誤差 24 時間
    _f23_ttl(o, 478, 18, "(c) 位置の誤差（静止、24 時間）")
    r = Plot(518, 34, 172, 150, (0, 24), (-15, 15))
    o.append(r.axes(xl="時刻 [時間]", yl="誤差 [m]", xt=[0, 6, 12, 18, 24], yt=[-10, 0, 10]))
    k = _f23_np.arange(0, 86400, 120)
    o.append(r.clip([(i / 3600, float(_F23_REC[i, 0])) for i in k], c=SIG, lw=1.0))
    o.append(r.clip([(i / 3600, float(_F23_REC[i, 1])) for i in k], c=GLD, lw=1.0))
    o.append(LEGL(500, 236, [(SIG, None, "東 δe"), (GLD, None, "北 δn")], 9.5, 12))
    return SVG(700, 246, o, "同じ機器を同じ場所で測った例（モデル）。(a) 仰角で変わる C/N0、(b) 5 章 5 節のモデルで 20 回測った TTFF、(c) 4 節の静止の記録（2 分ごとに表示）。")


F["e23_vary"] = _f23_vary_fig()


# =====================================================================
# 2 節: 基準の受信機と並べて C/N0 を比べる（モデル）
# =====================================================================
def _f23_ar1(seed, n, tau, sig):
    z = _f23_normals(seed, n)
    phi = math.exp(-1.0 / tau)
    y = _f23_np.empty(n)
    y[0] = z[0]
    y[1:] = _f23_lfilter([math.sqrt(1 - phi * phi)], [1, -phi], z[1:], zi=[phi * z[0]])[0]
    return sig * y


def _f23_sbs_data(T=1800):
    """30 分・1 秒ごとの C/N0 [dB-Hz]（整数に丸めた値）。基準の受信機、機器（分配器で同じアンテナ）、機器（自分のアンテナで並べる）。
    空の C/N0 = 34 + 14 sin(仰角) + 反射の揺れ（30 s・1 dB）+ 推定の揺れ（0.4 dB）。機器は雑音の密度が 0.8 dB 高く、
    自分のアンテナの利得は −1.0 − 1.0 cos²(仰角) dB（筐体の中・小さい地板の例）。"""
    ts = _f23_np.arange(T)
    sats = {}
    for k in range(0, T + 1, 10):
        for nm, el, az in _f23_vis(float(k)):
            sats.setdefault(nm, {})[k] = el
    names = [n for n in sats if len(sats[n]) > 150]
    R, A, B, ELS = {}, {}, {}, {}
    for j, nm in enumerate(names):
        ks = sorted(sats[nm])
        el = _f23_np.interp(ts, ks, [sats[nm][k] for k in ks])
        ok = _f23_np.interp(ts, ks, [1.0] * len(ks), left=0, right=0) > 0.5
        base = 34 + 14 * _f23_np.sin(el * _F23_D2R)
        mR, mD = _f23_ar1(500 + j, T, 30.0, 1.0), _f23_ar1(600 + j, T, 30.0, 1.0)
        eR, eD = 0.4 * _f23_normals(700 + j, T), 0.4 * _f23_normals(800 + j, T)
        dG = -1.0 - 1.0 * _f23_np.cos(el * _F23_D2R) ** 2
        nan = _f23_np.where(ok, 1.0, _f23_np.nan)
        R[nm] = _f23_np.round(base + mR + eR) * nan
        A[nm] = _f23_np.round(base + mR + eD - 0.8) * nan
        B[nm] = _f23_np.round(base + dG + mD + eD - 0.8) * nan
        ELS[nm] = el
    dA = _f23_np.nanmean([A[n] - R[n] for n in names], axis=0)
    dB = _f23_np.nanmean([B[n] - R[n] for n in names], axis=0)
    return names, R, dA, dB


_F23_SBS = _f23_sbs_data()


def _f23_rx_box(o, x, y, w, t, c):
    o.append(RECT(x, y, w, 22, 5, soft(c), c, 1.2))
    o.append(T(x + w / 2, y + 15, t, "middle", 9.5, c, True))


def _f23_sbs_fig():
    o = []
    names, R, dA, dB = _F23_SBS
    # (a) 分配器
    _f23_ttl(o, 10, 18, "(a) 分配器で 1 つのアンテナを分ける")
    o.append(_f23_ant(60, 34, SIG))
    o.append(W(60, 50, 60, 62, c=SIG, lw=1.4))
    o.append(RECT(30, 62, 60, 22, 5, PAN, SIG, 1.3))
    o.append(T(60, 77, "分配器", "middle", 9.5, SIG, True))
    o.append(W(44, 84, 44, 98, c=SIG, lw=1.3)); o.append(W(76, 84, 76, 98, 150, 98, 150, 104, c=SIG, lw=1.3))
    _f23_rx_box(o, 10, 104, 74, "基準の受信機", GRN)
    _f23_rx_box(o, 106, 104, 88, "機器の受信機", GLD)
    o.append(TX(10, 144, "差 = 受信機の部分（N_0 の差）", "start", 9.5, INK, True))
    # (b) 並べる
    _f23_ttl(o, 10, 178, "(b) 自分のアンテナのまま並べる")
    o.append(_f23_ant(50, 196, SIG))
    o.append(W(50, 212, 50, 232, c=SIG, lw=1.3))
    _f23_rx_box(o, 10, 232, 80, "基準の受信機", GRN)
    o.append(RECT(118, 190, 104, 70, 8, "none", GLD, 1.3, dash="4 3"))
    o.append(T(170, 274, "機器（筐体）", "middle", 9.5, GLD, True))
    o.append(_f23_ant(170, 198, GLD, 0.85))
    o.append(W(170, 212, 170, 232, c=GLD, lw=1.3))
    _f23_rx_box(o, 128, 232, 84, "機器の受信機", GLD)
    o.append(T(10, 298, "差 = 受信機 + アンテナ・筐体・", "start", 9.5, INK, True))
    o.append(T(10, 312, "放射で入るノイズ", "start", 9.5, INK, True))
    # (c) 基準の受信機の C/N0
    o.append(TX(262, 18, "(c) 基準の受信機の C/N_0（衛星ごと、10 s の平均）", "start", 11.5, INK, True))
    p = Plot(306, 32, 384, 112, (0, 30), (30, 50))
    o.append(p.axes(yl="C/N_0 [dB-Hz]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[30, 40, 50], xfmt=lambda v: ""))
    cols = [SIG, GRN, GLD, PUR, TEA, ALI, MUT, INK]
    for j, nm in enumerate(names):
        v = R[nm]
        pts = []
        for k in range(0, 1800, 10):
            w = v[k:k + 10]
            if _f23_np.all(w == w):
                pts.append(((k + 5) / 60, float(w.mean())))
            elif pts:
                o.append(p.line(pts, c=cols[j % len(cols)], lw=1.0)); pts = []
        if pts:
            o.append(p.line(pts, c=cols[j % len(cols)], lw=1.0))
    # (d) 差
    o.append(TX(262, 178, "(d) 機器 − 基準（見えている衛星の平均）", "start", 11.5, INK, True))
    q = Plot(306, 192, 384, 112, (0, 30), (-5, 1))
    o.append(q.axes(xl="時間 [分]", yl="差 [dB]", xt=[0, 5, 10, 15, 20, 25, 30], yt=[-5, -4, -3, -2, -1, 0, 1]))
    o.append(q.line([((k + 5) / 60, float(dB[k:k + 10].mean())) for k in range(0, 1800, 10)], c=GLD, lw=0.8))
    for arr, c in ((dB, GLD), (dA, SIG)):
        st = [(m, float(arr[m * 60:(m + 1) * 60].mean())) for m in range(30)]
        o.append(q.steps(st + [(30, st[-1][1])], c=c, lw=2.0))
    mA, mB = float(_f23_np.mean(dA)), float(_f23_np.mean(dB))
    o.append(T(q.X(30) - 4, q.Y(mA) - 8, "分配器: 1 分の平均（30 分で %s dB）" % _f23_f(mA, 2), "end", 9.5, SIG, True, halo=True))
    o.append(T(q.X(30) - 4, q.Y(-4.55), "並べる: 1 分の平均（細い線は 10 s。30 分で %s dB）" % _f23_f(mB, 2), "end", 9.5, GLD, True, halo=True))
    return SVG(700, 340, o, "基準の受信機と並べて C/N0 を比べる 2 つの方法と、30 分の例（モデル。機器は受信機の雑音の密度が 0.8 dB 高く、"
               "自分のアンテナは低い仰角ほど利得が小さい例。GSV と同じく、どの値も整数に丸めた）。")


F["e23_sbs"] = _f23_sbs_fig()


# =====================================================================
# 2 節: 入力の電力 [dBm] と C/N0 [dB-Hz] の目盛（空から受けるときと、シミュレータをつなぐとき）
# =====================================================================
def _f23_scale_fig():
    o = []
    x0, x1, P0, P1 = 74, 664, -165.0, -120.0
    X = lambda P: x0 + (P - P0) / (P1 - P0) * (x1 - x0)
    ys = 50
    rows = [(ys + 104, "シミュレータから", "入力 290 K", _F23_N0SIM, PUR), (ys + 192, "空から", "アンテナ 100 K", _F23_N0SKY, SIG)]
    # 例の受信機のしきい値（追尾 17 dB-Hz・捕捉 32 dB-Hz）の点線（文字より先に描き、文字の縁取りで隠す）
    th = []
    for cth, nm, c in ((_F23_CACQ, "捕捉", ALI), (_F23_CTRK, "追尾", GLD)):
        Ps = [cth + rows[0][3], cth + rows[1][3]]
        th.append((cth, nm, c, Ps))
        for (y, _, _, n0, _), P in zip(rows, Ps):
            o.append(W(X(P), ys + 4, X(P), y, c=c, lw=1.3, dash="4 3"))
    # dBm の目盛
    o.append(T(14, ys - 28, "受信機の RF の入力の電力 C [dBm]（衛星 1 機あたり）", "start", 11, INK, True))
    o.append(W(x0, ys, x1, ys, c=INK, lw=1.4))
    for P in range(-165, -119, 5):
        o.append(W(X(P), ys - 5, X(P), ys + 5, c=INK, lw=1.1))
        o.append(T(X(P), ys - 9, "%d" % P, "middle", 9.5, INK))
    for P in range(-165, -120):
        o.append(W(X(P), ys - 2.5, X(P), ys + 2.5, c=MUT, lw=0.7))
    o.append(D(X(-128.5), ys, GRN, 4))
    o.append(T(X(-128.5), ys + 32, "規格の最小値 −128.5（3 章）", "middle", 9.5, GRN, True, halo=True))
    # C/N0 の目盛 2 本
    for y, nm, sub, n0, c in rows:
        o.append(TX(14, y - 30, "%s（%s、N_0 = %s dBm/Hz）: C/N_0 [dB-Hz] = C − N_0" % (nm, sub, _f23_f(n0, 1)), "start", 10.5, c, True, halo=True))
        for lo, hi, lab in ((30, 35, "捕捉（代表値）"), (15, 20, "符号の追尾（代表値）")):
            o.append(RECT(X(lo + n0), y - 12, X(hi + n0) - X(lo + n0), 24, 0, soft(c), "none", 0, op=0.7))
            o.append(T((X(lo + n0) + X(hi + n0)) / 2, y + 24, lab, "middle", 9, c, False, halo=True))
        o.append(W(x0, y, x1, y, c=c, lw=1.4))
        for cn in range(10, 51, 5):
            P = cn + n0
            if P0 <= P <= P1:
                o.append(W(X(P), y - 5, X(P), y + 5, c=c, lw=1.1))
                o.append(T(X(P), y - 9, "%d" % cn, "middle", 9.5, c, True, halo=True))
    for cth, nm, c, Ps in th:
        for (y, _, _, n0, _), P in zip(rows, Ps):
            o.append(D(X(P), y, c, 4))
            o.append(D(X(P), ys, c, 3.5))
        o.append(T(X(Ps[0]) + 4, ys + 18, "%s %s" % (nm, _f23_f(Ps[0], 1)), "start", 9.5, c, True, halo=True))
        o.append(T(X(Ps[1]) - 4, ys + 18, _f23_f(Ps[1], 1), "end", 9.5, c, True, halo=True))
        o.append(DARR(X(Ps[1]), ys + 30, X(Ps[0]), ys + 30, c=c, lw=1.2))
        o.append(T((X(Ps[0]) + X(Ps[1])) / 2, ys + 43, "3.2 dB", "middle", 9, c, True, halo=True))
        o.append(TX(X(Ps[1]) + 6, rows[1][0] + 44, "%s C/N_0 = %d dB-Hz" % (nm, cth), "start", 9.5, c, True))
    return SVG(700, 304, o, "例の受信機（3 章 5 節の 1 段の例、雑音温度 75.1 K）の、入力の電力と C/N0 の目盛。帯は 3 章 6 節の代表値、"
               "点線は例の受信機のしきい値（捕捉 32 dB-Hz・追尾 17 dB-Hz）。N0 はボルツマン定数 ×（入力の雑音温度 + 75.1 K）。")


F["e23_scale"] = _f23_scale_fig()


# =====================================================================
# 2 節: GNSS シミュレータで信号を下げていく試験（追尾感度・捕捉感度）
# =====================================================================
def _f23_wilson(k, n, z=1.96):
    if n == 0:
        return 0.0, 1.0
    p = k / n
    c = (p + z * z / (2 * n)) / (1 + z * z / n)
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return max(0.0, c - h), min(1.0, c + h)


def _f23_steps_fig():
    o = []
    # (a) 構成
    _f23_ttl(o, 10, 18, "(a) 試験の構成")
    o.append(BOX(14, 30, 132, 40, "GNSS シミュレータ", "8 機・同じ電力", c=PUR, fill=PSOFT, sz=10.5, ssz=9))
    o.append(ARR(148, 50, 178, 50, c=PUR, lw=1.6))
    o.append(BOX(180, 30, 132, 40, "減衰器とケーブル", "損失を測っておく", c=MUT, fill=PAN, sz=10.5, ssz=9))
    o.append(ARR(314, 50, 344, 50, c=PUR, lw=1.6))
    o.append(BOX(346, 30, 120, 40, "受信機", "RF の入力", c=SIG, fill=SSOFT, sz=10.5, ssz=9))
    o.append(ARR(468, 50, 498, 50, c=SIG, lw=1.6))
    o.append(T(483, 44, "文", "middle", 9, SIG, True))
    o.append(BOX(500, 30, 188, 40, "PC", "電力の設定・電源・記録・判定", c=MUT, fill=PAN, sz=10.5, ssz=9))
    o.append(W(594, 72, 594, 82, 80, 82, 80, 72, c=MUT, lw=1.2, dash="4 3"))
    o.append(_head(80, 82, 80, 72, MUT, 6))
    o.append(T(337, 94, "1 段ごとに電力を下げる・電源を入れ直す", "middle", 9.5, MUT, halo=True))
    # (b) 追尾感度
    last, rows, cnt = _F23_TRK
    n = len(cnt)
    _f23_ttl(o, 10, 124, "(b) 追尾感度（1 dB 刻み・1 段 60 s）")
    p = Plot(64, 140, 300, 150, (0, n / 60.0), (-160, -128))
    o.append(p.axes(yl="入力の電力 [dBm]", xt=[0, 5, 10, 15, 20, 25], yt=[-160, -150, -140, -130], xfmt=lambda v: ""))
    pts = []
    for i, (P, _, _) in enumerate(rows):
        pts += [(i, P), (i + 1, P)]
    o.append(p.line(pts, c=PUR, lw=2.0))
    for v in (20, 30, 40):
        P = v + _F23_N0SIM
        o.append(T(p.x + p.w + 6, p.Y(P) + 3.5, "%d" % v, "start", 9, PUR))
    o.append(TX(p.x + p.w + 34, p.y + p.h / 2, "C/N_0 [dB-Hz]", "middle", 10, PUR, rot=90))
    o.append(W(p.x, p.Y(_F23_CTRK + _F23_N0SIM), p.x + p.w, p.Y(_F23_CTRK + _F23_N0SIM), c=GLD, lw=1.1, dash="4 3"))
    o.append(T(p.x + 6, p.Y(_F23_CTRK + _F23_N0SIM) + 13, "モデルのしきい値 %s dBm" % _f23_f(_F23_CTRK + _F23_N0SIM, 1), "start", 9.5, GLD, True, halo=True))
    o.append(D(p.X(rows.index([r for r in rows if r[0] == last][0]) + 1), p.Y(last), GRN, 4.2))
    o.append(T(p.X(rows.index([r for r in rows if r[0] == last][0]) + 1) - 8, p.Y(last) - 6, "読んだ値 %s dBm" % _f23_f(last, 0), "end", 9.5, GRN, True, halo=True))
    q = Plot(64, 304, 300, 56, (0, n / 60.0), (0, 8))
    o.append(q.axes(xl="時間 [分]", yl="追う機数", xt=[0, 5, 10, 15, 20, 25], yt=[0, 4, 8]))
    o.append(q.steps([(k / 60.0, cnt[k]) for k in range(0, n, 5)] + [(n / 60.0, cnt[-1])], c=SIG, lw=1.6))
    o.append(W(q.x, q.Y(4), q.x + q.w, q.Y(4), c=ALI, lw=1, dash="3 3"))
    # (c) 捕捉感度
    lastA, rowsA = _F23_ACQ
    _f23_ttl(o, 420, 124, "(c) 捕捉感度（1 段 10 回のコールドスタート）")
    r = Plot(462, 140, 222, 196, (-148, -134), (0, 1))
    o.append(r.axes(xl="入力の電力 [dBm]", yl="位置が出た割合", xt=[-148, -144, -140, -136], yt=[0, 0.5, 0.9, 1.0],
                    yfmt=lambda v: "%d %%" % round(v * 100)))
    curve = [(P / 10.0, _f23_pfix(P / 10.0 - _F23_N0SIM)) for P in range(-1480, -1339, 2)]
    o.append(r.line(curve, c=MUT, lw=1.4, dash="5 3"))
    for P, k in rowsA:
        lo, hi = _f23_wilson(k, 10)
        o.append(W(r.X(P), r.Y(lo), r.X(P), r.Y(hi), c=SIG, lw=1.0, dash="2 2"))
        o.append(D(r.X(P), r.Y(k / 10), SIG, 3.4))
    o.append(W(r.x, r.Y(0.9), r.x + r.w, r.Y(0.9), c=ALI, lw=1, dash="3 3"))
    o.append(D(r.X(lastA), r.Y(1.0), GRN, 4.5))
    o.append(T(r.X(lastA) + 6, r.Y(1.0) + 16, "読んだ値 %s dBm" % _f23_f(lastA, 0), "start", 9.5, GRN, True, halo=True))
    o.append(T(r.X(-141.9), r.Y(0.5), "モデル", "end", 9.5, MUT, True, halo=True))
    return SVG(700, 396, o, "GNSS シミュレータで電力を下げる試験の例（モデル。例の受信機のしきい値は追尾 17 dB-Hz・捕捉 32 dB-Hz、N0 = −173.0 dBm/Hz。"
               "(b) の右の目盛は C/N0、(c) の縦の線は 95 % の信頼区間）。")


F["e23_steps"] = _f23_steps_fig()


# =====================================================================
# 3 節: スタートの条件のそろえ方と、1 回の手順
# =====================================================================
def _f23_reset_fig():
    o = []
    _f23_ttl(o, 10, 18, "(a) 電源を入れたときに保っている情報と、条件の作り方（考え方。命令の形は製品による）")
    cols = ["時刻・位置", "アルマナック", "エフェメリス", "TCXO のずれ"]
    xs = [146, 214, 282, 350]
    for x, c in zip(xs, cols):
        o.append(T(x, 44, c, "middle", 9.5, INK, True))
    rows = [("コールド", [0, 0, 0, 0], "全部を消す命令。または主の電源とバックアップ", "電源を切り、保つ電気がなくなるまで待つ", "25〜35 s"),
            ("ウォーム", [1, 1, 0, 1], "エフェメリスだけを消す命令。または、バック", "アップ電源を保って 4 時間より長く切る", "25〜30 s"),
            ("ホット", [1, 1, 1, 1], "15 分ほど追尾してから、バックアップ電源を", "保ったまま短く（例: 10 s）切る", "1〜2 s")]
    for r, (nm, keep, l1, l2, tt) in enumerate(rows):
        y = 64 + r * 40
        o.append(RECT(14, y - 4, 676, 36, 6, PAN if r % 2 else SCR, LIN, 0.8))
        o.append(T(24, y + 18, nm, "start", 11, INK, True))
        for x, k in zip(xs, keep):
            o.append(CIRC(x, y + 14, 7.5, c=GRN if k else MUT, lw=1.5, fill=GRN if k else SCR))
        o.append(T(392, y + 10, l1, "start", 9.5, INK))
        o.append(T(392, y + 24, l2, "start", 9.5, INK))
        o.append(T(684, y + 18, tt, "end", 10, PUR, True))
    o.append(T(684, 44, "TTFF（5 章）", "end", 9.5, PUR, True))
    o.append(CIRC(150, 196, 6, c=GRN, lw=1.4, fill=GRN))
    o.append(T(160, 200, "保つ", "start", 9.5, MUT))
    o.append(CIRC(204, 196, 6, c=MUT, lw=1.4, fill=SCR))
    o.append(T(214, 200, "無い・消す", "start", 9.5, MUT))
    # (b) 1 回の手順
    _f23_ttl(o, 10, 232, "(b) 1 回の手順（PC が電源と記録を自動で動かす）")
    x0, x1 = 30, 676
    t0, t1 = -14.0, 52.0
    X = lambda t: x0 + (t - t0) / (t1 - t0) * (x1 - x0)
    y = 270
    segs = [(-14, -4, "切っている", MUT), (-4, 0, "待つ", MUT), (0, 33.9, "電源を入れてから位置が出るまで（TTFF）", GRN),
            (33.9, 36, "記録", SIG), (36, 52, "乱数の待ち（0〜30 s）", GLD)]
    for a, b, lab, c in segs:
        o.append(RECT(X(a), y, X(b) - X(a), 22, 2, soft(c), c, 1.1))
        if X(b) - X(a) > tw(lab, 9.5) + 6:
            o.append(T((X(a) + X(b)) / 2, y + 15, lab, "middle", 9.5, c, True))
    o.append(W(X(0), y - 12, X(0), y + 34, c=INK, lw=1.6))
    o.append(T(X(0), y - 16, "電源を入れた時刻", "middle", 9.5, INK, True))
    o.append(W(X(33.9), y - 12, X(33.9), y + 34, c=INK, lw=1.6))
    o.append(T(X(33.9), y - 16, "測位の品質が位置ありの最初の GGA を受け終えた時刻", "middle", 9.5, INK, True))
    o.append(DIM(X(0), y + 40, X(33.9), y + 40, "TTFF = 2 つの時刻の差（GGA の位置の遅れ 0.2 s を含む）", c=GRN, above=False))
    o.append(T(X(52), y + 64, "→ 次の回", "end", 9.5, MUT))
    return SVG(700, 344, o, "TTFF の条件をそろえる考え方と、1 回の手順（TTFF は 5 章 5 節の代表値。乱数の待ちは、電源を入れる時刻を航法メッセージの 30 s のフレームに対してばらつかせるため）。")


F["e23_reset"] = _f23_reset_fig()


# =====================================================================
# 3 節: TTFF の分布・推定のばらつき・回数と上限
# =====================================================================
_F23_TT_OPEN = _f23_ttff("cold", "open", 100, 1)
_F23_TT_BLK = _f23_ttff("cold", "blocked", 100, 1)
_F23_TT_REP = {n: _f23_ttff_rep("cold", "blocked", n, 1000, 1) for n in (10, 30, 100)}
_F23_TT_TRUE = (lambda v: (_f23_med(v), _f23_q(v, 0.95)))(_f23_ttff("cold", "blocked", 20000, 99))


def _f23_hist(o, p, v, bw, c):
    lo = p.xr[0]
    cnt = {}
    for x in v:
        b = int(math.floor((x - lo) / bw))
        cnt[b] = cnt.get(b, 0) + 1
    for b, k in cnt.items():
        a = lo + b * bw
        o.append(RECT(p.X(a) + 0.5, p.Y(k), max(1.0, p.X(a + bw) - p.X(a) - 1), p.Y(0) - p.Y(k), 0, soft(c), c, 0.8))
    return max(cnt.values())


def _f23_vline(o, p, x, c, lab, dy, a="start", dash="4 3"):
    o.append(W(p.X(x), p.y, p.X(x), p.y + p.h, c=c, lw=1.5, dash=dash))
    o.append(T(p.X(x) + (4 if a == "start" else -4), p.y + dy, lab, a, 9.5, c, True, halo=True))


def _f23_ttffdist_fig():
    o = []
    for k, (v, ttl, bw, xr, ymax) in enumerate(((_F23_TT_OPEN, "(a) 開けた空（9 機）", 1.0, (15, 75), 16),
                                                (_F23_TT_BLK, "(b) 一部が遮られた空（5 機・読み誤り 10 %）", 1.0, (15, 75), 16))):
        y0 = 22 + k * 168
        _f23_ttl(o, 10, y0, ttl)
        p = Plot(56, y0 + 14, 290, 108, xr, (0, ymax))
        o.append(p.axes(xl="TTFF [s]" if k == 1 else None, yl="回数", xt=[20, 30, 40, 50, 60, 70], yt=[0, 5, 10, 15],
                        xfmt=(lambda q: "%d" % q) if k == 1 else (lambda q: "%d" % q)))
        _f23_hist(o, p, v, bw, SIG)
        m, q95 = _f23_med(v), _f23_q(v, 0.95)
        mu = sum(v) / len(v)
        sd = math.sqrt(sum((x - mu) ** 2 for x in v) / (len(v) - 1))
        _f23_vline(o, p, 40, PUR, "仕様 40 s", 12, "start", "2 2")
        _f23_vline(o, p, m, GLD, "中央値 %s" % _f23_f(m, 1), 26, "end")
        _f23_vline(o, p, q95, ALI, "95 %% %s" % _f23_f(q95, 1), 40, "start" if k == 1 else "end")
        o.append(DARR(p.X(max(xr[0], mu - 2 * sd)), p.y + p.h - 10, p.X(mu + 2 * sd), p.y + p.h - 10, c=INK, lw=1.0, head=5))
        o.append(T(p.X(mu + 2 * sd) + 4, p.y + p.h - 6, "平均 ± 2σ", "start", 9, INK, False, halo=True))
    # (c) 推定のばらつき
    _f23_ttl(o, 382, 22, "(c) 推定のばらつき（(b) の空、各 1000 回）")
    r = Plot(426, 40, 262, 124, (30, 80), (0.5, 3.5))
    o.append(r.axes(xl="推定した値 [s]", xt=[30, 40, 50, 60, 70, 80], yt=[1, 2, 3], yfmt=lambda q: {3: "10 回", 2: "30 回", 1: "100 回"}[int(q)]))
    for j, n in enumerate((10, 30, 100)):
        rep = _F23_TT_REP[n]
        yy = 3 - j
        for idx, c, dy in ((0, GLD, 0.17), (1, ALI, -0.17)):
            vals = [q[idx] for q in rep]
            a, b, mm = _f23_q(vals, 0.05), _f23_q(vals, 0.95), _f23_med(vals)
            o.append(W(r.X(a), r.Y(yy + dy), r.X(b), r.Y(yy + dy), c=c, lw=5))
            o.append(D(r.X(mm), r.Y(yy + dy), INK, 2.6))
    for x, c in ((_F23_TT_TRUE[0], GLD), (_F23_TT_TRUE[1], ALI)):
        o.append(W(r.X(x), r.y, r.X(x), r.y + r.h, c=c, lw=1, dash="3 3"))
    o.append(LEGL(400, 214, [(GLD, None, "中央値の推定"), (ALI, None, "95 % の値の推定")], 9.5, 12))
    o.append(T(400, 228, "帯は 5〜95 % の範囲、点は中央値、点線は 20 000 回の値", "start", 9, MUT))
    # (d) 回数と上限
    _f23_ttl(o, 382, 262, "(d) 超える割合の上限（95 %）")
    s = Plot(426, 276, 262, 86, (10, 200), (0, 0.3), xlog=True)
    o.append(s.axes(xl="回数 N_t（対数の目盛）", xt=[10, 20, 50, 100, 200], yt=[0, 0.05, 0.1, 0.2, 0.3], yfmt=lambda q: "%g %%" % round(q * 100)))
    for k, c in ((0, GRN), (1, GLD), (2, ALI)):
        pts = [(n, _f23_pu(k, n)) for n in range(max(10, k + 1), 201)]
        o.append(s.clip(pts, c=c, lw=1.8))
    o.append(W(s.x, s.Y(0.05), s.x + s.w, s.Y(0.05), c=PUR, lw=1.1, dash="4 3"))
    for k, n, c in ((0, 59, GRN), (1, 93, GLD), (2, 124, ALI)):
        o.append(D(s.X(n), s.Y(0.05), c, 3.6))
        o.append(T(s.X(n), s.Y(0.05) - 7, "%d" % n, "middle", 9, c, True, halo=True))
    o.append(LEGL(426, 412, [(GRN, None, "超えた 0 回"), (GLD, None, "1 回"), (ALI, None, "2 回")], 9.5, 10))
    return SVG(700, 420, o, "TTFF の分布と推定（5 章 5 節のモデルのコールドスタートを 100 回。(b) は見えている衛星が 5 機で、各サブフレームを 10 % の確率で読み誤る例）。"
               "(c) は同じ回数の試験を 1000 回くり返したときの推定のばらつき、(d) は超えた回の数ごとの、超える割合の 95 % の上限（クロッパー・ピアソン）。")


F["e23_ttffdist"] = _f23_ttffdist_fig()


# =====================================================================
# 4 節: 基準点と、1 エポックの誤差の計算
# =====================================================================
_F23_REFB, _F23_REFL, _F23_REFH = 35.681000, 139.767000, 40.000     # 基準点の標識（例の値。楕円体高 [m]）
_F23_HANT, _F23_HPC = 1.500, 0.060                                   # 標識からアンテナの基準の面まで・受ける点まで [m]（例の値）


def _f23_refpt_fig():
    o = []
    _f23_ttl(o, 10, 18, "(a) 基準点の上にアンテナを置く（横から見た図）")
    gy = 236
    o.append(W(20, gy, 300, gy, c=MUT, lw=1.6))
    for x in range(26, 300, 14):
        o.append(W(x, gy, x - 8, gy + 8, c=FNT, lw=0.8))
    mx = 150
    o.append(RECT(mx - 9, gy - 5, 18, 5, 1, soft(GRN), GRN, 1.2))
    o.append(T(mx + 16, gy + 20, "基準点の標識（座標が分かっている）", "middle", 9.5, GRN, True))
    ay = 104
    o.append(W(mx, ay + 16, mx - 46, gy, c=MUT, lw=1.4))
    o.append(W(mx, ay + 16, mx + 46, gy, c=MUT, lw=1.4))
    o.append(W(mx, ay + 16, mx, gy - 6, c=MUT, lw=1.2, dash="2 2"))
    o.append(_f23_ant(mx, ay - 8, SIG, 1.1))
    o.append(D(mx, ay - 13, ALI, 3.2))
    o.append(T(mx - 24, ay - 6, "アンテナの受ける点", "end", 9.5, ALI, True, halo=True))
    o.append(DIM(mx + 66, ay + 1, mx + 66, gy - 3, "%.3f m（測る）" % _F23_HANT, c=INK))
    o.append(W(mx + 26, ay + 1, mx + 72, ay + 1, c=FNT, lw=0.9, dash="2 2"))
    o.append(DIM(mx + 66, ay - 13, mx + 66, ay + 1, None, c=ALI))
    o.append(T(mx + 74, ay - 3, "%.3f m（資料）" % _F23_HPC, "start", 9.5, ALI, True))
    o.append(W(mx + 4, ay - 13, mx + 72, ay - 13, c=FNT, lw=0.9, dash="2 2"))
    for ang in (-58, -20, 30):
        dx, dy = math.sin(ang * _F23_D2R), -math.cos(ang * _F23_D2R)
        o.append(ARR(mx + 92 * dx, ay - 13 + 92 * dy, mx + 12 * dx, ay - 13 + 12 * dy, c=SIG, lw=1.0, head=5, dash="4 3"))
    o.append(T(40, 150, "アンテナの高さ", "start", 9.5, MUT))
    o.append(T(40, 164, "= 標識から受ける点", "start", 9.5, MUT))
    o.append(T(40, 178, "まで %.3f m" % (_F23_HANT + _F23_HPC), "start", 9.5, MUT))
    # (b) 計算の流れ
    _f23_ttl(o, 330, 18, "(b) 1 エポックの誤差の計算（例の値）")
    lat, lon, alt, sep = 35 + 40.86132 / 60, 139 + 46.01862 / 60, 6.1, 36.7
    e, n, u = enu(_F23_REFB, _F23_REFL, _F23_REFH + _F23_HANT + _F23_HPC, geod2ecef(lat, lon, alt + sep))
    steps = [("GGA の欄", ["緯度 3540.86132 N・経度 13946.01862 E", "標高 %.1f m・ジオイド高 %.1f m" % (alt, sep)], SIG),
             ("楕円体高に戻す", ["h = 標高 + ジオイド高 = %.1f m" % (alt + sep), "（受信機の中の粗いジオイドを使わない）"], SIG),
             ("基準点（受ける点）との差", ["受ける点 = 標識 + %.3f m（h = %.3f m）" % (_F23_HANT + _F23_HPC, _F23_REFH + _F23_HANT + _F23_HPC),
                                     "ECEF の差を、基準点の東・北・上に回す（6 章 6 節）"], GLD),
             ("東・北・上の誤差", ["δe = %s m・δn = %s m・δu = %s m" % (_f23_f(e, 2), _f23_f(n, 2), _f23_f(u, 2)),
                             "d_h = √(δe^2 + δn^2) = %s m → CEP・R95・2DRMS" % _f23_f(math.hypot(e, n), 2)], GRN)]
    y = 32
    for k, (t1, lines, c) in enumerate(steps):
        o.append(RECT(330, y, 358, 50, 7, soft(c), c, 1.2))
        o.append(T(340, y + 15, t1, "start", 10, c, True))
        for i, l in enumerate(lines):
            o.append(TX(340, y + 30 + i * 13, l, "start", 9.5, INK))
        if k < len(steps) - 1:
            o.append(ARR(509, y + 51, 509, y + 61, c=MUT, lw=1.3, head=6))
        y += 62
    return SVG(700, 290, o, "基準点で機器の位置の誤差を求める例（基準点の座標・アンテナの高さ・GGA の値は例の値。座標系と、その座標を決めた時期をそろえておく）。")


F["e23_refpt"] = _f23_refpt_fig()


# =====================================================================
# 4 節: 静止の記録（24 時間）と、その中の 10 分
# =====================================================================
_F23_WIN = (43800, 600)     # 例の 10 分（12:10 から）


def _f23_static_fig():
    o = []
    d = _F23_REC
    w0, wl = _F23_WIN
    win = d[w0:w0 + wl]
    # (a) 時間の変化
    _f23_ttl(o, 10, 18, "(a) 東・北の誤差（1 分ごとに表示）と HDOP")
    p = Plot(56, 30, 630, 120, (0, 24), (-15, 15))
    o.append(p.axes(yl="誤差 [m]", xt=[0, 3, 6, 9, 12, 15, 18, 21, 24], yt=[-10, 0, 10], xfmt=lambda v: ""))
    k = _f23_np.arange(0, 86400, 60)
    o.append(p.clip([(i / 3600, float(d[i, 0])) for i in k], c=SIG, lw=0.9))
    o.append(p.clip([(i / 3600, float(d[i, 1])) for i in k], c=GLD, lw=0.9))
    o.append(RECT(p.X(w0 / 3600) - 1.5, p.y, p.X((w0 + wl) / 3600) - p.X(w0 / 3600) + 3, p.h, 0, PSOFT, PUR, 1.2))
    o.append(T(p.X((w0 + wl) / 3600) + 5, p.y + 12, "例の 10 分（12:10〜12:20）", "start", 9.5, PUR, True, halo=True))
    o.append(LEGL(62, p.y + 12, [(SIG, None, "東 δe"), (GLD, None, "北 δn")], 9.5, 12))
    h = Plot(56, 160, 630, 34, (0, 24), (0.8, 1.6))
    o.append(h.axes(xl="時刻 [時間]", yl="HDOP", xt=[0, 3, 6, 9, 12, 15, 18, 21, 24], yt=[0.8, 1.6], yfmt=lambda v: "%.1f" % v))
    o.append(h.steps([(i / 60.0, float(_F23_HDOP[i])) for i in range(1440)] + [(24, float(_F23_HDOP[-1]))], c=TEA, lw=1.2))
    # (b) 散らばり
    _f23_ttl(o, 10, 256, "(b) 水平の散らばり")
    lim = 15
    s = Plot(64, 268, 200, 200, (-lim, lim), (-lim, lim))
    o.append(RECT(s.x, s.y, s.w, s.h, 3, SCR, LIN, 1))
    o.append(s.axes(xt=[-15, -10, -5, 0, 5, 10, 15], yt=[-15, -10, -5, 0, 5, 10, 15], sz=9))
    for i in range(0, 86400, 40):
        x, y = float(d[i, 0]), float(d[i, 1])
        if abs(x) < lim and abs(y) < lim:
            o.append(D(s.X(x), s.Y(y), GLD, 0.9))
    for i in range(0, wl, 2):
        o.append(D(s.X(float(win[i, 0])), s.Y(float(win[i, 1])), PUR, 1.2))
    st = _F23_ST
    for r, c, dash in ((st["cep"], SIG, None), (st["r95"], ALI, None), (st["d2"], INK, "5 3")):
        o.append(s.clip([(r * math.cos(a), r * math.sin(a)) for a in _f23_np.linspace(0, 2 * math.pi, 97)], c=c, lw=1.6, dash=dash))
    o.append(W(s.X(0) - 5, s.Y(0), s.X(0) + 5, s.Y(0), c=GRN, lw=2.2))
    o.append(W(s.X(0), s.Y(0) - 5, s.X(0), s.Y(0) + 5, c=GRN, lw=2.2))
    me, mn = float(win[:, 0].mean()), float(win[:, 1].mean())
    o.append(ARR(s.X(0), s.Y(0), s.X(me), s.Y(mn), c=PUR, lw=1.6, head=6))
    o.append(T(s.x + s.w / 2, s.y + s.h + 28, "東（横）・北（縦）[m]", "middle", 9.5, MUT))
    o.append(LEGL(64, s.y + s.h + 46, [(SIG, None, "CEP"), (ALI, None, "R95"), (INK, "5 3", "2DRMS")], 9.5, 10))
    # (c) 数
    wst = _f23_stats(win)
    spr = lambda q: _f23_med(_f23_np.hypot(q[:, 0] - q[:, 0].mean(), q[:, 1] - q[:, 1].mean()))
    _f23_ttl(o, 300, 256, "(c) 記録から計算した値 [m]")
    rows = [("", "24 時間", "例の 10 分"), ("CEP（基準点のまわり）", _f23_f(st["cep"], 2), _f23_f(wst["cep"], 2)),
            ("R95", _f23_f(st["r95"], 2), _f23_f(wst["r95"], 2)), ("2DRMS", _f23_f(st["d2"], 2), _f23_f(wst["d2"], 2)),
            ("上下の 95 %", _f23_f(st["v95"], 1), _f23_f(wst["v95"], 1)),
            ("記録の中心のずれ", _f23_f(math.hypot(st["me"], st["mn"]), 2), _f23_f(math.hypot(me, mn), 2)),
            ("中心のまわりの 50 %", _f23_f(spr(d), 2), _f23_f(spr(win), 2))]
    for i, (a, b, c) in enumerate(rows):
        y = 284 + i * 24
        if i:
            o.append(W(300, y - 16, 688, y - 16, c=LIN, lw=0.8))
        o.append(T(306, y, a, "start", 10, INK, i == 0))
        o.append(T(560, y, b, "end", 10.5, GLD if i else INK, True, i > 0))
        o.append(T(672, y, c, "end", 10.5, PUR if i else INK, True, i > 0))
    o.append(T(306, 284 + 7 * 24, "7 章の 24 時間の中央値の見積もり: CEP %s・R95 %s・上下 %s" % (_f23_f(_F23_CH7["cep"], 2), _f23_f(_F23_CH7["r95"], 2), _f23_f(_F23_CH7["v95"], 1)),
             "start", 9.5, MUT))
    return SVG(700, 532, o, "静止の記録（モデル。1 秒ごとに 24 時間。ゆっくり変わる誤差 3.83 m・相関の時間 30 分と、速く変わる誤差 1.12 m を、"
               "その時刻の衛星の並びの形にした）。(b) の点は 40 s ごとに表示し、紫は例の 10 分、矢印はその中心。")


F["e23_static"] = _f23_static_fig()


# =====================================================================
# 4 節: 記録の長さと、平均と CEP・R95 の推定のばらつき
# =====================================================================
def _f23_var_mean(T, tau=_F23_TAU):
    x = tau / T
    return 2 * x * (1 - x * (1 - math.exp(-T / tau)))


def _f23_mc_mean(T, nrec=200):
    """1 次の自己回帰（標準偏差 1・相関の時間 30 分）の長さ T の平均の標準偏差（数値の計算）。"""
    dt = 1.0 if T <= 3600 else 10.0
    n = int(round(T / dt))
    phi = math.exp(-dt / _F23_TAU)
    s = math.sqrt(1 - phi * phi)
    ms = []
    for r in range(nrec):
        z = _f23_normals(77000 + 131 * r + n, n)
        y = _f23_np.empty(n)
        y[0] = z[0]
        y[1:] = _f23_lfilter([s], [1, -phi], z[1:], zi=[phi * z[0]])[0]
        ms.append(float(y.mean()))
    return float(_f23_np.std(ms))


def _f23_length_fig():
    o = []
    o.append(TX(10, 18, "(a) 記録の平均の標準偏差（σ_y を 1 とした）", "start", 11.5, INK, True))
    p = Plot(62, 34, 250, 200, (0.1, 100), (0.05, 2), xlog=True, ylog=True)
    o.append(p.axes(xl="T_{rec}/τ_c（対数の目盛）", yl="標準偏差 / σ_y", xt=[0.1, 1, 10, 100], yt=[0.1, 1], xfmt=lambda v: "%g" % v, yfmt=lambda v: "%g" % v))
    xs = [10 ** (k / 40) for k in range(-40, 81)]
    o.append(p.line([(x, math.sqrt(_f23_var_mean(x * _F23_TAU))) for x in xs], c=SIG, lw=2.0))
    o.append(p.clip([(x, math.sqrt(2 / x)) for x in xs if x >= 0.5], c=GLD, lw=1.3, dash="5 3"))
    o.append(p.line([(0.1, 1), (100, 1)], c=MUT, lw=1.0, dash="2 2"))
    for TT, lab in _F23_LENS:
        x = TT / _F23_TAU
        o.append(D(p.X(x), p.Y(_f23_mc_mean(TT)), ALI, 3.6))
        o.append(T(p.X(x), p.Y(math.sqrt(_f23_var_mean(TT))) + (16 if x < 1 else -9), lab, "middle", 9, INK, True, halo=True))
    o.append(TX(p.X(4), p.Y(math.sqrt(2 / 4)) - 30, "√(2τ_c/T_{rec})", "start", 9.5, GLD, True, halo=True))
    o.append(T(p.X(0.12), p.Y(1) - 6, "減らない", "start", 9.5, MUT, True, halo=True))
    o.append(LEGL(62, 286, [(SIG, None, "式"), (ALI, None, "数値の計算（点）")], 9.5, 12))
    # (b) CEP と R95 の推定
    _f23_ttl(o, 360, 18, "(b) 記録から計算した CEP・R95（各 100 本）")
    q = Plot(404, 34, 284, 200, (0.5, 4.5), (0, 12))
    o.append(q.axes(yl="値 [m]", xt=[1, 2, 3, 4], yt=[0, 2, 4, 6, 8, 10, 12], xfmt=lambda v: _F23_LENS[int(v) - 1][1]))
    for (val, c, lab, dy) in ((_F23_MIX["cep"], SIG, "CEP", -0.15), (_F23_MIX["r95"], ALI, "R95", 0.15)):
        o.append(W(q.x, q.Y(val), q.x + q.w, q.Y(val), c=c, lw=1.0, dash="5 3"))
    for (val, c) in ((_F23_CH7["cep"], SIG), (_F23_CH7["r95"], ALI)):
        o.append(W(q.x, q.Y(val), q.x + q.w, q.Y(val), c=c, lw=0.8, dash="1 2"))
    for j, (L, lab) in enumerate(_F23_LENS):
        mc = _F23_MC[L]
        for idx, c, dx in ((0, SIG, -0.15), (1, ALI, 0.15)):
            vals = [m[idx] for m in mc]
            a, b, m = _f23_q(vals, 0.05), _f23_q(vals, 0.95), _f23_med(vals)
            x = j + 1 + dx
            o.append(W(q.X(x), q.Y(a), q.X(x), q.Y(min(b, 12)), c=c, lw=5))
            o.append(D(q.X(x), q.Y(m), INK, 2.6))
    o.append(T(q.X(2.5), q.Y(_F23_MIX["r95"]) - 5, "多くの日の値 %s" % _f23_f(_F23_MIX["r95"], 2), "middle", 9, ALI, True, halo=True))
    o.append(T(q.X(2.5), q.Y(_F23_MIX["cep"]) - 5, "多くの日の値 %s" % _f23_f(_F23_MIX["cep"], 2), "middle", 9, SIG, True, halo=True))
    o.append(LEGL(372, 270, [(SIG, None, "CEP"), (ALI, None, "R95"), (INK, "5 3", "多くの日の値"), (INK, "1 2", "7 章の中央値")], 9.5, 8))
    o.append(T(372, 286, "帯は 5〜95 %、点は中央値（始める時刻と乱数を変えた 100 本）", "start", 9, MUT))
    return SVG(700, 296, o, "記録の長さと推定のばらつき。(a) 相関の時間 τc の誤差の平均（点は 200 本の数値の計算）、(b) 図の静止の記録のモデルの CEP・R95"
               "（6 時間と 24 時間は 10 s ごとの値で計算）。")


F["e23_length"] = _f23_length_fig()


# =====================================================================
# 4 節: 動きながら測る（基準の軌跡との差と、時刻のずれ）
# =====================================================================
def _f23_moving_fig():
    o = []
    _f23_ttl(o, 10, 18, "(a) 基準の軌跡と機器の位置（例の道、10 m/s）")
    sc = 1.15        # 1 m あたりの px
    ox, oy = 40, 250
    X = lambda e: ox + e * sc
    Y = lambda n: oy - n * sc
    # 建物（北へ向かう道の両側）
    for (e0, n0, e1, n1) in ((130, 40, 180, 170), (214, 40, 250, 118)):
        o.append(RECT(X(e0), Y(n1), (e1 - e0) * sc, (n1 - n0) * sc, 2, MSOFT, MUT, 0.8))
    o.append(T(X(155), Y(160), "高い建物", "middle", 9, MUT, True, halo=True))
    # 道（基準の軌跡）: 東へ 200 m → 北へ 170 m
    o.append(PL([(X(e), Y(n)) for e, n in ((0.0, 0.0), (200.0, 0.0), (200.0, 175.0))], c=GRN, lw=2.4))
    # 機器の位置（1 s ごと）: ゆっくり揺れる誤差（相関の時間 20 s・1.5 m）と、建物の間の NLOS（東へ 10 m）
    z = _f23_ar1(2311, 38, 20.0, 1.5)
    z2 = _f23_ar1(2312, 38, 20.0, 1.5)
    pts = []
    for t in range(38):
        dist = 10.0 * t
        e, n = (dist, 0.0) if dist <= 200 else (200.0, min(175.0, dist - 200))
        nl = 10.0 if (e == 200.0 and 45 < n < 165) else 0.0
        pts.append((e + z[t] + nl, n + z2[t], e, n))
    for e, n, _, _ in pts:
        o.append(D(X(e), Y(n), GLD, 2.4))
    # 1 点の誤差を分ける（t = 34 s、北へ 140 m の所）
    e1, n1, e0, n0 = pts[34]
    o.append(ARR(X(e0), Y(n0), X(e1), Y(n1), c=ALI, lw=1.6, head=6))
    o.append(W(X(e0), Y(n0), X(e0), Y(n1), c=PUR, lw=1.3, dash="3 2"))
    o.append(W(X(e0), Y(n1), X(e1), Y(n1), c=TEA, lw=1.3, dash="3 2"))
    o.append(T(X(e1) + 6, Y(n1) + 4, "横 %s m" % _f23_f(e1 - e0, 1), "start", 9.5, TEA, True, halo=True))
    o.append(T(X(e0) - 6, Y(n1) - 4, "進む向き %s m" % _f23_f(n1 - n0, 1), "end", 9.5, PUR, True, halo=True))
    o.append(T(X(226), Y(100), "NLOS で", "start", 9.5, ALI, True, halo=True))
    o.append(T(X(226), Y(100) + 13, "横にずれる", "start", 9.5, ALI, True, halo=True))
    o.append(LEGL(30, 288, [(GRN, None, "基準の軌跡（RTK と慣性センサ）"), (GLD, "1 3", "機器の位置（1 s ごと）")], 9.5, 12))
    o.append(DIM(X(0), Y(60), X(50), Y(60), "50 m", c=MUT))
    # (b) 時刻のずれ
    _f23_ttl(o, 380, 18, "(b) 時刻の対応のずれによる誤差（進む向き）")
    p = Plot(426, 34, 256, 200, (0, 30), (0, 12))
    o.append(p.axes(xl="速さ [m/s]", yl="誤差 [m]", xt=[0, 10, 20, 30], yt=[0, 4, 8, 12]))
    o.append(RECT(p.x, p.Y(_F23_ST["cep"]), p.w, p.Y(0) - p.Y(_F23_ST["cep"]), 0, GSOFT, "none", 0))
    o.append(T(p.x + 6, p.Y(_F23_ST["cep"]) + 12, "静止の CEP（4 節の例）まで", "start", 9, GRN, True, halo=True))
    for dt_, c in ((0.05, SIG), (0.2, GLD), (1.0, ALI)):
        o.append(p.clip([(v, v * dt_) for v in (0, 30)], c=c, lw=2.0))
        vend = min(30, 11.5 / dt_)
        o.append(T(p.X(vend) - 4, p.Y(vend * dt_) - 6, "%g s" % dt_, "end", 9.5, c, True, halo=True))
    o.append(D(p.X(20), p.Y(4), GLD, 4))
    o.append(T(p.X(20) - 6, p.Y(4) - 8, "20 m/s・0.2 s で 4 m", "end", 9.5, GLD, True, halo=True))
    return SVG(700, 300, o, "動く機器の精度の測り方（例の道と誤差はモデル）。(b) の線は、時刻の対応のずれ（0.05・0.2・1 s）× 速さ。")


F["e23_moving"] = _f23_moving_fig()


# =====================================================================
# 4 節: 1PPS を基準の 1PPS と比べる
# =====================================================================
_F23_TQ = 1e9 / 48e6                 # 受信機のパルスの刻み [ns]（14 章の例: 48 MHz）
_F23_NU = (48.0 * 0.501) % 1.0       # 14 章 4 節の図の 1 つ目（発振器の誤差 0.501 ppm）: 端数 0.048
_F23_D0 = 15.16 + 6.3                # 一定の差: ケーブル 3 m の違い 15.2 ns（14 章 4 節）+ 受信機の中の遅れの違い 6.3 ns（例の値）
_F23_SE = 2.0                        # 受信機ごとの揺れ [ns]（例の値）


def _f23_pps(seed=1, n=3600, x0=0.3):
    """1 秒ごとの差 Δt_k [ns]（補正値なし・あり・量子化誤差）。"""
    g = _F23Rng(seed)
    out = []
    for k in range(n):
        x = x0 + k * _F23_NU
        q = _F23_TQ * (math.floor(x + 0.5) - x)
        e = _F23_SE * g.normal()
        out.append((_F23_D0 + q + e, _F23_D0 + e, q))
    return _f23_np.array(out)


_F23_PPS = _f23_pps()


def _f23_pps_fig():
    o = []
    a = _F23_PPS
    _f23_ttl(o, 10, 18, "(a) 構成（分配器で 1 つのアンテナを 2 台に分ける）")
    o.append(_f23_ant(36, 36, SIG))
    o.append(W(36, 52, 36, 62, c=SIG, lw=1.3))
    o.append(RECT(10, 62, 52, 20, 4, PAN, SIG, 1.2))
    o.append(T(36, 76, "分配器", "middle", 9, SIG, True))
    o.append(W(36, 82, 36, 96, 80, 96, c=SIG, lw=1.3))
    o.append(W(36, 82, 36, 136, 80, 136, c=SIG, lw=1.3))
    o.append(BOX(82, 84, 116, 26, "基準の受信機", None, c=GRN, fill=GSOFT, sz=9.5))
    o.append(BOX(82, 124, 116, 26, "機器", None, c=GLD, fill=GOSOFT, sz=9.5))
    o.append(ARR(200, 97, 252, 97, c=GRN, lw=1.5))
    o.append(T(226, 92, "1PPS", "middle", 9, GRN, True))
    o.append(ARR(200, 137, 252, 137, c=GLD, lw=1.5))
    o.append(T(226, 132, "1PPS", "middle", 9, GLD, True))
    o.append(BOX(254, 80, 112, 70, "時間間隔カウンタ", "始め: 基準のパルス 止め: 機器のパルス", c=PUR, fill=PSOFT, sz=10, ssz=9))
    o.append(ARR(310, 152, 310, 186, c=PUR, lw=1.4))
    o.append(TX(316, 174, "Δt_k", "start", 9.5, PUR, True))
    o.append(W(140, 152, 140, 196, 254, 196, c=GLD, lw=1.2, dash="3 3"))
    o.append(T(146, 190, "補正値（文）", "start", 9, GLD))
    o.append(BOX(254, 188, 100, 24, "PC（記録）", None, c=MUT, fill=PAN, sz=9.5))
    # (b) 時間の変化
    o.append(TX(380, 18, "(b) 差 Δt_k の 1 秒ごとの値（最初の 120 s）", "start", 11.5, INK, True))
    p = Plot(424, 32, 262, 160, (0, 120), (0, 40))
    o.append(p.axes(xl="時間 [s]", yl="Δt_k [ns]", xt=[0, 30, 60, 90, 120], yt=[0, 10, 20, 30, 40]))
    for k in range(120):
        o.append(D(p.X(k), p.Y(a[k, 0]), ALI, 1.8))
        o.append(D(p.X(k), p.Y(a[k, 1]), GRN, 1.8))
    o.append(W(p.x, p.Y(_F23_D0), p.x + p.w, p.Y(_F23_D0), c=INK, lw=1, dash="4 3"))
    o.append(TX(p.x + 6, p.y + 12, "点線は一定の差 Δt_0 = %s ns（1 時間の平均）" % _f23_f(float(a[:, 1].mean()), 1), "start", 9.5, INK, True, halo=True))
    o.append(LEGL(424, 248, [(ALI, None, "補正値なし"), (GRN, None, "補正値あり")], 9.5, 12))
    # (c) 分布
    _f23_ttl(o, 10, 250, "(c) 1 時間の分布（一定の差を引いた値）")
    q = Plot(56, 266, 300, 100, (-16, 16), (0, 0.24))
    o.append(q.axes(xl="Δt_k − Δt_0 [ns]", yl="割合", xt=[-15, -10, -5, 0, 5, 10, 15], yt=[0, 0.1, 0.2], yfmt=lambda v: "%g" % v))
    for j, c in ((0, ALI), (1, GRN)):
        v = a[:, j] - a[:, j].mean()
        h, edges = _f23_np.histogram(v, bins=_f23_np.arange(-16, 16.01, 1.0))
        h = h / len(v)
        pts = []
        for i in range(len(h)):
            pts += [(edges[i], h[i]), (edges[i + 1], h[i])]
        o.append(q.clip(pts, c=c, lw=1.6))
        r95 = _f23_q(_f23_np.abs(v), 0.95)
        for sg in (-1, 1):
            o.append(W(q.X(sg * r95), q.y, q.X(sg * r95), q.y + q.h, c=c, lw=1.1, dash="3 3"))
        o.append(T(q.X(r95) + 4, q.y + (12 if j == 0 else 26), "95 %%: ±%s" % _f23_f(r95, 1), "start", 9.5, c, True, halo=True))
    o.append(T(390, 290, "マイコンのタイマ（10 MHz）で 2 つの", "start", 9.5, MUT, True))
    o.append(T(390, 304, "パルスを捕獲すると、差は毎秒 0 ns", "start", 9.5, MUT, True))
    o.append(T(390, 318, "（刻み 100 ns より細かい差は見えない）", "start", 9.5, MUT))
    return SVG(700, 412, o, "1PPS の時刻の誤差を測る例（モデル。受信機のパルスの刻み 48 MHz、1 秒の刻みの数の端数 0.048、受信機ごとの揺れ 2 ns の 1σ、"
               "一定の差はケーブル 3 m の 15.2 ns と中の遅れ 6.3 ns。どれも例の値）。")


F["e23_pps"] = _f23_pps_fig()


# =====================================================================
# 5 節: 信号の 4 つの入れ方
# =====================================================================
def _f23_inject_fig():
    o = []
    cols = [("空と周り", "衛星・反射・妨害"), ("アンテナ", "と筐体"), ("受信機", "RF・相関・位置"), ("文", "NMEA"), ("ファーム", "ウェア")]
    cx = [176, 262, 348, 434, 520]
    cw = 80
    o.append(T(14, 22, "入れ方", "start", 10.5, INK, True))
    for x, (a, b) in zip(cx, cols):
        o.append(T(x, 16, a, "middle", 10, INK, True))
        o.append(T(x, 29, b, "middle", 9, MUT))
    o.append(T(570, 16, "同じ条件を", "start", 10, INK, True))
    o.append(T(570, 29, "何度でも", "start", 10, INK, True))
    o.append(T(636, 22, "", "start", 10, INK, True))
    st = {"R": (GRN, "本物"), "S": (PUR, "作った"), "K": (GLD, "記録"), "N": (MUT, "使わない")}
    rows = [("屋外", "RRRRR", "できない", "全部（出荷の前）"),
            ("GNSS シミュレータ", "SNRRR", "できる", "感度・TTFF・直す前後"),
            ("RF の記録の再生", "KKRRR", "できる", "ビル街・車の精度"),
            ("NMEA の記録の再生", "KKKKR", "できる", "解析・状態（15 章）")]
    for r, (nm, code, rep, what) in enumerate(rows):
        y = 44 + r * 50
        o.append(RECT(10, y, 680, 44, 6, PAN if r % 2 else SCR, LIN, 0.8))
        o.append(T(18, y + 27, nm, "start", 10.5, INK, True))
        for x, ch in zip(cx, code):
            c, lab = st[ch]
            o.append(RECT(x - cw / 2 + 3, y + 8, cw - 6, 28, 5, soft(c) if ch != "N" else SCR, c, 1.2, dash="4 3" if ch == "N" else None))
            o.append(T(x, y + 26, lab, "middle", 9.5, c, True))
        # 作った信号・記録した信号を入れる所
        k = {0: None, 1: 2, 2: 2, 3: 4}[r]
        if k is not None:
            xa = cx[k] - cw / 2
            o.append(ARR(xa - 8, y + 4, xa + 2, y + 14, c=ALI, lw=1.6, head=6))
        o.append(T(570, y + 20, rep, "start", 10, GRN if rep == "できる" else ALI, True))
        o.append(T(570, y + 35, what, "start", 9, INK))
    o.append(LEGEND(14, 262, [(GRN, "本物"), (PUR, "作った信号"), (GLD, "記録した信号・文"), (MUT, "使わない（ケーブルでつなぐ）")], 9.5, 14))
    o.append(ARR(470, 254, 482, 262, c=ALI, lw=1.6, head=6))
    o.append(T(488, 263, "入れる所", "start", 9.5, ALI, True))
    return SVG(700, 274, o, "受信機に入れる信号の 4 つの作り方と、どの段が本物か（シミュレータは、電波を外に漏らさない部屋でアンテナに向けて出せば、アンテナも本物になる）。")


F["e23_inject"] = _f23_inject_fig()


# =====================================================================
# 5 節: RF の記録と再生
# =====================================================================
def _f23_rfrec_fig():
    o = []
    _f23_ttl(o, 10, 18, "(a) 記録（上）と再生（下）")
    top = [(12, 80, "アンテナ", None, SIG), (104, 104, "LNA・周波数を", "下げる", SIG), (220, 108, "A/D 変換", "16.368 MHz・2 bit", SIG),
           (340, 96, "記憶装置", "1 時間 14.7 GB", GLD)]
    for x, w, a, b, c in top:
        o.append(BOX(x, 30, w, 42, a, b, c=c, fill=soft(c), sz=10, ssz=9))
    for (x1, w1, *_), (x2, *_) in zip(top[:-1], top[1:]):
        o.append(ARR(x1 + w1 + 1, 51, x2 - 1, 51, c=SIG, lw=1.5))
    bot = [(340, 96, "記憶装置", None, GLD), (220, 108, "D/A 変換", None, PUR), (104, 104, "周波数を上げる", "1575.42 MHz", PUR),
           (12, 80, "減衰器", "電力を合わせる", PUR)]
    for x, w, a, b, c in bot:
        o.append(BOX(x, 96, w, 42, a, b, c=c, fill=soft(c), sz=10, ssz=9))
    for (x1, w1, *_), (x2, w2, *_) in zip(bot[:-1], bot[1:]):
        o.append(ARR(x1 - 1, 117, x2 + w2 + 1, 117, c=PUR, lw=1.5))
    o.append(W(388, 72, 388, 96, c=GLD, lw=1.4, dash="3 2"))
    o.append(ARR(52, 140, 52, 162, c=PUR, lw=1.5))
    o.append(BOX(12, 164, 140, 30, "機器の RF の入力", None, c=GLD, fill=GOSOFT, sz=10))
    o.append(T(166, 178, "記録した日の空（反射・妨害も）を", "start", 9.5, INK))
    o.append(T(166, 192, "何度でも同じに流せる", "start", 9.5, INK))
    # (b) データ量
    _f23_ttl(o, 456, 18, "(b) 1 時間のデータ量（対数の目盛）")
    items = [("NMEA の文", 626 * 3600, TEA, "2.25 MB"), ("RF: L1・1 bit", 16.368e6 * 1 / 8 * 3600, SIG, "7.4 GB"),
             ("RF: L1・2 bit", 16.368e6 * 2 / 8 * 3600, SIG, "14.7 GB"), ("RF: L1+L5・2 bit", (16.368e6 + 40.92e6) * 2 / 8 * 3600, PUR, "51.6 GB")]
    p = Plot(560, 34, 120, 130, (1e6, 1e11), (0, 4), xlog=True)
    for v in (1e6, 1e8, 1e10):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 14, {1e6: "1 MB", 1e8: "100 MB", 1e10: "10 GB"}[v], "middle", 9, MUT))
    for i, (nm, v, c, lab) in enumerate(items):
        y = p.y + 6 + i * 32
        o.append(T(p.x - 6, y + 13, nm, "end", 9.5, INK, True))
        o.append(RECT(p.x, y, p.X(v) - p.x, 18, 2, soft(c), c, 1.1))
        big = p.X(v) - p.x > tw(lab, 9) + 8
        o.append(T(p.X(v) - 4 if big else p.X(v) + 4, y + 13, lab, "end" if big else "start", 9, c, True, halo=True))
    o.append(W(p.x, p.y, p.x, p.y + p.h, c=MUT, lw=1.2))
    o.append(T(456, 212, "サンプリング周波数 × ビット数 × 3600 s ÷ 8", "start", 9, MUT))
    o.append(T(456, 225, "（L5 は 40.92 MHz で標本にする例）", "start", 9, MUT))
    # (c) C/N0
    _f23_ttl(o, 10, 232, "(c) 再生した信号の C/N0（例）")
    o.append(TX(14, 256, "記録の装置で C/N_0 45.0 dB-Hz の信号 → 2 bit の量子化（4 章 3 節、−0.7 dB）で 44.3 dB-Hz として記録 → 再生しても、これより良くならない", "start", 9.5, INK))
    o.append(T(14, 272, "機器のアンテナと筐体・置き方は、記録した装置のもの（機器のアンテナの影響は確かめられない）", "start", 9.5, INK))
    return SVG(700, 284, o, "RF の記録と再生の例（4 章 3 節の例の受信機の中間周波数と標本化。量は例の値）。")


F["e23_rfrec"] = _f23_rfrec_fig()


# =====================================================================
# 6 節: 試験の計画（条件 × 項目）
# =====================================================================
def _f23_plan_fig():
    o = []
    items = ["感度・C/N0", "TTFF", "位置の精度", "時刻", "消費電流"]
    cx = [198, 312, 426, 540, 640]
    cwid = [108, 108, 108, 108, 84]
    for x, t in zip(cx, items):
        o.append(TX(x, 22, t.replace("C/N0", "C/N_0"), "middle", 10.5, INK, True))
    M = {"F": GRN, "S": PUR, "R": GLD}
    rows = [("開けた空", "基準になる条件", [("F", "基準と並べる 10 分"), ("S", "−130 dBm・59 回"), ("F", "基準点 24 h × 2 日"), ("F", "基準の 1PPS 1 h"), ("F", "状態ごと")]),
            ("都市（ビル街）", "空が狭い・NLOS", [("R", "走った日を再生"), ("F", "30 回"), ("F", "走る → R で再生"), None, None]),
            ("屋内・窓際", "信号が弱い", [("S", "−140〜−160 dBm"), ("S", "−145 dBm・59 回"), None, ("F", "見えない間を保つ"), ("F", "捕捉の繰り返し")]),
            ("車", "動き・トンネル", [("R", "走った日を再生"), None, ("F", "基準の軌跡"), None, None]),
            ("温度", "−20〜60 °C（例）", [("S", "恒温槽の中"), ("S", "恒温槽・各 30 回"), None, ("S", "見えない間を保つ"), ("F", "各温度")])]
    for r, (nm, sub, cells) in enumerate(rows):
        y = 36 + r * 50
        o.append(RECT(10, y, 680, 44, 6, PAN if r % 2 else SCR, LIN, 0.8))
        o.append(T(18, y + 19, nm, "start", 10.5, INK, True))
        o.append(T(18, y + 34, sub, "start", 9, MUT))
        for x, w, cell in zip(cx, cwid, cells):
            if cell is None:
                o.append(T(x, y + 27, "—", "middle", 10, FNT))
                continue
            m, t = cell
            c = M[m]
            o.append(RECT(x - w / 2, y + 7, w, 30, 5, soft(c), c, 1.1))
            o.append(T(x, y + 26, t, "middle", 9, INK, True))
    o.append(LEGEND(14, 302, [(GRN, "屋外（本物の空）"), (PUR, "GNSS シミュレータ"), (GLD, "RF の記録の再生")], 9.5, 16))
    o.append(T(690, 302, "— は、その条件で特に測らない項目", "end", 9, MUT))
    return SVG(700, 312, o, "試験の計画の例（条件 × 項目。枠の色は方法、文字は量。値は例の値）。")


F["e23_plan"] = _f23_plan_fig()


# =====================================================================
# 6 節: 合否の判定（分布の決めた % の点）
# =====================================================================
def _f23_cdf_pts(v):
    s = sorted(v)
    n = len(s)
    pts = [(s[0], 0.0)]
    for i, x in enumerate(s):
        pts += [(x, i / n), (x, (i + 1) / n)]
    return pts


def _f23_judge_fig():
    o = []
    ok = lambda b: ("合格", GRN) if b else ("不合格", ALI)
    # (a) TTFF
    v = _f23_ttff("cold", "open", 59, 1)
    _f23_ttl(o, 10, 18, "(a) TTFF（コールド、59 回）")
    p = Plot(54, 32, 168, 140, (15, 45), (0, 1))
    o.append(p.axes(xl="TTFF [s]", yl="それ以下の割合", xt=[20, 30, 40], yt=[0, 0.5, 0.95], yfmt=lambda q: "%d %%" % round(q * 100)))
    o.append(p.clip(_f23_cdf_pts(v) + [(45, 1.0)], c=GRN, lw=1.8))
    o.append(W(p.X(40), p.Y(0.95), p.X(40), p.y + p.h, c=PUR, lw=1.2, dash="3 2"))
    o.append(W(p.x, p.Y(0.95), p.X(40), p.Y(0.95), c=PUR, lw=1.2, dash="3 2"))
    o.append(D(p.X(40), p.Y(0.95), PUR, 4))
    t, c = ok(max(v) <= 40)
    o.append(T(p.X(17), p.Y(0.82), "仕様 40 s・95 %", "start", 9.5, PUR, True, halo=True))
    o.append(T(p.X(17), p.Y(0.68), "59 回とも以内 → %s" % t, "start", 9.5, c, True, halo=True))
    o.append(T(p.X(17), p.Y(0.54), "（下限 %s %%）" % _f23_f(100 * (1 - _f23_pu(0, 59)), 1), "start", 9.5, c, False, halo=True))
    # (b) 水平の誤差
    d = _F23_REC
    dh = _f23_np.hypot(d[:, 0], d[:, 1])
    _f23_ttl(o, 246, 18, "(b) 水平の誤差（24 時間）")
    q = Plot(288, 32, 168, 140, (0, 16), (0, 1))
    o.append(q.axes(xl="d_h [m]", yl="", xt=[0, 5, 10, 15], yt=[0, 0.5, 0.95], yfmt=lambda x: "%d %%" % round(x * 100)))
    srt = _f23_np.sort(dh[::10])
    o.append(q.clip([(float(x), (i + 1) / len(srt)) for i, x in enumerate(srt)], c=GLD, lw=1.8))
    for sv, sp in ((5.0, 0.5), (10.0, 0.95)):
        o.append(W(q.X(sv), q.Y(sp), q.X(sv), q.y + q.h, c=PUR, lw=1.2, dash="3 2"))
        o.append(W(q.x, q.Y(sp), q.X(sv), q.Y(sp), c=PUR, lw=1.2, dash="3 2"))
        o.append(D(q.X(sv), q.Y(sp), PUR, 4))
    t, c = ok(_F23_ST["cep"] <= 5 and _F23_ST["r95"] <= 10)
    o.append(T(q.X(15.5), q.Y(0.3), "CEP %s・R95 %s" % (_f23_f(_F23_ST["cep"], 2), _f23_f(_F23_ST["r95"], 2)), "end", 9.5, GLD, True, halo=True))
    o.append(T(q.X(15.5), q.Y(0.16), "仕様 5 m・10 m → %s" % t, "end", 9.5, c, True, halo=True))
    # (c) 1PPS
    a = _F23_PPS
    _f23_ttl(o, 482, 18, "(c) 1PPS（1 時間）")
    r = Plot(522, 32, 164, 140, (0, 16), (0, 1))
    o.append(r.axes(xl="|Δt_k − Δt_0| [ns]", yl="", xt=[0, 5, 10, 15], yt=[0, 0.5, 0.95], yfmt=lambda x: "%d %%" % round(x * 100)))
    res = []
    for j, cc in ((0, ALI), (1, GRN)):
        dv = _f23_np.sort(_f23_np.abs(a[:, j] - a[:, j].mean()))
        o.append(r.clip([(float(x), (i + 1) / len(dv)) for i, x in enumerate(dv)], c=cc, lw=1.8))
        res.append(_f23_q(dv, 0.95))
    o.append(W(r.X(10), r.Y(0.95), r.X(10), r.y + r.h, c=PUR, lw=1.2, dash="3 2"))
    o.append(W(r.x, r.Y(0.95), r.X(10), r.Y(0.95), c=PUR, lw=1.2, dash="3 2"))
    o.append(D(r.X(10), r.Y(0.95), PUR, 4))
    o.append(T(r.X(15.5), r.Y(0.30), "補正値あり → 合格", "end", 9.5, GRN, True, halo=True))
    o.append(T(r.X(15.5), r.Y(0.16), "なし ±%s → 不合格" % _f23_f(res[0], 1), "end", 9.5, ALI, True, halo=True))
    o.append(T(12, 220, "紫の点が仕様（値と割合）。曲線（それ以下になる割合）が点より上（左）を通れば合格。", "start", 9.5, MUT))
    return SVG(700, 230, o, "測った分布で合否を決める例（この章のモデルの値。仕様は例の値）。")


F["e23_judge"] = _f23_judge_fig()
