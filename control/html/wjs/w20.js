  /* ===== 20 章 オブザーバとカルマンフィルタ ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w20_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w20_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w20_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);if(a>=Math.pow(10,d))return String(Math.round(v)).replace("-","−");
    var s=(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace("-","−");}
  function _w20_cs(z,d){d=d||3;if(Math.abs(z.im)<1e-6*(1+Math.abs(z.re)))return _w20_g(z.re,d);return _w20_g(z.re,d)+" ± j"+_w20_g(Math.abs(z.im),d);}
  function _w20_poles(rs){var out=[];rs.forEach(function(z){if(z.im<-1e-6*(1+Math.abs(z.re)))return;out.push(_w20_cs(z,3));});return out.join("、");}
  function _w20_maxabs(a){var m=0;for(var i=0;i<a.length;i++){var v=Math.abs(a[i]);if(v>m)m=v;}return m;}
  function _w20_minmax(a){var lo=Infinity,hi=-Infinity;for(var i=0;i<a.length;i++){var v=a[i];if(v<lo)lo=v;if(v>hi)hi=v;}return [lo,hi];}
  function _w20_range(arrs,pad,minspan){var lo=Infinity,hi=-Infinity;arrs.forEach(function(a){var r=_w20_minmax(a);lo=Math.min(lo,r[0]);hi=Math.max(hi,r[1]);});
    if(!isFinite(lo)){lo=-1;hi=1;}if(hi-lo<minspan){var c=(hi+lo)/2;lo=c-minspan/2;hi=c+minspan/2;}var p=(hi-lo)*pad;return [lo-p,hi+p];}
  function _w20_std(a,i0){var n=0,s=0,s2=0;for(var i=i0||0;i<a.length;i++){n++;s+=a[i];s2+=a[i]*a[i];}if(n<2)return 0;var m=s/n;return Math.sqrt(Math.max(0,s2/n-m*m));}
  /* |y| が tol 以下に入って、その後出ない時刻（最後に出た所を線形補間）。入らなければ Infinity */
  function _w20_settle(t,y,tol){var last=-1;for(var i=0;i<y.length;i++)if(Math.abs(y[i])>tol)last=i;if(last<0)return 0;if(last+1>=y.length)return Infinity;
    var a=Math.abs(y[last]),b=Math.abs(y[last+1]);return t[last]+(t[last+1]-t[last])*(a-tol)/(a-b);}
  /* 離散時間のリャプノフ方程式 S = Φ S Φᵀ + Q の解（倍々の和。Φ の固有値は単位円の内側） */
  function _w20_lyap(M,Phi,Q){var S=M.clone(Q),P=M.clone(Phi);for(var it=0;it<40;it++){var Sn=M.add(S,M.mul(M.mul(P,S),M.T(P)));P=M.mul(P,P);
      var df=0,nz=0;for(var i=0;i<S.length;i++)for(var j=0;j<S.length;j++){df=Math.max(df,Math.abs(Sn[i][j]-S[i][j]));nz=Math.max(nz,Math.abs(Sn[i][j]));}S=Sn;if(df<=1e-14*nz)break;}
    return S;}
  /* 小さな時間の波形の枠。series = [[t[], y[], 色, 破線, 太さ]]。返り値 {svg, P} */
  function _w20_wave(S,U,x,y,w,h,T,lo,hi,title,series,tc,xl,t0){t0=t0||0;if(hi-lo<1e-9){hi=lo+1;}var P=U.plot(x,y,w,h,[t0,T],[lo,hi]),o=[];
    o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.6));
    var yt=U.nice(lo,hi,3).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;}).map(function(v){return Math.abs(v)<1e-9*(hi-lo)?0:v;});
    o.push(P.axes({xl:xl?(typeof xl==="string"?xl:"時間 t [s]"):null,yt:yt,xt:U.nice(t0,T,4).filter(function(v){return v<=T+1e-9&&v>=t0-1e-9;}),xfmt:function(v){return String(+v.toFixed(3));},yfmt:function(v){return _w20_g(v,2);},sz:8.5}));
    if(lo<0&&hi>0)o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"faint",1));
    o.push(S.TX(P.x,P.y-5,title,"start",9.5,"ink",true));
    series.forEach(function(s){var pts=[];for(var i=0;i<s[0].length;i++)pts.push([s[0][i],s[1][i]]);o.push(P.clip(pts,s[2],s[4]||1.8,s[3]));});
    if(tc!=null)o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"alias",1,"3 3"));
    return {svg:o.join(""),P:P};}
  /* 床と台車と振子（17〜19 章と同じ見た目）。cx は台車の中心の x、gy は床の y、ph は角度 [rad] */
  function _w20_pend(S,U,cx,gy,ph,c,Lr,dash){var cw=52,chh=20,yy=gy-chh-10,o=[];
    if(!dash){o.push(S.RECT(cx-cw/2,yy,cw,chh,4,U.soft(c),c,1.5));o.push(S.CIRC(cx-cw*0.25,yy+chh+5,5,c,1.4,"var(--screen)"));o.push(S.CIRC(cx+cw*0.25,yy+chh+5,5,c,1.4,"var(--screen)"));}
    var a=Math.max(-Math.PI/2,Math.min(Math.PI/2,ph)),bx=cx+Lr*Math.sin(a),by=yy-Lr*Math.cos(a);
    o.push(S.L(cx,yy,bx,by,c,dash?1.6:2.4,dash?"5 4":null));o.push(S.CIRC(bx,by,dash?6:7,c,1.6,dash?"none":U.soft(c),dash?"3 2":null));if(!dash)o.push(S.D(cx,yy,c,2.6));return o.join("");}
  function _w20_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  /* 2 つの極（速さ w、減衰比 z。z ≥ 1 なら −w に 2 つ） */
  function _w20_pair(U,w,z){if(z>=0.9999)return [U.ctl.c(-w,0),U.ctl.c(-w,0)];return [U.ctl.c(-z*w,w*Math.sqrt(1-z*z)),U.ctl.c(-z*w,-w*Math.sqrt(1-z*z))];}
  /* オブザーバゲイン（双対性: (Aᵀ, Cᵀ) にアッカーマンの式を使い、転置して戻す）。C は 1 行 */
  function _w20_obsH(U,A,C,poles){var M=U.ctl.mat;return M.T(M.acker(M.T(A),M.T(C),poles));}

  /* 例の対象: 台車とばね・ダンパ（17 章 2 節）と、振子の角度と角速度（17 章 4 節） */
  var _W20_SYS=[{A:[[0,1],[-25,-2]],B:[[0],[1]],x0:[0.1,0],T:3,sc:100,unit:"cm",vunit:"m/s",vsc:1,name:"台車の位置",vname:"台車の速度",tol:0.002,tolTxt:"2 mm",
      noise:[0,0.0003,0.001,0.003],ntxt:function(v){return v*1000+" mm";}},
    {A:[[0,1],[45.78,0]],B:[[0],[-6.667]],x0:[Math.PI/180,0],T:0.6,sc:180/Math.PI,unit:"°",vunit:"°/s",vsc:180/Math.PI,name:"振子の角度",vname:"振子の角速度",tol:0.02*Math.PI/180,tolTxt:"0.02°",
      noise:[0,0.03*Math.PI/180,0.1*Math.PI/180,0.3*Math.PI/180],ntxt:function(v){return _w20_g(v*180/Math.PI,2)+"°";}}];

  /* ---- 3 節: オブザーバの極と推定誤差 ---- */
  REG.w20_observer=function(el,U){
    var S=U.S,M=U.ctl.mat,DT=0.001;
    U.head(el,"OBSERVER","オブザーバの極と推定 — 推定誤差の減り方とノイズ");
    var r1=U.ctrls(el);
    var ssys=U.select(r1,"対象",["台車とばね・ダンパ（位置を測る）","振子の角度と角速度（角度を測る）"],0,function(){fix();run();});
    var r2=U.ctrls(el);
    var sw=U.slider(r2,U.htx("オブザーバの極の速さ ω_o"),{min:2,max:100,log:true,value:20,fmt:function(v){return _w20_g(v,3)+" rad/s";},onInput:function(){run();}});
    var sz=U.slider(r2,U.htx("減衰比 ζ_o（1 で −ω_o に 2 つ）"),{min:0.2,max:1,step:0.01,value:1,fmt:function(v){return _w20_f(v,2);},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var sn=U.slider(r3,"観測ノイズ（標準偏差）",{values:[0,1,2,3],value:2,fmt:function(i){return _W20_SYS[ssys.get()].ntxt(_W20_SYS[ssys.get()].noise[i]);},onInput:function(){run();}});
    var r4=U.ctrls(el);
    var cz=U.checkbox(r4,"H = 0（モデルを並べただけ）",false,function(){run();});
    var cp=U.checkbox(r4,"0.5 s から 0.5 N で 0.5 s 押す（オブザーバは知らない）",false,function(){run();});
    var ci=U.checkbox(r4,"推定を本当の値から始める",false,function(){run();});
    var br=U.btnrow(el),seed=20;
    U.button(br,"本文の例（台車・極 −20 × 2）",function(){ssys.set(0);sw.set(20);sz.set(1);sn.set(2);cz.set(false);cp.set(false);ci.set(false);seed=20;fix();run();});
    U.button(br,"台車をモデルに無い力で押す",function(){ssys.set(0);cp.set(true);ci.set(true);fix();run();});
    U.button(br,"振子（極 −20 × 2）",function(){ssys.set(1);sw.set(20);sz.set(1);sn.set(2);cz.set(false);ci.set(false);fix();run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,G=null;
    function fix(){var i=ssys.get();cp.el.style.display=i===0?"":"none";if(i!==0)cp.set(false);sn.refresh();}
    function design(){var s=_W20_SYS[ssys.get()],C=[[1,0]],poles=_w20_pair(U,sw.get(),sz.get()),H=cz.get()?[[0],[0]]:_w20_obsH(U,s.A,C,poles);
      return {s:s,C:C,H:H,poles:cz.get()?M.eig(s.A):poles};}
    /* 対象と推定を 1 つの系にまとめて、1 ms ごとに厳密に進める（入力は 押す力 d と 観測ノイズ v。v は 1 ms の間一定） */
    function sim(d,sig,push,x0h,rngSeed){var s=d.s,A=s.A,H=d.H,HC=M.mul(H,d.C),Ae=M.sub(A,HC);
      var Az=[[A[0][0],A[0][1],0,0],[A[1][0],A[1][1],0,0],[HC[0][0],HC[0][1],Ae[0][0],Ae[0][1]],[HC[1][0],HC[1][1],Ae[1][0],Ae[1][1]]];
      var Bz=[[s.B[0][0],0],[s.B[1][0],0],[0,H[0][0]],[0,H[1][0]]],dd=M.c2d(Az,Bz,DT),Ad=dd.A,Bd=dd.B;
      var n=Math.round(s.T/DT),rg=U.rng(rngSeed),z=[s.x0[0],s.x0[1],x0h[0],x0h[1]],out={t:[],x1:[],x2:[],h1:[],h2:[],y:[]};
      for(var k=0;k<=n;k++){var v=sig*rg.normal();out.t.push(k*DT);out.x1.push(z[0]);out.x2.push(z[1]);out.h1.push(z[2]);out.h2.push(z[3]);out.y.push(z[0]+v);
        if(k===n)break;var tm=(k+0.5)*DT,f=(push&&tm>=0.5&&tm<1.0)?0.5:0,nz=[0,0,0,0];
        for(var i=0;i<4;i++){var sm=Bd[i][0]*f+Bd[i][1]*v;for(var j=0;j<4;j++)sm+=Ad[i][j]*z[j];nz[i]=sm;}z=nz;}
      return out;}
    function run(){var d=design(),s=d.s,sig=s.noise[sn.get()],x0h=ci.get()?s.x0.slice():[0,0];
      var r=sim(d,sig,cp.get(),x0h,seed);
      /* 理論の値: 観測ノイズによる推定のばらつき（分散の式）、推定誤差が収まる時間、押したときの速度のずれ */
      var Ae=M.sub(s.A,M.mul(d.H,d.C)),ok=true;M.eig(Ae).forEach(function(z){if(z.re>=0)ok=false;});
      var th=null;if(ok&&sig>0){var e=M.c2d(Ae,d.H,DT),Sg=_w20_lyap(M,e.A,M.scale(M.mul(e.B,M.T(e.B)),sig*sig));th=[Math.sqrt(Sg[0][0]),Math.sqrt(Sg[1][1])];}
      var r0=sim(d,0,false,[0,0],1),e1=r0.x1.map(function(v,i){return v-r0.h1[i];}),ts=_w20_settle(r0.t,e1,s.tol);
      var pe=null;if(ssys.get()===0){var rp=sim(d,0,true,s.x0.slice(),1);pe=0;for(var i=0;i<rp.t.length;i++)pe=Math.max(pe,Math.abs(rp.x2[i]-rp.h2[i]));}
      R={d:d,r:r,th:th,ts:ts,pe:pe,ok:ok,sig:sig};draw();}
    function draw(){if(!R)return;var nar=_w20_nar(box),Wd=nar?400:700,o=[],d=R.d,s=d.s,r=R.r;
      /* s 平面 */
      var spx=nar?52:52,spy=26,spw=nar?320:250,sph=nar?150:200,lim=Math.max(30,Math.ceil(Math.max(sw.get(),Math.abs(s.A[1][0])>40?8:6)*1.25/10)*10);
      var SP=U.plot(spx,spy,spw,sph,[-lim,lim*0.3],[-lim*0.62,lim*0.62]);G=SP;
      o.push(S.RECT(SP.x,SP.y,SP.w,SP.h,0,"var(--screen)","line",0.6));o.push(U.ctl.splane(SP,{}));
      o.push(SP.axes({xt:U.nice(-lim,lim*0.3,4).filter(function(v){return v>=-lim&&v<=lim*0.3;}),yt:U.nice(-lim*0.6,lim*0.6,4).filter(function(v){return v>=-lim*0.62&&v<=lim*0.62;}),grid:false,sz:8.5,xl:"実部 [1/s]"}));
      o.push(S.T(SP.x,SP.y-5,"赤: A の固有値　青: オブザーバの極（ドラッグ）","start",9.5,"ink",true));
      o.push(U.ctl.pz(SP,M.eig(s.A),[],"alias",4.5));
      if(!cz.get())o.push(U.ctl.pz(SP,d.poles,[],"signal",6.5));
      /* 波形 */
      var t=r.t,sc=s.sc,vs=s.vsc,x1=r.x1.map(function(v){return v*sc;}),h1=r.h1.map(function(v){return v*sc;}),y=r.y.map(function(v){return v*sc;}),x2=r.x2.map(function(v){return v*vs;}),h2=r.h2.map(function(v){return v*vs;});
      var e2=r.x2.map(function(v,i){return (v-r.h2[i])*vs;});
      var gx=nar?52:356,gw=nar?330:320,gh=nar?78:62,gy0=nar?spy+sph+56:24,dy=nar?gh+30:gh+28,T=s.T;
      var ra=_w20_range([x1,h1],0.08,s.sc*0.01),rv=_w20_range([x2,h2],0.08,0.2),re=_w20_range([e2],0.08,0.05);
      o.push(_w20_wave(S,U,gx,gy0,gw,gh,T,ra[0],ra[1],s.name+" ["+s.unit+"]",[[t,y,"teal",null,0.6],[t,x1,"signal",null,2],[t,h1,"green","5 3",2]],null,false).svg);
      o.push(_w20_wave(S,U,gx,gy0+dy,gw,gh,T,rv[0],rv[1],s.vname+" ["+s.vunit+"]",[[t,x2,"signal",null,2],[t,h2,"green","5 3",2]],null,false).svg);
      o.push(_w20_wave(S,U,gx,gy0+2*dy,gw,gh,T,re[0],re[1],s.vname+"の推定誤差 ["+s.vunit+"]",[[t,e2,"purple",null,1.6]],null,true).svg);
      if(cp.get()){var Pw=U.plot(gx,gy0,gw,gh,[0,T],[0,1]);o.push(S.RECT(Pw.X(0.5),gy0,Pw.X(1.0)-Pw.X(0.5),gh,0,U.soft("purple"),"none",0,null,' fill-opacity="0.35"'));}
      o.push(S.LEGL(gx,gy0+3*dy+16,[["signal",null,"本当の値"],["green","5 3","推定"],["teal",null,"測った値"]],9.5,12));
      box.set(S.svg(Wd,Math.max(nar?gy0+3*dy+24:spy+sph+40,gy0+3*dy+24),o));
      /* 読み出し */
      var h="H = [<b>"+_w20_g(d.H[0][0],4)+", "+_w20_g(d.H[1][0],4)+"</b>]ᵀ、オブザーバの極（A − HC の固有値）: <b>"+_w20_poles(M.eig(M.sub(s.A,M.mul(d.H,d.C))))+"</b>";
      if(!R.ok)h+=' <span class="warn">A − HC が不安定で、推定誤差が増えていく</span>';
      h+="<br>推定を 0 から始めたとき、"+s.name+"の推定誤差が "+s.tolTxt+" 以内に収まる時間: <b>"+(isFinite(R.ts)?_w20_f(R.ts,2)+" s":"表示した時間では収まらない")+"</b>";
      if(R.th)h+="<br>観測ノイズ（1 ms ごとに新しい値、標準偏差 "+s.ntxt(R.sig)+"）による"+s.vname+"の推定のばらつき（分散の式）: <b>"+_w20_g(R.th[1]*vs*(ssys.get()===0?1000:1),3)+" "+(ssys.get()===0?"mm/s":"°/s")+"</b>";
      if(R.pe!=null)h+="<br>0.5 N で 0.5 s 押したときの速度の推定のずれの最大（推定を正しく始め、ノイズなし）: <b>"+_w20_g(R.pe*1000,3)+" mm/s</b>";
      ro.innerHTML=h+'<div class="wnote">対象（'+(ssys.get()===0?"力 0 で 10 cm ずらして放す":"力 0 で 1° 傾けて放す")+'）とオブザーバを 1 つの式にまとめ、1 ms ごとに厳密に進めた。H は (Aᵀ, Cᵀ) にアッカーマンの式を使って求めた（双対性）。</div>';
    }
    U.ctl.drag(box,function(type,x,y){if(!G||cz.get())return false;if(type==="down"){var p0=G.ux(x),q0=G.uy(y),best=1e9;R.d.poles.forEach(function(p){best=Math.min(best,Math.hypot(G.X(p.re)-x,G.Y(p.im)-y));});if(best>16)return false;}
      if(type==="move"||type==="down"){var re=Math.min(-0.5,G.ux(x)),im=Math.abs(G.uy(y));var w=Math.hypot(re,im),z=im<0.03*w?1:-re/w;sw.set(Math.max(2,Math.min(100,w)));sz.set(Math.max(0.2,Math.min(1,z)));run();}});
    fix();run();
  };

  /* ---- 4 節: 推定した状態でフィードバックする（分離定理） ---- */
  REG.w20_sep=function(el,U){
    var S=U.S,M=U.ctl.mat,DT=0.001,TE=2,A=[[0,1],[-25,-2]],B=[[0],[1]],C=[[1,0]];
    U.head(el,"SEPARATION","状態フィードバックとオブザーバを組み合わせる — 閉ループの極");
    var r1=U.ctrls(el);
    var swc=U.slider(r1,U.htx("制御の極の速さ ω_c"),{min:3,max:15,step:0.01,value:Math.sqrt(50),fmt:function(v){return _w20_g(v,3)+" rad/s";},onInput:function(){run();}});
    var szc=U.slider(r1,U.htx("制御の極の減衰比 ζ_c"),{min:0.3,max:1,step:0.01,value:Math.SQRT1_2,fmt:function(v){return _w20_f(v,2);},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var swo=U.slider(r2,U.htx("オブザーバの極の速さ ω_o"),{min:3,max:100,log:true,value:20,fmt:function(v){return _w20_g(v,3)+" rad/s";},onInput:function(){run();}});
    var szo=U.slider(r2,U.htx("オブザーバの極の減衰比 ζ_o"),{min:0.3,max:1,step:0.01,value:1,fmt:function(v){return _w20_f(v,2);},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var sst=U.select(r3,"推定の始め",["0 から（何も知らない）","本当の値から"],0,function(){run();});
    var cz=U.checkbox(r3,"H = 0（モデルを並べただけ）",false,function(){run();});
    var cn=U.checkbox(r3,"観測ノイズ（1 mm）",false,function(){run();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（F = [25, 8]、極 −20 × 2）",function(){swc.set(Math.sqrt(50));szc.set(Math.SQRT1_2);swo.set(20);szo.set(1);sst.set(0);cz.set(false);cn.set(false);run();});
    U.button(br,"オブザーバを遅く（−5 × 2）",function(){swo.set(5);szo.set(1);run();});
    U.button(br,"オブザーバを速く（−60 × 2）",function(){swo.set(60);szo.set(1);run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var pc=_w20_pair(U,swc.get(),szc.get()),po=_w20_pair(U,swo.get(),szo.get());
      var F=M.acker(A,B,pc),H=cz.get()?[[0],[0]]:_w20_obsH(U,A,C,po);
      /* 状態 x と推定 x̂ を並べた閉ループ: d/dt[x; x̂] = [[A, −BF], [HC, A − BF − HC]][x; x̂] + [0; H] v */
      var BF=M.mul(B,F),HC=M.mul(H,C),A22=M.sub(M.sub(A,BF),HC);
      var Acl=[[A[0][0],A[0][1],-BF[0][0],-BF[0][1]],[A[1][0],A[1][1],-BF[1][0],-BF[1][1]],[HC[0][0],HC[0][1],A22[0][0],A22[0][1]],[HC[1][0],HC[1][1],A22[1][0],A22[1][1]]];
      var ev=M.eig(Acl),dd=M.c2d(Acl,[[0],[0],[H[0][0]],[H[1][0]]],DT),df=M.c2d(M.sub(A,BF),[[0],[0]],DT);
      var n=Math.round(TE/DT),z=[0.1,0,sst.get()===1?0.1:0,0],zf=[0.1,0],rg=U.rng(20),sig=cn.get()?0.001:0;
      var out={t:[],p:[],ph:[],u:[],pf:[],uf:[]};
      for(var k=0;k<=n;k++){out.t.push(k*DT);out.p.push(z[0]);out.ph.push(z[2]);out.u.push(-(F[0][0]*z[2]+F[0][1]*z[3]));out.pf.push(zf[0]);out.uf.push(-(F[0][0]*zf[0]+F[0][1]*zf[1]));
        if(k===n)break;var v=sig*rg.normal(),nz=[0,0,0,0],i,j;for(i=0;i<4;i++){var sm=dd.B[i][0]*v;for(j=0;j<4;j++)sm+=dd.A[i][j]*z[j];nz[i]=sm;}z=nz;
        zf=[df.A[0][0]*zf[0]+df.A[0][1]*zf[1],df.A[1][0]*zf[0]+df.A[1][1]*zf[1]];}
      R={F:F,H:H,pc:pc,po:cz.get()?M.eig(A):po,ev:ev,out:out};draw();}
    function draw(){if(!R)return;var nar=_w20_nar(box),Wd=nar?400:700,o=[],r=R.out,t=r.t;
      /* s 平面: 2 組の極と、4 行 4 列の閉ループの行列から求めた固有値 */
      var lim=Math.max(25,Math.ceil(Math.max(swo.get(),swc.get())*1.2/5)*5),SP=U.plot(52,26,nar?320:250,nar?150:190,[-lim,lim*0.25],[-lim*0.6,lim*0.6]);
      o.push(S.RECT(SP.x,SP.y,SP.w,SP.h,0,"var(--screen)","line",0.6));o.push(U.ctl.splane(SP,{}));
      o.push(SP.axes({xt:U.nice(-lim,lim*0.25,4).filter(function(v){return v>=-lim&&v<=lim*0.25;}),yt:U.nice(-lim*0.6,lim*0.6,4).filter(function(v){return v>=-lim*0.6&&v<=lim*0.6;}),grid:false,sz:8.5,xl:"実部 [1/s]"}));
      o.push(S.T(SP.x,SP.y-5,"青: A − BF　青緑: A − HC　○: 閉ループの固有値","start",9.5,"ink",true));
      o.push(U.ctl.pz(SP,R.pc,[],"signal",6.5));o.push(U.ctl.pz(SP,R.po,[],"teal",6.5));
      R.ev.forEach(function(e){if(e.re>=SP.xr[0]&&e.re<=SP.xr[1]&&e.im>=SP.yr[0]&&e.im<=SP.yr[1])o.push(S.CIRC(SP.X(e.re),SP.Y(e.im),9,"ink",1.2));});
      /* 波形 */
      var gx=nar?52:356,gw=nar?330:320,gh=nar?86:78,gy0=nar?(26+150+56):24,dy=gh+30;
      var pp=r.p.map(function(v){return v*100;}),ph=r.ph.map(function(v){return v*100;}),pf=r.pf.map(function(v){return v*100;});
      var rp=_w20_range([pp,ph,pf],0.08,2),ru=_w20_range([r.u,r.uf],0.1,1);
      o.push(_w20_wave(S,U,gx,gy0,gw,gh,TE,rp[0],rp[1],"台車の位置 p [cm]",[[t,pf,"muted","6 3",1.8],[t,ph,"teal","3 2",1.5],[t,pp,"signal",null,2.2]],null,false).svg);
      o.push(_w20_wave(S,U,gx,gy0+dy,gw,gh,TE,ru[0],ru[1],"力 u [N]",[[t,r.uf,"muted","6 3",1.8],[t,r.u,"gold",null,2.2]],null,true).svg);
      o.push(S.LEGL(gx,gy0+2*dy+18,[["signal",null,"位置"],["teal","3 2","推定した位置"],["muted","6 3","すべての状態を測る"]],9.5,10));
      box.set(S.svg(Wd,Math.max(nar?gy0+2*dy+26:26+190+40,gy0+2*dy+26),o));
      var umm=_w20_minmax(r.u),ts=_w20_settle(t,r.p,0.002),tsf=_w20_settle(t,r.pf,0.002),pm=_w20_minmax(pp);
      var h="F = [<b>"+_w20_g(R.F[0][0],4)+", "+_w20_g(R.F[0][1],4)+"</b>]（u = −Fx̂）、H = [<b>"+_w20_g(R.H[0][0],4)+", "+_w20_g(R.H[1][0],4)+"</b>]ᵀ<br>";
      h+="4 行 4 列の閉ループの行列の固有値: <b>"+_w20_poles(R.ev)+"</b>（A − BF の極 "+_w20_poles(R.pc)+" と A − HC の極 "+_w20_poles(R.po)+" を合わせたもの）<br>";
      h+="力 <b>"+_w20_f(umm[0],2)+" 〜 "+_w20_f(umm[1],2)+" N</b>（すべての状態を測ると "+_w20_f(_w20_minmax(r.uf)[0],2)+" 〜 "+_w20_f(_w20_minmax(r.uf)[1],2)+" N）、台車の位置 "+_w20_f(pm[0],2)+" 〜 "+_w20_f(pm[1],2)+" cm<br>";
      h+="±2 mm に収まる時間: <b>"+(isFinite(ts)?_w20_f(ts,2)+" s":"2 s では収まらない")+"</b>（すべての状態を測ると "+_w20_f(tsf,2)+" s）";
      ro.innerHTML=h+'<div class="wnote">台車とばね・ダンパを 10 cm ずらして放す。F は係数の比較（アッカーマンの式）で、H は双対性で求めた。閉ループの式を 1 ms ごとに厳密に進めた。観測ノイズは 1 ms ごとに新しい値（標準偏差 1 mm）。</div>';
    }
    run();
  };

  /* ---- 5 節: 1 次のカルマンフィルタ（板の温度、1 s ごと） ---- */
  /* 本当の温度と読み（図 e20_kf_cycle・e20_kf_const と同じ列）。周期ごとに 乱れ・ノイズ の順に正規乱数を 2 つ引く */
  function _w20_kfdata(U,n,mode,seed,sw,sv){var rg=U.rng(seed),x=60,xs=[],ys=[];
    for(var k=1;k<=n;k++){var a=rg.normal(),b=rg.normal();if(mode===2&&k===100)x+=0.5;xs.push(x);ys.push(x+sv*b);if(mode===0)x+=sw*a;}
    return {x:xs,y:ys};}
  REG.w20_kf1=function(el,U){
    var S=U.S,N=300;
    U.head(el,"KALMAN 1D","1 次のカルマンフィルタ — 予測と更新、ゲインと分散");
    var r1=U.ctrls(el);
    var smode=U.select(r1,"本当の温度",["ランダムウォーク","一定（60 °C）","100 回目に 0.5 K 上がる"],0,function(){run();});
    var stw=U.slider(r1,"本当の乱れ（1 回の標準偏差）",{values:[0.005,0.01,0.02,0.05,0.1],value:0.02,fmt:function(v){return v+" K";},onInput:function(){run();}});
    var stv=U.slider(r1,"読みのノイズ（標準偏差）",{values:[0.05,0.1,0.2,0.5,1],value:0.2,fmt:function(v){return v+" K";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var sfw=U.slider(r2,"フィルタが仮定する √W",{values:[0,0.002,0.005,0.01,0.02,0.05,0.1,0.2],value:0.02,fmt:function(v){return v+" K";},onInput:function(){run();}});
    var sfv=U.slider(r2,"フィルタが仮定する √V",{values:[0.05,0.1,0.2,0.5,1],value:0.2,fmt:function(v){return v+" K";},onInput:function(){run();}});
    var sma=U.slider(r2,"移動平均の長さ N",{min:1,max:60,step:1,value:17,fmt:function(v){return v+" 回";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var smis=U.checkbox(r3,"121〜150 回目は読めない（予測だけ）",false,function(){run();});
    var sk=U.slider(r3,"分布を描く回 k",{min:1,max:N,step:1,value:60,fmt:function(v){return v+" 回目";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=20;
    U.button(br,"本文の例（W/V = 0.01）",function(){smode.set(0);stw.set(0.02);stv.set(0.2);sfw.set(0.02);sfv.set(0.2);sma.set(17);smis.set(false);sk.set(60);seed=20;run();});
    U.button(br,"一定の値を W = 0 で",function(){smode.set(1);sfw.set(0);sk.set(2);seed=20;run();});
    U.button(br,"段差を W = 0 で",function(){smode.set(2);sfw.set(0);sk.set(120);seed=20;run();});
    U.button(br,"フィルタの √W を本当の値に合わせる",function(){sfw.set(smode.get()===0?stw.get():0);run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){var mode=smode.get(),sw=stw.get(),sv=stv.get(),W=Math.pow(sfw.get(),2),V=Math.pow(sfv.get(),2),Nm=sma.get();
      var d=_w20_kfdata(U,N,mode,seed,sw,sv),x=0,s=1e6,X=[],XP=[],SP=[],SS=[],HH=[],OK=[],MA=[],buf=[];
      for(var k=0;k<N;k++){var ok=!(smis.get()&&k+1>=121&&k+1<=150),sp=s+W,xp=x;XP.push(xp);SP.push(sp);OK.push(ok);
        if(ok){var h=sp/(sp+V);x=xp+h*(d.y[k]-xp);s=h*V;HH.push(h);buf.push(d.y[k]);if(buf.length>Nm)buf.shift();}else{s=sp;HH.push(0);}
        X.push(x);SS.push(s);var m=0;for(var i=0;i<buf.length;i++)m+=buf[i];MA.push(buf.length?m/buf.length:NaN);}
      R={d:d,X:X,XP:XP,SP:SP,SS:SS,HH:HH,OK:OK,MA:MA,W:W,V:V,mode:mode,sw:sw,sv:sv,Nm:Nm};draw();}
    function bell(P,mu,v,c,lw,dash,fill){var pts=[],sd=Math.sqrt(v);for(var i=0;i<=160;i++){var xx=P.xr[0]+(P.xr[1]-P.xr[0])*i/160,yy=Math.exp(-(xx-mu)*(xx-mu)/(2*v))/Math.sqrt(2*Math.PI*v);pts.push([P.X(xx),P.Y(Math.min(yy,P.yr[1]))]);}
      var o="";if(fill)o+=S.PL([[P.X(P.xr[0]),P.Y(0)]].concat(pts).concat([[P.X(P.xr[1]),P.Y(0)]]),"none",0,c,null,0.3);return o+S.PL(pts,c,lw,null,dash);}
    function draw(){if(!R)return;var nar=_w20_nar(box),Wd=nar?400:700,o=[],k=sk.get()-1,ks=[],i;for(i=1;i<=N;i++)ks.push(i);
      /* (1) 時間の列 */
      var lo=Infinity,hi=-Infinity;for(i=0;i<N;i++){lo=Math.min(lo,R.d.x[i]);hi=Math.max(hi,R.d.x[i]);}lo-=Math.max(0.35,2*R.sv);hi+=Math.max(0.35,2*R.sv);
      var px=nar?52:56,pw=nar?330:400,P=U.plot(px,24,pw,150,[0,N],[lo,hi]),o1=[];
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.6));
      o.push(P.axes({xt:[0,50,100,150,200,250,300],yt:U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),yfmt:function(v){return _w20_f(v,1);},sz:8.5,ylOff:38,yl:"温度 [°C]"}));
      o.push(S.T(P.x,P.y-6,"読み・本当の温度・推定（± 2√Σ の帯）","start",9.5,"ink",true));
      var band=[];for(i=0;i<N;i++)band.push([P.X(i+1),P.Y(Math.min(hi,R.X[i]+2*Math.sqrt(R.SS[i])))]);for(i=N-1;i>=0;i--)band.push([P.X(i+1),P.Y(Math.max(lo,R.X[i]-2*Math.sqrt(R.SS[i])))]);
      o.push(S.PL(band,"none",0,"signal",null,0.18));
      if(smis.get())o.push(S.RECT(P.X(120.5),P.y,P.X(150.5)-P.X(120.5),P.h,0,U.soft("alias"),"none",0,null,' fill-opacity="0.5"'));
      for(i=0;i<N;i++)if(R.OK[i]&&R.d.y[i]>=lo&&R.d.y[i]<=hi)o.push(S.D(P.X(i+1),P.Y(R.d.y[i]),"teal",1.4));
      o.push(P.line(ks.map(function(q,j){return [q,R.d.x[j]];}),"muted",1.3));
      o.push(P.clip(ks.map(function(q,j){return [q,R.MA[j]];}),"purple",1.6));
      o.push(P.clip(ks.map(function(q,j){return [q,R.X[j]];}),"signal",2.2));
      o.push(S.L(P.X(k+1),P.y,P.X(k+1),P.y+P.h,"alias",1,"3 3"));
      /* (2) ゲインと分散 */
      var Q=U.plot(px,206,pw,72,[0,N],[0,1]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"var(--screen)","line",0.6));
      o.push(Q.axes({xt:[0,50,100,150,200,250,300],yt:[0,0.5,1],xl:"回 k（1 s ごと）",sz:8.5,ylOff:38,yl:"ゲイン H_k"}));
      o.push(Q.clip(ks.map(function(q,j){return [q,R.HH[j]];}),"signal",1.8));
      o.push(S.L(Q.X(k+1),Q.y,Q.X(k+1),Q.y+Q.h,"alias",1,"3 3"));
      /* (3) k 回目の分布 */
      var bx=nar?52:500,by=nar?352:24,bw=nar?330:180,bh=nar?150:254,sd=Math.sqrt(Math.max(R.SP[k],R.V)),mu=(R.XP[k]+R.d.y[k])/2,half=Math.max(3*sd,0.3);
      var pk=1/Math.sqrt(2*Math.PI*Math.min(R.SS[k],R.SP[k],R.V)),B=U.plot(bx,by+44,bw,bh-44,[mu-half,mu+half],[0,pk*1.08]);
      o.push(S.RECT(B.x,B.y,B.w,B.h,0,"var(--screen)","line",0.6));
      o.push(B.axes({xt:[mu-half*0.6,mu,mu+half*0.6],yt:[],xfmt:function(v){return _w20_f(v,2);},grid:false,sz:8.5,xl:"温度 [°C]"}));
      o.push(S.T(bx,by-6+6,(k+1)+" 回目の分布","start",9.5,"ink",true));
      o.push(bell(B,R.XP[k],R.SP[k],"muted",1.6,"5 3",false));
      if(R.OK[k]){o.push(bell(B,R.d.y[k],R.V,"teal",1.6,null,false));o.push(S.L(B.X(R.d.y[k]),B.y+B.h,B.X(R.d.y[k]),B.y+B.h-8,"teal",2));}
      o.push(bell(B,R.X[k],R.SS[k],"signal",2.2,null,true));
      o.push(S.L(B.X(R.d.x[k]),B.y,B.X(R.d.x[k]),B.y+B.h,"ink",1,"2 2"));
      o.push(S.TX(bx,by+14,"破線: 予測 x̂^{−}　青緑: 読み","start",9,"muted"));o.push(S.TX(bx,by+28,"青: 更新 x̂　点線: 本当の温度","start",9,"muted"));
      o.push(S.LEGL(px,322,[["teal",null,"読み（点）"],["muted",null,"本当の温度"],["signal",null,"カルマンフィルタ"],["purple",null,"移動平均"]],9.5,10));
      box.set(S.svg(Wd,nar?by+bh+12:332,o));
      /* 読み出し */
      var e1=0,e2=0,n=0;for(i=49;i<N;i++){e1+=Math.pow(R.X[i]-R.d.x[i],2);e2+=Math.pow(R.MA[i]-R.d.x[i],2);n++;}
      var Wv=R.W,Vv=R.V,sm=Wv>0?(Wv+Math.sqrt(Wv*Wv+4*Wv*Vv))/2:0,Hs=Wv>0?sm/(sm+Vv):0;
      var h=(k+1)+" 回目: 予測 x̂<sup>−</sup> = "+_w20_f(R.XP[k],3)+" °C（分散 Σ<sup>−</sup> = "+_w20_g(R.SP[k],3)+" K²）";
      h+=R.OK[k]?"、読み y = "+_w20_f(R.d.y[k],3)+" °C、イノベーション "+_w20_f(R.d.y[k]-R.XP[k],3)+" K、ゲイン H<sub>k</sub> = <b>"+_w20_g(R.HH[k],3)+"</b>、更新 x̂ = <b>"+_w20_f(R.X[k],3)+" °C</b>（分散 "+_w20_g(R.SS[k],3)+" K²）":'、<span class="warn">読めない回なので予測だけ</span>（分散は W だけ増える）';
      h+="<br>定常のゲイン（式）: "+(Wv>0?"<b>"+_w20_g(Hs,3)+"</b>（W/V = "+_w20_g(Wv/Vv,3)+"、一次の IIR の時定数 "+_w20_g(-1/Math.log(1-Hs),3)+" s）、推定誤差の標準偏差の式 √(HV) = "+_w20_g(Math.sqrt(Hs*Vv),3)+" K":"W = 0 なので一定にならない（H<sub>k</sub> = 1/k に近づく）");
      h+="<br>50〜300 回目の推定誤差（この乱数の列）: カルマンフィルタ <b>"+_w20_g(Math.sqrt(e1/n),3)+" K</b>、移動平均（N = "+R.Nm+"） <b>"+_w20_g(Math.sqrt(e2/n),3)+" K</b>";
      if(R.mode===0){var Nm=R.Nm,ma=Math.sqrt(R.sw*R.sw*(Nm-1)*(2*Nm-1)/(6*Nm)+R.sv*R.sv/Nm);h+="（ランダムウォークの式では、移動平均 "+_w20_g(ma,3)+" K）";}
      ro.innerHTML=h+'<div class="wnote">本文の C のコードと同じ式（初めの分散 Σ<sub>0</sub> = 10<sup>6</sup> K²）。乱数の種 '+seed+'（本文の図は種 20）。山は、推定の確からしさを正規分布の形で描いたもの。</div>';
    }
    run();
  };

  /* ---- 6 節: 倒立振子を、位置と角度だけを測って立てる ---- */
  var _W20_PM=0.5,_W20_Pm=0.2,_W20_Pl=0.3,_W20_Pg=9.81,_W20_D2R=Math.PI/180,_W20_TS=0.001,_W20_SP=0.001,_W20_SPH=0.1*Math.PI/180,_W20_SA=0.3,_W20_SAL=3,_W20_MD=null;
  /* 倒立振子のモデル（17 章 2 節）と、19 章 4 節の最適レギュレータの F、1 ms の離散化 */
  function _w20_pmodel(U){if(_W20_MD)return _W20_MD;var M=U.ctl.mat,Mm=_W20_PM,m=_W20_Pm,l=_W20_Pl,g=_W20_Pg;
    var A=[[0,1,0,0],[0,0,-m*g/Mm,0],[0,0,0,1],[0,0,(Mm+m)*g/(Mm*l),0]],B=[[0],[1/Mm],[0],[-1/(Mm*l)]],C=[[1,0,0,0],[0,0,1,0]];
    var F=M.lqr(A,B,[[4,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],[[0.04]]).F,d=M.c2d(A,B,_W20_TS),gd=M.c2d(A,[[0,0],[1,0],[0,0],[0,1]],_W20_TS);
    _W20_MD={A:A,B:B,C:C,F:F,Ad:d.A,Bd:d.B,Gd:gd.B,V:[[_W20_SP*_W20_SP,0],[0,_W20_SPH*_W20_SPH]]};return _W20_MD;}
  /* 予測と更新の形のオブザーバ: (I − HC)A_d の固有値を、台車の 2 つと振子の 2 つとも e^{−wo T_s} に置く（台車の位置で台車の 2 状態を、振子の角度で振子の 2 状態を直す） */
  function _w20_pobs(U,wo){var M=U.ctl.mat,md=_w20_pmodel(U),H=[[0,0],[0,0],[0,0],[0,0]],z=Math.exp(-wo*_W20_TS);
    [[0,0],[2,1]].forEach(function(q){var i0=q[0],Ab=[[md.Ad[i0][i0],md.Ad[i0][i0+1]],[md.Ad[i0+1][i0],md.Ad[i0+1][i0+1]]],cA=[[Ab[0][0]],[Ab[0][1]]];
      var h=M.acker(M.T(Ab),cA,[U.ctl.c(z,0),U.ctl.c(z,0)]);H[i0][q[1]]=h[0][0];H[i0+1][q[1]]=h[0][1];});
    return H;}
  /* 定常のカルマンゲイン（W を sc 倍）。離散時間のリッカチ方程式を双対の形で解く */
  function _w20_pkf(U,sc){var M=U.ctl.mat,md=_w20_pmodel(U),W=M.mul(M.mul(md.Gd,[[_W20_SA*_W20_SA*sc,0],[0,_W20_SAL*_W20_SAL*sc]]),M.T(md.Gd));
    var P=M.dare(M.T(md.Ad),M.T(md.C),W,md.V);return M.mul(M.mul(P,M.T(md.C)),M.inv(M.add(M.mul(M.mul(md.C,P),M.T(md.C)),md.V)));}
  /* 推定誤差の極（(I − HC)A_d の固有値を s = ln z / T_s で s 平面に写す） */
  function _w20_pestpoles(U,H){var M=U.ctl.mat,md=_w20_pmodel(U),E=M.mul(M.sub(M.eye(4),M.mul(H,md.C)),md.Ad);
    return M.eig(E).map(function(z){return U.ctl.c(Math.log(Math.hypot(z.re,z.im))/_W20_TS,Math.atan2(z.im,z.re)/_W20_TS);});}
  /* 線形でない式（17 章 2 節）を 4 次のルンゲ・クッタ法で解き、1 ms ごとに測って推定し u = −F x̂ を出す（図と同じ計算）。
     o = {kind: "ideal"・"diff"・"est", H, tau, x0, T, seed, noise, proc, push:[開始,長さ,力], umax, kg（対象が受ける力の倍率）, sub}
     乱数は周期ごとに 位置のノイズ・角度のノイズ・台車の加速度・振子の角加速度 の順に引く */
  function _w20_prun(U,o){var md=_w20_pmodel(U),Mm=_W20_PM,m=_W20_Pm,l=_W20_Pl,g=_W20_Pg,Ts=_W20_TS,sub=o.sub||1,h=Ts/sub,rg=U.rng(o.seed),f=md.F[0],Ad=md.Ad,Bd=md.Bd,H=o.H;
    var n=Math.round(o.T/Ts),p=o.x0[0],pd=o.x0[1],ph=o.x0[2],phd=o.x0[3],a=o.tau>0?o.tau/(o.tau+Ts):0,xh=null,yp=null,vf=[0,0],u=0,kg=o.kg==null?1:o.kg;
    var r={t:[],x:[[],[],[],[]],xh:[[],[],[],[]],u:[],fell:null};
    function der(p,pd,ph,phd,uu,fd,ap,aal){var s=Math.sin(ph),c=Math.cos(ph),pdd=(uu+fd-m*g*s*c-fd*c*c+m*l*phd*phd*s)/(Mm+m*s*s);return [pd,pdd+ap,phd,(g*s-pdd*c+fd/m*c)/l+aal];}
    for(var k=0;k<=n;k++){var e1=rg.normal(),e2=rg.normal(),y0=p+o.noise*_W20_SP*e1,y1=ph+o.noise*_W20_SPH*e2;
      if(o.kind==="ideal")xh=[p,pd,ph,phd];
      else if(o.kind==="diff"){if(!yp)yp=[y0,y1];vf=[a*vf[0]+(1-a)*(y0-yp[0])/Ts,a*vf[1]+(1-a)*(y1-yp[1])/Ts];yp=[y0,y1];xh=[y0,vf[0],y1,vf[1]];}
      else{var xp;if(!xh)xp=[y0,0,y1,0];else{xp=[0,0,0,0];for(var i=0;i<4;i++){var sm=Bd[i][0]*u;for(var j=0;j<4;j++)sm+=Ad[i][j]*xh[j];xp[i]=sm;}}
        var q0=y0-xp[0],q1=y1-xp[2];xh=[xp[0]+H[0][0]*q0+H[0][1]*q1,xp[1]+H[1][0]*q0+H[1][1]*q1,xp[2]+H[2][0]*q0+H[2][1]*q1,xp[3]+H[3][0]*q0+H[3][1]*q1];}
      u=-(f[0]*xh[0]+f[1]*xh[1]+f[2]*xh[2]+f[3]*xh[3]);if(o.umax!=null)u=Math.max(-o.umax,Math.min(o.umax,u));
      r.t.push(k*Ts);r.x[0].push(p);r.x[1].push(pd);r.x[2].push(ph);r.x[3].push(phd);for(var q=0;q<4;q++)r.xh[q].push(xh[q]);r.u.push(u);
      if(k===n)break;
      var ap=o.proc*_W20_SA*rg.normal(),aal=o.proc*_W20_SAL*rg.normal(),tm=(k+0.5)*Ts,fd=(o.push&&tm>=o.push[0]&&tm<o.push[0]+o.push[1])?o.push[2]:0,ua=kg*u;
      for(var st=0;st<sub;st++){var k1=der(p,pd,ph,phd,ua,fd,ap,aal),k2=der(p+h/2*k1[0],pd+h/2*k1[1],ph+h/2*k1[2],phd+h/2*k1[3],ua,fd,ap,aal),
          k3=der(p+h/2*k2[0],pd+h/2*k2[1],ph+h/2*k2[2],phd+h/2*k2[3],ua,fd,ap,aal),k4=der(p+h*k3[0],pd+h*k3[1],ph+h*k3[2],phd+h*k3[3],ua,fd,ap,aal);
        p+=h/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]);pd+=h/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1]);ph+=h/6*(k1[2]+2*k2[2]+2*k3[2]+k4[2]);phd+=h/6*(k1[3]+2*k2[3]+2*k3[3]+k4[3]);}
      if(Math.abs(ph)>Math.PI/2||!isFinite(ph)){r.fell=(k+1)*Ts;break;}}
    return r;}
  /* 閉ループ（線形化した式、1 ms ごと）の行列と、測定のノイズが入る行列、力を取り出す行 */
  function _w20_pcl(U,kind,H,tau){var M=U.ctl.mat,md=_w20_pmodel(U),Ad=md.Ad,Bd=md.Bd,F=md.F,C=md.C,Ts=_W20_TS,i,j;
    if(kind==="est"){var BF=M.mul(Bd,F),HCA=M.mul(M.mul(H,C),Ad),Phi=M.zeros(8,8),G=M.zeros(8,2),R22=M.sub(M.sub(Ad,BF),HCA);
      for(i=0;i<4;i++)for(j=0;j<4;j++){Phi[i][j]=Ad[i][j];Phi[i][4+j]=-BF[i][j];Phi[4+i][j]=HCA[i][j];Phi[4+i][4+j]=R22[i][j];}
      for(i=0;i<4;i++){G[4+i][0]=H[i][0];G[4+i][1]=H[i][1];}return {Phi:Phi,G:G,Fz:[[0,0,0,0,-F[0][0],-F[0][1],-F[0][2],-F[0][3]]]};}
    var a=tau>0?tau/(tau+Ts):0,Fp=[[F[0][0],F[0][2]]],Fv=[[F[0][1],F[0][3]]],rowx=M.zeros(4,8),Pp=M.mul(Bd,Fp),Pv=M.mul(Bd,Fv);
    for(i=0;i<4;i++){for(j=0;j<4;j++)rowx[i][j]=Ad[i][j];rowx[i][4]=-Pp[i][0];rowx[i][5]=-Pp[i][1];rowx[i][6]=-Pv[i][0];rowx[i][7]=-Pv[i][1];}
    var rowy=M.mul(C,rowx),Phi2=M.zeros(8,8),G2=M.zeros(8,2);
    for(i=0;i<4;i++)for(j=0;j<8;j++)Phi2[i][j]=rowx[i][j];
    for(i=0;i<2;i++)for(j=0;j<8;j++){Phi2[4+i][j]=rowy[i][j];Phi2[6+i][j]=(1-a)/Ts*rowy[i][j];}
    for(i=0;i<2;i++){Phi2[6+i][4+i]+=-(1-a)/Ts;Phi2[6+i][6+i]+=a;G2[4+i][i]=1;G2[6+i][i]=(1-a)/Ts;}
    return {Phi:Phi2,G:G2,Fz:[[0,0,0,0,-Fp[0][0],-Fp[0][1],-Fv[0][0],-Fv[0][1]]]};}
  /* 入力の点で切った一巡伝達関数 L(z)（z = e^{jωT_s}）。複素数の連立方程式は、実部と虚部を並べた実数の式で解く */
  function _w20_csolve(M,Ar,Ai,Br,Bi){var n=Ar.length,m=Br[0].length,Mx=M.zeros(2*n,2*n),R=M.zeros(2*n,2*m),i,j;
    for(i=0;i<n;i++)for(j=0;j<n;j++){Mx[i][j]=Ar[i][j];Mx[i][n+j]=-Ai[i][j];Mx[n+i][j]=Ai[i][j];Mx[n+i][n+j]=Ar[i][j];}
    for(i=0;i<n;i++)for(j=0;j<m;j++){R[i][j]=Br[i][j];R[n+i][j]=Bi[i][j];}
    var X=M.solve(Mx,R),xr=M.zeros(n,m),xi=M.zeros(n,m);for(i=0;i<n;i++)for(j=0;j<m;j++){xr[i][j]=X[i][j];xi[i][j]=X[n+i][j];}return {re:xr,im:xi};}
  function _w20_ploop(U,kind,H,tau){var M=U.ctl.mat,md=_w20_pmodel(U),Ad=md.Ad,Bd=md.Bd,F=md.F,C=md.C,Ts=_W20_TS,I=M.eye(4);
    var Phc=kind==="est"?M.mul(M.sub(I,M.mul(H,C)),M.sub(Ad,M.mul(Bd,F))):null,a=tau>0?tau/(tau+Ts):0;
    return function(w){var zr=Math.cos(w*Ts),zi=Math.sin(w*Ts),Zr=M.sub(M.scale(I,zr),Ad),Zi=M.scale(I,zi);
      var Pz=_w20_csolve(M,Zr,Zi,Bd,M.zeros(4,1)),pr=M.mul(C,Pz.re),pi=M.mul(C,Pz.im);
      if(kind==="ideal"){var lr=M.mul(F,Pz.re)[0][0],li=M.mul(F,Pz.im)[0][0];return U.ctl.c(lr,li);}
      if(kind==="diff"){var cx=U.ctl.cx,z=U.ctl.c(zr,zi),one=U.ctl.c(1,0),D=cx.scale(cx.div(cx.sub(one,cx.inv(z)),cx.sub(one,cx.scale(cx.inv(z),a))),(1-a)/Ts);
        var Pp=U.ctl.c(pr[0][0],pi[0][0]),Pf=U.ctl.c(pr[1][0],pi[1][0]);
        return cx.add(cx.add(cx.scale(Pp,F[0][0]),cx.mul(cx.scale(D,F[0][1]),Pp)),cx.add(cx.scale(Pf,F[0][2]),cx.mul(cx.scale(D,F[0][3]),Pf)));}
      var Kr=M.sub(M.scale(I,zr),Phc),Ki=M.scale(I,zi),Hr=M.scale(H,zr),Hi=M.scale(H,zi),Kx=_w20_csolve(M,Kr,Ki,Hr,Hi);
      var kr=M.mul(F,Kx.re),ki=M.mul(F,Kx.im);/* 1 行 2 列 × 2 行 1 列 */
      return U.ctl.c(kr[0][0]*pr[0][0]-ki[0][0]*pi[0][0]+kr[0][1]*pr[1][0]-ki[0][1]*pi[1][0],kr[0][0]*pi[0][0]+ki[0][0]*pr[0][0]+kr[0][1]*pi[1][0]+ki[0][1]*pr[1][0]);};}
  function _w20_pmargins(U,L){var ws=U.ctl.logspace(-1,Math.log10(Math.PI/_W20_TS*0.999),1500),Ls=ws.map(L),pm=null,wgc=null,lo=0,hi=Infinity,dmin=Infinity,i;
    function mag(w){var v=L(w);return Math.hypot(v.re,v.im)-1;}
    for(i=0;i<ws.length;i++)dmin=Math.min(dmin,Math.hypot(1+Ls[i].re,Ls[i].im));
    for(i=1;i<ws.length;i++){var m0=Math.hypot(Ls[i-1].re,Ls[i-1].im)-1,m1=Math.hypot(Ls[i].re,Ls[i].im)-1;
      if(m0*m1<=0){var a=ws[i-1],b=ws[i],fa=m0;for(var it=0;it<40;it++){var mm=Math.sqrt(a*b),fm=mag(mm);if((fa<0)===(fm<0)){a=mm;fa=fm;}else b=mm;}
        var w=Math.sqrt(a*b),v=L(w),p=180-Math.abs(Math.atan2(v.im,v.re)*180/Math.PI);if(pm===null||p<pm){pm=p;wgc=w;}}
      if(Ls[i-1].im*Ls[i].im<=0&&Ls[i].re<0){var x=Ls[i-1].re+(Ls[i].re-Ls[i-1].re)*(Ls[i-1].im/(Ls[i-1].im-Ls[i].im));if(x<-1)lo=Math.max(lo,-1/x);else if(x>-1)hi=Math.min(hi,-1/x);}}
    return {pm:pm,wgc:wgc,lo:lo,hi:hi,dmin:dmin};}

  REG.w20_lqg=function(el,U){
    var S=U.S,M=U.ctl.mat,TS=_W20_TS,EV=5;
    U.head(el,"ESTIMATE AND STAND","倒立振子を、台車の位置と振子の角度だけを測って立てる");
    var r1=U.ctrls(el);
    var sest=U.select(r1,"推定のしかた",["すべての状態を測る（19 章）","差分＋一次遅れ","オブザーバ","カルマンフィルタ"],3,function(){fix();prep();});
    var stau=U.slider(r1,"ならす一次遅れの時定数",{values:[0,0.002,0.005,0.01,0.02,0.05,0.1,0.2],value:0.02,fmt:function(v){return v?_w20_g(v*1000,3)+" ms":"0（差分のまま）";},onInput:function(){prep();}});
    var swo=U.slider(r1,U.htx("推定の極 −ω_o の ω_o"),{values:[8,10,15,20,30,40,60,80,100],value:20,fmt:function(v){return v+" rad/s";},onInput:function(){prep();}});
    var ssc=U.slider(r1,"W の倍率（乱れの見積もり）",{values:[0.01,0.03,0.1,0.3,1,3,10,30,100,300,1000],value:1,fmt:function(v){return v+" 倍";},onInput:function(){prep();}});
    var r2=U.ctrls(el);
    var stst=U.select(r2,"試験",["おもりを右へ 1 N で 0.1 s 押す","10° 傾けて静かに放す","立てておく"],0,function(){run();});
    var skg=U.slider(r2,"対象が受ける力の倍率",{min:0.3,max:5,log:true,value:1,fmt:function(v){return _w20_g(v,3)+" 倍";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var cno=U.checkbox(r3,"観測ノイズ（1 mm・0.1°）",false,function(){run();});
    var cpr=U.checkbox(r3,"乱れ（でたらめな加速度 0.3 m/s²・3 rad/s²）",false,function(){run();});
    var cum=U.checkbox(r3,"力の上限 5 N",false,function(){run();});
    var r4=U.ctrls(el);
    var st=U.slider(r4,"時刻 t",{min:0,max:4,step:0.01,value:0.6,fmt:function(v){return _w20_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el),seed=20;
    var tk=U.ticker(function(){var T=R?R.T:4,t=st.get()+0.02;if(t>=T){t=T;tk.stop();}st.set(t);draw();},40);
    U.button(br,"▶ 再生",function(){if(R&&st.get()>=R.T-0.001)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(e,par,ts,no,pr,um,kg){tk.stop();sest.set(e);if(e===1)stau.set(par);if(e===2)swo.set(par);if(e===3)ssc.set(par);stst.set(ts);cno.set(no);cpr.set(pr);cum.set(um);skg.set(kg);st.set(0.6);seed=20;fix();prep();}
    U.button(br,"本文の例（カルマンフィルタで押す）",function(){pre(3,1,0,false,false,false,1);});
    U.button(br,"オブザーバ −20 で押す",function(){pre(2,20,0,false,false,false,1);});
    U.button(br,"差分 20 ms で押す",function(){pre(1,0.02,0,false,false,false,1);});
    U.button(br,"差分のまま・上限 5 N（立てておく）",function(){pre(1,0,2,true,false,true,1);});
    U.button(br,"カルマンフィルタで力が 3.7 倍",function(){pre(3,1,1,false,false,false,3.7);});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,D=null;
    function fix(){var e=sest.get();stau.el.style.display=e===1?"":"none";swo.el.style.display=e===2?"":"none";ssc.el.style.display=e===3?"":"none";}
    /* 推定の設計が変わったときだけ計算する: ゲイン・推定の極・力のノイズ（分散の式）・余裕 */
    function prep(){var e=sest.get(),kind=e===0?"ideal":(e===1?"diff":"est"),H=e===2?_w20_pobs(U,swo.get()):(e===3?_w20_pkf(U,ssc.get()):null),tau=stau.get();
      var fs=0;if(kind!=="ideal"){var cl=_w20_pcl(U,kind,H,tau),md=_w20_pmodel(U),Sg=_w20_lyap(M,cl.Phi,M.mul(M.mul(cl.G,md.V),M.T(cl.G)));fs=Math.sqrt(M.mul(M.mul(cl.Fz,Sg),M.T(cl.Fz))[0][0]);}
      D={kind:kind,H:H,tau:tau,fs:fs,wo:e===2?swo.get():null,poles:H?_w20_pestpoles(U,H):null,mg:_w20_pmargins(U,_w20_ploop(U,kind,H,tau))};run();}
    function run(){if(!D)return;var ts=stst.get(),T=ts===2?6:4,x0=ts===1?[0,0,10*_W20_D2R,0]:[0,0,0,0];
      var r=_w20_prun(U,{kind:D.kind,H:D.H,tau:D.tau,x0:x0,T:T,seed:seed,noise:cno.get()?1:0,proc:cpr.get()?1:0,push:ts===0?[0.5,0.1,1.0]:null,umax:cum.get()?5:null,kg:skg.get()});
      R={r:r,T:T,ts:ts};st.el.querySelector("input").max=T;draw();}
    function col(a,s,ev){var o=[];for(var i=0;i<a.length;i+=ev)o.push(a[i]*s);return o;}
    function draw(){if(!R)return;var nar=_w20_nar(box),Wd=nar?400:700,o=[],r=R.r,n=r.t.length,k=Math.min(n-1,Math.round(st.get()/TS)),tc=r.t[k];
      /* 動く絵 */
      var ax=nar?10:8,aw=nar?380:330,gy=nar?168:176,sc=nar?220:200,Lr=nar?92:100,cx0=ax+aw/2;
      o.push(S.T(ax,14,"動く絵（振子の長さは拡大して描いた）","start",9.5,"muted"));
      o.push(_w20_ground(S,ax,ax+aw,gy));o.push(S.L(cx0,gy+2,cx0,gy+12,"faint",1));o.push(S.T(cx0,gy+24,"p = 0","middle",9,"muted"));
      var px=cx0+Math.max(-aw/2+28,Math.min(aw/2-28,r.x[0][k]*sc)),pxh=cx0+Math.max(-aw/2+28,Math.min(aw/2-28,r.xh[0][k]*sc));
      if(D.kind!=="ideal")o.push(_w20_pend(S,U,pxh,gy,r.xh[2][k],"green",Lr,true));
      o.push(_w20_pend(S,U,px,gy,r.x[2][k],"signal",Lr,false));
      var uu=r.u[k];if(Math.abs(uu)>0.02){var dir=uu>0?1:-1,xa=px-dir*(26+38),len=Math.min(34,8+6*Math.abs(uu));o.push(S.ARR(xa,gy-20,xa+dir*len,gy-20,"gold",2.4));o.push(S.T(xa+dir*len/2,gy-26,"u","middle",11,"gold",true));}
      if(R.ts===0&&tc>=0.5&&tc<0.6){var bx=px+Lr*Math.sin(r.x[2][k]),by=gy-30-Lr*Math.cos(r.x[2][k]);o.push(S.ARR(bx-40,by,bx-10,by,"purple",2.2));o.push(S.T(bx-42,by-6,"押す","end",9.5,"purple",true));}
      if(r.fell!=null&&tc>=r.fell-1e-9)o.push(S.T(ax+aw-4,30,"倒れた（90°）","end",10,"alias",true,false,null,true));
      o.push(S.T(ax+aw,gy+40,"t = "+_w20_f(tc,2)+" s","end",10,"ink",true));
      if(D.kind!=="ideal")o.push(S.T(ax,gy+40,"破線: 推定した状態","start",9.5,"green"));
      /* 波形 */
      var t=col(r.t,1,EV),ph=col(r.x[2],1/_W20_D2R,EV),pp=col(r.x[0],100,EV),u=col(r.u,1,EV),wd=col(r.x[3],1/_W20_D2R,EV),wh=col(r.xh[3],1/_W20_D2R,EV),T=R.T;
      var gx=nar?52:400,gw=nar?330:280,gh=nar?72:62,gy0=nar?gy+64:22,dy=gh+28;
      var rph=_w20_range([ph],0.08,2),rp=_w20_range([pp],0.08,2),ru=_w20_range([u],0.08,1),rw=_w20_range([wd,wh],0.08,10);
      if(D.kind==="diff"&&D.tau<0.004){rw=_w20_range([wd],0.3,20);}
      o.push(_w20_wave(S,U,gx,gy0,gw,gh,T,rph[0],rph[1],"角度 φ [°]",[[t,ph,"signal"]],tc,false).svg);
      o.push(_w20_wave(S,U,gx,gy0+dy,gw,gh,T,rp[0],rp[1],"台車の位置 p [cm]",[[t,pp,"signal"]],tc,false).svg);
      var wu=_w20_wave(S,U,gx,gy0+2*dy,gw,gh,T,Math.min(ru[0],cum.get()?-5.5:ru[0]),Math.max(ru[1],cum.get()?5.5:ru[1]),"力 u [N]",[[t,u,"gold",null,1.4]],tc,false);o.push(wu.svg);
      if(cum.get()){o.push(S.L(wu.P.x,wu.P.Y(5),wu.P.x+wu.P.w,wu.P.Y(5),"alias",1,"3 3"));o.push(S.L(wu.P.x,wu.P.Y(-5),wu.P.x+wu.P.w,wu.P.Y(-5),"alias",1,"3 3"));}
      o.push(_w20_wave(S,U,gx,gy0+3*dy,gw,gh,T,rw[0],rw[1],"角速度 "+"[°/s]（青: 本当、緑: 推定）",[[t,wh,"green",null,1.2],[t,wd,"signal",null,1.8]],tc,true).svg);
      box.set(S.svg(Wd,nar?gy0+4*dy+18:Math.max(gy+50,gy0+4*dy+18),o));
      /* 読み出し */
      var md=_w20_pmodel(U),h="",mm=_w20_minmax(ph),pm=_w20_maxabs(pp);
      if(D.kind==="ideal")h+="推定なし: 4 つの状態を誤差なく使う（19 章 4 節の最適レギュレータ F = ["+md.F[0].map(function(v){return _w20_g(v,4);}).join(", ")+"]）<br>";
      else if(D.kind==="diff")h+="差分を時定数 "+(D.tau?_w20_g(D.tau*1000,3)+" ms":"0（ならさない）")+" の一次遅れでならした速度と角速度を使う<br>";
      else h+="H = [["+D.H.map(function(rw2){return rw2.map(function(v){return _w20_g(v,3);}).join(", ");}).join("], [")+"]]（予測と更新の形、1 ms ごと）<br>推定誤差の極: <b>"+(D.wo!=null?"−"+D.wo+" が 4 つ（台車の側と振子の側に 2 つずつ置いた）":_w20_poles(D.poles))+"</b><br>";
      h+="力のノイズの標準偏差（分散の式、測定のノイズだけ）: <b>"+(D.kind==="ideal"?"0":_w20_g(D.fs,3)+" N")+"</b>";
      if(cno.get()||cpr.get()){var i0=Math.round(1/TS),us=r.u.slice(i0);h+="、この乱数の列での力の揺れ（1 s 以後）: "+_w20_g(_w20_std(us,0),3)+" N";}
      h+="<br>角度 "+_w20_f(mm[0],2)+"〜"+_w20_f(mm[1],2)+"°、台車が動く最大の距離 "+_w20_g(pm,3)+" cm、最大の力 "+_w20_g(_w20_maxabs(r.u),3)+" N";
      if(r.fell!=null)h+=' <span class="warn">'+_w20_f(r.fell,2)+" s に倒れた</span>";
      var g=D.mg;h+="<br>入力の点で切ったループの余裕: 位相余裕 <b>"+(g.pm!=null?_w20_f(g.pm,1)+"°":"−")+"</b>、安定な力の倍率 <b>"+_w20_g(g.lo,3)+"〜"+(isFinite(g.hi)&&g.hi<1000?_w20_g(g.hi,3):"∞")+" 倍</b>、−1 からの最短距離 "+_w20_g(g.dmin,2);
      if(skg.get()<g.lo||skg.get()>g.hi)h+=' <span class="warn">いまの力の倍率 '+_w20_g(skg.get(),3)+" 倍は安定な範囲の外</span>";
      ro.innerHTML=h+'<div class="wnote">線形でない式（17 章 2 節）を 4 次のルンゲ・クッタ法で 1 ms 刻みで解き、1 ms ごとに測って推定し、力を出した（計算にかかる時間は無視）。推定は計算した力を使い、対象は「力の倍率」倍の力を受ける。おもりを押すのは 0.5 s から。乱数の種 '+seed+'。</div>';
    }
    fix();prep();
  };
