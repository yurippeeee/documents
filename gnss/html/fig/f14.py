# -*- coding: utf-8 -*-
# 14 章 時刻と 1PPS — GNSS で時計を合わせる の図
import numpy as _f14_np

# =====================================================================
# 例の値（本文・デモと同じ。$SP/g14/check_*.py と C のテストで確かめた）
# =====================================================================
_F14_C = 299792458.0
_F14_FTIM = 10e6                 # マイコンのタイマの名目の周波数 [Hz]（例）
_F14_FQ = 48e6                   # 受信機の中のパルスのクロック [Hz]（例）
_F14_TQ = 1e9 / _F14_FQ          # その 1 周期 [ns] = 20.83
_F14_KP, _F14_KI = 0.25, 1 / 32  # 例のゲイン（T_p = 1 s）
_F14_RM = 20e-6                  # マイコンの水晶の周波数の誤差（例）
_F14_TDOP, _F14_UERE = 0.788, 3.99   # 7 章の東京の 8 機・誤差の予算
_F14_SIGT = _F14_TDOP * _F14_UERE / _F14_C * 1e9   # 10.5 ns
_F14_EPOCH_LEN = 626             # 10 章の例の 1 回分の文 [B]（GPS と GLONASS、11 文）
_F14_GGA_LEN = 73                # その GGA の長さ [B]
_F14_LAT0 = 0.12                 # パルスから文が出始めるまで [s]（10 章の図の例）


def _f14_g(v):
    """3 桁ごとに空白を入れた整数（1 478 424 470 など）。"""
    s = "{:,}".format(int(v)).replace(",", " ")
    return s.replace("-", "−")


def _f14_f(v, d=1):
    return ("%.*f" % (d, v)).replace("-", "−")


def _f14_pi(KP, KI, rm=_F14_RM, n=200, r0=0.0, s0=0.0):
    """PI の時計合わせ（本文 3 節の式）。δt[k+1] = δt[k] + rm − r̂[k]、r̂[k] = KP δt[k] + KI Σ δt[j]（T_p = 1 s）。返り値 δt [s] の並び。"""
    d, s, out = 0.0, s0, []
    for _ in range(n):
        out.append(d)
        s += d
        r = KP * d + KI * s
        d = d + rm - r
        if abs(d) > 1:
            d = math.copysign(1.0, d)
    return out


_F14_NUSPAN = '<tspan font-family="serif" font-style="italic">ν</tspan>'


def _f14_nu(o):
    """図の文字の ν を斜体のセリフ体にする（サンセリフの ν は v に見えるため）。"""
    return [x.replace("ν", _F14_NUSPAN) for x in o]


def _f14_q(x0, nu, k, tq=_F14_TQ):
    """k 番目の秒の頭の量子化誤差 [ns]（いちばん近い刻みで出す）。x の端数が x0 + k ν。"""
    f = (x0 + k * nu) % 1.0
    return -f * tq if f < 0.5 else (1.0 - f) * tq


def _f14_pulse(o, X, y0, y1, ts, w=0.1, c=GRN, lw=2.0, x_from=None, x_to=None):
    """1PPS の波形（立ち上がりの時刻 ts、幅 w [s]）。X は時刻 → 画面の x。"""
    pts = [(x_from if x_from is not None else X(ts[0] - 0.3), y0)]
    for s in ts:
        pts += [(X(s), y0), (X(s), y1), (X(s + w), y1), (X(s + w), y0)]
    pts.append((x_to if x_to is not None else X(ts[-1] + 0.6), y0))
    o.append(PL(pts, c=c, lw=lw))


# =====================================================================
# 1 節: うるう秒の前後の 3 つの数え方
# =====================================================================
def _f14_leap_fig():
    o = []
    utc = ["23:59:57", "23:59:58", "23:59:59", "23:59:60", "00:00:00", "00:00:01", "00:00:02"]
    gps = ["00:00:14", "00:00:15", "00:00:16", "00:00:17", "00:00:18", "00:00:19", "00:00:20"]
    unx = [1483228797, 1483228798, 1483228799, 1483228799, 1483228800, 1483228801, 1483228802]
    x0, cw, ch = 168, 74, 30
    rows = [("UTC", "協定世界時", INK, utc), ("GPS 時刻", "週 1930 の中の時刻", SIG, gps), ("1970 年からの秒", "うるう秒を数えない", MUT, [_f14_g(v).replace(" ", "") for v in unx])]
    o.append(T(14, 18, "2016 年 12 月 31 日の終わりのうるう秒の前後（1 秒ずつの目盛）", "start", 11.5, INK, True))
    # うるう秒の列
    xl = x0 + 3 * cw
    o.append(RECT(xl - 2, 44, cw + 4, 3 * (ch + 10) + 8, 4, ASOFT, ALI, 1.2))
    o.append(T(xl + cw / 2, 40, "うるう秒", "middle", 10, ALI, True))
    o.append(T(x0 + 1.5 * cw, 40, "12 月 31 日（UTC）", "middle", 9.5, MUT))
    o.append(T(x0 + 5.5 * cw, 40, "1 月 1 日（UTC）", "middle", 9.5, MUT))
    for r, (nm, sub, c, vals) in enumerate(rows):
        y = 50 + r * (ch + 10)
        o.append(T(14, y + 14, nm, "start", 10.5, c, True))
        o.append(T(14, y + 27, sub, "start", 9, MUT))
        for i, v in enumerate(vals):
            x = x0 + i * cw
            bad = (r == 2 and i == 3) or (r == 0 and i == 3)
            o.append(RECT(x + 2, y, cw - 4, ch, 4, ASOFT if bad else soft(c), ALI if bad else c, 1.1))
            o.append(T(x + cw / 2, y + 19.5, v, "middle", 10 if r == 2 else 11, ALI if bad else (INK if c == INK else c), True, True))
    # 差
    yb = 50 + 3 * (ch + 10) + 16
    o.append(W(x0 + 4, yb, x0 + 4, yb + 6, x0 + 3 * cw - 4, yb + 6, x0 + 3 * cw - 4, yb, c=SIG, lw=1.2))
    o.append(T(x0 + 1.5 * cw, yb + 22, "GPS 時刻 − UTC = 17 s", "middle", 10, SIG, True))
    o.append(W(x0 + 4 * cw + 4, yb, x0 + 4 * cw + 4, yb + 6, x0 + 7 * cw - 4, yb + 6, x0 + 7 * cw - 4, yb, c=SIG, lw=1.2))
    o.append(T(x0 + 5.5 * cw, yb + 22, "18 s（2017 年 1 月から）", "middle", 10, SIG, True))
    o.append(T(xl + cw / 2, yb + 22, "1 s 開く", "middle", 9.5, ALI, True))
    o.append(T(x0 + 3.5 * cw, yb + 44, "1970 年からの秒は、うるう秒の 1 秒の間、前の秒と同じ値になる（同じ値が 2 秒続く）", "middle", 9.5, MUT))
    return SVG(700, yb + 54, o, "うるう秒の前後の、UTC・GPS 時刻・1970 年 1 月 1 日 0 時（UTC）からの秒（GPS 時刻の 2017 年 1 月 1 日 0 時は、週 1930 の始まり）。")


F["e14_leap"] = _f14_leap_fig()


# =====================================================================
# 1 節: 日付と時刻 ↔ 週番号と週の中の秒（筆算のような手順）
# =====================================================================
def _f14_steps(o, x, y, steps, wv=300, dy=33):
    """手順の行を描く。steps = [(番号, 式（等幅）, 説明, 色), ...]。返り値は次の y。"""
    for k, (n, ex, note, c) in enumerate(steps):
        yy = y + k * dy
        if n:
            o.append(CIRC(x + 8, yy - 4, 8, c=c, lw=1.1, fill=soft(c)))
            o.append(T(x + 8, yy - 0.5, n, "middle", 9.5, c, True))
        o.append(T(x + 22, yy, ex, "start", 10.5, c, True, True))
        if note:
            o.append(T(x + 22, yy + 14, note, "start", 9.5, MUT))
    return y + len(steps) * dy


