# -*- coding: utf-8 -*-
# 12 章 根軌跡 の図
import numpy as _f12_np
from scipy import signal as _f12_sig
from scipy.optimize import linear_sum_assignment as _f12_lsa

# =====================================================================
# 補助
# =====================================================================
def _f12_fmt(v):
    return ("%g" % v).replace("-", "−")


def _f12_n(v, d=2):
    """小数点以下 d 桁の文字（負の符号は −）。"""
    s = ("%." + str(d) + "f") % v
    if float(s) == 0:
        s = s.replace("-", "")
    return s.replace("-", "−")


def _f12_sp(p, xt, yt, xl="実部 σ [1/s]", yl="虚部 ω [rad/s]", sz=9, zeta=None, rhp=True):
    """s 平面の地（枠・右半平面の薄い赤・目盛・実軸と虚軸）。"""
    o = [RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8), SPLANE(p, rhp=rhp, zeta=zeta)]
    o.append(p.axes(xl=xl, yl=yl, xt=xt, yt=yt, xfmt=_f12_fmt, yfmt=_f12_fmt, sz=sz))
    o.append(SPLANE(p, rhp=False))
    return "".join(o)


def _f12_zeta(p, z, c=FNT):
    """減衰比 z の線（原点から左上と左下）を枠で切って描く（SPLANE の zeta は枠の外まで伸びるので使わない）。"""
    th = math.acos(z); L = 4 * max(abs(p.xr[0]), abs(p.xr[1]), abs(p.yr[0]), abs(p.yr[1]))
    return "".join(p.clip([(0, 0), (-L * math.cos(th), sg * L * math.sin(th))], c=c, lw=1, dash="4 3") for sg in (1, -1))


def _f12_kgrid(lo, hi, per=200, extra=()):
    """K_c の刻み: 0 と、10^lo〜10^hi を対数の目盛で等しい間隔に（1 桁を per 等分）。extra の値も入れる。"""
    n = int(round((hi - lo) * per)) + 1
    ks = set([0.0] + list(_f12_np.logspace(lo, hi, n)) + [float(e) for e in extra])
    return _f12_np.array(sorted(ks))


def _f12_track(a, b, Ks, nearest=True):
    """a(s) + K b(s) = 0 の根を Ks の各 K で求めて枝ごとに並べる（返り値 R[枝, K の番号]、複素数）。
    nearest=True なら 1 つ前の K の根に近い根を同じ枝につなぐ（距離の和が最小になる対応）。
    False なら根を実部の小さい順（同じなら虚部の小さい順）に並べるだけ（悪い例）。"""
    a = _f12_np.asarray(a, float); b = _f12_np.asarray(b, float)
    rows, prev = [], None
    for K in Ks:
        r = _f12_np.roots(_f12_np.polyadd(a, K * b))
        if not nearest:
            r = _f12_np.sort_complex(r)
        elif prev is not None and len(r) == len(prev):
            C = _f12_np.abs(prev[:, None] - r[None, :])
            i, j = _f12_lsa(C)
            r = r[j[_f12_np.argsort(i)]]
        rows.append(r); prev = r
    return _f12_np.array(rows).T


def _f12_branches(p, R, c=SIG, lw=2.0, dash=None):
    """枝をすべて描く（枠の外は切る）。"""
    return "".join(p.clip([(z.real, z.imag) for z in br], c=c, lw=lw, dash=dash) for br in R)


def _f12_inside(p, z, m=0.0):
    x0, x1 = sorted(p.xr); y0, y1 = sorted(p.yr)
    return x0 + m <= z.real <= x1 - m and y0 + m <= z.imag <= y1 - m


def _f12_heads(p, R, Ks, K0, c=SIG, head=7):
    """各枝の K = K0 の所に、K が増える向きの矢じりを置く（枠の中のものだけ）。"""
    i = int(_f12_np.argmin(_f12_np.abs(_f12_np.asarray(Ks) - K0)))
    o = []
    for br in R:
        if 2 <= i < len(br) - 2:
            a, b = br[i - 2], br[i + 2]
            if _f12_inside(p, br[i]) and abs(p.X(b.real) - p.X(a.real)) + abs(p.Y(b.imag) - p.Y(a.imag)) > 1.5:
                o.append(_head(p.X(a.real), p.Y(a.imag), p.X(b.real), p.Y(b.imag), c, head))
    return "".join(o)


def _f12_cl(a, b, K):
    """閉ループの極（a + K b の根）。"""
    return list(_f12_np.roots(_f12_np.polyadd(_f12_np.asarray(a, float), K * _f12_np.asarray(b, float))))


def _f12_step(num, den, t):
    """伝達関数 num/den の単位ステップ応答。"""
    return _f12_sig.step((num, den), T=t)[1]


def _f12_info(t, y, yf=None):
    """行き過ぎ量 [%] と 2 % 整定時間 [s]。"""
    yf = y[-1] if yf is None else yf
    mp = max(0.0, (max(y) - yf) / yf * 100)
    out = _f12_np.where(_f12_np.abs(y - yf) > 0.02 * abs(yf))[0]
    t2 = t[out[-1] + 1] if len(out) and out[-1] + 1 < len(t) else (0.0 if not len(out) else float("inf"))
    return mp, t2


def _f12_arc(cx, cy, r, a0, a1, c=MUT, lw=1.2):
    """中心 (cx, cy)、半径 r の円弧（角度は度で、正の実軸から反時計回り。a0 から a1 へ）。"""
    import math as _m
    x0, y0 = cx + r * _m.cos(_m.radians(a0)), cy - r * _m.sin(_m.radians(a0))
    x1, y1 = cx + r * _m.cos(_m.radians(a1)), cy - r * _m.sin(_m.radians(a1))
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    return PATH("M%.2f,%.2f A%.2f,%.2f 0 %d %d %.2f,%.2f" % (x0, y0, r, r, large, sweep, x1, y1), c=c, lw=lw)


# 例の値（本文と同じ）
_F12_TD = 0.02 / 0.84           # 10 章 3 節の PD の微分時間 [s]（零点 −42）
_F12_TIPI = 0.21 / 0.5          # 7 章 3 節・10 章 2 節の PI の積分時間 [s]（零点 −2.38）
_F12_MP = ([1.0, 20.0, 0.0], [1000.0])                       # モータの位置: a(s) = s^2 + 20s、b(s) = 1000
_F12_PD = ([1.0, 20.0, 0.0], [1000.0 * _F12_TD, 1000.0])     # PD: b(s) = 1000(T_D s + 1)
_F12_PI = ([_F12_TIPI, 20.0 * _F12_TIPI, 0.0, 0.0], [1000.0 * _F12_TIPI, 1000.0])   # PI: a = T_I s^2(s + 20)
_F12_LA = ([1.0, 2000.0, 40000.0, 0.0], [2e6])              # L_a を含むモータの位置


