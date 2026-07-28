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


  /* ---- 畳み込みのスライド ---- */
  REG.conv=function(el){
    head(el,"Convolution","h を反転してずらしながら掛けて足す");
    var cv=screen(el,260),cc=cctx(cv);var row=ctrls(el);
    var X=[0,0.9,1.0,0.75,0.35,0],H=[1,0.75,0.55,0.4,0.3,0.22,0.16,0.12];
    var LY=X.length+H.length-2;
    var s=slider(row,"時刻 n",0,LY,4,1);var btn=button(row,"▶ 再生");var out=readout(el);
    legend(el,[["var(--signal)","x[k]"],["var(--alias)","h[n−k]（反転してずらす）"],["var(--blue)","積 x[k]·h[n−k]"]]);
    var anim=null;
    function y_at(n){var s2=0;for(var k=0;k<X.length;k++){var i=n-k;if(i>=0&&i<H.length)s2+=X[k]*H[i];}return s2;}
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var n=+s.input.value;s.val.textContent="n = "+n;
      var kmin=-H.length+1,kmax=X.length-1,NK=kmax-kmin+1;
      var pT={l:26,r:14,t:12,b:20},hT=h*0.56;
      grid(ctx,w,hT,pT);
      var Xk=function(k){return pT.l+(k-kmin+0.5)/NK*(w-pT.l-pT.r);},b1=hT-pT.b,t1=pT.t+4,H1=b1-t1;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(pT.l,b1);ctx.lineTo(w-pT.r,b1);ctx.stroke();
      for(var k=kmin;k<=kmax;k++){
        var xv=(k>=0&&k<X.length)?X[k]:0, i=n-k, hv=(i>=0&&i<H.length)?H[i]:0;
        var x=Xk(k);
        if(hv>0){ctx.strokeStyle=C("--alias");ctx.fillStyle=C("--alias");ctx.lineWidth=1.5;ctx.globalAlpha=.65;
          ctx.beginPath();ctx.moveTo(x+3,b1);ctx.lineTo(x+3,b1-hv*H1*0.9);ctx.stroke();
          ctx.beginPath();ctx.arc(x+3,b1-hv*H1*0.9,2.6,0,TAU);ctx.fill();ctx.globalAlpha=1;}
        if(xv>0){ctx.strokeStyle=C("--signal");ctx.fillStyle=C("--signal");ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(x-3,b1);ctx.lineTo(x-3,b1-xv*H1*0.9);ctx.stroke();
          ctx.beginPath();ctx.arc(x-3,b1-xv*H1*0.9,3,0,TAU);ctx.fill();}
        if(xv>0&&hv>0){var pv=xv*hv;ctx.fillStyle=C("--blue");ctx.globalAlpha=.75;
          ctx.fillRect(x-6,b1-pv*H1*0.9,12,pv*H1*0.9);ctx.globalAlpha=1;}
        if(k%2===0)lab(ctx,String(k),x,b1+13,C("--faint"),"center");
      }
      lab(ctx,"k",w-pT.r,b1+13,C("--muted"),"right");
      lab(ctx,"重なった青の面積 = y["+n+"]",pT.l+4,t1+8,C("--blue"),"left");
      // 下段 y[n]
      var oy=hT,pB={l:26,r:14,t:10,b:20},hB=h-oy;
      ctx.save();ctx.translate(0,oy);grid(ctx,w,hB,pB);
      var b2=hB-pB.b,t2=pB.t+4,H2=b2-t2,ymax=0;for(var q=0;q<=LY;q++)ymax=Math.max(ymax,y_at(q));
      var Xn=function(m){return pB.l+(m+0.5)/(LY+1)*(w-pB.l-pB.r);};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(pB.l,b2);ctx.lineTo(w-pB.r,b2);ctx.stroke();
      for(var m=0;m<=LY;m++){var yv=y_at(m),x2=Xn(m),cur=(m===n);
        ctx.strokeStyle=cur?C("--blue"):C("--faint");ctx.fillStyle=cur?C("--blue"):C("--faint");
        ctx.globalAlpha=(m<=n)?1:0.25;ctx.lineWidth=cur?3:1.8;
        ctx.beginPath();ctx.moveTo(x2,b2);ctx.lineTo(x2,b2-yv/ymax*H2*0.88);ctx.stroke();
        ctx.beginPath();ctx.arc(x2,b2-yv/ymax*H2*0.88,cur?4.5:3,0,TAU);ctx.fill();ctx.globalAlpha=1;}
      lab(ctx,"y[n] = Σ x[k]h[n−k]",pB.l+4,t2+8,C("--muted"),"left");lab(ctx,"n",w-pB.r,b2+13,C("--muted"),"right");
      ctx.restore();
      out.innerHTML="n = <b>"+n+"</b> ／ y["+n+"] = <b>"+y_at(n).toFixed(3)+"</b> — 上段で赤(h)を反転してn だけずらし、青(x)と重なった積（青帯）を全部足したものが下段の 1 本。";
    }
    s.input.addEventListener("input",draw);
    btn.addEventListener("click",function(){if(anim){cancelAnimationFrame(anim);anim=null;btn.setAttribute("aria-pressed","false");return;}btn.setAttribute("aria-pressed","true");var last=performance.now(),acc=0;(function loop(t){acc+=t-last;last=t;if(acc>=(reduce?1:420)){acc=0;var v=(+s.input.value+1);if(v>LY)v=0;s.input.value=v;draw();}anim=requestAnimationFrame(loop);})(last);});
    reg(cv,draw);
  };

  /* ---- 単位円ウォーク ---- */
  REG.zwalk=function(el){
    head(el,"Unit Circle","単位円を一周 = 周波数特性をなぞる");
    var cv=screen(el,260),cc=cctx(cv);var row=ctrls(el);
    var s=slider(row,"ω",0,100,28,1);var btn=button(row,"▶ 一周する");var out=readout(el);
    var r=0.86,th=Math.PI/3,b=[1,0,-1],a=[1,-2*r*Math.cos(th),r*r],anim=null;
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var wv=+s.input.value/100,om=wv*Math.PI;s.val.textContent=wv.toFixed(2)+"π";
      var split=Math.min(h*1.08,w*0.44),cx=split/2+8,cy=h/2,R=Math.min(split,h)/2-20;
      unitcircle(ctx,cx,cy,R);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(cx,cy,R,-om,0);ctx.stroke();
      [th,-th].forEach(function(pa){var x=cx+R*r*Math.cos(pa),y=cy-R*r*Math.sin(pa);ctx.strokeStyle=C("--alias");ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(x-5,y-5);ctx.lineTo(x+5,y+5);ctx.moveTo(x+5,y-5);ctx.lineTo(x-5,y+5);ctx.stroke();});
      [1,-1].forEach(function(zx){ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx+R*zx,cy,5,0,TAU);ctx.stroke();});
      var px=cx+R*Math.cos(om),py=cy-R*Math.sin(om);
      ctx.strokeStyle=C("--faint");ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(px,py,6,0,TAU);ctx.fill();
      lab(ctx,"z = e^{jω}",px+9,py-6,C("--signal"),"left");
      var p={l:split+34,r:14,t:16,b:20};
      var pl=plotdB(ctx,w,h,p,function(o){var m=fmag(b,a,o);return 20*Math.log10(m<1e-6?1e-6:m);},-40,25,C("--faint"),1.4);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3;ctx.beginPath();
      for(var i=0;i<=200;i++){var o=i/200*om;if(o>Math.PI)break;var m2=fmag(b,a,o),dv=Math.max(-40,Math.min(25,20*Math.log10(m2<1e-6?1e-6:m2)));i?ctx.lineTo(pl.X(o),pl.Y(dv)):ctx.moveTo(pl.X(o),pl.Y(dv));}
      ctx.stroke();
      var mm=fmag(b,a,Math.min(om,Math.PI)),dd=Math.max(-40,Math.min(25,20*Math.log10(mm)));
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(pl.X(Math.min(om,Math.PI)),pl.Y(dd),5,0,TAU);ctx.fill();
      axw(ctx,w,h,p);lab(ctx,"|H| dB",p.l+2,p.t+8,C("--muted"),"left");
      out.innerHTML="ω = <b>"+wv.toFixed(2)+"π</b> ／ |H| = <b>"+dd.toFixed(1)+" dB</b> — 左の円周上を歩いた分だけ、右の周波数特性が描かれる。極(×)に近づくと山、零点(○)を通ると谷。";
    }
    s.input.addEventListener("input",draw);
    btn.addEventListener("click",function(){if(anim){cancelAnimationFrame(anim);anim=null;btn.setAttribute("aria-pressed","false");return;}btn.setAttribute("aria-pressed","true");s.input.value=0;var last=performance.now();(function loop(t){var dt=(t-last)/1000;last=t;var v=+s.input.value+dt*35;if(v>=100){v=100;btn.setAttribute("aria-pressed","false");cancelAnimationFrame(anim);anim=null;}s.input.value=v;draw();if(anim!==null)anim=requestAnimationFrame(loop);})(last);});
    reg(cv,draw);
  };

  /* ---- 安定三角形 ---- */
  REG.stability=function(el){
    head(el,"Stability","係数 (a1,a2) を動かして安定/発振を見る");
    var cv=screen(el,270),cc=cctx(cv);var row=ctrls(el);
    var s1=slider(row,"a₁",-260,260,-140,1);var s2=slider(row,"a₂",-130,130,70,1);var out=readout(el);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var a1=+s1.input.value/100,a2=+s2.input.value/100;s1.val.textContent=a1.toFixed(2);s2.val.textContent=a2.toFixed(2);
      var stable=(Math.abs(a2)<1)&&(1+a1+a2>0)&&(1-a1+a2>0);
      // 左: 安定三角形
      var split=Math.min(h*1.1,w*0.46),p={l:30,r:12,t:14,b:22};
      var Xa=function(v){return p.l+(v+2.7)/5.4*(split-p.l-p.r);},Ya=function(v){return p.t+(1.45-v)/2.9*(h-p.t-p.b);};
      grid(ctx,split,h,p);
      ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(Xa(-2),Ya(1));ctx.lineTo(Xa(2),Ya(1));ctx.lineTo(Xa(0),Ya(-1));ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.setLineDash([4,3]);ctx.lineWidth=1.2;ctx.beginPath();
      for(var i=0;i<=60;i++){var v=-2+4*i/60,yy=v*v/4;i?ctx.lineTo(Xa(v),Ya(yy)):ctx.moveTo(Xa(v),Ya(yy));}ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Xa(-2.7),Ya(0));ctx.lineTo(Xa(2.7),Ya(0));ctx.moveTo(Xa(0),Ya(1.45));ctx.lineTo(Xa(0),Ya(-1.45));ctx.stroke();
      ctx.fillStyle=stable?C("--signal"):C("--alias");ctx.beginPath();ctx.arc(Xa(a1),Ya(a2),6.5,0,TAU);ctx.fill();
      ctx.strokeStyle=C("--screen");ctx.lineWidth=2;ctx.stroke();
      lab(ctx,"a₁",Xa(2.5),Ya(0)+13,C("--muted"),"center");lab(ctx,"a₂",Xa(0)-6,Ya(1.3),C("--muted"),"right");
      lab(ctx,"安定領域",Xa(0),Ya(0.45),C("--signal"),"center");
      // 右: インパルス応答
      var q={l:split+30,r:14,t:14,b:22},N=44;
      var yy2=[],y1=0,y2=0;for(var n=0;n<N;n++){var xin=(n===0)?1:0;var y=xin-a1*y1-a2*y2;yy2.push(y);y2=y1;y1=y;}
      var mx=1;for(var k=0;k<N;k++)mx=Math.max(mx,Math.abs(yy2[k]));
      grid(ctx,w,h,q);
      var Xn=function(n){return q.l+n/(N-1)*(w-q.l-q.r);},mid=(q.t+h-q.b)/2,amp=(h-q.t-q.b)/2*0.9;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(q.l,mid);ctx.lineTo(w-q.r,mid);ctx.stroke();
      ctx.strokeStyle=stable?C("--signal"):C("--alias");ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1.6;
      for(var m=0;m<N;m++){var yv=mid-yy2[m]/mx*amp;ctx.beginPath();ctx.moveTo(Xn(m),mid);ctx.lineTo(Xn(m),yv);ctx.stroke();ctx.beginPath();ctx.arc(Xn(m),yv,2.2,0,TAU);ctx.fill();}
      lab(ctx,"インパルス応答 h[n]",q.l+2,q.t+9,C("--muted"),"left");lab(ctx,"n",w-q.r,h-q.b+13,C("--muted"),"right");
      var disc=a1*a1-4*a2,ptxt;
      if(disc<0){var rr=Math.sqrt(Math.abs(a2)),ang=Math.acos(Math.max(-1,Math.min(1,-a1/(2*Math.sqrt(Math.abs(a2))))));ptxt="複素共役極 r="+rr.toFixed(3)+", θ="+(ang*180/Math.PI).toFixed(0)+"°";}
      else{var r1=(-a1+Math.sqrt(disc))/2,r2=(-a1-Math.sqrt(disc))/2;ptxt="実数極 "+r1.toFixed(3)+", "+r2.toFixed(3);}
      out.innerHTML="(a₁,a₂) = (<b>"+a1.toFixed(2)+"</b>, <b>"+a2.toFixed(2)+"</b>) ／ "+ptxt+" ／ "+
        (stable?'<span class="ok">安定（三角形の内側・余韻は減衰）</span>':'<span class="warn">不安定（三角形の外側・出力が発散）</span>');
    }
    s1.input.addEventListener("input",draw);s2.input.addEventListener("input",draw);reg(cv,draw);
  };


  /* ---- アナログプロトタイプ（次数と種類） ---- */
  REG.proto=function(el){
    head(el,"Prototype","次数 N とリプルで遮断の鋭さが決まる");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sN=slider(row,"次数 N",1,10,4,1);
    var bB=button(row,"バタワース");var bC=button(row,"チェビシェフ I");
    var sE=slider(row,"リプル(dB)",1,300,100,1);var out=readout(el);
    var mode="butter";
    function setmode(m){mode=m;bB.setAttribute("aria-pressed",m==="butter");bC.setAttribute("aria-pressed",m==="cheby");draw();}
    bB.addEventListener("click",function(){setmode("butter");});
    bC.addEventListener("click",function(){setmode("cheby");});
    function Tn(N,x){ // チェビシェフ多項式
      if(x<=1&&x>=-1)return Math.cos(N*Math.acos(x));
      var s2=x<0?(N%2?-1:1):1, ax=Math.abs(x);
      return s2*Math.cosh(N*Math.log(ax+Math.sqrt(ax*ax-1)));
    }
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:42,r:16,t:16,b:26};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var N=+sN.input.value,Ap=+sE.input.value/100;sN.val.textContent=N;sE.val.textContent=Ap.toFixed(2)+" dB";
      var eps=Math.sqrt(Math.pow(10,Ap/10)-1);
      var ymin=-80,ymax=6,xmin=-1,xmax=1.1; // log10(Ω/Ωc)
      var X=function(lg){return p.l+(lg-xmin)/(xmax-xmin)*(w-p.l-p.r);},Y=function(v){return p.t+(ymax-v)/(ymax-ymin)*(h-p.t-p.b);};
      function dB(lg){var Om=Math.pow(10,lg);
        if(mode==="butter")return -10*Math.log10(1+Math.pow(Om,2*N));
        var T=Tn(N,Om);return -10*Math.log10(1+eps*eps*T*T);}
      // -3dB / リプル線
      ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);ctx.lineWidth=1;
      var refy=(mode==="butter")?-3.01:-Ap;
      ctx.beginPath();ctx.moveTo(p.l,Y(refy));ctx.lineTo(w-p.r,Y(refy));ctx.stroke();ctx.setLineDash([]);
      // 参考: 他次数を薄く
      ctx.strokeStyle=C("--faint");ctx.globalAlpha=.28;ctx.lineWidth=1;
      [1,2,4,6,8,10].forEach(function(nn){if(nn===N)return;var sv=N;N=nn;ctx.beginPath();
        for(var i=0;i<=200;i++){var lg=xmin+(xmax-xmin)*i/200,v=Math.max(ymin,Math.min(ymax,dB(lg)));i?ctx.lineTo(X(lg),Y(v)):ctx.moveTo(X(lg),Y(v));}
        ctx.stroke();N=sv;});
      ctx.globalAlpha=1;
      ctx.strokeStyle=mode==="butter"?C("--signal"):C("--alias");ctx.lineWidth=3;ctx.beginPath();
      for(var i=0;i<=400;i++){var lg=xmin+(xmax-xmin)*i/400,v=Math.max(ymin,Math.min(ymax,dB(lg)));i?ctx.lineTo(X(lg),Y(v)):ctx.moveTo(X(lg),Y(v));}
      ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(X(0),p.t);ctx.lineTo(X(0),h-p.b);ctx.stroke();
      [0,-20,-40,-60,-80].forEach(function(v){lab(ctx,String(v),p.l-5,Y(v)+3,C("--muted"),"right");});
      lab(ctx,"0.1",X(-1),h-p.b+14,C("--muted"),"center");lab(ctx,"Ωc",X(0),h-p.b+14,C("--muted"),"center");lab(ctx,"10",X(1),h-p.b+14,C("--muted"),"center");
      lab(ctx,"|Ha| dB",p.l+2,p.t+9,C("--muted"),"left");lab(ctx,"Ω/Ωc (対数)",w-p.r-2,p.t+9,C("--muted"),"right");
      var slope=-20*N, at2=dB(Math.log10(2));
      out.innerHTML=(mode==="butter"?"バタワース":"チェビシェフ I（リプル "+Ap.toFixed(2)+" dB）")+
        " N = <b>"+N+"</b> ／ 阻止域の傾き <b>"+slope+" dB/decade</b>（= "+(-6*N)+" dB/oct）／ Ω=2Ωc で <b>"+at2.toFixed(1)+" dB</b>"+
        (mode==="cheby"?' — <span class="warn">通過域が波打つ代わりに同次数でより急峻。</span>':' — <span class="ok">通過域は完全に平坦。</span>');
    }
    sN.input.addEventListener("input",draw);sE.input.addEventListener("input",draw);
    reg(cv,draw);setmode("butter");
  };


  /* ---- フーリエ級数: 位相の揃う瞬間だけトゲが立つ ---- */
  REG.fourier=function(el){
    head(el,"Fourier","高調波の位相が揃う瞬間だけトゲが立つ");
    var cv=screen(el,270),cc=cctx(cv);var row=ctrls(el);
    var sK=slider(row,"高調波の数 K",1,15,4,1);
    var sT=slider(row,"時刻 t/T",-150,150,18,1);
    var btn=button(row,"▶ 再生");var out=readout(el);
    legend(el,[["var(--signal)","各高調波 e^{jkΩ_st}（全部長さ1）"],["var(--alias)","合成 ÷ 本数（±k が共役対なので常に実軸上）"]]);
    var anim=null;
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var K=+sK.input.value,tt=+sT.input.value/100,om=TAU; // 時間の単位=T なので Ω_s=2π
      sK.val.textContent=K+"（計 "+(2*K+1)+" 本）";sT.val.textContent=tt.toFixed(2);
      // 左: 位相子
      var split=Math.min(h*1.05,w*0.42),cx=split/2+8,cy=h/2,R=Math.min(split,h)/2-20;
      unitcircle(ctx,cx,cy,R);
      var sum=0;
      for(var k=-K;k<=K;k++){
        var a=k*om*tt,x=cx+R*Math.cos(a),y=cy-R*Math.sin(a);
        ctx.strokeStyle=C("--signal");ctx.globalAlpha=0.3;ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();
        ctx.globalAlpha=0.75;ctx.fillStyle=C("--signal");
        ctx.beginPath();ctx.arc(x,y,2.4,0,TAU);ctx.fill();ctx.globalAlpha=1;
        sum+=Math.cos(a); // 虚部は ±k で打ち消し合う
      }
      var rlen=sum/(2*K+1)*R;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=3.5;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+rlen,cy);ctx.stroke();
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(cx+rlen,cy,5,0,TAU);ctx.fill();
      lab(ctx,"合成が円周に届く = 満場一致",cx,cy+R+15,C("--muted"),"center");
      // 右: 部分和カーブ
      var p={l:split+36,r:14,t:16,b:20},tmin=-1.6,tmax=1.6;
      var X=function(tv){return p.l+(tv-tmin)/(tmax-tmin)*(w-p.l-p.r);};
      var top=2*K+1,ymin=-0.38*top,ymax=1.1*top;
      var Y=function(v){return p.t+(ymax-v)/(ymax-ymin)*(h-p.t-p.b);};
      ctx.strokeStyle=C("--faint");ctx.setLineDash([3,3]);ctx.lineWidth=1;
      [-1,0,1].forEach(function(n){ctx.beginPath();ctx.moveTo(X(n),p.t);ctx.lineTo(X(n),h-p.b);ctx.stroke();});
      ctx.setLineDash([]);
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p.l,Y(0));ctx.lineTo(w-p.r,Y(0));ctx.stroke();
      function f(tv){var v=1;for(var q=1;q<=K;q++)v+=2*Math.cos(q*om*tv);return v;}
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=700;i++){var tv=tmin+(tmax-tmin)*i/700;i?ctx.lineTo(X(tv),Y(f(tv))):ctx.moveTo(X(tv),Y(f(tv)));}
      ctx.stroke();
      var fc=f(tt);
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(X(tt),Y(fc),5.5,0,TAU);ctx.fill();
      ctx.strokeStyle=C("--faint");ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(X(tt),Y(fc));ctx.lineTo(X(tt),h-p.b);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"部分和 (最大 "+top+")",p.l+2,p.t+9,C("--muted"),"left");
      lab(ctx,"-T",X(-1),h-p.b+13,C("--muted"),"center");lab(ctx,"0",X(0),h-p.b+13,C("--muted"),"center");lab(ctx,"T",X(1),h-p.b+13,C("--muted"),"center");
      var near=Math.abs(tt-Math.round(tt))<0.04;
      out.innerHTML="t = <b>"+tt.toFixed(2)+"T</b> ／ 和 = <b>"+fc.toFixed(2)+"</b>（最大 "+top+"） ／ "+
        (near?'<span class="warn">t = nT: 全ベクトルの位相が揃い右向きに満場一致 → トゲが立つ</span>'
             :'各ベクトルがばらばらの向きを向き、ほぼ打ち消し合っている');
    }
    sK.input.addEventListener("input",draw);sT.input.addEventListener("input",draw);
    btn.addEventListener("click",function(){
      if(anim){cancelAnimationFrame(anim);anim=null;btn.setAttribute("aria-pressed","false");return;}
      btn.setAttribute("aria-pressed","true");var last=performance.now();
      (function loop(t){var dt=(t-last)/1000;last=t;var v=+sT.input.value+dt*(reduce?0:34);
        if(v>150)v=-150;sT.input.value=v;draw();anim=requestAnimationFrame(loop);})(last);
    });
    reg(cv,draw);
  };


  /* ---- 02: 等比級数の収束（安定条件の原型） ---- */
  REG.geom=function(el){
    head(el,"Series","r の大きさで運命が決まる");
    var cv=screen(el,260),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"|r|",30,130,70,1);var sa=slider(row,"r の角度",0,180,35,1);var out=readout(el);
    legend(el,[["var(--signal)","各項 r^k（矢印を継ぎ足す）"],["var(--alias)","合計 1/(1−r)"]]);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var rm=+sr.input.value/100,ang=(+sa.input.value)*Math.PI/180;sr.val.textContent=rm.toFixed(2);sa.val.textContent=(+sa.input.value)+"°";
      var conv=rm<1,N=conv?60:14;
      // 部分和を計算
      var px=0,py=0,pts=[[0,0]],tx=1,ty=0; // r^0=1 から
      for(var k=0;k<N;k++){px+=tx;py+=ty;pts.push([px,py]);
        var nx=tx*rm*Math.cos(ang)-ty*rm*Math.sin(ang),ny=tx*rm*Math.sin(ang)+ty*rm*Math.cos(ang);tx=nx;ty=ny;}
      var mx=1;for(var i=0;i<pts.length;i++)mx=Math.max(mx,Math.abs(pts[i][0]),Math.abs(pts[i][1]));
      // 左: 複素平面の螺旋
      var split=Math.min(h*1.05,w*0.48),cx=split/2+10,cy=h/2,S=(Math.min(split,h)/2-22)/mx;
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-split/2,cy);ctx.lineTo(cx+split/2-14,cy);ctx.moveTo(cx,20);ctx.lineTo(cx,h-20);ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;ctx.beginPath();
      for(var q=0;q<pts.length;q++){var X=cx+pts[q][0]*S,Y=cy-pts[q][1]*S;q?ctx.lineTo(X,Y):ctx.moveTo(X,Y);}
      ctx.stroke();
      ctx.fillStyle=C("--signal");for(var q2=0;q2<Math.min(pts.length,30);q2++){ctx.globalAlpha=0.8-0.6*q2/30;ctx.beginPath();ctx.arc(cx+pts[q2][0]*S,cy-pts[q2][1]*S,2.4,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;
      if(conv){ // 収束先 1/(1-r)
        var dr=1-rm*Math.cos(ang),di=-rm*Math.sin(ang),dn=dr*dr+di*di;
        var lx=dr/dn,ly=-di/dn;
        ctx.strokeStyle=C("--alias");ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+lx*S,cy-ly*S);ctx.stroke();
        ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(cx+lx*S,cy-ly*S,5,0,TAU);ctx.fill();
      }
      lab(ctx,conv?"渦を巻いて 1 点に収束":"外へ発散",cx,h-8,conv?C("--signal"):C("--alias"),"center");
      // 右: |部分和| の推移
      var p={l:split+34,r:14,t:16,b:22};
      var mags=[];for(var m=1;m<pts.length;m++)mags.push(Math.hypot(pts[m][0],pts[m][1]));
      var top=Math.max.apply(null,mags);
      grid(ctx,w,h,p);
      var Xn=function(i){return p.l+i/(mags.length-1)*(w-p.l-p.r);},Y=function(v){return h-p.b-v/top*(h-p.t-p.b)*0.92;};
      ctx.strokeStyle=conv?C("--signal"):C("--alias");ctx.lineWidth=2.5;ctx.beginPath();
      for(var i2=0;i2<mags.length;i2++){i2?ctx.lineTo(Xn(i2),Y(mags[i2])):ctx.moveTo(Xn(0),Y(mags[0]));}
      ctx.stroke();
      lab(ctx,"|部分和| の推移",p.l+2,p.t+9,C("--muted"),"left");lab(ctx,"項数 →",w-p.r,h-p.b+14,C("--muted"),"right");
      out.innerHTML="|r| = <b>"+rm.toFixed(2)+"</b> ／ "+(conv
        ? '<span class="ok">|r| &lt; 1: 各項がどんどん短くなり、渦を巻いて 1/(1−r) に収束（＝安定）</span>'
        : '<span class="warn">|r| ≥ 1: 各項が縮まないので合計が発散（＝IIR ならこれが発振）</span>');
    }
    sr.input.addEventListener("input",draw);sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 03: BIBO 安定性（余韻の総量） ---- */
  REG.bibo=function(el){
    head(el,"Stability","余韻の総量 Σ|h| が有限か");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sa=slider(row,"減衰率 a",70,112,90,1);var out=readout(el);
    legend(el,[["var(--signal)","h[n] = aⁿ（余韻）"],["var(--alias)","Σ|h| の積み上がり"]]);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var a=+sa.input.value/100;sa.val.textContent=a.toFixed(2);
      var N=60,hs=[],cum=[],c=0;
      for(var n=0;n<N;n++){var v=Math.pow(a,n);hs.push(v);c+=Math.abs(v);cum.push(c);}
      var stable=a<1;
      // 上段: h[n]
      var p1={l:30,r:14,t:12,b:16},hT=h*0.5;
      grid(ctx,w,hT,p1);
      var hmax=Math.max.apply(null,hs),b1=hT-p1.b,H1=b1-p1.t-4;
      var Xn=function(n){return p1.l+n/(N-1)*(w-p1.l-p1.r);};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p1.l,b1);ctx.lineTo(w-p1.r,b1);ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.fillStyle=C("--signal");ctx.lineWidth=1.6;
      for(var n2=0;n2<N;n2++){var y=b1-hs[n2]/hmax*H1;ctx.beginPath();ctx.moveTo(Xn(n2),b1);ctx.lineTo(Xn(n2),y);ctx.stroke();ctx.beginPath();ctx.arc(Xn(n2),y,2,0,TAU);ctx.fill();}
      lab(ctx,"h[n] = aⁿ（一発叩いた余韻）",p1.l+2,p1.t+9,C("--muted"),"left");
      // 下段: 累積
      ctx.save();ctx.translate(0,hT);
      var p2={l:30,r:14,t:10,b:20},hB=h-hT;
      grid(ctx,w,hB,p2);
      var cmax=cum[N-1],b2=hB-p2.b,H2=b2-p2.t-4;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(p2.l,b2);ctx.lineTo(w-p2.r,b2);ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.6;ctx.beginPath();
      for(var m=0;m<N;m++){var yy=b2-cum[m]/cmax*H2;m?ctx.lineTo(Xn(m),yy):ctx.moveTo(Xn(0),yy);}
      ctx.stroke();
      if(stable){var lim=1/(1-a);ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);ctx.lineWidth=1;
        var yl=b2-lim/cmax*H2;ctx.beginPath();ctx.moveTo(p2.l,yl);ctx.lineTo(w-p2.r,yl);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"頭打ち = 1/(1−a) = "+lim.toFixed(1),w-p2.r-4,yl-5,C("--faint"),"right");}
      lab(ctx,"Σ|h| の積み上がり",p2.l+2,p2.t+9,C("--muted"),"left");lab(ctx,"n",w-p2.r,b2+14,C("--muted"),"right");
      ctx.restore();
      out.innerHTML="a = <b>"+a.toFixed(2)+"</b> ／ "+(stable
        ? '<span class="ok">a &lt; 1: 余韻が縮むので総量が頭打ち（有限）→ BIBO 安定</span>'
        : '<span class="warn">a ≥ 1: 余韻が縮まないので総量が青天井 → 不安定（ハウリング）</span>');
    }
    sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 04: 直交性（回るものを1周足すと消える） ---- */
  REG.ortho=function(el){
    head(el,"Orthogonality","回るものを 1 周ぶん足すと消える");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sm=slider(row,"整数 m（回転数）",-4,4,2,1);var out=readout(el);
    legend(el,[["var(--signal)","各時刻の矢印 e^{jωm}"],["var(--alias)","全部足した結果"]]);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var m=+sm.input.value;sm.val.textContent="m = "+m;
      var N=36,sx=0,sy=0;
      var split=Math.min(h*1.05,w*0.46),cx=split/2+10,cy=h/2,R=Math.min(split,h)/2-22;
      unitcircle(ctx,cx,cy,R);
      for(var k=0;k<N;k++){var a=m*TAU*k/N;
        ctx.strokeStyle=C("--signal");ctx.globalAlpha=0.35;ctx.lineWidth=1.3;
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a),cy-R*Math.sin(a));ctx.stroke();
        ctx.globalAlpha=0.8;ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(cx+R*Math.cos(a),cy-R*Math.sin(a),2.4,0,TAU);ctx.fill();
        sx+=Math.cos(a);sy+=Math.sin(a);}
      ctx.globalAlpha=1;
      // 合計ベクトル（右側で首尾接続）
      var p={l:split+30,r:16,t:22,b:22},qw=w-p.l-p.r,qh=h-p.t-p.b;
      // 軌跡を先に計算して範囲からスケールを決める
      var tr=[[0,0]],ax=0,ay=0,minx=0,maxx=0,miny=0,maxy=0;
      for(var k2=0;k2<N;k2++){var a2=m*TAU*k2/N;ax+=Math.cos(a2);ay+=Math.sin(a2);tr.push([ax,ay]);
        minx=Math.min(minx,ax);maxx=Math.max(maxx,ax);miny=Math.min(miny,ay);maxy=Math.max(maxy,ay);}
      var spanx=Math.max(maxx-minx,0.6),spany=Math.max(maxy-miny,0.6);
      var S=Math.min(qw/spanx,qh/spany)*0.82;
      var qcx=p.l+qw/2-(minx+maxx)/2*S,qcy=p.t+qh/2+(miny+maxy)/2*S;
      ctx.strokeStyle=C("--grid");ctx.beginPath();ctx.moveTo(p.l,qcy);ctx.lineTo(w-p.r,qcy);ctx.moveTo(qcx,p.t);ctx.lineTo(qcx,h-p.b);ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;ctx.beginPath();
      for(var q3=0;q3<tr.length;q3++){var XX=qcx+tr[q3][0]*S,YY=qcy-tr[q3][1]*S;q3?ctx.lineTo(XX,YY):ctx.moveTo(XX,YY);}
      ctx.stroke();
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(qcx,qcy,3.5,0,TAU);ctx.fill();
      ctx.strokeStyle=C("--alias");ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(qcx,qcy);ctx.lineTo(qcx+sx*S,qcy-sy*S);ctx.stroke();
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(qcx+sx*S,qcy-sy*S,5,0,TAU);ctx.fill();
      lab(ctx,"矢印を順につないだ形",qcx,h-p.b+2,C("--muted"),"center");
      var mag=Math.hypot(sx,sy);
      out.innerHTML="m = <b>"+m+"</b> ／ 合計の長さ = <b>"+mag.toFixed(2)+"</b>（1 本ぶんは 1.00） ／ "+(m===0
        ? '<span class="warn">m = 0: 回らないので全部同じ向き → まっすぐ積み上がり N になる</span>'
        : '<span class="ok">m ≠ 0: ちょうど '+Math.abs(m)+' 周して元の位置に戻る → 合計 0</span>');
    }
    sm.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 05: ROC（オモリで収束させる） ---- */
  REG.roc=function(el){
    head(el,"ROC","オモリ r⁻ⁿ を掛けて収束させる");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sa=slider(row,"信号 a（aⁿu[n]）",50,160,120,1);
    var sr=slider(row,"オモリの強さ r",50,220,100,1);var out=readout(el);
    legend(el,[["var(--faint)","元の信号 aⁿ"],["var(--signal)","オモリ後 aⁿr⁻ⁿ"]]);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var a=+sa.input.value/100,r=+sr.input.value/100;sa.val.textContent=a.toFixed(2);sr.val.textContent=r.toFixed(2);
      var conv=r>a;
      // 左: z平面 ROC
      var split=Math.min(h*1.05,w*0.42),cx=split/2+8,cy=h/2,R=(Math.min(split,h)/2-22)/1.9;
      ctx.fillStyle=C("--signal-soft");ctx.beginPath();ctx.arc(cx,cy,R*1.85,0,TAU);ctx.fill();
      ctx.fillStyle=C("--screen");ctx.beginPath();ctx.arc(cx,cy,R*a,0,TAU);ctx.fill();
      ctx.strokeStyle=C("--alias");ctx.setLineDash([3,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,R*a,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,R*r,0,TAU);ctx.stroke();
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(cx+R*a,cy,4,0,TAU);ctx.fill();
      lab(ctx,"極 |z|=a",cx+R*a+6,cy-6,C("--alias"),"left");
      lab(ctx,"単位円",cx,cy-R-6,C("--muted"),"center");
      lab(ctx,"いまの r",cx,cy+R*r+13,C("--signal"),"center");
      lab(ctx,"ROC（青）= 収束する r の範囲",cx,h-8,C("--muted"),"center");
      // 右: 信号
      var p={l:26,r:14,t:16,b:20},ox=split+20,pw=w-ox-p.r,N=26;
      var raw=[],wt=[];for(var n=0;n<N;n++){raw.push(Math.pow(a,n));wt.push(Math.pow(a/r,n));}
      var mx=Math.max(Math.max.apply(null,raw),1.2);
      var b=h-p.b,H=b-p.t-4,Xn=function(n){return ox+n/(N-1)*pw;},Y=function(v){return b-Math.min(v,mx)/mx*H;};
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(ox,b);ctx.lineTo(ox+pw,b);ctx.stroke();
      ctx.strokeStyle=C("--faint");ctx.globalAlpha=.55;ctx.lineWidth=1.6;ctx.beginPath();
      for(var i=0;i<N;i++){i?ctx.lineTo(Xn(i),Y(raw[i])):ctx.moveTo(Xn(0),Y(raw[0]));}ctx.stroke();ctx.globalAlpha=1;
      ctx.strokeStyle=conv?C("--signal"):C("--alias");ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=2;
      for(var j=0;j<N;j++){ctx.beginPath();ctx.moveTo(Xn(j),b);ctx.lineTo(Xn(j),Y(wt[j]));ctx.stroke();ctx.beginPath();ctx.arc(Xn(j),Y(wt[j]),2.3,0,TAU);ctx.fill();}
      lab(ctx,"オモリ後の各項",ox+2,p.t+9,C("--muted"),"left");lab(ctx,"n",ox+pw,b+14,C("--muted"),"right");
      out.innerHTML="a = <b>"+a.toFixed(2)+"</b>, r = <b>"+r.toFixed(2)+"</b> ／ "+(conv
        ? '<span class="ok">r &gt; a: オモリが勝って各項が縮む → 和が収束（この r は ROC の中）</span>'
        : '<span class="warn">r ≤ a: オモリが足りず各項が縮まない → 発散（ROC の外）</span>')+
        (a>=1?' ／ 元の信号自体は発散（a≥1）だが、強いオモリを掛ければ Z 変換は存在する。':'');
    }
    sa.input.addEventListener("input",draw);sr.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 08: 周波数ワーピングとプリワーピング ---- */
  REG.warp=function(el){
    head(el,"Warping","無限のΩ軸を有限のω軸に折り畳む");
    var cv=screen(el,260),cc=cctx(cv);var row=ctrls(el);
    var sw=slider(row,"狙いのカットオフ ω_c",5,95,40,1);var out=readout(el);
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:44,r:16,t:16,b:26};ctx.clearRect(0,0,w,h);grid(ctx,w,h,p);
      var wc=(+sw.input.value/100)*Math.PI;sw.val.textContent=(+sw.input.value/100).toFixed(2)+"π";
      var Omax=8,T=1;
      var X=function(Om){return p.l+Om/Omax*(w-p.l-p.r);},Y=function(om){return h-p.b-om/Math.PI*(h-p.t-p.b);};
      // 曲線
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.6;ctx.beginPath();
      for(var i=0;i<=300;i++){var Om=i/300*Omax,om=2*Math.atan(Om*T/2);i?ctx.lineTo(X(Om),Y(om)):ctx.moveTo(X(Om),Y(om));}
      ctx.stroke();
      ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();
      for(var j=0;j<=100;j++){var Om2=j/100*Omax,om2=Om2*T;if(om2>Math.PI)break;j?ctx.lineTo(X(Om2),Y(om2)):ctx.moveTo(X(Om2),Y(om2));}
      ctx.stroke();ctx.setLineDash([]);
      // プリワープ点
      var Oc=2/T*Math.tan(wc/2);
      var linOc=wc/T;
      ctx.strokeStyle=C("--alias");ctx.setLineDash([3,3]);ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(p.l,Y(wc));ctx.lineTo(X(Math.min(Oc,Omax)),Y(wc));ctx.lineTo(X(Math.min(Oc,Omax)),h-p.b);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(X(Math.min(Oc,Omax)),Y(wc),6,0,TAU);ctx.fill();
      ctx.fillStyle=C("--faint");ctx.beginPath();ctx.arc(X(Math.min(linOc,Omax)),Y(wc),4,0,TAU);ctx.fill();
      lab(ctx,"π",p.l-6,Y(Math.PI)+4,C("--muted"),"right");lab(ctx,"0",p.l-6,h-p.b+4,C("--muted"),"right");
      lab(ctx,"ω（デジタル）",p.l+2,p.t+10,C("--muted"),"left");
      lab(ctx,"Ω（アナログ、無限に続く）",w-p.r,h-p.b+16,C("--muted"),"right");
      lab(ctx,"ω=2arctan(ΩT/2)",X(Omax*0.55),Y(2*Math.atan(Omax*0.55/2))-10,C("--signal"),"left");
      out.innerHTML="狙い ω_c = <b>"+(wc/Math.PI).toFixed(2)+"π</b> ／ プリワープ後のアナログ設計値 Ω_c = (2/T)tan(ω_c/2) = <b>"+Oc.toFixed(2)+"/T</b>"+
        " ／ 素直に Ω=ω/T とすると <b>"+linOc.toFixed(2)+"/T</b>（灰点）で、ズレは <b>"+((Oc/linOc-1)*100).toFixed(0)+"%</b>。"+
        (wc>2.2?' <span class="warn">高域ほど曲線が寝てズレが激増する。</span>':' 低域では曲線が直線に近く、ズレは小さい。');
    }
    sw.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---- 09: 量子化ビット数と極の飛散 ---- */
  REG.quant=function(el){
    head(el,"Quantization","ビット数を削ると極が飛ぶ");
    var cv=screen(el,270),cc=cctx(cv);var row=ctrls(el);
    var sb=slider(row,"係数のビット数",6,24,12,1);var out=readout(el);
    legend(el,[["var(--blue)","設計値の極"],["var(--alias)","直接形（8次のまま）"],["var(--signal)","SOS（2次×4段）"]]);
    // 8次バタワース(低カットオフ)相当の極（固定値）
    var poles=[[0.9243,0.2331],[0.9243,-0.2331],[0.8516,0.1806],[0.8516,-0.1806],
               [0.8036,0.1136],[0.8036,-0.1136],[0.7789,0.0386],[0.7789,-0.0386]];
    function polyFromRoots(rs){ // 実係数多項式（配列）を返す
      var c=[1,0];var re=[1],im=[0];
      var pr=[1],pi=[0];
      for(var i=0;i<rs.length;i++){
        var nr=[],ni=[];
        for(var k=0;k<=pr.length;k++){nr.push(0);ni.push(0);}
        for(var k2=0;k2<pr.length;k2++){
          nr[k2]+=pr[k2];ni[k2]+=pi[k2];
          nr[k2+1]-=pr[k2]*rs[i][0]-pi[k2]*rs[i][1];
          ni[k2+1]-=pr[k2]*rs[i][1]+pi[k2]*rs[i][0];
        }
        pr=nr;pi=ni;
      }
      return pr;
    }
    function quant(arr,bits){var mx=0;for(var i=0;i<arr.length;i++)mx=Math.max(mx,Math.abs(arr[i]));
      var sc=Math.pow(2,bits-1-Math.ceil(Math.log(mx+1e-30)/Math.LN2));
      return arr.map(function(v){return Math.round(v*sc)/sc;});}
    function rootsOfQuad(a1,a2){var D=a1*a1-4*a2;
      if(D<0){var re=-a1/2,im=Math.sqrt(-D)/2;return [[re,im],[re,-im]];}
      var s=Math.sqrt(D);return [[(-a1+s)/2,0],[(-a1-s)/2,0]];}
    // 多項式の根（Durand-Kerner、実係数8次）
    function rootsPoly(c){
      var n=c.length-1,zr=[],zi=[];
      for(var i=0;i<n;i++){zr.push(0.4*Math.cos(2*Math.PI*i/n+0.5)+0.9);zi.push(0.4*Math.sin(2*Math.PI*i/n+0.5));}
      for(var it=0;it<200;it++){
        for(var i2=0;i2<n;i2++){
          var pr=c[0],pi2=0;
          for(var k=1;k<=n;k++){var nr=pr*zr[i2]-pi2*zi[i2]+c[k],ni=pr*zi[i2]+pi2*zr[i2];pr=nr;pi2=ni;}
          var dr=1,di=0;
          for(var j=0;j<n;j++){if(j===i2)continue;
            var ar=zr[i2]-zr[j],ai=zi[i2]-zi[j];
            var tr=dr*ar-di*ai,ti=dr*ai+di*ar;dr=tr;di=ti;}
          var den=dr*dr+di*di;if(den<1e-18)continue;
          var qr=(pr*dr+pi2*di)/den,qi=(pi2*dr-pr*di)/den;
          zr[i2]-=qr;zi[i2]-=qi;
        }
      }
      var out=[];for(var m=0;m<n;m++)out.push([zr[m],zi[m]]);return out;
    }
    function draw(){var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var bits=+sb.input.value;sb.val.textContent=bits+" bit";
      var full=polyFromRoots(poles);          // a[0..8]
      var qa=quant(full,bits);
      var pd=rootsPoly(qa);
      // SOS: 各共役対ごとに2次係数を量子化
      var ps=[];
      for(var i=0;i<poles.length;i+=2){
        var re=poles[i][0],im=poles[i][1];
        var a1=-2*re,a2=re*re+im*im;
        var q=quant([1,a1,a2],bits);
        ps=ps.concat(rootsOfQuad(q[1],q[2]));
      }
      var lim=1.45,cx=w/2,cy=h/2,S=Math.min(w,h)/2/lim*0.86;
      var th=np(0);function np(x){return x;}
      ctx.strokeStyle=C("--line");ctx.setLineDash([4,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,S,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=C("--grid");ctx.beginPath();ctx.moveTo(cx-S*lim,cy);ctx.lineTo(cx+S*lim,cy);ctx.moveTo(cx,cy-S*lim);ctx.lineTo(cx,cy+S*lim);ctx.stroke();
      function plot(arr,color,shape,size){
        ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2.2;
        for(var i=0;i<arr.length;i++){var x=cx+arr[i][0]*S,y=cy-arr[i][1]*S;
          if(shape==="o"){ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.stroke();}
          else if(shape==="x"){ctx.beginPath();ctx.moveTo(x-size,y-size);ctx.lineTo(x+size,y+size);ctx.moveTo(x+size,y-size);ctx.lineTo(x-size,y+size);ctx.stroke();}
          else{ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x+size,y);ctx.moveTo(x,y-size);ctx.lineTo(x,y+size);ctx.stroke();}}
      }
      plot(poles,C("--blue"),"o",9);
      plot(ps,C("--signal"),"+",6);
      plot(pd,C("--alias"),"x",6);
      var bad=0,mxd=0;for(var i3=0;i3<pd.length;i3++){var mm=Math.hypot(pd[i3][0],pd[i3][1]);mxd=Math.max(mxd,mm);if(mm>1)bad++;}
      var badS=0,mxs=0;for(var i4=0;i4<ps.length;i4++){var ms=Math.hypot(ps[i4][0],ps[i4][1]);mxs=Math.max(mxs,ms);if(ms>1)badS++;}
      lab(ctx,"単位円",cx,cy-S-6,C("--muted"),"center");
      out.innerHTML=bits+" bit に丸めた結果 ／ <b>直接形</b>: 円外の極 <b class=\""+(bad?"warn":"ok")+"\">"+bad+" 個</b>"+
        "、最大 |p| = <b class=\""+(mxd>1?"warn":"ok")+"\">"+mxd.toFixed(3)+"</b>"+(bad?"（発振）":"")+
        " ／ <b>SOS</b>: 円外 <b class=\""+(badS?"warn":"ok")+"\">"+badS+" 個</b>、最大 |p| = <b class=\""+(mxs>1?"warn":"ok")+"\">"+mxs.toFixed(3)+"</b>"+
        (bad&&!badS?" — <span class=\"ok\">同じビット数でも SOS なら安全。ビット数を下げるほど直接形の |p| だけが暴れる。</span>":"");
    }
    sb.input.addEventListener("input",draw);reg(cv,draw);
  };

  function init(){document.querySelectorAll("[data-widget]").forEach(function(el){if(el.dataset.done)return;el.dataset.done="1";var fn=REG[el.getAttribute("data-widget")];if(fn){try{fn(el);}catch(e){}}});requestAnimationFrame(redrawAll);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
