# 14 章 ブロック暗号と AES の図（figures.py の関数・定数をそのまま使う）
# 図の数値は、下の AES-128 の実装で計算したものをそのまま描く。

_B14 = "var(--blue)"
_BS14 = "var(--blue-soft)"
_GS14 = "var(--muted-soft)"

# ---------------- AES-128（図の数値の計算用） ----------------
def _a14_xt(a):
    return ((a << 1) & 0xFF) ^ (0x1B if a & 0x80 else 0)

def _a14_mul(a, b):
    r = 0
    for _ in range(8):
        if b & 1:
            r ^= a
        a = _a14_xt(a)
        b >>= 1
    return r

def _a14_inv(a):
    if a == 0:
        return 0
    r, e, x = 1, 254, a
    while e:
        if e & 1:
            r = _a14_mul(r, x)
        x = _a14_mul(x, x)
        e >>= 1
    return r

def _a14_rotl(x, k):
    return ((x << k) | (x >> (8 - k))) & 0xFF

def _a14_aff(b):
    return b ^ _a14_rotl(b, 1) ^ _a14_rotl(b, 2) ^ _a14_rotl(b, 3) ^ _a14_rotl(b, 4) ^ 0x63

_A14_S = [_a14_aff(_a14_inv(a)) for a in range(256)]

def _a14_sub(s):
    return [_A14_S[x] for x in s]

def _a14_shift(s):
    o = [0] * 16
    for r in range(4):
        for c in range(4):
            o[r + 4 * c] = s[r + 4 * ((c + r) % 4)]
    return o

_A14_M = [[2, 3, 1, 1], [1, 2, 3, 1], [1, 1, 2, 3], [3, 1, 1, 2]]

def _a14_mixcol(col, M=_A14_M):
    return [_a14_mul(M[i][0], col[0]) ^ _a14_mul(M[i][1], col[1]) ^
            _a14_mul(M[i][2], col[2]) ^ _a14_mul(M[i][3], col[3]) for i in range(4)]

def _a14_mix(s):
    o = []
    for c in range(4):
        o += _a14_mixcol(s[4 * c:4 * c + 4])
    return o

def _a14_words(key):
    W = [key[4 * i:4 * i + 4] for i in range(4)]
    rc = 1
    for i in range(4, 44):
        t = W[i - 1][:]
        if i % 4 == 0:
            t = [_A14_S[x] for x in t[1:] + t[:1]]
            t[0] ^= rc
            rc = _a14_xt(rc)
        W.append([a ^ b for a, b in zip(W[i - 4], t)])
    return W

def _a14_xor(a, b):
    return [x ^ y for x, y in zip(a, b)]

_P14 = list(bytes.fromhex("3243f6a8885a308d313198a2e0370734"))   # FIPS 197 の例の平文
_K14 = list(bytes.fromhex("2b7e151628aed2a6abf7158809cf4f3c"))   # FIPS 197 の例の鍵
_W14 = _a14_words(_K14)

def _h14(v):
    return "%02x" % v

def _H14(v):
    return "%02X" % v

# ---------------- 描画の部品 ----------------
def _c14(x, y, w, h, s, fill=PAN, c=LIN, tc=INK, sz=12, b=False, mono=True, r=4, lw=1.2):
    """文字入りのマス"""
    return RECT(x, y, w, h, r, fill, c, lw) + T(x + w / 2, y + h / 2 + sz * 0.36, s, "middle", sz, tc, b, mono)

def _grid14(x0, y0, vals, cs=34, hl=None, hlf=SSOFT, hlc=SIG, fills=None, sz=12, tc=INK):
    """4x4 の状態。vals は列順（s[i+4j]）の 16 個の文字列"""
    o = []
    for j in range(4):
        for i in range(4):
            k = i + 4 * j
            fl, c, b = PAN, LIN, False
            if fills and fills[k]:
                fl, c = fills[k]
            if hl and k in hl:
                fl, c, b = hlf, hlc, True
            o.append(_c14(x0 + j * cs, y0 + i * cs, cs - 3, cs - 3, vals[k], fl, c, tc, sz, b))
    return "".join(o)

def _bits14(x, y, v, cw=26, ch=24, hl=None, hlc=ALI, hlf=ASOFT, fill=PAN, c=LIN, tc=INK, sz=12, n=8):
    """v を n ビットのマスで描く（左が最上位）。hl はビット番号（0 = 最下位）の集合"""
    o = []
    for k in range(n):
        bit = n - 1 - k
        on = hl is not None and bit in hl
        o.append(RECT(x + k * cw, y, cw - 3, ch, 3, hlf if on else fill, hlc if on else c, 1.2))
        o.append(T(x + k * cw + (cw - 3) / 2, y + ch / 2 + sz * 0.36, str((v >> bit) & 1), "middle", sz,
                   hlc if on else tc, on, True))
    return "".join(o)

def _xorc14(x, y, r=9, c=INK):
    """XOR の記号（丸に十字）"""
    return CIRC(x, y, r, c, 1.5, PAN) + W(x - r + 2.5, y, x + r - 2.5, y, c=c, lw=1.5) + W(x, y - r + 2.5, x, y + r - 2.5, c=c, lw=1.5)

def _ts14(x, y, parts, a="start", sz=12, c=INK, b=False, mono=False):
    """添字つきの文字列。parts は文字列か (文字列, "sub" / "sup") の並び"""
    fam = MONO if mono else "var(--sans)"
    out = ['<text x="%g" y="%g" text-anchor="%s" font-size="%g" fill="%s" font-family="%s" font-weight="%s">'
           % (x, y, a, sz, c, fam, "700" if b else "400")]
    cur = 0.0
    for q in parts:
        if isinstance(q, tuple):
            t, kind = q
            tgt = sz * 0.3 if kind == "sub" else -sz * 0.42
            fs = sz * 0.74
        else:
            t, tgt, fs = q, 0.0, sz
        out.append('<tspan dy="%g" font-size="%g">%s</tspan>' % (round(tgt - cur, 2), round(fs, 2), E(t)))
        cur = tgt
    out.append("</text>")
    return "".join(out)

def _ek14(x, y, w=70, h=30):
    """E_K の箱"""
    return RECT(x, y, w, h, 6, SCR, INK, 1.5) + _ts14(x + w / 2, y + h / 2 + 4.5, ["E", ("K", "sub")], "middle", 13, INK, True)


# ======================================================================
# 1 節
# ======================================================================

# 鍵ごとの並べ替え（ブロック長 3 ビットの例）と、1 対 1 でない写像
def _f14_perm():
    o = []
    panels = [([5, 2, 7, 0, 3, 6, 1, 4], SIG, "鍵 K₁ のときの並べ替え", "どの出力にも線が 1 本ずつ"),
              ([3, 6, 0, 5, 7, 1, 4, 2], _B14, "鍵 K₂ のときの並べ替え", "鍵が変わると別の並べ替え"),
              ([2, 5, 2, 0, 6, 6, 1, 4], ALI, "悪い例: 1 対 1 でない写像", "010 と 110 に 2 本ずつ入る")]
    for pi, (pm, col, title, note) in enumerate(panels):
        x0 = 30 + pi * 236
        o.append(T(x0 + 92, 22, title, "middle", 12.5, col, True))
        hit = {}
        for v, w in enumerate(pm):
            hit.setdefault(w, []).append(v)
        for v in range(8):
            y = 40 + v * 26
            o.append(_c14(x0, y, 44, 20, format(v, "03b"), PAN, LIN, INK, 11))
            w = v
            bad = pi == 2 and (len(hit.get(w, [])) != 1)
            miss = pi == 2 and w not in hit
            o.append(_c14(x0 + 140, y, 44, 20, format(w, "03b"),
                          SCR if miss else (ASOFT if bad else PAN), FNT if miss else (ALI if bad else LIN),
                          FNT if miss else INK, 11))
        for v, w in enumerate(pm):
            dup = pi == 2 and len(hit[w]) > 1
            o.append(ARR(x0 + 46, 50 + v * 26, x0 + 137, 50 + w * 26, ALI if dup else col, 2 if dup else 1.3, 6))
        o.append(T(x0 + 22, 262, "入力", "middle", 10.5, MUT))
        o.append(T(x0 + 162, 262, "出力", "middle", 10.5, MUT))
        o.append(T(x0 + 92, 284, note, "middle", 11, col if pi == 2 else INK))
    o.append(T(30 + 2 * 236 + 92, 302, "011 と 111 には何も来ない → 復号できない", "middle", 11, ALI))
    return SVG(720, 314, o, "ブロック長 3 ビットの小さな例（結線は一例）。鍵を 1 つ決めると、8 通りの入力を 8 通りの出力へ 1 対 1 に移す並べ替えが 1 つ決まる。"
               "右のように 2 つの入力が同じ出力に移ると、その出力を受け取っても元の入力が決められない。AES では入力も出力も 2¹²⁸ 通りある。")