def _f14_conv_fig():
    o = []
    xa, xb = 14, 362
    o.append(T(xa, 18, "(a) UTC の日付と時刻 → 週番号と週の中の秒", "start", 11.5, INK, True))
    o.append(T(xb, 18, "(b) 10 bit の週番号と週の中の秒 → UTC", "start", 11.5, INK, True))
    sa = [("1", "2026-11-11 09:27:50", "UTC（10 章・12 章の例の文の時刻）", INK),
          ("2", "+ 18 s → 09:28:08", "うるう秒の数を足して GPS 時刻にする", SIG),
          ("3", "17 111 日 + 34 088 s", "1980-01-06 0 時からの日数と、その日の秒", SIG),
          ("4", "17 111 ÷ 7 = 2444 あまり 3", "週番号 2444、週の中の 3 日目（日曜日が 0。水曜日）", SIG),
          ("5", "3 × 86 400 + 34 088 = 293 288", "週の中の秒 [s]", SIG),
          ("6", "2444 − 2 × 1024 = 396", "航法メッセージが 10 bit で送る週番号", PUR)]
    sb = [("1", "396 と 293 288 s", "受け取った値（基準の週は例: 2400）", PUR),
          ("2", "2048 + 396 = 2444", "基準 2400 と同じ一巡の候補（2400 以上なので、そのまま）", SIG),
          ("3", "2444 × 604 800 + 293 288 − 18", "= 1 478 424 470 s（うるう秒の数を引いた UTC の数え方）", SIG),
          ("4", "÷ 86 400 = 17 111 日 あまり 34 070", "34 070 s = 9 時 27 分 50 秒", SIG),
          ("5", "17 111 + 5 − 16 802 = 314", "1980-01-01 からの日数から、1980〜2025 年の 46 年分を引く", SIG),
          ("6", "314 − 304 = 10", "1〜10 月の 304 日を引く → 11 月の 10 + 1 = 11 日", SIG),
          ("", "→ 2026-11-11 09:27:50（UTC）", None, INK)]
    ya = _f14_steps(o, xa, 48, sa)
    yb = _f14_steps(o, xb, 48, sb)
    o.append(W(352, 30, 352, max(ya, yb) - 16, c=LIN, lw=0.8))
    return SVG(700, max(ya, yb) - 8, o, "日付と時刻と、週番号・週の中の秒の間の換算（例: 2026 年 11 月 11 日 9 時 27 分 50 秒 UTC。GPS 時刻 − UTC = 18 s）。(b) は本文の gps_to_utc と同じ手順。")


F["e14_conv"] = _f14_conv_fig()


