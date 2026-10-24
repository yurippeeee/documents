  /* ===== 21 章 LPWA ===== */
  /* LoRa の式（本文 2・3 節と同じ） */
  function _w21_tsym(sf,bw){return Math.pow(2,sf)/bw;}
  function _w21_rb(sf,bw,cr){return sf*bw/Math.pow(2,sf)*4/(4+cr);}
  /* 空中時間の内訳。ldro: -1 = 自動（シンボル時間 > 16 ms）、0 = 使わない、1 = 使う */
  function _w21_toa(sf,bw,cr,pl,npre,hdr,crc,ldro){
    var T=_w21_tsym(sf,bw),de=ldro<0?(T>0.016?1:0):ldro;
    var num=8*pl-4*sf+8+16*(crc?1:0)+20*(hdr?1:0),den=4*(sf-2*de),nblk=Math.max(Math.ceil(num/den),0);
    var npay=8+nblk*(cr+4);
    return {T:T,de:de,num:num,den:den,nblk:nblk,npay:npay,npre:npre+4.25,t:(npre+4.25+npay)*T};
  }
  /* 受信窓の長さ [s]（6 シンボル以上、時計の誤差の余裕を含む。代表値） */
  function _w21_rxwin(sf){var T=_w21_tsym(sf,125e3);return Math.max(4+Math.ceil(0.020/T-1e-12),6)*T;}
  /* 複素数の FFT（長さは 2 のべき乗。re・im をその場で書き換える） */
  function _w21_fft(re,im){
    var n=re.length,i,j=0,k,len,t;
    for(i=1;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
    for(len=2;len<=n;len<<=1){var ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang);
      for(i=0;i<n;i+=len){var cr=1,ci=0;for(k=0;k<len/2;k++){var a=i+k,b=a+len/2,xr=re[b]*cr-im[b]*ci,xi=re[b]*ci+im[b]*cr;
        re[b]=re[a]-xr;im[b]=im[a]-xi;re[a]+=xr;im[a]+=xi;var nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;}}}
  }
  /* 値 k のシンボル（1 秒に BW 回読んだ N 点）に雑音を足し、基準を掛けて FFT した強さを返す */
  function _w21_demod(sf,k,snrDb,R){
    var N=1<<sf,re=new Float64Array(N),im=new Float64Array(N),sig=Math.sqrt(Math.pow(10,-snrDb/10)/2);
    for(var n=0;n<N;n++){
      var ph=2*Math.PI*(n*n/(2*N)+(k/N-0.5)*n);           /* 値 k のチャープ */
      var r=Math.cos(ph)+sig*R.normal(),q=Math.sin(ph)+sig*R.normal();
      var p0=-2*Math.PI*(n*n/(2*N)-0.5*n);                /* 値 0 のチャープの共役を掛ける */
      var c=Math.cos(p0),s=Math.sin(p0);
      re[n]=r*c-q*s;im[n]=r*s+q*c;
    }
    _w21_fft(re,im);
    var mag=new Float64Array(N),best=0;
    for(var m=0;m<N;m++){mag[m]=Math.sqrt(re[m]*re[m]+im[m]*im[m])/N;if(mag[m]>mag[best])best=m;}
    return {mag:mag,best:best};
  }

  REG.w21_chirp=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"CHIRP","LoRa のシンボルを作り、雑音を足して、受け手の処理で値を読み取る");
    var r1=U.ctrls(el);
    var sfS=U.slider(r1,"拡散率 SF",{values:[7,8,9,10,11,12],value:7,fmt:function(v){return "SF"+v+"（"+Math.pow(2,v)+" 通り）";},onInput:function(){mkVal();draw();}});
    var bwS=U.select(r1,"帯域幅 BW",["125 kHz","250 kHz","500 kHz"],0,draw);
    var crS=U.select(r1,"符号化率",["4/5","4/6","4/7","4/8"],0,draw);
    var r2=U.ctrls(el); var valS=null,valBox=U.mk("div");valBox.style.display="contents";r2.appendChild(valBox);
    var snrS=U.slider(r2,"SN 比",{min:-30,max:10,step:0.5,value:10,fmt:function(v){return (v>0?"+":"")+v+" dB";},onInput:draw});
    var br=U.btnrow(el); var seed=21,trials=null;
    U.button(br,"もう一度（別の雑音で）",function(){seed++;trials=null;draw();});
    U.button(br,"200 回試して誤りの割合を見る",function(){trials=run(200);draw();});
    U.button(br,"SN 比 −15 dB にする",function(){snrS.set(-15);trials=null;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function mkVal(){var N=Math.pow(2,sfS.get()),cur=valS?Math.min(valS.get(),N-1):Math.round(N*0.3);valBox.innerHTML="";
      valS=U.slider(valBox,"送る値 k",{min:0,max:N-1,step:1,value:cur,fmt:function(v){return v+"（0〜"+(N-1)+"）";},onInput:function(){trials=null;draw();}});trials=null;}
    function run(n){var sf=sfS.get(),N=1<<sf,R=U.rng(seed*7919+sf),bad=0;
      for(var i=0;i<n;i++){var k=R.int(N);if(_w21_demod(sf,k,snrS.get(),R).best!==k)bad++;}return {n:n,bad:bad,snr:snrS.get(),sf:sf};}
    function draw(){
      var sf=sfS.get(),N=1<<sf,k=valS.get(),bw=[125e3,250e3,500e3][bwS.get()],cr=crS.get()+1,snr=snrS.get();
      var Ts=_w21_tsym(sf,bw),R=U.rng(seed*31+sf*7+k),d=_w21_demod(sf,k,snr,R),o=[],W=700;
      /* (a) 周波数の動き */
      var pa=U.plot(60,36,250,150,[0,Ts*1e3],[0,1]);
      o.push(S.T(185,18,"(a) 送るシンボルと基準（値 0）","middle",11,"ink",true));
      o.push(pa.axes({xt:[0,Ts*1e3/2,Ts*1e3],yt:[0,0.5,1],xfmt:function(v){return U.sig(v,3)+" ms";},yfmt:function(v){return v===0?"下端":v===1?"上端":"";},grid:false}));
      o.push(pa.line([[0,0],[Ts*1e3,1]],"muted",1.4,"5 4"));
      var s0=k/N,tw=(1-s0)*Ts*1e3;
      o.push(pa.line([[0,s0],[tw,1]],"signal",2.2));
      if(k>0){o.push(S.L(pa.X(tw),pa.Y(1),pa.X(tw),pa.Y(0),"signal",1,"2 3"));o.push(pa.line([[tw,0],[Ts*1e3,s0]],"signal",2.2));}
      o.push(S.T(pa.X(Ts*1e3*0.98),pa.Y(0.06),"基準","end",9.5,"muted",false,false,null,true));
      /* (b) 基準を引いた周波数 */
      var pb=U.plot(380,36,120,150,[0,1],[-1,1]);
      o.push(S.T(440,18,"(b) 基準を引く","middle",11,"ink",true));
      o.push(S.L(pb.x,pb.Y(0),pb.x+pb.w,pb.Y(0),"muted",1));o.push(S.L(pb.x,pb.Y(-1),pb.x,pb.Y(1),"muted",1));
      o.push(pb.line([[0,s0],[1-s0,s0]],"signal",2.4));
      if(k>0)o.push(pb.line([[1-s0,s0-1],[1,s0-1]],"signal",2.4,"5 3"));
      o.push(S.T(pb.x-4,pb.Y(s0)+4,"k·BW/"+N,"end",9,"signal",true));
      o.push(S.T(pb.x+pb.w/2,pb.Y(-1)+16,"破線は BW 違い（同じに見える）","middle",9,"gold"));
      /* (c) 周波数ごとの強さ */
      var pc=U.plot(560,36,130,150,[0,N],[0,1.05]);
      o.push(S.T(625,18,"(c) 周波数ごとの強さ","middle",11,"ink",true));
      o.push(pc.axes({xt:[0,N/2,N],yt:[0,0.5,1],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},grid:false}));
      var mx=0;for(var m=0;m<N;m++)mx=Math.max(mx,d.mag[m]);
      var pts=[];for(var m2=0;m2<N;m2++){pts.push([m2,d.mag[m2]/mx]);}
      o.push(pc.line(pts,"teal",N>512?0.8:1.2));
      var ok=d.best===k;
      o.push(S.D(pc.X(k),pc.Y(d.mag[k]/mx),"signal",4));
      o.push(S.T(pc.X(d.best),pc.Y(1)-6,"最大 "+d.best,d.best>N*0.6?"end":"start",9.5,ok?"green":"alias",true,false,null,true));
      box.set(S.svg(W,222,o));
      var rb=_w21_rb(sf,bw,cr);
      var res=ok?'<span class="ok">正しく '+k+' と読めた</span>':'<span class="warn">'+d.best+' と読み誤った（送った値は '+k+'）</span>';
      var tr=trials&&trials.sf===sf&&trials.snr===snr?"<br>"+trials.n+" 回のうち、読み誤ったのは <b>"+trials.bad+" 回</b>（"+U.sig(trials.bad/trials.n*100,3)+" %）":"";
      ro.innerHTML="シンボル時間 T_sym = 2^"+sf+" ÷ "+U.sig(bw/1e3,3)+" kHz = <b>"+F.time(Ts)+"</b> ・ 1 シンボルで "+sf+" ビット ・ ビットレート = "+sf+" × "+U.sig(bw/1e3,3)+" kHz ÷ "+N+" × 4/"+(4+cr)+" = <b>"+F.rate(rb)+"</b><br>"+
        "SN 比 "+(snr>0?"+":"")+snr+" dB で "+res+"（(c) の青い点が送った値）"+tr+
        '<div class="wnote">雑音は SN 比に合わせた乱数（1 秒に BW 回読んだ値に足す）。データシートの SN 比の限度の代表値は SF7 で −7.5 dB、SF12 で −20 dB。SF を上げると、もっと弱い信号でも読める。</div>';
    }
    mkVal(); draw();
  };

  REG.w21_airtime=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"AIRTIME","LoRa の空中時間と、デューティサイクル・送信の重なり");
    var r1=U.ctrls(el);
    var sfS=U.slider(r1,"拡散率 SF",{values:[7,8,9,10,11,12],value:7,fmt:function(v){return "SF"+v;},onInput:draw});
    var bwS=U.select(r1,"帯域幅 BW",["125 kHz","250 kHz","500 kHz"],0,draw);
    var crS=U.select(r1,"符号化率",["4/5","4/6","4/7","4/8"],0,draw);
    var r2=U.ctrls(el);
    var dS=U.slider(r2,"アプリケーションのデータ",{min:0,max:242,step:1,value:12,fmt:function(v){return v+" バイト";},onInput:draw});
    var lw=U.checkbox(r2,"LoRaWAN の 13 バイトを足す",true,draw);
    var nS=U.slider(r2,"プリアンブル n",{values:[6,8,10,12,16],value:8,fmt:function(v){return v+" シンボル";},onInput:draw});
    var r3=U.ctrls(el);
    var hd=U.checkbox(r3,"明示ヘッダ",true,draw), cc=U.checkbox(r3,"CRC",true,draw);
    var ld=U.select(r3,"LDRO",["自動（シンボル時間 > 16 ms）","使う","使わない"],0,draw);
    var dc=U.select(r3,"デューティサイクルの上限",["1 %","0.1 %","10 %","制限なし"],0,draw);
    var r4=U.ctrls(el);
    var nd=U.slider(r4,"同じチャネル・同じ SF の機器",{min:1,max:10000,log:true,int:true,value:1000,fmt:function(v){return v+" 台";},onInput:draw});
    var tr=U.slider(r4,"1 台が送る間隔",{values:[10,60,300,600,1800,3600,21600,86400],value:3600,fmt:function(v){return F.time(v);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（12 バイト・SF7）",function(){sfS.set(7);bwS.set(0);crS.set(0);dS.set(12);lw.set(true);nS.set(8);hd.set(true);cc.set(true);ld.set(0);dc.set(0);nd.set(1000);tr.set(3600);draw();});
    U.button(br,"SF12 にする",function(){sfS.set(12);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var DCV=[0.01,0.001,0.1,0];
    function draw(){
      var sf=sfS.get(),bw=[125e3,250e3,500e3][bwS.get()],cr=crS.get()+1,pl=dS.get()+(lw.get()?13:0),n=nS.get(),
          ldro=[-1,1,0][ld.get()],d=DCV[dc.get()],N=nd.get(),Tr=tr.get();
      var warn="";
      if(pl>255){warn='<span class="warn">LoRa のペイロードは 255 バイトまで。255 バイトとして計算した。</span><br>';pl=255;}
      var a=_w21_toa(sf,bw,cr,pl,n,hd.get(),cc.get(),ldro);
      if(a.T>0.016&&a.de===0)warn+='<span class="warn">シンボル時間が 16 ms を超えるのに LDRO を使っていない（データシートは使うよう求めている）。</span><br>';
      var o=[],W=700,x0=110,x1=650,tot=a.npre+a.npay,X=function(s){return x0+(x1-x0)*s/tot;};
      o.push(S.T(16,20,"パケットの内訳（シンボル）","start",11,"ink",true));
      var segs=[[0,a.npre,"プリアンブル "+a.npre,"muted"],[a.npre,a.npre+8,"最初 8","purple"],[a.npre+8,tot,"ブロック "+a.nblk+" × "+(cr+4),"signal"]];
      segs.forEach(function(s){var w=X(s[1])-X(s[0]);if(w<=0)return;o.push(S.RECT(X(s[0]),30,w,30,3,U.soft(s[3]),s[3],1.2));
        if(w>U.tw(s[2],9.5)+6)o.push(S.T((X(s[0])+X(s[1]))/2,49,s[2],"middle",9.5,s[3],true));});
      o.push(S.T(x0-8,49,F.time(a.t),"end",10,"alias",true));
      o.push(S.T(x1,76,tot+" シンボル × "+F.time(a.T)+" = "+F.time(a.t),"end",10,"ink",true));
      /* SF ごとの比較 */
      var y0=104;o.push(S.T(16,y0,"SF ごとの空中時間（ほかの設定は同じ）","start",11,"ink",true));
      var tmax=_w21_toa(12,bw,cr,pl,n,hd.get(),cc.get(),ldro<0?-1:ldro).t;
      for(var s2=7;s2<=12;s2++){var b=_w21_toa(s2,bw,cr,pl,n,hd.get(),cc.get(),ldro),yy=y0+12+(s2-7)*24,ww=Math.max(2,420*b.t/tmax),c=s2===sf?"alias":"signal";
        o.push(S.T(60,yy+14,"SF"+s2,"end",10,c,s2===sf));o.push(S.RECT(70,yy,ww,18,3,U.soft(c),c,s2===sf?2:1.1));
        o.push(S.T(70+ww+6,yy+13,F.time(b.t)+(d>0?" ・ 1 時間に "+Math.floor(3600*d/b.t)+" 回":""),"start",9.5,c,s2===sf));}
      box.set(S.svg(W,y0+12+6*24+6,o));
      var gap=d>0?a.t/d:0,perH=d>0?Math.floor(3600*d/a.t):Infinity;
      var p=Math.pow(Math.max(0,1-2*a.t/Tr),N-1);
      var rows=[];
      rows.push(["シンボル時間","2^"+sf+" ÷ "+U.sig(bw/1e3,3)+" kHz","<b>"+F.time(a.T)+"</b>"]);
      rows.push(["分子 8PL − 4SF + 8 + 16C + 20H","8×"+pl+" − 4×"+sf+" + 8 + "+(cc.get()?16:0)+" + "+(hd.get()?20:0),"<b>"+a.num+"</b>"]);
      rows.push(["分母 4(SF − 2D_E)","4 × ("+sf+" − "+(2*a.de)+")"+(a.de?"（LDRO）":""),"<b>"+a.den+"</b>"]);
      rows.push(["ブロックの数","⌈"+a.num+" ÷ "+a.den+"⌉"+(a.num<=0?"（0 以下なので 0）":""),"<b>"+a.nblk+"</b>"]);
      rows.push(["N_pay","8 + "+a.nblk+" × "+(cr+4),"<b>"+a.npay+"</b>"]);
      rows.push(["空中時間","("+n+" + 4.25 + "+a.npay+") × "+F.time(a.T),"<b>"+F.time(a.t)+"</b>"]);
      rows.push(["送信の電荷（40 mA の代表値）","40 mA × "+F.time(a.t),"<b>"+U.sig(40*a.t,3)+" mC</b>"]);
      ro.innerHTML=warn+"PL = "+pl+" バイト"+(lw.get()?"（データ "+dS.get()+" + LoRaWAN 13）":"")+" ・ ビットレート "+F.rate(_w21_rb(sf,bw,cr))+
        U.tbl(["項目","式","値"],rows,["left","left","right"])+
        (d>0?"デューティサイクル "+U.sig(d*100,2)+" %: 送り始めの最小の間隔 = 空中時間 ÷ "+U.sig(d,2)+" = <b>"+F.time(gap)+"</b> ・ 1 時間に <b>"+perH+" 回</b>まで"+
          (Tr<gap?' ・ <span class="warn">'+F.time(Tr)+" ごとには送れない</span>":' ・ <span class="ok">'+F.time(Tr)+" ごとなら守れる（許される回数の "+U.sig(gap/Tr*100,3)+" % を使う）</span>"):"デューティサイクルの制限なし")+"<br>"+
        "重ならない確率 = (1 − 2 × "+F.time(a.t)+" ÷ "+F.time(Tr)+")^("+N+" − 1) = <b>"+U.sig(p*100,3)+" %</b>"+
        '<div class="wnote">LoRa のパケットの空中時間は Semtech のデータシートの式。送信の電流は代表値。重なりの計算は、全台が同じチャネル・同じ SF で、互いに無関係な時刻に送るとしたもの。日本の 920 MHz 帯の条件は ARIB STD-T108 で確かめる。</div>';
    }
    draw();
  };

  REG.w21_cell=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"CELLULAR","LTE-M・NB-IoT の平均電流と下りの遅れ（PSM・eDRX）");
    var r0=U.ctrls(el);
    var mode=U.seg(r0,["PSM","eDRX","どちらも使わない（DRX）"],0,draw);
    var r1=U.ctrls(el);
    var trS=U.slider(r1,"報告の間隔 T_r",{values:[60,300,600,1800,3600,7200,21600,43200,86400],value:3600,fmt:function(v){return F.time(v);},onInput:draw});
    var qrS=U.slider(r1,"1 回の報告の電荷 Q_r",{min:5,max:500,log:true,value:60,fmt:function(v){return v+" mC";},onInput:draw});
    var isS=U.slider(r1,"深く眠る電流 I_s",{min:1,max:50,log:true,value:5,fmt:function(v){return v+" µA";},onInput:draw});
    var r2=U.ctrls(el);
    var taS=U.slider(r2,"アクティブタイマ T3324",{values:[0,2,10,20,30,60,120,360],value:20,fmt:function(v){return v+" 秒";},onInput:draw});
    var tauS=U.slider(r2,"T3412",{values:[3600,7200,21600,36000,86400,172800,604800],value:36000,fmt:function(v){return F.time(v);},onInput:draw});
    var qtS=U.slider(r2,"TAU 1 回の電荷",{min:5,max:200,log:true,value:30,fmt:function(v){return v+" mC";},onInput:draw});
    var r3=U.ctrls(el);
    var tdS=U.slider(r3,"DRX の周期 T_d",{values:[0.32,0.64,1.28,2.56],value:1.28,fmt:function(v){return v+" 秒";},onInput:draw});
    var qpS=U.slider(r3,"呼び出しを聞く 1 回の電荷 q_p",{min:0.05,max:2,log:true,value:0.3,fmt:function(v){return v+" mC";},onInput:draw});
    var teS=U.slider(r3,"eDRX の周期 T_e",{values:[5.12,10.24,20.48,40.96,81.92,163.84,327.68,655.36,1310.72,2621.44,5242.88,10485.76],value:81.92,fmt:function(v){return v+" 秒";},onInput:draw});
    var r4=U.ctrls(el);
    var ieS=U.slider(r4,"eDRX・DRX の間の眠りの電流 I_e",{min:1,max:100,log:true,value:15,fmt:function(v){return v+" µA";},onInput:draw});
    var capS=U.slider(r4,"電池の容量",{values:[220,1000,2000,3000,6000,19000],value:2000,fmt:function(v){return v+" mAh";},onInput:draw});
    var lsf=U.select(r4,"比べる LoRaWAN（クラス A）",["SF7","SF8","SF9","SF10","SF11","SF12"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例に戻す",function(){mode.set(0);trS.set(3600);qrS.set(60);isS.set(5);taS.set(20);tauS.set(36000);qtS.set(30);tdS.set(1.28);qpS.set(0.3);teS.set(81.92);ieS.set(15);capS.set(2000);lsf.set(0);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function parts(m,Tr){
      var Is=isS.get()*1e-6,Qr=qrS.get()*1e-3,Ta=taS.get(),T3412=tauS.get(),Qt=qtS.get()*1e-3,Td=tdS.get(),qp=qpS.get()*1e-3,Te=teS.get(),Ie=ieS.get()*1e-6;
      if(m===0){var ntau=Math.max(0,Math.ceil(Tr/T3412-1e-9)-1),qa=Ta/Td*qp;
        return {floor:Is,rep:Qr/Tr,page:(1+ntau)*qa/Tr,tau:ntau*Qt/Tr,ntau:ntau,qa:qa,dl:Math.min(Tr,T3412)};}
      if(m===1)return {floor:Ie,rep:Qr/Tr,page:qp/Te,tau:0,ntau:0,qa:0,dl:Te};
      return {floor:Ie,rep:Qr/Tr,page:qp/Td,tau:0,ntau:0,qa:0,dl:Td};
    }
    function tot(q){return q.floor+q.rep+q.page+q.tau;}
    function lora(Tr){var sf=lsf.get()+7,t=_w21_toa(sf,125e3,1,25,8,1,1,-1).t,q=40e-3*t+10e-3*(_w21_rxwin(sf)+_w21_rxwin(12));return 2e-6+q/Tr;}
    function draw(){
      var m=mode.get(),Tr=trS.get(),q=parts(m,Tr),I=tot(q),cap=capS.get()*3.6,life=cap/I;
      var o=[],W=700;
      /* 内訳の帯 */
      var x0=110,wb=560,items=[["眠り",q.floor,"green"],["報告",q.rep,"alias"],["呼び出しを聞く",q.page,"teal"],["TAU",q.tau,"purple"]];
      o.push(S.T(16,22,"平均電流の内訳","start",11,"ink",true));
      var x=x0;items.forEach(function(it){var w=wb*it[1]/I;if(w<=0)return;o.push(S.RECT(x,32,w,24,2,U.soft(it[2]),it[2],1.1));
        var lab=it[0]+" "+F.cur(it[1]);if(w>U.tw(lab,9.5)+6)o.push(S.T(x+w/2,48,lab,"middle",9.5,it[2],true));x+=w;});
      o.push(S.T(x0-8,49,F.cur(I),"end",10.5,"ink",true));
      /* 報告の間隔と平均電流 */
      var p=U.plot(110,90,470,200,[60,86400],[1e-6,3e-3],{xlog:true,ylog:true});
      var xl={60:"1 分",600:"10 分",3600:"1 時間",21600:"6 時間",86400:"1 日"};
      o.push(p.axes({xl:"報告の間隔 T_r",yl:"平均電流",xt:[60,600,3600,21600,86400],yt:[1e-6,1e-5,1e-4,1e-3],xfmt:function(v){return xl[v];},yfmt:function(v){return F.cur(v,1);},ylOff:50}));
      var names=["PSM","eDRX","DRX"],cols=["signal","teal","alias"],xs=[];for(var k=0;k<=128;k++){var t=60*Math.pow(10,k/40);if(t<=86400)xs.push(t);}
      for(var mm=0;mm<3;mm++){var pts=xs.map(function(t){return [t,Math.min(3e-3,Math.max(1e-6,tot(parts(mm,t))))];});o.push(p.line(pts,cols[mm],mm===m?2.6:1.3,mm===m?null:"4 3"));
        var ye=Math.min(3e-3,Math.max(1e-6,tot(parts(mm,86400))));o.push(S.T(p.X(86400)+6,p.Y(ye)+4,names[mm],"start",9.5,cols[mm],mm===m));}
      var lp=xs.map(function(t){return [t,Math.min(3e-3,Math.max(1e-6,lora(t)))];});o.push(p.line(lp,"green",1.6,"7 4"));
      o.push(S.T(p.X(86400)+6,p.Y(Math.max(1e-6,lora(86400)))+16,"LoRaWAN SF"+(lsf.get()+7),"start",9.5,"green",true));
      o.push(S.D(p.X(Tr),p.Y(Math.min(3e-3,Math.max(1e-6,I))),"ink",5));
      box.set(S.svg(W,330,o));
      var Is=isS.get(),Qr=qrS.get(),Ta=taS.get(),Td=tdS.get(),qp=qpS.get();
      var f=m===0?"I = I_s + (Q_r + (T_a/T_d) q_p"+(q.ntau?" + TAU の分":"")+") / T_r = "+Is+" µA + ("+Qr+" mC + "+U.sig(q.qa*1e3,3)+" mC"+(q.ntau?" + "+q.ntau+" × ("+qtS.get()+" + "+U.sig(q.qa*1e3,3)+") mC":"")+") ÷ "+F.time(Tr):
        "I = I_e + Q_r/T_r + q_p/"+(m===1?"T_e":"T_d")+" = "+ieS.get()+" µA + "+Qr+" mC ÷ "+F.time(Tr)+" + "+qp+" mC ÷ "+(m===1?teS.get():Td)+" s";
      var lifeY=life/(365*86400);
      ro.innerHTML=f+" = <b>"+F.cur(I)+"</b><br>"+
        "電池寿命 = "+capS.get()+" mAh ÷ "+F.cur(I)+" ≈ <b>"+(lifeY>=1?U.sig(lifeY,3)+" 年":U.sig(life/86400,3)+" 日")+"</b> ・ 下りの最大の遅れ ≈ <b>"+F.time(q.dl)+"</b>"+
        (m===0?"（深く眠っている間に届いた下りは、次の報告"+(q.ntau?"か TAU":"")+"の後の T3324 の間に受け取る）":m===1?"（eDRX の周期ごとに呼び出しを聞く）":"（DRX の周期ごとに呼び出しを聞く）")+
        (m===0&&Ta===0?'<br><span class="warn">T3324 が 0 なので、報告の後すぐに深く眠り、呼び出しは聞かない（下りは報告への返事でしか届かない）。</span>':"")+"<br>"+
        "比べる LoRaWAN（クラス A・SF"+(lsf.get()+7)+"・データ 12 バイト）を同じ間隔で送ると "+F.cur(lora(Tr))+
        '<div class="wnote">電流と電荷はすべて代表値。報告の電荷は、電波の状態（繰り返しの回数）と網の設定（接続を保つ時間）で 1 桁変わる。LoRaWAN は 5 節の例（送信 40 mA、受信 10 mA、RX2 は SF12、眠り 2 µA）。電池が使わなくても減る分は含めていない。</div>';
    }
    draw();
  };
