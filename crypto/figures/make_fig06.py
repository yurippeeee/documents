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
