/* ===== 14 章 時刻と 1PPS — GNSS で時計を合わせる ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w14_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w14_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 3 桁ごとに空白を入れた整数 */
function _w14_g(v){var s=String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g," ");return (v<0?"−":"")+s;}
/* 時間を見やすい単位で（s を受け取る） */
function _w14_t(s){var a=Math.abs(s);if(a<1e-6)return _w14_f(s*1e9,a<1e-8?2:1)+" ns";if(a<1e-3)return _w14_f(s*1e6,a<1e-5?2:1)+" µs";if(a<1)return _w14_f(s*1e3,a<1e-2?2:1)+" ms";return _w14_f(s,2)+" s";}
var _W14_T0=50;   /* 例の時刻 09:27:50 UTC（10 章・12 章の例の文） */
function _w14_hms(s){var t=_W14_T0+s,m=27+Math.floor(t/60);t=((t%60)+60)%60;return "09:"+(m<10?"0":"")+m+":"+(t<10?"0":"")+Math.floor(t);}

/* ---- 2 節: 1PPS と文の時間の並び（どのパルスに何秒の名前が付くか） ---- */
var _W14_SETS=[{nm:"12 章の例（GPS だけ・7 文・426 B）",bytes:426},{nm:"10 章の例（GPS と GLONASS・11 文・626 B）",bytes:626}];
var _W14_GGA=73;   /* どちらの例も GGA は 73 B（$ から CR LF まで） */
/* 1 秒に rate 回の文の組を、捨てずに順に送るときの組の並び（本文の図と同じ待ち行列） */
function _w14_queue(rate,T,baud,bytes,lat){var out=[],end=-1e9,n=Math.floor(T*rate+1e-9);
  for(var i=0;i<=n;i++){var e=i/rate,st=Math.max(e+lat,end);end=st+bytes*10/baud;out.push({e:e,st:st,en:end,whole:Math.abs(e-Math.round(e))<1e-9,gga:st+_W14_GGA*10/baud});}
  return out;}
