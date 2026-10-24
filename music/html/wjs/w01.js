  /* ============ 01. tone — 周波数と振幅 ============ */
  REG.tone=function(el){
    head(el,"Tone","周波数と振幅を変えて、波形と音を比べる");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ 鳴らす");
    var row=ctrls(el);
    var sf=slider(row,"周波数（55〜1760 Hz）",0,1000,600,1), sa=slider(row,"振幅",0,100,50,1);
    var cv=screen(el,170), cc=cctx(cv), ro=readout(el);
    var osc=null, g=null;
    function fval(){return 55*Math.pow(2,(+sf.input.value)/1000*5);}
    function aval(){return (+sa.input.value)/100;}
    function stop(){if(osc){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.02);osc.stop(t+0.2);osc=null;}
      bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function apply(){if(osc){var t=AC.currentTime;osc.frequency.setTargetAtTime(fval(),t,0.015);g.gain.setTargetAtTime(0.3*aval(),t,0.02);}}
    function draw(){
      var f0=fval(),a=aval();sf.val.textContent=f(f0,f0<100?1:0)+" Hz";sa.val.textContent=f(a,2);
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=14,x1=w-14,cy=h/2-6,H=h/2-22;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x0,cy-H);ctx.lineTo(x1,cy-H);ctx.moveTo(x0,cy+H);ctx.lineTo(x1,cy+H);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=800;i++){var t=i/800*0.01,x=x0+(x1-x0)*i/800,y=cy-a*H*Math.sin(2*Math.PI*f0*t);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      ctx.stroke();
      lab(ctx,"0",x0,h-6,C("--muted"),"left");lab(ctx,"10 ms",x1,h-6,C("--muted"),"right");lab(ctx,"振幅 1",x0+2,cy-H-4,C("--faint"),"left");
      var db=a>0?20*Math.log(a/0.5)/Math.LN10:null;
      ro.innerHTML='周波数 <b>'+f(f0,1)+' Hz</b> ／ 周期 T = 1/f = <b>'+f(1000/f0,2)+' ms</b> ／ 10 ms の間に <b>'+f(f0*0.01,1)+'</b> 回<br>'+
        '振幅 <b>'+f(a,2)+'</b> ／ 振幅 0.5 を基準にすると <b>'+(db===null?'無音':(db>=0?'+':'')+f(db,1)+' dB')+'</b>';
    }
    bp.addEventListener("click",function(){
      if(osc){stop();return;}
      stopAll();var ctx=ac();osc=ctx.createOscillator();g=ctx.createGain();osc.frequency.value=fval();g.gain.value=0;
      osc.connect(g);g.connect(OUT);osc.start();g.gain.setTargetAtTime(0.3*aval(),ctx.currentTime,0.02);
      bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    sf.input.addEventListener("input",function(){draw();apply();});
    sa.input.addEventListener("input",function(){draw();apply();});
    reg(cv,draw);
  };

  /* ============ 01. harmix — 倍音を混ぜて音色を作る ============ */
  REG.harmix=function(el){
    head(el,"Harmonics","倍音の混ぜ方を変えて、波形・スペクトル・音色を比べる");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ 鳴らす");
    var row0=ctrls(el), pre=select(row0,"例",["純音","オルガン風","のこぎり波","奇数の倍音だけ","高い倍音だけ強い"]);
    var row=ctrls(el), sl=[];
    for(var k=1;k<=8;k++)sl.push(slider(row,"第 "+k+" 倍音",0,100,k===1?100:0,1));
    var cv=screen(el,268), cc=cctx(cv), ro=readout(el);
    var PRE=[[1,0,0,0,0,0,0,0],[1,.55,.32,.22,.12,.08,0,0],[1,1/2,1/3,1/4,1/5,1/6,1/7,1/8],[1,0,1/3,0,1/5,0,1/7,0],[.25,.15,.1,.4,.55,.6,.45,.3]];
    var osc=null,g=null,F0=220;
    function amps(){return sl.map(function(q){return (+q.input.value)/100;});}
    function wave(ctx,a){var re=new Float32Array(9),im=new Float32Array(9);for(var k=0;k<8;k++)im[k+1]=a[k];return ctx.createPeriodicWave(re,im,{disableNormalization:true});}
    function level(a){var s=0;a.forEach(function(v){s+=v;});return 0.22/Math.max(0.6,s*0.55);}
    function stop(){if(osc){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.02);osc.stop(t+0.2);osc=null;}bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function apply(){if(osc){var a=amps();if(a.some(function(v){return v>0;}))osc.setPeriodicWave(wave(AC,a));g.gain.setTargetAtTime(level(a),AC.currentTime,0.03);}}
    function draw(){
      var a=amps();sl.forEach(function(q,i){q.val.textContent=f(a[i],2);});
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=14,x1=w-14,cy=64,H=44,sum=0;a.forEach(function(v){sum+=v;});
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      var pts=[],mx=1e-9;for(var i=0;i<=600;i++){var t=i/600*2,v=0;for(var k=0;k<8;k++)v+=a[k]*Math.sin(2*Math.PI*(k+1)*t);pts.push(v);mx=Math.max(mx,Math.abs(v));}
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      pts.forEach(function(v,i){var x=x0+(x1-x0)*i/600,y=cy-v/mx*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      lab(ctx,"波形（2 周期分）",x0,14,C("--muted"),"left");
      var yb=h-30,hm=78,bw=(x1-x0)/8;
      ctx.strokeStyle=C("--muted");ctx.beginPath();ctx.moveTo(x0,yb);ctx.lineTo(x1,yb);ctx.stroke();
      for(k=0;k<8;k++){var bh=a[k]*hm;ctx.fillStyle=C(k===0?"--signal":"--blue");ctx.fillRect(x0+k*bw+bw*0.25,yb-bh,bw*0.5,bh);
        lab(ctx,(k+1)+"",x0+k*bw+bw/2,yb+14,C("--muted"),"center");lab(ctx,Math.round(F0*(k+1))+" Hz",x0+k*bw+bw/2,yb+26,C("--faint"),"center");}
      lab(ctx,"スペクトル（第 n 倍音の振幅）",x0,yb-hm-10,C("--muted"),"left");
      ro.innerHTML='基音 <b>'+F0+' Hz</b>（高さはこの周波数のまま） ／ 含まれる倍音: <b>'+a.map(function(v,i){return v>0?(i+1):null;}).filter(function(v){return v;}).join(", ")+'</b>';
    }
    pre.addEventListener("change",function(){var p=PRE[+pre.value];sl.forEach(function(q,i){q.input.value=Math.round(p[i]*100);});draw();apply();});
    sl.forEach(function(q){q.input.addEventListener("input",function(){pre.value=pre.value;draw();apply();});});
    bp.addEventListener("click",function(){
      if(osc){stop();return;}
      var a=amps();if(!a.some(function(v){return v>0;}))return;
      stopAll();var ctx=ac();osc=ctx.createOscillator();g=ctx.createGain();osc.setPeriodicWave(wave(ctx,a));osc.frequency.value=F0;
      g.gain.value=0;osc.connect(g);g.connect(OUT);osc.start();g.gain.setTargetAtTime(level(a),ctx.currentTime,0.03);
      bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    reg(cv,draw);
  };

  /* ============ 01. hseries — 倍音列を 1 つずつ聴く ============ */
  REG.hseries=function(el){
    head(el,"Series","倍音列を 1 つずつ鳴らし、重ねていく");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bOne=button(bar,"▶ 基音だけ"), bAdd=button(bar,"▶ 1 から順に重ねる"), bAll=button(bar,"▶ 8 つを同時に");
    var view=mk("div","wscreen"); view.style.padding=".5rem"; el.appendChild(view);
    var ro=readout(el), F0=110, on={};
    function draw(){
      var W=640,H=168,x0=40,w=570,y=96,L=function(fq){return x0+w*Math.log(fq/F0)/Math.log(8);},b=[];
      b.push(ln(x0,y,x0+w,y,V("muted"),1.2));
      for(var n=1;n<=8;n++){var x=L(n*F0),act=!!on[n],c=act?V("signal"):V("blue");
        b.push('<rect class="hs" data-n="'+n+'" x="'+(x-11)+'" y="'+(y-62)+'" width="22" height="62" fill="transparent" style="cursor:pointer"/>');
        b.push(ln(x,y-(act?58:40),x,y,c,act?5:3).replace("<line",'<line pointer-events="none"'));
        b.push(tx(x,y-(act?64:46),n+"",'middle',11,c,true));
        b.push(tx(x,y+16,(n*F0)+"",'middle',9.5,V("muted")));}
      for(n=1;n<8;n++){var xa=L(n*F0),xb=L((n+1)*F0);b.push(tx((xa+xb)/2,y+34,(n+1)+":"+n,'middle',9.5,V("faint"),true));}
      b.push(tx(x0+w,H-6,"比の目盛（対数）。数字を押すとその倍音だけ鳴る","end",10,V("muted")));
      view.innerHTML=svgWrap(W,H,b.join(""));
    }
    function setOn(list){on={};list.forEach(function(n){on[n]=1;});draw();
      ro.innerHTML=list.length?'鳴っている倍音: <b>'+list.join(", ")+'</b>（'+list.map(function(n){return n*F0+" Hz";}).join(", ")+'）':'基音 '+F0+' Hz の倍音列。どの成分も基音の整数倍の周波数を持つ';}
    function go(btn,plan,total){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();setOn([]);return;}
      stopAll();var ctx=ac(),t0=ctx.currentTime+0.05;btn.setAttribute("aria-pressed","true");
      plan.forEach(function(p){tone(p.n*F0,t0+p.t,p.d,{gain:0.2/Math.sqrt(p.k||1)*(p.amp||1)});});
      var steps={};plan.forEach(function(p){steps[p.t]=1;});
      Object.keys(steps).forEach(function(ts){var t=+ts;TIMERS.push(setTimeout(function(){setOn(plan.filter(function(p){return p.t<=t+1e-6;}).map(function(p){return p.n;}));},t*1000+50));});
      TIMERS.push(setTimeout(function(){btn.setAttribute("aria-pressed","false");setOn([]);},(total+0.2)*1000));
    }
    bOne.addEventListener("click",function(){go(bOne,[{n:1,t:0,d:2}],2);});
    bAdd.addEventListener("click",function(){var p=[];for(var n=1;n<=8;n++)p.push({n:n,t:(n-1)*0.8,d:(8-n)*0.8+1.6,amp:1/n,k:1});go(bAdd,p,7*0.8+1.6);});
    bAll.addEventListener("click",function(){var p=[];for(var n=1;n<=8;n++)p.push({n:n,t:0,d:2.4,amp:1/n,k:1});go(bAll,p,2.4);});
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".hs");if(!t)return;var n=+t.getAttribute("data-n");
      stopAll();tone(n*F0,ac().currentTime+0.02,1.2,{gain:0.2});setOn([n]);TIMERS.push(setTimeout(function(){setOn([]);},1300));});
    setOn([]);
  };
