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
        form=[(1, 4, "a"), (5, 8, "a'"), (9, 12, "b"), (13, 16, "a''")]),
}

_f18_FNC = {"T": (BLU, BSOFT), "SD": (GRN2, GSOFT), "D": (SIG, SSOFT), "SDm": (PUR, PSOFT)}
_f18_KEYJ = {"C": "ハ長調", "G": "ト長調"}


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


def _f18_sym(sym):
    return sym.replace("#", "♯").replace("b", "♭")


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


def _f18_song(name):
    """旋律・和音を読み、各和音にディグリーネーム・機能・調を付け、各音に非和声音の種類を付ける"""
    S = _f18_SONGS[name]
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
    def pcs(sym):
        p = chord_parse(sym)
        return set((p["root_pc"] + v) % 12 for v in p["ivs"])
    for i, n in enumerate(notes):
        p = parse(n["n"]); n["midi"] = p["midi"]; n["dia"] = p["dia"]
        c = chord_at(n["t"]); n["chord"] = c
        n["ct"] = p["midi"] % 12 in pcs(c["sym"])
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
            elif b["midi"] == p["midi"] and cn is not c and p["midi"] % 12 in pcs(cn["sym"]):
                n["nct"] = "先取"
    return S, notes, chords


# ---------- 分析譜の 1 行（4 小節） ----------
_f18_s = 8.5      # 五線の間隔
_f18_U = 30.0     # 1 拍の幅
_f18_G = 16.0     # 小節の間のすき間
_f18_DUR = {4.0: ("whole", False), 3.0: ("half", True), 2.0: ("half", False), 1.5: ("quarter", True),
            1.0: ("quarter", False), 0.5: ("eighth", False)}


def _f18_xs():
    return staff_start(_f18_s, 0, "4/4")


def _f18_X(rel):
    """行の始まりから rel 拍の位置（五線の左端からの x）"""
    return _f18_xs() + _f18_U * rel + _f18_G * math.floor(rel / 4 + 1e-9)


def _f18_barx(k):
    """行の k 番目の小節の終わりの小節線の x（五線の左端から）"""
    return _f18_X(4 * k) - _f18_G * 0.5 - 7


def _f18_yn(n, ytop):
    pp = parse(n)["dia"] - 30
    return ytop + 4 * _f18_s - pp * _f18_s / 2


def _f18_row(o, xL, ytop, notes, b0, nb, first, endbar, fills=None, show_time=True):
    """b0 小節目（1 から数える）から nb 小節を 1 段の五線に描く。fills は note の index → 色"""
    s = _f18_s
    t0 = 4.0 * (b0 - 1)
    items = []
    for i, n in enumerate(notes):
        if not (t0 - 1e-9 <= n["t"] < t0 + 4 * nb - 1e-9):
            continue
        rel = n["t"] - t0
        dur, dot = _f18_DUR[n["d"]]
        it = dict(x=_f18_X(rel), notes=[n["n"]], dur=dur, dot=dot, fill=(fills or {}).get(i, INK))
        if n["tie"]:
            it["tie"] = True
        if dur == "eighth":
            it["beam"] = "b%d" % math.floor(n["t"] + 1e-9)
        items.append(it)
    for k in range(1, nb + 1):
        kind = "end" if (endbar and k == nb) else True
        items.append(dict(x=_f18_barx(k) + (0.5 * s if kind == "end" else 0), bar=kind))
    w = _f18_barx(nb) + (0.6 * s if endbar else 1)
    o.append(STAFF(xL, ytop, w, s=s, clef="treble", items=items, time="4/4" if (first and show_time) else None))
    return w


def _f18_tie_half(o, x1, x2, y, up=True, col=INK):
    """行の端で切れるタイ（半分の弧）"""
    s = _f18_s
    d = -1 if up else 1
    ya = y + d * 0.55 * s
    xm = (x1 + x2) / 2
    o.append('<path d="M%g,%g Q%g,%g %g,%g Q%g,%g %g,%gZ" fill="%s"/>'
             % (x1, ya, xm, ya + d * 1.1 * s, x2, ya, xm, ya + d * 0.8 * s, x1, ya, col))


def _f18_fnbox(o, x1, x2, y, fn, sec=False, h=17, label=None):
    c, fl = _f18_FNC[fn]
    o.append(RECT(x1, y, x2 - x1, h, 4, fl, c, 1.3, "4,3" if sec else None))
    o.append(T((x1 + x2) / 2, y + h - 4.5, label or fn, "middle", 11, c, True))


