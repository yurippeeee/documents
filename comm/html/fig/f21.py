# -*- coding: utf-8 -*-
# 21 章 LPWA の図

# ---- 共通: LoRa の式（本文 2・3 節と同じ） ----
def _f21_tsym(sf, bw=125e3):
    return 2 ** sf / bw

def _f21_rb(sf, bw=125e3, cr=1):
    return sf * bw / 2 ** sf * 4 / (4 + cr)

def _f21_toa(sf, pl, bw=125e3, cr=1, npre=8, hdr=1, crc=1):
    """空中時間 [s]。LDRO はシンボル時間が 16 ms を超えるとき使う。"""
    T = _f21_tsym(sf, bw)
    de = 1 if T > 0.016 else 0
    num = 8 * pl - 4 * sf + 8 + 16 * crc + 20 * hdr
    nblk = max(math.ceil(num / (4 * (sf - 2 * de))), 0)
    return (npre + 4.25 + 8 + nblk * (cr + 4)) * T

def _f21_rxwin(sf):
    T = _f21_tsym(sf)
    return max(4 + math.ceil(0.020 / T - 1e-12), 6) * T

def _f21_life(I, cap=2.0):
    return cap * 3600 / I / (365 * 86400)

# ---- 1 節: LPWA の 2 つの形 ----
def _f21_overview():
    o = []
    xs = [(16, 90), (170, 100), (330, 140), (560, 128)]
    # LoRaWAN
    o.append(T(16, 20, "LoRaWAN（免許不要の帯域）", "start", 12, INK, True))
    for y in (32, 80):
        o.append(BOX(16, y, 90, 34, "機器", None, SIG, SSOFT, SIG, sz=11))
        o.append(BOX(170, y, 100, 34, "ゲートウェイ", None, GLD, GOSOFT, GLD, sz=11))
    o.append(ARR(106, 49, 168, 49, c=SIG, lw=1.5, dash="4 3"))
    o.append(ARR(106, 55, 168, 91, c=SIG, lw=1.3, dash="4 3"))
    o.append(ARR(106, 97, 168, 97, c=SIG, lw=1.5, dash="4 3"))
    o.append(T(137, 43, "LoRa の電波", "middle", 9.5, SIG, True))
    o.append(BOX(330, 32, 140, 82, "ネットワークサーバ", "重複を除く・MIC と カウンタを確かめる", GRN, GSOFT, GRN, sz=11, ssz=9.5))
    o.append(BOX(560, 32, 128, 82, "アプリケーションサーバ", "データを復号して使う", GRN, GSOFT, GRN, sz=10.5, ssz=9.5))
    o.append(ARR(270, 49, 328, 62, c=GLD, lw=1.5))
    o.append(ARR(270, 97, 328, 84, c=GLD, lw=1.5))
    o.append(T(299, 76, "IP の網", "middle", 9.5, GLD, True, halo=True))
    o.append(ARR(470, 73, 558, 73, c=GRN, lw=1.5))
    o.append(T(16, 132, "ゲートウェイは自分で置くことも、事業者が置いたものを使うこともできる。電波が届いたゲートウェイがすべて受け取る。", "start", 9.5, MUT))
    # セルラー
    y0 = 164
    o.append(T(16, y0, "LTE-M・NB-IoT（免許の帯域）", "start", 12, INK, True))
    yb = y0 + 12
    o.append(BOX(16, yb, 90, 44, "機器", "モジュール + SIM", SIG, SSOFT, SIG, sz=11, ssz=9))
    o.append(BOX(170, yb, 100, 44, "基地局", None, GLD, GOSOFT, GLD, sz=11))
    o.append(BOX(330, yb, 140, 44, "事業者の網", "登録・NAT など", GLD, GOSOFT, GLD, sz=11, ssz=9.5))
    o.append(BOX(560, yb, 128, 44, "サーバ", None, GRN, GSOFT, GRN, sz=11))
    o.append(ARR(106, yb + 22, 168, yb + 22, c=SIG, lw=1.5, dash="4 3"))
    o.append(T(137, yb + 16, "携帯の電波", "middle", 9.5, SIG, True))
    o.append(ARR(270, yb + 22, 328, yb + 22, c=GLD, lw=1.5))
    o.append(ARR(470, yb + 22, 558, yb + 22, c=GRN, lw=1.5))
    o.append(T(514, yb + 16, "インターネット", "middle", 9.5, GRN, True))
    o.append(T(16, yb + 64, "基地局と網は通信事業者が持つ。機器ごとに SIM と回線の契約が要る。", "start", 9.5, MUT))
    return SVG(700, yb + 76, o, "LPWA の 2 つの形。LoRaWAN（上）は免許不要の帯域を使い、機器の電波を受けたゲートウェイが、IP の網でネットワークサーバへ送る。LTE-M と NB-IoT（下）は、携帯電話の事業者の帯域・基地局・網を使う。どちらも、その先のサーバとはインターネットでつながる。")
F["e21_overview"] = _f21_overview()

# ---- 2 節: チャープ ----
def _f21_chirp_line(p, x0, k, N, c, lw=2.2, dash=None):
    """値 k のシンボル（x0 から 1 シンボル）を描く。周波数は 0〜1（BW に対する割合）。"""
    o = []
    s = k / N
    tw_ = 1 - s                      # 折り返すまでの時間（シンボルに対する割合）
    o.append(p.line([(x0, s), (x0 + tw_, 1)], c=c, lw=lw, dash=dash))
    if k:
        o.append(p.line([(x0 + tw_, 1), (x0 + tw_, 0)], c=c, lw=1, dash="2 3"))
        o.append(p.line([(x0 + tw_, 0), (x0 + 1, s)], c=c, lw=lw, dash=dash))
    return "".join(o)

def _f21_chirp():
    o = []
    p = Plot(110, 40, 540, 170, (0, 3), (0, 1))
    for v in (0, 1, 2, 3):
        o.append(W(p.X(v), p.Y(0), p.X(v), p.Y(1) - 6, c=GRD, lw=1))
    o.append(W(p.x, p.Y(0), p.x + p.w, p.Y(0), c=MUT, lw=1.2))
    o.append(W(p.x, p.Y(1), p.x + p.w, p.Y(1), c=GRD, lw=1))
    o.append(W(p.x, p.Y(0), p.x, p.Y(1), c=MUT, lw=1.2))
    o.append(T(p.x - 8, p.Y(0) + 4, "下端", "end", 10, MUT))
    o.append(T(p.x - 8, p.Y(1) + 4, "上端", "end", 10, MUT))
    o.append(T(p.x - 8, p.Y(0.5) + 4, "周波数", "end", 10, MUT))
    o.append(DIM(p.x + p.w + 14, p.Y(1), p.x + p.w + 14, p.Y(0), "BW", c=MUT))
    N = 128
    for i, (k, c) in enumerate(((0, SIG), (32, PUR), (96, GRN))):
        o.append(_f21_chirp_line(p, i, k, N, c))
        o.append(T(p.X(i + 0.5), 30, "値 %d" % k, "middle", 11, c, True))
        if k:
            o.append(D(p.X(i), p.Y(k / N), c, 4))
    o.append(T(p.X(1) + 6, p.Y(32 / 128) + 14, "32 × BW/128 から始まる", "start", 9.5, PUR, halo=True))
    o.append(T(p.X(2.25) + 6, p.Y(0.97) + 2, "上端で下端に戻る", "start", 9.5, GRN, halo=True))
    o.append(DIM(p.X(0), p.Y(0) + 18, p.X(1), p.Y(0) + 18, None, c=MUT))
    o.append(T(p.X(0.5), p.Y(0) + 34, "1 シンボル（シンボル時間）", "middle", 10, MUT))
    o.append(T(p.X(2), p.Y(0) + 34, "時間 →", "middle", 10, MUT))
    return SVG(700, 260, o, "LoRa のシンボル（SF7 の例。2^7 = 128 通りの値）。周波数は、帯域幅 BW の下端から上端まで一定の速さで上がる。値 k のシンボルは k × BW/128 だけ高い周波数から始まり、上端に達すると下端に戻って上がり続け、シンボルの終わりに始まりの周波数に戻る。")