# =====================================================================
# 1 節: 点を打って道筋を見る
# =====================================================================
def _f12_dots_fig():
    o = []
    # (a) 台車の速度
    o.append(TX(14, 18, "(a) 台車の速度: s + 2 + K_c = 0", "start", 11.5, INK, True))
    p = Plot(60, 34, 280, 110, (-24, 4), (-5, 5))
    o.append(_f12_sp(p, [-20, -10, 0], [-4, 0, 4], xl="実部 σ [1/s]", yl="虚部"))
    for K in range(0, 21):
        o.append(D(p.X(-2 - K), p.Y(0), SIG, 2.6))
    o.append(PZ(p, [complex(-2, 0)], [], MUT, 5))
    for K, dy in ((2, -11), (8, -11), (20, -11)):
        o.append(TX(p.X(-2 - K), p.Y(0) + dy, "%g" % K, "middle", 9.5, SIG, True, halo=True))
    o.append(TX(p.X(-2.6), p.Y(0) + 17, "開ループの極 −2（K_c = 0）", "end", 9, MUT, False, halo=True))
    o.append(ARR(p.X(-6), p.Y(-3.9), p.X(-20), p.Y(-3.9), c=SIG, lw=1.3, head=6))
    o.append(TX(p.X(-13), p.Y(-3.9) - 5, "K_c を上げると左へ", "middle", 9, SIG, False, halo=True))
    o.append(TX(p.x, p.y + p.h + 46, "数字は K_c [N/(m/s)]。点は 1 N/(m/s) ごと", "start", 9, MUT))
    # (c) モータの位置: K_c と極の実部・虚部
    o.append(TX(14, 226, "(c) モータの位置: K_c と閉ループの極の値", "start", 11.5, INK, True))
    q = Plot(60, 240, 280, 112, (0, 0.3), (-22, 16))
    o.append(q.axes(xl="K_c [V/rad]", yl="極の値", xt=[0, 0.1, 0.2, 0.3], yt=[-20, -10, 0, 10], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    ks = _f12_np.linspace(0, 0.3, 601)
    re1, re2, im = [], [], []
    for K in ks:
        d = 100 - 1000 * K
        if d >= 0:
            re1.append((K, -10 + math.sqrt(d))); re2.append((K, -10 - math.sqrt(d))); im.append((K, 0.0))
        else:
            re1.append((K, -10.0)); re2.append((K, -10.0)); im.append((K, math.sqrt(-d)))
    o.append(q.line(re1, c=SIG, lw=2)); o.append(q.line(re2, c=SIG, lw=2))
    o.append(q.line(im, c=TEA, lw=2, dash="5 3"))
    o.append(W(q.X(0.1), q.y, q.X(0.1), q.y + q.h, c=FNT, lw=1, dash="3 3"))
    o.append(TX(q.X(0.1) + 4, q.y + 12, "0.1: −10 で重なる", "start", 9, MUT, False, halo=True))
    o.append(TX(q.X(0.29), q.Y(-10) - 6, "実部（2 つとも −10）", "end", 9, SIG, True, halo=True))
    o.append(TX(q.X(0.29), q.Y(13.5) + 3, "虚部の大きさ", "end", 9, TEA, True, halo=True))
    o.append(TX(q.X(0.045), q.Y(-4.5), "実部", "middle", 9, SIG, True, halo=True))
    # (b) モータの位置: s 平面に点
    o.append(TX(392, 18, "(b) モータの位置: s^2 + 20s + 1000K_c = 0", "start", 11.5, INK, True))
    r = Plot(420, 34, 264, 264, (-25, 5), (-15, 15))
    o.append(_f12_sp(r, [-20, -10, 0], [-10, 0, 10], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    for i in range(0, 31):
        K = i * 0.01
        for z in _f12_np.roots([1, 20, 1000 * K]):
            o.append(D(r.X(z.real), r.Y(z.imag), SIG, 2.4 if i % 5 else 3.4))
    o.append(PZ(r, [complex(0, 0), complex(-20, 0)], [], MUT, 5))
    o.append(TX(r.X(-20), r.Y(0) + 17, "−20", "middle", 9, MUT, False, halo=True))
    o.append(TX(r.X(0) + 4, r.Y(0) + 17, "0", "start", 9, MUT, False, halo=True))
    for K, z, a in ((0.05, -17.07, "middle"), (0.05, -2.93, "middle")):
        o.append(TX(r.X(z), r.Y(0) - 9, "0.05", a, 9, SIG, True, halo=True))
    o.append(TX(r.X(-10) - 6, r.Y(0) - 8, "0.1", "end", 9, SIG, True, halo=True))
    o.append(TX(r.X(-10) + 7, r.Y(10) + 4, "0.2", "start", 9, SIG, True, halo=True))
    o.append(TX(r.X(-10) + 7, r.Y(14.14) + 4, "0.3", "start", 9, SIG, True, halo=True))
    o.append(TX(r.X(-10) + 7, r.Y(-10) + 4, "0.2", "start", 9, SIG, True, halo=True))
    o.append(TX(r.X(-24.5), r.Y(-13.2), "数字は K_c [V/rad]。点は 0.01 V/rad ごと", "start", 9, MUT, False, halo=True))
    return SVG(700, 396, o, "比例ゲイン K<sub>c</sub> を一定の刻みで上げたときの閉ループの極（青の点）。灰色の × は開ループの極で、K<sub>c</sub> = 0 の閉ループの極に当たる。(a) 台車の速度では、極は −2 から負の実軸の上を左へ等しい間隔で進む。(b) モータの位置では、0 と −20 から出た 2 つの極が実軸の上を近づき、K<sub>c</sub> = 0.1 V/rad で −10 に重なった後、実部 −10 の縦の線の上を上下に離れる（大きい点は 0.05 V/rad ごと）。点を細かく打つと、点は曲線（根軌跡）になる。(c) 同じ極の実部と虚部の大きさを K<sub>c</sub> に対して描いたもの。0.1 V/rad を境に、2 つの実数の根が、実部の等しい共役な組に変わる。")
F["e12_dots"] = _f12_dots_fig()


def _f12_film_fig():
    o = []
    cases = [(0.05, TEA, "過減衰"), (0.1, GRN, "臨界減衰"), (0.21, SIG, None), (1.0, GLD, None), (10.0, ALI, None)]
    t = _f12_np.linspace(0, 0.6, 2401)
    tl = _f12_np.linspace(0, 3.0, 12001)
    Ks = _f12_kgrid(-4, 3)
    R = _f12_track(_F12_MP[0], _F12_MP[1], Ks)
    x0, cw, gap = 52, 116, 14
    for i, (K, c, lab) in enumerate(cases):
        x = x0 + i * (cw + gap)
        o.append(TX(x + cw / 2, 16, "K_c = %g V/rad" % K, "middle", 10.5, c, True))
        if lab is None:
            lab = "ζ = %.3f" % (10 / math.sqrt(1000 * K))
        o.append(TX(x + cw / 2, 31, lab, "middle", 9.5, c, True))
        p = Plot(x, 40, cw, 110, (-25, 5), (-35, 35))
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8)); o.append(SPLANE(p))
        o.append(p.axes(xt=[-20, 0], yt=[-30, 0, 30], xfmt=_f12_fmt, yfmt=(_f12_fmt if i == 0 else (lambda v: "")), sz=9, grid=False))
        o.append(SPLANE(p, rhp=False))
        o.append(_f12_branches(p, R, c=MUT, lw=1.3))
        o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [], MUT, 3.6))
        rts = _f12_cl(_F12_MP[0], _F12_MP[1], K)
        o.append(PZ(p, [z for z in rts if _f12_inside(p, z)], [], c, 5))
        for z in rts:
            if not _f12_inside(p, z):
                yy = p.y + 4 if z.imag > 0 else p.y + p.h - 4
                o.append(_head(p.X(z.real), yy + (7 if z.imag > 0 else -7), p.X(z.real), yy, c, 7))
        if K >= 5:
            o.append(TX(p.X(-10) + 7, p.y + 14, "±j99.5 へ", "start", 9, c, True, halo=True))
        # ステップ応答（指標は 3 s までの応答から読む）
        q = Plot(x, 222, cw, 88, (0, 0.6), (0, 1.8))
        o.append(q.axes(xt=[0, 0.3, 0.6], yt=[0, 1], xfmt=_f12_fmt, yfmt=(_f12_fmt if i == 0 else (lambda v: "")), sz=9))
        o.append(q.line([(0, 1), (0.6, 1)], c=MUT, lw=1, dash="4 3"))
        y = _f12_step([1000 * K], [1, 20, 1000 * K], t)
        o.append(q.line(list(zip(t, y)), c=c, lw=1.7))
        mp, t2 = _f12_info(tl, _f12_step([1000 * K], [1, 20, 1000 * K], tl), 1.0)
        o.append(TX(x + cw / 2, 200, "行き過ぎ %.1f %%" % mp, "middle", 9, INK))
        o.append(TX(x + cw / 2, 213, "t_{2%%} = %.2f s" % t2, "middle", 9, INK))
    o.append(TX(18, 95, "虚部 [rad/s]", "middle", 9, MUT, rot=-90))
    o.append(TX(18, 266, "角度 [rad]", "middle", 9, MUT, rot=-90))
    o.append(TX(x0 + 2 * (cw + gap) + cw / 2, 180, "実部 σ [1/s]", "middle", 9.5, MUT))
    o.append(TX(x0 + 2 * (cw + gap) + cw / 2, 341, "時間 t [s]", "middle", 9.5, MUT))
    return SVG(700, 350, o, "モータの位置の比例制御で、根軌跡（灰の線）の上の 5 か所の閉ループの極（色の ×）と、そのときの目標値の単位ステップに対する角度の応答（下）。極が実軸の上にある間（0.05 V/rad）は行き過ぎずにゆっくり近づき、−10 で重なると（0.1 V/rad）行き過ぎない中で最も速くなる。縦の線の上を上へ進むほど、速く揺れて行き過ぎが増えるが、実部が −10 のままなので、2 % 整定時間は 0.35〜0.41 s から縮まない（10 V/rad の極は ±j99.5 で、枠の上下の外にある）。行き過ぎ量と 2 % 整定時間は 3 s までの応答から読んだ。")
F["e12_film"] = _f12_film_fig()


def _f12_track_fig():
    o = []
    Ks = _f12_kgrid(-4, 3, 300)
    a, b = _F12_PI
    cols = [SIG, GLD, TEA]
    for k, (title, near) in enumerate((("(a) 実部の小さい順に並べてつなぐ（悪い例）", False), ("(b) 1 つ前の根に近い根をつなぐ（この章の方法）", True))):
        x = 60 + k * 340
        o.append(T(x - 46, 18, title, "start", 11, ALI if not near else GRN, True))
        p = Plot(x, 32, 270, 220, (-22, 2), (-12, 12))
        o.append(_f12_sp(p, [-20, -10, 0], [-10, 0, 10], xl="実部 σ [1/s]", yl=("虚部 ω [rad/s]" if k == 0 else None)))
        R = _f12_track(a, b, Ks, nearest=near)
        for i, br in enumerate(R):
            o.append(p.clip([(z.real, z.imag) for z in br], c=cols[i], lw=2.2))
        o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [complex(-1 / _F12_TIPI, 0)], MUT, 5))
        if not near:
            # 線が飛ぶ所に印
            for br in R:
                for j in range(1, len(br)):
                    if abs(br[j] - br[j - 1]) > 2.0 and _f12_inside(p, br[j]) and _f12_inside(p, br[j - 1]):
                        m = (br[j] + br[j - 1]) / 2
                        o.append(CIRC(p.X(m.real), p.Y(m.imag), 8, ALI, 1.4, dash="3 2"))
                        o.append(W(p.X(br[j - 1].real), p.Y(br[j - 1].imag), p.X(br[j].real), p.Y(br[j].imag), c=ALI, lw=1, dash="2 2"))
            o.append(TX(p.X(-21.5), p.y + 14, "赤い円: 線が別の枝へ飛ぶ所", "start", 9, ALI, True, halo=True))
        else:
            o.append(TX(p.X(-21.5), p.y + 14, "どの枝も途切れない", "start", 9, GRN, True, halo=True))
        o.append(TX(p.X(-2.38), p.Y(0) + 18, "零点 −2.38", "middle", 9, MUT, False, halo=True))
    o.append(LEGL(150, 306, [(SIG, None, "1 番目に並んだ根"), (GLD, None, "2 番目"), (TEA, None, "3 番目")], 9.5, 16))
    return SVG(700, 316, o, "根を数値で求めて点をつなぐときの、つなぎ方の違い（PI 制御のモータの位置、積分時間 0.42 s。開ループの極は 0 の重根と −20、零点は −2.38。K<sub>c</sub> は 10<sup>−4</sup>〜10<sup>3</sup> V/rad を対数の目盛で等しく刻んだ）。色は、各 K<sub>c</sub> で何番目に並んだ根かを表す。(a) 実部の小さい順に並べると、−20 から右へ動く実数の根が、極の組の実部を追い越す所で順番が入れ替わり、線が枝から枝へ飛ぶ。(b) 1 つ前の K<sub>c</sub> の根に最も近い根をつなぐと、3 本の枝がそれぞれ途切れずにつながる。")
F["e12_track"] = _f12_track_fig()


# =====================================================================
# 2 節: 角度の条件と大きさの条件
# =====================================================================
def _f12_vec(p, frm, to, c, lab_ang, lab_len=None, r=17, la=None):
    """極（または零点）frm から点 to への矢印、正の実軸からの角度の弧と文字、長さの文字。"""
    o = []
    x0, y0 = p.X(frm.real), p.Y(frm.imag)
    x1, y1 = p.X(to.real), p.Y(to.imag)
    o.append(W(x0, y0, x0 + 26, y0, c=c, lw=1, dash="3 2"))
    ang = math.degrees(math.atan2(to.imag - frm.imag, to.real - frm.real))
    o.append(_f12_arc(x0, y0, r, 0, ang, c=c, lw=1.3))
    o.append(ARR(x0, y0, x1, y1, c=c, lw=1.6, head=7))
    if lab_ang:
        am = math.radians(ang / 2 if la is None else la)
        o.append(T(x0 + (r + 13) * math.cos(am), y0 - (r + 13) * math.sin(am) + 4, lab_ang, "middle", 9.5, c, True, halo=True))
    if lab_len:
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        nx, ny = -(y1 - y0), (x1 - x0)
        L = math.hypot(nx, ny) or 1
        o.append(T(mx + nx / L * 11, my + ny / L * 11 + 3, lab_len, "middle", 9, c, False, halo=True))
    return "".join(o)


