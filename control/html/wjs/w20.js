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
      var d=_w20_kfdata(U,N,mode,seed,sw,sv),x=0,s=1e9,X=[],XP=[],SP=[],SS=[],HH=[],OK=[],MA=[],buf=[];
      for(var k=0;k<N;k++){var ok=!(smis.get()&&k+1>=121&&k+1<=150),sp=s+W,xp=x;XP.push(xp);SP.push(sp);OK.push(ok);
        if(ok){var h=sp/(sp+V);x=xp+h*(d.y[k]-xp);s=(1-h)*sp;HH.push(h);buf.push(d.y[k]);if(buf.length>Nm)buf.shift();}else{s=sp;HH.push(0);}
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
      var bx=nar?52:500,by=nar?330:24,bw=nar?330:180,bh=nar?150:254,sd=Math.sqrt(Math.max(R.SP[k],R.V)),mu=(R.XP[k]+R.d.y[k])/2,half=Math.max(3*sd,0.3);
      var pk=1/Math.sqrt(2*Math.PI*Math.min(R.SS[k],R.SP[k],R.V)),B=U.plot(bx,by+44,bw,bh-44,[mu-half,mu+half],[0,pk*1.08]);
      o.push(S.RECT(B.x,B.y,B.w,B.h,0,"var(--screen)","line",0.6));
      o.push(B.axes({xt:[mu-half*0.6,mu,mu+half*0.6],yt:[],xfmt:function(v){return _w20_f(v,2);},grid:false,sz:8.5,xl:"温度 [°C]"}));
      o.push(S.T(bx,by-6+6,(k+1)+" 回目の分布","start",9.5,"ink",true));
      o.push(bell(B,R.XP[k],R.SP[k],"muted",1.6,"5 3",false));
      if(R.OK[k]){o.push(bell(B,R.d.y[k],R.V,"teal",1.6,null,false));o.push(S.L(B.X(R.d.y[k]),B.y+B.h,B.X(R.d.y[k]),B.y+B.h-8,"teal",2));}
      o.push(bell(B,R.X[k],R.SS[k],"signal",2.2,null,true));
      o.push(S.L(B.X(R.d.x[k]),B.y,B.X(R.d.x[k]),B.y+B.h,"ink",1,"2 2"));
      o.push(S.TX(bx,by+14,"破線: 予測 x̂^{−}　青緑: 読み","start",9,"muted"));o.push(S.TX(bx,by+28,"青: 更新 x̂　点線: 本当の温度","start",9,"muted"));
      o.push(S.LEGL(px,(nar?300:300),[["teal",null,"読み（点）"],["muted",null,"本当の温度"],["signal",null,"カルマンフィルタ"],["purple",null,"移動平均"]],9.5,10));
      box.set(S.svg(Wd,nar?by+bh+12:310,o));
      /* 読み出し */
      var e1=0,e2=0,n=0;for(i=49;i<N;i++){e1+=Math.pow(R.X[i]-R.d.x[i],2);e2+=Math.pow(R.MA[i]-R.d.x[i],2);n++;}
      var Wv=R.W,Vv=R.V,sm=Wv>0?(Wv+Math.sqrt(Wv*Wv+4*Wv*Vv))/2:0,Hs=Wv>0?sm/(sm+Vv):0;
      var h=(k+1)+" 回目: 予測 x̂<sup>−</sup> = "+_w20_f(R.XP[k],3)+" °C（分散 Σ<sup>−</sup> = "+_w20_g(R.SP[k],3)+" K²）";
      h+=R.OK[k]?"、読み y = "+_w20_f(R.d.y[k],3)+" °C、イノベーション "+_w20_f(R.d.y[k]-R.XP[k],3)+" K、ゲイン H<sub>k</sub> = <b>"+_w20_g(R.HH[k],3)+"</b>、更新 x̂ = <b>"+_w20_f(R.X[k],3)+" °C</b>（分散 "+_w20_g(R.SS[k],3)+" K²）":'、<span class="warn">読めない回なので予測だけ</span>（分散は W だけ増える）';
      h+="<br>定常のゲイン（式）: "+(Wv>0?"<b>"+_w20_g(Hs,3)+"</b>（W/V = "+_w20_g(Wv/Vv,3)+"、一次の IIR の時定数 "+_w20_g(-1/Math.log(1-Hs),3)+" s）、推定誤差の標準偏差の式 √(HV) = "+_w20_g(Math.sqrt(Hs*Vv),3)+" K":"W = 0 なので一定にならない（H<sub>k</sub> = 1/k に近づく）");
      h+="<br>50〜300 回目の推定誤差（この乱数の列）: カルマンフィルタ <b>"+_w20_g(Math.sqrt(e1/n),3)+" K</b>、移動平均（N = "+R.Nm+"） <b>"+_w20_g(Math.sqrt(e2/n),3)+" K</b>";
      if(R.mode===0){var Nm=R.Nm,ma=Math.sqrt(R.sw*R.sw*(Nm-1)*(2*Nm-1)/(6*Nm)+R.sv*R.sv/Nm);h+="（ランダムウォークの式では、移動平均 "+_w20_g(ma,3)+" K）";}
      ro.innerHTML=h+'<div class="wnote">本文の C のコードと同じ式（初めの分散 Σ<sub>0</sub> = 10<sup>9</sup> K²）。乱数の種 '+seed+'（本文の図は種 20）。山は、推定の確からしさを正規分布の形で描いたもの。</div>';
    }
    run();
  };
