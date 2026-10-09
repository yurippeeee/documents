# 13 章 ストリーム暗号と LFSR の図（figures.py の関数・定数をそのまま使う）
# 他章のファイルと名前がぶつからないよう、この章の補助関数・定数は _c13 で始める。
# 図の数値（LFSR の出力・輪・自己相関・ChaCha20 の値）は、ここで計算して描く。

_C13B = "var(--blue)"
_C13BS = "rgba(47,111,158,.14)"


def _c13_tx(x, y, parts, a="middle", sz=12, c=INK, b=False, mono=False):
    """添字付きの文字列。parts は (文字列, "" / "sub" / "sup") の列。文字列だけなら添字なし"""
    if isinstance(parts, str):
        parts = [(parts, "")]
    o, cur = [], 0.0
    for s, k in parts:
        off = {"": 0.0, "sub": sz * 0.32, "sup": -sz * 0.42}[k]
        o.append('<tspan dy="%g" font-size="%g">%s</tspan>' % (off - cur, sz * (0.72 if k else 1), E(s)))
        cur = off
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="%s" font-weight="%s">%s</text>'
            % (x, y, a, sz, c, MONO if mono else "var(--sans)", "700" if b else "400", "".join(o)))


def _c13_s(sub, pre="s"):
    """s_{sub} の parts"""
    return [(pre, ""), (sub, "sub")]


def _c13_cells(x, y, s, cw=24, ch=26, fills=None, cols=None, tcols=None, sz=12.5, bold=None, mono=True, gap=3):
    o = []
    for i, ch_ in enumerate(s):
        f = (fills or {}).get(i, PAN)
        c = (cols or {}).get(i, LIN)
        tc = (tcols or {}).get(i, INK)
        o.append(RECT(x + i * cw, y, cw - gap, ch, 4, f, c, 1.3))
        o.append(T(x + i * cw + (cw - gap) / 2, y + ch / 2 + sz * 0.36, ch_, "middle", sz, tc,
                   bool(bold and i in bold), mono))
    return "".join(o)


def _c13_key(x, y, c, s=1.0):
    r = 5.2 * s
    o = [CIRC(x, y, r, c, 1.9 * s, PAN)]
    o.append(W(x + r, y, x + r + 15 * s, y, c=c, lw=2.1 * s))
    o.append(W(x + r + 9 * s, y, x + r + 9 * s, y + 5 * s, c=c, lw=2.1 * s))
    o.append(W(x + r + 15 * s, y, x + r + 15 * s, y + 6 * s, c=c, lw=2.1 * s))
    return "".join(o)


def _c13_xor(x, y, r=10, c=INK, fill=PAN):
    """⊕ の記号（円に十字）"""
    return (CIRC(x, y, r, c, 1.6, fill) + W(x - r * 0.62, y, x + r * 0.62, y, c=c, lw=1.6)
            + W(x, y - r * 0.62, x, y + r * 0.62, c=c, lw=1.6))


def _c13_lfsr(c, init, n):
    """漸化式 s_{k+L} = c1 s_{k+L-1} ⊕ … ⊕ cL s_k の出力 s_0 … s_{n-1}。init = [s_0, …, s_{L-1}]"""
    s = list(init)
    L = len(c)
    while len(s) < n:
        k = len(s) - L
        s.append(sum(c[i] * s[k + L - 1 - i] for i in range(L)) % 2)
    return s[:n]


def _c13_state(s, n, L):
    """時刻 n の状態を、左が新しく右が古い順の文字列で"""
    return "".join(str(s[n + L - 1 - j]) for j in range(L))


def _c13_cycles(c, start=None):
    """0 以外の状態の輪（状態の文字列のリスト）の一覧"""
    L = len(c)
    seen, res = set(), []
    order = ([start] if start else []) + [format(v, "0%db" % L) for v in range(1, 2 ** L)]
    for st in order:
        if st in seen:
            continue
        cyc, cur = [], st
        while cur not in seen:
            seen.add(cur)
            cyc.append(cur)
            bits = [int(ch) for ch in cur]          # bits[0] = 一番新しい, bits[-1] = 一番古い
            nb = sum(c[i] * bits[i] for i in range(L)) % 2
            cur = str(nb) + cur[:-1]
        res.append(cyc)
    return res


_C13_SEQ = _c13_lfsr([0, 0, 1, 1], [0, 0, 0, 1], 40)   # 2 節の実例（初期状態 s3 s2 s1 s0 = 1000）


# ---------------------------------------------------------------- 1 節
# 1. ストリーム暗号の構造
def _f13_stream():
    o = []
    o.append(T(150, 22, "送信者", "middle", 13, SIG, True))
    o.append(T(610, 22, "受信者", "middle", 13, _C13B, True))
    o.append(RECT(250, 96, 260, 64, 12, "none", LIN, 1.3, "6,4"))
    o.append(T(380, 152, "通信路", "middle", 10.5, MUT))
    for gx, kx, kdir, cx in [(90, 40, 1, 150), (550, 704, -1, 610)]:
        o.append(RECT(gx, 36, 120, 38, 8, PAN, INK, 1.5))
        o.append(T(gx + 60, 60, "生成器", "middle", 12.5, INK, True))
        o.append(_c13_key(kx - 10, 55, SIG, 0.9))
        o.append(T(kx - 2, 82, "鍵 K", "middle", 11.5, SIG, True))
        if kdir > 0:
            o.append(ARR(kx + 14, 55, gx - 3, 55, SIG, 1.4))
        else:
            o.append(ARR(kx - 16, 55, gx + 123, 55, SIG, 1.4))
        o.append(ARR(cx, 76, cx, 113, INK, 1.5))
        o.append(_c13_tx(cx + 8, 98, [("Z", ""), ("0", "sub"), (" Z", ""), ("1", "sub"), (" Z", ""), ("2", "sub"), (" …", "")], "start", 11.5, SIG))
        o.append(_c13_xor(cx, 126))
    o.append(_c13_tx(20, 131, [("P", ""), ("0", "sub"), (" P", ""), ("1", "sub"), (" …", "")], "start", 11.5, INK))
    o.append(ARR(84, 126, 137, 126, INK, 1.5))
    o.append(ARR(163, 126, 597, 126, INK, 1.5))
    o.append(_c13_tx(380, 120, [("C", ""), ("0", "sub"), (" C", ""), ("1", "sub"), (" C", ""), ("2", "sub"), (" …", "")], "middle", 11.5, INK))
    o.append(ARR(623, 126, 676, 126, INK, 1.5))
    o.append(_c13_tx(682, 131, [("P", ""), ("0", "sub"), (" P", ""), ("1", "sub"), (" …", "")], "start", 11.5, _C13B))
    # ビットの例
    P, Z = "01000001", "10110100"
    Cc = "".join("1" if a != b else "0" for a, b in zip(P, Z))
    def ex(x0, rows):
        for r, (lab, s, c) in enumerate(rows):
            y = 186 + r * 20
            o.append(T(x0, y, lab, "end", 11.5, c, True))
            o.append(T(x0 + 8, y, " ".join(s), "start", 12, c, False, True))
        o.append(W(x0 - 26, 191 + 20, x0 + 120, 191 + 20, c=INK, lw=1))
    ex(110, [("P", P, INK), ("⊕ Z", Z, SIG), ("C", Cc, INK)])
    ex(570, [("C", Cc, INK), ("⊕ Z", Z, SIG), ("P", P, _C13B)])
    return SVG(760, 252, o, "ストリーム暗号。送信者と受信者は同じ鍵 K から同じ鍵ストリーム Z を作り、平文と 1 ビットずつ XOR する。"
               "下は 8 ビットの例。")
