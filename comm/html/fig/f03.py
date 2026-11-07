# -*- coding: utf-8 -*-
# 03 章 フレーミングと誤り検出 の図
# フレームの中身（SLIP・COBS の符号化、CRC の値）は、本文の C のコードと同じ計算をここでも行って描く。

# ---- 計算（本文の C と同じ） ----
def _f03_slip(d):
    o = [0xC0]
    for b in d:
        if b == 0xC0: o += [0xDB, 0xDC]
        elif b == 0xDB: o += [0xDB, 0xDD]
        else: o.append(b)
    return o + [0xC0]

def _f03_cobs(d):
    out = [0]; cp = 0; code = 1; n = len(d)
    for i, b in enumerate(d):
        if b == 0:
            out[cp] = code; cp = len(out); out.append(0); code = 1
        else:
            out.append(b); code += 1
            if code == 0xFF:
                out[cp] = code; code = 1
                if i + 1 == n: return out
                cp = len(out); out.append(0)
    out[cp] = code
    return out

def _f03_crc16(d):
    c = 0xFFFF
    for b in d:
        c ^= b << 8
        for _ in range(8):
            c = ((c << 1) ^ 0x1021) & 0xFFFF if c & 0x8000 else (c << 1) & 0xFFFF
    return c

def _f03_hx(v):
    return "%02X" % v

# 色の約束（この章の図）: 区切り・同期 = GLD、長さ = PUR、ペイロード = SIG、検査の値 = GRN、詰め物 = MUT、誤り = ALI
def _f03_cell(x, y, txt, c=LIN, w=30, h=24, sz=11, tc=INK, fill=None, dash=None, b=False, mono=True):
    """1 バイトの箱（文字を中央に）。"""
    if fill is None:
        fill = PAN if c in (LIN, MUT, FNT) else soft(c)
    s = RECT(x, y, w, h, 3, fill, c, 1.2, dash)
    if txt != "":
        s += T(x + w / 2, y + h / 2 + sz * 0.36, txt, "middle", sz, tc, b, mono)
    return s

def _f03_br(x1, x2, y, c, down=True, lw=1.4):
    """括弧（down=True なら下に開いた形、つまり上にある括弧）。"""
    d = 5 if down else -5
    return W(x1, y + d, x1, y, x2, y, x2, y + d, c=c, lw=lw)

