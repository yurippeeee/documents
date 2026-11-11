  /* ===== 18 章 多周波と PPP ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w18_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w18_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W18_C=299792458,_W18_D=Math.PI/180,_W18_F1=1575.42e6;
  /* 2 つ目の周波数の候補（f_1 は L1） */
  var _W18_F2=[["L1 と L2",1227.60e6,"L2"],["L1 と L5（E5a・B2a）",1176.45e6,"L5"],["L1 と E5b（B2b）",1207.14e6,"E5b"],["L1 と L6（E6）",1278.75e6,"L6"]];
  var _W18_B7=[1.5,3.5,0.4,1.0,0.5];   /* 7 章 6 節の予算（代表値） */
  function _w18_coef(f1,f2){var d=f1*f1-f2*f2;return [f1*f1/d,f2*f2/d];}
  function _w18_k(f1,f2){return Math.sqrt(Math.pow(f1,4)+Math.pow(f2,4))/(f1*f1-f2*f2);}
  function _w18_iono(tec,f){return 40.3*tec*1e16/(f*f);}
  /* 7 章 2 節の薄い殻のマッピング関数（R_E = 6371 km、h_I = 350 km） */
  function _w18_mI(el){var s=6371*Math.cos(el*_W18_D)/(6371+350);return 1/Math.sqrt(1-s*s);}

  /* ---- 1 節の後: 2 つの周波数の擬似距離と、電離層フリー結合 ---- */
  REG.w18_ionofree=function(el,U){
    var S=U.S;
    U.head(el,"IONOSPHERE-FREE","2 つの周波数の遅れと雑音、電離層フリー結合");
    var r1=U.ctrls(el);
    var sF=U.select(r1,"周波数の組",_W18_F2.map(function(q){return q[0];}),0,function(){draw();});
    var sT=U.slider(r1,"TEC",{min:1,max:150,step:1,value:25,fmt:function(v){return v+" TECU";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var sE=U.slider(r2,"仰角",{min:5,max:90,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var sS=U.slider(r2,"マルチパスと雑音（1 つの周波数）",{min:0.1,max:3,step:0.01,value:1.12,fmt:function(v){return _w18_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（L1/L2・25 TECU・30°・1.12 m）",function(){sF.set(0);sT.set(25);sE.set(30);sS.set(1.12);seed=1;draw();});
    U.button(br,"L1/L5 にする",function(){sF.set(1);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var q=_W18_F2[sF.get()],f2=q[1],tec=sT.get(),th=sE.get(),sg=sS.get(),nar=_w18_nar(box),Wd=nar?400:700,o=[];
      var cf=_w18_coef(_W18_F1,f2),kk=_w18_k(_W18_F1,f2),mI=_w18_mI(th),I1=_w18_iono(tec,_W18_F1)*mI,I2=I1*Math.pow(_W18_F1/f2,2);
      /* 乱数で 2 つの周波数のマルチパスと雑音を作る */
      var rng=U.rng(seed*7919+18),N=4000,a1=[],a2=[],aI=[],s1=0,s2=0,sI=0,m1=0,m2=0,mIf=0;
      for(var i=0;i<N;i++){var x1=rng.normal()*sg,x2=rng.normal()*sg,p1=I1+x1,p2=I2+x2,pf=cf[0]*p1-cf[1]*p2;
        if(i<200){a1.push(p1);a2.push(p2);aI.push(pf);}m1+=p1;m2+=p2;mIf+=pf;s1+=p1*p1;s2+=p2*p2;sI+=pf*pf;}
      m1/=N;m2/=N;mIf/=N;var d1=Math.sqrt(s1/N-m1*m1),d2=Math.sqrt(s2/N-m2*m2),dI=Math.sqrt(sI/N-mIf*mIf);
      /* (a) 項ごとの帯 */
      var x0=nar?8:14,lw=nar?44:52,xa=x0+lw+52,sc=Math.min(16,(nar?222:212)/Math.max(I2*cf[1],1));
      o.push(S.T(x0,16,"(a) 1 つの衛星の擬似距離（D は共通の項。縮めて描いた）","start",nar?9.5:10.5,"ink",true));
      function bar(y,lab,iono,col,dash,txt){o.push(S.TX(x0+lw,y+13,lab,"end",10.5,col||"ink",true));
        o.push(S.RECT(xa-50,y,48,18,2,U.soft("signal"),"signal",1.1));o.push(S.T(xa-26,y+13,"D","middle",10,"signal",true));
        if(iono>0.0005){o.push(S.RECT(xa,y,iono*sc,18,2,dash?"none":U.soft("gold"),"gold",1.1,dash?"3 2":null));}
        o.push(S.TX(xa+Math.max(iono,0)*sc+5,y+13,txt,"start",9.5,"gold",true,true));}
      bar(28,"ρ_1",I1,null,false,"I_1 = "+_w18_f(I1,2)+" m");
      bar(52,"ρ_2",I2,null,false,"I_2 = "+_w18_f(I2,2)+" m");
      o.push(S.T(x0+lw,90,"× "+_w18_f(cf[0],3),"end",10,"ink",true));o.push(S.RECT(xa,78,I1*cf[0]*sc,14,2,U.soft("gold"),"gold",1));
      o.push(S.T(xa+I1*cf[0]*sc+5,90,"+"+_w18_f(I1*cf[0],2)+" m","start",9.5,"gold",true,false,null,true));
      o.push(S.T(x0+lw,110,"× (−"+_w18_f(cf[1],3)+")","end",10,"ink",true));o.push(S.RECT(xa,98,I2*cf[1]*sc,14,2,"none","gold",1,"3 2"));
      o.push(S.T(xa+I2*cf[1]*sc+5,110,"−"+_w18_f(I2*cf[1],2)+" m","start",9.5,"gold",true,false,null,true));
      o.push(S.L(x0,120,nar?392:396,120,"line",1));
      bar(126,"ρ_IF",0,"green",false,"電離層 "+_w18_f(I1*cf[0]-I2*cf[1],2)+" m");
      /* (b) 乱数で作った 200 回の値 */
      var bx=nar?60:420,by=nar?182:40,bw=nar?320:262,P=U.plot(bx,by,bw,120,[-12,Math.max(16,I2+4*sg)],[0,3]);
      o.push(S.T(nar?x0:bx-40,by-18,"(b) D を引いた残り（200 回）","start",nar?9.5:10.5,"ink",true));
      o.push(P.axes({xt:U.nice(-12,Math.max(16,I2+4*sg),6),yt:[],sz:9,xl:"値 [m]",xfmt:function(v){return _w18_f(v,0);}}));
      var jr=U.rng(seed+5);
      [[a1,"ρ_1 − D","gold",m1,d1],[a2,"ρ_2 − D","gold",m2,d2],[aI,"ρ_IF − D","green",mIf,dI]].forEach(function(r,k){var yc=2.5-k;
        o.push(S.TX(P.x-6,P.Y(yc)+4,r[1],"end",9.5,"ink",true));
        r[0].forEach(function(v){if(v>P.xr[0]&&v<P.xr[1])o.push(S.D(P.X(v),P.Y(yc+0.56*(jr.next()-0.5)),r[2],1.2));});
        o.push(S.L(P.X(Math.max(P.xr[0],Math.min(P.xr[1],r[3]))),P.Y(yc)-12,P.X(Math.max(P.xr[0],Math.min(P.xr[1],r[3]))),P.Y(yc)+12,"ink",2));});
      /* (c) UERE */
      var cy=nar?by+180:200,u1=Math.sqrt(_W18_B7[0]*_W18_B7[0]+Math.pow(0.5*I1,2)+_W18_B7[2]*_W18_B7[2]+sg*sg),uf=Math.sqrt(_W18_B7[0]*_W18_B7[0]+_W18_B7[2]*_W18_B7[2]+Math.pow(kk*sg,2));
      var cx=nar?118:150,cw=nar?200:400,um=Math.max(u1,uf)*1.15;
      o.push(S.T(x0,cy-6,"(c) UERE（7 章の予算。電離層はクロブッチャー・モデルで直した後の半分が残るとした）","start",nar?9:10.5,"ink",true));
      [["L1 だけ",u1,"alias"],["2 周波（"+q[2]+"）",uf,"green"]].forEach(function(r,k){var y=cy+6+k*24;
        o.push(S.T(cx-8,y+13,r[0],"end",10,"ink",true));o.push(S.RECT(cx,y,cw*r[1]/um,18,2,U.soft(r[2]),r[2],1.2));
        o.push(S.T(cx+cw*r[1]/um+5,y+13,_w18_f(r[1],2)+" m","start",10,r[2],true,false,null,true));});
      box.set(S.svg(Wd,cy+60,o));
      var be=Math.sqrt(kk*kk-1)*sg,win=uf<u1;
      var h="係数 "+_w18_f(cf[0],3)+"・−"+_w18_f(cf[1],3)+"（和 "+_w18_f(cf[0]-cf[1],3)+"）。斜めの遅れ（マッピング関数 "+_w18_f(mI,2)+" 倍）I<sub>1</sub> = <b>"+_w18_f(I1,2)+" m</b>、I<sub>2</sub> = "+_w18_f(I2,2)+" m → 結合の後 <b>"+_w18_f(I1*cf[0]-I2*cf[1],2)+" m</b><br>";
      h+="マルチパスと雑音の倍率 κ = √(f<sub>1</sub><sup>4</sup> + f<sub>2</sub><sup>4</sup>)/(f<sub>1</sub><sup>2</sup> − f<sub>2</sub><sup>2</sup>) = <b>"+_w18_f(kk,3)+"</b>、乱数 "+N+" 回で "+_w18_f(dI/Math.sqrt((d1*d1+d2*d2)/2),3)+"（σ: "+_w18_f(d1,2)+" m・"+_w18_f(d2,2)+" m → "+_w18_f(dI,2)+" m）<br>";
      h+="電離層の誤差（遅れの半分）σ<sub>I</sub> = "+_w18_f(0.5*I1,2)+" m。2 周波が得をする境目 √(κ<sup>2</sup> − 1)σ = <b>"+_w18_f(be,2)+" m</b> → "+(win?'<span class="ok">2 周波のほうが UERE が小さい</span>':'<span class="warn">L1 だけのほうが UERE が小さい</span>');
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 4 節の後: PPP の収束（図の f18.py と同じモデル） ---- */
  var _W18_SYSS={GPS:["GPS"],ALL:["GPS","Galileo","BeiDou","QZSS"]},_W18_EPC={};
  function _w18_mT(el){var s=Math.sin(el*_W18_D);return 1.001/Math.sqrt(0.002001+s*s);}
  /* 観測の時刻ごとの、見える衛星 [名前, 仰角, 方位角]（東京、仰角マスク以上） */
  function _w18_epochs(U,sysk,dt,T,mask){var key=sysk+"|"+dt+"|"+T+"|"+mask;if(_W18_EPC[key])return _W18_EPC[key];
    var con=U.gnss.constellation(),rx=U.gnss.rx(U.gnss.TOKYO[0],U.gnss.TOKYO[1],U.gnss.TOKYO[2]),sys=_W18_SYSS[sysk],ep=[];
    for(var k=0;k<=Math.round(T/dt);k++){var t=k*dt,v=[];con.forEach(function(s){if(sys.indexOf(s.sys)<0)return;var ea=U.gnss.elaz(rx,U.gnss.ecef(s,t));if(ea[0]>=mask)v.push([s.nm,ea[0],ea[1]]);});ep.push({t:t,v:v});}
    _W18_EPC[key]=ep;return ep;}
  /* 2 次元の正規分布で 95 % が入る円の半径（f18.py の _f18_r95 と同じ計算） */
  function _w18_r95(a,b,c){var m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b),s1=Math.sqrt(m+r),s2=Math.sqrt(Math.max(m-r,1e-30)),q=[],i;
    for(i=0;i<720;i++){var ph=2*Math.PI*i/720,cc=Math.cos(ph),ss=Math.sin(ph);q.push(cc*cc/(s1*s1)+ss*ss/(s2*s2));}
    var lo=0,hi=10*(s1+s2);for(var it=0;it<60;it++){var md=(lo+hi)/2,sm=0;for(i=0;i<720;i++)sm+=(1-Math.exp(-md*md*q[i]/2))/q[i];if(sm/720/(s1*s2)<0.95)lo=md;else hi=md;}
    return (lo+hi)/2;}
  /* モデル: 位置（東・北・上）・対流圏の湿潤の部分（tropo のとき）・衛星ごとの実数の β を、観測ごとに受信機の時計を消して最小二乗法で推定する。
     返り値 [{t, n（見える衛星の数）, r95, su（上の標準偏差）, e, nn（乱数で作った 1 回の推定の誤差）}] */
  function _w18_conv(U,o){var ep=_w18_epochs(U,o.sys,30,3600,10),names=[],off=o.tropo?4:3,mat=U.ctl.mat;
    ep.forEach(function(e){e.v.forEach(function(q){if(names.indexOf(q[0])<0)names.push(q[0]);});});
    var nx=off+names.length,J=mat.zeros(nx,nx),z=[],seen=[],out=[],rng=U.rng(o.seed||1),i,j;
    for(i=0;i<nx;i++)z.push(0);
    ep.forEach(function(e){var rows=[],W=[],ev=[];
      e.v.forEach(function(q){var jj=off+names.indexOf(q[0]);if(seen.indexOf(jj)<0)seen.push(jj);
        var ce=Math.cos(q[1]*_W18_D),se=Math.sin(q[1]*_W18_D),h=[];for(var k=0;k<nx;k++)h.push(0);
        h[0]=-ce*Math.sin(q[2]*_W18_D);h[1]=-ce*Math.cos(q[2]*_W18_D);h[2]=-se;if(o.tropo)h[3]=_w18_mT(q[1]);
        var g=h.slice();g[jj]=1;rows.push(h);W.push(1/(o.sP*o.sP));ev.push(rng.normal()*o.sP);rows.push(g);W.push(1/(o.sL*o.sL));ev.push(rng.normal()*o.sL);});
      var sw=0,swe=0,u=[];for(i=0;i<nx;i++)u.push(0);
      rows.forEach(function(h,r){sw+=W[r];swe+=W[r]*ev[r];for(i=0;i<nx;i++)if(h[i]!==0)u[i]+=W[r]*h[i];});
      rows.forEach(function(h,r){for(i=0;i<nx;i++){if(h[i]===0)continue;z[i]+=W[r]*h[i]*ev[r];for(j=0;j<nx;j++)if(h[j]!==0)J[i][j]+=W[r]*h[i]*h[j];}});
      for(i=0;i<nx;i++){z[i]-=u[i]*swe/sw;if(u[i]===0)continue;for(j=0;j<nx;j++)if(u[j]!==0)J[i][j]-=u[i]*u[j]/sw;}
      var idx=[];for(i=0;i<off;i++)idx.push(i);seen.slice().sort(function(a,b){return a-b;}).forEach(function(v){idx.push(v);});
      var Js=idx.map(function(a){return idx.map(function(b){return J[a][b];});}),Cv=mat.inv(Js),xe=0,xn=0;
      for(i=0;i<idx.length;i++){xe+=Cv[0][i]*z[idx[i]];xn+=Cv[1][i]*z[idx[i]];}
      out.push({t:e.t,n:e.v.length,r95:_w18_r95(Cv[0][0],Cv[0][1],Cv[1][1]),su:Math.sqrt(Cv[2][2]),e:xe,nn:xn});});
    return out;}
  function _w18_tconv(res,th){for(var i=0;i<res.length;i++){var ok=true;for(var j=i;j<res.length;j++)if(res[j].r95>=th){ok=false;break;}if(ok)return res[i].t;}return null;}
  var _W18_RTK=[10,0.8,0.02],_W18_CLAS=[60,1.5,0.06];   /* 比べる代表値（モデルではない）: 整数が決まる時刻 [s]・それまでと後の R95 [m] */

  REG.w18_converge=function(el,U){
    var S=U.S;
    U.head(el,"PPP CONVERGENCE","PPP の水平の誤差が時間とともに縮む様子（モデル）と、RTK・PPP-RTK の代表値");
    var r1=U.ctrls(el);
    var sSys=U.select(r1,"衛星系",["GPS だけ","4 つ（GPS・Galileo・BeiDou・みちびき）"],0,function(){recalc();});
    var sTr=U.select(r1,"対流圏の湿潤の部分",["推定する","補正で直す"],0,function(){recalc();});
    var r2=U.ctrls(el);
    var sP=U.slider(r2,"擬似距離の誤差 σ（結合の後）",{min:0.3,max:5,step:0.01,value:3.33,fmt:function(v){return _w18_f(v,2)+" m";},onInput:function(){recalc();}});
    var sL=U.slider(r2,"位相の誤差 σ（結合の後）",{min:0.5,max:5,step:0.1,value:2.1,fmt:function(v){return _w18_f(v,1)+" cm";},onInput:function(){recalc();}});
    var br=U.btnrow(el),seed=1,cur=120,res=null;
    function stopT(){tk.stop();}
    U.button(br,"本文の例（PPP・GPS）",function(){stopT();sSys.set(0);sTr.set(0);sP.set(3.33);sL.set(2.1);seed=1;cur=120;recalc();});
    U.button(br,"電離層・対流圏を補正した例",function(){stopT();sSys.set(0);sTr.set(1);sP.set(1.12);sL.set(2.1);cur=120;recalc();});
    U.button(br,"再生",function(){cur=0;draw();tk.start();});
    U.button(br,"止める",function(){stopT();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;recalc();});
    var tk=U.ticker(function(){if(!res)return;cur++;if(cur>=res.length-1){cur=res.length-1;tk.stop();}draw();},70);
    var box=U.svgbox(el),ro=U.readout(el);
    function recalc(){res=_w18_conv(U,{sys:sSys.get()===0?"GPS":"ALL",tropo:sTr.get()===0,sP:sP.get(),sL:sL.get()/100,seed:seed*104729+18});if(cur>res.length-1)cur=res.length-1;draw();}
    function draw(){if(!res)return;
      var nar=_w18_nar(box),Wd=nar?400:700,o=[],k=cur,rk=res[k],tc=_w18_tconv(res,0.10);
      /* (a) R95 と時間 */
      var P=U.plot(nar?56:62,30,nar?320:380,nar?200:230,[0,60],[0.01,10],{ylog:true});
      o.push(S.T(nar?8:14,16,"(a) 水平の R95 と、始めてからの時間","start",nar?9.5:10.5,"ink",true));
      o.push(P.axes({xl:"時間 [分]",yl:"水平の R95 [m]",xt:[0,10,20,30,40,50,60],yt:[0.01,0.1,1,10],sz:9,yfmt:function(v){return v>=1?String(v):String(v);}}));
      o.push(S.L(P.x,P.Y(0.1),P.x+P.w,P.Y(0.1),"alias",1.2,"5 3"));o.push(S.T(P.x+P.w-3,P.Y(0.1)-4,"10 cm","end",9,"alias",true,false,null,true));
      o.push(S.L(P.x,P.Y(6.6),P.x+P.w,P.Y(6.6),"muted",1.1,"2 3"));o.push(S.T(P.x+P.w-3,P.Y(6.6)-4,"単独 6.6 m","end",9,"muted",true,false,null,true));
      [[_W18_RTK,"green"],[_W18_CLAS,"purple"]].forEach(function(r){var q=r[0];o.push(P.clip([[0,q[1]],[q[0]/60,q[1]],[q[0]/60,q[2]],[60,q[2]]],r[1],1.8,"7 3"));});
      o.push(S.T(P.X(2.5),P.Y(0.02)-4,"RTK（代表値）","start",9,"green",true,false,null,true));
      o.push(S.T(P.X(2.5),P.Y(0.06)-4,"PPP-RTK（CLAS の基準）","start",9,"purple",true,false,null,true));
      o.push(P.clip(res.map(function(r){return [r.t/60,r.r95];}),"gold",1.2,"3 3"));
      o.push(P.clip(res.slice(0,k+1).map(function(r){return [r.t/60,r.r95];}),"gold",2.4));
      res.slice(0,k+1).forEach(function(r){var hv=Math.hypot(r.e,r.nn);if(hv>0.01&&hv<10)o.push(S.D(P.X(r.t/60),P.Y(hv),"teal",1.8));});
      o.push(S.L(P.X(rk.t/60),P.y,P.X(rk.t/60),P.y+P.h,"ink",1,"2 2"));
      if(tc!==null){o.push(S.L(P.X(tc/60),P.Y(0.1),P.X(tc/60),P.y+P.h,"gold",1,"2 2"));o.push(S.T(P.X(tc/60)+3,P.y+P.h-5,_w18_f(tc/60,1)+" 分","start",9,"gold",true,false,null,true));}
      o.push(S.LEGL(nar?8:14,P.y+P.h+46,[["gold",null,"R95（モデル）"],["teal",null,"1 回の推定の誤差（点）"]],9,12));
      /* (b) 東西・南北の平面 */
      var lim=1.0,cx=nar?60:500,cy=nar?P.y+P.h+86:44,cw=nar?260:180,Q=U.plot(cx,cy,cw,cw,[-lim,lim],[-lim,lim]);
      o.push(S.T(nar?8:cx-20,cy-14,"(b) 推定した位置の誤差 [m]","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,2,"var(--screen)","line",1));o.push(Q.axes({xt:[-1,-0.5,0,0.5,1],yt:[-1,-0.5,0,0.5,1],sz:8.5,xfmt:function(v){return _w18_f(v,1);},yfmt:function(v){return _w18_f(v,1);}}));
      [0.1,0.5].forEach(function(r){var c=[];for(var a=0;a<=72;a++)c.push([r*Math.cos(2*Math.PI*a/72),r*Math.sin(2*Math.PI*a/72)]);o.push(Q.clip(c,"faint",1,"3 3"));});
      var cr=[];for(var a=0;a<=96;a++)cr.push([rk.r95*Math.cos(2*Math.PI*a/96),rk.r95*Math.sin(2*Math.PI*a/96)]);o.push(Q.clip(cr,"gold",1.8,"5 3"));
      var tr=res.slice(Math.max(0,k-40),k+1).map(function(r){return [Math.max(-lim,Math.min(lim,r.e)),Math.max(-lim,Math.min(lim,r.nn))];});
      if(tr.length>1)o.push(Q.line(tr,"teal",1.1));
      o.push(S.L(Q.X(0)-6,Q.Y(0),Q.X(0)+6,Q.Y(0),"green",2));o.push(S.L(Q.X(0),Q.Y(0)-6,Q.X(0),Q.Y(0)+6,"green",2));
      var ex=Math.max(-lim,Math.min(lim,rk.e)),ey=Math.max(-lim,Math.min(lim,rk.nn));o.push(S.D(Q.X(ex),Q.Y(ey),"teal",4.5));
      o.push(S.T(Q.x+Q.w/2,Q.y+Q.h+30,"横: 東西、縦: 南北。破線の円: 10 cm・50 cm","middle",8.5,"muted"));
      o.push(S.T(Q.x+Q.w/2,Q.y+Q.h+43,"金の破線: R95（モデル）","middle",8.5,"gold",true));
      box.set(S.svg(Wd,nar?cy+cw+56:Math.max(P.y+P.h+60,cy+cw+56),o));
      var hv=Math.hypot(rk.e,rk.nn);
      var h="時刻 <b>"+_w18_f(rk.t/60,1)+" 分</b>（"+(k+1)+" 回目のエポック）・見えている衛星 "+rk.n+"・R95（モデル）<b>"+_w18_f(100*rk.r95,1)+" cm</b>・上の標準偏差 "+_w18_f(100*rk.su,1)+" cm・この回の水平の誤差 "+_w18_f(100*hv,1)+" cm<br>";
      h+="R95 が 10 cm を下回って保つまで: "+(tc===null?'<span class="warn">60 分では届かない</span>':"<b>"+_w18_f(tc/60,1)+" 分</b>")+"（RTK は数秒〜数十秒、CLAS は 1 分以内。どちらも代表値・基準）";
      h+='<div class="wnote">東京の止まった受信機、1 章の配置、仰角 10° 以上、30 s ごとのエポック。未知数は位置・受信機の時計（エポックごと）・'+(sTr.get()===0?"対流圏の湿潤の部分・":"")+'衛星ごとの実数の整数値バイアス。誤差はエポックごとに独立な正規分布（実際の誤差はゆっくり変わるので、収束はこれより遅く、数 cm で止まる）。</div>';
      ro.innerHTML=h;
    }
    recalc();
  };

  /* ---- 6 節の後: 条件に合う方式 ---- */
  /* 名前, 初期化の時間 [s] の範囲, 水平の 95 % [m] の範囲, 色, 受信機（0 L1 だけ・1 多周波・2 多周波と L6）, 通信が要るか, 場所（0 どこでも・1 日本・2 アジア・オセアニア・3 SBAS の範囲） */
  var _W18_METH=[["単独（L1）",[1,35],[3.6,8.2],"signal",0,false,0],["SBAS",[40,300],[1.5,3.0],"signal",0,false,3],["SLAS",[40,300],[0.6,1.0],"signal",0,false,1],
    ["DGNSS",[3,30],[1.5,3.0],"signal",0,true,0],["RTK",[2,60],[0.01,0.04],"green",1,true,0],["CLAS",[20,60],[0.04,0.12],"purple",2,false,1],
    ["PPP（インターネット）",[600,1800],[0.05,0.3],"gold",1,true,0],["PPP（MADOCA の L6E）",[600,1800],[0.05,0.3],"gold",2,false,2]];
  REG.w18_choose=function(el,U){
    var S=U.S;
    U.head(el,"CHOOSE A METHOD","要る精度・待てる時間・通信・受信機・場所から、合う方式を選ぶ");
    var accs=[10,3,1,0.3,0.1,0.03],tms=[10,60,300,1800,3600];
    var r1=U.ctrls(el);
    var sA=U.select(r1,"要る水平の精度（95 %）",["10 m","3 m","1 m","30 cm","10 cm","3 cm"],3,function(){draw();});
    var sT=U.select(r1,"待てる初期化の時間",["10 s","1 分","5 分","30 分","1 時間"],1,function(){draw();});
    var r2=U.ctrls(el);
    var sC=U.select(r2,"通信",["使えない","インターネットか無線がある"],0,function(){draw();});
    var sR=U.select(r2,"受信機",["L1 だけ","多周波","多周波と L6"],2,function(){draw();});
    var sL=U.select(r2,"場所",["日本と沿岸","アジア・オセアニア（日本の外）","そのほか"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（30 cm・1 分・通信なし・L6 も・日本）",function(){sA.set(3);sT.set(1);sC.set(0);sR.set(2);sL.set(0);draw();});
    U.button(br,"ロガーの例（3 m・1 分・通信なし・L1 だけ）",function(){sA.set(1);sT.set(1);sC.set(0);sR.set(0);sL.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function judge(m){var A=accs[sA.get()],Tm=tms[sT.get()],com=sC.get()===1,rx=sR.get(),loc=sL.get(),why=[];
      var okA=m[2][1]<=A,okT=m[1][1]<=Tm,okR=rx>=m[4],okC=com||!m[5],okL=m[6]===0||(m[6]===1&&loc===0)||(m[6]===2&&loc<=1)||(m[6]===3&&loc===0);
      if(m[6]===3&&loc!==0)okL=null;   /* SBAS は地域による */
      return {a:okA,t:okT,r:okR,c:okC,l:okL,all:okA&&okT&&okR&&okC&&okL===true};}
    function draw(){
      var nar=_w18_nar(box),Wd=nar?400:700,o=[],A=accs[sA.get()],Tm=tms[sT.get()];
      var P=U.plot(nar?66:72,26,nar?310:580,nar?220:250,[1,3600],[0.01,20],{xlog:true,ylog:true});
      o.push(P.axes({xl:"初期化の時間 [s]",yl:"水平の 95 % の値 [m]",xt:[1,10,60,600,3600],yt:[0.01,0.1,1,10],sz:9,
        xfmt:function(v){return {1:"1 s",10:"10 s",60:"1 分",600:"10 分",3600:"1 時間"}[v];},yfmt:function(v){return {0.01:"1 cm",0.1:"10 cm",1:"1 m",10:"10 m"}[v];}}));
      o.push(S.RECT(P.X(1),P.Y(A),P.X(Tm)-P.X(1),P.Y(0.01)-P.Y(A),0,U.soft("green"),"green",1.4,"5 3"));
      o.push(S.T(P.X(1)+4,P.Y(A)+13,"条件を満たす範囲","start",9,"green",true,false,null,true));
      var res=_W18_METH.map(function(m){return judge(m);});
      _W18_METH.forEach(function(m,i){if(i===7)return;var j=res[i],any=j.all||(i===6&&res[7].all),c=any?m[3]:"muted";
        o.push(S.RECT(P.X(m[1][0]),P.Y(m[2][1]),P.X(m[1][1])-P.X(m[1][0]),P.Y(m[2][0])-P.Y(m[2][1]),3,any?U.soft(m[3]):"none",c,any?2.2:1.1,any?null:"3 2"));
        var nm=i===6?"PPP":m[0];o.push(S.T(i===3?P.X(m[1][0])-4:P.X(m[1][1])+4,i===3?P.Y(m[2][0])+12:P.Y(m[2][1])-4,nm,i===3?"end":"start",9.5,c,true,false,null,true));});
      box.set(S.svg(Wd,P.y+P.h+44,o));
      function mk(v){return v===true?'<span class="ok">○</span>':(v===null?"地域による":'<span class="warn">×</span>');}
      var rows=_W18_METH.map(function(m,i){var j=res[i];return [(j.all?"<b>":"")+m[0]+(j.all?"</b>":""),mk(j.a),mk(j.t),mk(j.r),mk(j.c),mk(j.l),j.all?'<span class="ok">合う</span>':"—"];});
      var ok=_W18_METH.filter(function(m,i){return res[i].all;}).map(function(m){return m[0];});
      ro.innerHTML="合う方式: <b>"+(ok.length?ok.join("・"):"なし（条件をゆるめる）")+"</b>"+U.tbl(["方式","精度","時間","受信機","通信","場所","判定"],rows,["left","center","center","center","center","center","center"])+
        '<div class="wnote">精度と時間は、図の範囲の悪い側の端（代表値・公式の基準）で判定した。RTK は多周波の受信機とした（L1 だけの RTK もあるが、初期化が長い）。SBAS は、日本では MSAS が使える。</div>';
    }
    draw();
  };
