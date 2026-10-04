import math, os
OUT='/home/user/documents/crypto/figures'
FONT="IPAGothic, 'Hiragino Sans', 'Noto Sans JP', sans-serif"
INK='#1f2937'; MUTED='#6b7280'; BLUE='#2563eb'; BLUEF='#e8f0fe'; ORANGE='#d9480f'; ORF='#fff1e6'; GREEN='#2b8a3e'; GRF='#ebfbee'; LINE='#cbd5e1'
def svg(w,h,body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" font-family="{FONT}">
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{INK}"/></marker>
<marker id="arb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{BLUE}"/></marker>
<marker id="aro" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{ORANGE}"/></marker></defs>
<rect width="{w}" height="{h}" fill="#fff"/>
{body}</svg>'''
def T(x,y,s,size=15,fill=INK,anchor='middle',weight='normal',italic=False):
    st=' font-style="italic"' if italic else ''
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}"{st} dominant-baseline="middle">{s}</text>'
def R(x,y,w,h,fill=BLUEF,stroke=BLUE,r=8,sw=1.5):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def A(x1,y1,x2,y2,col=INK,m='ar',sw=1.6,dash=''):
    d=f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{col}" stroke-width="{sw}" marker-end="url(#{m})"{d}/>'
def sup(base,e):  # base^e using tspan
    return f'{base}<tspan dy="-7" font-size="11">{e}</tspan><tspan dy="7"></tspan>'

# A. overview
b=[]
w,h=760,250
b.append(T(380,24,'同じ作り方を 2 回する',17,weight='bold'))
rows=[(70,'整数 ℤ','…, −1, 0, 1, 2, …','素数 p で割った余り','GF(p)','{0, 1, …, p−1}'),
      (170,'多項式 GF(2)[x]','0, 1, x, x+1, x²+1, …','既約多項式 f で割った余り','GF(2ᵐ)','次数 m 未満の多項式 2ᵐ 個')]
for y,a1,a2,mid,c1,c2 in rows:
    b.append(R(20,y-38,210,76,fill='#f8fafc',stroke=LINE)); b.append(T(125,y-12,a1,16,weight='bold')); b.append(T(125,y+14,a2,13,MUTED))
    b.append(A(240,y,500,y,sw=2)); b.append(T(370,y-16,mid,14,ORANGE,weight='bold'))
    b.append(R(510,y-38,230,76)); b.append(T(625,y-12,c1,18,BLUE,weight='bold')); b.append(T(625,y+14,c2,13,MUTED))
b.append(T(370,120,'（03 章）',12,MUTED)); b.append(T(370,220,'（この章）',12,MUTED))
open(f'{OUT}/05_overview.svg','w').write(svg(w,h,'\n'.join(b)))

# B. remainders world
b=[]; w,h=760,340
b.append(T(380,22,'f = x³ + x + 1 で割った余りの世界 GF(2³)',17,weight='bold'))
pairs=[('x³','x + 1'),('x⁴ + x','x²'),('x⁵','x² + x + 1'),('x³ + x²','x² + x + 1'),('x⁶ + 1','x²')]
b.append(T(170,58,'どんな多項式も f で割った余りに直す',14,MUTED))
for i,(p,r) in enumerate(pairs):
    y=92+i*44
    b.append(R(20,y-16,120,32,fill='#f8fafc',stroke=LINE,r=6)); b.append(T(80,y,p,15))
    b.append(A(146,y,196,y,col=ORANGE,m='aro',sw=1.5))
    b.append(R(202,y-16,130,32,r=6)); b.append(T(267,y,r,15,weight='bold'))
b.append(T(170,316,'（どれも右の 8 個のどれかになる）',13,MUTED))
grid=[('0','000'),('1','001'),('x','010'),('x + 1','011'),('x²','100'),('x² + 1','101'),('x² + x','110'),('x² + x + 1','111')]
b.append(R(395,46,350,276,fill='#fbfdff',stroke=LINE,r=12))
b.append(T(570,66,'要素は 8 個だけ（次数 2 以下 ＝ 3 ビット）',13,MUTED))
for k,(p,bits) in enumerate(grid):
    cx=410+(k%2)*170; cy=84+(k//2)*58
    b.append(R(cx,cy,150,48)); b.append(T(cx+75,cy+17,p,15,weight='bold')); b.append(T(cx+75,cy+36,bits,12,MUTED))
b.append(A(338,180,390,180,sw=2))
open(f'{OUT}/05_remainders.svg','w').write(svg(w,h,'\n'.join(b)))

# C. alpha cycle
def cycle(fname,highlight=None,title='',note=None):
    b=[]; w,h=760,440
    cx,cy,Rr=270,235,150
    els=[('1','001'),('α','010'),('α²','100'),('α + 1','011'),('α² + α','110'),('α² + α + 1','111'),('α² + 1','101')]
    b.append(T(380,22,title,17,weight='bold'))
    P=[]
    for k in range(7):
        ang=-math.pi/2+2*math.pi*k/7
        P.append((cx+Rr*math.cos(ang),cy+Rr*math.sin(ang)))
    for k in range(7):
        x1,y1=P[k];x2,y2=P[(k+1)%7]
        # shorten
        dx,dy=x2-x1,y2-y1;L=math.hypot(dx,dy);ux,uy=dx/L,dy/L
        col=BLUE; 
        b.append(f'<line x1="{x1+ux*44:.1f}" y1="{y1+uy*44:.1f}" x2="{x2-ux*44:.1f}" y2="{y2-uy*44:.1f}" stroke="{BLUE}" stroke-width="1.8" marker-end="url(#arb)"/>')
        mx,my=(x1+x2)/2,(y1+y2)/2; ox,oy=(mx-cx),(my-cy);Lo=math.hypot(ox,oy)
        b.append(T(mx+ox/Lo*18,my+oy/Lo*18,'×α',12,BLUE))
    for k in range(7):
        x,y=P[k]; p,bits=els[k]
        fill,stroke=BLUEF,BLUE
        if highlight and k in highlight: fill,stroke=ORF,ORANGE
        b.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="40" fill="{fill}" stroke="{stroke}" stroke-width="1.8"/>')
        b.append(T(x,y-14,'α'+('⁰¹²³⁴⁵⁶'[k]),17,weight='bold',fill=(ORANGE if highlight and k in highlight else INK)))
        b.append(T(x,y+5,p,11.5)); b.append(T(x,y+21,bits,11,MUTED))
    b.append(T(cx,cy-6,'α⁷ = α⁰ = 1',14,MUTED)); b.append(T(cx,cy+14,'で一周',14,MUTED))
    # zero
    b.append(f'<circle cx="640" cy="380" r="30" fill="#f8fafc" stroke="{LINE}" stroke-width="1.5"/>'); b.append(T(640,374,'0',17,weight='bold')); b.append(T(640,394,'000',11,MUTED))
    b.append(T(640,338,'0 は巡回の外',13,MUTED))
    if note:
        for i,line in enumerate(note): b.append(T(470,80+i*26,line,15,anchor='start') if not line.startswith('!') else T(470,80+i*26,line[1:],15,ORANGE,anchor='start',weight='bold'))
    open(f'{OUT}/{fname}','w').write(svg(w,h,'\n'.join(b)))
cycle('05_alpha_cycle.svg',title='α を掛けるたびに円を 1 つ進む（GF(2³)、f = x³ + x + 1）',
      note=['・α を掛ける ＝ 時計回りに 1 つ進む','・7 回で 1 に戻る（α⁷ = 1）','・0 以外の 7 個を全部通る','  → α は原始元'])
cycle('05_alpha_mul.svg',highlight={3,5,1},title='掛け算 ＝ 円の上で指数を足す',
      note=['!α³ · α⁵ = α⁸','α³ から 5 つ進むと','3 + 5 = 8 → 8 − 7 = 1','!= α¹ = α','','逆元: α³ の相手は','あと 4 つ進んで 1 に','戻る α⁴（3 + 4 = 7）'])

# E. xtime
b=[]; w,h=760,300
b.append(T(380,22,'x 倍（xtime）＝ 左シフト、あふれたら 0x1B を XOR　例: 0xAE × 0x02',16,weight='bold'))
def bits_row(y,bits,label,col=INK,fill='#f8fafc',stroke=LINE,offset=0,hl=None,lab2=''):
    out=[T(150+offset*44-6,y+18,label,14,anchor='end',fill=col)]
    for i,ch in enumerate(bits):
        x=170+(i+offset)*44
        f,s=fill,stroke
        if hl and i in hl: f,s=ORF,ORANGE
        out.append(R(x,y,40,36,fill=f,stroke=s,r=5)); out.append(T(x+20,y+18,ch,17,weight='bold'))
    if lab2: out.append(T(170+(len(bits)+offset)*44+10,y+18,lab2,14,MUTED,anchor='start'))
    return out
b+=bits_row(50,'10101110','0xAE',hl={0},lab2='最上位 = 1')
b+=bits_row(110,'101011100','1 つ左へ',offset=-1,hl={0},lab2='= 0x15C（9 ビット）')
b.append(T(170-44+20,160,'あふれ',12,ORANGE))
b+=bits_row(175,'01011100','下位 8 ビット',lab2='0x5C')
b+=bits_row(220,'00011011','⊕ 0x1B',col=ORANGE,lab2='x⁸ ≡ x⁴+x³+x+1')
b.append(f'<line x1="170" y1="263" x2="520" y2="263" stroke="{INK}" stroke-width="1.5"/>')
b+=bits_row(268,'01000111','結果',fill=BLUEF,stroke=BLUE,lab2='0x47')
open(f'{OUT}/05_xtime.svg','w').write(svg(w,310,'\n'.join(b)))

# F. inverse flow
b=[]; w,h=760,170
b.append(T(380,22,'逆元が必ずある理由（整数のときと同じ 3 段）',16,weight='bold'))
boxes=[('f が既約','a ≠ 0, deg a &lt; m','なら gcd(a, f) = 1'),('拡張ユークリッド','a·u + f·v = 1','となる u, v がある'),('f で割った余りを取る','f·v が消えて','a·u ≡ 1 → u が逆元')]
for i,(t1,t2,t3) in enumerate(boxes):
    x=20+i*250
    b.append(R(x,48,220,100,fill=(GRF if i==2 else BLUEF),stroke=(GREEN if i==2 else BLUE))); b.append(T(x+110,72,t1,15,weight='bold')); b.append(T(x+110,100,t2,14)); b.append(T(x+110,124,t3,13,MUTED))
    if i<2: b.append(A(x+222,98,x+248,98,sw=2))
open(f'{OUT}/05_inverse_flow.svg','w').write(svg(w,h,'\n'.join(b)))
print('ok')
