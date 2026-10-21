# 17 章 メロディと和音 の図（figures.py の関数・定数をそのまま使う）

# ---------- 計算（w17.js と同じ式） ----------
def _f17_vl(sym, prev, lo=52, hi=67):
    """再生カードと同じ和音の配置（前の和音からなるべく動かない配置。widgets.js の voiceLead と同じ）"""
    c = chord_parse(sym)
    pcs = [(c["root_pc"] + v) % 12 for v in c["ivs"]]
    best, bc = None, 1e9
    for inv in range(len(pcs)):
        order = pcs[inv:] + pcs[:inv]
        for base in range(lo, hi + 1):
            if base % 12 != order[0]:
                continue
            v = [base]
            for i in range(1, len(order)):
                x = v[-1] + ((order[i] - v[-1]) % 12)
                if x == v[-1]:
                    x += 12
                v.append(x)
            if prev:
                cost = sum(min(abs(x - y) for y in prev) for x in v) + sum(min(abs(x - y) for x in v) for y in prev)
            else:
                cost = abs(base - (lo + hi) / 2.0) + (3 if inv else 0)
            if cost < bc:
                bc, best = cost, v
    return best

def _f17_prog(syms):
    out, prev = [], None
    for s in syms:
        prev = _f17_vl(s, prev)
        out.append(prev)
    return out

def _f17_added(chord, mel, tol=16.0, thr=0.015):
    """加わる粗さ。メロディの第 1〜8 倍音のうち和音の倍音と一致しないものと、和音の全倍音（メロディの第 8 倍音の高さまで）との粗さの和。
    返り値 (値, 一致 [(k,[(i,h)])], 新しい倍音 [k], ぶつかり [(k,i,h,r)], 和音の倍音 [(f,a,i,h)])"""
    fm0 = freq(mel)
    fmax = fm0 * 8 * 2 ** (16 / 1200.0)   # 第 8 倍音と一致するかを調べられる高さ（16 セント上）まで
    cp = []
    for i, m in enumerate(chord):
        f, h = freq(m), 1
        while f * h <= fmax:
            cp.append((f * h, 1.0 / h, i, h))
            h += 1
    R, co, cl, new = 0.0, [], [], []
    for k in range(1, 9):
        fk, ak = fm0 * k, 1.0 / k
        hit = [(i, h) for (fc, ac, i, h) in cp if abs(1200 * math.log2(fk / fc)) <= tol]
        if hit:
            co.append((k, hit))
            continue
        new.append(k)
        for (fc, ac, i, h) in cp:
            r = rough_pair(fk, ak, fc, ac)
            R += r
            if r >= thr:
                cl.append((k, i, h, r))
    return 100 * R / ROUGH_REF, co, new, cl, cp

def _f17_pcs(sym):
    c = chord_parse(sym)
    return set((c["root_pc"] + v) % 12 for v in c["ivs"])

def _f17_is_ct(note, sym):
    return parse(note)["midi"] % 12 in _f17_pcs(sym)

_F17_FN = {"C": "T", "Am": "T", "Em": "T", "F": "SD", "Dm": "SD", "G": "D", "G7": "D", "Bdim": "D"}
_F17_FC = {"T": BLU, "SD": GRN2, "D": SIG}
_F17_FS = {"T": BSOFT, "SD": GSOFT, "D": SSOFT}
_F17_NCOL = [BLU, PUR, GLD, MUT]


# ---------- 部品 ----------
def _f17_staff(x, y, beats_notes, chords, s=8, u=26, extra=None, labels=None, w_pad=14):
    """4/4 の 1 段。beats_notes = [(音名, 拍数, 色, タイ)]。chords = [(拍の位置, コードネーム)]。返り値 (svg, 幅, 各音の x)"""
    x0 = staff_start(s, 0, "4/4")
    G = 1.4 * s
    X = lambda b: x0 + u * b + int(b / 4 + 1e-9) * G
    items, xs, b = [], [], 0.0
    sym_at = dict(chords)
    for k, (nm, d, col, tie) in enumerate(beats_notes):
        dur = {4: "whole", 2: "half", 1: "quarter", 3: "half", 0.5: "eighth"}[d]
        it = dict(x=X(b), notes=[nm], dur=dur, dot=(d == 3), fill=col)
        if tie:
            it["tie"] = True
        if b in sym_at:
            it["sym"] = sym_at[b]
            it["symcol"] = INK
        if labels and labels[k]:
            it["label"] = labels[k][0]
            it["lcol"] = labels[k][1]
            it["lsz"] = 10
            it["label_dy"] = 2.4 * s
        items.append(it)
        xs.append(x + X(b))
        b += d
    nb = int(round(b / 4))
    for k in range(1, nb):
        items.append(dict(x=X(4 * k) - 0.7 * G, bar=True))
    items.append(dict(x=X(4 * nb) - 0.7 * G + 0.5 * s, bar="end"))
    wd = X(4 * nb) - 0.7 * G + 0.6 * s
    return STAFF(x, y, wd, s=s, clef="treble", items=items, time="4/4"), wd, xs

