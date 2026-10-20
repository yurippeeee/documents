# 18 章 1 曲を分析する の図（figures.py の関数・定数をそのまま使う）
# 3 曲の旋律・和音は文字列で持ち、小節ごとの拍数は検算用スクリプトで確かめてある。
# 書き方: 旋律は「音名:拍数」（省略時 1 拍）を空白で、小節を | で区切る。~ は次の音へのタイ。
#        和音は小節ごとに並べ、拍数を省くと小節（4 拍）を等分する。

import re as _f18_re

_f18_SONGS = {
    "tw": dict(
        mel="C5 C5 G5 G5 | A5 A5 G5:2 | F5 F5 E5 E5 | D5 D5 C5:2 | G5 G5 F5 F5 | E5 E5 D5:2 | "
            "G5 G5 F5 F5 | E5 E5 D5:2 | C5 C5 G5 G5 | A5 A5 G5:2 | F5 F5 E5 E5 | D5 D5 C5:2",
        ch="C | F C | F C | G C | C F | C G | C F | C G | C | F C | F C | G C",
        cad={4: "全終止", 8: "半終止", 12: "全終止"},
        form=[(1, 4, "a"), (5, 8, "b"), (9, 12, "a")]),
    "ode": dict(
        mel="E5 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | E5:1.5 D5:0.5 D5:2 | E5 E5 F5 G5 | G5 F5 E5 D5 | "
            "C5 C5 D5 E5 | D5:1.5 C5:0.5 C5:2 | D5 D5 E5 C5 | D5 E5:0.5 F5:0.5 E5 C5 | D5 E5:0.5 F5:0.5 E5 D5 | "
            "C5 D5 G4 E5~ | E5 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:1.5 C5:0.5 C5:2",
        ch="C | G7 | C | C G | C | G7 | C | G7 C | G C | G7 C | G7 C | D7 G | C | G7 | C | G7 C",
        deg={"D7@44": "V7/V"},
        cad={4: "半終止", 8: "全終止", 12: "半終止", 16: "全終止"},
        form=[(1, 4, "a"), (5, 8, "a'"), (9, 12, "b"), (13, 16, "a'")]),
    "ex3": dict(
        mel="C5 D5 E5 G5 | A5 G5 E5 C#5 | D5 E5 F5 D5 | E5 D5 C5:2 | C5 D5 E5 G5 | A5 G5 E5 C5 | "
            "D5 E5 F#5 D5 | B4 A4 G4:2 | G5 F#5 G5 D5 | C5 E5 D5 F#5 | G5:4 | G5 F5 D5 B4 | "
            "C5 D5 E5 G5 | A5:2 Ab5:2 | G5:2 F5 D5 | E5 D5 C5:2",
        ch="C | A7 | Dm G7 | C | C | Am7 | D7 | G | G | Am D7 | G | G7 | C | F Fm | C G7 | C",
        key={6: "G", 7: "G", 8: "G", 9: "G", 10: "G", 11: "G"},
        deg={"A7@4": "V7/IIm", "Am7@20": ["VIm7", "IIm7"], "G@40": ["I", "V"]},
        dkey={"Am7@20": ["C", "G"], "G@40": ["G", "C"]},
        cad={4: "全終止", 8: "全終止（ト長調）", 11: "全終止（ト長調）", 12: "半終止", 16: "全終止"},
        band=[(1, 5, "ハ長調", "C"), (6, 6, "ピボット", "P"), (7, 10, "ト長調", "G"), (11, 11, "ピボット", "P"), (12, 16, "ハ長調", "C")],
        form=[(1, 4, "a"), (5, 8, "a'"), (9, 12, "b"), (13, 16, "a''")]),
}

_f18_FNC = {"T": (BLU, BSOFT), "SD": (GRN2, GSOFT), "D": (SIG, SSOFT), "SDm": (PUR, PSOFT)}


def _f18_sym(sym):
    return sym.replace("#", "♯").replace("b", "♭")


def _f18_mel(s):
    out, t = [], 0.0
    for bi, b in enumerate(s.split("|")):
        for tok in b.split():
            tie = tok.endswith("~")
            n, _, d = tok.rstrip("~").partition(":")
            d = float(d) if d else 1.0
            out.append(dict(t=t, d=d, n=n, tie=tie, bar=bi + 1))
            t += d
    return out


def _f18_ch(s):
    out, t = [], 0.0
    for bi, b in enumerate(s.split("|")):
        toks = b.split()
        for tok in toks:
            n, _, d = tok.partition(":")
            d = float(d) if d else 4.0 / len(toks)
            out.append(dict(t=t, d=d, sym=n, bar=bi + 1))
            t += d
    return out


def _f18_fn(deg):
    """ディグリーネームから機能（T・SD・D・SDm）を決める。V7/IIm のようなセカンダリードミナントは D"""
    if "/" in deg:
        return "D"
    m = _f18_re.match(r"[♭♯]?(VII|VI|V|IV|III|II|I)(.*)", deg)
    num, q = m.group(1), m.group(2)
    if num in ("I", "III", "VI"):
        return "T"
    if num == "IV":
        return "SDm" if q.startswith("m") else "SD"
    if num == "II":
        return "SD"
    return "D"


def _f18_pcs(sym):
    p = chord_parse(sym)
    return set((p["root_pc"] + v) % 12 for v in p["ivs"])


