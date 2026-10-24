# -*- coding: utf-8 -*-
# 02. 力と変形の基礎 の図（figures.py から exec で読み込まれる）

def _e02_hatch_v(x, y0, y1, side=-1, step=10, ln=8):
    """壁（固定端）のハッチング。side=-1 なら x の左側に斜線"""
    o = [W(x, y0, x, y1, c=INK, lw=2)]
    yy = y0
    while yy < y1:
        o.append(W(x, yy + ln, x + side * ln, yy, c=MUT, lw=1))
        yy += step
    return "".join(o)

def _e02_hatch_h(x0, x1, y, step=10, ln=7):
    """床のハッチング（y の下側）"""
    o = [W(x0, y, x1, y, c=INK, lw=2)]
    xx = x0
    while xx < x1:
        o.append(W(xx, y + ln, xx + ln, y, c=MUT, lw=1))
        xx += step
    return "".join(o)

def _e02_arc(cx, cy, r, a0, a1, c=INK, lw=1.6):
    """(cx,cy) 中心、半径 r の円弧（角度は度、数学の向き＝反時計回り、y 上向き）。終点に矢印"""
    n = 24
    pts = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        pts.append((cx + r * math.cos(a), cy - r * math.sin(a)))
    o = [PL(pts[:-2], c, lw)]
    o.append(ARR(pts[-3][0], pts[-3][1], pts[-1][0], pts[-1][1], c, lw, 7))
    return "".join(o)

# ---------- 引張・圧縮・せん断 ----------
def _e02_loads():
    o = []
    for k, (ttl, fm) in enumerate([("引張", "σ = F / A"), ("圧縮", "σ = F / A（向きが逆）"), ("せん断", "τ = F / A")]):
        x0 = 20 + k * 270
        o.append(RECT(x0, 8, 250, 228, 10, PAN, LIN, 1.2))
        o.append(T(x0 + 125, 34, ttl, "middle", 14, INK, True))
        o.append(T(x0 + 125, 56, fm, "middle", 12, SIG, True))
    # 引張
    x0 = 20
    o.append(RECT(x0 + 57, 94, 136, 42, 2, "none", SIG, 1.3, "4,3"))
    o.append(RECT(x0 + 65, 90, 120, 50, 2, SSOFT, INK, 1.4))
    o.append(W(x0 + 125, 82, x0 + 125, 148, c=ALI, lw=1.4, dash="5,3"))
    o.append(T(x0 + 125, 166, "切った面の面積 A", "middle", 10.5, ALI))
    o.append(ARR(x0 + 65, 115, x0 + 18, 115, INK, 2, 9))
    o.append(ARR(x0 + 185, 115, x0 + 232, 115, INK, 2, 9))
    o.append(T(x0 + 30, 106, "F", "middle", 12, INK, True))
    o.append(T(x0 + 220, 106, "F", "middle", 12, INK, True))
    o.append(T(x0 + 125, 200, "引っ張られて伸び、細くなる", "middle", 10.5, MUT))
    o.append(T(x0 + 125, 218, "点線: 変形後（誇張）", "middle", 9.5, FNT))
    # 圧縮
    x0 = 290
    o.append(RECT(x0 + 75, 84, 100, 62, 2, "none", SIG, 1.3, "4,3"))
    o.append(RECT(x0 + 65, 90, 120, 50, 2, SSOFT, INK, 1.4))
    o.append(W(x0 + 125, 82, x0 + 125, 148, c=ALI, lw=1.4, dash="5,3"))
    o.append(T(x0 + 125, 166, "切った面の面積 A", "middle", 10.5, ALI))
    o.append(ARR(x0 + 15, 115, x0 + 63, 115, INK, 2, 9))
    o.append(ARR(x0 + 235, 115, x0 + 187, 115, INK, 2, 9))
    o.append(T(x0 + 30, 106, "F", "middle", 12, INK, True))
    o.append(T(x0 + 220, 106, "F", "middle", 12, INK, True))
    o.append(T(x0 + 125, 200, "押されて縮み、太くなる", "middle", 10.5, MUT))
    o.append(T(x0 + 125, 218, "点線: 変形後（誇張）", "middle", 9.5, FNT))
    # せん断
    x0 = 560
    o.append(_e02_hatch_h(x0 + 40, x0 + 210, 150))
    o.append(TRI([(x0 + 75, 150), (x0 + 175, 150), (x0 + 195, 92), (x0 + 95, 92)], SIG, 1.3, "none")
             .replace('stroke-width="1.3"', 'stroke-width="1.3" stroke-dasharray="4,3"'))
    o.append(RECT(x0 + 75, 92, 100, 58, 2, SSOFT, INK, 1.4))
    o.append(ARR(x0 + 85, 80, x0 + 185, 80, INK, 2, 9))
    o.append(T(x0 + 135, 74, "F", "middle", 12, INK, True))
    o.append(T(x0 + 125, 176, "上面（面積 A）が横にずれる", "middle", 10.5, MUT))
    o.append(T(x0 + 125, 194, "力は面に平行。下面は床が支える", "middle", 10, MUT))
    o.append(T(x0 + 125, 218, "点線: 変形後（誇張）", "middle", 9.5, FNT))
    return SVG(830, 244, o, "3 種類の基本的な荷重。引張と圧縮では力が断面に垂直、せん断では力が面に平行である。どれも「力 ÷ 面積」で応力を求める。")