def _f17_comb(x, y, w, chord, mel, title, note=None, fmin=230.0, fmax=7400.0, lab_w=96):
    """上の段にメロディの音の第 1〜8 倍音、下の段に和音の音の倍音（同じ高さまで）を並べ、
    一致する倍音を緑の線、一致しない倍音と和音の倍音のぶつかりを赤い波線で結ぶ。"""
    o = []
    R, co, new, cl, cp = _f17_added(chord, mel)
    X = lambda f: x + lab_w + (w - lab_w - 6) * math.log(f / fmin) / math.log(fmax / fmin)
    ym, yc, hm = y + 76, y + 134, 30
    o.append(T(x, y + 14, title, "start", 12, INK, True))
    o.append(T(x + w, y + 14, "一致 %d 本 ・ 一致しない %d 本 ・ 加わる粗さ %.1f" % (len(co), len(new), R), "end", 11, ALI if R > 0.05 else GRN2, True))
    if note:
        o.append(T(x, y + 30, note, "start", 10.5, MUT))
    o.append(W(x + lab_w, ym, x + w - 4, ym, c=LIN, lw=1))
    o.append(W(x + lab_w, yc, x + w - 4, yc, c=LIN, lw=1))
    o.append(T(x + lab_w - 8, ym - 4, nname(mel), "end", 12, SIG, True))
    # 和音の名前（音ごとの色）
    nm_ch = [nname(m) for m in chord]
    xx = x + lab_w - 8
    for i in range(len(chord) - 1, -1, -1):
        o.append(T(xx, yc - 4, nm_ch[i], "end", 10.5, _F17_NCOL[i], True))
        xx -= 7.0 * len(nm_ch[i]) + 5
    top_c = {}
    for (fc, ac, i, h) in cp:
        if fc < fmin or fc > fmax:
            continue
        hh = max(2.5, hm * ac)
        px = X(fc) + (i - (len(chord) - 1) / 2.0) * 0.9
        o.append('<rect x="%.1f" y="%.1f" width="2.6" height="%.1f" fill="%s"/>' % (px - 1.3, yc - hh, hh, _F17_NCOL[i]))
        top_c[(i, h)] = (px, yc - hh)
    top_m = {}
    for k in range(1, 9):
        fk = freq(mel) * k
        hh = hm / k
        px = X(fk)
        o.append('<rect x="%.1f" y="%.1f" width="4" height="%.1f" rx="1" fill="%s"/>' % (px - 2, ym - hh, hh, SIG))
        o.append(T(px, ym - hh - 4, str(k), "middle", 9, MUT))
        top_m[k] = (px, ym)
    for (k, i, h, r) in cl:
        (x1, y1), (x2, y2) = top_m[k], top_c[(i, h)]
        op = min(1.0, 0.3 + r * 9)
        o.append('<path d="%s" fill="none" stroke="%s" stroke-width="1.5" stroke-opacity="%.2f"/>' % (_wave(x1, y1, x2, y2, 7.0, 2.0), ALI, op))
    for (k, hits) in co:
        (x1, y1) = top_m[k]
        i, h = hits[0]
        x2, y2 = top_c[(i, h)]
        o.append(W(x1, y1, x2, y2, c=GRN2, lw=2.2))
        o.append(CIRC(x2, y2, 2.6, GRN2, 1, GRN2))
    for m, lab in [(60, "C4"), (72, "C5"), (84, "C6"), (96, "C7"), (108, "C8")]:
        f = freq(m)
        if fmin <= f <= fmax:
            o.append(W(X(f), yc + 2, X(f), yc + 6, c=MUT, lw=1))
            o.append(T(X(f), yc + 17, lab, "middle", 9.5, MUT))
    return "".join(o), y + 156


