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
               "点線は例の受信機のしきい値（捕捉 32 dB-Hz・追尾 17 dB-Hz）。N0 = kB（入力の雑音温度 + 75.1 K）。")


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
    o.append(T(X(0), y - 16, "電源を入れる（t_on）", "middle", 9.5, INK, True))
    o.append(W(X(33.9), y - 12, X(33.9), y + 34, c=INK, lw=1.6))
    o.append(T(X(33.9), y - 16, "測位の品質が位置ありの最初の GGA（t_fix）", "middle", 9.5, INK, True))
    o.append(DIM(X(0), y + 40, X(33.9), y + 40, "TTFF = t_fix − t_on（GGA の位置の遅れ 0.2 s を含む）", c=GRN, above=False))
    o.append(T(X(52), y + 64, "→ 次の回", "end", 9.5, MUT))
    return SVG(700, 344, o, "TTFF の条件をそろえる考え方と、1 回の手順（TTFF は 5 章 5 節の代表値。乱数の待ちは、電源を入れる時刻を航法メッセージの 30 s のフレームに対してばらつかせるため）。")


F["e23_reset"] = _f23_reset_fig()
