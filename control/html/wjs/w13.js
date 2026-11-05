  /* ===== 13 章 ループ整形 ===== */
  function _w13_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w13_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w13_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w13_s3(v){var a=Math.abs(v);if(a===0)return "0";var d=a>=100?0:(a>=10?1:(a>=1?2:3));return _w13_f(v,d);}
  /* 行き過ぎ量 [%] と ±2 % の整定時間（最終値 yf）。落ち着かなければ ts = NaN */
  function _w13_met(t,y,yf){var mx=-Infinity,last=-1;for(var k=0;k<t.length;k++){if(y[k]>mx)mx=y[k];if(Math.abs(y[k]-yf)>0.02*Math.abs(yf))last=k;}
    return {mp:(mx-yf)/Math.abs(yf)*100,ts:last<0?0:(last+1<t.length?t[last+1]:NaN)};}
  /* 制御器 K_c・遅れ補償器 (s + z1)/(s + p1)・進み補償器 (1 + s/z2)/(1 + s/p2)。lag・lead が null ならその部分を入れない */
  function _w13_C(U,Kc,lag,lead){var P=U.ctl.poly,num=[Kc],den=[1];
    if(lag){num=P.mul(num,[1,lag[0]]);den=P.mul(den,[1,lag[1]]);}
    if(lead){num=P.mul(num,[1/lead[0],1]);den=P.mul(den,[1/lead[1],1]);}
    return U.ctl.tf(num,den);}
  function _w13_poles(ps){var o=[];ps.forEach(function(p){if(p.im<-1e-9)return;o.push(Math.abs(p.im)>1e-6*(1+Math.abs(p.re))?_w13_g(p.re,3)+" ± j"+_w13_g(p.im,3):_w13_g(p.re,3));});return o.join("、");}
  function _w13_rhp(ps){return ps.some(function(p){return p.re>1e-7*(1+Math.abs(p.im));});}
  /* 対象（本文の例の値） */
  var _W13_MPOS={num:[1000],den:[1,20,0]};                 /* モータの位置（L_a を無視）rad/V */
  var _W13_MPLA={num:[2e6],den:[1,2000,40000,0]};          /* L_a を含む */
  var _W13_CART={num:[0.5],den:[0.5,1]};                   /* 台車の速度 (m/s)/N */
  /* ボード線図の上の点の値（位相は bode と同じつなぎ方の値を補間して使う） */
  function _w13_at(B,w){var ws=B.w,i=0;while(i<ws.length-2&&ws[i+1]<w)i++;var a=(Math.log(w)-Math.log(ws[i]))/(Math.log(ws[i+1])-Math.log(ws[i]));a=Math.max(0,Math.min(1,a));
    return {db:B.db[i]+(B.db[i+1]-B.db[i])*a,ph:B.ph[i]+(B.ph[i+1]-B.ph[i])*a};}

  /* ---- 2 節: 位相遅れ補償 ---- */
  var _W13_LAG=[
    {name:"台車の速度",P:_W13_CART,Kp:8,ku:"N/(m/s)",zs:[0.1,0.2,0.3,0.5,0.8,1,1.5,2.5,4],z0:4,wr:[0.01,1000],dbr:[-40,60],phr:[-120,0],mode:"step",tEnd:4,yu:"m/s",ylab:"速度"},
    {name:"モータの位置",P:_W13_MPOS,Kp:0.21,ku:"V/rad",zs:[0.1,0.2,0.3,0.5,1,1.5,2,3,5],z0:4,wr:[0.01,1000],dbr:[-60,80],phr:[-210,-60],mode:"ramp",tEnd:4,yu:"rad",ylab:"角度"}
  ];
  REG.w13_lag=function(el,U){
    var S=U.S,ctl=U.ctl,rs=[1,2,3,5,10,20,30,50];
    U.head(el,"LAG","位相遅れ補償 — 遅い角周波数のゲインを上げ、交差より上は変えない");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["台車の速度（比例 8 N/(m/s)。目標値のステップ）","モータの位置（比例 0.21 V/rad。1 rad/s のランプ）"],0,function(){zz.set(_W13_LAG[obj.get()].z0);draw();});
    var r2=U.ctrls(el);
    var rr=U.slider(r2,"遅い角周波数のゲインの倍率 ω<sub>z1</sub>/ω<sub>p1</sub>",{values:rs,value:10,fmt:function(v){return v===1?"1（遅れ補償なし）":v+" 倍";},onInput:draw});
    var zz=U.slider(r2,"零点の位置 ω<sub>z1</sub>",{values:[0,1,2,3,4,5,6,7,8],value:4,fmt:function(i){return _w13_g(_W13_LAG[obj.get()].zs[i],3)+" rad/s";},onInput:draw});
    var r3=U.ctrls(el);
    var cmp=U.checkbox(r3,"比べるために、比例ゲインを同じ倍率で上げた場合を重ねる",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){rr.set(10);zz.set(_W13_LAG[obj.get()].z0);cmp.set(true);draw();});
    U.button(br,"遅れ補償なし",function(){rr.set(1);draw();});
    U.button(br,"零点を交差に近づける",function(){zz.set(8);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var c=_W13_LAG[obj.get()],r=rr.get(),z1=c.zs[zz.get()],p1=z1/r;
      var P=ctl.tf(c.P.num,c.P.den),C0=ctl.tf([c.Kp],[1]),C=r===1?C0:_w13_C(U,c.Kp,[z1,p1],null),CK=ctl.tf([c.Kp*r],[1]);
      var L0=ctl.series(P,C0),L=ctl.series(P,C),LK=ctl.series(P,CK);
      var ws=ctl.logspace(Math.log10(c.wr[0]),Math.log10(c.wr[1]),600);
      var B0=ctl.bode(L0,ws),B=ctl.bode(L,ws),BK=ctl.bode(LK,ws);
      var m0=ctl.margins(L0,1e-4,1e5),m=ctl.margins(L,1e-4,1e5),mK=ctl.margins(LK,1e-4,1e5);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[];
      var curves=[{w:ws,db:B0.db,ph:B0.ph,c:"muted",dash:"5 3",lw:1.8}];if(cmp.get()&&r>1)curves.push({w:ws,db:BK.db,ph:BK.ph,c:"alias",dash:"5 3",lw:1.8});curves.push({w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4});
      var bx=nar?58:62,bw=nar?320:300;
      var bd=ctl.bodeSvg(curves,{x:bx,y:24,w:bw,hm:120,hp:96,gap:28,wr:c.wr,dbr:c.dbr,phr:c.phr});
      o.push(S.TX(bx-48,14,"(a) 一巡伝達関数 P(jω)C(jω)","start",10.5,"ink",true));o.push(bd.svg);
      [[m0,"muted"],[m,"signal"]].concat(cmp.get()&&r>1?[[mK,"alias"]]:[]).forEach(function(q){var mm=q[0];if(mm.wgc&&mm.wgc>=c.wr[0]&&mm.wgc<=c.wr[1]){o.push(S.D(bd.Pm.X(mm.wgc),bd.Pm.Y(0),q[1],3.8));var ph=-180+mm.pm;if(ph>=c.phr[0]&&ph<=c.phr[1])o.push(S.D(bd.Pp.X(mm.wgc),bd.Pp.Y(ph),q[1],3.8));}});
      if(r>1){o.push(S.L(bd.Pm.X(z1),bd.Pm.y,bd.Pm.X(z1),bd.Pp.y+bd.Pp.h,"faint",1,"2 3"));o.push(S.TX(bd.Pm.X(z1)+3,bd.Pm.y+11,"ω_z1","start",9,"signal",true,true));}
      var lg=[["muted","5 3","比例 "+_w13_g(c.Kp,3)]];if(cmp.get()&&r>1)lg.push(["alias","5 3","比例 "+_w13_g(c.Kp*r,3)]);lg.push(["signal",null,"遅れ補償"]);
      o.push(S.LEGL(bx-40,bd.h+2,lg,9,10));
      /* 時間の応答 */
      var tx=nar?58:432,ty=nar?bd.h+40:24,tw=nar?320:238,th=nar?150:262;
      var G=ctl.loop(P,C),G0=ctl.loop(P,C0),GK=ctl.loop(P,CK),n=1600;
      var ps=ctl.poles(G.Gyr),slow=Infinity;ps.forEach(function(p){if(Math.abs(p.re)>1e-9)slow=Math.min(slow,Math.abs(p.re));});
      var tE=c.tEnd;if(r>1&&isFinite(slow))tE=Math.min(30,Math.max(c.tEnd,4/slow));
      var sets=[[G0,"muted","5 3"]];if(cmp.get()&&r>1)sets.push([GK,"alias","5 3"]);sets.push([G,"signal",null]);
      var Q,ytop,res=[];
      if(c.mode==="step"){
        sets.forEach(function(q){var R=ctl.step(q[0].Gyr,tE,n);res.push(R);});
        ytop=1.15;Q=U.plot(tx,ty+14,tw,th,[0,tE],[0,ytop]);
        o.push(S.T(tx-48,ty+2,"(b) 目標の速度を 1 m/s にしたときの速度","start",10.5,"ink",true));
        o.push(Q.axes({xl:"時間 t [s]",yl:"速度 [m/s]",xt:U.nice(0,tE,5),yt:[0,0.25,0.5,0.75,1],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
        o.push(Q.line([[0,1],[tE,1]],"muted",1.1,"5 3"));
        var yf=ctl.dcgain(G.Gyr);o.push(S.RECT(Q.x,Q.Y(yf*1.02),Q.w,Q.Y(yf*0.98)-Q.Y(yf*1.02),0,U.soft("green"),"none",0));
        sets.forEach(function(q,i){var R=res[i];o.push(Q.clip(R.t.map(function(t,k){return [t,R.y[k]];}),q[1],q[2]?1.7:2.2,q[2]));});
      }else{
        /* ランプ 1/s² への偏差 E = S/s² は、S/s のステップ応答として求める（ステップは零次ホールドで正確に表せる） */
        sets.forEach(function(q){var R=ctl.step(ctl.tf(q[0].S.num,ctl.poly.mul(q[0].S.den,[1,0])),tE,n);res.push(R);});
        var e0=1/(50*c.Kp),ymax=Math.max(0.03,e0*1.25);ytop=ymax;Q=U.plot(tx,ty+14,tw,th,[0,tE],[0,ymax]);
        o.push(S.T(tx-48,ty+2,"(b) 1 rad/s で回る目標への偏差","start",10.5,"ink",true));
        o.push(Q.axes({xl:"時間 t [s]",yl:"偏差 [rad]",xt:U.nice(0,tE,5),yt:U.nice(0,ymax,4),xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
        sets.forEach(function(q,i){var R=res[i];o.push(Q.clip(R.t.map(function(t,k){return [t,R.y[k]];}),q[1],q[2]?1.7:2.2,q[2]));});
      }
      var Hh=nar?ty+14+th+44:Math.max(bd.h+22,ty+14+th+44);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var h="";
      if(c.mode==="step"){
        /* 読み出しは細かい刻み（0.5 ms ほど）で計算し直す */
        var K=0.5*c.Kp,ef=1/(1+K*r),tL=isFinite(slow)?Math.max(20,15/slow):20,RL=ctl.step(G.Gyr,tL,Math.min(80000,Math.round(tL/0.0005))),met=_w13_met(RL.t,RL.y,ctl.dcgain(G.Gyr)),R0=ctl.step(G0.Gyr,2,4000),met0=_w13_met(R0.t,R0.y,ctl.dcgain(G0.Gyr));
        h+="定常偏差: 式 1/(1 + 4 × "+r+") = <b>"+_w13_g(ef,3)+" m/s</b>（数値計算 t = "+_w13_g(tL,3)+" s で "+_w13_g(1-RL.y[RL.y.length-1],3)+" m/s。比例だけ 0.2 m/s）<br>";
        h+="2 % 整定時間: 遅れ補償 <b>"+(isFinite(met.ts)?_w13_g(met.ts,3)+" s":"範囲の外")+"</b>、比例 "+_w13_g(c.Kp,3)+" は "+_w13_g(met0.ts,3)+" s<br>";
        h+="50 rad/s の観測ノイズが制御量に現れる割合 |G<sub>yr</sub>(j50)|: 遅れ補償 <b>"+_w13_g(ctl.cx.abs(ctl.freq(G.Gyr,50)),3)+"</b>、比例 "+_w13_g(c.Kp*r,3)+" は "+_w13_g(ctl.cx.abs(ctl.freq(GK.Gyr,50)),3)+"<br>";
      }else{
        var Kv=50*c.Kp*r,tL2=isFinite(slow)?Math.max(20,15/slow):20,R2=ctl.step(ctl.tf(G.S.num,ctl.poly.mul(G.S.den,[1,0])),tL2,4000);
        h+="定常速度偏差: 式 1/("+_w13_g(50*c.Kp,3)+" × "+r+") = <b>"+_w13_g(1/Kv,3)+" rad</b>（数値計算 t = "+_w13_g(tL2,3)+" s で "+_w13_g(R2.y[R2.y.length-1],3)+" rad。比例だけ 0.0952 rad）<br>";
        var St=ctl.step(G.Gyr,6,12000),ms=_w13_met(St.t,St.y,1),St0=ctl.step(G0.Gyr,6,12000),ms0=_w13_met(St0.t,St0.y,1);
        h+="目標値のステップ: 行き過ぎ量 <b>"+_w13_f(ms.mp,1)+" %</b>、2 % 整定時間 <b>"+(isFinite(ms.ts)?_w13_g(ms.ts,3)+" s":"6 s より長い")+"</b>（比例だけ "+_w13_f(ms0.mp,1)+" %・"+_w13_g(ms0.ts,3)+" s）<br>";
      }
      h+="交差角周波数・位相余裕: 遅れ補償 <b>"+(m.wgc?_w13_g(m.wgc,3)+" rad/s・"+_w13_f(m.pm,1)+"°":"—")+"</b>、比例 "+_w13_g(c.Kp,3)+" は "+_w13_g(m0.wgc,3)+" rad/s・"+_w13_f(m0.pm,1)+"°"+(cmp.get()&&r>1?"、比例 "+_w13_g(c.Kp*r,3)+" は "+_w13_g(mK.wgc,3)+" rad/s・"+_w13_f(mK.pm,1)+"°":"")+"<br>";
      if(r>1)h+="閉ループの極（遅れ補償）: "+_w13_poles(ps)+"（遅い極が尾を残す）";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 3 節: 位相進み補償 ---- */
  REG.w13_lead=function(el,U){
    var S=U.S,ctl=U.ctl,P=ctl.tf(_W13_MPOS.num,_W13_MPOS.den);
    U.head(el,"LEAD","位相進み補償 — 位相の山を交差に重ねる（モータの位置 1000/(s(s + 20))）");
    var r1=U.ctrls(el);
    var al=U.slider(r1,"α = ω<sub>p2</sub>/ω<sub>z2</sub>",{values:[1,1.5,2,3,4,5,7,10,11,15,20,30],value:3,fmt:function(v){return v===1?"1（進み補償なし）":String(v);},onInput:draw});
    var wc=U.slider(r1,"山の中心 ω<sub>c</sub>",{min:3,max:300,log:true,value:30,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:draw});
    var r2=U.ctrls(el);
    var md=U.select(r2,"全体のゲイン K<sub>c</sub> の決め方",["山の中心で交差させる（手順 4）","全体のゲインを固定する"],0,function(){kc.el.style.display=md.get()===1?"":"none";draw();});
    var kc=U.slider(r2,"K<sub>c</sub>",{min:0.05,max:20,log:true,value:0.625,fmt:function(v){return _w13_g(v,3)+" V/rad";},onInput:draw});
    kc.el.style.display="none";
    var br=U.btnrow(el);
    U.button(br,"本文の例（α = 3、30 rad/s）",function(){al.set(3);wc.set(30);md.set(0);kc.el.style.display="none";draw();});
    U.button(br,"比例だけで 30 rad/s",function(){al.set(1);wc.set(30);md.set(0);kc.el.style.display="none";draw();});
    U.button(br,"10 章の PD（N = 10）",function(){al.set(11);wc.set(126.7);md.set(1);kc.el.style.display="";kc.set(0.84);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var a=al.get(),w0=wc.get(),z2=w0/Math.sqrt(a),p2=w0*Math.sqrt(a),Pm0=ctl.cx.abs(ctl.freq(P,w0));
      var Kc=md.get()===0?1/(Math.sqrt(a)*Pm0):kc.get();
      if(md.get()===0)kc.set(Kc);
      var C=a===1?ctl.tf([Kc],[1]):_w13_C(U,Kc,null,[z2,p2]),L=ctl.series(P,C);
      var mg=ctl.margins(L,1e-3,1e5);
      /* 比べる比例制御: 同じ交差（中心で交差させるとき）か、同じ K_c */
      var Kp=md.get()===0?1/Pm0:Kc,Cp=ctl.tf([Kp],[1]),Lp=ctl.series(P,Cp),mp=ctl.margins(Lp,1e-3,1e5);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[],ws=ctl.logspace(0,3,500);
      /* (a) 進み補償器 */
      var bx=nar?58:62,bw=nar?320:280;
      var Bc=ctl.bode(a===1?ctl.tf([1],[1]):_w13_C(U,1,null,[z2,p2]),ws);
      var b1=ctl.bodeSvg([{w:ws,db:Bc.db,ph:Bc.ph,c:"teal",lw:2.2}],{x:bx,y:24,w:bw,hm:80,hp:70,gap:26,wr:[1,1000],dbr:[0,30],phr:[0,90]});
      o.push(S.TX(bx-48,14,"(a) 進み補償器 (1 + s/ω_{z2})/(1 + s/ω_{p2})","start",10.5,"ink",true));o.push(b1.svg);
      var phm=Math.asin((a-1)/(a+1))*180/Math.PI;
      if(a>1&&w0>=1&&w0<=1000){o.push(S.D(b1.Pp.X(w0),b1.Pp.Y(phm),"teal",4));o.push(S.D(b1.Pm.X(w0),b1.Pm.Y(10*Math.log10(a)),"teal",4));
        o.push(S.TX(b1.Pp.X(w0)+(w0>100?-6:6),b1.Pp.Y(phm)+(phm>60?14:-6),"φ_max = "+_w13_f(phm,1)+"°",w0>100?"end":"start",9.5,"teal",true,true));}
      /* (b) 一巡伝達関数 */
      var y2=nar?b1.h+16:24,bx2=nar?58:410,bw2=nar?320:270;
      var B=ctl.bode(L,ws),Bp=ctl.bode(Lp,ws);
      var b2=ctl.bodeSvg([{w:ws,db:Bp.db,ph:Bp.ph,c:"alias",dash:"5 3",lw:1.8},{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4}],{x:bx2,y:y2+10,w:bw2,hm:80,hp:70,gap:26,wr:[1,1000],dbr:[-40,40],phr:[-180,-90]});
      o.push(S.TX(bx2-48,y2,"(b) 一巡伝達関数と位相余裕","start",10.5,"ink",true));o.push(b2.svg);
      [[mp,"alias"],[mg,"signal"]].forEach(function(q){var m=q[0];if(m.wgc&&m.wgc>=1&&m.wgc<=1000){o.push(S.D(b2.Pm.X(m.wgc),b2.Pm.Y(0),q[1],3.8));var ph=-180+m.pm;
        if(ph>=-180&&ph<=-90)o.push(S.L(b2.Pp.X(m.wgc)+(q[1]==="signal"?2:-2),b2.Pp.Y(-180),b2.Pp.X(m.wgc)+(q[1]==="signal"?2:-2),b2.Pp.Y(ph),q[1],2.2));}});
      if(w0>=1&&w0<=1000)o.push(S.L(b2.Pm.X(w0),b2.Pm.y,b2.Pm.X(w0),b2.Pp.y+b2.Pp.h,"teal",1,"2 3"));
      /* (c) s 平面 */
      var y3=nar?b2.h+16:Math.max(b1.h,b2.h)+14,sx=nar?70:62,sw=nar?140:150,sh=nar?160:170;
      var xr=[-Math.max(60,Math.min(450,p2*1.15)),5],Pz=U.plot(sx,y3+14,sw,sh,xr,[-60,60]);
      o.push(S.T(sx-48,y3+2,"(c) 極と零点","start",10.5,"ink",true));
      o.push(S.RECT(Pz.x,Pz.y,Pz.w,Pz.h,0,"var(--screen)","line",0.8));o.push(ctl.splane(Pz,{}));
      o.push(Pz.axes({xl:"実部",yl:"虚部",xt:U.nice(xr[0],0,3),yt:[-60,-30,0,30,60],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,3);},sz:8.5}));
      var olp=[ctl.c(0,0),ctl.c(-20,0)],olz=[];if(a>1){olp.push(ctl.c(-p2,0));olz.push(ctl.c(-z2,0));}
      o.push(ctl.pz(Pz,olp,olz,"muted",5));
      var Gc=ctl.loop(P,C),Gp=ctl.loop(P,Cp);
      o.push(ctl.pz(Pz,ctl.poles(Gp.Gyr),[],"alias",5));o.push(ctl.pz(Pz,ctl.poles(Gc.Gyr),[],"signal",5.5));
      /* (d) ステップ応答 */
      var tx=nar?58:(sx+sw+64),tw=nar?320:(Wd-tx-20),ty=nar?y3+14+sh+44:y3;
      var tE=0.6,Rc=ctl.step(Gc.Gyr,tE,1500),Rp=ctl.step(Gp.Gyr,tE,1500);
      var Q=U.plot(tx,ty+14,tw,sh,[0,tE],[0,1.8]);
      o.push(S.T(tx-48,ty+2,"(d) 目標の角度を 1 rad 変えたときの角度","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",yl:"角度 [rad]",xt:[0,0.1,0.2,0.3,0.4,0.5,0.6],yt:[0,0.5,1,1.5],xfmt:function(v){return _w13_g(v,2);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(Q.line([[0,1],[tE,1]],"muted",1.1,"5 3"));
      o.push(Q.clip(Rp.t.map(function(t,k){return [t,Rp.y[k]];}),"alias",1.8,"5 3"));
      o.push(Q.clip(Rc.t.map(function(t,k){return [t,Rc.y[k]];}),"signal",2.3));
      var Hh=ty+14+sh+44;o.push(S.LEGL(tx-40,Hh-2,[["alias","5 3",md.get()===0?"比例だけで同じ交差":"比例だけ（同じ K_c）"],["signal",null,"進み補償"]],9,10));
      box.set(S.svg(Wd,Hh+8,o));
      /* 読み出し */
      var mc=_w13_met(Rc.t,Rc.y,1),mpp=_w13_met(Rp.t,Rp.y,1),stc=_w13_rhp(ctl.poles(Gc.Gyr)),stp=_w13_rhp(ctl.poles(Gp.Gyr));
      var h="最大位相進み: sin φ<sub>max</sub> = (α − 1)/(α + 1) から <b>"+_w13_f(phm,1)+"°</b>（ω<sub>c</sub> = √(ω<sub>z2</sub>ω<sub>p2</sub>) = "+_w13_g(w0,3)+" rad/s で、そこでのゲインは √α = "+_w13_g(Math.sqrt(a),3)+" 倍）<br>";
      if(a>1)h+="折れ点: ω<sub>z2</sub> = "+_w13_g(z2,3)+" rad/s、ω<sub>p2</sub> = "+_w13_g(p2,3)+" rad/s。";
      h+="K<sub>c</sub> = <b>"+_w13_g(Kc,3)+" V/rad</b>、高い角周波数のゲイン K<sub>c</sub>α = "+_w13_g(Kc*a,3)+" V/rad（目標を 1 rad 変えた瞬間の電圧）<br>";
      h+="進み補償: "+(mg.wgc?"交差 "+_w13_g(mg.wgc,3)+" rad/s、位相余裕 <b>"+_w13_f(mg.pm,1)+"°</b>":"交差なし")+(stc?' <span class="warn">不安定</span>':"、行き過ぎ量 "+_w13_f(mc.mp,1)+" %、2 % 整定時間 "+(isFinite(mc.ts)?_w13_g(mc.ts,3)+" s":"—"))+"<br>";
      h+=(md.get()===0?"比例だけで同じ交差（K = "+_w13_g(Kp,3)+" V/rad）: ":"比例だけ（K = "+_w13_g(Kp,3)+" V/rad）: ")+(mp.wgc?"交差 "+_w13_g(mp.wgc,3)+" rad/s、位相余裕 "+_w13_f(mp.pm,1)+"°":"")+(stp?"":"、行き過ぎ量 "+_w13_f(mpp.mp,1)+" %")+"<br>";
      h+="閉ループの極（進み補償）: "+_w13_poles(ctl.poles(Gc.Gyr));
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 5 節: 水床効果 ---- */
  /* ∫_0^∞ ln|S(jω)| dω を、0 を横切る所で分けて数値積分する（対数の刻みで 1e-6〜1e6 rad/s、台形の公式を ω について） */
  function _w13_wb(U,L){var ctl=U.ctl,ws=ctl.logspace(-6,6,24000),neg=0,pos=0,prev=null,pw=0;
    ws.forEach(function(w){var v=-Math.log(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))));
      if(prev!==null){var a=(prev+v)/2*(w-pw);if(a<0)neg+=a;else pos+=a;}prev=v;pw=w;});
    return {neg:neg,pos:pos};}
  REG.w13_waterbed=function(el,U){
    var S=U.S,ctl=U.ctl,P=ctl.tf(_W13_MPOS.num,_W13_MPOS.den);
    U.head(el,"WATERBED","水床効果 — 感度関数を下げた分だけ、別の所が上がる（モータの位置 1000/(s(s + 20))）");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>c</sub>",{values:[0.05,0.1,0.21,0.42,0.84,1.5,2.5,4],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var lr=U.slider(r1,"遅れ補償器の倍率（零点 1 rad/s）",{values:[1,3,10,30],value:1,fmt:function(v){return v===1?"なし":v+" 倍";},onInput:draw});
    var r2=U.ctrls(el);
    var wf=U.slider(r2,"速い所を下げるフィルタ 1/(1 + s/ω<sub>f</sub>)<sup>2</sup> の折れ点",{values:[0,1000,300,150,100,60,40],value:0,fmt:function(v){return v===0?"なし":v+" rad/s";},onInput:draw});
    var br=U.btnrow(el);
    function setv(K,r,f){kp.set(K);lr.set(r);wf.set(f);draw();}
    U.button(br,"本文の例（0.21 V/rad）",function(){setv(0.21,1,0);});
    U.button(br,"0.84 V/rad",function(){setv(0.84,1,0);});
    U.button(br,"4 V/rad",function(){setv(4,1,0);});
    U.button(br,"0.21 V/rad + 遅れ補償器 10 倍",function(){setv(0.21,10,0);});
    U.button(br,"0.84 V/rad + フィルタ 100 rad/s",function(){setv(0.84,1,100);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var K=kp.get(),r=lr.get(),f=wf.get(),PO=ctl.poly,num=[K],den=[1];
      if(r>1){num=PO.mul(num,[1,1]);den=PO.mul(den,[1,1/r]);}
      if(f>0){den=PO.mul(den,PO.mul([1/f,1],[1/f,1]));}
      var C=ctl.tf(num,den),L=ctl.series(P,C),G=ctl.loop(P,C),ps=ctl.poles(G.Gyr),uns=_w13_rhp(ps);
      var wb=_w13_wb(U,L),sm=ctl.smax(L,1e-3,1e5),mg=ctl.margins(L,1e-3,1e5);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[];
      /* (a) 対数でない目盛 */
      var x0=nar?58:62,wA=nar?320:360,hA=170,wmax=mg.wgc?Math.min(600,Math.max(60,8*mg.wgc)):200;
      var Pa=U.plot(x0,30,wA,hA,[0,wmax],[-2.5,2]);
      o.push(S.T(x0-48,16,"(a) ln|S(jω)|（対数でない目盛の ω）","start",10.5,"ink",true));
      var xs=ctl.linspace(wmax/2000,wmax,1000),vs=xs.map(function(w){return -Math.log(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))));});
      var negp=[[Pa.X(0),Pa.Y(0)]],posp=[];
      /* 塗り: 0 より下は緑、上は赤（縦の目盛の外は切る） */
      var segN=[],segP=[];xs.forEach(function(w,i){var v=Math.max(-2.5,Math.min(2,vs[i]));if(v<0)segN.push([Pa.X(w),Pa.Y(v)]);else segN.push([Pa.X(w),Pa.Y(0)]);if(v>0)segP.push([Pa.X(w),Pa.Y(v)]);else segP.push([Pa.X(w),Pa.Y(0)]);});
      o.push(S.PL([[Pa.X(xs[0]),Pa.Y(0)]].concat(segN).concat([[Pa.X(wmax),Pa.Y(0)]]),"none",0,"green",null,0.25));
      o.push(S.PL([[Pa.X(xs[0]),Pa.Y(0)]].concat(segP).concat([[Pa.X(wmax),Pa.Y(0)]]),"none",0,"alias",null,0.25));
      o.push(Pa.axes({xl:"角周波数 ω [rad/s]",yl:"ln|S|",xt:U.nice(0,wmax,5),yt:[-2,-1,0,1,2],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.L(Pa.x,Pa.Y(0),Pa.x+Pa.w,Pa.Y(0),"muted",1));
      o.push(Pa.clip(xs.map(function(w,i){return [w,vs[i]];}),"signal",2));
      o.push(S.T(Pa.x+Pa.w-4,Pa.y+14,"緑 "+_w13_f(wb.neg,2)+"・赤 +"+_w13_f(wb.pos,2),"end",10,"ink",true,false,null,true));
      /* (b) ボード線図の |S| と |PC| */
      var y2=nar?30+hA+56:30,x2=nar?58:478,wB=nar?320:202,hB=nar?150:170;
      var Pb=U.plot(x2,y2,wB,hB,[1,3000],[-40,20],{xlog:true});
      o.push(S.T(x2-48+(nar?0:28),y2-14,"(b) |S| と |PC| [dB]","start",10.5,"ink",true));
      o.push(Pb.axes({xl:"ω [rad/s]",yl:nar?"ゲイン [dB]":null,xt:[1,10,100,1000],yt:[-40,-20,0,20],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.L(Pb.x,Pb.Y(0),Pb.x+Pb.w,Pb.Y(0),"muted",1));
      var wl=ctl.logspace(0,Math.log10(3000),400),BL=ctl.bode(L,wl);
      o.push(Pb.clip(wl.map(function(w,i){return [w,BL.db[i]];}),"faint",1.6,"4 3"));
      o.push(Pb.clip(wl.map(function(w){return [w,-20*Math.log10(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))))];}),"signal",2.2));
      if(sm.w>=1&&sm.w<=3000&&isFinite(sm.Ms)){o.push(S.D(Pb.X(sm.w),Pb.Y(Math.min(20,20*Math.log10(sm.Ms))),"alias",4));}
      /* (c) ナイキスト線図（−1 のまわり） */
      var y3=nar?y2+hB+62:y2+hB+62,cs=nar?220:150,x3=nar?90:x2+26;
      var cp=S.CPLANE(x3,y3,cs,cs,[-2.5,1],[-2.5,1],{unit:true,m1:true});o.push(cp.svg);var Pc=cp.P;
      o.push(S.T(x3-(nar?32:0),y3-8,"(c) −1 の点との距離","start",10.5,"ink",true));
      var wn=ctl.logspace(-1,4,1500),pts=wn.map(function(w){var v=ctl.freq(L,w);return [v.re,v.im];});
      o.push(Pc.clip(pts,"signal",2));
      if(isFinite(sm.Ms)&&!uns){var rr=1/sm.Ms,circ=[];for(var i=0;i<=90;i++){var t=2*Math.PI*i/90;circ.push([-1+rr*Math.cos(t),rr*Math.sin(t)]);}o.push(Pc.clip(circ,"alias",1.3,"4 3"));
        var vm=ctl.freq(L,sm.w);o.push(S.L(Pc.X(-1),Pc.Y(0),Pc.X(vm.re),Pc.Y(vm.im),"alias",1.4));}
      var Hh=nar?y3+cs+30:Math.max(30+hA+44,y3+cs+30);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var h="";
      if(uns)h+='<span class="warn">閉ループが不安定</span>（閉ループの極: '+_w13_poles(ps)+'）。積分が 0 になる条件（閉ループが安定）を満たさない<br>';
      h+="∫ ln|S(jω)| dω: 0 より下（緑） <b>"+_w13_f(wb.neg,2)+"</b>、上（赤） <b>+"+_w13_f(wb.pos,2)+"</b>、和 "+_w13_f(wb.neg+wb.pos,3)+"（1e−6〜1e6 rad/s で数値積分。0 に近いことを確かめる）<br>";
      h+="最大感度 M<sub>s</sub> = <b>"+_w13_g(sm.Ms,3)+"</b>（"+_w13_g(sm.w,3)+" rad/s）、−1 の点との最も近い距離 1/M<sub>s</sub> = "+_w13_g(1/sm.Ms,3)+"<br>";
      h+="交差 "+(mg.wgc?_w13_g(mg.wgc,3)+" rad/s、位相余裕 "+_w13_f(mg.pm,1)+"°":"—")+(mg.gmDb!=null?"、ゲイン余裕 "+_w13_f(mg.gmDb,1)+" dB":"");
      ro.innerHTML=h+'<div class="wnote">(a) の横軸は対数でない目盛で、描いた範囲の外の面積も数値に含めた。縦の目盛の外（−2.5 より下）は描いていない。</div>';
    }
    draw();
  };

  /* ---- 6 節: ループ整形の設計 ---- */
  REG.w13_shape=function(el,U){
    var S=U.S,ctl=U.ctl,P=ctl.tf(_W13_MPLA.num,_W13_MPLA.den);
    var DEF={Kc:1.697,p1:0.15,z1:1.5,z2:26.83,p2:134.2,lag:true,lead:true};
    U.head(el,"LOOP SHAPING","ループ整形 — 折れ点を動かし、余裕・感度・応答を同時に見る（モータの位置、L<sub>a</sub> を含む）");
    var r1=U.ctrls(el);
    var kc=U.slider(r1,"全体のゲイン K<sub>c</sub>",{min:0.05,max:20,log:true,value:DEF.Kc,fmt:function(v){return _w13_s3(v)+" V/rad";},onInput:draw});
    var ulag=U.checkbox(r1,"遅れ補償器",true,draw),ulead=U.checkbox(r1,"進み補償器",true,draw);
    var r2=U.ctrls(el);
    var sp1=U.slider(r2,"ω<sub>p1</sub>",{min:0.01,max:10,log:true,value:DEF.p1,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("p1");draw();}});
    var sz1=U.slider(r2,"ω<sub>z1</sub>",{min:0.1,max:30,log:true,value:DEF.z1,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("z1");draw();}});
    var sz2=U.slider(r2,"ω<sub>z2</sub>",{min:3,max:300,log:true,value:DEF.z2,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("z2");draw();}});
    var sp2=U.slider(r2,"ω<sub>p2</sub>",{min:10,max:3000,log:true,value:DEF.p2,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("p2");draw();}});
    var SL={p1:sp1,z1:sz1,z2:sz2,p2:sp2};
    /* 並び ω_p1 < ω_z1、ω_z2 < ω_p2 を保つ */
    function fix(k){var p1=sp1.get(),z1=sz1.get(),z2=sz2.get(),p2=sp2.get();
      if(k==="p1"&&p1>=z1*0.99)sz1.set(Math.min(30,p1*1.05));if(k==="z1"&&z1<=p1*1.01)sp1.set(Math.max(0.01,z1/1.05));
      if(k==="z2"&&z2>=p2*0.99)sp2.set(Math.min(3000,z2*1.05));if(k==="p2"&&p2<=z2*1.01)sz2.set(Math.max(3,p2/1.05));}
    var br=U.btnrow(el);
    function setd(o){kc.set(o.Kc);sp1.set(o.p1);sz1.set(o.z1);sz2.set(o.z2);sp2.set(o.p2);ulag.set(o.lag);ulead.set(o.lead);draw();}
    U.button(br,"本文の例（進み遅れ）",function(){setd(DEF);});
    U.button(br,"遅れ補償器の零点を 6 rad/s に",function(){setd({Kc:1.697,p1:0.6,z1:6,z2:26.83,p2:134.2,lag:true,lead:true});});
    U.button(br,"進み補償だけ",function(){setd({Kc:1.697,p1:0.15,z1:1.5,z2:26.83,p2:134.2,lag:false,lead:true});});
    U.button(br,"比例だけ（1.70 V/rad）",function(){setd({Kc:1.697,p1:0.15,z1:1.5,z2:26.83,p2:134.2,lag:false,lead:false});});
    U.button(br,"10 章の PD（N = 10）",function(){setd({Kc:0.84,p1:0.15,z1:1.5,z2:38.2,p2:420,lag:false,lead:true});});
    var box=U.svgbox(el),ro=U.readout(el),last=null,grab=null;
    /* ドラッグ: 折れ点の印（ゲインの図の下の並び）を左右に、図のほかの所を上下に動かすと K_c が変わる */
    ctl.drag(box,function(type,x,y){
      if(!last)return type==="down"?false:undefined;var Pm=last.Pm;
      if(type==="down"){grab=null;var best=14;last.marks.forEach(function(m){var d=Math.hypot(x-m.x,y-m.y);if(d<best){best=d;grab={k:m.k};}});
        if(!grab&&x>=Pm.x&&x<=Pm.x+Pm.w&&y>=Pm.y&&y<=Pm.y+Pm.h)grab={k:"K",y0:y,K0:kc.get()};
        if(!grab)return false;return;}
      if(type==="up"){grab=null;return;}
      if(!grab)return;
      if(grab.k==="K"){var ddb=(Pm.uy(y)-Pm.uy(grab.y0));kc.set(Math.max(0.05,Math.min(20,grab.K0*Math.pow(10,ddb/20))));}
      else{var w=Pm.ux(Math.max(Pm.x,Math.min(Pm.x+Pm.w,x))),sl=SL[grab.k],lim={p1:[0.01,10],z1:[0.1,30],z2:[3,300],p2:[10,3000]}[grab.k];sl.set(Math.max(lim[0],Math.min(lim[1],w)));fix(grab.k);}
      draw();});
    function draw(){
      var Kc=kc.get(),lag=ulag.get()?[sz1.get(),sp1.get()]:null,lead=ulead.get()?[sz2.get(),sp2.get()]:null;
      [sp1,sz1].forEach(function(s){s.el.style.opacity=lag?"1":"0.45";});[sz2,sp2].forEach(function(s){s.el.style.opacity=lead?"1":"0.45";});
      var C=_w13_C(U,Kc,lag,lead),L=ctl.series(P,C),G=ctl.loop(P,C),ps=ctl.poles(G.Gyr),uns=_w13_rhp(ps);
      var mg=ctl.margins(L,1e-3,1e5),sm=ctl.smax(L,1e-3,1e5),Kv=50*Kc*(lag?lag[0]/lag[1]:1),hf=Kc*(lead?lead[1]/lead[0]:1);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[];
      /* (a) 一巡伝達関数と仕様 */
      var bx=nar?58:62,bw=nar?320:330,wr=[0.01,3000],ws=ctl.logspace(-2,Math.log10(3000),700),B=ctl.bode(L,ws);
      var bd=ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4}],{x:bx,y:26,w:bw,hm:150,hp:100,gap:28,wr:wr,dbr:[-60,120],phr:[-270,-90]});
      o.push(S.TX(bx-48,14,"(a) 一巡伝達関数（折れ点の印をドラッグ）","start",10.5,"ink",true));o.push(bd.svg);
      var Pm=bd.Pm,Pp=bd.Pp;
      o.push(Pm.clip([[0.01,20*Math.log10(500/0.01)],[5,20*Math.log10(100)]],"alias",1.5,"5 3"));
      o.push(S.T(Pm.X(5)+4,Pm.Y(40),"500/ω","start",9,"alias",true,false,null,true));
      o.push(S.L(Pm.X(60),Pm.y,Pm.X(60),Pp.y+Pp.h,"faint",1,"2 3"));o.push(S.TX(Pm.X(60)+3,Pm.y+11,"60 rad/s","start",9,"muted",false,true));
      o.push(S.L(Pp.x,Pp.Y(-130),Pp.x+Pp.w,Pp.Y(-130),"green",1,"4 3"));o.push(S.T(Pp.x+4,Pp.Y(-130)-4,"位相余裕 50°","start",9,"green",false,false,null,true));
      if(mg.wgc&&mg.wgc>=wr[0]&&mg.wgc<=wr[1]){o.push(S.D(Pm.X(mg.wgc),Pm.Y(0),"signal",4));var phg=-180+mg.pm;if(phg>=-270&&phg<=-90)o.push(S.L(Pp.X(mg.wgc),Pp.Y(-180),Pp.X(mg.wgc),Pp.Y(phg),mg.pm>0?"green":"alias",2.4));}
      /* 折れ点の印 */
      var marks=[],yb=Pm.y+Pm.h-9;
      function mk(k,w,zero,on){if(!on)return;var xx=Pm.X(w);if(xx<Pm.x||xx>Pm.x+Pm.w)return;marks.push({k:k,x:xx,y:yb});
        if(zero)o.push(S.CIRC(xx,yb,5.5,"gold",2,"var(--screen)"));else o.push(S.X(xx,yb,5.5,"gold",2.2));
        o.push(S.TX(xx,yb-10,{p1:"ω_p1",z1:"ω_z1",z2:"ω_z2",p2:"ω_p2"}[k],"middle",9,"gold",true,true));}
      mk("p1",sp1.get(),false,!!lag);mk("z1",sz1.get(),true,!!lag);mk("z2",sz2.get(),true,!!lead);mk("p2",sp2.get(),false,!!lead);
      /* (b) |S| */
      var x2=nar?58:470,y2=nar?bd.h+30:26,w2=nar?320:210,h2=nar?120:120;
      var Pb=U.plot(x2,y2+14,w2,h2,[0.1,3000],[-40,15],{xlog:true});
      o.push(S.T(x2-48+(nar?0:20),y2+2,"(b) |S(jω)| [dB]","start",10.5,"ink",true));
      o.push(Pb.axes({xl:"ω [rad/s]",yl:nar?"ゲイン [dB]":null,xt:[0.1,1,10,100,1000],yt:[-40,-20,0,10],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.L(Pb.x,Pb.Y(0),Pb.x+Pb.w,Pb.Y(0),"muted",1));
      var wl=ctl.logspace(-1,Math.log10(3000),400);
      o.push(Pb.clip(wl.map(function(w){return [w,-20*Math.log10(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))))];}),uns?"alias":"signal",2.2));
      if(!uns&&isFinite(sm.Ms)&&sm.w>=0.1&&sm.w<=3000)o.push(S.D(Pb.X(sm.w),Pb.Y(Math.min(15,20*Math.log10(sm.Ms))),"alias",4));
      /* (c) 角度と (d) 電圧 */
      var y3=nar?y2+h2+60:y2+h2+56,x3=nar?58:470,w3=nar?320:210,tE=0.4;
      var Ry=ctl.step(G.Gyr,tE,800),Ru=ctl.step(G.Gur,tE,800);
      var Pc=U.plot(x3,y3+14,w3,100,[0,tE],[0,1.6]);
      o.push(S.T(x3-48+(nar?0:20),y3+2,"(c) 角度（目標 1 rad）","start",10.5,"ink",true));
      o.push(Pc.axes({xl:null,yl:nar?"角度 [rad]":null,xt:[0,0.1,0.2,0.3,0.4],yt:[0,0.5,1,1.5],xfmt:function(){return "";},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.RECT(Pc.x,Pc.Y(1.02),Pc.w,Pc.Y(0.98)-Pc.Y(1.02),0,U.soft("green"),"none",0));
      o.push(Pc.line([[0,1],[tE,1]],"muted",1.1,"5 3"));
      o.push(Pc.clip(Ry.t.map(function(t,k){return [t,Ry.y[k]];}),uns?"alias":"signal",2.2));
      var y4=y3+14+100+14,umax=0;Ru.y.forEach(function(v){umax=Math.max(umax,Math.abs(v));});
      var ur=Math.max(14,Math.min(200,umax*1.1)),Pd=U.plot(x3,y4+14,w3,80,[0,tE],[-ur,ur]);
      o.push(S.T(x3-48+(nar?0:20),y4+6,"(d) 電圧 [V]","start",10.5,"ink",true));
      o.push(Pd.axes({xl:"時間 t [s]",yl:null,xt:[0,0.1,0.2,0.3,0.4],yt:[-12,0,12],xfmt:function(v){return _w13_g(v,2);},yfmt:function(v){return _w13_g(v,3);},sz:9}));
      [12,-12].forEach(function(v){o.push(S.L(Pd.x,Pd.Y(v),Pd.x+Pd.w,Pd.Y(v),"alias",1,"4 3"));});
      o.push(Pd.clip(Ru.t.map(function(t,k){return [t,Ru.y[k]];}),"gold",2));
      var Hh=nar?y4+14+80+40:Math.max(bd.h+10,y4+14+80+40);
      box.set(S.svg(Wd,Hh,o));
      last={Pm:Pm,marks:marks};
      /* 読み出し（仕様の判定） */
      var LR=ctl.step(G.Gyr,3,6000),met=_w13_met(LR.t,LR.y,1);
      function ok(b,t){return b?'<span class="ok">'+t+'</span>':'<span class="warn">'+t+'</span>';}
      var h="";
      if(uns)h+='<span class="warn">閉ループが不安定</span>（閉ループの極: '+_w13_poles(ps)+'）<br>';
      h+="仕様 1 交差 60 rad/s: "+(mg.wgc?ok(Math.abs(mg.wgc-60)<=6,_w13_g(mg.wgc,3)+" rad/s"):ok(false,"交差なし"))+"　仕様 2 位相余裕 50° 以上: "+(mg.pm!=null?ok(mg.pm>=50,_w13_f(mg.pm,1)+"°"):ok(false,"—"))+"<br>";
      h+="仕様 3 lim sPC ≥ 500 /s: "+ok(Kv>=500,_w13_g(Kv,3)+" /s（定常速度偏差 "+_w13_g(1/Kv,3)+" rad）")+"　仕様 4 高い角周波数のゲイン ≤ 12 V/rad: "+ok(hf<=12,_w13_g(hf,3)+" V/rad")+"<br>";
      h+="ゲイン余裕 "+(mg.gmDb!=null?_w13_f(mg.gmDb,1)+" dB":"—")+"、最大感度 M<sub>s</sub> = "+_w13_g(sm.Ms,3)+"（距離 "+_w13_g(1/sm.Ms,3)+"）<br>";
      if(!uns)h+="目標 1 rad のステップ: 行き過ぎ量 <b>"+_w13_f(met.mp,1)+" %</b>、2 % 整定時間 <b>"+(isFinite(met.ts)?_w13_g(met.ts,3)+" s":"3 s より長い")+"</b>、電圧の最大 "+_w13_g(umax,3)+" V"+(umax>12?' <span class="warn">（12 V を越える）</span>':"")+"<br>";
      h+="制御器: K<sub>c</sub> = "+_w13_s3(Kc)+" V/rad"+(lag?"、遅れ補償器 (s + "+_w13_g(lag[0],3)+")/(s + "+_w13_g(lag[1],3)+")":"")+(lead?"、進み補償器 α = "+_w13_g(lead[1]/lead[0],3)+"（中心 "+_w13_g(Math.sqrt(lead[0]*lead[1]),3)+" rad/s）":"");
      ro.innerHTML=h;
    }
    draw();
  };