def _f12_cond_fig():
    o = []
    pts = [(complex(-10, 10.49), GRN, "(a) 点 −10 + j10.49", True), (complex(-5, 10), ALI, "(b) 点 −5 + j10", False)]
    for k, (s0, c, title, on) in enumerate(pts):
        x = 50 + k * 248
        o.append(T(x - 36, 18, title, "start", 11, INK, True))
        p = Plot(x, 32, 210, 147, (-26, 4), (-5, 16))
        o.append(_f12_sp(p, [-20, -10, 0], [0, 10], xl="実部 σ [1/s]", yl=("虚部 ω [rad/s]" if k == 0 else None)))
        o.append(W(p.X(-10), p.Y(0), p.X(-10), p.y, c=SIG, lw=1.2, dash="5 3"))
        o.append(W(p.X(-20), p.Y(0), p.X(0), p.Y(0), c=SIG, lw=2.2))
        o.append(_f12_vec(p, complex(-20, 0), s0, PUR, "%.1f°" % math.degrees(math.atan2(s0.imag, s0.real + 20)),
                          "%.2f" % abs(s0 + 20), la=(18 if on else 14)))
        o.append(_f12_vec(p, complex(0, 0), s0, TEA, "%.1f°" % math.degrees(math.atan2(s0.imag, s0.real)),
                          "%.2f" % abs(s0), la=60))
        o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [], MUT, 5))
        o.append(D(p.X(s0.real), p.Y(s0.imag), c, 4.6))
        a1 = math.degrees(math.atan2(s0.imag, s0.real)); a2 = math.degrees(math.atan2(s0.imag, s0.real + 20))
        yb = p.y + p.h + 48
        o.append(T(x - 30, yb, "極からの角度の和 %.1f° + %.1f° = %.1f°" % (a1, a2, a1 + a2), "start", 9.5, INK))
        if on:
            o.append(T(x - 30, yb + 15, "→ 左辺は −180°: 根軌跡の上にある", "start", 9.5, GRN, True))
            o.append(TX(x - 30, yb + 30, "K_c = 14.49 × 14.49 ÷ 1000 = 0.21 V/rad", "start", 9.5, INK))
        else:
            o.append(T(x - 30, yb + 15, "→ 左辺は −%.1f°: 根軌跡の上に無い" % (a1 + a2), "start", 9.5, ALI, True))
    # (c) 横の線の上の角度の和
    o.append(T(530, 18, "(c) 虚部 10.49 の線の上", "start", 11, INK, True))
    q = Plot(562, 32, 128, 147, (-30, 5), (0, 360))
    o.append(q.axes(xl="実部 σ [1/s]", yl=None, xt=[-30, -20, -10, 0], yt=[0, 90, 180, 270, 360], xfmt=_f12_fmt, yfmt=lambda v: "%d°" % v, sz=9))
    sg = _f12_np.linspace(-30, 5, 351)
    ys = [math.degrees(math.atan2(10.49, v)) + math.degrees(math.atan2(10.49, v + 20)) for v in sg]
    o.append(q.line([(q.xr[0], 180), (q.xr[1], 180)], c=MUT, lw=1, dash="4 3"))
    o.append(q.line(list(zip(sg, ys)), c=SIG, lw=2))
    o.append(D(q.X(-10), q.Y(180), GRN, 4))
    o.append(T(q.X(-10) - 4, q.Y(180) + 16, "−10 だけ", "end", 9, GRN, True, halo=True))
    o.append(T(q.X(4), q.Y(300), "角度の和", "end", 9, SIG, True, halo=True))
    return SVG(700, 266, o, "角度の条件と大きさの条件（モータの位置、開ループの極 0 と −20）。極から点 s へ矢印を引き、正の実軸から反時計回りに測った角度と長さを読む。(a) 点 −10 + j10.49 では、2 つの角度の和が 180° で、角度の条件を満たす（青の線は根軌跡）。そこでの K<sub>c</sub> は、大きさの条件から、矢印の長さの積 ÷ 1000 = 0.21 V/rad である。(b) 点 −5 + j10 では和が 150.3° で、どの K<sub>c</sub> でも閉ループの極にならない。(c) 虚部 10.49 の横の線に沿って点を動かすと、角度の和は 360° から 0° へ減り、180° になるのは実部 −10 の 1 点だけである。")
F["e12_cond"] = _f12_cond_fig()


# =====================================================================
# 2 節: 始点と終点・実軸の上の部分（PD のモータの位置: 極 0・−20、零点 −42）
# =====================================================================
def _f12_ends_fig():
    o = []
    a, b = _F12_PD
    Ks = _f12_kgrid(-4, 4, 200, extra=(0.13462, 5.2414))
    R = _f12_track(a, b, Ks)
    o.append(TX(14, 18, "(a) PD のモータの位置: 枝の始点と終点", "start", 11.5, INK, True))
    p = Plot(56, 34, 360, 240, (-110, 10), (-40, 40))
    o.append(_f12_sp(p, [-100, -80, -60, -40, -20, 0], [-40, -20, 0, 20, 40], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    o.append(_f12_branches(p, R, c=SIG, lw=2.2))
    o.append(_f12_heads(p, R, Ks, 0.05, SIG)); o.append(_f12_heads(p, R, Ks, 1.0, SIG)); o.append(_f12_heads(p, R, Ks, 20.0, SIG))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [complex(-42, 0)], MUT, 5.5))
    for sb, kb in ((-11.60, 0.135), (-72.40, 5.24)):
        o.append(D(p.X(sb), p.Y(0), GLD, 4))
    o.append(TX(p.X(-11.6), p.Y(0) + 31, "分岐点 −11.6", "middle", 9, GLD, True, halo=True))
    o.append(TX(p.X(-72.4), p.Y(0) + 17, "分岐点 −72.4", "middle", 9, GLD, True, halo=True))
    o.append(TX(p.X(0) - 4, p.Y(0) - 10, "始点 0", "end", 9.5, MUT, True, halo=True))
    o.append(TX(p.X(-20), p.Y(0) + 17, "始点 −20", "middle", 9.5, MUT, True, halo=True))
    o.append(TX(p.X(-42), p.Y(0) - 10, "終点: 零点 −42", "middle", 9.5, MUT, True, halo=True))
    o.append(TX(p.X(-108), p.Y(0) - 10, "終点: 左の遠く", "start", 9.5, MUT, True, halo=True))
    o.append(TX(p.X(-42), p.Y(33.5), "零点 −42 を中心とする半径 30.4 の円", "middle", 9, SIG, False, halo=True))
    # (b) 実軸の上の点からの矢印
    o.append(TX(446, 18, "(b) 実軸の上の点 σ への矢印", "start", 11.5, INK, True))
    xs = [("z", 470), ("p20", 560), ("p0", 664)]
    rows = [(612, "σ = −8（−20 と 0 の間）", "零点 0° − 極 (0° + 180°) = −180°", "根軌跡の上", GRN),
            (514, "σ = −30（−42 と −20 の間）", "零点 0° − 極 (180° + 180°) = −360°", "根軌跡の上に無い", ALI)]
    for i, (xt, lab, eq, verdict, vc) in enumerate(rows):
        y = 84 + i * 104
        o.append(TX(446, y - 46, lab, "start", 9.5, INK, True))
        o.append(W(456, y, 690, y, c=MUT, lw=1.2))
        o.append(CIRC(xs[0][1], y, 5, MUT, 2, fill=SCR))
        for k2, xx in xs[1:]:
            o.append(W(xx - 5, y - 5, xx + 5, y + 5, c=MUT, lw=2.2)); o.append(W(xx - 5, y + 5, xx + 5, y - 5, c=MUT, lw=2.2))
        o.append(D(xt, y, vc, 4.4))
        for j, (k2, xx) in enumerate(xs):
            yy = y - 9 - 10 * j
            if xx < xt:
                o.append(ARR(xx, yy, xt - 3, yy, c=SIG, lw=1.3, head=6))
                o.append(W(xt, yy, xt, y, c=FNT, lw=0.8, dash="2 2"))
                o.append(T(xx + 4, yy - 2, "0°", "start", 9, SIG, True, halo=True))
            else:
                o.append(ARR(xx, yy, xt + 3, yy, c=GLD, lw=1.3, head=6))
                o.append(W(xt, yy, xt, y, c=FNT, lw=0.8, dash="2 2"))
                o.append(T(xx - 4, yy - 2, "180°", "end", 9, GLD, True, halo=True))
        o.append(T(xs[0][1], y + 16, "−42", "middle", 9, MUT))
        o.append(T(xs[1][1], y + 16, "−20", "middle", 9, MUT))
        o.append(T(xs[2][1], y + 16, "0", "middle", 9, MUT))
        o.append(T(446, y + 32, eq, "start", 9, INK))
        o.append(T(446, y + 45, "→ " + verdict, "start", 9.5, vc, True))
    # (c) 共役な組
    o.append(TX(446, 262, "(c) 共役な組からの角度は打ち消す", "start", 11.5, INK, True))
    cx, cy = 600, 312
    o.append(W(456, cy, 690, cy, c=MUT, lw=1.2))
    pp = (520, cy - 30); pm = (520, cy + 30)
    for (px, py) in (pp, pm):
        o.append(W(px - 5, py - 5, px + 5, py + 5, c=MUT, lw=2.2)); o.append(W(px - 5, py + 5, px + 5, py - 5, c=MUT, lw=2.2))
        o.append(ARR(px, py, cx - 4, cy + (3 if py < cy else -3), c=TEA, lw=1.4, head=6))
    o.append(D(cx, cy, SIG, 4))
    o.append(T(cx + 8, cy - 6, "σ", "start", 10, SIG, True))
    o.append(TX(560, cy - 24, "−θ", "middle", 9.5, TEA, True, halo=True))
    o.append(TX(560, cy + 32, "+θ", "middle", 9.5, TEA, True, halo=True))
    o.append(T(640, cy + 4, "和は 0°", "start", 9.5, TEA, True))
    return SVG(700, 356, o, "根軌跡の始点・終点と、実軸の上の部分（PD 制御のモータの位置。P(s)C<sub>0</sub>(s) = 23.8(s + 42)/{s(s + 20)}）。(a) 2 本の枝は開ループの極 0 と −20 から出発し（K<sub>c</sub> = 0）、1 本は開ループの零点 −42 で、もう 1 本は負の実軸の左の遠くで終わる（K<sub>c</sub> → ∞）。矢じりは K<sub>c</sub> が増える向き。(b) 実軸の上の点では、左にある極・零点からの矢印は 0°、右にあるものからは 180° になる。右にある極と零点の数の合計が奇数なら角度の条件を満たす。(c) 共役な組からの 2 本の矢印の角度は θ と −θ で、和は 0° なので、実軸の上の部分には効かない。")
