  /* ===== 04 章 二次遅れの応答 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w04_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w04_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w04_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace(/^-/,"−");}
  /* 有効数字 d 桁（末尾の 0 を残す。例 4.90、0.300） */
  function _w04_p3(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace(/^-/,"−");}
  /* 文字の幅（結合文字は 0、ギリシャ文字と記号は半角程度） */
  function _w04_tw(s,sz){var w=0;s=String(s);for(var i=0;i<s.length;i++){var o=s.charCodeAt(i);
    if(o>=0x300&&o<=0x36F)continue;if(o<128)w+=sz*0.56;else if(o>=0x370&&o<=0x3FF)w+=sz*0.6;
    else if(o===0xB2||o===0xB3||o===0xB9||(o>=0x2070&&o<=0x209F))w+=sz*0.4;
    else if(o===0x2212||o===0xB1||o===0xD7||o===0x221A||o===0x2248||o===0x2264||o===0x2265||o===0xB7||o===0xB0)w+=sz*0.62;
    else if(o>=0x1E00&&o<=0x1EFF)w+=sz*0.56;else w+=sz;}return w;}
  /* 式の文字。parts=[[文字, 添字, 斜体か, 色, 上付き, 上の点の数], ...] */
  function _w04_m(U,x,y,parts,a,sz,c,b,halo){
    var w=0;parts.forEach(function(p){w+=_w04_tw(p[0],sz)+(p[1]?_w04_tw(p[1],sz*0.72):0)+(p[4]?_w04_tw(p[4],sz*0.72):0);});
    var x0=x-(a==="middle"?w/2:(a==="end"?w:0)),ss=Math.round(sz*72)/100,cur=0,xx=x0,dots=[];
    var o='<text x="'+(Math.round(x0*100)/100)+'" y="'+(Math.round(y*100)/100)+'" text-anchor="start" font-size="'+sz+'" fill="'+U.col(c||"ink")+
      '" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+(halo?' stroke="var(--screen)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"':'')+'>';
    parts.forEach(function(p){var cc=p[3]?' fill="'+U.col(p[3])+'"':'',wb=_w04_tw(p[0],sz);
      o+='<tspan font-style="'+(p[2]?"italic":"normal")+'"'+cc+(cur?' dy="'+(-cur)+'"':'')+'>'+U.esc(p[0])+'</tspan>';cur=0;
      if(p[5]){for(var k=0;k<p[5];k++)dots.push([xx+wb/2+(k-(p[5]-1)/2)*sz*0.26,y-sz*0.86,p[3]||c||"ink"]);}
      xx+=wb;
      if(p[1]){o+='<tspan dy="3" font-size="'+ss+'"'+cc+'>'+U.esc(p[1])+'</tspan>';cur=3;xx+=_w04_tw(p[1],sz*0.72);}
      if(p[4]){o+='<tspan dy="'+(-5-cur)+'" font-size="'+ss+'"'+cc+'>'+U.esc(p[4])+'</tspan>';cur=-5;xx+=_w04_tw(p[4],sz*0.72);}});
    o+='</text>';
    dots.forEach(function(d){o+='<circle cx="'+(Math.round(d[0]*100)/100)+'" cy="'+(Math.round(d[1]*100)/100)+'" r="'+Math.max(1,sz*0.085).toFixed(2)+'" fill="'+U.col(d[2])+'"/>';});
    return o;
  }
  /* グラフの範囲の外に出る所で切った折れ線（点は値の組 [x, y]） */
  function _w04_cl(P,pts,c,lw,dash){
    var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),segs=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1],ins=isFinite(b)&&b>=lo&&b<=hi;
      if(prev){var pa=prev[0],pb=prev[1],pin=isFinite(pb)&&pb>=lo&&pb<=hi;
        if(ins&&!pin&&isFinite(pb)){var l1=pb>hi?hi:lo;cur=[[pa+(a-pa)*(l1-pb)/(b-pb),l1]];}
        else if(pin&&!ins){if(isFinite(b)){var l2=b>hi?hi:lo;cur.push([pa+(a-pa)*(l2-pb)/(b-pb),l2]);}segs.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=q;});
    if(cur.length)segs.push(cur);
    return segs.filter(function(s){return s.length>=2;}).map(function(s){return P.line(s,c,lw,dash);}).join("");
  }
  /* x と y の両方を範囲で切る折れ線（位相平面用。範囲の外の点で線を切る） */
  function _w04_cl2(S,P,xs,ys,c,lw,dash){var segs=[],cur=[],x0=Math.min(P.xr[0],P.xr[1]),x1=Math.max(P.xr[0],P.xr[1]),y0=Math.min(P.yr[0],P.yr[1]),y1=Math.max(P.yr[0],P.yr[1]);
    for(var i=0;i<xs.length;i++){var a=xs[i],b=ys[i];if(a>=x0&&a<=x1&&b>=y0&&b<=y1)cur.push([P.X(a),P.Y(b)]);else if(cur.length){segs.push(cur);cur=[];}}
    if(cur.length)segs.push(cur);return segs.filter(function(s){return s.length>=2;}).map(function(s){return S.PL(s,c,lw,null,dash);}).join("");}
  function _w04_ticks(U,lo,hi,n){return U.nice(lo,hi,n||5).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;});}

  /* ---- 二次遅れの解（本文 2・3 節の式） ---- */
  /* 入力の無い標準形の解 [y, ẏ]（初期値 y0・v0） */
  function _w04_free(z,wn,t,y0,v0){
    if(z<1-1e-12){var s=z*wn,wd=wn*Math.sqrt(1-z*z),C=(v0+s*y0)/wd,e=Math.exp(-s*t),cs=Math.cos(wd*t),sn=Math.sin(wd*t);
      return [e*(y0*cs+C*sn),e*((-s*y0+wd*C)*cs+(-s*C-wd*y0)*sn)];}
    if(Math.abs(z-1)<=1e-12){var B=v0+wn*y0,e1=Math.exp(-wn*t);return [(y0+B*t)*e1,(B-wn*(y0+B*t))*e1];}
    var r=Math.sqrt(z*z-1),l1=-wn*(z-r),l2=-wn*(z+r),A=(v0-l2*y0)/(l1-l2),B2=(l1*y0-v0)/(l1-l2);
    return [A*Math.exp(l1*t)+B2*Math.exp(l2*t),A*l1*Math.exp(l1*t)+B2*l2*Math.exp(l2*t)];
  }
  /* 単位ステップ応答（最終値 K）: 最終値からのずれは、自由な動き（初期値 −K）と同じ */
  function _w04_stepf(z,wn,t,K){var f=_w04_free(z,wn,t,-K,0);return [K+f[0],f[1]];}
  function _w04_bis(f,a,b,n){var fa=f(a);for(var i=0;i<(n||60);i++){var m=0.5*(a+b),fm=f(m);if((fa<0)===(fm<0)){a=m;fa=fm;}else b=m;}return 0.5*(a+b);}
  /* 正規化した（ω_n = 1、最終値 1）ステップ応答の指標。式と二分法で求める。{tr, tp, Mp（割合）, t2} */
  function _w04_index(z){
    var yv=function(t){return _w04_stepf(z,1,t,1)[0];};
    if(z<1){var wd=Math.sqrt(1-z*z),tp=Math.PI/wd,Mp=Math.exp(-Math.PI*z/wd);
      var tr=_w04_bis(function(t){return yv(t)-0.9;},0,tp)-_w04_bis(function(t){return yv(t)-0.1;},0,tp),t2;
      if(z<=0)return {tr:tr,tp:tp,Mp:1,t2:Infinity};
      if(Mp>0.02){var n=Math.ceil(Math.log(0.02)/Math.log(Mp))-1,ta=n*Math.PI/wd,sg=(n%2===1)?1:-1,tz=_w04_bis(function(t){return yv(t)-1;},ta,ta+Math.PI/wd);
        t2=_w04_bis(function(t){return sg*(yv(t)-1)-0.02;},ta,tz);}
      else t2=_w04_bis(function(t){return yv(t)-0.98;},0,tp);
      return {tr:tr,tp:tp,Mp:Mp,t2:t2};}
    var hi=60*z;
    return {tr:_w04_bis(function(t){return yv(t)-0.9;},0,hi)-_w04_bis(function(t){return yv(t)-0.1;},0,hi),tp:null,Mp:0,t2:_w04_bis(function(t){return yv(t)-0.98;},0,hi)};
  }
  /* 特性根（複素数の組） */
  function _w04_roots(z,wn){if(z<1){var wd=wn*Math.sqrt(1-z*z);return [{re:-z*wn,im:wd},{re:-z*wn,im:-wd}];}
    var r=Math.sqrt(z*z-1);return [{re:-wn*(z-r),im:0},{re:-wn*(z+r),im:0}];}
  function _w04_rootTxt(z,wn){if(z<=0)return "±<i>j</i>"+_w04_p3(wn);
    if(z<1)return _w04_p3(-z*wn)+" ± <i>j</i>"+_w04_p3(wn*Math.sqrt(1-z*z));
    if(Math.abs(z-1)<1e-12)return _w04_p3(-wn)+"（重根）";
    var r=Math.sqrt(z*z-1);return _w04_p3(-wn*(z-r))+" と "+_w04_p3(-wn*(z+r));}
  /* 刻み dt ごとの応答 Yf（最終値 K）から指標を読む。10 %・90 %・±2 % の横切りは線形補間、山は放物線で補間する */
  function _w04_stats(Yf,dt,K){
    var n=Yf.length-1,t10=null,t90=null,im=0,lastOut=-1;
    for(var i=0;i<=n;i++){var y=Yf[i];
      if(t10===null&&y>=0.1*K)t10=i?(i-1+(0.1*K-Yf[i-1])/(y-Yf[i-1]))*dt:0;
      if(t90===null&&y>=0.9*K)t90=(i-1+(0.9*K-Yf[i-1])/(y-Yf[i-1]))*dt;
      if(y>Yf[im])im=i;
      if(Math.abs(y-K)>0.02*Math.abs(K))lastOut=i;}
    var tp=im*dt,ym=Yf[im];
    if(im>0&&im<n){var a=Yf[im-1],b=Yf[im],c=Yf[im+1],den=a-2*b+c;if(den<0){var d=0.5*(a-c)/den;tp=(im+d)*dt;ym=b-0.25*(a-c)*d;}}
    var t2;if(lastOut<0)t2=0;else if(lastOut>=n)t2=Infinity;
    else{var y0=Yf[lastOut]-K,y1=Yf[lastOut+1]-K,lev=y0>0?0.02*K:-0.02*K;t2=(lastOut+(lev-y0)/(y1-y0))*dt;}
    return {tr:(t10!==null&&t90!==null)?t90-t10:null,tp:tp,Mp:(ym-K)/K,t2:t2,ymax:ym};
  }
  /* 刻み dt の RK4 で単位ステップ応答（最終値 K）を求め、指標を読む。返り値 {T, Y, V（ev ごと）, tr, tp, Mp, t2, ymax} */
  function _w04_simStep(U,z,wn,K,tEnd,dt,ev){
    var f=function(t,x){return [x[1],wn*wn*K-2*z*wn*x[1]-wn*wn*x[0]];},n=Math.round(tEnd/dt),x=[0,0],T=[],Y=[],V=[],Yf=new Float64Array(n+1);
    for(var i=0;i<=n;i++){var t=i*dt;Yf[i]=x[0];
      if(i%ev===0){T.push(t);Y.push(x[0]);V.push(x[1]);}
      x=U.ctl.rk4(f,t,x,dt);}
    var st=_w04_stats(Yf,dt,K);st.T=T;st.Y=Y;st.V=V;return st;
  }
  /* 横向きのばね・ダンパ・壁・床・台車（2 章と同じ見た目） */
  function _w04_spring(S,x1,x2,y,n,amp,c,lw){var lead=Math.min(10,(x2-x1)*0.15),xs=x1+lead,xe=x2-lead,pts=[[x1,y],[xs,y]];
    for(var i=0;i<2*n;i++)pts.push([xs+(xe-xs)*(i+0.5)/(2*n),y+(i%2===0?amp:-amp)]);pts.push([xe,y]);pts.push([x2,y]);return S.PL(pts,c,lw);}
  function _w04_damper(S,x1,x2,y,c,lw){var cy0=x1+12,cyl=Math.max(30,Math.min(46,(x2-x1)*0.5)),px=Math.max(cy0+6,Math.min(cy0+cyl-4,x2-14));
    return S.L(x1,y,cy0,y,c,lw)+S.L(cy0,y-8,cy0+cyl,y-8,c,lw)+S.L(cy0,y+8,cy0+cyl,y+8,c,lw)+S.L(cy0,y-8,cy0,y+8,c,lw)+
      S.L(px,y-6,px,y+6,c,lw+0.8)+S.L(px,y,x2,y,c,lw);}
  function _w04_wall(S,x,y0,y1){var o=S.L(x,y0,x,y1,"muted",1.8);for(var yy=y0+4;yy<y1;yy+=9)o+=S.L(x,yy,x-7,yy+7,"muted",1);return o;}
  function _w04_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  function _w04_cart(S,U,x,y,w,h,c){return S.RECT(x,y,w,h,4,U.soft(c),c,1.5)+S.CIRC(x+w*0.25,y+h+4,4,c,1.4,"var(--screen)")+S.CIRC(x+w*0.75,y+h+4,4,c,1.4,"var(--screen)");}
  /* 根の平面（実部・虚部の目盛つき）。P は U.plot */
  function _w04_rplane(U,S,P,xt,yt){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+P.axes({xl:"実部",yl:"虚部",xt:xt,yt:yt,xfmt:function(v){return _w04_sig(v,3);},yfmt:function(v){return _w04_sig(v,3);},ylOff:34})+U.ctl.splane(P);}
  /* 根の平面の上のドラッグ（上の根の位置 → ζ・ω_n）。zr=[ζ の下限, 上限]、wr=[ω_n の下限, 上限] */
  function _w04_dragRoot(U,box,getP,zr,wr,set){
    U.ctl.drag(box,function(type,x,y){var P=getP();if(type==="up"||x==null||!P)return;
      if(type==="down"&&!(x>=P.x-8&&x<=P.x+P.w+8&&y>=P.y-8&&y<=P.y+P.h+8))return false;
      var re=Math.min(0,P.ux(x)),im=Math.abs(P.uy(y)),wn=Math.sqrt(re*re+im*im);
      wn=Math.max(wr[0],Math.min(wr[1],wn));var z=wn>0?Math.max(zr[0],Math.min(zr[1],-re/Math.max(1e-9,Math.sqrt(re*re+im*im)))):zr[0];
      set(Math.round(z*100)/100,+wn.toPrecision(3));});
  }

  /* ---- 3 節: 減衰比と固有角周波数 — 特性根・台車の絵・ステップ応答 ---- */
  REG.w04_zeta=function(el,U){
    var S=U.S;
    U.head(el,"DAMPING RATIO","減衰比と固有角周波数 — 特性根・台車の動く絵・ステップ応答");
    var r1=U.ctrls(el);
    var sz=U.slider(r1,"減衰比 ζ",{min:0,max:3,step:0.01,value:0.2,fmt:function(v){return _w04_f(v,2);},onInput:function(){run();}});
    var sw=U.slider(r1,"固有角周波数 ω<sub>n</sub>",{min:1,max:20,log:true,value:5,fmt:function(v){return _w04_sig(v,3)+" rad/s";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var st=U.slider(r2,"時刻 <i>t</i>（台車の絵）",{min:0,max:6,step:0.01,value:0.64,fmt:function(v){return _w04_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.04;if(t>=6){t=6;tk.stop();}st.set(t);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=5.99)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(z,w){tk.stop();sz.set(z);sw.set(w);st.set(0.64);run();}
    U.button(br,"本文の例（ζ 0.2・ω<sub>n</sub> 5 rad/s）",function(){pre(0.2,5);});
    U.button(br,"ダンパを外す（ζ = 0）",function(){pre(0,5);});
    U.button(br,"ζ = 0.7",function(){pre(0.7,5);});
    U.button(br,"臨界減衰（ζ = 1）",function(){pre(1,5);});
    U.button(br,"過減衰（ζ = 2）",function(){pre(2,5);});
    var br2=U.btnrow(el);
    U.button(br2,"この曲線を残して比べる",function(){if(R){refs.push({T:R.T,P:R.P,z:R.z,wn:R.wn});if(refs.length>4)refs.shift();draw();}});
    U.button(br2,"残した曲線を消す",function(){refs=[];draw();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,refs=[],RP=null;
    _w04_dragRoot(U,box,function(){return RP;},[0,1],[1,20],function(z,w){tk.stop();sz.set(z);sw.set(w);run();});
    var REFC=["teal","purple","gold","green"];
    function run(){
      var z=sz.get(),wn=sw.get(),k=wn*wn,c=2*z*wn,u=k*0.04;
      var lf=z>1?wn*(z+Math.sqrt(z*z-1)):wn,dt=Math.min(0.001,1/(20*lf)),ev=Math.max(1,Math.round(0.005/dt));
      var sim=_w04_simStep(U,z,wn,0.04,6,dt,ev),dmax=0;
      sim.T.forEach(function(t,i){dmax=Math.max(dmax,Math.abs(_w04_stepf(z,wn,t,0.04)[0]-sim.Y[i]));});
      R={z:z,wn:wn,k:k,c:c,u:u,T:sim.T,P:sim.Y,V:sim.V,ymax:sim.ymax,tp:sim.tp,dmax:dmax,dt:dt};
      draw();
    }
    function draw(){
      if(!R)return;var s=R,nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var t=st.get(),idx=Math.max(0,Math.min(s.T.length-1,Math.round(t/(s.T[1]-s.T[0])))),p=s.P[idx]*100,v=s.V[idx]*100;
      /* 台車の絵 */
      var gy=nar?100:96,sx0=nar?18:24,x0=sx0+(nar?70:96),sc=nar?24:30,cw=nar?52:64,ch=nar?30:36,cx=x0+p*sc,cy=gy-8-ch;
      o.push(_w04_ground(S,sx0-4,nar?392:446,gy));o.push(_w04_wall(S,sx0,gy-ch-38,gy));
      o.push(S.L(x0,gy-ch-36,x0,gy+16,"muted",1,"3 3"));o.push(S.T(x0,gy+28,"p = 0","middle",9.5,"muted"));
      o.push(S.L(x0+4*sc,gy-ch-36,x0+4*sc,gy+16,"green",1,"3 3"));o.push(S.T(x0+4*sc,gy+28,"4 cm（最終値）","middle",9.5,"green"));
      o.push(_w04_spring(S,sx0,cx,cy+10,nar?6:8,6,"teal",1.6));
      if(s.c>0)o.push(_w04_damper(S,sx0,cx,cy+ch-9,"purple",1.6));
      o.push(_w04_cart(S,U,cx,cy,cw,ch,"signal"));
      o.push(_w04_m(U,cx+cw/2,cy+ch/2+4,[["m",null,true]],"middle",11,"signal",true));
      o.push(S.ARR(cx+cw,cy+ch/2,cx+cw+30,cy+ch/2,"gold",2.2,7));
      o.push(_w04_m(U,cx+cw+34,cy+ch/2+4,[["u",null,true],[" = "+_w04_sig(s.u,3)+" N",null,false]],"start",9.5,"gold",true,true));
      o.push(S.T(sx0+4,14,"台車（m = 1 kg、k = "+_w04_sig(s.k,3)+" N/m、c = "+_w04_sig(s.c,3)+" N·s/m）","start",10,"ink",true));
      /* 根の平面 */
      var rx=nar?70:496,ry=nar?gy+48:24,P=U.plot(rx,ry,168,252,[-24,4],[-21,21]);RP=P;
      o.push(_w04_rplane(U,S,P,[-20,-10,0],[-20,-10,0,10,20]));
      if(s.z<1)o.push(S.CIRC(P.X(0),P.Y(0),P.X(s.wn)-P.X(0),"faint",1,null,"3 3"));
      o.push(U.ctl.pz(P,_w04_roots(s.z,s.wn),[],"signal",6));
      o.push(S.T(P.x+P.w,P.y-6,"× をドラッグ","end",9,"muted"));
      /* ステップ応答 */
      var py=nar?ry+P.h+56:150,Q=U.plot(nar?50:62,py,nar?334:380,nar?130:136,[0,6],[0,8.4]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"位置 p [cm]",xt:[0,1,2,3,4,5,6],yt:[0,2,4,6,8],xfmt:function(q){return String(q);},yfmt:function(q){return String(q);},ylOff:nar?34:40}));
      o.push(Q.line([[0,4],[6,4]],"muted",1.1,"4 3"));
      if(s.z>0&&s.z<1){var env=[],env2=[],a0=4/Math.sqrt(1-s.z*s.z);for(var i=0;i<=240;i++){var tt=i*0.025,e=a0*Math.exp(-s.z*s.wn*tt);env.push([tt,4+e]);env2.push([tt,4-e]);}
        o.push(_w04_cl(Q,env,"gold",1.2,"5 3"));o.push(_w04_cl(Q,env2,"gold",1.2,"5 3"));}
      refs.forEach(function(rf,j){o.push(_w04_cl(Q,rf.T.map(function(q,i){return [q,rf.P[i]*100];}),REFC[j%4],1.5,"6 3"));});
      o.push(_w04_cl(Q,s.T.map(function(q,i){return [q,s.P[i]*100];}),"signal",2.2));
      o.push(S.L(Q.X(t),Q.y,Q.X(t),Q.y+Q.h,"gold",1.1,"3 3"));o.push(S.D(Q.X(t),Q.Y(Math.min(8.4,p)),"signal",4));
      var ly=Q.y+Q.h+48,lg=[["signal",null,"今の応答"]];if(s.z>0&&s.z<1)lg.push(["gold","5 3","包絡線"]);
      o.push(S.LEGL(Q.x,ly,lg,9.5,14));
      var lx=Q.x+(s.z>0&&s.z<1?190:100);refs.forEach(function(rf,j){if(!nar||j<2){o.push(S.L(lx,ly-4,lx+20,ly-4,REFC[j%4],2,"6 3"));o.push(_w04_m(U,lx+24,ly,[["ζ",null,false],[" "+_w04_f(rf.z,2),null,false]],"start",9,"muted"));lx+=70;}});
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      var z=s.z,wn=s.wn,h="",kind=z<=0?'<span class="warn">減衰なし。揺れが減らない</span>':(z<1?"不足減衰":(Math.abs(z-1)<1e-9?'<span class="ok">臨界減衰</span>':"過減衰"));
      h+="台車（質量 1 kg）では <i>k</i> = ω<sub>n</sub>² = <b>"+_w04_sig(s.k,3)+" N/m</b>、<i>c</i> = 2ζω<sub>n</sub> = <b>"+_w04_sig(s.c,3)+" N·s/m</b>。押す力 <i>u</i> = <i>k</i> × 4 cm = "+_w04_sig(s.u,3)+" N（最終値 <i>Ku</i> = 4 cm）<br>";
      h+="特性根: <b>"+_w04_rootTxt(z,wn)+"</b>（"+kind+"）";
      if(z<1){var wd=wn*Math.sqrt(1-z*z);h+="。ω<sub>d</sub> = "+_w04_p3(wd)+" rad/s、揺れの周期 2π/ω<sub>d</sub> = <b>"+_w04_p3(2*Math.PI/wd)+" s</b>"+(z>0?"、包絡線の時定数 1/(ζω<sub>n</sub>) = "+_w04_p3(1/(z*wn))+" s":"");}
      else if(z>1){var r=Math.sqrt(z*z-1);h+="。遅い根の時定数 "+_w04_p3(1/(wn*(z-r)))+" s、速い根の時定数 "+_w04_p3(1/(wn*(z+r)))+" s";}
      h+="<br>";
      h+="時刻 "+_w04_f(t,2)+" s: 位置 <b>"+_w04_f(p,2)+" cm</b>、速度 "+_w04_f(v,1)+" cm/s。6 s までの最大の位置 <b>"+_w04_f(s.ymax*100,2)+" cm</b>（"+_w04_f(s.tp,2)+" s）<br>";
      h+="3 節の式と数値計算の差: 最大 "+(s.dmax*100<1e-6?"10<sup>−6</sup> cm 未満（表示の桁で一致）":_w04_sig(s.dmax*100,2)+" cm");
      ro.innerHTML=h+'<div class="wnote">式 <i>m</i>p̈ + <i>c</i>ṗ + <i>kp</i> = <i>u</i> を 4 次のルンゲ・クッタ法（刻み '+_w04_sig(s.dt*1e3,2)+' ms）で解いた。根の平面の × をドラッグすると、原点からの距離が ω<sub>n</sub>、負の実軸となす角 ψ が cos ψ = ζ になるように、つまみが変わる（ζ は 0〜1 の範囲）。破線の円は半径 ω<sub>n</sub>。</div>';
    }
    run();
  };

  /* ---- 4 節: 仕様を根の平面に描く ---- */
  REG.w04_spec=function(el,U){
    var S=U.S;
    U.head(el,"SPECIFICATION","仕様を満たす根の領域 — 行き過ぎ量と 2 % 整定時間");
    var r1=U.ctrls(el);
    var smp=U.slider(r1,"行き過ぎ量の上限",{values:[1,2,5,10,15,20,30,50],value:5,fmt:function(v){return v+" %";},onInput:function(){draw();}});
    var sts=U.slider(r1,"2 % 整定時間の上限",{values:[0.25,0.5,0.75,1,1.5,2,3,4,6],value:1,fmt:function(v){return v+" s";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var sz=U.slider(r2,"減衰比 ζ",{min:0.05,max:1,step:0.01,value:0.75,fmt:function(v){return _w04_f(v,2);},onInput:function(){draw();}});
    var sw=U.slider(r2,"固有角周波数 ω<sub>n</sub>",{min:1,max:20,log:true,value:8,fmt:function(v){return _w04_sig(v,3)+" rad/s";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var ex=U.checkbox(r3,"実際の整定時間の境目を描く（式から数値で求めた）",true,function(){draw();});
    var br=U.btnrow(el);
    function pre(z,w,keep){if(!keep){smp.set(5);sts.set(1);}sz.set(z);sw.set(w);draw();}
    U.button(br,"本文の例（5 %・1 s、C: ζ 0.75・ω<sub>n</sub> 8）",function(){pre(0.75,8);});
    U.button(br,"A: 例の台車（0.2・5）",function(){pre(0.2,5,true);});
    U.button(br,"B（0.7・5）",function(){pre(0.7,5,true);});
    U.button(br,"D（0.5・10）",function(){pre(0.5,10,true);});
    var box=U.svgbox(el),ro=U.readout(el),RP=null;
    _w04_dragRoot(U,box,function(){return RP;},[0.05,1],[1,20],function(z,w){sz.set(z);sw.set(w);draw();});
    /* 実際の 2 % 整定時間 × ω_n（ζ の表）。境目の線に使う */
    var ZT=[];for(var zz=0.05;zz<=1.0001;zz+=0.0025)ZT.push([Math.min(zz,1),_w04_index(Math.min(zz,1)).t2]);
    function draw(){
      var Mpm=smp.get()/100,Ts=sts.get(),z=sz.get(),wn=sw.get(),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var L=Math.log(Mpm),zmin=-L/Math.sqrt(Math.PI*Math.PI+L*L),slope=Math.sqrt(1-zmin*zmin)/zmin,xv=-4/Ts;
      /* 根の平面 */
      var P=U.plot(nar?56:56,24,168,252,[-24,4],[-21,21]);RP=P;
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));
      /* 目安の領域（扇形 ∩ 実部 ≤ −4/Ts） */
      var x0=P.xr[0];if(xv>x0){var ytop=Math.min(21,slope*(-xv)),pts=[[xv,-ytop],[xv,ytop]];
        if(slope*(-x0)>21){pts.push([-21/slope,21]);pts.push([x0,21]);pts.push([x0,-21]);pts.push([-21/slope,-21]);}
        else{pts.push([x0,slope*(-x0)]);pts.push([x0,-slope*(-x0)]);}
        if(-xv*slope>21){pts=[[xv,-21],[xv,21],[x0,21],[x0,-21]];}
        o.push(S.PL(pts.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"none",0,"green",null,0.16));}
      o.push(P.axes({xl:"実部",yl:"虚部",xt:[-20,-10,0],yt:[-20,-10,0,10,20],xfmt:function(v){return _w04_sig(v,3);},yfmt:function(v){return _w04_sig(v,3);},ylOff:34}));
      o.push(U.ctl.splane(P));
      var xe=Math.max(P.xr[0],-21/slope);o.push(S.L(P.X(0),P.Y(0),P.X(xe),P.Y(-xe*slope),"green",1.5,"5 3"));o.push(S.L(P.X(0),P.Y(0),P.X(xe),P.Y(xe*slope),"green",1.5,"5 3"));
      if(xv>P.xr[0])o.push(S.L(P.X(xv),P.y,P.X(xv),P.y+P.h,"green",1.5,"5 3"));
      if(ex.get()){var segs=[],cur=[],prev=null;ZT.forEach(function(q){if(q[0]<zmin-1e-9)return;var w=q[1]/Ts,re=-q[0]*w,im=w*Math.sqrt(Math.max(0,1-q[0]*q[0]));
          if(prev!==null&&Math.abs(w-prev)>0.15*Math.max(w,prev)){segs.push(cur);cur=[];}prev=w;cur.push([re,im]);});segs.push(cur);
        segs.forEach(function(sg){[1,-1].forEach(function(sn){o.push(_w04_cl2(S,P,sg.map(function(q){return q[0];}),sg.map(function(q){return sn*q[1];}),"teal",2.2,null));});});}
      var rts=_w04_roots(z,wn);
      var idx=_w04_index(z),Mp=idx.Mp,t2e=idx.t2/wn,ok1=Mp<=Mpm+1e-9,ok2=t2e<=Ts+1e-9,okA=z*wn>=4/Ts-1e-9;
      o.push(U.ctl.pz(P,rts,[],ok1&&ok2?"green":"alias",6));
      o.push(S.T(P.x+P.w,P.y-8,"× をドラッグ","end",9,"muted"));
      o.push(_w04_m(U,P.x+4,P.y+13,[["ζ",null,false],[" ≥ "+_w04_f(zmin,3),null,false]],"start",9.5,"green",true,true));
      /* ステップ応答 */
      var tEnd=Math.max(2*Ts,Math.min(6*Ts,isFinite(t2e)?1.4*t2e:6*Ts)),lf=wn,dt=Math.min(0.001,1/(20*lf)),ev=Math.max(1,Math.round(tEnd/500/dt));
      var sim=_w04_simStep(U,z,wn,1,tEnd,dt,ev),ymx=Math.max(1.25,1+Mp+0.1);
      var Q=U.plot(nar?50:300,nar?P.y+P.h+60:24,nar?334:380,nar?140:180,[0,tEnd],[0,ymx]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"y ÷ 最終値",xt:_w04_ticks(U,0,tEnd,5),yt:_w04_ticks(U,0,ymx,4),xfmt:function(q){return _w04_sig(q,3);},yfmt:function(q){return _w04_sig(q,3);},ylOff:nar?34:40}));
      o.push(S.RECT(Q.X(Math.min(Ts,tEnd)),Q.Y(1.02),Q.X(tEnd)-Q.X(Math.min(Ts,tEnd)),Q.Y(0.98)-Q.Y(1.02),0,"green","green",0.8,null,' fill-opacity="0.25"'));
      o.push(S.L(Q.X(Ts),Q.y,Q.X(Ts),Q.y+Q.h,"green",1.2,"4 3"));
      o.push(S.L(Q.x,Q.Y(1+Mpm),Q.x+Q.w,Q.Y(1+Mpm),"alias",1,"3 3"));
      o.push(Q.line([[0,1],[tEnd,1]],"muted",1,"4 3"));
      o.push(_w04_cl(Q,sim.T.map(function(q,i){return [q,sim.Y[i]];}),ok1&&ok2?"green":"alias",2.2));
      o.push(S.T(Q.x+Q.w-2,Q.Y(1+Mpm)-4,"行き過ぎ量 "+smp.get()+" %","end",9,"alias",false,false,null,true));
      o.push(_w04_m(U,Q.X(Ts)+4,Q.y+12,[["t","2%",true],[" = "+Ts+" s",null,false]],"start",9,"green",true,true));
      box.set(S.svg(Wd,(nar?Q.y+Q.h+44:Math.max(P.y+P.h+46,Q.y+Q.h+44)),o));
      /* 読み出し */
      function mark(ok){return ok?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>';}
      var h="仕様: 行き過ぎ量 "+smp.get()+" % 以下 → ζ ≥ <b>"+_w04_f(zmin,3)+"</b>（根が負の実軸となす角 "+_w04_f(Math.acos(zmin)*180/Math.PI,1)+"° 以下）。2 % 整定時間 "+Ts+" s 以下 → 目安の式で ζω<sub>n</sub> ≥ "+_w04_sig(4/Ts,3)+"（実部 "+_w04_sig(-4/Ts,3)+" 以下）<br>";
      h+="選んだ根: <b>"+_w04_rootTxt(z,wn)+"</b>（ζ "+_w04_f(z,2)+"、ω<sub>n</sub> "+_w04_sig(wn,3)+" rad/s）<br>";
      h+="式の値: 行き過ぎ量 "+(z<1?_w04_p3(Mp*100)+" %、ピーク時間 π/ω<sub>d</sub> = "+_w04_p3(Math.PI/(wn*Math.sqrt(1-z*z)))+" s":"0 %")+"、2 % 整定時間の目安 4/(ζω<sub>n</sub>) = "+_w04_p3(4/(z*wn))+" s<br>";
      h+="数値計算の値: 行き過ぎ量 <b>"+(sim.Mp>1e-6?_w04_p3(sim.Mp*100):"0")+" %</b>、立ち上がり時間 "+(sim.tr!==null?_w04_p3(sim.tr)+" s":"—")+"、2 % 整定時間 <b>"+(isFinite(sim.t2)?_w04_p3(sim.t2)+" s":"表示の範囲で収まらない")+"</b><br>";
      h+="判定: 行き過ぎ量 "+mark(ok1)+"、2 % 整定時間 "+mark(ok2)+(ok1&&ok2?'（<span class="ok">両方を満たす</span>）':"")+"<br>";
      if(okA!==ok2)h+='<span class="warn">目安の式（縦の線）では'+(okA?"満たす":"満たさない")+'が、実際の整定時間では'+(ok2?"満たす":"満たさない")+'。目安は包絡線から求めた値なので、境目の近くでは外れる</span><br>';
      ro.innerHTML=h+'<div class="wnote">緑に塗った領域は、行き過ぎ量の条件（2 本の破線の間）と、目安の式の整定時間の条件（縦の破線の左）を両方満たす所。青緑の実線は、扇形の中で、実際の 2 % 整定時間がちょうど上限になる根の位置で、ζ によって段になる（その線より原点から遠い根が、実際に満たす）。応答は 4 次のルンゲ・クッタ法（刻み '+_w04_sig(dt*1e3,2)+' ms）で計算した。</div>';
    }
    draw();
  };

  /* ---- 5 節: 位相平面 ---- */
  REG.w04_phase=function(el,U){
    var S=U.S;
    U.head(el,"PHASE PLANE","位相平面 — 初めの位置と速度をドラッグして、軌跡と波形を見る");
    var r1=U.ctrls(el);
    var sz=U.slider(r1,"減衰比 ζ",{min:0,max:3,step:0.01,value:0.2,fmt:function(v){return _w04_f(v,2);},onInput:function(){run();}});
    var sw=U.slider(r1,"固有角周波数 ω<sub>n</sub>",{min:1,max:20,log:true,value:5,fmt:function(v){return _w04_sig(v,3)+" rad/s";},onInput:function(){run();}});
    var md=U.select(r1,"力",["加えない（自由な動き）","押し続ける（最終値 4 cm のステップ）"],0,function(){run();});
    var r2=U.ctrls(el);
    var st=U.slider(r2,"時刻",{min:0,max:1,step:0.002,value:0.3,fmt:function(v){return R?_w04_f(v*R.tEnd,2)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.004;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(z,m,p0,v0){tk.stop();sz.set(z);sw.set(5);md.set(m);cur=[p0,v0];olds=[];st.set(0.3);run();}
    U.button(br,"本文の例（ζ 0.2・4 cm から離す）",function(){pre(0.2,0,4,0);});
    U.button(br,"ζ = 0（楕円）",function(){pre(0,0,4,0);});
    U.button(br,"ζ = 2（結節）",function(){pre(2,0,4,0);});
    U.button(br,"ステップ応答（原点から押し続ける）",function(){pre(0.2,1,0,0);});
    U.button(br,"前の軌跡を消す",function(){olds=[];run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,PP=null,cur=[4,0],olds=[];
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!PP)return;
      if(type==="down"){if(!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
        olds.push(cur.slice());if(olds.length>6)olds.shift();}
      var p=Math.max(-6,Math.min(6,PP.ux(x))),v=Math.max(PP.yr[0],Math.min(PP.yr[1],PP.uy(y)));
      cur=[Math.round(p*10)/10,Math.round(v*2)/2];tk.stop();st.set(0.3);run();});
    function traj(z,wn,mode,p0,v0,tEnd){
      var k=wn*wn,c=2*z*wn,u=mode===1?k*4:0,lf=z>1?wn*(z+Math.sqrt(z*z-1)):wn,dt=Math.min(0.002,1/(20*lf)),n=Math.round(tEnd/dt),ev=Math.max(1,Math.round(n/1500));
      var f=function(t,x){return [x[1],u-c*x[1]-k*x[0]];},x=[p0,v0],T=[],P=[],V=[];
      for(var i=0;i<=n;i++){if(i%ev===0){T.push(i*dt);P.push(x[0]);V.push(x[1]);}x=U.ctl.rk4(f,i*dt,x,dt);}
      return {T:T,P:P,V:V,dt:dt};
    }
    function run(){
      var z=sz.get(),wn=sw.get(),mode=md.get(),tEnd=Math.min(30,Math.max(6,30/wn));
      var main=traj(z,wn,mode,cur[0],cur[1],tEnd),others=olds.map(function(q){return traj(z,wn,mode,q[0],q[1],tEnd);});
      R={z:z,wn:wn,mode:mode,tEnd:tEnd,main:main,others:others,p0:cur[0],v0:cur[1]};
      st.set(st.get());draw();
    }
    function draw(){
      if(!R)return;var s=R,nar=_w04_nar(box),Wd=nar?400:700,o=[],vm=6*s.wn,pe=s.mode===1?4:0;
      var P=U.plot(nar?60:60,22,nar?300:280,nar?300:280,[-6,6],[-vm,vm]);PP=P;
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));
      o.push(P.axes({xl:"位置 p [cm]",yl:"速度 ṗ [cm/s]",xt:[-6,-4,-2,0,2,4,6],yt:_w04_ticks(U,-vm,vm,4),xfmt:function(v){return _w04_sig(v,3);},yfmt:function(v){return _w04_sig(v,3);},ylOff:44}));
      o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"muted",1));
      /* 向きの場 */
      var k=s.wn*s.wn,c=2*s.z*s.wn,u=s.mode===1?k*4:0;
      for(var i=1;i<=11;i++)for(var j=1;j<=11;j++){var a=-6+12*i/12,b=-vm+2*vm*j/12,da=b,db=u-c*b-k*a,dx=P.X(a+da*1e-4)-P.X(a),dy=P.Y(b+db*1e-4)-P.Y(b),Ln=Math.hypot(dx,dy);
        if(Ln<1e-12)continue;var ux=dx/Ln*5,uy=dy/Ln*5,xx=P.X(a),yy=P.Y(b);o.push(S.L(xx-ux,yy-uy,xx+ux,yy+uy,"faint",1));o.push(S.head(xx-ux,yy-uy,xx+ux*1.35,yy+uy*1.35,"faint",4));}
      /* 過減衰の直線 */
      if(s.z>1){var r=Math.sqrt(s.z*s.z-1),l1=-s.wn*(s.z-r),l2=-s.wn*(s.z+r);
        [[l1,"gold","遅い根"],[l2,"purple","速い根"]].forEach(function(q){var xa=Math.min(6,vm/Math.abs(q[0]));
          o.push(S.L(P.X(pe-xa),P.Y(-q[0]*xa),P.X(pe+xa),P.Y(q[0]*xa),q[1],1.5,"6 3"));});}
      if(s.mode===1){o.push(S.CIRC(P.X(4),P.Y(0),5,"green",2,"screen"));}
      else o.push(S.CIRC(P.X(0),P.Y(0),5,"green",2,"screen"));
      s.others.forEach(function(tr){o.push(_w04_cl2(S,P,tr.P,tr.V,"muted",1.4,null));o.push(S.D(P.X(tr.P[0]),P.Y(tr.V[0]),"muted",3));});
      o.push(_w04_cl2(S,P,s.main.P,s.main.V,"signal",2.2,null));
      o.push(S.CIRC(P.X(s.p0),P.Y(s.v0),6,"signal",1.6,"screen"));
      var t=st.get()*s.tEnd,ix=Math.max(0,Math.min(s.main.T.length-1,Math.round(t/(s.main.T[1]-s.main.T[0])))),pn=s.main.P[ix],vn=s.main.V[ix];
      if(pn>=-6&&pn<=6&&vn>=-vm&&vn<=vm)o.push(S.D(P.X(pn),P.Y(vn),"gold",5));
      o.push(S.T(P.x+P.w,P.y-7,"ドラッグで初めの位置と速度","end",9,"muted"));
      /* 時間の波形 */
      var qx=nar?60:420,qw=nar?320:260,qy=nar?P.y+P.h+56:22;
      var Q1=U.plot(qx,qy,qw,nar?100:118,[0,s.tEnd],[-6.5,8.5]),Q2=U.plot(qx,qy+(nar?140:160),qw,nar?100:118,[0,s.tEnd],[-vm,vm]);
      o.push(Q1.axes({xl:null,yl:"p [cm]",xt:_w04_ticks(U,0,s.tEnd,5),yt:[-4,0,4,8],xfmt:function(){return "";},ylOff:34}));
      o.push(Q1.line([[0,0],[s.tEnd,0]],"faint",1));if(s.mode===1)o.push(Q1.line([[0,4],[s.tEnd,4]],"green",1,"4 3"));
      o.push(_w04_cl(Q1,s.main.T.map(function(q,i){return [q,s.main.P[i]];}),"signal",2));
      o.push(Q2.axes({xl:"時間 t [s]",yl:"ṗ [cm/s]",xt:_w04_ticks(U,0,s.tEnd,5),yt:_w04_ticks(U,-vm,vm,4),xfmt:function(q){return _w04_sig(q,3);},yfmt:function(q){return _w04_sig(q,3);},ylOff:34}));
      o.push(Q2.line([[0,0],[s.tEnd,0]],"faint",1));
      o.push(_w04_cl(Q2,s.main.T.map(function(q,i){return [q,s.main.V[i]];}),"purple",2));
      [Q1,Q2].forEach(function(Q){o.push(S.L(Q.X(t),Q.y,Q.X(t),Q.y+Q.h,"gold",1.1,"3 3"));});
      if(pn>=-6.5&&pn<=8.5)o.push(S.D(Q1.X(t),Q1.Y(pn),"gold",4));if(vn>=-vm&&vn<=vm)o.push(S.D(Q2.X(t),Q2.Y(vn),"gold",4));
      box.set(S.svg(Wd,(nar?Q2.y+Q2.h+42:Math.max(P.y+P.h+44,Q2.y+Q2.h+42)),o));
      /* 読み出し */
      var z=s.z,wn=s.wn,shape=z<=0?"楕円（閉じた曲線を回り続ける）":(z<1?"渦巻き（回りながら平衡点へ）":"結節（回らずに平衡点へ）");
      var ext=[];for(var q=1;q<s.main.V.length&&ext.length<4;q++){if((s.main.V[q-1]>0&&s.main.V[q]<=0)||(s.main.V[q-1]<0&&s.main.V[q]>=0))ext.push(_w04_f(s.main.P[q],2)+" cm（"+_w04_f(s.main.T[q],2)+" s）");}
      var vmax=-1,tv=0;s.main.V.forEach(function(v,i){if(Math.abs(v)>vmax){vmax=Math.abs(v);tv=s.main.T[i];}});
      var h="初めの位置 <b>"+_w04_f(s.p0,1)+" cm</b>、速度 <b>"+_w04_f(s.v0,1)+" cm/s</b>。特性根 "+_w04_rootTxt(z,wn)+" → 軌跡の形: <b>"+shape+"</b><br>";
      h+="時刻 "+_w04_f(t,2)+" s: 位置 "+_w04_f(pn,2)+" cm、速度 "+_w04_f(vn,2)+" cm/s";
      if(s.mode===0){var E0=0.5*Math.pow(s.v0/100,2)+0.5*wn*wn*Math.pow(s.p0/100,2),Et=0.5*Math.pow(vn/100,2)+0.5*wn*wn*Math.pow(pn/100,2);
        h+="、エネルギー <i>E</i> = "+_w04_sig(Et*1e3,3)+" mJ（初め "+_w04_sig(E0*1e3,3)+" mJ）";}
      h+="<br>横軸を横切る点（速度が 0。波形の山と谷）: "+(ext.length?ext.join("、"):"なし")+"<br>";
      h+="速さ（速度の大きさ）の最大: "+_w04_f(vmax,2)+" cm/s（"+_w04_f(tv,2)+" s）";
      ro.innerHTML=h+'<div class="wnote">台車（質量 1 kg、<i>k</i> = ω<sub>n</sub>²、<i>c</i> = 2ζω<sub>n</sub>）の式を 4 次のルンゲ・クッタ法で解いた。速度の目盛は位置の目盛の ω<sub>n</sub> 倍にとってあるので、減衰が無いと円になる。灰色は前に選んだ初めの点からの軌跡（今の ζ・ω<sub>n</sub> で計算し直す）、金の点は今の時刻の位置と速度。過減衰では、遅い根（金）と速い根（紫）の直線を破線で描く。<i>E</i> は運動のエネルギーとばねのエネルギーの和。</div>';
    }
    run();
  };

  /* ---- 6 節: モータの位置の P 制御 ---- */
  REG.w04_motorpos=function(el,U){
    var S=U.S,Tm=0.05,Km=50,Ra=2,La=1e-3,Kt=0.02,J=1e-5;
    U.head(el,"POSITION CONTROL","モータの角度の比例制御 — 軸の動く絵・角度と電圧・特性根");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{min:0.01,max:50,log:true,value:0.21,fmt:function(v){return _w04_sig(v,3)+" V/rad";},onInput:function(){run();}});
    var rr=U.slider(r1,"目標の角度 <i>r</i>",{values:[0.5,1,2,3.14],value:1,fmt:function(v){return v+" rad";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var la=U.checkbox(r2,"<i>L</i><sub>a</sub> を含めた 3 階の式も重ねる（破線）",false,function(){run();});
    var st=U.slider(r2,"時刻",{min:0,max:1,step:0.002,value:0.3,fmt:function(v){return R?_w04_f(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.004;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(k,l){tk.stop();kp.set(k);rr.set(1);la.set(!!l);st.set(0.3);run();}
    U.button(br,"本文の例（K<sub>P</sub> 0.21 V/rad）",function(){pre(0.21);});
    U.button(br,"臨界減衰（0.1）",function(){pre(0.1);});
    U.button(br,"0.05（過減衰）",function(){pre(0.05);});
    U.button(br,"1 V/rad",function(){pre(1);});
    U.button(br,"10 V/rad（L<sub>a</sub> あり）",function(){pre(10,true);});
    U.button(br,"45 V/rad（L<sub>a</sub> あり）",function(){pre(45,true);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var K=kp.get(),r=rr.get(),wn=Math.sqrt(Km*K/Tm),z=1/(2*Math.sqrt(Km*K*Tm)),rts=_w04_roots(z,wn);
      var slow=Math.min(Math.abs(rts[0].re),Math.abs(rts[1].re)),tEnd=Math.max(1,Math.min(10,6/slow));
      /* 二次遅れ（L_a を無視） */
      var dt=Math.min(1e-4,1/(20*wn*(z>1?z+Math.sqrt(z*z-1):1))),n=Math.round(tEnd/dt),ev=Math.max(1,Math.round(n/1500)),x=[0,0],T=[],TH=[],V=[],Yf=new Float64Array(n+1);
      var f2=function(t,q){return [q[1],(Km*K*(r-q[0])-q[1])/Tm];},vmax=0;
      for(var i=0;i<=n;i++){var v=K*(r-x[0]);vmax=Math.max(vmax,Math.abs(v));Yf[i]=x[0];
        if(i%ev===0){T.push(i*dt);TH.push(x[0]);V.push(v);}x=U.ctl.rk4(f2,i*dt,x,dt);}
      var stt=_w04_stats(Yf,dt,r);
      var res={K:K,r:r,wn:wn,z:z,rts:rts,tEnd:tEnd,T:T,TH:TH,V:V,Mp:stt.Mp,tp:stt.tp,t2:stt.t2,vmax:vmax,dt:dt};
      /* L_a を含む 3 階の式 */
      if(la.get()){var d3=2e-5,n3=Math.round(tEnd/d3),e3=Math.max(1,Math.round(n3/1500)),y=[0,0,0],T3=[],TH3=[],V3=[],ym3=-1e9,blow=false,dmax=0;
        var f3=function(t,q){var vv=K*(r-q[0]);return [q[1],Kt*q[2]/J,(vv-Ra*q[2]-Kt*q[1])/La];};
        for(var i2=0;i2<=n3;i2++){if(i2%e3===0){T3.push(i2*d3);TH3.push(y[0]);V3.push(K*(r-y[0]));var w2=_w04_stepf(z,wn,i2*d3,r)[0];dmax=Math.max(dmax,Math.abs(y[0]-w2));}
          if(y[0]>ym3)ym3=y[0];if(Math.abs(y[0])>60*r){blow=true;break;}y=U.ctl.rk4(f3,i2*d3,y,d3);}
        var cp=U.ctl.poly.roots([La*J,Ra*J,Kt*Kt,Kt*K]);
        res.L3={T:T3,TH:TH3,V:V3,Mp:(ym3-r)/r,blow:blow,dmax:dmax,roots:cp};}
      R=res;st.set(st.get());draw();
    }
    function draw(){
      if(!R)return;var s=R,nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var t=st.get()*s.tEnd,ix=Math.max(0,Math.min(s.T.length-1,Math.round(t/(s.T[1]-s.T[0])))),th=s.TH[ix],vnow=s.V[ix];
      /* 軸の絵 */
      var cx=nar?96:120,cy=nar?100:104,Rd=nar?64:74;
      o.push(S.T(nar?10:14,16,"軸の角度（上から見た絵）","start",10,"ink",true));
      o.push(S.CIRC(cx,cy,Rd,"muted",1.6,"panel"));
      o.push(S.L(cx,cy,cx+Rd+10,cy,"faint",1,"3 3"));
      o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(s.r),cy-(Rd-4)*Math.sin(s.r),"muted",1.8,"5 3"));
      var arc=[];for(var a=0;a<=60;a++){var an=th*a/60;arc.push([cx+28*Math.cos(an),cy-28*Math.sin(an)]);}
      if(Math.abs(th)>0.02)o.push(S.PL(arc,"signal",1.4));
      if(s.L3){var i3=Math.max(0,Math.min(s.L3.T.length-1,Math.round(t/(s.L3.T[1]-s.L3.T[0])))),th3=s.L3.TH[i3];
        if(isFinite(th3))o.push(S.L(cx,cy,cx+(Rd-10)*Math.cos(th3),cy-(Rd-10)*Math.sin(th3),"teal",2.2,"4 3"));}
      o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(th),cy-(Rd-4)*Math.sin(th),"signal",3.5));
      o.push(S.D(cx,cy,"ink",3.6));
      o.push(_w04_m(U,cx+(Rd+8)*Math.cos(s.r),cy-(Rd+8)*Math.sin(s.r)-2,[["目標 ",null,false],["r",null,true]],Math.cos(s.r)<-0.2?"end":"start",9.5,"muted",true,true));
      o.push(_w04_m(U,cx-Rd+4,cy+Rd+18,[["θ","m",false],[" = "+_w04_f(th,3)+" rad",null,false]],"start",10,"signal",true,true));
      o.push(_w04_m(U,cx-Rd+4,cy+Rd+34,[["v",null,true],[" = "+_w04_f(vnow,2)+" V",null,false]],"start",10,"gold",true,true));
      /* 根の平面 */
      var sp=Math.max(28,2.3*Math.max(Math.abs(s.rts[0].im),Math.abs(s.rts[0].re),Math.abs(s.rts[1].re))),P=U.plot(nar?256:56,nar?24:250,nar?120:150,nar?120:150,[-0.88*sp,0.12*sp],[-sp/2,sp/2]);
      o.push(_w04_rplane(U,S,P,_w04_ticks(U,P.xr[0],P.xr[1],3),_w04_ticks(U,P.yr[0],P.yr[1],3)));
      o.push(S.L(P.X(-20),P.Y(0),P.X(0),P.Y(0),"gold",2.4));
      o.push(S.L(P.X(-10),P.y,P.X(-10),P.y+P.h,"gold",2.4));
      o.push(U.ctl.pz(P,s.rts,[],"signal",5.5));
      if(s.L3)o.push(U.ctl.pz(P,s.L3.roots,[],"teal",4.5));
      o.push(S.TX(P.x,P.y-7,nar?"特性根":"特性根（金の線: K_P を変えたときの道）","start",9,"muted"));
      /* 角度と電圧 */
      var qx=nar?50:300,qw=nar?334:380,qy=nar?Math.max(cy+Rd+48,P.y+P.h+44):24;
      var ymx=Math.max(1.2*s.r,(1+Math.max(0,s.Mp))*s.r*1.08);if(s.L3&&!s.L3.blow)ymx=Math.max(ymx,(1+Math.max(0,s.L3.Mp))*s.r*1.08);
      var Q1=U.plot(qx,qy,qw,nar?120:140,[0,s.tEnd],[0,ymx]);
      o.push(Q1.axes({xl:null,yl:"角度 [rad]",xt:_w04_ticks(U,0,s.tEnd,5),yt:_w04_ticks(U,0,ymx,4),xfmt:function(){return "";},yfmt:function(q){return _w04_sig(q,3);},ylOff:40}));
      o.push(Q1.line([[0,s.r],[s.tEnd,s.r]],"muted",1.1,"4 3"));o.push(Q1.line([[0,1.05*s.r],[s.tEnd,1.05*s.r]],"alias",0.9,"2 3"));
      if(s.L3)o.push(_w04_cl(Q1,s.L3.T.map(function(q,i){return [q,s.L3.TH[i]];}),"teal",1.6,"5 3"));
      o.push(_w04_cl(Q1,s.T.map(function(q,i){return [q,s.TH[i]];}),"signal",2.2));
      var vm=Math.max(0.1,s.K*s.r)*1.15,Q2=U.plot(qx,Q1.y+Q1.h+22,qw,nar?90:110,[0,s.tEnd],[-vm,vm]);
      o.push(Q2.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:_w04_ticks(U,0,s.tEnd,5),yt:_w04_ticks(U,-vm,vm,4),xfmt:function(q){return _w04_sig(q,3);},yfmt:function(q){return _w04_sig(q,3);},ylOff:40}));
      o.push(Q2.line([[0,0],[s.tEnd,0]],"faint",1));
      if(s.L3)o.push(_w04_cl(Q2,s.L3.T.map(function(q,i){return [q,s.L3.V[i]];}),"teal",1.4,"5 3"));
      o.push(_w04_cl(Q2,s.T.map(function(q,i){return [q,s.V[i]];}),"gold",2));
      [Q1,Q2].forEach(function(Q){o.push(S.L(Q.X(t),Q.y,Q.X(t),Q.y+Q.h,"gold",1.1,"3 3"));});
      o.push(S.T(Q1.x+Q1.w,Q1.Y(1.05*s.r)-4,"行き過ぎ量 5 %","end",9,"alias",false,false,null,true));
      box.set(S.svg(Wd,Math.max(Q2.y+Q2.h+44,P.y+P.h+44),o));
      /* 読み出し */
      var z=s.z,wn=s.wn,h="";
      h+="閉ループ（<i>L</i><sub>a</sub> を無視した二次遅れ）: ω<sub>n</sub> = √(<i>KK</i><sub>P</sub>/<i>T</i>) = <b>"+_w04_p3(wn)+" rad/s</b>、ζ = 1/(2√(<i>KK</i><sub>P</sub><i>T</i>)) = <b>"+_w04_p3(z)+"</b>、特性根 <b>"+_w04_rootTxt(z,wn)+"</b><br>";
      if(z<1)h+="式の値: 行き過ぎ量 "+_w04_p3(Math.exp(-Math.PI*z/Math.sqrt(1-z*z))*100)+" %、ピーク時間 "+_w04_p3(Math.PI/(wn*Math.sqrt(1-z*z)))+" s、2 % 整定時間の目安 4/(ζω<sub>n</sub>) = "+_w04_p3(4/(z*wn))+" s<br>";
      else h+="ζ ≥ 1 なので行き過ぎない（<i>K</i><sub>P</sub> ≤ 1/(4<i>KT</i>) = 0.1 V/rad）<br>";
      h+="数値計算: 行き過ぎ量 <b>"+(s.Mp>1e-6?_w04_p3(s.Mp*100):"0")+" %</b>"+(s.Mp>1e-4?"（"+_w04_p3(s.tp)+" s）":"")+"、2 % 整定時間 <b>"+(isFinite(s.t2)?_w04_p3(s.t2)+" s":"表示の範囲で収まらない")+"</b>、電圧の最大 "+_w04_p3(s.vmax)+" V<br>";
      if(s.vmax>12)h+='<span class="warn">電圧が電源の 12 V を超える。この計算は電圧の上限を考えていないので、実際にはこの通りには動かない（11 章 4 節）</span><br>';
      if(s.L3){var rs=s.L3.roots.map(function(q){return Math.abs(q.im)>1e-6?_w04_sig(q.re,3)+(q.im>0?" + ":" − ")+"<i>j</i>"+_w04_sig(Math.abs(q.im),3):_w04_sig(q.re,4);}).join("、"),un=s.L3.roots.some(function(q){return q.re>0;});
        h+="<i>L</i><sub>a</sub> を含む 3 階の式: 特性根 "+rs+"。"+(un||s.L3.blow?'<span class="warn">実部が正の根があり、揺れが大きくなり続ける（K<sub>P</sub> が 40 V/rad を超えると起きる）</span>':"行き過ぎ量 "+(s.L3.Mp>1e-6?_w04_p3(s.L3.Mp*100):"0")+" %、二次遅れの式との角度の差は最大 "+_w04_sig(s.L3.dmax,2)+" rad")+"<br>";}
      ro.innerHTML=h+'<div class="wnote">モータの一次の式 <i>T</i>ω̇<sub>m</sub> + ω<sub>m</sub> = <i>Kv</i>（<i>T</i> = 0.05 s、<i>K</i> = 50 (rad/s)/V）に <i>v</i> = <i>K</i><sub>P</sub>(<i>r</i> − θ<sub>m</sub>) を入れた式を、4 次のルンゲ・クッタ法（刻み '+_w04_sig(s.dt*1e3,2)+' ms）で解いた。3 階の式は、2 章 3 節の電気の式と機械の式（<i>R</i><sub>a</sub> 2 Ω、<i>L</i><sub>a</sub> 1 mH、<i>K</i><sub>t</sub> 0.02 N·m/A、<i>J</i> 1 × 10⁻⁵ kg·m²）を刻み 0.02 ms で解いた。根の平面の 3 つ目の根（約 −1980）は枠の外にあるので、端の点で示す。</div>';
    }
    run();
  };