def _f18_song(spec):
    """旋律・和音を読み、各和音にディグリーネーム・機能・調を付け、各音に非和声音の種類を付ける"""
    S = _f18_SONGS[spec] if isinstance(spec, str) else spec
    notes, chords = _f18_mel(S["mel"]), _f18_ch(S["ch"])
    for c in chords:
        k = "%s@%d" % (c["sym"], round(c["t"]))
        c["key"] = S.get("key", {}).get(c["bar"], "C")
        dg = S.get("deg", {}).get(k)
        if dg is None:
            dg = roman(c["sym"], c["key"])
        c["deg"] = dg if isinstance(dg, list) else [dg]
        c["dkey"] = S.get("dkey", {}).get(k, [c["key"]] * len(c["deg"]))
        c["fn"] = [_f18_fn(d) for d in c["deg"]]
        c["sec"] = "/" in c["deg"][0]

    def chord_at(t):
        for c in chords:
            if c["t"] - 1e-9 <= t < c["t"] + c["d"] - 1e-9:
                return c
    for i, n in enumerate(notes):
        p = parse(n["n"]); n["midi"] = p["midi"]; n["dia"] = p["dia"]
        c = chord_at(n["t"]); n["chord"] = c
        n["ct"] = p["midi"] % 12 in _f18_pcs(c["sym"])
        n["cont"] = i > 0 and notes[i - 1]["tie"]          # タイで前の音から続く（新しく鳴らさない）
        n["nct"] = None
        if not n["ct"] and 0 < i < len(notes) - 1:
            a, b = parse(notes[i - 1]["n"]), parse(notes[i + 1]["n"])
            dp, dn = p["dia"] - a["dia"], b["dia"] - p["dia"]
            cn = chord_at(notes[i + 1]["t"])
            if abs(dp) == 1 and dp == dn:
                n["nct"] = "経過"
            elif abs(dp) == 1 and dn == -dp:
                n["nct"] = "刺繍"
            elif b["midi"] == p["midi"] and cn is not c and p["midi"] % 12 in _f18_pcs(cn["sym"]):
                n["nct"] = "先取"
    return S, notes, chords


# ---------- 分析譜の 1 段（五線 1 本） ----------
_f18_s = 8.5      # 五線の間隔
_f18_U = 30.0     # 1 拍の幅
_f18_G = 16.0     # 小節の間のすき間
_f18_DUR = {4.0: ("whole", False), 3.0: ("half", True), 2.0: ("half", False), 1.5: ("quarter", True),
            1.0: ("quarter", False), 0.5: ("eighth", False)}


def _f18_xs():
    return staff_start(_f18_s, 0, "4/4")


def _f18_X(rel):
    """段の始まりから rel 拍の位置（五線の左端からの x）"""
    return _f18_xs() + _f18_U * rel + _f18_G * math.floor(rel / 4 + 1e-9)


def _f18_barx(k):
    """段の k 番目の小節の終わりの小節線の x（五線の左端から）"""
    return _f18_X(4 * k) - _f18_G * 0.5 - 7


def _f18_yn(n, ytop):
    pp = parse(n)["dia"] - 30
    return ytop + 4 * _f18_s - pp * _f18_s / 2


def _f18_row(o, xL, ytop, notes, b0, nb, time, endbar, fills=None):
    """b0 小節目（1 から数える）から nb 小節を 1 段の五線に描く。fills は音の index → 色。返り値は五線の幅"""
    s = _f18_s
    t0 = 4.0 * (b0 - 1)
    items = []
    for i, n in enumerate(notes):
        if not (t0 - 1e-9 <= n["t"] < t0 + 4 * nb - 1e-9):
            continue
        dur, dot = _f18_DUR[n["d"]]
        it = dict(x=_f18_X(n["t"] - t0), notes=[n["n"]], dur=dur, dot=dot, fill=(fills or {}).get(i, INK))
        if n["tie"]:
            it["tie"] = True
        if dur == "eighth":
            it["beam"] = "b%d" % math.floor(n["t"] + 1e-9)
        items.append(it)
    for k in range(1, nb + 1):
        kind = "end" if (endbar and k == nb) else True
        items.append(dict(x=_f18_barx(k) + (0.5 * s if kind == "end" else 0), bar=kind))
    w = _f18_barx(nb) + (0.6 * s if endbar else 1)
    o.append(STAFF(xL, ytop, w, s=s, clef="treble", items=items, time="4/4" if time else None))
    return w


def _f18_tie_half(o, x1, x2, y, col=INK):
    """段の端で切れるタイ（上に曲がる半分の弧）"""
    s = _f18_s
    ya = y - 0.55 * s
    xm = (x1 + x2) / 2
    o.append('<path d="M%g,%g Q%g,%g %g,%g Q%g,%g %g,%gZ" fill="%s"/>'
             % (x1, ya, xm, ya - 1.1 * s, x2, ya, xm, ya - 0.8 * s, x1, ya, col))


def _f18_fnbox(o, x1, x2, y, fn, sec=False, h=17):
    c, fl = _f18_FNC[fn]
    o.append(RECT(x1, y, x2 - x1, h, 4, fl, c, 1.3, "4,3" if sec else None))
    o.append(T((x1 + x2) / 2, y + h - 4.5, fn, "middle", 11, c, True))


_f18_BAND = {"C": (BLU, BSOFT), "G": (GLD, GOSOFT), "P": (MUT, PAN)}


