  /* ===== 16 章 DGNSS と SBAS ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w16_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w16_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w16_s(v,d){var s=_w16_f(v,d);return (v>=0&&Math.abs(v)>=0.5*Math.pow(10,-d)?"+":"")+s;}
  var _W16_D=Math.PI/180,_W16_C=299792458,_W16_TOK=[35.681,139.767,40.0];
  /* 7 章 6 節の予算（1σ、代表値）と、この章のモデル（例の値。図の f16.py と同じ） */
  var _W16_B7=[1.5,3.5,0.4,1.0,0.5],_W16_SB=[0.5,0.7,0.4,1.0,0.5],_W16_EREF=0.3;
  var _W16_SRC=[["衛星の時計と軌道","purple"],["電離層","gold"],["対流圏","green"],["マルチパス","alias"],["受信機の雑音","teal"]];
  var _W16_M={SI:3.5,DI:1000,TI:1800,ST:0.4,DT:100,TT:3600,SS:1.5,TS:7200,SORB:1.0,RSAT:20200};
  function _w16_res(sig,d,D,tau,Tc){var x=(d/D)*(d/D)+(tau/Tc)*(tau/Tc);return sig*Math.sqrt(2*(1-Math.exp(-x)));}
  /* DGNSS の後に残る共通の誤差 [衛星の時計と軌道, 電離層, 対流圏] */
  function _w16_common(d,tau,DI){var M=_W16_M,s=Math.hypot(M.SORB*d/M.RSAT,_w16_res(M.SS,0,1,tau,M.TS));return [s,_w16_res(M.SI,d,DI||M.DI,tau,M.TI),_w16_res(M.ST,d,M.DT,tau,M.TT)];}
  function _w16_uere(v){var s=0;v.forEach(function(x){s+=x*x;});return Math.sqrt(s);}
  /* 不規則な場（相関係数 exp(−(d/D)²)）の成分。図の _f16_modes と同じ乱数・同じ順 */
  function _w16_modes(U,seed,n){var r=U.rng(seed),o=[];for(var k=0;k<(n||120);k++){var gx=r.normal(),gy=r.normal();o.push([gx,gy,2*Math.PI*r.next()]);}return o;}
  function _w16_field(md,sig,D,x,y){var s=Math.SQRT2/D,a=sig*Math.sqrt(2/md.length),v=0;for(var k=0;k<md.length;k++)v+=Math.cos(s*(md[k][0]*x+md[k][1]*y)+md[k][2]);return a*v;}
  /* 7 章のクロブッチャー・モデル（L1 の遅れ [m]）と薄い殻（350 km） */
  var _W16_KA=[0.1118e-7,-0.7451e-8,-0.5961e-7,0.1192e-6],_W16_KP=[0.1167e6,-0.2294e6,-0.1311e6,0.1049e7],_W16_TG=14*3600-_W16_TOK[1]/15*3600;
  function _w16_klob(latd,lond,eld,azd){var phu=latd/180,lmu=lond/180,E=eld/180,A=azd*_W16_D;
    var psi=0.0137/(E+0.11)-0.022,phi=Math.max(-0.416,Math.min(0.416,phu+psi*Math.cos(A)));
    var lam=lmu+psi*Math.sin(A)/Math.cos(phi*Math.PI),phm=phi+0.064*Math.cos((lam-1.617)*Math.PI);
    var t=((4.32e4*lam+_W16_TG)%86400+86400)%86400,F=1+16*Math.pow(0.53-E,3),PER=0,AMP=0;
    for(var n=0;n<4;n++){PER+=_W16_KP[n]*Math.pow(phm,n);AMP+=_W16_KA[n]*Math.pow(phm,n);}
    PER=Math.max(PER,72000);AMP=Math.max(AMP,0);var x=2*Math.PI*(t-50400)/PER;
    return F*(Math.abs(x)<1.57?5e-9+AMP*(1-x*x/2+x*x*x*x/24):5e-9)*_W16_C;}
  var _W16_RE=6371,_W16_HI=350;
  function _w16_mI(el){var s=_W16_RE*Math.cos(el*_W16_D)/(_W16_RE+_W16_HI);return 1/Math.sqrt(1-s*s);}
  function _w16_ipp(B,L,el,az){var e=el*_W16_D,a=az*_W16_D,psi=Math.PI/2-e-Math.asin(_W16_RE*Math.cos(e)/(_W16_RE+_W16_HI));
    var b=Math.asin(Math.sin(B*_W16_D)*Math.cos(psi)+Math.cos(B*_W16_D)*Math.sin(psi)*Math.cos(a));
    return [b/_W16_D,L+Math.asin(Math.sin(psi)*Math.sin(a)/Math.cos(b))/_W16_D];}
  /* 受信機から見える GPS の衛星（時刻 0、仰角の高い順） */
  function _w16_vis(U,B,L){var rx=U.gnss.rx(B,L,40),out=[];U.gnss.constellation().forEach(function(s){if(s.sys!=="GPS")return;var ea=U.gnss.elaz(rx,U.gnss.ecef(s,0));if(ea[0]>0)out.push({nm:s.nm,el:ea[0],az:ea[1]});});
    out.sort(function(a,b){return b.el-a.el;});return out;}
  /* 色の濃さで値を描く（正は金、負は青。同じ濃さの升を 1 本の path に） */
  function _w16_heat(P,fn,xs,ys,vmax,div,nlev){nlev=nlev||6;var paths={},i,j;
    for(j=0;j<ys.length-1;j++)for(i=0;i<xs.length-1;i++){var v=fn((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2),k,key;
      if(div){k=Math.min(nlev-1,Math.floor(Math.abs(v)/vmax*nlev));key=(v>=0?"p":"n")+k;}else{k=Math.max(0,Math.min(nlev-1,Math.floor((v-vmax[0])/(vmax[1]-vmax[0])*nlev)));key="p"+k;}
      var x0=P.X(xs[i]),x1=P.X(xs[i+1]),y0=P.Y(ys[j+1]),y1=P.Y(ys[j]);
      (paths[key]=paths[key]||[]).push("M"+x0.toFixed(1)+" "+y0.toFixed(1)+"h"+(x1-x0+0.3).toFixed(1)+"v"+(y1-y0+0.3).toFixed(1)+"h"+(-(x1-x0+0.3)).toFixed(1)+"z");}
    var o=[];Object.keys(paths).forEach(function(key){var k=+key.slice(1);o.push('<path d="'+paths[key].join("")+'" fill="var(--'+(key[0]==="p"?"gold":"signal")+')" fill-opacity="'+(0.6*(k+0.5)/nlev).toFixed(3)+'" stroke="none"/>');});
    return o.join("");}
  /* 選んだ点を、ドラッグの代わりにスライダーで動かす（スマートフォン用） */
  function _w16_mover(U,row,names,labs,lim,get,set,redraw){
    var sel=U.select(row,"スライダーで動かす点",names,0,function(){sync();});
    var sx=U.slider(row,labs[0],{min:lim[0],max:lim[1],step:lim[4],value:lim[0],fmt:function(v){return _w16_f(v,lim[5])+labs[2];},onInput:function(v){var p=get(sel.get());set(sel.get(),[v,p[1]]);redraw();}});
    var sy=U.slider(row,labs[1],{min:lim[2],max:lim[3],step:lim[4],value:lim[2],fmt:function(v){return _w16_f(v,lim[5])+labs[2];},onInput:function(v){var p=get(sel.get());set(sel.get(),[p[0],v]);redraw();}});
    function sync(){var p=get(sel.get());sx.set(p[0]);sy.set(p[1]);}
    sync();return {sync:sync,sel:sel};}

  /* ---- 3 節の後: 基準局と移動局を動かして、電離層の遅れの差と基線長 ---- */
  REG.w16_common=function(el,U){
    var S=U.S;
    U.head(el,"COMMON ERRORS","基準局と移動局の距離と、電離層の遅れの差");
    var r1=U.ctrls(el);
    var sD=U.slider(r1,"相関の距離 D（電離層）",{values:[300,500,700,1000,1500,2000,3000],value:1000,fmt:function(v){return v+" km";},onInput:function(){sweep=[];draw();}});
    var sS=U.slider(r1,"モデルで直せずに残る電離層の σ",{min:1,max:6,step:0.5,value:3.5,fmt:function(v){return _w16_f(v,1)+" m";},onInput:function(){sweep=[];draw();}});
    var r2=U.ctrls(el);
    var pos=[[0,0],[100,0]],seed=1,md=null,sweep=[],drag=-1;
    var mv=_w16_mover(U,r2,["基準局","移動局"],["東西","南北"," km"],[-1000,1000,-1000,1000,5,0],function(k){return pos[k];},function(k,p){pos[k]=p;sweep=[];},function(){draw();});
    var br=U.btnrow(el);
    function place(d){var a=Math.atan2(pos[1][1]-pos[0][1],pos[1][0]-pos[0][0]);if(!isFinite(a)||Math.hypot(pos[1][0]-pos[0][0],pos[1][1]-pos[0][1])<1e-6)a=0;
      pos[1]=[Math.max(-1000,Math.min(1000,pos[0][0]+d*Math.cos(a))),Math.max(-1000,Math.min(1000,pos[0][1]+d*Math.sin(a)))];sweep=[];mv.sync();draw();}
    U.button(br,"本文の例（100 km）",function(){tick.stop();sD.set(1000);sS.set(3.5);pos=[[0,0],[100,0]];seed=1;md=null;sweep=[];mv.sync();draw();});
    U.button(br,"10 km",function(){place(10);});U.button(br,"300 km",function(){place(300);});U.button(br,"1000 km",function(){place(1000);});
    var bp=U.button(br,"移動局を遠ざける（再生）",function(){if(tick.running()){tick.stop();bp.textContent="移動局を遠ざける（再生）";return;}
      ang=Math.atan2(pos[1][1]-pos[0][1],pos[1][0]-pos[0][0]);if(Math.hypot(pos[1][0]-pos[0][0],pos[1][1]-pos[0][1])<1e-6)ang=0;dd=1;sweep=[];bp.textContent="止める";tick.start();});
    U.button(br,"別の場（乱数）",function(){seed++;md=null;sweep=[];draw();});
    var ang=0,dd=1;
    var tick=U.ticker(function(){dd*=1.06;var x=pos[0][0]+dd*Math.cos(ang),y=pos[0][1]+dd*Math.sin(ang);
      if(dd>1600||Math.abs(x)>1000||Math.abs(y)>1000){tick.stop();bp.textContent="移動局を遠ざける（再生）";return;}pos[1]=[x,y];mv.sync();draw(true);},60);
    var box=U.svgbox(el),ro=U.readout(el);
    U.ctl.drag(box,function(type,x,y){if(!geo)return false;
      if(type==="down"){var best=-1,bd=24;for(var k=1;k>=0;k--){var dx=geo.P.X(pos[k][0])-x,dy=geo.P.Y(pos[k][1])-y,dl=Math.hypot(dx,dy);if(dl<bd){bd=dl;best=k;}}
        if(best<0)return false;drag=best;tick.stop();bp.textContent="移動局を遠ざける（再生）";sweep=[];mv.sel.set(best);return true;}
      if(type==="move"&&drag>=0){pos[drag]=[Math.max(-1000,Math.min(1000,geo.P.ux(x))),Math.max(-1000,Math.min(1000,geo.P.uy(y)))];mv.sync();draw();}
      if(type==="up")drag=-1;});
    var geo=null,heatKey="",heatSvg="";
    function draw(fromTick){
      if(!md)md=_w16_modes(U,seed,120);
      var D=sD.get(),sig=sS.get(),nar=_w16_nar(box),Wd=nar?400:700,o=[];
      var f=function(x,y){return _w16_field(md,sig,D,x,y);};
      /* (a) 地図 */
      var mw=nar?300:290,P=U.plot(nar?60:58,30,mw,mw,[-1000,1000],[-1000,1000]);geo={P:P};
      var hk=seed+"|"+D+"|"+sig+"|"+nar;
      if(hk!==heatKey){var ed=[];for(var k=0;k<=32;k++)ed.push(-1000+2000*k/32);heatSvg=_w16_heat(P,f,ed,ed,8,true,6);heatKey=hk;}
      o.push(S.T(nar?10:14,16,"(a) 電離層の、モデルで直せずに残る遅れ（金: 大きい・青: 小さい）","start",nar?9.5:10.5,"ink",true));
      o.push(heatSvg);
      o.push(P.axes({xt:[-1000,-500,0,500,1000],yt:[-1000,-500,0,500,1000],grid:false,sz:9,xl:"東西 [km]",yl:"南北 [km]"}));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"none","line",1));
      var d=Math.hypot(pos[1][0]-pos[0][0],pos[1][1]-pos[0][1]),vb=f(pos[0][0],pos[0][1]),vr=f(pos[1][0],pos[1][1]),df=vr-vb;
      o.push(S.L(P.X(pos[0][0]),P.Y(pos[0][1]),P.X(pos[1][0]),P.Y(pos[1][1]),"ink",1.2,"3 3"));
      o.push(S.CIRC(P.X(pos[0][0]),P.Y(pos[0][1]),6,"purple",2.2,"var(--screen)"));
      o.push(S.D(P.X(pos[1][0]),P.Y(pos[1][1]),"green",5));
      o.push(S.T(P.X(pos[0][0]),P.Y(pos[0][1])+19,"基準局","middle",9.5,"purple",true,false,null,true));
      o.push(S.T(P.X(pos[1][0]),P.Y(pos[1][1])-10,"移動局","middle",9.5,"green",true,false,null,true));
      /* (b) 差と基線長 */
      var qx=nar?60:430,qy=nar?P.y+P.h+76:46,qw=nar?310:250,qh=nar?170:230,M=_W16_M;
      var Q=U.plot(qx,qy,qw,qh,[1,3000],[-12,12],{xlog:true});
      o.push(S.T(nar?10:qx-50,qy-14,"(b) 電離層の遅れの差（移動局 − 基準局）","start",nar?9.5:10.5,"ink",true));
      var band=[],k2;for(k2=0;k2<=80;k2++){var dv=Math.pow(10,k2/80*Math.log10(3000));band.push([dv,_w16_res(sig,dv,D,0,1)]);}
      o.push(S.PL(band.map(function(p){return [Q.X(p[0]),Q.Y(p[1])];}).concat(band.slice().reverse().map(function(p){return [Q.X(p[0]),Q.Y(-p[1])];})),"none",0,U.soft("gold"),null,1));
      o.push(Q.axes({xt:[1,10,100,1000,3000],yt:[-12,-6,0,6,12],sz:9,xl:"基線長 d [km]",yl:"差 [m]",ylOff:30}));
      o.push(Q.line(band,"gold",1.6));o.push(Q.line(band.map(function(p){return [p[0],-p[1]];}),"gold",1.6));
      o.push(S.L(Q.X(1),Q.Y(sig),Q.X(3000),Q.Y(sig),"alias",1.2,"5 3"));o.push(S.L(Q.X(1),Q.Y(-sig),Q.X(3000),Q.Y(-sig),"alias",1.2,"5 3"));
      var dx=D*Math.sqrt(Math.log(2));o.push(S.L(Q.X(dx),Q.Y(-12),Q.X(dx),Q.Y(12),"muted",1,"2 2"));
      o.push(S.T(Q.X(dx)+3,Q.Y(11)+4,_w16_f(dx,0)+" km","start",9,"muted",true,false,null,true));
      if(sweep.length>1)o.push(Q.clip(sweep,"green",1.6));
      if(fromTick)sweep.push([Math.max(1,d),df]);
      if(d>=1)o.push(S.D(Q.X(d),Q.Y(Math.max(-12,Math.min(12,df))),"green",4.5));
      o.push(S.LEGL(nar?10:qx-40,qy+qh+46,[["gold",null,"±σ_Δ（モデル）"],["alias","5 3","±σ（補正しない）"],["green",null,"この場の差"]],9,12));
      box.set(S.svg(Wd,(nar?qy+qh+60:Math.max(P.y+P.h+48,qy+qh+60)),o));
      /* 読み出し */
      var sd=_w16_res(sig,d,D,0,1),cm=_w16_common(d,5,D),rx=Math.sqrt(1+0.25+_W16_EREF*_W16_EREF*2);
      var cmS=[cm[0],sd,cm[2]],u=Math.sqrt(cmS[0]*cmS[0]+sd*sd+cmS[2]*cmS[2]+rx*rx),u7=_w16_uere([_W16_B7[0],sig,_W16_B7[2],_W16_B7[3],_W16_B7[4]]);
      var h="基線長 <b>d = "+_w16_f(d,d<10?1:0)+" km</b>。この場の値: 基準局 "+_w16_s(vb,2)+" m・移動局 "+_w16_s(vr,2)+" m・差 <b>"+_w16_s(df,2)+" m</b><br>";
      h+="モデルの差の標準偏差 σ<sub>Δ</sub>(d) = σ√(2{1 − e<sup>−(d/D)²</sup>}) = <b>"+_w16_f(sd,2)+" m</b>（σ = "+_w16_f(sig,1)+" m、D = "+D+" km）。";
      h+=(sd<sig?'<span class="ok">補正したほうが小さい</span>':'<span class="warn">補正しないほうが小さい（d が 0.83 D = '+_w16_f(dx,0)+' km を超えた）</span>')+"<br>";
      h+="同じ d で、対流圏の差 "+_w16_f(cm[2],2)+" m（D = 100 km）・衛星の軌道の差 "+_w16_f(cm[0],3)+" m 以下。受信機ごとの誤差 "+_w16_f(rx,2)+" m を合わせた UERE <b>"+_w16_f(u,2)+" m</b>（補正しない単独 "+_w16_f(u7,2)+" m。補正の年齢 5 s）";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 4 節の後: 電離層の格子の補間 ---- */
  var _W16_GSEED=38;
  REG.w16_sbas=function(el,U){
    var S=U.S;
    U.head(el,"SBAS IONOSPHERIC GRID","電離層の格子の点の値から、電波が通る点の遅れを補間する");
    var r1=U.ctrls(el),rx=[_W16_TOK[0],_W16_TOK[1]],seed=_W16_GSEED,vis=[],selName="G22",md=null,ms=null,drag=false;
    var sSat=U.select(r1,"衛星",["G22"],0,function(){selName=vis[sSat.get()]?vis[sSat.get()].nm:selName;draw();});
    var cSm=U.checkbox(r1,"細かい乱れを足す（相関の距離 150 km・0.4 m）",false,function(){heatKey="";draw();});
    var sMiss=U.select(r1,"使えない格子の点",["なし","南西","南東","北東","北西"],0,function(){draw();});
    var r2=U.ctrls(el);
    var sLat=U.slider(r2,"受信機の緯度",{min:24,max:46,step:0.1,value:rx[0],fmt:function(v){return _w16_f(v,1)+"°";},onInput:function(v){rx[0]=v;draw();}});
    var sLon=U.slider(r2,"受信機の経度",{min:124,max:150,step:0.1,value:rx[1],fmt:function(v){return _w16_f(v,1)+"°";},onInput:function(v){rx[1]=v;draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（東京・G22）",function(){rx=[_W16_TOK[0],_W16_TOK[1]];sLat.set(rx[0]);sLon.set(rx[1]);selName="G22";seed=_W16_GSEED;md=null;cSm.set(false);sMiss.set(0);heatKey="";draw();});
    U.button(br,"別の場（乱数）",function(){seed++;md=null;heatKey="";draw();});
    var box=U.svgbox(el),ro=U.readout(el),geo=null,heatKey="",heatSvg="";
    U.ctl.drag(box,function(type,x,y){if(!geo)return false;var P=geo.P;
      if(type==="down"){if(Math.hypot(P.X(rx[1])-x,P.Y(rx[0])-y)>24)return false;drag=true;return true;}
      if(type==="move"&&drag){rx=[Math.max(24,Math.min(46,P.uy(y))),Math.max(124,Math.min(150,P.ux(x)))];sLat.set(rx[0]);sLon.set(rx[1]);draw();}
      if(type==="up")drag=false;});
    function truth(B,L){var x=(L-137.5)*111.32*Math.cos(35*_W16_D),y=(B-35)*110.6,v=_w16_klob(B,L,90,0)+_w16_field(md,1.2,1000,x,y);
      if(cSm.get())v+=_w16_field(ms,0.4,150,x,y);return v;}
    /* 日本の周りの 500 点（緯度 25.5〜44.5°・経度 125.5〜149.5° の 1° ごと）で、補間とクロブッチャー・モデルの誤差（天頂）の RMS。本文と同じ点 */
    var rmsKey="",rmsVal=null;
    function gridRMS(){var key=seed+"|"+cSm.get();if(key===rmsKey)return rmsVal;var se=0,sk=0,n=0,cache={};
      function igp(B,L){var k=B+","+L;if(cache[k]==null)cache[k]=truth(B,L);return cache[k];}
      for(var j=0;j<20;j++)for(var i=0;i<25;i++){var B=25.5+j,L=125.5+i,B1=Math.floor(B/5)*5,L1=Math.floor(L/5)*5,xi=(L-L1)/5,ze=(B-B1)/5;
        var iv=(1-xi)*(1-ze)*igp(B1,L1)+xi*(1-ze)*igp(B1,L1+5)+xi*ze*igp(B1+5,L1+5)+(1-xi)*ze*igp(B1+5,L1),t=truth(B,L),kk=_w16_klob(B,L,90,0)-t;
        se+=(iv-t)*(iv-t);sk+=kk*kk;n++;}
      rmsKey=key;rmsVal=[Math.sqrt(se/n),Math.sqrt(sk/n)];return rmsVal;}
    function draw(){
      if(!md){md=_w16_modes(U,seed,120);ms=_w16_modes(U,seed+100,120);}
      /* 見える衛星（受信機の位置で変わる） */
      vis=_w16_vis(U,rx[0],rx[1]);var opts=sSat.input;opts.innerHTML="";var si=0;
      vis.forEach(function(q,i){var op=document.createElement("option");op.value=i;op.textContent=q.nm+"（仰角 "+_w16_f(q.el,1)+"°）";opts.appendChild(op);if(q.nm===selName)si=i;});
      sSat.set(si);var sat=vis[si];selName=sat.nm;
      var nar=_w16_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?46:50,30,nar?300:300,nar?316:316,[120,155],[20,50]);geo={P:P};
      var hk=seed+"|"+cSm.get()+"|"+nar;
      if(hk!==heatKey){var xs=[],ys=[],k;for(k=120;k<=155;k++)xs.push(k);for(k=20;k<=50;k++)ys.push(k);heatSvg=_w16_heat(P,function(L,B){return truth(B,L);},xs,ys,[2.5,7.5],false,10);heatKey=hk;}
      o.push(S.T(nar?8:14,16,"(a) 格子の点（5° ごと）の天頂の遅れ [m]","start",nar?9.5:10.5,"ink",true));
      o.push(heatSvg);
      o.push(P.axes({xt:[120,125,130,135,140,145,150,155],yt:[20,25,30,35,40,45,50],grid:false,sz:9,xl:"経度 [°]",yl:"緯度 [°]",ylOff:32}));
      var L,B;for(L=120;L<=155;L+=5)o.push(S.L(P.X(L),P.Y(20),P.X(L),P.Y(50),"muted",0.6,"2 3"));for(B=20;B<=50;B+=5)o.push(S.L(P.X(120),P.Y(B),P.X(155),P.Y(B),"muted",0.6,"2 3"));
      var ip=_w16_ipp(rx[0],rx[1],sat.el,sat.az),Bp=ip[0],Lp=ip[1],inside=Bp>=20&&Bp<50&&Lp>=120&&Lp<155;
      var B1=Math.floor(Bp/5)*5,L1=Math.floor(Lp/5)*5,xi=(Lp-L1)/5,ze=(Bp-B1)/5;
      var cn=["SW","SE","NE","NW"],cc={SW:"signal",SE:"purple",NE:"green",NW:"alias"},cv={},cw={},miss=["","SW","SE","NE","NW"][sMiss.get()];
      cv.SW=truth(B1,L1);cv.SE=truth(B1,L1+5);cv.NE=truth(B1+5,L1+5);cv.NW=truth(B1+5,L1);
      if(inside)o.push(S.RECT(P.X(L1),P.Y(B1+5),P.X(L1+5)-P.X(L1),P.Y(B1)-P.Y(B1+5),0,"none","signal",2));
      for(L=120;L<=155;L+=5)for(B=20;B<=50;B+=5){var isC=inside&&(L===L1||L===L1+5)&&(B===B1||B===B1+5),isM=false;
        if(isC&&miss){var mk={SW:[L1,B1],SE:[L1+5,B1],NE:[L1+5,B1+5],NW:[L1,B1+5]}[miss];isM=(mk[0]===L&&mk[1]===B);}
        o.push(isM?S.X(P.X(L),P.Y(B),5,"alias",2.2):S.D(P.X(L),P.Y(B),"ink",isC?3.4:2.2));
        if(L<155&&B<50&&!nar)o.push(S.T(P.X(L)+3,P.Y(B)-4,_w16_f(truth(B,L),1),"start",9,"ink",isC,false,null,true));}
      o.push(S.L(P.X(rx[1]),P.Y(rx[0]),P.X(Math.max(120,Math.min(155,Lp))),P.Y(Math.max(20,Math.min(50,Bp))),"gold",1.4,"4 2"));
      if(inside)o.push(S.D(P.X(Lp),P.Y(Bp),"gold",4.5));
      o.push(S.CIRC(P.X(rx[1]),P.Y(rx[0]),6,"green",2.2,"var(--screen)"));
      o.push(S.T(P.X(rx[1])-8,P.Y(rx[0])-8,"受信機","end",9.5,"green",true,false,null,true));
      /* (b) 升の中 */
      var bx0=nar?70:420,by0=nar?P.y+P.h+86:62,SZ=nar?190:190,h="",wts=null;
      o.push(S.T(nar?8:392,nar?P.y+P.h+58:16,"(b) 升（北緯 "+B1+"〜"+(B1+5)+"°・東経 "+L1+"〜"+(L1+5)+"°）の中の補間","start",nar?9.5:10.5,"ink",true));
      if(inside){
        if(!miss)wts={SW:(1-xi)*(1-ze),SE:xi*(1-ze),NE:xi*ze,NW:(1-xi)*ze};
        else{var tri={NE:[xi+ze<=1,{SW:1-xi-ze,SE:xi,NW:ze,NE:0}],SW:[xi+ze>=1,{SE:1-ze,NE:xi+ze-1,NW:1-xi,SW:0}],SE:[ze>=xi,{SW:1-ze,NE:xi,NW:ze-xi,SE:0}],NW:[ze<=xi,{SW:1-xi,SE:xi-ze,NE:ze,NW:0}]}[miss];
          if(tri[0])wts=tri[1];}
        var px=bx0+xi*SZ,py=by0+(1-ze)*SZ;
        if(!miss){[[[bx0,py,px-bx0,by0+SZ-py],"NE"],[[px,py,bx0+SZ-px,by0+SZ-py],"NW"],[[px,by0,bx0+SZ-px,py-by0],"SW"],[[bx0,by0,px-bx0,py-by0],"SE"]].forEach(function(r){var R=r[0],k=r[1];
          o.push(S.RECT(R[0],R[1],Math.max(0,R[2]),Math.max(0,R[3]),0,U.soft(cc[k]),cc[k],0.8));
          if(R[2]>44&&R[3]>22)o.push(S.TX(R[0]+R[2]/2,R[1]+R[3]/2+4,"w_{"+k+"} "+_w16_f(wts[k],3),"middle",9.5,cc[k],true));});}
        else if(wts){var poly={NE:[[0,0],[1,0],[0,1]],SW:[[1,0],[1,1],[0,1]],SE:[[0,0],[1,1],[0,1]],NW:[[0,0],[1,0],[1,1]]}[miss];
          o.push(S.PL(poly.map(function(q){return [bx0+q[0]*SZ,by0+(1-q[1])*SZ];}),"gold",1.4,U.soft("gold"),null,1));}
        else o.push(S.T(bx0+SZ/2,by0+SZ/2,"3 点の三角形の外","middle",10,"alias",true,false,null,true));
        o.push(S.RECT(bx0,by0,SZ,SZ,0,"none","signal",2));
        var cpos={SW:[bx0,by0+SZ,"end",14],SE:[bx0+SZ,by0+SZ,"start",14],NE:[bx0+SZ,by0,"start",-6],NW:[bx0,by0,"end",-6]};
        cn.forEach(function(k){var c=cpos[k];o.push(k===miss?S.X(c[0],c[1],5,"alias",2.2):S.D(c[0],c[1],"ink",3.4));
          o.push(S.TX(c[0]+(c[2]==="end"?-6:6),c[1]+c[3],k===miss?"I_{"+k+"} 使えない":"I_{"+k+"} = "+_w16_f(cv[k],2),c[2],9.5,k===miss?"alias":cc[k],true));});
        o.push(S.D(px,py,"gold",5));
      }else o.push(S.T(bx0,by0+40,"電波が通る点が、この図の格子の外にある","start",10,"alias",true));
      box.set(S.svg(Wd,nar?by0+SZ+40:Math.max(P.y+P.h+44,by0+SZ+40),o));
      /* 読み出し */
      var m=_w16_mI(sat.el),tv=inside?truth(Bp,Lp):NaN,kl=_w16_klob(rx[0],rx[1],sat.el,sat.az);
      h="衛星 "+sat.nm+"（仰角 "+_w16_f(sat.el,1)+"°・方位角 "+_w16_f(sat.az,1)+"°）。電離層を通る点: 北緯 "+_w16_f(Bp,3)+"°・東経 "+_w16_f(Lp,3)+"°";
      if(inside)h+="（ξ = "+_w16_f(xi,3)+"、ζ = "+_w16_f(ze,3)+"）";h+="<br>";
      if(inside&&wts){var iv=0;cn.forEach(function(k){iv+=wts[k]*cv[k];});
        h+="補間した天頂の遅れ <b>"+_w16_f(iv,2)+" m</b>（本当の値 "+_w16_f(tv,2)+" m、差 "+_w16_s(iv-tv,2)+" m）"+(miss?"（3 点の補間）":"")+"<br>";
        h+="斜めの遅れ: m<sub>I</sub>("+_w16_f(sat.el,1)+"°) = "+_w16_f(m,3)+" を掛けて <b>"+_w16_f(m*iv,2)+" m</b>（本当 "+_w16_f(m*tv,2)+" m、差 "+_w16_s(m*(iv-tv),2)+" m）。";
        h+="クロブッチャー・モデルは "+_w16_f(kl,2)+" m（差 "+_w16_s(kl-m*tv,2)+" m）";}
      else if(inside)h+='<span class="warn">電波が通る点が、使える 3 つの格子の点の三角形の外にあるので、この衛星の電離層の補正は使えない</span>';
      else h+='<span class="warn">この図の格子の外（補正は SBAS の格子の範囲による）</span>';
      var rr=gridRMS();
      h+="<br>この場で、日本の周りの 500 点（1° ごと）を調べた天頂の遅れの誤差の RMS: 補間 <b>"+_w16_f(rr[0],2)+" m</b>・クロブッチャー・モデル "+_w16_f(rr[1],2)+" m";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 6 節の後: 単独・SBAS・DGNSS の位置の散らばり ---- */
  REG.w16_dgnss=function(el,U){
    var S=U.S;
    U.head(el,"DGNSS SCATTER","補正の方式・基線長・年齢と、位置の散らばり");
    var r1=U.ctrls(el);
    var mode=U.seg(r1,["単独","SBAS","DGNSS"],2,function(){draw();});
    var cLim=U.checkbox(r1,"年齢が限度（30 s。例）を超えたら補正を使わない",true,function(){draw();});
    var r2=U.ctrls(el);
    var sd=U.slider(r2,"基線長 d",{min:1,max:2000,log:true,value:10,fmt:function(v){return _w16_f(v,v<10?1:0)+" km";},onInput:function(){draw();}});
    var st=U.slider(r2,"補正の年齢 τ",{min:0,max:900,step:5,value:5,fmt:function(v){return v+" s";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var se=U.slider(r3,"基準局の座標の誤差（東へ）",{min:0,max:5,step:0.1,value:0,fmt:function(v){return _w16_f(v,1)+" m";},onInput:function(){draw();}});
    var sm=U.slider(r3,"基準局のマルチパス",{min:0,max:1.5,step:0.05,value:0.3,fmt:function(v){return _w16_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（DGNSS 10 km・5 s）",function(){mode.set(2);sd.set(10);st.set(5);se.set(0);sm.set(0.3);cLim.set(true);seed=1;draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 東京の 8 つの衛星（7 章と同じ）の幾何行列と、最小二乗の行列 A = (GᵀG)⁻¹Gᵀ */
    var vis=_w16_vis(U,_W16_TOK[0],_W16_TOK[1]),Mx=U.ctl.mat;
    var G=vis.map(function(q){var e=q.el*_W16_D,a=q.az*_W16_D;return [-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e),1];});
    var H=Mx.inv(Mx.mul(Mx.T(G),G)),A=Mx.mul(H,Mx.T(G)),m=G.length,HD=Math.sqrt(H[0][0]+H[1][1]),VD=Math.sqrt(H[2][2]);
    function ell(a,b,c){var mm=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);return [Math.sqrt(mm+r),Math.sqrt(Math.max(mm-r,0)),0.5*Math.atan2(2*b,a-c)/_W16_D];}
    function pin(R,s1,s2){var n=360,sm_=0;for(var i=0;i<n;i++){var ph=2*Math.PI*(i+0.5)/n,q=Math.cos(ph)*Math.cos(ph)/(s1*s1)+Math.sin(ph)*Math.sin(ph)/(s2*s2);sm_+=(1-Math.exp(-R*R*q/2))/q;}return sm_/n/(s1*s2);}
    function rad(p,s1,s2){var lo=0,hi=10*(s1+s2);for(var i=0;i<60;i++){var mm=(lo+hi)/2;if(pin(mm,s1,s2)<p)lo=mm;else hi=mm;}return (lo+hi)/2;}
    var E1=ell(H[0][0],H[0][1],H[1][1]),KC=rad(0.5,E1[0],E1[1]),K95=rad(0.95,E1[0],E1[1]);
    function cks(s){var c=0;for(var i=0;i<s.length;i++)c^=s.charCodeAt(i);return (c<16?"0":"")+c.toString(16).toUpperCase();}
    function draw(){
      var md=mode.get(),d=sd.get(),tau=st.get(),dE=se.get(),mref=sm.get(),fall=false;
      if(md===2&&cLim.get()&&tau>30)fall=true;
      var eff=fall?0:md;
      /* 源ごとの 1σ（7 つ: 衛星・電離層・対流圏・移動局の M・移動局の ε・基準局の M・基準局の ε） */
      var sg;if(eff===0)sg=_W16_B7.concat([0,0]);else if(eff===1)sg=_W16_SB.concat([0,0]);else{var c=_w16_common(d,tau);sg=[c[0],c[1],c[2],1.0,0.5,mref,_W16_EREF];}
      var u=_w16_uere(sg),u7=_w16_uere(_W16_B7),bias=(eff===2)?dE:0;
      var nar=_w16_nar(box),Wd=nar?400:700,o=[];
      /* (a) 予算 */
      var bx=nar?132:140,bw=nar?200:190,vmax=Math.max(4,u7*1.05),cols=["purple","gold","green","alias","teal","alias","teal"],nms=["衛星の時計と軌道","電離層","対流圏","マルチパス","受信機の雑音","基準局のマルチパス","基準局の雑音"];
      o.push(S.T(nar?8:14,16,"(a) 源ごとの誤差（1σ）","start",nar?9.5:10.5,"ink",true));
      var yy=26;sg.forEach(function(v,i){if(i>=5&&eff!==2)return;var c=cols[i];o.push(S.T(bx-6,yy+11,nms[i],"end",9.5,c,true));
        o.push(S.RECT(bx,yy,Math.max(0.5,bw*v/vmax),14,2,U.soft(c),c,1,i>=5?"3 2":null));o.push(S.T(bx+bw*v/vmax+4,yy+11,_w16_f(v,2)+" m","start",9.5,c,true));yy+=20;});
      o.push(S.T(bx-6,yy+11,"UERE","end",10,"ink",true));o.push(S.RECT(bx,yy,bw*u/vmax,14,2,"ink","ink",1));o.push(S.T(bx+bw*u/vmax+4,yy+11,_w16_f(u,2)+" m","start",10,"ink",true));
      o.push(S.T(bx-6,yy+31,"単独","end",9.5,"muted",true));o.push(S.RECT(bx,yy+20,bw*u7/vmax,10,2,"none","muted",1,"3 2"));o.push(S.T(bx+bw*u7/vmax+4,yy+29,_w16_f(u7,2)+" m","start",9.5,"muted"));
      /* (b) 散らばり */
      var lim=10,px=nar?44:392,py=nar?yy+80:30,pw=nar?260:232,P=U.plot(px,py,pw,pw,[-lim,lim],[-lim,lim]);
      o.push(S.T(nar?8:px-30,py-12,"(b) 水平の位置の誤差（東西・南北 [m]）","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));o.push(P.axes({xt:[-10,-5,0,5,10],yt:[-10,-5,0,5,10],sz:9}));
      var rng=U.rng(seed*7919+16),N=2000,pts=[],p7=[],cin=0,c95=0,sh=0,ups=[],e3=ell(H[0][0]*u*u,H[0][1]*u*u,H[1][1]*u*u),cep=KC*u,r95=K95*u;
      for(var t=0;t<N;t++){var eta=[],e7=[];for(var i=0;i<m;i++){var n5=[];for(var k=0;k<7;k++)n5.push(rng.normal());var s1=0,s7=0;
          for(k=0;k<7;k++)s1+=sg[k]*n5[k];for(k=0;k<5;k++)s7+=_W16_B7[k]*n5[k];eta.push(s1);e7.push(s7);}
        var x=bias,y=0,up=0,x7=0,y7=0;for(var j=0;j<m;j++){x+=A[0][j]*eta[j];y+=A[1][j]*eta[j];up+=A[2][j]*eta[j];x7+=A[0][j]*e7[j];y7+=A[1][j]*e7[j];}
        var dh=Math.hypot(x-bias,y);if(dh<=cep)cin++;if(dh<=r95)c95++;sh+=dh*dh;ups.push(Math.abs(up));if(t<1200){pts.push([x,y,up]);p7.push([x7,y7]);}}
      ups.sort(function(a,b){return a-b;});var u95=ups[Math.floor(0.95*N)];
      if(eff!==0)p7.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"faint",1));});
      pts.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"gold",1.1));});
      var ep=[],cp=[];for(var a2=0;a2<=96;a2++){var th=2*Math.PI*a2/96,ca=Math.cos(e3[2]*_W16_D),sa=Math.sin(e3[2]*_W16_D),uu=e3[0]*Math.cos(th),vv=e3[1]*Math.sin(th);ep.push([bias+uu*ca-vv*sa,uu*sa+vv*ca]);cp.push([bias+cep*Math.cos(th),cep*Math.sin(th)]);}
      o.push(P.clip(ep,"alias",1.8));o.push(P.clip(cp,"signal",1.6,"4 2"));
      o.push(S.L(P.X(0)-6,P.Y(0),P.X(0)+6,P.Y(0),"green",2));o.push(S.L(P.X(0),P.Y(0)-6,P.X(0),P.Y(0)+6,"green",2));
      /* 上下 */
      var vx=P.x+P.w+(nar?22:26),Q=U.plot(vx,py,34,pw,[0,1],[-20,20]),jr=U.rng(seed+5);
      o.push(S.RECT(vx,py,34,pw,3,"var(--screen)","line",1));o.push(S.T(vx+17,py-4,"上下","middle",9.5,"ink",true));
      [-20,0,20].forEach(function(v){o.push(S.T(vx+38,Q.Y(v)+3,_w16_f(v,0),"start",8.5,"muted"));});
      pts.forEach(function(q){if(Math.abs(q[2])<20)o.push(S.D(vx+5+24*jr.next(),Q.Y(q[2]),"gold",1.0));});
      [1,-1].forEach(function(g){o.push(S.L(vx,Q.Y(g*1.96*VD*u),vx+34,Q.Y(g*1.96*VD*u),"alias",1.6,"4 2"));});
      var Hh=Math.max(yy+50,py+pw+30);
      o.push(S.LEGL(nar?8:px-30,Hh+6,[["alias",null,"誤差の楕円"],["signal","4 2","CEP"],["alias","4 2","上下 95 %"]],9,12));
      if(eff!==0)o.push(S.T(nar?8:px-30,Hh+24,"灰の点: 同じ乱数で計算した単独の位置","start",9,"muted"));
      box.set(S.svg(Wd,Hh+32,o));
      /* 読み出し */
      var rows=[["UERE",_w16_f(u,2)+" m","—"],["水平の DRMS（HDOP × UERE）",_w16_f(HD*u,2)+" m",_w16_f(Math.sqrt(sh/N),2)+" m"],["CEP（50 %）",_w16_f(cep,2)+" m","中に "+_w16_f(100*cin/N,1)+" %"],
        ["R95（95 %）",_w16_f(r95,2)+" m","中に "+_w16_f(100*c95/N,1)+" %"],["上下の 95 %（1.96 × VDOP × UERE）",_w16_f(1.96*VD*u,2)+" m",_w16_f(u95,2)+" m"]];
      var nm=["単独","SBAS","DGNSS（基線長 "+_w16_f(d,d<10?1:0)+" km・年齢 "+tau+" s）"][md];
      var h="方式: <b>"+nm+"</b>";
      if(fall)h+='　<span class="warn">年齢 '+tau+' s が限度 30 s を超えたので、補正を使わず単独の解になった</span>';
      if(eff===2&&dE>0)h+="　基準局の座標の誤差 "+_w16_f(dE,1)+" m（東）→ 位置の平均が東へ "+_w16_f(dE,1)+" m ずれる";
      h+=U.tbl(["量","式","シミュレーション（"+N+" 回）"],rows,["left","right","right"]);
      /* GGA の文（12 章の例の文の、品質と 13・14 番の欄） */
      var q=eff===0?1:2,age=(eff===2)?_w16_f(tau,1):"",sid=(eff===2)?"0123":"";
      var body="GPGGA,092750.00,3540.86000,N,13946.02000,E,"+q+",08,0.95,3.3,M,36.7,M,"+age+","+sid;
      h+='<div style="font-family:var(--mono);font-size:.82rem;overflow-x:auto;white-space:nowrap">$'+body+"*"+cks(body)+"</div>";
      h+='<div class="wnote">GGA の測位の品質: '+(q===1?"1（単独）":"2（補正を使った）")+(eff===1?"。SBAS のときの 13・14 番の欄の書き方は製品による（ここでは空）":"")+"。散らばりは、どの衛星にも源ごとの誤差を正規分布で独立に入れ、線形化した式を最小二乗法で解いた（7 章のデモと同じ計算）。予算は 6 節の例の値。</div>";
      ro.innerHTML=h;
    }
    draw();
  };
