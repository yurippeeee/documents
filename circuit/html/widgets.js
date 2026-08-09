/* 組み込み回路 — 章内インタラクティブ部品 */
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
  function checkbox(row,label,on){var c=mk("div","ctrl");
    c.innerHTML='<label style="cursor:pointer;justify-content:flex-start;align-items:center;gap:.45rem;'+
      'line-height:1.4"><input type="checkbox"'+(on?" checked":"")+
      ' style="flex:none;margin:0;accent-color:var(--signal)"><span>'+label+'</span></label>';
    row.appendChild(c);return c.querySelector("input");}
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
  function lab(ctx,t,x,y,c,a,sz){ctx.fillStyle=c;ctx.font=(sz||11)+"px "+C("--mono");ctx.textAlign=a||"left";
    ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function f(x,d){return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);}
  function hex(v,w){var s=(v>>>0).toString(16).toUpperCase();while(s.length<(w||0))s="0"+s;return "0x"+s;}
  function tbl(headers,rows,align){
    var h='<table style="border-collapse:collapse;width:100%"><tr>'+headers.map(function(t,i){
      return '<th style="padding:.25rem .7rem;text-align:'+((align&&align[i])||"left")+
        ';color:var(--muted);font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap">'+t+'</th>';}).join("")+'</tr>';
    rows.forEach(function(r){
      h+='<tr>'+r.map(function(v,i){return '<td style="padding:.22rem .7rem;text-align:'+
        ((align&&align[i])||"left")+';vertical-align:top">'+v+'</td>';}).join("")+'</tr>';});
    return h+'</table>';
  }
  function boxes(items){ // クリック可能なブロック列
    return '<div style="display:flex;flex-direction:column;gap:.25rem">'+items+'</div>';
  }
  function chart(cc,x0,x1,y0,y1,pad){
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
    var p={l:44,r:14,t:16,b:28};
    if(pad)for(var k in pad)p[k]=pad[k];
    ctx.clearRect(0,0,w,h);
    return {ctx:ctx,w:w,h:h,p:p,
      X:function(x){return p.l+(x-x0)/(x1-x0)*(w-p.l-p.r);},
      Y:function(y){return h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);},x0:x0,x1:x1,y0:y0,y1:y1};
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
  function dot(c,x,y,r,col,st){var ctx=c.ctx;ctx.beginPath();ctx.arc(c.X(x),c.Y(y),r,0,TAU);
    if(st){ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}
  function rrect(ctx,x,y,w,h,r){ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  var REG={};

  /* ---------- 共有: 選択式ウィジェットの土台 ---------- */
  /* items: [{k:キー, n:表示名, c:色トークン, ...}]  render(item)->html */
  function picker(el,items,render,opt){
    opt=opt||{};
    var wrap=mk("div","wscreen");wrap.style.padding=".55rem";
    var bar=mk("div");bar.style.cssText="display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.55rem";
    var body=mk("div");
    wrap.appendChild(bar);wrap.appendChild(body);el.appendChild(wrap);
    var _ro=el.querySelector(".readout");if(_ro)el.appendChild(_ro);   /* readout を末尾へ */
    var sel=opt.init||0;
    items.forEach(function(it,i){
      var b=mk("button","btn",it.n);b.style.fontSize=opt.small?".7rem":".74rem";
      b.addEventListener("click",function(){sel=i;draw();});
      bar.appendChild(b);
    });
    function draw(){
      Array.prototype.forEach.call(bar.children,function(b,i){
        var on=(i===sel),col=C(items[i].c||"--signal");
        b.style.background=on?col:"var(--panel)";
        b.style.color=on?"#fff":"var(--muted)";
        b.style.borderColor=on?col:"var(--line)";
      });
      body.innerHTML=render(items[sel],sel);
    }
    reg(null,draw);draw();
    return {redraw:draw,get:function(){return items[sel];}};
  }
  /* 見出し付きブロック */
  function blk(title,html,col){
    return '<div style="margin-bottom:.6rem"><div style="color:var('+(col||"--muted")+
      ');font-size:.82rem;font-weight:700;margin-bottom:.2rem">'+title+'</div>'+html+'</div>';
  }
  /* 箇条書き */
  function ul(items){
    return '<ul style="margin:.1rem 0 .1rem 1.1rem;padding:0;line-height:1.65">'+
      items.map(function(t){return '<li>'+t+'</li>';}).join("")+'</ul>';
  }
  /* タグ列 */
  function tags(items,col){
    return '<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin:.2rem 0">'+
      items.map(function(t){return '<span style="font-family:var(--mono);font-size:.7rem;'+
        'padding:.16rem .45rem;border:1px solid var('+(col||"--line")+');border-radius:5px;'+
        'color:var(--muted)">'+t+'</span>';}).join("")+'</div>';
  }
  /* 段階バー */
  function meter(label,v,max,col){
    var pc=Math.max(0,Math.min(100,100*v/max));
    return '<div style="display:flex;align-items:center;gap:.5rem;margin:.15rem 0">'+
      '<span style="flex:none;width:9rem;color:var(--muted);font-size:.8rem">'+label+'</span>'+
      '<span style="flex:1;height:9px;background:var(--screen);border-radius:5px;overflow:hidden;display:block">'+
      '<span style="display:block;height:100%;width:'+pc.toFixed(0)+'%;background:var('+(col||"--signal")+')"></span></span>'+
      '</div>';
  }

  /* ---------- 01: オームの法則と分圧 ---------- */
  REG.ohm=function(el){
    head(el,"Ohm / Divider","分圧は「負荷を繋ぐと崩れる」");
    var r=ctrls(el);
    var sV=slider(r,"電源 V1 [V]",1,24,5,0.1);
    var sR1=slider(r,"R1 [kΩ]",0.1,100,10,0.1);
    var sR2=slider(r,"R2 [kΩ]",0.1,100,10,0.1);
    var sRL=slider(r,"負荷 RL [kΩ]（∞ = 無負荷）",1,1000,1000,1);
    var cv=screen(el,220),cc=cctx(cv),out=readout(el);
    function draw(){
      var V=+sV.input.value,R1=+sR1.input.value*1e3,R2=+sR2.input.value*1e3,RL=+sRL.input.value*1e3;
      sV.val.textContent=f(V,1)+" V";sR1.val.textContent=f(R1/1e3,1)+" kΩ";
      sR2.val.textContent=f(R2/1e3,1)+" kΩ";
      sRL.val.textContent=(RL>=999e3?"∞（無負荷）":f(RL/1e3,0)+" kΩ");
      var Vo=V*R2/(R1+R2);                       /* 無負荷 */
      var R2p=(RL>=999e3)?R2:(R2*RL/(R2+RL));
      var Vl=V*R2p/(R1+R2p);                     /* 負荷あり */
      var Zout=R1*R2/(R1+R2);
      var Idiv=V/(R1+R2p);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var cx=Math.min(150,w*0.34),top=26,bot=h-26;
      /* 縦の回路 */
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(cx,bot);ctx.stroke();
      var yM=(top+bot)/2;
      function res(y0,y1,label,col){
        ctx.fillStyle=C("--panel");ctx.strokeStyle=col;ctx.lineWidth=1.8;
        rrect(ctx,cx-13,y0,26,y1-y0,4);ctx.fill();ctx.stroke();
        lab(ctx,label,cx+22,(y0+y1)/2+4,C("--ink"),"left",11);
      }
      res(top+16,yM-16,"R1 "+f(R1/1e3,1)+"k","--muted");
      res(yM+16,bot-16,"R2 "+f(R2/1e3,1)+"k","--muted");
      lab(ctx,"V1 = "+f(V,1)+" V",cx-20,top-8,C("--signal"),"right",11);
      lab(ctx,"GND",cx-20,bot+12,C("--faint"),"right",11);
      /* 出力ノード */
      ctx.beginPath();ctx.arc(cx,yM,4,0,TAU);ctx.fillStyle=C("--signal");ctx.fill();
      var xo=cx+120;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(cx,yM);ctx.lineTo(xo,yM);ctx.stroke();
      lab(ctx,"Vout",xo+6,yM-8,C("--signal"),"left",12);
      lab(ctx,f(Vl,3)+" V",xo+6,yM+12,C("--signal"),"left",13);
      if(RL<999e3){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;
        ctx.beginPath();ctx.moveTo(xo,yM);ctx.lineTo(xo,yM+40);ctx.stroke();
        ctx.fillStyle=C("--panel");rrect(ctx,xo-13,yM+40,26,34,4);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(xo,yM+74);ctx.lineTo(xo,bot);ctx.lineTo(cx,bot);ctx.stroke();
        lab(ctx,"RL "+f(RL/1e3,0)+"k",xo+20,yM+60,C("--alias"),"left",11);
      }
      /* 電圧バー */
      var bx=w-70;
      if(bx>xo+70){
        ctx.fillStyle=C("--screen");rrect(ctx,bx,top,26,bot-top,4);ctx.fill();
        var hh=(bot-top)*Math.min(1,Vl/V);
        ctx.fillStyle=C("--signal");rrect(ctx,bx,bot-hh,26,hh,4);ctx.fill();
        lab(ctx,"Vout/V1",bx+13,top-8,C("--muted"),"center",10);
        lab(ctx,f(100*Vl/V,1)+"%",bx+13,bot+13,C("--muted"),"center",10);
      }
      var drop=100*(Vo-Vl)/Vo;
      out.innerHTML='無負荷の分圧 <b>'+f(Vo,3)+' V</b>（V1·R2/(R1+R2)）'+
        ' ／ 負荷を繋ぐと <b>'+f(Vl,3)+' V</b>'+
        (drop>0.5?' ／ <span class="warn">'+f(drop,1)+' % 下がっている</span>':' ／ <span class="ok">ほぼ崩れていない</span>')+
        ' ／ 出力インピーダンス <b>R1∥R2 = '+f(Zout/1e3,2)+' kΩ</b>'+
        ' ／ 分圧に流れる電流 <b>'+f(Idiv*1e6,1)+' µA</b>（常時消費）'+
        ' ／ <b>負荷抵抗が出力インピーダンスの 100 倍以上ないと、分圧は使えない</b>';
    }
    [sV,sR1,sR2,sRL].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 02: コンデンサのインピーダンス ---------- */
  REG.capz=function(el){
    head(el,"Capacitor Z","理想のコンデンサは存在しない");
    var r=ctrls(el);
    var sC=slider(r,"容量 C",-2,2,0,0.1);            /* log10(µF) */
    var sE=slider(r,"ESR [mΩ]",1,500,10,1);
    var sL=slider(r,"ESL [nH]",0.2,10,1.0,0.1);
    var cv=screen(el,260),cc=cctx(cv),out=readout(el);
    function draw(){
      var Cu=Math.pow(10,+sC.input.value),Cf=Cu*1e-6;
      var ESR=+sE.input.value*1e-3,ESL=+sL.input.value*1e-9;
      sC.val.textContent=(Cu<1?f(Cu*1000,0)+" nF":f(Cu,2)+" µF");
      sE.val.textContent=f(ESR*1e3,0)+" mΩ";sL.val.textContent=f(ESL*1e9,1)+" nH";
      var srf=1/(TAU*Math.sqrt(ESL*Cf));
      var c=chart(cc,3,10,-3,3,{l:56,b:44,t:22});   /* log10 f : 1kHz-10GHz, log10 Z */
      grid(c,6);axis(c);
      var ctx=c.ctx;
      /* 目盛 */
      for(var e=3;e<=10;e++){lab(ctx,(e<6?Math.pow(10,e-3)+"k":e<9?Math.pow(10,e-6)+"M":Math.pow(10,e-9)+"G"),c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);}
      var ZU=["1 mΩ","10 mΩ","100 mΩ","1 Ω","10 Ω","100 Ω","1 kΩ"];
      for(var q=-3;q<=3;q++){lab(ctx,ZU[q+3],c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);}
      lab(ctx,"周波数 [Hz]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* 理想容量 / ESL / 合成 */
      var Pi=[],Pl=[],Pt=[];
      for(var i=0;i<=200;i++){
        var lf=3+7*i/200,fq=Math.pow(10,lf),wv=TAU*fq;
        var zc=1/(wv*Cf),zl=wv*ESL;
        var x=zl-zc,z=Math.sqrt(ESR*ESR+x*x);
        Pi.push([lf,Math.log10(zc)]);Pl.push([lf,Math.log10(zl)]);Pt.push([lf,Math.log10(z)]);
      }
      ctx.save();ctx.beginPath();ctx.rect(c.p.l,c.p.t,c.w-c.p.l-c.p.r,c.h-c.p.t-c.p.b);ctx.clip();
      line(c,Pi,C("--faint"),1.3,[4,4]);
      line(c,Pl,C("--faint"),1.3,[4,4]);
      line(c,Pt,C("--signal"),2.6);
      ctx.restore();
      /* ESR 線 */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;ctx.setLineDash([2,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(Math.log10(ESR)));ctx.lineTo(c.w-c.p.r,c.Y(Math.log10(ESR)));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"ESR",c.w-c.p.r-4,c.Y(Math.log10(ESR))-5,C("--alias"),"right",10);
      /* SRF */
      var xs=c.X(Math.log10(srf));
      if(xs>c.p.l&&xs<c.w-c.p.r){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(xs,c.p.t);ctx.lineTo(xs,c.h-c.p.b);ctx.stroke();
        lab(ctx,"SRF",xs+4,c.p.t+12,C("--alias"),"left",10);
      }
      lab(ctx,"容量性 1/ωC",c.p.l+6,c.p.t+12,C("--faint"),"left",10);
      lab(ctx,"誘導性 ωL",c.w-c.p.r-6,c.p.t+12,C("--faint"),"right",10);
      var fs=srf<1e6?f(srf/1e3,1)+" kHz":srf<1e9?f(srf/1e6,1)+" MHz":f(srf/1e9,2)+" GHz";
      out.innerHTML='自己共振周波数 <b>SRF = 1/(2π√(L·C)) = '+fs+'</b>'+
        ' ／ SRF での最小インピーダンスは <b>ESR = '+f(ESR*1e3,0)+' mΩ</b>'+
        ' ／ <b>SRF より上ではインダクタになる</b>——容量を増やしても高周波は下がらない'+
        ' ／ ESL は主に<b>パッケージと実装（ビア・パターン）</b>で決まるので、'+
        '<b>小さいサイズを複数個並べる</b>のが高周波では効く';
    }
    [sC,sE,sL].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 02: R / L / C のインピーダンス比較 ---------- */
  REG.rlcz=function(el){
    head(el,"R / L / C","周波数に対する振る舞いの違い");
    var r=ctrls(el);
    var sR=slider(r,"R [Ω]",1,1000,100,1);
    var sL=slider(r,"L [µH]",0.1,1000,10,0.1);
    var sC=slider(r,"C [nF]",0.1,10000,100,0.1);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    function draw(){
      var R=+sR.input.value,L=+sL.input.value*1e-6,Cf=+sC.input.value*1e-9;
      sR.val.textContent=f(R,0)+" Ω";sL.val.textContent=f(L*1e6,1)+" µH";
      sC.val.textContent=(Cf*1e9<1000?f(Cf*1e9,1)+" nF":f(Cf*1e6,2)+" µF");
      var c=chart(cc,1,9,-2,5,{l:56,b:44,t:26});
      grid(c,7);axis(c);var ctx=c.ctx;
      for(var e=1;e<=9;e+=1){var t=e<3?Math.pow(10,e)+"":e<6?Math.pow(10,e-3)+"k":e<9?Math.pow(10,e-6)+"M":"1G";
        lab(ctx,t,c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);}
      var ZU2=["10 mΩ","100 mΩ","1 Ω","10 Ω","100 Ω","1 kΩ","10 kΩ","100 kΩ"];
      for(var q=-2;q<=5;q++)lab(ctx,ZU2[q+2],c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      lab(ctx,"周波数 [Hz]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      lab(ctx,"|Z|",c.p.l-6,c.p.t-8,C("--muted"),"right",10);
      var PR=[],PL=[],PC=[];
      for(var i=0;i<=200;i++){var lf=1+8*i/200,wv=TAU*Math.pow(10,lf);
        PR.push([lf,Math.log10(R)]);PL.push([lf,Math.log10(wv*L)]);PC.push([lf,Math.log10(1/(wv*Cf))]);}
      line(c,PR,C("--muted"),2.2);
      line(c,PL,C("--blue"),2.4);
      line(c,PC,C("--signal"),2.4);
      lab(ctx,"R（一定）",c.p.l+6,c.Y(Math.log10(R))-6,C("--muted"),"left",11);
      lab(ctx,"L：ωL（+20dB/dec）",c.w-c.p.r-6,c.h-c.p.b-8,C("--blue"),"right",11);
      lab(ctx,"C：1/ωC（−20dB/dec）",c.p.l+6,c.h-c.p.b-8,C("--signal"),"left",11);
      var f0=1/(TAU*Math.sqrt(L*Cf));
      out.innerHTML='<b>R は周波数に無関係、L は上がるほど大きく、C は上がるほど小さい。</b>'+
        ' ／ L と C が等しくなる周波数 <b>1/(2π√LC) = '+(f0<1e6?f(f0/1e3,1)+" kHz":f(f0/1e6,2)+" MHz")+'</b>'+
        '（直列なら共振で Z が最小、並列なら最大）'+
        ' ／ <b>「高周波を GND に落としたい」なら C、「高周波を通したくない」なら L</b>——'+
        'フィルタの発想はすべてこの傾きの違いから来る';
    }
    [sR,sL,sC].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 03: RC 過渡応答 ---------- */
  REG.rcstep=function(el){
    head(el,"RC Step","時定数 τ = RC がすべてを決める");
    var r=ctrls(el);
    var sR=slider(r,"R [kΩ]",0.1,100,10,0.1);
    var sC=slider(r,"C [nF]",0.1,1000,100,0.1);
    var sN=slider(r,"必要な確度 [bit]",4,16,12,1);
    var cv=screen(el,230),cc=cctx(cv),out=readout(el);
    function draw(){
      var R=+sR.input.value*1e3,Cf=+sC.input.value*1e-9,N=+sN.input.value;
      var tau=R*Cf;
      sR.val.textContent=f(R/1e3,1)+" kΩ";sC.val.textContent=f(Cf*1e9,1)+" nF";
      sN.val.textContent=N+" bit";
      var T=6*tau;
      var c=chart(cc,0,T*1e3,0,105,{l:46,b:30,t:18});
      grid(c,5);axis(c);var ctx=c.ctx;
      for(var i=0;i<=6;i++){var x=i*tau*1e3;
        ctx.strokeStyle=C("--grid");ctx.beginPath();ctx.moveTo(c.X(x),c.p.t);ctx.lineTo(c.X(x),c.h-c.p.b);ctx.stroke();
        lab(ctx,i+"τ",c.X(x),c.h-c.p.b+16,C("--faint"),"center",10);}
      for(var q=0;q<=100;q+=25)lab(ctx,q+"%",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      var P=[];for(var k=0;k<=300;k++){var t=T*k/300;P.push([t*1e3,100*(1-Math.exp(-t/tau))]);}
      line(c,P,C("--signal"),2.6);
      /* 目標帯 */
      var need=100*(1-Math.pow(2,-(N+1)));
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(need));ctx.lineTo(c.w-c.p.r,c.Y(need));ctx.stroke();ctx.setLineDash([]);
      var ts=tau*Math.log(Math.pow(2,N+1));
      var xs=c.X(ts*1e3);
      if(xs<c.w-c.p.r){ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(xs,c.p.t);ctx.lineTo(xs,c.h-c.p.b);ctx.stroke();
        lab(ctx,N+" bit 整定",xs+4,c.p.t+12,C("--alias"),"left",10);}
      lab(ctx,"63.2%",c.X(tau*1e3)+6,c.Y(63.2)+16,C("--muted"),"left",10);
      var fc=1/(TAU*R*Cf),tr=2.2*tau;
      out.innerHTML='τ = R·C = <b>'+(tau<1e-3?f(tau*1e6,1)+" µs":f(tau*1e3,3)+" ms")+'</b>'+
        ' ／ 1τ で <b>63.2 %</b>、3τ で 95.0 %、5τ で 99.3 %'+
        ' ／ <b>'+N+' bit（½LSB）まで整定するのに '+f(ts/tau,1)+'τ = '+
        (ts<1e-3?f(ts*1e6,1)+" µs":f(ts*1e3,3)+" ms")+'</b>'+
        ' ／ 立ち上がり時間 t<sub>r</sub>(10-90%) = 2.2τ = '+(tr<1e-3?f(tr*1e6,1)+" µs":f(tr*1e3,3)+" ms")+
        ' ／ カットオフ f<sub>c</sub> = 1/(2πRC) = '+(fc<1e3?f(fc,1)+" Hz":fc<1e6?f(fc/1e3,2)+" kHz":f(fc/1e6,2)+" MHz")+
        ' ／ <b>t<sub>r</sub> × f<sub>c</sub> ≈ 0.35</b> は常に成り立つ';
    }
    [sR,sC,sN].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 03: フィルタ特性 ---------- */
  REG.filter=function(el){
    head(el,"Filter Response","次数と特性で「切れ味」が変わる");
    var r=ctrls(el);
    var ty=select(r,"特性",["バターワース（平坦）","チェビシェフ 0.5dB（急峻）","ベッセル（波形保持）"]);
    var sN=slider(r,"次数",1,8,2,1);
    var sF=slider(r,"カットオフ f_c [kHz]",0.1,100,10,0.1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function mag(ty,n,x){ /* x = f/fc, 振幅比 */
      if(ty===0)return 1/Math.sqrt(1+Math.pow(x,2*n));
      if(ty===1){ /* Chebyshev I, 0.5 dB ripple */
        var eps=Math.sqrt(Math.pow(10,0.05)-1),Tn;
        if(x<=1)Tn=Math.cos(n*Math.acos(Math.min(1,Math.max(-1,x))));
        else Tn=Math.cosh(n*Math.acosh(x));
        return 1/Math.sqrt(1+eps*eps*Tn*Tn);
      }
      /* Bessel: 群遅延平坦。ここでは実効的に -3dB を fc に正規化した近似 */
      var a=Math.pow(x,2)*(1+0.36*n);
      return 1/Math.sqrt(1+Math.pow(a,n*0.9));
    }
    function draw(){
      var t=+ty.value,n=+sN.input.value,fc=+sF.input.value*1e3;
      sN.val.textContent=n+" 次";sF.val.textContent=(fc<1e3?f(fc,0)+" Hz":f(fc/1e3,1)+" kHz");
      var c=chart(cc,-2,2,-80,10,{l:56,b:32,t:20});   /* log10(f/fc) */
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var e=-2;e<=2;e++)lab(ctx,(e===0?"f_c":"10^"+e+"·f_c"),c.X(e),c.h-c.p.b+16,C("--faint"),e===-2?"left":e===2?"right":"center",10);
      for(var q=-80;q<=0;q+=20)lab(ctx,q+" dB",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      /* -3dB 線 */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.1;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(-3));ctx.lineTo(c.w-c.p.r,c.Y(-3));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"−3 dB",c.p.l+4,c.Y(-3)-4,C("--alias"),"left",10);
      /* 比較用 1 次 */
      var P1=[];for(var i=0;i<=240;i++){var lx=-2+4*i/240,x=Math.pow(10,lx);
        P1.push([lx,Math.max(-80,20*Math.log10(mag(0,1,x)))]);}
      line(c,P1,C("--faint"),1.3,[4,4]);
      var P=[];for(var j=0;j<=240;j++){var lx2=-2+4*j/240,x2=Math.pow(10,lx2);
        P.push([lx2,Math.max(-80,20*Math.log10(mag(t,n,x2)))]);}
      line(c,P,C("--signal"),2.6);
      lab(ctx,"破線 = 1 次（比較）",c.p.l+8,c.h-c.p.b-8,C("--faint"),"left",10);
      var att10=-20*Math.log10(mag(t,n,10));
      var names=["バターワース","チェビシェフ 0.5 dB","ベッセル"];
      var desc=["通過域が最も平坦。汎用の第一選択。",
                "同じ次数で最も急峻。ただし通過域にリプルがあり、ステップ応答のリンギングが大きい。",
                "群遅延が平坦なので波形が崩れない。減衰は最も緩やか。"];
      out.innerHTML='<b>'+names[t]+' '+n+' 次</b> ／ 阻止域の傾きは <b>−'+(20*n)+' dB/dec（= −'+(6*n)+' dB/oct）</b>'+
        ' ／ f<sub>c</sub> の 10 倍で <b>−'+f(att10,1)+' dB</b>'+
        ' ／ '+desc[t]+
        ' ／ <b>次数を 1 つ上げると 20 dB/dec ずつ急になる</b>が、部品点数と位相回りも増える'+
        ' ／ アンチエイリアス用途では「必要な阻止量 ÷ 20 dB」から次数を逆算する';
    }
    ty.addEventListener("change",draw);
    [sN,sF].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 03: RLC 共振とリンギング ---------- */
  REG.rlcring=function(el){
    head(el,"RLC Ringing","Q が高いほど「鳴く」");
    var r=ctrls(el);
    var sL=slider(r,"L [µH]",0.1,100,10,0.1);
    var sC=slider(r,"C [nF]",0.1,1000,100,0.1);
    var sR=slider(r,"直列 R [Ω]",0.1,200,5,0.1);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    function draw(){
      var L=+sL.input.value*1e-6,Cf=+sC.input.value*1e-9,R=+sR.input.value;
      sL.val.textContent=f(L*1e6,1)+" µH";sC.val.textContent=f(Cf*1e9,1)+" nF";sR.val.textContent=f(R,1)+" Ω";
      var w0=1/Math.sqrt(L*Cf),f0=w0/TAU,Q=(1/R)*Math.sqrt(L/Cf),z=1/(2*Q);
      var T=12/(z*w0);T=Math.min(T,40/w0*Math.max(1,Q));
      var c=chart(cc,0,T*1e6,-20,220,{l:50,b:44,t:20});
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var q=0;q<=200;q+=50)lab(ctx,q+"%",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      for(var e=0;e<=4;e++){var xt=c.x1*e/4;
        lab(ctx,f(xt,xt<10?2:1),c.X(xt),c.h-c.p.b+16,C("--faint"),e===4?"right":"center",10);}
      lab(ctx,"時間 [µs]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(100));ctx.lineTo(c.w-c.p.r,c.Y(100));ctx.stroke();ctx.setLineDash([]);
      var P=[],peak=0;
      for(var i=0;i<=400;i++){
        var t=T*i/400,v;
        if(z<1){var wd=w0*Math.sqrt(1-z*z);
          v=1-Math.exp(-z*w0*t)*(Math.cos(wd*t)+z/Math.sqrt(1-z*z)*Math.sin(wd*t));}
        else if(Math.abs(z-1)<1e-6){v=1-Math.exp(-w0*t)*(1+w0*t);}
        else{var s1=-w0*(z-Math.sqrt(z*z-1)),s2=-w0*(z+Math.sqrt(z*z-1));
          v=1-(s1*Math.exp(s2*t)-s2*Math.exp(s1*t))/(s1-s2);}
        peak=Math.max(peak,v);P.push([t*1e6,v*100]);
      }
      line(c,P,C("--signal"),2.4);
      var os=Math.max(0,(peak-1)*100);
      var kind=z<0.4?"強くリンギングする":z<0.6?"やや振動する":z<0.9?"ほぼ最適":z<1.05?"臨界制動":"過制動（遅い）";
      out.innerHTML='共振周波数 <b>f<sub>0</sub> = 1/(2π√LC) = '+(f0<1e6?f(f0/1e3,1)+" kHz":f(f0/1e6,2)+" MHz")+'</b>'+
        ' ／ <b>Q = (1/R)√(L/C) = '+f(Q,2)+'</b> ／ 減衰係数 ζ = 1/(2Q) = <b>'+f(z,3)+'</b>'+
        ' ／ オーバーシュート <b>'+f(os,1)+' %</b>（'+kind+'）'+
        ' ／ <b>ζ = 0.707（Q = 0.707）で周波数特性が最も平坦</b>、ζ = 1 で振動しない最速'+
        ' ／ 基板上では L は<b>配線のインダクタンス</b>、C は<b>デカップリング</b>——'+
        'つまり<b>この振動は意図せず必ず存在する</b>。抵抗（ダンピング）を入れると収まる';
    }
    [sL,sC,sR].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 04: ダイオード I-V ---------- */
  REG.diode=function(el){
    head(el,"Diode I-V","指数関数——60 mV で 10 倍");
    var r=ctrls(el);
    var ty=select(r,"種類",["シリコン（一般整流）","ショットキー","LED（赤）","LED（白・青）"]);
    var sT=slider(r,"温度 [℃]",-40,125,25,1);
    var sI=slider(r,"動作電流 [mA]",0.01,100,10,0.01);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    var DEV=[{n:"Si",Is:1e-12,nn:1.0,tc:-2.0,vmax:1.2},
             {n:"Schottky",Is:2e-7,nn:1.05,tc:-1.3,vmax:0.7},
             {n:"LED 赤",Is:1e-20,nn:1.8,tc:-2.0,vmax:2.6},
             {n:"LED 白",Is:1e-32,nn:2.0,tc:-4.0,vmax:4.0}];
    function draw(){
      var d0=DEV[+ty.value],Tc=+sT.input.value,Iop=+sI.input.value*1e-3;
      sT.val.textContent=Tc+" ℃";sI.val.textContent=(Iop*1e3<1?f(Iop*1e6,0)+" µA":f(Iop*1e3,2)+" mA");
      var VT=8.617e-5*(Tc+273.15);
      function V(I){return d0.nn*VT*Math.log(I/d0.Is+1);}
      var Vop=V(Iop);
      var c=chart(cc,0,d0.vmax,0,110,{l:50,b:30,t:18});
      grid(c,5);axis(c);var ctx=c.ctx;
      for(var q=0;q<=100;q+=25)lab(ctx,q+" mA",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      for(var e=0;e<=5;e++){var xv=d0.vmax*e/5;lab(ctx,f(xv,2)+" V",c.X(xv),c.h-c.p.b+16,C("--faint"),e===5?"right":e===0?"left":"center",10);}
      /* 25℃ 基準（比較） */
      var VT25=8.617e-5*298.15;
      var P25=[];for(var i=1;i<=300;i++){var I=100e-3*Math.pow(i/300,2.2);
        P25.push([d0.nn*VT25*Math.log(I/d0.Is+1),I*1e3]);}
      line(c,P25,C("--faint"),1.3,[4,4]);
      var P=[];for(var j=1;j<=300;j++){var I2=100e-3*Math.pow(j/300,2.2);P.push([V(I2),I2*1e3]);}
      line(c,P,C("--signal"),2.6);
      dot(c,Vop,Iop*1e3,4.5,C("--alias"));
      lab(ctx,"動作点 "+f(Vop,3)+" V",Math.min(c.X(Vop)+8,c.w-c.p.r-90),c.Y(Iop*1e3)-8,C("--alias"),"left",11);
      lab(ctx,"25 ℃（比較）",c.w-c.p.r-6,c.p.t+12,C("--faint"),"right",10);
      var V10=V(Iop*10)-Vop, dV=(Tc-25)*d0.tc*1e-3;
      var rd=d0.nn*VT/Iop;
      out.innerHTML='順方向電圧 <b>V<sub>F</sub> = '+f(Vop,3)+' V</b>（'+f(Iop*1e3,2)+' mA、'+Tc+' ℃）'+
        ' ／ 電流を <b>10 倍にしても V<sub>F</sub> は '+f(V10*1e3,0)+' mV しか増えない</b>'+
        '（n·V<sub>T</sub>·ln10、n = '+f(d0.nn,2)+'）'+
        ' ／ 25 ℃ からの温度変化で <b>'+(dV>=0?"+":"")+f(dV*1e3,0)+' mV</b>（約 '+f(d0.tc,1)+' mV/℃）'+
        ' ／ 微分抵抗 r<sub>d</sub> = n·V<sub>T</sub>/I = <b>'+f(rd,2)+' Ω</b>'+
        ' ／ <b>この急峻さゆえに、ダイオードや LED を並列接続してはいけない</b>——'+
        'わずかな V<sub>F</sub> 差で電流が一方に集中し、熱暴走する';
    }
    ty.addEventListener("change",draw);
    [sT,sI].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 05: MOSFET 特性 ---------- */
  REG.mosfet=function(el){
    head(el,"MOSFET","線形領域＝抵抗、飽和領域＝定電流");
    var r=ctrls(el);
    var sVg=slider(r,"V_GS [V]",0,12,5,0.1);
    var sVt=slider(r,"V_th [V]",0.5,4,2,0.1);
    var sK=slider(r,"K = µCox·W/L [A/V²]",0.1,20,4,0.1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var Vg=+sVg.input.value,Vt=+sVt.input.value,K=+sK.input.value;
      sVg.val.textContent=f(Vg,1)+" V";sVt.val.textContent=f(Vt,1)+" V";sK.val.textContent=f(K,1);
      var Vov=Vg-Vt;
      function Id(vgs,vds){var ov=vgs-vt0(vgs);if(ov<=0)return 0;
        return vds<ov?K*(ov*vds-vds*vds/2):K*ov*ov/2;}
      function vt0(){return Vt;}
      var c=chart(cc,0,10,0,Math.max(1,K*Math.pow(Math.max(0.1,12-Vt),2)/2*0.35),{l:58,b:44,t:26});
      grid(c,5);axis(c);var ctx=c.ctx;
      lab(ctx,"V_DS [V]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      lab(ctx,"I_D [A]",c.p.l-6,c.p.t-8,C("--muted"),"right",10);
      for(var e=0;e<=10;e+=2)lab(ctx,e+"",c.X(e),c.h-c.p.b+16,C("--faint"),e===10?"right":"center",10);
      for(var q=0;q<=4;q++){var yv=c.y1*q/4;lab(ctx,f(yv,1),c.p.l-6,c.Y(yv)+4,C("--faint"),"right",10);}
      /* 複数の VGS 曲線 */
      var lst=[Vt+1,Vt+2,Vt+3,Vt+4];
      lst.forEach(function(vg,k){
        if(vg>12)return;
        var P=[];for(var i=0;i<=200;i++){var vd=10*i/200;P.push([vd,Id(vg,vd)]);}
        line(c,P,C("--faint"),1.3);
        lab(ctx,"V_GS="+f(vg,1),c.w-c.p.r-4,Math.max(c.p.t+10,Math.min(c.h-c.p.b-22,c.Y(Id(vg,10))-4)),C("--faint"),"right",9);
      });
      var PP=[];for(var j=0;j<=200;j++){var vd2=10*j/200;PP.push([vd2,Id(Vg,vd2)]);}
      line(c,PP,C("--signal"),2.8);
      /* 領域境界 V_DS = V_ov */
      if(Vov>0&&Vov<10){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.3;ctx.setLineDash([4,4]);
        var PB=[];for(var m=0;m<=60;m++){var vv=Vov*m/60;PB.push([vv,K*vv*vv/2]);}
        line(c,PB,C("--alias"),1.4,[4,4]);ctx.setLineDash([]);
        lab(ctx,"V_DS = V_GS − V_th（境界）",c.X(Vov)+6,c.p.t+14,C("--alias"),"left",10);
      }
      var xb2=Math.max(c.p.l+70,Math.min(c.w-c.p.r-80,c.X(Math.max(0.4,Math.min(9.6,Vov)))));
      lab(ctx,"← 線形",xb2-6,c.p.t+32,C("--muted"),"right",10);
      lab(ctx,"飽和 →",xb2+6,c.p.t+32,C("--muted"),"left",10);
      var Idsat=Vov>0?K*Vov*Vov/2:0, Ron=Vov>0?1/(K*Vov):Infinity;
      out.innerHTML='オーバードライブ <b>V<sub>ov</sub> = V<sub>GS</sub> − V<sub>th</sub> = '+f(Vov,2)+' V</b>'+
        (Vov<=0?' ／ <span class="warn">閾値以下——OFF</span>':
        ' ／ 飽和電流 I<sub>D(sat)</sub> = K·V<sub>ov</sub>²/2 = <b>'+f(Idsat,2)+' A</b>'+
        ' ／ 線形領域のオン抵抗 R<sub>DS(on)</sub> ≈ 1/(K·V<sub>ov</sub>) = <b>'+f(Ron*1000,1)+' mΩ</b>')+
        ' ／ <b>V<sub>GS</sub> を上げるほどオン抵抗が下がる</b>——'+
        'これが「3.3 V でロジックレベル品を使わないと熱くなる」理由'+
        ' ／ <b>注意: MOSFET の「飽和」は定電流領域を指す。バイポーラの「飽和」（完全 ON）とは逆の意味である</b>';
    }
    [sVg,sVt,sK].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 05: スイッチング波形と損失 ---------- */
  REG.mosswitch=function(el){
    head(el,"Switching Loss","ミラープラトーの間に熱が出る");
    var r=ctrls(el);
    var sQ=slider(r,"総ゲート電荷 Q_g [nC]",2,200,30,1);
    var sIg=slider(r,"ドライブ電流 [mA]",1,2000,200,1);
    var sV=slider(r,"V_DS [V]",5,400,48,1);
    var sI=slider(r,"負荷電流 [A]",0.1,30,5,0.1);
    var sF=slider(r,"スイッチング周波数 [kHz]",10,2000,200,10);
    var sRon=slider(r,"R_DS(on) [mΩ]",1,200,20,1);
    var cv=screen(el,230),cc=cctx(cv),out=readout(el);
    function draw(){
      var Qg=+sQ.input.value*1e-9,Ig=+sIg.input.value*1e-3,V=+sV.input.value,
          I=+sI.input.value,fs=+sF.input.value*1e3,Ron=+sRon.input.value*1e-3;
      sQ.val.textContent=f(Qg*1e9,0)+" nC";sIg.val.textContent=f(Ig*1e3,0)+" mA";
      sV.val.textContent=f(V,0)+" V";sI.val.textContent=f(I,1)+" A";
      sF.val.textContent=f(fs/1e3,0)+" kHz";sRon.val.textContent=f(Ron*1e3,0)+" mΩ";
      /* 概算: Qgd ≈ 0.3 Qg がミラー期間 */
      var Qgd=0.3*Qg, tsw=Qgd/Ig;              /* 片エッジの遷移時間 */
      var Psw=0.5*V*I*(2*tsw)*fs;
      var Pcond=I*I*Ron*0.5;                    /* デューティ 50 % 想定 */
      var Pgate=Qg*10*fs;
      var Ptot=Psw+Pcond+Pgate;
      /* 波形 */
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=54,padT=16,padB=26,rows=3,rh=(h-padT-padB)/rows;
      var T=1/fs, tv=Math.max(tsw,T*0.004);
      function X(t){return padL+t/T*(w-padL-14);}
      var names=["V_GS","V_DS","I_D"];
      for(var k=0;k<rows;k++){
        var y0=padT+k*rh,y1=y0+rh-8;
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(padL,y1);ctx.lineTo(w-14,y1);ctx.stroke();
        lab(ctx,names[k],padL-6,(y0+y1)/2+4,C("--muted"),"right",11);
        ctx.strokeStyle=C(k===0?"--blue":k===1?"--signal":"--alias");ctx.lineWidth=2.2;
        ctx.beginPath();
        var t0=T*0.08,t1=T*0.5;
        function yv(v){return y1-(y1-y0)*v;}
        if(k===0){ /* VGS: 上昇→プラトー→上昇 */
          ctx.moveTo(X(0),yv(0));ctx.lineTo(X(t0),yv(0));
          ctx.lineTo(X(t0+tv*0.4),yv(0.45));ctx.lineTo(X(t0+tv*1.4),yv(0.5));
          ctx.lineTo(X(t0+tv*1.9),yv(1));ctx.lineTo(X(t1),yv(1));
          ctx.lineTo(X(t1+tv*0.5),yv(0.5));ctx.lineTo(X(t1+tv*1.5),yv(0.45));
          ctx.lineTo(X(t1+tv*1.9),yv(0));ctx.lineTo(X(T),yv(0));
        }else if(k===1){ /* VDS */
          ctx.moveTo(X(0),yv(1));ctx.lineTo(X(t0+tv*0.4),yv(1));
          ctx.lineTo(X(t0+tv*1.4),yv(0.02));ctx.lineTo(X(t1+tv*0.5),yv(0.02));
          ctx.lineTo(X(t1+tv*1.5),yv(1));ctx.lineTo(X(T),yv(1));
        }else{ /* ID */
          ctx.moveTo(X(0),yv(0));ctx.lineTo(X(t0),yv(0));
          ctx.lineTo(X(t0+tv*0.4),yv(1));ctx.lineTo(X(t1+tv*1.5),yv(1));
          ctx.lineTo(X(t1+tv*1.9),yv(0));ctx.lineTo(X(T),yv(0));
        }
        ctx.stroke();
        if(k===1){ /* ミラー期間の網掛け */
          ctx.fillStyle=C("--alias-soft");
          ctx.fillRect(X(t0+tv*0.4),y0,X(t0+tv*1.4)-X(t0+tv*0.4),y1-y0);
          ctx.fillRect(X(t1+tv*0.5),y0,X(t1+tv*1.5)-X(t1+tv*0.5),y1-y0);
          lab(ctx,"重なり = 損失",X(t0+tv*1.5)+4,y0+12,C("--alias"),"left",10);
        }
      }
      lab(ctx,"1 周期 = "+(T*1e6<1000?f(T*1e6,2)+" µs":f(T*1e3,2)+" ms"),w-14,h-8,C("--faint"),"right",10);
      out.innerHTML='ミラー期間（V<sub>DS</sub> が遷移する時間）= Q<sub>gd</sub>/I<sub>g</sub> ≈ <b>'+
        f(tsw*1e9,0)+' ns</b>（Q<sub>gd</sub> ≈ 0.3·Q<sub>g</sub> と仮定）'+
        ' ／ スイッチング損失 <b>'+f(Psw,3)+' W</b>'+
        ' ／ 導通損失（D=50 %）<b>'+f(Pcond,3)+' W</b>'+
        ' ／ ゲート駆動損失 <b>'+f(Pgate,4)+' W</b>'+
        ' ／ <b>合計 '+f(Ptot,3)+' W</b>'+
        ' ／ ドライブ電流を増やすと遷移が速くなり、<b>スイッチング損失は反比例して減る</b>'+
        '（ただし dV/dt が上がって EMI と誤 ON のリスクが増える）'+
        ' ／ <b>MCU の GPIO（20 mA）で直接駆動すると遷移が µs オーダになり、確実に焼ける</b>';
    }
    [sQ,sIg,sV,sI,sF,sRon].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 06: BJT 特性 ---------- */
  REG.bjt=function(el){
    head(el,"BJT","I_C は V_BE の指数関数");
    var r=ctrls(el);
    var sV=slider(r,"V_BE [mV]",500,800,650,1);
    var sB=slider(r,"β (h_FE)",20,400,150,1);
    var sT=slider(r,"温度 [℃]",-40,125,25,1);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    function draw(){
      var Vbe=+sV.input.value*1e-3,B=+sB.input.value,Tc=+sT.input.value;
      sV.val.textContent=f(Vbe*1e3,0)+" mV";sB.val.textContent=f(B,0);sT.val.textContent=Tc+" ℃";
      var VT=8.617e-5*(Tc+273.15),Is=1e-14*Math.exp((Tc-25)*0.12);
      var Ic=Is*Math.exp(Vbe/VT),Ib=Ic/B,gm=Ic/VT,re=1/gm;
      var c=chart(cc,0.45,0.85,-9,0,{l:58,b:44,t:22});   /* log10 Ic */
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var e=0;e<=4;e++){var xv=0.45+0.1*e;lab(ctx,f(xv,2),c.X(xv),c.h-c.p.b+16,C("--faint"),e===4?"right":e===0?"left":"center",10);}
      var un=["1 nA","10 nA","100 nA","1 µA","10 µA","100 µA","1 mA","10 mA","100 mA","1 A"];
      for(var q=-9;q<=0;q++){if((q+9)%2)continue;lab(ctx,un[q+9],c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);}
      lab(ctx,"V_BE [V]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* 25 ℃ 比較 */
      var VT25=8.617e-5*298.15;
      var P25=[];for(var i=0;i<=200;i++){var v=0.45+0.4*i/200;
        P25.push([v,Math.max(-9,Math.log10(1e-14*Math.exp(v/VT25)))]);}
      line(c,P25,C("--faint"),1.3,[4,4]);
      var P=[];for(var j=0;j<=200;j++){var v2=0.45+0.4*j/200;
        P.push([v2,Math.max(-9,Math.log10(Is*Math.exp(v2/VT)))]);}
      line(c,P,C("--signal"),2.6);
      if(Math.log10(Ic)>-9&&Math.log10(Ic)<0)dot(c,Vbe,Math.log10(Ic),4.5,C("--alias"));
      lab(ctx,"25 ℃（比較）",c.w-c.p.r-6,c.h-c.p.b-8,C("--faint"),"right",10);
      lab(ctx,"片対数では直線",c.p.l+6,c.p.t+12,C("--muted"),"left",10);
      out.innerHTML='I<sub>C</sub> = I<sub>S</sub>·e^(V<sub>BE</sub>/V<sub>T</sub>) = <b>'+
        (Ic<1e-3?f(Ic*1e6,2)+" µA":Ic<1?f(Ic*1e3,2)+" mA":f(Ic,2)+" A")+'</b>'+
        ' ／ ベース電流 I<sub>B</sub> = I<sub>C</sub>/β = <b>'+
        (Ib<1e-3?f(Ib*1e6,2)+" µA":f(Ib*1e3,3)+" mA")+'</b>'+
        ' ／ <b>相互コンダクタンス g<sub>m</sub> = I<sub>C</sub>/V<sub>T</sub> = '+f(gm*1e3,2)+' mS</b>'+
        '（MOSFET の g<sub>m</sub> は √I に比例するのに対し、<b>BJT は I に正比例</b>——これがアナログで BJT が生き残る理由）'+
        ' ／ エミッタから見た抵抗 r<sub>e</sub> = 1/g<sub>m</sub> = <b>'+f(re,1)+' Ω</b>'+
        ' ／ <b>V<sub>BE</sub> は約 −2 mV/℃ で下がる</b>——同じ V<sub>BE</sub> を与え続けると温度上昇で電流が増え、熱暴走する'+
        ' ／ <b>β は個体で 3 倍以上ばらつく。β に依存する設計をしてはいけない</b>';
    }
    [sV,sB,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 06: MOSFET と BJT の比較 ---------- */
  REG.bjtmos=function(el){
    head(el,"BJT vs MOSFET","用途で選ぶ");
    readout(el);
    var out=el.querySelector(".readout");
    var A=[
      {n:"駆動",c:"--signal",rows:[
        ["BJT","<b>電流駆動</b>。I<sub>B</sub> = I<sub>C</sub>/β を流し続ける必要がある"],
        ["MOSFET","<b>電圧駆動</b>。定常状態ではゲート電流ゼロ（容量の充放電だけ）"],
        ["帰結","MCU から直接駆動するなら MOSFET が楽。ただし Q<sub>g</sub> の充放電電流は必要"]]},
      {n:"利得",c:"--blue",rows:[
        ["BJT","g<sub>m</sub> = I<sub>C</sub>/V<sub>T</sub>。<b>電流に正比例</b>し、同じ電流なら MOSFET より遥かに大きい"],
        ["MOSFET","g<sub>m</sub> = √(2K·I<sub>D</sub>)。<b>√I に比例</b>。同じ g<sub>m</sub> を得るのに大電流が要る"],
        ["帰結","<b>低ノイズ・高利得のアナログ入力段は BJT</b>（または JFET）が有利"]]},
      {n:"スイッチ",c:"--signal",rows:[
        ["BJT","飽和時 V<sub>CE(sat)</sub> ≈ 0.1〜0.3 V。<b>電流によらずほぼ一定の電圧が落ちる</b>"],
        ["MOSFET","R<sub>DS(on)</sub>。<b>電流が小さいほど損失が小さい</b>。低電圧で圧倒的に有利"],
        ["帰結","<b>5 V 以下のスイッチングは MOSFET 一択</b>。BJT の 0.2 V は大きすぎる"]]},
      {n:"温度",c:"--alias",rows:[
        ["BJT","<b>正帰還</b>: 温度↑ → I<sub>C</sub>↑ → 発熱↑ → 熱暴走。<b>並列接続にはバランス抵抗が必須</b>"],
        ["MOSFET","<b>負帰還</b>: 温度↑ → R<sub>DS(on)</sub>↑ → 電流↓。<b>並列接続が自然にできる</b>"],
        ["帰結","大電流を分担させるなら MOSFET。BJT は電流集中で壊れる"]]},
      {n:"精度",c:"--blue",rows:[
        ["BJT","<b>V<sub>BE</sub> のマッチングが極めて良い</b>（同一チップ内で数百 µV）"],
        ["MOSFET","V<sub>th</sub> のばらつきが大きい（数 mV〜数十 mV）"],
        ["帰結","<b>バンドギャップ基準・カレントミラー・差動対は BJT</b>が基本（10 章）"]]},
      {n:"速度",c:"--signal",rows:[
        ["BJT","ベースに<b>少数キャリアが蓄積</b>する。飽和から抜けるのが遅い"],
        ["MOSFET","<b>多数キャリアのみ</b>。蓄積時間がない。ゲート容量の充放電が律速"],
        ["帰結","高速スイッチングは MOSFET。BJT を速くするにはショットキークランプが要る"]]}
    ];
    picker(el,A,function(it){
      return tbl(["項目","内容"],it.rows,["left","left"]);
    });
    out.innerHTML='<b>「どちらが優れているか」ではなく「何を作るか」で決まる。</b>'+
      ' 電力スイッチはほぼ MOSFET、IC の中のアナログ回路はいまも BJT が主役である'+
      ' ／ <b>MCU から負荷を駆動するなら、まず MOSFET を検討する</b>'+
      ' ／ ただし <b>V<sub>GS</sub> がロジックレベルで足りているか</b>を必ず確認すること（05 章）';
  };
  /* ---------- 07: オペアンプの内部 ---------- */
  REG.opampin=function(el){
    head(el,"Inside the Op-Amp","3 段構成——どの段がどの仕様を決めるか");
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"① 差動入力段",c:"--signal",d:"2 つの入力の差だけを取り出す。ここが決める仕様が最も多い。",
       cir:["  +IN ──┤ Q1   Q2 ├── −IN","          └──┬──┘","          テール電流源 I_tail","             ↓ 差動 → 単相 変換（カレントミラー）"],
       spec:[["入力オフセット電圧 V_OS","Q1/Q2 のミスマッチ。数 µV（チョッパ）〜数 mV（汎用）"],
             ["入力バイアス電流 I_B","BJT 入力なら nA〜µA、FET 入力なら pA"],
             ["入力電圧ノイズ e_n","入力段トランジスタの熱雑音。電流を増やすと下がる"],
             ["CMRR","テール電流源の出力抵抗で決まる"],
             ["同相入力範囲","レール付近が使えるか。RRI 品は 2 組の差動対を持つ"],
             ["ドリフト","V_OS の温度係数。μV/℃"]],
       note:"<b>入力オフセットとバイアス電流はここで決まる。</b>センサ用途で最も効く段。"},
      {n:"② 利得段",c:"--blue",d:"電圧利得の大半（60〜100 dB）をここで稼ぐ。位相補償もここ。",
       cir:["  前段 ──┤ Q3 ├── 次段へ","          │","         ═╪═ C_c（ミラー補償）","          │","         高抵抗負荷（能動負荷）"],
       spec:[["開ループ利得 A_OL","100〜140 dB。ここでほぼ決まる"],
             ["GBW","<b>GBW = g_m1/(2π·C_c)</b>。入力段の g_m と補償容量の比"],
             ["スルーレート","<b>SR = I_tail/C_c</b>。テール電流を C_c に流し込む速度"],
             ["支配極","C_c により数 Hz〜数十 Hz に置かれる"]],
       note:"<b>GBW とスルーレートは、どちらも C_c が分母にいる。</b>速い品種は C_c が小さいか I_tail が大きい。"},
      {n:"③ 出力段",c:"--signal",d:"低インピーダンスで電流を供給する。電圧利得はほぼ 1。",
       cir:["         VCC","          │","         ┤ 上側（ソース）","  前段 ──┼──── OUT","         ┤ 下側（シンク）","          │","         GND"],
       spec:[["出力電圧振幅","エミッタフォロワなら V_CC−1.5 V 程度。<b>RRO は MOS で数十 mV まで</b>"],
             ["出力電流","短絡保護が入っている。データシートの負荷曲線を見る"],
             ["出力インピーダンス","開ループで数十 Ω。負帰還で 1/(1+Aβ) に下がる"],
             ["クロスオーバ歪み","クラス AB のバイアスで決まる"]],
       note:"<b>RRO（レール・ツー・レール出力）は無負荷での話。</b>電流を流すと振幅は縮む。"},
      {n:"周波数特性",c:"--alias",d:"3 段を合わせた開ループ特性。ここから安定性が読める。",
       cir:["  |A| ─────╲","           │ ╲ −20 dB/dec","    0 dB ──┼───╲──────── f","           │     ╲ ← 第 2 極","          f_p1   GBW"],
       spec:[["支配極 f_p1","A_OL·f_p1 = GBW。数 Hz〜数十 Hz"],
             ["−20 dB/dec","1 極だけなら位相遅れは 90°。<b>90° の余裕がある</b>"],
             ["第 2 極","GBW より十分上にないと位相余裕が減る"],
             ["位相余裕","45° で振動的、60° 以上が実用の目安"]],
       note:"<b>「1 極だけに見えるようにする」ことが位相補償の目的である。</b>だから −20 dB/dec が延々と続く。"}
    ];
    picker(el,A,function(it){
      var h=blk("役割",'<div style="color:var(--ink)">'+it.d+'</div>',it.c);
      h+=blk("回路の骨格",'<pre style="margin:0;font-family:var(--mono);font-size:.76rem;line-height:1.5;color:var(--muted);white-space:pre">'+
        esc(it.cir.join("\n"))+'</pre>',"--muted");
      h+=blk("この段が決める仕様",tbl(["仕様","内容"],it.spec),it.c);
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+it.note+'</div>';
      return h;
    });
    out.innerHTML='データシートの数値は、<b>この 3 段のどこから来ているか</b>で分類できる。'+
      ' オフセット・バイアス電流・ノイズ・CMRR は<b>入力段</b>、'+
      'A<sub>OL</sub>・GBW・スルーレートは<b>利得段</b>、'+
      '出力振幅・出力電流・容量負荷耐性は<b>出力段</b>'+
      ' ／ <b>どの仕様が効くかは用途で決まる</b>——'+
      '直流精度が要るならオフセットとドリフト、高速なら GBW とスルーレート、'+
      '高インピーダンス源ならバイアス電流';
  };

  /* ---------- 08: 利得と帯域 ---------- */
  REG.gbw=function(el){
    head(el,"Gain-Bandwidth","利得を上げると帯域が縮む");
    var r=ctrls(el);
    var sG=slider(r,"閉ループ利得 [dB]",0,60,20,1);
    var sB=slider(r,"GBW [MHz]",0.1,100,10,0.1);
    var sA=slider(r,"開ループ利得 A_OL [dB]",60,140,106,1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var Gdb=+sG.input.value,GBW=+sB.input.value*1e6,Adb=+sA.input.value;
      sG.val.textContent=Gdb+" dB（×"+f(Math.pow(10,Gdb/20),1)+"）";
      sB.val.textContent=(GBW<1e6?f(GBW/1e3,0)+" kHz":f(GBW/1e6,1)+" MHz");
      sA.val.textContent=Adb+" dB";
      var Acl=Math.pow(10,Gdb/20),Aol=Math.pow(10,Adb/20);
      var fp1=GBW/Aol, fcl=GBW/Acl;
      var c=chart(cc,-1,9,-20,Adb+15,{l:56,b:44,t:20});
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var e=-1;e<=9;e++){var t=e<0?"0.1":e<3?Math.pow(10,e)+"":e<6?Math.pow(10,e-3)+"k":e<9?Math.pow(10,e-6)+"M":"1G";
        lab(ctx,t,c.X(e),c.h-c.p.b+16,C("--faint"),e===9?"right":e===-1?"left":"center",10);}
      for(var q=0;q<=Adb;q+=20)lab(ctx,q+" dB",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      lab(ctx,"周波数 [Hz]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* 開ループ */
      var PA=[];for(var i=0;i<=200;i++){var lf=-1+10*i/200,fq=Math.pow(10,lf);
        PA.push([lf,20*Math.log10(Aol/Math.sqrt(1+Math.pow(fq/fp1,2)))]);}
      line(c,PA,C("--faint"),1.8,[5,4]);
      lab(ctx,"開ループ A_OL",c.p.l+6,c.Y(Adb)-6,C("--faint"),"left",10);
      /* 閉ループ */
      var PC=[];for(var j=0;j<=200;j++){var lf2=-1+10*j/200,fq2=Math.pow(10,lf2);
        var a=Aol/Math.sqrt(1+Math.pow(fq2/fp1,2));
        PC.push([lf2,20*Math.log10(a/(1+a/Acl))]);}
      line(c,PC,C("--signal"),2.8);
      /* ループ利得の網掛け */
      ctx.fillStyle=C("--signal-soft");
      ctx.beginPath();
      for(var m=0;m<=200;m++){var lf3=-1+10*m/200,fq3=Math.pow(10,lf3);
        var a3=20*Math.log10(Aol/Math.sqrt(1+Math.pow(fq3/fp1,2)));
        var y=Math.min(a3,Adb+15);m?ctx.lineTo(c.X(lf3),c.Y(y)):ctx.moveTo(c.X(lf3),c.Y(y));}
      for(var m2=200;m2>=0;m2--){var lf4=-1+10*m2/200;ctx.lineTo(c.X(lf4),c.Y(Gdb));}
      ctx.closePath();ctx.fill();
      lab(ctx,"ループ利得（＝精度の余裕）",c.p.l+8,c.Y(Gdb)-10,C("--signal"),"left",10);
      var xs=c.X(Math.log10(fcl));
      if(xs>c.p.l&&xs<c.w-c.p.r){ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(xs,c.p.t);ctx.lineTo(xs,c.h-c.p.b);ctx.stroke();
        lab(ctx,"f_-3dB",xs+4,c.p.t+12,C("--alias"),"left",10);}
      var err100=100/(1+Aol/Acl);
      out.innerHTML='閉ループ帯域 <b>f<sub>−3dB</sub> = GBW / A<sub>CL</sub> = '+
        (fcl<1e3?f(fcl,1)+" Hz":fcl<1e6?f(fcl/1e3,1)+" kHz":f(fcl/1e6,2)+" MHz")+'</b>'+
        ' ／ 支配極 f<sub>p1</sub> = <b>'+f(fp1,2)+' Hz</b>'+
        ' ／ DC でのループ利得 A<sub>OL</sub>/A<sub>CL</sub> = <b>'+f(Adb-Gdb,0)+' dB</b>'+
        '（利得誤差 <b>'+f(err100,4)+' %</b>）'+
        ' ／ <b>利得を 10 倍にすると帯域は 1/10 になる</b>——これが GBW 一定の意味'+
        ' ／ <b>ループ利得（網掛け部分）が精度そのものである。</b>'+
        '周波数が上がるとループ利得が減り、歪みも誤差も増える'+
        ' ／ 高利得と広帯域が同時に要るなら、<b>2 段に分ける</b>（例: ×100 を ×10 の 2 段にすると帯域が 10 倍）';
    }
    [sG,sB,sA].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 08: スルーレート制限 ---------- */
  REG.slew=function(el){
    head(el,"Slew Rate","大信号では帯域より先にこちらが効く");
    var r=ctrls(el);
    var sSR=slider(r,"スルーレート [V/µs]",0.1,100,10,0.1);
    var sV=slider(r,"出力振幅（片側 V_p）[V]",0.1,15,5,0.1);
    var sF=slider(r,"信号周波数 [kHz]",1,2000,100,1);
    var cv=screen(el,230),cc=cctx(cv),out=readout(el);
    function draw(){
      var SR=+sSR.input.value*1e6,Vp=+sV.input.value,fq=+sF.input.value*1e3;
      sSR.val.textContent=f(SR/1e6,1)+" V/µs";sV.val.textContent=f(Vp,1)+" V";
      sF.val.textContent=(fq<1e6?f(fq/1e3,0)+" kHz":f(fq/1e6,2)+" MHz");
      var need=TAU*fq*Vp, fmax=SR/(TAU*Vp);
      var T=2/fq;
      var c=chart(cc,0,T*1e6,-Vp*1.25,Vp*1.25,{l:56,b:44,t:20});
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var q=-1;q<=1;q++)lab(ctx,f(q*Vp,1)+" V",c.p.l-6,c.Y(q*Vp)+4,C("--faint"),"right",10);
      lab(ctx,"時間 [µs]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* 理想正弦波 */
      var Pi=[];for(var i=0;i<=400;i++){var t=T*i/400;Pi.push([t*1e6,Vp*Math.sin(TAU*fq*t)]);}
      line(c,Pi,C("--faint"),1.5,[5,4]);
      /* スルーレート制限された出力 */
      var Po=[],v=0,dt=T/400;
      for(var j=0;j<=400;j++){var t2=T*j/400,tgt=Vp*Math.sin(TAU*fq*t2);
        var dv=tgt-v,mx=SR*dt;
        v+=Math.max(-mx,Math.min(mx,dv));
        Po.push([t2*1e6,v]);}
      line(c,Po,C("--signal"),2.6);
      lab(ctx,"破線 = 理想（入力）",c.p.l+8,c.h-c.p.b-8,C("--faint"),"left",10);
      lab(ctx,"実線 = 実際の出力",c.p.l+8,c.p.t+12,C("--signal"),"left",10);
      for(var e=0;e<=2;e++){var xt2=T*1e6*e/2;
        lab(ctx,f(xt2,2),c.X(xt2),c.h-c.p.b+16,C("--faint"),e===2?"right":e===0?"left":"center",10);}
      var lim=need>SR;
      out.innerHTML='必要なスルーレート = 2π·f·V<sub>p</sub> = <b>'+f(need/1e6,2)+' V/µs</b>'+
        ' ／ このオペアンプは <b>'+f(SR/1e6,1)+' V/µs</b>'+
        (lim?' ／ <span class="warn">不足——出力が三角波に化けている</span>':' ／ <span class="ok">余裕あり</span>')+
        ' ／ この振幅で歪まない上限（<b>フルパワー帯域幅</b>）は '+
        '<b>f<sub>max</sub> = SR/(2π·V<sub>p</sub>) = '+(fmax<1e6?f(fmax/1e3,1)+" kHz":f(fmax/1e6,2)+" MHz")+'</b>'+
        ' ／ <b>GBW が足りていてもスルーレートで先に潰れる</b>——'+
        '小信号帯域（GBW/A<sub>CL</sub>）と大信号帯域（フルパワー帯域幅）は別物である'+
        ' ／ 振幅を半分にすれば、通せる周波数は 2 倍になる';
    }
    [sSR,sV,sF].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 08: 発振の原因と対策 ---------- */
  REG.opstab=function(el){
    head(el,"Stability","容量負荷は最も多い発振原因");
    var r=ctrls(el);
    var sC=slider(r,"容量負荷 C_L [pF]",1,10000,100,1);
    var sRo=slider(r,"開ループ出力抵抗 R_o [Ω]",5,500,70,1);
    var sB=slider(r,"GBW [MHz]",0.5,100,10,0.1);
    var sRi=slider(r,"絶縁抵抗 R_iso [Ω]",0,200,0,1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var CL=+sC.input.value*1e-12,Ro=+sRo.input.value,GBW=+sB.input.value*1e6,Riso=+sRi.input.value;
      sC.val.textContent=(CL*1e12<1000?f(CL*1e12,0)+" pF":f(CL*1e9,2)+" nF");
      sRo.val.textContent=f(Ro,0)+" Ω";sB.val.textContent=f(GBW/1e6,1)+" MHz";
      sRi.val.textContent=f(Riso,0)+" Ω"+(Riso<1?"（なし）":"");
      var fp2=1/(TAU*(Ro+Riso)*CL);              /* 出力極 */
      var fz=Riso>0?1/(TAU*Riso*CL):Infinity;    /* R_iso によるゼロ */
      /* ユニティゲイン閉ループの位相余裕を数値で求める */
      function phase(fq){
        var ph=-90-Math.atan(fq/fp2)*180/Math.PI;
        if(isFinite(fz))ph+=Math.atan(fq/fz)*180/Math.PI;
        return ph;
      }
      function magdb(fq){
        var m=20*Math.log10(GBW/fq)-10*Math.log10(1+Math.pow(fq/fp2,2));
        if(isFinite(fz))m+=10*Math.log10(1+Math.pow(fq/fz,2));
        return m;
      }
      /* 0 dB 交点を二分探索 */
      var lo=GBW/1e4,hi=GBW*100;
      for(var k=0;k<80;k++){var mid=Math.sqrt(lo*hi);if(magdb(mid)>0)lo=mid;else hi=mid;}
      var fx=Math.sqrt(lo*hi),pm=180+phase(fx);
      var c=chart(cc,Math.log10(GBW)-4,Math.log10(GBW)+2,-180,60,{l:52,b:30,t:18});
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var q=-180;q<=60;q+=60)lab(ctx,q+"",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      for(var e=Math.ceil(c.x0);e<=Math.floor(c.x1);e++){
        var t=e<3?Math.pow(10,e)+"":e<6?Math.pow(10,e-3)+"k":e<9?Math.pow(10,e-6)+"M":"1G";
        lab(ctx,t,c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);}
      ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(0));ctx.lineTo(c.w-c.p.r,c.Y(0));ctx.stroke();
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(-180));ctx.lineTo(c.w-c.p.r,c.Y(-180));ctx.stroke();ctx.setLineDash([]);
      var PM=[],PP=[];
      for(var i=0;i<=300;i++){var lf=c.x0+(c.x1-c.x0)*i/300,fq=Math.pow(10,lf);
        PM.push([lf,Math.max(-180,Math.min(60,magdb(fq)))]);
        PP.push([lf,Math.max(-180,phase(fq))]);}
      line(c,PM,C("--signal"),2.6);
      line(c,PP,C("--blue"),2.0,[5,4]);
      lab(ctx,"利得 [dB]",c.p.l+6,c.p.t+12,C("--signal"),"left",10);
      lab(ctx,"位相 [°]",c.p.l+6,c.p.t+26,C("--blue"),"left",10);
      var xx=c.X(Math.log10(fx));
      if(xx>c.p.l&&xx<c.w-c.p.r){ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(xx,c.p.t);ctx.lineTo(xx,c.h-c.p.b);ctx.stroke();
        lab(ctx,"0 dB 交点",xx+4,c.p.t+12,C("--alias"),"left",10);}
      var verd=pm<0?'<span class="warn">発振する</span>':pm<30?'<span class="warn">強く振動する</span>':
               pm<45?'<span class="warn">オーバーシュートが大きい</span>':pm<60?'やや振動的':'<span class="ok">安定</span>';
      out.innerHTML='出力極 f<sub>p2</sub> = 1/(2π·(R<sub>o</sub>+R<sub>iso</sub>)·C<sub>L</sub>) = <b>'+
        (fp2<1e6?f(fp2/1e3,1)+" kHz":f(fp2/1e6,2)+" MHz")+'</b>'+
        (Riso>0?' ／ R<sub>iso</sub> によるゼロ = <b>'+(fz<1e6?f(fz/1e3,1)+" kHz":f(fz/1e6,2)+" MHz")+'</b>':'')+
        ' ／ 0 dB 交点 <b>'+(fx<1e6?f(fx/1e3,1)+" kHz":f(fx/1e6,2)+" MHz")+'</b>'+
        ' ／ <b>位相余裕 '+f(pm,1)+'°</b> — '+verd+
        ' ／ <b>容量負荷が出力抵抗と組んで第 2 極を作る。</b>これが GBW 付近まで下りてくると発振する'+
        ' ／ <b>対策: 出力に直列抵抗 R<sub>iso</sub>（10〜100 Ω）を入れる。</b>'+
        'ゼロが位相を戻す。R<sub>iso</sub> を 0 から上げてみること'+
        ' ／ 他の対策: 帯域の狭いオペアンプを選ぶ、帰還を C<sub>L</sub> の手前から取る';
    }
    [sC,sRo,sB,sRi].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 09: ヒステリシス ---------- */
  REG.hyst=function(el){
    head(el,"Hysteresis","ノイズの上でチャタらせない");
    var r=ctrls(el);
    var sH=slider(r,"ヒステリシス幅 [mV]",0,500,0,5);
    var sN=slider(r,"入力ノイズ振幅 [mV]",0,300,80,5);
    var sS=slider(r,"入力の変化速度",0.2,5,1,0.1);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    var seed=12345;
    function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff-0.5;}
    function draw(){
      var H=+sH.input.value/1000,Nn=+sN.input.value/1000,sp=+sS.input.value;
      sH.val.textContent=f(H*1e3,0)+" mV"+(H<0.001?"（なし）":"");
      sN.val.textContent=f(Nn*1e3,0)+" mV";sS.val.textContent="×"+f(sp,1);
      var Vref=1.65,N=500;
      seed=12345;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=48,padT=16,padB=26,split=0.62;
      var h1=(h-padT-padB)*split,y0=padT,y1=padT+h1;
      var y2=y1+12,y3=h-padB;
      function X(i){return padL+i/N*(w-padL-14);}
      function Y(v){return y1-(v-1.0)/(2.3-1.0)*(y1-y0);}
      /* 入力波形 */
      var vals=[],out2=[],st=0,edges=0;
      for(var i=0;i<=N;i++){
        var base=1.65+0.55*Math.sin(TAU*sp*i/N);
        var v=base+Nn*rnd()*2;
        vals.push(v);
        var hi=Vref+H/2,lo=Vref-H/2;
        var ns=st?(v<lo?0:1):(v>hi?1:0);
        if(ns!==st)edges++;
        st=ns;out2.push(st);
      }
      /* しきい値帯 */
      ctx.fillStyle=C("--signal-soft");
      ctx.fillRect(padL,Y(Vref+H/2),w-padL-14,Math.max(1,Y(Vref-H/2)-Y(Vref+H/2)));
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(padL,Y(Vref+H/2));ctx.lineTo(w-14,Y(Vref+H/2));ctx.stroke();
      ctx.beginPath();ctx.moveTo(padL,Y(Vref-H/2));ctx.lineTo(w-14,Y(Vref-H/2));ctx.stroke();ctx.setLineDash([]);
      var yh=Y(Vref+H/2),ylo=Y(Vref-H/2);
      if(ylo-yh<24){yh-=6;ylo+=18;}
      lab(ctx,"V_TH+",w-18,yh-5,C("--signal"),"right",10);
      lab(ctx,"V_TH−",w-18,ylo+12,C("--signal"),"right",10);
      /* 入力 */
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1.4;ctx.beginPath();
      vals.forEach(function(v,i){i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v));});
      ctx.stroke();
      lab(ctx,"入力",padL-6,(y0+y1)/2,C("--muted"),"right",11);
      /* 出力 */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.2;ctx.beginPath();
      out2.forEach(function(s2,i){var yy=s2?y2+4:y3-4;
        if(i){ctx.lineTo(X(i),(out2[i-1]?y2+4:y3-4));ctx.lineTo(X(i),yy);}else ctx.moveTo(X(i),yy);});
      ctx.stroke();
      lab(ctx,"出力",padL-6,(y2+y3)/2,C("--alias"),"right",11);
      var ideal=Math.round(sp)*2;
      out.innerHTML='出力の遷移回数 <b>'+edges+' 回</b>（理想は '+ideal+' 回）'+
        (edges>ideal+2?' ／ <span class="warn">チャタリングしている</span>':' ／ <span class="ok">1 回ずつきれいに切り替わっている</span>')+
        ' ／ ヒステリシス幅 <b>'+f(H*1e3,0)+' mV</b> に対し、ノイズ振幅 <b>±'+f(Nn*1e3,0)+' mV</b>'+
        ' ／ <b>ヒステリシス幅はノイズのピーク・ツー・ピークより広く取る</b>のが原則'+
        '（実務では 50〜200 mV）'+
        ' ／ <b>ヒステリシスを 0 にしてみること</b>——しきい値付近でノイズがそのまま出力の暴れになる'+
        ' ／ ただしヒステリシスを広げすぎると<b>検出の精度が落ち、応答も遅れる</b>';
    }
    [sH,sN,sS].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 10: バンドギャップ ---------- */
  REG.bandgap=function(el){
    head(el,"Bandgap Reference","CTAT + PTAT = 温度に依存しない 1.2 V");
    var r=ctrls(el);
    var sK=slider(r,"PTAT の重み K",0,40,17.2,0.1);
    var sN=slider(r,"面積比 N（ΔV_BE = V_T·lnN）",2,64,8,1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var K=+sK.input.value,N=+sN.input.value;
      sK.val.textContent=f(K,1);sN.val.textContent="1 : "+N;
      var c=chart(cc,-40,125,0,1.75,{l:58,b:32,t:24});
      grid(c,4);axis(c);var ctx=c.ctx;
      lab(ctx,"温度 [℃]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      for(var q=0;q<=1.6;q+=0.4)lab(ctx,f(q,1)+" V",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      for(var e2=-40;e2<=125;e2+=40)lab(ctx,e2+"",c.X(e2),c.h-c.p.b+16,C("--faint"),"center",10);
      var PC=[],PP=[],PS=[],vmin=9,vmax=-9;
      for(var i=0;i<=200;i++){
        var T=-40+165*i/200,Tk=T+273.15;
        var Vbe=0.65-0.002*(T-25);                       /* CTAT */
        var dVbe=8.617e-5*Tk*Math.log(N);                /* PTAT */
        var Vref=Vbe+K*dVbe;
        PC.push([T,Vbe]);PP.push([T,K*dVbe]);PS.push([T,Vref]);
        vmin=Math.min(vmin,Vref);vmax=Math.max(vmax,Vref);
      }
      line(c,PC,C("--blue"),1.8,[5,4]);
      line(c,PP,C("--alias"),1.8,[5,4]);
      line(c,PS,C("--signal"),2.8);
      lab(ctx,"V_BE（CTAT −2 mV/℃）",c.p.l+8,c.Y(PC[0][1])-8,C("--blue"),"left",10);
      lab(ctx,"K·ΔV_BE（PTAT）",c.p.l+8,c.Y(PP[0][1])+16,C("--alias"),"left",10);
      lab(ctx,"合計 = V_REF",c.w-c.p.r-6,Math.max(c.p.t+12,c.Y(PS[200][1])-10),C("--signal"),"right",11);
      var mid=PS[100][1];
      var tc=(vmax-vmin)/mid*1e6/165;
      var slope=(PS[200][1]-PS[0][1])/165;
      out.innerHTML='ΔV<sub>BE</sub> = V<sub>T</sub>·ln N = <b>'+f(8.617e-5*298.15*Math.log(N)*1e3,1)+' mV</b>（25 ℃）、'+
        '温度係数は <b>+'+f(8.617e-5*Math.log(N)*1e6,1)+' µV/K</b>（<b>絶対温度に比例＝PTAT</b>）'+
        ' ／ V<sub>BE</sub> は <b>−2 mV/℃</b>（<b>CTAT</b>）'+
        ' ／ K = '+f(K,1)+' のとき V<sub>REF</sub>(25 ℃) = <b>'+f(mid,4)+' V</b>、'+
        '傾き <b>'+f(slope*1e6,1)+' µV/℃</b>、全温度でのばらつき <b>'+f(tc,1)+' ppm/℃</b>'+
        (Math.abs(slope*1e6)<50?' ／ <span class="ok">ほぼ平坦</span>':' ／ <span class="warn">傾いている——K を調整すること</span>')+
        ' ／ <b>K ≈ 17 で傾きが打ち消し合い、そのとき V<sub>REF</sub> ≈ 1.2 V になる。</b>'+
        'この 1.2 V は<b>シリコンのバンドギャップ電圧（0 K に外挿した値）</b>そのもので、偶然ではない'+
        ' ／ 残る誤差は 2 次の曲率——高精度品は<b>曲率補正</b>を入れて 5 ppm/℃ 以下にする';
    }
    [sK,sN].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 10: 温度センサの読み取り ---------- */
  REG.tempsense=function(el){
    head(el,"Temperature Sensing","方式で精度も配線も変わる");
    var r=ctrls(el);
    var sT=slider(r,"実際の温度 [℃]",-40,150,25,1);
    var sR=slider(r,"ADC 分解能 [bit]",8,16,12,1);
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"NTC サーミスタ",c:"--signal",k:"ntc"},
      {n:"白金測温抵抗体 Pt100",c:"--blue",k:"rtd"},
      {n:"熱電対 K 型",c:"--alias",k:"tc"},
      {n:"MCU 内蔵センサ",c:"--muted",k:"int"}
    ];
    var pk=null;
    function body(it){
      var T=+sT.input.value,bits=+sR.input.value;
      var VREF=3.3,lsb=VREF/Math.pow(2,bits);
      var rows=[],desc="",sens=0,note="";
      if(it.k==="ntc"){
        var B=3950,R25=10000,Rt=R25*Math.exp(B*(1/(T+273.15)-1/298.15));
        var Rp=10000,V=VREF*Rp/(Rt+Rp);
        var dRdT=-B/Math.pow(T+273.15,2)*Rt;
        sens=Math.abs(VREF*Rp*dRdT/Math.pow(Rt+Rp,2));
        rows=[["抵抗値 R(T)",f(Rt,0)+" Ω（R25 = 10 kΩ, B = 3950）"],
              ["分圧出力（上に 10 kΩ）",f(V,4)+" V"],
              ["感度 dV/dT",f(sens*1e3,2)+" mV/℃"],
              ["1 LSB 相当",f(lsb/sens,3)+" ℃"],
              ["直線性","<b>非線形（指数）</b>。式か LUT で変換する"],
              ["確度","±0.5〜±3 ℃（等級による）"]];
        desc="安価で感度が高い。<b>プルアップ抵抗を R25 と同じ値にすると、25 ℃ 付近で感度が最大</b>になる。";
        note="測定範囲が広いと感度が大きく変わる。<b>使う温度域を決めてから抵抗値を選ぶ</b>。";
      }else if(it.k==="rtd"){
        var R0=100,Rt2=R0*(1+3.9083e-3*T-5.775e-7*T*T);
        var Iex=1e-3,V2=Rt2*Iex;
        sens=R0*3.9083e-3*Iex;
        rows=[["抵抗値 R(T)",f(Rt2,3)+" Ω"],
              ["1 mA 励磁での電圧",f(V2*1e3,3)+" mV"],
              ["感度",f(sens*1e6,1)+" µV/℃（1 mA 時）"],
              ["1 LSB 相当",f(lsb/sens,3)+" ℃（増幅なし）"],
              ["直線性","<b>非常に良い</b>（Callendar-Van Dusen 式）"],
              ["確度","±0.1 ℃ 級も可能"]];
        desc="最も正確で安定。<b>ただし出力が小さいので増幅が要る</b>（0.39 mV/℃ @1 mA）。";
        note="<b>配線抵抗が誤差になる。</b>2 線式では往復の抵抗が丸ごと乗る（0.4 Ω = 1 ℃）。<b>3 線式か 4 線式にする</b>。自己発熱にも注意（励磁電流を上げすぎない）。";
      }else if(it.k==="tc"){
        var V3=41e-6*T;   /* 冷接点 0 ℃ 基準の近似 */
        sens=41e-6;
        rows=[["起電力（冷接点 0 ℃）",f(V3*1e3,3)+" mV"],
              ["感度",f(sens*1e6,0)+" µV/℃"],
              ["1 LSB 相当",f(lsb/sens,2)+" ℃（増幅なし）"],
              ["必要な増幅率","100〜200 倍（12 bit で 0.1 ℃ を狙うなら）"],
              ["直線性","そこそこ。多項式補正が要る"],
              ["確度","±1.5 ℃ 級（クラス 1）"]];
        desc="<b>広い温度範囲（−200〜1300 ℃）</b>をカバーできる唯一の実用手段。";
        note="<b>冷接点補償（CJC）が必須。</b>熱電対が測るのは「測定点と端子台の温度差」でしかない。端子台の温度を別のセンサで測って足す。<b>端子台と CJC センサを熱的に密着させること</b>が精度を決める。";
      }else{
        var slope2=2.5e-3,V4=0.76+slope2*(T-25);
        sens=slope2;
        rows=[["出力電圧",f(V4,4)+" V（代表例）"],
              ["感度",f(sens*1e3,1)+" mV/℃"],
              ["1 LSB 相当",f(lsb/sens,3)+" ℃"],
              ["直線性","良い"],
              ["確度","<b>±1〜±5 ℃</b>（工場校正値を使えば ±1 ℃ 級）"]];
        desc="追加部品ゼロ。<b>ただし測っているのはチップの温度であって、周囲温度ではない</b>。";
        note="<b>工場校正値が Flash に格納されている</b>ことが多い。それを使わないと ±5 ℃ 級の誤差になる。自己発熱の影響を受けるので、<b>スリープ直後に測る</b>と外気温に近い値が得られる。";
      }
      var h=blk("特徴",'<div style="color:var(--ink)">'+desc+'</div>',it.c);
      h+=blk("この温度・分解能での値",tbl(["項目","値"],rows),it.c);
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+note+'</div>';
      return h;
    }
    pk=picker(el,A,body);
    function upd(){
      sT.val.textContent=(+sT.input.value)+" ℃";
      sR.val.textContent=(+sR.input.value)+" bit";
      pk.redraw();
      out.innerHTML='<b>センサ単体の確度と、読み取り系（ADC・基準電圧・配線・増幅）の誤差は別々に積み上げる。</b>'+
        ' ／ 分解能（1 LSB 相当の温度）が確度より細かくても、<b>それは精度ではない</b>'+
        ' ／ <b>比率測定（ratiometric）が使えるのは NTC/RTD の分圧構成だけ</b>——'+
        '熱電対のような絶対電圧出力では、基準電圧の精度がそのまま効く（17 章）';
    }
    [sT,sR].forEach(function(s){s.input.addEventListener("input",upd);});
    upd();
  };

  /* ---------- 11: CMOS インバータ ---------- */
  REG.cmosinv=function(el){
    head(el,"CMOS Inverter","遷移領域だけで貫通電流が流れる");
    var r=ctrls(el);
    var sV=slider(r,"V_DD [V]",1.0,5.0,3.3,0.1);
    var sVt=slider(r,"|V_th| [V]",0.2,1.5,0.7,0.05);
    var sR=slider(r,"β_n/β_p 比",0.2,5,2,0.1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var V=+sV.input.value,Vt=+sVt.input.value,br=+sR.input.value;
      sV.val.textContent=f(V,1)+" V";sVt.val.textContent=f(Vt,2)+" V";sR.val.textContent=f(br,1);
      var c=chart(cc,0,V,0,V*1.05,{l:52,b:30,t:18});
      grid(c,5);axis(c);var ctx=c.ctx;
      for(var e=0;e<=5;e++){var xv=V*e/5;lab(ctx,f(xv,1),c.X(xv),c.h-c.p.b+16,C("--faint"),"center",10);}
      for(var q=0;q<=5;q++){var yv=V*q/5;lab(ctx,f(yv,1)+"V",c.p.l-6,c.Y(yv)+4,C("--faint"),"right",10);}
      lab(ctx,"V_in",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      lab(ctx,"V_out",c.p.l,c.p.t-4,C("--muted"),"left",10);
      /* VTC を数値で解く: In(Vin,Vout) = Ip(Vin,Vout) */
      function In(vi,vo){var ov=vi-Vt;if(ov<=0)return 0;return vo<ov?br*(ov*vo-vo*vo/2):br*ov*ov/2;}
      function Ip(vi,vo){var ov=(V-vi)-Vt;if(ov<=0)return 0;var vsd=V-vo;
        return vsd<ov?(ov*vsd-vsd*vsd/2):ov*ov/2;}
      var P=[],Ish=[],imax=1e-9,Vm=V/2;
      for(var i=0;i<=200;i++){
        var vi=V*i/200,lo=0,hi=V;
        for(var k=0;k<60;k++){var mid=(lo+hi)/2;
          if(In(vi,mid)>Ip(vi,mid))hi=mid;else lo=mid;}
        var vo=(lo+hi)/2;
        P.push([vi,vo]);
        var ii=Math.min(In(vi,vo),Ip(vi,vo));
        Ish.push([vi,ii]);imax=Math.max(imax,ii);
        if(Math.abs(vo-vi)<Math.abs(Vm-V/2)+1e9){}
      }
      /* スイッチング閾値 = VTC と y=x の交点 */
      var Vth=V/2;
      for(var m=1;m<P.length;m++){if((P[m-1][1]-P[m-1][0])*(P[m][1]-P[m][0])<=0){Vth=P[m][0];break;}}
      /* 貫通電流を影で */
      ctx.fillStyle=C("--alias-soft");
      ctx.beginPath();ctx.moveTo(c.X(0),c.Y(0));
      Ish.forEach(function(q2){ctx.lineTo(c.X(q2[0]),c.Y(q2[1]/imax*V*0.45));});
      ctx.lineTo(c.X(V),c.Y(0));ctx.closePath();ctx.fill();
      line(c,P,C("--signal"),2.8);
      /* y = x */
      ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(c.X(0),c.Y(0));ctx.lineTo(c.X(V),c.Y(V));ctx.stroke();ctx.setLineDash([]);
      var xs=c.X(Vth);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(xs,c.p.t);ctx.lineTo(xs,c.h-c.p.b);ctx.stroke();
      lab(ctx,"V_M = "+f(Vth,2)+" V",xs+5,c.p.t+12,C("--alias"),"left",10);
      lab(ctx,"貫通電流（相対）",c.X(Vth),c.h-c.p.b-8,C("--alias"),"center",10);
      var vil=0,vih=V;
      for(var n2=1;n2<P.length;n2++){
        var sl=(P[n2][1]-P[n2-1][1])/(P[n2][0]-P[n2-1][0]);
        if(sl<-1&&vil===0)vil=P[n2-1][0];
        if(sl>-1&&vil!==0&&vih===V&&P[n2][0]>vil)vih=P[n2][0];
      }
      out.innerHTML='スイッチング閾値 <b>V<sub>M</sub> = '+f(Vth,2)+' V</b>（V<sub>DD</sub> の '+f(100*Vth/V,0)+' %）'+
        ' ／ β<sub>n</sub>/β<sub>p</sub> を上げる（NMOS を強くする）と <b>V<sub>M</sub> が下がる</b>'+
        ' ／ 正確に V<sub>DD</sub>/2 にするには β<sub>n</sub> = β<sub>p</sub>、'+
        'つまり<b>移動度差を補うため PMOS の幅を NMOS の 2〜3 倍</b>にする'+
        ' ／ <b>入力が中間電位のときだけ、NMOS と PMOS が同時に ON して貫通電流が流れる</b>（網掛け）'+
        ' ／ これが「<b>CMOS 入力を開放にしてはいけない</b>」「<b>入力の立ち上がりを鈍らせすぎてはいけない</b>」理由である'+
        ' ／ 静的には電流が流れないのが CMOS の利点だが、<b>遷移の瞬間だけは例外</b>';
    }
    [sV,sVt,sR].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 11: 複合ゲート ---------- */
  REG.cmosgate=function(el){
    head(el,"Complex Gates","PDN が論理、PUN はその双対");
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"インバータ",c:"--signal",tr:2,f:"Y = A&#772;",
       pdn:"NMOS 1 個（A）",pun:"PMOS 1 個（A）",
       art:["   VDD","    │","   ‖ P(A)","    ├── Y","   ‖ N(A)","    │","   GND"],
       tt:[["A","Y"],["0","1"],["1","0"]],
       note:"すべての基本。<b>CMOS ロジックは必ず出力が反転する</b>——PDN が導通すると出力は L になるから。"},
      {n:"NAND2",c:"--signal",tr:4,f:"Y = (A·B)&#772;",
       pdn:"NMOS <b>直列</b> 2 個",pun:"PMOS <b>並列</b> 2 個",
       art:["   VDD","    ├──┬──","   ‖P(A) ‖P(B)   ← 並列","    ├──┴──┤","         Y","   ‖ N(A)        ← 直列","   ‖ N(B)","    │","   GND"],
       tt:[["A","B","Y"],["0","0","1"],["0","1","1"],["1","0","1"],["1","1","0"]],
       note:"<b>NAND が CMOS の標準ゲートである。</b>直列になるのが NMOS 側で、NMOS は PMOS より強いので面積・速度の点で NOR より有利。"},
      {n:"NOR2",c:"--blue",tr:4,f:"Y = (A+B)&#772;",
       pdn:"NMOS <b>並列</b> 2 個",pun:"PMOS <b>直列</b> 2 個",
       art:["   VDD","   ‖ P(A)        ← 直列","   ‖ P(B)","    ├── Y","    ├──┬──","   ‖N(A) ‖N(B)   ← 並列","    ├──┴──","   GND"],
       tt:[["A","B","Y"],["0","0","1"],["0","1","0"],["1","0","0"],["1","1","0"]],
       note:"PMOS が直列になるので<b>遅い</b>。同じ速度を出すには PMOS を大きくする必要があり、面積が増える。<b>合成ツールが NAND を好むのはこのため。</b>"},
      {n:"AOI21",c:"--signal",tr:6,f:"Y = (A·B + C)&#772;",
       pdn:"（A 直列 B）と C の <b>並列</b>",pun:"（A 並列 B）と C の <b>直列</b>",
       art:["   VDD","   ‖P(A) ‖P(B)  ← 並列","    └──┬──┘","   ‖ P(C)       ← 直列","    ├── Y","    ├────┬","   ‖N(A)  ‖N(C)","   ‖N(B)   │   ← (A·B) ∥ C","    ├────┴","   GND"],
       tt:[["A","B","C","Y"],["0","0","0","1"],["1","1","0","0"],["0","0","1","0"],["1","1","1","0"]],
       note:"<b>AND-OR-Invert。</b>個別のゲートを並べるより<b>トランジスタが少なく速い</b>。ライブラリに必ず入っている。"},
      {n:"XOR2",c:"--alias",tr:"8〜12",f:"Y = A ⊕ B",
       pdn:"複合、または伝送ゲート構成",pun:"同左",
       art:["  伝送ゲート方式（6 Tr）:","","   A ──┬──[TG(B)]──┬── Y","       │             │","       └──[TG(B&#772;)]──┘","          （A&#772; 側）"],
       tt:[["A","B","Y"],["0","0","0"],["0","1","1"],["1","0","1"],["1","1","0"]],
       note:"<b>XOR は CMOS にとって高価なゲートである。</b>加算器が遅く大きいのはこれが理由。伝送ゲートを使う実装もあるが、<b>信号が減衰する・駆動能力がない</b>という弱点がある。"}
    ];
    picker(el,A,function(it){
      var h=blk("論理式",'<div style="font-family:var(--mono);color:var(--ink);font-size:1rem">'+it.f+'</div>',it.c);
      h+=blk("構成",tbl(["項目","内容"],[["プルダウン網 (PDN)",it.pdn],["プルアップ網 (PUN)",it.pun],["トランジスタ数",it.tr+" 個"]]),it.c);
      h+=blk("回路",'<pre style="margin:0;font-family:var(--mono);font-size:.76rem;line-height:1.5;color:var(--muted);white-space:pre">'+
        esc(it.art.join("\n"))+'</pre>',"--muted");
      h+=blk("真理値表",tbl(it.tt[0],it.tt.slice(1),it.tt[0].map(function(){return "center";})),it.c);
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+it.note+'</div>';
      return h;
    });
    out.innerHTML='<b>作り方の規則はたった 1 つ: 「PDN に論理式をそのまま組み、PUN はその双対（直列↔並列）にする」。</b>'+
      ' AND は直列、OR は並列'+
      ' ／ <b>CMOS の出力は必ず反転する</b>ので、AND や OR を作るにはインバータが 1 段余分に要る'+
      '（＝ NAND/NOR のほうが安い）'+
      ' ／ <b>直列に積む段数は 3〜4 段まで</b>。それ以上は抵抗が直列に増えて極端に遅くなる';
  };

  /* ---------- 11: 消費電力の内訳 ---------- */
  REG.cmospower=function(el){
    head(el,"CMOS Power","P = αCV²f と、消えないリーク");
    var r=ctrls(el);
    var sV=slider(r,"V_DD [V]",0.8,5.0,3.3,0.1);
    var sF=slider(r,"クロック [MHz]",1,500,80,1);
    var sC=slider(r,"総スイッチ容量 [pF]",10,5000,500,10);
    var sA=slider(r,"活性化率 α",0.01,1,0.15,0.01);
    var sL=slider(r,"リーク電流 @1.2V [µA]",0.1,10000,100,0.1);
    var cv=screen(el,220),cc=cctx(cv),out=readout(el);
    function draw(){
      var V=+sV.input.value,fq=+sF.input.value*1e6,Cf=+sC.input.value*1e-12,
          al=+sA.input.value,Il=+sL.input.value*1e-6;
      sV.val.textContent=f(V,1)+" V";sF.val.textContent=f(fq/1e6,0)+" MHz";
      sC.val.textContent=f(Cf*1e12,0)+" pF";sA.val.textContent=f(al,2);
      sL.val.textContent=(Il*1e6<1000?f(Il*1e6,1)+" µA":f(Il*1e3,2)+" mA");
      var Pdyn=al*Cf*V*V*fq;
      var Psc=0.08*Pdyn;                       /* 貫通電流ぶん（概算 8 %） */
      var Ileak=Il*Math.exp((V-1.2)/0.9);      /* DIBL 的に電圧で増える近似 */
      var Pleak=V*Ileak;
      var Ptot=Pdyn+Psc+Pleak;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var items=[["動的（αCV²f）",Pdyn,"--signal"],["貫通電流",Psc,"--alias"],["リーク",Pleak,"--blue"]];
      var padL=110,padT=26,bh=30,gap=14;
      var mx=Math.max(Ptot,1e-9);
      items.forEach(function(it,i){
        var y=padT+i*(bh+gap);
        lab(ctx,it[0],padL-8,y+bh/2+4,C("--muted"),"right",11);
        var BW=Math.max(60,w-padL-150);
        ctx.fillStyle=C("--screen");rrect(ctx,padL,y,BW,bh,5);ctx.fill();
        var ww=BW*it[1]/mx;
        ctx.fillStyle=C(it[2]);rrect(ctx,padL,y,Math.max(2,ww),bh,5);ctx.fill();
        var pw=it[1];
        lab(ctx,(pw<1e-3?f(pw*1e6,1)+" µW":pw<1?f(pw*1e3,2)+" mW":f(pw,3)+" W")+
          "（"+f(100*pw/Ptot,1)+"%）",padL+BW+8,y+bh/2+4,C("--ink"),"left",10);
      });
      lab(ctx,"合計 "+(Ptot<1?f(Ptot*1e3,2)+" mW":f(Ptot,3)+" W"),padL,h-12,C("--ink"),"left",12);
      /* 電圧を半分にした場合 */
      var Pd2=al*Cf*(V/2)*(V/2)*fq;
      out.innerHTML='動的電力 <b>P = α·C·V<sub>DD</sub>²·f = '+(Pdyn<1?f(Pdyn*1e3,2)+" mW":f(Pdyn,3)+" W")+'</b>'+
        ' ／ リーク <b>'+(Pleak<1e-3?f(Pleak*1e6,1)+" µW":f(Pleak*1e3,3)+" mW")+'</b>'+
        '（全体の '+f(100*Pleak/Ptot,1)+' %）'+
        ' ／ <b>電圧が 2 乗で効く</b>——V<sub>DD</sub> を半分にすると動的電力は '+
        f(100*Pd2/Pdyn,0)+' %（1/4）になる。<b>周波数を半分にしても半分にしかならない</b>'+
        ' ／ だから低消費電力設計では <b>DVFS（電圧と周波数を同時に下げる）</b>が使われる'+
        ' ／ <b>クロックを止めても（f=0）、リークは残る。</b>'+
        '本気で下げるには<b>電源を切る（パワーゲーティング）</b>しかない'+
        ' ／ リークは<b>温度で指数関数的に増える</b>——85 ℃ では常温の 10 倍以上になることもある';
    }
    [sV,sF,sC,sA,sL].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 12: タイミング制約 ---------- */
  REG.timing=function(el){
    head(el,"Setup / Hold","セットアップは直せる、ホールドは直せない");
    var r=ctrls(el);
    var sF=slider(r,"CLK 周波数 [MHz]",1,500,100,1);
    var sCQ=slider(r,"t_cq [ns]",0.1,5,0.8,0.1);
    var sL=slider(r,"組合せ論理の遅延 [ns]",0.1,20,5,0.1);
    var sSU=slider(r,"t_setup [ns]",0.1,3,0.5,0.05);
    var sH=slider(r,"t_hold [ns]",0,2,0.3,0.05);
    var sSK=slider(r,"スキュー [ns]",-2,2,0,0.05);
    var cv=screen(el,230),cc=cctx(cv),out=readout(el);
    function draw(){
      var fq=+sF.input.value*1e6,tcq=+sCQ.input.value,tl=+sL.input.value,
          tsu=+sSU.input.value,th=+sH.input.value,sk=+sSK.input.value;
      var T=1e9/fq;
      sF.val.textContent=f(fq/1e6,0)+" MHz";
      sCQ.val.textContent=f(tcq,2)+" ns";sL.val.textContent=f(tl,2)+" ns";
      sSU.val.textContent=f(tsu,2)+" ns";sH.val.textContent=f(th,2)+" ns";
      sSK.val.textContent=(sk>=0?"+":"")+f(sk,2)+" ns";
      var setupSlack=T+sk-(tcq+tl+tsu);
      var holdSlack=(tcq+tl)-(th+sk);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=96,padT=22,rows=4,rh=(h-padT-46)/rows;
      var tmax=Math.max(T*1.35,tcq+tl+tsu+1);
      function X(t){return padL+t/tmax*(w-padL-18);}
      var names=["CLK（送信 FF）","CLK（受信 FF）","Q（送信）","D（受信）"];
      for(var k=0;k<rows;k++){
        var y0=padT+k*rh,y1=y0+rh-10;
        lab(ctx,names[k],padL-8,(y0+y1)/2+4,C("--muted"),"right",10);
        ctx.strokeStyle=C(k<2?"--blue":"--signal");ctx.lineWidth=2;
        ctx.beginPath();
        if(k<2){
          var off=k===1?sk:0;
          ctx.moveTo(X(0+off),y1);ctx.lineTo(X(0+off),y0);ctx.lineTo(X(T/2+off),y0);
          ctx.lineTo(X(T/2+off),y1);ctx.lineTo(X(T+off),y1);ctx.lineTo(X(T+off),y0);
          ctx.lineTo(X(Math.min(tmax,T*1.5+off)),y0);
        }else{
          var dly=(k===2?tcq:tcq+tl);
          ctx.moveTo(X(0),y1);ctx.lineTo(X(dly),y1);ctx.lineTo(X(dly),y0);ctx.lineTo(X(tmax),y0);
        }
        ctx.stroke();
      }
      /* セットアップ窓／ホールド窓（受信 FF の次のエッジ） */
      var edge=T+sk;
      ctx.fillStyle=C("--alias-soft");
      ctx.fillRect(X(Math.max(0,edge-tsu)),padT,Math.max(1,X(edge)-X(Math.max(0,edge-tsu))),h-padT-46);
      ctx.fillStyle=C("--signal-soft");
      ctx.fillRect(X(edge),padT,Math.max(1,X(edge+th)-X(edge)),h-padT-46);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(X(edge),padT);ctx.lineTo(X(edge),h-46);ctx.stroke();
      lab(ctx,"取り込みエッジ",X(edge)+4,padT+10,C("--alias"),"left",10);
      lab(ctx,"setup",X(edge)-4,h-52,C("--alias"),"right",9);
      lab(ctx,"hold",X(edge)+4,h-52,C("--signal"),"left",9);
      /* データ到着 */
      var arr=tcq+tl;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.2;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(X(arr),padT);ctx.lineTo(X(arr),h-46);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"データ到着 "+f(arr,2)+" ns",X(arr)+4,h-32,C("--signal"),"left",10);
      var fmax=1e3/(tcq+tl+tsu-sk);
      out.innerHTML='<b>セットアップ余裕 = T + skew − (t<sub>cq</sub> + t<sub>logic</sub> + t<sub>su</sub>) = '+
        f(setupSlack,2)+' ns</b> '+(setupSlack<0?'<span class="warn">違反</span>':'<span class="ok">OK</span>')+
        ' ／ <b>ホールド余裕 = (t<sub>cq</sub> + t<sub>logic</sub>) − (t<sub>hold</sub> + skew) = '+
        f(holdSlack,2)+' ns</b> '+(holdSlack<0?'<span class="warn">違反</span>':'<span class="ok">OK</span>')+
        ' ／ 動作可能な最高周波数 <b>'+f(fmax,1)+' MHz</b>'+
        ' ／ <b>クロック周波数を下げてみること</b>——セットアップ余裕は増えるが、'+
        '<b>ホールド余裕は式に T が入っていないので一切変わらない</b>'+
        ' ／ ホールド違反の原因は<b>論理が短すぎる</b>か<b>スキューが大きすぎる</b>こと。'+
        '直すにはバッファを挿入するかクロック配線をやり直すしかない'+
        ' ／ スキューを動かしてみると、<b>片方を改善するともう片方が悪化する</b>ことが分かる';
    }
    [sF,sCQ,sL,sSU,sH,sSK].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 12: メタステーブル ---------- */
  REG.metastable=function(el){
    head(el,"Metastability MTBF","待ち時間が指数の肩にいる");
    var r=ctrls(el);
    var sF=slider(r,"クロック周波数 [MHz]",1,500,100,1);
    var sD=slider(r,"データ変化頻度 [kHz]",1,10000,1000,1);
    var sT=slider(r,"整定時間 t_r [ns]",0.1,20,3,0.1);
    var sTau=slider(r,"時定数 τ [ps]",20,500,100,1);
    var sSt=slider(r,"シンクロナイザ段数",1,4,2,1);
    var cv=screen(el,230),cc=cctx(cv),out=readout(el);
    var T0=1e-9;
    function draw(){
      var fc=+sF.input.value*1e6,fd=+sD.input.value*1e3,tr=+sT.input.value*1e-9,
          tau=+sTau.input.value*1e-12,st=+sSt.input.value;
      sF.val.textContent=f(fc/1e6,0)+" MHz";sD.val.textContent=f(fd/1e3,0)+" kHz";
      sT.val.textContent=f(tr*1e9,1)+" ns";sTau.val.textContent=f(tau*1e12,0)+" ps";
      sSt.val.textContent=st+" 段";
      /* 段数を増やすと使える時間が (st-1) クロック分増える */
      var Tclk=1/fc, ttot=tr+(st-1)*Tclk;
      function mtbf(t){return Math.exp(t/tau)/(T0*fc*fd);}
      var M=mtbf(ttot);
      var ymax=Math.max(2,Math.log10(mtbf(ttot))*1.06);
      var c=chart(cc,0,Math.max(1,ttot*1e9*1.3),-6,ymax,{l:64,b:44,t:24});
      grid(c,6);axis(c);var ctx=c.ctx;
      var stepY=Math.max(2,Math.ceil((ymax+6)/6/2)*2);
      for(var yv=-6;yv<=ymax;yv+=stepY)
        lab(ctx,"10^"+yv+" 秒",c.p.l-6,c.Y(yv)+4,C("--faint"),"right",10);
      for(var e3=0;e3<=4;e3++){var xt3=c.x1*e3/4;
        lab(ctx,f(xt3,1),c.X(xt3),c.h-c.p.b+16,C("--faint"),e3===4?"right":e3===0?"left":"center",10);}
      lab(ctx,"整定に使える時間 [ns]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      lab(ctx,"MTBF",c.p.l-6,c.p.t-8,C("--muted"),"right",10);
      /* 1 年ライン */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(Math.log10(3.15e7)));ctx.lineTo(c.w-c.p.r,c.Y(Math.log10(3.15e7)));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"1 年",c.w-c.p.r-4,c.Y(Math.log10(3.15e7))-5,C("--alias"),"right",10);
      var P=[];for(var i=0;i<=200;i++){var t=c.x1*1e-9*i/200;
        P.push([t*1e9,Math.max(-6,Math.min(ymax,Math.log10(mtbf(t))))]);}
      line(c,P,C("--signal"),2.8);
      var xx=c.X(ttot*1e9);
      if(xx>c.p.l&&xx<c.w-c.p.r){
        ctx.strokeStyle=C("--blue");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(xx,c.p.t);ctx.lineTo(xx,c.h-c.p.b);ctx.stroke();
        lab(ctx,st+" 段構成",xx+4,c.p.t+12,C("--blue"),"left",10);
      }
      function human(s){
        if(s<1)return f(s*1e3,2)+" ms";
        if(s<3600)return f(s,1)+" 秒";
        if(s<86400)return f(s/3600,1)+" 時間";
        if(s<3.15e7)return f(s/86400,1)+" 日";
        if(s<3.15e10)return f(s/3.15e7,1)+" 年";
        if(s<3.15e13)return f(s/3.15e7,0)+" 年";
        return "10^"+f(Math.log10(s/3.15e7),1)+" 年";
      }
      var M1=mtbf(tr);
      out.innerHTML='MTBF = e^(t/τ) / (T<sub>0</sub>·f<sub>clk</sub>·f<sub>data</sub>)'+
        ' ／ <b>'+st+' 段で使える整定時間 '+f(ttot*1e9,2)+' ns → MTBF ≈ '+human(M)+'</b>'+
        ' ／ 参考: 1 段だけなら '+human(M1)+
        ' ／ <b>t が指数の肩にいる。</b>時間が τ ぶん増えるだけで MTBF が e 倍（2.7 倍）になる'+
        ' ／ 段数を 1 → 2 にすると<b>クロック 1 周期ぶんの時間が丸ごと増える</b>ので、'+
        'MTBF が桁で改善する。<b>2 段が標準</b>なのはこのため'+
        ' ／ 逆に <b>クロックを上げると 2 重に悪化する</b>（f<sub>clk</sub> が分母、かつ使える時間が減る）'+
        ' ／ <b>「起きるかどうか」ではなく「どれだけ続くか」の問題である。</b>'+
        'メタステーブル状態そのものは必ず発生する';
    }
    [sF,sD,sT,sTau,sSt].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };
  /* ---------- 13: メモリセルの構造比較 ---------- */
  REG.memcell=function(el){
    head(el,"Memory Cells","1 ビットを何で覚えているか");
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"SRAM 6T",c:"--signal",hold:"回路の状態（正帰還）",
       art:["    VDD          VDD","     │            │","   ‖M2         ‖M4","     │            │","  Q ─┼──────╳─────┼─ QB","     │     たすき掛け│","   ‖M1         ‖M3","     │            │","    GND          GND","","  WL ─┬───────────┬─","    ‖M5        ‖M6","     BL          BLB"],
       rows:[["セル面積","<b>120〜150 F²</b>（最も大きい）"],["アクセス時間","<b>1〜10 ns</b>（最速）"],
             ["保持","電源が入っている限り無限"],["書き換え耐性","<b>無限</b>"],
             ["待機電力","リーク電流のみ（微細化で無視できなくなる）"],
             ["製造","<b>普通の CMOS で作れる → MCU に内蔵できる</b>"]],
       note:"読み出しは <b>BL/BLB の数十 mV の差</b>をセンスアンプで判定する。フルスイングを待たないので速い。<b>読み出しでセルが反転しないよう、M1 を M5 より強くする（βレシオ）。</b>"},
      {n:"DRAM 1T1C",c:"--blue",hold:"キャパシタの電荷",
       art:["       WL","        │","     ───┼───","       ‖ M","        │","  BL ───┴──┬","           ═╪═ Cs ≈ 25 fF","            │","           GND"],
       rows:[["セル面積","<b>約 6 F²</b>（SRAM の 1/20）"],["アクセス時間","行を開けるのに数十 ns"],
             ["保持","<b>約 64 ms</b>。リフレッシュが必要"],["書き換え耐性","無限"],
             ["読み出し","<b>破壊読み出し</b>。読んだら必ず書き戻す（リストア）"],
             ["製造","<b>専用の深溝／積層キャパシタ工程 → MCU に内蔵しにくい</b>"]],
       note:"読み出しは電荷分配。ΔV = C<sub>s</sub>/(C<sub>s</sub>+C<sub>BL</sub>)·(V<sub>cell</sub>−V<sub>DD</sub>/2) ≈ <b>55 mV</b> しかない。<b>だから 1 本のビット線に繋げるセル数に上限がある。</b>"},
      {n:"NOR Flash",c:"--signal",hold:"絶縁膜に閉じ込めた電荷",
       art:["        コントロールゲート","  ─────────────────────","  ▒▒▒ ONO 絶縁膜 ▒▒▒","  ─────────────────────","      フローティングゲート","  ▒▒ トンネル酸化膜 8-10nm ▒▒","  ─────────────────────","   n+ │   p 基板   │ n+","","  各セルが BL に直接つながる"],
       rows:[["セル面積","中（各セルにコンタクトが要る）"],["読み出し","<b>ランダム読み出し可・数十 ns</b>"],
             ["XIP（直接実行）","<b>可能 → MCU のコード領域はこれ</b>"],
             ["書き込み単位","ワード〜ページ"],["消去単位","<b>セクタ 4〜64 KB</b>"],
             ["書き換え耐性","10⁴〜10⁵ 回"]],
       note:"書き込み・消去には <b>15〜20 V</b> が要る（内蔵チャージポンプ）。<b>だから遅く、消費電流が跳ね、書き込み中は同じバンクを読めない。</b>"},
      {n:"NAND Flash",c:"--blue",hold:"絶縁膜に閉じ込めた電荷",
       art:["        BL","         │","      ─┤├─ 選択Tr","  WL0 ─┤├─","  WL1 ─┤├─   ← 直列に数十個","  WL2 ─┤├─","   ⋮    ⋮","  WL63 ┤├─","      ─┤├─","        GND"],
       rows:[["セル面積","<b>最小</b>（直列なのでコンタクトが少ない）"],
             ["読み出し","<b>ページ単位・数十 µs</b>。ランダム読み出し不可"],
             ["XIP","<b>不可</b>（RAM にコピーが必要）"],
             ["書き込み単位","ページ 2〜16 KB"],["消去単位","<b>ブロック 数百 KB〜数 MB</b>"],
             ["書き換え耐性","SLC 10⁴／MLC 3×10³／TLC 10³／QLC 数百"]],
       note:"<b>ビットエラーが出る前提で設計されている。</b>ECC（BCH/LDPC）・ウェアレベリング・不良ブロック管理が必須。出荷時点で不良ブロックが存在する。"},
      {n:"EEPROM",c:"--muted",hold:"絶縁膜に閉じ込めた電荷（2T）",
       art:["   選択Tr    セルTr","    ‖        ‖(FG)","    └────────┘","","  バイトごとに選択Trを持つ","  → バイト単位で消去できる","  → その代わり面積が倍"],
       rows:[["セル面積","Flash の 2〜3 倍"],["消去単位","<b>バイト</b>"],
             ["書き換え耐性","<b>10⁵〜10⁶ 回</b>"],["容量","数百 B〜数十 KB"],
             ["単価","高い"],["用途","設定値・校正値・シリアル番号"]],
       note:"原理は Flash と同じ。<b>違いは「バイトごとに選択トランジスタを付けたか」だけ。</b>最近の MCU は EEPROM を積まず、<b>Flash の 2 セクタを使ったエミュレーション</b>で代替することが多い。"},
      {n:"FRAM",c:"--alias",hold:"強誘電体の分極方向",
       art:["      プレート線","        │","      ═╪═ 強誘電体キャパシタ","        │        （分極の向きで記憶）","     ───┼───","       ‖ M","        │","       BL"],
       rows:[["セル面積","DRAM より大きい"],["書き込み","<b>RAM 並に速い（数十 ns）</b>"],
             ["書き換え耐性","<b>10¹²〜10¹⁴ 回</b>"],["保持","不揮発（10 年〜）"],
             ["消費エネルギー","<b>Flash の 1/100 以下</b>"],
             ["読み出し","<b>破壊読み出し</b>（DRAM 同様、書き戻す）"]],
       note:"<b>ログを取り続ける用途で Flash の寿命問題が消える。</b>書き込みが速いので、電源断でデータが中途半端にならない。弱点は容量と単価。"}
    ];
    picker(el,A,function(it){
      var h=blk("何で覚えているか",'<div style="color:var(--ink)">'+it.hold+'</div>',it.c);
      h+=blk("セル構造",'<pre style="margin:0;font-family:var(--mono);font-size:.74rem;line-height:1.45;color:var(--muted);white-space:pre">'+
        esc(it.art.join("\n"))+'</pre>',"--muted");
      h+=blk("構造から出てくる性質",tbl(["項目","内容"],it.rows),it.c);
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+it.note+'</div>';
      return h;
    });
    out.innerHTML='<b>「速い・大きい・消えない」は同時に成立しない。</b>'+
      ' 回路で覚えれば速いが 6 トランジスタ要る、電荷で覚えれば小さいが漏れる、'+
      '絶縁膜に閉じ込めれば消えないが高電圧と時間が要る'+
      ' ／ <b>メモリ階層（レジスタ → キャッシュ → RAM → Flash）が存在するのは、この三すくみが物理的に解けないから</b>である';
  };

  /* ---------- 13: Flash の摩耗 ---------- */
  REG.flashwear=function(el){
    head(el,"Wear & Write Amplification","書いた量より多く書いている");
    var r=ctrls(el);
    var sE=slider(r,"消去ブロックサイズ [KB]",4,512,64,4);
    var sW=slider(r,"1 回に書くデータ [B]",4,4096,64,4);
    var sR=slider(r,"書き込み間隔 [秒]",0.1,3600,60,0.1);
    var sC=slider(r,"書き換え耐性 [回]",1000,1000000,10000,1000);
    var sT=slider(r,"総容量 [KB]",8,4096,128,8);
    var mode=select(r,"方式",["ウェアレベリングなし（同じブロックを消去）","追記＋ウェアレベリング"]);
    var cv=screen(el,200),cc=cctx(cv),out=readout(el);
    function draw(){
      var EB=+sE.input.value*1024,WB=+sW.input.value,iv=+sR.input.value,
          cyc=+sC.input.value,tot=+sT.input.value*1024,md=+mode.value;
      sE.val.textContent=f(EB/1024,0)+" KB";sW.val.textContent=f(WB,0)+" B";
      sR.val.textContent=(iv<60?f(iv,1)+" 秒":iv<3600?f(iv/60,1)+" 分":f(iv/3600,1)+" 時間");
      sC.val.textContent=f(cyc/1000,0)+"k 回";sT.val.textContent=f(tot/1024,0)+" KB";
      var blocks=Math.max(1,Math.floor(tot/EB));
      var WA, erasesPerWrite, life;
      if(md===0){
        WA=EB/WB;                          /* 毎回ブロック消去 */
        erasesPerWrite=1;
        life=cyc*iv;                       /* 秒 */
      }else{
        var writesPerBlock=Math.floor(EB/Math.max(4,WB));
        WA=1+EB/(writesPerBlock*WB);       /* 追記でブロックを埋め、たまに消去 */
        erasesPerWrite=1/writesPerBlock;
        life=cyc*blocks*writesPerBlock*iv;
      }
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      /* ブロック並べ */
      var n=Math.min(blocks,64),cols=Math.min(16,n),rows2=Math.ceil(n/cols);
      var bw=Math.min(30,(w-40)/cols-4),bh2=Math.min(22,(h-70)/rows2-4);
      for(var i=0;i<n;i++){
        var cx=20+(i%cols)*(bw+4),cy=26+Math.floor(i/cols)*(bh2+4);
        var used=md===0?(i===0?1:0):1;
        ctx.fillStyle=used?C("--signal"):C("--screen");
        rrect(ctx,cx,cy,bw,bh2,3);ctx.fill();
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.stroke();
      }
      lab(ctx,md===0?"消去が 1 ブロックに集中している":"全 "+blocks+" ブロックに分散している",
        20,18,C(md===0?"--alias":"--signal"),"left",11);
      function human(s){
        if(s<3600)return f(s/60,1)+" 分";
        if(s<86400)return f(s/3600,1)+" 時間";
        if(s<3.15e7)return f(s/86400,1)+" 日";
        return f(s/3.15e7,1)+" 年";
      }
      lab(ctx,"予想寿命: "+human(life),20,h-14,C(life<3.15e7?"--alias":"--signal"),"left",13);
      out.innerHTML='<b>Write Amplification ≈ '+f(WA,1)+' 倍</b>'+
        '（'+f(WB,0)+' B 書くのに実際は '+f(WB*WA/1024,1)+' KB 相当を消去・書き込みしている）'+
        ' ／ 予想寿命 <b>'+human(life)+'</b>'+
        (life<3.15e7?' ／ <span class="warn">1 年もたない</span>':' ／ <span class="ok">実用範囲</span>')+
        ' ／ <b>Flash は 1→0 しか書けず、0→1 に戻すにはブロック消去しかない。</b>'+
        'だから上書きができず、<b>ログ構造 + ガベージコレクション + ウェアレベリング</b>が必要になる'+
        ' ／ 方式を切り替えてみること——<b>同じ書き込み頻度でも、分散するかどうかで桁が変わる</b>'+
        ' ／ 頻繁に書くなら <b>FRAM か外付け EEPROM</b>、'+
        'あるいは <b>RAM にためて電源断検出時に書く</b>のが正解';
    }
    [sE,sW,sR,sC,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    mode.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 13: メモリ階層 ---------- */
  REG.memhier=function(el){
    head(el,"Memory Hierarchy","なぜ階層が必要なのか");
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    var M=[
      {n:"レジスタ",t:0.3,sz:"数百 B",c:"--signal"},
      {n:"L1 キャッシュ / 密結合 RAM",t:1,sz:"16〜64 KB",c:"--signal"},
      {n:"内蔵 SRAM",t:3,sz:"4 KB〜1 MB",c:"--signal"},
      {n:"内蔵 Flash（キャッシュあり）",t:8,sz:"32 KB〜2 MB",c:"--blue"},
      {n:"内蔵 Flash（待ちあり）",t:30,sz:"同上",c:"--blue"},
      {n:"外部 SDRAM",t:60,sz:"MB〜GB",c:"--blue"},
      {n:"外部 QSPI NOR",t:200,sz:"MB",c:"--muted"},
      {n:"eMMC / SD（読み）",t:1e5,sz:"GB",c:"--muted"},
      {n:"Flash 書き込み（ページ）",t:5e5,sz:"—",c:"--alias"},
      {n:"Flash ブロック消去",t:5e6,sz:"—",c:"--alias"}
    ];
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=Math.min(210,w*0.44),padT=18,padB=28;
      var rh=(h-padT-padB)/M.length;
      var lmin=Math.log10(0.3),lmax=Math.log10(5e6);
      M.forEach(function(m,i){
        var y=padT+i*rh;
        lab(ctx,m.n,padL-8,y+rh/2+4,C("--muted"),"right",10);
        var frac=(Math.log10(m.t)-lmin)/(lmax-lmin);
        var ww=Math.max(3,(w-padL-84)*frac);
        ctx.fillStyle=C(m.c);rrect(ctx,padL,y+2,ww,rh-6,3);ctx.fill();
        var ts=m.t<1000?f(m.t,1)+" ns":m.t<1e6?f(m.t/1000,1)+" µs":f(m.t/1e6,1)+" ms";
        lab(ctx,ts,padL+ww+6,y+rh/2+4,C("--ink"),"left",10);
      });
      lab(ctx,"アクセス時間（対数スケール）",padL,h-10,C("--faint"),"left",10);
    }
    reg(cv,draw);draw();
    out.innerHTML='<b>レジスタと Flash 消去の間には 7 桁（1000 万倍）の差がある。</b>'+
      ' この差があるから階層が必要になる'+
      ' ／ 実務で効くこと: <b>時間クリティカルな関数は RAM に配置する</b>（Flash の待ちを避ける）、'+
      '<b>Flash アクセラレータ／プリフェッチの設定を確認する</b>、'+
      '<b>Flash 書き込み中は同じバンクを読めない</b>（割り込みハンドラが Flash にあるとハングする）'+
      ' ／ <b>ループの中で Flash の定数テーブルを引くより、起動時に RAM へコピーするほうが速い</b>ことがある';
  };

  /* ---------- 14: LDO ドロップアウトと効率 ---------- */
  REG.ldodrop=function(el){
    head(el,"LDO Dropout","割った瞬間、ただの抵抗になる");
    var r=ctrls(el);
    var sVi=slider(r,"入力電圧 V_IN [V]",1.5,15,5,0.05);
    var sVo=slider(r,"設定出力 V_OUT [V]",1.0,12,3.3,0.05);
    var sI=slider(r,"負荷電流 [mA]",1,2000,300,1);
    var ty=select(r,"パストランジスタ",["PMOS（R_DS(on) 0.2 Ω）","PNP（V_CE(sat) 0.35 V）","NPN ダーリントン（1.7 V）"]);
    var sIq=slider(r,"静止電流 I_Q [µA]",1,10000,50,1);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    function draw(){
      var Vi=+sVi.input.value,Vo=+sVo.input.value,I=+sI.input.value*1e-3,t=+ty.value,Iq=+sIq.input.value*1e-6;
      sVi.val.textContent=f(Vi,2)+" V";sVo.val.textContent=f(Vo,2)+" V";
      sI.val.textContent=f(I*1e3,0)+" mA";sIq.val.textContent=(Iq*1e6<1000?f(Iq*1e6,0)+" µA":f(Iq*1e3,2)+" mA");
      function vdo(i){return t===0?i*0.2:t===1?0.35:1.7;}
      var VDO=vdo(I);
      var Vout=Math.min(Vo,Math.max(0,Vi-VDO));
      var Igr=(t===1)?I/50:Iq;              /* PNP は β=50 のベース電流を捨てる */
      var Ploss=(Vi-Vout)*I+Vi*Igr;
      var eff=Vout*I/(Vout*I+Ploss)*100;
      /* 入力を掃引したグラフ */
      var c=chart(cc,1.5,15,0,Math.max(Vo*1.3,2),{l:56,b:44,t:24});
      grid(c,4);axis(c);var ctx=c.ctx;
      for(var e=2;e<=14;e+=3)lab(ctx,e+" V",c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);
      lab(ctx,"入力電圧 [V]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      for(var q=0;q<=4;q++){var yv=c.y1*q/4;lab(ctx,f(yv,1)+" V",c.p.l-6,c.Y(yv)+4,C("--faint"),"right",10);}
      /* Vin = Vout の線 */
      var PD=[];for(var i=0;i<=100;i++){var v=1.5+13.5*i/100;PD.push([v,Math.min(c.y1,v)]);}
      line(c,PD,C("--faint"),1.2,[4,4]);
      var P=[];for(var j=0;j<=200;j++){var v2=1.5+13.5*j/200;
        P.push([v2,Math.min(Vo,Math.max(0,v2-VDO))]);}
      line(c,P,C("--signal"),2.8);
      var xb=c.X(Vo+VDO);
      if(xb>c.p.l&&xb<c.w-c.p.r){ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(xb,c.p.t);ctx.lineTo(xb,c.h-c.p.b);ctx.stroke();
        lab(ctx,"← ドロップアウト領域",Math.max(c.p.l+4,xb-6),c.p.t+12,C("--alias"),"right",10);}
      dot(c,Vi,Vout,5,C("--blue"));
      lab(ctx,"動作点",Math.min(c.X(Vi)+8,c.w-c.p.r-50),c.Y(Vout)-8,C("--blue"),"left",10);
      var inDO=Vi<Vo+VDO;
      out.innerHTML='ドロップアウト電圧 <b>V<sub>DO</sub> = '+f(VDO*1e3,0)+' mV</b>'+
        (t===0?'（= I × R<sub>DS(on)</sub>、電流に比例する）':t===1?'（V_CE(sat)、ほぼ一定）':'（2V_BE + V_CE(sat)）')+
        ' ／ 必要な最低入力電圧 <b>'+f(Vo+VDO,2)+' V</b>'+
        ' ／ 実際の出力 <b>'+f(Vout,3)+' V</b>'+
        (inDO?' ／ <span class="warn">ドロップアウトを割っている——出力が入力に追従し、PSRR もゼロになる</span>':'')+
        ' ／ 損失 <b>'+f(Ploss,3)+' W</b> ／ 効率 <b>'+f(eff,1)+' %</b>'+
        (t===1?' ／ <span class="warn">PNP はベース電流 '+f(Igr*1e3,1)+' mA を捨てている</span>':'')+
        ' ／ <b>効率は η ≈ V<sub>OUT</sub>/V<sub>IN</sub> でほぼ決まる。</b>電流の工夫では改善しない'+
        ' ／ <b>損失が 1 W を超えるならスイッチングにすること</b>（15 章）'+
        ' ／ リチウム電池（4.2 → 3.0 V）から 3.3 V を作る回路は、'+
        '<b>電池が減ると必ずドロップアウト領域に入る</b>';
    }
    [sVi,sVo,sI,sIq].forEach(function(s){s.input.addEventListener("input",draw);});
    ty.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 14: LDO の安定性 ---------- */
  REG.ldostab=function(el){
    head(el,"LDO Stability","ESR ゼロが位相を戻す");
    var r=ctrls(el);
    var sC=slider(r,"出力容量 C_OUT [µF]",0.1,100,10,0.1);
    var sE=slider(r,"C_OUT の ESR [mΩ]",1,5000,1000,1);
    var sI=slider(r,"負荷電流 [mA]",0.1,1000,100,0.1);
    var sV=slider(r,"出力電圧 [V]",1,5,3.3,0.1);
    var sF=slider(r,"誤差アンプの極 f_p2 [kHz]",10,3000,300,10);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var Co=+sC.input.value*1e-6,ESR=+sE.input.value*1e-3,I=+sI.input.value*1e-3,
          V=+sV.input.value,fp2=+sF.input.value*1e3;
      sC.val.textContent=f(Co*1e6,1)+" µF";
      sE.val.textContent=(ESR*1e3<1000?f(ESR*1e3,0)+" mΩ":f(ESR,2)+" Ω");
      sI.val.textContent=f(I*1e3,1)+" mA";sV.val.textContent=f(V,1)+" V";
      sF.val.textContent=f(fp2/1e3,0)+" kHz";
      var RL=V/I;
      var fp1=1/(TAU*RL*Co), fz=1/(TAU*ESR*Co);
      var A0=1000;                              /* DC ループ利得 */
      function magdb(fq){
        return 20*Math.log10(A0)
          -10*Math.log10(1+Math.pow(fq/fp1,2))
          -10*Math.log10(1+Math.pow(fq/fp2,2))
          +10*Math.log10(1+Math.pow(fq/fz,2));
      }
      function phase(fq){
        return -Math.atan(fq/fp1)*180/Math.PI-Math.atan(fq/fp2)*180/Math.PI
          +Math.atan(fq/fz)*180/Math.PI;
      }
      var lo=0.01,hi=1e9;
      for(var k=0;k<100;k++){var mid=Math.sqrt(lo*hi);if(magdb(mid)>0)lo=mid;else hi=mid;}
      var fx=Math.sqrt(lo*hi),pm=180+phase(fx);
      var c=chart(cc,-1,8,-180,80,{l:52,b:30,t:18});
      grid(c,6);axis(c);var ctx=c.ctx;
      for(var e=-1;e<=8;e++){var t2=e<0?"0.1":e<3?Math.pow(10,e)+"":e<6?Math.pow(10,e-3)+"k":Math.pow(10,e-6)+"M";
        lab(ctx,t2,c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);}
      for(var q=-180;q<=60;q+=60)lab(ctx,q+"",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(0));ctx.lineTo(c.w-c.p.r,c.Y(0));ctx.stroke();
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(-180));ctx.lineTo(c.w-c.p.r,c.Y(-180));ctx.stroke();ctx.setLineDash([]);
      var PM=[],PP=[];
      for(var i=0;i<=300;i++){var lf=-1+9*i/300,fq=Math.pow(10,lf);
        PM.push([lf,Math.max(-180,Math.min(80,magdb(fq)))]);
        PP.push([lf,Math.max(-180,phase(fq))]);}
      line(c,PM,C("--signal"),2.6);
      line(c,PP,C("--blue"),2.0,[5,4]);
      lab(ctx,"ループ利得 [dB]",c.p.l+6,c.p.t+12,C("--signal"),"left",10);
      lab(ctx,"位相 [°]",c.p.l+6,c.p.t+26,C("--blue"),"left",10);
      [[fp1,"f_p1（出力極）","--muted"],[fp2,"f_p2（アンプ極）","--muted"],[fz,"f_z（ESR ゼロ）","--alias"]].forEach(function(m,mi){
        var xx=c.X(Math.log10(m[0]));
        if(xx>c.p.l&&xx<c.w-c.p.r){ctx.strokeStyle=C(m[2]);ctx.lineWidth=1.1;ctx.setLineDash([2,3]);
          ctx.beginPath();ctx.moveTo(xx,c.p.t);ctx.lineTo(xx,c.h-c.p.b);ctx.stroke();ctx.setLineDash([]);
          lab(ctx,m[1],xx+3,c.h-c.p.b-6-(mi%2?12:0),C(m[2]),"left",9);}
      });
      var verd=pm<0?'<span class="warn">発振する</span>':pm<20?'<span class="warn">ほぼ発振</span>':
               pm<45?'<span class="warn">強く振動する</span>':pm<60?'やや振動的':'<span class="ok">安定</span>';
      out.innerHTML='出力極 f<sub>p1</sub> = 1/(2π·R<sub>L</sub>·C<sub>OUT</sub>) = <b>'+f(fp1,1)+' Hz</b>'+
        '（R<sub>L</sub> = '+f(RL,1)+' Ω）'+
        ' ／ ESR ゼロ f<sub>z</sub> = 1/(2π·ESR·C<sub>OUT</sub>) = <b>'+
        (fz<1e6?f(fz/1e3,1)+" kHz":f(fz/1e6,2)+" MHz")+'</b>'+
        ' ／ 0 dB 交点 '+(fx<1e3?f(fx,1)+" Hz":f(fx/1e3,1)+" kHz")+
        ' ／ <b>位相余裕 '+f(pm,1)+'°</b> — '+verd+
        ' ／ <b>ESR を 1 Ω から 10 mΩ に下げてみること</b>——'+
        'ゼロが高周波に飛んで補償が消え、発振する。<b>これが「タンタルを MLCC に替えたら発振した」の正体</b>'+
        ' ／ 負荷電流を下げると出力極が下がる。<b>「軽負荷で不安定」</b>はここから来る'+
        ' ／ <b>MLCC は DC バイアスで容量が半分以下になる</b>（02 章）ので、'+
        '「10 µF を付けたつもりが実効 3 µF で下限割れ」に注意';
    }
    [sC,sE,sI,sV,sF].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 14: LDO の熱と負荷応答 ---------- */
  REG.ldotherm=function(el){
    head(el,"Thermal & Transient","接合部温度と過渡降下");
    var r=ctrls(el);
    var sVi=slider(r,"V_IN [V]",1.5,24,5,0.1);
    var sVo=slider(r,"V_OUT [V]",1,12,3.3,0.1);
    var sI=slider(r,"負荷電流 [mA]",1,2000,300,1);
    var pk=select(r,"パッケージ",["SOT-23-5（250 ℃/W）","SOT-89（120 ℃/W）","SOT-223（80 ℃/W）","SOIC-8 露出パッド（55 ℃/W）","DFN 3×3 + ビア（45 ℃/W）"]);
    var sTa=slider(r,"周囲温度 [℃]",-40,105,45,1);
    var sSt=slider(r,"負荷ステップ [mA]",1,1500,190,1);
    var sC=slider(r,"C_OUT の実効容量 [µF]",0.5,100,4,0.5);
    var sTr=slider(r,"LDO の応答時間 [µs]",0.5,50,5,0.5);
    var cv=screen(el,220),cc=cctx(cv),out=readout(el);
    var TH=[250,120,80,55,45];
    function draw(){
      var Vi=+sVi.input.value,Vo=+sVo.input.value,I=+sI.input.value*1e-3,
          th=TH[+pk.value],Ta=+sTa.input.value,st=+sSt.input.value*1e-3,
          Co=+sC.input.value*1e-6,tr=+sTr.input.value*1e-6;
      sVi.val.textContent=f(Vi,1)+" V";sVo.val.textContent=f(Vo,1)+" V";
      sI.val.textContent=f(I*1e3,0)+" mA";sTa.val.textContent=Ta+" ℃";
      sSt.val.textContent=f(st*1e3,0)+" mA";sC.val.textContent=f(Co*1e6,1)+" µF";
      sTr.val.textContent=f(tr*1e6,1)+" µs";
      var P=Math.max(0,(Vi-Vo))*I;
      var Tj=Ta+th*P;
      var dV=st*tr/Co;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      /* 温度バー */
      var bx=Math.min(200,w*0.42),y0=26,bh=26;
      lab(ctx,"接合部温度 T_J",14,y0+bh/2+4,C("--muted"),"left",11);
      ctx.fillStyle=C("--screen");rrect(ctx,bx,y0,w-bx-70,bh,5);ctx.fill();
      var frac=Math.min(1,Math.max(0,(Tj+40)/(200+40)));
      ctx.fillStyle=C(Tj>125?"--alias":Tj>100?"--alias":"--signal");
      rrect(ctx,bx,y0,Math.max(3,(w-bx-70)*frac),bh,5);ctx.fill();
      /* 125℃ マーク */
      var xm=bx+(w-bx-70)*(125+40)/240;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(xm,y0-4);ctx.lineTo(xm,y0+bh+4);ctx.stroke();
      lab(ctx,"125℃",xm,y0-8,C("--alias"),"center",9);
      lab(ctx,f(Tj,0)+" ℃",w-64,y0+bh/2+4,C("--ink"),"left",12);
      /* 過渡波形 */
      var gy0=y0+bh+30,gy1=h-24,padL2=bx;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(padL2,gy1);ctx.lineTo(w-16,gy1);ctx.stroke();
      lab(ctx,"負荷ステップ時の",14,gy0+12,C("--muted"),"left",11);
      lab(ctx,"出力電圧",14,gy0+28,C("--muted"),"left",11);
      var Tw=tr*8;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      var vmax=Math.max(dV*1.4,0.02);
      for(var i=0;i<=200;i++){
        var t=Tw*i/200,v;
        if(t<Tw*0.15)v=0;
        else{var tt=t-Tw*0.15;
          v=tt<tr?-dV*(tt/tr):-dV*Math.exp(-(tt-tr)/(tr*1.2));}
        var xx=padL2+(w-padL2-16)*i/200;
        var yy=gy0+ (0-v)/vmax*(gy1-gy0)*0.85;
        i?ctx.lineTo(xx,Math.min(gy1,yy)):ctx.moveTo(xx,Math.min(gy1,yy));
      }
      ctx.stroke();
      lab(ctx,"−"+f(dV*1e3,0)+" mV",w-16,gy0+(dV/vmax)*(gy1-gy0)*0.85+14,C("--alias"),"right",11);
      var bor=Vo*0.92;
      out.innerHTML='損失 <b>P = (V<sub>IN</sub> − V<sub>OUT</sub>)·I = '+f(P,3)+' W</b>'+
        ' ／ <b>T<sub>J</sub> = T<sub>A</sub> + θ<sub>JA</sub>·P = '+f(Tj,0)+' ℃</b>'+
        (Tj>125?' ／ <span class="warn">125 ℃ を超えている——熱シャットダウンが働く</span>':
         Tj>100?' ／ <span class="warn">ディレーティング（定格の 80 %）を超えている</span>':' ／ <span class="ok">余裕あり</span>')+
        ' ／ 負荷ステップ '+f(st*1e3,0)+' mA での降下 <b>ΔV ≈ I·Δt/C<sub>OUT</sub> = '+f(dV*1e3,0)+' mV</b>'+
        (Vo-dV<bor?' ／ <span class="warn">ブラウンアウト閾値（V_OUT の 92 % と仮定）を割る可能性がある</span>':'')+
        ' ／ <b>θ<sub>JA</sub> は部品の値ではなく「部品＋基板」の値である。</b>'+
        'データシートの測定条件（銅箔面積）を満たさなければ、その値は出ない'+
        ' ／ 過渡降下を減らすには <b>C<sub>OUT</sub> を増やす・ESR の小さいものにする・応答の速い LDO を選ぶ</b>'+
        ' ／ <b>MCU が「Wi-Fi 送信の瞬間だけリセットする」のは、たいていこれ</b>';
    }
    [sVi,sVo,sI,sTa,sSt,sC,sTr].forEach(function(s){s.input.addEventListener("input",draw);});
    pk.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 15: Buck コンバータ ---------- */
  REG.buck=function(el){
    head(el,"Buck Converter","ボルト秒平衡ですべてが決まる");
    var r=ctrls(el);
    var sVi=slider(r,"V_IN [V]",3,60,12,0.1);
    var sVo=slider(r,"V_OUT [V]",0.6,30,3.3,0.1);
    var sL=slider(r,"L [µH]",0.22,100,4.7,0.01);
    var sF=slider(r,"周波数 [kHz]",100,3000,1000,10);
    var sI=slider(r,"負荷電流 [A]",0.01,10,1,0.01);
    var sC=slider(r,"C_OUT [µF]",1,470,22,1);
    var sE=slider(r,"C_OUT の ESR [mΩ]",1,500,5,1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var Vi=+sVi.input.value,Vo=+sVo.input.value,L=+sL.input.value*1e-6,
          fs=+sF.input.value*1e3,I=+sI.input.value,Co=+sC.input.value*1e-6,ESR=+sE.input.value*1e-3;
      Vo=Math.min(Vo,Vi*0.98);
      sVi.val.textContent=f(Vi,1)+" V";sVo.val.textContent=f(Vo,2)+" V";
      sL.val.textContent=f(L*1e6,2)+" µH";sF.val.textContent=f(fs/1e3,0)+" kHz";
      sI.val.textContent=f(I,2)+" A";sC.val.textContent=f(Co*1e6,0)+" µF";
      sE.val.textContent=f(ESR*1e3,0)+" mΩ";
      var D=Vo/Vi,T=1/fs,ton=D*T;
      var dI=Vo*(1-D)/(L*fs);
      var dcm=I<dI/2;
      var Ipk=dcm?Math.sqrt(2*I*dI):I+dI/2;
      var Ivl=dcm?0:I-dI/2;
      var Vrip=dI*(ESR+1/(8*fs*Co));
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=104,padT=16,padB=26,split=0.56;
      var gh=h-padT-padB,h1=gh*split,y0=padT,y1=padT+h1,y2=y1+16,y3=h-padB;
      function X(t){return padL+t/(2*T)*(w-padL-16);}
      /* インダクタ電流 */
      var imax=Math.max(Ipk*1.2,0.01);
      function Y1(i2){return y1-(i2/imax)*(y1-y0);}
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(padL,y1);ctx.lineTo(w-16,y1);ctx.stroke();
      ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(padL,Y1(I));ctx.lineTo(w-16,Y1(I));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"平均 "+f(I,2)+" A",w-18,Y1(I)-4,C("--faint"),"right",9);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      for(var k=0;k<2;k++){
        var t0=k*T;
        if(!dcm){
          ctx.moveTo(X(t0),Y1(Ivl));ctx.lineTo(X(t0+ton),Y1(Ipk));ctx.lineTo(X(t0+T),Y1(Ivl));
        }else{
          var tr2=Ipk*L/Math.max(0.01,(Vi-Vo)), tf=Ipk*L/Math.max(0.01,Vo);
          ctx.moveTo(X(t0),Y1(0));ctx.lineTo(X(t0+tr2),Y1(Ipk));
          ctx.lineTo(X(t0+tr2+tf),Y1(0));ctx.lineTo(X(t0+T),Y1(0));
        }
      }
      ctx.stroke();
      lab(ctx,"インダクタ電流 I_L",padL-6,(y0+y1)/2,C("--muted"),"right",10);
      lab(ctx,"I_pk = "+f(Ipk,2)+" A",padL+6,y0+12,C("--signal"),"left",10);
      /* スイッチノード */
      ctx.strokeStyle=C("--line");
      ctx.beginPath();ctx.moveTo(padL,y3);ctx.lineTo(w-16,y3);ctx.stroke();
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2.2;ctx.beginPath();
      for(var m=0;m<2;m++){
        var b=m*T;
        ctx.moveTo(X(b),y3);ctx.lineTo(X(b),y2);ctx.lineTo(X(b+ton),y2);
        ctx.lineTo(X(b+ton),y3);ctx.lineTo(X(b+T),y3);
      }
      ctx.stroke();
      lab(ctx,"SW ノード",padL-6,(y2+y3)/2+4,C("--muted"),"right",10);
      lab(ctx,"D = "+f(D*100,1)+" %  t_on = "+f(ton*1e9,0)+" ns",padL+6,y3-6,C("--blue"),"left",10);
      out.innerHTML='<b>V<sub>OUT</sub> = D·V<sub>IN</sub></b>（ボルト秒平衡から）→ D = <b>'+f(D*100,1)+' %</b>、'+
        't<sub>on</sub> = <b>'+f(ton*1e9,0)+' ns</b>'+
        (ton<50e-9?' ／ <span class="warn">最小 ON 時間（多くの IC で 50〜100 ns）を割っている</span>':'')+
        ' ／ リプル電流 <b>ΔI<sub>L</sub> = V<sub>OUT</sub>(1−D)/(L·f) = '+f(dI,3)+' A</b>'+
        '（負荷の '+f(100*dI/Math.max(I,1e-6),0)+' %。<b>定石は 20〜40 %</b>）'+
        ' ／ ピーク電流 <b>'+f(Ipk,3)+' A</b> — <b>インダクタの飽和電流はこの値で見る</b>'+
        ' ／ '+(dcm?'<b>DCM（不連続モード）</b>——電流がゼロまで落ちている。軽負荷では PFM のほうが効率が良い':
                   '<b>CCM（連続モード）</b>')+
        ' ／ 出力リプル <b>ΔV = ΔI(ESR + 1/(8fC)) = '+f(Vrip*1e3,1)+' mV</b>'+
        '（ESR ぶん '+f(dI*ESR*1e3,1)+' mV、容量ぶん '+f(dI/(8*fs*Co)*1e3,1)+' mV）'+
        ' ／ <b>周波数を上げると L と C を小さくできるが、スイッチング損失が増える</b>';
    }
    [sVi,sVo,sL,sF,sI,sC,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 15: 効率と損失の内訳 ---------- */
  REG.swloss=function(el){
    head(el,"Efficiency","軽負荷は I_Q、重負荷は I²R");
    var r=ctrls(el);
    var sVi=slider(r,"V_IN [V]",3,60,12,0.1);
    var sVo=slider(r,"V_OUT [V]",0.6,24,3.3,0.1);
    var sF=slider(r,"周波数 [kHz]",100,3000,1000,10);
    var sR=slider(r,"MOSFET R_DS(on) [mΩ]",1,200,25,1);
    var sQ=slider(r,"ゲート電荷 Q_g [nC]",1,100,8,1);
    var sD=slider(r,"インダクタ DCR [mΩ]",1,500,40,1);
    var sIq=slider(r,"IC の I_Q [µA]",1,5000,50,1);
    var sT=slider(r,"遷移時間 [ns]",1,100,10,1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var Vi=+sVi.input.value,Vo=+sVo.input.value,fs=+sF.input.value*1e3,
          Ron=+sR.input.value*1e-3,Qg=+sQ.input.value*1e-9,DCR=+sD.input.value*1e-3,
          Iq=+sIq.input.value*1e-6,tt=+sT.input.value*1e-9;
      Vo=Math.min(Vo,Vi*0.95);
      sVi.val.textContent=f(Vi,1)+" V";sVo.val.textContent=f(Vo,2)+" V";
      sF.val.textContent=f(fs/1e3,0)+" kHz";sR.val.textContent=f(Ron*1e3,0)+" mΩ";
      sQ.val.textContent=f(Qg*1e9,0)+" nC";sD.val.textContent=f(DCR*1e3,0)+" mΩ";
      sIq.val.textContent=f(Iq*1e6,0)+" µA";sT.val.textContent=f(tt*1e9,0)+" ns";
      var D=Vo/Vi;
      function loss(I){
        var Pcond=I*I*Ron;                 /* 上下合わせて概ね I²Ron */
        var Psw=Vi*I*tt*fs;
        var Pg=2*Qg*5*fs;
        var Pdcr=I*I*DCR;
        var Pq=Vi*Iq;
        return {c:Pcond,s:Psw,g:Pg,d:Pdcr,q:Pq,t:Pcond+Psw+Pg+Pdcr+Pq};
      }
      var c=chart(cc,-3,1,0,100,{l:54,b:32,t:24});
      grid(c,5);axis(c);var ctx=c.ctx;
      for(var e=-3;e<=1;e++)lab(ctx,(e<0?Math.pow(10,e+3)+" mA":Math.pow(10,e)+" A"),c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);
      for(var q=0;q<=100;q+=25)lab(ctx,q+"%",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      lab(ctx,"効率",c.p.l-6,c.p.t-8,C("--muted"),"right",10);
      lab(ctx,"負荷電流",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      var P=[],best=0,bi=0;
      for(var i=0;i<=200;i++){var lf=-3+4*i/200,I=Math.pow(10,lf);
        var L2=loss(I),eff=Vo*I/(Vo*I+L2.t)*100;
        if(eff>best){best=eff;bi=I;}
        P.push([lf,Math.max(0,eff)]);}
      line(c,P,C("--signal"),2.8);
      dot(c,Math.log10(bi),best,4.5,C("--alias"));
      lab(ctx,"最良 "+f(best,1)+"% @ "+(bi<1?f(bi*1e3,0)+" mA":f(bi,2)+" A"),
        Math.min(c.X(Math.log10(bi))+8,c.w-c.p.r-120),c.Y(best)-8,C("--alias"),"left",10);
      /* 代表 3 点の内訳 */
      var pts=[0.01,0.3,3];
      var rows=pts.map(function(I){
        var L3=loss(I);
        return [(I<1?f(I*1e3,0)+" mA":f(I,1)+" A"),
                f(L3.c*1e3,1),f(L3.s*1e3,1),f(L3.g*1e3,1),f(L3.d*1e3,1),f(L3.q*1e3,1),
                "<b>"+f(Vo*I/(Vo*I+L3.t)*100,1)+"%</b>"];
      });
      out.innerHTML=tbl(["負荷","導通 [mW]","スイッチング","ゲート","DCR","I_Q","効率"],rows,
        ["left","right","right","right","right","right","right"])+
        '<div style="margin-top:.4rem">'+
        '<b>軽負荷では I<sub>Q</sub> とスイッチング損失（周波数に比例）が支配し、'+
        '重負荷では I²R（導通損失と DCR）が支配する。</b>'+
        ' ／ <b>周波数を上げると</b>: L と C が小さくできて応答も速くなるが、'+
        'スイッチング損失とゲート損失が比例して増える'+
        ' ／ <b>軽負荷の効率を上げるには PFM（バーストモード）</b>——'+
        'スイッチングを間引いて損失を減らす。ただしリプルとノイズが増える'+
        ' ／ <b>電池駆動で待機が長いなら I<sub>Q</sub> の小さい IC を選ぶこと</b>'+
        '</div>';
    }
    [sVi,sVo,sF,sR,sQ,sD,sIq,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 16: デカップリング ---------- */
  REG.decap=function(el){
    head(el,"Decoupling","値より個数と配線長");
    var r=ctrls(el);
    var sN=slider(r,"0.1 µF の個数",0,20,4,1);
    var sB=slider(r,"バルク容量 [µF]",0,100,10,1);
    var sL=slider(r,"1 個あたりの実装インダクタンス [nH]",0.3,10,1.5,0.1);
    var sZ=slider(r,"目標インピーダンス [mΩ]",10,2000,330,10);
    var sPl=slider(r,"電源プレーンのインダクタンス [nH]",0.5,50,5,0.5);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var n=+sN.input.value,Cb=+sB.input.value*1e-6,Lm=+sL.input.value*1e-9,
          Zt=+sZ.input.value*1e-3,Lp=+sPl.input.value*1e-9;
      sN.val.textContent=n+" 個";sB.val.textContent=f(Cb*1e6,0)+" µF";
      sL.val.textContent=f(Lm*1e9,1)+" nH";sZ.val.textContent=f(Zt*1e3,0)+" mΩ";
      sPl.val.textContent=f(Lp*1e9,1)+" nH";
      var Cs=0.1e-6,ESRs=0.02,ESRb=0.05;
      function Zof(fq){
        var wv=TAU*fq;
        function zc(Cf,esr,L2){var x=wv*L2-1/(wv*Cf);return {re:esr,im:x};}
        var arr=[];
        if(n>0)for(var i=0;i<n;i++)arr.push(zc(Cs,ESRs,Lm));
        if(Cb>0)arr.push(zc(Cb,ESRb,Lm*2));
        if(!arr.length)return 1e6;
        /* 並列合成 */
        var yr=0,yi=0;
        arr.forEach(function(z){var m2=z.re*z.re+z.im*z.im;yr+=z.re/m2;yi+=-z.im/m2;});
        var m3=yr*yr+yi*yi;
        var zr=yr/m3,zi=-yi/m3;
        zi+=wv*Lp;
        return Math.sqrt(zr*zr+zi*zi);
      }
      var c=chart(cc,3,9,-3,2,{l:52,b:30,t:18});
      grid(c,5);axis(c);var ctx=c.ctx;
      for(var e=3;e<=9;e++){var t=e<6?Math.pow(10,e-3)+"k":e<9?Math.pow(10,e-6)+"M":"1G";
        lab(ctx,t,c.X(e),c.h-c.p.b+16,C("--faint"),"center",10);}
      for(var q=-3;q<=2;q++)lab(ctx,(q<0?Math.pow(10,q+3)+" mΩ":Math.pow(10,q)+" Ω"),c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      lab(ctx,"周波数",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* 目標 Z */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(Math.log10(Zt)));ctx.lineTo(c.w-c.p.r,c.Y(Math.log10(Zt)));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"目標 Z",c.w-c.p.r-4,c.Y(Math.log10(Zt))-5,C("--alias"),"right",10);
      var P=[],worst=0,wf=0;
      for(var i2=0;i2<=300;i2++){var lf=3+6*i2/300,fq=Math.pow(10,lf),z=Zof(fq);
        if(fq>1e5&&z>worst){worst=z;wf=fq;}
        P.push([lf,Math.max(-3,Math.min(2,Math.log10(z)))]);}
      line(c,P,C("--signal"),2.8);
      /* 1 個だけの場合（比較） */
      var save=n;n=1;var Cbs=Cb;Cb=0;
      var P1=[];for(var j=0;j<=300;j++){var lf2=3+6*j/300;P1.push([lf2,Math.max(-3,Math.min(2,Math.log10(Zof(Math.pow(10,lf2)))))]);}
      n=save;Cb=Cbs;
      line(c,P1,C("--faint"),1.4,[4,4]);
      lab(ctx,"0.1 µF 1 個だけ（比較）",c.p.l+6,c.p.t+12,C("--faint"),"left",10);
      var ok=worst<=Zt;
      out.innerHTML='100 kHz 以上での最悪インピーダンス <b>'+f(worst*1e3,0)+' mΩ</b>'+
        '（'+(wf<1e6?f(wf/1e3,0)+" kHz":f(wf/1e6,0)+" MHz")+'）'+
        (ok?' ／ <span class="ok">目標を満たしている</span>':' ／ <span class="warn">目標を超えている</span>')+
        ' ／ <b>個数を増やしてみること</b>——n 個並列で ESL が 1/n になり、高周波が下がる'+
        ' ／ <b>実装インダクタンスを増やしてみること</b>——'+
        'これが「IC から遠いと効かない」の正体。0.1 µF 自体の ESL より、配線とビアのほうが大きい'+
        ' ／ 目標インピーダンス Z = V<sub>DD</sub>×(許容リプル率)/I<sub>max</sub>。'+
        '3.3 V・3 %・300 mA なら 330 mΩ'+
        ' ／ <b>値を散らすより、同じ値を複数個 + 短いビアのほうが効く。</b>'+
        '値を離しすぎると反共振でインピーダンスが跳ね上がる';
    }
    [sN,sB,sL,sZ,sPl].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 16: 熱設計 ---------- */
  REG.thermal=function(el){
    head(el,"Thermal Design","θ_JA は部品ではなく基板込みの値");
    var r=ctrls(el);
    var sP=slider(r,"損失 [W]",0.01,10,0.5,0.01);
    var pk=select(r,"パッケージ",["SOT-23-5","SOT-89","SOT-223","SOIC-8","SOIC-8 露出パッド","DFN/QFN 3×3","TO-263 (D2PAK)"]);
    var sA=slider(r,"放熱銅箔面積 [cm²]",0.2,40,4,0.2);
    var sV=slider(r,"サーマルビア本数",0,24,0,1);
    var sTa=slider(r,"周囲温度 [℃]",-40,105,45,1);
    var sTm=slider(r,"T_J 最大定格 [℃]",85,175,125,5);
    var cv=screen(el,200),cc=cctx(cv),out=readout(el);
    /* 基準 θJA（1 cm²、ビアなし） */
    var BASE=[300,190,150,160,110,110,70];
    var HASPAD=[0,0,0,0,1,1,1];
    function draw(){
      var P=+sP.input.value,ip=+pk.value,A=+sA.input.value,nv=+sV.input.value,
          Ta=+sTa.input.value,Tmax=+sTm.input.value;
      sP.val.textContent=f(P,2)+" W";sA.val.textContent=f(A,1)+" cm²";
      sV.val.textContent=nv+" 本"+(HASPAD[ip]?"":"（このパッケージには効かない）");
      sTa.val.textContent=Ta+" ℃";sTm.val.textContent=Tmax+" ℃";
      /* 面積効果: 1 cm² を基準に、25 cm² 付近で飽和 */
      var fa=1/(0.35+0.65*Math.min(1,Math.pow(A/25,0.55))/Math.max(0.2,Math.pow(1/25,0.55)));
      fa=Math.pow(1/Math.max(0.2,A),0.28);
      var th=BASE[ip]*fa;
      if(HASPAD[ip]&&nv>0)th*=1/(1+nv*0.055);
      th=Math.max(15,th);
      var Tj=Ta+th*P, margin=Tmax*0.8-Tj;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var bx=Math.min(160,w*0.36),y0=30,bh=34;
      lab(ctx,"T_J",14,y0+bh/2+4,C("--muted"),"left",12);
      var bw=w-bx-64;
      ctx.fillStyle=C("--screen");rrect(ctx,bx,y0,bw,bh,5);ctx.fill();
      var lo=-40,hi=200;
      function XX(t){return bx+bw*Math.min(1,Math.max(0,(t-lo)/(hi-lo)));}
      ctx.fillStyle=C(Tj>Tmax?"--alias":Tj>Tmax*0.8?"--alias":"--signal");
      rrect(ctx,bx,y0,Math.max(3,XX(Tj)-bx),bh,5);ctx.fill();
      [[Ta,"T_A","--muted"],[Tmax*0.8,"80% 定格","--blue"],[Tmax,"最大定格","--alias"]].forEach(function(m){
        ctx.strokeStyle=C(m[2]);ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(XX(m[0]),y0-6);ctx.lineTo(XX(m[0]),y0+bh+6);ctx.stroke();
        lab(ctx,m[1],XX(m[0]),y0-10,C(m[2]),"center",9);
      });
      lab(ctx,f(Tj,0)+" ℃",bx+bw+8,y0+bh/2+4,C("--ink"),"left",13);
      lab(ctx,"θ_JA ≈ "+f(th,0)+" ℃/W",14,y0+bh+34,C("--muted"),"left",12);
      lab(ctx,"許容損失（80% 定格まで）: "+f((Tmax*0.8-Ta)/th,3)+" W",14,y0+bh+56,C("--signal"),"left",12);
      out.innerHTML='<b>T<sub>J</sub> = T<sub>A</sub> + θ<sub>JA</sub>·P = '+f(Ta,0)+' + '+f(th,0)+'×'+f(P,2)+' = '+f(Tj,0)+' ℃</b>'+
        (Tj>Tmax?' ／ <span class="warn">最大定格超過——熱シャットダウン／破壊</span>':
         margin<0?' ／ <span class="warn">ディレーティング（80 %）を満たしていない</span>':
         ' ／ <span class="ok">余裕 '+f(margin,0)+' ℃</span>')+
        ' ／ この構成で許容できる損失は <b>'+f((Tmax*0.8-Ta)/th,3)+' W</b>'+
        ' ／ <b>銅箔面積を増やしてみること</b>——効くが <b>25 cm² 付近で飽和する</b>'+
        ' ／ <b>サーマルビアを増やしてみること</b>——'+
        '露出パッドのあるパッケージなら 9〜16 本で θ<sub>JA</sub> が半分近くになる'+
        ' ／ <b>データシートの θ<sub>JA</sub> には必ず測定条件（基板の層数と銅箔面積）が書いてある。</b>'+
        'その条件を満たしていなければ、その値は出ない'+
        ' ／ 周囲温度は<b>筐体内の温度</b>であって室温ではない。実測すること';
    }
    [sP,sA,sV,sTa,sTm].forEach(function(s){s.input.addEventListener("input",draw);});
    pk.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 17: SAR ADC ---------- */
  REG.sar=function(el){
    head(el,"SAR ADC","天秤で重さを測る／入力は容量性");
    var r=ctrls(el);
    var sN=slider(r,"分解能 [bit]",4,16,12,1);
    var sV=slider(r,"入力電圧 [V]",0,3.3,2.137,0.001);
    var sR=slider(r,"R_source [kΩ]",0.01,500,10,0.01);
    var sC=slider(r,"サンプル容量 C_s [pF]",1,50,8,1);
    var sT=slider(r,"サンプリング時間 [µs]",0.05,50,2,0.05);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var N=+sN.input.value,Vin=+sV.input.value,Rs=+sR.input.value*1e3,
          Cs=+sC.input.value*1e-12,ts=+sT.input.value*1e-6;
      var VREF=3.3;
      sN.val.textContent=N+" bit";sV.val.textContent=f(Vin,3)+" V";
      sR.val.textContent=(Rs<1000?f(Rs,0)+" Ω":f(Rs/1e3,2)+" kΩ");
      sC.val.textContent=f(Cs*1e12,0)+" pF";sT.val.textContent=f(ts*1e6,2)+" µs";
      var Rsw=1e3,tau=(Rs+Rsw)*Cs;
      var need=tau*Math.log(Math.pow(2,N+1));
      /* 実際にサンプルされる電圧（前回値 0 V から充電と仮定） */
      var Vs=Vin*(1-Math.exp(-ts/tau));
      var lsb=VREF/Math.pow(2,N);
      var code=Math.min(Math.pow(2,N)-1,Math.round(Vs/lsb));
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=44,padT=18,padB=26;
      var gw=w-padL-16,gh=h-padT-padB;
      /* 逐次比較の軌跡 */
      var dac=0,steps=[];
      for(var b=N-1;b>=0;b--){
        var trial=dac+VREF*Math.pow(2,b)/Math.pow(2,N);
        var keep=trial<=Vs;
        if(keep)dac=trial;
        steps.push({b:b,v:trial,keep:keep,after:dac});
      }
      function X(i){return padL+gw*i/N;}
      function Y(v){return padT+gh-(v/VREF)*gh;}
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      for(var q=0;q<=4;q++){var yy=padT+gh*q/4;
        ctx.beginPath();ctx.moveTo(padL,yy);ctx.lineTo(w-16,yy);ctx.stroke();
        lab(ctx,f(VREF*(1-q/4),1)+"V",padL-6,yy+4,C("--faint"),"right",10);}
      /* 入力レベル */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.setLineDash([5,3]);
      ctx.beginPath();ctx.moveTo(padL,Y(Vs));ctx.lineTo(w-16,Y(Vs));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"サンプルされた電圧 "+f(Vs,4)+" V",w-18,Y(Vs)-6,C("--alias"),"right",10);
      /* DAC の軌跡 */
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      ctx.moveTo(X(0),Y(0));
      steps.forEach(function(s,i){
        ctx.lineTo(X(i+0.5),Y(s.v));
        ctx.lineTo(X(i+1),Y(s.after));
      });
      ctx.stroke();
      steps.forEach(function(s,i){
        ctx.beginPath();ctx.arc(X(i+0.5),Y(s.v),3.4,0,TAU);
        ctx.fillStyle=C(s.keep?"--signal":"--faint");ctx.fill();
        if(N<=12)lab(ctx,s.keep?"1":"0",X(i+0.5),padT+gh+14,C(s.keep?"--signal":"--faint"),"center",10);
      });
      lab(ctx,"内部 DAC",padL+4,padT+12,C("--signal"),"left",10);
      lab(ctx,"↑ 各ステップで確定したビット",padL,padT+gh+30,C("--muted"),"left",9);
      var ok=ts>=need;
      var err=(Vin-Vs)/lsb;
      out.innerHTML='1 LSB = V<sub>REF</sub>/2<sup>N</sup> = <b>'+
        (lsb*1e3<1?f(lsb*1e6,1)+" µV":f(lsb*1e3,3)+" mV")+'</b>'+
        ' ／ 出力コード <b>'+code+'</b>（'+hex(code,Math.ceil(N/4))+'）'+
        ' ／ 理論 SNR = 6.02N + 1.76 = <b>'+f(6.02*N+1.76,1)+' dB</b>'+
        '<div style="margin-top:.35rem">'+
        '<b>入力の整定</b>: τ = (R<sub>source</sub>+R<sub>sw</sub>)·C<sub>s</sub> = <b>'+f(tau*1e9,0)+' ns</b>'+
        '、'+N+' bit に必要な時間 = τ·ln(2^(N+1)) = <b>'+f(need*1e6,3)+' µs</b>'+
        ' ／ 設定は '+f(ts*1e6,2)+' µs '+
        (ok?'<span class="ok">十分</span>':'<span class="warn">不足——誤差 '+f(err,1)+' LSB</span>')+
        '</div>'+
        '<div style="margin-top:.35rem">'+
        '<b>R_source を 100 kΩ にしてみること。</b>整定が間に合わず、値が入力より低く出る。'+
        'これが「センサを繋いだら値が半分になった」「チャンネルを切り替えると前の値が混ざる」の正体'+
        ' ／ <b>根本解決はオペアンプでバッファすること</b>。'+
        '次善は ADC 入力に 1〜10 nF を付けて電荷を供給する、サンプリング時間を延ばす'+
        '</div>';
    }
    [sN,sV,sR,sC,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 17: ADC 方式の比較 ---------- */
  REG.adctype=function(el){
    head(el,"ADC Architectures","速度・分解能・レイテンシ");
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"SAR",c:"--signal",
       rows:[["原理","容量 DAC で <b>1 bit ずつ逐次比較</b>（天秤）"],
             ["速度","数百 kSPS 〜 数 MSPS"],["分解能","8〜18 bit"],
             ["レイテンシ","<b>なし</b>（1 変換 = 1 結果）"],
             ["消費電力","<b>小さい</b>（DC 電流が要らない）"],
             ["入力","<b>容量性。サンプル時に電荷を吸い込む</b>"],
             ["得意","汎用センサ、<b>多チャンネル切り替え</b>、モータの電流検出"],
             ["不得意","20 bit 以上（容量マッチングの限界）"]],
       note:"<b>MCU 内蔵 ADC のほとんどが SAR。</b>レイテンシがないのでマルチプレクサとの相性が良く、PWM 同期トリガで狙った瞬間を測れる。"},
      {n:"ΔΣ（デルタシグマ）",c:"--blue",
       rows:[["原理","<b>オーバーサンプリング + ノイズシェーピング</b>。粗い量子化器を高速で回して平均"],
             ["速度","数 SPS 〜 数百 kSPS"],["分解能","<b>16〜32 bit</b>"],
             ["レイテンシ","<b>あり</b>（ディジタルフィルタの群遅延）"],
             ["消費電力","中"],["入力","スイッチトキャパシタ型は容量性、連続時間型は抵抗性"],
             ["得意","<b>温度・重量・ひずみゲージ・オーディオ</b>"],
             ["不得意","<b>マルチプレクス</b>（切替後の数サンプルは前チャンネルの残り）"]],
       note:"<b>振幅の分解能を時間の分解能と交換している。</b>OSR 2 倍で (6L+3) dB 改善（L = シェーピング次数）。<b>出力 10 SPS にすると sinc ノッチが 50 Hz と 60 Hz の両方に立つ。</b>OSR が高いのでアンチエイリアスが RC 1 段で済むのも大きな利点。"},
      {n:"パイプライン",c:"--signal",
       rows:[["原理","複数段で少しずつビットを確定し、残差を増幅して次段へ"],
             ["速度","<b>10 MSPS 〜 1 GSPS</b>"],["分解能","10〜16 bit"],
             ["レイテンシ","<b>あり</b>（段数ぶんのクロック）。ただしスループットは 1 クロック/サンプル"],
             ["消費電力","<b>大きい</b>（各段にオペアンプ）"],
             ["得意","通信、映像、計測器"],["不得意","低消費電力用途、低速用途"]],
       note:"「レイテンシがある」と「遅い」は別物である。<b>パイプラインは遅延はあるがスループットは極めて高い。</b>制御ループに入れるとレイテンシが位相遅れになる点だけ注意。"},
      {n:"フラッシュ",c:"--alias",
       rows:[["原理","<b>2<sup>N</sup>−1 個のコンパレータ</b>を並べて一発判定"],
             ["速度","<b>最速（GSPS 級、1 クロックで完結）</b>"],
             ["分解能","<b>6〜8 bit が限界</b>"],["レイテンシ","ほぼなし"],
             ["消費電力","<b>極大</b>"],
             ["得意","オシロスコープ、高速通信のフロントエンド"],
             ["不得意","それ以外すべて"]],
       note:"8 bit で 255 個、10 bit で 1023 個のコンパレータが要る。<b>2<sup>N</sup> で増えるので分解能を上げられない。</b>だからパイプラインの各段の中で部分的に使われることが多い。"},
      {n:"積分型（デュアルスロープ）",c:"--muted",
       rows:[["原理","入力を一定時間積分し、基準で放電する時間を測る"],
             ["速度","数 SPS"],["分解能","高い（部品ばらつきがキャンセルされる）"],
             ["レイテンシ","あり"],["消費電力","小"],
             ["得意","<b>デジタルマルチメータ</b>。積分時間を電源周期の整数倍にするとハムが消える"],
             ["不得意","高速な用途すべて"]],
       note:"クロック周波数や容量値の誤差が<b>充電と放電で相殺される</b>のが美点。現代の新規設計では ΔΣ に置き換わっていることが多い。"}
    ];
    picker(el,A,function(it){
      var h=tbl(["項目","内容"],it.rows);
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;margin-top:.5rem;color:var(--ink);font-size:.86rem">'+it.note+'</div>';
      return h;
    });
    out.innerHTML='<b>選び方の要点: 「速いか」ではなく「レイテンシが許されるか」「何チャンネル切り替えるか」で決まる。</b>'+
      ' ／ 汎用・多チャンネル → <b>SAR</b>、高分解能・低速 → <b>ΔΣ</b>、高速中分解能 → <b>パイプライン</b>'+
      ' ／ <b>データシートで見るべきは分解能（bit 数）ではなく ENOB</b>——'+
      'ENOB = (SINAD − 1.76)/6.02。「24 bit、有効 19.5 bit」は普通にある';
  };

  /* ---------- 18: PWM DAC ---------- */
  REG.pwmdac=function(el){
    head(el,"PWM DAC","リプルと整定時間は両立しない");
    var r=ctrls(el);
    var sClk=slider(r,"タイマクロック [MHz]",1,200,100,1);
    var sB=slider(r,"PWM 分解能 [bit]",6,16,10,1);
    var sD=slider(r,"デューティ [%]",0,100,50,0.1);
    var sR=slider(r,"R [kΩ]",0.1,100,10,0.1);
    var sC=slider(r,"C [nF]",1,10000,1000,1);
    var ord=select(r,"フィルタ",["1 次 RC","2 次 RC（同じ R・C を 2 段）"]);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    function draw(){
      var fclk=+sClk.input.value*1e6,bits=+sB.input.value,D=+sD.input.value/100,
          R=+sR.input.value*1e3,Cf=+sC.input.value*1e-9,od=+ord.value;
      var fp=fclk/Math.pow(2,bits),T=1/fp,tau=R*Cf,VDD=3.3;
      sClk.val.textContent=f(fclk/1e6,0)+" MHz";
      sB.val.textContent=bits+" bit（f_PWM = "+(fp<1e3?f(fp,0)+" Hz":fp<1e6?f(fp/1e3,1)+" kHz":f(fp/1e6,2)+" MHz")+"）";
      sD.val.textContent=f(D*100,1)+" %";sR.val.textContent=f(R/1e3,1)+" kΩ";
      sC.val.textContent=(Cf*1e9<1000?f(Cf*1e9,0)+" nF":f(Cf*1e6,2)+" µF");
      var Vavg=D*VDD;
      var rip1=VDD*D*(1-D)/(fp*tau);
      var rip=od===0?rip1:rip1*(1/(TAU*fp*tau))*2;
      var tset=tau*Math.log(Math.pow(2,bits+1))*(od===0?1:1.7);
      /* 波形 */
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=52,padT=16,padB=26,split=0.42;
      var gh=h-padT-padB,y0=padT,y1=padT+gh*split,y2=y1+14,y3=h-padB;
      var NP=6;
      function X(t){return padL+t/(NP*T)*(w-padL-16);}
      /* PWM */
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
      for(var k=0;k<NP;k++){var b=k*T;
        ctx.moveTo(X(b),y1);ctx.lineTo(X(b),y0);ctx.lineTo(X(b+D*T),y0);
        ctx.lineTo(X(b+D*T),y1);ctx.lineTo(X(b+T),y1);}
      ctx.stroke();
      lab(ctx,"PWM 出力",padL-6,(y0+y1)/2+4,C("--muted"),"right",10);
      /* フィルタ出力（拡大表示） */
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(padL,(y2+y3)/2);ctx.lineTo(w-16,(y2+y3)/2);ctx.stroke();
      var vs=Math.max(rip*3,VDD*0.002);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      var v=Vavg,dt=NP*T/600;
      for(var i=0;i<=600;i++){
        var t=NP*T*i/600, src=((t%T)<D*T)?VDD:0;
        v+=(src-v)*dt/tau;
        var yy=(y2+y3)/2-((v-Vavg)/vs)*((y3-y2)/2)*0.9;
        i?ctx.lineTo(X(t),Math.max(y2,Math.min(y3,yy))):ctx.moveTo(X(t),Math.max(y2,Math.min(y3,yy)));
      }
      ctx.stroke();
      lab(ctx,"出力（拡大）",padL-6,(y2+y3)/2+4,C("--muted"),"right",10);
      lab(ctx,"平均 "+f(Vavg,3)+" V ± "+f(rip*1e3,2)+" mV",padL+6,y2+12,C("--signal"),"left",10);
      var effbits=Math.log2(VDD/Math.max(rip,1e-9));
      out.innerHTML='V<sub>OUT</sub> = D × V<sub>DD</sub> = <b>'+f(Vavg,4)+' V</b>'+
        ' ／ PWM 周波数 = f<sub>clk</sub>/2<sup>N</sup> = <b>'+
        (fp<1e3?f(fp,1)+" Hz":fp<1e6?f(fp/1e3,2)+" kHz":f(fp/1e6,2)+" MHz")+'</b>'+
        ' ／ 残留リプル <b>'+f(rip*1e3,3)+' mV</b>（リプルで決まる実効分解能 ≈ <b>'+f(effbits,1)+' bit</b>）'+
        ' ／ 整定時間（'+bits+' bit）<b>'+(tset<1e-3?f(tset*1e6,0)+" µs":f(tset*1e3,1)+" ms")+'</b>'+
        ' ／ <b>R か C を大きくするとリプルは減るが、整定は同じだけ遅くなる。</b>'+
        'この 2 つは同じ RC に支配されているので、絶対に両立しない'+
        ' ／ 抜け道は <b>PWM 周波数を上げる</b>（＝分解能を下げる）か、<b>2 次フィルタにする</b>'+
        ' ／ <b>分解能を上げると PWM 周波数が 2<sup>N</sup> で下がる</b>——'+
        '16 bit・100 MHz なら 1.5 kHz しか出ず、フィルタが極端に重くなる'+
        ' ／ <b>PWM DAC の実力は 8〜10 bit</b>。'+
        '出力は D×V<sub>DD</sub> なので<b>電源精度・R<sub>DS(on)</sub>・エッジの非対称</b>がそのまま誤差になる';
    }
    [sClk,sB,sD,sR,sC].forEach(function(s){s.input.addEventListener("input",draw);});
    ord.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 18: DAC 方式の比較 ---------- */
  REG.dactype=function(el){
    head(el,"DAC Architectures","単調性とグリッチ");
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"抵抗ストリング",c:"--signal",
       art:["  VREF ─┬─R─┬─R─┬─ … ─┬─ GND","        │   │   │       │","       SW  SW  SW      SW","        └───┴───┴───────┴─→ VOUT"],
       rows:[["単調性","<b>保証される</b>（直列抵抗のタップだから）"],
             ["DNL","良い"],["INL","抵抗のばらつきが累積。中央付近で最大"],
             ["面積","<b>2<sup>N</sup> に比例</b> → 10〜12 bit が実用上限"],
             ["グリッチ","小さい（スイッチが 1 個変わるだけ）"],
             ["出力インピーダンス","<b>高い（数〜数十 kΩ）</b>"]],
       note:"<b>MCU 内蔵 DAC の主流。</b>出力インピーダンスが高いので<b>必ずバッファする</b>。内蔵バッファを ON にするとレール付近（0 V 付近・V<sub>DD</sub> 付近の 0.2 V）が出せなくなる点に注意。"},
      {n:"R-2R ラダー",c:"--blue",
       art:["      2R   2R   2R   2R","       │    │    │    │","  ─R───┴─R──┴─R──┴────┴──","       │    │    │    │","      b3   b2   b1   b0"],
       rows:[["単調性","<b>保証されない</b>"],
             ["面積","<b>N に比例</b>（2<sup>N</sup> ではない）→ 高分解能に向く"],
             ["必要な抵抗","<b>2 種類だけ</b>（R と 2R）"],
             ["精度","<b>MSB の抵抗精度が支配的</b>。12 bit なら 0.012 % が要る"],
             ["グリッチ","<b>大きい（メジャーコードグリッチ）</b>"]],
       note:"どの節点から右を見ても抵抗が R になるよう作られており、1 段ごとに重みが半分になる。<b>0111…→1000… で全ビットが同時に変わり、タイミングのずれがヒゲになる。</b>"},
      {n:"電流セル（セグメント）",c:"--signal",
       art:["  ┌──┐┌──┐┌──┐┌──┐","  │ I ││ I ││ I ││ I │  全部同じ電流源","  └┬─┘└┬─┘└┬─┘└┬─┘","   SW   SW   SW   SW","   └────┴────┴────┴─→ 電流を合計"],
       rows:[["単調性","<b>保証される</b>（温度計コード部分）"],
             ["グリッチ","<b>極小</b>（1 個ずつ増減）"],
             ["速度","<b>最速</b>（電流の切り替えだけ）"],
             ["セル数","上位を温度計、下位をバイナリに<b>セグメント化</b>して実用化"],
             ["出力","電流出力が多い。負荷抵抗でゲインが決まる"]],
       note:"12 bit を「上位 6 bit = 63 セル温度計 + 下位 6 bit = バイナリ」にすると、セル数は 4096 個ではなく <b>69 個</b>で済む。<b>現代の高速 DAC はほぼすべてセグメント化されている。</b>"},
      {n:"ΔΣ DAC",c:"--alias",
       art:["  高分解能 → [補間] → [ΔΣ変調] → [1bit DAC]","                                     ↓","                              [アナログ LPF]"],
       rows:[["分解能","<b>24 bit</b>"],["線形性","<b>極めて良い</b>（素子マッチングに依存しない）"],
             ["速度","数百 kSPS まで"],["レイテンシ","あり（補間フィルタの群遅延）"],
             ["必須","<b>アナログ LPF</b>（高周波の整形雑音を落とす）"],
             ["用途","<b>オーディオ</b>"]],
       note:"<b>1 bit DAC は原理的に完全線形である</b>——出力が 2 点しかなく、2 点を結ぶ線は必ず直線だから。多ビット化すると素子ばらつきが非直線性になるので、<b>DEM（動的素子マッチング）</b>で誤差を雑音に変える。"},
      {n:"PWM + フィルタ",c:"--muted",
       art:["  PWM ──[ R ]──┬── アナログ電圧","                │","              ═╪═ C","                │","               GND"],
       rows:[["分解能","<b>実力 8〜10 bit</b>"],
             ["精度","<b>V<sub>DD</sub> 精度がそのまま乗る</b>。R<sub>DS(on)</sub>・エッジ非対称も"],
             ["速度","リプルと整定のトレードオフで決まる"],
             ["部品","<b>抵抗 1 本とコンデンサ 1 個</b>"],
             ["用途","しきい値・オフセット調整、コントラスト、簡易な可変電圧"]],
       note:"<b>組み込みで最もよく使われる「DAC」。</b>タイマがあれば追加部品ほぼゼロ。ただし <b>f<sub>PWM</sub> = f<sub>clk</sub>/2<sup>N</sup></b> なので、高分解能にすると周波数が落ちてフィルタが重くなる。"}
    ];
    picker(el,A,function(it){
      var h=blk("構造",'<pre style="margin:0;font-family:var(--mono);font-size:.75rem;line-height:1.5;color:var(--muted);white-space:pre">'+
        esc(it.art.join("\n"))+'</pre>',"--muted");
      h+=tbl(["項目","内容"],it.rows);
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;margin-top:.5rem;color:var(--ink);font-size:.86rem">'+it.note+'</div>';
      return h;
    });
    out.innerHTML='<b>DAC 特有の落とし穴は 3 つ: 出力インピーダンス・単調性・グリッチ。</b>'+
      ' ／ <b>負荷を繋いだら電圧が下がった</b> → 出力インピーダンス。バッファが要る'+
      ' ／ <b>フィードバックループの中で使うなら単調性が必須</b>（コードを上げたのに電圧が下がる点があると発振する）'+
      ' ／ <b>ヒゲが出る</b> → メジャーコードグリッチ。LPF かデグリッチャ、あるいはセグメント型の品種に'+
      ' ／ <b>リセット直後に何が出るか（パワーオンのデフォルトコード）は安全設計そのものである。</b>'+
      'ゼロスケールか、ミッドスケールか、ハイインピーダンスか——必ず確認すること';
  };
  /* ---------- 19: プルアップ抵抗の選定 ---------- */
  REG.pullup=function(el){
    head(el,"Pull-up Sizing","下限は I_OL、上限は立ち上がり時間");
    var r=ctrls(el);
    var sV=slider(r,"V_DD [V]",1.8,5,3.3,0.1);
    var sCb=slider(r,"バス容量 C_b [pF]",10,600,150,5);
    var sIol=slider(r,"ドライバの I_OL [mA]",1,20,3,0.5);
    var sVol=slider(r,"許容 V_OL [V]",0.1,0.8,0.4,0.05);
    var spd=select(r,"速度モード",["標準 100 kHz（t_r ≤ 1000 ns）","ファースト 400 kHz（t_r ≤ 300 ns）","ファーストプラス 1 MHz（t_r ≤ 120 ns）"]);
    var sR=slider(r,"選んだ R_pu [kΩ]",0.3,20,4.7,0.1);
    var cv=screen(el,240),cc=cctx(cv),out=readout(el);
    var TRMAX=[1000e-9,300e-9,120e-9];
    function draw(){
      var V=+sV.input.value,Cb=+sCb.input.value*1e-12,Iol=+sIol.input.value*1e-3,
          Vol=+sVol.input.value,sp=+spd.value,Rp=+sR.input.value*1e3;
      sV.val.textContent=f(V,1)+" V";sCb.val.textContent=f(Cb*1e12,0)+" pF";
      sIol.val.textContent=f(Iol*1e3,1)+" mA";sVol.val.textContent=f(Vol,2)+" V";
      sR.val.textContent=f(Rp/1e3,2)+" kΩ";
      var trmax=TRMAX[sp];
      var Rmin=(V-Vol)/Iol;
      var Rmax=trmax/(1.2*Cb);
      var tr=1.2*Rp*Cb;
      var Isink=(V-Vol)/Rp;
      /* 波形 */
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=48,padT=18,padB=44;
      var T=Math.max(tr*2.5,trmax*2.5);
      function X(t){return padL+t/T*(w-padL-16);}
      function Y(v){return h-padB-(v/V)*(h-padT-padB);}
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      [0,0.3,0.7,1].forEach(function(k){
        ctx.beginPath();ctx.moveTo(padL,Y(V*k));ctx.lineTo(w-16,Y(V*k));ctx.stroke();
        lab(ctx,(k===0.3?"V_IL":k===0.7?"V_IH":f(V*k,1)+" V"),
          padL-6,Y(V*k)+4,C("--faint"),"right",10);});
      /* 立ち下がり（能動）と立ち上がり（RC） */
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.6;ctx.beginPath();
      ctx.moveTo(X(0),Y(V));ctx.lineTo(X(T*0.04),Y(Vol));
      ctx.lineTo(X(T*0.28),Y(Vol));
      for(var i=0;i<=200;i++){var t=T*0.28+(T*0.72)*i/200;
        var vv=Vol+(V-Vol)*(1-Math.exp(-(t-T*0.28)/(Rp*Cb)));
        ctx.lineTo(X(t),Y(vv));}
      ctx.stroke();
      /* t_r 区間 */
      var t10=T*0.28+Rp*Cb*Math.log(1/(1-0.3)),t90=T*0.28+Rp*Cb*Math.log(1/(1-0.7));
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(X(t10),Y(V*0.3));ctx.lineTo(X(t10),h-padB+16);
      ctx.moveTo(X(t90),Y(V*0.7));ctx.lineTo(X(t90),h-padB+16);ctx.stroke();
      ctx.beginPath();ctx.moveTo(X(t10),h-padB+12);ctx.lineTo(X(t90),h-padB+12);ctx.stroke();
      lab(ctx,"t_r = "+f(tr*1e9,0)+" ns",(X(t10)+X(t90))/2,h-padB+28,C("--alias"),"center",10);
      /* 規格上限 */
      var tlim=T*0.28+trmax;
      if(X(tlim)<w-16){ctx.strokeStyle=C("--blue");ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.moveTo(X(tlim),padT);ctx.lineTo(X(tlim),h-padB);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"規格上限",X(tlim)+4,padT+12,C("--blue"),"left",10);}
      lab(ctx,"L に引く（能動）",padL+4,padT+12,C("--muted"),"left",10);
      lab(ctx,"H に戻る（R·C で指数関数的）",X(T*0.35),padT+12,C("--muted"),"left",10);
      var okLo=Rp>=Rmin, okHi=tr<=trmax;
      out.innerHTML='<b>下限（I<sub>OL</sub> 制約）: R ≥ (V<sub>DD</sub>−V<sub>OL</sub>)/I<sub>OL</sub> = '+
        f(Rmin,0)+' Ω</b>'+
        ' ／ <b>上限（t<sub>r</sub> 制約）: R ≤ t<sub>r,max</sub>/(1.2·C<sub>b</sub>) = '+
        f(Rmax,0)+' Ω</b>'+
        ' ／ 使える範囲は <b>'+f(Rmin/1e3,2)+' 〜 '+f(Rmax/1e3,2)+' kΩ</b>'+
        (Rmin>Rmax?'（<span class="warn">範囲がない——バス容量を減らすかバスバッファが要る</span>）':'')+
        ' ／ 選んだ '+f(Rp/1e3,2)+' kΩ では t<sub>r</sub> = <b>'+f(tr*1e9,0)+' ns</b>、'+
        'L のとき流れる電流 <b>'+f(Isink*1e3,2)+' mA</b> — '+
        (okLo&&okHi?'<span class="ok">両方の制約を満たす</span>':
         !okLo?'<span class="warn">小さすぎ——ドライバが L に引ききれない</span>':
               '<span class="warn">大きすぎ——立ち上がりが規格を超える</span>')+
        ' ／ <b>波形が丸く見えるなら抵抗を下げるかバス容量を減らす。</b>'+
        'オシロで立ち上がりを実測するのが最も確実'+
        ' ／ <b>センサモジュール側のプルアップが並列に入る事故が非常に多い。</b>'+
        '4.7 kΩ × 4 個 = 1.18 kΩ になり、L に引けなくなる'+
        ' ／ 電池駆動では、L のとき流れる '+f(Isink*1e3,2)+' mA が<b>そのまま電池を消費する</b>';
    }
    [sV,sCb,sIol,sVol,sR].forEach(function(s){s.input.addEventListener("input",draw);});
    spd.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 20: シングルエンド vs 差動 ---------- */
  REG.diffse=function(el){
    head(el,"Single-ended vs Differential","コモンモードは差で消える");
    var r=ctrls(el);
    var sN=slider(r,"外来ノイズ振幅 [mV]",0,2000,600,10);
    var sG=slider(r,"GND 電位差 [V]",-8,8,1.5,0.1);
    var sA=slider(r,"信号振幅 [V]",0.2,3.3,2,0.1);
    var sM=slider(r,"差動のミスマッチ [%]",0,20,2,0.5);
    var cv=screen(el,260),cc=cctx(cv),out=readout(el);
    var seed=777;
    function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff-0.5;}
    function draw(){
      var Nn=+sN.input.value/1000,Gd=+sG.input.value,Av=+sA.input.value,mm=+sM.input.value/100;
      sN.val.textContent=f(Nn*1e3,0)+" mV";sG.val.textContent=(Gd>=0?"+":"")+f(Gd,1)+" V";
      sA.val.textContent=f(Av,1)+" V";sM.val.textContent=f(mm*100,1)+" %";
      var N=400;
      seed=777;
      var noise=[];for(var i=0;i<=N;i++)noise.push(Nn*(Math.sin(TAU*7*i/N)*0.6+rnd()*1.4));
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=104,padT=18,padB=26,rows=3,rh=(h-padT-padB)/rows;
      function X(i){return padL+i/N*(w-padL-16);}
      var names=["シングルエンド","差動 +/− の各線","差動の受信結果"];
      var thr=Av/2;
      var errSE=0,errDF=0;
      for(var k=0;k<rows;k++){
        var y0=padT+k*rh,y1=y0+rh-10,ym=(y0+y1)/2;
        lab(ctx,names[k],padL-8,ym+4,C("--muted"),"right",10);
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(padL,y1);ctx.lineTo(w-16,y1);ctx.stroke();
        var span=Math.max(Av*1.2,Math.abs(Gd)+Nn*2+Av);
        function Y(v){return ym-(v/span)*((y1-y0)/2)*1.7;}
        if(k===0){
          ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
          ctx.beginPath();ctx.moveTo(padL,Y(thr));ctx.lineTo(w-16,Y(thr));ctx.stroke();ctx.setLineDash([]);
          ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;ctx.beginPath();
          for(var i2=0;i2<=N;i2++){
            var s=(Math.floor(i2/40)%2)?Av:0;
            var v=s+noise[i2]+Gd;
            var yy=Math.max(y0,Math.min(y1,Y(v)));
            i2?ctx.lineTo(X(i2),yy):ctx.moveTo(X(i2),yy);
            var truth=(Math.floor(i2/40)%2)?1:0;
            if(((v>thr)?1:0)!==truth)errSE++;
          }
          ctx.stroke();
        }else if(k===1){
          [1,-1].forEach(function(sg,idx){
            ctx.strokeStyle=C(idx?"--blue":"--signal");ctx.lineWidth=1.6;ctx.beginPath();
            for(var i3=0;i3<=N;i3++){
              var s2=(Math.floor(i3/40)%2)?Av/2:-Av/2;
              var v2=sg*s2+noise[i3]*(idx?(1-mm):1)+Gd;
              var yy2=Math.max(y0,Math.min(y1,Y(v2)));
              i3?ctx.lineTo(X(i3),yy2):ctx.moveTo(X(i3),yy2);
            }
            ctx.stroke();
          });
        }else{
          ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
          ctx.beginPath();ctx.moveTo(padL,Y(0));ctx.lineTo(w-16,Y(0));ctx.stroke();ctx.setLineDash([]);
          ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.beginPath();
          for(var i4=0;i4<=N;i4++){
            var s3=(Math.floor(i4/40)%2)?Av/2:-Av/2;
            var vp=s3+noise[i4],vn=-s3+noise[i4]*(1-mm);
            var dv=vp-vn;
            var yy3=Math.max(y0,Math.min(y1,Y(dv)));
            i4?ctx.lineTo(X(i4),yy3):ctx.moveTo(X(i4),yy3);
            var truth2=(Math.floor(i4/40)%2)?1:0;
            if(((dv>0)?1:0)!==truth2)errDF++;
          }
          ctx.stroke();
        }
      }
      var cmrr=mm>0?20*Math.log10(1/mm):Infinity;
      out.innerHTML='シングルエンドの誤判定 <b>'+errSE+' / '+(N+1)+'</b>'+
        ' ／ 差動の誤判定 <b>'+errDF+' / '+(N+1)+'</b>'+
        ' ／ <b>ノイズと GND 電位差は「両方の線に同じだけ乗る（コモンモード）」ので、差を取れば消える</b>'+
        ' ／ ミスマッチ '+f(mm*100,1)+' % のときの CMRR ≈ <b>'+(isFinite(cmrr)?f(cmrr,0)+" dB":"∞")+'</b>'+
        '——<b>差動の性能は「2 本がどれだけ揃っているか」で決まる。</b>'+
        'だから等長・等間隔・撚り線が要る'+
        ' ／ もう 1 つの利点: <b>+側と −側の電流が逆向きなので、放射も打ち消し合う</b>'+
        ' ／ ただし<b>コモンモード電圧には許容範囲がある</b>——'+
        'RS-485 で −7〜+12 V、これを超えると通信できないか壊れる';
    }
    [sN,sG,sA,sM].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 20: インタフェース比較 ---------- */
  REG.ifcompare=function(el){
    head(el,"Interfaces","4 つの軸で分類する");
    readout(el);var out=el.querySelector(".readout");
    var A=[
      {n:"UART",c:"--signal",
       rows:[["信号","シングルエンド・プッシュプル"],["クロック","<b>なし（非同期）</b>"],
             ["接続","点対点"],["速度","〜1 Mbps"],["距離","〜数 m（TTL レベル）"],
             ["クロック精度","<b>±2 % 以下</b>（送受合わせて 5 % 未満）"],
             ["ピン数","2（+ GND）"]],
       trap:["<b>GND を繋ぎ忘れる</b>——動いたり動かなかったりする","ボーレート誤差（分周比の整数化で数 % ずれる）","長い配線で GND 電位差とノイズがそのまま乗る","TX/RX の交差を間違える"],
       fix:"数 m を超えるなら <b>RS-485 か絶縁 UART</b> に変える。11.0592 MHz / 14.7456 MHz の水晶は 115200 で割り切れる。"},
      {n:"SPI",c:"--signal",
       rows:[["信号","シングルエンド・プッシュプル"],["クロック","あり（同期）"],
             ["接続","1 対 N（CS で選択）"],["速度","〜100 MHz"],["距離","<b>〜30 cm</b>"],
             ["クロック精度","<b>不要</b>"],["ピン数","3 + スレーブ数"]],
       trap:["<b>SCLK のリンギングで余分にカウント</b>してデータがずれる","往復遅延で速度が頭打ちになる","CS にプルアップがなく、リセット中に不定になる","MISO が 3 ステートでないスレーブがいる"],
       fix:"<b>SCLK に直列 22〜33 Ω のダンピング抵抗</b>を送信 IC の直近に。速度の上限は <b>T/2 > 2t<sub>prop</sub> + t<sub>co</sub> + t<sub>su</sub></b> で決まる（配線 30 cm で約 20 MHz）。"},
      {n:"I2C",c:"--blue",
       rows:[["信号","シングルエンド・<b>オープンドレイン</b>"],["クロック","あり（同期）"],
             ["接続","<b>マルチドロップ</b>（ワイヤード AND）"],["速度","〜1 MHz"],
             ["距離","〜1 m／<b>バス容量 400 pF まで</b>"],["クロック精度","不要"],["ピン数","<b>2 本だけ</b>"]],
       trap:["<b>立ち上がりが RC なので速度の律速になる</b>（t_r = 1.2·R·C_b）","<b>バスハング</b>——リセット時にスレーブが SDA を L に保持したまま固まる","複数モジュールのプルアップが並列に入って L に引けない","アドレス衝突","長い配線で 400 pF を超える"],
       fix:"バスハングは <b>SCL を最大 9 回トグル → STOP 発行</b>で復旧する（ソフトに実装しておく）。<b>基板外に出さないのが定石。</b>どうしても必要なら絶縁 I2C かバスバッファ。"},
      {n:"CAN / CAN FD",c:"--alias",
       rows:[["信号","<b>差動</b>（優勢／劣勢）"],["クロック","なし（ビットスタッフで同期）"],
             ["接続","マルチドロップ"],["速度","〜1 Mbps（FD で 8 Mbps）"],["距離","〜1000 m"],
             ["クロック精度","<b>±0.5 % 以下 → 水晶が必須</b>"],["終端","<b>両端に 120 Ω</b>"]],
       trap:["<b>終端がない／片側だけ</b>——短距離では動くので気づきにくい","<b>「1 台外すと通信できない」</b>——外した機器に終端が載っていた","内蔵 RC 発振器を使って通らない","ビットタイミング（サンプルポイント）が全ノードで揃っていない","スタブが長い"],
       fix:"<b>バス全体の抵抗を測って 60 Ω（120∥120）</b>になるか確認するのが最も簡単な診断。優勢が劣勢に勝つのでアービトレーションが自然に働き、衝突による再送が要らない。"},
      {n:"RS-485",c:"--blue",
       rows:[["信号","<b>差動</b>・3 ステート"],["クロック","なし"],["接続","マルチドロップ（32〜256 ノード）"],
             ["速度","〜10 Mbps"],["距離","<b>〜1200 m</b>"],
             ["コモンモード範囲","<b>−7 V 〜 +12 V</b>"],["終端","両端に 120 Ω"]],
       trap:["<b>方向制御（DE）を落とすのが早すぎて最後のバイトが切れる</b>","<b>バイアス抵抗がなくアイドル時にバスが不定</b>——フレーミングエラーが出続ける","<b>GND を繋いでいない</b>——コモンモード範囲を超えると通信不能・機器破損"],
       fix:"DE は<b>シフトレジスタが空になった割り込み（TC）で落とす</b>。フェイルセーフ・レシーバでなければバイアス抵抗が要る。シールドか第 3 線で GND を繋ぐか、絶縁する。"},
      {n:"USB / 高速差動",c:"--signal",
       rows:[["信号","<b>差動</b>・プッシュプル"],["差動インピーダンス","<b>USB 90 Ω / Ethernet・LVDS 100 Ω / PCIe 85 Ω</b>"],
             ["速度","12 M / 480 Mbps 〜 Gbps"],["距離","5 m（USB 2.0）"],
             ["クロック精度","<b>±0.25 %（Full Speed）→ 水晶必須</b>"],
             ["ESD","<b>低容量 TVS（< 1 pF）</b>"]],
       trap:["差動インピーダンスの不整合","<b>等長になっていない</b>（ペア内スキューがコモンモードノイズになる）","<b>参照プレーンを跨いでリターンパスが切れる</b>","ESD 保護の容量が大きすぎる","ケーブルが悪い（本当に多い）"],
       fix:"基板メーカに<b>インピーダンス制御</b>を依頼し、層構成と線幅／間隔を指定する。<b>層変更のビアには GND ビアを添える</b>（23 章）。"}
    ];
    picker(el,A,function(it){
      var h=tbl(["項目","内容"],it.rows);
      h+=blk("よくあるトラブル",ul(it.trap),"--alias");
      h+='<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+it.fix+'</div>';
      return h;
    });
    out.innerHTML='<b>分類の 4 軸: シングルエンド／差動・プッシュプル／オープンドレイン・同期／非同期・点対点／マルチドロップ。</b>'+
      ' この 4 つで各方式の性格はほぼ決まる'+
      ' ／ <b>「長い」「ノイジー」「機器をまたぐ」なら差動一択</b>'+
      ' ／ <b>基板をまたぐなら I2C は避ける。</b>産業機器では定石';
  };

  /* ---------- 21: ゲート駆動 ---------- */
  REG.gatedrive=function(el){
    head(el,"Gate Drive","速い＝低損失だが、誤 ON と EMI のリスク");
    var r=ctrls(el);
    var sQ=slider(r,"Q_g [nC]",2,200,40,1);
    var sQgd=slider(r,"Q_gd（ミラー電荷）[nC]",0.5,80,12,0.5);
    var sVdr=slider(r,"ドライブ電圧 [V]",5,20,12,0.5);
    var sIo=slider(r,"ドライバのピーク電流 [A]",0.05,10,1,0.05);
    var sRg=slider(r,"ゲート抵抗 R_g [Ω]",0,100,10,1);
    var sV=slider(r,"V_DS [V]",12,800,400,1);
    var sI=slider(r,"負荷電流 [A]",0.5,50,10,0.5);
    var sF=slider(r,"周波数 [kHz]",5,500,50,5);
    var sCgd=slider(r,"C_gd/C_gs 比",0.02,0.5,0.1,0.01);
    var sVth=slider(r,"V_th [V]",1,6,3,0.1);
    var cv=screen(el,220),cc=cctx(cv),out=readout(el);
    function draw(){
      var Qg=+sQ.input.value*1e-9,Qgd=+sQgd.input.value*1e-9,Vdr=+sVdr.input.value,
          Io=+sIo.input.value,Rg=+sRg.input.value,V=+sV.input.value,I=+sI.input.value,
          fs=+sF.input.value*1e3,ratio=+sCgd.input.value,Vth=+sVth.input.value;
      sQ.val.textContent=f(Qg*1e9,0)+" nC";sQgd.val.textContent=f(Qgd*1e9,1)+" nC";
      sVdr.val.textContent=f(Vdr,1)+" V";sIo.val.textContent=f(Io,2)+" A";
      sRg.val.textContent=f(Rg,0)+" Ω";sV.val.textContent=f(V,0)+" V";
      sI.val.textContent=f(I,1)+" A";sF.val.textContent=f(fs/1e3,0)+" kHz";
      sCgd.val.textContent=f(ratio,2);sVth.val.textContent=f(Vth,1)+" V";
      /* 実効ゲート電流: ドライバのピークと R_g で制限（プラトー電圧 ≈ Vdr/2 と仮定） */
      var Ig=Math.min(Io,(Vdr-Vdr*0.45)/Math.max(0.5,Rg+2));
      var tsw=Qgd/Ig;
      var dvdt=V/tsw;
      var Psw=V*I*tsw*fs;                 /* ON+OFF 合わせて概ね */
      var Pg=Qg*Vdr*fs;
      var Vspur=ratio/(1+ratio)*V;        /* 誤 ON のゲート持ち上がり（クランプなし・最悪） */
      var risk=Vspur>Vth;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var items=[["遷移時間 t_sw",tsw*1e9,"ns",tsw*1e9,200,"--signal"],
                 ["dV/dt",dvdt/1e9,"V/ns",dvdt/1e9,100,"--alias"],
                 ["スイッチング損失",Psw,"W",Psw,50,"--signal"],
                 ["ゲート駆動損失",Pg,"W",Pg,5,"--blue"],
                 ["誤 ON のゲート電圧",Vspur,"V",Vspur,Math.max(Vth*2,10),risk?"--alias":"--muted"]];
      var padL=Math.min(180,w*0.4),padT=18,bh=24,gap=12;
      items.forEach(function(it,i){
        var y=padT+i*(bh+gap);
        lab(ctx,it[0],padL-8,y+bh/2+4,C("--muted"),"right",10);
        ctx.fillStyle=C("--screen");rrect(ctx,padL,y,w-padL-92,bh,4);ctx.fill();
        var frac=Math.min(1,it[3]/it[4]);
        ctx.fillStyle=C(it[5]);rrect(ctx,padL,y,Math.max(3,(w-padL-92)*frac),bh,4);ctx.fill();
        lab(ctx,f(it[1],it[1]<1?3:1)+" "+it[2],w-86,y+bh/2+4,C("--ink"),"left",10);
      });
      if(risk){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        var yv=padT+4*(bh+gap);
        var xt=padL+(w-padL-92)*Math.min(1,Vth/Math.max(Vth*2,10));
        ctx.beginPath();ctx.moveTo(xt,yv-4);ctx.lineTo(xt,yv+bh+4);ctx.stroke();
        lab(ctx,"V_th",xt,yv-8,C("--alias"),"center",9);
      }
      out.innerHTML='実効ゲート電流 <b>'+f(Ig,2)+' A</b>（ドライバのピーク電流と R<sub>g</sub> の小さいほうで決まる）'+
        ' ／ 遷移時間 <b>t = Q<sub>gd</sub>/I<sub>g</sub> = '+f(tsw*1e9,0)+' ns</b>'+
        ' ／ <b>dV/dt = '+f(dvdt/1e9,2)+' V/ns</b>'+
        (dvdt/1e9>10?' ／ <span class="warn">アイソレータの CMTI（50 kV/µs = 50 V/ns 級）に注意</span>':'')+
        ' ／ スイッチング損失 <b>'+f(Psw,2)+' W</b>、ゲート駆動損失 <b>'+f(Pg,3)+' W</b>'+
        ' ／ 誤 ON のゲート持ち上がり <b>V = C<sub>gd</sub>/(C<sub>gd</sub>+C<sub>gs</sub>)·ΔV<sub>ds</sub> = '+
        f(Vspur,2)+' V</b> vs V<sub>th</sub> = '+f(Vth,1)+' V'+
        (risk?' ／ <span class="warn">閾値を超える——上下同時 ON（貫通）の危険</span>':' ／ <span class="ok">閾値以下</span>')+
        ' ／ <b>R<sub>g</sub> を小さくすると損失は減るが dV/dt と EMI が増える。</b>'+
        'ON と OFF で別の値にする（ダイオード + 抵抗）のが定石で、<b>OFF を速く</b>する'+
        ' ／ 誤 ON 対策: <b>ミラークランプ機能付きドライバ、負バイアス（SiC/GaN では標準）</b>'+
        ' ／ MCU の GPIO（20 mA）では I<sub>g</sub> が桁違いに小さく、'+
        '遷移が µs オーダになって<b>確実に焼ける</b>';
    }
    [sQ,sQgd,sVdr,sIo,sRg,sV,sI,sF,sCgd,sVth].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 22: H ブリッジとデッドタイム ---------- */
  REG.hbridge=function(el){
    head(el,"Dead Time","短すぎれば貫通、長すぎれば歪み");
    var r=ctrls(el);
    var sD=slider(r,"PWM デューティ [%]",0,100,40,0.5);
    var sDT=slider(r,"デッドタイム [ns]",0,2000,200,10);
    var sOn=slider(r,"turn-on 時間 [ns]",5,500,60,5);
    var sOff=slider(r,"turn-off 時間 [ns]",5,500,90,5);
    var sSk=slider(r,"ドライバのスキュー [ns]",0,300,30,5);
    var sF=slider(r,"PWM 周波数 [kHz]",1,100,20,1);
    var sV=slider(r,"V_M [V]",5,400,24,1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var D=+sD.input.value/100,dt=+sDT.input.value*1e-9,ton=+sOn.input.value*1e-9,
          toff=+sOff.input.value*1e-9,sk=+sSk.input.value*1e-9,fs=+sF.input.value*1e3,V=+sV.input.value;
      sD.val.textContent=f(D*100,1)+" %";sDT.val.textContent=f(dt*1e9,0)+" ns";
      sOn.val.textContent=f(ton*1e9,0)+" ns";sOff.val.textContent=f(toff*1e9,0)+" ns";
      sSk.val.textContent=f(sk*1e9,0)+" ns";sF.val.textContent=f(fs/1e3,0)+" kHz";
      sV.val.textContent=f(V,0)+" V";
      var need=toff-ton+sk;
      var margin=dt-need;
      var T=1/fs;
      var Dlost=dt/T;
      var Deff=Math.max(0,D-Dlost);
      var Verr=V*Dlost;
      /* 波形 */
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=100,padT=18,padB=30,rows=3,rh=(h-padT-padB)/rows;
      var tw=Math.max(T*0.25,(dt+toff+ton+sk)*4);
      var t0=T*D;   /* 立ち下がりの位置 */
      var tstart=t0-tw*0.3;
      function X(t){return padL+(t-tstart)/tw*(w-padL-16);}
      var names=["ハイサイド ゲート","ローサイド ゲート","貫通電流"];
      /* ハイサイド OFF: t0 から toff で落ちる。ローサイド ON: t0+dt+sk から ton で上がる */
      var hEnd=t0+toff, lStart=t0+dt+sk, lEnd=lStart+ton;
      for(var k=0;k<rows;k++){
        var y0=padT+k*rh,y1=y0+rh-10;
        lab(ctx,names[k],padL-8,(y0+y1)/2+4,C("--muted"),"right",10);
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(padL,y1);ctx.lineTo(w-16,y1);ctx.stroke();
        if(k===0){
          ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
          ctx.moveTo(X(tstart),y0);ctx.lineTo(X(t0),y0);ctx.lineTo(X(hEnd),y1);ctx.lineTo(X(tstart+tw),y1);
          ctx.stroke();
        }else if(k===1){
          ctx.strokeStyle=C("--blue");ctx.lineWidth=2.2;ctx.beginPath();
          ctx.moveTo(X(tstart),y1);ctx.lineTo(X(lStart),y1);ctx.lineTo(X(lEnd),y0);ctx.lineTo(X(tstart+tw),y0);
          ctx.stroke();
        }else{
          /* 両方が V_th（50 %）を超えている期間 */
          var h50=t0+toff*0.5, l50=lStart+ton*0.5;
          ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;
          if(l50<h50){
            ctx.fillStyle=C("--alias-soft");
            ctx.fillRect(X(l50),y0,X(h50)-X(l50),y1-y0);
            ctx.beginPath();ctx.moveTo(X(tstart),y1);ctx.lineTo(X(l50),y1);
            ctx.lineTo(X((l50+h50)/2),y0);ctx.lineTo(X(h50),y1);ctx.lineTo(X(tstart+tw),y1);
            ctx.stroke();
            lab(ctx,"貫通！",X((l50+h50)/2),y0+12,C("--alias"),"center",11);
          }else{
            ctx.beginPath();ctx.moveTo(X(tstart),y1);ctx.lineTo(X(tstart+tw),y1);ctx.stroke();
            lab(ctx,"貫通なし",X(tstart)+8,(y0+y1)/2+4,C("--muted"),"left",10);
          }
        }
      }
      /* デッドタイム区間 */
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(X(t0),padT);ctx.lineTo(X(t0),h-padB+6);
      ctx.moveTo(X(t0+dt),padT);ctx.lineTo(X(t0+dt),h-padB+6);ctx.stroke();
      lab(ctx,"デッドタイム "+f(dt*1e9,0)+" ns",(X(t0)+X(t0+dt))/2,h-padB+20,C("--muted"),"center",10);
      out.innerHTML='<b>必要なデッドタイム ≥ t<sub>off</sub> − t<sub>on</sub> + スキュー = '+
        f(need*1e9,0)+' ns</b> ／ 設定は '+f(dt*1e9,0)+' ns'+
        (margin<0?' ／ <span class="warn">不足——上下が同時 ON になる（貫通電流で破壊）</span>':
                  ' ／ <span class="ok">余裕 '+f(margin*1e9,0)+' ns</span>')+
        ' ／ 一方で、デッドタイムぶんデューティが失われる: <b>'+f(Dlost*100,2)+' %</b>'+
        '（実効デューティ '+f(Deff*100,1)+' %、出力電圧の誤差 <b>約 '+f(Verr,2)+' V</b>）'+
        ' ／ <b>これがデッドタイム歪みで、モータのベクトル制御ではソフトで補償する</b>'+
        ' ／ <b>周波数を上げると、同じデッドタイムでも失われる割合が増える</b>'+
        ' ／ 検証は<b>オシロで上下のゲート電圧を同時に観測</b>し、'+
        '<b>高温・最大電流の最悪条件で</b>行うこと。常温で 100 ns あった余裕が 85 ℃ で消えることがある'+
        ' ／ デッドタイム中は<b>ボディダイオードが還流する</b>ので、長すぎると損失が増える';
    }
    [sD,sDT,sOn,sOff,sSk,sF,sV].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 23: 反射とリンギング ---------- */
  REG.reflect=function(el){
    head(el,"Reflection","CMOS 入力は開放＝全反射");
    var r=ctrls(el);
    var sLen=slider(r,"配線長 [cm]",1,100,20,1);
    var sZ0=slider(r,"特性インピーダンス Z_0 [Ω]",30,150,55,1);
    var sRs=slider(r,"送信の出力抵抗 [Ω]",5,100,25,1);
    var sRd=slider(r,"直列ダンピング抵抗 [Ω]",0,150,0,1);
    var sTr=slider(r,"立ち上がり時間 t_r [ns]",0.1,20,1,0.1);
    var sV=slider(r,"V_DD [V]",1.8,5,3.3,0.1);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var len=+sLen.input.value/100,Z0=+sZ0.input.value,Rs=+sRs.input.value,
          Rd=+sRd.input.value,tr=+sTr.input.value*1e-9,V=+sV.input.value;
      sLen.val.textContent=f(len*100,0)+" cm";sZ0.val.textContent=f(Z0,0)+" Ω";
      sRs.val.textContent=f(Rs,0)+" Ω";sRd.val.textContent=f(Rd,0)+" Ω";
      sTr.val.textContent=f(tr*1e9,1)+" ns";sV.val.textContent=f(V,1)+" V";
      var v=1.7e8, td=len/v;
      var Rsrc=Rs+Rd;
      var Gs=(Rsrc-Z0)/(Rsrc+Z0), Gl=1;      /* 受信端は開放 */
      var lcrit=tr*v/6;
      /* 受信端波形（ラティス法） */
      var T=Math.max(td*14,tr*10);
      var c=chart(cc,0,T*1e9,-0.35*V,1.9*V,{l:52,b:30,t:18});
      grid(c,5);axis(c);var ctx=c.ctx;
      for(var q=0;q<=2;q++){var yv=V*q*0.9;lab(ctx,f(yv,1)+" V",c.p.l-6,c.Y(yv)+4,C("--faint"),"right",10);}
      lab(ctx,"時間 [ns]",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* しきい値 */
      [[0.7,"V_IH"],[0.3,"V_IL"]].forEach(function(m){
        ctx.strokeStyle=C("--grid");ctx.setLineDash([3,3]);
        ctx.beginPath();ctx.moveTo(c.p.l,c.Y(V*m[0]));ctx.lineTo(c.w-c.p.r,c.Y(V*m[0]));ctx.stroke();ctx.setLineDash([]);
        lab(ctx,m[1],c.w-c.p.r-4,c.Y(V*m[0])-4,C("--faint"),"right",9);});
      /* 絶対最大定格 */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(V+0.7));ctx.lineTo(c.w-c.p.r,c.Y(V+0.7));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"V_DD+0.7（ESD ダイオード導通）",c.p.l+6,c.Y(V+0.7)-5,C("--alias"),"left",9);
      /* 波形合成 */
      function step(t,t0){ if(t<t0)return 0; if(t>t0+tr)return 1; return (t-t0)/tr; }
      var Vinit=V*Z0/(Rsrc+Z0);
      var P=[],mx=0,mn=9,cross=0,prev=0;
      for(var i=0;i<=600;i++){
        var t=T*i/600,vv=0,amp=Vinit,tarr=td;
        for(var b=0;b<24;b++){
          vv+=amp*(1+Gl)*step(t,tarr);
          amp=amp*Gl*Gs;
          tarr+=2*td;
          if(Math.abs(amp)<1e-4)break;
        }
        P.push([t*1e9,vv]);
        mx=Math.max(mx,vv);mn=Math.min(mn,vv);
        var s=vv>V*0.7?1:vv<V*0.3?0:prev;
        if(s!==prev)cross++;
        prev=s;
      }
      line(c,P,C("--signal"),2.6);
      var os=100*(mx-V)/V;
      var isTL=len>lcrit;
      out.innerHTML='伝播遅延 <b>'+f(td*1e9,2)+' ns</b>（約 6 ns/m）'+
        ' ／ 伝送線路として扱うべき臨界長 <b>≈ 2.8 × t<sub>r</sub>[ns] = '+f(lcrit*100,1)+' cm</b>'+
        ' — '+(isTL?'<span class="warn">この配線は伝送線路である</span>':'<span class="ok">集中定数扱いでよい</span>')+
        ' ／ 送信端の反射係数 Γ<sub>S</sub> = (R<sub>S</sub>+R<sub>d</sub>−Z<sub>0</sub>)/(R<sub>S</sub>+R<sub>d</sub>+Z<sub>0</sub>) = <b>'+
        f(Gs,3)+'</b>、受信端 Γ<sub>L</sub> = <b>+1（CMOS 入力は開放＝全反射）</b>'+
        ' ／ オーバーシュート <b>'+f(os,1)+' %</b>（最大 '+f(mx,2)+' V）'+
        (mx>V+0.7?' ／ <span class="warn">絶対最大定格を超えて ESD ダイオードが導通している</span>':'')+
        ' ／ しきい値を跨いだ回数 <b>'+cross+' 回</b>'+
        (cross>1?' ／ <span class="warn">二重クロック——クロック線なら誤カウントする</span>':'')+
        ' ／ <b>ダンピング抵抗を R<sub>d</sub> = Z<sub>0</sub> − R<sub>S</sub> ≈ '+f(Math.max(0,Z0-Rs),0)+' Ω にしてみること。</b>'+
        'Γ<sub>S</sub> がゼロになり、戻ってきた反射がそこで吸収されてリンギングが消える'+
        ' ／ <b>t<sub>r</sub> を遅くしても消える</b>——臨界長が伸びるから。'+
        'GPIO のスルーレート設定が効くのはこの理由';
    }
    [sLen,sZ0,sRs,sRd,sTr,sV].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ---------- 23: リターン電流の経路 ---------- */
  REG.retpath=function(el){
    head(el,"Return Current","高周波は信号の真下を通る");
    var r=ctrls(el);
    var sF=slider(r,"周波数",1,9,7,0.1);              /* log10 Hz */
    var slit=checkbox(r,"GND プレーンにスリットを入れる",false);
    var cv=screen(el,260),cc=cctx(cv),out=readout(el);
    function draw(){
      var lf=+sF.input.value,fq=Math.pow(10,lf),hasSlit=slit.checked;
      sF.val.textContent=(fq<1e3?f(fq,0)+" Hz":fq<1e6?f(fq/1e3,0)+" kHz":fq<1e9?f(fq/1e6,0)+" MHz":"1 GHz");
      /* 高周波ほど信号直下に集中する度合い */
      var conc=1/(1+Math.pow(1e4/fq,1.0));   /* 0（低周波・拡散）〜1（高周波・集中） */
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=24,padR=24,padT=34,padB=34;
      var x0=padL+46,x1=w-padR-46;
      var ysig=padT+14, ygnd=h-padB-46, gtop=ygnd-14, gbot=h-padB-2;
      /* GND プレーン */
      ctx.fillStyle=C("--screen");
      ctx.fillRect(padL,gtop,w-padL-padR,gbot-gtop);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;
      ctx.strokeRect(padL,gtop,w-padL-padR,gbot-gtop);
      lab(ctx,"GND プレーン（断面）",padL+6,gbot-8,C("--faint"),"left",10);
      var sx=(x0+x1)/2, sw=Math.max(34,(x1-x0)*0.13);
      if(hasSlit){
        ctx.fillStyle=C("--paper");
        ctx.fillRect(sx-sw/2,gtop-1,sw,(gbot-gtop)*0.62);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;
        ctx.strokeRect(sx-sw/2,gtop-1,sw,(gbot-gtop)*0.62);
        lab(ctx,"スリット",sx,gtop-8,C("--alias"),"center",10);
      }
      /* ループ面積の可視化（塗りは信号線とリターン主経路の間） */
      var detour=hasSlit&&conc>0.35;
      var yret=detour?gtop+(gbot-gtop)*0.78:gtop+6+(1-conc)*10;
      ctx.fillStyle=C(detour?"--alias-soft":"--signal-soft");
      ctx.fillRect(x0,ysig,x1-x0,yret-ysig);
      /* 信号配線 */
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x0,ysig);ctx.lineTo(x1,ysig);ctx.stroke();
      lab(ctx,"信号（送信 → 受信）",x0,ysig-12,C("--signal"),"left",11);
      [x0,x1].forEach(function(xx){
        ctx.beginPath();ctx.arc(xx,ysig,4,0,TAU);ctx.fillStyle=C("--signal");ctx.fill();
        ctx.strokeStyle=C("--muted");ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(xx,ysig);ctx.lineTo(xx,gtop+4);ctx.stroke();
      });
      /* リターン電流の分布（プレーン内の深さ方向に描く） */
      var lanes=7;
      for(var k=0;k<lanes;k++){
        var frac=k/(lanes-1);                       /* 0 = 信号直下 */
        var yy=gtop+6+frac*((gbot-gtop)-16)*(0.25+0.75*(1-conc));
        var inten=Math.exp(-Math.pow(frac*(0.7+conc*3.0),2));
        ctx.globalAlpha=0.14+0.8*inten;
        ctx.strokeStyle=C("--blue");ctx.lineWidth=1+3.0*inten;
        ctx.beginPath();
        if(hasSlit&&yy<gtop+(gbot-gtop)*0.61){
          ctx.moveTo(x1,yy);ctx.lineTo(sx+sw/2+10,yy);
          ctx.lineTo(sx+sw/2+10,gtop+(gbot-gtop)*0.78);
          ctx.lineTo(sx-sw/2-10,gtop+(gbot-gtop)*0.78);
          ctx.lineTo(sx-sw/2-10,yy);
          ctx.lineTo(x0,yy);
        }else{
          ctx.moveTo(x1,yy);ctx.lineTo(x0,yy);
        }
        ctx.stroke();
        if(k===0){ctx.globalAlpha=1;
          /* 進行方向の矢印 */
          ctx.beginPath();ctx.moveTo(x0+14,yy-5);ctx.lineTo(x0+2,yy);ctx.lineTo(x0+14,yy+5);ctx.stroke();}
      }
      ctx.globalAlpha=1;
      lab(ctx,"リターン電流（青）",padL+6,h-10,C("--blue"),"left",10);
      lab(ctx,detour?"ループ面積が激増している":"ループ面積（最小）",
        (x0+x1)/2,(ysig+yret)/2+4,C(detour?"--alias":"--muted"),"center",detour?12:11);
      lab(ctx,"線の太さ = リターン電流の密度",w-padR,h-10,C("--faint"),"right",10);
      out.innerHTML='<b>低周波（〜数 kHz）では、リターン電流は最も抵抗の低い経路（プレーン全体）に広がる。</b>'+
        '<b>数百 kHz 以上では、インダクタンスが最小の経路——つまり信号配線の真下——に集中する</b>'+
        ' ／ 現在の集中度 <b>'+f(conc*100,0)+' %</b>'+
        ' ／ <b>スリットのチェックを入れて、周波数を上げてみること</b>'+
        ' ／ スリットを跨ぐと、リターン電流は<b>隙間を大回りして迂回する</b>。その結果:'+
        ul(["<b>ループ面積が激増</b> → インダクタンスが増え、波形が崩れる",
            "<b>特性インピーダンスが不連続</b>になり、そこで反射する",
            "<b>放射が激増</b>（大きなループはアンテナそのもの）",
            "同じ迂回路を通る他の信号と<b>共通インピーダンスで干渉</b>する"])+
        '<b>だから GND プレーンは分割しない。</b>'+
        '「銅を切って分ける」のではなく、<b>配置でアナログとデジタルの領域を分け、'+
        '信号がその境界を跨がないように配線する</b>のが正しい'+
        ' ／ 層を変えるときも同じ問題が起きるので、<b>高速信号のビアには GND ビアを添える</b>';
    }
    sF.input.addEventListener("input",draw);
    slit.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 24: 放射エミッション ---------- */
  REG.emission=function(el){
    head(el,"Radiated Emission","コモンモードのほうが桁違いに効率よく放射する");
    var r=ctrls(el);
    var sA=slider(r,"信号ループ面積 [cm²]",0.1,100,10,0.1);
    var sI=slider(r,"信号電流 [mA]",0.1,500,50,0.1);
    var sTr=slider(r,"立ち上がり時間 t_r [ns]",0.2,50,2,0.1);
    var sF=slider(r,"基本周波数 [MHz]",1,200,25,1);
    var sL=slider(r,"ケーブル長 [m]",0,3,1,0.05);
    var sIcm=slider(r,"コモンモード電流 [µA]",0,200,8,0.5);
    var cls=select(r,"限度値",["CISPR 32 クラス B（民生・3 m）","CISPR 32 クラス A（産業・3 m）"]);
    var cv=screen(el,250),cc=cctx(cv),out=readout(el);
    function draw(){
      var A=+sA.input.value*1e-4,I=+sI.input.value*1e-3,tr=+sTr.input.value*1e-9,
          f0=+sF.input.value*1e6,Lc=+sL.input.value,Icm=+sIcm.input.value*1e-6,cl=+cls.value;
      sA.val.textContent=f(A*1e4,1)+" cm²";sI.val.textContent=f(I*1e3,1)+" mA";
      sTr.val.textContent=f(tr*1e9,1)+" ns";sF.val.textContent=f(f0/1e6,0)+" MHz";
      sL.val.textContent=f(Lc,2)+" m";sIcm.val.textContent=f(Icm*1e6,1)+" µA";
      var Rd=3;   /* 測定距離 3 m */
      function limit(fq){ /* dBµV/m @3m */
        var base=cl===0?[[30e6,40],[230e6,40],[230e6,47],[1e9,47]]:[[30e6,50],[230e6,50],[230e6,57],[1e9,57]];
        return fq<230e6?(cl===0?40:50):(cl===0?47:57);
      }
      /* 高調波の振幅（台形波） */
      function harm(n){
        var fq=n*f0;
        var a=Math.abs(Math.sin(Math.PI*n*0.5)/(Math.PI*n*0.5));
        var b=Math.abs(Math.sin(Math.PI*n*f0*tr)/(Math.PI*n*f0*tr||1e-9));
        return a*b;
      }
      function Edm(fq,amp){ /* V/m, 微小ループ */
        return 1.316e-14*amp*A*fq*fq/Rd;
      }
      function Ecm(fq,amp){ /* V/m, 微小ダイポール */
        return 1.257e-6*amp*Lc*fq/Rd;
      }
      function dBuV(E){return 20*Math.log10(Math.max(E,1e-15)*1e6);}
      var c=chart(cc,Math.log10(30e6),Math.log10(1e9),0,90,{l:56,b:32,t:28});
      grid(c,6);axis(c);var ctx=c.ctx;
      [30,50,100,200,300,500,1000].forEach(function(m){
        var lf=Math.log10(m*1e6);
        if(lf>=c.x0&&lf<=c.x1)lab(ctx,(m<1000?m+"M":"1G"),c.X(lf),c.h-c.p.b+16,C("--faint"),"center",10);});
      for(var q=0;q<=90;q+=20)lab(ctx,q+"",c.p.l-6,c.Y(q)+4,C("--faint"),"right",10);
      lab(ctx,"dBµV/m @3m",c.p.l-6,c.p.t-10,C("--muted"),"right",10);
      lab(ctx,"周波数",c.w-c.p.r,c.h-6,C("--muted"),"right",10);
      /* 限度線 */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(c.X(c.x0),c.Y(limit(30e6)));
      ctx.lineTo(c.X(Math.log10(230e6)),c.Y(limit(30e6)));
      ctx.lineTo(c.X(Math.log10(230e6)),c.Y(limit(300e6)));
      ctx.lineTo(c.X(c.x1),c.Y(limit(300e6)));
      ctx.stroke();
      lab(ctx,"限度値",c.w-c.p.r-4,c.Y(limit(300e6))-6,C("--alias"),"right",10);
      /* 高調波スペクトル */
      var worstDM=-99,worstCM=-99,wf1=0,wf2=0,fails=0;
      for(var n=1;n*f0<=1e9;n+=2){
        var fq=n*f0;if(fq<30e6)continue;
        var amp=harm(n);
        var e1=dBuV(Edm(fq,I*amp)), e2=dBuV(Ecm(fq,Icm*amp));
        var lx=Math.log10(fq);
        ctx.strokeStyle=C("--blue");ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(c.X(lx),c.Y(0));ctx.lineTo(c.X(lx),c.Y(Math.max(0,Math.min(90,e1))));ctx.stroke();
        ctx.strokeStyle=C("--signal");ctx.lineWidth=2.6;
        ctx.beginPath();ctx.moveTo(c.X(lx)+3,c.Y(0));ctx.lineTo(c.X(lx)+3,c.Y(Math.max(0,Math.min(90,e2))));ctx.stroke();
        if(e1>worstDM){worstDM=e1;wf1=fq;}
        if(e2>worstCM){worstCM=e2;wf2=fq;}
        if(Math.max(e1,e2)>limit(fq))fails++;
      }
      lab(ctx,"■ ディファレンシャル（ループ）",c.p.l+8,c.p.t+14,C("--blue"),"left",10);
      lab(ctx,"■ コモンモード（ケーブル）",c.p.l+8,c.p.t+28,C("--signal"),"left",10);
      out.innerHTML='<b>ディファレンシャル放射 E ∝ I·A·f²</b> — 最悪 <b>'+f(worstDM,1)+' dBµV/m</b>'+
        '（'+f(wf1/1e6,0)+' MHz）'+
        ' ／ <b>コモンモード放射 E ∝ I<sub>CM</sub>·L·f</b> — 最悪 <b>'+f(worstCM,1)+' dBµV/m</b>'+
        '（'+f(wf2/1e6,0)+' MHz）'+
        ' ／ 限度値超過の本数 <b>'+fails+'</b>'+
        (fails>0?' ／ <span class="warn">この構成では試験に落ちる</span>':' ／ <span class="ok">余裕あり</span>')+
        '<div style="margin-top:.4rem"><b>比べてみること: ループ面積 10 cm²・電流 50 mA と、'+
        'ケーブル 1 m・コモンモード電流わずか 8 µA が、同程度の放射になる。</b>'+
        '電流にして 3〜4 桁の差である。<b>放射エミッションで落ちる原因の大半がケーブルなのはこのため</b></div>'+
        '<div style="margin-top:.35rem">対策の効き方を確かめること: '+
        '<b>t<sub>r</sub> を 2 → 10 ns にすると高調波が激減する</b>（折れ点が 1/(πt<sub>r</sub>) に下がる）'+
        ' ／ <b>ループ面積を半分にすると 6 dB 下がる</b>'+
        ' ／ <b>ケーブル長を 0 にすると（＝ケーブルを外すと）コモンモード成分が消える</b>——'+
        'これが実際の切り分け手順そのものである</div>';
    }
    [sA,sI,sTr,sF,sL,sIcm].forEach(function(s){s.input.addEventListener("input",draw);});
    cls.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ---------- 25: 部品選定 ---------- */
  REG.partsel=function(el){
    head(el,"Real Component Values","カタログ値と実際の差");
    readout(el);var out=el.querySelector(".readout");
    var st={mlccV:3.3,mlccC:10,mlccSize:0,indI:2,indSat:3,resP:0.25,resR:100,capT:60,capL:2000};
    var A=[
      {n:"MLCC の実効容量",c:"--signal",k:"mlcc"},
      {n:"インダクタの飽和",c:"--blue",k:"ind"},
      {n:"抵抗の電力",c:"--alias",k:"res"},
      {n:"電解コンデンサの寿命",c:"--muted",k:"cap"}
    ];
    var pk;
    function body(it){
      if(it.k==="mlcc"){
        var sizes=[["0402 / X5R","0.82"],["0603 / X7R","0.70"],["0805 / X7R","0.58"],["1206 / X7R","0.45"],["0603 / C0G","0.0"]];
        var rows=[];
        [1.8,3.3,5.0,6.3].forEach(function(V){
          var r2=sizes.map(function(s2){
            var k=+s2[1];
            var ratio=Math.max(0.10,1-k*Math.pow(Math.min(1,V/6.3),0.5));
            return "<b>"+f(ratio*100,0)+"%</b>";
          });
          rows.push([f(V,1)+" V"].concat(r2));
        });
        return blk("公称 10 µF・定格 6.3 V 品の、DC バイアス印加時の実効容量（公称比・目安）",
          tbl(["印加電圧"].concat(sizes.map(function(s){return s[0];})),rows,
            ["left","right","right","right","right","right"]),it.c)+
          '<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+
          '<b>「10 µF」と書いてあっても、3.3 V をかけたら 4〜6 µF しかない</b>（0402 なら 4 µF）。'+
          'これが LDO や DC-DC の「安定条件を満たしているつもりで満たしていない」の最大の原因である'+
          '（14・15 章）。<b>対策: 定格電圧を高くする（16 V 品にする）、サイズを大きくする、C0G を使う（容量は小さい）。</b>'+
          'メーカの DC バイアス特性グラフを必ず確認すること</div>';
      }
      if(it.k==="ind"){
        var rows2=[];
        [["定格電流 I_rms","巻線の発熱で決まる（温度上昇 40 ℃ など）。<b>連続で流せる上限</b>"],
         ["飽和電流 I_sat","<b>インダクタンスが 20〜30 % 低下する電流</b>。定義がメーカで違う"],
         ["見るべき値","<b>I_sat をピーク電流（I_out + ΔI_L/2）と比べる</b>。平均値ではない"],
         ["余裕","最低 1.2〜1.5 倍。高温では I_sat が下がる（20 % 程度）"],
         ["飽和すると","<b>L が急減 → di/dt が跳ね上がる → 電流が暴走 → MOSFET 破壊</b>"],
         ["症状","異常発熱、電流波形の末端が跳ね上がる（三角波が「跳ね上がった三角波」になる）"],
         ["種類","<b>巻線型（低 DCR・高 Q）／積層型（小型・高 DCR）／モールド型（磁気シールド・低鳴き）</b>"]].forEach(function(x){rows2.push(x);});
        return blk("インダクタ選定の要点",tbl(["項目","内容"],rows2),it.c)+
          '<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+
          '<b>15 章のデモでピーク電流を確認し、その 1.3 倍以上の I_sat を持つ品種を選ぶ。</b>'+
          'データシートの L-I 特性グラフ（電流に対するインダクタンスの低下）を見るのが最も確実である</div>';
      }
      if(it.k==="res"){
        var rows3=[];
        [["0402","1/16 W (63 mW)"],["0603","1/10 W (100 mW)"],["0805","1/8 W (125 mW)"],
         ["1206","1/4 W (250 mW)"],["2010","3/4 W"],["2512","1 W"]].forEach(function(x){
          var P=parseFloat(x[1].replace(/[^0-9.]/g,""))* (x[1].indexOf("mW")>0?1e-3:1);
          if(x[1].indexOf("/")>=0&&x[1].indexOf("mW")<0){
            var m=x[1].match(/(\d+)\/(\d+)/);P=+m[1]/+m[2];
          }
          rows3.push([x[0],x[1],f(Math.sqrt(P*0.5*100),1)+" mA",f(Math.sqrt(P*0.5*1000)*1e3/1000*1000,0)+" mA"]);
        });
        return blk("チップ抵抗の電力定格と、ディレーティング 50 % での許容電流",
          tbl(["サイズ","定格電力","100 Ω での許容電流","1 kΩ での許容電流"],rows3,
            ["left","left","right","right"]),it.c)+
          blk("見落としがちな点",ul([
            "<b>定格の 50 % 以下で使う</b>のが実務のディレーティング",
            "<b>定格は 70 ℃ までの値</b>。それ以上では直線的に下げる必要がある",
            "<b>パルス耐量は平均電力とは別</b>——突入電流やサージが乗る場所（電流制限、ESD 経路）では必ず確認する",
            "<b>温度係数</b>: 一般品 100〜200 ppm/℃、精密品 25 ppm/℃ 以下。<b>分圧やシャントでは効く</b>",
            "<b>高抵抗（1 MΩ 以上）は湿度と汚れの影響を受ける</b>",
            "<b>耐電圧</b>: 小さいサイズは最大 50 V 程度。高電圧の分圧では複数直列に"]),it.c)+
          '<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+
          '<b>「抵抗は壊れない部品」ではない。</b>電流制限抵抗・シャント・スナバは、'+
          'ピーク電力とパルス耐量で選ぶ必要がある</div>';
      }
      var rows4=[];
      [[105,2000],[105,5000],[85,2000],[105,10000]].forEach(function(sp){
        var r3=[sp[0]+" ℃ / "+sp[1]+" h"];
        [40,60,85].forEach(function(T){
          var L=sp[1]*Math.pow(2,(sp[0]-T)/10);
          r3.push(L>8760?f(L/8760,1)+" 年":f(L,0)+" 時間");
        });
        rows4.push(r3);
      });
      return blk("アレニウス則: 10 ℃ 下がると寿命が 2 倍",
        tbl(["品種","40 ℃ で使用","60 ℃ で使用","85 ℃ で使用"],rows4,["left","right","right","right"]),it.c)+
        blk("注意",ul([
          "<b>リプル電流による自己発熱を周囲温度に足す</b>必要がある（数 ℃〜十数 ℃）",
          "<b>電源近くは筐体内で最も熱い場所</b>。「室温 25 ℃」で計算してはいけない",
          "<b>「なぜか数年で壊れる製品」の原因の筆頭</b>",
          "長寿命が要るなら <b>固体電解（導電性高分子）</b>か <b>MLCC</b> を検討する",
          "固体電解は寿命が長く ESR も低いが、<b>耐電圧が低く単価が高い</b>"]),it.c)+
        '<div style="border-left:3px solid var('+it.c+');padding-left:.6rem;color:var(--ink);font-size:.86rem">'+
        '<b>製品寿命 10 年を謳うなら、電解コンデンサの寿命計算は必須である。</b>'+
        '85 ℃ 品を 85 ℃ で使えば、保証時間そのもの（2000 時間 = 83 日）しかもたない</div>';
    }
    pk=picker(el,A,body);
    out.innerHTML='<b>データシートの読み方の原則。</b>'+
      ul(["<b>絶対最大定格は「壊れる境界」であって動作保証値ではない</b>",
          "<b>電気的特性には必ず測定条件が付いている</b>（温度・電圧・電流・基板）。条件が違えばその値は出ない",
          "<b>typ しか書かれていないパラメータは保証されていない</b>——電池寿命などの計算に使ってはいけない",
          "<b>表よりグラフのほうが情報量が多い</b>（温度・電圧・電流依存が読める）",
          "<b>アプリケーション情報（推奨回路・レイアウト）は必ず読む</b>",
          "<b>ライフサイクル状態（Active / NRND / EOL）を確認する</b>——NRND を新規設計に選ばない",
          "<b>組み込みの標準は工業品（−40〜85 ℃）</b>。民生品（0〜70 ℃）は屋外で使えない"]);
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
