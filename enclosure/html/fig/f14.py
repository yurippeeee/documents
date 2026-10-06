# -*- coding: utf-8 -*-
# 14. EMC と筐体 の図（figures.py から exec される）

def _f14_spark(x1, y1, x2, y2, c=ALI, lw=1.8):
    """放電の稲妻（折れ線）"""
    n = 5; pts = []
    for i in range(n + 1):
        u = i / n
        x = x1 + (x2 - x1) * u; y = y1 + (y2 - y1) * u
        off = 0 if i in (0, n) else (5 if i % 2 else -5)
        dx, dy = (y2 - y1), -(x2 - x1); L = math.hypot(dx, dy) or 1
        pts.append((x + dx / L * off, y + dy / L * off))
    return PL(pts, c, lw)

def _f14_finger(x, y, c=MUT):
    """指先（右下へ向かう）"""
    return (PL([(x - 60, y - 34), (x - 8, y - 6)], c, 9) +
            CIRC(x - 4, y - 3, 5, c, 1, c))

# ---- 1. 3 つの役割 ----
def _f14_roles():
    o = []
    cols = [("放射エミッション", "中の回路が出す電波を外へ漏らさない", ALI, ASOFT),
            ("イミュニティ", "外の電波・ノイズで誤動作しない", GRN, PAN),
            ("ESD（静電気放電）", "人の指からの放電を回路に入れない", SIG, SSOFT)]
    for k, (t, s, c, fl) in enumerate(cols):
        x0 = 20 + k * 282
        cx = x0 + 130
        o.append(RECT(cx - 55, 52, 110, 80, 6, SCR, INK, 2))
        o.append(RECT(cx - 35, 100, 70, 8, 1, GRN, GRN, 1))
        o.append(RECT(cx - 12, 88, 24, 12, 2, ASOFT, ALI, 1.2))
        if k == 0:
            for r in (20, 34, 48):
                o.append('<path d="M %g %g A %g %g 0 0 1 %g %g" fill="none" stroke="%s" stroke-width="1.6"/>'
                         % (cx + 55 + r * 0.2, 92 - r, r, r, cx + 55 + r * 0.2, 92 + r, ALI))
            o.append(T(cx - 70, 96, "クロック", "end", 9.5, MUT))
        elif k == 1:
            for r in (20, 34, 48):
                o.append('<path d="M %g %g A %g %g 0 0 0 %g %g" fill="none" stroke="%s" stroke-width="1.6"/>'
                         % (cx - 55 - r * 0.2, 92 - r, r, r, cx - 55 - r * 0.2, 92 + r, GRN))
            o.append(T(cx + 64, 70, "無線機", "start", 9.5, MUT))
            o.append(T(cx + 64, 84, "電源ノイズ", "start", 9.5, MUT))
        else:
            o.append(_f14_finger(cx + 100, 40, MUT))
            o.append(_f14_spark(cx + 92, 42, cx + 55, 60, ALI))
            o.append(T(cx + 96, 68, "数 kV", "start", 10, ALI, True))
        o.append(BOX(x0 + 10, 150, 240, 50, t, s, c, fl, sz=12.5, ssz=10))
    return SVG(860, 214, o, "筐体が EMC で担う 3 つの役割。基板の対策と組み合わせて、規格の限度値や試験レベルを満たす。")
F["e14_roles"] = _f14_roles()


# ---- 2. 反射と吸収 ----
def _f14_mech():
    o = []
    wx, ww = 400, 90
    o.append(RECT(wx, 20, ww, 200, 0, LIN, INK, 1.4))
    o.append(T(wx + ww / 2, 236, "金属の壁（厚さ t）", "middle", 10.5, INK, True))
    # 入射波
    o.append(WAVE(60, 90, 330, 3.5, 34, ALI, 2))
    o.append(ARR(240, 40, 330, 40, ALI, 1.6))
    o.append(T(200, 44, "入射波", "end", 10.5, ALI, True))
    # 反射
    o.append(ARR(380, 168, 250, 168, GRN, 1.6))
    o.append(T(244, 172, "反射（大部分がここで返る）", "end", 10.5, GRN, True))
    # 壁の中で減衰
    o.append(WAVE(wx, 110, ww, 2.2, 32, ALI, 1.8, decay=3.2))
    import math as _m
    env = [(wx + ww * u / 40, 110 - 32 * _m.exp(-3.2 * u / 40)) for u in range(41)]
    o.append(PL(env, MUT, 1.1, "3,3"))
    o.append(DIM(wx, 150, wx + ww / 3.2, 150, None))
    o.append(T(wx + 15, 196, "δ で 1/e", "start", 9.5, MUT))
    o.append(W(wx + ww / 3.2 / 2, 150, wx + 16, 184, c=LIN, lw=1))
    o.append(T(wx + ww / 2, 14, "吸収（中で熱になる）", "middle", 10.5, INK, True))
    # 透過
    o.append(WAVE(wx + ww + 6, 110, 220, 2.5, 3, ALI, 1.6))
    o.append(T(wx + ww + 120, 140, "透過（ごくわずか）", "middle", 10.5, ALI))
    o.append(T(wx + ww + 120, 160, "SE = 反射損失 R + 吸収損失 A", "middle", 10.5, INK, True))
    return SVG(860, 250, o, "金属の壁による遮蔽。表面での反射と、壁の中での吸収（表皮深さ δ ごとに 1/e に減る）の 2 段で弱められる。")
