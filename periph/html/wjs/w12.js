  /* ===== 12 章 出力をスイッチする ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w12_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w12_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w12_v(v){return (Math.abs(v)<10?v.toFixed(2).replace("-","−"):_w12_sig(v,3))+" V";}

  /* ---- 2 節: LED の電流と PWM ---- */
  var _w12_LEDS=[{t:"赤（V_F 2.0 V）",vf:2.0},{t:"黄（V_F 2.1 V）",vf:2.1},{t:"白・青（V_F 2.9 V）",vf:2.9}];
  REG.w12_led=function(el,U){
    var S=U.S,F=U.fmt,RO=40;
    U.head(el,"LED","LED の電流と PWM — 電池の電圧・抵抗・周波数・デューティ");
    var r1=U.ctrls(el);
    var col=U.select(r1,"LED の色",_w12_LEDS.map(function(x){return x.t;}),0,draw);
    var vdd=U.slider(r1,"電源（電池）の電圧 V_DD",{min:1.8,max:3.6,step:0.05,value:3.0,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var rr=U.slider(r1,"電流制限抵抗 R",{values:[0,22,47,100,150,220,300,470,680,1000,2200],value:300,fmt:function(v){return v+" Ω";},onInput:draw});
    var r2=U.ctrls(el);
    var fq=U.slider(r2,"PWM の周波数",{values:[30,60,128,256,512,1024,4000,16000],value:1024,fmt:function(v){return v>=1000?(v/1000)+" kHz":v+" Hz";},onInput:draw});
    var du=U.slider(r2,"デューティ D",{min:0,max:100,step:1,value:34,fmt:function(v){return v+" %";},onInput:draw});
    var r3=U.ctrls(el);
    var cmp=U.checkbox(r3,"測った電池の電圧で D を補正する",false,draw);
    var it=U.slider(r3,"補正の目標（平均の電流）",{values:[0.2,0.5,1,2,3,5],value:1,fmt:function(v){return v+" mA";},onInput:draw});
    var br=U.btnrow(el);
    function pre(c,v,r,f,d,k){col.set(c);vdd.set(v);rr.set(r);fq.set(f);du.set(d);cmp.set(k);it.set(1);draw();}
    U.button(br,"2 節の例（赤・300 Ω・3.0 V）",function(){pre(0,3.0,300,1024,34,false);});
    U.button(br,"電池の使い終わり 2.2 V",function(){pre(0,2.2,300,1024,34,false);});
    U.button(br,"補正して 2.4 V",function(){pre(0,2.4,300,1024,34,true);});
    U.button(br,"眠る間のクロックで 128 Hz",function(){pre(0,3.0,300,128,34,false);});
    U.button(br,"白を 3.0 V で",function(){pre(2,3.0,0,1024,50,false);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function wave(p,T,D,Ion,t0,t1){ /* 時間 [s] t0〜t1 の PWM の電流 [mA] を描く */
      var out=[],pts=[[p.X(t0),p.Y(0)]],n0=Math.floor(t0/T),n1=Math.ceil(t1/T);
      for(var n=n0;n<n1;n++){var a=Math.max(t0,n*T),b=Math.min(t1,n*T+D*T);if(b>a){
        out.push(S.RECT(p.X(a),p.Y(Ion*1e3),Math.max(0.6,p.X(b)-p.X(a)),p.Y(0)-p.Y(Ion*1e3),0,U.soft("purple"),"none",0));
        pts.push([p.X(a),p.Y(0)],[p.X(a),p.Y(Ion*1e3)],[p.X(b),p.Y(Ion*1e3)],[p.X(b),p.Y(0)]);}}
      pts.push([p.X(t1),p.Y(0)]);out.push(S.PL(pts,"purple",n1-n0>120?0.8:1.8));return out.join("");}
    function draw(){
      var Ld=_w12_LEDS[col.get()],V=vdd.get(),R=rr.get(),f=fq.get(),T=1/f,Ion=Math.max(0,(V-Ld.vf)/(R+RO)),D=du.get()/100,It=it.get()*1e-3,need=Ion>0?It/Ion:Infinity;
      it.el.style.opacity=cmp.get()?"1":"0.45";du.el.style.opacity=cmp.get()?"0.45":"1";
      if(cmp.get())D=Math.min(1,need);
      var Iavg=D*Ion,nar=_w12_nar(box),W=nar?400:700,o=[];
      var ymax=Math.max(1,Ion*1e3*1.25),yt=U.nice(0,ymax,4).filter(function(v){return v<=ymax+1e-9;});
      var pa=nar?U.plot(52,30,320,110,[0,3*T],[0,ymax]):U.plot(64,30,270,140,[0,3*T],[0,ymax]);
      var pb=nar?U.plot(52,206,320,110,[0,0.04],[0,ymax]):U.plot(420,30,260,140,[0,0.04],[0,ymax]);
      o.push(S.T(pa.x-40,18,"(a) 3 周期（拡大）","start",10.5,"ink",true));
      o.push(S.T(pb.x-40,pb.y-12,"(b) 40 ms の間","start",10.5,"ink",true));
      var tu=T*3<2e-3?1e6:1e3,un=tu===1e6?"µs":"ms",tx=U.nice(0,3*T*tu,4).filter(function(v){return v<=3*T*tu+1e-9;});
      o.push(pa.axes({xl:"時間 ["+un+"]",yl:"電流 [mA]",xt:tx.map(function(v){return v/tu;}),yt:yt,xfmt:function(v){return U.sig(v*tu,3);},yfmt:function(v){return U.sig(v,3);},ylOff:40}));
      o.push(pb.axes({xl:"時間 [ms]",yl:"電流 [mA]",xt:[0,0.01,0.02,0.03,0.04],yt:yt,xfmt:function(v){return U.sig(v*1e3,3);},yfmt:function(v){return U.sig(v,3);},ylOff:40}));
      if(Ion>0){o.push(wave(pa,T,D,Ion,0,3*T));o.push(wave(pb,T,D,Ion,0,0.04));}
      [pa,pb].forEach(function(p){o.push(p.line([[p.xr[0],Iavg*1e3],[p.xr[1],Iavg*1e3]],"signal",1.6,"6 4"));});
      o.push(S.T(pa.x+pa.w,pa.Y(Iavg*1e3)-5,"平均 "+F.cur(Iavg),"end",9.5,"signal",true,false,null,true));
      if(20<=ymax){o.push(pa.line([[0,20],[3*T,20]],"alias",1.1,"3 3"));o.push(S.T(pa.x+4,pa.Y(20)-4,"ピン 1 本の上限の例 20 mA","start",9,"alias",false,false,null,true));}
      box.set(S.svg(W,nar?352:232,o));
      var fl=f<80?'<span class="warn">止まって見ていてもちらつく</span>':(f<1000?'<span class="warn">目を動かすと点の列に見えやすい</span>':(f<3000?'<b>目を動かすと見えることがある</b>':'<span class="ok">見えにくい</span>（カメラでは縞が写ることがある）'));
      var N=Math.floor(32768/f);
      var h=Ion<=0?'<span class="warn">LED は点かない（V_DD が V_F 以下）</span><br>':"";
      h+="点いている間の電流 I_on = (V_DD − V_F) ÷ (R + R_o) = ("+V.toFixed(2)+" − "+Ld.vf.toFixed(1)+") V ÷ "+(R+RO)+" Ω = <b>"+F.cur(Ion)+"</b>"+(Ion>0.02?' <span class="warn">ピン 1 本の上限（例 20 mA）を超える</span>':"")+"<br>";
      if(cmp.get())h+=(need>1?'<span class="warn">補正しきれない: 目標 '+F.cur(It)+' には D = '+U.sig(need*100,3)+' % が要る（100 % まで）</span><br>':'<span class="ok">補正した D = I_t ÷ I_on = '+U.sig(D*100,3)+' %</span><br>');
      h+="平均の電流 D × I_on = "+U.sig(D*100,3)+" % × "+F.cur(Ion)+" = <b>"+F.cur(Iavg)+"</b>（点いている間のピーク電流は "+F.cur(Ion)+" のまま）<br>";
      h+="PWM "+(f>=1000?(f/1000)+" kHz":f+" Hz")+"（周期 "+F.time(T)+"）: ちらつきの目安 — "+fl+"<br>";
      h+="32.768 kHz のクロックで作ると、1 周期は "+(N>=2?"<b>"+N+" 段</b>（デューティの刻み "+U.sig(100/N,3)+" %）":'<span class="warn">2 段に満たず、作れない</span>');
      ro.innerHTML=h+'<div class="wnote">出力の抵抗 R_o は 40 Ω、V_F は電流によらず一定とした。ちらつきの見え方は人・明るさ・見方で変わる目安。値はすべて例の値。</div>';
    }
    draw();
  };

  /* ---- 4 節: 誘導性負荷を切る ---- */
  REG.w12_flyback=function(el,U){
    var S=U.S,F=U.fmt,VF=0.8,CS=100e-12;
    U.head(el,"FLYBACK","誘導性負荷を切ったときの電圧と電流 — クランプの比較");
    var r1=U.ctrls(el);
    var vs=U.slider(r1,"電源の電圧 V",{min:3,max:48,step:1,value:12,fmt:function(v){return v+" V";},onInput:draw});
    var rc=U.slider(r1,"コイルの抵抗 R",{min:10,max:2000,log:true,value:400,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var lc=U.slider(r1,"インダクタンス L",{min:0.001,max:2,log:true,value:0.4,fmt:function(v){return v<1?U.sig(v*1e3,3)+" mH":U.sig(v,3)+" H";},onInput:draw});
    var r2=U.ctrls(el);
    var cl=U.select(r2,"クランプ",["(a) なし","(b) ダイオード","(b') ダイオード + 抵抗","(c) ダイオード + ツェナー","(d) TVS（ドレインと GND の間）"],1,draw);
    var vz=U.slider(r2,"ツェナー・TVS の電圧",{values:[5.1,12,18,24,30,33,47,62],value:24,fmt:function(v){return v+" V";},onInput:draw});
    var rs=U.slider(r2,"直列の抵抗（(b') のとき）",{values:[47,100,220,470,1000,2200],value:470,fmt:function(v){return v+" Ω";},onInput:draw});
    var r3=U.ctrls(el);
    var vr=U.slider(r3,"MOSFET の耐圧",{values:[20,30,40,60,100],value:60,fmt:function(v){return v+" V";},onInput:draw});
    var kr=U.slider(r3,"接点が離れ始める電流（切る前の割合）",{values:[10,20,30,50],value:20,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);
    function pre(v,r,l,c,z){vs.set(v);rc.set(r);lc.set(l);cl.set(c);if(z)vz.set(z);draw();}
    U.button(br,"4 節 (b) ダイオード",function(){pre(12,400,0.4,1);});
    U.button(br,"4 節 (c) ツェナー 24 V",function(){pre(12,400,0.4,3,24);});
    U.button(br,"4 節 (d) TVS 30 V",function(){pre(12,400,0.4,4,30);});
    U.button(br,"4 節 (a) クランプなし",function(){pre(12,400,0.4,0);});
    U.button(br,"ソレノイド（24 Ω・50 mH）",function(){pre(12,24,0.05,1);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var V=vs.get(),R=rc.get(),L=lc.get(),k=cl.get(),Vz=vz.get(),Rs=rs.get(),Vr=vr.get(),kk=kr.get()/100;
      vz.el.style.opacity=(k===3||k===4)?"1":"0.45";rs.el.style.opacity=k===2?"1":"0.45";
      var I0=V/R,tau=L/R,EL=0.5*L*I0*I0,nar=_w12_nar(box),W=nar?400:700,o=[],h="",warn="";
      var pv=nar?U.plot(52,30,320,110,[0,1],[0,1]):U.plot(64,30,270,150,[0,1],[0,1]);
      var pi=nar?U.plot(52,206,320,110,[0,1],[0,1]):U.plot(420,30,260,150,[0,1],[0,1]);
      if(k===0){
        /* クランプなし: コイルのエネルギーが浮遊容量 C へ（抵抗は無視）。v − V = −V cos ωt + I0 Z sin ωt */
        var Z=Math.sqrt(L/CS),w=1/Math.sqrt(L*CS),th=Math.PI/w,vpk=V+Math.sqrt(V*V+I0*I0*Z*Z),tus=th*1e6;
        var ymx=vpk*1.1;
        pv=nar?U.plot(52,30,320,110,[0,tus],[0,ymx]):U.plot(64,30,270,150,[0,tus],[0,ymx]);
        pi=nar?U.plot(52,206,320,110,[0,tus],[-I0*1e3*1.1,I0*1e3*1.1]):U.plot(420,30,260,150,[0,tus],[-I0*1e3*1.1,I0*1e3*1.1]);
        var A=[],B=[];for(var j=0;j<=120;j++){var t=th*j/120;A.push([t*1e6,V-V*Math.cos(w*t)+I0*Z*Math.sin(w*t)]);B.push([t*1e6,(I0*Math.cos(w*t)+V/Z*Math.sin(w*t))*1e3]);}
        o.push(pv.axes({xl:"切ってからの時間 [µs]",yl:"ドレインの電圧 [V]",xt:U.nice(0,tus,4),yt:U.nice(0,ymx,4),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
        o.push(pi.axes({xl:"切ってからの時間 [µs]",yl:"コイルの電流 [mA]",xt:U.nice(0,tus,4),yt:U.nice(-I0*1e3,I0*1e3,4),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
        o.push(pv.line(A,"alias",2.2));o.push(pi.line(B,"alias",2.2));
        o.push(pv.line([[0,Vr],[tus,Vr]],"signal",1.4,"5 3"));o.push(S.T(pv.x+pv.w,pv.Y(Vr)-5,"MOSFET の耐圧 "+Vr+" V","end",9,"signal",true,false,null,true));
        warn='<span class="warn">クランプが無い: ドレインは約 '+_w12_v(vpk)+' まで上がろうとし、耐圧 '+Vr+' V をはるかに超える</span><br>';
        h="浮遊容量 C = 100 pF とすると、v = V + √(V² + I0² L/C) ≈ <b>"+_w12_v(vpk)+"</b>（"+F.time(th/2)+" 後に最大）。実際には MOSFET がこの手前で壊れるか、なだれ降伏で電流を流し、½ L I0² = "+U.sig(EL*1e3,3)+" mJ を熱にする。<br>";
      }else{
        /* クランプあり: L di/dt = −(R' i + Vc)、R' = R (+ Rs)。i(t) = −Vc/R' + (I0 + Vc/R') e^{−t R'/L} */
        var Rp=R+(k===2?Rs:0),Vc=k===1||k===2?VF:(k===3?VF+Vz:Vz-V),dev=k===4?Vz:(k===3?VF+Vz:VF);
        if(Vc<=0){warn='<span class="warn">TVS の電圧が電源の電圧以下: 普段から TVS に電流が流れる。電源の電圧より十分高い TVS を選ぶ</span><br>';Vc=0.01;}
        var tp=L/Rp,t0=tp*Math.log(1+Rp*I0/Vc),tk=tp*Math.log((I0+Vc/Rp)/(kk*I0+Vc/Rp)),span=t0*1.3,su=span<2e-3?1e6:1e3,un=su===1e6?"µs":"ms";
        var vpk=k===4?Vz:V+VF+(k===2?Rs*I0:0)+(k===3?Vz:0),ymx=Math.max(vpk,V)*1.25;
        pv=nar?U.plot(52,30,320,110,[-0.1*span*su,span*su],[0,ymx]):U.plot(64,30,270,150,[-0.1*span*su,span*su],[0,ymx]);
        pi=nar?U.plot(52,206,320,110,[-0.1*span*su,span*su],[0,I0*1e3*1.2]):U.plot(420,30,260,150,[-0.1*span*su,span*su],[0,I0*1e3*1.2]);
        var xt=U.nice(0,span*su,4);
        o.push(pv.axes({xl:"切ってからの時間 ["+un+"]",yl:"ドレインの電圧 [V]",xt:xt,yt:U.nice(0,ymx,4),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
        o.push(pi.axes({xl:"切ってからの時間 ["+un+"]",yl:"コイルの電流 [mA]",xt:xt,yt:U.nice(0,I0*1e3*1.1,4),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
        var A=[[-0.1*span*su,0],[0,0]],B=[[-0.1*span*su,I0*1e3],[0,I0*1e3]],ER=0,EC=0,Q=0,N=400;
        for(var j=0;j<=N;j++){var t=t0*j/N,i=Math.max(0,-Vc/Rp+(I0+Vc/Rp)*Math.exp(-t/tp));
          A.push([t*su,k===4?Vz:V+VF+(k===2?Rs*i:0)+(k===3?Vz:0)]);B.push([t*su,i*1e3]);
          if(j>0){var dt=t0/N,ia=(i+B[B.length-2][1]/1e3)/2;ER+=R*ia*ia*dt;Q+=ia*dt;EC+=(k===2?(VF*ia+Rs*ia*ia):dev*ia)*dt;}}
        A.push([t0*su,V],[span*su,V]);B.push([span*su,0]);
        var c=["","teal","teal","purple","gold"][k];
        o.push(pv.line([[-0.1*span*su,V],[span*su,V]],"faint",1,"3 3"));o.push(S.T(pv.x+4,pv.Y(V)+13,"電源 "+V+" V","start",9,"muted",false,false,null,true));
        o.push(pv.line(A,c,2.2));o.push(pi.line(B,c,2.2));
        o.push(pv.line([[-0.1*span*su,Vr],[span*su,Vr]],"signal",1.2,"5 3"));if(Vr<ymx)o.push(S.T(pv.x+pv.w,pv.Y(Vr)-5,"耐圧 "+Vr+" V","end",9,"signal",true,false,null,true));
        o.push(pi.line([[-0.1*span*su,kk*I0*1e3],[span*su,kk*I0*1e3]],"gold",1.1,"3 3"));
        o.push(S.D(pi.X(tk*su),pi.Y(kk*I0*1e3),"gold",3.6));o.push(S.T(pi.X(tk*su)+6,pi.Y(kk*I0*1e3)-6,"離れ始める "+F.time(tk),"start",9,"gold",true,false,null,true));
        o.push(S.D(pi.X(t0*su),pi.Y(0),c,3.6));o.push(S.T(pi.X(t0*su),pi.Y(0)-8,"0 に "+F.time(t0),"middle",9,c,true,false,null,true));
        var mg=vpk/Vr;
        if(mg>1)warn+='<span class="warn">ドレインの最高 '+_w12_v(vpk)+' が MOSFET の耐圧 '+Vr+' V を超える</span><br>';
        else if(mg>0.8)warn+='<b>ドレインの最高 '+_w12_v(vpk)+' は耐圧 '+Vr+' V の '+Math.round(mg*100)+' %: 余裕が少ない</b><br>';
        else warn+='<span class="ok">ドレインの最高 '+_w12_v(vpk)+'（耐圧 '+Vr+' V の '+Math.round(mg*100)+' %）</span><br>';
        var ES=k===4?V*Q:0;
        h="コイルにかかる電圧 V_c = "+(k===2?"0.8 V + "+Rs+" Ω × i（最初 "+_w12_v(VF+Rs*I0)+"）":_w12_v(Vc))+"、電流が 0 になるまで t_0 = "+(k===2?"(L/R') ln(1 + R' I0/0.8 V)":"τ ln(1 + R I0/V_c)")+" = <b>"+F.time(t0)+"</b>、"+Math.round(kk*100)+" % まで <b>"+F.time(tk)+"</b><br>";
        h+="½ L I0² = "+U.sig(EL*1e3,3)+" mJ"+(ES>0?" + 電源から "+U.sig(ES*1e3,3)+" mJ":"")+" の行き先: コイルの抵抗 "+U.sig(ER*1e3,3)+" mJ（"+Math.round(ER/(EL+ES)*100)+" %）、クランプ "+U.sig(EC*1e3,3)+" mJ（"+Math.round(EC/(EL+ES)*100)+" %）<br>";
      }
      o.push(S.T(pv.x-40,18,"ドレインの電圧","start",10.5,"ink",true));o.push(S.T(pi.x-40,pi.y-12,"コイルの電流","start",10.5,"ink",true));
      box.set(S.svg(W,nar?352:232,o));
      ro.innerHTML=warn+"切る前の電流 I0 = V ÷ R = <b>"+F.cur(I0)+"</b>、時定数 τ = L ÷ R = "+F.time(tau)+"<br>"+h+
        '<div class="wnote">ダイオードの電圧は 0.8 V で一定、ツェナーと TVS はその電圧で一定とした。(b\') はダイオードに抵抗を直列に入れる方法（4 節）で、抵抗の電圧の分だけ速く消える。接点が離れ始める電流はリレーによる（例の値）。</div>';
    }
    draw();
  };

  /* ---- 5 節: 吸引と保持 ---- */
  var _w12_COILS=[{t:"12 V のリレー（400 Ω・0.4 H）",V:12,R:400,L:0.4},{t:"5 V のリレー（70 Ω・50 mH）",V:5,R:70,L:0.05},{t:"12 V のソレノイド（24 Ω・50 mH）",V:12,R:24,L:0.05}];
  REG.w12_hold=function(el,U){
    var S=U.S,F=U.fmt,VF=0.8;
    U.head(el,"HOLD","リレー・ソレノイドの吸引と、PWM での保持");
    var r1=U.ctrls(el);
    var cs=U.select(r1,"コイル",_w12_COILS.map(function(c){return c.t;}),0,function(){var c=_w12_COILS[cs.get()];vs.set(c.V);draw();});
    var vs=U.slider(r1,"電源の電圧",{min:3,max:15,step:0.1,value:12,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var r2=U.ctrls(el);
    var tpu=U.slider(r2,"吸引の時間（100 %）",{values:[2,5,10,20,50,100],value:50,fmt:function(v){return v+" ms";},onInput:draw});
    var dh=U.slider(r2,"保持のデューティ",{min:10,max:100,step:1,value:53,fmt:function(v){return v+" %";},onInput:draw});
    var fq=U.slider(r2,"PWM の周波数",{values:[200,500,1000,2000,5000,10000,20000,50000],value:20000,fmt:function(v){return v>=1000?(v/1000)+" kHz":v+" Hz";},onInput:draw});
    var r3=U.ctrls(el);
    var kp=U.slider(r3,"吸引に要る電流（定格の割合）",{values:[50,60,70,75,80],value:75,fmt:function(v){return v+" %";},onInput:draw});
    var kh=U.slider(r3,"保持に要る電流（定格の割合）",{values:[20,30,40,50,60],value:40,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);
    function pre(v,t,d,f){vs.set(v);tpu.set(t);dh.set(d);fq.set(f);kp.set(75);kh.set(40);draw();}
    U.button(br,"5 節の例（53 %・20 kHz）",function(){cs.set(0);pre(12,50,53,20000);});
    U.button(br,"保持しない（100 % のまま）",function(){cs.set(0);pre(12,50,100,20000);});
    U.button(br,"電源が 10 % 低い",function(){cs.set(0);pre(10.8,50,53,20000);});
    U.button(br,"PWM 1 kHz",function(){cs.set(0);pre(12,50,53,1000);});
    U.button(br,"電源が 8 V",function(){cs.set(0);pre(8,50,53,20000);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function sim(c,V,tp,D,f){
      /* 0〜tp は入れたまま（吸引）。その後は PWM で、切っている間は V_F で還流する。周期ごとに式で進める */
      var R=c.R,L=c.L,tau=L/R,T=1/f,ton=D*T,toff=(1-D)*T,tend=tp+Math.max(0.03,8*tau);
      function onv(i0,d){return V/R+(i0-V/R)*Math.exp(-d/tau);}
      function offv(i0,d){var tz=tau*Math.log(1+R*i0/VF);return d>=tz?0:-VF/R+(i0+VF/R)*Math.exp(-d/tau);}
      function onq(i0,d){return V/R*d+(i0-V/R)*tau*(1-Math.exp(-d/tau));}   /* 入れている間の ∫ i dt */
      var env=[],i,N=100,j;
      for(j=0;j<=N;j++){var tt=tp*j/N,a=onv(0,tt);env.push([tt,a,a]);}
      i=onv(0,tp);
      var per=Math.max(1,Math.round((tend-tp)/T)),K=Math.max(20,Math.floor(per/10)),rec=Math.max(1,Math.floor(per/500));
      var s2=0,ns=0,imin=Infinity,imax=0,q=0,t=tp;
      for(var n=0;n<per;n++){
        var full=D>=1,i1=onv(i,full?T:ton),i2=full?i1:offv(i1,toff);
        if(n%rec===0||n===per-1)env.push([t+T,Math.min(i,i2),Math.max(i,i1)]);
        if(n>=per-K){   /* 落ち着いた後（最後の K 周期）の値 */
          for(var m=0;m<16;m++){var u=T*(m+0.5)/16,b=(full||u<ton)?onv(i,u):offv(i1,u-ton);s2+=b*b;ns++;}
          imin=Math.min(imin,i,i2);imax=Math.max(imax,i1);
          q+=onq(i,full?T:ton);
        }
        i=i2;t+=T;
      }
      return {env:env,irms2:s2/ns,imin:imin,imax:imax,isup:q/(K*T),tend:tend};
    }
    function draw(){
      var c=_w12_COILS[cs.get()],V=vs.get(),tp=tpu.get()*1e-3,D=dh.get()/100,f=fq.get(),Ir=c.V/c.R,Ip=kp.get()/100*Ir,Ih=kh.get()/100*Ir;
      var r=sim(c,V,tp,D,f),nar=_w12_nar(box),W=nar?400:700,o=[];
      var tu=1e3,ymax=Math.max(Ir,V/c.R)*1.25*1e3;
      var p=nar?U.plot(52,30,320,150,[0,r.tend*tu],[0,ymax]):U.plot(64,30,600,170,[0,r.tend*tu],[0,ymax]);
      o.push(S.RECT(p.X(0),p.y,p.X(tp*tu)-p.X(0),p.h,0,U.soft("signal"),"none",0," fill-opacity=\"0.5\""));
      o.push(p.axes({xl:"入れてからの時間 [ms]",yl:"コイルの電流 [mA]",xt:U.nice(0,r.tend*tu,6).filter(function(v){return v<=r.tend*tu+1e-9;}),yt:U.nice(0,ymax,4).filter(function(v){return v<=ymax;}),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      o.push(p.line([[0,Ip*1e3],[r.tend*tu,Ip*1e3]],"gold",1.2,"5 3"));o.push(S.T(p.x+p.w-2,p.Y(Ip*1e3)-5,"吸引に要る "+F.cur(Ip),"end",9,"gold",false,false,null,true));
      o.push(p.line([[0,Ih*1e3],[r.tend*tu,Ih*1e3]],"alias",1.2,"5 3"));o.push(S.T(p.x+p.w-2,p.Y(Ih*1e3)+13,"保持に要る "+F.cur(Ih),"end",9,"alias",false,false,null,true));
      /* 帯（周期ごとの最小と最大）と線 */
      var up=[],dn=[];r.env.forEach(function(e){up.push([p.X(e[0]*tu),p.Y(e[2]*1e3)]);dn.unshift([p.X(e[0]*tu),p.Y(e[1]*1e3)]);});
      o.push(S.PL(up.concat(dn),"purple",1.2,"purple",null,0.35));
      o.push(S.T(p.X(tp*tu/2),p.y+13,"吸引 100 %","middle",9.5,"signal",true));
      if(D<1)o.push(S.T(p.X((tp+r.tend)/2*tu),p.y+13,"保持 PWM "+Math.round(D*100)+" %","middle",9.5,"signal",true));
      box.set(S.svg(W,nar?222:244,o));
      var reached=r.env.some(function(e){return e[0]<=tp&&e[2]>=Ip;}),ok=r.imin>=Ih;
      var Pfull=V*V/c.R,Pc=r.irms2*c.R,Ps=V*r.isup;
      var h="";
      h+=(reached&&tp>=0.01?'<span class="ok">吸引できる</span>（吸引の間に '+F.cur(Ip)+' を超える）':(!reached?'<span class="warn">電流が吸引に要る '+F.cur(Ip)+' に届かない: 引き寄せられない</span>':'<span class="warn">吸引の時間が動作時間の例（10 ms）より短い: 引き寄せきる前に保持へ移る</span>'))+"<br>";
      h+=(ok?'<span class="ok">保持できる</span>':'<span class="warn">保持できない（落ちる）</span>')+": 保持の間の電流 "+F.cur(r.imin)+"〜"+F.cur(r.imax)+"（揺れ "+F.cur(r.imax-r.imin)+"）、保持に要る "+F.cur(Ih)+"<br>";
      h+="コイルの電力 "+U.sig(Pc*1e3,3)+" mW（100 % のまま "+U.sig(Pfull*1e3,3)+" mW の "+Math.round(Pc/Pfull*100)+" %）、電源の電流の平均 "+F.cur(r.isup)+"・電源から見た電力 "+U.sig(Ps*1e3,3)+" mW<br>";
      h+="式で求めた保持の電流の平均 (D V − (1 − D) V_F) ÷ R = "+F.cur(Math.max(0,(D*V-(1-D)*VF)/c.R))+"、保持に要る電流を流す D = (R I_h + V_F) ÷ (V + V_F) = "+U.sig((c.R*Ih+VF)/(V+VF)*100,3)+" %";
      if(f<20000&&D<1)h+='<br><b>PWM の周波数が耳に聞こえる範囲: コイルや鉄片が鳴ることがある</b>';
      ro.innerHTML=h+'<div class="wnote">フライバックダイオードの電圧は 0.8 V で一定とした。インダクタンスは鉄片の位置で変わるが、一定とした。吸引と保持に要る電流、動作時間（10 ms）はリレーやソレノイドによる例の値。帯は PWM の 1 周期ごとの電流の幅。</div>';
    }
    draw();
  };

  /* ---- 6 節: ランプのソフトスタート ---- */
  /* 電池（3.0 V・Rin）と大容量コンデンサ Cb の電源で、ランプ（冷えて 0.56 Ω、点いて 5.6 Ω。温度は一次遅れ 30 ms）を PWM で入れる。
     デューティは 6 節の soft_tick と同じく 1 ms ごとに上げる（PWM_TOP = 1000、端数を持ち越す）。
     スイッチの状態が変わらない区間では、電源の電圧は指数関数で動くので、その式で進める（区間は 2 µs 以下に分ける）。
     返り値の out は 0.1 ms ごとの [時刻, 電池の電流の平均, 電源の電圧の最低, デューティ]。 */
  function _w12_lamp(Rin,Cb,ramp,f,vlow,tend){
    var E=3.0,RSW=0.05,RH=5.6,RC=0.56,PR=1.4,TT=0.03,T=1/f,rec=1e-4;
    var v=E,th=0,duty=0,acc=0,t=0,nt=0,nr=rec,ia=0,ta=0,vmn=E,out=[],ibm=0,vmin=E,ilm=0,tdone=-1;
    function step(dt,on){
      var R=RC+(RH-RC)*th,g=1/Rin+(on?1/(R+RSW):0),vinf=E/Rin/g,v0=v;
      v=vinf+(v0-vinf)*Math.exp(-dt*g/Cb);
      var i0=on?v0/(R+RSW):0,i1=on?v/(R+RSW):0;
      if(i0>ilm)ilm=i0;
      th+=((on?(i0*i0+i1*i1)/2*R:0)/PR-th)*dt/TT;
      var ib=(E-v)/Rin;if(ib>ibm)ibm=ib;if(v<vmin)vmin=v;if(v<vmn)vmn=v;
      ia+=((E-v0)/Rin+ib)/2*dt;ta+=dt;t+=dt;
      if(t>=nr-1e-12){out.push([nr,ia/ta,vmn,duty/1000]);ia=0;ta=0;vmn=v;nr+=rec;}
    }
    function run(dt,on){while(dt>1e-12){var d=Math.min(dt,2e-6,Math.max(nr-t,1e-9));step(d,on);dt-=d;}}
    while(t<tend-1e-9){
      if(t>=nt-1e-12){nt+=1e-3;
        if(ramp===0||duty>=1000){duty=1000;acc=0;}
        else if(vlow===null||v>=vlow){acc+=1000;duty=Math.min(1000,duty+Math.floor(acc/ramp));acc%=ramp;}
        if(duty>=1000&&tdone<0)tdone=t;}
      var D=duty/1000;
      if(D>=1||D<=0)run(Math.min(nt,tend)-t,D>=1);
      else{run(D*T,true);run((1-D)*T,false);}
    }
    return {out:out,ibm:ibm,vmin:vmin,ilm:ilm,tend:tend,tdone:tdone,ifin:out.length?out[out.length-1][1]:0};
  }
  REG.w12_soft=function(el,U){
    var S=U.S,F=U.fmt,E=3.0,RSW=0.05,RH=5.6,RCOLD=0.56,PRAT=1.4,TAUTH=0.03;
    U.head(el,"SOFT START","ランプのソフトスタート — 電池の電流と電源の電圧");
    var r1=U.ctrls(el);
    var ri=U.slider(r1,"電池の内部抵抗",{values:[0.1,0.2,0.3,0.5,0.8,1.2,2],value:0.5,fmt:function(v){return v+" Ω";},onInput:draw});
    var cb=U.slider(r1,"大容量コンデンサ",{values:[10,47,100,220,470,1000,2200],value:470,fmt:function(v){return v+" µF";},onInput:draw});
    var r2=U.ctrls(el);
    var tr=U.slider(r2,"ソフトスタートの時間",{values:[0,5,10,20,50,100,200],value:50,fmt:function(v){return v?v+" ms":"0（一気に入れる）";},onInput:draw});
    var fq=U.slider(r2,"PWM の周波数",{values:[1000,2000,5000,10000,20000,50000],value:20000,fmt:function(v){return (v/1000)+" kHz";},onInput:draw});
    var r3=U.ctrls(el);
    var vm=U.slider(r3,"マイコンが動く最低の電圧",{min:1.8,max:2.7,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var ad=U.checkbox(r3,"電源の電圧が最低 + 0.2 V より低い間は上げない（6 節のコード）",false,draw);
    var br=U.btnrow(el);
    function pre(r,c,t,f,a){ri.set(r);cb.set(c);tr.set(t);fq.set(f);vm.set(2.2);ad.set(!!a);draw();}
    U.button(br,"6 節 (a) 一気に",function(){pre(0.5,470,0,20000);});
    U.button(br,"6 節 (b) 50 ms",function(){pre(0.5,470,50,20000);});
    U.button(br,"コンデンサ 10 µF で 50 ms",function(){pre(0.5,10,50,20000);});
    U.button(br,"PWM 1 kHz で 50 ms",function(){pre(0.5,470,50,1000);});
    U.button(br,"弱った電池 1.2 Ω・電圧を見て上げる",function(){pre(1.2,470,50,20000,true);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function sim(Rin,Cb,ramp,f,vlow){
      return _w12_lamp(Rin,Cb,ramp,f,vlow,Math.max(0.1,ramp*1e-3+0.06));
    }
    function draw(){
      var Rin=ri.get(),Cb=cb.get()*1e-6,ramp=tr.get(),f=fq.get(),Vm=vm.get(),vlow=ad.get()?Vm+0.2:null;
      var r=sim(Rin,Cb,ramp,f,vlow),nar=_w12_nar(box),W=nar?400:700,o=[],tm=r.tend*1e3;
      var below=0;r.out.forEach(function(q){if(q[2]<Vm)below+=0.1;});
      var ymx=Math.max(0.8,r.ibm*1.15);
      var pi=nar?U.plot(52,30,320,110,[0,tm],[0,ymx]):U.plot(64,30,270,160,[0,tm],[0,ymx]);
      var pv=nar?U.plot(52,206,320,110,[0,tm],[1.4,3.2]):U.plot(420,30,260,160,[0,tm],[1.4,3.2]);
      var xt=U.nice(0,tm,4).filter(function(v){return v<=tm+1e-9;});
      o.push(S.T(pi.x-40,18,"電池の電流","start",10.5,"ink",true));o.push(S.T(pv.x-40,pv.y-12,"電源の電圧（マイコン）","start",10.5,"ink",true));
      o.push(pi.axes({xl:"入れてからの時間 [ms]",yl:"電流 [A]",xt:xt,yt:U.nice(0,ymx,4).filter(function(v){return v<=ymx;}),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:42}));
      o.push(pv.axes({xl:"入れてからの時間 [ms]",yl:"電圧 [V]",xt:xt,yt:[1.4,1.8,2.2,2.6,3.0],xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:42}));
      o.push(pi.line(r.out.map(function(q){return [q[0]*1e3,q[3]*ymx];}),"faint",1.1,"3 3"));
      o.push(pi.line([[0,0]].concat(r.out.map(function(q){return [q[0]*1e3,q[1]];})),"gold",2));
      o.push(pv.line([[0,E]].concat(r.out.map(function(q){return [q[0]*1e3,Math.max(1.4,q[2])];})),"signal",2));
      o.push(pv.line([[0,Vm],[tm,Vm]],"alias",1.2,"5 3"));o.push(S.T(pv.x+pv.w-2,pv.Y(Vm)+13,"最低 "+Vm.toFixed(2)+" V","end",9,"alias",false,false,null,true));
      o.push(S.T(pi.x+pi.w-2,pi.y+12,"破線: デューティ（上端で 100 %）","end",9,"muted",false,false,null,true));
      box.set(S.svg(W,nar?352:242,o));
      var reset=r.vmin<Vm;
      var h=(reset?'<span class="warn">電源の電圧が '+_w12_v(r.vmin)+' まで下がり、最低の電圧を約 '+U.sig(below,2)+' ms 下回る: マイコンはリセットされる</span>':'<span class="ok">電源の電圧の最低 '+_w12_v(r.vmin)+'（最低の電圧を下回らない）</span>')+"<br>";
      h+="電池の電流の最大 <b>"+U.sig(r.ibm,3)+" A</b>、落ち着いた後 "+U.sig(r.ifin,3)+" A ・ MOSFET に流れるパルスの最大 "+U.sig(r.ilm,3)+" A（冷えたフィラメント）<br>";
      h+="電池の内部抵抗 × 大容量コンデンサ = "+F.time(Rin*Cb)+"、PWM の周期 "+F.time(1/f)+(ramp>0?(1/f<Rin*Cb/2?" → コンデンサがパルスをならす":' → <b>周期が長く、パルスが電池にそのまま出る</b>'):"")+"<br>";
      if(ramp>0)h+="100 % に届いた時刻: "+(r.tdone>=0?F.time(r.tdone):'<span class="warn">届かない（電源の電圧が低いまま）</span>')+(ad.get()?"（電源の電圧が "+_w12_v(vlow)+" より低い間は上げない）":"");
      ro.innerHTML=h+'<div class="wnote">電池は起電力 3.0 V、ランプは 2.8 V・0.5 A（冷えているとき 0.56 Ω）、フィラメントの温度は一次遅れ（30 ms）の簡単な模型。リセットした後のことは計算に入れていない（実際には、リセットでランプが切れ、起動し直して入れるとまたリセットする、を繰り返すことがある。15 章 3 節）。値はすべて例の値。</div>';
    }
    draw();
  };