F["e13_stream"] = _f13_stream()


# 2. 鍵ストリームの再利用とクリブ・ドラッギング
def _f13_reuse():
    o = []
    P, Q = "ATTACK AT DAWN", "RETREAT AT SIX"
    X = [ord(a) ^ ord(b) for a, b in zip(P, Q)]
    crib, j = " AT ", 6
    R = [X[j + i] ^ ord(crib[i]) for i in range(len(crib))]
    x0, cw = 196, 38
    vis = lambda ch: "␣" if ch == " " else ch
    for i in range(len(P)):
        o.append(T(x0 + i * cw + 17, 22, str(i), "middle", 10, MUT, False, True))
    o.append(RECT(x0 - 190, 32, 190 + 14 * cw + 6, 74, 10, "none", MUT, 1.2, "5,4"))
    o.append(T(x0 + 14 * cw - 4, 47, "攻撃者には見えない", "end", 10.5, MUT))
    def row(y, lab, vals, fills=None, cols=None, tcol=INK, sz=12.5, labc=MUT):
        o.append(T(x0 - 12, y + 18, lab, "end", 12, labc, True))
        o.append(_c13_cells(x0, y, vals, cw, 26, fills, cols, None, sz))
    hlj = set(range(j, j + 4))
    row(52, "平文 P", [vis(ch) for ch in P], {i: _C13BS for i in hlj}, {i: _C13B for i in hlj})
    row(80, "平文 P′", [vis(ch) for ch in Q], {i: SSOFT for i in hlj}, {i: SIG for i in hlj})
    row(122, "C ⊕ C′ = P ⊕ P′", ["%02x" % v for v in X], None, None, INK, 11.5, INK)
    o.append(T(x0 - 12, 166, "推測「␣AT␣」を位置 6 に", "end", 12, _C13B, True))
    o.append(_c13_cells(x0 + j * cw, 148, [vis(ch) for ch in crib], cw, 26, {i: _C13BS for i in range(4)},
                        {i: _C13B for i in range(4)}, None, 12.5))
    o.append(W(x0 + j * cw - 4, 180, x0 + (j + 4) * cw, 180, c=INK, lw=1.2))
    o.append(T(x0 - 12, 202, "XOR した結果", "end", 12, SIG, True))
    o.append(_c13_cells(x0 + j * cw, 186, [vis(chr(v)) for v in R], cw, 26, {i: SSOFT for i in range(4)},
                        {i: SIG for i in range(4)}, None, 12.5, set(range(4))))
    o.append(T(x0 + (j + 4) * cw + 8, 204, "← 読める文字列", "start", 12, SIG, True))
    o.append(T(20, 240, "推測「␣AT␣」は P の位置 6〜9 に合っていたので、結果は P′ の位置 6〜9 の文字列「T␣AT」になった。", "start", 12, INK))
    o.append(T(20, 260, "推測が合わない位置では、多くの場合 ASCII の英字や空白にならない値が混ざる。", "start", 12, INK))
    return SVG(760, 276, o, "同じ鍵ストリームで暗号化した 2 つの暗号文の XOR（16 進）は、平文どうしの XOR に等しい。"
               "ここに推測した語を XOR すると、もう一方の平文の断片が現れる。")
F["e13_reuse"] = _f13_reuse()


# 3. IV で鍵ストリームを変える（ChaCha20 で計算）
def _c13_chacha_block(key, counter, nonce):
    import struct
    M = 0xffffffff
    rot = lambda v, n: ((v << n) | (v >> (32 - n))) & M
    def qr(s, a, b, c, d):
        s[a] = (s[a] + s[b]) & M; s[d] ^= s[a]; s[d] = rot(s[d], 16)
        s[c] = (s[c] + s[d]) & M; s[b] ^= s[c]; s[b] = rot(s[b], 12)
        s[a] = (s[a] + s[b]) & M; s[d] ^= s[a]; s[d] = rot(s[d], 8)
        s[c] = (s[c] + s[d]) & M; s[b] ^= s[c]; s[b] = rot(s[b], 7)
    st = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574] + list(struct.unpack("<8I", key)) + [counter] + \
        list(struct.unpack("<3I", nonce))
    w = st[:]
    for _ in range(10):
        qr(w, 0, 4, 8, 12); qr(w, 1, 5, 9, 13); qr(w, 2, 6, 10, 14); qr(w, 3, 7, 11, 15)
        qr(w, 0, 5, 10, 15); qr(w, 1, 6, 11, 12); qr(w, 2, 7, 8, 13); qr(w, 3, 4, 9, 14)
    return b"".join(struct.pack("<I", (w[i] + st[i]) & M) for i in range(16))


def _c13_txc(x, y, segs, a="start", sz=12, mono=True):
    """色の違う部分を含む 1 行の文字列。segs は (文字列, 色, 太字) の列"""
    o = "".join('<tspan fill="%s" font-weight="%s">%s</tspan>' % (c, "700" if bb else "400", E(t)) for t, c, bb in segs)
    return ('<text x="%g" y="%g" text-anchor="%s" font-size="%g" font-family="%s">%s</text>'
            % (x, y, a, sz, MONO if mono else "var(--sans)", o))


def _f13_iv():
    o = []
    key = bytes(range(32))
    ivs = ["000000000000004a00000000", "000000000000004b00000000"]
    zs = [_c13_chacha_block(key, 0, bytes.fromhex(v))[:6] for v in ivs]
    for r, (iv, z) in enumerate(zip(ivs, zs)):
        y = 22 + r * 70
        o.append(RECT(20, y, 96, 40, 8, SSOFT, SIG, 1.4))
        o.append(_c13_key(36, y + 20, SIG, 0.85))
        o.append(T(78, y + 25, "鍵 K", "middle", 12, SIG, True))
        o.append(RECT(120, y, 236, 40, 8, _C13BS, _C13B, 1.4))
        o.append(_c13_tx(130, y + 16, [("IV", ""), (str(r + 1), "sub"), ("（ノンス、12 バイト）", "")], "start", 11, _C13B, True))
        o.append(_c13_txc(130, y + 33, [(iv[:14], INK, False), (iv[14:16], ALI, True), (iv[16:], INK, False)], "start", 11.5))
        o.append(ARR(358, y + 20, 384, y + 20, MUT, 1.5))
        o.append(RECT(386, y, 96, 40, 8, PAN, INK, 1.5))
        o.append(T(434, y + 25, "生成器", "middle", 12.5, INK, True))
        o.append(ARR(484, y + 20, 508, y + 20, MUT, 1.5))
        nm = "Z" if r == 0 else "Z′"
        o.append(T(514, y + 25, "%s = %s …" % (nm, " ".join("%02x" % b for b in z)), "start", 13, ALI if r else SIG, True, True))
    o.append(T(20, 150, "鍵 K は同じで、IV は 1 バイト（赤）しか違わないが、鍵ストリームはまったく違う。", "start", 12, INK))
    o.append(RECT(20, 166, 336, 30, 6, PAN, LIN, 1.2))
    o.append(RECT(20, 166, 120, 30, 6, _C13BS, _C13B, 1.3))
    o.append(_c13_tx(80, 186, [("IV", ""), ("1", "sub"), ("（公開）", "")], "middle", 11.5, _C13B, True))
    o.append(T(248, 186, "暗号文 C", "middle", 11.5, INK, True))
    o.append(T(366, 186, "← 送るもの。IV は暗号文と一緒に送ってよい", "start", 11.5, MUT))
    return SVG(760, 210, o, "IV だけを変えた 2 つの鍵ストリーム（先頭 6 バイト、16 進）。生成器は 5 節の ChaCha20"
               "（鍵 00 01 … 1f、ブロック番号 0）で計算した。")