def _f18_chart(spec, rows, show, xL=16, top=6, time=True, fills_extra=None, hl=None, endbar=None):
    """分析譜。rows は段ごとの (最初の小節, 小節の数)。show に含める層:
       sym（コードネーム）deg（ディグリーネーム）fn（機能）nct（非和声音）cad（終止）key（調の帯）num（小節番号）
       hl は枠で囲む音の (開始の拍, 長さ) の列"""
    S, notes, chords = _f18_song(spec)
    s = _f18_s
    o = []
    y = top
    nbars = max(n["bar"] for n in notes)
    fills = {}
    if "nct" in show:
        for i, n in enumerate(notes):
            if n["nct"] and not n["cont"]:
                fills[i] = GLD
    fills.update(fills_extra or {})
    info = []
    for ri, (b0, nb) in enumerate(rows):
        ytop = y + (34 if "sym" in show else 22)
        t0 = 4.0 * (b0 - 1)
        X = lambda rel, xL=xL: xL + _f18_X(rel)
        eb = (b0 + nb - 1 == nbars) if endbar is None else endbar
        for (ht, hd) in (hl or []):
            if t0 - 1e-9 <= ht < t0 + 4 * nb - 1e-9:
                o.append(RECT(X(ht - t0) - 10, ytop - 6, max(20, _f18_U * hd - 12), 4 * s + 12, 6, "none", GLD, 1.6))
        wrow = _f18_row(o, xL, ytop, notes, b0, nb, time and ri == 0, eb, fills)
        xend = xL + wrow
        if "num" in show:
            o.append(T(xL + 2, ytop - 9, str(b0), "start", 9.5, MUT))
            for k in range(1, nb):
                o.append(T(xL + _f18_barx(k) - 3, ytop - 9, str(b0 + k), "end", 9.5, MUT))
        rn = [n for n in notes if t0 - 1e-9 <= n["t"] < t0 + 4 * nb - 1e-9]
        if rn and rn[-1]["tie"]:
            _f18_tie_half(o, X(rn[-1]["t"] - t0) + 4, xend - 1, _f18_yn(rn[-1]["n"], ytop))
        if rn and rn[0]["cont"]:
            _f18_tie_half(o, xL + _f18_xs() - 16, X(0) - 4, _f18_yn(rn[0]["n"], ytop))
        yb = ytop + 4 * s + 12
        if "nct" in show:
            for n in rn:
                if n["nct"] and not n["cont"]:
                    o.append(T(X(n["t"] - t0), yb + 11, n["nct"], "middle", 10.5, GLD, True))
            yb += 17
        rc = [c for c in chords if t0 - 1e-9 <= c["t"] < t0 + 4 * nb - 1e-9]
        if "sym" in show:
            for c in rc:
                o.append(T(X(c["t"] - t0) - 5, ytop - 20, _f18_sym(c["sym"]), "start", 13, INK, True))
        if "deg" in show:
            two = any(len(c["deg"]) > 1 for c in rc)
            for c in rc:
                x = X(c["t"] - t0) - 5
                if len(c["deg"]) == 1:
                    o.append(T(x, yb + 12, c["deg"][0], "start", 12, INK, True))
                else:
                    for j in range(2):
                        k = c["dkey"][j]
                        o.append(T(x, yb + 12 + 15 * j, "%s（%s）" % (c["deg"][j], {"C": "ハ", "G": "ト"}[k]), "start", 10.5,
                                   INK if j == 0 else MUT, True))
            yb += 39 if two else 22
        if "fn" in show:
            for c in rc:
                x1 = X(c["t"] - t0) - 9
                x2 = (X(c["t"] + c["d"] - t0) - 12) if c["t"] + c["d"] - t0 < 4 * nb - 1e-9 else xend - 4
                if len(c["fn"]) == 1:
                    _f18_fnbox(o, x1, x2, yb, c["fn"][0], c["sec"])
                else:
                    xm = (x1 + x2) / 2
                    _f18_fnbox(o, x1, xm - 1.5, yb, c["fn"][0])
                    _f18_fnbox(o, xm + 1.5, x2, yb, c["fn"][1])
            yb += 24
        if "cad" in show:
            for bar, lab in S.get("cad", {}).items():
                if b0 <= bar < b0 + nb:
                    xr = xL + _f18_barx(bar - b0 + 1) - 2
                    tw = 12.5 * len(lab) + 14
                    o.append(RECT(xr - tw, yb + 1, tw, 20, 10, PAN, INK, 1.1))
                    o.append(T(xr - tw / 2, yb + 15.5, lab, "middle", 11.5, INK, True))
            yb += 27
        if "key" in show:
            for (a, b, lab, k) in S.get("band", []):
                if a >= b0 and b < b0 + nb:
                    x1 = xL + (_f18_barx(a - b0) if a > b0 else _f18_xs() - 12) + 3
                    x2 = xL + _f18_barx(b - b0 + 1) - 3
                    c, fl = _f18_BAND[k]
                    o.append(RECT(x1, yb, x2 - x1, 18, 4, fl, c, 1.2, "4,3" if k == "P" else None))
                    o.append(T((x1 + x2) / 2, yb + 13.5, lab, "middle", 11, c, True))
            yb += 26
        info.append(dict(ytop=ytop, X=X, xend=xend, b0=b0, nb=nb, t0=t0, notes=rn, chords=rc))
        y = yb + 8
    return o, y, info, notes


# ===================== 1 節 =====================
# 1. 分析の 7 つの段と、後の段が前の段の結果を使う関係
def _f18_steps():
    o = []
    steps = [("① 拍子と調", "何拍ずつまとまり、主音はどれか", "16・07 章"),
             ("② フレーズの区切り", "どこで区切れるか", "10 章"),
             ("③ 和音とディグリーネーム", "何の和音が鳴っているか", "08・09・11 章"),
             ("④ 機能と終止", "落ち着くか、続きを求めるか", "10・13 章"),
             ("⑤ 非和声音", "和音に含まれない旋律の音はどれか", "17 章"),
             ("⑥ 転調", "主音が移る所はあるか", "14 章"),
             ("⑦ 全体の形", "フレーズがどう並ぶか", "この章 2 節")]
    x0, w, h, pitch, y0 = 66, 268, 44, 58, 14
    cy = lambda i: y0 + i * pitch + h / 2
    for i, (a, b, c) in enumerate(steps):
        y = y0 + i * pitch
        o.append(RECT(x0, y, w, h, 8, PAN, LIN, 1.3))
        o.append(T(x0 + 12, y + 18, a, "start", 13, INK, True))
        o.append(T(x0 + w - 10, y + 18, c, "end", 10.5, BLU, True))
        o.append(T(x0 + 12, y + 35, b, "start", 11, MUT))
        if i < len(steps) - 1:
            o.append(ARR(x0 + 40, y + h + 1, x0 + 40, y + pitch - 2, MUT, 1.3, 6))
    xr = x0 + w
    deps = [(0, 2, "主音", 34), (1, 3, "区切り", 64), (2, 3, "和音", 16), (2, 4, "和音", 34), (3, 5, "終止", 64), (1, 6, "フレーズ", 100)]
    for a, b, lab, bul in deps:
        ya, yb_ = cy(a) + 6, cy(b) - 6
        xm = xr + bul
        o.append('<path d="M%g,%g C%g,%g %g,%g %g,%g" fill="none" stroke="%s" stroke-width="1.4"/>'
                 % (xr + 2, ya, xm, ya, xm, yb_, xr + 9, yb_, SIG))
        o.append('<polygon points="%g,%g %g,%g %g,%g" fill="%s"/>' % (xr + 2, yb_, xr + 10, yb_ - 4, xr + 10, yb_ + 4, SIG))
        o.append(T(xm - 0.25 * bul + 6, (ya + yb_) / 2 + 4, lab, "start", 10.5, SIG, True))
    # ⑥ → ③（戻る）
    ya, yb_ = cy(5), cy(2)
    o.append('<path d="M%g,%g C%g,%g %g,%g %g,%g" fill="none" stroke="%s" stroke-width="1.4" stroke-dasharray="4,3"/>'
             % (x0 - 2, ya, x0 - 30, ya, x0 - 30, yb_, x0 - 9, yb_, GLD))
    o.append('<polygon points="%g,%g %g,%g %g,%g" fill="%s"/>' % (x0 - 2, yb_, x0 - 10, yb_ - 4, x0 - 10, yb_ + 4, GLD))
    o.append(T(x0 - 34, (ya + yb_) / 2 - 4, "数え", "end", 10.5, GLD, True))
    o.append(T(x0 - 34, (ya + yb_) / 2 + 10, "直す", "end", 10.5, GLD, True))
    return SVG(500, y0 + 7 * pitch, o, "分析の 7 つの段。各段の右上は、使う道具を定義した章。右の赤い弧は、後の段が前の段の結果"
               "（主音・区切り・和音・終止・フレーズ）を使うことを表す。⑥ で転調が見つかったら、その部分の ③・④ を新しい調で数え直す（金色の破線）。")