# =====================================================================
# 1 節: 10 bit の週番号の一巡と、1 週の中の秒
# =====================================================================
def _f14_week_fig():
    import datetime as _dt
    o = []
    EP = _dt.datetime(1980, 1, 6)
    yr = lambda d: d.year + (d - _dt.datetime(d.year, 1, 1)).total_seconds() / ((_dt.datetime(d.year + 1, 1, 1) - _dt.datetime(d.year, 1, 1)).total_seconds())
    wk = lambda w: yr(EP + _dt.timedelta(weeks=w))
    o.append(T(14, 18, "(a) 10 bit の週番号（1024 週ごとに 0 に戻る）", "start", 11.5, INK, True))
    p = Plot(70, 34, 610, 130, (1978, 2062), (0, 1100))
    o.append(p.axes(xl="年", yl="10 bit の週番号", xt=[1980, 1990, 2000, 2010, 2020, 2030, 2040, 2050, 2060], yt=[0, 256, 512, 768, 1023], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    # 基準の週 2400 から 1024 週の範囲
    o.append(RECT(p.X(wk(2400)), p.y, p.X(wk(3424)) - p.X(wk(2400)), p.h, 0, GSOFT, "none", 0))
    o.append(T((p.X(wk(2400)) + p.X(wk(3424))) / 2, p.y + 14, "基準の週 2400 から 1024 週", "middle", 9.5, GRN, True, halo=True))
    o.append(T((p.X(wk(2400)) + p.X(wk(3424))) / 2, p.y + 27, "（2026-01-04〜2045-08-19）", "middle", 9, GRN, False, halo=True))
    for c in range(4):
        a, b = c * 1024, (c + 1) * 1024
        pts = [(wk(a), 0), (wk(b), 1023.99)]
        o.append(p.clip(pts, c=SIG, lw=2))
        if c < 3:
            o.append(p.clip([(wk(b), 1023.99), (wk(b), 0)], c=SIG, lw=1, dash="3 2"))
    for w, lab in ((1024, "1999-08-22"), (2048, "2019-04-07"), (3072, "2038-11-21")):
        o.append(D(p.X(wk(w)), p.Y(0), ALI, 4))
        o.append(T(p.X(wk(w)), p.Y(0) - 8, lab, "middle", 9.5, ALI, True, halo=True))
    xe = wk(2444 + 293288 / 604800)
    o.append(D(p.X(xe), p.Y(396), GLD, 4.5))
    o.append(T(p.X(xe) + 7, p.Y(396) + 4, "2026-11-11: 週 2444 → 396", "start", 9.5, GLD, True, halo=True))
    # (b) 1 週の中
    yb = 216
    o.append(T(14, yb, "(b) 週番号 2444 の 1 週（日曜日 0 時から。GPS 時刻）", "start", 11.5, INK, True))
    q = Plot(70, yb + 22, 600, 30, (0, 604800), (0, 1))
    o.append(RECT(q.x, q.y, q.w, q.h, 3, SCR, LIN, 1))
    days = ["日", "月", "火", "水", "木", "金", "土"]
    dates = ["11/8", "11/9", "11/10", "11/11", "11/12", "11/13", "11/14"]
    for d in range(8):
        x = q.X(d * 86400)
        o.append(W(x, q.y, x, q.y + q.h + 4, c=MUT, lw=1))
        o.append(T(x, q.y + q.h + 16, _f14_g(d * 86400), "middle", 9, MUT, False, True))
        if d < 7:
            o.append(T(x + 8, q.y + 13, days[d], "start", 10, INK, True))
            o.append(T(x + 8, q.y + 25, dates[d], "start", 9, MUT))
    tw0 = 293288
    o.append(W(q.X(tw0), q.y - 6, q.X(tw0), q.y + q.h, c=GLD, lw=2.2))
    o.append(T(q.X(tw0), q.y - 10, "水曜日 09:28:08（GPS 時刻）= 293 288 s", "middle", 10, GLD, True, halo=True))
    o.append(T(q.x + q.w / 2, q.y + q.h + 32, "週の中の秒 [s]（0〜604 799。日曜日 0 時に 0 に戻り、週番号が 1 増える）", "middle", 10, MUT))
    return SVG(700, yb + 22 + 30 + 40, o, "週番号の一巡と週の中の秒（一巡の日付は GPS 時刻の 0 時。Python で計算した。基準の週 2400 は例）。")


F["e14_week"] = _f14_week_fig()


# =====================================================================
# 2 節: パルスの立ち上がりが表すもの（GPS 時刻と UTC で同じ瞬間）と、その誤差
# =====================================================================
def _f14_meaning_fig():
    o = []
    o.append(T(14, 18, "(a) 同じ立ち上がりの、2 つの名前", "start", 11.5, INK, True))
    X = lambda s: 120 + (s + 0.35) * 82
    for s in (0, 1, 2):
        o.append(W(X(s), 34, X(s), 168, c=FNT, lw=1, dash="3 3"))
    for r, (nm, c, labs) in enumerate((("GPS 時刻", SIG, ["09:28:07", "09:28:08", "09:28:09"]), ("UTC", INK, ["09:27:49", "09:27:50", "09:27:51"]))):
        y = 52 + r * 40
        o.append(T(14, y + 4, nm, "start", 10.5, c, True))
        o.append(ARR(X(-0.3), y, X(2.55), y, c=c, lw=1.3, head=6))
        for s in (0, 1, 2):
            o.append(W(X(s), y - 5, X(s), y + 5, c=c, lw=1.6))
            o.append(T(X(s), y - 8, labs[s], "middle", 9.5, c, True, True))
    _f14_pulse(o, X, 160, 132, [0, 1, 2], c=GRN, x_from=X(-0.3), x_to=X(2.55))
    o.append(T(14, 152, "1PPS", "start", 10.5, GRN, True))
    o.append(T(X(1) + 4, 186, "差は整数の 18 s。立ち上がりは同じ瞬間", "middle", 9.5, MUT))
    # (b) 立ち上がりの誤差
    o.append(T(390, 18, "(b) 立ち上がりの時刻の誤差（例）", "start", 11.5, INK, True))
    p = Plot(420, 40, 260, 110, (-40, 40), (0, 0.045))
    o.append(p.axes(xl="本当の秒の頭からのずれ [ns]", xt=[-40, -20, 0, 20, 40], yt=[], xfmt=lambda v: _f14_f(v, 0)))
    sg = _F14_SIGT
    rng = _f14_np.random.default_rng(14)
    xs = rng.normal(0, sg, 3000)
    h, e = _f14_np.histogram(xs, bins=32, range=(-40, 40), density=True)
    for i in range(len(h)):
        o.append(RECT(p.X(e[i]), p.Y(h[i]), p.X(e[i + 1]) - p.X(e[i]) - 0.6, p.Y(0) - p.Y(h[i]), 0, GOSOFT, GLD, 0.6))
    xx = _f14_np.linspace(-40, 40, 161)
    o.append(p.line([(v, math.exp(-v * v / (2 * sg * sg)) / (sg * math.sqrt(2 * math.pi))) for v in xx], c=GLD, lw=1.8))
    o.append(W(p.X(0), p.y, p.X(0), p.y + p.h, c=GRN, lw=1.6))
    for s in (-sg, sg):
        o.append(W(p.X(s), p.y + 8, p.X(s), p.y + p.h, c=SIG, lw=1, dash="4 3"))
    o.append(DIM(p.X(0), p.y + 14, p.X(sg), p.y + 14, None, c=SIG))
    o.append(TX(p.X(sg) + 4, p.y + 18, "σ_t = %.1f ns" % sg, "start", 9.5, SIG, True, halo=True))
    o.append(TX(390, 200, "σ_t = TDOP × σ_{UERE}/c = 0.79 × 3.99 m ÷ c = 10.5 ns", "start", 10, INK, True))
    o.append(T(390, 216, "（7 章の東京の 8 機。誤差が衛星ごとに独立とした見積もり）", "start", 9.5, MUT))
    return SVG(700, 226, o, "1PPS の立ち上がり（例: 2026 年 11 月 11 日）と、受信機が求めた秒の頭の誤差（正規分布の乱数 3000 回。標準偏差は TDOP × UERE ÷ 光の速さ）。")


F["e14_meaning"] = _f14_meaning_fig()


# =====================================================================
# 2 節: どのパルスが何秒か — 文の時刻との対応（10 章の例の文と時間）
# =====================================================================
def _f14_queue(rate, nsec, baud=9600, nbytes=_F14_EPOCH_LEN, lat=_F14_LAT0):
    """1 秒に rate 回の文の組を、順に送る（捨てない）ときの [(位置を求めた時刻, 送り始め, 送り終わり)]。"""
    out, end = [], -1e9
    for i in range(int(nsec * rate) + 1):
        e = i / rate
        st = max(e + lat, end)
        end = st + nbytes * 10.0 / baud
        out.append((e, st, end))
    return out


def _f14_label_fig():
    o = []
    t0 = 50   # 09:27:50
    def hms(s):
        s = int(round(s))
        return "09:27:%02d" % (t0 + s)
    # (a)
    o.append(T(14, 18, "(a) 文の時刻は、直前のパルスの秒（例: 9600 bit/s、1 秒に 1 回、626 B を 0.65 s で送る）", "start", 11.5, INK, True))
    X = lambda s: 100 + (s + 0.15) * 180
    ya = 34
    for s in (0, 1, 2, 3):
        o.append(W(X(s), ya + 4, X(s), ya + 112, c=FNT, lw=1, dash="3 3"))
        o.append(T(X(s), ya + 126, hms(s), "middle", 9.5, MUT, False, True))
    _f14_pulse(o, X, ya + 34, ya + 10, [0, 1, 2, 3], x_from=X(-0.15), x_to=X(3.2))
    o.append(T(92, ya + 28, "1PPS", "end", 10, GRN, True))
    yt = ya + 52
    o.append(T(92, yt + 13, "文（TXD）", "end", 10, GLD, True))
    for s in (0, 1, 2):
        a, b = s + _F14_LAT0, s + _F14_LAT0 + _F14_EPOCH_LEN * 10 / 9600
        o.append(RECT(X(a), yt, X(b) - X(a), 18, 2, GOSOFT, GLD, 1))
        o.append(T(X(a) + 4, yt + 13, "GGA %s.00 …" % hms(s).replace(":", ""), "start", 9, GLD, True, True))
        o.append(CARR(X(a) + 10, yt - 2, X(s) + 3, ya + 12, bend=0.25, c=SIG, lw=1.3, head=6))
    o.append(T(X(0.5), ya + 98, "マイコン: パルスを捕まえ（3 節）、次に届いた文の時刻を、そのパルスの名前にする", "start", 9.5, SIG, True))
    # (b)
    yb = ya + 150
    o.append(T(14, yb, "(b) 1 秒に 2 回出すと（負荷率 130 %）、文がたまり、09:27:54 のパルスに 1 秒前の名前を付ける", "start", 11.5, INK, True))
    Xb = lambda s: 96 + (s + 0.1) * 114
    q = _f14_queue(2, 5)
    yp = yb + 16
    for s in range(6):
        o.append(W(Xb(s), yp + 2, Xb(s), yp + 76, c=FNT, lw=1, dash="3 3"))
        o.append(T(Xb(s), yp + 90, hms(s), "middle", 9, MUT, False, True))
    _f14_pulse(o, Xb, yp + 26, yp + 6, list(range(6)), x_from=Xb(-0.1), x_to=Xb(5.1))
    o.append(T(92, yp + 20, "1PPS", "end", 10, GRN, True))
    ytb = yp + 40
    o.append(T(92, ytb + 13, "文（TXD）", "end", 10, GLD, True))
    for i, (e, st, en) in enumerate(q):
        if st > 5.0:
            break
        en2 = min(en, 5.1)
        whole = abs(e - round(e)) < 1e-9
        o.append(RECT(Xb(st), ytb, Xb(en2) - Xb(st) - 1, 18, 2, GOSOFT if whole else MSOFT, GLD if whole else MUT, 1))
        if Xb(en2) - Xb(st) > 40:
            o.append(T(Xb(st) + 3, ytb + 13, ("%02d.%s" % (t0 + int(e), "00" if whole else "50")), "start", 9, GLD if whole else MUT, True, True))
        if whole:
            gga = st + _F14_GGA_LEN * 10 / 9600
            k = math.floor(gga)
            ok = (k == round(e))
            c = GRN if ok else ALI
            o.append(D(Xb(gga), ytb + 26, c, 3))
            o.append(W(Xb(gga), ytb + 26, Xb(k) + 2, yp + 8, c=c, lw=1.2, dash=None if ok else "4 2"))
            if not ok:
                o.append(T(Xb(k) - 6, yp + 2, "09:27:%02d と誤る" % (t0 + int(e)), "end", 9.5, ALI, True, halo=True))
    o.append(T(Xb(0.2), yp + 108, "文の組の頭の数字は、位置を求めた時刻の秒（.50 は 0.5 s の組。名前には使わない）", "start", 9.5, MUT))
    # (c)
    yc = yp + 136
    o.append(T(14, yc, "(c) 次のパルスの時刻を、パルスの前に予告する製品もある（例）", "start", 11.5, INK, True))
    yp2 = yc + 14
    for s in (0, 1, 2, 3):
        o.append(W(X(s), yp2 + 2, X(s), yp2 + 52, c=FNT, lw=1, dash="3 3"))
    _f14_pulse(o, X, yp2 + 26, yp2 + 6, [0, 1, 2, 3], x_from=X(-0.15), x_to=X(3.2))
    o.append(T(92, yp2 + 20, "1PPS", "end", 10, GRN, True))
    for s in (1, 2, 3):
        a = s - 0.45
        o.append(RECT(X(a), yp2 + 34, 0.3 * 180, 16, 2, PSOFT, PUR, 1))
        o.append(T(X(a) + 27, yp2 + 46, "次は :%02d" % (t0 + s), "middle", 9, PUR, True))
        o.append(ARR(X(a) + 54, yp2 + 42, X(s) - 2, yp2 + 20, c=PUR, lw=1.2, head=6))
    return SVG(700, yp2 + 60, o, "どのパルスが何秒の頭か（例の文は 10 章・12 章の例。文を捨てずに順に送る製品の例。出し方は製品による）。")


F["e14_label"] = _f14_label_fig()


# =====================================================================
# 3 節: インプットキャプチャと、割り込みの中でカウンタを読む方法
# =====================================================================
def _f14_capture_fig():
    o = []
    X = lambda t: 132 + (t + 0.6) * 80          # t [µs]
    c0 = 9992904
    te = 0.04                                    # 立ち上がりの時刻 [µs]（刻み 0 の 40 ns 後）
    def counter(y, tmax=6.3):
        o.append(W(X(-0.6), y, X(tmax), y, c=MUT, lw=1))
        for i in range(-6, int(tmax * 10) + 1):
            t = i / 10
            o.append(W(X(t), y - (4 if i % 10 else 7), X(t), y, c=MUT, lw=1 if i % 10 else 1.3))
            if i % 10 == 0 and i >= 0:
                o.append(T(X(t) + 2, y - 10, "…%03d" % ((c0 + i) % 1000), "start", 9, MUT, False, True))
    o.append(T(14, 18, "(a) インプットキャプチャ: 立ち上がりの瞬間のカウントを、回路が写して残す", "start", 11.5, INK, True))
    y1 = 46
    o.append(T(120, y1 - 2, "1PPS", "end", 10, GRN, True))
    o.append(PL([(X(-0.6), y1 + 8), (X(te), y1 + 8), (X(te), y1 - 10), (X(6.3), y1 - 10)], c=GRN, lw=2))
    yc = y1 + 40
    o.append(T(120, yc - 3, "カウンタ", "end", 10, MUT, True))
    o.append(T(120, yc + 10, "10 MHz（例）", "end", 9, MUT))
    counter(yc)
    o.append(W(X(te), y1 + 8, X(te), yc + 14, c=SIG, lw=1.2, dash="3 2"))
    yk = yc + 30
    o.append(T(120, yk + 13, "捕獲の値", "end", 10, SIG, True))
    o.append(RECT(X(te) - 4, yk, 96, 20, 3, SSOFT, SIG, 1.2))
    o.append(T(X(te) + 44, yk + 14.5, _f14_g(c0), "middle", 10.5, SIG, True, True))
    o.append(T(X(te) + 100, yk + 14, "立ち上がりの瞬間の値（誤差は 1 カウント = 100 ns 未満）", "start", 9.5, SIG))
    yi = yk + 30
    o.append(T(120, yi + 13, "割り込み", "end", 10, GRN, True))
    o.append(RECT(X(1.8), yi, X(3.6) - X(1.8), 20, 3, GSOFT, GRN, 1.1))
    o.append(T(X(2.7), yi + 14, "捕獲の値を読む", "middle", 9.5, GRN, True))
    o.append(T(X(3.6) + 6, yi + 14, "→ " + _f14_g(c0) + "（いつ読んでも同じ）", "start", 9.5, GRN, True))
    # (b)
    yb = yi + 52
    o.append(T(14, yb, "(b) 割り込みの処理の中でカウンタを読む（遅れは、ほかの割り込みや処理で毎回違う。例）", "start", 11.5, INK, True))
    yc2 = yb + 30
    counter(yc2)
    o.append(T(120, yc2 - 3, "カウンタ", "end", 10, MUT, True))
    for r, L in enumerate((0.9, 4.3, 2.1)):
        y = yc2 + 12 + r * 24
        o.append(T(120, y + 13, "%d 秒目" % (r + 1), "end", 10, INK, True))
        o.append(D(X(te), y + 9, GRN, 3))
        o.append(W(X(te), y + 9, X(te + L), y + 9, c=ALI, lw=1.4, dash="3 2"))
        o.append(RECT(X(te + L), y, 78, 18, 3, ASOFT, ALI, 1.1))
        o.append(T(X(te + L) + 39, y + 13, "…%03d" % ((c0 + int((te + L) * 10)) % 1000), "middle", 9.5, ALI, True, True))
        o.append(T(X(te + L) - 4, y + 4, "+%.1f µs" % L, "end", 9, ALI, True, halo=True))
    yz = yc2 + 12 + 3 * 24 + 16
    o.append(T(X(0) + 4, yz, "立ち上がり（緑の点）から読むまでの遅れ（赤）が、そのまま時刻の誤差になる", "start", 9.5, ALI))
    return SVG(700, yz + 10, o, "インプットキャプチャと、割り込みの処理の中でカウンタを読む方法（10 MHz のタイマ、例の値。カウンタの値は下 3 桁だけを書いた）。")


F["e14_capture"] = _f14_capture_fig()


# =====================================================================
# 3 節: 捕獲値の差（一周をまたぐ）と、周波数の誤差
# =====================================================================
def _f14_count_fig():
    o = []
    o.append(T(14, 18, "(a) カウンタの一周と、2 つの捕獲値（縦は模式）", "start", 11.5, INK, True))
    p = Plot(56, 36, 250, 130, (-0.3, 1.3), (0, 1))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    o.append(T(p.x - 6, p.Y(1) + 4, "2³²", "end", 9.5, MUT))
    o.append(T(p.x - 6, p.Y(0) + 4, "0", "end", 9.5, MUT))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=FNT, lw=1, dash="3 3"))
    tw_ = 0.12   # 一周する時刻（模式）
    o.append(p.line([(-0.3, 0.55), (tw_, 1.0)], c=MUT, lw=2))
    o.append(p.line([(tw_, 1.0), (tw_, 0.0)], c=MUT, lw=1.2, dash="3 2"))
    o.append(p.line([(tw_, 0.0), (1.3, 1.18 * 1.3 / 1.3 * 0.0 + (1.3 - tw_) * 0.38)], c=MUT, lw=2))
    y0v = 0.55 + (0 + 0.3) / (tw_ + 0.3) * 0.45
    o.append(D(p.X(0), p.Y(y0v), SIG, 4.5))
    o.append(TX(p.X(0) + 6, p.Y(y0v) + 16, "C_{k−1} = 4 294 960 000", "start", 9.5, SIG, True, halo=True))
    y1v = (1.0 - tw_) * 0.38
    o.append(D(p.X(1), p.Y(y1v), SIG, 4.5))
    o.append(TX(p.X(1) - 4, p.Y(y1v) - 10, "C_k = 9 992 904", "end", 9.5, SIG, True, halo=True))
    o.append(T(p.X(tw_) + 4, p.Y(0.5), "一周（0.73 ms 後）", "start", 9.5, MUT, False, halo=True))
    for t, lab in ((0, "パルス k−1"), (1, "パルス k")):
        o.append(W(p.X(t), p.y + p.h, p.X(t), p.y + p.h + 5, c=GRN, lw=1.6))
        o.append(T(p.X(t), p.y + p.h + 17, lab, "middle", 9.5, GRN, True))
    o.append(T(p.x + p.w / 2, p.y + p.h + 33, "時間（パルスの間は 1 s）", "middle", 9.5, MUT))
    # (b) 筆算
    xb = 352
    o.append(T(xb, 18, "(b) 差を符号なしの 32 bit で計算する", "start", 11.5, INK, True))
    xr = 548
    rows = [("", "9 992 904", "C_k", SIG), ("−", "4 294 960 000", "C_{k−1}", SIG), (None,),
            ("", "10 000 200", "1 秒に数えた数", INK),
            ("−", "10 000 000", "f_{tim} T_p（名目の数）", MUT), (None,),
            ("", "200", "多く数えた", ALI)]
    y = 48
    for r in rows:
        if r[0] is None:
            o.append(W(xr - 104, y - 10, xr + 2, y - 10, c=INK, lw=1.2))
            y += 4
            continue
        sgn, num, lab, c = r
        if sgn:
            o.append(T(xr - 108, y, sgn, "end", 11, INK, True, True))
        o.append(T(xr, y, num, "end", 11, c if c != MUT else INK, True, True))
        o.append(TX(xr + 10, y, lab, "start", 9.5, c))
        y += 21
    o.append(T(xb, y + 4, "一周の分の 2³² は、符号なしの引き算で自然に足される", "start", 9.5, MUT))
    o.append(TX(xb, y + 26, "r_m = 200 ÷ 10 000 000 = 20 × 10^{−6} = 20 ppm", "start", 10.5, GLD, True))
    o.append(T(xb, y + 44, "1 日では 20 × 10⁻⁶ × 86 400 s = 1.728 s（10 章の RTC と同じ）", "start", 9.5, MUT))
    # (c) N 秒の差
    yc = 246
    o.append(T(14, yc, "(c) N 秒離れた 2 つの捕獲値の差: 途中の誤差は打ち消し合う", "start", 11.5, INK, True))
    xs = [60 + i * 70 for i in range(5)] + [60 + 7 * 70]
    labs = ["C_0", "C_1", "C_2", "C_3", "C_4", "C_N"]
    yy = yc + 50
    o.append(W(40, yy, 572, yy, c=MUT, lw=1))
    o.append(T(60 + 5.5 * 70, yy + 4, "…", "middle", 12, MUT, True))
    for x, lab in zip(xs, labs):
        o.append(W(x - 7, yy - 9, x + 7, yy - 9, c=ALI, lw=1))
        o.append(W(x - 7, yy + 9, x + 7, yy + 9, c=ALI, lw=1))
        o.append(W(x, yy - 9, x, yy + 9, c=ALI, lw=1))
        o.append(D(x, yy, SIG, 3.5))
        o.append(TX(x, yy + 24, lab, "middle", 10, SIG, True))
    for i in range(4):
        o.append(CARR(xs[i] + 4, yy - 12, xs[i + 1] - 4, yy - 12, bend=0.25, c=MUT, lw=1, head=5))
    o.append(T(xs[2] + 35, yy - 24, "1 秒ずつの差を足すと、途中の C は消える", "middle", 9.5, MUT, False, halo=True))
    o.append(TX(592, yy - 2, "(C_N − C_0)/N", "start", 10, GLD, True))
    o.append(T(592, yy + 14, "誤差 ±0.1 ppm/N", "start", 9.5, GLD, True))
    o.append(T(592, yy + 28, "N = 100: ±0.001", "start", 9.5, MUT))
    o.append(T(40, yy + 46, "赤い縦の線は、捕獲値の 1 カウントまでの誤差。差の誤差を決めるのは両端の 2 つだけである", "start", 9.5, MUT))
    return SVG(700, yy + 56, o, "捕獲値の差から、マイコンの水晶の周波数の誤差を求める（例: 10 MHz のタイマで +20 ppm。カウンタは 32 bit）。")