F["e13_iv"] = _f13_iv()


# ---------------------------------------------------------------- 2 節
# 4. LFSR の回路（一般形）
def _f13_circuit():
    o = []
    xs = [170, 264, 358, 452, 546]
    w, y0, h = 78, 64, 42
    labs = [("n+L−1", 0), ("n+L−2", 0), (None, 0), ("n+1", 0), ("n", 0)]
    taps = [("1", ""), ("2", ""), (None, ""), ("L−1", ""), ("L", "")]
    o.append(ARR(190, 40, 600, 40, MUT, 1.4))
    o.append(T(395, 33, "1 クロックで全体が右へ 1 つずれる", "middle", 11.5, MUT))
    for k, x in enumerate(xs):
        if labs[k][0] is None:
            o.append(T(x + w / 2, y0 + 26, "⋯", "middle", 16, MUT, True))
            o.append(T(x + w / 2, 142, "⋯", "middle", 16, MUT, True))
            continue
        o.append(RECT(x, y0, w, h, 6, PAN, INK, 1.6))
        o.append(_c13_tx(x + w / 2, y0 + 26, _c13_s(labs[k][0]), "middle", 14, INK, True))
        cx = x + w / 2
        o.append(W(cx, y0 + h, cx, 124, c=INK, lw=1.4))
        o.append(RECT(cx - 24, 124, 48, 26, 6, SSOFT, SIG, 1.4))
        o.append(_c13_tx(cx, 142, [("× c", ""), (taps[k][0], "sub")], "middle", 12, SIG, True))
    # XOR の列（右から左へ）
    yb = 196
    xor_x = [xs[0] + w / 2, xs[1] + w / 2, xs[3] + w / 2]
    for x in xor_x:
        o.append(W(x, 150, x, yb - 10, c=INK, lw=1.4))
        o.append(_c13_xor(x, yb))
    xr = xs[4] + w / 2
    o.append(W(xr, 150, xr, yb, c=INK, lw=1.4))
    o.append(ARR(xr, yb, xor_x[2] + 12, yb, INK, 1.4))
    o.append(W(xor_x[2] - 10, yb, xs[3] - 6, yb, c=INK, lw=1.4))
    o.append(W(xs[3] - 6, yb, xs[2] + 14, yb, c=INK, lw=1.4, dash="4,4"))
    o.append(ARR(xs[2] + 14, yb, xor_x[1] + 12, yb, INK, 1.4))
    o.append(ARR(xor_x[1] - 10, yb, xor_x[0] + 12, yb, INK, 1.4))
    # 帰還
    o.append(PL([(xor_x[0] - 10, yb), (112, yb), (112, y0 + h / 2)], ALI, 1.8))
    o.append(ARR(112, y0 + h / 2, xs[0] - 2, y0 + h / 2, ALI, 1.8))
    o.append(_c13_tx(104, 128, [("新しいビット", "")], "end", 11.5, ALI, True))
    o.append(_c13_tx(104, 146, _c13_s("n+L"), "end", 13, ALI, True))
    o.append(T(104, 162, "を左端へ", "end", 11.5, ALI, True))
    # 出力
    o.append(ARR(xs[4] + w + 2, y0 + h / 2, 714, y0 + h / 2, _C13B, 1.8))
    o.append(T(672, y0 + h / 2 - 8, "出力", "middle", 11.5, _C13B, True))
    o.append(_c13_tx(672, y0 + h / 2 + 22, _c13_s("n"), "middle", 13, _C13B, True))
    o.append(_c13_tx(380, 234, [("c", ""), ("i", "sub"), (" = 1 の位置（タップ）のビットだけが XOR に入る。c", ""), ("i", "sub"),
                                (" = 0 なら、その線は切れているのと同じ", "")], "middle", 11.5, INK))
    return SVG(760, 248, o, "長さ L の LFSR。状態は左が新しく右が古い順に並ぶ。右端のビットを出力し、"
               "タップの位置のビットの XOR を左端に入れる。")
F["e13_circuit"] = _f13_circuit()


# 5. 実例の最初の 4 クロック
def _f13_steps():
    o = []
    s = _C13_SEQ
    x0, cw = 128, 36
    heads = ["n+3", "n+2", "n+1", "n"]
    for i, hd in enumerate(heads):
        o.append(_c13_tx(x0 + i * cw + 16, 26, _c13_s(hd), "middle", 12, MUT, True))
    o.append(T(x0 + 4 * cw + 26, 26, "出力", "start", 11.5, _C13B, True))
    o.append(T(x0 + 4 * cw + 140, 26, "新しいビット（右から 2 番目と右端の XOR）", "start", 11.5, SIG, True))
    sub = "₀₁₂₃₄₅₆₇₈₉"
    for n in range(5):
        y = 40 + n * 48
        st = _c13_state(s, n, 4)
        o.append(T(40, y + 20, "n = %d" % n, "start", 12, INK, True))
        fills = {2: SSOFT, 3: SSOFT} if n < 4 else {}
        cols = {2: SIG, 3: SIG} if n < 4 else {}
        if n > 0:
            fills[0] = ASOFT; cols[0] = ALI
        o.append(_c13_cells(x0, y, st, cw, 30, fills, cols, None, 14, None))
        if n < 4:
            o.append(ARR(x0 + 4 * cw, y + 15, x0 + 4 * cw + 22, y + 15, _C13B, 1.4))
            o.append(T(x0 + 4 * cw + 26, y + 20, str(s[n]), "start", 14, _C13B, True, True))
            a, b, r = s[n + 1], s[n], s[n + 4]
            o.append(T(x0 + 4 * cw + 140, y + 20, "s%s ⊕ s%s = %d ⊕ %d = %d" % (sub[n + 1], sub[n], a, b, r),
                       "start", 13, SIG, True, True))
            o.append(T(x0 + 4 * cw + 330, y + 20, "→ 次の左端（s%s）" % sub[n + 4], "start", 11.5, ALI))
    o.append(T(40, 300, "塗りつぶしたマスがタップ（右から 2 番目と右端）。赤い枠は、前の時刻に計算して左端に入ったビット。", "start", 11.5, INK))
    o.append(T(40, 320, "出力列はここまでで 0, 0, 0, 1 となる。", "start", 11.5, INK))
    return SVG(760, 334, o, "漸化式 s<sub>n+4</sub> = s<sub>n+1</sub> ⊕ s<sub>n</sub>、初期状態 1000 の LFSR を 4 クロック進めた。"
               "各時刻で右端を出力し、全体を右へずらして、計算したビットを左端に入れる。")
