# 12 章 コード進行と声部の動き の図（figures.py の関数・定数をそのまま使う）

import re as _f12_re

_f12_FC = {"T": BLU, "SD": GRN2, "D": SIG}          # 機能の色
_f12_FS = {"T": BSOFT, "SD": GSOFT, "D": SSOFT}
_f12_VC = {"S": INK, "A": BLU, "T": GRN2, "B": GLD}  # 声部の色（再生カードの v1〜v4 と同じ）
_f12_VJ = {"S": "ソプラノ", "A": "アルト", "T": "テノール", "B": "バス"}
_f12_ROOT = {"I": "C", "II": "D", "III": "E", "IV": "F", "V": "G", "VI": "A", "VII": "B"}


def _f12_deg(deg):
    return _f12_re.match(r"^(VII|VI|V|IV|III|II|I)", deg).group(1)


def _f12_fn(deg):
    """ディグリーネームの機能（T / SD / D）"""
    return {"I": "T", "VI": "T", "III": "T", "IV": "SD", "II": "SD", "V": "D", "VII": "D"}[_f12_deg(deg)]


def _f12_name(deg):
    """ハ長調でのコードネーム（VIm7 → Am7）"""
    r = _f12_deg(deg)
    return _f12_ROOT[r] + deg[len(r):]


def _f12_ln(x1, y1, x2, y2, c, lw=1.4, dash=None, op=1.0):
    da = ' stroke-dasharray="%s"' % dash if dash else ""
    return ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%g" stroke-linecap="round"'
            ' stroke-opacity="%g"%s/>' % (x1, y1, x2, y2, c, lw, op, da))


def _f12_arc(x1, y1, x2, y2, h, c, lw=1.6):
    """(x1,y1) から (x2,y2) への弓なりの矢印。h > 0 で上にふくらむ"""
    cx, cy = (x1 + x2) / 2, min(y1, y2) - h if h > 0 else max(y1, y2) - h
    a = math.atan2(y2 - cy, x2 - cx)
    hd = 7
    hx, hy = x2 - hd * math.cos(a), y2 - hd * math.sin(a)
    p = "%g,%g %g,%g %g,%g" % (x2, y2, hx - hd * 0.45 * math.sin(a), hy + hd * 0.45 * math.cos(a),
                               hx + hd * 0.45 * math.sin(a), hy - hd * 0.45 * math.cos(a))
    return ('<path d="M%g,%g Q%g,%g %g,%g" fill="none" stroke="%s" stroke-width="%g"/>' % (x1, y1, cx, cy, hx, hy, c, lw)
            + '<polygon points="%s" fill="%s"/>' % (p, c))


def _f12_tag(cx, cy, f, w=44, h=22, sz=11.5):
    """機能のタグ（T / SD / D）"""
    return RECT(cx - w / 2, cy - h / 2, w, h, 6, _f12_FS[f], _f12_FC[f], 1.4) + T(cx, cy + 4.2, f, "middle", sz, _f12_FC[f], True)


# ---------- 4 声部の大譜表（全音符、声部ごとの色、声部をつなぐ線） ----------
def _f12_grand(x, ytop, cols, s=9, x0=None, dx=70, w=None, lines=True, held=False, colored=True, lw=1.5):
    """cols: [[バス, テノール, アルト, ソプラノ], ...]。
    返り値 (svg, pos)。pos[(列, "S")] = 符頭の中心 (x, y)。ソプラノ・アルトは上の段、テノール・バスは下の段に書く。"""
    x0 = x0 if x0 is not None else staff_start(s) + 1.1 * s
    items = []
    for ci, (b, t, a, so) in enumerate(cols):
        cx = x0 + ci * dx
        vc = _f12_VC if colored else {k: INK for k in _f12_VC}
        items.append(dict(x=cx, notes=[a, so], staff="treble", fills={nname(a): vc["A"], nname(so): vc["S"]}, key=(ci, "tr")))
        items.append(dict(x=cx, notes=[b, t], staff="bass", fills={nname(b): vc["B"], nname(t): vc["T"]}, key=(ci, "bs")))
    info = {}
    W = w if w is not None else x0 + (len(cols) - 1) * dx + 3.2 * s
    o = [STAFF(x, ytop, W, s, "grand", items, info=info)]
    pos = {}
    for ci in range(len(cols)):
        tr, bs = info[(ci, "tr")], info[(ci, "bs")]
        pos[(ci, "A")], pos[(ci, "S")] = tr[0], tr[-1]
        pos[(ci, "B")], pos[(ci, "T")] = bs[0], bs[-1]
    hw = 0.78 * s
    if lines:
        for ci in range(len(cols) - 1):
            for k, v in enumerate("BTAS"):
                (x1, y1), (x2, y2) = pos[(ci, v)], pos[(ci + 1, v)]
                same = cols[ci][k] == cols[ci + 1][k]
                if held and same:
                    o.append(_f12_ln(x1 + hw + 2, y1, x2 - hw - 2, y2, SIG, 3.2))
                else:
                    o.append(_f12_ln(x1 + hw + 2, y1, x2 - hw - 2, y2, _f12_VC[v] if colored else MUT, lw, None, 0.75))
    return "".join(o), pos


def _f12_ypos(ytop, s, n, staff):
    """大譜表で音 n を staff（"treble" / "bass"）に書いたときの y"""
    d = parse(n)["dia"]
    if staff == "treble":
        return ytop + 4 * s - (d - 30) * s / 2
    return ytop + 12 * s - (d - 18) * s / 2


def _f12_semis(a, b):
    return parse(b)["midi"] - parse(a)["midi"]


def _f12_upper_total(c1, c2):
    return sum(abs(_f12_semis(c1[k], c2[k])) for k in (1, 2, 3))