F["e21_chirp"] = _f21_chirp()

def _f21_dechirp():
    o = []
    N, k = 8, 3
    # (a) 受け取った信号と基準
    pa = Plot(56, 44, 190, 140, (0, 1), (-1, 1))
    o.append(T(pa.x + pa.w / 2, 24, "(a) 受け取ったシンボル（値 3）", "middle", 11, INK, True))
    o.append(W(pa.x, pa.Y(0), pa.x + pa.w, pa.Y(0), c=MUT, lw=1.1))
    o.append(W(pa.x, pa.Y(1), pa.x + pa.w, pa.Y(1), c=GRD, lw=1))
    o.append(W(pa.x, pa.Y(-1), pa.x, pa.Y(1), c=MUT, lw=1.1))
    o.append(T(pa.x - 6, pa.Y(0) + 4, "下端", "end", 9.5, MUT))
    o.append(T(pa.x - 6, pa.Y(1) + 4, "上端", "end", 9.5, MUT))
    o.append(pa.line([(0, 0), (1, 1)], c=MUT, lw=1.6, dash="5 4"))
    o.append(pa.line([(0, k / N), (1 - k / N, 1)], c=SIG, lw=2.2))
    o.append(pa.line([(1 - k / N, 1), (1 - k / N, 0)], c=SIG, lw=1, dash="2 3"))
    o.append(pa.line([(1 - k / N, 0), (1, k / N)], c=SIG, lw=2.2))
    o.append(T(pa.X(0.05), pa.Y(-0.45), "時間 →", "start", 9.5, MUT))
    o.append(T(pa.X(0.05), pa.Y(-0.8), "破線 = 基準（値 0）", "start", 9.5, MUT))
    o.append(ARR(256, 114, 300, 114, c=INK, lw=1.6))
    o.append(T(278, 104, "引く", "middle", 10, INK, True))
    # (b) 差
    pb = Plot(330, 44, 170, 140, (0, 1), (-1, 1))
    o.append(T(pb.x + pb.w / 2, 24, "(b) 基準を引いた周波数", "middle", 11, INK, True))
    o.append(W(pb.x, pb.Y(0), pb.x + pb.w, pb.Y(0), c=MUT, lw=1.1))
    o.append(W(pb.x, pb.Y(-1), pb.x, pb.Y(1), c=MUT, lw=1.1))
    o.append(T(pb.x - 6, pb.Y(0) + 4, "0", "end", 9.5, MUT))
    o.append(pb.line([(0, k / N), (1 - k / N, k / N)], c=SIG, lw=2.4))
    o.append(pb.line([(1 - k / N, k / N - 1), (1, k / N - 1)], c=SIG, lw=2.4, dash="5 3"))
    o.append(T(pb.X(0.02), pb.Y(k / N) - 8, "3 × BW/8", "start", 9.5, SIG, True))
    o.append(T(pb.X(0.02), pb.Y(k / N - 1) + 4, "3 × BW/8 − BW", "start", 9.5, SIG))
    o.append(ARR(pb.X(0.82), pb.Y(k / N - 1) - 4, pb.X(0.82), pb.Y(k / N) + 6, c=GLD, lw=1.3))
    o.append(T(pb.X(0.5), pb.Y(-0.88), "BW 違いは同じに見える", "middle", 9.5, GLD, True))
    o.append(ARR(506, 114, 548, 114, c=INK, lw=1.6))
    o.append(T(527, 104, "調べる", "middle", 10, INK, True))
    # (c) 周波数ごとの強さ
    x0, yb, bw_ = 560, 184, 15
    o.append(T(625, 24, "(c) 周波数ごとの強さ", "middle", 11, INK, True))
    for j in range(N):
        h = 112 if j == k else 9 + (j * 5) % 11
        c = SIG if j == k else MUT
        o.append(RECT(x0 + j * bw_ + 1, yb - h, bw_ - 3, h, 1, soft(c), c, 1.0))
        o.append(T(x0 + j * bw_ + bw_ / 2, yb + 13, str(j), "middle", 9.5, SIG if j == k else MUT, j == k, True))
    o.append(T(625, yb + 30, "最も強い所 = 値 3", "middle", 10, SIG, True))
    return SVG(700, 226, o, "受け手の処理（見やすさのため SF = 3、値は 0〜7）。(a) 受け取ったシンボルの周波数から、基準のチャープ（値 0）の周波数を時刻ごとに引く。(b) 差は、折り返す前は 3 × BW/8、後は 3 × BW/8 − BW だが、1 秒に BW 回読む受け手には同じ周波数に見えるので、シンボルの全体が 1 つの周波数になる。(c) 周波数ごとの強さを求めると、値の位置だけが強い。")
F["e21_dechirp"] = _f21_dechirp()