F["e13_steps"] = _f13_steps()


# 6. 特性多項式（タップと多項式の項の対応）
def _f13_charpoly():
    o = []
    xs = [110, 210, 290, 370, 450]
    w = 66
    names = ["n+4", "n+3", "n+2", "n+1", "n"]
    terms = [[("x", ""), ("4", "sup")], [("x", ""), ("3", "sup")], [("x", ""), ("2", "sup")], [("x", "")], [("1", "")]]
    coef = [None, ("1", 0), ("2", 0), ("3", 1), ("4", 1)]
    o.append(T(xs[0] + w / 2, 30, "新しいビット", "middle", 11, ALI, True))
    o.append(T((xs[1] + xs[4] + w) / 2, 30, "時刻 n の状態", "middle", 11, MUT, True))
    for k, x in enumerate(xs):
        tap = coef[k] and coef[k][1] == 1
        if k == 0:
            o.append(RECT(x, 40, w, 38, 6, ASOFT, ALI, 1.5, "5,3"))
        else:
            o.append(RECT(x, 40, w, 38, 6, SSOFT if tap else PAN, SIG if tap else INK, 1.5))
        o.append(_c13_tx(x + w / 2, 65, _c13_s(names[k]), "middle", 14, ALI if k == 0 else INK, True))
        o.append(ARR(x + w / 2, 84, x + w / 2, 104, MUT, 1.2, 5))
        o.append(_c13_tx(x + w / 2, 124, terms[k], "middle", 16, ALI if k == 0 else (SIG if tap else MUT), True))
        if k == 0:
            o.append(T(x + w / 2, 152, "係数 1", "middle", 12, ALI, True))
        else:
            o.append(_c13_tx(x + w / 2, 152, [("c", ""), (coef[k][0], "sub"), (" = %d" % coef[k][1], "")], "middle", 12,
                             SIG if tap else MUT, True))
    o.append(T(560, 64, "s の添字 n + j を", "start", 12, INK))
    o.append(T(560, 84, "x の指数 j に置き換える", "start", 12, INK))
    o.append(_c13_tx(560, 124, [("x", ""), ("L−i", "sup"), (" の係数が c", ""), ("i", "sub")], "start", 12, INK))
    o.append(_c13_tx(380, 196, [("s", ""), ("n+4", "sub"), (" ⊕ s", ""), ("n+1", "sub"), (" ⊕ s", ""), ("n", "sub"),
                                (" = 0", "")], "end", 15, INK, True))
    o.append(T(400, 196, "↔", "middle", 16, MUT, True))
    o.append(_c13_tx(420, 196, [("f(x) = x", ""), ("4", "sup"), (" + x + 1", "")], "start", 15, SIG, True))
    return SVG(760, 214, o, "2 節の実例（c₁ = c₂ = 0、c₃ = c₄ = 1）の特性多項式。タップの位置（塗りつぶしたマス）が、"
               "係数 1 の項になる。")
F["e13_charpoly"] = _f13_charpoly()


# 7. 状態の輪（3 つの特性多項式）
def _f13_cycles():
    o = []
    cases = [("x⁴ + x + 1（原始多項式）: 15 個が 1 つの輪", SIG, [0, 0, 1, 1], "1000"),
             ("x⁴ + x³ + x² + x + 1（既約だが原始でない）: 長さ 5 の輪が 3 つ", _C13B, [1, 1, 1, 1], "1000"),
             ("x⁴ + x² + 1 = (x² + x + 1)²（可約）: 長さ 6, 6, 3 の輪", ALI, [0, 1, 0, 1], "1000")]
    nw, sp, gap = 34, 44, 22
    for r, (title, col, c, start) in enumerate(cases):
        y = 34 + r * 98
        o.append(T(20, y, title, "start", 12.5, col, True))
        cyc = _c13_cycles(c, start)
        cyc.sort(key=lambda q: -len(q))
        tot = sum(len(q) for q in cyc) * sp + (len(cyc) - 1) * gap - (sp - nw)
        x = (760 - tot) / 2
        for q in cyc:
            xs = [x + i * sp for i in range(len(q))]
            for i, st in enumerate(q):
                o.append(RECT(xs[i], y + 14, nw, 24, 5, PAN, col, 1.4))
                o.append(T(xs[i] + nw / 2, y + 30.5, st, "middle", 11, INK, False, True))
                if i < len(q) - 1:
                    o.append(ARR(xs[i] + nw + 1, y + 26, xs[i + 1] - 1, y + 26, col, 1.2, 4.5))
            xl, xf = xs[-1] + nw / 2, xs[0] + nw / 2
            o.append(PL([(xl, y + 39), (xl, y + 52), (xf, y + 52)], col, 1.2))
            o.append(ARR(xf, y + 52, xf, y + 40, col, 1.2, 4.5))
            o.append(T((xl + xf) / 2, y + 66, "長さ %d" % len(q), "middle", 10.5, col, True))
            x = xs[-1] + nw + gap
    return SVG(760, 316, o, "長さ 4 の LFSR で、0 以外の 15 個の状態が更新でどう移るか。状態は左が新しく右が古い順。"
               "各輪の最後の状態の次は、輪の先頭の状態に戻る。")
F["e13_cycles"] = _f13_cycles()


# 8. ずらす操作 E と f(E)s = 0
def _f13_shiftop():
    o = []
    s = _C13_SEQ
    n = 12
    x0, cw = 250, 36
    for k in range(n):
        o.append(T(x0 + k * cw + 16, 22, str(k), "middle", 10.5, MUT, False, True))
    o.append(T(x0 - 14, 22, "n", "end", 11, MUT, True))
    rows = [([("s（第 n 項は s", ""), ("n", "sub"), ("）", "")], [s[k] for k in range(n)], INK, None),
            ([("Es（第 n 項は s", ""), ("n+1", "sub"), ("）", "")], [s[k + 1] for k in range(n)], INK, None),
            ([("E", ""), ("4", "sup"), ("s（第 n 項は s", ""), ("n+4", "sub"), ("）", "")], [s[k + 4] for k in range(n)], INK, None)]
    for r, (lab, vals, c, _) in enumerate(rows):
        y = 32 + r * 34
        o.append(_c13_tx(x0 - 14, y + 18, lab, "end", 12, INK, True))
        o.append(_c13_cells(x0, y, [str(v) for v in vals], cw, 26, None, None, None, 13))
    y = 32 + 3 * 34 + 8
    o.append(W(x0 - 4, y - 4, x0 + n * cw, y - 4, c=INK, lw=1.4))
    tot = [str((s[k] + s[k + 1] + s[k + 4]) % 2) for k in range(n)]
    o.append(_c13_tx(x0 - 14, y + 18, [("E", ""), ("4", "sup"), ("s + Es + s", "")], "end", 12, SIG, True))
    o.append(_c13_cells(x0, y, tot, cw, 26, {k: SSOFT for k in range(n)}, {k: SIG for k in range(n)}, None, 13))
    # ずらしの例（s の 4 番目の項が Es では 3 番目に来る）
    o.append(ARR(x0 + 4 * cw + 16, 60, x0 + 3 * cw + 20, 66, ALI, 1.3, 5))
    o.append(_c13_tx(380, 198, [("f(x) = x", ""), ("4", "sup"), (" + x + 1 なので、f(E)s = E", ""), ("4", "sup"),
                                ("s + Es + s。どの列も XOR が 0（漸化式 s", ""), ("n+4", "sub"), (" = s", ""), ("n+1", "sub"),
                                (" ⊕ s", ""), ("n", "sub"), ("）", "")], "middle", 12, INK))
    return SVG(760, 214, o, "2 節の実例の出力列 s（000100110101…）を、E で 1 個・4 個ずらした数列と並べた"
               "（赤の矢印: s の第 4 項が、Es では第 3 項に来る）。各列で 3 つを XOR すると 0 になる。これが f(E)s = 0 の意味である。")
