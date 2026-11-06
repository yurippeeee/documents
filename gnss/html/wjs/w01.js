  /* ===== 01 章 GNSS とは何か ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w01_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w01_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた数（20 189.3 など） */
  function _w01_g(v,d){var s=_w01_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  var _W01_C=299792458,_W01_D=Math.PI/180,_W01_CID=0;
  /* 枠 (x, y, w, h) の外を切って描く */
  function _w01_clip(x,y,w,h,body){var id="w01cp"+(++_W01_CID);return '<clipPath id="'+id+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/></clipPath><g clip-path="url(#'+id+')">'+body+'</g>';}
  /* 衛星の印（図と同じ見た目）・受信機の印・× 印 */
  function _w01_sat(U,x,y,c,s){var S=U.S;s=s||1;return S.L(x-9*s,y,x+9*s,y,c,1.1)+S.RECT(x-14*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x+7.5*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x-3.6*s,y-3.6*s,7.2*s,7.2*s,1.5,c,c,1);}
  function _w01_rx(U,x,y,c){var S=U.S;c=c||"green";return S.L(x-6,y+6,x+6,y+6,c,1.6)+S.L(x,y+6,x,y,c,1.4)+S.D(x,y-1,c,3.4);}
  /* 2 つの円の交わる点（0 個か 2 個） */
  function _w01_cc(p0,r0,p1,r1){var dx=p1[0]-p0[0],dy=p1[1]-p0[1],d=Math.hypot(dx,dy);if(d<1e-9||r0<0||r1<0)return [];var a=(r0*r0-r1*r1+d*d)/(2*d),h2=r0*r0-a*a;if(h2<0)return [];var h=Math.sqrt(h2),mx=p0[0]+a*dx/d,my=p0[1]+a*dy/d;return [[mx-h*dy/d,my+h*dx/d],[mx+h*dy/d,my-h*dx/d]];}
  /* 平面の座標系の格子（step km ごと） */
  function _w01_grid(U,P,step){var S=U.S,o=[],v;for(v=Math.ceil(P.xr[0]/step)*step;v<=P.xr[1]+1e-9;v+=step)o.push(S.L(P.X(v),P.y,P.X(v),P.y+P.h,"grid",1));for(v=Math.ceil(P.yr[0]/step)*step;v<=P.yr[1]+1e-9;v+=step)o.push(S.L(P.x,P.Y(v),P.x+P.w,P.Y(v),"grid",1));return o.join("");}
  /* |測った距離 − 点までの距離| ≤ sig をすべての点で満たす範囲（格子で調べる）。返り値 {runs, area, diam} */
  function _w01_region(S,rho,sig,xr,yr,step){var runs=[],cnt=0,nd=36,mn=[],mx=[],k,dirs=[];
    for(k=0;k<nd;k++){dirs.push([Math.cos(Math.PI*k/nd),Math.sin(Math.PI*k/nd)]);mn.push(Infinity);mx.push(-Infinity);}
    for(var y=yr[0];y<=yr[1]+1e-9;y+=step){var x0=null,xl=null;
      for(var x=xr[0];x<=xr[1]+1e-9;x+=step){var ok=true;for(var i=0;i<S.length&&ok;i++){if(Math.abs(Math.hypot(x-S[i][0],y-S[i][1])-rho[i])>sig)ok=false;}
        if(ok){cnt++;if(x0===null)x0=x;xl=x;for(k=0;k<nd;k++){var pr=x*dirs[k][0]+y*dirs[k][1];if(pr<mn[k])mn[k]=pr;if(pr>mx[k])mx[k]=pr;}}
        else if(x0!==null){runs.push([y,x0,xl]);x0=null;}}
      if(x0!==null)runs.push([y,x0,xl]);}
    var diam=0;for(k=0;k<nd;k++)if(isFinite(mn[k]))diam=Math.max(diam,mx[k]-mn[k]);
    return {runs:runs,area:cnt*step*step,diam:cnt?diam+step:0};}
  /* 受信機（原点とは限らない）から見た点の向きの広がり（全部の向きを含む最も小さい角）[°] */
  function _w01_spread(S,R){var a=S.map(function(s){return (Math.atan2(s[1]-R[1],s[0]-R[0])/_W01_D+360)%360;}).sort(function(p,q){return p-q;});
    if(a.length<2)return 0;var gap=0;for(var i=0;i<a.length;i++){var g=(i+1<a.length?a[i+1]:a[0]+360)-a[i];gap=Math.max(gap,g);}return 360-gap;}
  /* 選んだ点を、ドラッグの代わりにスライダーで動かす部品（スマートフォン用） */
  function _w01_mover(U,row,names,get,set,lim,redraw){
    var sel=U.select(row,"スライダーで動かす点",names,0,function(){sync();});
    var sx=U.slider(row,"x",{min:lim[0],max:lim[1],step:0.1,value:0,fmt:function(v){return _w01_f(v,1)+" km";},onInput:function(v){var p=get(sel.get());set(sel.get(),[v,p[1]]);redraw();}});
    var sy=U.slider(row,"y",{min:lim[2],max:lim[3],step:0.1,value:0,fmt:function(v){return _w01_f(v,1)+" km";},onInput:function(v){var p=get(sel.get());set(sel.get(),[p[0],v]);redraw();}});
    function sync(){var p=get(sel.get());sx.set(p[0]);sy.set(p[1]);}
    sync();return {sync:sync};}

  /* ---- 1 節: 平面の三辺測量（円の交わり・誤差の三角形・帯の重なり） ---- */
  var _W01_S0=[[-12,9],[5,12],[15,8]],_W01_SB=[[-4,16.5],[0,17],[4,16.5]],_W01_U0=[0.6,-0.4,0.5];
  REG.w01_trilat=function(el,U){
    var S=U.S;
    U.head(el,"TRILATERATION","平面の三辺測量 — 距離の円の交わりと、誤差の広がり");
    var r1=U.ctrls(el);
    var nsat=U.seg(r1,["点 1 つ","点 2 つ","点 3 つ"],2,function(){draw();});
    var sg=U.slider(r1,"距離の誤差の大きさ（最大）",{values:[0,0.25,0.5,1,1.5,2],value:1,fmt:function(v){return "±"+v+" km";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var band=U.checkbox(r2,"誤差の幅の帯と、その重なりを描く",true,function(){draw();});
    var tru=U.checkbox(r2,"本当の距離の円（破線）",false,function(){draw();});
    var br=U.btnrow(el);
    var sats,rx,seed=0;
    function reset(lay){sats=(lay?_W01_SB:_W01_S0).map(function(p){return p.slice();});rx=[0,0];}
    function errs(){if(seed===0)return _W01_U0.slice();var g=U.rng(seed*7919+3);return [0,1,2].map(function(){return 2*g.next()-1;});}
    U.button(br,"本文の例（広がった配置）",function(){reset(0);nsat.set(2);sg.set(1);seed=0;band.set(true);tru.set(false);mv.sync();draw();});
    U.button(br,"偏った配置",function(){reset(1);nsat.set(2);mv.sync();draw();});
    U.button(br,"別の誤差（乱数を変える）",function(){seed++;draw();});
    var r3=U.ctrls(el);
    var box=U.svgbox(el),ro=U.readout(el),MP=null,drag=-1;
    reset(0);
    var mv=_w01_mover(U,r3,["S1","S2","S3","受信機"],function(k){return k<3?sats[k]:rx;},function(k,p){if(k<3)sats[k]=p;else rx=p;},[-20,20,-9,24],draw);
    U.ctl.drag(box,function(type,x,y){
      if(!MP)return false;
      if(type==="down"){var best=-1,bd=16,n=nsat.get()+1;for(var k=0;k<4;k++){if(k<3&&k>=n)continue;var p=k<3?sats[k]:rx,d=Math.hypot(MP.X(p[0])-x,MP.Y(p[1])-y);if(d<bd){bd=d;best=k;}}drag=best;return best>=0?undefined:false;}
      if(type==="up"){drag=-1;mv.sync();return;}
      if(drag<0||x==null)return;var q=[Math.max(-20,Math.min(20,MP.ux(x))),Math.max(-9,Math.min(24,MP.uy(y)))];q=[Math.round(q[0]*10)/10,Math.round(q[1]*10)/10];
      if(drag<3)sats[drag]=q;else rx=q;draw();});
    function draw(){
      var n=nsat.get()+1,sig=sg.get(),u=errs(),Su=sats.slice(0,n),i;
      var r=Su.map(function(s){return Math.hypot(s[0]-rx[0],s[1]-rx[1]);}),e=u.slice(0,n).map(function(v){return v*sig;}),rho=r.map(function(v,k){return v+e[k];});
      var nar=_w01_nar(box),Wd=nar?400:700,o=[];
      var P=nar?U.plot(34,24,350,292,[-21,21],[-10,25]):U.plot(40,24,420,350,[-21,21],[-10,25]);MP=P;var k=P.w/42;
      o.push(S.T(P.x,16,"平面（単位 km）。点と受信機はドラッグで動かせる","start",10,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,4,"var(--screen)","line",1));
      var body=_w01_grid(U,P,5);
      /* 帯と重なり */
      var reg=null,Z=Math.max(2.5,5*Math.max(sig,0.25));
      if(sig>0&&band.get()){
        Su.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),rho[j]*k,"var(--signal-soft)",2*sig*k);});
        var st=Math.max(0.04,sig/30);reg=_w01_region(Su,rho,sig,[rx[0]-Math.max(Z,12*sig),rx[0]+Math.max(Z,12*sig)],[rx[1]-Math.max(Z,12*sig),rx[1]+Math.max(Z,12*sig)],st);
        if(n<3)reg.diam=NaN;
        reg.runs.forEach(function(q){body+=S.RECT(P.X(q[1]-st/2),P.Y(q[0]+st/2),Math.max(1,(q[2]-q[1]+st)*k),st*k+0.5,0,"gold","none",0,null,' fill-opacity="0.55"');});}
      if(tru.get())Su.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),r[j]*k,"green",1,null,"4 3");});
      Su.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),Math.max(0,rho[j])*k,n===1?"gold":"signal",1.6);});
      o.push(_w01_clip(P.x,P.y,P.w,P.h,body));
      /* 交わる点 */
      var tri=[],cand=[];
      if(n===2){cand=_w01_cc(Su[0],rho[0],Su[1],rho[1]);cand.forEach(function(c){if(c[0]>=-21&&c[0]<=21&&c[1]>=-10&&c[1]<=25)o.push(S.D(P.X(c[0]),P.Y(c[1]),"gold",4.6));});}
      if(n===3){[[0,1],[1,2],[0,2]].forEach(function(pq){var cs=_w01_cc(Su[pq[0]],rho[pq[0]],Su[pq[1]],rho[pq[1]]);if(cs.length){cs.sort(function(a,b){return Math.hypot(a[0]-rx[0],a[1]-rx[1])-Math.hypot(b[0]-rx[0],b[1]-rx[1]);});tri.push(cs[0]);}});
        if(tri.length===3)o.push(S.PL(tri.concat([tri[0]]).map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"gold",1.3,"var(--gold-soft)"));
        tri.forEach(function(q){o.push(S.D(P.X(q[0]),P.Y(q[1]),"gold",3.4));});}
      Su.forEach(function(s,j){o.push(_w01_sat(U,P.X(s[0]),P.Y(s[1]),"signal",0.85));o.push(S.T(P.X(s[0]),P.Y(s[1])-9,"S"+(j+1),"middle",10,"signal",true,false,null,true));});
      o.push(_w01_rx(U,P.X(rx[0]),P.Y(rx[1])));
      /* 拡大の枠（受信機のまわり） */
      var Q=nar?U.plot(100,P.y+P.h+40,200,200,[rx[0]-Z,rx[0]+Z],[rx[1]-Z,rx[1]+Z]):U.plot(480,52,206,206,[rx[0]-Z,rx[0]+Z],[rx[1]-Z,rx[1]+Z]),kq=Q.w/(2*Z);
      o.push(S.T(Q.x,Q.y-8,"受信機のまわりを拡大（±"+_w01_f(Z,1)+" km）","start",10,"ink",true));
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,4,"var(--screen)","line",1));
      var zb=_w01_grid(U,Q,Z>6?2:1);
      if(reg){Su.forEach(function(s,j){zb+=S.CIRC(Q.X(s[0]),Q.Y(s[1]),rho[j]*kq,"var(--signal-soft)",2*sig*kq);});
        var st2=Math.max(0.04,sig/30);reg.runs.forEach(function(q){zb+=S.RECT(Q.X(q[1]-st2/2),Q.Y(q[0]+st2/2),Math.max(1,(q[2]-q[1]+st2)*kq),st2*kq+0.5,0,"gold","none",0,null,' fill-opacity="0.55"');});}
      if(tru.get())Su.forEach(function(s,j){zb+=S.CIRC(Q.X(s[0]),Q.Y(s[1]),r[j]*kq,"green",1,null,"4 3");});
      Su.forEach(function(s,j){zb+=S.CIRC(Q.X(s[0]),Q.Y(s[1]),Math.max(0,rho[j])*kq,n===1?"gold":"signal",1.6);});
      if(tri.length===3)zb+=S.PL(tri.concat([tri[0]]).map(function(q){return [Q.X(q[0]),Q.Y(q[1])];}),"gold",1.3,"var(--gold-soft)");
      tri.forEach(function(q){zb+=S.D(Q.X(q[0]),Q.Y(q[1]),"gold",3.4);});
      cand.forEach(function(c){zb+=S.D(Q.X(c[0]),Q.Y(c[1]),"gold",4.6);});
      o.push(_w01_clip(Q.x,Q.y,Q.w,Q.h,zb));
      o.push(_w01_rx(U,Q.X(rx[0]),Q.Y(rx[1])));
      var ly=Q.y+Q.h+22;
      o.push(S.LEGL(Q.x-(nar?60:0),ly,[["signal",null,"測った距離の円"],["green",null,"受信機"]],9.5,12));
      o.push(S.RECT(Q.x-(nar?60:0),ly+10,12,11,2,"gold","none",0,null,' fill-opacity="0.55"'));
      o.push(S.T(Q.x-(nar?60:0)+18,ly+19,"いるかもしれない範囲（帯の重なり）","start",9.5,"muted"));
      box.set(S.svg(Wd,nar?ly+30:Math.max(P.y+P.h+12,ly+30),o));
      /* 読み出し */
      var h="",sp=_w01_spread(Su,rx);
      h+=Su.map(function(s,j){return "S"+(j+1)+": 本当の距離 "+_w01_f(r[j],2)+" km、測った距離 <b>"+_w01_f(rho[j],2)+" km</b>（誤差 "+(e[j]>=0?"+":"")+_w01_f(e[j],2)+" km）";}).join("<br>")+"<br>";
      if(n===1)h+='受信機は、S1 を中心とする半径 '+_w01_f(rho[0],2)+' km の円の上のどこかにいる（1 点に決まらない）<br>';
      if(n===2){if(cand.length===2){var dd=Math.hypot(cand[0][0]-cand[1][0],cand[0][1]-cand[1][1]);h+="候補は 2 つ: ("+_w01_f(cand[0][0],2)+", "+_w01_f(cand[0][1],2)+") と ("+_w01_f(cand[1][0],2)+", "+_w01_f(cand[1][1],2)+")。2 つの間は "+_w01_f(dd,1)+" km（S1 と S2 を結ぶ直線について対称）<br>";}
        else h+='<span class="warn">2 つの円が交わらない</span>（誤差が大きいか、点が近すぎる）<br>';}
      if(n===3){if(tri.length===3){var sd=[0,1,2].map(function(m){return Math.hypot(tri[m][0]-tri[(m+1)%3][0],tri[m][1]-tri[(m+1)%3][1]);}),mxs=Math.max.apply(null,sd);
          h+=(mxs<0.01?'<span class="ok">3 つの円が 1 点で交わる</span>: ('+_w01_f(tri[0][0],2)+", "+_w01_f(tri[0][1],2)+")":"3 つの円は 1 点で交わらず、交わる点が三角形をつくる。三角形の辺 <b>"+_w01_f(Math.min.apply(null,sd),1)+"〜"+_w01_f(mxs,1)+" km</b>")+"<br>";}
        else h+='<span class="warn">交わらない円の組がある</span><br>';}
      if(reg&&n===3)h+="帯の重なり（受信機のいるかもしれない範囲）: 差し渡し <b>"+_w01_f(reg.diam,1)+" km</b>、面積 "+_w01_f(reg.area,1)+" km²<br>";
      if(n===3&&sig>0){var r0=_w01_region(Su,r,sig,[rx[0]-12*sig-2,rx[0]+12*sig+2],[rx[1]-12*sig-2,rx[1]+12*sig+2],Math.max(0.03,sig/40));
        h+="誤差が 0 のときの帯（本当の距離 ± "+sig+" km）の重なりの差し渡し: <b>"+_w01_f(r0.diam,1)+" km</b>（誤差の幅 "+_w01_f(2*sig,1)+" km の "+_w01_f(r0.diam/(2*sig),2)+" 倍）<br>";}
      if(n>=2)h+="受信機から見た点の向きの広がり: "+_w01_f(sp,0)+"°"+(sp<45?'（<span class="warn">偏っている</span>。重なりが細長く大きくなる）':"")+"<br>";
      ro.innerHTML=h+'<div class="wnote">誤差は、点ごとに「大きさ（最大）× −1〜1 の数」で決める。本文の例は ±1 km で +0.6・−0.4・+0.5 km（本文の図と同じ）、「別の誤差」で −1〜1 の数を乱数で選び直す。帯は「測った距離 ± 誤差の大きさ」で、誤差が大きさ以内なら、受信機は必ず帯の重なりの中にいる。</div>';
    }
    draw();
  };

  /* ---- 2 節: 電波の届く時間と、2 つの時計（地球と軌道の大きさの比は実際のとおり） ---- */
  var _W01_RE=6371e3,_W01_AG=26560e3;
  function _w01_distel(el){var t=el*_W01_D;return -_W01_RE*Math.sin(t)+Math.sqrt(_W01_AG*_W01_AG-Math.pow(_W01_RE*Math.cos(t),2));}
  function _w01_tstr(s){var a=Math.abs(s),g=s<0?"−":"+";if(a===0)return "0";function q(v){return String(+v.toPrecision(2));}if(a<1e-6)return g+q(a*1e9)+" ns";if(a<1e-3)return g+q(a*1e6)+" μs";return g+q(a*1e3)+" ms";}
  REG.w01_tof=function(el,U){
    var S=U.S;
    U.head(el,"TIME OF FLIGHT","電波の届く時間と距離 — 衛星の時計と受信機の時計");
    var r1=U.ctrls(el);
    var ang=U.slider(r1,"衛星の見える高さ（地平線からの角度）",{min:0,max:90,step:1,value:90,fmt:function(v){return v+"°";},onInput:function(){tnow=-1;draw();}});
    var dts=[-1e-3,-1e-4,-1e-5,-1e-6,-1e-7,-1e-8,-1e-9,0,1e-9,1e-8,1e-7,1e-6,1e-5,1e-4,1e-3];
    var off=U.slider(r1,"受信機の時計のずれ δt<sub>r</sub>",{values:dts,value:1e-6,fmt:function(v){return _w01_tstr(v)+(v>0?"（進んでいる）":(v<0?"（遅れている）":""));},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var tnow=-1,tick=U.ticker(function(){var T=_w01_distel(ang.get())/_W01_C;tnow+=0.0016;if(tnow>=T){tnow=T;tick.stop();}draw();},40);
    U.button(br,"再生（電波を送る）",function(){tnow=0;tick.start();draw();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"本文の例（真上の衛星・ずれ +1 μs）",function(){tick.stop();ang.set(90);off.set(1e-6);tnow=-1;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var th=ang.get(),d=_w01_distel(th),T=d/_W01_C,dt=off.get(),done=tnow<0||tnow>=T-1e-12,tn=tnow<0?T:tnow;
      var nar=_w01_nar(box),Wd=nar?400:700,o=[];
      /* 左（狭い画面では上）: 地球と軌道 */
      var sc=(nar?250:300)/36000e3,ox=nar?96:112,oy=46+27500e3*sc,X=function(x){return ox+x*sc;},Y=function(y){return oy-y*sc;};
      o.push(S.T(nar?8:14,16,"地球と GPS の軌道（大きさの比は実際のとおり）","start",10,"ink",true));
      var g=S.CIRC(ox,oy,_W01_AG*sc,"signal",1.1,null,"5 4")+S.CIRC(ox,oy,_W01_RE*sc,"green",1.4,"var(--green-soft)");
      var t=th*_W01_D,sx=d*Math.cos(t),sy=_W01_RE+d*Math.sin(t),rxx=X(0),rxy=Y(_W01_RE);
      g+=S.L(rxx,rxy,X(sx),Y(sy),"muted",1,"3 3");
      if(tnow>=0){var f=Math.min(1,tn/T),px=X(sx)+(rxx-X(sx))*f,py=Y(sy)+(rxy-Y(sy))*f;g+=S.L(X(sx),Y(sy),px,py,"signal",2.4);g+=S.CIRC(px,py,6,"signal",2,"var(--signal-soft)");}
      o.push(_w01_clip(4,24,nar?392:340,(nar?278:322),g));
      o.push(_w01_sat(U,X(sx),Y(sy),"signal",0.85));
      o.push(_w01_rx(U,rxx,rxy-4));
      o.push(S.T(X(sx)+(th>60?10:-6),Y(sy)-10,"衛星（原子時計）","middle",9.5,"signal",true,false,null,true));
      o.push(S.T(rxx-8,rxy-6,"受信機","end",9.5,"green",true,false,null,true));
      o.push(S.T(X(0),Y(-1500e3),"地球","middle",9.5,"green",true));
      /* 右（狭い画面では下）: 2 つの時間の軸 */
      var tx=nar?40:368,ty=nar?(oy+_W01_RE*sc+30):48,tw=nar?330:300,P=U.plot(tx,ty,tw,10,[0,90],[0,1]);
      o.push(S.T(tx-(nar?30:0),ty-12,"時間の軸（0〜90 ms）","start",10,"ink",true));
      var a1=ty+22,a2=ty+76;
      o.push(S.ARR(tx,a1,tx+tw+10,a1,"green",1.2,6));o.push(S.T(tx+tw+10,a1-6,"基準の時刻","end",9.5,"green",true));
      o.push(S.ARR(tx,a2,tx+tw+10,a2,"alias",1.2,6));o.push(S.T(tx+tw+10,a2-6,"受信機の時計","end",9.5,"alias",true));
      [0,30,60,90].forEach(function(v){o.push(S.L(P.X(v),a1,P.X(v),a1+4,"muted",1));o.push(S.T(P.X(v),a1+15,v+" ms","middle",9.5,"muted"));});
      o.push(S.L(P.X(0),a1-7,P.X(0),a1+7,"ink",1.6));o.push(S.T(P.X(0)+3,a1-9,"送信","start",9.5,"ink",true));
      var tms=T*1e3;
      o.push(S.L(P.X(tms),a1-7,P.X(tms),a1+7,"ink",1.6));o.push(S.T(P.X(tms),a1-9,"到着 "+_w01_f(tms,2)+" ms","middle",9.5,"ink",true,false,null,true));
      if(tnow>=0&&!done)o.push(S.D(P.X(tn*1e3),a1,"signal",5));
      var rd=(tn+dt)*1e3;
      o.push(S.L(P.X(tms),a1+8,P.X(tms),a2,"faint",1,"3 3"));
      if(done){o.push(S.L(P.X(Math.max(0,Math.min(90,rd))),a2-7,P.X(Math.max(0,Math.min(90,rd))),a2+7,"alias",1.8));o.push(S.T(P.X(Math.max(0,Math.min(90,rd))),a2+17,"読み "+_w01_f(rd,4)+" ms","middle",9.5,"alias",true,false,null,true));}
      /* 到着のまわりの拡大 */
      var zw=Math.max(Math.abs(dt)*2.4,2e-9),zy=a2+48,Z=U.plot(tx,zy,tw,10,[-zw,zw],[0,1]);
      o.push(S.T(tx-(nar?30:0),zy-10,"到着のまわりを拡大（±"+_w01_tstr(zw).replace("+","")+"）","start",10,"ink",true));
      o.push(S.L(tx,zy+8,tx+tw,zy+8,"muted",1.2));
      o.push(S.L(Z.X(0),zy-2,Z.X(0),zy+18,"green",2));o.push(S.T(Z.X(0),zy+32,"本当の到着","middle",9.5,"green",true,false,null,true));
      if(done&&dt!==0){o.push(S.L(Z.X(dt),zy-2,Z.X(dt),zy+18,"alias",2));o.push(S.T(Z.X(dt),zy+46,"受信機の読み","middle",9.5,"alias",true,false,null,true));
        o.push(S.DARR(Z.X(0),zy+3,Z.X(dt),zy+3,"alias",1.2,5));}
      var Hh=nar?zy+58:Math.max(oy+_W01_RE*sc+20,zy+58);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var dm=_W01_C*(T+dt);
      var h="衛星までの距離 <b>"+_w01_g(d/1e3,1)+" km</b>、電波の届く時間 <b>"+_w01_f(T*1e3,3)+" ms</b>（距離 ÷ 光の速さ 299 792 458 m/s）<br>";
      if(!done)h+="電波が進んでいる途中: 送ってから "+_w01_f(tn*1e3,2)+" ms、残り "+_w01_g((d-_W01_C*tn)/1e3,0)+" km<br>";
      else{h+="受信機の時計の読み: 送信 0 ms の電波が "+_w01_f((T+dt)*1e3,6)+" ms に届いたと読む（時計のずれ "+_w01_tstr(dt).replace("+","＋")+"）<br>";
        h+="受信機が求める距離 = 光の速さ × "+_w01_f((T+dt)*1e3,6)+" ms = <b>"+_w01_g(dm/1e3,3)+" km</b>、本当の距離との差 <b>"+(dt>=0?"+":"−")+_w01_g(Math.abs(_W01_C*dt),dt===0?0:(Math.abs(_W01_C*dt)<10?2:1))+" m</b>（= 光の速さ × 時計のずれ）";}
      ro.innerHTML=h+'<div class="wnote">地球の半径 6 371 km、GPS の軌道の半径 26 560 km の円で計算した。衛星の時計は正しいとし、受信機の時計だけがずれているとした。「再生」では、電波の進み方を実際の約 25 分の 1 の速さにして描く（67 ms が約 1.7 s）。</div>';
    }
    draw();
  };

  /* ---- 3 節: 受信機の時計のずれ（平面の例。擬似距離の円が一斉に膨らむ） ---- */
  var _W01_S4=[-5,12],_W01_E4=[0.3,-0.2,0.25,-0.3];
  /* 仮に置いたずれ bh のとき、円 |p − S_i| = ρ_i − bh のどれにも近い点 p と、円とのずれ（2 乗の平均の平方根）。ガウス・ニュートン法 */
  function _w01_fitp(S,rho,bh,p0){var p=p0.slice(),it,i;for(it=0;it<30;it++){var a11=0,a12=0,a22=0,g1=0,g2=0;
      for(i=0;i<S.length;i++){var dx=p[0]-S[i][0],dy=p[1]-S[i][1],d=Math.hypot(dx,dy)||1e-9,res=(rho[i]-bh)-d,hx=dx/d,hy=dy/d;a11+=hx*hx;a12+=hx*hy;a22+=hy*hy;g1+=hx*res;g2+=hy*res;}
      var det=a11*a22-a12*a12;if(Math.abs(det)<1e-12)break;var ux=(a22*g1-a12*g2)/det,uy=(a11*g2-a12*g1)/det;p[0]+=ux;p[1]+=uy;if(Math.hypot(ux,uy)<1e-10)break;}
    var ss=0;for(i=0;i<S.length;i++){var r=Math.hypot(p[0]-S[i][0],p[1]-S[i][1])-(rho[i]-bh);ss+=r*r;}return {p:p,m:Math.sqrt(ss/S.length)};}
  /* 位置 (x, y) と b を一緒に求める（衛星が 4 つなら最小二乗。6 章の方法） */
  function _w01_solve3(S,rho,v0){var v=v0.slice(),it,i,j,k;for(it=0;it<40;it++){var A=[[0,0,0],[0,0,0],[0,0,0]],g=[0,0,0];
      for(i=0;i<S.length;i++){var dx=v[0]-S[i][0],dy=v[1]-S[i][1],d=Math.hypot(dx,dy)||1e-9,h=[dx/d,dy/d,1],res=rho[i]-(d+v[2]);for(j=0;j<3;j++){g[j]+=h[j]*res;for(k=0;k<3;k++)A[j][k]+=h[j]*h[k];}}
      var dv=_w01_sol3(A,g);if(!dv)return null;
      v[0]+=dv[0];v[1]+=dv[1];v[2]+=dv[2];if(Math.hypot(dv[0],dv[1],dv[2])<1e-11)break;}
    return v.every(isFinite)?v:null;}
  /* 3 行 3 列の連立 1 次方程式 A x = g（クラメルの公式） */
  function _w01_sol3(A,g){function det(M){return M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);}
    var D=det(A);if(Math.abs(D)<1e-14)return null;return [0,1,2].map(function(c){var M=A.map(function(r,i){return r.map(function(x,j){return j===c?g[i]:x;});});return det(M)/D;});}
  REG.w01_clock=function(el,U){
    var S=U.S;
    U.head(el,"CLOCK BIAS","受信機の時計のずれ — 擬似距離の円は一斉に膨らむ");
    var r1=U.ctrls(el);
    var dts=U.slider(r1,"受信機の時計のずれ δt<sub>r</sub>",{min:-20,max:20,step:0.5,value:10,fmt:function(v){return (v>0?"+":"")+_w01_f(v,1)+" μs（b = "+_w01_f(_W01_C*v*1e-6/1e3,2)+" km）";},onInput:function(){solved=null;draw();}});
    var bh=U.slider(r1,"仮に置くずれ b̂",{min:-6,max:10,step:0.05,value:0,fmt:function(v){return _w01_f(v,2)+" km";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var cTru=U.checkbox(r2,"本当の距離の円（緑の破線）",true,function(){draw();});
    var cHyp=U.checkbox(r2,"双曲線（b̂ を変えたときの、交わる点の道）",false,function(){draw();});
    var c4=U.checkbox(r2,"4 つ目の衛星 S4 も使う",false,function(){solved=null;draw();});
    var cErr=U.checkbox(r2,"擬似距離に誤差を足す（最大 ±0.3 km）",false,function(){solved=null;draw();});
    var br=U.btnrow(el);
    var sats,rx,solved=null;
    function reset(){sats=_W01_S0.map(function(p){return p.slice();}).concat([_W01_S4.slice()]);rx=[0,0];}
    function data(){var n=c4.get()?4:3,b=_W01_C*dts.get()*1e-6/1e3,Su=sats.slice(0,n),r=Su.map(function(s){return Math.hypot(s[0]-rx[0],s[1]-rx[1]);});
      return {n:n,b:b,S:Su,r:r,rho:r.map(function(v,i){return v+b+(cErr.get()?_W01_E4[i]:0);})};}
    function solve(){var D=data(),cx=0,cy=0;D.S.forEach(function(s){cx+=s[0]/D.n;cy+=s[1]/D.n;});return _w01_solve3(D.S,D.rho,[cx,cy-15,0]);}
    U.button(br,"ずれを解く（計算機で）",function(){solved=solve();if(solved)bh.set(Math.max(-6,Math.min(10,solved[2])));draw();});
    U.button(br,"本文の例",function(){reset();dts.set(10);bh.set(0);cTru.set(true);cHyp.set(false);c4.set(false);cErr.set(false);solved=null;mv.sync();draw();});
    U.button(br,"b̂ = 3.0 km にする",function(){bh.set(3.0);draw();});
    var r3=U.ctrls(el);
    var box=U.svgbox(el),ro=U.readout(el),MP=null,drag=-1;
    reset();
    var mv=_w01_mover(U,r3,["S1","S2","S3","S4","受信機"],function(k){return k<4?sats[k]:rx;},function(k,p){if(k<4)sats[k]=p;else rx=p;solved=null;},[-20,20,-9,24],function(){draw();});
    U.ctl.drag(box,function(type,x,y){
      if(!MP)return false;
      if(type==="down"){var best=-1,bd=16,n=c4.get()?4:3;for(var k=0;k<5;k++){if(k<4&&k>=n)continue;var p=k<4?sats[k]:rx,d=Math.hypot(MP.X(p[0])-x,MP.Y(p[1])-y);if(d<bd){bd=d;best=k;}}drag=best;return best>=0?undefined:false;}
      if(type==="up"){drag=-1;mv.sync();return;}
      if(drag<0||x==null)return;var q=[Math.round(Math.max(-20,Math.min(20,MP.ux(x)))*10)/10,Math.round(Math.max(-9,Math.min(24,MP.uy(y)))*10)/10];
      if(drag<4)sats[drag]=q;else rx=q;solved=null;draw();});
    function draw(){
      var D=data(),b=D.b,bv=bh.get(),i,nar=_w01_nar(box),Wd=nar?400:700,o=[];
      var P=nar?U.plot(34,24,350,292,[-21,21],[-10,25]):U.plot(40,24,400,333,[-21,21],[-10,25]),k=P.w/42;MP=P;
      o.push(S.T(P.x,16,"平面（単位 km）。衛星と受信機はドラッグで動かせる","start",10,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,4,"var(--screen)","line",1));
      var body=_w01_grid(U,P,5);
      if(cHyp.get()){[[0,1,"purple"],[1,2,"teal"]].forEach(function(q){var a=q[0],c=q[1],dd=Math.hypot(D.S[c][0]-D.S[a][0],D.S[c][1]-D.S[a][1]),bmax=(D.rho[a]+D.rho[c]-dd)/2-1e-9;
        [0,1].forEach(function(sd){var pts=[];for(var j=0;j<=300;j++){var bb=-40+(bmax+40)*j/300,cs=_w01_cc(D.S[a],D.rho[a]-bb,D.S[c],D.rho[c]-bb);if(cs.length)pts.push(cs[sd]);}body+=P.clip(pts,q[2],1.8);});});}
      if(cTru.get())D.S.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),D.r[j]*k,"green",1.1,null,"4 3");});
      D.S.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),Math.max(0,D.rho[j]-bv)*k,"signal",1.7);});
      o.push(_w01_clip(P.x,P.y,P.w,P.h,body));
      /* 2 つずつの円の交わる点（受信機に近い方） */
      var prs=D.n===4?[[0,1],[1,2],[0,2],[2,3],[0,3],[1,3]]:[[0,1],[1,2],[0,2]],cross=[];
      prs.forEach(function(q){var cs=_w01_cc(D.S[q[0]],D.rho[q[0]]-bv,D.S[q[1]],D.rho[q[1]]-bv);if(cs.length){cs.sort(function(a,c){return Math.hypot(a[0]-rx[0],a[1]-rx[1])-Math.hypot(c[0]-rx[0],c[1]-rx[1]);});cross.push(cs[0]);}});
      cross.forEach(function(c){o.push(S.D(P.X(c[0]),P.Y(c[1]),"gold",3.4));});
      D.S.forEach(function(s,j){o.push(_w01_sat(U,P.X(s[0]),P.Y(s[1]),"signal",0.85));o.push(S.T(P.X(s[0]),P.Y(s[1])-9,"S"+(j+1),"middle",10,"signal",true,false,null,true));});
      o.push(_w01_rx(U,P.X(rx[0]),P.Y(rx[1])));
      if(solved){o.push(S.CIRC(P.X(solved[0]),P.Y(solved[1]),8,"gold",2));}
      /* 右（狭い画面では下）: 円のずれと b̂ */
      var cx0=0,cy0=0;D.S.forEach(function(s){cx0+=s[0]/D.n;cy0+=s[1]/D.n;});
      function best(bb,pw){var f1=_w01_fitp(D.S,D.rho,bb,pw),f2=_w01_fitp(D.S,D.rho,bb,[cx0,cy0-15]),f3=_w01_fitp(D.S,D.rho,bb,rx);var f=f1.m<=f2.m?f1:f2;return f3.m<f.m?f3:f;}
      var curve=[],pp=[cx0,cy0-15],mmax=0;for(var j=0;j<=160;j++){var bb=-6+16*j/160,f=best(bb,pp);pp=f.p;curve.push([bb,f.m]);mmax=Math.max(mmax,f.m);}
      var cur=best(bv,[cx0,cy0-15]);
      var ymax=Math.max(0.5,Math.min(8,Math.ceil(mmax*1.1*2)/2));
      var G=nar?U.plot(52,P.y+P.h+46,320,150,[-6,10],[0,ymax]):U.plot(492,52,192,230,[-6,10],[0,ymax]);
      o.push(S.T(G.x-(nar?40:44),G.y-12,"円のずれ（1 点で交わると 0）","start",10,"ink",true));
      o.push(G.axes({xl:"仮に置くずれ b̂ [km]",yl:"円のずれ [km]",xt:[-6,-3,0,3,6,9],yt:U.nice(0,ymax,4).filter(function(v){return v<=ymax+1e-9;}),ylOff:34}));
      o.push(G.line([[b,0],[b,ymax]],"green",1.2,"4 3"));o.push(S.T(G.X(b)+4,G.y+12,"b","start",10,"green",true,false,null,true));
      o.push(G.clip(curve,"purple",2));
      o.push(G.line([[bv,0],[bv,ymax]],"ink",1,"2 3"));o.push(S.D(G.X(bv),G.Y(Math.min(ymax,cur.m)),"gold",5));
      box.set(S.svg(Wd,nar?G.y+G.h+44:Math.max(P.y+P.h+14,G.y+G.h+44),o));
      /* 読み出し */
      var h="b = 光の速さ × 時計のずれ = 299 792 458 m/s × "+_w01_f(dts.get(),1)+" μs = <b>"+_w01_f(b,3)+" km</b><br>";
      h+=D.S.map(function(s,j){return "S"+(j+1)+": 本当の距離 "+_w01_f(D.r[j],2)+" km → 擬似距離 <b>"+_w01_f(D.rho[j],2)+" km</b>"+(cErr.get()?"（誤差 "+(_W01_E4[j]>=0?"+":"")+_W01_E4[j]+" km を含む）":"");}).join("<br>")+"<br>";
      h+="仮に置くずれ b̂ = "+_w01_f(bv,2)+" km で描いた円（半径 ρ<sub>i</sub> − b̂）の、1 点からのずれ <b>"+_w01_f(cur.m,3)+" km</b>"+(cur.m<0.005?'（<span class="ok">1 点で交わる</span>）':"")+"<br>";
      if(solved){var pe=Math.hypot(solved[0]-rx[0],solved[1]-rx[1]);h+="計算機で解いた値: 位置 ("+_w01_f(solved[0],3)+", "+_w01_f(solved[1],3)+") km、b = <b>"+_w01_f(solved[2],3)+" km</b>（時計のずれ "+_w01_f(solved[2]*1e3/_W01_C*1e6,2)+" μs）。本当の位置との差 "+_w01_f(pe,3)+" km"+(cErr.get()&&D.n===4?"（式が未知数より多く、誤差があるので、全部の円を 1 点で交わらせる b̂ は無い。ずれが最も小さい解。6 章）":(cErr.get()?"（3 つなら誤差があっても 1 点で交わる b̂ があるが、その点は本当の位置からずれる）":""))+"<br>";}
      ro.innerHTML=h+'<div class="wnote">衛星の時計は正しいとし、受信機の時計だけがずれているとした。「円のずれ」は、b̂ ごとに、どの円にも最も近い点を探し、その点から各円までの距離を 2 乗して平均した値の平方根である。「ずれを解く」は、位置と b を一緒に求める計算（6 章で扱う方法）を使う。紫の曲線は S1・S2 の組、青緑は S2・S3 の組の双曲線。</div>';
    }
    draw();
  };

  /* ---- 5 節: 衛星の軌道と、スカイプロット（円軌道の近似。f01.py の _f01_const と同じ配置） ---- */
  var _W01_MU=3.986004418e14,_W01_WE=7.2921151467e-5,_W01_AW=6378137,_W01_FW=1/298.257223563,_W01_E2=_W01_FW*(2-_W01_FW),_W01_SID=2*Math.PI/_W01_WE;
  var _W01_SYS={GPS:["GPS","signal","G"],GLONASS:["GLONASS","purple","R"],Galileo:["Galileo","green","E"],BeiDou:["BeiDou","gold","C"],QZSS:["みちびき","teal","J"]};
  function _w01_geod(B,L,h){B*=_W01_D;L*=_W01_D;var N=_W01_AW/Math.sqrt(1-_W01_E2*Math.sin(B)*Math.sin(B));return [(N+h)*Math.cos(B)*Math.cos(L),(N+h)*Math.cos(B)*Math.sin(L),(N*(1-_W01_E2)+h)*Math.sin(B)];}
  function _w01_kep(a,e,i,w,Om,M){M*=_W01_D;var E=M;for(var k=0;k<30;k++)E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
    var nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2)),r=a*(1-e*Math.cos(E)),u=w*_W01_D+nu,O=Om*_W01_D,inc=i*_W01_D;
    return [r*(Math.cos(O)*Math.cos(u)-Math.sin(O)*Math.sin(u)*Math.cos(inc)),r*(Math.sin(O)*Math.cos(u)+Math.cos(O)*Math.sin(u)*Math.cos(inc)),r*Math.sin(u)*Math.sin(inc)];}
  function _w01_walker(sys,a,inc,P,S,F,Om0){var o=[];for(var p=0;p<P;p++)for(var s=0;s<S;s++)o.push({sys:sys,a:a,e:0,i:inc,w:0,Om:Om0+360*p/P,M:360*s/S+360*F*p/(P*S),nm:_W01_SYS[sys][2]+(p*S+s+1)});return o;}
  var _W01_CON=null;
  function _w01_const(){if(_W01_CON)return _W01_CON;var S=[].concat(_w01_walker("GPS",26560e3,55,6,4,1,0),_w01_walker("GLONASS",25510e3,64.8,3,8,1,15),_w01_walker("Galileo",29600e3,56,3,8,1,40),_w01_walker("BeiDou",27906e3,55,3,8,1,70));
    for(var k=0;k<3;k++)S.push({sys:"QZSS",a:42164e3,e:0.075,i:41,w:270,Om:226+120*k,M:-120*k,nm:"J"+(k+1)});
    S.push({sys:"QZSS",a:42164e3,geo:127,nm:"J4"});_W01_CON=S;return S;}
  function _w01_eci(s,t){if(s.geo!=null){var th=_W01_WE*t+s.geo*_W01_D;return [s.a*Math.cos(th),s.a*Math.sin(th),0];}
    var n=Math.sqrt(_W01_MU/Math.pow(s.a,3))/_W01_D;return _w01_kep(s.a,s.e,s.i,s.w,s.Om,s.M+n*t);}
  function _w01_e2f(p,t){var th=_W01_WE*t,c=Math.cos(th),s=Math.sin(th);return [p[0]*c+p[1]*s,-p[0]*s+p[1]*c,p[2]];}
  function _w01_ecef(s,t){return _w01_e2f(_w01_eci(s,t),t);}
  /* 受信機 rx = {B, L, h, r0}（r0 は ECEF）から見た仰角・方位角 [°] と距離 [m] */
  function _w01_elaz(rx,p){var d=[p[0]-rx.r0[0],p[1]-rx.r0[1],p[2]-rx.r0[2]],b=rx.B*_W01_D,l=rx.L*_W01_D;
    var e=-Math.sin(l)*d[0]+Math.cos(l)*d[1],n=-Math.sin(b)*Math.cos(l)*d[0]-Math.sin(b)*Math.sin(l)*d[1]+Math.cos(b)*d[2],u=Math.cos(b)*Math.cos(l)*d[0]+Math.cos(b)*Math.sin(l)*d[1]+Math.sin(b)*d[2];
    return [Math.atan2(u,Math.hypot(e,n))/_W01_D,(Math.atan2(e,n)/_W01_D+360)%360,Math.hypot(d[0],d[1],d[2])];}
  /* スカイプロット（f01.py の _f01_sky と同じ見た目）。中心が真上、外の円が地平線、上が北・右が東。中心からの距離は 90° − 仰角 に比例。
     sats = [{el, az, name, col, hl}]、o = {trails: [{pts: [[el, az], …], col}], labels, sz, dot} */
  function _w01_skyxy(cx,cy,R,el,az){var r=R*(90-el)/90;return [cx+r*Math.sin(az*_W01_D),cy-r*Math.cos(az*_W01_D)];}
  function _w01_sky(U,cx,cy,R,sats,o){var S=U.S,s=[];o=o||{};var dot=o.dot||4.2,sz=o.sz||9.5;
    s.push(S.CIRC(cx,cy,R,"muted",1.3,"var(--screen)"));
    for(var az=0;az<360;az+=30){var q=_w01_skyxy(cx,cy,R,0,az);s.push(S.L(cx,cy,q[0],q[1],"grid",1));}
    [30,60].forEach(function(e){s.push(S.CIRC(cx,cy,R*(90-e)/90,"faint",0.9,null,"3 3"));});
    s.push(S.L(cx-4,cy,cx+4,cy,"muted",1));s.push(S.L(cx,cy-4,cx,cy+4,"muted",1));
    [0,30,60].forEach(function(e){s.push(S.T(cx+3,cy-R*(90-e)/90+11,e+"°","start",9.5,"muted",false,false,null,true));});
    [[0,"北"],[90,"東"],[180,"南"],[270,"西"]].forEach(function(d){var q=_w01_skyxy(cx,cy,R+11,0,d[0]);s.push(S.T(q[0],q[1]+4,d[1],"middle",10,"ink",true));});
    (o.trails||[]).forEach(function(tr){var seg=[];tr.pts.forEach(function(p){if(p[0]>=0)seg.push(_w01_skyxy(cx,cy,R,p[0],p[1]));else{if(seg.length>1)s.push(S.PL(seg,tr.col,1.2,null,"2 2"));seg=[];}});if(seg.length>1)s.push(S.PL(seg,tr.col,1.2,null,"2 2"));});
    sats.forEach(function(p){if(p.el<0)return;var q=_w01_skyxy(cx,cy,R,p.el,p.az);if(p.hl)s.push(S.CIRC(q[0],q[1],dot+4,p.col,1.8));s.push(S.D(q[0],q[1],p.col,dot));
      if(o.labels!==false&&p.name)s.push(S.T(q[0]+dot+2,q[1]+3.5,p.name,"start",sz,p.col,true,false,null,true));});
    return s.join("");}
  var _W01_SITES=[["東京",35.681,139.767,40],["シドニー",-33.87,151.21,60],["ロンドン",51.51,-0.13,60],["シンガポール",1.29,103.85,20],["北極の近く（北緯 85°）",85,0,0]];
  function _w01_hm(h){var H=Math.floor(h+1e-9),M=Math.round((h-H)*60);if(M===60){H++;M=0;}return H+" 時間 "+(M<10?"0":"")+M+" 分";}
  REG.w01_orbit=function(el,U){
    var S=U.S,CON=_w01_const();
    U.head(el,"ORBITS AND SKY","衛星の軌道（宇宙から見た図）と、受信機から見た空（スカイプロット）");
    var r1=U.ctrls(el);
    var sysSel=U.select(r1,"衛星系",["GPS","GLONASS","Galileo","BeiDou","みちびき","全部"],0,function(){pick=null;draw();});
    var siteSel=U.select(r1,"受信機の場所",_W01_SITES.map(function(s){return s[0];}),0,function(){pick=null;draw();});
    var r2=U.ctrls(el);
    var tt=U.slider(r2,"時刻",{min:0,max:24,step:0.05,value:0,fmt:function(v){return _w01_hm(v);},onInput:function(){draw();}});
    tt.el.style.flex="1 1 100%";
    var r3=U.ctrls(el);
    var cTr=U.checkbox(r3,"空を横切った跡（直前の 4 時間）",true,function(){draw();});
    var cRot=U.checkbox(r3,"左の図を地球と一緒に回す",false,function(){draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.05;if(v>24){v=24;tick.stop();}tt.set(v);draw();},40);
    U.button(br,"再生",function(){if(tt.get()>=24)tt.set(0);tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"本文の例（東京・GPS・時刻 0）",function(){tick.stop();sysSel.set(0);siteSel.set(0);tt.set(0);cTr.set(true);cRot.set(false);pick=null;draw();});
    var box=U.svgbox(el),ro=U.readout(el),pick=null,SK=null;
    U.ctl.drag(box,function(type,x,y){
      if(type!=="down"||!SK)return false;
      if(Math.hypot(x-SK.cx,y-SK.cy)>SK.R+8)return false;
      var best=null,bd=14;SK.pts.forEach(function(q){var d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=q.nm;}});
      pick=best;draw();return false;});
    function sel(){var k=sysSel.get(),keys=["GPS","GLONASS","Galileo","BeiDou","QZSS"];return k===5?keys:[keys[k]];}
    function draw(){
      var keys=sel(),site=_W01_SITES[siteSel.get()],rx={B:site[1],L:site[2],h:site[3],r0:_w01_geod(site[1],site[2],site[3])};
      var t=tt.get()*3600,sats=CON.filter(function(s){return keys.indexOf(s.sys)>=0;}),nar=_w01_nar(box),Wd=nar?400:700,o=[];
      /* ---- 左: 宇宙から見た図（正射影。大きさの比は実際のとおり） ---- */
      var rmax=0;sats.forEach(function(s){rmax=Math.max(rmax,s.a*(1+(s.e||0)));});rmax*=1.04;
      var cx=nar?200:178,cy=nar?176:190,half=nar?150:162,sc=half/rmax;
      var vaz=(site[2]-25+(cRot.get()?_W01_WE*t/_W01_D:0))*_W01_D,vel=(site[1]>60?50:22)*_W01_D;
      var vr=[-Math.sin(vaz),Math.cos(vaz),0],vu=[-Math.sin(vel)*Math.cos(vaz),-Math.sin(vel)*Math.sin(vaz),Math.cos(vel)],vd=[Math.cos(vel)*Math.cos(vaz),Math.cos(vel)*Math.sin(vaz),Math.sin(vel)];
      function pr(p){return [cx+sc*(p[0]*vr[0]+p[1]*vr[1]+p[2]*vr[2]),cy-sc*(p[0]*vu[0]+p[1]*vu[1]+p[2]*vu[2]),p[0]*vd[0]+p[1]*vd[1]+p[2]*vd[2]];}
      function hidden(q){return q[2]<0&&Math.hypot(q[0]-cx,q[1]-cy)<_W01_RE*sc;}
      o.push(S.T(nar?8:14,16,"宇宙から見た図（地球と軌道の大きさの比は実際のとおり）","start",10,"ink",true));
      o.push(S.RECT(nar?6:14,24,nar?388:330,nar?306:332,4,"var(--screen)","line",1));
      /* 軌道（面ごとに 1 本）: 奥の半分は破線、地球の陰は描かない */
      var seen={};
      sats.forEach(function(s){var key=s.geo!=null?"geo":(s.sys+":"+s.Om.toFixed(3));if(seen[key])return;seen[key]=1;
        var c=_W01_SYS[s.sys][1],seg=[],front=null;
        for(var j=0;j<=120;j++){var p=s.geo!=null?[s.a*Math.cos(2*Math.PI*j/120),s.a*Math.sin(2*Math.PI*j/120),0]:_w01_kep(s.a,s.e,s.i,s.w,s.Om,360*j/120),q=pr(p),f=q[2]>=0;
          if(hidden(q)){if(seg.length>1)o.push(S.PL(seg,c,front?1.2:0.9,null,front?null:"3 3"));seg=[];front=null;continue;}
          if(front!==null&&f!==front){seg.push([q[0],q[1]]);o.push(S.PL(seg,c,front?1.2:0.9,null,front?null:"3 3"));seg=[];}
          seg.push([q[0],q[1]]);front=f;}
        if(seg.length>1)o.push(S.PL(seg,c,front?1.2:0.9,null,front?null:"3 3"));});
      /* 地球（経線は地球と一緒に回る） */
      o.push(S.CIRC(cx,cy,_W01_RE*sc,"green",1.3,"var(--green-soft)"));
      var th=_W01_WE*t;
      for(var lon=0;lon<360;lon+=30){var seg2=[];for(var la=-90;la<=90;la+=10){var L=lon*_W01_D+th,B=la*_W01_D,q=pr([_W01_RE*Math.cos(B)*Math.cos(L),_W01_RE*Math.cos(B)*Math.sin(L),_W01_RE*Math.sin(B)]);if(q[2]>=0)seg2.push([q[0],q[1]]);else{if(seg2.length>1)o.push(S.PL(seg2,"green",0.6));seg2=[];}}if(seg2.length>1)o.push(S.PL(seg2,"green",0.6));}
      var eqs=[];for(var j2=0;j2<=72;j2++){var a2=2*Math.PI*j2/72,q2=pr([_W01_RE*Math.cos(a2),_W01_RE*Math.sin(a2),0]);if(q2[2]>=0)eqs.push([q2[0],q2[1]]);else{if(eqs.length>1)o.push(S.PL(eqs,"green",1));eqs=[];}}if(eqs.length>1)o.push(S.PL(eqs,"green",1));
      /* 受信機 */
      var rxi=[rx.r0[0]*Math.cos(th)-rx.r0[1]*Math.sin(th),rx.r0[0]*Math.sin(th)+rx.r0[1]*Math.cos(th),rx.r0[2]],rq=pr(rxi),rxFront=rq[2]>=0;
      /* 衛星 */
      var vis=[],cnt={},skyS=[],trails=[];SK={cx:0,cy:0,R:0,pts:[]};
      sats.forEach(function(s){var pe=_w01_ecef(s,t),ea=_w01_elaz(rx,pe),q=pr(_w01_eci(s,t)),c=_W01_SYS[s.sys][1],v=ea[0]>0;
        if(v){cnt[s.sys]=(cnt[s.sys]||0)+1;vis.push({s:s,ea:ea});}
        if(!hidden(q)){if(v&&rxFront&&(keys.length===1||s.nm===pick))o.push('<line x1="'+rq[0].toFixed(2)+'" y1="'+rq[1].toFixed(2)+'" x2="'+q[0].toFixed(2)+'" y2="'+q[1].toFixed(2)+'" stroke="var(--ink)" stroke-opacity="0.45" stroke-width="1.1" stroke-dasharray="5 3"/>');
          if(s.nm===pick)o.push(S.CIRC(q[0],q[1],8,c,1.8));o.push(S.D(q[0],q[1],v?c:"faint",v?3.6:2.4));}
        skyS.push({el:ea[0],az:ea[1],name:s.nm,col:c,hl:s.nm===pick});
        if(cTr.get()){var pts=[];for(var m=48;m>=0;m--){var tq=t-m*300;var eb=_w01_elaz(rx,_w01_ecef(s,tq));pts.push([eb[0],eb[1]]);}trails.push({pts:pts,col:c});}});
      if(rxFront)o.push(_w01_rx(U,rq[0],rq[1]-3));else o.push(S.CIRC(rq[0],rq[1],4,"green",1.2,null,"2 2"));
      var sbx=nar?16:24,sby=nar?320:346,sbl=1e7*sc;o.push(S.L(sbx,sby,sbx+sbl,sby,"ink",1.6));o.push(S.L(sbx,sby-4,sbx,sby+4,"ink",1.2));o.push(S.L(sbx+sbl,sby-4,sbx+sbl,sby+4,"ink",1.2));
      o.push(S.T(sbx+sbl+6,sby+4,"1 万 km"+(rxFront?"":"（受信機は地球の裏側）"),"start",9.5,"muted"));
      /* ---- 右（狭い画面では下）: スカイプロット ---- */
      var scx=nar?200:530,scy=nar?(sby+178):190,sR=nar?140:140;
      o.push(S.T(nar?8:372,nar?sby+22:16,"スカイプロット（"+site[0]+"から見た空）","start",10,"ink",true));
      o.push(_w01_sky(U,scx,scy,sR,skyS,{trails:trails,labels:keys.length===1||sats.length<30,dot:keys.length===1?4.2:3.4,sz:9.5}));
      skyS.forEach(function(p){if(p.el>=0){var q=_w01_skyxy(scx,scy,sR,p.el,p.az);SK.pts.push({x:q[0],y:q[1],nm:p.name});}});SK.cx=scx;SK.cy=scy;SK.R=sR;
      o.push(S.T(scx,scy+sR+(nar?40:44),"点を押すと、その衛星を左の図でも強調する","middle",9.5,"muted"));
      box.set(S.svg(Wd,nar?scy+sR+50:Math.max(sby+16,scy+sR+50),o));
      /* ---- 読み出し ---- */
      var tot=0,parts=keys.map(function(kk){tot+=(cnt[kk]||0);return '<span style="color:'+U.col(_W01_SYS[kk][1])+'"><b>'+_W01_SYS[kk][0]+" "+(cnt[kk]||0)+" 機</b></span>";});
      var h="時刻 "+_w01_hm(tt.get())+"、"+site[0]+"から地平線より上に見える衛星: "+parts.join("・")+(keys.length>1?"（合計 <b>"+tot+" 機</b>）":"")+"<br>";
      if(keys.length===1&&keys[0]!=="QZSS"){var a=sats[0].a,Tp=2*Math.PI*Math.sqrt(Math.pow(a,3)/_W01_MU);h+="軌道の半径 "+_w01_g(a/1e3,0)+" km（高さ 約 "+_w01_g(Math.round((a-_W01_RE)/1e4)*10,0)+" km）、周期 T<sub>orb</sub> = 2π√(a³/μ) = <b>"+_w01_hm(Tp/3600)+"</b>、速さ √(μ/a) = "+_w01_f(Math.sqrt(_W01_MU/a)/1e3,2)+" km/s<br>";}
      if(keys.length===1&&keys[0]==="QZSS")h+="準天頂軌道（J1〜J3）: 周期 1 恒星日（23 時間 56 分）、地球の中心からの距離 39 000〜45 300 km。J4 は東経 127° の静止軌道<br>";
      if(pick){var ps=CON.filter(function(s){return s.nm===pick;})[0];if(ps&&keys.indexOf(ps.sys)>=0){var e2=_w01_elaz(rx,_w01_ecef(ps,t));
        h+="<b>"+pick+"</b>: 仰角 θ = "+_w01_f(e2[0],1)+"°、方位角 α = "+_w01_f(e2[1],1)+"°、距離 "+_w01_g(e2[2]/1e3,0)+" km（電波は "+_w01_f(e2[2]/_W01_C*1e3,1)+" ms で届く）"+(e2[0]<0?'（<span class="warn">地平線より下で見えない</span>）':"")+"<br>";}}
      ro.innerHTML=h+'<div class="wnote">左の図の破線は、受信機から地平線より上に見える衛星への向き。軌道は円（みちびきの準天頂軌道だけは楕円）で近似し、衛星は各面に等間隔に置いた。時刻 0 は、この章の図と同じ配置の時刻で、実際の衛星の位置ではない。BeiDou は中軌道の衛星だけを描いた。名前の最初の文字は衛星系（G: GPS、R: GLONASS、E: Galileo、C: BeiDou、J: みちびき）。</div>';
    }
    draw();
  };
