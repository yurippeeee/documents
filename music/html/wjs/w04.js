  /* ============ 04. beats — うなり ============ */
  REG.beats=function(el){
    head(el,"Beats","440 Hz に、少しずつ高い音を重ねる");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 2 つの音を鳴らす");
    var row=ctrls(el),sf=slider(row,"上の音の周波数",440,560,444,0.5);
    var cv=screen(el,170),cc=cctx(cv),ro=readout(el);
    var o1=null,o2=null,g=null;
    function f2(){return +sf.input.value;}
    function stop(){if(g){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.02);o1.stop(t+0.2);o2.stop(t+0.2);o1=o2=g=null;}bp.textContent="▶ 2 つの音を鳴らす";bp.setAttribute("aria-pressed","false");}
    function draw(){
      var d=f2()-440;sf.val.textContent=f(f2(),1)+" Hz";
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=12,x1=w-12,cy=h/2-8,A=h/2-26,T1=1.0,N=Math.round((x1-x0)*3);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=0.7;ctx.beginPath();
      for(var i=0;i<=N;i++){var t=T1*i/N,v=0.5*(Math.sin(2*Math.PI*440*t)+Math.sin(2*Math.PI*f2()*t)),x=x0+(x1-x0)*i/N;i?ctx.lineTo(x,cy-A*v):ctx.moveTo(x,cy-A*v);}ctx.stroke();
      if(d>0){ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
        [1,-1].forEach(function(sg){ctx.beginPath();for(var i=0;i<=400;i++){var t=T1*i/400,x=x0+(x1-x0)*i/400,y=cy-sg*A*Math.abs(Math.cos(Math.PI*d*t));i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();});ctx.setLineDash([]);}
      lab(ctx,"0 s",x0,h-6,C("--muted"),"left");lab(ctx,"1 s",x1,h-6,C("--muted"),"right");
      var zone=d===0?"同じ高さ（うなりなし）":d<12?"うなり（大きさがゆっくり波打つ）":d<60?"ざらざらした粗い響き":"2 つの別の音に分かれて聞こえる";
      ro.innerHTML='周波数の差 <b>'+f(d,1)+' Hz</b> → 1 秒に <b>'+f(d,1)+'</b> 回ふくらむ ／ 聞こえ方の目安: <b>'+zone+'</b><br>半音上（466.2 Hz）なら差は約 26 Hz';
    }
    sf.input.addEventListener("input",function(){draw();if(o2)o2.frequency.setTargetAtTime(f2(),AC.currentTime,0.01);});
    bp.addEventListener("click",function(){
      if(g){stop();return;}stopAll();var ctx=ac();g=ctx.createGain();g.gain.value=0;g.connect(OUT);
      o1=ctx.createOscillator();o2=ctx.createOscillator();o1.frequency.value=440;o2.frequency.value=f2();o1.connect(g);o2.connect(g);o1.start();o2.start();
      g.gain.setTargetAtTime(0.16,ctx.currentTime,0.03);bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    reg(cv,draw);
  };

  /* ============ 04. specmix — スペクトルで見る相性 ============ */
  REG.specmix=function(el){
    head(el,"Spectrum","音の組み合わせを選ぶと、倍音の一致とぶつかりが表示される");
    var P=[["完全 8 度",[0,12],[1,2]],["完全 5 度",[0,7],[1,3/2]],["完全 4 度",[0,5],[1,4/3]],["長 3 度",[0,4],[1,5/4]],["短 3 度",[0,3],[1,6/5]],["長 6 度",[0,9],[1,5/3]],["短 6 度",[0,8],[1,8/5]],
           ["長 2 度",[0,2],[1,9/8]],["短 2 度",[0,1],[1,16/15]],["増 4 度",[0,6],[1,45/32]],["短 7 度",[0,10],[1,16/9]],["長 7 度",[0,11],[1,15/8]],
           ["3 音: C・E・G",[0,4,7],[1,5/4,3/2]],["3 音: C・E♭・G",[0,3,7],[1,6/5,3/2]],["3 音: C・E・G♯",[0,4,8],[1,5/4,25/16]],["3 音: C・E♭・G♭",[0,3,6],[1,6/5,36/25]],["3 音: C・C♯・D",[0,1,2],[1,16/15,9/8]]];
    var row=ctrls(el),sp=select(row,"組み合わせ（下の音は C）",P.map(function(x){return x[0];})),st=select(row,"調律",["平均律（鍵盤の音）","純正な比"]),sr=select(row,"下の音の高さ",["C3","C4","C5"]);
    sp.value="1";sr.value="1";
    var row2=ctrls(el),sh=slider(row2,"倍音の数",1,12,8,1);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el),oscs=[],g=null;
    function cur(){var p=P[+sp.value],root=[48,60,72][+sr.value],f0=mfreq(root),just=st.value==="1";
      var fs=p[1].map(function(sm,i){return just?f0*p[2][i]:mfreq(root+sm);}),names=p[1].map(function(sm){return NS[(root+sm)%12].replace("♯","♯")+(Math.floor((root+sm)/12)-1);});
      if(p[0].indexOf("♭")>=0||p[0]==="短 2 度"||p[0]==="短 3 度"||p[0]==="短 6 度"||p[0]==="短 7 度")names=p[1].map(function(sm){return NF[(root+sm)%12]+(Math.floor((root+sm)/12)-1);});
      return {p:p,fs:fs,names:names,H:+sh.input.value};}
    function stop(){if(g){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.03);oscs.forEach(function(o){o.stop(t+0.25);});oscs=[];g=null;}bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function wave(ctx,H){var re=new Float32Array(H+1),im=new Float32Array(H+1);for(var k=1;k<=H;k++)im[k]=1/k;return ctx.createPeriodicWave(re,im);}
    function start(){stopAll();var c=cur(),ctx=ac();g=ctx.createGain();g.gain.value=0;g.connect(OUT);
      c.fs.forEach(function(fq){var o=ctx.createOscillator();o.setPeriodicWave(wave(ctx,c.H));o.frequency.value=fq;o.connect(g);o.start();oscs.push(o);});
      g.gain.setTargetAtTime(0.12/Math.sqrt(c.fs.length),ctx.currentTime,0.04);bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);}
    function draw(){
      var c=cur();sh.val.textContent=c.H;
      var sv=spec(c.fs.map(function(fq,i){return {f:fq,label:c.names[i],c:SPEC_COLS[i]};}),{H:c.H,w:660,lane:c.fs.length>2?34:42});
      view.innerHTML=svgWrap(sv.w,sv.h,sv.svg,"spec");
      var bw=Math.min(100,sv.rel/2);
      ro.innerHTML=specStats(sv)+'<div style="margin-top:.45rem;height:10px;border-radius:5px;background:var(--line);overflow:hidden"><div style="height:100%;width:'+bw+'%;background:var(--alias)"></div></div>'+
        '<div style="margin-top:.35rem">'+(st.value==="1"?'純正な比: 一致する倍音の周波数は完全に同じ':'平均律: 一致する倍音にも少し差があり、緑の数字の速さでうなる')+'</div>';
      if(g){var c2=cur();if(oscs.length!==c2.fs.length){start();}else{oscs.forEach(function(o,i){o.setPeriodicWave(wave(AC,c2.H));o.frequency.setTargetAtTime(c2.fs[i],AC.currentTime,0.02);});g.gain.setTargetAtTime(0.12/Math.sqrt(c2.fs.length),AC.currentTime,0.04);}}
    }
    [sp,st,sr].forEach(function(s){s.addEventListener("change",draw);});sh.input.addEventListener("input",draw);
    bp.addEventListener("click",function(){if(g){stop();return;}start();});
    draw();
  };

  /* ============ 04. dcurve — 上の音を連続して動かす（不協和度の曲線） ============ */
  REG.dcurve=function(el){
    head(el,"Curve","上の音を連続して動かし、粗さの谷を探す");
    var row=ctrls(el),sc=slider(row,"上の音（C4 からのセント）",0,1200,386,1),sm=select(row,"音の種類",["倍音を 8 つ含む音","純音（倍音なし）"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var cv=screen(el,230),cc=cctx(cv),ro=readout(el);
    var F0=261.6256,curve={},o1=null,o2=null,g=null;
    function Hn(){return sm.value==="0"?8:1;}
    function val(c,H){var f2=F0*Math.pow(2,c/1200),R=0;for(var h=1;h<=H;h++)for(var k=1;k<=H;k++)R+=roughPair(F0*h,1/h,f2*k,1/k);return 100*R/roughRef(8);}
    function getCurve(H){if(!curve[H]){var a=[];for(var c=0;c<=1200;c+=3)a.push(val(c,H));curve[H]=a;}return curve[H];}
    var NAMES=[[0,"完全 1 度"],[100,"短 2 度"],[200,"長 2 度"],[300,"短 3 度"],[400,"長 3 度"],[500,"完全 4 度"],[600,"増 4 度"],[700,"完全 5 度"],[800,"短 6 度"],[900,"長 6 度"],[1000,"短 7 度"],[1100,"長 7 度"],[1200,"完全 8 度"]];
    var RAT=[[1,1],[16,15],[9,8],[6,5],[5,4],[4,3],[7,5],[3,2],[8,5],[5,3],[7,4],[9,5],[15,8],[2,1]];
    function wave(ctx,H){var re=new Float32Array(H+1),im=new Float32Array(H+1);for(var k=1;k<=H;k++)im[k]=1/k;return ctx.createPeriodicWave(re,im);}
    function stop(){if(g){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.03);o1.stop(t+0.25);o2.stop(t+0.25);o1=o2=g=null;}bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function draw(){
      var c=+sc.input.value,H=Hn(),a=getCurve(H);sc.val.textContent=c+" セント";
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=30,x1=w-12,y0=h-30,y1=16,X=function(cc_){return x0+(x1-x0)*cc_/1200;},Y=function(v){return y0-(y0-y1)*Math.min(v,110)/110;};
      var step=w<520?2:1;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;for(var k=0;k<=12;k++){ctx.beginPath();ctx.moveTo(X(k*100),y1);ctx.lineTo(X(k*100),y0);ctx.stroke();if(k%step===0)lab(ctx,String(k*100),X(k*100),h-14,C("--muted"),"center");}
      ctx.strokeStyle=C("--muted");ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.stroke();
      ctx.strokeStyle=C(H>1?"--signal":"--muted");ctx.lineWidth=2;ctx.beginPath();a.forEach(function(v,i){var x=X(i*3),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      var v=val(c,H);ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(X(c),Y(v),6,0,TAU);ctx.fill();
      lab(ctx,"粗さ",x0+2,y1+8,C("--muted"),"left");
      var near=NAMES.reduce(function(b,x){return Math.abs(x[0]-c)<Math.abs(b[0]-c)?x:b;}),rat=RAT.reduce(function(b,x){var cx=1200*Math.log(x[0]/x[1])/Math.LN2,cb=1200*Math.log(b[0]/b[1])/Math.LN2;return Math.abs(cx-c)<Math.abs(cb-c)?x:b;});
      var rc=1200*Math.log(rat[0]/rat[1])/Math.LN2;
      ro.innerHTML='上の音 <b>'+f(F0*Math.pow(2,c/1200),1)+' Hz</b>（C4 から '+c+' セント） ／ いちばん近い平均律の音程: <b>'+near[1]+'</b>（'+near[0]+' セント）<br>'+
        'いちばん近い単純な比: <b>'+rat[0]+':'+rat[1]+'</b>（'+f(rc,1)+' セント） ／ 粗さ <b>'+Math.round(v)+'</b>';
    }
    sc.input.addEventListener("input",function(){draw();if(o2)o2.frequency.setTargetAtTime(F0*Math.pow(2,(+sc.input.value)/1200),AC.currentTime,0.01);});
    sm.addEventListener("change",function(){draw();if(g){var H=Hn();o1.setPeriodicWave(wave(AC,H));o2.setPeriodicWave(wave(AC,H));}});
    bp.addEventListener("click",function(){
      if(g){stop();return;}stopAll();var ctx=ac(),H=Hn();g=ctx.createGain();g.gain.value=0;g.connect(OUT);
      o1=ctx.createOscillator();o2=ctx.createOscillator();[o1,o2].forEach(function(o){o.setPeriodicWave(wave(ctx,H));o.connect(g);});
      o1.frequency.value=F0;o2.frequency.value=F0*Math.pow(2,(+sc.input.value)/1200);o1.start();o2.start();
      g.gain.setTargetAtTime(0.1,ctx.currentTime,0.04);bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    reg(cv,draw);
  };