F["e13_shiftop"] = _f13_shiftop()


# 9. M 系列の性質（連・自己相関）
def _f13_mseq():
    o = []
    s = _C13_SEQ[:15]
    N = 15
    x0, cw = 140, 32
    # ① 連
    o.append(T(20, 22, "① 連（同じ値が続く区間）", "start", 12.5, INK, True))
    o.append(T(x0 - 12, 50, "s", "end", 13, INK, True))
    o.append(_c13_cells(x0, 32, [str(v) for v in s], cw, 26, None, None, None, 13))
    runs, i = [], 0
    while i < N:
        j = i
        while j + 1 < N and s[j + 1] == s[i]:
            j += 1
        runs.append((i, j))
        i = j + 1
    for k, (a, b) in enumerate(runs):
        col = SIG if s[a] == 1 else _C13B
        o.append(W(x0 + a * cw + 2, 64, x0 + b * cw + cw - 5, 64, c=col, lw=3))
        o.append(T((x0 + a * cw + x0 + b * cw + cw - 3) / 2, 80, str(b - a + 1), "middle", 11, col, True))
    o.append(T(x0 + N * cw + 10, 46, "1 が 8 個", "start", 11.5, SIG, True))
    o.append(T(x0 + N * cw + 10, 64, "0 が 7 個", "start", 11.5, _C13B, True))
    o.append(T(x0, 100, "連は 8 個: 長さ 1 が 4 個、長さ 2 が 2 個、長さ 3 と 4 が 1 個ずつ（下の数字が連の長さ）", "start", 11.5, INK))
    # ② d = 1 の比較
    o.append(T(20, 134, "② 1 ビットずらして比べる（d = 1）", "start", 12.5, INK, True))
    t = s[1:] + s[:1]
    o.append(T(x0 - 12, 162, "s", "end", 13, INK, True))
    o.append(_c13_cells(x0, 144, [str(v) for v in s], cw, 26, None, None, None, 13))
    o.append(T(x0 - 12, 192, "1 ずらした列", "end", 11.5, INK, True))
    o.append(_c13_cells(x0, 174, [str(v) for v in t], cw, 26, {N - 1: SCR}, {N - 1: MUT}, None, 13))
    agree = 0
    for k in range(N):
        same = s[k] == t[k]
        agree += same
        o.append(T(x0 + k * cw + 14.5, 220, "=" if same else "×", "middle", 13, SIG if same else ALI, True))
    o.append(T(x0 - 12, 220, "一致?", "end", 11.5, MUT, True))
    o.append(T(x0, 244, "一致 %d 個 − 不一致 %d 個 = %d" % (agree, N - agree, 2 * agree - N), "start", 12, INK, True))
    # ③ 自己相関
    o.append(T(20, 278, "③ ずらす量 d ごとの「一致 − 不一致」", "start", 12.5, INK, True))
    base, sc = 352, 3.2
    o.append(W(x0 - 6, base, x0 + N * cw, base, c=LIN, lw=1.2))
    for d in range(N):
        u = s[d:] + s[:d]
        a = sum(1 if p == q else -1 for p, q in zip(s, u))
        hh = a * sc
        xx = x0 + d * cw + 6
        if a > 0:
            o.append(RECT(xx, base - hh, cw - 14, hh, 2, SSOFT, SIG, 1.2))
            o.append(T(xx + (cw - 14) / 2, base - hh - 5, str(a), "middle", 11, SIG, True))
        else:
            o.append(RECT(xx, base, cw - 14, -hh, 1, ASOFT, ALI, 1.2))
            o.append(T(xx + (cw - 14) / 2, base + 18, str(a), "middle", 10.5, ALI, True))
        o.append(T(xx + (cw - 14) / 2, base + 34, str(d), "middle", 10, MUT, False, True))
    o.append(T(x0 - 12, base + 34, "d", "end", 11, MUT, True))
    o.append(T(x0 + N * cw + 10, base - 6, "d = 0 だけ 15、", "start", 11.5, INK))
    o.append(T(x0 + N * cw + 10, base + 12, "ほかはすべて −1", "start", 11.5, INK))
    return SVG(760, 398, o, "M 系列 000100110101111（2 節の実例、周期 15）の性質。ずらした列は、はみ出した分を先頭に回して作る"
               "（② の灰色のマス）。")
F["e13_mseq"] = _f13_mseq()


# ---------------------------------------------------------------- 3 節
_C13_HI = "".join(format(ord(ch), "08b") for ch in "Hi!")
_C13_Z24 = "".join(str(v) for v in _C13_SEQ[:24])
_C13_C24 = "".join("1" if a != b else "0" for a, b in zip(_C13_HI, _C13_Z24))