F["e12_ends"] = _f12_ends_fig()


# =====================================================================
# 2 節: 漸近線
# =====================================================================
def _f12_asym_fig():
    o = []
    cells = [(1, [180]), (2, [90, -90]), (3, [60, 180, -60]), (4, [45, 135, -135, -45])]
    for i, (nm, angs) in enumerate(cells):
        cx0 = 20 + (i % 2) * 170; cy0 = 30 + (i // 2) * 150
        o.append(TX(cx0, cy0, "(%s) n − m = %d" % ("abcd"[i], nm), "start", 11, INK, True))
        cx, cy = cx0 + 88, cy0 + 74
        o.append(W(cx0 + 6, cy, cx0 + 158, cy, c=MUT, lw=1))
        for ang in angs:
            ex, ey = cx + 44 * math.cos(math.radians(ang)), cy - 44 * math.sin(math.radians(ang))
            o.append(ARR(cx, cy, ex, ey, c=SIG, lw=1.6, head=7))
            lx, ly = cx + 60 * math.cos(math.radians(ang)), cy - 56 * math.sin(math.radians(ang)) + 4
            o.append(T(lx, ly, ("%+d°" % ang).replace("-", "−") if ang not in (180,) else "180°", "middle", 9.5, SIG, True, halo=True))
        o.append(D(cx, cy, GLD, 3.6))
        o.append(TX(cx + 6, cy + 14, "σ_a", "start", 9.5, GLD, True, halo=True))
    # (e) 台車とばね・ダンパ + 力を出す装置の遅れ
    a = list(_f12_np.polymul([1, 10], [1, 2, 25])); b = [10.0]
    Ks = _f12_kgrid(-3, 4, 200, extra=(29.0,))
    R = _f12_track(a, b, Ks)
    o.append(TX(372, 18, "(e) 10/{(s + 10)(s^2 + 2s + 25)}: n − m = 3", "start", 11, INK, True))
    p = Plot(406, 32, 270, 270, (-16, 6), (-11, 11))
    o.append(_f12_sp(p, [-15, -10, -5, 0, 5], [-10, -5, 0, 5, 10], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    for ang in (60, -60, 180):
        L = 40
        o.append(p.clip([(-4, 0), (-4 + L * math.cos(math.radians(ang)), L * math.sin(math.radians(ang)))], c=GLD, lw=1.3, dash="6 4"))
    o.append(_f12_branches(p, R, c=SIG, lw=2.2))
    o.append(_f12_heads(p, R, Ks, 3.0, SIG)); o.append(_f12_heads(p, R, Ks, 60.0, SIG))
    o.append(PZ(p, [complex(-10, 0), complex(-1, math.sqrt(24)), complex(-1, -math.sqrt(24))], [], MUT, 5.5))
    o.append(D(p.X(-4), p.Y(0), GLD, 4))
    o.append(TX(p.X(-4) + 2, p.Y(0) + 15, "σ_a = −4", "middle", 9.5, GLD, True, halo=True))
    for z in _f12_cl(a, b, 29.0):
        if abs(z.real) < 0.01:
            o.append(D(p.X(0), p.Y(z.imag), ALI, 4))
    o.append(TX(p.X(0) + 6, p.Y(6.71) + 14, "K_c = 29 N/m", "start", 9, ALI, True, halo=True))
    o.append(TX(p.X(0) + 6, p.Y(6.71) + 26, "±j6.71", "start", 9, ALI, True, halo=True))
    o.append(TX(p.X(-15.5), p.Y(9.6), "破線: 漸近線（±60°・180°）", "start", 9, GLD, False, halo=True))
    return SVG(700, 352, o, "根軌跡の漸近線。(a)〜(d) n − m 本の漸近線は、実軸の上の点 σ<sub>a</sub> = (極の和 − 零点の和)/(n − m) から、180° を n − m で割った角度の奇数倍の向きに出る。(e) 台車とばね・ダンパに力を出す装置の遅れ（時定数 0.1 s）が加わった対象の比例制御（n = 3、m = 0、σ<sub>a</sub> = −4）。極の組から出た 2 本の枝は ±60° の漸近線に近づきながら右半平面へ入り、K<sub>c</sub> = 29 N/m で虚軸を ±j6.71 で横切る。−10 から出た枝は 180° の漸近線（負の実軸）の上を左へ進む。")
F["e12_asym"] = _f12_asym_fig()


# =====================================================================
# 2 節: 分岐点（実軸の上の K_c(σ) の山と谷）
# =====================================================================
def _f12_break_fig():
    o = []
    # (a) モータの位置
    o.append(TX(14, 18, "(a) モータの位置: K_c(σ) = −(σ^2 + 20σ)/1000", "start", 11, INK, True))
    p = Plot(60, 30, 270, 161, (-25, 5), (-12, 12))
    o.append(_f12_sp(p, [-20, -10, 0], [-10, 0, 10], xl=None, yl="虚部 ω [rad/s]"))
    Ks = _f12_kgrid(-4, 3, 200, extra=(0.1,))
    R = _f12_track(_F12_MP[0], _F12_MP[1], Ks)
    o.append(_f12_branches(p, R, c=SIG, lw=2.2))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [], MUT, 5))
    o.append(D(p.X(-10), p.Y(0), GLD, 4))
    q = Plot(60, 214, 270, 120, (-25, 5), (0, 0.12))
    o.append(q.axes(xl="実部 σ [1/s]", yl="K_c(σ) [V/rad]", xt=[-20, -10, 0], yt=[0, 0.05, 0.1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    sg = _f12_np.linspace(-20, 0, 201)
    o.append(q.line([(v, -(v * v + 20 * v) / 1000) for v in sg], c=SIG, lw=2.2))
    o.append(W(p.X(-10), p.Y(0), q.X(-10), q.Y(0.1), c=GLD, lw=1.1, dash="3 3"))
    o.append(D(q.X(-10), q.Y(0.1), GLD, 4))
    o.append(TX(q.X(-10) + 6, q.Y(0.1) - 6, "最大 0.1（分岐点 −10）", "start", 9, GLD, True, halo=True))
    o.append(TX(q.X(-20), q.Y(0.008) - 4, "極 −20", "middle", 9, MUT, False, halo=True))
    o.append(TX(q.X(0) - 2, q.Y(0.008) - 4, "極 0", "end", 9, MUT, False, halo=True))
    # (b) PD
    o.append(TX(372, 18, "(b) PD: K_c(σ) = −(σ^2 + 20σ)/{23.8(σ + 42)}", "start", 11, INK, True))
    r = Plot(410, 30, 276, 161, (-110, 10), (-35, 35))
    o.append(_f12_sp(r, [-100, -60, -20], [-30, 0, 30], xl=None, yl="虚部 ω [rad/s]"))
    a, b = _F12_PD
    Ks2 = _f12_kgrid(-4, 4, 200, extra=(0.13462, 5.2414))
    o.append(_f12_branches(r, _f12_track(a, b, Ks2), c=SIG, lw=2.2))
    o.append(PZ(r, [complex(0, 0), complex(-20, 0)], [complex(-42, 0)], MUT, 5))
    for sb in (-11.60, -72.40):
        o.append(D(r.X(sb), r.Y(0), GLD, 4))
    g = Plot(410, 214, 276, 120, (-110, 10), (0.01, 100), ylog=True)
    o.append(g.axes(xl="実部 σ [1/s]", yl="K_c(σ) [V/rad]", xt=[-100, -60, -20], yt=[0.01, 0.1, 1, 10, 100], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    def kf(v):
        return -(v * v + 20 * v) / (1000 * _F12_TD * (v + 42))
    s1 = [v for v in _f12_np.linspace(-20, 0, 801) if kf(v) > 0]
    s2 = [v for v in _f12_np.linspace(-110, -42.001, 1601)]
    o.append(g.clip([(v, kf(v)) for v in s1 if kf(v) > 1e-4], c=SIG, lw=2.2))
    o.append(g.clip([(v, kf(v)) for v in s2], c=SIG, lw=2.2))
    o.append(W(g.X(-42), g.y, g.X(-42), g.y + g.h, c=FNT, lw=1, dash="3 3"))
    for sb, kb, txt, dy in ((-11.60, 0.13462, "最大 0.135", -7), (-72.40, 5.2414, "最小 5.24", 15)):
        o.append(W(r.X(sb), r.Y(0), g.X(sb), g.Y(kb), c=GLD, lw=1.1, dash="3 3"))
        o.append(D(g.X(sb), g.Y(kb), GLD, 4))
        o.append(TX(g.X(sb) + (6 if sb > -50 else -6), g.Y(kb) + dy, txt, "start" if sb > -50 else "end", 9, GLD, True, halo=True))
    o.append(TX(g.X(-42) + 4, g.y + 12, "零点 −42", "start", 9, MUT, False, halo=True))
    return SVG(700, 380, o, "分岐点の求め方。実軸の上の点 σ で大きさの条件から K<sub>c</sub>(σ) = −a(σ)/b(σ) を求め、根軌跡の上にある区間で描いた（下）。上の s 平面と横軸をそろえてある。(a) モータの位置では、K<sub>c</sub>(σ) は区間の両端の極で 0 で、−10 で最大の 0.1 V/rad になる。これより大きな K<sub>c</sub> では実軸の上に根が無く、2 本の枝は実軸を離れる。(b) PD 制御では、−20 と 0 の間の山（−11.6、0.135 V/rad）で枝が実軸を離れ、−42 より左の谷（−72.4、5.24 V/rad）で実軸に戻る。山と谷はどちらも dK<sub>c</sub>/dσ = 0 の点で、縦軸は対数の目盛。")
F["e12_break"] = _f12_break_fig()


# =====================================================================
# 3 節: 例で描く — 一次遅れ 2 つ・積分＋一次遅れ・二次遅れ
# =====================================================================
def _f12_ex3_fig():
    o = []
    cols = [TEA, SIG, GLD]
    cases = [
        ("(a) 一次遅れ 2 つ", "2×10^6/{(s + 20.2)(s + 1980)}", [1.0, 2000.0, 40000.0], [2e6], (-2200, 200), (-1600, 1600),
         [-2000, -1000, 0], [-1000, 0, 1000], [0.1, 0.48, 1.5], "V/(rad/s)", 0.04, [0, 0.02, 0.04], (0, 1.3), "角速度 [rad/s]",
         -1000.0, [(-1000.0, 0.48)]),
        ("(b) 積分＋一次遅れ", "1000/{s(s + 20)}", [1.0, 20.0, 0.0], [1000.0], (-25, 5), (-32, 32),
         [-20, -10, 0], [-30, 0, 30], [0.05, 0.21, 1.0], "V/rad", 0.6, [0, 0.3, 0.6], (0, 1.6), "角度 [rad]",
         -10.0, [(-10.0, 0.1)]),
        ("(c) 二次遅れ", "1/(s^2 + 2s + 25)", [1.0, 2.0, 25.0], [1.0], (-6, 2), (-16, 16),
         [-6, -4, -2, 0], [-10, 0, 10], [10.0, 25.0, 100.0], "N/m", 6.0, [0, 3, 6], (0, 1.6), "位置 [m]",
         -1.0, []),
    ]
    for i, (title, ptx, a, b, xr, yr, xt, yt, ks, unit, tend, tt, yr2, ylab, sa, brk) in enumerate(cases):
        x = 56 + i * 234
        o.append(TX(x - 42, 16, title, "start", 11, INK, True))
        o.append(TX(x - 42, 31, "P(s) = " + ptx, "start", 9.5, MUT))
        p = Plot(x, 42, 170, 160, xr, yr)
        o.append(_f12_sp(p, xt, yt, xl="実部 σ [1/s]", yl=("虚部 ω [rad/s]" if i == 0 else None)))
        lo = -6 if i == 0 else -4
        Ks = _f12_kgrid(lo, 5, 200, extra=[kk for _, kk in brk])
        R = _f12_track(a, b, Ks)
        o.append(_f12_branches(p, R, c=MUT, lw=2.0))
        rts0 = list(_f12_np.roots(a))
        o.append(PZ(p, rts0, [], MUT, 5))
        o.append(D(p.X(sa), p.Y(0), GLD, 3.8))
        for K, c in zip(ks, cols):
            o.append(PZ(p, [z for z in _f12_cl(a, b, K) if _f12_inside(p, z)], [], c, 4.8))
        t = _f12_np.linspace(0, tend, 2001)
        q = Plot(x, 262, 170, 90, (0, tend), yr2)
        o.append(q.axes(xl="時間 t [s]", yl=(ylab if i < 2 else ylab), xt=tt, yt=[0, 0.5, 1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
        o.append(q.line([(0, 1), (tend, 1)], c=MUT, lw=1, dash="4 3"))
        for K, c in zip(ks, cols):
            num = [K * bb for bb in b]
            den = list(_f12_np.polyadd(a, num))
            y = _f12_step(num, den, t)
            o.append(q.clip(list(zip(t, y)), c=c, lw=1.7))
        o.append(LEGL(x - 40, 412, [(c, None, "%g" % K) for K, c in zip(ks, cols)], 9, 10))
        o.append(TX(x + 172, 412, unit, "end", 9, MUT))
    # 注記（各列。s 平面の左下）
    for x, l1, l2 in ((56, "σ_a = 分岐点 = −1000", "（K_c = 0.48）"), (290, "σ_a = 分岐点 = −10", "（K_c = 0.1）"), (524, "σ_a = −1", "実軸の上に無い")):
        o.append(TX(x + 4, 42 + 160 - 20, l1, "start", 9, GLD, True, halo=True))
        o.append(TX(x + 4, 42 + 160 - 7, l2, "start", 9, GLD, False, halo=True))
    return SVG(700, 420, o, "比例制御の根軌跡（上。灰の線は数値で求めた根軌跡、× は開ループの極、金の点は漸近線の出る点 σ<sub>a</sub>）と、3 つの比例ゲインでの閉ループの極（色の ×）と目標値の単位ステップに対する応答（下）。どれも n − m = 2 で、漸近線は σ<sub>a</sub> を通る縦の線である。(a) L<sub>a</sub> を含むモータの角速度: 極 −20.2 と −1980 が −1000 で出会い、縦の線を上下に離れる。目標値に届かないのは型 0 のため（7 章 3 節）。(b) モータの位置: −10 で出会う。(c) 台車とばね・ダンパの位置: 極の組が真上・真下へ進み、実部は −1 のまま。比例ゲインはばねを強くするだけで、揺れは減らない（目標値に届かないのは型 0 のため）。凡例の数字は K<sub>c</sub>。")
F["e12_ex3"] = _f12_ex3_fig()


def _f12_motor3_fig():
    o = []
    a, b = _F12_LA
    Ks = _f12_kgrid(-5, 7, 150, extra=(0.1005057, 40.0))
    R = _f12_track(a, b, Ks)
    # (a) 全体
    o.append(TX(14, 18, "(a) 全体: 2×10^6/{s(s + 20.2)(s + 1980)}", "start", 11, INK, True))
    p = Plot(64, 32, 300, 300, (-2600, 600), (-1600, 1600))
    o.append(_f12_sp(p, [-2000, -1000, 0], [-1000, 0, 1000], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    sa = -2000.0 / 3
    for ang in (60, -60, 180):
        L = 5000
        o.append(p.clip([(sa, 0), (sa + L * math.cos(math.radians(ang)), L * math.sin(math.radians(ang)))], c=GLD, lw=1.3, dash="6 4"))
    o.append(_f12_branches(p, R, c=SIG, lw=2.2))
    o.append(_f12_heads(p, R, Ks, 2000.0, SIG))
    o.append(PZ(p, list(_f12_np.roots(a)), [], MUT, 5))
    o.append(D(p.X(sa), p.Y(0), GLD, 4))
    o.append(TX(p.X(sa), p.Y(0) + 16, "σ_a = −666.7", "middle", 9.5, GLD, True, halo=True))
    o.append(D(p.X(0), p.Y(1154.7), GLD, 3.4)); o.append(D(p.X(0), p.Y(-1154.7), GLD, 3.4))
    o.append(TX(p.X(0) + 6, p.Y(1154.7) + 4, "漸近線は ±j1155", "start", 9, GLD, True, halo=True))
    o.append(D(p.X(0), p.Y(200), ALI, 4)); o.append(D(p.X(0), p.Y(-200), ALI, 4))
    o.append(TX(p.X(0) + 6, p.Y(200) - 4, "枝は ±j200", "start", 9, ALI, True, halo=True))
    o.append(TX(p.X(-1980), p.Y(0) - 10, "−1980", "middle", 9, MUT, False, halo=True))
    o.append(TX(p.X(-2550), p.Y(-1450), "破線: 漸近線（±60°・180°）", "start", 9, GLD, False, halo=True))
    # (b) 原点の近く
    o.append(TX(400, 18, "(b) 原点の近く（縦と横の目盛は違う）", "start", 11, INK, True))
    r = Plot(440, 32, 246, 300, (-30, 20), (-260, 260))
    o.append(_f12_sp(r, [-20, -10, 0, 10], [-200, -100, 0, 100, 200], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    o.append(_f12_branches(r, R, c=SIG, lw=2.2))
    o.append(PZ(r, [complex(0, 0), complex(-20.2, 0)], [], MUT, 5))
    marks = [(0.21, GRN, "0.21", "start"), (10.0, GLD, "10", "start"), (40.0, ALI, "40: ±j200", "start"), (50.0, ALI, "50", "start")]
    for K, c, lab, an in marks:
        for z in _f12_cl(a, b, K):
            if _f12_inside(r, z):
                o.append(PZ(r, [z], [], c, 5))
                if z.imag > 0:
                    o.append(TX(r.X(z.real) + 8, r.Y(z.imag) + 4, lab, an, 9.5, c, True, halo=True))
    o.append(D(r.X(-10.08), r.Y(0), GLD, 4))
    o.append(TX(r.X(-10.08) - 5, r.Y(0) - 8, "分岐点 −10.08", "end", 9, GLD, True, halo=True))
    o.append(TX(r.X(-10.08) - 5, r.Y(0) + 16, "（0.1005）", "end", 9, GLD, False, halo=True))
    o.append(TX(r.X(19), r.Y(-235), "数字は K_c [V/rad]", "end", 9, MUT, False, halo=True))
    return SVG(700, 372, o, "L<sub>a</sub> を含むモータの位置の比例制御の根軌跡（n = 3、m = 0）。(a) 全体: −1980 から出た枝は負の実軸を左へ進み、0 と −20.2 から出た 2 本の枝は、σ<sub>a</sub> = −666.7 から ±60° に出る漸近線に、K<sub>c</sub> が大きい所で近づく。漸近線は虚軸を ±j1155 で横切るが、枝はずっと原点に近い ±j200 で横切る。(b) 原点の近く: 2 本の枝は −10.08（K<sub>c</sub> = 0.1005 V/rad）で実軸を離れ、上へ進みながら右へ曲がり、40 V/rad で ±j200 の虚軸を横切って右半平面へ入る（6 章 4 節・9 章 2 節の安定限界）。")
F["e12_motor3"] = _f12_motor3_fig()


# =====================================================================
# 4 節: 零点を足す（PD・不完全微分の PD）
# =====================================================================
_F12_PDN = ([_F12_TD / 10, 20 * _F12_TD / 10 + 1.0, 20.0, 0.0], [1000 * 1.1 * _F12_TD, 1000.0])   # (s^2 + 20s)(1 + 0.1 T_D s)、1000(1 + 1.1 T_D s)


def _f12_zero_fig():
    o = []
    o.append(TX(14, 18, "(a) PD: C_0(s) = 1 + T_{D}s（零点 −42）", "start", 11, INK, True))
    p = Plot(56, 32, 330, 220, (-110, 10), (-40, 40))
    o.append(_f12_sp(p, [-100, -80, -60, -40, -20, 0], [-40, -20, 0, 20, 40], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    # 比例だけの根軌跡（比べるための元の線）
    o.append(W(p.X(-20), p.Y(0), p.X(0), p.Y(0), c=MUT, lw=3))
    o.append(W(p.X(-10), p.y, p.X(-10), p.y + p.h, c=MUT, lw=1.6, dash="5 4"))
    Ks = _f12_kgrid(-4, 4, 200, extra=(0.13462, 5.2414, 0.84))
    R = _f12_track(_F12_PD[0], _F12_PD[1], Ks)
    o.append(_f12_branches(p, R, c=SIG, lw=2.4))
    o.append(_f12_heads(p, R, Ks, 0.4, SIG))
    R2 = _f12_track(_F12_PDN[0], _F12_PDN[1], Ks)
    o.append(_f12_branches(p, R2, c=TEA, lw=1.6, dash="5 3"))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [complex(-42, 0)], MUT, 5.5))
    for z in _f12_cl(_F12_PD[0], _F12_PD[1], 0.84):
        o.append(PZ(p, [z], [], GLD, 6))
    o.append(TX(p.X(-20) - 9, p.Y(21) - 7, "K_c = 0.84: −20 ± j21.0", "end", 9.5, GLD, True, halo=True))
    o.append(TX(p.X(-9), p.Y(36), "比例だけ: 実部 −10", "start", 9, MUT, True, halo=True))
    o.append(TX(p.X(-42), p.Y(0) + 17, "零点 −42", "middle", 9, MUT, False, halo=True))
    o.append(TX(p.X(-106), p.Y(-34), "青: PD（−42 を中心とする半径 30.4 の円）", "start", 9, SIG, True, halo=True))
    o.append(TX(p.X(-106), p.Y(-24), "青緑の破線: 不完全微分（N = 10）の PD", "start", 9, TEA, True, halo=True))
    # (b) 不完全微分の PD を遠くまで
    o.append(TX(418, 18, "(b) 不完全微分の PD（零点 −38.2・極 −420）", "start", 11, INK, True))
    r = Plot(452, 32, 234, 150, (-460, 40), (-300, 300))
    o.append(_f12_sp(r, [-400, -200, 0], [-300, 0, 300], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    o.append(W(r.X(-200.9), r.y, r.X(-200.9), r.y + r.h, c=GLD, lw=1.2, dash="6 4"))
    o.append(_f12_branches(r, R2, c=TEA, lw=2))
    o.append(PZ(r, [complex(0, 0), complex(-20, 0), complex(-420, 0)], [complex(-38.18, 0)], MUT, 4.5))
    o.append(TX(r.X(-200.9) + 4, r.y + 12, "σ_a = −200.9", "start", 9, GLD, True, halo=True))
    o.append(TX(r.X(-420), r.Y(0) + 16, "−420", "middle", 9, MUT, False, halo=True))
    # (c) ステップ応答
    o.append(TX(418, 234, "(c) 目標値の単位ステップ（減衰比 0.690）", "start", 11, INK, True))
    q = Plot(452, 246, 234, 96, (0, 0.6), (0, 1.2))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6], yt=[0, 0.5, 1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    t = _f12_np.linspace(0, 0.6, 2401)
    o.append(q.line([(0, 1), (0.6, 1)], c=MUT, lw=1, dash="4 3"))
    o.append(q.line(list(zip(t, _f12_step([210.0], [1, 20, 210.0], t))), c=MUT, lw=1.8))
    o.append(q.line(list(zip(t, _f12_step([840.0], [1, 40, 840.0], t))), c=SIG, lw=2))
    o.append(TX(q.X(0.215), q.Y(0.45), "PD 0.84 V/rad: 0.21 s", "start", 9, SIG, True, halo=True))
    o.append(TX(q.X(0.43), q.Y(0.78), "比例 0.21: 0.41 s", "middle", 9, MUT, True, halo=True))
    return SVG(700, 396, o, "零点を足すと根軌跡が左へ曲がる（モータの位置、P(s) = 1000/{s(s + 20)}）。(a) PD 制御（T<sub>D</sub> = 0.0238 s、零点 −42）の根軌跡は、比例だけの縦の線（灰の破線）から左へ曲がり、零点 −42 を中心とする半径 30.4 の円を描いて −72.4 で実軸に戻る。10 章 3 節の K<sub>c</sub> = 0.84 V/rad の極は −20 ± j21.0 で、減衰比は比例だけの 0.21 V/rad と同じ 0.690 のまま、実部が −10 から −20 へ動いた。不完全微分（N = 10）の PD（青緑の破線）は、原点の近くでは同じ円に沿う。(b) 不完全微分では極 −420 も足すので、K<sub>c</sub> を大きくすると枝は σ<sub>a</sub> = −200.9 の縦の漸近線へ向かう（縦と横の目盛は違う）。(c) 同じ行き過ぎ量 5.0 % で、2 % 整定時間は 0.41 s から 0.21 s に縮む（PD は測定値微分）。")
F["e12_zero"] = _f12_zero_fig()


# =====================================================================
# 4 節: 極を足す（PI・積分だけ）
# =====================================================================
def _f12_pole_fig():
    o = []
    Ks = _f12_kgrid(-5, 4, 200, extra=(0.21, 0.5))
    rows = [("(a) PI（極 0・零点 −2.38）", _F12_PI, 0.21, (-8.81, [90, -90]), "K_c = 0.21: −3.20、−8.40 ± j9.26"),
            ("(b) 積分だけ（極 0）", ([1.0, 20.0, 0.0, 0.0], [1000.0]), 0.5, (-20.0 / 3, [60, -60, 180]), "K_c = 0.5: 0.56 ± j4.83（右半平面）")]
    for k, (title, (a, b), K0, (sa, angs), lab) in enumerate(rows):
        x = 52 + k * 232
        o.append(TX(x - 38, 16, title, "start", 10.5, INK, True))
        o.append(TX(x - 38, 30, "C_0(s) = 1 + 1/(T_{I}s)" if k == 0 else "C_0(s) = 1/s", "start", 9.5, MUT))
        p = Plot(x, 40, 196, 250, (-24, 6), (-24, 24))
        o.append(_f12_sp(p, [-20, -10, 0], [-20, -10, 0, 10, 20], xl="実部 σ [1/s]", yl=("虚部 ω [rad/s]" if k == 0 else None)))
        o.append(W(p.X(-20), p.Y(0), p.X(0), p.Y(0), c=MUT, lw=3))
        o.append(W(p.X(-10), p.y, p.X(-10), p.y + p.h, c=MUT, lw=1.6, dash="5 4"))
        for ang in angs:
            o.append(p.clip([(sa, 0), (sa + 60 * math.cos(math.radians(ang)), 60 * math.sin(math.radians(ang)))], c=GLD, lw=1.2, dash="6 4"))
        R = _f12_track(a, b, Ks)
        o.append(_f12_branches(p, R, c=SIG, lw=2.4))
        o.append(_f12_heads(p, R, Ks, 0.05 if k == 0 else 0.2, SIG))
        zs = [complex(r) for r in _f12_np.roots(b)] if len(b) > 1 else []
        o.append(PZ(p, [complex(r) for r in _f12_np.roots(a)], zs, MUT, 5))
        for z in _f12_cl(a, b, K0):
            if _f12_inside(p, z):
                o.append(PZ(p, [z], [], GLD, 6))
        o.append(D(p.X(sa), p.Y(0), GLD, 3.6))
        o.append(TX(p.X(sa), p.Y(0) + 16, "σ_a = %s" % _f12_n(sa, 2), "middle", 9, GLD, True, halo=True))
        o.append(TX(p.X(-23.3), p.Y(-21.5), lab, "start", 9, GLD, True, halo=True))
        o.append(TX(p.X(-9.4), p.Y(22), "比例だけ: −10", "start", 9, MUT, True, halo=True))
    # (c) ステップ応答
    o.append(TX(512, 16, "(c) 目標値の単位ステップ", "start", 10.5, INK, True))
    q = Plot(540, 40, 150, 250, (0, 1.5), (0, 2.0))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.5, 1, 1.5], yt=[0, 0.5, 1, 1.5, 2], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    t = _f12_np.linspace(0, 1.5, 3001)
    o.append(q.line([(0, 1), (1.5, 1)], c=MUT, lw=1, dash="4 3"))
    o.append(q.line(list(zip(t, _f12_step([210.0], [1, 20, 210.0], t))), c=MUT, lw=1.8))
    o.append(q.line(list(zip(t, _f12_step([210.0, 500.0], [1, 20, 210.0, 500.0], t))), c=SIG, lw=2))
    o.append(q.clip(list(zip(t, _f12_step([500.0], [1, 20, 0.0, 500.0], t))), c=ALI, lw=1.6))
    o.append(TX(q.X(0.32), q.Y(1.38), "PI: 26.0 %", "start", 9, SIG, True, halo=True))
    o.append(TX(q.X(0.75), q.Y(0.82), "比例: 5.0 %", "start", 9, MUT, True, halo=True))
    o.append(TX(q.X(0.75), q.Y(1.86), "積分だけ: 発散", "start", 9, ALI, True, halo=True))
    return SVG(700, 338, o, "極を足すと根軌跡が右へ押される（モータの位置）。灰の太線と破線は比例だけの根軌跡、金の破線は漸近線。(a) PI 制御（T<sub>I</sub> = 0.42 s）は原点に極を、−2.38 に零点を足す。n − m = 2 のままで閉ループの極の和は −20 で一定だが、−20 から零点へ向かう枝の極が和の一部を受け持つので、極の組は −10 の線より右（漸近線は −8.81）を進む。K<sub>c</sub> = 0.21 V/rad の極は −3.20 と −8.40 ± j9.26 で、7 章 3 節・10 章 2 節の値と同じ。(b) 積分だけでは n − m = 3 になり、原点の重根から出た 2 本の枝は ±60° の漸近線へ向かって、どの K<sub>c</sub> でも右半平面にある。(c) 比例だけ（0.21 V/rad）の 5.0 % に対し、PI では 26.0 % 行き過ぎ、積分だけ（K<sub>c</sub> = 0.5）では揺れが大きくなり続ける。")
F["e12_pole"] = _f12_pole_fig()


# =====================================================================
# 5 節: 減衰比の線との交点からゲインを決める
# =====================================================================
_F12_ZETA = 0.690
_F12_TPSI = math.tan(math.acos(_F12_ZETA))     # 46.4° の正接 1.049


def _f12_region(p, sig_max, c=GRN):
    """仕様の領域（実部 ≤ sig_max かつ減衰比 ≥ 0.690）を枠の中で塗る。"""
    y1 = max(abs(p.yr[0]), abs(p.yr[1])); x0 = p.xr[0]
    pts = [(sig_max, -sig_max * _F12_TPSI)]
    xe = -y1 / _F12_TPSI
    if xe > x0:
        pts += [(xe, y1), (x0, y1), (x0, -y1), (xe, -y1)]
    else:
        pts += [(x0, -x0 * _F12_TPSI), (x0, x0 * _F12_TPSI)]
    pts += [(sig_max, sig_max * _F12_TPSI)]
    return PL([(p.X(a), p.Y(b)) for a, b in pts], c="none", lw=0, fill=soft(c))


def _f12_zline_fig():
    o = []
    o.append(TX(14, 18, "(a) 仕様の領域と、比例制御の根軌跡", "start", 11, INK, True))
    p = Plot(58, 32, 282, 282, (-25, 5), (-15, 15))
    o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
    o.append(_f12_region(p, -4.0))
    o.append(SPLANE(p))
    o.append(_f12_zeta(p, _F12_ZETA))
    o.append(p.axes(xl="実部 σ [1/s]", yl="虚部 ω [rad/s]", xt=[-20, -10, 0], yt=[-10, 0, 10], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    o.append(SPLANE(p, rhp=False))
    o.append(W(p.X(-4), p.y, p.X(-4), p.y + p.h, c=GRN, lw=1.2, dash="5 3"))
    o.append(W(p.X(-16), p.y, p.X(-16), p.y + p.h, c=ALI, lw=1.2, dash="2 3"))
    # 比例制御の根軌跡と、領域の中の部分
    o.append(W(p.X(-20), p.Y(0), p.X(0), p.Y(0), c=SIG, lw=2.2))
    o.append(W(p.X(-10), p.y, p.X(-10), p.y + p.h, c=SIG, lw=2.2))
    o.append(W(p.X(-16), p.Y(0), p.X(-4), p.Y(0), c=GRN, lw=4.4))
    o.append(W(p.X(-10), p.Y(-10.49), p.X(-10), p.Y(10.49), c=GRN, lw=4.4))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [], MUT, 5))
    s1 = complex(-10, 10 * _F12_TPSI)
    o.append(W(p.X(0), p.Y(0), p.X(s1.real), p.Y(s1.imag), c=TEA, lw=1.1, dash="3 2"))
    o.append(W(p.X(-20), p.Y(0), p.X(s1.real), p.Y(s1.imag), c=PUR, lw=1.1, dash="3 2"))
    o.append(T(p.X(-4.2), p.Y(6.3), "14.49", "middle", 9, TEA, False, halo=True))
    o.append(T(p.X(-16.2), p.Y(6.3), "14.49", "middle", 9, PUR, False, halo=True))
    o.append(PZ(p, [s1, s1.conjugate()], [], GLD, 6))
    o.append(TX(p.X(-10) + 8, p.Y(10.49) - 6, "K_c = 0.21", "start", 9.5, GLD, True, halo=True))
    for v in (-4, -16):
        o.append(D(p.X(v), p.Y(0), GLD, 4))
    o.append(TX(p.X(-4) + 3, p.Y(0) + 15, "0.064", "start", 9, GLD, True, halo=True))
    o.append(TX(p.X(-16) - 3, p.Y(0) + 15, "0.064", "end", 9, GLD, True, halo=True))
    o.append(TX(p.X(-24.5), p.Y(13.6), "緑: 行き過ぎ量 5 % 以下・t_{2%} 1 s 以下", "start", 9, GRN, True, halo=True))
    o.append(TX(p.X(-24.5), p.Y(-13.9), "赤の点線: t_{2%} 0.25 s の線（実部 −16）", "start", 9, ALI, True, halo=True))
    o.append(TX(p.X(-14.5), p.Y(-11.6), "ζ = 0.690", "middle", 9, MUT, False, halo=True))
    # (b) ステップ応答
    o.append(TX(392, 18, "(b) 目標値の単位ステップ", "start", 11, INK, True))
    q = Plot(430, 32, 256, 200, (0, 1.5), (0, 1.3))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.5, 1, 1.5], yt=[0, 0.5, 1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    o.append(RECT(q.X(1), q.Y(1.02), q.X(1.5) - q.X(1), q.Y(0.98) - q.Y(1.02), 0, soft(GRN), "none", 0))
    o.append(q.line([(0, 1.05), (1.5, 1.05)], c=GRN, lw=1.1, dash="5 3"))
    o.append(W(q.X(1), q.y, q.X(1), q.y + q.h, c=GRN, lw=1.1, dash="5 3"))
    t = _f12_np.linspace(0, 1.5, 3001)
    rows = []
    for K, c in ((0.064, TEA), (0.21, SIG), (0.5, ALI)):
        y = _f12_step([1000 * K], [1, 20, 1000 * K], t)
        o.append(q.line(list(zip(t, y)), c=c, lw=1.9))
        rows.append((K, c) + _f12_info(t, y, 1.0))
    o.append(TX(q.X(1.48), q.Y(1.05) - 5, "5 %", "end", 9, GRN, True, halo=True))
    o.append(TX(q.X(1) + 4, q.Y(0.3), "1 s", "start", 9, GRN, True, halo=True))
    for i, (K, c, mp, t2) in enumerate(rows):
        o.append(TX(392, 282 + i * 15, "K_c = %g V/rad: 行き過ぎ %.1f %%、t_{2%%} = %.2f s" % (K, mp, t2), "start", 9.5, c, True))
    return SVG(700, 356, o, "減衰比の線との交点からゲインを決める（モータの位置の比例制御）。(a) 緑の領域は、行き過ぎ量 5 % 以下（減衰比 0.690 の 2 本の線の間）かつ 2 % 整定時間 1 s 以下（実部 −4 の線より左）。根軌跡（青）のうち、太い緑の部分が領域の中にあり、K<sub>c</sub> = 0.064〜0.21 V/rad にあたる。減衰比の線との交点 −10 ± j10.49 の K<sub>c</sub> は、極からの距離の積 14.49 × 14.49 ÷ 1000 = 0.21 V/rad。実部 −16（2 % 整定時間 0.25 s）の線より左には、根軌跡は届かない。(b) 0.21 V/rad は仕様（行き過ぎ 5 % の線と、1 s 以降の ±2 % の帯）を満たし、0.5 V/rad は行き過ぎ量の仕様を満たさない。領域の端の 0.064 V/rad は、2 % 整定時間が 1.05 s で、わずかに仕様を外れる（領域は目安の式 t<sub>2%</sub> ≈ 4/(ζω<sub>n</sub>) で描いたため）。")
F["e12_zline"] = _f12_zline_fig()


def _f12_pdes_fig():
    o = []
    o.append(TX(14, 18, "(a) 望む極 s_d = −20 + j20.98 を通るように零点を置く", "start", 11, INK, True))
    p = Plot(58, 32, 372, 228, (-56, 6), (-4, 34))
    o.append(_f12_sp(p, [-50, -40, -30, -20, -10, 0], [0, 10, 20, 30], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    o.append(_f12_zeta(p, _F12_ZETA))
    sd = complex(-20, 20 * _F12_TPSI)
    z = sd.real - sd.imag / math.tan(math.radians(43.63))
    # できあがった PD の根軌跡（円）
    Ks = _f12_kgrid(-4, 4, 200, extra=(0.13462, 5.2414))
    o.append(_f12_branches(p, _f12_track(_F12_PD[0], _F12_PD[1], Ks), c=SIG, lw=1.6))
    o.append(_f12_vec(p, complex(0, 0), sd, TEA, "133.6°", None, r=16, la=100))
    o.append(_f12_vec(p, complex(-20, 0), sd, PUR, "90°", None, r=14, la=45))
    o.append(_f12_vec(p, complex(z, 0), sd, GLD, "43.6°", None, r=22, la=22))
    o.append(PZ(p, [complex(0, 0), complex(-20, 0)], [complex(z, 0)], MUT, 5.5))
    o.append(D(p.X(sd.real), p.Y(sd.imag), GRN, 5))
    o.append(TX(p.X(sd.real) + 9, p.Y(sd.imag) - 6, "s_d（ζ = 0.690、実部 −20）", "start", 9.5, GRN, True, halo=True))
    o.append(TX(p.X(z), p.Y(0) + 17, "零点 −42.0", "middle", 9, GLD, True, halo=True))
    o.append(TX(p.X(-55), p.Y(31.5), "零点からの角度 = 133.6° + 90° − 180° = 43.6°", "start", 9, GLD, True, halo=True))
    o.append(TX(p.X(-55), p.Y(28.3), "零点 = −20 − 20.98 ÷ tan 43.6° = −42.0", "start", 9, GLD, False, halo=True))
    o.append(TX(p.X(-55), p.Y(25.1), "K_c = 28.99 × 20.98 ÷ (23.8 × 30.41) = 0.840", "start", 9, INK, False, halo=True))
    o.append(TX(p.X(-13), p.Y(31.5), "青: できた PD の根軌跡", "start", 9, SIG, True, halo=True))
    # (b) ステップ応答
    o.append(TX(470, 18, "(b) 目標値の単位ステップ", "start", 11, INK, True))
    q = Plot(500, 32, 188, 180, (0, 0.6), (0, 1.3))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.2, 0.4, 0.6], yt=[0, 0.5, 1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    o.append(RECT(q.X(0.25), q.Y(1.02), q.X(0.6) - q.X(0.25), q.Y(0.98) - q.Y(1.02), 0, soft(GRN), "none", 0))
    o.append(q.line([(0, 1.05), (0.6, 1.05)], c=GRN, lw=1.1, dash="5 3"))
    o.append(W(q.X(0.25), q.y, q.X(0.25), q.y + q.h, c=GRN, lw=1.1, dash="5 3"))
    t = _f12_np.linspace(0, 0.6, 2401)
    yp = _f12_step([210.0], [1, 20, 210.0], t)
    yd = _f12_step([840.0], [1, 40, 840.0], t)
    o.append(q.line(list(zip(t, yp)), c=MUT, lw=1.8))
    o.append(q.line(list(zip(t, yd)), c=SIG, lw=2))
    o.append(TX(q.X(0.25) + 4, q.Y(0.25), "0.25 s", "start", 9, GRN, True, halo=True))
    mp1, t21 = _f12_info(t, yd, 1.0); mp0, t20 = _f12_info(t, yp, 1.0)
    o.append(TX(470, 262, "PD（0.84 V/rad）: %.1f %%、%.3f s" % (mp1, t21), "start", 9.5, SIG, True))
    o.append(TX(470, 277, "比例（0.21 V/rad）: %.1f %%、%.3f s" % (mp0, t20), "start", 9.5, MUT, True))
    o.append(TX(470, 291, "（行き過ぎ量、2 % 整定時間）", "start", 9, MUT))
    return SVG(700, 300, o, "角度の条件から PD 制御の零点を決める（モータの位置）。(a) 減衰比 0.690 の線（破線）の上で実部 −20 の点 s<sub>d</sub> を望む極に選ぶ。開ループの極 0 と −20 からの矢印の角度の和は 223.6° なので、零点からの角度が 43.6° になれば左辺が −180° になる。その零点は −42.0（T<sub>D</sub> = 0.0238 s）で、大きさの条件から K<sub>c</sub> = 0.840 V/rad。できた PD の根軌跡（青）は、確かに s<sub>d</sub> を通る。(b) 2 % 整定時間 0.25 s 以下・行き過ぎ量 5 % 以下の仕様（緑の線と帯）を、PD（D 動作は測った制御量に掛ける）は満たし、比例制御は満たさない。")
F["e12_pdes"] = _f12_pdes_fig()


# =====================================================================
# 6 節: 根軌跡の限界 — 零点・支配極
# =====================================================================
def _f12_limits_fig():
    o = []
    # (a) 同じ極、違う零点（PD: 測定値微分と偏差の微分）
    o.append(TX(14, 18, "(a) 同じ極 −20 ± j20.98、違う零点（PD）", "start", 11, INK, True))
    p = Plot(56, 32, 270, 110, (-50, 5), (-25, 25))
    o.append(_f12_sp(p, [-40, -20, 0], [-20, 0, 20], xl="実部 σ [1/s]", yl="虚部"))
    o.append(PZ(p, [complex(-20, 20.98), complex(-20, -20.98)], [], SIG, 5.5))
    o.append(PZ(p, [], [complex(-42, 0)], GLD, 5.5))
    o.append(TX(p.X(-42), p.Y(0) - 9, "偏差の微分だけにある零点 −42", "middle", 9, GLD, True, halo=True))
    q = Plot(56, 190, 270, 120, (0, 0.4), (0, 1.2))
    o.append(q.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.1, 0.2, 0.3, 0.4], yt=[0, 0.5, 1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    t = _f12_np.linspace(0, 0.4, 2001)
    o.append(q.line([(0, 1), (0.4, 1)], c=MUT, lw=1, dash="4 3"))
    ym = _f12_step([840.0], [1, 40, 840.0], t)
    ye = _f12_step([20.0, 840.0], [1, 40, 840.0], t)
    o.append(q.line(list(zip(t, ym)), c=SIG, lw=2))
    o.append(q.line(list(zip(t, ye)), c=GLD, lw=2))
    o.append(TX(q.X(0.155), q.Y(1.12), "偏差の微分: 7.5 %", "start", 9, GLD, True, halo=True))
    o.append(TX(q.X(0.2), q.Y(0.78), "測定値微分: 5.0 %", "start", 9, SIG, True, halo=True))
    # (b) PI: 極の組は支配極でない
    o.append(TX(372, 18, "(b) PI（K_c = 0.21）: 組より虚軸に近い極がある", "start", 11, INK, True))
    r = Plot(414, 32, 270, 110, (-12, 2), (-12, 12))
    o.append(_f12_sp(r, [-10, -5, 0], [-10, 0, 10], xl="実部 σ [1/s]", yl="虚部"))
    cl = _f12_np.roots([1, 20, 210, 500])
    o.append(PZ(r, [complex(z) for z in cl if abs(z.imag) > 1], [], SIG, 5.5))
    o.append(PZ(r, [complex(z) for z in cl if abs(z.imag) <= 1], [], TEA, 5.5))
    o.append(PZ(r, [], [complex(-1 / _F12_TIPI, 0)], GLD, 5))
    o.append(TX(r.X(-3.2), r.Y(0) + 17, "−3.20", "end", 9, TEA, True, halo=True))
    o.append(TX(r.X(-2.38), r.Y(0) - 9, "零点 −2.38", "start", 9, GLD, True, halo=True))
    o.append(TX(r.X(-8.4) + 8, r.Y(9.26) + 4, "−8.40 ± j9.26", "start", 9, SIG, True, halo=True))
    g = Plot(414, 190, 270, 120, (0, 1.5), (0, 1.4))
    o.append(g.axes(xl="時間 t [s]", yl="角度 [rad]", xt=[0, 0.5, 1, 1.5], yt=[0, 0.5, 1], xfmt=_f12_fmt, yfmt=_f12_fmt, sz=9))
    t2 = _f12_np.linspace(0, 1.5, 3001)
    o.append(g.line([(0, 1), (1.5, 1)], c=MUT, lw=1, dash="4 3"))
    ya = _f12_step([210.0, 500.0], [1, 20, 210.0, 500.0], t2)
    pr = [z for z in cl if z.imag > 1][0]
    wn2 = abs(pr) ** 2
    yp = _f12_step([wn2], [1, -2 * pr.real, wn2], t2)
    o.append(g.line(list(zip(t2, yp)), c=MUT, lw=1.8, dash="5 3"))
    o.append(g.line(list(zip(t2, ya)), c=SIG, lw=2))
    o.append(g.line([(v, 0.477 * math.exp(-3.2003 * v)) for v in t2], c=TEA, lw=1.6))
    o.append(TX(g.X(0.33), g.Y(1.3), "実際: 26.0 %、1.00 s", "start", 9, SIG, True, halo=True))
    o.append(TX(g.X(0.62), g.Y(0.84), "組だけ: 5.8 %、0.48 s", "start", 9, MUT, True, halo=True))
    o.append(TX(g.X(0.5), g.Y(0.2), "極 −3.20 の項 0.48e^{−3.20t}", "start", 9, TEA, True, halo=True))
    return SVG(700, 356, o, "根軌跡が示すのは閉ループの極だけである。(a) 5 節の PD 制御で、D 動作を測った制御量に掛けると零点は無く、行き過ぎ量は 5.0 % だが、偏差に掛けると閉ループの伝達関数に零点 −42 が加わり、極は同じでも 7.5 % 行き過ぎる。(b) PI 制御の極の組 −8.40 ± j9.26 だけの二次遅れ（灰の破線）なら行き過ぎ量 5.8 %・2 % 整定時間 0.48 s だが、実際の応答（青）は 26.0 %・1.00 s。組より虚軸に近い極 −3.20 の項（青緑、部分分数分解で求めた）がゆっくり減りながら応答を持ち上げる。零点 −2.38 は極 −3.20 と一致しないので、この項を消さない。")
F["e12_limits"] = _f12_limits_fig()


# =====================================================================
# 6 節: むだ時間（測った速度が 0.1 s 遅れる台車の比例制御）
# =====================================================================
def _f12_delay_fig():
    from scipy.special import lambertw as _lw
    from scipy.optimize import brentq as _bq
    o = []
    L = 0.1
    Ks = _f12_np.logspace(-1, 2.3, 1200)
    o.append(TX(14, 18, "(a) 本当の根: s + 2 + K_ce^{−0.1s} = 0", "start", 11, INK, True))
    p = Plot(56, 32, 270, 270, (-60, 40), (-100, 100))
    o.append(_f12_sp(p, [-60, -40, -20, 0, 20, 40], [-100, -50, 0, 50, 100], xl="実部 σ [1/s]", yl="虚部 ω [rad/s]"))
    for kb in (-2, -1, 0, 1):
        zs = [-2 + _lw(-L * K * math.exp(2 * L), kb) / L for K in Ks]
        o.append(p.clip([(complex(z).real, complex(z).imag) for z in zs], c=SIG, lw=2))
        o.append(_f12_heads(p, [_f12_np.array(zs)], Ks, 40.0, SIG))
    o.append(PZ(p, [complex(-2, 0)], [], MUT, 5))
    w1 = _bq(lambda w: math.atan(w / 2) + L * w - math.pi, 1, 30); K1 = math.hypot(w1, 2)
    w2 = _bq(lambda w: math.atan(w / 2) + L * w - 3 * math.pi, 40, 120); K2 = math.hypot(w2, 2)
    for w, K, c in ((w1, K1, ALI), (w2, K2, ALI)):
        o.append(D(p.X(0), p.Y(w), c, 4)); o.append(D(p.X(0), p.Y(-w), c, 4))
    o.append(TX(p.X(0) + 6, p.Y(w1) - 4, "K_c = %.1f: ±j%.1f" % (K1, w1), "start", 9, ALI, True, halo=True))
    o.append(TX(p.X(0) + 6, p.Y(w2) - 4, "K_c = %.0f: ±j%.0f" % (K2, w2), "start", 9, ALI, True, halo=True))
    o.append(TX(p.X(-58), p.Y(-92), "枝は無限にある（図はその 4 本）", "start", 9, SIG, True, halo=True))
    # (b) パデ近似
    o.append(TX(372, 18, "(b) パデ近似した根軌跡", "start", 11, INK, True))
    r = Plot(414, 32, 270, 270, (-60, 40), (-100, 100))
    o.append(_f12_sp(r, [-60, -40, -20, 0, 20, 40], [-100, -50, 0, 50, 100], xl="実部 σ [1/s]", yl=None))
    Kg = _f12_kgrid(-3, 4, 200)
    a1 = list(_f12_np.polymul([1, 2], [L / 2, 1])); b1 = [-L / 2, 1.0]
    R1 = _f12_track(a1, b1, Kg)
    nP = [L * L / 12, -L / 2, 1.0]; dP = [L * L / 12, L / 2, 1.0]
    a2 = list(_f12_np.polymul([1, 2], dP)); b2 = nP
    R2 = _f12_track(a2, b2, Kg)
    o.append(_f12_branches(r, R2, c=TEA, lw=1.8, dash="6 3"))
    o.append(_f12_branches(r, R1, c=GLD, lw=2))
    o.append(PZ(r, [complex(-2, 0), complex(-20, 0)], [complex(20, 0)], GLD, 5))
    o.append(PZ(r, [complex(z) for z in _f12_np.roots(dP)], [complex(z) for z in _f12_np.roots(nP)], TEA, 4.5))
    o.append(D(r.X(0), r.Y(21.9), GLD, 4)); o.append(D(r.X(0), r.Y(-21.9), GLD, 4))
    o.append(TX(r.X(0) + 6, r.Y(21.9) - 4, "1 次: 22.0（±j21.9）", "start", 9, GLD, True, halo=True))
    o.append(D(r.X(0), r.Y(17.04), TEA, 3.6))
    o.append(TX(r.X(0) - 6, r.Y(17.04) - 6, "2 次: 17.2（±j17.0）", "end", 9, TEA, True, halo=True))
    o.append(TX(r.X(-58), r.Y(-80), "金: 1 次（零点 +20、極 −20）", "start", 9, GLD, True, halo=True))
    o.append(TX(r.X(-58), r.Y(-92), "青緑の破線: 2 次（零点と極が 2 つずつ）", "start", 9, TEA, True, halo=True))
    return SVG(700, 344, o, "むだ時間のあるループの根軌跡（台車の速度、測った値が 0.1 s 遅れる。9 章 1 節）。(a) 特性方程式は多項式にならず、根は無限にある（ランベルトの W 関数という特別な関数で求めた。図は虚部の小さい 4 本の枝）。K<sub>c</sub> を上げると、どの枝も右へ進み、17.0 N/(m/s) で ±j16.9 を、さらに 80 N/(m/s) ほどで次の組が虚軸を横切る。(b) e<sup>−0.1s</sup> を多項式の分数で近似すると根軌跡を描けるが、1 次の近似では虚軸を横切るゲインが 22.0 N/(m/s) と 3 割ずれる。2 次の近似では 17.2 N/(m/s) まで近づくが、近似の極と零点の数だけ枝が増え、本当には無い根も現れる。")
F["e12_delay"] = _f12_delay_fig()
