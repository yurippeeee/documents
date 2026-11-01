  /* ===== 14 章 熱を扱う ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w14_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w14_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w14_f(v,d){v=+v;if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w14_days(n){return n>=365?_w14_sig(n/365,2)+" 年":_w14_sig(n,3)+" 日";}

  /* PID（本文 3 節の離散の式。微分は読みに掛け、aw なら条件付きの積分と積分の項の上限） */
  function _w14_pid(Kp,Ti,Td,aw,dt,Tset){
    var I=0,y1=null;
    return {
      step:function(y,ok){
        if(!ok){y1=null;return 0;}
        var e=Tset-y,P=Kp*e,D=(Td&&y1!==null)?-Kp*Td*(y-y1)/dt:0;y1=y;
        var dI=Ti?Kp*dt/Ti*e:0,u0=P+I+D;
        if(aw){if(!((u0>=1&&dI>0)||(u0<=0&&dI<0)))I+=dI;I=Math.min(Math.max(I,0),1);}else I+=dI;
        return Math.min(Math.max(P+I+D,0),1);},
      setI:function(v){I=v;},
      I:function(){return I;}};
  }
  /* オンオフ（本文 2 節の onoff_step と同じ。1 s ごと） */
  function _w14_onoff(Tset,h,minOff){
    var on=false,off=0;
    return {step:function(y,ok){
      if(!on&&off<65535)off++;
      if(!ok||(on&&y>=Tset+h))on=false;
      else if(!on&&y<=Tset-h&&off>=minOff){on=true;off=0;}
      return on?1:0;}};
  }
  /* 見張り（本文 5 節の guard_step と同じ。温度は °C、出力は 0〜1） */
  function _w14_guard(g,sf,t,u){
    if(!g.fault&&sf)g.fault="センサの故障（範囲の外が 3 回続いた）";
    else if(!g.fault&&t>=75)g.fault="上限の温度（75 °C）";
    if(g.fault)return 0;
    if(u<0.9){g.hi=0;return u;}
    if(g.hi%60===0)g.t0=t;
    g.hi++;
    if(g.hi%60===0&&t-g.t0<2)g.fault="入れているのに上がらない";
    else if(g.hi>=600)g.fault="高い出力が長すぎる";
    return g.fault?0:u;
  }
  /* 時間の軸に沿った帯（0〜1 の出力）を描く */
  function _w14_strip(S,U,x,y,w,h,t1,pts,c,label){
    var o=[S.RECT(x,y,w,h,2,"var(--screen)","line",0.8)],q=[[x,y+h]];
    pts.forEach(function(p){q.push([x+p[0]/t1*w,y+h-p[1]*h]);});
    q.push([x+w,y+h]);o.push(S.PL(q,c,0.8,c,null,0.3));
    if(label)o.push(S.T(x-6,y+h-2,label,"end",9.5,c));
    return o.join("");
  }

  /* ---- 3 節: 保温プレートの温度の制御 ---- */
  REG.w14_ctrl=function(el,U){
    var S=U.S;
    U.head(el,"HEATER","保温プレートの温度の制御（オンオフ・P・PI・PID）");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"制御の方法",["オンオフ","P（比例だけ）","PI","PID"],3,draw);
    var ta=U.slider(r1,"周囲温度",{min:0,max:40,step:1,value:25,fmt:function(v){return v+" °C";},onInput:draw});
    var ts=U.slider(r1,"目標",{min:40,max:90,step:1,value:60,fmt:function(v){return v+" °C";},onInput:draw});
    var r2=U.ctrls(el);
    var rth=U.slider(r2,"熱抵抗",{values:[0.5,0.75,1,1.25,1.5,2,2.5,3],value:1.25,fmt:function(v){return v+" K/W";},onInput:draw});
    var cth=U.slider(r2,"熱容量",{values:[100,200,300,400,600,800,1200,1600],value:400,fmt:function(v){return v+" J/K";},onInput:draw});
    var pm=U.slider(r2,"ヒータの電力",{values:[20,40,60,80,100,150,200],value:80,fmt:function(v){return v+" W";},onInput:draw});
    var ld=U.slider(r2,"むだ時間 L",{values:[0,5,10,20,30,40,60],value:20,fmt:function(v){return v+" s";},onInput:draw});
    var rO=U.ctrls(el);
    var hy=U.slider(rO,"ヒステリシス h",{values:[0,0.25,0.5,1,2,3],value:0.5,fmt:function(v){return "± "+v+" K";},onInput:draw});
    var mo=U.slider(rO,"切ってから入れるまでの最短",{values:[0,30,60,120,180,300],value:0,fmt:function(v){return v+" s";},onInput:draw});
    var rP=U.ctrls(el);
    var kp=U.slider(rP,"Kp",{values:[0.02,0.05,0.1,0.15,0.2,0.3,0.4,0.5,0.8,1],value:0.3,fmt:function(v){return v+" /K";},onInput:draw});
    var ti=U.slider(rP,"Ti",{values:[10,20,40,60,80,120,200,400,1000],value:40,fmt:function(v){return v+" s";},onInput:draw});
    var td=U.slider(rP,"Td",{values:[0,2,5,10,15,20,30],value:10,fmt:function(v){return v+" s";},onInput:draw});
    var r4=U.ctrls(el);
    var aw=U.checkbox(r4,"積分の飽和の対策",true,draw);
    var wind=U.checkbox(r4,"1200 s に風が当たる（熱抵抗 × 0.64）",true,draw);
    var br=U.btnrow(el);
    function base(){ta.set(25);ts.set(60);rth.set(1.25);cth.set(400);pm.set(80);ld.set(20);hy.set(0.5);mo.set(0);aw.set(true);wind.set(true);}
    function pid(m,k,i,d){mode.set(m);kp.set(k);ti.set(i);td.set(d);}
    U.button(br,"2 節の例（オンオフ）",function(){base();mode.set(0);draw();});
    U.button(br,"P（0.3 /K）",function(){base();pid(1,0.3,40,10);draw();});
    U.button(br,"PI（0.3 /K・40 s）",function(){base();pid(2,0.3,40,10);draw();});
    U.button(br,"PID（ジーグラとニコルス）",function(){base();pid(3,0.3,40,10);draw();});
    U.button(br,"積分の飽和の対策なし",function(){base();pid(3,0.3,40,10);aw.set(false);draw();});
    U.button(br,"むだ時間を見誤る（実は 40 s）",function(){base();pid(3,0.3,40,10);ld.set(40);draw();});
    U.button(br,"穏やかな PID で L 40 s（0.15 /K・80 s・10 s）",function(){base();pid(3,0.15,80,10);ld.set(40);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var M=mode.get();
      rO.style.display=M===0?"":"none";rP.style.display=M>0?"":"none";
      ti.el.style.display=M>=2?"":"none";td.el.style.display=M===3?"":"none";aw.el.style.display=M>=2?"":"none";
      var Ta=ta.get(),Tset=ts.get(),R=rth.get(),C=cth.get(),P=pm.get(),L=ld.get(),W2=wind.get();
      var ctl=M===0?_w14_onoff(Tset,hy.get(),mo.get()):_w14_pid(kp.get(),M>=2?ti.get():0,M===3?td.get():0,aw.get(),1,Tset);
      /* 0.1 s 刻みで板を進め、1 s ごとに読んで出力を決める */
      var dt=0.1,tend=2400,n=Math.round(tend/dt),nd=Math.round(L/dt),hist=new Float64Array(n+1),T=Ta,u=0,out=[],ons=[],prevOn=0;
      for(var k=0;k<=n;k++){
        var t=k*dt;hist[k]=T;
        var rd=k>=nd?hist[k-nd]:Ta;
        if(k%10===0){u=ctl.step(rd,true);if(u>0.5&&prevOn<0.5)ons.push(t);prevOn=u;}
        if(k%20===0)out.push([t,T,rd,u]);
        var Rt=(W2&&t>=1200)?R*0.64:R,Tinf=Ta+P*u*Rt;
        T=Tinf+(T-Tinf)*Math.exp(-dt/(Rt*C));
      }
      /* 指標 */
      function seg(a,b){var v=out.filter(function(p){return p[0]>=a&&p[0]<b;}).map(function(p){return p[1];});var mn=Math.min.apply(null,v),mx=Math.max.apply(null,v),av=v.reduce(function(s,x){return s+x;},0)/v.length;return {mn:mn,mx:mx,av:av};}
      var A=seg(0,1200),B=seg(1000,1200),D2=seg(2200,2400),Dd=seg(1200,2400);
      var settle=-1;out.forEach(function(p){if(p[0]<1200&&Math.abs(p[1]-Tset)>0.5)settle=p[0];});
      var nar=_w14_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,o=[];
      var all=out.map(function(p){return p[1];}),hi=Math.max(Math.max.apply(null,all),Tset)+3,lo=Math.min(Ta,Tset-10)-2;
      var y0=Math.floor(lo/5)*5,y1=Math.ceil(hi/5)*5;
      var p=U.plot(x0,16,pw,190,[0,2400],[y0,y1]);
      o.push(p.axes({xl:"時間 [s]",yl:"温度 [°C]",xt:[0,400,800,1200,1600,2000,2400],yt:U.nice(y0,y1,5).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:nar?36:40}));
      o.push(p.line([[0,Tset],[2400,Tset]],"green",1.2,"5 3"));
      if(W2){o.push(S.L(p.X(1200),p.y,p.X(1200),p.y+p.h,"alias",1,"3 3"));o.push(S.T(p.X(1200)+4,p.y+12,"風","start",9.5,"alias",true,false,null,true));}
      if(L>0)o.push(p.line(out.map(function(q){return [q[0],q[2]];}),"teal",1.3,"5 3"));
      o.push(p.line(out.map(function(q){return [q[0],q[1]];}),"signal",2));
      o.push(S.T(p.X(2390),p.Y(Tset)-5,"目標 "+Tset+" °C","end",9.5,"green",false,false,null,true));
      o.push(_w14_strip(S,U,p.x,p.y+p.h+40,p.w,14,2400,out.map(function(q){return [q[0],q[3]];}),"purple","ヒータ"));
      o.push(S.T(p.x,p.y+p.h+70,"青: 板の温度　緑の破線: 目標"+(L>0?"　青緑の破線: センサの読み（L 遅れ）":""),"start",9.5,"muted"));
      box.set(S.svg(Wd,p.y+p.h+78,o));
      /* 読み出し */
      var h="",K=P*R,warn="";
      if(Ta+K<Tset)warn+='<span class="warn">ヒータの電力が足りない: 入れ続けても '+_w14_f(Ta+K,1)+' °C までしか上がらない</span><br>';
      if(W2&&Ta+P*R*0.64<Tset)warn+='<span class="warn">風が当たると、入れ続けても '+_w14_f(Ta+P*R*0.64,1)+' °C までしか上がらない</span><br>';
      h+="冷えた所から: 最高 <b>"+_w14_f(A.mx,2)+" °C</b>"+(A.mx>Tset?"（行き過ぎ "+_w14_f(A.mx-Tset,2)+" K）":"")+(M===0?"":(settle>=1100?'、<span class="warn">1200 s までに ±0.5 K に落ち着かない</span>':"、±0.5 K に入るのは "+Math.round(settle+2)+" s（その後は出ない）"))+"<br>";
      h+="1000〜1200 s: 平均 "+_w14_f(B.av,2)+" °C（偏差 "+_w14_f(Tset-B.av,2)+" K）、振れ幅 "+_w14_f(B.mx-B.mn,2)+" K"+(M>0&&B.mx-B.mn>0.5?' <span class="warn">振動が収まらない</span>':"")+"<br>";
      if(W2)h+="風の後: 最低 "+_w14_f(Dd.mn,2)+" °C、2200〜2400 s の平均 "+_w14_f(D2.av,2)+" °C（偏差 "+_w14_f(Tset-D2.av,2)+" K）、振れ幅 "+_w14_f(D2.mx-D2.mn,2)+" K<br>";
      if(M===0){
        var on1=ons.filter(function(t){return t>=300&&t<1200;}),c1=on1.length,perDay=c1>=2?86400*(c1-1)/(on1[c1-1]-on1[0]):0,hh=hy.get();
        var up=(Ta+K-(Tset+hh))*(1-Math.exp(-L/(R*C))),dn=((Tset-hh)-Ta)*(1-Math.exp(-L/(R*C)));
        h+="入れ切り: 300〜1200 s の往復の周期 "+(c1>=2?_w14_sig((on1[c1-1]-on1[0])/(c1-1),4)+" s":"—")+" → 1 日 約 "+Math.round(perDay)+" 回、リレー（10 万回）は約 "+(perDay>0?_w14_days(1e5/perDay):"—")+"<br>";
        if(Ta+K>Tset+hh&&Tset-hh>Ta)h+="2 節の式（読む間隔を 0 とした値）: "+_w14_f(Tset-hh-dn,2)+"〜"+_w14_f(Tset+hh+up,2)+" °C（行き過ぎ "+_w14_f(up,2)+" K、下がり過ぎ "+_w14_f(dn,2)+" K）<br>";
      }
      if(M===1){var kv=kp.get();h+="定常偏差の式 (T_set − T_a) ÷ (1 + K Kp) = "+_w14_f((Tset-Ta)/(1+K*kv),2)+" K（K = "+_w14_sig(K,3)+" K）"+(W2?"、風の後 "+_w14_f((Tset-Ta)/(1+K*0.64*kv),2)+" K":"")+"<br>";}
      if(M>0&&L>0){var zn=1.2*R*C/(K*L);h+="ジーグラとニコルスの目安: Kp = 1.2τ ÷ (KL) = "+_w14_sig(zn,2)+" /K、Ti = "+(2*L)+" s、Td = "+(0.5*L)+" s（τ = "+_w14_sig(R*C,3)+" s、K = "+_w14_sig(K,3)+" K）<br>";}
      ro.innerHTML=warn+h+'<div class="wnote">板は熱抵抗と熱容量の一次遅れ、センサの読みはむだ時間 L だけ遅れるとした。0.1 s 刻みで計算し、制御は 1 s ごと。冷えた板（周囲温度）から始める。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 4 節: 交流のヒータの入れ切り ---- */
  REG.w14_cycle=function(el,U){
    var S=U.S;
    U.head(el,"AC HEATER","交流のヒータの入れ切りの方法");
    var r1=U.ctrls(el);
    var uu=U.slider(r1,"出力",{min:0,max:100,step:1,value:30,fmt:function(v){return v+" %";},onInput:draw});
    var meth=U.select(r1,"入れ方",["散らす（1 周期ごとに足し込む）","窓でまとめる（バースト）","半周期単位で散らす","位相制御（06 章 6 節）"],0,draw);
    var r2=U.ctrls(el);
    var nw=U.slider(r2,"窓の周期数 N",{values:[5,10,20,50,100,200],value:50,fmt:function(v){return v+" 周期";},onInput:draw});
    var fq=U.select(r2,"周波数",["50 Hz","60 Hz"],0,draw);
    var ht=U.select(r2,"ヒータ",["保温プレート 80 W（板 400 J/K）","ファンヒータ 1 kW（例）"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"4 節の例（30 %・散らす）",function(){uu.set(30);meth.set(0);nw.set(50);draw();});
    U.button(br,"窓 100 周期でまとめる（35 %）",function(){uu.set(35);meth.set(1);nw.set(100);draw();});
    U.button(br,"半周期単位で 50 %",function(){uu.set(50);meth.set(2);draw();});
    U.button(br,"位相制御 30 %",function(){uu.set(30);meth.set(3);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function phaseFrac(a){return 1-a/Math.PI+Math.sin(2*a)/(2*Math.PI);}
    function draw(){
      var u=uu.get()/100,m=+meth.get(),N=nw.get(),f=fq.get()===0?50:60,big=ht.get()===1;
      nw.el.style.display=m===1?"":"none";
      var Pm=big?1000:80,Vr=100,Irms=Pm/Vr,Ipk=Irms*Math.SQRT2,Cth=400;
      /* 半周期ごとの導通の割合（0〜1）を 2000 周期ぶん作る */
      var NH=4000,frac=new Float64Array(NH),alpha=0,i;
      if(m===3){var lo=0,hi=Math.PI;for(i=0;i<60;i++){var mid=(lo+hi)/2;if(phaseFrac(mid)>u)lo=mid;else hi=mid;}alpha=(lo+hi)/2;if(u<=0)alpha=Math.PI;if(u>=1)alpha=0;}
      var acc=0,nOn=Math.round(u*N);
      for(i=0;i<NH;i++){
        if(m===0){if(i%2===0){acc+=Math.round(u*1000);var on=acc>=1000;if(on)acc-=1000;frac[i]=on?1:0;}else frac[i]=frac[i-1];}
        else if(m===1){var c=Math.floor(i/2)%N;frac[i]=c<nOn?1:0;}
        else if(m===2){acc+=Math.round(u*1000);if(acc>=1000){acc-=1000;frac[i]=1;}else frac[i]=0;}
        else frac[i]=u<=0?0:(u>=1?1:1);   /* 位相制御は毎半周期、α から導通 */
      }
      /* 電力・直流の成分・入れ切りの回数 */
      var pw=0,dc=0,tr=0;
      for(i=0;i<NH;i++){
        var pf=m===3?phaseFrac(alpha):frac[i];pw+=pf;
        var area=m===3?(1+Math.cos(alpha))/2:frac[i];      /* 半周期の電流の面積（全導通で 1） */
        dc+=(i%2===0?1:-1)*area;
        if(i>0&&m!==3&&frac[i]!==frac[i-1])tr++;
      }
      pw/=NH;
      var Idc=dc/NH*(2/Math.PI)*Ipk;                        /* 電流の平均 [A] */
      var trPerS=m===3?2*f*2:tr/(NH/(2*f));
      /* 板の温度の上下（周期の中の熱の出入りを積算。80 W の板） */
      var dev=0,mn=0,mx=0,dth=1/(2*f),Pavg=pw*80;
      for(i=0;i<NH;i++){var pf2=m===3?phaseFrac(alpha):frac[i];dev+=(pf2*80-Pavg)*dth/Cth;if(i>200){mn=Math.min(mn,dev);mx=Math.max(mx,dev);}}
      if(NH<=200){mn=0;mx=0;}
      /* 図: 表示する周期の数 */
      var nar=_w14_nar(box),Wd=nar?400:700,x0=14,ww=nar?370:670,o=[];
      var ncy=m===1?Math.min(Math.max(2*N,20),200):40,yy=40,amp=26,tspan=ncy/f;
      o.push(S.T(nar?14:10,16,"ヒータの電流（"+ncy+" 周期 = "+_w14_sig(tspan,3)+" s）。灰色は電源の電圧の形","start",10,"ink",true));
      o.push(S.L(x0,yy+amp,x0+ww,yy+amp,"faint",0.8));
      var X=function(c){return x0+c/ncy*ww;};
      if(ncy<=60){
        var ref=[],cur=[],K=ncy*24;
        for(var j=0;j<=K;j++){var ph=j/24,v=Math.sin(2*Math.PI*ph),hk=Math.min(Math.floor(ph*2),NH-1),on2;
          if(m===3){var fr=(ph*2)%1;on2=fr*Math.PI>=alpha;}else on2=frac[hk]>0.5;
          ref.push([X(ph),yy+amp-amp*v]);cur.push([X(ph),on2?yy+amp-amp*v:yy+amp]);}
        o.push(S.PL(ref,"faint",0.9,null,"2 2"));o.push(S.PL(cur,m===3||m===2?"alias":(m===1?"gold":"green"),1.5));
      }else{
        for(var c2=0;c2<ncy;c2++){var a2=frac[2*c2],b2=frac[2*c2+1];
          if(a2>0.5)o.push(S.RECT(X(c2),yy,X(c2+0.5)-X(c2),amp,0,U.soft("gold"),"gold",0.6));
          if(b2>0.5)o.push(S.RECT(X(c2+0.5),yy+amp,X(c2+1)-X(c2+0.5),amp,0,U.soft("gold"),"gold",0.6));}
        o.push(S.T(x0+ww,yy-4,"周期が多いので、正（上）と負（下）の半周期を帯で示す","end",9,"muted"));
      }
      o.push(S.L(x0,yy+2*amp+8,x0+ww,yy+2*amp+8,"muted",1));
      U.nice(0,tspan*1000,5).forEach(function(v){if(v<=tspan*1000+1e-6){var xx=x0+v/(tspan*1000)*ww;o.push(S.L(xx,yy+2*amp+8,xx,yy+2*amp+12,"muted",1));o.push(S.T(xx,yy+2*amp+24,_w14_sig(v,3),"middle",9,"muted"));}});
      o.push(S.T(x0+ww/2,yy+2*amp+38,"時間 [ms]","middle",9.5,"muted"));
      box.set(S.svg(Wd,yy+2*amp+46,o));
      var h="";
      h+="平均の電力: <b>"+_w14_sig(pw*100,4)+" %</b>（"+_w14_sig(pw*Pm,4)+" W）"+(m===1?"・細かさ 1/N = "+_w14_sig(100/N,3)+" %、窓 "+_w14_sig(N/f,3)+" s":"")+(m===3?"・α = "+_w14_sig(alpha*180/Math.PI,4)+"°（半周期の途中で入れる: ノイズと高調波）":"")+"<br>";
      h+="直流の成分（電流の平均）: "+(Math.abs(Idc)<1e-3*Ipk?'<span class="ok">ほぼ 0</span>':'<span class="warn">'+_w14_sig(Math.abs(Idc),3)+" A（山の値 "+_w14_sig(Ipk,3)+" A の "+_w14_sig(Math.abs(Idc)/Ipk*100,3)+" %）</span>")+"<br>";
      h+="板（80 W・400 J/K）の温度の上下の幅: "+(mx-mn<1e-6?"ほぼ 0":_w14_sig(mx-mn,2)+" K")+(m===1?"（式 D(1 − D) P T_w ÷ C = "+_w14_sig(pw*(1-pw)*80*(N/f)/Cth,2)+" K）":"")+"<br>";
      h+="入れ切りの変わり目: 1 秒に約 "+_w14_sig(trPerS,3)+" 回"+(big?"・変わり目ごとに電流が "+_w14_sig(Irms,3)+" A 変わり、配線の抵抗 0.2 Ω（例）なら電圧が "+_w14_sig(Irms*0.2,2)+" V 変わる":"")+"<br>";
      ro.innerHTML=h+'<div class="wnote">電流は抵抗の負荷（ヒータ）の正弦波とした。散らす入れ方は本文 4 節の cycle_on と同じ規則（1 周期ごとに出力を足し込み、1000 ‰ に届いたら入れる）。半周期単位は、同じ規則を半周期ごとに使った例。温度の上下の幅は、80 W・400 J/K の板で、周期の中の熱の出入りを足し合わせて求めた。</div>';
    }
    draw();
  };

  /* ---- 5 節: 異常のときの温度と守り ---- */
  REG.w14_fault=function(el,U){
    var S=U.S;
    U.head(el,"FAULT","異常のときの板の温度と、守りの働き");
    var r1=U.ctrls(el);
    var fs=U.select(r1,"600 s に起きる異常",["なし（普段の運転）","センサの断線","センサがはがれる","マイコンが止まる（出力が入ったまま）","SSR が短絡する","ヒータが切れる"],2,draw);
    var ta=U.slider(r1,"周囲温度",{min:0,max:40,step:1,value:25,fmt:function(v){return v+" °C";},onInput:draw});
    var r2=U.ctrls(el);
    var gd=U.checkbox(r2,"プログラムの見張り",true,draw);
    var wd=U.checkbox(r2,"ウォッチドッグ",true,draw);
    var ry=U.checkbox(r2,"2 つ目のスイッチ（リレー）",true,draw);
    var r3=U.ctrls(el);
    var th=U.checkbox(r3,"サーモスタット（90 °C で開き、80 °C で戻る）",true,draw);
    var fu=U.checkbox(r3,"温度ヒューズ（115 °C）",true,draw);
    var br=U.btnrow(el);
    function setAll(a,b,c,d,e){gd.set(a);wd.set(b);ry.set(c);th.set(d);fu.set(e);draw();}
    U.button(br,"すべての守り",function(){setAll(true,true,true,true,true);});
    U.button(br,"守りなし",function(){setAll(false,false,false,false,false);});
    U.button(br,"プログラムの守りだけ",function(){setAll(true,true,true,false,false);});
    U.button(br,"マイコンに頼らない守りだけ",function(){setAll(false,false,false,true,true);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var F=+fs.get(),Ta=ta.get(),G=gd.get(),WD=wd.get(),RY=ry.get(),TH=th.get(),FU=fu.get();
      var dt=0.1,tend=2400,n=Math.round(tend/dt),nd=Math.round(20/dt),tf=600,C=400,R=1.25,Pm=80,a=Math.exp(-dt/(R*C));
      var T=60,hist=new Float64Array(n+1),pid=_w14_pid(0.15,80,10,true,1,60);pid.setI((60-Ta)/(Pm*R));
      var g={fault:"",hi:0,t0:0},bad=0,u=(60-Ta)/(Pm*R),relay=true,tsT=60,tsOn=true,fuT=60,fuOk=true,alive=true,tdead=0,reset=false,rdDet=null;
      var ev=[],out=[],tsCount=0,stopBy="",tStop=-1,tmax=60,tmaxAt=0;
      function mark(t,s,c){ev.push([t,s,c]);}
      for(var k=0;k<=n;k++){
        var t=k*dt;hist[k]=T;
        var rd=k>=nd?hist[k-nd]:60;
        if(F===2&&t>=tf){if(rdDet===null)rdDet=rd;}
        if(k%10===0){
          var ok=true,rv=rd;
          if(F===1&&t>=tf){rv=-50;ok=!G;}              /* 断線: 最も冷たいと読める。見張りがあれば範囲の外として扱う */
          if(F===2&&t>=tf){rdDet+=(Ta-rdDet)*(1-Math.exp(-1/30));rv=rdDet;}
          if(F===3&&t>=tf&&alive){alive=false;tdead=t;u=1;mark(t,"マイコンが止まる","alias");}
          if(alive){
            bad=ok?0:bad+1;
            var uc=pid.step(rv,ok);
            if(G){var had=g.fault;uc=_w14_guard(g,bad>=3,rv,uc);if(!had&&g.fault){mark(t,"見張り: "+g.fault,"signal");if(RY){relay=false;}if(!stopBy&&!(F===4&&!RY)){stopBy="プログラムの見張り（"+g.fault+"）"+(RY?"→ 2 つ目のスイッチも切る":"");tStop=t;}}}
            u=uc;
          }else if(WD&&!reset&&t>=tdead+1){reset=true;u=0;relay=false;mark(t,"ウォッチドッグでリセット","signal");if(!stopBy){stopBy="ウォッチドッグ（リセットの間と再起動の後は切れたまま）";tStop=t;}}
          if(t%2===0)out.push([t,T,(F===1&&t>=tf)?Math.max(rv,-5):rv,0]);
        }
        var ssr=(F===4&&t>=tf)?1:u;
        if(F===4&&t===tf)mark(t,"SSR が短絡","alias");
        var heaterOk=!(F===5&&t>=tf);
        tsT+=(T-tsT)*dt/10;fuT+=(T-fuT)*dt/10;
        if(TH){if(tsOn&&tsT>=90){tsOn=false;tsCount++;if(tsCount===1)mark(t,"サーモスタットが開く","alias");if(!stopBy){stopBy="サーモスタット（開いては閉じて 80〜90 °C 付近に保つ）";tStop=t;}}else if(!tsOn&&tsT<=80)tsOn=true;}
        if(FU&&fuOk&&fuT>=115){fuOk=false;mark(t,"温度ヒューズが切れる","alias");if(!stopBy||stopBy.indexOf("サーモスタット")===0){stopBy="温度ヒューズ（戻らない。交換が要る）";tStop=t;}}
        var pw=Pm*ssr*(relay?1:0)*(tsOn?1:0)*(fuOk?1:0)*(heaterOk?1:0);
        if(out.length&&out[out.length-1][0]===t)out[out.length-1][3]=pw/Pm;
        var Ti=Ta+pw*R;T=Ti+(T-Ti)*a;
        if(T>tmax){tmax=T;tmaxAt=t;}
      }
      /* 図 */
      var nar=_w14_nar(box),Wd=nar?400:700,x0=nar?52:62,pw2=nar?330:610,o=[];
      var y1=Math.max(160,Math.ceil((tmax+35)/10)*10),y0=Math.min(20,Math.floor((Ta-5)/10)*10);
      if(F===1&&!G)y0=Math.min(y0,-10);
      var p=U.plot(x0,16,pw2,210,[0,2400],[y0,y1]);
      o.push(p.axes({xl:"時間 [s]",yl:"温度 [°C]",xt:[0,400,800,1200,1600,2000,2400],yt:U.nice(y0,y1,6).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:nar?36:40}));
      var lines=[[Ta+Pm*R,"最大の電力で行き着く "+_w14_f(Ta+Pm*R,0)+" °C","gold",true]];
      if(FU)lines.push([115,"温度ヒューズ 115 °C","alias",true]);
      if(TH)lines.push([90,"サーモスタット 90 °C","alias",true]);
      if(G)lines.push([75,"ソフトの上限 75 °C","signal",true]);
      lines.push([60,"目標 60 °C","green",true]);
      lines.forEach(function(L){if(L[0]<=y1){o.push(p.line([[0,L[0]],[2400,L[0]]],L[2],1,"4 3"));o.push(S.T(p.x+4,p.Y(L[0])-4,L[1],"start",9,L[2],false,false,null,true));}});
      o.push(S.L(p.X(tf),p.y,p.X(tf),p.y+p.h,"alias",1,"2 3"));
      o.push(p.line(out.map(function(q){return [q[0],Math.max(y0,q[2])];}),"teal",1.3,"5 3"));
      o.push(p.line(out.map(function(q){return [q[0],q[1]];}),"signal",2.2));
      ev.slice(0,4).forEach(function(e,i){var xx=p.X(e[0]),yy=p.y+12+i*13,rt=xx>p.x+p.w*0.6;o.push(S.D(xx,yy-3,e[2],3.2));o.push(S.T(xx+(rt?-6:6),yy+1,e[1],rt?"end":"start",9,e[2],true,false,null,true));});
      o.push(_w14_strip(S,U,p.x,p.y+p.h+40,p.w,14,2400,out.map(function(q){return [q[0],q[3]];}),"purple","ヒータ"));
      o.push(S.T(p.x,p.y+p.h+70,"青: 板の温度　青緑の破線: センサの読み　赤の縦線: 異常が起きた時刻","start",9.5,"muted"));
      box.set(S.svg(Wd,p.y+p.h+78,o));
      var h="";
      h+="板の最高温度: <b>"+_w14_f(tmax,1)+" °C</b>（"+Math.round(tmaxAt)+" s）"+(tmax>=100?' <span class="warn">危ない温度まで上がった</span>':(tmax<=75.5?' <span class="ok">ソフトの上限以下</span>':""))+"<br>";
      if(F===0)h+="異常なし: 板は目標の付近に保たれる<br>";
      else if(F===5&&!stopBy)h+="止めたもの: なし（ヒータが切れているので、温まらないだけ）<br>";
      else h+="止めたもの: "+(stopBy?"<b>"+stopBy+"</b>（異常から "+Math.round(tStop-tf)+" s）":'<span class="warn">何も止めない（最大の電力のまま上がり続ける）</span>')+"<br>";
      if(F===4&&G&&!RY)h+='<span class="warn">見張りは異常に気づくが、SSR が短絡しているので、プログラムでは切れない</span><br>';
      if(F===3&&!WD)h+='<span class="warn">マイコンが止まったので、プログラムの見張りは働かない</span><br>';
      if(F===2&&!G)h+='<span class="warn">読みは範囲の中で下がるので、制御はヒータを最大にする</span><br>';
      if(F===1&&!G)h+='<span class="warn">断線した NTC は最も冷たいと読め、制御はヒータを最大にする</span><br>';
      if(F===5)h+=G?"ヒータが切れたことは、見張りが「上がらない」で知らせる<br>":"ヒータが切れても危険は無いが、見張りが無いと気づけない<br>";
      ro.innerHTML=h+'<div class="wnote">本文 5 節の例の値: PID は 0.15 /K・80 s・10 s、見張りは 75 °C・90 % で 60 s ごとに 2 K・600 s。センサがはがれると読みは 30 s の時定数で周囲温度へ向かう。サーモスタットと温度ヒューズは、板の温度に 10 s の遅れで追いつくとした。ウォッチドッグは 1 s でリセットし、再起動の後はヒータを入れない。</div>';
    }
    draw();
  };
