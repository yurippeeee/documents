  /* ===== 17 章 状態空間モデル ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w17_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w17_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w17_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();
    if(s.indexOf("e")>=0){var e=Math.floor(Math.log10(a)),m=v/Math.pow(10,e);s=(+m.toPrecision(d))+" × 10^"+e;}return s.replace(/^-/,"−").replace("^-","^−");}
  /* 複素数の文字（a ± jb の上側、または a + jb） */
  function _w17_cs(re,im,d){d=d||3;if(Math.abs(im)<1e-9*(1+Math.abs(re)))return _w17_sig(re,d);var r=Math.abs(re)<1e-9*(1+Math.abs(im))?"":_w17_sig(re,d);
    return (r?r+(im<0?" − ":" + "):(im<0?"−":""))+"j"+_w17_sig(Math.abs(im),d);}
  /* 2 行 2 列の固有値と固有ベクトル。返り値 {real, l:[λ1, λ2]（実数なら大きい順）, re, im, v:[[..],[..]]（実数のとき。成分の大きい方を 1）} */
  function _w17_eig2(A){var tr=A[0][0]+A[1][1],det=A[0][0]*A[1][1]-A[0][1]*A[1][0],disc=tr*tr/4-det,r={tr:tr,det:det};
    var sc=Math.max(1e-12,Math.abs(A[0][0])+Math.abs(A[0][1])+Math.abs(A[1][0])+Math.abs(A[1][1]));
    if(disc<-1e-12*sc*sc){r.real=false;r.re=tr/2;r.im=Math.sqrt(-disc);return r;}
    var q=Math.sqrt(Math.max(0,disc));r.real=true;r.l=[tr/2+q,tr/2-q];r.rep=q<1e-7*sc;
    r.v=r.l.map(function(l){var a=A[0][1],b=l-A[0][0],c=l-A[1][1],d=A[1][0],v;
      if(Math.abs(a)+Math.abs(b)>=Math.abs(c)+Math.abs(d)&&Math.abs(a)+Math.abs(b)>1e-12*sc)v=[a,b];
      else if(Math.abs(c)+Math.abs(d)>1e-12*sc)v=[c,d];else v=[1,0];
      var m=Math.abs(v[0])>=Math.abs(v[1])?v[0]:v[1];return [v[0]/m,v[1]/m];});
    if(r.rep&&Math.abs(A[0][1])<1e-12*sc&&Math.abs(A[1][0])<1e-12*sc)r.v=[[1,0],[0,1]];
    return r;}
  /* 入力 0 の動き x(t) = e^{At} x0 を、e^{A dt} を掛けて進める。返り値 [[x1, x2], ...]（n+1 点） */
  function _w17_free(U,A,x0,tEnd,n){var E=U.ctl.mat.expm(U.ctl.mat.scale(A,tEnd/n)),x=[x0[0],x0[1]],out=[[x[0],x[1]]];
    for(var k=0;k<n;k++){x=[E[0][0]*x[0]+E[0][1]*x[1],E[1][0]*x[0]+E[1][1]*x[1]];out.push([x[0],x[1]]);}return out;}
  /* 位相平面の流れ（各格子点の A x の向きの小さな矢印） */
  function _w17_field(S,P,A,nx,ny,c,L){var o=[];L=L||8;
    for(var i=0;i<nx;i++)for(var j=0;j<ny;j++){var a=P.xr[0]+(P.xr[1]-P.xr[0])*(i+0.5)/nx,b=P.yr[0]+(P.yr[1]-P.yr[0])*(j+0.5)/ny,
      d=[A[0][0]*a+A[0][1]*b,A[1][0]*a+A[1][1]*b],sx=P.X(a+d[0]*1e-4)-P.X(a),sy=P.Y(b+d[1]*1e-4)-P.Y(b),n=Math.hypot(sx,sy);
      if(n<1e-12)continue;var ux=sx/n*L,uy=sy/n*L,X=P.X(a),Y=P.Y(b);o.push(S.ARR(X-ux/2,Y-uy/2,X+ux/2,Y+uy/2,c||"faint",1,4));}
    return o.join("");}
  /* 原点（または点 c）を通る向き v の直線（枠で切る） */
  function _w17_line(P,v,c,lw,dash,cx,cy){cx=cx||0;cy=cy||0;var R=1e4*(Math.abs(P.xr[1]-P.xr[0])+Math.abs(P.yr[1]-P.yr[0])),n=Math.hypot(v[0],v[1])||1;
    return P.clip([[cx-R*v[0]/n,cy-R*v[1]/n],[cx+R*v[0]/n,cy+R*v[1]/n]],c,lw,dash);}
  /* 枠と原点の軸 */
  function _w17_frame(S,P){var o=S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.8);
    if(P.yr[0]<0&&P.yr[1]>0)o+=S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1);if(P.xr[0]<0&&P.xr[1]>0)o+=S.L(P.X(0),P.y,P.X(0),P.y+P.h,"muted",1);return o;}
  /* 行列（角括弧つき）。rows の要素は文字列（S.TX の書き方）か [文字列, 色]。返り値 {svg, w, h} */
  function _w17_mat(S,x,y,rows,sz,c,gap){sz=sz||10.5;gap=gap||10;var lh=sz*1.5,nc=0;rows.forEach(function(r){nc=Math.max(nc,r.length);});
    function cell(e){return Array.isArray(e)?e:[e,c||"ink"];}
    var cw=[];for(var j=0;j<nc;j++){var m=0;rows.forEach(function(r){if(j<r.length)m=Math.max(m,S.TXW(cell(r[j])[0],sz));});cw.push(m);}
    var w=12+gap*(nc-1),h=lh*rows.length+4,o=[];cw.forEach(function(v){w+=v;});
    o.push(S.W([x+4,y,x,y,x,y+h,x+4,y+h],c||"ink",1.2));o.push(S.W([x+w-4,y,x+w,y,x+w,y+h,x+w-4,y+h],c||"ink",1.2));
    var xx=x+6;for(var j2=0;j2<nc;j2++){rows.forEach(function(r,i){if(j2<r.length){var e=cell(r[j2]);o.push(S.TX(xx+cw[j2]/2,y+2+lh*i+lh*0.7,e[0],"middle",sz,e[1]));}});xx+=cw[j2]+gap;}
    return {svg:o.join(""),w:w,h:h};}
  /* 床と台車（2 章と同じ見た目） */
  function _w17_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  function _w17_cart(S,U,x,y,w,h,c,dash){return S.RECT(x,y,w,h,4,dash?"none":U.soft(c),c,1.5,dash)+S.CIRC(x+w*0.25,y+h+5,5,c,1.4,"var(--screen)",dash)+S.CIRC(x+w*0.75,y+h+5,5,c,1.4,"var(--screen)",dash);}

  /* ---- 2 節: 倒立振子の状態方程式（線形でない式と線形化した式） ---- */
  var _W17_PM=0.5,_W17_Pm=0.2,_W17_PL=0.3,_W17_G=9.81;
  function _w17_pnl(t,x,u){var M=_W17_PM,m=_W17_Pm,l=_W17_PL,g=_W17_G,s=Math.sin(x[2]),c=Math.cos(x[2]);
    var pdd=(u+m*l*x[3]*x[3]*s-m*g*s*c)/(M+m*s*s);return [x[1],pdd,x[3],(g*s-pdd*c)/l];}
  function _w17_plin(t,x,u){var M=_W17_PM,m=_W17_Pm,l=_W17_PL,g=_W17_G;
    return [x[1],-m*g/M*x[2]+u/M,x[3],(M+m)*g/(M*l)*x[2]-u/(M*l)];}
  REG.w17_pendulum=function(el,U){
    var S=U.S,D2R=Math.PI/180,TE=1.5,H=0.001,EV=5;
    U.head(el,"INVERTED PENDULUM","倒立振子の状態方程式 — 線形でない式と線形化した式");
    var r1=U.ctrls(el);
    var sph=U.slider(r1,"初めの傾き φ(0)",{min:-30,max:30,step:0.5,value:1,fmt:function(v){return _w17_f(v,1)+"°";},onInput:function(){run();}});
    var sw=U.slider(r1,"初めの角速度 dφ/dt",{min:-60,max:60,step:0.5,value:0,fmt:function(v){return _w17_f(v,1)+" °/s";},onInput:function(){run();}});
    var sv=U.slider(r1,"初めの台車の速度 ṗ",{min:-1,max:1,step:0.05,value:0,fmt:function(v){return _w17_f(v,2)+" m/s";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var fm=U.select(r2,"台車を押す力 u",["加えない","初めの 0.1 s だけ加える","ずっと加える"],0,function(){run();});
    var fa=U.slider(r2,"力の大きさ",{min:-2,max:2,step:0.1,value:1,fmt:function(v){return _w17_f(v,1)+" N";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 t",{min:0,max:TE,step:0.005,value:0.6,fmt:function(v){return _w17_f(v,3)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.01;if(t>=TE){t=TE;tk.stop();}st.set(t);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=TE-0.001)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(a,w,v,f,F,t){tk.stop();sph.set(a);sw.set(w);sv.set(v);fm.set(f);fa.set(F);st.set(t);run();}
    U.button(br,"本文の例（1° から放す）",function(){pre(1,0,0,0,1,0.61);});
    U.button(br,"5° から",function(){pre(5,0,0,0,1,0.37);});
    U.button(br,"20° から",function(){pre(20,0,0,0,1,0.3);});
    U.button(br,"台車が 0.5 m/s で動いている",function(){pre(1,0,0.5,0,1,0.61);});
    U.button(br,"真上から 0.1 s だけ 1 N で押す",function(){pre(0,0,0,1,1,0.6);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function uf(t){var m=fm.get(),F=fa.get();return m===0?0:(m===1?(t<0.1?F:0):F);}
    function run(){
      var x0=[0,sv.get(),sph.get()*D2R,sw.get()*D2R],xn=x0.slice(),xl=x0.slice(),n=Math.round(TE/H),T=[],N=[],L=[],fallN=null,t;
      for(var k=0;k<=n;k++){t=k*H;if(k%EV===0){T.push(t);N.push(xn.slice());L.push(xl.slice());}
        if(k===n)break;var u=uf(t+H/2);
        if(fallN===null){xn=U.ctl.rk4(function(tt,x){return _w17_pnl(tt,x,u);},t,xn,H);if(Math.abs(xn[2])>=Math.PI/2){fallN=t+H;xn[2]=Math.sign(xn[2])*Math.PI/2;xn[3]=0;xn[1]=0;}}
        if(Math.abs(xl[2])<50)xl=U.ctl.rk4(function(tt,x){return _w17_plin(tt,x,u);},t,xl,H);}
      function cross(arr,deg){var th=deg*D2R;for(var i=1;i<arr.length;i++){var a=Math.abs(arr[i-1][2]),b=Math.abs(arr[i][2]);if(a<th&&b>=th)return T[i-1]+(T[i]-T[i-1])*(th-a)/(b-a);}return null;}
      R={T:T,N:N,L:L,fall:fallN,t10:[cross(N,10),cross(L,10)],t30:[cross(N,30),cross(L,30)]};
      draw();}
    function draw(){
      if(!R)return;var nar=_w17_nar(box),Wd=nar?400:700,o=[],k=Math.min(R.T.length-1,Math.round(st.get()/(H*EV))),tc=R.T[k];
      /* 動く絵 */
      var ax=nar?10:8,aw=nar?380:300,gy=nar?178:200,sc=nar?150:120,Lr=nar?100:110,cw=56,chh=22,cx0=ax+aw/2;
      o.push(S.T(ax,14,"動く絵（振子の長さは拡大して描いた）","start",9.5,"muted"));
      o.push(_w17_ground(S,ax,ax+aw,gy));
      o.push(S.L(cx0,gy+2,cx0,gy+12,"faint",1));o.push(S.T(cx0,gy+24,"p = 0","middle",9,"muted"));
      [[R.L[k],"muted",true],[R.N[k],"signal",false]].forEach(function(q){var x=q[0],px=cx0+Math.max(-aw/2+cw/2,Math.min(aw/2-cw/2,x[0]*sc)),
        a=Math.max(-Math.PI/2,Math.min(Math.PI/2,x[2])),yy=gy-chh-10;
        o.push(_w17_cart(S,U,px-cw/2,yy,cw,chh,q[1],q[2]?"4 3":null));
        var bx=px+Lr*Math.sin(a),by=yy-Lr*Math.cos(a);o.push(S.L(px,yy,bx,by,q[1],q[2]?1.6:2.6,q[2]?"6 4":null));
        o.push(S.CIRC(bx,by,8,q[1],1.6,q[2]?"none":U.soft("signal"),q[2]?"4 3":null));o.push(S.D(px,yy,q[1],3));});
      var uu=uf(tc);if(Math.abs(uu)>1e-9){var cxN=cx0+Math.max(-aw/2+cw/2,Math.min(aw/2-cw/2,R.N[k][0]*sc)),dir=uu>0?1:-1,xa=cxN-dir*(cw/2+38);
        o.push(S.ARR(xa,gy-chh/2-10,xa+dir*34,gy-chh/2-10,"gold",2.4));o.push(S.T(xa+dir*17,gy-chh/2-16,"u","middle",11,"gold",true));}
      if(R.fall!==null&&tc>=R.fall)o.push(S.T(ax+aw-4,30,"線形でない式: "+_w17_f(R.fall,3)+" s に倒れた（90°）","end",9.5,"alias",true,false,null,true));
      o.push(S.T(ax,gy+40,"実線: 線形でない式　破線: 線形化した式","start",9.5,"muted"));
      o.push(S.T(ax+aw,gy+40,"t = "+_w17_f(tc,3)+" s","end",10,"ink",true));
      /* 4 つの状態変数の波形 */
      var defs=[["角度 φ [°]",2,1/D2R],["角速度 dφ/dt [°/s]",3,1/D2R],["台車の位置 p [m]",0,1],["台車の速度 ṗ [m/s]",1,1]];
      var gx0=nar?44:356,gy0=nar?gy+60:22,gw=nar?150:136,gh=nar?96:92,dx=nar?196:174,dy=nar?132:126;
      defs.forEach(function(d,i){var px=gx0+(i%2)*dx,py=gy0+Math.floor(i/2)*dy,lo=0,hi=0;
        R.N.forEach(function(x,j){if(R.fall!==null&&R.T[j]>R.fall)return;var v=x[d[1]]*d[2];lo=Math.min(lo,v);hi=Math.max(hi,v);});
        var lim=1.6*Math.max(Math.abs(lo),Math.abs(hi),1e-6);R.L.forEach(function(x){var v=x[d[1]]*d[2];if(Math.abs(v)<lim){lo=Math.min(lo,v);hi=Math.max(hi,v);}});
        if(hi-lo<1e-9){hi=1;lo=-1;}var pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
        var P=U.plot(px,py,gw,gh,[0,TE],[lo,hi]),yt=U.nice(lo,hi,3).filter(function(v){return v>=lo&&v<=hi;}).map(function(v){return Math.abs(v)<1e-9*(hi-lo)?0:v;});
        o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.6));
        o.push(P.axes({xl:i>=2?"時間 t [s]":null,yt:yt,xt:[0,0.5,1,1.5],xfmt:function(v){return String(v);},yfmt:function(v){return _w17_sig(v,2);},sz:8.5}));
        if(lo<0&&hi>0)o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"faint",1));
        o.push(S.TX(P.x,P.y-5,d[0],"start",9.5,"ink",true));
        o.push(P.clip(R.T.map(function(tt,j){return [tt,R.L[j][d[1]]*d[2]];}),"muted",1.5,"5 3"));
        var nn=[];R.T.forEach(function(tt,j){if(R.fall===null||tt<=R.fall)nn.push([tt,R.N[j][d[1]]*d[2]]);});o.push(P.clip(nn,"signal",1.9));
        if(R.fall!==null&&R.fall<=TE)o.push(S.X(P.X(R.fall),P.Y(nn[nn.length-1][1]),4,"alias",1.8));
        o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"alias",1,"3 3"));});
      box.set(S.svg(Wd,nar?gy0+2*dy+12:gy0+2*dy+14,o));
      /* 読み出し */
      var xn=R.N[k],xl=R.L[k],uu2=uf(tc),fn=_w17_pnl(0,xn,uu2),fl=_w17_plin(0,xl,uu2);
      function vec(x,dot){return "["+[_w17_sig(x[0],3)+" m",_w17_sig(x[1],3)+(dot?" m/s²":" m/s"),_w17_sig(x[2]/D2R,3)+(dot?" °/s":"°"),_w17_sig(x[3]/D2R,3)+(dot?" °/s²":" °/s")].join(", ")+"]";}
      var h="t = "+_w17_f(tc,3)+" s の状態 x = [p, ṗ, φ, dφ/dt]: 線形でない式 <b>"+vec(xn)+"</b>、線形化した式 "+vec(xl)+"<br>";
      if(R.fall!==null&&tc>R.fall)h='<span class="warn">線形でない式の振子は '+_w17_f(R.fall,3)+' s に 90° に達して倒れた（その後は計算しない）</span><br>'+h;
      h+="状態の変わる速さ ẋ: 線形でない式 "+vec(fn,true)+"、線形化した式 Ax + Bu = "+vec(fl,true)+"<br>";
      function tt(v){return v===null?"達しない":_w17_f(v,3)+" s";}
      h+="10° に達する時刻: 線形でない式 <b>"+tt(R.t10[0])+"</b>、線形化した式 <b>"+tt(R.t10[1])+"</b>　30°: <b>"+tt(R.t30[0])+"</b>、<b>"+tt(R.t30[1])+"</b><br>";
      ro.innerHTML=h+'<div class="wnote">本文 2 節の式（台車 0.5 kg、おもり 0.2 kg、長さ 0.3 m、摩擦なし）。線形化した式は A = [0 1 0 0; 0 0 −3.924 0; 0 0 0 1; 0 0 45.78 0]、B = [0 2 0 −6.667]ᵀ。4 次のルンゲ・クッタ法で 1 ms ごとに計算した。線形でない式は、傾きが 90° に達した所で倒れたとして止める。台車の位置の初めの値は 0 とした（位置は振子の動きに入らない）。</div>';
    }
    run();
  };

  /* ---- 4 節: 初めの状態をモードに分ける ---- */
  REG.w17_modes=function(el,U){
    var S=U.S;
    var SYS=[
      {name:"過減衰の台車（c = 20 N·s/m）",A:[[0,1],[-25,-20]],eq:[0,0],xr:[-5,5],yr:[-60,60],xl:"位置 p [cm]",yl:"速度 ṗ [cm/s]",nm:["p","ṗ"],un:["cm","cm/s"],x0:[4,0],tE:4,log:false,ml:["遅いモード","速いモード"],eqn:""},
      {name:"振子の角度と角速度",A:[[0,1],[45.78,0]],eq:[0,0],xr:[-3,3],yr:[-25,25],xl:"角度 φ [°]",yl:"角速度 dφ/dt [°/s]",nm:["φ","dφ/dt"],un:["°","°/s"],x0:[1,0],tE:0.6,log:false,ml:["増えるモード","縮むモード"],eqn:""},
      {name:"モータの電流と角速度（止まった所に 12 V を加える）",A:[[-2000,-20],[2000,0]],eq:[0,600],xr:[-1,7],yr:[-50,650],xl:"電流 i [A]",yl:"角速度 ω_m [rad/s]",nm:["i","ω_m"],un:["A","rad/s"],x0:[0,0],tE:0.3,log:true,ml:["遅いモード","速いモード"],eqn:"落ち着く状態 (0 A, 600 rad/s) からのずれを分ける。"}];
    U.head(el,"MODES","初めの状態をモードに分ける — 固有ベクトルの向きに伸び縮みする成分");
    var r1=U.ctrls(el);
    var ss=U.select(r1,"例",SYS.map(function(s){return s.name;}),0,function(){var s=SYS[ss.get()];setX(s.x0[0],s.x0[1]);sx.refresh();sy.refresh();st.set(0.5);run();});
    var r2=U.ctrls(el);
    function cur(){return SYS[ss.get()];}
    function fx(v){var s=cur();return s.xr[0]+v*(s.xr[1]-s.xr[0]);}
    function fy(v){var s=cur();return s.yr[0]+v*(s.yr[1]-s.yr[0]);}
    var sx=U.slider(r2,"初めの状態（横）",{min:0,max:1,step:0.002,value:0.9,fmt:function(v){var s=cur();return _w17_sig(fx(v),3)+" "+s.un[0];},onInput:function(){run();}});
    var sy=U.slider(r2,"初めの状態（縦）",{min:0,max:1,step:0.002,value:0.5,fmt:function(v){var s=cur();return _w17_sig(fy(v),3)+" "+s.un[1];},onInput:function(){run();}});
    function setX(a,b){var s=cur();sx.set((a-s.xr[0])/(s.xr[1]-s.xr[0]));sy.set((b-s.yr[0])/(s.yr[1]-s.yr[0]));}
    var r3=U.ctrls(el);
    function tOf(f){var s=cur();if(f<=0)return 0;if(!s.log)return f*s.tE;var a=Math.log10(1e-5),b=Math.log10(s.tE);return Math.pow(10,a+f*(b-a));}
    var st=U.slider(r3,"時刻 t",{min:0,max:1,step:0.002,value:0.5,fmt:function(v){return _w17_sig(tOf(v),3)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.006;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    U.button(br,"本文の例",function(){tk.stop();var s=cur();setX(s.x0[0],s.x0[1]);st.set(0.5);run();});
    var b1=U.button(br,"1 番目のモードだけ",function(){tk.stop();onlyMode(0);});
    var b2=U.button(br,"2 番目のモードだけ",function(){tk.stop();onlyMode(1);});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,E=null;
    function onlyMode(i){var s=cur(),v=E.v[i],k=Infinity;
      /* 固有ベクトルの向きで、枠の 7 割に収まる大きさ */
      [[s.xr,v[0],s.eq[0]],[s.yr,v[1],s.eq[1]]].forEach(function(q){if(Math.abs(q[1])>1e-12){var lim=q[1]>0?(q[0][1]-q[2]):(q[2]-q[0][0]);k=Math.min(k,0.7*Math.abs(lim/q[1]));}});
      var sg=(s.eq[1]>0&&v[1]>0)?-1:1;setX(s.eq[0]+sg*k*v[0],s.eq[1]+sg*k*v[1]);st.set(0.5);run();}
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
      var s=cur();setX(Math.max(s.xr[0],Math.min(s.xr[1],PP.ux(x))),Math.max(s.yr[0],Math.min(s.yr[1],PP.uy(y))));run();});
    function run(){var s=cur();E=_w17_eig2(s.A);
      b1.textContent=s.ml[0]+"だけ";b2.textContent=s.ml[1]+"だけ";draw();}
    function draw(){
      var s=cur(),v0=E.v[0],v1=E.v[1],l0=E.l[0],l1=E.l[1],x0=[fx(sx.get()),fy(sy.get())],d=[x0[0]-s.eq[0],x0[1]-s.eq[1]];
      var det=v0[0]*v1[1]-v1[0]*v0[1],a0=(d[0]*v1[1]-v1[0]*d[1])/det,a1=(v0[0]*d[1]-d[0]*v0[1])/det,t=tOf(st.get());
      function at(tt){var e0=a0*Math.exp(l0*tt),e1=a1*Math.exp(l1*tt);return {m0:[e0*v0[0],e0*v0[1]],m1:[e1*v1[0],e1*v1[1]],x:[s.eq[0]+e0*v0[0]+e1*v1[0],s.eq[1]+e0*v0[1]+e1*v1[1]]};}
      var nar=_w17_nar(box),Wd=nar?400:700,o=[],c0=l0>0?"alias":"green",c1="teal";
      /* 位相平面 */
      var P=U.plot(nar?52:56,20,nar?330:290,nar?200:240,s.xr,s.yr);PP=P;
      o.push(_w17_frame(S,P));
      o.push(P.axes({xl:s.xl,yl:null,xfmt:function(v){return _w17_sig(v,3);},yfmt:function(v){return _w17_sig(v,3);}}));
      o.push(S.TX(P.x-40,P.y+P.h/2,s.yl,"middle",10,"muted",false,false,-90));
      o.push(_w17_line(P,v0,c0,1.4,"6 4",s.eq[0],s.eq[1]));o.push(_w17_line(P,v1,c1,1.4,"6 4",s.eq[0],s.eq[1]));
      if(s.eq[0]!==0||s.eq[1]!==0)o.push(S.CIRC(P.X(s.eq[0]),P.Y(s.eq[1]),4,"ink",1.4));
      var tr=[],N=400;for(var i=0;i<=N;i++){var tt=s.log?(i===0?0:Math.pow(10,Math.log10(1e-5)+i/N*(Math.log10(s.tE)-Math.log10(1e-5)))):i/N*s.tE;tr.push(at(tt).x);}
      o.push(P.clip(tr,"signal",1.8));
      var A_=at(t),ex=s.eq[0],ey=s.eq[1];
      [[A_.m0,c0],[A_.m1,c1]].forEach(function(q){var X1=P.X(ex),Y1=P.Y(ey),X2=P.X(ex+q[0][0]),Y2=P.Y(ey+q[0][1]);if(Math.hypot(X2-X1,Y2-Y1)>3)o.push(P.clip([[ex,ey],[ex+q[0][0],ey+q[0][1]]],q[1],2.6));});
      o.push(P.clip([[ex+A_.m0[0],ey+A_.m0[1]],[A_.x[0],A_.x[1]],[ex+A_.m1[0],ey+A_.m1[1]]],"muted",1,"3 3"));
      o.push(S.D(P.X(x0[0]),P.Y(x0[1]),"alias",3.6));
      var inb=A_.x[0]>=s.xr[0]&&A_.x[0]<=s.xr[1]&&A_.x[1]>=s.yr[0]&&A_.x[1]<=s.yr[1];
      if(inb)o.push(S.D(P.X(A_.x[0]),P.Y(A_.x[1]),"signal",5));
      o.push(S.T(P.x+4,P.y+13,"赤い点: 初めの状態（ドラッグで動かす）","start",9,"alias",false,false,null,true));
      /* 時間の波形 */
      var gx=nar?52:410,gw=nar?330:270,gy1=nar?P.y+P.h+58:24,gh=nar?96:100,gy2=gy1+gh+(nar?54:46);
      [[0,gy1],[1,gy2]].forEach(function(q){var j=q[0],T=[],Y=[],M0=[],M1=[],lo=Infinity,hi=-Infinity;
        for(var i=0;i<=N;i++){var tt=s.log?Math.pow(10,Math.log10(1e-5)+i/N*(Math.log10(s.tE)-Math.log10(1e-5))):i/N*s.tE,z=at(tt);
          T.push(tt);Y.push(z.x[j]);M0.push(s.eq[j]+z.m0[j]);M1.push(s.eq[j]+z.m1[j]);}
        [Y,M0,M1].forEach(function(arr){for(var i2=0;i2<arr.length;i2++){if(arr[i2]<lo)lo=arr[i2];if(arr[i2]>hi)hi=arr[i2];}});
        var yr=j===0?s.xr:s.yr;lo=Math.max(lo,yr[0]-(yr[1]-yr[0]));hi=Math.min(hi,yr[1]+(yr[1]-yr[0]));if(hi-lo<1e-9){hi=lo+1;}
        var pad=(hi-lo)*0.08,Q=U.plot(gx,q[1],gw,gh,[s.log?1e-5:0,s.tE],[lo-pad,hi+pad],{xlog:s.log});
        o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"var(--screen)","line",0.6));
        o.push(Q.axes({xl:j===1?"時間 t [s]":null,xt:s.log?[1e-5,1e-4,1e-3,1e-2,0.1]:U.nice(0,s.tE,4),yt:U.nice(lo-pad,hi+pad,3).filter(function(v){return v>=lo-pad&&v<=hi+pad;}),
          xfmt:function(v){return s.log?(v>=0.001?String(v*1000)+" ms":String(Math.round(v*1e6))+" µs"):String(+v.toPrecision(3));},yfmt:function(v){return _w17_sig(v,3);},sz:8.5}));
        o.push(S.TX(Q.x,Q.y-5,(j===0?s.xl:s.yl),"start",9.5,"ink",true));
        o.push(Q.clip(T.map(function(tt,i){return [tt,M0[i]];}),c0,1.6,"6 3"));
        o.push(Q.clip(T.map(function(tt,i){return [tt,M1[i]];}),c1,1.6,"6 3"));
        o.push(Q.clip(T.map(function(tt,i){return [tt,Y[i]];}),"signal",2.2));
        if(t>0||!s.log)o.push(S.L(Q.X(Math.max(t,s.log?1e-5:0)),Q.y,Q.X(Math.max(t,s.log?1e-5:0)),Q.y+Q.h,"alias",1,"3 3"));});
      var ly=nar?gy2+gh+44:P.y+P.h+46;
      o.push(S.LEGL(nar?14:56,ly,[["signal",null,"状態（和）"],[c0,"6 3",s.ml[0]+(s.eqn?"（落ち着く値 + 成分）":"")],[c1,"6 3",s.ml[1]]],9.5));
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      function vs(v){return "["+_w17_sig(v[0],3)+", "+_w17_sig(v[1],3)+"]ᵀ";}
      var h=(s.eqn?s.eqn+"<br>":"");
      h+=s.ml[0]+": λ<sub>1</sub> = <b>"+_w17_sig(l0,4)+"</b> /s（"+(l0<0?"1/|λ| = "+_w17_sig(-1/l0,3)+" s で 1/e に縮む":_w17_sig(Math.LN2/l0,3)+" s ごとに 2 倍に増える")+"）、v<sub>1</sub> = "+vs(v0)+"<br>";
      h+=s.ml[1]+": λ<sub>2</sub> = <b>"+_w17_sig(l1,4)+"</b> /s（"+(l1<0?"1/|λ| = "+_w17_sig(-1/l1,3)+" s で 1/e に縮む":_w17_sig(Math.LN2/l1,3)+" s ごとに 2 倍に増える")+"）、v<sub>2</sub> = "+vs(v1)+"<br>";
      h+="初めの状態の分け方: α<sub>1</sub> = <b>"+_w17_sig(a0,3)+"</b>、α<sub>2</sub> = <b>"+_w17_sig(a1,3)+"</b>（x(0)"+(s.eqn?" − 落ち着く状態":"")+" = α<sub>1</sub>v<sub>1</sub> + α<sub>2</sub>v<sub>2</sub>）<br>";
      h+="t = "+_w17_sig(t,3)+" s: x = ["+_w17_sig(A_.x[0],4)+" "+s.un[0]+", "+_w17_sig(A_.x[1],4)+" "+s.un[1]+"]（"+s.ml[0]+"の成分 × "+_w17_sig(Math.exp(l0*t),3)+"、"+s.ml[1]+"の成分 × "+_w17_sig(Math.exp(l1*t),3)+"）<br>";
      if(l0>0){var sc=Math.abs(a0)/(Math.abs(a0)+Math.abs(a1)+1e-300);h+=(sc<1e-3?'<span class="ok">増えるモードの成分がほぼ 0: 線形化した式では真上へ戻る（少しでもずれると、やがて倒れる）</span>':'<span class="warn">増えるモードの成分があるので、傾きはやがて大きくなり続ける</span>')+"<br>";}
      ro.innerHTML=h+'<div class="wnote">本文 4 節の式 x(t) = α<sub>1</sub>e<sup>λ₁t</sup>v<sub>1</sub> + α<sub>2</sub>e<sup>λ₂t</sup>v<sub>2</sub> で計算した。固有ベクトルは、大きい方の成分を 1 にした。色の太い矢印は、時刻 t の各モードの成分（固有ベクトルの向きのまま伸び縮みする）。'+(s.log?"モータは 2 つのモードの速さが 100 倍違うので、時間の軸を対数にした。":"")+'</div>';
    }
    run();
  };

  /* ---- 5 節: 2 行 2 列の A と、位相平面・固有値・e^{At} ---- */
  REG.w17_phase=function(el,U){
    var S=U.S;
    U.head(el,"PHASE PLANE","2 行 2 列の A — 固有値（s 平面）と位相平面の軌跡");
    var r1=U.ctrls(el),fm=function(v){return _w17_sig(v,4);};
    var s11=U.slider(r1,"a<sub>11</sub>",{min:-50,max:50,step:0.5,value:0,fmt:fm,onInput:function(){run();}});
    var s12=U.slider(r1,"a<sub>12</sub>",{min:-50,max:50,step:0.5,value:1,fmt:fm,onInput:function(){run();}});
    var r2=U.ctrls(el);
    var s21=U.slider(r2,"a<sub>21</sub>",{min:-50,max:50,step:0.5,value:-25,fmt:fm,onInput:function(){run();}});
    var s22=U.slider(r2,"a<sub>22</sub>",{min:-50,max:50,step:0.5,value:-2,fmt:fm,onInput:function(){run();}});
    var r3=U.ctrls(el);
    var sr=U.select(r3,"縦軸（x₂）の範囲",["自動","±1","±2","±5","±10","±20","±50"],0,function(){run();});
    var st=U.slider(r3,"時刻 t",{min:0,max:1,step:0.002,value:0.25,fmt:function(v){return R?_w17_sig(v*R.tE,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.005;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(a,b,c,d){tk.stop();s11.set(a);s12.set(b);s21.set(c);s22.set(d);sr.set(0);st.set(0.25);x0=[1,0];run();}
    var br2=U.btnrow(el);
    U.button(br2,"本文の例（台車 c = 2）",function(){pre(0,1,-25,-2);});
    U.button(br2,"ダンパなし（c = 0）",function(){pre(0,1,-25,0);});
    U.button(br2,"過減衰（c = 20）",function(){pre(0,1,-25,-20);});
    U.button(br2,"臨界減衰（c = 10）",function(){pre(0,1,-25,-10);});
    U.button(br2,"振子の角度",function(){pre(0,1,45.78,0);});
    U.button(br2,"広がる渦巻き（c = −2）",function(){pre(0,1,-25,2);});
    U.button(br2,"対角の A",function(){pre(-2,0,0,-8);});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,R=null,x0=[1,0];
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
      x0=[Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),Math.max(PP.yr[0],Math.min(PP.yr[1],PP.uy(y)))];run(true);});
    function run(keepT){
      var A=[[s11.get(),s12.get()],[s21.get(),s22.get()]],E=_w17_eig2(A),lams=E.real?E.l:[E.re,E.re],mx=0,mn=Infinity;
      (E.real?E.l:[Math.hypot(E.re,E.im)]).forEach(function(l){mx=Math.max(mx,Math.abs(l));});
      var res=E.real?E.l.map(function(l){return Math.abs(l);}):[Math.abs(E.re)];res.forEach(function(v){if(v>1e-6)mn=Math.min(mn,v);});
      var tE;if(!E.real&&Math.abs(E.re)<1e-6)tE=4*Math.PI/Math.max(E.im,1e-6);else if(mn<Infinity)tE=Math.max(0.05,Math.min(30,5/mn));else tE=5;
      if(E.real&&Math.max(E.l[0],E.l[1])>1e-6)tE=Math.max(0.05,Math.min(30,4/Math.max(E.l[0],E.l[1])));
      if(!E.real&&E.re>1e-6)tE=Math.max(0.05,Math.min(30,4/E.re));
      var Rv=[0,1,2,5,10,20,50][sr.get()];
      if(!Rv){var a=Math.abs(A[1][0]),b=Math.abs(A[0][1]),r=1;
        if(a>1e-9&&b>1e-9)r=Math.sqrt(a/b);                                  /* x₂ の大きさは x₁ の √(a₂₁/a₁₂) 倍ほど */
        else if(a>1e-9)r=Math.max(1,a/Math.max(Math.abs(A[0][0]-A[1][1]),1));
        var cands=[1,2,5,10,20,50,100];Rv=cands[cands.length-1];for(var i=0;i<cands.length;i++)if(cands[i]>=1.6*r){Rv=cands[i];break;}}
      R={A:A,E:E,tE:tE,Rv:Rv};if(!keepT)st.refresh();draw();}
    function draw(){
      if(!R)return;var A=R.A,E=R.E,Rv=R.Rv,nar=_w17_nar(box),Wd=nar?400:700,o=[],t=st.get()*R.tE;st.refresh();
      var P=U.plot(nar?52:56,22,nar?330:300,nar?230:270,[-1.5,1.5],[-1.5*Rv,1.5*Rv]);PP=P;
      o.push(_w17_frame(S,P));
      o.push(P.axes({xl:"x₁",yl:null,xt:[-1.5,-1,-0.5,0,0.5,1,1.5],yt:U.nice(-1.5*Rv,1.5*Rv,4),xfmt:function(v){return String(v);},yfmt:function(v){return _w17_sig(v,3);}}));
      o.push(S.T(P.x-40,P.y+P.h/2,"x₂","middle",10.5,"muted",false,false,-90));
      o.push(_w17_field(S,P,A,12,10,"faint",8));
      /* 背景の軌跡 */
      var starts=[];for(var k=0;k<8;k++){var an=2*Math.PI*(k+0.5)/8;starts.push([1.4*Math.cos(an),1.4*Rv*Math.sin(an)]);}
      var grow=(E.real&&Math.max(E.l[0],E.l[1])>1e-6)||(!E.real&&E.re>1e-6);
      if(grow){starts=[];for(var k2=0;k2<8;k2++){var an2=2*Math.PI*(k2+0.5)/8;starts.push([0.08*Math.cos(an2),0.08*Rv*Math.sin(an2)]);}}
      starts.forEach(function(s0){o.push(P.clip(_w17_free(U,A,s0,R.tE,300),"faint",1.1));});
      if(E.real){E.v.forEach(function(v,i){o.push(_w17_line(P,v,E.l[i]<-1e-9?"green":(E.l[i]>1e-9?"alias":"gold"),1.8));});}
      var tr=_w17_free(U,A,x0,R.tE,600);o.push(P.clip(tr,"signal",2.2));
      var k3=Math.min(600,Math.round(st.get()*600)),xt=tr[k3];
      o.push(S.D(P.X(x0[0]),P.Y(x0[1]),"alias",3.8));
      if(xt[0]>=P.xr[0]&&xt[0]<=P.xr[1]&&xt[1]>=P.yr[0]&&xt[1]<=P.yr[1]){o.push(S.D(P.X(xt[0]),P.Y(xt[1]),"signal",5));
        var dv=[A[0][0]*xt[0]+A[0][1]*xt[1],A[1][0]*xt[0]+A[1][1]*xt[1]],sx=P.X(xt[0]+dv[0]*1e-3)-P.X(xt[0]),sy=P.Y(xt[1]+dv[1]*1e-3)-P.Y(xt[1]),nn=Math.hypot(sx,sy);
        if(nn>1e-9)o.push(S.ARR(P.X(xt[0]),P.Y(xt[1]),P.X(xt[0])+sx/nn*30,P.Y(xt[1])+sy/nn*30,"gold",2,6));}
      o.push(S.T(P.x+4,P.y+13,"位相平面（ドラッグで初めの状態）","start",9,"muted",false,false,null,true));
      /* s 平面 */
      var lam=E.real?[[E.l[0],0],[E.l[1],0]]:[[E.re,E.im],[E.re,-E.im]],m=0;lam.forEach(function(z){m=Math.max(m,Math.abs(z[0]),Math.abs(z[1]));});
      var sR=[1,2,5,10,20,50,100].filter(function(v){return v>=1.15*m;})[0]||200;
      var sx0=nar?52:410,sw=nar?330:270,sh=nar?110:120,sy0=nar?P.y+P.h+52:22;
      var Q=U.plot(sx0,sy0,sw,sh,[-sR,sR],[-sR*sh/sw,sR*sh/sw]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"var(--screen)","line",0.8));o.push(U.ctl.splane(Q));
      o.push(Q.axes({xl:"実部 [1/s]",yl:null,xt:[-sR,-sR/2,0,sR/2,sR],yt:[],xfmt:function(v){return _w17_sig(v,3);}}));
      o.push(U.ctl.pz(Q,lam.map(function(z){return {re:z[0],im:z[1]};}),[],"signal",5.5));
      o.push(S.T(Q.x+4,Q.y+12,"s 平面: A の固有値","start",9,"muted",false,false,null,true));
      /* 時間の波形 */
      var gy=sy0+sh+(nar?52:50),gh=nar?100:96,T=[],X1=[],X2=[];
      for(var i=0;i<=600;i++){T.push(i/600*R.tE);X1.push(tr[i][0]);X2.push(tr[i][1]/Rv);}
      var G=U.plot(sx0,gy,sw,gh,[0,R.tE],[-1.6,1.6]);
      o.push(S.RECT(G.x,G.y,G.w,G.h,0,"var(--screen)","line",0.6));
      o.push(G.axes({xl:"時間 t [s]",xt:U.nice(0,R.tE,4),yt:[-1,0,1],xfmt:function(v){return String(+v.toPrecision(3));},yfmt:function(v){return String(v);},sz:8.5}));
      o.push(G.clip(T.map(function(tt,j){return [tt,X1[j]];}),"signal",2));
      o.push(G.clip(T.map(function(tt,j){return [tt,X2[j]];}),"teal",1.8,"6 3"));
      o.push(S.L(G.X(t),G.y,G.X(t),G.y+G.h,"alias",1,"3 3"));
      o.push(S.LEGL(G.x,G.y+G.h+44,[["signal",null,"x₁"],["teal","6 3","x₂ ÷ "+Rv]],9.5));
      box.set(S.svg(Wd,G.y+G.h+52,o));
      /* 読み出し */
      var h="",kind;
      if(!E.real){h+="固有値: <b>"+_w17_cs(E.re,E.im,3)+"</b> と <b>"+_w17_cs(E.re,-E.im,3)+"</b>（共役な複素数の組）<br>";
        kind=Math.abs(E.re)<1e-6?'<span class="warn">楕円: 回り続ける（安定限界）</span>':(E.re<0?'<span class="ok">渦巻き: 回りながら原点へ縮む（安定）</span>':'<span class="warn">広がる渦巻き: 回りながら外へ広がる（不安定）</span>');
        h+=kind+"（回る速さ "+_w17_sig(E.im,3)+" rad/s、縮み方・広がり方 e<sup>"+_w17_sig(E.re,3)+"t</sup>）<br>";}
      else{h+="固有値: <b>"+_w17_sig(E.l[0],4)+"</b> と <b>"+_w17_sig(E.l[1],4)+"</b>（実数）";
        if(!E.rep)h+="、固有ベクトル ["+_w17_sig(E.v[0][0],3)+", "+_w17_sig(E.v[0][1],3)+"]ᵀ と ["+_w17_sig(E.v[1][0],3)+", "+_w17_sig(E.v[1][1],3)+"]ᵀ";
        h+="<br>";var a=E.l[0],b=E.l[1];
        kind=E.rep?(a<0?'<span class="ok">固有値が重なる（臨界減衰の形）: 回らずに縮む</span>':'<span class="warn">固有値が重なる: 原点へ縮まない</span>'):
          (a<-1e-9&&b<-1e-9?'<span class="ok">結節: 回らずに、遅い固有値の固有ベクトルに沿って原点へ（安定）</span>':
          (a>1e-9&&b>1e-9?'<span class="warn">広がる結節: 回らずに原点から離れる（不安定）</span>':
          (a>1e-9&&b<-1e-9?'<span class="warn">鞍点: 負の固有値の直線の上だけ原点へ近づき、ほかは遠ざかる（不安定）</span>':'<span class="warn">固有値 0 を含む: その固有ベクトルの向きの点は動かない</span>')));
        h+=kind+"<br>";}
      var EA=U.ctl.mat.expm(U.ctl.mat.scale(A,t));
      h+="t = "+_w17_sig(t,3)+" s の e<sup>At</sup> = [ "+_w17_sig(EA[0][0],4)+"  "+_w17_sig(EA[0][1],4)+" ; "+_w17_sig(EA[1][0],4)+"  "+_w17_sig(EA[1][1],4)+" ]、x(t) = e<sup>At</sup>x(0) = ["+_w17_sig(tr[Math.min(600,Math.round(st.get()*600))][0],4)+", "+_w17_sig(tr[Math.min(600,Math.round(st.get()*600))][1],4)+"]ᵀ（x(0) = ["+_w17_sig(x0[0],3)+", "+_w17_sig(x0[1],3)+"]ᵀ）<br>";
      ro.innerHTML=h+'<div class="wnote">入力 0 の状態方程式 ẋ = Ax。軌跡は e<sup>AΔt</sup> を掛けて進めた（Δt は表示の時間の 1/600）。灰色の矢印は各点の Ax の向き、金色の矢印は時刻 t の点の状態の変わる向き。縦軸の範囲は、a<sub>21</sub> と a<sub>12</sub> の比から自動で決める（選べる）。時間の範囲は、固有値の実部から決める。</div>';
    }
    run();
  };

  /* ---- 6 節: 伝達関数の係数から、可制御正準形と対角正準形を作る ---- */
  REG.w17_realize=function(el,U){
    var S=U.S,ctl=U.ctl,cx=ctl.cx;
    var PRE=[["本文の例（モータの角速度）","2e6","1, 2000, 40000"],["台車とばね・ダンパ","1","1, 2, 25"],["過減衰の台車（c = 20）","1","1, 20, 25"],
      ["3 次の例 (s + 2)/{(s + 1)(s + 3)(s + 5)}","1, 2","1, 9, 23, 15"],["倒立振子の G_pu","2, 0, -65.4","1, 0, -45.78, 0, 0"],
      ["極零相殺（4 節）(s − 1)/{(s − 1)(s + 2)}","1, -1","1, 1, -2"],["プロパー（D ≠ 0）(0.1s + 1)/(0.5s + 1)","0.1, 1","0.5, 1"]];
    U.head(el,"REALIZATION","伝達関数から状態空間モデルへ — 可制御正準形と対角正準形");
    var r1=U.ctrls(el);
    var sp=U.select(r1,"例",PRE.map(function(p){return p[0];}),0,function(){var p=PRE[sp.get()];tn.set(p[1]);td.set(p[2]);run();});
    var r2=U.ctrls(el);
    var tn=U.textin(r2,"分子の係数（高い次から）","2e6",function(){run();},{width:"200px"});
    var td=U.textin(r2,"分母の係数（高い次から）","1, 2000, 40000",function(){run();},{width:"200px"});
    var box=U.svgbox(el),ro=U.readout(el);
    function parse(s){var a=String(s).replace(/−/g,"-").split(/[,\s]+/).filter(function(x){return x.length;}).map(Number);if(!a.length||a.some(function(x){return !isFinite(x);}))return null;return a;}
    function run(){
      var num=parse(tn.get()),den=parse(td.get()),o=[],nar=_w17_nar(box),Wd=nar?400:700;
      if(!num||!den){ro.innerHTML='<span class="warn">係数は、数をコンマか空白で区切って入れる（例: 1, 2000, 40000）</span>';box.set("");return;}
      den=ctl.poly.trim(den);num=ctl.poly.trim(num);
      if(den.length<2||den[0]===0){ro.innerHTML='<span class="warn">分母は 1 次以上にする</span>';box.set("");return;}
      var n=den.length-1;if(n>4){ro.innerHTML='<span class="warn">このデモは 4 次までにした</span>';box.set("");return;}
      if(num.length-1>n){ro.innerHTML='<span class="warn">分子の次数が分母より高い（プロパーでない）ので、状態空間モデルにできない</span>';box.set("");return;}
      var a0=den[0],dn=den.map(function(v){return v/a0;}),nm=num.map(function(v){return v/a0;});
      while(nm.length<dn.length)nm.unshift(0);
      var Dd=nm[0],bp=nm.map(function(v,i){return v-Dd*dn[i];}).slice(1);   /* 厳密にプロパーな部分の分子（高い次から、n 個） */
      var A=[],B=[],C=[[]],i,j;for(i=0;i<n;i++){var row=[];for(j=0;j<n;j++)row.push(i<n-1?(j===i+1?1:0):-dn[n-j]);A.push(row);B.push([i===n-1?1:0]);}
      for(j=0;j<n;j++)C[0].push(bp[n-1-j]);
      /* 固有値（分母の根）と、相殺の後の極 */
      var ev=ctl.poly.roots(dn),zs=ctl.poly.trim(nm).length>1?ctl.poly.roots(ctl.poly.trim(nm)):[],used=[],poles=[];
      var scl=1;ev.forEach(function(z){scl=Math.max(scl,cx.abs(z));});
      ev.forEach(function(p){var hit=-1;zs.forEach(function(z,k){if(hit<0&&used.indexOf(k)<0&&cx.abs(cx.sub(z,p))<1e-6*(1+cx.abs(p)))hit=k;});if(hit>=0)used.push(hit);else poles.push(p);});
      var distinct=true;for(i=0;i<n;i++)for(j=i+1;j<n;j++)if(cx.abs(cx.sub(ev[i],ev[j]))<1e-6*scl)distinct=false;
      var dden=ctl.poly.deriv(dn),res=distinct?ev.map(function(l){return cx.div(ctl.poly.valc(bp,l),ctl.poly.valc(dden,l));}):null;
      var allReal=ev.every(function(z){return Math.abs(z.im)<1e-9*(1+cx.abs(z));});
      /* 時間の範囲 */
      var mre=-Infinity,minS=Infinity,mabs=0;ev.forEach(function(z){mre=Math.max(mre,z.re);mabs=Math.max(mabs,cx.abs(z));if(z.re<-1e-9)minS=Math.min(minS,-z.re);});
      var tE=mre>1e-9?Math.min(20,Math.max(0.05,4/mre)):(mre>-1e-9?(mabs>1e-9?Math.min(20,Math.max(0.05,25/mabs)):5):Math.min(200,Math.max(0.005,6/minS)));
      tE=+tE.toPrecision(2);
      /* ステップ応答: 可制御正準形（零次ホールドで厳密）、対角正準形（式）、伝達関数（U.ctl.step） */
      var N=600,h=tE/N,dd=ctl.mat.c2d(A,B,h),x=ctl.mat.zeros(n,1),T=[],Ycc=[],Ydg=[],Xcc=[],Xdg=[];
      for(var k=0;k<=N;k++){var t=k*h,y=Dd;for(i=0;i<n;i++)y+=C[0][i]*x[i][0];T.push(t);Ycc.push(y);Xcc.push(x.map(function(r){return r[0];}));
        if(res){var yd=Dd,xs=[];ev.forEach(function(l,q){var f=cx.abs(l)<1e-12?cx.c(t,0):cx.div(cx.sub(cx.exp(cx.scale(l,t)),cx.c(1,0)),l);xs.push(f.re);yd+=cx.mul(res[q],f).re;});Ydg.push(yd);Xdg.push(xs);}
        x=ctl.mat.add(ctl.mat.mul(dd.A,x),ctl.mat.scale(dd.B,1));}
      var Ytf=ctl.step(ctl.tf(num,den),tE,N).y,dmax=0;for(k=0;k<=N;k++){dmax=Math.max(dmax,Math.abs(Ycc[k]-Ytf[k]));if(res)dmax=Math.max(dmax,Math.abs(Ycc[k]-Ydg[k]));}
      var ymax=0;Ycc.forEach(function(v){ymax=Math.max(ymax,Math.abs(v));});
      /* 図: 行列 */
      var fm=function(v){return _w17_sig(v,4);},sz=nar?9.5:10;
      o.push(S.T(10,16,"可制御正準形","start",10.5,"signal",true));
      var mA=_w17_mat(S,34,24,A.map(function(r){return r.map(fm);}),sz),y0=24;
      o.push(S.TX(8,y0+mA.h/2+4,"A =","start",sz,"ink"));o.push(mA.svg);
      var xB=34+mA.w+30,mB=_w17_mat(S,xB,y0,B.map(function(r){return r.map(fm);}),sz);o.push(S.TX(xB-26,y0+mA.h/2+4,"B =","start",sz,"ink"));o.push(mB.svg);
      var yC=y0+mA.h+12,mC=_w17_mat(S,34,yC,[C[0].map(fm)],sz);o.push(S.TX(8,yC+mC.h/2+4,"C =","start",sz,"ink"));o.push(mC.svg);
      o.push(S.TX(34+mC.w+14,yC+mC.h/2+4,"D = "+fm(Dd),"start",sz,"ink"));
      var yD=yC+mC.h+28;
      o.push(S.T(10,yD,"対角正準形（固有ベクトルの大きさは b̃ᵢ = 1 にそろえた）","start",10.5,"green",true));
      if(res){var mL=_w17_mat(S,34,yD+8,ev.map(function(l,q){return ev.map(function(_,r){return r===q?_w17_cs(l.re,l.im,4):"0";});}),sz);
        o.push(S.TX(8,yD+8+mL.h/2+4,"Λ =","start",sz,"ink"));o.push(mL.svg);
        var yR=yD+8+mL.h+12,mR=_w17_mat(S,34,yR,[res.map(function(r){return _w17_cs(r.re,r.im,4);})],sz);
        o.push(S.TX(8,yR+mR.h/2+4,"C̃ =","start",sz,"ink"));o.push(mR.svg);
        o.push(S.T(34,yR+mR.h+16,"（C̃ の要素が留数。B̃ = [1 … 1]ᵀ）","start",9,"muted"));var yEnd=yR+mR.h+22;}
      else{o.push(S.T(14,yD+24,"固有値が重なり、固有ベクトルが足りないので、","start",9.5,"alias",true));o.push(S.T(14,yD+40,"対角正準形にできない","start",9.5,"alias",true));var yEnd2=yD+48;}
      var leftH=res?yEnd:yEnd2;
      /* s 平面 */
      var px=nar?52:380,py=nar?leftH+24:22,pw=nar?330:300,ph=nar?120:120,m=0;ev.forEach(function(z){m=Math.max(m,Math.abs(z.re),Math.abs(z.im));});
      var sR=[1,2,5,10,20,50,100,200,500,1000,2000,5000].filter(function(v){return v>=1.15*m;})[0]||1e4;
      var Q=U.plot(px,py,pw,ph,[-sR,sR*0.25],[-sR*ph/pw*1.25,sR*ph/pw*1.25]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"var(--screen)","line",0.8));o.push(ctl.splane(Q));
      o.push(Q.axes({xl:"実部 [1/s]",xt:[-sR,-sR/2,0],yt:[],xfmt:function(v){return _w17_sig(v,3);}}));
      ev.forEach(function(z){if(z.re>=Q.xr[0]&&z.re<=Q.xr[1])o.push(S.RECT(Q.X(z.re)-8,Q.Y(z.im)-8,16,16,2,"none","muted",1.6));});
      o.push(ctl.pz(Q,poles,[],"signal",5));
      o.push(S.T(Q.x+4,Q.y+12,"□ A の固有値　× 伝達関数の極","start",9,"muted",false,false,null,true));
      /* ステップ応答 */
      var gy=py+ph+52,gh=nar?100:110,lo=0,hi=0;Ycc.forEach(function(v){lo=Math.min(lo,v);hi=Math.max(hi,v);});
      var lim=Math.max(hi-lo,1e-9);var G=U.plot(px,gy,pw,gh,[0,tE],[lo-0.08*lim,hi+0.08*lim]);
      o.push(S.RECT(G.x,G.y,G.w,G.h,0,"var(--screen)","line",0.6));
      o.push(G.axes({xl:null,xt:U.nice(0,tE,4),yt:U.nice(lo,hi,3),xfmt:function(v){return String(+v.toPrecision(3));},yfmt:function(v){return _w17_sig(v,3);},sz:8.5}));
      o.push(S.T(G.x,G.y-6,"ステップ応答 y（3 通りの計算）","start",9.5,"ink",true));
      o.push(G.clip(T.map(function(t,k){return [t,Ycc[k]];}),"signal",4));
      if(res)o.push(G.clip(T.map(function(t,k){return [t,Ydg[k]];}),"green",2,"6 4"));
      o.push(G.clip(T.map(function(t,k){return [t,Ytf[k]];}),"ink",1.2,"2 3"));
      /* 状態変数（大きさをそろえた） */
      var g2=gy+gh+46,H2=U.plot(px,g2,pw,gh,[0,tE],[-1.1,1.1]),cols=["signal","teal","purple","gold"];
      o.push(S.RECT(H2.x,H2.y,H2.w,H2.h,0,"var(--screen)","line",0.6));
      o.push(H2.axes({xl:"時間 t [s]",xt:U.nice(0,tE,4),yt:[-1,0,1],xfmt:function(v){return String(+v.toPrecision(3));},yfmt:function(v){return String(v);},sz:8.5}));
      o.push(S.T(H2.x,H2.y-6,"状態変数（それぞれの最大で割った）: 実線 可制御正準形"+(res&&allReal?"、破線 対角正準形":""),"start",9,"ink",true));
      for(i=0;i<n;i++){var mxv=0;Xcc.forEach(function(v){mxv=Math.max(mxv,Math.abs(v[i]));});mxv=mxv||1;o.push(H2.clip(T.map(function(t,k){return [t,Xcc[k][i]/mxv];}),cols[i],1.7));
        if(res&&allReal){var mxd=0;Xdg.forEach(function(v){mxd=Math.max(mxd,Math.abs(v[i]));});mxd=mxd||1;o.push(H2.clip(T.map(function(t,k){return [t,Xdg[k][i]/mxd];}),cols[i],1.4,"5 3"));}}
      var Hh=Math.max(leftH,g2+gh+40);box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var hh="";
      hh+="固有値（分母 = 0 の根）: <b>"+ev.map(function(z){return _w17_cs(z.re,z.im,4);}).join("、")+"</b><br>";
      hh+="伝達関数の極（相殺の後）: <b>"+(poles.length?poles.map(function(z){return _w17_cs(z.re,z.im,4);}).join("、"):"なし")+"</b>"+(poles.length<n?'　<span class="warn">相殺で消えた固有値がある（出力に現れないモード）</span>':"")+"<br>";
      if(res)hh+="留数 c̃ᵢb̃ᵢ: "+res.map(function(r,q){return _w17_cs(r.re,r.im,4)+"（λ = "+_w17_cs(ev[q].re,ev[q].im,3)+"）";}).join("、")+"<br>";
      hh+="3 通りの計算の出力の差の最大: "+_w17_sig(dmax,2)+"（出力の大きさ "+_w17_sig(ymax,3)+" に対して）"+(dmax<=1e-6*Math.max(ymax,1e-12)?' <span class="ok">一致</span>':'')+"<br>";
      ro.innerHTML=hh+'<div class="wnote">可制御正準形は本文 6 節の形（A の最後の行が −a₀, …, −a_{n−1}、B = [0 … 0 1]ᵀ、C = [b₀ … b_{n−1}]）。分母の最も高い次の係数で全体を割ってから作る。可制御正準形の応答は零次ホールドで厳密に離散化して、対角正準形の応答は各モードの式 (e<sup>λt</sup> − 1)/λ の和で、伝達関数の応答は共通部品の step で計算した。</div>';
    }
    run();
  };
