  /* ===== 05 章 捕捉と追尾 — 信号を見つけて追いかける ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w05_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w05_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 5 桁以上は 3 桁ごとに空白を入れた数（42 966 など。4 桁の 1630 はそのまま） */
  function _w05_g(v,d){var s=_w05_f(v,d||0),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].length>4?p[0].replace(/\B(?=(\d{3})+(?!\d))/g," "):p[0];return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  /* 1.5 × 10⁶ の形（1000 未満はそのまま） */
  function _w05_sci(v,d){if(v===0)return "0";var e=Math.floor(Math.log10(Math.abs(v))),m=v/Math.pow(10,e);if(+Math.abs(m).toFixed(d)>=10){m/=10;e++;}
    if(e>=0&&e<3)return _w05_g(v,0);var sup="⁰¹²³⁴⁵⁶⁷⁸⁹",es=String(Math.abs(e)).split("").map(function(c){return sup.charAt(+c);}).join("");return _w05_f(m,d)+" × 10"+(e<0?"⁻":"")+es;}
  /* 時間の文字（ms・s・分・時間） */
  function _w05_t(s){if(!isFinite(s))return "∞";if(s<0.01)return _w05_f(s*1e3,1)+" ms";if(s<1)return _w05_f(s,2)+" s";if(s<100)return _w05_f(s,1)+" s";if(s<3600)return _w05_f(s/60,1)+" 分";return _w05_f(s/3600,1)+" 時間";}
  function _w05_lam(x){x=Math.abs(x);return x<1?1-x:0;}
  function _w05_sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
  var _W05_FS=2.048e6,_W05_J=2048,_W05_RC=1.023e6,_W05_CTC=299792458/1.023e6,_W05_LAM=299792458/1575.42e6;
  /* 時間の列 v[k]（時刻 k·dt）を、画面の 1 px の列ごとに最初・最小・最大・最後の 4 点を通る折れ線にする（雑音で揺れる長い列を軽く描く）。値は表示の範囲に収める */
  function _w05_band(U,P,v,dt,n,c,lw){var pts=[],col=null,a=0,mn=0,mx=0,z=0,lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]);
    function flush(){if(col===null)return;var x=col+0.5;pts.push([x,P.Y(a)],[x,P.Y(mn)],[x,P.Y(mx)],[x,P.Y(z)]);}
    for(var k=0;k<n;k++){var y=Math.max(lo,Math.min(hi,v[k])),x=Math.floor(P.X(k*dt));if(x!==col){flush();col=x;a=mn=mx=z=y;}else{if(y<mn)mn=y;if(y>mx)mx=y;z=y;}}
    flush();return pts.length>1?U.S.PL(pts,c,lw||1.2):"";}

  /* ---- 2 節: FFT による捕捉（格子の立体の図 ↔ 山の断面） ---- */
  /* 受けた信号に入れる衛星（例の値）: PRN、符号の位相 [チップ]、ドップラー [Hz]、搬送波の位相 [rad] */
  var _W05_SATS=[[1,120.25,1630,0.7],[2,731.6,-2380,2.1]],_W05_SIG=null,_W05_NZ={},_W05_AF={};
  /* 衛星の信号の部分（10 ms 分の複素数の標本。各衛星の振幅 1） */
  function _w05_sig(U){if(_W05_SIG)return _W05_SIG;var n=_W05_J*10,re=new Float64Array(n),im=new Float64Array(n);
    _W05_SATS.forEach(function(s){var pm=U.gnss.pm(s[0]);for(var i=0;i<n;i++){var k=Math.floor(i*_W05_RC/_W05_FS-s[1]);k=((k%1023)+1023)%1023;var ph=2*Math.PI*s[2]*i/_W05_FS+s[3];re[i]+=pm[k]*Math.cos(ph);im[i]+=pm[k]*Math.sin(ph);}});
    return (_W05_SIG={re:re,im:im});}
  /* 雑音（実部・虚部とも標準正規分布。種ごとに作り、C/N0 は掛ける数で変える） */
  function _w05_noise(U,seed){if(_W05_NZ[seed])return _W05_NZ[seed];var n=_W05_J*10,re=new Float64Array(n),im=new Float64Array(n),g=U.rng(seed*7919+3);
    for(var i=0;i<n;i++){re[i]=g.normal();im[i]=g.normal();}var ks=Object.keys(_W05_NZ);if(ks.length>3)delete _W05_NZ[ks[0]];return (_W05_NZ[seed]={re:re,im:im});}
  /* 局部の符号（遅れ 0）の FFT */
  function _w05_cfft(U,prn){if(_W05_AF[prn])return _W05_AF[prn];var J=_W05_J,re=new Float64Array(J),im=new Float64Array(J),pm=U.gnss.pm(prn);
    for(var i=0;i<J;i++)re[i]=pm[Math.floor(i*_W05_RC/_W05_FS)%1023];U.gnss.fft(re,im);return (_W05_AF[prn]={re:re,im:im});}
  /* FFT による捕捉: ドップラーのビンごとに、M 個の 1 ms の Y[m]A*[m] を足して逆 FFT。p = |R[k]|² ÷ 雑音だけのときの平均 */
  function _w05_acq(U,prn,cn0,M,bins,seed){var J=_W05_J,S=_w05_sig(U),N=_w05_noise(U,seed),c=Math.pow(10,cn0/10),sd=Math.sqrt(_W05_FS/c/2),A=_w05_cfft(U,prn);
    var out=new Float32Array(bins.length*J),re=new Float64Array(J),im=new Float64Array(J),ar=new Float64Array(J),ai=new Float64Array(J),nm=J*M*_W05_FS/c,i;
    for(var b=0;b<bins.length;b++){ar.fill(0);ai.fill(0);var w=-2*Math.PI*bins[b]/_W05_FS;
      for(var k=0;k<M;k++){for(i=0;i<J;i++){var m=k*J+i,yr=S.re[m]+sd*N.re[m],yi=S.im[m]+sd*N.im[m],cs=Math.cos(w*m),sn=Math.sin(w*m);re[i]=yr*cs-yi*sn;im[i]=yr*sn+yi*cs;}
        U.gnss.fft(re,im);for(i=0;i<J;i++){ar[i]+=re[i]*A.re[i]+im[i]*A.im[i];ai[i]+=im[i]*A.re[i]-re[i]*A.im[i];}}
      /* 逆 FFT は conj(FFT(conj(x)))/J。大きさの 2 乗だけが要るので、共役の FFT の大きさを J で割る */
      for(i=0;i<J;i++){re[i]=ar[i];im[i]=-ai[i];}U.gnss.fft(re,im);
      for(i=0;i<J;i++)out[b*J+i]=(re[i]*re[i]+im[i]*im[i])/(J*J)/nm;}
    return out;}
  REG.w05_search=function(el,U){
    var S=U.S,J=_W05_J,FOPS=(J/2)*11+J*11;
    U.head(el,"ACQUISITION","捕捉 — 符号の位相とドップラーの格子を探す");
    var r1=U.ctrls(el);
    var prn=U.select(r1,"探す衛星",["PRN 1（信号にある）","PRN 2（信号にある）","PRN 3（信号に無い）"],0,reset);
    var mth=U.select(r1,"計算の順番",["FFT（ドップラーごとに 1 列ずつ）","直列（ビンを 1 つずつ）"],0,reset);
    var r2=U.ctrls(el);
    var cn=U.slider(r2,"C/N0（PRN 1・2 とも）",{min:30,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:reset});
    var tc=U.slider(r2,"積分の時間 T<sub>coh</sub>",{values:[1,2,5,10],value:1,fmt:function(v){return v+" ms";},onInput:reset});
    var r3=U.ctrls(el);
    var stp=U.select(r3,"ドップラーの刻み（T は積分の時間）",["1/(2T)","2/(3T)","1/T"],0,reset);
    var pfa=U.select(r3,"格子全体の誤警報確率",["0.1","0.01","0.001"],1,reset);
    var br=U.btnrow(el),seed=1;
    U.button(br,"探す",function(){start(false);});
    U.button(br,"止める",function(){tk.stop();draw();});
    U.button(br,"全部を一度に",function(){start(true);});
    U.button(br,"本文の例（PRN 1・45 dB-Hz・1 ms）",function(){prn.set(0);mth.set(0);cn.set(45);tc.set(1);stp.set(0);pfa.set(1);start(true);});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;var was=st.rev>0;tk.stop();st.rev=0;if(was)start(true);else draw();});
    var box=U.svgbox(el),ro=U.readout(el),st={P:null,key:"",rev:0,first:-1},tk=U.ticker(step,50);
    function cfg(){var T=tc.get(),fs=[0.5,2/3,1][stp.get()]/(T*1e-3),n=Math.ceil(5000/fs-1e-9),bins=[],i;for(i=-n;i<=n;i++)bins.push(i*fs);
      var nb=bins.length,ord=[n],rk=new Int32Array(nb);for(i=1;i<=n;i++){ord.push(n+i);ord.push(n-i);}ord.forEach(function(b,r){rk[b]=r;});
      var P=[0.1,0.01,0.001][pfa.get()];
      return {prn:prn.get()+1,T:T,fstep:fs,bins:bins,nb:nb,ord:ord,rk:rk,cells:nb*J,pfa:P,thr:Math.log(nb*J/P),ser:mth.get()===1,cn0:cn.get()};}
    function compute(c){var key=[c.prn,c.cn0,c.T,c.fstep,seed].join("|");if(st.key!==key){st.P=_w05_acq(U,c.prn,c.cn0,c.T,c.bins,seed);st.key=key;}
      /* 探す順（ドップラーは 0 Hz から外へ、その中で符号の位相を順に）で、最初にしきい値を超えるビン */
      var P=st.P;st.first=-1;for(var r=0;r<c.nb&&st.first<0;r++){var b=c.ord[r];for(var i=0;i<J;i++)if(P[b*J+i]>c.thr){st.first=r*J+i;break;}}}
    function reset(){tk.stop();st.rev=0;draw();}
    function start(all){tk.stop();var c=cfg();compute(c);st.rev=all?c.cells:0;draw();if(!all)tk.start();}
    function step(){var c=cfg();if(!st.P||st.P.length!==c.cells){tk.stop();return;}
      st.rev=Math.min(c.cells,st.rev+(c.ser?Math.ceil(c.cells/40):J*Math.max(1,Math.round(c.nb/24))));if(st.rev>=c.cells)tk.stop();draw();}
    /* 符号の位相の近さ（1023 チップで一周する） */
    function cd(a,b){var d=((a-b)%1023+1023)%1023;return Math.min(d,1023-d);}
    function draw(){
      var c=cfg(),nar=_w05_nar(box),Wd=nar?400:700,o=[],P=(st.rev>0&&st.P&&st.P.length===c.cells)?st.P:null,full=P&&st.rev>=c.cells;
      var sat=null;_W05_SATS.forEach(function(s){if(s[0]===c.prn)sat=s;});
      var ncol=nar?128:256,cw=J/ncol,gr=Math.ceil(c.nb/41),nr=Math.ceil(c.nb/gr);
      var x0=nar?62:62,y0=nar?268:318,WW=nar?198:410,dxT=nar?88:150,dyT=nar?104:136,hzT=nar?104:128;
      var dx=nr>1?dxT/(nr-1):0,dy=nr>1?dyT/(nr-1):0;
      function seen(b,i){return P&&c.rk[b]*J+i<st.rev;}
      /* 表示する値（立体の図の 1 本の線の 1 点 = 符号の位相 cw 個 × ドップラー gr 個の最大）と、しきい値を超えた所 */
      var mxAll=0,best=-1,hits=[],near=0,far=0;
      if(P){for(var q=0;q<P.length;q++)if(P[q]>mxAll)mxAll=P[q];
        for(var b=0;b<c.nb;b++)for(var i=0;i<J;i++){if(!seen(b,i))continue;var v=P[b*J+i];if(best<0||v>P[best])best=b*J+i;
          if(v>c.thr){var ok=sat&&cd(i*_W05_RC/_W05_FS,sat[1])<1.5&&Math.abs(c.bins[b]-sat[2])<1.5/(c.T*1e-3);hits.push([b,i,ok]);if(ok)near++;else far++;}}}
      var pd=Math.max(1.3*c.thr,1.05*mxAll),hz=hzT/pd;
      o.push(S.T(nar?6:14,18,"(a) PRN "+c.prn+" の格子: ドップラー "+c.nb+" 通り × 符号の位相 2048 通り","start",11,"ink",true));
      o.push(S.T(nar?6:14,34,P?(full?"全部を計算した":"計算中（"+(c.ser?"直列":"FFT")+"）"):"「探す」か「全部を一度に」を押す","start",9.5,P?"muted":"gold",!P));
      for(var r=nr-1;r>=0;r--){var pts=[],any=false,hasBest=false;
        for(var j=0;j<ncol;j++){var v2=-1;for(var bb=r*gr;bb<Math.min(c.nb,(r+1)*gr);bb++)for(var ii=j*cw;ii<(j+1)*cw;ii++)if(seen(bb,ii)){var pv=P[bb*J+ii];if(pv>v2)v2=pv;any=true;if(full&&bb*J+ii===best)hasBest=true;}
          pts.push([x0+(j+0.5)/ncol*WW+r*dx,y0-r*dy-Math.min(Math.max(v2,0),pd)*hz]);}
        var base=[[x0+WW+r*dx,y0-r*dy],[x0+r*dx,y0-r*dy]];
        o.push(S.PL(pts.concat(base),"none",0,"screen"));
        o.push(S.PL(pts,any?(hasBest?"signal":"muted"):"faint",any?(hasBest?1.4:0.9):0.7));}
      hits.forEach(function(h){var rr=Math.floor(h[0]/gr),xx=x0+(h[1]+0.5)/J*WW+rr*dx,yy=y0-rr*dy-Math.min(P[h[0]*J+h[1]],pd)*hz;o.push(S.D(xx,yy-3,h[2]?"green":"alias",3.2));});
      if(P&&!full&&st.rev>0){var cur=st.rev-1,rb=c.ord[Math.floor(cur/J)],ci=c.ser?cur%J:J-1,rr2=Math.floor(rb/gr),xc=x0+(ci+0.5)/J*WW+rr2*dx,yc=y0-rr2*dy;
        o.push(S.PL([[xc,yc+3],[xc-5,yc+12],[xc+5,yc+12]],"gold",1,"gold"));}
      /* 軸 */
      o.push(S.L(x0,y0+4,x0+WW,y0+4,"muted",1.1));
      [0,200,400,600,800,1000].forEach(function(v){var xx=x0+v/1023*WW;o.push(S.L(xx,y0+4,xx,y0+8,"muted",1));o.push(S.T(xx,y0+20,String(v),"middle",9.5,"muted"));});
      o.push(S.T(x0+WW/2,y0+36,"符号の位相 [チップ]","middle",10,"muted"));
      [0,(c.nb-1)/2,c.nb-1].forEach(function(b){var r=Math.floor(b/gr),f=c.bins[b];
        o.push(S.T(x0+WW+r*dx+6,y0-r*dy+4,(f>0.5?"+":"")+_w05_f(f/1000,Math.abs(f%1000)<1e-6?0:2)+" kHz","start",9.5,"muted"));});
      if(gr>1)o.push(S.T(x0+WW+(nr-1)*dx-60,y0-(nr-1)*dy-12,"1 本の線 = "+gr+" ビンの最大","start",9,"muted"));
      o.push(S.L(x0-8,y0,x0-8,y0-pd*hz,"muted",1));
      var yth=y0-c.thr*hz;
      U.nice(0,pd,3).forEach(function(v){if(v>pd)return;var yy=y0-v*hz;o.push(S.L(x0-12,yy,x0-8,yy,"muted",1));if(Math.abs(yy-yth)>11)o.push(S.T(x0-14,yy+3.5,U.sig(v,3),"end",9.5,"muted"));});
      o.push(S.L(x0-14,yth,x0-2,yth,"alias",1.8));o.push(S.T(x0-16,yth+3.5,"しきい値","end",9.5,"alias",true,false,null,true));
      o.push(S.TX(x0-8,y0-pd*hz-8,"p","middle",10,"muted"));
      /* (b)(c) 最大のビンを通る断面 */
      var yb=nar?318:372,h="";
      if(full){var bi=Math.floor(best/J),ki=best%J,tau=ki*_W05_RC/_W05_FS,fb=c.bins[bi],SN=Math.pow(10,c.cn0/10)*c.T*1e-3,onT=sat&&cd(tau,sat[1])<1.5&&Math.abs(fb-sat[2])<1.5/(c.T*1e-3);
        var top=Math.max(1.25*c.thr,1.1*P[best]),Pb=U.plot(nar?52:60,yb+18,nar?320:262,nar?96:110,[tau-3,tau+3],[0,top]);
        var Pc=nar?U.plot(52,yb+204,320,96,[fb-3/(c.T*1e-3),fb+3/(c.T*1e-3)],[0,top]):U.plot(402,yb+18,276,110,[fb-3/(c.T*1e-3),fb+3/(c.T*1e-3)],[0,top]);
        o.push(S.L(nar?6:10,yb-12,Wd-(nar?6:10),yb-12,"line",0.8));
        o.push(S.T(nar?6:14,yb+4,"(b) 符号の位相の断面（"+(fb>0?"+":"")+_w05_g(fb,0)+" Hz の行）","start",11,"ink",true));
        o.push(S.T(nar?6:398,nar?yb+190:yb+4,"(c) ドップラーの断面（"+_w05_f(tau,2)+" チップの列）","start",11,"ink",true));
        var yt=U.nice(0,top,3).filter(function(v){return v<=top;});
        o.push(Pb.axes({xt:U.nice(tau-3,tau+3,6).filter(function(v){return v>=tau-3&&v<=tau+3;}),yt:yt,xfmt:function(v){return _w05_f(v,v%1===0?0:1);},yfmt:function(v){return U.sig(v,3);},xl:"符号の位相 [チップ]",yl:"p",ylOff:34}));
        o.push(Pc.axes({xt:U.nice(Pc.xr[0],Pc.xr[1],5).filter(function(v){return v>=Pc.xr[0]-1e-9&&v<=Pc.xr[1]+1e-9;}),yt:yt,xfmt:function(v){return _w05_g(v,0);},yfmt:function(v){return U.sig(v,3);},xl:"ドップラー [Hz]",yl:"p",ylOff:34}));
        [Pb,Pc].forEach(function(Q){o.push(Q.line([[Q.xr[0],c.thr],[Q.xr[1],c.thr]],"alias",1.2,"5 3"));});
        if(onT){var cb=[],cc=[],k2;for(k2=0;k2<=240;k2++){var x=tau-3+6*k2/240;cb.push([x,1+SN*Math.pow(_w05_lam(x-sat[1]),2)*Math.pow(_w05_sinc((fb-sat[2])*c.T*1e-3),2)]);}
          for(k2=0;k2<=240;k2++){var f2=Pc.xr[0]+(Pc.xr[1]-Pc.xr[0])*k2/240;cc.push([f2,1+SN*Math.pow(_w05_lam(tau-sat[1]),2)*Math.pow(_w05_sinc((f2-sat[2])*c.T*1e-3),2)]);}
          o.push(Pb.clip(cb,"green",1.6,"4 3"));o.push(Pc.clip(cc,"green",1.6,"4 3"));}
        for(var k3=ki-6;k3<=ki+6;k3++){var kk=((k3%J)+J)%J,pv2=P[bi*J+kk],xx2=tau+(k3-ki)*_W05_RC/_W05_FS;o.push(S.L(Pb.X(xx2),Pb.Y(0),Pb.X(xx2),Pb.Y(Math.min(pv2,top)),"faint",1));o.push(S.D(Pb.X(xx2),Pb.Y(Math.min(pv2,top)),pv2>c.thr?"signal":"muted",k3===ki?4:2.8));}
        for(var b3=0;b3<c.nb;b3++){var f3=c.bins[b3];if(f3<Pc.xr[0]-1e-9||f3>Pc.xr[1]+1e-9)continue;var pv3=P[b3*J+ki];o.push(S.L(Pc.X(f3),Pc.Y(0),Pc.X(f3),Pc.Y(Math.min(pv3,top)),"faint",1));o.push(S.D(Pc.X(f3),Pc.Y(Math.min(pv3,top)),pv3>c.thr?"signal":"muted",b3===bi?4:2.8));}
        var lx=nar?14:60,ly=nar?yb+352:yb+176;o.push(S.D(lx+5,ly-4,"signal",3.4));o.push(S.T(lx+13,ly,"ビン（しきい値を超えると青）","start",9.5,"muted"));lx+=13+U.tw("ビン（しきい値を超えると青）",9.5)+14;
        o.push(S.LEGL(lx,ly,onT?[["alias","5 3","しきい値"],["green","4 3","本当の山の式の値"]]:[["alias","5 3","しきい値"]],9.5,14));
        box.set(S.svg(Wd,nar?yb+362:yb+186,o));}
      else box.set(S.svg(Wd,y0+46,o));
      /* 読み出し */
      var Pfa1=c.pfa/c.cells,SNd=c.cn0+10*Math.log10(c.T*1e-3);
      h+="格子: ドップラー <b>"+c.nb+"</b> 通り（刻み "+_w05_g(c.fstep,0)+" Hz、±5 kHz）× 符号の位相 2048 通り（約 1/2 チップごと）= <b>"+_w05_g(c.cells,0)+"</b> ビン（直列で 1/2 チップごとに試すなら 2046 × "+c.nb+" = "+_w05_g(2046*c.nb,0)+" ビン）";
      h+="<br>しきい値: 1 つのビンの誤警報確率 "+_w05_sci(Pfa1,2)+"、p<sub>th</sub> = ln(1/P<sub>fa</sub>) = <b>"+_w05_f(c.thr,1)+"</b>（雑音の平均の "+_w05_f(10*Math.log10(c.thr),1)+" dB 上）";
      if(sat)h+="<br>本当の値: 符号の位相 "+_w05_f(sat[1],2)+" チップ・ドップラー "+(sat[2]>0?"+":"")+_w05_g(sat[2],0)+" Hz。雑音の無い頂点の p は 1 + (C/N0)T<sub>coh</sub> = "+_w05_f(1+Math.pow(10,SNd/10),1)+"（SNR "+_w05_f(SNd,1)+" dB）。ビンが頂点からずれると小さくなる";
      else h+="<br>PRN 3 は、受けた信号に入っていない（PRN 1・2 の信号は、PRN 3 の局部の符号とはほとんど相関しない）";
      if(P){var bi2=Math.floor(best/J),ki2=best%J,fb2=c.bins[bi2];
        h+="<br>"+(full?"最大のビン":"ここまでの最大のビン")+": p = <b>"+_w05_f(P[best],1)+"</b>（"+_w05_f(ki2*_W05_RC/_W05_FS,2)+" チップ・"+(fb2>0?"+":"")+_w05_g(fb2,0)+" Hz）。しきい値を超えたビン "+hits.length+" 個（本当の山の近く "+near+"・ほか "+far+"）";
        if(full){var vd;if(sat)vd=near>0?(far>0?'<span class="warn">見つかったが、誤警報もある</span>':'<span class="ok">見つかった</span>'):(far>0?'<span class="warn">山を見逃し、誤警報だけがある</span>':'<span class="warn">見逃した（しきい値を超えるビンが無い）</span>');
          else vd=far>0?'<span class="warn">誤警報（いない衛星を「いる」と決めた）</span>':'<span class="ok">この衛星はいない、と正しく決めた</span>';h+=" → "+vd;}}
      var ser=c.nb*2046*c.T*1e-3,opS=c.nb*c.T*(J+2046*J),opF=c.nb*(c.T*(J+FOPS+J)+(c.T-1)*J+FOPS);
      h+="<br>1 組の相関器で直列に全部を試す時間: "+_w05_g(2046*c.nb,0)+" × "+c.T+" ms = <b>"+_w05_t(ser)+"</b>";
      if(P&&!full)h+="。ここまで "+_w05_g(Math.round(st.rev*2046/J),0)+" ビン（1 組の相関器なら "+_w05_t(st.rev*c.T*1e-3*2046/J)+"）";
      if(P&&st.first>=0&&st.rev>st.first)h+="。最初にしきい値を超えたビンまで "+_w05_t((st.first+1)*c.T*1e-3*2046/J)+"（直列の受信機は、ここで探すのを止めて確かめる）";
      h+="<br>計算の回数（1 つの衛星）: 直列 "+_w05_sci(opS,2)+" 回、FFT "+_w05_sci(opF,2)+" 回（直列の "+_w05_g(opS/opF,0)+" 分の 1）";
      ro.innerHTML=h+'<div class="wnote">受けた信号は、PRN 1（120.25 チップ・+1630 Hz）と PRN 2（731.6 チップ・−2380 Hz）の C/A 符号の信号（例の値。どちらも同じ C/N0）に雑音を足した、1 ms に 2048 個の複素数の標本。データのビットの反転と、符号のドップラー（1 秒に 1 チップほど）は入れていない。ドップラーは 0 Hz から外へ順に探す。立体の図は、隣り合う '+cw+' 個の符号の位相（行が多いときは、隣り合うドップラーのビンも）の最大を 1 点にした。直列の順に見せるときも、値は FFT で求めた相関を使った（2 節の図で、両者が一致することを確かめた）。計算の回数は、2 節の図と同じ数え方。</div>';
    }
    draw();
  };

  /* ---- 3 節: DLL（S 字の上の点 ↔ 局部の符号のずれの時間の変化） ---- */
  /* 雑音の無い判別器の出力（ずれ x、E と L の間隔 d [チップ]。kind 0: 電力の差、1: 大きさの差 ÷ 和、2: I だけの差） */
  function _w05_disc(x,d,kind){var e=_w05_lam(x-d/2),l=_w05_lam(x+d/2);if(kind===0)return (e*e-l*l)/(2*(2-d));if(kind===1)return e+l>1e-12?(1-d/2)*(e-l)/(e+l):0;return (e-l)/2;}
  /* 1 次の DLL を 1 本（振幅を √(2C) で割った E・L の I・Q に、相関 1 − d の雑音を足す） */
  function _w05_dll(U,o){var g=U.rng(o.seed),c=Math.pow(10,o.cn0/10),T=o.T,sd=Math.sqrt(1/(2*c*T)),kap=4*T*o.BL/(1+2*T*o.BL),rho=Math.max(0,1-o.d),rr=Math.sqrt(1-rho*rho);
    var n=Math.round(o.tend/T),E=new Float32Array(n+1),Dk=new Float32Array(n),e=o.e0,lost=-1,vc=o.v/_W05_CTC,lim=1+o.d/2,h=o.d/2;
    for(var k=0;k<n;k++){E[k]=e;var z0=g.normal(),z1=g.normal(),z2=g.normal(),z3=g.normal();
      var EI=_w05_lam(e-h)+sd*z0,LI=_w05_lam(e+h)+sd*(rho*z0+rr*z1),EQ=sd*z2,LQ=sd*(rho*z2+rr*z3),D;
      if(o.kind===0)D=((EI*EI+EQ*EQ)-(LI*LI+LQ*LQ))/(2*(2-o.d));
      else if(o.kind===1){var a=Math.hypot(EI,EQ),b=Math.hypot(LI,LQ);D=(1-h)*(a-b)/(a+b);}
      else D=(EI-LI)/2;
      Dk[k]=D;e=e-kap*D+((!o.aided&&k*T>=3-1e-9)?vc*T:0);if(lost<0&&Math.abs(e)>lim)lost=(k+1)*T;}
    E[n]=e;return {e:E,D:Dk,n:n,lost:lost,kap:kap};}
  /* 揺れの標準偏差: 動き無し・ずれ 0 から nl 本を計算し、落ち着いた後の値をまとめる */
  function _w05_dllsig(U,o){var T=o.T,kap=4*T*o.BL/(1+2*T*o.BL),tc=T/kap,skip=Math.ceil(3*tc/T),m=Math.ceil(Math.max(8,25*tc)/T),s2=0,cnt=0,lost=false;
    for(var j=0;j<8;j++){var r=_w05_dll(U,{cn0:o.cn0,BL:o.BL,d:o.d,T:T,kind:o.kind,v:0,aided:true,e0:0,seed:o.seed*97+j+1,tend:(skip+m)*T});
      if(r.lost>=0)lost=true;for(var k=skip;k<=r.n;k++){s2+=r.e[k]*r.e[k];cnt++;}}
    return {s:Math.sqrt(s2/cnt),lost:lost};}
  /* この節の式: 位相が合っているとき（coh）と、電力の差 */
  function _w05_dllf(cn0,BL,d,T,coh){var c=Math.pow(10,cn0/10),v=BL*d/(2*c);return Math.sqrt(coh?v:v*(1+2/((2-d)*T*c)));}
  REG.w05_dll=function(el,U){
    var S=U.S,KN=["E と L の電力の差","大きさの差 ÷ 和","I だけの差（位相が合っている）"];
    U.head(el,"DELAY LOCK LOOP","DLL — S 字の上の点と、局部の符号のずれの時間の変化");
    var r1=U.ctrls(el);
    var dd=U.slider(r1,"E と L の間隔 Δ<sub>EL</sub>",{values:[1,0.5,0.2,0.1],value:1,fmt:function(v){return v+" チップ";},onInput:run});
    var kd=U.select(r1,"判別器",KN,0,run);
    var r2=U.ctrls(el);
    var bl=U.slider(r2,"ループの帯域 B<sub>L</sub>",{values:[0.1,0.2,0.5,1,2,5,10],value:1,fmt:function(v){return v+" Hz";},onInput:run});
    var cn=U.slider(r2,"C/N0",{min:15,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var tc=U.slider(r2,"積分の時間 T<sub>coh</sub>",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" ms";},onInput:run});
    var r3=U.ctrls(el);
    var sp=U.slider(r3,"3 s からの受信機の速さ",{values:[0,10,30,100,300],value:0,fmt:function(v){return v+" m/s";},onInput:run});
    var e0=U.slider(r3,"初めのずれ",{values:[0,0.25,0.5,1,1.4],value:0.25,fmt:function(v){return _w05_f(v,2)+" チップ";},onInput:run});
    var ai=U.checkbox(r3,"搬送波による支援",true,run);
    var br=U.btnrow(el),seed=1,cur=10,R=null,SG=null,tk=U.ticker(function(){cur=Math.min(10,cur+0.08);if(cur>=10)tk.stop();draw();},40);
    function set(a){dd.set(a[0]);kd.set(a[1]);bl.set(a[2]);cn.set(a[3]);tc.set(a[4]);sp.set(a[5]);e0.set(a[6]);ai.set(a[7]);run();}
    U.button(br,"本文の例（45 dB-Hz・1 Hz・間隔 1 チップ）",function(){set([1,0,1,45,1,0,0.25,true]);});
    U.button(br,"3 節の図の例（0.5 Hz・支援なし・100 m/s）",function(){set([1,0,0.5,35,1,100,0.25,false]);});
    U.button(br,"再生",function(){if(cur>=10-1e-9)cur=0;tk.start();});
    U.button(br,"止める",function(){tk.stop();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function par(){return {cn0:cn.get(),BL:bl.get(),d:dd.get(),T:tc.get()*1e-3,kind:kd.get(),v:sp.get(),aided:ai.get(),e0:e0.get(),seed:seed,tend:10};}
    function run(){tk.stop();cur=10;var o=par();R=_w05_dll(U,o);SG=_w05_dllsig(U,o);draw();}
    function draw(){
      var o=par(),nar=_w05_nar(box),Wd=nar?400:700,s=[],d=o.d,kc=Math.min(R.n,Math.round(cur/o.T)),lim=1+d/2;
      /* (a) S 字 */
      var ya=d,A=U.plot(52,34,nar?330:250,nar?150:170,[-2,2],[-ya,ya]);
      s.push(S.T(nar?6:14,18,"(a) 判別器の S 字と、測った値（"+KN[o.kind].replace("（位相が合っている）","")+"）","start",11,"ink",true));
      s.push(S.RECT(A.X(-d/2),A.y,A.X(d/2)-A.X(-d/2),A.h,0,U.soft("green"),"none",0));
      s.push(A.axes({xt:[-2,-1,0,1,2],yt:[-d,-d/2,0,d/2,d],xfmt:function(v){return _w05_f(v,0);},yfmt:function(v){return _w05_f(v,d<0.2?2:(d<1?2:1));},xl:"ずれ Δτ/T_c [チップ]",yl:"判別器の出力 D [チップ]",ylOff:42}));
      [-lim,lim].forEach(function(x){s.push(S.L(A.X(x),A.y,A.X(x),A.y+A.h,"alias",1,"4 3"));});
      var sc=[];for(var i=0;i<=400;i++){var x=-2+4*i/400;sc.push([x,_w05_disc(x,d,o.kind)]);}
      s.push(A.clip(sc,"signal",2));
      var W=Math.max(20,Math.round(0.2/o.T)),dots=[];for(var k=Math.max(0,kc-W);k<kc;k++){var ex=R.e[k],dv=R.D[k];if(ex>=-2&&ex<=2&&dv>=-ya&&dv<=ya)dots.push(S.D(A.X(ex),A.Y(dv),"gold",1.7));}
      s.push(dots.join(""));
      if(kc>0){var ek=R.e[kc-1],dk=R.D[kc-1];if(ek>=-2&&ek<=2)s.push(S.D(A.X(ek),A.Y(Math.max(-ya,Math.min(ya,dk))),"gold",4.6));}
      s.push(S.TX(A.X(-1.95),A.y+A.h-6,"緑の帯: ±Δ_{EL}/2","start",9,"green",false,true));
      s.push(S.TX(A.X(lim)-3,A.y+A.h-6,"1 + Δ_{EL}/2","end",9,"alias",false,true));
      /* (b) ずれの時間の変化 */
      var mx=0;for(k=0;k<=R.n;k++)mx=Math.max(mx,Math.abs(R.e[k]));
      var sf=_w05_dllf(o.cn0,o.BL,d,o.T,o.kind===2),yb=Math.min(2.2,Math.max(1.15*mx,4*sf,0.3)),yt=U.nice(-yb,yb,4).filter(function(v){return Math.abs(v)<=yb+1e-9;});
      var B=nar?U.plot(52,260,330,150,[0,10],[-yb,yb]):U.plot(372,34,310,170,[0,10],[-yb,yb]);
      s.push(S.T(nar?6:330,nar?244:18,"(b) 局部の符号のずれ（1 チップ = 293 m）","start",11,"ink",true));
      s.push(B.axes({xt:[0,2,4,6,8,10],yt:yt,xfmt:function(v){return String(v);},yfmt:function(v){return _w05_f(v,yb<0.6?2:1);},xl:"時間 t [s]",yl:"ずれ [チップ]",ylOff:40}));
      [d/2,-d/2].forEach(function(v){if(Math.abs(v)<yb)s.push(B.line([[0,v],[10,v]],"green",1,"3 3"));});
      [lim,-lim].forEach(function(v){if(Math.abs(v)<yb)s.push(B.line([[0,v],[10,v]],"alias",1,"4 3"));});
      if(o.v>0&&!o.aided){var lag=o.v/_W05_CTC*o.T/R.kap;if(lag<yb)s.push(B.line([[3,lag],[10,lag]],"muted",1.2,"6 3"));s.push(S.L(B.X(3),B.y,B.X(3),B.y+B.h,"purple",1,"2 3"));
        s.push(S.T(B.X(3)+3,B.y+11,"動き始め","start",9,"purple",false,false,null,true));}
      s.push(_w05_band(U,B,R.e,o.T,R.n+1,"gold",1.2));
      if(cur<10-1e-9)s.push(S.L(B.X(cur),B.y,B.X(cur),B.y+B.h,"signal",1.4));
      if(R.lost>=0)s.push(S.T(B.X(Math.min(R.lost,9.9)),B.y+B.h-8,"ロックが外れた","middle",9.5,"alias",true,false,null,true));
      box.set(S.svg(Wd,nar?452:246,s));
      /* 読み出し */
      var tcst=o.T/R.kap,lagc=(o.v>0&&!o.aided)?o.v/_W05_CTC*o.T/R.kap:0,sfc=_w05_dllf(o.cn0,o.BL,d,o.T,true),sfp=_w05_dllf(o.cn0,o.BL,d,o.T,false),sfu=o.kind===2?sfc:sfp,rule=3*sfu+lagc,h="";
      h+="κ = 4B<sub>L</sub>T<sub>coh</sub>/(1 + 2B<sub>L</sub>T<sub>coh</sub>) = "+_w05_f(R.kap,R.kap<0.01?5:4)+"、時定数 T<sub>coh</sub>/κ = "+_w05_t(tcst)+"（約 1/(4B<sub>L</sub>)）";
      h+="<br>落ち着いた後のずれの標準偏差（シミュレーション）: "+(SG.lost?'<span class="warn">ロックが外れる（揺れが引き込める範囲を超える）</span>':"σ<sub>τ</sub> = "+_w05_f(SG.s,4)+" チップ → σ<sub>ρ</sub> = <b>"+_w05_f(SG.s*_W05_CTC,2)+" m</b>");
      h+="<br>この節の式: 位相が合っているとき（I だけの差）"+_w05_f(sfc*_W05_CTC,2)+" m、電力の差 "+_w05_f(sfp*_W05_CTC,2)+" m（倍率 1 + 2/{(2 − Δ<sub>EL</sub>)T<sub>coh</sub>(C/N0)} = "+_w05_f(Math.pow(sfp/sfc,2),2)+"）"+(o.kind===1?"。大きさの差 ÷ 和の式は本文では求めていない（C/N0 が低いと、和で割るために傾きが下がり、揺れは電力の差より小さく出る）":"");
      h+="<br>動きによる遅れ: "+(o.v===0?"受信機は止まっている":(o.aided?"搬送波による支援で打ち消される（残りは無視できる）":"v<sub>c</sub> = "+_w05_f(o.v/_W05_CTC,3)+" チップ/s、v<sub>c</sub>T<sub>coh</sub>/κ = <b>"+_w05_f(lagc,3)+" チップ（"+_w05_f(lagc*_W05_CTC,1)+" m）</b>"));
      h+="<br>追尾の目安（3σ<sub>τ</sub> + 遅れ ≤ Δ<sub>EL</sub>/2 = "+_w05_f(d/2,2)+" チップ。σ<sub>τ</sub> は"+(o.kind===2?"位相が合っているときの":"電力の差の")+"式）: "+_w05_f(rule,3)+" チップ → "+(rule<=d/2?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>');
      h+="<br>上の図の 10 s: "+(R.lost>=0?'<span class="warn">t = '+_w05_f(R.lost,2)+" s でロックが外れた（|ずれ| > 1 + Δ<sub>EL</sub>/2）</span>":"ロックは外れなかった")+(cur<10-1e-9?"。時刻の印 t = "+_w05_f(cur,2)+" s":"");
      ro.innerHTML=h+'<div class="wnote">E・L の相関器の I・Q は、振幅を √(2C) で割った値に、雑音（各成分の分散 1/{2(C/N0)T<sub>coh</sub>}、E と L の雑音の相関 1 − Δ<sub>EL</sub>）を乱数で足して作った。ループは 1 次（測ったずれの κ 倍だけ直す）で、受けた符号は 3 s から一定の速さで動き始める（支援ありでは、搬送波のループのドップラーで打ち消されるとした）。(a) の点は、時刻の印より前の 0.2 s（または 20 回）の、ずれと判別器の出力の組。標準偏差は、別に 8 本のループを、ずれ 0・動き無しから計算した値。</div>';
    }
    run();
  };

  /* ---- 4 節: FLL と PLL（I・Q の平面の点 ↔ 周波数と位相のずれの時間の変化） ---- */
  /* 1 ms ごとの FLL → PLL。mode 0: FLL（0.2 s）から PLL、1: PLL だけ、2: FLL だけ。disc 0: コスタス arctan(−Q/I)、1: 4 象限 */
  function _w05_pll(U,o){var T=1e-3,n=Math.round(o.tend/T),c=Math.pow(10,o.cn0/10),sd=Math.sqrt(1/(2*c*T)),g=U.rng(o.seed*7+10);
    var w0=o.order===3?o.B/0.7845:o.B/0.53,ffl=o.mode===0?0.2:(o.mode===2?1e9:0),kf=4*T*10/(1+2*T*10),ta=0.7,aa=o.acc*9.81/_W05_LAM;
    var nb=Math.ceil(o.tend/0.02)+2,bits=new Int8Array(nb),i;for(i=0;i<nb;i++)bits[i]=o.data?(g.next()<0.5?1:-1):1;
    var psh=0,wh=0,x1=null,x2=0,pI=null,pQ=0,I=new Float32Array(n),Q=new Float32Array(n),dF=new Float32Array(n),dP=new Float64Array(n),sw=-1;
    for(var k=0;k<n;k++){var t0=k*T,tm=t0+T/2,tt=Math.max(0,tm-ta),psi=o.psi0+2*Math.PI*(o.df0*tm+0.5*aa*tt*tt),fd=o.df0+aa*tt;
      var dpb=psi-(psh+wh*T/2),dfr=fd-wh/(2*Math.PI),amp=_w05_sinc(dfr*T),dk=bits[Math.floor(t0/0.02+1e-9)];
      var ii=dk*amp*Math.cos(dpb)+sd*g.normal(),qq=-dk*amp*Math.sin(dpb)+sd*g.normal();
      I[k]=ii;Q[k]=qq;dF[k]=dfr;dP[k]=dpb;
      if(t0<ffl-1e-12){if(pI!==null){var num=ii*pQ-pI*qq,den=pI*ii+pQ*qq,fe=den!==0?Math.atan(num/den)/(2*Math.PI*T):0;wh+=2*Math.PI*kf*fe;}pI=ii;pQ=qq;}
      else{if(x1===null){x1=wh;sw=k;}var e=o.disc===0?(ii!==0?Math.atan(-qq/ii):0):Math.atan2(-qq,ii);
        if(o.order===2){x1+=w0*w0*T*e;wh=x1+1.414*w0*e;}else{x2+=w0*w0*w0*T*e;x1+=(x2+1.1*w0*w0*e)*T;wh=x1+2.4*w0*e;}}
      psh+=wh*T;}
    return {I:I,Q:Q,dF:dF,dP:dP,sw:sw,n:n,T:T,w0:w0};}
  REG.w05_pll=function(el,U){
    var S=U.S,D2R=Math.PI/180;
    U.head(el,"CARRIER TRACKING","FLL と PLL — I・Q の平面の点と、周波数・位相のずれ");
    var r1=U.ctrls(el);
    var md=U.select(r1,"ループの方式",["FLL（0.2 s）から PLL へ","PLL だけ","FLL だけ"],0,run);
    var dc=U.select(r1,"PLL の判別器",["コスタス arctan(−Q/I)","4 象限 arctan2(−Q, I)"],0,run);
    var od=U.select(r1,"PLL の次数",["2 次","3 次"],0,run);
    var r2=U.ctrls(el);
    var f0=U.slider(r2,"初めの周波数のずれ",{min:0,max:300,step:10,value:200,fmt:function(v){return v+" Hz";},onInput:run});
    var bw=U.slider(r2,"PLL の帯域 B<sub>L</sub>",{values:[2,5,10,15,20,30],value:15,fmt:function(v){return v+" Hz";},onInput:run});
    var cn=U.slider(r2,"C/N0",{min:20,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var r3=U.ctrls(el);
    var ac=U.slider(r3,"0.7 s からの加速度（衛星へ向かう向き）",{values:[0,0.5,1,2,4],value:0,fmt:function(v){return v+" g";},onInput:run});
    var db=U.checkbox(r3,"データのビット（20 ms ごとに ±1）",true,run);
    var br=U.btnrow(el),seed=1,TE=1.5,cur=TE,R=null,L=null,tk=U.ticker(function(){cur=Math.min(TE,cur+0.01);if(cur>=TE)tk.stop();draw();},40);
    U.button(br,"本文の例（200 Hz・FLL から PLL・15 Hz）",function(){md.set(0);dc.set(0);od.set(0);f0.set(200);bw.set(15);cn.set(45);ac.set(0);db.set(true);run();});
    U.button(br,"1 g の加速度",function(){ac.set(1);run();});
    U.button(br,"再生",function(){if(cur>=TE-1e-9)cur=0;tk.start();});
    U.button(br,"止める",function(){tk.stop();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function par(){return {mode:md.get(),disc:dc.get(),order:od.get()===1?3:2,df0:f0.get(),B:bw.get(),cn0:cn.get(),acc:ac.get(),data:db.get(),seed:seed,tend:TE,psi0:0.6};}
    function wr(x,q){var p=q?2*Math.PI:Math.PI;return x-p*Math.round(x/p);}
    function run(){tk.stop();cur=TE;var o=par();R=_w05_pll(U,o);
      /* 揺れ: 引き込んだ状態から 3 s（動き無し）。PLL のときだけ */
      L=o.mode===2?null:_w05_pll(U,{mode:1,disc:o.disc,order:o.order,df0:0,B:o.B,cn0:o.cn0,acc:0,data:o.data,seed:seed*131+7,tend:3,psi0:0});draw();}
    function stats(o){var r={},n=R.n,k,j,q=o.disc===1;
      /* 引き込み: 位相のずれ（PLL）か周波数のずれ（FLL だけ）が、50 ms 続けて小さい最初の時刻 */
      r.pull=-1;var run2=0,k0=o.mode===2?0:Math.max(0,R.sw);
      for(k=k0;k<n;k++){var okk=o.mode===2?Math.abs(R.dF[k])<2:Math.abs(wr(R.dP[k],q))<15*D2R;if(okk){run2++;if(run2>=50){r.pull=(k-49)*R.T;break;}}else run2=0;}
      if(L){var s2=0,c2=0;for(k=300;k<L.n;k++){var w=wr(L.dP[k],q);s2+=w*w;c2++;}r.sig=Math.sqrt(s2/c2)/D2R;}
      /* 180° の跳び（4 象限では 360°）: 引き込んだ後、ロックする点が変わった回数 */
      r.slip=0;if(o.mode!==2&&r.pull>=0){var p=q?2*Math.PI:Math.PI,nl=Math.round(R.dP[Math.round(r.pull/R.T)]/p);for(k=Math.round(r.pull/R.T);k<n;k++){if(Math.abs(R.dP[k]-nl*p)>0.75*p){nl=Math.round(R.dP[k]/p);r.slip++;}}}
      if(o.acc>0&&o.mode!==2){var m=0,c3=0;for(k=1200;k<n;k++){m+=wr(R.dP[k],q);c3++;}r.th=m/c3/D2R;}
      r.res=0;for(j=n-100;j<n;j++)r.res+=R.dF[j]/100;
      return r;}
    function draw(){
      var o=par(),nar=_w05_nar(box),Wd=nar?400:700,s=[],kc=Math.max(1,Math.min(R.n,Math.round(cur/R.T))),q=o.disc===1,st=stats(o),i,k;
      /* (a) I・Q の平面 */
      var A=nar?U.plot(110,34,200,200,[-1.6,1.6],[-1.6,1.6]):U.plot(52,34,200,200,[-1.6,1.6],[-1.6,1.6]);
      s.push(S.T(nar?6:14,18,"(a) P の I・Q（t = "+_w05_f(kc*R.T,2)+" s までの 0.1 s）","start",11,"ink",true));
      s.push(S.RECT(A.x,A.y,A.w,A.h,0,"screen","line",0.8));
      s.push(A.axes({xt:[-1,0,1],yt:[-1,0,1],grid:false,xfmt:function(v){return _w05_f(v,0);},yfmt:function(v){return _w05_f(v,0);},xl:"I_P（振幅を √(2C) で割った値）",yl:"Q_P",ylOff:30}));
      s.push(S.L(A.X(-1.6),A.Y(0),A.X(1.6),A.Y(0),"faint",1));s.push(S.L(A.X(0),A.Y(-1.6),A.X(0),A.Y(1.6),"faint",1));
      var cp=[];for(i=0;i<=72;i++)cp.push([Math.cos(i*5*D2R),Math.sin(i*5*D2R)]);s.push(A.line(cp,"faint",1,"3 3"));
      var dts=[];for(k=Math.max(0,kc-100);k<kc;k++){var xi=Math.max(-1.6,Math.min(1.6,R.I[k])),yi=Math.max(-1.6,Math.min(1.6,R.Q[k]));dts.push(S.D(A.X(xi),A.Y(yi),"signal",k===kc-1?4.6:1.8));}
      s.push(dts.join(""));
      /* (b)(c)(d) 時間の変化 */
      var xr=[0,TE],X0=nar?52:330,WP=nar?330:352,HP=nar?74:56,Y0=nar?302:34,GP=nar?118:92;
      var fmax=0;for(k=0;k<R.n;k++)fmax=Math.max(fmax,Math.abs(R.dF[k]));var fr=Math.max(10,1.1*fmax);
      var Pf=U.plot(X0,Y0,WP,HP,xr,[-fr,fr]),Pp=U.plot(X0,Y0+GP,WP,HP,xr,q?[-180,180]:[-90,90]),Pi=U.plot(X0,Y0+2*GP,WP,HP,xr,[-1.6,1.6]);
      s.push(S.T(nar?6:X0-44,nar?Y0-14:Y0-16+0,"(b) 周波数のずれ Δf [Hz]","start",10.5,"ink",true));
      s.push(S.T(nar?6:X0-44,Pp.y-14+(nar?0:4),"(c) 位相のずれ [°]（"+(q?"±180°":"±90°")+" に折り返して表示）","start",10.5,"ink",true));
      s.push(S.T(nar?6:X0-44,Pi.y-14+(nar?0:4),"(d) P の I（データのビット）","start",10.5,"ink",true));
      var ftk=U.nice(-fr,fr,3).filter(function(v){return Math.abs(v)<=fr;});
      [Pf,Pp,Pi].forEach(function(P,j){
        if(o.mode===0)s.push(S.RECT(P.X(0),P.y,P.X(0.2)-P.X(0),P.h,0,U.soft("purple"),"none",0));
        if(o.mode===2)s.push(S.RECT(P.X(0),P.y,P.X(TE)-P.X(0),P.h,0,U.soft("purple"),"none",0));
        s.push(P.axes({xt:[0,0.5,1,1.5],yt:j===0?ftk:(j===1?(q?[-180,0,180]:[-90,0,90]):[-1,0,1]),xfmt:function(v){return j===2?_w05_f(v,1):"";},yfmt:function(v){return _w05_f(v,0);},xl:j===2?"時間 t [s]":null,ylOff:30}));
        if(o.acc>0)s.push(S.L(P.X(0.7),P.y,P.X(0.7),P.y+P.h,"purple",1,"2 3"));
        if(cur<TE-1e-9)s.push(S.L(P.X(cur),P.y,P.X(cur),P.y+P.h,"signal",1.4));});
      var wp=new Float32Array(R.n);for(k=0;k<R.n;k++)wp[k]=wr(R.dP[k],q)/D2R;
      s.push(_w05_band(U,Pf,R.dF,R.T,R.n,"gold",1.3));
      s.push(_w05_band(U,Pp,wp,R.T,R.n,"gold",1.1));
      s.push(_w05_band(U,Pi,R.I,R.T,R.n,"signal",1));
      if(o.mode===0)s.push(S.T(Pf.X(0.1),Pf.y+11,"FLL","middle",9,"purple",true,false,null,true));
      if(o.acc>0)s.push(S.T(Pf.X(0.7)+3,Pf.y+11,o.acc+" g","start",9,"purple",true,false,null,true));
      box.set(S.svg(Wd,nar?Pi.y+Pi.h+44:Pi.y+Pi.h+42,s));
      /* 読み出し */
      var c=Math.pow(10,o.cn0/10),sfm=Math.sqrt(o.B/c*(1+1/(2*1e-3*c)))/D2R,th=o.order===2?(2*Math.PI*o.acc*9.81/_W05_LAM)/(R.w0*R.w0)/D2R:0,h="";
      h+="ループ: "+(o.mode===2?"FLL（帯域 10 Hz）だけ":(o.mode===0?"FLL（帯域 10 Hz）で 0.2 s 周波数を寄せてから、":"")+o.order+" 次の PLL（B<sub>L</sub> = "+o.B+" Hz、ω<sub>n</sub> = B<sub>L</sub>/"+(o.order===2?"0.53":"0.785")+" = "+_w05_f(R.w0,1)+" rad/s）")+"。1 ms ごとに直す";
      if(o.mode===2)h+="<br>周波数のずれ: 最後の 0.1 s の平均 "+_w05_f(st.res,1)+" Hz"+(st.pull>=0?"。2 Hz より小さくなった時刻 "+_w05_f(st.pull,2)+" s":"")+"。FLL は位相を合わせないので、I・Q の点は回り続け、データを I で読めない";
      else{h+="<br>引き込み（位相のずれが ±15° の中に 50 ms 続けて入った最初の時刻）: "+(st.pull>=0?"<b>"+_w05_f(st.pull,2)+" s</b>":'<span class="warn">'+_w05_f(TE,1)+" s までに引き込めない</span>");
        var bad=o.disc===1&&o.data;
        h+="<br>落ち着いた後の位相の揺れ（シミュレーション、動き無しで 3 s）: "+(st.sig>20?'<span class="warn">'+_w05_f(st.sig,0)+"°（ロックを保てない）</span>":"<b>"+_w05_f(st.sig,2)+"°</b>")+"、式 σ<sub>ψ</sub> = √{B<sub>L</sub>/(C/N0) × (1 + 1/(2T<sub>coh</sub>(C/N0)))} = "+_w05_f(sfm,2)+"°"+(bad?"（式はコスタスの判別器のもの）":"");
        var okp=st.pull>=0&&st.pull<1.1;
        if(o.acc>0)h+="<br>加速度 "+o.acc+" g（ドップラーが 1 秒に "+_w05_f(o.acc*9.81/_W05_LAM,1)+" Hz ずつ変わる）による位相のずれ: 式 "+(o.order===2?"ψ<sub>e</sub> = (2π"+U.htx("\\dot{v}")+"/λ)/ω<sub>n</sub><sup>2</sup> = <b>"+_w05_f(th,1)+"°</b>":"3 次の PLL では 0")+"、シミュレーション（1.2〜1.5 s の平均）"+(okp&&st.th!=null&&!bad?_w05_f(st.th,1)+"°":"−（引き込めていない）");
        var rule=3*sfm+Math.abs(th);h+="<br>追尾の目安（3σ<sub>ψ</sub> + 動きによるずれ ≤ 45°。式の値で）: "+_w05_f(rule,1)+"° → "+(rule<=45?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+(st.pull<0?(bad?"。ただし、データのビットのためにロックしていない":(o.mode===1?"。ただし、初めの周波数のずれが PLL の引き込める範囲より大きく、ロックしていない（FLL で寄せてから PLL に渡す）":"。ただし、ロックしていない")):"");
        if(bad)h+='<br><span class="warn">4 象限の判別器は、データのビットがあると使えない</span>（ビットが変わって I・Q の点が反対側へ移るたびに、位相が 180° ずれたと測る。データの無い信号（パイロット）に使う）';
        h+="<br>引き込んだ後、ロックする点が "+(q?"360°":"180°")+" 跳んだ回数: "+(st.pull>=0?(st.slip?'<span class="warn">'+st.slip+" 回</span>":"0 回"):"−")+(o.disc===0?"（コスタスでは 180° 違う点でもロックする。そのときはビットが全部反転して読め、プリアンブルで気づいて直す）":"");}
      ro.innerHTML=h+'<div class="wnote">P の I・Q は、振幅を √(2C) で割った値（周波数のずれによる sinc の倍率を含む）に、各成分の分散 1/{2(C/N0)T<sub>coh</sub>} の雑音を足した。T<sub>coh</sub> = 1 ms。FLL は 4 節の判別器と、1 次のループ（帯域 10 Hz）。2 次の PLL は減衰比 0.707、3 次の PLL は係数 1.1 と 2.4。受信機は 0.7 s から一定の加速度で動く。紫の帯は FLL が動いている時間。</div>';
    }
    run();
  };

  /* ---- 6 節: TTFF（手順の時間の帯 ↔ 受けたサブフレーム、1000 回のばらつき） ---- */
  /* P_d = 0.9・格子全体の誤警報 1 %（1 つの衛星のビンの数 10^L）に要る SNR [dB]。N は非コヒーレントに足す回数。刻みの損失の平均を含む（本文と同じ計算） */
  var _W05_REQ={N:[1,2,4,10,30,100,300,1000],L:[3,4,5,6,7,8],db:[[14.31,14.98,15.55,16.06,16.5,16.91],[11.83,12.46,13.0,13.47,13.89,14.28],[9.48,10.07,10.57,11.01,11.41,11.77],[6.58,7.11,7.57,7.97,8.33,8.66],[3.39,3.87,4.29,4.65,4.98,5.28],[0.2,0.65,1.03,1.37,1.66,1.93],[-2.51,-2.09,-1.72,-1.4,-1.12,-0.87],[-5.34,-4.93,-4.57,-4.27,-4.0,-3.75]]};
  function _w05_req(N,L){var r=_W05_REQ.db[_W05_REQ.N.indexOf(N)],x=Math.max(3,Math.min(8,L)),i=Math.min(4,Math.floor(x-3)),f=x-3-i;return r[i]+(r[i+1]-r[i])*f;}
  /* 1 つのビンの積分の候補: [コヒーレント積分の時間 T [ms], 足す回数 N] */
  var _W05_DW=[[1,1],[1,2],[1,4],[1,10],[10,1],[10,4],[10,10],[20,10],[20,30],[20,100],[20,300],[20,1000]];
  /* 受信機が持っているもの: 探す PRN の数・符号の位相のビンの数・ドップラーの範囲 ±fr [Hz]・データを読むか */
  var _W05_MODES=[{nm:"コールドスタート（何も無い）",prn:32,cp:2046,fr:6000,data:true},{nm:"ウォームスタート（アルマナック・時刻・位置）",prn:9,cp:2046,fr:800,data:true},
    {nm:"ホットスタート（有効なエフェメリスも）",prn:9,cp:2046,fr:500,data:false},{nm:"A-GNSS（時刻は秒の単位）",prn:9,cp:2046,fr:500,data:false},{nm:"A-GNSS（精密な時刻）",prn:9,cp:40,fr:500,data:false}];
  function _w05_nd(fr,T){return 2*Math.ceil(fr*2*T*1e-3-1e-9)+1;}   /* ±fr を 1/(2T) の刻みで覆うドップラーのビンの数（T は ms） */
  /* 要る SNR に 3 dB の余裕を足して届く組み合わせのうち、探す時間の最も短いもの */
  function _w05_dwell(m,cn0,eng){var c=Math.pow(10,cn0/10),best=null;
    _W05_DW.forEach(function(p){var T=p[0],N=p[1],nd=_w05_nd(m.fr,T),cells=m.prn*m.cp*nd,L=Math.log10(m.cp*nd),need=_w05_req(N,L)+3,have=10*Math.log10(c*T*1e-3);
      if(have>=need){var t=cells*T*N*1e-3/eng;if(!best||t<best.t)best={T:T,N:N,nd:nd,cells:cells,need:need,have:have,t:t};}});
    return best;}
  /* 1 回の TTFF（例の値の簡単なモデル）。st = [探す, 合わせる, ビット同期, エフェメリスを待つ, 位置を出す] */
  function _w05_ttff1(U,m,cn0,eng,ton,g){var dw=_w05_dwell(m,cn0,eng),st=[0,0,0,0,0],r={st:st,dw:dw,ton:ton,fail:null};
    if(!dw){r.fail="探しても見つからない（C/N0 が低すぎる）";return r;}
    st[0]=dw.t;st[1]=0.3;var c=Math.pow(10,cn0/10);
    if(!m.data){var tr2=st[0]+st[1],tt=ton+tr2;st[4]=Math.ceil(tt-1e-9)-tt;r.ttff=tr2+st[4];return r;}
    if(cn0<23){r.fail="PLL が追えず、データを読めない（23 dB-Hz より低い）";return r;}
    /* ビット同期: 1 s（50 bit）ごとに、境目の位置で符号が変わった回数（確率 1/2）と、ほかの 19 の位置の回数（雑音で変わる確率 pf）を足す */
    var pe=U.gnss.Q(Math.sqrt(2*c*1e-3)),pf=2*pe*(1-pe),cnt=new Float64Array(20),tb=0,j;
    for(var s=1;s<=60;s++){cnt[0]+=Math.max(0,Math.round(25+Math.sqrt(12.5)*g.normal()));for(j=1;j<20;j++)cnt[j]+=Math.max(0,Math.round(50*pf+Math.sqrt(50*pf*(1-pf))*g.normal()));
      var mx=0;for(j=1;j<20;j++)mx=Math.max(mx,cnt[j]);if(cnt[0]-mx>=5){tb=s;break;}}
    if(!tb){r.fail="60 s でビットの境目が決まらない";return r;}
    st[2]=tb;
    /* エフェメリス: 見えている 9 機のそれぞれで、サブフレーム 1〜3 を頭から受け、読み誤ったら 30 s 後の次を待つ。4 機目がそろった時刻 */
    var tr=st[0]+st[1]+st[2],t0=(ton+tr)%30,pb=U.gnss.Q(Math.sqrt(2*c*0.02)),pok=Math.pow(1-pb,300),sats=[],ends=[];
    for(var k=0;k<9;k++){var E=[],tries=[];for(var i=1;i<=3;i++){var s0=6*(i-1);while(s0<t0-1e-9)s0+=30;var n=0;while(true){var ok=g.next()<pok;tries.push([s0,ok,i]);n++;if(ok||n>=12)break;s0+=30;}E.push(s0+6);}
      var en=Math.max.apply(null,E);sats.push({tr:tries,end:en});ends.push(en);}
    ends.sort(function(a,b){return a-b;});st[3]=ends[3]-t0;r.t0=t0;r.tr=tr;r.sats=sats;r.pb=pb;r.pok=pok;r.ttff=tr+st[3];r.e4=ends[3];
    return r;}
  REG.w05_ttff=function(el,U){
    var S=U.S,SC=[["探す","gold"],["合わせる","purple"],["ビット同期","teal"],["エフェメリスを待つ","signal"],["位置を出す","green"]];
    U.head(el,"TIME TO FIRST FIX","TTFF — 手順ごとの時間と、受けたサブフレーム");
    var r1=U.ctrls(el);
    var md=U.select(r1,"電源を入れたときに受信機が持っているもの",_W05_MODES.map(function(m){return m.nm;}),0,run);
    var r2=U.ctrls(el);
    var cn=U.slider(r2,"C/N0（どの衛星も同じ）",{min:15,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var en=U.slider(r2,"探す回路の大きさ",{values:[1000,4000,16000,64000],value:4000,fmt:function(v){return "同時に "+_w05_g(v,0)+" ビン";},onInput:run});
    var r3=U.ctrls(el);
    var on=U.slider(r3,"電源を入れた時刻（30 s のフレームの頭から）",{min:0,max:29.9,step:0.1,value:15,fmt:function(v){return _w05_f(v,1)+" s";},onInput:run});on.el.style.flex="1 1 100%";
    var br=U.btnrow(el),seed=1,R=null,H=null;
    U.button(br,"本文の例（コールドスタート・45 dB-Hz）",function(){md.set(0);cn.set(45);on.set(15);en.set(4000);run();});
    U.button(br,"1000 回くり返す",function(){rep();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){H=null;R=_w05_ttff1(U,_W05_MODES[md.get()],cn.get(),en.get(),on.get(),U.rng(seed*7+1));draw();}
    function rep(){var g=U.rng(seed*31+5),v=[],fail=0,m=_W05_MODES[md.get()];
      for(var i=0;i<1000;i++){var r=_w05_ttff1(U,m,cn.get(),en.get(),g.next()*30,g);if(r.fail)fail++;else v.push(r.ttff);}
      v.sort(function(a,b){return a-b;});var sm=0;v.forEach(function(x){sm+=x;});
      H={v:v,fail:fail,med:v.length?v[Math.floor(v.length/2)]:NaN,mean:v.length?sm/v.length:NaN,p95:v.length?v[Math.min(v.length-1,Math.floor(0.95*v.length))]:NaN,mode:md.get(),cn:cn.get(),eng:en.get()};draw();}
    function fT(t){return t<100?_w05_f(t,1)+" s":_w05_t(t);}
    function draw(){
      var m=_W05_MODES[md.get()],nar=_w05_nar(box),Wd=nar?400:700,s=[],x0=nar?58:92,w=nar?328:592,st=R.st,i,k;
      var tsum=st[0]+st[1]+st[2]+st[3]+st[4],tmax=R.fail?Math.max(10,(st[0]+st[1])*1.2):Math.max(m.data?40:3,tsum*1.08);
      var nt=U.nice(0,tmax,nar?4:7);tmax=Math.max(tmax,nt[nt.length-1]);
      function X(t){return x0+t/tmax*w;}
      s.push(S.T(nar?6:14,18,"(a) 手順ごとの時間"+(R.fail?"（位置が出ない）":"（TTFF "+fT(R.ttff)+"）"),"start",11,"ink",true));
      var t=0;for(i=0;i<5;i++){var d=st[i];if(d>0){s.push(S.RECT(X(t),32,Math.max(X(t+d)-X(t),1.5),22,2,U.soft(SC[i][1]),SC[i][1],1));if(X(t+d)-X(t)>U.tw(SC[i][0],9.5)+6)s.push(S.T((X(t)+X(t+d))/2,47,SC[i][0],"middle",9.5,SC[i][1],true));}t+=d;}
      if(R.fail)s.push(S.T(X(t)+6,47,R.fail,"start",9.5,"alias",true,false,null,true));
      s.push(S.L(x0,60,x0+w,60,"muted",1.1));
      nt.forEach(function(v){if(v>tmax+1e-9)return;s.push(S.L(X(v),60,X(v),64,"muted",1));s.push(S.T(X(v),76,U.sig(v,3),"middle",9.5,"muted"));});
      s.push(S.T(x0+w/2,92,"電源を入れてからの時間 [s]","middle",10,"muted"));
      var lx=nar?8:x0;SC.forEach(function(q){s.push(S.RECT(lx,101,12,10,2,U.soft(q[1]),q[1],1));s.push(S.T(lx+16,110,q[0],"start",9.5,"muted"));lx+=16+U.tw(q[0],9.5)+(nar?10:16);});
      var y=nar?134:138;
      /* (b) 受けたサブフレーム（データを読み始める少し前から、4 機目がそろった後までを、自分の時間の目盛で描く） */
      s.push(S.L(nar?6:10,y-10,Wd-(nar?6:10),y-10,"line",0.8));
      if(m.data&&R.sats){
        s.push(S.T(nar?6:14,y+6,"(b) 各衛星が受けたサブフレーム 1〜3（緑: 読めた、赤: 読み誤った）","start",11,"ink",true));
        var ta=Math.max(0,R.tr-3),tb=Math.max(ta+40,R.ttff+4),ton=R.ton,yf=y+32,nt2=U.nice(ta,tb,nar?4:7).filter(function(v){return v>=ta-1e-9&&v<=tb+1e-9;});
        var X2=function(u){return x0+(u-ta)/(tb-ta)*w;};
        s.push(S.T(x0-6,yf+9,"フレーム","end",9.5,"muted"));
        for(k=Math.floor((ton+ta)/6)*6;k-ton<tb;k+=6){var a=Math.max(ta,k-ton),b=Math.min(tb,k+6-ton),sn=(Math.round(k/6)%5)+1;if(b<=a)continue;
          s.push(S.RECT(X2(a),yf,X2(b)-X2(a),12,0,sn<=3?U.soft("signal"):"screen","line",0.7));if(X2(b)-X2(a)>10)s.push(S.T((X2(a)+X2(b))/2,yf+9.5,String(sn),"middle",8.5,sn<=3?"signal":"muted"));}
        var yz=yf+18+9*12;
        R.sats.forEach(function(q,j){var yy=yf+18+j*12;s.push(S.T(x0-6,yy+8,"衛星 "+(j+1),"end",9,"muted"));
          q.tr.forEach(function(p){var a2=p[0]-R.t0+R.tr,b2=Math.min(tb,a2+6);if(a2>=tb)return;s.push(S.RECT(X2(a2),yy,X2(b2)-X2(a2),9,1,U.soft(p[1]?"green":"alias"),p[1]?"green":"alias",0.8));});
          var ee=q.end-R.t0+R.tr;if(ee<=tb)s.push(S.L(X2(ee),yy-1,X2(ee),yy+10,"ink",1.6));});
        s.push(S.L(X2(R.tr),yf-4,X2(R.tr),yz,"teal",1.2,"3 2"));s.push(S.T(X2(R.tr)+3,yf-6,"読み始める","start",9,"teal",true,false,null,true));
        s.push(S.L(X2(R.ttff),yf-4,X2(R.ttff),yz,"green",1.6,"5 3"));s.push(S.T(X2(R.ttff)-3,yf-6,"4 機目がそろう","end",9,"green",true,false,null,true));
        s.push(S.L(x0,yz+2,x0+w,yz+2,"muted",1.1));
        nt2.forEach(function(v){s.push(S.L(X2(v),yz+2,X2(v),yz+6,"muted",1));s.push(S.T(X2(v),yz+18,U.sig(v,4),"middle",9.5,"muted"));});
        s.push(S.T(x0+w/2,yz+33,"電源を入れてからの時間 [s]（(a) と目盛が違う）","middle",10,"muted"));
        y=yz+54;}
      else{s.push(S.T(nar?6:14,y+6,"(b) サブフレーム","start",11,"ink",true));
        s.push(S.T(nar?6:14,y+24,R.fail?"位置が出ないので、描かない":"エフェメリスは持っている（A-GNSS なら通信で受け取る）ので、サブフレームを待たない","start",9.5,"muted"));y+=40;}
      /* (c) 1000 回のばらつき */
      s.push(S.L(nar?6:10,y-6,Wd-(nar?6:10),y-6,"line",0.8));
      if(H&&H.v.length){var lo0=H.v[0],hi0=H.v[H.v.length-1],sp=Math.max(1e-3,hi0-lo0),bw=[0.05,0.1,0.25,0.5,1,2,5,10,20,50,100,200,500,1000,2000,5000,10000].filter(function(q){return q>=sp/40;})[0]||20000;
        var lo=Math.floor(lo0/bw)*bw,nb=Math.max(1,Math.ceil((hi0-lo)/bw+1e-9)),hi=lo+nb*bw,cnts=new Array(nb).fill(0),cm=0;
        H.v.forEach(function(v){var b=Math.min(nb-1,Math.floor((v-lo)/bw));cnts[b]++;});cnts.forEach(function(c){cm=Math.max(cm,c);});
        var P=U.plot(x0,y+26,w,96,[lo,hi],[0,cm*1.15]);
        s.push(S.T(nar?6:14,y+10,"(c) 1000 回の TTFF（電源を入れる時刻と雑音を変えた）","start",11,"ink",true));
        s.push(P.axes({xt:U.nice(lo,hi,nar?4:7).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;}),yt:U.nice(0,cm*1.15,3).filter(function(v){return v<=cm*1.15;}),xfmt:function(v){return U.sig(v,4);},yfmt:function(v){return String(v);},xl:"TTFF [s]",yl:"回数",ylOff:36}));
        cnts.forEach(function(c,b){if(c>0)s.push(S.RECT(P.X(lo+b*bw)+0.5,P.Y(c),Math.max(1,P.X(lo+(b+1)*bw)-P.X(lo+b*bw)-1),P.Y(0)-P.Y(c),0,U.soft("signal"),"signal",0.8));});
        s.push(S.L(P.X(H.med),P.y,P.X(H.med),P.y+P.h,"gold",1.6,"4 3"));s.push(S.T(P.X(H.med)+3,P.y+10,"中央値","start",9.5,"gold",true,false,null,true));
        y=P.y+P.h+42;}
      else{s.push(S.T(nar?6:14,y+12,"(c) 「1000 回くり返す」を押すと、TTFF のばらつきを描く","start",10,"muted"));y+=20;}
      box.set(S.svg(Wd,y,s));
      /* 読み出し */
      var dw=R.dw,h="",frs=m.fr>=1000?_w05_f(m.fr/1000,0)+" kHz":m.fr+" Hz";
      if(dw){h+="探す格子: "+m.prn+" 機 × "+m.cp+" × "+dw.nd+"（符号の位相"+(m.cp<1000?"は ±10 チップを 1/2 チップごと":"は 1/2 チップごと")+"、ドップラーは ±"+frs+" を 1/(2T<sub>coh</sub>) ごと）= <b>"+_w05_g(dw.cells,0)+"</b> ビン";
        h+="<br>1 つのビン: "+dw.T+" ms のコヒーレント積分"+(dw.N>1?"の電力を "+dw.N+" 回足す（合わせて "+_w05_g(dw.T*dw.N,0)+" ms）":"")+"。要る SNR "+_w05_f(dw.need,1)+" dB（P<sub>d</sub> = 0.9・格子全体の誤警報 1 %・3 dB の余裕）に対し、1 回の SNR "+_w05_f(dw.have,1)+" dB";
        h+="<br>探す時間: "+_w05_g(dw.cells,0)+" × "+_w05_g(dw.T*dw.N,0)+" ms ÷ "+_w05_g(en.get(),0)+" = <b>"+_w05_t(dw.t)+"</b>。合わせる 0.3 s（FLL・PLL）";}
      else h+='<span class="warn">表のどの積分の組み合わせ（最も長いのは 20 ms × 1000 回）でも、要る SNR に届かない</span>';
      if(!R.fail&&m.data){h+="、ビット同期 "+_w05_f(st[2],0)+" s";
        h+="<br>データを読み始めた時刻: フレームの頭から "+_w05_f(R.t0,2)+" s → 4 機目のサブフレーム 1〜3 がそろうまで <b>"+fT(st[3])+"</b>（読み誤りが無ければ "+_w05_f(_w05_teph(R.t0),2)+" s）";
        h+="<br>1 つのサブフレームを全部正しく読む確率 (1 − P<sub>b</sub>)<sup>300</sup> = "+_w05_f(R.pok,3)+"（P<sub>b</sub> = Q(√(2(C/N0) × 20 ms)) "+(R.pb<1e-10?"は 10⁻¹⁰ より小さい":"= "+_w05_sci(R.pb,1))+"）";}
      if(!R.fail&&!m.data)h+="<br>エフェメリスは待たない。HOW も待たずに擬似距離を作り、次の 1 s の区切りで位置を出す（"+_w05_f(st[4],2)+" s 後）";
      if(R.fail&&dw)h+='<br><span class="warn">'+R.fail+"</span>";else if(!R.fail)h+="<br>TTFF = <b>"+fT(R.ttff)+"</b>";
      if(H)h+="<br>1000 回（"+_W05_MODES[H.mode].nm.replace(/（.*）/,"")+"・"+H.cn+" dB-Hz）: "+(H.v.length?"中央値 <b>"+fT(H.med)+"</b>、平均 "+fT(H.mean)+"、95 % が "+fT(H.p95)+" 以内":"")+(H.fail?'（<span class="warn">位置が出なかった '+H.fail+" 回</span>）":"");
      ro.innerHTML=h+'<div class="wnote">どれも例の値の簡単なモデル。見えている衛星は 9 機（どれも同じ C/N0）で、4 機目のエフェメリスがそろったら位置を出す。探す時間は、格子の全部を探す時間とした。1 つのビンの積分は、表の組み合わせ（1 ms × 1〜10 回、10 ms × 1〜10 回、20 ms × 10〜1000 回）のうち、要る SNR に 3 dB を足して届く中で最も速いもの（ビットの境目の損失は入れていない）。ビット同期は、1 s ごとに、境目の位置の回数がほかのどの位置より 5 回以上多いかを調べる。C/N0 が 23 dB-Hz（4 節の図の目安で、10 ms・10 Hz の PLL）より低いとデータを読めないとした。</div>';
    }
    run();
  };
  /* エフェメリスを待つ時間（読み誤りが無いとき。5 節の導出） */
  function _w05_teph(t0){var e=0;for(var i=1;i<=3;i++){var s=6*(i-1);while(s<t0-1e-9)s+=30;e=Math.max(e,s+6);}return e-t0;}