F["e14_mech"] = _f14_mech()


# ---- 3. 表皮深さのグラフ ----
def _f14_skin():
    o = []
    import math as _m
    mu0 = 4e-7 * _m.pi
    ox, oy, gw, gh = 90, 250, 560, 220
    fx0, fx1 = 3, 10          # log10 f
    dy0, dy1 = -7, -2         # log10 δ[m]
    X = lambda lf: ox + (lf - fx0) / (fx1 - fx0) * gw
    Y = lambda ld: oy - (ld - dy0) / (dy1 - dy0) * gh
    labs_f = {3: "1 kHz", 4: "10 kHz", 5: "100 kHz", 6: "1 MHz", 7: "10 MHz", 8: "100 MHz", 9: "1 GHz", 10: "10 GHz"}
    for lf in range(fx0, fx1 + 1):
        o.append(W(X(lf), oy, X(lf), oy - gh, c=LIN, lw=0.6))
        o.append(T(X(lf), oy + 16, labs_f[lf], "middle", 9, FNT))
    labs_d = {-7: "0.1 µm", -6: "1 µm", -5: "10 µm", -4: "100 µm", -3: "1 mm", -2: "10 mm"}
    for ld in range(dy0, dy1 + 1):
        o.append(W(ox, Y(ld), ox + gw, Y(ld), c=LIN, lw=0.6))
        o.append(T(ox - 6, Y(ld) + 4, labs_d[ld], "end", 9, FNT))
    o.append(AXES(ox, oy, gw + 16, gh + 14))
    o.append(T(ox + gw + 10, oy + 34, "周波数 f", "end", 10.5, MUT, True))
    o.append(T(ox + 4, oy - gh - 8, "表皮深さ δ", "start", 10.5, MUT, True))
    mats = [("ステンレス SUS304", 1.4e6, 1, FNT), ("アルミ", 3.5e7, 1, GRN), ("銅", 5.8e7, 1, SIG), ("鋼（μr = 100 と仮定）", 1e7, 100, ALI)]
    for i, (n, sg, mr, c) in enumerate(mats):
        pts = []
        for k in range(71):
            lf = fx0 + (fx1 - fx0) * k / 70
            d = 1 / _m.sqrt(_m.pi * 10 ** lf * mu0 * mr * sg)
            pts.append((X(lf), Y(_m.log10(d))))
        o.append(PL(pts, c, 2.2))
        o.append(PL([(680, 60 + i * 24), (706, 60 + i * 24)], c, 2.4))
        o.append(T(712, 64 + i * 24, n, "start", 10, INK))
    # 板厚 0.5 mm
    o.append(PL([(ox, Y(_m.log10(5e-4))), (ox + gw, Y(_m.log10(5e-4)))], INK, 1.3, "6,4"))
    o.append(T(ox + gw - 4, Y(_m.log10(5e-4)) - 6, "板厚 0.5 mm", "end", 10, INK, True))
    o.append(PL([(ox, Y(-5)), (ox + gw, Y(-5))], MUT, 1.1, "2,3"))
    o.append(T(ox + gw - 4, Y(-5) - 6, "めっき 10 µm", "end", 9.5, MUT))
    o.append(T(680, 170, "周波数が 100 倍で", "start", 10, INK))
    o.append(T(680, 186, "δ は 1/10", "start", 10, INK))
    o.append(T(680, 210, "δ が板厚より十分小さい", "start", 10, INK))
    o.append(T(680, 226, "→ 吸収が大きい", "start", 10, INK))
    return SVG(860, 290, o, "表皮深さ δ = 1/√(πfμσ)（両対数）。導電率と透磁率が大きいほど、周波数が高いほど浅い。物性値は代表値。")
