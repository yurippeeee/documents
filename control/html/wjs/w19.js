  /* ===== 19 章 最適レギュレータ ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w19_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w19_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w19_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);if(a>=Math.pow(10,d))return String(Math.round(v)).replace("-","−");
    var s=(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace("-","−");}
  function _w19_n(v){if(Math.abs(v)<1e-12)return "0";return String(+(+v).toPrecision(3)).replace("-","−");}   /* 目盛の数（末尾の 0 を付けない） */
  /* 複素数の極の文字（a ± jb の上側） */
  function _w19_cs(z,d){d=d||3;if(Math.abs(z.im)<1e-6*(1+Math.abs(z.re)))return _w19_g(z.re,d);return _w19_g(z.re,d)+" ± j"+_w19_g(Math.abs(z.im),d);}
  function _w19_poles(rs){var out=[];rs.forEach(function(z){if(z.im<-1e-6*(1+Math.abs(z.re)))return;out.push(_w19_cs(z,3));});return out.join("、");}
  /* 倒立振子（17 章 2 節の例の値） */
  var _W19_M=0.5,_W19_m=0.2,_W19_l=0.3,_W19_G=9.81,_W19_D2R=Math.PI/180;
  var _W19_A=[[0,1,0,0],[0,0,-_W19_m*_W19_G/_W19_M,0],[0,0,0,1],[0,0,(_W19_M+_W19_m)*_W19_G/(_W19_M*_W19_l),0]];
  var _W19_B=[[0],[1/_W19_M],[0],[-1/(_W19_M*_W19_l)]];
  /* ブライソンの規則の重みで最適レギュレータを解く（phmax が null なら角度は評価しない）。返り値 {F:[4], X, Q:[4], R} */
  function _w19_design(U,pmax,phmax,umax){var q=[1/(pmax*pmax),0,phmax==null?0:1/Math.pow(phmax*_W19_D2R,2),0],Q=U.ctl.mat.zeros(4,4);
    for(var i=0;i<4;i++)Q[i][i]=q[i];var R=1/(umax*umax),r=U.ctl.mat.lqr(_W19_A,_W19_B,Q,[[R]]);return {F:r.F[0].slice(),X:r.X,Q:q,R:R};}
  function _w19_acker(U,poles){return U.ctl.mat.acker(_W19_A,_W19_B,poles.map(function(p){return U.ctl.c(p[0],p[1]||0);}))[0].slice();}
  function _w19_eig(U,F){var A=U.ctl.mat.sub(_W19_A,U.ctl.mat.mul(_W19_B,[F]));return U.ctl.mat.eig(A);}
  /* 線形でない式に u = −k F x(t − L) を加えて 4 次のルンゲ・クッタ法で解く。
     o = {T, h（既定 1 ms）, umax（飽和）, push:[開始, 長さ, 力]（おもりを押す。刻みの間は一定）, k（力の倍率）, L（むだ時間 [s]）, lin（線形化した式）, every（記録の間引き）}。
     むだ時間があるときは、刻みの始めの、L だけ前の状態で決めた力を刻みの間保つ。返り値 {t, x:[[p,ṗ,φ,φ̇]], u, fall（倒れた時刻か null）} */
  function _w19_sim(U,F,x0,o){var h=o.h||0.001,n=Math.round(o.T/h),ev=o.every||1,k=o.k==null?1:o.k,dl=o.L?Math.round(o.L/h):0,M=_W19_M,m=_W19_m,l=_W19_l,g=_W19_G;
    var x=x0.slice(),hist=dl?[x.slice()]:null,res={t:[0],x:[x.slice()],u:[],fall:null},fd=0,uh=0;
    function cu(z){var u=-k*(F[0]*z[0]+F[1]*z[1]+F[2]*z[2]+F[3]*z[3]);if(o.umax!=null)u=Math.max(-o.umax,Math.min(o.umax,u));return u;}
    function f(t,z){var u=dl?uh:cu(z);
      if(o.lin)return [z[1],(u+fd-m*g*z[2])/M,z[3],((M+m)*g*z[2]-u-fd)/(M*l)+fd/(m*l)];
      var s=Math.sin(z[2]),c=Math.cos(z[2]),pdd=(u+fd-m*g*s*c-fd*c*c+m*l*z[3]*z[3]*s)/(M+m*s*s);return [z[1],pdd,z[3],(g*s-pdd*c+fd/m*c)/l];}
    for(var i=0;i<n;i++){var tm=(i+0.5)*h;fd=(o.push&&tm>=o.push[0]&&tm<o.push[0]+o.push[1])?o.push[2]:0;
      if(dl){var xd=i-dl>=0?hist[i-dl]:hist[0];uh=cu(xd);}
      if(i===0)res.u.push(dl?uh:cu(x));
      x=U.ctl.rk4(f,i*h,x,h);if(dl)hist.push(x.slice());
      if((i+1)%ev===0){res.t.push((i+1)*h);res.x.push(x.slice());res.u.push(dl?cu(i+1-dl>=0?hist[i+1-dl]:hist[0]):cu(x));}
      if(Math.abs(x[2])>Math.PI/2||!isFinite(x[2])){res.fall=(i+1)*h;if((i+1)%ev!==0){res.t.push((i+1)*h);res.x.push(x.slice());res.u.push(cu(x));}break;}}
    return res;}
  /* |y| が tol 以下に入って、その後出ない時刻（最後に出た所を線形補間）。入らなければ Infinity */
  function _w19_settle(t,y,tol){var last=-1;for(var i=0;i<y.length;i++)if(Math.abs(y[i])>tol)last=i;if(last<0)return 0;if(last+1>=y.length)return Infinity;
    var a=Math.abs(y[last]),b=Math.abs(y[last+1]);return t[last]+(t[last+1]-t[last])*(a-tol)/(a-b);}
  function _w19_maxabs(arr){var m=0;for(var i=0;i<arr.length;i++){var v=Math.abs(arr[i]);if(v>m)m=v;}return m;}
  function _w19_minmax(arr){var lo=Infinity,hi=-Infinity;for(var i=0;i<arr.length;i++){var v=arr[i];if(v<lo)lo=v;if(v>hi)hi=v;}return [lo,hi];}
  function _w19_col(res,j,sc){var o=new Array(res.x.length);for(var i=0;i<res.x.length;i++)o[i]=res.x[i][j]*sc;return o;}
  /* 床と台車と振子（17 章と同じ見た目）。cx は台車の中心の x、gy は床の y、ph は角度 [rad] */
  function _w19_pend(S,U,cx,gy,ph,c,Lr,dash){var cw=52,chh=20,yy=gy-chh-10,o=[];
    o.push(S.RECT(cx-cw/2,yy,cw,chh,4,dash?"none":U.soft(c),c,1.5,dash));o.push(S.CIRC(cx-cw*0.25,yy+chh+5,5,c,1.4,"var(--screen)",dash));o.push(S.CIRC(cx+cw*0.25,yy+chh+5,5,c,1.4,"var(--screen)",dash));
    var a=Math.max(-Math.PI/2,Math.min(Math.PI/2,ph)),bx=cx+Lr*Math.sin(a),by=yy-Lr*Math.cos(a);
    o.push(S.L(cx,yy,bx,by,c,2.4,dash?"6 4":null));o.push(S.CIRC(bx,by,7,c,1.6,dash?"none":U.soft(c),dash));o.push(S.D(cx,yy,c,2.6));return o.join("");}
  function _w19_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  /* 小さな時間の波形の枠。series = [[t[], y[], 色, 破線]]。返り値 {svg, P} */
  function _w19_wave(S,U,x,y,w,h,T,lo,hi,title,series,tc,xl){if(hi-lo<1e-9){hi=lo+1;}var P=U.plot(x,y,w,h,[0,T],[lo,hi]),o=[];
    o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.6));
    var yt=U.nice(lo,hi,3).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;}).map(function(v){return Math.abs(v)<1e-9*(hi-lo)?0:v;});
    o.push(P.axes({xl:xl?"時間 t [s]":null,yt:yt,xt:U.nice(0,T,4).filter(function(v){return v<=T+1e-9;}),xfmt:function(v){return String(+v.toFixed(3));},yfmt:_w19_n,sz:8.5}));
    if(lo<0&&hi>0)o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"faint",1));
    o.push(S.TX(P.x,P.y-5,title,"start",9.5,"ink",true));
    series.forEach(function(s){var pts=[];for(var i=0;i<s[0].length;i++)pts.push([s[0][i],s[1][i]]);o.push(P.clip(pts,s[2],s[4]||1.8,s[3]));});
    if(tc!=null)o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"alias",1,"3 3"));
    return {svg:o.join(""),P:P};}
  function _w19_range(arrs,pad,minspan){var lo=Infinity,hi=-Infinity;arrs.forEach(function(a){var r=_w19_minmax(a);lo=Math.min(lo,r[0]);hi=Math.max(hi,r[1]);});
    if(!isFinite(lo)){lo=-1;hi=1;}if(hi-lo<minspan){var c=(hi+lo)/2;lo=c-minspan/2;hi=c+minspan/2;}var p=(hi-lo)*pad;return [lo-p,hi+p];}
  /* ∫ y² dt（台形） */
  function _w19_isq(t,y,sc){var s=0;for(var i=1;i<t.length;i++){var a=y[i-1]*sc,b=y[i]*sc;s+=(t[i]-t[i-1])*(a*a+b*b)/2;}return s;}

  /* ---- 2 節: 1 次の系（ばねの無い台車）の最適ゲイン ---- */
  REG.w19_scalar=function(el,U){
    var S=U.S;
    U.head(el,"SCALAR LQR","状態が 1 つの対象の最適ゲイン — J の谷・極・応答");
    var r1=U.ctrls(el);
    var sc=U.slider(r1,"台車の減衰係数 c（a = −c）",{min:-4,max:4,step:0.5,value:2,fmt:function(v){return _w19_f(v,1)+" N·s/m";},onInput:draw});
    var sq=U.slider(r1,"重みの比 Q/R",{min:0.1,max:10000,log:true,value:96,fmt:function(v){return _w19_g(v,3)+" (N/(m/s))²";},onInput:draw});
    var r2=U.ctrls(el);
    var sf=U.slider(r2,"比べるゲイン F（手で選ぶ）",{min:0,max:60,step:0.1,value:4,fmt:function(v){return _w19_f(v,1)+" N/(m/s)";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（c = 2、Q/R = 96、F = 4 と比べる）",function(){sc.set(2);sq.set(96);sf.set(4);draw();});
    U.button(br,"Q/R = 5",function(){sc.set(2);sq.set(5);sf.set(3);draw();});
    U.button(br,"負の減衰の仮の台車（c = −2）",function(){sc.set(-2);sq.set(5);sf.set(4.5);draw();});
    U.button(br,"F を最適な値に合わせる",function(){var a=-sc.get(),QR=sq.get();sf.set(Math.round((a+Math.sqrt(a*a+QR))*10)/10);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var a=-sc.get(),b=1,QR=sq.get(),R=1,Q=QR*R,Fm=sf.get(),v0=1;
      var sgo=Math.sqrt(a*a+b*b*QR),Fo=(a+sgo)/b,X=R*Fo/b,Jmin=X*v0*v0;
      var stab=b*Fm-a>0,sgm=b*Fm-a,Jm=stab?(Q+R*Fm*Fm)*v0*v0/(2*sgm):Infinity;
      function Jof(F){var s=b*F-a;return s>0?(Q+R*F*F)*v0*v0/(2*s):Infinity;}
      var nar=_w19_nar(box),Wd=nar?400:700,o=[];
      /* (1) J の谷 */
      var Fmax=Math.max(10,Math.ceil(Math.max(2.4*Fo,Fm*1.15,a+2)/5)*5),Jtop=Math.max(3*Jmin,Math.min(isFinite(Jm)?Jm*1.25:0,8*Jmin)),Fs=[];
      for(var i=0;i<=400;i++){var F=Fmax*i/400,j=Jof(F);if(isFinite(j))Fs.push([F,j]);}
      var px=nar?52:58,pw=nar?330:270,P=U.plot(px,28,pw,180,[0,Fmax],[0,Jtop]);
      o.push(S.T(nar?10:12,14,"評価関数 J（入力を u = −Fv の形に限ったとき、R = 1、v(0) = 1 m/s）","start",10,"ink",true));
      o.push(P.axes({xl:"ゲイン F [N/(m/s)]",yl:"J",xt:U.nice(0,Fmax,5).filter(function(v){return v<=Fmax;}),yt:U.nice(0,Jtop,4).filter(function(v){return v<=Jtop;}),yfmt:_w19_n,ylOff:nar?34:40}));
      o.push(P.clip(Fs,"signal",2.2));
      if(a>0){o.push(S.L(P.X(a/b),P.y,P.X(a/b),P.y+P.h,"alias",1,"3 3"));o.push(S.T(P.X(a/b)+3,P.y+12,"F ≤ "+_w19_g(a/b,3)+" は不安定","start",9,"alias",false,false,null,true));}
      o.push(S.D(P.X(Fo),P.Y(Jmin),"signal",4.5));o.push(S.L(P.X(Fo),P.Y(Jmin),P.X(Fo),P.y+P.h,"signal",1,"3 3"));
      o.push(S.T(P.X(Fo)+(Fo>Fmax*0.6?-6:6),P.Y(Jmin)+16,"最適 F = "+_w19_g(Fo,3)+"、J = "+_w19_g(Jmin,3),Fo>Fmax*0.6?"end":"start",9.5,"signal",true,false,null,true));
      if(stab&&Fm<=Fmax){o.push(S.D(P.X(Fm),P.Y(Math.min(Jm,Jtop)),"purple",4));
        o.push(S.T(P.X(Fm)+(Fm>Fmax*0.6?-6:6),P.Y(Math.min(Jm,Jtop))-8,"F = "+_w19_f(Fm,1)+" のとき J = "+_w19_g(Jm,3),Fm>Fmax*0.6?"end":"start",9.5,"purple",true,false,null,true));}
      /* (2) 速度と力 */
      var Tm=Math.min(6,Math.max(0.3,5/Math.min(sgo,stab?sgm:sgo))),N=300,ts=[],vo=[],vm=[],uo=[],um=[];
      for(var k=0;k<=N;k++){var t=Tm*k/N;ts.push(t);var e1=v0*Math.exp(-sgo*t),e2=stab?v0*Math.exp(-sgm*t):NaN;vo.push(e1);vm.push(e2);uo.push(-Fo*e1);um.push(-Fm*e2);}
      var gx=nar?52:400,gy=nar?262:28,gw=nar?330:280,gh=nar?90:82;
      var w1=_w19_wave(S,U,gx,gy,gw,gh,Tm,-0.05,1.05,"速度 v [m/s]",[[ts,vo,"signal"],[ts,vm,"purple","6 3"]],null,false);o.push(w1.svg);
      var ulo=Math.min(-Fo,stab?-Fm:0,-0.1)*1.08,w2=_w19_wave(S,U,gx,gy+gh+30,gw,gh,Tm,ulo,Math.max(0.05,-ulo*0.06),"力 u [N]",[[ts,uo,"signal"],[ts,um,"purple","6 3"]],null,true);o.push(w2.svg);
      /* (3) s 平面の実軸 */
      var sy=nar?gy+2*gh+100:296,sx0=nar?20:400,sx1=nar?380:680,smin=-Math.max(4,Math.ceil(Math.max(sgo,stab?sgm:0,Math.abs(a))*1.15)),smax=Math.max(1,Math.abs(a)*1.3);
      var SP=U.plot(sx0,sy-10,sx1-sx0,20,[smin,smax],[-1,1]);
      o.push(S.T(sx0,sy-22,"極（s 平面の実軸）","start",9.5,"ink",true));
      o.push(S.RECT(SP.X(0),sy-10,SP.X(smax)-SP.X(0),20,0,U.soft("alias"),"none",0));
      o.push(S.L(sx0,sy,sx1,sy,"muted",1.2));o.push(S.L(SP.X(0),sy-12,SP.X(0),sy+12,"muted",1.4));
      U.nice(smin,smax,6).forEach(function(v){if(v<smin||v>smax)return;o.push(S.L(SP.X(v),sy-3,SP.X(v),sy+3,"muted",1));o.push(S.T(SP.X(v),sy+15,_w19_n(v),"middle",8.5,"muted"));});
      o.push(S.X(SP.X(a),sy,5,"muted",2));o.push(S.X(SP.X(-sgo),sy,5.5,"signal",2.4));if(stab&&-sgm>=smin)o.push(S.X(SP.X(-sgm),sy,5,"purple",2));
      if(a>0){o.push(S.L(SP.X(-a),sy-9,SP.X(-a),sy+9,"alias",1.2,"2 2"));}
      o.push(S.T(sx1,sy+30,"灰: 対象の極 a　青: 最適　紫: 比べる F"+(a>0?"　赤の点線: 鏡の位置 −a":""),"end",9,"muted"));
      box.set(S.svg(Wd,nar?sy+40:sy+38,o));
      /* 読み出し（数値積分は台形で、式の値と比べる） */
      /* 数値積分（シンプソン則、2000 区間）で、式の値と比べる */
      var NS=2000,hs=Tm/NS,Ix=0;for(var q2=0;q2<=NS;q2++){var vv=v0*Math.exp(-sgo*q2*hs),wq=(q2===0||q2===NS)?1:(q2%2?4:2);Ix+=wq*vv*vv;}Ix*=hs/3;
      var Jx=Q*Ix,Ju=R*Fo*Fo*Ix,tail=Math.exp(-2*sgo*Tm)/(2*sgo)*(Q+R*Fo*Fo);
      var h="対象 dv/dt = "+_w19_g(a,3)+"v + u（a = −c/m、b = 1/m、m = 1 kg）。最適なゲイン F = (a + √(a² + b²Q/R))/b = <b>"+_w19_g(Fo,4)+" N/(m/s)</b>、閉ループの極 <b>"+_w19_g(-sgo,4)+" /s</b><br>";
      h+="J の最小値 RF v(0)²/b = <b>"+_w19_g(Jmin,4)+"</b>（数値積分: 速度の項 Q∫v²dt "+_w19_g(Jx,4)+" ＋ 力の項 R∫u²dt "+_w19_g(Ju,4)+" ＝ "+_w19_g(Jx+Ju+tail,4)+"）<br>";
      if(stab)h+="比べる F = "+_w19_f(Fm,1)+": 極 "+_w19_g(-sgm,4)+" /s、J = <b>"+_w19_g(Jm,4)+"</b>（最小値より "+_w19_g(Jm-Jmin,3)+" 大きい。∫R(u + "+_w19_g(Fo,3)+"v)²dt = R(F − "+_w19_g(Fo,3)+")²v(0)²/(2(bF − a)) = "+_w19_g(R*(Fm-Fo)*(Fm-Fo)/(2*sgm),3)+"）<br>";
      else h+='<span class="warn">比べる F = '+_w19_f(Fm,1)+" では閉ループの極 "+_w19_g(-sgm,3)+" /s が 0 以上で、速度が 0 に戻らない（J は限りなく大きい）</span><br>";
      if(a>0)h+="対象の極 +"+_w19_g(a,3)+" は右半平面にある。Q/R を 0 に近づけても、最適な極は −√(a² + b²Q/R) で −"+_w19_g(a,3)+"（鏡に映した位置）より右へ行かない<br>";
      ro.innerHTML=h+'<div class="wnote">本文 2 節の式。閉ループの速度は v(t) = e<sup>−(bF − a)t</sup> で、J は式でも求められる。数値積分は、表示した時間の範囲をシンプソン則で足し、範囲の外の小さな残りを式で加えた。</div>';
    }
    draw();
  };

  /* ---- 4 節: 倒立振子の重み（ブライソンの規則） ---- */
  REG.w19_weights=function(el,U){
    var S=U.S,TE=3,H=0.001,EV=5;
    U.head(el,"WEIGHTS","倒立振子の重み — 許せる最大値から J の重みを決める");
    var r1=U.ctrls(el);
    var sp=U.slider(r1,U.htx("台車の位置の最大値 p_max"),{values:[0.1,0.15,0.2,0.25,0.35,0.5,0.7,1,1.5,2,3],value:0.5,fmt:function(v){return v+" m";},onInput:function(){run();}});
    var sa=U.slider(r1,U.htx("振子の角度の最大値 φ_max"),{values:[3,5,10,15,20,30,60,1000],value:1000,fmt:function(v){return v>=1000?"評価しない":v+"°";},onInput:function(){run();}});
    var su=U.slider(r1,U.htx("力の最大値 u_max"),{values:[1,2,2.5,3,4,5,7,10,15],value:5,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var stst=U.select(r2,"試験",["10° 傾けて静かに放す","おもりを右へ 1 N で 0.1 s 押す","台車を 20 cm ずらして放す"],0,function(){run();});
    var slim=U.checkbox(r2,"力の上限 5 N（飽和）を入れる",false,function(){run();});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 t",{min:0,max:TE,step:0.01,value:0.3,fmt:function(v){return _w19_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.02;if(t>=TE){t=TE;tk.stop();}st.set(t);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=TE-0.001)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(p,a,u,ts,lim){tk.stop();sp.set(p);sa.set(a);su.set(u);stst.set(ts);slim.set(lim);st.set(0.3);run();}
    U.button(br,"本文の例（0.5 m・評価しない・5 N）",function(){pre(0.5,1000,5,0,false);});
    U.button(br,"最初の案（0.5 m・10°・5 N）",function(){pre(0.5,10,5,0,false);});
    U.button(br,"最初の案で押す",function(){pre(0.5,10,5,1,false);});
    U.button(br,"例で押す",function(){pre(0.5,1000,5,1,false);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var pm=sp.get(),am=sa.get(),um=su.get(),ph=am>=1000?null:am,d=_w19_design(U,pm,ph,um),ts=stst.get();
      var x0=ts===0?[0,0,10*_W19_D2R,0]:(ts===2?[0.2,0,0,0]:[0,0,0,0]),push=ts===1?[0,0.1,1]:null;
      var res=_w19_sim(U,d.F,x0,{T:TE,h:H,umax:slim.get()?5:null,push:push,every:EV});
      R={d:d,res:res,x0:x0,ph:ph,pm:pm,um:um,ts:ts,poles:_w19_eig(U,d.F)};draw();}
    function draw(){
      if(!R)return;var nar=_w19_nar(box),Wd=nar?400:700,o=[],res=R.res,k=Math.min(res.t.length-1,Math.round(st.get()/(H*EV))),tc=res.t[k];
      /* 動く絵 */
      var ax=nar?10:8,aw=nar?380:330,gy=nar?170:172,sc=nar?260:240,Lr=nar?95:100,cx0=ax+aw/2;
      o.push(S.T(ax,14,"動く絵（振子の長さは拡大して描いた）","start",9.5,"muted"));
      o.push(_w19_ground(S,ax,ax+aw,gy));o.push(S.L(cx0,gy+2,cx0,gy+12,"faint",1));o.push(S.T(cx0,gy+24,"p = 0","middle",9,"muted"));
      var xx=res.x[k],px=cx0+Math.max(-aw/2+28,Math.min(aw/2-28,xx[0]*sc));o.push(_w19_pend(S,U,px,gy,xx[2],"signal",Lr,null));
      var uu=res.u[k];if(Math.abs(uu)>0.02){var dir=uu>0?1:-1,xa=px-dir*(26+38),len=Math.min(34,8+6*Math.abs(uu));o.push(S.ARR(xa,gy-20,xa+dir*len,gy-20,"gold",2.4));o.push(S.T(xa+dir*len/2,gy-26,"u","middle",11,"gold",true));}
      if(R.ts===1&&tc<0.1){var bx=px+Lr*Math.sin(xx[2]),by=gy-30-Lr*Math.cos(xx[2]);o.push(S.ARR(bx-40,by,bx-10,by,"purple",2.2));o.push(S.T(bx-42,by-6,"押す","end",9.5,"purple",true));}
      if(res.fall!=null&&tc>=res.fall)o.push(S.T(ax+aw-4,30,"倒れた（90°）","end",10,"alias",true,false,null,true));
      o.push(S.T(ax+aw,gy+40,"t = "+_w19_f(tc,2)+" s","end",10,"ink",true));
      /* s 平面 */
      var spx=nar?52:56,spy=nar?gy+62:gy+62,spw=nar?320:270,sph=nar?120:120,lim=Math.max(8,Math.ceil(_w19_maxabs(R.poles.map(function(z){return z.re;}))*1.15)),imx=Math.max(4,Math.ceil(_w19_maxabs(R.poles.map(function(z){return z.im;}))*1.2));
      var SP=U.plot(spx,spy,spw,sph,[-lim,1],[-imx,imx]);
      o.push(S.RECT(SP.x,SP.y,SP.w,SP.h,0,"var(--screen)","line",0.6));o.push(U.ctl.splane(SP,{}));
      o.push(SP.axes({xt:U.nice(-lim,0,4).filter(function(v){return v>=-lim;}),yt:U.nice(-imx,imx,2).filter(function(v){return v>=-imx&&v<=imx;}),grid:false,sz:8.5,xl:"実部 [1/s]"}));
      o.push(S.TX(SP.x,SP.y-5,"閉ループの極（灰: 対象の固有値 0・0・±6.77）","start",9.5,"ink",true));
      [0,-6.766].forEach(function(v){if(v>=-lim)o.push(S.X(SP.X(v),SP.Y(0),4.5,"muted",1.8));});
      o.push(U.ctl.pz(SP,R.poles,[],"signal",5.5));
      /* 波形 */
      var t=res.t,phs=_w19_col(res,2,1/_W19_D2R),ps=_w19_col(res,0,100),us=res.u,T=TE;
      var gx=nar?52:420,gw=nar?330:260,gh=nar?86:82,gy0=nar?spy+sph+60:22,dy=nar?gh+36:gh+30;
      var rph=_w19_range([phs],0.08,2),rp=_w19_range([ps],0.08,2),ru=_w19_range([us],0.08,1);
      o.push(_w19_wave(S,U,gx,gy0,gw,gh,T,rph[0],rph[1],"角度 φ [°]",[[t,phs,"signal"]],tc,false).svg);
      o.push(_w19_wave(S,U,gx,gy0+dy,gw,gh,T,rp[0],rp[1],"台車の位置 p [cm]",[[t,ps,"signal"]],tc,false).svg);
      var wu=_w19_wave(S,U,gx,gy0+2*dy,gw,gh,T,Math.min(ru[0],-5.5),Math.max(ru[1],5.5),"力 u [N]",[[t,us,"gold"]],tc,true);o.push(wu.svg);
      o.push(S.L(wu.P.x,wu.P.Y(5),wu.P.x+wu.P.w,wu.P.Y(5),"alias",1,"3 3"));o.push(S.L(wu.P.x,wu.P.Y(-5),wu.P.x+wu.P.w,wu.P.Y(-5),"alias",1,"3 3"));
      box.set(S.svg(Wd,nar?gy0+3*dy+22:Math.max(spy+sph+42,gy0+3*dy+22),o));
      /* 読み出し */
      var d=R.d,um=_w19_maxabs(us),pmx=_w19_maxabs(ps),tp1=_w19_settle(t,ps,1),tph=_w19_settle(t,phs,0.2),mm=_w19_minmax(phs);
      function q(v){return v===0?"0":_w19_g(v,3);}
      var h="重み Q = diag("+d.Q.map(q).join(", ")+")、R = "+_w19_g(d.R,3)+"　→　F = [<b>"+d.F.map(function(v){return _w19_g(v,4);}).join(", ")+"</b>]（u = −Fx、x = [p, "+U.htx("\\dot{p}")+", φ, "+U.htx("\\dot{φ}")+"]）<br>";
      h+="閉ループの極: "+_w19_poles(R.poles)+"<br>";
      h+="最大の力 <b>"+_w19_g(um,3)+" N</b>"+(um>5.0005&&!slim.get()?' <span class="warn">上限 5 N を超える</span>':"")+"、台車が動く最大の距離 "+_w19_g(pmx,3)+" cm、角度 "+_w19_f(mm[0],1)+"〜"+_w19_f(mm[1],1)+"°<br>";
      h+="台車が ±1 cm に収まる時間 "+(isFinite(tp1)?_w19_f(tp1,2)+" s":"3 s では収まらない")+"、角度が ±0.2° に収まる時間 "+(isFinite(tph)?_w19_f(tph,2)+" s":"3 s では収まらない")+"<br>";
      var Jp=d.Q[0]*_w19_isq(t,ps,0.01),Ja=d.Q[2]*_w19_isq(t,phs,_W19_D2R),Ju=d.R*_w19_isq(t,us,1);
      h+="J の内訳（3 s まで）: 位置 "+_w19_g(Jp,3)+" ＋ 角度 "+(d.Q[2]?_w19_g(Ja,3):"0（評価しない）")+" ＋ 力 "+_w19_g(Ju,3)+" ＝ "+_w19_g(Jp+Ja+Ju,3);
      if(R.ts!==1&&!slim.get()){var x0=R.x0,Jx=0;for(var i=0;i<4;i++)for(var j=0;j<4;j++)Jx+=x0[i]*d.X[i][j]*x0[j];h+="（線形化した式の最小値 x(0)ᵀXx(0) = "+_w19_g(Jx,3)+"）";}
      ro.innerHTML=h+'<br><div class="wnote">ブライソンの規則: Q = diag(1/p_max², 0, 1/φ_max², 0)、R = 1/u_max²（速度と角速度は評価しない）。F は線形化した式で求め、動きは線形でない式を 4 次のルンゲ・クッタ法（刻み 1 ms）で計算した。J の内訳は、その動きの 2 乗を 3 s まで足したもの。</div>'.replace("p_max²","p<sub>max</sub>²").replace("φ_max²","φ<sub>max</sub>²").replace("u_max²","u<sub>max</sub>²");
    }
    run();
  };

  /* ---- 5 節: 同じ速さの極配置と比べる ---- */
  REG.w19_compare=function(el,U){
    var S=U.S,TE=3,H=0.001,EV=5;
    U.head(el,"LQR VS PLACEMENT","同じ速さの極配置と最適レギュレータ");
    var r1=U.ctrls(el);
    var sw=U.slider(r1,U.htx("極配置の速さ ω_p"),{values:[3,3.5,4,4.5,5,5.5,5.6978,6,6.5,7,8],value:5.6978,fmt:function(v){return _w19_g(v,3)+" rad/s";},onInput:function(){run();}});
    var sa=U.select(r1,"最適レギュレータの角度の重み",["評価しない（本文の例と同じ形）","角度の最大値 30°","角度の最大値 10°"],0,function(){run();});
    var stst=U.select(r1,"試験",["10° 傾けて静かに放す","おもりを右へ 1 N で 0.1 s 押す"],0,function(){run();});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 t",{min:0,max:TE,step:0.01,value:0.3,fmt:function(v){return _w19_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.02;if(t>=TE){t=TE;tk.stop();}st.set(t);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=TE-0.001)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    U.button(br,"本文の例（ω_p = 5.70）",function(){tk.stop();sw.set(5.6978);sa.set(0);stst.set(0);st.set(0.3);run();});
    U.button(br,"18 章の −4 × 4",function(){tk.stop();sw.set(4);sa.set(0);stst.set(0);st.set(0.3);run();});
    U.button(br,"速い設計（ω_p = 7）",function(){tk.stop();sw.set(7);sa.set(0);stst.set(0);st.set(0.3);run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    var x10=[0,0,10*_W19_D2R,0];
    function tp1Of(F,h){var r=_w19_sim(U,F,x10,{T:6,h:h,every:1});return _w19_settle(r.t,_w19_col(r,0,1),0.01);}
    function run(){
      var wp=sw.get(),ai=+sa.get(),ph=ai===0?null:(ai===1?30:10),Fp=_w19_acker(U,[[-wp],[-wp],[-wp],[-wp]]),tgt=tp1Of(Fp,0.001);
      /* 台車が ±1 cm に収まる時間が同じになる位置の最大値を、対数で二分法（2 ms 刻みで探し、最後に 1 ms で確かめる） */
      var lo=Math.log(0.02),hi=Math.log(20),ok=true,tl=tp1Of(_w19_design(U,Math.exp(lo),ph,5).F,0.002),th=tp1Of(_w19_design(U,Math.exp(hi),ph,5).F,0.002);
      if(!(tl<=tgt&&th>=tgt))ok=false;
      for(var it=0;it<26&&ok;it++){var mid=(lo+hi)/2,tm=tp1Of(_w19_design(U,Math.exp(mid),ph,5).F,0.002);if(tm>tgt)hi=mid;else lo=mid;}
      var pm=+Math.exp((lo+hi)/2).toPrecision(3),d=_w19_design(U,pm,ph,5),ts=stst.get(),x0=ts===0?x10:[0,0,0,0],push=ts===1?[0,0.1,1]:null;
      var rl=_w19_sim(U,d.F,x0,{T:TE,h:H,push:push,every:EV}),rp=_w19_sim(U,Fp,x0,{T:TE,h:H,push:push,every:EV});
      R={wp:wp,Fp:Fp,d:d,pm:pm,ok:ok,tgt:tgt,rl:rl,rp:rp,ts:ts,ph:ph,el:_w19_eig(U,d.F),ep:_w19_eig(U,Fp),
        tl1:tp1Of(d.F,0.001)};
      R.m1=met(rl,d.F);R.m2=met(rp,Fp);R.J1=Jof(d,d.F);R.J2=Jof(d,Fp);draw();}
    function met(res,F){var tt=res.t,pp=_w19_col(res,0,100),aa=_w19_col(res,2,1/_W19_D2R),sg=[0.001,0.01,0.1*_W19_D2R,1*_W19_D2R],ns=0;for(var i=0;i<4;i++)ns+=Math.pow(F[i]*sg[i],2);
      return {um:_w19_maxabs(res.u),pm:_w19_maxabs(pp),tp:_w19_settle(tt,pp,1),ta:_w19_settle(tt,aa,0.2),ns:Math.sqrt(ns)};}
    /* 線形の閉ループで ∫(xᵀQx + Ru²) dt を、1 ms 刻みの厳密な離散化で 10 s まで足す（10° から放す） */
    function Jof(d,F){var Acl=U.ctl.mat.sub(_W19_A,U.ctl.mat.mul(_W19_B,[F])),Qt=U.ctl.mat.zeros(4,4),i,j;for(i=0;i<4;i++){Qt[i][i]=d.Q[i];for(j=0;j<4;j++)Qt[i][j]+=d.R*F[i]*F[j];}
      var Ad=U.ctl.mat.expm(U.ctl.mat.scale(Acl,0.001)),x=x10.slice(),s=0,prev=null;for(var n=0;n<=10000;n++){var v=0;for(i=0;i<4;i++)for(j=0;j<4;j++)v+=x[i]*Qt[i][j]*x[j];if(prev!==null)s+=(v+prev)*0.0005;prev=v;var nx=[0,0,0,0];for(i=0;i<4;i++)for(j=0;j<4;j++)nx[i]+=Ad[i][j]*x[j];x=nx;}return s;}
    function draw(){
      if(!R)return;var nar=_w19_nar(box),Wd=nar?400:700,o=[],k=Math.min(R.rl.t.length-1,Math.round(st.get()/(H*EV))),tc=R.rl.t[k];
      /* 2 つの動く絵 */
      var aw=nar?188:330,gy=150,sc=nar?170:230,Lr=nar?70:90;
      [[R.rl,"signal","最適レギュレータ",0],[R.rp,"purple","極配置",1]].forEach(function(q){var res=q[0],ax=nar?6+q[3]*200:8+q[3]*350,cx0=ax+aw/2,kk=Math.min(res.t.length-1,k),xx=res.x[kk];
        o.push(S.T(ax,14,q[2],"start",10,q[1],true));o.push(_w19_ground(S,ax,ax+aw,gy));o.push(S.L(cx0,gy+2,cx0,gy+12,"faint",1));
        var px=cx0+Math.max(-aw/2+28,Math.min(aw/2-28,xx[0]*sc));o.push(_w19_pend(S,U,px,gy,xx[2],q[1],Lr,null));
        var uu=res.u[kk];if(Math.abs(uu)>0.02){var dir=uu>0?1:-1,xa=px-dir*(26+30),len=Math.min(28,6+4*Math.abs(uu));o.push(S.ARR(xa,gy-20,xa+dir*len,gy-20,"gold",2.2));}
        o.push(S.T(ax+aw,30,"力 "+_w19_f(uu,2)+" N","end",9.5,"gold",true,false,null,true));});
      o.push(S.T(nar?394:688,gy+26,"t = "+_w19_f(tc,2)+" s","end",10,"ink",true));
      /* 波形（重ねる） */
      var t=R.rl.t,a1=_w19_col(R.rl,2,1/_W19_D2R),a2=_w19_col(R.rp,2,1/_W19_D2R),p1=_w19_col(R.rl,0,100),p2=_w19_col(R.rp,0,100);
      var ra=_w19_range([a1,a2],0.08,2),rpp=_w19_range([p1,p2],0.08,2),ru=_w19_range([R.rl.u,R.rp.u],0.08,1);
      var gy0=gy+56,gw=nar?330:196,gh=nar?80:90,gx=nar?[52,52,52]:[44,278,512],gyy=nar?[gy0,gy0+gh+34,gy0+2*(gh+34)]:[gy0,gy0,gy0];
      o.push(_w19_wave(S,U,gx[0],gyy[0],gw,gh,TE,ra[0],ra[1],"角度 φ [°]",[[t,a1,"signal"],[R.rp.t,a2,"purple","6 3"]],tc,!nar).svg);
      o.push(_w19_wave(S,U,gx[1],gyy[1],gw,gh,TE,rpp[0],rpp[1],"台車の位置 p [cm]",[[t,p1,"signal"],[R.rp.t,p2,"purple","6 3"]],tc,!nar).svg);
      var wu=_w19_wave(S,U,gx[2],gyy[2],gw,gh,TE,ru[0],ru[1],"力 u [N]",[[t,R.rl.u,"signal"],[R.rp.t,R.rp.u,"purple","6 3"]],tc,true);o.push(wu.svg);
      if(ru[1]>5)o.push(S.L(wu.P.x,wu.P.Y(5),wu.P.x+wu.P.w,wu.P.Y(5),"alias",1,"3 3"));
      /* s 平面 */
      var sy=gyy[2]+gh+60,lim=Math.max(8,Math.ceil(Math.max(_w19_maxabs(R.el.map(function(z){return z.re;})),R.wp)*1.15)),imx=Math.max(4,Math.ceil(_w19_maxabs(R.el.map(function(z){return z.im;}))*1.3));
      var SP=U.plot(nar?52:56,sy,nar?330:300,120,[-lim,1],[-imx,imx]);
      o.push(S.RECT(SP.x,SP.y,SP.w,SP.h,0,"var(--screen)","line",0.6));o.push(U.ctl.splane(SP,{}));
      o.push(SP.axes({xt:U.nice(-lim,0,4).filter(function(v){return v>=-lim;}),yt:U.nice(-imx,imx,2).filter(function(v){return v>=-imx&&v<=imx;}),grid:false,sz:8.5,xl:"実部 [1/s]"}));
      o.push(S.T(SP.x,SP.y-5,"閉ループの極（青: 最適レギュレータ　紫: 極配置 ×4）","start",9.5,"ink",true));
      o.push(S.L(SP.X(-6.766),SP.y+2,SP.X(-6.766),SP.y+SP.h-2,"faint",1,"2 3"));
      o.push(U.ctl.pz(SP,R.el,[],"signal",5.5));o.push(S.X(SP.X(-R.wp),SP.Y(0),6.5,"purple",2.4));
      if(!nar){var lx=390,ly=sy+8;["点線: −6.77（不安定な固有値 +6.77 の鏡）","",
          "位置の最大値 "+_w19_g(R.pm,3)+" m で、台車が ±1 cm に",""+"収まる時間を極配置と同じにした"].forEach(function(l,i){if(l)o.push(S.T(lx,ly+i*16,l,"start",9.5,"muted"));});}
      o.push(S.LEGL(nar?52:56,sy+SP.h+44,[["signal",null,"最適レギュレータ"],["purple","6 3","極配置"]]));
      box.set(S.svg(Wd,sy+SP.h+54,o));
      /* 読み出し */
      var m1=R.m1,m2=R.m2;
      function tf(v){return isFinite(v)?_w19_f(v,2)+" s":"3 s で収まらない";}
      var rows=[["F",R.d.F.map(function(v){return _w19_g(v,4);}).join(", "),R.Fp.map(function(v){return _w19_g(v,4);}).join(", ")],
        ["閉ループの極",_w19_poles(R.el),"−"+_w19_g(R.wp,3)+"（4 つ）"],
        ["台車が ±1 cm に収まる時間（10° から）",_w19_f(R.tl1,2)+" s",_w19_f(R.tgt,2)+" s"],
        ["最大の力",_w19_g(m1.um,3)+" N",_w19_g(m2.um,3)+" N"],
        ["台車が動く最大の距離",_w19_g(m1.pm,3)+" cm",_w19_g(m2.pm,3)+" cm"],
        ["角度が ±0.2° に収まる時間",tf(m1.ta),tf(m2.ta)],
        ["力のノイズの標準偏差（18 章 6 節の測定のノイズ）",_w19_g(m1.ns,3)+" N",_w19_g(m2.ns,3)+" N"],
        ["J（10° から、最適レギュレータの重み）",_w19_g(R.J1,4),_w19_g(R.J2,4)]];
      var h=(R.ok?"":'<span class="warn">この角度の重みでは、台車の戻りの速さを極配置に合わせられなかった（表示は最も近いもの）</span><br>')+
        "最適レギュレータの重み: Q = diag("+R.d.Q.map(function(v){return v===0?"0":_w19_g(v,3);}).join(", ")+")、R = 0.04（位置の最大値 "+_w19_g(R.pm,3)+" m"+(R.ph?"・角度 "+R.ph+"°":"")+"・力 5 N）"+(R.ts===1?"。試験はおもりを押す（下の表の時間と J は 10° から放したときの値）":"");
      ro.innerHTML=h+U.tbl(["","最適レギュレータ","極配置"],rows,["wrap","left","left"])+'<div class="wnote">線形でない式を 4 次のルンゲ・クッタ法（刻み 1 ms）で計算した。同じ速さに合わせる計算は 2 ms 刻みで二分法を使い、最後に 1 ms で確かめた。力のノイズは、位置 1 mm・速度 1 cm/s・角度 0.1°・角速度 1 °/s の標準偏差のノイズが互いに関係なく加わるとした値（18 章 6 節）。</div>';
    }
    run();
  };

  /* ---- 6 節: 入力の点で切った一巡伝達関数と余裕 ---- */
  REG.w19_margin=function(el,U){
    var S=U.S,TE=6,H=0.001,EV=5,cx=U.ctl.cx;
    U.head(el,"MARGIN","入力の点で切ったナイキスト線図 — 力の倍率とむだ時間");
    var r1=U.ctrls(el);
    var sel=U.select(r1,"制御器",["最適レギュレータ（本文の例）","最適レギュレータ（位置の最大値を変える）","極配置 −4 × 4（18 章）","極配置 2 組の −3 ± j3","極配置 −5.70 × 4"],0,function(){prep();});
    var spm=U.slider(r1,U.htx("位置の最大値 p_max"),{values:[0.1,0.15,0.2,0.25,0.35,0.5,0.7,1,1.5,2,3],value:0.5,fmt:function(v){return v+" m";},onInput:function(){prep();}});
    var r2=U.ctrls(el);
    var sk=U.slider(r2,"力の倍率 k",{min:0.2,max:20,log:true,value:1,fmt:function(v){return _w19_g(v,3)+" 倍";},onInput:function(){run();}});
    var sl=U.slider(r2,"むだ時間 L",{min:0,max:120,step:1,value:0,fmt:function(v){return v+" ms";},onInput:function(){run();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（k = 1、L = 0）",function(){sel.set(0);sk.set(1);sl.set(0);prep();});
    U.button(br,"例で力を 0.5 倍",function(){sel.set(0);sk.set(0.5);sl.set(0);prep();});
    U.button(br,"例で力を 0.42 倍",function(){sel.set(0);sk.set(0.42);sl.set(0);prep();});
    U.button(br,"極配置 −3 ± j3 で 0.6 倍",function(){sel.set(3);sk.set(0.6);sl.set(0);prep();});
    U.button(br,"例でむだ時間 55 ms",function(){sel.set(0);sk.set(1);sl.set(55);prep();});
    U.button(br,"例でむだ時間 65 ms",function(){sel.set(0);sk.set(1);sl.set(65);prep();});
    var box=U.svgbox(el),ro=U.readout(el),C=null,R=null;
    var gl=_W19_G/_W19_l,aph=(_W19_M+_W19_m)*_W19_G/(_W19_M*_W19_l),iml=1/(_W19_M*_W19_l),im=1/_W19_M;
    /* F(sI − A)⁻¹B = {(f1 + f2 s)(1/M)(s² − g/l) − (f3 + f4 s)(1/(Ml)) s²} / {s²(s² − (M + m)g/(Ml))}（17 章 3 節の伝達関数から） */
    function Lof(F,s){var s2=cx.mul(s,s),n1=cx.mul(cx.add(U.ctl.c(F[0],0),cx.scale(s,F[1])),cx.scale(cx.sub(s2,U.ctl.c(gl,0)),im)),n2=cx.mul(cx.add(U.ctl.c(F[2],0),cx.scale(s,F[3])),cx.scale(s2,iml));
      return cx.div(cx.sub(n1,n2),cx.mul(s2,cx.sub(s2,U.ctl.c(aph,0))));}
    function prep(){var i=+sel.get();spm.el.style.display=i===1?"":"none";
      var F=i===0?_w19_design(U,0.5,null,5).F:(i===1?_w19_design(U,spm.get(),null,5).F:(i===2?_w19_acker(U,[[-4],[-4],[-4],[-4]]):(i===3?_w19_acker(U,[[-3,3],[-3,-3],[-3,3],[-3,-3]]):_w19_acker(U,[[-5.6978],[-5.6978],[-5.6978],[-5.6978]]))));
      /* 余裕: −1 からの最短距離、力の下限（固有値で二分法）、ゲイン交差と位相余裕、許されるむだ時間 */
      var ws=U.ctl.logspace(-1,3,3000),best=1e9,wb=0,gcs=[];
      for(var j=0;j<ws.length;j++){var v=Lof(F,U.ctl.c(0,ws[j])),d=cx.abs(cx.add(U.ctl.c(1,0),v));if(d<best&&ws[j]<500){best=d;wb=ws[j];}
        if(j>0){var v0=Lof(F,U.ctl.c(0,ws[j-1]));if((cx.abs(v0)-1)*(cx.abs(v)-1)<=0){var a=ws[j-1],b=ws[j];for(var it=0;it<50;it++){var mm=Math.sqrt(a*b);if((cx.abs(Lof(F,U.ctl.c(0,a)))-1)*(cx.abs(Lof(F,U.ctl.c(0,mm)))-1)<=0)b=mm;else a=mm;}
          var wg=Math.sqrt(a*b),pv=Lof(F,U.ctl.c(0,wg)),pmg=180-Math.abs(cx.arg(pv)*180/Math.PI);gcs.push([wg,pmg,pmg*Math.PI/180/wg]);}}}
      function maxre(k){var e=_w19_eig(U,F.map(function(f){return f*k;})),m=-1e9;e.forEach(function(z){m=Math.max(m,z.re);});return m;}
      var lo=0.01,hi=1;for(var it2=0;it2<50;it2++){var md=(lo+hi)/2;if(maxre(md)<0)hi=md;else lo=md;}
      C={F:F,dmin:best,wd:wb,kmin:hi,gcs:gcs};run();}
    /* ナイキストの経路（虚軸を下から上へ。原点の固有値 0 は右側の小さな半円で迂回）で 1 + k e^{−sL} F(sI − A)⁻¹B が原点を回る回数（反時計回りが正） */
    function wind(F,k,L){var pts=[],ws=U.ctl.logspace(-3,4,4000),j;
      for(j=ws.length-1;j>=0;j--)pts.push(U.ctl.c(0,-ws[j]));for(j=0;j<=200;j++){var th=-Math.PI/2+Math.PI*j/200;pts.push(cx.polar(1e-3,th));}for(j=0;j<ws.length;j++)pts.push(U.ctl.c(0,ws[j]));
      var tot=0,prev=null;pts.forEach(function(s){var v=cx.add(U.ctl.c(1,0),cx.mul(cx.scale(Lof(F,s),k),cx.exp(cx.scale(s,-L)))),a=cx.arg(v);if(prev!==null){var d=a-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;tot+=d;}prev=a;});
      return Math.round(tot/(2*Math.PI));}
    function run(){if(!C)return;var k=sk.get(),L=sl.get()/1000,F=C.F;
      var res=_w19_sim(U,F,[0,0,2*_W19_D2R,0],{T:TE,h:H,k:k,L:L,every:EV});
      R={k:k,L:L,res:res,n:wind(F,k,L)};draw();}
    function draw(){
      if(!C||!R)return;var nar=_w19_nar(box),Wd=nar?400:700,o=[],F=C.F,k=R.k,L=R.L;
      /* ナイキスト線図 */
      var cp=S.CPLANE(nar?44:48,26,nar?330:300,nar?264:240,[-3.4,1.2],[-2,2],{});o.push(cp.svg);var P=cp.P;
      var cir=[];for(var i=0;i<=120;i++){var a=2*Math.PI*i/120;cir.push([P.X(-1+Math.cos(a)),P.Y(Math.sin(a))]);}o.push(S.PL(cir,"alias",1.2,U.soft("alias"),null,0.55));
      var ws=U.ctl.logspace(Math.log10(0.6),3,900),v0=[],v1=[];
      ws.forEach(function(w){var s=U.ctl.c(0,w),z=Lof(F,s);v0.push([z.re,z.im]);var z2=cx.mul(cx.scale(z,k),cx.exp(cx.scale(s,-L)));v1.push([z2.re,z2.im]);});
      if(Math.abs(k-1)>1e-9||L>0)o.push(P.clip(v0,"faint",1.4));
      o.push(P.clip(v1.map(function(q){return [q[0],-q[1]];}),"signal",1.2,"4 3"));o.push(P.clip(v1,"signal",2.2));
      [Math.round(ws.length*0.25),Math.round(ws.length*0.45),Math.round(ws.length*0.6)].forEach(function(j){o.push(S.CURVEHEAD(P,v1,j,"signal",8));});
      o.push(S.T(P.X(1.15),P.Y(-1.8),"ω → 0 で右の枠の外へ","end",9,"muted",false,false,null,true));
      o.push(S.T(nar?44:48,nar?324:300,(Math.abs(k-1)>1e-9||L>0)?"青: k 倍と L の遅れを入れた線図　灰: 元の線図":"青: F(jωI − A)⁻¹B（破線は鏡像）　赤: |1 + F(jωI − A)⁻¹B| < 1 の円","start",9,"muted"));
      /* 振子の応答 */
      var res=R.res,t=res.t,phs=_w19_col(res,2,1/_W19_D2R),ps=_w19_col(res,0,100);
      var gx=nar?52:410,gy0=nar?356:28,gw=nar?330:270,gh=nar?96:100;
      var ra=_w19_range([phs],0.1,4),rp=_w19_range([ps],0.1,4);
      o.push(_w19_wave(S,U,gx,gy0,gw,gh,TE,Math.max(ra[0],-95),Math.min(ra[1],95),"角度 φ [°]（2° から放す）",[[t,phs,"signal"]],null,false).svg);
      o.push(_w19_wave(S,U,gx,gy0+gh+34,gw,gh,TE,Math.max(rp[0],-200),Math.min(rp[1],200),"台車の位置 p [cm]",[[t,ps,"signal"]],null,true).svg);
      var stable=R.n===1;
      o.push(S.T(gx,gy0+2*gh+84,stable?"−1 を反時計回りに 1 回: 安定":"−1 を反時計回りに 1 回まわらない（"+R.n+" 回）: 不安定","start",10,stable?"green":"alias",true));
      box.set(S.svg(Wd,nar?gy0+2*gh+96:Math.max(310,gy0+2*gh+96),o));
      /* 読み出し */
      var g0=C.gcs.length?C.gcs[0]:null,dm=null;C.gcs.forEach(function(g){if(dm===null||g[2]<dm)dm=g[2];});
      var h="F = ["+F.map(function(v){return _w19_g(v,4);}).join(", ")+"]、閉ループの極 "+_w19_poles(_w19_eig(U,F))+"<br>";
      h+="−1 からの最短距離 |1 + F(jωI − A)<sup>−1</sup>B| = <b>"+_w19_g(C.dmin,3)+"</b>"+(C.dmin>=0.9995?'（角周波数が高いと 1 に近づく）：<span class="ok">円に入らない</span>':"（"+_w19_g(C.wd,3)+' rad/s）：<span class="warn">円の中を通る</span>')+"<br>";
      h+="力の倍率の下限 <b>"+_w19_g(C.kmin,3)+" 倍</b>（上は何倍でも安定）"+(g0?"、位相余裕 <b>"+_w19_f(g0[1],1)+"°</b>（ω<sub>gc</sub> = "+_w19_g(g0[0],3)+" rad/s）、許されるむだ時間 φ<sub>m</sub>/ω<sub>gc</sub> = <b>"+_w19_g(dm*1000,3)+" ms</b>":"")+"<br>";
      var mx=_w19_maxabs(phs.slice(Math.floor(phs.length*0.8)));
      h+="いまの設定（k = "+_w19_g(k,3)+"、L = "+Math.round(L*1000)+" ms）: 線図と鏡像が −1 を反時計回りに回る回数 "+R.n+"（開ループの右半平面の固有値は +6.77 の 1 つ）→ "+(stable?'<span class="ok">安定</span>':'<span class="warn">不安定</span>')+"。2° から放した振子は"+(res.fall!=null?'<span class="warn"> '+_w19_f(res.fall,2)+" s に倒れた</span>":(stable?(mx<0.01?"立ち直る":"立ち直る（最後の 1.2 s の振れ "+_w19_f(mx,2)+"°）"):"大きく振れる"))+"<br>";
      ro.innerHTML=h+'<div class="wnote">一巡伝達関数は 17 章 3 節の伝達関数から F(sI − A)<sup>−1</sup>B = {(f₁ + f₂s)(s² − g/l)/M − (f₃ + f₄s)s²/(Ml)} / {s²(s² − (M + m)g/(Ml))} として計算した。回る回数は、虚軸を下から上へ進み、原点を右側の小さな半円で迂回する経路で数えた。振子の動きは線形でない式で、力は k 倍し、L だけ前の状態から決める（刻み 1 ms）。</div>';
    }
    prep();
  };