# ---------- 1 節 ----------
# 1. 例の 4 小節（コードトーンと非和声音）
def _f17_example():
    o = []
    mel = [("E5", 1), ("D5", 1), ("C5", 2), ("F5", 1), ("E5", 1), ("F5", 2), ("D5", 1), ("C5", 1), ("B4", 2), ("C5", 4)]
    chs = ["C", "F", "G", "C"]
    notes, b = [], 0
    for nm, d in mel:
        ok = _f17_is_ct(nm, chs[int(b // 4)])
        notes.append((nm, d, GRN2 if ok else ALI, False))
        b += d
    svg, wd, xs = _f17_staff(20, 58, notes, [(0, "C"), (4, "F"), (8, "G"), (12, "C")], s=9, u=32)
    o.append(svg)
    tones = {"C": "C・E・G", "F": "F・A・C", "G": "G・B・D"}
    x0 = 20 + staff_start(9, 0, "4/4")
    for k, c in enumerate(chs):
        cx = x0 + 32 * (4 * k + 1.6) + k * 1.4 * 9
        o.append(T(cx, 130, "構成音 " + tones[c], "middle", 10.5, MUT))
    o.append(CIRC(30, 20, 6, GRN2, 1, GRN2))
    o.append(T(42, 24, "コードトーン（和音の構成音と同じ音名）", "start", 11, GRN2, True))
    o.append(CIRC(320, 20, 6, ALI, 1, ALI))
    o.append(T(332, 24, "非和声音（どの構成音とも音名が違う）", "start", 11, ALI, True))
    return SVG(680, 150, o, "1 節の例。各小節の和音（上のコードネーム）の構成音と同じ音名の音がコードトーン（緑）、そうでない音が非和声音（赤）である。"
               "非和声音は 1〜3 小節目の 2 拍目にあり、どれも前後の音と 2 度で隣り合う。")
F["e17_example"] = _f17_example()


# 2. 同じ D5 でも、和音によって役割が変わる
def _f17_depends():
    o = []
    for p, (sym, ch, ok, why) in enumerate([("C", [60, 64, 67], False, "D は C・E・G のどれとも音名が違う"),
                                             ("G", [59, 62, 67], True, "D は G・B・D の D と同じ音名")]):
        x = 16 + p * 348
        col = GRN2 if ok else ALI
        o.append(T(x, 22, "%s の和音（%s）の上の D5" % (sym, "・".join(nname(m) for m in ch)), "start", 12, INK, True))
        hl = {m: dict(c=BLU, label=nname(m, False)) for m in ch}
        hl[74] = dict(c=ALI if not ok else GRN2, label="D", strong=True)
        info = {}
        o.append(KEYBOARD(x, 34, 59, 83, ww=21, wh=82, hl=hl, names=None, info=info))
        if ok:
            xa, xb = info[62][0], info[74][0]
            o.append(PL([(xa, 126), ((xa + xb) / 2, 140), (xb, 126)], GRN2, 1.6))
            o.append(T((xa + xb) / 2, 153, "1 オクターブ", "middle", 10, GRN2, True))
        o.append(T(x, 176, why, "start", 11, INK))
        o.append(T(x, 196, "→ コードトーン" if ok else "→ 非和声音", "start", 12.5, col, True))
    return SVG(700, 206, o, "鍵盤の青が和音の音、赤・緑がメロディの D5。D5 は、C の和音の上では非和声音、G の和音の上では和音の D4 と同じ音名なのでコードトーンになる。")
F["e17_depends"] = _f17_depends()


# 3. 三和音の 3 つの区間と、非和声音から近い構成音までの半音の数
def _f17_gaps():
    o = []
    for p, (lo, tri, name, gaps) in enumerate([(60, [60, 64, 67, 72], "長三和音 C（C・E・G）", (4, 3, 5)),
                                               (57, [57, 60, 64, 69], "短三和音 Am（A・C・E）", (3, 4, 5))]):
        x = 16 + p * 352
        o.append(T(x, 20, name, "start", 12, INK, True))
        hl = {}
        for m in range(lo, lo + 13):
            if m in tri:
                hl[m] = dict(c=GRN2, label=nname(m, False), strong=True)
            else:
                d = min(min(abs(m - t) for t in tri), 9)
                hl[m] = dict(c=ALI, label=str(d))
        info = {}
        o.append(KEYBOARD(x, 70, lo, lo + 12, ww=36, wh=96, hl=hl, names=None, info=info))
        for k in range(3):
            xa, xb = info[tri[k]][0], info[tri[k + 1]][0]
            o.append(PL([(xa, 64), ((xa + xb) / 2, 42), (xb, 64)], GRN2, 1.6))
            o.append(T((xa + xb) / 2, 38, "半音 %d" % gaps[k], "middle", 10.5, GRN2, True))
        o.append(T(x, 188, "赤い鍵の数字: いちばん近い構成音までの半音の数（1 か 2）", "start", 10.5, ALI))
    return SVG(712, 198, o, "長三和音・短三和音は、1 オクターブを幅 3・4・5（半音の数）の 3 つの区間に分ける。区間の内側の音（非和声音）は、"
               "どれも近いほうの端（構成音）から半音 1 つか 2 つの所にある。")
F["e17_gaps"] = _f17_gaps()


# 4. コードトーン E5 と非和声音 D5 の倍音（加わる粗さ）
def _f17_comb1():
    o = []
    ch = [60, 64, 67]
    s1, y = _f17_comb(12, 6, 690, ch, 76, "C の和音 + E5（コードトーン）", "E5 の倍音は、どれも E4 の倍音（第 2・4・6・… 倍音）と一致する")
    o.append(s1)
    s2, y = _f17_comb(12, y + 14, 690, ch, 74, "C の和音 + D5（非和声音）", "基音 D5 が、C5（C4 の第 2 倍音）・E5（E4 の第 2 倍音）と全音の差でぶつかる")
    o.append(s2)
    return SVG(712, y + 4, o, "上の段がメロディの音の第 1〜8 倍音、下の段が和音の音の倍音（メロディの第 8 倍音の高さまで。棒の高さは振幅）。"
               "緑の線は周波数が一致する倍音、赤い波線は一致しない倍音と和音の倍音のぶつかり。加わる粗さは、赤い波線の組を含む、一致しない倍音の粗さの和である。")
F["e17_comb1"] = _f17_comb1()


# ---------- 2 節 ----------
_F17_SIX = [
    ("(a) 経過音", [("E5", 1), ("D5", 1), ("C5", 2), ("B4", 4)], 1, "2 度で入る（下へ）", "同じ向きに 2 度で出る"),
    ("(b) 刺繍音", [("E5", 1), ("D5", 1), ("E5", 2), ("D5", 4)], 1, "2 度で入る（下へ）", "反対向きに 2 度で戻る"),
    ("(c) 倚音", [("E5", 2), ("G4", 2), ("C5", 2), ("B4", 2)], 2, "跳躍で入る（4 度上へ）", "2 度で出る（下へ）"),
    ("(d) 掛留音", [("E5", 2), ("C5", 2, True), ("C5", 2), ("B4", 2)], 2, "同じ高さで続く（タイ）", "2 度で出る（下へ）"),
    ("(e) 先取音", [("E5", 2), ("C5", 1), ("B4", 1), ("B4", 4)], 2, "2 度で入る（下へ）", "同じ高さで次の和音へ"),
    ("(f) 逸音", [("C5", 2), ("E5", 1), ("F5", 1), ("D5", 4)], 2, "2 度で入る（上へ）", "反対向きに跳躍（3 度下へ）"),
]

def _f17_six():
    o = []
    for idx, (title, mel, nct, tin, tout) in enumerate(_F17_SIX):
        x = 10 + (idx % 2) * 352
        y = 8 + (idx // 2) * 136
        notes, b = [], 0
        for j, q in enumerate(mel):
            nm, d = q[0], q[1]
            tie = len(q) > 2 and q[2]
            ok = _f17_is_ct(nm, "C" if b < 4 else "G")
            notes.append((nm, d, GRN2 if ok else ALI, tie))
            b += d
        labels = [None] * len(mel)
        labels[nct] = (title.split()[1], ALI)
        o.append(T(x, y + 14, title, "start", 12.5, ALI, True))
        svg, wd, xs = _f17_staff(x, y + 40, notes, [(0, "C"), (4, "G")], s=8, u=27, labels=labels)
        o.append(svg)
        o.append(T(x + 4, y + 112, "入り方: " + tin, "start", 10, MUT))
        o.append(T(x + 4, y + 126, "出方: " + tout, "start", 10, MUT))
    return SVG(712, 8 + 3 * 136 + 2, o, "6 種類の非和声音（赤）。どれも C の和音 1 小節から G の和音 1 小節へ進み、非和声音は 1 つずつである。"
               "下の 2 行は、非和声音への入り方（前の音から）と出方（次の音へ）。")
F["e17_six"] = _f17_six()


# 2. 入り方と出方の表
def _f17_table():
    o = []
    x0, y0 = 150, 46
    cols = ["同じ向きに 2 度", "反対向きに 2 度", "反対向きに跳躍", "同じ高さのまま\n次の和音へ"]
    rows = ["2 度で入る", "跳躍で入る", "前の和音から\n同じ高さで続く"]
    cw, rh = 138, 62
    o.append(T(x0 + 2 * cw, 16, "出方（次の音へ）", "middle", 11.5, INK, True))
    o.append(T(20, y0 + 1.5 * rh + 4, "入り方", "start", 11.5, INK, True))
    o.append(T(20, y0 + 1.5 * rh + 20, "（前の音から）", "start", 10, MUT))
    for j, c in enumerate(cols):
        for k, line in enumerate(c.split("\n")):
            o.append(T(x0 + j * cw + cw / 2, y0 - 12 - (len(c.split("\n")) - 1 - k) * 13, line, "middle", 10.5, MUT, True))
    for i, r in enumerate(rows):
        lines = r.split("\n")
        for k, line in enumerate(lines):
            o.append(T(x0 - 8, y0 + i * rh + rh / 2 + 4 - (len(lines) - 1) * 7 + k * 14, line, "end", 10.5, MUT, True))
        for j in range(4):
            o.append(RECT(x0 + j * cw + 2, y0 + i * rh + 2, cw - 4, rh - 4, 6, PAN, LIN, 1))
    def cell(i, j, span, name, sub):
        xx = x0 + j * cw + 4
        o.append(RECT(xx - 3, y0 + i * rh + 1, span * cw - 2, rh - 2, 6, SCR, SCR, 0))
        o.append(RECT(xx, y0 + i * rh + 4, span * cw - 8, rh - 8, 6, PAN, ALI, 0))
        o.append(RECT(xx, y0 + i * rh + 4, span * cw - 8, rh - 8, 6, ASOFT, ALI, 1.4))
        o.append(T(xx + (span * cw - 8) / 2, y0 + i * rh + rh / 2 + (0 if sub else 4), name, "middle", 13, ALI, True))
        if sub:
            o.append(T(xx + (span * cw - 8) / 2, y0 + i * rh + rh / 2 + 16, sub, "middle", 9.5, MUT))
    cell(0, 0, 1, "経過音", "")
    cell(0, 1, 1, "刺繍音", "")
    cell(0, 2, 1, "逸音", "")
    cell(0, 3, 1, "先取音", "入り方は 2 度が多い")
    cell(1, 0, 2, "倚音", "")
    cell(2, 0, 2, "掛留音", "下へ出ることが多い")
    for (i, j) in [(1, 2), (1, 3), (2, 2), (2, 3)]:
        o.append(T(x0 + j * cw + cw / 2, y0 + i * rh + rh / 2 + 4, "—", "middle", 12, MUT))
    return SVG(712, y0 + 3 * rh + 12, o, "非和声音の種類を、前の音からの入り方（行）と次の音への出方（列）で並べた表。"
               "経過音・刺繍音・倚音・逸音は 2 度か跳躍で入り、掛留音は前の和音から同じ高さで続き、先取音は同じ高さのまま次の和音へ入る。")
F["e17_table"] = _f17_table()


# ---------- 3 節 ----------
def _f17_blocks(x, y, mel, chords, u=72, h=24, nct_col=ALI, show_beats=True, rough=None, show_chords=True):
    """ピアノロール風の 1 段: 拍の格子・強拍の印・コードネーム・音の帯（緑 = コードトーン、赤 = 非和声音）"""
    o = []
    strength = ["強", "弱", "中強", "弱"]
    for bt in range(8):
        bx = x + bt * u
        st = bt % 4
        fill = SSOFT if st == 0 else (GOSOFT if st == 2 else PAN)
        o.append(RECT(bx, y, u, h, 0, fill, LIN, 0.8))
        if st in (0, 2):
            o.append(RECT(bx + 2, y + h + 2, u - 4, 3, 1, SIG if st == 0 else GLD, SIG if st == 0 else GLD, 0))
        if show_beats:
            cc = SIG if st == 0 else (GLD if st == 2 else MUT)
            o.append(T(bx + u / 2, y - 19, "%d 拍目" % (st + 1), "middle", 10, cc, st in (0, 2)))
            o.append(T(bx + u / 2, y - 6, strength[st], "middle", 10, cc, st in (0, 2)))
    for k, (b, sym) in enumerate(chords):
        if show_chords:
            o.append(T(x + b * u + 4, y - (33 if show_beats else 6), sym + " の和音", "start", 10.5, INK, True))
    o.append(W(x + 4 * u, y - 4, x + 4 * u, y + h + 4, c=INK, lw=1.6))
    b, prev = 0, None
    for q in mel:
        nm, d = q[0], q[1]
        tied = prev is not None and len(prev) > 2 and prev[2]
        sym = [c for (bb, c) in chords if bb <= b][-1]
        ok = _f17_is_ct(nm, sym)
        col, fl = (GRN2, GSOFT) if ok else (nct_col, ASOFT)
        o.append(RECT(x + b * u + 3, y + 3, d * u - 6, h - 6, 4, PAN, col, 0))
        o.append(RECT(x + b * u + 3, y + 3, d * u - 6, h - 6, 4, fl, col, 1.4))
        o.append(T(x + b * u + d * u / 2, y + h / 2 + 4, nname(nm) + ("（タイ）" if tied else ""), "middle", 10.5, col, True))
        if rough is not None:
            ch = rough[sym]
            R = _f17_added(ch, parse(nm)["midi"])[0]
            bh = max(R * 0.42, 1.5)
            o.append(RECT(x + b * u + 6, y + h + 64 - bh, d * u - 12, bh, 2, ASOFT if R > 0.05 else GSOFT, ALI if R > 0.05 else GRN2, 1.2))
            o.append(T(x + b * u + d * u / 2, y + h + 60 - bh, "%.1f" % R, "middle", 10, ALI if R > 0.05 else GRN2, True))
        b += d
        prev = q
    if rough is not None:
        o.append(W(x, y + h + 64, x + 8 * u, y + h + 64, c=MUT, lw=1))
    return "".join(o)

def _f17_beatmap():
    o = []
    u, x0 = 66, 132
    for idx, (title, mel, nct, tin, tout) in enumerate(_F17_SIX):
        y = 66 + idx * 40
        o.append(T(x0 - 10, y + 16, title, "end", 11.5, ALI, True))
        o.append(_f17_blocks(x0, y, mel, [(0, "C"), (4, "G")], u=u, h=26, show_beats=(idx == 0), show_chords=(idx == 0)))
    o.append(T(x0 + 4 * u, 310, "↑ 和音が変わる強拍", "middle", 10.5, INK, True))
    return SVG(712, 318, o, "2 節の 6 つの例の、拍ごとの音（緑 = コードトーン、赤 = 非和声音）。帯の下のピンクの印が強拍（1 拍目）、金色の印が中強拍（3 拍目）。"
               "倚音と掛留音は和音が変わる強拍に置かれて 2 拍続き、ほかの 4 つは弱拍に 1 拍だけ置かれている。")
F["e17_beatmap"] = _f17_beatmap()

def _f17_timeline():
    o = []
    u, x0 = 66, 132
    rows = [("(A) 弱拍の経過音", [("D5", 2), ("B4", 2), ("E5", 1), ("D5", 1), ("C5", 2)], [(0, "G"), (4, "C")]),
            ("(B) 強拍の倚音", [("D5", 2), ("B4", 2), ("D5", 1), ("E5", 1), ("C5", 2)], [(0, "G"), (4, "C")]),
            ("(C) 強拍の掛留音", [("E5", 2), ("C5", 2, True), ("C5", 2), ("B4", 2)], [(0, "C"), (4, "G")])]
    vo = {"G": _f17_vl("G", None), "C": None}
    vo["C"] = _f17_vl("C", vo["G"])
    for idx, (title, mel, chs) in enumerate(rows):
        y = 54 + idx * 118
        o.append(T(x0 - 10, y + 16, title, "end", 11.5, INK, True))
        o.append(T(x0 - 10, y + 84, "加わる粗さ", "end", 10, MUT))
        o.append(_f17_blocks(x0, y, mel, chs, u=u, h=26, show_beats=(idx == 0), rough=vo))
    return SVG(712, 54 + 3 * 118 - 22, o, "各拍で鳴っているメロディの音の加わる粗さ（下の棒）。(A) と (B) は同じ D5（71.9）を、弱拍と強拍に置いたもの。"
               "(C) の掛留音 C5（102.5）は、前の和音で溶け合っていた音が残り、和音が G に変わる強拍からぶつかり始める。和音の配置は C4・E4・G4 と B3・D4・G4。")
F["e17_timeline"] = _f17_timeline()


# ---------- 4 節 ----------
def _f17_proc():
    o = []
    steps = [("① 拍子とフレーズの区切りを確かめる", "16 章 3 節・10 章 4 節"),
             ("② 強拍（1 拍目・3 拍目）の音を書き出す", "強拍の非和声音は目立つ（3 節）"),
             ("③ その音をコードトーンに持つ和音を候補に挙げる", "ダイアトニックコード（09 章 1 節）"),
             ("④ 機能の流れに合う候補を選ぶ", "T → SD → D → T（10 章 5 節）"),
             ("⑤ フレーズの終わりを終止の形にする", "全終止・半終止など（10 章 4 節）"),
             ("⑥ 弱拍の非和声音の種類を確かめる", "2 節の 6 種類のどれかか")]
    y = 12
    for k, (a, b) in enumerate(steps):
        o.append(RECT(20, y, 390, 40, 8, PAN if k != 1 else SSOFT, LIN if k != 1 else SIG, 1.3))
        o.append(T(36, y + 25, a, "start", 12, INK, True))
        o.append(T(430, y + 25, b, "start", 11, MUT))
        if k < len(steps) - 1:
            o.append(ARR(215, y + 40, 215, y + 54, MUT, 1.5))
        y += 56
    return SVG(680, y - 4, o, "和音付けの手順。① で区切りを決め、②・③ で強拍の音を含む和音を候補にし、④・⑤ で機能と終止から選び、⑥ で残った非和声音を確かめる。")
F["e17_proc"] = _f17_proc()

_F17_TW = ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4", "C4",
           "G4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "G4", "G4", "F4", "F4", "E4", "E4", "D4", "D4"]
_F17_TW_CH = ["C", "C", "F", "C", "F", "C", "G", "C", "C", "F", "C", "G", "C", "F", "C", "G"]

def _f17_cand():
    o = []
    tri = ["C", "Dm", "Em", "F", "G", "Am", "Bdim"]
    cw = 76
    for blk in range(2):
        x0, y0 = 84, 34 + blk * 196
        o.append(T(20, y0 + 6, "第 %d〜%d 小節" % (1 + 4 * blk, 4 + 4 * blk), "start", 11.5, INK, True))
        for j in range(8):
            hb = blk * 8 + j
            x = x0 + j * cw
            if j % 2 == 0:
                o.append(T(x + cw, y0 + 6, "第 %d 小節" % (hb // 2 + 1), "middle", 10.5, MUT, True))
                o.append(W(x, y0 + 14, x, y0 + 176, c=LIN, lw=1))
            note = _F17_TW[hb * 2]
            o.append(T(x + cw / 2, y0 + 30, "%d 拍目 %s" % (1 if j % 2 == 0 else 3, nname(note, False)), "middle", 10.5, INK, True))
            cands = [c for c in tri if _f17_is_ct(note, c)]
            ch = _F17_TW_CH[hb]
            for k, c in enumerate(cands):
                fn = _F17_FN[c]
                yy = y0 + 40 + k * 30
                sel = (c == ch)
                o.append(RECT(x + 8, yy, cw - 16, 24, 6, _F17_FS[fn] if sel else PAN, _F17_FC[fn], 2.2 if sel else 1))
                o.append(T(x + cw / 2, yy + 16, "%s（%s）" % (c, fn), "middle", 10.5, _F17_FC[fn], sel))
        o.append(W(x0 + 8 * cw, y0 + 14, x0 + 8 * cw, y0 + 176, c=LIN, lw=1))
        o.append(T(20, y0 + 56, "候補", "start", 10.5, MUT, True))
        lab = "第 4 小節 G → C: 全終止（V → I）" if blk == 0 else "第 8 小節 C → G: 半終止（I → V）"
        o.append(T(x0 + 8 * cw, y0 + 150, lab, "end", 11, SIG, True))
    leg = [("T", "トニック"), ("SD", "サブドミナント"), ("D", "ドミナント")]
    for k, (fn, nm) in enumerate(leg):
        o.append(RECT(100 + k * 150, 4, 14, 14, 3, _F17_FS[fn], _F17_FC[fn], 1.4))
        o.append(T(120 + k * 150, 15, "%s（%s）" % (nm, fn), "start", 10.5, _F17_FC[fn], True))
    o.append(T(692, 15, "太枠: 選んだ和音", "end", 10.5, INK, True))
    return SVG(712, 34 + 2 * 196 - 10, o, "きらきら星の第 1〜8 小節。2 拍ごとに、1 拍目・3 拍目の音を含むハ長調のダイアトニックコードを 3 つずつ並べ（色は機能）、"
               "機能の流れと終止から 1 つを選んだ（太枠）。")
F["e17_cand"] = _f17_cand()

def _f17_badgood():
    o = []
    rows = [("手順どおり", ["C", "C", "F", "C", "F", "C", "G", "C"], "全終止（G → C）", GRN2),
            ("強拍の音を含まない", ["C", "C", "F", "C", "C", "C", "G", "C"], "第 3 小節の強拍の F が非和声音", ALI),
            ("機能と終止を外す", ["C", "C", "F", "C", "F", "C", "G", "F"], "D → SD、終止にならない", ALI)]
    u, x0 = 33, 132
    for r, (title, chs, res, col) in enumerate(rows):
        y = 26 + r * 92
        o.append(T(x0 - 10, y + 22, title, "end", 11.5, col, True))
        o.append(T(x0 - 10, y + 38, "（良い例）" if r == 0 else "（悪い例）", "end", 10, col))
        for j in range(8):
            c = chs[j]
            fn = _F17_FN[c]
            bad = (r == 2 and j == 7)
            o.append(RECT(x0 + j * 2 * u + 2, y, 2 * u - 4, 22, 5, _F17_FS[fn], ALI if bad else _F17_FC[fn], 2.2 if bad else 1.2))
            o.append(T(x0 + j * 2 * u + u, y + 15, "%s %s" % (c, fn), "middle", 10, _F17_FC[fn], True))
        for k in range(16):
            nm = _F17_TW[k]
            c = chs[k // 2]
            ok = _f17_is_ct(nm, c)
            strong = (k % 2 == 0)
            o.append(T(x0 + k * u + u / 2, y + 44, nname(nm, False), "middle", 12, GRN2 if ok else ALI, True))
            if strong:
                o.append(W(x0 + k * u + 6, y + 50, x0 + k * u + u - 6, y + 50, c=SIG, lw=1.2))
        for bl in range(1, 4):
            o.append(W(x0 + bl * 4 * u, y - 4, x0 + bl * 4 * u, y + 54, c=MUT, lw=1))
        o.append(T(x0 + 16 * u, y + 72, res, "end", 11, col, True))
    o.append(T(x0, 300, "下線: 強拍（1・3 拍目）の音。音名の色: 緑 = コードトーン、赤 = 非和声音", "start", 10, MUT))
    return SVG(712, 308, o, "きらきら星の第 1〜4 小節の 3 つの和音付け。中段は第 3 小節を C だけにしたため、強拍の F が非和声音になる。"
               "下段は最後を F にしたため、G → F（D → SD）と動き、SD で終わって終止にならない。")
F["e17_badgood"] = _f17_badgood()


# ---------- 5 節 ----------
def _f17_bars():
    o = []
    data = [("CM7（C4・E4・G4・B4）", "CM7", {0: "1", 2: "9", 4: "3", 5: "11", 7: "5", 9: "13", 11: "7"}, {5}),
            ("G7（B3・D4・F4・G4）", "G7", {7: "1", 9: "9", 11: "3", 0: "11", 2: "5", 4: "13", 5: "7"}, {0})]
    for p, (title, sym, deg, avoid) in enumerate(data):
        x0, yb = 40 + p * 350, 206
        ch = _f17_vl(sym, None)
        pcs = _f17_pcs(sym)
        o.append(T(x0 - 20, 20, title, "start", 12, INK, True))
        o.append(W(x0 - 8, yb, x0 + 300, yb, c=MUT, lw=1))
        for k, pc in enumerate([0, 2, 4, 5, 7, 9, 11]):
            m = 72 + pc
            R = _f17_added(ch, m)[0]
            if pc in pcs:
                col, fl, cat = GRN2, GSOFT, "構成音"
            elif pc in avoid:
                col, fl, cat = ALI, ASOFT, "アボイド"
            else:
                col, fl, cat = BLU, BSOFT, "テンション"
            bx = x0 + k * 42
            bh = R * 1.15
            o.append(RECT(bx, yb - max(bh, 1.5), 30, max(bh, 1.5), 3, fl, col, 1.3))
            o.append(T(bx + 15, yb - bh - 6, "%.1f" % R, "middle", 10.5, col, True))
            o.append(T(bx + 15, yb + 16, nname(m), "middle", 11, INK, True))
            o.append(T(bx + 15, yb + 31, deg[pc] + " 度", "middle", 10, col, True))
    for k, (nm, c, fl) in enumerate([("構成音", GRN2, GSOFT), ("使えるテンション", BLU, BSOFT), ("アボイドノート", ALI, ASOFT)]):
        o.append(RECT(40 + k * 170, 262, 14, 14, 3, fl, c, 1.3))
        o.append(T(60 + k * 170, 274, nm, "start", 11, c, True))
    o.append(T(20, 298, "棒の高さ: 加わる粗さ（C4–C♯4 = 100）。棒の下の度数は、和音の根音から数えた度数。", "start", 10.5, MUT))
    return SVG(712, 308, o, "CM7 と G7 の上に、ハ長調の 7 つの音を C5〜B5 の高さで重ねたときの加わる粗さ。色は、構成音（緑）、使えるテンション（青）、"
               "アボイドノート（赤）の区別（11 章 4 節の表）。")
F["e17_bars"] = _f17_bars()

def _f17_why():
    o = []
    cm7 = _f17_vl("CM7", None)
    g7 = _f17_vl("G7", None)
    panels = [(cm7, 77, "(a) CM7 + F5（アボイドノート）", "F5 が E5（E4 の第 2 倍音）の半音上: 差 39.2 Hz、この 1 組の粗さ 18.4"),
              (cm7, 74, "(b) CM7 + D5（テンション）", "D5 が C5・E5（C4・E4 の第 2 倍音）と全音の差: 64.1 Hz・71.9 Hz、粗さ 11.9・10.8"),
              (g7, 76, "(c) G7 + E5（テンション）", "E5 が F5（F4 の第 2 倍音）の半音下: 差 39.2 Hz、この 1 組の粗さ 18.4"),
              (g7, 81, "(d) G7 + A5（テンション）", "A5 は D4 のほぼ 3 倍（2 セント差）: 倍音がすべて D4 の倍音と一致する")]
    y = 4
    for ch, m, title, note in panels:
        s, y = _f17_comb(12, y, 690, ch, m, title, note)
        o.append(s)
        y += 10
    return SVG(712, y - 6, o, "4 つの音の倍音と、和音の倍音の重なり（図の見方は 1 節と同じ）。半音で隣り合う組（a・c）は 1 組で約 18、全音の組（b）は約 11 の粗さになる。"
               "(d) の A5 は、8 つの倍音がすべて D4 の倍音と一致するので、加わる粗さは 0 である。")
F["e17_why"] = _f17_why()