F["e14_skin"] = _f14_skin()


# ---- 4. スロット ----
def _f14_slot():
    o = []
    import math as _m
    # 左: パネルの例
    for k, (title, c) in enumerate([("悪い: 長いスロット", ALI), ("良い: 小さい穴に分ける", SIG)]):
        y0 = 30 + k * 120
        o.append(T(30, y0 - 8, title, "start", 11.5, c, True))
        o.append(RECT(30, y0, 300, 80, 4, LIN, INK, 1.3))
        if k == 0:
            o.append(RECT(70, y0 + 34, 220, 10, 2, SCR, ALI, 1.4))
            o.append(DIM(70, y0 + 60, 290, y0 + 60, None, ALI))
            o.append(T(180, y0 + 74, "L が長い → 漏れる", "middle", 9.5, ALI))
        else:
            for i in range(10):
                for j in range(2):
                    o.append(CIRC(76 + i * 22, y0 + 26 + j * 22, 6, SIG, 1.2, SCR))
            o.append(DIM(70, y0 + 64, 82, y0 + 64, None, SIG))
            o.append(T(92, y0 + 72, "L = 穴の径", "start", 9.5, SIG))
    o.append(T(180, 264, "同じ開口面積でも、効くのは最も長い寸法 L", "middle", 10, INK))
    # 右: グラフ SE vs L
    ox, oy, gw, gh = 430, 230, 330, 190
    X = lambda L: ox + (_m.log10(L) - 0) / (3 - 0) * gw   # 1..1000 mm
    Y = lambda s: oy - s / 50 * gh
    for L, s in ((1, "1"), (10, "10"), (100, "100"), (1000, "1000 mm")):
        o.append(W(X(L), oy, X(L), oy - gh, c=LIN, lw=0.6))
        o.append(T(X(L), oy + 15, s, "middle", 9, FNT))
    for s in range(0, 51, 10):
        o.append(W(ox, Y(s), ox + gw, Y(s), c=LIN, lw=0.6))
        o.append(T(ox - 6, Y(s) + 4, str(s), "end", 9, FNT))
    o.append(AXES(ox, oy, gw + 14, gh + 12))
    o.append(T(ox + gw + 6, oy + 32, "スロット長 L", "end", 10, MUT, True))
    o.append(T(ox + 4, oy - gh - 8, "SE ≈ 20 log₁₀(λ/2L) [dB]（目安）", "start", 10, MUT, True))
    for f, c, n in ((1e8, GRN, "100 MHz"), (1e9, SIG, "1 GHz"), (2.4e9, ALI, "2.4 GHz")):
        lam = 3e11 / f
        pts = []
        for k in range(101):
            L = 10 ** (3 * k / 100)
            s = 20 * _m.log10(lam / (2 * L)) if L < lam / 2 else 0
            if s <= 50:
                pts.append((X(L), Y(max(s, 0))))
        o.append(PL(pts, c, 2.2))
        o.append(T(X(min(lam / 2, 900)) + 4, oy - 6 if f > 2e8 else Y(4), n, "start" if f < 2e9 else "end", 9.5, c, True))
    # 30 mm @1 GHz
    o.append(D(X(30), Y(14), INK, 4))
    o.append(T(X(30) + 8, Y(14) - 6, "30 mm, 1 GHz: 14 dB", "start", 9.5, INK, True))
    return SVG(860, 280, o, "開口からの漏れ。スロットの最も長い寸法 L が半波長 λ/2 に近づくと遮蔽はほぼ 0 になる。")
F["e14_slot"] = _f14_slot()


