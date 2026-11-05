  /* ===== 16 章 マイコンで実装する ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w16_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w16_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w16_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(/e/.test(s)){var m=s.split("e");s=m[0]+" × 10^{"+(+m[1])+"}";}return s.replace(/-/g,"−");}

  /* モータの角度（10 章の 1000/{s(s+20)}）を、電圧 v を h [s] 保ったときに厳密に進める。x = [角度, 角速度] */
  function _w16_madv(x,v,h){var e=Math.exp(-20*h),wi=50*v;return [x[0]+wi*h+(x[1]-wi)*(1-e)/20,wi+(x[1]-wi)*e];}
  /* 11 章 4 節の pid_step（クランプのアンチワインドアップ）と同じ計算 */
  function _w16_pid(o){var c={kp:o.kp,ti:o.ti,td:o.td,n:o.n,b:o.b,dt:o.dt,umin:o.umin,umax:o.umax,i:0,d:0,y1:0};
    c.start=function(y){c.i=0;c.d=0;c.y1=y;};
    c.pd=function(r,y){if(c.td>0){var a=c.td/(c.td+c.n*c.dt);c.d=a*c.d-a*c.kp*c.n*(y-c.y1);}c.y1=y;return c.kp*(c.b*r-y)+c.d;};
    c.step=function(r,y){var e=r-y,uc=c.pd(r,y)+c.i,u=Math.min(Math.max(uc,c.umin),c.umax);c.uc=uc;
      if(c.ti>0){var di=c.kp*c.dt/c.ti*e;if(!((uc>c.umax&&e>0)||(uc<c.umin&&e<0)))c.i+=di;}return u;};
    return c;}

  /* ---- 1 節: 周期の作り方・計算遅れ・揺らぎ ---- */
  /* way: 0 計算の後で待つ、1 タイマ割り込み、2 タスク、3 タイマが測る・出す時刻を決める。out: 0 (A)、1 (B)。
     Ts・comp [s]、J: 始まりの遅れの最大（Ts に対する割合）。処理の始まり・終わり・測る時刻・出す時刻を先に決め、
     出来事を時刻の順に処理する（測る: PID を 1 回計算、出す: その値を対象に加える）。返り値 {rec, ev（始めの 8 回）, st} */
  function _w16_jrun(U,o){
    var Ts=o.Ts,tend=2,rg=U.rng(o.seed||1),pid=_w16_pid({kp:0.84,ti:0.168,td:0.0238,n:10,b:o.b,dt:Ts,umin:-12,umax:12});
    var n=Math.ceil(tend/Ts)+3,st=[],en=[],me=[],ou=[],k,overrun=0;
    for(k=0;k<n;k++){var lat=o.J>0?rg.range(0,o.J*Ts):0,c=o.comp*(2/3+2/3*rg.next()),s;
      if(o.way===0)s=k===0?0:en[k-1]+Ts;else{s=k*Ts+lat;if(k>0&&s<en[k-1])s=en[k-1];}
      st.push(s);en.push(s+c);me.push(o.way===3?k*Ts:s);
      if(o.way!==0&&s+c>(k+1)*Ts)overrun++;}
    for(k=0;k<n-1;k++){var to=o.way===3?(k+1)*Ts:(o.out===0?en[k]:st[k+1]);if(to<en[k])to=en[k];ou.push(to);}
    var evs=[];for(k=0;k<n-1;k++){if(me[k]<=tend){evs.push([me[k],0,k]);if(ou[k]<=tend)evs.push([ou[k],1,k]);}}
    evs.sort(function(a,b){return a[0]-b[0]||b[1]-a[1];});
    var x=[0,0],t=0,v=0,rec=[[0,0,0]],dT=0.002,nr=1,us=[];
    function adv(to){while(t<to-1e-12){var tr=nr*dT,nx=Math.min(to,tr>t+1e-12?tr:to);if(t<1-1e-12&&nx>1)nx=1;var d=t>=1-1e-12?1:0;
      x=_w16_madv(x,v-d,nx-t);t=nx;if(Math.abs(t-tr)<1e-12){rec.push([tr,x[0],v]);nr++;}}}
    pid.start(0);
    evs.forEach(function(e){adv(e[0]);if(e[1]===0)us[e[2]]=pid.step(1,x[0]);else v=us[e[2]];});
    adv(tend);
    var per=[],Lc=[];for(k=0;k<n-1;k++){if(me[k]>tend)break;if(k>0)per.push(me[k]-me[k-1]);Lc.push(ou[k]-me[k]);}
    function mean(a){var s2=0;a.forEach(function(z){s2+=z;});return a.length?s2/a.length:0;}
    var ev=[];for(k=0;k<8;k++)ev.push({ts:st[k],te:en[k],tm:me[k],to:ou[k]});
    return {rec:rec,ev:ev,st:{per:mean(per),perMin:Math.min.apply(null,per),perMax:Math.max.apply(null,per),Lc:mean(Lc),LcMin:Math.min.apply(null,Lc),LcMax:Math.max.apply(null,Lc),overrun:overrun}};
  }
  function _w16_metrics(rec){var ymax=0,ts=0,dev=0;rec.forEach(function(p){if(p[0]<=1){if(p[1]>ymax)ymax=p[1];if(Math.abs(p[1]-1)>0.02)ts=p[0];}else if(1-p[1]>dev)dev=1-p[1];});
    return {os:Math.max(0,(ymax-1)*100),ts:ts,dev:dev};}
  var _w16_refCache={};
  function _w16_ref(U,b){if(_w16_refCache[b])return _w16_refCache[b];
    var r=_w16_jrun(U,{way:3,out:1,Ts:1e-4,comp:0,J:0,b:b,seed:1});   /* 0.1 ms でタイマが測る・出す（連続時間に近い） */
    _w16_refCache[b]=r;return r;}

  REG.w16_jitter=function(el,U){
    var S=U.S;
    U.head(el,"TIMING","制御周期・計算遅れ・揺らぎと、モータの角度の応答");
    var r1=U.ctrls(el);
    var way=U.select(r1,"周期の作り方",["(a) 計算の後で待つ","(b) タイマ割り込み","(c) 優先度の高いタスク","(d) タイマが測る・出す時刻を決める"],1,draw);
    var out=U.select(r1,"出す時刻",["(A) 計算が終わりしだい","(B) 次の割り込みの始め"],1,draw);
    var bw=U.select(r1,"目標値の重み b",["0.5（10 章 6 節）","1（行き過ぎが見える）"],0,draw);
    var r2=U.ctrls(el);
    var ts=U.slider(r2,"制御周期 T<sub>s</sub>",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" ms";},onInput:draw});
    var cp=U.slider(r2,"計算の時間（平均）",{values:[0.05,0.1,0.2,0.3,0.5,0.8],value:0.3,fmt:function(v){return v+" ms";},onInput:draw});
    var jj=U.slider(r2,"始まりの遅れの最大（揺らぎ）",{values:[0,5,10,20,40,60],value:10,fmt:function(v){return v+" %（周期に対して）";},onInput:draw});
    var seed=1,br=U.btnrow(el);
    function set(w,o,t,c,j,b){way.set(w);out.set(o);ts.set(t);cp.set(c);jj.set(j);bw.set(b);draw();}
    U.button(br,"本文の例（(b)・(B)・1 ms）",function(){set(1,1,1,0.3,10,0);});
    U.button(br,"計算の後で待つ（b = 1）",function(){set(0,0,1,0.3,0,1);});
    U.button(br,"10 ms・(A)",function(){set(1,0,10,0.3,0,0);});
    U.button(br,"10 ms・(B)",function(){set(1,1,10,0.3,0,0);});
    U.button(br,"揺らぎ 40 %（タスク）",function(){set(2,1,1,0.3,40,0);});
    U.button(br,"もう一度（別の乱数）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var W_=way.get(),O=out.get(),Ts=ts.get()/1000,b=bw.get()===0?0.5:1;
      out.el.style.display=W_===3?"none":"";
      var r=_w16_jrun(U,{way:W_,out:O,Ts:Ts,comp:cp.get()/1000,J:jj.get()/100,b:b,seed:seed}),ref=_w16_ref(U,b);
      var nar=_w16_nar(box),Wd=nar?400:700,o=[];
      /* タイミング図（始めの 6 周期） */
      var x0=nar?52:62,x1=Wd-14,n=6,tmax=n*Ts,X=function(tt){return x0+tt/tmax*(x1-x0);},yt=34;
      o.push(S.T(nar?8:14,16,"始めの 6 周期のタイミング（▲ 測る、▼ 出す、帯は計算）","start",10.5,"ink",true));
      o.push(S.L(x0,yt+10,x1,yt+10,"line",1));
      for(var k=0;k<=n;k++){o.push(S.L(X(k*Ts),yt-14,X(k*Ts),yt+16,"faint",1,"3 3"));o.push(S.T(X(k*Ts),yt+30,_w16_g(k*Ts*1000,3),"middle",9.5,"muted"));}
      o.push(S.T(x1,yt+44,"[ms]","end",9.5,"muted"));
      r.ev.forEach(function(e){if(e.ts>tmax)return;var te=Math.min(e.te,tmax);
        o.push(S.RECT(X(e.ts),yt-7,Math.max(1,X(te)-X(e.ts)),14,2,U.soft("gold"),"gold",1));
        o.push(S.PL([[X(e.tm)-3.6,yt+18],[X(e.tm)+3.6,yt+18],[X(e.tm),yt+12]],"teal",1,"teal"));
        if(e.to!=null&&e.to<=tmax)o.push(S.PL([[X(e.to)-3.6,yt-18],[X(e.to)+3.6,yt-18],[X(e.to),yt-12]],"gold",1,"gold"));});
      /* 応答 */
      var py=yt+62,ph=nar?120:150,pw=x1-x0;
      var P=U.plot(x0,py,pw,ph,[0,2],[0,1.4]);
      o.push(P.axes({xl:null,yl:"角度 [rad]",xt:[0,0.5,1,1.5,2],yt:[0,0.5,1],xfmt:function(){return "";},yfmt:function(v){return _w16_f(v,1);},ylOff:nar?36:40}));
      o.push(P.line([[0,1],[2,1]],"muted",1,"5 3"));
      o.push(P.line(ref.rec.map(function(p){return [p[0],p[1]];}),"muted",1.4,"4 3"));
      o.push(P.clip(r.rec.map(function(p){return [p[0],p[1]];}),"signal",2));
      o.push(S.L(P.X(1),py,P.X(1),py+ph,"purple",1,"3 3"));
      o.push(S.T(P.X(1)+4,py+12,"負荷トルク","start",9.5,"purple",false,false,null,true));
      var qy=py+ph+16,qh=nar?70:80,Q=U.plot(x0,qy,pw,qh,[0,2],[-12,12]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:[0,0.5,1,1.5,2],yt:[-12,0,12],xfmt:function(v){return _w16_g(v,2);},yfmt:function(v){return String(v).replace("-","−");},ylOff:nar?36:40}));
      o.push(Q.clip(r.rec.map(function(p){return [p[0],p[2]];}),"gold",1.4));
      o.push(S.LEGL(x0,qy+qh+46,[["signal",null,"この設定"],["muted","4 3","連続時間に近い計算（0.1 ms）"]],9.5,14));
      box.set(S.svg(Wd,qy+qh+56,o));
      var m=_w16_metrics(r.rec),mr=_w16_metrics(ref.rec),st=r.st;
      var Lc=st.Lc,pm=58.8-180/Math.PI*27.8*(Lc+st.per/2);
      var h="";
      h+="周期: 平均 <b>"+_w16_g(st.per*1000,4)+" ms</b>（"+_w16_g(st.perMin*1000,3)+"〜"+_w16_g(st.perMax*1000,3)+" ms）"+(W_===0?' <span class="warn">コードの dt = '+_w16_g(Ts*1000,3)+" ms と合わない</span>":"")+"<br>";
      h+="計算遅れ "+U.htx("L_c")+": 平均 "+_w16_g(Lc*1000,3)+" ms（"+_w16_g(st.LcMin*1000,3)+"〜"+_w16_g(st.LcMax*1000,3)+" ms）、位相余裕の見積もり（15 章 2 節の式）"+_w16_f(pm,1)+"°（連続時間 58.8°）<br>";
      h+="行き過ぎ量 <b>"+_w16_f(m.os,1)+" %</b>（連続時間に近い計算 "+_w16_f(mr.os,1)+" %）、2 % 整定時間 "+_w16_g(m.ts,3)+" s、負荷トルクによるずれの最大 <b>"+_w16_f(m.dev,3)+" rad</b>（"+_w16_f(mr.dev,3)+" rad）<br>";
      if(st.overrun)h+='<span class="warn">次の割り込みまでに計算が終わらなかった回: '+st.overrun+" 回</span><br>";
      ro.innerHTML=h+'<div class="wnote">モータの角度の PID（10 章 6 節の値）を、目標 1 rad、1 s に負荷トルク 0.01 N·m（1 V 相当）で動かす。処理の始まりは、決めた時刻から 0〜（揺らぎ）の間で回ごとにでたらめに遅れ、計算の時間は平均の 2/3〜4/3 倍の間で揺れる。(a) は計算の後で T<sub>s</sub> だけ待つ。(d) は測る時刻と出す時刻がタイマどおりになる。</div>';
    }
    draw();
  };

  /* ---- 3 節: 量子化（温度の板） ---- */
  /* 60 °C で落ち着いた板を 1 s ごとに PI（PID）で保つ。200 s に周りの温度が 25 → 23 °C。ba・bp: ADC・PWM のビット数（0 なら段なし） */
  function _w16_qsim(U,o){
    var K=1.25,T=500,L=20,r=60,span=102.4,pmax=80,la=o.ba?span/Math.pow(2,o.ba):0,lp=o.bp?pmax/Math.pow(2,o.bp):0,q=Math.exp(-1/T);
    var rg=U.rng(o.seed||1),th=r,hist=[],i;for(i=0;i<=L;i++)hist.push(r);
    var I=(r-25)/K,d=0,y1=null,cr=0,a=o.td>0?o.td/(o.td+10):0,out={t:[],th:[],ym:[],v:[]};
    for(var k=0;k<=o.tend;k++){
      var rd=hist[0],ym=rd+(o.noise?o.noise*rg.normal():0);
      if(la)ym=la*Math.round(ym/la);
      if(y1===null)y1=ym;
      var e=r-ym;
      if(o.td>0)d=a*d-a*o.kp*10*(ym-y1);
      y1=ym;
      var uc=o.kp*e+I+d,u=Math.min(Math.max(uc,0),pmax),v;
      if(lp){if(o.carry){v=Math.min(Math.max(lp*Math.round((u+cr)/lp),0),pmax);cr=u+cr-v;}else v=Math.min(Math.max(lp*Math.round(u/lp),0),pmax);}else v=u;
      if(!((uc>pmax&&e>0)||(uc<0&&e<0)))I+=o.kp/o.ti*e;
      var Ta=25+(k>=200?-2:0);
      out.t.push(k);out.th.push(th);out.ym.push(ym);out.v.push(v);
      var tinf=Ta+K*v;th=tinf+(th-tinf)*q;
      hist.shift();hist.push(th);
    }
    return out;
  }
  REG.w16_quant=function(el,U){
    var S=U.S;
    U.head(el,"QUANTIZE","ADC と PWM の段の細かさと、温度の板のリミットサイクル");
    var r1=U.ctrls(el);
    var ba=U.slider(r1,"ADC のビット数",{values:[6,8,10,12,14,16,0],value:0,fmt:function(v){return v?v+" ビット（"+_w16_g(102.4/Math.pow(2,v),3)+" K）":"段なし";},onInput:draw});
    var bp=U.slider(r1,"PWM のビット数",{values:[4,6,8,10,12,14,0],value:8,fmt:function(v){return v?v+" ビット（"+_w16_g(80/Math.pow(2,v),3)+" W）":"段なし";},onInput:draw});
    var r2=U.ctrls(el);
    var cy=U.select(r2,"対策",["なし","出力の端数を次の回に持ち越す"],0,draw);
    var ct=U.select(r2,"制御器",["PI（10 W/K・160 s）","PID（24 W/K・40 s・10 s、N = 10）"],0,draw);
    var nz=U.slider(r2,"観測ノイズ（標準偏差）",{values:[0,0.01,0.02,0.05,0.1],value:0,fmt:function(v){return v+" K";},onInput:draw});
    var seed=1,br=U.btnrow(el);
    function set(a,p,c,t,n){ba.set(a);bp.set(p);cy.set(c);ct.set(t);nz.set(n);draw();}
    U.button(br,"本文 (a) PWM 8 ビット",function(){set(0,8,0,0,0);});
    U.button(br,"(b) ADC 10 ビット",function(){set(10,0,0,0,0);});
    U.button(br,"(c) 端数の持ち越し",function(){set(0,8,1,0,0);});
    U.button(br,"(d) PID・ADC 10 ビット",function(){set(10,0,0,1,0);});
    U.button(br,"ADC 12・PWM 8",function(){set(12,8,0,0,0);});
    U.button(br,"もう一度（別の乱数）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var A=ba.get(),P=bp.get(),pid=ct.get()===1,o={ba:A,bp:P,carry:cy.get()===1,kp:pid?24:10,ti:pid?40:160,td:pid?10:0,noise:nz.get(),seed:seed,tend:2500};
      var r=_w16_qsim(U,o),la=A?102.4/Math.pow(2,A):0,lp=P?80/Math.pow(2,P):0,nar=_w16_nar(box),Wd=nar?400:700,sv=[];
      /* 揺れの幅と、出力の値の数（1500 s 以降） */
      var thm=Infinity,thx=-Infinity,lev={},i;for(i=1500;i<r.t.length;i++){thm=Math.min(thm,r.th[i]);thx=Math.max(thx,r.th[i]);lev[r.v[i].toFixed(6)]=1;}
      var pp=thx-thm,nl=Object.keys(lev).length;
      var x0=nar?52:62,pw=nar?(400-x0-14):(452-x0),y0=26,ph=nar?120:150;
      sv.push(S.T(nar?8:14,14,"板の温度と読み（目標 60 °C。200 s に周りの温度が 2 K 下がる）","start",10.5,"ink",true));
      var lo=Math.min(59.75,thm-0.02),hi=Math.max(60.15,thx+0.02),Pt=U.plot(x0,y0,pw,ph,[0,2500],[lo,hi]);
      sv.push(Pt.axes({xl:null,yl:"温度 [°C]",xt:[0,500,1000,1500,2000,2500],yt:U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),xfmt:function(){return "";},yfmt:function(v){return _w16_f(v,2);},ylOff:nar?38:44}));
      if(la>=0.02){for(var j=Math.ceil((lo-60)/la-0.5);60+(j+0.5)*la<=hi;j++){var ed=60+(j+0.5)*la;if(ed>=lo)sv.push(Pt.line([[0,ed],[2500,ed]],"teal",0.7,"2 3"));}}
      sv.push(Pt.line([[0,60],[2500,60]],"muted",1,"5 3"));
      if(A){var stp=[];for(i=0;i<r.t.length-1;i++){stp.push([r.t[i],r.ym[i]]);stp.push([r.t[i+1],r.ym[i]]);}sv.push(Pt.clip(stp,"teal",1.1));}
      sv.push(Pt.clip(r.t.map(function(tt,ii){return [tt,r.th[ii]];}),"signal",1.7));
      var qy=y0+ph+30,qh=nar?80:100,vm=Infinity,vx=-Infinity;for(i=200;i<r.v.length;i++){vm=Math.min(vm,r.v[i]);vx=Math.max(vx,r.v[i]);}
      var ul=Math.floor(Math.min(vm,28)-0.5),uh=Math.ceil(Math.max(vx,30)+0.5),Q=U.plot(x0,qy,pw,qh,[0,2500],[ul,uh]);
      sv.push(S.T(nar?8:14,qy-8,"ヒータの電力（破線は PWM の段）","start",10.5,"ink",true));
      sv.push(Q.axes({xl:"時間 t [s]",yl:"電力 [W]",xt:[0,500,1000,1500,2000,2500],yt:U.nice(ul,uh,4).filter(function(v){return v>=ul&&v<=uh;}),xfmt:function(v){return String(v);},yfmt:function(v){return _w16_g(v,3);},ylOff:nar?38:44}));
      if(lp>=0.05&&(uh-ul)/lp<40){for(var m2=Math.ceil(ul/lp);m2*lp<=uh;m2++)sv.push(Q.line([[0,m2*lp],[2500,m2*lp]],"gold",0.7,"3 3"));}
      var sp=[];for(i=0;i<r.t.length-1;i++){sp.push([r.t[i],r.v[i]]);sp.push([r.t[i+1],r.v[i]]);}
      sv.push(Q.clip(sp,"gold",1.1));
      /* 右: 温度の目盛に、ADC の段と出力の段ごとに行き着く温度を並べる */
      var stop=null,hgt=qy+qh+40;
      var bx=nar?14:486,by=nar?hgt+18:y0+4,bh=nar?150:ph+qh+20,bw=nar?372:200;
      if(nar)hgt=by+bh+40;
      sv.push(S.T(bx,by-6,"行き着く温度（周りの温度 23 °C）","start",10,"ink",true));
      var tlo=59.4,thi=60.6,Yv=function(v){return by+bh-(v-tlo)/(thi-tlo)*bh;},xa=bx+44;
      var band=la?la/2:0.004;
      sv.push(S.RECT(xa,Yv(60+band),bw-54,Math.max(2,Yv(60-band)-Yv(60+band)),0,U.soft("green"),"none",0));
      if(la>=0.02){for(var j2=Math.ceil((tlo-60)/la-0.5);60+(j2+0.5)*la<=thi;j2++){var e2=60+(j2+0.5)*la;if(e2>=tlo)sv.push(S.L(xa,Yv(e2),bx+bw-10,Yv(e2),"teal",0.8,"3 3"));}}
      sv.push(S.L(xa,by,xa,by+bh,"muted",1.2));
      [59.5,60,60.5].forEach(function(v){sv.push(S.L(xa-4,Yv(v),xa,Yv(v),"muted",1));sv.push(S.T(xa-7,Yv(v)+3.5,_w16_f(v,1),"end",9.5,"muted"));});
      var cx=xa+(bw-54)/2+4;
      if(lp){var kd=1.25*lp,jc=Math.round((60-23)/kd),nin=0;
        for(var jj2=jc-60;jj2<=jc+60;jj2++){var tv=23+kd*jj2;if(tv<tlo||tv>thi)continue;var inb=Math.abs(tv-60)<=band+1e-9;if(inb)nin++;
          sv.push(S.D(cx,Yv(tv),inb?"green":"gold",kd>0.05?3.4:1.6));}
        stop=nin>0;
        sv.push(S.T(cx,by+bh+16,stop?"止まれる段あり":"止まれる段なし","middle",9.5,stop?"green":"alias",true));
      }else sv.push(S.T(cx,by+bh+16,"出力は段なし（どの値も出せる）","middle",9.5,"muted",true));
      sv.push(S.T(xa+4,Yv(60)+3.5,la?"読みが 60.0":"60.0","start",9.5,"green",true,false,null,true));
      box.set(S.svg(Wd,Math.max(hgt,by+bh+30),sv));
      /* 読み出し */
      var h="",kdu=1.25*lp;
      h+="ADC の 1 LSB: "+(la?"<b>"+_w16_g(la,3)+" K</b>":"段なし")+"、PWM の 1 段: "+(lp?"<b>"+_w16_g(lp,3)+" W</b>（行き着く温度の差 KΔu = "+_w16_g(kdu,3)+" K）":"段なし")+"<br>";
      if(lp)h+="偏差の読みが 0 になる範囲（幅 "+(la?_w16_g(la,3)+" K":"0")+"）に入る出力の段: "+(stop?'<span class="ok">ある</span>':'<span class="warn">無い（I の分は止まれない）</span>')+"<br>";
      h+="1500 s 以降の温度の揺れの幅: <b>"+(pp<0.01?_w16_g(pp,2):_w16_f(pp,3))+" K</b>、ヒータの電力のとる値: "+(nl>20?"多数":nl+" 通り")+"<br>";
      if(lp&&!o.carry&&nl===2&&!A&&!o.noise){var vv=Object.keys(lev).map(Number).sort(function(a,b){return a-b;}),hiN=0,sw=[];for(i=1500;i<r.v.length;i++){if(Math.abs(r.v[i]-vv[1])<1e-9)hiN++;if(i>1500&&r.v[i]!==r.v[i-1])sw.push(i);}
        var D=hiN/(r.v.length-1500),Tw=sw.length>2?(sw[sw.length-1]-sw[0])/((sw.length-1)/2):0;
        if(Tw>0)h+="2 つの段を往復: 上の段の割合 D = "+_w16_f(D,2)+"、周期 "+_w16_g(Tw,3)+" s。式 D(1 − D)KΔu T<sub>w</sub>/T = "+_w16_g(D*(1-D)*kdu*Tw/500,2)+" K<br>";}
      ro.innerHTML=h+'<div class="wnote">本文 3 節の場面。温度は 0〜102.4 °C を ADC の値に比例するように、ヒータは 0〜80 W を PWM の段で出すとした（例の値）。読みは 20 s 遅れ、1 s ごとに制御する。右の図の点は、出力をその段にとどめたときに板が行き着く温度で、緑の帯（偏差の読みが 0 になる範囲）に入る点があれば、I の分はそこで止まれる。</div>';
    }
    draw();
  };

  /* ---- 4 節: 固定小数点 ---- */
  /* 4 節の pid_q16_step と同じ整数の計算（小数部 f ビット）でモータの角度を 1 ms ごとに動かす（BigInt で 64 ビットの計算をそのまま行う）。
     o = {f, wide（I の分を 64 ビットでためる）, ovf（"sat"・"wrap"）, rnd（"round"・"floor"）, r（目標）, load}。float の 11 章の計算も並べる */
  function _w16_fx(o){
    var f=o.f,F=BigInt(f),MAX=2147483647n,MIN=-2147483648n,nO=0;
    function L(v){if(o.ovf==="sat"){if(v>MAX){nO++;return MAX;}if(v<MIN){nO++;return MIN;}return v;}var w=BigInt.asIntN(32,v);if(w!==v)nO++;return w;}
    function rq(v,s){if(o.rnd==="floor")return v>>s;var h=1n<<(s-1n);return v>=0n?(v+h)>>s:-((h-v)>>s);}
    function toq(x){var v=x*Math.pow(2,f),a=Math.floor(Math.abs(v)+0.5);return L(BigInt(v>=0?a:-a));}
    var Ts=0.001,a=0.0238/(0.0238+10*Ts),cf={kp:0.84,b:0.5,a:a,akn:a*0.84*10,ki:0.84*Ts/0.168};
    var KP=toq(cf.kp),B=toq(cf.b),A=toq(cf.a),AKN=toq(cf.akn),KI=toq(cf.ki),UMIN=toq(-12),UMAX=toq(12),R=toq(o.r);
    var I=0n,D=0n,Y1=toq(0),x=[0,0],xf=[0,0],pf=_w16_pid({kp:0.84,ti:0.168,td:0.0238,n:10,b:0.5,dt:Ts,umin:-12,umax:12}),N=o.n||3000;
    pf.start(0);var out={t:[0],y:[0],yf:[0],u:[0],uf:[0],nO:0};
    for(var k=0;k<N;k++){
      var Y=toq(x[0]),E=L(R-Y);
      D=L(rq(A*D,F)-rq(AKN*L(Y-Y1),F));Y1=Y;
      var PD=L(rq(KP*L(rq(B*R,F)-Y),F)+D),UC=PD+(o.wide?rq(I,F):I),Uq=UC>UMAX?UMAX:(UC<UMIN?UMIN:UC);Uq=L(Uq);
      if(!((UC>UMAX&&E>0n)||(UC<UMIN&&E<0n)))I=o.wide?I+KI*E:L(I+rq(KI*E,F));
      var u=Number(Uq)/Math.pow(2,f),uf=pf.step(o.r,xf[0]),d=(o.load&&k*Ts>=1-1e-12)?1:0;
      x=_w16_madv(x,u-d,Ts);xf=_w16_madv(xf,uf-d,Ts);
      out.t.push((k+1)*Ts);out.y.push(x[0]);out.yf.push(xf[0]);out.u.push(u);out.uf.push(uf);
    }
    out.nO=nO;out.coef=[["K_P",cf.kp,KP],["b",cf.b,B],["a",cf.a,A],["aK_PN",cf.akn,AKN],["K_PT_s/T_I",cf.ki,KI]];out.f=f;
    return out;
  }
  REG.w16_fixed=function(el,U){
    var S=U.S;
    U.head(el,"FIXED POINT","Q 形式の PID と float の PID（モータの角度、1 ms ごと）");
    var r1=U.ctrls(el);
    var ff=U.slider(r1,"小数部のビット数 f",{values:[8,10,12,14,16,18,20,24,26,27,28],value:16,fmt:function(v){return v+"（Q"+(32-v)+"."+v+"）";},onInput:draw});
    var sc=U.select(r1,"動かし方",["目標 1 rad、1 s に負荷トルク","目標 20 rad"],0,draw);
    var r2=U.ctrls(el);
    var wd=U.select(r2,"I の分のため方",["64 ビットでためる（本文のコード）","Qf のまま丸めてためる"],0,draw);
    var rn=U.select(r2,"丸め方",["四捨五入（本文のコード）","切り捨て（右へずらすだけ）"],0,draw);
    var ov=U.select(r2,"桁あふれのとき",["飽和演算（本文のコード）","一周する（2 の補数）"],0,draw);
    var br=U.btnrow(el);
    function set(f,s,w,r,o){ff.set(f);sc.set(s);wd.set(w);rn.set(r);ov.set(o);draw();}
    U.button(br,"本文のコード（Q16.16）",function(){set(16,0,0,0,0);});
    U.button(br,"Qf のまま丸める（f = 12）",function(){set(12,0,1,0,0);});
    U.button(br,"f = 8",function(){set(8,0,0,0,0);});
    U.button(br,"Q5.27 で 20 rad（一周する）",function(){set(27,1,0,0,1);});
    U.button(br,"Q5.27 で 20 rad（飽和演算）",function(){set(27,1,0,0,0);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var f=ff.get(),big=sc.get()===1,o={f:f,wide:wd.get()===0,rnd:rn.get()===0?"round":"floor",ovf:ov.get()===0?"sat":"wrap",r:big?20:1,load:!big,n:big?2000:3000};
      var r=_w16_fx(o),nar=_w16_nar(box),Wd=nar?400:700,sv=[],i;
      /* 32 ビットの並び */
      var bx=nar?14:110,bw=Wd-bx-14,cw=bw/32,ni=31-f;
      sv.push(S.T(nar?8:14,16,"32 ビットの整数の分け方（Q"+(32-f)+"."+f+"）","start",10.5,"ink",true));
      for(i=0;i<32;i++){var c=i===0?"alias":(i<=ni?"signal":"green");sv.push(S.RECT(bx+i*cw,24,cw,16,0,U.soft(c),c,0.7));}
      var rng=Math.pow(2,31-f),res=Math.pow(2,-f);
      sv.push(S.TX(bx,56,"範囲 ±"+_w16_g(rng,4)+"、刻み 2^{−"+f+"} = "+_w16_g(res,3),"start",9.5,"muted"));
      var mx=big?20:1.2;sv.push(S.T(bx+bw,56,(mx<rng?"最大の値 "+mx+" は収まる":"最大の値 "+mx+" が収まらない"),"end",9.5,mx<rng?"green":"alias",true));
      /* 応答 */
      var x0=nar?52:62,pw=Wd-x0-14,tE=big?2:3,y0=82,ph=nar?120:150;
      var ys=r.y.concat(r.yf),ylo=Math.min(0,Math.min.apply(null,ys))-0.05*mx,yhi=Math.max(Math.max.apply(null,ys),mx)*1.08;
      var P=U.plot(x0,y0,pw,ph,[0,tE],[ylo,yhi]);
      sv.push(P.axes({xl:null,yl:"角度 [rad]",xt:U.nice(0,tE,4),yt:U.nice(ylo,yhi,4).filter(function(v){return v>=ylo&&v<=yhi;}),xfmt:function(){return "";},yfmt:function(v){return _w16_g(v,3);},ylOff:nar?36:42}));
      sv.push(P.line(r.t.map(function(tt,k){return [tt,r.yf[k]];}),"muted",1.6,"5 3"));
      sv.push(P.clip(r.t.map(function(tt,k){return [tt,r.y[k]];}),"signal",2));
      /* 差 */
      var df=r.t.map(function(tt,k){return (r.y[k]-r.yf[k])*1000;}),dm=Math.max(1e-6,Math.max.apply(null,df.map(Math.abs)));
      var qy=y0+ph+28,qh=nar?70:90,Q=U.plot(x0,qy,pw,qh,[0,tE],[-dm*1.1,dm*1.1]);
      sv.push(S.T(nar?8:14,qy-8,"整数の計算 − float の計算 [mrad]","start",10.5,"ink",true));
      sv.push(Q.axes({xl:"時間 t [s]",yl:"[mrad]",xt:U.nice(0,tE,4),yt:[-dm,0,dm],xfmt:function(v){return _w16_g(v,2);},yfmt:function(v){return _w16_g(v,2);},ylOff:nar?36:42}));
      sv.push(Q.line(r.t.map(function(tt,k){return [tt,df[k]];}),"alias",1.4));
      sv.push(S.LEGL(x0,qy+qh+46,[["signal",null,"整数（Q 形式）の計算"],["muted","5 3","float の計算（11 章のコード）"]],9.5,14));
      box.set(S.svg(Wd,qy+qh+56,sv));
      /* 読み出し */
      var h="",tb=r.coef.map(function(c){var back=Number(c[2])/Math.pow(2,f);return [U.htx(c[0]),_w16_g(c[1],6),String(c[2]),_w16_g(back,7),(c[1]?_w16_g((back-c[1])/c[1]*100,2)+" %":"—")];});
      h+=U.tbl(["係数","値","整数","戻した値","差"],tb,["left","right","right","right","right"]);
      var e1=Math.abs(r.r-r.y[r.y.length-1]),thr=Math.pow(2,-f)/(2*0.005);
      h+="終わりの偏差: 整数 <b>"+_w16_g(e1*1000,3)+" mrad</b>、float "+_w16_g(Math.abs(r.r-r.yf[r.yf.length-1])*1000,3)+" mrad。差の最大 "+_w16_g(dm,3)+" mrad<br>";
      if(!o.wide)h+="I の分が動かなくなる偏差（4 節の式 2<sup>−f</sup>/(2k<sub>I</sub>)）: "+_w16_g(thr*1000,3)+" mrad<br>";
      h+=r.nO?'<span class="warn">範囲を越えた計算: '+r.nO+" 回（"+(o.ovf==="sat"?"端の値にした":"一周した")+"）</span><br>":'<span class="ok">範囲を越えた計算なし</span><br>';
      ro.innerHTML=h+'<div class="wnote">本文 4 節の pid_q16_step と同じ整数の計算（64 ビットの積、四捨五入、飽和演算）を、ブラウザの BigInt で行う。f = 16・64 ビットでためる・四捨五入・飽和演算のとき、本文のコードと同じ値になる。測った角度も小数部 f ビットに丸める。</div>';
    }
    draw();
  };

  /* ---- 6 節: 正弦波を足して一巡伝達関数を測る ---- */
  /* (B)（d = 1）または (A)（d = 0）のループの一巡伝達関数 P(z)C(z)z^{−d} の z = e^{jωTs} での値 {re, im} */
  var _w16_Pd=null;
  function _w16_Lz(U,w,d){var Ts=0.001;if(!_w16_Pd)_w16_Pd=U.ctl.mat.c2d([[0,1],[0,-20]],[[0],[1000]],Ts);
    var cx=U.ctl.cx,c=U.ctl.c,Ad=_w16_Pd.A,Bd=_w16_Pd.B,z=c(Math.cos(w*Ts),Math.sin(w*Ts));
    /* (zI − Ad)^{−1} Bd の 1 行目 */
    var m11=cx.sub(z,c(Ad[0][0])),m12=c(-Ad[0][1]),m21=c(-Ad[1][0]),m22=cx.sub(z,c(Ad[1][1])),det=cx.sub(cx.mul(m11,m22),cx.mul(m12,m21));
    var P=cx.div(cx.sub(cx.mul(m22,c(Bd[0][0])),cx.mul(m12,c(Bd[1][0]))),det);
    var kp=0.84,a=0.0238/(0.0238+10*Ts),ki=kp*Ts/0.168,zm1=cx.sub(z,c(1));
    var C=cx.add(cx.add(c(kp),cx.div(c(ki),zm1)),cx.div(cx.scale(zm1,a*kp*10),cx.sub(z,c(a))));
    var Lv=cx.mul(C,P);if(d)Lv=cx.div(Lv,z);return Lv;}
  function _w16_meas(U,o){var Ts=0.001,pid=_w16_pid({kp:0.84,ti:0.168,td:0.0238,n:10,b:0.5,dt:Ts,umin:-12,umax:12}),rg=U.rng(o.seed);
    var x=[1,0];pid.start(1);pid.i=0-pid.pd(1,1);
    var nP=2*Math.PI/(o.w*Ts),nrec=Math.round(o.M*nP),n0=1000,un=0,re={uc:[0,0],u:[0,0]},wave=[];
    for(var k=0;k<n0+nrec;k++){var y=x[0]+(o.noise?o.noise*rg.normal():0),uc=pid.step(1,y),u=Math.min(Math.max(uc+o.A*Math.sin(o.w*k*Ts),-12),12),uo;
      if(o.d){uo=un;un=u;}else uo=u;
      if(k>=n0){var cs=Math.cos(o.w*k*Ts),sn=Math.sin(o.w*k*Ts);re.uc[0]+=uc*cs;re.uc[1]-=uc*sn;re.u[0]+=u*cs;re.u[1]-=u*sn;wave.push([(k-n0)*Ts,uc,u,x[0]-1]);}
      x=_w16_madv(x,uo,Ts);}
    var cx=U.ctl.cx,c=U.ctl.c,Lm=cx.neg(cx.div(c(re.uc[0],re.uc[1]),c(re.u[0],re.u[1])));
    return {L:Lm,wave:wave};}
  REG.w16_inject=function(el,U){
    var S=U.S,cx=U.ctl.cx;
    U.head(el,"INJECTION","ループを閉じたまま正弦波を足して、一巡伝達関数を測る");
    var r1=U.ctrls(el);
    var ww=U.slider(r1,"角周波数 ω",{min:2,max:300,log:true,value:28,fmt:function(v){return _w16_g(v,3)+" rad/s";},onInput:measure});
    var aa=U.slider(r1,"振幅",{values:[0.05,0.1,0.2,0.5,1],value:0.2,fmt:function(v){return v+" V";},onInput:measure});
    var r2=U.ctrls(el);
    var mm=U.slider(r2,"平均する周期の数",{values:[1,2,3,5,10],value:3,fmt:function(v){return v+" 周期";},onInput:measure});
    var nn=U.slider(r2,"観測ノイズ（標準偏差）",{values:[0,0.5,1,2,5],value:0,fmt:function(v){return v+" mrad";},onInput:measure});
    var dd=U.select(r2,"出す時刻",["(B) 次の割り込み（1 節のコード）","(A) すぐ出す"],0,function(){pts=[];measure();});
    var pts=[],seed=1,last=null,br=U.btnrow(el);
    U.button(br,"この ω の点を残す",function(){if(last)pts.push(last);draw();});
    U.button(br,"掃引（9 点を順に測る）",function(){pts=[];[3,5,10,20,28,40,60,100,200].forEach(function(w){pts.push(one(w));});draw();});
    U.button(br,"点を消す",function(){pts=[];draw();});
    U.button(br,"もう一度（別の乱数）",function(){seed++;measure();});
    var box=U.svgbox(el),ro=U.readout(el);
    function one(w){var r=_w16_meas(U,{w:w,A:aa.get(),M:mm.get(),noise:nn.get()/1000,d:dd.get()===0?1:0,seed:seed});r.w=w;return r;}
    function measure(){last=one(ww.get());draw();}
    function draw(){
      var d=dd.get()===0?1:0,nar=_w16_nar(box),Wd=nar?400:700,sv=[],x0=nar?52:62,pw=Wd-x0-14,i;
      /* 波形 */
      var wv=last.wave,tE=wv.length?wv[wv.length-1][0]:1,umx=0.05,ymx=1e-4;wv.forEach(function(p){umx=Math.max(umx,Math.abs(p[1]),Math.abs(p[2]));ymx=Math.max(ymx,Math.abs(p[3]));});
      sv.push(S.T(nar?8:14,14,"記録（ω = "+_w16_g(last.w,3)+" rad/s、平均した区間）","start",10.5,"ink",true));
      var P1=U.plot(x0,24,pw,nar?60:70,[0,tE],[-umx*1.1,umx*1.1]);
      sv.push(P1.axes({xl:null,yl:"[V]",xt:U.nice(0,tE,4),yt:[-umx,0,umx].map(function(v){return +v.toPrecision(2);}),xfmt:function(){return "";},yfmt:function(v){return _w16_g(v,2);},ylOff:nar?36:42}));
      sv.push(P1.line(wv.map(function(p){return [p[0],p[2]];}),"gold",1.6));
      sv.push(P1.line(wv.map(function(p){return [p[0],p[1]];}),"gold",1.3,"4 3"));
      var y2=24+(nar?60:70)+12,P2=U.plot(x0,y2,pw,nar?50:60,[0,tE],[-ymx*1.1,ymx*1.1]);
      sv.push(P2.axes({xl:"時間 [s]",yl:"[rad]",xt:U.nice(0,tE,4),yt:[-ymx,0,ymx].map(function(v){return +v.toPrecision(2);}),xfmt:function(v){return _w16_g(v,3);},yfmt:function(v){return _w16_g(v,2);},ylOff:nar?36:42}));
      sv.push(P2.line(wv.map(function(p){return [p[0],p[3]];}),"signal",1.4));
      var lg=y2+(nar?50:60)+44;
      sv.push(S.LEGL(x0,lg,[["gold",null,"u（d を足した値）"],["gold","4 3","u_c"],["signal",null,"y − r"]],9.5,14));
      /* ボード線図（線: 厳密な値、○: 測った点） */
      var ws=U.ctl.logspace(0,Math.log10(400),240),db=[],ph=[],prev=null;
      ws.forEach(function(w){var Lv=_w16_Lz(U,w,d),p=cx.arg(Lv)*180/Math.PI;if(prev!==null){while(p-prev>180)p-=360;while(p-prev<-180)p+=360;}prev=p;db.push(20*Math.log10(cx.abs(Lv)));ph.push(p);});
      var sh=Math.round((ph[0]+90)/360)*360;ph=ph.map(function(p){return p-sh;});
      var bo=U.ctl.bodeSvg([{w:ws,db:db,ph:ph,c:"signal"}],{x:x0,y:lg+18,w:pw,hm:nar?90:110,hp:nar?80:100,wr:[1,400],dbr:[-40,60],phr:[-225,-90]});
      sv.push(bo.svg);
      var all=pts.slice();if(last)all.push(last);
      all.forEach(function(p,ii){var g=20*Math.log10(cx.abs(p.L)),a=cx.arg(p.L)*180/Math.PI;while(a>-90)a-=360;while(a<-450)a+=360;var cur=ii===all.length-1;
        sv.push(S.CIRC(bo.Pm.X(p.w),bo.Pm.Y(g),cur?5:4,cur?"alias":"gold",1.8,"screen"));sv.push(S.CIRC(bo.Pp.X(p.w),bo.Pp.Y(a),cur?5:4,cur?"alias":"gold",1.8,"screen"));});
      box.set(S.svg(Wd,bo.h+4,sv));
      /* 読み出し: 今の点と、点から読んだ余裕 */
      var Lt=_w16_Lz(U,last.w,d),h="";
      h+="ω = "+_w16_g(last.w,3)+" rad/s: 測った "+U.htx("|PC|")+" = <b>"+_w16_g(cx.abs(last.L),4)+"</b>、位相 <b>"+_w16_f(cx.arg(last.L)*180/Math.PI,1)+"°</b>（厳密な値 "+_w16_g(cx.abs(Lt),4)+"、"+_w16_f(cx.arg(Lt)*180/Math.PI,1)+"°）<br>";
      var ps=pts.slice().sort(function(a,b){return a.w-b.w;}),est=null;
      for(i=1;i<ps.length;i++){var g0=20*Math.log10(cx.abs(ps[i-1].L)),g1=20*Math.log10(cx.abs(ps[i].L));if(g0>=0&&g1<0){var fr=g0/(g0-g1),lw=Math.log10(ps[i-1].w)+fr*(Math.log10(ps[i].w)-Math.log10(ps[i-1].w)),a0=cx.arg(ps[i-1].L)*180/Math.PI,a1=cx.arg(ps[i].L)*180/Math.PI;est={w:Math.pow(10,lw),pm:180+a0+fr*(a1-a0)};}}
      var mg=U.ctl.margins?null:null,wgc=null;for(i=1;i<ws.length;i++)if(db[i-1]>=0&&db[i]<0){wgc=ws[i-1]+(ws[i]-ws[i-1])*db[i-1]/(db[i-1]-db[i]);break;}
      var Lg=wgc?_w16_Lz(U,wgc,d):null;
      h+="残した点から読んだゲイン交差角周波数と位相余裕: "+(est?"<b>"+_w16_g(est.w,3)+" rad/s、"+_w16_f(est.pm,1)+"°</b>":"（0 dB をはさむ 2 点が要る。「掃引」を押す）")+(Lg?"（厳密な値 "+_w16_g(wgc,3)+" rad/s、"+_w16_f(180+cx.arg(Lg)*180/Math.PI,1)+"°）":"")+"<br>";
      ro.innerHTML=h+'<div class="wnote">モータの角度の PID（10 章 6 節の値、1 ms ごと）を目標 1 rad で落ち着かせ、制御器の出す u<sub>c</sub> に A sin ωt を足して出す。1 s 待ってから、決めた周期の数だけ記録し、u<sub>c</sub> と u の ω の成分の比から −U<sub>c</sub>/U を求める。線は 15 章 5 節の方法の厳密な値。赤い ○ が今の点、金色の ○ が残した点。</div>';
    }
    measure();
  };