F["e18_steps"] = _f18_steps()


# 2. 調の手がかり: 調号の無い 2 つの例（ハ長調とイ短調）
def _f18_keyclue():
    o = []
    ex = [("ハ長調の例", dict(mel="F5 D5 D5 B4 | C5:4", ch="Dm G7 | C"), 3,
           ["最後の音: C", "最後の和音: C（C・E・G）", "導音 B → C（記号なし）"], BLU),
          ("イ短調の例", dict(mel="F5 D5 B4 G#4 | A4:4", ch="Dm E7 | Am"), 3,
           ["最後の音: A", "最後の和音: Am（A・C・E）", "導音 G♯ → A（♯ が付く）"], PUR)]
    y = 4
    for title, sp, li, clues, col in ex:
        oo, h, info, notes = _f18_chart(sp, [(1, 2)], {"sym"}, top=y + 16, time=False, fills_extra={li: SIG, li + 1: SIG})
        o.extend(oo)
        o.append(T(16, y + 14, title + "（調号なし）", "start", 13, col, True))
        for j, cl in enumerate(clues):
            o.append(T(372, y + 50 + 22 * j, "・" + cl, "start", 12, SIG if j == 2 else INK, j == 2))
        y = h + 4
    return SVG(600, y, o, "調号が無い 2 つの短い例。どちらも、旋律が導音から主音へ半音上がって終わる（赤）。"
               "調号だけでは決まらないが、最後の音と和音、導音の臨時記号で、ハ長調かイ短調かが決まる。")
F["e18_keyclue"] = _f18_keyclue()


# ===================== 2 節 きらきら星 =====================
def _f18_tw_score():
    tw = _f18_song("tw")[1]
    hl = [(n["t"], n["d"]) for n in tw if n["d"] >= 2]
    o, h, info, notes = _f18_chart("tw", [(1, 4), (5, 4), (9, 4)], {"num"}, hl=hl)
    r1, r3 = info[0], info[2]
    xb = r1["xend"] + 14
    y1, y3 = r1["ytop"] + 17, r3["ytop"] + 17
    o.append(W(xb - 6, y1, xb, y1, xb, y3, xb - 6, y3, c=SIG, lw=1.6))
    o.append(T(xb + 6, (y1 + y3) / 2 - 2, "まったく", "start", 11, SIG, True))
    o.append(T(xb + 6, (y1 + y3) / 2 + 13, "同じ", "start", 11, SIG, True))
    return SVG(690, h, o, "きらきら星の旋律（ハ長調、4/4 拍子）。金色の枠は 2 拍の長い音（2 分音符）で、2 小節ごとに来る。"
               "第 9〜12 小節は第 1〜4 小節とまったく同じなので、12 小節は 4 小節ずつ 3 つに分かれる。")
F["e18_tw_score"] = _f18_tw_score()


_f18_CQ = {"C": "C", "D": "Dm", "E": "Em", "F": "F", "G": "G", "A": "Am", "B": "Bdim"}
_f18_CFN = {"C": "T", "Dm": "SD", "Em": "T", "F": "SD", "G": "D", "Am": "T", "Bdim": "D"}