# ---- 5. 継ぎ目 ----
def _f14_seam():
    o = []
    # 上面図: ねじ間隔
    for k, (title, c, n) in enumerate([("悪い: ねじの間隔が広い", ALI, 3), ("良い: ねじを増やす・ガスケット", SIG, 9)]):
        x0 = 20 + k * 420
        o.append(T(x0 + 190, 20, title, "middle", 11.5, c, True))
        o.append(RECT(x0, 34, 380, 60, 3, LIN, INK, 1.3))
        o.append(RECT(x0, 34, 380, 10, 0, PAN, INK, 1))
        xs = [x0 + 20 + (340) * i / (n - 1) for i in range(n)]
        for xx in xs:
            o.append(CIRC(xx, 39, 4, INK, 1.2, SCR))
        if k == 0:
            for i in range(n - 1):
                a, b = xs[i] + 8, xs[i + 1] - 8
                o.append(PL([(a, 46), ((a + b) / 2, 52), (b, 46)], ALI, 1.6))
            o.append(DIM(xs[0], 108, xs[1], 108, "L = ねじの間隔（スロットになる）", ALI, 9.5, 24))
        else:
            o.append(RECT(x0 + 6, 44, 368, 4, 0, SIG, SIG, 0))
            o.append(DIM(xs[0], 108, xs[1], 108, None, SIG))
            o.append(T(x0 + 190, 126, "間隔を短く・導電ガスケットで連続に接触", "middle", 9.5, SIG))
    # 断面: 重なり
    def joint(x0, good):
        o2 = []
        if good:
            o2.append(PL([(x0, 170), (x0 + 120, 170), (x0 + 120, 230)], INK, 5))
            o2.append(PL([(x0 + 140, 250), (x0 + 108, 250), (x0 + 108, 186), (x0 + 60, 186)], MUT, 5))
            o2.append(RECT(x0 + 112, 196, 4, 40, 0, SIG, SIG, 0))
            o2.append(T(x0 + 150, 214, "重なり＋接触", "start", 10, SIG, True))
            o2.append(T(x0 + 150, 230, "（漏れの道が長く細い）", "start", 9.5, MUT))
        else:
            o2.append(PL([(x0, 170), (x0 + 120, 170)], INK, 5))
            o2.append(PL([(x0 + 126, 170), (x0 + 240, 170)], MUT, 5))
            o2.append(ARR(x0 + 123, 200, x0 + 123, 150, ALI, 1.6))
            o2.append(T(x0 + 123, 214, "突き合わせのすき間", "middle", 10, ALI, True))
        return "".join(o2)
    o.append(T(130, 150, "断面: 悪い", "middle", 10.5, ALI, True))
    o.append(joint(20, False))
    o.append(T(560, 150, "断面: 良い", "middle", 10.5, SIG, True))
    o.append(joint(460, True))
    return SVG(860, 270, o, "ふたと本体の継ぎ目。接触していない区間がスロットとして働く。ねじ間隔を詰め、導電ガスケットや重なりで連続に接触させる。")
F["e14_seam"] = _f14_seam()


# ---- 6. ケーブル貫通 ----
def _f14_cable():
    o = []
    def enc(x0, title, c):
        o.append(T(x0 + 130, 20, title, "middle", 11, c, True))
        o.append(RECT(x0 + 10, 36, 150, 130, 4, SCR, INK, 3))
        o.append(RECT(x0 + 30, 120, 100, 8, 1, GRN, GRN, 1))
    # 悪い: そのまま貫通
    x0 = 10; enc(x0, "悪い: ノイズが乗ったまま外へ", ALI)
    o.append(PL([(x0 + 100, 120), (x0 + 100, 90), (x0 + 270, 90)], ALI, 2.4))
    for r in (14, 26, 38):
        o.append('<path d="M %g %g A %g %g 0 0 1 %g %g" fill="none" stroke="%s" stroke-width="1.4"/>'
                 % (x0 + 220 - r * 0.4, 84 - r * 0.3, r, r, x0 + 220 + r * 0.9, 84 - r * 0.2, ALI))
    o.append(T(x0 + 172, 130, "ケーブルが", "start", 9.5, ALI))
    o.append(T(x0 + 172, 144, "アンテナになる", "start", 9.5, ALI))
    # 良い: 入口でフィルタ
    x0 = 290; enc(x0, "良い: 壁の位置でフィルタ", SIG)
    o.append(PL([(x0 + 100, 120), (x0 + 100, 90), (x0 + 150, 90)], ALI, 2.4))
    o.append(RECT(x0 + 140, 78, 26, 24, 2, SSOFT, SIG, 1.6))
    o.append(T(x0 + 153, 94, "F", "middle", 10, SIG, True))
    o.append(PL([(x0 + 166, 90), (x0 + 270, 90)], SIG, 2.4))
    o.append(W(x0 + 153, 102, x0 + 153, 166, c=SIG, lw=1.6))
    o.append(T(x0 + 176, 130, "フィルタを壁（接地）へ", "start", 9.5, SIG))
    o.append(T(x0 + 176, 144, "短く接続", "start", 9.5, SIG))
    # シールドケーブルの接続
    x0 = 580
    o.append(T(x0 + 130, 20, "シールド線のつなぎ方", "middle", 11, INK, True))
    for k, (yy, good) in enumerate(((60, False), (130, True))):
        o.append(RECT(x0 + 10, yy - 20, 10, 50, 0, LIN, INK, 1.4))
        o.append(RECT(x0 + 20, yy - 4, 230, 18, 6, PAN, MUT, 1.4))
        o.append(W(x0 + 20, yy + 5, x0 + 250, yy + 5, c=INK, lw=1.6))
        if good:
            o.append(RECT(x0 + 20, yy - 8, 26, 26, 2, SSOFT, SIG, 1.6))
            o.append(T(x0 + 60, yy + 40, "良い: 360° でシールドを壁につなぐ", "start", 9.5, SIG, True))
        else:
            o.append(PL([(x0 + 46, yy - 4), (x0 + 40, yy - 14), (x0 + 20, yy - 16)], ALI, 2))
            o.append(T(x0 + 60, yy + 32, "悪い: ピグテール（細い線 1 本）", "start", 9.5, ALI, True))
    return SVG(860, 196, o, "ケーブルの貫通。筐体の壁を通る導体に乗ったノイズは、外でアンテナとして放射する。壁の位置でフィルタを接地するか、シールドを全周で壁につなぐ。")