def _f12_parallels(c1, c2):
    """連続 5 度・連続 8 度の組: [(種類, 声部 p, 声部 q)]。2 つの声部がどちらも動くときだけ数える"""
    out = []
    m1 = [parse(n)["midi"] for n in c1]; m2 = [parse(n)["midi"] for n in c2]
    for p in range(4):
        for q in range(p + 1, 4):
            if m1[p] == m2[p] or m1[q] == m2[q]:
                continue
            i1, i2 = (m1[q] - m1[p]) % 12, (m2[q] - m2[p]) % 12
            if i1 == 7 and i2 == 7:
                out.append(("5", "BTAS"[p], "BTAS"[q]))
            if i1 == 0 and i2 == 0:
                out.append(("8", "BTAS"[p], "BTAS"[q]))
    return out


# ============ 1 節 ============
# 進行を機能で読む手順（Am–F–G–C）
def _f12_read():
    o = []
    degs = ["VIm", "IV", "V", "I"]
    X = [200 + i * 104 for i in range(4)]
    rows = [(34, "① コードネーム"), (112, "② ディグリーネーム"), (190, "③ 機能")]
    for y, lab in rows:
        o.append(T(16, y + 5, lab, "start", 12, INK, True))
    for i, d in enumerate(degs):
        o.append(RECT(X[i] - 36, 34 - 16, 72, 30, 7, PAN, LIN, 1.3))
        o.append(T(X[i], 34 + 5, _f12_name(d), "middle", 14, INK, True))
        o.append(RECT(X[i] - 36, 112 - 16, 72, 30, 7, PAN, LIN, 1.3))
        o.append(T(X[i], 112 + 5, d, "middle", 14, INK, True))
        o.append(_f12_tag(X[i], 190, _f12_fn(d), 56, 28, 13))
        o.append(ARR(X[i], 52, X[i], 92, MUT, 1.3))
        o.append(ARR(X[i], 130, X[i], 172, MUT, 1.3))
    o.append(T(16, 70, "主音 C から文字を数える", "start", 10.5, MUT))
    o.append(T(16, 84, "（09 章 3 節）", "start", 10.5, MUT))
    o.append(T(16, 148, "T: I・VIm・IIIm ／ SD: IV・IIm", "start", 10.5, MUT))
    o.append(T(16, 162, "D: V・VIIdim（10 章 2 節）", "start", 10.5, MUT))
    for i in range(3):
        o.append(ARR(X[i] + 30, 190, X[i + 1] - 30, 190, INK, 1.4))
    o.append(T(200 - 36, 232, "T → SD、SD → D、D → T。どれも使える動き（10 章 5 節）に入っている", "start", 11, INK))
    return SVG(600, 246, o, "ハ長調の Am–F–G–C を、3 段の手順で読む。①のコードネームを②のディグリーネームに直し、③の機能を決める。"
               "最後に、隣り合う機能の動きが使える動きに入っているかを確かめる。")
F["e12_read"] = _f12_read()


# 4 つの定番進行を機能の色で並べる
def _f12_famous():
    o = []
    rows = [("小室進行", ["VIm", "IV", "V", "I"]),
            ("ツーファイブワン", ["IIm7", "V7", "IM7"]),
            ("王道進行", ["IVM7", "V7", "IIIm7", "VIm"]),
            ("カノン進行", ["I", "V", "VIm", "IIIm", "IV", "I", "IV", "V"])]
    y = 14
    bw, step, bh = 70, 77, 58
    for title, degs in rows:
        o.append(T(16, y + 13, title, "start", 12.5, INK, True))
        y += 22
        for i, d in enumerate(degs):
            f = _f12_fn(d)
            x = 16 + i * step
            o.append(RECT(x, y, bw, bh, 7, _f12_FS[f], _f12_FC[f], 1.4))
            o.append(T(x + bw / 2, y + 19, _f12_name(d), "middle", 13.5, INK, True))
            o.append(T(x + bw / 2, y + 35, d, "middle", 11.5, INK))
            o.append(T(x + bw / 2, y + 51, f, "middle", 11, _f12_FC[f], True))
        y += bh + 14
    lx = 16
    for f, nm in [("T", "T（トニック）"), ("SD", "SD（サブドミナント）"), ("D", "D（ドミナント）")]:
        o.append(RECT(lx, y + 2, 14, 14, 3, _f12_FS[f], _f12_FC[f], 1.3))
        o.append(T(lx + 20, y + 14, nm, "start", 11, _f12_FC[f], True))
        lx += 170
    o.append(T(632, y + 14, "箱の中: コードネーム（ハ長調）・ディグリーネーム・機能", "end", 10.5, MUT))
    return SVG(646, y + 24, o, "4 つの定番進行を、機能の色で並べた。セブンスコードは、7 度の音を除いた三和音と同じ機能として読む。"
               "どの進行でも、D の次には T が来ている。")
F["e12_famous"] = _f12_famous()


