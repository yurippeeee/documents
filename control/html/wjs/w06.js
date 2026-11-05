  /* ===== 06 章 伝達関数と極・零点 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w06_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w06_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w06_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=v.toExponential(1);return s.replace(/^-/,"−");}
  /* 複素数（{re, im}） */
  function _w06_c(re,im){return {re:re,im:im||0};}
  function _w06_add(a,b){return {re:a.re+b.re,im:a.im+b.im};}
  function _w06_sub(a,b){return {re:a.re-b.re,im:a.im-b.im};}
  function _w06_mul(a,b){return {re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re};}
  function _w06_div(a,b){var d=b.re*b.re+b.im*b.im;return {re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};}
  function _w06_sc(a,k){return {re:a.re*k,im:a.im*k};}
  function _w06_exp(a){var e=Math.exp(a.re);return {re:e*Math.cos(a.im),im:e*Math.sin(a.im)};}
  function _w06_abs(a){return Math.hypot(a.re,a.im);}
  /* 有効数字 d 桁（末尾の 0 を残す。例 4.90） */
  function _w06_p3(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace(/^-/,"−");}
  /* 極の文字（例 −1 ± j4.90、−2、±j5） */
  function _w06_ptxt(re,im,d,trim){d=d||3;var F=trim?_w06_sig:_w06_p3,r=Math.abs(re)<1e-9?"":F(re,d);
    if(Math.abs(im)<1e-9)return Math.abs(re)<1e-9?"0":r;
    return (r?r+" ± ":"±")+"<i>j</i>"+F(Math.abs(im),d);}
  /* 原点から点 (a, b) の向きへ引いた半直線を、グラフの枠で切った線分の端（値の座標） */
  function _w06_ray(P,a,b){var x0=Math.min(P.xr[0],P.xr[1]),y0=Math.min(P.yr[0],P.yr[1]),y1=Math.max(P.yr[0],P.yr[1]),k=1e9;
    if(a<0)k=Math.min(k,x0/a);if(b>0)k=Math.min(k,y1/b);if(b<0)k=Math.min(k,y0/b);return [a*k,b*k];}
  /* 同じ値の極をまとめる（重根）。返り値 [{p, m}] */
  function _w06_groups(ps){var gs=[];ps.forEach(function(p){var g=null;gs.forEach(function(q){if(Math.abs(q.p.re-p.re)<1e-9&&Math.abs(q.p.im-p.im)<1e-9)g=q;});if(g)g.m++;else gs.push({p:_w06_c(p.re,p.im),m:1});});return gs;}
  /* h の多項式（昇べき、複素係数）に (a + h) を掛ける */
  function _w06_pm1(P,a){var o=[],i;for(i=0;i<=P.length;i++)o.push(_w06_c(0,0));for(i=0;i<P.length;i++){o[i]=_w06_add(o[i],_w06_mul(P[i],a));o[i+1]=_w06_add(o[i+1],P[i]);}return o;}
  /* 級数の割り算 N/D（昇べき）の始めの K 項 */
  function _w06_sdiv(N,D,K){var q=[];for(var k=0;k<K;k++){var s=k<N.length?N[k]:_w06_c(0,0);for(var j=1;j<=k;j++)if(j<D.length)s=_w06_sub(s,_w06_mul(D[j],q[k-j]));q.push(_w06_div(s,D[0]));}return q;}
  /* G(s) = k Π(s − z)/Π(s − p)（厳密にプロパー）の部分分数。各まとまり g に、1/(s − p)^j の係数 g.c[j−1] を付ける */
  function _w06_pf(k,ps,zs){var gs=_w06_groups(ps);
    gs.forEach(function(g){var N=[_w06_c(k,0)];zs.forEach(function(z){N=_w06_pm1(N,_w06_sub(g.p,z));});
      var D=[_w06_c(1,0)];gs.forEach(function(o){if(o===g)return;for(var r=0;r<o.m;r++)D=_w06_pm1(D,_w06_sub(g.p,o.p));});
      var a=_w06_sdiv(N,D,g.m);g.c=[];for(var j=1;j<=g.m;j++)g.c.push(a[g.m-j]);});
    return gs;}
  /* まとまり g の項の値（複素数）: Σ c_j t^{j−1}/(j−1)! e^{pt} */
  function _w06_term(g,t){var e=_w06_exp(_w06_c(g.p.re*t,g.p.im*t)),s=_w06_c(0,0),f=1;for(var j=1;j<=g.m;j++){if(j>2)f*=(j-1);s=_w06_add(s,_w06_sc(g.c[j-1],Math.pow(t,j-1)/f));}return _w06_mul(s,e);}
  /* 根の並び（複素数）から実係数の多項式 */
  function _w06_poly(U,rs){return rs.length?U.ctl.poly.fromRoots(rs.map(function(r){return {re:r.re,im:r.im};})):[1];}
  /* 最終値 1 の極の組のステップ応答（本文 3 節）。w = 0 なら実の極 1 つ（sg = 0 なら積分） */
  function _w06_pstep(sg,w,t){if(w>1e-9)return 1-Math.exp(sg*t)*(Math.cos(w*t)-(sg/w)*Math.sin(w*t));if(Math.abs(sg)<1e-12)return t;return 1-Math.exp(sg*t);}
  /* 刻み dt の列 Y（最終値 1）から指標を読む */
  function _w06_stats(T,Y,yf){var n=Y.length,im=0,last=-1,t10=null,t90=null,ymin=0,imin=0;
    for(var i=0;i<n;i++){if(Y[i]>Y[im])im=i;if(Y[i]<ymin){ymin=Y[i];imin=i;}if(Math.abs(Y[i]-yf)>0.02*Math.abs(yf))last=i;
      if(t10===null&&Y[i]>=0.1*yf)t10=T[i];if(t90===null&&Y[i]>=0.9*yf)t90=T[i];}
    return {ymax:Y[im],tp:T[im],Mp:(Y[im]-yf)/yf,ymin:ymin,tmin:T[imin],t2:last<0?0:(last>=n-1?Infinity:T[last+1]),tr:(t10!==null&&t90!==null)?t90-t10:null};}
  /* グラフの範囲で切った線（Plot の clip） */
  function _w06_cl(P,T,Y,c,lw,dash){var pts=[];for(var i=0;i<T.length;i++)pts.push([T[i],Y[i]]);return P.clip(pts,c,lw,dash);}
  /* s 平面の地 */
  function _w06_sp(U,S,P,xt,yt,lab){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+U.ctl.splane(P)+P.axes({xl:lab===false?null:"実部 σ [1/s]",yl:lab===false?null:"虚部 ω [rad/s]",xt:xt,yt:yt,xfmt:function(v){return _w06_sig(v,3);},yfmt:function(v){return _w06_sig(v,3);},ylOff:34})+U.ctl.splane(P,{rhp:false});}

  /* ---- 3 節: 極の組の位置と応答（s 平面の格子） ---- */
  REG.w06_grid=function(el,U){
    var S=U.S;
    U.head(el,"POLE MAP","極の組の位置と応答 — s 平面の格子");
    var r1=U.ctrls(el);
    var ssg=U.slider(r1,"実部 σ<sub>0</sub>",{min:-4,max:1,step:0.05,value:-1,fmt:function(v){return _w06_f(v,2)+" /s";},onInput:function(){draw();}});
    var sw=U.slider(r1,"虚部 ω<sub>0</sub>",{min:0,max:10,step:0.05,value:4.899,fmt:function(v){return _w06_f(v,2)+" rad/s";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var snap=U.checkbox(r2,"格子の点に吸い付ける（0.5 /s・1 rad/s ごと）",true);
    var tw=U.select(r2,"時間の範囲",["0〜4 s","0〜8 s","0〜16 s"],1,function(){draw();});
    var br=U.btnrow(el);
    function pre(a,b){ssg.set(a);sw.set(b);draw();}
    U.button(br,"本文の例（台車 −1 ± j4.90）",function(){pre(-1,4.899);});
    U.button(br,"実の極 −2",function(){pre(-2,0);});
    U.button(br,"−2.5 ± j4.33（ζ 0.5）",function(){pre(-2.5,4.330);});
    U.button(br,"虚軸の上 ±j5",function(){pre(0,5);});
    U.button(br,"原点（積分）",function(){pre(0,0);});
    U.button(br,"実部が正 0.3 ± j4",function(){pre(0.3,4);});
    var br2=U.btnrow(el);
    U.button(br2,"この応答を残して比べる",function(){if(cur){refs.push(cur);if(refs.length>4)refs.shift();draw();}});
    U.button(br2,"残した応答を消す",function(){refs=[];draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,cur=null,refs=[],RC=["teal","purple","gold","green"];
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
      var a=Math.max(-4,Math.min(1,PP.ux(x))),b=Math.min(10,Math.abs(PP.uy(y)));
      if(snap.get()){a=Math.round(a*2)/2;b=Math.round(b);}
      ssg.set(+a.toFixed(3));sw.set(+b.toFixed(3));draw();});
    function draw(){
      var sg=ssg.get(),w=sw.get();if(w<0.025)w=0;if(Math.abs(sg)<0.0005)sg=0;
      var tend=[4,8,16][tw.get()],N=1200,T=[],Y=[],H=[],E=[];
      for(var i=0;i<=N;i++){var t=tend*i/N;T.push(t);Y.push(_w06_pstep(sg,w,t));H.push(Math.exp(sg*t)*Math.cos(w*t));E.push(Math.exp(sg*t));}
      cur={sg:sg,w:w,T:T,Y:Y,H:H,tend:tend};
      var nar=_w06_nar(box),Wd=nar?400:700,o=[];
      /* s 平面 */
      var px=nar?52:56,py=nar?20:20,P=U.plot(px,py,nar?330:224,nar?190:268,[-4.3,1.3],[-10.6,10.6]);PP=P;
      o.push(_w06_sp(U,S,P,[-4,-3,-2,-1,0,1],[-10,-5,0,5,10]));
      for(var gs=-4;gs<=1.001;gs+=0.5)for(var gw=0;gw<=10;gw+=1)o.push(S.D(P.X(gs),P.Y(gw),"faint",1.1));
      if(w>0){o.push(S.L(P.X(sg),P.y,P.X(sg),P.y+P.h,"gold",1,"4 3"));o.push(S.L(P.x,P.Y(w),P.x+P.w,P.Y(w),"gold",1,"4 3"));
        if(sg<0){var e2=_w06_ray(P,sg,w);o.push(S.L(P.X(0),P.Y(0),P.X(e2[0]),P.Y(e2[1]),"faint",1,"2 3"));}}
      refs.forEach(function(rf,j){var ps=rf.w>0?[{re:rf.sg,im:rf.w},{re:rf.sg,im:-rf.w}]:[{re:rf.sg,im:0}];o.push(U.ctl.pz(P,ps,[],RC[j%4],4));});
      var c=sg<0?"signal":(sg===0?"gold":"alias");
      o.push(U.ctl.pz(P,w>0?[{re:sg,im:w},{re:sg,im:-w}]:[{re:sg,im:0}],[],c,6.5));
      o.push(S.T(P.x+P.w,P.y-6,"× をドラッグ（下半分は鏡像）","end",9,"muted"));
      /* 項の形と、ステップ応答 */
      var qx=nar?52:356,qw=nar?330:324,qy=nar?py+P.h+58:24;
      var Q=U.plot(qx,qy,qw,nar?100:104,[0,tend],[-1.6,1.6]);
      o.push(Q.axes({xl:null,yl:null,xt:U.nice(0,tend,4),yt:[-1,0,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));
      o.push(S.TX(Q.x,Q.y-6,w>0?"極の組の項の形 e^{σ₀t} cos ω₀t（破線は包絡線 ±e^{σ₀t}）":"極の項の形 e^{σ₀t}","start",9.5,"ink",true));
      refs.forEach(function(rf,j){if(rf.tend===tend)o.push(_w06_cl(Q,rf.T,rf.H,RC[j%4],1.2,"5 3"));});
      if(w>0){o.push(_w06_cl(Q,T,E,c,1,"4 3"));o.push(_w06_cl(Q,T,E.map(function(v){return -v;}),c,1,"4 3"));}
      o.push(_w06_cl(Q,T,H,c,2));
      var Q2=U.plot(qx,qy+(nar?140:150),qw,nar?110:114,[0,tend],[-0.4,2.2]);
      o.push(Q2.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,4),yt:[0,0.5,1,1.5,2],xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.RECT(Q2.x,Q2.Y(1.02),Q2.w,Q2.Y(0.98)-Q2.Y(1.02),0,"var(--green-soft)","none",0));
      o.push(Q2.line([[0,1],[tend,1]],"muted",1,"4 3"));
      o.push(S.T(Q2.x,Q2.y-6,"G(0) = 1 のステップ応答（緑の帯は 1 ± 2 %）","start",9.5,"ink",true));
      refs.forEach(function(rf,j){if(rf.tend===tend)o.push(_w06_cl(Q2,rf.T,rf.Y,RC[j%4],1.2,"5 3"));});
      o.push(_w06_cl(Q2,T,Y,c,2.2));
      var st=_w06_stats(T,Y,1);
      if(sg<0&&w>0&&st.tp<tend*0.98){o.push(S.D(Q2.X(st.tp),Q2.Y(Math.min(2.2,st.ymax)),c,3.5));}
      box.set(S.svg(Wd,qy+(nar?140:150)+(nar?110:114)+40,o));
      /* 読み出し */
      var h="",wn=Math.hypot(sg,w);
      h+="極: <b>"+_w06_ptxt(sg,w,3)+"</b>";
      if(w>0&&sg<0)h+="。原点からの距離 ω<sub>n</sub> = "+_w06_sig(wn,3)+" rad/s、減衰比 ζ = cos ψ = "+_w06_f(-sg/wn,3);
      h+="<br>";
      if(sg<0){h+="包絡線の時定数 1/|σ<sub>0</sub>| = "+_w06_sig(-1/sg,3)+" s、2 % 整定時間の目安 4/|σ<sub>0</sub>| = <b>"+_w06_sig(-4/sg,3)+" s</b>（数値 "+(isFinite(st.t2)?_w06_sig(st.t2,3)+" s":"この範囲では落ち着かない")+"）<br>";}
      if(w>0){h+="揺れの周期 2π/ω<sub>0</sub> = "+_w06_sig(2*Math.PI/w,3)+" s";
        if(sg<0){var mp=Math.exp(Math.PI*sg/w);h+="、ピーク時間 π/ω<sub>0</sub> = "+_w06_sig(Math.PI/w,3)+" s、行き過ぎ量 e<sup>πσ₀/ω₀</sup> = <b>"+_w06_sig(mp*100,3)+" %</b>（数値 "+_w06_sig(st.Mp*100,3)+" %）";}
        h+="<br>";}
      if(sg<0)h+='<span class="ok">実部が負: 項は減り、応答は最終値に落ち着く</span>';
      else if(sg===0)h+=w>0?'<span class="warn">虚軸の上: 項は同じ振幅で揺れ続ける（ステップ応答は 0 と 2 の間を往復）</span>':'<span class="warn">原点: 項は減らず、ステップ応答は一定の速さで増え続ける（積分）</span>';
      else h+='<span class="warn">実部が正: 項は '+_w06_sig(Math.LN2/sg,3)+' s ごとに 2 倍になり、応答は最終値から離れていく</span>';
      ro.innerHTML=h+'<div class="wnote">極の組 σ<sub>0</sub> ± jω<sub>0</sub> をもち、G(0) = 1 の二次遅れ ω<sub>n</sub>²/(s² − 2σ<sub>0</sub>s + ω<sub>n</sub>²)（ω<sub>n</sub>² = σ<sub>0</sub>² + ω<sub>0</sub>²）の応答。虚部が 0 のときは、実の極 1 つの一次遅れ（原点では積分 1/s）として描く。応答は本文 3 節の式で計算した。</div>';
    }
    draw();
  };

  /* ---- 4 節: 極と零点を足す・動かす — 極ごとの項と安定 ---- */
  /* グラフの縦の範囲: 始めの 1/4 の大きさの 4 倍までに抑える（増え続ける応答も形が見えるように） */
  function _w06_yr(T,Y){var tq=T[T.length-1]*0.25,A=0,B=0,mn=0,i;
    for(i=0;i<T.length;i++){var a=Math.abs(Y[i]);if(isFinite(a)){if(T[i]<=tq)A=Math.max(A,a);B=Math.max(B,a);mn=Math.min(mn,Y[i]);}}
    var M=Math.min(B,4*Math.max(A,1e-9));if(!(M>0))M=1;
    return mn>-0.05*M?[-0.1*M,1.15*M]:[-1.15*M,1.15*M];}
  REG.w06_poles=function(el,U){
    var S=U.S,RC=["teal","purple","gold","green","alias","signal"];
    U.head(el,"POLES & ZEROS","極と零点を足す・動かす — 極ごとの項と安定");
    var r1=U.ctrls(el);
    var inp=U.select(r1,"有界な入力",["単位ステップ","正弦波（振幅 1）"],0,function(){draw();});
    var swu=U.slider(r1,"正弦波の角周波数 ω<sub>u</sub>",{min:0.2,max:8,step:0.1,value:2,fmt:function(v){return _w06_f(v,1)+" rad/s";},onInput:function(){draw();}});
    var tw=U.select(r1,"時間の範囲",["0〜5 s","0〜10 s","0〜20 s"],1,function(){draw();});
    var br=U.btnrow(el);
    var items=[],sel=-1,msg="";
    function npo(){var n=0;items.forEach(function(it){if(it.k==="p")n+=it.pair?2:1;});return n;}
    function nze(){var n=0;items.forEach(function(it){if(it.k==="z")n+=it.pair?2:1;});return n;}
    function add(k,pair,re,im){var np=npo(),nz=nze(),d=pair?2:1;msg="";
      if(k==="p"&&np+d>6){msg="極は 6 個までにしている";draw();return;}
      if(k==="z"&&nz+d>np-1){msg="厳密にプロパーに保つため、零点は極より少なくしている（極を先に足す）";draw();return;}
      items.push({k:k,pair:pair,re:re,im:pair?im:0});sel=items.length-1;draw();}
    U.button(br,"実の極を足す",function(){add("p",false,-1.5,0);});
    U.button(br,"極の組を足す",function(){add("p",true,-0.8,2.5);});
    U.button(br,"実の零点を足す",function(){add("z",false,-4,0);});
    U.button(br,"零点の組を足す",function(){add("z",true,-2,1.5);});
    U.button(br,"選んだものを消す",function(){msg="";if(sel>=0){items.splice(sel,1);sel=-1;while(nze()>Math.max(0,npo()-1)){for(var i=items.length-1;i>=0;i--)if(items[i].k==="z"){items.splice(i,1);break;}msg="極より少なくなるよう、零点も消した";}}draw();});
    var br2=U.btnrow(el);
    function preset(a){items=a.map(function(x){return {k:x[0],pair:x[1],re:x[2],im:x[3]||0};});sel=-1;msg="";draw();}
    U.button(br2,"本文の例（2 節の例）",function(){preset([["p",false,-3],["p",true,-1,2],["z",false,-2]]);});
    U.button(br2,"安定限界（±j3 と −1）",function(){preset([["p",true,0,3],["p",false,-1]]);inp.set(1);swu.set(3);draw();});
    U.button(br2,"右半平面の極 +0.3 を足す",function(){preset([["p",false,-3],["p",true,-1,2],["z",false,-2],["p",false,0.3]]);});
    U.button(br2,"虚軸の上に重なった極",function(){preset([["p",true,0,2],["p",true,0,2],["p",false,-2]]);});
    U.button(br2,"零点を右半平面へ",function(){preset([["p",false,-3],["p",true,-1,2],["z",false,1.5]]);});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,drag=-1;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){drag=-1;return;}
      if(x==null||!PP)return;
      if(type==="down"){var best=-1,bd=16;
        items.forEach(function(it,i){var xs=PP.X(it.re),ys=[PP.Y(it.im)];if(it.pair)ys.push(PP.Y(-it.im));ys.forEach(function(yy){var d=Math.hypot(x-xs,y-yy);if(d<bd){bd=d;best=i;}});});
        if(best<0){if(x>=PP.x&&x<=PP.x+PP.w&&y>=PP.y&&y<=PP.y+PP.h){sel=-1;draw();}return false;}
        sel=best;drag=best;draw();return;}
      if(drag<0)return;
      var it=items[drag],re=Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x)));
      if(Math.abs(re)<0.12)re=0;
      if(it.pair){var im=Math.min(PP.yr[1],Math.abs(PP.uy(y)));if(im<0.15)im=0;it.im=im;}
      else{items.forEach(function(o2,j){if(j!==drag&&o2.k===it.k&&(!o2.pair||o2.im===0)&&Math.abs(o2.re-re)<0.12)re=o2.re;});}
      it.re=+re.toFixed(4);if(it.pair)it.im=+it.im.toFixed(4);draw();});
    function draw(){
      swu.el.style.display=inp.get()===1?"":"none";
      var ps=[],zs=[],owner=[];
      items.forEach(function(it,i){var arr=it.k==="p"?ps:zs;arr.push(_w06_c(it.re,it.im));if(it.k==="p")owner.push(i);if(it.pair){arr.push(_w06_c(it.re,-it.im));if(it.k==="p")owner.push(i);}});
      var nar=_w06_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:236,nar?200:262,[-6,3],[-6,6]);PP=P;
      o.push(_w06_sp(U,S,P,[-6,-4,-2,0,2],[-6,-4,-2,0,2,4,6]));
      var tend=[5,10,20][tw.get()],N=800,T=[],i;
      for(i=0;i<=N;i++)T.push(tend*i/N);
      var gs=[],k=1,G=null,ok=ps.length>0;
      if(ok){var kp=_w06_c(1,0),kz=_w06_c(1,0);ps.forEach(function(p){if(_w06_abs(p)>1e-12)kp=_w06_mul(kp,_w06_sc(p,-1));});zs.forEach(function(z){if(_w06_abs(z)>1e-12)kz=_w06_mul(kz,_w06_sc(z,-1));});
        k=_w06_div(kp,kz).re;gs=_w06_pf(k,ps,zs);
        var num=U.ctl.poly.scale(_w06_poly(U,zs),k),den=_w06_poly(U,ps);G=U.ctl.tf(num,den);}
      /* 極ごとの項（共役な組はまとめて実数にする） */
      var terms=[],tot=T.map(function(){return 0;});
      gs.forEach(function(g){if(g.p.im<-1e-12)return;var f=g.p.im>1e-12?2:1,Y=T.map(function(t){return f*_w06_term(g,t).re;});terms.push({g:g,Y:Y});Y.forEach(function(v,j){tot[j]+=v;});});
      /* 極の色: まとまりの順 */
      var colOf=function(p){for(var q=0;q<terms.length;q++){var g=terms[q].g;if(Math.abs(g.p.re-p.re)<1e-9&&Math.abs(Math.abs(g.p.im)-Math.abs(p.im))<1e-9)return RC[q%4];}return "signal";};
      items.forEach(function(it,i){var c=it.k==="z"?"muted":colOf(it),pts=[_w06_c(it.re,it.im)];if(it.pair)pts.push(_w06_c(it.re,-it.im));
        o.push(it.k==="p"?U.ctl.pz(P,pts,[],c,6):U.ctl.pz(P,[],pts,c,5.5));
        if(i===sel)pts.forEach(function(q){o.push(S.CIRC(P.X(q.re),P.Y(q.im),11,"ink",1.2,null,"3 2"));});});
      gs.forEach(function(g){if(g.m>1&&g.p.im>=0)o.push(S.T(P.X(g.p.re)+9,P.Y(g.p.im)-8,"×"+g.m,"start",9.5,"ink",true,false,null,true));});
      o.push(S.T(P.x+P.w,P.y-6,"押して選び、ドラッグで動かす","end",9,"muted"));
      /* インパルス応答 */
      var qx=nar?52:350,qw=nar?330:330,qy=nar?20+P.h+58:24;
      var yr=ok?_w06_yr(T,tot):[-1,1];terms.forEach(function(tm){var r=_w06_yr(T,tm.Y);yr=[Math.min(yr[0],Math.max(r[0],-3*(yr[1]-yr[0]))),Math.max(yr[1],Math.min(r[1],3*(yr[1]-yr[0])))];});
      var Q=U.plot(qx,qy,qw,nar?110:112,[0,tend],yr);
      o.push(Q.axes({xl:null,yl:null,xt:U.nice(0,tend,5),yt:U.nice(yr[0],yr[1],4),xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));
      o.push(S.T(Q.x,Q.y-6,"インパルス応答（色は極ごとの項、青は和）","start",9.5,"ink",true));
      terms.forEach(function(tm,q){o.push(_w06_cl(Q,T,tm.Y,RC[q%4],1.4,"5 3"));});
      if(ok)o.push(_w06_cl(Q,T,tot,"signal",2.2));
      /* 有界な入力への応答 */
      var Y2=[],U2=[],wu=swu.get(),isS=inp.get()===1;
      if(ok){var r=U.ctl.lsim(G,function(t){return isS?Math.sin(wu*t):1;},tend,N);Y2=r.y;U2=T.map(function(t){return isS?Math.sin(wu*t):1;});}
      var yr2=ok?_w06_yr(T,Y2):[-1,1];yr2=isS?[Math.min(yr2[0],-1.1),Math.max(yr2[1],1.1)]:[Math.min(yr2[0],-0.1),Math.max(yr2[1],1.15)];
      var Q2=U.plot(qx,qy+(nar?150:154),qw,nar?110:112,[0,tend],yr2);
      o.push(Q2.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,5),yt:U.nice(yr2[0],yr2[1],4),xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q2.x,Q2.Y(0),Q2.x+Q2.w,Q2.Y(0),"muted",0.9));
      o.push(S.T(Q2.x,Q2.y-6,(isS?"正弦波":"単位ステップ")+"（破線）への応答","start",9.5,"ink",true));
      if(ok){o.push(_w06_cl(Q2,T,U2,"muted",1.1,"4 3"));o.push(_w06_cl(Q2,T,Y2,"signal",2));}
      box.set(S.svg(Wd,qy+(nar?150:154)+(nar?110:112)+40,o));
      /* 読み出し */
      var h="";
      if(!ok){ro.innerHTML='<span class="warn">極がない。「実の極を足す」か「極の組を足す」で極を置く</span>'+(msg?"<br>"+msg:"");return;}
      var rhp=false,ax=0,axr=false;gs.forEach(function(g){if(g.p.re>1e-9)rhp=true;else if(Math.abs(g.p.re)<=1e-9){ax++;if(g.m>1)axr=true;}});
      var pl=[],zl=[];items.forEach(function(it){(it.k==="p"?pl:zl).push(_w06_ptxt(it.re,it.im,3,true));});
      h+="極: "+pl.join("、")+(zl.length?"　零点: "+zl.join("、"):"　零点: なし")+"（"+ps.length+" 次。G(0) が 1 になるよう定数を選んだ）<br>";
      var area=0;for(i=1;i<T.length;i++)area+=0.5*(Math.abs(tot[i])+Math.abs(tot[i-1]))*(T[i]-T[i-1]);
      var ymax=0;Y2.forEach(function(v){ymax=Math.max(ymax,Math.abs(v));});
      if(rhp)h+='<span class="warn">不安定: 右半平面に極がある。その項が限りなく大きくなる</span>';
      else if(axr)h+='<span class="warn">不安定: 虚軸の上に重なった極がある（t に比例して増える項）</span>';
      else if(ax)h+='<span class="warn">安定限界: 虚軸の上に極がある。インパルス応答は減らず、同じ角周波数の正弦波で応答が増え続ける</span>';
      else h+='<span class="ok">安定: すべての極が左半平面にある</span>';
      h+="<br>この範囲の ∫|g| dt = "+_w06_sig(area,3)+(rhp||ax?"（範囲を延ばすと増え続ける）":"（範囲を延ばしても有限の値に近づく）")+"、"+(isS?"正弦波":"ステップ")+"への応答の |y| の最大 = "+_w06_sig(ymax,3);
      ro.innerHTML=h+(msg?'<br><span class="warn">'+msg+'</span>':"")+'<div class="wnote">極ごとの項は、部分分数分解（重なった極は t<sup>k</sup>e<sup>pt</sup> の項も）で求めた式の値。有界な入力への応答は、伝達関数を零次ホールドで離散化して求めた。実軸の近く・虚軸の近く・ほかの実の極の近くに動かすと、その上に吸い付く。零点をどこに置いても、安定かどうかの判定は変わらない。</div>';
    }
    preset([["p",false,-3],["p",true,-1,2],["z",false,-2]]);
  };

  /* ---- 5 節: 零点の位置と、行き過ぎ・逆応答 ---- */
  REG.w06_zero=function(el,U){
    var S=U.S;
    var BASES=[{name:"モータの位置の比例制御",sg:-10,w:Math.sqrt(110),tend:0.6,xr:[-40,40],yr:[-16,16],xt:[-40,-20,0,20,40],yt:[-10,0,10]},
               {name:"台車とばね・ダンパ",sg:-1,w:Math.sqrt(24),tend:4,xr:[-15,15],yr:[-7,7],xt:[-15,-10,-5,0,5,10,15],yt:[-5,0,5]}];
    U.head(el,"ZERO","零点の位置と、行き過ぎ・逆応答");
    var r1=U.ctrls(el);
    var bs=U.select(r1,"もとの二次遅れ",["モータの位置の比例制御（極 −10 ± j10.49）","台車とばね・ダンパ（極 −1 ± j4.90）"],0,function(){draw();});
    var sq=U.slider(r1,"零点の位置（ω<sub>n</sub>/z<sub>1</sub>。0 で零点なし）",{min:-3,max:3,step:0.01,value:-14.491/10,fmt:function(v){var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w);return Math.abs(v)<0.005?"零点なし":"z₁ = "+_w06_sig(wn/v,3);},onInput:function(){draw();}});
    var br=U.btnrow(el);
    function setZ(z){var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w);sq.set(z===null?0:wn/z);draw();}
    U.button(br,"零点なし",function(){setZ(null);});
    U.button(br,"本文の例 −10",function(){bs.set(0);setZ(-10);});
    U.button(br,"本文の例 +10",function(){bs.set(0);setZ(10);});
    U.button(br,"−5",function(){bs.set(0);setZ(-5);});
    U.button(br,"+5",function(){bs.set(0);setZ(5);});
    U.button(br,"台車に零点 −12.5（付け根を動かす）",function(){bs.set(1);setZ(-12.5);});
    var box=U.svgbox(el),ro=U.readout(el),PP=null;
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
      var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w),z=Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),lim=0.05*(PP.xr[1]-PP.xr[0]);
      if(Math.abs(z)<lim)z=z<0?-lim:lim;sq.set(wn/z);draw();});
    function draw(){
      var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w),q=sq.get(),has=Math.abs(q)>=0.005,z1=has?wn/q:Infinity;
      var N=1500,tend=B.tend,T=[],Y0=[],YD=[],TM=[],Y=[];
      for(var i=0;i<=N;i++){var t=tend*i/N,e=Math.exp(B.sg*t),y0=1-e*(Math.cos(B.w*t)-(B.sg/B.w)*Math.sin(B.w*t)),yd=(wn*wn/B.w)*e*Math.sin(B.w*t),tm=has?-yd/z1:0;
        T.push(t);Y0.push(y0);YD.push(yd);TM.push(tm);Y.push(y0+tm);}
      var nar=_w06_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:236,nar?150:200,B.xr,B.yr);PP=P;
      o.push(_w06_sp(U,S,P,B.xt,B.yt));
      o.push(U.ctl.pz(P,[{re:B.sg,im:B.w},{re:B.sg,im:-B.w}],[],"signal",6));
      if(has&&z1>=B.xr[0]&&z1<=B.xr[1])o.push(U.ctl.pz(P,[],[{re:z1,im:0}],"gold",6));
      o.push(S.CIRC(P.X(0),P.Y(0),Math.abs(P.X(wn)-P.X(0)),"faint",1,null,"3 3"));
      o.push(S.T(P.x+P.w,P.y-6,"○ を実軸の上でドラッグ","end",9,"muted"));
      o.push(S.TX(P.x+4,P.y+P.h-6,"破線の円: 原点から ω_n = "+_w06_sig(wn,3),"start",9,"muted",false,true));
      var qx=nar?52:350,qw=nar?330:330,qy=nar?20+P.h+58:24;
      var lo=Math.min(-0.15,Math.min.apply(null,Y)-0.1,Math.min.apply(null,TM)-0.05),hi=Math.max(1.3,Math.max.apply(null,Y)+0.1,Math.max.apply(null,TM)+0.05);lo=Math.max(lo,-2.5);hi=Math.min(hi,3.5);
      var Q=U.plot(qx,qy,qw,nar?180:210,[0,tend],[lo,hi]);
      o.push(Q.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,5),yt:U.nice(lo,hi,5),xfmt:function(v){return _w06_sig(v,3);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));o.push(Q.line([[0,1],[tend,1]],"faint",1,"3 3"));
      o.push(_w06_cl(Q,T,Y0,"muted",1.5,"5 3"));
      if(has)o.push(_w06_cl(Q,T,TM,"gold",1.6));
      o.push(_w06_cl(Q,T,Y,"signal",2.3));
      var ly=qy+(nar?180:210)+48;
      o.push(S.LEGL(qx,ly,[["muted","5 3","y_0（零点なし）"],["gold",null,"−\\dot{y}_0/z_1"],["signal",null,"y（和）"]],9.5,12));
      box.set(S.svg(Wd,ly+10,o));
      var st=_w06_stats(T,Y,1),st0=_w06_stats(T,Y0,1),slope=(Y[1]-Y[0])/(T[1]-T[0]);
      var h="";
      if(!has)h+="零点なし: 行き過ぎ量 <b>"+_w06_p3(st0.Mp*100,3)+" %</b>、ピーク時間 "+_w06_p3(st0.tp,3)+" s。動き始めの傾きは 0（水平に動き始める）<br>";
      else{
        h+="零点 z<sub>1</sub> = <b>"+_w06_sig(z1,3)+"</b>（"+(z1<0?"左半平面":"右半平面")+"。原点からの距離は極の "+_w06_sig(Math.abs(z1)/wn,2)+" 倍）<br>";
        h+="行き過ぎ量 <b>"+_w06_p3(Math.max(0,st.Mp)*100,3)+" %</b>（零点なしでは "+_w06_p3(st0.Mp*100,3)+" %）";
        if(st.ymin<-1e-4)h+="、初めに逆へ動く量 <b>"+_w06_sig(-st.ymin*100,3)+" %</b>（"+_w06_sig(st.tmin,3)+" s）";
        h+="<br>動き始めの傾き: 初期値の定理の式 −ω<sub>n</sub>²/z<sub>1</sub> = <b>"+_w06_sig(-wn*wn/z1,3)+" /s</b>、数値 "+_w06_sig(slope,3)+" /s<br>";
        h+=z1>0?'<span class="warn">右半平面の零点: 逆応答。この伝達関数は非最小位相</span>':'<span class="ok">左半平面の零点: 最小位相。近いほど行き過ぎが増える</span>';}
      ro.innerHTML=h+'<div class="wnote">もとの二次遅れ G<sub>0</sub>(s)（最終値 1）に、最終値を変えない零点の因数 (1 − s/z<sub>1</sub>) を掛けた。ステップ応答は本文 5 節の式 y = y<sub>0</sub> − ẏ<sub>0</sub>/z<sub>1</sub> で求めた。傾きの数値は、始めの 1 刻みの差から求めた。</div>';
    }
    draw();
  };

  /* ---- 6 節: 支配極と近似 ---- */
  REG.w06_dominant=function(el,U){
    var S=U.S,CT=U.ctl;
    U.head(el,"DOMINANT POLES","支配極だけの近似と、捨てた極・零点の影響");
    var r0=U.ctrls(el);
    var md=U.select(r0,"例",["遠い極（台車 ＋ 力の遅れ）","ループの中の遅れ（モータの位置の比例制御）","極零相殺（遅い極 −1 の近くの零点）","右半平面の極 +1 を零点で消そうとする"],0,function(){sel(true);});
    var rA=U.ctrls(el);
    var sa=U.slider(rA,"遠い極 −ω<sub>a</sub> の ω<sub>a</sub>",{min:1,max:100,log:true,value:10,fmt:function(v){return _w06_sig(v,3)+" rad/s";},onInput:function(){draw();}});
    var rB=U.ctrls(el);
    var sk=U.slider(rB,"比例ゲイン K<sub>P</sub>",{min:0.05,max:60,log:true,value:0.21,fmt:function(v){return _w06_sig(v,3)+" V/rad";},onInput:function(){draw();}});
    var rC=U.ctrls(el);
    var sz=U.slider(rC,"零点 z",{min:-3,max:-0.5,step:0.01,value:-1.1,fmt:function(v){return _w06_f(v,2);},onInput:function(){draw();}});
    var rD=U.ctrls(el);
    var sr=U.slider(rD,"零点 z（右半平面）",{min:0.8,max:1.2,step:0.001,value:0.99,fmt:function(v){return _w06_f(v,3);},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var bA=[],bB=[],bC=[],bD=[];
    function bt(arr,t,f){arr.push(U.button(br,t,f));}
    var pair={sg:-1,w:4.899};
    bt(bA,"本文の例（ω<sub>a</sub> = 10）",function(){pair={sg:-1,w:4.899};sa.set(10);draw();});
    bt(bA,"ω<sub>a</sub> = 3",function(){sa.set(3);draw();});bt(bA,"ω<sub>a</sub> = 50",function(){sa.set(50);draw();});
    bt(bA,"減衰比 0.7 の極の組",function(){pair={sg:-3.5,w:3.571};draw();});
    bt(bB,"0.21 V/rad",function(){sk.set(0.21);draw();});bt(bB,"10 V/rad",function(){sk.set(10);draw();});bt(bB,"40 V/rad",function(){sk.set(40);draw();});
    bt(bC,"z = −1（相殺）",function(){sz.set(-1);draw();});bt(bC,"z = −1.1",function(){sz.set(-1.1);draw();});bt(bC,"z = −2",function(){sz.set(-2);draw();});
    bt(bD,"z = 1（ぴったり）",function(){sr.set(1);draw();});bt(bD,"z = 0.99（1 % ずれ）",function(){sr.set(0.99);draw();});bt(bD,"z = 0.9",function(){sr.set(0.9);draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,dragK=null;
    function sel(re){var m=md.get();rA.style.display=m===0?"":"none";rB.style.display=m===1?"":"none";rC.style.display=m===2?"":"none";rD.style.display=m===3?"":"none";
      [bA,bB,bC,bD].forEach(function(a,i){a.forEach(function(b){b.style.display=i===m?"":"none";});});if(re)draw();}
    CT.drag(box,function(type,x,y){if(type==="up"){dragK=null;return;}if(x==null||!PP)return;var m=md.get();
      if(type==="down"){if(!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
        if(m===0){var dp=Math.min(Math.hypot(x-PP.X(pair.sg),y-PP.Y(pair.w)),Math.hypot(x-PP.X(pair.sg),y-PP.Y(-pair.w))),da=Math.hypot(x-PP.X(Math.max(PP.xr[0],-sa.get())),y-PP.Y(0));dragK=dp<da?"p":"a";}
        else if(m===2||m===3)dragK="z";else return false;}
      if(!dragK)return;var re=PP.ux(x);
      if(dragK==="p"){pair={sg:Math.max(-12,Math.min(-0.2,re)),w:Math.max(0.3,Math.min(PP.yr[1],Math.abs(PP.uy(y))))};}
      else if(dragK==="a"){sa.set(Math.max(1,Math.min(100,-re)));}
      else if(m===2){sz.set(Math.max(-3,Math.min(-0.5,Math.round(re*100)/100)));}
      else{sr.set(Math.max(0.8,Math.min(1.2,Math.round(re*1000)/1000)));}
      draw();});
    function stepOf(num,den,tend,n){return CT.step(CT.tf(num,den),tend,n);}
    function draw(){
      var m=md.get(),nar=_w06_nar(box),Wd=nar?400:700,o=[],N=900,h="",i;
      var full,appr,term=null,P,tend,xt,yt,poles=[],zeros=[],apoles=[],note="",yl=[-0.1,1.7];
      if(m===0){var a=sa.get(),sg=pair.sg,w=pair.w,wn2=sg*sg+w*w,den2=[1,-2*sg,wn2];
        tend=Math.min(12,Math.max(2,6/Math.abs(sg)));
        full=stepOf([a*wn2],CT.poly.mul([1,a],den2),tend,N);appr=stepOf([wn2],den2,tend,N);
        var G0a=wn2/(a*a+2*sg*a+wn2);term={t:full.t,y:full.t.map(function(t){return -G0a*Math.exp(-a*t);})};
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-60,5],[-8,8]);xt=[-60,-40,-20,0];yt=[-5,0,5];
        poles=[{re:sg,im:w},{re:sg,im:-w},{re:-a,im:0}];apoles=[];yl=[-1.0,1.8];
        var p={re:sg,im:w},f=_w06_div(_w06_c(a,0),_w06_add(p,_w06_c(a,0))),pm=Math.hypot(sg,w);
        note="極の組 "+_w06_ptxt(sg,w,3)+"（原点から "+_w06_sig(pm,3)+" rad/s）、遠い極 −ω<sub>a</sub> = −"+_w06_sig(a,3)+"（原点からの距離の比 "+_w06_sig(a/pm,3)+" 倍）<br>"+
          "遠い極の項の大きさ −G<sub>0</sub>(−ω<sub>a</sub>) = <b>"+_w06_sig(-G0a*100,3)+" %</b>（最終値に対する割合）、極の組の留数に掛かる ω<sub>a</sub>/(p + ω<sub>a</sub>) = "+_w06_sig(_w06_abs(f),3)+" ∠ "+_w06_sig(Math.atan2(f.im,f.re)*180/Math.PI,3)+"°";}
      else if(m===1){var kp=sk.get(),d3=[1,2000,40000,2e6*kp],d2=[1,20,1000*kp];
        var r3=CT.poly.roots(d3),r2=CT.poly.roots(d2),dom=r3.filter(function(z){return z.re>-1000;}),far=r3.filter(function(z){return z.re<=-1000;})[0];
        var sgd=dom.length?Math.max.apply(null,dom.map(function(z){return z.re;})):-10;
        tend=Math.min(1.0,Math.max(0.25,5/Math.max(1,Math.abs(sgd))));
        full=stepOf([2e6*kp],d3,tend,2000);appr=stepOf([1000*kp],d2,tend,2000);
        var wy=Math.max(20,1.3*Math.max.apply(null,r3.concat(r2).map(function(z){return Math.abs(z.im);})));
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-25,10],[-wy,wy]);xt=[-20,-10,0,10];yt=U.nice(-wy,wy,4);
        poles=dom;apoles=r2;yl=[-0.2,2.2];
        var md3=Math.hypot(dom[0].re,dom[0].im);
        note="3 次の式の支配極 <b>"+_w06_ptxt(dom[0].re,Math.abs(dom[0].im),4)+"</b>、二次遅れ（L<sub>a</sub> を無視）の極 "+_w06_ptxt(r2[0].re,Math.abs(r2[0].im),4)+"<br>捨てた極 "+_w06_sig(far.re,4)+"（支配極より原点から "+_w06_sig(Math.abs(far.re)/md3,3)+" 倍遠い）";}
      else if(m===2){var z=sz.get();tend=4;
        full=stepOf([-10/z,10],[1,11,10],tend,N);appr=stepOf([10],[1,10],tend,N);
        var A=10*(-1-z)/(9*z);term={t:full.t,y:full.t.map(function(t){return A*Math.exp(-t);})};
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-12,2],[-3,3]);xt=[-10,-5,0];yt=[-2,0,2];
        poles=[{re:-1,im:0},{re:-10,im:0}];zeros=[{re:z,im:0}];yl=[-0.15,1.15];
        note="零点 "+_w06_f(z,2)+"、遅い極 −1 の項の大きさ <b>"+_w06_sig(A*100,3)+" %</b>（最終値に対する割合。時定数 1 s で消える）";}
      else{var z2=sr.get();tend=8;
        full=stepOf([1,-z2],[1,1,-2],tend,N);appr=stepOf([1],[1,2],tend,N);
        var A2=(1-z2)/3;term={t:full.t,y:full.t.map(function(t){return A2*Math.exp(t);})};
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-3,2],[-2,2]);xt=[-3,-2,-1,0,1,2];yt=[-2,0,2];
        poles=[{re:1,im:0},{re:-2,im:0}];zeros=[{re:z2,im:0}];yl=[-1.5,4];
        note="零点 "+_w06_f(z2,3)+"、e<sup>t</sup> の項の大きさ (1 − z)/3 = <b>"+_w06_sig(A2,3)+"</b>"+(A2>0?"。この項は "+_w06_sig(Math.log(1/A2),3)+" s で 1 を越える":(A2<0?"。この項は "+_w06_sig(Math.log(1/(-A2)),3)+" s で −1 を越える":"。ぴったり打ち消して、項は 0"));}
      PP=P;
      o.push(_w06_sp(U,S,P,xt,yt));
      if(apoles.length)o.push(CT.pz(P,apoles,[],"muted",5));
      o.push(CT.pz(P,poles,zeros,m===3?"alias":"signal",6));
      if(m===0&&sa.get()>60)o.push(S.TX(P.x+4,P.Y(0)-8,"← −ω_a は左の外","start",9,"muted",false,true));
      if(m===1)o.push(S.T(P.x+4,P.y+P.h-6,"捨てた極（約 −2000）は図の外","start",9,"muted",false,false,null,true));
      o.push(S.T(P.x+P.w,P.y-6,m===1?"青: 3 次の式　灰: 二次遅れ":(m===0?"× をドラッグ":"○ をドラッグ"),"end",9,"muted"));
      var qx=nar?52:350,qw=nar?330:330,qy=nar?20+P.h+58:24;
      var all=full.y.concat(appr.y),lo=Math.max(yl[0],Math.min.apply(null,all)-0.05),hi=Math.min(yl[1],Math.max.apply(null,all)+0.05);lo=Math.min(lo,-0.05);hi=Math.max(hi,1.1);
      if(term){term.y.forEach(function(v){if(v<lo&&v>yl[0])lo=v-0.03;});}
      var Q=U.plot(qx,qy,qw,nar?170:200,[0,tend],[lo,hi]);
      o.push(Q.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,5),yt:U.nice(lo,hi,5),xfmt:function(v){return _w06_sig(v,3);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));o.push(Q.line([[0,1],[tend,1]],"faint",1,"3 3"));
      if(m!==3)o.push(S.RECT(Q.x,Q.Y(1.02),Q.w,Q.Y(0.98)-Q.Y(1.02),0,"var(--green-soft)","none",0));
      if(term)o.push(_w06_cl(Q,term.t,term.y,"gold",1.3,"3 3"));
      o.push(_w06_cl(Q,appr.t,appr.y,"muted",1.7,"6 3"));
      o.push(_w06_cl(Q,full.t,full.y,"signal",2.2));
      var ly=qy+(nar?170:200)+48,lg=[["signal",null,m===1?"3 次の式":"元の伝達関数"],["muted","6 3",m===3?"ぴったり打ち消した 1/(s + 2)":(m===2?"相殺した 10/(s + 10)":"支配極だけの近似")]];
      if(term)lg.push(["gold","3 3",m===0?"遠い極の項":(m===2?"極 −1 の項":"e^t の項")]);
      o.push(S.LEGL(qx,ly,lg,9.5,12));
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      var dmax=0;for(i=0;i<full.y.length;i++)dmax=Math.max(dmax,Math.abs(full.y[i]-appr.y[i]));
      var sf=_w06_stats(full.t,full.y,1),sa2=_w06_stats(appr.t,appr.y,1);
      h+=note+"<br>";
      if(m===3){h+="この範囲の差の最大 <b>"+_w06_sig(dmax,3)+"</b>（"+(Math.abs(sr.get()-1)<1e-12?"ぴったり打ち消すと差は 0。ただし、対象の中の自由な動きには e<sup>t</sup> の項が残る":'<span class="warn">わずかなずれでも、e<sup>t</sup> の項が育って差は限りなく大きくなる</span>')+"）";}
      else{var unst=m===1&&poles.some(function(z){return z.re>1e-6;}),lim=m===1&&poles.some(function(z){return Math.abs(z.re)<=1e-6;});
        var mpf=function(v){return v<1e-6?"0":_w06_p3(v*100,3);};
        h+="差の最大 <b>"+_w06_sig(dmax*100,3)+" %</b>（最終値に対する割合）。行き過ぎ量 "+mpf(sf.Mp)+" %（近似 "+mpf(sa2.Mp)+" %）、2 % 整定時間 "+(isFinite(sf.t2)?_w06_sig(sf.t2,3)+" s":"この範囲では落ち着かない")+"（近似 "+(isFinite(sa2.t2)?_w06_sig(sa2.t2,3)+" s":"—")+"）";
        if(unst)h+='<br><span class="warn">3 次の式は不安定（支配極が右半平面）。二次遅れの近似は安定と答える</span>';
        else if(lim)h+='<br><span class="warn">3 次の式は安定限界（支配極が虚軸の上）</span>';}
      ro.innerHTML=h+'<div class="wnote">ステップ応答は、伝達関数を零次ホールドで離散化して求めた。支配極だけの近似は、捨てる因数を 1 に置き換え、最終値（定常ゲイン）をそろえたもの。緑の帯は最終値の ±2 %。</div>';
    }
    sel(false);draw();
  };