F["e14_cable"] = _f14_cable()


# ---- 7. ESD の経路 ----
def _f14_esd():
    o = []
    for k, (title, c) in enumerate([("悪い: すき間から回路へ飛ぶ", ALI), ("良い: 長い沿面と接地した金属へ逃がす", SIG)]):
        x0 = 20 + k * 430
        o.append(T(x0 + 195, 20, title, "middle", 11.5, c, True))
        # 樹脂の上下ケース（断面）
        if k == 0:
            o.append(RECT(x0 + 20, 70, 170, 12, 0, PAN, INK, 1.3))
            o.append(RECT(x0 + 196, 70, 170, 12, 0, PAN, INK, 1.3))
            o.append(RECT(x0 + 150, 110, 160, 8, 1, GRN, GRN, 1))
            o.append(RECT(x0 + 200, 100, 20, 10, 1, ASOFT, ALI, 1.2))
            o.append(_f14_finger(x0 + 194, 56, MUT))
            o.append(_f14_spark(x0 + 193, 60, x0 + 208, 100, ALI))
            o.append(T(x0 + 220, 140, "合わせ目のすき間が短い", "middle", 10, ALI))
            o.append(T(x0 + 220, 156, "→ 放電が IC の端子へ", "middle", 10, ALI))
        else:
            # ラビリンス（段付きの合わせ目）
            o.append(PL([(x0 + 20, 76), (x0 + 196, 76), (x0 + 196, 112)], INK, 6))
            o.append(PL([(x0 + 370, 76), (x0 + 208, 76), (x0 + 208, 104)], INK, 6))
            o.append(RECT(x0 + 140, 122, 120, 8, 0, LIN, INK, 1.2))
            o.append(T(x0 + 120, 128, "接地した金属板", "end", 9.5, INK))
            o.append(RECT(x0 + 280, 136, 90, 8, 1, GRN, GRN, 1))
            o.append(T(x0 + 325, 160, "回路は奥へ離す", "middle", 10, SIG))
            o.append(_f14_finger(x0 + 200, 58, MUT))
            o.append(_f14_spark(x0 + 202, 62, x0 + 202, 120, SIG))
            o.append(T(x0 + 220, 100, "段付きで沿面を長く", "start", 9.5, SIG))
            o.append(W(x0 + 200, 130, x0 + 200, 156, c=INK, lw=1.4))
            for k2, ww in enumerate((24, 15, 6)):
                o.append(W(x0 + 200 - ww / 2, 156 + k2 * 5, x0 + 200 + ww / 2, 156 + k2 * 5, c=INK, lw=1.4))
            o.append(T(x0 + 190, 176, "シャーシ接地へ太く短く", "end", 9.5, INK))
    return SVG(860, 190, o, "静電気放電の経路。放電は最も通りやすい道を選ぶ。すき間から回路が見えないようにし、触れる金属は接地へ低インピーダンスでつなぐ。")
F["e14_esd"] = _f14_esd()
