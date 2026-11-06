  /* ===== 08 章 アンテナ — 右旋円偏波・パッチ・地板 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w08_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w08_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w08_db(p){return 10*Math.log10(Math.max(p,1e-30));}
  var _W08_D=Math.PI/180,_W08_C=299792458,_W08_F1=1575.42e6,_W08_F5=1176.45e6,_W08_CID=0;
  /* 枠 (x, y, w, h) の外を切って描く */
  function _w08_clip(x,y,w,h,body){var id="w08cp"+(++_W08_CID);return '<clipPath id="'+id+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/></clipPath><g clip-path="url(#'+id+')">'+body+'</g>';}
  /* 例のアンテナ（図と同じ。上の半分は 3 章の値、下の半分と左旋はこの章で足した例の値）。返り値 [右旋, 左旋]（真数） */
  function _w08_ga3(el){return 3-8*Math.pow((90-el)/85,2);}
  function _w08_ex(el){var s=Math.sin(Math.abs(el)*_W08_D),r=(1-s)/(1+s);
    if(el>=0){var gr=Math.pow(10,_w08_ga3(el)/10);return [gr,gr*r*r];}
    var g0=10*Math.log10(2*Math.pow(10,_w08_ga3(0)/10)),gt=Math.pow(10,(g0+(-13-g0)*Math.sqrt(s))/10);
    return [gt*r*r/(1+r*r),gt/(1+r*r)];}
  /* 誘電体（比誘電率 er、損失なし）の面の反射係数 [Γ_H, Γ_V]。psi は面とのなす角 [rad]。er ≥ 1e8 は金属 */
  function _w08_fres(er,psi){if(er>=1e8)return [-1,1];var s=Math.sin(psi),q=Math.sqrt(er-Math.cos(psi)*Math.cos(psi));return [(s-q)/(s+q),(er*s-q)/(er*s+q)];}
  /* 共振の応答 K = 1/(1 + jQ(f/fk − fk/f)) を [実部, 虚部] で */
  function _w08_K(f,fk,Q){var x=Q*(f/fk-fk/f),d=1+x*x;return [1/d,-x/d];}
  /* 1 点給電の円偏波のパッチ（2 つのモードの共振回路を直列。L1 で 50 Ω）。kind: 0 円偏波、1 直線偏波（1 つのモード）。
     返り値 {Z:[R,X], G:[re,im], PR, PL}（PR・PL は 1 V・50 Ω の信号源で送ったときの右旋・左旋の電力。合っているとき PR = 0.25） */
  function _w08_patchZ(f,f0,Q,kind){var ku,kv;
    if(kind===0){ku=_w08_K(f,f0*(1-1/(2*Q)),Q);kv=_w08_K(f,f0*(1+1/(2*Q)),Q);}else{ku=_w08_K(f,f0,Q);kv=[0,0];}
    var Z=[50*(ku[0]+kv[0]),50*(ku[1]+kv[1])];return _w08_zout(Z,ku,kv);}
  function _w08_zout(Z,ku,kv){var nr=Z[0]-50,ni=Z[1],dr=Z[0]+50,di=Z[1],dd=dr*dr+di*di,G=[(nr*dr+ni*di)/dd,(ni*dr-nr*di)/dd];
    var ir=dr/dd,ii=-di/dd,PR=0,PL=0;
    if(ku){var vu=[50*(ir*ku[0]-ii*ku[1]),50*(ir*ku[1]+ii*ku[0])],vv=[50*(ir*kv[0]-ii*kv[1]),50*(ir*kv[1]+ii*kv[0])];
      /* 右旋 ∝ |Vu − jVv|、左旋 ∝ |Vu + jVv| */
      var rr=vu[0]+vv[1],ri=vu[1]-vv[0],lr=vu[0]-vv[1],li=vu[1]+vv[0];PR=(rr*rr+ri*ri)/2;PL=(lr*lr+li*li)/2;}
    return {Z:Z,G:G,PR:PR,PL:PL};}
  function _w08_ar(PR,PL){var a=Math.sqrt(PR),b=Math.sqrt(PL);return 20*Math.log10((a+b)/Math.max(Math.abs(a-b),1e-12));}
  /* 衛星の印（図と同じ見た目） */
  function _w08_sat(U,x,y,c,s){var S=U.S;s=s||1;return S.L(x-9*s,y,x+9*s,y,c,1.1)+S.RECT(x-14*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x+7.5*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x-3.6*s,y-3.6*s,7.2*s,7.2*s,1.5,c,c,1);}
  /* 横から見たパッチ（地板・誘電体・パッチ）。(x, y) は地板の上面の中心 */
  function _w08_patchicon(U,x,y,w){var S=U.S;return S.RECT(x-w/2,y,w,4,1,U.soft("muted"),"muted",1)+S.RECT(x-w*0.28,y-7,w*0.56,7,1,U.soft("gold"),"gold",1)+S.L(x-w*0.24,y-7.5,x+w*0.24,y-7.5,"gold",2.2);}

  /* ---- 2 節: 偏波 ---- */
  REG.w08_pol=function(el,U){
    var S=U.S;
    U.head(el,"POLARIZATION","偏波 — 電界の回る向きと、受ける電力");
    var r1=U.ctrls(el);
    var wv=U.select(r1,"電波",["右旋円偏波","左旋円偏波","直線偏波（横）","楕円偏波（右旋 + 左旋）"],0,function(){draw();});
    var an=U.select(r1,"アンテナ",["右旋（理想）","右旋（軸比 3 dB）","直線偏波（横）","左旋（理想）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var kr=U.slider(r2,"楕円の左旋の振幅 a<sub>L</sub>/a<sub>R</sub>",{min:0,max:1,step:0.05,value:0.3,fmt:function(v){var ar=(1+v)/Math.max(1-v,1e-9);return _w08_f(v,2)+"（軸比 "+(v>=0.999?"∞":_w08_f(20*Math.log10(ar),1)+" dB")+"）";},onInput:function(){if(wv.get()!==3)wv.set(3);draw();}});
    var rf=U.checkbox(r2,"金属で反射させてから受ける",false,function(){draw();});
    var br=U.btnrow(el),ph=0;
    var tick=U.ticker(function(){ph=(ph+0.07)%(2*Math.PI);draw();},50);
    U.button(br,"本文の例（右旋の電波を右旋で受ける）",function(){tick.stop();ph=0;wv.set(0);an.set(0);kr.set(0.3);rf.set(false);draw();});
    U.button(br,"直線偏波のアンテナで受ける",function(){wv.set(0);an.set(2);draw();});
    U.button(br,"金属で反射した電波",function(){wv.set(0);an.set(0);rf.set(true);draw();});
    U.button(br,"再生（電界を回す）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el);
    var KA=(Math.pow(10,3/20)-1)/(Math.pow(10,3/20)+1);   /* 軸比 3 dB のアンテナの左旋の割合 0.171 */
    /* 電波の横と縦の成分の振幅: 横 = X sin ωt、縦 = Y cos ωt（電力 (X² + Y²)/2 = 1） */
    function wave(k){var w=k==null?wv.get():k,X,Y;
      if(w===0){X=1;Y=1;}else if(w===1){X=-1;Y=1;}else if(w===2){X=Math.SQRT2;Y=0;}
      else{var q=kr.get(),aR=1/Math.sqrt(1+q*q),aL=q/Math.sqrt(1+q*q);X=aR-aL;Y=aR+aL;}
      if(rf.get())X=-X;   /* 金属の反射: 横（面に沿う成分）の符号が変わる */
      return [X,Y];}
    /* アンテナの 2 つの受け口の重み: 出力 = a·横 + b·（90° 遅らせた縦） */
    function antw(k){if(k===0)return [1/Math.SQRT2,1/Math.SQRT2];if(k===3)return [-1/Math.SQRT2,1/Math.SQRT2];if(k===2)return [1,0];
      var n=Math.sqrt(1+KA*KA);return [(1-KA)/Math.SQRT2/n,(1+KA)/Math.SQRT2/n];}
    /* 受ける電力（電波の電力 1 に対する割合）。90° 遅らせた縦は Y cos(ωt − 90°) = Y sin ωt なので、出力は (aX + bY) sin ωt */
    function recv(W,k){var a=antw(k),A=a[0]*W[0]+a[1]*W[1];return A*A/2;}
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],W=wave(),k=an.get(),X=W[0],Y=W[1];
      var aR=(X+Y)/2,aL=(Y-X)/2,ar=(Math.abs(aR)+Math.abs(aL))/Math.max(Math.abs(Math.abs(aR)-Math.abs(aL)),1e-12);
      var sense=Math.abs(Math.abs(aR)-Math.abs(aL))<1e-9?"向きは一定（直線偏波）":(Math.abs(aR)>Math.abs(aL)?"時計回り → 右旋":"反時計回り → 左旋");
      /* (a) 電界の向き */
      var cx=nar?120:130,cy=nar?140:150,R=78;
      o.push(S.T(nar?10:14,18,rf.get()?"(a) 反射した後の電界（反射波の進む向きに見る）":"(a) 電界の向き（電波の進む向きに見る）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,R,"faint",1,null,"3 3"));o.push(S.L(cx-R-10,cy,cx+R+10,cy,"grid",1));o.push(S.L(cx,cy-R-10,cx,cy+R+10,"grid",1));
      o.push(S.T(cx+R+12,cy+4,"横","start",9.5,"muted",true));o.push(S.T(cx,cy-R-14,"縦","middle",9.5,"muted",true));
      var sc=R/Math.SQRT2*0.98,tr=[],i;
      for(i=0;i<=120;i++){var t=2*Math.PI*i/120;tr.push([cx+sc*X*Math.sin(t),cy-sc*Y*Math.cos(t)]);}
      var col=Math.abs(aR)>=Math.abs(aL)+1e-9?"signal":(Math.abs(aL)>Math.abs(aR)+1e-9?"alias":"muted");
      o.push(S.PL(tr,col,1.2,null,"4 3"));
      var ex=cx+sc*X*Math.sin(ph),ey=cy-sc*Y*Math.cos(ph);
      if(Math.hypot(ex-cx,ey-cy)>3)o.push(S.ARR(cx,cy,ex,ey,col,2.6,9));else o.push(S.D(cx,cy,col,3));
      if(Math.abs(Math.abs(aR)-Math.abs(aL))>1e-9){var t2=ph+0.35,fx=cx+sc*X*Math.sin(t2),fy=cy-sc*Y*Math.cos(t2),t1=ph+0.25,gx=cx+sc*X*Math.sin(t1),gy=cy-sc*Y*Math.cos(t1);o.push(S.head(gx,gy,fx,fy,col,8));}
      o.push(S.T(cx,cy+R+30,sense,"middle",10,col,true));
      o.push(S.TX(cx,cy+R+48,"a_R = "+_w08_f(Math.abs(aR),3)+"、a_L = "+_w08_f(Math.abs(aL),3)+"、軸比 "+(ar>1e6?"∞":_w08_f(20*Math.log10(ar),1)+" dB"),"middle",9.5,"ink"));
      /* (b) 2 つの受け口の波形 */
      var px=nar?50:330,py=nar?cy+R+84:40,pw=nar?330:330,phh=150,a=antw(k);
      o.push(S.T(px-36,py-12,"(b) アンテナの 2 つの受け口と出力（"+["右旋","右旋・軸比 3 dB","直線（横）","左旋"][k]+"）","start",10.5,"ink",true));
      var P=U.plot(px,py,pw,phh,[0,2*Math.PI],[-2.1,2.1]);
      o.push(P.axes({xt:[0,Math.PI,2*Math.PI],yt:[-2,-1,0,1,2],xfmt:function(v){return v<0.1?"0":(v<4?"T/2":"T");},yfmt:function(v){return _w08_f(v,0);}}));
      var b1=[],b2=[],sm=[];
      for(i=0;i<=180;i++){var tt=2*Math.PI*i/180,h1=a[0]*X*Math.sin(tt),h2=a[1]*Y*Math.cos(tt-Math.PI/2);b1.push([tt,h1]);b2.push([tt,h2]);sm.push([tt,h1+h2]);}
      o.push(P.line(b1,"teal",1.6));o.push(P.line(b2,"purple",1.6,"4 3"));o.push(P.line(sm,"ink",2.6));
      o.push(S.L(P.X(ph),P.y,P.X(ph),P.y+P.h,"gold",1.2,"2 3"));
      o.push(S.LEGL(px-30,py+phh+40,[["teal",null,"横の受け口"],["purple","4 3","縦（90° 遅らせる）"],["ink",null,"和（出力）"]],9.5,12));
      var p=recv(W,k);
      o.push(S.T(px-30,py+phh+64,"受ける電力: "+_w08_f(p,3)+"（"+(p<1e-9?"−∞":_w08_f(_w08_db(p),2))+" dB）","start",11,p>0.9?"green":(p<0.1?"alias":"gold"),true));
      box.set(S.svg(Wd,nar?py+phh+76:Math.max(cy+R+60,py+phh+76),o));
      /* 読み出し: 4 つのアンテナで受ける電力 */
      var names=["右旋（理想）","右旋（軸比 3 dB）","直線偏波（横）","左旋（理想）"],rows=[];
      for(var j=0;j<4;j++){var pj=recv(W,j);rows.push([(j===k?"<b>":"")+names[j]+(j===k?"</b>":""),_w08_f(pj,3),pj<1e-9?"−∞ dB":_w08_f(_w08_db(pj),2)+" dB"]);}
      var h="電波（"+(rf.get()?"金属で反射した後。":"")+"電力 1）: 右旋の振幅 a<sub>R</sub> = "+_w08_f(Math.abs(aR),3)+"、左旋の振幅 a<sub>L</sub> = "+_w08_f(Math.abs(aL),3)+"、電力の割合は右旋 "+_w08_f(aR*aR,3)+"・左旋 "+_w08_f(aL*aL,3)+"<br>";
      h+=U.tbl(["アンテナ","受ける電力","dB"],rows,["left","right","right"]);
      ro.innerHTML=h+'<div class="wnote">アンテナは、横と縦の 2 つの受け口の出力を、縦を 90° 遅らせて足すもの（2 節）とした。軸比 3 dB のアンテナは、右旋の理想のアンテナと左旋の理想のアンテナを、振幅の比 1 : 0.171 で組み合わせた。金属の反射は、面に沿う横の成分の符号を変える（Γ<sub>H</sub> = −1、Γ<sub>V</sub> = +1）として、反射波の進む向きに見た。</div>';
    }
    draw();
  };

  /* ---- 2 節: 反射と γ ---- */
  REG.w08_reflect=function(el,U){
    var S=U.S;
    U.head(el,"REFLECTION","反射波の偏波と、反射波と直接波の振幅の比 γ");
    var r1=U.ctrls(el);
    var th=U.slider(r1,"衛星の仰角 θ",{min:2,max:88,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var sf=U.seg(r1,["地面で反射","壁で反射"],0,function(){draw();});
    var r2=U.ctrls(el);
    var er=U.slider(r2,"面の比誘電率 ε<sub>r</sub>",{values:[2,3,4,6,10,20,40,80,1e9],value:4,fmt:function(v){return v>=1e8?"金属":String(v);},onInput:function(){draw();}});
    var an=U.select(r2,"アンテナ",["例のアンテナ（右旋）","直線偏波（向きによらず 0 dBi）","例のアンテナの下をさらに 10 dB 下げた"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（地面・εr 4・仰角 30°）",function(){th.set(30);sf.set(0);er.set(4);an.set(0);draw();});
    U.button(br,"低い衛星（仰角 10°）",function(){th.set(10);sf.set(0);er.set(4);draw();});
    U.button(br,"壁（εr 6・仰角 30°）",function(){th.set(30);sf.set(1);er.set(6);draw();});
    U.button(br,"金属の壁",function(){sf.set(1);er.set(1e9);draw();});
    var box=U.svgbox(el),ro=U.readout(el),GEO=null,drg=false;
    function gains(e,k){var g=_w08_ex(e);if(k===1)return [0.5,0.5];if(k===2&&e<0)return [g[0]*0.1,g[1]*0.1];return g;}
    function calc(t,s,e,k){var psi=s===0?t:90-t,G=_w08_fres(e,psi*_W08_D),R=(G[1]+G[0])/2,L=(G[1]-G[0])/2,g=gains(s===0?-t:t,k),gd=gains(t,k)[0];
      return {psi:psi,GH:G[0],GV:G[1],R:R,L:L,g:g,gd:gd,gam:Math.sqrt((R*R*g[0]+L*L*g[1])/gd)};}
    U.ctl.drag(box,function(type,x,y){if(!GEO)return false;
      if(type==="down"){if(Math.hypot(x-GEO.sx,y-GEO.sy)>22)return false;drg=true;return true;}
      if(type==="move"&&drg){var a=Math.atan2(GEO.ay-y,GEO.ax-x)/_W08_D;th.set(Math.max(2,Math.min(88,Math.round(a))));draw();return;}
      if(type==="up")drg=false;});
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],t=th.get(),s=sf.get(),e=er.get(),k=an.get(),c=calc(t,s,e,k);
      /* (a) 反射の向き */
      var gw=nar?400:310,gy=nar?200:210,ax=s===0?(nar?230:190):(nar?200:170),ay=gy-56,Rs=nar?150:150;
      o.push(S.T(10,18,"(a) "+(s===0?"地面で反射（地平線より下から来る）":"壁で反射（上の半分の横から来る）")+"。衛星をドラッグ","start",10.5,"ink",true));
      var q=[],ux=-Math.cos(t*_W08_D),uy=-Math.sin(t*_W08_D),sx=ax+Rs*ux,sy=ay+Rs*uy,wx=gw-28;
      if(s===0){q.push(S.RECT(4,gy,gw-8,10,0,U.soft("muted"),"muted",1));}
      else{q.push(S.RECT(4,gy,gw-8,10,0,U.soft("muted"),"none",0));q.push(S.RECT(wx,30,12,gy-30,0,U.soft("muted"),"muted",1));}
      q.push(S.L(ax,gy,ax,ay+4,"muted",1.4));q.push(_w08_patchicon(U,ax,ay,28));
      /* 反射点: 鏡に映したアンテナの像から、衛星の向きに引いた線と面の交わり */
      var ix,iy,P;
      if(s===0){ix=ax;iy=2*gy-ay;var tp=(iy-gy)/(-uy);P=[ix+tp*ux,gy];}
      else{ix=2*wx-ax;iy=ay;var tq=(ix-wx)/(-ux);P=[wx,iy+tq*uy];}
      var far=600;
      q.push(S.L(P[0]+far*ux,P[1]+far*uy,P[0],P[1],"alias",1.4,"5 3"));
      q.push(S.ARR(P[0],P[1],ax-3*(P[0]>ax?-1:1),ay+(s===0?6:-6),"alias",1.8,8));
      q.push(S.ARR(sx,sy,ax+ux*-8,ay+uy*-8-4,"signal",1.8,8));
      o.push(_w08_clip(0,26,gw,gy+16-26,q.join("")));
      o.push(_w08_sat(U,sx,sy,"signal",1.1));GEO={sx:sx,sy:sy,ax:ax,ay:ay};
      o.push(S.T(sx,sy-12,"θ = "+t+"°","middle",9.5,"signal",true,false,null,true));
      o.push(S.T(10,gy+30,(s===0?"地面":"壁")+"（εr "+(e>=1e8?"金属":e)+"）。面とのなす角 ψ = "+c.psi+"°","start",9.5,"ink",true));
      o.push(S.LEGL(10,gy+50,[["signal",null,"直接波"],["alias","5 3","反射波"]],9.5,14));
      /* (b) 反射係数と ψ */
      var px=nar?50:380,py=nar?gy+86:40,pw=nar?330:290,ph=nar?110:100;
      o.push(S.T(px-40,py-12,"(b) 反射係数（右: 面とのなす角）","start",10.5,"ink",true));
      var P1=U.plot(px,py,pw,ph,[0,90],[-1,1]);
      o.push(P1.axes({xt:[0,15,30,45,60,75,90],yt:[-1,-0.5,0,0.5,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w08_f(v,1);}}));
      var lh=[],lv=[],i;for(i=0;i<=180;i++){var ps=i/2,G=_w08_fres(e,ps*_W08_D);lh.push([ps,G[0]]);lv.push([ps,G[1]]);}
      o.push(P1.line(lh,"teal",1.8,"5 3"));o.push(P1.line(lv,"purple",2.2));
      if(e<1e8){var pb=Math.atan(1/Math.sqrt(e))/_W08_D;o.push(S.D(P1.X(pb),P1.Y(0),"purple",3.6));o.push(S.T(P1.X(pb)+4,P1.Y(0)-6,"ブルースター "+_w08_f(pb,1)+"°","start",9,"purple",true,false,null,true));}
      o.push(S.L(P1.X(c.psi),P1.y,P1.X(c.psi),P1.y+P1.h,"gold",1.2,"3 3"));
      o.push(S.D(P1.X(c.psi),P1.Y(c.GV),"purple",4.4));o.push(S.D(P1.X(c.psi),P1.Y(c.GH),"teal",4.4));
      o.push(S.LEGL(px-10,py+ph+32,[["purple",null,"Γ_V（垂直）"],["teal","5 3","Γ_H（水平）"]],9.5,12));
      /* (c) γ と仰角 */
      var qx=px,qy=nar?py+ph+70:py+ph+70,qh=nar?110:100;
      o.push(S.T(qx-40,qy-12,"(c) γ と衛星の仰角","start",10.5,"ink",true));
      var P2=U.plot(qx,qy,pw,qh,[2,88],[0,1]);
      o.push(P2.axes({xl:"衛星の仰角 θ [°]",xt:[2,20,40,60,88],yt:[0,0.25,0.5,0.75,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w08_f(v,2);}}));
      var l1=[],l2=[];for(i=2;i<=88;i++){l1.push([i,calc(i,s,e,k).gam]);l2.push([i,calc(i,s,e,1).gam]);}
      o.push(S.L(P2.x,P2.Y(0.5),P2.x+P2.w,P2.Y(0.5),"muted",1,"2 3"));
      if(k!==1)o.push(P2.clip(l2,"muted",1.6,"5 3"));
      o.push(P2.clip(l1,k===1?"muted":"gold",2.4));
      o.push(S.D(P2.X(t),P2.Y(Math.min(1,c.gam)),"gold",4.6));
      o.push(S.T(P2.X(t)+6,P2.Y(Math.min(1,c.gam))-7,"γ = "+_w08_f(c.gam,2),"start",9.5,"gold",true,false,null,true));
      if(k!==1)o.push(S.T(P2.x+P2.w,P2.y-3,"破線: 直線偏波のアンテナ","end",9,"muted"));
      box.set(S.svg(Wd,nar?qy+qh+44:Math.max(gy+60,qy+qh+44),o));
      /* 読み出し */
      var dR=20*Math.log10(Math.max(Math.abs(c.R),1e-9)),dL=20*Math.log10(Math.max(Math.abs(c.L),1e-9)),gm=c.gam;
      var h="ψ = "+c.psi+"°: Γ<sub>H</sub> = "+_w08_f(c.GH,3)+"、Γ<sub>V</sub> = "+_w08_f(c.GV,3)+" → 反射波の右旋の分 Γ<sub>R</sub> = (Γ<sub>V</sub> + Γ<sub>H</sub>)/2 = "+_w08_f(c.R,3)+"（"+(Math.abs(c.R)<1e-6?"−∞":_w08_f(dR,1))+" dB）、左旋の分 Γ<sub>L</sub> = (Γ<sub>V</sub> − Γ<sub>H</sub>)/2 = "+_w08_f(c.L,3)+"（"+(Math.abs(c.L)<1e-6?"−∞":_w08_f(dL,1))+" dB）<br>";
      h+="アンテナの利得: 直接波（仰角 "+t+"°、右旋）"+_w08_f(_w08_db(c.gd),1)+" dBi、反射波の来る向き（仰角 "+(s===0?"−":"")+t+"°）の右旋 "+_w08_f(_w08_db(c.g[0]),1)+" dBi・左旋 "+_w08_f(_w08_db(c.g[1]),1)+" dBi<br>";
      h+="反射波と直接波の振幅の比 <b>γ = "+_w08_f(gm,3)+"</b>";
      if(gm<1){h+=" → 7 章の誤差の最大 γ × 146.5 m: 間隔 1 チップで <b>"+_w08_f(gm*146.5,1)+" m</b>、0.1 チップで "+_w08_f(gm*14.65,1)+" m。C/N0 の揺れ 20 log<sub>10</sub>(1 ± γ): <b>+"+_w08_f(20*Math.log10(1+gm),1)+"〜"+_w08_f(20*Math.log10(1-gm),1)+" dB</b>";}
      else h+="（反射波が直接波より強い）";
      ro.innerHTML=h+'<div class="wnote">平らで損失の無い面（フレネルの式）とした。反射波の右旋と左旋の分は、アンテナの出力で電力として足した目安である。例のアンテナは 1 節の図の値（下の半分と左旋は例の値）。7 章の誤差の最大は γΔ<sub>EL</sub>cT<sub>c</sub>/2。</div>';
    }
    draw();
  };

  /* ---- 3・4 節: パッチの寸法・円偏波・地板 ---- */
  /* 地板の一辺ごとの、上下の成分の 2 次元の指向性 [0.1 dB]（無限の地板の真上を 0。仰角 −90〜90° を 1° ごと）。
     比誘電率 20 の L1 のパッチを、地板の中心に置いて 2 次元のモーメント法で計算した値（図 e08_gpsize と同じ。f08.py の _f08_gp） */
  var _W08_GP={"30":[-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-32,-32,-32,-32,-32,-32,-32,-32,-33,-33,-33,-33,-33,-33,-33,-34,-34,-34,-34,-34,-35,-35,-35,-35,-35,-35,-35,-36,-36,-36,-36,-36,-36,-37,-37,-37,-37,-37,-37,-38,-38,-38,-38,-38,-38,-38,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-38,-38,-38,-38,-38,-38,-38,-37,-37,-37,-37,-37,-37,-36,-36,-36,-36,-35,-35,-35,-35,-35,-34,-34,-34,-34,-33,-33,-33,-33,-32,-32,-32,-32,-31,-31,-31,-31,-30,-30,-30,-30,-29,-29,-29,-29,-29,-28,-28,-28,-28,-27,-27,-27,-27,-27,-27,-26,-26,-26,-26,-26,-26,-25,-25,-25,-25,-25,-25,-25,-25,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24],
    "40":[-32,-32,-32,-32,-32,-32,-32,-32,-32,-32,-33,-33,-33,-33,-33,-33,-33,-34,-34,-34,-34,-34,-35,-35,-35,-35,-35,-36,-36,-36,-37,-37,-37,-37,-38,-38,-38,-38,-39,-39,-39,-40,-40,-40,-41,-41,-41,-42,-42,-42,-42,-43,-43,-43,-43,-44,-44,-44,-44,-45,-45,-45,-45,-45,-46,-46,-46,-46,-46,-46,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-46,-46,-46,-46,-46,-46,-46,-45,-45,-45,-44,-44,-44,-44,-43,-43,-43,-42,-42,-42,-41,-41,-41,-40,-39,-39,-39,-38,-38,-38,-37,-36,-36,-36,-35,-35,-34,-34,-33,-33,-32,-32,-31,-31,-30,-30,-29,-29,-28,-28,-27,-27,-27,-26,-25,-25,-25,-24,-24,-23,-23,-23,-22,-22,-21,-21,-21,-20,-20,-20,-19,-19,-19,-19,-18,-18,-18,-17,-17,-17,-17,-17,-16,-16,-16,-16,-16,-16,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15],
    "50":[-36,-36,-36,-36,-36,-36,-36,-37,-37,-37,-37,-37,-37,-38,-38,-38,-38,-38,-39,-39,-40,-40,-40,-40,-41,-41,-41,-42,-42,-43,-43,-43,-44,-44,-45,-45,-46,-46,-47,-47,-48,-48,-49,-49,-50,-50,-51,-51,-52,-52,-52,-53,-53,-54,-54,-54,-55,-55,-56,-56,-56,-57,-57,-57,-57,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-57,-57,-57,-57,-56,-56,-56,-55,-55,-54,-54,-53,-53,-52,-52,-51,-51,-50,-50,-49,-48,-48,-47,-46,-45,-45,-44,-43,-42,-42,-41,-40,-39,-39,-38,-37,-36,-36,-35,-34,-33,-32,-32,-31,-30,-29,-29,-28,-27,-26,-26,-25,-24,-23,-22,-22,-21,-20,-20,-19,-19,-18,-17,-17,-16,-16,-15,-15,-14,-14,-13,-13,-12,-12,-11,-11,-11,-10,-10,-9,-9,-9,-8,-8,-8,-7,-7,-7,-7,-6,-6,-6,-6,-6,-6,-6,-5,-5,-5,-5,-5,-5],
    "60":[-43,-43,-43,-43,-43,-43,-43,-44,-44,-44,-44,-45,-45,-45,-45,-46,-46,-46,-47,-47,-48,-48,-49,-49,-50,-50,-51,-51,-52,-53,-53,-54,-54,-55,-56,-56,-57,-58,-59,-60,-60,-61,-61,-62,-63,-63,-64,-65,-66,-66,-67,-67,-68,-69,-69,-70,-70,-71,-71,-72,-72,-72,-73,-73,-73,-73,-73,-73,-73,-73,-73,-73,-73,-73,-72,-72,-72,-71,-71,-70,-70,-69,-69,-68,-67,-66,-66,-65,-64,-63,-62,-61,-60,-59,-58,-57,-56,-55,-54,-53,-52,-51,-49,-48,-48,-47,-46,-44,-43,-42,-41,-40,-39,-38,-36,-36,-35,-34,-33,-31,-31,-30,-29,-27,-26,-26,-25,-23,-22,-22,-21,-20,-19,-18,-17,-17,-15,-15,-14,-13,-13,-12,-11,-10,-10,-9,-8,-7,-7,-6,-6,-5,-5,-4,-4,-3,-3,-2,-2,-1,-1,-1,0,0,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3],
    "70":[-52,-52,-52,-52,-52,-52,-52,-53,-53,-53,-53,-54,-54,-55,-55,-55,-56,-57,-57,-58,-59,-59,-60,-60,-61,-62,-63,-63,-64,-66,-66,-67,-68,-69,-70,-71,-72,-73,-74,-75,-76,-77,-78,-79,-80,-81,-82,-83,-84,-84,-85,-86,-87,-88,-88,-89,-90,-90,-91,-91,-91,-92,-92,-92,-92,-92,-92,-91,-91,-91,-90,-90,-89,-89,-87,-87,-86,-85,-84,-83,-82,-81,-80,-78,-77,-76,-75,-73,-71,-71,-69,-68,-66,-64,-64,-62,-60,-59,-58,-57,-55,-54,-52,-50,-50,-48,-47,-45,-44,-43,-41,-40,-39,-38,-36,-35,-34,-33,-31,-29,-29,-28,-27,-25,-24,-23,-22,-20,-19,-19,-18,-17,-15,-14,-14,-13,-11,-11,-10,-9,-8,-7,-6,-6,-5,-4,-3,-2,-2,-1,-1,0,1,1,2,2,3,4,4,4,5,5,6,6,6,7,7,8,8,8,8,8,9,9,9,9,9,9,9,9,9],
    "80":[-62,-62,-62,-62,-62,-62,-63,-63,-63,-64,-64,-65,-65,-65,-66,-67,-68,-68,-69,-70,-71,-72,-72,-73,-74,-76,-76,-77,-78,-80,-81,-82,-83,-85,-87,-87,-89,-90,-92,-93,-94,-95,-97,-99,-100,-101,-102,-104,-105,-106,-107,-108,-109,-109,-110,-111,-112,-112,-112,-112,-112,-112,-112,-111,-111,-110,-110,-109,-108,-107,-105,-104,-103,-102,-100,-99,-97,-96,-94,-91,-91,-89,-87,-85,-84,-82,-80,-79,-76,-75,-72,-72,-70,-67,-66,-65,-62,-61,-60,-58,-57,-55,-53,-51,-50,-49,-47,-45,-44,-43,-41,-40,-38,-37,-35,-34,-33,-31,-30,-28,-28,-26,-25,-23,-22,-21,-20,-18,-17,-17,-16,-15,-13,-12,-11,-10,-9,-8,-7,-6,-6,-4,-3,-3,-2,-1,0,1,2,2,3,3,4,5,5,6,6,7,8,8,9,9,10,10,10,11,11,12,12,12,12,13,13,13,13,13,13,13,14,14,14],
    "90":[-72,-72,-72,-72,-72,-73,-73,-73,-74,-74,-75,-76,-76,-77,-77,-78,-79,-80,-81,-82,-84,-85,-85,-87,-88,-90,-91,-92,-94,-96,-98,-98,-100,-102,-104,-105,-107,-109,-112,-114,-114,-116,-118,-121,-122,-123,-125,-127,-128,-129,-130,-131,-132,-132,-133,-133,-133,-133,-132,-132,-131,-129,-129,-128,-126,-124,-123,-121,-119,-117,-114,-113,-111,-109,-106,-105,-103,-101,-99,-96,-95,-92,-90,-87,-86,-84,-82,-80,-77,-76,-74,-73,-71,-68,-67,-65,-63,-62,-60,-58,-57,-55,-53,-51,-50,-49,-47,-45,-44,-42,-41,-39,-38,-36,-34,-34,-32,-31,-30,-28,-27,-26,-24,-22,-21,-20,-19,-17,-16,-16,-15,-13,-12,-11,-10,-9,-7,-6,-5,-5,-4,-3,-2,-1,0,1,2,3,3,4,5,5,6,7,7,8,9,10,10,10,11,11,12,12,13,13,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16],
    "100":[-81,-81,-82,-82,-82,-82,-83,-83,-84,-84,-85,-86,-87,-87,-88,-89,-91,-91,-93,-94,-96,-98,-98,-100,-102,-104,-105,-107,-109,-112,-114,-115,-118,-120,-123,-124,-127,-129,-133,-135,-136,-139,-141,-144,-145,-147,-148,-151,-152,-152,-153,-153,-153,-153,-152,-151,-149,-149,-147,-145,-143,-140,-139,-136,-134,-130,-129,-126,-124,-121,-117,-116,-113,-111,-107,-106,-104,-101,-99,-95,-94,-92,-90,-87,-86,-84,-82,-80,-77,-76,-73,-72,-70,-67,-67,-65,-62,-61,-60,-58,-56,-55,-52,-51,-50,-48,-47,-44,-44,-42,-41,-39,-38,-36,-34,-33,-32,-31,-29,-27,-27,-25,-24,-22,-21,-20,-19,-17,-16,-15,-14,-13,-11,-10,-10,-8,-7,-6,-5,-4,-3,-2,-1,0,1,1,3,4,4,5,6,6,7,8,9,9,10,11,12,12,12,13,13,14,14,15,15,16,16,16,17,17,17,17,18,18,18,18,18,18,18],
    "120":[-97,-97,-98,-98,-98,-99,-99,-100,-101,-101,-102,-104,-105,-106,-107,-109,-112,-112,-114,-116,-120,-122,-123,-126,-128,-133,-134,-137,-140,-145,-149,-151,-154,-158,-164,-166,-169,-173,-178,-181,-182,-185,-186,-188,-188,-188,-187,-184,-182,-181,-178,-174,-169,-167,-163,-159,-154,-152,-148,-145,-141,-136,-134,-131,-128,-123,-122,-119,-116,-114,-110,-108,-106,-104,-100,-99,-97,-95,-92,-89,-88,-86,-85,-82,-81,-79,-77,-75,-73,-72,-70,-69,-67,-65,-64,-62,-60,-59,-58,-56,-55,-53,-51,-50,-49,-48,-46,-44,-43,-42,-41,-39,-38,-36,-34,-34,-32,-31,-30,-28,-27,-26,-25,-23,-21,-21,-20,-18,-16,-16,-15,-13,-12,-10,-10,-9,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,6,7,8,9,10,10,11,12,13,13,14,14,15,15,16,16,17,18,18,18,18,19,19,19,19,20,20,20,20,20,20],
    "150":[-115,-115,-116,-116,-117,-117,-118,-120,-121,-122,-124,-127,-129,-130,-132,-135,-140,-141,-145,-148,-154,-159,-161,-166,-171,-179,-182,-188,-195,-204,-210,-213,-219,-223,-226,-226,-225,-222,-215,-209,-206,-199,-193,-183,-180,-174,-169,-161,-156,-153,-149,-145,-139,-137,-133,-130,-125,-123,-120,-117,-115,-111,-110,-107,-105,-102,-101,-99,-97,-95,-92,-91,-90,-88,-86,-85,-83,-82,-80,-78,-78,-76,-75,-73,-72,-71,-70,-68,-67,-66,-64,-64,-62,-61,-60,-59,-57,-56,-55,-54,-53,-52,-50,-49,-48,-47,-46,-44,-43,-42,-41,-40,-38,-37,-35,-35,-34,-32,-31,-29,-29,-28,-26,-24,-23,-23,-21,-20,-18,-18,-17,-15,-14,-12,-12,-11,-9,-8,-7,-6,-5,-3,-2,-2,-1,0,2,3,4,5,6,6,7,8,9,10,11,12,13,13,14,15,15,16,16,17,18,18,19,19,19,20,20,20,21,21,21,21,21,21,21],
    "175":[-110,-110,-111,-111,-112,-113,-114,-116,-117,-118,-121,-124,-127,-128,-132,-135,-141,-143,-147,-152,-160,-166,-169,-176,-183,-194,-198,-206,-213,-223,-227,-228,-228,-226,-217,-214,-207,-199,-188,-181,-177,-171,-164,-156,-153,-148,-144,-137,-133,-131,-128,-124,-120,-118,-115,-113,-109,-108,-106,-103,-101,-99,-98,-96,-94,-92,-91,-90,-88,-87,-85,-84,-83,-82,-80,-80,-79,-78,-77,-75,-74,-73,-72,-71,-70,-69,-68,-67,-66,-65,-64,-63,-62,-61,-60,-59,-57,-57,-56,-55,-54,-52,-51,-50,-49,-48,-47,-45,-44,-43,-42,-41,-40,-39,-37,-36,-35,-34,-33,-31,-30,-29,-28,-26,-25,-24,-23,-21,-20,-20,-18,-17,-15,-14,-14,-12,-11,-9,-8,-8,-7,-5,-4,-3,-2,-1,1,2,3,4,4,5,6,7,8,9,10,12,12,13,14,14,15,16,17,17,18,19,19,19,20,20,21,21,21,22,22,22,22,22,22],
    "200":[-113,-114,-114,-115,-116,-117,-118,-121,-123,-125,-128,-133,-137,-139,-144,-149,-158,-161,-168,-176,-189,-199,-204,-215,-225,-239,-242,-244,-241,-228,-218,-212,-202,-191,-178,-173,-166,-158,-149,-143,-140,-135,-131,-124,-122,-119,-115,-111,-108,-107,-104,-102,-99,-98,-96,-94,-92,-91,-90,-88,-87,-85,-85,-84,-83,-81,-81,-80,-79,-79,-78,-77,-76,-76,-75,-74,-74,-73,-72,-71,-71,-70,-69,-68,-68,-67,-66,-65,-64,-63,-62,-61,-60,-59,-58,-57,-56,-55,-54,-53,-52,-51,-49,-48,-47,-46,-45,-43,-42,-41,-40,-39,-38,-36,-35,-34,-33,-32,-30,-29,-28,-27,-26,-24,-23,-23,-21,-20,-19,-18,-17,-16,-14,-13,-13,-12,-10,-9,-8,-8,-7,-5,-4,-4,-3,-2,0,1,1,2,3,4,5,6,7,7,8,10,10,11,12,12,13,14,15,15,16,17,17,18,18,18,19,19,20,20,20,20,20,20,20],
    "inf":[-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};
  var _W08_GPS=[30,40,50,60,70,80,90,100,120,150,175,200];
  REG.w08_patch=function(el,U){
    var S=U.S;
    U.head(el,"PATCH ANTENNA","パッチの寸法・2 つのモードと軸比・地板の大きさ");
    var r1=U.ctrls(el);
    var er=U.slider(r1,"誘電体の比誘電率 ε<sub>r</sub>",{values:[1,2.2,3,4.4,6.15,10.2,20,37],value:20,fmt:function(v){return String(v);},onInput:function(){draw();}});
    var fq=U.seg(r1,["L1（1575.42 MHz）","L5（1176.45 MHz）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var qq=U.slider(r2,"共振の鋭さ Q",{values:[20,30,50,70,100,150,200],value:100,fmt:function(v){return String(v);},onInput:function(){draw();}});
    var sp=U.slider(r2,"2 つのモードの共振周波数の差（f<sub>0</sub>/Q の何倍か）",{values:[0,0.25,0.5,0.75,1,1.25,1.5,2],value:1,fmt:function(v){return "× "+v;},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var gp=U.slider(r3,"地板の一辺（2 次元の近似）",{values:_W08_GPS.concat([1e9]),value:70,fmt:function(v){return v>=1e8?"無限":v+" mm";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（εr 20・L1・地板 70 mm）",function(){er.set(20);fq.set(0);qq.set(100);sp.set(1);gp.set(70);draw();});
    U.button(br,"FR-4 の基板（εr 4.4）",function(){er.set(4.4);draw();});
    U.button(br,"L5 で同じ Q",function(){fq.set(1);qq.set(100);draw();});
    U.button(br,"L5 で Q = 20",function(){fq.set(1);qq.set(20);draw();});
    U.button(br,"地板 50 mm",function(){gp.set(50);draw();});
    U.button(br,"地板 150 mm",function(){gp.set(150);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],e=er.get(),L5=fq.get()===1,f0=L5?_W08_F5:_W08_F1,Q=qq.get(),k=sp.get(),g=gp.get();
      var lam=_W08_C/f0,ell=lam/(2*Math.sqrt(e)),lamd=lam/Math.sqrt(e),bwh=f0/Q;
      /* (a) 同じ縮尺のパッチ */
      var ax=nar?14:14,ay=36,scl=1.5,cx=nar?110:118,cy=ay+100;
      o.push(S.T(ax,18,"(a) パッチ（同じ縮尺。点線は 25 mm 角）","start",10.5,"ink",true));
      var Lp=ell*1000*scl,c5=Math.min(0.3,0.12*Math.sqrt(k))*Lp,hl=Lp/2;
      var pts=[[cx-hl+c5,cy-hl],[cx+hl,cy-hl],[cx+hl,cy+hl-c5],[cx+hl-c5,cy+hl],[cx-hl,cy+hl],[cx-hl,cy-hl+c5]];
      if(c5<0.5)pts=[[cx-hl,cy-hl],[cx+hl,cy-hl],[cx+hl,cy+hl],[cx-hl,cy+hl]];
      o.push(S.PL(pts.concat([pts[0]]),"signal",1.6,U.soft("signal")));
      o.push(S.RECT(cx-12.5*scl,cy-12.5*scl,25*scl,25*scl,0,"none","muted",1,"2 3"));
      o.push(S.D(cx+Lp/6,cy,"alias",3.4));
      o.push(S.L(ax+8,cy+80,ax+8+20*scl,cy+80,"ink",1.6));o.push(S.T(ax+8+10*scl,cy+94,"20 mm","middle",9,"ink"));
      o.push(S.T(cx,cy+hl+18>cy+76?cy+76:cy+hl+18,"一辺 ℓ = "+_w08_f(ell*1000,1)+" mm","middle",10,"signal",true,false,null,true));
      /* (b) 2 つのモードの振幅と軸比 */
      var span=Math.max(25,Math.ceil(1.6*bwh/1e6/5)*5),px=nar?50:290,py=nar?250:40,pw=nar?330:380,ph1=70,ph2=80;
      o.push(S.T(px-40,py-12,"(b) 2 つのモードの振幅と、軸比（"+(L5?"L5":"L1")+" から ±"+span+" MHz）","start",10.5,"ink",true));
      var fu=f0*(1-k/(2*Q)),fv=f0*(1+k/(2*Q)),P1=U.plot(px,py,pw,ph1,[-span,span],[0,1.05]);
      o.push(P1.axes({yl:"振幅",xt:[-span,-span/2,0,span/2,span],yt:[0,0.5,1],xfmt:function(){return "";},yfmt:function(v){return _w08_f(v,1);}}));
      o.push(S.L(P1.x,P1.Y(Math.SQRT1_2),P1.x+P1.w,P1.Y(Math.SQRT1_2),"muted",1,"3 3"));
      var lu=[],lv=[],la=[],i,n=240,okl=null,okh=null;
      for(i=0;i<=n;i++){var d=-span+2*span*i/n,f=f0+d*1e6,Ku=_w08_K(f,fu,Q),Kv=_w08_K(f,fv,Q);lu.push([d,Math.hypot(Ku[0],Ku[1])]);lv.push([d,Math.hypot(Kv[0],Kv[1])]);
        var aR=Math.hypot(Ku[0]+Kv[1],Ku[1]-Kv[0]),aL=Math.hypot(Ku[0]-Kv[1],Ku[1]+Kv[0]),arv=20*Math.log10((aR+aL)/Math.max(Math.abs(aR-aL),1e-12));la.push([d,arv]);}
      /* 軸比 3 dB 以下の幅（細かく調べる） */
      var arf=function(d){var f=f0+d*1e6,Ku=_w08_K(f,fu,Q),Kv=_w08_K(f,fv,Q),aR=Math.hypot(Ku[0]+Kv[1],Ku[1]-Kv[0]),aL=Math.hypot(Ku[0]-Kv[1],Ku[1]+Kv[0]);return 20*Math.log10((aR+aL)/Math.max(Math.abs(aR-aL),1e-12));};
      for(i=0;i<=4000;i++){var dd=-span+2*span*i/4000;if(arf(dd)<=3){if(okl===null)okl=dd;okh=dd;}}
      o.push(P1.line(lu,"purple",1.8));o.push(P1.line(lv,"teal",1.8));
      var P2=U.plot(px,py+ph1+14,pw,ph2,[-span,span],[0,15]);
      o.push(P2.axes({xl:"中心からの周波数 [MHz]",yl:"軸比 [dB]",xt:[-span,-span/2,0,span/2,span],yt:[0,3,6,10,15],xfmt:function(v){return _w08_f(v,v%1?1:0);},yfmt:function(v){return String(v);}}));
      var mlw=L5?20.46:2.046;
      o.push(S.RECT(P2.X(-mlw/2),P2.y,P2.X(mlw/2)-P2.X(-mlw/2),P2.h,0,U.soft("gold"),"none",0,null,' fill-opacity="0.6"'));
      if(okl!==null)o.push(S.RECT(P2.X(okl),P2.y,P2.X(okh)-P2.X(okl),P2.h,0,U.soft("green"),"none",0,null,' fill-opacity="0.6"'));
      o.push(S.L(P2.x,P2.Y(3),P2.x+P2.w,P2.Y(3),"muted",1,"3 3"));
      o.push(P2.clip(la,"signal",2.2));
      var ar0=arf(0);
      o.push(S.T(P2.x+P2.w-4,P2.y+12,"緑: 軸比 3 dB 以下 "+(okl===null?"なし":_w08_f(okh-okl,1)+" MHz"),"end",9,"green",true,false,null,true));
      o.push(S.T(P2.x+P2.w-4,P2.y+25,"金: 信号の主ローブ "+mlw+" MHz","end",9,"gold",true,false,null,true));
      /* (c) 地板と放射パターン（2 次元の近似） */
      var gx=nar?110:140,gyc=nar?py+ph1+ph2+150:340,GR=nar?92:110,gmin=-25,gmax=5;
      o.push(S.T(nar?10:14,gyc-GR-26,"(c) 地板の大きさとパターン（εr 20・L1 のパッチ。2 次元の近似）","start",10.5,"ink",true));
      o.push(S.CIRC(gx,gyc,GR,"muted",1.2,"screen"));
      [-20,-10,0].forEach(function(v){var rr=GR*(v-gmin)/(gmax-gmin);o.push(S.CIRC(gx,gyc,rr,"faint",0.9,null,"3 3"));o.push(S.T(gx+3,gyc-rr+11,String(v).replace("-","−"),"start",8.5,"muted",false,false,null,true));});
      o.push(S.L(gx-GR-6,gyc,gx+GR+6,gyc,"muted",1.2));o.push(S.L(gx,gyc-GR,gx,gyc+GR,"grid",1));
      o.push(S.T(gx,gyc-GR-6,"真上 [dB]","middle",9,"ink",true));o.push(S.T(gx,gyc+GR+14,"真下","middle",9,"ink",true));
      function curve(arr,c,lw,dash,upOnly){[1,-1].forEach(function(sd){var q=[];for(var j=0;j<181;j++){var elv=j-90;if(upOnly&&elv<0)continue;var v=Math.max(gmin,Math.min(gmax,arr[j]/10)),rr=GR*(v-gmin)/(gmax-gmin);q.push([gx+sd*rr*Math.cos(elv*_W08_D),gyc-rr*Math.sin(elv*_W08_D)]);}o.push(S.PL(q,c,lw,null,dash));});}
      curve(_W08_GP.inf,"muted",1.4,"5 3",true);
      var key=g>=1e8?"inf":String(g),cur=_W08_GP[key];curve(cur,"signal",2.4,null,false);
      var zen=cur[180]/10,hor=cur[90]/10,nad=cur[0]/10;
      /* (d) 地板の一辺と、真上・地平線・真下 */
      var dx=nar?50:330,dy=nar?gyc+GR+60:gyc-GR-4,dw=nar?330:340,dh=nar?120:200;
      o.push(S.T(dx-40,dy-12,"(d) 地板の一辺と、向きごとの値 [dB]","start",10.5,"ink",true));
      var P3=U.plot(dx,dy,dw,dh,[30,200],[-16,5]);
      o.push(P3.axes({xl:"地板の一辺 [mm]",xt:[30,50,70,100,150,200],yt:[-15,-10,-5,0,5],xfmt:function(v){return String(v);},yfmt:function(v){return String(v).replace("-","−");}}));
      [[180,"signal","真上"],[90,"gold","地平線"],[0,"alias","真下"]].forEach(function(z){var q=_W08_GPS.map(function(sz){return [sz,_W08_GP[String(sz)][z[0]]/10];});o.push(P3.line(q,z[1],2));
        o.push(S.T(P3.X(200)-2,P3.Y(q[q.length-1][1])+(z[0]===90?14:-6),z[2],"end",9.5,z[1],true,false,null,true));});
      if(g<1e8){o.push(S.L(P3.X(g),P3.y,P3.X(g),P3.y+P3.h,"ink",1.2,"3 3"));[[zen,"signal"],[hor,"gold"],[nad,"alias"]].forEach(function(z){o.push(S.D(P3.X(g),P3.Y(z[0]),z[1],4.4));});}
      box.set(S.svg(Wd,nar?dy+dh+44:Math.max(gyc+GR+30,dy+dh+44),o));
      /* 読み出し */
      var h="波長 λ = "+_w08_f(lam*1000,1)+" mm、誘電体の中の波長 λ/√ε<sub>r</sub> = "+_w08_f(lamd*1000,1)+" mm → 一辺 <b>ℓ = λ/(2√ε<sub>r</sub>) = "+_w08_f(ell*1000,1)+" mm</b>（給電点は中心から ℓ/6 = "+_w08_f(ell*1000/6,2)+" mm）<br>";
      h+="共振の帯域 f<sub>0</sub>/Q = "+_w08_f(bwh/1e6,2)+" MHz。モードの共振周波数 f<sub>u</sub> = "+_w08_f(fu/1e6,2)+" MHz、f<sub>v</sub> = "+_w08_f(fv/1e6,2)+" MHz → 中心で軸比 <b>"+_w08_f(ar0,1)+" dB</b>、3 dB 以下の幅 <b>"+(okl===null?"なし":_w08_f(okh-okl,2)+" MHz")+"</b>（信号の主ローブ "+mlw+" MHz）<br>";
      h+="地板 "+(g>=1e8?"無限":g+" mm")+": 真上 "+_w08_f(zen,1)+" dB、地平線 "+_w08_f(hor,1)+" dB、真下 "+(nad<-39?"−∞":_w08_f(nad,1))+" dB、<b>前後比 "+(g>=1e8?"∞":_w08_f(zen-nad,1)+" dB")+"</b>（無限の地板の真上を 0 dB）";
      ro.innerHTML=h+'<div class="wnote">パッチの一辺は簡単な式（縁ではみ出す電界の分は入れていない）。角の切り方の大きさは目安で、計算には使っていない。2 つのモードは 3 節の共振の式で、差が f<sub>0</sub>/Q のときに中心で軸比 0 dB になる。地板のパターンは、地板の奥行きを無限とした 2 次元の計算（モーメント法）で、比誘電率と周波数のつまみには連動しない。</div>';
    }
    draw();
  };

  /* ---- 6 節: 整合・スミスチャート・S11 ---- */
  REG.w08_match=function(el,U){
    var S=U.S;
    U.head(el,"MATCHING","整合 — スミスチャートと S11、リターンロス・VSWR・軸比");
    var r1=U.ctrls(el);
    var kd=U.seg(r1,["円偏波のパッチ（1 点給電）","直線偏波のパッチ","Z を直接決める"],0,function(){draw();});
    var r2=U.ctrls(el);
    var sh=U.slider(r2,"共振周波数のずれ",{min:-15,max:15,step:0.5,value:0,fmt:function(v){return (v>0?"+":"")+_w08_f(v,1)+" MHz";},onInput:function(){if(kd.get()===2)kd.set(0);draw();}});
    var qq=U.slider(r2,"Q",{values:[30,50,70,100,150,200],value:100,fmt:function(v){return String(v);},onInput:function(){if(kd.get()===2)kd.set(0);draw();}});
    var r3=U.ctrls(el);
    var rr=U.slider(r3,"抵抗 R<sub>A</sub>（直接のとき）",{values:[0,5,10,17,25,35,50,75,100,150,250,500,1e9],value:50,fmt:function(v){return v>=1e8?"∞（開放）":v+" Ω";},onInput:function(){kd.set(2);draw();}});
    var xx=U.slider(r3,"リアクタンス X<sub>A</sub>（直接のとき）",{min:-150,max:150,step:5,value:0,fmt:function(v){return (v>0?"+":"")+_w08_f(v,0)+" Ω";},onInput:function(){kd.set(2);draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（合っている）",function(){kd.set(0);sh.set(0);qq.set(100);draw();});
    U.button(br,"共振が 5 MHz 下がる",function(){kd.set(0);sh.set(-5);draw();});
    U.button(br,"10 MHz 下がる",function(){kd.set(0);sh.set(-10);draw();});
    U.button(br,"25 Ω",function(){kd.set(2);rr.set(25);xx.set(0);draw();});
    U.button(br,"100 Ω",function(){kd.set(2);rr.set(100);xx.set(0);draw();});
    U.button(br,"50 + j50 Ω",function(){kd.set(2);rr.set(50);xx.set(50);draw();});
    U.button(br,"短絡",function(){kd.set(2);rr.set(0);xx.set(0);draw();});
    U.button(br,"開放",function(){kd.set(2);rr.set(1e9);xx.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function at(f){var k=kd.get();if(k===2){var R=rr.get(),X=xx.get();if(R>=1e8)return {Z:[1e9,0],G:[1,0],PR:0,PL:0,open:true};return _w08_zout([R,X],null,null);}
      return _w08_patchZ(f,_W08_F1+sh.get()*1e6,qq.get(),k);}
    function g2(G,cx,cy,R){return [cx+R*G[0],cy-R*G[1]];}
    function zg(r,x){var d=(r+1)*(r+1)+x*x;return [((r*r-1)+x*x)/d,2*x/d];}   /* z = Z/50 → Γ */
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],k=kd.get(),i;
      /* (a) スミスチャート */
      var cx=nar?200:170,cy=nar?176:186,R=nar?140:146;
      o.push(S.T(10,18,"(a) スミスチャート（青: L1 ± 25 MHz の軌跡、点は L1）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,R,"ink",1.3,"screen"));o.push(S.L(cx-R,cy,cx+R,cy,"muted",1));
      var rs=[0.2,0.5,1,2,5],xs=[0.2,0.5,1,2,5],lg=[];for(i=-40;i<=40;i++)lg.push(Math.pow(10,i/10));
      rs.forEach(function(r){var q=[];lg.forEach(function(x){q.push(g2(zg(r,-x),cx,cy,R));});q.reverse();q.push(g2(zg(r,0),cx,cy,R));lg.forEach(function(x){q.push(g2(zg(r,x),cx,cy,R));});o.push(S.PL(q,r===1?"signal":"faint",r===1?1.2:0.9,null,r===1?null:"3 3"));});
      xs.forEach(function(x){[1,-1].forEach(function(sg){var q=[g2(zg(0,sg*x),cx,cy,R)];lg.forEach(function(r){q.push(g2(zg(r,sg*x),cx,cy,R));});o.push(S.PL(q,"faint",0.9,null,"3 3"));});});
      o.push(S.CIRC(cx,cy,R/3,"purple",1.1,null,"2 3"));
      o.push(S.T(cx-R-4,cy-6,"短絡","end",9,"ink",true));o.push(S.T(cx+R+4,cy-6,"開放","start",9,"ink",true));
      o.push(S.T(cx,cy-R-6,"X > 0","middle",9,"muted"));o.push(S.T(cx,cy+R+14,"X < 0","middle",9,"muted"));
      o.push(S.T(cx+R/3+3,cy+R/3,"VSWR 2","start",9,"purple",false,false,null,true));
      var loc=[],sw=[],arl=[];
      for(i=0;i<=200;i++){var d=-25+50*i/200,r=at(_W08_F1+d*1e6);loc.push(g2(r.G,cx,cy,R));sw.push([d,20*Math.log10(Math.max(Math.hypot(r.G[0],r.G[1]),1e-5))]);if(k===0)arl.push([d,_w08_ar(r.PR,r.PL)]);}
      if(k!==2){o.push(S.PL(loc,"signal",2.2));o.push(S.head(loc[96][0],loc[96][1],loc[104][0],loc[104][1],"signal",8));}
      var r0=at(_W08_F1),G0=r0.G,mg=Math.min(1,Math.hypot(G0[0],G0[1])),p0=g2(G0,cx,cy,R);
      o.push(S.D(p0[0],p0[1],"alias",5.2));
      /* (b) |S11| と (c) 軸比 */
      var px=nar?50:390,py=nar?cy+R+60:40,pw=nar?330:290,ph=nar?120:130;
      o.push(S.T(px-40,py-12,"(b) |S11| [dB]（周波数は L1 から）","start",10.5,"ink",true));
      var P=U.plot(px,py,pw,ph,[-25,25],[-40,0]);
      o.push(P.axes({xt:[-20,-10,0,10,20],yt:[-40,-30,-20,-10,0],xfmt:function(v){return k===0?"":String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");}}));
      o.push(S.L(P.x,P.Y(-10),P.x+P.w,P.Y(-10),"muted",1,"3 3"));o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"ink",1,"2 3"));
      o.push(P.clip(sw,"signal",2.2));
      var s0=20*Math.log10(Math.max(mg,1e-5));o.push(S.D(P.X(0),P.Y(Math.max(-40,s0)),"alias",4.4));
      var yb=py+ph+30;
      if(k===0){var qy=py+ph+26;o.push(S.T(px-40,qy-6,"(c) 軸比 [dB]","start",10.5,"ink",true));
        var P2=U.plot(px,qy+6,pw,ph-30,[-25,25],[0,15]);
        o.push(P2.axes({xl:"L1 からの周波数 [MHz]",xt:[-20,-10,0,10,20],yt:[0,3,6,10,15],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v);}}));
        o.push(S.L(P2.x,P2.Y(3),P2.x+P2.w,P2.Y(3),"muted",1,"3 3"));o.push(S.L(P2.X(0),P2.y,P2.X(0),P2.y+P2.h,"ink",1,"2 3"));
        o.push(P2.clip(arl,"signal",2.2));var a0=_w08_ar(r0.PR,r0.PL);o.push(S.D(P2.X(0),P2.Y(Math.min(15,a0)),"alias",4.4));yb=qy+6+ph-30+44;}
      else o.push(S.T(px+pw/2,py+ph+30,"L1 からの周波数 [MHz]","middle",10,"muted"));
      box.set(S.svg(Wd,nar?yb+10:Math.max(cy+R+30,yb+10),o));
      /* 読み出し */
      var Z=r0.Z,vs=mg>=0.9999?Infinity:(1+mg)/(1-mg),rl=-20*Math.log10(Math.max(mg,1e-12)),ml=mg>=0.9999?Infinity:-10*Math.log10(1-mg*mg);
      var h="L1 で Z<sub>A</sub> = "+(r0.open?"∞（開放）":_w08_f(Z[0],1)+(Z[1]<0?" − j":" + j")+_w08_f(Math.abs(Z[1]),1)+" Ω")+" → Γ = "+_w08_f(G0[0],3)+(G0[1]<0?" − ":" + ")+_w08_f(Math.abs(G0[1]),3)+"j、|Γ| = "+_w08_f(mg,3)+"<br>";
      h+="リターンロス <b>"+(rl>99?"∞":_w08_f(rl,1)+" dB")+"</b>（|S11| = "+(rl>99?"−∞":_w08_f(-rl,1))+" dB）、VSWR <b>"+(isFinite(vs)?_w08_f(vs,2):"∞")+"</b>、不整合損失 <b>"+(isFinite(ml)?_w08_f(ml,2)+" dB":"∞（全部跳ね返る）")+"</b>（渡る電力 "+_w08_f(100*(1-mg*mg),1)+" %）<br>";
      if(k===0){var a1=_w08_ar(r0.PR,r0.PL),pp=r0.PR/(r0.PR+r0.PL),lr=r0.PL/(r0.PR+r0.PL);
        h+="軸比 <b>"+_w08_f(a1,1)+" dB</b>。右旋の電波を受ける強さ: 不整合 "+_w08_f(ml,2)+" dB + 偏波 "+_w08_f(-_w08_db(pp),2)+" dB = <b>"+_w08_f(-_w08_db(r0.PR/0.25),2)+" dB</b> の損失。左旋の反射波は "+(lr<1e-12?"−∞":_w08_f(_w08_db(lr),1))+" dB で受ける（偏波の分だけ）";}
      else if(k===1)h+="直線偏波なので、右旋の電波は偏波でさらに 3.01 dB 損する（合計 "+_w08_f(ml+3.0103,2)+" dB）";
      ro.innerHTML=h+'<div class="wnote">パッチは 3 節の 2 つのモードの共振回路を直列につないだモデル（それぞれ共振で 50 Ω、Q は共通）で、ずれ 0 のとき L1 で 50 Ω・軸比 0 dB になる。直線偏波のパッチは 1 つのモード。基準は 50 Ω。右旋の損失は、1 V・50 Ω の信号源で送ったときの右旋の電力を、合っているときと比べた値（不整合損失と偏波の損失の和に等しい）。</div>';
    }
    draw();
  };
