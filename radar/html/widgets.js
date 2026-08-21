/* レーダー — 章内インタラクティブ部品 */
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
  /* アニメーション（画面外・非表示時は停止） */
  function anim(el,fn){
    var run=true,t0=performance.now();
    function step(now){
      if(!run)return;
      if(!document.hidden&&el.getBoundingClientRect().bottom>0&&
         el.getBoundingClientRect().top<innerHeight){
        try{fn((now-t0)/1000);}catch(e){run=false;}
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return {stop:function(){run=false;}};
  }
  var CLIGHT=3e8, LAM77=3.9e-3;
  function db10(x){return 10*Math.log10(Math.max(x,1e-30));}

  /* ============ 01. echo — 電波の往復 ============ */
  REG.echo=function(el){
    head(el,"DEMO","電波の往復 — τ を測れば R が出る");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sR=slider(row,"目標までの距離 R [m]",15,300,90,5);
    var sSpd=slider(row,"アニメ速度（実時間の何億分の1か）",1,20,6,1);
    var out=readout(el);
    var state={ph:0};
    function draw(t){
      var R=+sR.input.value; sR.val.textContent=R+" m";
      var slow=+sSpd.input.value*1e-8; sSpd.val.textContent="×"+f(+sSpd.input.value,0)+"e-8";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=60,x1=w-70,y=h*0.42;
      var tau=2*R/CLIGHT;              // 実往復時間
      var period=tau/slow+0.6;          // アニメ1周期(s)
      var u=(t%period)/ (tau/slow);     // 0..1 行き, 1..2 帰り
      // 地面とアイコン
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(30,y+58);ctx.lineTo(w-20,y+58);ctx.stroke();
      ctx.fillStyle=C("--signal");
      rrect(ctx,x0-22,y+8,34,42,5);ctx.globalAlpha=.15;ctx.fill();ctx.globalAlpha=1;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;rrect(ctx,x0-22,y+8,34,42,5);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x0-6,y+8);ctx.lineTo(x0+10,y-10);ctx.stroke();
      lab(ctx,"レーダー",x0-4,y+78,C("--muted"),"center");
      ctx.strokeStyle=C("--ink");ctx.lineWidth=2;
      rrect(ctx,x1-16,y+14,44,26,8);ctx.stroke();
      ctx.beginPath();ctx.arc(x1-4,y+44,6,0,TAU);ctx.stroke();
      ctx.beginPath();ctx.arc(x1+18,y+44,6,0,TAU);ctx.stroke();
      lab(ctx,"目標",x1+6,y+78,C("--muted"),"center");
      // パルス
      var px,col;
      if(u<1){px=x0+20+(x1-40-x0)*Math.min(u,1);col=C("--signal");}
      else if(u<2){px=x1-20-(x1-40-x0)*Math.min(u-1,1);col=C("--blue");}
      else {px=null;}
      if(px!=null){
        ctx.strokeStyle=col;ctx.lineWidth=2.4;
        for(var k=0;k<3;k++){
          ctx.globalAlpha=1-k*0.33;
          ctx.beginPath();ctx.arc(px-k*10*(u<1?1:-1),y+30,8+k*5,-1.1,1.1);ctx.stroke();
        }
        ctx.globalAlpha=1;
      }
      // タイムライン
      var ty=h-34;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,ty);ctx.lineTo(x1,ty);ctx.stroke();
      var prog=Math.min(u/2,1);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x0,ty);ctx.lineTo(x0+(x1-x0)*prog,ty);ctx.stroke();
      lab(ctx,"経過 "+f(Math.min(u,2)*tau/2*1e6,2)+" µs",x0,ty-8,C("--muted"));
      if(u>=2) lab(ctx,"τ = "+f(tau*1e6,2)+" µs 受信！",x1,ty-8,C("--blue"),"right");
      out.innerHTML="往復時間 τ = 2R/c = <b>"+f(tau*1e6,3)+" µs</b> ／ 逆算 R = cτ/2 = <b>"+f(R,0)+
        " m</b> ／ 1 µs ≈ 150 m の感覚を体に入れる";
    }
    anim(el,draw); reg(cv,function(){});
  };

  /* ============ 02. bands — 周波数と波長 ============ */
  REG.bands=function(el){
    head(el,"DEMO","周波数 → 波長・バンド・性質");
    var cv=screen(el,200), cc=cctx(cv);
    var row=ctrls(el);
    var sF=slider(row,"周波数 [GHz]（対数）",0,100,74,1);
    var out=readout(el);
    var BANDS=[[1,2,"L","長距離航空監視"],[2,4,"S","空港監視・気象"],[4,8,"C","気象"],
      [8,12,"X","船舶・気象・軍用"],[12,18,"Ku","衛星・一部レーダー"],[18,27,"K","速度取締り・産業 24 GHz"],
      [27,40,"Ka","高分解能・衛星"],[40,75,"V","屋内 60 GHz"],[75,110,"W","車載 76〜81 GHz"]];
    function draw(){
      var lg=+sF.input.value/100;           // 0..1 → 1..110GHz 対数
      var fg=Math.pow(10,Math.log10(1)+lg*(Math.log10(110)-Math.log10(1)));
      sF.val.textContent=f(fg,1)+" GHz";
      var lam=CLIGHT/(fg*1e9);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      // 波形: 画面幅=固定 30cm と見立てる
      var span=0.3, cycles=span/lam;
      var y=h*0.42, x0=30, x1=w-30;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;
      ctx.beginPath();
      var nCyc=Math.min(cycles,240);
      for(var i=0;i<=800;i++){
        var u=i/800, xx=x0+(x1-x0)*u;
        var yy=y-28*Math.sin(TAU*nCyc*u);
        i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }
      ctx.stroke();
      lab(ctx,"画面の幅 = 30 cm と見立てた波",x0,26,C("--muted"));
      if(cycles>240)lab(ctx,"（波が細かすぎるため間引いて表示）",x1,26,C("--faint"),"right");
      // λ 表示
      var lamtxt=lam>=0.01?f(lam*100,1)+" cm":f(lam*1000,2)+" mm";
      lab(ctx,"λ = "+lamtxt,w/2,y+62,C("--signal"),"center",15);
      var b=null; BANDS.forEach(function(bb){if(fg>=bb[0]&&fg<bb[1])b=bb;});
      var noteMap={"V":"酸素吸収 15 dB/km——遠くへ届かないが「漏れない」","W":"車載の主戦場。λ 約 4 mm・最大 5 GHz 幅",
        "K":"24 GHz 産業センサ・旧世代車載","X":"船のレーダーの定番"};
      out.innerHTML="f = <b>"+f(fg,1)+" GHz</b> ／ λ = c/f = <b>"+lamtxt+"</b>"+
        (b?" ／ <b>"+b[2]+" バンド</b>（"+b[3]+"）":"")+
        (b&&noteMap[b[2]]?"<br>"+noteMap[b[2]]:"")+
        " ／ λ/2 素子間隔 = <b>"+f(lam/2*1000,1)+" mm</b>";
    }
    ["input"].forEach(function(ev){sF.input.addEventListener(ev,draw);});
    reg(cv,draw);draw();
  };

  /* ============ 03. radareq — 探知距離 ============ */
  REG.radareq=function(el){
    head(el,"DEMO","レーダー方程式 — SNR と最大距離");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sPt=slider(row,"送信電力 [dBm]",0,30,10,1);
    var sG=slider(row,"アンテナ利得 [dBi]",10,40,25,1);
    var sSg=slider(row,"RCS [dBsm]",-20,30,10,1);
    var sB=slider(row,"帯域 B [MHz]",1,100,10,1);
    var sNF=slider(row,"雑音指数 NF [dB]",2,15,4,0.5);
    var sN=slider(row,"積分数 MN（2 の冪）",0,16,12,1);
    var out=readout(el);
    function draw(){
      var Pt=+sPt.input.value,G=+sG.input.value,Sg=+sSg.input.value,B=+sB.input.value,
          NF=+sNF.input.value,Nn=Math.pow(2,+sN.input.value);
      sPt.val.textContent=Pt+" dBm";sG.val.textContent=G+" dBi";
      sSg.val.textContent=Sg+" dBsm";sB.val.textContent=B+" MHz";
      sNF.val.textContent=f(NF,1)+" dB";sN.val.textContent=f(Nn,0)+" 回（+"+f(db10(Nn),0)+" dB）";
      var lam=LAM77;
      var noise=-174+db10(B*1e6)+NF;             // dBm
      var SNRreq=13;
      function snrAt(R){
        var loss=db10(lam*lam*Math.pow(10,Sg/10)/(Math.pow(4*Math.PI,3)*Math.pow(R,4)));
        return Pt+2*G+loss-noise+db10(Nn);
      }
      // Rmax: SNR=13
      var Rmax=Math.pow(Math.pow(10,(Pt+2*G+db10(lam*lam*Math.pow(10,Sg/10)/Math.pow(4*Math.PI,3))-noise+db10(Nn)-SNRreq)/10),0.25);
      var c=chart(cc,1,1000,-10,80,{l:52});
      grid(c,5);axis(c);
      // 対数距離軸
      function XL(R){return c.p.l+(Math.log10(R)-0)/(3-0)*(c.w-c.p.l-c.p.r);}
      var ctx=c.ctx;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      for(var i=0;i<=300;i++){
        var R=Math.pow(10,i/100), s=snrAt(R);
        var xx=XL(R), yy=c.Y(Math.max(Math.min(s,80),-10));
        i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }
      ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.setLineDash([6,4]);ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(SNRreq));ctx.lineTo(c.w-c.p.r,c.Y(SNRreq));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"検出に必要な 13 dB",c.w-c.p.r-4,c.Y(SNRreq)-6,C("--alias"),"right");
      if(Rmax>1&&Rmax<1000){
        ctx.strokeStyle=C("--blue");ctx.setLineDash([3,4]);
        ctx.beginPath();ctx.moveTo(XL(Rmax),c.Y(-10));ctx.lineTo(XL(Rmax),c.Y(SNRreq));ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"Rmax≈"+f(Rmax,0)+" m",XL(Rmax),c.Y(-10)-6,C("--blue"),"center");
      }
      [1,10,100].forEach(function(R){lab(ctx,R+" m",XL(R),c.h-8,C("--faint"),"center");});
      lab(ctx,"距離 [m]（対数）",c.w-c.p.r,c.h-8,C("--muted"),"right");
      lab(ctx,"SNR[dB]",c.p.l-6,c.p.t+10,C("--muted"),"right");
      out.innerHTML="雑音フロア kTB·F = <b>"+f(noise,1)+" dBm</b> ／ 最大探知距離 ≈ <b>"+
        (Rmax>=1000?"1 km 超":f(Rmax,0)+" m")+"</b>"+
        "<br>傾きは −40 dB/桁（R⁴）。送信 +3 dB しても距離は 1.19 倍——4 乗根の鈍さを確かめてほしい";
    }
    [sPt,sG,sSg,sB,sNF,sN].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 04. rcs — 向きで変わる反射 ============ */
  REG.rcs=function(el){
    head(el,"DEMO","形と向きで変わる RCS");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sel=select(row,"形状",["平板（10 cm 角）","球（半径 10 cm）","コーナーリフレクタ（辺 10 cm）"]);
    var sA=slider(row,"向き（アスペクト角）[°]",-60,60,8,1);
    var out=readout(el);
    function rcsOf(kind,deg){
      var th=deg*Math.PI/180, lam=LAM77, a=0.1;
      if(kind===1){return Math.PI*a*a;}                       // 球
      if(kind===0){                                            // 平板 sinc^2
        var A=a*a, peak=4*Math.PI*A*A/(lam*lam);
        var u=Math.PI*a/lam*Math.sin(th)*2;
        var s=u===0?1:Math.sin(u)/u;
        return Math.max(peak*s*s*Math.pow(Math.cos(th),2),1e-6);
      }
      var peak=4*Math.PI*Math.pow(a,4)/(3*lam*lam);            // コーナー
      var wdt=Math.cos(th*1.2); wdt=Math.max(wdt,0.02);
      return peak*Math.pow(wdt,4);
    }
    function draw(){
      var kind=+sel.value, deg=+sA.input.value;
      sA.val.textContent=deg+"°";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w*0.3, cy=h*0.52;
      // 入射波
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.6;
      for(var k=0;k<3;k++){
        ctx.beginPath();ctx.moveTo(30+k*4,cy-50+k*0);ctx.moveTo(30,cy-44+k*44-22);
        ctx.lineTo(cx-70,cy-44+k*44-22);ctx.stroke();
      }
      lab(ctx,"入射",34,cy-78,C("--signal"));
      // 形状（回転）
      ctx.save();ctx.translate(cx,cy);ctx.rotate(deg*Math.PI/180);
      ctx.strokeStyle=C("--ink");ctx.lineWidth=3;
      if(kind===0){ctx.beginPath();ctx.moveTo(0,-46);ctx.lineTo(0,46);ctx.stroke();}
      else if(kind===1){ctx.beginPath();ctx.arc(0,0,40,0,TAU);ctx.stroke();}
      else {ctx.beginPath();ctx.moveTo(-34,34);ctx.lineTo(0,0);ctx.lineTo(-34,-34);ctx.stroke();
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(46,0);ctx.stroke();}
      ctx.restore();
      // 角度パターン（右）
      var px0=w*0.5, pw=w-px0-30, py=h-42, ph=h-92;
      ctx.strokeStyle=C("--line");ctx.strokeRect(px0,36,pw,py-36);
      var maxdb=45,mindb=-45;
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=160;i++){
        var dd=-60+120*i/160, v=db10(rcsOf(kind,dd));
        var xx=px0+pw*i/160, yy=py-(Math.min(Math.max(v,mindb),maxdb)-mindb)/(maxdb-mindb)*(py-44);
        i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }
      ctx.stroke();
      var cur=db10(rcsOf(kind,deg));
      var cxx=px0+pw*(deg+60)/120;
      ctx.strokeStyle=C("--alias");ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(cxx,44);ctx.lineTo(cxx,py);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"RCS [dBsm] vs 向き",px0+6,30,C("--muted"));
      lab(ctx,"-60°",px0,py+16,C("--faint"),"center");lab(ctx,"0°",px0+pw/2,py+16,C("--faint"),"center");
      lab(ctx,"+60°",px0+pw,py+16,C("--faint"),"center");
      out.innerHTML="現在の RCS ≈ <b>"+f(cur,1)+" dBsm</b>（"+f(Math.pow(10,cur/10),cur>10?0:2)+" m²）"+
        ["<br>平板: 正対では巨大、数度で数十 dB 急落する——鏡の反射と同じ",
         "<br>球: 向きに依存しない πa²。だから校正の基準に使われる",
         "<br>コーナー: 3 回反射で来た方向へ返す。広い角度で強い——試験用ターゲットの定番"][kind];
    }
    sel.addEventListener("change",draw);sA.input.addEventListener("input",draw);
    reg(cv,draw);draw();
  };

  /* ============ 05. pulse — パルス幅と PRF ============ */
  REG.pulse=function(el){
    head(el,"DEMO","パルス幅と PRF — 分解能と曖昧さ");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sTau=slider(row,"パルス幅 τp [µs]",10,200,60,5);
    var sPRF=slider(row,"PRF [Hz]",600,4000,1200,50);
    var sR1=slider(row,"目標 1 の距離 [km]",5,120,30,1);
    var sDR=slider(row,"目標 2 との間隔 [km]",1,40,12,0.5);
    var out=readout(el);
    function draw(){
      var tau=+sTau.input.value*1e-6, PRF=+sPRF.input.value;
      var R1=+sR1.input.value*1e3, R2=R1+(+sDR.input.value)*1e3;
      sTau.val.textContent=f(tau*1e6,0)+" µs";sPRF.val.textContent=PRF+" Hz";
      sR1.val.textContent=f(R1/1e3,0)+" km";sDR.val.textContent=f((R2-R1)/1e3,1)+" km";
      var PRI=1/PRF, Rua=CLIGHT*PRI/2, dRes=CLIGHT*tau/2;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=40,x1=w-30, span=2.2*PRI;      // 表示 2.2 PRI
      function X(t){return x0+(x1-x0)*t/span;}
      var yTx=70,yRx=170;
      ctx.strokeStyle=C("--line");
      ctx.beginPath();ctx.moveTo(x0,yTx);ctx.lineTo(x1,yTx);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x0,yRx);ctx.lineTo(x1,yRx);ctx.stroke();
      lab(ctx,"送信",x0-4,yTx-38,C("--muted"));lab(ctx,"受信",x0-4,yRx-42,C("--muted"));
      // 送信パルス
      for(var k=0;k<3;k++){
        var t0=k*PRI;
        ctx.fillStyle=C("--signal");
        ctx.globalAlpha=.85;
        ctx.fillRect(X(t0),yTx-30,Math.max(X(t0+tau)-X(t0),2),30);
        ctx.globalAlpha=1;
        lab(ctx,"P"+(k+1),X(t0)+2,yTx-34,C("--faint"));
      }
      // エコー（往復遅れ; 第2周回は赤）
      function echo(R,tag){
        for(var k=0;k<3;k++){
          var t=k*PRI+2*R/CLIGHT;
          if(t>span)continue;
          var wrap=2*R/CLIGHT>PRI;
          ctx.fillStyle=wrap?C("--alias"):C("--blue");
          ctx.globalAlpha=.8;
          ctx.fillRect(X(t),yRx-24,Math.max(X(t+tau)-X(t),2),24);
          ctx.globalAlpha=1;
          if(k===0)lab(ctx,tag+(wrap?"（折返し!）":""),X(t),yRx+16,wrap?C("--alias"):C("--blue"));
        }
      }
      echo(R1,"目標1");echo(R2,"目標2");
      // 判定
      var merged=(2*R2/CLIGHT-2*R1/CLIGHT)<tau;
      var wrapped=(2*R2/CLIGHT>PRI)||(2*R1/CLIGHT>PRI);
      lab(ctx,"ΔR = cτp/2 = "+f(dRes/1e3,1)+" km ／ Rua = c/2PRF = "+f(Rua/1e3,0)+" km",x0,h-14,C("--muted"));
      out.innerHTML=(merged?'<span class="warn">2 つのエコーが融合——間隔 '+f((R2-R1)/1e3,1)+
          " km &lt; 分解能 "+f(dRes/1e3,1)+" km</span>":"2 目標は分離できている")+
        (wrapped?'<br><span class="warn">最大不明確距離 '+f(Rua/1e3,0)+
          " km を超えた目標が近距離に折り返している（赤）</span>":"")+
        "<br>τp を短く → 分解能↑だがエネルギー↓ ／ PRF を上げる → 積分は稼げるが Rua↓";
    }
    [sTau,sPRF,sR1,sDR].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 06. compress — パルス圧縮 ============ */
  REG.compress=function(el){
    head(el,"DEMO","整合フィルタでチャープを圧縮する");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sTB=slider(row,"TB 積（圧縮率）",1,3,2,0.05);  // 10^x
    var sSNR=slider(row,"入力 SN 比 [dB]",-20,10,-8,1);
    var sWin=select(row,"窓",["なし（矩形）: SL −13 dB","ハミング: SL −43 dB・幅 1.5 倍"]);
    var out=readout(el);
    var noiseSeed=[];for(var i=0;i<1024;i++)noiseSeed.push((Math.random()*2-1));
    function draw(){
      var TB=Math.pow(10,+sTB.input.value);
      sTB.val.textContent=f(TB,0)+"（+"+f(db10(TB),0)+" dB）";
      var snr=+sSNR.input.value;sSNR.val.textContent=snr+" dB";
      var ham=+sWin.value===1;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=44,x1=w-24;
      // 上段: 受信（チャープ+雑音）振幅表示
      var yA=76;
      lab(ctx,"受信信号（チャープ＋雑音）",x0,22,C("--muted"));
      var amp=Math.pow(10,snr/20);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.2;ctx.beginPath();
      for(var i=0;i<=700;i++){
        var u=i/700;
        var sig=(u>0.3&&u<0.7)?amp*Math.sin(TAU*(14*(u-0.3)+40*(u-0.3)*(u-0.3))) :0;
        var v=sig+0.9*noiseSeed[i%1024]*0.5;
        var xx=x0+(x1-x0)*u, yy=yA-36*v/(1+amp*0.4);
        i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }
      ctx.stroke();
      // 下段: 圧縮後(dB)
      var py=h-40, pt=140;
      lab(ctx,"整合フィルタ出力 [dB]",x0,pt-8,C("--muted"));
      ctx.strokeStyle=C("--line");ctx.strokeRect(x0,pt,x1-x0,py-pt);
      var gain=db10(TB);
      var peak=snr+gain;              // dB
      var floor=0;                     // 雑音 0dB 基準
      var slDb=ham?-43:-13.3;
      var wid=(ham?1.5:1)*0.012;
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
      var span=60, base=-15;
      function Y(vdb){return py-(Math.min(Math.max(vdb,base),45)-base)/(45-base)*(py-pt-6);}
      for(var i=0;i<=700;i++){
        var u=i/700;
        var vdb=floor+db10(Math.abs(noiseSeed[(i*3+7)%1024]))*0.35;
        var m=peak+db10(Math.exp(-Math.pow((u-0.5)/wid,2)));
        if(ham){var sl=peak+slDb+db10(Math.exp(-Math.pow((Math.abs(u-0.5)-0.05)/0.02,2)));m=Math.max(m,sl);}
        else{
          var k1=peak+slDb+db10(Math.exp(-Math.pow((Math.abs(u-0.5)-0.035)/0.012,2)));
          var k2=peak+slDb-6+db10(Math.exp(-Math.pow((Math.abs(u-0.5)-0.07)/0.012,2)));
          m=Math.max(m,k1,k2);
        }
        var v=Math.max(vdb,m);
        var xx=x0+(x1-x0)*u;
        i?ctx.lineTo(xx,Y(v)):ctx.moveTo(xx,Y(v));
      }
      ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.setLineDash([5,4]);ctx.beginPath();
      ctx.moveTo(x0,Y(13));ctx.lineTo(x1,Y(13));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"検出しきい値 13 dB",x1-4,Y(13)-5,C("--alias"),"right");
      out.innerHTML="出力ピーク SNR = 入力 "+snr+" dB + TB 利得 "+f(gain,0)+" dB = <b>"+
        f(peak,0)+" dB</b> —— "+(peak>=13?'<b>検出できる</b>':'<span class="warn">まだ埋もれている</span>')+
        "<br>入力波形では跡形も見えない目標が、相関 1 回で立ち上がる。長さで稼ぎ、帯域で細くする";
    }
    [sTB,sSNR].forEach(function(s){s.input.addEventListener("input",draw);});
    sWin.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 07. doppler — 位相の回転 ============ */
  REG.doppler=function(el){
    head(el,"DEMO","パルス間の位相回転 — 速度が見える");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sV=slider(row,"目標の速度 [m/s]（+は接近）",-30,30,6,0.5);
    var sT=slider(row,"パルス間隔 T [µs]",50,400,100,10);
    var out=readout(el);
    function draw(t){
      var v=+sV.input.value, T=+sT.input.value*1e-6;
      sV.val.textContent=f(v,1)+" m/s";sT.val.textContent=f(T*1e6,0)+" µs";
      var fd=2*v/LAM77;
      var dphi=TAU*fd*T;                      // 1パルスの回転 [rad]
      var vmax=LAM77/(4*T);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      // 左: フェーザ
      var cx=w*0.26, cy=h*0.5, R=Math.min(h*0.33,86);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.stroke();
      var nShow=8, idx=Math.floor(t*2.2)%nShow;
      for(var k=0;k<=idx;k++){
        var a=-Math.PI/2+k*dphi;
        var alp=0.25+0.75*(k/Math.max(idx,1));
        ctx.globalAlpha=alp;
        ctx.strokeStyle=k===idx?C("--signal"):C("--muted");ctx.lineWidth=k===idx?3:1.6;
        ctx.beginPath();ctx.moveTo(cx,cy);
        ctx.lineTo(cx+R*0.92*Math.cos(a),cy+R*0.92*Math.sin(a));ctx.stroke();
      }
      ctx.globalAlpha=1;
      lab(ctx,"パルス番号 n = "+idx,cx,cy+R+24,C("--muted"),"center");
      lab(ctx,"1 パルスごとに Δφ 回る",cx,30,C("--muted"),"center");
      // 右: 位相 vs n と折り返し表示
      var x0=w*0.5,x1=w-30,y0=h-52,y1=44;
      ctx.strokeStyle=C("--line");
      ctx.beginPath();ctx.moveTo(x0,(y0+y1)/2);ctx.lineTo(x1,(y0+y1)/2);ctx.stroke();
      var wrapped=((dphi+Math.PI)%TAU+TAU)%TAU-Math.PI;
      for(var k2=0;k2<8;k2++){
        var ph=k2*wrapped;
        var yy=(y0+y1)/2-ph*(y0-y1)/(2*Math.PI*5);
        var xx=x0+(x1-x0)*k2/7;
        ctx.fillStyle=C("--blue");
        ctx.beginPath();ctx.arc(xx,Math.min(Math.max(yy,y1),y0),4,0,TAU);ctx.fill();
      }
      lab(ctx,"位相の系列（折り返し込み）",x0,30,C("--muted"));
      var alias=Math.abs(v)>vmax;
      var vApp=(((v/vmax+1)%2+2)%2-1)*vmax;
      out.innerHTML="f_d = 2v/λ = <b>"+f(fd/1000,2)+" kHz</b> ／ 1 パルスの回転 Δφ = 4πvT/λ = <b>"+
        f(dphi*180/Math.PI,0)+"°</b> ／ v_max = λ/4T = <b>"+f(vmax,1)+" m/s</b>"+
        (alias?'<br><span class="warn">|Δφ| が 180° を超えた——見かけの速度 '+f(vApp,1)+
          " m/s に折り返している（車輪の逆回転）</span>":"");
    }
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 08. fmcw — ビート観察 ============ */
  REG.fmcw=function(el){
    head(el,"DEMO","FMCW のビート — 距離が音程になる");
    var cv=screen(el,290), cc=cctx(cv);
    var row=ctrls(el);
    var sR=slider(row,"距離 R [m]",5,150,40,1);
    var sS=slider(row,"スロープ S [MHz/µs]",5,60,20,1);
    var out=readout(el);
    function draw(){
      var R=+sR.input.value, S=+sS.input.value*1e12; // Hz/s
      sR.val.textContent=R+" m";sS.val.textContent=f(S/1e12,0)+" MHz/µs";
      var tau=2*R/CLIGHT, fb=S*tau;
      var Tc=50e-6;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=50,x1=w-30;
      // 上: f-t
      var ft=34,fb_=120;
      lab(ctx,"周波数 vs 時間",x0,24,C("--muted"));
      ctx.strokeStyle=C("--line");ctx.strokeRect(x0,ft,x1-x0,fb_-ft);
      function X(t){return x0+(x1-x0)*t/Tc;}
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(X(0),fb_-4);ctx.lineTo(X(Tc),ft+4);ctx.stroke();
      var dfr=Math.max(tau/Tc,0.10);   // 見やすさのため遅れを誇張して描く
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(X(Tc*dfr),fb_-4);ctx.lineTo(X(Tc),ft+4+(fb_-ft-8)*dfr);ctx.stroke();
      lab(ctx,"TX",x0+26,ft+18,C("--signal"));lab(ctx,"RX（τ 遅れ）",x0+90,fb_-12,C("--blue"));
      var xm=X(Tc*0.55);
      var yTx=fb_-4-(fb_-ft-8)*0.55, yRx=fb_-4-(fb_-ft-8)*(0.55-dfr);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;
      ctx.beginPath();ctx.moveTo(xm,yTx);ctx.lineTo(xm,yRx);ctx.stroke();
      lab(ctx,"f_b",xm+8,(yTx+yRx)/2+4,C("--alias"));
      lab(ctx,"（図の遅れは誇張。数値は正確）",x1,ft-6,C("--faint"),"right",9);
      // 中: ビート波形
      var bt=150,bb=222;
      lab(ctx,"ビート信号（ミキサ出力）",x0,bt-6,C("--muted"));
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.beginPath();
      var showCycles=Math.min(fb*Tc,60);
      for(var i=0;i<=700;i++){
        var u=i/700, yy=(bt+bb)/2-26*Math.sin(TAU*showCycles*u);
        i?ctx.lineTo(x0+(x1-x0)*u,yy):ctx.moveTo(x0+(x1-x0)*u,yy);
      }
      ctx.stroke();
      // 下: スペクトル
      var st=244,sb=h-16;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,sb);ctx.lineTo(x1,sb);ctx.stroke();
      var fmax=30e6;
      var px=x0+(x1-x0)*Math.min(fb/fmax,1);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(px,sb);ctx.lineTo(px,st+6);ctx.stroke();
      lab(ctx,"スペクトル: f_b = "+f(fb/1e6,2)+" MHz",x0,st+2,C("--muted"));
      lab(ctx,"0",x0,sb+12,C("--faint"),"center");lab(ctx,"30 MHz",x1,sb+12,C("--faint"),"right");
      out.innerHTML="τ = 2R/c = <b>"+f(tau*1e9,0)+" ns</b> ／ f_b = S·τ = 2RS/c = <b>"+
        f(fb/1e6,2)+" MHz</b><br>距離を伸ばすとビートの音程が上がる。複数目標なら周波数の混合になり、FFT が距離ごとに分ける";
    }
    [sR,sS].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 09. rdmap — 距離-速度マップ ============ */
  REG.rdmap=function(el){
    head(el,"DEMO","距離-ドップラーマップ");
    var cv=screen(el,300), cc=cctx(cv);
    var row=ctrls(el);
    var s1R=slider(row,"目標1: 距離 [m]",5,140,60,1);
    var s1V=slider(row,"目標1: 速度 [m/s]",-40,40,10,0.5);
    var s2R=slider(row,"目標2: 距離 [m]",5,140,90,1);
    var s2V=slider(row,"目標2: 速度 [m/s]",-40,40,-6,0.5);
    var out=readout(el);
    var Tc=50e-6,N=128,B=1e9;
    var vmax=LAM77/(4*Tc), dv=LAM77/(2*N*Tc), dR=CLIGHT/(2*B), Rmax=150;
    var clut=[];for(var i=0;i<26;i++)clut.push(8+Math.random()*135);
    function fold(v){return (((v/vmax+1)%2+2)%2-1)*vmax;}
    function draw(){
      var R1=+s1R.input.value,V1=+s1V.input.value,R2=+s2R.input.value,V2=+s2V.input.value;
      s1R.val.textContent=R1+" m";s1V.val.textContent=f(V1,1)+" m/s";
      s2R.val.textContent=R2+" m";s2V.val.textContent=f(V2,1)+" m/s";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=64,x1=w-24,y0=h-44,y1=30;
      ctx.fillStyle=C("--screen");ctx.fillRect(x0,y1,x1-x0,y0-y1);
      ctx.strokeStyle=C("--line");ctx.strokeRect(x0,y1,x1-x0,y0-y1);
      function X(v){return x0+(x1-x0)*(v+vmax)/(2*vmax);}
      function Y(R){return y0-(y0-y1)*R/Rmax;}
      // v=0 線とクラッタ
      ctx.strokeStyle=C("--faint");ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(X(0),y1);ctx.lineTo(X(0),y0);ctx.stroke();ctx.setLineDash([]);
      clut.forEach(function(Rc){
        ctx.fillStyle=C("--muted");ctx.globalAlpha=.55;
        ctx.beginPath();ctx.arc(X(0),Y(Rc),3.2,0,TAU);ctx.fill();ctx.globalAlpha=1;
      });
      lab(ctx,"静止クラッタの列",X(0)+8,y1+16,C("--faint"));
      function blob(R,V,col,tag){
        var vf=fold(V), al=Math.abs(vf-V)>0.01;
        var g=ctx.createRadialGradient(X(vf),Y(R),2,X(vf),Y(R),16);
        g.addColorStop(0,col);g.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(X(vf),Y(R),16,0,TAU);ctx.fill();
        lab(ctx,tag+(al?"（折返し）":""),X(vf)+12,Y(R)-8,col);
        return al;
      }
      var a1=blob(R1,V1,C("--signal"),"目標1");
      var a2=blob(R2,V2,C("--blue"),"目標2");
      // 軸
      lab(ctx,"-"+f(vmax,1),x0,y0+16,C("--faint"),"center");
      lab(ctx,"0",X(0),y0+16,C("--faint"),"center");
      lab(ctx,"+"+f(vmax,1)+" m/s",x1,y0+16,C("--faint"),"right");
      lab(ctx,"速度 →",x1,y0+32,C("--muted"),"right");
      lab(ctx,"距離",x0-8,y1+10,C("--muted"),"right");
      lab(ctx,"150 m",x0-8,y1+26,C("--faint"),"right");
      out.innerHTML="設定: B=1 GHz, T_c=50 µs, N=128 → ΔR=<b>"+f(dR*100,0)+" cm</b>, Δv=<b>"+
        f(dv,2)+" m/s</b>, v_max=<b>±"+f(vmax,1)+" m/s</b>"+
        ((a1||a2)?'<br><span class="warn">v_max を超えた速度が反対側に折り返して表示されている</span>':"")+
        "<br>静止物は v=0 の縦列に整列し、動く目標だけが横に飛び出す——速度軸は最強のフィルタ";
    }
    [s1R,s1V,s2R,s2V].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 10. aoa — 位相差から角度 ============ */
  REG.aoa=function(el){
    head(el,"DEMO","位相差から角度を当てる");
    var cv=screen(el,280), cc=cctx(cv);
    var row=ctrls(el);
    var sTh=slider(row,"目標の方位 θ [°]",-80,80,25,1);
    var sD=slider(row,"素子間隔 d/λ",0.25,1.5,0.5,0.05);
    var sK=slider(row,"素子数 K",2,12,4,1);
    var out=readout(el);
    function draw(){
      var th=+sTh.input.value*Math.PI/180, dl=+sD.input.value, K=+sK.input.value;
      sTh.val.textContent=sTh.input.value+"°";sD.val.textContent=f(dl,2)+" λ";sK.val.textContent=K+" 本";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      // 左: アレイと波面
      var cx=w*0.25, cy=h*0.62;
      ctx.save();
      ctx.translate(cx,cy);
      for(var i=0;i<5;i++){
        ctx.strokeStyle=C("--blue");ctx.globalAlpha=.5;ctx.lineWidth=1.4;
        var off=-90-i*26;
        ctx.beginPath();
        ctx.moveTo(off*Math.sin(th)-110*Math.cos(th),off*Math.cos(th)+110*Math.sin(th));
        ctx.lineTo(off*Math.sin(th)+110*Math.cos(th),off*Math.cos(th)-110*Math.sin(th));
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      ctx.restore();
      var spacing=Math.min(28,160/K);
      for(var k=0;k<K;k++){
        var xx=cx+(k-(K-1)/2)*spacing;
        ctx.fillStyle=C("--signal");
        ctx.beginPath();ctx.arc(xx,cy,5,0,TAU);ctx.fill();
      }
      lab(ctx,"到来波（θ = "+sTh.input.value+"°）",cx,26,C("--blue"),"center");
      lab(ctx,"受信アレイ",cx,cy+30,C("--muted"),"center");
      // 右: 角度スペクトル
      var x0=w*0.5,x1=w-26,y0=h-40,y1=40;
      ctx.strokeStyle=C("--line");ctx.strokeRect(x0,y1,x1-x0,y0-y1);
      lab(ctx,"角度スペクトル（アレイ応答）",x0+4,30,C("--muted"));
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i2=0;i2<=240;i2++){
        var a=-Math.PI/2+Math.PI*i2/240;
        var psi=TAU*dl*(Math.sin(a)-Math.sin(th));
        var den=Math.sin(psi/2);
        var af=Math.abs(den)<1e-9?1:Math.abs(Math.sin(K*psi/2)/(K*den));
        var xx2=x0+(x1-x0)*i2/240, yy2=y0-(y0-y1-8)*af;
        i2?ctx.lineTo(xx2,yy2):ctx.moveTo(xx2,yy2);
      }
      ctx.stroke();
      lab(ctx,"-90°",x0,y0+14,C("--faint"),"center");
      lab(ctx,"0°",(x0+x1)/2,y0+14,C("--faint"),"center");
      lab(ctx,"+90°",x1,y0+14,C("--faint"),"right");
      var dphi=360*dl*Math.sin(th);
      var amb=dl>0.5;
      var res=2/(K*dl/0.5)*57.3/2;  // ≈ λ/(K d) rad → deg（正面）
      out.innerHTML="隣接素子の位相差 Δφ = 2πd·sinθ/λ = <b>"+f(dphi,0)+"°</b> ／ 角度分解能（正面）≈ λ/(Kd) = <b>"+
        f(57.3/(K*dl),0)+"°</b>"+
        (amb?'<br><span class="warn">d &gt; λ/2 —— 視野内に偽ピーク（グレーティング）が現れている。角度の折り返しである</span>'
            :"<br>d = λ/2 以下なら ±90° の視野で曖昧さなし");
    }
    [sTh,sD,sK].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 11. beam — アレイビーム ============ */
  REG.beam=function(el){
    head(el,"DEMO","アレイのビームパターン");
    var cv=screen(el,300), cc=cctx(cv);
    var row=ctrls(el);
    var sK=slider(row,"素子数 N",2,16,8,1);
    var sD=slider(row,"間隔 d/λ",0.25,1.2,0.5,0.05);
    var sSt=slider(row,"ビーム方向 θ₀ [°]",-60,60,0,1);
    var sWin=select(row,"給電",["一様（SL −13 dB）","テーパ（端を弱く・SL 低減）"]);
    var out=readout(el);
    function draw(){
      var K=+sK.input.value, dl=+sD.input.value, st=+sSt.input.value*Math.PI/180, tap=+sWin.value===1;
      sK.val.textContent=K+" 本";sD.val.textContent=f(dl,2)+" λ";sSt.val.textContent=sSt.input.value+"°";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w/2, cy=h-58, RR=Math.min(h-96,w/2-40);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(cx-RR-14,cy);ctx.lineTo(cx+RR+14,cy);ctx.stroke();
      [30,60].forEach(function(g){
        [-1,1].forEach(function(s2){
          var a=s2*g*Math.PI/180;
          ctx.strokeStyle=C("--grid");
          ctx.beginPath();ctx.moveTo(cx,cy);
          ctx.lineTo(cx+RR*Math.sin(a),cy-RR*Math.cos(a));ctx.stroke();
          lab(ctx,(s2>0?"+":"−")+g+"°",cx+(RR+18)*Math.sin(a),cy-(RR+8)*Math.cos(a),C("--faint"),"center");
        });
      });
      // 素子と重み
      var wts=[];
      for(var k=0;k<K;k++){
        var u=K===1?0:(k/(K-1)-0.5);
        wts.push(tap?(0.54+0.46*Math.cos(TAU*u)) : 1);
      }
      var wsum=wts.reduce(function(a,b){return a+b;},0);
      // パターン
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      for(var i=0;i<=360;i++){
        var a2=-Math.PI/2+Math.PI*i/360;
        var re=0,im=0;
        for(var k2=0;k2<K;k2++){
          var ph=TAU*dl*k2*(Math.sin(a2)-Math.sin(st));
          re+=wts[k2]*Math.cos(ph);im+=wts[k2]*Math.sin(ph);
        }
        var af=Math.hypot(re,im)/wsum;
        var rr=RR*af;
        var xx=cx+rr*Math.sin(a2), yy=cy-rr*Math.cos(a2);
        i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }
      ctx.stroke();
      for(var k3=0;k3<K;k3++){
        var xx3=cx+(k3-(K-1)/2)*Math.min(16,220/K);
        ctx.fillStyle=C("--blue");
        ctx.fillRect(xx3-2,cy+8,4,6+wts[k3]*10);
      }
      lab(ctx,"素子（棒の長さ＝給電の重み）",cx,cy+42,C("--muted"),"center");
      var bw=51/(K*dl)*(tap?1.5:1);
      var grating=dl*(1+Math.abs(Math.sin(st)))>1;
      out.innerHTML="ビーム幅 θ3dB ≈ "+(tap?"1.5·":"")+"λ/(Nd) ≈ <b>"+f(bw/Math.cos(st),0)+"°</b> ／ 開口 = Nd = <b>"+
        f(K*dl,1)+" λ</b>"+
        (grating?'<br><span class="warn">グレーティングローブ発生——d(sinθg−sinθ₀)=λ の方向で全素子がまた同位相になっている</span>'
                :"<br>素子を増やす＝開口を広げるほどビームは細く（分解能と利得が上がる）");
    }
    [sK,sD,sSt].forEach(function(s){s.input.addEventListener("input",draw);});
    sWin.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 12. noise — 雑音フロア ============ */
  REG.noise=function(el){
    head(el,"DEMO","雑音フロアとエコーの高さ比べ");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sB=slider(row,"帯域 B [MHz]",1,100,10,1);
    var sNF=slider(row,"雑音指数 NF [dB]",3,15,6,0.5);
    var sPt=slider(row,"送信電力 [dBm]",0,20,10,1);
    var out=readout(el);
    function draw(){
      var B=+sB.input.value,NF=+sNF.input.value,Pt=+sPt.input.value;
      sB.val.textContent=B+" MHz";sNF.val.textContent=f(NF,1)+" dB";sPt.val.textContent=Pt+" dBm";
      var floor=-174+db10(B*1e6)+NF;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      var c=chart(cc,0,1,-130,-20,{l:56});
      grid(c,5);
      function XL(R){return c.p.l+(Math.log10(R)-0)/(Math.log10(300))*(c.w-c.p.l-c.p.r);}
      // エコーレベル曲線 (G=25dBi, σ=0dBsm 歩行者)
      function lvl(R,sg){return Pt+50+db10(LAM77*LAM77*Math.pow(10,sg/10)/(Math.pow(4*Math.PI,3)*Math.pow(R,4)));}
      ctx=c.ctx;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var i=0;i<=250;i++){
        var R=Math.pow(10,i/250*Math.log10(300));R=Math.max(R,1);
        var y=c.Y(Math.min(Math.max(lvl(R,10),-130),-20));
        i?ctx.lineTo(XL(R),y):ctx.moveTo(XL(R),y);
      }
      ctx.stroke();
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
      for(var i2=0;i2<=250;i2++){
        var R2=Math.pow(10,i2/250*Math.log10(300));R2=Math.max(R2,1);
        var y2=c.Y(Math.min(Math.max(lvl(R2,0),-130),-20));
        i2?ctx.lineTo(XL(R2),y2):ctx.moveTo(XL(R2),y2);
      }
      ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;ctx.setLineDash([7,4]);
      ctx.beginPath();ctx.moveTo(c.p.l,c.Y(floor));ctx.lineTo(c.w-c.p.r,c.Y(floor));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"雑音フロア "+f(floor,0)+" dBm",c.w-c.p.r-4,c.Y(floor)-6,C("--alias"),"right");
      lab(ctx,"車（10 dBsm）",c.p.l+8,c.p.t+14,C("--signal"));
      lab(ctx,"歩行者（0 dBsm）",c.p.l+8,c.p.t+30,C("--blue"));
      [1,10,100].forEach(function(R){lab(ctx,R+" m",XL(R),c.h-8,C("--faint"),"center");});
      // 交点
      function rmax(sg){return Math.pow(Math.pow(10,(Pt+50+db10(LAM77*LAM77*Math.pow(10,sg/10)/Math.pow(4*Math.PI,3))-floor)/10),0.25);}
      out.innerHTML="床 = −174 + 10logB + NF = <b>"+f(floor,1)+" dBm</b> ／ 床と交わる距離（SNR=0）: 車 <b>"+
        f(rmax(10),0)+" m</b>・歩行者 <b>"+f(rmax(0),0)+" m</b>"+
        "<br>帯域を広げる（分解能を上げる）と床が上がり、届く距離が縮む——ここにもトレードオフがある";
    }
    [sB,sNF,sPt].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 13. cfar ============ */
  REG.cfar=function(el){
    head(el,"DEMO","CFAR — しきい値の自動追従");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sMode=select(row,"方式",["固定しきい値","CA-CFAR（平均）","OS-CFAR（順序統計）"]);
    var sPfa=slider(row,"Pfa = 10^-x",3,8,5,1);
    var sNref=slider(row,"参照セル数 N",8,32,16,2);
    var bNew=button(row,"雑音を引き直す");
    var out=readout(el);
    var M=240, data=[], tgt=[[70,22],[150,26],[158,15],[205,13]]; // [ビン, SNR dB]
    function gen(){
      data=[];
      for(var i=0;i<M;i++){
        var mu=1*(i>110&&i<190?8:1);            // クラッタ段
        var u=Math.random();
        data.push(-mu*Math.log(1-u+1e-12));
      }
      tgt.forEach(function(t){data[t[0]]+=Math.pow(10,t[1]/10)*(0.7+Math.random()*0.6);});
    }
    gen();
    function draw(){
      var mode=+sMode.value, pfa=Math.pow(10,-(+sPfa.input.value)), Nref=+sNref.input.value, guard=2;
      sPfa.val.textContent="10^-"+sPfa.input.value;sNref.val.textContent=Nref+" セル";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=44,x1=w-20,y0=h-40,y1=26;
      function X(i){return x0+(x1-x0)*i/(M-1);}
      function Y(v){var dbv=db10(v);return y0-(Math.min(Math.max(dbv,-8),36)+8)/44*(y0-y1);}
      // データ
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1.1;ctx.beginPath();
      for(var i=0;i<M;i++){i?ctx.lineTo(X(i),Y(data[i])):ctx.moveTo(X(i),Y(data[i]));}
      ctx.stroke();
      // しきい値
      var alpha=Nref*(Math.pow(pfa,-1/Nref)-1);
      var thr=[];
      for(var i2=0;i2<M;i2++){
        if(mode===0){thr.push(Math.log(1/pfa)*1.0);}   // 固定: 平均1想定
        else{
          var refs=[];
          for(var k=1;k<=Nref/2+guard;k++){
            if(k<=guard)continue;
            if(i2-k>=0)refs.push(data[i2-k]);
            if(i2+k<M)refs.push(data[i2+k]);
          }
          if(!refs.length){thr.push(1e9);continue;}
          var z;
          if(mode===1){z=refs.reduce(function(a,b){return a+b;},0)/refs.length;}
          else{refs.sort(function(a,b){return a-b;});z=refs[Math.floor(refs.length*0.75)];}
          thr.push(alpha*z/(mode===2?1.7:1));
        }
      }
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;ctx.beginPath();
      for(var i3=0;i3<M;i3++){i3?ctx.lineTo(X(i3),Y(thr[i3])):ctx.moveTo(X(i3),Y(thr[i3]));}
      ctx.stroke();
      // 検出
      var det=0,fa=0,hit={};
      for(var i4=0;i4<M;i4++){
        if(data[i4]>thr[i4]&&(i4===0||data[i4]>=data[i4-1])&&(i4===M-1||data[i4]>=data[i4+1])){
          var isT=tgt.some(function(t){return Math.abs(t[0]-i4)<=1;});
          ctx.fillStyle=isT?C("--blue"):C("--alias");
          ctx.beginPath();ctx.arc(X(i4),Y(data[i4])-8,3.6,0,TAU);ctx.fill();
          if(isT){tgt.forEach(function(t,ti){if(Math.abs(t[0]-i4)<=1)hit[ti]=1;});det++;}else fa++;
        }
      }
      lab(ctx,"クラッタ域（床 +9 dB）",X(150),y1+12,C("--faint"),"center");
      lab(ctx,"目標×4（うち 2 つは隣接）",x0+4,y1+12,C("--muted"));
      var missed=tgt.length-Object.keys(hit).length;
      out.innerHTML=["固定: 環境が変わると破綻する",
                     "CA: 平均で追従。ただし隣接目標が互いを隠す（マスキング）",
                     "OS: 並べ替えて 3/4 位——隣の目標に汚されない"][mode]+
        " ／ 検出 <b>"+Object.keys(hit).length+"/4</b>"+
        (missed?' <span class="warn">見逃し '+missed+'</span>':"")+
        (fa?' <span class="warn">誤警報 '+fa+'</span>':" 誤警報 0")+
        "<br>クラッタ段差の中の目標と、隣接した 2 目標（ビン 150/158）の挙動を方式ごとに比べてほしい";
    }
    sMode.addEventListener("change",draw);
    [sPfa,sNref].forEach(function(s){s.input.addEventListener("input",draw);});
    bNew.addEventListener("click",function(){gen();draw();});
    reg(cv,draw);draw();
  };

  /* ============ 14. mti ============ */
  REG.mti=function(el){
    head(el,"DEMO","MTI — クラッタを消す・ブラインドに嵌る");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sV=slider(row,"目標速度 [m/s]",0,80,14,1);
    var sPRF=slider(row,"PRF [kHz]",4,20,10,0.5);
    var sMode=select(row,"フィルタ",["MTI なし","1 重キャンセラ (1−z⁻¹)","2 重キャンセラ (1−z⁻¹)²"]);
    var out=readout(el);
    function draw(){
      var v=+sV.input.value, PRF=+sPRF.input.value*1e3, mode=+sMode.value;
      sV.val.textContent=v+" m/s";sPRF.val.textContent=f(PRF/1e3,1)+" kHz";
      var fd=2*v/LAM77;
      var fdFold=((fd/PRF)%1+1)%1;              // 0..1 (PRF正規化)
      var vblind=LAM77*PRF/2;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=48,x1=w-24,y0=h-46,y1=30;
      ctx.strokeStyle=C("--line");ctx.strokeRect(x0,y1,x1-x0,y0-y1);
      function X(u){return x0+(x1-x0)*u;}
      function H(u){var s=Math.abs(Math.sin(Math.PI*u));return mode===0?1:Math.pow(s,mode===1?1:2);}
      // クラッタ + 目標のスペクトル（入力=薄、出力=濃）
      function spec(u){
        var cl=40*Math.exp(-Math.pow(u<0.5?u:1-u,2)/(2*0.0022))+14*Math.exp(-Math.pow(u<0.5?u:1-u,2)/(2*0.012));
        var tg=26*Math.exp(-Math.pow((u-fdFold),2)/(2*0.0006));
        return {cl:cl,tg:tg};
      }
      function Y(vdb){return y0-Math.min(Math.max(vdb,0),46)/46*(y0-y1-8);}
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.3;ctx.beginPath();
      for(var i=0;i<=400;i++){
        var u=i/400,s=spec(u);
        var tot=db10(Math.pow(10,s.cl/10)+Math.pow(10,s.tg/10));
        i?ctx.lineTo(X(u),Y(tot)):ctx.moveTo(X(u),Y(tot));
      }
      ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var i2=0;i2<=400;i2++){
        var u2=i2/400,s2=spec(u2);
        var g=H(u2);
        var tot2=db10((Math.pow(10,s2.cl/10)+Math.pow(10,s2.tg/10))*g*g+0.5);
        i2?ctx.lineTo(X(u2),Y(tot2)):ctx.moveTo(X(u2),Y(tot2));
      }
      ctx.stroke();
      // 応答
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);ctx.beginPath();
      for(var i3=0;i3<=400;i3++){
        var u3=i3/400;
        var yy=y0-(H(u3)/2)*(y0-y1-8)*0.9;
        i3?ctx.lineTo(X(u3),yy):ctx.moveTo(X(u3),yy);
      }
      ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"薄い線=入力 ／ 濃い線=MTI 出力 ／ 破線=|H(f)|",x0+4,y1-8,C("--muted"));
      lab(ctx,"0",x0,y0+16,C("--faint"),"center");
      lab(ctx,"PRF/2",X(0.5),y0+16,C("--faint"),"center");
      lab(ctx,"PRF",x1,y0+16,C("--faint"),"right");
      var nearBlind=Math.min(fdFold,1-fdFold)<0.06&&v>2&&mode>0;
      out.innerHTML="f_d = <b>"+f(fd/1e3,2)+" kHz</b> ／ ブラインドスピード v_blind = kλPRF/2 = <b>"+
        f(vblind,1)+" m/s ごと</b>"+
        (nearBlind?'<br><span class="warn">目標がブラインド付近——動いているのにクラッタと一緒に消されている。PRF を変えると救出できる</span>':
         (mode>0?"<br>クラッタ（0 付近の山）だけが削られ、目標の峰が残っている":"<br>MTI なし: クラッタの山が目標を圧倒している"));
    }
    [sV,sPRF].forEach(function(s){s.input.addEventListener("input",draw);});
    sMode.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 15. track ============ */
  REG.track=function(el){
    head(el,"DEMO","α-β フィルタ — 平滑と追従の綱引き");
    var cv=screen(el,280), cc=cctx(cv);
    var row=ctrls(el);
    var sA=slider(row,"α（位置の取り込み）",0.05,1,0.35,0.05);
    var sB=slider(row,"β（速度の修正）",0.01,1,0.15,0.01);
    var sN=slider(row,"観測雑音の大きさ",1,20,8,1);
    var out=readout(el);
    var hist={meas:[],filt:[],truth:[]};
    var st={x:40,vx:60,y:150,phase:0,fx:40,fvx:60,fy:150,fvy:0,t:0};
    function truthStep(dt,W){
      st.t+=dt;
      st.x+=st.vx*dt;
      var seg=Math.floor(st.t/3)%2;
      st.y=150+(seg?46:-46)*Math.sin((st.t%3)/3*Math.PI);
      if(st.x>W-30){st.x=30;hist.meas=[];hist.filt=[];hist.truth=[];st.fx=st.x;st.fy=st.y;st.fvx=60;st.fvy=0;}
    }
    var acc=0;
    function draw(tNow){
      var A=+sA.input.value,Bb=+sB.input.value,Nn=+sN.input.value;
      sA.val.textContent=f(A,2);sB.val.textContent=f(Bb,2);sN.val.textContent=Nn+" px";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      // 20 Hz でフレーム進行
      var dt=0.05;
      acc+=1;
      truthStep(dt,w);
      var zx=st.x+(Math.random()*2-1)*Nn, zy=st.y+(Math.random()*2-1)*Nn;
      // αβ 更新
      var T=dt;
      var px=st.fx+st.fvx*T, py=st.fy+st.fvy*T;
      var rx=zx-px, ry=zy-py;
      st.fx=px+A*rx; st.fy=py+A*ry;
      st.fvx+=Bb/T*rx*0.05; st.fvy+=Bb/T*ry*0.05;
      hist.meas.push([zx,zy]);hist.filt.push([st.fx,st.fy]);hist.truth.push([st.x,st.y]);
      if(hist.meas.length>260){hist.meas.shift();hist.filt.shift();hist.truth.shift();}
      ctx.clearRect(0,0,w,h);
      // 真値
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.2;ctx.beginPath();
      hist.truth.forEach(function(p,i){i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();
      // 観測
      ctx.fillStyle=C("--muted");
      hist.meas.forEach(function(p,i){if(i%2)return;ctx.globalAlpha=0.25+0.75*i/hist.meas.length;
        ctx.beginPath();ctx.arc(p[0],p[1],2.2,0,TAU);ctx.fill();});
      ctx.globalAlpha=1;
      // フィルタ
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.6;ctx.beginPath();
      hist.filt.forEach(function(p,i){i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();
      // 予測ゲート
      ctx.strokeStyle=C("--blue");ctx.setLineDash([4,4]);ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(st.fx+st.fvx*T*4,st.fy+st.fvy*T*4,26,0,TAU);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"点=観測 ／ 細線=真の軌跡 ／ 太線=フィルタ出力 ／ 破線円=予測ゲート",14,20,C("--muted"));
      var err=0;
      for(var i=0;i<hist.filt.length;i++){err+=Math.hypot(hist.filt[i][0]-hist.truth[i][0],hist.filt[i][1]-hist.truth[i][1]);}
      err/=Math.max(hist.filt.length,1);
      out.innerHTML="平均誤差 ≈ <b>"+f(err,1)+" px</b> ／ α 小 → 滑らかだが曲がりで遅れる ／ α 大 → 追従は速いが雑音が素通し"+
        "<br>カルマンフィルタは、この α・β を不確かさの帳簿（P と R）から毎フレーム自動で決める";
    }
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 16. autoconf ============ */
  REG.autoconf=function(el){
    head(el,"DEMO","車載センサ構成とカバレッジ");
    var cv=screen(el,320), cc=cctx(cv);
    var row=ctrls(el);
    var cLRR=checkbox(row,"前方 LRR（±15°・250 m）— ACC / AEB",true);
    var cMRR=checkbox(row,"前方 MRR（±40°・100 m）— 交差点",false);
    var cSRR=checkbox(row,"四隅 SRR（±75°・30 m）— 死角・駐車",true);
    var cRear=checkbox(row,"後方 MRR（±40°・80 m）— 追突警告",false);
    var out=readout(el);
    function wedge(ctx,x,y,ang,half,r,col){
      ctx.fillStyle=col;ctx.globalAlpha=0.28;
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.arc(x,y,r,ang-half,ang+half);ctx.closePath();ctx.fill();
      ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,ang-half,ang+half);ctx.closePath();ctx.stroke();
    }
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w/2, cy=h/2, scale=(h/2-20)/260;
      function rr(m){return Math.min(m*scale*2.2,h*0.48);}
      // 車
      ctx.strokeStyle=C("--ink");ctx.lineWidth=2;
      rrect(ctx,cx-16,cy-30,32,60,9);ctx.stroke();
      var up=-Math.PI/2;
      if(cLRR.checked)wedge(ctx,cx,cy-30,up,15*Math.PI/180,rr(250),C("--signal"));
      if(cMRR.checked)wedge(ctx,cx,cy-30,up,40*Math.PI/180,rr(100),C("--blue"));
      if(cSRR.checked){
        wedge(ctx,cx-14,cy-26,up-0.9,75*Math.PI/180*0.7,rr(30*2.4),C("--alias"));
        wedge(ctx,cx+14,cy-26,up+0.9,75*Math.PI/180*0.7,rr(30*2.4),C("--alias"));
        wedge(ctx,cx-14,cy+26,Math.PI/2+0.9,75*Math.PI/180*0.7,rr(30*2.4),C("--alias"));
        wedge(ctx,cx+14,cy+26,Math.PI/2-0.9,75*Math.PI/180*0.7,rr(30*2.4),C("--alias"));
      }
      if(cRear.checked)wedge(ctx,cx,cy+30,Math.PI/2,40*Math.PI/180,rr(80),C("--blue"));
      lab(ctx,"↑ 進行方向",cx,18,C("--muted"),"center");
      var n=(cLRR.checked?1:0)+(cMRR.checked?1:0)+(cSRR.checked?4:0)+(cRear.checked?1:0);
      var gaps=[];
      if(!cLRR.checked)gaps.push("遠方前方（ACC 不成立）");
      if(!cSRR.checked)gaps.push("側方死角（BSD 不成立）");
      if(!cRear.checked&&!cSRR.checked)gaps.push("後方");
      out.innerHTML="搭載レーダー数: <b>"+n+" 個</b>"+
        (gaps.length?' ／ <span class="warn">穴: '+gaps.join("・")+"</span>":" ／ 全周をレーダーの傘が覆っている")+
        "<br>遠くを見るセンサほどビームが細い（利得と視野のトレードオフ）——LRR は細長く、SRR は扇形に広い";
    }
    [cLRR,cMRR,cSRR,cRear].forEach(function(c){c.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 17. vital ============ */
  REG.vital=function(el){
    head(el,"DEMO","位相で呼吸と心拍を見る");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sBR=slider(row,"呼吸数 [回/分]",8,30,15,1);
    var sHR=slider(row,"心拍数 [拍/分]",50,110,72,1);
    var sD=slider(row,"呼吸の深さ [mm]",1,8,4,0.5);
    var out=readout(el);
    function draw(t){
      var br=+sBR.input.value/60, hr=+sHR.input.value/60, dep=+sD.input.value;
      sBR.val.textContent=sBR.input.value+" 回/分";sHR.val.textContent=sHR.input.value+" 拍/分";
      sD.val.textContent=f(dep,1)+" mm";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=48,x1=w-24;
      // 上: 位相波形（スクロール）
      var yc=86;
      lab(ctx,"距離ビンの位相 ∠（時間波形）",x0,24,C("--muted"));
      var lam60=5e-3;
      function disp(tt){return dep*1e-3*Math.sin(TAU*br*tt)+0.25e-3*Math.sin(TAU*hr*tt);}
      var phMax=4*Math.PI*(dep*1e-3+0.25e-3)/lam60;
      var sc=52/Math.max(phMax,1);          // 画面に収まるよう正規化
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;ctx.beginPath();
      var span=12;
      for(var i=0;i<=700;i++){
        var tt=t-span+span*i/700;
        var ph=4*Math.PI*disp(tt)/lam60;    // rad
        var yy=yc-ph*sc;
        i?ctx.lineTo(x0+(x1-x0)*i/700,yy):ctx.moveTo(x0+(x1-x0)*i/700,yy);
      }
      ctx.stroke();
      // 下: スペクトル（既知周波数に山を描く）
      var st=170,sb=h-36;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,sb);ctx.lineTo(x1,sb);ctx.stroke();
      lab(ctx,"スペクトル",x0,st-8,C("--muted"));
      var fmax=2.2;
      function X(fr){return x0+(x1-x0)*fr/fmax;}
      function peak(fr,amp,col,tag){
        ctx.strokeStyle=col;ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(X(fr),sb);ctx.lineTo(X(fr),sb-amp);ctx.stroke();
        lab(ctx,tag,X(fr),sb-amp-8,col,"center");
      }
      peak(br,sb-st-16,C("--signal"),"呼吸 "+f(br*60,0)+"/分");
      peak(hr,(sb-st)*0.4,C("--blue"),"心拍 "+f(hr*60,0)+"/分");
      lab(ctx,"0",x0,sb+14,C("--faint"),"center");lab(ctx,"1 Hz",X(1),sb+14,C("--faint"),"center");
      lab(ctx,"2 Hz",X(2),sb+14,C("--faint"),"center");
      var phAmp=4*Math.PI*dep*1e-3/lam60*180/Math.PI;
      out.innerHTML="呼吸 "+f(dep,1)+" mm の位相振幅 = 4πΔR/λ = <b>"+f(phAmp,0)+"°</b>（λ=5 mm）"+
        "<br>距離分解能（cm）では見えない動きが、位相でなら堂々と見える。周波数帯が違うので呼吸と心拍は FFT で分離できる";
    }
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 18. design ============ */
  REG.design=function(el){
    head(el,"DEMO","チャープ設計 — 要求から B, T_c, N を降ろす");
    var row=ctrls(el);
    var sDR=slider(row,"距離分解能 ΔR [cm]",2,50,5,1);
    var sVM=slider(row,"最大速度 v_max [m/s]",5,40,20,1);
    var sDV=slider(row,"速度分解能 Δv [m/s]",0.1,2,0.4,0.1);
    var sRM=slider(row,"最大距離 R_max [m]",10,300,30,5);
    var sADC=slider(row,"ADC 上限 [MSa/s]",10,50,30,5);
    var sTX=slider(row,"TDM の TX 本数",1,3,3,1);
    var pan=panel(el);
    var out=readout(el);
    function draw(){
      var dR=+sDR.input.value/100, vmax=+sVM.input.value, dv=+sDV.input.value,
          Rmax=+sRM.input.value, adc=+sADC.input.value*1e6, ntx=+sTX.input.value;
      sDR.val.textContent=sDR.input.value+" cm";sVM.val.textContent="±"+vmax+" m/s";
      sDV.val.textContent=f(dv,1)+" m/s";sRM.val.textContent=Rmax+" m";
      sADC.val.textContent=f(adc/1e6,0)+" MSa/s";sTX.val.textContent=ntx+" 本";
      var lam=LAM77;
      var B=CLIGHT/(2*dR);
      var Tc=lam/(4*vmax*ntx);          // TDM で ntx 倍の繰り返し周期
      var S=B/Tc;
      var N=Math.ceil(lam/(2*Tc*ntx*dv));
      var N2=Math.pow(2,Math.ceil(Math.log2(N)));
      var fIF=2*Rmax*S/CLIGHT;
      var M=adc*Tc;
      var frame=N2*Tc*ntx;
      function flag(ok,warn){return ok?'<span style="color:var(--blue)">OK</span>':
        '<span class="warn">'+warn+'</span>';}
      var okB=B<=5e9, okS=S<=150e12, okIF=fIF<=adc/2, okF=frame<=0.05;
      pan.innerHTML=tbl(["導出","値","判定"],[
        ["掃引幅 B = c/2ΔR","<b>"+f(B/1e9,2)+" GHz</b>",flag(okB,"76〜81 GHz の 5 GHz を超過")],
        ["チャープ周期 T_c = λ/(4·v_max·TX 本数)","<b>"+f(Tc*1e6,1)+" µs</b>","TDM の罰: TX "+ntx+" 本ぶん短縮が必要"],
        ["スロープ S = B/T_c","<b>"+f(S/1e12,0)+" MHz/µs</b>",flag(okS,"チップの上限（〜150）超過")],
        ["チャープ本数 N（Δv より・2 の冪）","<b>"+N2+"</b>","観測 "+f(N2*Tc*ntx*1e3,1)+" ms"],
        ["最大 IF = 2·R_max·S/c","<b>"+f(fIF/1e6,1)+" MHz</b>",flag(okIF,"ADC/2 を超過——R_max か ΔR を諦める")],
        ["サンプル数 M = ADC×T_c","<b>"+f(M,0)+"</b>","処理利得 "+f(db10(Math.max(M,1)*N2),0)+" dB"],
        ["フレーム時間","<b>"+f(frame*1e3,1)+" ms</b>",flag(okF,"20 Hz 更新に収まらない")],
      ]);
      var ok=okB&&okS&&okIF&&okF;
      out.innerHTML=ok?"<b>成立する設計である。</b>どれか 1 つを欲張って、どこが最初に破綻するか試してほしい":
        '<span class="warn"><b>この要求は成立しない。</b>赤い行のどれかを妥協する——それが設計である</span>';
    }
    [sDR,sVM,sDV,sRM,sADC,sTX].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(null,draw);draw();
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