# ============ 2 節 ============
# 根音の動き: 4 度上と 5 度下は同じ動き
def _f12_rootkinds():
    o = []
    ns = ["F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4"]
    X = [70 + i * 64 for i in range(len(ns))]
    y = 112
    for i, n in enumerate(ns):
        col, fl, lw = LIN, PAN, 1.3
        if n == "C4":
            col, fl, lw = SIG, SSOFT, 2
        if n[0] == "F":
            col, fl, lw = BLU, BSOFT, 2
        o.append(CIRC(X[i], y, 17, col, lw, fl))
        o.append(T(X[i], y + 5, nname(n), "middle", 13, INK, True))
    # 上向き 4 度: C4 → F4
    o.append(_f12_arc(X[4], y - 19, X[7], y - 19, 34, BLU, 1.8))
    o.append(T((X[4] + X[7]) / 2, y - 62, "4 度上（C・D・E・F の 4 つ）", "middle", 12, BLU, True))
    # 下向き 5 度: C4 → F3
    o.append(_f12_arc(X[4], y + 19, X[0], y + 19, -40, BLU, 1.8))
    o.append(T((X[0] + X[4]) / 2, y + 80, "5 度下（C・B・A・G・F の 5 つ）", "middle", 12, BLU, True))
    o.append(T(X[7] + 10, y + 52, "どちらへ進んでも", "middle", 10.5, MUT))
    o.append(T(X[7] + 10, y + 66, "次は F の和音", "middle", 10.5, MUT))
    # 対応表
    y2 = 222
    pairs = [("2 度上", "7 度下"), ("3 度上", "6 度下"), ("4 度上", "5 度下")]
    for i, (a, b) in enumerate(pairs):
        x = 40 + i * 190
        o.append(RECT(x, y2, 170, 34, 8, PAN, LIN, 1.3))
        o.append(T(x + 85, y2 + 22, "%s ＝ %s" % (a, b), "middle", 12.5, INK, True))
    o.append(T(320, y2 + 56, "上向きの度数と下向きの度数の和は 9（03 章 5 節の転回）。下向きの場合も同じに対応する", "middle", 10.5, MUT))
    return SVG(640, y2 + 66, o, "根音が C から F へ進むとき、上の F（4 度上）へ進んでも下の F（5 度下）へ進んでも、次の和音は同じ F の和音である。"
               "上向きと下向きの度数は転回の関係にあるので、和は 9 になる。")
F["e12_rootkinds"] = _f12_rootkinds()


