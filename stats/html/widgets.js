/* 統計 — 章内インタラクティブ部品 */
(function(){
  "use strict";
  var root=document.documentElement, TAU=Math.PI*2;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var draws=[];
  function redrawAll(){draws.forEach(function(f){try{f();}catch(e){}});}
  window.addEventListener("themechange",function(){requestAnimationFrame(redrawAll);});
  window.addEventListener("resize",function(){requestAnimationFrame(redrawAll);});
  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+k+'</span><span class="t">'+t+'</span>'));}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function slider(row,label,min,max,val,step){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+' <b class="val"></b></label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+step+'">';
    row.appendChild(c);return {input:c.querySelector("input"),val:c.querySelector(".val")};}
  function textin(row,label,val,w){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><input type="text" value="'+val+'" style="font-family:var(--mono);font-size:.85rem;padding:.35rem .5rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:'+(w||"100%")+'">';
    row.appendChild(c);return c.querySelector("input");}
  function select(row,label,opts){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:100%">'+
      opts.map(function(o,i){return '<option value="'+i+'">'+o+'</option>';}).join("")+'</select>';
    row.appendChild(c);return c.querySelector("select");}
  function button(row,t){var b=mk("button","btn",t);b.setAttribute("aria-pressed","false");row.appendChild(b);return b;}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function panel(el,h){var d=mk("div","wscreen");d.style.padding=".8rem";d.style.overflowX="auto";
    d.style.fontFamily="var(--mono)";d.style.fontSize=".8rem";d.style.lineHeight="1.6";
    if(h)d.style.minHeight=h+"px";el.appendChild(d);return d;}
  function screen(el,h){var s=mk("div","wscreen");s.style.height=h+"px";var c=mk("canvas");s.appendChild(c);el.appendChild(s);return c;}
  function cctx(cv){var ctx=cv.getContext("2d");function fit(){var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));
    cv.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height};}
    return {ctx:ctx,fit:fit};}
  function reg(cv,draw){draws.push(draw);if(cv)new ResizeObserver(draw).observe(cv);}
  function lab(ctx,t,x,y,c,a){ctx.fillStyle=c;ctx.font="11px "+C("--mono");ctx.textAlign=a||"left";ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function f(x,d){return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);}

  /* ---------- 描画ヘルパ ---------- */
  function chart(cc,x0,x1,y0,y1,pad){
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
    var p={l:44,r:14,t:16,b:28};
    if(pad)for(var k in pad)p[k]=pad[k];
    ctx.clearRect(0,0,w,h);
    return {ctx:ctx,w:w,h:h,p:p,
      X:function(x){return p.l+(x-x0)/(x1-x0)*(w-p.l-p.r);},
      Y:function(y){return h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);},
      x0:x0,x1:x1,y0:y0,y1:y1};
  }
  function grid(c,ny){var ctx=c.ctx;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
    for(var i=0;i<=ny;i++){var yy=c.p.t+i/ny*(c.h-c.p.t-c.p.b);
      ctx.beginPath();ctx.moveTo(c.p.l,yy);ctx.lineTo(c.w-c.p.r,yy);ctx.stroke();}}
  function axis(c){var ctx=c.ctx;ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(c.p.l,c.h-c.p.b);ctx.lineTo(c.w-c.p.r,c.h-c.p.b);ctx.stroke();}
  function line(c,pts,col,lw,dash){var ctx=c.ctx;ctx.strokeStyle=col;ctx.lineWidth=lw||2.2;
    if(dash)ctx.setLineDash(dash);ctx.beginPath();
    pts.forEach(function(q,i){i?ctx.lineTo(c.X(q[0]),c.Y(q[1])):ctx.moveTo(c.X(q[0]),c.Y(q[1]));});
    ctx.stroke();ctx.setLineDash([]);}
  function fillArea(c,pts,col,base){var ctx=c.ctx;ctx.fillStyle=col;ctx.beginPath();
    ctx.moveTo(c.X(pts[0][0]),c.Y(base==null?c.y0:base));
    pts.forEach(function(q){ctx.lineTo(c.X(q[0]),c.Y(q[1]));});
    ctx.lineTo(c.X(pts[pts.length-1][0]),c.Y(base==null?c.y0:base));ctx.closePath();ctx.fill();}
  function dot(c,x,y,r,col,st){var ctx=c.ctx;ctx.beginPath();ctx.arc(c.X(x),c.Y(y),r,0,TAU);
    if(st){ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}
  function vline(c,x,col,dash){var ctx=c.ctx;ctx.strokeStyle=col;ctx.lineWidth=1.6;
    if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(c.X(x),c.p.t);ctx.lineTo(c.X(x),c.h-c.p.b);
    ctx.stroke();ctx.setLineDash([]);}
  function bars(c,vals,x0,dx,col){var ctx=c.ctx;var bw=(c.X(x0+dx)-c.X(x0))*0.82;
    vals.forEach(function(v,i){var x=x0+i*dx;var y=c.Y(v),yb=c.Y(c.y0);
      ctx.fillStyle=(typeof col==="function")?col(i):col;
      ctx.fillRect(c.X(x)-bw/2,y,bw,Math.max(0,yb-y));});}

  /* ---------- 数学ヘルパ ---------- */
  function rngOf(seed){var s=seed>>>0;return function(){s|=0;s=s+0x6D2B79F5|0;
    var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function gauss(rnd){var u=1-rnd(),v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);}
  function npdf(z){return Math.exp(-z*z/2)/Math.sqrt(TAU);}
  function ncdf(x){var s=x<0?-1:1,z=Math.abs(x)/Math.SQRT2;
    var t=1/(1+0.3275911*z);
    var y=1-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t)*Math.exp(-z*z);
    return 0.5*(1+s*y);}
  function ninv(p){var lo=-8,hi=8;for(var i=0;i<80;i++){var m=(lo+hi)/2;if(ncdf(m)<p)lo=m;else hi=m;}return (lo+hi)/2;}
  function gammaln(x){var c=[76.18009172947146,-86.50532032941677,24.01409824083091,
      -1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
    var y=x,tmp=x+5.5;tmp-=(x+0.5)*Math.log(tmp);var ser=1.000000000190015;
    for(var j=0;j<6;j++)ser+=c[j]/++y;return -tmp+Math.log(2.5066282746310005*ser/x);}
  function betacf(a,b,x){var MAXIT=200,EPS=3e-12,FPMIN=1e-300;
    var qab=a+b,qap=a+1,qam=a-1,cc=1,d=1-qab*x/qap;
    if(Math.abs(d)<FPMIN)d=FPMIN;d=1/d;var hh=d;
    for(var m=1;m<=MAXIT;m++){var m2=2*m;
      var aa=m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;
      cc=1+aa/cc;if(Math.abs(cc)<FPMIN)cc=FPMIN;d=1/d;hh*=d*cc;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;
      cc=1+aa/cc;if(Math.abs(cc)<FPMIN)cc=FPMIN;d=1/d;
      var del=d*cc;hh*=del;if(Math.abs(del-1)<EPS)break;}
    return hh;}
  function betai(a,b,x){if(x<=0)return 0;if(x>=1)return 1;
    var bt=Math.exp(gammaln(a+b)-gammaln(a)-gammaln(b)+a*Math.log(x)+b*Math.log(1-x));
    return (x<(a+1)/(a+b+2))?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
  function gammp(a,x){ // 下側正則不完全ガンマ
    if(x<=0)return 0;
    if(x<a+1){var ap=a,sum=1/a,del=sum;
      for(var n=1;n<500;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*1e-12)break;}
      return sum*Math.exp(-x+a*Math.log(x)-gammaln(a));}
    var FPMIN=1e-300,b=x+1-a,c=1/FPMIN,d=1/b,h=d;
    for(var i=1;i<500;i++){var an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<FPMIN)d=FPMIN;
      c=b+an/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;var de=d*c;h*=de;
      if(Math.abs(de-1)<1e-12)break;}
    return 1-Math.exp(-x+a*Math.log(x)-gammaln(a))*h;}
  function tpdf(x,df){return Math.exp(gammaln((df+1)/2)-gammaln(df/2))/Math.sqrt(df*Math.PI)*
    Math.pow(1+x*x/df,-(df+1)/2);}
  function tcdf(t,df){var p=0.5*betai(df/2,0.5,df/(df+t*t));return t>0?1-p:p;}
  function tp2(t,df){return 2*(1-tcdf(Math.abs(t),df));}          // 両側 p 値
  function tinv(p,df){var lo=-40,hi=40;for(var i=0;i<100;i++){var m=(lo+hi)/2;if(tcdf(m,df)<p)lo=m;else hi=m;}return (lo+hi)/2;}
  function chi2cdf(x,k){return gammp(k/2,x/2);}
  function fcdf(x,d1,d2){return 1-betai(d2/2,d1/2,d2/(d2+d1*x));}
  function logC(n,k){return gammaln(n+1)-gammaln(k+1)-gammaln(n-k+1);}
  function binpmf(k,n,p){if(p<=0)return k===0?1:0;if(p>=1)return k===n?1:0;
    return Math.exp(logC(n,k)+k*Math.log(p)+(n-k)*Math.log(1-p));}
  function popmf(k,l){return Math.exp(-l+k*Math.log(l)-gammaln(k+1));}
  function mean(a){return a.reduce(function(s,v){return s+v;},0)/a.length;}
  function vari(a){var m=mean(a);return a.reduce(function(s,v){return s+(v-m)*(v-m);},0)/(a.length-1);}
  function sd(a){return Math.sqrt(vari(a));}
  function quant(a,q){var b=a.slice().sort(function(x,y){return x-y;});
    var i=(b.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i);
    return b[lo]+(b[hi]-b[lo])*(i-lo);}
  function corrOf(x,y){var mx=mean(x),my=mean(y),sxy=0,sxx=0,syy=0;
    for(var i=0;i<x.length;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)*(x[i]-mx);syy+=(y[i]-my)*(y[i]-my);}
    return sxy/Math.sqrt(sxx*syy);}
  function olsFit(x,y){var mx=mean(x),my=mean(y),sxy=0,sxx=0;
    for(var i=0;i<x.length;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)*(x[i]-mx);}
    var b1=sxy/sxx;return {b1:b1,b0:my-b1*mx,sxx:sxx};}
  var REG={};

  /* ---------- 01: 抽出のしかた ---------- */
  REG.sampling=function(el){
    head(el,"Sampling","偏りは n を増やしても消えない");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"標本サイズ n",10,400,50,10);
    var sb=slider(row,"抽出の偏り（0=無作為）",0,100,0,5);
    var out=readout(el);
    var rnd=rngOf(7),POP=[];
    for(var i=0;i<600;i++){var a=rnd(),bq=rnd();POP.push({x:a,y:bq,v:40+40*a+8*gauss(rnd)});}
    var mu=mean(POP.map(function(q){return q.v;}));
    function draw(){
      var n=+sn.input.value,bias=+sb.input.value/100;
      sn.val.textContent=n;sb.val.textContent=(bias*100)+"%";
      var c=chart(cc,0,1,0,1,{l:14,r:14,t:14,b:24});
      // 偏り: bias が大きいほど x の大きい個体が選ばれやすい
      var r2=rngOf(99),scored=POP.map(function(q){return {q:q,s:r2()*(1-bias)+q.x*bias};});
      scored.sort(function(a,b){return b.s-a.s;});
      var chosen=scored.slice(0,n).map(function(o){return o.q;});
      var set=new Set(chosen);
      POP.forEach(function(q){
        var sel=set.has(q);
        c.ctx.globalAlpha=sel?1:0.28;
        dot(c,q.x,q.y,sel?3.2:2,sel?C("--signal"):C("--faint"));
      });
      c.ctx.globalAlpha=1;
      var xb=mean(chosen.map(function(q){return q.v;}));
      lab(c.ctx,"● 母集団 600 人（薄い点）／ ● 選ばれた標本",c.p.l+2,c.p.t+8,C("--muted"),"left");
      lab(c.ctx,"横軸が「選ばれやすさ」に効く個体特性",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      out.innerHTML='母平均 = <b>'+f(mu,2)+'</b> ／ 標本平均 = <b>'+f(xb,2)+'</b> ／ 誤差 = <b class="'+
        (Math.abs(xb-mu)<1?"ok":"warn")+'">'+f(xb-mu,2)+'</b>'+
        (bias===0?' ／ <span class="ok">無作為なら n を増やすほど誤差は 0 に近づく</span>'
                 :' ／ <span class="warn">偏りがあると n を増やしても誤差は残る（1936 年の 236 万人の失敗）</span>');
    }
    sn.input.addEventListener("input",draw);sb.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 02: 代表値とばらつき ---------- */
  REG.descstats=function(el){
    head(el,"Center & Spread","外れ値 1 個で平均は動く。中央値は動かない");
    var row=ctrls(el);
    var ip=textin(row,"データ（カンマ区切り）","12, 14, 15, 15, 16, 18, 19, 21","100%");
    var so=slider(row,"外れ値を 1 個追加",0,300,60,5);
    var cv=screen(el,170),cc=cctx(cv);
    var out=panel(el),rd=readout(el);
    function draw(){
      var base=String(ip.value).split(",").map(function(s){return parseFloat(s);}).filter(function(v){return !isNaN(v);});
      if(base.length<2){out.innerHTML="数値を 2 つ以上入力してください";rd.innerHTML="";return;}
      var extra=+so.input.value;so.val.textContent=extra;
      var d=base.concat([extra]);
      function stats(a){
        var m=mean(a),md=quant(a,0.5),v=vari(a);
        return {m:m,md:md,v:v,s:Math.sqrt(v)};
      }
      var A=stats(base),B=stats(d);
      var lo=Math.min.apply(null,d)-2,hi=Math.max.apply(null,d)+2;
      var c=chart(cc,lo,hi,0,1,{l:20,r:20,t:20,b:34});
      axis(c);
      d.forEach(function(v,i){dot(c,v,0.35,5,i===d.length-1?C("--alias"):C("--signal"));});
      vline(c,B.m,C("--alias"),[5,4]);vline(c,B.md,C("--blue"),[2,3]);
      lab(c.ctx,"平均 "+f(B.m,2),c.X(B.m),c.p.t+26,C("--alias"),"center");
      lab(c.ctx,"中央値 "+f(B.md,2),c.X(B.md),c.h-c.p.b+16,C("--blue"),"center");
      lab(c.ctx,"赤い点 = 追加した外れ値",c.p.l,c.p.t+10,C("--muted"),"left");
      var h='<table style="border-collapse:collapse"><tr>'+
        ["","平均","中央値","分散 s²","標準偏差 s"].map(function(t){
          return '<th style="padding:.2rem .8rem;text-align:right;color:var(--muted)">'+t+'</th>';}).join("")+'</tr>';
      h+='<tr><td style="padding:.2rem .8rem">元データ</td>'+[A.m,A.md,A.v,A.s].map(function(v){
        return '<td style="padding:.2rem .8rem;text-align:right">'+f(v,2)+'</td>';}).join("")+'</tr>';
      h+='<tr style="color:var(--signal);font-weight:700"><td style="padding:.2rem .8rem">+外れ値</td>'+
        [B.m,B.md,B.v,B.s].map(function(v){return '<td style="padding:.2rem .8rem;text-align:right">'+f(v,2)+'</td>';}).join("")+'</tr>';
      h+='</table>';
      out.innerHTML=h;
      rd.innerHTML='平均の変化 <b class="warn">'+f(B.m-A.m,2)+'</b> ／ 中央値の変化 <b class="ok">'+f(B.md-A.md,2)+'</b>'+
        ' ／ 標準偏差の変化 <b class="warn">'+f(B.s-A.s,2)+'</b>'+
        ' ／ <span class="warn">平均と分散は 1 点で壊れる。中央値は動かない（頑健）</span>';
    }
    ip.addEventListener("input",draw);so.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 02: ヒストグラムと箱ひげ図 ---------- */
  REG.histbox=function(el){
    head(el,"Histogram","ビン幅で見え方が激変する");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sb=slider(row,"ビンの数",3,60,12,1);
    var sm=select(row,"データ",["2 つの山が混ざったデータ","右に歪んだデータ","正規分布"]);
    var out=readout(el);
    var rnd=rngOf(4),D=[[],[],[]];
    for(var i=0;i<400;i++){
      D[0].push(i%2?58+5*gauss(rnd):40+5*gauss(rnd));
      D[1].push(Math.exp(3.2+0.55*gauss(rnd)));
      D[2].push(50+9*gauss(rnd));
    }
    function draw(){
      var nb=+sb.input.value;sb.val.textContent=nb;
      var d=D[+sm.value];
      var lo=Math.min.apply(null,d),hi=Math.max.apply(null,d),wdt=(hi-lo)/nb;
      var cnt=new Array(nb).fill(0);
      d.forEach(function(v){var k=Math.min(nb-1,Math.floor((v-lo)/wdt));cnt[k]++;});
      var mx=Math.max.apply(null,cnt);
      var c=chart(cc,lo,hi,0,mx*1.25,{l:34,r:14,t:16,b:60});
      grid(c,4);
      var ctx=c.ctx;
      cnt.forEach(function(v,i){
        var x1=c.X(lo+i*wdt),x2=c.X(lo+(i+1)*wdt);
        ctx.fillStyle=C("--signal-soft");ctx.fillRect(x1,c.Y(v),x2-x1-1,c.Y(0)-c.Y(v));
        ctx.strokeStyle=C("--signal");ctx.lineWidth=1.2;ctx.strokeRect(x1,c.Y(v),x2-x1-1,c.Y(0)-c.Y(v));
      });
      axis(c);
      // 箱ひげ図
      var q1=quant(d,0.25),q2=quant(d,0.5),q3=quant(d,0.75),iqr=q3-q1;
      var wl=Math.min.apply(null,d.filter(function(v){return v>=q1-1.5*iqr;}));
      var wh=Math.max.apply(null,d.filter(function(v){return v<=q3+1.5*iqr;}));
      var by=c.h-24;
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(c.X(wl),by);ctx.lineTo(c.X(q1),by);
      ctx.moveTo(c.X(q3),by);ctx.lineTo(c.X(wh),by);ctx.stroke();
      ctx.fillStyle=C("--panel");ctx.fillRect(c.X(q1),by-9,c.X(q3)-c.X(q1),18);
      ctx.strokeRect(c.X(q1),by-9,c.X(q3)-c.X(q1),18);
      ctx.beginPath();ctx.moveTo(c.X(q2),by-9);ctx.lineTo(c.X(q2),by+9);ctx.stroke();
      d.filter(function(v){return v<wl||v>wh;}).forEach(function(v){
        ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(c.X(v),by,2,0,TAU);ctx.fill();});
      lab(ctx,"箱ひげ図",c.p.l,by+22,C("--muted"),"left");
      lab(ctx,"ビン幅 "+f(wdt,2),c.w-c.p.r,c.p.t+8,C("--muted"),"right");
      out.innerHTML='ビン数 = <b>'+nb+'</b> ／ 平均 '+f(mean(d),1)+'、中央値 '+f(q2,1)+
        ' ／ '+(+sm.value===0?(nb<8?'<span class="warn">ビンが粗いと 2 つの山が 1 つに見える</span>'
                                   :'<span class="ok">2 つの山が見えている</span>')
              :(+sm.value===1?'<span class="warn">右に歪む → 平均 &gt; 中央値。箱ひげでは外れ値が大量に出る</span>'
                             :'<span class="ok">左右対称。平均 ≈ 中央値</span>'))+
        ' ／ <span class="warn">箱ひげ図は 2 山を区別できない</span>';
    }
    sb.input.addEventListener("input",draw);sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 03: 相関係数 ---------- */
  REG.corr=function(el){
    head(el,"Correlation","r は「直線関係の強さ」しか測らない");
    var cv=screen(el,260),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"目標の相関 r",-100,100,70,5);
    var sm=select(row,"データの形",["直線関係","放物線（r≈0 だが完全な関係）",
      "外れ値 1 個だけ","アンスコム I","アンスコム II","アンスコム III","アンスコム IV"]);
    var out=readout(el);
    var AN={
      x:[[10,8,13,9,11,14,6,4,12,7,5],[10,8,13,9,11,14,6,4,12,7,5],
         [10,8,13,9,11,14,6,4,12,7,5],[8,8,8,8,8,8,8,19,8,8,8]],
      y:[[8.04,6.95,7.58,8.81,8.33,9.96,7.24,4.26,10.84,4.82,5.68],
         [9.14,8.14,8.74,8.77,9.26,8.10,6.13,3.10,9.13,7.26,4.74],
         [7.46,6.77,12.74,7.11,7.81,8.84,6.08,5.39,8.15,6.42,5.73],
         [6.58,5.76,7.71,8.84,8.47,7.04,5.25,12.50,5.56,7.91,6.89]]};
    function gen(){
      var m=+sm.value,r=+sr.input.value/100,rnd=rngOf(11),x=[],y=[];
      if(m>=3){return {x:AN.x[m-3].slice(),y:AN.y[m-3].slice(),an:true};}
      for(var i=0;i<60;i++){
        var xi=gauss(rnd);
        if(m===0) y.push(r*xi+Math.sqrt(Math.max(0,1-r*r))*gauss(rnd));
        else if(m===1) y.push(xi*xi-1+0.25*gauss(rnd));
        else y.push(0.35*gauss(rnd));
        x.push(xi);
      }
      if(m===2){x.push(4.2);y.push(4.2);}
      return {x:x,y:y};
    }
    function draw(){
      var m=+sm.value;sr.val.textContent=(+sr.input.value/100).toFixed(2);
      sr.input.parentElement.style.opacity=(m===0)?1:0.4;
      var g=gen(),x=g.x,y=g.y;
      var xl=Math.min.apply(null,x),xh=Math.max.apply(null,x),yl=Math.min.apply(null,y),yh=Math.max.apply(null,y);
      var px=(xh-xl)*0.12||1,py=(yh-yl)*0.12||1;
      var c=chart(cc,xl-px,xh+px,yl-py,yh+py);
      grid(c,4);axis(c);
      var fit=olsFit(x,y);
      line(c,[[xl-px,fit.b0+fit.b1*(xl-px)],[xh+px,fit.b0+fit.b1*(xh+px)]],C("--alias"),1.8,[6,4]);
      for(var i=0;i<x.length;i++)dot(c,x[i],y[i],3.6,C("--signal"));
      var r=corrOf(x,y);
      lab(c.ctx,"回帰直線 y = "+f(fit.b0,2)+" + "+f(fit.b1,3)+"x",c.p.l+2,c.p.t+10,C("--alias"),"left");
      out.innerHTML='r = <b>'+f(r,3)+'</b>　R² = <b>'+f(r*r,3)+'</b>'+
        (m===1?' ／ <span class="warn">完全な放物線なのに r ≈ 0。r=0 は「無関係」ではなく「直線関係が無い」だけ</span>':'')+
        (m===2?' ／ <span class="warn">1 点足しただけで r が跳ね上がる（外れ値に弱い）</span>':'')+
        (g.an?' ／ <span class="warn">アンスコムの四重奏：4 つとも平均・分散・r・回帰式がほぼ同一なのに、絵はまったく違う</span>':'');
    }
    sr.input.addEventListener("input",draw);sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 03: シンプソンのパラドックス ---------- */
  REG.simpson=function(el){
    head(el,"Simpson","層別すると結論が逆転する");
    var row=ctrls(el);
    var sw=slider(row,"女性が難関学部 B に出願する割合",0,100,75,5);
    var out=panel(el),rd=readout(el);
    function draw(){
      var w=+sw.input.value/100;sw.val.textContent=(w*100)+"%";
      var rA=0.70,rB=0.30;                 // 学部 A・B の合格率（男女同じ）
      var mTot=800,fTot=400;
      var mB=Math.round(mTot*0.25),mA=mTot-mB;      // 男性は 25% が B
      var fB=Math.round(fTot*w),fA=fTot-fB;
      var mAc=Math.round(mA*rA),mBc=Math.round(mB*rB);
      var fAc=Math.round(fA*(rA+0.05)),fBc=Math.round(fB*(rB-0.017)); // 女性がわずかに有利/互角
      function pct(a,b){return b?f(a/b*100,1)+"%":"—";}
      var h='<div style="color:var(--muted);margin-bottom:.3rem">合格率は学部で決まり、男女差はほぼ無い（A は易しく、B は難しい）</div>';
      h+='<table style="border-collapse:collapse"><tr>'+
        ["","学部 A 出願","合格","率","学部 B 出願","合格","率","全体率"].map(function(t){
          return '<th style="padding:.2rem .7rem;text-align:right;color:var(--muted)">'+t+'</th>';}).join("")+'</tr>';
      h+='<tr><td style="padding:.2rem .7rem">男性</td>'+
        [mA,mAc,pct(mAc,mA),mB,mBc,pct(mBc,mB)].map(function(v){
          return '<td style="padding:.2rem .7rem;text-align:right">'+v+'</td>';}).join("")+
        '<td style="padding:.2rem .7rem;text-align:right;font-weight:700">'+pct(mAc+mBc,mTot)+'</td></tr>';
      h+='<tr><td style="padding:.2rem .7rem">女性</td>'+
        [fA,fAc,pct(fAc,fA),fB,fBc,pct(fBc,fB)].map(function(v){
          return '<td style="padding:.2rem .7rem;text-align:right">'+v+'</td>';}).join("")+
        '<td style="padding:.2rem .7rem;text-align:right;font-weight:700">'+pct(fAc+fBc,fTot)+'</td></tr>';
      h+='</table>';
      out.innerHTML=h;
      var mo=(mAc+mBc)/mTot,fo=(fAc+fBc)/fTot;
      var lay=(fA?fAc/fA:0)>=rA && (fB?fBc/fB:0)>=rB-0.02;
      rd.innerHTML='全体: 男性 <b>'+f(mo*100,1)+'%</b> vs 女性 <b>'+f(fo*100,1)+'%</b>'+
        ' ／ 学部別: <span class="ok">どちらの学部でも女性が不利ではない</span> ／ '+
        (fo<mo-0.02?'<span class="warn">なのに全体では女性の方が低く出る = シンプソンのパラドックス（難関学部への出願が偏っているため）</span>'
                   :'<span class="ok">出願先の偏りが小さいので逆転は起きない</span>');
    }
    sw.input.addEventListener("input",draw);reg(null,draw);draw();
  };

  /* ---------- 04: 条件付き確率 ---------- */
  REG.condprob=function(el){
    head(el,"Conditional","B が分かると舞台が B に縮む");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);
    var sa=slider(row,"P(A)",5,90,40,5);
    var sb=slider(row,"P(B)",5,90,50,5);
    var si=slider(row,"P(A∩B)",0,90,25,1);
    var out=readout(el);
    function draw(){
      var pa=+sa.input.value/100,pb=+sb.input.value/100,pi=+si.input.value/100;
      pi=Math.min(pi,pa,pb);pi=Math.max(pi,Math.max(0,pa+pb-1));
      sa.val.textContent=f(pa,2);sb.val.textContent=f(pb,2);si.val.textContent=f(pi,2);
      var c=chart(cc,0,1,0,1,{l:16,r:16,t:26,b:22});
      var ctx=c.ctx,L=c.p.l,T=c.p.t,W=c.w-c.p.l-c.p.r,H=c.h-c.p.t-c.p.b;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;ctx.strokeRect(L,T,W,H);
      // A を左の帯、B を上の帯、交わりを濃く
      ctx.fillStyle=C("--signal-soft");ctx.fillRect(L,T,W*pa,H);
      ctx.fillStyle=C("--alias-soft");ctx.fillRect(L,T,W,H*pb);
      ctx.fillStyle=C("--signal");ctx.globalAlpha=.55;
      ctx.fillRect(L,T,W*(pi/pb),H*pb);ctx.globalAlpha=1;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;ctx.strokeRect(L,T,W,H*pb);
      lab(ctx,"B が起きた世界（赤枠） = 新しい全体",L,T-8,C("--alias"),"left");
      lab(ctx,"A",L+W*pa/2,T+H-6,C("--signal"),"center");
      lab(ctx,"A∩B",L+W*(pi/pb)/2,T+H*pb/2+4,"#fff","center");
      lab(ctx,"Ω",c.w-c.p.r-8,T+H-6,C("--faint"),"right");
      var cab=pb>0?pi/pb:0,cba=pa>0?pi/pa:0;
      out.innerHTML='P(A|B) = P(A∩B)/P(B) = '+f(pi,3)+'/'+f(pb,2)+' = <b>'+f(cab,3)+'</b>'+
        ' ／ P(B|A) = <b>'+f(cba,3)+'</b>'+
        ' ／ '+(Math.abs(pi-pa*pb)<0.005?'<span class="ok">P(A∩B)=P(A)P(B) → 独立（B を知っても P(A) が変わらない）</span>'
              :(pi<0.001?'<span class="warn">排反（同時に起きない）＝ 独立とは正反対</span>'
                        :'<span class="warn">従属。P(A|B)='+f(cab,3)+' ≠ P(A)='+f(pa,2)+'</span>'))+
        ' ／ <b>P(A|B) ≠ P(B|A)</b> に注意';
    }
    [sa,sb,si].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 04: モンティ・ホール ---------- */
  REG.monty=function(el){
    head(el,"Monty Hall","変えれば 2/3、変えなければ 1/3");
    var cv=screen(el,200),cc=cctx(cv);var row=ctrls(el);
    var sdl=slider(row,"ドアの数",3,20,3,1);
    var sn=slider(row,"試行回数",100,20000,2000,100);
    var out=readout(el);
    function draw(){
      var D=+sdl.input.value,N=+sn.input.value;
      sdl.val.textContent=D;sn.val.textContent=N;
      var rnd=rngOf(21),stay=0,sw=0,hist=[];
      for(var i=0;i<N;i++){
        var prize=Math.floor(rnd()*D),pick=Math.floor(rnd()*D);
        if(pick===prize)stay++; else sw++;
        if(i%Math.max(1,Math.floor(N/240))===0)hist.push([i,sw/(i+1)]);
      }
      hist.push([N,sw/N]);
      var c=chart(cc,0,N,0,1);
      grid(c,4);axis(c);
      var th=(D-1)/D;
      line(c,[[0,th],[N,th]],C("--faint"),1.4,[5,4]);
      line(c,[[0,1/D],[N,1/D]],C("--faint"),1.4,[5,4]);
      line(c,hist,C("--signal"),2.4);
      lab(c.ctx,"変える戦略の勝率（理論値 "+f(th,3)+"）",c.p.l+3,c.Y(th)-6,C("--muted"),"left");
      lab(c.ctx,"変えない = "+f(1/D,3),c.p.l+3,c.Y(1/D)-6,C("--muted"),"left");
      lab(c.ctx,"0%",c.p.l-6,c.Y(0)+4,C("--muted"),"right");
      lab(c.ctx,"100%",c.p.l-6,c.Y(1)+4,C("--muted"),"right");
      lab(c.ctx,"試行回数",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      out.innerHTML='変えない: <b>'+f(stay/N*100,1)+'%</b>（理論 '+f(100/D,1)+'%）／ '+
        '変える: <b class="ok">'+f(sw/N*100,1)+'%</b>（理論 '+f(th*100,1)+'%）／ '+
        (D>3?'<span class="ok">ドアが多いほど「変える」の有利さが明白になる（'+D+' 枚なら '+f(th*100,1)+'%）</span>'
            :'司会者は中身を知っていて必ずハズレを開ける。その行動が情報を運んでいる');
    }
    sdl.input.addEventListener("input",draw);sn.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 05: 検査の陽性的中率 ---------- */
  REG.bayestest=function(el){
    head(el,"Bayes","99% の検査で陽性でも 9% のことがある");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sp=slider(row,"有病率（1000 人あたり）",1,500,1,1);
    var se=slider(row,"感度",50,100,99,0.5);
    var sq=slider(row,"特異度",50,100,99,0.5);
    var out=readout(el);
    function draw(){
      var prev=+sp.input.value/1000,sens=+se.input.value/100,spec=+sq.input.value/100;
      sp.val.textContent=f(prev*100,2)+"%";se.val.textContent=f(sens*100,1)+"%";sq.val.textContent=f(spec*100,1)+"%";
      var N=10000,sick=N*prev,well=N-sick;
      var tp=sick*sens,fn=sick-tp,fp=well*(1-spec),tn=well-fp;
      var ppv=tp/(tp+fp),npv=tn/(tn+fn);
      // 100x100 のドット図
      var c=chart(cc,0,1,0,1,{l:14,r:14,t:26,b:22});
      var ctx=c.ctx,cols=100,rows=100,W=c.w-c.p.l-c.p.r,H=c.h-c.p.t-c.p.b;
      var cw=W/cols,ch=H/rows;
      var nTP=Math.round(tp),nFP=Math.round(fp),nFN=Math.round(fn);
      for(var i=0;i<N;i++){
        var col;
        if(i<nTP)col=C("--alias");
        else if(i<nTP+nFP)col="#e0a458";
        else if(i<nTP+nFP+nFN)col=C("--blue");
        else col=C("--grid");
        var r=Math.floor(i/cols),cc2=i%cols;
        ctx.fillStyle=col;ctx.fillRect(c.p.l+cc2*cw,c.p.t+r*ch,Math.max(1,cw-0.3),Math.max(1,ch-0.3));
      }
      lab(ctx,"10,000 人  ■真の陽性 ■偽陽性 ■見逃し ■真の陰性",c.p.l,c.p.t-8,C("--muted"),"left");
      out.innerHTML='陽性者 <b>'+Math.round(tp+fp)+'</b> 人のうち、本当に病気なのは <b>'+Math.round(tp)+'</b> 人 ／ '+
        '<b class="'+(ppv<0.5?"warn":"ok")+'">陽性的中率 = '+f(ppv*100,1)+'%</b>'+
        ' ／ 陰性的中率 = '+f(npv*100,2)+'%'+
        ' ／ '+(prev<0.02?'<span class="warn">健康な人が桁違いに多いので、偽陽性が真の陽性を圧倒する（基準率の無視）</span>'
                        :'<span class="ok">有病率が高い集団では陽性の意味が重くなる</span>');
    }
    [sp,se,sq].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 05: 逐次更新 ---------- */
  REG.bayesupdate=function(el){
    head(el,"Sequential","昨日の事後は今日の事前");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var st=slider(row,"真のコインの表確率",0,100,70,5);
    var sn=slider(row,"投げた回数",0,200,20,1);
    var sa=slider(row,"事前 Beta(a,a) の a（大=強い思い込み）",1,30,1,1);
    var out=readout(el);
    function draw(){
      var p=+st.input.value/100,n=+sn.input.value,a0=+sa.input.value;
      st.val.textContent=f(p,2);sn.val.textContent=n;sa.val.textContent=a0;
      var rnd=rngOf(3),s=0;
      for(var i=0;i<n;i++) if(rnd()<p)s++;
      var a=a0+s,b=a0+(n-s);
      var pts=[],mx=0;
      for(var k=0;k<=300;k++){
        var x=k/300;
        var lp=(a-1)*Math.log(Math.max(x,1e-12))+(b-1)*Math.log(Math.max(1-x,1e-12))
               -(gammaln(a)+gammaln(b)-gammaln(a+b));
        var y=Math.exp(lp);pts.push([x,y]);if(y>mx)mx=y;
      }
      var c=chart(cc,0,1,0,mx*1.15);
      grid(c,4);
      fillArea(c,pts,C("--signal-soft"),0);
      line(c,pts,C("--signal"),2.4);
      axis(c);
      vline(c,p,C("--alias"),[5,4]);
      lab(c.ctx,"真の値 "+f(p,2),c.X(p),c.p.t+10,C("--alias"),"center");
      lab(c.ctx,"0",c.X(0),c.h-c.p.b+16,C("--muted"),"center");
      lab(c.ctx,"1",c.X(1),c.h-c.p.b+16,C("--muted"),"center");
      lab(c.ctx,"表が出る確率 θ の事後分布",c.p.l+2,c.p.t+10,C("--muted"),"left");
      var m=a/(a+b),sdv=Math.sqrt(a*b/((a+b)*(a+b)*(a+b+1)));
      out.innerHTML='n = <b>'+n+'</b> 回中 表 <b>'+s+'</b> 回 → 事後 Beta('+a+', '+b+')'+
        ' ／ 事後平均 <b>'+f(m,3)+'</b>（最尤 '+(n?f(s/n,3):"—")+'）'+
        ' ／ 事後 SD '+f(sdv,3)+
        ' ／ '+(n===0?'<span class="warn">まだデータなし。表示は事前分布そのもの</span>'
              :(n<20?'<span class="warn">データが少ないと事前分布に引き戻される（安全装置）</span>'
                    :'<span class="ok">n が増えるほど山が細くなり、事前の影響が消える</span>'));
    }
    [st,sn,sa].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 06: 標準誤差 σ/√n ---------- */
  REG.sevar=function(el){
    head(el,"Standard Error","精度は √n でしか上がらない");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"標本サイズ n",1,400,25,1);
    var ss=slider(row,"母標準偏差 σ",1,30,10,1);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,sg=+ss.input.value;
      sn.val.textContent=n;ss.val.textContent=sg;
      var se=sg/Math.sqrt(n);
      var c=chart(cc,1,400,0,sg*1.05);
      grid(c,4);
      var pts=[];for(var k=1;k<=400;k++)pts.push([k,sg/Math.sqrt(k)]);
      line(c,pts,C("--signal"),2.4);
      axis(c);
      vline(c,n,C("--alias"),[5,4]);
      dot(c,n,se,5,C("--alias"));
      lab(c.ctx,"SE = σ/√n",c.w-c.p.r,c.p.t+12,C("--signal"),"right");
      lab(c.ctx,"n = "+n+"  SE = "+f(se,2),c.X(n)+6,c.Y(se)-8,C("--alias"),"left");
      lab(c.ctx,"n = 1",c.p.l,c.h-c.p.b+16,C("--muted"),"left");
      lab(c.ctx,"n = 400",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(c.ctx,"σ="+sg,c.p.l-6,c.Y(sg)+10,C("--muted"),"right");
      lab(c.ctx,"0",c.p.l-6,c.Y(0)+4,C("--muted"),"right");
      var need=Math.ceil(4*n);
      out.innerHTML='SE = σ/√n = '+sg+'/√'+n+' = <b>'+f(se,3)+'</b>'+
        ' ／ SD（個体のばらつき）は '+sg+' のまま変わらない'+
        ' ／ <b class="warn">精度を 2 倍にするには n を '+need+' に（4 倍）</b>'+
        ' ／ 95% 信頼区間の幅 ≈ ±'+f(1.96*se,2);
    }
    sn.input.addEventListener("input",draw);ss.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 07: 二項分布 ---------- */
  REG.discretedist=function(el){
    head(el,"Binomial","n 回中の成功回数");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"試行回数 n",1,60,10,1);
    var sp=slider(row,"成功確率 p",1,99,50,1);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,p=+sp.input.value/100;
      sn.val.textContent=n;sp.val.textContent=f(p,2);
      var v=[],mx=0;
      for(var k=0;k<=n;k++){var y=binpmf(k,n,p);v.push(y);if(y>mx)mx=y;}
      var c=chart(cc,-0.5,n+0.5,0,mx*1.18);
      grid(c,4);
      bars(c,v,0,1,function(i){return Math.abs(i-n*p)<=Math.sqrt(n*p*(1-p))?C("--signal"):C("--signal-soft");});
      axis(c);
      // 正規近似
      var mu=n*p,sg=Math.sqrt(n*p*(1-p));
      if(sg>0.6){
        var pts=[];for(var t=-0.5;t<=n+0.5;t+=0.1)pts.push([t,npdf((t-mu)/sg)/sg]);
        line(c,pts,C("--alias"),1.8,[5,4]);
      }
      lab(c.ctx,"棒 = 二項分布 pmf ／ 破線 = 正規近似",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(c.ctx,"成功回数 k",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(c.ctx,"0",c.p.l,c.h-c.p.b+16,C("--muted"),"center");
      lab(c.ctx,String(n),c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      var ok=n*p>=5&&n*(1-p)>=5;
      out.innerHTML='E[X] = np = <b>'+f(mu,2)+'</b>　V[X] = np(1−p) = <b>'+f(sg*sg,2)+'</b>　SD = '+f(sg,2)+
        ' ／ P(X = '+Math.round(mu)+') = '+f(binpmf(Math.round(mu),n,p),3)+
        ' ／ '+(ok?'<span class="ok">np≥5 かつ n(1−p)≥5 → 正規近似が使える</span>'
                 :'<span class="warn">np または n(1−p) が 5 未満 → 正規近似は不正確</span>')+
        (p<=0.1&&n>=20?' ／ <span class="ok">p が小さく n が大きい → ポアソン近似 Po('+f(mu,1)+') も使える</span>':'');
    }
    sn.input.addEventListener("input",draw);sp.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 07: ポアソン分布 ---------- */
  REG.poisson=function(el){
    head(el,"Poisson","平均 = 分散。二項の n→∞, p→0 極限");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sl=slider(row,"λ（単位時間あたりの平均発生数）",0.2,20,3,0.2);
    var sn=slider(row,"比較する二項の n（p = λ/n）",5,500,20,5);
    var out=readout(el);
    function draw(){
      var l=+sl.input.value,n=+sn.input.value,p=l/n;
      sl.val.textContent=f(l,1);sn.val.textContent=n;
      var K=Math.max(8,Math.ceil(l+4*Math.sqrt(l)));
      var v=[],b=[],mx=0;
      for(var k=0;k<=K;k++){var y=popmf(k,l);v.push(y);if(y>mx)mx=y;
        b.push(p<=1&&k<=n?binpmf(k,n,p):0);}
      var c=chart(cc,-0.5,K+0.5,0,mx*1.2);
      grid(c,4);
      bars(c,v,0,1,C("--signal-soft"));
      var ctx=c.ctx,bw=(c.X(1)-c.X(0))*0.82;
      b.forEach(function(y,i){ctx.fillStyle=C("--alias");
        ctx.fillRect(c.X(i)-bw*0.17,c.Y(y),bw*0.34,Math.max(0,c.Y(0)-c.Y(y)));});
      axis(c);
      lab(ctx,"淡い棒 = ポアソン Po(λ)／ 細い棒 = 二項 Bin(n, λ/n)",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"発生回数 k",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      var maxdiff=0;for(var k2=0;k2<=K;k2++)maxdiff=Math.max(maxdiff,Math.abs(v[k2]-b[k2]));
      out.innerHTML='E[X] = λ = <b>'+f(l,2)+'</b>　V[X] = λ = <b>'+f(l,2)+'</b>（<span class="ok">平均 = 分散</span>）'+
        ' ／ P(X=0) = '+f(popmf(0,l),4)+'　P(X≥3) = '+f(1-popmf(0,l)-popmf(1,l)-popmf(2,l),4)+
        ' ／ 二項との最大差 = <b>'+f(maxdiff,4)+'</b>'+
        (n>=50?' <span class="ok">n が大きいほど一致する</span>':' <span class="warn">n が小さいと差が残る</span>');
    }
    sl.input.addEventListener("input",draw);sn.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 08: 正規分布と面積 ---------- */
  REG.normal=function(el){
    head(el,"Normal","面積が確率。1.96 で 95%");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sa=slider(row,"下限 z₁",-4,4,-1.96,0.01);
    var sb=slider(row,"上限 z₂",-4,4,1.96,0.01);
    var out=readout(el);
    function draw(){
      var a=+sa.input.value,b=+sb.input.value;
      if(a>b){var t=a;a=b;b=t;}
      sa.val.textContent=f(a,2);sb.val.textContent=f(b,2);
      var c=chart(cc,-4,4,0,0.45);
      grid(c,4);
      var pts=[],inside=[];
      for(var z=-4;z<=4.001;z+=0.02){pts.push([z,npdf(z)]);if(z>=a&&z<=b)inside.push([z,npdf(z)]);}
      if(inside.length>1)fillArea(c,inside,C("--signal-soft"),0);
      line(c,pts,C("--signal"),2.4);
      axis(c);
      vline(c,a,C("--alias"),[4,3]);vline(c,b,C("--alias"),[4,3]);
      var ctx=c.ctx;
      [-3,-2,-1,0,1,2,3].forEach(function(z){lab(ctx,String(z),c.X(z),c.h-c.p.b+16,C("--muted"),"center");});
      var p=ncdf(b)-ncdf(a);
      lab(ctx,"面積 = "+f(p*100,2)+"%",c.X((a+b)/2),c.Y(0.18),C("--ink"),"center");
      lab(ctx,"z",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      out.innerHTML='P('+f(a,2)+' ≤ Z ≤ '+f(b,2)+') = <b>'+f(p,4)+'</b> = '+f(p*100,2)+'%'+
        ' ／ 外側 = '+f((1-p)*100,2)+'%'+
        ' ／ '+(Math.abs(a+1.96)<0.02&&Math.abs(b-1.96)<0.02?'<span class="ok">±1.96 = ちょうど 95%。信頼区間と両側検定で最も使う定数</span>'
              :(Math.abs(a+1)<0.02&&Math.abs(b-1)<0.02?'<span class="ok">±1σ で約 68%</span>'
              :(Math.abs(a+2.576)<0.02&&Math.abs(b-2.576)<0.02?'<span class="ok">±2.576 = 99%</span>'
              :'±1σ:68.3%／±1.96σ:95%／±2.576σ:99%／±3σ:99.7%')));
    }
    sa.input.addEventListener("input",draw);sb.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 08: t 分布 ---------- */
  REG.tdist=function(el){
    head(el,"Student's t","σ を s で代用した代償 = 裾が重くなる");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sdl=slider(row,"自由度 df = n − 1",1,60,5,1);
    var out=readout(el);
    function draw(){
      var df=+sdl.input.value;sdl.val.textContent=df;
      var c=chart(cc,-5,5,0,0.45);
      grid(c,4);
      var pn=[],pt=[];
      for(var z=-5;z<=5.001;z+=0.02){pn.push([z,npdf(z)]);pt.push([z,tpdf(z,df)]);}
      line(c,pn,C("--faint"),1.8,[5,4]);
      line(c,pt,C("--signal"),2.4);
      axis(c);
      var tc=tinv(0.975,df);
      vline(c,tc,C("--alias"),[4,3]);vline(c,-tc,C("--alias"),[4,3]);
      var ctx=c.ctx;
      [-4,-2,0,2,4].forEach(function(z){lab(ctx,String(z),c.X(z),c.h-c.p.b+16,C("--muted"),"center");});
      lab(ctx,"実線 = t 分布（df="+df+"）／ 破線 = 標準正規",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"±"+f(tc,3),c.X(tc)+4,c.p.t+24,C("--alias"),"left");
      out.innerHTML='両側 5% 点 = <b>±'+f(tc,3)+'</b>（正規なら ±1.960）／ '+
        '分散 = df/(df−2) = '+(df>2?f(df/(df-2),3):"∞")+
        ' ／ '+(df<10?'<span class="warn">自由度が小さいと裾が重く、必要な臨界値がずっと大きい。z を使うと甘くなる</span>'
              :(df<30?'<span class="warn">まだ正規より少し広い</span>'
                     :'<span class="ok">df ≥ 30 で正規にほぼ一致（差 '+f((tc-1.96)/1.96*100,1)+'%）</span>'));
    }
    sdl.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 09: 大数の法則 ---------- */
  REG.lln=function(el){
    head(el,"LLN","比率は収束する。だが枚数の差は開く");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"投げる回数",50,20000,2000,50);
    var ss=slider(row,"乱数の種",1,30,1,1);
    var sm=select(row,"縦軸",["表の比率（→0.5 に収束）","表と裏の枚数の差（→ 広がる）"]);
    var out=readout(el);
    function draw(){
      var N=+sn.input.value,seed=+ss.input.value,mode=+sm.value;
      sn.val.textContent=N;ss.val.textContent=seed;
      var rnd=rngOf(seed*977),h=0,pr=[],df=[],step=Math.max(1,Math.floor(N/300)),mxd=1;
      for(var i=1;i<=N;i++){
        if(rnd()<0.5)h++;
        var d=2*h-i;
        if(Math.abs(d)>mxd)mxd=Math.abs(d);
        if(i%step===0||i===N){pr.push([i,h/i]);df.push([i,d]);}
      }
      var c=mode?chart(cc,0,N,-mxd*1.15,mxd*1.15):chart(cc,0,N,0.2,0.8);
      grid(c,4);
      if(mode){
        line(c,[[0,0],[N,0]],C("--faint"),1.4,[5,4]);
        var env=[];for(var k=1;k<=N;k+=Math.max(1,Math.floor(N/200)))env.push([k,Math.sqrt(k)]);
        line(c,env,C("--alias"),1.4,[3,3]);
        line(c,env.map(function(q){return [q[0],-q[1]];}),C("--alias"),1.4,[3,3]);
        line(c,df,C("--signal"),2);
        lab(c.ctx,"破線 = ±√n（ばらつきの目安）",c.p.l+3,c.p.t+12,C("--alias"),"left");
        lab(c.ctx,"0",c.p.l-6,c.Y(0)+4,C("--muted"),"right");
      }else{
        line(c,[[0,0.5],[N,0.5]],C("--faint"),1.4,[5,4]);
        line(c,pr,C("--signal"),2);
        lab(c.ctx,"0.5",c.p.l-6,c.Y(0.5)+4,C("--muted"),"right");
        lab(c.ctx,"0.8",c.p.l-6,c.Y(0.8)+4,C("--muted"),"right");
        lab(c.ctx,"0.2",c.p.l-6,c.Y(0.2)+4,C("--muted"),"right");
      }
      axis(c);
      lab(c.ctx,"投げた回数",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      var d=2*h-N;
      out.innerHTML='n = '+N+' ／ 表 '+h+' 回（比率 <b>'+f(h/N,4)+'</b>）／ 表と裏の枚数の差 = <b>'+d+'</b>'+
        ' ／ '+(mode?'<span class="warn">枚数の差は √n のペースで広がる。過去の偏りは「打ち消される」のではなく「薄まる」だけ</span>'
                   :'<span class="ok">比率は 0.5 に収束（大数の法則）</span>');
    }
    [sn,ss].forEach(function(s){s.input.addEventListener("input",draw);});
    sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 09: 中心極限定理 ---------- */
  REG.clt=function(el){
    head(el,"CLT","元の分布が何であれ、平均は正規に近づく");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sm=select(row,"母集団の分布",["一様分布","指数分布（強く歪む）","ベルヌーイ p=0.2（0/1 の 2 値）","対数正規（極端に歪む）"]);
    var sn=slider(row,"1 標本のサイズ n",1,60,1,1);
    var out=readout(el);
    function samp(rnd,m){
      if(m===0)return rnd();
      if(m===1)return -Math.log(1-rnd());
      if(m===2)return rnd()<0.2?1:0;
      return Math.exp(gauss(rnd));
    }
    function draw(){
      var m=+sm.value,n=+sn.input.value;sn.val.textContent=n;
      var rnd=rngOf(1234),R=6000,means=[];
      for(var i=0;i<R;i++){var s=0;for(var j=0;j<n;j++)s+=samp(rnd,m);means.push(s/n);}
      var mu=mean(means),sg=sd(means);
      var lo=mu-4.2*sg,hi=mu+4.2*sg,NB=46,cnt=new Array(NB).fill(0);
      means.forEach(function(v){var k=Math.floor((v-lo)/(hi-lo)*NB);if(k>=0&&k<NB)cnt[k]++;});
      var w=(hi-lo)/NB;
      var dens=cnt.map(function(v){return v/(R*w);});
      var mx=Math.max.apply(null,dens);
      var c=chart(cc,lo,hi,0,mx*1.2);
      grid(c,4);
      var ctx=c.ctx;
      dens.forEach(function(v,i){
        var x1=c.X(lo+i*w),x2=c.X(lo+(i+1)*w);
        ctx.fillStyle=C("--signal-soft");ctx.fillRect(x1,c.Y(v),x2-x1-1,c.Y(0)-c.Y(v));});
      var pts=[];for(var x=lo;x<=hi;x+=(hi-lo)/240)pts.push([x,npdf((x-mu)/sg)/sg]);
      line(c,pts,C("--alias"),2.2);
      axis(c);
      lab(ctx,"棒 = 標本平均の分布（6000 回）／ 曲線 = 同じ平均・分散の正規分布",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"標本平均",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      // 正規性のずれ（歪度）
      var sk=0;means.forEach(function(v){sk+=Math.pow((v-mu)/sg,3);});sk/=R;
      out.innerHTML='n = <b>'+n+'</b> ／ 標本平均の SD（＝標準誤差） = <b>'+f(sg,4)+'</b> ／ 歪度 = <b>'+f(sk,3)+'</b>'+
        ' ／ '+(n===1?'<span class="warn">n=1 なので母集団分布そのもの。歪んでいれば歪んだまま</span>'
              :(Math.abs(sk)<0.2?'<span class="ok">歪度がほぼ 0 → 正規分布に十分近い</span>'
                                :'<span class="warn">まだ歪みが残っている。n を増やすと消える</span>'))+
        (m===3?' ／ <span class="warn">対数正規のように裾が重い分布は収束が遅い</span>':'');
    }
    sm.addEventListener("change",draw);sn.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 10: 最尤推定 ---------- */
  REG.mle=function(el){
    head(el,"MLE","観測を最もよく説明するパラメータを選ぶ");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"試行回数 n",1,200,10,1);
    var sk=slider(row,"成功回数 k",0,200,7,1);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,k=Math.min(+sk.input.value,n);
      sk.input.max=n;sn.val.textContent=n;sk.val.textContent=k;
      var pts=[],mn=1e9,mx=-1e9;
      for(var i=1;i<400;i++){
        var p=i/400;
        var l=k*Math.log(p)+(n-k)*Math.log(1-p);
        pts.push([p,l]);if(l<mn)mn=l;if(l>mx)mx=l;
      }
      mn=Math.max(mn,mx-Math.max(12,n*0.35));
      var c=chart(cc,0,1,mn,mx+(mx-mn)*0.12);
      grid(c,4);
      line(c,pts.filter(function(q){return q[1]>=mn;}),C("--signal"),2.4);
      axis(c);
      var ph=k/n;
      vline(c,ph,C("--alias"),[5,4]);
      dot(c,ph,mx,5,C("--alias"));
      var ctx=c.ctx;
      lab(ctx,"対数尤度 ℓ(p) = k·log p + (n−k)·log(1−p)",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"p̂ = k/n = "+f(ph,3),c.X(ph)+6,c.p.t+40,C("--alias"),"left");
      [0,0.25,0.5,0.75,1].forEach(function(p){lab(ctx,String(p),c.X(p),c.h-c.p.b+16,C("--muted"),"center");});
      // 曲率 = フィッシャー情報
      var I=n/(ph*(1-ph));
      out.innerHTML='最尤推定 p̂ = k/n = <b>'+f(ph,4)+'</b>（山の頂上）'+
        ' ／ 標準誤差 ≈ 1/√I = <b>'+(ph>0&&ph<1?f(1/Math.sqrt(I),4):"—")+'</b>'+
        ' ／ '+(n<15?'<span class="warn">n が小さいと山がなだらか = どの p も同じくらいもっともらしい（推定が不安定）</span>'
                    :'<span class="ok">n が大きいと山が鋭くなる = 情報が多く、推定が正確</span>')+
        ' ／ 山の鋭さ（曲率）がフィッシャー情報量';
    }
    sn.input.addEventListener("input",draw);sk.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 11: 信頼区間のカバレッジ ---------- */
  REG.ci=function(el){
    head(el,"Confidence Interval","95% とは「手順の成功率」");
    var cv=screen(el,270),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"標本サイズ n",3,100,10,1);
    var sl=slider(row,"信頼係数",80,99,95,1);
    var ss=slider(row,"乱数の種",1,40,2,1);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,lev=+sl.input.value/100,seed=+ss.input.value;
      sn.val.textContent=n;sl.val.textContent=(lev*100)+"%";ss.val.textContent=seed;
      var mu=50,sg=10,M=60,rnd=rngOf(seed*613);
      var tc=tinv(1-(1-lev)/2,n-1),hit=0,ivs=[];
      for(var i=0;i<M;i++){
        var a=[];for(var j=0;j<n;j++)a.push(mu+sg*gauss(rnd));
        var xb=mean(a),s=sd(a),e=tc*s/Math.sqrt(n);
        var ok=(xb-e<=mu&&mu<=xb+e);if(ok)hit++;
        ivs.push([xb-e,xb+e,ok]);
      }
      var lo=mu-4.2*sg/Math.sqrt(n)-4,hi=mu+4.2*sg/Math.sqrt(n)+4;
      var c=chart(cc,lo,hi,0,M,{l:20,r:16,t:18,b:24});
      var ctx=c.ctx;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(c.X(mu),c.p.t);ctx.lineTo(c.X(mu),c.h-c.p.b);ctx.stroke();
      ivs.forEach(function(v,i){
        var y=c.Y(i+0.5);
        ctx.strokeStyle=v[2]?C("--signal"):C("--alias");ctx.lineWidth=1.8;
        ctx.beginPath();ctx.moveTo(c.X(v[0]),y);ctx.lineTo(c.X(v[1]),y);ctx.stroke();
      });
      lab(ctx,"真の μ = 50（赤線）。各横線が 1 回の標本から作った区間",c.p.l,c.p.t-4,C("--muted"),"left");
      lab(ctx,"外した区間は赤",c.w-c.p.r,c.h-c.p.b+16,C("--alias"),"right");
      out.innerHTML=M+' 本中 <b class="ok">'+hit+'</b> 本が真の μ を含んだ（'+f(hit/M*100,1)+'%、目標 '+(lev*100)+'%）'+
        ' ／ 区間の平均幅 = <b>'+f(mean(ivs.map(function(v){return v[1]-v[0];})),2)+'</b>'+
        ' ／ <span class="warn">ランダムなのは「区間」であって μ ではない。μ は固定された定数</span>'+
        ' ／ n を増やすと幅が 1/√n で縮む';
    }
    [sn,sl,ss].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 12: p 値 ---------- */
  REG.pvalue=function(el){
    head(el,"p-value","H₀ のもとで、観測以上に極端な値が出る確率");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var st=slider(row,"観測された t 値",0,5,2.1,0.05);
    var sdl=slider(row,"自由度",1,60,24,1);
    var sm=select(row,"表示",["棄却域と p 値","H₀ が真のときの p 値の分布"]);
    var out=readout(el);
    function draw(){
      var t=+st.input.value,df=+sdl.input.value,mode=+sm.value;
      st.val.textContent=f(t,2);sdl.val.textContent=df;
      var p=tp2(t,df),tc=tinv(0.975,df);
      if(mode===0){
        var c=chart(cc,-5,5,0,0.45);
        grid(c,4);
        var pts=[],rt=[],lt=[];
        for(var z=-5;z<=5.001;z+=0.02){var y=tpdf(z,df);pts.push([z,y]);
          if(z>=t)rt.push([z,y]);if(z<=-t)lt.push([z,y]);}
        if(rt.length>1)fillArea(c,rt,C("--alias-soft"),0);
        if(lt.length>1)fillArea(c,lt,C("--alias-soft"),0);
        line(c,pts,C("--signal"),2.4);
        axis(c);
        vline(c,tc,C("--faint"),[3,3]);vline(c,-tc,C("--faint"),[3,3]);
        vline(c,t,C("--alias"));vline(c,-t,C("--alias"));
        var ctx=c.ctx;
        lab(ctx,"塗り = p 値（両側）",c.p.l+2,c.p.t+10,C("--alias"),"left");
        lab(ctx,"±"+f(tc,2)+" が 5% の棄却限界",c.w-c.p.r,c.p.t+10,C("--muted"),"right");
        [-4,-2,0,2,4].forEach(function(z){lab(ctx,String(z),c.X(z),c.h-c.p.b+16,C("--muted"),"center");});
      }else{
        var rnd=rngOf(55),R=4000,NB=20,cnt=new Array(NB).fill(0);
        for(var i=0;i<R;i++){
          var a=[];for(var j=0;j<=df;j++)a.push(gauss(rnd));
          var tt=mean(a)/(sd(a)/Math.sqrt(a.length));
          var pp=tp2(tt,a.length-1);
          cnt[Math.min(NB-1,Math.floor(pp*NB))]++;
        }
        var c2=chart(cc,0,1,0,R/NB*1.8);
        grid(c2,4);
        var ctx2=c2.ctx;
        cnt.forEach(function(v,i){
          var x1=c2.X(i/NB),x2=c2.X((i+1)/NB);
          ctx2.fillStyle=i===0?C("--alias"):C("--signal-soft");
          ctx2.fillRect(x1,c2.Y(v),x2-x1-1,c2.Y(0)-c2.Y(v));});
        line(c2,[[0,R/NB],[1,R/NB]],C("--faint"),1.6,[5,4]);
        axis(c2);
        lab(ctx2,"H₀ が真なら p 値は 0〜1 の一様分布になる",c2.p.l+2,c2.p.t+10,C("--muted"),"left");
        lab(ctx2,"赤 = p<0.05（ちょうど 5%）",c2.p.l+2,c2.p.t+24,C("--alias"),"left");
        [0,0.5,1].forEach(function(x){lab(ctx2,String(x),c2.X(x),c2.h-c2.p.b+16,C("--muted"),"center");});
      }
      out.innerHTML='t = <b>'+f(t,2)+'</b>（df='+df+'）→ 両側 p = <b class="'+(p<0.05?"ok":"warn")+'">'+
        (p<0.0001?"< 0.0001":f(p,4))+'</b>'+
        ' ／ '+(p<0.05?'5% 水準で棄却':'棄却できない')+
        ' ／ <span class="warn">p 値は「H₀ が正しい確率」ではない。H₀ を仮定した上での、データの珍しさである</span>';
    }
    st.input.addEventListener("input",draw);sdl.input.addEventListener("input",draw);
    sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 12: 検出力 ---------- */
  REG.power=function(el){
    head(el,"Power","本当に差があるとき、それを見つけられる確率");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sdl=slider(row,"効果量 d",0,1.5,0.5,0.05);
    var sn=slider(row,"各群の n",4,400,30,2);
    var sa=slider(row,"有意水準 α",0.001,0.2,0.05,0.001);
    var out=readout(el);
    function draw(){
      var d=+sdl.input.value,n=+sn.input.value,al=+sa.input.value;
      sdl.val.textContent=f(d,2);sn.val.textContent=n;sa.val.textContent=f(al,3);
      var se=Math.sqrt(2/n),ncp=d/se;               // 非心度
      var zc=ninv(1-al/2);
      var pw=1-ncdf(zc-ncp)+ncdf(-zc-ncp);
      var lo=Math.min(-4,ncp-4),hi=Math.max(4,ncp+4);
      var c=chart(cc,lo,hi,0,0.45);
      grid(c,4);
      var p0=[],p1=[],rej0=[],rej1=[];
      for(var z=lo;z<=hi;z+=(hi-lo)/400){
        p0.push([z,npdf(z)]);p1.push([z,npdf(z-ncp)]);
        if(z>=zc||z<=-zc){rej0.push([z,npdf(z)]);rej1.push([z,npdf(z-ncp)]);}
      }
      // β 領域（H1 のもとで棄却されない）
      var beta=[];for(var z2=-zc;z2<=zc;z2+=(hi-lo)/400)beta.push([z2,npdf(z2-ncp)]);
      if(beta.length>1)fillArea(c,beta,C("--alias-soft"),0);
      var r0=rej0.filter(function(q){return q[0]>=zc;});
      if(r0.length>1)fillArea(c,r0,C("--alias"),0);
      line(c,p0,C("--faint"),2);
      line(c,p1,C("--signal"),2.4);
      axis(c);
      vline(c,zc,C("--alias"),[4,3]);vline(c,-zc,C("--alias"),[4,3]);
      var ctx=c.ctx;
      lab(ctx,"灰 = H₀ の分布 ／ 緑 = H₁（真に差がある）の分布",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"薄赤 = β（見逃し）",c.X(ncp),c.Y(0.30),C("--alias"),"center");
      lab(ctx,"濃赤 = α",c.X(zc)+4,c.Y(0.02),C("--alias"),"left");
      var need=Math.ceil(2*Math.pow(ninv(1-al/2)+ninv(0.8),2)/(d*d));
      out.innerHTML='検出力 = 1−β = <b class="'+(pw>=0.8?"ok":"warn")+'">'+f(pw*100,1)+'%</b>'+
        '（β = '+f((1-pw)*100,1)+'%）'+
        ' ／ '+(d>0?'検出力 80% に必要な n = <b>'+need+'</b>（各群）':'効果量 0 では検出力 = α')+
        ' ／ '+(pw<0.5&&d>0?'<span class="warn">検出力が低い研究は、有意になった場合でも信用しにくい（効果量が過大に出る）</span>'
                          :'<span class="ok">n・効果量・α のどれかを上げれば検出力が上がる</span>');
    }
    [sdl,sn,sa].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 13: 2 標本 t 検定 ---------- */
  REG.ttest=function(el){
    head(el,"Two-sample t","差 ÷ 差の標準誤差");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);
    var sm=slider(row,"群間の平均差",0,20,5,0.5);
    var ss=slider(row,"群内の標準偏差",1,25,10,0.5);
    var sn=slider(row,"各群の n",3,120,20,1);
    var out=readout(el);
    function draw(){
      var dm=+sm.input.value,sg=+ss.input.value,n=+sn.input.value;
      sm.val.textContent=f(dm,1);ss.val.textContent=f(sg,1);sn.val.textContent=n;
      var rnd=rngOf(88),A=[],B=[];
      for(var i=0;i<n;i++){A.push(50+sg*gauss(rnd));B.push(50+dm+sg*gauss(rnd));}
      var m1=mean(A),m2=mean(B),v1=vari(A),v2=vari(B);
      var seD=Math.sqrt(v1/n+v2/n);
      var t=(m2-m1)/seD;
      var nu=Math.pow(v1/n+v2/n,2)/(Math.pow(v1/n,2)/(n-1)+Math.pow(v2/n,2)/(n-1));
      var p=tp2(t,nu),tc=tinv(0.975,nu);
      var all=A.concat(B),lo=Math.min.apply(null,all)-3,hi=Math.max.apply(null,all)+3;
      var c=chart(cc,lo,hi,0,1,{l:34,r:16,t:16,b:26});
      var ctx=c.ctx;
      function strip(d,y,col,m){
        d.forEach(function(v,i){dot(c,v,y+((i%5)-2)*0.028,3.2,col);});
        ctx.strokeStyle=col;ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(c.X(m),c.Y(y-0.14));ctx.lineTo(c.X(m),c.Y(y+0.14));ctx.stroke();
      }
      strip(A,0.68,C("--blue"),m1);strip(B,0.28,C("--signal"),m2);
      lab(ctx,"群 A",c.p.l-6,c.Y(0.68)+4,C("--blue"),"right");
      lab(ctx,"群 B",c.p.l-6,c.Y(0.28)+4,C("--signal"),"right");
      lab(ctx,"縦線 = 各群の平均",c.w-c.p.r,c.p.t+10,C("--muted"),"right");
      var ci=[m2-m1-tc*seD,m2-m1+tc*seD];
      out.innerHTML='差 = <b>'+f(m2-m1,2)+'</b>　SE = '+f(seD,2)+'　→　t = 差/SE = <b>'+f(t,3)+'</b>（ウェルチ, df='+f(nu,1)+'）'+
        ' ／ p = <b class="'+(p<0.05?"ok":"warn")+'">'+(p<0.0001?"< 0.0001":f(p,4))+'</b>'+
        ' ／ 95% CI = [<b>'+f(ci[0],2)+'</b>, <b>'+f(ci[1],2)+'</b>]'+
        ' ／ Cohen\'s d = '+f((m2-m1)/Math.sqrt((v1+v2)/2),2)+
        ' ／ '+(p<0.05?'<span class="ok">有意。ただし CI の幅で「どれだけ大きい差か」を必ず見る</span>'
                     :'<span class="warn">有意でない。だが CI が 0 を含むだけで「差がない」ではない</span>');
    }
    [sm,ss,sn].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 13: A/B テスト（比率） ---------- */
  REG.abtest=function(el){
    head(el,"A/B Test","有意でない差を「効果あり」と読まない");
    var row=ctrls(el);
    var s1=slider(row,"A 群のコンバージョン率",1,50,12,0.5);
    var s2=slider(row,"B 群のコンバージョン率",1,50,14.5,0.5);
    var sn=slider(row,"各群の訪問者数",100,50000,1000,100);
    var cv=screen(el,150),cc=cctx(cv);
    var out=readout(el);
    function draw(){
      var p1=+s1.input.value/100,p2=+s2.input.value/100,n=+sn.input.value;
      s1.val.textContent=f(p1*100,1)+"%";s2.val.textContent=f(p2*100,1)+"%";sn.val.textContent=n;
      var x1=Math.round(p1*n),x2=Math.round(p2*n);
      var ph=(x1+x2)/(2*n);
      var z=(p2-p1)/Math.sqrt(ph*(1-ph)*2/n);
      var p=2*(1-ncdf(Math.abs(z)));
      var seD=Math.sqrt(p1*(1-p1)/n+p2*(1-p2)/n);
      var ci=[p2-p1-1.96*seD,p2-p1+1.96*seD];
      var lo=Math.min(p1,p2,ci[0]+p1)-0.04,hi=Math.max(p1,p2)+0.04;
      var c=chart(cc,lo,hi,0,1,{l:34,r:16,t:16,b:26});
      var ctx=c.ctx;
      [[p1,0.66,C("--blue"),"A"],[p2,0.3,C("--signal"),"B"]].forEach(function(g){
        var e=1.96*Math.sqrt(g[0]*(1-g[0])/n);
        ctx.strokeStyle=g[2];ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(c.X(g[0]-e),c.Y(g[1]));ctx.lineTo(c.X(g[0]+e),c.Y(g[1]));
        ctx.moveTo(c.X(g[0]-e),c.Y(g[1]-0.09));ctx.lineTo(c.X(g[0]-e),c.Y(g[1]+0.09));
        ctx.moveTo(c.X(g[0]+e),c.Y(g[1]-0.09));ctx.lineTo(c.X(g[0]+e),c.Y(g[1]+0.09));
        ctx.stroke();
        dot(c,g[0],g[1],5,g[2]);
        lab(ctx,g[3],c.p.l-6,c.Y(g[1])+4,g[2],"right");
      });
      lab(ctx,"横棒 = 各群の 95% 信頼区間",c.w-c.p.r,c.p.t+10,C("--muted"),"right");
      var need=Math.ceil(2*Math.pow(1.96+0.84,2)*ph*(1-ph)/Math.pow(p2-p1,2));
      out.innerHTML='A: '+x1+'/'+n+' = '+f(p1*100,2)+'%　B: '+x2+'/'+n+' = '+f(p2*100,2)+'%'+
        ' ／ z = <b>'+f(z,3)+'</b>　p = <b class="'+(p<0.05?"ok":"warn")+'">'+(p<0.0001?"< 0.0001":f(p,4))+'</b>'+
        ' ／ 差の 95% CI = [<b>'+f(ci[0]*100,2)+'</b>, <b>'+f(ci[1]*100,2)+'</b>] ポイント'+
        ' ／ '+(p<0.05?'<span class="ok">有意</span>'
              :'<span class="warn">有意でない。この差を検出力 80% で検出するには各群 '+need+' 人必要</span>')+
        ' ／ <span class="warn">有意になるまで毎日覗くと、第 1 種の誤りが 5%→20〜30% に膨らむ</span>';
    }
    [s1,s2,sn].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 14: χ² 独立性の検定 ---------- */
  REG.chisq=function(el){
    head(el,"Chi-square","観測度数と期待度数のズレを二乗して基準化");
    var row=ctrls(el);
    var ia=textin(row,"a（処置・結果あり）",40,"80px"),ib=textin(row,"b（処置・なし）",160,"80px");
    var ic=textin(row,"c（対照・結果あり）",20,"80px"),id=textin(row,"d（対照・なし）",280,"80px");
    var out=panel(el),rd=readout(el);
    function draw(){
      var a=+ia.value,b=+ib.value,cc2=+ic.value,d=+id.value;
      if([a,b,cc2,d].some(function(v){return !(v>=0)||isNaN(v);})){out.innerHTML="0 以上の整数を入力してください";rd.innerHTML="";return;}
      var n=a+b+cc2+d;if(!n){out.innerHTML="";rd.innerHTML="";return;}
      var R=[a+b,cc2+d],K=[a+cc2,b+d];
      var E=[[R[0]*K[0]/n,R[0]*K[1]/n],[R[1]*K[0]/n,R[1]*K[1]/n]];
      var O=[[a,b],[cc2,d]];
      var x2=0,cells="";
      for(var i=0;i<2;i++)for(var j=0;j<2;j++){
        var e=E[i][j];if(e>0)x2+=(O[i][j]-e)*(O[i][j]-e)/e;}
      var p=1-chi2cdf(x2,1);
      var h='<table style="border-collapse:collapse"><tr>'+
        ["","結果あり","結果なし","計"].map(function(t){
          return '<th style="padding:.2rem .8rem;text-align:right;color:var(--muted)">'+t+'</th>';}).join("")+'</tr>';
      ["処置群","対照群"].forEach(function(nm,i){
        h+='<tr><td style="padding:.2rem .8rem">'+nm+'</td>';
        for(var j=0;j<2;j++){
          h+='<td style="padding:.2rem .8rem;text-align:right">'+O[i][j]+
             '<span style="color:var(--faint)"> ('+f(E[i][j],1)+')</span></td>';}
        h+='<td style="padding:.2rem .8rem;text-align:right">'+R[i]+'</td></tr>';
      });
      h+='<tr><td style="padding:.2rem .8rem;color:var(--muted)">計</td>'+
        [K[0],K[1],n].map(function(v){return '<td style="padding:.2rem .8rem;text-align:right;color:var(--muted)">'+v+'</td>';}).join("")+'</tr></table>';
      h+='<div style="color:var(--muted);margin-top:.4rem">括弧内は期待度数 E = 行計×列計/n</div>';
      out.innerHTML=h;
      var minE=Math.min(E[0][0],E[0][1],E[1][0],E[1][1]);
      var or=(b*cc2)?(a*d)/(b*cc2):Infinity;
      var rr=(cc2+d)&&cc2?(a/(a+b))/(cc2/(cc2+d)):Infinity;
      var V=Math.sqrt(x2/n);
      rd.innerHTML='χ² = <b>'+f(x2,3)+'</b>（df=1、5% 点は 3.841）／ p = <b class="'+(p<0.05?"ok":"warn")+'">'+
        (p<0.0001?"< 0.0001":f(p,4))+'</b>'+
        ' ／ オッズ比 = <b>'+(isFinite(or)?f(or,3):"∞")+'</b>　リスク比 = <b>'+(isFinite(rr)?f(rr,3):"∞")+'</b>'+
        '　クラメールの V = '+f(V,3)+
        ' ／ '+(minE<5?'<span class="warn">期待度数 '+f(minE,1)+' &lt; 5 のセルがある → フィッシャーの正確検定を使うべき</span>'
                     :'<span class="ok">すべての期待度数が 5 以上 → χ² 近似が使える</span>')+
        ' ／ <span class="warn">χ² は関連の有無だけ。強さは OR や V で見る</span>';
    }
    [ia,ib,ic,id].forEach(function(t){t.addEventListener("input",draw);});reg(null,draw);draw();
  };

  /* ---------- 15: 分散分析 ---------- */
  REG.anova=function(el){
    head(el,"ANOVA","群による差 ÷ 群内の偶然のばらつき");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var s1=slider(row,"群 A の平均",30,70,50,1);
    var s2=slider(row,"群 B の平均",30,70,57,1);
    var s3=slider(row,"群 C の平均",30,70,50,1);
    var ss=slider(row,"群内の標準偏差",1,20,6,0.5);
    var sn=slider(row,"各群の n",3,60,10,1);
    var out=readout(el);
    function draw(){
      var M=[+s1.input.value,+s2.input.value,+s3.input.value],sg=+ss.input.value,n=+sn.input.value;
      s1.val.textContent=M[0];s2.val.textContent=M[1];s3.val.textContent=M[2];
      ss.val.textContent=f(sg,1);sn.val.textContent=n;
      var rnd=rngOf(31),G=[[],[],[]];
      for(var g=0;g<3;g++)for(var i=0;i<n;i++)G[g].push(M[g]+sg*gauss(rnd));
      var all=G[0].concat(G[1],G[2]),gm=mean(all),N=all.length,k=3;
      var SSB=0,SSW=0;
      G.forEach(function(a){var m=mean(a);SSB+=n*(m-gm)*(m-gm);
        a.forEach(function(v){SSW+=(v-m)*(v-m);});});
      var SST=SSB+SSW,MSB=SSB/(k-1),MSW=SSW/(N-k),F=MSB/MSW;
      var p=1-fcdf(F,k-1,N-k),eta=SSB/SST;
      var lo=Math.min.apply(null,all)-2,hi=Math.max.apply(null,all)+2;
      var c=chart(cc,-0.5,2.5,lo,hi,{l:40,r:16,t:18,b:34});
      grid(c,4);
      var ctx=c.ctx;
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.4;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(gm));ctx.lineTo(c.w-c.p.r,c.Y(gm));ctx.stroke();ctx.setLineDash([]);
      var cols=[C("--signal"),C("--blue"),C("--alias")];
      G.forEach(function(a,g){
        a.forEach(function(v,i){dot(c,g+((i%7)-3)*0.055,v,3.2,cols[g]);});
        var m=mean(a);
        ctx.strokeStyle=cols[g];ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(c.X(g-0.3),c.Y(m));ctx.lineTo(c.X(g+0.3),c.Y(m));ctx.stroke();
        lab(ctx,"ABC"[g],c.X(g),c.h-c.p.b+18,cols[g],"center");
      });
      lab(ctx,"破線 = 全体平均 ／ 太線 = 各群の平均",c.p.l+2,c.p.t+10,C("--muted"),"left");
      out.innerHTML='SS<sub>B</sub> = <b>'+f(SSB,1)+'</b>（df '+(k-1)+'）　SS<sub>W</sub> = <b>'+f(SSW,1)+'</b>（df '+(N-k)+'）　SS<sub>T</sub> = '+f(SST,1)+
        ' ／ F = MS<sub>B</sub>/MS<sub>W</sub> = '+f(MSB,1)+'/'+f(MSW,1)+' = <b>'+f(F,3)+'</b>'+
        ' ／ p = <b class="'+(p<0.05?"ok":"warn")+'">'+(p<0.0001?"< 0.0001":f(p,4))+'</b>'+
        ' ／ η² = <b>'+f(eta,3)+'</b>（＝回帰の R²）'+
        ' ／ '+(p<0.05?'<span class="ok">どこかに差がある。どのペアかは事後検定（テューキー等）で</span>'
                     :'<span class="warn">差があるとは言えない。H₀ のもとでは F ≈ 1 になる</span>');
    }
    [s1,s2,s3,ss,sn].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 16: 並べ替え検定 ---------- */
  REG.permtest=function(el){
    head(el,"Permutation","ラベルを入れ替えて H₀ の分布を作る");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sdl=slider(row,"真の群間差",0,15,6,0.5);
    var sn=slider(row,"各群の n",4,40,12,1);
    var sb=slider(row,"並べ替えの回数",200,20000,3000,200);
    var out=readout(el);
    function draw(){
      var dm=+sdl.input.value,n=+sn.input.value,B=+sb.input.value;
      sdl.val.textContent=f(dm,1);sn.val.textContent=n;sb.val.textContent=B;
      var rnd=rngOf(17),A=[],Bg=[];
      for(var i=0;i<n;i++){A.push(50+8*gauss(rnd));Bg.push(50+dm+8*gauss(rnd));}
      var obs=mean(Bg)-mean(A);
      var pool=A.concat(Bg),N=pool.length,ds=[],ge=0;
      var r2=rngOf(555);
      for(var b=0;b<B;b++){
        var p=pool.slice();
        for(var j=N-1;j>0;j--){var kk=Math.floor(r2()*(j+1));var t=p[j];p[j]=p[kk];p[kk]=t;}
        var d=mean(p.slice(n))-mean(p.slice(0,n));
        ds.push(d);if(Math.abs(d)>=Math.abs(obs))ge++;
      }
      var pv=(ge+1)/(B+1);
      var lo=Math.min.apply(null,ds.concat([-Math.abs(obs)*1.15])),hi=Math.max.apply(null,ds.concat([Math.abs(obs)*1.15]));
      var NB=44,cnt=new Array(NB).fill(0),w=(hi-lo)/NB;
      ds.forEach(function(v){var kk=Math.min(NB-1,Math.max(0,Math.floor((v-lo)/w)));cnt[kk]++;});
      var mx=Math.max.apply(null,cnt);
      var c=chart(cc,lo,hi,0,mx*1.2);
      grid(c,4);
      var ctx=c.ctx;
      cnt.forEach(function(v,i){
        var xc=lo+(i+0.5)*w;
        var x1=c.X(lo+i*w),x2=c.X(lo+(i+1)*w);
        ctx.fillStyle=Math.abs(xc)>=Math.abs(obs)?C("--alias"):C("--signal-soft");
        ctx.fillRect(x1,c.Y(v),x2-x1-1,c.Y(0)-c.Y(v));});
      axis(c);
      vline(c,obs,C("--ink"));vline(c,-obs,C("--faint"),[3,3]);
      lab(ctx,"H₀ のもとでの「群間差」の分布（ラベルをシャッフルして作った）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"観測値 "+f(obs,2),c.X(obs),c.p.t+26,C("--ink"),"center");
      var seD=Math.sqrt(vari(A)/n+vari(Bg)/n);
      var tt=obs/seD,nu=2*n-2;
      out.innerHTML='観測された差 = <b>'+f(obs,3)+'</b> ／ 並べ替え p 値 = (件数+1)/(B+1) = <b class="'+(pv<0.05?"ok":"warn")+'">'+f(pv,4)+'</b>'+
        ' ／ 参考: t 検定の p = '+f(tp2(tt,nu),4)+
        ' ／ <span class="ok">分布の形を一切仮定していない厳密検定。どんな統計量でも使える</span>';
    }
    [sdl,sn,sb].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 16: ブートストラップ ---------- */
  REG.bootstrap=function(el){
    head(el,"Bootstrap","理論式が無くても標準誤差と区間が出る");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var st=select(row,"統計量",["中央値","平均","四分位範囲 IQR","相関係数"]);
    var sn=slider(row,"標本サイズ n",8,200,40,1);
    var sb=slider(row,"リサンプル回数 B",200,10000,2000,100);
    var out=readout(el);
    function draw(){
      var kind=+st.value,n=+sn.input.value,B=+sb.input.value;
      sn.val.textContent=n;sb.val.textContent=B;
      var rnd=rngOf(9),X=[],Y=[];
      for(var i=0;i<n;i++){var g=gauss(rnd);X.push(Math.exp(3+0.45*g));Y.push(20+2*g+3*gauss(rnd));}
      function stat(ix){
        var xs=ix.map(function(k){return X[k];});
        if(kind===0)return quant(xs,0.5);
        if(kind===1)return mean(xs);
        if(kind===2)return quant(xs,0.75)-quant(xs,0.25);
        return corrOf(xs,ix.map(function(k){return Y[k];}));
      }
      var idx=[];for(i=0;i<n;i++)idx.push(i);
      var obs=stat(idx);
      var r2=rngOf(4242),vals=[];
      for(var b=0;b<B;b++){
        var s=[];for(i=0;i<n;i++)s.push(Math.floor(r2()*n));
        vals.push(stat(s));
      }
      vals=vals.filter(function(v){return isFinite(v);});
      var se=sd(vals),ci=[quant(vals,0.025),quant(vals,0.975)];
      var lo=quant(vals,0.002),hi=quant(vals,0.998);
      var NB=44,cnt=new Array(NB).fill(0),w=(hi-lo)/NB||1;
      vals.forEach(function(v){var kk=Math.min(NB-1,Math.max(0,Math.floor((v-lo)/w)));cnt[kk]++;});
      var mx=Math.max.apply(null,cnt);
      var c=chart(cc,lo,hi,0,mx*1.2);
      grid(c,4);
      var ctx=c.ctx;
      cnt.forEach(function(v,i){
        var xc=lo+(i+0.5)*w,x1=c.X(lo+i*w),x2=c.X(lo+(i+1)*w);
        ctx.fillStyle=(xc>=ci[0]&&xc<=ci[1])?C("--signal-soft"):C("--grid");
        ctx.fillRect(x1,c.Y(v),x2-x1-1,c.Y(0)-c.Y(v));});
      axis(c);
      vline(c,obs,C("--alias"));
      lab(ctx,"ブートストラップ分布（濃い部分が 95% 区間）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"元の推定値 "+f(obs,3),c.X(obs)+6,c.p.t+28,C("--alias"),"left");
      out.innerHTML='推定値 = <b>'+f(obs,4)+'</b> ／ ブートストラップ SE = <b>'+f(se,4)+'</b>'+
        ' ／ パーセンタイル 95% CI = [<b>'+f(ci[0],4)+'</b>, <b>'+f(ci[1],4)+'</b>]'+
        ' ／ <span class="ok">'+["中央値","平均","IQR","相関係数"][kind]+
        'の標準誤差を、理論式を一切使わずに求めた</span>'+
        (n<15?' ／ <span class="warn">n が小さいとブートストラップも信頼できない</span>':'');
    }
    st.addEventListener("change",draw);
    [sn,sb].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 17: 多重比較 ---------- */
  REG.multiple=function(el){
    head(el,"Multiplicity","20 回検定すれば 1 回は有意になる");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sm=slider(row,"検定の回数 m",1,100,20,1);
    var sa=slider(row,"各検定の α",0.001,0.2,0.05,0.001);
    var out=readout(el);
    function draw(){
      var m=+sm.input.value,al=+sa.input.value;
      sm.val.textContent=m;sa.val.textContent=f(al,3);
      var c=chart(cc,1,100,0,1);
      grid(c,4);
      var pts=[],ptsB=[];
      for(var k=1;k<=100;k++){pts.push([k,1-Math.pow(1-al,k)]);ptsB.push([k,1-Math.pow(1-al/k,k)]);}
      line(c,[[1,0.05],[100,0.05]],C("--faint"),1.4,[5,4]);
      line(c,pts,C("--alias"),2.4);
      line(c,ptsB,C("--signal"),2.2);
      axis(c);
      var fwer=1-Math.pow(1-al,m);
      vline(c,m,C("--ink"),[4,3]);
      dot(c,m,fwer,5,C("--alias"));
      var ctx=c.ctx;
      lab(ctx,"赤 = 補正なしの FWER ／ 緑 = ボンフェローニ補正後",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"0.05",c.p.l-6,c.Y(0.05)+4,C("--muted"),"right");
      lab(ctx,"100%",c.p.l-6,c.Y(1)+4,C("--muted"),"right");
      lab(ctx,"検定の回数 m",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      out.innerHTML='m = <b>'+m+'</b> 回検定すると、真の差が 1 つも無くても'+
        '<b class="warn">'+f(fwer*100,1)+'%</b> の確率でどこかが「有意」になる'+
        ' ／ ボンフェローニ: 各検定を α/m = <b>'+f(al/m,5)+'</b> で判定 → FWER '+f((1-Math.pow(1-al/m,m))*100,2)+'%'+
        ' ／ <span class="warn">ホルム法は常にボンフェローニ以上に強力。実務ではホルムを既定に</span>';
    }
    sm.input.addEventListener("input",draw);sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 17: FDR (BH 法) ---------- */
  REG.fdr=function(el){
    head(el,"FDR","有意としたもののうち偽陽性の割合を抑える");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sm=slider(row,"検定の総数 m",20,500,100,10);
    var st=slider(row,"本当に効果がある割合",0,50,10,1);
    var sq=slider(row,"FDR の目標 q",0.01,0.3,0.05,0.01);
    var out=readout(el);
    function draw(){
      var m=+sm.input.value,frac=+st.input.value/100,q=+sq.input.value;
      sm.val.textContent=m;st.val.textContent=(frac*100)+"%";sq.val.textContent=f(q,2);
      var rnd=rngOf(66),ps=[],truth=[];
      var nTrue=Math.round(m*frac);
      for(var i=0;i<m;i++){
        var real=i<nTrue;
        var z=real?3.2+gauss(rnd):gauss(rnd);
        ps.push(2*(1-ncdf(Math.abs(z))));truth.push(real);
      }
      var ord=ps.map(function(p,i){return {p:p,t:truth[i]};}).sort(function(a,b){return a.p-b.p;});
      // BH
      var kbh=0;
      for(i=0;i<m;i++) if(ord[i].p<=(i+1)/m*q) kbh=i+1;
      // ボンフェローニ
      var kbf=0;for(i=0;i<m;i++) if(ord[i].p<=q/m) kbf=i+1;
      var c=chart(cc,0,m,0,Math.max(q*1.4,ord[Math.min(m-1,Math.round(m*0.35))].p));
      grid(c,4);
      line(c,[[0,0],[m,q]],C("--signal"),2,[6,4]);
      line(c,[[0,q/m],[m,q/m]],C("--alias"),1.6,[4,3]);
      var ctx=c.ctx;
      ord.forEach(function(o,i){
        var col=i<kbh?(o.t?C("--signal"):C("--alias")):C("--faint");
        dot(c,i+1,o.p,i<kbh?3.6:2.2,col);
      });
      axis(c);
      lab(ctx,"緑破線 = BH の閾値 (i/m)q ／ 赤破線 = ボンフェローニ q/m",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"● 有意かつ本物 　● 有意だが偽陽性 　● 非有意",c.p.l+2,c.p.t+24,C("--muted"),"left");
      lab(ctx,"p 値の順位",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      var fp=0;for(i=0;i<kbh;i++) if(!ord[i].t)fp++;
      var tp=kbh-fp;
      out.innerHTML='BH 法: <b>'+kbh+'</b> 件を有意（うち本物 '+tp+'、偽陽性 '+fp+' → 実際の FDR '+
        (kbh?f(fp/kbh*100,1):"0")+'%、目標 '+f(q*100,0)+'%）'+
        ' ／ ボンフェローニ: <b>'+kbf+'</b> 件だけ'+
        ' ／ <span class="ok">BH の方が多く拾える（検出力が高い）。探索的研究向き</span>'+
        ' ／ <span class="warn">確証的研究では FWER（ホルム法）を使う</span>';
    }
    [sm,st,sq].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 18: 最小二乗法 ---------- */
  REG.ols=function(el){
    head(el,"Least Squares","残差平方和を最小にする直線はただ 1 本");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sb=slider(row,"傾き b₁",-1,3,0.4,0.05);
    var s0=slider(row,"切片 b₀",-10,30,5,0.5);
    var out=readout(el);
    var rnd=rngOf(23),X=[],Y=[];
    for(var i=0;i<24;i++){var x=2+i*0.7+0.4*gauss(rnd);X.push(x);Y.push(4+1.3*x+3.2*gauss(rnd));}
    var fit=olsFit(X,Y);
    function draw(){
      var b1=+sb.input.value,b0=+s0.input.value;
      sb.val.textContent=f(b1,2);s0.val.textContent=f(b0,1);
      var lo=Math.min.apply(null,X)-1,hi=Math.max.apply(null,X)+1;
      var yl=Math.min.apply(null,Y)-4,yh=Math.max.apply(null,Y)+4;
      var c=chart(cc,lo,hi,yl,yh);
      grid(c,4);
      var ctx=c.ctx;
      // 残差の四角形
      var rss=0,rssBest=0;
      for(var i=0;i<X.length;i++){
        var yh2=b0+b1*X[i],e=Y[i]-yh2;rss+=e*e;
        var eb=Y[i]-(fit.b0+fit.b1*X[i]);rssBest+=eb*eb;
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1;ctx.globalAlpha=.55;
        ctx.beginPath();ctx.moveTo(c.X(X[i]),c.Y(Y[i]));ctx.lineTo(c.X(X[i]),c.Y(yh2));ctx.stroke();
        ctx.globalAlpha=1;
      }
      line(c,[[lo,fit.b0+fit.b1*lo],[hi,fit.b0+fit.b1*hi]],C("--faint"),1.6,[6,4]);
      line(c,[[lo,b0+b1*lo],[hi,b0+b1*hi]],C("--signal"),2.4);
      for(i=0;i<X.length;i++)dot(c,X[i],Y[i],3.6,C("--blue"));
      axis(c);
      dot(c,mean(X),mean(Y),6,C("--alias"),true);
      lab(ctx,"実線 = あなたの直線 ／ 破線 = 最小二乗解 ／ ○ = (x̄, ȳ)",c.p.l+2,c.p.t+10,C("--muted"),"left");
      var r=corrOf(X,Y);
      out.innerHTML='あなたの RSS = <b>'+f(rss,1)+'</b> ／ 最小二乗解の RSS = <b class="ok">'+f(rssBest,1)+'</b>'+
        '（差 '+f(rss-rssBest,1)+'）'+
        ' ／ 最小二乗解: b₁ = S<sub>xy</sub>/S<sub>xx</sub> = <b>'+f(fit.b1,3)+'</b>、b₀ = ȳ − b₁x̄ = <b>'+f(fit.b0,2)+'</b>'+
        ' ／ r = '+f(r,3)+'、R² = '+f(r*r,3)+
        ' ／ '+(rss-rssBest<0.5?'<span class="ok">最小二乗解に一致。回帰直線は必ず (x̄, ȳ) を通る</span>'
                              :'<span class="warn">まだ RSS を減らせる</span>');
    }
    sb.input.addEventListener("input",draw);s0.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 18: 平均への回帰 ---------- */
  REG.regmean=function(el){
    head(el,"Regression to the Mean","極端な値は次に平均へ戻る");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"1 回目と 2 回目の相関 r",0,95,60,5);
    var sk=slider(row,"「下位何 %」を選んで介入するか",5,50,20,5);
    var out=readout(el);
    function draw(){
      var r=+sr.input.value/100,k=+sk.input.value/100;
      sr.val.textContent=f(r,2);sk.val.textContent=(k*100)+"%";
      var rnd=rngOf(77),A=[],B=[];
      for(var i=0;i<300;i++){var a=gauss(rnd);A.push(a);B.push(r*a+Math.sqrt(1-r*r)*gauss(rnd));}
      var thr=quant(A,k);
      var sel=[];for(i=0;i<A.length;i++) if(A[i]<=thr)sel.push(i);
      var m1=mean(sel.map(function(i){return A[i];}));
      var m2=mean(sel.map(function(i){return B[i];}));
      var c=chart(cc,-3.4,3.4,-3.4,3.4);
      grid(c,4);
      var ctx=c.ctx;
      ctx.fillStyle=C("--alias-soft");
      ctx.fillRect(c.p.l,c.p.t,c.X(thr)-c.p.l,c.h-c.p.t-c.p.b);
      for(i=0;i<A.length;i++)dot(c,A[i],B[i],2.8,A[i]<=thr?C("--alias"):C("--faint"));
      line(c,[[-3.4,-3.4],[3.4,3.4]],C("--faint"),1.4,[5,4]);
      line(c,[[-3.4,-3.4*r],[3.4,3.4*r]],C("--signal"),2.2);
      axis(c);
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(c.X(m1),c.Y(-3.4));ctx.lineTo(c.X(m1),c.Y(3.4));ctx.stroke();
      dot(c,m1,m2,6,C("--blue"));
      lab(ctx,"1 回目（下位 "+(k*100)+"% を赤で選抜）",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"2 回目",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"実線 = 回帰直線（傾き r）／ 破線 = y=x",c.p.l+2,c.p.t+24,C("--muted"),"left");
      out.innerHTML='選抜した集団: 1 回目の平均 <b>'+f(m1,3)+'</b> → 2 回目の平均 <b>'+f(m2,3)+'</b>'+
        '（<b class="warn">'+f(m2-m1,3)+' 改善</b>）'+
        ' ／ <span class="warn">何の介入もしていないのに改善している。これが平均への回帰</span>'+
        ' ／ 傾き = r = '+f(r,2)+' &lt; 1 なので、極端な値ほど平均寄りに戻る'+
        ' ／ <span class="ok">対策: 同じ選抜をした対照群を置き、その差だけを効果と見なす</span>';
    }
    sr.input.addEventListener("input",draw);sk.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 19: 多重共線性 ---------- */
  REG.multicol=function(el){
    head(el,"Multicollinearity","係数が不安定になる。予測は壊れない");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"x₁ と x₂ の相関",0,99,0,1);
    var sn=slider(row,"標本サイズ n",20,300,60,5);
    var out=readout(el);
    function draw(){
      var rx=+sr.input.value/100,n=+sn.input.value;
      sr.val.textContent=f(rx,2);sn.val.textContent=n;
      // 100 回データを取り直して係数のばらつきを見る
      var R=100,b1s=[],b2s=[],preds=[];
      for(var rep=0;rep<R;rep++){
        var rnd=rngOf(1000+rep),x1=[],x2=[],y=[];
        for(var i=0;i<n;i++){
          var a=gauss(rnd),b=rx*a+Math.sqrt(1-rx*rx)*gauss(rnd);
          x1.push(a);x2.push(b);y.push(1.0*a+1.0*b+gauss(rnd));
        }
        // 2 変数重回帰の閉じた解
        var s11=0,s22=0,s12=0,s1y=0,s2y=0;
        var m1=mean(x1),m2=mean(x2),my=mean(y);
        for(i=0;i<n;i++){var d1=x1[i]-m1,d2=x2[i]-m2,dy=y[i]-my;
          s11+=d1*d1;s22+=d2*d2;s12+=d1*d2;s1y+=d1*dy;s2y+=d2*dy;}
        var det=s11*s22-s12*s12;
        var b1=(s22*s1y-s12*s2y)/det,b2=(s11*s2y-s12*s1y)/det;
        b1s.push(b1);b2s.push(b2);
        preds.push(b1*1+b2*1);   // x1=x2=1 での予測（真値 2）
      }
      var c=chart(cc,-2,4,-2,4);
      grid(c,4);
      for(rep=0;rep<R;rep++)dot(c,b1s[rep],b2s[rep],3,C("--signal"));
      axis(c);
      dot(c,1,1,6,C("--alias"),true);
      var ctx=c.ctx;
      line(c,[[-2,4],[4,-2]],C("--faint"),1.4,[4,3]);
      lab(ctx,"○ = 真の係数 (1, 1)",c.p.l+2,c.p.t+10,C("--alias"),"left");
      lab(ctx,"点 = 100 回データを取り直したときの推定値",c.p.l+2,c.p.t+24,C("--muted"),"left");
      lab(ctx,"β₁",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"β₂",c.p.l-6,c.p.t+10,C("--muted"),"right");
      var vif=1/(1-rx*rx);
      out.innerHTML='VIF = 1/(1−r²) = <b class="'+(vif>10?"warn":(vif>5?"warn":"ok"))+'">'+f(vif,2)+'</b>'+
        ' ／ β₁ の SD = <b>'+f(sd(b1s),3)+'</b>、β₂ の SD = <b>'+f(sd(b2s),3)+'</b>'+
        ' ／ <b class="ok">予測値（x₁=x₂=1）の SD = '+f(sd(preds),3)+'</b>'+
        ' ／ '+(vif>10?'<span class="warn">VIF &gt; 10 は深刻。係数は大きくばらつくが、予測は安定したまま</span>'
                     :'<span class="ok">係数は安定している</span>')+
        ' ／ 点が反対角線上に伸びる＝「β₁ を上げて β₂ を下げても同じ当てはまり」';
    }
    sr.input.addEventListener("input",draw);sn.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 20: 残差プロット ---------- */
  REG.resid=function(el){
    head(el,"Residual Plot","残差にパターンが見えたら前提が壊れている");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sm=select(row,"データの性質",["問題なし","線形性が崩れている（曲がっている）",
      "不均一分散（ラッパ型）","外れ値・高てこ比の点がある"]);
    var sv=select(row,"表示",["残差 vs 予測値","元の散布図と回帰直線","Q-Q プロット"]);
    var out=readout(el);
    function gen(m){
      var rnd=rngOf(15),X=[],Y=[];
      for(var i=0;i<70;i++){
        var x=i*0.14+0.3*rnd();
        var y;
        if(m===0)y=3+1.4*x+2*gauss(rnd);
        else if(m===1)y=3+4*x-0.35*x*x+1.4*gauss(rnd);
        else y=3+1.4*x+(0.35+0.55*x)*gauss(rnd);
        X.push(x);Y.push(y);
      }
      if(m===3){X.push(12.5);Y.push(3);}
      return {X:X,Y:Y};
    }
    function draw(){
      var m=+sm.value,v=+sv.value,g=gen(m),X=g.X,Y=g.Y;
      var fit=olsFit(X,Y);
      var E=X.map(function(x,i){return Y[i]-(fit.b0+fit.b1*x);});
      var c,ctx;
      if(v===0){
        var P=X.map(function(x){return fit.b0+fit.b1*x;});
        var lo=Math.min.apply(null,P)-1,hi=Math.max.apply(null,P)+1;
        var el2=Math.max.apply(null,E.map(Math.abs))*1.2;
        c=chart(cc,lo,hi,-el2,el2);ctx=c.ctx;
        grid(c,4);
        line(c,[[lo,0],[hi,0]],C("--alias"),1.6,[5,4]);
        for(var i=0;i<X.length;i++)dot(c,P[i],E[i],3.4,C("--signal"));
        axis(c);
        lab(ctx,"残差 e",c.p.l-6,c.p.t+10,C("--muted"),"right");
        lab(ctx,"予測値 ŷ",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      }else if(v===1){
        var xl=Math.min.apply(null,X)-0.5,xh=Math.max.apply(null,X)+0.5;
        var yl=Math.min.apply(null,Y)-1,yh=Math.max.apply(null,Y)+1;
        c=chart(cc,xl,xh,yl,yh);ctx=c.ctx;
        grid(c,4);
        line(c,[[xl,fit.b0+fit.b1*xl],[xh,fit.b0+fit.b1*xh]],C("--alias"),2.2);
        for(i=0;i<X.length;i++)dot(c,X[i],Y[i],3.4,C("--signal"));
        axis(c);
      }else{
        var s=E.slice().sort(function(a,b){return a-b;}),N=s.length;
        var q=[];for(i=0;i<N;i++)q.push([ninv((i+0.5)/N),s[i]]);
        var lim=Math.max(3,Math.max.apply(null,s.map(Math.abs))/sd(E)+0.5);
        c=chart(cc,-lim,lim,-lim*sd(E),lim*sd(E));ctx=c.ctx;
        grid(c,4);
        line(c,[[-lim,-lim*sd(E)],[lim,lim*sd(E)]],C("--alias"),1.8,[5,4]);
        q.forEach(function(p){dot(c,p[0],p[1],3.2,C("--signal"));});
        axis(c);
        lab(ctx,"理論分位点（標準正規）",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
        lab(ctx,"残差の分位点",c.p.l+2,c.p.t+10,C("--muted"),"left");
      }
      // てこ比とクックの距離
      var n=X.length,mx=mean(X),sxx=fit.sxx;
      var hmax=0,dmax=0,se2=E.reduce(function(s2,e){return s2+e*e;},0)/(n-2);
      for(i=0;i<n;i++){
        var h=1/n+(X[i]-mx)*(X[i]-mx)/sxx;
        var D=E[i]*E[i]/(2*se2)*h/((1-h)*(1-h));
        if(h>hmax)hmax=h;if(D>dmax)dmax=D;
      }
      var msg=["<span class='ok'>残差がランダムな帯。前提 OK</span>",
               "<span class='warn'>残差が U 字 → 直線モデルが不適切。二乗項や変換を検討</span>",
               "<span class='warn'>残差がラッパ型 → 不均一分散。頑健標準誤差か対数変換を</span>",
               "<span class='warn'>1 点が傾きを支配している。てこ比とクックの距離を確認</span>"][m];
      out.innerHTML=msg+' ／ 最大てこ比 h = <b>'+f(hmax,3)+'</b>（目安 2(p+1)/n = '+f(4/n,3)+'）'+
        ' ／ 最大クックの距離 D = <b class="'+(dmax>1?"warn":"ok")+'">'+f(dmax,3)+'</b>（目安 1）'+
        ' ／ R² = '+f(Math.pow(corrOf(X,Y),2),3);
    }
    sm.addEventListener("change",draw);sv.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 20: Ridge と Lasso ---------- */
  REG.ridge=function(el){
    head(el,"Regularization","バイアスを買って分散を売る");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sl=slider(row,"log₁₀ λ",-3,3,-1,0.05);
    var sm=select(row,"手法",["Ridge（L2）","Lasso（L1）"]);
    var out=readout(el);
    // 相関の強い 6 変数、真の係数は最初の 2 つだけ非零
    var P=6,n=40,rnd=rngOf(5),Xs=[],Ys=[],TRUE=[2.5,-1.8,0,0,0,0];
    for(var i=0;i<n;i++){
      var base=gauss(rnd),xr=[];
      for(var j=0;j<P;j++)xr.push(0.65*base+0.75*gauss(rnd));
      var y=0;for(j=0;j<P;j++)y+=TRUE[j]*xr[j];
      y+=1.2*gauss(rnd);Xs.push(xr);Ys.push(y);
    }
    // 標準化
    var mu=[],sg=[];
    for(j=0;j<P;j++){var col=Xs.map(function(r){return r[j];});mu.push(mean(col));sg.push(sd(col));}
    var Z=Xs.map(function(r){return r.map(function(v,j){return (v-mu[j])/sg[j];});});
    var ym=mean(Ys),Yc=Ys.map(function(v){return v-ym;});
    function ridgeFit(lam){
      // (Z'Z + λI) b = Z'y をガウス消去で
      var A=[],bv=[];
      for(var a=0;a<P;a++){var rw=[];for(var b=0;b<P;b++){var s=0;
        for(var i2=0;i2<n;i2++)s+=Z[i2][a]*Z[i2][b];rw.push(s+(a===b?lam:0));}
        var sy=0;for(i2=0;i2<n;i2++)sy+=Z[i2][a]*Yc[i2];A.push(rw);bv.push(sy);}
      for(a=0;a<P;a++){
        var piv=A[a][a];
        for(b=a;b<P;b++)A[a][b]/=piv;bv[a]/=piv;
        for(var r2=0;r2<P;r2++) if(r2!==a){var fct=A[r2][a];
          for(b=a;b<P;b++)A[r2][b]-=fct*A[a][b];bv[r2]-=fct*bv[a];}
      }
      return bv;
    }
    function lassoFit(lam){
      var b=new Array(P).fill(0);
      for(var it=0;it<400;it++){
        for(var j2=0;j2<P;j2++){
          var rho=0,zz=0;
          for(var i2=0;i2<n;i2++){
            var pred=0;for(var k=0;k<P;k++) if(k!==j2)pred+=Z[i2][k]*b[k];
            rho+=Z[i2][j2]*(Yc[i2]-pred);zz+=Z[i2][j2]*Z[i2][j2];
          }
          b[j2]=Math.sign(rho)*Math.max(0,Math.abs(rho)-lam)/zz;
        }
      }
      return b;
    }
    function draw(){
      var lg=+sl.input.value,lam=Math.pow(10,lg),mode=+sm.value;
      sl.val.textContent="λ = "+f(lam,lam<1?4:1);
      var c=chart(cc,-3,3,-3.2,3.2);
      grid(c,4);
      var cols=[C("--signal"),C("--alias"),C("--blue"),"#8a7fb5","#4f9a70","#b58a4f"];
      var paths=[];for(var j2=0;j2<P;j2++)paths.push([]);
      for(var g=-3;g<=3.001;g+=0.12){
        var bb=(mode===0)?ridgeFit(Math.pow(10,g)):lassoFit(Math.pow(10,g));
        for(j2=0;j2<P;j2++)paths[j2].push([g,bb[j2]]);
      }
      line(c,[[-3,0],[3,0]],C("--faint"),1.4);
      paths.forEach(function(p,j){line(c,p,cols[j],j<2?2.6:1.6);});
      axis(c);
      vline(c,lg,C("--ink"),[4,3]);
      var cur=(mode===0)?ridgeFit(lam):lassoFit(lam);
      var ctx=c.ctx;
      lab(ctx,"太線 = 真に効く 2 変数 ／ 細線 = 無関係な 4 変数",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"log₁₀ λ",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"係数",c.p.l-6,c.p.t+10,C("--muted"),"right");
      var zero=cur.filter(function(v){return Math.abs(v)<1e-6;}).length;
      var err=0;for(j2=0;j2<P;j2++)err+=Math.pow(cur[j2]*1-TRUE[j2]*sg[j2],2);
      out.innerHTML='λ = <b>'+f(lam,lam<1?4:2)+'</b> ／ 係数 = ['+cur.map(function(v){return f(v,2);}).join(", ")+']'+
        ' ／ ちょうど 0 になった係数: <b>'+zero+'</b> 個'+
        ' ／ '+(mode===1?'<span class="ok">Lasso は無関係な変数を厳密に 0 にする（変数選択）。菱形の角が効いている</span>'
                       :'<span class="warn">Ridge は 0 に近づけるが厳密には 0 にならない。多重共線性には強い</span>')+
        ' ／ λ→∞ で全部 0（強いバイアス）、λ→0 で最小二乗（大きい分散）';
    }
    sl.input.addEventListener("input",draw);sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 21: ロジスティック回帰 ---------- */
  REG.logistic=function(el){
    head(el,"Logistic","ロジット変換で確率を実数全体に伸ばす");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sb=slider(row,"傾き β₁",-2,2,0.8,0.05);
    var s0=slider(row,"切片 β₀",-8,8,-4,0.1);
    var sv=select(row,"縦軸",["確率 p","ロジット log(p/(1−p))"]);
    var out=readout(el);
    function draw(){
      var b1=+sb.input.value,b0=+s0.input.value,v=+sv.value;
      sb.val.textContent=f(b1,2);s0.val.textContent=f(b0,1);
      var c=v?chart(cc,0,12,-8,8):chart(cc,0,12,0,1);
      grid(c,4);
      var pts=[];
      for(var x=0;x<=12.001;x+=0.05){
        var e=b0+b1*x;
        pts.push([x,v?Math.max(-8,Math.min(8,e)):1/(1+Math.exp(-e))]);
      }
      line(c,pts,C("--signal"),2.6);
      axis(c);
      if(!v){line(c,[[0,0.5],[12,0.5]],C("--faint"),1.4,[5,4]);}
      else line(c,[[0,0],[12,0]],C("--faint"),1.4,[5,4]);
      var x50=b1!==0?-b0/b1:null;
      if(x50!==null&&x50>=0&&x50<=12){vline(c,x50,C("--alias"),[4,3]);
        lab(c.ctx,"p=0.5 は x="+f(x50,2),c.X(x50)+6,c.p.t+26,C("--alias"),"left");}
      var ctx=c.ctx;
      lab(ctx,v?"ロジット（直線になる）":"確率（S 字。0 と 1 で頭打ち）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"x",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      var or=Math.exp(b1);
      var slope=b1*0.25;
      out.innerHTML='オッズ比 = e^β₁ = <b>'+f(or,3)+'</b>（x が 1 増えるとオッズが '+f(or,2)+' 倍）'+
        ' ／ p=0.5 での傾き = β₁/4 = <b>'+f(slope,3)+'</b>（確率の変化が最大）'+
        ' ／ p=0.95 での傾き = '+f(b1*0.95*0.05,4)+'（<span class="ok">端では効きが 1/5 以下に鈍る</span>）'+
        ' ／ '+(v?'<span class="ok">ロジットで見ると完全な直線。だから線形モデルが当てられる</span>'
                :'<span class="warn">確率のまま線形回帰すると 0〜1 をはみ出す</span>');
    }
    sb.input.addEventListener("input",draw);s0.input.addEventListener("input",draw);
    sv.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 21: ROC と AUC ---------- */
  REG.roc=function(el){
    head(el,"ROC / AUC","AUC = 陽性のスコアが陰性より高い確率");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sdl=slider(row,"2 群の分離度 d",0,3.5,1.4,0.05);
    var st=slider(row,"判定の閾値",-3,6,1,0.05);
    var sp=slider(row,"陽性の割合",1,50,20,1);
    var out=readout(el);
    function draw(){
      var d=+sdl.input.value,th=+st.input.value,pr=+sp.input.value/100;
      sdl.val.textContent=f(d,2);st.val.textContent=f(th,2);sp.val.textContent=(pr*100)+"%";
      var c=chart(cc,0,1,0,1,{l:40,r:14,t:16,b:30});
      grid(c,4);
      var pts=[];
      for(var t=6;t>=-4.001;t-=0.02){
        var tpr=1-ncdf(t-d),fpr=1-ncdf(t);
        pts.push([fpr,tpr]);
      }
      line(c,[[0,0],[1,1]],C("--faint"),1.4,[5,4]);
      fillArea(c,pts,C("--signal-soft"),0);
      line(c,pts,C("--signal"),2.6);
      axis(c);
      var TPR=1-ncdf(th-d),FPR=1-ncdf(th);
      dot(c,FPR,TPR,6,C("--alias"));
      var ctx=c.ctx;
      lab(ctx,"感度（真陽性率）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"1 − 特異度（偽陽性率）",(c.p.l+c.w-c.p.r)/2,c.h-c.p.b+16,C("--muted"),"center");
      lab(ctx,"● 現在の閾値",c.X(FPR)+8,c.Y(TPR)+4,C("--alias"),"left");
      [0,0.5,1].forEach(function(x){lab(ctx,String(x),c.X(x),c.h-c.p.b+16,C("--muted"),"center");
        lab(ctx,String(x),c.p.l-6,c.Y(x)+4,C("--muted"),"right");});
      var auc=ncdf(d/Math.SQRT2);
      var ppv=(TPR*pr)/(TPR*pr+FPR*(1-pr));
      var acc=TPR*pr+(1-FPR)*(1-pr);
      out.innerHTML='AUC = <b>'+f(auc,4)+'</b>（= P(陽性のスコア &gt; 陰性のスコア) = マン・ホイットニー U の正規化版）'+
        ' ／ 感度 <b>'+f(TPR*100,1)+'%</b>　特異度 <b>'+f((1-FPR)*100,1)+'%</b>'+
        '　適合率（陽性的中率） <b>'+f(ppv*100,1)+'%</b>　正解率 '+f(acc*100,1)+'%'+
        ' ／ '+(pr<0.1?'<span class="warn">陽性が少ないと、AUC が高くても適合率は低いまま（不均衡データ）。正解率は無意味</span>'
                     :'<span class="ok">閾値を動かすと感度と特異度が入れ替わる。AUC は閾値に依存しない</span>');
    }
    [sdl,st,sp].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 22: バイアス-バリアンス ---------- */
  REG.biasvar=function(el){
    head(el,"Bias-Variance","訓練誤差は下がり続け、汎化誤差は U 字になる");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sdl=slider(row,"多項式の次数",1,14,3,1);
    var sn=slider(row,"訓練データ数 n",8,60,15,1);
    var ss=slider(row,"ノイズ σ",0.05,1.2,0.35,0.05);
    var out=readout(el);
    function polyfit(X,Y,deg){
      var m=deg+1,A=[],b=[];
      for(var a=0;a<m;a++){var rw=[];
        for(var c2=0;c2<m;c2++){var s=0;for(var i=0;i<X.length;i++)s+=Math.pow(X[i],a+c2);rw.push(s);}
        var sy=0;for(i=0;i<X.length;i++)sy+=Math.pow(X[i],a)*Y[i];A.push(rw);b.push(sy);}
      for(a=0;a<m;a++){
        var piv=A[a][a];if(Math.abs(piv)<1e-14)piv=1e-14;
        for(c2=a;c2<m;c2++)A[a][c2]/=piv;b[a]/=piv;
        for(var r=0;r<m;r++) if(r!==a){var fct=A[r][a];
          for(c2=a;c2<m;c2++)A[r][c2]-=fct*A[a][c2];b[r]-=fct*b[a];}
      }
      return b;
    }
    function evalp(co,x){var s=0;for(var i=0;i<co.length;i++)s+=co[i]*Math.pow(x,i);return s;}
    function truef(x){return Math.sin(x*2.2)+0.3*x;}
    function draw(){
      var deg=+sdl.input.value,n=+sn.input.value,sg=+ss.input.value;
      sdl.val.textContent=deg;sn.val.textContent=n;ss.val.textContent=f(sg,2);
      var rnd=rngOf(12),X=[],Y=[],TX=[],TY=[];
      for(var i=0;i<n;i++){var x=i/(n-1)*3;X.push(x);Y.push(truef(x)+sg*gauss(rnd));}
      for(i=0;i<200;i++){var x2=rnd()*3;TX.push(x2);TY.push(truef(x2)+sg*gauss(rnd));}
      var co=polyfit(X,Y,Math.min(deg,n-1));
      var tr=0;X.forEach(function(x,i2){tr+=Math.pow(Y[i2]-evalp(co,x),2);});tr/=n;
      var te=0;TX.forEach(function(x,i2){te+=Math.pow(TY[i2]-evalp(co,x),2);});te/=TX.length;
      var c=chart(cc,-0.1,3.1,-2.2,3.2);
      grid(c,4);
      var tp=[];for(var x3=-0.1;x3<=3.1;x3+=0.01)tp.push([x3,truef(x3)]);
      line(c,tp,C("--faint"),1.8,[5,4]);
      var fp=[];for(x3=-0.1;x3<=3.1;x3+=0.01)fp.push([x3,Math.max(-2.2,Math.min(3.2,evalp(co,x3)))]);
      line(c,fp,C("--signal"),2.4);
      for(i=0;i<n;i++)dot(c,X[i],Y[i],3.6,C("--blue"));
      axis(c);
      var ctx=c.ctx;
      lab(ctx,"破線 = 真の関数 ／ 実線 = 当てはめた多項式 ／ ● 訓練データ",c.p.l+2,c.p.t+10,C("--muted"),"left");
      out.innerHTML='次数 <b>'+deg+'</b> ／ 訓練 MSE = <b class="ok">'+f(tr,4)+'</b> ／ テスト MSE = <b class="'+
        (te>tr*2.2?"warn":"ok")+'">'+f(te,4)+'</b>'+
        ' ／ '+(deg<=2?'<span class="warn">単純すぎ（高バイアス・未学習）。真の曲線を追えていない</span>'
              :(te>tr*2.5?'<span class="warn">過学習（高バリアンス）。訓練だけ良く、テストが悪化</span>'
                         :'<span class="ok">バランスが取れている</span>'))+
        ' ／ 誤差 = バイアス² + バリアンス + σ²（σ² = '+f(sg*sg,3)+' は減らせない）';
    }
    [sdl,sn,ss].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 22: 交差検証 ---------- */
  REG.cv=function(el){
    head(el,"Cross-Validation","汎化誤差を推定して最適な複雑さを選ぶ");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sk=slider(row,"分割数 k",2,10,5,1);
    var sn=slider(row,"データ数 n",20,120,40,5);
    var ss=slider(row,"ノイズ σ",0.05,1,0.35,0.05);
    var out=readout(el);
    function polyfit(X,Y,deg){
      var m=deg+1,A=[],b=[];
      for(var a=0;a<m;a++){var rw=[];
        for(var c2=0;c2<m;c2++){var s=0;for(var i=0;i<X.length;i++)s+=Math.pow(X[i],a+c2);rw.push(s);}
        var sy=0;for(i=0;i<X.length;i++)sy+=Math.pow(X[i],a)*Y[i];A.push(rw);b.push(sy);}
      for(a=0;a<m;a++){var piv=A[a][a];if(Math.abs(piv)<1e-14)piv=1e-14;
        for(c2=a;c2<m;c2++)A[a][c2]/=piv;b[a]/=piv;
        for(var r=0;r<m;r++) if(r!==a){var fct=A[r][a];
          for(c2=a;c2<m;c2++)A[r][c2]-=fct*A[a][c2];b[r]-=fct*b[a];}}
      return b;
    }
    function ev(co,x){var s=0;for(var i=0;i<co.length;i++)s+=co[i]*Math.pow(x,i);return s;}
    function truef(x){return Math.sin(x*2.2)+0.3*x;}
    function draw(){
      var k=+sk.input.value,n=+sn.input.value,sg=+ss.input.value;
      sk.val.textContent=k;sn.val.textContent=n;ss.val.textContent=f(sg,2);
      var rnd=rngOf(19),X=[],Y=[];
      for(var i=0;i<n;i++){var x=rnd()*3;X.push(x);Y.push(truef(x)+sg*gauss(rnd));}
      var DEG=10,trE=[],cvE=[];
      for(var d=1;d<=DEG;d++){
        var co=polyfit(X,Y,Math.min(d,n-1));
        var tr=0;for(i=0;i<n;i++)tr+=Math.pow(Y[i]-ev(co,X[i]),2);trE.push(tr/n);
        // k 分割
        var err=0,cnt=0;
        for(var fo=0;fo<k;fo++){
          var xa=[],ya=[],xb=[],yb=[];
          for(i=0;i<n;i++){if(i%k===fo){xb.push(X[i]);yb.push(Y[i]);}else{xa.push(X[i]);ya.push(Y[i]);}}
          if(xa.length<=d)continue;
          var c2=polyfit(xa,ya,Math.min(d,xa.length-1));
          for(i=0;i<xb.length;i++){var e=yb[i]-ev(c2,xb[i]);err+=Math.min(e*e,1e4);cnt++;}
        }
        cvE.push(cnt?err/cnt:NaN);
      }
      var valid=cvE.filter(isFinite);
      var mx=Math.max(Math.max.apply(null,valid),Math.max.apply(null,trE))*1.1;
      mx=Math.min(mx,sg*sg*12);
      var c=chart(cc,1,DEG,0,mx);
      grid(c,4);
      line(c,trE.map(function(v,i2){return [i2+1,Math.min(v,mx)];}),C("--faint"),2.2);
      line(c,cvE.map(function(v,i2){return [i2+1,Math.min(v,mx)];}),C("--signal"),2.6);
      axis(c);
      var best=1,bv=Infinity;
      cvE.forEach(function(v,i2){if(isFinite(v)&&v<bv){bv=v;best=i2+1;}});
      vline(c,best,C("--alias"),[4,3]);
      for(var d2=1;d2<=DEG;d2++)dot(c,d2,Math.min(cvE[d2-1],mx),3.4,C("--signal"));
      var ctx=c.ctx;
      lab(ctx,"灰 = 訓練誤差（下がり続ける）／ 緑 = "+k+"分割 CV 誤差（U 字）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"多項式の次数",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"最良 "+best+" 次",c.X(best),c.p.t+26,C("--alias"),"center");
      out.innerHTML='CV が最小になる次数 = <b class="ok">'+best+'</b>（CV 誤差 '+f(bv,4)+'）'+
        ' ／ 訓練誤差だけを見ると次数 '+DEG+' が最良に見える（'+f(trE[DEG-1],4)+'）が、それは過学習'+
        ' ／ <span class="warn">前処理や変数選択も CV のループの中で行うこと（データリーク防止）</span>'+
        ' ／ <span class="warn">時系列データではランダム分割は厳禁。時間順に分ける</span>';
    }
    [sk,sn,ss].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 23: ベータ・二項の共役 ---------- */
  REG.beta=function(el){
    head(el,"Beta-Binomial","事前に成功数と失敗数を足すだけ");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sa=slider(row,"事前 α",0.5,20,1,0.5);
    var sb=slider(row,"事前 β",0.5,20,1,0.5);
    var sn=slider(row,"試行 n",0,100,10,1);
    var sk=slider(row,"成功 s",0,100,8,1);
    var out=readout(el);
    function bpdf(x,a,b){
      if(x<=0||x>=1)return 0;
      return Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-(gammaln(a)+gammaln(b)-gammaln(a+b)));
    }
    function draw(){
      var a0=+sa.input.value,b0=+sb.input.value,n=+sn.input.value,s=Math.min(+sk.input.value,n);
      sk.input.max=n;sa.val.textContent=f(a0,1);sb.val.textContent=f(b0,1);
      sn.val.textContent=n;sk.val.textContent=s;
      var a=a0+s,b=b0+(n-s);
      var pr=[],po=[],mx=0;
      for(var i=1;i<400;i++){
        var x=i/400,yp=bpdf(x,a0,b0),yq=bpdf(x,a,b);
        pr.push([x,yp]);po.push([x,yq]);if(yq>mx)mx=yq;if(yp>mx&&yp<50)mx=Math.max(mx,yp);
      }
      var c=chart(cc,0,1,0,Math.min(mx,25)*1.15);
      grid(c,4);
      line(c,pr,C("--faint"),1.8,[5,4]);
      fillArea(c,po,C("--signal-soft"),0);
      line(c,po,C("--signal"),2.6);
      axis(c);
      var pm=a/(a+b);
      vline(c,pm,C("--alias"),[4,3]);
      if(n>0){var mle=s/n;dot(c,mle,0,5,C("--blue"));}
      var ctx=c.ctx;
      lab(ctx,"破線 = 事前 Beta("+f(a0,1)+","+f(b0,1)+") ／ 実線 = 事後 Beta("+f(a,1)+","+f(b,1)+")",
        c.p.l+2,c.p.t+10,C("--muted"),"left");
      [0,0.5,1].forEach(function(x){lab(ctx,String(x),c.X(x),c.h-c.p.b+16,C("--muted"),"center");});
      // 95% 信用区間（数値積分）
      var tot=0,cum=[],step=1/2000;
      for(i=1;i<2000;i++){var x2=i*step;tot+=bpdf(x2,a,b)*step;cum.push([x2,tot]);}
      function qf(q){for(var j=0;j<cum.length;j++) if(cum[j][1]>=q*tot)return cum[j][0];return 1;}
      var lo=qf(0.025),hi=qf(0.975);
      var w=n>0?n/(a0+b0+n):0;
      out.innerHTML='事後 = Beta(α+s, β+n−s) = <b>Beta('+f(a,1)+', '+f(b,1)+')</b>'+
        ' ／ 事後平均 = <b>'+f(pm,4)+'</b>'+(n>0?'（最尤 '+f(s/n,4)+'、事前平均 '+f(a0/(a0+b0),3)+'）':'')+
        ' ／ 95% 信用区間 = [<b>'+f(lo,3)+'</b>, <b>'+f(hi,3)+'</b>]'+
        '（<span class="ok">この区間に θ がある確率が 95% —— 文字通りの意味</span>）'+
        ' ／ データの重み w = n/(α+β+n) = <b>'+f(w,3)+'</b>'+
        (n<10&&a0+b0>4?' ／ <span class="warn">データが少ないので事前分布に強く引き戻されている</span>':'');
    }
    [sa,sb,sn,sk].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 23: MCMC ---------- */
  REG.mcmc=function(el){
    head(el,"MCMC","事後分布からサンプルを取る");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sp=slider(row,"提案分布の幅",0.02,3,1.2,0.02);
    var sn=slider(row,"サンプル数",200,20000,3000,100);
    var sv=select(row,"表示",["トレースプロット","ヒストグラムと真の事後分布"]);
    var out=readout(el);
    // 目標: 2 つの山を持つ事後分布（共役でない例）
    function logpost(x){
      return Math.log(0.65*Math.exp(-Math.pow(x-1.2,2)/0.5)+0.35*Math.exp(-Math.pow(x+1.6,2)/0.8));
    }
    function draw(){
      var w=+sp.input.value,N=+sn.input.value,v=+sv.value;
      sp.val.textContent=f(w,2);sn.val.textContent=N;
      var rnd=rngOf(101),x=0,ch=[],acc=0;
      for(var i=0;i<N;i++){
        var xp=x+w*gauss(rnd);
        var r=Math.exp(logpost(xp)-logpost(x));
        if(rnd()<r){x=xp;acc++;}
        ch.push(x);
      }
      var burn=Math.floor(N*0.1),post=ch.slice(burn);
      var ctx;
      if(v===0){
        var c=chart(cc,0,N,-5,5);
        grid(c,4);
        var step=Math.max(1,Math.floor(N/900)),pts=[];
        for(i=0;i<N;i+=step)pts.push([i,ch[i]]);
        line(c,pts,C("--signal"),1.2);
        axis(c);ctx=c.ctx;
        ctx.fillStyle=C("--alias-soft");
        ctx.fillRect(c.p.l,c.p.t,c.X(burn)-c.p.l,c.h-c.p.t-c.p.b);
        lab(ctx,"薄赤 = バーンイン（捨てる）",c.p.l+3,c.p.t+12,C("--alias"),"left");
        lab(ctx,"毛虫のようにランダムに見えれば収束している",c.w-c.p.r,c.p.t+12,C("--muted"),"right");
        lab(ctx,"反復回数",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      }else{
        var lo=-5,hi=5,NB=50,cnt=new Array(NB).fill(0),bw=(hi-lo)/NB;
        post.forEach(function(v2){var k=Math.floor((v2-lo)/bw);if(k>=0&&k<NB)cnt[k]++;});
        var dens=cnt.map(function(v2){return v2/(post.length*bw);});
        // 真の事後（数値正規化）
        var Z=0,tp=[];
        for(var t=lo;t<=hi;t+=0.01)Z+=Math.exp(logpost(t))*0.01;
        for(t=lo;t<=hi;t+=0.01)tp.push([t,Math.exp(logpost(t))/Z]);
        var mx=Math.max(Math.max.apply(null,dens),Math.max.apply(null,tp.map(function(q){return q[1];})));
        var c2=chart(cc,lo,hi,0,mx*1.2);
        grid(c2,4);ctx=c2.ctx;
        dens.forEach(function(v2,i2){
          var x1=c2.X(lo+i2*bw),x2=c2.X(lo+(i2+1)*bw);
          ctx.fillStyle=C("--signal-soft");ctx.fillRect(x1,c2.Y(v2),x2-x1-1,c2.Y(0)-c2.Y(v2));});
        line(c2,tp,C("--alias"),2.4);
        axis(c2);
        lab(ctx,"棒 = MCMC サンプル ／ 曲線 = 真の事後分布",c2.p.l+2,c2.p.t+10,C("--muted"),"left");
      }
      var ar=acc/N;
      // 自己相関 lag1
      var m=mean(post),s2=vari(post),ac=0;
      for(i=1;i<post.length;i++)ac+=(post[i]-m)*(post[i-1]-m);
      ac/=(post.length-1)*s2;
      var ess=post.length*(1-ac)/(1+ac);
      out.innerHTML='受容率 = <b class="'+(ar>0.15&&ar<0.6?"ok":"warn")+'">'+f(ar*100,1)+'%</b>（目安 20〜50%）'+
        ' ／ lag-1 自己相関 = <b>'+f(ac,3)+'</b> ／ 有効サンプルサイズ ≈ <b>'+Math.round(ess)+'</b>'+
        ' ／ 事後平均 = '+f(m,3)+
        ' ／ '+(w<0.15?'<span class="warn">提案幅が狭すぎ。受容率は高いが同じ場所に留まり、ほとんど動かない</span>'
              :(w>2?'<span class="warn">提案幅が広すぎ。ほとんど棄却されて動かない</span>'
                   :'<span class="ok">正規化定数 p(D) を計算せずに事後分布から取れている</span>'));
    }
    [sp,sn].forEach(function(s){s.input.addEventListener("input",draw);});
    sv.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 24: ランダム化 vs 自己選択 ---------- */
  REG.rct=function(el){
    head(el,"Randomization","測っていない交絡まで消せるのは RCT だけ");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var se=slider(row,"真の処置効果",-5,15,3,0.5);
    var sc=slider(row,"自己選択の強さ（やる気の高い人ほど処置を受ける）",0,100,70,5);
    var sm=select(row,"割り付け方法",["ランダム化（RCT）","自己選択（観察研究）","自己選択 + やる気で回帰調整"]);
    var out=readout(el);
    function draw(){
      var eff=+se.input.value,sel=+sc.input.value/100,mode=+sm.value;
      se.val.textContent=f(eff,1);sc.val.textContent=(sel*100)+"%";
      var rnd=rngOf(63),n=300,U=[],T=[],Y=[];
      for(var i=0;i<n;i++){
        var u=gauss(rnd);                        // 未測定の交絡（やる気）
        var t=(mode===0)?(rnd()<0.5?1:0):((sel*u+(1-sel)*gauss(rnd))>0?1:0);
        U.push(u);T.push(t);
        Y.push(50+eff*t+6*u+3*gauss(rnd));
      }
      var y1=[],y0=[],u1=[],u0=[];
      for(i=0;i<n;i++){if(T[i]){y1.push(Y[i]);u1.push(U[i]);}else{y0.push(Y[i]);u0.push(U[i]);}}
      var naive=mean(y1)-mean(y0);
      // やる気で調整した推定（Uを共変量に入れた重回帰）
      var mt=mean(T),mu=mean(U),my=mean(Y);
      var stt=0,suu=0,stu=0,sty=0,suy=0;
      for(i=0;i<n;i++){var dt=T[i]-mt,du=U[i]-mu,dy=Y[i]-my;
        stt+=dt*dt;suu+=du*du;stu+=dt*du;sty+=dt*dy;suy+=du*dy;}
      var det=stt*suu-stu*stu;
      var adj=det?(suu*sty-stu*suy)/det:naive;
      var est=(mode===2)?adj:naive;
      var c=chart(cc,-3.2,3.2,Math.min.apply(null,Y)-2,Math.max.apply(null,Y)+2);
      grid(c,4);
      for(i=0;i<n;i++)dot(c,U[i],Y[i],2.8,T[i]?C("--signal"):C("--faint"));
      axis(c);
      var ctx=c.ctx;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(mean(y1)));ctx.lineTo(c.w-c.p.r,c.Y(mean(y1)));ctx.stroke();
      ctx.strokeStyle=C("--faint");
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(mean(y0)));ctx.lineTo(c.w-c.p.r,c.Y(mean(y0)));ctx.stroke();
      lab(ctx,"● 処置群 ／ ● 対照群（横線は各群の平均）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"未測定の交絡「やる気」",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      var bal=mean(u1)-mean(u0);
      out.innerHTML='真の効果 = <b>'+f(eff,2)+'</b> ／ 推定値 = <b class="'+
        (Math.abs(est-eff)<1?"ok":"warn")+'">'+f(est,2)+'</b>（バイアス '+f(est-eff,2)+'）'+
        ' ／ 両群の「やる気」の差 = <b>'+f(bal,3)+'</b>'+
        ' ／ '+(mode===0?'<span class="ok">ランダム化により、測っていない変数まで両群で釣り合う → 系統的なバイアスなし（残る差は偶然の揺らぎ）</span>'
              :(mode===1?'<span class="warn">やる気の高い人が処置群に偏る → 効果を過大評価（選択バイアス）</span>'
                        :'<span class="ok">やる気を測れていれば回帰で調整できる。だが測れない交絡には無力</span>'));
    }
    [se,sc].forEach(function(s){s.input.addEventListener("input",draw);});
    sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 24: 合流点バイアス ---------- */
  REG.collider=function(el){
    head(el,"Collider Bias","合流点で条件付けると、無かった相関が生まれる");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var st=slider(row,"選抜の厳しさ（上位何 % を残すか）",5,100,30,5);
    var sw=slider(row,"選抜スコアへの寄与（X と Y の重み）",0,100,50,5);
    var out=readout(el);
    function draw(){
      var keep=+st.input.value/100,w=+sw.input.value/100;
      st.val.textContent=(keep*100)+"%";sw.val.textContent=f(w,2);
      var rnd=rngOf(43),n=500,X=[],Y=[],S=[];
      for(var i=0;i<n;i++){var x=gauss(rnd),y=gauss(rnd);
        X.push(x);Y.push(y);S.push(w*x+(1-w)*y);}
      var thr=quant(S,1-keep);
      var sx=[],sy=[];
      for(i=0;i<n;i++) if(S[i]>=thr){sx.push(X[i]);sy.push(Y[i]);}
      var rAll=corrOf(X,Y),rSel=sx.length>3?corrOf(sx,sy):NaN;
      var c=chart(cc,-3.4,3.4,-3.4,3.4);
      grid(c,4);
      for(i=0;i<n;i++)dot(c,X[i],Y[i],S[i]>=thr?3.4:2,S[i]>=thr?C("--alias"):C("--faint"));
      axis(c);
      if(sx.length>3){
        var fit=olsFit(sx,sy);
        line(c,[[-3.4,fit.b0-3.4*fit.b1],[3.4,fit.b0+3.4*fit.b1]],C("--alias"),2.2);
      }
      var ctx=c.ctx;
      lab(ctx,"X → C ← Y（C = 選抜）。X と Y はもともと独立",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"赤 = 選抜された個体だけ",c.p.l+2,c.p.t+24,C("--alias"),"left");
      lab(ctx,"X（才能）",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"Y（美貌）",c.p.l+2,c.h-c.p.b-6,C("--muted"),"left");
      out.innerHTML='全体での相関 r = <b class="ok">'+f(rAll,3)+'</b>（ほぼ 0 = 独立）'+
        ' ／ 選抜後の相関 r = <b class="warn">'+f(rSel,3)+'</b>'+
        ' ／ '+(rSel<-0.15?'<span class="warn">選抜された集団だけを見ると、無かったはずの負の相関が現れる = 合流点バイアス</span>'
                         :'<span class="ok">選抜が緩い（または片方しか効かない）ので歪みが小さい</span>')+
        ' ／ 「俳優の中では才能と美貌が負の相関」「入院患者では 2 つの病気が負の相関」はこれ'+
        ' ／ <span class="warn">合流点は調整してはいけない変数である</span>';
    }
    st.input.addEventListener("input",draw);sw.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 25: AR(1) と ACF ---------- */
  REG.arsim=function(el){
    head(el,"AR(1)","|φ| < 1 なら定常、1 なら ランダムウォーク");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sp=slider(row,"φ（自己回帰係数）",-0.98,1,0.7,0.02);
    var sn=slider(row,"系列の長さ T",50,600,200,10);
    var sv=select(row,"表示",["時系列","自己相関 ACF"]);
    var out=readout(el);
    function draw(){
      var phi=+sp.input.value,T=+sn.input.value,v=+sv.value;
      sp.val.textContent=f(phi,2);sn.val.textContent=T;
      var rnd=rngOf(71),y=[],x=0;
      for(var i=0;i<T+200;i++){x=phi*x+gauss(rnd);if(i>=200)y.push(x);}
      var ctx;
      if(v===0){
        var lo=Math.min.apply(null,y),hi=Math.max.apply(null,y),pad=(hi-lo)*0.12||1;
        var c=chart(cc,0,T,lo-pad,hi+pad);
        grid(c,4);
        line(c,[[0,0],[T,0]],C("--faint"),1.4,[5,4]);
        line(c,y.map(function(v2,i2){return [i2,v2];}),C("--signal"),1.8);
        axis(c);ctx=c.ctx;
        lab(ctx,"時点 t",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
        lab(ctx,"y",c.p.l-6,c.p.t+10,C("--muted"),"right");
      }else{
        var K=26,m=mean(y),den=0;
        for(i=0;i<T;i++)den+=(y[i]-m)*(y[i]-m);
        var ac=[];
        for(var k=0;k<=K;k++){var s=0;
          for(i=k;i<T;i++)s+=(y[i]-m)*(y[i-k]-m);ac.push(s/den);}
        var c2=chart(cc,-0.6,K+0.6,-1,1);
        grid(c2,4);ctx=c2.ctx;
        var bnd=2/Math.sqrt(T);
        ctx.fillStyle=C("--alias-soft");
        ctx.fillRect(c2.p.l,c2.Y(bnd),c2.w-c2.p.l-c2.p.r,c2.Y(-bnd)-c2.Y(bnd));
        ac.forEach(function(v2,k2){
          ctx.strokeStyle=Math.abs(v2)>bnd?C("--signal"):C("--faint");ctx.lineWidth=3;
          ctx.beginPath();ctx.moveTo(c2.X(k2),c2.Y(0));ctx.lineTo(c2.X(k2),c2.Y(v2));ctx.stroke();});
        line(c2,[[-0.6,0],[K+0.6,0]],C("--line"),1.2);
        var th=[];for(k=0;k<=K;k++)th.push([k,Math.pow(phi,k)]);
        line(c2,th,C("--alias"),1.8,[4,3]);
        axis(c2);
        lab(ctx,"破線 = 理論値 ρ_k = φ^k ／ 薄赤帯 = ±2/√T（有意でない範囲）",
          c2.p.l+2,c2.p.t+10,C("--muted"),"left");
        lab(ctx,"ラグ k",c2.w-c2.p.r,c2.h-c2.p.b+16,C("--muted"),"right");
      }
      var stationary=Math.abs(phi)<1;
      out.innerHTML='φ = <b>'+f(phi,2)+'</b> ／ 理論分散 = σ²/(1−φ²) = '+
        (stationary?f(1/(1-phi*phi),3):"∞")+' ／ 標本分散 = '+f(vari(y),3)+
        ' ／ '+(Math.abs(phi)>=0.995?'<span class="warn">φ ≈ 1 はランダムウォーク（単位根）。非定常なので差分が必要</span>'
              :(Math.abs(phi)>0.9?'<span class="warn">φ が 1 に近い。自己相関が長く残り、実質的な情報量が少ない</span>'
                                 :'<span class="ok">定常。ACF は φ^k で指数的に減衰する</span>'))+
        ' ／ AR は IIR フィルタと同じ形。|φ|&lt;1 は「極が単位円の内側」に対応する';
    }
    [sp,sn].forEach(function(s){s.input.addEventListener("input",draw);});
    sv.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 25: 見せかけの回帰 ---------- */
  REG.spurious=function(el){
    head(el,"Spurious Regression","無関係な 2 本でも「強い関係」が出る");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var ss=slider(row,"乱数の種",1,60,3,1);
    var sT=slider(row,"系列の長さ T",30,400,120,10);
    var sm=select(row,"データ",["ランダムウォーク（非定常）","差分を取った後（定常）"]);
    var out=readout(el);
    function draw(){
      var seed=+ss.input.value,T=+sT.input.value,mode=+sm.value;
      ss.val.textContent=seed;sT.val.textContent=T;
      var r1=rngOf(seed*7919),r2=rngOf(seed*104729),x=[0],y=[0];
      for(var i=1;i<T;i++){x.push(x[i-1]+gauss(r1));y.push(y[i-1]+gauss(r2));}
      var X=x,Y=y;
      if(mode===1){X=[];Y=[];for(i=1;i<T;i++){X.push(x[i]-x[i-1]);Y.push(y[i]-y[i-1]);}}
      var fit=olsFit(X,Y),r=corrOf(X,Y),R2=r*r;
      var n=X.length,e=[],sse=0;
      for(i=0;i<n;i++){var ei=Y[i]-(fit.b0+fit.b1*X[i]);e.push(ei);sse+=ei*ei;}
      var s2=sse/(n-2),seB=Math.sqrt(s2/fit.sxx),t=fit.b1/seB,p=tp2(t,n-2);
      // ダービン・ワトソン
      var dwn=0;for(i=1;i<n;i++)dwn+=(e[i]-e[i-1])*(e[i]-e[i-1]);
      var DW=dwn/sse;
      var xl=Math.min.apply(null,X),xh=Math.max.apply(null,X);
      var yl=Math.min.apply(null,Y),yh=Math.max.apply(null,Y);
      var px=(xh-xl)*0.1||1,py=(yh-yl)*0.1||1;
      var c=chart(cc,xl-px,xh+px,yl-py,yh+py);
      grid(c,4);
      line(c,[[xl-px,fit.b0+fit.b1*(xl-px)],[xh+px,fit.b0+fit.b1*(xh+px)]],C("--alias"),2.2);
      for(i=0;i<n;i++)dot(c,X[i],Y[i],2.8,C("--signal"));
      axis(c);
      var ctx=c.ctx;
      lab(ctx,mode?"差分した系列どうしの散布図":"2 本の独立なランダムウォークの散布図",
        c.p.l+2,c.p.t+10,C("--muted"),"left");
      out.innerHTML='R² = <b class="'+(mode?"ok":"warn")+'">'+f(R2,3)+'</b>　t = <b>'+f(t,2)+
        '</b>　p = <b>'+(p<0.0001?"< 0.0001":f(p,4))+'</b>　DW = <b>'+f(DW,3)+'</b>'+
        ' ／ '+(mode===0?'<span class="warn">2 本はまったく独立な乱数なのに「強い関係」が出る。DW が 2 から大きく離れているのが証拠</span>'
                       :'<span class="ok">差分を取れば関係は消える（R² ≈ 0、DW ≈ 2）。これが正しい扱い</span>')+
        ' ／ 種を変えると R² が大きく変わることも確認してほしい';
    }
    [ss,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    sm.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 26: 主成分分析 ---------- */
  REG.pca=function(el){
    head(el,"PCA","分散が最大になる方向 = 共分散行列の固有ベクトル");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"2 変数の相関",-95,95,80,5);
    var ss=slider(row,"変数 2 のスケール",0.2,5,1,0.1);
    var sz=select(row,"前処理",["標準化しない（共分散行列）","標準化する（相関行列）"]);
    var out=readout(el);
    function draw(){
      var r=+sr.input.value/100,sc=+ss.input.value,z=+sz.value;
      sr.val.textContent=f(r,2);ss.val.textContent=f(sc,1);
      var rnd=rngOf(29),X=[],Y=[];
      for(var i=0;i<220;i++){var a=gauss(rnd);
        X.push(a);Y.push(sc*(r*a+Math.sqrt(1-r*r)*gauss(rnd)));}
      var mx=mean(X),my=mean(Y);
      var px=X.map(function(v){return v-mx;}),py=Y.map(function(v){return v-my;});
      if(z===1){var sx=sd(px),sy=sd(py);px=px.map(function(v){return v/sx;});py=py.map(function(v){return v/sy;});}
      var n=px.length,sxx=0,syy=0,sxy=0;
      for(i=0;i<n;i++){sxx+=px[i]*px[i];syy+=py[i]*py[i];sxy+=px[i]*py[i];}
      sxx/=(n-1);syy/=(n-1);sxy/=(n-1);
      // 2x2 固有値
      var tr=sxx+syy,det=sxx*syy-sxy*sxy;
      var l1=(tr+Math.sqrt(tr*tr-4*det))/2,l2=(tr-Math.sqrt(tr*tr-4*det))/2;
      function evec(l){var vx=sxy,vy=l-sxx;
        if(Math.abs(vx)<1e-9&&Math.abs(vy)<1e-9){vx=1;vy=0;}
        var nn=Math.hypot(vx,vy);return [vx/nn,vy/nn];}
      var e1=evec(l1),e2=evec(l2);
      var lim=Math.max(Math.max.apply(null,px.map(Math.abs)),Math.max.apply(null,py.map(Math.abs)))*1.15;
      var c=chart(cc,-lim,lim,-lim,lim);
      grid(c,4);
      for(i=0;i<n;i++)dot(c,px[i],py[i],2.8,C("--faint"));
      axis(c);
      var s1=Math.sqrt(l1),s2=Math.sqrt(l2);
      line(c,[[-2*s1*e1[0],-2*s1*e1[1]],[2*s1*e1[0],2*s1*e1[1]]],C("--signal"),3);
      line(c,[[-2*s2*e2[0],-2*s2*e2[1]],[2*s2*e2[0],2*s2*e2[1]]],C("--alias"),2.4);
      var ctx=c.ctx;
      lab(ctx,"緑 = 第 1 主成分（長さ ∝ √λ₁）／ 赤 = 第 2 主成分",c.p.l+2,c.p.t+10,C("--muted"),"left");
      lab(ctx,"x₁",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"x₂",c.p.l-6,c.p.t+10,C("--muted"),"right");
      var cont=l1/(l1+l2);
      out.innerHTML='固有値 λ₁ = <b>'+f(l1,3)+'</b>、λ₂ = <b>'+f(l2,3)+'</b>'+
        ' ／ 第 1 主成分の寄与率 = λ₁/(λ₁+λ₂) = <b>'+f(cont*100,1)+'%</b>'+
        ' ／ 第 1 主成分の方向 = ('+f(e1[0],3)+', '+f(e1[1],3)+')'+
        ' ／ '+(z===0&&sc>2.5?'<span class="warn">標準化しないと、スケールの大きい変数が第 1 主成分をほぼ独占してしまう</span>'
              :(z===1?'<span class="ok">標準化すれば単位に依存しない。単位が違う変数を混ぜるときは必須</span>'
                     :'<span class="ok">相関が強いほど第 1 主成分に情報が集まる（次元削減の余地が大きい）</span>'));
    }
    [sr,ss].forEach(function(s){s.input.addEventListener("input",draw);});
    sz.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 26: k-means ---------- */
  REG.kmeans=function(el){
    head(el,"k-means","群内平方和 SS_W を最小にする分け方を探す");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sk=slider(row,"クラスタ数 k",1,7,3,1);
    var si=slider(row,"反復回数",0,20,20,1);
    var ss=slider(row,"初期値の種",1,20,1,1);
    var sdl=select(row,"データ",["3 つの丸い塊","2 つの三日月（k-means が苦手）","一様（構造なし）"]);
    var out=readout(el);
    function gendata(m){
      var rnd=rngOf(37),P=[];
      if(m===0){
        var ctr=[[-1.3,-0.9],[1.4,-0.6],[0.1,1.4]];
        for(var i=0;i<240;i++){var g=ctr[i%3];P.push([g[0]+0.45*gauss(rnd),g[1]+0.45*gauss(rnd)]);}
      }else if(m===1){
        for(i=0;i<240;i++){
          var t=rnd()*Math.PI,s=i%2;
          if(s)P.push([Math.cos(t)*1.6-0.5+0.12*gauss(rnd),Math.sin(t)*1.6-0.6+0.12*gauss(rnd)]);
          else P.push([-Math.cos(t)*1.6+0.5+0.12*gauss(rnd),-Math.sin(t)*1.6+0.6+0.12*gauss(rnd)]);
        }
      }else{for(i=0;i<240;i++)P.push([(rnd()-0.5)*4,(rnd()-0.5)*4]);}
      return P;
    }
    function draw(){
      var k=+sk.input.value,iters=+si.input.value,seed=+ss.input.value,m=+sdl.value;
      sk.val.textContent=k;si.val.textContent=iters;ss.val.textContent=seed;
      var P=gendata(m),rnd=rngOf(seed*911);
      var cen=[];for(var i=0;i<k;i++)cen.push(P[Math.floor(rnd()*P.length)].slice());
      var asg=new Array(P.length).fill(0);
      for(var it=0;it<iters;it++){
        for(i=0;i<P.length;i++){
          var best=0,bd=Infinity;
          for(var j=0;j<k;j++){var d2=Math.pow(P[i][0]-cen[j][0],2)+Math.pow(P[i][1]-cen[j][1],2);
            if(d2<bd){bd=d2;best=j;}}
          asg[i]=best;
        }
        var sx=new Array(k).fill(0),sy=new Array(k).fill(0),cn=new Array(k).fill(0);
        for(i=0;i<P.length;i++){sx[asg[i]]+=P[i][0];sy[asg[i]]+=P[i][1];cn[asg[i]]++;}
        for(j=0;j<k;j++) if(cn[j]){cen[j]=[sx[j]/cn[j],sy[j]/cn[j]];}
      }
      if(iters===0){for(i=0;i<P.length;i++){var b2=0,bd2=Infinity;
        for(j=0;j<k;j++){var dd=Math.pow(P[i][0]-cen[j][0],2)+Math.pow(P[i][1]-cen[j][1],2);
          if(dd<bd2){bd2=dd;b2=j;}}asg[i]=b2;}}
      var ssw=0;
      for(i=0;i<P.length;i++)ssw+=Math.pow(P[i][0]-cen[asg[i]][0],2)+Math.pow(P[i][1]-cen[asg[i]][1],2);
      var c=chart(cc,-2.8,2.8,-2.6,2.6);
      grid(c,4);
      var cols=[C("--signal"),C("--alias"),C("--blue"),"#8a7fb5","#4f9a70","#b58a4f","#c2557f"];
      for(i=0;i<P.length;i++)dot(c,P[i][0],P[i][1],3,cols[asg[i]%cols.length]);
      for(j=0;j<k;j++){dot(c,cen[j][0],cen[j][1],8,"#fff");dot(c,cen[j][0],cen[j][1],8,cols[j%cols.length],true);
        dot(c,cen[j][0],cen[j][1],3.5,cols[j%cols.length]);}
      axis(c);
      lab(c.ctx,"○ = クラスタ中心（重心）",c.p.l+2,c.p.t+10,C("--muted"),"left");
      out.innerHTML='k = <b>'+k+'</b>　反復 '+iters+' 回 ／ 群内平方和 SS<sub>W</sub> = <b>'+f(ssw,2)+'</b>'+
        '（<span class="ok">分散分析の SS<sub>W</sub> と同じ量を、逆に「最小化する分け方」として使っている</span>）'+
        ' ／ '+(m===1?'<span class="warn">三日月型には k-means が向かない（球状クラスタを仮定するため）。DBSCAN などを使う</span>'
              :(m===2?'<span class="warn">構造が無いデータでも k-means は必ず k 個に分ける。「分かれた」ことは構造の証拠にならない</span>'
                     :'<span class="ok">初期値の種を変えて結果が安定するか確認する（k-means++ 推奨）</span>'));
    }
    [sk,si,ss].forEach(function(s){s.input.addEventListener("input",draw);});
    sdl.addEventListener("change",draw);reg(cv,draw);
  };

  function init(){
    document.querySelectorAll("[data-widget]").forEach(function(el){
      if(el.dataset.done)return; el.dataset.done="1";
      var fn=REG[el.getAttribute("data-widget")];
      if(fn){try{fn(el);}catch(e){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: '+esc(e.message)+'</div>';}}
    });
    requestAnimationFrame(redrawAll);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