def _f18_chart(name, rows, show, W=712, top=34, fills_extra=None, bar_from=1):
    """分析譜。rows は 1 段ごとの (最初の小節, 小節の数)。show に含める層:
       sym（コードネーム）deg（ディグリーネーム）fn（機能）nct（非和声音）cad（終止）key（調の帯）num（小節番号）form（フレーズの文字）"""
    S, notes, chords = _f18_song(name)
    s = _f18_s
    o = []
    xL = 16
    y = top
    nbars = max(n["bar"] for n in notes)
    rowh = 4 * s + 34 + (16 if "nct" in show else 0) + (24 if "deg" in show else 0) + (24 if "fn" in show else 0) \
        + (26 if "cad" in show else 0) + (22 if "key" in show else 0) + 8
    fills = {}
    if "nct" in show:
        for i, n in enumerate(notes):
            if n["nct"] and not n["cont"]:
                fills[i] = GLD
    fills.update(fills_extra or {})
    rowinfo = []
    for ri, (b0, nb) in enumerate(rows):
        ytop = y + 30
        t0 = 4.0 * (b0 - 1)
        X = lambda rel, xL=xL: xL + _f18_X(rel)
        endbar = (b0 + nb - 1 == nbars)
        wrow = _f18_row(o, xL, ytop, notes, b0, nb, ri == 0, endbar, fills)
        xend = xL + wrow
        # 小節番号
        if "num" in show:
            for k in range(nb):
                bx = xL + (_f18_barx(k) if k else 0)
                if k == 0:
                    o.append(T(xL + 2, ytop - 6, str(b0), "start", 9, MUT))
                else:
                    o.append(T(bx - 2, ytop - 5, str(b0 + k), "end", 9, MUT))
        # 段の端をまたぐタイ
        rn = [n for n in notes if t0 - 1e-9 <= n["t"] < t0 + 4 * nb - 1e-9]
        if rn and rn[-1]["tie"]:
            n = rn[-1]
            _f18_tie_half(o, X(n["t"] - t0) + 4, xend - 2, _f18_yn(n["n"], ytop), up=True)
        if rn and rn[0]["cont"]:
            n = rn[0]
            _f18_tie_half(o, xL + _f18_xs() - 14, X(0) - 4, _f18_yn(n["n"], ytop), up=True)
        yb = ytop + 4 * s + 12
        # 非和声音の印
        if "nct" in show:
            for n in rn:
                if n["nct"] and not n["cont"]:
                    o.append(T(X(n["t"] - t0), yb + 10, n["nct"], "middle", 10, GLD, True))
            yb += 16
        rc = [c for c in chords if t0 - 1e-9 <= c["t"] < t0 + 4 * nb - 1e-9]
        # コードネーム（五線の上）
        if "sym" in show:
            for c in rc:
                o.append(T(X(c["t"] - t0) - 4, ytop - 16, _f18_sym(c["sym"]), "start", 12.5, INK, True))
        if "deg" in show:
            for c in rc:
                x = X(c["t"] - t0) - 4
                if len(c["deg"]) == 1:
                    o.append(T(x, yb + 12, c["deg"][0], "start", 11.5, INK, True))
                else:
                    o.append(T(x, yb + 4, "%s（%s）" % (c["deg"][0], c["dkey"][0]), "start", 10, MUT, True))
                    o.append(T(x, yb + 17, "%s（%s）" % (c["deg"][1], c["dkey"][1]), "start", 10, INK, True))
            yb += 24
        if "fn" in show:
            for c in rc:
                x1 = X(c["t"] - t0) - 8
                x2 = X(c["t"] + c["d"] - t0) - 12 if c["t"] + c["d"] - t0 < 4 * nb - 1e-9 else xend - 4
                if len(c["fn"]) == 1:
                    _f18_fnbox(o, x1, x2, yb, c["fn"][0], c["sec"])
                else:
                    xm = (x1 + x2) / 2
                    _f18_fnbox(o, x1, xm - 1, yb, c["fn"][0])
                    _f18_fnbox(o, xm + 1, x2, yb, c["fn"][1])
            yb += 24
        if "cad" in show:
            for bar, lab in S.get("cad", {}).items():
                if b0 <= bar < b0 + nb:
                    k = bar - b0 + 1
                    xr = xL + _f18_barx(k) - 4
                    tw = 13 * len(lab) + 12
                    o.append(RECT(xr - tw, yb + 1, tw, 19, 9, PAN, MUT, 1.1))
                    o.append(T(xr - tw / 2, yb + 15, lab, "middle", 11, INK, True))
            yb += 26
        if "form" in show:
            for (a, b, lab) in S.get("form", []):
                if a == b0:
                    o.append(T(xL + 2, ytop - 20, lab, "start", 14, SIG, True))
        rowinfo.append(dict(ytop=ytop, xL=xL, xend=xend, b0=b0, nb=nb, X=X, yb=yb))
        y = yb + 6
    return o, y, rowinfo


def _f18_tw_chart():
    o, h, _ = _f18_chart("tw", [(1, 4), (5, 4), (9, 4)], {"sym", "deg", "fn", "cad", "num"})
    return SVG(712, h + 4, o, "きらきら星（ハ長調）の和音付けの一例と、その分析。五線の上がコードネーム、下がディグリーネームと機能"
               "（青 = T、緑 = SD、赤 = D）。フレーズの最後の 2 つの和音で終止の種類が決まる。")
F["e18_tw_chart"] = _f18_tw_chart()