# 根音の動きと共通音の数（I から見た 6 つの和音）
def _f12_common():
    o = []
    L = list("CDEFGAB")
    rows = [("I", "C", "基準", None), ("IIIm", "Em", "3 度上", 2), ("VIm", "Am", "3 度下", 2),
            ("IV", "F", "4 度上", 1), ("V", "G", "4 度下（5 度上）", 1), ("IIm", "Dm", "2 度上", 0), ("VIIdim", "Bdim", "2 度下", 0)]
    x0, y0, cw, rh = 140, 54, 40, 30
    o.append(T(x0 + 3 * cw, 20, "ハ長調の音階の音", "middle", 11, MUT))
    for j, l in enumerate(L):
        o.append(T(x0 + j * cw, 40, l, "middle", 12.5, INK, True))
    o.append(T(430, 40, "I からの根音の動き", "start", 11, MUT))
    o.append(T(584, 40, "共通音", "middle", 11, MUT))
    base = {0, 2, 4}
    for i, (dg, nm, mv, cnt) in enumerate(rows):
        y = y0 + i * rh + (8 if i > 0 else 0) + (6 * ((i - 1) // 2) if i > 0 else 0)
        o.append(T(16, y + 15, "%s（%s）" % (dg, nm), "start", 12, INK, True))
        r = "CDEFGAB".index(nm[0])
        tones = {r % 7, (r + 2) % 7, (r + 4) % 7}
        for j in range(7):
            cx = x0 + j * cw
            if j in tones:
                if i == 0:
                    o.append(CIRC(cx, y + 11, 11, SIG, 1.8, SSOFT))
                elif j in base:
                    o.append(CIRC(cx, y + 11, 11, SIG, 2.2, SSOFT))
                else:
                    o.append(CIRC(cx, y + 11, 11, INK, 1.2, PAN))
                o.append(T(cx, y + 15.5, L[j], "middle", 11.5, INK, True))
            else:
                o.append(D(cx, y + 11, LIN, 2.5))
        o.append(T(430, y + 15, mv, "start", 12, INK, i > 0))
        if cnt is not None:
            o.append(T(584, y + 15.5, "%d" % cnt, "middle", 14, SIG if cnt else MUT, True))
    o.append(W(16, y0 + rh + 1, 610, y0 + rh + 1, c=LIN, lw=1))
    o.append(T(16, 312, "赤い丸: I（C・E・G）と共通の音。3 度動くと 2 つ、4 度動くと 1 つ、2 度動くと 0", "start", 10.5, MUT))
    return SVG(626, 324, o, "ハ長調のダイアトニックコードのうち、I から根音が 3 度・4 度・2 度動いた和音の構成音。"
               "I と共通の音（赤い丸）の数は、根音の動きの種類だけで決まる。")
F["e12_common"] = _f12_common()


# 強進行: 前の根音が次の根音の倍音に含まれる
def _f12_strong():
    o = []
    def panel(x, title, prev, nxt, oldroot, root, series, hit, note1, note2):
        o.append(T(x, 24, title, "start", 13, INK, True))
        # 和音の構成音
        o.append(T(x, 52, "前の和音", "start", 10.5, MUT))
        o.append(T(x + 150, 52, "次の和音", "start", 10.5, MUT))
        for k, n in enumerate(prev):
            o.append(T(x + 2 + k * 30, 74, n, "start", 14, SIG if n == oldroot else INK, True))
        o.append(ARR(x + 96, 69, x + 140, 69, MUT, 1.4))
        for k, n in enumerate(nxt):
            o.append(T(x + 152 + k * 30, 74, n, "start", 14, SIG if n == oldroot else INK, True))
        o.append(T(x, 100, note1, "start", 11, INK))
        # 倍音列
        o.append(T(x, 132, "%s の倍音列（第 1〜第 8 倍音に近い音）" % root, "start", 11, MUT))
        for h in range(8):
            bx = x + h * 36
            on = h + 1 in hit
            o.append(T(bx + 16, 152, "%d" % (h + 1), "middle", 10, MUT))
            o.append(RECT(bx, 158, 32, 30, 5, SSOFT if on else PAN, SIG if on else LIN, 2 if on else 1.2))
            o.append(T(bx + 16, 178, series[h], "middle", 11, INK, on))
        o.append(T(x, 212, note2, "start", 11, SIG if hit else MUT, True))
    panel(16, "G → C（4 度上）", ["G", "B", "D"], ["C", "E", "G"], "G", "C",
          ["C2", "C3", "G3", "C4", "E4", "G4", "B♭4", "C5"], {3, 6},
          "前の根音 G が、次の和音の 5 度の音として残る", "前の根音 G は、C の第 3・第 6 倍音")
    panel(336, "C → G（4 度下）", ["C", "E", "G"], ["G", "B", "D"], "C", "G",
          ["G2", "G3", "D4", "G4", "B4", "D5", "F5", "G5"], set(),
          "前の根音 C は、次の和音に含まれない", "前の根音 C は、G の倍音列に現れない")
    return SVG(640, 226, o, "4 度上へ進む G → C では、前の和音の根音 G が、次の根音 C の倍音（第 3・第 6 倍音）に当たる。"
               "逆向きの C → G では、前の根音 C は次の和音にも、G の第 8 倍音までの倍音にも含まれない。")
F["e12_strong"] = _f12_strong()


# ダイアトニックコードの根音を 4 度上へたどる（五度圏と同じ並びの円）
def _f12_cycle():
    o = []
    cx, cy, r = 165, 168, 108
    pcs = {"F": 5, "C": 0, "G": 7, "D": 2, "A": 9, "E": 4, "B": 11}
    deg = {"C": "I", "D": "IIm", "E": "IIIm", "F": "IV", "G": "V", "A": "VIm", "B": "VIIdim"}
    fills = {pcs[L]: _f12_FC[_f12_fn(deg[L])] for L in pcs}
    labels = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"]
    o.append(CLOCK(cx, cy, r, active=list(pcs.values()), fills=fills, labels=labels, poly=False, sz=12.5, dot=8))
    def pt(pc, rr):
        a = math.radians(-90 + 30 * ((7 * pc) % 12))
        return cx + rr * math.cos(a), cy + rr * math.sin(a)
    for L, pc in pcs.items():
        x, y = pt(pc, r - 30)
        o.append(T(x, y + 4, deg[L], "middle", 11, _f12_FC[_f12_fn(deg[L])], True))
    chain = ["C", "F", "B", "E", "A", "D", "G", "C"]
    for i in range(7):
        a, b = chain[i], chain[i + 1]
        (x1, y1), (x2, y2) = pt(pcs[a], r), pt(pcs[b], r)
        dx, dy = x2 - x1, y2 - y1
        L_ = math.hypot(dx, dy)
        ux, uy = dx / L_, dy / L_
        sx, sy, ex, ey = x1 + ux * 12, y1 + uy * 12, x2 - ux * 12, y2 - uy * 12
        if a == "F":
            o.append(_f12_ln(sx, sy, ex - ux * 6, ey - uy * 6, ALI, 1.6, "5,4"))
            o.append(ARR(ex - ux * 7, ey - uy * 7, ex, ey, ALI, 1.6))
        else:
            thick = a in ("E", "A", "D", "G")
            # 円の外側へ少しふくらませた矢印
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ox, oy = mx - cx, my - cy
            k = 22 / math.hypot(ox, oy)
            qx, qy = mx + ox * k, my + oy * k
            ang = math.atan2(ey - qy, ex - qx)
            hd = 8
            hx, hy = ex - hd * math.cos(ang), ey - hd * math.sin(ang)
            col = INK if thick else MUT
            o.append('<path d="M%.1f,%.1f Q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="%g"/>'
                     % (sx, sy, qx, qy, hx, hy, col, 2.6 if thick else 1.4))
            o.append('<polygon points="%.1f,%.1f %.1f,%.1f %.1f,%.1f" fill="%s"/>'
                     % (ex, ey, hx - hd * 0.45 * math.sin(ang), hy + hd * 0.45 * math.cos(ang),
                        hx + hd * 0.45 * math.sin(ang), hy - hd * 0.45 * math.cos(ang), col))
    X = 330
    o.append(T(X, 40, "根音を 4 度上へたどる（円では反時計回り）", "start", 12, INK, True))
    o.append(T(X, 66, "I → IV → VIIdim → IIIm → VIm → IIm → V → I", "start", 12, INK))
    o.append(T(X, 88, "C → F → B → E → A → D → G → C", "start", 12, MUT))
    o.append(_f12_ln(X, 118, X + 30, 118, INK, 2.6))
    o.append(T(X + 38, 122, "循環進行 IIIm → VIm → IIm → V → I", "start", 11.5, INK, True))
    o.append(_f12_ln(X, 142, X + 30, 142, MUT, 1.4))
    o.append(T(X + 38, 146, "ほかの完全 4 度上（強進行）", "start", 11.5, MUT))
    o.append(_f12_ln(X, 166, X + 30, 166, ALI, 1.6, "5,4"))
    o.append(T(X + 38, 170, "F → B だけは増 4 度上（半音 6）", "start", 11.5, ALI, True))
    o.append(T(X, 204, "点の色は機能（青 T・緑 SD・赤 D）", "start", 10.5, MUT))
    o.append(T(X, 222, "7 つの根音は、円の上で隣り合う 7 か所を占める", "start", 10.5, MUT))
    return SVG(640, 300, o, "12 の音を完全 5 度ずつ並べた円（五度圏と同じ並び）の上に、ハ長調のダイアトニックコードの根音を置いた。"
               "4 度上への動きは、円を反時計回りに 1 つ隣へ進む動きになる。F → B だけは円を横切る増 4 度である。")
F["e12_cycle"] = _f12_cycle()


# カノン進行のベース: 根音のままと、転回形を使ったもの
def _f12_canonbass():
    o = []
    s = 9
    rows = [("根音をそのままベースにする", ["C", "G", "Am", "Em", "F", "C", "F", "G"], ["C3", "G2", "A2", "E2", "F2", "C3", "F2", "G2"]),
            ("転回形（分数コード）を使う", ["C", "G/B", "Am", "Em/G", "F", "C/E", "F", "G"], ["C3", "B2", "A2", "G2", "F2", "E2", "F2", "G2"])]
    yt = 52
    x0, dx = staff_start(s) + 1.2 * s, 70
    for title, syms, bs in rows:
        o.append(T(16, yt - 30, title, "start", 12.5, INK, True))
        items = [dict(x=x0 + i * dx, notes=[b], fill=GLD, sym=syms[i], symcol=INK, key=i) for i, b in enumerate(bs)]
        info = {}
        o.append(STAFF(16, yt, x0 + 7 * dx + 3 * s, s, "bass", items, info=info))
        pts = [info[i][0] for i in range(len(bs))]
        hw = 0.78 * s
        for i in range(len(bs) - 1):
            (x1, y1), (x2, y2) = pts[i], pts[i + 1]
            o.append(_f12_ln(x1 + hw + 2, y1, x2 - hw - 2, y2, GLD, 1.6, None, 0.8))
            a, b = parse(bs[i]), parse(bs[i + 1])
            d = b["dia"] - a["dia"]
            lab = "%d 度%s" % (abs(d) + 1, "上" if d > 0 else "下")
            step = abs(d) == 1
            o.append(T((x1 + x2) / 2 + 16, yt + 4 * s + 30, lab, "middle", 11, INK if step else ALI, True))
        yt += 128
    return SVG(640, yt - 128 + 4 * s + 46, o, "カノン進行のベース（いちばん低い音）。根音をそのままベースにすると、4 度・5 度の跳躍（赤）が混じる。"
               "2・4・6 番目の和音を転回形にすると、ベースは C から E まで 1 段ずつ下がり、F・G と上がる。")
F["e12_canonbass"] = _f12_canonbass()


# ============ 3 節 ============
_f12_EX3 = [["C3", "G3", "C4", "E4"], ["A2", "A3", "C4", "E4"], ["D3", "A3", "D4", "F4"], ["G2", "B3", "D4", "G4"], ["C3", "C4", "E4", "G4"]]
_f12_EX3_DEG = ["I", "VIm", "IIm", "V", "I"]


# 4 声部の進行と、声部の音域の目安
def _f12_voices():
    o = []
    s, ytop = 9, 44
    x0, dx = staff_start(s) + 1.3 * s, 66
    W = 590
    svg, pos = _f12_grand(14, ytop, _f12_EX3, s, x0, dx, w=W)
    o.append(svg)
    for ci, d in enumerate(_f12_EX3_DEG):
        x = pos[(ci, "S")][0]
        o.append(T(x, ytop + 12 * s + 40, _f12_name(d), "middle", 12.5, INK, True))
        o.append(T(x, ytop + 12 * s + 56, d, "middle", 11, MUT))
    # 声部名（最後の和音の右）
    xl = pos[(4, "S")][0] + 22
    for v in "SATB":
        x, y = pos[(4, v)]
        o.append(T(xl, y + 4, _f12_VJ[v], "start", 11.5, _f12_VC[v], True))
    # 音域の棒（目安）
    rg = {"S": ("C4", "G5", "treble"), "A": ("G3", "C5", "treble"), "T": ("C3", "G4", "bass"), "B": ("E2", "C4", "bass")}
    bx0 = 470
    o.append(T(bx0 + 52, ytop - 24, "音域の目安", "middle", 11, MUT, True))
    for k, v in enumerate("SATB"):
        lo, hi, st = rg[v]
        y1, y2 = _f12_ypos(ytop + 14 * 0, s, hi, st), _f12_ypos(ytop, s, lo, st)
        bx = bx0 + k * 34
        o.append('<rect x="%.1f" y="%.1f" width="14" height="%.1f" rx="4" fill="%s" fill-opacity="0.28" stroke="%s" stroke-width="1.4"/>'
                 % (bx, y1, y2 - y1, _f12_VC[v], _f12_VC[v]))
        o.append(T(bx + 7, y1 - 5, nname(hi), "middle", 9.5, _f12_VC[v], True))
        o.append(T(bx + 7, y2 + 13, nname(lo), "middle", 9.5, _f12_VC[v], True))
    return SVG(604, ytop + 12 * s + 66, o, "I–VIm–IIm–V–I を 4 つの声部で書いた。同じ声部の音を線でつなぐと、4 本の旋律が同時に進むように見える。"
               "右の棒は、各声部が無理なく出せる音域の目安（資料によって数音の違いがある）。")
F["e12_voices"] = _f12_voices()


# 声部の間隔: 3 度を低い所に置くと粗い
def _f12_spacing():
    o = []
    s, ytop = 9, 30
    cols = [["C3", "E3", "G3", "C4"], ["C3", "G3", "C4", "E4"], ["C3", "C4", "E4", "G4"]]
    rough = []
    for c in cols:
        fs = [freq(parse(n)["midi"]) for n in c]
        rough.append(100 * spec_analyze(fs)[2] / ROUGH_REF)
    x0, dx = staff_start(s) + 4 * s, 170
    svg, pos = _f12_grand(14, ytop, cols, s, x0, dx, w=x0 + 2 * dx + 6 * s, lines=False)
    o.append(svg)
    tags = ["(a) 下に 3 度を 2 つ", "(b) 下は 5 度、3 度は上", "(c) 下は 8 度、3 度は上"]
    for ci, c in enumerate(cols):
        # 3 度の組に印
        ms = [parse(n)["midi"] for n in c]
        vs = "BTAS"
        for k in range(3):
            if ms[k + 1] - ms[k] in (3, 4):
                (xa, ya), (xb, yb) = pos[(ci, vs[k])], pos[(ci, vs[k + 1])]
                bx = xa + 16
                o.append(W(bx, ya, bx + 5, ya, bx + 5, yb, bx, yb, c=ALI, lw=1.4))
                o.append(T(bx + 9, (ya + yb) / 2 + 4, "3 度", "start", 10, ALI, True))
        x = pos[(ci, "S")][0]
        yb = ytop + 12 * s + 40
        o.append(T(x, yb, tags[ci], "middle", 11, INK, True))
        o.append(T(x, yb + 18, " ".join(nname(n) for n in c), "middle", 10.5, MUT))
        R = rough[ci]
        o.append(RECT(x - 60, yb + 30, 120, 10, 3, PAN, LIN, 1))
        o.append(RECT(x - 60, yb + 30, 120 * R / 340.0, 10, 3, ALI, ALI, 1))
        o.append(T(x, yb + 58, "粗さ %d" % round(R), "middle", 12, ALI, True))
    return SVG(600, ytop + 12 * s + 112, o, "同じ C・C・E・G の 4 音でも、並べ方で粗さ（04 章 3 節の計算。短 2 度 C4–C♯4 を 100 とする）が変わる。"
               "3 度（赤い印）を低い所に置く (a) がいちばん粗く、低い所を広くあけて 3 度を上に置く (b)(c) ほど粗さが小さい。")
F["e12_spacing"] = _f12_spacing()


# ============ 4 節 ============
# 良い例と悪い例: 共通音を保持して近い音へ ／ 基本形のまま動かす
def _f12_smooth():
    o = []
    s = 8
    good = _f12_EX3
    bad = [["C3", "C4", "E4", "G4"], ["A2", "A3", "C4", "E4"], ["D3", "D4", "F4", "A4"], ["G2", "G3", "B3", "D4"], ["C3", "C4", "E4", "G4"]]
    x0, dx = staff_start(s) + 2.2 * s, 84
    W = x0 + 4 * dx + 4 * s
    y = 20
    for ci, d in enumerate(_f12_EX3_DEG):
        x = 14 + x0 + ci * dx
        o.append(T(x, y + 12, "%s（%s）" % (_f12_name(d), d), "middle", 11.5, INK, True))
    y = 44
    for title, cols, col, held in [("共通音を保持し、ほかは近い音へ", good, GRN2, True), ("各和音を基本形のまま動かす", bad, ALI, False)]:
        o.append(RECT(6, y, 628, 12 * s + 92, 10, "none", col, 1.4))
        tot = sum(_f12_upper_total(cols[i], cols[i + 1]) for i in range(4))
        o.append(T(18, y + 20, title, "start", 12.5, col, True))
        o.append(T(622, y + 20, "上の 3 声部の動きの合計 %d 半音" % tot, "end", 12, col, True))
        yt = y + 38
        svg, pos = _f12_grand(14, yt, cols, s, x0, dx, w=W, held=held)
        o.append(svg)
        for i in range(4):
            xm = (pos[(i, "S")][0] + pos[(i + 1, "S")][0]) / 2
            o.append(T(xm, yt + 12 * s + 30, "%d" % _f12_upper_total(cols[i], cols[i + 1]), "middle", 12, INK, True))
        o.append(T(14 + 6, yt + 12 * s + 30, "動き", "start", 10.5, MUT))
        y += 12 * s + 104
    o.append(_f12_ln(20, y + 4, 44, y + 4, SIG, 3.2))
    o.append(T(52, y + 8, "共通音の保持", "start", 10.5, MUT))
    o.append(T(622, y + 8, "数字: 隣の和音へ移るときの、上の 3 声部の動き（半音）の合計", "end", 10.5, MUT))
    return SVG(640, y + 18, o, "同じ I–VIm–IIm–V–I を、上は共通音を保持して近い音へ動かし、下は各和音を基本形（根音・3 度の音・5 度の音を下から順に）のまま動かした。"
               "バスは同じである。下では上の 3 声部が毎回そろって同じ向きに跳び、動きの合計が 5 倍になる。")
F["e12_smooth"] = _f12_smooth()


# 導出の図: 根音の動きごとに、上の 3 声部がどう対応するか
def _f12_steps():
    o = []
    panels = [("3 度の動き", "C → Am", ["C4", "D4", "E4", "F4", "G4", "A4"], ["C4", "E4", "G4"], ["C4", "E4", "A4"], "共通音 2 つ ・ 1 声部が 1 段"),
              ("4 度の動き", "C → F", ["C4", "D4", "E4", "F4", "G4", "A4"], ["C4", "E4", "G4"], ["C4", "F4", "A4"], "共通音 1 つ ・ 2 声部が 1 段"),
              ("2 度の動き", "F → G", ["F4", "G4", "A4", "B4", "C5", "D5"], ["F4", "A4", "C5"], ["G4", "B4", "D5"], "共通音 0 ・ 3 声部が 1 段")]
    for p, (title, ex, lad, c1, c2, note) in enumerate(panels):
        x = 14 + p * 210
        o.append(RECT(x, 10, 198, 262, 10, PAN, LIN, 1.2))
        o.append(T(x + 99, 32, title, "middle", 12.5, INK, True))
        o.append(T(x + 99, 50, ex, "middle", 11.5, MUT))
        xl, xr = x + 72, x + 152
        o.append(T(xl, 70, "前", "middle", 10.5, MUT))
        o.append(T(xr, 70, "次", "middle", 10.5, MUT))
        root = parse(c1[0])["dia"]
        Y = {}
        for k, n in enumerate(lad):
            yy = 220 - k * 27
            Y[n] = yy
            o.append(_f12_ln(x + 14, yy, x + 186, yy, LIN, 1, "2,3"))
            o.append(T(x + 20, yy + 4, n[0], "start", 11.5, INK, True))
            o.append(T(x + 38, yy + 4, "%d" % (parse(n)["dia"] - root), "start", 10, MUT))
        pairs = []
        held = [n for n in c1 if n in c2]
        rest1 = [n for n in c1 if n not in held]
        rest2 = [n for n in c2 if n not in held]
        for n in held:
            pairs.append((n, n))
        for a, b in zip(rest1, rest2):
            pairs.append((a, b))
        for a, b in pairs:
            ya, yb = Y[a], Y[b]
            if a == b:
                o.append(_f12_ln(xl + 9, ya, xr - 9, yb, SIG, 3.2))
            else:
                ang = math.atan2(yb - ya, xr - xl)
                o.append(ARR(xl + 9 * math.cos(ang), ya + 9 * math.sin(ang), xr - 9 * math.cos(ang), yb - 9 * math.sin(ang), INK, 1.6))
                o.append(T((xl + xr) / 2 + 10, (ya + yb) / 2 - 4, "1 段", "start", 9.5, INK))
        for n in c1:
            o.append(CIRC(xl, Y[n], 8, INK, 1.4, SSOFT if n in held else PAN))
        for n in c2:
            o.append(CIRC(xr, Y[n], 8, INK, 1.4, SSOFT if n in held else PAN))
        o.append(T(x + 99, 250, note, "middle", 10.5, INK, True))
    o.append(T(14, 292, "左の数字: 前の和音の根音から数えた段の番号。赤い線は共通音の保持、矢印は 1 段の動き", "start", 10.5, MUT))
    return SVG(646, 302, o, "根音の動きごとに、上の 3 声部（前の和音の 0・2・4 段目の音）を、次の和音の音へ 1 つずつ対応させた。"
               "どの場合も、共通音を保持すれば、ほかの声部は隣の音（1 段）へ動くだけでつながる。2 度の動きでは、3 つとも同じ向きに動く。")
F["e12_steps"] = _f12_steps()


# 連続 5 度・連続 8 度: IV → V
def _f12_parallel():
    o = []
    s = 8
    c1 = ["F2", "A3", "C4", "F4"]
    variants = [("上の 3 声部も上へ（すべて 1 段）", ["G2", "B3", "D4", "G4"], ALI),
                ("上の 3 声部を下へ（バスと反対）", ["G2", "G3", "B3", "D4"], GRN2)]
    x0, dx = staff_start(s) + 2.5 * s, 112
    for p, (title, c2, col) in enumerate(variants):
        x = 8 + p * 318
        o.append(RECT(x, 8, 308, 290, 10, "none", col, 1.4))
        o.append(T(x + 154, 30, title, "middle", 12, col, True))
        yt = 66
        svg, pos = _f12_grand(x + 8, yt, [c1, c2], s, x0, dx, w=x0 + dx + 7 * s)
        o.append(svg)
        for ci, nm in enumerate(["F（IV）", "G（V）"]):
            o.append(T(pos[(ci, "S")][0], yt - 22, nm, "middle", 11.5, INK, True))
        par = _f12_parallels(c1, c2)
        hw = 0.78 * s
        for k, (kind, a, b) in enumerate(par):
            off = 9 + k * 7
            for ci in (0, 1):
                (xa, ya), (xb, yb) = pos[(ci, a)], pos[(ci, b)]
                xx = xa - hw - off if ci == 0 else xa + hw + off
                o.append(_f12_ln(xx, ya, xx, yb, ALI, 1.8, "4,3"))
        mv = ["%s %+d" % (_f12_VJ[v], _f12_semis(c1[k], c2[k])) for k, v in [(3, "S"), (2, "A"), (1, "T")]]
        yb = yt + 12 * s + 36
        o.append(T(x + 154, yb, "・".join(mv), "middle", 10.5, INK))
        o.append(T(x + 154, yb + 18, "上の 3 声部の動きの合計 %d 半音" % _f12_upper_total(c1, c2), "middle", 11, INK, True))
        if par:
            names = {"5": "連続 5 度", "8": "連続 8 度"}
            txt = "、".join("%s（%s–%s）" % (names[kd], _f12_VJ[a], _f12_VJ[b]) for kd, a, b in par)
            o.append(T(x + 154, yb + 40, txt, "middle", 11, ALI, True))
        else:
            o.append(T(x + 154, yb + 40, "連続 5 度・連続 8 度なし", "middle", 11, GRN2, True))
    return SVG(636, 306, o, "IV → V（F → G）でバスが上がるとき。左は上の 3 声部も 1 段ずつ上げたもので、バスとソプラノが 2 オクターブのまま、"
               "バスとアルトが完全 5 度（12 度）のまま一緒に動く（赤い破線）。右は上の 3 声部を下げたもので、動きの合計は同じ 6 半音のまま連続が無くなる。")
F["e12_parallel"] = _f12_parallel()


# ツーファイブワンのガイドトーン
def _f12_guide():
    o = []
    s, yt = 9, 52
    cols = [["D3", "C4", "F4", "A4"], ["G2", "B3", "F4", "G4"], ["C3", "B3", "E4", "G4"]]
    x0, dx = staff_start(s) + 2.5 * s, 110
    svg, pos = _f12_grand(14, yt, cols, s, x0, dx, w=x0 + 2 * dx + 18 * s, held=True)
    o.append(svg)
    for ci, nm in enumerate(["Dm7（IIm7）", "G7（V7）", "CM7（IM7）"]):
        o.append(T(pos[(ci, "S")][0], yt - 26, nm, "middle", 12, INK, True))
    roles = [{"A": "3 度", "T": "7 度"}, {"A": "7 度", "T": "3 度"}, {"A": "3 度", "T": "7 度"}]
    for ci in range(3):
        for v in "AT":
            x, y = pos[(ci, v)]
            o.append(CIRC(x, y, 9.5, SIG, 1.8))
            o.append(T(x + 13, y + 15 if v == "T" else y - 8, roles[ci][v], "start", 10, SIG, True))
    xr = pos[(2, "S")][0] + 64
    o.append(T(xr, yt + 26, "アルト: F → F → E", "start", 12, BLU, True))
    o.append(T(xr, yt + 44, "（3 度の音 → 7 度の音 → 3 度の音）", "start", 10.5, MUT))
    o.append(T(xr, yt + 88, "テノール: C → B → B", "start", 12, GRN2, True))
    o.append(T(xr, yt + 106, "（7 度の音 → 3 度の音 → 7 度の音）", "start", 10.5, MUT))
    o.append(T(xr, yt + 140, "どちらも、保持か半音 1 つの動き", "start", 11, INK, True))
    o.append(T(xr, yt + 158, "G7 は 5 度の音 D を省き、G を重複", "start", 10.5, MUT))
    return SVG(620, yt + 12 * s + 40, o, "ツーファイブワン Dm7–G7–CM7 を 4 声部で書いた。赤い丸がガイドトーン（3 度の音と 7 度の音）で、"
               "前の和音の 7 度の音が次の和音の 3 度の音へ半音下がり、3 度の音は次の和音の 7 度の音として保持される。")
F["e12_guide"] = _f12_guide()


# ============ 5 節 ============
def _f12_flow():
    o = []
    items = [("① 機能の流れ", "T → SD → D → T など"), ("② 和音を選ぶ", "代理も使う（1 節）"),
             ("③ ベースの線", "根音か転回形か（2 節）"), ("④ 上の 3 声部", "保持・近い音・連続の確認")]
    svg, _ = flowright(10, 46, items, w=136, bh=60, gap=22)
    o.append(svg)
    return SVG(636, 92, o, "進行を組み立てる 4 つの段。①②で和音の並びを、③④で各声部の音を決める。")
F["e12_flow"] = _f12_flow()


def _f12_worked():
    o = []
    degs = ["I", "VIm", "IV", "V", "I"]
    cols = [["C3", "G3", "C4", "E4"], ["A2", "A3", "C4", "E4"], ["F2", "A3", "C4", "F4"], ["G2", "G3", "B3", "D4"], ["C3", "G3", "C4", "E4"]]
    X = [190 + i * 104 for i in range(5)]
    rows = {"f": 30, "c": 76, "b": 132, "S": 192, "A": 222, "T": 252, "m": 292}
    o.append(T(14, rows["f"] + 5, "① 機能", "start", 12, INK, True))
    o.append(T(14, rows["c"] + 5, "② 和音", "start", 12, INK, True))
    o.append(T(14, rows["b"] + 5, "③ ベース", "start", 12, INK, True))
    o.append(T(14, rows["A"] + 5, "④ 上の 3 声部", "start", 12, INK, True))
    for v in "SAT":
        o.append(T(150, rows[v] + 5, _f12_VJ[v], "end", 10.5, MUT))
    o.append(T(14, rows["m"] + 5, "動き（半音）", "start", 11, MUT))
    for i, d in enumerate(degs):
        o.append(_f12_tag(X[i], rows["f"], _f12_fn(d), 48, 24, 12))
        o.append(T(X[i], rows["c"] + 2, _f12_name(d), "middle", 14, INK, True))
        o.append(T(X[i], rows["c"] + 19, d, "middle", 11, MUT))
        o.append(T(X[i], rows["b"] + 5, nname(cols[i][0]), "middle", 13, INK, True))
        for k, v in [(3, "S"), (2, "A"), (1, "T")]:
            o.append(T(X[i], rows[v] + 5, nname(cols[i][k]), "middle", 13, INK, True))
    o.append(W(14, 106, 622, 106, c=LIN, lw=1))
    o.append(W(14, 164, 622, 164, c=LIN, lw=1))
    o.append(W(14, 272, 622, 272, c=LIN, lw=1))
    for i in range(4):
        xm = (X[i] + X[i + 1]) / 2
        a, b = parse(cols[i][0]), parse(cols[i + 1][0])
        d = b["dia"] - a["dia"]
        o.append(T(xm, rows["b"] + 22, "%d 度%s" % (abs(d) + 1, "上" if d > 0 else "下"), "middle", 10, MUT))
        for k, v in [(3, "S"), (2, "A"), (1, "T")]:
            sm = _f12_semis(cols[i][k], cols[i + 1][k])
            if sm == 0:
                o.append(_f12_ln(xm - 14, rows[v], xm + 14, rows[v], SIG, 3.2))
            else:
                o.append(T(xm, rows[v] + 5, "%+d" % sm, "middle", 11, INK, True))
        o.append(T(xm, rows["m"] + 5, "%d" % _f12_upper_total(cols[i], cols[i + 1]), "middle", 12.5, INK, True))
    o.append(T(622, rows["m"] + 30, "合計 12 半音 ・ 連続 5 度・連続 8 度なし", "end", 11.5, INK, True))
    xm = (X[2] + X[3]) / 2
    o.append(RECT(xm - 26, rows["S"] - 16, 52, 82, 8, "none", INK, 1.2, "4,3"))
    o.append(T(xm, rows["T"] + 32, "バスと反対へ", "middle", 10, INK))
    o.append(_f12_ln(160, rows["m"] + 26, 184, rows["m"] + 26, SIG, 3.2))
    o.append(T(190, rows["m"] + 30, "保持", "start", 10.5, MUT))
    return SVG(636, rows["m"] + 40, o, "手順どおりに I–VIm–IV–V–I を組み立てた。④では、共通音を保持し（赤い線）、ほかの声部を近い音へ動かす。"
               "根音が 2 度動く IV → V（点線の枠）だけは、上の 3 声部をバスと反対の向きへ動かす。")
F["e12_worked"] = _f12_worked()