def _f18_tw_cand():
    o = []
    slots = [("C", 1), ("G", 1), ("A", 2), ("G", 2), ("F", 3), ("E", 3), ("D", 4), ("C", 4)]
    chosen = ["C", "C", "F", "C", "F", "C", "G", "C"]
    x0, cw = 112, 72
    roles = [("根音", 0), ("3 度の音", 2), ("5 度の音", 4)]
    o.append(T(x0 - 12, 26, "小節", "end", 11, MUT, True))
    o.append(T(x0 - 12, 56, "旋律の音 x", "end", 11, MUT, True))
    for j, (rn, dl) in enumerate(roles):
        o.append(T(x0 - 12, 92 + 38 * j, "x が" + rn, "end", 11, MUT, True))
    o.append(T(x0 - 12, 222, "選んだ和音", "end", 11, INK, True))
    for k in range(4):
        xa = x0 + 2 * k * cw
        o.append(RECT(xa + 3, 12, 2 * cw - 6, 20, 5, SCR, LIN, 1))
        o.append(T(xa + cw, 26, "第 %d 小節" % (k + 1), "middle", 11, INK, True))
    for i, (L, bar) in enumerate(slots):
        cx = x0 + i * cw + cw / 2
        o.append(T(cx, 58, "%s %s" % (L, L), "middle", 15, INK, True))
        li = LETTERS.index(L)
        for j, (rn, dl) in enumerate(roles):
            root = LETTERS[(li - dl) % 7]
            nm = _f18_CQ[root]
            c, fl = _f18_FNC[_f18_CFN[nm]]
            on = nm == chosen[i]
            y = 76 + 38 * j
            o.append(RECT(cx - 30, y, 60, 26, 6, fl, INK if on else c, 2.6 if on else 1.1))
            o.append(T(cx, y + 18, nm, "middle", 13 if on else 12, INK if on else c, on))
        nm = chosen[i]
        c, fl = _f18_FNC[_f18_CFN[nm]]
        o.append(T(cx, 222, nm, "middle", 14, INK, True))
        o.append(T(cx, 240, roman(nm, "C"), "middle", 11.5, c, True))
    for k in range(1, 4):
        xx = x0 + 2 * k * cw
        o.append(W(xx, 40, xx, 248, c=LIN, lw=1, dash="3,3"))
    return SVG(700, 256, o, "第 1〜4 小節の 2 拍ごとの旋律の音と、その音を含む 3 つのダイアトニックコード（色は機能: 青 = T、緑 = SD、赤 = D）。"
               "太い枠が選んだ和音。第 4 小節は全終止（V → I）になるように G → C を選んだ。")
F["e18_tw_cand"] = _f18_tw_cand()


def _f18_tw_chart():
    o, h, info, notes = _f18_chart("tw", [(1, 4), (5, 4), (9, 4)], {"sym", "deg", "fn", "cad", "num"})
    return SVG(640, h, o, "きらきら星の和音付けの一例と、その分析。五線の上がコードネーム、下がディグリーネームと機能"
               "（青 = T、緑 = SD、赤 = D）。右下の枠は、フレーズの最後の 2 つの和音で決まる終止の種類。")
F["e18_tw_chart"] = _f18_tw_chart()


def _f18_tw_form():
    o = []
    x0, bw, y = 30, 36, 8
    for (a, b, lab), col in zip(_f18_SONGS["tw"]["form"], (BLU, GLD, BLU)):
        xa, xb = x0 + (a - 1) * bw, x0 + b * bw
        o.append(RECT(xa + 2, y, xb - xa - 4, 30, 6, PAN, col, 1.6))
        o.append(T((xa + xb) / 2, y + 21, lab, "middle", 16, col, True))
        for k in range(a, b + 1, 2):
            xk = x0 + (k - 1) * bw
            o.append(RECT(xk + 4, y + 36, 2 * bw - 8, 18, 4, SSOFT if k in (3, 5, 7) else SCR, SIG if k in (3, 5, 7) else LIN, 1.1))
            o.append(T(xk + bw, y + 49, "%d〜%d" % (k, k + 1), "middle", 10, INK if k in (3, 5, 7) else MUT, k in (3, 5, 7)))
    sp = dict(mel="F5 F5 E5 E5 | D5 D5 C5:2 | G5 G5 F5 F5 | E5 E5 D5:2", ch="F C | G C | C F | C G")
    o1, h1, i1, n1 = _f18_chart(sp, [(1, 2)], {}, xL=96, top=y + 62, time=False, endbar=False)
    o2, h2, i2, n2 = _f18_chart(sp, [(3, 2)], {}, xL=96, top=h1 + 8, time=False, endbar=False)
    o += o1 + o2
    o.append(T(88, i1[0]["ytop"] + 21, "第 3〜4 小節", "end", 11.5, INK, True))
    o.append(T(88, i2[0]["ytop"] + 21, "第 5〜6 小節", "end", 11.5, SIG, True))
    for a_, b_ in zip(n1[:7], n1[7:]):
        xa = i1[0]["X"](a_["t"])
        ya, yb_ = _f18_yn(a_["n"], i1[0]["ytop"]) + 10, _f18_yn(b_["n"], i2[0]["ytop"]) - 7
        o.append(ARR(xa + 7, ya + 14, xa + 7, yb_, SIG, 1.2, 5))
    o.append(T(96 + _f18_barx(2) + 8, (i1[0]["ytop"] + i2[0]["ytop"]) / 2 + 26, "各音を文字 1 つ上へ", "start", 11, SIG, True))
    return SVG(560, h2 + 4, o, "きらきら星の楽式は a b a（上）。b の 2 小節（第 5〜6 小節と、同じ形の第 7〜8 小節）は、"
               "a の第 3〜4 小節の各音を文字 1 つずつ上へずらした形で、リズムも同じである（下）。")
F["e18_tw_form"] = _f18_tw_form()


# ===================== 3 節 よろこびの歌 =====================
_f18_SONGS["odes"] = dict(_f18_SONGS["ode"])
_f18_SONGS["odes"]["mel"] = _f18_SONGS["ode"]["mel"].replace("C5 D5 G4 E5~ | E5 E5 F5 G5", "C5 D5 G4:2 | E5 E5 F5 G5")


