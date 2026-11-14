  /* ===== 07 章 誤差と DOP ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w07_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w07_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W07_C=299792458,_W07_TC=1/1.023e6,_W07_CTC=299792458/1.023e6,_W07_D=Math.PI/180,_W07_RE=6371e3,_W07_HI=350e3;
  var _W07_F={L1:1575.42e6,L2:1227.60e6,L5:1176.45e6};
  var _W07_TOK=[35.681,139.767,40.0];
  var _W07_N4=["G9","G6","G2","G3"],_W07_CL4=["G6","G13","G3","G9"];
  /* クロブッチャー・モデルの 8 つの係数（例の値。図と同じ） */
  var _W07_KA=[0.1118e-7,-0.7451e-8,-0.5961e-7,0.1192e-6],_W07_KP=[0.1167e6,-0.2294e6,-0.1311e6,0.1049e7];
  /* 誤差の源の色（本文と同じ）: 衛星 紫・電離層 金・対流圏 緑・マルチパス 赤・受信機の雑音 青緑 */
  var _W07_SRC=[["衛星の時計と軌道","purple"],["電離層","gold"],["対流圏","green"],["マルチパス","alias"],["受信機の雑音","teal"]];
  /* ---- 2 節: 電離層と対流圏 ---- */
  function _w07_klob(latd,lond,eld,azd,tgps,sc){var phu=latd/180,lmu=lond/180,E=eld/180,A=azd*_W07_D;
    var psi=0.0137/(E+0.11)-0.022,phi=Math.max(-0.416,Math.min(0.416,phu+psi*Math.cos(A)));
    var lam=lmu+psi*Math.sin(A)/Math.cos(phi*Math.PI),phm=phi+0.064*Math.cos((lam-1.617)*Math.PI);
    var t=((4.32e4*lam+tgps)%86400+86400)%86400,F=1+16*Math.pow(0.53-E,3),PER=0,AMP=0;
    for(var n=0;n<4;n++){PER+=_W07_KP[n]*Math.pow(phm,n);AMP+=_W07_KA[n]*Math.pow(phm,n);}
    PER=Math.max(PER,72000);AMP=Math.max((sc==null?1:sc)*AMP,0);var x=2*Math.PI*(t-50400)/PER;
    var Tv=Math.abs(x)<1.57?5e-9+AMP*(1-x*x/2+x*x*x*x/24):5e-9;
    return {F:F,Tv:Tv,T:F*Tv,AMP:AMP,PER:PER,t:t,phm:phm};}
  /* 東京の地方時 lt [時] の L1 の遅れ [m]（方位角は南） */
  function _w07_klt(lt,el,sc){return _w07_klob(_W07_TOK[0],_W07_TOK[1],el,180,(lt-_W07_TOK[1]/15)*3600,sc);}
  function _w07_shell(el){var s=_W07_RE*Math.cos(el*_W07_D)/(_W07_RE+_W07_HI);return 1/Math.sqrt(1-s*s);}
  function _w07_mT(el){var s=Math.sin(el*_W07_D);return 1.001/Math.sqrt(0.002001+s*s);}
  var _W07_ZHD=0.0022768*1013.25/(1-0.00266*Math.cos(2*_W07_TOK[0]*_W07_D)-0.00028*_W07_TOK[2]/1000);
  function _w07_hm(h){h=((h%24)+24)%24;var H=Math.floor(h+1e-9),M=Math.round((h-H)*60);if(M===60){H=(H+1)%24;M=0;}return H+":"+(M<10?"0":"")+M;}

  REG.w07_delay=function(el,U){
    var S=U.S;
    U.head(el,"IONOSPHERE & TROPOSPHERE","電離層と対流圏の遅れ — 時刻・仰角・周波数");
    var r1=U.ctrls(el);
    var lt=U.slider(r1,"地方時（電離層を通る点）",{min:0,max:24,step:0.25,value:14,fmt:function(v){return _w07_hm(v);},onInput:function(){draw();}});
    var th=U.slider(r1,"衛星の仰角 θ",{min:2,max:90,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var fq=U.select(r2,"周波数",["L1（1575.42 MHz）","L2（1227.60 MHz）","L5（1176.45 MHz）"],0,function(){draw();});
    var sc=U.slider(r2,"電離層の強さ（仮の倍率）",{values:[0.5,1,1.5,2,3],value:1,fmt:function(v){return "× "+v;},onInput:function(){draw();}});
    var wt=U.slider(r2,"対流圏の湿潤の部分（天頂）",{min:0,max:0.4,step:0.05,value:0.1,fmt:function(v){return _w07_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=lt.get()+0.25;if(v>24)v-=24;lt.set(v);draw();},90);
    U.button(br,"本文の例（14 時・仰角 30°・L1）",function(){tick.stop();lt.set(14);th.set(30);fq.set(0);sc.set(1);wt.set(0.1);draw();});
    U.button(br,"夜（2 時）",function(){lt.set(2);draw();});
    U.button(br,"低い衛星（仰角 5°）",function(){th.set(5);draw();});
    U.button(br,"再生（1 日を進める）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var pic=U.svgbox(el),box=U.svgbox(el),ro=U.readout(el);
    function fk(){return Math.pow(_W07_F.L1/[_W07_F.L1,_W07_F.L2,_W07_F.L5][fq.get()],2);}
    function draw(){
      var nar=_w07_nar(box),Wd=nar?400:700,t=lt.get(),e=th.get(),k=fk(),s=sc.get(),zw=wt.get();
      var kb=_w07_klt(t,e,s),Iz=kb.Tv*_W07_C*k,Is=kb.T*_W07_C*k,mI=_w07_shell(e),mT=_w07_mT(e),Tz=_W07_ZHD+zw,Ts=Tz*mT;
      var fn=["L1","L2","L5"][fq.get()];
      /* ---- (a) 斜めに通る絵（地球の中心は図の下。層の厚さは誇張） ---- */
      var q=[],gw=nar?400:360,cx=gw/2,R=nar?520:560,cy=96+R,hI=46,tT=16,ang=e*_W07_D;
      q.push(S.T(10,16,"電波が大気を斜めに通る（層の高さは誇張）","start",10.5,"ink",true));
      function arc(rr){var p=[];for(var a=-0.33;a<=0.33001;a+=0.02)p.push([cx+rr*Math.sin(a),cy-rr*Math.cos(a)]);return p;}
      var band=function(r1_,r2_,c){var a=arc(r1_),b=arc(r2_).reverse();return S.PL(a.concat(b),"none",0,U.soft(c));};
      q.push(band(R,R+tT,"green"));q.push(band(R+hI-6,R+hI+6,"gold"));
      q.push(S.PL(arc(R),"signal",1.6));
      q.push(S.T(8,cy-R-hI+20,"電離層","start",9.5,"gold",true));q.push(S.T(8,cy-R-1,"対流圏","start",9.5,"green",true));
      /* 受信機は円の頂点のやや左。右へ仰角 θ の向きに電波が来る */
      var a0=-0.14,rx=cx+R*Math.sin(a0),ry=cy-R*Math.cos(a0),ux=Math.sin(a0),uy=-Math.cos(a0),hx=-uy,hy=ux;
      var dx=hx*Math.cos(ang)+ux*Math.sin(ang),dy=hy*Math.cos(ang)+uy*Math.sin(ang);
      function hit(rr){var bq=2*((rx-cx)*dx+(ry-cy)*dy),cq=(rx-cx)*(rx-cx)+(ry-cy)*(ry-cy)-rr*rr;return (-bq+Math.sqrt(bq*bq-4*cq))/2;}
      var sT=hit(R+tT),sI1=hit(R+hI-6),sI2=hit(R+hI+6),sEnd=Math.min(hit(R+hI+40),900);
      q.push(S.L(rx,ry,rx+dx*sEnd,ry+dy*sEnd,"signal",1.4,"4 3"));
      q.push(S.L(rx,ry,rx+dx*sT,ry+dy*sT,"green",4.5));
      q.push(S.L(rx+dx*sI1,ry+dy*sI1,rx+dx*sI2,ry+dy*sI2,"gold",4.5));
      q.push(S.D(rx,ry-1,"green",4));
      q.push(S.T(rx-8,ry+20,"受信機（仰角 θ = "+e+"°）","start",9.5,"signal",true,false,null,true));
      /* 右の数字 */
      var bx=nar?10:378,by=nar?176:30;
      if(!nar){q.push(S.T(bx,by,"遅れの内訳（"+fn+"）","start",10.5,"ink",true));}
      var rows=[["電離層 天頂（通る点）",Iz,"gold"],["電離層 斜め（× "+_w07_f(kb.F,2)+"）",Is,"gold"],["対流圏 天頂",Tz,"green"],["対流圏 斜め（× "+_w07_f(mT,2)+"）",Ts,"green"]];
      var vmax=Math.max(30,Is+1,Ts+1),bw=nar?200:200,lx=bx+(nar?150:150);
      rows.forEach(function(r,i){var yy=(nar?by:by+14)+i*26;q.push(S.T(lx-6,yy+12,r[0],"end",9.5,r[2],true));
        q.push(S.RECT(lx,yy+2,Math.max(1,bw*r[1]/vmax),13,2,i%2?r[2]:U.soft(r[2]),r[2],1));q.push(S.T(lx+bw*r[1]/vmax+5,yy+13,_w07_f(r[1],2)+" m","start",9.5,r[2],true));});
      var yb=(nar?by:by+14)+4*26+8;
      q.push(S.T(nar?bx:bx,yb+8,"合計（斜め）"+_w07_f(Is+Ts,2)+" m","start",10.5,"ink",true));
      pic.set(S.svg(Wd,nar?yb+20:Math.max(240,yb+20),q));
      /* ---- (b) 1 日の変化 と (c) 仰角と遅れ ---- */
      var g=[],pw=nar?320:280,ph=150,x1=nar?54:60,y1=24;
      var P=U.plot(x1,y1,pw,ph,[0,24],[0,Math.max(6,Math.ceil(_w07_klt(14,e,s).T*_W07_C*k*1.15))]);
      g.push(S.T(x1-44,14,"(b) 1 日の電離層の遅れ（"+fn+"）","start",10,"ink",true));
      g.push(P.axes({xl:"地方時 [時]",yl:"遅れ [m]",xt:[0,6,12,18,24],ylOff:36}));
      var pz=[],ps=[];for(var i=0;i<=192;i++){var h=24*i/192,kk=_w07_klt(h,e,s);pz.push([h,kk.Tv*_W07_C*k]);ps.push([h,kk.T*_W07_C*k]);}
      g.push(P.clip(pz,"gold",2));g.push(P.clip(ps,"gold",1.6,"6 3"));
      g.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"ink",1,"3 3"));g.push(S.D(P.X(t),P.Y(Iz),"gold",4.5));g.push(S.D(P.X(t),P.Y(Math.min(Is,P.yr[1])),"gold",4.5));
      g.push(S.LEGL(x1,y1+ph+48,[["gold",null,"通る点の天頂"],["gold","6 3","仰角 "+e+"° の向き"]],9.5,14));
      var x2=nar?54:410,y2=nar?y1+ph+90:y1;
      var Q=U.plot(x2,y2,pw,ph,[0,90],[0.5,60],{ylog:true});
      g.push(S.T(x2-44,y2-10,"(c) 仰角と遅れ（"+fn+"、いまの時刻）","start",10,"ink",true));
      g.push(Q.axes({xl:"仰角 θ [°]",yl:"遅れ [m]",xt:[0,15,30,45,60,75,90],yt:[1,2,5,10,20,50],ylOff:36}));
      var ci=[],ct=[];for(var j=0;j<=88;j++){var ee=2+j;ci.push([ee,_w07_klt(t,ee,s).T*_W07_C*k]);ct.push([ee,Tz*_w07_mT(ee)]);}
      g.push(Q.clip(ci,"gold",2));g.push(Q.clip(ct,"green",2));
      g.push(S.L(Q.X(e),Q.y,Q.X(e),Q.y+Q.h,"ink",1,"3 3"));g.push(S.D(Q.X(e),Q.Y(Math.max(0.5,Is)),"gold",4.5));g.push(S.D(Q.X(e),Q.Y(Ts),"green",4.5));
      g.push(S.LEGL(x2,y2+ph+48,[["gold",null,"電離層（モデル）"],["green",null,"対流圏"]],9.5,14));
      box.set(S.svg(Wd,nar?y2+ph+58:y1+ph+58,g));
      /* ---- 読み出し ---- */
      var h2="<b>電離層</b>（クロブッチャー・モデル、例の係数 × "+s+"、東京から南の空の衛星）: 電離層を通る点の天頂の遅れ I<sub>z</sub> = <b>"+_w07_f(Iz,2)+" m</b>（L1 で "+_w07_f(kb.Tv*_W07_C,2)+" m × 周波数の倍率 (f<sub>L1</sub>/f)<sup>2</sup> = "+_w07_f(k,3)+"）、";
      h2+="振幅 A<sub>I</sub> = "+_w07_f(kb.AMP*_W07_C,2)+" m、周期 P<sub>I</sub> = "+_w07_f(kb.PER/3600,1)+" 時間<br>";
      h2+="マッピング関数: 薄い殻（350 km）の 1/cos z' = "+_w07_f(mI,3)+"、モデルの近似の式 1 + 16(0.53 − θ/180°)<sup>3</sup> = "+_w07_f(kb.F,3)+" → 斜めの遅れ I = <b>"+_w07_f(Is,2)+" m</b>（"+_w07_f(Is/_W07_C*1e9,1)+" ns）<br>";
      h2+="<b>対流圏</b>: 天頂 "+_w07_f(_W07_ZHD,2)+" m（乾燥）+ "+_w07_f(zw,2)+" m（湿潤）= "+_w07_f(Tz,2)+" m、m<sub>T</sub>(θ) = "+_w07_f(mT,3)+"（1/sin θ = "+_w07_f(1/Math.sin(e*_W07_D),3)+"）→ T = <b>"+_w07_f(Ts,2)+" m</b>（周波数によらない）<br>";
      h2+="合計 I + T = <b>"+_w07_f(Is+Ts,2)+" m</b>。クロブッチャー・モデルで直しても、I の約半分（"+_w07_f(Is/2,1)+" m ほど）は残る（代表値）";
      ro.innerHTML=h2+'<div class="wnote">電離層はクロブッチャー・モデル（IS-GPS-200 の手順、例の 8 つの係数）の値で、本当の電離層ではない。電離層を通る点は仰角とともに南へ動くので、その点の天頂の遅れも仰角で少し変わる（真上の衛星では東京の天頂の値）。「電離層の強さ」は、昼の振幅を仮に何倍かにして、太陽活動の違いを見るためのつまみである。対流圏の乾燥の部分は気圧 1013.25 hPa の Saastamoinen の式、マッピング関数は Black と Eisner の近似の式。</div>';
    }
    draw();
  };

  /* ---- 3 節: マルチパス — 反射波で相関がゆがみ、E と L が等しくなる点がずれる ---- */
  function _w07_lam(u){var a=Math.abs(u);return a<1?1-a:0;}
  /* 同じ位相（sgn=+1）・逆の位相（−1）のときの落ち着く点 [チップ]（本文の場合分けの式） */
  function _w07_env(g,tm,d,sgn){
    if(sgn>0){if(tm<(1+g)*d/2)return g*tm/(1+g);if(tm<=1-d/2+g*d/2)return g*d/2;if(tm<=1+d/2)return g*(1+d/2-tm)/(2-g);return 0;}
    if(tm<(1-g)*d/2)return -g*tm/(1-g);if(tm<=1-d/2-g*d/2)return -g*d/2;if(tm<=1+d/2)return -g*(1+d/2-tm)/(2+g);return 0;}
  /* 合わせた相関（直接波の振幅 dir、反射波は振幅 g・遅れ tm チップ・位相 psi [rad]）。[実部, 虚部] */
  function _w07_corr(u,g,tm,psi,dir){var a=dir*_w07_lam(u),b=g*_w07_lam(u-tm);return [a+b*Math.cos(psi),b*Math.sin(psi)];}
  /* E と L の電力の差（5 章 3 節の判別器の分子） */
  function _w07_disc(u,g,tm,psi,d,dir){var E=_w07_corr(u-d/2,g,tm,psi,dir),L=_w07_corr(u+d/2,g,tm,psi,dir);return E[0]*E[0]+E[1]*E[1]-L[0]*L[0]-L[1]*L[1];}
  /* 判別器が負から正へ 0 を横切る点（DLL が落ち着く点）のうち、0 に最も近いもの [チップ] */
  function _w07_track(g,tm,psi,d,dir){var best=null,prev=null,pu=0;
    for(var i=0;i<=1500;i++){var u=-1.2+i*0.002+1e-9,v=_w07_disc(u,g,tm,psi,d,dir);
      if(prev!==null&&prev<0&&v>0){var a=pu,b=u;for(var k=0;k<40;k++){var m=(a+b)/2;if(_w07_disc(m,g,tm,psi,d,dir)<0)a=m;else b=m;}var r=(a+b)/2;if(best===null||Math.abs(r)<Math.abs(best))best=r;}
      prev=v;pu=u;}
    return best===null?0:best;}
  var _W07_DEL=[1,0.5,0.2,0.1];
  REG.w07_multipath=function(el,U){
    var S=U.S;
    U.head(el,"MULTIPATH","反射波で相関がゆがみ、擬似距離がずれる");
    var r1=U.ctrls(el);
    var tmS=U.slider(r1,"反射波の余分の道のり cτ<sub>M</sub>",{min:0,max:480,step:0.5,value:146.5,fmt:function(v){return _w07_f(v,1)+" m（"+_w07_f(v/_W07_CTC,3)+" チップ）";},onInput:function(){draw();}});
    var gS=U.slider(r1,"振幅の比 γ",{min:0,max:0.9,step:0.05,value:0.5,fmt:function(v){return _w07_f(v,2)+(v>0?"（電力で "+_w07_f(20*Math.log10(v),1)+" dB）":"");},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var pS=U.slider(r2,"反射波の位相 ψ<sub>M</sub>",{min:0,max:360,step:1,value:0,fmt:function(v){return Math.round(v)+"°";},onInput:function(){draw();}});
    var dS=U.select(r2,"E と L の間隔",["1 チップ","0.5 チップ","0.2 チップ","0.1 チップ"],0,function(){draw();});
    var r3=U.ctrls(el);
    var nl=U.checkbox(r3,"直接波をさえぎる（NLOS）",false,function(){draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=pS.get()+4;if(v>=360)v-=360;pS.set(v);draw();},70);
    U.button(br,"本文の例（同じ位相）",function(){tick.stop();tmS.set(146.5);gS.set(0.5);pS.set(0);dS.set(0);nl.set(false);draw();});
    U.button(br,"逆の位相（180°）",function(){pS.set(180);draw();});
    U.button(br,"壁 20 m・仰角 30°（34.6 m）",function(){tmS.set(34.6);draw();});
    U.button(br,"位相を回す（再生）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),cache={key:"",ph:null};
    function draw(){
      var nar=_w07_nar(box),Wd=nar?400:700,tm=tmS.get()/_W07_CTC,g=gS.get(),psi=pS.get()*_W07_D,d=_W07_DEL[dS.get()],dir=nl.get()?0:1,o=[];
      var x=_w07_track(g,tm,psi,d,dir),M=x*_W07_CTC;
      var pw=nar?320:280,ph=nar?140:150,xl=nar?54:56,xr=nar?54:406,ya=26,yb=nar?ya+ph+76:ya,yc=nar?yb+ph+76:ya+ph+86,yd=nar?yc+ph+86:yc;
      /* (a) 相関の大きさ */
      var P=U.plot(xl,ya,pw,ph,[-1.5,2.0],[0,1.9]);
      o.push(S.T(xl-40,ya-10,"(a) 相関の大きさ（直接波の山を 1）","start",10,"ink",true));
      o.push(P.axes({xl:"局部の符号のずれ Δτ [チップ]",xt:[-1,-0.5,0,0.5,1,1.5,2],yt:[0,0.5,1,1.5],ylOff:34}));
      var pa=[],pb=[],pc=[];for(var i=0;i<=350;i++){var u=-1.5+i*0.01,c=_w07_corr(u,g,tm,psi,dir);pa.push([u,dir*_w07_lam(u)]);pb.push([u,g*_w07_lam(u-tm)]);pc.push([u,Math.hypot(c[0],c[1])]);}
      if(dir)o.push(P.line(pa,"green",1.5,"5 3"));o.push(P.line(pb,"alias",1.5,"5 3"));o.push(P.line(pc,"signal",2.4));
      o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"green",1,"2 2"));
      [[x-d/2,"E"],[x,"P"],[x+d/2,"L"]].forEach(function(q){var c=_w07_corr(q[0],g,tm,psi,dir),v=Math.hypot(c[0],c[1]);o.push(S.D(P.X(q[0]),P.Y(v),"gold",4.4));o.push(S.T(P.X(q[0]),P.Y(v)-7,q[1],"middle",10,"gold",true,false,null,true));});
      /* (b) S 字 */
      var Q=U.plot(xr,yb,pw,ph,[-1.0,1.8],[-1.0,1.0]);
      o.push(S.T(xr-40,yb-10,"(b) 判別器の S 字（5 章 3 節と同じ正規化）","start",10,"ink",true));
      o.push(Q.axes({xl:"局部の符号のずれ Δτ [チップ]",xt:[-1,-0.5,0,0.5,1,1.5],yt:[-1,-0.5,0,0.5,1],ylOff:34}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",1));
      var s0=[],s1=[];for(var j=0;j<=280;j++){var u2=-1+j*0.01;s0.push([u2,_w07_disc(u2,0,tm,psi,d,1)/(2*(2-d))]);s1.push([u2,_w07_disc(u2,g,tm,psi,d,dir)/(2*(2-d))]);}
      o.push(Q.clip(s0,"green",1.5,"5 3"));o.push(Q.clip(s1,"signal",2.2));
      o.push(S.D(Q.X(0),Q.Y(0),"green",4));o.push(S.D(Q.X(Math.max(-1,Math.min(1.8,x))),Q.Y(0),"gold",4.6));
      /* (c) 包絡線 */
      var lim=Math.max(20,Math.ceil(g*d/2*_W07_CTC/10)*10+10,dir?0:Math.ceil(Math.min(480,tmS.get())/50)*50);
      var Rr=U.plot(xl,yc,pw,ph,[0,1.6],[-lim,lim]);
      o.push(S.T(xl-40,yc-24,"(c) 誤差の包絡線（いまの γ と間隔）","start",10,"ink",true));
      o.push(Rr.axes({xl:"反射波の遅れ τ_M [チップ]",yl:"誤差 [m]",xt:[0,0.4,0.8,1.2,1.6],ylOff:34}));
      [0,100,200,300,400].forEach(function(v){var xx=Rr.X(v/_W07_CTC);o.push(S.L(xx,Rr.y,xx,Rr.y-4,"muted",1));o.push(S.T(xx,Rr.y-6,v+" m","middle",8.5,"muted"));});
      var up=[],dn=[];for(var k=0;k<=320;k++){var t2=1.6*k/320;up.push([t2,_w07_env(g,t2,d,1)*_W07_CTC]);dn.push([t2,_w07_env(g,t2,d,-1)*_W07_CTC]);}
      o.push(S.PL(up.map(function(q){return [Rr.X(q[0]),Rr.Y(q[1])];}).concat(dn.slice().reverse().map(function(q){return [Rr.X(q[0]),Rr.Y(q[1])];})),"none",0,U.soft("gold")));
      o.push(Rr.line(up,"gold",1.8));o.push(Rr.line(dn,"gold",1.8));o.push(S.L(Rr.x,Rr.Y(0),Rr.x+Rr.w,Rr.Y(0),"muted",1));
      if(!dir)o.push(Rr.clip([[0,0],[1.6,1.6*_W07_CTC]],"alias",1.4,"5 3"));
      var tmc=Math.min(tm,1.6);o.push(S.L(Rr.X(tmc),Rr.Y(_w07_env(g,tm,d,-1)*_W07_CTC),Rr.X(tmc),Rr.Y(_w07_env(g,tm,d,1)*_W07_CTC),"gold",3));
      o.push(S.D(Rr.X(tmc),Rr.Y(Math.max(-lim,Math.min(lim,M))),"signal",5));
      /* (d) 位相と誤差 */
      var key=[tm,g,d,dir].join(",");if(cache.key!==key){cache.key=key;cache.ph=[];for(var a2=0;a2<=360;a2+=5)cache.ph.push([a2,_w07_track(g,tm,a2*_W07_D,d,dir)*_W07_CTC]);}
      var ymn=Math.min.apply(null,cache.ph.map(function(q){return q[1];})),ymx=Math.max.apply(null,cache.ph.map(function(q){return q[1];})),pl=Math.max(10,Math.ceil(Math.max(Math.abs(ymn),Math.abs(ymx))/10)*10);
      var Dd=U.plot(xr,yd,pw,ph,[0,360],[-pl,pl]);
      o.push(S.T(xr-40,yd-24,"(d) 位相が回るときの誤差（衛星が動くと回る）","start",10,"ink",true));
      o.push(Dd.axes({xl:"反射波の位相 ψ_M [°]",yl:"誤差 [m]",xt:[0,90,180,270,360],ylOff:34}));
      o.push(S.L(Dd.x,Dd.Y(0),Dd.x+Dd.w,Dd.Y(0),"muted",1));
      o.push(Dd.line(cache.ph,"signal",2));o.push(S.D(Dd.X(pS.get()),Dd.Y(M),"signal",5));
      var Hh=yd+ph+56;
      o.push(S.LEGL(nar?xl-40:xl-40,Hh-4,[["green","5 3","直接波"],["alias","5 3","反射波"],["signal",null,"受けた信号"],["gold",null,"包絡線"]],9,12));
      box.set(S.svg(Wd,Hh+6,o));
      /* 読み出し */
      var ev=cache.ph.map(function(q){return q[1];}),mean=0,rms=0;ev.slice(0,-1).forEach(function(v){mean+=v;rms+=v*v;});mean/=ev.length-1;rms=Math.sqrt(rms/(ev.length-1));
      var hU=_w07_env(g,tm,d,1)*_W07_CTC,hD=_w07_env(g,tm,d,-1)*_W07_CTC;
      var h="余分の道のり cτ<sub>M</sub> = "+_w07_f(tmS.get(),1)+" m（"+_w07_f(tm,3)+" チップ）、γ = "+_w07_f(g,2)+"、ψ<sub>M</sub> = "+Math.round(pS.get())+"°、E と L の間隔 "+d+" チップ"+(dir?"":"、<span class=\"warn\">直接波なし（NLOS）</span>")+"<br>";
      h+="落ち着く点のずれ Δτ* = <b>"+_w07_f(x,3)+" チップ</b> → 擬似距離の誤差 M = <b>"+_w07_f(M,1)+" m</b><br>";
      if(dir){h+="包絡線（この遅れで）: 同じ位相 "+_w07_f(hU,1)+" m、逆の位相 "+_w07_f(hD,1)+" m。最大の大きさ γ × 間隔 × cT<sub>c</sub>/2 = "+_w07_f(g*d/2*_W07_CTC,1)+" m<br>";
        if(tm<(1-g)*d/2)h+="遅れが短いので、式 cτ<sub>M</sub>γ/(1 + γ) = "+_w07_f(tmS.get()*g/(1+g),1)+" m、−cτ<sub>M</sub>γ/(1 − γ) = "+_w07_f(-tmS.get()*g/(1-g),1)+" m の範囲<br>";
        h+="位相を 1 周回したとき: "+_w07_f(ymn,1)+"〜"+_w07_f(ymx,1)+" m、RMS "+_w07_f(rms,1)+" m、平均 "+_w07_f(mean,1)+" m";}
      else h+="直接波が無いので、DLL は反射波の山に合わせ、遅れの全部 cτ<sub>M</sub> = "+_w07_f(tmS.get(),1)+" m が誤差になる（包絡線の外）";
      ro.innerHTML=h+'<div class="wnote">搬送波の位相は分からないものとし、E と L の電力の差の判別器（5 章 3 節）が 0 を横切る点を数値で探した。相関の三角形は、受信機の帯域が十分に広い場合（頂点が鋭い）の形。γ・遅れ・位相は、反射する面と衛星の動きで決まる値の例。</div>';
    }
    draw();
  };

  /* ---- 4 節: DOP — スカイプロットの衛星を動かすと、DOP と誤差の楕円が変わる ---- */
  var _W07_ALLSYS=["GPS","GLONASS","Galileo","BeiDou","QZSS"];
  function _w07_vis(U,t,sys,mask){var rx=U.gnss.rx(_W07_TOK[0],_W07_TOK[1],_W07_TOK[2]),out=[];
    U.gnss.constellation().forEach(function(s){if(sys.indexOf(s.sys)<0)return;var ea=U.gnss.elaz(rx,U.gnss.ecef(s,t));if(ea[0]>(mask||0))out.push({nm:s.nm,sys:s.sys,el:ea[0],az:ea[1],s:s});});
    out.sort(function(a,b){return b.el-a.el;});return out;}
  /* 幾何行列（ENU の成分。衛星系ごとに時計の列）と (GᵀG)⁻¹、最小二乗の行列 A。解けないときは null */
  function _w07_geo(U,sats){var us=_W07_ALLSYS.filter(function(y){return sats.some(function(q){return q.sys===y;});});
    var n=3+us.length,m=sats.length;if(m<n||m===0)return null;
    var G=sats.map(function(q){var e=q.el*_W07_D,a=q.az*_W07_D,r=[-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e)];for(var k=0;k<us.length;k++)r.push(q.sys===us[k]?1:0);return r;});
    var M=U.ctl.mat,N=M.mul(M.T(G),G),H;try{H=M.inv(N);}catch(e){return null;}
    for(var i=0;i<n;i++)if(!isFinite(H[i][i])||H[i][i]>1e7||H[i][i]<0)return null;
    return {G:G,H:H,us:us,A:M.mul(H,M.T(G)),nc:us.length};}
  function _w07_ell(a,b,c){var m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);return [Math.sqrt(m+r),Math.sqrt(Math.max(m-r,0)),0.5*Math.atan2(2*b,a-c)/_W07_D];}
  /* 長い半径 s1・短い半径 s2 の 2 次元の正規分布で、半径 R の円に入る確率（5 節） */
  function _w07_pin(U,R,s1,s2){if(s2<1e-9*s1)return 1-U.gnss.erfc(R/(s1*Math.SQRT2));var n=360,sm=0;
    for(var i=0;i<n;i++){var ph=2*Math.PI*i/n,q=Math.cos(ph)*Math.cos(ph)/(s1*s1)+Math.sin(ph)*Math.sin(ph)/(s2*s2);sm+=(1-Math.exp(-R*R*q/2))/q;}return sm/n/(s1*s2);}
  function _w07_rad(U,p,s1,s2){var lo=0,hi=10*(s1+s2);for(var i=0;i<60;i++){var m=(lo+hi)/2;if(_w07_pin(U,m,s1,s2)<p)lo=m;else hi=m;}return (lo+hi)/2;}
  function _w07_nice(v){var c=[0.5,1,2,2.5,5,10,20,25,50,100,200,250,500,1000];for(var i=0;i<c.length;i++)if(c[i]>=v)return c[i];return 1000;}
  function _w07_ellpts(s1,s2,ang,k){var o=[],ca=Math.cos(ang*_W07_D),sa=Math.sin(ang*_W07_D);for(var i=0;i<=96;i++){var t=2*Math.PI*i/96,u=k*s1*Math.cos(t),v=k*s2*Math.sin(t);o.push([u*ca-v*sa,u*sa+v*ca]);}return o;}

  REG.w07_dop=function(el,U){
    var S=U.S;
    U.head(el,"DOP","空の衛星の並びと DOP・誤差の楕円");
    var r1=U.ctrls(el);
    var pre=U.select(r1,"衛星の並び",["1 章の 4 つ（G9・G6・G2・G3）","見えている 8 つ（GPS）","偏った 4 つ（G6・G13・G3・G9）","4 つを同じ仰角 45° に（円錐）","全部の衛星系"],1,function(){tick.stop();setPre();draw();});
    var mk=U.slider(r1,"仰角マスク",{min:0,max:40,step:1,value:0,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var sg=U.slider(r1,"擬似距離の誤差 σ",{values:[0.5,1,2,4],value:1,fmt:function(v){return v+" m";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var selS=U.select(r2,"動かす衛星（図の点をドラッグしてもよい）",["—"],0,function(){sel=selS.input.value;syncCtl();draw();});
    var elS=U.slider(r2,"その衛星の仰角",{min:0,max:90,step:0.5,value:45,fmt:function(v){return _w07_f(v,1)+"°";},onInput:function(v){var q=find(sel);if(q){q.el=v;q.man=true;}draw();}});
    var azS=U.slider(r2,"その衛星の方位角",{min:0,max:359,step:1,value:0,fmt:function(v){return Math.round(v)+"°";},onInput:function(v){var q=find(sel);if(q){q.az=v;q.man=true;}draw();}});
    var useC=U.checkbox(r2,"その衛星を使う（図の点を押しても切り替わる）",true,function(v){var q=find(sel);if(q)q.use=v;draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){tt+=300;refresh();draw();},120);
    U.button(br,"本文の例（見えている 8 つ）",function(){tick.stop();pre.set(1);mk.set(0);sg.set(1);setPre();draw();});
    U.button(br,"再生（時刻を進める）",function(){if(pre.get()===3)return;tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),sats=[],tt=0,sel=null,SK=null,dragging=false,downAt=null;
    function find(nm){for(var i=0;i<sats.length;i++)if(sats[i].nm===nm)return sats[i];return null;}
    function sysOf(){return pre.get()===4?_W07_ALLSYS:["GPS"];}
    function setPre(){tt=0;var k=pre.get();
      if(k===3){sats=[0,90,180,270].map(function(a,i){return {nm:"C"+(i+1),sys:"GPS",el:45,az:a,use:true,man:true};});}
      else{sats=_w07_vis(U,0,sysOf(),-90).filter(function(q){return q.el>0;}).map(function(q){return {nm:q.nm,sys:q.sys,el:q.el,az:q.az,s:q.s,man:false,
        use:k===0?_W07_N4.indexOf(q.nm)>=0:(k===2?_W07_CL4.indexOf(q.nm)>=0:true)};});}
      sel=sats.length?(k===0||k===2?(k===0?"G2":"G13"):sats[0].nm):null;rebuild();}
    function refresh(){var k=pre.get(),now=_w07_vis(U,tt,sysOf(),-90),keep={};sats.forEach(function(q){keep[q.nm]=q;});var out=[];
      now.forEach(function(q){var o=keep[q.nm];if(o&&o.man){out.push(o);return;}if(q.el<=0)return;
        out.push({nm:q.nm,sys:q.sys,el:q.el,az:q.az,s:q.s,man:false,use:o?o.use:(k===1||k===4)});});
      sats.forEach(function(q){if(q.man&&!q.s)out.push(q);});sats=out;if(!find(sel))sel=sats.length?sats[0].nm:null;rebuild();}
    function rebuild(){var s=selS.input;s.innerHTML="";sats.forEach(function(q){var op=document.createElement("option");op.value=q.nm;op.textContent=q.nm;s.appendChild(op);});if(sel)s.value=sel;syncCtl();}
    function syncCtl(){var q=find(sel);if(!q)return;elS.set(Math.round(q.el*2)/2);azS.set(Math.round(q.az));useC.set(q.use);}
    var GEO={cx:0,cy:0,R:1};
    U.ctl.drag(box,function(type,x,y){
      if(type==="down"){var best=null,bd=16;(SK||[]).forEach(function(p){var d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p.nm;}});if(!best)return false;sel=best;dragging=false;downAt=[x,y];tick.stop();rebuild();draw();return true;}
      if(type==="move"&&downAt){if(!dragging&&Math.hypot(x-downAt[0],y-downAt[1])<4)return;dragging=true;var q=find(sel);if(!q)return;
        var dx=x-GEO.cx,dy=y-GEO.cy,rr=Math.min(GEO.R,Math.hypot(dx,dy));q.el=Math.max(0,90*(1-rr/GEO.R));q.az=((Math.atan2(dx,-dy)/_W07_D)+360)%360;q.man=true;syncCtl();draw();return;}
      if(type==="up"){if(!dragging&&downAt){var q2=find(sel);if(q2){q2.use=!q2.use;syncCtl();}}dragging=false;downAt=null;draw();}});
    function draw(){
      var nar=_w07_nar(box),Wd=nar?400:700,o=[],m0=mk.get(),sig=sg.get();
      var act=sats.filter(function(q){return q.use&&q.el>m0&&q.el>=0;}),geo=_w07_geo(U,act);
      /* (a) スカイプロット */
      var cx=nar?200:158,cy=nar?150:166,R=nar?104:120;GEO={cx:cx,cy:cy,R:R};
      o.push(S.T(nar?10:14,18,"(a) 空の衛星（ドラッグで動かす・押して切り替える）","start",10,"ink",true));
      var many=sats.length>16,pts=sats.map(function(q){var on=q.use&&q.el>m0;return {el:q.el,az:q.az,name:(!many||q.nm===sel)?q.nm:null,col:on?"purple":"faint",hl:q.nm===sel};});
      o.push(U.gnss.sky(U,cx,cy,R,pts,{dot:4.4,sz:pre.get()===4?8.5:9.5,labels:true}));
      if(m0>0)o.push(S.CIRC(cx,cy,R*(90-m0)/90,"alias",1.3,null,"5 3"));
      SK=sats.map(function(q){var p=U.gnss.skyxy(cx,cy,R,q.el,q.az);return {x:p[0],y:p[1],nm:q.nm};});
      o.push(S.T(cx,cy+R+34,"使う衛星 "+act.length+" 個"+(m0>0?"（赤の破線はマスク "+m0+"°）":"")+(many?"。名前は選んだ衛星だけ":""),"middle",9.5,act.length>=4?"purple":"alias",true));
      /* (b) 誤差の楕円 */
      var ex=nar?60:362,ey=nar?cy+R+66:40,ew=nar?240:210;
      o.push(S.T(ex-46,ey-12,"(b) 水平の誤差の楕円（σ = "+sig+" m）","start",10,"ink",true));
      var dd=null,s1=0,s2=0,ang=0;
      var nu=3;(function(){var us=[];act.forEach(function(q){if(us.indexOf(q.sys)<0)us.push(q.sys);});nu=3+Math.max(1,us.length);})();
      if(geo){var H=geo.H;dd={G:Math.sqrt(H[0][0]+H[1][1]+H[2][2]+H[3][3]),P:Math.sqrt(H[0][0]+H[1][1]+H[2][2]),H:Math.sqrt(H[0][0]+H[1][1]),V:Math.sqrt(H[2][2]),T:Math.sqrt(H[3][3])};
        var e3=_w07_ell(H[0][0]*sig*sig,H[0][1]*sig*sig,H[1][1]*sig*sig);s1=e3[0];s2=e3[1];ang=e3[2];}
      var lim=_w07_nice(dd?Math.max(1.3*dd.H*sig,0.5):1);
      var P=U.plot(ex,ey,ew,ew,[-lim,lim],[-lim,lim]);
      o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));
      o.push(P.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9}));
      o.push(S.T(P.x+P.w/2,P.y+P.h+28,"東西（横）・南北（縦）[m]","middle",9,"muted"));
      if(dd){o.push(P.clip(_w07_ellpts(s1,s2,ang,1),"alias",2.2));
        var cpts=[];for(var j=0;j<=96;j++){var a=2*Math.PI*j/96;cpts.push([dd.H*sig*Math.cos(a),dd.H*sig*Math.sin(a)]);}o.push(P.clip(cpts,"purple",1.4,"5 3"));}
      else o.push(S.T(P.x+P.w/2,P.y+P.h/2,"解けない","middle",11,"alias",true,false,null,true));
      o.push(S.L(P.X(0)-5,P.Y(0),P.X(0)+5,P.Y(0),"green",2));o.push(S.L(P.X(0),P.Y(0)-5,P.X(0),P.Y(0)+5,"green",2));
      /* 上下の棒 */
      var vx=P.x+P.w+(nar?26:30),vlim=_w07_nice(dd?Math.max(1.3*dd.V*sig,0.5):1),Q=U.plot(vx,ey,24,ew,[0,1],[-vlim,vlim]);
      o.push(S.RECT(vx,ey,24,ew,3,"var(--screen)","line",1));
      [-vlim,0,vlim].forEach(function(v){o.push(S.T(vx+30,Q.Y(v)+3,_w07_f(v,v%1?1:0),"start",8.5,"muted"));});
      if(dd){o.push(S.RECT(vx+3,Q.Y(dd.V*sig),18,Q.Y(-dd.V*sig)-Q.Y(dd.V*sig),2,U.soft("alias"),"alias",1.4));}
      o.push(S.T(vx+12,ey-12+(nar?0:0),"上下","middle",9.5,"ink",true));
      /* (c) DOP の棒 */
      var bx=nar?110:362,by=nar?ey+ew+70:ey+ew+64,bw=nar?220:260;
      o.push(S.T(nar?10:bx-46,by-14,"(c) DOP（対数の目盛）","start",10,"ink",true));
      var L=U.plot(bx,by,bw,5*20,[0.3,100],[0,1],{xlog:true});
      [0.5,1,2,5,10,20,50,100].forEach(function(v){o.push(S.L(L.X(v),by,L.X(v),by+100,"grid",1));o.push(S.T(L.X(v),by+112,String(v),"middle",8.5,"muted"));});
      [["GDOP","G"],["PDOP","P"],["HDOP","H"],["VDOP","V"],["TDOP","T"]].forEach(function(r,i){var yy=by+i*20+3;o.push(S.T(bx-6,yy+11,r[0],"end",9.5,"ink",true));
        var v=dd?dd[r[1]]:Infinity,c=r[0]==="HDOP"||r[0]==="VDOP"?"alias":"purple";
        o.push(S.RECT(bx,yy,Math.max(1,Math.min(bw,L.X(Math.min(v,100))-bx)),14,2,U.soft(c),c,1));
        o.push(S.T(Math.min(bx+bw-2,L.X(Math.min(v,100))+4),yy+11,isFinite(v)?_w07_f(v,2):"∞",L.X(Math.min(v,100))+40>bx+bw?"end":"start",9.5,c,true,false,null,true));});
      box.set(S.svg(Wd,by+124,o));
      /* 読み出し */
      var h="使う衛星 "+act.length+" 個: "+(act.length?act.map(function(q){return q.nm;}).join("・"):"なし")+"。未知数は位置 3 つと時計のずれ "+(geo?geo.nc:1)+" つ（衛星系ごと）<br>";
      if(dd){var cep=_w07_rad(U,0.5,s1,s2),r95=_w07_rad(U,0.95,s1,s2),azl=((90-ang)%180+180)%180;
        h+="GDOP <b>"+_w07_f(dd.G,2)+"</b>、PDOP <b>"+_w07_f(dd.P,2)+"</b>、HDOP <b>"+_w07_f(dd.H,2)+"</b>、VDOP <b>"+_w07_f(dd.V,2)+"</b>、TDOP <b>"+_w07_f(dd.T,2)+"</b><br>";
        h+="誤差の楕円: 長い半径 "+_w07_f(s1,2)+" m（方位 "+_w07_f(azl,0)+"° と "+_w07_f((azl+180)%360,0)+"° の向き）、短い半径 "+_w07_f(s2,2)+" m。水平の DRMS = HDOP × σ = <b>"+_w07_f(dd.H*sig,2)+" m</b>（紫の破線の円）、CEP "+_w07_f(cep,2)+" m、R95 "+_w07_f(r95,2)+" m<br>";
        h+="上下: VDOP × σ = <b>"+_w07_f(dd.V*sig,2)+" m</b>（95 % は "+_w07_f(1.96*dd.V*sig,2)+" m）。時計のずれ: TDOP × σ = "+_w07_f(dd.T*sig,2)+" m（"+_w07_f(dd.T*sig/_W07_C*1e9,1)+" ns）";}
      else h+='<span class="warn">'+(act.length<nu?"使う衛星（"+act.length+" 個）が未知数（"+nu+" 個）より少ないので解けない。":"衛星の並びが悪く、GᵀG に逆行列が無いので解けない（同じ仰角に並ぶ円錐の並びなど）。")+'</span>';
      ro.innerHTML=h+'<div class="wnote">東京、1 章の近似の配置（再生では 1 こまで 5 分進む）。ドラッグで動かした衛星は、その位置に止まる。DOP は (GᵀG)<sup>−1</sup> の対角成分から計算し、全部の衛星系では、衛星系ごとに時計のずれの未知数を置いた（TDOP は最初の衛星系の時計）。</div>';
    }
    setPre();draw();
  };

  /* ---- 6 節: 誤差の予算 → UERE → DOP を掛けて位置の散らばり ---- */
  REG.w07_scatter=function(el,U){
    var S=U.S;
    U.head(el,"ERROR BUDGET","誤差の予算から UERE、DOP を掛けて位置の散らばりへ");
    var r1=U.ctrls(el),def=[1.5,3.5,0.4,1.0,0.5],mx=[3,8,2,10,3];
    var sl=_W07_SRC.map(function(sc,i){return U.slider(r1,sc[0]+"の σ",{min:0,max:mx[i],step:mx[i]>2?0.1:0.05,value:def[i],fmt:function(v){return _w07_f(v,2)+" m";},onInput:function(){draw();}});});
    var r2=U.ctrls(el);
    var cfg=U.select(r2,"衛星の並び",["1 章の 4 つ（時刻 0）","見えている 8 つ（時刻 0）","偏った 4 つ（時刻 0）","全部の衛星系（時刻 0・マスク 10°）"],1,function(){geo=null;draw();});
    var nS=U.slider(r2,"解く回数",{values:[500,1000,2000,5000],value:2000,fmt:function(v){return v+" 回";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cE=U.checkbox(r3,"誤差の楕円",true,function(){draw();}),cC=U.checkbox(r3,"CEP",true,function(){draw();}),cR=U.checkbox(r3,"R95",true,function(){draw();}),c2=U.checkbox(r3,"2DRMS",true,function(){draw();});
    var br=U.btnrow(el),seed=1,geo=null;
    U.button(br,"本文の例（見えている 8 つ）",function(){def.forEach(function(v,i){sl[i].set(v);});cfg.set(1);nS.set(2000);seed=1;geo=null;draw();});
    U.button(br,"電離層を半分に（1.75 m）",function(){sl[1].set(1.75);draw();});
    U.button(br,"ビル街の例（マルチパス 8 m）",function(){sl[3].set(8);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function sats(){var k=cfg.get();if(k===3)return _w07_vis(U,0,_W07_ALLSYS,10);var v=_w07_vis(U,0,["GPS"],0);
      return v.filter(function(q){return k===1||(k===0?_W07_N4:_W07_CL4).indexOf(q.nm)>=0;});}
    function draw(){
      if(!geo)geo=_w07_geo(U,sats());
      var nar=_w07_nar(box),Wd=nar?400:700,o=[],sg=sl.map(function(s){return s.get();}),ue=Math.sqrt(sg.reduce(function(a,v){return a+v*v;},0)),N=nS.get();
      /* (a) 予算 */
      var bx=nar?150:150,by=26,bw=nar?190:170;
      o.push(S.T(nar?10:14,16,"(a) 誤差の予算（1σ）","start",10,"ink",true));
      var vmax=Math.max(4,ue*1.1);
      sg.forEach(function(v,i){var yy=by+i*22,c=_W07_SRC[i][1];o.push(S.T(bx-6,yy+11,_W07_SRC[i][0],"end",9.5,c,true));o.push(S.RECT(bx,yy,Math.max(0.5,bw*v/vmax),14,2,U.soft(c),c,1));o.push(S.T(bx+bw*v/vmax+4,yy+11,_w07_f(v,2)+" m","start",9.5,c,true));});
      var yu=by+5*22+4;o.push(S.T(bx-6,yu+11,"UERE","end",10,"ink",true));o.push(S.RECT(bx,yu,bw*ue/vmax,14,2,"ink","ink",1));o.push(S.T(bx+bw*ue/vmax+4,yu+11,_w07_f(ue,2)+" m","start",10,"ink",true));
      /* 分散の割合 */
      var yv=yu+30,tot=ue*ue||1,xx=nar?10:14,ww=nar?370:310;o.push(S.T(xx,yv,"分散（2 乗）の割合","start",9.5,"muted",true));
      sg.forEach(function(v,i){var w=ww*v*v/tot;if(w>0.3)o.push(S.RECT(xx,yv+6,w,14,0,U.soft(_W07_SRC[i][1]),_W07_SRC[i][1],1));if(w>34)o.push(S.T(xx+w/2,yv+17,_w07_f(100*v*v/tot,0)+" %","middle",9,_W07_SRC[i][1],true));xx+=w;});
      /* 散らばり */
      var px=nar?54:390,py=nar?yv+60:26,pw=nar?260:220;
      o.push(S.T(px-40,py-10,"(b) 水平の位置の誤差","start",10,"ink",true));
      if(!geo){box.set(S.svg(Wd,py+40,o.concat([S.T(px,py+20,"解けない並び","start",11,"alias",true)])));ro.innerHTML="";return;}
      var H=geo.H,A=geo.A,m=A[0].length,HD=Math.sqrt(H[0][0]+H[1][1]),VD=Math.sqrt(H[2][2]);
      var e3=_w07_ell(H[0][0]*ue*ue,H[0][1]*ue*ue,H[1][1]*ue*ue),s1=e3[0],s2=e3[1],drms=HD*ue;
      var cep=s1>0?_w07_rad(U,0.5,s1,s2):0,r95=s1>0?_w07_rad(U,0.95,s1,s2):0,p2=s1>0?_w07_pin(U,2*drms,s1,s2):1;
      var rng=U.rng(seed*7919+11),E=[],cin=[0,0,0],sh=0,ups=[];
      for(var t=0;t<N;t++){var eta=[];for(var i=0;i<m;i++){var s=0;for(var k=0;k<5;k++)s+=sg[k]*rng.normal();eta.push(s);}
        var x=0,y=0,u=0;for(var j=0;j<m;j++){x+=A[0][j]*eta[j];y+=A[1][j]*eta[j];u+=A[2][j]*eta[j];}
        var d=Math.hypot(x,y);if(d<=cep)cin[0]++;if(d<=r95)cin[1]++;if(d<=2*drms)cin[2]++;sh+=d*d;ups.push(Math.abs(u));if(t<1500)E.push([x,y,u]);}
      ups.sort(function(a,b){return a-b;});var u95=ups[Math.floor(0.95*N)];
      var lim=_w07_nice(Math.max(1,2.3*drms)),P=U.plot(px,py,pw,pw,[-lim,lim],[-lim,lim]);
      o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));o.push(P.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9}));
      E.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"gold",1.1));});
      function circ(r,c,dash){var p=[];for(var i=0;i<=96;i++){var a=2*Math.PI*i/96;p.push([r*Math.cos(a),r*Math.sin(a)]);}return P.clip(p,c,1.8,dash);}
      if(cE.get())o.push(P.clip(_w07_ellpts(s1,s2,e3[2],1),"purple",1.8));
      if(cC.get())o.push(circ(cep,"signal",null));if(cR.get())o.push(circ(r95,"alias",null));if(c2.get())o.push(circ(2*drms,"ink","5 3"));
      o.push(S.L(P.X(0)-5,P.Y(0),P.X(0)+5,P.Y(0),"green",2));o.push(S.L(P.X(0),P.Y(0)-5,P.X(0),P.Y(0)+5,"green",2));
      o.push(S.T(P.x+P.w/2,P.y+P.h+28,"東西（横）・南北（縦）[m]","middle",9,"muted"));
      /* 上下 */
      var vx=P.x+P.w+(nar?26:30),vl=_w07_nice(Math.max(1,2.4*VD*ue)),Q=U.plot(vx,py,40,pw,[0,1],[-vl,vl]),jr=U.rng(seed+5);
      o.push(S.RECT(vx,py,40,pw,3,"var(--screen)","line",1));o.push(S.T(vx+20,py-10,"上下","middle",10,"ink",true));
      [-vl,0,vl].forEach(function(v){o.push(S.T(vx+44,Q.Y(v)+3,_w07_f(v,v%1?1:0),"start",8.5,"muted"));});
      E.forEach(function(q){if(Math.abs(q[2])<vl)o.push(S.D(vx+6+28*jr.next(),Q.Y(q[2]),"gold",1.0));});
      [1,-1].forEach(function(sgn){o.push(S.L(vx,Q.Y(sgn*1.96*VD*ue),vx+40,Q.Y(sgn*1.96*VD*ue),"alias",1.6,"4 2"));});
      var Hh=py+pw+(nar?44:44);
      o.push(S.LEGL(nar?10:px-40,Hh,[["purple",null,"楕円"],["signal",null,"CEP"],["alias",null,"R95"],["ink","5 3","2DRMS"],["alias","4 2","上下 95 %"]],9,10));
      box.set(S.svg(Wd,Hh+8,o));
      /* 読み出し */
      var rows=[["水平の DRMS",_w07_f(drms,2)+" m",_w07_f(Math.sqrt(sh/N),2)+" m"],["CEP（50 %）",_w07_f(cep,2)+" m","中に "+_w07_f(100*cin[0]/N,1)+" %"],
        ["R95（95 %）",_w07_f(r95,2)+" m","中に "+_w07_f(100*cin[1]/N,1)+" %"],["2DRMS",_w07_f(2*drms,2)+" m（"+_w07_f(100*p2,1)+" %）","中に "+_w07_f(100*cin[2]/N,1)+" %"],
        ["上下の 95 %",_w07_f(1.96*VD*ue,2)+" m",_w07_f(u95,2)+" m"]];
      var h="UERE = √(Σσ²) = <b>"+_w07_f(ue,2)+" m</b>（単純に足すと "+_w07_f(sg.reduce(function(a,v){return a+v;},0),2)+" m）。HDOP "+_w07_f(HD,2)+"・VDOP "+_w07_f(VD,2)+"（衛星 "+m+" 個）";
      h+=U.tbl(["量","式","シミュレーション（"+N+" 回）"],rows,["left","right","right"]);
      ro.innerHTML=h+'<div class="wnote">どの衛星にも、5 つの源の誤差を、それぞれの σ の正規分布で独立に入れ、線形化した式を最小二乗法で解いた位置の誤差。「式」は、4・5 節の σ²(GᵀG)<sup>−1</sup> と誤差の楕円からの計算（DRMS = HDOP × UERE、上下の 95 % = 1.96 × VDOP × UERE）。衛星の並びは 1 章の近似の配置（東京）。</div>';
    }
    draw();
  };
