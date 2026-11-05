  /* ===== 12 章 根軌跡 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w12_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w12_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w12_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=v.toExponential(1);return s.replace(/^-/,"−");}
  /* 有効数字 d 桁（末尾の 0 を残す。例 −3.20） */
  function _w12_p3(v,d){d=d||3;if(Math.abs(v)<1e-9)return "0";var s=(+v).toPrecision(d);if(s.indexOf("e")>=0)return _w12_sig(v,d);return s.replace(/^-/,"−");}
  /* 極の文字。共役な組は「a ± jb」にまとめる（虚部が負のものは省く） */
  function _w12_plist(rs,d){var out=[];rs.forEach(function(z){var tol=1e-6*(1+Math.abs(z.re)+Math.abs(z.im));
    if(Math.abs(z.im)<=tol)out.push(_w12_p3(z.re,d||3));else if(z.im>0)out.push((Math.abs(z.re)<1e-6*(1+Math.abs(z.im))?"":_w12_p3(z.re,d||3)+" ")+"± <i>j</i>"+_w12_p3(z.im,d||3));});return out.join("、");}
  /* K_c の刻み: 0 と 10^lo〜10^hi を対数の目盛で等しく（1 桁を per 等分）。extra の値も入れる */
  function _w12_kgrid(lo,hi,per,extra){var n=Math.max(2,Math.round((hi-lo)*per)),ks=[0];for(var i=0;i<=n;i++)ks.push(Math.pow(10,lo+(hi-lo)*i/n));
    (extra||[]).forEach(function(e){if(e>0)ks.push(e);});ks.sort(function(x,y){return x-y;});return ks;}
  /* a(s) + K b(s) = 0 の根を Ks の各 K で求め、1 つ前の K の根に近い根を同じ枝につなぐ（本文 1 節の方法）。返り値 R[枝][K の番号] = {re, im} */
  function _w12_track(U,a,b,Ks){var P=U.ctl.poly,R=null,prev=null;
    Ks.forEach(function(K){var r=P.roots(P.add(a,P.scale(b,K)));
      if(!R){R=r.map(function(z){return [z];});prev=r;return;}
      if(r.length!==prev.length)return;
      var n=r.length,pairs=[],ui={},uj={},asg=[],cnt=0,i,j;
      for(i=0;i<n;i++)for(j=0;j<n;j++)pairs.push([Math.hypot(prev[i].re-r[j].re,prev[i].im-r[j].im),i,j]);
      pairs.sort(function(x,y){return x[0]-y[0];});
      for(var k=0;k<pairs.length&&cnt<n;k++){var q=pairs[k];if(ui[q[1]]||uj[q[2]])continue;ui[q[1]]=1;uj[q[2]]=1;asg[q[1]]=r[q[2]];cnt++;}
      for(i=0;i<n;i++)R[i].push(asg[i]);prev=asg;});
    return R||[];}
  /* 枝をすべて描く（枠の外は切る） */
  function _w12_br(P,R,c,lw,dash){return R.map(function(br){return P.clip(br.map(function(z){return [z.re,z.im];}),c,lw,dash);}).join("");}
  /* s 平面の地 */
  function _w12_sp(U,S,P,xt,yt,lab,zeta){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+U.ctl.splane(P,{zeta:zeta})+P.axes({xl:lab===false?null:"実部 σ [1/s]",yl:lab===false?null:"虚部 ω [rad/s]",xt:xt,yt:yt,xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,3);},ylOff:36,sz:9})+U.ctl.splane(P,{rhp:false});}
  function _w12_in(P,z){return z.re>=P.xr[0]&&z.re<=P.xr[1]&&z.im>=P.yr[0]&&z.im<=P.yr[1];}
  /* 開ループの極と零点・漸近線・分岐点（本文 2 節の性質）。a は分母（最も高い次の係数 1）、b は分子 */
  function _w12_props(U,a,b){var P=U.ctl.poly,ps=P.roots(a),zs=P.trim(b.slice()).length>1?P.roots(b):[],n=ps.length,m=zs.length,sp=0,sz=0,q;
    ps.forEach(function(p){sp+=p.re;});zs.forEach(function(z){sz+=z.re;});
    var o={ps:ps,zs:zs,n:n,m:m,sa:n>m?(sp-sz)/(n-m):null,angs:[],sump:sp};
    for(q=0;q<n-m;q++)o.angs.push(180*(2*q+1)/(n-m));
    var d=P.sub(P.mul(P.deriv(a),b),P.mul(a,P.deriv(b))),br=[];
    if(P.trim(d).length>1)P.roots(d).forEach(function(r){if(Math.abs(r.im)<1e-6*(1+Math.abs(r.re))){var K=-P.val(a,r.re)/P.val(b,r.re);if(K>0&&isFinite(K))br.push({s:r.re,K:K});}});
    o.br=br;
    /* 実軸の上の部分: 右にある実数の極と零点の数が奇数の区間 */
    var xs=[];ps.concat(zs).forEach(function(z){if(Math.abs(z.im)<1e-7*(1+Math.abs(z.re)))xs.push(z.re);});xs.sort(function(x,y){return y-x;});
    o.seg=[];for(q=0;q<xs.length;q+=2)o.seg.push([q+1<xs.length?xs[q+1]:-Infinity,xs[q]]);
    return o;}
  /* 性質を描く: 実軸の上の部分（金の太線）・漸近線（金の破線）・分岐点（金の点） */
  function _w12_drawProps(S,P,pr){var o=[],L=10*Math.max(P.xr[1]-P.xr[0],P.yr[1]-P.yr[0]);
    pr.seg.forEach(function(sg){var x0=Math.max(P.xr[0],sg[0]),x1=Math.min(P.xr[1],sg[1]);if(x1>x0)o.push(S.L(P.X(x0),P.Y(0),P.X(x1),P.Y(0),"gold",5));});
    if(pr.sa!==null&&pr.n-pr.m>=2){pr.angs.forEach(function(an){var r=an*Math.PI/180;o.push(P.clip([[pr.sa,0],[pr.sa+L*Math.cos(r),L*Math.sin(r)]],"gold",1.4,"6 4"));});
      if(pr.sa>=P.xr[0]&&pr.sa<=P.xr[1])o.push(S.D(P.X(pr.sa),P.Y(0),"gold",4));}
    pr.br.forEach(function(b){if(b.s>=P.xr[0]&&b.s<=P.xr[1])o.push(S.CIRC(P.X(b.s),P.Y(0),5.5,"gold",2));});
    return o.join("");}
  /* 単位ステップ応答と、行き過ぎ量 [%]・2 % 整定時間 */
  function _w12_resp(U,num,den,tEnd,n){return U.ctl.step(U.ctl.tf(num,den),tEnd,n||600);}
  function _w12_info(t,y,yf){var im=0,last=-1;for(var i=0;i<y.length;i++){if(y[i]>y[im])im=i;if(Math.abs(y[i]-yf)>0.02*Math.abs(yf))last=i;}
    return {Mp:Math.max(0,(y[im]-yf)/yf*100),t2:last<0?0:(last>=y.length-1?Infinity:t[last+1])};}
  /* 根の組の中で虚軸に最も近いもの（支配極）の減衰比と固有角周波数 */
  function _w12_dom(rs){var best=null;rs.forEach(function(z){if(z.im<-1e-9)return;if(!best||z.re>best.re)best=z;});
    if(!best)return null;var wn=Math.hypot(best.re,best.im);return {z:best,wn:wn,zeta:wn>0?-best.re/wn:1};}
  function _w12_unstable(rs){return rs.some(function(z){return z.re>1e-9;});}
  function _w12_axis(rs){return rs.some(function(z){return Math.abs(z.re)<=1e-6*(1+Math.abs(z.im));});}
  /* 円弧（中心 (cx, cy)、半径 r、角度は度で正の実軸から反時計回り） */
  function _w12_arc(S,cx,cy,r,a0,a1,c,lw){var x0=cx+r*Math.cos(a0*Math.PI/180),y0=cy-r*Math.sin(a0*Math.PI/180),x1=cx+r*Math.cos(a1*Math.PI/180),y1=cy-r*Math.sin(a1*Math.PI/180);
    return S.PATH("M"+x0.toFixed(2)+","+y0.toFixed(2)+" A"+r+","+r+" 0 "+(Math.abs(a1-a0)>180?1:0)+" "+(a1>a0?0:1)+" "+x1.toFixed(2)+","+y1.toFixed(2),c,lw||1.3);}
  /* 漸近線の角度の文字（180° はそのまま、ほかは ±） */
  function _w12_angtxt(a){var w=_w12_wrap(a);return (Math.abs(Math.abs(w)-180)<1e-9?"180":(w>0?"+":"")+_w12_f(w,0))+"°";}
  /* 角度を [−180, 180) にそろえる（−180° は負の側で表す） */
  function _w12_wrap(a){while(a>=180)a-=360;while(a<-180)a+=360;return a;}

  /* ---- 2 節: 角度の条件と大きさの条件を、点を動かして確かめる ---- */
  REG.w12_angle=function(el,U){
    var S=U.S,TD=0.02/0.84;
    var EX=[{name:"モータの位置（比例）",a:[1,20,0],b:[1000],xr:[-30,10],yr:[-20,20],xt:[-30,-20,-10,0,10],yt:[-20,-10,0,10,20],pt:{re:-10,im:10.49},unit:"V/rad"},
            {name:"PD のモータの位置（零点 −42）",a:[1,20,0],b:[1000*TD,1000],xr:[-110,10],yr:[-45,45],xt:[-100,-80,-60,-40,-20,0],yt:[-40,-20,0,20,40],pt:{re:-20,im:20.98},unit:"V/rad"},
            {name:"台車とばね・ダンパ＋装置の遅れ（3 次）",a:[1,12,45,250],b:[10],xr:[-16,6],yr:[-11,11],xt:[-15,-10,-5,0,5],yt:[-10,-5,0,5,10],pt:{re:-4,im:4},unit:"N/m"},
            {name:"PI のモータの位置（積分時間 0.42 s）",a:[1,20,0,0],b:[1000,1000/0.42],xr:[-22,4],yr:[-14,14],xt:[-20,-15,-10,-5,0],yt:[-10,-5,0,5,10],pt:{re:-8.4,im:9.26},unit:"V/rad"}];
    var COLS=["teal","purple","gold","green","signal","alias"];
    U.head(el,"ANGLE","角度の条件と大きさの条件 — 点を動かして確かめる");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",EX.map(function(e){return e.name;}),0,function(){reset();});
    var cl=U.checkbox(r1,"根軌跡を重ねる",true,function(){draw();});
    var cp=U.checkbox(r1,"性質を重ねる（実軸の上の部分・漸近線・分岐点）",false,function(){draw();});
    var r2=U.ctrls(el);
    var sre=U.slider(r2,"点の実部 σ",{min:-30,max:10,step:0.01,value:-10,fmt:function(v){return _w12_f(v,2)+" /s";},onInput:function(v){pt.re=v;draw();}});
    var sim=U.slider(r2,"点の虚部 ω",{min:-20,max:20,step:0.01,value:10.49,fmt:function(v){return _w12_f(v,2)+" rad/s";},onInput:function(v){pt.im=v;draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の点",function(){var E=EX[ex.get()];pt={re:E.pt.re,im:E.pt.im};syncS();draw();});
    U.button(br,"根軌跡の上へ寄せる",function(){snap();draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,pt={re:-10,im:10.49},cache={i:-1};
    function locus(){var i=ex.get();if(cache.i!==i){var E=EX[i];cache={i:i,R:_w12_track(U,E.a,E.b,_w12_kgrid(-5,5,60)),pr:_w12_props(U,E.a,E.b)};}return cache;}
    function syncS(){var E=EX[ex.get()];sre.input.min=E.xr[0];sre.input.max=E.xr[1];sim.input.min=E.yr[0];sim.input.max=E.yr[1];
      sre.input.step=(E.xr[1]-E.xr[0])/4000;sim.input.step=(E.yr[1]-E.yr[0])/4000;sre.set(pt.re);sim.set(pt.im);}
    function reset(){var E=EX[ex.get()];pt={re:E.pt.re,im:E.pt.im};syncS();draw();}
    function snap(){var C=locus(),best=null,bd=Infinity;C.R.forEach(function(brn){brn.forEach(function(z){var d=Math.hypot((z.re-pt.re)/(PP?PP.xr[1]-PP.xr[0]:1),(z.im-pt.im)/(PP?PP.yr[1]-PP.yr[0]:1));if(d<bd&&Math.abs(z.im)>1e-9){bd=d;best=z;}});});
      if(best){pt={re:best.re,im:best.im};syncS();}}
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&(x<PP.x||x>PP.x+PP.w||y<PP.y||y>PP.y+PP.h))return false;
      pt={re:Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),im:Math.max(PP.yr[0],Math.min(PP.yr[1],PP.uy(y)))};syncS();draw();});
    function draw(){
      var E=EX[ex.get()],C=locus(),pr=C.pr,nar=_w12_nar(box),Wd=nar?400:700,o=[];
      var pw=nar?330:380,ph=Math.max(200,Math.min(320,pw*(E.yr[1]-E.yr[0])/(E.xr[1]-E.xr[0])));
      var P=U.plot(nar?52:56,20,pw,ph,E.xr,E.yr);PP=P;
      o.push(_w12_sp(U,S,P,E.xt,E.yt));
      if(cp.get())o.push(_w12_drawProps(S,P,pr));
      if(cl.get())o.push(_w12_br(P,C.R,"signal",1.6));
      /* 矢印と角度 */
      var els=[],sum=0,lp=1,lz=1;
      pr.zs.forEach(function(z){els.push({z:z,k:"z"});});pr.ps.forEach(function(p){els.push({z:p,k:"p"});});
      els.forEach(function(e,i){var dx=pt.re-e.z.re,dy=pt.im-e.z.im,ang=Math.atan2(dy,dx)*180/Math.PI,len=Math.hypot(dx,dy);e.ang=ang;e.len=len;e.c=COLS[i%COLS.length];
        if(e.k==="z"){sum+=ang;lz*=len;}else{sum-=ang;lp*=len;}
        var x0=P.X(e.z.re),y0=P.Y(e.z.im);
        o.push(S.L(x0,y0,x0+22,y0,e.c,1,"3 2"));
        if(len>1e-9){o.push(_w12_arc(S,x0,y0,13+3*(i%3),0,ang,e.c,1.3));o.push(S.ARR(x0,y0,P.X(pt.re),P.Y(pt.im),e.c,1.5,6));}});
      o.push(U.ctl.pz(P,pr.ps,pr.zs,"muted",5.5));
      var lhs=_w12_wrap(sum),dev=180-Math.abs(lhs),on=Math.abs(dev)<1.0;if(Math.abs(dev)<0.05)lhs=-180;
      var beta=U.ctl.poly.trim(E.b.slice())[0],Kc=lp/(beta*lz);
      o.push(S.CIRC(P.X(pt.re),P.Y(pt.im),7,on?"green":"alias",2.4,"screen"));
      o.push(S.D(P.X(pt.re),P.Y(pt.im),on?"green":"alias",3));
      o.push(S.T(P.x+P.w,P.y-6,"点をドラッグ（つまみでも動く）","end",9,"muted"));
      /* 角度の針 */
      var cx=nar?200:575,cy=nar?20+ph+150:130,R0=70;
      o.push(S.T(cx,cy-R0-22,"角度の条件の左辺","middle",10,"ink",true));
      o.push(S.CIRC(cx,cy,R0,"line",1.2,"screen"));
      o.push(S.L(cx-R0-8,cy,cx+R0+8,cy,"faint",1));o.push(S.L(cx,cy-R0-6,cx,cy+R0+6,"faint",1));
      o.push(S.L(cx,cy,cx-R0,cy,"green",4));
      o.push(S.T(cx-R0-6,cy-8,"±180°","end",9.5,"green",true));
      o.push(S.T(cx+R0+6,cy+4,"0°","start",9.5,"muted"));
      var rad=lhs*Math.PI/180,nc=on?"green":"alias";
      o.push(S.ARR(cx,cy,cx+(R0-6)*Math.cos(rad),cy-(R0-6)*Math.sin(rad),nc,2.6,9));
      o.push(S.D(cx,cy,"ink",3));
      o.push(S.T(cx,cy+R0+22,"左辺 = "+_w12_f(lhs,1)+"°","middle",11,nc,true));
      o.push(S.T(cx,cy+R0+38,on?"真左を向く: 根軌跡の上":"真左を向かない: 根軌跡の上に無い","middle",9.5,nc,true));
      var H=nar?cy+R0+50:Math.max(20+ph+46,cy+R0+50);
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var rows=els.map(function(e){return [(e.k==="p"?"極 ":"零点 ")+_w12_plist([e.z]).replace(" ± ","+"),'<span style="color:'+U.col(e.c)+'">■</span> '+_w12_f(e.ang,1)+"°",_w12_sig(e.len,4)];});
      var h=U.tbl(["開ループの極・零点","矢印の角度","矢印の長さ"],rows,["left","right","right"]);
      h+="点 s = "+_w12_f(pt.re,2)+(pt.im>=0?" + ":" − ")+"j"+_w12_f(Math.abs(pt.im),2)+"　左辺（零点の角度の和 − 極の角度の和）= "+_w12_f(lhs,1)+"°（180° の奇数倍とのずれ "+_w12_f(Math.abs(dev),1)+"°）<br>";
      h+="大きさの条件: K<sub>c</sub> = 極からの長さの積 ÷ (β × 零点からの長さの積) = "+_w12_sig(lp,4)+" ÷ ("+_w12_sig(beta,4)+(pr.m?" × "+_w12_sig(lz,4):"")+") = <b>"+_w12_sig(Kc,4)+" "+E.unit+"</b><br>";
      if(on){var rs=U.ctl.poly.roots(U.ctl.poly.add(E.a,U.ctl.poly.scale(E.b,Kc)));h+='<span class="ok">根軌跡の上にある。</span>この K<sub>c</sub> の閉ループの極: '+_w12_plist(rs)+"（点 s を含む）";}
      else h+='<span class="warn">角度の条件を満たさない。</span>どの K<sub>c</sub>（正）でも、この点は閉ループの極にならない（上の K<sub>c</sub> は、根軌跡の上の点でだけ意味がある）';
      ro.innerHTML=h+'<div class="wnote">角度は正の実軸から反時計回りに測る。根軌跡（青）は、K<sub>c</sub> を 10<sup>−5</sup>〜10<sup>5</sup> の対数の目盛で細かく変えて根を求め、1 つ前の根に近い根をつないだもの。「性質を重ねる」の金の太線は実軸の上の部分、破線は漸近線、金の丸は分岐点（本文 2 節の式で求めた値）。</div>';
    }
    reset();
  };

  /* ---- 3 節: K_c を動かすと閉ループの極が根軌跡の上を動き、応答が変わる ---- */
  REG.w12_locus=function(el,U){
    var S=U.S;
    var EX=[
      {name:"一次遅れ 2 つ（L_a を含むモータの角速度）",a:[1,2000,40000],b:[2e6],views:[{xr:[-2200,200],yr:[-1600,1600],xt:[-2000,-1000,0],yt:[-1000,0,1000]}],
       kr:[0.001,10],k0:0.1,unit:"V/(rad/s)",tEnd:0.04,yl:"角速度 [rad/s]",marks:[[0.48,"分岐点 −1000"]]},
      {name:"積分＋一次遅れ（モータの位置）",a:[1,20,0],b:[1000],views:[{xr:[-30,10],yr:[-40,40],xt:[-30,-20,-10,0,10],yt:[-40,-20,0,20,40]},{xr:[-30,10],yr:[-110,110],xt:[-30,-20,-10,0,10],yt:[-100,-50,0,50,100]}],
       kr:[0.001,10],k0:0.21,unit:"V/rad",tEnd:0.6,yl:"角度 [rad]",marks:[[0.1,"分岐点 −10"],[0.21,"ζ = 0.690"]]},
      {name:"二次遅れ（台車とばね・ダンパの位置）",a:[1,2,25],b:[1],views:[{xr:[-8,4],yr:[-20,20],xt:[-8,-4,0,4],yt:[-20,-10,0,10,20]}],
       kr:[0.1,1000],k0:25,unit:"N/m",tEnd:6,yl:"位置 [m]",marks:[]},
      {name:"3 次（L_a を含むモータの位置）",a:[1,2000,40000,0],b:[2e6],views:[{xr:[-40,20],yr:[-260,260],xt:[-40,-20,0,20],yt:[-200,-100,0,100,200]},{xr:[-2600,600],yr:[-1600,1600],xt:[-2000,-1000,0],yt:[-1000,0,1000]}],
       kr:[0.001,100],k0:0.21,unit:"V/rad",tEnd:0.6,yl:"角度 [rad]",marks:[[0.1005,"分岐点 −10.08"],[0.21,"本文の例"],[10,"10 V/rad"],[40,"虚軸 ±j200"]]},
      {name:"3 次（力を出す装置の遅れのある台車）",a:[1,12,45,250],b:[10],views:[{xr:[-16,6],yr:[-11,11],xt:[-15,-10,-5,0,5],yt:[-10,-5,0,5,10]}],
       kr:[0.1,100],k0:10,unit:"N/m",tEnd:8,yl:"位置 [m]",marks:[[29,"虚軸 ±j6.71"]]}];
    U.head(el,"ROOT LOCUS","根軌跡の上を動く閉ループの極と、目標値のステップ応答");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",EX.map(function(e){return e.name;}),1,function(){stop();setEx();});
    var vw=U.select(r1,"表示の範囲",["原点の近く","広く"],0,function(){draw();});
    var cp=U.checkbox(r1,"性質を重ねる（実軸の上の部分・漸近線・分岐点）",false,function(){draw();});
    var r2=U.ctrls(el);
    var kc=U.slider(r2,"K<sub>c</sub>",{min:0.001,max:1000,log:true,value:0.21,fmt:function(v){return _w12_sig(v,3)+" "+EX[ex.get()].unit;},onInput:function(){stop();draw();}});
    var br=U.btnrow(el),mb=U.btnrow(el);
    var tk=U.ticker(function(){var E=EX[ex.get()],lk=Math.log10(kc.get())+(Math.log10(E.kr[1])-Math.log10(E.kr[0]))/150;
      if(lk>=Math.log10(E.kr[1])){kc.set(E.kr[1]);stop();}else kc.set(+Math.pow(10,lk).toPrecision(4));draw();},60);
    var bplay=U.button(br,"再生（K<sub>c</sub> を小さい値から上げる）",function(){var E=EX[ex.get()];if(kc.get()>=E.kr[1]*0.999)kc.set(E.kr[0]);tk.start();});
    U.button(br,"停止",function(){stop();});
    U.button(br,"本文の例",function(){stop();kc.set(EX[ex.get()].k0);draw();});
    function stop(){tk.stop();}
    var box=U.svgbox(el),ro=U.readout(el),cache={i:-1};
    function setEx(){var E=EX[ex.get()];kc.set(E.k0);
      mb.innerHTML="";E.marks.forEach(function(m){U.button(mb,m[1]+"（"+_w12_sig(m[0],4)+"）",function(){stop();kc.set(m[0]);draw();});});
      vw.el.style.display=E.views.length>1?"":"none";if(E.views.length<2)vw.set(0);draw();}
    function data(){var i=ex.get();if(cache.i!==i){var E=EX[i],lo=Math.log10(E.kr[0])-3,hi=Math.log10(E.kr[1])+3;
      cache={i:i,Ks:_w12_kgrid(lo,hi,80,E.marks.map(function(m){return m[0];})),pr:_w12_props(U,E.a,E.b)};cache.R=_w12_track(U,E.a,E.b,cache.Ks);}return cache;}
    function draw(){
      var E=EX[ex.get()],C=data(),V=E.views[Math.min(vw.get(),E.views.length-1)],K=kc.get(),nar=_w12_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:300,nar?250:300,V.xr,V.yr);
      o.push(_w12_sp(U,S,P,V.xt,V.yt));
      if(cp.get())o.push(_w12_drawProps(S,P,C.pr));
      o.push(_w12_br(P,C.R,"signal",1.8));
      o.push(U.ctl.pz(P,C.pr.ps,C.pr.zs,"muted",5));
      var num=U.ctl.poly.scale(E.b,K),den=U.ctl.poly.add(E.a,num),rs=U.ctl.poly.roots(den),uns=_w12_unstable(rs),ax=_w12_axis(rs);
      var cpl=uns?"alias":"gold";
      rs.forEach(function(z){if(_w12_in(P,z))o.push(S.X(P.X(z.re),P.Y(z.im),6.5,cpl,2.6));
        else{var xx=Math.max(P.x+4,Math.min(P.x+P.w-4,P.X(Math.max(P.xr[0],Math.min(P.xr[1],z.re))))),yy=Math.max(P.y+4,Math.min(P.y+P.h-4,P.Y(Math.max(P.yr[0],Math.min(P.yr[1],z.im)))));o.push(S.D(xx,yy,cpl,3.6));}});
      o.push(S.TX(P.x,P.y-6,"青: 根軌跡　金の ×: K_c = "+_w12_sig(K,3)+" の閉ループの極","start",9,"muted"));
      /* ステップ応答 */
      var r=_w12_resp(U,num,den,E.tEnd,800),yf=uns?null:U.ctl.dcgain(U.ctl.tf(num,den));
      var ymax=1.2,ymin=0;r.y.forEach(function(v){if(isFinite(v)){ymax=Math.max(ymax,Math.min(v*1.05,2.6));ymin=Math.min(ymin,Math.max(v,-1.5));}});
      var qx=nar?52:420,qy=nar?20+250+62:20,qw=nar?330:266,qh=nar?150:230;
      var Q=U.plot(qx,qy,qw,qh,[0,E.tEnd],[ymin,ymax]);
      o.push(Q.axes({xl:"時間 t [s]",yl:E.yl,xt:U.nice(0,E.tEnd,4),yt:U.nice(ymin,ymax,4),xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,2);},ylOff:40}));
      o.push(Q.line([[0,1],[E.tEnd,1]],"muted",1,"4 3"));
      var pts=[];for(var i=0;i<r.t.length;i++)pts.push([r.t[i],r.y[i]]);
      o.push(Q.clip(pts,uns?"alias":"signal",2));
      o.push(S.T(Q.x,Q.y-6,"目標値の単位ステップに対する応答","start",9,"muted"));
      box.set(S.svg(Wd,nar?qy+qh+42:20+300+44,o));
      /* 読み出し */
      var h="K<sub>c</sub> = "+_w12_sig(K,4)+" "+E.unit+"　閉ループの極: "+_w12_plist(rs)+"<br>";
      var dm=_w12_dom(rs);
      if(uns)h+='<span class="warn">不安定: 右半平面に極がある（揺れが大きくなり続ける）</span>';
      else if(ax)h+='<span class="warn">安定限界: 極が虚軸の上にある（同じ振れ幅で揺れ続ける）</span>';
      else{var inf=_w12_info(r.t,r.y,yf);
        h+='<span class="ok">安定</span>　虚軸に最も近い極 '+_w12_plist([dm.z])+"（減衰比 "+_w12_f(dm.zeta,3)+"、固有角周波数 "+_w12_sig(dm.wn,3)+" rad/s）<br>";
        h+="落ち着く値 "+_w12_sig(yf,3)+"　行き過ぎ量 "+_w12_f(inf.Mp,1)+" %　2 % 整定時間 "+(isFinite(inf.t2)?_w12_sig(inf.t2,3)+" s":"（表示の時間内に落ち着かない）");}
      var sum=0;rs.forEach(function(z){sum+=z.re;});
      h+="<br>閉ループの極の和 "+_w12_sig(sum,4)+"（開ループの極の和 "+_w12_sig(C.pr.sump,4)+"。n − m = "+(C.pr.n-C.pr.m)+(C.pr.n-C.pr.m>=2?" なので一定":"")+"）";
      ro.innerHTML=h+'<div class="wnote">応答は、閉ループ伝達関数 K<sub>c</sub>b(s)/{a(s) + K<sub>c</sub>b(s)} を零次ホールドで厳密に離散化して求めた。行き過ぎ量は落ち着く値に対する割合。極が枠の外にあるときは、枠の縁に点で示す。</div>';
    }
    setEx();
  };

  /* ---- 4 節: 開ループの極と零点を動かすと、根軌跡が描き直される ---- */
  REG.w12_edit=function(el,U){
    var S=U.S,TD=0.02/0.84,TI=0.42,TIp=0.168;
    var zp=(function(){var r=U.ctl.poly.roots([TIp*TD,TIp,1]);return r.map(function(z){return z.re;}).sort(function(x,y){return x-y;});})();
    var PRE=[
      {name:"比例（モータの位置）",ps:[0,-20],zs:[],beta:1000,K:0.21,view:1,unit:"V/rad"},
      {name:"PD（零点 −42）",ps:[0,-20],zs:[-1/TD],beta:1000*TD,K:0.84,view:0,unit:"V/rad"},
      {name:"不完全微分の PD（N = 10）",ps:[0,-20,-10/TD],zs:[-1/(1.1*TD)],beta:11000,K:0.84,view:0,unit:"V/rad"},
      {name:"PI（零点 −2.38）",ps:[0,0,-20],zs:[-1/TI],beta:1000,K:0.21,view:2,unit:"V/rad"},
      {name:"積分だけ",ps:[0,0,-20],zs:[],beta:1000,K:0.5,view:2,unit:"V/(rad·s)"},
      {name:"PID（零点 −7.18 と −34.8）",ps:[0,0,-20],zs:zp,beta:1000*TD,K:0.84,view:1,unit:"V/rad"}];
    var VIEWS=[{name:"広く（−110〜10）",xr:[-110,10],yr:[-60,60],xt:[-100,-80,-60,-40,-20,0],yt:[-60,-30,0,30,60]},
               {name:"中くらい（−50〜10）",xr:[-50,10],yr:[-40,40],xt:[-50,-40,-30,-20,-10,0,10],yt:[-40,-20,0,20,40]},
               {name:"原点の近く（−25〜5）",xr:[-25,5],yr:[-25,25],xt:[-25,-20,-15,-10,-5,0,5],yt:[-20,-10,0,10,20]}];
    U.head(el,"EDIT","極と零点を足す・動かす — 根軌跡がどう曲がるか");
    var r1=U.ctrls(el);
    var pre=U.select(r1,"初めの形",PRE.map(function(p){return p.name;}),0,function(){load(pre.get());});
    var vw=U.select(r1,"表示の範囲",VIEWS.map(function(v){return v.name;}),1,function(){draw();});
    var cref=U.checkbox(r1,"比例だけの根軌跡を重ねる",true,function(){draw();});
    var cpr=U.checkbox(r1,"漸近線・分岐点",true,function(){draw();});
    var br=U.btnrow(el);
    var items=[],sel=-1,msg="",beta=1000,unit="V/rad";
    function np(){return items.filter(function(it){return it.k==="p";}).reduce(function(s,it){return s+(it.pair?2:1);},0);}
    function nz(){return items.filter(function(it){return it.k==="z";}).reduce(function(s,it){return s+(it.pair?2:1);},0);}
    function add(k,pair,re,im){msg="";var d=pair?2:1;
      if(k==="p"&&np()+d>6){msg="極は 6 個までにしている";draw();return;}
      if(k==="z"&&nz()+d>np()-1){msg="一巡伝達関数を厳密にプロパーに保つため、零点は極より少なくしている（先に極を足す）";draw();return;}
      items.push({k:k,pair:pair,re:re,im:pair?im:0});sel=items.length-1;draw();}
    U.button(br,"実の極を足す",function(){add("p",false,-5,0);});
    U.button(br,"極の組を足す",function(){add("p",true,-8,12);});
    U.button(br,"実の零点を足す",function(){add("z",false,-30,0);});
    U.button(br,"零点の組を足す",function(){add("z",true,-30,15);});
    U.button(br,"初めの形に戻す（本文の例）",function(){load(pre.get());});
    U.button(br,"選んだものを消す",function(){msg="";if(sel>=0){items.splice(sel,1);sel=-1;while(nz()>Math.max(0,np()-1)){for(var i=items.length-1;i>=0;i--)if(items[i].k==="z"){items.splice(i,1);break;}msg="零点が極より少なくなるよう、零点も消した";}}draw();});
    var r2=U.ctrls(el);
    var sre=U.slider(r2,"選んだ極・零点の実部 σ",{min:-110,max:10,step:0.1,value:-20,fmt:function(v){return _w12_f(v,1)+" /s";},onInput:function(v){if(sel<0||sel>=items.length)return;items[sel].re=v;draw();}});
    var sim=U.slider(r2,"選んだ組の虚部 ω",{min:0,max:60,step:0.1,value:10,fmt:function(v){return _w12_f(v,1)+" rad/s";},onInput:function(v){if(sel<0||sel>=items.length||!items[sel].pair)return;items[sel].im=v;draw();}});
    var kc=U.slider(r2,"K<sub>c</sub>",{min:0.001,max:1000,log:true,value:0.21,fmt:function(v){return _w12_sig(v,3)+" "+unit;},onInput:function(){draw();}});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,drag=-1;
    function load(i){var p=PRE[i];items=p.ps.map(function(v){return {k:"p",pair:false,re:v,im:0};}).concat(p.zs.map(function(v){return {k:"z",pair:false,re:v,im:0};}));
      beta=p.beta;unit=p.unit;sel=-1;msg="";vw.set(p.view);kc.set(p.K);draw();}
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){drag=-1;return;}
      if(x==null||!PP)return;
      if(type==="down"){var best=-1,bd=16;
        items.forEach(function(it,i){var xs=PP.X(it.re),ys=[PP.Y(it.im)];if(it.pair)ys.push(PP.Y(-it.im));ys.forEach(function(yy){var d=Math.hypot(x-xs,y-yy);if(d<bd){bd=d;best=i;}});});
        if(best<0){if(x>=PP.x&&x<=PP.x+PP.w&&y>=PP.y&&y<=PP.y+PP.h){sel=-1;draw();}return false;}
        sel=best;drag=best;draw();return;}
      if(drag<0)return;
      var it=items[drag],re=Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),tol=(PP.xr[1]-PP.xr[0])/200;
      if(Math.abs(re)<tol*2)re=0;
      if(it.pair){var im=Math.min(PP.yr[1],Math.abs(PP.uy(y)));if(im<tol*2)im=0.01;it.im=+im.toFixed(3);}
      it.re=+re.toFixed(3);draw();});
    function polyOf(k){var rs=[];items.forEach(function(it){if(it.k!==k)return;rs.push({re:it.re,im:it.im});if(it.pair)rs.push({re:it.re,im:-it.im});});return rs.length?U.ctl.poly.fromRoots(rs):[1];}
    function draw(){
      var has=sel>=0&&sel<items.length;sre.input.disabled=!has;sim.input.disabled=!(has&&items[sel].pair);
      if(has){sre.set(items[sel].re);if(items[sel].pair)sim.set(items[sel].im);}
      var V=VIEWS[vw.get()],nar=_w12_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:330,nar?260:300,V.xr,V.yr);PP=P;
      o.push(_w12_sp(U,S,P,V.xt,V.yt));
      if(cref.get()){o.push(S.L(P.X(-20),P.Y(0),P.X(0),P.Y(0),"muted",3.4));if(-10>=P.xr[0])o.push(S.L(P.X(-10),P.y,P.X(-10),P.y+P.h,"muted",1.4,"5 4"));}
      var a=polyOf("p"),b=U.ctl.poly.scale(polyOf("z"),beta),ok=np()>0&&nz()<np(),K=kc.get(),rs=[],pr=null;
      if(ok){pr=_w12_props(U,a,b);
        var R=_w12_track(U,a,b,_w12_kgrid(-5,6,45,[K]));
        if(cpr.get()){if(pr.sa!==null&&pr.n-pr.m>=2){var L=10*(P.xr[1]-P.xr[0]);pr.angs.forEach(function(an){var r=an*Math.PI/180;o.push(P.clip([[pr.sa,0],[pr.sa+L*Math.cos(r),L*Math.sin(r)]],"gold",1.4,"6 4"));});
            if(pr.sa>=P.xr[0]&&pr.sa<=P.xr[1])o.push(S.D(P.X(pr.sa),P.Y(0),"gold",4));}
          pr.br.forEach(function(q){if(q.s>=P.xr[0]&&q.s<=P.xr[1])o.push(S.CIRC(P.X(q.s),P.Y(0),5.5,"gold",2));});}
        o.push(_w12_br(P,R,"signal",2.2));
        rs=U.ctl.poly.roots(U.ctl.poly.add(a,U.ctl.poly.scale(b,K)));}
      items.forEach(function(it,i){var pts=[{re:it.re,im:it.im}];if(it.pair)pts.push({re:it.re,im:-it.im});
        o.push(it.k==="p"?U.ctl.pz(P,pts,[],"muted",6):U.ctl.pz(P,[],pts,"muted",5.5));
        if(i===sel)pts.forEach(function(q){o.push(S.CIRC(P.X(q.re),P.Y(q.im),11,"ink",1.2,null,"3 2"));});});
      var uns=_w12_unstable(rs),cpl=uns?"alias":"gold";
      rs.forEach(function(z){if(_w12_in(P,z))o.push(S.X(P.X(z.re),P.Y(z.im),6.5,cpl,2.6));});
      o.push(S.T(P.x+P.w,P.y-6,"極（×）・零点（○）を押して選び、ドラッグかつまみで動かす","end",9,"muted"));
      /* ステップ応答 */
      var qx=nar?52:440,qy=nar?20+260+60:20,qw=nar?330:246,qh=nar?140:220,inf=null,tEnd=1;
      if(ok){var sl=Infinity;rs.forEach(function(z){if(z.re<-1e-9)sl=Math.min(sl,-z.re);});tEnd=uns?1:Math.max(0.2,Math.min(10,6/sl));
        var num=U.ctl.poly.scale(b,K),den=U.ctl.poly.add(a,num),r=_w12_resp(U,num,den,tEnd,800),yf=uns?null:U.ctl.dcgain(U.ctl.tf(num,den));
        var ymax=1.2,ymin=0;r.y.forEach(function(v){if(isFinite(v)){ymax=Math.max(ymax,Math.min(v*1.05,2.6));ymin=Math.min(ymin,Math.max(v,-1.5));}});
        var Q=U.plot(qx,qy,qw,qh,[0,tEnd],[ymin,ymax]);
        o.push(Q.axes({xl:"時間 t [s]",yl:"制御量",xt:U.nice(0,tEnd,4),yt:U.nice(ymin,ymax,4),xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,2);},ylOff:36}));
        o.push(Q.line([[0,1],[tEnd,1]],"muted",1,"4 3"));
        var pts=[];for(var i=0;i<r.t.length;i++)pts.push([r.t[i],r.y[i]]);o.push(Q.clip(pts,uns?"alias":"signal",2));
        o.push(S.T(Q.x,Q.y-6,"目標値の単位ステップに対する応答","start",9,"muted"));
        if(!uns&&!_w12_axis(rs))inf=_w12_info(r.t,r.y,yf);}
      box.set(S.svg(Wd,nar?qy+qh+42:20+300+44,o));
      /* 読み出し */
      if(!ok){ro.innerHTML='<span class="warn">極を 1 つ以上置き、零点は極より少なくする</span>'+(msg?"<br>"+msg:"");return;}
      var h="開ループの極: "+_w12_plist(pr.ps)+"　零点: "+(pr.m?_w12_plist(pr.zs):"なし")+"（n = "+pr.n+"、m = "+pr.m+"、β = "+_w12_sig(beta,4)+"）<br>";
      h+=(pr.n-pr.m>=2?"漸近線: "+(pr.n-pr.m)+" 本、σ<sub>a</sub> = "+_w12_sig(pr.sa,4)+"、角度 "+pr.angs.map(_w12_angtxt).join("・"):"漸近線: 1 本（180°。負の実軸に沿って左へ）")+"　分岐点: "+(pr.br.length?pr.br.map(function(q){return _w12_sig(q.s,4)+"（K<sub>c</sub> = "+_w12_sig(q.K,3)+"）";}).join("、"):"なし")+"<br>";
      var sum=0;rs.forEach(function(z){sum+=z.re;});
      h+="閉ループの極の和: "+_w12_sig(sum,4)+"（"+(pr.n-pr.m>=2?"n − m ≥ 2 なので K<sub>c</sub> によらず開ループの極の和 "+_w12_sig(pr.sump,4)+" のまま":"n − m = 1 なので K<sub>c</sub>β ずつ左へずれる")+"）<br>";
      h+="K<sub>c</sub> = "+_w12_sig(K,4)+" の閉ループの極: "+_w12_plist(rs)+"　";
      if(uns)h+='<span class="warn">不安定</span>';else if(_w12_axis(rs))h+='<span class="warn">安定限界</span>';
      else h+='<span class="ok">安定</span>'+(inf?"　行き過ぎ量 "+_w12_f(inf.Mp,1)+" %、2 % 整定時間 "+(isFinite(inf.t2)?_w12_sig(inf.t2,3)+" s":"（表示の時間内に落ち着かない）"):"");
      ro.innerHTML=h+(msg?'<br><span class="warn">'+msg+'</span>':"")+'<div class="wnote">根軌跡は、一巡伝達関数 K<sub>c</sub>β Π(s − z<sub>i</sub>)/Π(s − p<sub>i</sub>)（β は初めの形の値のまま）で求めた。応答は、目標値から制御量までの閉ループ伝達関数（制御器の零点を目標値の通り道にも含む形）の単位ステップ応答。灰の太線と破線は、比例だけのときの根軌跡（−20〜0 と、実部 −10 の縦の線）。</div>';
    }
    load(0);
  };

  /* ---- 5 節: 減衰比の線と仕様の領域から、ゲインと零点を決める（モータの位置） ---- */
  REG.w12_design=function(el,U){
    var S=U.S,MPS=[1.5,5,10,16.3,25],TS=[1,0.5,0.4,0.25,0.15];
    U.head(el,"DESIGN","仕様の領域と減衰比の線 — 交点のゲインと、角度の条件で置く零点");
    var r1=U.ctrls(el);
    var mps=U.select(r1,"行き過ぎ量の上限",MPS.map(function(v){return v+" %";}),1,function(){draw();});
    var tss=U.select(r1,"2 % 整定時間の上限",TS.map(function(v){return v+" s";}),0,function(){draw();});
    var mode=U.select(r1,"制御器",["比例（ゲインだけを選ぶ）","PD（零点を角度の条件で置く）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var kc=U.slider(r2,"比例の K<sub>c</sub>",{min:0.01,max:10,log:true,value:0.21,fmt:function(v){return _w12_sig(v,3)+" V/rad";},onInput:function(){draw();}});
    var sdr=U.slider(r2,"PD の望む極の実部",{min:-60,max:-2,step:0.05,value:-20,fmt:function(v){return _w12_f(v,2)+" /s";},onInput:function(v){sd.re=v;draw();}});
    var sdi=U.slider(r2,"PD の望む極の虚部",{min:0.5,max:33,step:0.05,value:20.98,fmt:function(v){return _w12_f(v,2)+" rad/s";},onInput:function(v){sd.im=v;draw();}});
    var br=U.btnrow(el),sd={re:-20,im:20.98};
    function zmin(){var M=MPS[mps.get()]/100,l=Math.log(M);return -l/Math.sqrt(Math.PI*Math.PI+l*l);}
    function tanpsi(){var z=zmin();return Math.sqrt(1-z*z)/z;}
    U.button(br,"交点の K<sub>c</sub> にする（比例）",function(){mode.set(0);kc.set(+(0.1/(zmin()*zmin())).toPrecision(4));draw();});
    U.button(br,"望む極を減衰比の線の上へ（PD）",function(){mode.set(1);sd.im=Math.min(33,-sd.re*tanpsi());sync();draw();});
    U.button(br,"本文の例 1（5 %・1 s・比例）",function(){mps.set(1);tss.set(0);mode.set(0);kc.set(0.21);draw();});
    U.button(br,"本文の例 2（5 %・0.25 s・PD）",function(){mps.set(1);tss.set(3);mode.set(1);sd={re:-20,im:20.98};sync();draw();});
    function sync(){sdr.set(sd.re);sdi.set(sd.im);}
    var box=U.svgbox(el),ro=U.readout(el),PP=null,dragging=false;
    U.ctl.drag(box,function(type,x,y){if(type==="up"){dragging=false;return;}if(x==null||!PP||mode.get()!==1)return;
      if(type==="down"){if(Math.hypot(x-PP.X(sd.re),y-PP.Y(sd.im))>18)return false;dragging=true;return;}
      if(!dragging)return;sd={re:Math.max(-60,Math.min(-2,PP.ux(x))),im:Math.max(0.5,Math.min(33,PP.uy(y)))};sync();draw();});
    function region(P,sg,tp){var y1=P.yr[1],x0=P.xr[0],pts=[[sg,-sg*tp]],xe=-y1/tp;
      if(xe>x0)pts=pts.concat([[xe,y1],[x0,y1],[x0,-y1],[xe,-y1]]);else pts=pts.concat([[x0,-x0*tp],[x0,x0*tp]]);
      pts.push([sg,sg*tp]);return S.PL(pts.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"none",0,"green",null,0.16);}
    function draw(){
      var M=mode.get(),zt=zmin(),tp=tanpsi(),sg=-4/TS[tss.get()],nar=_w12_nar(box),Wd=nar?400:700,o=[];
      kc.el.style.display=M===0?"":"none";sdr.el.style.display=M===1?"":"none";sdi.el.style.display=M===1?"":"none";
      var P=U.plot(nar?52:56,20,nar?330:330,nar?299:299,[-70,5],[-34,34]);PP=P;
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));
      o.push(region(P,sg,tp));
      o.push(U.ctl.splane(P));
      [1,-1].forEach(function(sgn){o.push(P.clip([[0,0],[-200*zt,sgn*200*Math.sqrt(1-zt*zt)]],"faint",1,"4 3"));});
      o.push(P.axes({xl:"実部 σ [1/s]",yl:"虚部 ω [rad/s]",xt:[-70,-60,-50,-40,-30,-20,-10,0],yt:[-30,-20,-10,0,10,20,30],xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,3);},ylOff:34,sz:9}));
      o.push(U.ctl.splane(P,{rhp:false}));
      o.push(S.L(P.X(sg),P.y,P.X(sg),P.y+P.h,"green",1.2,"5 3"));
      var num,den,numE=null,rs,h="",Kc,ok=true;
      if(M===0){
        Kc=kc.get();var Kint=0.1/(zt*zt),Klo=sg>=-10?-(sg*sg+20*sg)/1000:null;
        o.push(S.L(P.X(-20),P.Y(0),P.X(0),P.Y(0),"signal",2.2));o.push(S.L(P.X(-10),P.y,P.X(-10),P.y+P.h,"signal",2.2));
        if(Klo!==null&&Klo<=Kint){o.push(S.L(P.X(-20-sg),P.Y(0),P.X(sg),P.Y(0),"green",4.4));o.push(S.L(P.X(-10),P.Y(-10*tp),P.X(-10),P.Y(10*tp),"green",4.4));}
        var si={re:-10,im:10*tp};o.push(U.ctl.pz(P,[si,{re:-10,im:-10*tp}],[],"gold",6));
        o.push(S.TX(P.X(-10)-8,P.Y(10*tp)-8,"交点 K_c = "+_w12_sig(Kint,3),"end",9.5,"gold",true,true));
        o.push(U.ctl.pz(P,[{re:0,im:0},{re:-20,im:0}],[],"muted",5));
        num=[1000*Kc];den=[1,20,1000*Kc];rs=U.ctl.poly.roots(den);
        h+="比例: 根軌跡と減衰比 "+_w12_f(zt,3)+" の線の交点は −10 ± <i>j</i>"+_w12_f(10*tp,2)+"、大きさの条件から K<sub>c</sub> = |s||s + 20| ÷ 1000 = "+_w12_sig(Kint,3)+" V/rad。";
        h+=(Klo!==null&&Klo<=Kint)?"領域の中にあるのは K<sub>c</sub> = "+_w12_sig(Klo,3)+"〜"+_w12_sig(Kint,3)+" V/rad（実部 "+_w12_sig(sg,3)+" の線と、減衰比の線の間）。<br>":'<span class="warn">実部 '+_w12_sig(sg,3)+" の線より左に、比例制御の根軌跡は届かない（極の組の実部は −10 のまま）。PD で零点を足す。</span><br>";
      }else{
        var t1=Math.atan2(sd.im,sd.re)*180/Math.PI,t2=Math.atan2(sd.im,sd.re+20)*180/Math.PI,tz=t1+t2-180;
        o.push(U.ctl.pz(P,[{re:0,im:0},{re:-20,im:0}],[],"muted",5));
        if(tz<=0.05||tz>=179.95){ok=false;h+='<span class="warn">この点は、比例だけの根軌跡より右にあり（極からの角度の和 '+_w12_f(t1+t2,1)+'° < 180°）、左半平面の零点では通せない（極を足す必要がある）。</span><br>';
          o.push(S.D(P.X(sd.re),P.Y(sd.im),"alias",5));}
        else{var z=sd.re-sd.im/Math.tan(tz*Math.PI/180);
          if(z>=-0.05){ok=false;h+='<span class="warn">零点が原点より右（'+_w12_sig(z,3)+'）になる。望む極を左へ動かす。</span><br>';o.push(S.D(P.X(sd.re),P.Y(sd.im),"alias",5));}
          else{var TD=-1/z,beta=1000*TD;Kc=Math.hypot(sd.re,sd.im)*Math.hypot(sd.re+20,sd.im)/(beta*Math.hypot(sd.re-z,sd.im));
            var R=_w12_track(U,[1,20,0],[beta,1000],_w12_kgrid(-4,4,60,[Kc]));o.push(_w12_br(P,R,"signal",1.6));
            [[0,"teal"],[-20,"purple"],[z,"gold"]].forEach(function(e,i){var x0=P.X(e[0]),y0=P.Y(0),an=Math.atan2(sd.im,sd.re-e[0])*180/Math.PI;
              o.push(S.L(x0,y0,x0+20,y0,e[1],1,"3 2"));o.push(_w12_arc(S,x0,y0,12+3*i,0,an,e[1],1.3));o.push(S.ARR(x0,y0,P.X(sd.re),P.Y(sd.im),e[1],1.4,6));});
            o.push(U.ctl.pz(P,[],[{re:z,im:0}],"gold",5.5));
            o.push(S.T(P.X(z),P.Y(0)+16,"零点 "+_w12_sig(z,3),"middle",9,"gold",true,false,null,true));
            o.push(S.CIRC(P.X(sd.re),P.Y(sd.im),7,"green",2.4,"screen"));o.push(S.D(P.X(sd.re),P.Y(sd.im),"green",3));
            o.push(S.T(P.X(sd.re)+10,P.Y(sd.im)-8,"望む極（ドラッグ）","start",9,"green",true,false,null,true));
            num=[1000*Kc];den=[1,20+1000*Kc*TD,1000*Kc];numE=[1000*Kc*TD,1000*Kc];rs=U.ctl.poly.roots(den);
            h+="PD: 極 0 と −20 からの角度 "+_w12_f(t1,1)+"° と "+_w12_f(t2,1)+"°、零点からの角度は "+_w12_f(t1,1)+" + "+_w12_f(t2,1)+" − 180 = "+_w12_f(tz,1)+"° → 零点 "+_w12_sig(z,4)+"（T<sub>D</sub> = "+_w12_sig(TD,3)+" s）<br>";
            h+="大きさの条件: K<sub>c</sub> = "+_w12_sig(Kc,4)+" V/rad（= K<sub>P</sub>）、K<sub>D</sub> = K<sub>c</sub>T<sub>D</sub> = "+_w12_sig(Kc*TD,3)+" V·s/rad<br>";}}
      }
      if(ok){rs.forEach(function(q){if(_w12_in(P,q))o.push(S.X(P.X(q.re),P.Y(q.im),6.5,"signal",2.6));});}
      o.push(S.T(P.x+2,P.y-6,"緑: 行き過ぎ量と整定時間の仕様の領域（目安の式）","start",9,"green"));
      /* ステップ応答 */
      var qx=nar?52:440,qy=nar?20+299+60:20,qw=nar?330:246,qh=nar?150:230,tEnd=Math.max(0.6,Math.min(3,2.5*TS[tss.get()]));
      var Q=U.plot(qx,qy,qw,qh,[0,tEnd],[0,1.6]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"角度 [rad]",xt:U.nice(0,tEnd,4),yt:[0,0.5,1,1.5],xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,2);},ylOff:36}));
      var ts=TS[tss.get()],mp=MPS[mps.get()];
      o.push(S.RECT(Q.X(Math.min(ts,tEnd)),Q.Y(1.02),Q.X(tEnd)-Q.X(Math.min(ts,tEnd)),Q.Y(0.98)-Q.Y(1.02),0,"green","none",0,null,' fill-opacity="0.2"'));
      o.push(Q.line([[0,1+mp/100],[tEnd,1+mp/100]],"green",1.1,"5 3"));o.push(S.L(Q.X(ts),Q.y,Q.X(ts),Q.y+Q.h,"green",1.1,"5 3"));
      o.push(Q.line([[0,1],[tEnd,1]],"muted",1,"4 3"));
      if(ok){var r=_w12_resp(U,num,den,tEnd,900),inf=_w12_info(r.t,r.y,1),pts=[];for(var i=0;i<r.t.length;i++)pts.push([r.t[i],r.y[i]]);
        if(numE){var r2=_w12_resp(U,numE,den,tEnd,900),pe=[];for(var j=0;j<r2.t.length;j++)pe.push([r2.t[j],r2.y[j]]);o.push(Q.clip(pe,"gold",1.5,"5 3"));var inf2=_w12_info(r2.t,r2.y,1);}
        o.push(Q.clip(pts,"signal",2.2));
        var okM=inf.Mp<=mp+0.05,okT=inf.t2<=ts+0.0005;
        h+="閉ループの極 "+_w12_plist(rs)+"　応答: 行き過ぎ量 "+_w12_f(inf.Mp,1)+" %（上限 "+mp+" %）"+(okM?'<span class="ok"> 満たす</span>':'<span class="warn"> 満たさない</span>')+"、2 % 整定時間 "+(isFinite(inf.t2)?_w12_sig(inf.t2,3)+" s":"—")+"（上限 "+ts+" s）"+(okT?'<span class="ok"> 満たす</span>':'<span class="warn"> 満たさない</span>');
        if(numE)h+="<br>金の破線: D 動作を偏差に掛けた場合（閉ループの零点 "+_w12_sig(-1/(numE[0]/numE[1]),3)+" が加わる）: 行き過ぎ量 "+_w12_f(inf2.Mp,1)+" %、2 % 整定時間 "+_w12_sig(inf2.t2,3)+" s";}
      o.push(S.T(Q.x,Q.y-6,"青: 目標値の単位ステップ"+(M===1?"（D 動作は測った制御量に）":""),"start",9,"muted"));
      box.set(S.svg(Wd,nar?qy+qh+42:20+299+44,o));
      ro.innerHTML=h+'<div class="wnote">仕様の領域は、行き過ぎ量の上限から決まる減衰比の下限 '+_w12_f(zt,3)+'（4 章 4 節の式）と、2 % 整定時間の目安 4/(ζω<sub>n</sub>) から決まる実部の上限 '+_w12_sig(sg,3)+' で描いた。応答の行き過ぎ量と整定時間は、数値計算の値。PD では、望む極の位置から、本文 5 節の手順で零点とゲインを決めている。</div>';
    }
    draw();
  };
