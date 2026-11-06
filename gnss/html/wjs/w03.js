  /* ===== 03 章 雑音より弱い電波を受ける — 信号の強さと C/N0 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w03_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w03_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W03_C=299792458,_W03_RC=1.023e6,_W03_TC=1/1.023e6,_W03_KB=1.380649e-23,_W03_T0=290,_W03_RE=6371e3,_W03_A=26560e3,_W03_LAM=299792458/1575.42e6;
  var _W03_N0=10*Math.log10(1.380649e-23*290)+30;   /* 290 K の熱雑音の密度 −174.0 dBm/Hz */
  function _w03_range(el){var t=el*Math.PI/180;return Math.sqrt(_W03_A*_W03_A-Math.pow(_W03_RE*Math.cos(t),2))-_W03_RE*Math.sin(t);}
  function _w03_lfs(r){return 20*Math.log10(4*Math.PI*r/_W03_LAM);}
  var _W03_EIRP=-128.5-30+_w03_lfs(_w03_range(5))+0.5;   /* 受信電力の最小値から逆算した EIRP（26.4 dBW。例の値） */
  function _w03_ga(el){return 3-8*Math.pow((90-el)/85,2);}   /* 例のアンテナの利得 [dBi] */
  /* 相補誤差関数（どの x でも相対誤差 1.2 × 10⁻⁷ 未満の近似）と Q 関数 */
  function _w03_erfc(x){var z=Math.abs(x),t=1/(1+0.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
  function _w03_Q(x){return 0.5*_w03_erfc(x/Math.SQRT2);}
  function _w03_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
  function _w03_sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
  /* 1.2 × 10⁻⁵ の形の数 */
  function _w03_sci(v,d){if(v<1e-100)return "10⁻¹⁰⁰ より小さい";if(v>=0.01)return _w03_f(v,3);var e=Math.floor(Math.log10(v)),m=v/Math.pow(10,e);if(+m.toFixed(d||1)>=10){m/=10;e++;}
    var sup="⁰¹²³⁴⁵⁶⁷⁸⁹",es=String(Math.abs(e)).split("").map(function(c){return sup[+c];}).join("");return m.toFixed(d||1)+" × 10"+(e<0?"⁻":"")+es;}
  /* 信号の電力のうち、L1 のまわりの幅 B [Hz] に入る割合（C/A 符号の sinc² の積分） */
  function _w03_frac(B){var n=2000,h=(B/2*_W03_TC)/n,s=0;for(var i=0;i<=n;i++){var x=i*h,w=(i===0||i===n)?1:(i%2?4:2),v=_w03_sinc(x);s+=w*v*v;}return Math.min(1,2*s*h/3);}
  /* 逆 FFT（共役をとって順変換し、共役をとって N で割る） */
  function _w03_ifft(U,re,im){var n=re.length,k;for(k=0;k<n;k++)im[k]=-im[k];U.gnss.fft(re,im);for(k=0;k<n;k++){re[k]/=n;im[k]=-im[k]/n;}}

  /* ---- 3 節: 帯域の幅と SN 比（電力スペクトル密度 ↔ 波形） ---- */
  REG.w03_band=function(el,U){
    var S=U.S,NS=8192,FS=64*_W03_RC,FIF=12*_W03_RC,PM=U.gnss.pm(1);
    U.head(el,"NOISE BANDWIDTH","帯域の幅と SN 比 — C/N0 は帯域の選び方によらない");
    var r1=U.ctrls(el);
    var cn=U.slider(r1,"C/N0",{min:25,max:55,step:0.5,value:45.5,fmt:function(v){return _w03_f(v,1)+" dB-Hz（C = "+_w03_f(v+_W03_N0,1)+" dBm）";},onInput:function(){draw();}});
    var bw=U.slider(r1,"受ける帯域の幅 B<sub>n</sub>",{values:[0.5,1,2,4,8,20],value:2,fmt:function(v){return v+" MHz";},onInput:function(){filt();draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（45.5 dB-Hz・2 MHz）",function(){cn.set(45.5);bw.set(2);filt();draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();filt();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    var w0=new Float64Array(NS),s0=new Float64Array(NS),wb=new Float64Array(NS),sb=new Float64Array(NS);
    /* 雑音は、片側の密度 1/(2 MHz) の白色雑音（2 MHz の帯域で分散 1）。信号は電力 1 の BPSK（表示のため搬送波を 12.276 MHz に下げた） */
    function gen(){var g=U.rng(seed*7919+3),sd=Math.sqrt(FS/4e6);
      for(var k=0;k<NS;k++){w0[k]=sd*g.normal();var t=k/FS;s0[k]=Math.SQRT2*PM[Math.floor(t*_W03_RC)%1023]*Math.cos(2*Math.PI*FIF*t);}}
    function bp(x,out,B){var re=new Float64Array(NS),im=new Float64Array(NS),k;for(k=0;k<NS;k++)re[k]=x[k];U.gnss.fft(re,im);
      for(k=0;k<NS;k++){var f=(k<=NS/2?k:NS-k)*FS/NS;if(Math.abs(f-FIF)>=B/2){re[k]=0;im[k]=0;}}
      _w03_ifft(U,re,im);for(k=0;k<NS;k++)out[k]=re[k];}
    function filt(){var B=bw.get()*1e6;bp(w0,wb,B);bp(s0,sb,B);}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],q=Math.pow(10,cn.get()/10),B=bw.get()*1e6,Cd=cn.get()+_W03_N0,fr=_w03_frac(B),Nd=_W03_N0+10*Math.log10(B);
      var amp=Math.sqrt(q/2e6);   /* 表示の単位で √C（N0 = 1/(2 MHz)） */
      /* (a) 電力スペクトル密度 */
      var xm=Math.max(4,B/2e6*1.3),pw=nar?320:300,P=U.plot(64,30,pw,170,[-xm,xm],[-200,-165]);
      o.push(S.T(nar?6:14,16,"(a) 電力スペクトル密度","start",11,"ink",true));
      o.push(S.RECT(P.X(-B/2e6),P.y,P.X(B/2e6)-P.X(-B/2e6),P.h,0,U.soft("gold"),"none",0));
      o.push(P.axes({xl:"周波数 f − f_{L1} [MHz]",yl:"[dBm/Hz]",xt:U.nice(-xm,xm,6).filter(function(v){return Math.abs(v)<=xm+1e-9;}),yt:[-200,-190,-180,-170],xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return String(v).replace("-","−");},ylOff:44}));
      o.push(P.line([[-xm,_W03_N0],[xm,_W03_N0]],"teal",2.2));
      var sp=[];for(var i=0;i<=600;i++){var f=-xm+2*xm*i/600,v=_w03_sinc(f*1e6*_W03_TC);sp.push([f,Cd+10*Math.log10(_W03_TC*Math.max(v*v,1e-14))]);}
      o.push(P.clip(sp,"signal",1.8));
      o.push(S.T(P.X(xm)-4,P.Y(_W03_N0)-5,"雑音の床 −174.0","end",9,"teal",true,false,null,true));
      o.push(S.T(P.X(0),P.y+12,"受ける帯域 "+bw.get()+" MHz","middle",9,"gold",true,false,null,true));
      o.push(S.T(P.X(0)+6,P.Y(Cd+10*Math.log10(_W03_TC))-6,"信号の山 "+_w03_f(Cd+10*Math.log10(_W03_TC),1),"start",9,"signal",true,false,null,true));
      /* (b) 帯域の中の電力 */
      var bx=nar?64:430,by=nar?260:30,Q=U.plot(bx,by,nar?120:110,170,[0,1],[-135,-95]);
      o.push(S.T(nar?6:bx-30,by-14,"(b) 帯域の中の電力","start",11,"ink",true));
      o.push(Q.axes({xt:[],yt:[-135,-125,-115,-105,-95],yfmt:function(v){return String(v).replace("-","−");},yl:"[dBm]",ylOff:40}));
      var cb=Cd+10*Math.log10(fr);
      o.push(S.RECT(Q.X(0.12),Q.Y(Math.min(Nd,-95)),Q.X(0.45)-Q.X(0.12),Q.Y(-135)-Q.Y(Math.min(Nd,-95)),2,U.soft("teal"),"teal",1.2));
      o.push(S.RECT(Q.X(0.55),Q.Y(Math.max(Math.min(cb,-95),-135)),Q.X(0.88)-Q.X(0.55),Q.Y(-135)-Q.Y(Math.max(Math.min(cb,-95),-135)),2,U.soft("signal"),"signal",1.2));
      o.push(S.T(Q.X(0.285),Q.Y(-135)+14,"雑音 N","middle",9.5,"teal",true));o.push(S.T(Q.X(0.715),Q.Y(-135)+14,"信号","middle",9.5,"signal",true));
      o.push(S.T(Q.X(0.285),Q.Y(Math.min(Nd,-95))-4,_w03_f(Nd,1),"middle",9,"teal",true,false,null,true));
      o.push(S.T(Q.X(0.715),Q.Y(Math.max(Math.min(cb,-95),-135))-4,_w03_f(cb,1),"middle",9,"signal",true,false,null,true));
      var tx=nar?200:Q.x+Q.w+12;
      o.push(S.T(tx,by+40,"C/N = "+_w03_f(cb-Nd,1)+" dB","start",11,cb-Nd<0?"alias":"green",true));
      o.push(S.T(tx,by+58,"C/N0 = "+_w03_f(cn.get(),1)+" dB-Hz","start",11,"signal",true));
      o.push(S.T(tx,by+76,"（帯域によらない）","start",9.5,"muted"));
      /* (c) 波形 */
      var cy=nar?500:272,ch0=60,nc=4,R=U.plot(64,cy,nar?320:600,120,[ch0,ch0+nc],[-8,8]),lo=ch0*64,hi=(ch0+nc)*64;
      o.push(S.T(nar?6:14,cy-14,"(c) 帯域を通した波形（縦は、2 MHz の雑音の標準偏差を 1 とした値）","start",11,"ink",true));
      o.push(R.axes({xt:[ch0,ch0+1,ch0+2,ch0+3,ch0+4],yt:[-8,-4,0,4,8],xfmt:function(v){return String(v);},yfmt:function(v){return String(v).replace("-","−");},xl:"時間 [チップ]（表示のため搬送波を 12.276 MHz に下げた）",ylOff:30}));
      var pa=[],pb=[];for(var k=lo;k<=hi;k++){var t=k/64;pa.push([t,wb[k]+amp*sb[k]]);pb.push([t,amp*sb[k]]);}
      o.push(R.clip(pa,"teal",0.9));o.push(R.line(pb,"signal",2));
      o.push(S.LEGL(R.x,R.y+R.h+48,[["teal",null,"信号 + 雑音"],["signal",null,"信号だけ"]],9.5,14));
      box.set(S.svg(Wd,R.y+R.h+58,o));
      /* 読み出し */
      var vn=0,vs=0;for(var j=0;j<NS;j++){vn+=wb[j]*wb[j];vs+=sb[j]*sb[j];}vn/=NS;vs/=NS;
      var h="雑音の密度 N<sub>0</sub> = −174.0 dBm/Hz（290 K）、帯域 B<sub>n</sub> = "+bw.get()+" MHz（+"+_w03_f(10*Math.log10(B),1)+" dB）→ 雑音の電力 N = <b>"+_w03_f(Nd,1)+" dBm</b><br>";
      h+="信号の電力 C = "+_w03_f(Cd,1)+" dBm。帯域に入るのは "+_w03_f(100*fr,1)+" %（"+_w03_f(cb,1)+" dBm）<br>";
      h+="帯域の中の SN 比 C/N = <b>"+_w03_f(cb-Nd,1)+" dB</b>（信号の全部の電力で比べると "+_w03_f(cn.get()-10*Math.log10(B),1)+" dB）。C/N0 = <b>"+_w03_f(cn.get(),1)+" dB-Hz</b> は帯域によらない<br>";
      h+="表示した波形の 8192 標本で測った雑音の電力 "+_w03_f(10*Math.log10(vn*2e6)+_W03_N0,1)+" dBm（式 "+_w03_f(Nd,1)+" dBm）、信号の振幅（搬送波の山）は雑音の標準偏差の "+_w03_f(Math.sqrt(2*q/B),3)+" 倍";
      ro.innerHTML=h+'<div class="wnote">雑音は 290 K の熱雑音（白色雑音）を、信号は PRN 1 の C/A 符号の BPSK を、どちらも同じ理想のフィルタ（帯域の中を全部通し、外を全部止める）に通した。波形は 1 チップ 64 標本で計算し、表示のため搬送波の周波数を 12.276 MHz に下げた（周波数を下げる仕組みは 4 章）。帯域を主ローブ（±1.023 MHz）より狭くすると、信号の電力も一部が切られる。</div>';
    }
    gen();filt();draw();
  };

  /* ---- 4 節: 逆拡散と積分（電力スペクトル密度 ↔ 相関） ---- */
  REG.w03_despread=function(el,U){
    var S=U.S,FS=4.096e6,NB=4096,D0=1638,MMAX=16,PM=U.gnss.pm(1),code=new Float64Array(NB);
    for(var k0=0;k0<NB;k0++)code[k0]=PM[Math.floor(k0*1023/NB)];   /* 1 ms = 4096 標本の手元の符号 */
    U.head(el,"DESPREADING","逆拡散と積分 — 雑音に埋もれた信号が、幅 1/T<sub>coh</sub> の窓で雑音の床の上に出る");
    var r1=U.ctrls(el);
    var cn=U.slider(r1,"C/N0",{min:25,max:50,step:0.5,value:45.5,fmt:function(v){return _w03_f(v,1)+" dB-Hz";},onInput:function(){draw();}});
    var tc=U.slider(r1,"積分の時間 T<sub>coh</sub>",{values:[1,2,4,8,16],value:1,fmt:function(v){return v+" ms（窓の幅 "+(v===1?"1 kHz":_w03_f(1000/v,1)+" Hz")+"）";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var ph=U.slider(r2,"受けた搬送波と手元の搬送波の位相の差",{min:0,max:180,step:5,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（45.5 dB-Hz・1 ms）",function(){cn.set(45.5);tc.set(1);ph.set(30);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    var wI=new Float64Array(NB*MMAX),wQ=new Float64Array(NB*MMAX);
    /* 標準の正規分布の雑音（成分ごと）。C/N0 に合わせて倍率を掛けて使う */
    function gen(){var g=U.rng(seed*104729+7);for(var k=0;k<NB*MMAX;k++){wI[k]=g.normal();wQ[k]=g.normal();}}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],q=Math.pow(10,cn.get()/10),M=tc.get(),N=NB*M,T=M*1e-3,phi=ph.get()*Math.PI/180;
      /* 信号の振幅 1（= √(2C)、C = 1/2）、成分ごとの雑音の分散 σ² = N0 f_s（N0 = C/(C/N0)） */
      var N0s=0.5/q,sg=Math.sqrt(N0s*FS),cph=Math.cos(phi),sph=Math.sin(phi),k;
      var xr=new Float64Array(N),xi=new Float64Array(N),yr=new Float64Array(N),yi=new Float64Array(N),ar=new Float64Array(NB),ai=new Float64Array(NB),nr=new Float64Array(NB),ni=new Float64Array(NB);
      for(k=0;k<N;k++){var c=code[((k-D0)%NB+NB)%NB],a=sg*wI[k],b=sg*wQ[k];xr[k]=c*cph+a;xi[k]=c*sph+b;
        var cl=code[((k-D0)%NB+NB)%NB];yr[k]=xr[k]*cl;yi[k]=xi[k]*cl;ar[k%NB]+=xr[k];ai[k%NB]+=xi[k];nr[k%NB]+=a;ni[k%NB]+=b;}
      /* 電力を dBm（RF の片側の値）に直す: 表示の単位の N0s が −174.0 dBm/Hz にあたる */
      function dbm(pw){return 10*Math.log10(Math.max(pw,1e-30)/N0s)+_W03_N0;}
      /* 逆拡散の前のスペクトル（列ごとに平均） */
      var fr=xr.slice(),fi=xi.slice();U.gnss.fft(fr,fi);
      var ncol=nar?160:300,colw=N/ncol,pre=[];
      for(var cI=0;cI<ncol;cI++){var s=0,cnt=0;for(var b2=Math.floor(cI*colw);b2<Math.floor((cI+1)*colw);b2++){var kk=(b2+N/2)%N;s+=(fr[kk]*fr[kk]+fi[kk]*fi[kk]);cnt++;}
        var f=((cI+0.5)*colw-N/2)*FS/N/1e6;pre.push([f,dbm(s/cnt/(N*FS)/2)]);}
      var P=U.plot(64,30,nar?320:270,150,[-2,2],[-200,-165]);
      o.push(S.T(nar?6:14,16,"(a) 逆拡散の前（シミュレーションの FFT）","start",11,"ink",true));
      o.push(P.axes({xl:"f − f_{L1} [MHz]",yl:"[dBm/Hz]",xt:[-2,-1,0,1,2],yt:[-200,-190,-180,-170],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");},ylOff:44}));
      o.push(P.line(pre,"teal",1.4));
      var th=[];for(var i=0;i<=200;i++){var f2=-2+4*i/200,v=_w03_sinc(f2*1e6*_W03_TC);th.push([f2,cn.get()+_W03_N0+10*Math.log10(_W03_TC*Math.max(v*v,1e-14))]);}
      o.push(P.clip(th,"signal",1.6,"5 3"));
      o.push(S.T(P.X(2)-4,P.Y(_W03_N0)-6,"信号 + 雑音（平均）","end",9,"teal",true,false,null,true));
      o.push(S.T(P.X(0),P.Y(-196),"破線: 信号だけ（式）","middle",9,"signal",true,false,null,true));
      /* 逆拡散の後（DC のまわりの窓） */
      U.gnss.fft(yr,yi);var nb=12,bins=[],nsum=0,ncnt=0;
      for(k=0;k<N;k++){var pk=(yr[k]*yr[k]+yi[k]*yi[k])/(N*N)/2;if(k!==0){nsum+=pk;ncnt++;}}
      for(var d=-nb;d<=nb;d++){var kk2=(d+N)%N,pw2=(yr[kk2]*yr[kk2]+yi[kk2]*yi[kk2])/(N*N)/2;bins.push([d,dbm(pw2)]);}
      var bx=nar?64:410,by=nar?250:30,Q=U.plot(bx,by,nar?320:270,150,[-nb-0.5,nb+0.5],[-170,-115]);
      o.push(S.TX(nar?6:bx-30,by-14,"(b) 逆拡散の後（1 本は幅 1/T_{coh} の窓）","start",11,"ink",true));
      o.push(Q.axes({xl:"f − f_{L1} [kHz]",yl:"窓の電力 [dBm]",xt:[-12,-6,0,6,12],yt:[-170,-160,-150,-140,-130,-120],xfmt:function(v){return U.sig(v/T/1000,3);},yfmt:function(v){return String(v).replace("-","−");},ylOff:44}));
      bins.forEach(function(bq){var x=Q.X(bq[0]),yv=Math.max(bq[1],-170);o.push(S.RECT(x-Q.w/(2*nb+1)*0.38,Q.Y(yv),Q.w/(2*nb+1)*0.76,Q.Y(-170)-Q.Y(yv),1,bq[0]===0?U.soft("signal"):U.soft("teal"),bq[0]===0?"signal":"teal",1));});
      var nmean=dbm(nsum/ncnt),sdc=bins[nb][1];
      o.push(Q.line([[-nb-0.5,nmean],[nb+0.5,nmean]],"teal",1.2,"4 3"));
      o.push(S.T(Q.X(nb+0.5)-4,Q.Y(nmean)-5,"雑音の窓の平均 "+_w03_f(nmean,1),"end",9,"teal",true,false,null,true));
      o.push(S.T(Q.X(0)+10,Q.Y(Math.min(sdc,-116))+12,"信号の窓 "+_w03_f(sdc,1),"start",9,"signal",true,false,null,true));
      /* (c) 相関（M 周期を足してから、全部のずれ） */
      var Ar=ar.slice(),Ai=ai.slice(),Cr=code.slice(),Ci=new Float64Array(NB),Rn=nr.slice(),Rni=ni.slice();
      U.gnss.fft(Ar,Ai);U.gnss.fft(Cr,Ci);U.gnss.fft(Rn,Rni);
      for(k=0;k<NB;k++){var r_=Ar[k]*Cr[k]+Ai[k]*Ci[k],i_=Ai[k]*Cr[k]-Ar[k]*Ci[k];Ar[k]=r_;Ai[k]=i_;var r2_=Rn[k]*Cr[k]+Rni[k]*Ci[k],i2_=Rni[k]*Cr[k]-Rn[k]*Ci[k];Rn[k]=r2_;Rni[k]=i2_;}
      _w03_ifft(U,Ar,Ai);_w03_ifft(U,Rn,Rni);
      var pn=0,pwr=new Float64Array(NB);for(k=0;k<NB;k++){Ar[k]/=N;Ai[k]/=N;Rn[k]/=N;Rni[k]/=N;pwr[k]=Ar[k]*Ar[k]+Ai[k]*Ai[k];pn+=Rn[k]*Rn[k]+Rni[k]*Rni[k];}pn/=NB;
      var pexp=2*N0s/T,top=Math.max(12,1.12/pexp),cy=nar?490:250,R=U.plot(64,cy,nar?320:420,120,[0,1023],[0,top]);
      o.push(S.T(nar?6:14,cy-14,"(c) 全部のずれの相関の電力（雑音の平均の電力 = 1）","start",11,"ink",true));
      o.push(R.axes({xt:[0,256,512,768,1023],yt:U.nice(0,top,4).filter(function(v){return v<=top;}),xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},xl:"手元の符号のずれ [チップ]",ylOff:44}));
      var dpath="";for(var px=0;px<Math.round(R.w);px++){var j0=Math.floor(px/R.w*NB),j1=Math.max(j0+1,Math.floor((px+1)/R.w*NB)),mx=0;for(var j=j0;j<j1;j++)mx=Math.max(mx,pwr[j]/pexp);dpath+="M"+(R.x+px+0.5).toFixed(1)+","+R.Y(0).toFixed(1)+"V"+R.Y(Math.min(mx,top)).toFixed(1);}
      o.push(S.PATH(dpath,"teal",1));
      var pkv=pwr[D0]/pexp;o.push(S.D(R.X(D0*1023/NB),R.Y(Math.min(pkv,top)),"signal",4.5));
      o.push(S.T(R.X(D0*1023/NB)+8,R.Y(Math.min(pkv,top))+4,"山 "+_w03_f(10*Math.log10(pkv),1)+" dB","start",9.5,"signal",true,false,null,true));
      /* (d) Y_I と Y_Q */
      if(!nar){var I=U.plot(560,cy,120,120,[-1.6,1.6],[-1.6,1.6]);
        o.push(S.TX(530,cy-14,"(d) 山の Y_I・Y_Q","start",11,"ink",true));
        o.push(I.axes({xt:[-1,0,1],yt:[-1,0,1],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");},xl:"Y_I",yl:"Y_Q",ylOff:22}));
        var ci=[];for(i=0;i<=72;i++){var a2=2*Math.PI*i/72;ci.push([Math.cos(a2),Math.sin(a2)]);}o.push(I.line(ci,"faint",1,"3 3"));
        var rad=Math.sqrt(N0s/T),cc=[];for(i=0;i<=72;i++){var a3=2*Math.PI*i/72;cc.push([cph+rad*Math.cos(a3),sph+rad*Math.sin(a3)]);}o.push(I.clip(cc,"teal",1.2));
        o.push(S.L(I.X(0),I.Y(0),I.X(cph),I.Y(sph),"ink",1.4));o.push(S.D(I.X(Ar[D0]),I.Y(Ai[D0]),"signal",4.2));}
      box.set(S.svg(Wd,cy+R.h+46,o));
      /* 読み出し */
      var snr=cn.get()+10*Math.log10(T),h="";
      h+="式: SNR = C/N0 + 10 log<sub>10</sub>(T<sub>coh</sub>) = "+_w03_f(cn.get(),1)+" "+(T>=1e-3?"− "+_w03_f(-10*Math.log10(T),1):"")+" = <b>"+_w03_f(snr,1)+" dB</b>（Y<sub>I</sub> だけで見ると "+_w03_f(snr+3.01,1)+" dB）<br>";
      h+="シミュレーション: 逆拡散の後の、信号の窓の電力 "+_w03_f(sdc,1)+" dBm（雑音を含む 1 回の値）、雑音の窓の平均 "+_w03_f(nmean,1)+" dBm → 差 <b>"+_w03_f(sdc-nmean,1)+" dB</b><br>";
      h+="相関: 山の (Y<sub>I</sub>, Y<sub>Q</sub>) = ("+_w03_f(Ar[D0],2)+", "+_w03_f(Ai[D0],2)+")。雑音だけを相関した電力の平均で信号の電力 1 を割ると <b>"+_w03_f(-10*Math.log10(pn),1)+" dB</b>（位相の差を変えても変わらない）<br>";
      h+="処理利得 R<sub>c</sub>T<sub>coh</sub> = "+_w03_f(1023*M,0)+"（"+_w03_f(10*Math.log10(1023*M),1)+" dB）。逆拡散の前は、信号の密度の山 "+_w03_f(cn.get()+_W03_N0+10*Math.log10(_W03_TC),1)+" dBm/Hz が、雑音の床 −174.0 dBm/Hz の "+_w03_f(-(cn.get()+10*Math.log10(_W03_TC)),1)+" dB 下";
      ro.innerHTML=h+'<div class="wnote">受けた信号は、PRN 1 の C/A 符号（1 ms = 4096 標本、標本の周波数 4.096 MHz）に、2 つの成分の白色雑音を足した値（搬送波は取り除いた後の形で、位相の差だけを残した）。窓の電力は、FFT の 1 本（幅 1/T<sub>coh</sub>）に入る電力を、雑音の密度 −174.0 dBm/Hz を基準に dBm に直した。(c) は、T<sub>coh</sub> の間の受けた信号を 1 ms ごとに重ねて足し、4096 通りのずれで相関をとった。周波数のずれとデータのビットの反転は 0 とした。</div>';
    }
    gen();draw();
  };

  /* ---- 5 節: 回線計算（衛星の位置 ↔ 信号と雑音のレベル） ---- */
  REG.w03_budget=function(el,U){
    var S=U.S;
    U.head(el,"LINK BUDGET","回線計算 — 衛星の電力から C/N0 まで");
    var r1=U.ctrls(el);
    var ei=U.slider(r1,"衛星の EIRP",{min:20,max:32,step:0.1,value:_W03_EIRP,fmt:function(v){return _w03_f(v,1)+" dBW（"+U.sig(Math.pow(10,v/10),3)+" W）";},onInput:draw});
    var ev=U.slider(r1,"衛星の仰角 θ",{min:5,max:90,step:1,value:5,fmt:function(v){return v+"°（距離 "+_w03_g(_w03_range(v)/1e3)+" km）";},onInput:draw});
    var r2=U.ctrls(el);
    var an=U.select(r2,"受信アンテナ",["0 dBi（向きによらない）","例のアンテナ（真上 +3、5° で −5 dBi）"],0,draw);
    var ls=U.slider(r2,"そのほかの損失（遮へいなど）",{min:0,max:30,step:0.5,value:0,fmt:function(v){return _w03_f(v,1)+" dB";},onInput:draw});
    var r3=U.ctrls(el);
    var ta=U.slider(r3,"アンテナの雑音温度 T<sub>ant</sub>",{min:20,max:400,step:5,value:100,fmt:function(v){return v+" K";},onInput:draw});
    var nf=U.slider(r3,"LNA の雑音指数 NF",{min:0,max:5,step:0.1,value:1,fmt:function(v){return _w03_f(v,1)+" dB（Tₑ = "+_w03_f((Math.pow(10,v/10)-1)*_W03_T0,1)+" K）";},onInput:draw});
    var r4=U.ctrls(el);
    var only=U.checkbox(r4,"雑音を 290 K の熱雑音だけにする（2・3 節の計算）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（仰角 5°・0 dBi・100 K・NF 1 dB）",function(){ei.set(_W03_EIRP);ev.set(5);an.set(0);ls.set(0);ta.set(100);nf.set(1);only.set(false);draw();});
    U.button(br,"2・3 節の計算（290 K だけ）",function(){ei.set(_W03_EIRP);ev.set(5);an.set(0);ls.set(0);only.set(true);draw();});
    U.button(br,"真上の衛星",function(){ev.set(90);draw();});
    var box=U.svgbox(el),ro=U.readout(el),G={};
    U.ctl.drag(box,function(type,x,y){if(type==="up"||!G.cx)return;var g=Math.atan2(Math.abs(x-G.cx),G.cy-y);
      /* 中心角 g の衛星の仰角 */var sx=_W03_A*Math.sin(g),sy=_W03_A*Math.cos(g)-_W03_RE,e=Math.atan2(sy,sx)*180/Math.PI;if(type==="down"&&Math.hypot(x-G.sx,y-G.sy)>26)return false;
      ev.set(Math.max(5,Math.min(90,Math.round(e))));draw();});
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],el0=ev.get(),r=_w03_range(el0),L=_w03_lfs(r),ga=an.get()?_w03_ga(el0):0;
      var eirpm=ei.get()+30,c1=eirpm-L,c2=c1-0.5,c3=c2-ls.get(),C=c3+ga;
      var Te=(Math.pow(10,nf.get()/10)-1)*_W03_T0,Ts=only.get()?_W03_T0:ta.get()+Te,N0=10*Math.log10(_W03_KB*Ts)+30,cn0=C-N0;
      /* (a) 衛星と受信機（大きさの比は実際のとおり） */
      var sc=(nar?92:104)/_W03_A,cx=nar?110:130,cy=nar?150:160;G.cx=cx;G.cy=cy;
      o.push(S.T(nar?6:14,16,"(a) 衛星の位置（ドラッグで仰角を変える）","start",11,"ink",true));
      o.push(S.CIRC(cx,cy,_W03_A*sc,"signal",1.1,null,"5 4"));o.push(S.CIRC(cx,cy,_W03_RE*sc,"green",1.4,U.soft("green")));
      var t=el0*Math.PI/180,rxx=cx,rxy=cy-_W03_RE*sc,sx2=rxx+r*sc*Math.cos(t),sy2=rxy-r*sc*Math.sin(t);G.sx=sx2;G.sy=sy2;
      o.push(S.L(rxx,rxy,sx2,sy2,"gold",1.8));
      o.push(S.L(sx2-9,sy2,sx2+9,sy2,"signal",1.1)+S.RECT(sx2-14,sy2-3.2,6.5,6.4,1,U.soft("signal"),"signal",1)+S.RECT(sx2+7.5,sy2-3.2,6.5,6.4,1,U.soft("signal"),"signal",1)+S.RECT(sx2-3.6,sy2-3.6,7.2,7.2,1.5,"signal","signal",1));
      o.push(S.CIRC(sx2,sy2,16,"signal",1,null,"2 3"));
      o.push(S.D(rxx,rxy-2,"green",3.6));
      o.push(S.T((rxx+sx2)/2,(rxy+sy2)/2+(el0<45?16:-6),_w03_g(r/1e3)+" km",el0<45?"middle":"start",9.5,"gold",true,false,null,true));
      o.push(S.T(cx,cy+(nar?118:130),"仰角 "+el0+"°・自由空間損失 "+_w03_f(L,1)+" dB","middle",9.5,"ink",true));
      /* (b) 信号の電力と雑音の密度（数値の差が C/N0） */
      var bx=nar?64:300,by=nar?320:40,P=U.plot(bx+40,by,nar?130:120,230,[0,1],[-185,-110]);
      o.push(S.TX(nar?6:bx-6,by-24,"(b) 信号の電力 C と雑音の密度 N_0","start",11,"ink",true));
      o.push(P.axes({xt:[],yt:[-180,-170,-160,-150,-140,-130,-120,-110],yfmt:function(v){return String(v).replace("-","−");},yl:"dBm（C）・dBm/Hz（N_0）",ylOff:44}));
      function lvl(v,c,lab,lw,left){var vv=Math.max(-185,Math.min(-110,v));o.push(S.L(P.X(0.1),P.Y(vv),P.X(0.9),P.Y(vv),c,lw||2.6));if(left){if(lab)o.push(S.T(P.X(0.12),P.Y(vv)+13,lab,"start",9,c,false,false,null,true));}else o.push(S.TX(P.X(0.92),P.Y(vv)+4,lab,"start",9.5,c,true,true));}
      lvl(C,"signal","C = "+_w03_f(C,1));lvl(N0,"teal","N_0 = "+_w03_f(N0,1));
      if(!only.get()){lvl(_W03_N0,"muted","",1.2,true);o.push(S.T(P.x,P.y+P.h+18,"灰色の線: 290 K の熱雑音だけなら −174.0","start",9,"muted"));}
      var ya=P.Y(Math.max(-185,Math.min(-110,C))),yb=P.Y(Math.max(-185,Math.min(-110,N0)));
      o.push(S.DARR(P.X(0.5),ya+3,P.X(0.5),yb-3,"ink",1.4));o.push(S.T(P.X(0.5)-6,(ya+yb)/2+4,"C/N0 "+_w03_f(cn0,1),"end",10,"ink",true,false,null,true));
      /* (c) システム雑音温度の内訳 */
      if(!nar){var tx=590,ty=60,tw2=110,tmax=Math.max(400,Ts*1.05),TX=function(v){return ty+170-v/tmax*170;};
        o.push(S.T(tx-40,by-24,"(c) 雑音温度","start",11,"ink",true));
        o.push(S.L(tx,ty,tx,ty+170,"muted",1.2));[0,100,200,300,400].filter(function(v){return v<=tmax;}).forEach(function(v){o.push(S.L(tx-4,TX(v),tx,TX(v),"muted",1));o.push(S.T(tx-7,TX(v)+3.5,String(v),"end",9,"muted"));});
        o.push(S.T(tx-34,ty+85,"[K]","middle",9.5,"muted"));
        if(only.get()){o.push(S.RECT(tx+14,TX(_W03_T0),40,TX(0)-TX(_W03_T0),2,U.soft("teal"),"teal",1.2));o.push(S.T(tx+60,TX(_W03_T0/2)+4,"290 K","start",9.5,"teal",true));}
        else{o.push(S.RECT(tx+14,TX(ta.get()),40,TX(0)-TX(ta.get()),2,U.soft("teal"),"teal",1.2));o.push(S.RECT(tx+14,TX(Ts),40,TX(ta.get())-TX(Ts),2,U.soft("alias"),"alias",1.2));
          o.push(S.TX(tx+60,TX(ta.get()/2)+4,"T_{ant} "+ta.get(),"start",9,"teal",true));o.push(S.TX(tx+60,TX(ta.get()+Te/2)+4,"T_e "+_w03_f(Te,0),"start",9,"alias",true));}
        o.push(S.TX(tx+34,TX(Ts)-6,"T_{sys} "+_w03_f(Ts,1),"middle",9.5,"ink",true,true));}
      box.set(S.svg(Wd,nar?by+290:320,o));
      /* 読み出し（回線計算の表） */
      var rows=[["衛星の EIRP",_w03_f(ei.get(),1)+" dBW",_w03_f(eirpm,1)+" dBm"],
        ["自由空間損失（距離 "+_w03_g(r/1e3)+" km）","−"+_w03_f(L,1)+" dB",_w03_f(c1,1)+" dBm"],
        ["大気による損失（例の値）","−0.5 dB",_w03_f(c2,1)+" dBm"],
        ["そのほかの損失",(ls.get()>0?"−":"")+_w03_f(ls.get(),1)+" dB",_w03_f(c3,1)+" dBm"],
        ["受信アンテナの利得",(ga>=0?"+":"")+_w03_f(ga,1)+" dBi","<b>C = "+_w03_f(C,1)+" dBm</b>"],
        ["システム雑音温度",only.get()?"290 K（熱雑音だけ）":ta.get()+" + "+_w03_f(Te,1)+" = "+_w03_f(Ts,1)+" K","<b>N<sub>0</sub> = "+_w03_f(N0,1)+" dBm/Hz</b>"],
        ["C/N0","C − N<sub>0</sub>","<b>"+_w03_f(cn0,1)+" dB-Hz</b>"],
        ["積分の後の SNR（1 ms・20 ms）","C/N0 − 30.0・− 17.0",_w03_f(cn0-30,1)+" dB・"+_w03_f(cn0-16.99,1)+" dB"]];
      ro.innerHTML=(nar?U.tbl(["項目","値 → 累計"],rows.map(function(r){return [r[0],r[1]+"<br>→ "+r[2]];}),["wrap","right"]).split('class="wrap" style="text-align:left"').join('class="wrap" style="text-align:left;min-width:5em"'):U.tbl(["項目","値","累計"],rows,["left","right","right"]))+'<div class="wnote">地球の半径 6 371 km、軌道の半径 26 560 km の円で距離を計算した。EIRP の初めの値 26.4 dBW は、規格の受信電力の最小値（−128.5 dBm）を、仰角 5°・0 dBi・大気 0.5 dB として逆算した例の値で、衛星は向きによらず同じ EIRP で出すとした。例のアンテナの利得とアンテナの雑音温度は例の値（代表値）。LNA は 1 段だけで、後の段の雑音は 9 章で扱う。</div>';
    }
    draw();
  };

  /* ---- 6 節: C/N0 で決まるもの（捕捉・データ・距離） ---- */
  REG.w03_cn0=function(el,U){
    var S=U.S,PM=U.gnss.pm(1),D0=300,PM2=new Float64Array(2046);for(var i0=0;i0<2046;i0++)PM2[i0]=PM[i0%1023];
    U.head(el,"WHAT C/N0 DECIDES","C/N0 で決まるもの — 捕捉・データ・距離の雑音");
    var r1=U.ctrls(el);
    var cn=U.slider(r1,"C/N0",{min:15,max:50,step:0.5,value:45,fmt:function(v){return _w03_f(v,1)+" dB-Hz";},onInput:function(){keep=null;run();}});
    var ta=U.select(r1,"捕捉の積分の時間",["1 ms","10 ms","20 ms"],0,function(){tries=null;run();});
    var br=U.btnrow(el),seed=1,keep=null,tries=null;
    U.button(br,"本文の例（45 dB-Hz・1 ms）",function(){cn.set(45);ta.set(0);keep=null;tries=null;run();});
    U.button(br,"10 dB 下げる",function(){keep={cn:cn.get(),e:ER.slice()};cn.set(Math.max(15,cn.get()-10));tries=null;run(true);});
    U.button(br,"10 dB 上げる",function(){keep={cn:cn.get(),e:ER.slice()};cn.set(Math.min(50,cn.get()+10));tries=null;run(true);});
    U.button(br,"捕捉を 100 回試す",function(){var ok=0;for(var t=0;t<100;t++){seed++;if(acq().im===D0)ok++;}tries={ok:ok,cn:cn.get(),M:mt()};run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;keep=null;run();});
    var box=U.svgbox(el),ro=U.readout(el),A=null,BITS=null,ER=[];
    function mt(){return [1,10,20][ta.get()];}
    /* 捕捉: チップ単位の 2 つの成分（振幅 1）を M 周期足し、1023 通りのずれで相関の電力 */
    function acq(){var q=Math.pow(10,cn.get()/10),M=mt(),sw=Math.sqrt(_W03_RC/(2*q))/Math.sqrt(M),g=U.rng(seed*7907+11),xr=new Float64Array(1023),xi=new Float64Array(1023),k,d;
      for(k=0;k<1023;k++){var c=PM[(k-D0+1023)%1023];xr[k]=c*Math.cos(0.9)+sw*g.normal();xi[k]=c*Math.sin(0.9)+sw*g.normal();}
      var P=new Float64Array(1023),pn=2*sw*sw/1023,im=0;
      for(d=0;d<1023;d++){var sr=0,si=0,o2=1023-d;for(k=0;k<1023;k++){var cc=PM2[k+o2];sr+=xr[k]*cc;si+=xi[k]*cc;}sr/=1023;si/=1023;P[d]=(sr*sr+si*si)/pn;if(P[d]>P[im])im=d;}
      return {P:P,im:im};}
    /* データ: 1 bit（20 ms）の Y_I の雑音を、4 節の分散 N0/T_b の正規分布から作る（信号の部分 ±1） */
    function bits(){var q=Math.pow(10,cn.get()/10),sb=1/Math.sqrt(2*q*0.02),g=U.rng(seed*6151+5),out=[];
      for(var i=0;i<300;i++){var b=g.next()<0.5?1:-1,y=b+sb*g.normal();out.push({b:b,e:(y>=0?1:-1)!==b});}return out;}
    /* 距離: 20 ms ごとの早い所・遅い所の雑音（分散 N0/T）から頂点のずれを求め、50 回（1 s）平均を 60 s 分 */
    function rng(){var q=Math.pow(10,cn.get()/10),sw=1/Math.sqrt(2*q*0.02),g=U.rng(seed*3571+9),cm=_W03_C*_W03_TC,out=[];
      for(var s=0;s<60;s++){var m=0;for(var j=0;j<50;j++){var w1=sw*g.normal(),w2=sw*g.normal();m+=-(w1-w2)/2;}out.push(m/50*cm);}return out;}
    function run(){A=acq();BITS=bits();ER=rng();draw();}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],q=Math.pow(10,cn.get()/10),M=mt(),snr=cn.get()+10*Math.log10(M*1e-3),k;
      /* (a) 捕捉 */
      var top=Math.max(14,1.12*A.P[A.im]),P=U.plot(64,30,nar?320:600,90,[0,1023],[0,top]);
      o.push(S.T(nar?6:14,16,"(a) 捕捉: "+M+" ms の積分の相関の電力（雑音の平均 = 1）","start",11,"ink",true));
      o.push(P.axes({xt:[0,256,512,768,1023],yt:U.nice(0,top,3).filter(function(v){return v<=top;}),xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},ylOff:40}));
      var dp="";for(var px=0;px<Math.round(P.w);px++){var j0=Math.floor(px/P.w*1023),j1=Math.max(j0+1,Math.floor((px+1)/P.w*1023)),mx=0;for(var j=j0;j<j1;j++)mx=Math.max(mx,A.P[j]);dp+="M"+(P.x+px+0.5).toFixed(1)+","+P.Y(0).toFixed(1)+"V"+P.Y(mx).toFixed(1);}
      o.push(S.PATH(dp,"teal",1));o.push(S.L(P.X(D0),P.y,P.X(D0),P.y+P.h,"signal",1,"3 3"));
      var ok=A.im===D0;o.push(S.D(P.X(A.im),P.Y(A.P[A.im]),ok?"green":"alias",4.6));
      o.push(S.T(nar?P.x:P.x+P.w,nar?P.y+P.h+30:P.y-4,ok?"最大 = 本当のずれ（見つかる）":"最大が別のずれ "+A.im+" チップ（見誤る）",nar?"start":"end",10,ok?"green":"alias",true));
      /* (b) データ */
      var dy=nar?186:160,cw=nar?10:16,chh=nar?11:12,x0=nar?64:70,ne=0;
      o.push(S.T(nar?6:14,dy-6,"(b) データ: 1 つのサブフレーム（10 ワード × 30 bit）の読み誤り","start",11,"ink",true));
      for(var w=0;w<10;w++)for(var b=0;b<30;b++){var B=BITS[w*30+b];if(B.e)ne++;o.push(S.RECT(x0+b*cw,dy+4+w*chh,cw-1.5,chh-1.5,1,B.e?U.soft("alias"):U.soft("green"),B.e?"alias":"green",B.e?1.4:0.5));}
      var ex=x0+30*cw+12,pb=_w03_Q(Math.sqrt(2*q*0.02)),pok=Math.pow(1-pb,300);
      if(!nar){o.push(S.T(ex,dy+20,"読み誤り "+ne+" bit / 300 bit","start",10.5,ne?"alias":"green",true));
        o.push(S.TX(ex,dy+38,"P_b = Q(√(2E_b/N_0))","start",9.5,"ink"));o.push(S.T(ex,dy+53,"= "+_w03_sci(pb,1),"start",9.5,"ink"));
        o.push(S.T(ex,dy+70,"全部正しい確率 "+_w03_f(pok,3),"start",9.5,"ink"));
        if(cn.get()<25)o.push(S.T(ex,dy+92,"25 dB-Hz より下では、搬送波の","start",9,"alias",true));
        if(cn.get()<25)o.push(S.T(ex,dy+105,"位相を合わせ続けにくい（代表値）","start",9,"alias",true));}
      /* (c) 距離 */
      var ry=nar?336:300,cm=_W03_C*_W03_TC,sig1=cm/(2*Math.sqrt(q*1.0)),ymax=30,R=U.plot(64,ry,nar?320:600,110,[0,60],[-ymax,ymax]);
      o.push(S.T(nar?6:14,ry-12,"(c) 距離: 1 s ごとの擬似距離の雑音（60 s）","start",11,"ink",true));
      o.push(R.axes({xt:[0,10,20,30,40,50,60],yt:[-30,-15,0,15,30],xfmt:function(v){return String(v);},yfmt:function(v){return String(v).replace("-","−");},xl:"時間 [s]",yl:"[m]",ylOff:30}));
      if(sig1<ymax){o.push(R.line([[0,sig1],[60,sig1]],"signal",1,"4 3"));o.push(R.line([[0,-sig1],[60,-sig1]],"signal",1,"4 3"));}
      if(keep)keep.e.forEach(function(v,i){if(Math.abs(v)<=ymax)o.push(S.D(R.X(i+0.5),R.Y(v),"faint",2.6));});
      ER.forEach(function(v,i){var vv=Math.max(-ymax,Math.min(ymax,v));o.push(S.D(R.X(i+0.5),R.Y(vv),Math.abs(v)>ymax?"alias":"signal",2.8));});
      if(cn.get()<20)o.push(S.T(R.x+R.w/2,R.y+16,"20 dB-Hz より下では、符号の追尾を続けにくい（代表値）","middle",9.5,"alias",true,false,null,true));
      if(keep)o.push(S.LEGL(R.x,R.y+R.h+46,[["signal",null,"いまの C/N0 "+_w03_f(cn.get(),1)],["faint",null,"前の C/N0 "+_w03_f(keep.cn,1)]],9.5,14));
      box.set(S.svg(Wd,R.y+R.h+(keep?56:42),o));
      /* 読み出し */
      var ms=0;ER.forEach(function(v){ms+=v*v;});var sdm=Math.sqrt(ms/ER.length),h="";
      h+="捕捉: SNR = C/N0 + 10 log<sub>10</sub>(T<sub>coh</sub>) = <b>"+_w03_f(snr,1)+" dB</b>"+(ok?'（<span class="ok">見つかる</span>）':'（<span class="warn">見誤る</span>）')+"。最大が本当のずれに来る割合は、SNR 8.4 dB で 50 %、11.1 dB で 90 %（本文のシミュレーション）";
      if(tries)h+="<br>100 回試した結果（"+_w03_f(tries.cn,1)+" dB-Hz・"+tries.M+" ms）: <b>"+tries.ok+" 回</b>見つかった";
      h+="<br>データ: E<sub>b</sub>/N<sub>0</sub> = C/N0 − 17.0 = "+_w03_f(cn.get()-16.99,1)+" dB、ビット誤り率 P<sub>b</sub> = <b>"+_w03_sci(pb,1)+"</b>、このサブフレームの読み誤り "+ne+" bit、300 bit を全部正しく読む確率 "+_w03_f(pok,3);
      h+="<br>距離: σ<sub>ρ</sub> = cT<sub>c</sub>/(2√((C/N0) × 1 s)) = <b>"+_w03_f(sig1,2)+" m</b>（式）、60 s の値の 2 乗平均の平方根 "+_w03_f(sdm,2)+" m（シミュレーション）"+(keep?"。前の C/N0 "+_w03_f(keep.cn,1)+" dB-Hz の式の値 "+_w03_f(cm/(2*Math.sqrt(Math.pow(10,keep.cn/10))),2)+" m の "+_w03_f(sig1/(cm/(2*Math.sqrt(Math.pow(10,keep.cn/10)))),2)+" 倍":"");
      ro.innerHTML=h+'<div class="wnote">捕捉は、PRN 1 の符号（本当のずれ 300 チップ）に 2 つの成分の雑音を足して相関をとるシミュレーション（周波数のずれ 0、1 チップごとのずれ）。データと距離は、搬送波の位相が合っているとして、4 節で導いて確かめた雑音の分布（平均 0・分散 N<sub>0</sub>/T<sub>coh</sub> の正規分布）から乱数で作った。距離は、20 ms ごとに早い所・遅い所（±0.5 チップ）の相関から 2 章の式で頂点を求め、50 回（1 s）平均した。追尾の仕組み（5 章）は含めていない。しきい値の注意は代表値による。</div>';
    }
    run();
  };