F["e14_perm"] = _f14_perm()


# ラウンドの繰り返しとラウンド鍵
def _f14_rounds():
    o = []
    o.append(_c14(20, 22, 70, 34, "鍵 K", SSOFT, SIG, INK, 12.5, True, False))
    o.append(ARR(92, 39, 128, 39, MUT, 1.6))
    o.append(RECT(130, 22, 450, 34, 8, SCR, MUT, 1.3))
    o.append(T(355, 44, "鍵スケジュール（鍵 K からラウンド鍵を作る）", "middle", 12, INK, True))
    xs = [150, 290, 470]
    labs = ["ラウンド 1", "ラウンド 2", "ラウンド R"]
    keys = ["1", "2", "R"]
    for x, lb, kk in zip(xs, labs, keys):
        o.append(ARR(x + 50, 58, x + 50, 112, SIG, 1.6))
        o.append(_ts14(x + 58, 90, ["K", (kk, "sub")], "start", 12.5, SIG, True))
        o.append(_c14(x, 114, 100, 40, lb, PAN, INK, INK, 12, True, False, 6, 1.5))
    o.append(_c14(20, 114, 70, 40, "平文 P", PAN, MUT, INK, 12, True, False))
    o.append(ARR(92, 134, 148, 134, INK, 1.6))
    o.append(ARR(252, 134, 288, 134, INK, 1.6))
    o.append(W(392, 134, 412, 134, c=INK, lw=1.6))
    o.append(T(430, 139, "…", "middle", 16, INK, True))
    o.append(ARR(446, 134, 468, 134, INK, 1.6))
    o.append(ARR(572, 134, 608, 134, INK, 1.6))
    o.append(_c14(610, 114, 90, 40, "暗号文 C", PAN, MUT, INK, 12, True, False))
    o.append(T(360, 182, "同じ形の変換（ラウンド）を R 回繰り返し、各ラウンドに別々のラウンド鍵を混ぜる", "middle", 11.5, MUT))
    return SVG(720, 196, o, "ブロック暗号の骨組み。1 回のラウンドは単純でも、繰り返すことで混同と拡散を作り出す。")
F["e14_rounds"] = _f14_rounds()


# Feistel 構造と SPN 構造
def _f14_feistel():
    o = []
    # ---- Feistel ----
    o.append(T(185, 22, "Feistel 構造（DES など）", "middle", 13, SIG, True))
    o.append(_c14(40, 40, 120, 32, "L", PAN, INK, INK, 14, True))
    o.append(_c14(210, 40, 120, 32, "R", PAN, INK, INK, 14, True))
    # R の線（下へ）と F への分岐
    o.append(W(270, 72, 270, 168, c=INK, lw=1.6))
    o.append(D(270, 118, INK, 3.2))
    o.append(ARR(270, 118, 222, 118, INK, 1.5))
    o.append(_c14(176, 104, 44, 28, "F", SSOFT, SIG, INK, 14, True, False))
    o.append(ARR(198, 82, 198, 102, SIG, 1.5))
    o.append(_ts14(206, 92, ["K", ("r", "sub")], "start", 12, SIG, True))
    o.append(ARR(174, 118, 111, 118, INK, 1.5))
    o.append(W(100, 72, 100, 108, c=INK, lw=1.6))
    o.append(_xorc14(100, 118))
    o.append(W(100, 128, 100, 168, c=INK, lw=1.6))
    # 交差
    o.append(ARR(100, 168, 266, 214, INK, 1.6))
    o.append(ARR(270, 168, 104, 214, INK, 1.6))
    o.append(_c14(40, 216, 120, 32, "L′", PAN, INK, INK, 14, True))
    o.append(_c14(210, 216, 120, 32, "R′", PAN, INK, INK, 14, True))
    o.append(T(100, 270, "L′ = R", "middle", 12.5, INK, False, True))
    o.append(_ts14(270, 270, ["R′ = L ⊕ F(R, K", ("r", "sub"), ")"], "middle", 12.5, INK, False, True))
    o.append(T(185, 294, "F は逆に計算できなくてもよい", "middle", 11.5, SIG))
    # ---- SPN ----
    X0 = 370
    o.append(T(X0 + 150, 22, "SPN 構造（AES など）", "middle", 13, _B14, True))
    for k in range(4):
        o.append(_c14(X0 + 20 + k * 66, 40, 60, 26, "8 ビット", PAN, LIN, MUT, 10.5, False, False))
        o.append(ARR(X0 + 50 + k * 66, 68, X0 + 50 + k * 66, 86, INK, 1.4))
        o.append(_c14(X0 + 26 + k * 66, 88, 48, 30, "S", _BS14, _B14, INK, 14, True, False))
        o.append(ARR(X0 + 50 + k * 66, 120, X0 + 50 + k * 66, 140, INK, 1.4))
    o.append(RECT(X0 + 20, 142, 258, 34, 6, SCR, MUT, 1.3))
    o.append(T(X0 + 149, 164, "線形層（並べ替え・混ぜ合わせ）", "middle", 11.5, INK, True))
    o.append(ARR(X0 + 149, 178, X0 + 149, 196, INK, 1.4))
    o.append(_xorc14(X0 + 149, 206))
    o.append(ARR(X0 + 205, 206, X0 + 161, 206, SIG, 1.5))
    o.append(_ts14(X0 + 210, 210, ["K", ("r", "sub")], "start", 12, SIG, True))
    o.append(ARR(X0 + 149, 216, X0 + 149, 234, INK, 1.4))
    o.append(RECT(X0 + 20, 236, 258, 26, 4, PAN, LIN, 1.2))
    o.append(T(X0 + 149, 254, "次のラウンドへ", "middle", 11, MUT))
    o.append(T(X0 + 288, 108, "混同", "start", 11.5, _B14, True))
    o.append(T(X0 + 288, 124, "（非線形）", "start", 10.5, MUT))
    o.append(T(X0 + 288, 158, "拡散", "start", 11.5, INK, True))
    o.append(T(X0 + 288, 174, "（線形）", "start", 10.5, MUT))
    o.append(T(X0 + 150, 294, "どの部品も逆に計算できる必要がある", "middle", 11.5, _B14))
    return SVG(720, 308, o, "1 ラウンドの比較。Feistel は半分だけを F で変え、左右を入れ替える。"
               "SPN はブロック全体を S-box と線形層に通す。どちらも最後にラウンド鍵を混ぜる（Feistel は F の中で混ぜる）。")
F["e14_feistel"] = _f14_feistel()


# ======================================================================
# 2 節
# ======================================================================

_COLS14 = [(SSOFT, SIG), (_BS14, _B14), (ASOFT, ALI), (_GS14, MUT)]