F["e02_loads"] = _e02_loads()

# ---------- 応力-ひずみ曲線 ----------
def _e02_ss():
    o = []
    ox, oy, ww, hh = 80, 300, 560, 260
    o.append(AXES(ox, oy, ww + 20, hh + 20, "ひずみ ε", "応力 σ"))
    X = lambda e: ox + e * ww
    Y = lambda s: oy - s * hh
    # 金属（延性）
    met = [(0, 0), (0.022, 0.56), (0.035, 0.57), (0.06, 0.6)]
    for i in range(1, 31):
        u = i / 30
        e = 0.06 + u * 0.40
        met.append((e, 0.6 + 0.30 * (1 - (1 - u) ** 2)))
    for i in range(1, 11):
        u = i / 10
        met.append((0.46 + u * 0.12, 0.90 - 0.16 * u ** 1.6))
    o.append(PL([(X(e), Y(s)) for e, s in met], GRN, 2.2))
    # 樹脂（ABS などの延性樹脂）
    pl = []
    for i in range(0, 21):
        u = i / 20
        e = 0.12 * u
        pl.append((e, 0.40 * (1 - (1 - u) ** 2.2)))
    for i in range(1, 11):
        u = i / 10
        pl.append((0.12 + 0.06 * u, 0.40 - 0.08 * u))
    pl.append((0.92, 0.33))
    o.append(PL([(X(e), Y(s)) for e, s in pl], SIG, 2.2))
    # 脆い材料
    o.append(PL([(X(0), Y(0)), (X(0.05), Y(0.48))], ALI, 2.2, "6,4"))
    # 破断マーク
    for (e, s, c) in [(0.58, 0.74, GRN), (0.92, 0.33, SIG), (0.05, 0.48, ALI)]:
        x, y = X(e), Y(s)
        o.append(W(x - 6, y - 6, x + 6, y + 6, c=c, lw=2.2) + W(x - 6, y + 6, x + 6, y - 6, c=c, lw=2.2))
    # 注記
    o.append(D(X(0.022), Y(0.56), INK, 4))
    o.append(W(X(0.022), Y(0.56), X(0.03), Y(0.95), c=FNT, lw=1))
    o.append(T(X(0.035), Y(0.97), "降伏点（ここから永久変形が残る）", "start", 10.5, INK))
    o.append(D(X(0.46), Y(0.90), INK, 4))
    o.append(T(X(0.47), Y(0.90) - 10, "引張強さ（最大の応力）", "start", 10.5, INK))
    o.append(T(X(0.58) + 12, Y(0.74) + 4, "破断", "start", 10.5, GRN, True))
    o.append(T(X(0.92), Y(0.33) - 14, "破断", "middle", 10.5, SIG, True))
    o.append(T(X(0.06), Y(0.48) + 4, "破断（ほぼ伸びずに割れる）", "start", 10.5, ALI))
    o.append(D(X(0.12), Y(0.40), INK, 4))
    o.append(W(X(0.12), Y(0.40), X(0.20), Y(0.21), c=FNT, lw=1))
    o.append(T(X(0.205), Y(0.21) + 8, "降伏点（最大値の後、くびれて伸びる）", "start", 10.5, INK))
    # 弾性域の傾き
    o.append(W(X(0.003), Y(0.08), X(0.03), Y(0.08), c=MUT, lw=1))
    o.append(T(X(0.035), Y(0.10) + 4, "初めの直線部分＝弾性域。傾き = ヤング率 E", "start", 10.5, MUT))
    # 凡例
    lx, ly = 660, 60
    for i, (c, t, d) in enumerate([(GRN, "金属（アルミ・鋼）", None), (SIG, "延性のある樹脂（ABS・PC）", None),
                                   (ALI, "脆い材料（ガラス繊維強化の一部など）", "6,4")]):
        o.append(W(lx, ly + i * 50, lx + 28, ly + i * 50, c=c, lw=2.4, dash=d))
        for j, s in enumerate(_wrap(t, 20)):
            o.append(T(lx + 34, ly + i * 50 + 4 + j * 15, s, "start", 10.5, INK))
    return SVG(860, 330, o, "応力-ひずみ曲線の形（模式図。縦横の目盛は材料ごとに大きく違うので形だけを比べる）。初めの直線部分では荷重を除くと元に戻る。降伏点を超えると永久変形が残る。")