F["e14_count"] = _f14_count_fig()


# =====================================================================
# 3 節: PI で時計を合わせるループ
# =====================================================================
def _f14_loop_fig():
    o = []
    yc = 64
    s, pos, xe = CHAIN(20, yc, [("a", 96, "r_m", ALI), ("s", {"l": "+", "b": "−"}, "s1"), ("a", 34, None, INK),
                                ("b", "1 秒ごとにためる", "acc", INK, PAN), ("a", 104, "δt_m[k]", SIG),
                                ("s", {"l": "+", "t": "+"}, "s2"), ("a", 60, None, SIG), ("t", "out", SIG), ("w", 30, SIG)])
    o.append(s)
    o.append(TOPIN(pos["s2"], yc, 48, "パルスと捕獲の誤差", TEA))
    o.append(T(xe + 6, yc + 4, "測ったずれ", "start", 10, SIG, True))
    o.append(FBPATH(pos["out"], pos["s1"], yc, 74, c=GLD, box="PI: K_P + K_I T_p Σ", lab=None))
    o.append(TX((pos["out"] + pos["s1"]) / 2 - 110, yc + 68, "r̂[k]（周波数の補正）", "end", 10, GLD, True, halo=True))
    o.append(T(20 + 48, yc - 36, "マイコンの水晶の", "middle", 9.5, ALI))
    o.append(T(20 + 48, yc - 24, "周波数の誤差", "middle", 9.5, ALI))
    ye = yc + 112
    o.append(TX(20, ye, "δt_m[k+1] = δt_m[k] + (r_m − r̂[k]) T_p", "start", 11, INK, True))
    o.append(T(330, ye, "1 秒の間に、補正しきれない分だけ時計がずれる", "start", 9.5, MUT))
    o.append(TX(20, ye + 22, "r̂[k] = K_P δt_m[k] + K_I T_p Σ_{j≤k} δt_m[j]", "start", 11, GLD, True))
    o.append(T(330, ye + 22, "P の分は今のずれ、I の分はずれの和に比例する", "start", 9.5, MUT))
    o.append(TX(20, ye + 44, "I の分は、ずれが残っている間は増え続け、r̂ が r_m に届いてずれが 0 になったところで止まる（P だけでは、ずれが r_m/K_P 残る）", "start", 9.5, MUT))
    return SVG(700, ye + 54, o, "PI で時計を合わせるループ（パルスごと、1 秒ごとに更新する。ずれは、マイコンの時計の読みから GNSS の時刻を引いた値）。")


