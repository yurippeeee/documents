  /* ===== 05 章 ラプラス変換 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w05_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w05_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w05_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=String(+v.toPrecision(d));return s.replace("-","−");}
  /* 複素数を "−1 + j4.9" の形に */
  function _w05_cs(re,im,d){d=d||3;if(Math.abs(im)<1e-9*(1+Math.abs(re)))return _w05_sig(re,d);var a=Math.abs(re)<1e-12?"":_w05_sig(re,d)+(im<0?" − ":" + ");
    return a+(a?"":(im<0?"−":""))+"j"+_w05_sig(Math.abs(im),d);}
  /* 範囲の外に出る所で線を切る折れ線（範囲に戻ればまた描く） */
  function _w05_cut(P,pts,c,lw,dash,S){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),out=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1];if(!isFinite(b)||a<P.xr[0]-1e-12||a>P.xr[1]+1e-12){prev=null;if(cur.length>1)out.push(cur);cur=[];return;}
      var ins=b>=lo&&b<=hi;
      if(prev){var pin=prev[1]>=lo&&prev[1]<=hi;
        if(ins&&!pin){var lim=prev[1]>hi?hi:lo,fr=(lim-prev[1])/(b-prev[1]);cur=[[prev[0]+(a-prev[0])*fr,lim]];}
        else if(pin&&!ins){var lim2=b>hi?hi:lo,fr2=(lim2-prev[1])/(b-prev[1]);cur.push([prev[0]+(a-prev[0])*fr2,lim2]);out.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=[a,b];});
    if(cur.length>1)out.push(cur);
    return out.map(function(sg){return S.PL(sg.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),c,lw,null,dash);}).join("");}
  /* 曲線と y = 0 の間を薄く塗る（範囲で切る） */
  function _w05_fill(P,pts,c,U,op){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),q=[[P.X(pts[0][0]),P.Y(0)]];
    pts.forEach(function(p){q.push([P.X(p[0]),P.Y(Math.max(lo,Math.min(hi,p[1])))]);});q.push([P.X(pts[pts.length-1][0]),P.Y(0)]);
    return '<polygon points="'+q.map(function(p){return (Math.round(p[0]*100)/100)+","+(Math.round(p[1]*100)/100);}).join(" ")+'" fill="'+U.soft(c)+'" stroke="none"'+(op!=null?' fill-opacity="'+op+'"':'')+'/>';}
  /* 添字（_x、_{xy}）と上付き（^x、^{xy}、上付きの中の _x）を書ける文字。図の _f05_tx と同じ */
  function _w05_parse(s){var out=[],buf="",i=0;s=String(s);
    while(i<s.length){var ch=s[i];
      if((ch==="_"||ch==="^")&&i+1<s.length){if(buf){out.push([buf,0]);buf="";}var kind=ch==="_"?-1:1,grp;
        if(s[i+1]==="{"){var j=s.indexOf("}",i+2);grp=s.slice(i+2,j);i=j+1;}else{grp=s[i+1];i+=2;}
        if(kind===1&&grp.indexOf("_")>=0){var b2="",k=0;while(k<grp.length){if(grp[k]==="_"&&k+1<grp.length){if(b2){out.push([b2,1]);b2="";}out.push([grp[k+1],2]);k+=2;}else{b2+=grp[k];k++;}}if(b2)out.push([b2,1]);}
        else out.push([grp,kind]);continue;}
      buf+=ch;i++;}
    if(buf)out.push([buf,0]);return out;}
  function _w05_tw(U,s,sz){return _w05_parse(s).reduce(function(w,g){return w+U.tw(g[0],sz*({"0":1,"-1":0.72,"1":0.72,"2":0.58})[g[1]]);},0);}
  function _w05_tx(U,x,y,s,a,sz,c,b,halo){sz=sz||10;var segs=_w05_parse(s),fs={"0":sz,"-1":sz*0.72,"1":sz*0.72,"2":sz*0.58},off={"0":0,"-1":sz*0.28,"1":-sz*0.42,"2":-sz*0.28};
    var w=segs.reduce(function(q,g){return q+U.tw(g[0],fs[g[1]]);},0),x0=x-(a==="middle"?w/2:(a==="end"?w:0)),cur=0;
    var h='<text x="'+x0.toFixed(2)+'" y="'+(+y).toFixed(2)+'" text-anchor="start" font-size="'+sz+'" fill="'+U.col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
      (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>';
    segs.forEach(function(g){var dy=off[g[1]]-cur;h+='<tspan'+(Math.abs(dy)>1e-9?' dy="'+dy.toFixed(2)+'"':'')+(g[1]?' font-size="'+fs[g[1]].toFixed(2)+'"':'')+'>'+U.esc(g[0])+'</tspan>';cur=off[g[1]];});
    return h+'</text>';}
  /* 根の印（×）と、重なりの数 */
  function _w05_root(S,P,z,c,m,r){var o=[],inside=z.re>=P.xr[0]&&z.re<=P.xr[1]&&z.im>=P.yr[0]&&z.im<=P.yr[1];r=r||6;
    if(inside){o.push(S.X(P.X(z.re),P.Y(z.im),r,c,2.4));if(m>1)o.push(S.T(P.X(z.re)-7,P.Y(z.im)+15,"×"+m,"end",9,c,true,false,null,true));}
    else{var xx=Math.max(P.xr[0],Math.min(P.xr[1],z.re)),yy=Math.max(P.yr[0],Math.min(P.yr[1],z.im)),X=P.X(xx),Y=P.Y(yy);
      if(z.re<P.xr[0]){o.push(S.ARR(X+16,Y,X+2,Y,c,1.6,5));o.push(S.T(X+18,Y+3.5,_w05_sig(z.re,4),"start",9,c,true,false,null,true));}
      else o.push(S.D(X,Y,c,3));}
    return o.join("");}
  /* s 平面の地（枠・右半分の薄い赤・軸と目盛） */
  function _w05_plane(U,S,P,xt,yt){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+P.axes({xl:"実部 σ [1/s]",yl:"虚部 ω [rad/s]",xt:xt,yt:yt,xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,3);},ylOff:34,sz:9})+U.ctl.splane(P);}

  /* ---- 複素数の多項式（昇べき）と、部分分数分解 ---- */
  function _w05_pmulc(cx,a,b){var o=[];for(var i=0;i<a.length+b.length-1;i++)o.push(cx.c(0,0));
    for(var i2=0;i2<a.length;i2++)for(var j=0;j<b.length;j++)o[i2+j]=cx.add(o[i2+j],cx.mul(a[i2],b[j]));return o;}
  /* 複素数の連立 1 次方程式（部分ピボットのガウスの消去法） */
  function _w05_solvec(cx,M,b){var n=M.length,A=M.map(function(r,i){return r.concat([b[i]]);});
    for(var k=0;k<n;k++){var p=k,mx=cx.abs(A[k][k]);for(var i=k+1;i<n;i++)if(cx.abs(A[i][k])>mx){mx=cx.abs(A[i][k]);p=i;}
      var t=A[k];A[k]=A[p];A[p]=t;
      for(var i2=k+1;i2<n;i2++){var f=cx.div(A[i2][k],A[k][k]);for(var j=k;j<=n;j++)A[i2][j]=cx.sub(A[i2][j],cx.mul(f,A[k][j]));}}
    var x=[];for(var i3=n-1;i3>=0;i3--){var s=A[i3][n];for(var j2=i3+1;j2<n;j2++)s=cx.sub(s,cx.mul(A[i3][j2],x[j2]));x[i3]=cx.div(s,A[i3][i3]);}
    return x;}
  /* Y(s) = N(s) / Π(s − λ_i)^{m_i} を部分分数に分ける。N は降べきの実数の係数。groups = [{lam:{re,im}, m}]。
     返り値: groups に A（[A_1, …, A_m]、A_k は 1/(s − λ)^k の係数）を足したもの */
  function _w05_pfrac(U,N,groups){var cx=U.ctl.cx,n=0;groups.forEach(function(g){n+=g.m;});
    var lin=function(l){return [cx.neg(l),cx.c(1,0)];},cols=[],keys=[];
    groups.forEach(function(g,i){for(var k=1;k<=g.m;k++){var p=[cx.c(1,0)];
      for(var e=0;e<g.m-k;e++)p=_w05_pmulc(cx,p,lin(g.lam));
      groups.forEach(function(h,j){if(j!==i)for(var e2=0;e2<h.m;e2++)p=_w05_pmulc(cx,p,lin(h.lam));});
      while(p.length<n)p.push(cx.c(0,0));cols.push(p);keys.push([i,k]);}});
    var na=N.slice().reverse(),rhs=[];for(var r=0;r<n;r++)rhs.push(cx.c(r<na.length?na[r]:0,0));
    var M=[];for(var r2=0;r2<n;r2++){var row=[];for(var c2=0;c2<n;c2++)row.push(cols[c2][r2]);M.push(row);}
    var x=_w05_solvec(cx,M,rhs),out=groups.map(function(g){return {lam:g.lam,m:g.m,A:[],c:g.c,src:g.src};});
    keys.forEach(function(kk,q){out[kk[0]].A[kk[1]-1]=x[q];});
    return out;}
  /* 部分分数の 1 つの組の時間の項（共役な組は 2 倍の実部。虚部が負の根は、組の相手に含めるので 0） */
  function _w05_term(g,t){if(g.lam.im<-1e-9)return 0;var e=Math.exp(g.lam.re*t),cs=Math.cos(g.lam.im*t),sn=Math.sin(g.lam.im*t),v=0,fac=1;
    for(var k=0;k<g.m;k++){if(k>0)fac*=k;var A=g.A[k],tk=Math.pow(t,k)/fac;v+=tk*e*(A.re*cs-A.im*sn);}
    return g.lam.im>1e-9?2*v:v;}
  /* 4 次のルンゲ・クッタ法で a_n y^(n) + … + a_0 y = b u(t) を解く（a は降べき）。返り値 [[t, y], …] */
  function _w05_ode(U,a,b,uf,ic,tEnd,n,rec){var N=a.length-1,an=a[0],x=ic.slice(),out=[[0,x[0]]],h=tEnd/n,ev=Math.max(1,Math.round(n/(rec||600)));
    function f(t,xx){var d=[];for(var i=0;i<N-1;i++)d.push(xx[i+1]);var s=b*uf(t);for(var j=0;j<N;j++)s-=a[N-j]*xx[j];d.push(s/an);return d;}
    for(var k=0;k<n;k++){x=U.ctl.rk4(f,k*h,x,h);if((k+1)%ev===0||k===n-1)out.push([(k+1)*h,x[0]]);}
    return out;}

  /* ---- 2 節: s 平面の点 λ と e^{λt} ---- */
  REG.w05_splane=function(el,U){
    var S=U.S;
    U.head(el,"S-PLANE","s 平面の点 λ と、e<sup>λt</sup> の形・変換 1/(s − λ)");
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"実部 σ<sub>0</sub>",{min:-6,max:2,step:0.05,value:-1,fmt:function(v){return _w05_f(v,2)+" 1/s";},onInput:draw});
    var om=U.slider(r1,"虚部 ω<sub>0</sub>",{min:0,max:15,step:0.05,value:4.9,fmt:function(v){return _w05_f(v,2)+" rad/s";},onInput:draw});
    var r2=U.ctrls(el);
    var tr=U.select(r2,"時間の範囲",["0〜2 s","0〜4 s","0〜10 s"],1,function(){tt.set(tt.get());draw();});
    var tt=U.slider(r2,"時刻 t",{min:0,max:1,step:0.002,value:0.25,fmt:function(v){return _w05_f(v*rng(),2)+" s";},onInput:function(){tick.stop();draw();}});
    var r3=U.ctrls(el);
    var cj=U.checkbox(r3,"共役な点 λ̄ も描く（2 つの和の半分が実部）",true,draw);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.004;if(v>=1){v=1;tick.stop();}tt.set(v);draw();},40);
    function pre(a,b){tick.stop();sg.set(a);om.set(b);tt.set(0.25);draw();}
    U.button(br,"本文の例（台車の根 −1 ± j4.90）",function(){tr.set(1);pre(-1,4.899);});
    U.button(br,"−2（台車の速度の一次遅れ）",function(){pre(-2,0);});
    U.button(br,"0（ステップ）",function(){pre(0,0);});
    U.button(br,"±j5（揺れ続ける）",function(){pre(0,5);});
    U.button(br,"+0.5（増え続ける）",function(){pre(0.5,0);});
    U.button(br,"0.3 ± j3（増えながら揺れる）",function(){pre(0.3,3);});
    var br2=U.btnrow(el);
    U.button(br2,"▶ 再生",function(){if(tt.get()>=0.999)tt.set(0);tick.start();});
    U.button(br2,"■ 止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),SP=null;
    function rng(){return [2,4,10][tr.get()];}
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!SP)return;
      var inA=x>=SP.x-4&&x<=SP.x+SP.w+4&&y>=SP.y-4&&y<=SP.y+SP.h+4;
      if(type==="down"&&!inA)return false;
      var a=Math.max(-6,Math.min(2,SP.ux(x))),b=Math.abs(SP.uy(y));b=Math.max(0,Math.min(15,b));
      if(b<0.25)b=0;if(Math.abs(a)<0.1)a=0;
      tick.stop();sg.set(Math.round(a*20)/20);om.set(Math.round(b*20)/20);draw();});
    function draw(){
      var s0=sg.get(),w0=om.get(),T=rng(),t=tt.get()*T,nar=_w05_nar(box),Wd=nar?400:700,o=[];
      /* s 平面 */
      var P=nar?U.plot(48,24,150,170,[-6.5,2.5],[-16,16]):U.plot(56,24,190,200,[-6.5,2.5],[-16,16]);SP=P;
      o.push(_w05_plane(U,S,P,[-6,-4,-2,0,2],[-15,-10,-5,0,5,10,15]));
      o.push(S.T(P.x,P.y-8,"s 平面（点をドラッグ）","start",10,"ink",true));
      if(cj.get()&&w0>0)o.push(_w05_root(S,P,{re:s0,im:-w0},"muted",1,5));
      o.push(S.CIRC(P.X(s0),P.Y(w0),10,"signal",1.2,null,"2 2"));
      o.push(_w05_root(S,P,{re:s0,im:w0},s0>0?"alias":"signal",1,6));
      o.push(_w05_tx(U,P.X(s0)+(s0>0?-12:12),P.Y(w0)-10,"λ",s0>0?"end":"start",11,s0>0?"alias":"signal",true,true));
      if(cj.get()&&w0>0)o.push(_w05_tx(U,P.X(s0)+(s0>0?-12:12),P.Y(-w0)+16,"λ̄",s0>0?"end":"start",11,"muted",true,true));
      /* 複素平面の上で回る e^{λt} */
      var cx0=nar?232:300,Q=nar?U.plot(cx0,24,150,150,[-1.8,1.8],[-1.8,1.8]):U.plot(cx0,24,180,180,[-1.8,1.8],[-1.8,1.8]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"screen","line",0.8));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",1));o.push(S.L(Q.X(0),Q.y,Q.X(0),Q.y+Q.h,"muted",1));
      o.push(S.CIRC(Q.X(0),Q.Y(0),Q.X(1)-Q.X(0),"faint",1,null,"3 3"));
      o.push(_w05_tx(U,Q.x,Q.y-8,"e^{λt} の動き（複素平面）","start",10,"ink",true));
      o.push(S.T(Q.x+Q.w-3,Q.Y(0)-4,"実部","end",9,"muted"));o.push(S.T(Q.X(0)+4,Q.y+11,"虚部","start",9,"muted"));
      var tr1=[],tr2=[],n=400;for(var i=0;i<=n;i++){var tq=t*i/n,r=Math.exp(s0*tq);tr1.push([tq,r*Math.cos(w0*tq),r*Math.sin(w0*tq)]);}
      function cl(v){return Math.max(-1.8,Math.min(1.8,v));}
      var path1=[],path2=[];tr1.forEach(function(q){if(Math.abs(q[1])<=1.8&&Math.abs(q[2])<=1.8){path1.push([Q.X(q[1]),Q.Y(q[2])]);path2.push([Q.X(q[1]),Q.Y(-q[2])]);}});
      if(cj.get()&&w0>0&&path2.length>1)o.push(S.PL(path2,"muted",1.2,null,"4 3"));
      if(path1.length>1)o.push(S.PL(path1,"signal",1.6));
      var re=Math.exp(s0*t)*Math.cos(w0*t),im=Math.exp(s0*t)*Math.sin(w0*t),out=Math.abs(re)>1.8||Math.abs(im)>1.8;
      if(!out){o.push(S.L(Q.X(0),Q.Y(0),Q.X(re),Q.Y(im),"signal",1.4));o.push(S.D(Q.X(re),Q.Y(im),"signal",4.5));
        if(cj.get()&&w0>0){o.push(S.D(Q.X(re),Q.Y(-im),"muted",3.6));o.push(S.L(Q.X(re),Q.Y(im),Q.X(re),Q.Y(-im),"gold",1,"2 2"));}
        o.push(S.D(Q.X(re),Q.Y(0),"gold",4));}
      else o.push(S.T(Q.x+Q.w/2,Q.y+Q.h-8,"枠の外（大きさ "+_w05_sig(Math.exp(s0*t),3)+"）","middle",9,"alias",true,false,null,true));
      if(!nar){o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+40,"青: e^{λt}","start",9.5,"signal",true));
        if(cj.get()&&w0>0)o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+56,"灰: e^{λ̄t}（逆に回る）","start",9.5,"muted",true));
        o.push(S.T(Q.x+Q.w+12,Q.y+72,"金: 実部","start",9.5,"gold",true));
        o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+96,"回る速さ: ω_0","start",9.5,"muted"));
        o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+112,"半径: e^{σ_0 t}","start",9.5,"muted"));}
      /* 波形 */
      var yb=(nar?P.y+P.h+60:Math.max(P.y+P.h,Q.y+Q.h)+60),pw=nar?330:610,R=U.plot(nar?52:62,yb,pw,nar?130:150,[0,T],[-2.2,2.2]);
      o.push(R.axes({xl:"時間 t [s]",yl:"e^λt の実部",xt:U.nice(0,T,5).filter(function(v){return v<=T+1e-9;}),yt:[-2,-1,0,1,2],xfmt:function(v){return _w05_sig(v,3);},ylOff:nar?36:40}));
      o.push(_w05_tx(U,R.x,R.y-8,"e^{λt} の実部 = e^{σ_0 t} cos ω_0 t（青）と包絡線 ±e^{σ_0 t}（破線）","start",10,"ink",true));
      var wv=[],env1=[],env2=[];for(var k=0;k<=800;k++){var tq2=T*k/800,e=Math.exp(s0*tq2);wv.push([tq2,e*Math.cos(w0*tq2)]);env1.push([tq2,e]);env2.push([tq2,-e]);}
      if(w0>0){o.push(_w05_cut(R,env1,"faint",1.1,"4 3",S));o.push(_w05_cut(R,env2,"faint",1.1,"4 3",S));}
      o.push(R.line([[0,0],[T,0]],"muted",1));
      o.push(_w05_cut(R,wv,s0>0?"alias":"signal",2.2,null,S));
      o.push(S.L(R.X(t),R.y,R.X(t),R.y+R.h,"gold",1.1,"3 3"));
      if(Math.abs(re)<=2.2)o.push(S.D(R.X(t),R.Y(re),"gold",4.5));
      box.set(S.svg(Wd,R.y+R.h+44,o));
      /* 読み出し */
      var h="λ = σ<sub>0</sub> + jω<sub>0</sub> = <b>"+_w05_cs(s0,w0,3)+"</b> [1/s]"+(cj.get()&&w0>0?"、共役な点 λ̄ = "+_w05_cs(s0,-w0,3):"")+"<br>";
      var shape=s0<0?'<span class="ok">減る</span>（時定数 1/|σ<sub>0</sub>| = '+_w05_sig(1/Math.abs(s0),3)+" s ごとに 0.368 倍）":(s0>0?'<span class="warn">増え続ける</span>（'+_w05_sig(Math.log(2)/s0,3)+" s ごとに 2 倍）":"振れ幅は変わらない（虚軸の上）");
      h+="e<sup>λt</sup> の実部 e<sup>σ<sub>0</sub>t</sup> cos ω<sub>0</sub>t: "+shape+"、"+(w0>0?"揺れの周期 2π/ω<sub>0</sub> = <b>"+_w05_sig(2*Math.PI/w0,3)+" s</b>":"揺れない（実軸の上）")+"<br>";
      var sp=function(v){return v===0?"s":(v<0?"s + "+_w05_sig(-v,3):"s − "+_w05_sig(v,3));},pr=function(v){return v===0?"s":"("+sp(v)+")";};
      var den1=sp(s0)+(w0>0?" − j"+_w05_sig(w0,3):"");
      h+="変換: 𝓛[e<sup>λt</sup>] = 1/(s − λ) = "+(s0===0&&w0===0?"1/s":"1/("+den1+")");
      if(w0>0)h+="。共役な組の実部: 𝓛[e<sup>σ<sub>0</sub>t</sup> cos ω<sub>0</sub>t] = "+pr(s0)+"/("+pr(s0)+"² + "+_w05_sig(w0*w0,3)+")";
      h+="<br>時刻 t = "+_w05_f(t,2)+" s: e<sup>λt</sup> = "+_w05_cs(re,im,3)+"、実部 <b>"+_w05_sig(re,3)+"</b>";
      ro.innerHTML=h+'<div class="wnote">s 平面の × をドラッグすると、横の位置 σ<sub>0</sub>（増え方・減り方）と縦の位置 ω<sub>0</sub>（揺れの速さ）が変わる。下半分に置いても、共役な点と同じ実部になるので、ω<sub>0</sub> は 0 以上として扱う。複素平面の点は、時刻 0 の 1 から出発し、角速度 ω<sub>0</sub> で回りながら、半径が e<sup>σ<sub>0</sub>t</sup> で変わる。</div>';
    }
    draw();
  };

  /* ---- 4 節: 部分分数分解 ---- */
  /* 例: N（降べき）、groups（根と重なりの数。src は "in"（入力から来た根）か "ch"（特性根））、ODE（a 降べき、b、u(t)、初期値）、表示の倍率と単位 */
  var _W05_PF=[
    {nm:"モータのステップ応答（3 章 2 節）",Ys:"Y(s) = 12000/(s(s + 20))",N:[12000],g:[[0,0,1,"in"],[-20,0,1,"ch"]],a:[0.05,1],b:50,u:function(){return 12;},ic:[0],tEnd:0.25,sc:1,un:"rad/s",chk:[[0.05,379.3],[0.1,518.8],[0.15,570.1]],ref:"3 章 2 節の表"},
    {nm:"1 節の例: 12e^{−10t} V を加える",Ys:"Y(s) = 12000/((s + 10)(s + 20))",N:[12000],g:[[-10,0,1,"in"],[-20,0,1,"ch"]],a:[0.05,1],b:50,u:function(t){return 12*Math.exp(-10*t);},ic:[0],tEnd:0.4,sc:1,un:"rad/s",chk:[[0.0693,300]],ref:"1 節の最大 300 rad/s"},
    {nm:"モータのランプ応答（3 章 3 節）",Ys:"Y(s) = 24000/(s^2(s + 20))",N:[24000],g:[[0,0,2,"in"],[-20,0,1,"ch"]],a:[0.05,1],b:50,u:function(t){return 24*t;},ic:[0],tEnd:0.5,sc:1,un:"rad/s",chk:[[0.5,540]],ref:"3 章 3 節の 0.5 s で 540"},
    {nm:"台車のステップ応答（4 章 3 節）",Ys:"Y(s) = 1/(s(s^2 + 2s + 25))",N:[1],g:[[0,0,1,"in"],[-1,Math.sqrt(24),1,"ch"],[-1,-Math.sqrt(24),1,"ch"]],a:[1,2,25],b:1,u:function(){return 1;},ic:[0,0],tEnd:5,sc:100,un:"cm",chk:[[0.6413,6.106]],ref:"4 章の 0.64 s で 6.11 cm"},
    {nm:"台車を 4 cm 引いて離す（4 章 2 節）",Ys:"Y(s) = 0.04(s + 2)/(s^2 + 2s + 25)",N:[0.04,0.08],g:[[-1,Math.sqrt(24),1,"ch"],[-1,-Math.sqrt(24),1,"ch"]],a:[1,2,25],b:0,u:function(){return 0;},ic:[0.04,0],tEnd:5,sc:100,un:"cm",chk:[[0.6413,-2.106]],ref:"4 章の 0.64 s で −2.11 cm"},
    {nm:"臨界減衰の台車（c = 10 N·s/m、4 章 3 節）",Ys:"Y(s) = 1/(s(s + 5)^2)",N:[1],g:[[0,0,1,"in"],[-5,0,2,"ch"]],a:[1,10,25],b:1,u:function(){return 1;},ic:[0,0],tEnd:3,sc:100,un:"cm",chk:[],ref:""},
    {nm:"巻線のインダクタンスを含むモータ（過減衰、4 章 3 節）",Ys:"Y(s) = 2.4×10^7/(s(s^2 + 2000s + 40000))",N:[2.4e7],g:[[0,0,1,"in"],[-1000+Math.sqrt(960000),0,1,"ch"],[-1000-Math.sqrt(960000),0,1,"ch"]],a:[1,2000,40000],b:1,u:function(){return 2.4e7;},ic:[0,0],tEnd:0.25,sc:1,un:"rad/s",chk:[[0.05,379.3]],ref:"一次の式の 0.05 s で 379.3（参考）"},
    {nm:"自分で根を置く（ステップ応答、最終値 1）",custom:true}
  ];
  REG.w05_pf=function(el,U){
    var S=U.S,cx=U.ctl.cx;
    U.head(el,"PARTIAL FRACTIONS","部分分数分解 — 分母の根ごとの項と、その和");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",_W05_PF.map(function(e){return e.nm.replace("^{−10t}","⁻¹⁰ᵗ");}),0,function(){draw();});
    ex.el.style.flex="1 1 100%";
    var rC=U.ctrls(el);
    var md=U.select(rC,"対象の根",["共役な組（揺れる）","実数 2 つ"],0,draw);
    var ca=U.slider(rC,"根の実部 σ<sub>0</sub>",{min:-6,max:1,step:0.05,value:-1,fmt:function(v){return _w05_f(v,2)+" 1/s";},onInput:draw});
    var cb=U.slider(rC,"根の虚部 ω<sub>0</sub>",{min:0.2,max:10,step:0.05,value:4.9,fmt:function(v){return _w05_f(v,2)+" rad/s";},onInput:draw});
    var la=U.slider(rC,"根 λ<sub>a</sub>",{min:-8,max:1,step:0.05,value:-1,fmt:function(v){return _w05_f(v,2);},onInput:draw});
    var lb=U.slider(rC,"根 λ<sub>b</sub>",{min:-8,max:1,step:0.05,value:-4,fmt:function(v){return _w05_f(v,2);},onInput:draw});
    var r2=U.ctrls(el);
    var nu=U.checkbox(r2,"微分方程式を数値で解いた応答を重ねる",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（モータのステップ応答）",function(){ex.set(0);draw();});
    U.button(br,"重根にする（λ<sub>a</sub> = λ<sub>b</sub>）",function(){ex.set(_W05_PF.length-1);md.set(1);lb.set(la.get());draw();});
    var box=U.svgbox(el),ro=U.readout(el),SP=null,DR=null;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){DR=null;return;}if(x==null||!SP||!_W05_PF[ex.get()].custom)return;
      var inA=x>=SP.x-4&&x<=SP.x+SP.w+4&&y>=SP.y-4&&y<=SP.y+SP.h+4;
      if(type==="down"){if(!inA)return false;
        if(md.get()===1){var da=Math.abs(SP.X(la.get())-x),db=Math.abs(SP.X(lb.get())-x);DR=da<=db?"a":"b";}else DR="c";}
      var sx=Math.round(SP.ux(x)*20)/20,sy=Math.round(Math.abs(SP.uy(y))*20)/20;
      if(DR==="c"){ca.set(Math.max(-6,Math.min(1,sx)));cb.set(Math.max(0.2,Math.min(10,sy)));}
      else if(DR==="a")la.set(Math.max(-8,Math.min(1,sx)));else if(DR==="b")lb.set(Math.max(-8,Math.min(1,sx)));
      draw();});
    var CH=["purple","teal"];
    function setup(){
      var e=_W05_PF[ex.get()];
      if(!e.custom)return e;
      var gs,a,b,Nn,Ys,lam;
      if(md.get()===0){var s0=ca.get(),w0=cb.get();gs=[[0,0,1,"in"],[s0,w0,1,"ch"],[s0,-w0,1,"ch"]];a=[1,-2*s0,s0*s0+w0*w0];b=s0*s0+w0*w0;
        Ys="Y(s) = "+_w05_sig(b,4)+"/(s((s"+(s0<=0?" + "+_w05_sig(-s0,3):" − "+_w05_sig(s0,3))+")^2 + "+_w05_sig(w0*w0,4)+"))";}
      else{var A=la.get(),B=lb.get();if(Math.abs(A-B)<0.051)B=A;
        gs=A===B?[[0,0,1,"in"],[A,0,2,"ch"]]:[[0,0,1,"in"],[A,0,1,"ch"],[B,0,1,"ch"]];a=[1,-(A+B),A*B];b=A*B;
        var fs=function(v){return v===0?"s":(v<0?"(s + "+_w05_sig(-v,3)+")":"(s − "+_w05_sig(v,3)+")");};
        Ys="Y(s) = "+_w05_sig(b,4)+"/(s"+(A===B?fs(A)+"^2":fs(A)+fs(B))+")";}
      var unst=gs.some(function(g){return g[0]>1e-9;}),slow=Math.min.apply(null,gs.filter(function(g){return g[3]==="ch";}).map(function(g){return Math.abs(g[0])||1e-3;}));
      var tEnd=Math.max(1.5,Math.min(10,unst?4:6/slow));
      return {nm:"自分で根を置く",Ys:Ys,N:[b],g:gs,a:a,b:b,u:function(){return 1;},ic:[0,0],tEnd:tEnd,sc:1,un:"",chk:[],ref:"",custom:true};
    }
    function draw(){
      var e=setup(),isC=!!_W05_PF[ex.get()].custom;
      rC.style.display=isC?"":"none";ca.el.style.display=isC&&md.get()===0?"":"none";cb.el.style.display=isC&&md.get()===0?"":"none";
      la.el.style.display=isC&&md.get()===1?"":"none";lb.el.style.display=isC&&md.get()===1?"":"none";
      var groups=e.g.map(function(q,i){return {lam:cx.c(q[0],q[1]),m:q[2],src:q[3]};}),ci=0;
      groups.forEach(function(g){if(g.src==="in")g.c="gold";else if(g.lam.im<-1e-9)g.c=null;else{g.c=CH[ci%2];ci++;}});
      groups.forEach(function(g){if(!g.c){var mate=groups.filter(function(h){return h.c&&Math.abs(h.lam.re-g.lam.re)<1e-9&&Math.abs(h.lam.im+g.lam.im)<1e-9;})[0];g.c=mate?mate.c:"purple";}});
      var pf;try{pf=_w05_pfrac(U,e.N,groups);}catch(err){pf=null;}
      var nar=_w05_nar(box),Wd=nar?400:700,o=[];
      /* s 平面: 範囲は根に合わせる */
      var res=groups.map(function(g){return g.lam.re;}),ims=groups.map(function(g){return Math.abs(g.lam.im);});
      var xr0=Math.min.apply(null,res),xr1=Math.max.apply(null,res),big=xr0<-500;
      var span=Math.max(1,xr1-Math.min(xr0,0)),lo=big?-30:Math.min(-1,xr0)-0.22*span-0.3,hi=Math.max(xr1,0)+(big?6:0.14*span+0.3),ym=Math.max(1.2,Math.max.apply(null,ims)*1.3);
      if(isC){lo=-8.5;hi=1.5;ym=11;}
      var P=nar?U.plot(48,30,140,130,[lo,hi],[-ym,ym]):U.plot(58,30,190,190,[lo,hi],[-ym,ym]);SP=P;
      o.push(_w05_plane(U,S,P,U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),U.nice(-ym,ym,4).filter(function(v){return v>=-ym&&v<=ym;})));
      o.push(S.T(P.x,P.y-10,isC?"s 平面（× をドラッグ）":"s 平面（Y(s) の分母の根）","start",10,"ink",true));
      groups.forEach(function(g){o.push(_w05_root(S,P,g.lam,g.c,g.m,6));});
      /* 時間の波形 */
      var T=e.tEnd,sc=e.sc,ts=[],k;for(k=0;k<=500;k++)ts.push(T*k/500);
      var terms=pf?pf.filter(function(g){return g.lam.im>=-1e-9;}).map(function(g){return {g:g,pts:ts.map(function(t){return [t,sc*_w05_term(g,t)];})};}):[];
      var sum=ts.map(function(t){var v=0;if(pf)pf.forEach(function(g){v+=_w05_term(g,t);});return [t,sc*v];});
      var num=nu.get()?_w05_ode(U,e.a,e.b,e.u,e.ic,T,Math.max(2000,Math.round(T*Math.max(20,20*Math.max.apply(null,groups.map(function(g){return Math.hypot(g.lam.re,g.lam.im);}))))),300).map(function(q){return [q[0],sc*q[1]];}):[];
      var all=[];sum.forEach(function(q){all.push(q[1]);});terms.forEach(function(tm){tm.pts.forEach(function(q){all.push(q[1]);});});
      var vmax=Math.max.apply(null,all),vmin=Math.min.apply(null,all);
      if(isC){vmax=Math.min(vmax,3);vmin=Math.max(vmin,-3);}
      var pad=(vmax-vmin)*0.08||1,yl0=vmin-pad,yl1=vmax+pad;
      var px=nar?52:310,py=nar?P.y+P.h+56:30,pw=nar?330:370,ph=nar?170:190;
      var Q=U.plot(px,py,pw,ph,[0,T],[yl0,yl1]);
      o.push(Q.axes({xl:"時間 t [s]",yl:e.un?"y(t) ["+e.un+"]":"y(t)",xt:U.nice(0,T,5).filter(function(v){return v<=T+1e-9;}),yt:U.nice(yl0,yl1,5).filter(function(v){return v>=yl0&&v<=yl1;}),xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,4);},ylOff:nar?40:46}));
      if(yl0<0&&yl1>0)o.push(Q.line([[0,0],[T,0]],"muted",1));
      o.push(S.T(Q.x,Q.y-10,"各項（破線、根と同じ色）と和（青）","start",10,"ink",true));
      terms.forEach(function(tm){o.push(_w05_cut(Q,tm.pts,tm.g.c,1.6,"6 3",S));});
      if(num.length)o.push(_w05_cut(Q,num,"ink",1.2,"2 3",S));
      o.push(_w05_cut(Q,sum,"signal",2.6,null,S));
      (e.chk||[]).forEach(function(c){if(c[0]<=T)o.push(S.CIRC(Q.X(c[0]),Q.Y(c[1]),4.2,"ink",1.4,"screen"));});
      var ly=Q.y+Q.h+46,lg=[["gold","6 3","入力から来た根の項"],["purple","6 3","特性根の項"],["signal",null,"和"]];if(num.length)lg.push(["ink","2 3","数値で解いた応答"]);
      if(nar){o.push(S.LEGL(18,ly,lg.slice(0,2),9.5,12));o.push(S.LEGL(18,ly+16,lg.slice(2),9.5,12));ly+=16;}else o.push(S.LEGL(18,ly,lg,9.5,14));
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      var h="<b>"+e.Ys.replace(/\^2/g,"²").replace(/\^\{?7\}?/,"⁷")+"</b>"+(e.un?"（"+(sc===100?"m。図は cm":e.un)+"）":"")+"<br>";
      if(!pf){ro.innerHTML=h+'<span class="warn">部分分数分解を計算できない</span>';return;}
      var rows=[];
      pf.forEach(function(g){
        var lam=_w05_cs(g.lam.re,g.lam.im,4),Ast=g.A.map(function(A,k){return (g.m>1?"1/(s − λ)"+(k+1>1?"<sup>"+(k+1)+"</sup>":"")+": ":"")+_w05_cs(A.re,A.im,4);}).join("、");
        var tm,ex=function(v){return Math.abs(v)<1e-12?"":"e<sup>"+(Math.abs(v+1)<1e-12?"−":(Math.abs(v-1)<1e-12?"":_w05_sig(v,4)))+"t</sup>";};
        if(g.lam.im<-1e-9)tm="（上の組の共役）";
        else if(g.lam.im>1e-9){var A=g.A[0],B=2*A.re*sc,C=-2*A.im*sc,w=_w05_sig(g.lam.im,4);
          tm=ex(g.lam.re)+"("+_w05_sig(B,4)+" cos "+w+"t "+(C>=0?"+ ":"− ")+_w05_sig(Math.abs(C),4)+" sin "+w+"t)";}
        else{tm="";g.A.forEach(function(A,k){var v=A.re*sc/(k===2?2:1),tp=k===0?"":(k===1?"t":"t²"),e1=ex(g.lam.re),body=(tp?tp:"")+(tp&&e1?"·":"")+e1;
          var mag=_w05_sig(Math.abs(v),4),piece=(body?(Math.abs(Math.abs(v)-1)<1e-12?"":mag+"·")+body:mag);
          tm+=(tm?(v<0?" − ":" + "):(v<0?"−":""))+piece;});}
        rows.push(['<span style="color:'+U.col(g.c||"purple")+'">●</span> '+lam+(g.m>1?"（"+g.m+" つ重なる）":""),g.src==="in"?"入力":"特性根",Ast,tm]);});
      h+=U.tbl(["根 λ","どこから","留数（係数）","時間の項"+(sc===100?"（cm）":"")],rows,["left","left","left","wrap"]);
      var dmax=0;if(num.length)num.forEach(function(q){var v=0;pf.forEach(function(g){v+=_w05_term(g,q[0]);});dmax=Math.max(dmax,Math.abs(sc*v-q[1]));});
      if(num.length)h+="部分分数から求めた和と、微分方程式を 4 次のルンゲ・クッタ法で解いた応答の差: 最大 "+_w05_sig(dmax,2)+(e.un?" "+e.un:"")+"<br>";
      if(e.chk&&e.chk.length)h+="○: "+e.ref+"<br>";
      var unst=groups.some(function(g){return g.src==="ch"&&g.lam.re>1e-9;});
      if(unst)h+='<span class="warn">特性根の実部が正なので、その項は増え続ける</span>';
      else if(groups.some(function(g){return g.src==="ch"&&Math.abs(g.lam.re)<1e-9;}))h+="特性根が虚軸の上にあるので、その項は消えずに残る";
      else h+='<span class="ok">特性根の実部がすべて負なので、自由な動きの項は時間とともに消える</span>';
      ro.innerHTML=h+'<div class="wnote">留数は、部分分数の形の両辺の分母を払い、s の各次の係数を比べる連立方程式で求めた（重根も同じ方法）。共役な根の組は、2 つの項を足して実数の関数にした。「自分で根を置く」は、ステップ入力（根 0）と対象の 2 つの根 λ<sub>a</sub>・λ<sub>b</sub> で、最終値が 1 になる Y(s) = λ<sub>a</sub>λ<sub>b</sub>/{s(s − λ<sub>a</sub>)(s − λ<sub>b</sub>)}。</div>';
    }
    draw();
  };

  /* ---- 5 節: 最終値の定理 ---- */
  var _W05_LA={La:1e-3,Ra:2,Kt:0.02,J:1e-5};
  var _W05_FV=[
    {nm:"モータのステップ応答（3 章）",sYn:[12000],sYd:[1,20],un:"rad/s",sc:1,tEnd:0.25,y:function(t){return 600*(1-Math.exp(-20*t));},fs:"sY(s) = 12000/(s + 20)"},
    {nm:"台車のステップ応答（4 章）",sYn:[1],sYd:[1,2,25],un:"cm",sc:100,tEnd:5,y:function(t){var w=Math.sqrt(24);return 0.04*(1-Math.exp(-t)*(Math.cos(w*t)+Math.sin(w*t)/w));},fs:"sY(s) = 1/(s² + 2s + 25)"},
    {nm:"sin 5t",sYn:[5,0],sYd:[1,0,25],un:"",sc:1,tEnd:5,y:function(t){return Math.sin(5*t);},fs:"sY(s) = 5s/(s² + 25)"},
    {nm:"e^{0.5t}（増え続ける）",sYn:[1,0],sYd:[1,-0.5],un:"",sc:1,tEnd:5,y:function(t){return Math.exp(0.5*t);},fs:"sY(s) = s/(s − 0.5)",conv:0.5},
    {nm:"モータの位置の比例制御（目標値 1 rad、4 章 6 節）",motor:true,un:"rad",sc:1}
  ];
  REG.w05_fvt=function(el,U){
    var S=U.S;
    U.head(el,"FINAL VALUE","最終値の定理が使える場合と使えない場合");
    var r1=U.ctrls(el);
    var cs=U.select(r1,"例",_W05_FV.map(function(e){return e.nm.replace("^{0.5t}","⁰·⁵ᵗ");}),4,draw);
    cs.el.style.flex="1 1 100%";
    var rM=U.ctrls(el);
    var kp=U.slider(rM,"比例ゲイン K<sub>P</sub>",{values:[0.21,0.5,1,2,5,10,20,30,35,38,40,42,45,50,60],value:50,fmt:function(v){return v+" V/rad";},onInput:draw});
    var la=U.checkbox(rM,"巻線のインダクタンス L<sub>a</sub> を含める（3 階の式）",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（K<sub>P</sub> = 50 V/rad、L<sub>a</sub> あり）",function(){cs.set(4);kp.set(50);la.set(true);draw();});
    U.button(br,"4 章 6 節の設計（K<sub>P</sub> = 0.21 V/rad）",function(){cs.set(4);kp.set(0.21);la.set(true);draw();});
    U.button(br,"境目（K<sub>P</sub> = 40 V/rad）",function(){cs.set(4);kp.set(40);la.set(true);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function model(){
      var e=_W05_FV[cs.get()];if(!e.motor)return e;
      var c=_W05_LA,K=kp.get(),useLa=la.get(),num=[c.Kt*K],den=useLa?[c.La*c.J,c.Ra*c.J,c.Kt*c.Kt,c.Kt*K]:[c.Ra*c.J,c.Kt*c.Kt,c.Kt*K];
      var a0=den[0];num=num.map(function(v){return v/a0;});den=den.map(function(v){return v/a0;});
      var rts=U.ctl.poly.roots(den),slowest=Infinity,fast=0,unst=false;rts.forEach(function(r){var m=Math.hypot(r.re,r.im);fast=Math.max(fast,m);if(r.re<-1e-9)slowest=Math.min(slowest,-r.re);else unst=true;});
      var osc=rts.filter(function(r){return Math.abs(r.im)>1e-6;}).map(function(r){return Math.abs(r.im);});
      var tEnd=unst?Math.min(1.0,Math.max(0.2,(osc.length?12*2*Math.PI/Math.max.apply(null,osc):0.5))):Math.min(2,Math.max(0.1,5/slowest));
      /* 3 階（または 2 階）の式を 4 次のルンゲ・クッタ法で解く */
      var n=Math.min(60000,Math.max(2000,Math.ceil(tEnd*fast*25))),pts=_w05_ode(U,den,num[0],function(){return 1;},den.length===4?[0,0,0]:[0,0],tEnd,n,600);
      return {nm:e.nm,sYn:num,sYd:den,un:"rad",sc:1,tEnd:tEnd,pts:pts,fs:"sY(s) = K_t K_P/("+(useLa?"L_a J s³ + ":"")+"R_a J s² + K_t² s + K_t K_P)",motor:true,useLa:useLa,K:K};
    }
    function draw(){
      var e=model(),isM=!!e.motor;rM.style.display=isM?"":"none";
      var rts=U.ctl.poly.roots(e.sYd),ok=rts.every(function(r){return r.re<-1e-9;});
      var fv=U.ctl.poly.val(e.sYn,0)/U.ctl.poly.val(e.sYd,0),iv=e.sYn.length===e.sYd.length?e.sYn[0]/e.sYd[0]:0;
      var nar=_w05_nar(box),Wd=nar?400:700,o=[],sc=e.sc;
      /* s 平面 */
      var re=rts.map(function(r){return r.re;}),im=rts.map(function(r){return Math.abs(r.im);});
      var lo,hi,ym;if(isM){lo=-30;hi=12;ym=Math.max(30,Math.max.apply(null,im)*1.25);if(!e.useLa||Math.min.apply(null,re)>-30){lo=Math.min(-12,Math.min.apply(null,re)*1.3);}}
      else{lo=Math.min(-3,Math.min.apply(null,re)*1.3);hi=Math.max(1,Math.max.apply(null,re)+0.8);ym=Math.max(3,Math.max.apply(null,im)*1.3);}
      var P=nar?U.plot(48,30,140,130,[lo,hi],[-ym,ym]):U.plot(58,30,170,170,[lo,hi],[-ym,ym]);
      o.push(_w05_plane(U,S,P,U.nice(lo,hi,3).filter(function(v){return v>=lo&&v<=hi;}),U.nice(-ym,ym,4).filter(function(v){return v>=-ym&&v<=ym;})));
      o.push(S.T(P.x,P.y-10,"sY(s) の分母の根","start",10,"ink",true));
      rts.forEach(function(r){o.push(_w05_root(S,P,r,r.re<-1e-9?"green":"alias",1,6));});
      /* 時間の応答 */
      var T=e.tEnd,pts=e.pts||(function(){var q=[];for(var k=0;k<=600;k++){var t=T*k/600;q.push([t,e.y(t)]);}return q;})();
      pts=pts.map(function(q){return [q[0],q[1]*sc];});
      var ys=pts.map(function(q){return q[1];}),ymax=Math.max(Math.max.apply(null,ys),fv*sc),ymin=Math.min(Math.min.apply(null,ys),fv*sc,0);
      var lim=isM?4.5:(cs.get()===3?6:Infinity);ymax=Math.min(ymax,lim);ymin=Math.max(ymin,-lim+(isM?2:0));
      var pad=(ymax-ymin)*0.1||1,y0=ymin-pad,y1=ymax+pad;
      var px=nar?52:290,py=nar?P.y+P.h+56:30,pw=nar?330:390,ph=nar?150:170;
      var Q=U.plot(px,py,pw,ph,[0,T],[y0,y1]);
      o.push(Q.axes({xl:"時間 t [s]",yl:e.un?"y(t) ["+e.un+"]":"y(t)",xt:U.nice(0,T,5).filter(function(v){return v<=T+1e-9;}),yt:U.nice(y0,y1,5).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,3);},ylOff:nar?38:42}));
      if(y0<0&&y1>0)o.push(Q.line([[0,0],[T,0]],"muted",1));
      o.push(Q.line([[0,fv*sc],[T,fv*sc]],ok?"green":"alias",1.8,"6 3"));
      o.push(_w05_cut(Q,pts,"signal",pts.length>800?1.4:2.2,null,S));
      o.push(S.T(Q.x+Q.w,Q.y-10,"定理の値 "+_w05_sig(fv*sc,4)+(e.un?" "+e.un:"")+(ok?"（正しい）":"（誤り）"),"end",10,ok?"green":"alias",true));
      /* sY(s) を実数の s に対して */
      var sy0=nar?Q.y+Q.h+64:Math.max(P.y+P.h,Q.y+Q.h)+64,R=U.plot(nar?52:290,sy0,nar?330:390,nar?110:120,[0.01,1000],[0,1],{xlog:true});
      var sv=[],k2;for(k2=0;k2<=300;k2++){var s=Math.pow(10,-2+5*k2/300),v=U.ctl.poly.val(e.sYn,s)/U.ctl.poly.val(e.sYd,s);sv.push([s,v*sc]);}
      var sv2=sv.filter(function(q){return !e.conv||q[0]>e.conv*1.02;}),vv=sv2.map(function(q){return q[1];});
      var r0=Math.min(0,Math.min.apply(null,vv)),r1=Math.max(Math.max.apply(null,vv),fv*sc);if(e.conv){r1=Math.min(r1,6);}var pd=(r1-r0)*0.1||0.5;
      R=U.plot(R.x,R.y,R.w,R.h,[0.01,1000],[r0-pd,r1+pd],{xlog:true});
      if(e.conv)o.push(S.RECT(R.x,R.y,R.X(e.conv)-R.x,R.h,0,U.soft("alias"),"none",0));
      o.push(R.axes({xl:"s [1/s]（実数）",yl:"sY(s)",xt:[0.01,0.1,1,10,100,1000],yt:U.nice(r0-pd,r1+pd,3).filter(function(v){return v>=r0-pd&&v<=r1+pd;}),xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,3);},ylOff:nar?38:42}));
      o.push(R.line([[0.01,fv*sc],[1000,fv*sc]],ok?"green":"alias",1.4,"6 3"));
      o.push(_w05_cut(R,sv2,"gold",2.2,null,S));
      o.push(S.T(R.x,R.y-8,"実数の s に対する sY(s)（左端 s → 0 が定理の値）","start",10,"ink",true));
      if(e.conv)o.push(S.T(R.x+4,R.y+R.h-6,"積分が有限にならない範囲","start",9,"alias",true,false,null,true));
      if(!nar){o.push(S.T(P.x,P.y+P.h+46,ok?"実部がすべて負: 使える":"実部が 0 以上の根がある:","start",10,ok?"green":"alias",true));if(!ok)o.push(S.T(P.x,P.y+P.h+62,"使えない","start",10,"alias",true));}
      box.set(S.svg(Wd,R.y+R.h+44,o));
      /* 読み出し */
      var h="<b>"+e.fs.replace(/K_t/g,"K<sub>t</sub>").replace(/K_P/g,"K<sub>P</sub>").replace(/L_a/g,"L<sub>a</sub>").replace(/R_a/g,"R<sub>a</sub>")+"</b>"+(sc===100?"（m。図は cm）":"")+"<br>";
      h+="分母の根: "+rts.map(function(r){return '<span style="color:'+U.col(r.re<-1e-9?"green":"alias")+'">'+_w05_cs(r.re,r.im,4)+"</span>";}).join("、")+"<br>";
      h+="最終値の定理: lim<sub>s→0</sub> sY(s) = <b>"+_w05_sig(fv*sc,4)+(e.un?" "+e.un:"")+"</b> → "+(ok?'<span class="ok">根の実部がすべて負なので使える</span>':'<span class="warn">実部が 0 以上の根があるので使えない</span>')+"<br>";
      var tail=pts.filter(function(q){return q[0]>=T*0.8;}).map(function(q){return q[1];}),tmx=Math.max.apply(null,tail),tmn=Math.min.apply(null,tail);
      var beh=ok?"最後の 2 割の範囲 "+_w05_sig(tmn,4)+"〜"+_w05_sig(tmx,4)+"（落ち着いていく）":(rts.some(function(r){return r.re>1e-9;})?"振れ幅が増え続ける":"揺れ続け、落ち着かない");
      h+="y(t) の様子（"+_w05_sig(T,3)+" s まで）: "+beh+"<br>";
      h+="初期値の定理: lim<sub>s→∞</sub> sY(s) = "+_w05_sig(iv*sc,3)+" = y(0⁺)";
      if(isM){var c=_W05_LA;h+="<br>K<sub>P</sub> = "+e.K+" V/rad: "+(e.useLa?(e.K<40?"40 V/rad より小さいので、3 つの根の実部はすべて負":(e.K===40?"ちょうど境目。根 ±j200 が虚軸の上にあり、揺れ続ける":"40 V/rad を超えたので、共役な組の実部が正")):"L<sub>a</sub> を無視した二次遅れの式では、どの K<sub>P</sub> でも根の実部は −10 で負");}
      ro.innerHTML=h+'<div class="wnote">y(t) は、'+(isM?'閉ループの微分方程式を 4 次のルンゲ・クッタ法で解いた。':'4 節の方法で時間の関数に戻した式。')+'下の段は、実数の s に対する sY(s) で、2 節の「重みを付けた面積」から見ると、時刻 1/s のあたりの y(t) の重み付きの平均である。'+(e.conv?'e<sup>0.5t</sup> の変換は s > 0.5 でしか積分が有限にならない（赤い範囲では sY(s) の式に意味が無い）。':'')+'</div>';
    }
    draw();
  };

  /* ---- 6 節: 畳み込み ---- */
  var _W05_SYS=[
    {nm:"台車の速度（一次遅れ、T = 0.5 s）",g:function(t){return t<0?0:Math.exp(-2*t);},un:"m/s",sc:1,gu:"(m/s)/(N·s)",ode:"fo",L:0,Gs:"G(s) = 0.5/(0.5s + 1) = 1/(s + 2)"},
    {nm:"台車とばね・ダンパ（二次遅れ、位置）",g:function(t){var w=Math.sqrt(24);return t<0?0:Math.exp(-t)*Math.sin(w*t)/w;},un:"cm",sc:100,gu:"m/(N·s)",ode:"so",L:0,Gs:"G(s) = 1/(s² + 2s + 25)"},
    {nm:"台車の速度＋むだ時間 0.5 s",g:function(t){return t<0.5?0:Math.exp(-2*(t-0.5));},un:"m/s",sc:1,gu:"(m/s)/(N·s)",ode:"fo",L:0.5,Gs:"G(s) = e^{−0.5s}/(s + 2)"}
  ];
  var _W05_IN=[
    {nm:"三角（0 → 2 N → 0、本文の例）",u:function(t){return t<0||t>=2?0:(t<1?2*t:2*(2-t));},Us:"U(s) = 2(1 − e^{−s})²/s²"},
    {nm:"ステップ 1 N",u:function(t){return t<0?0:1;},Us:"U(s) = 1/s"},
    {nm:"パルス 2 N を 1 s（3 章 3 節）",u:function(t){return t<0||t>=1?0:2;},Us:"U(s) = 2(1 − e^{−s})/s"},
    {nm:"方形波（1 N と 0 を 1 s ごと）",u:function(t){return t<0?0:(Math.floor(t)%2===0?1:0);},Us:"U(s) = 1/(s(1 + e^{−s}))"},
    {nm:"ランプ 0.5 N/s",u:function(t){return t<0?0:0.5*t;},Us:"U(s) = 0.5/s²"}
  ];
  REG.w05_conv=function(el,U){
    var S=U.S,TE=6;
    U.head(el,"CONVOLUTION","畳み込み — 入力を裏返してずらし、インパルス応答と掛けて面積をとる");
    var r1=U.ctrls(el);
    var sy=U.select(r1,"対象",_W05_SYS.map(function(e){return e.nm;}),0,function(){sim();});
    var ip=U.select(r1,"入力（押す力）",_W05_IN.map(function(e){return e.nm;}),0,function(){sim();});
    var r2=U.ctrls(el);
    var tt=U.slider(r2,"時刻 t",{min:0,max:TE,step:0.01,value:1.5,fmt:function(v){return _w05_f(v,2)+" s";},onInput:function(){tick.stop();draw();}});
    tt.el.style.flex="1 1 100%";
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.03;if(v>=TE){v=TE;tick.stop();}tt.set(v);draw();},40);
    U.button(br,"本文の例（台車の速度・三角、t = 1.5 s）",function(){tick.stop();sy.set(0);ip.set(0);tt.set(1.5);sim();});
    U.button(br,"▶ 再生（0 から）",function(){tt.set(0);draw();tick.start();});
    U.button(br,"■ 止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),Y=null;
    /* 微分方程式を 4 次のルンゲ・クッタ法で解く（畳み込みの値と比べるため） */
    function sim(){
      var s=_W05_SYS[sy.get()],u=_W05_IN[ip.get()].u,h=0.0005,n=Math.round(TE/h),out=[[0,0]],x=[0,0];
      var f=s.ode==="fo"?function(t,q){return [(0.5*u(t-s.L)-q[0])/0.5,0];}:function(t,q){return [q[1],u(t)-2*q[1]-25*q[0]];};
      for(var k=0;k<n;k++){x=U.ctl.rk4(f,k*h,x,h);if((k+1)%20===0)out.push([(k+1)*h,x[0]*s.sc]);}
      Y=out;draw();
    }
    function conv(s,u,t){var n=Math.max(400,Math.round(t*1000)),h=t/n,v=0;if(t<=0)return 0;
      for(var k=0;k<=n;k++){var a=k*h,w=(k===0||k===n)?0.5:1;v+=w*s.g(a)*u(t-a);}return v*h*s.sc;}
    function draw(){
      if(!Y)return;
      var s=_W05_SYS[sy.get()],inp=_W05_IN[ip.get()],u=inp.u,t=tt.get(),nar=_w05_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?52:62,pw=nar?330:610,taus=[],k;for(k=0;k<=600;k++)taus.push(TE*k/600);
      /* 上: g(τ) と u(t − τ)（高さをそろえて描く） */
      var gmax=0,umax=0;taus.forEach(function(a){gmax=Math.max(gmax,Math.abs(s.g(a)));});for(k=0;k<=600;k++)umax=Math.max(umax,Math.abs(u(TE*k/600)));umax=umax||1;
      var A=U.plot(x0,26,pw,nar?80:90,[0,TE],[-0.15,1.15]);
      o.push(A.axes({yl:null,xt:[0,1,2,3,4,5,6],yt:[0,1],xfmt:function(){return "";},yfmt:function(){return "";}}));
      o.push(_w05_tx(U,A.x,A.y-10,nar?"g(τ)（紫）と、裏返してずらした入力 u(t − τ)（金）":"g(τ)（紫、インパルス応答）と u(t − τ)（金、入力を裏返して t ずらしたもの）。高さはそろえた","start",nar?9:10,"ink",true));
      o.push(A.line(taus.map(function(a){return [a,s.g(a)/gmax];}),"purple",2));
      var us=[];taus.forEach(function(a){us.push([a,u(t-a)/umax]);});
      o.push(_w05_cut(A,us,"gold",2,"5 3",S));
      o.push(S.L(A.X(t),A.y,A.X(t),A.y+A.h,"gold",1,"3 3"));o.push(S.T(A.X(t)+3,A.y+10,"τ = t（入力の始まり）","start",9,"gold",false,false,null,true));
      /* 中: 積 */
      var pr=taus.filter(function(a){return a<=t;}).map(function(a){return [a,s.g(a)*u(t-a)*s.sc];});pr.push([t,s.g(t)*u(0)*s.sc]);
      var pv=pr.map(function(q){return q[1];}),pmax=Math.max(0.05,Math.max.apply(null,pv.concat([0]))),pmin=Math.min(0,Math.min.apply(null,pv.concat([0])));
      var B=U.plot(x0,A.y+A.h+36,pw,nar?80:90,[0,TE],[pmin*1.15,pmax*1.15]);
      o.push(B.axes({xl:"τ [s]（何秒前か）",yl:null,xt:[0,1,2,3,4,5,6],yt:U.nice(pmin,pmax,2).filter(function(v){return v>=pmin*1.15&&v<=pmax*1.15;}),xfmt:function(v){return String(v);},yfmt:function(v){return _w05_sig(v,2);}}));
      if(pr.length>1){o.push(_w05_fill(B,pr,"signal",U,0.9));o.push(B.line(pr,"signal",2));}
      var yc=conv(s,u,t);
      o.push(S.T(B.x+B.w,B.y-6,"積 g(τ)u(t − τ) の面積 = "+_w05_f(yc,3)+" "+s.un,"end",10,"signal",true));
      /* 下: y(t) */
      var yv=Y.map(function(q){return q[1];}),ymx=Math.max.apply(null,yv),ymn=Math.min(0,Math.min.apply(null,yv)),pd=(ymx-ymn)*0.1||0.1;
      var C=U.plot(x0,B.y+B.h+58,pw,nar?110:120,[0,TE],[ymn-pd,ymx+pd]);
      o.push(C.axes({xl:"時間 t [s]",yl:"y ["+s.un+"]",xt:[0,1,2,3,4,5,6],yt:U.nice(ymn-pd,ymx+pd,4).filter(function(v){return v>=ymn-pd&&v<=ymx+pd;}),xfmt:function(v){return String(v);},yfmt:function(v){return _w05_sig(v,3);},ylOff:nar?36:40}));
      o.push(S.T(C.x,C.y-10,nar?"出力 y(t)（青: 畳み込み、点線: 微分方程式の解）":"出力 y(t)（青: 時刻 t まで描いた畳み込み、点線: 微分方程式の解）","start",nar?9:10,"ink",true));
      o.push(C.line(Y,"faint",1.4,"2 3"));
      o.push(C.line(Y.filter(function(q){return q[0]<=t+1e-9;}),"signal",2.4));
      o.push(S.D(C.X(t),C.Y(yc),"signal",5));
      box.set(S.svg(Wd,C.y+C.h+40,o));
      var yo=Y[Math.min(Y.length-1,Math.round(t/0.01))][1];
      var h="時刻 t = "+_w05_f(t,2)+" s: 畳み込み ∫ g(τ)u(t − τ)dτ = <b>"+_w05_f(yc,3)+" "+s.un+"</b>、微分方程式を数値で解いた値 "+_w05_f(yo,3)+" "+s.un+"<br>";
      h+="変換すると掛け算: Y(s) = G(s)U(s)。"+s.Gs.replace("e^{−0.5s}","e<sup>−0.5s</sup>")+"、"+inp.Us.replace(/e\^\{(.*?)\}/g,"e<sup>$1</sup>")+"<br>";
      h+="インパルス応答 g(t) の単位は "+s.gu+(s.L?"。むだ時間の分だけ g(τ) が遅れて始まるので、"+s.L+" s より前の入力は、まだ出力に効かない":"");
      ro.innerHTML=h+'<div class="wnote">τ は「何秒前か」を表す。τ 秒前の入力 u(t − τ) に、対象がそれを覚えている重み g(τ) を掛けて足し合わせたもの（積の面積）が、時刻 t の出力になる。初期値は 0。面積は台形の公式（1 ms ごとの点）で、微分方程式は 4 次のルンゲ・クッタ法（刻み 0.5 ms）で求めた。</div>';
    }
    sim();
  };
