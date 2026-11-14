  /* ===== 09 章 安定性と安定余裕 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w09_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w09_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w09_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* 有効数字 d 桁（末尾の 0 も残す） */
  function _w09_p(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);if(a>=Math.pow(10,d))return String(Math.round(v)).replace("-","−");
    var s=v.toPrecision(d);if(s.indexOf("e")>=0)s=String(+s);return s.replace("-","−");}
  /* 一巡伝達関数の位相 [°]（低い角周波数から連続につないだ値） */
  function _w09_ph(U,pl,K,L,w){var ws=U.ctl.logspace(Math.log10(Math.min(pl.wr[0],w/2)),Math.log10(w),800);var B=U.ctl.bode(_w09_tf(U,pl,K,L),ws);return B.ph[B.ph.length-1];}
  /* 大きい数・小さい数は a×10^{n}（S.TX の書き方）で */
  function _w09_e(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    if(a>=1e5||a<1e-3){var ex=Math.floor(Math.log10(a)+1e-12),mt=+(v/Math.pow(10,ex)).toPrecision(d);if(Math.abs(mt)>=10){mt=+(mt/10).toPrecision(d);ex++;}
      var ms=mt.toString().replace("-","−");return (ms==="1"?"":(ms==="−1"?"−":ms+"×"))+"10^{"+ex+"}";}
    return _w09_g(v,d+1);}

  /* ---- 例の対象（P(s) = num/den、測った値の遅れ L） ---- */
  var _W09_PL={
    cart:{nm:"台車の速度（測った値が遅れて届く）",num:[1],den:[1,2],ff:2,Ku:"N/(m/s)",Kr:[0.5,60],K0:14,Lv:[0,0.02,0.05,0.1,0.15,0.2,0.3],L0:0.1,Lu:"s",tEnd:3,wr:[0.3,300],bw:[0.5,100],yu:"m/s"},
    motor:{nm:"モータの位置（巻線のインダクタンスを含む）",num:[2e6],den:[1,2000,40000,0],ff:0,Ku:"V/rad",Kr:[0.05,100],K0:10,Lv:[0,0.0002,0.0005,0.001,0.002,0.005],L0:0,Lu:"s",tEnd:null,wr:[0.5,1e5],bw:[1,3000],yu:"rad"},
    motor2:{nm:"モータの位置（インダクタンスを無視。二次遅れの形）",num:[1000],den:[1,20,0],ff:0,Ku:"V/rad",Kr:[0.05,100],K0:0.21,Lv:[0,0.0002,0.0005,0.001,0.002,0.005],L0:0,Lu:"s",tEnd:null,wr:[0.05,1e5],bw:[1,3000],yu:"rad"},
    plate:{nm:"温度の板（むだ時間 20 s）",num:[1.25],den:[500,1],ff:0,Ku:"W/K",Kr:[1,80],K0:12,Lv:[0,5,10,20,30,40,60],L0:20,Lu:"s",tEnd:1500,wr:[1e-6,20],bw:[0.001,1],yu:"K"},
    unst:{nm:"不安定な一次の対象 1/(s − 1)",num:[1],den:[1,-1],ff:0,Ku:"",Kr:[0.1,10],K0:2,Lv:[0],L0:0,Lu:"s",tEnd:8,wr:[1e-4,1e4],bw:[0.01,100],yu:""}
  };
  /* 一巡伝達関数 P(s)C(s)（C = K）の値。s は U.ctl.c の複素数 */
  function _w09_L(U,pl,K,L,s){var cx=U.ctl.cx,v=cx.div(U.ctl.poly.valc(pl.num,s),U.ctl.poly.valc(pl.den,s));v=cx.scale(v,K);if(L)v=cx.mul(v,cx.exp(U.ctl.c(-L*s.re,-L*s.im)));return v;}
  function _w09_jw(U,pl,K,L,w){return _w09_L(U,pl,K,L,U.ctl.c(0,w));}
  function _w09_tf(U,pl,K,L){return U.ctl.tf(pl.num.map(function(x){return x*K;}),pl.den,L||0);}
  /* 開ループの右半平面の極の数と、原点の極の数 */
  function _w09_olp(U,pl){var n0=0,d=pl.den.slice();while(d.length>1&&d[d.length-1]===0){d.pop();n0++;}
    var r=d.length>1?U.ctl.poly.roots(d):[],np=r.filter(function(z){return z.re>1e-9;}).length;return {rhp:np,origin:n0};}
  /* ナイキストの経路に沿って 1 + P(s)C(s) の偏角の変化を数える。返り値 {cw: 時計回りに −1 を回る回数, minD: −1 との最短距離} */
  function _w09_wind(U,pl,K,L){var o=_w09_olp(U,pl),wlo=pl.wr[0],whi=pl.wr[1],N=5000,pts=[],i;
    for(i=0;i<=N;i++)pts.push(U.ctl.c(0,-whi*Math.pow(wlo/whi,i/N)));
    if(o.origin>0){for(i=1;i<300;i++){var th=-Math.PI/2+Math.PI*i/300;pts.push(U.ctl.c(wlo*Math.cos(th),wlo*Math.sin(th)));}}
    else for(i=1;i<100;i++)pts.push(U.ctl.c(0,-wlo+2*wlo*i/100));
    for(i=0;i<=N;i++)pts.push(U.ctl.c(0,wlo*Math.pow(whi/wlo,i/N)));
    var tot=0,prev=null,minD=Infinity;
    pts.forEach(function(s){var v=_w09_L(U,pl,K,L,s),fr=1+v.re,fi=v.im,a=Math.atan2(fi,fr);if(s.re===0)minD=Math.min(minD,Math.hypot(fr,fi));
      if(prev!==null){var d=a-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;tot+=d;}prev=a;});
    return {cw:Math.round(-tot/(2*Math.PI)),raw:-tot/(2*Math.PI),minD:minD,olrhp:o.rhp};}
  /* 閉ループ（u = ff·r + K(r − 測った値)、測った値は L 遅れる）の目標値のステップ（r = 1）への応答。零次ホールドで厳密に離散化 */
  function _w09_sim(U,pl,K,L,tEnd,nstep){nstep=nstep||15000;var t=[],y=[],st=Math.max(1,Math.round(nstep/700)),blow=false,peak=-Infinity,k;
    if(!L){/* むだ時間が無ければ、閉ループの伝達関数 (ff + K)P/(1 + KP) のステップ応答を厳密に求める */
      var Gc=U.ctl.tf(U.ctl.poly.scale(pl.num,pl.ff+K),U.ctl.poly.add(pl.den,U.ctl.poly.scale(pl.num,K))),r=U.ctl.step(Gc,tEnd,nstep);
      for(k=0;k<r.y.length;k++){var v=r.y[k];if(!isFinite(v)||Math.abs(v)>1e6){blow=true;break;}if(v>peak)peak=v;if(k%st===0){t.push(r.t[k]);y.push(v);}}
      return {t:t,y:y,blow:blow,peak:peak};}
    var h=tEnd/nstep,G=U.ctl.tf(pl.num,pl.den),S=U.ctl.ss(G),n=S.A.length,
      dd=U.ctl.mat.c2d(S.A,S.B,h),Ad=dd.A,Bd=dd.B,C=S.C[0],nd=Math.max(1,Math.round(L/h)),x=new Float64Array(n),buf=new Float64Array(nstep+1);
    for(k=0;k<=nstep;k++){var yy=0;for(var i=0;i<n;i++)yy+=C[i]*x[i];buf[k]=yy;if(yy>peak)peak=yy;
      if(k%st===0){t.push(k*h);y.push(yy);}
      if(!isFinite(yy)||Math.abs(yy)>1e6){blow=true;break;}
      /* 操作量は刻みの間一定なので、平均で h/2 遅れる。L − h/2 前の値（隣り合う 2 つの平均）を使って打ち消す */
      var ym=k>=nd?0.5*(buf[k-nd]+buf[k-nd+1]):(k===nd-1?0.5*buf[0]:0),u=pl.ff+K*(1-ym),nx=new Float64Array(n);
      for(var i2=0;i2<n;i2++){var sm=Bd[i2][0]*u;for(var j=0;j<n;j++)sm+=Ad[i2][j]*x[j];nx[i2]=sm;}x=nx;}
    return {t:t,y:y,blow:blow,peak:peak};}
  /* 応答の最終値（安定なとき）: 型 0 なら ff 込みの比、型 1 以上なら 1 */
  function _w09_final(U,pl,K){var d0=pl.den[pl.den.length-1],n0=pl.num[pl.num.length-1];if(d0===0)return 1;var P0=n0/d0;return (pl.ff+K)*P0/(1+K*P0);}
  /* 揺れが収まるか: 後ろ 1/4 と、その前の 1/4 の |y − 最終値| の最大を比べる */
  function _w09_trend(sim,yf){var n=sim.y.length;if(sim.blow)return 2;if(n<8)return 0;
    function mx(a,b){var m=0;for(var i=a;i<b;i++)m=Math.max(m,Math.abs(sim.y[i]-yf));return m;}
    var m1=mx(Math.floor(n/2),Math.floor(3*n/4)),m2=mx(Math.floor(3*n/4),n);if(m1<1e-6*Math.max(1,Math.abs(yf)))return 0;
    var r=m2/m1;return r>1.08?2:(r>0.92?1:0);}
  /* 複素平面（ナイキスト線図の地）。返り値 {svg, P} */
  function _w09_cplane(U,x,y,w,h,xr,yr,o){o=o||{};var S=U.S,P=U.plot(x,y,w,h,xr,yr),s=[S.RECT(x,y,w,h,0,"var(--screen)","line",0.8)];
    var st=o.step||(xr[1]-xr[0]>12?5:(xr[1]-xr[0]>5?1:0.5));
    s.push(P.axes({xt:U.nice(xr[0],xr[1],5).filter(function(v){return v>=xr[0]&&v<=xr[1];}),yt:U.nice(yr[0],yr[1],5).filter(function(v){return v>=yr[0]&&v<=yr[1];}),sz:9}));
    if(yr[0]<0&&yr[1]>0)s.push(S.L(x,P.Y(0),x+w,P.Y(0),"muted",1));
    if(xr[0]<0&&xr[1]>0)s.push(S.L(P.X(0),y,P.X(0),y+h,"muted",1));
    if(o.unit!==false){var c=[];for(var i=0;i<=120;i++){var a=2*Math.PI*i/120;c.push([Math.cos(a),Math.sin(a)]);}s.push(P.clip(c,"faint",1.1,"4 3"));}
    if(o.m1!==false&&xr[0]<-1){s.push(S.X(P.X(-1),P.Y(0),5,"alias",2.2));s.push(S.T(P.X(-1),P.Y(0)-9,"−1","middle",10,"alias",true,false,null,true));}
    return {svg:s.join(""),P:P};}
  /* 曲線（[[re,im],…]）の k 番目に進む向きの矢じり */
  function _w09_head(U,P,pts,k,c){var a=pts[Math.max(0,k-2)],b=pts[Math.min(pts.length-1,k+2)];
    if(!(a[0]>=P.xr[0]&&a[0]<=P.xr[1]&&a[1]>=P.yr[0]&&a[1]<=P.yr[1]&&b[0]>=P.xr[0]&&b[0]<=P.xr[1]&&b[1]>=P.yr[0]&&b[1]<=P.yr[1]))return "";
    if(Math.hypot(P.X(b[0])-P.X(a[0]),P.Y(b[1])-P.Y(a[1]))<2)return "";
    return U.S.head(P.X(a[0]),P.Y(a[1]),P.X(b[0]),P.Y(b[1]),c,7);}
  /* 時間の応答の図 */
  function _w09_tplot(U,x,y,w,h,sim,tEnd,yf,o){o=o||{};var S=U.S,lo=0,hi=1;
    sim.y.forEach(function(v){if(isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}});
    var cap=o.cap||3;lo=Math.max(lo,-cap+1);hi=Math.min(hi,cap);var pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
    var P=U.plot(x,y,w,h,[0,tEnd],[lo,hi]),s=[];
    s.push(P.axes({xl:"時間 t [s]",yl:o.yl||"制御量",yt:U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),xt:U.nice(0,tEnd,5),sz:9,ylOff:34}));
    s.push(S.L(x,P.Y(1),x+w,P.Y(1),"muted",1,"5 3"));
    if(o.yf&&isFinite(yf)&&Math.abs(yf-1)>1e-3)s.push(S.L(x,P.Y(yf),x+w,P.Y(yf),"green",1,"2 3"));
    s.push(P.clip(sim.t.map(function(t,i){return [t,sim.y[i]];}),o.c||"signal",2));
    return {svg:s.join(""),P:P};}

  /* ---- 1 節: ループを一周する正弦波 ---- */
  REG.w09_loop=function(el,U){
    var S=U.S,cx=U.ctl.cx;
    U.head(el,"LOOP","ループを一周する正弦波 — 戻る波は入れた波と重なるか");
    var r1=U.ctrls(el);
    var pls=["cart","motor"];
    var obj=U.select(r1,"対象",["台車の速度（測った値が遅れて届く）","モータの位置（巻線のインダクタンスを含む）"],0,function(){var pl=_W09_PL[pls[obj.get()]];
      if(obj.get()===0){kp.set(17.0048);ld.set(0.1);om.set(16.887);}else{kp.set(40);om.set(200);}draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.5,max:100,log:true,value:17.0048,fmt:function(v){return _w09_p(v,3)+" "+_W09_PL[pls[obj.get()]].Ku;},onInput:draw});
    var r2=U.ctrls(el);
    var ld=U.slider(r2,"測った値の遅れ L",{values:[0,0.02,0.05,0.1,0.15,0.2,0.3],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var om=U.slider(r2,"入れる正弦波の角周波数 ω",{min:0.5,max:2000,log:true,value:16.887,fmt:function(v){return _w09_p(v,3)+" rad/s";},onInput:draw});
    var br=U.btnrow(el);
    function wpc(){var pl=_W09_PL[pls[obj.get()]],L=obj.get()===0?ld.get():0;var m=U.ctl.margins(_w09_tf(U,pl,1,L),0.05,1e4);return m.wpc;}
    U.button(br,"本文の例",function(){obj.set(0);kp.set(17.0048);ld.set(0.1);om.set(16.887);draw();});
    U.button(br,"位相が −180° になる ω に合わせる",function(){var w=wpc();if(w)om.set(w);draw();});
    U.button(br,"境目の比例ゲインにする",function(){var w=wpc();if(w){var pl=_W09_PL[pls[obj.get()]],L=obj.get()===0?ld.get():0;kp.set(1/cx.abs(_w09_jw(U,pl,1,L,w)));om.set(w);}draw();});
    U.button(br,"比例ゲインを 0.8 倍",function(){kp.set(kp.get()*0.8);draw();});
    U.button(br,"比例ゲインを 1.2 倍",function(){kp.set(kp.get()*1.2);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var mot=obj.get()===1,pl=_W09_PL[pls[obj.get()]],K=kp.get(),L=mot?0:ld.get(),w=om.get();
      ld.el.style.display=mot?"none":"";
      var g=_w09_jw(U,pl,K,L,w),gm=cx.abs(g),gph=_w09_ph(U,pl,K,L,w),B=cx.scale(g,-1),bph=cx.arg(B)*180/Math.PI;
      var nar=_w09_nar(box),Wd=nar?400:700,o=[];
      /* (a) 切ったループ */
      var yc=46,xs=nar?52:72,R=15,xcut=nar?120:178;
      o.push(S.ARR(nar?8:16,yc,xs-R,yc,"muted",1.6));o.push(S.TX(nar?8:16,yc-8,"r = 0","start",9.5,"muted",true));
      o.push(S.SUMJ(xs,yc,{l:"+",b:"−"}));
      o.push(S.ARR(xs+R,yc,xcut-8,yc,"signal",1.8));o.push(S.T((xs+R+xcut-8)/2,yc-8,"B","middle",10,"signal",true,false,null,true));
      o.push(S.L(xcut-5,yc-10,xcut-5,yc+10,"ink",2.2));o.push(S.L(xcut+5,yc-10,xcut+5,yc+10,"ink",2.2));
      var pbox=mot?["2×10^{6}","s(s^2 + 2000s + 40000)"]:["e^{−"+L+"s}","s + 2"];
      var ch=S.CHAIN(xcut+8,yc,[["a",nar?32:56,"A","gold"],["b","K_P","c",true],["a",nar?22:40,null,"gold"],["b",pbox,"p",true],["a",nar?16:36,null,"signal"],["t","bp","signal"],["a",nar?18:40,"y","signal"]]);
      o.push(ch.svg);o.push(S.FBPATH(ch.pos.bp,xs,yc,36,"signal"));
      if(!nar){o.push(S.TX(ch.x+10,yc-4,"B = −P(jω)C(jω) A","start",10,"ink",true));o.push(S.T(ch.x+10,yc+12,"（A を入れ続けた後）","start",9,"muted"));}
      /* (b) 波形 */
      var wx=nar?44:56,wy=nar?112:110,ww=nar?340:330,wh=nar?110:130,amp=Math.max(1,gm),yl=Math.min(4,Math.ceil(amp*1.15*2)/2);
      var P=U.plot(wx,wy,ww,wh,[0,720],[-yl,yl]);
      o.push(P.axes({xt:[0,180,360,540,720],yt:U.nice(-yl,yl,4).filter(function(v){return Math.abs(v)<=yl;}),xl:"ωt [°]",sz:9}));
      var pa=[],pb=[];for(var i=0;i<=240;i++){var a=720*i/240;pa.push([a,Math.sin(a*Math.PI/180)]);pb.push([a,gm*Math.sin((a+bph)*Math.PI/180)]);}
      o.push(P.clip(pb,"signal",2.6));o.push(P.line(pa,"gold",1.6,"6 4"));
      o.push(S.LEGL(wx,wy-6,[["gold",null,"入れた A = sin ωt"],["signal",null,"戻る B"]],9.5,14));
      /* (c) 矢印 */
      var cxp=nar?200:530,cyp=nar?wy+wh+120:wy+70,rad=nar?62:66,sc=rad/Math.max(1.25,Math.min(3.5,gm*1.1));
      o.push(S.CIRC(cxp,cyp,sc,"faint",1.1,null,"4 3"));
      o.push(S.L(cxp-rad-8,cyp,cxp+rad+8,cyp,"muted",1));o.push(S.L(cxp,cyp-rad-8,cxp,cyp+rad+8,"muted",1));
      var bx=cxp+sc*B.re,by=cyp-sc*B.im;
      if(Math.hypot(bx-cxp,by-cyp)>3)o.push(S.ARR(cxp,cyp,bx,by,"signal",3.4,9));
      o.push(S.ARR(cxp,cyp,cxp+sc,cyp,"gold",1.6,7));
      o.push(S.T(cxp+sc-4,cyp+15,"A","middle",10,"gold",true,false,null,true));
      o.push(S.T(bx+(B.re>=0?8:-8),by+(B.im>=0?-7:16)-(Math.abs(B.im)<0.05?14:0),"B","middle",10,"signal",true,false,null,true));
      o.push(S.T(cxp,cyp+rad+22,"A と B を回る矢印で表した図（点線は半径 1）","middle",9,"muted"));
      /* (d) 閉ループの応答 */
      var tEnd=mot?Math.max(0.05,Math.min(2,12*2*Math.PI/Math.max(w,1)/2)):3,tw0=nar?44:56,ty=nar?wy+wh+240:wy+wh+70,tww=nar?340:620;
      if(mot){var mm=U.ctl.margins(_w09_tf(U,pl,K,0),0.05,1e4);tEnd=mm.wgc?Math.max(0.08,Math.min(3,25/mm.wgc)):0.5;}
      var sim=_w09_sim(U,pl,K,L,tEnd,mot?30000:60000),yf=_w09_final(U,pl,K),tr=_w09_trend(sim,yf);
      var tp=_w09_tplot(U,tw0,ty,tww,100,sim,tEnd,yf,{yl:mot?"角度 [rad]":"速度 [m/s]",cap:3,c:tr===2?"alias":(tr===1?"signal":"green")});
      o.push(S.T(tw0,ty-8,"ループを閉じたときの制御量（目標値 1 へのステップ）","start",10,"ink",true));
      o.push(tp.svg);
      box.set(S.svg(Wd,ty+100+44,o));
      /* 読み出し */
      var h="",dph=bph;while(dph>180)dph-=360;while(dph<=-180)dph+=360;
      h+="ω = "+_w09_p(w,3)+" rad/s（周期 "+_w09_p(2*Math.PI/w,3)+" s）で: |P(jω)C(jω)| = <b>"+_w09_p(gm,3)+"</b>、∠P(jω)C(jω) = <b>"+_w09_f(gph,1)+"°</b><br>";
      h+="→ B は A の "+_w09_p(gm,3)+" 倍で、位相の差は "+_w09_f(dph,1)+"°"+(Math.abs(dph)<1?'（<span class="ok">同じ向き</span>）':"（向きがずれている）")+"<br>";
      var wp=wpc();
      if(wp){var gp=cx.abs(_w09_jw(U,pl,1,L,wp));h+="位相が −180° になる角周波数: "+_w09_p(wp,3)+" rad/s（周期 "+_w09_p(2*Math.PI/wp,3)+" s）。そこでのゲインは "+_w09_p(gp*K,3)+" 倍 → 境目の比例ゲイン <b>"+_w09_p(1/gp,3)+" "+pl.Ku+"</b><br>";}
      else h+='位相は −180° まで遅れない（むだ時間が無い台車は −90° まで）: B が A と同じ向きに戻る角周波数は無い<br>';
      h+="ループを閉じると: "+(tr===2?'<span class="warn">揺れが大きくなり続ける（不安定）</span>':(tr===1?"同じ振れ幅の揺れが続く（安定限界の近く）":'<span class="ok">揺れは収まる</span>'));
      ro.innerHTML=h+'<div class="wnote">B は、A を十分に長く入れ続けた後の定常状態の波（8 章 1 節）。台車は 1 章と同じく、目標値 1 m/s から決めた力 2 N を足し、測った速度が L 遅れて制御器に届く。応答は零次ホールドで細かい刻みに離散化して計算した。</div>';
    }
    draw();
  };

  /* ---- 2 節: ラウス表 ---- */
  /* ラウス表を作る。1 列目に 0 が出たら小さな正の数 ε に、行がすべて 0 なら 1 つ上の行の式を微分した係数に置き換える */
  function _w09_routh(c){var n=c.length-1,m=Math.floor(n/2)+1,rows=[],scale=0;c.forEach(function(x){scale=Math.max(scale,Math.abs(x));});
    var tol=1e-10*scale,eps=1e-6*scale;
    function row(off){var r=[];for(var i=0;i<m;i++){var k=off+2*i;r.push(k<=n?c[k]:0);}return r;}
    function fix(v,p,prev){var R={v:v,p:p,aux:false,eps:false,auxOf:null};
      if(v.every(function(x){return Math.abs(x)<=tol;})&&prev){R.aux=true;R.auxOf=prev.v.slice();R.v=prev.v.map(function(x,i){var pw=prev.p-2*i;return pw>0?x*pw:0;});}
      if(Math.abs(R.v[0])<=tol&&p>0){R.eps=true;R.v[0]=eps;}
      return R;}
    rows.push(fix(row(0),n,null));if(n>=1)rows.push(fix(row(1),n-1,rows[0]));
    for(var k=2;k<=n;k++){var a=rows[k-2].v,b=rows[k-1].v,nv=[];
      for(var i=0;i<m-1;i++)nv.push((b[0]*a[i+1]-a[0]*b[i+1])/b[0]);nv.push(0);
      rows.push(fix(nv,n-k,rows[k-1]));}
    var ch=0;for(var j=1;j<rows.length;j++)if((rows[j].v[0]>0)!==(rows[j-1].v[0]>0))ch++;
    return {rows:rows,changes:ch,m:m};}
  REG.w09_routh=function(el,U){
    var S=U.S;
    U.head(el,"ROUTH","ラウス表 — 1 列目の符号の変化と、右半平面の根");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",["モータの位置の比例制御（インダクタンスを含む）","モータの位置の PI 制御（インダクタンスを含む）","2 節の例 s³ + 2s² + 4s + 12","係数を入れる"],0,function(){draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.1,max:100,log:true,value:10,fmt:function(v){return _w09_p(v,3)+" V/rad";},onInput:draw});
    var ki=U.slider(r1,"積分のゲイン",{min:0,max:400,step:5,value:100,fmt:function(v){return v+" V/(rad·s)";},onInput:draw});
    var r2=U.ctrls(el);
    var tx=U.textin(r2,"係数（高い次から、カンマで区切る）","1, 2, 4, 12",function(){draw();},{width:"300px"});
    var br=U.btnrow(el);
    function setP(e,k,i){ex.set(e);kp.set(k);if(i!=null)ki.set(i);draw();}
    U.button(br,U.htx("K_P = 10"),function(){setP(0,10);});
    U.button(br,U.htx("K_P = 40（安定限界）"),function(){setP(0,40);});
    U.button(br,U.htx("K_P = 50"),function(){setP(0,50);});
    U.button(br,U.htx("PI: K_P = 10・K_I = 100"),function(){setP(1,10,100);});
    U.button(br,U.htx("PI: K_P = 10・K_I = 200"),function(){setP(1,10,200);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function coeffs(){var e=ex.get(),K=kp.get(),I=ki.get();
      if(e===0)return [1,2000,40000,2e6*K];
      if(e===1)return [1,2000,40000,2e6*K,2e6*I];
      if(e===2)return [1,2,4,12];
      var v=tx.get().split(/[,\s]+/).filter(function(x){return x!=="";}).map(Number);
      while(v.length&&v[0]===0)v.shift();
      if(v.length<2||v.some(function(x){return !isFinite(x);}))return null;
      if(v.length>9)v=v.slice(0,9);
      if(v[0]<0)v=v.map(function(x){return -x;});
      return v;}
    function draw(){
      var e=ex.get();kp.el.style.display=e<=1?"":"none";ki.el.style.display=e===1?"":"none";tx.el.style.display=e===3?"":"none";
      var c=coeffs();
      if(!c){box.set(S.svg(400,40,[S.T(10,24,"係数を 2 つ以上、数で入れる（例 1, 2, 4, 12）","start",11,"alias",true)]));ro.innerHTML="";return;}
      var R=_w09_routh(c),n=c.length-1,nar=_w09_nar(box),Wd=nar?400:700,o=[];
      /* 表 */
      var x0=nar?14:14,y0=26,rh=24,colw=nar?Math.min(96,(330)/R.m):Math.min(108,330/R.m),c1=x0+44;
      o.push(S.T(x0,14,"ラウス表（1 列目が青の帯）","start",10.5,"ink",true));
      o.push(S.RECT(c1-4,y0-4,colw,R.rows.length*rh+4,4,U.soft("signal"),"none",0));
      o.push(S.L(c1-10,y0-4,c1-10,y0+R.rows.length*rh,"muted",1.2));
      R.rows.forEach(function(r,i){var yy=y0+i*rh+16;
        o.push(S.TX(x0+4,yy,r.p===0?"s^0":(r.p===1?"s^1":"s^"+r.p),"start",10,"muted"));
        r.v.forEach(function(v,j){if(j>0&&Math.abs(v)<1e-300&&j>=1)return;var txt=(j===0&&r.eps)?"ε":_w09_e(v,3);
          o.push(S.TX(c1+j*colw,yy,txt,"start",10.5,j===0?(v<0?"alias":"ink"):"ink",j===0));});
        var sg=r.v[0]>0?"+":"−";o.push(S.CHIPL(c1+colw*R.m+4,yy,sg,r.v[0]>0?"green":"alias",9.5));
        if(r.aux)o.push(S.T(c1+colw*R.m+26,yy,"（微分で置き換えた行）","start",9,"gold"));
        if(r.eps&&!r.aux)o.push(S.T(c1+colw*R.m+26,yy,"（0 を ε に）","start",9,"gold"));});
      for(var i=1;i<R.rows.length;i++)if((R.rows[i].v[0]>0)!==(R.rows[i-1].v[0]>0)){var ya=y0+(i-1)*rh+12,yb=y0+i*rh+12,xa=c1-16;
        o.push(S.PATH("M"+xa+","+ya+" Q"+(xa-14)+","+((ya+yb)/2)+" "+(xa-2)+","+(yb-2),"alias",1.4));o.push(S.head(xa-6,yb-6,xa-1,yb-1,"alias",5));}
      var tH=y0+R.rows.length*rh;
      o.push(S.T(x0,tH+16,"1 列目の符号の変化: "+R.changes+" 回","start",10.5,R.changes?"alias":"green",true));
      /* s 平面 */
      var rts=U.ctl.poly.roots(c),mags=rts.map(function(z){return Math.hypot(z.re,z.im);}).sort(function(a,b){return a-b;});
      var keep=mags.slice();while(keep.length>1&&keep[keep.length-1]>6*keep[keep.length-2])keep.pop();
      var Rw=Math.max(1,keep.length?keep[keep.length-1]*1.3:1),px=nar?60:450,py=nar?tH+48:30,ps=nar?260:220;
      var P=U.plot(px,py,ps,ps,[-Rw,Rw],[-Rw,Rw]);
      o.push(S.RECT(px,py,ps,ps,0,"var(--screen)","line",0.8));o.push(U.ctl.splane(P));
      o.push(P.axes({xl:"実部",yl:"虚部",xt:U.nice(-Rw,Rw,4).filter(function(v){return Math.abs(v)<=Rw;}),yt:U.nice(-Rw,Rw,4).filter(function(v){return Math.abs(v)<=Rw;}),sz:9,ylOff:34}));
      o.push(U.ctl.splane(P,{rhp:false}));
      var tl=1e-7,nr=0,ni=0;rts.forEach(function(z){var t=tl*Math.max(1,Math.hypot(z.re,z.im));if(z.re>t)nr++;else if(Math.abs(z.re)<=t*10)ni++;});
      o.push(U.ctl.pz(P,rts,[],"signal",6));
      var far=rts.filter(function(z){return Math.hypot(z.re,z.im)>Rw*1.05;});
      if(far.length)o.push(S.T(px+4,py+ps-6,"枠の外: "+far.map(function(z){return _w09_p(z.re,4);}).join(", "),"start",9,"muted",false,false,null,true));
      o.push(S.T(px,py-8,"根を数値で求めて描いた s 平面","start",10,"ink",true));
      var Hh=nar?py+ps+44:Math.max(tH+30,py+ps+44);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var h="1 列目: "+R.rows.map(function(r){return r.eps&&!r.aux?"ε":U.htx(_w09_e(r.v[0],3));}).join(", ")+" → 符号の変化 <b>"+R.changes+" 回</b><br>";
      var parts=[];rts.forEach(function(z){var mg2=Math.hypot(z.re,z.im),re=Math.abs(z.re)<1e-7*Math.max(1,mg2)?0:z.re;if(z.im>1e-9*Math.max(1,Math.abs(z.re)))parts.push((re===0?"":_w09_p(re,3)+" ")+"± j"+_w09_p(z.im,4));else if(Math.abs(z.im)<=1e-9*Math.max(1,Math.abs(z.re)))parts.push(_w09_p(re,4));});
      h+="根（数値で求めた値）: "+parts.join("、")+" → 右半平面 <b>"+nr+" 個</b>"+(ni?"・虚軸の上 "+ni+" 個":"")+"<br>";
      var aux=R.rows.filter(function(r){return r.aux;});
      if(aux.length)h+='<span class="warn">行がすべて 0 になった</span>: 1 つ上の行の式 = 0 の根（虚軸の上か、原点に対称な組）が Δ(s) の根に含まれる。その式を微分した係数で置き換えて表を続けた<br>';
      else if(R.rows.some(function(r){return r.eps;}))h+='1 列目に 0 が出たので、小さな正の数 ε に置き換えて続けた<br>';
      h+=(nr===0&&ni===0)?'<span class="ok">根はすべて左半平面にある（安定）</span>':(nr>0?'<span class="warn">右半平面に根がある（不安定）</span>':'虚軸の上に根がある（安定限界）');
      if(e===0)h+="<br>安定な範囲: 0 < "+U.htx("K_P")+" < 40 V/rad（s"+"<sup>1</sup> の行 40000 − 1000"+U.htx("K_P")+" > 0）";
      if(e===1){var K=kp.get();h+="<br>"+(K<40?U.htx("K_I")+" の上限 "+U.htx("K_P")+"(40 − "+U.htx("K_P")+")/2 = "+_w09_p(K*(40-K)/2,3)+" V/(rad·s)":U.htx("K_P")+" ≥ 40 では、どの "+U.htx("K_I")+" でも不安定");}
      ro.innerHTML=h+'<div class="wnote">'+(e<=1?'モータの式は 6 章 4 節と同じ Δ(s) = s³ + 2000s² + 40000s + 2×10⁶K<sub>P</sub>（PI 制御では 4 次）。':'')+'根は数値的に求めた（共通部品 U.ctl.poly.roots）。1 列目に 0 が出たときは小さな正の数 ε に、行がすべて 0 になったときは 1 つ上の行の式を微分した係数に置き換えて表を続ける。</div>';
    }
    draw();
  };

  /* ---- 4 節: ナイキスト線図と閉ループの応答 ---- */
  /* ナイキスト線図の点の並び（ω > 0）。型 0 なら ω = 0 の点を先頭に足す */
  function _w09_npts(U,pl,K,L,n){var o=_w09_olp(U,pl),ws=U.ctl.logspace(Math.log10(pl.wr[0]),Math.log10(pl.wr[1]),n||1600),pts=[];
    if(o.origin===0){var v0=_w09_L(U,pl,K,L,U.ctl.c(0,0));pts.push([v0.re,v0.im,0]);}
    ws.forEach(function(w){var v=_w09_jw(U,pl,K,L,w);pts.push([v.re,v.im,w]);});return pts;}
  /* 曲線の上の矢じりを置く位置: |P(jω)C(jω)| が a を下回る最初の点 */
  function _w09_pick(pts,a){for(var i=2;i<pts.length-2;i++)if(Math.hypot(pts[i][0],pts[i][1])<a)return i;return -1;}
  /* 境目の比例ゲイン（位相が −180° になる最初の角周波数で |P C| = 1 になる K） */
  function _w09_kb(U,pl,L){if(pl===_W09_PL.unst)return {K:1,w:0};var m=U.ctl.margins(_w09_tf(U,pl,1,L),pl.wr[0],pl.wr[1]);return m.wpc?{K:m.gm,w:m.wpc}:null;}
  function _w09_tend(U,pl,K,L){if(pl.tEnd)return pl.tEnd;var m=U.ctl.margins(_w09_tf(U,pl,K,L),pl.wr[0],pl.wr[1]);return m.wgc?Math.max(0.06,Math.min(4,25/m.wgc)):0.5;}
  REG.w09_nyquist=function(el,U){
    var S=U.S,cx=U.ctl.cx,keys=["cart","motor","plate","unst"];
    U.head(el,"NYQUIST","ナイキスト線図と −1 の点 — 回る回数と閉ループの応答");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["台車の速度（測った値が遅れて届く）","モータの位置（巻線のインダクタンスを含む）","温度の板（むだ時間 20 s）","不安定な一次の対象 1/(s − 1)"],0,function(){var pl=_W09_PL[keys[obj.get()]];kp.set(obj.get()===0?14:pl.K0);draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.05,max:100,log:true,value:14,fmt:function(v){return _w09_p(v,3)+" "+_W09_PL[keys[obj.get()]].Ku;},onInput:draw});
    var r2=U.ctrls(el);
    var ld=U.slider(r2,"測った値の遅れ L",{values:[0,0.02,0.05,0.1,0.15,0.2,0.3],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var zm=U.select(r2,"表示の範囲",["−1 のまわり","広く"],0,draw);
    var mir=U.checkbox(r2,"ω < 0 の鏡像も描く",true,draw);
    var br=U.btnrow(el);
    function kbound(){var pl=_W09_PL[keys[obj.get()]],L=obj.get()===0?ld.get():(pl===_W09_PL.plate?20:0);return _w09_kb(U,pl,L);}
    U.button(br,"本文の例",function(){var i=obj.get(),pl=_W09_PL[keys[i]];kp.set(i===0?14:pl.K0);if(i===0)ld.set(0.1);draw();});
    U.button(br,"境目の比例ゲイン",function(){var b=kbound();if(b)kp.set(b.K);draw();});
    U.button(br,"境目の 0.8 倍",function(){var b=kbound();if(b)kp.set(b.K*0.8);draw();});
    U.button(br,"境目の 1.2 倍",function(){var b=kbound();if(b)kp.set(b.K*1.2);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var i=obj.get(),pl=_W09_PL[keys[i]],K=kp.get(),L=i===0?ld.get():(i===2?20:0);
      ld.el.style.display=i===0?"":"none";
      var nar=_w09_nar(box),Wd=nar?400:700,o=[];
      var pts=_w09_npts(U,pl,K,L,1600);
      /* 表示の範囲 */
      var xr,yr;
      if(zm.get()===0){xr=[-2.6,1.4];yr=[-2,2];}
      else{var R=1.5;pts.forEach(function(p){var r=Math.hypot(p[0],p[1]);if(r<40)R=Math.max(R,r);});R=Math.min(R*1.1,40);xr=[-R,R];yr=[-R,R];}
      var ns=nar?300:320,nx=nar?60:50,ny=24;
      var cp=_w09_cplane(U,nx,ny,ns,ns*(yr[1]-yr[0])/(xr[1]-xr[0]),xr,yr);o.push(cp.svg);var P=cp.P;
      var main=pts.map(function(p){return [p[0],p[1]];}),mirr=pts.map(function(p){return [p[0],-p[1]];});
      if(mir.get())o.push(P.clip(mirr,"signal",1.4,"5 3"));
      o.push(P.clip(main,"signal",2.4));
      [1.6,0.9,0.45].forEach(function(a){var k=_w09_pick(pts,a);if(k>0)o.push(_w09_head(U,P,main,k,"signal"));});
      if(mir.get()){[0.45,0.9,1.6].forEach(function(a){var k=_w09_pick(pts,a);if(k>0){var rv=mirr.slice().reverse(),kk=rv.length-1-k;o.push(_w09_head(U,P,rv,kk,"signal"));}});}
      o.push(S.T(nx,ny-8,"ナイキスト線図（実線 ω > 0、破線は鏡像）","start",10,"ink",true));
      /* 回る回数 */
      var wd=_w09_wind(U,pl,K,L),zcl=wd.cw+wd.olrhp,b=kbound(),mg=U.ctl.margins(_w09_tf(U,pl,K,L),pl.wr[0],pl.wr[1]);
      var cross=null;if(mg.wpc){cross=-1/mg.gm;o.push(S.D(P.X(cross),P.Y(0),zcl>0?"alias":"green",4.2));}
      if(i===3){cross=-K;}
      /* 閉ループの応答 */
      var tEnd=_w09_tend(U,pl,K,L),sim=_w09_sim(U,pl,K,L,tEnd,[60000,30000,15000,20000][i]),yf=_w09_final(U,pl,K),tr=_w09_trend(sim,yf);
      var tx0=nar?60:430,ty0=nar?ny+ns+56:44,tw=nar?320:250,th=nar?130:170;
      var tp=_w09_tplot(U,tx0,ty0,tw,th,sim,tEnd,yf,{yl:"制御量",cap:3,c:zcl>0?"alias":"green",yf:true});
      o.push(tp.svg);o.push(S.T(tx0,ty0-10,"閉ループのステップ応答（目標値 1）","start",10,"ink",true));
      var H=nar?ty0+th+50:Math.max(ny+ns+20,ty0+th+50);
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var h="";
      if(cross!==null)h+="負の実軸を横切る点: <b>"+_w09_p(cross,3)+"</b>"+(mg.wpc?"（ω = "+_w09_p(mg.wpc,3)+" rad/s）":"（ω = 0）")+"<br>";
      else h+="線図は負の実軸を横切らない<br>";
      if(wd.minD<0.01)h+='<span class="warn">線図が −1 の点のすぐ近くを通る（安定限界）</span><br>';
      h+="−1 を時計回りに回る回数（鏡像を含む）: <b>"+String(wd.cw).replace("-","−")+"</b>　＋　開ループの右半平面の極: <b>"+wd.olrhp+"</b>　＝　閉ループの右半平面の極: <b>"+zcl+"</b> → "+(zcl===0?'<span class="ok">安定</span>':'<span class="warn">不安定</span>')+"<br>";
      if(!L){var den=pl.den.slice(),num=pl.num.map(function(x){return x*K;});var cl=U.ctl.poly.add(den,num),rr=U.ctl.poly.roots(cl),nr=rr.filter(function(z){return z.re>1e-9*Math.max(1,Math.hypot(z.re,z.im));}).length;
        h+="確かめ: 特性方程式の根を数値で求めると、右半平面に "+nr+" 個（";
        var ps=[];rr.forEach(function(z){var re=Math.abs(z.re)<1e-7*Math.max(1,Math.hypot(z.re,z.im))?0:z.re;if(z.im>1e-9)ps.push((re===0?"":_w09_p(re,3)+" ")+"± j"+_w09_p(z.im,3));else if(Math.abs(z.im)<=1e-9)ps.push(_w09_p(re,4));});h+=ps.join("、")+"）<br>";}
      else h+="確かめ: 数値計算の応答は"+(tr===2?'<span class="warn">大きくなり続ける</span>':(tr===1?"同じ振れ幅で続く":'<span class="ok">収まる</span>'))+"<br>";
      if(b)h+="この対象の境目の比例ゲイン: "+_w09_p(b.K,3)+" "+pl.Ku+(i===3?"（これより大きいと安定）":"（これより大きいと不安定）");
      ro.innerHTML=h+'<div class="wnote">回る回数は、虚軸に沿って 1 + P(jω)C(jω) の偏角の変化を足し合わせて数えた（原点の極は右側の小さな半円で迂回）。台車は 1 章と同じく決めた力 2 N を足す。応答は零次ホールドで細かい刻みに離散化して計算した。</div>';
    }
    draw();
  };

  /* ---- 6 節: ゲイン余裕と位相余裕・むだ時間 ---- */
  function _w09_pmz(z){var x=Math.sqrt(Math.sqrt(1+4*Math.pow(z,4))-2*z*z);return Math.atan(2*z/x)*180/Math.PI;}
  /* 位相余裕から、二次遅れの形のときの行き過ぎ量 [%]（目安） */
  function _w09_mp_from_pm(pm){if(pm<=0)return null;if(pm>=_w09_pmz(0.999))return 0;var a=1e-4,b=0.999;for(var i=0;i<60;i++){var m=(a+b)/2;if(_w09_pmz(m)<pm)a=m;else b=m;}var z=(a+b)/2;return 100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z));}
  REG.w09_margin=function(el,U){
    var S=U.S,cx=U.ctl.cx,keys=["cart","motor","motor2","plate"];
    var BR={cart:{wr:[0.5,100],dbr:[-30,30],phr:[-360,0]},motor:{wr:[1,3000],dbr:[-60,60],phr:[-360,-90]},motor2:{wr:[1,3000],dbr:[-60,60],phr:[-360,-90]},plate:{wr:[0.001,1],dbr:[-40,30],phr:[-360,0]}};
    U.head(el,"MARGINS","ゲイン余裕と位相余裕 — ボード線図とナイキスト線図で同じ余裕を読む");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["台車の速度（測った値が遅れて届く）","モータの位置（巻線のインダクタンスを含む）","モータの位置（インダクタンスを無視。二次遅れの形）","温度の板"],0,function(){var pl=_W09_PL[keys[obj.get()]];kp.set(obj.get()===0?8:pl.K0);draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.05,max:100,log:true,value:8,fmt:function(v){return _w09_p(v,3)+" "+_W09_PL[keys[obj.get()]].Ku;},onInput:draw});
    var r2=U.ctrls(el);
    var lc=U.slider(r2,"むだ時間 L",{values:[0,0.02,0.05,0.1,0.15,0.2,0.25,0.3],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var lm=U.slider(r2,"むだ時間 L（計算の遅れなど）",{values:[0,0.0002,0.0005,0.001,0.002,0.005],value:0,fmt:function(v){return (v*1000)+" ms";},onInput:draw});
    var lp=U.slider(r2,"むだ時間 L",{values:[0,5,10,20,30,40,60],value:20,fmt:function(v){return v+" s";},onInput:draw});
    var br=U.btnrow(el);
    function setc(i,K,L){obj.set(i);kp.set(K);if(i===0)lc.set(L);else if(i===3)lp.set(L);else lm.set(L);draw();}
    U.button(br,"本文の例（台車）",function(){setc(0,8,0.1);});
    U.button(br,"台車、遅れ 0.2 s",function(){setc(0,8,0.2);});
    U.button(br,"モータ 10 V/rad",function(){setc(1,10,0);});
    U.button(br,"モータ 0.21 V/rad",function(){setc(1,0.21,0);});
    U.button(br,"温度の板 12 W/K",function(){setc(3,12,20);});
    U.button(br,"温度の板 24 W/K",function(){setc(3,24,20);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var i=obj.get(),key=keys[i],pl=_W09_PL[key],K=kp.get(),L=i===0?lc.get():(i===3?lp.get():lm.get());
      lc.el.style.display=i===0?"":"none";lp.el.style.display=i===3?"":"none";lm.el.style.display=(i===1||i===2)?"":"none";
      var G=_w09_tf(U,pl,K,L),mg=U.ctl.margins(G,pl.wr[0],pl.wr[1]),b=BR[key];
      var nar=_w09_nar(box),Wd=nar?400:700,o=[];
      /* ボード線図 */
      var ws=U.ctl.logspace(Math.log10(b.wr[0]),Math.log10(b.wr[1]),900),B=U.ctl.bode(G,ws);
      var bx=nar?56:58,bw=nar?320:330;
      var bd=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal"}],{x:bx,y:22,w:bw,hm:nar?100:110,hp:nar?100:110,gap:26,wr:b.wr,dbr:b.dbr,phr:b.phr});
      o.push(bd.svg);o.push(S.T(bx,12,"ボード線図","start",10,"ink",true));
      var Pm=bd.Pm,Pp=bd.Pp,inR=function(w){return w&&w>=b.wr[0]&&w<=b.wr[1];};
      if(inR(mg.wgc)){o.push(S.L(Pm.X(mg.wgc),Pm.y,Pm.X(mg.wgc),Pp.y+Pp.h,"green",1.1,"3 3"));
        if(mg.pm>0)o.push(S.ARR(Pp.X(mg.wgc),Pp.Y(-180),Pp.X(mg.wgc),Pp.Y(-180+mg.pm),"green",2,6));
        o.push(S.TX(Pp.X(mg.wgc)-4,Pp.Y(-180+mg.pm/2)+4,"φ_m","end",10,"green",true,true));}
      if(inR(mg.wpc)){o.push(S.L(Pm.X(mg.wpc),Pm.y,Pm.X(mg.wpc),Pp.y+Pp.h,"alias",1.1,"3 3"));
        if(mg.gmDb>0)o.push(S.ARR(Pm.X(mg.wpc),Pm.Y(-mg.gmDb),Pm.X(mg.wpc),Pm.Y(0),"alias",2,6));
        o.push(S.TX(Pm.X(mg.wpc)+4,Pm.Y(-mg.gmDb/2)+4,"g_m","start",10,"alias",true,true));}
      /* ナイキスト線図 */
      var ns=nar?260:250,nx=nar?80:430,ny=nar?bd.h+30:30;
      var cp=_w09_cplane(U,nx,ny,ns,ns,[-2.2,1.2],[-2.2,1.2]);o.push(cp.svg);var P=cp.P;
      o.push(S.T(nx,ny-8,"ナイキスト線図（ω > 0）","start",10,"ink",true));
      var pts=_w09_npts(U,pl,K,L,1600),main=pts.map(function(p){return [p[0],p[1]];});
      o.push(P.clip(main,"signal",2.4));
      [1.6,0.9,0.45].forEach(function(a){var k=_w09_pick(pts,a);if(k>0)o.push(_w09_head(U,P,main,k,"signal"));});
      if(mg.wgc){var g1=_w09_jw(U,pl,K,L,mg.wgc),a1=Math.atan2(g1.im,g1.re),arc=[],a0=-Math.PI;var a2=a1;while(a2>0)a2-=2*Math.PI;
        if(mg.pm>0){for(var q=0;q<=30;q++){var aa=a0+(a2-a0)*q/30;arc.push([0.55*Math.cos(aa),0.55*Math.sin(aa)]);}o.push(P.line(arc,"green",2));}
        o.push(S.L(P.X(0),P.Y(0),P.X(g1.re),P.Y(g1.im),"green",1.2));o.push(S.D(P.X(g1.re),P.Y(g1.im),"green",4));}
      if(mg.wpc){var xc=-1/mg.gm;if(xc>-2.2)o.push(S.D(P.X(xc),P.Y(0),"alias",4.2));}
      /* 閉ループの応答 */
      var tEnd=pl.tEnd||(mg.wgc?Math.max(0.06,Math.min(4,25/mg.wgc)):0.5),sim=_w09_sim(U,pl,K,L,tEnd,[60000,30000,30000,30000][i]),yf=_w09_final(U,pl,K),tr=_w09_trend(sim,yf);
      var ty=nar?ny+ns+56:Math.max(bd.h,ny+ns+30)+24,tp=_w09_tplot(U,bx,ty,nar?320:620,110,sim,tEnd,yf,{yl:"制御量",cap:3,c:(mg.pm!=null&&mg.pm<=0)?"alias":"green",yf:true});
      o.push(tp.svg);o.push(S.T(bx,ty-10,"閉ループのステップ応答（目標値 1）","start",10,"ink",true));
      box.set(S.svg(Wd,ty+110+44,o));
      /* 読み出し */
      var h="",unst=(mg.pm!=null&&mg.pm<=0)||(mg.gmDb!=null&&mg.gmDb<=0);
      if(mg.wgc)h+="ゲイン交差角周波数 "+U.htx("ω_gc")+" = "+_w09_p(mg.wgc,3)+" rad/s、位相余裕 "+U.htx("φ_m")+" = <b>"+_w09_f(mg.pm,1)+"°</b><br>";
      else h+="ゲインが 0 dB を横切らない（どの角周波数でも 1 より小さい）<br>";
      if(mg.wpc)h+="位相交差角周波数 "+U.htx("ω_pc")+" = "+_w09_p(mg.wpc,3)+" rad/s、ゲイン余裕 "+U.htx("g_m")+" = <b>"+_w09_f(mg.gmDb,2)+" dB</b>（"+_w09_p(mg.gm,3)+" 倍。比例ゲインを "+_w09_p(K*mg.gm,3)+" "+pl.Ku+" にすると安定限界）<br>";
      else h+="位相が −180° まで遅れない: ゲイン余裕は無限大<br>";
      if(mg.wgc&&mg.pm>0){var add=mg.pm*Math.PI/180/mg.wgc;h+="許されるむだ時間: いまの "+_w09_p(L,3)+" s に、あと "+U.fmt.time(add,3)+" 足せる（"+U.htx("φ_m/ω_gc")+"。合計 "+U.fmt.time(L+add,3)+"）<br>";}
      if(unst)h+='<span class="warn">余裕が負: 閉ループは不安定</span><br>';
      else{var mx=sim.peak;var mp=Math.max(0,(mx-yf)/Math.abs(yf)*100),pr=mg.pm?_w09_mp_from_pm(mg.pm):null;
        h+="行き過ぎ量（数値計算）: <b>"+_w09_f(mp,1)+" %</b>"+(pr!=null?"、二次遅れの形の表から読む目安: "+_w09_f(pr,1)+" %":"")+"<br>";}
      var md=Infinity;ws.forEach(function(w){var v=_w09_jw(U,pl,K,L,w);md=Math.min(md,Math.hypot(1+v.re,v.im));});
      h+="−1 の点との最も近い距離: "+_w09_p(md,3)+"（感度関数の大きさの最大値 "+_w09_p(1/md,3)+" の逆数）";
      ro.innerHTML=h+'<div class="wnote">余裕は共通部品 U.ctl.margins で求めた（ゲインが 1 を、位相が −180° を最初に横切る角周波数）。台車は 1 章と同じく決めた力 2 N を足し、測った値が L 遅れる。モータと温度の板のむだ時間は、測った値の遅れとして入れた。応答は零次ホールドで細かい刻みに離散化して計算した。</div>';
    }
    draw();
  };