F["e14_loop"] = _f14_loop_fig()


# =====================================================================
# 3 節: 安定なゲインの範囲と、20 ppm の段差への応答
# =====================================================================
def _f14_gains_fig():
    o = []
    o.append(T(14, 18, "(a) ループが安定なゲインの範囲", "start", 11.5, INK, True))
    p = Plot(70, 34, 250, 200, (0, 2.2), (0, math.sqrt(4.6)))
    yt = [0, 1 / 32, 0.25, 1, 2, 4]
    ylab = {0: "0", 1 / 32: "1/32", 0.25: "0.25", 1: "1", 2: "2", 4: "4"}
    o.append(p.axes(xl="K_P T_p", xt=[0, 0.5, 1, 1.5, 2], yt=[math.sqrt(v) for v in yt], xfmt=lambda v: ("%g" % v), yfmt=lambda v: ylab[min(ylab, key=lambda q: abs(math.sqrt(q) - v))]))
    o.append(TX(p.x - 44, p.y + p.h / 2, "K_I T_p^2（平方根の目盛）", "middle", 10, MUT, rot=-90))
    xs = _f14_np.linspace(0, 2, 81)
    poly = [(p.X(x), p.Y(math.sqrt(max(0.0, 4 - 2 * x)))) for x in xs] + [(p.X(2), p.Y(0)), (p.X(0), p.Y(0))]
    o.append(PL(poly, c=GRN, lw=1.4, fill=GSOFT))
    xc = _f14_np.linspace(0, 1, 61)
    lo = [(p.X(x), p.Y(1 - math.sqrt(1 - x))) for x in xc]
    hi = [(p.X(x), p.Y(1 + math.sqrt(1 - x))) for x in xc]
    o.append(PL(lo + hi[::-1], c=GRN, lw=1, dash="4 3", fill=SCR, op=0.55))
    o.append(T(p.X(0.62), p.Y(1.05), "根が複素数", "middle", 9.5, GRN, True, halo=True))
    o.append(T(p.X(0.62), p.Y(0.92), "（振れながら収まる）", "middle", 9, GRN, False, halo=True))
    o.append(T(p.X(1.45), p.Y(0.42), "根が実数", "middle", 9.5, GRN, True, halo=True))
    o.append(T(p.X(1.55), p.Y(1.75), "不安定", "middle", 10, ALI, True, halo=True))
    o.append(W(p.X(0.25), p.Y(1 - math.sqrt(0.75)), p.X(0.25), p.Y(1 + math.sqrt(0.75)), c=SIG, lw=1, dash="2 2"))
    pts = [("本文の例", 0.25, 1 / 32, GLD), ("P だけ", 0.25, 0.0, MUT), ("I を強く", 0.25, 0.25, PUR), ("不安定", 0.25, 4.2, ALI)]
    for nm, a, b, c in pts:
        o.append(D(p.X(a), p.Y(math.sqrt(b)), c, 4.5))
        o.append(T(p.X(a) + 7, p.Y(math.sqrt(b)) + 4, nm, "start", 9.5, c, True, halo=True))
    o.append(TX(p.X(0.25) + 6, p.Y(1.45), "|z| = 0.866", "start", 9.5, SIG, True, halo=True))
    # (b) 応答
    o.append(T(370, 18, "(b) 補正 0 から始めたずれ（20 ppm の段差）", "start", 11.5, INK, True))
    q = Plot(410, 34, 270, 200, (0, 60), (-40, 100))
    o.append(q.axes(xl="パルスの番号 k（秒）", yl="δt_m [µs]", xt=[0, 10, 20, 30, 40, 50, 60], yt=[-40, -20, 0, 20, 40, 60, 80, 100], xfmt=lambda v: "%d" % v, yfmt=lambda v: _f14_f(v, 0)))
    o.append(W(q.x, q.Y(0), q.x + q.w, q.Y(0), c=MUT, lw=1))
    # 本文の例の包絡線: δt[k] = 2 Re(A z^k)
    d = _f14_pi(_F14_KP, _F14_KI, n=61)
    z = complex(_f14_np.roots([1, -(2 - _F14_KP - _F14_KI), 1 - _F14_KP])[0])
    A = (d[2] - z.conjugate() * d[1]) / (z - z.conjugate()) / z ** 1
    env = [(k, 2 * abs(A) * abs(z) ** k * 1e6) for k in range(0, 61)]
    o.append(q.clip(env, c=GLD, lw=1, dash="4 3"))
    o.append(q.clip([(k, -v) for k, v in env], c=GLD, lw=1, dash="4 3"))
    for KP, KI, c, lw in ((0.25, 0.0, MUT, 1.8), (0.25, 0.25, PUR, 1.6), (0.25, 4.2, ALI, 1.6), (_F14_KP, _F14_KI, GLD, 2.4)):
        dd = _f14_pi(KP, KI, n=61)
        pts = []
        for k, v in enumerate(dd):           # 枠の外へ出たら、そこで描くのをやめる（発散する応答）
            pts.append((k, v * 1e6))
            if abs(v) * 1e6 > 150:
                break
        o.append(q.clip(pts, c=c, lw=lw))
    o.append(T(q.X(60) - 4, q.Y(80) - 6, "P だけ: 80 µs で止まる", "end", 9.5, MUT, True, halo=True))
    o.append(T(q.X(6) + 6, q.Y(53.35) - 6, "最大 53 µs（6 s）", "start", 9.5, GLD, True, halo=True))
    o.append(T(q.X(14), q.Y(-30), "I を強く: 同じ包絡線で振れる", "start", 9.5, PUR, True, halo=True))
    o.append(T(q.X(2.6), q.Y(-36), "不安定", "start", 9.5, ALI, True, halo=True))
    o.append(TX(q.X(32) + 4, q.Y(18), "包絡線 0.866^k（破線）", "start", 9.5, GLD, False, halo=True))
    return SVG(700, 280, o, "PI のゲインの範囲と、周波数の補正 0・ずれ 0 から始めたときのずれ（水晶の誤差 20 ppm、パルスの周期 1 s。4 つとも比例ゲインは 1/4 s⁻¹ で、積分ゲインだけを変えた）。")


