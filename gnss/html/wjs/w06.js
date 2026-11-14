  /* ===== 06 章 位置を解く ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w06_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w06_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた数（−3 959 694.8 など） */
  function _w06_g(v,d){var s=_w06_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  /* 長さ [m] を読みやすい単位で */
  function _w06_len(m){var a=Math.abs(m);if(!isFinite(a))return "∞";if(a>=1e5)return _w06_g(m/1e3,1)+" km";if(a>=1e3)return _w06_f(m/1e3,2)+" km";if(a>=1)return _w06_f(m,2)+" m";
    if(a>=1e-3)return _w06_f(m*1e3,2)+" mm";if(a>=1e-6)return _w06_f(m*1e6,2)+" μm";return "1 μm 未満";}
  var _W06_C=299792458,_W06_D=Math.PI/180,_W06_WE=7.2921151467e-5,_W06_LAM=299792458/1575.42e6,_W06_GEO=null;
  var _W06_N4=["G9","G6","G2","G3"],_W06_CL4=["G6","G13","G3","G9"];
  /* 東京から時刻 t に見える GPS の衛星（仰角の高い順）。enu は視線の単位ベクトルの東・北・上の成分、l は ECEF の成分 */
  function _w06_sky(U,t){var rx=U.gnss.rx(35.681,139.767,40),out=[];
    U.gnss.constellation().forEach(function(s){if(s.sys!=="GPS")return;var p=U.gnss.ecef(s,t),ea=U.gnss.elaz(rx,p);
      if(ea[0]>0)out.push({nm:s.nm,s:s,p:p,el:ea[0],az:ea[1],d:ea[2],enu:[ea[3]/ea[2],ea[4]/ea[2],ea[5]/ea[2]],l:[(p[0]-rx.r0[0])/ea[2],(p[1]-rx.r0[1])/ea[2],(p[2]-rx.r0[2])/ea[2]]});});
    out.sort(function(a,b){return b.el-a.el;});return {rx:rx,sats:out};}
  function _w06_geo(U){if(!_W06_GEO)_W06_GEO=_w06_sky(U,0);return _W06_GEO;}
  /* 東京の ENU の行列（行が東・北・上） */
  function _w06_renu(B,L){B*=_W06_D;L*=_W06_D;return [[-Math.sin(L),Math.cos(L),0],[-Math.sin(B)*Math.cos(L),-Math.sin(B)*Math.sin(L),Math.cos(B)],[Math.cos(B)*Math.cos(L),Math.cos(B)*Math.sin(L),Math.sin(B)]];}
  /* 重み付き最小二乗の行列 A = (GᵀWG)⁻¹GᵀW（n×m）。G は m 行 n 列、w は重み。解けないとき（並びが悪いとき）は null */
  function _w06_lsA(U,G,w){var m=G.length,n=G[0].length,M=U.ctl.mat,N=M.zeros(n,n),Gt=M.zeros(n,m),i,j,k;
    for(i=0;i<m;i++)for(j=0;j<n;j++)Gt[j][i]=G[i][j]*w[i];
    for(j=0;j<n;j++)for(k=0;k<n;k++){var sm=0;for(i=0;i<m;i++)sm+=Gt[j][i]*G[i][k];N[j][k]=sm;}
    var A;try{A=M.solve(N,Gt);}catch(e){return null;}
    for(j=0;j<n;j++)for(i=0;i<m;i++)if(!isFinite(A[j][i])||Math.abs(A[j][i])>1e6)return null;
    return A;}
  /* A と誤差の標準偏差から、回数を十分に増やしたときの解の誤差の RMS [水平, 上下]（A の行は東・北・上・時計） */
  function _w06_th(A,sig){var q=[0,0,0];for(var r=0;r<3;r++){var sm=0;for(var i=0;i<sig.length;i++)sm+=A[r][i]*A[r][i]*sig[i]*sig[i];q[r]=sm;}return [Math.sqrt(q[0]+q[1]),Math.sqrt(q[2])];}
  /* 衛星の印（図と同じ見た目） */
  function _w06_sat(U,x,y,c,s){var S=U.S;s=s||1;return S.L(x-9*s,y,x+9*s,y,c,1.1)+S.RECT(x-14*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x+7.5*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x-3.6*s,y-3.6*s,7.2*s,7.2*s,1.5,c,c,1);}
  function _w06_rxm(U,x,y,c){var S=U.S;c=c||"green";return S.L(x-6,y+6,x+6,y+6,c,1.6)+S.L(x,y+6,x,y,c,1.4)+S.D(x,y-1,c,3.4);}
  /* 10 のべきの目盛の文字 */
  function _w06_pow(v){var e=Math.round(Math.log10(v));if(e===0)return "1";var sup={"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻"};return "10"+String(e).split("").map(function(c){return sup[c];}).join("");}

  /* ---- 3 節: 衛星の数・並び・重みで変わる解の散らばり（スカイプロット ↔ 散らばり） ---- */
  REG.w06_ls=function(el,U){
    var S=U.S,GE=_w06_geo(U),SATS=GE.sats;
    U.head(el,"LEAST SQUARES","衛星の数・並び・重みで変わる解の散らばり");
    var r1=U.ctrls(el);
    var pre=U.select(r1,"使う衛星",["1 章の 4 つ（G9・G6・G2・G3）","見えている 8 つ","偏った 4 つ（G6・G13・G3・G9）","自分で選ぶ（スカイプロットの点を押す）"],0,function(){setPre();draw();});
    var mdl=U.select(r1,"擬似距離の誤差",["どの衛星も同じ σ","仰角で変える σ₀/sin θ"],0,function(){draw();});
    var r2=U.ctrls(el);
    var sg=U.slider(r2,"σ（仰角で変えるときは真上の値 σ₀）",{values:[0.5,1,2,5],value:1,fmt:function(v){return v+" m";},onInput:function(){draw();}});
    var nt=U.slider(r2,"解く回数",{values:[200,1000,5000],value:1000,fmt:function(v){return v+" 回";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cU=U.checkbox(r3,"重みなしの解（赤）",true,function(){draw();}),cW=U.checkbox(r3,"重み 1/σ² の解（緑）",true,function(){draw();});
    var br=U.btnrow(el),use={},seed=1,SK=null;
    U.button(br,"本文の例（1 章の 4 つ・同じ 1 m）",function(){pre.set(0);mdl.set(0);sg.set(1);nt.set(1000);cU.set(true);cW.set(true);seed=1;setPre();draw();});
    U.button(br,"重みの例（8 つ・仰角で変える）",function(){pre.set(1);mdl.set(1);sg.set(1);nt.set(1000);cU.set(true);cW.set(true);seed=1;setPre();draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function setPre(){var k=pre.get();if(k===3)return;var L=k===0?_W06_N4:(k===2?_W06_CL4:SATS.map(function(q){return q.nm;}));use={};L.forEach(function(n){use[n]=true;});}
    setPre();
    U.ctl.drag(box,function(type,x,y){if(type!=="down"||!SK)return false;var best=null,bd=18;
      SK.forEach(function(q){var d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=q.nm;}});
      if(best){use[best]=!use[best];pre.set(3);draw();}return false;});
    function nice(v){var c=[2,5,10,25,50,100,250,500,1000];for(var i=0;i<c.length;i++)if(c[i]>=v)return c[i];return 1000;}
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],act=SATS.filter(function(q){return use[q.nm];}),m=act.length,s0=sg.get(),elm=mdl.get()===1;
      var sig=act.map(function(q){return elm?s0/Math.sin(q.el*_W06_D):s0;});
      var G=act.map(function(q){return [-q.enu[0],-q.enu[1],-q.enu[2],1];});
      var Au=m>=4?_w06_lsA(U,G,act.map(function(){return 1;})):null,Aw=m>=4?_w06_lsA(U,G,sig.map(function(s){return 1/(s*s);})):null;
      /* ---- スカイプロット（押して切り替える） ---- */
      var cx=nar?200:128,cy=nar?140:150,R=nar?100:102;
      o.push(S.T(nar?10:14,18,"空の衛星（押すと使う・使わないが切り替わる）","start",10.5,"ink",true));
      var pts=SATS.map(function(q){return {el:q.el,az:q.az,name:q.nm,col:use[q.nm]?"purple":"faint",hl:!!use[q.nm]};});
      o.push(U.gnss.sky(U,cx,cy,R,pts,{dot:4.6}));
      SK=SATS.map(function(q){var p=U.gnss.skyxy(cx,cy,R,q.el,q.az);return {x:p[0],y:p[1],nm:q.nm};});
      o.push(S.T(cx,cy+R+34,"使う衛星: "+m+" 個","middle",10,m>=4?"purple":"alias",true));
      /* ---- 散らばり ---- */
      var rng=U.rng(seed*7919+17),N=nt.get(),su=[0,0],sw=[0,0],PU=[],PW=[];
      var thU=Au?_w06_th(Au,sig):null,thW=Aw?_w06_th(Aw,sig):null;
      if(Au&&Aw){for(var t=0;t<N;t++){var e=sig.map(function(s){return s*rng.normal();});
        var xu=[0,0,0],xw=[0,0,0];for(var r=0;r<3;r++){var a=0,b=0;for(var i=0;i<m;i++){a+=Au[r][i]*e[i];b+=Aw[r][i]*e[i];}xu[r]=a;xw[r]=b;}
        su[0]+=xu[0]*xu[0]+xu[1]*xu[1];su[1]+=xu[2]*xu[2];sw[0]+=xw[0]*xw[0]+xw[1]*xw[1];sw[1]+=xw[2]*xw[2];
        if(t<400){PU.push(xu);PW.push(xw);}}}
      var rU=[Math.sqrt(su[0]/N),Math.sqrt(su[1]/N)],rW=[Math.sqrt(sw[0]/N),Math.sqrt(sw[1]/N)];
      var px=nar?52:282,py=nar?300:38,pw=nar?230:220;
      var hmax=0,vmax=0;if(thU&&cU.get()){hmax=Math.max(hmax,thU[0]);vmax=Math.max(vmax,thU[1]);}if(thW&&cW.get()){hmax=Math.max(hmax,thW[0]);vmax=Math.max(vmax,thW[1]);}
      var lim=nice(Math.max(2,2.6*hmax)),limv=nice(Math.max(2,2.6*vmax));
      o.push(S.T(px,py-12,"東西と南北の誤差 [m]（点は 400 回分）","start",10,"ink",true));
      var P=U.plot(px,py,pw,pw,[-lim,lim],[-lim,lim]);
      o.push(S.RECT(px,py,pw,pw,3,"var(--screen)","line",1));
      o.push(P.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9}));
      if(Au&&Aw){
        if(cU.get())PU.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"alias",1.4));});
        if(cW.get())PW.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"green",1.4));});
      }else o.push(S.T(px+pw/2,py+pw/2,m<4?"衛星が 4 つより少ないので解けない":"この並びでは解けない（G に逆行列が無い）","middle",10,"alias",true,false,null,true));
      o.push(S.L(P.X(0)-6,P.Y(0),P.X(0)+6,P.Y(0),"ink",2));o.push(S.L(P.X(0),P.Y(0)-6,P.X(0),P.Y(0)+6,"ink",2));
      o.push(S.T(px+pw/2,py+pw+30,"十字: 本当の位置","middle",9,"muted"));
      /* 上下の誤差（縦の帯） */
      var vx=px+pw+(nar?24:38),vw=nar?70:90,Q=U.plot(vx,py,vw,pw,[0,1],[-limv,limv]);
      o.push(S.T(vx+vw/2,py-12,"上下 [m]","middle",10,"ink",true));
      o.push(S.RECT(vx,py,vw,pw,3,"var(--screen)","line",1));
      [-limv,-limv/2,0,limv/2,limv].forEach(function(v){o.push(S.L(vx,Q.Y(v),vx+vw,Q.Y(v),"grid",1));o.push(S.T(vx+vw+4,Q.Y(v)+3,_w06_f(v,v%1?1:0),"start",8.5,"muted"));});
      if(Au&&Aw){var jr=U.rng(seed+99);
        if(cU.get())PU.forEach(function(q){if(Math.abs(q[2])<limv)o.push(S.D(vx+vw*(0.08+0.36*jr.next()),Q.Y(q[2]),"alias",1.3));});
        if(cW.get())PW.forEach(function(q){if(Math.abs(q[2])<limv)o.push(S.D(vx+vw*(0.56+0.36*jr.next()),Q.Y(q[2]),"green",1.3));});}
      o.push(S.L(vx,Q.Y(0),vx+vw,Q.Y(0),"ink",1.4));
      var Hh=nar?py+pw+46:Math.max(cy+R+46,py+pw+40);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し ---- */
      var h="使う衛星: "+(m?act.map(function(q){return q.nm;}).join("・"):"なし")+"（"+m+" 個）<br>";
      if(Au&&Aw){
        var rows=[];
        if(cU.get())rows.push(['<span style="color:'+U.col("alias")+'"><b>重みなし</b></span>',_w06_f(rU[0],2)+" m",_w06_f(rU[1],2)+" m","<b>"+_w06_f(thU[0],2)+" m・"+_w06_f(thU[1],2)+" m</b>"]);
        if(cW.get())rows.push(['<span style="color:'+U.col("green")+'"><b>重み 1/σ²</b></span>',_w06_f(rW[0],2)+" m",_w06_f(rW[1],2)+" m","<b>"+_w06_f(thW[0],2)+" m・"+_w06_f(thW[1],2)+" m</b>"]);
        h+=U.tbl(["解","水平の RMS（"+N+" 回）","上下の RMS（"+N+" 回）","回数を十分に増やしたとき（水平・上下）"],rows,["left","right","right","right"]);
        h+="誤差の標準偏差 σ: "+act.map(function(q,i){return q.nm+" "+_w06_f(sig[i],2)+" m";}).join("、");
        if(m===4)h+='<br>衛星が 4 つのときは、重みを変えても解は同じ（4 つの式をちょうど満たす解が 1 つだけある）。';
      }else h+='<span class="warn">'+(m<4?"衛星を 4 つ以上選ぶと解ける。":"選んだ衛星の並びでは、G に逆行列が無く解けない。")+'</span>';
      ro.innerHTML=h+'<div class="wnote">解は、本当の位置のまわりで線形化した式を最小二乗法で解いたもの（4 節の繰り返しの最後の 1 回と同じ）。誤差は正規分布にしたがい、衛星どうしで独立とした。「回数を十分に増やしたとき」の値は、誤差の分散から計算した値（計算の方法は 7 章）。衛星の配置は 1 章の近似の配置の時刻 0。</div>';
    }
    draw();
  };

  /* ---- 4 節: ガウス・ニュートン法を 1 回ずつ進める（平面の例と東京の例） ---- */
  var _W06_PS=[[-12,9],[5,12],[15,8]],_W06_PB=3.0;
  function _w06_rotz(p,th){return [p[0]*Math.cos(th)+p[1]*Math.sin(th),-p[0]*Math.sin(th)+p[1]*Math.cos(th),p[2]];}
  REG.w06_solve=function(el,U){
    var S=U.S,GE=_w06_geo(U),RX=GE.rx.r0,BT=_W06_C*1e-3,UH=[Math.cos(139.767*_W06_D),Math.sin(139.767*_W06_D),0];
    U.head(el,"GAUSS–NEWTON","仮の値から 1 回ずつ進めるガウス・ニュートン法");
    var r1=U.ctrls(el);
    var md=U.select(r1,"例",["平面の例（1 章の 3 つの点。未知数 x・y・b）","東京の例（3 次元。未知数 x・y・z・b）"],0,function(){showCtl();reset();draw();});
    var ns=U.select(r1,"衛星（東京の例）",["1 章の 4 つ","見えている 8 つ"],0,function(){reset();draw();});
    var rot=U.select(r1,"地球の自転（東京の例）",["考えない（本文の図と同じ）","擬似距離に含め、直す","擬似距離に含め、直さない"],0,function(){reset();draw();});
    var r2=U.ctrls(el);
    var pX=U.slider(r2,"初めの位置 x",{min:-20,max:20,step:0.5,value:-8,fmt:function(v){return _w06_f(v,1)+" km";},onInput:function(){reset();draw();}});
    var pY=U.slider(r2,"初めの位置 y",{min:-10,max:24,step:0.5,value:-6,fmt:function(v){return _w06_f(v,1)+" km";},onInput:function(){reset();draw();}});
    var eS=U.slider(r2,"初めの位置（東京の経度の向き）",{min:-32000,max:32000,step:500,value:0,fmt:function(v){return _w06_g(v,0)+" km";},onInput:function(){reset();draw();}});
    var eZ=U.slider(r2,"初めの位置（z）",{min:-32000,max:32000,step:500,value:0,fmt:function(v){return _w06_g(v,0)+" km";},onInput:function(){reset();draw();}});
    var br=U.btnrow(el);
    U.button(br,"1 回進める",function(){step();draw();});
    U.button(br,"最後まで",function(){for(var i=0;i<40&&st==="run";i++)step();draw();});
    U.button(br,"初めに戻す",function(){reset();draw();});
    U.button(br,"本文の例",function(){if(md.get()===0){pX.set(-8);pY.set(-6);}else{ns.set(0);rot.set(0);eS.set(0);eZ.set(0);}reset();draw();});
    U.button(br,"悪い例（遠くから始める）",function(){if(md.get()===0){pX.set(0);pY.set(20);}else{eS.set(-20000);eZ.set(0);}reset();draw();});
    var box=U.svgbox(el),ro=U.readout(el),hist=[],info=[],st="run",MP=null;
    function showCtl(){var p=md.get()===0;pX.el.style.display=p?"":"none";pY.el.style.display=p?"":"none";eS.el.style.display=p?"none":"";eZ.el.style.display=p?"none":"";ns.el.style.display=p?"none":"";rot.el.style.display=p?"none":"";}
    showCtl();
    /* 東京の例の衛星: 送った時刻の ECEF の位置と、擬似距離 */
    function sats3(){var L=ns.get()===0?_W06_N4:GE.sats.map(function(q){return q.nm;}),R=rot.get(),out=[];
      GE.sats.forEach(function(q){if(L.indexOf(q.nm)<0)return;
        if(R===0){out.push({nm:q.nm,ptx:q.p,rho:Math.hypot(q.p[0]-RX[0],q.p[1]-RX[1],q.p[2]-RX[2])+BT});return;}
        var tau=0.07,ptx,prx;for(var k=0;k<6;k++){ptx=U.gnss.ecef(q.s,-tau);prx=_w06_rotz(ptx,_W06_WE*tau);tau=Math.hypot(prx[0]-RX[0],prx[1]-RX[1],prx[2]-RX[2])/_W06_C;}
        out.push({nm:q.nm,ptx:ptx,rho:tau*_W06_C+BT});});
      return out;}
    var SS=null;
    function reset(){st="run";info=[];if(md.get()===0){hist=[[pX.get(),pY.get(),0]];}else{SS=sats3();var s=eS.get()*1e3,z=eZ.get()*1e3;hist=[[s*UH[0],s*UH[1],z,0]];}}
    function step(){if(st!=="run")return;var x=hist[hist.length-1],dx,G=[],dr=[],i,rr;
      if(md.get()===0){
        _W06_PS.forEach(function(p){var d=[p[0]-x[0],p[1]-x[1]],r=Math.hypot(d[0],d[1]);G.push([-d[0]/r,-d[1]/r,1]);dr.push(Math.hypot(p[0],p[1])+_W06_PB-(r+x[2]));});
        var A=_w06_lsA(U,G,[1,1,1]);if(!A){st="sing";return;}
        dx=[0,0,0];for(var j=0;j<3;j++)for(i=0;i<3;i++)dx[j]+=A[j][i]*dr[i];
        var xn=[x[0]+dx[0],x[1]+dx[1],x[2]+dx[2]];hist.push(xn);
        info.push({dp:Math.hypot(dx[0],dx[1])*1e3,rms:Math.sqrt(dr.reduce(function(a,b){return a+b*b;},0)/3)*1e3});
        if(!isFinite(xn[0])||Math.hypot(xn[0],xn[1])>1e4)st="div";else if(Math.hypot(dx[0],dx[1])<1e-6)st="done";
      }else{
        var R=rot.get();
        SS.forEach(function(q){var p=q.ptx;if(R===1){var tau=Math.hypot(p[0]-x[0],p[1]-x[1],p[2]-x[2])/_W06_C;p=_w06_rotz(p,_W06_WE*tau);}
          var d=[p[0]-x[0],p[1]-x[1],p[2]-x[2]];rr=Math.hypot(d[0],d[1],d[2]);G.push([-d[0]/rr,-d[1]/rr,-d[2]/rr,1]);dr.push(q.rho-(rr+x[3]));});
        var A2=_w06_lsA(U,G,G.map(function(){return 1;}));if(!A2){st="sing";return;}
        dx=[0,0,0,0];for(var j2=0;j2<4;j2++)for(i=0;i<G.length;i++)dx[j2]+=A2[j2][i]*dr[i];
        var xn2=[x[0]+dx[0],x[1]+dx[1],x[2]+dx[2],x[3]+dx[3]];hist.push(xn2);
        info.push({dp:Math.hypot(dx[0],dx[1],dx[2]),rms:Math.sqrt(dr.reduce(function(a,b){return a+b*b;},0)/G.length)});
        if(!isFinite(xn2[0])||Math.hypot(xn2[0],xn2[1],xn2[2])>1e9)st="div";else if(Math.hypot(dx[0],dx[1],dx[2])<1e-3)st="done";
      }
      if(hist.length>40&&st==="run")st="slow";}
    /* 位置の誤差 [m] */
    function perr(x){return md.get()===0?Math.hypot(x[0],x[1])*1e3:Math.hypot(x[0]-RX[0],x[1]-RX[1],x[2]-RX[2]);}
    U.ctl.drag(box,function(type,x,y){if(!MP||x==null)return type==="down"?false:undefined;
      if(x<MP.x||x>MP.x+MP.w||y<MP.y||y>MP.y+MP.h)return type==="down"?false:undefined;
      if(type==="up")return;var u=MP.ux(x),v=MP.uy(y);
      if(md.get()===0){pX.set(Math.max(-20,Math.min(20,Math.round(u*2)/2)));pY.set(Math.max(-10,Math.min(24,Math.round(v*2)/2)));}
      else{eS.set(Math.max(-32000,Math.min(32000,Math.round(u/500)*500)));eZ.set(Math.max(-32000,Math.min(32000,Math.round(v/500)*500)));}
      reset();draw();});
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],P,k,x=hist[hist.length-1],K=hist.length-1;
      if(md.get()===0){
        /* ---- 平面の例: 円・接線・仮の位置の動き ---- */
        var pw=nar?380:380,ph=pw*35/42;P=U.plot(nar?10:14,26,pw,ph,[-21,21],[-10,25]);MP=P;
        o.push(S.T(nar?10:14,16,"平面（単位 km）。図の上を押すと、そこを初めの位置にする","start",10,"ink",true));
        o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));
        for(var g=-20;g<=25;g+=5){if(g>=-21&&g<=21)o.push(S.L(P.X(g),P.y,P.X(g),P.y+P.h,"grid",1));if(g>=-10&&g<=25)o.push(S.L(P.x,P.Y(g),P.x+P.w,P.Y(g),"grid",1));}
        var bh=x[2],clip='<clipPath id="w06cp"><rect x="'+P.x+'" y="'+P.y+'" width="'+P.w+'" height="'+P.h+'"/></clipPath>',body=[];
        _W06_PS.forEach(function(p,i){var R0=Math.hypot(p[0],p[1])+_W06_PB-bh;if(R0>0){var cc=[];for(var a=0;a<=120;a++){var t=2*Math.PI*a/120;cc.push([P.X(p[0]+R0*Math.cos(t)),P.Y(p[1]+R0*Math.sin(t))]);}body.push(S.PL(cc,"signal",1.1));}});
        if(K>0){var xp=hist[K-1];
          _W06_PS.forEach(function(p){var d=[p[0]-xp[0],p[1]-xp[1]],r=Math.hypot(d[0],d[1]),l=[d[0]/r,d[1]/r],R0=Math.hypot(p[0],p[1])+_W06_PB-x[2];
            var q=[p[0]-l[0]*R0,p[1]-l[1]*R0],tt=[-l[1],l[0]];body.push(S.L(P.X(q[0]-tt[0]*60),P.Y(q[1]-tt[1]*60),P.X(q[0]+tt[0]*60),P.Y(q[1]+tt[1]*60),"gold",1.3,"6 3"));
            body.push(S.L(P.X(xp[0]),P.Y(xp[1]),P.X(p[0]),P.Y(p[1]),"faint",0.9,"2 3"));});}
        var path=hist.map(function(h){return [P.X(h[0]),P.Y(h[1])];});
        body.push(S.PL(path,"gold",1.4,null,"3 2"));
        hist.forEach(function(h,i){body.push(S.D(P.X(h[0]),P.Y(h[1]),"gold",i===K?4.6:3));});
        o.push(clip+'<g clip-path="url(#w06cp)">'+body.join("")+'</g>');
        _W06_PS.forEach(function(p,i){o.push(_w06_sat(U,P.X(p[0]),P.Y(p[1]),"purple",0.7));o.push(S.T(P.X(p[0]),P.Y(p[1])-8,"S"+(i+1),"middle",9.5,"purple",true,false,null,true));});
        o.push(_w06_rxm(U,P.X(0),P.Y(0)-2));
        if(Math.abs(hist[0][0])<=21&&hist[0][1]>=-10&&hist[0][1]<=25)o.push(S.T(P.X(hist[0][0])+7,P.Y(hist[0][1])+13,"初め","start",9,"gold",true,false,null,true));
        o.push(S.LEGL(P.x,P.y+P.h+16,[["signal",null,"半径 ρ_i − b̂ の円"],["gold","6 3","接線（1 次の式）"]],9.5,14));
      }else{
        /* ---- 東京の例: 子午線を含む面 ---- */
        var pw2=nar?380:330;P=U.plot(nar?10:14,26,pw2,pw2,[-32000,32000],[-32000,32000]);MP=P;
        o.push(S.T(nar?10:14,16,"子午線を含む面（単位 km）。押すと初めの位置にする","start",10,"ink",true));
        o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));
        o.push(S.CIRC(P.X(0),P.Y(0),P.X(26560)-P.X(0),"purple",1,null,"4 3"));
        o.push(S.CIRC(P.X(0),P.Y(0),P.X(6371)-P.X(0),"green",1.3,"var(--green-soft)"));
        function mer(p){return [(p[0]*UH[0]+p[1]*UH[1])/1e3,p[2]/1e3];}
        SS.forEach(function(q){var m=mer(q.ptx);o.push(_w06_sat(U,P.X(m[0]),P.Y(m[1]),"purple",0.55));});
        var tk=mer(RX);o.push(_w06_rxm(U,P.X(tk[0]),P.Y(tk[1])-2));
        var body2=[],pth=[];hist.forEach(function(h){var m=mer(h);pth.push([P.X(Math.max(-60000,Math.min(60000,m[0]))),P.Y(Math.max(-60000,Math.min(60000,m[1])))]);});
        body2.push(S.PL(pth,"gold",1.4,null,"3 2"));hist.forEach(function(h,i){var m=mer(h);body2.push(S.D(P.X(m[0]),P.Y(m[1]),"gold",i===K?4.6:3));});
        o.push('<clipPath id="w06cp2"><rect x="'+P.x+'" y="'+P.y+'" width="'+P.w+'" height="'+P.h+'"/></clipPath><g clip-path="url(#w06cp2)">'+body2.join("")+'</g>');
        var m0=mer(hist[0]);if(Math.abs(m0[0])<=32000&&Math.abs(m0[1])<=32000)o.push(S.T(P.X(m0[0])+7,P.Y(m0[1])+13,"初め","start",9,"gold",true,false,null,true));
        o.push(S.T(P.x+4,P.y+P.h-6,"緑: 地球、紫の破線: GPS の軌道の半径、紫の印: 衛星（面に投影）","start",8.5,"muted",false,false,null,true));
      }
      /* ---- 誤差の減り方 ---- */
      var qx=nar?60:(md.get()===0?440:400),qy=nar?(P.y+P.h+(md.get()===0?64:36)):40,qw=nar?310:(Wd-qx-20),qh=nar?170:200;
      var Q=U.plot(qx,qy,qw,qh,[0,10],[1e-9,1e8],{ylog:true});
      o.push(S.T(qx-30,qy-14,"位置の誤差 [m]","start",10,"ink",true));
      o.push(Q.axes({xl:"繰り返した回数 k",xt:[0,2,4,6,8,10],yt:[1e-9,1e-6,1e-3,1,1e3,1e6],yfmt:_w06_pow,sz:9}));
      o.push(S.L(qx,Q.Y(1e-3),qx+qw,Q.Y(1e-3),"purple",1,"4 3"));o.push(S.T(qx+qw-3,Q.Y(1e-3)-4,"1 mm","end",9,"purple",false,false,null,true));
      var ep=hist.map(function(h,i){return [i,Math.max(2e-9,Math.min(5e8,perr(h)))];}).filter(function(q){return q[0]<=10;});
      o.push(Q.clip(ep,"gold",2));ep.forEach(function(q){o.push(S.D(Q.X(q[0]),Q.Y(q[1]),"gold",3.2));});
      var Hh=nar?qy+qh+50:Math.max(P.y+P.h+(md.get()===0?30:16),qy+qh+46);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し（表） ---- */
      var rows=[],k0=Math.max(0,hist.length-8);
      for(k=k0;k<hist.length;k++){var h=hist[k],inf=k<info.length?info[k]:null;
        if(md.get()===0)rows.push([String(k),_w06_f(h[0],4)+", "+_w06_f(h[1],4)+" km",_w06_f(h[2],4)+" km",_w06_len(perr(h)),inf?_w06_len(inf.rms):"—",inf?_w06_len(inf.dp):"—"]);
        else rows.push([String(k),_w06_len(perr(h)),_w06_len(h[3]-BT),inf?_w06_len(inf.rms):"—",inf?_w06_len(inf.dp):"—"]);}
      var hd=md.get()===0?["k","仮の位置 (x̂, ŷ)","b̂（本当は 3.0 km）","位置の誤差","その回の残差の RMS","次の |Δp|"]:["k","位置の誤差","b̂ − b","その回の残差の RMS","次の |Δp|"];
      var s1=st==="done"?'<span class="ok">収束した（'+(hist.length-1)+' 回。位置の修正量が 1 mm より小さい）</span>':(st==="div"?'<span class="warn">発散した（修正量が大きくなり続ける）</span>':(st==="sing"?'<span class="warn">G に逆行列が無くなった</span>':(st==="slow"?'<span class="warn">40 回で収束しない</span>':"「1 回進める」で次へ")));
      var tail="";
      if(md.get()===1&&st==="done"){var R=GE.rx,ren=_w06_renu(35.681,139.767),d=[x[0]-RX[0],x[1]-RX[1],x[2]-RX[2]],e3=ren.map(function(r){return r[0]*d[0]+r[1]*d[1]+r[2]*d[2];});
        tail="<br>最後の位置の誤差: 東 "+_w06_f(e3[0],2)+" m、北 "+_w06_f(e3[1],2)+" m、上 "+_w06_f(e3[2],2)+" m"+(rot.get()===2?'（<span class="warn">地球の自転の直しを省いたので、東へずれる</span>）':"");}
      ro.innerHTML=s1+tail+U.tbl(hd,rows,hd.map(function(){return "right";}))+'<div class="wnote">'+(md.get()===0?"平面の例は、1 章 1 節の 3 つの点（本当の位置は原点、受信機の時計のずれ b = 3.0 km、誤差 0）。金の破線は、前の仮の位置で各円を置き換えた直線（1 次の式）で、3 本の交わる点が次の仮の位置になる。":"東京の例は、受信機の時計が 1 ms 進み（b = 299.792 km）、誤差 0。初めの b̂ は 0。仮の位置は、東京を通る子午線を含む面に投影して描いた。")+"表は最後の 8 回分。</div>";
    }
    reset();draw();
  };

  /* ---- 5 節: ドップラーから速度と時計のドリフトを求める（動く空 ↔ ドップラーの内訳 ↔ 速度） ---- */
  REG.w06_vel=function(el,U){
    var S=U.S,ren=_w06_renu(35.681,139.767);
    U.head(el,"VELOCITY FROM DOPPLER","ドップラーから速度と時計のドリフトを求める");
    var r1=U.ctrls(el);
    var sp=U.slider(r1,"受信機の速さ",{min:0,max:40,step:1,value:20,fmt:function(v){return v+" m/s（時速 "+_w06_f(v*3.6,0)+" km）";},onInput:function(){draw();}});
    var hd=U.slider(r1,"進む向き（北から東へ）",{min:0,max:355,step:5,value:90,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var dr=U.slider(r2,"発振器の周波数のずれ",{values:[-2,-1,-0.5,0,0.5,1,2],value:0.5,fmt:function(v){return (v>0?"+":"")+_w06_f(v,1)+" ppm（ḃ = "+_w06_f(v*1e-6*_W06_C,1)+" m/s）";},onInput:function(){draw();}});
    var nz=U.slider(r2,"ドップラーの雑音",{values:[0,0.02,0.05,0.2,1],value:0.05,fmt:function(v){return v+" Hz";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var nsel=U.select(r3,"使う衛星",["見えている全部","仰角の高い 4 つ"],0,function(){draw();});
    var tt=U.slider(r3,"時刻（1 章の配置の時刻 0 から）",{min:0,max:3600,step:30,value:0,fmt:function(v){return Math.floor(v/60)+" 分 "+(v%60)+" 秒";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    var tick=U.ticker(function(){var v=tt.get()+30;if(v>3600){v=3600;tick.stop();}tt.set(v);draw();},80);
    U.button(br,"本文の例（東へ 20 m/s・+0.5 ppm・0.05 Hz）",function(){tick.stop();sp.set(20);hd.set(90);dr.set(0.5);nz.set(0.05);nsel.set(0);tt.set(0);seed=1;draw();});
    U.button(br,"再生（時刻を進める）",function(){if(tt.get()>=3600)tt.set(0);tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],t=tt.get(),geo=_w06_sky(U,t),sats=geo.sats.slice();
      if(nsel.get()===1)sats=sats.slice(0,4);
      var spd=sp.get(),hdg=hd.get()*_W06_D,venu=[spd*Math.sin(hdg),spd*Math.cos(hdg),0];
      var v=[0,1,2].map(function(j){return ren[0][j]*venu[0]+ren[1][j]*venu[1]+ren[2][j]*venu[2];});
      var bdot=dr.get()*1e-6*_W06_C,sd=nz.get(),rng=U.rng(seed*31+7);
      /* 衛星ごとのドップラーの内訳 */
      var parts=sats.map(function(q){var vp=U.gnss.ecef(q.s,t+0.5),vm=U.gnss.ecef(q.s,t-0.5),vs=[vp[0]-vm[0],vp[1]-vm[1],vp[2]-vm[2]];
        var ls=q.l[0]*vs[0]+q.l[1]*vs[1]+q.l[2]*vs[2],lv=q.l[0]*v[0]+q.l[1]*v[1]+q.l[2]*v[2];
        return {q:q,vs:vs,ls:ls,fs:-ls/_W06_LAM,fr:lv/_W06_LAM,fc:-bdot/_W06_LAM};});
      var G=sats.map(function(q){return [-q.l[0],-q.l[1],-q.l[2],1];}),A=sats.length>=4?_w06_lsA(U,G,sats.map(function(){return 1;})):null;
      var est=null,cloud=[],s2=0,NT=300;
      if(A){var meas=parts.map(function(p){return p.fs+p.fr+p.fc+sd*rng.normal();});
        function solve(f){var y=parts.map(function(p,i){return -_W06_LAM*f[i]-p.ls;}),x=[0,0,0,0];for(var j=0;j<4;j++)for(var i=0;i<y.length;i++)x[j]+=A[j][i]*y[i];return x;}
        est=solve(meas);
        for(var k=0;k<NT;k++){var f2=parts.map(function(p){return p.fs+p.fr+p.fc+sd*rng.normal();}),x2=solve(f2),e2=[0,1].map(function(r){return ren[r][0]*x2[0]+ren[r][1]*x2[1]+ren[r][2]*x2[2];});
          cloud.push(e2);s2+=(e2[0]-venu[0])*(e2[0]-venu[0])+(e2[1]-venu[1])*(e2[1]-venu[1]);}}
      /* ---- 左: 空（受信機の進む向きの矢印） ---- */
      var cx=nar?200:120,cy=nar?130:140,R=nar?96:98;
      o.push(S.T(nar?10:14,18,"空の衛星と、受信機の進む向き","start",10.5,"ink",true));
      o.push(U.gnss.sky(U,cx,cy,R,sats.map(function(p){return {el:p.el,az:p.az,name:p.nm,col:"purple"};}),{dot:4.2,labels:true}));
      if(spd>0){var al=Math.min(R*0.8,22+spd*1.6);o.push(S.ARR(cx,cy,cx+al*Math.sin(hdg),cy-al*Math.cos(hdg),"signal",2.4,8));}
      o.push(S.T(cx,cy+R+34,"青の矢印: 受信機の進む向き","middle",9,"signal",true));
      /* ---- 右: ドップラーの内訳（列ごとに目盛が違う） ---- */
      var bx=nar?14:262,by=nar?(cy+R+92):44,rh=nar?20:22,cols=nar?[[96,52,4000,"purple","fs","衛星"],[226,44,150,"signal","fr","受信機"],[336,30,4000,"gold","fc","時計"]]:[[350,70,4000,"purple","fs","衛星の動き"],[506,50,150,"signal","fr","受信機の動き"],[642,30,4000,"gold","fc","時計のドリフト"]];
      o.push(S.T(bx,by-26,"ドップラーの内訳 [Hz]（列ごとに目盛が違う）","start",10.5,"ink",true));
      cols.forEach(function(c){o.push(S.T(c[0],by-8,c[5],"middle",9.5,c[3],true));o.push(S.L(c[0],by-2,c[0],by+rh*parts.length,"muted",1));
        o.push(S.T(c[0]-c[1],by+rh*parts.length+12,"−"+c[2],"middle",8.5,"muted"));o.push(S.T(c[0]+c[1],by+rh*parts.length+12,"+"+c[2],"middle",8.5,"muted"));});
      parts.forEach(function(p,i){var yy=by+i*rh;o.push(S.T(bx,yy+13,p.q.nm,"start",9.5,"purple",true));
        cols.forEach(function(c){var val=p[c[4]],w=Math.max(-c[1],Math.min(c[1],c[1]*val/c[2]));o.push(S.RECT(Math.min(c[0],c[0]+w),yy+3,Math.abs(w),rh-8,2,U.soft(c[3]),c[3],1));
          o.push(S.T(c[0]+(val>0?-4:4),yy+13,(val>0?"+":"")+_w06_f(val,c[4]==="fr"?1:0),val>0?"end":"start",8.5,c[3],true,false,null,true));});});
      /* ---- 下: 求めた速度（東西と南北の平面） ---- */
      var vy0=nar?(by+rh*parts.length+40):Math.max(cy+R+60,by+rh*parts.length+36),vs=nar?170:150,vx0=nar?60:40;
      var V=U.plot(vx0,vy0,vs,vs,[-45,45],[-45,45]);
      o.push(S.T(vx0-20,vy0-10,"速度の東西と南北 [m/s]","start",10,"ink",true));
      o.push(S.RECT(vx0,vy0,vs,vs,3,"var(--screen)","line",1));o.push(V.axes({xt:[-40,-20,0,20,40],yt:[-40,-20,0,20,40],sz:8.5}));
      o.push(S.ARR(V.X(0),V.Y(0),V.X(venu[0]),V.Y(venu[1]),"green",2,7));
      if(est){var ee=[0,1].map(function(r){return ren[r][0]*est[0]+ren[r][1]*est[1]+ren[r][2]*est[2];});o.push(S.D(V.X(ee[0]),V.Y(ee[1]),"gold",3.6));}
      /* 拡大（本当の速度のまわり） */
      var zl=Math.max(0.02,Math.min(5,4*Math.sqrt(s2/Math.max(1,cloud.length))||0.02)),zx=vx0+vs+(nar?30:40),zs=nar?140:150;
      var Z=U.plot(zx,vy0,zs,zs,[venu[0]-zl,venu[0]+zl],[venu[1]-zl,venu[1]+zl]);
      o.push(S.T(zx,vy0-10,"拡大: 本当の速度 ±"+_w06_f(zl*100,zl<0.1?1:0)+" cm/s","start",10,"ink",true));
      o.push(S.RECT(zx,vy0,zs,zs,3,"var(--screen)","line",1));
      o.push(S.L(Z.X(venu[0]),vy0,Z.X(venu[0]),vy0+zs,"grid",1));o.push(S.L(zx,Z.Y(venu[1]),zx+zs,Z.Y(venu[1]),"grid",1));
      cloud.forEach(function(c){if(Math.abs(c[0]-venu[0])<zl&&Math.abs(c[1]-venu[1])<zl)o.push(S.D(Z.X(c[0]),Z.Y(c[1]),"gold",1.4));});
      o.push(S.L(Z.X(venu[0])-6,Z.Y(venu[1]),Z.X(venu[0])+6,Z.Y(venu[1]),"green",2));o.push(S.L(Z.X(venu[0]),Z.Y(venu[1])-6,Z.X(venu[0]),Z.Y(venu[1])+6,"green",2));
      if(!nar)o.push(S.T(zx+zs+12,vy0+16,"金の点: "+NT+" 回解いた","start",9,"gold",true),S.T(zx+zs+12,vy0+30,"速度（雑音の乱数を変えて）","start",9,"gold"),S.T(zx+zs+12,vy0+48,"十字・緑の矢印: 本当の速度","start",9,"green",true));
      var Hh=vy0+Math.max(vs,zs)+(nar?24:20);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し ---- */
      var h="時刻 "+Math.floor(t/60)+" 分 "+(t%60)+" 秒、使う衛星 "+sats.length+" 個。時計のドリフトによるドップラーは、どの衛星も "+_w06_f(-bdot/_W06_LAM,1)+" Hz<br>";
      if(est){var e3=[0,1,2].map(function(r){return ren[r][0]*est[0]+ren[r][1]*est[1]+ren[r][2]*est[2];}),spe=Math.hypot(e3[0],e3[1]),hde=(Math.atan2(e3[0],e3[1])/_W06_D+360)%360;
        h+="求めた速度: 東 <b>"+_w06_f(e3[0],3)+"</b> m/s、北 <b>"+_w06_f(e3[1],3)+"</b> m/s、上 "+_w06_f(e3[2],3)+" m/s（速さ "+_w06_f(spe,3)+" m/s、向き "+_w06_f(hde,1)+"°）、ḃ = <b>"+_w06_f(est[3],2)+" m/s</b>（"+_w06_f(est[3]/_W06_C*1e6,3)+" ppm）<br>";
        var Ae=[0,1,2].map(function(r){return A[0].map(function(_,i){return ren[r][0]*A[0][i]+ren[r][1]*A[1][i]+ren[r][2]*A[2][i];});}),thv=_w06_th(Ae,parts.map(function(){return sd*_W06_LAM;}));
        h+="水平の速度の誤差の RMS: "+NT+" 回で <b>"+_w06_f(Math.sqrt(s2/NT)*100,2)+" cm/s</b>（回数を十分に増やしたとき "+_w06_f(thv[0]*100,2)+" cm/s。擬似距離の変化率の雑音 "+_w06_f(sd*_W06_LAM*100,2)+" cm/s）";}
      else h+='<span class="warn">衛星が 4 つより少ないので解けない</span>';
      ro.innerHTML=h+'<div class="wnote">受信機は東京に置き、速度だけを与えた（位置の変化は、衛星の向きにほとんど効かないので省いた）。衛星の速度は、1 章の近似の配置で 1 s 前後の位置の差から求めた。棒の数は、衛星の動きによる分 −l<sub>i</sub>·v<sub>i</sub>/λ、受信機の動きによる分 l<sub>i</sub>·v/λ、時計のドリフトによる分 −ḃ/λ。</div>';
    }
    draw();
  };

  /* ---- 6 節: ECEF・緯度経度・ENU の変換（世界の格子 ↔ 楕円体の切り口 ↔ 数値） ---- */
  var _W06_A=6378137,_W06_FW=1/298.257223563,_W06_AP=6378137*(1-1/298.257223563);
  function _w06_g2e(B,L,h){B*=_W06_D;L*=_W06_D;var RN=_W06_A*_W06_A/Math.sqrt(_W06_A*_W06_A*Math.cos(B)*Math.cos(B)+_W06_AP*_W06_AP*Math.sin(B)*Math.sin(B));
    return {x:(RN+h)*Math.cos(B)*Math.cos(L),y:(RN+h)*Math.cos(B)*Math.sin(L),z:(_W06_AP*_W06_AP/(_W06_A*_W06_A)*RN+h)*Math.sin(B),RN:RN};}
  /* ECEF → 緯度・楕円体高の繰り返し（0 回目は h = 0 とおいた値） */
  function _w06_inv(x,y,z,n){var s=Math.hypot(x,y),k2=_W06_AP*_W06_AP/(_W06_A*_W06_A),B=Math.atan2(z,s*k2),out=[];
    for(var i=0;i<n;i++){var RN=_W06_A*_W06_A/Math.sqrt(_W06_A*_W06_A*Math.cos(B)*Math.cos(B)+_W06_AP*_W06_AP*Math.sin(B)*Math.sin(B)),h=Math.abs(Math.cos(B))>1e-9?s/Math.cos(B)-RN:Math.abs(z)-k2*RN;
      out.push([B/_W06_D,h]);B=Math.atan2(z*(RN+h),s*(k2*RN+h));}
    return out;}
  REG.w06_coord=function(el,U){
    var S=U.S,GE=_w06_geo(U),G9=GE.sats.filter(function(q){return q.nm==="G9";})[0];
    U.head(el,"COORDINATES","緯度・経度・楕円体高 ↔ ECEF ↔ ENU と標高");
    var r1=U.ctrls(el);
    var la=U.slider(r1,"緯度 B",{min:-89.9,max:89.9,step:0.001,value:35.681,fmt:function(v){return _w06_f(v,3)+"°";},onInput:function(){draw();}});
    var lo=U.slider(r1,"経度 L",{min:-180,max:180,step:0.001,value:139.767,fmt:function(v){return _w06_f(v,3)+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var hh=U.slider(r2,"楕円体高 h",{min:-100,max:9000,step:1,value:40,fmt:function(v){return _w06_g(v,0)+" m";},onInput:function(){draw();}});
    var hg=U.slider(r2,"ジオイド高 h_g（その場所の値を入れる）".replace("h_g","h<sub>g</sub>"),{min:-110,max:90,step:0.5,value:37,fmt:function(v){return _w06_f(v,1)+" m";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var ex=U.checkbox(r3,"切り口の扁平率を 20 倍にして描く",true,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（東京駅のあたり）",function(){la.set(35.681);lo.set(139.767);hh.set(40);hg.set(37);ex.set(true);draw();});
    U.button(br,"赤道・経度 0°",function(){la.set(0);lo.set(0);hh.set(0);draw();});
    U.button(br,"北極の近く",function(){la.set(89.9);lo.set(0);hh.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el),MP=null;
    U.ctl.drag(box,function(type,x,y){if(!MP||x==null)return type==="down"?false:undefined;if(x<MP.x||x>MP.x+MP.w||y<MP.y||y>MP.y+MP.h)return type==="down"?false:undefined;
      if(type==="up")return;la.set(Math.max(-89.9,Math.min(89.9,Math.round(MP.uy(y)*10)/10)));lo.set(Math.max(-180,Math.min(180,Math.round(MP.ux(x)*10)/10)));draw();});
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],B=la.get(),L=lo.get(),h=hh.get(),E=_w06_g2e(B,L,h);
      /* ---- 世界の格子（経度・緯度） ---- */
      var mw=nar?340:310,mh=mw/2,P=U.plot(nar?44:40,30,mw,mh,[-180,180],[-90,90]);MP=P;
      o.push(S.T(nar?16:14,18,"世界の格子（点を押すかドラッグする）","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,2,"var(--screen)","line",1));
      for(var g=-150;g<=150;g+=30)o.push(S.L(P.X(g),P.y,P.X(g),P.y+P.h,g===0?"muted":"grid",1));
      for(var g2=-60;g2<=60;g2+=30)o.push(S.L(P.x,P.Y(g2),P.x+P.w,P.Y(g2),g2===0?"muted":"grid",1));
      [[-90,"−90°"],[0,"0°"],[90,"90°"]].forEach(function(q){o.push(S.T(P.x-4,P.Y(q[0])+3,q[1],"end",8.5,"muted"));});
      [[-180,"−180°"],[0,"0°"],[180,"180°"]].forEach(function(q){o.push(S.T(P.X(q[0]),P.y+P.h+12,q[1],"middle",8.5,"muted"));});
      o.push(S.D(P.X(139.767),P.Y(35.681),"green",3));o.push(S.T(P.X(139.767)+5,P.Y(35.681)-4,"東京","start",8.5,"green",true,false,null,true));
      o.push(S.CIRC(P.X(L),P.Y(B),6,"signal",2));o.push(S.D(P.X(L),P.Y(B),"signal",2.6));
      /* ---- 子午線を含む面の切り口 ---- */
      var k=ex.get()?20:1,A=nar?150:150,Ap=A*(1-k*_W06_FW),cx=nar?200:(40+mw+40+A),cy=nar?(P.y+P.h+40+Ap+20):(30+Ap+20);
      o.push(S.T(nar?16:cx-A-20,nar?P.y+P.h+30:18,"子午線を含む面の切り口"+(k>1?"（扁平率 20 倍）":""),"start",10.5,"ink",true));
      var pts=[];for(var i=0;i<=120;i++){var t=2*Math.PI*i/120;pts.push([cx+A*Math.cos(t),cy-Ap*Math.sin(t)]);}
      o.push(S.PL(pts,"green",1.6,"var(--green-soft)"));
      o.push(S.L(cx-A-8,cy,cx+A+8,cy,"muted",1));o.push(S.L(cx,cy+Ap+8,cx,cy-Ap-8,"muted",1));
      var Br=B*_W06_D,RNd=A*A/Math.sqrt(A*A*Math.cos(Br)*Math.cos(Br)+Ap*Ap*Math.sin(Br)*Math.sin(Br));
      var ps=RNd*Math.cos(Br),pz=Ap*Ap/(A*A)*RNd*Math.sin(Br),Px=cx+ps,Py=cy-pz,Qy=cy+(1-Ap*Ap/(A*A))*RNd*Math.sin(Br),hd=Math.min(40,Math.max(0,h/9000*40)+8);
      o.push(S.L(cx,Qy,Px+hd*Math.cos(Br),Py-hd*Math.sin(Br),"signal",1.5));o.push(S.L(cx,cy,Px,Py,"muted",1.1,"4 3"));
      o.push(S.D(Px,Py,"signal",3.6));o.push(S.D(cx,Qy,"signal",3.2));o.push(_w06_rxm(U,Px+hd*Math.cos(Br),Py-hd*Math.sin(Br)-3));
      o.push(S.TX((cx+Px)/2-4,(Qy+Py)/2-6,"R_N","end",10,"signal",true,true));
      if(Math.abs(B)>3)o.push(S.T(cx-6,Qy+(B>0?12:-4),"法線が z 軸を横切る点","end",8.5,"signal",false,false,null,true));
      var Hh=nar?cy+Ap+30:Math.max(P.y+P.h+30,cy+Ap+30);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し ---- */
      var inv=_w06_inv(E.x,E.y,E.z,4),ren=_w06_renu(B,L),rx={B:B,L:L,h:h,r0:[E.x,E.y,E.z]},ea=U.gnss.elaz(rx,G9.p);
      var hs="ECEF: x = <b>"+_w06_g(E.x,1)+"</b> m、y = <b>"+_w06_g(E.y,1)+"</b> m、z = <b>"+_w06_g(E.z,1)+"</b> m（R<sub>N</sub> = "+_w06_g(E.RN/1e3,3)+" km、法線は中心から "+_w06_f((1-_W06_AP*_W06_AP/(_W06_A*_W06_A))*E.RN*Math.sin(B*_W06_D)/1e3,1)+" km 南で z 軸を横切る）<br>";
      hs+="逆の変換: 経度 = atan2(y, x) = "+_w06_f((Math.atan2(E.y,E.x)/_W06_D),6)+"°。緯度と楕円体高の繰り返し:"+U.tbl(["回","緯度 B [°]","緯度の誤差（地上の距離）","h [m]"],inv.map(function(q,i){var em=Math.abs(q[0]-B)*_W06_D*6.37e6;return [String(i),_w06_f(q[0],10),_w06_len(em),_w06_f(q[1],4)];}),["right","right","right","right"]);
      hs+="ENU の軸（ECEF の成分）: 東 ("+ren[0].map(function(v){return _w06_f(v,4);}).join(", ")+")、北 ("+ren[1].map(function(v){return _w06_f(v,4);}).join(", ")+")、上 ("+ren[2].map(function(v){return _w06_f(v,4);}).join(", ")+")<br>";
      hs+="この場所から見た G9（1 章の配置の時刻 0）: (e, n, u) = ("+_w06_g(ea[3]/1e3,1)+", "+_w06_g(ea[4]/1e3,1)+", "+_w06_g(ea[5]/1e3,1)+") km、仰角 "+_w06_f(ea[0],1)+"°、方位角 "+_w06_f(ea[1],1)+"°"+(ea[0]<0?'（<span class="warn">地平線の下</span>）':"")+"<br>";
      hs+="標高 H ≈ h − h<sub>g</sub> = "+_w06_g(h,0)+" − "+_w06_f(hg.get(),1)+" = <b>"+_w06_f(h-hg.get(),1)+" m</b>";
      ro.innerHTML=hs+'<div class="wnote">楕円体は WGS 84（赤道の半径 6 378 137 m、扁平率 1/298.257 223 563）。ジオイド高は場所ごとに違うので、ここでは値を入れる（東京のあたりで約 37 m。代表値）。切り口の図の受信機の高さは、見やすいように大きく描いた。</div>';
    }
    draw();
  };
