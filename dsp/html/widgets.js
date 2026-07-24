/* dsp 章内インタラクティブ部品。 <div class="widget" data-widget="NAME"> を探して描画。 */
(function(){
  "use strict";
  var root=document.documentElement;
  var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var TAU=Math.PI*2;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var draws=[];
  function redrawAll(){draws.forEach(function(f){try{f();}catch(e){}});}
  window.addEventListener("themechange",function(){requestAnimationFrame(redrawAll);});
  window.addEventListener("resize",function(){requestAnimationFrame(redrawAll);});

  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+k+'</span><span class="t">'+t+'</span>'));}
  function screen(el,h){var s=mk("div","wscreen");s.style.height=h+"px";var c=mk("canvas");s.appendChild(c);el.appendChild(s);return c;}
  function cctx(cv){var ctx=cv.getContext("2d");function fit(){var r=cv.getBoundingClientRect();var dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height};}return {ctx:ctx,fit:fit};}
  function reg(cv,draw){draws.push(draw);new ResizeObserver(draw).observe(cv);}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function slider(row,label,min,max,val,step){var c=mk("div","ctrl");c.innerHTML='<label>'+label+' <b class="val"></b></label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+step+'">';row.appendChild(c);return {input:c.querySelector("input"),val:c.querySelector(".val")};}
  function button(row,t){var b=mk("button","btn",t);b.setAttribute("aria-pressed","false");row.appendChild(b);return b;}
  function checkbox(row,t){var l=mk("label","chk",'<input type="checkbox"> '+t);row.appendChild(l);return l.querySelector("input");}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function legend(el,items){el.appendChild(mk("div","legend",items.map(function(it){return '<span><i style="background:'+it[0]+'"></i>'+it[1]+"</span>";}).join("")));}
  function grid(ctx,w,h,p){ctx.strokeStyle=C("--grid");ctx.lineWidth=1;ctx.beginPath();for(var x=p.l;x<=w-p.r+0.5;x+=(w-p.l-p.r)/10){ctx.moveTo(x,p.t);ctx.lineTo(x,h-p.b);}for(var y=p.t;y<=h-p.b+0.5;y+=(h-p.t-p.b)/6){ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);}ctx.stroke();}
  function lab(ctx,t,x,y,c,a){ctx.fillStyle=c;ctx.font="11px "+C("--mono");ctx.textAlign=a||"left";ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function fmag(b,a,w){var nr=0,ni=0,dr=0,di=0,k;for(k=0;k<b.length;k++){nr+=b[k]*Math.cos(-w*k);ni+=b[k]*Math.sin(-w*k);}for(k=0;k<a.length;k++){dr+=a[k]*Math.cos(-w*k);di+=a[k]*Math.sin(-w*k);}var nm=Math.hypot(nr,ni),dm=Math.hypot(dr,di);return dm===0?1e6:nm/dm;}
  function unitcircle(ctx,cx,cy,R){ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();ctx.strokeStyle=C("--grid");ctx.beginPath();ctx.moveTo(cx-R-8,cy);ctx.lineTo(cx+R+8,cy);ctx.moveTo(cx,cy-R-8);ctx.lineTo(cx,cy+R+8);ctx.stroke();}
  // dB曲線 ω∈[0,π]
  function plotdB(ctx,w,h,p,fn,ymin,ymax,color,lw){var X=function(o){return p.l+o/Math.PI*(w-p.l-p.r);};var Y=function(d){return p.t+(ymax-d)/(ymax-ymin)*(h-p.t-p.b);};ctx.strokeStyle=color;ctx.lineWidth=lw||2;ctx.beginPath();for(var i=0;i<=320;i++){var o=i/320*Math.PI,d=fn(o);d=Math.max(ymin,Math.min(ymax,d));var x=X(o),y=Y(d);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();return {X:X,Y:Y};}
  function axw(ctx,w,h,p){ // ω軸ラベル 0,π/2,π
    ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,h-p.b);ctx.lineTo(w-p.r,h-p.b);ctx.stroke();
    lab(ctx,"0",p.l,h-p.b+13,C("--muted"),"center");lab(ctx,"π/2",(p.l+w-p.r)/2,h-p.b+13,C("--muted"),"center");lab(ctx,"π",w-p.r,h-p.b+13,C("--muted"),"right");
  }

  var REG={};

  /* ---- サンプリング ---- */
  REG.sampling=function(el){
    head(el,"Scope","連続波形を「点」に落とす");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"サンプリング周波数 f_s",4,40,12,1);s.val.textContent="12 点/周期";
    legend(el,[["var(--signal)","連続 x_a(t)"],["var(--alias)","標本 x[n]"]]);
    function wave(u){return 0.62*Math.sin(TAU*u)+0.32*Math.sin(TAU*2*u+0.7);}
    function draw(){var d=cc.fit(),w=d.w,h=d.h,p={l:16,r:16,t:16,b:18};cc.ctx.clearRect(0,0,w,h);var ctx=cc.ctx;grid(ctx,w,h,p);
      var X=function(u){return p.l+u*(w-p.l-p.r);},midY=(h-p.t-p.b)/2+p.t,amp=(h-p.t-p.b)/2*0.82,Y=function(v){return midY-v*amp;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p.l,Y(0));ctx.lineTo(w-p.r,Y(0));ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();for(var i=0;i<=600;i++){var u=i/600;i?ctx.lineTo(X(u),Y(wave(u))):ctx.moveTo(X(u),Y(wave(u)));}ctx.stroke();
      var N=+s.input.value;s.val.textContent=N+" 点/周期";ctx.fillStyle=C("--alias");ctx.strokeStyle=C("--alias");ctx.lineWidth=1.5;
      for(var nn=0;nn<=N;nn++){var u2=nn/N,x=X(u2),y=Y(wave(u2));ctx.beginPath();ctx.moveTo(x,Y(0));ctx.lineTo(x,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,3.3,0,TAU);ctx.fill();}
    }
    s.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 位相子＋2π周期 ---- */
  REG.phasor=function(el){
    head(el,"Phasor","回る点の影が cos(ωn)");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var s=slider(row,"ω",0,200,50,1);var btn=button(row,"▶ 回す");var k2=checkbox(row,"ω+2π を重ねる");
    var out=readout(el);var Nn=16,phase=0,spin=null;
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var wv=+s.input.value/100,om=wv*Math.PI;s.val.textContent=wv.toFixed(2)+"π";
      var split=Math.min(h*1.05,w*0.42),cx=split/2+6,cy=h/2,R=Math.min(split,h)/2-16;
      unitcircle(ctx,cx,cy,R);ctx.fillStyle=C("--alias");
      for(var n=0;n<Nn;n++){var a=om*n;ctx.globalAlpha=0.22+0.78*(1-n/Nn);ctx.beginPath();ctx.arc(cx+R*Math.cos(a),cy-R*Math.sin(a),2.5,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;var a0=spin?phase:0;ctx.strokeStyle=C("--signal");ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a0),cy-R*Math.sin(a0));ctx.stroke();
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(cx+R*Math.cos(a0),cy-R*Math.sin(a0),4,0,TAU);ctx.fill();
      var px=split+14,pw=w-split-24,pt=16,pb=h-20,midY=(pt+pb)/2,amp=(pb-pt)/2*0.86,Xn=function(n){return px+n/(Nn-1)*pw;},Y=function(v){return midY-v*amp;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(px,midY);ctx.lineTo(px+pw,midY);ctx.stroke();
      ctx.strokeStyle=C("--faint");ctx.globalAlpha=0.4;ctx.lineWidth=1.5;ctx.beginPath();for(var i=0;i<=400;i++){var nn=i/400*(Nn-1);i?ctx.lineTo(px+nn/(Nn-1)*pw,Y(Math.cos(om*nn))):ctx.moveTo(px,Y(Math.cos(0)));}ctx.stroke();ctx.globalAlpha=1;
      ctx.fillStyle=C("--alias");ctx.strokeStyle=C("--alias");ctx.lineWidth=1.5;for(var m=0;m<Nn;m++){var x=Xn(m),y=Y(Math.cos(om*m));ctx.beginPath();ctx.moveTo(x,midY);ctx.lineTo(x,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();}
      if(k2.checked){ctx.fillStyle=C("--blue");for(var q=0;q<Nn;q++){ctx.globalAlpha=0.55;ctx.beginPath();ctx.arc(Xn(q),Y(Math.cos((om+TAU)*q)),5,0,TAU);ctx.fill();ctx.globalAlpha=1;}}
      lab(ctx,"cos(ωn)",px+pw,pt+2,C("--muted"),"right");lab(ctx,"Re",cx+R+2,cy+13,C("--muted"),"right");
      var note;if(wv<0.02)note='<span class="ok">直流</span>：回らない。';else if(Math.abs(wv-1)<0.03)note='<span class="warn">ω=π</span>：1サンプルで半回転（±1交互）＝最速。';else if(wv>1)note='<span class="warn">ω&gt;π</span>：より遅い波と見分けがつかない（エイリアシング）。';else note="1サンプルで "+wv.toFixed(2)+"π rad 進む。";
      out.innerHTML="ω = <b>"+wv.toFixed(2)+"π</b> ／ "+note+(k2.checked?' <span style="color:var(--blue)">青(ω+2π)が赤に重なる＝2π周期</span>':"");
    }
    s.input.addEventListener("input",draw);k2.addEventListener("change",draw);
    btn.addEventListener("click",function(){if(spin){cancelAnimationFrame(spin);spin=null;btn.setAttribute("aria-pressed","false");draw();return;}btn.setAttribute("aria-pressed","true");var last=performance.now();(function loop(t){var dt=(t-last)/1000;last=t;var om=(+s.input.value/100)*Math.PI;phase+=Math.max(om,0.15)*dt*1.1;draw();spin=requestAnimationFrame(loop);})(last);});
    reg(cv,draw);
  };

  /* ---- エイリアシング ---- */
  REG.alias=function(el){
    head(el,"Alias","高い波が低い波に化ける");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"真の周波数 f_0",1,47,30,0.5);var btn=button(row,"▶ 掃引");var out=readout(el);
    var FS=48,Tw=12/FS,dir=1,sweep=null;
    function fold(f){var m=((f%FS)+FS)%FS;return m>FS/2?FS-m:m;}
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:16,r:16,t:16,b:14};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var f0=+s.input.value;s.val.textContent=f0.toFixed(1)+" kHz";var fa=fold(f0);
      var X=function(t){return p.l+t/Tw*(w-p.l-p.r);},midY=(h-p.t-p.b)/2+p.t,amp=(h-p.t-p.b)/2*0.86,Y=function(v){return midY-v*amp;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p.l,Y(0));ctx.lineTo(w-p.r,Y(0));ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.globalAlpha=0.5;ctx.lineWidth=1.5;ctx.beginPath();for(var i=0;i<=800;i++){var t=i/800*Tw;i?ctx.lineTo(X(t),Y(Math.cos(TAU*f0*t))):ctx.moveTo(X(t),Y(Math.cos(0)));}ctx.stroke();ctx.globalAlpha=1;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.5;ctx.beginPath();for(var j=0;j<=800;j++){var t2=j/800*Tw;j?ctx.lineTo(X(t2),Y(Math.cos(TAU*fa*t2))):ctx.moveTo(X(t2),Y(Math.cos(0)));}ctx.stroke();
      ctx.fillStyle=C("--ink");for(var nn=0;nn<=12;nn++){var t3=nn/FS,x=X(t3),y=Y(Math.cos(TAU*f0*t3));ctx.beginPath();ctx.arc(x,y,3.5,0,TAU);ctx.fill();ctx.strokeStyle=C("--screen");ctx.lineWidth=1.5;ctx.stroke();}
      lab(ctx,"真 "+f0.toFixed(1)+"kHz",p.l+2,p.t+11,C("--signal"),"left");lab(ctx,"見かけ "+fa.toFixed(1)+"kHz",w-p.r-2,p.t+11,C("--alias"),"right");
      var ny=f0>FS/2;out.innerHTML="真 <b>"+f0.toFixed(1)+" kHz</b> ／ 見かけ <b class=\""+(ny?"warn":"ok")+"\">"+fa.toFixed(1)+" kHz</b> "+(ny?'— <span class="warn">ナイキスト24kHz超：折り返し。真と見かけが同じ●を通る。</span>':'— <span class="ok">24kHz以下：正しく標本化。</span>');
    }
    s.input.addEventListener("input",draw);
    btn.addEventListener("click",function(){if(sweep){cancelAnimationFrame(sweep);sweep=null;btn.setAttribute("aria-pressed","false");return;}btn.setAttribute("aria-pressed","true");var last=performance.now();(function loop(t){var dt=(t-last)/1000;last=t;var v=+s.input.value+dir*dt*7;if(v>=47){v=47;dir=-1;}if(v<=1){v=1;dir=1;}s.input.value=v.toFixed(1);draw();sweep=requestAnimationFrame(loop);})(last);});
    reg(cv,draw);
  };

  /* ---- オイラー（cos/sinの射影）---- */
  REG.euler=function(el){
    head(el,"Euler","e^{jθ}=cosθ+j sinθ");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"角度 θ",0,360,50,1);var btn=button(row,"▶ 回す");var out=readout(el);
    var spin=null,th=50*Math.PI/180;
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      th=(+s.input.value)*Math.PI/180;s.val.textContent=(+s.input.value)+"°";
      var split=Math.min(h*1.05,w*0.46),cx=split/2+8,cy=h/2,R=Math.min(split,h)/2-20;
      unitcircle(ctx,cx,cy,R);var px=cx+R*Math.cos(th),py=cy-R*Math.sin(th);
      ctx.setLineDash([3,3]);ctx.strokeStyle=C("--alias");ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,cy);ctx.stroke();
      ctx.strokeStyle=C("--blue");ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(cx,py);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.stroke();
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(px,py,4,0,TAU);ctx.fill();
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(px,cy,3,0,TAU);ctx.fill();ctx.fillStyle=C("--blue");ctx.beginPath();ctx.arc(cx,py,3,0,TAU);ctx.fill();
      lab(ctx,"cosθ",px,cy+14,C("--alias"),"center");lab(ctx,"sinθ",cx-6,py-4,C("--blue"),"right");
      // 右: cos, sin トレース
      var qx=split+14,qw=w-split-22,pt=18,pb=h-18,midY=(pt+pb)/2,amp=(pb-pt)/2*0.86,Y=function(v){return midY-v*amp;},Xr=function(a){return qx+a/TAU*qw;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(qx,midY);ctx.lineTo(qx+qw,midY);ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;ctx.beginPath();for(var i=0;i<=300;i++){var a=i/300*TAU;i?ctx.lineTo(Xr(a),Y(Math.cos(a))):ctx.moveTo(Xr(0),Y(1));}ctx.stroke();
      ctx.strokeStyle=C("--blue");ctx.beginPath();for(var j=0;j<=300;j++){var a2=j/300*TAU;j?ctx.lineTo(Xr(a2),Y(Math.sin(a2))):ctx.moveTo(Xr(0),Y(0));}ctx.stroke();
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(Xr(th),Y(Math.cos(th)),3.5,0,TAU);ctx.fill();ctx.fillStyle=C("--blue");ctx.beginPath();ctx.arc(Xr(th),Y(Math.sin(th)),3.5,0,TAU);ctx.fill();
      lab(ctx,"cos",qx+qw,pt+2,C("--alias"),"right");lab(ctx,"sin",qx+qw,pt+15,C("--blue"),"right");
      out.innerHTML="θ = <b>"+(+s.input.value)+"°</b> ／ cosθ = <b>"+Math.cos(th).toFixed(3)+"</b>, sinθ = <b>"+Math.sin(th).toFixed(3)+"</b> — 回る点の実軸/虚軸への影が cos/sin。";
    }
    s.input.addEventListener("input",draw);
    btn.addEventListener("click",function(){if(spin){cancelAnimationFrame(spin);spin=null;btn.setAttribute("aria-pressed","false");return;}btn.setAttribute("aria-pressed","true");var last=performance.now();(function loop(t){var dt=(t-last)/1000;last=t;var v=(+s.input.value+dt*60)%360;s.input.value=v.toFixed(0);draw();spin=requestAnimationFrame(loop);})(last);});
    reg(cv,draw);
  };

  /* ---- a^n u[n] の DTFT ---- */
  REG.dtft=function(el){
    head(el,"DTFT","x[n]=a^n u[n] の振幅特性");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"a",5,98,80,1);var out=readout(el);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:38,r:14,t:14,b:20};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var a=+s.input.value/100;s.val.textContent=a.toFixed(2);
      var mag=function(o){return 1/Math.sqrt(1-2*a*Math.cos(o)+a*a);},m0=mag(0);
      var ymin=-30,ymax=3;var pl=plotdB(ctx,w,h,p,function(o){return 20*Math.log10(mag(o)/m0);},ymin,ymax,C("--signal"),2.5);
      // -3dB
      ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,pl.Y(-3.01));ctx.lineTo(w-p.r,pl.Y(-3.01));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"0dB",p.l-4,pl.Y(0)+3,C("--muted"),"right");lab(ctx,"−3",p.l-4,pl.Y(-3)+3,C("--muted"),"right");lab(ctx,"−30",p.l-4,pl.Y(-30)+3,C("--muted"),"right");
      axw(ctx,w,h,p);
      out.innerHTML="a = <b>"+a.toFixed(2)+"</b> ／ 直流ゲイン 1/(1−a) = <b>"+(1/(1-a)).toFixed(1)+"</b> ／ a を 1 に近づけるほど鋭いローパス（低域が持ち上がり遮断が急）。";
    }
    s.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 極零点 → 周波数特性 ---- */
  REG.polezero=function(el){
    head(el,"Pole·Zero","極を動かして周波数特性を作る");
    var cv=screen(el,270),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"極の半径 r",50,99,90,1);var stheta=slider(row,"極の角度 θ",3,177,60,1);var out=readout(el);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var r=+sr.input.value/100,th=(+stheta.input.value)*Math.PI/180;sr.val.textContent=r.toFixed(2);stheta.val.textContent=(+stheta.input.value)+"°";
      var b=[1,0,-1],a=[1,-2*r*Math.cos(th),r*r];
      var split=Math.min(h*1.05,w*0.44),cx=split/2+8,cy=h/2,R=Math.min(split,h)/2-18;
      unitcircle(ctx,cx,cy,R);
      // zeros ±1
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;[1,-1].forEach(function(zx){ctx.beginPath();ctx.arc(cx+R*zx,cy,5,0,TAU);ctx.stroke();});
      // poles
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.5;[th,-th].forEach(function(pa){var x=cx+R*r*Math.cos(pa),y=cy-R*r*Math.sin(pa);ctx.beginPath();ctx.moveTo(x-5,y-5);ctx.lineTo(x+5,y+5);ctx.moveTo(x+5,y-5);ctx.lineTo(x-5,y+5);ctx.stroke();});
      lab(ctx,"×極  ○零点",cx,cy+R+14,C("--muted"),"center");
      // 右: |H| dB
      var p={l:split+34,r:14,t:16,b:20};var pl=plotdB(ctx,w,h,p,function(o){var m=fmag(b,a,o);return 20*Math.log10(m<1e-6?1e-6:m);},-40,25,C("--signal"),2.5);
      // θ 縦線
      ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);ctx.lineWidth=1;var xth=pl.X(th);ctx.beginPath();ctx.moveTo(xth,p.t);ctx.lineTo(xth,h-p.b);ctx.stroke();ctx.setLineDash([]);
      axw(ctx,w,h,p);lab(ctx,"|H| dB",p.l+2,p.t+2,C("--muted"),"left");lab(ctx,"θ",xth,p.t+11,C("--faint"),"center");
      out.innerHTML="極 r=<b>"+r.toFixed(2)+"</b>, θ=<b>"+(+stheta.input.value)+"°</b> ／ 極が単位円に近い（r→1）ほど ω=θ のピークが鋭くなる。零点 z=±1 が ω=0, π に谷を作る。";
    }
    sr.input.addEventListener("input",draw);stheta.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- EMA（1次IIR）---- */
  REG.ema=function(el){
    head(el,"EMA","y[n]=a·y[n−1]+(1−a)x[n]");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"a",50,98,90,1);var out=readout(el);
    legend(el,[["var(--alias)","インパルス応答 h[n]"],["var(--signal)","振幅特性 |H| dB"]]);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var a=+s.input.value/100;s.val.textContent=a.toFixed(2);
      var split=w*0.46;
      // 左: h[n]=(1-a)a^n
      var p1={l:16,r:12,t:14,b:20};grid(ctx,split,h,p1);var Nn=40,base=h-p1.b,top=p1.t+4,H=base-top;var hmax=1-a;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p1.l,base);ctx.lineTo(split-p1.r,base);ctx.stroke();
      ctx.fillStyle=C("--alias");ctx.strokeStyle=C("--alias");ctx.lineWidth=1.5;
      for(var n=0;n<=Nn;n++){var hv=(1-a)*Math.pow(a,n);var x=p1.l+n/Nn*(split-p1.l-p1.r),y=base-hv/hmax*H;ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,2.3,0,TAU);ctx.fill();}
      lab(ctx,"h[n]",p1.l+2,p1.t+8,C("--muted"),"left");
      // 右: |H| dB
      var p={l:split+30,r:14,t:14,b:20};var b=[1-a],aa=[1,-a];var pl=plotdB(ctx,w,h,p,function(o){var m=fmag(b,aa,o);return 20*Math.log10(m<1e-6?1e-6:m);},-30,3,C("--signal"),2.5);
      ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,pl.Y(-3.01));ctx.lineTo(w-p.r,pl.Y(-3.01));ctx.stroke();ctx.setLineDash([]);
      axw(ctx,w,h,p);lab(ctx,"|H| dB",p.l+2,p.t+8,C("--muted"),"left");
      var wc=Math.acos((4*a-a*a-1)/(2*a));out.innerHTML="a = <b>"+a.toFixed(2)+"</b> ／ カットオフ ω_c ≈ <b>"+(isNaN(wc)?"—":wc.toFixed(3))+"</b> rad ／ a を上げるほど余韻が長く（左）、カットオフが下がる（右）。";
    }
    s.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- リミットサイクル ---- */
  REG.limitcycle=function(el){
    head(el,"Limit Cycle","固定小数点の零入力応答");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"a",-99,99,95,1);var out=readout(el);
    legend(el,[["var(--signal)","理想（無限精度）"],["var(--alias)","固定小数点（丸めあり）"]]);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:30,r:14,t:14,b:20};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var a=+s.input.value/100;s.val.textContent=a.toFixed(2);var N=60,y0=16;
      var X=function(n){return p.l+n/N*(w-p.l-p.r);},midY=(p.t+h-p.b)/2,amp=(h-p.t-p.b)/2*0.9/y0,Y=function(v){return midY-v*amp;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p.l,Y(0));ctx.lineTo(w-p.r,Y(0));ctx.stroke();
      var yf=y0,yq=y0;ctx.strokeStyle=C("--signal");ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(0),Y(yf));
      var qs=[y0];for(var n=1;n<=N;n++){yf=a*yf;ctx.lineTo(X(n),Y(yf));qs.push(0);}ctx.stroke();
      yq=y0;ctx.strokeStyle=C("--alias");ctx.fillStyle=C("--alias");ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(0),Y(yq));
      for(var m=1;m<=N;m++){yq=Math.round(a*yq);ctx.lineTo(X(m),Y(yq));}ctx.stroke();
      yq=y0;for(var q=0;q<=N;q++){ctx.beginPath();ctx.arc(X(q),Y(yq),2,0,TAU);ctx.fill();yq=Math.round(a*yq);}
      lab(ctx,"LSB",p.l-4,Y(y0)+3,C("--muted"),"right");lab(ctx,"0",p.l-4,Y(0)+3,C("--muted"),"right");lab(ctx,"n",w-p.r,h-p.b+13,C("--muted"),"right");
      // 収束先を判定
      var yq2=y0;for(var z=0;z<200;z++)yq2=Math.round(a*yq2);
      var note=yq2===0?'<span class="ok">0 に収束（正常）</span>':(Math.abs(yq2)>0?'<span class="warn">±'+Math.abs(yq2)+' LSB で残留（デッドバンド／リミットサイクル）</span>':'');
      out.innerHTML="a = <b>"+a.toFixed(2)+"</b> ／ 固定小数点の最終状態: "+note+"。理想は 0 へ減衰するが、丸めがループを回ると 0 に戻らないことがある。";
    }
    s.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- インパルス分解 ---- */
  REG.decomp=function(el){
    head(el,"Build","信号をインパルスで組み立てる");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var bBuild=button(row,"▶ 組み立てる");var bReset=button(row,"↺ リセット");var s=slider(row,"進捗",0,14,0,1);
    legend(el,[["var(--faint)","目標 x[n]"],["var(--alias)","いま足したインパルス"],["var(--signal)","組み上がり"]]);
    var target=[0,0.5,0.9,1.0,0.72,0.28,-0.28,-0.68,-0.62,-0.24,0.2,0.42,0.24,0.06],N=target.length,step=0,anim=null;
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:16,r:16,t:14,b:24};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var bw=(w-p.l-p.r)/N,midY=(h-p.t-p.b)*0.52+p.t,amp=(h-p.t-p.b)/2*0.8,Y=function(v){return midY-v*amp;},Xc=function(n){return p.l+(n+0.5)*bw;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p.l,Y(0));ctx.lineTo(w-p.r,Y(0));ctx.stroke();
      ctx.fillStyle=C("--faint");ctx.globalAlpha=0.5;for(var n=0;n<N;n++){ctx.beginPath();ctx.arc(Xc(n),Y(target[n]),2.6,0,TAU);ctx.fill();}ctx.globalAlpha=1;
      ctx.strokeStyle=C("--signal");ctx.fillStyle=C("--signal");ctx.lineWidth=2.5;for(var m=0;m<step&&m<N;m++){var x=Xc(m),y=Y(target[m]);ctx.beginPath();ctx.moveTo(x,Y(0));ctx.lineTo(x,y);ctx.stroke();ctx.beginPath();ctx.arc(x,y,3.4,0,TAU);ctx.fill();}
      if(step>=1&&step<=N){var k=step-1,xx=Xc(k),yy=Y(target[k]);ctx.strokeStyle=C("--alias");ctx.fillStyle=C("--alias");ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xx,Y(0));ctx.lineTo(xx,yy);ctx.stroke();ctx.beginPath();ctx.arc(xx,yy,5,0,TAU);ctx.fill();lab(ctx,"x["+k+"]·δ[n−"+k+"]",xx,Y(0)+16,C("--alias"),"center");}
      s.val.textContent=step+" / "+N+" 本";s.input.value=step;
    }
    function set(v){step=Math.max(0,Math.min(N,v));draw();}
    s.input.addEventListener("input",function(){set(+s.input.value);});
    bReset.addEventListener("click",function(){if(anim)cancelAnimationFrame(anim);anim=null;bBuild.setAttribute("aria-pressed","false");set(0);});
    bBuild.addEventListener("click",function(){if(anim){cancelAnimationFrame(anim);anim=null;bBuild.setAttribute("aria-pressed","false");return;}if(step>=N)set(0);bBuild.setAttribute("aria-pressed","true");var last=performance.now(),acc=0,period=reduce?1:240;(function loop(t){acc+=t-last;last=t;if(acc>=period){acc=0;set(step+1);if(step>=N){bBuild.setAttribute("aria-pressed","false");anim=null;return;}}anim=requestAnimationFrame(loop);})(last);});
    reg(cv,draw);
  };

  /* ---- スペクトル複製 ---- */
  REG.spectrum=function(el){
    head(el,"Spectrum","コピーが重なると混ざる");
    var cv=screen(el,200),cc=cctx(cv);var row=ctrls(el);var s=slider(row,"サンプリング周波数 f_s",0.35,1.6,1.0,0.01);var out=readout(el);var B=0.30;
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:16,r:16,t:14,b:22};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var fs=+s.input.value;s.val.textContent=fs.toFixed(2)+"（B=0.30）";var range=1.75,X=function(f){return p.l+(f+range)/(2*range)*(w-p.l-p.r);},base=h-p.b,top=p.t+6,Hh=base-top;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p.l,base);ctx.lineTo(w-p.r,base);ctx.stroke();
      function tri(c,col,al){ctx.globalAlpha=al;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(X(c-B),base);ctx.lineTo(X(c),top);ctx.lineTo(X(c+B),base);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
      for(var k=-3;k<=3;k++){if(k)tri(k*fs,C("--alias"),0.22);}tri(0,C("--signal"),0.5);
      var overlap=fs<2*B;if(overlap){var a=fs-B,b=B;if(a<b){ctx.globalAlpha=0.55;ctx.fillStyle=C("--alias");ctx.beginPath();ctx.moveTo(X(a),base);for(var i=0;i<=40;i++){var f=a+(b-a)*i/40,yA=base-Hh*Math.max(0,1-Math.abs(f)/B),yB=base-Hh*Math.max(0,1-Math.abs(f-fs)/B);ctx.lineTo(X(f),Math.min(yA,yB));}ctx.lineTo(X(b),base);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}}
      ctx.strokeStyle=C("--muted");ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(fs/2),top-4);ctx.lineTo(X(fs/2),base);ctx.moveTo(X(-fs/2),top-4);ctx.lineTo(X(-fs/2),base);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"f_s/2",X(fs/2)+3,top+4,C("--muted"),"left");lab(ctx,"0",X(0),base+14,C("--muted"),"center");lab(ctx,"f_s",X(fs),base+14,C("--muted"),"center");lab(ctx,"−f_s",X(-fs),base+14,C("--muted"),"center");
      out.innerHTML="f_s = <b>"+fs.toFixed(2)+"</b>, 2B = <b>0.60</b> → "+(overlap?'<span class="warn">f_s &lt; 2B：コピーが重なりエイリアシング（赤）。</span>':'<span class="ok">f_s &gt; 2B：隙間があり完全復元可能。</span>');
    }
    s.input.addEventListener("input",draw);reg(cv,draw);
  };

  function init(){document.querySelectorAll("[data-widget]").forEach(function(el){if(el.dataset.done)return;el.dataset.done="1";var fn=REG[el.getAttribute("data-widget")];if(fn){try{fn(el);}catch(e){}}});requestAnimationFrame(redrawAll);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
