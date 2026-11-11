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
            o.append(T(x + q.w / 14, q.y + 13, days[d], "middle", 10, INK, True))
            o.append(T(x + q.w / 14, q.y + 25, dates[d], "middle", 9, MUT))
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
    o.append(TX(390, 192, "σ_t = TDOP × σ_{UERE}/c = 0.79 × 3.99 m ÷ c = 10.5 ns", "start", 10, INK, True))
    o.append(T(390, 207, "（7 章の東京の 8 機。誤差が衛星ごとに独立とした見積もり）", "start", 9.5, MUT))
    return SVG(700, 216, o, "1PPS の立ち上がり（例: 2026 年 11 月 11 日）と、受信機が求めた秒の頭の誤差（正規分布の乱数 3000 回。標準偏差は TDOP × UERE ÷ 光の速さ）。")


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
    o.append(T(14, yb, "(b) 1 秒に 2 回出すと（負荷率 130 %）、文がたまり、4 つ目のパルスに 1 秒前の名前を付ける", "start", 11.5, INK, True))
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