F["e14_gains"] = _f14_gains_fig()


# =====================================================================
# 4 節: 秒の頭とクロックの刻み — 量子化誤差が鋸の歯になる仕組み
# =====================================================================
def _f14_quant_fig():
    o = []
    x0, nu = 0.15, 0.2
    o.append(T(14, 18, "(a) 秒の頭（緑）と、受信機のクロックの刻み（例: ν = 0.2）", "start", 11.5, INK, True))
    cx, sc = 236, 4.2                       # 秒の頭の x、1 ns あたりの px
    for k in range(5):
        y = 58 + k * 40
        f = (x0 + k * nu) % 1.0
        o.append(T(14, y + 4, "k = %d" % k, "start", 10, INK, True))
        o.append(W(cx - 36 * sc, y, cx + 36 * sc, y, c=MUT, lw=1))
        for m in range(-2, 4):
            t = (m - f) * _F14_TQ
            if abs(t) > 36:
                continue
            o.append(W(cx + t * sc, y - 7, cx + t * sc, y + 7, c=MUT, lw=1.2))
        q = _f14_q(x0, nu, k)
        o.append(W(cx + q * sc, y - 12, cx + q * sc, y + 10, c=SIG, lw=2.6))
        o.append(W(cx, y - 14, cx, y + 12, c=GRN, lw=1.8))
        o.append(DIM(cx, y + 16, cx + q * sc, y + 16, None, c=ALI))
        o.append(TX(cx + 38 * sc, y + 4, "q_%d = %s ns" % (k, _f14_f(q, 1)), "start", 10, ALI, True))
    o.append(T(cx, 36, "秒の頭", "middle", 9.5, GRN, True))
    o.append(T(cx + _f14_q(x0, nu, 0) * sc - 4, 36, "パルス（いちばん近い刻み）", "end", 9.5, SIG, True))
    o.append(TX(14, 58 + 5 * 40 - 4, "灰色の縦の線は刻み（20.8 ns ごと）。1 秒ごとに、秒の頭は刻みに対して νT_q = 4.2 ns ずつ後ろへずれる", "start", 9.5, MUT))
    # (b) q_k の並び
    o.append(T(470, 18, "(b) 1 秒ごとの量子化誤差", "start", 11.5, INK, True))
    p = Plot(500, 40, 180, 170, (0, 14), (-12, 12))
    o.append(p.axes(xl="パルスの番号 k", yl="q_k [ns]", xt=[0, 5, 10], yt=[-10.4, 0, 10.4], xfmt=lambda v: "%d" % v, yfmt=lambda v: _f14_f(v, 1)))
    qs = [(k, _f14_q(x0, nu, k)) for k in range(15)]
    for i in range(len(qs) - 1):
        a, b = qs[i], qs[i + 1]
        o.append(p.line([a, b], c=ALI if b[1] < a[1] else FNT, lw=1.4 if b[1] < a[1] else 1, dash=None if b[1] < a[1] else "2 2"))
    for k, q in qs:
        o.append(D(p.X(k), p.Y(q), SIG if k < 5 else ALI, 3.4))
    o.append(T(p.X(7), p.y + p.h + 44, "5 s ごとに跳ぶ（1/ν = 5）", "middle", 9.5, ALI, True))
    return SVG(700, 58 + 5 * 40 + 10, _f14_nu(o), "量子化誤差の仕組み（例: クロック 48 MHz、1 秒の刻みの数の端数 <i style='font-family:serif'>ν</i> = 0.2。受信機は秒の頭にいちばん近い刻みでパルスを出すとした）。")


F["e14_quant"] = _f14_quant_fig()


# =====================================================================
# 4 節: 鋸歯状の誤差の 3 つの形（ν で決まる）
# =====================================================================
def _f14_saw_fig():
    o = []
    cases = [(0.501, "ν = 0.048（発振器の誤差 0.501 ppm）", "21 s ごとに跳ぶ鋸の歯"),
             (0.5104, "ν = 0.499（0.5104 ppm）", "1 秒ごとに正と負を行き来する"),
             (0.50002, "ν = 0.001（0.500 02 ppm）", "ほぼ同じ値にとどまる（平均しても消えない）")]
    o.append(T(14, 18, "1 秒ごとの量子化誤差（点）と、60 秒の平均（破線）。クロック 48 MHz（±10.4 ns）", "start", 11.5, INK, True))
    y0 = 34
    for r, (rr, lab, note) in enumerate(cases):
        nu = (48.0 * rr) % 1.0
        p = Plot(70, y0 + r * 92, 610, 62, (0, 120), (-12, 12))
        o.append(RECT(p.x, p.y, p.w, p.h, 0, SCR, LIN, 0.8))
        o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=0.8))
        for v in (-10.4, 10.4):
            o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=FNT, lw=0.8, dash="3 3"))
        for v in (-10, 0, 10):
            o.append(T(p.x - 6, p.Y(v) + 3.5, "%d" % v, "end", 9, MUT))
        qs = [_f14_q(0.3, nu, k) for k in range(121)]
        for k, q in enumerate(qs):
            o.append(D(p.X(k), p.Y(q), ALI, 1.9))
        avg = [(k, sum(qs[k - 59:k + 1]) / 60) for k in range(59, 121)]
        o.append(p.line(avg, c=GLD, lw=1.8, dash="5 3"))
        o.append(T(p.x + 6, p.y + 12, lab, "start", 9.5, INK, True, halo=True))
        o.append(T(p.x + p.w - 6, p.y + 12, note, "end", 9.5, ALI, True, halo=True))
        if r == 2:
            o.append(T(p.X(90), p.Y(avg[-1][1]) - 8, "60 秒の平均 %s ns" % _f14_f(avg[-1][1], 1), "middle", 9.5, GLD, True, halo=True))
    yx = y0 + 2 * 92 + 62
    for v in (0, 20, 40, 60, 80, 100, 120):
        o.append(T(70 + 610 * v / 120, yx + 14, "%d" % v, "middle", 9, MUT))
    o.append(TX(70 + 305, yx + 30, "時間 [s]（縦軸は量子化誤差 q_k [ns]）", "middle", 10, MUT))
    o.append(TX(30, y0 + 92 + 31, "q_k [ns]", "middle", 10, MUT, rot=-90))
    return SVG(700, yx + 38, _f14_nu(o), "受信機の発振器の周波数の誤差（例: 0.5 ppm の近く）で決まる、鋸歯状の誤差の 3 つの形（クロック 48 MHz。<i style='font-family:serif'>ν</i> は 1 秒の刻みの数 48 000 000 × (1 + 誤差) の端数）。")


F["e14_saw"] = _f14_saw_fig()


