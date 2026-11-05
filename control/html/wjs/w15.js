  /* ===== 15 章 サンプリングと離散化 ===== */
  function _w15_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w15_f(v,d){if(v===null||v===undefined)return "—";v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w15_g(v,d){d=d||3;if(v===null||v===undefined||isNaN(v))return "—";if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w15_ms(T){return _w15_g(T*1000,3)+" ms";}
  /* 対象（本文の例の値） */
  var _W15_POS={num:[1000],den:[1,20,0]};        /* モータの角度（L_a を無視）rad/V */
  var _W15_SPD={num:[50],den:[0.05,1]};          /* モータの速度 (rad/s)/V */
  /* 状態空間を刻み h で零次ホールドの離散化（U.ctl.ss と U.ctl.mat.c2d） */
  function _w15_dss(U,G,h){var S=U.ctl.ss(U.ctl.tf(G.num,G.den)),d=U.ctl.mat.c2d(S.A,S.B,h);
    return {A:d.A,B:d.B.map(function(r){return r[0];}),C:S.C[0],D:S.D[0][0],n:S.A.length};}
  function _w15_out(s,x){var y=s.D*0;for(var i=0;i<s.n;i++)y+=s.C[i]*x[i];return y;}
  function _w15_adv(s,x,u){var nx=[];for(var i=0;i<s.n;i++){var v=s.B[i]*u;for(var j=0;j<s.n;j++)v+=s.A[i][j]*x[j];nx.push(v);}return nx;}
  /* サンプリングした閉ループ: 対象は h = Ts/M で厳密に進める。ctrl(e) を Ts ごとに呼び、lc 刻み後に出して保つ */
  function _w15_simsd(U,G,ctrl,Ts,tEnd,M,lc,r){var h=Ts/M,s=_w15_dss(U,G,h),n=Math.round(tEnd/h),x=[],i,T=[],Y=[],Uo=[],uo=0,pend=null,blow=false;
    for(i=0;i<s.n;i++)x.push(0);
    for(i=0;i<=n;i++){var y=_w15_out(s,x);
      if(i%M===0){var uc=ctrl(r-y);if(!lc)uo=uc;else pend=[i+lc,uc];}
      if(pend&&i===pend[0]){uo=pend[1];pend=null;}
      T.push(i*h);Y.push(y);Uo.push(uo);
      if(!isFinite(y)||Math.abs(y)>1e6){blow=true;break;}
      x=_w15_adv(s,x,uo);}
    return {t:T,y:Y,u:Uo,blow:blow};}
  /* 連続時間の比例制御。測った値を Lm、操作量を Lu 遅らせる（比べる相手） */
  function _w15_simfb(U,G,Kp,tEnd,h,Lm,Lu,r){var s=_w15_dss(U,G,h),n=Math.round(tEnd/h),nm=Math.round(Lm/h),nu=Math.round(Lu/h),bm=[],bu=[],im=0,iu=0,x=[],i,T=[],Y=[],Uo=[];
    for(i=0;i<s.n;i++)x.push(0);for(i=0;i<Math.max(1,nm);i++)bm.push(0);for(i=0;i<Math.max(1,nu);i++)bu.push(0);
    for(i=0;i<=n;i++){var y=_w15_out(s,x),ym=y;if(nm){ym=bm[im];bm[im]=y;im=(im+1)%nm;}
      var u=Kp*(r-ym),ua=u;if(nu){ua=bu[iu];bu[iu]=u;iu=(iu+1)%nu;}
      T.push(i*h);Y.push(y);Uo.push(ua);if(!isFinite(y)||Math.abs(y)>1e6)break;x=_w15_adv(s,x,ua);}
    return {t:T,y:Y,u:Uo};}
  /* 行き過ぎ量 [%] と 2 % 整定時間（落ち着かなければ NaN） */
  function _w15_met(t,y,yf){var mx=-Infinity,last=-1,bd=0.02*Math.abs(yf);for(var k=0;k<y.length;k++){if(y[k]>mx)mx=y[k];if(Math.abs(y[k]-yf)>bd)last=k;}
    return {mp:(mx-yf)/Math.abs(yf)*100,ts:last<0?0:(last+1<t.length?t[last+1]:NaN)};}
  /* 離散時間の状態空間の値 P(z) = C (zI − A)^{-1} B + D（複素数の掃き出し） */
  function _w15_pz(U,s,z){var cx=U.ctl.cx,c=U.ctl.c,n=s.n,M=[],i,j,k;
    for(i=0;i<n;i++){var row=[];for(j=0;j<n;j++)row.push(cx.sub(i===j?z:c(0,0),c(s.A[i][j],0)));row.push(c(s.B[i],0));M.push(row);}
    for(k=0;k<n;k++){var p=k,mx=cx.abs(M[k][k]);for(i=k+1;i<n;i++)if(cx.abs(M[i][k])>mx){mx=cx.abs(M[i][k]);p=i;}
      var tmp=M[k];M[k]=M[p];M[p]=tmp;for(i=k+1;i<n;i++){var f=cx.div(M[i][k],M[k][k]);for(j=k;j<=n;j++)M[i][j]=cx.sub(M[i][j],cx.mul(f,M[k][j]));}}
    var X=[];for(i=n-1;i>=0;i--){var v=M[i][n];for(j=i+1;j<n;j++)v=cx.sub(v,cx.mul(M[i][j],X[j]));X[i]=cx.div(v,M[i][i]);}
    var y=c(s.D,0);for(i=0;i<n;i++)y=cx.add(y,cx.scale(X[i],s.C[i]));return y;}
  /* 離散時間のループ L(e^{jωTs}) = P(z) C(z) z^{-ex} の位相余裕と交差（ω は π/Ts まで） */
  function _w15_dmargin(U,G,Ts,cz,ex){var s=_w15_dss(U,G,Ts),cx=U.ctl.cx,ws=U.ctl.logspace(-2,Math.log10(Math.PI/Ts*0.9999),1500),prev=null,pm=null,wgc=null,ph0=null,i;
    function L(w){var z=cx.polar(1,w*Ts),v=cx.mul(_w15_pz(U,s,z),cz(z));if(ex)v=cx.mul(v,cx.polar(1,-ex*w*Ts));return v;}
    for(i=0;i<ws.length;i++){var v=L(ws[i]),m=cx.abs(v),ph=cx.arg(v)*180/Math.PI;
      if(ph0!==null){while(ph-ph0>180)ph-=360;while(ph-ph0<-180)ph+=360;}ph0=ph;
      if(prev&&(prev.m-1)*(m-1)<=0&&prev.m!==m){var a=(Math.log(prev.m)-0)/(Math.log(prev.m)-Math.log(m));wgc=Math.exp(Math.log(prev.w)+a*(Math.log(ws[i])-Math.log(prev.w)));pm=180+prev.ph+a*(ph-prev.ph);break;}
      prev={m:m,ph:ph,w:ws[i]};}
    return {pm:pm,wgc:wgc};}

  /* ---- 2 節: 零次ホールドとサンプリングの遅れ ---- */
  REG.w15_zoh=function(el,U){
    var S=U.S,ctl=U.ctl;
    U.head(el,"ZERO-ORDER HOLD","T_s ごとに測って比例制御する — 保つことは T_s/2 のむだ時間と同じ".replace(/T_s/g,"T<sub>s</sub>"));
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["モータの角度（比例制御）","モータの速度（比例制御）"],0,function(){kpA.el.style.display=obj.get()===0?"":"none";kpB.el.style.display=obj.get()===1?"":"none";draw();});
    var kpA=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0.05,0.1,0.21,0.3,0.5,0.84],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var kpB=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0.02,0.05,0.1,0.2,0.3,0.5],value:0.1,fmt:function(v){return v+" V/(rad/s)";},onInput:draw});
    kpB.el.style.display="none";
    var r2=U.ctrls(el);
    var tsS=U.slider(r2,"サンプリング周期 T<sub>s</sub>",{values:[0.5,1,2,5,10,15,20,30,50,70,100,150],value:50,fmt:function(v){return v+" ms";},onInput:draw});
    var lcS=U.select(r2,"出す時刻",["(A) すぐ出す（測ってから出すまで 0）","(A) 測ってから出すまで Tₛ/4","(A) 測ってから出すまで Tₛ/2","(B) 次の周期に出す（Tₛ 後）"],0,draw);
    var r3=U.ctrls(el);
    var cmp=U.checkbox(r3,"連続時間のループ（測った値を T<sub>s</sub>/2、操作量を L<sub>c</sub> 遅らせる）を重ねる",true,draw);
    var br=U.btnrow(el);
    function base(o,k,t,l){obj.set(o);kpA.el.style.display=o===0?"":"none";kpB.el.style.display=o===1?"":"none";if(o===0)kpA.set(k);else kpB.set(k);tsS.set(t);lcS.set(l);cmp.set(true);draw();}
    U.button(br,"本文の例（モータの角度、50 ms）",function(){base(0,0.21,50,0);});
    U.button(br,"(B) の出し方で 50 ms",function(){base(0,0.21,50,3);});
    U.button(br,"モータの角度、1 ms",function(){base(0,0.21,1,0);});
    U.button(br,"モータの速度、15 ms（式が合わない）",function(){base(1,0.1,15,0);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var o2=obj.get(),G=o2===0?_W15_POS:_W15_SPD,Kp=o2===0?kpA.get():kpB.get(),Ts=tsS.get()/1000,lf=[0,0.25,0.5,1][lcS.get()],Lc=lf*Ts;
      var r=o2===0?1:100,tEnd=o2===0?1.2:0.25,yu=o2===0?"rad":"rad/s",yl=o2===0?"角度":"角速度";
      var M=Math.max(10,Math.ceil(Ts/(o2===0?5e-4:1e-4))),lc=Math.round(lf*M);
      var sd=_w15_simsd(U,G,function(e){return Kp*e;},Ts,tEnd,M,lc,r);
      var hc=o2===0?1e-4:2e-5,ct=_w15_simfb(U,G,Kp,tEnd,hc,0,0,r),dl=_w15_simfb(U,G,Kp,tEnd,hc,Ts/2,Lc,r);
      var yf=r*(o2===0?1:50*Kp/(1+50*Kp));
      /* 余裕 */
      var L0=ctl.tf(G.num.map(function(v){return v*Kp;}),G.den),m0=ctl.margins(L0,1e-2,1e5);
      var wgc=m0.wgc,pm0=m0.pm,pmA=pm0!==null?pm0-wgc*(Lc+Ts/2)*180/Math.PI:null;
      var nar=_w15_nar(box),Wd=nar?400:700,o=[];
      /* (a) 応答 */
      var ax=nar?52:62,aw=nar?330:360,ymax=0;
      [sd,ct].forEach(function(R){R.y.forEach(function(v){if(isFinite(v))ymax=Math.max(ymax,v);});});
      var yt=Math.min(2.2*r,Math.max(1.3*r,ymax*1.08));
      var P=U.plot(ax,26,aw,170,[0,tEnd],[0,yt]);
      o.push(S.T(ax-50,14,"(a) 目標を "+(o2===0?"1 rad":"100 rad/s")+" 変えたときの"+yl,"start",10.5,"ink",true));
      o.push(P.axes({xl:"時間 t [s]",yl:yl+" ["+yu+"]",xt:U.nice(0,tEnd,5),yt:U.nice(0,yt,4).filter(function(v){return v<=yt;}),xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,3);},sz:9}));
      o.push(P.line([[0,yf],[tEnd,yf]],"muted",1,"5 3"));
      function pl(R,c,lw,dash,step){var pts=[];for(var i=0;i<R.t.length;i+=step)pts.push([R.t[i],R.y[i]]);return P.clip(pts,c,lw,dash);}
      o.push(pl(ct,"muted",1.6,"5 3",Math.max(1,Math.round(ct.t.length/600))));
      if(cmp.get())o.push(pl(dl,"teal",1.4,"3 3",Math.max(1,Math.round(dl.t.length/600))));
      o.push(pl(sd,"signal",2.1,null,Math.max(1,Math.round(sd.t.length/800))));
      for(var k=0;k*Ts<=tEnd+1e-12;k++){var ii=k*M;if(ii<sd.y.length&&sd.y[ii]<=yt&&sd.y[ii]>=0)o.push(S.D(P.X(sd.t[ii]),P.Y(sd.y[ii]),"signal",2.3));}
      /* (b) 操作量 */
      var umin=0,umax=0;[sd,ct].forEach(function(R){R.u.forEach(function(v){if(isFinite(v)){umin=Math.min(umin,v);umax=Math.max(umax,v);}});});
      var ur=Math.max(Math.abs(umin),Math.abs(umax))*1.1||1,Q=U.plot(ax,26+170+56,aw,80,[0,tEnd],[Math.max(-ur,umin*1.1-0.02*ur),umax*1.1+0.02*ur]);
      o.push(S.T(ax-50,26+170+44,"(b) 電圧（階段）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:U.nice(0,tEnd,5),yt:U.nice(Q.yr[0],Q.yr[1],3).filter(function(v){return v>=Q.yr[0]&&v<=Q.yr[1];}),xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,2);},sz:9}));
      o.push(Q.line([[0,0],[tEnd,0]],"muted",0.8));
      var cu=[];for(var i2=0;i2<ct.t.length;i2+=Math.max(1,Math.round(ct.t.length/600)))cu.push([ct.t[i2],ct.u[i2]]);o.push(Q.clip(cu,"muted",1.4,"5 3"));
      var su=[];for(var i3=0;i3<sd.t.length;i3+=Math.max(1,Math.round(sd.t.length/1200)))su.push([sd.t[i3],sd.u[i3]]);o.push(Q.clip(su,"gold",2));
      /* (c) 一巡伝達関数の位相（ボード線図） */
      var bx=nar?52:500,by=nar?26+170+56+80+60:26,bw=nar?330:180;
      var wr=o2===0?[1,1000]:[10,10000],ws=ctl.logspace(Math.log10(wr[0]),Math.log10(wr[1]),400);
      var B0=ctl.bode(L0,ws),B1=ctl.bode(ctl.tf(L0.num,L0.den,Lc+Ts/2),ws);
      var phr=[-270,0];
      var bd=ctl.bodeSvg([{w:ws,db:B0.db,ph:B0.ph,c:"muted",dash:"5 3",lw:1.6},{w:ws,db:B1.db,ph:B1.ph,c:"signal",lw:2}],{x:bx,y:by+12,w:bw,hm:80,hp:120,gap:24,wr:wr,dbr:[-40,40],phr:phr});
      o.push(S.T(bx-48,by,"(c) 一巡伝達関数","start",10.5,"ink",true));o.push(bd.svg);
      if(wgc){o.push(S.L(bd.Pm.X(wgc),bd.Pm.y,bd.Pm.X(wgc),bd.Pp.y+bd.Pp.h,"faint",1,"3 3"));
        var p0=-180+pm0,p1=-180+pmA;
        if(p0>=phr[0])o.push(S.D(bd.Pp.X(wgc),bd.Pp.Y(p0),"muted",3.5));
        if(p1>=phr[0])o.push(S.D(bd.Pp.X(wgc),bd.Pp.Y(p1),"signal",3.8));
        o.push(S.TX(bd.Pp.X(wgc)+4,bd.Pp.y+bd.Pp.h-6,"ω_gc","start",9,"muted",true,true));}
      var wn=Math.PI/Ts;if(wn>=wr[0]&&wn<=wr[1]){o.push(S.L(bd.Pm.X(wn),bd.Pm.y,bd.Pm.X(wn),bd.Pp.y+bd.Pp.h,"alias",1,"2 3"));o.push(S.TX(bd.Pm.X(wn)-3,bd.Pm.y+10,"π/T_s","end",9,"alias",true,true));}
      var lgY=nar?by+12+80+24+120+52:26+170+56+80+64;
      o.push(S.LEGL(nar?52:62,lgY,[["muted","5 3","連続時間"],["signal",null,"サンプリング"],["teal","3 3","連続時間＋むだ時間"]],9.5,12));
      if(!nar)o.push(S.LEGL(500,26+12+80+24+120+52,[["muted","5 3","遅れなし"],["signal",null,"−ω(L_c + T_s/2)"]],9,8));
      box.set(S.svg(Wd,lgY+12,o));
      /* 読み出し */
      var ms=_w15_met(sd.t,sd.y,yf),mc=_w15_met(ct.t,ct.y,yf),md=_w15_met(dl.t,dl.y,yf),h="",wT=wgc?wgc*Ts:0;
      if(wgc){h+="連続時間: ω<sub>gc</sub> = "+_w15_g(wgc,3)+" rad/s、位相余裕 φ<sub>m</sub>(0) = "+_w15_f(pm0,1)+"°、行き過ぎ量 "+_w15_f(mc.mp,1)+" %<br>";
        h+="位相余裕の式 φ<sub>m</sub>(0) − 57.3° × ω<sub>gc</sub>(L<sub>c</sub> + T<sub>s</sub>/2) = "+_w15_f(pm0,1)+"° − "+_w15_f(pm0-pmA,1)+"° = <b>"+_w15_f(pmA,1)+"°</b>（L<sub>c</sub> = "+_w15_ms(Lc)+"）<br>";}
      else h+="一巡伝達関数のゲインが 1 を超えないので、ゲイン交差角周波数は無く、位相余裕は決まらない（このループはどの遅れでも不安定にならない）<br>";
      if(sd.blow)h+='<span class="warn">サンプリングした閉ループは発散した</span><br>';
      else h+="行き過ぎ量: サンプリング <b>"+_w15_f(ms.mp,1)+" %</b>、連続時間＋むだ時間 "+_w15_f(md.mp,1)+" %（2 % 整定時間 "+(isFinite(ms.ts)?_w15_g(ms.ts,3)+" s":"範囲の外")+"）<br>";
      if(wgc)h+="ω<sub>gc</sub>T<sub>s</sub> = "+_w15_g(wT,3)+" rad"+(wT>0.5?'：<span class="warn">0.5 rad を超えたので、式の値は合わなくなる（5 節）</span>':"（0.5 rad 以下なので、式はよく合う）");
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 3 節: エイリアシングとアンチエイリアスフィルタ ---- */
  REG.w15_alias=function(el,U){
    var S=U.S;
    U.head(el,"ALIASING","速い揺れが、取り出した点の列で遅い揺れに化ける");
    var r0=U.ctrls(el);
    var mode=U.select(r0,"場面",["波形で見る（周波数を fₛ との比で選ぶ）","温度の板（50 Hz を 1 s ごとに読む）"],0,function(){sync();draw();});
    var r1=U.ctrls(el);
    var fr=U.slider(r1,"揺れの周波数 f / f<sub>s</sub>",{min:0.05,max:3,step:0.01,value:0.9,fmt:function(v){return _w15_f(v,2);},onInput:draw});
    var fon=U.checkbox(r1,"アンチエイリアスフィルタ（RC）",false,draw);
    var fc=U.slider(r1,"フィルタの折れ点 / f<sub>s</sub>",{values:[0.05,0.1,0.2,0.3,0.5],value:0.1,fmt:function(v){return _w15_f(v,2);},onInput:draw});
    var r2=U.ctrls(el);
    var fm=U.slider(r2,"商用電源の周波数",{values:[49.98,49.99,49.995,49.9975,50,50.0025,50.005,50.01,50.02],value:50.0025,fmt:function(v){return _w15_g(v,6)+" Hz";},onInput:draw});
    var am=U.slider(r2,"読みに乗る揺れの振幅",{values:[0,0.1,0.2,0.5,1],value:0.5,fmt:function(v){return v+" K";},onInput:draw});
    var ft=U.select(r2,"フィルタ",["なし","RC（Tf = 0.1 s）を ADC の前に","1 ms ごとに 100 回測って平均"],0,draw);
    var ph=U.slider(r2,"50 Hz の位相（測る瞬間）",{min:0,max:360,step:15,value:90,fmt:function(v){return v+"°";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（0.9f<sub>s</sub>）",function(){mode.set(0);fr.set(0.9);fon.set(false);fc.set(0.1);sync();draw();});
    U.button(br,"1.9f<sub>s</sub>（0.1f<sub>s</sub> に化ける）",function(){mode.set(0);fr.set(1.9);fon.set(false);sync();draw();});
    U.button(br,"ちょうど f<sub>s</sub>（一定のずれ）",function(){mode.set(0);fr.set(1);fon.set(false);sync();draw();});
    U.button(br,"温度の板の例（50.0025 Hz）",function(){mode.set(1);fm.set(50.0025);am.set(0.5);ft.set(0);ph.set(90);sync();draw();});
    U.button(br,"温度の板、ちょうど 50 Hz",function(){mode.set(1);fm.set(50);am.set(0.5);ft.set(0);ph.set(90);sync();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function sync(){var m=mode.get();r1.style.display=m===0?"":"none";r2.style.display=m===1?"":"none";fc.el.style.display=fon.get()?"":"none";}
    function fold(x){return Math.abs(x-Math.round(x));}
    function draw(){
      sync();
      var nar=_w15_nar(box),Wd=nar?400:700,o=[],h="";
      if(mode.get()===0){
        var f=fr.get(),g=1,phi=0;
        if(fon.get()){var x=f/fc.get();g=1/Math.sqrt(1+x*x);phi=-Math.atan(x);}
        var fa=fold(f),ax=nar?44:62,aw=nar?340:610;
        var P=U.plot(ax,26,aw,150,[0,16],[-1.3,1.3]);
        o.push(S.TX(ax-40,14,"(a) 揺れ（振幅 1）を T_s ごとに取り出す（横軸は t/T_s）","start",10.5,"ink",true));
        o.push(P.axes({xl:"時間 t / T_s",yl:"値",xt:U.nice(0,16,8),yt:[-1,0,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w15_g(v,2);},sz:9}));
        var pts=[],ptsF=[],ali=[];for(var i=0;i<=1600;i++){var t=i/100;pts.push([t,Math.sin(2*Math.PI*f*t)]);ptsF.push([t,g*Math.sin(2*Math.PI*f*t+phi)]);}
        /* 点の列が示す遅い揺れ: 周波数 f − m（m は最も近い整数） */
        var mm=Math.round(f);for(var j=0;j<=800;j++){var t2=j/50;ali.push([t2,g*Math.sin(2*Math.PI*(f-mm)*t2+phi)]);}
        o.push(P.line(pts,"teal",fon.get()?0.9:1.3,fon.get()?"3 3":null));
        if(fon.get())o.push(P.line(ptsF,"teal",1.5));
        o.push(P.line(ali,"alias",2,"7 4"));
        for(var k=0;k<=16;k++)o.push(S.D(P.X(k),P.Y(g*Math.sin(2*Math.PI*f*k+phi)),"ink",3.2));
        /* (b) 折り返し */
        var Q=U.plot(ax,26+150+70,aw,120,[0,3],[0,0.6]);
        o.push(S.T(ax-40,26+150+58,"(b) 元の周波数と、点の列に現れる周波数","start",10.5,"ink",true));
        o.push(S.RECT(Q.X(0.5),Q.y,Q.X(3)-Q.X(0.5),Q.h,0,U.soft("alias"),"none",0));
        o.push(Q.axes({xl:"元の周波数 f / f_s",yl:"現れる周波数 / f_s",xt:[0,0.5,1,1.5,2,2.5,3],yt:[0,0.25,0.5],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},sz:9}));
        var tri=[];for(var q=0;q<=600;q++){var xx=q/200;tri.push([xx,fold(xx)]);}
        o.push(Q.line(tri,"signal",2));
        o.push(S.L(Q.X(f),Q.Y(0),Q.X(f),Q.Y(fa),"alias",1.2,"3 3"));o.push(S.L(Q.X(0),Q.Y(fa),Q.X(f),Q.Y(fa),"alias",1.2,"3 3"));
        o.push(S.D(Q.X(f),Q.Y(fa),"alias",4.5));o.push(S.D(Q.X(fa),Q.Y(fa),"green",4));
        box.set(S.svg(Wd,26+150+70+120+44,o));
        h+="元の揺れの周波数 f = "+_w15_f(f,2)+" f<sub>s</sub> → 点の列に現れる周波数 |f − "+mm+"f<sub>s</sub>| = <b>"+_w15_f(fa,2)+" f<sub>s</sub></b>"+(f>0.5?"（ナイキスト周波数 0.5 f<sub>s</sub> より速いので、折り返して現れる）":"（ナイキスト周波数より遅いので、そのまま現れる）")+"<br>";
        if(fa<1e-9)h+='<span class="warn">f<sub>s</sub> の整数倍なので、毎回同じ位相を測り、一定のずれに化ける</span><br>';
        h+="化けた揺れの振幅: <b>"+_w15_f(g,3)+"</b>"+(fon.get()?"（フィルタのゲイン。折れ点 "+_w15_f(fc.get(),2)+" f<sub>s</sub>）":"（フィルタなし）");
      }else{
        /* 温度の板（11 章 3 節の PI: 10 W/K・160 s、1 s ごと、クランプ）。読みに 50 Hz の揺れ */
        var fM=fm.get(),A=am.get(),F=ft.get(),ph0=ph.get()*Math.PI/180,tEnd=1600,hh=0.1,qd=Math.exp(-hh/500),n=Math.round(tEnd/hh),nd=Math.round(20/hh);
        var y=35,I=28,u=28,buf=[],bi=0,out=[];for(var b=0;b<nd;b++)buf.push(28);
        var Hm=1/Math.sqrt(1+Math.pow(2*Math.PI*fM*0.1,2)),Ha=-Math.atan(2*Math.PI*fM*0.1);
        for(var i4=0;i4<=n;i4++){var tt=i4*hh;
          if(i4%10===0){var hum;
            if(F===0)hum=A*Math.sin(2*Math.PI*fM*tt+ph0);
            else if(F===1)hum=A*Hm*Math.sin(2*Math.PI*fM*tt+ph0+Ha);
            else{hum=0;for(var jj=0;jj<100;jj++)hum+=A*Math.sin(2*Math.PI*fM*(tt-0.1+(jj+1)*0.001)+ph0);hum/=100;}
            var rd=y+hum,e=35-rd,uc=10*e+I;u=Math.min(Math.max(uc,0),80);
            if(!((uc>80&&e>0)||(uc<0&&e<0)))I+=10/160*e;
            out.push([tt,y+25,rd+25,u]);}
          var ua=buf[bi];buf[bi]=u;bi=(bi+1)%nd;y=1.25*ua+(y-1.25*ua)*qd;}
        var late=out.filter(function(p){return p[0]>=800;});
        function rng(c){var a=Infinity,b2=-Infinity,s=0;late.forEach(function(p){a=Math.min(a,p[c]);b2=Math.max(b2,p[c]);s+=p[c];});return {lo:a,hi:b2,mean:s/late.length};}
        var Rt=rng(1),Rr=rng(2),Ru=rng(3);
        var ax2=nar?50:70,aw2=nar?330:600,rows=[["(a) 読み [°C]",2,[58.8,61.2],[59,60,61]],["(b) ヒータの電力 [W]",3,[18,38],[20,28,36]],["(c) 本当の板の温度 [°C]",1,[58.8,61.2],[59,60,61]]],y0=20;
        rows.forEach(function(rw,ri){var Pq=U.plot(ax2,y0+12,aw2,82,[0,1600],rw[2]);
          o.push(S.T(ax2,y0+4,rw[0],"start",10,"ink",true));
          o.push(Pq.axes({xl:ri===2?"時間 t [s]":null,xt:[0,400,800,1200,1600],yt:rw[3],xfmt:ri===2?function(v){return String(v);}:function(){return "";},yfmt:function(v){return String(v);},sz:9}));
          if(rw[1]!==3)o.push(Pq.line([[0,60],[1600,60]],"muted",1,"5 3"));
          o.push(Pq.clip(out.map(function(p){return [p[0],p[rw[1]]];}),rw[1]===3?"gold":(rw[1]===2?"teal":"signal"),1.6));
          y0+=ri===2?130:112;});
        box.set(S.svg(Wd,y0+8,o));
        var fa2=Math.abs(fM-50*1);
        h+="読みに現れる揺れの周波数 |"+_w15_g(fM,6)+" − 50 × 1| = <b>"+_w15_g(fa2,3)+" Hz</b>"+(fa2>1e-12?"（周期 "+_w15_g(1/fa2,3)+" s）":"（一定のずれ）")+"<br>";
        h+="800 s より後: 本当の温度 "+_w15_f(Rt.lo,2)+"〜"+_w15_f(Rt.hi,2)+" °C（平均 "+_w15_f(Rt.mean,2)+" °C）、読み "+_w15_f(Rr.lo,2)+"〜"+_w15_f(Rr.hi,2)+" °C、ヒータ "+_w15_f(Ru.lo,1)+"〜"+_w15_f(Ru.hi,1)+" W<br>";
        if(F===0&&A>0&&(Rt.hi-Rt.lo>0.2||Math.abs(Rt.mean-60)>0.1))h+='<span class="warn">50 Hz の揺れが、本当の温度を動かしている</span>';
        else if(A>0)h+='<span class="ok">本当の温度への影響は小さい</span>';
      }
      ro.innerHTML=h;
    }
    sync();draw();
  };

  /* ---- 4 節: 差分で近似する ---- */
  /* 計算式 u[k] = b0 e[k] + b1 e[k−1] + a u[k−1] の係数。kind: 0 進み補償（13 章 3 節）、1 PI（10 章 5 節） */
  function _w15_coef(kind,m,Ts){
    if(kind===0){var Kc=0.624,wz=17.3,wp=52.0,w0=30;
      if(m===0)return {b0:Kc*wp/wz,b1:Kc*(wp*Ts-wp/wz),a:1-wp*Ts};
      if(m===1){var a=1/(1+wp*Ts);return {b0:Kc*(wp/wz)*(1+wz*Ts)*a,b1:-Kc*(wp/wz)*a,a:a};}
      var g=m===2?2/Ts:w0/Math.tan(w0*Ts/2),d=g/wp+1;return {b0:Kc*(g/wz+1)/d,b1:-Kc*(g/wz-1)/d,a:(g/wp-1)/d};}
    var Kp=0.1,Ki=2,w1=100;
    if(m===0)return {b0:Kp,b1:Ki*Ts-Kp,a:1};
    if(m===1)return {b0:Kp+Ki*Ts,b1:-Kp,a:1};
    var g2=m===2?2/Ts:w1/Math.tan(w1*Ts/2);return {b0:Kp+Ki/g2,b1:Ki/g2-Kp,a:1};}
  var _W15_MCOL=["purple","teal","signal","green"],_W15_MNAME=["前進差分","後退差分","双一次変換","双一次変換＋プリワーピング"];
  REG.w15_disc=function(el,U){
    var S=U.S,ctl=U.ctl,cx=ctl.cx;
    U.head(el,"DISCRETIZATION","伝達関数の制御器を、T_s ごとの計算式にする".replace("T_s","T<sub>s</sub>"));
    var r1=U.ctrls(el);
    var kd=U.select(r1,"制御器",["進み補償（13 章 3 節）","PI（10 章 5 節）"],0,draw);
    var mt=U.select(r1,"近似",_W15_MNAME,2,draw);
    var tsS=U.slider(r1,"サンプリング周期 T<sub>s</sub>",{values:[0.5,1,2,5,10,15,20,30,40],value:10,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var oth=U.checkbox(r2,"ほかの近似の応答も細く重ねる",false,draw);
    var br=U.btnrow(el);
    function set(k,m,t){kd.set(k);mt.set(m);tsS.set(t);draw();}
    U.button(br,"本文の例（進み補償・双一次変換・10 ms）",function(){set(0,2,10);});
    U.button(br,"前進差分で 30 ms（倍率が負）",function(){set(0,0,30);});
    U.button(br,"前進差分で 40 ms（発散）",function(){set(0,0,40);});
    U.button(br,"プリワーピング（30 ms）",function(){set(0,3,30);});
    U.button(br,"PI・双一次変換・5 ms",function(){set(1,2,5);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var k=kd.get(),m=mt.get(),Ts=tsS.get()/1000,cf=_w15_coef(k,m,Ts),G=k===0?_W15_POS:_W15_SPD;
      var Cc=k===0?ctl.tf([0.624/17.3,0.624],[1/52,1]):ctl.tf([0.1,2],[1,0]),r=k===0?1:100,tEnd=k===0?0.5:0.15;
      var nar=_w15_nar(box),Wd=nar?400:700,o=[];
      /* (a) 制御器のボード線図（連続時間と計算式） */
      var wN=Math.PI/Ts,wr=k===0?[1,Math.min(1000,wN)]:[1,Math.min(3000,wN)],ws=ctl.logspace(0,Math.log10(wr[1]),400);
      var Bc=ctl.bode(Cc,ws),db=[],ph=[],prev=null;
      ws.forEach(function(w){var z=cx.polar(1,w*Ts),v=cx.div(cx.add(cx.c(cf.b0,0),cx.scale(cx.inv(z),cf.b1)),cx.sub(cx.c(1,0),cx.scale(cx.inv(z),cf.a))),p=cx.arg(v)*180/Math.PI;
        if(prev!==null){while(p-prev>180)p-=360;while(p-prev<-180)p+=360;}else if(k===1){while(p>0)p-=360;}prev=p;db.push(20*Math.log10(cx.abs(v)));ph.push(p);});
      var bx=nar?52:62,bw=nar?330:270;
      var dbr=k===0?[-6,8]:[-30,30],phr=k===0?[-30,60]:[-100,10];
      var bd=ctl.bodeSvg([{w:ws,db:Bc.db,ph:Bc.ph,c:"muted",dash:"5 3",lw:1.6},{w:ws,db:db,ph:ph,c:_W15_MCOL[m],lw:2.2}],{x:bx,y:30,w:bw,hm:100,hp:110,gap:26,wr:[wr[0],wr[1]],dbr:dbr,phr:phr});
      o.push(S.TX(bx-48,16,"(a) 制御器のボード線図（π/T_s まで）","start",10.5,"ink",true));o.push(bd.svg);
      var wg=k===0?30:100;if(wg<=wr[1]){o.push(S.L(bd.Pm.X(wg),bd.Pm.y,bd.Pm.X(wg),bd.Pp.y+bd.Pp.h,"faint",1,"3 3"));o.push(S.TX(bd.Pp.X(wg)+3,bd.Pp.y+10,"ω_gc","start",9,"muted",true,true));}
      /* (b) 閉ループの応答 */
      var rx=nar?52:420,ry=nar?bd.h+30:30,rw=nar?330:260;
      var M=Math.max(10,Math.ceil(Ts/(k===0?2e-4:2e-5)));
      var sims=[],ms=oth.get()?[0,1,2,3]:[m];
      ms.forEach(function(mm){var c=_w15_coef(k,mm,Ts),e1=0,u1=0;var R=_w15_simsd(U,G,function(e){var u=c.b0*e+c.b1*e1+c.a*u1;e1=e;u1=u;return u;},Ts,tEnd,M,0,r);R.m=mm;sims.push(R);});
      var Lp=ctl.loop(ctl.tf(G.num,G.den),Cc),SR=ctl.step(Lp.Gyr,tEnd,1500),SU=ctl.step(Lp.Gur,tEnd,1500);
      var yt=1.6*r,Pq=U.plot(rx,ry+12,rw,140,[0,tEnd],[0,yt]);
      o.push(S.T(rx-48,ry,"(b) 目標を "+(k===0?"1 rad":"100 rad/s")+" 変えたとき","start",10.5,"ink",true));
      o.push(Pq.axes({xl:null,yl:k===0?"角度 [rad]":"角速度 [rad/s]",xt:U.nice(0,tEnd,5),yt:U.nice(0,yt,4).filter(function(v){return v<=yt;}),xfmt:function(){return "";},yfmt:function(v){return _w15_g(v,3);},sz:9}));
      o.push(Pq.line([[0,r],[tEnd,r]],"muted",1,"5 3"));
      o.push(Pq.clip(SR.t.map(function(t,i){return [t,r*SR.y[i]];}),"muted",1.6,"5 3"));
      sims.forEach(function(R){var st=Math.max(1,Math.round(R.t.length/700)),pts=[];for(var i=0;i<R.t.length;i+=st)pts.push([R.t[i],R.y[i]]);o.push(Pq.clip(pts,_W15_MCOL[R.m],R.m===m?2.2:1.1));});
      var main=sims.filter(function(R){return R.m===m;})[0];
      /* (c) 操作量 */
      var ua=[],ub=Infinity,uc_=-Infinity;main.u.forEach(function(v){if(isFinite(v)){ub=Math.min(ub,v);uc_=Math.max(uc_,v);}});SU.y.forEach(function(v){ub=Math.min(ub,v*r);uc_=Math.max(uc_,v*r);});
      var span=Math.max(0.5,uc_-ub),Qq=U.plot(rx,ry+12+140+38,rw,90,[0,tEnd],[ub-0.08*span,uc_+0.08*span]);
      o.push(S.T(rx-48,ry+12+140+28,"(c) 操作量（電圧）","start",10.5,"ink",true));
      o.push(Qq.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:U.nice(0,tEnd,5),yt:U.nice(Qq.yr[0],Qq.yr[1],3).filter(function(v){return v>=Qq.yr[0]&&v<=Qq.yr[1];}),xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,2);},sz:9}));
      o.push(Qq.line([[0,0],[tEnd,0]],"muted",0.8));
      o.push(Qq.clip(SU.t.map(function(t,i){return [t,r*SU.y[i]];}),"muted",1.4,"5 3"));
      var st2=Math.max(1,Math.round(main.t.length/1200)),pu=[];for(var i5=0;i5<main.t.length;i5+=st2)pu.push([main.t[i5],main.u[i5]]);o.push(Qq.clip(pu,"gold",1.8));
      var lgY=Math.max(bd.h+6,ry+12+140+38+90+40);
      o.push(S.LEGL(nar?52:62,lgY,[["muted","5 3","連続時間"],[_W15_MCOL[m],null,_W15_MNAME[m]]],9.5,14));
      box.set(S.svg(Wd,lgY+12,o));
      /* 読み出し */
      var h="",ex=k===0?Math.exp(-52*Ts):1;
      h+="計算式: u[k] = "+_w15_f(cf.b0,4)+" e[k] "+(cf.b1<0?"− ":"+ ")+_w15_f(Math.abs(cf.b1),4)+" e[k−1] + "+_w15_f(cf.a,4)+" u[k−1]<br>";
      if(k===0){h+="制御器の倍率 a = <b>"+_w15_f(cf.a,4)+"</b>（正しい倍率 e<sup>−52.0T<sub>s</sub></sup> = "+_w15_f(ex,4)+"）: ";
        h+=Math.abs(cf.a)>1?'<span class="warn">大きさが 1 を超え、制御器が発散する</span>':(cf.a<0?'<span class="warn">負なので、操作量が 1 回ごとに符号を変えて揺れる</span>':'<span class="ok">0 と 1 の間で、発散しない</span>');h+="<br>";}
      else h+="積分の極 s = 0 は、どの近似でも倍率 a = 1（z = 1）に写る<br>";
      var zc=cx.polar(1,wg*Ts),Cd=cx.div(cx.add(cx.c(cf.b0,0),cx.scale(cx.inv(zc),cf.b1)),cx.sub(cx.c(1,0),cx.scale(cx.inv(zc),cf.a))),Cw=ctl.freq(Cc,wg);
      var dph=(cx.arg(Cd)-cx.arg(Cw))*180/Math.PI;while(dph>180)dph-=360;while(dph<-180)dph+=360;
      h+="交差 "+wg+" rad/s での制御器の位相のずれ: <b>"+(dph>=0?"+":"")+_w15_f(dph,1)+"°</b>、ゲインの比 "+_w15_f(cx.abs(Cd)/cx.abs(Cw),3)+"（零次ホールドの遅れは別に −"+_w15_f(wg*Ts/2*180/Math.PI,1)+"°）<br>";
      var dm=_w15_dmargin(U,G,Ts,function(z){return cx.div(cx.add(cx.c(cf.b0,0),cx.scale(cx.inv(z),cf.b1)),cx.sub(cx.c(1,0),cx.scale(cx.inv(z),cf.a)));},0);
      var m0=ctl.margins(ctl.series(ctl.tf(G.num,G.den),Cc),1e-2,1e5),mt2=_w15_met(main.t,main.y,r),mc=_w15_met(SR.t,SR.y.map(function(v){return v*r;}),r);
      if(main.blow||Math.abs(cf.a)>1)h+='<span class="warn">閉ループは発散する</span>';
      else h+="位相余裕（5 節の方法）: <b>"+(dm.pm!==null?_w15_f(dm.pm,1)+"°":"—")+"</b>（連続時間 "+_w15_f(m0.pm,1)+"°）、行き過ぎ量 <b>"+_w15_f(mt2.mp,1)+" %</b>（連続時間 "+_w15_f(mc.mp,1)+" %）";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 5 節: z 平面 ---- */
  REG.w15_zplane=function(el,U){
    var S=U.S,ctl=U.ctl,cx=ctl.cx;
    U.head(el,"S-PLANE ↔ Z-PLANE","s 平面の極を動かすと、z 平面の極と、取り出した点の列が変わる");
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"極の実部 σ",{min:-60,max:10,step:1,value:-10,fmt:function(v){return _w15_g(v,3)+" /s";},onInput:function(){draw();}});
    var om=U.slider(r1,"極の虚部 ω",{min:0,max:120,step:1,value:30,fmt:function(v){return _w15_g(v,3)+" rad/s";},onInput:function(){draw();}});
    var tsS=U.slider(r1,"サンプリング周期 T<sub>s</sub>",{values:[1,2,5,10,20,30,50,70,100,150],value:20,fmt:function(v){return v+" ms";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var cF=U.checkbox(r2,"前進差分の倍率",true,draw),cB=U.checkbox(r2,"後退差分の倍率",true,draw),cT=U.checkbox(r2,"双一次変換の倍率",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（−10 ± j30、20 ms）",function(){sg.set(-10);om.set(30);tsS.set(20);draw();});
    U.button(br,"T<sub>s</sub> を延ばす: 150 ms で折り返す",function(){sg.set(-10);om.set(30);tsS.set(150);draw();});
    U.button(br,"速い極で前進差分が発散（−60、50 ms）",function(){sg.set(-60);om.set(0);tsS.set(50);draw();});
    U.button(br,"虚軸の上（0 ± j30）",function(){sg.set(0);om.set(30);tsS.set(20);draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,dragOn=false;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){dragOn=false;return;}
      if(x==null||!PP)return;
      if(type==="down"){var d1=Math.hypot(x-PP.X(sg.get()),y-PP.Y(om.get())),d2=Math.hypot(x-PP.X(sg.get()),y-PP.Y(-om.get()));
        if(Math.min(d1,d2)>18)return false;dragOn=true;return;}
      if(!dragOn)return;
      var s1=Math.max(-60,Math.min(10,Math.round(PP.ux(x)))),w1=Math.max(0,Math.min(120,Math.round(Math.abs(PP.uy(y)))));
      sg.set(s1);om.set(w1);draw();});
    function draw(){
      var s0=sg.get(),w0=om.get(),Ts=tsS.get()/1000,lam=cx.c(s0,w0),lT=cx.scale(lam,Ts);
      var zE=cx.exp(lT),zF=cx.add(cx.c(1,0),lT),zB=cx.inv(cx.sub(cx.c(1,0),lT)),zT=cx.div(cx.add(cx.c(1,0),cx.scale(lT,0.5)),cx.sub(cx.c(1,0),cx.scale(lT,0.5)));
      var nar=_w15_nar(box),Wd=nar?400:700,o=[];
      /* (a) s 平面 */
      var P=U.plot(nar?52:56,26,nar?150:250,nar?170:210,[-70,15],[-130,130]);PP=P;
      o.push(S.T(nar?10:14,14,"(a) s 平面（ドラッグできる）","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.8));
      var wn=Math.PI/Ts;if(wn<130)o.push(S.RECT(P.x,P.Y(Math.min(130,wn)),P.w,P.Y(-Math.min(130,wn))-P.Y(Math.min(130,wn)),0,U.soft("muted"),"none",0));
      else o.push(S.RECT(P.x,P.y,P.w,P.h,0,U.soft("muted"),"none",0));
      o.push(ctl.splane(P,{}));
      o.push(P.axes({xt:[-60,-40,-20,0],yt:[-120,-60,0,60,120],xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,3);},sz:9}));
      if(wn<130){[wn,-wn].forEach(function(v){o.push(S.L(P.x,P.Y(v),P.x+P.w,P.Y(v),"alias",1.2,"4 3"));});o.push(S.TX(P.x+4,P.Y(wn)-4,"±π/T_s","start",9,"alias",true,true));}
      o.push(ctl.pz(P,[lam,cx.conj(lam)],[],"green",6));
      o.push(S.TX(P.x+P.w,P.y+P.h+28,"灰色の帯: 虚部が ±π/T_s の内側","end",9,"muted"));
      /* (b) z 平面 */
      var zx=nar?236:360,zr=1.6,Z=U.plot(zx,26,nar?150:210,nar?150:210,[-zr,zr],[-zr,zr]);
      o.push(S.T(zx-10,14,"(b) z 平面","start",10.5,"ink",true));
      o.push(S.RECT(Z.x,Z.y,Z.w,Z.h,0,"var(--screen)","line",0.8));
      o.push(Z.axes({xt:[-1,0,1],yt:[-1,0,1],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");},sz:9}));
      o.push(S.L(Z.x,Z.Y(0),Z.x+Z.w,Z.Y(0),"muted",1));o.push(S.L(Z.X(0),Z.y,Z.X(0),Z.y+Z.h,"muted",1));
      var cir=[];for(var i=0;i<=120;i++){var a=2*Math.PI*i/120;cir.push([Math.cos(a),Math.sin(a)]);}o.push(Z.line(cir,"ink",1.3,"4 3"));
      function zmark(z,c,r){var out=[];[z,cx.conj(z)].forEach(function(q){var xx=Math.max(-zr,Math.min(zr,q.re)),yy=Math.max(-zr,Math.min(zr,q.im));out.push(S.X(Z.X(xx),Z.Y(yy),r,c,2.2));});return out.join("");}
      if(cF.get())o.push(zmark(zF,"purple",4.5));
      if(cB.get())o.push(zmark(zB,"teal",4.5));
      if(cT.get())o.push(zmark(zT,"signal",4.5));
      o.push(zmark(zE,"green",6.5));
      /* (c) 時間の応答: e^{σt}cos(ωt) と、取り出した点、近似の列 */
      var cy=nar?26+170+60:26+210+60,cw=nar?330:600,cxp=nar?52:56,tEnd=Math.max(16*Ts,Math.min(1.5,6/Math.max(1,Math.abs(s0)+1)));
      var nK=Math.min(60,Math.floor(tEnd/Ts));tEnd=Math.max(nK,4)*Ts;
      var Q=U.plot(cxp,cy,cw,130,[0,tEnd],[-1.6,1.6]);
      o.push(S.TX(cxp-42,cy-12,"(c) 連続時間の応答 e^{σt} cos ωt と、T_s ごとに取り出した点（緑）・近似の列","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",xt:U.nice(0,tEnd,6),yt:[-1,0,1],xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return String(v).replace("-","−");},sz:9}));
      var cp=[];for(var j=0;j<=800;j++){var t=tEnd*j/800;cp.push([t,Math.exp(s0*t)*Math.cos(w0*t)]);}o.push(Q.clip(cp,"muted",1.4));
      /* 折り返した遅い揺れ */
      var wa=Math.abs(((w0*Ts+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)/Ts,ali=w0*Ts>Math.PI+1e-9;
      if(ali){var ap=[];for(var j2=0;j2<=800;j2++){var t2=tEnd*j2/800;ap.push([t2,Math.exp(s0*t2)*Math.cos(wa*t2)]);}o.push(Q.clip(ap,"alias",1.6,"6 4"));}
      function seq(q,c,r){var out=[],cur=cx.c(1,0);for(var k=0;k<=nK;k++){var v=cur.re;if(Math.abs(v)<=1.6)out.push(S.D(Q.X(k*Ts),Q.Y(v),c,r));cur=cx.mul(cur,q);}return out.join("");}
      if(cF.get())o.push(seq(zF,"purple",2.2));if(cB.get())o.push(seq(zB,"teal",2.2));if(cT.get())o.push(seq(zT,"signal",2.2));
      o.push(seq(zE,"green",3.4));
      box.set(S.svg(Wd,cy+130+40,o));
      /* 読み出し */
      function pol(z){return "|z| = "+_w15_f(cx.abs(z),3)+"、偏角 "+_w15_f(cx.arg(z)*180/Math.PI,1)+"°";}
      function st(z){return cx.abs(z)<1-1e-9?'<span class="ok">内側</span>':(cx.abs(z)>1+1e-9?'<span class="warn">外側（発散）</span>':"単位円の上");}
      var h="極 λ = "+_w15_g(s0,3)+" ± j"+_w15_g(w0,3)+" rad/s、λT<sub>s</sub> = "+_w15_g(s0*Ts,3)+" ± j"+_w15_g(w0*Ts,3)+"<br>";
      h+="正しい写り方 e<sup>λT<sub>s</sub></sup>: "+pol(zE)+"（"+st(zE)+"）<br>";
      h+="前進差分 1 + λT<sub>s</sub>: "+pol(zF)+"（"+st(zF)+"）、後退差分: "+pol(zB)+"（"+st(zB)+"）、双一次変換: "+pol(zT)+"（"+st(zT)+"）<br>";
      h+=ali?'<span class="warn">ωT<sub>s</sub> = '+_w15_g(w0*Ts,3)+' rad が π を超えたので、点の列は '+_w15_g(wa,3)+' rad/s の遅い揺れに見える（赤の破線。エイリアシング）</span>':"ωT<sub>s</sub> = "+_w15_g(w0*Ts,3)+" rad（π より小さいので、点の列は元の揺れの速さを表す）";
      ro.innerHTML=h;
    }
    draw();
  };
