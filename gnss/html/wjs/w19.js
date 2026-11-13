  /* ===== 19 章 慣性センサとの融合 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w19_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w19_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 例の値（本文・図の f19.py と同じ） */
  var _W19_TS=0.01,_W19_SA=0.02,_W19_SB=3e-4,_W19_SY=2.0,_W19_BA=0.05,_W19_BAN=-0.03,_W19_BGD=0.05,_W19_SGD=0.05,_W19_V0=20,_W19_G=9.8,_W19_D=Math.PI/180,_W19_S0=[2,1,0.1],_W19_SM=3.0;
  /* 4 節の例の本当の加速度: 10 s から加速して 20 m/s、100〜105 s で 10 m/s まで減速、125〜130 s で 20 m/s へ */
  function _w19_acc1(t){if(t<10)return 0;if(t<30)return 1;if(t>=100&&t<105)return -2;if(t>=125&&t<130)return 2;return 0;}
  /* 本当の位置・速度・加速度（1 周期ごと） */
  function _w19_truth(N,accf){var P=new Float64Array(N+1),V=new Float64Array(N+1),A=new Float64Array(N+1),p=0,v=0,T=_W19_TS;
    for(var k=0;k<=N;k++){var a=accf(k*T);P[k]=p;V[k]=v;A[k]=a;p+=v*T+0.5*a*T*T;v+=a*T;}return {P:P,V:V,A:A};}
  /* 予測 1 周期（本文 4 節の A_d・B_d・W。S は対称な 3 行 3 列）。f19.py の _f19_pred と同じ式 */
  function _w19_pred(x,S,u,T,sa2,qb){var h=T*T/2,a=u-x[2];
    var s00=S[0][0],s01=S[0][1],s02=S[0][2],s11=S[1][1],s12=S[1][2],s22=S[2][2];
    var r00=s00+T*s01-h*s02,r01=s01+T*s11-h*s12,r02=s02+T*s12-h*s22,r11=s11-T*s12,r12=s12-T*s22;
    var n00=r00+T*r01-h*r02+sa2*h*h,n01=r01-T*r02+sa2*h*T,n02=r02,n11=r11-T*r12+sa2*T*T,n12=r12,n22=s22+qb;
    return [[x[0]+T*x[1]+h*a,x[1]+T*a,x[2]],[[n00,n01,n02],[n01,n11,n12],[n02,n12,n22]]];}
  /* 更新（状態の j 番目に分散 V の雑音が加わった観測 y）。返り値 [x, S, イノベーション, その分散] */
  function _w19_upd(x,S,j,y,V){var e=y-x[j],Sv=S[j][j]+V,H=[S[0][j]/Sv,S[1][j]/Sv,S[2][j]/Sv],r=[S[j][0],S[j][1],S[j][2]],nx=[],nS=[[0,0,0],[0,0,0],[0,0,0]];
    for(var i=0;i<3;i++){nx.push(x[i]+H[i]*e);for(var k=0;k<3;k++)nS[i][k]=S[i][k]-H[i]*r[k];}return [nx,nS,e,Sv];}
  /* 1 つの軸の融合（f19.py の _f19_kf1 と同じ計算・同じ乱数の列）。
     o: seed・bias（バイアスを状態に入れるか）・wscale（W の倍率）・tun [始, 終]・Tu・sy・ba（本当のバイアス）・sa（本当の雑音）・
        sb・s0（初めの標準偏差）・Tend・acc（本当の加速度の関数）・axis（0: 東、1: 北の乱数を使う）・every。返り値は記録 */
  function _w19_kf1(U,o){
    var T=_W19_TS,N=Math.round(o.Tend/T),m=Math.round(o.Tu/T),rI=U.rng(o.seed*7+1),rG=U.rng(o.seed*7+2),tr=_w19_truth(N,o.acc);
    var sa2=o.sa*o.sa*(o.wscale||1),qb=o.bias?(o.sb*o.sb*T):0,s0=o.s0||_W19_S0,x=[0,0,0],S=[[s0[0]*s0[0],0,0],[0,s0[1]*s0[1],0],[0,0,o.bias?s0[2]*s0[2]:0]],first=true;
    var ev=o.every||10,R={t:[],err:[],sp:[],b:[],sb:[],xe:[],gt:[],ge:[]};
    for(var k=0;k<=N;k++){var t=k*T;
      if(k%m===0){var n1=rG.normal(),n2=rG.normal(),gn=o.axis?n2:n1;
        if(!(t>=o.tun[0]&&t<o.tun[1])){var y=tr.P[k]+o.sy*gn;R.gt.push(t);R.ge.push(o.sy*gn);
          if(first){x[0]=y;first=false;}else{var q=_w19_upd(x,S,0,y,o.sy*o.sy);x=q[0];S=q[1];}}}
      if(k%ev===0){R.t.push(t);R.err.push(x[0]-tr.P[k]);R.sp.push(Math.sqrt(Math.max(S[0][0],0)));R.b.push(x[2]);R.sb.push(Math.sqrt(Math.max(S[2][2],0)));R.xe.push(x[0]);}
      var a1=rI.normal(),a2=rI.normal(),u=tr.A[k]+o.ba+o.sa*(o.axis?a2:a1);
      var pq=_w19_pred(x,S,u,T,sa2,qb);x=pq[0];S=pq[1];}
    R.P=tr.P;R.V=tr.V;return R;}
  /* IMU を使わないフィルタ（13 章 4 節の動きのモデル。f19.py の _f19_kfm と同じ）。0.1 s ごとの予測の値も記録する */
  function _w19_kfm(U,o){
    var T=_W19_TS,N=Math.round(o.Tend/T),m=Math.round(o.Tu/T),Tu=o.Tu,rG=U.rng(o.seed*7+2),tr=_w19_truth(N,o.acc),sm=_W19_SM,sub=Math.max(1,Math.round(Tu/0.1));
    var x=[0,0],S=[[_W19_S0[0]*_W19_S0[0],0],[0,_W19_S0[1]*_W19_S0[1]]],first=true,R={t:[],err:[],sp:[],xe:[],gt:[],ge:[]};
    for(var k=0;k<=N;k+=m){var t=k*T,n1=rG.normal(),n2=rG.normal(),gn=o.axis?n2:n1;
      if(!(t>=o.tun[0]&&t<o.tun[1])){var y=tr.P[k]+o.sy*gn;R.gt.push(t);R.ge.push(o.sy*gn);
        if(first){x=[y,0];first=false;}
        else{var e=y-x[0],Sv=S[0][0]+o.sy*o.sy,H0=S[0][0]/Sv,H1=S[1][0]/Sv;x=[x[0]+H0*e,x[1]+H1*e];
          S=[[S[0][0]-H0*S[0][0],S[0][1]-H0*S[0][1]],[S[1][0]-H1*S[0][0],S[1][1]-H1*S[0][1]]];}}
      for(var j=0;j<sub;j++){var tau=Tu*j/sub,kk=Math.min(N,k+Math.round(tau/T)),s00=S[0][0]+2*tau*S[0][1]+tau*tau*S[1][1]+sm*sm*Math.pow(tau*tau/2,2);
        R.t.push(t+tau);R.err.push(x[0]+x[1]*tau-tr.P[kk]);R.sp.push(Math.sqrt(s00));R.xe.push(x[0]+x[1]*tau);}
      var a2=Tu*Tu/2;x=[x[0]+Tu*x[1],x[1]];
      S=[[S[0][0]+2*Tu*S[0][1]+Tu*Tu*S[1][1]+sm*sm*a2*a2,S[0][1]+Tu*S[1][1]+sm*sm*a2*Tu],[S[0][1]+Tu*S[1][1]+sm*sm*a2*Tu,S[1][1]+sm*sm*Tu*Tu]];}
    return R;}
  /* 記録 R の中で、時刻 tt に最も近い番号 */
  function _w19_at(R,tt){var b=0,bd=1e9;for(var i=0;i<R.t.length;i++){var d=Math.abs(R.t[i]-tt);if(d<bd){bd=d;b=i;}}return b;}
  /* 時間の軸の帯（Plot P の上。xs の各点で lo〜hi） */
  function _w19_band(U,P,xs,lo,hi,c){var y0=Math.min(P.yr[0],P.yr[1]),y1=Math.max(P.yr[0],P.yr[1]),pts=[];
    function cl(v){return Math.max(y0,Math.min(y1,v));}
    for(var i=0;i<xs.length;i++)pts.push([P.X(xs[i]),P.Y(cl(hi[i]))]);for(var j=xs.length-1;j>=0;j--)pts.push([P.X(xs[j]),P.Y(cl(lo[j]))]);
    return U.S.PL(pts,"none",0,U.soft(c),null,0.75);}
  /* 間引いた点の並び */
  function _w19_pts(xs,ys,step,t0,t1){var o=[];for(var i=0;i<xs.length;i+=step){if(t0!=null&&(xs[i]<t0||xs[i]>t1))continue;o.push([xs[i],ys[i]]);}return o;}
  /* 誤差の楕円（7 章と同じ: 2 行 2 列の共分散から、長い半径・短い半径・向き） */
  function _w19_ell(a,b,c){var m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);return [Math.sqrt(m+r),Math.sqrt(Math.max(m-r,0)),0.5*Math.atan2(2*b,a-c)];}
  function _w19_ellpts(s1,s2,ang,cx,cy,k){var o=[];for(var i=0;i<=72;i++){var t=2*Math.PI*i/72,u=k*s1*Math.cos(t),v=k*s2*Math.sin(t);o.push([cx+u*Math.cos(ang)-v*Math.sin(ang),cy+u*Math.sin(ang)+v*Math.cos(ang)]);}return o;}

  /* ---- 3 節の後: 慣性航法だけで進めた位置のずれ（平面のモデル。f19.py の _f19_dr と同じ計算・同じ乱数の列） ---- */
  /* 街の道（例）: 15 m/s で東へ、左へ 90° 曲がって北へ、減速して右へ 90° 曲がり、加速する */
  function _w19_city(t){if(t>=20&&t<26)return [0,-15*_W19_D];if(t>=34&&t<38)return [-2.5,0];if(t>=40&&t<46)return [0,15*_W19_D];if(t>=46&&t<51)return [2,0];return [0,0];}
  function _w19_dr(U,o){var r=U.rng(o.seed*7+4),T=_W19_TS,N=Math.round(o.Tend/T),G=_W19_G,D=_W19_D;
    var s=o.v0,ps=90*D,e=0,n=0,s2=o.v0,ps2=90*D,e2=0,n2=0,th2=0,R={t:[],e:[],n:[],e2:[],n2:[],al:[],cr:[],ps:[]};
    for(var k=0;k<=N;k++){var t=k*T;
      if(k%10===0){var de=e2-e,dn=n2-n;R.t.push(t);R.e.push(e);R.n.push(n);R.e2.push(e2);R.n2.push(n2);R.al.push(de*Math.sin(ps)+dn*Math.cos(ps));R.cr.push(de*Math.cos(ps)-dn*Math.sin(ps));R.ps.push(ps);}
      var aw=o.route(t),a=aw[0],w=aw[1],z0=r.normal(),z1=r.normal(),z2=r.normal();
      var am=a+o.ba+_W19_SA*o.noise*z0,wm=w+(o.bg+_W19_SGD*o.noise*z1)*D,qm=o.bp?(o.bp+_W19_SGD*o.noise*z2)*D:0;
      th2+=qm*T;var af=am*Math.cos(th2)+G*Math.sin(th2);
      e2+=s2*Math.sin(ps2)*T+0.5*af*Math.sin(ps2)*T*T;n2+=s2*Math.cos(ps2)*T+0.5*af*Math.cos(ps2)*T*T;s2+=af*T;ps2+=wm*T;
      e+=s*Math.sin(ps)*T+0.5*a*Math.sin(ps)*T*T;n+=s*Math.cos(ps)*T+0.5*a*Math.cos(ps)*T*T;s+=a*T;ps+=w*T;}
    return R;}
  REG.w19_dr=function(el,U){
    var S=U.S;
    U.head(el,"DEAD RECKONING","慣性航法だけで進めた位置 — バイアスと雑音で、本当の道からずれていく");
    var r1=U.ctrls(el);
    var sRt=U.select(r1,"道",["まっすぐ東へ（本文の例）","街の道（曲がる・止まる）"],0,function(){run();});
    var sV=U.slider(r1,"速さ（まっすぐの道）",{min:5,max:30,step:1,value:20,fmt:function(v){return v+" m/s";},onInput:function(){run();}});
    var sN=U.slider(r1,"雑音（例の値の何倍か）",{min:0,max:5,step:0.5,value:1,fmt:function(v){return "× "+_w19_f(v,1);},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var sBa=U.slider(r2,U.htx("加速度センサのバイアス b_a"),{min:0,max:0.2,step:0.01,value:0.05,fmt:function(v){return _w19_f(v,2)+" m/s²";},onInput:function(){run();}});
    var sBg=U.slider(r2,"ジャイロのバイアス（向き）",{min:0,max:0.2,step:0.01,value:0.05,fmt:function(v){return _w19_f(v,2)+" °/s";},onInput:function(){run();}});
    var sBp=U.slider(r2,"ジャイロのバイアス（傾き。3 次元）",{min:0,max:0.2,step:0.01,value:0,fmt:function(v){return _w19_f(v,2)+" °/s";},onInput:function(){run();}});
    var br=U.btnrow(el),seed=1,R=null,G=null,cur=60,Tend=60;
    var bp=U.button(br,"再生",function(){if(tick.running()){tick.stop();bp.textContent="再生";return;}if(cur>=Tend-1e-9)cur=0;bp.textContent="止める";tick.start();});
    U.button(br,"本文の例",function(){tick.stop();bp.textContent="再生";sRt.set(0);sV.set(20);sN.set(1);sBa.set(0.05);sBg.set(0.05);sBp.set(0);seed=1;cur=Tend;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var tick=U.ticker(function(){cur=Math.min(Tend,cur+1);draw();if(cur>=Tend){tick.stop();bp.textContent="再生";}},70);
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){var city=sRt.get()===1;
      R=_w19_dr(U,{seed:seed,ba:sBa.get(),bg:sBg.get(),bp:sBp.get(),noise:sN.get(),Tend:Tend,route:city?_w19_city:function(){return [0,0];},v0:city?15:sV.get()});
      var rg=U.rng(seed*7+2);G=[];for(var j=0;j<=Tend;j++){var g1=rg.normal(),g2=rg.normal();G.push([j,_W19_SY*g1,_W19_SY*g2]);}
      draw();}
    function draw(){
      var nar=_w19_nar(box),Wd=nar?400:700,o=[],ic=Math.round(cur*10),city=sRt.get()===1;
      /* (a) 上から見た道の全体 */
      var e0=Infinity,e1=-Infinity,n0=Infinity,n1=-Infinity,i;
      for(i=0;i<R.t.length;i++){e0=Math.min(e0,R.e[i],R.e2[i]);e1=Math.max(e1,R.e[i],R.e2[i]);n0=Math.min(n0,R.n[i],R.n2[i]);n1=Math.max(n1,R.n[i],R.n2[i]);}
      var pw=nar?360:390,ph=nar?190:210,spanE=Math.max(e1-e0,50),spanN=Math.max(n1-n0,50),sc=Math.min(pw/spanE,ph/spanN)*0.9;
      var ce=(e0+e1)/2,cn=(n0+n1)/2,ox=nar?20:14,oy=34,P={X:function(v){return ox+pw/2+(v-ce)*sc;},Y:function(v){return oy+ph/2-(v-cn)*sc;}};
      o.push(S.T(nar?10:14,18,"(a) 上から見た道（"+(city?"街の道":"まっすぐ東へ "+sV.get()+" m/s")+"）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(ox,oy,pw,ph,2,"var(--screen)","line",1));
      var L=Math.pow(10,Math.floor(Math.log10(Math.max(spanE,spanN)/3)));o.push(S.L(ox+10,oy+ph-12,ox+10+L*sc,oy+ph-12,"ink",2));o.push(S.T(ox+10+L*sc/2,oy+ph-17,L+" m","middle",9,"ink",false,false,null,true));
      var tr=[],dr=[],full=[];for(i=0;i<=ic&&i<R.t.length;i+=5){tr.push([P.X(R.e[i]),P.Y(R.n[i])]);dr.push([P.X(R.e2[i]),P.Y(R.n2[i])]);}
      for(i=0;i<R.t.length;i+=10)full.push([P.X(R.e[i]),P.Y(R.n[i])]);
      o.push(S.PL(full,"faint",5,null,null));
      if(tr.length>1){o.push(S.PL(tr,"green",2.2));o.push(S.PL(dr,"alias",2));}
      var kc=Math.min(ic,R.t.length-1);
      o.push(S.D(P.X(R.e[kc]),P.Y(R.n[kc]),"green",5));o.push(S.D(P.X(R.e2[kc]),P.Y(R.n2[kc]),"alias",5));
      o.push(S.LEGL(ox+8,oy+16,[["green",null,"本当の道"],["alias",null,"慣性航法だけ"]],9,12));
      /* (b) 車のまわり（中心が本当の位置、右が進む向き） */
      var al=R.al[kc],crs=R.cr[kc],need=Math.max(Math.abs(al),Math.abs(crs),6)*1.15,half=[10,20,50,100,200,500,1000,3000].find(function(v){return v>=need;})||3000;
      var zx=nar?80:470,zy=nar?oy+ph+50:34,zw=nar?250:200,Z=U.plot(zx,zy,zw,zw,[-half,half],[-half,half]);
      o.push(S.T(nar?10:zx-20,zy-14+(nar?0:-2),"(b) 車のまわり（中心が本当の位置）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(Z.x,Z.y,Z.w,Z.h,2,"var(--screen)","line",1));
      o.push(Z.axes({xt:[-half,0,half],yt:[-half,0,half],sz:9,xl:"進む向き [m]",yl:"左 [m]",ylOff:36}));
      o.push(S.L(Z.X(0)-6,Z.Y(0),Z.X(0)+6,Z.Y(0),"green",2));o.push(S.L(Z.X(0),Z.Y(0)-6,Z.X(0),Z.Y(0)+6,"green",2));
      G.forEach(function(gq){if(gq[0]>cur||gq[0]<=cur-5)return;var k=Math.round(gq[0]*10),ps=R.ps[k],ga=gq[1]*Math.sin(ps)+gq[2]*Math.cos(ps),gc=gq[1]*Math.cos(ps)-gq[2]*Math.sin(ps);
        if(Math.abs(ga)<half&&Math.abs(gc)<half)o.push(S.D(Z.X(ga),Z.Y(-gc),"purple",2.6));});
      o.push(S.ARR(Z.X(0),Z.Y(0),Z.X(Math.max(-half,Math.min(half,al))),Z.Y(Math.max(-half,Math.min(half,-crs))),"alias",1.6,7));
      o.push(S.D(Z.X(Math.max(-half,Math.min(half,al))),Z.Y(Math.max(-half,Math.min(half,-crs))),"alias",4.5));
      o.push(S.D(Z.x+8,Z.y+10,"purple",2.6));o.push(S.T(Z.x+14,Z.y+13,"GNSS（直前の 5 s）","start",9,"purple",false,false,null,true));
      /* (c) 誤差の育ち方（両対数） */
      var qx=nar?60:70,qy=nar?zy+zw+70:Math.max(oy+ph,zy+zw)+64,qw=nar?320:610,qh=nar?190:170;
      var Q=U.plot(qx,qy,qw,qh,[1,60],[0.01,1000],{xlog:true,ylog:true});
      o.push(S.T(nar?10:14,qy-12,"(c) 位置の誤差の大きさ（両対数）","start",nar?10:10.5,"ink",true));
      o.push(Q.axes({xt:[1,2,5,10,20,60],yt:[0.01,0.1,1,10,100,1000],xl:"時間 t [s]",yl:"誤差 [m]",sz:9,xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:36}));
      var ba=sBa.get(),bg=sBg.get()*_W19_D,bpv=sBp.get()*_W19_D,sp=city?15:sV.get(),fa=[],fh=[],k2;
      for(k2=0;k2<=60;k2++){var tt=Math.pow(10,k2/60*Math.log10(60));fa.push([tt,ba*tt*tt/2+_W19_G*bpv*tt*tt*tt/6]);fh.push([tt,sp*bg*tt*tt/2]);}
      o.push(Q.clip(fa,"alias",1.3,"5 3"));o.push(Q.clip(fh,"purple",1.3,"5 3"));
      var aa=[],cc=[];for(i=10;i<=ic&&i<R.t.length;i+=2){aa.push([R.t[i],Math.max(Math.abs(R.al[i]),1e-3)]);cc.push([R.t[i],Math.max(Math.abs(R.cr[i]),1e-3)]);}
      if(aa.length>1){o.push(Q.clip(aa,"alias",2));o.push(Q.clip(cc,"purple",2));}
      o.push(S.LEGL(Q.x+8,Q.y+14,[["alias",null,"進む向き"],["purple",null,"横"],["muted","5 3","まっすぐの道の式（3 節）"]],9,10));
      box.set(S.svg(Wd,qy+qh+44,o));
      /* 読み出し */
      function at(tt){var j=Math.round(tt*10);return [R.al[j],R.cr[j]];}
      var h="時刻 <b>t = "+_w19_f(cur,0)+" s</b>: 進む向きの誤差 <b>"+_w19_f(R.al[kc],1)+" m</b>・横の誤差 <b>"+_w19_f(R.cr[kc],1)+" m</b><br>";
      var r10=at(10),r30=at(30),r60=at(60);
      h+="10 s・30 s・60 s で、進む向き "+_w19_f(r10[0],2)+"・"+_w19_f(r30[0],1)+"・"+_w19_f(r60[0],1)+" m、横 "+_w19_f(r10[1],2)+"・"+_w19_f(r30[1],1)+"・"+_w19_f(r60[1],1)+" m";
      if(!city)h+="<br>式（3 節）: b<sub>a</sub>t²/2"+(bpv?" + g b<sub>g</sub>t³/6":"")+" = "+_w19_f(ba*450+_W19_G*bpv*4500,1)+" m、ṗ b<sub>g</sub>t²/2 = "+_w19_f(sp*bg*450,1)+" m（30 s）";
      ro.innerHTML=h;}
    run();
  };

  /* ---- 4 節の後: 東と北の 2 つの軸に 4 節のフィルタを置き、トンネルを通る（f19.py の _f19_kf1 と同じ計算） ---- */
  /* 曲がる道（例）: 4 節の速さで走り、40〜50 s で左へ 45° 曲がって北東へ、130〜140 s で右へ 45° 曲がって東へ */
  function _w19_heading(t){if(t<40)return 90;if(t<50)return 90-4.5*(t-40);if(t<130)return 45;if(t<140)return 45+4.5*(t-130);return 90;}
  function _w19_road(curve){return function(ax){return function(t){
      var s=_w19_speed(t),a=_w19_acc1(t);
      if(!curve)return ax?0:a;
      var ps=_w19_heading(t)*_W19_D,w=0;if(t>=40&&t<50)w=-4.5*_W19_D;if(t>=130&&t<140)w=4.5*_W19_D;
      return ax?(a*Math.cos(ps)-s*w*Math.sin(ps)):(a*Math.sin(ps)+s*w*Math.cos(ps));};};}
  /* 4 節の速さ（加速度を積分した値） */
  function _w19_speed(t){if(t<10)return 0;if(t<30)return t-10;if(t<100)return 20;if(t<105)return 20-2*(t-100);if(t<125)return 10;if(t<130)return 10+2*(t-125);return 20;}
  var _W19_Q=[{nm:"良い（バイアス 0.01・雑音 0.005 m/s²）",ba:[0.01,-0.006],sa:0.005,sb:1e-4},
              {nm:"本文の例（バイアス 0.05・雑音 0.02 m/s²）",ba:[_W19_BA,_W19_BAN],sa:_W19_SA,sb:_W19_SB},
              {nm:"悪い（バイアス 0.2・雑音 0.05 m/s²）",ba:[0.2,-0.12],sa:0.05,sb:1e-3}];
  REG.w19_kf=function(el,U){
    var S=U.S;
    U.head(el,"GNSS + IMU","トンネルを走る車 — 融合した位置と、誤差の楕円・帯");
    var r1=U.ctrls(el);
    var sRt=U.select(r1,"道",["まっすぐ東へ（本文の例）","曲がる道"],0,function(){run();});
    var sUse=U.select(r1,"使うもの",["IMU と GNSS（本文の例）","GNSS だけ（動きのモデル）"],0,function(){run();});
    var sQ=U.select(r1,"センサの質",_W19_Q.map(function(q){return q.nm;}),1,function(){run();});
    var r2=U.ctrls(el);
    var sTu=U.slider(r2,"GNSS の更新の間隔",{values:[0.2,0.5,1,2,5],value:1,fmt:function(v){return v+" s";},onInput:function(){run();}});
    var sTl=U.slider(r2,"トンネルの長さ",{values:[0,10,30,60,90],value:30,fmt:function(v){return v+" s";},onInput:function(){run();}});
    var sSy=U.slider(r2,"GNSS の誤差 σ（東・北）",{min:0.5,max:5,step:0.5,value:2,fmt:function(v){return _w19_f(v,1)+" m";},onInput:function(){run();}});
    var r3=U.ctrls(el),cIns=U.checkbox(r3,"慣性航法だけの位置も描く",false,function(){draw();});
    var br=U.btnrow(el),seed=1,E=null,Nn=null,I=null,cur=0,Tend=180,tun=[90,120],truthE=null,truthN=null;
    var bp=U.button(br,"再生",function(){if(tick.running()){tick.stop();bp.textContent="再生";return;}if(cur>=Tend-1e-9)cur=0;bp.textContent="止める";tick.start();});
    U.button(br,"本文の例",function(){tick.stop();bp.textContent="再生";sRt.set(0);sUse.set(0);sQ.set(1);sTu.set(1);sTl.set(30);sSy.set(2);cIns.set(false);seed=1;cur=Tend;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var tick=U.ticker(function(){cur=Math.min(Tend,cur+1);draw();if(cur>=Tend){tick.stop();bp.textContent="再生";}},60);
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){var q=_W19_Q[+sQ.get()],L=sTl.get(),road=_w19_road(sRt.get()===1);
      tun=[90,90+L];Tend=150+L;cur=Math.min(cur||Tend,Tend);if(cur===0)cur=Tend;
      var base={seed:seed,bias:true,tun:tun,Tu:sTu.get(),sy:sSy.get(),sa:q.sa,sb:q.sb,Tend:Tend,every:10};
      if(sUse.get()===0){E=_w19_kf1(U,Object.assign({},base,{ba:q.ba[0],acc:road(0),axis:0}));Nn=_w19_kf1(U,Object.assign({},base,{ba:q.ba[1],acc:road(1),axis:1}));}
      else{E=_w19_kfm(U,Object.assign({},base,{acc:road(0),axis:0}));Nn=_w19_kfm(U,Object.assign({},base,{acc:road(1),axis:1}));}
      /* 本当の位置（0.1 s ごと）と、慣性航法だけの位置（同じ IMU の値・初めは正しい） */
      var N=Math.round(Tend/_W19_TS),tE=_w19_truth(N,road(0)),tN=_w19_truth(N,road(1)),rI=U.rng(seed*7+1),pe=0,ve=0,pn=0,vn=0,T=_W19_TS;
      truthE=[];truthN=[];I=[];
      for(var k=0;k<=N;k++){if(k%10===0){truthE.push(tE.P[k]);truthN.push(tN.P[k]);I.push([pe,pn]);}
        var a1=rI.normal(),a2=rI.normal(),ue=tE.A[k]+q.ba[0]+q.sa*a1,un=tN.A[k]+q.ba[1]+q.sa*a2;
        pe+=ve*T+0.5*ue*T*T;ve+=ue*T;pn+=vn*T+0.5*un*T*T;vn+=un*T;}
      draw();}
    function idx(R,t){return _w19_at(R,t);}
    function draw(){
      var nar=_w19_nar(box),Wd=nar?400:700,o=[],it=Math.min(truthE.length-1,Math.round(cur*10)),ie=idx(E,cur),inn=idx(Nn,cur);
      var inT=cur>=tun[0]&&cur<tun[1];
      /* (a) 道の全体 */
      var e0=Infinity,e1=-Infinity,n0=Infinity,n1=-Infinity,i;for(i=0;i<truthE.length;i+=10){e0=Math.min(e0,truthE[i]);e1=Math.max(e1,truthE[i]);n0=Math.min(n0,truthN[i]);n1=Math.max(n1,truthN[i]);}
      var pw=nar?360:390,ph=nar?150:190,sc=Math.min(pw/Math.max(e1-e0,100),ph/Math.max(n1-n0,100))*0.9,ox=nar?20:14,oy=34,ce=(e0+e1)/2,cn=(n0+n1)/2;
      function MX(v){return ox+pw/2+(v-ce)*sc;}function MY(v){return oy+ph/2-(v-cn)*sc;}
      o.push(S.T(nar?10:14,18,"(a) 道の全体（灰色の太い所がトンネル）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(ox,oy,pw,ph,2,"var(--screen)","line",1));
      var road=[],tu=[];for(i=0;i<truthE.length;i+=10){var tt=i/10;road.push([MX(truthE[i]),MY(truthN[i])]);if(tt>=tun[0]&&tt<=tun[1])tu.push([MX(truthE[i]),MY(truthN[i])]);}
      o.push(S.PL(road,"green",1.6));if(tu.length>1)o.push(S.PL(tu,"muted",7));
      o.push(S.D(MX(truthE[it]),MY(truthN[it]),"green",5));
      var Lm=Math.pow(10,Math.floor(Math.log10(Math.max(e1-e0,n1-n0)/3)));o.push(S.L(ox+pw-10-Lm*sc,oy+ph-12,ox+pw-10,oy+ph-12,"ink",2));o.push(S.T(ox+pw-10-Lm*sc/2,oy+ph-17,Lm+" m","middle",9,"ink",false,false,null,true));
      /* (b) 車のまわりの拡大（本当の位置が中心） */
      var se=E.sp[ie],sn=Nn.sp[inn],ee=E.err[ie],en=Nn.err[inn],need=Math.max(3*Math.max(se,sn),Math.abs(ee),Math.abs(en),3),half=[10,30,100,300,1000].find(function(v){return v>=need;})||1000;
      var zx=nar?70:470,zy=nar?oy+ph+48:34,zw=nar?260:200;
      var Z=U.plot(zx,zy,zw,zw,[-half,half],[-half,half]);
      o.push(S.T(nar?10:zx-20,nar?zy-14:18,"(b) 車のまわり（中心が本当の位置）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(Z.x,Z.y,Z.w,Z.h,2,"var(--screen)","line",1));
      o.push(Z.axes({xt:[-half,0,half],yt:[-half,0,half],sz:9,xl:"東 [m]",yl:"北 [m]",ylOff:34}));
      o.push(S.L(Z.X(0)-6,Z.Y(0),Z.X(0)+6,Z.Y(0),"green",2));o.push(S.L(Z.X(0),Z.Y(0)-6,Z.X(0),Z.Y(0)+6,"green",2));
      /* 最近の GNSS の点（本当の位置からの誤差） */
      for(i=0;i<E.gt.length;i++){if(E.gt[i]<=cur&&E.gt[i]>cur-5){var x=E.ge[i],y=Nn.ge[i];if(Math.abs(x)<half&&Math.abs(y)<half)o.push(S.D(Z.X(x),Z.Y(y),"purple",2.6));}}
      if(cIns.get()){var de=I[it][0]-truthE[it],dn=I[it][1]-truthN[it];if(Math.abs(de)<half&&Math.abs(dn)<half)o.push(S.D(Z.X(de),Z.Y(dn),"alias",4));else o.push(S.T(Z.x+Z.w-4,Z.y+Z.h-6,"慣性航法だけ: "+_w19_f(Math.hypot(de,dn),0)+" m 先","end",9,"alias",true,false,null,true));}
      var el2=_w19_ell(se*se,0,sn*sn);
      o.push(S.PL(_w19_ellpts(el2[0],el2[1],el2[2],ee,en,1).map(function(p){return [Z.X(Math.max(-half,Math.min(half,p[0]))),Z.Y(Math.max(-half,Math.min(half,p[1])))];}),"gold",1.8));
      if(Math.abs(ee)<half&&Math.abs(en)<half)o.push(S.D(Z.X(ee),Z.Y(en),"gold",4.5));
      /* (c)(d) 東と北の誤差の時間の変化 */
      var ty=nar?Z.y+Z.h+70:296,tw=nar?320:610,th=nar?80:84,tx=nar?60:70;
      var lim=Math.max(4,Math.min(400,Math.ceil(Math.max.apply(null,E.sp.concat(Nn.sp).map(function(v){return 2.2*v;}))/2)*2));
      [[E,"(c) 東の誤差","gold"],[Nn,"(d) 北の誤差","teal"]].forEach(function(q,j){var R=q[0],P=U.plot(tx,ty+j*(th+40),tw,th,[0,Tend],[-lim,lim]);
        o.push(S.T(nar?10:14,P.y-8,q[1]+"（帯は ±2σ）","start",nar?9.5:10,"ink",true));
        o.push(S.RECT(P.X(tun[0]),P.y,P.X(tun[1])-P.X(tun[0]),P.h,0,"var(--muted-soft)","none",0));
        o.push(P.axes({xt:U.nice(0,Tend,6),yt:[-lim,0,lim],sz:9,xl:j?"時間 t [s]":null,xfmt:j?null:function(){return "";},yl:"誤差 [m]",ylOff:36}));
        var st=R.t.length>2000?3:1,xs=[],lo=[],hi=[],pts=[];for(var i2=0;i2<R.t.length;i2+=st){xs.push(R.t[i2]);hi.push(2*R.sp[i2]);lo.push(-2*R.sp[i2]);pts.push([R.t[i2],R.err[i2]]);}
        o.push(_w19_band(U,P,xs,lo,hi,q[2]));o.push(P.clip(pts,q[2],1.5));
        o.push(S.L(P.X(cur),P.y,P.X(cur),P.y+P.h,"ink",1,"3 3"));});
      box.set(S.svg(Wd,ty+2*(th+40)+18,o));
      /* 読み出し */
      var i0=idx(E,tun[0]-0.1),i1=idx(E,tun[1]-0.1);
      var h="時刻 <b>t = "+_w19_f(cur,0)+" s</b>（"+(inT?'<span class="warn">トンネルの中: 予測だけ</span>':"GNSS あり")+"）: 位置の誤差 東 "+_w19_f(ee,2)+" m・北 "+_w19_f(en,2)+" m、標準偏差 東 "+_w19_f(se,2)+" m・北 "+_w19_f(sn,2)+" m<br>";
      if(tun[1]>tun[0])h+="東の標準偏差: トンネルの入口の直前 <b>"+_w19_f(E.sp[i0],2)+" m</b> → 出口の直前 <b>"+_w19_f(E.sp[i1],2)+" m</b>（出口の誤差 "+_w19_f(E.err[i1],2)+" m）";
      if(sUse.get()===0){var qb=_W19_Q[+sQ.get()];h+="<br>バイアスの推定（東）: "+_w19_f(E.b[ie],4)+" m/s²（本当は "+_w19_f(qb.ba[0],3)+"、σ "+_w19_f(E.sb[ie],4)+"）";}
      ro.innerHTML=h;}
    run();
  };

  /* ---- 4 節の後: バイアスを状態に入れたフィルタと、入れないフィルタ（同じ IMU と GNSS の値） ---- */
  REG.w19_bias=function(el,U){
    var S=U.S;
    U.head(el,"BIAS STATE","バイアスを状態に入れる・入れない — 同じ値で比べる");
    var r1=U.ctrls(el);
    var sB=U.slider(r1,U.htx("本当のバイアス b_a"),{min:0,max:0.2,step:0.01,value:0.05,fmt:function(v){return _w19_f(v,2)+" m/s²";},onInput:function(){run();}});
    var sTl=U.slider(r1,"トンネルの長さ",{values:[0,10,30,60],value:30,fmt:function(v){return v+" s";},onInput:function(){run();}});
    var sW=U.slider(r1,"入れないフィルタが見込む加速度の雑音",{values:[1,3,10,30,100],value:1,fmt:function(v){return "例の値の "+v+" 倍";},onInput:function(){run();}});
    var br=U.btnrow(el),seed=1,A=null,B=null,tun=[90,120],Tend=180;
    U.button(br,"本文の例",function(){sB.set(0.05);sTl.set(30);sW.set(1);seed=1;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){var L=sTl.get();tun=[90,90+L];Tend=150+L;
      var base={seed:seed,tun:tun,Tu:1,sy:_W19_SY,ba:sB.get(),sa:_W19_SA,sb:_W19_SB,Tend:Tend,acc:_w19_acc1,axis:0,every:10};
      A=_w19_kf1(U,Object.assign({},base,{bias:true}));B=_w19_kf1(U,Object.assign({},base,{bias:false,wscale:sW.get()*sW.get()}));draw();}
    function frac(R){var n=0;for(var i=0;i<R.t.length;i++)if(Math.abs(R.err[i])>2*R.sp[i])n++;return n/R.t.length;}
    function draw(){
      var nar=_w19_nar(box),Wd=nar?400:700,o=[],tx=nar?60:70,tw=nar?320:610,th=nar?96:110;
      var mA=0,mB=0,i;for(i=0;i<A.t.length;i++){mA=Math.max(mA,Math.abs(A.err[i]),2*A.sp[i]);mB=Math.max(mB,Math.abs(B.err[i]));}
      function nic(v){var s=[2,4,8,10,20,40,80,100,200,400,800,1000,2000,5000];for(var k=0;k<s.length;k++)if(s[k]>=v)return s[k];return 10000;}
      var la=nic(mA*1.05),lb=nic(mB*1.05);
      [[A,"(a) バイアスを状態に入れる","gold",la],[B,"(b) バイアスを状態に入れない","alias",lb]].forEach(function(q,j){var R=q[0],P=U.plot(tx,30+j*(th+44),tw,th,[0,Tend],[-q[3],q[3]]);
        o.push(S.T(nar?10:14,P.y-10,q[1]+"（線: 誤差、帯: ±2σ）","start",nar?9.5:10.5,"ink",true));
        o.push(S.RECT(P.X(tun[0]),P.y,P.X(tun[1])-P.X(tun[0]),P.h,0,"var(--muted-soft)","none",0));
        o.push(P.axes({xt:U.nice(0,Tend,6),yt:[-q[3],0,q[3]],sz:9,xfmt:function(){return "";},yl:"誤差 [m]",ylOff:36}));
        var xs=[],lo=[],hi=[],pts=[];for(var i2=0;i2<R.t.length;i2+=2){xs.push(R.t[i2]);hi.push(2*R.sp[i2]);lo.push(-2*R.sp[i2]);pts.push([R.t[i2],R.err[i2]]);}
        o.push(_w19_band(U,P,xs,lo,hi,q[2]));o.push(P.clip(pts,q[2],1.6));o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",0.8));});
      /* (c) バイアスの推定 */
      var y3=30+2*(th+44),bmax=Math.max(0.1,Math.ceil((sB.get()+0.05)*20)/20),P3=U.plot(tx,y3,tw,th,[0,Tend],[-bmax,bmax]);
      o.push(S.T(nar?10:14,y3-10,"(c) (a) のフィルタのバイアスの推定（±2σ）と、本当の値","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(P3.X(tun[0]),P3.y,P3.X(tun[1])-P3.X(tun[0]),P3.h,0,"var(--muted-soft)","none",0));
      o.push(P3.axes({xt:U.nice(0,Tend,6),yt:[-bmax,0,bmax],sz:9,xl:"時間 t [s]",yl:"バイアス [m/s²]",ylOff:40,yfmt:function(v){return _w19_f(v,2);}}));
      var xs=[],lo=[],hi=[],pts=[];for(i=0;i<A.t.length;i+=2){xs.push(A.t[i]);hi.push(A.b[i]+2*A.sb[i]);lo.push(A.b[i]-2*A.sb[i]);pts.push([A.t[i],A.b[i]]);}
      o.push(_w19_band(U,P3,xs,lo,hi,"gold"));o.push(P3.clip(pts,"gold",1.6));o.push(S.L(P3.x,P3.Y(sB.get()),P3.x+P3.w,P3.Y(sB.get()),"green",1.4,"5 3"));
      box.set(S.svg(Wd,y3+th+44,o));
      var i0=_w19_at(A,tun[0]-0.1),i1=_w19_at(A,tun[1]-0.1),fa=frac(A),fb=frac(B);
      var h="入れる: トンネルの入口の直前 誤差 "+_w19_f(A.err[i0],2)+" m（σ "+_w19_f(A.sp[i0],2)+" m）→ 出口の直前 <b>"+_w19_f(A.err[i1],2)+" m</b>（σ "+_w19_f(A.sp[i1],2)+" m）・帯の外 "+_w19_f(fa*100,1)+" %<br>";
      h+="入れない: 入口の直前 誤差 "+_w19_f(B.err[i0],1)+" m（σ "+_w19_f(B.sp[i0],2)+" m）→ 出口の直前 <b>"+_w19_f(B.err[i1],1)+" m</b>（σ "+_w19_f(B.sp[i1],2)+" m）・帯の外 "+(fb>0.05?'<span class="warn">'+_w19_f(fb*100,1)+" %</span>":_w19_f(fb*100,1)+" %");
      ro.innerHTML=h;}
    run();
  };