F["e02_ss"] = _e02_ss()

# ---------- 片持ちはり ----------
def _e02_cant():
    o = []
    x0, x1, yc, th, dl = 90, 520, 120, 16, 64
    o.append(_e02_hatch_v(x0, 60, 200))
    # 変形前
    o.append(RECT(x0, yc - th / 2, x1 - x0, th, 0, "none", MUT, 1.1, "5,4"))
    # 変形後
    top, bot = [], []
    for i in range(41):
        s = i / 40
        w = dl * (3 * s * s - s ** 3) / 2
        x = x0 + s * (x1 - x0)
        top.append((x, yc - th / 2 + w)); bot.append((x, yc + th / 2 + w))
    poly = top + bot[::-1]
    o.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' %
             (" ".join("%g,%g" % (round(a, 1), round(b, 1)) for a, b in poly), SSOFT, SIG))
    # 荷重
    o.append(ARR(x1, yc + dl - 62, x1, yc + dl - th / 2 - 2, ALI, 2.4, 10))
    o.append(T(x1 + 10, yc + dl - 50, "荷重 P", "start", 12, ALI, True))
    # 寸法
    o.append(DIM(x0, 40, x1, 40, "長さ L", INK, 11))
    o.append(W(x1, 46, x1, yc - th / 2 - 4, c=FNT, lw=0.8, dash="2,3"))
    o.append(W(x1 + 4, yc, x1 + 60, yc, c=FNT, lw=0.8, dash="2,3"))
    o.append(W(x1 + 4, yc + dl, x1 + 60, yc + dl, c=FNT, lw=0.8, dash="2,3"))
    o.append(DIM(x1 + 50, yc, x1 + 50, yc + dl, "たわみ δ", INK, 11))
    o.append(T(x0 - 14, 222, "固定端（根元）", "start", 10.5, MUT))
    o.append(T(x1, 222 + 0, "自由端（先端）", "middle", 10.5, MUT))
    # x 軸
    o.append(ARR(x0, 252, x0 + 110, 252, MUT, 1.2, 7))
    o.append(T(x0 + 116, 256, "x（根元から測る）", "start", 10, MUT))
    # 切断位置 A-A
    xa = 300
    o.append(W(xa, yc - 30, xa, yc - 12, c=INK, lw=1.4) + W(xa, yc + 20 + 18, xa, yc + 20 + 36, c=INK, lw=1.4))
    o.append(T(xa, yc - 34, "A", "middle", 10.5, INK, True))
    # 断面
    cx, cy, bw, bh = 720, 128, 110, 34
    o.append(T(cx, 62, "断面 A–A（拡大）", "middle", 11, INK, True))
    o.append(RECT(cx - bw / 2, cy - bh / 2, bw, bh, 0, SSOFT, SIG, 1.6))
    o.append(W(cx - bw / 2 - 18, cy, cx + bw / 2 + 18, cy, c=INK, lw=1.1, dash="6,3"))
    o.append(T(cx - bw / 2 - 20, cy + 4, "中立軸", "end", 10, INK))
    o.append(DIM(cx - bw / 2, cy + bh / 2 + 16, cx + bw / 2, cy + bh / 2 + 16, None, MUT))
    o.append(T(cx, cy + bh / 2 + 34, "幅 b", "middle", 11, INK))
    o.append(DIM(cx + bw / 2 + 30, cy - bh / 2, cx + bw / 2 + 30, cy + bh / 2, None, MUT))
    o.append(T(cx + bw / 2 + 38, cy + 4, "厚さ h", "start", 11, INK))
    o.append(ARR(cx + 20, cy, cx + 20, cy - bh / 2 + 1, ALI, 1.2, 5))
    o.append(T(cx + 26, cy - 5, "c = h/2", "start", 9.5, ALI))
    o.append(ARR(cx, cy - bh / 2 - 34, cx, cy - bh / 2 - 4, ALI, 1.4, 7))
    o.append(T(cx - 6, cy - bh / 2 - 22, "P", "end", 10.5, ALI, True))
    return SVG(860, 270, o, "片持ちはり。根元を固定し、先端に荷重 P をかける。点線が変形前、緑が変形後（たわみは誇張）。右は断面で、荷重は厚さ h の方向にかかる。")
