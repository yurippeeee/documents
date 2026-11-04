  /* ===== 01 章 制御とは何か ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w01_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w01_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W01_C=2,_W01_G=9.81,_W01_R=1;
  function _w01_dslope(m,deg){return m*_W01_G*Math.sin(deg*Math.PI/180);}
  /* 添字付きの文字（"K_P" → K の右下に小さな P） */
  function _w01_tx(U,x,y,s,a,sz,c,b,halo){
    sz=sz||10;var segs=[],re=/([A-Za-z])_([A-Za-z0-9∞]+)/g,m,pos=0;
    while((m=re.exec(s))){if(m.index>pos)segs.push([s.slice(pos,m.index),null]);segs.push([m[1],m[2]]);pos=re.lastIndex;}
    if(pos<s.length)segs.push([s.slice(pos),null]);
    var ss=sz*0.72,w=0;segs.forEach(function(g){w+=U.tw(g[0],sz)+(g[1]?U.tw(g[1],ss):0);});
    var x0=x-(a==="middle"?w/2:(a==="end"?w:0));
    var h='<text x="'+x0.toFixed(2)+'" y="'+(+y).toFixed(2)+'" text-anchor="start" font-size="'+sz+'" fill="'+U.col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
      (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>',pend=0;
    segs.forEach(function(g){h+='<tspan'+(pend?' dy="'+pend+'"':'')+'>'+U.esc(g[0])+'</tspan>';pend=0;if(g[1]){h+='<tspan dy="3" font-size="'+ss.toFixed(2)+'">'+U.esc(g[1])+'</tspan>';pend=-3;}});
    return h+'</text>';
  }
  /* 台車の速度の比例制御（本文と同じ計算: 刻み h の間は力を一定として、速度の式を厳密に解く）。
     o = {Kp, L, m, tEnd, h, uff, noise, seed, hold, dFn(t, 位置), rec, stopAt}。返り値 {t, y, ym, u, d, p}（rec ごと） */
  function _w01_sim(U,o){
    var h=o.h||1e-3,n=Math.round(o.tEnd/h),nd=Math.round((o.L||0)/h),kr=Math.max(1,Math.round((o.rec||0.01)/h)),kh=Math.max(1,Math.round((o.hold||0.01)/h));
    var m=o.m||1,a=Math.exp(-_W01_C*h/m),u0=o.uff===false?0:_W01_C*_W01_R,rg=o.noise?U.rng(o.seed||1):null;
    var hist=new Float64Array(n+1),y=0,p=0,nz=0,out={t:[],y:[],ym:[],u:[],d:[],p:[]};
    for(var k=0;k<=n;k++){
      var t=k*h;hist[k]=y;
      var ym=k>=nd?hist[k-nd]:0;
      if(rg&&k%kh===0)nz=o.noise*rg.normal();
      var ymn=ym+(rg?nz:0),u=u0+o.Kp*(_W01_R-ymn),d=o.dFn?o.dFn(t,p):0;
      var last=(o.stopAt!=null&&p>=o.stopAt)||Math.abs(y)>1e4;
      if(k%kr===0||last){out.t.push(t);out.y.push(y);out.ym.push(ymn);out.u.push(u);out.d.push(d);out.p.push(p);}
      if(last)break;
      var yi=(u-d)/_W01_C;
      p+=yi*h+(y-yi)*(m/_W01_C)*(1-a);
      y=yi+(y-yi)*a;
    }
    return out;
  }
  /* 範囲の外に出たところで止める折れ線 */
  function _w01_clip(P,ts,vs,c,lw,dash,S){var q=[],lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]);
    for(var i=0;i<ts.length;i++){if(ts[i]<P.xr[0]-1e-9||ts[i]>P.xr[1]+1e-9)continue;var v=vs[i];
      if(!(v>=lo&&v<=hi)){q.push([P.X(ts[i]),P.Y(v>hi?hi:lo)]);break;}q.push([P.X(ts[i]),P.Y(v)]);}
    return q.length>1?S.PL(q,c,lw,null,dash):"";}
  /* 加え合わせ点（丸を斜めの線で 4 つに区切り、矢印が入る側に符号） */
  function _w01_sum(S,x,y,signs){var R=15,k=R*0.7071,o=[S.CIRC(x,y,R,"ink",1.5,"screen"),S.L(x-k,y-k,x+k,y+k,"muted",0.9),S.L(x-k,y+k,x+k,y-k,"muted",0.9)];
    var pos={l:[-8.2,3.9],r:[8.2,3.9],t:[0,-4.6],b:[0,12.4]};
    Object.keys(signs).forEach(function(sd){var q=pos[sd];o.push(S.T(x+q[0],y+q[1],signs[sd],"middle",10.5,"ink",true));});
    return o.join("");}
  function _w01_chipL(U,S,x,y,t,c){var w=U.tw(t,9.5)+10;return S.CHIP(x+w/2,y,t,c,9.5);}

  /* ---- 4 節: ブロック線図の上の値を時刻で追う ---- */
  REG.w01_signals=function(el,U){
    var S=U.S;
    U.head(el,"SIGNALS","ブロック線図の各矢印の値（台車の速度の比例制御）");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:sim});
    var tt=U.slider(r1,"時刻 t",{min:0,max:8,step:0.01,value:6,fmt:function(v){return _w01_f(v,2)+" s";},onInput:draw});
    var r2=U.ctrls(el);
    var sl=U.checkbox(r2,"4 s に上り坂 3° に入る",true,sim);
    var ld=U.checkbox(r2,"荷物 1 kg（質量 2 kg）",false,sim);
    var nz=U.checkbox(r2,"観測ノイズ（標準偏差 0.02 m/s）",false,sim);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.05;if(v>=8){v=8;tick.stop();}tt.set(v);draw();},50);
    U.button(br,"本文の例（K<sub>P</sub> = 8、坂、t = 6 s）",function(){tick.stop();kp.set(8);sl.set(true);ld.set(false);nz.set(false);tt.set(6);sim();});
    U.button(br,"再生（0 s から）",function(){tt.set(0);sim();tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var seedBtn=U.button(br,"もう一度（別の乱数で）",function(){seed++;sim();});
    var bd=U.svgbox(el,{scroll:true}),box=U.svgbox(el),ro=U.readout(el);
    var R=null,seed=1,m=1,NS=null;
    function sd(a){var mu=0,v=0;a.forEach(function(x){mu+=x;});mu/=a.length;a.forEach(function(x){v+=(x-mu)*(x-mu);});return Math.sqrt(v/a.length);}
    function sim(){
      m=ld.get()?2:1;var slope=sl.get();
      NS=null;if(nz.get()){var Q=_w01_sim(U,{Kp:kp.get(),m:m,tEnd:60,rec:0.001,noise:0.02,seed:seed});NS={su:sd(Q.u.slice(5000)),sy:sd(Q.y.slice(5000))};}
      R=_w01_sim(U,{Kp:kp.get(),L:0,m:m,tEnd:8,rec:0.01,noise:nz.get()?0.02:0,seed:seed,dFn:function(t){return slope&&t>=4-1e-9?_w01_dslope(m,3):0;}});
      draw();
    }
    function at(arr,t){var i=Math.max(0,Math.min(arr.length-1,Math.round(t/0.01)));return arr[i];}
    function draw(){
      if(!R)return;
      seedBtn.style.display=nz.get()?"":"none";
      var t=tt.get(),K=kp.get(),y=at(R.y,t),ym=at(R.ym,t),u=at(R.u,t),d=at(R.d,t),e=_W01_R-ym,u0=_W01_C*_W01_R,o=[];
      /* ブロック線図（図 e01_fb_bd と同じ並び） */
      var B={r0:18,br:70,s1:108,kp0:176,kp1:250,s2:300,sd:380,c0:428,c1:524,bp:592,end:690},Rr=15,yy=100,cy=yy+33,yu=yy-62,yf=yy+70;
      o.push(S.ARR(B.r0,yy,B.s1-Rr,yy,"muted",1.8));o.push(S.T(B.r0+2,yy-9,"目標値 r","start",10,"muted",true));
      o.push(S.CHIP((B.r0+B.br)/2+4,cy,"1.000 m/s","muted",9.5));
      o.push(_w01_sum(S,B.s1,yy,{l:"+",b:"−"}));
      o.push(S.ARR(B.s1+Rr,yy,B.kp0,yy,"alias",1.8));o.push(S.T((B.s1+Rr+B.kp0)/2,yy-9,"偏差 e","middle",10,"alias",true));
      o.push(S.CHIP((B.s1+Rr+B.kp0)/2,cy,_w01_f(e,3)+" m/s","alias",9.5));
      o.push(S.RECT(B.kp0,yy-20,B.kp1-B.kp0,40,6,"panel","signal",1.4));o.push(_w01_tx(U,(B.kp0+B.kp1)/2,yy+5,"× "+K,"middle",12,"ink",true));
      o.push(S.ARR(B.kp1,yy,B.s2-Rr,yy,"gold",1.8));o.push(_w01_tx(U,(B.kp1+B.s2-Rr)/2,yy-9,"K_P e","middle",10,"gold",true));
      o.push(S.CHIP((B.kp1+B.s2-Rr)/2,cy,_w01_f(K*e,2)+" N","gold",9.5));
      o.push(S.D(B.br,yy,"muted",3.6));o.push(S.L(B.br,yy,B.br,yu,"muted",1.6));o.push(S.ARR(B.br,yu,B.kp0,yu,"muted",1.6));
      o.push(S.RECT(B.kp0,yu-19,B.kp1-B.kp0,38,6,"panel","line",1.4));o.push(S.T((B.kp0+B.kp1)/2,yu-3,"決めた力","middle",10.5,"ink",true));
      o.push(_w01_tx(U,(B.kp0+B.kp1)/2,yu+12,"u_0 = c r","middle",9.5,"muted"));
      o.push(S.W([B.kp1,yu,B.s2,yu],"gold",1.8));o.push(S.ARR(B.s2,yu,B.s2,yy-Rr,"gold",1.8));
      o.push(_w01_tx(U,B.s2+8,yu+16,"u_0","start",10,"gold",true));o.push(_w01_chipL(U,S,B.s2+8,yu+36,"2.00 N","gold"));
      o.push(_w01_sum(S,B.s2,yy,{l:"+",t:"+"}));
      o.push(S.ARR(B.s2+Rr,yy,B.sd-Rr,yy,"gold",1.8));o.push(S.T((B.s2+B.sd)/2,yy-9,"操作量 u","middle",10,"gold",true));
      o.push(S.CHIP((B.s2+B.sd)/2,cy,_w01_f(u,2)+" N","gold",9.5));
      o.push(_w01_sum(S,B.sd,yy,{l:"+",t:"−"}));o.push(S.ARR(B.sd,yy-46,B.sd,yy-Rr,"purple",1.8));
      o.push(S.T(B.sd+8,yy-34,"外乱 d（坂の力）","start",10,"purple",true));o.push(_w01_chipL(U,S,B.sd+8,yy-54,_w01_f(d,2)+" N","purple"));
      o.push(S.ARR(B.sd+Rr,yy,B.c0,yy,"ink",1.8));
      o.push(S.RECT(B.c0,yy-20,B.c1-B.c0,40,6,"panel","signal",1.4));o.push(S.T((B.c0+B.c1)/2,yy-3,"台車","middle",11,"ink",true));
      o.push(S.T((B.c0+B.c1)/2,yy+12,"質量 "+m+" kg","middle",9.5,"muted"));
      o.push(S.ARR(B.c1,yy,B.end,yy,"signal",1.8));o.push(S.T((B.c1+B.end)/2+26,yy-9,"制御量 y（速度）","middle",10,"signal",true));
      o.push(S.CHIP(B.end-6-(U.tw(_w01_f(y,3)+" m/s",9.5)+10)/2,cy,_w01_f(y,3)+" m/s","signal",9.5));
      o.push(S.D(B.bp,yy,"signal",4));o.push(S.L(B.bp,yy,B.bp,yf,"signal",1.8));o.push(S.ARR(B.bp,yf,B.c1,yf,"signal",1.8));
      o.push(S.RECT(B.c0,yf-18,B.c1-B.c0,36,6,"panel","teal",1.4));o.push(S.T((B.c0+B.c1)/2,yf+4,"センサ","middle",10.5,"ink",true));
      o.push(S.L(B.c0,yf,B.s2+Rr,yf,"teal",1.8));o.push(_w01_sum(S,B.s2,yf,{r:"+",b:"+"}));
      o.push(S.ARR(B.s2,yf+44,B.s2,yf+Rr,"teal",1.6,null,"4 3"));o.push(S.T(B.s2+8,yf+40,"観測ノイズ n"+(nz.get()?" = "+_w01_f(ym-y,3)+" m/s":"（なし）"),"start",10,"teal",true));
      o.push(S.L(B.s2-Rr,yf,B.s1,yf,"teal",1.8));o.push(S.ARR(B.s1,yf,B.s1,yy+Rr,"teal",1.8));
      o.push(S.T((B.s1+B.s2)/2,yf-8,"測った値 y + n","middle",10,"teal",true));o.push(S.CHIP((B.s1+B.s2)/2,yf+26,_w01_f(ym,3)+" m/s","teal",9.5));
      if(K===0)o.push(S.T(B.kp0-4,yy+52,"K_P = 0: 測った値を使わない（開ループと同じ）","start",9.5,"alias",true));
      bd.set(S.svg(700,yf+52,o));
      /* 時間の図 */
      var nar=_w01_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?332:610,q=[];
      var P1=U.plot(x0,14,pw,130,[0,8],[0,1.4]);
      if(sl.get())q.push(S.RECT(P1.X(4),P1.y,P1.X(8)-P1.X(4),P1.h,0,U.soft("purple"),"none",0));
      q.push(P1.axes({yl:"速度 [m/s]",xt:[0,1,2,3,4,5,6,7,8],yt:[0,0.2,0.4,0.6,0.8,1.0,1.2,1.4],xfmt:function(){return "";},yfmt:function(v){return v.toFixed(1);},ylOff:nar?36:40}));
      q.push(P1.line([[0,1],[8,1]],"muted",1.3,"5 3"));
      if(nz.get())q.push(P1.line(R.t.map(function(tq,i){return [tq,R.ym[i]];}),"teal",0.9));
      q.push(P1.line(R.t.map(function(tq,i){return [tq,R.y[i]];}),"signal",2.2));
      var P2=U.plot(x0,166,pw,80,[0,8],[-2,6]);
      if(sl.get())q.push(S.RECT(P2.X(4),P2.y,P2.X(8)-P2.X(4),P2.h,0,U.soft("purple"),"none",0));
      q.push(P2.axes({xl:"時間 t [s]",yl:"力 [N]",xt:[0,1,2,3,4,5,6,7,8],yt:[-2,0,2,4,6],ylOff:nar?36:40}));
      q.push(_w01_clip(P2,R.t,R.u.map(function(v){return Math.max(-2,Math.min(6,v));}),"gold",1.8,null,S));
      q.push(P2.line(R.t.map(function(tq,i){return [tq,R.d[i]];}),"purple",1.8));
      q.push(S.L(P1.X(t),P1.y,P1.X(t),P2.y+P2.h,"ink",1.2,"3 3"));
      q.push(S.D(P1.X(t),P1.Y(Math.max(0,Math.min(1.4,y))),"signal",4));q.push(S.D(P2.X(t),P2.Y(Math.max(-2,Math.min(6,u))),"gold",4));
      q.push(S.T(P1.X(t)+(t>6.5?-6:6),P1.y+12,"t = "+_w01_f(t,2)+" s",t>6.5?"end":"start",9.5,"ink",true,false,null,true));
      if(Math.max.apply(null,R.u)>6)q.push(S.T(P2.X(0.15),P2.y+11,"動き始めの力は枠の外（最大 "+_w01_f(Math.max.apply(null,R.u),1)+" N）","start",9,"gold",false,false,null,true));
      q.push(S.T(x0,P2.y+P2.h+48,"青: 速度 y　"+(nz.get()?"青緑: 測った値　":"")+"金: 押す力 u　紫: 坂の力 d","start",9.5,"muted"));
      box.set(S.svg(Wd,P2.y+P2.h+56,q));
      /* 読み出し */
      var acc=(u-_W01_C*y-d)/m,ess=(_W01_C*_W01_R-u0+(sl.get()?_w01_dslope(m,3):0))/(_W01_C+K),h="";
      h+="t = "+_w01_f(t,2)+" s: 目標値 r = 1.000 m/s、速度 y = <b>"+_w01_f(y,3)+" m/s</b>、測った値 = "+_w01_f(ym,3)+" m/s、偏差 = r − 測った値 = "+_w01_f(e,3)+" m/s<br>";
      h+="押す力 u = u<sub>0</sub> + K<sub>P</sub> × 偏差 = 2.00 + "+K+" × "+_w01_f(e,3)+" = <b>"+_w01_f(u,2)+" N</b><br>";
      h+="後ろ向きの力: 抵抗 c y = 2 × "+_w01_f(y,3)+" = "+_w01_f(_W01_C*y,2)+" N、坂の力 d = "+_w01_f(d,2)+" N → 力の合計 "+_w01_f(u-_W01_C*y-d,2)+" N、加速度 "+_w01_f(acc,2)+" m/s²"+(Math.abs(acc)<0.02?'（<span class="ok">釣り合っている</span>）':"")+"<br>";
      h+="4 節の定常偏差の式: (c r − u<sub>0</sub> + d) ÷ (c + K<sub>P</sub>) = "+_w01_f(ess,3)+" m/s（"+(sl.get()?"坂の上":"平らな道")+"で落ち着いた後の値）";
      if(nz.get()&&NS)h+="<br>観測ノイズによる揺れ（平らな道を 60 s 走らせたときの標準偏差）: 力 <b>"+_w01_f(NS.su,2)+" N</b>、速度 <b>"+_w01_f(NS.sy,4)+" m/s</b>";
      ro.innerHTML=h+'<div class="wnote">台車は質量 '+m+' kg、抵抗の係数 c = 2 N·s/m、決めた力 u<sub>0</sub> = c r = 2 N。1 ms 刻みで計算した。観測ノイズは 0.01 s ごとに変わる値。</div>';
    }
    sim();
  };

  /* ---- 4 節: 開ループと比例制御の台車が同じ坂道を走る ---- */
  REG.w01_openclosed=function(el,U){
    var S=U.S;
    U.head(el,"OPEN / CLOSED","開ループと比例制御の台車で、同じ坂道を走る");
    var r1=U.ctrls(el);
    var dg=U.slider(r1,"坂の角度",{min:0,max:5,step:0.5,value:3,fmt:function(v){return v+"°";},onInput:sim});
    var ms=U.slider(r1,"荷物",{values:[0,0.5,1,1.5,2],value:0,fmt:function(v){return v+" kg";},onInput:sim});
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0,1,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:sim});
    var r2=U.ctrls(el);
    var nz=U.checkbox(r2,"観測ノイズ（標準偏差 0.02 m/s）",false,sim);
    var br=U.btnrow(el);
    var at=0,tick=U.ticker(function(){at+=0.08;if(at>=tmax){at=tmax;tick.stop();}draw();},40);
    U.button(br,"走らせる",function(){if(at>=tmax)at=0;tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"最初から",function(){tick.stop();at=0;draw();});
    U.button(br,"本文の例（3°・荷物なし・K<sub>P</sub> = 8）",function(){tick.stop();dg.set(3);ms.set(0);kp.set(8);nz.set(false);at=0;sim();});
    var seedBtn=U.button(br,"もう一度（別の乱数で）",function(){seed++;sim();});
    var box=U.svgbox(el),ro=U.readout(el);
    var A=null,B=null,tmax=1,seed=1;
    var X0=3,X1=8,X2=13,XE=16;
    function sgn(p){return (p>=X0&&p<X1)?1:((p>=X1&&p<X2)?-1:0);}
    function sim(){
      var m=1+ms.get(),d0=_w01_dslope(m,dg.get()),f=function(t,p){return sgn(p)*d0;},noise=nz.get()?0.02:0;
      A=_w01_sim(U,{Kp:0,m:m,tEnd:60,rec:0.01,dFn:f,stopAt:XE,noise:0});
      B=_w01_sim(U,{Kp:kp.get(),m:m,tEnd:60,rec:0.01,dFn:f,stopAt:XE,noise:noise,seed:seed});
      tmax=Math.max(A.t[A.t.length-1],B.t[B.t.length-1]);if(at>tmax)at=tmax;
      draw();
    }
    function posAt(R,t){var i=Math.min(R.t.length-1,Math.max(0,Math.round(t/0.01)));return {p:R.p[i],y:R.y[i]};}
    /* 位置 x に着く時刻（前後の記録の間で補間）と、その直前の速度（坂の向きが変わる前の値） */
    function cross(R,x){for(var i=1;i<R.p.length;i++)if(R.p[i]>=x&&R.p[i-1]<x){var f=(x-R.p[i-1])/(R.p[i]-R.p[i-1]);return {t:R.t[i-1]+f*(R.t[i]-R.t[i-1]),y:R.y[i-1]};}return null;}
    function draw(){
      if(!A)return;
      seedBtn.style.display=nz.get()?"":"none";
      var nar=_w01_nar(box),Wd=nar?400:700,x0=nar?50:62,pw=nar?336:612,o=[],deg=dg.get();
      var X=function(p){return x0+p/XE*pw;},sn=Math.sin(deg*Math.PI/180),ex=sn>0?Math.min(30/(5*sn),400):0;
      function z(p){var zz=p<X0?0:(p<X1?(p-X0):(p<X2?(X2-p):0));return zz*sn*ex;}
      /* 2 本の道と台車 */
      [[A,"開ループ（決めた力 2 N のまま）","alias",70],[B,"比例制御（K_P = "+kp.get()+"）","signal",150]].forEach(function(L){
        var R=L[0],base=L[3],pts=[];
        for(var k=0;k<=160;k++){var p=k/10;pts.push([X(p),base-z(p)]);}
        o.push(S.PL(pts.concat([[X(XE),base+8],[X(0),base+8]]),"muted",1.2,"panel"));
        o.push(_w01_tx(U,x0,base-48,L[1],"start",10,L[2],true));
        var s=posAt(R,at),p=Math.max(0,Math.min(XE,s.p)),gx=X(p),gy=base-z(p);
        var ang=-Math.atan2(z(Math.min(XE,p+0.05))-z(Math.max(0,p-0.05)),X(Math.min(XE,p+0.05))-X(Math.max(0,p-0.05)))*180/Math.PI;
        o.push('<g transform="rotate('+ang.toFixed(2)+' '+gx.toFixed(2)+' '+gy.toFixed(2)+')">'+S.RECT(gx-14,gy-20,28,13,3,U.soft(L[2]),L[2],1.5)+S.CIRC(gx-8,gy-4,4,"ink",1.3,"panel")+S.CIRC(gx+8,gy-4,4,"ink",1.3,"panel")+'</g>');
        o.push(S.T(gx,gy-26,_w01_f(s.y,2)+" m/s","middle",9.5,L[2],true,false,null,true));
      });
      o.push(S.T(X((X0+X1)/2),186,"上り坂 "+deg+"°","middle",9.5,"purple",true));o.push(S.T(X((X1+X2)/2),186,"下り坂 "+deg+"°","middle",9.5,"purple",true));
      if(deg>0)o.push(S.T(x0+pw,nar?199:186,"（高さは大きく描いた）","end",9,"muted"));
      o.push(S.T(x0+pw,30,"t = "+_w01_f(at,1)+" s","end",10,"ink",true));
      /* 位置ごとの速度 */
      var ymax=Math.max(1.4,Math.ceil((Math.max(Math.max.apply(null,A.y),Math.max.apply(null,B.y))+0.1)*5)/5),P=U.plot(x0,nar?214:206,pw,170,[0,XE],[0,ymax]);
      o.push(S.RECT(P.X(X0),P.y,P.X(X1)-P.X(X0),P.h,0,U.soft("purple"),"none",0));o.push(S.RECT(P.X(X1),P.y,P.X(X2)-P.X(X1),P.h,0,U.soft("teal"),"none",0));
      o.push(P.axes({xl:"位置 [m]",yl:"速度 [m/s]",xt:[0,2,4,6,8,10,12,14,16],yt:U.nice(0,ymax,5),ylOff:nar?36:40}));
      o.push(P.line([[0,1],[XE,1]],"muted",1.3,"5 3"));
      [[A,"alias"],[B,"signal"]].forEach(function(L){var R=L[0];o.push(P.line(R.p.map(function(p,i){return [Math.min(XE,p),R.y[i]];}),L[1],2));
        var s=posAt(R,at);o.push(S.D(P.X(Math.max(0,Math.min(XE,s.p))),P.Y(Math.max(0,Math.min(ymax,s.y))),L[1],4.2));});
      o.push(S.T(P.X(X0+0.1),P.y+12,"上り坂","start",9.5,"purple",true,false,null,true));o.push(S.T(P.X(X1+0.1),P.y+12,"下り坂","start",9.5,"teal",true,false,null,true));
      o.push(S.T(x0,P.y+P.h+48,"赤: 開ループ　青: 比例制御　破線: 目標値 1 m/s","start",9.5,"muted"));
      box.set(S.svg(Wd,P.y+P.h+56,o));
      /* 読み出し */
      var m=1+ms.get(),d0=_w01_dslope(m,deg),K=kp.get(),h="";
      var a8=cross(A,X1),b8=cross(B,X1),a13=cross(A,X2),b13=cross(B,X2),aE=cross(A,XE),bE=cross(B,XE);
      h+="坂の力 d = "+(1+ms.get())+" kg × 9.81 × sin "+deg+"° = "+_w01_f(d0,2)+" N<br>";
      h+="上り坂の終わる直前（8 m）の速度: 開ループ <b>"+(a8?_w01_f(a8.y,3):"—")+" m/s</b>（式 r − d/c = "+_w01_f(1-d0/_W01_C,3)+"）、比例制御 <b>"+(b8?_w01_f(b8.y,3):"—")+" m/s</b>（式 r − d/(c + K<sub>P</sub>) = "+_w01_f(1-d0/(_W01_C+K),3)+"）<br>";
      h+="下り坂の終わる直前（13 m）の速度: 開ループ "+(a13?_w01_f(a13.y,3):"—")+" m/s、比例制御 "+(b13?_w01_f(b13.y,3):"—")+" m/s<br>";
      h+="16 m に着く時刻: 開ループ "+(aE?_w01_f(aE.t,1)+" s":"60 s で着かない")+"、比例制御 "+(bE?_w01_f(bE.t,1)+" s":"60 s で着かない")+(aE&&bE?"（差 "+_w01_f(aE.t-bE.t,1)+" s）":"");
      ro.innerHTML=h+'<div class="wnote">台車は質量 1 kg（＋荷物）、抵抗の係数 2 N·s/m。どちらも決めた力 2 N を出し、比例制御はそれに K<sub>P</sub> × 偏差を足す。坂の上の式の値は、坂が十分に長く、速度が落ち着いたときの値。「走らせる」は実際の 2 倍の速さで動く。</div>';
    }
    sim();
  };

  /* ---- 5 節: 比例ゲインとむだ時間の地図 ↔ 速度の動き ---- */
  function _w01_bounds(L,T,K){
    if(L<=0)return [Infinity,Infinity];
    var lo=1e-9,hi=Math.PI/L;for(var i=0;i<100;i++){var mid=(lo+hi)/2;if(Math.atan(mid*T)+mid*L>Math.PI)hi=mid;else lo=mid;}
    var w=(lo+hi)/2;return [(T/L)*Math.exp(-(1+L/T))/K,Math.sqrt(1+(w*T)*(w*T))/K];
  }
  REG.w01_gain=function(el,U){
    var S=U.S;
    U.head(el,"GAIN × DELAY","比例ゲインとむだ時間の組と、台車の速度の動き");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{min:0.5,max:60,log:true,value:8,fmt:function(v){return U.sig(v,3)+" N/(m/s)";},onInput:draw});
    var ld=U.slider(r1,"むだ時間 L",{min:0,max:0.3,step:0.005,value:0.1,fmt:function(v){return _w01_f(v,3)+" s";},onInput:draw});
    var r2=U.ctrls(el);
    var lo=U.checkbox(r2,"荷物 1 kg（質量 2 kg）",false,draw);
    var ff=U.checkbox(r2,"決めた力 u<sub>0</sub> = 2 N を足す",true,draw);
    var br=U.btnrow(el);
    [2,8,14,20].forEach(function(k){U.button(br,"K<sub>P</sub> = "+k+"（L = 0.1 s）",function(){kp.set(k);ld.set(0.1);lo.set(false);ff.set(true);draw();});});
    U.button(br,"遅れなし（K<sub>P</sub> = 20）",function(){kp.set(20);ld.set(0);lo.set(false);ff.set(true);draw();});
    var box=U.svgbox(el),ro=U.readout(el),MP=null;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!MP)return;
      if(type==="down"&&!(x>=MP.x-6&&x<=MP.x+MP.w+6&&y>=MP.y-6&&y<=MP.y+MP.h+6))return false;
      var L=Math.max(0,Math.min(0.3,MP.ux(x))),K=Math.max(0.5,Math.min(60,MP.uy(y)));
      ld.set(Math.round(L/0.005)*0.005);kp.set(+K.toPrecision(3));draw();
    });
    function draw(){
      var K=kp.get(),L=ld.get(),m=lo.get()?2:1,T=m/_W01_C,Kg=1/_W01_C,uff=ff.get(),bb=_w01_bounds(L,T,Kg);
      var nar=_w01_nar(box),Wd=nar?400:700,o=[];
      /* 地図 */
      var mx=nar?56:56,mw=nar?320:230,mh=nar?190:236,P=U.plot(mx,16,mw,mh,[0,0.3],[0.5,60],{ylog:true});MP=P;
      var lo1=[],hi1=[];for(var i=1;i<=100;i++){var Lq=0.003*i,b=_w01_bounds(Lq,T,Kg);lo1.push([P.X(Lq),P.Y(Math.max(0.5,Math.min(60,b[0])))]);hi1.push([P.X(Lq),P.Y(Math.max(0.5,Math.min(60,b[1])))]);}
      o.push(S.PL([[P.X(0),P.Y(0.5)],[P.X(0),P.Y(60)]].concat(lo1).concat([[P.X(0.3),P.Y(0.5)]]),"none",0,"green",null,0.13));
      o.push(S.PL(lo1.concat(hi1.slice().reverse()),"none",0,"gold",null,0.15));
      o.push(S.PL(hi1.concat([[P.X(0.3),P.Y(60)]]),"none",0,"alias",null,0.13));
      o.push(P.axes({xl:"むだ時間 L [s]",yl:"比例ゲイン [N/(m/s)]",xt:[0,0.1,0.2,0.3],yt:[0.5,1,2,5,10,20,50],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:40}));
      o.push(S.PL(lo1,"green",1.8));o.push(S.PL(hi1,"alias",1.8));
      o.push(S.T(P.X(0.2),P.Y(0.75),"振動しない","middle",9.5,"green",true,false,null,true));
      o.push(S.T(P.X(0.21),P.Y(3.2),"振動して収まる","middle",9.5,"gold",true,false,null,true));
      o.push(S.T(P.X(0.19),P.Y(35),"大きくなり続ける","middle",9.5,"alias",true,false,null,true));
      o.push(S.CIRC(P.X(L),P.Y(K),7,"ink",2,"screen"));o.push(S.D(P.X(L),P.Y(K),"signal",4));
      o.push(S.T(P.x+P.w,P.y+P.h+44,"点をドラッグして変えられる","end",9,"muted"));
      /* 速度と力 */
      var rx=nar?56:340,rw=nar?320:340,ry=nar?mh+76:16;
      var R=_w01_sim(U,{Kp:K,L:L,m:m,tEnd:6,rec:0.004,uff:uff,dFn:function(t){return t>=3-1e-9?_w01_dslope(m,3):0;}});
      var P1=U.plot(rx,ry,rw,150,[0,6],[0,2]);
      o.push(S.RECT(P1.X(3),P1.y,P1.X(6)-P1.X(3),P1.h,0,U.soft("purple"),"none",0));
      o.push(P1.axes({yl:"速度 [m/s]",xt:[0,1,2,3,4,5,6],yt:[0,0.5,1,1.5,2],xfmt:function(){return "";},yfmt:function(v){return v.toFixed(1);},ylOff:40}));
      o.push(P1.line([[0,1],[6,1]],"muted",1.3,"5 3"));
      o.push(_w01_clip(P1,R.t,R.ym,"teal",1.2,"5 3",S));
      o.push(_w01_clip(P1,R.t,R.y,"signal",2.2,null,S));
      o.push(S.T(P1.X(4.5),P1.y+12,"上り坂 3°","middle",9.5,"purple",true,false,null,true));
      var P2=U.plot(rx,ry+168,rw,72,[0,6],[-15,25]);
      o.push(P2.axes({xl:"時間 t [s]",yl:"力 [N]",xt:[0,1,2,3,4,5,6],yt:[-10,0,10,20],ylOff:40}));
      o.push(P2.line([[0,0],[6,0]],"faint",1));
      o.push(_w01_clip(P2,R.t,R.u,"gold",1.6,null,S));
      o.push(S.T(rx,P2.y+P2.h+48,"青: 速度　青緑の破線: 届く値　金: 力","start",9.5,"muted"));
      box.set(S.svg(Wd,P2.y+P2.h+56,o));
      /* 読み出し */
      var i3=Math.round(3/0.004),pk=-Infinity,peaks=[],i95=-1,grow=false;
      for(var i2=0;i2<i3&&i2<R.y.length;i2++){if(R.y[i2]>pk)pk=R.y[i2];if(i95<0&&R.y[i2]>=0.95)i95=i2;
        if(i2>0&&i2<R.y.length-1&&R.y[i2]>R.y[i2-1]&&R.y[i2]>=R.y[i2+1]&&R.y[i2]>1.0005)peaks.push(R.y[i2]-1);}
      var n=R.y.length,last=R.y[n-1],tail=R.y.slice(Math.max(0,n-250)),amp=Math.max.apply(null,tail)-Math.min.apply(null,tail);
      if(R.t[n-1]<5.99||Math.abs(last)>50)grow=true;
      var cls=K<bb[0]?'<span class="ok">振動しない</span>':(K<bb[1]?"振動して収まる":'<span class="warn">振れが大きくなり続ける（不安定）</span>');
      var d3=_w01_dslope(m,3),ess=(_W01_C*_W01_R-(uff?_W01_C*_W01_R:0)+d3)/(_W01_C+K),h="";
      h+="この組は "+cls+"。このむだ時間での境目: 振動し始める "+(isFinite(bb[0])?_w01_f(bb[0],1):"なし")+"、大きくなり始める "+(isFinite(bb[1])?_w01_f(bb[1],1):"なし")+" N/(m/s)<br>";
      h+="坂に入るまで（0〜3 s）: 最大の速度 "+(pk>50?"枠の外":_w01_f(pk,2)+" m/s")+(i95>=0?"、1 m/s の 95 % に初めて届く時刻 "+_w01_f(i95*0.004,2)+" s":"")+"<br>";
      if(peaks.length>=2&&!grow)h+="目標値を越えた分の比（次の山 ÷ 前の山）: "+_w01_f(peaks[1]/peaks[0],2)+" 倍<br>";
      h+="坂の上の速度（6 s）: "+(grow?'<span class="warn">落ち着かない</span>':"<b>"+_w01_f(last,3)+" m/s</b>"+(amp>0.01?"（まだ振れている）":""))+"、4 節の式 r − (c r − u<sub>0</sub> + d) ÷ (c + K<sub>P</sub>) = "+_w01_f(1-ess,3)+" m/s<br>";
      h+="動き始めの力: "+_w01_f(R.u[0],1)+" N";
      ro.innerHTML=h+'<div class="wnote">台車（質量 '+m+' kg、抵抗の係数 2 N·s/m）を止まった状態から 1 m/s で走らせ、3 s に上り坂 3° に入る。測った速度は L だけ遅れて制御器に届く。1 ms 刻みで計算した。地図の境目は、同じ台車で求めた値（9 章 6 節）。</div>';
    }
    draw();
  };

  /* ---- 5 節: シャワーの湯温を手で合わせる ---- */
  REG.w01_hand=function(el,U){
    var S=U.S,TC=15,TH0=60,TGT=40,DT=0.01,TEND=40,TAU=0.5;
    U.head(el,"SHOWER","シャワーの湯温を 39〜41 °C に合わせる（あなたが制御器）");
    var br=U.btnrow(el);br.style.marginTop="0";
    U.button(br,"始める",function(){reset();running=true;tick.start();});
    U.button(br,"止める",function(){running=false;tick.stop();draw();});
    U.button(br,"最初から",function(){reset();});
    U.button(br,"本文の例（遅れ 2 s・手で回す）",function(){md.set(0);dl.set(2);kp.set(2);dist.set(false);knob.set(20);reset();});
    var sbox=U.svgbox(el);
    var r0=U.ctrls(el);
    var knob=U.slider(r0,"つまみ（お湯の割合）。湯温を見ながら動かす",{min:0,max:100,step:1,value:20,fmt:function(v){return Math.round(v)+" %";},onInput:function(){if(!running)draw();}});
    knob.el.style.flex="1 1 100%";
    var box=U.svgbox(el);
    var r1=U.ctrls(el);
    var md=U.select(r1,"回す人",["手で回す（つまみを動かす）","自動（比例制御）"],0,function(){draw();});
    var dl=U.slider(r1,"ホースの遅れ",{values:[0,1,2,3],value:2,fmt:function(v){return v+" s";},onInput:function(){reset();}});
    var kp=U.slider(r1,"自動の比例ゲイン",{values:[0.5,1,1.5,2,2.5,3,4],value:2,fmt:function(v){return v+" %/°C";},onInput:draw});
    var r2=U.ctrls(el);
    var dist=U.checkbox(r2,"20 s に給湯の温度が 50 °C に下がる",false,draw);
    var ro=U.readout(el);
    var t,th,hmix,histT,histM,histK,running=false,inStart,doneAt,reached,leaves,inside,tmaxAfter,tminAfter;
    var tick=U.ticker(function(){for(var i=0;i<5;i++)step();if(t>=TEND-1e-9){running=false;tick.stop();}draw();},50);
    function thot(tt){return (dist.get()&&tt>=20)?50:TH0;}
    function mixT(k,tt){return TC+k/100*(thot(tt)-TC);}
    function reset(){tick.stop();running=false;t=0;knob.set(20);var k=20;th=mixT(k,0);hmix=[];var nd=Math.round(dl.get()/DT);for(var i=0;i<=nd;i++)hmix.push(th);
      histT=[[0,th]];histM=[[0,th]];histK=[[0,k]];inStart=null;doneAt=null;reached=null;leaves=0;inside=false;tmaxAfter=-Infinity;tminAfter=Infinity;draw();}
    function step(){
      if(t>=TEND-1e-9)return;
      var k=knob.get();
      if(md.get()===1){var k0=(TGT-TC)/(TH0-TC)*100;k=Math.max(0,Math.min(100,k0+kp.get()*(TGT-th)));knob.set(Math.round(k*10)/10);}
      var mx=mixT(k,t);hmix.push(mx);var dIn=hmix.shift();
      th+=(dIn-th)*(1-Math.exp(-DT/TAU));t+=DT;
      var ok=th>=39&&th<=41;
      if(ok&&!inside){inside=true;inStart=t;if(reached===null)reached=t;}
      if(!ok&&inside){inside=false;inStart=null;leaves++;}
      if(reached!==null){tmaxAfter=Math.max(tmaxAfter,th);tminAfter=Math.min(tminAfter,th);}
      if(inside&&doneAt===null&&t-inStart>=5-1e-9)doneAt=t;
      if(Math.round(t/DT)%5===0){histT.push([t,th]);histM.push([t,mx]);histK.push([t,k]);}
    }
    function wcol(v){return v<37?"signal":(v<39?"teal":(v<=41?"green":(v<=43?"gold":"alias")));}
    function draw(){
      kp.el.style.display=md.get()===1?"":"none";
      var nar=_w01_nar(box),Wd=nar?400:700,o=[],k=knob.get(),mxNow=mixT(k,t);
      /* 絵: つまみ・ホース・シャワーの口・温度計 */
      var vx=nar?42:70,vy=130,hx=nar?236:300,hy=30;
      o.push(S.RECT(vx-30,vy-26,60,52,8,"panel","line",1.4));
      o.push(S.CIRC(vx,vy,20,"ink",1.6,"screen"));
      var ang=(-135+270*k/100)*Math.PI/180;o.push(S.L(vx,vy,vx+17*Math.sin(ang),vy-17*Math.cos(ang),"gold",3));
      o.push(S.T(vx-24,vy+40,"水","middle",9.5,"signal",true));o.push(S.T(vx+24,vy+40,"湯","middle",9.5,"alias",true));
      o.push(S.T(vx-26,vy-34,"つまみ "+Math.round(k)+" %","start",10,"gold",true));
      /* ホース: 弁からシャワーの口まで。位置 f のところには、f × 遅れ だけ前に混ぜたお湯がある */
      var path=[[vx+30,vy],[hx-90,vy],[hx-50,vy-24],[hx-28,vy-70],[hx-8,hy+4]],tot=0,i;
      for(i=1;i<path.length;i++)tot+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
      var N=24,nd=hmix.length-1;
      function ptAt(s2){var acc=0;for(var j=1;j<path.length;j++){var L=Math.hypot(path[j][0]-path[j-1][0],path[j][1]-path[j-1][1]);if(acc+L>=s2||j===path.length-1){var f=L>0?(s2-acc)/L:0;f=Math.max(0,Math.min(1,f));return [path[j-1][0]+f*(path[j][0]-path[j-1][0]),path[j-1][1]+f*(path[j][1]-path[j-1][1])];}acc+=L;}}
      o.push(S.PL(path,"line",9));
      for(i=0;i<N;i++){var fm=(i+0.5)/N,idx=Math.max(0,Math.min(nd,Math.round(nd*(1-fm)))),v=nd>0?hmix[idx]:mxNow;
        var a=ptAt(i/N*tot),b=ptAt((i+1)/N*tot);o.push(S.L(a[0],a[1],b[0],b[1],wcol(v),6));}
      o.push(S.RECT(hx-26,hy-8,40,14,5,"panel","ink",1.4));
      for(i=0;i<5;i++){var dx=hx-20+i*7;o.push(S.L(dx,hy+12,dx-4+i*2,hy+64,wcol(th),2,"3 5"));}
      o.push(S.T(hx-26,hy+84,"出てくる湯 "+_w01_f(th,1)+" °C","start",10,wcol(th),true,false,null,true));
      if(dl.get()>0)o.push(S.T(vx+34,vy+20,"ホースの中: "+dl.get()+" s 前までに混ぜたお湯","start",9,"muted"));
      /* 温度計 */
      var gx=nar?346:420,gt=22,gb=150,G=function(v){return gb-(Math.max(10,Math.min(60,v))-10)/50*(gb-gt);};
      o.push(S.RECT(gx-7,gt-4,14,gb-gt+8,7,"screen","line",1.2));
      o.push(S.RECT(gx-9,G(41),18,G(39)-G(41),2,U.soft("green"),"green",1));
      o.push(S.RECT(gx-4,G(th),8,gb-G(th),3,wcol(th),"none",0));
      [10,20,30,40,50,60].forEach(function(v){o.push(S.L(gx+9,G(v),gx+14,G(v),"muted",1));o.push(S.T(gx+17,G(v)+3.5,String(v),"start",9,"muted"));});
      o.push(S.T(gx,gb+18,"°C","middle",9,"muted"));
      if(!nar){o.push(S.T(476,46,_w01_f(th,1)+" °C","start",24,wcol(th),true));
        o.push(S.T(476,70,th>41?"熱い":(th<39?"ぬるい・冷たい":"ちょうどよい（39〜41 °C）"),"start",11,wcol(th),true));
        o.push(S.T(476,96,"弁で混ぜたお湯: "+_w01_f(mxNow,1)+" °C","start",10,"gold",true));
        o.push(S.T(476,116,"時刻 "+_w01_f(t,1)+" s / "+TEND+" s","start",10,"ink"));
        if(doneAt!==null)o.push(S.T(476,140,"合わせられた（"+_w01_f(doneAt,1)+" s）","start",11,"green",true));}
      else{o.push(S.T(8,16,_w01_f(th,1)+" °C","start",16,wcol(th),true));o.push(S.T(8,32,"時刻 "+_w01_f(t,1)+" s","start",9.5,"ink"));}
      sbox.set(S.svg(Wd,182,o));
      /* 時間の図 */
      var q=[],x0=nar?44:62,pw=nar?342:612,P=U.plot(x0,12,pw,150,[0,TEND],[10,60]);
      q.push(S.RECT(P.x,P.Y(41),P.w,P.Y(39)-P.Y(41),0,U.soft("green"),"none",0));
      q.push(P.axes({xl:"時間 [s]",yl:"温度 [°C]",xt:[0,5,10,15,20,25,30,35,40],yt:[10,20,30,40,50,60],ylOff:nar?32:40}));
      if(dist.get())q.push(S.L(P.X(20),P.y,P.X(20),P.y+P.h,"purple",1,"3 3"));
      if(histM.length>1)q.push(P.line(histM,"gold",1.4,"5 3"));
      if(histT.length>1)q.push(P.line(histT,"signal",2.2));
      q.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"ink",1,"3 3"));
      q.push(S.T(x0,P.y+P.h+48,"青: 出てくる湯の温度　金の破線: 弁で混ぜたお湯の温度　緑の帯: 39〜41 °C","start",9.5,"muted"));
      box.set(S.svg(Wd,P.y+P.h+56,q));
      var h="";
      if(nar)h+="湯温 <b>"+_w01_f(th,1)+" °C</b>、弁で混ぜたお湯 "+_w01_f(mxNow,1)+" °C、時刻 "+_w01_f(t,1)+" s<br>";
      if(doneAt!==null)h+='<span class="ok">39〜41 °C に入って 5 s 保てた: '+_w01_f(doneAt,1)+" s</span><br>";
      else if(t>=TEND-1e-9)h+='<span class="warn">40 s の間に、39〜41 °C で 5 s 保てなかった</span><br>';
      else h+=(running?"動いている。":"「始める」を押す。")+"39〜41 °C に入れて 5 s 保つ<br>";
      if(reached!==null)h+="はじめて 39 °C 以上 41 °C 以下に入った時刻 "+_w01_f(reached,1)+" s。その後の最高 "+_w01_f(tmaxAfter,1)+" °C・最低 "+_w01_f(tminAfter,1)+" °C、帯から出た回数 "+leaves+" 回<br>";
      if(md.get()===1){var k0=(TGT-TC)/(TH0-TC)*100;h+="自動: つまみ = "+_w01_f(k0,1)+" % + "+kp.get()+" %/°C × (40 °C − 湯温)（0〜100 % に収める）<br>";}
      ro.innerHTML=h+'<div class="wnote">水 15 °C・湯 60 °C を、つまみの割合で混ぜる。混ぜたお湯は、ホースの遅れだけ後にシャワーの口から出て、さらに 0.5 s ほどかけて温度がなじむとした。値はどれも例の値。</div>';
    }
    reset();
  };