def _f18_ode_score():
    S, notes, ch = _f18_song("ode")
    hl = [(n["t"], n["d"]) for n in notes if n["d"] >= 2]
    o, h, info, notes = _f18_chart("ode", [(1, 4), (5, 4), (9, 4), (13, 4)], {"num"}, hl=hl)
    att = [n for n in notes if not n["cont"]]
    for a, b in zip(att, att[1:]):
        d = abs(b["dia"] - a["dia"]) + 1
        if d >= 3:
            r = info[(b["bar"] - 1) // 4]
            x = r["X"](b["t"] - r["t0"])
            yy = r["ytop"] - 10 - (12 if (d == 6) else 0)
            o.append(T(x, yy, "%d 度%s" % (d, "↑" if b["dia"] > a["dia"] else "↓"), "middle", 10.5, ALI, True))
    return SVG(640, h, o, "よろこびの歌の旋律（ハ長調に移したもの）。赤い文字は 3 度以上の跳躍で、全体で 4 か所しかない。"
               "金色の枠は 2 拍の長い音。第 12 小節の 4 拍目の E は、タイで第 13 小節へつながる。")
F["e18_ode_score"] = _f18_ode_score()


def _f18_ode_chart():
    o, h, info, notes = _f18_chart("ode", [(1, 4), (5, 4), (9, 4), (13, 4)], {"sym", "deg", "fn", "nct", "cad", "num"})
    return SVG(640, h, o, "よろこびの歌の和音付けの一例と、その分析。金色の音は非和声音（経過 = 経過音、先取 = 先取音）。"
               "破線の D は、I 以外の和音へ向かうドミナント（第 12 小節の V7/V）。")
F["e18_ode_chart"] = _f18_ode_chart()


def _f18_ode_cad():
    o = []
    S, notes, ch = _f18_song("ode")
    last = [i for i, n in enumerate(notes) if n["bar"] in (4, 8) and n["d"] == 2]
    y = 4
    txt = [("第 1 フレーズの最後（第 3〜4 小節）", "旋律の最後の音 D は、", "C の和音（C・E・G）に無い", "→ V（G・B・D）で止まる", "半終止", SIG),
           ("第 2 フレーズの最後（第 7〜8 小節）", "旋律の最後の音 C は、", "C の和音（C・E・G）にある", "→ I で終われる", "全終止", BLU)]
    for k, (b0, li) in enumerate(((3, last[0]), (7, last[1]))):
        o.append(T(16, y + 14, txt[k][0], "start", 12.5, INK, True))
        oo, h, info, nn = _f18_chart("ode", [(b0, 2)], {"sym", "deg", "fn", "num"}, top=y + 16, time=False,
                                    fills_extra={li: txt[k][5]}, endbar=False)
        o += oo
        r = info[0]
        xn, yn = r["X"](notes[li]["t"] - r["t0"]), _f18_yn(notes[li]["n"], r["ytop"])
        o.append(CIRC(xn, yn, 10, txt[k][5], 1.8))
        tx = r["xend"] + 22
        for j in range(3):
            o.append(T(tx, r["ytop"] + 6 + 19 * j, txt[k][1 + j], "start", 12, INK, j == 2))
        o.append(RECT(tx, r["ytop"] + 66, 70, 22, 11, PAN, txt[k][5], 1.6))
        o.append(T(tx + 35, r["ytop"] + 81.5, txt[k][4], "middle", 12, txt[k][5], True))
        y = h + 6
    return SVG(600, y, o, "第 1 フレーズと第 2 フレーズは、最後の小節の着地点だけが違う。旋律が主和音 C に含まれない D で止まると I では終われず、"
               "V で止まる半終止になる。主音 C で止まると、V7 → I の全終止で終われる。")
F["e18_ode_cad"] = _f18_ode_cad()


def _f18_ode_sync():
    o = []
    y = 4
    for k, (nm, title) in enumerate((("odes", "先取りを省いた形"), ("ode", "原曲のリズム"))):
        S, notes, ch = _f18_song(nm)
        e = [i for i, n in enumerate(notes) if n["bar"] in (12, 13) and n["n"] == "E5" and not n["cont"]][0]
        o.append(T(16, y + 14, title, "start", 12.5, INK, True))
        oo, h, info, nn = _f18_chart(nm, [(12, 2)], {"num"}, top=y + 10, time=False, fills_extra={e: SIG}, endbar=False)
        o += oo
        r = info[0]
        yg = r["ytop"] + 4 * _f18_s + 26
        for b in range(8):
            x = r["X"](b)
            on = abs(b - (notes[e]["t"] - r["t0"])) < 1e-9
            lab = ["強", "弱", "中強", "弱"][b % 4]
            o.append(T(x, yg, str(b % 4 + 1), "middle", 11.5, SIG if on else INK, True))
            o.append(T(x, yg + 15, lab, "middle", 10, SIG if on else MUT, on))
        xe = r["X"](notes[e]["t"] - r["t0"])
        o.append(W(xe, _f18_yn("E5", r["ytop"]) + 8, xe, yg - 12, c=SIG, lw=1.2, dash="3,3"))
        o.append(T(r["xend"] + 14, r["ytop"] + 20, "E は第 13 小節の 1 拍目（強拍）で鳴る" if k == 0 else "E は第 12 小節の 4 拍目（弱拍）で鳴り、",
                   "start", 11.5, INK, True))
        if k == 1:
            o.append(T(r["xend"] + 14, r["ytop"] + 38, "タイで次の強拍へつながる", "start", 11.5, INK, True))
        y = yg + 30
    return SVG(700, y, o, "第 12〜13 小節のリズムの比較。下の数字は小節の中の拍と、拍子の強弱（16 章 3 節）。"
               "原曲では、第 4 フレーズの最初の音 E が 1 拍早く弱拍で鳴り、タイで次の小節の強拍へつながる（シンコペーション）。")
F["e18_ode_sync"] = _f18_ode_sync()


def _f18_ode_form():
    o = []
    hl = [(12.0, 4), (28.0, 4), (60.0, 4)]
    oo, h, info, notes = _f18_chart("ode", [(1, 4), (5, 4), (9, 4), (13, 4)], {"num"}, xL=56)
    for (t, d) in hl:
        r = info[int(t // 16)]
        x1 = r["X"](t - r["t0"]) - 12
        o.append(RECT(x1, r["ytop"] - 8, _f18_barx(4) - _f18_barx(3) - 2, 4 * _f18_s + 16, 6, ASOFT, ALI, 1, "4,3"))
    o += oo
    for r, (a, b, lab) in zip(info, _f18_SONGS["ode"]["form"]):
        col = GLD if lab == "b" else BLU
        o.append(T(30, r["ytop"] + 23, lab, "middle", 18, col, True))
    return SVG(680, h, o, "よろこびの歌の 4 つのフレーズを縦に並べた。赤い破線の枠は、第 1 フレーズと第 2 フレーズで違う最後の小節。"
               "第 4 フレーズは第 2 フレーズと同じ旋律で（最初の E が 1 拍早く鳴ることを除く）、第 3 フレーズだけが違う旋律である。")
F["e18_ode_form"] = _f18_ode_form()


# ===================== 4 節 例 3 =====================
def _f18_ex3_score():
    S, notes, ch = _f18_song("ex3")
    acc = {i: SIG for i, n in enumerate(notes) if parse(n["n"])["acc"] != 0}
    hl = [(n["t"], n["d"]) for n in notes if n["d"] >= 2]
    o, h, info, notes = _f18_chart("ex3", [(1, 4), (5, 4), (9, 4), (13, 4)], {"num"}, fills_extra=acc, hl=hl)
    for b in (1, 5, 13):
        r = info[(b - 1) // 4]
        x1, x2 = r["X"](0) - 6, r["X"](3) + 6
        yy = r["ytop"] - 16
        o.append(W(x1, yy + 4, x1, yy, x2, yy, x2, yy + 4, c=BLU, lw=1.3))
        o.append(T((x1 + x2) / 2, yy - 4, "C D E G", "middle", 10.5, BLU, True))
    return SVG(640, h, o, "例 3（この章のための作例）の旋律。赤い音は臨時記号の付いた音（C♯・F♯・A♭）。青い括弧は、"
               "第 1・5・13 小節の始まりの同じ動機。金色の枠は 2 拍以上の長い音。")
F["e18_ex3_score"] = _f18_ex3_score()


def _f18_ex3_acc():
    o = []
    S, notes, ch = _f18_song("ex3")
    panels = [(2, "C♯", ["出てくる: 第 2 小節の 1 回だけ", "次: D へ半音上がる（Dm へ進む）", "終止: ハ長調の G7 → C"],
               "A7 = V7/IIm（セカンダリードミナント）", SIG),
              (7, "F♯", ["出てくる: 第 7・9・10 小節（F♮ は無い）", "D7 → G の終止が 2 回", "第 12 小節で F に戻る"],
               "ト長調へ転調", GLD),
              (14, "A♭", ["出てくる: 第 14 小節の 1 回だけ", "次: G へ半音下がる", "終止: ハ長調の G7 → C"],
               "Fm = IVm（借用和音、SDm）", PUR)]
    y = 4
    for b0, nm, facts, concl, col in panels:
        acc = {i: SIG for i, n in enumerate(notes) if parse(n["n"])["acc"] != 0 and b0 <= n["bar"] < b0 + 2}
        oo, h, info, nn = _f18_chart("ex3", [(b0, 2)], {"sym", "num"}, top=y, time=False, fills_extra=acc, endbar=False)
        o += oo
        r = info[0]
        tx = r["xend"] + 24
        o.append(RECT(tx - 10, y + 6, 330, h - y - 12, 8, PAN, LIN, 1.1))
        o.append(T(tx, y + 28, nm, "start", 15, SIG, True))
        for j, f in enumerate(facts):
            o.append(T(tx + 34, y + 28 + 19 * j, f, "start", 11.5, INK))
        o.append(T(tx, y + 28 + 19 * 3 + 4, "→ " + concl, "start", 12, col, True))
        y = h + 4
    return SVG(712, y, o, "例 3 の 3 つの臨時記号の比較。C♯ と A♭ は 1 回だけ現れて半音で次の音へ進み、ハ長調の終止で閉じる。"
               "F♯ は 5 小節にわたって続き、G を主和音とする終止を 2 回作る。")
F["e18_ex3_acc"] = _f18_ex3_acc()


def _f18_ex3_pivot():
    o = []
    S, notes, chords = _f18_song("ex3")
    bars = list(range(5, 14))
    x0, cw = 112, 64
    rowsy = [22, 48, 80, 118, 156, 194]
    labs = ["小節", "コードネーム", "F の音", "ハ長調で読む", "ト長調で読む", "読み方"]
    for y, lab in zip(rowsy, labs):
        o.append(T(x0 - 12, y + (4 if y > 60 else 0), lab, "end", 11.5, INK if y in (118, 156) else MUT, True))
    dia = {"C": {"C", "Dm", "Em", "F", "G", "Am", "Am7", "G7", "Dm7"}, "G": {"G", "Am", "Bm", "C", "D", "Em", "Am7", "D7", "Em7"}}
    for i, b in enumerate(bars):
        cx = x0 + i * cw + cw / 2
        o.append(T(cx, rowsy[0], str(b), "middle", 11.5, MUT, True))
        cs = [c for c in chords if c["bar"] == b]
        o.append(T(cx, rowsy[1], " ".join(_f18_sym(c["sym"]) for c in cs), "middle", 13, INK, True))
        fs = set()
        for n in notes:
            if n["bar"] == b and parse(n["n"])["letter"] == "F":
                fs.add(parse(n["n"])["acc"])
        for c in cs:
            for v in chord_parse(c["sym"])["ivs"]:
                pc = (chord_parse(c["sym"])["root_pc"] + v) % 12
                if pc == 5: fs.add(0)
                if pc == 6: fs.add(1)
        ftxt = "F♯" if fs == {1} else "F" if fs == {0} else "—"
        o.append(T(cx, rowsy[2] + 4, ftxt, "middle", 12.5, SIG if ftxt == "F♯" else (INK if ftxt == "F" else MUT), ftxt != "—"))
        for j, k in enumerate(("C", "G")):
            y = rowsy[3 + j] - 15
            ok = all(c["sym"] in dia[k] for c in cs)
            degs = []
            for c in cs:
                d = roman(c["sym"], k)
                if k == "C" and c["sym"] == "D7":
                    d = "V7/V"
                if k == "G" and c["sym"] == "G7":
                    d = "I7"
                degs.append(d)
            col, fl = (BLU, BSOFT) if k == "C" else (GLD, GOSOFT)
            o.append(RECT(cx - cw / 2 + 3, y, cw - 6, 26, 5, fl if ok else PAN, col if ok else ALI, 1.3 if ok else 1.4, None if ok else "4,3"))
            o.append(T(cx, y + 18, " ".join(degs), "middle", 11 if len(cs) > 1 else 12, INK if ok else ALI, True))
    band = [(5, 5, "ハ長調", "C"), (6, 6, "両方", "P"), (7, 10, "ト長調", "G"), (11, 11, "両方", "P"), (12, 13, "ハ長調", "C")]
    for a, b, lab, k in band:
        xa, xb = x0 + (a - 5) * cw + 3, x0 + (b - 4) * cw - 3
        c, fl = _f18_BAND[k]
        o.append(RECT(xa, rowsy[5] - 15, xb - xa, 24, 5, fl, c, 1.3, "4,3" if k == "P" else None))
        o.append(T((xa + xb) / 2, rowsy[5] + 2, lab if k != "P" else "ピボット", "middle", 11.5, c, True))
    return SVG(700, 214, o, "第 5〜13 小節の和音を、ハ長調とト長調の 2 通りで読んだ。塗った枠はその調のダイアトニックコード、赤い破線の枠は"
               "その調に無い和音。第 6 小節の Am7 と第 11 小節の G は両方の調に属し、F♯ が続く第 7〜10 小節はト長調で読む。")
F["e18_ex3_pivot"] = _f18_ex3_pivot()


def _f18_ex3_chart():
    o, h, info, notes = _f18_chart("ex3", [(1, 4), (5, 4), (9, 4), (13, 4)], {"sym", "deg", "fn", "nct", "cad", "num", "key"})
    return SVG(640, h, o, "例 3 の分析。2 つの読み方がある第 6・11 小節は、ディグリーネームを両方の調で書き（ハ = ハ長調、ト = ト長調）、"
               "機能の枠を 2 つに分けた。破線の D は V7/IIm。いちばん下の帯は、ディグリーネームを数える調。")
F["e18_ex3_chart"] = _f18_ex3_chart()


# ===================== 5 節 =====================
def _f18_goodbad():
    o = []
    y = 4
    for title, ch, col in (("悪い例: 4 分音符ごとに和音を変える（2 小節で 6 回変わる）", "C:2 F:1 C:1 | G:1 Dm:1 C:1 G:1", ALI),
                           ("良い例: 3 拍目の F・E を経過音と読む（2 小節で 2 つ）", "C | G7", GRN2)):
        sp = dict(mel="E5 E5 F5 G5 | G5 F5 E5 D5", ch=ch)
        o.append(T(16, y + 14, title, "start", 12.5, col, True))
        oo, h, info, nn = _f18_chart(sp, [(1, 2)], {"sym", "deg", "fn", "nct", "num"}, top=y + 14, time=False, endbar=False)
        o += oo
        if col == ALI:
            r = info[0]
            xg, xd = r["X"](4) - 9, r["X"](6) - 12
            yy = h - 12
            o.append(T((xg + xd) / 2 + 30, yy + 4, "D → SD（10 章 5 節の流れに合わない）", "middle", 11, ALI, True))
            o.append(ARR(r["X"](4) + 6, yy - 18, r["X"](5) - 6, yy - 18, ALI, 1.4, 6))
        y = h + 10
    return SVG(520, y, o, "よろこびの歌の第 1〜2 小節。上は旋律のすべての音を和音の音にしようとして、拍ごとに和音を変えた読み。"
               "下は 3 拍目の F・E を経過音（金色）と読んだもの。和音は C と G7 の 2 つで足り、機能の流れも T → D になる。")
F["e18_goodbad"] = _f18_goodbad()


# ===================== 6 節 =====================
def _f18_map():
    o = []
    rows = [("01 音の正体", "", "45"), ("02 音名と鍵盤と五線", "16", ""), ("03 音程", "35", ""), ("04 協和と不協和", "", "45"),
            ("05 長音階", "1", ""), ("06 短音階", "1", ""), ("07 調と五度圏", "16", ""), ("08 三和音", "3", ""),
            ("09 ダイアトニックコード", "36", ""), ("10 和音の機能", "24", ""), ("11 セブンスコードとテンション", "3", ""),
            ("12 コード進行と声部の動き", "4", ""), ("13 ノンダイアトニックコード", "46", ""), ("14 転調", "6", ""),
            ("15 モード", "", "1"), ("16 リズムと拍子", "15", ""), ("17 メロディと和音", "35", ""), ("18 1 曲を分析する", "27", "")]
    x0, cw, y0, rh = 214, 40, 64, 20
    names = ["拍子と調", "フレーズ", "和音", "機能と終止", "非和声音", "転調", "形"]
    o.append(T(16, 18, "① 拍子と調　② フレーズ　③ 和音　④ 機能と終止　⑤ 非和声音　⑥ 転調　⑦ 形", "start", 11, MUT, True))
    for j in range(7):
        cx = x0 + j * cw + cw / 2
        o.append(CIRC(cx, 44, 11, SIG, 1.4, SSOFT))
        o.append(T(cx, 48.5, str(j + 1), "middle", 12, SIG, True))
    for i, (nm, full, ring) in enumerate(rows):
        y = y0 + i * rh
        if i % 2 == 0:
            o.append(RECT(10, y - 2, x0 + 7 * cw - 4, rh, 3, SCR, "none", 0))
        o.append(T(18, y + 12, nm, "start", 11.5, INK, True))
        for j in range(7):
            cx = x0 + j * cw + cw / 2
            if str(j + 1) in full:
                o.append(CIRC(cx, y + 8, 5.5, SIG, 1.2, SIG))
            elif str(j + 1) in ring:
                o.append(CIRC(cx, y + 8, 5.5, MUT, 1.4, "none"))
    return SVG(x0 + 7 * cw + 16, y0 + len(rows) * rh + 4, o, "各章の道具が、分析の 7 つの段のどこで使われたか。塗った丸はこの章の 3 つの例で使ったもの、"
               "白抜きの丸は直接は使わなかったが、その段の理由付けに使える道具（04 章の粗さで不協和の度合いを比べる、15 章のモードで長調・短調で読めない曲を読む、など）。")
F["e18_map"] = _f18_map()