F["e02_cant"] = _e02_cant()

# ---------- 曲げモーメント図 ----------
def _e02_bmd():
    o = []
    x0, x1 = 110, 590
    xc = 290
    # (1) 全体
    y = 70
    o.append(_e02_hatch_v(x0, y - 30, y + 30))
    o.append(RECT(x0, y - 7, x1 - x0, 14, 0, PAN, INK, 1.4))
    o.append(ARR(x1, y - 50, x1, y - 9, ALI, 2.2, 9))
    o.append(T(x1 + 10, y - 34, "P", "start", 12, ALI, True))
    o.append(W(xc, y - 22, xc, y + 22, c=INK, lw=1.2, dash="4,3"))
    o.append(T(xc, y - 27, "ここで切る", "middle", 10, INK))
    o.append(DIM(x0, y + 32, xc, y + 32, None, MUT))
    o.append(T((x0 + xc) / 2, y + 48, "x", "middle", 11, INK))
    o.append(DIM(xc, y + 32, x1, y + 32, None, MUT))
    o.append(T((xc + x1) / 2, y + 48, "L − x", "middle", 11, INK))
    o.append(T(30, y + 4, "(1)", "start", 11, MUT, True))
    # (2) 切り出した右側
    y = 170
    o.append(T(30, y + 4, "(2)", "start", 11, MUT, True))
    o.append(RECT(xc, y - 7, x1 - xc, 14, 0, SSOFT, SIG, 1.4))
    o.append(ARR(x1, y - 46, x1, y - 9, ALI, 2.2, 9))
    o.append(T(x1 + 10, y - 30, "P", "start", 12, ALI, True))
    o.append(ARR(xc - 2, y + 40, xc - 2, y + 9, INK, 2, 9))
    o.append(T(xc - 12, y + 34, "V", "end", 12, INK, True))
    o.append(_e02_arc(xc, y, 26, 210, 120, INK, 1.8))
    o.append(T(xc - 34, y - 22, "M", "end", 12, INK, True))
    o.append(T(xc + 160, y + 34, "上下の力: V = P", "start", 11, INK))
    o.append(T(xc + 160, y + 52, "切り口まわりの回転: M = P × (L − x)", "start", 11, INK))
    o.append(T(xc + 20, y - 30, "残りの部分が切り口に及ぼす力と回転", "start", 10, MUT))
    # (3) 曲げモーメント図
    y0 = 360
    o.append(T(30, y0 - 40, "(3)", "start", 11, MUT, True))
    o.append(W(x0, y0, x1 + 20, y0, c=MUT, lw=1.2))
    o.append(TRI([(x0, y0), (x0, y0 - 90), (x1, y0)], SIG, 1.6, SSOFT))
    o.append(T(x0 - 8, y0 - 86, "PL", "end", 11.5, INK, True))
    o.append(T(x0 - 8, y0 + 4, "0", "end", 10.5, MUT))
    xm = xc
    ym = y0 - 90 * (x1 - xm) / (x1 - x0)
    o.append(W(xm, y0, xm, ym, c=INK, lw=1.2, dash="3,3"))
    o.append(D(xm, ym, INK, 3.5))
    o.append(T(xm + 8, ym - 6, "M(x) = P(L − x)", "start", 11, INK, True))
    o.append(T(x0 + 6, y0 + 18, "根元（x = 0）", "start", 10, MUT))
    o.append(T(x1, y0 + 18, "先端（x = L）", "middle", 10, MUT))
    o.append(T(x1 + 26, y0 - 60, "曲げモーメント M", "start", 10.5, MUT))
    o.append(T(x1 + 26, y0 - 44, "根元で最大 M = PL", "start", 10.5, ALI, True))
    return SVG(860, 390, o, "曲げモーメントの求め方。(1) 位置 x で仮に切る。(2) 切った右側のつり合いから、切り口にはたらくせん断力 V と曲げモーメント M が決まる。(3) M は根元で最大、先端で 0 の直線になる。")
