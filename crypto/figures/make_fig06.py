from make_fig05 import svg, T, R, A, OUT, INK, MUTED, BLUE, BLUEF, ORANGE, ORF, GREEN, GRF, LINE

# A. 送信から受信までの流れ
b=[]; w,h=900,250
b.append(T(450,24,'送るのは符号語だけ。情報語は符号語の中に含まれている',16,weight='bold'))
boxes=[(20,'情報語','k ビット','1',GRF,GREEN,'送りたいデータ'),
       (250,'符号語','n ビット','111',BLUEF,BLUE,'通信路に出すもの'),
       (480,'受信語','n ビット','101',ORF,ORANGE,'受信者が受け取るもの'),
       (710,'情報語','k ビット','1',GRF,GREEN,'推定した元のデータ')]
for x,name,size,ex,fill,stroke,note in boxes:
    b.append(R(x,52,170,120,fill=fill,stroke=stroke))
    b.append(T(x+85,76,name,17,stroke,weight='bold'))
    b.append(T(x+85,98,size,13,MUTED))
    b.append(T(x+85,134,ex,22,weight='bold'))
    b.append(T(x+85,192,note,13,MUTED))
arrows=[(190,250,'符号化'),(420,480,'通信路'),(650,710,'復号')]
for x1,x2,lab in arrows:
    b.append(A(x1+4,112,x2-4,112,sw=2))
    b.append(T((x1+x2)/2,96,lab,13,weight='bold'))
b.append(T(450,140,'誤りで',12,ORANGE)); b.append(T(450,156,'反転しうる',12,ORANGE))
b.append(T(450,228,'例: 3 回繰り返し符号（1 節）。誤りが無ければ受信語は送った符号語と同じになる',13,MUTED))
open(f'{OUT}/06_flow.svg','w').write(svg(w,h,'\n'.join(b)))

# B. 3 ビットの立方体で、符号語が近い場合と遠い場合を比べる
def cube(ox, oy, code, decode=None, err=None, title='', sub='', good=True):
    S=150; D=(70,-55)
    def pos(bits):
        b2,b1,b0=int(bits[0]),int(bits[1]),int(bits[2])
        return (ox+S*b0+D[0]*b2, oy-S*b1+D[1]*b2)
    verts=[format(i,'03b') for i in range(8)]
    o=[]
    o.append(T(ox+110,34,title,16,GREEN if good else ORANGE,weight='bold'))
    o.append(T(ox+110,56,sub,13,MUTED))
    for v in verts:
        for k in range(3):
            u=list(v); u[k]='1' if u[k]=='0' else '0'; u=''.join(u)
            if v<u:
                (x1,y1),(x2,y2)=pos(v),pos(u)
                o.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{LINE}" stroke-width="2"/>')
    if err:
        (x1,y1),(x2,y2)=pos(err[0]),pos(err[1])
        dx,dy=x2-x1,y2-y1; L=(dx*dx+dy*dy)**.5; ux,uy=dx/L,dy/L
        o.append(A(x1+ux*24,y1+uy*24-10,x2-ux*26,y2-uy*26-10,col=ORANGE,m='aro',sw=2.2))
    for v in verts:
        x,y=pos(v)
        if v in code:
            o.append(f'<circle cx="{x}" cy="{y}" r="22" fill="{BLUE}" stroke="{BLUE}"/>')
            o.append(T(x,y,v,13,'#fff',weight='bold'))
        else:
            fill,st='#fff',LINE
            if decode and v in decode:
                fill,st=decode[v]
            o.append(f'<circle cx="{x}" cy="{y}" r="20" fill="{fill}" stroke="{st}" stroke-width="1.5"/>')
            o.append(T(x,y,v,12,INK))
    return o
b=[]; w,h=900,420
bad=cube(80,330,['000','001'],err=('000','001'),title='近い配置（悪い例）',sub='符号語 000 と 001 は 1 ビットしか違わない',good=False)
dec={v:(BLUEF,BLUE) for v in ['001','010','100']}
dec.update({v:(ORF,ORANGE) for v in ['110','101','011']})
good=cube(530,330,['000','111'],decode=dec,err=('111','101'),title='遠い配置（良い例）',sub='符号語 000 と 111 は 3 ビットすべて違う',good=True)
b+=bad+good
b.append(T(190,372,'1 ビットの誤りで 000 が 001 に化けると、',13,ORANGE))
b.append(T(190,392,'受信語も符号語なので誤りに気づけない',13,ORANGE))
b.append(T(640,372,'1 ビットの誤りでは符号語にならない。青は 000 に、',13,INK))
b.append(T(640,392,'橙は 111 に近いので、近いほうに直せる（例 111 → 101 → 111）',13,INK))
open(f'{OUT}/06_spacing.svg','w').write(svg(w,h,'\n'.join(b)))