REG.w14_pps=function(el,U){
  var S=U.S;
  U.head(el,"PPS AND SENTENCES","1PPS と文の時間の並び — どのパルスに何秒の名前が付くか");
  var r1=U.ctrls(el);
  var set=U.select(r1,"出す文",_W14_SETS.map(function(s){return s.nm;}),1,function(){stop();draw();});
  var bd=U.slider(r1,"ボーレート",{values:[4800,9600,38400,115200],value:9600,fmt:function(v){return _w14_g(v)+" bit/s";},onInput:function(){stop();draw();}});
  var r2=U.ctrls(el);
  var rt=U.slider(r2,"更新レート",{values:[1,2,5,10],value:1,fmt:function(v){return v+" Hz（1 秒に "+v+" 回）";},onInput:function(){stop();draw();}});
  var lt=U.slider(r2,"文が出始めるまでの遅れ",{min:0.02,max:0.6,step:0.01,value:0.12,fmt:function(v){return _w14_f(v,2)+" s";},onInput:function(){stop();draw();}});
  var br=U.btnrow(el),cur=null,tk=U.ticker(function(){cur+=0.05;if(cur>=win()){cur=null;tk.stop();}draw();},40);
  function setAll(a,b,c,d){set.set(a);bd.set(b);rt.set(c);lt.set(d);stop();draw();}
  U.button(br,"本文の例（626 B・9600 bit/s・1 Hz）",function(){setAll(1,9600,1,0.12);});
  U.button(br,"図の (b)（1 秒に 2 回）",function(){setAll(1,9600,2,0.12);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){stop();draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function stop(){tk.stop();cur=null;}
  function win(){return _w14_nar(box)?5:8;}
  function draw(){
    var nar=_w14_nar(box),Wd=nar?400:700,T=win(),s=set.get(),bytes=_W14_SETS[s].bytes,baud=bd.get(),rate=rt.get(),lat=lt.get(),q=_w14_queue(rate,T+1,baud,bytes,lat);
    var now=cur==null?T+0.2:cur,x0=nar?62:84,w=Wd-x0-10,X=function(t){return x0+(t+0.2)/(T+0.4)*w;},o=[];
    var y0=14;
    o.push(S.T(nar?4:10,y0+2,"いま "+(cur==null?"（全部を表示）":_w14_hms(Math.floor(now))+" + "+_w14_f(now-Math.floor(now),2)+" s"),"start",10,"muted"));
    /* 秒の目盛 */
    var ya=y0+18,yb=ya+92;
    for(var k=0;k<=T;k++){o.push(S.L(X(k),ya,X(k),yb,"faint",1,"3 3"));o.push(S.T(X(k),yb+14,(nar?":"+(_W14_T0+k):_w14_hms(k)),"middle",9,"muted"));}
    /* 1PPS */
    var yp=ya+24,pts=[[X(-0.2),yp]];
    for(var k2=0;k2<=T;k2++){if(k2>now)break;pts.push([X(k2),yp]);pts.push([X(k2),yp-18]);var e2=Math.min(k2+0.1,now);pts.push([X(e2),yp-18]);pts.push([X(e2),yp]);}
    pts.push([X(Math.min(now,T+0.2)),yp]);
    o.push(S.PL(pts,"green",2));
    o.push(S.T(x0-6,yp-6,"1PPS","end",10,"green",true));
    /* 文 */
    var yt=yp+16;o.push(S.T(x0-6,yt+13,nar?"文":"文（TXD）","end",10,"gold",true));
    var rows=[];
    q.forEach(function(b){if(b.st>T+0.2||b.st>now)return;var en=Math.min(b.en,T+0.2,now);
      o.push(S.RECT(X(b.st),yt,Math.max(1,X(en)-X(b.st)-1),18,2,U.soft(b.whole?"gold":"muted"),b.whole?"gold":"muted",1));
      if(X(en)-X(b.st)>(nar?30:44))o.push(S.T(X(b.st)+3,yt+13,(_W14_T0+Math.floor(b.e))+"."+_w14_f((b.e-Math.floor(b.e))*100,0).replace(/^(\d)$/,"0$1"),"start",9,b.whole?"gold":"muted",true,true));
      if(b.whole&&b.gga<=T+0.2){var kk=Math.floor(b.gga),ok=kk===Math.round(b.e);rows.push({e:b.e,g:b.gga,k:kk,ok:ok});
        if(b.gga<=now){var c=ok?"green":"alias";o.push(S.D(X(b.gga),yt+26,c,3));o.push(S.L(X(b.gga),yt+26,X(kk)+2,yp-16,c,1.2,ok?null:"4 2"));
          if(!ok)o.push(S.T(X(kk)-4,yp-22,":"+(_W14_T0+Math.round(b.e))+" と誤る","end",9,"alias",true,false,null,true));}}});
    if(nar){o.push(S.T(6,yb+30,"線: GGA が届き終わった時刻 → 直前のパルス","start",9,"muted"));o.push(S.T(6,yb+43,"（文の時刻を名前にする。緑は正しい、赤は誤り）","start",9,"muted"));}
    else o.push(S.T(x0,yb+30,"線: GGA が届き終わった時刻 → その直前のパルスに、文の時刻を名前として付ける（緑は正しい、赤は誤り）","start",9.5,"muted"));
    if(cur!=null)o.push(S.L(X(now),ya-4,X(now),yb,"signal",1.4));
    box.set(S.svg(Wd,yb+(nar?52:40),o));
    /* 読み出し */
    var tx=bytes*10/baud,load=rate*tx,mx=0,bad=null;
    rows.forEach(function(r){mx=Math.max(mx,r.g-r.e);if(!r.ok&&bad==null)bad=r;});
    var h="1 回分 <b>"+bytes+" B</b>、送る時間 <b>"+_w14_f(tx,3)+" s</b>、負荷率 <b>"+_w14_f(load*100,0)+" %</b>"+(load>1?"（<span class=\"warn\">送り切れず、文がたまっていく</span>）":"")+"<br>";
    h+="パルスから GGA が届き終わるまで: 最初 <b>"+_w14_f(rows.length?rows[0].g-rows[0].e:0,3)+" s</b>、この "+T+" 秒の中で最大 <b>"+_w14_f(mx,3)+" s</b>。";
    h+=bad?" <span class=\"warn\">"+_w14_hms(bad.k)+" のパルスに "+_w14_hms(Math.round(bad.e))+" と付けてしまう（1 秒以上遅れた）</span>":" <span class=\"ok\">どのパルスにも正しい名前が付く（1 秒より短い）</span>";
    var tb=nar?U.tbl(["パルス","付けた名前","判定（届くまで）"],rows.slice(0,5).map(function(r){return [_w14_hms(r.k),_w14_hms(Math.round(r.e)),(r.ok?"<span class=\"ok\">正しい</span>":"<span class=\"warn\">ずれる</span>")+"（"+_w14_f(r.g-r.e,2)+" s）"];}),["left","left","left"])
      :U.tbl(["パルス（本当の秒）","付けた名前","パルスから届くまで","判定"],rows.slice(0,8).map(function(r){return [_w14_hms(r.k),_w14_hms(Math.round(r.e)),_w14_f(r.g-r.e,3)+" s",r.ok?"<span class=\"ok\">正しい</span>":"<span class=\"warn\">1 秒以上ずれる</span>"];}),["left","left","right","left"]);
    ro.innerHTML=h+tb+'<div class="wnote">文は、位置を求めた時刻（1 秒に何回か）から「遅れ」の後に出始め、前の組を送り終えるまで待って順に送るとした（捨てない製品の例）。GGA は 73 B で、それが届き終わった時刻に名前を付ける。.00 以外の時刻（1 秒に 2 回以上のときの途中の組）は名前に使わない。名前の付け方の実装は 15 章。</div>';
  }
  draw();
};

/* ---- 3 節: PI で時計を合わせる（本文の式と同じ計算。T_p = 1 s） ---- */
/* o: rm（水晶の誤差、無次元）・a = K_P T_p・b = K_I T_p²・sig（パルスと捕獲の誤差 [s]）・init（2 つ目のパルスで周波数を測る）・n・seed。
   δt[k+1] = δt[k] + rm − r̂[k]、r̂[k] = r0 + a·m[k] + b·Σ m[j]（m は測ったずれ = δt + 雑音） */
function _w14_pi(U,o){var rng=U.rng(o.seed),d=0,s=0,r0=0,D=[],R=[],M=[],RI=[],div=false;
  var n0=o.sig?rng.normal()*o.sig:0;
  if(o.init){var n1=o.sig?rng.normal()*o.sig:0;r0=o.rm+(n1-n0);d=-n1;}
  for(var k=0;k<o.n;k++){var m=d+(o.sig?rng.normal()*o.sig:0);s+=m;var r=r0+o.a*m+o.b*s;
    D.push(d);R.push(r);M.push(m);RI.push(r0+o.b*s);d=d+o.rm-r;if(Math.abs(d)>1e3){d=Math.sign(d)*1e3;div=true;}}
  return {d:D,r:R,m:M,ri:RI,div:div};}
function _w14_roots(a,b){var p=-(2-a-b),q=1-a,dis=p*p-4*q;
  if(dis>=0){var s=Math.sqrt(dis);return {re:true,z:[(-p+s)/2,(-p-s)/2],mag:Math.max(Math.abs((-p+s)/2),Math.abs((-p-s)/2))};}
  return {re:false,z:[-p/2,Math.sqrt(-dis)/2],mag:Math.sqrt(q)};}
REG.w14_discipline=function(el,U){
  var S=U.S;
  U.head(el,"CLOCK DISCIPLINE","PI で時計を合わせる — ずれの収まり方と、安定なゲインの範囲");
  var r1=U.ctrls(el);
  var rm=U.slider(r1,"水晶の周波数の誤差 r<sub>m</sub>",{min:-50,max:50,step:0.5,value:20,fmt:function(v){return _w14_f(v,1)+" ppm";},onInput:function(){run();}});
  var kp=U.slider(r1,"K<sub>P</sub>T<sub>p</sub>（比例）",{min:0.02,max:2.2,step:0.01,value:0.25,fmt:function(v){return _w14_f(v,v<0.1?3:2);},onInput:function(){run();}});
  var ki=U.slider(r1,"K<sub>I</sub>T<sub>p</sub><sup>2</sup>（積分）",{min:0,max:2.12,step:0.001,value:Math.sqrt(1/32),fmt:function(v){var b=v*v;return b===0?"0（P だけ）":(+b.toPrecision(4)).toString();},onInput:function(){run();}});
  var r2=U.ctrls(el);
  var sg=U.slider(r2,"パルスと捕獲の誤差 σ",{values:[0,1,3,10,30,100,300],value:0,fmt:function(v){return v+" ns";},onInput:function(){run();}});
  var ini=U.checkbox(r2,"2 つ目のパルスで周波数を測る（本文のコード）",false,function(){run();});
  var br=U.btnrow(el),seed=1,cur=null,R=null,L=null,N=121;
  var tk=U.ticker(function(){cur+=1;if(cur>=N-1){cur=null;tk.stop();}draw();},50);
  function setAll(r,a,b,s,i){rm.set(r);kp.set(a);ki.set(Math.sqrt(b));sg.set(s);ini.set(i);run();}
  U.button(br,"本文の例（図の (b)）",function(){setAll(20,0.25,1/32,0,false);});
  U.button(br,"P だけ",function(){setAll(20,0.25,0,0,false);});
  U.button(br,"I を強く",function(){setAll(20,0.25,0.25,0,false);});
  U.button(br,"不安定",function(){setAll(20,0.25,4.2,0,false);});
  U.button(br,"雑音 30 ns・本文のコード",function(){setAll(20,0.25,1/32,30,true);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){tk.stop();cur=null;draw();});
  U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
  var box=U.svgbox(el),ro=U.readout(el),PA=null;
  function par(n){var b=ki.get();return {rm:rm.get()*1e-6,a:kp.get(),b:b*b,sig:sg.get()*1e-9,init:ini.get(),n:n||N,seed:seed};}
  function run(){tk.stop();cur=null;R=_w14_pi(U,par());var o=par(3000);L=o.sig>0?_w14_pi(U,o):null;draw();}
  /* 安定な範囲の図で点をドラッグして、2 つのゲインを動かす */
  U.ctl.drag(box,function(type,x,y){if(!PA)return false;if(type==="down"&&!(x>=PA.x-6&&x<=PA.x+PA.w+6&&y>=PA.y-6&&y<=PA.y+PA.h+6))return false;
    if(type==="up")return;var a=Math.max(0.02,Math.min(2.2,PA.ux(x))),sb=Math.max(0,Math.min(2.12,PA.uy(y)));kp.set(+a.toFixed(2));ki.set(+sb.toFixed(3));run();});
  function draw(){
    var nar=_w14_nar(box),Wd=nar?400:700,o=par(),rt=_w14_roots(o.a,o.b),kc=cur==null?N-1:cur,s=[];
    /* (a) 安定な範囲 */
    var ax=nar?52:62,ay=24,aw=nar?140:190,ah=nar?150:190;PA=U.plot(ax,ay,aw,ah,[0,2.2],[0,Math.sqrt(4.6)]);
    s.push(S.T(nar?4:10,14,"(a) 安定な範囲（点をドラッグ）","start",10.5,"ink",true));
    var yt=[0,1/32,0.25,1,2,4],ylab=["0","1/32","0.25","1","2","4"];
    s.push(PA.axes({xl:"K_P T_p",xt:[0,1,2],yt:yt.map(Math.sqrt),xfmt:function(v){return String(v);},yfmt:function(v){var i=0,bd=9;yt.forEach(function(q,j){if(Math.abs(Math.sqrt(q)-v)<bd){bd=Math.abs(Math.sqrt(q)-v);i=j;}});return ylab[i];},sz:9}));
    s.push(S.TX(ax-40,ay+ah/2,"K_I T_p^2","middle",9.5,"muted",false,false,-90));
    var poly=[];for(var i=0;i<=60;i++){var xx=2*i/60;poly.push([PA.X(xx),PA.Y(Math.sqrt(Math.max(0,4-2*xx)))]);}poly.push([PA.X(2),PA.Y(0)]);poly.push([PA.X(0),PA.Y(0)]);
    s.push(S.PL(poly,"green",1.2,U.soft("green")));
    var lo=[],hi=[];for(var j=0;j<=40;j++){var x2=j/40;lo.push([PA.X(x2),PA.Y(1-Math.sqrt(1-x2))]);hi.push([PA.X(x2),PA.Y(1+Math.sqrt(1-x2))]);}
    s.push(S.PL(lo.concat(hi.reverse()),"green",1,"var(--screen)","4 3",0.55));
    s.push(S.T(PA.X(1.5),PA.Y(1.75),"不安定","middle",9.5,"alias",true,false,null,true));
    var stable=o.a>0&&o.b>0&&o.b<4-2*o.a,lim=o.b===0||Math.abs(o.b-(4-2*o.a))<1e-9;
    var pc=stable?"gold":(o.b===0?"muted":"alias");
    s.push(S.D(PA.X(o.a),PA.Y(Math.sqrt(o.b)),pc,5.5));s.push(S.CIRC(PA.X(o.a),PA.Y(Math.sqrt(o.b)),9,pc,1.4));
    /* (b) ずれ、(c) 周波数の補正 */
    var bx=nar?52:330,by=nar?ay+ah+58:24,bw=nar?336:360,bh=nar?150:118;
    var D=R.d,mx=0;D.forEach(function(v){if(isFinite(v))mx=Math.max(mx,Math.abs(v));});
    var lim2=Math.min(1e3,Math.max(1e-7,mx*1.15)),un=lim2<2e-6?1e9:(lim2<2e-3?1e6:1e3),ul=un===1e9?"ns":(un===1e6?"µs":"ms");
    var ymax=lim2*un,P=U.plot(bx,by,bw,bh,[0,N-1],[-ymax,ymax]);
    s.push(S.TX(bx-(nar?48:40),by-10,"(b) マイコンの時計のずれ δt_m","start",10.5,"ink",true));
    s.push(P.axes({yl:"δt_m ["+ul+"]",xt:[0,20,40,60,80,100,120],xfmt:function(v){return "";},yfmt:function(v){return U.sig(v,3);},ny:4,sz:9}));
    s.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
    /* 包絡線（根が複素数のとき）: δt[k] = 2 Re(A z^k) の 2|A||z|^k */
    var env=null;
    if(!rt.re&&!o.init&&o.sig===0&&Math.abs(D[2])>0){var zr=rt.z[0],zi=rt.z[1],c1=D[1],c2=D[2];
      /* A = (d2 − z̄ d1)/((z − z̄) z) */
      var nr=c2-zr*c1,ni=zi*c1,dr=0,di=2*zi;var qr=(nr*dr+ni*di)/(dr*dr+di*di),qi=(ni*dr-nr*di)/(dr*dr+di*di);var m2=zr*zr+zi*zi,Ar=(qr*zr+qi*zi)/m2,Ai=(qi*zr-qr*zi)/m2;
      var amp=2*Math.hypot(Ar,Ai);env=[];for(var k3=0;k3<N;k3++)env.push([k3,amp*Math.pow(rt.mag,k3)*un]);
      s.push(P.clip(env,"gold",1,"4 3"));s.push(P.clip(env.map(function(p){return [p[0],-p[1]];}),"gold",1,"4 3"));}
    if(o.sig>0){var mp=[];for(var k4=0;k4<=kc;k4++)mp.push(S.D(P.X(k4),P.Y(Math.max(-ymax,Math.min(ymax,R.m[k4]*un))),"teal",1.6));s.push(mp.join(""));}
    var dp=[];for(var k5=0;k5<=kc;k5++){dp.push([k5,D[k5]*un]);if(Math.abs(D[k5])*un>ymax*1.5)break;}
    s.push(P.clip(dp,pc==="muted"?"muted":(stable?"gold":"alias"),2.2));
    if(cur!=null)s.push(S.L(P.X(kc),P.y,P.X(kc),P.y+P.h,"signal",1.2));
    var Q=U.plot(bx,by+bh+30,bw,nar?90:84,[0,N-1],[Math.min(0,o.rm*1e6)-Math.abs(o.rm*1e6)*0.6-1,Math.max(0,o.rm*1e6)+Math.abs(o.rm*1e6)*0.6+1]);
    s.push(S.TX(bx-(nar?48:40),Q.y-8,"(c) 周波数の補正 r̂ [ppm]（破線は r_m）","start",10.5,"ink",true));
    s.push(Q.axes({xl:"パルスの番号 k（秒）",xt:[0,20,40,60,80,100,120],xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},ny:3,sz:9}));
    s.push(S.L(Q.x,Q.Y(o.rm*1e6),Q.x+Q.w,Q.Y(o.rm*1e6),"alias",1,"5 3"));
    var rp=[];for(var k6=0;k6<=kc;k6++){rp.push([k6,R.r[k6]*1e6]);if(Math.abs(R.r[k6]*1e6)>1e4)break;}
    s.push(Q.clip(rp,"gold",1.8));
    if(cur!=null)s.push(S.L(Q.X(kc),Q.y,Q.X(kc),Q.y+Q.h,"signal",1.2));
    box.set(S.svg(Wd,Q.y+Q.h+40,s));
    /* 読み出し */
    var h="根 z: "+(rt.re?"<b>"+_w14_f(rt.z[0],3)+"</b> と <b>"+_w14_f(rt.z[1],3)+"</b>（実数）":"<b>"+_w14_f(rt.z[0],3)+" ± j"+_w14_f(rt.z[1],3)+"</b>（複素数）")+"、|z| の大きい方 <b>"+_w14_f(rt.mag,3)+"</b>: ";
    if(o.b===0)h+="<span class=\"warn\">根の 1 つが 1（I が無い）。ずれは r<sub>m</sub>/K<sub>P</sub> = "+_w14_t(Math.abs(o.rm)/o.a)+" に止まって消えない</span>";
    else if(!stable)h+="<span class=\"warn\">不安定（安定の条件 K<sub>I</sub>T<sub>p</sub><sup>2</sup> &lt; 4 − 2K<sub>P</sub>T<sub>p</sub> = "+_w14_f(4-2*o.a,2)+" を外れた）</span>";
    else h+="<span class=\"ok\">安定</span>。振れ幅は 1 秒に <b>"+_w14_f(rt.mag,3)+"</b> 倍、1/100 になるまで <b>"+_w14_f(Math.log(100)/Math.log(1/rt.mag),1)+" s</b>（式）";
    h+="<br>";
    if(!R.div&&o.sig===0){var pk=0,kp2=0;D.forEach(function(v,k){if(Math.abs(v)>Math.abs(pk)){pk=v;kp2=k;}});
      var st=-1;if(stable&&Math.abs(pk)>0){for(var k7=N-1;k7>=0;k7--){if(Math.abs(D[k7])>=Math.abs(pk)/100){st=k7+1;break;}}}
      h+=Math.abs(pk)>0?"シミュレーション: 最大のずれ <b>"+_w14_t(pk)+"</b>（"+kp2+" s）"+(stable&&st>0&&st<N?"、その 1/100 以下に収まるのは <b>"+st+" s</b> から":""):"シミュレーション: ずれは初めから 0（周波数を測って I の分に入れた）";}
    else if(R.div)h+="<span class=\"warn\">シミュレーション: ずれが発散した</span>";
    if(L&&!L.div&&stable){var a1=0,a2=0,b1=0,b2=0,n=0;for(var k8=500;k8<L.d.length;k8++){a1+=L.d[k8];a2+=L.d[k8]*L.d[k8];var e=L.ri[k8]-o.rm;b1+=e;b2+=e*e;n++;}
      var sd=Math.sqrt(Math.max(0,a2/n-(a1/n)*(a1/n))),sr=Math.sqrt(Math.max(0,b2/n-(b1/n)*(b1/n)));
      h+="<br>雑音 σ = "+sg.get()+" ns のとき（3000 回、500 回目から）: 本当のずれの標準偏差 <b>"+_w14_t(sd)+"</b>、I の分で覚えた周波数の誤差の標準偏差 <b>"+_w14_f(sr*1e6,4)+" ppm</b>（衛星が見えない間の時計に使う。5 節）";}
    ro.innerHTML=h+'<div class="wnote">本文 3 節の式（T<sub>p</sub> = 1 s）を 1 秒ずつ計算した。初めは時刻を合わせた直後で、ずれ 0・周波数の補正 0 とし、「2 つ目のパルスで周波数を測る」では、1 秒の数で測った r<sub>m</sub>（パルスの誤差を含む）を初めの補正にした。(b) の金色の破線は、根が複素数のときの振れ幅 C|z|<sup>k</sup>、青緑の点は雑音を含む測ったずれ。積分のつまみは、縦軸と同じ平方根の目盛で動く。</div>';
  }
  run();
};

/* ---- 4 節: 量子化誤差の鋸の歯（本文の式: q_k = T_q (round(x_k) − x_k)、x_k の端数 = x0 + kν） ---- */
function _w14_q(x0,nu,k,tq){var f=((x0+k*nu)%1+1)%1;return f<0.5?-f*tq:(1-f)*tq;}
REG.w14_sawtooth=function(el,U){
  var S=U.S;
  U.head(el,"SAWTOOTH","量子化誤差の鋸の歯 — 刻みと秒の頭の並び方と、補正値");
  var r1=U.ctrls(el);
  var fq=U.slider(r1,"受信機のクロック f<sub>q</sub>",{values:[24,48,100,250],value:48,fmt:function(v){return v+" MHz（"+_w14_f(1000/v,1)+" ns）";},onInput:function(){run();}});
  var rr=U.slider(r1,"受信機の発振器の誤差 r<sub>rx</sub>",{min:0.4,max:0.6,step:0.0001,value:0.501,fmt:function(v){return _w14_f(v,4)+" ppm";},onInput:function(){run();}});
  var r2=U.ctrls(el);
  var sg=U.slider(r2,"解の誤差 σ（2 節）",{values:[0,1,3,10.5],value:0,fmt:function(v){return v+" ns";},onInput:function(){run();}});
  var cp=U.select(r2,"マイコンの捕獲の刻み",["無し（理想）","1 ns","10 ns","100 ns（10 MHz）"],0,function(){run();});
  var cor=U.checkbox(r2,"補正値を引く",false,function(){run();});
  var br=U.btnrow(el),seed=1,cur=null,Dt=null,N=121;
  var tk=U.ticker(function(){cur+=1;if(cur>=N-1){cur=null;tk.stop();}draw();},300);
  function setAll(f,r){fq.set(f);rr.set(r);run();}
  U.button(br,"本文の例（<i>ν</i> = 0.048）",function(){fq.set(48);rr.set(0.501);sg.set(0);cp.set(0);cor.set(false);run();});
  U.button(br,"<i>ν</i> ≈ 0.5",function(){setAll(48,0.5104);});
  U.button(br,"<i>ν</i> ≈ 0（とどまる）",function(){setAll(48,0.50002);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){tk.stop();cur=null;draw();});
  U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
  var box=U.svgbox(el),ro=U.readout(el);
  function run(){tk.stop();cur=null;var o=par(),rng=U.rng(seed),q=[],raw=[],corr=[];
    for(var k=0;k<N;k++){var qk=_w14_q(0.3,o.nu,k,o.tq),n=o.sig?rng.normal()*o.sig:0,c=o.dc?(rng.next()-0.5)*o.dc:0;q.push(qk);raw.push(qk+n+c);corr.push(n+c);}
    Dt={q:q,raw:raw,corr:corr};draw();}
  function par(){var f=fq.get(),r=rr.get(),x=f*r;return {f:f,r:r,tq:1000/f,nu:x-Math.floor(x),nf:x,sig:sg.get(),dc:[0,1,10,100][cp.get()],cor:cor.get()};}
  function draw(){
    var nar=_w14_nar(box),Wd=nar?400:700,o=par(),k=cur==null?0:cur,s=[];
    /* (a) 秒の頭 k の近くの刻み */
    s.push(S.T(nar?4:10,14,"(a) "+(cur==null?"k = 0":"k = "+k)+" の秒の頭（緑）と、クロックの刻み（灰）とパルス（青）","start",10.5,"ink",true));
    var cx=Wd/2,half=Wd/2-30,sc=half/(1.6*o.tq),ya=50,f=((0.3+k*o.nu)%1+1)%1;
    s.push(S.L(cx-half,ya,cx+half,ya,"muted",1));
    for(var m=-3;m<=4;m++){var t=(m-f)*o.tq;if(Math.abs(t)>1.6*o.tq)continue;s.push(S.L(cx+t*sc,ya-8,cx+t*sc,ya+8,"muted",1.4));}
    var qk=_w14_q(0.3,o.nu,k,o.tq);
    s.push(S.L(cx+qk*sc,ya-14,cx+qk*sc,ya+12,"signal",3));
    s.push(S.L(cx,ya-16,cx,ya+14,"green",2));
    s.push(S.DARR(cx,ya+20,cx+qk*sc,ya+20,"alias",1.1,5));
    s.push(S.TX(cx+qk*sc+(qk>=0?6:-6),ya+34,"q_"+k+" = "+_w14_f(qk,2)+" ns",qk>=0?"start":"end",10,"alias",true,true));
    s.push(S.T(cx-half,ya+34,"−"+_w14_f(1.6*o.tq,1)+" ns","start",9,"muted"));s.push(S.T(cx+half,ya+34,"+"+_w14_f(1.6*o.tq,1)+" ns","end",9,"muted"));
    /* (b) 1 秒ごとの誤差 */
    var by=ya+(nar?84:70),P=U.plot(nar?48:62,by,nar?340:620,nar?140:150,[0,N-1],[-Math.max(12,o.tq*0.6+3*o.sig+(o.dc?o.dc*0.55:0)),Math.max(12,o.tq*0.6+3*o.sig+(o.dc?o.dc*0.55:0))]);
    if(nar){s.push(S.T(4,by-22,"(b) 1 秒ごとのパルスの時刻の誤差","start",10.5,"ink",true));s.push(S.T(4,by-9,"赤: 測った値、緑: 補正値を引いた後、金の破線: 60 秒の平均","start",9,"muted"));}
    else s.push(S.T(10,by-10,"(b) 1 秒ごとのパルスの時刻の誤差（赤: 測った値、緑: 補正値を引いた後、金の破線: 60 秒の平均）","start",10.5,"ink",true));
    s.push(P.axes({xl:"時間 [s]",yl:"誤差 [ns]",xt:[0,20,40,60,80,100,120],xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},ny:4,sz:9}));
    s.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
    [o.tq/2,-o.tq/2].forEach(function(v){s.push(S.L(P.x,P.Y(v),P.x+P.w,P.Y(v),"faint",0.8,"3 3"));});
    var lim=P.yr[1],dots=[];
    function clampy(v){return Math.max(-lim,Math.min(lim,v));}
    for(var i=0;i<N;i++){dots.push(S.D(P.X(i),P.Y(clampy(Dt.raw[i])),"alias",o.cor?1.4:2));if(o.cor)dots.push(S.D(P.X(i),P.Y(clampy(Dt.corr[i])),"green",1.9));}
    s.push(dots.join(""));
    var src=o.cor?Dt.corr:Dt.raw,avg=[];for(var j=59;j<N;j++){var a=0;for(var jj=j-59;jj<=j;jj++)a+=src[jj];avg.push([j,a/60]);}
    s.push(P.line(avg,"gold",1.8,"5 3"));
    if(cur!=null){s.push(S.L(P.X(k),P.y,P.X(k),P.y+P.h,"signal",1.2));s.push(S.CIRC(P.X(k),P.Y(clampy(Dt.raw[k])),5,"signal",1.6));}
    box.set(S.svg(Wd,P.y+P.h+40,s));
    /* 読み出し */
    function rms(a){var s2=0;a.forEach(function(v){s2+=v*v;});return Math.sqrt(s2/a.length);}
    var per=o.nu<1e-9?Infinity:(o.nu<0.5?1/o.nu:1/(1-o.nu));
    var h="1 秒の刻みの数 "+_w14_g(o.f*1e6)+" × (1 + "+_w14_f(o.r,4)+" × 10<sup>−6</sup>) = "+_w14_g(o.f*1e6)+" + "+_w14_f(o.nf,4)+"、端数 ν = <b>"+_w14_f(o.nu,4)+"</b>。";
    h+=o.nu<0.5?" 誤差は 1 秒に νT<sub>q</sub> = "+_w14_f(o.nu*o.tq,2)+" ns ずつ減り、":" 誤差は 1 秒に (1 − ν)T<sub>q</sub> = "+_w14_f((1-o.nu)*o.tq,2)+" ns ずつ増え、";
    h+=isFinite(per)&&per<1e5?"<b>"+_w14_f(per,1)+" s</b> ごとに反対の端へ跳ぶ"+(Math.abs(o.nu-0.5)<0.05?"（ν が 1/2 に近いので、1 秒ごとに正と負を行き来する）":""):"同じ値にとどまる";
    h+="<br>2 乗平均の平方根: 測った値 <b>"+_w14_f(rms(Dt.raw),1)+" ns</b>"+(o.cor?"、補正値を引いた後 <b>"+_w14_f(rms(Dt.corr),1)+" ns</b>":"（「補正値を引く」で比べられる）")+"。60 秒の平均（最後）"+_w14_f(avg[avg.length-1][1],2)+" ns";
    if(o.cor&&o.dc>=100)h+="。<span class=\"warn\">捕獲の刻み 100 ns が鋸歯状の誤差より大きいので、補正値を引いても、ほとんど小さくならない</span>";
    else if(o.cor&&o.sig<=3)h+="。<span class=\"ok\">鋸歯状の誤差が消えた</span>";
    if(!o.cor&&per>200)h+="。<span class=\"warn\">ν が 0 に近く、平均しても誤差が消えない</span>";
    h=h.replace(/ν/g,"<i>ν</i>");
    ro.innerHTML=h+'<div class="wnote">本文 4 節の式で計算した（受信機は秒の頭にいちばん近い刻みでパルスを出し、初めの端数は 0.3 とした）。解の誤差は正規分布、捕獲の刻みの誤差は ±刻み/2 の一様分布の乱数（半カウントの一定のずれは引いた後）。補正値の形式・単位・符号は製品による。</div>';
  }
  run();
};
