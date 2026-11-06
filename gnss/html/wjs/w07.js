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
    var sc=U.slider(r2,"電離層の強さ（例の係数の振幅の倍率。仮に変える）",{values:[0.5,1,1.5,2,3],value:1,fmt:function(v){return "× "+v;},onInput:function(){draw();}});
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
      var q=[],gw=nar?400:360,cx=gw/2,R=nar?520:560,cy=60+R,hI=46,tT=16,ang=e*_W07_D;
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
      q.push(S.T(rx+22*Math.cos(ang/2)*1,ry-6,"θ = "+e+"°","start",10,"signal",true,false,null,true));
      /* 右の数字 */
      var bx=nar?10:378,by=nar?150:30;
      if(!nar){q.push(S.T(bx,by,"遅れの内訳（"+fn+"）","start",10.5,"ink",true));}
      var rows=[["電離層 天頂",Iz,"gold"],["電離層 斜め（× "+_w07_f(kb.F,2)+"）",Is,"gold"],["対流圏 天頂",Tz,"green"],["対流圏 斜め（× "+_w07_f(mT,2)+"）",Ts,"green"]];
      var vmax=Math.max(30,Is+1,Ts+1),bw=nar?200:200,lx=bx+(nar?150:150);
      rows.forEach(function(r,i){var yy=(nar?by:by+14)+i*26;q.push(S.T(lx-6,yy+12,r[0],"end",9.5,r[2],true));
        q.push(S.RECT(lx,yy+2,Math.max(1,bw*r[1]/vmax),13,2,i%2?r[2]:U.soft(r[2]),r[2],1));q.push(S.T(lx+bw*r[1]/vmax+5,yy+13,_w07_f(r[1],2)+" m","start",9.5,r[2],true));});
      var yb=(nar?by:by+14)+4*26+8;
      q.push(S.T(nar?bx:bx,yb+8,"合計（斜め）"+_w07_f(Is+Ts,2)+" m","start",10.5,"ink",true));
      pic.set(S.svg(Wd,nar?yb+20:Math.max(220,yb+20),q));
      /* ---- (b) 1 日の変化 と (c) 仰角と遅れ ---- */
      var g=[],pw=nar?320:280,ph=150,x1=nar?54:60,y1=24;
      var P=U.plot(x1,y1,pw,ph,[0,24],[0,Math.max(6,Math.ceil(_w07_klt(14,e,s).T*_W07_C*k*1.15))]);
      g.push(S.T(x1-44,14,"(b) 1 日の電離層の遅れ（東京、"+fn+"）","start",10,"ink",true));
      g.push(P.axes({xl:"地方時 [時]",yl:"遅れ [m]",xt:[0,6,12,18,24],ylOff:36}));
      var pz=[],ps=[];for(var i=0;i<=192;i++){var h=24*i/192,kk=_w07_klt(h,e,s);pz.push([h,kk.Tv*_W07_C*k]);ps.push([h,kk.T*_W07_C*k]);}
      g.push(P.clip(pz,"gold",2));g.push(P.clip(ps,"gold",1.6,"6 3"));
      g.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"ink",1,"3 3"));g.push(S.D(P.X(t),P.Y(Iz),"gold",4.5));g.push(S.D(P.X(t),P.Y(Math.min(Is,P.yr[1])),"gold",4.5));
      g.push(S.LEGL(x1,y1+ph+48,[["gold",null,"天頂"],["gold","6 3","仰角 "+e+"° の向き"]],9.5,14));
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
      var h2="<b>電離層</b>（クロブッチャー・モデル、例の係数 × "+s+"、方位は南）: 天頂の遅れ I<sub>z</sub> = <b>"+_w07_f(Iz,2)+" m</b>（L1 で "+_w07_f(kb.Tv*_W07_C,2)+" m × 周波数の倍率 (f<sub>L1</sub>/f)<sup>2</sup> = "+_w07_f(k,3)+"）、";
      h2+="振幅 A<sub>I</sub> = "+_w07_f(kb.AMP*_W07_C,2)+" m、周期 P<sub>I</sub> = "+_w07_f(kb.PER/3600,1)+" 時間<br>";
      h2+="マッピング関数: 薄い殻（350 km）の 1/cos z' = "+_w07_f(mI,3)+"、モデルの近似の式 1 + 16(0.53 − θ/180°)<sup>3</sup> = "+_w07_f(kb.F,3)+" → 斜めの遅れ I = <b>"+_w07_f(Is,2)+" m</b>（"+_w07_f(Is/_W07_C*1e9,1)+" ns）<br>";
      h2+="<b>対流圏</b>: 天頂 "+_w07_f(_W07_ZHD,2)+" m（乾燥）+ "+_w07_f(zw,2)+" m（湿潤）= "+_w07_f(Tz,2)+" m、m<sub>T</sub>(θ) = "+_w07_f(mT,3)+"（1/sin θ = "+_w07_f(1/Math.sin(e*_W07_D),3)+"）→ T = <b>"+_w07_f(Ts,2)+" m</b>（周波数によらない）<br>";
      h2+="合計 I + T = <b>"+_w07_f(Is+Ts,2)+" m</b>。クロブッチャー・モデルで直しても、I の約半分（"+_w07_f(Is/2,1)+" m ほど）は残る（代表値）";
      ro.innerHTML=h2+'<div class="wnote">電離層はクロブッチャー・モデル（IS-GPS-200 の手順、例の 8 つの係数）の値で、本当の電離層ではない。「電離層の強さ」は、昼の振幅を仮に何倍かにして、太陽活動の違いを見るためのつまみである。対流圏の乾燥の部分は気圧 1013.25 hPa の Saastamoinen の式、マッピング関数は Black と Eisner の近似の式。</div>';
    }
    draw();
  };
