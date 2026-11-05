  /* ===== 18 章 状態フィードバック ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w18_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w18_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 有効数字 d 桁（読み出しの HTML 用。とても小さい・大きい値は × 10 の累乗） */
  function _w18_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s;
    if(a>=1e5||a<1e-3){var e=Math.floor(Math.log10(a)),m=v/Math.pow(10,e);s=(+m.toPrecision(d)).toString()+" × 10<sup>"+e+"</sup>";}
    else if(a>=Math.pow(10,d))s=String(Math.round(v));else s=(+v.toPrecision(d)).toString();
    return s.replace(/-/g,"−");}
  /* 図の中の文字用（HTML のタグを使わない） */
  function _w18_s(v,d){d=d||3;if(v===0)return "0";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace(/-/g,"−");}
  /* 複素数の極の並び → 文字（共役の組は ± でまとめる） */
  function _w18_plist(rs,d){var out=[],used=[];rs.forEach(function(z,i){if(used[i])return;
    if(Math.abs(z.im)>1e-9){for(var j=i+1;j<rs.length;j++)if(!used[j]&&Math.abs(rs[j].re-z.re)<1e-6*(1+Math.abs(z.re))&&Math.abs(rs[j].im+z.im)<1e-6*(1+Math.abs(z.im))){used[j]=true;break;}
      out.push(_w18_s(z.re,d)+" ± j"+_w18_s(Math.abs(z.im),d));}else out.push(_w18_s(z.re,d));used[i]=true;});return out.join("、");}
  function _w18_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+6;xx<x1;xx+=12)o+=S.L(xx,y,xx-7,y+7,"faint",1);return o;}
  /* 地面 gy の上の、中心 cx の台車と、角度 phi [rad]（真上から右が正）の振子 */
  function _w18_pend(S,U,cx,gy,phi,L,c,dash,cw,ch){cw=cw||46;ch=ch||18;
    var o=S.RECT(cx-cw/2,gy-ch-12,cw,ch,4,dash?"none":U.soft(c),c,1.5,dash)+S.CIRC(cx-cw*0.28,gy-6,6,c,1.3,"screen",dash)+S.CIRC(cx+cw*0.28,gy-6,6,c,1.3,"screen",dash);
    var px=cx,py=gy-ch-12,bx=px+L*Math.sin(phi),by=py-L*Math.cos(phi);
    o+=S.L(px,py,bx,by,dash?c:"ink",dash?1.6:2.4,dash);o+=S.CIRC(bx,by,7,c,1.5,dash?"none":U.soft(c),dash);o+=S.D(px,py,dash?c:"ink",2.8);return o;}
  function _w18_max(a,f){var m=-Infinity,k=-1;for(var i=0;i<a.length;i++){var v=f?f(a[i]):a[i];if(v>m){m=v;k=i;}}return {v:m,i:k};}
  function _w18_min(a,f){var m=Infinity,k=-1;for(var i=0;i<a.length;i++){var v=f?f(a[i]):a[i];if(v<m){m=v;k=i;}}return {v:m,i:k};}

  /* ---- 倒立振子（17 章 2 節の例の値: M 0.5 kg・m 0.2 kg・l 0.3 m・g 9.81 m/s²） ---- */
  function _w18_pAB(){var M=0.5,m=0.2,l=0.3,g=9.81;return {A:[[0,1,0,0],[0,0,-m*g/M,0],[0,0,0,1],[0,0,(M+m)*g/(M*l),0]],B:[[0],[1/M],[0],[-1/(M*l)]]};}
  /* 線形でない式。fd: おもりを水平に押す力、d: 台車に加わる外乱の力 */
  function _w18_fnl(x,u,fd,d){var M=0.5,m=0.2,l=0.3,g=9.81,s=Math.sin(x[2]),c=Math.cos(x[2]),Fc=u+d;
    var pdd=(Fc+fd-m*g*s*c-fd*c*c+m*l*x[3]*x[3]*s)/(M+m*s*s),phdd=(g*s-pdd*c+fd/m*c)/l;return [x[1],pdd,x[3],phdd];}
  function _w18_flin(x,u,fd,d){var M=0.5,m=0.2,l=0.3,g=9.81,Fc=u+d;return [x[1],(Fc-m*g*x[2])/M,x[3],((M+m)*g*x[2]-Fc)/(M*l)+fd/(m*l)];}
  /* 閉ループを 4 次のルンゲ・クッタ法で解く。入力は微分方程式の中で計算する（連続の制御器）。
     o = {F（4 つ）, fI（積分型サーボ系なら w に掛けるゲイン）, x0, T, h, nl, umax, push:[開始, 長さ, 力], dist(t), r(t), every} */
  function _w18_sim(U,o){
    var F=o.F,h=o.h||0.002,n=Math.round(o.T/h),ev=o.every||1,integ=o.fI!=null,plant=o.nl===false?_w18_flin:_w18_fnl;
    function ctrl(t,x){var u,rr=o.r?o.r(t):0;
      if(integ)u=-(F[0]*x[0]+F[1]*x[1]+F[2]*x[2]+F[3]*x[3])-o.fI*x[4];
      else u=-(F[0]*(x[0]-rr)+F[1]*x[1]+F[2]*x[2]+F[3]*x[3]);
      if(o.umax!=null){if(u>o.umax)u=o.umax;if(u<-o.umax)u=-o.umax;}return u;}
    /* 押す力と外乱は、刻みの始めの時刻で決めて、その刻みの間は一定にする（変わる時刻は刻みの境目にそろえてある） */
    var cfd=0,cd=0;
    function f(t,x){var u=ctrl(t,x),dx=plant(x,u,cfd,cd);if(integ)dx.push((o.r?o.r(t):0)-x[0]);return dx;}
    var x=o.x0.slice();if(integ)x.push(0);
    var T=[0],X=[x.slice()],Uu=[ctrl(0,x)],fell=false,tf=null;
    for(var k=0;k<n;k++){var tk=k*h;cfd=(o.push&&tk>=o.push[0]-1e-9&&tk<o.push[0]+o.push[1]-1e-9)?o.push[2]:0;cd=o.dist?o.dist(tk+1e-9):0;
      var xp=x,a0=Math.abs(x[2]);x=U.ctl.rk4(f,tk,x,h);var a1=Math.abs(x[2]),fl=a1>Math.PI/2;
      if(fl){/* 倒れた（傾きが 90° を越えた）時刻と状態は、刻みの間を直線で補って求める（刻み幅で値が変わらないように） */
        var al=(Math.PI/2-a0)/(a1-a0),xi=xp.map(function(v,j){return v+al*(x[j]-v);});
        fell=true;tf=tk+al*h;T.push(tf);X.push(xi);Uu.push(ctrl(tf,xi));break;}
      if((k+1)%ev===0){T.push((k+1)*h);X.push(x.slice());Uu.push(ctrl((k+1)*h,x));}}
    return {t:T,x:X,u:Uu,fell:fell,tf:tf};}
  function _w18_acker(U,A,B,poles){return U.ctl.mat.acker(A,B,poles)[0];}

  /* ---- 2 節: 可制御性（2 枚の板と 1 つのヒータ） ---- */
  REG.w18_ctrb=function(el,U){
    var S=U.S,mat=U.ctl.mat,Cth=400,Rth=1.25;
    U.head(el,"CONTROLLABILITY","2 枚の板と 1 つのヒータ — 入力が届く向きと、動かせない固有値");
    var r1=U.ctrls(el);
    var rh=U.slider(r1,"板 1 に入れる割合 ρ",{min:0,max:1,step:0.01,value:0.5,fmt:function(v){return _w18_f(v,2)+(Math.abs(v-0.5)<1e-9?"（半分ずつ）":"");},onInput:function(){draw();}});
    var cp=U.select(r1,"板どうしをつなぐ金具",["熱抵抗 2.5 K/W（本文の例）","熱抵抗 10 K/W（細い金具）","つないでいない"],0,function(){draw();});
    var r2=U.ctrls(el);
    var g1=U.slider(r2,"f<sub>1</sub>（板 1 のずれに掛ける）",{min:-20,max:40,step:0.5,value:0,fmt:function(v){return _w18_f(v,1)+" W/K";},onInput:function(){draw();}});
    var g2=U.slider(r2,"f<sub>2</sub>（板 2 のずれに掛ける）",{min:-20,max:40,step:0.5,value:0,fmt:function(v){return _w18_f(v,1)+" W/K";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    function setp(r,c,a,b){rh.set(r);cp.set(c);g1.set(a);g2.set(b);draw();}
    U.button(br,"本文の例（半分ずつ・F = 0）",function(){setp(0.5,0,0,0);});
    U.button(br,"板 1 だけ（ρ = 1）",function(){setp(1,0,0,0);});
    U.button(br,"ρ = 0.6",function(){setp(0.6,0,0,0);});
    U.button(br,"半分ずつで、そろえて強く（f₁ = f₂ = 10）",function(){setp(0.5,0,10,10);});
    U.button(br,"半分ずつで、差を戻そうとする（f₁ = 10、f₂ = −10）",function(){setp(0.5,0,10,-10);});
    U.button(br,"板 1 だけで、両方を速く（f₁ = 10、f₂ = 10）",function(){setp(1,0,10,10);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var rho=rh.get(),ci=+cp.get(),R12=[2.5,10,null][ci],k=R12?1/R12:0;
      var a=(-1/Rth-k)/Cth,b=k/Cth,A=[[a,b],[b,a]],B=[[rho/Cth],[(1-rho)/Cth]],F=[[g1.get(),g2.get()]];
      var Wc=mat.ctrb(A,B),det=mat.det(Wc),sc=Math.abs(Wc[0][0])+Math.abs(Wc[1][0])+1e-30,sc2=Math.abs(Wc[0][1])+Math.abs(Wc[1][1])+1e-30;
      var rk=Math.abs(det)<1e-9*sc*sc2?1:2;
      var Acl=mat.sub(A,mat.mul(B,F)),evo=[a+b,a-b],evc=mat.eig(Acl);
      /* 固有値（そろう動き a+b: [1,1]、差 a−b: [1,−1]）。入力が届かないモード */
      var bs=(B[0][0]+B[1][0])/2,bd=(B[0][0]-B[1][0])/2,fixed=null;
      if(Math.abs(b)<1e-15){fixed=a;}else if(Math.abs(bd)<1e-12/Cth)fixed=a-b;else if(Math.abs(bs)<1e-12/Cth)fixed=a+b;
      if(rk===2)fixed=null;
      /* 図 */
      var nar=_w18_nar(box),Wd=nar?400:700,o=[];
      var px=nar?52:52,py=26,pw=nar?300:250,P=U.plot(px,py,pw,pw,[-30,30],[-30,30]);
      o.push(S.T(nar?14:10,14,"(a) 状態（動作点からの温度のずれ）","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.8));
      o.push(P.axes({xl:"板 1 のずれ [K]",yl:"板 2 のずれ [K]",xt:[-30,-15,0,15,30],yt:[-30,-15,0,15,30],xfmt:function(v){return _w18_s(v);},yfmt:function(v){return _w18_s(v);},sz:9,ylOff:34}));
      o.push(S.L(P.X(-30),P.Y(0),P.X(30),P.Y(0),"muted",1));o.push(S.L(P.X(0),P.Y(-30),P.X(0),P.Y(30),"muted",1));
      o.push(S.L(P.X(-30),P.Y(-30),P.X(30),P.Y(30),"faint",1,"3 3"));o.push(S.L(P.X(-30),P.Y(30),P.X(30),P.Y(-30),"faint",1,"3 3"));
      /* 500 s のうちに届く範囲（|δq| ≤ 40 W）。A = [[a,b],[b,a]] なので e^{Aσ} は固有ベクトル [1,1]・[1,−1] で分ける */
      var Tn=500,N=400,g=[],i,j;
      for(i=0;i<=N;i++){var s=Tn*i/N,es=Math.exp((a+b)*s),ed=Math.exp((a-b)*s);g.push([es*bs+ed*bd,es*bs-ed*bd]);}
      var poly=[];for(j=0;j<120;j++){var th=2*Math.PI*j/120,dx=Math.cos(th),dy=Math.sin(th),sx=0,sy=0;
        for(i=0;i<=N;i++){var w=(i===0||i===N)?0.5:1,sg=g[i][0]*dx+g[i][1]*dy>0?1:-1;sx+=w*sg*g[i][0];sy+=w*sg*g[i][1];}
        poly.push([40*sx*Tn/N,40*sy*Tn/N]);}
      if(rk===2)o.push(S.PL(poly.map(function(q){return [P.X(Math.max(-30,Math.min(30,q[0]))),P.Y(Math.max(-30,Math.min(30,q[1])))];}),"signal",1.2,"signal",null,0.15));
      else{var mx=0,ix=0;poly.forEach(function(q,k2){var d2=q[0]*q[0]+q[1]*q[1];if(d2>mx){mx=d2;ix=k2;}});var q0=poly[ix];
        o.push(P.clip([[-q0[0],-q0[1]],[q0[0],q0[1]]],"alias",3));}
      /* 閉ループの動き（板 1 だけが 10 K 高い状態から） */
      var nt=300,tE=1500,E=mat.expm(mat.scale(Acl,tE/nt)),x=[[10],[0]],tr=[],tt=[],x1=[],x2=[],dq=[];
      for(i=0;i<=nt;i++){tt.push(tE*i/nt);x1.push(x[0][0]);x2.push(x[1][0]);dq.push(-(F[0][0]*x[0][0]+F[0][1]*x[1][0]));tr.push([x[0][0],x[1][0]]);x=mat.mul(E,x);}
      o.push(P.clip(tr,"ink",1.8));o.push(S.D(P.X(10),P.Y(0),"ink",3.4));
      /* 可制御性行列の 2 つの列（向きだけ。長さをそろえる）。動きの軌跡の上に描く */
      function unit(v){var n2=Math.hypot(v[0],v[1])||1;return [v[0]/n2*12,v[1]/n2*12];}
      var cb=unit([Wc[0][0],Wc[1][0]]),cab=unit([Wc[0][1],Wc[1][1]]);
      if(rk===2)o.push(S.PL([[P.X(0),P.Y(0)],[P.X(cb[0]),P.Y(cb[1])],[P.X(cb[0]+cab[0]),P.Y(cb[1]+cab[1])],[P.X(cab[0]),P.Y(cab[1])]],"none",0,"gold",null,0.25));
      o.push(S.ARR(P.X(0),P.Y(0),P.X(cb[0]),P.Y(cb[1]),"gold",2.4));o.push(S.ARR(P.X(0),P.Y(0),P.X(cab[0]),P.Y(cab[1]),"purple",2.4));
      o.push(S.T(P.X(cb[0])+(cb[0]>=0?4:-4),P.Y(cb[1])-5,"B","start",10,"gold",true,false,null,true));
      o.push(S.T(P.X(cab[0])+(cab[0]>=0?4:-4),P.Y(cab[1])+14,"AB","start",10,"purple",true,false,null,true));
      o.push(S.T(P.X(10)+2,P.Y(0)+16,"始め","middle",9,"ink",false,false,null,true));
      /* (b) s 平面 */
      var lo=-6;evo.concat(evc.map(function(z){return z.re;})).forEach(function(v){lo=Math.min(lo,v*1000*1.25);});
      evc.forEach(function(z){lo=Math.min(lo,-Math.abs(z.im)*1000*2.2);});
      var span=-lo*1.15,qx=nar?52:380,qy=nar?py+pw+70:26,qw=nar?300:140,Q=U.plot(qx,qy,qw,qw,[lo,-lo*0.15],[-span/2,span/2]);
      o.push(S.T(nar?14:qx-36,qy-12,"(b) 固有値 [10⁻³ /s]","start",10.5,"ink",true));
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"var(--screen)","line",0.8));
      o.push(U.ctl.splane(Q,{}));
      o.push(Q.axes({xt:U.nice(lo,0,3).filter(function(v){return v>=lo&&v<=0;}),yt:U.nice(-span/2,span/2,2).filter(function(v){return Math.abs(v)<=span/2;}),xfmt:function(v){return _w18_s(v,3);},yfmt:function(v){return _w18_s(v,3);},grid:false,sz:9}));
      o.push(U.ctl.pz(Q,evo.map(function(v){return {re:v*1000,im:0};}),[],"muted",5));
      o.push(U.ctl.pz(Q,evc.map(function(z){return {re:z.re*1000,im:z.im*1000};}),[],"signal",6));
      if(fixed!==null){o.push(S.CIRC(Q.X(fixed*1000),Q.Y(0),11,"alias",1.6));o.push(S.T(Q.X(fixed*1000),Q.Y(0)+26,"動かない","middle",9.5,"alias",true,false,null,true));}
      /* (c) 時間の動き */
      var rx=nar?52:380,ry=nar?qy+qw+64:qy+qw+58,rw=nar?300:300,rhh=nar?120:100,Rr=U.plot(rx,ry,rw,rhh,[0,1500],[-15,15]);
      o.push(S.T(nar?14:rx-36,ry-12,"(c) 温度のずれの時間変化","start",10.5,"ink",true));
      o.push(Rr.axes({xl:"時間 t [s]",xt:[0,500,1000,1500],yt:[-10,0,10],xfmt:function(v){return String(v);},yfmt:function(v){return _w18_s(v);},sz:9}));
      o.push(S.L(Rr.X(0),Rr.Y(0),Rr.X(1500),Rr.Y(0),"faint",1));
      o.push(Rr.clip(tt.map(function(t,k2){return [t,x1[k2]-x2[k2]];}),"alias",1.4,"5 3"));
      o.push(Rr.clip(tt.map(function(t,k2){return [t,x1[k2]];}),"signal",2));o.push(Rr.clip(tt.map(function(t,k2){return [t,x2[k2]];}),"teal",2));
      o.push(S.LEGL(rx,ry+rhh+46,[["signal",null,"板 1"],["teal",null,"板 2"],["alias","5 3","差"]],9.5,12));
      box.set(S.svg(Wd,ry+rhh+56,o));
      /* 読み出し */
      var h="";
      h+="可制御性行列 [B AB] = [["+_w18_g(Wc[0][0]*1e3,3)+", "+_w18_g(Wc[0][1]*1e3,3)+"], ["+_w18_g(Wc[1][0]*1e3,3)+", "+_w18_g(Wc[1][1]*1e3,3)+"]] × 10<sup>−3</sup>、行列式 "+_w18_g(det,3)+"、階数 <b>"+rk+"</b> → "+(rk===2?'<span class="ok">可制御</span>':'<span class="warn">可制御でない</span>')+"<br>";
      h+="開ループの固有値: "+_w18_g(evo[0],3)+"（そろう動き）・"+_w18_g(evo[1],3)+(R12?"（差）":"")+" /s　閉ループの固有値（A − BF）: <b>"+_w18_plist(evc,3)+"</b> /s<br>";
      if(fixed!==null)h+='<span class="warn">固有値 '+_w18_g(fixed,3)+" /s は、f₁・f₂ をどう変えても動かない（"+(Math.abs(b)<1e-15?"つないでいないので、2 枚は同じ固有値をもち、入力はいつも B の向きにしか届かない":"入力が届かないのは "+(Math.abs(bd)<1e-12/Cth?"差 [1, −1]ᵀ":"そろう動き [1, 1]ᵀ")+" のモード")+"）</span><br>";
      else if(Math.abs(det)<5e-10)h+="可制御だが行列式が小さい: 500 s のうちに届く範囲は細く、差の向きへ動かすには大きな電力が要る<br>";
      var dm=_w18_max(dq,Math.abs);
      h+="板 1 だけが 10 K 高い状態から放したとき: 1500 s 後の差 "+_w18_f(x1[nt]-x2[nt],2)+" K、ヒータの電力の変化は最大 "+_w18_f(dm.v,1)+" W"+(dm.v>40?'（<span class="warn">±40 W を超える</span>）':"")+"<br>";
      ro.innerHTML=h+'<div class="wnote">本文 2 節の例の値（熱容量 400 J/K、周りへの熱抵抗 1.25 K/W）。状態は、ヒータ 40 W のときの釣り合いの温度からのずれで、ヒータの電力の変化 δq = −f₁ × (板 1 のずれ) − f₂ × (板 2 のずれ) を加える（上限は考えない）。(a) の矢印は可制御性行列の 2 つの列の向き、青い範囲（可制御でないときは赤い線分）は ±40 W の電力で 500 s のうちに届く状態、「始め」からの線は (c) の動きの軌跡。</div>';
    }
    draw();
  };

  /* ---- 3 節: 極配置（2 次の対象） ---- */
  REG.w18_place=function(el,U){
    var S=U.S,mat=U.ctl.mat,poly=U.ctl.poly;
    var SYS=[{name:"台車とばね・ダンパ（1 kg・2 N·s/m・25 N/m）",A:[[0,1],[-25,-2]],B:[[0],[1]],x0:[0.1,0],yl:"位置 p [cm]",ys:100,un:["N/m","N·s/m"],st:["位置","速度"],init:"10 cm ずらして放す",f1r:[-100,200],f2r:[-20,40]},
             {name:"振子の角度と角速度だけ（17 章 4 節の 2 次の部分）",A:[[0,1],[45.78,0]],B:[[0],[-1/0.15]],x0:[5*Math.PI/180,0],yl:"角度 φ [°]",ys:180/Math.PI,un:["N/rad","N·s/rad"],st:["角度","角速度"],init:"5° 傾けて放す",f1r:[-100,20],f2r:[-12,4]}];
    U.head(el,"POLE PLACEMENT","望む極からゲイン F を求める — 2 次の対象");
    var r0=U.ctrls(el);
    var sy=U.select(r0,"対象",SYS.map(function(s){return s.name;}),0,function(){setRanges();draw();});
    var rm=U.ctrls(el);
    var mode=U.seg(rm,["望む極から F を求める","ゲインを決めて極を見る"],0,function(i){if(i===1){var Fq=curF();f1.set(Fq[0]);f2.set(Fq[1]);}else syncPoles();draw();});
    var r1=U.ctrls(el);
    var zt=U.slider(r1,"望む極の減衰比 ζ",{min:0.1,max:3,step:0.001,value:0.7071,fmt:function(v){return _w18_f(v,3);},onInput:function(){draw();}});
    var wn=U.slider(r1,"望む極の固有角周波数 ω<sub>n</sub>",{min:1,max:30,log:true,value:7.071,snap:function(v){return +v.toPrecision(4);},fmt:function(v){return _w18_s(v,3)+" rad/s";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var f1=U.slider(r2,"f<sub>1</sub>",{min:-100,max:200,step:0.5,value:25,fmt:function(v){return _w18_f(v,1)+" "+SYS[sy.get()].un[0];},onInput:function(){draw();}});
    var f2=U.slider(r2,"f<sub>2</sub>",{min:-20,max:40,step:0.05,value:8,fmt:function(v){return _w18_f(v,2)+" "+SYS[sy.get()].un[1];},onInput:function(){draw();}});
    function setRanges(){var s=SYS[sy.get()];f1.input.min=s.f1r[0];f1.input.max=s.f1r[1];f2.input.min=s.f2r[0];f2.input.max=s.f2r[1];f1.refresh();f2.refresh();}
    var br=U.btnrow(el);
    function ex(sys,m,z,w,a,b){sy.set(sys);setRanges();mode.set(m);if(m===0){zt.set(z);wn.set(w);}else{f1.set(a);f2.set(b);}draw();}
    U.button(br,"本文の例（台車、−5 ± j5）",function(){ex(0,0,0.7071,7.071);});
    U.button(br,"何もしない（F = 0）",function(){ex(0,1,0,0,0,0);});
    U.button(br,"f₁ だけ 75（ばねを足す）",function(){ex(0,1,0,0,75,0);});
    U.button(br,"f₂ だけ 8（ダンパを足す）",function(){ex(0,1,0,0,0,8);});
    U.button(br,"f₂ だけ 18（過減衰の台車）",function(){ex(0,1,0,0,0,18);});
    U.button(br,"振子の角度を −5 ± j5 に",function(){ex(1,0,0.7071,7.071);});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,grab=-1;
    function desired(){var z=zt.get(),w=wn.get();
      if(z<1){var wd=w*Math.sqrt(1-z*z);return [{re:-z*w,im:wd},{re:-z*w,im:-wd}];}
      var s2=w*Math.sqrt(z*z-1);return [{re:-z*w-s2,im:0},{re:-z*w+s2,im:0}];}
    /* 係数の比較（本文 3 節の連立方程式） */
    function coefF(s,ab1,ab0){var A=s.A,b1=s.B[0][0],b2=s.B[1][0],a11=A[0][0],a12=A[0][1],a21=A[1][0],a22=A[1][1];
      var M=[[b1,b2],[a12*b2-a22*b1,a21*b1-a11*b2]],rhs=[ab1+a11+a22,ab0-(a11*a22-a12*a21)],dt=M[0][0]*M[1][1]-M[0][1]*M[1][0];
      return {F:[(rhs[0]*M[1][1]-M[0][1]*rhs[1])/dt,(M[0][0]*rhs[1]-M[1][0]*rhs[0])/dt],det:dt};}
    function curF(){var s=SYS[sy.get()];if(mode.get()===1)return [f1.get(),f2.get()];var z=zt.get(),w=wn.get();return coefF(s,2*z*w,w*w).F;}
    function syncPoles(){var s=SYS[sy.get()],F=[f1.get(),f2.get()],Acl=mat.sub(s.A,mat.mul(s.B,[F])),c1=-(Acl[0][0]+Acl[1][1]),c0=mat.det(Acl);
      if(c1>0&&c0>0){var w=Math.sqrt(c0),z=c1/(2*w);if(z>=0.1&&z<=3&&w>=1&&w<=30){zt.set(z);wn.set(w);}}}
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){grab=-1;return;}
      if(x==null||!PP)return;
      if(type==="down"){if(mode.get()!==0)return false;var ps=desired(),best=-1,bd=20;
        ps.forEach(function(p,i){var d=Math.hypot(x-PP.X(p.re),y-PP.Y(p.im));if(d<bd){bd=d;best=i;}});
        if(best<0)return false;grab=best;return;}
      if(grab<0)return;
      var sg=Math.min(-0.3,Math.max(PP.xr[0],PP.ux(x))),om=Math.min(PP.yr[1],Math.abs(PP.uy(y))),z0=zt.get(),z,w;
      if(z0<1||om>0.6){if(om>0.6){w=Math.hypot(sg,om);z=-sg/w;}else{w=-sg;z=1;}}
      else{var ps2=desired(),other=ps2[1-grab].re;w=Math.sqrt(sg*other);z=-(sg+other)/(2*w);}
      zt.set(Math.max(0.1,Math.min(3,z)));wn.set(Math.max(1,Math.min(30,w)));
      /* 実軸の上で 2 つの極が入れ替わっても、つかんでいる極を見失わないように選び直す */
      var ps3=desired();grab=Math.abs(ps3[0].re-sg)<=Math.abs(ps3[1].re-sg)?0:1;draw();});
    function draw(){
      var s=SYS[sy.get()],m=mode.get();
      r1.style.display=m===0?"":"none";r2.style.display=m===1?"":"none";
      var F,ab1,ab0,info;
      if(m===0){var z=zt.get(),w=wn.get();ab1=2*z*w;ab0=w*w;info=coefF(s,ab1,ab0);F=info.F;}
      else{F=[f1.get(),f2.get()];info=coefF(s,0,0);}
      var Acl=mat.sub(s.A,mat.mul(s.B,[F])),c1=-(Acl[0][0]+Acl[1][1]),c0=mat.det(Acl),rs=poly.roots([1,c1,c0]);
      var unst=rs.some(function(r){return r.re>=-1e-9;}),smin=Infinity;rs.forEach(function(r){smin=Math.min(smin,-r.re);});
      var tE=unst?2:Math.max(0.4,Math.min(12,6/smin)),n=1200,E=mat.expm(mat.scale(Acl,tE/n)),xx=[[s.x0[0]],[s.x0[1]]],ys=[],us=[],tt=[],i;
      for(i=0;i<=n;i++){tt.push(tE*i/n);ys.push(xx[0][0]*s.ys);us.push(-(F[0]*xx[0][0]+F[1]*xx[1][0]));xx=mat.mul(E,xx);}
      var y0=ys[0],t2=null;for(i=n;i>=0;i--)if(Math.abs(ys[i])>0.02*Math.abs(y0)){t2=i<n?tt[i+1]:null;break;}
      var umx=_w18_max(us,Math.abs),ymn=_w18_min(ys);
      /* 図 */
      var nar=_w18_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?56:50,26,nar?300:270,nar?300:270,[-25,10],[-17.5,17.5]);PP=P;
      o.push(S.T(nar?14:10,14,"s 平面（"+(m===0?"望む極をドラッグ":"F から決まる極")+"）","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.8));
      o.push(U.ctl.splane(P,{}));
      o.push(P.axes({xl:"実部 [1/s]",yl:"虚部 [rad/s]",xt:[-25,-20,-15,-10,-5,0,5,10],yt:[-15,-10,-5,0,5,10,15],xfmt:function(v){return _w18_s(v);},yfmt:function(v){return _w18_s(v);},grid:false,sz:9,ylOff:34}));
      if(m===1){/* f₁ だけ・f₂ だけを変えたときの道すじ */
        var A=s.A;
        [[0,"teal"],[1,"purple"]].forEach(function(q){var pts=[],rg=q[0]===0?s.f1r:s.f2r;
          for(var k=0;k<=160;k++){var v=rg[0]+(rg[1]-rg[0])*k/160,Fq=q[0]===0?[v,F[1]]:[F[0],v],Aq=mat.sub(A,mat.mul(s.B,[Fq])),rr=poly.roots([1,-(Aq[0][0]+Aq[1][1]),mat.det(Aq)]);
            rr.forEach(function(r){if(r.re>=P.xr[0]&&r.re<=P.xr[1]&&r.im>=P.yr[0]&&r.im<=P.yr[1])pts.push(S.D(P.X(r.re),P.Y(r.im),q[1],1.3));});}
          o.push(pts.join(""));});
        o.push(S.T(P.x+P.w-4,P.y+P.h-8,"青緑: f₁ だけ　紫: f₂ だけを動かした道","end",9,"muted",false,false,null,true));}
      o.push(U.ctl.pz(P,poly.roots([1,-(s.A[0][0]+s.A[1][1]),mat.det(s.A)]),[],"muted",5));
      o.push(U.ctl.pz(P,rs,[],unst?"alias":"signal",7));
      if(m===0)rs.forEach(function(r){if(r.re>=P.xr[0]&&r.re<=P.xr[1]&&r.im>=P.yr[0]&&r.im<=P.yr[1])o.push(S.CIRC(P.X(r.re),P.Y(r.im),12,"signal",1,null,"3 2"));});
      /* 応答と入力 */
      var qx=nar?56:400,qy=nar?26+300+66:26,qw=nar?300:280,yr=[Math.min(-0.6*Math.abs(y0),ymn.v*1.1),Math.abs(y0)*1.15];
      if(unst)yr=[-3*Math.abs(y0),3*Math.abs(y0)];
      var Q=U.plot(qx,qy,qw,110,[0,tE],yr);
      o.push(S.T(nar?14:qx-40,qy-12,"応答（"+s.init+"）","start",10.5,"ink",true));
      o.push(Q.axes({yl:s.yl,xt:U.nice(0,tE,5),yt:U.nice(yr[0],yr[1],4),xfmt:function(){return "";},yfmt:function(v){return _w18_s(v,3);},sz:9,ylOff:36}));
      o.push(S.L(Q.X(0),Q.Y(0),Q.X(tE),Q.Y(0),"faint",1));
      [0.02,-0.02].forEach(function(f){o.push(S.L(Q.X(0),Q.Y(f*y0),Q.X(tE),Q.Y(f*y0),"faint",0.8,"2 2"));});
      o.push(Q.clip(tt.map(function(t,k){return [t,ys[k]];}),unst?"alias":"signal",2));
      if(t2!==null&&!unst){o.push(S.L(Q.X(t2),Q.y,Q.X(t2),Q.y+Q.h,"green",1,"3 3"));o.push(S.T(Q.X(t2)+3,Q.y+12,"±2 % に "+_w18_s(t2,3)+" s","start",9,"green",true,false,null,true));}
      var ua=Math.max(1e-6,umx.v*1.15),R=U.plot(qx,qy+150,qw,90,[0,tE],[-ua,ua]);
      o.push(R.axes({xl:"時間 t [s]",yl:"入力 u [N]",xt:U.nice(0,tE,5),yt:U.nice(-ua,ua,4),xfmt:function(v){return _w18_s(v,3);},yfmt:function(v){return _w18_s(v,2);},sz:9,ylOff:36}));
      o.push(S.L(R.X(0),R.Y(0),R.X(tE),R.Y(0),"faint",1));
      o.push(R.clip(tt.map(function(t,k){return [t,us[k]];}),"gold",2));
      box.set(S.svg(Wd,Math.max(R.y+R.h+44,P.y+P.h+42),o));
      /* 読み出し */
      var h="",dC=info.det;
      if(m===0){var ps=desired();h+="望む極 <b>"+_w18_plist(ps,3)+"</b>（ζ = "+_w18_f(zt.get(),3)+"、ω<sub>n</sub> = "+_w18_g(wn.get(),3)+" rad/s）、ā(λ) = λ² + "+_w18_g(ab1,3)+"λ + "+_w18_g(ab0,3)+"<br>";
        var Fa=_w18_acker(U,s.A,s.B,ps);
        h+="係数の比較: "+(sy.get()===0?"f₂ = ā₁ − 2、f₁ = ā₀ − 25":"f₂ = −ā₁ ÷ 6.667、f₁ = −(ā₀ + 45.78) ÷ 6.667")+" → <b>F = ["+_w18_g(F[0],3)+"  "+_w18_g(F[1],3)+"]</b>（"+s.un[0]+"、"+s.un[1]+"）。アッカーマンの式でも ["+_w18_g(Fa[0],3)+"  "+_w18_g(Fa[1],3)+"]<br>";}
      else h+="F = ["+_w18_g(F[0],3)+"  "+_w18_g(F[1],3)+"] → 閉ループの特性多項式 λ² + "+_w18_g(c1,3)+"λ + "+_w18_g(c0,3)+"、極 <b>"+_w18_plist(rs,3)+"</b><br>";
      if(sy.get()===0)h+="台車では、ばねを 25 + f₁ = "+_w18_g(25+F[0],3)+" N/m、ダンパを 2 + f₂ = "+_w18_g(2+F[1],3)+" N·s/m にしたのと同じ"+(25+F[0]<0||2+F[1]<0?"（負のばね・ダンパ）":"")+"<br>";
      else h+="振子の角度だけを戻す（台車の位置と速度は戻さない。4 節）<br>";
      if(unst)h+='<span class="warn">閉ループが不安定（右半平面か虚軸の上に極がある）</span><br>';
      else h+=s.init+": ±2 % に <b>"+(t2!==null?_w18_g(t2,3)+" s":"—")+"</b>、最大の力 <b>"+_w18_g(umx.v,3)+" N</b>"+(ymn.v<0?"、反対側へ "+_w18_g(-ymn.v,3)+" "+(sy.get()===0?"cm":"°")+"（"+_w18_g(-ymn.v/Math.abs(y0)*100,2)+" %）":"")+"<br>";
      h+="可制御性行列の行列式 det [B AB] = "+_w18_g(dC,4)+"（0 でないので、どんな極にも F が 1 つ決まる）";
      ro.innerHTML=h+'<div class="wnote">閉ループ '+U.htx("\\dot{x}")+' = (A − BF)x を、行列指数関数で厳密に解いた。図の灰色の × は開ループの極、青の × は閉ループの極。「望む極から F を求める」では、極（点線の丸）をドラッグするか、ζ・ω<sub>n</sub> のつまみで動かす。実軸へ下ろすと 2 つの実数の極になり、実軸の上ではそれぞれを左右に動かせる。</div>';
    }
    setRanges();draw();
  };

  /* ---- 4 節: 倒立振子を立てる ---- */
  REG.w18_pendulum=function(el,U){
    var S=U.S,AB=_w18_pAB();
    U.head(el,"INVERTED PENDULUM","倒立振子を極配置で立てる — 押す・傾ける・力の上限");
    var r1=U.ctrls(el);
    var s1=U.slider(r1,"極 −σ<sub>1</sub>（2 つ）",{values:[1.5,2,2.5,3,3.5,4,4.5,5,6,7,8,10],value:4,fmt:function(v){return "−"+v+" /s";},onInput:function(){run();}});
    var s2=U.slider(r1,"極 −σ<sub>2</sub>（2 つ）",{values:[1.5,2,2.5,3,3.5,4,4.5,5,6,7,8,10],value:4,fmt:function(v){return "−"+v+" /s";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var tl=U.slider(r2,"初めの傾き",{min:0,max:60,step:1,value:10,fmt:function(v){return v+"°";},onInput:function(){run();}});
    var pu=U.slider(r2,"押す力（1 s から 0.1 s）",{values:[-3,-2,-1,-0.5,0,0.5,1,2,3],value:0,fmt:function(v){return v===0?"なし":(v>0?"右 ":"左 ")+Math.abs(v)+" N";},onInput:function(){run();}});
    var um=U.select(r2,"力の上限",["なし","10 N","5 N（本文の例）","3 N","2 N"],2,function(){run();});
    var r3=U.ctrls(el);
    var lin=U.checkbox(r3,"線形化した式の動きも破線で重ねる",true,function(){run();});
    var st=U.slider(r3,"時刻（絵）",{min:0,max:1,step:0.001,value:0,fmt:function(v){return R?_w18_s(v*R.T,3)+" s":"";},onInput:function(){tk.stop();frame();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.04/6;if(v>=1){v=1;tk.stop();}st.set(v);frame();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function ex(a,b,t,p,u){tk.stop();s1.set(a);s2.set(b);tl.set(t);pu.set(p);um.set(u);st.set(0);run();}
    U.button(br,"本文の例（10° から）",function(){ex(4,4,10,0,2);});
    U.button(br,"押す（傾き 0、1 N）",function(){ex(4,4,0,1,2);});
    U.button(br,"25° から（上限 5 N）",function(){ex(4,4,25,0,2);});
    U.button(br,"32° から（倒れる）",function(){ex(4,4,32,0,2);});
    U.button(br,"極を −2・−8 に",function(){ex(2,8,10,0,2);});
    U.button(br,"極を −8 に（力が大きい）",function(){ex(8,8,10,0,2);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var a=s1.get(),b=s2.get(),poles=[{re:-a,im:0},{re:-a,im:0},{re:-b,im:0},{re:-b,im:0}],F=_w18_acker(U,AB.A,AB.B,poles);
      var umax=[null,10,5,3,2][+um.get()],ph0=tl.get()*Math.PI/180,p=pu.get(),push=p!==0?[1,0.1,p]:null;
      var T=6,o={F:F,x0:[0,0,ph0,0],T:T,h:0.002,umax:umax,push:push,every:5};
      var rn=_w18_sim(U,o),rl=lin.get()?_w18_sim(U,{F:F,x0:[0,0,ph0,0],T:T,h:0.002,umax:umax,push:push,every:5,nl:false}):null;
      R={F:F,a:a,b:b,umax:umax,T:T,n:rn,l:rl,push:push,ph0:ph0};
      frame();
    }
    function frame(){
      if(!R)return;var nar=_w18_nar(box),Wd=nar?400:700,o=[],rn=R.n,rl=R.l;
      var kk=Math.min(rn.t.length-1,Math.round(st.get()*(R.T/0.01))),tc=Math.min(rn.t[kk],st.get()*R.T);
      /* 動く絵 */
      var ax=nar?14:10,aw=nar?372:330,gy=nar?150:156,sc=nar?170:160,cx0=ax+aw/2;
      o.push(S.T(ax,14,"動く絵（線形でない式"+(rl?"。破線は線形化した式":"")+"）","start",10.5,"ink",true));
      o.push(_w18_ground(S,ax,ax+aw,gy));
      for(var m=-1;m<=1;m+=0.5){var xm=cx0+m*sc;if(xm>=ax&&xm<=ax+aw){o.push(S.L(xm,gy+2,xm,gy+8,"muted",1));o.push(S.T(xm,gy+20,_w18_s(m)+" m","middle",9,"muted"));}}
      function draw1(r,c,dash){var k=Math.min(r.t.length-1,kk),x=r.x[k],px=cx0+x[0]*sc;
        if(px<ax+20||px>ax+aw-20){o.push(S.T(px<ax+20?ax+4:ax+aw-4,gy-40,px<ax+20?"← 枠の外":"枠の外 →","start",9.5,c,true));return;}
        o.push(_w18_pend(S,U,px,gy,Math.max(-Math.PI/2,Math.min(Math.PI/2,x[2])),0.3*sc,c,dash,0.2*sc+10,16));}
      if(rl)draw1(rl,"muted","4 3");
      draw1(rn,"signal",null);
      var kx=Math.min(rn.t.length-1,kk),xx=rn.x[kx],uu=rn.u[kx],pxx=cx0+xx[0]*sc;
      if(Math.abs(uu)>0.02&&pxx>ax+20&&pxx<ax+aw-20){var L=8+7*Math.min(Math.abs(uu),8),sd=uu>0?-1:1,ex=pxx+sd*(0.1*sc+5+1);o.push(S.ARR(ex+sd*L,gy-22,ex,gy-22,"gold",2.4));}
      if(R.push&&tc>=1&&tc<1.1){var bx=pxx+0.3*sc*Math.sin(xx[2]),by=gy-28-0.3*sc*Math.cos(xx[2]),sp=R.push[2]>0?-1:1;o.push(S.ARR(bx+sp*34,by,bx+sp*9,by,"purple",2.6));}
      if(rn.fell&&tc>=rn.tf-0.01)o.push(S.T(ax+aw/2,40,"倒れた（"+_w18_s(rn.tf,3)+" s）","middle",12,"alias",true,false,null,true));
      o.push(S.T(ax,gy+40,"t = "+_w18_f(tc,2)+" s　角度 "+_w18_f(xx[2]*180/Math.PI,1)+"°　台車 "+_w18_f(xx[0]*100,1)+" cm　力 "+_w18_f(uu,2)+" N","start",9.5,"ink"));
      /* s 平面 */
      var sx=nar?60:60,sy2=nar?gy+78:gy+76,sw=nar?140:130,SP=U.plot(sx,sy2,sw,sw*0.6,[-11,9],[-6,6]);
      o.push(S.T(nar?14:10,sy2-10,"極（灰: 開ループ、青: 閉ループ）","start",9.5,"ink",true));
      o.push(S.RECT(SP.x,SP.y,SP.w,SP.h,0,"var(--screen)","line",0.8));o.push(U.ctl.splane(SP,{}));
      o.push(SP.axes({xt:[-10,-5,0,5],yt:[-5,0,5],xfmt:function(v){return _w18_s(v);},yfmt:function(v){return _w18_s(v);},grid:false,sz:8.5}));
      o.push(U.ctl.pz(SP,[{re:0,im:0},{re:6.766,im:0},{re:-6.766,im:0}],[],"muted",4.5));
      o.push(U.ctl.pz(SP,[{re:-R.a,im:0},{re:-R.b,im:0}],[],"signal",6));
      var fx=nar?sx+sw+20:sx+sw+16;
      o.push(S.T(fx,sy2+6,"F =","start",9.5,"ink",true));
      ["p","\\dot{p}","φ","\\dot{φ}"].forEach(function(nm,i){o.push(S.TX(fx,sy2+22+i*14,_w18_s(R.F[i],4)+" ("+nm+")","start",9.5,"signal"));});
      /* 波形 */
      var qx=nar?52:400,qy=nar?sy2+sw*0.6+50:22,qw=nar?330:290,specs=[["角度 φ [°]",function(x){return x[2]*180/Math.PI;},"signal"],["台車の位置 p [cm]",function(x){return x[0]*100;},"gold"],["力 u [N]",null,"gold"]];
      specs.forEach(function(sp,k){
        var vals=sp[1]?rn.x.map(sp[1]):rn.u,vl=rl?(sp[1]?rl.x.map(sp[1]):rl.u):[],lo=0,hi=0,i;
        for(i=0;i<vals.length;i++){lo=Math.min(lo,vals[i]);hi=Math.max(hi,vals[i]);}
        for(i=0;i<vl.length;i++){lo=Math.min(lo,vl[i]);hi=Math.max(hi,vl[i]);}
        if(k===0){lo=Math.max(lo,-95);hi=Math.min(hi,95);}if(k===1){lo=Math.max(lo,-150);hi=Math.min(hi,150);}
        if(hi-lo<1e-6){hi=1;lo=-1;}var pad=(hi-lo)*0.1;lo-=pad;hi+=pad;
        var Q=U.plot(qx,qy+k*(nar?100:118),qw,nar?70:84,[0,R.T],[lo,hi]);
        o.push(Q.axes({xl:k===2?"時間 t [s]":null,xt:[0,1,2,3,4,5,6],yt:U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),xfmt:k===2?function(v){return String(v);}:function(){return "";},yfmt:function(v){return _w18_s(v,3);},sz:9}));
        o.push(S.T(Q.x+Q.w-4,Q.y+12,sp[0],"end",9.5,"ink",true,false,null,true));
        if(lo<0&&hi>0)o.push(S.L(Q.X(0),Q.Y(0),Q.X(R.T),Q.Y(0),"faint",1));
        if(k===2&&R.umax!=null){[R.umax,-R.umax].forEach(function(v){if(v>lo&&v<hi)o.push(S.L(Q.X(0),Q.Y(v),Q.X(R.T),Q.Y(v),"alias",1,"4 3"));});}
        if(rl)o.push(Q.clip(rl.t.map(function(t,i2){return [t,vl[i2]];}),"muted",1.4,"5 3"));
        o.push(Q.clip(rn.t.map(function(t,i2){return [t,vals[i2]];}),sp[2],2));
        o.push(S.L(Q.X(tc),Q.y,Q.X(tc),Q.y+Q.h,"alias",1,"2 2"));});
      box.set(S.svg(Wd,nar?qy+3*100+16:Math.max(qy+3*118+10,sy2+sw*0.6+40),o));
      /* 読み出し */
      function stats(r){var pm=_w18_max(r.x,function(x){return Math.abs(x[2]);}),pp=_w18_max(r.x,function(x){return Math.abs(x[0]);}),uu2=_w18_max(r.u,Math.abs),ts=null,sat=0,i;
        for(i=r.x.length-1;i>=0;i--)if(Math.abs(r.x[i][2])>0.2*Math.PI/180){ts=i<r.x.length-1?r.t[i+1]:null;break;}
        if(R.umax!=null)for(i=1;i<r.u.length;i++)if(Math.abs(r.u[i])>=R.umax-1e-9)sat+=r.t[i]-r.t[i-1];
        var pmx=_w18_max(r.x,function(x){return x[2];}),pmn=_w18_min(r.x,function(x){return x[2];});
        return {ph:pm.v*180/Math.PI,php:pmx.v*180/Math.PI,phn:pmn.v*180/Math.PI,p:pp.v*100,u:uu2.v,ts:ts,sat:sat};}
      var a1=stats(rn),h="";
      h+="F = [<b>"+R.F.map(function(v){return _w18_g(v,4);}).join("  ")+"</b>]（N/m、N/(m/s)、N/rad、N/(rad/s)）。極 −"+R.a+"・−"+R.a+"・−"+R.b+"・−"+R.b+" /s<br>";
      if(rn.fell)h+='<span class="warn">線形でない式: '+_w18_s(rn.tf,3)+" s に倒れた</span>"+(R.umax!=null?"（力が上限 "+R.umax+" N に張り付いて、傾きが増えるのを止められなかった）":"（傾きが大きく、線形化した式で決めた F では戻せない）")+"<br>";
      else h+="線形でない式: 傾きは右へ最大 "+_w18_f(a1.php,1)+"°・左へ最大 "+_w18_f(-a1.phn,1)+"°、台車が動く最大の距離 <b>"+_w18_f(a1.p,1)+" cm</b>、最大の力 <b>"+_w18_s(a1.u,3)+" N</b>"+(a1.sat>0?"（上限に張り付いた時間 "+_w18_s(a1.sat,2)+" s）":"")+"、±0.2° に収まる時刻 "+(a1.ts!==null?_w18_s(a1.ts,3)+" s"+(R.push&&a1.ts>R.push[0]?"（押し始めから "+_w18_s(a1.ts-R.push[0],3)+" s）":""):"—")+"<br>";
      if(rl){var a2=stats(rl);h+="線形化した式: "+(rl.fell?"倒れた（"+_w18_s(rl.tf,3)+" s）":"台車が動く最大の距離 "+_w18_f(a2.p,1)+" cm、最大の力 "+_w18_s(a2.u,3)+" N")+"<br>";}
      if(R.umax!=null)h+="力の上限 "+R.umax+" N で、どんな制御器でも傾きが増えるのを止められなくなる角度: tan φ = "+R.umax+" ÷ ((M + m)g) から <b>"+_w18_f(Math.atan(R.umax/(0.7*9.81))*180/Math.PI,1)+"°</b>";
      ro.innerHTML=h+'<div class="wnote">本文 4 節の倒立振子（台車 0.5 kg、おもり 0.2 kg、長さ 0.3 m）。F は線形化した式からアッカーマンの式で求め、線形でない式（17 章 2 節）を 4 次のルンゲ・クッタ法（刻み 2 ms）で解いた。押す力は、1 s から 0.1 s の間、おもりに水平に加える（紫の矢印）。金の矢印は台車を押す力。</div>';
    }
    run();
  };

  /* ---- 5 節: 積分型サーボ系 ---- */
  REG.w18_servo=function(el,U){
    var S=U.S,AB=_w18_pAB(),mat=U.ctl.mat;
    U.head(el,"INTEGRAL SERVO","台車を目標の位置へ運ぶ — 積分型サーボ系と、積分の無い状態フィードバック");
    var r1=U.ctrls(el);
    var rr=U.slider(r1,"目標の位置 r",{min:-0.8,max:0.8,step:0.05,value:0.5,fmt:function(v){return _w18_f(v,2)+" m";},onInput:function(){run();}});
    var dd=U.slider(r1,"外乱の力（6 s から台車に）",{values:[-1,-0.5,0,0.5,1],value:0.5,fmt:function(v){return v===0?"なし":(v>0?"右へ ":"左へ ")+Math.abs(v)+" N";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var sg=U.slider(r2,"極の位置（どれも −σ）",{values:[2,2.5,3,3.5,4,4.5,5,6],value:4,fmt:function(v){return "−"+v+" /s";},onInput:function(){run();}});
    var um=U.select(r2,"力の上限",["なし","5 N"],0,function(){run();});
    var ws=U.select(r2,"動く絵",["積分型サーボ系","積分なし"],0,function(){frame();});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻（絵）",{min:0,max:1,step:0.001,value:0,fmt:function(v){return _w18_s(v*14,3)+" s";},onInput:function(){tk.stop();frame();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.04/14*1.5;if(v>=1){v=1;tk.stop();}st.set(v);frame();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function ex(r,d,s,u){tk.stop();rr.set(r);dd.set(d);sg.set(s);um.set(u);st.set(0);run();}
    U.button(br,"本文の例（0.5 m、外乱 0.5 N）",function(){ex(0.5,0.5,4,0);});
    U.button(br,"外乱なし",function(){ex(0.5,0,4,0);});
    U.button(br,"左へ 0.5 m",function(){ex(-0.5,0.5,4,0);});
    U.button(br,"極を −2.5 に（ゆっくり）",function(){ex(0.5,0.5,2.5,0);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var s=sg.get(),r=rr.get(),d=dd.get(),umax=[null,5][+um.get()];
      var C=[[1,0,0,0]],Ai=[[0,1,0,0,0],[0,0,AB.A[1][2],0,0],[0,0,0,1,0],[0,0,AB.A[3][2],0,0],[-1,0,0,0,0]],Bi=[[0],[AB.B[1][0]],[0],[AB.B[3][0]],[0]];
      var p4=[],p5=[],i;for(i=0;i<4;i++)p4.push({re:-s,im:0});for(i=0;i<5;i++)p5.push({re:-s,im:0});
      var F4=_w18_acker(U,AB.A,AB.B,p4),Fi=_w18_acker(U,Ai,Bi,p5);
      var rf=function(){return r;},df=function(t){return t>=6?d:0;};
      var ri=_w18_sim(U,{F:Fi.slice(0,4),fI:Fi[4],x0:[0,0,0,0],T:14,h:0.002,umax:umax,r:rf,dist:df,every:5});
      var rn=_w18_sim(U,{F:F4,x0:[0,0,0,0],T:14,h:0.002,umax:umax,r:rf,dist:df,every:5});
      R={r:r,d:d,s:s,umax:umax,F4:F4,Fi:Fi,ri:ri,rn:rn,det:mat.det(mat.ctrb(Ai,Bi))};
      frame();
    }
    function frame(){
      if(!R)return;var nar=_w18_nar(box),Wd=nar?400:700,o=[],main=+ws.get()===0?R.ri:R.rn,other=+ws.get()===0?R.rn:R.ri;
      var tc=st.get()*14,kk=Math.min(main.t.length-1,Math.round(tc/0.01));
      /* 動く絵 */
      var ax=nar?14:20,aw=nar?372:660,gy=nar?110:150,sc=aw/2.2,cx0=ax+aw/2;
      o.push(S.T(ax,14,"動く絵（"+(+ws.get()===0?"積分型サーボ系":"積分なし")+"。線形でない式）","start",10.5,"ink",true));
      o.push(_w18_ground(S,ax,ax+aw,gy));
      [-1,-0.5,0,0.5,1].forEach(function(m){var xm=cx0+m*sc;o.push(S.L(xm,gy+2,xm,gy+8,"muted",1));o.push(S.T(xm,gy+20,_w18_s(m)+" m","middle",9,"muted"));});
      var xr=cx0+R.r*sc;o.push(S.L(xr,32,xr,gy,"muted",1.2,"6 4"));o.push(S.T(xr,28,"目標 "+_w18_s(R.r,3)+" m","middle",9.5,"muted",true,false,null,true));
      var x=main.x[kk],u=main.u[kk],px=cx0+x[0]*sc;
      o.push(_w18_pend(S,U,px,gy,Math.max(-Math.PI/2,Math.min(Math.PI/2,x[2])),0.3*sc,"signal",null,nar?40:46,16));
      if(Math.abs(u)>0.02){var L=8+9*Math.min(Math.abs(u),6),sd=u>0?-1:1,ex=px+sd*((nar?40:46)/2+2);o.push(S.ARR(ex+sd*L,gy-22,ex,gy-22,"gold",2.4));}
      if(R.d!==0&&tc>=6){var sd2=R.d>0?-1:1;o.push(S.ARR(px+sd2*((nar?40:46)/2+40),gy-8,px+sd2*((nar?40:46)/2+4),gy-8,"purple",2));}
      o.push(S.T(ax,gy+40,"t = "+_w18_f(tc,2)+" s　台車 "+_w18_f(x[0],3)+" m　角度 "+_w18_f(x[2]*180/Math.PI,1)+"°　力 "+_w18_f(u,2)+" N","start",9.5,"ink"));
      /* 波形 */
      var qx=nar?52:64,qw=nar?330:600,qy=gy+64,specs=[["台車の位置 p [m]",function(x2){return x2[0];}],["角度 φ [°]",function(x2){return x2[2]*180/Math.PI;}],["力 u [N]",null]];
      specs.forEach(function(sp,k){
        var a=sp[1]?R.ri.x.map(sp[1]):R.ri.u,b=sp[1]?R.rn.x.map(sp[1]):R.rn.u,lo=0,hi=0,i;
        for(i=0;i<a.length;i++){lo=Math.min(lo,a[i]);hi=Math.max(hi,a[i]);}for(i=0;i<b.length;i++){lo=Math.min(lo,b[i]);hi=Math.max(hi,b[i]);}
        if(k===0){lo=Math.min(lo,R.r);hi=Math.max(hi,R.r);}if(hi-lo<1e-6){hi=1;lo=-1;}var pad=(hi-lo)*0.12;lo-=pad;hi+=(hi-lo)*0.22;
        var hh=nar?62:(k===0?96:66),Q=U.plot(qx,qy,qw,hh,[0,14],[lo,hi]);
        o.push(Q.axes({xl:k===2?"時間 t [s]":null,xt:[0,2,4,6,8,10,12,14],yt:U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),xfmt:k===2?function(v){return String(v);}:function(){return "";},yfmt:function(v){return _w18_s(v,3);},sz:9}));
        o.push(S.T(k===0?Q.x+6:Q.x+Q.w-4,Q.y+11,sp[0],k===0?"start":"end",9.5,"ink",true,false,null,true));
        if(lo<0&&hi>0)o.push(S.L(Q.X(0),Q.Y(0),Q.X(14),Q.Y(0),"faint",1));
        if(k===0)o.push(S.L(Q.X(0),Q.Y(R.r),Q.X(14),Q.Y(R.r),"muted",1.2,"6 4"));
        if(R.d!==0)o.push(S.L(Q.X(6),Q.y,Q.X(6),Q.y+Q.h,"purple",1,"3 3"));
        o.push(Q.clip(R.rn.t.map(function(t,i2){return [t,b[i2]];}),"alias",1.7,"6 3"));
        o.push(Q.clip(R.ri.t.map(function(t,i2){return [t,a[i2]];}),"green",2.1));
        o.push(S.L(Q.X(tc),Q.y,Q.X(tc),Q.y+Q.h,"ink",1,"2 2"));
        qy+=hh+(k===2?0:22);});
      o.push(S.LEGL(qx,qy+48,[["green",null,"積分型サーボ系"],["alias","6 3","積分なし u = −F(x − x_r)"]],9.5,16));
      box.set(S.svg(Wd,qy+58,o));
      /* 読み出し */
      function stats(rs){var i,sgn=R.r>=0?1:-1,rev=0,t1=null,k6=Math.round(6/0.01),ex2=0,fin=rs.x[rs.x.length-1][0];
        for(i=0;i<=Math.min(k6,rs.x.length-1);i++)rev=Math.max(rev,-sgn*rs.x[i][0]);
        for(i=Math.min(k6,rs.x.length-1);i>=0;i--)if(Math.abs(rs.x[i][0]-R.r)>0.01){t1=i<k6?rs.t[i+1]:null;break;}
        for(i=k6;i<rs.x.length;i++)ex2=Math.max(ex2,Math.abs(rs.x[i][0]-R.r));
        var um2=_w18_max(rs.u,Math.abs);return {rev:rev,t1:t1,ex:ex2,fin:fin,u:um2.v,u0:rs.u[0]};}
      var a=stats(R.ri),b=stats(R.rn),h="";
      h+="積分型サーボ系: [F f<sub>I</sub>] = [<b>"+R.Fi.map(function(v){return _w18_g(v,4);}).join("  ")+"</b>]（5 つの極 −"+R.s+"）、積分を加えた系の可制御性行列の行列式 "+_w18_g(R.det,3)+"<br>";
      h+="　初めの力 "+_w18_f(a.u0,2)+" N、先に逆へ <b>"+_w18_f(a.rev*100,1)+" cm</b>、目標の ±1 cm に <b>"+(a.t1!==null?_w18_s(a.t1,3)+" s":"—")+"</b>"+(R.d!==0?"、外乱の後の最大のずれ "+_w18_f(a.ex*100,1)+" cm":"")+"、14 s の位置 "+_w18_f(a.fin,3)+" m（ずれ <b>"+_w18_f((a.fin-R.r)*100,1)+" cm</b>）<br>";
      h+="積分なし: F = ["+R.F4.map(function(v){return _w18_g(v,4);}).join("  ")+"]、初めの力 "+_w18_f(b.u0,2)+" N、先に逆へ "+_w18_f(b.rev*100,1)+" cm、±1 cm に "+(b.t1!==null?_w18_s(b.t1,3)+" s":"—")+"、14 s の位置 "+_w18_f(b.fin,3)+" m（ずれ <b>"+_w18_f((b.fin-R.r)*100,1)+" cm</b>"+(R.d!==0?"。式 d ÷ f<sub>1</sub> = "+_w18_f(R.d/R.F4[0]*100,1)+" cm":"")+"）<br>";
      if(R.ri.fell||R.rn.fell)h+='<span class="warn">倒れた: '+(R.ri.fell?"積分型サーボ系 ":"")+(R.rn.fell?"積分なし":"")+"</span><br>";
      ro.innerHTML=h+'<div class="wnote">本文 5 節の例。外乱は 6 s から台車に加わる一定の力。積分なしは u = −F(x − x<sub>r</sub>)（4 つの極 −σ）、積分型サーボ系は u = −Fx − f<sub>I</sub>w（w は偏差 r − p の積分、5 つの極 −σ）。どちらも線形でない式を 4 次のルンゲ・クッタ法（刻み 2 ms）で解いた。</div>';
    }
    run();
  };
