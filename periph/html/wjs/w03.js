  /* ===== 03 章 電池を知る ===== */
  /* 電池の模型（1 セルあたり。代表的な形と例の値。fig/f03.py と同じ値）
     Qn: 公称容量 [mAh]、E: 休んでいるときの電圧の点 [x, V]（x は公称容量に対する放電の割合）、
     R: 25 °C の内部抵抗 R0 + R1 の点 [x, Ω]、k10: 10 °C 下がるごとの倍率、tau: R1 と C1 の時定数 [s]、
     sd: 1 年に減る割合（20 °C）、vend: メーカの終止電圧 [V]、N: 例の本数、T: 放電してよい温度、ic: 流し続ける電流の目安の上限 [A] */
  var _w03_B={
    alk:{nm:"アルカリ乾電池（単 3 形）",sh:"アルカリ",Qn:2000,c:"gold",
      E:[[0,1.58],[0.03,1.48],[0.2,1.36],[0.4,1.27],[0.6,1.19],[0.75,1.12],[0.85,1.06],[0.93,1.00],[0.97,0.95],[1.0,0.90]],
      R:[[0,0.15],[0.3,0.19],[0.5,0.26],[0.7,0.37],[0.85,0.48],[1.0,0.60]],k10:1.5,tau:0.010,sd:0.02,vend:0.9,N:2,T:[-20,50],ic:1.0},
    cr:{nm:"コイン形リチウム電池（CR2032）",sh:"CR2032",Qn:220,c:"signal",
      E:[[0,3.20],[0.02,3.05],[0.1,3.00],[0.3,2.96],[0.5,2.92],[0.7,2.87],[0.8,2.82],[0.88,2.74],[0.93,2.60],[0.97,2.40],[1.0,2.00]],
      R:[[0,15],[0.5,17],[0.7,20],[0.8,25],[0.9,40],[0.95,60],[1.0,120]],k10:1.4,tau:0.005,sd:0.01,vend:2.0,N:1,T:[-20,60],ic:0.003},
    soc:{nm:"塩化チオニルリチウム電池（単 3 形の大きさ）",sh:"塩化チオニルリチウム",Qn:2400,c:"purple",
      E:[[0,3.66],[0.02,3.62],[0.3,3.60],[0.6,3.58],[0.85,3.54],[0.92,3.48],[0.96,3.35],[0.985,3.00],[1.0,2.00]],
      R:[[0,4.0],[0.5,4.5],[0.8,6.0],[0.9,9.0],[0.96,15.0],[1.0,40.0]],k10:1.3,tau:0.010,sd:0.01,vend:2.0,N:1,T:[-55,85],ic:0.1},
    nimh:{nm:"ニッケル水素電池（単 3 形）",sh:"ニッケル水素",Qn:2000,c:"teal",
      E:[[0,1.40],[0.03,1.30],[0.15,1.26],[0.5,1.22],[0.75,1.19],[0.88,1.15],[0.95,1.10],[0.98,1.05],[1.0,1.00]],
      R:[[0,0.04],[0.5,0.045],[0.8,0.055],[0.9,0.07],[1.0,0.12]],k10:1.4,tau:0.010,sd:0.20,vend:1.0,N:3,T:[-20,50],ic:2.0},
    li:{nm:"リチウムイオン電池（1000 mAh）",sh:"リチウムイオン",Qn:1000,c:"green",
      E:[[0,4.18],[0.05,4.08],[0.15,3.98],[0.3,3.87],[0.5,3.76],[0.65,3.70],[0.8,3.60],[0.88,3.50],[0.93,3.38],[0.97,3.20],[1.0,3.00]],
      R:[[0,0.12],[0.5,0.12],[0.8,0.14],[0.9,0.17],[1.0,0.25]],k10:1.4,tau:0.010,sd:0.24,vend:3.0,N:1,T:[-20,60],ic:1.0}};
  var _w03_KEYS=["alk","cr","soc","nimh","li"],_w03_R0F=0.55;
  function _w03_ip(p,x){if(x<=p[0][0])return p[0][1];for(var i=1;i<p.length;i++)if(x<=p[i][0])return p[i-1][1]+(p[i][1]-p[i-1][1])*(x-p[i-1][0])/(p[i][0]-p[i-1][0]);return p[p.length-1][1];}
  function _w03_E(t,x){return _w03_ip(_w03_B[t].E,x);}
  function _w03_kT(t,T){return Math.pow(_w03_B[t].k10,(25-T)/10);}
  function _w03_R(t,x,T){return _w03_ip(_w03_B[t].R,x)*_w03_kT(t,T);}
  function _w03_reff(t,x,T,tp){return _w03_R(t,x,T)*(_w03_R0F+(1-_w03_R0F)*(1-Math.exp(-tp/_w03_B[t].tau)));}
  /* f(x) は x とともに減る。0 になる x（f(0) <= 0 なら 0、f(1) > 0 なら 1） */
  function _w03_cross(f){if(f(0)<=0)return 0;if(f(1)>0)return 1;var lo=0,hi=1;for(var i=0;i<50;i++){var m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}
  function _w03_pct(u){return (Math.round(u*1000)/10).toString()+" %";}
  function _w03_V(v,d){return v.toFixed(d==null?2:d)+" V";}

  /* ---- 3 節: 放電曲線と実効容量 ---- */
  REG.w03_discharge=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"DISCHARGE","放電曲線と実効容量 — 終止電圧・電流・温度");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",_w03_KEYS.map(function(k){return {v:k,t:_w03_B[k].nm};}),"alk",function(){Nn.set(_w03_B[bt.get()].N);draw();});
    var Nn=U.slider(r1,"直列の本数 N",{min:1,max:4,step:1,value:2,fmt:function(v){return v+" 本";},onInput:draw});
    var r2=U.ctrls(el);
    var Ic=U.slider(r2,"流し続ける電流 I",{min:0.01,max:3000,value:200,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Tc=U.slider(r2,"温度",{min:-40,max:60,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var r3=U.ctrls(el);
    var Vn=U.slider(r3,"機器が動く最低の電圧 V_need",{min:0.8,max:4.2,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var ldo=U.checkbox(r3,"LDO を通す",false,draw);
    var Vd=U.slider(r3,"ドロップアウト電圧 V_do",{min:0.05,max:0.5,step:0.05,value:0.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(k,n,i,T,vn,l){bt.set(k);Nn.set(n);Ic.set(i);Tc.set(T);Vn.set(vn);ldo.set(l);Vd.set(0.2);draw();}
    U.button(br,"2 節: アルカリ 3 本・LDO で 3.3 V",function(){preset("alk",3,0.01,25,3.3,true);});
    U.button(br,"2 節: CR2032 に直接・2.2 V",function(){preset("cr",1,0.01,25,2.2,false);});
    U.button(br,"3 節: アルカリ 1 本・1 A",function(){preset("alk",1,1000,25,0.9,false);});
    U.button(br,"3 節: アルカリ 1 本・200 mA・−20 °C",function(){preset("alk",1,200,-20,0.9,false);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var t=bt.get(),B=_w03_B[t],N=Nn.get(),I=Ic.get()*1e-3,T=Tc.get(),vn=Vn.get(),vdo=ldo.get()?Vd.get():0;
      Vd.el.style.display=ldo.get()?"":"none";
      var vNeed=vn+vdo,vCell=N*B.vend,vEnd=Math.max(vNeed,vCell),ve1=vEnd/N;
      var u0=_w03_cross(function(x){return _w03_E(t,x)-ve1;});
      var u=_w03_cross(function(x){return _w03_E(t,x)-I*_w03_R(t,x,T)-ve1;});
      var Qn=B.Qn,vmax=N*_w03_E(t,0),vlo=Math.min(vEnd,N*(_w03_E(t,1)-I*_w03_R(t,1,T)));
      var y0=Math.max(0,Math.floor((Math.min(vlo,vEnd)-0.15*N)*10)/10),y1=Math.ceil((vmax+0.05*N)*10)/10;
      var W=700,o=[],p=U.plot(80,22,470,230,[0,Qn],[y0,y1]);
      o.push(p.axes({xl:"取り出した電荷 [mAh]",yl:"電池全体の端子電圧 [V]",xt:U.nice(0,Qn,5),yt:U.nice(y0,y1,5),xfmt:function(v){return String(Math.round(v));},yfmt:function(v){return v.toFixed(1);}}));
      var ref=[],cur=[];
      for(var k=0;k<=200;k++){var x=k/200;ref.push([x*Qn,N*_w03_E(t,x)]);var v=N*(_w03_E(t,x)-I*_w03_R(t,x,T));if(x<=u+1e-9&&v>=y0)cur.push([x*Qn,v]);}
      if(u>0)cur.push([u*Qn,vEnd]);
      o.push(p.line(ref,"muted",1.3,"3 3"));
      if(cur.length>1)o.push(p.line(cur,B.c,2.4));
      if(u>0)o.push(S.RECT(p.X(0),p.Y(y0)-7,p.X(u*Qn)-p.X(0),7,1,U.soft(B.c),B.c,1));
      o.push(p.line([[0,vEnd],[Qn,vEnd]],"alias",1.4,"6 4"));
      o.push(S.T(p.X(Qn)-4,p.Y(vEnd)-6,"終止電圧 "+vEnd.toFixed(2)+" V","end",10,"alias",true,false,null,true));
      if(u>0)o.push(S.D(p.X(u*Qn),p.Y(vEnd),B.c,5));
      o.push(S.T(p.X(Qn*0.02),p.Y(y1)+14,"点線: 小さな電流・25 °C","start",9.5,"muted",false,false,null,true));
      /* 右: 割合の棒 */
      var bx=580,bw=100;
      o.push(S.T(bx,34,"実効容量","start",10.5,"ink",true));
      [[u0,"小さな電流・25 °C","muted"],[u,"この電流・温度",B.c]].forEach(function(r,i){var y=50+i*58;
        o.push(S.T(bx,y+10,r[1],"start",9.5,"muted"));
        o.push(S.RECT(bx,y+16,bw,14,2,"none","muted",1,"3 3"));
        o.push(S.RECT(bx,y+16,bw*r[0],14,2,U.soft(r[2]),r[2],1.2));
        o.push(S.T(bx,y+46,Math.round(r[0]*Qn)+" mAh（"+_w03_pct(r[0])+"）","start",10,r[2],true));});
      box.set(S.svg(W,300,o));
      var warn="";
      if(T<B.T[0]||T>B.T[1])warn+='<span class="warn">'+String(T).replace("-","−")+' °C は、この種類の放電してよい温度の範囲（代表値 '+String(B.T[0]).replace("-","−")+'〜'+B.T[1]+' °C）の外である。</span><br>';
      if(I>B.ic)warn+='<span class="warn">'+F.cur(I)+' は、この種類が流し続けられる電流の目安（代表値 '+F.cur(B.ic)+' 程度）を超える。仕様書で確かめる。</span><br>';
      if(u===0)warn+='<span class="warn">流し始めから端子電圧が終止電圧を下回り、使える電荷は 0 である。</span><br>';
      var tl=u>0?u*Qn*1e-3/I*3600:0;
      ro.innerHTML=warn+"C レート = I ÷ 公称容量 = "+F.cur(I)+" ÷ "+Qn+" mAh = <b>"+U.sig(I*1e3/Qn,3)+"C</b><br>"+
        "終止電圧 V_end = max(V_need + V_do, N V_cell) = max("+vNeed.toFixed(2)+", "+N+" × "+B.vend.toFixed(1)+") = <b>"+vEnd.toFixed(2)+" V</b>（1 本あたり "+ve1.toFixed(3)+" V）<br>"+
        "実効容量 = <b>"+Math.round(u*Qn)+" mAh</b>（公称容量の "+_w03_pct(u)+"）。小さな電流・25 °C なら "+Math.round(u0*Qn)+" mAh（"+_w03_pct(u0)+"）<br>"+
        "内部抵抗（1 本、新しいとき → 終わり）: "+U.sig(_w03_R(t,0,T),3)+" Ω → "+U.sig(_w03_R(t,1,T),3)+" Ω（25 °C の "+U.sig(_w03_kT(t,T),3)+" 倍）<br>"+
        "この電流で使い切るまで: 実効容量 ÷ I = "+(u>0?"<b>"+F.time(tl)+"</b>":"—")+
        '<div class="wnote">模型は、代表的な形の放電曲線と、内部抵抗（10 °C 下がるごとに '+B.k10+' 倍とした）だけを入れたもの。実際の電池は、大きな電流と低温で、これよりさらに減ることがある。値はすべて例で、設計にはデータシートの放電曲線を使う。</div>';
    }
    draw();
  };

  /* ---- 4 節: パルスの電圧降下と BOR ---- */
  REG.w03_pulse=function(el,U){
    var S=U.S,F=U.fmt;
    var PT=[{v:"cr",t:"CR2032 1 個"},{v:"soc",t:"塩化チオニルリチウム電池 1 本"},{v:"alk",t:"アルカリ乾電池 2 本"},{v:"li",t:"リチウムイオン電池 1 本"}];
    var NB={cr:1,soc:1,alk:2,li:1};
    U.head(el,"PULSE","パルスの電圧降下と BOR — 放電の進み具合と温度");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",PT,"cr",draw);
    var Bor=U.slider(r1,"BOR のしきい値",{min:1.6,max:3.6,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var r2=U.ctrls(el);
    var Ip=U.slider(r2,"パルスの電流 I_pk",{min:1,max:1000,value:15,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Tp=U.slider(r2,"パルスの長さ t_p",{min:0.1,max:100,value:3,log:true,fmt:function(v){return F.time(v*1e-3);},onInput:draw});
    var r3=U.ctrls(el);
    var Xd=U.slider(r3,"放電の進み具合",{min:0,max:100,step:1,value:50,fmt:function(v){return v+" %";},onInput:draw});
    var Tc=U.slider(r3,"温度",{min:-40,max:60,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var br=U.btnrow(el);
    function preset(k,i,tp,x,T,b){bt.set(k);Ip.set(i);Tp.set(tp);Xd.set(x);Tc.set(T);Bor.set(b);draw();}
    U.button(br,"4 節の例（CR2032・15 mA・3 ms）",function(){preset("cr",15,3,50,25,2.2);});
    U.button(br,"順に動かす（10 mA）",function(){Ip.set(10);draw();});
    U.button(br,"−20 °C にする",function(){Tc.set(-20);draw();});
    U.button(br,"放電の 9 割",function(){Xd.set(90);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var t=bt.get(),B=_w03_B[t],N=NB[t],I=Ip.get()*1e-3,tp=Tp.get()*1e-3,x=Xd.get()/100,T=Tc.get(),vb=Bor.get();
      var Rt=N*_w03_R(t,x,T),R0=_w03_R0F*Rt,R1=Rt-R0,tau=B.tau,E=N*_w03_E(t,x);
      var Reff=R0+R1*(1-Math.exp(-tp/tau)),dV=I*Reff,vbot=E-dV;
      var W=700,o=[];
      /* 上: 1 回のパルスの波形 */
      var span=tp+4*tau,t0=-0.2*span,X0=80,WD=450,sc=WD/(span-t0),X=function(s){return X0+(s-t0)*sc;};
      var yI=24,hI=34,yV=86,hV=120;
      var vlo=Math.min(vbot,vb)-0.1*Math.max(0.2,E-Math.min(vbot,vb)),vhi=E+0.08*Math.max(0.2,E-Math.min(vbot,vb));
      var Y=function(v){return yV+hV-(v-vlo)/(vhi-vlo)*hV;};
      o.push(S.T(X0-8,yI+hI/2+4,"電流","end",9.5,"muted"));
      o.push(S.W([X(t0),yI+hI,X(0),yI+hI,X(0),yI,X(tp),yI,X(tp),yI+hI,X(span),yI+hI],"gold",2));
      o.push(S.T(X(tp)+6,yI+12,F.cur(I),"start",9.5,"gold",true));
      var pts=[[X(t0),Y(E)],[X(0),Y(E)],[X(0),Y(E-I*R0)]];
      for(var k=1;k<=60;k++){var s=tp*k/60;pts.push([X(s),Y(E-I*R0-I*R1*(1-Math.exp(-s/tau)))]);}
      var v1=I*R1*(1-Math.exp(-tp/tau));pts.push([X(tp),Y(E-v1)]);
      for(k=1;k<=60;k++){var s2=tp+(span-tp)*k/60;pts.push([X(s2),Y(E-v1*Math.exp(-(s2-tp)/tau))]);}
      o.push(S.L(X0,yV+hV,X0+WD,yV+hV,"muted",1));o.push(S.L(X0,yV,X0,yV+hV,"muted",1));
      U.nice(vlo,vhi,4).forEach(function(v){if(v>=vlo&&v<=vhi){o.push(S.L(X0-4,Y(v),X0,Y(v),"muted",1));o.push(S.T(X0-7,Y(v)+3.5,v.toFixed(2),"end",9,"muted"));}});
      o.push(S.T(X0-50,yV+hV/2,"端子電圧 [V]","middle",9.5,"muted",false,false,-90));
      o.push(S.L(X0,Y(vb),X0+WD,Y(vb),"alias",1.3,"6 4"));
      o.push(S.T(X0+WD-2,Y(vb)-5,"BOR "+vb.toFixed(2)+" V","end",9.5,"alias",true,false,null,true));
      o.push(S.PL(pts,vbot<vb?"alias":B.c,2));
      o.push(S.D(X(tp),Y(vbot),vbot<vb?"alias":B.c,4));
      o.push(S.T(X(tp)+6,Y(vbot)+(vbot<vb?-6:14),"底 "+vbot.toFixed(3)+" V","start",9.5,vbot<vb?"alias":B.c,true,false,null,true));
      U.nice(t0,span,5).forEach(function(s){if(s>=t0&&s<=span){o.push(S.L(X(s),yV+hV,X(s),yV+hV+4,"muted",1));o.push(S.T(X(s),yV+hV+15,U.sig(s*1e3,3),"middle",9,"muted"));}});
      o.push(S.T(X0+WD/2,yV+hV+30,"時間 [ms]（パルスの始まりを 0 とした）","middle",9.5,"muted"));
      /* 右上: 数値 */
      var xr=560;
      [["E（休んでいるとき）",E.toFixed(3)+" V"],["R₀ / R₁",U.sig(R0,3)+" / "+U.sig(R1,3)+" Ω"],["τ",F.time(tau)],["R_eff",U.sig(Reff,3)+" Ω"],["電圧降下",U.sig(dV*1e3,3)+" mV"]].forEach(function(r,i){
        o.push(S.T(xr,yV+6+i*24,r[0],"start",9.5,"muted"));o.push(S.T(xr,yV+18+i*24,r[1],"start",10,"ink",true));});
      /* 下: 放電の進み具合とパルスの底 */
      var yP=262,p=U.plot(80,yP,450,150,[0,100],[Math.max(0,N*1.4),N*_w03_E(t,0)+0.05*N]);
      var plo=p.yr[0],phi=p.yr[1];
      o.push(p.axes({xl:"放電の進み具合（公称容量の %）",yl:"端子電圧 [V]",xt:[0,25,50,75,100],yt:U.nice(plo,phi,4),xfmt:function(v){return String(v);},yfmt:function(v){return v.toFixed(1);}}));
      var pe=[],pb=[];
      for(k=0;k<=200;k++){var xx=k/200,ee=N*_w03_E(t,xx),bb=ee-I*N*_w03_reff(t,xx,T,tp);pe.push([xx*100,ee]);if(bb>=plo)pb.push([xx*100,bb]);}
      o.push(p.line(pe,"ink",1.6));
      if(pb.length>1)o.push(p.line(pb,B.c,2.2));
      if(vb>=plo&&vb<=phi){o.push(p.line([[0,vb],[100,vb]],"alias",1.3,"6 4"));}
      var ur=_w03_cross(function(z){return N*_w03_E(t,z)-vb;}),up=_w03_cross(function(z){return N*(_w03_E(t,z)-I*_w03_reff(t,z,T,tp))-vb;});
      if(up>0&&up<1&&vb>=plo)o.push(S.D(p.X(up*100),p.Y(vb),"alias",4.5));
      if(vbot>=plo)o.push(S.D(p.X(x*100),p.Y(vbot),vbot<vb?"alias":B.c,4.5));
      o.push(S.T(p.X(2),p.Y(phi)+12,"黒: 休んでいるときの電圧、色: パルスの底","start",9.5,"muted",false,false,null,true));
      o.push(S.T(560,yP+20,"パルスのある機器が","start",9.5,"muted"));
      o.push(S.T(560,yP+34,"使える割合","start",9.5,"muted"));
      o.push(S.T(560,yP+56,_w03_pct(up),"start",14,up<ur-0.05?"alias":"green",true));
      o.push(S.T(560,yP+80,"休んでいるときの電圧","start",9.5,"muted"));
      o.push(S.T(560,yP+94,"だけなら "+_w03_pct(ur),"start",9.5,"muted"));
      box.set(S.svg(W,yP+192,o));
      var warn="";
      if(T<B.T[0]||T>B.T[1])warn+='<span class="warn">'+String(T).replace("-","−")+' °C は、この種類の放電してよい温度の範囲（代表値）の外である。</span><br>';
      ro.innerHTML=warn+"R_eff = R₀ + R₁ (1 − e^(−t_p/τ)) = "+U.sig(R0,3)+" + "+U.sig(R1,3)+" × "+U.sig(1-Math.exp(-tp/tau),3)+" = <b>"+U.sig(Reff,3)+" Ω</b>（電池全体。25 °C の "+U.sig(_w03_kT(t,T),3)+" 倍）<br>"+
        "パルスの底 = E − I_pk R_eff = "+E.toFixed(3)+" V − "+F.cur(I)+" × "+U.sig(Reff,3)+" Ω = <b>"+vbot.toFixed(3)+" V</b> → "+
        (vbot<vb?'<span class="warn">BOR を割る（'+U.sig((vb-vbot)*1e3,3)+' mV 足りない）。マイコンはリセットされる</span>':'<span class="ok">BOR を割らない（余裕 '+U.sig((vbot-vb)*1e3,3)+' mV）</span>')+"<br>"+
        "パルスの底で決まる使える割合 <b>"+_w03_pct(up)+"</b>（休んでいるときの電圧だけなら "+_w03_pct(ur)+"）"+
        '<div class="wnote">内部抵抗を、すぐ現れる部分 R₀（55 %）と、時定数 τ で大きくなる部分 R₁（45 %）に分けた模型（4 節）。放電の進み具合と温度による変わり方は代表的な形、値はすべて例。パルスの前は十分に休んでいたとした。</div>';
    }
    draw();
  };

  /* ---- 5 節: 容量の内訳と電池寿命 ---- */
  REG.w03_life=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BUDGET","容量の内訳と電池寿命 — 実効容量・保管・自己放電");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",_w03_KEYS.map(function(k){return {v:k,t:_w03_B[k].nm};}),"cr",function(){var B=_w03_B[bt.get()];Qs.set(B.Qn);Sd.set(B.sd*100);draw();});
    var Qs=U.slider(r1,"公称容量",{min:50,max:5000,value:220,log:true,int:true,fmt:function(v){return v+" mAh";},onInput:draw});
    var Sd=U.slider(r1,"自己放電（20 °C、1 年）",{min:0.2,max:40,value:1,log:true,fmt:function(v){return U.sig(v,2)+" %";},onInput:draw});
    var r2=U.ctrls(el);
    var Uf=U.slider(r2,"使える割合（2〜4 節）",{min:30,max:100,step:1,value:85,fmt:function(v){return v+" %";},onInput:draw});
    var Ia=U.slider(r2,"機器の平均電流",{min:0.5,max:1000,value:2.7,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var Tm=U.slider(r3,"使う場所の平均の温度",{min:-20,max:50,step:1,value:20,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var Tw=U.slider(r3,"温度の変化の幅 ±",{min:0,max:30,step:1,value:0,fmt:function(v){return "± "+v+" °C";},onInput:draw});
    var r4=U.ctrls(el);
    var Sm=U.slider(r4,"出荷までの保管",{min:0,max:24,step:1,value:6,fmt:function(v){return v+" か月";},onInput:draw});
    var St=U.slider(r4,"保管の温度",{min:0,max:50,step:1,value:20,fmt:function(v){return v+" °C";},onInput:draw});
    var r5=U.ctrls(el);
    var On=U.checkbox(r5,"保管の間も機器の電流を流す（絶縁のシート・出荷モードなし）",false,draw);
    var Is=U.slider(r5,"保管の間の機器の電流",{min:0.1,max:100,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var br=U.btnrow(el);
    function preset(k,u,ia,tm,tw,sm,st,on){bt.set(k);var B=_w03_B[k];Qs.set(B.Qn);Sd.set(B.sd*100);Uf.set(u);Ia.set(ia);Tm.set(tm);Tw.set(tw);Sm.set(sm);St.set(st);On.set(on);Is.set(2);draw();}
    U.button(br,"5 節の例（CR2032・ドアの開閉センサ）",function(){preset("cr",85,2.7,20,0,6,20,false);});
    U.button(br,"同じ例で、保管の間も電流を流す",function(){preset("cr",85,2.7,20,0,6,20,true);});
    U.button(br,"塩化チオニルリチウム・屋外（20 ± 20 °C）",function(){preset("soc",95,10,20,20,12,30,false);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function fT(T){return Math.pow(2,(T-20)/10);}
    function draw(){
      Is.el.style.display=On.get()?"":"none";
      var Qn=Qs.get(),r20=Sd.get()/100,u=Uf.get()/100,ia=Ia.get()*1e-3,tm=Tm.get(),tw=Tw.get(),sm=Sm.get(),st=St.get(),on=On.get(),is=Is.get()*1e-3;
      var H=8760,fUse=(fT(tm+tw)+fT(tm-tw))/2,fAvg=fT(tm);
      var q1=u*Qn,lossSd=r20*fT(st)*Qn*sm/12,lossDev=on?is*H*sm/12:0,q2=Math.max(0,q1-lossSd-lossDev);
      var isd=r20*fUse*Qn/H,itot=ia+isd,life=q2/itot/H,life0=q2/ia/H,lifeAvgT=q2/(ia+r20*fAvg*Qn/H)/H;
      var W=700,o=[],x0=200,sc=420/Qn;
      o.push(S.T(14,18,"容量の内訳 [mAh]","start",10.5,"ink",true));
      var rows=[["公称容量",0,Qn,"gold",Math.round(Qn)+""],
        ["使えない分（2〜4 節）",q1,Qn,"alias","− "+U.sig(Qn-q1,3)],
        ["保管の自己放電",q1-lossSd,q1,"alias","− "+U.sig(lossSd,3)]];
      if(on)rows.push(["保管の間の機器の電流",q1-lossSd-lossDev,q1-lossSd,"alias","− "+U.sig(lossDev,3)]);
      rows.push(["使い始めに残る電荷",0,q2,"signal",U.sig(q2,4)]);
      rows.forEach(function(r,i){var y=28+i*26,a=Math.max(0,r[1]),b=Math.max(a,r[2]),wd=(b-a)*sc;
        o.push(S.T(x0-8,y+13,r[0],"end",9.5,"ink"));
        o.push(S.RECT(x0+a*sc,y+2,Math.max(0.8,wd),16,2,U.soft(r[3]),r[3],1.1));
        /* 数値: 棒が広ければ中に、右に余白があれば右に、なければ左に置く */
        var tx,anc;if(wd>70){tx=x0+a*sc+6;anc="start";}else if(x0+b*sc+60<W-10){tx=x0+b*sc+6;anc="start";}else{tx=x0+a*sc-6;anc="end";}
        o.push(S.T(tx,y+14,r[4],anc,9.5,r[3],true,false,null,true));});
      /* 残りの電荷の時間変化 */
      var yP=28+rows.length*26+26,ymax=Math.max(life,life0);
      var tmax=Math.max(1,Math.min(60,ymax*1.15)),p=U.plot(80,yP,470,150,[0,tmax],[0,Math.max(1,q2)*1.05]);
      o.push(p.axes({xl:"使い始めからの年数",yl:"残る電荷 [mAh]",xt:U.nice(0,tmax,6),yt:U.nice(0,Math.max(1,q2)*1.05,4),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);}}));
      o.push(p.line([[0,q2],[Math.min(tmax,life0),Math.max(0,q2-ia*H*Math.min(tmax,life0))]],"muted",1.4,"5 3"));
      o.push(p.line([[0,q2],[Math.min(tmax,life),Math.max(0,q2-itot*H*Math.min(tmax,life))]],"signal",2.4));
      if(life<=tmax){o.push(S.D(p.X(life),p.Y(0),"signal",5));o.push(S.T(p.X(life),p.Y(0)-10,U.sig(life,3)+" 年","middle",10,"signal",true,false,null,true));}
      if(life0<=tmax){o.push(S.D(p.X(life0),p.Y(0),"muted",4));o.push(S.T(p.X(life0)+(life0-life<tmax*0.12?8:0),p.Y(0)-24,U.sig(life0,3)+" 年","middle",9.5,"muted",false,false,null,true));}
      o.push(S.T(570,yP+20,"実線: 機器 + 自己放電","start",9.5,"signal",true));
      o.push(S.T(570,yP+36,"破線: 機器の電流だけ","start",9.5,"muted"));
      box.set(S.svg(W,yP+190,o));
      var warn=q2<=0?'<span class="warn">使い始める前に、使える電荷がなくなる。</span><br>':"";
      ro.innerHTML=warn+"使い始めに残る電荷 = 公称 "+Math.round(Qn)+" × "+Math.round(u*100)+" % − 保管の自己放電 "+U.sig(lossSd,3)+(on?" − 保管の間の機器の電流 "+U.sig(lossDev,3):"")+" = <b>"+U.sig(q2,4)+" mAh</b><br>"+
        "自己放電の倍率 = (2^((T₁ − 20)/10) + 2^((T₂ − 20)/10)) ÷ 2 = <b>"+U.sig(fUse,3)+"</b>（平均の温度 "+String(tm).replace("-","−")+" °C だけで計算すると "+U.sig(fAvg,3)+"）<br>"+
        "I_sd = r Q_n ÷ 8760 h = "+U.sig(r20*100,2)+" % × "+U.sig(fUse,3)+" × "+Math.round(Qn)+" mAh ÷ 8760 h = <b>"+F.cur(isd*1e-3)+"</b>（機器の平均電流 "+F.cur(ia*1e-3)+" の "+U.sig(isd/ia*100,3)+" %）<br>"+
        "電池寿命 = "+U.sig(q2,4)+" mAh ÷ ("+F.cur(ia*1e-3)+" + "+F.cur(isd*1e-3)+") ≈ <b>"+(q2>0?U.sig(life,3)+" 年":"—")+"</b>（自己放電を入れないと "+U.sig(life0,3)+" 年、平均の温度だけで計算すると "+U.sig(lifeAvgT,3)+" 年）"+
        '<div class="wnote">自己放電は、公称容量に対して 1 年に決まった割合が減るとし、温度が 10 °C 上がるごとに 2 倍とする目安で温度を入れた（使う場所の温度は、半分の時間が T₁ = 平均 + 幅、残りが T₂ = 平均 − 幅とした）。値はすべて例。</div>';
    }
    draw();
  };