# 16 バイトを列ごとに詰めて状態にする
def _f14_state():
    o = []
    x0, cw = 24, 42
    o.append(T(x0, 20, "平文ブロック P（16 バイト、FIPS 197 の例）", "start", 12, INK, True))
    for k in range(16):
        fl, c = _COLS14[k // 4]
        o.append(_c14(x0 + k * cw, 30, cw - 4, 28, _h14(_P14[k]), fl, c, INK, 12))
        o.append(T(x0 + k * cw + (cw - 4) / 2, 74, "p%d" % k, "middle", 10, MUT, False, True))
    gx, gy, cs = 300, 132, 40
    for j in range(4):
        cx = x0 + (4 * j + 1.5) * cw + (cw - 4) / 2
        o.append(ARR(cx, 82, gx + j * cs + 18, gy - 6, _COLS14[j][1], 1.5))
    fills = [_COLS14[k // 4] for k in range(16)]
    o.append(_grid14(gx, gy, [_h14(v) for v in _P14], cs, fills=fills))
    for i in range(4):
        o.append(T(gx - 10, gy + i * cs + 24, "i = %d" % i, "end", 10.5, MUT))
    for j in range(4):
        o.append(T(gx + j * cs + 18, gy + 4 * cs + 14, "j = %d" % j, "middle", 10.5, MUT))
    o.append(_ts14(gx + 4 * cs + 24, gy + 30, ["状態 s", ("i,j", "sub"), " = p", ("i+4j", "sub")], "start", 12.5, INK, True))
    o.append(T(gx + 4 * cs + 24, gy + 54, "列ごとに上から詰める", "start", 11.5, MUT))
    o.append(_ts14(gx + 4 * cs + 24, gy + 78, ["例: s", ("1,2", "sub"), " = p", ("9", "sub"), " = 31"], "start", 11.5, MUT))
    o.append(T(gx + 4 * cs + 24, gy + 102, "各バイトは GF(2⁸) の要素", "start", 11.5, MUT))
    return SVG(720, 312, o, "平文の 16 バイトを、4 バイトずつ 1 列にして 4×4 の行列に詰める。色は何列目に入るかを表す。")
F["e14_state"] = _f14_state()


# 4 つの操作が何に作用するか
def _f14_ops():
    o = []
    cs = 22
    titles = [("SubBytes", "各バイトを別々に置き換える", _B14),
              ("ShiftRows", "各行を左へずらす", SIG),
              ("MixColumns", "各列を行列で混ぜる", ALI),
              ("AddRoundKey", "ラウンド鍵と XOR", INK)]
    for p, (name, sub, col) in enumerate(titles):
        x0 = 18 + p * 176
        o.append(T(x0 + 76, 22, name, "middle", 12.5, col, True))
        o.append(T(x0 + 76, 40, sub, "middle", 10.5, MUT))
        gx, gy = x0 + 22, 54
        if p == 0:
            for j in range(4):
                for i in range(4):
                    o.append(_c14(gx + j * cs, gy + i * cs, cs - 3, cs - 3, "S", _BS14, _B14, INK, 10, True, False))
        elif p == 1:
            for i in range(4):
                for j in range(4):
                    oc = (j + i) % 4
                    fl, c = _COLS14[oc]
                    o.append(_c14(gx + j * cs, gy + i * cs, cs - 3, cs - 3, str(oc), fl, c, INK, 10))
                o.append(T(gx + 4 * cs + 6, gy + i * cs + 15, ["0", "←1", "←2", "←3"][i], "start", 10.5, SIG, True))
        elif p == 2:
            for j in range(4):
                for i in range(4):
                    on = j == 1
                    o.append(RECT(gx + j * cs, gy + i * cs, cs - 3, cs - 3, 3, ASOFT if on else PAN, ALI if on else LIN, 1.2))
            o.append(RECT(gx + cs - 3, gy - 4, cs + 3, 4 * cs + 5, 5, "none", ALI, 1.6, "4,3"))
            o.append(T(gx + 4 * cs + 4, gy + 2 * cs + 4, "×行列", "start", 10.5, ALI, True))
        else:
            for j in range(4):
                for i in range(4):
                    o.append(RECT(gx + j * (cs - 6), gy + i * (cs - 6), cs - 9, cs - 9, 3, PAN, MUT, 1.1))
            o.append(T(gx + 4 * (cs - 6) + 8, gy + 2 * (cs - 6) + 4, "⊕", "middle", 14, INK, True))
            kx = gx + 4 * (cs - 6) + 18
            for j in range(4):
                for i in range(4):
                    o.append(RECT(kx + j * (cs - 6), gy + i * (cs - 6), cs - 9, cs - 9, 3, SSOFT, SIG, 1.1))
            o.append(_ts14(kx + 2 * (cs - 6), gy + 4 * (cs - 6) + 16, ["K", ("r", "sub")], "middle", 12, SIG, True))
    o.append(T(18 + 176 + 22, 162, "数字は元の列の番号", "start", 10, MUT))
    return SVG(720, 176, o, "1 ラウンドの 4 つの操作が状態のどこに作用するか。"
               "SubBytes はバイトごと、ShiftRows は行ごと、MixColumns は列ごと、AddRoundKey は 16 バイト全体に作用する。")
F["e14_ops"] = _f14_ops()


# AES-128 の処理の流れ
def _f14_flow():
    o = []
    bw, bh = 104, 34

    def op(x, y, s, col=INK, fill=PAN, w=bw):
        return _c14(x, y, w, bh, s, fill, col, INK, 11.5, True, False, 6, 1.4)

    # 1 段目
    o.append(_c14(20, 24, 84, bh, "平文 P", PAN, MUT, INK, 12, True, False))
    o.append(ARR(106, 41, 132, 41, INK, 1.5))
    o.append(op(134, 24, "AddRoundKey"))
    o.append(_ts14(250, 46, ["← K", ("0", "sub"), "（ラウンド 0）"], "start", 12, SIG, True))
    o.append(ARR(186, 60, 186, 92, INK, 1.5))
    # 2 段目: ラウンド 1〜9
    o.append(RECT(20, 94, 680, 74, 10, SCR, MUT, 1.3, "6,4"))
    o.append(T(32, 112, "ラウンド r = 1, 2, …, 9（9 回繰り返す）", "start", 11.5, INK, True))
    y2 = 124
    xs2 = [134, 268, 402, 536]
    names2 = ["SubBytes", "ShiftRows", "MixColumns", "AddRoundKey"]
    for k, (x, nm) in enumerate(zip(xs2, names2)):
        o.append(op(x, y2, nm, ALI if nm == "MixColumns" else INK, ASOFT if nm == "MixColumns" else PAN))
        if k:
            o.append(ARR(xs2[k - 1] + bw + 2, y2 + 17, x - 2, y2 + 17, INK, 1.5))
    o.append(_ts14(536 + bw + 6, y2 + 22, ["← K", ("r", "sub")], "start", 12, SIG, True))
    o.append(ARR(186, 170, 186, 202, INK, 1.5))
    # 3 段目: ラウンド 10
    o.append(RECT(20, 204, 680, 62, 10, PAN, MUT, 1.3))
    o.append(T(32, 222, "ラウンド 10（最終）", "start", 11.5, INK, True))
    y3 = 226
    xs3 = [134, 268, 402]
    names3 = ["SubBytes", "ShiftRows", "AddRoundKey"]
    for k, (x, nm) in enumerate(zip(xs3, names3)):
        o.append(op(x, y3, nm))
        if k:
            o.append(ARR(xs3[k - 1] + bw + 2, y3 + 17, x - 2, y3 + 17, INK, 1.5))
    o.append(_ts14(402 + bw / 2, 284, ["↑ K", ("10", "sub")], "middle", 12, SIG, True))
    o.append(ARR(402 + bw + 2, y3 + 17, 560, y3 + 17, INK, 1.5))
    o.append(_c14(562, y3, 110, bh, "暗号文 C", PAN, MUT, INK, 12, True, False))
    o.append(T(268 + bw / 2, 284, "MixColumns が無い（7 節）", "middle", 10.5, ALI))
    return SVG(720, 298, o, "AES-128 の暗号化の流れ。ラウンド鍵は K<sub>0</sub>〜K<sub>10</sub> の 11 個で、鍵スケジュール（6 節）で元の鍵から作る。")
F["e14_flow"] = _f14_flow()


# ======================================================================
# 3 節
# ======================================================================

# S-box の 2 段階
def _f14_sbox2():
    o = []
    a = 0x53
    b = _a14_inv(a)
    c = _A14_S[a]
    y = 30

    def val(x, name, v, col, fl):
        r = [RECT(x, y, 104, 62, 8, fl, col, 1.6)]
        r.append(T(x + 52, y + 23, "%s = 0x%02X" % (name, v), "middle", 12.5, col, True, True))
        r.append(T(x + 52, y + 46, format(v, "08b"), "middle", 12, INK, False, True))
        return "".join(r)

    def opbox(x, t1, t2, t3):
        r = [RECT(x, y + 4, 156, 54, 8, SCR, MUT, 1.3)]
        r.append(T(x + 78, y + 25, t1, "middle", 11.5, INK, True))
        r.append(T(x + 78, y + 44, t2, "middle", 10.5, MUT, False, True))
        r.append(T(x + 78, y + 82, t3, "middle", 10.5, MUT))
        return "".join(r)

    o.append(val(10, "a", a, INK, PAN))
    o.append(ARR(116, y + 31, 136, y + 31, INK, 1.6))
    o.append(opbox(138, "段階 1: 逆元", "a⁻¹ = a²⁵⁴", "GF(2⁸)（0x11B）の掛け算"))
    o.append(ARR(296, y + 31, 316, y + 31, INK, 1.6))
    o.append(val(318, "b", b, _B14, _BS14))
    o.append(ARR(424, y + 31, 444, y + 31, INK, 1.6))
    o.append(opbox(446, "段階 2: アフィン変換", "b⊕(b⋘1)⊕…⊕(b⋘4)⊕63", "ビットごとの XOR"))
    o.append(ARR(604, y + 31, 622, y + 31, INK, 1.6))
    o.append(val(624, "S(a)", c, SIG, SSOFT))
    return SVG(738, 128, o, "S-box の 2 段階を a = 0x53 で計算した様子。段階 1 は体の掛け算についての逆元、段階 2 はビットごとの XOR で、互いに無関係な 2 種類の演算を重ねる。")
F["e14_sbox2"] = _f14_sbox2()


# アフィン変換の筆算
def _f14_affine():
    o = []
    b = 0xCA
    rows = [("b", b, "段階 1 の結果（0x53 の逆元）"),
            ("b ⋘ 1", _a14_rotl(b, 1), "左に 1 ビット回転（左端の 1 が右端へ）"),
            ("b ⋘ 2", _a14_rotl(b, 2), "左に 2 ビット回転"),
            ("b ⋘ 3", _a14_rotl(b, 3), "左に 3 ビット回転"),
            ("b ⋘ 4", _a14_rotl(b, 4), "左に 4 ビット回転"),
            ("0x63", 0x63, "定数 d")]
    x0, cw, ch = 104, 30, 24
    o.append(T(x0 - 14, 24, "ビット番号", "end", 10.5, MUT))
    for k in range(8):
        o.append(T(x0 + k * cw + 13.5, 24, str(7 - k), "middle", 10.5, MUT, False, True))
    lab0 = ["b₀", "b₇", "b₆", "b₅", "b₄", "d₀"]
    for r, (name, v, note) in enumerate(rows):
        y = 34 + r * 30
        o.append(T(x0 - 14, y + 17, name, "end", 12, INK, True, True))
        o.append(_bits14(x0, y, v, cw, ch, hl={0}, hlc=ALI, hlf=ASOFT))
        o.append(T(x0 + 8 * cw + 6, y + 16, lab0[r], "start", 10.5, ALI, True))
        o.append(T(x0 + 8 * cw + 34, y + 17, "0x%02X" % v, "start", 12, INK, False, True))
        o.append(T(x0 + 8 * cw + 84, y + 17, note, "start", 11, MUT))
    yl = 34 + 6 * 30 + 2
    o.append(W(x0 - 40, yl, x0 + 8 * cw + 64, yl, c=INK, lw=1.4))
    c = _A14_S[0x53]
    y = yl + 8
    o.append(T(x0 - 14, y + 17, "c", "end", 12.5, SIG, True, True))
    o.append(_bits14(x0, y, c, cw, ch, hl={0}, hlc=ALI, hlf=ASOFT, fill=SSOFT, c=SIG))
    o.append(T(x0 + 8 * cw + 34, y + 17, "0x%02X" % c, "start", 12.5, SIG, True, True))
    o.append(T(x0 + 8 * cw + 84, y + 17, "= S(0x53)", "start", 12, SIG, True))
    o.append(RECT(x0 + 7 * cw - 4, 30, cw + 3, yl - 30 + 38, 6, "none", ALI, 1.4, "4,3"))
    o.append(T(20, yl + 62, "右端の列（i = 0）: c₀ = b₀ ⊕ b₇ ⊕ b₆ ⊕ b₅ ⊕ b₄ ⊕ d₀ = 0 ⊕ 1 ⊕ 1 ⊕ 0 ⊕ 0 ⊕ 1 = 1", "start", 11.5, ALI))
    o.append(T(20, yl + 82, "ほかの列も同じく、その列の 6 個のビットの XOR（1 の個数が奇数なら 1）", "start", 11.5, MUT))
    return SVG(720, yl + 96, o, "段階 2 の筆算（b = 0xCA）。b を 1〜4 ビット回転したものと定数 0x63 を縦にそろえ、列ごとに XOR する。")
F["e14_affine"] = _f14_affine()


# 差分の分布の比較（Δ = 0x01）
def _f14_ddt():
    o = []
    d = 0x01
    cntA = [0] * 256
    for a in range(256):
        cntA[_A14_S[a] ^ _A14_S[a ^ d]] += 1
    cntB = [0] * 256
    for a in range(256):
        cntB[_a14_aff(a) ^ _a14_aff(a ^ d)] += 1
    cs = 12

    def panel(x0, cnt, title, col):
        r = [T(x0 + 8 * cs + 10, 22, title, "middle", 12, col, True)]
        for hi in range(16):
            r.append(T(x0 + 4, 50 + hi * cs + 9, "%X" % hi, "end", 8.5, MUT, False, True))
            r.append(T(x0 + 16 + hi * cs + 5, 44, "%X" % hi, "middle", 8.5, MUT, False, True))
            for lo in range(16):
                v = cnt[hi * 16 + lo]
                if v >= 5:
                    fl, c = ALI, ALI
                elif v == 4:
                    fl, c = SIG, SIG
                elif v == 2:
                    fl, c = SSOFT, SIG
                else:
                    fl, c = PAN, LIN
                r.append(RECT(x0 + 10 + lo * cs, 42 + 8 + hi * cs - 8 + 8, cs - 2, cs - 2, 1.5, fl, c, 0.8))
        return "".join(r)

    o.append(panel(30, cntA, "AES の S-box（逆元 + アフィン変換）", SIG))
    o.append(panel(390, cntB, "悪い例: アフィン変換だけ（逆元なし）", ALI))
    big = [i for i, v in enumerate(cntA) if v == 4][0]
    yb = 50 + 16 * cs + 22
    o.append(RECT(36, yb - 9, 10, 10, 1.5, SIG, SIG, 0.8))
    o.append(T(52, yb, "4 個: 1 種類（Δ′ = 0x%02X）" % big, "start", 11, INK))
    o.append(RECT(36, yb + 9, 10, 10, 1.5, SSOFT, SIG, 0.8))
    o.append(T(52, yb + 18, "2 個: 126 種類", "start", 11, INK))
    o.append(RECT(36, yb + 27, 10, 10, 1.5, PAN, LIN, 0.8))
    o.append(T(52, yb + 36, "0 個: 129 種類", "start", 11, INK))
    o.append(T(200, yb + 18, "最大でも 4/256 = 2⁻⁶", "start", 11.5, SIG, True))
    one = [i for i, v in enumerate(cntB) if v][0]
    o.append(RECT(396, yb - 9, 10, 10, 1.5, ALI, ALI, 0.8))
    o.append(T(412, yb, "256 個: Δ′ = 0x%02X の 1 種類だけ" % one, "start", 11, INK))
    o.append(T(412, yb + 18, "出力の差が入力の値によらず決まる", "start", 11, INK))
    o.append(T(412, yb + 36, "差分確率 256/256 = 1", "start", 11.5, ALI, True))
    return SVG(720, yb + 50, o, "入力の差を Δ = 0x01 に固定し、256 通りの入力 a について出力の差 Δ′ = S(a) ⊕ S(a ⊕ 0x01) が何回現れるかを数えた。"
               "1 マスが Δ′ の 1 つの値で、行が上位 4 ビット、列が下位 4 ビット。")
F["e14_ddt"] = _f14_ddt()


# キャッシュラインから鍵の上位ビットが分かる
def _f14_cache():
    o = []
    p, k = 0xA0, 0x2B
    idx = p ^ k
    line = idx >> 6
    # 左: 計算
    o.append(T(20, 26, "1 ラウンド目の表引き", "start", 12.5, INK, True))
    rows = [("p", p, "平文のバイト（攻撃者が選ぶ）", INK), ("k", k, "鍵のバイト（秘密）", ALI), ("p ⊕ k", idx, "表を読む位置", SIG)]
    for r, (nm, v, note, col) in enumerate(rows):
        y = 44 + r * 46
        o.append(T(70, y + 16, nm, "end", 12, col, True, True))
        o.append(_bits14(78, y, v, 20, 22, hl={7, 6}, hlc=col, hlf=SSOFT if col == SIG else (ASOFT if col == ALI else SCR), sz=11))
        o.append(T(78, y + 36, "0x%02X  %s" % (v, note), "start", 10.5, MUT))
    o.append(T(20, 196, "上位 2 ビット（色付き）でライン", "start", 11, INK))
    o.append(T(20, 214, "が決まる: 10 → ライン 2", "start", 11, INK))
    # 中: 表
    gx, gy, cs = 268, 40, 12.5
    o.append(T(gx + 8 * cs, 26, "S-box の表（256 バイト）", "middle", 12, INK, True))
    for hi in range(16):
        ln = hi // 4
        for lo in range(16):
            v = hi * 16 + lo
            if v == idx:
                fl, c = ALI, ALI
            elif ln == line:
                fl, c = ASOFT, ALI
            else:
                fl, c = (SCR if ln % 2 == 0 else _GS14), LIN
            o.append(RECT(gx + lo * cs, gy + hi * cs + ln * 4, cs - 1.5, cs - 1.5, 1.5, fl, c, 0.7))
    for ln in range(4):
        y = gy + ln * (4 * cs + 4) + 2 * cs + 4
        o.append(T(gx + 16 * cs + 8, y, "ライン %d" % ln, "start", 10.5, ALI if ln == line else MUT, ln == line))
        o.append(T(gx + 16 * cs + 8, y + 14, "0x%02X〜0x%02X" % (64 * ln, 64 * ln + 63), "start", 9.5, MUT, False, True))
    # 右: 推論
    rx = 548
    o.append(T(rx, 26, "攻撃者が分かること", "start", 12.5, INK, True))
    lines = [("観測: ライン 2 が読まれた", INK, False),
             ("→ p ⊕ k の上位 2 ビット = 10", INK, False),
             ("p の上位 2 ビット = 10", MUT, False),
             ("→ k の上位 2 ビット", INK, False),
             ("   = 10 ⊕ 10 = 00", INK, False),
             ("k は 0x00〜0x3F のどれか", ALI, True),
             ("（256 通り → 64 通り）", ALI, False)]
    for r, (s, col, bb) in enumerate(lines):
        o.append(T(rx, 54 + r * 22, s, "start", 11, col, bb))
    return SVG(720, 262, o, "表を引く実装で、1 ラウンド目に読まれるキャッシュライン（64 バイトの塊）が観測できた場合。"
               "256 バイトの S-box は 4 本のラインに分かれ、どのラインかは読む位置 p ⊕ k の上位 2 ビットで決まる。")
F["e14_cache"] = _f14_cache()


# ======================================================================
# 4 節
# ======================================================================

def _f14_shiftrows():
    o = []
    cs = 44
    gx1, gx2, gy = 40, 380, 46
    o.append(T(gx1 + 2 * cs - 2, 26, "ShiftRows の前", "middle", 12.5, INK, True))
    o.append(T(gx2 + 2 * cs - 2, 26, "ShiftRows の後", "middle", 12.5, INK, True))
    for i in range(4):
        for j in range(4):
            fl, c = _COLS14[j]
            o.append(_c14(gx1 + j * cs, gy + i * cs, cs - 4, cs - 4, "%d,%d" % (i, j), fl, c, INK, 11.5))
            oj = (j + i) % 4
            fl, c = _COLS14[oj]
            o.append(_c14(gx2 + j * cs, gy + i * cs, cs - 4, cs - 4, "%d,%d" % (i, oj), fl, c, INK, 11.5))
        y = gy + i * cs + 20
        o.append(ARR(gx1 + 4 * cs + 8, y, gx2 - 10, y, MUT, 1.4))
        o.append(T((gx1 + 4 * cs + gx2) / 2, y - 6, ["そのまま", "左へ 1 バイト", "左へ 2 バイト", "左へ 3 バイト"][i],
                   "middle", 11, SIG if i else MUT, i > 0))
    o.append(T(gx1, gy + 4 * cs + 22, "マスの「i,j」は元の位置（i 行 j 列）、色は元の列", "start", 11, MUT))
    o.append(T(gx2, gy + 4 * cs + 22, "どの列にも 4 色が 1 つずつ集まる", "start", 11, SIG, True))
    return SVG(620, gy + 4 * cs + 36, o, "ShiftRows。第 i 行を左に i バイト巡回シフトする。"
               "シフトした後の各列には、元の 4 つの列から 1 バイトずつが集まる。")
F["e14_shiftrows"] = _f14_shiftrows()


# ======================================================================
# 5 節
# ======================================================================

# MixColumns の 1 行目の筆算
def _f14_mixcol():
    o = []
    cw, ch = 24, 22
    # 左: xtime
    x0 = 120
    o.append(T(20, 22, "① 掛け算を xtime で計算する", "start", 12.5, INK, True))
    y = 34
    o.append(T(x0 - 10, y + 16, "DB", "end", 11.5, INK, True, True))
    o.append(_bits14(x0, y, 0xDB, cw, ch, hl={7}, hlc=ALI, hlf=ASOFT, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "最上位が 1", "start", 10.5, ALI))
    y += 28
    o.append(T(x0 - 30, y + 16, "左シフト", "end", 10.5, MUT))
    o.append(RECT(x0 - 25, y, 19, ch, 3, ASOFT, ALI, 1.2, "3,2"))
    o.append(T(x0 - 15.5, y + 15.5, "1", "middle", 11, ALI, True, True))
    o.append(_bits14(x0, y, (0xDB << 1) & 0xFF, cw, ch, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "あふれた 1 の代わりに", "start", 10.5, MUT))
    y += 28
    o.append(T(x0 - 10, y + 16, "⊕ 1B", "end", 11, INK, True, True))
    o.append(_bits14(x0, y, 0x1B, cw, ch, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "0x1B を XOR", "start", 10.5, MUT))
    o.append(W(x0 - 4, y + ch + 4, x0 + 8 * cw, y + ch + 4, c=INK, lw=1.2))
    y += 32
    o.append(T(x0 - 10, y + 16, "02·DB", "end", 11.5, SIG, True, True))
    o.append(_bits14(x0, y, _a14_mul(2, 0xDB), cw, ch, fill=SSOFT, c=SIG, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "= AD", "start", 11.5, SIG, True, True))
    y += 40
    o.append(T(x0 - 10, y + 16, "02·13", "end", 11.5, INK, True, True))
    o.append(_bits14(x0, y, _a14_mul(2, 0x13), cw, ch, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "= 26（あふれ無し）", "start", 10.5, MUT))
    y += 28
    o.append(T(x0 - 10, y + 16, "⊕ 13", "end", 11, INK, True, True))
    o.append(_bits14(x0, y, 0x13, cw, ch, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "03 = 02 ⊕ 01", "start", 10.5, MUT))
    o.append(W(x0 - 4, y + ch + 4, x0 + 8 * cw, y + ch + 4, c=INK, lw=1.2))
    y += 32
    o.append(T(x0 - 10, y + 16, "03·13", "end", 11.5, SIG, True, True))
    o.append(_bits14(x0, y, _a14_mul(3, 0x13), cw, ch, fill=SSOFT, c=SIG, sz=11))
    o.append(T(x0 + 8 * cw + 6, y + 15, "= 35", "start", 11.5, SIG, True, True))
    ybot = y + 30
    # 右: XOR
    x1 = 500
    o.append(T(410, 22, "② 4 項を XOR する", "start", 12.5, INK, True))
    terms = [("02·DB", 0xAD), ("03·13", 0x35), ("53", 0x53), ("45", 0x45)]
    yy = 34
    for nm, v in terms:
        o.append(T(x1 - 10, yy + 16, nm, "end", 11.5, INK, True, True))
        o.append(_bits14(x1, yy, v, cw, ch, sz=11))
        o.append(T(x1 + 8 * cw + 4, yy + 16, "%02X" % v, "start", 11.5, INK, False, True))
        yy += 28
    o.append(W(x1 - 4, yy, x1 + 8 * cw, yy, c=INK, lw=1.2))
    yy += 6
    res = _a14_mixcol([0xDB, 0x13, 0x53, 0x45])[0]
    o.append(_ts14(x1 - 10, yy + 16, ["s′", ("0,j", "sub")], "end", 12.5, SIG, True, True))
    o.append(_bits14(x1, yy, res, cw, ch, fill=SSOFT, c=SIG, sz=11))
    o.append(T(x1 + 8 * cw + 4, yy + 16, "%02X" % res, "start", 12, SIG, True, True))
    o.append(_ts14(410, yy + 48, ["s′", ("0,j", "sub"), " = 02·s", ("0,j", "sub"), " ⊕ 03·s", ("1,j", "sub"),
                                  " ⊕ s", ("2,j", "sub"), " ⊕ s", ("3,j", "sub")], "start", 12, MUT, False, True))
    o.append(T(410, yy + 70, "列 (DB, 13, 53, 45) の 1 行目", "start", 11.5, MUT))
    return SVG(720, max(ybot, yy + 80), o, "MixColumns の出力の 1 バイト目を計算する筆算。行列の成分 02・03 の掛け算は xtime（1 ビット左シフトと、あふれたときの 0x1B の XOR）で済み、足し算は XOR である。")
F["e14_mixcol"] = _f14_mixcol()


# 分岐数: 入力と出力で違うバイトの数の和
def _f14_branch():
    o = []
    B = [[0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0]]
    cases = [("AES の行列", [1, 0, 0, 0], _A14_M, SIG),
             ("AES の行列", [1, 1, 0, 0], _A14_M, SIG),
             ("悪い例: 0 と 1 だけの行列", [1, 1, 0, 0], B, ALI)]
    for p, (title, din, M, col) in enumerate(cases):
        x0 = 20 + p * 236
        dout = _a14_mixcol(din, M)
        o.append(T(x0 + 100, 22, title, "middle", 12, col, True))
        for i in range(4):
            on = din[i] != 0
            o.append(_c14(x0 + 10, 40 + i * 32, 46, 28, "%02X" % din[i], SSOFT if on else PAN, SIG if on else LIN,
                          INK if on else FNT, 12, on))
            on2 = dout[i] != 0
            o.append(_c14(x0 + 144, 40 + i * 32, 46, 28, "%02X" % dout[i], (SSOFT if col == SIG else ASOFT) if on2 else PAN,
                          col if on2 else LIN, INK if on2 else FNT, 12, on2))
        o.append(ARR(x0 + 62, 102, x0 + 138, 102, MUT, 1.5))
        o.append(T(x0 + 100, 94, "MC" if M is _A14_M else "行列", "middle", 11, MUT, True))
        o.append(T(x0 + 33, 182, "入力の差", "middle", 10.5, MUT))
        o.append(T(x0 + 167, 182, "出力の差", "middle", 10.5, MUT))
        nin = sum(1 for v in din if v)
        nout = sum(1 for v in dout if v)
        o.append(T(x0 + 100, 206, "%d + %d = %d" % (nin, nout, nin + nout), "middle", 13, col, True))
    o.append(T(20 + 2 * 236 + 100, 226, "5 に届かない（MDS でない）", "middle", 11, ALI))
    o.append(T(20 + 118, 226, "どんな差でも 5 以上（分岐数 5）", "middle", 11, SIG))
    return SVG(720, 238, o, "1 つの列で、入力の差（XOR）と出力の差の、0 でないバイトの数を数えた。"
               "AES の行列は入力の差が 1 バイトでも出力の 4 バイトすべてに広げ、合計は必ず 5 以上になる。0 と 1 だけの行列（各出力は自分以外の 3 バイトの XOR）では 4 で済む差がある。")
F["e14_branch"] = _f14_branch()


# 2 ラウンドで全体に広がる（ShiftRows のある場合と無い場合）
def _f14_diffusion():
    o = []
    rk = [sum(_W14[4 * r:4 * r + 4], []) for r in range(11)]
    q = _P14[:]
    q[0] ^= 0x01

    def run(noshift):
        a = _a14_xor(_P14, rk[0])
        b = _a14_xor(q, rk[0])
        pats = [[i for i in range(16) if a[i] != b[i]]]
        for r in (1, 2):
            a = _a14_sub(a); b = _a14_sub(b)
            if not noshift:
                a = _a14_shift(a); b = _a14_shift(b)
                pats.append([i for i in range(16) if a[i] != b[i]])
            else:
                pats.append([i for i in range(16) if a[i] != b[i]])
            a = _a14_mix(a); b = _a14_mix(b)
            pats.append([i for i in range(16) if a[i] != b[i]])
        return pats

    labels = ["入力の差", "1R: S・SR 後", "1R: MC 後", "2R: S・SR 後", "2R: MC 後"]
    labels2 = ["入力の差", "1R: S 後", "1R: MC 後", "2R: S 後", "2R: MC 後"]
    cs = 20
    for row, (noshift, title, col, labs) in enumerate([(False, "ShiftRows あり（AES）", SIG, labels),
                                                        (True, "ShiftRows が無い場合", ALI, labels2)]):
        pats = run(noshift)
        y0 = 30 + row * 152
        o.append(T(20, y0, title, "start", 12.5, col, True))
        for k, pt in enumerate(pats):
            x0 = 30 + k * 138
            hl = set(pt)
            for j in range(4):
                for i in range(4):
                    idx = i + 4 * j
                    on = idx in hl
                    o.append(RECT(x0 + j * cs, y0 + 14 + i * cs, cs - 3, cs - 3, 2.5,
                                  (SSOFT if col == SIG else ASOFT) if on else PAN, col if on else LIN, 1.1))
            o.append(T(x0 + 2 * cs - 2, y0 + 14 + 4 * cs + 16, labs[k], "middle", 10.5, MUT))
            o.append(T(x0 + 2 * cs - 2, y0 + 14 + 4 * cs + 31, "%d バイト" % len(pt), "middle", 10.5, col, True))
            if k < len(pats) - 1:
                o.append(ARR(x0 + 4 * cs + 4, y0 + 14 + 2 * cs, x0 + 134, y0 + 14 + 2 * cs, MUT, 1.3))
    return SVG(720, 316, o, "平文の 1 バイト（s<sub>0,0</sub> の最下位ビット）だけが違う 2 つの平文を暗号化し、状態の値が違うバイトに色を付けた（S = SubBytes、SR = ShiftRows、MC = MixColumns、1R = ラウンド 1）。"
               "AddRoundKey は 2 つに同じ鍵を XOR するので、違うバイトの位置を変えない。")
F["e14_diffusion"] = _f14_diffusion()


# ======================================================================
# 6 節
# ======================================================================

def _f14_ark():
    o = []
    st = _P14
    k0 = _K14
    res = _a14_xor(st, k0)
    cs = 38
    gys = 44
    xs = [24, 230, 436]
    names = [("状態（平文）", INK), ("ラウンド鍵 K₀", SIG), ("AddRoundKey の後", _B14)]
    for x, (nm, col), vals in zip(xs, names, [st, k0, res]):
        o.append(T(x + 2 * cs - 2, 28, nm, "middle", 12, col, True))
        o.append(_grid14(x, gys, [_h14(v) for v in vals], cs, hl={0},
                         hlf=SSOFT if col == SIG else (_BS14 if col == _B14 else SCR), hlc=col if col != INK else INK, sz=12))
    o.append(T(xs[0] + 4 * cs + 22, gys + 2 * cs + 6, "⊕", "middle", 20, INK, True))
    o.append(T(xs[1] + 4 * cs + 22, gys + 2 * cs + 6, "=", "middle", 20, INK, True))
    y = gys + 4 * cs + 22
    o.append(T(24, y, "左上のマス:", "start", 11.5, INK, True))
    o.append(T(110, y, "32 ⊕ 2b = 00110010 ⊕ 00101011 = 00011001 = 19", "start", 11.5, INK, False, True))
    o.append(T(24, y + 22, "16 マスすべてで、同じ位置どうしを XOR する", "start", 11.5, MUT))
    return SVG(640, y + 34, o, "AddRoundKey（FIPS 197 の例の最初の AddRoundKey）。ラウンド鍵も状態と同じく列ごとに上から並べ、同じ位置のバイトどうしを XOR する。")
F["e14_ark"] = _f14_ark()


def _f14_keysched():
    o = []
    Wv = ["".join(_h14(b) for b in w) for w in _W14[:8]]
    bw, bh = 120, 46
    xs = [24 + k * 150 for k in range(4)]
    y0, y1 = 44, 168
    o.append(_ts14(24, 24, ["K", ("0", "sub"), " = 元の鍵（W0〜W3）"], "start", 12.5, SIG, True))
    o.append(_ts14(24, y1 + bh + 20, ["K", ("1", "sub"), "（W4〜W7）"], "start", 12.5, _B14, True))
    for k in range(4):
        o.append(RECT(xs[k], y0, bw, bh, 6, SSOFT, SIG, 1.4))
        o.append(T(xs[k] + bw / 2, y0 + 18, "W%d" % k, "middle", 11, SIG, True, True))
        o.append(T(xs[k] + bw / 2, y0 + 36, Wv[k], "middle", 11.5, INK, False, True))
        o.append(RECT(xs[k], y1, bw, bh, 6, _BS14, _B14, 1.4))
        o.append(T(xs[k] + bw / 2, y1 + 18, "W%d" % (k + 4), "middle", 11, _B14, True, True))
        o.append(T(xs[k] + bw / 2, y1 + 36, Wv[k + 4], "middle", 11.5, INK, False, True))
        cx = xs[k] + 30
        o.append(W(cx, y0 + bh, cx, y1 - 32, c=INK, lw=1.4))
        o.append(_xorc14(cx, y1 - 22))
        o.append(ARR(cx, y1 - 13, cx, y1 - 2, INK, 1.4))
    # g(W3) を W4 の ⊕ へ
    gx = xs[3] + bw + 18
    o.append(ARR(xs[3] + bw, y0 + 23, gx - 2, y0 + 23, INK, 1.4))
    o.append(_c14(gx, y0 + 6, 34, 34, "g", ASOFT, ALI, INK, 14, True, False, 6, 1.5))
    o.append(W(gx + 17, y0 + 40, gx + 17, y0 + 84, c=ALI, lw=1.5))
    o.append(ARR(gx + 17, y0 + 84, xs[0] + 40, y0 + 84, ALI, 1.5))
    o.append(T(xs[2] + 60, y0 + 78, "g(W3)", "middle", 11, ALI, True, True))
    # W_{i-1} を次の ⊕ へ
    for k in range(1, 4):
        cx = xs[k] + 30
        o.append(ARR(xs[k - 1] + bw, y1 + 23, cx - 10, y1 - 22, INK, 1.3))
    # g の中身
    yg = y1 + bh + 54
    o.append(T(24, yg, "g の中身（W4 の計算、i が 4 の倍数のとき）:", "start", 11.5, ALI, True))
    steps = [("W3", "09cf4f3c"), ("RotWord", "cf4f3c09"), ("SubWord", "8a84eb01"), ("⊕ Rcon₁", "8b84eb01")]
    for k, (nm, v) in enumerate(steps):
        x = 24 + k * 162
        o.append(_c14(x, yg + 12, 120, 40, "", PAN, ALI if k else LIN, INK, 11))
        o.append(T(x + 60, yg + 28, nm, "middle", 10.5, MUT, True))
        o.append(T(x + 60, yg + 45, v, "middle", 11.5, INK, False, True))
        if k:
            o.append(ARR(x - 40, yg + 32, x - 2, yg + 32, ALI, 1.4))
    o.append(T(24, yg + 76, "W4 = W0 ⊕ g(W3) = 2b7e1516 ⊕ 8b84eb01 = a0fafe17、W5 = W1 ⊕ W4 = 88542cb1、…", "start", 11.5, INK, False, True))
    return SVG(720, yg + 90, o, "鍵スケジュール（FIPS 197 の例）。新しい語 Wᵢ は、4 つ前の語 Wᵢ₋₄ と、1 つ前の語 Wᵢ₋₁（i が 4 の倍数なら g を通したもの）の XOR である。"
               "4 語ずつがラウンド鍵 1 個になる。")
F["e14_keysched"] = _f14_keysched()


# ======================================================================
# 7 節
# ======================================================================

def _f14_decflow():
    o = []
    enc = ["⊕K₀", "SB", "SR", "MC", "⊕K₁", "…", "SB", "SR", "⊕K₁₀"]
    dec = ["⊕K₀", "InvSB", "InvSR", "InvMC", "⊕K₁", "…", "InvSB", "InvSR", "⊕K₁₀"]
    bw, gap = 64, 12
    x0 = 70
    ye, yd = 40, 140
    o.append(T(20, ye + 20, "暗号化", "start", 12, INK, True))
    o.append(T(20, yd + 20, "復号", "start", 12, _B14, True))
    for k in range(len(enc)):
        x = x0 + k * (bw + gap)
        if enc[k] == "…":
            o.append(T(x + bw / 2, ye + 22, "…", "middle", 16, INK, True))
            o.append(T(x + bw / 2, yd + 22, "…", "middle", 16, _B14, True))
            continue
        key = enc[k].startswith("⊕")
        o.append(_c14(x, ye, bw, 30, enc[k], SSOFT if key else PAN, SIG if key else INK, INK, 11, True, False, 5))
        o.append(_c14(x, yd, bw, 30, dec[k], SSOFT if key else _BS14, SIG if key else _B14, INK, 10.5 if len(dec[k]) > 4 else 11, True, False, 5))
        o.append(W(x + bw / 2, ye + 32, x + bw / 2, yd - 2, c=LIN, lw=1.2, dash="3,3"))
    for k in range(len(enc) - 1):
        x = x0 + k * (bw + gap)
        o.append(ARR(x + bw + 1, ye + 15, x + bw + gap - 1, ye + 15, INK, 1.3, 5))
        o.append(ARR(x + bw + gap - 1, yd + 15, x + bw + 1, yd + 15, _B14, 1.3, 5))
    o.append(T(x0 + 4 * (bw + gap), ye - 10, "→ 左から右へ", "middle", 10.5, MUT))
    o.append(T(x0 + 4 * (bw + gap), yd + 50, "← 右から左へ（逆の操作を逆の順に）", "middle", 10.5, _B14))
    o.append(T(20, 214, "SB = SubBytes、SR = ShiftRows、MC = MixColumns、⊕Kᵣ = AddRoundKey。点線で結んだものが互いに逆の操作。", "start", 11, MUT))
    return SVG(760, 228, o, "暗号化と復号の対応。復号は暗号文の側（右端）から始め、各操作の逆をたどって平文に戻る。")
F["e14_decflow"] = _f14_decflow()


def _f14_lastmc():
    o = []
    bw = 96

    def row(y, items, title, col):
        r = [T(20, y - 12, title, "start", 12, col, True)]
        x = 20
        for k, (s, kind) in enumerate(items):
            if kind == "key":
                r.append(_c14(x, y, bw + 20, 32, s, SSOFT, SIG, INK, 11.5, True, False, 5))
                w = bw + 20
            elif kind == "mc":
                r.append(_c14(x, y, bw - 20, 32, s, ASOFT, ALI, INK, 11.5, True, False, 5))
                w = bw - 20
            elif kind == "out":
                r.append(_c14(x, y, bw, 32, s, PAN, MUT, INK, 11.5, True, False, 5))
                w = bw
            else:
                r.append(_c14(x, y, bw - 20, 32, s, PAN, INK, INK, 11.5, True, False, 5))
                w = bw - 20
            if k < len(items) - 1:
                r.append(ARR(x + w + 2, y + 16, x + w + 26, y + 16, INK, 1.4))
            x += w + 28
        return "".join(r)

    o.append(row(40, [("…", "op"), ("SR", "op"), ("MC", "mc"), ("⊕ k", "key"), ("C", "out")],
                 "最後に MixColumns があったとすると", INK))
    o.append(row(112, [("…", "op"), ("SR", "op"), ("⊕ MC⁻¹(k)", "key"), ("MC", "mc"), ("C", "out")],
                 "同じ計算（MC が線形なので鍵の XOR と順番を入れ替えられる）", INK))
    o.append(row(184, [("…", "op"), ("SR", "op"), ("⊕ MC⁻¹(k)", "key"), ("C* = MC⁻¹(C)", "out")],
                 "攻撃者は C に MC⁻¹ をかけて、最後の MC が無い暗号として扱える", ALI))
    return SVG(640, 230, o, "最終ラウンドの MixColumns が安全性に寄与しない理由。MC(x) ⊕ k = MC(x ⊕ MC⁻¹(k)) なので、最後の MC は鍵を使わない公開の計算として外に出せる。")
F["e14_lastmc"] = _f14_lastmc()


# ======================================================================
# 8 節
# ======================================================================

def _blk14(x, y, w, h, s, fill, c, sz=12):
    return _c14(x, y, w, h, s, fill, c, INK, sz, True, False, 5, 1.4)



def _f14_ecb():
    o = []
    pats = [("A", SSOFT, SIG), ("B", _BS14, _B14), ("A", SSOFT, SIG), ("C", _GS14, MUT)]
    outs = ["X", "Y", "X", "Z"]
    for k, ((s, fl, c), t) in enumerate(zip(pats, outs)):
        x = 40 + k * 160
        o.append(_blk14(x, 30, 100, 32, "P%s = %s" % ("₁₂₃₄"[k], s), fl, c))
        o.append(ARR(x + 50, 64, x + 50, 84, INK, 1.4))
        o.append(_ek14(x + 15, 86))
        o.append(ARR(x + 50, 118, x + 50, 138, INK, 1.4))
        o.append(_blk14(x, 140, 100, 32, "C%s = %s" % ("₁₂₃₄"[k], t), fl, c))
    o.append(T(360, 200, "P₁ = P₃ なので C₁ = C₃（同じ平文ブロックは必ず同じ暗号文ブロックになる）", "middle", 11.5, ALI, True))
    return SVG(720, 214, o, "ECB モード。各ブロックを同じ鍵で独立に暗号化する。平文の繰り返しが、そのまま暗号文の繰り返しとして残る。")
F["e14_ecb"] = _f14_ecb()


def _f14_cbc():
    o = []
    o.append(_blk14(20, 92, 62, 30, "IV", SCR, MUT))
    for k in range(3):
        x = 150 + k * 190
        o.append(_blk14(x - 30, 24, 60, 30, "P%s" % "₁₂₃"[k], PAN, INK))
        o.append(ARR(x, 56, x, 96, INK, 1.4))
        o.append(_xorc14(x, 107))
        o.append(ARR(x, 117, x, 138, INK, 1.4))
        o.append(_ek14(x - 35, 140))
        o.append(ARR(x, 172, x, 192, INK, 1.4))
        o.append(_blk14(x - 30, 194, 60, 30, "C%s" % "₁₂₃"[k], _BS14, _B14))
        if k < 2:
            o.append(W(x + 32, 209, x + 85, 209, c=_B14, lw=1.4))
            o.append(W(x + 85, 209, x + 85, 107, c=_B14, lw=1.4))
            o.append(ARR(x + 85, 107, x + 190 - 11, 107, _B14, 1.4))
    o.append(ARR(84, 107, 139, 107, MUT, 1.4))
    o.append(_ts14(20, 248, ["C", ("i", "sub"), " = E", ("K", "sub"), "(P", ("i", "sub"), " ⊕ C", ("i−1", "sub"), ")、C", ("0", "sub"),
                             " = IV。前の暗号文ブロックが次のブロックに混ざる。"], "start", 12, INK))
    return SVG(720, 262, o, "CBC モードの暗号化。同じ平文ブロックでも、直前の暗号文ブロックが違えば違う値を暗号化するので、繰り返しが隠れる。")
F["e14_cbc"] = _f14_cbc()


def _f14_ctr():
    o = []
    for k in range(3):
        x = 120 + k * 210
        o.append(_blk14(x - 46, 24, 92, 30, "N ‖ %d" % (k + 1), SCR, MUT))
        o.append(ARR(x, 56, x, 76, INK, 1.4))
        o.append(_ek14(x - 35, 78))
        o.append(ARR(x, 110, x, 134, SIG, 1.4))
        o.append(T(x + 8, 126, "鍵ストリーム", "start", 10, SIG))
        o.append(_xorc14(x, 145))
        o.append(_blk14(x - 104, 130, 46, 30, "P%s" % "₁₂₃"[k], PAN, INK, 11.5))
        o.append(ARR(x - 56, 145, x - 11, 145, INK, 1.4))
        o.append(ARR(x, 155, x, 178, INK, 1.4))
        o.append(_blk14(x - 30, 180, 60, 30, "C%s" % "₁₂₃"[k], _BS14, _B14))
    o.append(_ts14(20, 238, ["C", ("i", "sub"), " = P", ("i", "sub"), " ⊕ E", ("K", "sub"),
                             "(N ‖ i)。ブロック暗号で鍵ストリームを作るストリーム暗号で、各ブロックは独立に計算できる。"], "start", 12, INK))
    return SVG(720, 252, o, "CTR モード。ノンス N とブロック番号 i をつないだ値を暗号化し、平文と XOR する。復号も同じ鍵ストリームを XOR するだけで、D<sub>K</sub> は使わない。")
F["e14_ctr"] = _f14_ctr()


def _f14_gcm():
    o = []
    # 上段: CTR
    o.append(T(20, 22, "暗号化（CTR と同じ。番号 1 はタグ用に取っておく）", "start", 12, INK, True))
    cols = [(130, "N ‖ 2", "P₁", "C₁"), (330, "N ‖ 3", "P₂", "C₂")]
    for x, nn, pp, cc in cols:
        o.append(_blk14(x - 44, 34, 88, 28, nn, SCR, MUT, 11.5))
        o.append(ARR(x, 64, x, 78, INK, 1.4))
        o.append(_ek14(x - 32, 80, 64, 28))
        o.append(ARR(x, 110, x, 124, INK, 1.4))
        o.append(_xorc14(x, 134))
        o.append(_blk14(x - 92, 120, 40, 28, pp, PAN, INK, 11.5))
        o.append(ARR(x - 50, 134, x - 11, 134, INK, 1.4))
        o.append(ARR(x, 144, x, 166, INK, 1.4))
        o.append(_blk14(x - 26, 168, 52, 28, cc, _BS14, _B14, 11.5))
    o.append(_blk14(482, 34, 88, 28, "N ‖ 1", SCR, MUT, 11.5))
    o.append(ARR(526, 64, 526, 78, INK, 1.4))
    o.append(_ek14(494, 80, 64, 28))
    o.append(T(518, 128, "タグを隠す値", "end", 10.5, MUT))
    o.append(_blk14(600, 34, 96, 28, "0 ブロック", SCR, MUT, 11))
    o.append(ARR(648, 64, 648, 78, INK, 1.4))
    o.append(_ek14(616, 80, 64, 28))
    o.append(T(648, 128, "H", "middle", 13, ALI, True, True))
    o.append(T(648, 144, "（GHASH の鍵）", "middle", 10, ALI))
    # 下段: GHASH
    y = 252
    xs = [40, 130, 250, 370, 490]
    o.append(_c14(xs[0] - 20, y - 14, 40, 28, "0", PAN, LIN, INK, 12, True))
    o.append(ARR(xs[0] + 22, y, xs[1] - 11, y, INK, 1.4))
    o.append(_xorc14(xs[1], y))
    o.append(ARR(130, 198, 130, y - 11, _B14, 1.4))
    o.append(ARR(xs[1] + 11, y, xs[1] + 40, y, INK, 1.4))
    o.append(_c14(xs[1] + 42, y - 14, 40, 28, "×H", ASOFT, ALI, INK, 11.5, True, False))
    o.append(ARR(xs[1] + 84, y, xs[2] + 50 - 11, y, INK, 1.4))
    o.append(_xorc14(xs[2] + 50, y))
    o.append(ARR(330, 198, xs[2] + 50, y - 11, _B14, 1.4))
    o.append(ARR(xs[2] + 61, y, xs[2] + 84, y, INK, 1.4))
    o.append(_c14(xs[2] + 86, y - 14, 40, 28, "×H", ASOFT, ALI, INK, 11.5, True, False))
    o.append(ARR(xs[2] + 128, y, xs[3] + 60 - 11, y, INK, 1.4))
    o.append(_xorc14(xs[3] + 60, y))
    o.append(T(xs[3] + 60, y - 30, "長さ", "middle", 10.5, MUT))
    o.append(ARR(xs[3] + 60, y - 24, xs[3] + 60, y - 11, MUT, 1.2))
    o.append(ARR(xs[3] + 71, y, xs[3] + 94, y, INK, 1.4))
    o.append(_c14(xs[3] + 96, y - 14, 40, 28, "×H", ASOFT, ALI, INK, 11.5, True, False))
    o.append(ARR(xs[3] + 138, y, xs[4] + 104 - 11, y, INK, 1.4))
    o.append(_xorc14(xs[4] + 104, y))
    o.append(W(526, 110, 526, 200, c=MUT, lw=1.3))
    o.append(ARR(526, 200, xs[4] + 104, y - 11, MUT, 1.3))
    o.append(ARR(xs[4] + 115, y, xs[4] + 138, y, INK, 1.4))
    o.append(_c14(xs[4] + 140, y - 15, 64, 30, "タグ T", SSOFT, SIG, INK, 12, True, False))
    o.append(T(20, y + 40, "認証タグの計算（GHASH）: GF(2¹²⁸) で「足して H を掛ける」を繰り返す", "start", 12, ALI, True))
    o.append(T(20, y + 62, "受信者も同じ計算でタグを作り、届いた T と一致しなければ復号結果を使わずに捨てる。", "start", 11.5, INK))
    return SVG(720, y + 76, o, "GCM モード（2 ブロックの場合）。暗号化は CTR と同じで、暗号文ブロックから認証タグを計算して付ける。"
               "H = E<sub>K</sub>(0) は鍵を知る者にしか分からないので、攻撃者は書き換えた暗号文に合うタグを作れない。")
F["e14_gcm"] = _f14_gcm()
