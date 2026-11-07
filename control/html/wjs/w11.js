  /* ===== 11 章 PID の調整と現場の問題 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w11_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w11_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w11_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* 1 区切り（dt 秒）ごとに新しい値になる観測ノイズ（標準偏差 sig）。U.rng の列なので、図（f11.py）と同じ値になる */
  function _w11_noise(U,seed,sig,tmax,dt){dt=dt||1;var nm=U.rng(seed),v=[],n=Math.floor(tmax/dt)+2;for(var i=0;i<n;i++)v.push(sig*nm.normal());
    return function(t){return v[Math.floor(t/dt+1e-9)];};}
  /* 標準形の PID（不完全微分）の伝達関数 [分子, 分母] */
  function _w11_pidtf(KP,TI,TD,N){N=N||10;if(!TI&&!TD)return [[KP],[1]];if(!TD)return [[KP*TI,KP],[TI,0]];var Tf=TD/N;
    if(!TI)return [[KP*(Tf+TD),KP],[Tf,1]];return [[KP*(TI*Tf+TI*TD),KP*(TI+Tf),KP],[TI*Tf,TI,0]];}
  /* 一巡伝達関数 P C（むだ時間つき）の tf */
  function _w11_loop(U,P,KP,TI,TD,N){var c=_w11_pidtf(KP,TI,TD,N);return U.ctl.tf(U.ctl.poly.mul(P.num,c[0]),U.ctl.poly.mul(P.den,c[1]),P.L||0);}

  /* 配列の最大・最小（Math.max.apply は要素が数十万あると呼び出しの上限を越えるので、ループで求める） */
  function _w11_amax(a){var m=-Infinity;for(var i=0;i<a.length;i++)if(a[i]>m)m=a[i];return m;}
  function _w11_amin(a){var m=Infinity;for(var i=0;i<a.length;i++)if(a[i]<m)m=a[i];return m;}
  /* 温度の板の刻みは、図（_f11_sim の 8 分割）と同じ細かさにした（h = 0.1 s では零次ホールドの遅れ h/2 で、行き過ぎ量や面積の最後の桁がずれる）。
     フィードバック系を刻み h = tEnd/n で計算する（図の _f11_sim と同じ計算。共通部品 simLoop と同じ約束で、
     対象は零次ホールドで離散化し、むだ時間は操作量（外乱を足したもの）を刻みの数だけ遅らせる）。simLoop に無い次のものを扱う:
     標準形の PID（P の分 K_P(b r − y)、I の分は積分の中にゲインを入れて足す、D の分は測った値の不完全微分を後退差分で）、
     飽和（umin・umax）、アンチワインドアップ（aw: "clamp"・"back"、時定数 Tt）、リレー（relay: [Δu, ε, u_0]）、
     始めに操作量 u0 で落ち着いた状態。返り値 {t, y, u（実際）, uc（計算した値）, I, e} */
  function _w11_sim(U,P,o){
    var n=o.n||20000,h=o.tEnd/n,ev=o.every||Math.max(1,Math.round(n/1000)),S=U.ctl.ss(U.ctl.tf(P.num,P.den)),N=S.A.length,dd=U.ctl.mat.c2d(S.A,S.B,h),i,j;
    var Ad=dd.A,Bd=dd.B.map(function(r){return r[0];}),Cp=S.C[0],nd=Math.round((P.L||0)/h),u0=o.u0||0,xp=new Float64Array(N),xn=new Float64Array(N);
    if(u0){var IA=[],rhs=[];for(i=0;i<N;i++){IA.push([]);for(j=0;j<N;j++)IA[i].push((i===j?1:0)-Ad[i][j]);rhs.push([Bd[i]*u0]);}
      var xs=U.ctl.mat.solve(IA,rhs);for(i=0;i<N;i++)xp[i]=xs[i][0];}
    var buf=new Float64Array(Math.max(1,nd));buf.fill(u0);var bi=0,ua=u0;
    var rf=typeof o.r==="function"?o.r:(function(v){return function(){return v;};})(o.r||0);
    var kp=o.KP||0,ti=o.TI||0,td=o.TD||0,Nf=o.N||10,b=o.b==null?1:o.b,I=o.I0!=null?o.I0:(ti?u0:0),Df=0,sp=null,rs=1;
    var out={t:[],y:[],u:[],uc:[],I:[],e:[],blow:false};
    for(var k=0;k<=n;k++){
      var t=k*h;if(nd)ua=buf[bi];
      var y=0;for(i=0;i<N;i++)y+=Cp[i]*xp[i];
      var ym=y+(o.noise?o.noise(t,k):0),rr=rf(t),e=rr-ym,uc,u;
      if(o.relay){var eR=Math.max(o.relay[1],1e-9);if(e>eR)rs=1;else if(e<-eR)rs=-1;uc=o.relay[2]+rs*o.relay[0];u=uc;}
      else{var Pp=kp*(b*rr-ym);
        if(td){var Tf=td/Nf,sig=-ym;if(sp===null)sp=sig;Df=Tf/(Tf+h)*Df+kp*td/(Tf+h)*(sig-sp);sp=sig;}else Df=0;
        uc=Pp+I+Df;u=uc;if(o.umax!=null&&u>o.umax)u=o.umax;if(o.umin!=null&&u<o.umin)u=o.umin;}
      if(k%ev===0){out.t.push(t);out.y.push(y);out.u.push(u);out.uc.push(uc);out.I.push(I);out.e.push(e);}
      if(!o.relay&&ti){var inc=kp*h/ti*e;
        if(o.aw==="clamp"&&((o.umax!=null&&uc>o.umax&&e>0)||(o.umin!=null&&uc<o.umin&&e<0)))inc=0;
        if(o.aw==="back"&&o.Tt)inc+=h/o.Tt*(u-uc);
        I+=inc;}
      var uin=u+(o.d?o.d(t):0);if(nd){buf[bi]=uin;bi=(bi+1)%nd;}else ua=uin;
      if(!isFinite(y)||Math.abs(y)>1e9){out.blow=true;break;}
      for(i=0;i<N;i++){var s=Bd[i]*ua;for(j=0;j<N;j++)s+=Ad[i][j]*xp[j];xn[i]=s;}var tmp=xp;xp=xn;xn=tmp;}
    return out;}
  /* y が lev を下から上へ横切る時刻（線形補間） */
  function _w11_upx(t,y,lev){var o=[];for(var i=1;i<y.length;i++)if(y[i-1]<lev&&y[i]>=lev)o.push(t[i-1]+(lev-y[i-1])/(y[i]-y[i-1])*(t[i]-t[i-1]));return o;}
  /* lev より上の山の番号 */
  function _w11_peaks(y,lev){var o=[];for(var i=1;i<y.length-1;i++)if(y[i]>y[i-1]&&y[i]>=y[i+1]&&y[i]>lev)o.push(i);return o;}
  /* ±band の外に最後にいた次の時刻（入った後は出ない時刻） */
  /* 2 % 整定時間など: 最後に帯の外にいた記録の点と次の点の間で、帯の端を横切る時刻を線形補間で求める（記録の間隔に丸めない） */
  function _w11_settle(t,y,yf,band){var last=-1;for(var i=0;i<y.length;i++)if(Math.abs(y[i]-yf)>band)last=i;if(last<0)return 0;if(last+1>=t.length)return null;
    var y0=y[last],y1=y[last+1],lv=y0>yf?yf+band:yf-band;return y1===y0?t[last+1]:t[last]+(lv-y0)/(y1-y0)*(t[last+1]-t[last]);}
  function _w11_trapz(t,f){var s=0;for(var i=1;i<t.length;i++)s+=0.5*(f[i]+f[i-1])*(t[i]-t[i-1]);return s;}
  /* 複素平面の枠（目盛つき）。返り値 {svg, P} */
  function _w11_cplane(U,x,y,w,h,xr,yr,xt,yt){var S=U.S,P=U.plot(x,y,w,h,xr,yr),s=[S.RECT(x,y,w,h,0,"var(--screen)","line",0.8)];
    xt.forEach(function(v){s.push(S.L(P.X(v),y,P.X(v),y+h,"grid",1));s.push(S.T(P.X(v),y+h+13,_w11_g(v,3),"middle",9,"muted"));});
    yt.forEach(function(v){s.push(S.L(x,P.Y(v),x+w,P.Y(v),"grid",1));s.push(S.T(x-5,P.Y(v)+3,_w11_g(v,3),"end",9,"muted"));});
    if(xr[0]<0&&xr[1]>0)s.push(S.L(P.X(0),y,P.X(0),y+h,"muted",1));if(yr[0]<0&&yr[1]>0)s.push(S.L(x,P.Y(0),x+w,P.Y(0),"muted",1));
    return {svg:s.join(""),P:P};}
  function _w11_m1(U,P){var S=U.S,xx=P.X(-1),yy=P.Y(0);return S.X(xx,yy,5,"alias",2.2)+S.T(xx,yy-9,"−1","middle",10,"alias",true,false,null,true);}
  /* 塗った面積（偏差の正・負）: 制御量 y と目標値 ref の間 */
  function _w11_area(U,P,t,y,ref,sgn,c){var S=U.S,o=[],run=[];
    function flush(){if(run.length>1){var q=[[P.X(run[0][0]),P.Y(ref)]];run.forEach(function(p){q.push([P.X(p[0]),P.Y(p[1])]);});q.push([P.X(run[run.length-1][0]),P.Y(ref)]);o.push(S.PL(q,"none",0,U.soft(c)));}run=[];}
    for(var i=0;i<t.length;i++){if(sgn*(ref-y[i])>0)run.push([t[i],y[i]]);else flush();}flush();return o.join("");}

  /* ---- 2 節: 限界感度法 — 持続振動を起こして表を当てる ---- */
  var _W11_ZN={
    plate:{nm:"温度の板",P:{num:[1.25],den:[500,1],L:20},Ku:31.93,Tu:78.74,ku:"W/K",kr:[5,60],tT:900,nT:576000,tC:800,nC:64000,d:-10,du:"W",yu:"K",xr:[-2.4,0.6],yr:[-1.8,0.6],wr:[1e-4,3],wd:[1e-4,0.25]},
    cart:{nm:"台車（遅れ 0.1 s）",P:{num:[1],den:[1,2],L:0.1},Ku:17.0,Tu:0.3721,ku:"N/(m/s)",kr:[2,30],tT:4,nT:20000,tC:3,nC:15000,d:-1,du:"N",yu:"m/s",xr:[-2.4,0.6],yr:[-1.8,0.6],wr:[0.1,1000],wd:[0.1,50]},
    mpos:{nm:"モータの位置",P:{num:[2e6],den:[1,2000,40000,0],L:0},Ku:40,Tu:0.0314159,ku:"V/rad",kr:[2,80],tT:0.3,nT:30000,tC:0.3,nC:30000,d:-1,du:"V",yu:"rad",xr:[-2.4,0.6],yr:[-1.8,0.6],wr:[0.5,1e5],wd:[0.5,1e4]}
  };
  function _w11_znset(Ku,Tu,k){return k===0?[0.5*Ku,0,0]:(k===1?[0.45*Ku,Tu/1.2,0]:[0.6*Ku,0.5*Tu,0.125*Tu]);}
  REG.w11_zn=function(el,U){
    var S=U.S,keys=["plate","cart","mpos"];
    U.head(el,"ZIEGLER–NICHOLS","限界感度法 — 比例制御だけで持続振動を起こし、限界ゲインと限界周期を読んで表を当てる");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板","台車（遅れ 0.1 s）","モータの位置（巻線のインダクタンスを含む）"],0,function(){var z=_W11_ZN[keys[obj.get()]];kp.set(z.Ku);draw();});
    var kp=U.slider(r1,"試験の比例ゲイン",{min:2,max:80,log:true,value:31.93,fmt:function(v){return _w11_g(v,3)+" "+_W11_ZN[keys[obj.get()]].ku;},onInput:draw});
    var tb=U.select(r1,"当てる表",["P","PI","PID"],2,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（温度の板・限界ゲイン 31.9 W/K）",function(){obj.set(0);kp.set(31.93);tb.set(2);draw();});
    U.button(br,"手前（0.8 倍）で読む",function(){var z=_W11_ZN[keys[obj.get()]];kp.set(0.8*z.Ku);draw();});
    U.button(br,"越えて（1.1 倍）読む",function(){var z=_W11_ZN[keys[obj.get()]];kp.set(1.1*z.Ku);draw();});
    U.button(br,"持続振動の比例ゲインを探す",function(){var z=_W11_ZN[keys[obj.get()]],lo=z.kr[0],hi=z.kr[1];
      for(var it=0;it<16;it++){var m=Math.sqrt(lo*hi),a=test(z,m);if(a.ratio==null||a.ratio<1)lo=m;else hi=m;}kp.set(Math.sqrt(lo*hi));draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* P だけの試験（共通部品 simLoop）。振れの比と周期を読む */
    function test(z,K){var G=U.ctl.tf(z.P.num,z.P.den,z.P.L),r=U.ctl.simLoop(G,U.ctl.tf([K],[1]),{tEnd:z.tT,n:z.nT,r:1,every:1});
      var P0=z.P.den[z.P.den.length-1]===0?null:z.P.num[z.P.num.length-1]/z.P.den[z.P.den.length-1],yf=P0==null?1:K*P0/(1+K*P0);
      var pk=_w11_peaks(r.y,yf),ux=_w11_upx(r.t,r.y,yf),ratio=null,per=null;
      if(r.blow){ratio=Infinity;}
      else if(pk.length>=4){var rs=[];for(var i=1;i<Math.min(pk.length-1,4);i++)rs.push((r.y[pk[i+1]]-yf)/(r.y[pk[i]]-yf));ratio=rs.reduce(function(a,b){return a+b;},0)/rs.length;}
      else if(pk.length>=2)ratio=(r.y[pk[1]]-yf)/(r.y[pk[0]]-yf);
      if(ux.length>=5)per=(ux[4]-ux[1])/3;else if(ux.length>=3)per=(ux[ux.length-1]-ux[1])/(ux.length-2);
      return {r:r,yf:yf,ratio:ratio,per:per};}
    function draw(){
      var z=_W11_ZN[keys[obj.get()]],K=kp.get(),kind=tb.get(),nar=_w11_nar(box),Wd=nar?400:700,o=[];
      var A=test(z,K);
      /* (a) 試験の応答 */
      var x0=nar?52:60,w1=nar?330:390,p=U.plot(x0,26,w1,110,[0,z.tT],[-1,3.2]);
      o.push(S.T(nar?10:14,14,"(a) 比例制御だけの試験（目標値を 1 上げる）","start",10.5,"ink",true));
      o.push(p.axes({xl:null,yl:"制御量",xt:U.nice(0,z.tT,4),yt:[0,1,2,3],xfmt:function(v){return _w11_g(v,3);},ylOff:34}));
      o.push(p.line([[0,1],[z.tT,1]],"muted",1,"5 3"));
      var st=Math.max(1,Math.round(A.r.t.length/700)),pts=[];for(var i=0;i<A.r.t.length;i+=st)pts.push([A.r.t[i],A.r.y[i]]);
      var cA=A.ratio==null?"green":(A.ratio>1.02?"alias":(A.ratio>0.98?"signal":"green"));
      o.push(p.clip(pts,cA,1.7));
      o.push(S.T(p.X(z.tT)-2,p.y+12,"時間 t [s]（0〜"+_w11_g(z.tT,3)+" s）","end",9,"muted",false,false,null,true));
      /* 読んだ値 → 表 */
      var Kr=K,Tr=A.per,g=Tr?_w11_znset(Kr,Tr,kind):null,gT=_w11_znset(z.Ku,z.Tu,kind);
      /* (b) ナイキスト線図 */
      var nx=nar?70:500,ny=nar?178:26,ns=nar?250:180,cp=_w11_cplane(U,nx,ny,ns,ns*(z.yr[1]-z.yr[0])/(z.xr[1]-z.xr[0]),z.xr,z.yr,[-2,-1,0],[-1,0]);
      o.push(S.T(nx,ny-12,"(b) 一巡伝達関数のナイキスト線図","start",10.5,"ink",true));o.push(cp.svg);var Pn=cp.P;
      var ws=U.ctl.logspace(Math.log10(z.wd[0]),Math.log10(z.wd[1]),1500),Gp=U.ctl.tf(z.P.num,z.P.den,z.P.L);
      var tpts=ws.map(function(w){var v=U.ctl.freq(Gp,w);return [K*v.re,K*v.im];});o.push(Pn.clip(tpts,"muted",1.3,"4 3"));
      if(g){var Lg=_w11_loop(U,z.P,g[0],g[1],g[2],10);o.push(Pn.clip(ws.map(function(w){var v=U.ctl.freq(Lg,w);return [v.re,v.im];}),"green",2));
        var wu=2*Math.PI/Tr,vv=U.ctl.freq(Lg,wu);if(vv.re>z.xr[0]&&vv.re<z.xr[1]&&vv.im>z.yr[0]&&vv.im<z.yr[1])o.push(S.D(Pn.X(vv.re),Pn.Y(vv.im),"green",4.2));}
      o.push(_w11_m1(U,Pn));
      var ly=ny+ns*(z.yr[1]-z.yr[0])/(z.xr[1]-z.xr[0])+30;
      o.push(S.LEGL(nx,ly,[["muted","4 3","試験の K_P P(jω)"]],9));o.push(S.LEGL(nx,ly+15,[["green",null,"表の値の P(jω)C(jω)"]],9));
      /* (c) 表の値で制御 */
      var cy=nar?ly+40:Math.max(ly+20,190),q=U.plot(x0,cy+14,nar?330:620,110,[0,z.tC],[-0.4,2.2]),cres=null;
      o.push(S.T(nar?10:14,cy,"(c) 読んだ値で表の "+["P","PI","PID"][kind]+" を当てる（目標値 +1、途中で外乱 "+_w11_g(z.d,3)+" "+z.du+"）","start",10.5,"ink",true));
      o.push(q.axes({xl:"時間 t [s]",yl:"制御量",xt:U.nice(0,z.tC,4),yt:[0,1,2],xfmt:function(v){return _w11_g(v,3);},ylOff:34}));
      o.push(q.line([[0,1],[z.tC,1]],"muted",1,"5 3"));
      if(g){cres=_w11_sim(U,z.P,{KP:g[0],TI:g[1],TD:g[2],N:10,tEnd:z.tC,n:z.nC,r:1,d:function(t){return t>=z.tC/2?z.d:0;},every:Math.max(1,Math.round(z.nC/800))});
        var bad=cres.blow||_w11_amax(cres.y.map(Math.abs))>4;
        o.push(q.clip(cres.t.map(function(t,i){return [t,cres.y[i]];}),bad?"alias":"green",1.9));}
      box.set(S.svg(Wd,cy+14+110+44,o));
      /* 読み出し */
      var hh="",ok='<span class="ok">',wr='<span class="warn">';
      if(A.ratio==null)hh+="試験: 振動しない（比例ゲインを上げる）<br>";
      else if(!isFinite(A.ratio))hh+="試験: "+wr+"振れが大きくなり続け、計算が発散した</span><br>";
      else hh+="試験（"+U.htx("K_P")+" = "+_w11_g(K,3)+" "+z.ku+"）: 振れは 1 往復ごとに <b>"+_w11_f(A.ratio,2)+" 倍</b>"+(A.per?"、周期 <b>"+_w11_g(A.per,4)+" s</b>":"")+
        (Math.abs(A.ratio-1)<0.02?" — "+ok+"持続振動</span>":(A.ratio<1?" — まだ減っている（限界はもっと上）":" — "+wr+"増えている（限界を越えた）</span>"))+"<br>";
      if(g){hh+="読んだ値 "+U.htx("K_u")+" = "+_w11_g(Kr,3)+" "+z.ku+"、"+U.htx("T_u")+" = "+_w11_g(Tr,4)+" s → 表の "+["P","PI","PID"][kind]+": "+U.htx("K_P")+" = "+_w11_g(g[0],3)+(g[1]?"、"+U.htx("T_I")+" = "+_w11_g(g[1],3)+" s":"")+(g[2]?"、"+U.htx("T_D")+" = "+_w11_g(g[2],3)+" s":"")+"<br>";
        var Lg2=_w11_loop(U,z.P,g[0],g[1],g[2],10),mg=U.ctl.margins(Lg2,z.wr[0],z.wr[1]),sm=U.ctl.smax(Lg2,z.wr[0],z.wr[1]);
        var unst=cres&&(cres.blow||_w11_amax(cres.y.map(Math.abs))>4);
        if(unst)hh+=wr+"表の値で制御すると不安定になる</span><br>";
        else{var mx=-1e9,nh=Math.floor(cres.t.length/2);for(var k2=0;k2<nh;k2++)mx=Math.max(mx,cres.y[k2]);
          var P0=z.P.den[z.P.den.length-1]===0?null:z.P.num[z.P.num.length-1]/z.P.den[z.P.den.length-1],yf=(g[1]||P0==null)?1:g[0]*P0/(1+g[0]*P0);
          hh+="その値で: 目標値への行き過ぎ量 <b>"+_w11_f(Math.max(0,(mx-yf)/yf*100),1)+" %</b>、位相余裕 "+(mg.pm!=null?_w11_f(mg.pm,1)+"°":"—")+"、ゲイン余裕 "+(mg.gmDb!=null?_w11_f(mg.gmDb,2)+" dB":"∞")+"、−1 の点との最短距離 "+_w11_f(sm.dist,2)+"<br>";}}
      else hh+="周期が読めないので、表を当てられない<br>";
      hh+="本当の限界（9 章）: "+U.htx("K_u")+" = "+_w11_g(z.Ku,3)+" "+z.ku+"、"+U.htx("T_u")+" = "+_w11_g(z.Tu,3)+" s → 表の "+["P","PI","PID"][kind]+": "+U.htx("K_P")+" = "+_w11_g(gT[0],3)+(gT[1]?"、"+U.htx("T_I")+" = "+_w11_g(gT[1],3)+" s":"")+(gT[2]?"、"+U.htx("T_D")+" = "+_w11_g(gT[2],3)+" s":"");
      ro.innerHTML=hh+'<div class="wnote">試験は共通部品 simLoop で計算した。表の値の PID は、N = 10 の不完全微分を測った値に掛けた。(b) の緑の点は、読んだ周期の角周波数での一巡伝達関数の値（表がその点を置く場所）。モータの位置では、限界周期が巻線の速い遅れで決まり、表の前提から外れる。</div>';
    }
    draw();
  };

  /* ---- 2 節: リレーの試験 ---- */
  var _W11_RL={
    plate:{nm:"温度の板",P:{num:[1.25],den:[500,1],L:20},r:35,u0:28,du:[2,28,20],eps:[0,1.5,0],nz:[0,0.1,0.3,0.5],nzDt:1,tEnd:1000,n:80000,tskip:300,Ku:31.93,Tu:78.74,ku:"W/K",uu:"W",yu:"K",off:25,yname:"温度 [°C]",xr:[-0.06,0.01],yr:[-0.035,0.02],ws:[-1.8,-0.5]},
    cart:{nm:"台車（遅れ 0.1 s）",P:{num:[1],den:[1,2],L:0.1},r:1,u0:2,du:[0.2,2,1],eps:[0,0.1,0],nz:[0,0.005,0.01,0.02],nzDt:0.01,tEnd:8,n:80000,tskip:2,Ku:17.0,Tu:0.3721,ku:"N/(m/s)",uu:"N",yu:"m/s",off:0,yname:"速度 [m/s]",xr:[-0.12,0.02],yr:[-0.07,0.04],ws:[0.6,1.8]}
  };
  REG.w11_relay=function(el,U){
    var S=U.S,keys=["plate","cart"],seed=11;
    U.head(el,"RELAY TEST","リレーの試験 — 決まった振れ幅で振動させて、限界周期と限界ゲインを読む");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板","台車（遅れ 0.1 s）"],0,function(){var z=_W11_RL[keys[obj.get()]];du.set(z.du[2]);ep.set(0);nz.set(0);draw();});
    var du=U.slider(r1,"リレーの振れ幅 Δu",{min:0.2,max:28,step:0.1,value:20,fmt:function(v){return _w11_g(v,3)+" "+_W11_RL[keys[obj.get()]].uu;},onInput:draw});
    var r2=U.ctrls(el);
    var ep=U.slider(r2,"しきい値の幅 ε",{min:0,max:1.5,step:0.01,value:0,fmt:function(v){return _w11_g(v,3)+" "+_W11_RL[keys[obj.get()]].yu;},onInput:draw});
    var nz=U.select(r2,"観測ノイズ（標準偏差）",["なし","小（板 0.1 K・台車 0.005 m/s）","中（板 0.3 K・台車 0.01 m/s）","大（板 0.5 K・台車 0.02 m/s）"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（温度の板・Δu = 20 W）",function(){obj.set(0);du.set(20);ep.set(0);nz.set(0);seed=11;draw();});
    U.button(br,"ノイズ 0.3 K・幅なし",function(){obj.set(0);du.set(20);ep.set(0);nz.set(2);seed=11;draw();});
    U.button(br,"ノイズ 0.3 K・Δu = 28 W・ε = 0.6 K（本文）",function(){obj.set(0);du.set(28);ep.set(0.6);nz.set(2);seed=11;draw();});
    U.button(br,"台車（Δu = 1 N）",function(){obj.set(1);du.set(1);ep.set(0);nz.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed=seed*7+3;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var z=_W11_RL[keys[obj.get()]],D=Math.min(Math.max(du.get(),z.du[0]),z.du[1]),E=Math.min(ep.get(),z.eps[1]),sg=z.nz[nz.get()];
      du.input.min=z.du[0];du.input.max=z.du[1];ep.input.max=z.eps[1];ep.input.step=z.eps[1]/150;
      var noise=sg>0?_w11_noise(U,seed,sg,z.tEnd+2,z.nzDt):null;
      var a=_w11_sim(U,z.P,{relay:[D,E,z.u0],tEnd:z.tEnd,n:z.n,r:z.r,u0:z.u0,noise:noise,every:1});
      var t=a.t,y=a.y,u=a.u,up=[],i;
      for(i=1;i<t.length;i++)if(t[i-1]>=z.tskip&&u[i]>z.u0&&u[i-1]<z.u0)up.push(i);
      var nar=_w11_nar(box),Wd=nar?400:700,o=[],res=null;
      if(up.length>=3){var T=(t[up[up.length-1]]-t[up[0]])/(up.length-1),ys=[],ts=[];
        for(i=up[0];i<up[up.length-1];i++){ys.push(y[i]);ts.push(t[i]);}
        var ym=ys.reduce(function(s,v){return s+v;},0)/ys.length,amp=(_w11_amax(ys)-_w11_amin(ys))/2,w=2*Math.PI/T,cs=0,sn=0;
        for(i=1;i<ts.length;i++){var dt=ts[i]-ts[i-1];cs+=0.5*dt*((ys[i]-ym)*Math.cos(w*ts[i])+(ys[i-1]-ym)*Math.cos(w*ts[i-1]));sn+=0.5*dt*((ys[i]-ym)*Math.sin(w*ts[i])+(ys[i-1]-ym)*Math.sin(w*ts[i-1]));}
        cs*=2/(ts[ts.length-1]-ts[0]);sn*=2/(ts[ts.length-1]-ts[0]);var a1=Math.hypot(cs,sn);
        var sw=0;for(i=up[0]+1;i<up[up.length-1];i++)if(u[i]!==u[i-1])sw++;
        res={T:T,a:amp,a1:a1,Ku:4*D/(Math.PI*amp),Ku1:4*D/(Math.PI*a1),ym:ym,cs:cs,sn:sn,w:w,t0:t[up[0]],sw:sw/(up.length-1)};}
      /* (a) 波形 */
      var x0=nar?52:60,w1=nar?330:400,t0=res?res.t0:z.tskip,t1=t0+(res?4*res.T:(z.tEnd-z.tskip)/4);
      if(t1>z.tEnd){t1=z.tEnd;}
      var pu=U.plot(x0,26,w1,70,[t0,t1],[z.u0-1.25*z.du[1],z.u0+1.25*z.du[1]]);
      o.push(S.T(nar?10:14,14,"(a) 操作量と制御量（破線は基本波）","start",10.5,"ink",true));
      o.push(pu.axes({xl:null,yl:"u ["+z.uu+"]",xt:[],yt:[z.u0-D,z.u0,z.u0+D].map(function(v){return +v.toFixed(3);}),xfmt:function(){return "";},ylOff:36}));
      var pts=[],m=[];for(i=0;i<t.length;i++)if(t[i]>=t0&&t[i]<=t1)m.push(i);
      var stp=Math.max(1,Math.round(m.length/900));for(i=0;i<m.length;i+=stp)pts.push([t[m[i]],u[m[i]]]);
      o.push(pu.line(pts,"gold",1.6));
      if(res){var fu=[];for(var k=0;k<=300;k++){var tt=t0+(t1-t0)*k/300;fu.push([tt,z.u0+4*D/Math.PI*Math.sin(res.w*(tt-res.t0))]);}o.push(pu.line(fu,"gold",1.1,"4 3"));}
      var lo=_w11_amin(m.map(function(j){return y[j];})),hi=_w11_amax(m.map(function(j){return y[j];})),pad=Math.max(0.05*(hi-lo),1e-6);
      var py=U.plot(x0,114,w1,90,[t0,t1],[z.off+lo-pad,z.off+hi+pad]);
      o.push(py.axes({xl:"時間 t [s]",yl:z.yname,xt:U.nice(t0,t1,4).filter(function(v){return v>=t0&&v<=t1;}),yt:U.nice(z.off+lo,z.off+hi,3),xfmt:function(v){return _w11_g(v,4);},yfmt:function(v){return _w11_g(v,4);},ylOff:40}));
      o.push(py.line([[t0,z.off+z.r],[t1,z.off+z.r]],"muted",1,"5 3"));
      pts=[];for(i=0;i<m.length;i+=stp)pts.push([t[m[i]],z.off+y[m[i]]]);o.push(py.line(pts,"signal",1.7));
      if(res){var fy=[];for(var k3=0;k3<=300;k3++){var t3=t0+(t1-t0)*k3/300;fy.push([t3,z.off+res.ym+res.sn*Math.sin(res.w*t3)+res.cs*Math.cos(res.w*t3)]);}o.push(py.line(fy,"signal",1.1,"4 3"));}
      /* (b) ナイキスト線図 */
      var nx=nar?70:520,ny=nar?262:26,nw=nar?260:160,nh=nw*(z.yr[1]-z.yr[0])/(z.xr[1]-z.xr[0]);
      var cp=_w11_cplane(U,nx,ny,nw,nh,z.xr,z.yr,[z.xr[0]<-0.1?-0.1:-0.04,z.xr[0]<-0.1?-0.05:-0.02,0],[]);o.push(cp.svg);var Pn=cp.P;
      o.push(S.T(nx,ny-12,"(b) 負の実軸の近く","start",10.5,"ink",true));
      var Gp=U.ctl.tf(z.P.num,z.P.den,z.P.L),ws=U.ctl.logspace(z.ws[0],z.ws[1],600);
      o.push(Pn.clip(ws.map(function(w){var v=U.ctl.freq(Gp,w);return [v.re,v.im];}),"signal",1.8));
      o.push(S.D(Pn.X(-1/z.Ku),Pn.Y(0),"signal",3.6));
      if(res){var xpk=-Math.PI*res.a/(4*D),xf=-Math.PI*res.a1/(4*D);
        if(xpk>z.xr[0])o.push(S.D(Pn.X(xpk),Pn.Y(0),"alias",3.6));if(xf>z.xr[0])o.push(S.D(Pn.X(xf),Pn.Y(0),"green",3));}
      var ly=ny+nh+30;
      o.push(S.D(nx+5,ly-4,"signal",3.6));o.push(S.TX(nx+14,ly,"本当の −1/K_u","start",9.5,"signal",true));o.push(S.D(nx+5,ly+12,"alias",3.6));o.push(S.TX(nx+14,ly+16,"山の高さから −πa/(4Δu)","start",9.5,"alias",true));o.push(S.D(nx+5,ly+28,"green",3));o.push(S.TX(nx+14,ly+32,"基本波から −πa_1/(4Δu)","start",9.5,"green",true));
      box.set(S.svg(Wd,Math.max(250,nar?ly+50:ly+50),o));
      /* 読み出し */
      var hh="";
      if(!res)hh+='<span class="warn">振動の周期が読めない（振れ幅が小さすぎるか、記録が短い）</span><br>';
      else{
        if(res.sw>2.5)hh+='<span class="warn">ノイズで細かく入れ切りしている（1 周期に '+_w11_f(res.sw,1)+" 回）: しきい値の幅 ε を広げる</span><br>";
        hh+="周期 "+U.htx("T_osc")+" = <b>"+_w11_g(res.T,4)+" s</b>（限界周期 "+_w11_g(z.Tu,3)+" s）、振れ幅: 山の高さ a = "+_w11_g(res.a,3)+" "+z.yu+"、基本波 "+U.htx("a_1")+" = "+_w11_g(res.a1,3)+" "+z.yu+"<br>";
        hh+="限界ゲイン: 山の高さから 4Δu/(πa) = <b>"+_w11_g(res.Ku,3)+"</b>、基本波から 4Δu/(π"+U.htx("a_1")+") = <b>"+_w11_g(res.Ku1,3)+"</b> "+z.ku+"（本当は "+_w11_g(z.Ku,3)+"）<br>";
        hh+="基本波から読んだ値で限界感度法の PI: "+U.htx("K_P")+" = "+_w11_g(0.45*res.Ku1,3)+" "+z.ku+"、"+U.htx("T_I")+" = "+_w11_g(res.T/1.2,3)+" s（本当の限界からは "+_w11_g(0.45*z.Ku,3)+"・"+_w11_g(z.Tu/1.2,3)+" s）";}
      ro.innerHTML=hh+'<div class="wnote">リレーは偏差が ε を越えたら u<sub>0</sub> + Δu、−ε を下回ったら u<sub>0</sub> − Δu を出す（u<sub>0</sub> は動作点を保つ操作量: 温度の板 28 W、台車 2 N）。始めの '+_w11_g(z.tskip,3)+' s を捨て、残りの整数の周期で、周期・山の高さと、8 章 6 節の方法（正弦波を掛けて平均）で基本波の振れ幅を求めた。観測ノイズは温度の板で 1 s ごと、台車で 0.01 s ごとに変わる。</div>';
    }
    draw();
  };

  /* ---- 3 節: IMC の λ ---- */
  var _W11_IM={
    plate:{nm:"温度の板",K:1.25,T:500,L:20,lam:[2,200],l0:20,tR:800,nR:64000,tD:5000,nD:400000,tDs:2000,d:-10,ku:"W/K",du:"W",yu:"K",wr:[1e-4,3]},
    cart:{nm:"台車（遅れ 0.1 s）",K:0.5,T:0.5,L:0.1,lam:[0.01,2],l0:0.1,tR:3,nR:15000,tD:8,nD:40000,tDs:4,d:-1,ku:"N/(m/s)",du:"N",yu:"m/s",wr:[0.03,3000]},
    mspd:{nm:"モータの速度",K:50,T:0.05,L:0,lam:[0.001,0.1],l0:0.01,tR:0.15,nR:15000,tD:0.6,nD:30000,tDs:0.3,d:-1,ku:"V/(rad/s)",du:"V",yu:"rad/s",wr:[1,3e4]}
  };
  REG.w11_imc=function(el,U){
    var S=U.S,keys=["plate","cart","mspd"];
    U.head(el,"IMC / λ","内部モデル制御から決める PI — λ で速さと余裕の釣り合いを選ぶ");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板","台車（遅れ 0.1 s）","モータの速度（むだ時間なし）"],0,function(){var z=_W11_IM[keys[obj.get()]];lam.set(z.l0);draw();});
    var lam=U.slider(r1,"λ（閉ループの時定数）",{min:0.001,max:200,log:true,value:20,fmt:function(v){return _w11_g(v,3)+" s";},onInput:draw});
    var tim=U.select(r1,"積分時間",["モデルの時定数 T","T と 4(λ + L) の小さいほう"],0,draw);
    var r2=U.ctrls(el);
    var lm=U.slider(r2,"本当のむだ時間",{values:[0.5,0.75,1,1.25,1.5,2,2.5,3,3.5],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:draw});
    var km=U.slider(r2,"本当の定常ゲイン",{values:[0.5,0.7,0.85,1,1.15,1.3,1.5,2],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:draw});
    var bw=U.slider(r2,"目標値の重み b",{values:[0,0.25,0.5,0.75,1],value:1,fmt:function(v){return String(v);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（温度の板・λ = 20 s・"+U.htx("T_I")+" = T）",function(){obj.set(0);lam.set(20);tim.set(0);lm.set(1);km.set(1);bw.set(1);draw();});
    U.button(br,U.htx("T_I")+" = 4(λ + L)（本文）",function(){obj.set(0);lam.set(20);tim.set(1);lm.set(1);km.set(1);bw.set(1);draw();});
    U.button(br,"さらに b = 0.5",function(){obj.set(0);lam.set(20);tim.set(1);lm.set(1);km.set(1);bw.set(0.5);draw();});
    U.button(br,"本当のむだ時間が 3 倍",function(){obj.set(0);lam.set(20);tim.set(0);lm.set(3);km.set(1);bw.set(1);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var z=_W11_IM[keys[obj.get()]],l=Math.min(Math.max(lam.get(),z.lam[0]),z.lam[1]),TI=tim.get()===1?Math.min(z.T,4*(l+z.L)):z.T,KP=z.T/(z.K*(l+z.L)),b=bw.get();
      lam.input.min=Math.log10(z.lam[0]);lam.input.max=Math.log10(z.lam[1]);
      lm.el.style.display=z.L>0?"":"none";
      var Lt=z.L*(z.L>0?lm.get():1),Kt=z.K*km.get(),Pt={num:[Kt],den:[z.T,1],L:Lt},Pm={num:[z.K],den:[z.T,1],L:z.L};
      var nar=_w11_nar(box),Wd=nar?400:700,o=[];
      /* 目標値 +1（自前の計算: 目標値の重みを扱う）と、外乱（共通部品 simLoop） */
      var a=_w11_sim(U,Pt,{KP:KP,TI:TI,b:b,tEnd:z.tR,n:z.nR,r:1,every:Math.max(1,Math.round(z.nR/800))});
      var Cpi=_w11_pidtf(KP,TI,0),Gt=U.ctl.tf(Pt.num,Pt.den,Pt.L),dr=U.ctl.simLoop(Gt,U.ctl.tf(Cpi[0],Cpi[1]),{tEnd:z.tD,n:z.nD,r:0,d:function(){return z.d;},every:1});
      var x0=nar?54:60,w1=nar?326:300;
      var p=U.plot(x0,26,w1,96,[0,z.tR],[-0.1,1.8]);
      o.push(S.T(nar?10:14,14,"(a) 目標値を 1 上げる","start",10.5,"ink",true));
      o.push(p.axes({xl:null,yl:"制御量",xt:U.nice(0,z.tR,4),yt:[0,1],xfmt:function(){return "";},ylOff:34}));
      o.push(p.line([[0,1],[z.tR,1]],"muted",1,"5 3"));
      var blow=a.blow||_w11_amax(a.y.map(Math.abs))>5;
      o.push(p.clip(a.t.map(function(t,i){return [t,a.y[i]];}),blow?"alias":"signal",1.9));
      var umx=Math.max(KP*b*1.2,KP*0.6,_w11_amax(a.u)*1.1),umn=Math.min(0,_w11_amin(a.u)*1.1);
      var q=U.plot(x0,140,w1,64,[0,z.tR],[umn,umx]);
      o.push(q.axes({xl:"時間 t [s]",yl:"u",xt:U.nice(0,z.tR,4),yt:U.nice(umn,umx,2),xfmt:function(v){return _w11_g(v,3);},yfmt:function(v){return _w11_g(v,3);},ylOff:34}));
      o.push(q.clip(a.t.map(function(t,i){return [t,a.u[i]];}),"gold",1.5));
      /* (b) 外乱 */
      var bx=nar?54:420,by=nar?262:26,bw2=nar?326:260;
      var mn=_w11_amin(dr.y),dmax=Math.max(Math.abs(mn)*1.15,1e-9),bl2=dr.blow||Math.abs(mn)>1e6;
      var pd=U.plot(bx,by,bw2,96,[0,z.tDs],[-dmax,0.35*dmax]);
      o.push(S.T(bx-(nar?44:6),by-12,"(b) 外乱 "+_w11_g(z.d,3)+" "+z.du+" への応答","start",10.5,"ink",true));
      o.push(pd.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,z.tDs,4),yt:U.nice(-dmax,0,2),xfmt:function(v){return _w11_g(v,3);},yfmt:function(v){return _w11_g(v,2);}}));
      var dsel=[];for(var i=0;i<dr.t.length;i+=Math.max(1,Math.round(dr.t.length/700)))if(dr.t[i]<=z.tDs)dsel.push(i);
      o.push(_w11_area(U,pd,dsel.map(function(j){return dr.t[j];}),dsel.map(function(j){return dr.y[j];}),0,1,"signal"));
      o.push(pd.clip(dsel.map(function(j){return [dr.t[j],dr.y[j]];}),bl2?"alias":"signal",1.8));
      /* (c) ボード線図（本当の対象との一巡伝達関数） */
      var Lt2=U.ctl.tf(U.ctl.poly.mul(Pt.num,Cpi[0]),U.ctl.poly.mul(Pt.den,Cpi[1]),Pt.L),wc=1/(l+z.L),wr=[wc/100,wc*30];
      var ws=U.ctl.logspace(Math.log10(wr[0]),Math.log10(wr[1]),500),B=U.ctl.bode(Lt2,ws),mg=U.ctl.margins(Lt2,z.wr[0],z.wr[1]),sm=U.ctl.smax(Lt2,z.wr[0],z.wr[1]);
      var cy=nar?396:170,bd=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal"}],{x:nar?54:420,y:cy+12,w:nar?326:260,hm:70,hp:70,gap:22,wr:wr,dbr:[-40,40],phr:[-270,0]});
      o.push(S.T(nar?10:414,cy,"(c) 一巡伝達関数のボード線図","start",10.5,"ink",true));o.push(bd.svg);
      if(mg.wgc&&mg.wgc>=wr[0]&&mg.wgc<=wr[1]){o.push(S.L(bd.Pm.X(mg.wgc),bd.Pm.y,bd.Pm.X(mg.wgc),bd.Pp.y+bd.Pp.h,"green",1.1,"3 3"));
        if(mg.pm>0)o.push(S.ARR(bd.Pp.X(mg.wgc),bd.Pp.Y(-180),bd.Pp.X(mg.wgc),bd.Pp.Y(-180+mg.pm),"green",2,5));}
      if(mg.wpc&&mg.wpc>=wr[0]&&mg.wpc<=wr[1]){o.push(S.L(bd.Pm.X(mg.wpc),bd.Pm.y,bd.Pm.X(mg.wpc),bd.Pp.y+bd.Pp.h,"alias",1.1,"3 3"));
        if(mg.gmDb>0)o.push(S.ARR(bd.Pm.X(mg.wpc),bd.Pm.Y(-mg.gmDb),bd.Pm.X(mg.wpc),bd.Pm.Y(0),"alias",2,5));}
      box.set(S.svg(Wd,nar?cy+12+70+22+70+44:Math.max(cy+12+70+22+70+44,250),o));
      /* 読み出し */
      var hh="",unst=(mg.pm!=null&&mg.pm<=0)||blow||bl2;
      hh+="PI: "+U.htx("K_P")+" = T/{K(λ + L)} = <b>"+_w11_g(KP,3)+" "+z.ku+"</b>、"+U.htx("T_I")+" = <b>"+_w11_g(TI,3)+" s</b>（"+U.htx("K_I")+" = "+_w11_g(KP/TI,3)+"）<br>";
      if(z.L>0){var pmf=90-180/Math.PI*z.L/(l+z.L),gmf=Math.PI*(l+z.L)/(2*z.L);hh+="式（モデルどおり、"+U.htx("T_I")+" = T）: 位相余裕 "+_w11_f(pmf,1)+"°、ゲイン余裕 "+_w11_g(gmf,3)+" 倍、安定でいられるむだ時間 "+_w11_g(Math.PI/2*(l+z.L),3)+" s まで<br>";}
      else hh+="式（モデルどおり、"+U.htx("T_I")+" = T）: 一巡伝達関数は 1/(λs)、位相余裕 90°、ゲイン余裕 ∞<br>";
      hh+="本当の対象で: 位相余裕 <b>"+(mg.pm!=null?_w11_f(mg.pm,1)+"°":"—")+"</b>、ゲイン余裕 "+(mg.gmDb!=null?_w11_f(mg.gmDb,2)+" dB（"+_w11_g(mg.gm,3)+" 倍）":"∞")+"、−1 の点との最短距離 "+_w11_f(sm.dist,2)+"<br>";
      if(unst)hh+='<span class="warn">閉ループは不安定</span><br>';
      else{var mx=_w11_amax(a.y),ts=_w11_settle(a.t,a.y,1,0.02);
        hh+="目標値 +1: 行き過ぎ量 <b>"+_w11_f(Math.max(0,mx-1)*100,1)+" %</b>、2 % 整定時間 "+(ts!=null?_w11_g(ts,3)+" s":"記録の中で入らない")+"、始めの操作量 "+U.htx("bK_P")+" = "+_w11_g(b*KP,3)+"<br>";
        var iae=_w11_trapz(dr.t,dr.y.map(Math.abs));
        hh+="外乱 "+_w11_g(z.d,3)+" "+z.du+": 最大のずれ <b>"+_w11_g(-mn,3)+" "+z.yu+"</b>、IAE <b>"+_w11_g(iae,4)+"</b>（振れなければ式の |d|/"+U.htx("K_I")+" = "+_w11_g(Math.abs(z.d)*TI/KP,4)+"）";}
      ro.innerHTML=hh+'<div class="wnote">モデルは例の値（温度の板 1.25 K/W・500 s・20 s、台車 0.5 (m/s)/N・0.5 s・0.1 s、モータの速度 50 (rad/s)/V・0.05 s）。PI はモデルから決め、本当の対象のむだ時間と定常ゲインだけをずらした。外乱への応答は共通部品 simLoop で、目標値への応答は目標値の重みを扱う自前の計算（同じ離散化）で求めた。</div>';
    }
    draw();
  };

  /* ---- 4 節: 飽和とワインドアップ ---- */
  var _W11_WU={
    plate:{nm:"温度の板",P:{num:[1.25],den:[500,1],L:20},KP:10,TI:160,lim:[40,200],l0:80,sym:false,rr:[5,50],r0:35,tEnd:3000,tShow:1000,n:240000,Tt:[5,1000],t0:80,band:0.5,ru:"K",uu:"W",off:25,yname:"温度 [°C]",ku:"W/K"},
    mspd:{nm:"モータの速度",P:{num:[50],den:[0.05,1],L:0},KP:0.1,TI:0.05,lim:[6,24],l0:12,sym:true,rr:[100,600],r0:500,tEnd:0.5,tShow:0.5,n:25000,Tt:[0.002,0.2],t0:0.025,band:null,ru:"rad/s",uu:"V",off:0,yname:"角速度 [rad/s]",ku:"V/(rad/s)"},
    cart:{nm:"台車の速度",P:{num:[1],den:[1,2],L:0.1},KP:5,TI:0.5,lim:[2.5,10],l0:4,sym:true,rr:[0.5,2],r0:1,tEnd:4,tShow:3,n:40000,Tt:[0.02,2],t0:0.25,band:null,ru:"m/s",uu:"N",off:0,yname:"速度 [m/s]",ku:"N/(m/s)"}
  };
  REG.w11_windup=function(el,U){
    var S=U.S,keys=["plate","mspd","cart"];
    U.head(el,"WINDUP","飽和とワインドアップ — 張り付いている間の積分と、2 つの対策");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板（PI 10 W/K・160 s）","モータの速度（10 章の PI）","台車の速度（PI 5 N/(m/s)・0.5 s）"],0,function(){var z=_W11_WU[keys[obj.get()]];lim.set(z.l0);rr.set(z.r0);tt.set(z.t0);draw();});
    var aw=U.select(r1,"対策",["なし","クランプ（積分を止める）","バックカリキュレーション"],0,draw);
    var r2=U.ctrls(el);
    var lim=U.slider(r2,"操作量の上限",{min:2.5,max:200,log:true,value:80,fmt:function(v){var z=_W11_WU[keys[obj.get()]];return (z.sym?"±":"0〜")+_w11_g(v,3)+" "+z.uu;},onInput:draw});
    var rr=U.slider(r2,"目標値の変化",{min:0.5,max:600,log:true,value:35,fmt:function(v){return _w11_g(v,3)+" "+_W11_WU[keys[obj.get()]].ru;},onInput:draw});
    var tt=U.slider(r2,U.htx("T_t")+"（バックカリキュレーション）",{min:0.002,max:1000,log:true,value:80,fmt:function(v){return _w11_g(v,3)+" s";},onInput:draw});
    var br=U.btnrow(el);
    function setc(i,a){obj.set(i);var z=_W11_WU[keys[i]];lim.set(z.l0);rr.set(z.r0);tt.set(z.t0);aw.set(a);draw();}
    U.button(br,"本文の例（温度の板・対策なし）",function(){setc(0,0);});
    U.button(br,"クランプ",function(){setc(0,1);});
    U.button(br,"バックカリキュレーション（"+U.htx("T_t")+" = 80 s）",function(){setc(0,2);});
    U.button(br,"モータの速度 500 rad/s・対策なし",function(){setc(1,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var z=_W11_WU[keys[obj.get()]],L=Math.min(Math.max(lim.get(),z.lim[0]),z.lim[1]),R=Math.min(Math.max(rr.get(),z.rr[0]),z.rr[1]),Tt=Math.min(Math.max(tt.get(),z.Tt[0]),z.Tt[1]),A=aw.get();
      lim.input.min=Math.log10(z.lim[0]);lim.input.max=Math.log10(z.lim[1]);rr.input.min=Math.log10(z.rr[0]);rr.input.max=Math.log10(z.rr[1]);tt.input.min=Math.log10(z.Tt[0]);tt.input.max=Math.log10(z.Tt[1]);
      tt.el.style.display=A===2?"":"none";
      var umin=z.sym?-L:0,umax=L;
      var a=_w11_sim(U,z.P,{KP:z.KP,TI:z.TI,tEnd:z.tEnd,n:z.n,r:R,umin:umin,umax:umax,aw:["none","clamp","back"][A],Tt:Tt,every:1});
      var t=a.t,y=a.y,u=a.u,uc=a.uc,I=a.I,e=a.e,nar=_w11_nar(box),Wd=nar?400:700,o=[],i;
      var tS=z.tShow,stp=Math.max(1,Math.round(t.length*tS/z.tEnd/700)),sel=[];for(i=0;i<t.length&&t[i]<=tS+1e-9;i+=stp)sel.push(i);
      var x0=nar?56:62,w1=nar?324:610;
      var ymx=Math.max(R*1.05,_w11_amax(y)*1.05),p=U.plot(x0,26,w1,nar?110:120,[0,tS],[z.off,z.off+ymx]);
      o.push(S.T(nar?10:14,14,"(a) 制御量（塗った部分: 正と負の偏差の面積）","start",10.5,"ink",true));
      o.push(p.axes({xl:null,yl:z.yname,xt:U.nice(0,tS,5),yt:U.nice(z.off,z.off+ymx,4),xfmt:function(){return "";},yfmt:function(v){return _w11_g(v,4);},ylOff:40}));
      var ts=sel.map(function(j){return t[j];}),yy=sel.map(function(j){return z.off+y[j];});
      o.push(_w11_area(U,p,ts,yy,z.off+R,1,"signal"));o.push(_w11_area(U,p,ts,yy,z.off+R,-1,"alias"));
      o.push(p.line([[0,z.off+R],[tS,z.off+R]],"muted",1,"5 3"));
      o.push(p.line(sel.map(function(j){return [t[j],z.off+y[j]];}),"signal",2));
      /* (b) 操作量 */
      var ucm=_w11_amax(uc),ucn=_w11_amin(uc),q0=Math.min(umin,ucn,0),q1=Math.max(umax*1.3,Math.min(ucm,umax*5));
      var q=U.plot(x0,nar?168:178,w1,nar?90:100,[0,tS],[q0,q1]);
      o.push(S.T(nar?10:14,nar?158:168,"(b) 計算した操作量（破線）・実際の操作量（実線）・I の分（緑）","start",10.5,"ink",true));
      o.push(q.axes({xl:"時間 t [s]",yl:"["+z.uu+"]",xt:U.nice(0,tS,5),yt:U.nice(q0,q1,4),xfmt:function(v){return _w11_g(v,3);},yfmt:function(v){return _w11_g(v,3);},ylOff:40}));
      o.push(q.line([[0,umax],[tS,umax]],"alias",1,"4 3"));if(z.sym)o.push(q.line([[0,umin],[tS,umin]],"alias",1,"4 3"));
      o.push(q.clip(sel.map(function(j){return [t[j],uc[j]];}),"gold",1.3,"5 3"));
      o.push(q.line(sel.map(function(j){return [t[j],u[j]];}),"gold",2));
      o.push(q.clip(sel.map(function(j){return [t[j],I[j]];}),"green",1.6));
      box.set(S.svg(Wd,(nar?168:178)+(nar?90:100)+44,o));
      /* 読み出し */
      var mx=_w11_amax(y),ep=0,en=0;for(i=1;i<t.length;i++){var h2=t[i]-t[i-1],e0=e[i-1],e1=e[i];ep+=0.5*h2*(Math.max(e0,0)+Math.max(e1,0));en+=0.5*h2*(Math.max(-e0,0)+Math.max(-e1,0));}
      var band=z.band||0.02*R,st=_w11_settle(t,y,R,band),satHi=-1,satLo=-1;for(i=0;i<u.length;i++){if(u[i]>=umax-1e-9)satHi=t[i];if(u[i]<=umin+1e-9&&t[i]>0)satLo=t[i];}
      var KI=z.KP/z.TI,need=I[I.length-1]-I[0],hh="";
      hh+="最高 <b>"+_w11_g(z.off+mx,4)+" "+(z.off?"°C":z.ru)+"</b>"+(mx>R+band?'（<span class="warn">行き過ぎ '+_w11_g(mx-R,3)+" "+z.ru+"</span>）":"（行き過ぎなし）")+"、±"+_w11_g(band,3)+" "+z.ru+" に入るのは <b>"+(st!=null?_w11_g(st,4)+" s":"記録の中で入らない")+"</b><br>";
      hh+="上限に張り付くのは "+(satHi>=0?"<b>"+_w11_g(satHi,4)+" s まで</b>":"なし")+(satLo>=0?"（下限には "+_w11_g(satLo,4)+" s まで）":"")+"、I の分の最大 "+_w11_g(_w11_amax(I),4)+" "+z.uu+"<br>";
      hh+="偏差の面積: 正 "+_w11_g(ep,4)+"、負 "+_w11_g(en,4)+"、差 <b>"+_w11_g(ep-en,4)+"</b> "+z.ru+"·s"+(A===0?"（対策なしでは、I の分の始めと終わりの差 ÷ "+U.htx("K_I")+" = "+_w11_g(need/KI,4)+" と一致する）":"（対策ありでは、張り付いている間の面積は積分されないので一致しない）");
      ro.innerHTML=hh+'<div class="wnote">PI は本文の値（温度の板は 3 節の λ = 20 s、モータの速度は 10 章 5 節、台車は λ = 0.1 s の IMC）。微分は使わない。クランプは、計算した操作量が範囲の外で、積分するとさらに外へ向かう間は積分を止める。バックカリキュレーションは (u − u<sub>c</sub>)/T<sub>t</sub> を積分に足す。どれも始めは止まった状態（I の分 0）から目標値を変える。</div>';
    }
    draw();
  };