# =====================================================================
# 4 節: パルスの時刻の誤差の積み上げ
# =====================================================================
def _f14_budget_fig():
    o = []
    o.append(T(14, 18, "(a) 源ごとの大きさ（対数の目盛）", "start", 11.5, INK, True))
    p = Plot(250, 34, 330, 204, (1, 10000), (0, 1), xlog=True)
    for v in (1, 10, 100, 1000, 10000):
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 14, {1: "1 ns", 10: "10 ns", 100: "100 ns", 1000: "1 µs", 10000: "10 µs"}[v], "middle", 9.5, MUT))
    sq = _F14_TQ / math.sqrt(12)
    sc = 100 / math.sqrt(12)
    rows = [("解の誤差（TDOP × UERE）", None, _F14_SIGT, SIG, "σ %.1f ns・ばらつき" % _F14_SIGT),
            ("鋸歯状の誤差（48 MHz）", None, _F14_TQ / 2, ALI, "±10.4 ns・補正値で消せる"),
            ("ケーブルの遅れ（3 m）", None, 15.2, PUR, "一定 15.2 ns・測って引く"),
            ("捕獲の半カウント（10 MHz）", None, 50, PUR, "一定 50 ns・引ける"),
            ("捕獲の刻み（10 MHz）", None, 50, GLD, "±50 ns（σ 28.9 ns）・残る"),
            ("割り込みの中で読む（例）", 900, 4300, ALI, "0.9〜4.3 µs・使わない")]
    for i, (nm, a, b, c, note) in enumerate(rows):
        y = p.y + 8 + i * 33
        o.append(T(p.x - 8, y + 12, nm, "end", 10, INK, True))
        xa = p.X(a) if a else p.x
        o.append(RECT(xa, y, p.X(b) - xa, 17, 2, soft(c), c, 1.2))
        o.append(T(p.X(b) + 6 if p.X(b) < p.x + p.w - 100 else xa - 6, y + 12.5, note, "start" if p.X(b) < p.x + p.w - 100 else "end", 9.5, c, True, halo=True))
    # (b) 合わせた誤差
    yb = p.y + p.h + 40
    o.append(T(14, yb, "(b) 一定の分を引いた後の、合わせた誤差（1σ）", "start", 11.5, INK, True))
    st = _F14_SIGT
    vals = [("捕獲の刻み 100 ns（10 MHz）", math.sqrt(st ** 2 + sq ** 2 + sc ** 2), math.sqrt(st ** 2 + sc ** 2)),
            ("捕獲の刻み 1 ns", math.sqrt(st ** 2 + sq ** 2 + (1 / math.sqrt(12)) ** 2), math.sqrt(st ** 2 + (1 / math.sqrt(12)) ** 2))]
    o.append(T(330, yb + 22, "補正値なし", "middle", 10, ALI, True))
    o.append(T(450, yb + 22, "補正値あり", "middle", 10, GRN, True))
    for i, (nm, a, b) in enumerate(vals):
        y = yb + 44 + i * 22
        o.append(T(244, y, nm, "end", 10, INK, True))
        o.append(T(330, y, "%.1f ns" % a, "middle", 10.5, ALI, True, True))
        o.append(T(450, y, "%.1f ns" % b, "middle", 10.5, GRN, True, True))
    o.append(T(520, yb + 44, "← ほとんど変わらない", "start", 9.5, MUT))
    o.append(T(520, yb + 66, "← 補正値が生きる", "start", 9.5, GRN, True))
    return SVG(700, yb + 80, o, "1PPS をマイコンのタイマで捕獲したときの、時刻の誤差の源（例の値。ケーブルの遅れは、電波がケーブルの中を光の速さの 0.66 倍で進むとした。合わせた誤差は、独立とみなした 2 乗の和の平方根。一様な誤差の標準偏差は幅 ÷ √12）。")


F["e14_budget"] = _f14_budget_fig()


# =====================================================================
# 5 節: ホールドオーバー — 残った周波数の誤差 × 時間
# =====================================================================
def _f14_hold_fig():
    o = []
    p = Plot(80, 26, 460, 230, (1, 1e6), (1e-7, 10), xlog=True, ylog=True)
    xt = [1, 60, 3600, 86400, 864000]
    xl = {1: "1 s", 60: "1 分", 3600: "1 時間", 86400: "1 日", 864000: "10 日"}
    for v in xt:
        o.append(W(p.X(v), p.y, p.X(v), p.y + p.h, c=GRD, lw=1))
        o.append(T(p.X(v), p.y + p.h + 15, xl[v], "middle", 9.5, MUT))
    for v, lab in ((1e-7, "100 ns"), (1e-6, "1 µs"), (1e-3, "1 ms"), (1.0, "1 s"), (10.0, "10 s")):
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=GRD, lw=1))
        o.append(T(p.x - 6, p.Y(v) + 3.5, lab, "end", 9.5, MUT))
    o.append(W(p.x, p.y, p.x, p.y + p.h, p.x + p.w, p.y + p.h, c=MUT, lw=1.2))
    o.append(T(p.x + p.w / 2, p.y + p.h + 32, "最後のパルスからの時間 t（対数の目盛）", "middle", 10, MUT))
    o.append(TX(p.x - 52, p.y + p.h / 2, "たまったずれ |δt_m|", "middle", 10, MUT, rot=-90))
    for v in (1e-6, 1e-3, 1.0):
        o.append(W(p.x, p.Y(v), p.x + p.w, p.Y(v), c=INK, lw=1, dash="5 3"))
    lines = [(20e-6, ALI, ["補正しない 20 ppm"]), (0.5e-6, GLD, ["TCXO で 10 °C", "変わった 0.5 ppm"]),
             (0.05e-6, PUR, ["TCXO で 1 °C", "変わった 0.05 ppm"]), (1.42e-9, GRN, ["覚えた周波数の誤差", "0.0014 ppm", "（温度が一定）"])]
    for r, c, lab in lines:
        o.append(p.clip([(1, r * 1), (1e6, r * 1e6)], c=c, lw=2.2))
    def mark(r, E, c, txt, dx=6, dy=-6, a="start"):
        t = E / r
        o.append(D(p.X(t), p.Y(E), c, 4))
        o.append(T(p.X(t) + dx, p.Y(E) + dy, txt, a, 9.5, c, True, halo=True))
    mark(20e-6, 1e-3, ALI, "50 s", -6, -6, "end")
    mark(20e-6, 1.0, ALI, "13.9 時間", -6, -6, "end")
    mark(0.5e-6, 1e-6, GLD, "2 s", 6, 14)
    mark(0.5e-6, 1e-3, GLD, "33 分", 6, 14)
    mark(1.42e-9, 1e-6, GRN, "12 分", 6, 14)
    mark(1.42e-9, 1e-3, GRN, "8.2 日", -6, -6, "end")
    # 凡例（右）
    for i, (r, c, lab) in enumerate(lines):
        y = 44 + i * 40
        o.append(W(556, y - 4, 580, y - 4, c=c, lw=2.2))
        for j, part in enumerate(lab):
            o.append(T(586, y + j * 13, part, "start", 9.5, c, True))
    o.append(T(556, 216, "破線: 許せるずれ", "start", 9.5, INK))
    o.append(T(556, 230, "の例（1 µs・1 ms・1 s）", "start", 9.5, INK))
    return SVG(700, p.y + p.h + 42, o, "ホールドオーバーの間にたまるずれ（たまったずれ = 残った周波数の誤差 × 時間。点は許せるずれに届く時間。0.0014 ppm は、3 節の例のゲインでパルスの誤差が 30 ns のときの、I の分の標準偏差）。")


F["e14_hold"] = _f14_hold_fig()


# =====================================================================
# 5 節: 温度が変わるときのホールドオーバー
# =====================================================================
def _f14_temp_fig():
    o = []
    tau, dT, sT = 10.0, 10.0, 0.05      # 時定数 [分]、温度の変化 [°C]、TCXO [ppm/°C]
    ts = _f14_np.linspace(0, 120, 241)
    temp = [dT * (1 - math.exp(-t / tau)) for t in ts]
    fr = [sT * v for v in temp]
    err = [sT * dT * 1e-6 * (t * 60 - tau * 60 * (1 - math.exp(-t / tau))) * 1e3 for t in ts]   # ms
    panels = [("(a) TCXO の温度の変化 [°C]", (0, 12), [0, 5, 10], temp, GLD, lambda v: "%d" % v),
              ("(b) 周波数の誤差 [ppm]（0.05 ppm/°C）", (0, 0.6), [0, 0.25, 0.5], fr, GLD, lambda v: "%g" % v),
              ("(c) たまったずれ [ms]", (0, 3.6), [0, 1, 2, 3], err, GLD, lambda v: "%g" % v)]
    y = 26
    for r, (tt, yr, ytk, vals, c, fm) in enumerate(panels):
        hh = 62 if r < 2 else 92
        p = Plot(80, y + 8, 560, hh, (0, 120), yr)
        o.append(T(14, y, tt, "start", 11, INK, True))
        o.append(p.axes(xt=[0, 20, 40, 60, 80, 100, 120], yt=ytk, xfmt=(lambda v: "%d" % v) if r == 2 else (lambda v: ""), yfmt=fm))
        o.append(p.line(list(zip(ts, vals)), c=c, lw=2.2))
        if r == 2:
            o.append(p.line([(t, 1.42e-9 * t * 60 * 1e3) for t in ts], c=GRN, lw=2))
            o.append(p.line([(t, 0.5 * (sT * dT / tau) * 1e-6 * (t * 60) ** 2 / 60 * 1e3) for t in ts if t <= 26], c=MUT, lw=1.2, dash="3 3"))
            for tm in (60, 120):
                v = sT * dT * 1e-6 * (tm * 60 - tau * 60 * (1 - math.exp(-tm / tau))) * 1e3
                o.append(D(p.X(tm), p.Y(v), GLD, 4))
                o.append(T(p.X(tm) - 6, p.Y(v) - 7, "%.2f ms" % v, "end", 9.5, GLD, True, halo=True))
            o.append(T(p.X(22), p.Y(0.5), "初めは 2 乗に近い（点線: ṙt²/2）", "start", 9.5, MUT, False, halo=True))
            o.append(T(p.X(116), p.Y(0.25), "温度が一定なら 0.01 ms（緑）", "end", 9.5, GRN, True, halo=True))
            o.append(T(p.x + p.w / 2, p.y + p.h + 30, "衛星が見えなくなってからの時間 [分]", "middle", 10, MUT))
        y += hh + 30
    return SVG(700, y + 14, o, "衛星が見えなくなると同時に、TCXO の温度が時定数 10 分で 10 °C 上がった例（0.05 ppm/°C。初めのずれと覚えた周波数の誤差は 0 とした。緑の線は温度が一定のとき）。")


