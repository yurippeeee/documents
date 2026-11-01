  /* ===== 13 章 モータを回す ===== */
  /* 例のモータ（例の値）: k = 0.02 N·m/A（= V/(rad/s)）。ほかの値はデモで変えられる */
  var _w13_K=0.02;
  function _w13_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  /* PWM の 1 周期（速さ w は一定とみなす）の電流を閉じた式で求める。diode: OFF の間はダイオードで流す（電流は負にならない） */
  function _w13_cycle(V,R,L,k,D,f,w,diode){
    var tau=L/R,T=1/f,t1=D*T,t2=(1-D)*T,Ion=(V-k*w)/R,Ioff=-k*w/R,x1=Math.exp(-t1/tau),x2=Math.exp(-t2/tau);
    var Ia=(Ioff*(1-x2)+Ion*(1-x1)*x2)/(1-x1*x2),Ib,tz=null;
    if(diode&&Ia<0){Ia=0;Ib=Math.max(0,Ion*(1-x1));tz=Ioff>=0?t2:Math.min(t2,tau*Math.log((Ib-Ioff)/(-Ioff)));}
    else Ib=Ion+(Ia-Ion)*x1;
    var q=Ion*t1+(Ia-Ion)*tau*(1-x1);
    if(tz===null)q+=Ioff*t2+(Ib-Ioff)*tau*(1-x2);else q+=Ioff*tz+(Ib-Ioff)*tau*(1-Math.exp(-tz/tau));
    return {Ia:Ia,Ib:Ib,tz:tz,Iavg:q/T,t1:t1,t2:t2,tau:tau,Ion:Ion,Ioff:Ioff};}
  function _w13_cur(c,t){if(t<=c.t1)return c.Ion+(c.Ia-c.Ion)*Math.exp(-t/c.tau);var u=t-c.t1;return (c.tz!==null&&u>=c.tz)?0:c.Ioff+(c.Ib-c.Ioff)*Math.exp(-u/c.tau);}
  /* 落ち着いた角速度: k × 平均の電流 = 負荷のトルク を二分法で解く */
  function _w13_ss(V,R,L,k,TL,D,f,diode){
    var c0=_w13_cycle(V,R,L,k,D,f,0,diode);if(k*c0.Iavg<=TL)return {w:0,c:c0,stall:true};
    var lo=0,hi=V/k;for(var i=0;i<60;i++){var m=(lo+hi)/2;if(k*_w13_cycle(V,R,L,k,D,f,m,diode).Iavg>TL)lo=m;else hi=m;}
    var w=(lo+hi)/2;return {w:w,c:_w13_cycle(V,R,L,k,D,f,w,diode),stall:false};}

  /* ---- 2 節: DC モータの PWM ---- */
  REG.w13_pwm=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"PWM","DC モータの PWM — 電流の波・リップル・速さ・損失");
    var r1=U.ctrls(el);
    var vv=U.slider(r1,"電源の電圧 V",{values:[3,5,6,9,12,18,24],value:12,fmt:function(v){return v+" V";},onInput:draw});
    var ff=U.slider(r1,"PWM の周波数 f",{min:100,max:100000,log:true,value:20000,fmt:function(v){return v>=1000?_w13_sig(v/1000,3)+" kHz":Math.round(v)+" Hz";},onInput:draw});
    var dd=U.slider(r1,"デューティ比 D",{min:0.05,max:1,step:0.01,value:0.5,fmt:function(v){return v.toFixed(2);},onInput:draw});
    var r2=U.ctrls(el);
    var rr=U.slider(r2,"巻線の抵抗 R",{values:[0.5,1,2,3,5,10],value:2,fmt:function(v){return v+" Ω";},onInput:draw});
    var ll=U.slider(r2,"インダクタンス L",{min:0.1,max:10,log:true,value:1,fmt:function(v){return _w13_sig(v,3)+" mH";},onInput:draw});
    var tl=U.slider(r2,"負荷のトルク T_L",{min:0,max:0.03,step:0.001,value:0.01,fmt:function(v){return v.toFixed(3)+" N·m";},onInput:draw});
    var r3=U.ctrls(el);
    var path=U.select(r3,"OFF の間の電流の道",["フライバックダイオード（電流は 0 で止まる）","H ブリッジの下の 2 つ（逆向きにも流れる）"],0,draw);
    var br=U.btnrow(el);
    function preset(f,D,p){vv.set(12);ff.set(f);dd.set(D);rr.set(2);ll.set(1);tl.set(0.01);path.set(p);draw();}
    U.button(br,"例の値（20 kHz）",function(){preset(20000,0.5,0);});
    U.button(br,"2 kHz に下げる",function(){preset(2000,0.5,0);});
    U.button(br,"2 kHz・下の 2 つで流す",function(){preset(2000,0.5,1);});
    U.button(br,"25 kHz・デューティ比 0.3",function(){preset(25000,0.3,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var V=vv.get(),f=ff.get(),D=dd.get(),R=rr.get(),L=ll.get()*1e-3,TL=tl.get(),diode=path.get()===0,k=_w13_K;
      var s=_w13_ss(V,R,L,k,TL,D,f,diode),c=s.c,T=1/f,n=4;
      var us=4*T<2e-3,sc=us?1e6:1e3,un=us?"µs":"ms";
      /* 波形の点と、2 乗の平均 */
      var pts=[],imax=-1e9,imin=1e9,sq=0,M=160;
      for(var p=0;p<n;p++)for(var i=0;i<=M;i++){var t=i/M*T,I=_w13_cur(c,t);pts.push([(p*T+t)*sc,I]);if(p===0&&i<M){sq+=I*I/M;}imax=Math.max(imax,I);imin=Math.min(imin,I);}
      var ripple=imax-imin,approx=V*D*(1-D)/(L*f),Iavg=c.Iavg;
      var span=Math.max(imax-imin,0.08*Math.abs(imax),0.02),y0=imin-0.3*span,y1=imax+0.3*span;
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[],pl=U.plot(nar?62:80,44,nar?320:580,180,[0,n*T*sc],[y0,y1]);
      o.push(pl.axes({xl:"時間 ["+un+"]",yl:"電流 [A]",ylOff:nar?46:52,nx:nar?4:6}));
      for(var q=0;q<n;q++)o.push(S.RECT(pl.X(q*T*sc),16,pl.X(D*T*sc)-pl.X(0),12,1,U.soft("gold"),"gold",0.8));
      o.push(S.T(pl.x-6,26,"ON","end",9,"gold",true));
      if(y0<0&&y1>0)o.push(S.L(pl.x,pl.Y(0),pl.x+pl.w,pl.Y(0),"faint",1.2));
      o.push(S.L(pl.x,pl.Y(Iavg),pl.x+pl.w,pl.Y(Iavg),"muted",1,"4 3"));
      o.push(pl.line(pts,"signal",2));
      o.push(S.T(pl.x+4,pl.y+12,"破線: 平均 "+_w13_sig(Iavg,3)+" A","start",9.5,"muted",false,false,null,true));
      box.set(S.svg(W,262,o));
      var w=s.w,ideal=(D*V-R*Iavg)/k,rpm=w*60/(2*Math.PI);
      var Pr=R*sq,Prip=R*ripple*ripple/12,Psw=0.5*V*Math.max(Iavg,0)*1e-6*f;
      var tauE=L/R;
      var note="";
      if(s.stall)note='<span class="warn">負荷のトルクに勝てず、回らない（k × 電流 '+_w13_sig(k*c.Iavg,3)+' N·m ≤ T_L）。拘束電流 D V / R が流れ続ける。</span><br>';
      else if(c.tz!==null)note='<span class="warn">電流が OFF の途中で 0 になる（不連続）。平均の電圧が D V より高くなり、速さはデューティ比どおりにならない。</span><br>';
      ro.innerHTML=note+
        "リップル ΔI = <b>"+_w13_sig(ripple,3)+" A</b>（式 V D (1 − D) / (L f) = "+_w13_sig(approx,3)+" A）。周期 1/f = "+F.time(T)+"、電流の時定数 L/R = "+F.time(tauE)+(T<0.2*tauE?"（周期が十分短いので、式が合う）":'（周期が L/R に近いか長いので、<span class="warn">式は合わない</span>）')+"<br>"+
        "平均の電流 <b>"+_w13_sig(Iavg,3)+" A</b>、角速度 <b>"+_w13_sig(w,3)+" rad/s</b>（"+Math.round(rpm)+" rpm）。デューティ比から求めた (D V − R I) / k = "+_w13_sig(Math.max(0,ideal),3)+" rad/s<br>"+
        "損失: 巻線の熱 R ×（電流の 2 乗の平均）= "+_w13_sig(Pr,3)+" W（うちリップルの分 R ΔI²/12 ≈ "+_w13_sig(Prip,3)+" W）、スイッチ ½ V I (t_r + t_f) f ≈ "+_w13_sig(Psw,3)+" W（t_r + t_f = 1 µs として）<br>"+
        (f<20000?'<span class="warn">'+_w13_sig(f/1000,3)+' kHz は人の耳に聞こえる周波数（20 kHz 程度まで）。巻線が鳴ることがある。</span>':'<span class="ok">20 kHz 以上: 耳には聞こえにくい。</span>')+
        '<div class="wnote">トルク定数 k は 0.02 N·m/A に固めた。速さは 1 周期の中では変わらないとして、周期ごとの電流を閉じた式で求め、平均の電流 × k が負荷のトルクに等しくなる速さを探した。ダイオードの順電圧は無視した。値は例の値。</div>';
    }
    draw();
  };

  /* ---- 3 節: 止め方と電源の線の電圧 ---- */
  REG.w13_stop=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"STOP","止め方と電源の線の電圧 — 惰性・短絡ブレーキ・回生");
    var r1=U.ctrls(el);
    var how=U.select(r1,"止め方",["惰性停止（4 つとも切る）","短絡ブレーキ（下の 2 つを入れる）","回生しながら減速（デューティ比を下げる）","回生しながら減速し、電圧を見張って短絡ブレーキへ"],2,draw);
    var sink=U.select(r1,"電源",["電流を吸い込めない（AC アダプタ・ダイオードの後ろ）","電流を吸い込める（充電できる電池）"],0,draw);
    var r2=U.ctrls(el);
    var td=U.slider(r2,"減速の時間",{values:[0.05,0.1,0.2,0.3,0.4,0.5,0.6,0.8,1.0],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var cc=U.slider(r2,"電源の線の容量 C",{values:[100,220,470,1000,2200,4700],value:470,fmt:function(v){return v+" µF";},onInput:draw});
    var io=U.slider(r2,"ほかの回路の電流",{values:[0,0.05,0.1,0.2,0.5],value:0.1,fmt:function(v){return v+" A";},onInput:draw});
    var r3=U.ctrls(el);
    var jj=U.slider(r3,"慣性モーメント J",{values:[2e-6,5e-6,1e-5,2e-5,5e-5],value:1e-5,fmt:function(v){return _w13_sig(v*1e5,2)+" × 10⁻⁵ kg·m²";},onInput:draw});
    var vl=U.slider(r3,"見張る電圧（最後の止め方）",{values:[13,14,15,16,18,20],value:15,fmt:function(v){return v+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(h,t){how.set(h);td.set(t);cc.set(470);io.set(0.1);sink.set(0);jj.set(1e-5);vl.set(15);draw();}
    U.button(br,"3 節の例（回生・0.1 s）",function(){preset(2,0.1);});
    U.button(br,"惰性停止",function(){preset(0,0.1);});
    U.button(br,"短絡ブレーキ",function(){preset(1,0.1);});
    U.button(br,"惰性停止の時間より長く減速（0.6 s）",function(){preset(2,0.6);});
    U.button(br,"見張って 15 V で短絡ブレーキへ",function(){preset(3,0.1);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function sim(m,tdec,C,Io,snk,J,vlim){
      var R=2,L=1e-3,k=_w13_K,TL=0.01,V0=12,w=(V0-R*TL/k)/k,I=TL/k,Vb=V0,mode=m,t=0,dt=1e-5,tend=Math.max(0.6,Math.min(3,J*w/TL+0.15));
      if(m>=2)tend=Math.max(tend,tdec+0.2);
      var out=[],tstop=null,vmax=Vb,imin=0,ER=0,El=0,Er=0,N=Math.round(tend/dt),ev=Math.max(1,Math.floor(N/500)),Ek=0.5*J*w*w;
      for(var i=0;i<=N;i++){
        if(i%ev===0)out.push([t,w,I,Vb]);
        var vm;
        if(mode===0)vm=I>1e-12?-Vb:null;
        else if(mode===1)vm=0;
        else{vm=Math.max(0,1-t/tdec)*Vb;if(mode===3&&Vb>vlim){mode=1;vm=0;}}
        var ib=0;
        if(vm===null)I=0;
        else{I+=(vm-R*I-k*w)/L*dt;if(mode===0&&I<0)I=0;ib=vm*I/Vb;}
        var tm=k*I,tl=w>1e-9?TL:Math.min(TL,Math.max(-TL,tm));
        w+=(tm-tl)/J*dt;if(w<0)w=0;
        if(snk)Vb=V0;else Vb+=(Math.max(0,(V0-Vb)/0.05)-Io-ib)/C*dt;
        ER+=R*I*I*dt;El+=tl*w*dt;if(vm!==null&&vm*I<0)Er+=-vm*I*dt;
        if(Vb>vmax)vmax=Vb;if(I<imin)imin=I;if(tstop===null&&w<=0)tstop=t;t+=dt;}
      return {out:out,tstop:tstop,vmax:vmax,imin:imin,ER:ER,El:El,Er:Er,Ek:Ek,tend:tend,w0:(V0-R*TL/k)/k};}
    function draw(){
      var m=how.get(),tdec=td.get(),C=cc.get()*1e-6,Io=io.get(),snk=sink.get()===1,J=jj.get(),vlim=vl.get();
      td.el.style.opacity=m>=2?"1":"0.45";vl.el.style.opacity=m===3?"1":"0.45";
      var r=sim(m,tdec,C,Io,snk,J,vlim),tm=r.tend*1e3,o=[],nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,pw=nar?300:560;
      var vtop=Math.max(14,Math.ceil(r.vmax/5)*5+2);
      var pa=U.plot(84,30,pw,80,[0,tm],[0,600]),pb=U.plot(84,146,pw,80,[0,tm],[-6,1]),pc=U.plot(84,262,pw,80,[0,tm],[10,vtop]);
      function frame(p,title,yl,yt){o.push(S.T(p.x,p.y-8,title,"start",10.5,"ink",true));
        yt.forEach(function(v){o.push(S.L(p.x,p.Y(v),p.x+p.w,p.Y(v),"grid",1));o.push(S.T(p.x-6,p.Y(v)+3.5,String(v),"end",9.5,"muted"));});
        o.push(S.W([p.x,p.y,p.x,p.y+p.h,p.x+p.w,p.y+p.h],"muted",1.2));o.push(S.T(p.x-44,p.y+p.h/2,yl,"middle",9.5,"muted",false,false,-90));}
      frame(pa,"角速度","[rad/s]",[0,200,400,600]);frame(pb,"モータの電流（負は逆向き）","[A]",[-6,-4,-2,0]);
      var vt=[];for(var v=10;v<=vtop;v+=vtop>25?10:5)vt.push(v);frame(pc,"電源の線の電圧","[V]",vt);
      var xt=U.nice(0,tm,nar?4:6);xt.forEach(function(x){if(x<=tm+1e-9){o.push(S.T(pc.X(x),pc.y+pc.h+15,String(x),"middle",9.5,"muted"));}});
      o.push(S.T(pc.x+pc.w/2,pc.y+pc.h+31,"止め始めてからの時間 [ms]","middle",10,"muted"));
      var col=["signal","purple","alias","alias"][m];
      o.push(pa.line(r.out.map(function(q){return [q[0]*1e3,q[1]];}),col,2));
      o.push(pb.line(r.out.map(function(q){return [q[0]*1e3,Math.max(-6,q[2])];}),col,2));
      o.push(pc.line(r.out.map(function(q){return [q[0]*1e3,Math.min(vtop,q[3])];}),col,2));
      var tc=J*r.w0/0.01;
      if(m>=2&&tdec*1e3<=tm)o.push(S.L(pa.X(tdec*1e3),pa.y,pa.X(tdec*1e3),pa.y+pa.h,"faint",1,"3 3"));
      if(tc*1e3<=tm){o.push(S.L(pa.X(tc*1e3),pa.y,pa.X(tc*1e3),pa.y+pa.h,"green",1.2,"4 3"));o.push(S.T(pa.X(tc*1e3)+4,pa.y+12,"惰性停止の時間","start",9,"green",false,false,null,true));}
      if(m===3)o.push(S.L(pc.x,pc.Y(vlim),pc.x+pc.w,pc.Y(vlim),"alias",1,"4 3"));
      box.set(S.svg(W,384,o));
      var rest=r.Ek-r.ER-r.El;
      ro.innerHTML="止まるまで <b>"+(r.tstop!==null?F.time(r.tstop):"表示の範囲では止まらない")+"</b>、逆向きの電流の最大 <b>"+_w13_sig(-r.imin,3)+" A</b>、電源の線の電圧の最大 <b>"+_w13_sig(r.vmax,3)+" V</b>"+
        (r.vmax>16?'（<span class="warn">12 V 用の部品の耐える電圧を超えうる</span>）':"")+"<br>"+
        "惰性停止の時間 J ω₀ / T_L = "+F.time(tc)+(m>=2?(tdec>=tc?'。減速の時間がこれ以上なので、<span class="ok">電流は逆向きにならず、回生は起きない</span>':'。減速の時間がこれより短いので、<span class="warn">回生が起きる</span>'):"")+"<br>"+
        U.tbl(["エネルギー","値"],[["はじめの運動のエネルギー ½ J ω²",_w13_sig(r.Ek,3)+" J"],["巻線の抵抗の熱",_w13_sig(r.ER,3)+" J"],["負荷の摩擦の熱",_w13_sig(r.El,3)+" J"],["電源の側へ戻った分",_w13_sig(r.Er,3)+" J"]],["left","right"])+
        '<div class="wnote">例のモータ（R = 2 Ω、L = 1 mH、k = 0.02、負荷のトルク 0.01 N·m）が 12 V で回っているところから止める。H ブリッジは平均の電圧で表した。減速の初めはまだモータを回す向きに電流が流れるので、熱と戻った分の和は、はじめの運動のエネルギーより大きくなることがある。値は例の値。</div>';
    }
    draw();
  };

  /* ---- 5 節: ステッピングモータの加減速と脱調 ---- */
  REG.w13_step=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"STEPPER","ステッピングモータの加減速と脱調");
    var r1=U.ctrls(el);
    var vm=U.slider(r1,"最高の速さ",{values:[1000,1500,2000,2500,3000,3500,4000,5000],value:3000,fmt:function(v){return v+" 段/s";},onInput:draw});
    var ac=U.slider(r1,"加速度 a",{values:[2000,5000,10000,15000,20000,30000,40000,60000],value:10000,fmt:function(v){return v.toLocaleString("en-US")+" 段/s²";},onInput:draw});
    var r2=U.ctrls(el);
    var tl=U.slider(r2,"負荷のトルク T_L",{values:[0,0.02,0.05,0.08,0.1],value:0.05,fmt:function(v){return v+" N·m";},onInput:draw});
    var jj=U.slider(r2,"慣性モーメント J",{values:[0.5e-4,1e-4,2e-4,4e-4],value:1e-4,fmt:function(v){return _w13_sig(v*1e4,2)+" × 10⁻⁴ kg·m²";},onInput:draw});
    var th=U.slider(r2,"保持トルク（電流で決まる）",{values:[0.2,0.3,0.4,0.5],value:0.4,fmt:function(v){return v+" N·m";},onInput:draw});
    var r3=U.ctrls(el);
    var ns=U.slider(r3,"動かす段の数",{values:[1000,2000,4000,8000],value:4000,fmt:function(v){return v+" 段";},onInput:draw});
    var br=U.btnrow(el);
    function preset(v,a,h){vm.set(v);ac.set(a);tl.set(0.05);jj.set(1e-4);th.set(h);ns.set(4000);draw();}
    U.button(br,"5 節の例（10,000 段/s²）",function(){preset(3000,10000,0.4);});
    U.button(br,"加速を急に（30,000 段/s²）",function(){preset(3000,30000,0.4);});
    U.button(br,"最高の速さを上げる（5,000 段/s）",function(){preset(5000,10000,0.4);});
    U.button(br,"電流を下げる（保持トルク 0.2 N·m）",function(){preset(3000,10000,0.2);});
    var box=U.svgbox(el); var ro=U.readout(el);
    var TH=Math.PI/100,NR=50;
    function tp(v,h){return h/Math.sqrt(1+Math.pow(v/800,2));}
    function sim(vmax,a,TL,J,h,N){
      var wn=Math.sqrt(NR*h/J),b=2*0.03*J*wn,dt=2e-5,p=0,v=0,th_=0,om=0,t=0,tdone=null,slip=false,maxlag=0,out=[],k=0;
      for(;;){
        var rem=N-p;
        if(rem<=0){v=0;p=N;}else{if(v*v/(2*a)>=rem)v=Math.max(0,v-a*dt);else if(v<vmax)v=Math.min(vmax,v+a*dt);p=Math.min(N,p+v*dt);}
        if(p>=N&&v===0&&tdone===null)tdone=t;
        var lag=NR*(p*TH-th_),T=tp(v,h)*Math.sin(lag)-b*(om-v*TH);
        var fr=Math.abs(om)>1e-6?TL*(om>0?1:-1):Math.max(-TL,Math.min(TL,T));
        om+=(T-fr)/J*dt;th_+=om*dt;t+=dt;
        if(Math.abs(lag)>maxlag)maxlag=Math.abs(lag);if(Math.abs(lag)>Math.PI)slip=true;
        if(k%100===0)out.push([t,v,om/TH,p-th_/TH]);k++;
        if((tdone!==null&&t>tdone+0.3)||t>12)break;}
      return {out:out,slip:slip,err:N-th_/TH,tdone:tdone,maxlag:maxlag};}
    function draw(){
      var vmax=vm.get(),a=ac.get(),TL=tl.get(),J=jj.get(),h=th.get(),N=ns.get();
      var r=sim(vmax,a,TL,J,h,N),tend=r.out[r.out.length-1][0],o=[],nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700;
      var need=J*a*TH+TL,have=tp(vmax,h),amax=(have-TL)/(J*TH);
      /* 左: 速さと位置の差 */
      var emax=0;r.out.forEach(function(q){emax=Math.max(emax,Math.abs(q[3]));});emax=Math.max(8,emax*1.1);
      var pa=U.plot(70,34,nar?300:330,140,[0,tend],[0,Math.max(vmax*1.15,500)]),pb=U.plot(70,226,nar?300:330,90,[0,tend],[-emax*0.15,emax]);
      o.push(S.T(pa.x,20,"(a) 指令の速さと回転子の速さ","start",10.5,"ink",true));
      o.push(pa.axes({yl:"[段/s]",ylOff:52,xt:U.nice(0,tend,5).filter(function(x){return x<=tend;}),xfmt:function(x){return _w13_sig(x,3);}}));
      o.push(pa.line(r.out.map(function(q){return [q[0],Math.max(-vmax*0.1,q[2])];}),r.slip?"alias":"signal",1.6));
      o.push(pa.line(r.out.map(function(q){return [q[0],q[1]];}),"gold",1.6,"5 3"));
      o.push(S.T(pa.x+pa.w-4,pa.y+12,"破線: 指令","end",9.5,"gold",true,false,null,true));
      o.push(S.T(pa.x+pa.w-4,pa.y+26,"実線: 回転子","end",9.5,r.slip?"alias":"signal",true,false,null,true));
      o.push(S.T(pb.x,pb.y-10,"(b) 指令と回転子の位置の差","start",10.5,"ink",true));
      o.push(pb.axes({xl:"時間 [s]",yl:"[段]",ylOff:52,xt:U.nice(0,tend,5).filter(function(x){return x<=tend;}),yt:U.nice(0,emax,3),xfmt:function(x){return _w13_sig(x,3);}}));
      o.push(S.L(pb.x,pb.Y(4),pb.x+pb.w,pb.Y(4),"alias",1,"3 3"));
      o.push(pb.line(r.out.map(function(q){return [q[0],q[3]];}),r.slip?"alias":"signal",1.6));
      o.push(S.T(pb.x+pb.w-4,pb.Y(4)-5,"4 段（脱調の目安）","end",9,"alias",false,false,null,true));
      /* 右: 速さとトルク */
      var pc=nar?U.plot(70,390,300,170,[0,5000],[0,Math.max(0.55,need*1.1)]):U.plot(470,34,210,240,[0,5000],[0,Math.max(0.55,need*1.1)]);
      o.push(S.T(nar?70:440,pc.y-14,"(c) 要るトルクと出せるトルク","start",10.5,"ink",true));
      o.push(pc.axes({xl:"速さ [段/s]",yl:"[N·m]",ylOff:44,xt:[0,2500,5000],xfmt:function(x){return String(x);},yfmt:function(x){return _w13_sig(x,2);}}));
      var cv=[];for(var vv=0;vv<=5000;vv+=50)cv.push([vv,tp(vv,h)]);
      o.push(pc.line(cv,"green",2));
      o.push(pc.line([[0,TL],[5000,TL]],"muted",1,"4 3"));
      var bad=need>have;
      o.push(pc.line([[0,need],[vmax,need]],bad?"alias":"signal",2));
      o.push(S.L(pc.X(vmax),pc.y,pc.X(vmax),pc.y+pc.h,"faint",1,"3 3"));
      if(bad&&need<h){var vx=800*Math.sqrt(Math.pow(h/need,2)-1);o.push(S.D(pc.X(vx),pc.Y(need),"alias",4));}
      o.push(S.T(pc.X(5000)-4,pc.Y(tp(5000,h))-8,"出せる","end",9.5,"green",true,false,null,true));
      o.push(S.T(pc.X(60),pc.Y(need)-6,"加速の間に要る","start",9.5,bad?"alias":"signal",true,false,null,true));
      box.set(S.svg(W,nar?610:360,o));
      var dist=vmax*vmax/(2*a);
      ro.innerHTML=(r.slip?'<span class="warn">脱調した</span>。回転子は指令に '+_w13_sig(r.err,3)+' 段遅れたまま止まった（マイコンは気づかない）。':(need>have?'脱調しなかったが、<span class="warn">要るトルクが出せるトルクを超えていて、余裕が無い</span>（この模型では遅れが戻った）。':'<span class="ok">脱調しない</span>。')+'最後の位置の差 '+_w13_sig(r.err,2)+' 段。')+"<br>"+
        "加速の間に要るトルク J a θ_s + T_L = <b>"+_w13_sig(need,3)+" N·m</b>、最高の速さで出せるトルク T_p = <b>"+_w13_sig(have,3)+" N·m</b> → 加速度の上限 (T_p − T_L) / (J θ_s) = <b>"+(amax>0?Math.round(amax).toLocaleString("en-US")+" 段/s²":"0（負荷にも勝てない）")+"</b><br>"+
        "減速を始める位置: 残り v² / (2a) = "+Math.round(dist).toLocaleString("en-US")+" 段（"+F.time(vmax/a)+"）"+(2*dist>N?"。段の数が少なく、最高の速さに届く前に減速する":"")+(r.tdone?"。指令を出し終えるまで "+F.time(r.tdone):"")+
        '<div class="wnote">出せるトルクは T_p(v) = 保持トルク ÷ √(1 + (v/800)²) の代表的な形の例。回転子は、指令の角度との差に応じたトルク（差が 1 段で最大）で引かれる簡単な模型で、振動を少し抑える減衰を加えた。ステップ角 1.8°。値は例の値。</div>';
    }
    draw();
  };
