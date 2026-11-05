  /* ===== 14 章 フィードフォワード・カスケード・むだ時間補償 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w14_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w14_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w14_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* |y − yf| が band の外に最後にいた後の時刻（線形補間）。入らなければ null */
  function _w14_settle(t,y,yf,band,from){from=from||0;var last=-1;for(var i=0;i<y.length;i++)if(t[i]>=from&&Math.abs(y[i]-yf)>band)last=i;
    if(last<0)return from;if(last+1>=t.length)return null;var a=Math.abs(y[last]-yf)-band,b=Math.abs(y[last+1]-yf)-band;return a!==b?t[last]+(t[last+1]-t[last])*a/(a-b):t[last+1];}
  function _w14_trapz(t,f,t0,t1){var s=0;for(var i=1;i<t.length;i++){if(t[i-1]<t0||t[i]>t1)continue;s+=0.5*(f[i]+f[i-1])*(t[i]-t[i-1]);}return s;}

  /* ---- 温度の板（60 °C・28 W からのずれ）: P = K e^{−Ls}/(Ts + 1)。図の _f14_plate と同じ計算 ----
     o = {KP, TI, b, r(t), d(t), dff(t), tEnd, h, Lt, Kt, Tt（本当の対象）, smith, Lm, Km, Tm（モデル）, ref（前置フィルタの λ）, umin, umax, every}
     smith なら、戻す値は y_p = y + ỹ0 − ỹ0(t − Lm)。ref なら、目標値を e^{−Lm s}/(λs + 1) に通し、Q r を足す。
     飽和するときは、積分をクランプで止める。返り値 {t, y, u, yp, y0, blow} */
  function _w14_plate(o){
    var h=o.h||0.1,n=Math.round(o.tEnd/h),Lt=o.Lt==null?20:o.Lt,Lm=o.Lm==null?20:o.Lm,nd=Math.round(Lt/h),ndm=Math.round(Lm/h);
    var Tt=o.Tt||500,Kt=o.Kt==null?1.25:o.Kt,Tm=o.Tm||500,Km=o.Km||1.25,KP=o.KP||0,TI=o.TI||0,b=o.b==null?1:o.b,ev=o.every||10;
    var a=Math.exp(-h/Tt),bb=Kt*(1-a),am=Math.exp(-h/Tm),bm=Km*(1-am),al=o.ref?Math.exp(-h/o.ref):0,alh=o.ref?Math.exp(-h/(2*o.ref)):0;
    var x=0,I=0,buf=new Float64Array(Math.max(nd,1)),bi=0,xm=0,bufm=new Float64Array(Math.max(ndm,1)),bim=0,z=0,zb=new Float64Array(Math.max(ndm,1)),zi=0;
    var out={t:[],y:[],u:[],yp:[],y0:[],blow:false};
    for(var k=0;k<=n;k++){
      var t=k*h,y=x,rr=o.r?o.r(t):0,rm,uff;
      if(o.ref){rm=ndm?zb[zi]:z;var zh=rr+(z-rr)*alh;uff=(Tm*(rr-zh)/o.ref+zh)/Km;}else{rm=rr;uff=0;}
      var yfb=y;if(o.smith){var yd=ndm?bufm[bim]:xm;yfb=y+xm-yd;}
      var e=rm-yfb,uc=uff+KP*(b*rm-yfb)+I+(o.dff?o.dff(t):0),u=uc;
      if(o.umax!=null&&u>o.umax)u=o.umax;if(o.umin!=null&&u<o.umin)u=o.umin;
      if(k%ev===0){out.t.push(t);out.y.push(y);out.u.push(u);out.yp.push(yfb);out.y0.push(xm);}
      if(TI&&!((o.umax!=null&&uc>o.umax&&e>0)||(o.umin!=null&&uc<o.umin&&e<0)))I+=KP*h/TI*e;
      var uin=u+(o.d?o.d(t):0),ua;if(nd){ua=buf[bi];buf[bi]=uin;bi=(bi+1)%nd;}else ua=uin;
      x=a*x+bb*ua;
      if(o.smith){if(ndm){bufm[bim]=xm;bim=(bim+1)%ndm;}xm=am*xm+bm*u;}
      if(o.ref){if(ndm){zb[zi]=z;zi=(zi+1)%ndm;}z=rr+(z-rr)*al;}
      if(!isFinite(x)||Math.abs(x)>1e6){out.blow=true;break;}
    }
    return out;}

  /* ---- 台形の速度の目標（2 節）。返り値 {f(t) → [r, r', r''], tf, v, a} ---- */
  function _w14_traj(th,v,a){var ta=v/a,da=0.5*a*ta*ta,tc;
    if(2*da>th){ta=Math.sqrt(th/a);v=a*ta;da=th/2;tc=0;}else tc=(th-2*da)/v;
    var tf=2*ta+tc;
    return {tf:tf,v:v,a:a,f:function(t){if(t<=0)return [0,0,0];if(t<ta)return [0.5*a*t*t,a*t,a];if(t<ta+tc)return [da+v*(t-ta),v,0];
      if(t<tf){var s=t-ta-tc;return [da+v*tc+v*s-0.5*a*s*s,v-a*s,-a];}return [th,0,0];}};}

  /* ---- モータの角度（L_a を無視）: T θ'' + θ' = K(v − 100 τ)。図の _f14_mff と同じ計算に、摩擦トルクを足した ----
     ff: 0 なし、1 角速度の分、2 角速度と角加速度の分（モデルの K = 50・T = 0.05 で計算）。fb: 0 なし、1 比例、2 PD（D は偏差に掛ける）。
     Jr: 本当の慣性モーメント ÷ モデル（T が Jr 倍）、kr: 本当の電圧の効き ÷ モデル、fric: 摩擦トルク [N·m]（回る向きと逆）。 */
  function _w14_mff(tr,ff,fb,Jr,kr,fric,tEnd){
    var K=50*kr,T=0.05*Jr,Km=50,Tm=0.05,KP=fb===2?0.84:(fb===1?0.21:0),KD=fb===2?0.02:0,h=1e-4,n=Math.round(tEnd/h),a=Math.exp(-h/T);
    var th=0,w=0,out={t:[],th:[],r:[],e:[],v:[],vff:[],sat:false};
    for(var k=0;k<=n;k++){var t=k*h,R=tr.f(t+0.5*h),R0=tr.f(t);
      var vff=(ff>=1?R[1]/Km:0)+(ff>=2?Tm*R[2]/Km:0),e=R0[0]-th,v=vff+KP*e+KD*(R0[1]-w);
      if(v>12){v=12;out.sat=true;}if(v<-12){v=-12;out.sat=true;}
      if(k%10===0){out.t.push(t);out.th.push(th);out.r.push(R0[0]);out.e.push(e);out.v.push(v);out.vff.push(vff);}
      var tq=fric*Math.tanh(w/2),wi=K*v-100*tq*K/50;           /* 摩擦は電圧 −(R_a/K_t)τ にあたる（K = 50 のとき 100 V/(N·m)） */
      th=th+wi*h+(w-wi)*T*(1-a);w=wi+(w-wi)*a;}
    return out;}

  /* ---- 2 節: 目標値のフィードフォワード（モータの角度。軸の動く絵 ↔ 波形） ---- */
  REG.w14_ff=function(el,U){
    var S=U.S;
    U.head(el,"FEEDFORWARD","目標値のフィードフォワード — モデルの逆で、偏差が生まれる前に電圧を出す");
    var r1=U.ctrls(el);
    var ffs=U.select(r1,"フィードフォワード",["なし（フィードバックだけ）","角速度の分だけ（ṙ/K）","角速度と角加速度の分（ṙ/K + Tr̈/K）"],2,run);
    var fbs=U.select(r1,"フィードバック",["なし（フィードフォワードだけ）","比例（0.21 V/rad）","PD（0.84 V/rad・0.02 V·s/rad）"],2,run);
    var r2=U.ctrls(el);
    var mv=U.slider(r2,"移動量",{values:[2,5,10,20,30],value:10,fmt:function(v){return v+" rad";},onInput:run});
    var vm=U.slider(r2,"最高の角速度",{values:[20,50,100,200,400],value:50,fmt:function(v){return v+" rad/s";},onInput:run});
    var am=U.slider(r2,"角加速度",{values:[200,500,1000,2000,5000,10000],value:500,fmt:function(v){return v+" rad/s²";},onInput:run});
    var r3=U.ctrls(el);
    var jr=U.slider(r3,"本当の慣性モーメント",{values:[0.5,0.75,1,1.25,1.5,2,3],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:run});
    var kr=U.slider(r3,"本当の電圧の効き",{values:[0.6,0.8,0.9,1,1.1,1.2],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:run});
    var fr=U.slider(r3,"摩擦トルク（モデルに無い）",{values:[0,0.001,0.002,0.005],value:0,fmt:function(v){return v+" N·m";},onInput:run});
    var r4=U.ctrls(el);
    var st=U.slider(r4,"時刻",{min:0,max:1,step:0.002,value:0.2,fmt:function(v){return R?_w14_g(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.006;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function base(){mv.set(10);vm.set(50);am.set(500);jr.set(1);kr.set(1);fr.set(0);ffs.set(2);fbs.set(2);}
    U.button(br,"本文の例",function(){tk.stop();base();st.set(0.2);run();});
    U.button(br,"慣性モーメントが 1.5 倍",function(){tk.stop();base();jr.set(1.5);run();});
    U.button(br,"電圧の効きが 0.8 倍",function(){tk.stop();base();kr.set(0.8);run();});
    U.button(br,"速く動かす（12 V に届く）",function(){tk.stop();base();vm.set(400);am.set(10000);run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var tr=_w14_traj(mv.get(),vm.get(),am.get()),tEnd=Math.max(0.6,Math.ceil((tr.tf+0.35)*10)/10);
      var ff=+ffs.get(),fb=+fbs.get();
      R=_w14_mff(tr,ff,fb,jr.get(),kr.get(),fr.get(),tEnd);R.tEnd=tEnd;R.tr=tr;R.ff=ff;R.fb=fb;
      /* フィードバックだけの場合も、比べるために計算しておく */
      R.ref=(ff===0&&fb===2)?null:_w14_mff(tr,0,2,jr.get(),kr.get(),fr.get(),tEnd);
      draw();}
    function draw(){
      if(!R)return;var nar=_w14_nar(box),Wd=nar?400:700,o=[],t=R.t,n=t.length,tc=st.get()*R.tEnd,ix=Math.max(0,Math.min(n-1,Math.round(tc/(t[1]-t[0]))));
      /* 軸の動く絵 */
      var cx=nar?70:84,cy=nar?78:110,Rr=nar?50:62;
      o.push(S.T(nar?10:14,16,"モータの軸（上から見る）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,Rr,"line",1.4,"panel"));
      for(var q=0;q<12;q++){var aq=q*Math.PI/6;o.push(S.L(cx+Math.cos(aq)*(Rr-6),cy-Math.sin(aq)*(Rr-6),cx+Math.cos(aq)*Rr,cy-Math.sin(aq)*Rr,"faint",1));}
      var rt=R.r[ix],tht=R.th[ix],er=R.e[ix];
      o.push(S.L(cx,cy,cx+Math.cos(rt)*(Rr-4),cy-Math.sin(rt)*(Rr-4),"muted",3,"5 3"));
      /* 偏差の弧 */
      var steps=24,arc=[];for(var j=0;j<=steps;j++){var aj=tht+(rt-tht)*j/steps;arc.push([cx+Math.cos(aj)*(Rr*0.45),cy-Math.sin(aj)*(Rr*0.45)]);}
      if(Math.abs(er)>0.01)o.push(S.PL(arc,"alias",2.4));
      o.push(S.L(cx,cy,cx+Math.cos(tht)*(Rr-4),cy-Math.sin(tht)*(Rr-4),"signal",4));
      o.push(S.D(cx,cy,"ink",4));
      o.push(S.T(cx,cy+Rr+16,"t = "+_w14_f(tc,3)+" s","middle",10,"ink",true));
      o.push(S.T(cx,cy+Rr+31,"目標 "+_w14_f(rt,2)+" rad","middle",9.5,"muted"));
      o.push(S.T(cx,cy+Rr+45,"角度 "+_w14_f(tht,2)+" rad","middle",9.5,"signal",true));
      o.push(S.T(cx,cy+Rr+59,"偏差 "+_w14_f(er,3)+" rad","middle",9.5,Math.abs(er)>0.05?"alias":"green",true));
      /* 波形 */
      var px=nar?52:244,pw=nar?332:440,py=nar?250:22,ph=nar?70:80,gap=nar?100:112;
      var P1=U.plot(px,py,pw,ph,[0,R.tEnd],[0,R.tr.f(1e9)[0]*1.15]);
      o.push(S.T(px-(nar?42:44),py-8,"角度 [rad]（灰色の破線が目標値）","start",9.5,"ink",true));
      o.push(P1.axes({xt:U.nice(0,R.tEnd,5),yt:U.nice(0,R.tr.f(1e9)[0]*1.1,3),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,3);}}));
      o.push(P1.line(t.map(function(x,i){return [x,R.r[i]];}),"muted",2,"5 3"));
      o.push(P1.line(t.map(function(x,i){return [x,R.th[i]];}),"signal",2));
      var em=0;R.e.forEach(function(v){em=Math.max(em,Math.abs(v));});if(R.ref)R.ref.e.forEach(function(v){em=Math.max(em,Math.abs(v));});em=Math.max(em*1.15,0.05);
      var P2=U.plot(px,py+gap,pw,ph,[0,R.tEnd],[-em,em]);
      o.push(S.T(px-(nar?42:44),py+gap-8,"偏差 e [rad]"+(R.ref?"（灰色の線はフィードバックだけ）":""),"start",9.5,"ink",true));
      o.push(P2.axes({xt:U.nice(0,R.tEnd,5),yt:U.nice(-em,em,3).filter(function(v){return v>=-em&&v<=em;}),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,2);}}));
      o.push(S.L(P2.x,P2.Y(0),P2.x+P2.w,P2.Y(0),"line",1));
      o.push(S.RECT(P2.X(0),P2.y,P2.X(R.tr.tf)-P2.X(0),P2.h,0,"var(--muted-soft)","none",0,null,' fill-opacity="0.45"'));
      if(R.ref)o.push(P2.line(R.ref.t.map(function(x,i){return [x,R.ref.e[i]];}),"muted",1.4));
      o.push(P2.line(t.map(function(x,i){return [x,R.e[i]];}),Math.abs(em)>0.3?"alias":"green",2));
      var vmx=2;R.v.forEach(function(v){vmx=Math.max(vmx,Math.abs(v));});vmx=Math.min(13,vmx*1.15);
      var P3=U.plot(px,py+2*gap,pw,ph,[0,R.tEnd],[-vmx,vmx]);
      o.push(S.T(px-(nar?42:44),py+2*gap-8,"電圧 v [V]（破線はフィードフォワードの分）","start",9.5,"ink",true));
      o.push(P3.axes({xl:"時間 t [s]",xt:U.nice(0,R.tEnd,5),yt:U.nice(-vmx,vmx,3).filter(function(v){return v>=-vmx&&v<=vmx;}),xfmt:function(v){return _w14_g(v,3);},yfmt:function(v){return _w14_g(v,2);}}));
      o.push(S.L(P3.x,P3.Y(0),P3.x+P3.w,P3.Y(0),"line",1));
      if(vmx>=11){[12,-12].forEach(function(lv){o.push(S.L(P3.x,P3.Y(lv),P3.x+P3.w,P3.Y(lv),"alias",1,"4 3"));});}
      if(R.ff)o.push(P3.line(t.map(function(x,i){return [x,R.vff[i]];}),"gold",1.4,"5 3"));
      o.push(P3.line(t.map(function(x,i){return [x,R.v[i]];}),"gold",2));
      [P1,P2,P3].forEach(function(P){o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"ink",1,"2 2"));});
      box.set(S.svg(Wd,py+2*gap+ph+40,o));
      /* 読み出し */
      var mx=0,ix0=0;R.e.forEach(function(v,i){if(Math.abs(v)>mx){mx=Math.abs(v);ix0=i;}});
      var ts=_w14_settle(t,R.e,0,0.01,R.tr.tf),eEnd=R.e[R.e.length-1],vm2=0;R.v.forEach(function(v){vm2=Math.max(vm2,Math.abs(v));});
      var hs="目標値: "+_w14_g(mv.get(),3)+" rad を "+_w14_g(R.tr.tf,3)+" s で（最高の角速度 "+_w14_g(R.tr.v,3)+" rad/s、角加速度 "+_w14_g(R.tr.a,3)+" rad/s²）。モデルの逆の電圧は最大 "+_w14_g((R.tr.v+0.05*R.tr.a)/50,3)+" V<br>";
      hs+="偏差の最大 <b>"+_w14_g(mx,3)+" rad</b>（"+_w14_g(t[ix0],3)+" s）"+(R.ref?"、フィードバックだけなら "+_w14_g(Math.max.apply(null,R.ref.e.map(Math.abs)),3)+" rad":"")+"<br>";
      hs+="目標値が止まった後: "+(ts!=null?(ts<=R.tr.tf+1e-9?'<span class="ok">止まった時点で 0.01 rad 以内</span>':"0.01 rad 以内に入るのは止まってから "+_w14_g(ts-R.tr.tf,3)+" s 後"):'<span class="warn">表示した時間の中で 0.01 rad 以内に入らない</span>')+"、最後の偏差 "+_w14_f(eEnd,3)+" rad<br>";
      hs+="電圧の最大 "+_w14_g(vm2,3)+" V"+(R.sat?' <span class="warn">12 V に張り付いた（フィードフォワードどおりの電圧を出せない）</span>':"");
      ro.innerHTML=hs+'<div class="wnote">モータは電圧から角度までの K/{s(Ts + 1)}（巻線のインダクタンスを無視。モデルは K = 50 (rad/s)/V、T = 0.05 s）。フィードフォワードはモデルの値で計算し、本当の対象の慣性モーメント・電圧の効き・摩擦（回る向きと逆の一定のトルク）だけをずらした。目標値に段差が無いので、D 動作は偏差に掛けた。刻み 0.1 ms で厳密に離散化して計算した。</div>';
    }
    run();
  };

  /* ---- 3 節: 外乱のフィードフォワード（台車の坂・温度の板の周りの温度） ---- */
  function _w14_cart(KP,KI,ff,fb,ang,angm,tEnd){var h=1e-3,n=Math.round(tEnd/h),v=1,I=0,a=Math.exp(-2*h),out={t:[],y:[],u:[]};
    for(var k=0;k<=n;k++){var t=k*h,on=t>=1,d=on?-9.81*Math.sin(ang*Math.PI/180):0,uff=(ff&&on)?9.81*Math.sin(angm*Math.PI/180):0,e=1-v,
      u=2+uff+(fb?KP*e+I:0);if(k%5===0){out.t.push(t);out.y.push(v);out.u.push(u);}I+=KI*e*h;var vin=(u+d)/2;v=vin+(v-vin)*a;}
    return out;}
  REG.w14_dff=function(el,U){
    var S=U.S;
    U.head(el,"DISTURBANCE FF","外乱のフィードフォワード — 測った外乱を、制御量に現れる前に打ち消す");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",["台車の坂（1 章）","温度の板の周りの温度（10 章）"],0,function(){def();run();});
    var fbs=U.select(r1,"フィードバック",["比例","PI"],0,run);
    var CART={d:[1,2,3,4,5,6,8],e:[-2,-1,-0.5,0,0.5,1,2]},PLATE={d:[-20,-15,-10,-5,5,10,15],e:[0.5,0.7,0.85,1,1.15,1.3,1.5]};
    var r2=U.ctrls(el);
    var dz=U.slider(r2,"外乱の大きさ",{values:[0,1,2,3,4,5,6],value:4,fmt:function(i){return lab(i);},onInput:run});
    var er=U.slider(r2,"測った値の誤差",{values:[0,1,2,3,4,5,6],value:2,fmt:function(i){return elab(i);},onInput:run});
    function lab(i){return ob.get()===0?"本当の坂 "+CART.d[i]+"°":"周りの温度 "+(PLATE.d[i]>0?"+":"")+PLATE.d[i]+" K";}
    function elab(i){return ob.get()===0?"センサの読み "+(CART.e[i]>0?"+":"")+CART.e[i]+"°（"+_w14_g(CART.d[dz.get()]+CART.e[i],3)+"°と読む）":"熱抵抗のモデル: 本当の "+PLATE.e[i]+" 倍";}
    var br=U.btnrow(el);
    function def(){if(ob.get()===0){dz.set(3);er.set(2);}else{dz.set(2);er.set(3);}fbs.set(ob.get()===0?0:1);}
    U.button(br,"本文の例",function(){def();run();});
    U.button(br,"測った値が正しい",function(){er.set(ob.get()===0?3:3);run();});
    U.button(br,"誤差が大きい",function(){er.set(ob.get()===0?0:6);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      dz.set(dz.get());er.set(er.get());
      var cart=ob.get()===0,PI=fbs.get()===1,nar=_w14_nar(box),Wd=nar?400:700,o=[],res=[];
      var cs=[["フィードバックだけ","muted",null,{ff:false,fb:true}],["フィードフォワードだけ","alias","5 3",{ff:true,fb:false}],["両方","green",null,{ff:true,fb:true}]];
      var tEnd,tD,dy,yl,yu,ul;
      if(cart){
        var ang=CART.d[dz.get()],angm=ang+CART.e[er.get()],KP=8,KI=PI?25:0;tEnd=4;tD=1;
        cs.forEach(function(c){var R=_w14_cart(KP,KI,c[3].ff,c[3].fb,ang,angm,tEnd);res.push(R);});
        yl="速度 [m/s]";ul="押す力 u [N]";
      }else{
        var dT=PLATE.d[dz.get()],Re=PLATE.e[er.get()];tEnd=1200;tD=100;
        cs.forEach(function(c){var R=_w14_plate({KP:c[3].fb?10:0,TI:(c[3].fb&&PI)?160:0,d:function(t){return t>=tD?dT/1.25:0;},
          dff:c[3].ff?function(t){return t>=tD?-dT/(1.25*Re):0;}:null,tEnd:tEnd,h:0.1,every:5});
          R.y=R.y.map(function(v){return v;});res.push(R);});
        yl="温度のずれ [K]";ul="電力のずれ [W]";
      }
      var ys=[],us=[];res.forEach(function(R){ys=ys.concat(R.y);us=us.concat(R.u);});
      var y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys),ref=cart?1:0;y0=Math.min(y0,ref);y1=Math.max(y1,ref);var pad=Math.max((y1-y0)*0.12,cart?0.01:0.05);y0-=pad;y1+=pad;
      var u0=Math.min.apply(null,us),u1=Math.max.apply(null,us),pu=Math.max((u1-u0)*0.12,0.2);u0-=pu;u1+=pu;
      var x0=nar?54:62,pw=nar?330:420;
      var P=U.plot(x0,20,pw,150,[0,tEnd],[y0,y1]);
      o.push(P.axes({yl:yl,xt:U.nice(0,tEnd,5),yt:U.nice(y0,y1,4).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,3);},ylOff:nar?40:46}));
      o.push(S.L(P.X(tD),P.y,P.X(tD),P.y+P.h,"purple",1.2,"3 3"));
      o.push(S.T(P.X(tD)+4,P.y+11,cart?"坂に入る":"周りの温度が変わる","start",9.5,"purple",true,false,null,true));
      if(!cart)o.push(S.RECT(P.X(tD),P.y,P.X(tD+20)-P.X(tD),P.h,0,U.soft("purple"),"none",0));
      o.push(S.L(P.x,P.Y(ref),P.x+P.w,P.Y(ref),"muted",1,"5 3"));
      res.forEach(function(R,i){o.push(P.line(R.t.map(function(x,j){return [x,R.y[j]];}),cs[i][1],i===2?2.4:1.8,cs[i][2]));});
      var Q=U.plot(x0,206,pw,90,[0,tEnd],[u0,u1]);
      o.push(Q.axes({xl:"時間 t [s]",yl:ul,xt:U.nice(0,tEnd,5),yt:U.nice(u0,u1,3).filter(function(v){return v>=u0&&v<=u1;}),xfmt:function(v){return _w14_g(v,4);},yfmt:function(v){return _w14_g(v,3);},ylOff:nar?40:46}));
      res.forEach(function(R,i){o.push(Q.line(R.t.map(function(x,j){return [x,R.u[j]];}),cs[i][1],i===2?2:1.5,cs[i][2]));});
      /* 凡例と値 */
      var lx=nar?14:500,ly=nar?344:30;
      o.push(S.T(lx,ly,cart?"坂の上の速度":"温度のずれ","start",10,"ink",true));
      res.forEach(function(R,i){var yy=ly+20+i*(nar?16:42),fin=R.y[R.y.length-1],ext=cart?Math.min.apply(null,R.y.filter(function(v,j){return R.t[j]>=tD;})):(PLATE.d[dz.get()]<0?Math.min.apply(null,R.y):Math.max.apply(null,R.y));
        o.push(S.L(lx,yy-4,lx+22,yy-4,cs[i][1],2.4,cs[i][2]));
        var txt=cart?(cs[i][0]+": 最後 "+_w14_f(fin,3)+" m/s、最低 "+_w14_f(ext,3)):(cs[i][0]+": 最大 "+_w14_f(Math.abs(ext),2)+" K、最後 "+_w14_f(fin,2)+" K");
        if(nar)o.push(S.T(lx+28,yy,txt,"start",9.5,cs[i][1]==="muted"?"ink":cs[i][1],true));
        else{o.push(S.T(lx+28,yy,cs[i][0],"start",10,"ink"));o.push(S.T(lx+28,yy+15,txt.split(": ")[1],"start",9.5,cs[i][1]==="muted"?"ink":cs[i][1],true));}});
      box.set(S.svg(Wd,nar?404:340,o));
      /* 読み出し */
      var hs="";
      if(cart){var ang2=CART.d[dz.get()],angm2=ang2+CART.e[er.get()],dT2=9.81*Math.sin(ang2*Math.PI/180),dM=9.81*Math.sin(angm2*Math.PI/180),rem=dT2-dM;
        hs+="坂の力 "+_w14_g(dT2,3)+" N、測った角度から足す力 "+_w14_g(dM,3)+" N、足りない分 <b>"+_w14_g(rem,3)+" N</b><br>";
        hs+="フィードフォワードだけ: 1 − "+_w14_g(rem,3)+" ÷ 2 = "+_w14_f(1-rem/2,3)+" m/s。両方（比例）: 1 − "+_w14_g(rem,3)+" ÷ (2 + 8) = "+_w14_f(1-rem/10,3)+" m/s（1 章 4 節の式で、足りない分だけを比例制御が受け持つ）"+(PI?"。PI なら、どれも最後は 1 m/s":"")+"<br>";}
      else{var dT3=PLATE.d[dz.get()],Re3=PLATE.e[er.get()],need=-dT3/1.25,give=-dT3/(1.25*Re3);
        hs+="逃げる熱の変化 "+_w14_g(-need,3)+" W、フィードフォワードで足す電力 "+_w14_g(give,3)+" W、足りない分 <b>"+_w14_g(need-give,3)+" W</b><br>";
        hs+="フィードフォワードだけ: "+_w14_f((give-need)*1.25,2)+" K の所へ向かう（時定数 500 s）"+(PI?"。PI なら最後は 0":"。比例（10 W/K）だけなら最後は "+_w14_f((give-need)*1.25/(1+12.5),3)+" K")+"<br>";}
      ro.innerHTML=hs+'<div class="wnote">'+(cart?"1 章の台車（1 kg、2 N·s/m、目標 1 m/s）が 1 s に坂に入る。比例は 8 N/(m/s)、PI は 8 N/(m/s)・25 N/m。決めた力 2 N はいつも足す。":"温度の板（1.25 K/W・500 s・むだ時間 20 s）を 60 °C に保っている所で、100 s に周りの温度が変わる。PI は 10 W/K・160 s、比例は 10 W/K。周りの温度のセンサは遅れないとした。")+"</div>";
    }
    def();run();
  };

  /* ---- 4 節: カスケード制御（モータの角度、L_a を含む） ----
     mode: 0 角度の PID だけ（10 章 5 節）、1 角度の比例 → 角速度の PI → 電圧、2 角度の比例 → 角速度の PI → 電流の PI → 電圧。
     o = {tEnd, h, r(t), tau(t), vs(t), Kth, ilim, J, every}。図の _f14_casc と同じ計算 */
  function _w14_casc(U,mode,o){
    var h=o.h,J=o.J||1e-5,A=[[0,1,0],[0,0,0.02/J],[0,-20,-2000]],B=[[0,0],[0,-1/J],[1000,0]],dd=U.ctl.mat.c2d(A,B,h),Ad=dd.A,Bd=dd.B;
    var th=0,w=0,i=0,Ip=0,Dp=0,yp=0,Iw=0,Ii=0,KP=0.84,KI=5,KD=0.02,Tf=KD/KP/10,Kth=o.Kth,ilim=o.ilim;
    var KPw=mode===1?0.1:0.5,TIw=mode===1?0.05:4e-3,KPi=5,TIi=5e-4,n=Math.round(o.tEnd/h),ev=o.every||1;
    var out={t:[],th:[],w:[],i:[],v:[],r:[]};
    for(var k=0;k<=n;k++){var t=k*h,rr=o.r?o.r(t):0,v,vc;
      if(mode===0){Dp=Tf/(Tf+h)*Dp-KD/(Tf+h)*(th-yp);yp=th;var e=rr-th;vc=KP*e+Ip+Dp;v=Math.max(-12,Math.min(12,vc));if(!((vc>12&&e>0)||(vc<-12&&e<0)))Ip+=KI*e*h;}
      else if(mode===1){var ew=Kth*(rr-th)-w;vc=KPw*ew+Iw;v=Math.max(-12,Math.min(12,vc));if(!((vc>12&&ew>0)||(vc<-12&&ew<0)))Iw+=KPw/TIw*ew*h;}
      else{var ew2=Kth*(rr-th)-w,icc=KPw*ew2+Iw,ic=ilim==null?icc:Math.max(-ilim,Math.min(ilim,icc));
        if(!(ilim!=null&&((icc>ilim&&ew2>0)||(icc<-ilim&&ew2<0))))Iw+=KPw/TIw*ew2*h;
        var ei=ic-i;vc=KPi*ei+Ii;v=Math.max(-12,Math.min(12,vc));if(!((vc>12&&ei>0)||(vc<-12&&ei<0)))Ii+=KPi/TIi*ei*h;}
      var va=v*(o.vs?o.vs(t):12)/12,tl=o.tau?o.tau(t):0;
      if(k%ev===0){out.t.push(t);out.th.push(th);out.w.push(w);out.i.push(i);out.v.push(v);out.r.push(rr);}
      var a0=Ad[0][0]*th+Ad[0][1]*w+Ad[0][2]*i+Bd[0][0]*va+Bd[0][1]*tl,a1=Ad[1][0]*th+Ad[1][1]*w+Ad[1][2]*i+Bd[1][0]*va+Bd[1][1]*tl,a2=Ad[2][0]*th+Ad[2][1]*w+Ad[2][2]*i+Bd[2][0]*va+Bd[2][1]*tl;
      th=a0;w=a1;i=a2;}
    return out;}
  REG.w14_cascade=function(el,U){
    var S=U.S;
    U.head(el,"CASCADE","カスケード制御 — 内側のループで、外乱を外側に届く前に止める");
    var r1=U.ctrls(el);
    var md=U.select(r1,"構成",["角度の PID だけ（10 章）","2 段: 角度 → 角速度","3 段: 角度 → 角速度 → 電流"],2,run);
    var ts=U.select(r1,"試すこと",["0.02 s に負荷トルク 0.01 N·m","目標の角度を 1 rad 変える","軸を止められる（目標は 1 rad 先）","負荷トルクをかけて、0.1 s に電源が 12 V → 9 V"],0,run);
    var r2=U.ctrls(el);
    var rt=U.slider(r2,"内側の速さ ÷ 外側の比例ゲイン",{values:[0.5,1,2,4,5,10,20],value:5,fmt:function(v){return v+" 倍";},onInput:run});
    var il=U.slider(r2,"電流の上限（3 段）",{values:[0.5,1,2,3,6],value:3,fmt:function(v){return v+" A";},onInput:run});
    var br=U.btnrow(el);
    U.button(br,"本文の例（3 段・負荷トルク）",function(){md.set(2);ts.set(0);rt.set(5);il.set(3);run();});
    U.button(br,"角度の PID だけ",function(){md.set(0);ts.set(0);run();});
    U.button(br,"2 段で、内側が外側の 1 倍しか速くない",function(){md.set(1);ts.set(1);rt.set(1);run();});
    U.button(br,"軸を止められる・上限 1 A",function(){md.set(2);ts.set(2);il.set(1);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      var M=+md.get(),T=+ts.get(),ratio=rt.get(),inner=M===1?100:1000,Kth=inner/ratio,ilim=il.get(),nar=_w14_nar(box),Wd=nar?400:700,o=[];
      rt.el.style.display=M>0?"":"none";il.el.style.display=M===2?"":"none";
      var tw0=[0,0,0,0.9][T],tEnd=[0.4,0.4,2.5,1.4][T],h=M===2?(T===2?2e-5:1e-5):(T===2?1e-4:2e-5);
      var opt={tEnd:tEnd,h:h,Kth:Kth,ilim:M===2?ilim:null,every:Math.max(1,Math.round((tEnd-tw0)/h/800))};
      if(T===0)opt.tau=function(t){return t>=0.02?0.01:0;};
      if(T===1)opt.r=function(){return 1;};
      if(T===2){opt.r=function(){return 1;};opt.J=1e3;}
      if(T===3){opt.tau=function(){return 0.01;};opt.vs=function(t){return t>=1.0?9:12;};}
      var R=_w14_casc(U,M,opt),sel=[];R.t.forEach(function(x,i){if(x>=tw0-1e-12)sel.push(i);});
      /* 線図 */
      var yc=44,items=[["a",nar?12:20,null,"muted"],["s",{l:"+",b:"−"},"s1"],["a",nar?8:14,null,"alias"]];
      if(M===0){items.push(["b","PID","c0",true]);items.push(["a",nar?24:40,"v","gold"]);}
      else{items.push(["b","C_{θ}","c1",true]);items.push(["a",nar?18:30,"ω_r","gold"]);items.push(["s",{l:"+",b:"−"},"s2"]);items.push(["a",nar?8:14,null,"alias"]);
        items.push(["b","C_{ω}","c2",true]);
        if(M===2){items.push(["a",nar?18:30,"i_r","gold"]);items.push(["s",{l:"+",b:"−"},"s3"]);items.push(["a",nar?8:14,null,"alias"]);items.push(["b","C_i","c3",true]);}
        items.push(["a",nar?20:34,"v","gold"]);}
      items.push(["b","モータ","m"]);items.push(["a",nar?24:40,"θ_m","signal"]);
      var ch=S.CHAIN(nar?8:14,yc,items);o.push(ch.svg);
      var m0=ch.pos.m[0],m1=ch.pos.m[1],fb=[];
      if(M===2)fb.push([m0+12,22,"i","s3"]);if(M>=1)fb.push([m0+28,38,"ω_m","s2"]);fb.push([m1-10,54,"θ_m","s1"]);
      fb.forEach(function(f){var xt=ch.pos[f[3]];o.push(S.L(f[0],yc+17,f[0],yc+f[1],"signal",1.5));o.push(S.L(f[0],yc+f[1],xt,yc+f[1],"signal",1.5));o.push(S.ARR(xt,yc+f[1],xt,yc+15,"signal",1.5,6));o.push(S.TX(f[0]+4,yc+f[1]-3,f[2],"start",9,"signal",true,true));});
      if(T===0||T===3){var xm=(m0+m1)/2;o.push(S.ARR(xm,yc-34,xm,yc-18,"purple",1.6));o.push(S.TX(xm+5,yc-24,"τ_L","start",10,"purple",true,true));}
      if(T===3)o.push(S.T(m1+4,yc-24,"電源 12 V → 9 V","start",9.5,"purple",true,false,null,true));
      /* 波形 */
      var x0=nar?54:64,pw=nar?330:290,py=124,ph=110,base=T===3?R.th[sel[0]]:0;
      var tt=sel.map(function(i){return R.t[i];}),th=sel.map(function(i){return R.th[i]-((T===1||T===2)?0:base);}),ii=sel.map(function(i){return R.i[i];});
      var a0=Math.min.apply(null,th),a1=Math.max.apply(null,th);
      if(T===1||T===2){a0=Math.min(0,a0);a1=Math.max(1.2,a1*1.08);}
      var span=Math.max(a1-a0,1e-5);a0-=span*0.12;a1+=span*0.12;
      var P=U.plot(x0,py,pw,ph,[tw0,tEnd],[a0,a1]);
      o.push(S.T(x0-(nar?44:50),py-8,(T===1||T===2)?"角度 θ [rad]":(T===3?"1.0 s からの角度の変化 [rad]":"角度のずれ [rad]"),"start",9.5,"ink",true));
      o.push(P.axes({xl:"時間 t [s]",xt:U.nice(tw0,tEnd,4),yt:U.nice(a0,a1,4).filter(function(v){return v>=a0&&v<=a1;}),xfmt:function(v){return _w14_g(v,3);},yfmt:function(v){return _w14_g(v,2);}}));
      if(T===1||T===2)o.push(P.line([[tw0,1],[tEnd,1]],"muted",1,"5 3"));else o.push(P.line([[tw0,0],[tEnd,0]],"line",1));
      if(T===3)o.push(S.L(P.X(1),P.y,P.X(1),P.y+P.h,"purple",1.1,"3 3"));
      o.push(P.line(tt.map(function(x,k){return [x,th[k]];}),"signal",2));
      var bx=nar?54:420,by=nar?290:py,bw=nar?330:250;
      var imx=Math.max(1,Math.max.apply(null,ii.map(Math.abs))*1.15),i0=Math.min(0,Math.min.apply(null,ii)*1.15);
      var Q=U.plot(bx,by,bw,ph,[tw0,tEnd],[i0,imx]);
      o.push(S.T(bx-(nar?44:50),by-8,"電流 i [A]（点線は拘束電流 6 A）","start",9.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",xt:U.nice(tw0,tEnd,4),yt:U.nice(i0,imx,4).filter(function(v){return v>=i0&&v<=imx;}),xfmt:function(v){return _w14_g(v,3);},yfmt:function(v){return _w14_g(v,2);}}));
      if(M===2&&ilim<=imx)o.push(Q.line([[tw0,ilim],[tEnd,ilim]],"alias",1,"4 3"));
      if(imx>=6)o.push(Q.line([[tw0,6],[tEnd,6]],"muted",1,"2 3"));
      o.push(Q.line(tt.map(function(x,k){return [x,ii[k]];}),"gold",2));
      box.set(S.svg(Wd,(nar?by:py)+ph+40,o));
      /* 読み出し */
      var hs="",dev=0;th.forEach(function(v){dev=Math.max(dev,Math.abs(v));});
      if(T===0)hs+="負荷トルクによる角度のずれの最大: <b>"+_w14_g(dev,3)+" rad</b>、0.4 s のずれ "+_w14_g(th[th.length-1],3)+" rad<br>";
      if(T===3)hs+="電源が下がった後の角度の変化の最大: <b>"+_w14_g(dev,3)+" rad</b><br>";
      if(T===1){var mp=(Math.max.apply(null,th)-1)*100,t2=_w14_settle(tt,th,1,0.02,0);hs+="目標の角度 1 rad: 行き過ぎ量 <b>"+_w14_f(Math.max(0,mp),1)+" %</b>、2 % 整定時間 "+(t2!=null?_w14_g(t2,3)+" s":"表示した時間の中で入らない")+"<br>";}
      var imax=Math.max.apply(null,ii.map(Math.abs));hs+="電流の最大 <b>"+_w14_g(imax,3)+" A</b>"+(imax>5.5?' <span class="warn">拘束電流に近い</span>':"")+(T===2&&M===2?' <span class="ok">電流の指令を '+ilim+' A で切っている</span>':"")+"<br>";
      if(M>0){var z=0.5*Math.sqrt(ratio);hs+="外側の比例ゲイン "+_w14_g(Kth,3)+" /s（内側の速さ 約 "+inner+" /s の 1/"+ratio+"）。内側を一次遅れとみなした外側の減衰比 ζ = (1/2)√"+ratio+" = <b>"+_w14_f(z,2)+"</b>"+(z>=1?"（振動しない）":"（行き過ぎ量の目安 "+_w14_f(100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z)),1)+" %）")+"<br>";}
      ro.innerHTML=hs+'<div class="wnote">モータは巻線のインダクタンスを含む式（2 Ω・1 mH・0.02 N·m/A・1×10⁻⁵ kg·m²、電源 12 V）。PID は 10 章 5 節の値（測定値の不完全微分、N = 10）。2 段の角速度の PI は 0.1 V/(rad/s)・0.05 s（内側の速さ 100 /s）、3 段は角速度の PI 0.5 A/(rad/s)・4 ms と電流の PI 5 V/A・0.5 ms（内側の速さ 約 1000 /s）。積分はどれもクランプで止める。電圧の指令は 12 V で切り、電源が下がるとその割合で実際の電圧が減る。軸を止められる場合は、慣性モーメントを非常に大きくして計算した。</div>';
    }
    run();
  };

  /* ---- 5 節: スミス予測器（温度の板） ---- */
  var _W14_MAP=null;
  /* λ（34 通り、2〜80 s の対数）と本当のむだ時間（0〜70 s）の組で、スミス予測器（P_0 C = 1/(λs)、モデルのむだ時間 20 s）が不安定か */
  function _w14_map(){if(_W14_MAP)return _W14_MAP;var lams=[],Ls=[],M=[],i,j,k;
    for(i=0;i<34;i++)lams.push(Math.exp(Math.log(2)+(Math.log(80)-Math.log(2))*i/33));for(j=0;j<=70;j++)Ls.push(j);
    for(i=0;i<lams.length;i++){var lam=lams[i],row=[],nw=1500,wm=2.5/lam;
      for(j=0;j<Ls.length;j++){var L=Ls[j],tot=0,prev=null;
        for(k=0;k<=nw;k++){var w=1e-6+wm*k/nw,gr=Math.cos(w*L)-Math.cos(w*20),gi=-Math.sin(w*L)+Math.sin(w*20),dr=1,di=w*lam,den=dr*dr+di*di;
          var Gr=(gr*dr+gi*di)/den,Gi=(gi*dr-gr*di)/den,ph=Math.atan2(Gi,1+Gr);if(prev!==null){var dph=ph-prev;while(dph>Math.PI)dph-=2*Math.PI;while(dph<-Math.PI)dph+=2*Math.PI;tot+=dph;}prev=ph;}
        row.push(Math.abs(tot)>Math.PI);}
      M.push(row);}
    _W14_MAP={lams:lams,Ls:Ls,M:M};return _W14_MAP;}
  /* 閉ループが不安定か。PI なら一巡伝達関数の位相余裕、スミス予測器なら特性方程式 1 + G = 0 の G の線図が −1 を回るか
     （G = C(P_0 e^{−Ls} − P̃_0 e^{−20s})/(1 + C P̃_0)、C P̃_0 = 1/(λs)、P_0 = Kr P̃_0 として、G = (Kr e^{−jωL} − e^{−j20ω})/(jωλ + 1)） */
  function _w14_unst(U,C,KP,TI,lam,Lt,Kr){
    if(C!==2){var mg=U.ctl.margins(U.ctl.tf([KP*TI*1.25*Kr,KP*1.25*Kr],[500*TI,TI,0],Lt),1e-5,10);return mg.pm!=null&&mg.pm<=0;}
    var nw=6000,wm=Math.max(2.5,2.5*Kr+1.5)/lam,tot=0,prev=null;
    for(var k=0;k<=nw;k++){var w=1e-6+wm*k/nw,gr=Kr*Math.cos(w*Lt)-Math.cos(w*20),gi=-Kr*Math.sin(w*Lt)+Math.sin(w*20),di=w*lam,den=1+di*di;
      var Gr=(gr+gi*di)/den,Gi=(gi-gr*di)/den,ph=Math.atan2(Gi,1+Gr);if(prev!==null){var d=ph-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;tot+=d;}prev=ph;}
    return Math.abs(tot)>Math.PI;}
  REG.w14_smith=function(el,U){
    var S=U.S;
    U.head(el,"SMITH PREDICTOR","スミス予測器 — むだ時間を輪の外へ出す。目標値・外乱・むだ時間のずれで比べる");
    var r1=U.ctrls(el);
    var cm=U.select(r1,"制御器",["PI 10 W/K・160 s（1 節の (b)）","PI（IMC を近似した T/{K(λ + L)}・T）","スミス予測器（PI は T/(Kλ)・T）"],2,run);
    var lm=U.slider(r1,"λ",{min:2,max:80,log:true,value:10,fmt:function(v){return _w14_g(v,3)+" s";},onInput:run});
    var r2=U.ctrls(el);
    var lt=U.slider(r2,"本当のむだ時間",{min:0,max:70,step:1,value:20,fmt:function(v){return v+" s（モデルは 20 s）";},onInput:run});
    var kt=U.slider(r2,"本当の定常ゲイン",{values:[0.5,0.7,0.85,1,1.15,1.3,1.5,2],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:run});
    var br=U.btnrow(el);
    U.button(br,"本文の例（スミス予測器・λ = 10 s）",function(){cm.set(2);lm.set(10);lt.set(20);kt.set(1);run();});
    U.button(br,"λ = 20 s",function(){cm.set(2);lm.set(20);lt.set(20);kt.set(1);run();});
    U.button(br,"PI（1 節の (b)）",function(){cm.set(0);lt.set(20);kt.set(1);run();});
    U.button(br,"λ = 5 s で、本当のむだ時間が 10 s",function(){cm.set(2);lm.set(5);lt.set(10);kt.set(1);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 地図の上をドラッグして λ と本当のむだ時間を選ぶ */
    var MP=null;
    U.ctl.drag(box,function(type,x,y){if(!MP||x==null)return false;if(type==="down"&&(x<MP.x||x>MP.x+MP.w||y<MP.y||y>MP.y+MP.h))return false;
      var L=Math.round(Math.max(0,Math.min(70,MP.ux(x)))),la=Math.max(2,Math.min(80,MP.uy(y)));lt.set(L);lm.set(+la.toPrecision(3));if(cm.get()!==2)cm.set(2);run();});
    function run(){
      var C=+cm.get(),lam=lm.get(),Lt=lt.get(),Kr=kt.get(),K=1.25,T=500,L=20,KP,TI,smith=C===2;
      lm.el.style.display=C===0?"none":"";
      if(C===0){KP=10;TI=160;}else if(C===1){KP=T/(K*(lam+L));TI=T;}else{KP=T/(K*lam);TI=T;}
      var tD=700,tEnd=1400;
      var R=_w14_plate({KP:KP,TI:TI,smith:smith,Lt:Lt,Kt:K*Kr,r:function(){return 1;},d:function(t){return t>=tD?-10:0;},tEnd:tEnd,h:0.1,every:5,umin:-28,umax:52});
      var nar=_w14_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?54:62,pw=nar?330:380;
      var ys=R.y.concat(smith?R.yp:[]),y0=Math.min(-0.2,Math.min.apply(null,ys)),y1=Math.max(1.4,Math.max.apply(null,ys));y0=Math.max(y0,-3);y1=Math.min(y1,4);
      var P=U.plot(x0,20,pw,150,[0,tEnd],[y0,y1]);
      o.push(P.axes({yl:"温度のずれ [K]",xt:U.nice(0,tEnd,5),yt:U.nice(y0,y1,4).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,2);},ylOff:nar?40:44}));
      o.push(P.line([[0,1],[tEnd,1]],"muted",1,"5 3"));
      o.push(S.L(P.X(tD),P.y,P.X(tD),P.y+P.h,"purple",1.2,"3 3"));o.push(S.T(P.X(tD)+4,P.y+11,"外乱 −10 W","start",9.5,"purple",true,false,null,true));
      if(smith)o.push(P.clip(R.t.map(function(x,i){return [x,R.yp[i]];}),"gold",1.5,"5 3"));
      o.push(P.clip(R.t.map(function(x,i){return [x,R.y[i]];}),R.blow?"alias":"signal",2));
      var Q=U.plot(x0,200,pw,80,[0,tEnd],[-30,55]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"電力 [W]",xt:U.nice(0,tEnd,5),yt:[-28,0,26,52],xfmt:function(v){return _w14_g(v,4);},yfmt:function(v){return _w14_g(v,3);},ylOff:nar?40:44}));
      o.push(Q.line([[0,52],[tEnd,52]],"alias",1,"4 3"));o.push(Q.line([[0,-28],[tEnd,-28]],"alias",1,"4 3"));
      o.push(Q.line(R.t.map(function(x,i){return [x,R.u[i]];}),"gold",1.6));
      if(smith)o.push(S.LEGL(x0,P.y+P.h+20,[["signal",null,"y（本当の温度）"],["gold","5 3","y_p（予測器が戻す値）"]],9.5,18));
      /* 地図 */
      var mx0=nar?54:520,my0=nar?332:20,mw=nar?330:166,mh=nar?150:260,G=_w14_map();
      var MPl=U.plot(mx0,my0,mw,mh,[0,70],[2,80],{ylog:true});MP=MPl;
      var rr=Math.sqrt(G.lams[1]/G.lams[0]);
      for(var i=0;i<G.lams.length;i++)for(var j=0;j<G.Ls.length;j++)if(G.M[i][j]){var ya=G.lams[i]/rr,yb2=G.lams[i]*rr;
        o.push(S.RECT(MPl.X(Math.max(0,G.Ls[j]-0.5)),MPl.Y(Math.min(80,yb2)),MPl.X(Math.min(70,G.Ls[j]+0.5))-MPl.X(Math.max(0,G.Ls[j]-0.5)),MPl.Y(Math.max(2,ya))-MPl.Y(Math.min(80,yb2)),0,U.soft("alias"),"none",0));}
      o.push(MPl.axes({xl:"本当のむだ時間 [s]",yl:"λ [s]",xt:[0,20,40,60],yt:[2,5,10,20,40,80],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},sz:9,ylOff:30}));
      var ln1=[],ln2=[];for(var q=0;q<=40;q++){var lq=Math.exp(Math.log(2)+(Math.log(80)-Math.log(2))*q/40);ln1.push([Math.max(0,20-lq),lq]);ln2.push([Math.min(70,20+lq),lq]);}
      o.push(MPl.line(ln1,"green",1.6));o.push(MPl.line(ln2,"green",1.6));
      o.push(S.T(mx0+mw/2,my0-6,"スミス予測器が安定な組（赤は不安定）","middle",9.5,"ink",true));
      var lamPt=C===0?null:lam;
      if(smith){o.push(S.CIRC(MPl.X(Lt),MPl.Y(lam),6,"ink",2,"screen"));o.push(S.D(MPl.X(Lt),MPl.Y(lam),R.blow?"alias":"signal",3.4));}
      box.set(S.svg(Wd,nar?my0+mh+40:Math.max(my0+mh+40,322),o));
      /* 読み出し */
      var hs="制御器: "+(smith?"スミス予測器の中の PI ":"PI ")+_w14_g(KP,3)+" W/K・"+_w14_g(TI,3)+" s（"+U.htx("K_I")+" = "+_w14_g(KP/TI,3)+" W/(K·s)）<br>";
      var unstable=R.blow||_w14_unst(U,C,KP,TI,lam,Lt,Kr);
      if(unstable)hs+='<span class="warn">閉ループは不安定（振れが大きくなり続ける）</span><br>';
      else{var tg=R.t.filter(function(x){return x<tD;}),yg=R.y.slice(0,tg.length),mp=(Math.max.apply(null,yg)-1)*100,t2=_w14_settle(tg,yg,1,0.02,0);
        hs+="目標値 +1 K: 行き過ぎ量 <b>"+_w14_f(Math.max(0,mp),1)+" %</b>、2 % 整定時間 <b>"+(t2!=null?_w14_g(t2,3)+" s":"700 s までに入らない")+"</b>"+(smith&&Lt===20&&Kr===1?"（式 e^{−20s}/(λs + 1) なら "+_w14_g(20+lam*Math.log(50),3)+" s）":"")+"<br>";
        var td=R.t.map(function(x){return x;}),dev=R.y.map(function(v){return v-1;}),iae=_w14_trapz(td,dev.map(Math.abs),tD,tEnd),mn=0;R.y.forEach(function(v,i){if(R.t[i]>=tD)mn=Math.min(mn,v-1);});
        hs+="外乱 −10 W（700〜1400 s）: 最大 <b>"+_w14_f(-mn,2)+" K</b>、IAE "+_w14_g(iae,3)+" K·s（式の面積: "+(smith?"d/"+U.htx("K_I")+" + KLd = "+_w14_g(10/(KP/TI)+1.25*20*10,3):"d/"+U.htx("K_I")+" = "+_w14_g(10/(KP/TI),3))+" K·s。式は十分に長い時間の値）<br>";}
      if(smith){var ok=Math.abs(Lt-20)<=lam;hs+="十分な条件 |L − L̃| ≤ λ: |"+Lt+" − 20| = "+Math.abs(Lt-20)+" s "+(ok?"≤":">")+" λ = "+_w14_g(lam,3)+" s"+(ok?' <span class="ok">満たす（必ず安定）</span>':"（満たさないので、地図で確かめる）")+"<br>";}
      if(Kr!==1&&smith)hs+="地図は、定常ゲインがモデルどおりのときの判定である<br>";
      ro.innerHTML=hs+'<div class="wnote">温度の板（モデル 1.25 K/W・500 s・むだ時間 20 s）を 60 °C で保つ所から、0 s に目標値を 1 K 上げ、700 s にヒータの電力に −10 W の外乱を入れる。ヒータの電力は 0〜80 W（28 W からのずれで −28〜+52 W）で切り、積分はクランプで止める。スミス予測器のモデルには、実際に出た電力を入れる。右の地図の上をドラッグすると、λ と本当のむだ時間を選べる。</div>';
    }
    run();
  };