def _f21_sf():
    o = []
    sfs = list(range(7, 13))
    # 左: シンボル時間
    o.append(T(20, 22, "1 シンボルの長さとビットレート（BW 125 kHz、4/5）", "start", 11, INK, True))
    x0, wmax = 64, 250
    for i, sf in enumerate(sfs):
        y = 36 + i * 32
        t = _f21_tsym(sf) * 1e3
        w = wmax * t / 32.768
        o.append(T(x0 - 8, y + 15, "SF%d" % sf, "end", 10.5, INK, True))
        o.append(RECT(x0, y + 2, max(w, 2), 18, 3, SSOFT, SIG, 1.1))
        lab = "%s ms" % ("%g" % round(t, 3))
        o.append(T(x0 + max(w, 2) + 6 if w < 150 else x0 + w - 6, y + 15, lab, "start" if w < 150 else "end", 9.5, SIG, True))
        o.append(T(x0 + wmax + 20, y + 15, "%d bps" % round(_f21_rb(sf)), "start", 9.5, MUT))
    o.append(T(x0, 36 + 6 * 32 + 14, "SF を 1 上げるとシンボル時間は 2 倍", "start", 9.5, MUT))
    # 右: 要る受信電力
    p = Plot(430, 40, 240, 170, (6.6, 12.4), (-14, 1))
    o.append(T(550, 22, "SF7 と比べた、要る受信電力", "middle", 11, INK, True))
    o.append(p.axes(xl="SF", yl="dB", xt=sfs, yt=[0, -4, -8, -12], xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%+d" % v) if v else "0"))
    est = [(sf, -10 * math.log10(_f21_rb(7) / _f21_rb(sf))) for sf in sfs]
    ds = [(sf, -2.5 * (sf - 7)) for sf in sfs]
    o.append(p.line(est, c=SIG, lw=2))
    o.append(p.line(ds, c=GLD, lw=1.6, dash="5 3"))
    for (a, b), (_, d2) in zip(est, ds):
        o.append(D(p.X(a), p.Y(b), SIG, 3.4))
        o.append(D(p.X(a), p.Y(d2), GLD, 2.8))
    o.append(T(p.X(11.7), p.Y(-12.7) + 4, "−12.7 dB", "end", 9.5, SIG, True))
    o.append(LEGEND(430, 262, [(SIG, "ビット時間からの見積もり")], sz=9.5))
    o.append(LEGEND(430, 280, [(GLD, "SN 比の限度の差（代表値）")], sz=9.5))
    return SVG(700, 292, o, "SF ごとのシンボル時間とビットレート（左）と、SF7 と比べて要る受信電力（右）。青は、16 章 3 節の「要る受信電力はビット時間に反比例する」という見積もり、金の破線は、データシートの SN 比の限度（SF7 の −7.5 dB から 2.5 dB ずつ下がる代表値）の差。SF を 1 上げるごとに約 2.5 dB 弱い電波まで受け取れる。")
F["e21_sf"] = _f21_sf()

# ---- 3 節: パケットの形と空中時間 ----
def _f21_packet():
    o = []
    u = 10.0                                  # 1 シンボルの幅
    x0, y0, h = 30, 76, 34
    rnd = [5, 61, 22, 98, 47, 110, 3, 77]
    def ramp(xa, w, s, up=True, c=SIG):
        # 1 シンボルのチャープ（s は始まりの位置 0〜1）
        yy = lambda f: y0 + h - f * h
        if up:
            if s == 0:
                return W(xa, yy(0), xa + w, yy(1), c=c, lw=1.3)
            xt = xa + w * (1 - s)
            return W(xa, yy(s), xt, yy(1), c=c, lw=1.3) + W(xt, yy(0), xa + w, yy(s), c=c, lw=1.3)
        return W(xa, yy(1), xa + w, yy(0), c=c, lw=1.3)
    x = x0
    for i in range(8):
        o.append(ramp(x + i * u, u, 0, c=MUT))
    o.append(RECT(x, y0, 8 * u, h, 2, "none", MUT, 1.1))
    xs_sync = x + 8 * u
    for i in range(2):
        o.append(ramp(xs_sync + i * u, u, 0.5 if i == 0 else 0.25, c=GLD))
    o.append(RECT(xs_sync, y0, 2 * u, h, 2, "none", GLD, 1.1))
    xs_sfd = xs_sync + 2 * u
    for i in range(3):
        w = u if i < 2 else 0.25 * u
        o.append(ramp(xs_sfd + i * u, w, 0, up=False, c=GLD))
    o.append(RECT(xs_sfd, y0, 2.25 * u, h, 2, "none", GLD, 1.1))
    xs_h = xs_sfd + 2.25 * u
    o.append(RECT(xs_h, y0, 8 * u, h, 2, PSOFT, PUR, 1.1))
    for i in range(8):
        o.append(ramp(xs_h + i * u, u, rnd[i] / 128, c=PUR))
    xs_b = xs_h + 8 * u
    for j in range(8):
        o.append(RECT(xs_b + j * 5 * u, y0, 5 * u, h, 2, SSOFT, SIG, 1.1))
        o.append(T(xs_b + j * 5 * u + 2.5 * u, y0 + h / 2 + 4, "5", "middle", 10, SIG, True))
    xe = xs_b + 40 * u
    # 上の見出し
    o.append(T((x + xs_sync) / 2, y0 - 8, "プリアンブル n = 8", "middle", 9.5, MUT, True))
    o.append(T(xs_sync + u, y0 - 22, "同期 2", "middle", 9.5, GLD, True))
    o.append(W(xs_sync + u, y0 - 18, xs_sync + u, y0 - 2, c=GLD, lw=1))
    o.append(T(xs_sfd + 1.1 * u, y0 - 38, "下がる 2.25", "middle", 9.5, GLD, True))
    o.append(W(xs_sfd + 1.1 * u, y0 - 34, xs_sfd + 1.1 * u, y0 - 2, c=GLD, lw=1))
    o.append(T((xs_h + xs_b) / 2, y0 - 8, "最初のブロック 8", "middle", 9.5, PUR, True))
    o.append(T((xs_b + xe) / 2, y0 - 8, "ブロック 8 個 × (4 + CR) = 40（1 ブロックは 5 シンボル）", "middle", 9.5, SIG, True))
    # 下の括弧
    yb = y0 + h + 12
    o.append(W(x, yb, x, yb + 6, xs_h, yb + 6, xs_h, yb, c=GLD, lw=1.2))
    o.append(T((x + xs_h) / 2, yb + 22, "n + 4.25 = 12.25 シンボル", "middle", 10, GLD, True))
    o.append(W(xs_h, yb, xs_h, yb + 6, xe, yb + 6, xe, yb, c=SIG, lw=1.2))
    o.append(T((xs_h + xe) / 2, yb + 22, "N_pay = 8 + 40 = 48 シンボル", "middle", 10, SIG, True))
    o.append(T(x, yb + 48, "最初のブロック: 符号化率 4/8・1 シンボル SF − 2 ビット。明示ヘッダの 20 ビットとデータの始めを運ぶ。", "start", 9.5, PUR))
    o.append(T(x, yb + 66, "残りのブロック: (4 + CR) シンボル・1 シンボル SF − 2D_E ビット。残りのデータと CRC の 16 ビットを運ぶ。", "start", 9.5, SIG))
    o.append(T(x, yb + 88, "SF7・PL 25 バイトの例: (12.25 + 48) シンボル × 1.024 ms = 61.7 ms", "start", 10.5, INK, True))
    return SVG(700, yb + 100, o, "LoRa のパケットの形（SF7、PL = 25 バイトの例。プリアンブルと最初のブロックの線は、各シンボルの周波数の動き）。値 0 のチャープを n 回、同期の印を 2 シンボル、周波数が下がるチャープを 2.25 シンボル送った後、最初のブロック（8 シンボル）と、4 + CR シンボルずつのブロックで、ヘッダ・データ・CRC を送る。")
F["e21_packet"] = _f21_packet()

def _f21_toa_calc():
    o = []
    rows = [("① シンボル時間", "2^7 ÷ 125000 = 1.024 ms", "2^12 ÷ 125000 = 32.768 ms"),
            ("② 分子", "8×25 − 4×7 + 8 + 16 + 20 = 216", "8×25 − 4×12 + 8 + 16 + 20 = 196"),
            ("③ 分母", "4 × (7 − 0) = 28", "4 × (12 − 2) = 40（LDRO）"),
            ("④ ブロックの数", "⌈216 ÷ 28⌉ = ⌈7.71⌉ = 8", "⌈196 ÷ 40⌉ = ⌈4.9⌉ = 5"),
            ("⑤ N_pay", "8 + 8 × (1 + 4) = 48", "8 + 5 × (1 + 4) = 33"),
            ("⑥ シンボルの合計", "8 + 4.25 + 48 = 60.25", "8 + 4.25 + 33 = 45.25"),
            ("⑦ 空中時間", "60.25 × 1.024 = 61.7 ms", "45.25 × 32.768 = 1482.8 ms")]
    xl, xa, xb = 16, 150, 430
    o.append(T(xa, 22, "SF7（LDRO なし）", "start", 12, SIG, True))
    o.append(T(xb, 22, "SF12（LDRO あり）", "start", 12, PUR, True))
    for i, (lab, a, b) in enumerate(rows):
        y = 50 + i * 30
        last = i == len(rows) - 1
        if last:
            o.append(W(xa - 4, y - 19, 684, y - 19, c=INK, lw=1.2))
        o.append(T(xl, y, lab, "start", 10.5, INK, last))
        o.append(T(xa, y, a, "start", 10.5, SIG if last else INK, last, True))
        o.append(T(xb, y, b, "start", 10.5, PUR if last else INK, last, True))
    o.append(T(xl, 50 + 7 * 30 + 4, "PL = 25 バイト（LoRaWAN の 13 バイト + データ 12 バイト）、BW 125 kHz、CR = 1（4/5）、n = 8、H = 1、C = 1。", "start", 9.5, MUT))
    return SVG(700, 50 + 7 * 30 + 14, o, "空中時間の計算の手順（PL = 25 バイト）。分子は最初のブロックの後に残るビットの数、分母は 1 ブロックが運ぶデータのビットの数。SF12 では LDRO で 1 シンボルが運ぶビットが 2 つ減るので、分母は 4 × (12 − 2) になる。")
F["e21_toa_calc"] = _f21_toa_calc()

def _f21_toa_pl():
    o = []
    p = Plot(90, 24, 520, 220, (0, 64), (0.03, 3), ylog=True)
    o.append(T(p.x - 62, p.y + p.h / 2, "空中時間", "middle", 10, MUT, rot=-90))
    o.append(p.axes(xl="PL（LoRa のペイロードのバイト数）", yl=None, xt=[0, 13, 25, 40, 51, 64], yt=[0.03, 0.1, 0.3, 1, 3],
                    xfmt=lambda v: "%d" % v, yfmt=lambda v: ("%g ms" % (v * 1000)) if v < 1 else ("%g s" % v)))
    for sf, c in ((7, SIG), (9, GRN), (10, GLD), (12, PUR)):
        pts = [(pl, _f21_toa(sf, pl)) for pl in range(0, 65)]
        o.append(p.steps(pts, c=c, lw=2))
        o.append(T(p.X(64) + 6, p.Y(_f21_toa(sf, 64)) + 4, "SF%d" % sf, "start", 10.5, c, True))
    o.append(W(p.X(13), p.y, p.X(13), p.y + p.h, c=FNT, lw=1, dash="3 3"))
    o.append(T(p.X(13) + 4, p.y + 12, "LoRaWAN の 13 バイト", "start", 9.5, MUT, halo=True))
    for sf in (7, 12):
        t = _f21_toa(sf, 25)
        o.append(D(p.X(25), p.Y(t), ALI, 4))
        o.append(T(p.X(25) + 7, p.Y(t) + 15, "%.1f ms" % (t * 1000), "start", 9.5, ALI, True, halo=True))
    return SVG(700, 290, o, "LoRa のペイロードの長さと空中時間（BW 125 kHz、CR 4/5、n = 8、明示ヘッダ・CRC あり。縦軸は対数目盛）。ブロックの境目を越えるたびに 4 + CR シンボル分ずつ増えるので、階段の形になる。赤い点は本文の例（PL = 25 バイト）。")
F["e21_toa_pl"] = _f21_toa_pl()

# ---- 4 節: デューティサイクル ----
def _f21_dc():
    o = []
    o.append(T(16, 20, "SF12（空中時間 1.48 s）を 1 % で送るときの時間軸（横は 0〜330 s）", "start", 11, INK, True))
    x0, x1, y = 60, 680, 62
    X = lambda t: x0 + (x1 - x0) * t / 330.0
    o.append(W(x0, y + 26, x1, y + 26, c=MUT, lw=1))
    toa = _f21_toa(12, 25)
    for k in range(3):
        ts = k * 100 * toa
        o.append(RECT(X(ts), y, max(X(ts + toa) - X(ts), 3), 26, 1, ASOFT, ALI, 1.2))
        o.append(RECT(X(ts + toa) + 1, y + 8, X(ts + 100 * toa) - X(ts + toa) - 2, 10, 2, MSOFT, MUT, 1.0, dash="3 3"))
    for t in (0, 60, 120, 180, 240, 300):
        o.append(W(X(t), y + 26, X(t), y + 30, c=MUT, lw=1))
        o.append(T(X(t), y + 42, "%d s" % t, "middle", 9.5, MUT))
    o.append(T(X(0) + 6, y - 6, "送信 1.48 s", "start", 9.5, ALI, True))
    o.append(T(X(74), y - 22, "送り終えてから 99 × 1.48 = 147 s は送らない", "middle", 9.5, MUT))
    o.append(DIM(X(0), y + 66, X(100 * toa), y + 66, "送り始めの間隔の最小 100 × 1.48 = 148 s", c=SIG))
    # 下: 1 時間に送れる回数
    y2 = 166
    o.append(T(16, y2, "1 時間に送れる回数（1 %、PL = 25 バイト）= 36 s ÷ 空中時間", "start", 11, INK, True))
    items = []
    for sf in range(7, 13):
        t = _f21_toa(sf, 25)
        items.append(("SF%d（%.0f ms）" % (sf, t * 1000) if t < 1 else "SF%d（%.2f s）" % (sf, t), math.floor(36 / t), SIG if sf < 12 else ALI))
    o.append(BARS(16, y2 + 12, 660, 150, items, fmt=lambda v: "%d 回" % v, label_w=120, gap=6, sz=10))
    return SVG(700, y2 + 172, o, "デューティサイクル 1 % の守り方。上: 送り終えてから空中時間の 99 倍は送らないと、送り始めの間隔は空中時間の 100 倍以上になる。下: 1 時間に送れる回数。SF7 なら 583 回だが、SF12 では 24 回しか送れない。")
F["e21_dc"] = _f21_dc()

def _f21_aloha():
    o = []
    # 左: 重なる範囲
    o.append(T(16, 20, "自分の送信と重なる、ほかの送信の始まりの範囲", "start", 11, INK, True))
    x0, u, y = 40, 70, 84
    o.append(RECT(x0 + u, y - 46, 2 * u, 112, 3, ASOFT, "none", 0, op=0.6))
    o.append(RECT(x0 + 2 * u, y, u, 20, 3, SSOFT, SIG, 1.4))
    o.append(T(x0 + 2.5 * u, y + 14, "自分", "middle", 10, SIG, True))
    for (s_, dy, ok) in ((1.4, -40, False), (2.7, 32, False), (3.4, -40, True)):
        c = ALI if not ok else GRN
        o.append(RECT(x0 + s_ * u, y + dy, u, 18, 3, soft(c), c, 1.2))
        o.append(T(x0 + (s_ + 0.5) * u, y + dy + 13, "重なる" if not ok else "重ならない", "middle", 9.5, c, True))
    ya = y + 74
    o.append(W(x0, ya, x0 + 4.6 * u, ya, c=MUT, lw=1))
    for k, lab in ((1, "t − T_air"), (2, "t"), (3, "t + T_air")):
        o.append(W(x0 + k * u, ya - 4, x0 + k * u, ya + 4, c=MUT, lw=1))
        o.append(T(x0 + k * u, ya + 16, lab, "middle", 9.5, MUT))
    o.append(T(x0 + 2 * u, ya + 36, "始まりがこの 2T_air の間なら重なる", "middle", 9.5, ALI, True))
    # 右: 確率
    p = Plot(420, 36, 250, 170, (0, 2000), (0, 1))
    o.append(T(545, 20, "どれとも重ならない確率（1 時間に 1 回）", "middle", 11, INK, True))
    o.append(p.axes(xl="同じチャネル・同じ SF の機器の数 N", yl="確率", xt=[0, 500, 1000, 1500, 2000], yt=[0, 0.5, 1], xfmt=lambda v: "%d" % v, yfmt=lambda v: "%g" % v))
    for sf, c in ((7, SIG), (10, GLD), (12, PUR)):
        t = _f21_toa(sf, 25)
        pts = [(n, (1 - 2 * t / 3600) ** (n - 1)) for n in range(1, 2001, 20)]
        o.append(p.line(pts, c=c, lw=2))
        n0 = 1000
        o.append(D(p.X(n0), p.Y((1 - 2 * t / 3600) ** (n0 - 1)), c, 3.6))
    o.append(T(p.X(1980), p.Y((1 - 2 * _f21_toa(7, 25) / 3600) ** 1979) - 7, "SF7", "end", 10, SIG, True))
    o.append(T(p.X(1980), p.Y((1 - 2 * _f21_toa(10, 25) / 3600) ** 1979) - 7, "SF10", "end", 10, GLD, True))
    o.append(T(p.X(1980), p.Y((1 - 2 * _f21_toa(12, 25) / 3600) ** 1979) + 14, "SF12", "end", 10, PUR, True))
    o.append(T(p.X(1000) + 6, p.Y(0.439) + 4, "43.9 %", "start", 9.5, PUR, True, halo=True))
    return SVG(700, 254, o, "送信の重なり。左: 自分の送信（長さ T_air）と重なるのは、始まりが t − T_air から t + T_air の間にあるほかの送信。右: N 台が 1 時間に 1 回ずつ、互いに無関係な時刻に送るとき、1 つの送信がどれとも重ならない確率 (1 − 2T_air/3600)^(N−1)（PL = 25 バイト）。点は N = 1000。")
F["e21_aloha"] = _f21_aloha()

# ---- 5 節: LoRaWAN ----
def _f21_arch():
    o = []
    devs = [("機器 A", 40), ("機器 B", 104), ("機器 C", 168)]
    for nm, y in devs:
        o.append(BOX(16, y, 84, 34, nm, None, SIG, SSOFT, SIG, sz=11))
    o.append(BOX(190, 56, 104, 40, "ゲートウェイ 1", None, GLD, GOSOFT, GLD, sz=10.5))
    o.append(BOX(190, 140, 104, 40, "ゲートウェイ 2", None, GLD, GOSOFT, GLD, sz=10.5))
    o.append(ARR(100, 57, 188, 72, c=SIG, lw=1.4, dash="4 3"))
    o.append(ARR(100, 121, 188, 82, c=SIG, lw=1.4, dash="4 3"))
    o.append(ARR(100, 125, 188, 154, c=SIG, lw=1.4, dash="4 3"))
    o.append(ARR(100, 185, 188, 166, c=SIG, lw=1.4, dash="4 3"))
    o.append(T(144, 34, "上り（FCnt = 41）", "middle", 9.5, SIG, True))
    o.append(RECT(380, 70, 150, 96, 8, GSOFT, GRN, 1.4))
    o.append(T(455, 94, "ネットワークサーバ", "middle", 11, GRN, True))
    o.append(T(455, 120, "同じフレームを 1 つに", "middle", 9.5, MUT))
    o.append(T(455, 135, "MIC とカウンタを確かめる", "middle", 9.5, MUT))
    o.append(T(455, 150, "下りのゲートウェイを選ぶ", "middle", 9.5, MUT))
    o.append(ARR(294, 76, 378, 100, c=GLD, lw=1.5))
    o.append(ARR(294, 160, 378, 136, c=GLD, lw=1.5))
    o.append(T(336, 76, "機器 B の", "middle", 9.5, GLD, True, halo=True))
    o.append(T(336, 168, "機器 B の", "middle", 9.5, GLD, True, halo=True))
    o.append(RECT(570, 70, 118, 96, 8, GSOFT, GRN, 1.4))
    o.append(T(629, 94, "アプリケーション", "middle", 10.5, GRN, True))
    o.append(T(629, 109, "サーバ", "middle", 10.5, GRN, True))
    o.append(T(629, 135, "データを復号", "middle", 9.5, MUT))
    o.append(ARR(530, 118, 568, 118, c=GRN, lw=1.5))
    o.append(T(16, 228, "機器 B の上りは 2 つのゲートウェイに届き、ネットワークサーバには同じフレームが 2 つ届く。", "start", 9.5, MUT))
    o.append(T(16, 244, "ゲートウェイは中身を解かずに、受け取ったものを IP の網で送るだけである。", "start", 9.5, MUT))
    return SVG(700, 256, o, "LoRaWAN の網の構成。機器は特定のゲートウェイにつながらず、電波が届いたゲートウェイがすべて受け取る。ネットワークサーバは、複数のゲートウェイから届いた同じフレームを 1 つにまとめ、確かめた後、データをアプリケーションサーバへ渡す。")
F["e21_arch"] = _f21_arch()

def _f21_frame():
    o = []
    fields = [("MHDR", 1, PUR, "40"), ("DevAddr", 4, SIG, "3D 1C 0B 26"), ("FCtrl", 1, SIG, "80"), ("FCnt", 2, SIG, "29 00"),
              ("FPort", 1, PUR, "0A"), ("FRMPayload（データ）", 12, GRN, "暗号化した 12 バイト"), ("MIC", 4, ALI, "4 バイト")]
    unit, x0, y0, h = 26, 16, 44, 40
    x = x0
    pos = {}
    for name, nb, c, val in fields:
        w = nb * unit
        if name == "FPort":
            # FOpts（0 バイト）を細い破線で示す
            o.append(RECT(x - 1, y0 - 6, 3, h + 12, 1, "none", MUT, 1.0, dash="2 2"))
        o.append(RECT(x, y0, w, h, 3, soft(c), c, 1.3))
        o.append(T(x + w / 2, y0 + 16, name, "middle", 10 if nb > 1 else 9, c, True))
        o.append(T(x + w / 2, y0 + 32, val, "middle", 9.5, INK, False, nb > 1 and "暗号" not in val and "バイト" not in val))
        o.append(T(x + w / 2, y0 + h + 14, "%d B" % nb, "middle", 9, MUT))
        pos[name] = (x, x + w)
        x += w
    o.append(T(pos["FPort"][0] - 2, y0 + h + 28, "↑ FOpts（0〜15 B）", "middle", 9, MUT))
    # 上の括弧
    xa, xb = pos["MHDR"][0], pos["FRMPayload（データ）"][1]
    o.append(W(xa, 30, xa, 24, xb, 24, xb, 30, c=ALI, lw=1.2))
    o.append(T((xa + xb) / 2, 18, "MIC を計算する範囲（フレームカウンタの 32 ビットも含める）", "middle", 9.5, ALI, True))
    yb = y0 + h + 50
    o.append(T(x0, yb, "MHDR 0x40 = 確認なしの上り。DevAddr 0x260B1C3D と FCnt 41（0x0029）はリトルエンディアン。FCtrl 0x80 = ADR のビット。", "start", 9.5, MUT))
    o.append(T(x0, yb + 17, "足されるのは 1 + 4 + 1 + 2 + 1 + 4 = 13 バイト（FOpts が空のとき）。この全体が LoRa のパケットのペイロードになる。", "start", 9.5, MUT))
    return SVG(700, yb + 28, o, "LoRaWAN の上りのフレームの例（データ 12 バイト）。FOpts が空なら、データに 13 バイトが足される。FRMPayload はセッション鍵とフレームカウンタから作ったバイトの列で暗号化され、最後の MIC は別のセッション鍵で計算される。")
F["e21_frame"] = _f21_frame()

def _f21_classes():
    o = []
    x0, x1 = 100, 520
    rows = [("クラス A", 30), ("クラス B", 112), ("クラス C", 194)]
    X = lambda t: x0 + (x1 - x0) * t / 12.0
    def tx(y, t):
        o.append(RECT(X(t), y, X(t + 0.7) - X(t), 22, 2, ASOFT, ALI, 1.2))
        o.append(T(X(t + 0.35), y + 15, "上り", "middle", 9, ALI, True))
    def rx(y, t, w=0.35, lab=None, c=TEA):
        o.append(RECT(X(t), y + 4, X(t + w) - X(t), 14, 2, soft(c), c, 1.1))
        if lab:
            o.append(T(X(t + w / 2), y - 4, lab, "middle", 9, c, True))
    for nm, y in rows:
        o.append(T(16, y + 15, nm, "start", 11.5, INK, True))
        o.append(W(x0, y + 22, x1, y + 22, c=MUT, lw=1))
    # A
    y = rows[0][1]
    tx(y, 0.5); rx(y, 1.9, lab="RX1"); rx(y, 2.9, lab="RX2")
    o.append(DIM(X(1.2), y + 32, X(1.9), y + 32, None, c=MUT))
    o.append(T(X(1.55), y + 46, "1 s", "middle", 9, MUT))
    o.append(DIM(X(1.2), y + 52, X(2.9), y + 52, None, c=MUT))
    o.append(T(X(2.05), y + 66, "2 s", "middle", 9, MUT))
    o.append(T(X(7.5), y + 15, "眠る（次の上りまで受け取れない）", "middle", 9.5, MUT))
    tx(y, 10.6)
    # B
    y = rows[1][1]
    rx(y, 0.2, 0.4, "ビーコン", GLD)
    for t in (2.5, 5.0, 7.5, 10.0):
        rx(y, t, 0.25, None, TEA)
    o.append(T(X(5.12), y - 4, "決まった周期の受信窓", "middle", 9, TEA, True))
    tx(y, 3.4)
    o.append(T(X(9.0), y + 40, "（ビーコンは 128 秒ごと。上りの後の RX1・RX2 はクラス A と同じ）", "middle", 9, MUT))
    # C
    y = rows[2][1]
    o.append(RECT(X(0), y + 4, X(3.4) - X(0), 14, 2, TSOFT, TEA, 1.1))
    tx(y, 3.4)
    o.append(RECT(X(4.1), y + 4, X(12) - X(4.1), 14, 2, TSOFT, TEA, 1.1))
    o.append(T(X(8), y - 4, "送信の間を除いて、ずっと受信", "middle", 9, TEA, True))
    # 右の説明
    notes = [("下りの遅れ: 最大で上りの間隔", "電流: 最も小さい"),
             ("下りの遅れ: 窓の周期まで", "電流: ビーコンと窓の分だけ増える"),
             ("下りの遅れ: ほぼ無い", "電流: 受信の電流が流れ続ける")]
    for (a, b), (_, y) in zip(notes, rows):
        o.append(T(532, y + 10, a, "start", 9.5, INK))
        o.append(T(532, y + 26, b, "start", 9.5, MUT))
    o.append(T(x0, 262, "横軸は時間（縮尺は正確でない）。赤は送信、青緑は受信、金はビーコンの受信。", "start", 9.5, MUT))
    return SVG(700, 274, o, "LoRaWAN のクラス A・B・C の受信のしかた。クラス A は上りを送り終えてから 1 秒後（RX1）と 2 秒後（RX2）にだけ受信する。クラス B は、ビーコンで時計を合わせて決まった周期の受信窓を足す。クラス C は、送信の間を除いて受信し続ける。")
F["e21_classes"] = _f21_classes()

F["e21_join"] = SEQFIG(
    [("機器", SIG), ("ゲートウェイ", GLD), ("ネットワークサーバ", GRN)],
    [(0, 1, "Join-request", {"c": SIG, "sub": "JoinEUI・DevEUI・DevNonce、AppKey で MIC"}),
     (1, 2, "そのまま送る", {"c": GLD}),
     ("note", 2, "MIC を確かめ、DevAddr と\n網が選んだ数を決める", {"c": GRN}),
     (2, 1, "Join-accept", {"c": GRN, "dash": True, "sub": "AppKey で暗号化"}),
     (1, 0, "5 秒後の受信窓で送る", {"c": GLD, "dash": True}),
     ("note", 0, "AppKey と両者の数から\nセッション鍵を計算する", {"c": SIG}),
     ("note", 2, "同じセッション鍵を計算する", {"c": GRN}),
     (0, 1, "上り（FCnt = 0）", {"c": SIG, "sub": "セッション鍵で暗号化と MIC"}),
     (1, 2, "そのまま送る", {"c": GLD})],
    "OTAA の参加の手続き（LoRaWAN 1.0 系の流れ）。AppKey は電波に乗らない。Join-accept は、既定では Join-request を送り終えてから 5 秒後と 6 秒後に開く受信窓で届く。参加のたびに新しいセッション鍵が作られ、フレームカウンタは 0 から始まる。", w=700)

def _f21_fcnt():
    o = []
    # 32 ビットの分け方
    o.append(T(16, 22, "フレームカウンタ（32 ビット）", "start", 11, INK, True))
    o.append(RECT(200, 8, 200, 24, 3, MSOFT, MUT, 1.2))
    o.append(T(300, 25, "上位 16 ビット（送らない）", "middle", 10, MUT, True))
    o.append(RECT(400, 8, 200, 24, 3, SSOFT, SIG, 1.2))
    o.append(T(500, 25, "下位 16 ビット = FCnt の欄", "middle", 10, SIG, True))
    # 例の表
    hdr = ["", "最後に受け入れた L", "受け取った r", "c（L の上位 + r）", "判断", "送り手の値"]
    xs = [16, 70, 220, 330, 470, 580]
    y0 = 64
    for x, h in zip(xs, hdr):
        o.append(T(x, y0, h, "start", 10, INK, True))
    o.append(W(16, y0 + 7, 684, y0 + 7, c=LIN, lw=1))
    rows = [("例 1", "0x0001_FFF0", "0xFFF5", "0x0001_FFF5", "c > L", "0x0001_FFF5", GRN),
            ("例 2", "0x0001_FFF0", "0x0003", "0x0001_0003", "c < L: 一周", "0x0002_0003", GRN),
            ("例 3", "0x0001_FFF0", "0xFFF0", "0x0001_FFF0", "c = L: 重複", "捨てる", ALI)]
    for i, (a, b, c, d, e, f, col) in enumerate(rows):
        y = y0 + 28 + i * 26
        o.append(T(xs[0], y, a, "start", 10, INK, True))
        o.append(T(xs[1], y, b, "start", 10.5, INK, False, True))
        o.append(T(xs[2], y, c, "start", 10.5, SIG, True, True))
        o.append(T(xs[3], y, d, "start", 10.5, INK, False, True))
        o.append(T(xs[4], y, e, "start", 10, col, True))
        o.append(T(xs[5], y, f, "start", 10.5, col, True, "0x" in f))
    # 数直線
    yl = 196
    xa, xb = 120, 600
    o.append(W(60, yl, 660, yl, c=MUT, lw=1.2))
    o.append(RECT(xa, yl - 10, xb - xa, 20, 3, GSOFT, "none", 0, op=0.8))
    o.append(D(xa, yl, INK, 4))
    o.append(T(xa, yl + 24, "L", "middle", 10.5, INK, True))
    o.append(W(xb, yl - 10, xb, yl + 10, c=GRN, lw=1.4))
    o.append(T(xb, yl + 24, "L + 65536", "middle", 10.5, GRN, True))
    o.append(T((xa + xb) / 2, yl - 16, "この範囲に、下位 16 ビットが r の値はちょうど 1 つ（r = L の下位 16 ビットなら重複）", "middle", 9.5, GRN, True))
    o.append(T(16, yl + 46, "間のフレームが 65535 個以上続けて失われない限り、送り手の値はこの範囲にあり、正しく復元できる。", "start", 9.5, MUT))
    return SVG(700, yl + 58, o, "フレームカウンタの復元。フレームには下位 16 ビットだけを入れ、受け手は最後に受け入れた値 L の上位 16 ビットをつないで c を作る。c が L より小さければ一周したとして 65536 を足し、等しければ重複として捨てる。")
F["e21_fcnt"] = _f21_fcnt()

# ---- 6 節: セルラー ----
def _f21_cell_states():
    o = []
    x0, x1 = 120, 690
    X = lambda t: x0 + (x1 - x0) * t / 100.0
    rows = [("PSM", 34), ("eDRX", 156)]
    def band(y, a, b, c, lab=None, h=26):
        o.append(RECT(X(a), y, X(b) - X(a), h, 2, soft(c), c, 1.1))
        if lab:
            o.append(T((X(a) + X(b)) / 2, y + h / 2 + 4, lab, "middle", 9.5, c, True))
    def spikes(y, a, b, step, c=TEA):
        t = a + step / 2
        while t < b:
            o.append(RECT(X(t) - 1.5, y + 6, 3, 14, 1, soft(c), c, 1.0))
            t += step
    for nm, y in rows:
        o.append(T(16, y + 17, nm, "start", 12, INK, True))
        o.append(W(x0, y + 26, x1, y + 26, c=MUT, lw=1))
    # PSM
    y = rows[0][1]
    band(y, 0, 6, ALI, "報告")
    band(y, 6, 14, GLD, "接続")
    spikes(y, 14, 30, 4)
    band(y, 30, 72, MUT, "深く眠る（下りは届かない）")
    band(y, 72, 77, PUR, "TAU")
    spikes(y, 77, 93, 4)
    band(y, 93, 100, MUT, None)
    o.append(DIM(X(14), y + 36, X(30), y + 36, None, c=TEA))
    o.append(T(X(22), y + 50, "T3324 の間、DRX で呼び出しを聞く", "middle", 9, TEA, True))
    o.append(DIM(X(14), y + 60, X(72), y + 60, None, c=PUR))
    o.append(T(X(43), y + 74, "T3412 が切れたら TAU（報告が無いとき）", "middle", 9, PUR, True))
    o.append(T(X(0), y + 92, "下りが届くのは、報告の後と TAU の後の T3324 の間だけ", "start", 9.5, MUT))
    # eDRX
    y = rows[1][1]
    band(y, 0, 6, ALI, "報告")
    band(y, 6, 14, GLD, "接続")
    t = 14
    while t < 100:
        o.append(RECT(X(t + 6) - 2, y + 4, 4, 18, 1, TSOFT, TEA, 1.0))
        t += 12
    o.append(DIM(X(20), y + 36, X(32), y + 36, None, c=TEA))
    o.append(T(X(26), y + 50, "eDRX の周期", "middle", 9, TEA, True))
    o.append(T(X(0), y + 70, "呼び出しを聞き続けるので、下りは最大で周期だけ遅れて届く。眠りの電流は PSM より大きいことが多い", "start", 9.5, MUT))
    o.append(T(x0, 270, "横軸は時間（縮尺は正確でない）。報告と TAU は無線の接続を作って送受信する。", "start", 9.5, MUT))
    return SVG(700, 282, o, "セルラー LPWA の機器の状態。報告の後、網が無線の接続を切るとアイドルになる。PSM（上）では、アクティブタイマ T3324 の間だけ DRX で呼び出しを聞き、その後は深く眠る。T3412 が切れると TAU を行う。eDRX（下）では、延ばした周期で呼び出しを聞き続ける。")
F["e21_cell_states"] = _f21_cell_states()

def _f21_timer():
    o = []
    o.append(T(16, 20, "AT+CPSMS=1,,,\"01000001\",\"00000101\"  →  T3412 = 10 時間、T3324 = 10 秒", "start", 11, INK, True, True))
    # ビットの図
    bits = "01000001"
    x0, y0, bw = 40, 40, 34
    for i, b in enumerate(bits):
        c = GLD if i < 3 else SIG
        o.append(RECT(x0 + i * bw, y0, bw, 30, 2, soft(c), c, 1.2))
        o.append(T(x0 + i * bw + bw / 2, y0 + 20, b, "middle", 12, c, True, True))
    o.append(T(x0 + 1.5 * bw, y0 + 46, "単位 010 = 10 時間", "middle", 10, GLD, True))
    o.append(T(x0 + 5.5 * bw, y0 + 46, "値 00001 = 1", "middle", 10, SIG, True))
    o.append(T(x0 + 4 * bw, y0 + 66, "T3412 = 10 時間 × 1 = 10 時間", "middle", 10.5, INK, True))
    bits2 = "00000101"
    x2 = 380
    for i, b in enumerate(bits2):
        c = GLD if i < 3 else SIG
        o.append(RECT(x2 + i * bw, y0, bw, 30, 2, soft(c), c, 1.2))
        o.append(T(x2 + i * bw + bw / 2, y0 + 20, b, "middle", 12, c, True, True))
    o.append(T(x2 + 1.5 * bw, y0 + 46, "単位 000 = 2 秒", "middle", 10, GLD, True))
    o.append(T(x2 + 5.5 * bw, y0 + 46, "値 00101 = 5", "middle", 10, SIG, True))
    o.append(T(x2 + 4 * bw, y0 + 66, "T3324 = 2 秒 × 5 = 10 秒", "middle", 10.5, INK, True))
    # 単位の表
    y1 = 138
    o.append(T(40, y1, "T3412 の単位（GPRS Timer 3）", "start", 10.5, INK, True))
    u3 = [("000", "10 分"), ("001", "1 時間"), ("010", "10 時間"), ("011", "2 秒"), ("100", "30 秒"), ("101", "1 分"), ("110", "320 時間"), ("111", "止める")]
    for i, (a, b) in enumerate(u3):
        x = 40 + (i % 4) * 82
        y = y1 + 22 + (i // 4) * 22
        o.append(T(x, y, a, "start", 10.5, GLD, True, True))
        o.append(T(x + 30, y, b, "start", 10, INK))
    o.append(T(380, y1, "T3324 の単位（GPRS Timer 2）", "start", 10.5, INK, True))
    u2 = [("000", "2 秒"), ("001", "1 分"), ("010", "6 分"), ("111", "止める")]
    for i, (a, b) in enumerate(u2):
        x = 380 + (i % 2) * 120
        y = y1 + 22 + (i // 2) * 22
        o.append(T(x, y, a, "start", 10.5, GLD, True, True))
        o.append(T(x + 30, y, b, "start", 10, INK))
    o.append(T(16, y1 + 80, "網が認めた値は、AT+CEREG=4 を送っておくと、+CEREG の最後の 2 つの欄（T3324、T3412 の順）に同じ形で入る。", "start", 9.5, MUT))
    return SVG(700, y1 + 92, o, "PSM のタイマの書き方（3GPP TS 24.008 の形）。8 文字の上位 3 ビットが単位、下位 5 ビットが値（0〜31）で、タイマの長さは単位 × 値である。T3412 と T3324 では単位の表が違う。")
F["e21_timer"] = _f21_timer()

def _f21_cell_cur(Tr, mode, Is=5e-6, Qr=60e-3, Ta=20.0, Td=1.28, qp=0.3e-3, Ie=15e-6, Te=81.92, T3412=36000.0, Qt=30e-3):
    if mode == "psm":
        ntau = max(0, math.ceil(Tr / T3412 - 1e-9) - 1)
        q = Qr + Ta / Td * qp + ntau * (Qt + Ta / Td * qp)
        return Is + q / Tr
    if mode == "edrx":
        return Ie + Qr / Tr + qp / Te
    return Ie + Qr / Tr + qp / Td

def _f21_cell_current():
    o = []
    p = Plot(90, 24, 520, 230, (60, 86400), (1e-6, 2e-3), xlog=True, ylog=True)
    xl = {60: "1 分", 600: "10 分", 3600: "1 時間", 21600: "6 時間", 86400: "1 日"}
    o.append(p.axes(xl="報告の間隔", yl="平均電流", xt=[60, 600, 3600, 21600, 86400], yt=[1e-6, 1e-5, 1e-4, 1e-3],
                    xfmt=lambda v: xl[v], yfmt=lambda v: {1e-6: "1 µA", 1e-5: "10 µA", 1e-4: "100 µA", 1e-3: "1 mA"}[v]))
    xs = [60 * 10 ** (k / 40.0) for k in range(0, 129) if 60 * 10 ** (k / 40.0) <= 86400] + [86400]
    lines = [("psm", SIG, "PSM"), ("edrx", TEA, "eDRX 81.92 秒"), ("drx", ALI, "DRX 1.28 秒")]
    for mode, c, lab in lines:
        o.append(p.line([(t, _f21_cell_cur(t, mode)) for t in xs], c=c, lw=2.2))
    for sf, c in ((7, GRN), (12, GLD)):
        q = 40e-3 * _f21_toa(sf, 25) + 10e-3 * (_f21_rxwin(sf) + _f21_rxwin(12))
        o.append(p.line([(t, 2e-6 + q / t) for t in xs], c=c, lw=1.8, dash="6 4"))
    o.append(T(p.X(86400) + 6, p.Y(_f21_cell_cur(86400, "drx")) + 4, "DRX 1.28 秒", "start", 9.5, ALI, True))
    o.append(T(p.X(86400) + 6, p.Y(_f21_cell_cur(86400, "edrx")) + 4, "eDRX 81.92 秒", "start", 9.5, TEA, True))
    o.append(T(p.X(86400) + 6, p.Y(_f21_cell_cur(86400, "psm")) + 4, "PSM", "start", 9.5, SIG, True))
    q12 = 40e-3 * _f21_toa(12, 25) + 10e-3 * (_f21_rxwin(12) * 2)
    q7 = 40e-3 * _f21_toa(7, 25) + 10e-3 * (_f21_rxwin(7) + _f21_rxwin(12))
    o.append(T(p.X(86400) + 6, p.Y(2e-6 + q12 / 86400) + 4, "LoRaWAN SF12", "start", 9.5, GLD, True))
    o.append(T(p.X(86400) + 6, p.Y(2e-6 + q7 / 86400) + 12, "LoRaWAN SF7", "start", 9.5, GRN, True))
    o.append(D(p.X(3600), p.Y(_f21_cell_cur(3600, "psm")), SIG, 4))
    o.append(T(p.X(3600) - 6, p.Y(_f21_cell_cur(3600, "psm")) - 8, "23 µA", "end", 9.5, SIG, True, halo=True))
    return SVG(700, 300, o, "報告の間隔と平均電流（値はすべて代表値。両軸とも対数目盛）。セルラーは本文 6 節の例の値で、T3412 を 10 時間、TAU 1 回を 30 mC とした。破線はクラス A の LoRaWAN（5 節の例の値）。呼び出しを短い周期で聞き続けると、報告の間隔を延ばしても平均電流は下がらない。")
F["e21_cell_current"] = _f21_cell_current()

# ---- 7 節: どれを選ぶか ----
def _f21_choose():
    o = []
    def q(x, y, w, text, sub=None):
        o.append(BOX(x, y, w, 46, text, sub, PUR, PSOFT, INK, sz=10.5, ssz=9))
    def ans(x, y, w, text, c, sub=None):
        o.append(BOX(x, y, w, 44, text, sub, c, soft(c), c, sz=11, ssz=9))
    q(16, 16, 250, "数百バイトを超えるデータや、", "ファームウェアの更新を無線で送るか")
    ans(330, 17, 150, "LTE-M", SIG, "（22 章で転送時間を見積もる）")
    o.append(ARR(266, 39, 328, 39, c=INK, lw=1.4))
    o.append(T(297, 33, "はい", "middle", 9.5, INK, True))
    q(16, 96, 250, "機器は動くか")
    ans(330, 97, 150, "LTE-M", SIG, "ハンドオーバ")
    o.append(ARR(266, 119, 328, 119, c=INK, lw=1.4))
    o.append(T(297, 113, "はい", "middle", 9.5, INK, True))
    o.append(ARR(141, 62, 141, 94, c=INK, lw=1.4))
    o.append(T(148, 82, "いいえ", "start", 9.5, INK, True))
    q(16, 176, 250, "ゲートウェイを置けるか（または", "事業者の LoRaWAN の網があるか）")
    o.append(ARR(141, 142, 141, 174, c=INK, lw=1.4))
    o.append(T(148, 162, "いいえ", "start", 9.5, INK, True))
    ans(330, 177, 150, "LoRaWAN", GRN, "下りは次の上りまで待つ")
    o.append(ARR(266, 199, 328, 199, c=INK, lw=1.4))
    o.append(T(297, 193, "はい", "middle", 9.5, INK, True))
    ans(16, 258, 250, "NB-IoT・LTE-M", GLD, "携帯の網の範囲で。建物の奥なら NB-IoT")
    o.append(ARR(141, 222, 141, 256, c=INK, lw=1.4))
    o.append(T(148, 242, "いいえ", "start", 9.5, INK, True))
    notes = ["どの方式でも確かめること:",
             "・下りをどれだけ待てるか（5・6 節）",
             "・1 日のデータ量と送る回数（3・4 節）",
             "・電池の容量と平均電流（5・6 節）",
             "・網の範囲（電波の届き方は現地で測る）",
             "・費用（ゲートウェイか、回線の契約か）"]
    for i, l in enumerate(notes):
        o.append(T(496, 30 + i * 20, l, "start", 10, INK if i == 0 else MUT, i == 0))
    return SVG(700, 316, o, "方式を選ぶ流れの一例。大きなデータや移動があれば LTE-M、ゲートウェイを置ける止まった機器なら LoRaWAN、それ以外は携帯の網の範囲で NB-IoT か LTE-M を考える。実際には右の項目を数字にして比べる（24 章）。")
F["e21_choose"] = _f21_choose()