F["e02_bmd"] = _e02_bmd()

# ---------- 曲げのひずみと応力の分布 ----------
def _e02_bend():
    o = []
    cx, cy = 230, 330
    r0, hh = 210, 60
    rt, rb = r0 + hh / 2, r0 - hh / 2
    a = 22
    def arcp(r, a0, a1, n=30):
        return [(cx + r * math.sin(math.radians(a0 + (a1 - a0) * i / n)),
                 cy - r * math.cos(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    top = arcp(rt, -a, a); bot = arcp(rb, a, -a)
    poly = top + bot
    o.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' %
             (" ".join("%g,%g" % (round(p, 1), round(q, 1)) for p, q in poly), SSOFT, SIG))
    o.append(PL(arcp(r0, -a - 4, a + 4), INK, 1.2, "6,3"))
    for s in (-1, 1):
        ex, ey = cx + rb * math.sin(math.radians(s * a)), cy - rb * math.cos(math.radians(s * a))
        o.append(W(cx, cy, ex, ey, c=FNT, lw=1, dash="3,4"))
    o.append(D(cx, cy, INK, 3))
    o.append(T(cx, cy + 20, "曲率の中心", "middle", 10, MUT))
    o.append(ARR(cx, cy, cx, cy - r0 + 2, INK, 1.2, 6))
    o.append(T(cx + 6, cy - r0 / 2, "ρ（曲率半径）", "start", 10.5, INK))
    # 引張・圧縮の矢印
    for s in (-1, 1):
        ang = math.radians(s * a)
        px, py = cx + rt * math.sin(ang), cy - rt * math.cos(ang)
        tx, ty = math.cos(ang), math.sin(ang)
        o.append(ARR(px, py, px + s * 26 * tx, py + s * 26 * ty, ALI, 1.8, 7))
        px, py = cx + rb * math.sin(ang), cy - rb * math.cos(ang)
        o.append(ARR(px + s * 26 * tx, py + s * 26 * ty, px + 2 * s * tx, py + 2 * s * ty, GRN, 1.8, 7))
    o.append(T(cx, cy - rt - 14, "上面: 伸びる（引張）", "middle", 11, ALI, True))
    o.append(T(cx, cy - rb + 24, "下面: 縮む（圧縮）", "middle", 11, GRN, True))
    o.append(T(cx + rt * math.sin(math.radians(a)) + 34, cy - r0 * math.cos(math.radians(a)) + 4,
               "中立面（長さが変わらない）", "start", 10.5, INK))
    # 右: 分布
    ax, ay0, ay1 = 640, 60, 240
    ym = (ay0 + ay1) / 2
    o.append(T(ax, 34, "断面内の応力の分布", "middle", 11.5, INK, True))
    o.append(RECT(ax - 6, ay0, 12, ay1 - ay0, 0, PAN, MUT, 1))
    o.append(W(ax - 100, ym, ax + 150, ym, c=INK, lw=1.1, dash="6,3"))
    o.append(T(ax - 100, ym - 6, "中立軸 y = 0", "start", 10, INK))
    o.append(TRI([(ax, ym), (ax, ay0), (ax + 120, ay0)], ALI, 1.4, ASOFT))
    o.append(TRI([(ax, ym), (ax, ay1), (ax - 120, ay1)], GRN, 1.4, "none"))
    for k in range(1, 6):
        yy = ym - (ym - ay0) * k / 6
        o.append(ARR(ax, yy, ax + 120 * k / 6, yy, ALI, 1, 4))
        yy = ym + (ay1 - ym) * k / 6
        o.append(ARR(ax, yy, ax - 120 * k / 6, yy, GRN, 1, 4))
    o.append(T(ax + 128, ay0 + 4, "σmax = Mc / I", "start", 11, ALI, True))
    o.append(T(ax + 66, ym - 16, "σ = E y / ρ", "start", 11, INK, True))
    o.append(DIM(ax - 30, ym, ax - 30, ay0, None, MUT))
    o.append(T(ax - 36, (ym + ay0) / 2 + 4, "c", "end", 11, INK, True))
    o.append(T(ax - 124, ay1 + 18, "圧縮側", "middle", 10, GRN))
    o.append(T(ax + 60, ay0 - 8, "引張側", "middle", 10, ALI))
    o.append(ARR(ax + 160, ym + 40, ax + 160, ym - 40, MUT, 1, 6))
    o.append(T(ax + 166, ym - 30, "y", "start", 11, MUT, True))
    return SVG(860, 360, o, "曲げられたはりの一部。上面は伸び、下面は縮み、その間に長さが変わらない中立面がある。ひずみと応力は中立軸からの距離 y に比例し、表面（y = c）で最大になる。")
F["e02_bend"] = _e02_bend()

# ---------- 幅 2 倍と厚さ 2 倍 ----------
def _e02_cube():
    o = []
    cols = [(150, "基準", "幅 b、厚さ h", 1, 70, 14, MUT, "1", "1"),
            (430, "幅を 2 倍", "幅 2b、厚さ h", 2, 140, 14, GRN, "1/2", "2"),
            (710, "厚さを 2 倍", "幅 b、厚さ 2h", 8, 70, 28, SIG, "1/4", "2")]
    base = 300
    for cx, t1, t2, k, bw, bh, c, sg, ms in cols:
        o.append(T(cx, 24, t1, "middle", 13, INK, True))
        o.append(T(cx, 42, t2, "middle", 10.5, MUT))
        o.append(RECT(cx - bw / 2, 92 - bh, bw, bh, 0, SSOFT if c == SIG else PAN, c, 1.6))
        o.append(ARR(cx, 52, cx, 92 - bh - 4, ALI, 1.4, 6))
        bh2 = 18 * k
        o.append(RECT(cx - 34, base - bh2, 68, bh2, 3, c, c, 0))
        o.append(T(cx, base - bh2 - 8, "剛性 %d 倍" % k, "middle", 12, INK, True))
        o.append(T(cx, base + 20, "根元の応力 %s 倍" % sg, "middle", 10.5, MUT))
        o.append(T(cx, base + 37, "材料の量 %s 倍" % ms, "middle", 10.5, MUT))
    o.append(W(30, base, 830, base, c=LIN, lw=1))
    o.append(T(40, 118, "断面（荷重は上から）", "start", 10, FNT))
    return SVG(860, 350, o, "同じ材料を 2 倍使うなら、幅を広げるより厚さを増すほうがはるかに硬くなる。剛性は幅に比例し、厚さの 3 乗に比例する。")
F["e02_cube"] = _e02_cube()

# ---------- 片持ちと両端支持 ----------
def _e02_support():
    o = []
    x0, x1 = 90, 470
    # 片持ち
    y = 70; dl = 64
    o.append(T(x0 - 20, 26, "片持ち（先端に P）", "start", 12, INK, True))
    o.append(_e02_hatch_v(x0, y - 26, y + 26))
    o.append(W(x0, y, x1, y, c=MUT, lw=1, dash="5,4"))
    pts = [(x0 + s / 40 * (x1 - x0), y + dl * (3 * (s / 40) ** 2 - (s / 40) ** 3) / 2) for s in range(41)]
    o.append(PL(pts, SIG, 4))
    o.append(ARR(x1, y + dl - 44, x1, y + dl - 5, ALI, 2.2, 9))
    o.append(T(x1 + 10, y + dl - 30, "P", "start", 12, ALI, True))
    o.append(DIM(x1 + 40, y, x1 + 40, y + dl, None, MUT))
    o.append(T(x1 + 48, y + dl / 2 + 4, "δ", "start", 12, INK, True))
    o.append(T(560, y + 8, "δ = PL³ / (3EI)", "start", 13, INK, True))
    o.append(T(560, y + 30, "最大の M = PL（根元）", "start", 11, MUT))
    # 両端支持
    y = 220; dl2 = dl / 16
    o.append(T(x0 - 20, 176, "両端支持（中央に P）", "start", 12, INK, True))
    o.append(W(x0, y, x1, y, c=MUT, lw=1, dash="5,4"))
    pts = []
    for i in range(41):
        s = i / 40
        u = s if s <= 0.5 else 1 - s
        pts.append((x0 + s * (x1 - x0), y + dl2 * (3 * u - 4 * u ** 3)))
    o.append(PL(pts, SIG, 4))
    for xs in (x0, x1):
        o.append(TRI([(xs, y + 3), (xs - 11, y + 22), (xs + 11, y + 22)], INK, 1.3, PAN))
        o.append(W(xs - 16, y + 24, xs + 16, y + 24, c=INK, lw=1.6))
    xm = (x0 + x1) / 2
    o.append(ARR(xm, y - 46, xm, y - 4, ALI, 2.2, 9))
    o.append(T(xm + 10, y - 30, "P", "start", 12, ALI, True))
    o.append(DIM(x0, y + 44, x1, y + 44, "支点の間隔 L", INK, 11, 26))
    o.append(T(560, y + 8, "δ = PL³ / (48EI)", "start", 13, INK, True))
    o.append(T(560, y + 30, "最大の M = PL/4（中央）", "start", 11, MUT))
    o.append(T(560, 140, "同じ L・E・I なら", "start", 11, SIG, True))
    o.append(T(560, 158, "たわみは 3/48 = 1/16", "start", 11, SIG, True))
    return SVG(860, 300, o, "同じ長さ・材料・断面でも、支え方でたわみは大きく変わる。両端を支えた板の中央を押すと、片持ちで先端を押したときの 1/16 しかたわまない（図のたわみは同じ倍率で描いた）。")
F["e02_support"] = _e02_support()

# ---------- 応力集中（根元の角） ----------
def _e02_fillet():
    o = []
    for k, (ttl, good) in enumerate([("角がとがった根元", False), ("根元に丸み（R）", True)]):
        x0 = 30 + k * 420
        c = SIG if good else ALI
        o.append(RECT(x0, 10, 390, 230, 10, PAN, LIN, 1.2))
        o.append(T(x0 + 195, 36, ttl, "middle", 13, c, True))
        # 壁（下）と立ち上がるつめ（左が根元）
        bx, by = x0 + 60, 172     # 床の上面
        aw = 26                   # つめの厚さ
        ax = x0 + 150             # つめの左面
        r = 0 if not good else 22
        pts = [(x0 + 30, by + 30), (x0 + 30, by), (ax - r, by)]
        if good:
            for i in range(1, 13):
                a = math.radians(90 * i / 12)
                pts.append((ax - r + r * math.sin(a), by - r + r * math.cos(a)))
        pts += [(ax, 70), (ax + aw, 70)]
        if good:
            for i in range(0, 13):
                a = math.radians(90 * i / 12)
                pts.append((ax + aw + r - r * math.cos(a), by - r + r * math.sin(a) - 0))
            pts[-1] = (ax + aw + r, by)
        else:
            pts.append((ax + aw, by))
        pts += [(x0 + 360, by), (x0 + 360, by + 30)]
        o.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.6"/>' %
                 (" ".join("%g,%g" % (round(p, 1), round(q, 1)) for p, q in pts), SSOFT if good else ASOFT, c))
        o.append(ARR(ax + aw + 50, 82, ax + aw + 4, 82, INK, 2, 9))
        o.append(T(ax + aw + 56, 86, "P", "start", 12, INK, True))
        if good:
            o.append(CIRC(ax, by, 30, SIG, 1.2, "none", "4,3"))
            o.append(T(ax - 36, by - 34, "R で応力が分散", "end", 10.5, SIG))
            o.append(T(x0 + 195, by + 52, "局所の応力の上がり方が小さい", "middle", 10.5, MUT))
        else:
            o.append(CIRC(ax, by, 12, ALI, 1.4, ASOFT))
            o.append(CIRC(ax, by, 24, ALI, 1, "none", "3,3"))
            o.append(T(ax - 30, by - 30, "ここに応力が集中", "end", 10.5, ALI, True))
            o.append(T(x0 + 195, by + 52, "Mc/I の何倍もの応力になり、割れの起点になる", "middle", 10.5, MUT))
    return SVG(860, 250, o, "応力集中。片持ちの根元の内側がとがっていると、そこに応力が集まって割れやすい。丸み（R）を付けると和らぐ。R の大きさの目安は 05 章・09 章で扱う。")
F["e02_fillet"] = _e02_fillet()