F["e14_temp"] = _f14_temp_fig()


# =====================================================================
# 6 節: 2 つのパルスの間を比例で割り振る
# =====================================================================
def _f14_interp_fig():
    o = []
    ck, cs, ck1 = 9992904, 13543120, 19993104
    fs = (cs - ck) / (ck1 - ck)
    X = lambda s: 100 + s * 500
    y = 52
    o.append(T(14, 18, "(a) 同じタイマで、1PPS とセンサの「測り終えた」信号を捕獲する", "start", 11.5, INK, True))
    _f14_pulse(o, X, y + 20, y, [0, 1], x_from=X(-0.12), x_to=X(1.16))
    o.append(T(90, y + 14, "1PPS", "end", 10, GRN, True))
    ys = y + 42
    o.append(PL([(X(-0.12), ys + 16), (X(fs), ys + 16), (X(fs), ys), (X(fs + 0.02), ys), (X(fs + 0.02), ys + 16), (X(1.16), ys + 16)], c=TEA, lw=2))
    o.append(T(90, ys + 12, "センサ", "end", 10, TEA, True))
    yc = ys + 40
    for s, c, val, lab in ((0, SIG, ck, "C_k"), (fs, TEA, cs, "C_s"), (1, SIG, ck1, "C_{k+1}")):
        o.append(W(X(s), y + 20 if c == SIG else ys + 16, X(s), yc - 14, c=c, lw=1, dash="3 2"))
        o.append(TX(X(s), yc, lab + " = " + _f14_g(val), "middle", 10, c, True, halo=True))
    o.append(TX(X(0), yc + 18, "t_k = 293 289 s（UTC 09:27:51）", "middle", 9.5, MUT))
    o.append(TX(X(1), yc + 18, "t_{k+1} = 293 290 s", "middle", 9.5, MUT))
    o.append(TX(X(fs), yc + 18, "t_s = ?", "middle", 9.5, TEA, True))
    # (b) 筆算
    yb = yc + 48
    o.append(T(14, yb, "(b) 2 つのパルスの間の、本当に数えた数で割る", "start", 11.5, INK, True))
    rows = [("C_s − C_k = 13 543 120 − 9 992 904 = 3 550 216", INK),
            ("C_{k+1} − C_k = 19 993 104 − 9 992 904 = 10 000 200", INK),
            ("3 550 216 ÷ 10 000 200 = 0.355 014 5（s）", GLD),
            ("t_s = 293 289 + 0.355 014 5 = 293 289.355 014 5 s（週 2444。UTC 09:27:51.355 014 5）", GLD)]
    for i, (s, c) in enumerate(rows):
        o.append(TX(30, yb + 24 + i * 22, s, "start", 10.5, c, True))
    o.append(T(30, yb + 24 + 4 * 22 + 2, "名目の 10 000 000 で割ると 0.355 021 6 s で、7.1 µs ずれる（20 ppm × 0.355 s）", "start", 9.5, ALI, True))
    return SVG(700, yb + 24 + 4 * 22 + 12, o, "センサの値を測った時刻を、前後のパルスの捕獲値の比で求める（例の値。タイマ 10 MHz、水晶の誤差 +20 ppm。週の中の秒は 1 節の例の時刻の 1 秒後）。")


F["e14_interp"] = _f14_interp_fig()


# =====================================================================
# 6 節: 記録の形と、時刻の状態
# =====================================================================
def _f14_record_fig():
    o = []
    o.append(T(14, 18, "(a) 1 件の記録の形（例: 24 B）", "start", 11.5, INK, True))
    fields = [("通し番号", 4, MUT, "1042"), ("GPS 時刻 [ns]", 8, SIG, "1 478 424 489 355 014 500"), ("うるう秒", 1, PUR, "18"),
              ("状態", 1, GRN, "1"), ("ずれの見積もり", 2, GLD, "0.03 µs"), ("センサの値", 6, TEA, "…"), ("CRC", 2, MUT, "…")]
    x, u, y = 20, 27.5, 60
    for nm, nb, c, val in fields:
        w = nb * u
        o.append(RECT(x, y, w, 26, 3, soft(c), c, 1.2))
        o.append(T(x + w / 2, y + 17, val, "middle", 9.5 if nb > 2 else 9, INK, True, True))
        if nm == "状態":
            o.append(W(x + w / 2, y - 2, x + w / 2, y - 14, c=c, lw=1))
            o.append(T(x + w / 2, y - 18, nm, "middle", 9.5, c, True))
        else:
            o.append(T(x + w / 2, y - 6, nm, "middle", 9.5, c, True))
        o.append(T(x + w / 2, y + 39, "%d B" % nb, "middle", 9, MUT))
        x += w
    o.append(T(20, y + 58, "GPS 時刻は 1980 年 1 月 6 日 0 時からの ns（64 bit。3 節の mclock と同じ）。うるう秒の数を残すと、後で UTC に直せる", "start", 9.5, MUT))
    # (b) 時刻の状態とずれの見積もり
    yb = y + 86
    o.append(T(14, yb, "(b) 時刻の状態と、ずれの見積もり（例）", "start", 11.5, INK, True))
    p = Plot(150, yb + 28, 530, 24, (0, 6), (0, 1))
    segs = [(0, 0.1, "0", ALI), (0.1, 2.0, "1: 1PPS に合わせている", GRN), (2.0, 3.0, "2", GLD), (3.0, 6.0, "1: 1PPS に合わせている", GRN)]
    for a, b, lab, c in segs:
        o.append(RECT(p.X(a), p.y, p.X(b) - p.X(a), p.h, 2, soft(c), c, 1.1))
        if p.X(b) - p.X(a) > 20:
            o.append(T((p.X(a) + p.X(b)) / 2, p.y + 16, lab, "middle", 9.5, c, True))
    o.append(T(130, p.y + 16, "状態", "end", 10, INK, True))
    o.append(T(p.X(0.05), p.y - 6, "0: まだ合わせていない", "start", 9, ALI, True))
    o.append(T(p.X(2.5), p.y - 6, "2: ホールドオーバー", "middle", 9, GLD, True))
    q = Plot(150, p.y + 40, 530, 60, (0, 6), (0, 2.2))
    o.append(q.axes(xl="時間 [時間]", yt=[0, 1, 2], xt=[0, 1, 2, 3, 4, 5, 6], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%d" % v))
    o.append(T(124, q.y + 24, "ずれの", "end", 10, INK, True))
    o.append(T(124, q.y + 37, "見積もり [ms]", "end", 10, INK, True))
    o.append(q.line([(0.1, 0.0), (2.0, 0.0), (3.0, 1.8), (3.0, 0.0), (6.0, 0.0)], c=GLD, lw=2.2))
    o.append(T(q.X(3.0) + 6, q.Y(1.8) + 4, "0.5 ppm を見込むと 1 時間で 1.8 ms", "start", 9.5, GLD, True, halo=True))
    return SVG(700, q.y + q.h + 40, o, "記録の 1 件の形と、時刻の状態の印（例。ずれの見積もりは、ホールドオーバーの間、見込んだ周波数の誤差 × 時間で増やす）。")


F["e14_record"] = _f14_record_fig()