# ---- 1 節: バイトの流れには切れ目がない ----
def _f03_stream():
    o = []
    msgs = [[0x01, 0x17, 0x2D, 0x64], [0x02, 0x18, 0x30, 0x63], [0x01, 0x17, 0x2E, 0x64]]
    flat = sum(msgs, [])
    cw, chh, x0 = 38, 24, 176
    mc = [SIG, PUR, SIG]
    X = lambda i: x0 + i * cw

    def row(y, idxs, lost=None):
        s = []
        for i in idxs:
            s.append(_f03_cell(X(i) + 1, y, _f03_hx(flat[i]), mc[i // 4], w=cw - 2, h=chh))
        if lost is not None:
            s.append(RECT(X(lost) + 1, y, cw - 2, chh, 3, ASOFT, ALI, 1.2, dash="3 3"))
            s.append(W(X(lost) + 10, y + 6, X(lost) + cw - 10, y + chh - 6, c=ALI, lw=1.8))
            s.append(W(X(lost) + 10, y + chh - 6, X(lost) + cw - 10, y + 6, c=ALI, lw=1.8))
        return "".join(s)

    def dec(g):
        return ["番号 %d・温度 %d °C" % (g[0], g[1]), "湿度 %d %%・電池 %d %%" % (g[2], g[3])]

    # 送り手
    y = 34
    o.append(T(x0 - 10, y + 16, "送り手が送った列", "end", 11, INK, True))
    for k in range(3):
        o.append(_f03_br(X(4 * k) + 3, X(4 * k + 4) - 3, y - 6, mc[k], down=True))
        o.append(T((X(4 * k) + X(4 * k + 4)) / 2, y - 12, "メッセージ %d" % (k + 1), "middle", 10, mc[k], True))
    o.append(row(y, range(12)))
    o.append(T(X(12) + 8, y + 16, "…", "start", 12, MUT))

    rows = [("受け手 A", "初めから読む", 0, None, GRN),
            ("受け手 B", "2 バイト目から読む", 1, None, ALI),
            ("受け手 C", "2D を取りこぼす", 0, 2, ALI)]
    for r, (nm, sub, start, lost, c) in enumerate(rows):
        y = 104 + r * 92
        o.append(T(x0 - 10, y + 10, nm, "end", 11, INK, True))
        o.append(T(x0 - 10, y + 25, "（%s）" % sub, "end", 9.5, MUT))
        idxs = [i for i in range(start, 12) if i != lost]
        o.append(row(y, idxs, lost))
        # 受け手が 4 バイトずつ区切った組
        g = 0
        while g * 4 + 4 <= len(idxs):
            grp = idxs[g * 4: g * 4 + 4]
            vals = [flat[i] for i in grp]
            xa, xb = X(grp[0]) + 3, X(grp[-1] + 1) - 3
            ok = (c == GRN)
            o.append(_f03_br(xa, xb, y + chh + 6, c, down=False))
            for q, line in enumerate(dec(vals)):
                o.append(T((xa + xb) / 2, y + chh + 21 + q * 14, line, "middle", 9.5, c, q == 0 and not ok))
            g += 1
        if g * 4 < len(idxs):
            rest = idxs[g * 4:]
            o.append(T((X(rest[0]) + X(12)) / 2, y + chh + 21, "（続きを待つ）", "middle", 9.5, MUT))
    yb = 104 + 3 * 92 - 4
    o.append(T(20, yb, "1 バイト目 = 番号、2 バイト目 = 温度、3 バイト目 = 湿度、4 バイト目 = 電池の残り。受け手は 4 バイトずつ区切って読む。", "start", 10, MUT))
    return SVG(700, yb + 12, o, "4 バイトのメッセージを続けて送る例。受け手が読み始める位置が 1 バイトずれる（B）か、途中で 1 バイトを取りこぼす（C）と、4 バイトずつの区切りがずれ、もっともらしい誤った値を読み続ける。どれも受け手には誤りと分からない。")
F["e03_stream"] = _f03_stream()

def _f03_methods():
    o = []
    x0, y0, h = 150, 34, 28
    o.append(T(20, y0 + 18, "(a) 区切り文字", "start", 11.5, INK, True))
    segs = [("ペイロード（置き換え済み）", 168, SIG), ("C0", 34, GLD), ("ペイロード", 120, SIG), ("C0", 34, GLD), ("ペイロード", 120, SIG), ("C0", 34, GLD)]
    x = x0
    for t, w, c in segs:
        o.append(RECT(x, y0, w, h, 4, soft(c), c, 1.3))
        o.append(T(x + w / 2, y0 + h / 2 + 4, t, "middle", 10.5 if c == SIG else 11, c, True, c == GLD))
        x += w + 4
    o.append(T(x0, y0 + h + 18, "決まった値の印で、フレームの終わりを示す。同じ値がデータに現れたら置き換える（2・3 節）", "start", 10, MUT))
    y1 = y0 + 86
    o.append(T(20, y1 + 18, "(b) 長さを先に", "start", 11.5, INK, True))
    segs = [("AA 55", 50, GLD), ("長さ", 40, PUR), ("ペイロード", 130, SIG), ("検査", 40, GRN), ("AA 55", 50, GLD), ("長さ", 40, PUR), ("ペイロード", 110, SIG), ("検査", 40, GRN)]
    x = x0
    for t, w, c in segs:
        o.append(RECT(x, y1, w, h, 4, soft(c), c, 1.3))
        o.append(T(x + w / 2, y1 + h / 2 + 4, t, "middle", 10.5, c, True, t == "AA 55"))
        x += w + 2 + (8 if t == "検査" else 0)
    o.append(T(x0, y1 + h + 18, "始まりの印（同期パターン）の後に、続くバイトの数を置く（4 節）。検査の値は 5 節", "start", 10, MUT))
    y2 = y1 + 86
    o.append(T(20, y2 + 18, "(c) 時間の空き", "start", 11.5, INK, True))
    o.append(RECT(x0, y2, 190, h, 4, SSOFT, SIG, 1.3))
    o.append(T(x0 + 95, y2 + h / 2 + 4, "フレーム", "middle", 10.5, SIG, True))
    o.append(RECT(x0 + 360, y2, 160, h, 4, SSOFT, SIG, 1.3))
    o.append(T(x0 + 440, y2 + h / 2 + 4, "フレーム", "middle", 10.5, SIG, True))
    o.append(W(x0 + 190, y2 + h / 2, x0 + 360, y2 + h / 2, c=TEA, lw=1.4, dash="4 3"))
    o.append(DIM(x0 + 194, y2 - 8, x0 + 356, y2 - 8, None, c=TEA))
    o.append(T(x0 + 275, y2 - 13, "何も送らない時間", "middle", 10, TEA))
    o.append(T(x0, y2 + h + 18, "一定の時間以上の空きで区切る（Modbus RTU など）。この章では扱わない", "start", 10, MUT))
    return SVG(700, y2 + h + 30, o, "フレームの境目を示す 3 つの方法。(a) と (b) は、バイトの値だけで境目が決まる。(c) は、送り手と受け手が時間を正しく扱えることを前提にする。")
F["e03_methods"] = _f03_methods()

# ---- 2 節: SLIP ----
def _f03_delim():
    o = []
    data = [0x01, 0xC0, 0x02, 0xDB, 0x03]
    cw, x0 = 40, 196
    X = lambda i: x0 + i * cw
    y = 22
    o.append(T(x0 - 14, y + 17, "送りたいデータ", "end", 11, INK, True))
    for i, b in enumerate(data):
        o.append(_f03_cell(X(i + 2) + 2, y, _f03_hx(b), PUR if b in (0xC0, 0xDB) else SIG, w=cw - 4, h=26, sz=12))
    o.append(T(X(7) + 8, y + 17, "（0xC0 と 0xDB を含む）", "start", 10, MUT))
    # 悪い例
    y = 92
    o.append(T(20, y - 12, "悪い例: そのまま送り、最後に区切り文字 0xC0 を付ける", "start", 11, ALI, True))
    bad = data + [0xC0]
    o.append(T(x0 - 14, y + 17, "線の上の列", "end", 10.5, MUT))
    for i, b in enumerate(bad):
        c = GLD if b == 0xC0 else SIG
        o.append(_f03_cell(X(i + 2) + 2, y, _f03_hx(b), c, w=cw - 4, h=26, sz=12))
    o.append(T(x0 - 14, y + 60, "受け手が渡すフレーム", "end", 10.5, MUT))
    for (a0, vals) in ((2, [0x01]), (4, [0x02, 0xDB, 0x03])):
        for j, v in enumerate(vals):
            o.append(_f03_cell(X(a0 + j) + 2, y + 44, _f03_hx(v), ALI, w=cw - 4, h=26, sz=12))
    o.append(T(X(8) + 8, y + 54, "データの 0xC0 で切れ、", "start", 10.5, ALI, True))
    o.append(T(X(8) + 8, y + 69, "2 つに分かれる ×", "start", 10.5, ALI, True))
    # 良い例
    y = 222
    o.append(T(20, y - 12, "良い例: SLIP（0xC0 → DB DC、0xDB → DB DD と置き換え、前後に END）", "start", 11, GRN, True))
    enc = _f03_slip(data)
    o.append(T(x0 - 14, y + 17, "線の上の列", "end", 10.5, MUT))
    for i, b in enumerate(enc):
        if i in (0, len(enc) - 1):
            c = GLD
        elif b == 0xDB or (b in (0xDC, 0xDD) and enc[i - 1] == 0xDB):
            c = PUR
        else:
            c = SIG
        o.append(_f03_cell(X(i) + 2, y, _f03_hx(b), c, w=cw - 4, h=26, sz=12, b=(c == PUR)))
    o.append(_f03_br(X(2) + 3, X(4) - 3, y + 30, PUR, down=False))
    o.append(_f03_br(X(5) + 3, X(7) - 3, y + 30, PUR, down=False))
    o.append(T(X(3), y + 44, "データの 0xC0", "middle", 9.5, PUR))
    o.append(T(X(6), y + 44, "データの 0xDB", "middle", 9.5, PUR))
    o.append(T(X(0) + cw / 2, y + 44, "END", "middle", 9.5, GLD))
    o.append(T(X(8) + cw / 2, y + 44, "END", "middle", 9.5, GLD))
    o.append(T(x0 - 14, y + 78, "受け手が渡すフレーム", "end", 10.5, MUT))
    for i, b in enumerate(data):
        o.append(_f03_cell(X(i + 2) + 2, y + 62, _f03_hx(b), GRN, w=cw - 4, h=26, sz=12))
    o.append(T(X(7) + 8, y + 79, "元の 5 バイトに戻る ✓", "start", 10.5, GRN, True))
    o.append(T(20, y + 116, "データ 5 バイトが、置き換え 2 か所（+2）と END 2 つ（+2）で 9 バイトになる。", "start", 10, MUT))
    return SVG(700, y + 128, o, "区切り文字を 0xC0 としたとき、データをそのまま送ると、受け手はデータの中の 0xC0 でフレームを区切ってしまう（悪い例）。SLIP はデータの 0xC0 と 0xDB を 2 バイトの並びに置き換えて送るので、受け手は END だけを区切りとして、元のデータに戻せる（良い例）。")
F["e03_delim"] = _f03_delim()

def _f03_slip_resync():
    o = []
    p = [[0x11, 0x22], [0x33, 0xC0, 0x55], [0x66, 0x77]]
    st = []
    owner = []
    for k, q in enumerate(p):
        e = _f03_slip(q)
        st += e; owner += [k] * len(e)
    cw, x0 = 34, 168
    X = lambda i: x0 + i * cw
    fc = [SIG, PUR, SIG]

    def rx(stream, start):
        """SLIP の受信を真似て、(終わりの位置, 中身, 正しいか) の列を返す。"""
        out, buf, esc, bad = [], [], False, False
        for i in range(start, len(stream)):
            c = stream[i]
            if c == 0xC0:
                if buf and not bad and not esc:
                    out.append((i, list(buf)))
                buf, esc, bad = [], False, False
                continue
            if esc:
                esc = False
                if c == 0xDC: c = 0xC0
                elif c == 0xDD: c = 0xDB
                else: bad = True; continue
            elif c == 0xDB:
                esc = True; continue
            buf.append(c)
        return out

    rows = [("A", "途中から聞き始めた", 2, None, None),
            ("B", "DB が C0 に化けた", 0, 6, 0xC0),
            ("C", "フレーム 1 の最後の END が C4 に化けた", 0, 3, 0xC4)]
    y0 = 40
    for k in range(3):
        idx = [i for i in range(len(st)) if owner[i] == k]
        o.append(T((X(idx[0]) + X(idx[-1] + 1)) / 2, 20, "フレーム %d（%s）" % (k + 1, " ".join(_f03_hx(v) for v in p[k])), "middle", 9.5, fc[k], True))
    for r, (nm, title, start, bi, bv) in enumerate(rows):
        y = y0 + r * 104
        o.append(T(20, y + 10, nm, "start", 12, INK, True))
        o.append(T(36, y + 10, title, "start", 10.5, INK))
        s2 = list(st)
        if bi is not None:
            s2[bi] = bv
        for i, b in enumerate(s2):
            yy = y + 20
            if i < start:
                o.append(_f03_cell(X(i) + 1, yy, _f03_hx(b), FNT, w=cw - 2, tc=FNT, dash="3 3"))
                continue
            if i == bi:
                o.append(_f03_cell(X(i) + 1, yy, _f03_hx(b), ALI, w=cw - 2, b=True))
                continue
            c = GLD if b == 0xC0 else fc[owner[i]]
            o.append(_f03_cell(X(i) + 1, yy, _f03_hx(b), c, w=cw - 2))
        if start:
            o.append(ARR(X(start) + cw / 2, y + 2, X(start) + cw / 2, y + 18, c=ALI, lw=1.4, head=6))
            o.append(T(X(start) + cw / 2 + 8, y + 10, "ここから聞く", "start", 9.5, ALI, True))
        outs = rx(s2, start)
        for (end, body) in outs:
            ok = body in p
            c = GRN if ok else ALI
            txt = " ".join(_f03_hx(v) for v in body) + ("  ✓" if ok else "  ×")
            w = tw(txt, 10, True) + 12
            xc = X(end) + cw / 2
            xl = min(max(xc - w / 2, x0), X(len(st)) - w)
            o.append(W(xc, y + 46, xc, y + 56, c=c, lw=1.2))
            o.append(RECT(xl, y + 56, w, 20, 4, soft(c), c, 1.1))
            o.append(T(xl + w / 2, y + 70, txt, "middle", 10, c, True, True))
        o.append(T(x0 - 10, y + 70, "渡したフレーム", "end", 9.5, MUT))
    yb = y0 + 3 * 104 - 4
    o.append(T(20, yb, "✓ は送ったとおりのフレーム、× は送っていない（壊れた）フレーム。灰色の点線のバイトは聞いていない。", "start", 10, MUT))
    return SVG(700, yb + 12, o, "SLIP の受け手が境目を見失ったときと、バイトが壊れたときの動き。どの場合も次の END（0xC0）から後は正しく受け取れる。ただし、受け手は壊れたフレーム（×）も、正しい形のフレームとして渡してしまう。")
F["e03_slip_resync"] = _f03_slip_resync()

# ---- 3 節: COBS ----
def _f03_cobs_fig():
    o = []
    data = [0x11, 0x22, 0x00, 0x33, 0x00, 0x00, 0x44]
    enc = _f03_cobs(data)
    cw, x0 = 44, 276
    X = lambda k: x0 + k * cw
    ch = 26
    zc = TEA
    # 1 段目: データ
    y = 22
    o.append(T(x0 - 14, y + 17, "データ", "end", 11, INK, True))
    for i, b in enumerate(data):
        o.append(_f03_cell(X(i + 1) + 3, y, _f03_hx(b), zc if b == 0 else SIG, w=cw - 6, h=ch, sz=12))
    # 2 段目: 仮の 0 と場所
    y = 80
    o.append(T(x0 - 14, y + 11, "① 最後に仮の 00 を足し、", "end", 10.5, INK))
    o.append(T(x0 - 14, y + 26, "先頭に 1 バイトの場所を空ける", "end", 10.5, INK))
    o.append(_f03_cell(X(0) + 3, y, "", PUR, w=cw - 6, h=ch, dash="3 3"))
    for i, b in enumerate(data):
        o.append(_f03_cell(X(i + 1) + 3, y, _f03_hx(b), zc if b == 0 else SIG, w=cw - 6, h=ch, sz=12))
    o.append(_f03_cell(X(8) + 3, y, "00", zc, w=cw - 6, h=ch, sz=12, dash="3 3"))
    o.append(T(X(8) + cw / 2, y + ch + 13, "仮の 00", "middle", 9.5, zc))
    # 3 段目: 距離に置き換える（矢印は上側）
    y = 170
    o.append(T(x0 - 14, y + 11, "② 先頭の場所と各 00 を、", "end", 10.5, INK))
    o.append(T(x0 - 14, y + 26, "次の 00 までの距離に置き換える", "end", 10.5, INK))
    zpos = [0] + [i + 1 for i, b in enumerate(data) if b == 0] + [8]
    for a, b in zip(zpos[:-1], zpos[1:]):
        xa, xb = X(a) + cw / 2, X(b) + cw / 2
        bend = 0.32 if b - a > 1 else 0.6
        o.append(CARR(xa, y - 3, xb - 3, y - 3, bend=bend, c=PUR, lw=1.4, head=6))
        o.append(T((xa + xb) / 2, y - 3 - bend * (xb - 3 - xa) / 2 - 5, str(b - a), "middle", 10.5, PUR, True))
    for k in range(8):
        v = enc[k]
        isc = k in zpos[:-1]
        o.append(_f03_cell(X(k) + 3, y, _f03_hx(v), PUR if isc else SIG, w=cw - 6, h=ch, sz=12, b=isc))
    o.append(_f03_cell(X(8) + 3, y, "00", zc, w=cw - 6, h=ch, sz=12, dash="3 3"))
    # 4 段目: 送る列
    y = 232
    o.append(T(x0 - 14, y + 11, "③ 仮の 00 を除き、最後に", "end", 10.5, INK))
    o.append(T(x0 - 14, y + 26, "区切りの 00 を置く（送る列）", "end", 10.5, INK))
    for k in range(8):
        v = enc[k]
        isc = k in zpos[:-1]
        o.append(_f03_cell(X(k) + 3, y, _f03_hx(v), PUR if isc else SIG, w=cw - 6, h=ch, sz=12, b=isc))
    o.append(_f03_cell(X(8) + 3, y, "00", GLD, w=cw - 6, h=ch, sz=12, b=True))
    # 5 段目: 受け手（矢印は下側）
    y = 330
    o.append(T(x0 - 14, y + 11, "受け手: コードバイトの値だけ", "end", 10.5, INK))
    o.append(T(x0 - 14, y + 26, "先へ飛び、飛んだ先に 00 を戻す", "end", 10.5, INK))
    yb = 232 + ch + 3
    for a, b in zip(zpos[:-1], zpos[1:]):
        xa, xb = X(a) + cw / 2, X(b) + cw / 2
        o.append(CARR(xa, yb, xb - 3, yb, bend=-0.30 if b - a > 1 else -0.6, c=PUR, lw=1.4, head=6))
    for k in zpos[1:-1]:
        o.append(W(X(k) + cw / 2, yb + 6, X(k) + cw / 2, y - 2, c=zc, lw=1.1, dash="3 3"))
    for i, b in enumerate(data):
        o.append(_f03_cell(X(i + 1) + 3, y, _f03_hx(b), zc if b == 0 else GRN, w=cw - 6, h=ch, sz=12))
    o.append(T(X(8) + cw / 2 + 8, y + 10, "（最後の飛び先", "middle", 9, MUT))
    o.append(T(X(8) + cw / 2 + 8, y + 23, "は区切りなので", "middle", 9, MUT))
    o.append(T(X(8) + cw / 2 + 8, y + 36, "00 を出さない）", "middle", 9, MUT))
    return SVG(700, y + 44, o, "COBS の符号化（①〜③）と復号（最下段）。紫の枠がコードバイトで、値は次の 00 が何バイト先にあるかを表す。符号化した列の中には 00 が現れないので、最後の 00 を区切り文字に使える。データ 7 バイトが、区切りを除いて 8 バイトになる。")
F["e03_cobs"] = _f03_cobs_fig()

def _f03_cobs_blocks():
    o = []
    y = 34
    o.append(T(20, y + 17, "データ（311 バイト）", "start", 11, INK, True))
    x0 = 180
    o.append(RECT(x0, y, 330, 26, 4, SSOFT, SIG, 1.3))
    o.append(T(x0 + 165, y + 17, "0x00 でない 300 バイト", "middle", 10.5, SIG, True))
    o.append(_f03_cell(x0 + 334, y, "00", TEA, w=34, h=26))
    o.append(RECT(x0 + 372, y, 90, 26, 4, SSOFT, SIG, 1.3))
    o.append(T(x0 + 417, y + 17, "10 バイト", "middle", 10.5, SIG, True))
    y2 = 128
    o.append(T(20, y2 + 17, "符号化した列", "start", 11, INK, True))
    blocks = [("FF", "254 バイト", 254, 200), ("2F", "46 バイト", 46, 76), ("0B", "10 バイト", 10, 70)]
    x = x0
    xs = []
    for code, lab, nb, w in blocks:
        o.append(_f03_cell(x, y2, code, PUR, w=34, h=26, b=True))
        o.append(RECT(x + 36, y2, w, 26, 4, SSOFT, SIG, 1.3))
        o.append(T(x + 36 + w / 2, y2 + 17, lab, "middle", 10.5, SIG, True))
        xs.append((x, x + 36 + w))
        x += 36 + w + 4
    o.append(_f03_cell(x + 4, y2, "00", GLD, w=34, h=26, b=True))
    # データとブロックの対応
    o.append(W(x0, y + 28, xs[0][0], y2 - 2, c=FNT, lw=1, dash="3 3"))
    o.append(W(x0 + 254 / 300 * 330, y + 28, xs[0][1], y2 - 2, c=FNT, lw=1, dash="3 3"))
    o.append(W(x0 + 330, y + 28, xs[1][1], y2 - 2, c=FNT, lw=1, dash="3 3"))
    o.append(ARR(x0 + 351, y + 28, xs[2][0] + 17, y2 - 3, c=TEA, lw=1.5, head=6))
    o.append(T(x0 + 360, y + 52, "00 は次のコードバイトになる", "start", 9.5, TEA))
    o.append(W(x0 + 462, y + 28, xs[2][1], y2 - 2, c=FNT, lw=1, dash="3 3"))
    # 3 通りの終わり方
    labs = [("254 個たまって終わる", "コード 0xFF。後に 00 は無い"),
            ("00 の手前で終わる", "コード = 46 + 1 = 0x2F"),
            ("データの終わりで終わる", "（最後のブロック）")]
    for k, (a, b) in enumerate(labs):
        xa, xb = xs[k]
        xm = (xa + xb) / 2
        dy = 34 if k == 1 else 0
        o.append(_f03_br(xa + 2, xb - 2, y2 + 32, PUR, down=False))
        if k == 1:
            o.append(W(xm, y2 + 33, xm, y2 + 38 + dy, c=PUR, lw=1))
        o.append(T(xm, y2 + 52 + dy, a, "middle", 10, PUR, True))
        o.append(T(xm, y2 + 66 + dy, b, "middle", 9.5, MUT))
    o.append(T(20, y2 + 132, "311 バイト → 313 バイト（+2 = ⌈311/254⌉）。これに区切りの 00 を加えて送る。", "start", 10.5, INK))
    return SVG(700, y2 + 144, o, "コードバイトとそれに続く 00 でないバイトの組（ブロック）の 3 通りの終わり方。0x00 を含まずに 254 バイト続くと、コードバイト 0xFF のブロックで区切る。0xFF は 00 の置き換えではないので、その分だけ列が 1 バイト長くなる。")
F["e03_cobs_blocks"] = _f03_cobs_blocks()

def _f03_size():
    o = []
    import random as _r
    r1 = _r.Random(5)
    rnd100 = [r1.randrange(256) for _ in range(100)]
    r2 = _r.Random(2024)
    rnd1000 = [r2.randrange(256) for _ in range(1000)]
    kinds = [("文字", list((b"TEMP=23.45;HUM=45;BAT=3700;" * 4)[:100])),
             ("乱数", rnd100),
             ("0x00 だけ", [0] * 100),
             ("0xC0・0xDB だけ", [0xC0, 0xDB] * 50),
             ("乱数", rnd1000),
             ("0x00 を含まない", [(i % 255) + 1 for i in range(1000)])]
    x0, y0, bw = 220, 40, 400
    vmax = 110.0
    o.append(T(20, 24, "増えたバイト数（区切りを含む）", "start", 11, INK, True))
    o.append(LEGEND(400, 24, [(PUR, "SLIP"), (SIG, "COBS")]))
    rowh = 46
    for k, (nm, d) in enumerate(kinds):
        y = y0 + k * rowh + (14 if k >= 4 else 0)
        n = len(d)
        gs = len(_f03_slip(d)) - n
        gc = len(_f03_cobs(d)) + 1 - n
        o.append(T(x0 - 12, y + 12, nm, "end", 10.5, INK, True))
        o.append(T(x0 - 12, y + 27, "%d バイト" % n, "end", 9.5, MUT))
        for j, (g, c) in enumerate(((gs, PUR), (gc, SIG))):
            yy = y + j * 17
            w = max(1.5, bw * g / vmax)
            o.append(RECT(x0, yy, w, 14, 2, soft(c), c, 1.1))
            o.append(T(x0 + w + 6, yy + 11, "+%d" % g, "start", 10, c, True))
    yl = y0 + 4 * rowh + 2
    o.append(W(20, yl, 680, yl, c=LIN, lw=1, dash="3 3"))
    for v in (0, 50, 100):
        xx = x0 + bw * v / vmax
        o.append(W(xx, y0 - 6, xx, y0 + 6 * rowh + 14, c=GRD, lw=1))
        o.append(T(xx, y0 + 6 * rowh + 27, "+%d" % v if v else "0", "middle", 9, MUT))
    yb = y0 + 6 * rowh + 48
    o.append(T(20, yb, "n バイトのデータで、SLIP は +2〜+(n + 2)、COBS は +2〜+(⌈n/254⌉ + 1)。n ≤ 254 なら COBS はいつも +2。", "start", 10, MUT))
    return SVG(700, yb + 12, o, "SLIP と COBS で増えるバイト数の比較（区切りの 0xC0・0x00 を含む）。SLIP はデータの中の 0xC0 と 0xDB の数で大きく変わる。COBS は 100 バイトのデータならいつも 2 バイト増え、1000 バイトでも最大で 5 バイトしか増えない。")
F["e03_size"] = _f03_size()

# ---- 4 節: 長さを先に送る ----
_F03_PAY = [[0x01, 0x17, 0x2D, 0x64], [0x02, 0x18, 0x30, 0x63], [0x01, 0x17, 0x2E, 0x64]]

def _f03_lenfr(p):
    c = _f03_crc16([len(p)] + p)
    return [0xAA, 0x55, len(p)] + p + [c >> 8, c & 0xFF]

def _f03_lenframe():
    o = []
    fr = _f03_lenfr(_F03_PAY[0])
    fields = [("同期パターン", 2, GLD, "AA 55"), ("長さ", 1, PUR, "04"), ("ペイロード", 4, SIG, " ".join(_f03_hx(v) for v in fr[3:7])), ("CRC", 2, GRN, "%02X %02X" % (fr[7], fr[8]))]
    x0 = 152
    s, h = BYTES(x0, 30, fields, unit=44, h=38, sz=10.5)
    o.append(s)
    o.append(_f03_br(x0 + 2 * 44 + 2, x0 + 7 * 44 - 2, 26, MUT, down=True, lw=1.1))
    o.append(T(x0 + 4.5 * 44, 20, "CRC を計算する範囲（長さとペイロード）", "middle", 9.5, MUT))
    o.append(T(x0 + 9 * 44 + 12, 52, "計 9 バイト", "start", 10, MUT))
    # 受け手の手順
    y = 140
    o.append(T(20, y - 14, "受け手の手順", "start", 11, INK, True))
    st = [("① 同期パターン", "AA 55 を探す", GLD), ("② 長さを読む", "上限も確かめる", PUR), ("③ ペイロードと", "CRC を読む", SIG), ("④ CRC を比べる", "", GRN)]
    xs = [95, 255, 415, 575]
    for (a, b, c), x in zip(st, xs):
        o.append(RECT(x - 70, y, 140, 46, 10, soft(c), c, 1.4))
        o.append(T(x, y + (20 if b else 28), a, "middle", 11, c, True))
        if b:
            o.append(T(x, y + 36, b, "middle", 9.5, MUT))
    for x1, x2 in zip(xs[:-1], xs[1:]):
        o.append(ARR(x1 + 72, y + 23, x2 - 72, y + 23, c=MUT, lw=1.4, head=6))
    yr = y + 74
    o.append(W(575, y + 48, 575, yr, 95, yr, c=GRN, lw=1.4))
    o.append(ARR(95, yr, 95, y + 49, c=GRN, lw=1.4, head=6))
    o.append(T(335, yr - 6, "一致: ペイロードを渡して ① へ ／ 不一致: 捨てて ① へ", "middle", 10, GRN))
    return SVG(700, yr + 14, o, "長さを先に送るフレームの例（同期パターン 2 バイト、長さ 1 バイト、CRC 2 バイト）。受け手は同期パターンを探し、長さの分だけ読んで CRC を確かめる。CRC は 5 節の CRC-16/CCITT-FALSE で、上位のバイトから並べた。")
F["e03_lenframe"] = _f03_lenframe()

def _f03_len_bad():
    o = []
    st = []
    for k, p in enumerate(_F03_PAY):
        st += _f03_lenfr(p)
    cw, x0 = 25, 13
    X = lambda i: x0 + i * cw
    role = ["s", "s", "l", "p", "p", "p", "p", "c", "c"] * 3
    rc = {"s": GLD, "l": PUR, "p": SIG, "c": GRN}

    def stream(y, bad=None):
        s_ = []
        for i, b_ in enumerate(st):
            if i == bad:
                s_.append(_f03_cell(X(i) + 0.5, y, "0C", ALI, w=cw - 1, h=24, sz=10.5, b=True))
            else:
                s_.append(_f03_cell(X(i) + 0.5, y, _f03_hx(b_), rc[role[i]], w=cw - 1, h=24, sz=10.5))
        return "".join(s_)

    y = 42
    o.append(T(x0, 14, "送った列", "start", 11, INK, True))
    for k in range(3):
        o.append(_f03_br(X(9 * k) + 2, X(9 * k + 9) - 2, y - 5, SIG, down=True, lw=1.1))
        o.append(T((X(9 * k) + X(9 * k + 9)) / 2, y - 10, "フレーム %d" % (k + 1), "middle", 10, SIG, True))
    o.append(stream(y))
    e1 = 2 + 1 + 12 + 2
    for (y, good) in ((126, False), (250, True)):
        if good:
            o.append(T(x0, y - 30, "良い例: 捨てたら、同期パターンの次のバイトから探し直す（長さ 04 → 0C）", "start", 11, GRN, True))
        else:
            o.append(T(x0, y - 30, "悪い例: 読み終えた位置から探し直す（長さ 04 → 0C）", "start", 11, ALI, True))
        o.append(stream(y, bad=2))
        o.append(_f03_br(X(0) + 2, X(e1) - 2, y + 30, ALI, down=False))
        o.append(T((X(0) + X(e1)) / 2, y + 46, "12 + 2 バイトを読む → CRC が合わず捨てる", "middle", 10, ALI, True))
        ks = (1, 2) if good else (2,)
        for k in ks:
            o.append(_f03_br(X(9 * k) + 2, X(9 * k + 9) - 2, y - 4, GRN, down=True, lw=1.1))
            o.append(T((X(9 * k) + X(9 * k + 9)) / 2, y - 9, "✓ フレーム %d" % (k + 1), "middle", 10, GRN, True))
        xr = X(1) + cw / 2 if good else X(e1) + cw / 2
        o.append(ARR(xr, y + 66, xr, y + 28, c=GRN if good else ALI, lw=1.3, head=5))
        o.append(T(xr + 6, y + 64, "ここから探し直す", "start", 10, GRN if good else ALI))
        o.append(T(687, y + 84, "→ 失うのはフレーム 1 だけ" if good else "→ フレーム 1 と 2 を失う", "end", 11, GRN if good else ALI, True))
    yb = 250 + 108
    o.append(T(x0, yb, "長さが上限（たとえば 16）を超える値に化けたときは、長さを読んだ時点で捨てられる。ヘッダの CRC があれば、0C もその時点で見つかる。", "start", 10, MUT))
    return SVG(700, yb + 12, o, "1 つ目のフレームの長さが 04 から 0C に化けた例。受け手は 2 つ目のフレームの途中までを 1 つ目のフレームとして読み、CRC が合わないので捨てる。読み終えた位置から探し直すと、2 つ目のフレームの同期パターンを通り過ぎているので、壊れていない 2 つ目のフレームまで失う。")
F["e03_len_bad"] = _f03_len_bad()

# ---- 5 節: チェックサムと CRC ----
def _f03_sum():
    o = []
    cw = 40
    rows = [("(a) 1 つのバイトの中の誤り", [0x12, 0x34, 0x56], [0x12, 0x35, 0x56], "0x34 → 0x35"),
            ("(b) 2 つのバイトの入れ替え", [0x12, 0x34, 0x56], [0x34, 0x12, 0x56], "0x12 と 0x34 が入れ替わる"),
            ("(c) 打ち消し合う 2 ビットの反転", [0x12, 0x34, 0x56], [0x16, 0x30, 0x56], "ビット 2 が 0x12 では 0→1、0x34 では 1→0")]
    xs, xr = 70, 300
    for r, (title, a, b, note) in enumerate(rows):
        y = 34 + r * (96 if r < 2 else 96)
        o.append(T(20, y - 10, title, "start", 11, INK, True))
        o.append(T(xs - 8, y + 16, "送る", "end", 10, MUT))
        o.append(T(xr - 8, y + 16, "届く", "end", 10, MUT))
        for i, v in enumerate(a):
            o.append(_f03_cell(xs + i * cw, y, _f03_hx(v), SIG, w=cw - 4))
        for i, v in enumerate(b):
            ch_ = v != a[i]
            o.append(_f03_cell(xr + i * cw, y, _f03_hx(v), ALI if ch_ else SIG, w=cw - 4, b=ch_))
        sa, sb = sum(a) & 255, sum(b) & 255
        ok = sa != sb
        o.append(T(xs + 3 * cw + 6, y + 16, "和 %s" % _f03_hx(sa), "start", 10.5, INK, False))
        o.append(ARR(xs + 3 * cw + 62, y + 12, xr - 34, y + 12, c=MUT, lw=1.2, head=6))
        o.append(T(xr + 3 * cw + 6, y + 16, "和 %s" % _f03_hx(sb), "start", 10.5, INK, False))
        o.append(T(xr + 3 * cw + 70, y + 16, "気づく" if ok else "見逃す", "start", 11, GRN if ok else ALI, True))
        o.append(T(xr, y + 40, note, "start", 9.5, MUT))
        if r == 2:
            o.append(T(xs, y + 40, "0x12 = 0001 0010 → 0001 0110（+4）", "start", 9.5, ALI, False, True))
            o.append(T(xs, y + 56, "0x34 = 0011 0100 → 0011 0000（−4）", "start", 9.5, ALI, False, True))
    yb = 34 + 2 * 96 + 78
    return SVG(700, yb, o, "8 ビットの和（チェックサム）が気づく誤りと見逃す誤り。1 つのバイトの中の誤りは必ず和を変えるが、入れ替えや、増える分と減る分が打ち消し合う誤りでは和が変わらない。")
F["e03_sum"] = _f03_sum()

def _f03_longdiv(dividend, g):
    """2 を法とする多項式の割り算の筆算。(行の種類, 開始の列, ビット列) の列と余りを返す。"""
    w = list(dividend)
    L, r = len(dividend), len(g) - 1
    rows = [("div", 0, dividend)]
    i = w.index("1") if "1" in w else L
    while i <= L - len(g):
        rows.append(("sub", i, g))
        for j in range(len(g)):
            w[i + j] = "0" if w[i + j] == g[j] else "1"
        rows.append(("line", i, "-" * len(g)))
        nxt = w.index("1") if "1" in w else L
        if nxt <= L - len(g):
            rows.append(("val", nxt, "".join(w[nxt:nxt + len(g)])))
            i = nxt
        else:
            rows.append(("rem", L - r, "".join(w[L - r:])))
            break
    return rows, "".join(w[L - r:])

def _f03_crcdiv():
    o = []
    g = "1011"
    cases = [("送り手", "1101 の後に 000 を並べて割る", "1101000", None),
             ("受け手（誤りなし）", "届いた列 1101001 を割る", "1101001", None),
             ("受け手（左から 3 ビット目が反転）", "届いた列 1111001 を割る", "1111001", 2)]
    cwid = 13.5
    for k, (title, sub, dv, flip) in enumerate(cases):
        xb = 20 + k * 228
        o.append(T(xb, 22, title, "start", 11.5, [SIG, GRN, ALI][k], True))
        o.append(T(xb, 38, sub, "start", 9.5, MUT))
        rows, rem = _f03_longdiv(dv, g)
        xg = xb
        xd = xb + 6 * cwid
        y = 64
        # 割る数と括弧
        for j, ch in enumerate(g):
            o.append(T(xg + (j + 0.5) * cwid, y, ch, "middle", 12, PUR, True, True))
        o.append(T(xg + 4.5 * cwid, y, ")", "middle", 12, MUT, False, True))
        o.append(W(xd, y - 15, xd + len(dv) * cwid, y - 15, c=MUT, lw=1))
        for row in rows:
            kind, col, bits = row
            if kind == "div":
                for j, ch in enumerate(bits):
                    c = ALI if (flip is not None and j == flip) else (INK if j < 4 else (FNT if k == 0 else GRN))
                    o.append(T(xd + (j + 0.5) * cwid, y, ch, "middle", 12, c, j == flip, True))
                y += 16
            elif kind == "sub":
                for j, ch in enumerate(bits):
                    o.append(T(xd + (col + j + 0.5) * cwid, y, ch, "middle", 12, PUR, False, True))
                y += 5
            elif kind == "line":
                o.append(W(xd + col * cwid + 1, y, xd + (col + len(bits)) * cwid - 1, y, c=MUT, lw=1))
                y += 13
            elif kind == "val":
                for j, ch in enumerate(bits):
                    o.append(T(xd + (col + j + 0.5) * cwid, y, ch, "middle", 12, INK, False, True))
                y += 16
            else:
                cc = [SIG, GRN, ALI][k]
                for j, ch in enumerate(bits):
                    o.append(T(xd + (col + j + 0.5) * cwid, y, ch, "middle", 12, cc, True, True))
                o.append(T(xd + (col + 3) * cwid + 6, y, "← 余り", "start", 10, cc, True))
                y += 16
        res = [["余り 001 を 000 の代わりに付け、", "1101001 を送る"], ["余り 000 → 誤りなし"], ["余り 110（0 でない）", "→ 誤りに気づく"]][k]
        for q, line in enumerate(res):
            o.append(T(xb, 266 + q * 15, line, "start", 10, [SIG, GRN, ALI][k], True))
    o.append(T(20, 306, "割る数（生成多項式）1011 = x³ + x + 1。紫の行が、各段で XOR する割る数。", "start", 10, MUT))
    return SVG(700, 318, o, "CRC の筆算の例（生成多項式 x³ + x + 1、r = 3）。送り手はデータの後ろに 0 を 3 個並べて割り、余りを付けて送る。受け手が届いた列を割ると、誤りが無ければ余りは 0 になり、1 ビットでも反転していれば 0 にならない。")
F["e03_crcdiv"] = _f03_crcdiv()

def _f03_detect():
    o = []
    cols = [("8 ビットの和", "1 バイト"), ("CRC-8", "1 バイト"), ("CRC-16", "2 バイト"), ("CRC-32", "4 バイト")]
    # sim2.c で 1000 万回ずつ試した結果（見逃した割合）
    rows = [("1 ビットの反転", [0, 0, 0, 0]),
            ("2 ビットの反転", [0.0666, 0.000119, 0, 0]),
            ("3 ビットの反転", [0.0112, 0, 0, 0]),
            ("長さ 2〜8 のバースト", [0, 0, 0, 0]),
            ("長さ 9〜16 のバースト", [0.00441, 0.00443, 0, 0]),
            ("長さ 17〜32 のバースト", [0.0039, 0.00387, 1.78e-05, 0]),
            ("長さ 33〜64 のバースト", [0.00392, 0.00391, 1.42e-05, 0]),
            ("2 バイトの入れ替え", [1.0, 0.0039, 0, 0])]
    x0, cw, rh, y0 = 190, 122, 28, 62
    for j, (a, b) in enumerate(cols):
        xc = x0 + j * cw + cw / 2
        o.append(T(xc, 28, a, "middle", 11, INK, True))
        o.append(T(xc, 44, "（値は %s）" % b, "middle", 9.5, MUT))

    def pct(v):
        p = v * 100
        if p >= 10: return "%.0f %%" % p
        if p >= 1: return "%.1f %%" % p
        if p >= 0.1: return "%.2f %%" % p
        if p >= 0.01: return "%.3f %%" % p
        return "%.4f %%" % p

    for i, (nm, vals) in enumerate(rows):
        y = y0 + i * rh
        o.append(T(x0 - 10, y + 18, nm, "end", 10.5, INK))
        for j, v in enumerate(vals):
            x = x0 + j * cw
            c = GRN if v == 0 else (ALI if v >= 0.01 else GLD)
            o.append(RECT(x + 3, y + 2, cw - 6, rh - 4, 4, soft(c), c, 1.0))
            o.append(T(x + cw / 2, y + 18, "0" if v == 0 else pct(v), "middle", 10.5, c, True))
    yl = y0 + len(rows) * rh + 22
    o.append(LEGEND(x0, yl, [(GRN, "一度も見逃さなかった"), (GLD, "1 % 未満を見逃した"), (ALI, "1 % 以上を見逃した")]))
    o.append(T(20, yl + 22, "16 バイトの乱数のデータに値を付け、データの部分に誤りを入れて 1000 万回ずつ試した。CRC の設定は上の表のとおり。", "start", 9.5, MUT))
    o.append(T(20, yl + 37, "ビットの位置は、各バイトを MSB から並べた順番で数えた（バーストはその順番で続いたビットの範囲）。", "start", 9.5, MUT))
    return SVG(700, yl + 49, o, "誤りの形ごとに、4 つの方法が見逃した割合。8 ビットの和は 2 ビットの反転を約 7 % 見逃し、入れ替えには気づけない。CRC は長さ r 以下のバーストを必ず見つけ、それより長い誤りの見逃しも約 2⁻ʳ（CRC-8 で 0.39 %、CRC-16 で 0.0015 %）にとどまる。CRC-32 の見逃しは約 2×10⁻¹⁰ なので、1000 万回では現れない。")
F["e03_detect"] = _f03_detect()

# ---- 6 節: エンディアンと構造体 ----
def _f03_endian():
    o = []
    bs = [(0x12, PUR), (0x34, TEA), (0x56, GLD), (0x78, SIG)]
    cw = 54
    xv = 350 - 2 * cw
    y = 30
    o.append(T(xv - 14, y + 18, "値 0x12345678", "end", 11.5, INK, True))
    for i, (b, c) in enumerate(bs):
        o.append(_f03_cell(xv + i * cw + 2, y, _f03_hx(b), c, w=cw - 4, h=28, sz=13, b=True))
    o.append(T(xv + cw / 2, y - 7, "上位", "middle", 9.5, MUT))
    o.append(T(xv + 3.5 * cw, y - 7, "下位", "middle", 9.5, MUT))
    rows = [("リトルエンディアン", "下位のバイトから", [3, 2, 1, 0], 120), ("ビッグエンディアン", "上位のバイトから", [0, 1, 2, 3], 210)]
    xm = 350 - 2 * cw
    for nm, sub, order, yy in rows:
        o.append(T(xm - 14, yy + 13, nm, "end", 11, INK, True))
        o.append(T(xm - 14, yy + 28, "（%s）" % sub, "end", 9.5, MUT))
        for k, idx in enumerate(order):
            b, c = bs[idx]
            o.append(_f03_cell(xm + k * cw + 2, yy, _f03_hx(b), c, w=cw - 4, h=28, sz=13, b=True))
            o.append(T(xm + k * cw + cw / 2, yy + 44, "+%d" % k, "middle", 9.5, MUT, False, True))
    for i, (b, c) in enumerate(bs):
        k = 3 - i
        o.append(W(xv + i * cw + cw / 2, y + 30, xm + k * cw + cw / 2, 118, c=c, lw=1.1, dash="3 3"))
    return SVG(700, 270, o, "32 ビットの値 0x12345678 の 4 つのバイトの並べ方。+0〜+3 は先頭からの位置（メモリの番地、または送る順番）。")
F["e03_endian"] = _f03_endian()

def _f03_struct():
    o = []
    code = ["struct reading {", "    uint8_t  type;", "    uint32_t time_s;", "    int16_t  temp_c100;", "};"]
    for i, l in enumerate(code):
        o.append(T(20, 38 + i * 17, l.replace(" ", "\u00a0"), "start", 10.5, INK, False, True))
    o.append(T(20, 140, "type = 0x01", "start", 10, MUT, False, True))
    o.append(T(20, 156, "time_s = 86400", "start", 10, MUT, False, True))
    o.append(T(20, 172, "      (0x00015180)".replace(" ", "\u00a0"), "start", 10, MUT, False, True))
    o.append(T(20, 188, "temp_c100 = 2345", "start", 10, MUT, False, True))
    o.append(T(20, 204, "      (0x0929)".replace(" ", "\u00a0"), "start", 10, MUT, False, True))
    cw = 34
    x0 = 248
    y = 36
    o.append(T(x0, y - 12, "メモリの上（x86-64 の gcc・Cortex-M: 12 バイト）", "start", 10.5, INK, True))
    mem = [(0x01, "t"), (None, "p"), (None, "p"), (None, "p"), (0x80, "s"), (0x51, "s"), (0x01, "s"), (0x00, "s"), (0x29, "c"), (0x09, "c"), (None, "p"), (None, "p")]
    rc = {"t": PUR, "s": SIG, "c": GRN, "p": MUT}
    for i, (v, r) in enumerate(mem):
        if v is None:
            o.append(_f03_cell(x0 + i * cw + 1, y, "?", MUT, w=cw - 2, h=26, tc=FNT, fill=MSOFT, dash="3 3"))
        else:
            o.append(_f03_cell(x0 + i * cw + 1, y, _f03_hx(v), rc[r], w=cw - 2, h=26))
        o.append(T(x0 + i * cw + cw / 2, y + 40, str(i), "middle", 9, MUT, False, True))
    o.append(T(x0 + 2 * cw + cw / 2, y + 56, "詰め物 3", "middle", 9.5, MUT))
    o.append(T(x0 + 11 * cw, y + 56, "詰め物 2", "middle", 9.5, MUT))
    o.append(T(x0 + 6 * cw, y + 56, "time_s", "middle", 9.5, SIG, True))
    o.append(T(x0 + 9 * cw, y + 56, "temp", "middle", 9.5, GRN, True))
    y2 = 156
    wire = [(0x01, "t"), (0x80, "s"), (0x51, "s"), (0x01, "s"), (0x00, "s"), (0x29, "c"), (0x09, "c")]
    for i, (v, r) in enumerate(wire):
        o.append(_f03_cell(x0 + i * cw + 1, y2, _f03_hx(v), rc[r], w=cw - 2, h=26))
    o.append(W(x0 + cw / 2, y + 27, x0 + cw / 2, y2 - 1, c=PUR, lw=1.1, dash="3 3"))
    o.append(W(x0 + 6 * cw, y + 27 + 34, x0 + 3 * cw, y2 - 1, c=SIG, lw=1.1, dash="3 3"))
    o.append(W(x0 + 9 * cw, y + 27 + 34, x0 + 6 * cw, y2 - 1, c=GRN, lw=1.1, dash="3 3"))
    o.append(T(x0 + 7 * cw + 10, y2 + 11, "← 送る形（7 バイト、", "start", 10.5, INK, True))
    o.append(T(x0 + 7 * cw + 24, y2 + 26, "リトルエンディアン）", "start", 10.5, INK, True))
    o.append(T(x0, y2 + 50, "put_le32・put_le16 で組み立てる（? の詰め物の値は決まっていない）", "start", 10, MUT))
    o.append(T(20, 236, "8 ビットのマイコン向けのコンパイラには、詰め物を入れず、メモリの上でも 7 バイトにするものもある。", "start", 10, MUT))
    return SVG(700, 248, o, "構造体のメモリの上の形と、送る形。コンパイラは time_s を 4 の倍数の番地に置くために詰め物を入れ、全体の大きさも 4 の倍数にそろえる。送る形はプロトコルで決め、1 バイトずつ組み立てる。")
F["e03_struct"] = _f03_struct()

def _f03_fixed():
    o = []
    o.append(T(20, 22, "(a) 倍率 100 の固定小数点で送る（int16_t、リトルエンディアン）", "start", 11, INK, True))
    rows = [("23.45 °C", "2345", "0x0929", ["29", "09"]), ("−5.25 °C", "−525", "0xFDF3（2 の補数）", ["F3", "FD"])]
    for k, (t, iv, hx, bs) in enumerate(rows):
        y = 40 + k * 44
        o.append(RECT(30, y, 92, 28, 5, SSOFT, SIG, 1.2))
        o.append(T(76, y + 19, t, "middle", 11.5, SIG, True))
        o.append(ARR(126, y + 14, 182, y + 14, c=MUT, lw=1.3, head=6))
        o.append(T(154, y + 8, "× 100", "middle", 9.5, MUT))
        o.append(RECT(186, y, 70, 28, 5, PSOFT, PUR, 1.2))
        o.append(T(221, y + 19, iv, "middle", 11.5, PUR, True))
        o.append(ARR(260, y + 14, 296, y + 14, c=MUT, lw=1.3, head=6))
        o.append(T(302, y + 19, hx, "start", 11, INK, False, True))
        o.append(ARR(470, y + 14, 506, y + 14, c=MUT, lw=1.3, head=6))
        for j, b in enumerate(bs):
            o.append(_f03_cell(512 + j * 40, y + 1, b, GRN, w=36, h=26, sz=12, b=True))
        o.append(T(600, y + 19, "（下位から）", "start", 9.5, MUT))
    o.append(T(20, 152, "(b) 整数にするときは四捨五入する", "start", 11, INK, True))
    y = 168
    o.append(RECT(30, y, 92, 28, 5, SSOFT, SIG, 1.2))
    o.append(T(76, y + 19, "16.05 °C", "middle", 11.5, SIG, True))
    o.append(ARR(126, y + 14, 182, y + 14, c=MUT, lw=1.3, head=6))
    o.append(T(154, y + 8, "× 100", "middle", 9.5, MUT))
    o.append(T(188, y + 19, "1604.9999…", "start", 11.5, INK, False, True))
    o.append(T(188, y + 44, "（float で計算した値）", "start", 9.5, MUT))
    o.append(ARR(270, y + 20, 334, y + 36, c=ALI, lw=1.3, head=6))
    o.append(T(340, y + 42, "切り捨て → 1604（16.04 °C になる）×", "start", 10.5, ALI, True))
    o.append(ARR(270, y + 8, 334, y - 6, c=GRN, lw=1.3, head=6))
    o.append(T(340, y - 2, "四捨五入 → 1605 ✓", "start", 10.5, GRN, True))
    return SVG(700, y + 58, o, "固定小数点の例。(a) 温度に 100 を掛けた整数を int16_t で送る。負の値は 2 の補数になる。(b) 16.05 は 2 進の小数で正確に表せないので、100 を掛けた結果がわずかに小さくなる。切り捨てると 1 小さい値になる。")
F["e03_fixed"] = _f03_fixed()

# ---- 7 節: TLV ----
def _f03_tlv():
    o = []
    items = [(0x01, [0x29, 0x09], "温度 23.45 °C"), (0x02, [0x2D], "湿度 45 %"), (0x03, [0x74, 0x0E], "電池 3700 mV")]
    cw, x0 = 32, 150

    def draw(y, its, unknown=None):
        s = []
        x = x0
        for (t, v, lab) in its:
            unk = (t == unknown)
            ct = MUT if unk else SIG
            cl = MUT if unk else PUR
            cv = MUT if unk else GRN
            xa = x
            s.append(_f03_cell(x + 1, y, _f03_hx(t), ct, w=cw - 2, b=True, fill=MSOFT if unk else None)); x += cw
            s.append(_f03_cell(x + 1, y, _f03_hx(len(v)), cl, w=cw - 2, fill=MSOFT if unk else None)); x += cw
            for b in v:
                s.append(_f03_cell(x + 1, y, _f03_hx(b), cv, w=cw - 2, fill=MSOFT if unk else None)); x += cw
            s.append(_f03_br(xa + 2, x - 2, y - 5, MUT if unk else INK, down=True, lw=1.1))
            s.append(T((xa + x) / 2, y - 10, lab, "middle", 9.5, MUT if unk else INK, not unk))
            x += 8
        return "".join(s), x

    y = 40
    o.append(T(x0 - 10, y + 16, "TLV の列", "end", 11, INK, True))
    s, xe = draw(y, items)
    o.append(s)
    o.append(T(x0, y + 44, "型（T）", "start", 9.5, SIG, True))
    o.append(T(x0 + 50, y + 44, "長さ（L）", "start", 9.5, PUR, True))
    o.append(T(x0 + 110, y + 44, "値（V、リトルエンディアン）", "start", 9.5, GRN, True))
    y = 140
    o.append(T(x0 - 10, y + 10, "項目を足した列", "end", 11, INK, True))
    o.append(T(x0 - 10, y + 25, "（新しい送り手）", "end", 9.5, MUT))
    its2 = [items[0], (0x20, [0xAA, 0xBB, 0xCC], "新しい型 0x20"), items[1], items[2]]
    s, xe = draw(y, its2, unknown=0x20)
    o.append(s)
    xu = x0 + 4 * cw + 8
    o.append(CARR(xu + cw + cw / 2, y + 28, xu + 5 * cw + 2, y + 28, bend=-0.35, c=PUR, lw=1.4, head=6))
    o.append(T(xu + 3 * cw, y + 62, "古い受け手は長さ 3 を見て、値を読み飛ばす", "middle", 10, PUR, True))
    return SVG(700, y + 76, o, "センサのメッセージを TLV で表した例（11 バイト）。受け手は型を見て値の意味を知り、長さを見て次の項目の位置を知る。知らない型の項目は、長さの分だけ読み飛ばせばよい。")
F["e03_tlv"] = _f03_tlv()

def _f03_tlv_bad():
    o = []
    buf = [0x01, 0x02, 0x29, 0x09, 0x02, 0x41, 0x2D, 0x03, 0x02, 0x74, 0x0E]
    cw, x0 = 30, 150
    X = lambda i: x0 + i * cw
    role = ["t", "l", "v", "v", "t", "l", "v", "t", "l", "v", "v"]
    rc = {"t": SIG, "l": PUR, "v": GRN}
    y = 34
    o.append(T(X(0) - 10, y + 16, "届いた列", "end", 11, INK, True))
    o.append(T(X(0) - 10, y + 31, "（11 バイト）", "end", 9.5, MUT))
    for i, b in enumerate(buf):
        if i == 5:
            o.append(_f03_cell(X(i) + 1, y, "41", ALI, w=cw - 2, b=True))
        else:
            o.append(_f03_cell(X(i) + 1, y, _f03_hx(b), rc[role[i]], w=cw - 2))
    for i in range(11, 18):
        o.append(RECT(X(i) + 1, y, cw - 2, 24, 3, "none", FNT, 1.0, dash="2 3"))
    o.append(T((X(11) + X(18)) / 2, y + 16, "配列の外", "middle", 10, FNT))
    o.append(W(X(11), y - 8, X(11), y + 30, c=ALI, lw=1.2, dash="5 4"))
    o.append(T(X(11) + 4, y - 12, "列の終わり", "start", 9.5, ALI))
    o.append(T(X(5) + cw / 2, y - 6, "湿度の長さ 01 が 41（65）に化けた", "middle", 9.5, ALI, True))
    # 良い例
    y = 112
    o.append(T(20, y - 10, "良い例: 長さを残りのバイトの数と比べる（tlv_next）", "start", 11, GRN, True))
    o.append(_f03_br(X(0) + 2, X(4) - 2, y + 4, GRN, down=True, lw=1.2))
    o.append(T((X(0) + X(4)) / 2, y + 20, "温度 ✓", "middle", 10, GRN, True))
    o.append(T(X(4) + 4, y + 20, "65 > 残り 11 − 6 = 5 なので、値を読まずに止める（-1）", "start", 10, GRN, True))
    # 悪い例
    y = 168
    o.append(T(20, y - 10, "悪い例: 長さを信じて読む", "start", 11, ALI, True))
    o.append(_f03_br(X(0) + 2, X(4) - 2, y + 4, MUT, down=True, lw=1.2))
    o.append(T((X(0) + X(4)) / 2, y + 20, "温度", "middle", 10, MUT))
    o.append(W(X(11), y - 2, X(11), y + 16, c=ALI, lw=1.2, dash="5 4"))
    o.append(ARR(X(6), y + 8, X(18) + 10, y + 8, c=ALI, lw=1.8, head=7))
    o.append(T(X(6), y + 26, "値の先頭（2D）から 65 バイトを読み、配列の外へはみ出す", "start", 10, ALI, True))
    return SVG(700, y + 36, o, "長さが化けた TLV の列を読む例。長さを確かめる解析は、値が列の終わりを越えると分かった時点で止まる。長さを信じて読む解析は、受け取ったバイトの列の外（ほかの変数などの場所）を読んでしまう。")
F["e03_tlv_bad"] = _f03_tlv_bad()