def _c13_bitrow(x0, y, bits, cw, known=None, fill=None, col=None, tcol=INK, unknown="?"):
    """24 ビットを 8 ビットずつ間を空けて描く。known に含まれない位置は unknown の文字で描く"""
    o = []
    for i, b in enumerate(bits):
        x = x0 + i * cw + (i // 8) * 12
        kn = known is None or i in known
        f = fill if (kn and fill) else (PAN if kn else SCR)
        c = col if (kn and col) else LIN
        o.append(RECT(x, y, cw - 3, 24, 3, f, c, 1.1))
        o.append(T(x + (cw - 3) / 2, y + 16.5, b if kn else unknown, "middle", 12, tcol if kn else MUT, False, True))
    return "".join(o)


# 10. 既知平文から鍵ストリームの一部が分かる
def _f13_kpa():
    o = []
    x0, cw = 196, 21
    first = set(range(8))
    for k, ch in enumerate("Hi!"):
        o.append(T(x0 + k * (8 * cw + 12) + 4 * cw - 2, 22, "%d 文字目" % (k + 1), "middle", 11, MUT))
    o.append(T(x0 - 12, 50, "暗号文 C（見える）", "end", 12, INK, True))
    o.append(_c13_bitrow(x0, 34, _C13_C24, cw))
    o.append(T(x0 - 12, 84, "平文 P", "end", 12, _C13B, True))
    o.append(_c13_bitrow(x0, 68, _C13_HI, cw, first, _C13BS, _C13B, _C13B))
    o.append(T(x0 + 4 * cw - 2, 112, "H（分かっている）", "middle", 11.5, _C13B, True))
    o.append(T(x0 + 12 * cw + 12, 112, "分からない", "middle", 11.5, MUT))
    o.append(T(x0 + 20 * cw + 24, 112, "分からない", "middle", 11.5, MUT))
    o.append(W(x0 - 4, 122, x0 + 24 * cw + 24, 122, c=INK, lw=1.2))
    o.append(T(x0 - 12, 146, "Z = C ⊕ P", "end", 12, SIG, True))
    o.append(_c13_bitrow(x0, 130, _C13_Z24, cw, first, SSOFT, SIG, SIG))
    o.append(T(20, 182, "攻撃者に分かる鍵ストリームは、最初の 8 ビット 00010011 だけである（長さ 4 の LFSR では 2L = 8）。", "start", 12, INK))
    return SVG(760, 198, o, "2 節の実例の LFSR の出力を鍵ストリームにして、平文 Hi!（ASCII、24 ビット）を暗号化した。"
               "攻撃者は暗号文と、文が H で始まることだけを知っている。")
F["e13_kpa"] = _f13_kpa()


# 11. 連立方程式: 連続する L+1 ビットが 1 本の式になる
def _f13_system():
    o = []
    s = _C13_SEQ[:8]
    x0, cw = 70, 36
    for k in range(8):
        o.append(_c13_tx(x0 + k * cw + 16, 24, _c13_s(str(k)), "middle", 12, MUT, True))
    o.append(_c13_cells(x0, 32, [str(v) for v in s], cw, 28, None, None, None, 14))
    o.append(T(x0 + 8 * cw + 10, 51, "← 観測した 8 ビット（時刻の順）", "start", 11.5, MUT))
    eq = ["0 = c₁", "0 = c₂", "1 = c₃", "1 = c₁ ⊕ c₄"]
    for n in range(4):
        y = 80 + n * 32
        vals = [str(v) for v in s[n:n + 5]]
        fills = {i: SSOFT for i in range(4)}; fills[4] = ASOFT
        cols = {i: SIG for i in range(4)}; cols[4] = ALI
        o.append(T(x0 - 10, y + 17, "n = %d" % n, "end", 11.5, INK, True))
        o.append(_c13_cells(x0 + n * cw, y, vals, cw, 24, fills, cols, None, 12.5))
        o.append(T(x0 + 8 * cw + 10, y + 17, eq[n], "start", 13, INK, True, True))
    o.append(RECT(x0 + 8 * cw + 160, 82, 12, 12, 2, SSOFT, SIG, 1.2))
    o.append(_c13_tx(x0 + 8 * cw + 178, 92, [("右辺: c", ""), ("1", "sub"), ("…c", ""), ("4", "sub"), (" に掛かる 4 ビット", "")], "start", 11.5, SIG))
    o.append(RECT(x0 + 8 * cw + 160, 106, 12, 12, 2, ASOFT, ALI, 1.2))
    o.append(_c13_tx(x0 + 8 * cw + 178, 116, [("左辺: s", ""), ("n+4", "sub")], "start", 11.5, ALI))
    o.append(T(x0, 226, "5 ビットの窓を 1 つずつずらすと 1 本ずつ式が立つ。8 ビットで 4 本、未知数 c₁…c₄ も 4 個。", "start", 12, INK))
    return SVG(760, 240, o, "長さ 4 の LFSR の出力 8 ビットから立つ 4 本の式。右の式は、漸化式に観測したビットを入れて整理したもの。")
F["e13_system"] = _f13_system()


# 12. 復元した LFSR で残りを復号する
def _f13_break():
    o = []
    x0, cw = 196, 21
    for k, ch in enumerate("Hi!"):
        o.append(T(x0 + k * (8 * cw + 12) + 4 * cw - 2, 22, "%d 文字目" % (k + 1), "middle", 11, MUT))
    o.append(T(x0 - 12, 50, "Z（続きを計算）", "end", 12, SIG, True))
    fill = {i: (SSOFT if i < 8 else ASOFT) for i in range(24)}
    for i in range(24):
        x = x0 + i * cw + (i // 8) * 12
        o.append(RECT(x, 34, cw - 3, 24, 3, fill[i], SIG if i < 8 else ALI, 1.2))
        o.append(T(x + (cw - 3) / 2, 50.5, _C13_Z24[i], "middle", 12, SIG if i < 8 else ALI, i >= 8, True))
    o.append(T(x0 + 4 * cw - 2, 76, "観測した 8 ビット", "middle", 11, SIG))
    o.append(_c13_tx(x0 + 16 * cw + 18, 76, [("x", ""), ("4", "sup"), (" + x + 1 の漸化式 s", ""), ("n+4", "sub"), (" = s", ""),
                                             ("n+1", "sub"), (" ⊕ s", ""), ("n", "sub"), (" で計算", "")], "middle", 11, ALI))
    o.append(T(x0 - 12, 104, "暗号文 C", "end", 12, INK, True))
    o.append(_c13_bitrow(x0, 88, _C13_C24, cw))
    o.append(W(x0 - 4, 120, x0 + 24 * cw + 24, 120, c=INK, lw=1.2))
    o.append(T(x0 - 12, 144, "P = C ⊕ Z", "end", 12, _C13B, True))
    o.append(_c13_bitrow(x0, 128, _C13_HI, cw, None, _C13BS, _C13B, _C13B))
    for k, ch in enumerate("Hi!"):
        o.append(T(x0 + k * (8 * cw + 12) + 4 * cw - 2, 178, "%s（0x%02X）" % (ch, ord(ch)), "middle", 13, _C13B, True))
    return SVG(760, 194, o, "前の図の続き。8 ビットから復元した LFSR で鍵ストリームの残りを計算し、XOR すると、"
               "攻撃者が知らなかった i と ! も読める。")
F["e13_break"] = _f13_break()


# ---------------------------------------------------------------- 4 節
def _c13_mini_lfsr(x, y, n, lab, col=INK, cw=16):
    o = [T(x - 6, y + 13, lab, "end", 11, col, True)]
    for i in range(n):
        o.append(RECT(x + i * cw, y, cw - 2, 18, 2, PAN, col, 1.1))
    return "".join(o)


# 13. 非線形化の 4 つの方法
def _f13_nonlin():
    o = []
    def panel(x0, y0, title):
        o.append(RECT(x0, y0, 362, 150, 12, PAN, LIN, 1.3))
        o.append(T(x0 + 14, y0 + 22, title, "start", 12.5, INK, True))
    # ① 非線形結合
    x0, y0 = 14, 12
    panel(x0, y0, "① 非線形結合")
    for k in range(3):
        y = y0 + 40 + k * 32
        o.append(_c13_mini_lfsr(x0 + 70, y, 6, "LFSR %d" % (k + 1)))
        o.append(ARR(x0 + 168, y + 9, x0 + 218, y0 + 80, MUT, 1.2, 5))
    o.append(RECT(x0 + 220, y0 + 62, 60, 40, 8, ASOFT, ALI, 1.5))
    o.append(T(x0 + 250, y0 + 87, "f", "middle", 15, ALI, True))
    o.append(ARR(x0 + 282, y0 + 82, x0 + 330, y0 + 82, INK, 1.4))
    o.append(T(x0 + 338, y0 + 87, "z", "start", 13, INK, True))
    o.append(T(x0 + 14, y0 + 140, "3 本の出力を非線形関数 f で混ぜる", "start", 11, MUT))
    # ② 非線形フィルタ
    x0, y0 = 384, 12
    panel(x0, y0, "② 非線形フィルタ")
    o.append(_c13_mini_lfsr(x0 + 80, y0 + 44, 12, "LFSR", INK, 20))
    for i in (1, 4, 6, 10):
        cx = x0 + 80 + i * 20 + 9
        o.append(RECT(x0 + 80 + i * 20, y0 + 44, 18, 18, 2, SSOFT, SIG, 1.2))
        o.append(ARR(cx, y0 + 64, x0 + 200, y0 + 92, SIG, 1.1, 4.5))
    o.append(RECT(x0 + 170, y0 + 94, 60, 34, 8, ASOFT, ALI, 1.5))
    o.append(T(x0 + 200, y0 + 116, "f", "middle", 15, ALI, True))
    o.append(ARR(x0 + 232, y0 + 111, x0 + 300, y0 + 111, INK, 1.4))
    o.append(T(x0 + 306, y0 + 116, "z", "start", 13, INK, True))
    o.append(T(x0 + 14, y0 + 140, "1 本の状態から数ビットを取り出し、f に通す", "start", 11, MUT))
    # ③ 不規則クロック
    x0, y0 = 14, 176
    panel(x0, y0, "③ 不規則クロック")
    o.append(_c13_mini_lfsr(x0 + 90, y0 + 44, 7, "LFSR A"))
    o.append(_c13_mini_lfsr(x0 + 90, y0 + 98, 7, "LFSR B"))
    o.append(PL([(x0 + 202, y0 + 53), (x0 + 240, y0 + 53), (x0 + 240, y0 + 86)], _C13B, 1.4))
    o.append(ARR(x0 + 240, y0 + 86, x0 + 210, y0 + 100, _C13B, 1.4, 5))
    o.append(T(x0 + 248, y0 + 72, "A の出力で", "start", 10.5, _C13B))
    o.append(T(x0 + 248, y0 + 86, "B を進めるか決める", "start", 10.5, _C13B))
    o.append(ARR(x0 + 202, y0 + 107, x0 + 240, y0 + 120, INK, 1.4, 5))
    o.append(T(x0 + 246, y0 + 126, "z", "start", 13, INK, True))
    o.append(T(x0 + 14, y0 + 140, "B の出力列が不規則に間引かれ、ずれる", "start", 11, MUT))
    # ④ メモリ付き
    x0, y0 = 384, 176
    panel(x0, y0, "④ メモリ付き（繰り上がりを持ち越す）")
    o.append(_c13_mini_lfsr(x0 + 80, y0 + 40, 6, "LFSR 1"))
    o.append(_c13_mini_lfsr(x0 + 80, y0 + 80, 6, "LFSR 2"))
    o.append(ARR(x0 + 178, y0 + 49, x0 + 216, y0 + 68, MUT, 1.2, 5))
    o.append(ARR(x0 + 178, y0 + 89, x0 + 216, y0 + 76, MUT, 1.2, 5))
    o.append(CIRC(x0 + 232, y0 + 72, 16, ALI, 1.5, ASOFT))
    o.append(T(x0 + 232, y0 + 78, "+", "middle", 17, ALI, True))
    o.append(ARR(x0 + 250, y0 + 72, x0 + 300, y0 + 72, INK, 1.4))
    o.append(T(x0 + 306, y0 + 77, "z", "start", 13, INK, True))
    o.append(RECT(x0 + 206, y0 + 104, 52, 22, 5, PAN, ALI, 1.2))
    o.append(T(x0 + 232, y0 + 119, "繰り上がり", "middle", 9.5, ALI))
    o.append(ARR(x0 + 232, y0 + 90, x0 + 232, y0 + 102, ALI, 1.1, 4))
    o.append(PL([(x0 + 260, y0 + 115), (x0 + 272, y0 + 115), (x0 + 272, y0 + 88)], ALI, 1.1))
    o.append(ARR(x0 + 272, y0 + 88, x0 + 246, y0 + 82, ALI, 1.1, 4))
    o.append(T(x0 + 14, y0 + 140, "整数として足し、繰り上がりを次の時刻へ", "start", 11, MUT))
    return SVG(760, 340, o, "LFSR の線形性を壊す 4 つの方法。赤い部分が、XOR だけでは書けない（非線形な）処理である。")
F["e13_nonlin"] = _f13_nonlin()


# 14. Geffe 生成器と真理値表
def _f13_geffe():
    o = []
    for k, nm in enumerate("abc"):
        y = 40 + k * 56
        o.append(RECT(20, y, 96, 30, 6, PAN, INK, 1.4))
        o.append(T(68, y + 20, "LFSR %d" % (k + 1), "middle", 12, INK, True))
        o.append(ARR(118, y + 15, 178, y + 15, INK, 1.4))
        o.append(T(150, y + 9, nm, "middle", 13, [SIG, _C13B, ALI][k], True))
    # 選択器
    o.append('<polygon points="180,46 250,62 250,138 180,154" fill="%s" stroke="%s" stroke-width="1.5"/>' % (PAN, INK))
    o.append(T(215, 82, "b = 1", "middle", 10.5, MUT))
    o.append(T(215, 96, "→ a", "middle", 10.5, SIG, True))
    o.append(T(215, 116, "b = 0", "middle", 10.5, MUT))
    o.append(T(215, 130, "→ c", "middle", 10.5, ALI, True))
    o.append(ARR(252, 100, 296, 100, INK, 1.6))
    o.append(T(304, 105, "z", "start", 14, INK, True))
    o.append(T(20, 210, "z = ab ⊕ (1 ⊕ b)c", "start", 13, INK, True, True))
    o.append(T(20, 232, "b が a と c のどちらを出すかを選ぶ", "start", 11.5, MUT))
    # 真理値表
    x0, y0 = 362, 22
    heads = ["a", "b", "c", "z", "z = a", "z = c", "z = b"]
    cw = [34, 34, 34, 40, 60, 60, 60]
    xs = [x0]
    for w in cw[:-1]:
        xs.append(xs[-1] + w)
    for k, hd in enumerate(heads):
        o.append(T(xs[k] + cw[k] / 2, y0 + 12, hd, "middle", 11.5, MUT, True, k < 4))
    o.append(W(x0, y0 + 20, x0 + sum(cw), y0 + 20, c=INK, lw=1.1))
    cnt = [0, 0, 0]
    for r in range(8):
        a, b, c = (r >> 2) & 1, (r >> 1) & 1, r & 1
        z = a if b else c
        y = y0 + 38 + r * 22
        vals = [a, b, c, z]
        for k, v in enumerate(vals):
            o.append(T(xs[k] + cw[k] / 2, y, str(v), "middle", 12, INK, k == 3, True))
        for m, ref in enumerate([a, c, b]):
            ok = z == ref
            cnt[m] += ok
            o.append(T(xs[4 + m] + cw[4 + m] / 2, y, "✓" if ok else "·", "middle", 12, [SIG, ALI, _C13B][m] if ok else FNT, ok))
    yy = y0 + 38 + 8 * 22 - 6
    o.append(W(x0, yy - 10, x0 + sum(cw), yy - 10, c=INK, lw=1.1))
    for m in range(3):
        o.append(T(xs[4 + m] + cw[4 + m] / 2, yy + 8, "%d/8" % cnt[m], "middle", 12, [SIG, ALI, _C13B][m], True))
    return SVG(760, 248, o, "Geffe 生成器。真理値表で数えると、z は a とも c とも 8 通り中 6 通り（3/4）で一致し、"
               "b とは 4 通り（1/2）で一致する。")
F["e13_geffe"] = _f13_geffe()


# ---------------------------------------------------------------- 5 節
# 15. ChaCha20 の状態と出力の作り方
def _f13_chacha():
    o = []
    x0, y0, cw, ch = 20, 30, 86, 40
    cells = [("定数", '"expa"', MUT, SCR), ("定数", '"nd 3"', MUT, SCR), ("定数", '"2-by"', MUT, SCR), ("定数", '"te k"', MUT, SCR)]
    cells += [("鍵", "k%d" % i, ALI, ASOFT) for i in range(8)]
    cells += [("ブロック番号", "0, 1, 2, …", _C13B, _C13BS)] + [("ノンス", "n%d" % i, SIG, SSOFT) for i in range(3)]
    o.append(T(x0 + 2 * cw, 20, "状態: 32 ビットの語 16 個（4 × 4）", "middle", 12, INK, True))
    for i, (nm, v, c, fl) in enumerate(cells):
        r, cc = divmod(i, 4)
        x, y = x0 + cc * cw, y0 + 4 + r * (ch + 4)
        o.append(RECT(x, y, cw - 4, ch, 6, fl, c, 1.3))
        o.append(T(x + (cw - 4) / 2, y + 16, nm, "middle", 10.5, c, True))
        o.append(T(x + (cw - 4) / 2, y + 32, v, "middle", 11, INK, False, True))
    o.append(T(x0, y0 + 4 * (ch + 4) + 20, "鍵 256 ビット、ノンス 96 ビット、ブロック番号 32 ビット", "start", 11, MUT))
    fx = 400
    steps = [("20 ラウンド混ぜる", "列ごとに 4 個、対角線ごとに 4 個の", "クォーターラウンドを交互に 10 回ずつ", INK, PAN),
             ("最初の状態を語ごとに足す", "（2³² で割った余りでの足し算）", None, INK, PAN),
             ("64 バイトの鍵ストリーム", "次の 64 バイトはブロック番号を", "1 増やして同じ計算をする", SIG, SSOFT)]
    y = 30
    for k, (t1, t2, t3, c, fl) in enumerate(steps):
        hh = 58 if t3 else 44
        o.append(RECT(fx, y, 340, hh, 8, fl, c, 1.5))
        o.append(T(fx + 170, y + 19, t1, "middle", 12, c, True))
        o.append(T(fx + 170, y + 36, t2, "middle", 11, MUT))
        if t3:
            o.append(T(fx + 170, y + 51, t3, "middle", 11, MUT))
        if k < len(steps) - 1:
            o.append(ARR(fx + 170, y + hh + 2, fx + 170, y + hh + 20, MUT, 1.4))
        y += hh + 22
    o.append(ARR(x0 + 4 * cw + 2, 100, fx - 4, 58, MUT, 1.4))
    return SVG(760, 240, o, "ChaCha20 の状態の並びと、鍵ストリームの作り方。鍵とノンスが 1 節の (K, IV) に当たる。")
F["e13_chacha"] = _f13_chacha()


# 16. クォーターラウンド（ARX）と回転の例
def _f13_arx():
    o = []
    M = 0xffffffff
    rot = lambda v, n: ((v << n) | (v >> (32 - n))) & M
    a, b, c, d = 0x11111111, 0x01020304, 0x9b8d6f43, 0x01234567
    v = {"a": a, "b": b, "c": c, "d": d}
    ops = []
    for (p, q, r, k) in [("a", "b", "d", 16), ("c", "d", "b", 12), ("a", "b", "d", 8), ("c", "d", "b", 7)]:
        ops.append(("add", p, q)); ops.append(("xor", r, p)); ops.append(("rot", r, k))
    lane = {"a": 230, "b": 330, "c": 430, "d": 530}
    y0, dy = 74, 24
    for nm, x in lane.items():
        o.append(T(x, 24, nm, "middle", 14, INK, True))
        o.append(T(x, 44, "%08x" % v[nm], "middle", 11, MUT, False, True))
        o.append(W(x, 52, x, y0 + len(ops) * dy - 6, c=LIN, lw=1.6))
    for i, (op, p, q) in enumerate(ops):
        y = y0 + i * dy
        if op == "add":
            o.append(ARR(lane[q], y, lane[p] + (9 if lane[q] > lane[p] else -9), y, _C13B, 1.3, 5))
            o.append(CIRC(lane[p], y, 9, _C13B, 1.4, PAN))
            o.append(T(lane[p], y + 4.5, "+", "middle", 13, _C13B, True))
            o.append(T(20, y + 4, "%s ← %s ⊞ %s" % (p, p, q), "start", 12, _C13B, True, True))
            v[p] = (v[p] + v[q]) & M
        elif op == "xor":
            o.append(ARR(lane[q], y, lane[p] + (9 if lane[q] > lane[p] else -9), y, SIG, 1.3, 5))
            o.append(_c13_xor(lane[p], y, 9, SIG))
            o.append(T(20, y + 4, "%s ← %s ⊕ %s" % (p, p, q), "start", 12, SIG, True, True))
            v[p] ^= v[q]
        else:
            o.append(RECT(lane[p] - 22, y - 9, 44, 18, 5, ASOFT, ALI, 1.3))
            o.append(T(lane[p], y + 4, "⋘ %d" % q, "middle", 11, ALI, True))
            o.append(T(20, y + 4, "%s ← %s ⋘ %d" % (p, p, q), "start", 12, ALI, True, True))
            v[p] = rot(v[p], q)
    yb = y0 + len(ops) * dy + 12
    for nm, x in lane.items():
        o.append(T(x, yb, "%08x" % v[nm], "middle", 11.5, INK, True, True))
    o.append(T(20, yb, "結果", "start", 11.5, MUT, True))
    o.append(T(20, 44, "入力", "start", 11.5, MUT, True))
    # 回転の例
    rx, ry = 588, 90
    o.append(T(rx, ry - 30, "回転の例（8 ビット）", "start", 12, ALI, True))
    src = "10110010"
    dst = src[3:] + src[:3]
    o.append(_c13_cells(rx, ry - 18, list(src), 19, 22, {0: ASOFT, 1: ASOFT, 2: ASOFT}, {0: ALI, 1: ALI, 2: ALI}, None, 11.5))
    o.append(T(rx + 76, ry + 22, "⋘ 3", "middle", 12, ALI, True))
    o.append(_c13_cells(rx, ry + 30, list(dst), 19, 22, {5: ASOFT, 6: ASOFT, 7: ASOFT}, {5: ALI, 6: ALI, 7: ALI}, None, 11.5))
    o.append(T(rx, ry + 76, "左へ 3 ずらし、はみ出した", "start", 11, MUT))
    o.append(T(rx, ry + 92, "3 ビットを右端に戻す", "start", 11, MUT))
    o.append(T(rx, ry + 130, "⊞: 2³² で割った余りで足す", "start", 11, _C13B))
    o.append(T(rx, ry + 148, "⊕: XOR", "start", 11, SIG))
    o.append(T(rx, ry + 166, "⋘ k: k ビットの回転", "start", 11, ALI))
    return SVG(760, yb + 16, o, "ChaCha20 のクォーターラウンド。4 つの語 a, b, c, d を、足し算・XOR・回転の 12 回の操作で混ぜる。"
               "上下の値は RFC 8439 の例の入力と、この 12 回の操作の結果（16 進）。")
F["e13_arx"] = _f13_arx()
