  /* ===== 22 章 筐体とアンテナの置き方 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w22_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w22_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W22_D=Math.PI/180,_W22_F1=1575.42e6,_W22_LAM=299792458/1575.42e6,_W22_ALL=["GPS","GLONASS","Galileo","BeiDou","QZSS"];
  /* ---- 空の配置（6・7 章と同じ: 東京）と DOP（全部の衛星系では時計のずれを衛星系ごとに置く。図の f22.py と同じ計算） ---- */
  function _w22_sats(U,t,systems){var rx=U.gnss.rx(U.gnss.TOKYO[0],U.gnss.TOKYO[1],U.gnss.TOKYO[2]),out=[];
    U.gnss.constellation().forEach(function(s){if(systems.indexOf(s.sys)<0)return;var e=U.gnss.elaz(rx,U.gnss.ecef(s,t));if(e[0]>0)out.push({nm:s.nm,el:e[0],az:e[1],sys:s.sys});});
    out.sort(function(a,b){return b.el-a.el;});return out;}
  function _w22_G(sats){var us=[];sats.forEach(function(q){if(us.indexOf(q.sys)<0)us.push(q.sys);});
    return {us:us,G:sats.map(function(q){var e=q.el*_W22_D,a=q.az*_W22_D,r=[-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e)];us.forEach(function(u){r.push(u===q.sys?1:0);});return r;})};}
  function _w22_dop(U,sats){if(!sats.length)return null;var g=_w22_G(sats);if(sats.length<3+g.us.length)return null;
    var M=U.ctl.mat,H;try{H=M.inv(M.mul(M.T(g.G),g.G));}catch(e){return null;}
    for(var i=0;i<H.length;i++)if(!(H[i][i]>0)||!isFinite(H[i][i])||H[i][i]>1e6)return null;
    return {H:Math.sqrt(H[0][0]+H[1][1]),V:Math.sqrt(H[2][2]),P:Math.sqrt(H[0][0]+H[1][1]+H[2][2]),Hm:H};}
  /* 擬似距離の誤差 eta を入れたときの解の誤差（東・北・上）と残差 */
  function _w22_err(U,sats,eta){var g=_w22_G(sats),M=U.ctl.mat,Gt=M.T(g.G),dx=M.solve(M.mul(Gt,g.G),M.mul(Gt,M.col(eta))),r=[];
    for(var i=0;i<sats.length;i++){var s=0;for(var j=0;j<g.G[0].length;j++)s+=g.G[i][j]*dx[j][0];r.push(eta[i]-s);}
    return {e:dx[0][0],n:dx[1][0],u:dx[2][0],res:r};}
  /* 遮る仰角 [°]（方位角 az の向き）: 長い壁・通り・体・車の室内（例の値） */
  function _w22_wall(az,aw,h,d){var c=Math.cos((az-aw)*_W22_D);return c>0?Math.atan(h*c/d)/_W22_D:0;}
  function _w22_canyon(az,as,h,w){return Math.atan(2*h/w*Math.abs(Math.sin((az-as)*_W22_D)))/_W22_D;}
  function _w22_body(az,face,elb){return Math.cos((az-face)*_W22_D)<0?elb:0;}
  function _w22_car(az,head){var r=((az-head)%360+360)%360;if(r>=100&&r<=260)return 40;if((r>=60&&r<100)||(r>260&&r<=300))return 20;return 0;}
  /* 通りの中で、向かいの壁で 1 回反射して届くか: null（直接見える）、0（届かない）、余分の道のり [m] */
  function _w22_nlos(q,as,h,w){var s=Math.abs(Math.sin((q.az-as)*_W22_D));if(s<1e-9)return null;var tp=Math.tan(q.el*_W22_D)/s;
    if((w/2)*tp>=h)return null;if(1.5*w*tp>h)return w*Math.cos(q.el*_W22_D)*s;return 0;}
  /* 遮る範囲の多角形（地平線と、遮る仰角の線の間） */
  function _w22_maskpoly(U,cx,cy,R,mf){var S=U.S,o=[],i,n=180,outer=[],inner=[];
    for(i=0;i<=n;i++){outer.push(U.gnss.skyxy(cx,cy,R,0,360*i/n));}
    for(i=n;i>=0;i--){inner.push(U.gnss.skyxy(cx,cy,R,mf(360*i/n),360*i/n));}
    o.push(S.PL(outer.concat(inner),"none",0,"var(--muted-soft)"));o.push(S.PL(inner,"muted",1.3));return o.join("");}
  /* ---- 8 章のパッチのモデル（2 つのモードの共振回路を直列、Q = 100、共振で 50 Ω）と、2 節の離調の傾向のモデル ---- */
  var _W22_Q=100,_W22_XI0=0.010,_W22_HE=3.0;
  function _w22_K(f,fk){var x=_W22_Q*(f/fk-fk/f),d=1+x*x;return [1/d,-x/d];}   /* 1/(1 + jQ(f/fk − fk/f)) */
  function _w22_patch(f,shift,match){var f0=_W22_F1+shift,ku=_w22_K(f,f0*(1-1/(2*_W22_Q))),kv=_w22_K(f,f0*(1+1/(2*_W22_Q)));
    var Z=[50*(ku[0]+kv[0]),50*(ku[1]+kv[1])],nr=Z[0]-50,ni=Z[1],dr=Z[0]+50,di=Z[1],dd=dr*dr+di*di,G=[(nr*dr+ni*di)/dd,(ni*dr-nr*di)/dd];
    var ir=dr/dd,ii=-di/dd,vu=[50*(ir*ku[0]-ii*ku[1]),50*(ir*ku[1]+ii*ku[0])],vv=[50*(ir*kv[0]-ii*kv[1]),50*(ir*kv[1]+ii*kv[0])];
    var rr=vu[0]+vv[1],ri=vu[1]-vv[0],lr=vu[0]-vv[1],li=vu[1]+vv[0],PR=(rr*rr+ri*ri)/2,PL=(lr*lr+li*li)/2;   /* 右旋 ∝ |Vu − jVv|、左旋 ∝ |Vu + jVv| */
    if(match&&f===_W22_F1){var sc=0.25/(PR+PL);PR*=sc;PL*=sc;G=[0,0];}   /* L1 で整合の回路を足す（電力の受け渡しだけが変わり、2 つのモードの比は変わらない） */
    return {G:G,PR:PR,PL:PL};}
  function _w22_ar(PR,PL){var a=Math.sqrt(PR),b=Math.sqrt(PL);return 20*Math.log10((a+b)/Math.max(Math.abs(a-b),1e-12));}
  function _w22_xip(hp,dp){return _W22_XI0*Math.exp(-dp/_W22_HE)*(1-Math.exp(-hp/_W22_HE));}
  function _w22_df(ep,hp,dp){return -(ep-1)*_w22_xip(hp,dp)*_W22_F1/2;}   /* 近似: Δf ≈ −(εp − 1)ξp f0/2 */
  /* ---- 8 章の例のアンテナの右旋の利得と、3 章 3 節の C/N0 のモデル（4 節） ---- */
  function _w22_ga3(el){return 3-8*Math.pow((90-el)/85,2);}
  function _w22_gr(ela){var s=Math.sin(Math.abs(ela)*_W22_D),rho=(1-s)/(1+s);if(ela>=0)return _w22_ga3(ela);
    var g0=10*Math.log10(2*Math.pow(10,_w22_ga3(0)/10)),gt=Math.pow(10,(g0+(-13-g0)*Math.pow(s,0.5))/10);return 10*Math.log10(Math.max(gt*rho*rho/(1+rho*rho),1e-30));}
  function _w22_ela(el,az,chi,at){var s=Math.sin(el*_W22_D)*Math.cos(chi*_W22_D)+Math.cos(el*_W22_D)*Math.sin(chi*_W22_D)*Math.cos((az-at)*_W22_D);return Math.asin(Math.max(-1,Math.min(1,s)))/_W22_D;}
  function _w22_cn0(el,ga){var R=6371e3,a=26560e3,e=el*_W22_D,r=Math.sqrt(a*a-Math.pow(R*Math.cos(e),2))-R*Math.sin(e);return 56.4-20*Math.log10(4*Math.PI*r/_W22_LAM)-0.5+ga+174;}
  function _w22_cncol(v){return v>=35?"green":(v>=25?"gold":"alias");}

  /* ---- 1 節: 遮る物とスカイプロット ↔ 見える衛星・DOP・反射波によるずれ ---- */
  REG.w22_sky=function(el,U){
    var S=U.S;
    U.head(el,"SKY VIEW","遮る物とスカイプロット — 見える衛星・DOP・反射波によるずれ");
    var SC=["開けた空","南に長い壁","通り（両側に建物）","胸に着けた機器（体の陰）","車の室内（ダッシュボード）"];
    var r1=U.ctrls(el);
    var sc=U.select(r1,"場面",SC,2,function(){fit();draw();});
    var hh=U.slider(r1,"建物の高さ h<sub>b</sub>",{min:2,max:60,step:1,value:24,fmt:function(v){return v+" m";},onInput:function(){draw();}});
    var ww=U.slider(r1,"壁までの距離・通りの幅",{min:2,max:60,step:1,value:18,fmt:function(v){return v+" m";},onInput:function(){draw();}});
    var be=U.slider(r1,"体が遮る仰角（例の値）",{min:10,max:90,step:1,value:60,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var dir=U.slider(r2,"向き（図をドラッグしても回る）",{min:0,max:359,step:1,value:45,fmt:function(v){return Math.round(v)+"°";},onInput:function(){draw();}});
    var tm=U.slider(r2,"時刻（例の時刻 0 から）",{min:0,max:12,step:0.25,value:0,fmt:function(v){return _w22_f(v,2)+" 時間";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var all=U.checkbox(r3,"全部の衛星系",false,function(){draw();});
    var nl=U.checkbox(r3,"反射波だけの衛星も使う（通りのとき）",true,function(){draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tm.get()+0.05;if(v>12){v=12;tick.stop();}tm.set(v);draw();},80);
    U.button(br,"本文の例（通り）",function(){tick.stop();sc.set(2);hh.set(24);ww.set(18);dir.set(45);tm.set(0);all.set(false);nl.set(true);draw();});
    U.button(br,"南の壁（20 m・10 m 先）",function(){tick.stop();sc.set(1);hh.set(20);ww.set(10);dir.set(180);tm.set(0);draw();});
    U.button(br,"体の陰",function(){tick.stop();sc.set(3);dir.set(0);be.set(60);tm.set(0);draw();});
    U.button(br,"再生（時刻を進める）",function(){if(tm.get()>=12)tm.set(0);tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),GEO={cx:0,cy:0,R:1};
    function fit(){var k=sc.get();if(k===1){hh.set(20);ww.set(10);dir.set(180);}else if(k===2){hh.set(24);ww.set(18);dir.set(45);}else if(k===3){be.set(60);dir.set(0);}else if(k===4){dir.set(0);}}
    /* スカイプロットのドラッグで向きを回す */
    U.ctl.drag(box,function(type,x,y){if(type==="up")return;var dx=x-GEO.cx,dy=y-GEO.cy;if(type==="down"&&Math.hypot(dx,dy)>GEO.R+14)return false;
      if(Math.hypot(dx,dy)<6)return;tick.stop();var az=((Math.atan2(dx,-dy)/_W22_D)+360)%360;dir.set(Math.round(az));draw();});
    function maskf(){var k=sc.get(),h=hh.get(),w=ww.get(),a=dir.get();
      if(k===0)return function(){return 0;};if(k===1)return function(z){return _w22_wall(z,a,h,w);};if(k===2)return function(z){return _w22_canyon(z,a,h,w);};
      if(k===3)return function(z){return _w22_body(z,a,be.get());};return function(z){return _w22_car(z,a);};}
    function draw(){
      var nar=_w22_nar(box),Wd=nar?400:700,o=[],k=sc.get(),mf=maskf(),sys=all.get()?_W22_ALL:["GPS"],sats=_w22_sats(U,tm.get()*3600,sys);
      hh.el.style.display=(k===1||k===2)?"":"none";ww.el.style.display=(k===1||k===2)?"":"none";be.el.style.display=k===3?"":"none";nl.el.style.display=k===2?"":"none";dir.el.style.display=k===0?"none":"";
      var many=sats.length>12,vis=[],use=[],eta=[],nlos=[];
      sats.forEach(function(q){var v=q.el>mf(q.az);if(v){vis.push(q);use.push(q);eta.push(0);}
        else if(k===2&&nl.get()){var r=_w22_nlos(q,dir.get(),hh.get(),ww.get());if(r){nlos.push(q);use.push(q);eta.push(r);q.ex=r;}}});
      /* (a) スカイプロット */
      var cx=nar?200:170,cy=nar?168:176,R=nar?118:130;GEO={cx:cx,cy:cy,R:R};
      o.push(S.T(nar?10:14,18,"(a) 空（ドラッグで向きを回す）","start",11,"ink",true));
      o.push(U.gnss.sky(U,cx,cy,R,[],{dot:4}));
      if(k>0)o.push(_w22_maskpoly(U,cx,cy,R,mf));
      sats.forEach(function(q){var p=U.gnss.skyxy(cx,cy,R,q.el,q.az),isN=nlos.indexOf(q)>=0,isV=vis.indexOf(q)>=0,c=U.gnss.SYS[q.sys][1];
        if(isV){o.push(S.D(p[0],p[1],c,many?3.4:4.4));}
        else if(isN){o.push(S.CIRC(p[0],p[1],many?5.5:7,"alias",1.6));o.push(S.D(p[0],p[1],"alias",many?3:3.6));c="alias";}
        else{o.push(S.X(p[0],p[1],3.4,"faint",1.6));c="faint";}
        if(!many)o.push(S.T(p[0]+7,p[1]+3.5,q.nm,"start",9.5,c,isV||isN,false,null,true));});
      /* (b) 上から見た図 */
      var mx=nar?60:376,my=nar?cy+R+46:44,ms=nar?150:170,mcx=mx+ms/2,mcy=my+ms/2,pm=ms/90,a=dir.get()*_W22_D;   /* 1 m = pm px（±45 m） */
      o.push(S.T(nar?10:mx-6,my-14,"(b) 上から見た図（上が北、±45 m）","start",11,"ink",true));
      o.push(S.RECT(mx,my,ms,ms,4,"var(--screen)","line",1));
      var ux=Math.sin(a),uy=-Math.cos(a),vx=-uy,vy=ux,body=[];   /* u: 向きの単位ベクトル（画面）、v: それに垂直 */
      function poly(pts,c,f){return S.PL(pts.map(function(p){return [mcx+p[0]*pm,mcy+p[1]*pm];}),c,1.2,f);}
      if(k===1){var d=ww.get();body.push(poly([[ux*d-vx*60,uy*d-vy*60],[ux*d+vx*60,uy*d+vy*60],[ux*(d+8)+vx*60,uy*(d+8)+vy*60],[ux*(d+8)-vx*60,uy*(d+8)-vy*60]],"muted","var(--muted-soft)"));}
      if(k===2){var w2=ww.get()/2;[1,-1].forEach(function(sg){body.push(poly([[vx*sg*w2-ux*70,vy*sg*w2-uy*70],[vx*sg*w2+ux*70,vy*sg*w2+uy*70],[vx*sg*(w2+30)+ux*70,vy*sg*(w2+30)+uy*70],[vx*sg*(w2+30)-ux*70,vy*sg*(w2+30)-uy*70]],"muted","var(--muted-soft)"));});}
      if(k===3){body.push(S.CIRC(mcx-ux*6*pm*0.5,mcy-uy*6*pm*0.5,7,"muted",1.2,"var(--muted-soft)"));body.push(S.T(mcx-ux*36,mcy-uy*36+4,"体","middle",10,"muted",true));}
      if(k===4){var L=[[-0.9,-2.3],[0.9,-2.3],[0.9,2.3],[-0.9,2.3]].map(function(p){return [vx*p[0]*6+ux*p[1]*6,vy*p[0]*6+uy*p[1]*6];});body.push(poly(L,"ink","var(--panel)"));}
      o.push('<clipPath id="w22skc"><rect x="'+mx+'" y="'+my+'" width="'+ms+'" height="'+ms+'"/></clipPath><g clip-path="url(#w22skc)">'+body.join("")+'</g>');
      o.push(S.RECT(mx,my,ms,ms,4,"none","line",1));
      o.push(S.D(mcx,mcy,"green",4));
      if(k>0)o.push(S.ARR(mcx,mcy,mcx+ux*30,mcy+uy*30,"gold",1.6,6));
      o.push(S.ARR(mx+ms-10,my+24,mx+ms-10,my+8,"ink",1.1,5));o.push(S.T(mx+ms-18,my+20,"北","end",9.5,"ink",true));
      var cap=["何も無い","壁: 高さ "+hh.get()+" m・"+ww.get()+" m 先","通り: 幅 "+ww.get()+" m・建物 "+hh.get()+" m","体: 後ろを "+be.get()+"° まで（例の値）","屋根: 後ろ 40°・横 20°（例の値）"][k];
      o.push(S.T(mx,my+ms+16,cap,"start",10,"ink",true));
      if(k>0)o.push(S.T(mx,my+ms+32,"金の矢印: "+["","壁への向き","通りの向き","顔の向き","進む向き"][k]+" "+Math.round(dir.get())+"°","start",9.5,"gold"));
      var hgt=nar?my+ms+50:Math.max(cy+R+40,my+ms+50);
      box.set(S.svg(Wd,hgt,o));
      /* 読み出し */
      var dl=_w22_dop(U,vis),h="";
      h+="直接波が届く衛星 <b>"+vis.length+"</b> 個（地平線より上に "+sats.length+" 個）: ";
      h+=dl?"HDOP <b>"+_w22_f(dl.H,2)+"</b>・VDOP <b>"+_w22_f(dl.V,2)+"</b>":'<span class="warn">3 次元の位置を解けない</span>';
      if(k===2&&nl.get()){
        if(nlos.length){var du=_w22_dop(U,use);h+="<br>反射波だけの衛星 <b>"+nlos.length+"</b> 個（"+(nlos.length<=4?nlos.map(function(q){return q.nm+" "+_w22_f(q.ex,1)+" m";}).join("・"):"余分の道のり "+_w22_f(Math.min.apply(null,nlos.map(function(q){return q.ex;})),1)+"〜"+_w22_f(Math.max.apply(null,nlos.map(function(q){return q.ex;})),1)+" m")+"）も使うと "+use.length+" 個: ";
          if(du){var er=_w22_err(U,use,eta),mr=0;er.res.forEach(function(v){mr=Math.max(mr,Math.abs(v));});
            h+="位置のずれ 水平 <b>"+_w22_f(Math.hypot(er.e,er.n),1)+" m</b>・上下 <b>"+_w22_f(er.u,1)+" m</b>、残差の最大 <b>"+_w22_f(mr,1)+" m</b>"+(mr<0.05?'（<span class="warn">見つけられない</span>）':'（<span class="ok">食い違いが見える</span>）');}
          else h+='<span class="warn">まだ解けない</span>';}
        else h+="<br>反射波だけで届く衛星は無い";}
      ro.innerHTML=h+'<div class="wnote">衛星の配置は 1 章の近似のモデル（東京）。全部の衛星系では、時計のずれの未知数を衛星系ごとに置く。反射は、通りの向かいの壁での 1 回だけを数えた（受信機は通りの真ん中）。</div>';
    }
    draw();
  };

  /* ---- 2 節: 樹脂の覆いと共振のずれ（傾向のモデル）↔ L1 での S11・軸比・右旋の損失 ---- */
  var _W22_MAT=[["PP",2.2],["ABS",2.8],["PC",2.9],["PA66（乾燥時）",3.4],["PA66-GF30",4.0],["ガラス",6.5]];
  REG.w22_detune=function(el,U){
    var S=U.S;
    U.head(el,"DETUNING","樹脂の覆いと共振のずれ — L1 での S11・軸比・右旋の損失（傾向のモデル）");
    var r1=U.ctrls(el);
    var mt=U.select(r1,"材料（比誘電率は代表値）",_W22_MAT.map(function(m){return m[0]+"（"+m[1]+"）";}).concat(["自分で決める"]),1,function(v){if(v<_W22_MAT.length)ep.set(_W22_MAT[v][1]);draw();});
    var ep=U.slider(r1,"比誘電率 ε<sub>p</sub>",{min:1,max:8,step:0.1,value:2.8,fmt:function(v){return _w22_f(v,1);},onInput:function(){mt.set(_W22_MAT.length);draw();}});
    var r2=U.ctrls(el);
    var hp=U.slider(r2,"厚さ h<sub>p</sub>",{min:0,max:8,step:0.1,value:2,fmt:function(v){return _w22_f(v,1)+" mm";},onInput:function(){draw();}});
    var dp=U.slider(r2,"パッチとの隙間 d<sub>p</sub>",{min:0,max:10,step:0.1,value:1,fmt:function(v){return _w22_f(v,1)+" mm";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var mc=U.checkbox(r3,"整合の回路で L1 の S11 を 0 にする",false,function(){draw();});
    var rt=U.checkbox(r3,"共振をずれの分だけ高くしたアンテナにする",false,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（ABS 2 mm・隙間 1 mm）",function(){mt.set(1);ep.set(2.8);hp.set(2);dp.set(1);mc.set(false);rt.set(false);draw();});
    U.button(br,"樹脂なし",function(){hp.set(0);mc.set(false);rt.set(false);draw();});
    U.button(br,"ガラスに貼り付ける",function(){mt.set(5);ep.set(6.5);hp.set(3);dp.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var nar=_w22_nar(box),Wd=nar?400:700,o=[],e=ep.get(),h=hp.get(),d=dp.get(),xi=_w22_xip(h,d),df=_w22_df(e,h,d),sh=df+(rt.get()?-df:0);
      /* (a) 断面（1 mm = 6 px） */
      var k=6,cx=nar?200:170,gy=nar?196:200,cw=25*k,pw=21*k,ch=4*k,yt=gy-ch,j;
      o.push(S.T(nar?10:14,18,"(a) 断面（例のパッチ、1 mm = 6 px）","start",11,"ink",true));
      for(j=0;j<18;j++){o.push(S.RECT(cx-pw/2-24,yt-(j+1)*k,pw+48,k+0.4,0,"signal","none",0,null,' fill-opacity="'+(0.32*Math.exp(-(j+0.5)/_W22_HE)).toFixed(3)+'"'));}
      o.push(S.RECT(cx-cw/2-30,gy,cw+60,6,1,"var(--muted-soft)","muted",1.1));
      o.push(S.RECT(cx-cw/2,yt,cw,ch,2,U.soft("gold"),"gold",1.2));
      o.push(S.L(cx-pw/2,yt,cx+pw/2,yt,"signal",3));
      if(h>0){var yl=yt-d*k;o.push(S.RECT(cx-cw/2-24,yl-h*k,cw+48,h*k,1,U.soft("teal"),"teal",1.3));
        o.push(S.TX(cx-cw/2-20,yl-h*k-6,"樹脂 ε_p = "+_w22_f(e,1)+"・厚さ "+_w22_f(h,1)+" mm・隙間 "+_w22_f(d,1)+" mm","start",10,"teal",true,true));}
      else o.push(S.T(cx,yt-30,"樹脂なし","middle",10,"muted",true));
      o.push(S.T(cx,yt+ch/2+4,"セラミック（比誘電率 20）","middle",9.5,"gold",true));
      o.push(S.TX(nar?10:14,gy+28,"樹脂の層にある容量の割合 ξ_p = "+_w22_f(100*xi,2)+" %（上の空気の全部で ξ_0 = 1 %）","start",10,"ink"));
      o.push(S.TX(nar?10:14,gy+46,"共振のずれ Δf ≈ −(ε_p − 1) ξ_p f_0/2 = "+_w22_f(df/1e6,2)+" MHz"+(rt.get()?"（アンテナを先に "+_w22_f(-df/1e6,2)+" MHz 高くしたので、合わせて 0）":""),"start",10,df<-5e5?"alias":"ink",true));
      /* (b) S11、(c) 軸比（L1 ± 25 MHz） */
      var px=nar?52:420,py=nar?gy+84:44,pw2=nar?320:250,ph=nar?110:120;
      o.push(S.T(px-42,py-14,"(b) |S11| [dB]","start",11,"ink",true));
      var P=U.plot(px,py,pw2,ph,[-25,25],[-40,0]),s0=[],s1=[],a0=[],a1=[],i;
      for(i=0;i<=200;i++){var fd=-25+50*i/200,f=_W22_F1+fd*1e6,q0=_w22_patch(f,0,false),q1=_w22_patch(f,sh,false);
        s0.push([fd,20*Math.log10(Math.max(Math.hypot(q0.G[0],q0.G[1]),1e-5))]);s1.push([fd,20*Math.log10(Math.max(Math.hypot(q1.G[0],q1.G[1]),1e-5))]);
        a0.push([fd,_w22_ar(q0.PR,q0.PL)]);a1.push([fd,_w22_ar(q1.PR,q1.PL)]);}
      o.push(P.axes({xt:[-20,-10,0,10,20],yt:[-40,-30,-20,-10,0],xfmt:function(){return "";},yfmt:function(v){return String(v).replace("-","−");}}));
      o.push(S.L(P.x,P.Y(-10),P.x+P.w,P.Y(-10),"muted",1,"3 3"));o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"ink",1,"2 3"));
      o.push(P.clip(s0,"muted",3.4));o.push(P.clip(s1,"signal",2.2));
      var L1=_w22_patch(_W22_F1,sh,mc.get()),s11=20*Math.log10(Math.max(Math.hypot(L1.G[0],L1.G[1]),1e-6));o.push(S.D(P.X(0),P.Y(Math.max(-40,s11)),"alias",4.4));
      var qy=py+ph+32;o.push(S.T(px-42,qy-12,"(c) 軸比 [dB]","start",11,"ink",true));
      var Q=U.plot(px,qy,pw2,ph-20,[-25,25],[0,15]);
      o.push(Q.axes({xl:"L1 からの周波数 [MHz]",xt:[-20,-10,0,10,20],yt:[0,3,6,9,12,15],xfmt:function(v){return String(v).replace("-","−");}}));
      o.push(S.L(Q.x,Q.Y(3),Q.x+Q.w,Q.Y(3),"muted",1,"3 3"));o.push(S.L(Q.X(0),Q.y,Q.X(0),Q.y+Q.h,"ink",1,"2 3"));
      o.push(Q.clip(a0,"muted",3.4));o.push(Q.clip(a1,"signal",2.2));
      var ar=_w22_ar(L1.PR,L1.PL);o.push(S.D(Q.X(0),Q.Y(Math.min(15,ar)),"alias",4.4));
      o.push(S.LEGL(px-40,qy+ph-20+50,[["muted",null,"樹脂なし"],["signal",null,"いまの設定"]],9.5));
      var hgt=Math.max(gy+60,qy+ph-20+60);
      box.set(S.svg(Wd,nar?qy+ph-20+62:hgt,o));
      /* 読み出し */
      var mis=-10*Math.log10(Math.max(1-Math.pow(Math.hypot(L1.G[0],L1.G[1]),2),1e-12)),rl=-10*Math.log10(L1.PR/0.25),pol=-10*Math.log10(L1.PR/(L1.PR+L1.PL)),lh=10*Math.log10(Math.max(L1.PL,1e-30)/(L1.PR+L1.PL));
      var hs="L1 で: |S11| <b>"+(s11<-60?"−60 dB より小さい":_w22_f(s11,1)+" dB")+"</b>、軸比 <b>"+_w22_f(ar,1)+" dB</b>"+(ar>3?'（<span class="warn">3 dB を超える</span>）':'')+"<br>";
      hs+="右旋の電波を受ける強さの損失 <b>"+_w22_f(rl,2)+" dB</b>（不整合 "+_w22_f(mis,2)+" dB + 偏波 "+_w22_f(pol,2)+" dB）、左旋の反射波を <b>"+(lh<-50?"−50 dB より小さく":_w22_f(lh,1)+" dB で")+"</b>受ける";
      if(mc.get())hs+="<br>整合の回路で戻るのは不整合の分だけで、軸比は変わらない（曲線は回路を足す前。赤の点は L1 で回路を足した後）";
      ro.innerHTML=hs+'<div class="wnote">傾向のモデル（近似）: はみ出した電界の受け持つ容量が、パッチの面から高さ 3 mm ごとに 1/e 倍に減り、上の空気の全部で容量の 1 % を受け持つとした（どちらも例の値）。実際のずれはアンテナと筐体の形で違うので、組んだ状態で S11 を測る。S11 と軸比は 8 章 6 節の 1 点給電のパッチのモデル（Q = 100）。整合の回路は L1 で S11 を 0 にする損失の無い回路とした。</div>';
    }
    draw();
  };

  /* ---- 4 節: アンテナの傾き ↔ 空の上の利得と、衛星ごとの C/N0 ---- */
  REG.w22_tilt=function(el,U){
    var S=U.S;
    U.head(el,"ANTENNA TILT","アンテナの傾き — 空の上の利得と、衛星ごとの C/N0");
    var r1=U.ctrls(el);
    var ch=U.slider(r1,"傾き χ（図の金の + をドラッグしてもよい）",{min:0,max:180,step:1,value:0,fmt:function(v){return Math.round(v)+"°";},onInput:function(){draw();}});
    var at=U.slider(r1,"傾ける向き α<sub>t</sub>",{min:0,max:359,step:1,value:180,fmt:function(v){return Math.round(v)+"°（"+["北","北東","東","南東","南","南西","西","北西"][Math.round(v/45)%8]+"）";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var att=U.slider(r2,"周りで弱まる量（木の葉など。全部の衛星）",{min:0,max:20,step:1,value:0,fmt:function(v){return v+" dB";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（水平）",function(){ch.set(0);at.set(180);att.set(0);draw();});
    U.button(br,"南へ 60°",function(){ch.set(60);at.set(180);draw();});
    U.button(br,"南へ 90°（北の壁に掛ける）",function(){ch.set(90);at.set(180);draw();});
    U.button(br,"逆さま（180°）",function(){ch.set(180);draw();});
    U.button(br,"ドローン（東へ 25°）",function(){ch.set(25);at.set(90);draw();});
    var box=U.svgbox(el),ro=U.readout(el),GEO={cx:0,cy:0,R:1},sats=_w22_sats(U,0,["GPS"]);
    U.ctl.drag(box,function(type,x,y){if(type==="up")return;var dx=x-GEO.cx,dy=y-GEO.cy,rr=Math.hypot(dx,dy);if(type==="down"&&rr>GEO.R+10)return false;
      var e=Math.max(0,90*(1-Math.min(rr,GEO.R)/GEO.R));ch.set(Math.round(90-e));if(rr>3)at.set(Math.round(((Math.atan2(dx,-dy)/_W22_D)+360)%360));draw();});
    function draw(){
      var nar=_w22_nar(box),Wd=nar?400:700,o=[],chi=ch.get(),az0=at.get(),a=att.get(),i,j;
      /* (a) スカイプロットと利得の分布 */
      var cx=nar?200:170,cy=nar?166:176,R=nar?116:128;GEO={cx:cx,cy:cy,R:R};
      o.push(S.T(nar?10:14,18,"(a) 空の上の利得（金の + が真上の向き）","start",11,"ink",true));
      o.push(U.gnss.sky(U,cx,cy,R,[],{}));
      /* 利得の帯: 地板の裏（赤）と、0 dBi より低い所（薄い金） */
      var cells={b:[],l:[]};
      for(i=0;i<72;i++)for(j=0;j<30;j++){var az=i*5+2.5,e=j*3+1.5,ea=_w22_ela(e,az,chi,az0),key=ea<0?"b":(_w22_gr(ea)<0?"l":null);
        if(!key)continue;var p1=U.gnss.skyxy(cx,cy,R,j*3,i*5),p2=U.gnss.skyxy(cx,cy,R,j*3,i*5+5),p3=U.gnss.skyxy(cx,cy,R,j*3+3,i*5+5),p4=U.gnss.skyxy(cx,cy,R,j*3+3,i*5);
        cells[key].push("M"+p1[0].toFixed(1)+" "+p1[1].toFixed(1)+"L"+p2[0].toFixed(1)+" "+p2[1].toFixed(1)+"L"+p3[0].toFixed(1)+" "+p3[1].toFixed(1)+"L"+p4[0].toFixed(1)+" "+p4[1].toFixed(1)+"Z");}
      o.push('<path d="'+cells.l.join("")+'" fill="var(--gold-soft)" fill-opacity="0.75" stroke="none"/>');
      o.push('<path d="'+cells.b.join("")+'" fill="var(--alias-soft)" fill-opacity="0.9" stroke="none"/>');
      o.push(U.gnss.sky(U,cx,cy,R,[],{}).replace(/<circle[^>]*fill="var\(--screen\)"[^>]*\/>/,""));
      if(chi<=90){var bp=U.gnss.skyxy(cx,cy,R,90-chi,az0);o.push(S.L(bp[0]-7,bp[1],bp[0]+7,bp[1],"gold",2.6));o.push(S.L(bp[0],bp[1]-7,bp[0],bp[1]+7,"gold",2.6));}
      else o.push(S.T(cx,cy+R+30,"真上の向きは地平線より下","middle",9.5,"gold",true));
      var vals=sats.map(function(q){var ea=_w22_ela(q.el,q.az,chi,az0),g=_w22_gr(ea),g0=_w22_gr(q.el);return {q:q,ea:ea,c:_w22_cn0(q.el,g)-a,c0:_w22_cn0(q.el,g0)-a};});
      vals.forEach(function(v){var p=U.gnss.skyxy(cx,cy,R,v.q.el,v.q.az),c=_w22_cncol(v.c);o.push(S.D(p[0],p[1],c,4.6));o.push(S.T(p[0]+7,p[1]+3.5,v.q.nm,"start",9.5,c,true,false,null,true));});
      o.push(S.RECT(nar?14:20,cy+R+40,12,11,2,"var(--alias-soft)","alias",1));o.push(S.T((nar?14:20)+18,cy+R+50,"地板の裏","start",9.5,"muted"));
      o.push(S.RECT((nar?14:20)+90,cy+R+40,12,11,2,"var(--gold-soft)","gold",1));o.push(S.T((nar?14:20)+108,cy+R+50,"利得 0 dBi 未満","start",9.5,"muted"));
      /* (b) 衛星ごとの C/N0 */
      var bx=nar?60:420,by=nar?cy+R+84:44,bw=nar?320:250,bh=8*24;
      o.push(S.T(nar?10:bx-40,by-14,"(b) 衛星ごとの C/N0 [dB-Hz]","start",11,"ink",true));
      var P=U.plot(bx,by,bw,bh,[10,55],[0,1]);
      [10,20,30,40,50].forEach(function(v){o.push(S.L(P.X(v),by,P.X(v),by+bh,"grid",1));o.push(S.T(P.X(v),by+bh+14,String(v),"middle",9,"muted"));});
      o.push(S.L(P.X(35),by,P.X(35),by+bh,"green",1.2,"4 3"));o.push(S.L(P.X(25),by,P.X(25),by+bh,"gold",1.2,"4 3"));
      o.push(S.T(P.X(35)+3,by+bh+28,"捕捉 35","start",9,"green",true));o.push(S.T(P.X(25)-3,by+bh+28,"追尾 25","end",9,"gold",true));
      vals.forEach(function(v,k){var y=by+k*24+4,c=_w22_cncol(v.c);
        o.push(S.T(bx-6,y+12,v.q.nm,"end",9.5,"ink",true));
        o.push(S.RECT(P.X(10),y,Math.max(0,P.X(Math.max(10,Math.min(55,v.c0)))-P.X(10)),16,2,"none","muted",1,"3 2"));
        o.push(S.RECT(P.X(10),y+3,Math.max(0,P.X(Math.max(10,Math.min(55,v.c)))-P.X(10)),10,2,U.soft(c),c,1.2));
        o.push(S.T(Math.min(P.X(55)-2,P.X(Math.max(10,Math.min(55,v.c)))+4),y+12,_w22_f(v.c,1),"start",9,c,true,false,null,true));});
      o.push(S.T(bx,by+bh+44,"破線の枠: 同じ所に水平に置いたとき","start",9.5,"muted"));
      var hgt=nar?by+bh+56:Math.max(cy+R+60,by+bh+56);
      box.set(S.svg(Wd,hgt,o));
      /* 読み出し */
      var n35=vals.filter(function(v){return v.c>=35;}),n25=vals.filter(function(v){return v.c>=25;}),d35=_w22_dop(U,n35.map(function(v){return v.q;}));
      var h="35 dB-Hz 以上（捕捉の目安）<b>"+n35.length+"</b> つ: "+(d35?"HDOP <b>"+_w22_f(d35.H,2)+"</b>":'<span class="warn">解けない</span>')+"、25 dB-Hz 以上（追尾の目安）<b>"+n25.length+"</b> つ<br>";
      var worst=vals.slice().sort(function(p,q){return (p.c-p.c0)-(q.c-q.c0);})[0];
      if(worst.c-worst.c0>-0.05)h+="傾けたことによる C/N0 の下がりは無い";
      else h+="傾けたことで最も下がった衛星: "+worst.q.nm+"（仰角 "+_w22_f(worst.q.el,1)+"°、アンテナから見た仰角 θ<sub>a</sub> = "+_w22_f(worst.ea,1)+"°）で "+_w22_f(worst.c-worst.c0,1)+" dB";
      if(a>0)h+="。このほかに、周りの弱まり "+a+" dB で全部の衛星が同じだけ下がる";
      ro.innerHTML=h+'<div class="wnote">東京の 8 つの GPS の衛星（時刻 0）。利得は 8 章の例のアンテナの右旋の利得（方位によらない）、C/N0 は 3 章 3 節のモデル（EIRP 26.4 dBW、雑音は 290 K の熱雑音だけ）。目安は 3 章 6 節の代表値。</div>';
    }
    draw();
  };
