# -*- coding: utf-8 -*-
# 11 章 PID の調整と現場の問題 の図
import numpy as _f11_np
from scipy import signal as _f11_sg

# =====================================================================
# 補助
# =====================================================================
def _f11_f(v, d=2):
    """小数 d 桁（負号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f11_g(v, d=3):
    """有効数字 d 桁（負号は −）。"""
    return (("%." + str(d) + "g") % v).replace("-", "−")


# 例の対象（制御対象 P(s) = num/den·e^{−Ls}。値はどれも例の値）
_F11_PL = {
    "plate": ([1.25], [500.0, 1.0], 20.0),                       # 温度の板 [K/W]（周りの温度との差）
    "cart": ([1.0], [1.0, 2.0], 0.1),                            # 台車の速度（測った値が 0.1 s 遅れて届く）
    "mpos": ([2e6], [1.0, 2000.0, 40000.0, 0.0], 0.0),           # モータの位置（巻線のインダクタンスを含む）[rad/V]
    "mspd": ([50.0], [0.05, 1.0], 0.0),                          # モータの角速度 [(rad/s)/V]
}


def _f11_disc(num, den, h):
    A, B, C, D = _f11_sg.tf2ss(num, den)
    Ad, Bd, _, _, _ = _f11_sg.cont2discrete((A, B, C, D), h, method="zoh")
    return Ad, Bd[:, 0], _f11_np.atleast_2d(C)[0], float(_f11_np.atleast_2d(D)[0, 0])


def _f11_sim(P, KP=0.0, TI=None, TD=0.0, N=10.0, b=1.0, dmode="y", tEnd=1.0, n=20000, r=0.0, d=None, noise=None,
             umin=None, umax=None, aw="none", Tt=None, u0=0.0, I0=None, manual=None, track="none",
             gains=None, gin=True, gbump=False, relay=None, every=None):
    """フィードバック系を刻み h = tEnd/n で数値計算する（共通部品 SIMLOOP と同じ約束: 対象は零次ホールドで離散化し、
    むだ時間は操作量（外乱を足したもの）を刻みの数だけ遅らせる。Y = P(U + D)）。SIMLOOP に無い次のものを扱う。
    制御器は標準形の PID: P の分 K_P(b r − y_m)、I の分 I（積分の中にゲインを入れて足す）、D の分は不完全微分
    T_D s/(1 + (T_D/N)s) を後退差分で（dmode="y" なら測定値の微分、"e" なら偏差の微分）。y_m は制御量に観測ノイズを足したもの。
    umin・umax: 飽和。aw: "none"（対策なし）・"clamp"（張り付いて外へ向かう間は積分しない）・"back"（逆算して戻す。時定数 Tt）。
    manual(t): 値を返す間は手動（操作量をその値にする）。track: "none"（手動の間も積分はそのまま）・"init"（自動に戻す時刻に
    操作量が続くように積分を決め直す）・"track"（手動の間ずっと、積分を操作量に合わせ続ける）。
    gains(t): (K_P, T_I, T_D) を返すと、その時刻からゲインを変える。gin=False なら I の分を (K_P/T_I)∫e dt で作る（ゲインを
    変えると I の分が跳ねる形）。gbump=True なら K_P を変えたとき P の分の跳ねを積分で打ち消す。
    relay=(h, ε, u_b): 制御器の代わりにリレー（偏差が ε を越えたら u_b + h、−ε を下回ったら u_b − h）。
    u0: 始めに操作量 u0 で落ち着いているとする（対象の状態とむだ時間の中身を u0 にそろえる）。
    返り値: 辞書（t, y, ym, u（実際の操作量）, uc（制御器が計算した値）, P, I, D, e）。"""
    np = _f11_np
    num, den, L = P
    h = tEnd / n
    ev = every or max(1, int(round(n / 1000)))
    Ad, Bd, Cp, Dp = _f11_disc(num, den, h)
    nd = int(round(L / h))
    xp = _f11_np.zeros(Ad.shape[0])
    if u0:
        xp = _f11_np.linalg.solve(_f11_np.eye(Ad.shape[0]) - Ad, Bd * u0)
    buf = _f11_np.full(max(1, nd), float(u0)); bi = 0
    rf = r if callable(r) else (lambda t, _v=r: _v)
    kp, ti, td = KP, TI, TD
    I = I0 if I0 is not None else None
    S = 0.0                      # gin=False のときの ∫e dt
    Df, sp = 0.0, None
    rs = 1                       # リレーの向き
    was_man = False
    out = {k: [] for k in ("t", "y", "ym", "u", "uc", "P", "I", "D", "e")}
    ua = float(u0)
    for k in range(n + 1):
        t = k * h
        if nd:
            ua = buf[bi]
        y = float(Cp @ xp)
        ym = y + (noise(t, k) if noise else 0.0)
        rr = rf(t)
        e = rr - ym
        if gains is not None:
            g = gains(t)
            if g is not None and (g[0] != kp or g[1] != ti or g[2] != td):
                if gbump and I is not None:
                    I += (kp - g[0]) * (b * rr - ym)
                kp, ti, td = g
                if not gin and ti:
                    I = kp / ti * S
        if relay is not None:
            hh, eps, ub = relay
            if e > eps:
                rs = 1
            elif e < -eps:
                rs = -1
            uc = ub + rs * hh; u = uc; Pp = 0.0; Df = 0.0; mv = None
        else:
            Pp = kp * (b * rr - ym)
            if td:
                Tf = td / N
                sig = -ym if dmode == "y" else e
                if sp is None:
                    sp = sig
                Df = Tf / (Tf + h) * Df + kp * td / (Tf + h) * (sig - sp)
                sp = sig
            else:
                Df = 0.0
            if I is None:            # 始めの積分: 操作量 u0 で落ち着いていた状態（偏差 0）から続くように
                I = float(u0) if ti else 0.0
            if k == 0 and not gin and ti and kp:
                S = I * ti / kp
            uc = Pp + I + Df
            mv = manual(t) if manual is not None else None
            if mv is not None:
                u = mv
            else:
                if was_man and track == "init":      # 自動に戻す刻み: 操作量が続くように積分を決め直す
                    I = u_prev - Pp - Df; uc = u_prev
                u = uc
            if umax is not None and u > umax:
                u = umax
            if umin is not None and u < umin:
                u = umin
        if k % ev == 0:
            for kk, vv in zip(("t", "y", "ym", "u", "uc", "P", "I", "D", "e"), (t, y, ym, u, uc, Pp, I if I is not None else 0.0, Df, e)):
                out[kk].append(vv)
        u_prev = u
        if relay is None and ti:
            if mv is not None:
                if track == "track":                 # 手動の間は、出している操作量に合わせ続ける
                    I = u - Pp - Df
            elif gin:
                inc = kp * h / ti * e
                if aw == "clamp" and ((uc > (umax if umax is not None else _f11_np.inf) and e > 0) or
                                      (uc < (umin if umin is not None else -_f11_np.inf) and e < 0)):
                    inc = 0.0
                if aw == "back" and Tt:
                    inc += h / Tt * (u - uc)
                I += inc
            else:
                S += h * e
                I = kp / ti * S
        was_man = mv is not None
        uin = u + (d(t) if d else 0.0)
        if nd:
            buf[bi] = uin; bi = (bi + 1) % nd
        else:
            ua = uin
        if not _f11_np.isfinite(y) or abs(y) > 1e9:
            break
        xp = Ad @ xp + Bd * ua
    return {k: _f11_np.array(v) for k, v in out.items()}


def _f11_pid_tf(KP, TI=None, TD=0.0, N=10.0):
    """標準形の PID（不完全微分）の伝達関数の (分子, 分母)。"""
    np = _f11_np
    if not TI and not TD:
        return [KP], [1.0]
    if not TD:
        return [KP * TI, KP], [TI, 0.0]
    Tf = TD / N
    if not TI:
        return [KP * (Tf + TD), KP], [Tf, 1.0]
    return [KP * (TI * Tf + TI * TD), KP * (TI + Tf), KP], [TI * Tf, TI, 0.0]


def _f11_margins(Pn, Pd, L, Cn, Cd, wlo=1e-5, whi=1e5):
    """一巡伝達関数 P C の (ω_gc, 位相余裕 [°], ω_pc, ゲイン余裕 [dB])。最初に横切る所。"""
    np = _f11_np
    num = np.polymul(Pn, Cn); den = np.polymul(Pd, Cd)
    ws = np.logspace(np.log10(wlo), np.log10(whi), 40000)
    db, ph = BODEPH(num, den, ws, L)
    wgc = pm = wpc = gm = None
    for i in range(1, len(ws)):
        if wgc is None and (db[i - 1] - 0) * (db[i] - 0) <= 0 and db[i - 1] != db[i]:
            f = db[i - 1] / (db[i - 1] - db[i]); wgc = ws[i - 1] * (ws[i] / ws[i - 1]) ** f
            pm = 180 + (ph[i - 1] + f * (ph[i] - ph[i - 1]))
        if wpc is None and (ph[i - 1] + 180) * (ph[i] + 180) <= 0 and ph[i - 1] != ph[i]:
            f = (ph[i - 1] + 180) / (ph[i - 1] - ph[i]); wpc = ws[i - 1] * (ws[i] / ws[i - 1]) ** f
            gm = -(db[i - 1] + f * (db[i] - db[i - 1]))
    return wgc, pm, wpc, gm


def _f11_ind(t, y, rf, yf, t0=0.0, band=0.02, ref=None):
    """指標: 行き過ぎ量 [%]（変化の幅 ref に対する割合）、2 % 整定時間（t0 から）、IAE（t0 から）。"""
    np = _f11_np
    t = np.asarray(t); y = np.asarray(y)
    m = t >= t0
    tt, yy = t[m], y[m]
    ref = ref if ref is not None else abs(yf - yy[0])
    sgn = 1.0 if yf >= yy[0] else -1.0
    over = max(0.0, (np.max(sgn * (yy - yf)))) / ref * 100 if ref else 0.0
    out = np.where(np.abs(yy - yf) > band * ref)[0]
    ts = (tt[out[-1] + 1] - t0) if len(out) and out[-1] + 1 < len(tt) else (None if len(out) else 0.0)
    e = np.abs(rf - yy) if not callable(rf) else np.abs(np.array([rf(x) for x in tt]) - yy)
    iae = float(np.trapezoid(e, tt))
    return over, ts, iae
