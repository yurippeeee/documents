/* エフェクター編 — 章内インタラクティブ部品（Web Audio で実音が鳴る） */
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
  var C0=3e8, MU0=4*Math.PI*1e-7, EPS0=8.854e-12, ETA0=376.73;
  function db20(x){return 20*Math.log10(Math.max(x,1e-12));}
  function db10(x){return 10*Math.log10(Math.max(x,1e-30));}
  function eng(v,u,d){ // 工学表記
    var a=Math.abs(v);
    if(a>=1e9)return f(v/1e9,d==null?2:d)+" G"+u;
    if(a>=1e6)return f(v/1e6,d==null?2:d)+" M"+u;
    if(a>=1e3)return f(v/1e3,d==null?2:d)+" k"+u;
    if(a>=1)return f(v,d==null?2:d)+" "+u;
    if(a>=1e-3)return f(v*1e3,d==null?2:d)+" m"+u;
    if(a>=1e-6)return f(v*1e6,d==null?2:d)+" µ"+u;
    if(a>=1e-9)return f(v*1e9,d==null?2:d)+" n"+u;
    return f(v*1e12,d==null?2:d)+" p"+u;
  }


  /* ================= オーディオエンジン =================
     共有 AudioContext + Karplus-Strong のギター風リフをループ再生し、
     各デモが build(ctx) で作るエフェクトチェーンに通す。 */
  var AC=null, BUFS={};
  function ac(){
    if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); }
    if(AC.state==="suspended") AC.resume();
    return AC;
  }
  function pluck(d, sr, t0, f, dur, amp){
    var N=Math.max(2,Math.round(sr/f)), dl=new Float32Array(N), i;
    for(i=0;i<N;i++) dl[i]=Math.random()*2-1;
    var idx=0, start=Math.round(t0*sr), len=Math.min(Math.round(dur*sr), d.length-start);
    for(var n=0;n<len;n++){
      var nx=(idx+1)%N, v=0.5*(dl[idx]+dl[nx])*0.996;
      dl[idx]=v; d[start+n]+=v*amp; idx=nx;
    }
  }
  function makeBuf(kind){
    var ctx=ac(), key=kind+"@"+ctx.sampleRate;
    if(BUFS[key]) return BUFS[key];
    var sr=ctx.sampleRate, dur=3.2, buf=ctx.createBuffer(1, Math.round(sr*dur), sr), d=buf.getChannelData(0);
    if(kind==="riff"){ // 単音リフ（A マイナーペンタ風）
      [[0.0,110],[0.4,130.81],[0.8,146.83],[1.2,164.81],[1.6,196],[2.0,164.81],[2.4,146.83],[2.8,130.81]]
        .forEach(function(n){ pluck(d,sr,n[0],n[1],0.55,0.5); });
    } else if(kind==="chord"){ // アルペジオ＋コード
      [[0.0,110],[0.05,164.81],[0.1,220],[0.15,261.63],[1.6,98],[1.65,146.83],[1.7,196],[1.75,246.94]]
        .forEach(function(n){ pluck(d,sr,n[0],n[1],1.5,0.3); });
    } else if(kind==="mute"){ // 刻み（短いミュート音 8 分）
      for(var i=0;i<8;i++) pluck(d,sr,i*0.4,82.41,0.14,0.55);
    }
    // 正規化
    var mx=0; for(var j=0;j<d.length;j++) mx=Math.max(mx,Math.abs(d[j]));
    if(mx>0) for(j=0;j<d.length;j++) d[j]*=0.8/mx;
    BUFS[key]=buf; return buf;
  }
  function mkDist(ctx, fn){ // 波形整形カーブ
    var n=1024, curve=new Float32Array(n);
    for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; curve[i]=fn(x); }
    var ws=ctx.createWaveShaper(); ws.curve=curve; ws.oversample="4x"; return ws;
  }
  function mkIR(ctx, sec, damp){ // 指数減衰ノイズの簡易 IR（リバーブ用）
    var sr=ctx.sampleRate, len=Math.max(1,Math.round(sr*sec)), buf=ctx.createBuffer(2,len,sr);
    for(var ch=0;ch<2;ch++){ var d=buf.getChannelData(ch), lp=0;
      for(var i=0;i<len;i++){ var w=(Math.random()*2-1)*Math.pow(1-i/len,damp);
        lp=lp+0.35*(w-lp); d[i]=lp; } }
    return buf;
  }
  function lfoTo(ctx, rate, depth, param, base){ // LFO → AudioParam
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.frequency.value=rate; g.gain.value=depth;
    if(base!=null) param.value=base;
    o.connect(g); g.connect(param); o.start();
    return {osc:o, gain:g};
  }
  /* fxdemo: 再生/停止・音源選択・スコープ付きのデモ骨格。
     build(ctx) は {input, output, ...params} を返す。apply(nodes) でスライダ値を反映。 */
  function fxdemo(el, opts){
    var bar=mk("div","btns"); el.appendChild(bar);
    var bPlay=button(bar,"▶ 再生"), bBy=button(bar,"バイパスと比較");
    var srcSel=null;
    if(opts.sources!==false){
      var row=mk("div","ctrls"); el.appendChild(row);
      srcSel=select(row,"音源",["単音リフ","アルペジオ/コード","刻み（ミュート）"]);
    }
    var st={playing:false, bypass:false, nodes:null, src:null, an:null};
    function stop(){
      if(st.src){ try{st.src.stop();}catch(e){} st.src=null; }
      if(st.nodes&&st.nodes.dispose){ try{st.nodes.dispose();}catch(e){} }
      st.nodes=null; st.playing=false;
      bPlay.textContent="▶ 再生"; bPlay.setAttribute("aria-pressed","false");
    }
    function wire(){
      var ctx=ac();
      var kinds=["riff","chord","mute"];
      var buf=makeBuf(srcSel?kinds[+srcSel.value]:"riff");
      st.nodes=opts.build(ctx);
      if(opts.apply) opts.apply(st.nodes);
      st.an=st.an||ctx.createAnalyser(); st.an.fftSize=2048;
      var src=ctx.createBufferSource(); src.buffer=buf; src.loop=true;
      var out=ctx.createGain(); out.gain.value=0.9;
      if(st.bypass){ src.connect(st.an); }
      else { src.connect(st.nodes.input); st.nodes.output.connect(st.an); }
      st.an.connect(out); out.connect(ctx.destination);
      st.src=src; src.start();
    }
    bPlay.addEventListener("click",function(){
      if(st.playing){ stop(); return; }
      wire(); st.playing=true;
      bPlay.textContent="■ 停止"; bPlay.setAttribute("aria-pressed","true");
    });
    bBy.addEventListener("click",function(){
      st.bypass=!st.bypass;
      bBy.setAttribute("aria-pressed",st.bypass?"true":"false");
      bBy.textContent=st.bypass?"エフェクトに戻す":"バイパスと比較";
      if(st.playing){ stop(); bPlay.click(); }
    });
    if(srcSel) srcSel.addEventListener("change",function(){ if(st.playing){ stop(); bPlay.click(); } });
    return {
      state:st,
      refresh:function(){ if(st.nodes&&opts.apply) opts.apply(st.nodes); },
      scopeData:function(){ if(!st.an) return null;
        var a=new Float32Array(st.an.fftSize); st.an.getFloatTimeDomainData(a); return a; }
    };
  }
  function drawScope(cc, get, extra){ // 下段に波形スコープを描く共通ルーチン
    return function(){
      var d=cc.fit(), ctx=cc.ctx, w=d.w, h=d.h;
      ctx.clearRect(0,0,w,h);
      if(extra) extra(ctx,w,h);
      var a=get();
      ctx.strokeStyle=C("--signal"); ctx.lineWidth=1.6; ctx.beginPath();
      if(a){ for(var i=0;i<a.length;i++){ var x=i/a.length*w, y=h/2-a[i]*h*0.45;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y); } }
      else { ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); }
      ctx.stroke();
      lab(ctx,"出力波形（再生中に動く）",8,14,C("--faint"),"left",9);
    };
  }

  /* ============ 01. chain — つなぎ順 ============ */
  REG.chain=function(el){
    head(el,"DEMO","歪みとディレイの順番を入れ替えて聞く");
    var row=ctrls(el);
    var order=select(row,"つなぎ順",["歪み → ディレイ（定石）","ディレイ → 歪み（響きごと潰れる）"]);
    var drive=slider(row,"歪みの深さ",1,10,5,1);
    var d=fxdemo(el,{
      build:function(ctx){
        var dist=mkDist(ctx,function(x){return Math.tanh(x*4);});
        var pre=ctx.createGain(), dl=ctx.createDelay(1), fb=ctx.createGain(), mix=ctx.createGain(), dry=ctx.createGain(), inp=ctx.createGain(), out=ctx.createGain();
        dl.delayTime.value=0.375; fb.gain.value=0.4; dry.gain.value=0.7; mix.gain.value=0.5;
        dl.connect(fb); fb.connect(dl);
        function delayBlock(a,b){ a.connect(b); a.connect(dl); dl.connect(mix); mix.connect(b); }
        if(+order.value===0){ // dist -> delay
          inp.connect(pre); pre.connect(dist);
          dist.connect(dry); dry.connect(out);
          dist.connect(dl); dl.connect(mix); mix.connect(out);
        } else { // delay -> dist
          inp.connect(dry); inp.connect(dl); dl.connect(mix);
          var sum=ctx.createGain(); dry.connect(sum); mix.connect(sum);
          sum.connect(pre); pre.connect(dist); dist.connect(out);
        }
        return {input:inp, output:out, pre:pre};
      },
      apply:function(n){ n.pre.gain.value=+drive.input.value; }
    });
    var cv=screen(el,120), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData)); reg(cv, function(){});
    function upd(){ drive.val.textContent=drive.input.value; d.refresh();
      out.innerHTML=+order.value===0?
        '<b class="ok">定石。</b>歪んだ音の「響き」が後から付くので、繰り返しが澄んで分離する。':
        '<b style="color:var(--alias)">響きごと潰れる。</b>繰り返しと原音が混ざった波形がクリップされ、濁って団子になる（1 章の原理「歪みは後から来たもの全部を潰す」）。轟音系はこの濁りを音色として使う。';
      if(d.state.playing&&order.dataset&&0){} }
    order.addEventListener("change",function(){upd(); if(d.state.playing){el.querySelector(".btn").click();el.querySelector(".btn").click();}});
    drive.input.addEventListener("input",upd); upd();
  };

  /* ============ 02. harmonics — 倍音合成 ============ */
  REG.harmonics=function(el){
    head(el,"DEMO","倍音を足して音色を作る（加算合成）");
    var row=ctrls(el);
    var amps=[1,0.5,0.33,0.25,0.2,0.17].map(function(v,i){
      return slider(row,(i+1)+"倍音"+(i===0?"（基音 110 Hz）":i%2===1?"（偶数次）":"（奇数次）"),0,100,i===0?100:0,1);});
    var bar=mk("div","btns"); el.appendChild(bar);
    var bPlay=button(bar,"▶ この音を鳴らす");
    [["正弦波",[100,0,0,0,0,0]],["のこぎり波っぽく",[100,50,33,25,20,17]],["矩形波っぽく（奇数次のみ）",[100,0,33,0,20,0]],["クラリネット風",[100,0,75,0,40,0]]].forEach(function(p){
      var b=button(bar,p[0]); b.addEventListener("click",function(){ amps.forEach(function(s,i){s.input.value=p[1][i];}); upd(); });});
    var cv=screen(el,190), cc=cctx(cv), out=readout(el);
    var oscs=null;
    function vals(){ return amps.map(function(s){return +s.input.value/100;}); }
    function draw(){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var a=vals(), half=w*0.55;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=300;i++){ var u=i/300, v=0;
        for(var k2=0;k2<6;k2++) v+=a[k2]*Math.sin(2*Math.PI*(k2+1)*u*2);
        var y=h*0.42-v*h*0.3/(0.001+Math.max.apply(null,[1].concat(a)));
        i?ctx.lineTo(u*half,y):ctx.moveTo(0,y); }
      ctx.stroke();
      lab(ctx,"波形",8,16,C("--muted"),"left",10);
      var x0=w*0.62, bw=(w-x0-20)/6;
      lab(ctx,"スペクトル",x0,16,C("--muted"),"left",10);
      for(var k3=0;k3<6;k3++){
        ctx.fillStyle=k3===0?C("--signal"):(k3%2===1?C("--blue"):C("--signal"));
        var bh=a[k3]*(h-60);
        ctx.fillRect(x0+k3*bw+6, h-24-bh, bw-12, bh);
        lab(ctx,(k3+1)*110+"",x0+k3*bw+bw/2,h-8,C("--faint"),"center",8.5);
      }
    }
    anim(el,draw); reg(cv,draw);
    function upd(){ amps.forEach(function(s){s.val.textContent=s.input.value+" %";});
      if(oscs) oscs.gains.forEach(function(g,i){ g.gain.setTargetAtTime(vals()[i]*0.22, ac().currentTime, 0.02); });
      var a=vals(), even=a[1]+a[3]+a[5], odd=a[2]+a[4];
      out.innerHTML="音色 = 倍音のバランス。"+(even>odd+0.2?"<b>偶数次が優勢 → 豊か・甘い方向</b>":odd>even+0.2?"<b>奇数次が優勢 → 硬い・エッジのある方向</b>":"バランス型")+"。歪み（4 章）はこのバーを右側へ増やす操作、EQ（8 章）はバーの高さを変える操作である";
    }
    bPlay.addEventListener("click",function(){
      var ctx=ac();
      if(oscs){ oscs.oscs.forEach(function(o){try{o.stop();}catch(e){}}); oscs=null; bPlay.textContent="▶ この音を鳴らす"; return; }
      var master=ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
      oscs={oscs:[],gains:[]};
      for(var i=0;i<6;i++){ var o=ctx.createOscillator(), g=ctx.createGain();
        o.frequency.value=110*(i+1); g.gain.value=vals()[i]*0.22;
        o.connect(g); g.connect(master); o.start(); oscs.oscs.push(o); oscs.gains.push(g); }
      bPlay.textContent="■ 止める";
    });
    amps.forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 03. boost — ゲインとヘッドルーム ============ */
  REG.boost=function(el){
    head(el,"DEMO","ブースト量とヘッドルーム — 潰れる瞬間を見る");
    var row=ctrls(el);
    var gain=slider(row,"ブースト (dB)",0,24,6,1);
    var hr=select(row,"次の段のヘッドルーム",["広い（クリーンアンプ / 18V）","狭い（チューブのクランチ / 9V）"]);
    var d=fxdemo(el,{
      build:function(ctx){
        var pre=ctx.createGain();
        var clip=mkDist(ctx,function(x){return Math.tanh(x);});
        var post=ctx.createGain();
        pre.connect(clip); clip.connect(post);
        return {input:pre, output:post, pre:pre, post:post};
      },
      apply:function(n){
        var g=Math.pow(10,+gain.input.value/20), wide=+hr.value===0;
        n.pre.gain.value=g*(wide?0.25:1.0);
        n.post.gain.value=wide?1.2:0.7;
      }
    });
    var cv=screen(el,150), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData, function(ctx,w,h){
      var wide=+hr.value===0, lim=wide?0.42:0.30;
      ctx.strokeStyle=C("--alias"); ctx.setLineDash([6,4]); ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(0,h/2-h*lim); ctx.lineTo(w,h/2-h*lim);
      ctx.moveTo(0,h/2+h*lim); ctx.lineTo(w,h/2+h*lim); ctx.stroke(); ctx.setLineDash([]);
      lab(ctx,"上限（ヘッドルーム）",w-8,h/2-h*lim-5,C("--alias"),"right",9);
    }));
    function upd(){ gain.val.textContent="+"+gain.input.value+" dB"; d.refresh();
      var g=+gain.input.value, wide=+hr.value===0;
      out.innerHTML=(wide? (g<18?'ヘッドルームが広いので、+'+g+' dB でもまだ潰れない = <b class="ok">音量が上がるだけ</b>':'広くてもさすがに潰れ始めた')
        : (g<4?'まだリニア':'<b style="color:var(--alias)">後段が飽和</b>。音量はほぼ頭打ちで、歪みが深くなっていく = 「アンプをプッシュ」'))+
        '。同じブースターでも次の段のヘッドルームで仕事が変わる（3 章）';
    }
    gain.input.addEventListener("input",upd); hr.addEventListener("change",function(){upd(); d.refresh();}); upd();
  };

  /* ============ 04. clip — クリッピング ============ */
  REG.clip=function(el){
    head(el,"DEMO","クリッピングと倍音 — ソフト/ハード/非対称");
    var row=ctrls(el);
    var mode=select(row,"潰し方",["ソフト（tanh・オーバードライブ）","ハード（切り落とし・ディストーション）","非対称（上下で違う高さ）"]);
    var drive=slider(row,"Gain（入力の増幅）",1,20,4,0.5);
    var tone=slider(row,"Tone（高域）",500,6000,3000,100);
    var d=fxdemo(el,{
      build:function(ctx){
        var pre=ctx.createGain(), ws=ctx.createWaveShaper(), lp=ctx.createBiquadFilter(), post=ctx.createGain();
        lp.type="lowpass"; ws.oversample="4x";
        pre.connect(ws); ws.connect(lp); lp.connect(post); post.gain.value=0.5;
        return {input:pre, output:post, pre:pre, ws:ws, lp:lp};
      },
      apply:function(n){
        var m=+mode.value, k=+drive.input.value, n2=1024, c=new Float32Array(n2);
        for(var i=0;i<n2;i++){ var x=(i/(n2-1)*2-1)*k, y;
          if(m===0) y=Math.tanh(x);
          else if(m===1) y=Math.max(-0.7,Math.min(0.7,x));
          else y=Math.max(-0.75,Math.min(0.35,x<0?Math.tanh(x):x));
          c[i]=y; }
        n.ws.curve=c; n.pre.gain.value=1; n.lp.frequency.value=+tone.input.value;
      }
    });
    var cv=screen(el,170), cc=cctx(cv), out=readout(el);
    function extra(ctx,w,h){ // 伝達カーブを左に描く
      var s=Math.min(w*0.28,h-24), x0=10, y0=12;
      ctx.strokeStyle=C("--line"); ctx.strokeRect(x0,y0,s,s);
      ctx.strokeStyle=C("--grid"); ctx.beginPath(); ctx.moveTo(x0,y0+s/2); ctx.lineTo(x0+s,y0+s/2); ctx.moveTo(x0+s/2,y0); ctx.lineTo(x0+s/2,y0+s); ctx.stroke();
      var m=+mode.value, k=+drive.input.value;
      ctx.strokeStyle=C("--blue"); ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=100;i++){ var x=(i/100*2-1), xi=x*k, y;
        if(m===0) y=Math.tanh(xi); else if(m===1) y=Math.max(-0.7,Math.min(0.7,xi));
        else y=Math.max(-0.75,Math.min(0.35,xi<0?Math.tanh(xi):xi));
        var px=x0+(x+1)/2*s, py=y0+s/2-y*s/2*0.95;
        i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
      ctx.stroke();
      lab(ctx,"入出力カーブ",x0+4,y0+12,C("--faint"),"left",8.5);
    }
    anim(el, drawScope(cc, d.scopeData, extra));
    function upd(){ drive.val.textContent=drive.input.value+"×"; tone.val.textContent=tone.input.value+" Hz"; d.refresh();
      out.innerHTML=["<b>ソフト:</b> なだらかに丸める。低次倍音中心の穏やかな歪み。帰還路のダイオード・真空管の飽和がこの形",
        "<b>ハード:</b> スパッと切る。高次までギラギラ。グラウンドへのダイオード（RAT/DS-1 系）",
        "<b>非対称:</b> 上下で潰れ方が違う → 偶数次倍音が乗り「チューブっぽい」と言われる質感"][+mode.value]+
        "。Gain を上げるほど潰れる範囲が広がる = 歪みが深くなる";
    }
    [mode].forEach(function(s){s.addEventListener("change",function(){upd();});});
    [drive,tone].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 05. fuzz — ファズ ============ */
  REG.fuzz=function(el){
    head(el,"DEMO","ファズの潰れ方とゲート感");
    var row=ctrls(el);
    var fz=slider(row,"Fuzz（潰しの深さ）",5,60,30,1);
    var gate=slider(row,"Gate/Bias（動作点のずれ）",0,40,0,1);
    var vol=slider(row,"ギター側ボリューム（入力を絞る）",20,100,100,1);
    var d=fxdemo(el,{
      build:function(ctx){
        var inGain=ctx.createGain(), ws=ctx.createWaveShaper(), lp=ctx.createBiquadFilter(), post=ctx.createGain();
        ws.oversample="4x"; lp.type="lowpass"; lp.frequency.value=3500; post.gain.value=0.4;
        inGain.connect(ws); ws.connect(lp); lp.connect(post);
        return {input:inGain, output:post, inGain:inGain, ws:ws};
      },
      apply:function(n){
        var k=+fz.input.value, gth=+gate.input.value/100, n2=2048, c=new Float32Array(n2);
        for(var i=0;i<n2;i++){ var x=i/(n2-1)*2-1;
          var v=Math.abs(x)<gth ? 0 : Math.tanh((x-Math.sign(x)*gth)*k);   // ゲート + 強クリップ
          c[i]=Math.max(-0.8,Math.min(0.8,v)); }
        n.ws.curve=c;
        n.inGain.gain.value=+vol.input.value/100;
      }
    });
    var cv=screen(el,140), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData));
    function upd(){ fz.val.textContent=fz.input.value+"×"; gate.val.textContent=gate.input.value; vol.val.textContent=vol.input.value;
      d.refresh();
      var g=+gate.input.value, v=+vol.input.value;
      out.innerHTML="波形はほぼ矩形波（5 章）。"+
        (g>15?"<b style='color:var(--alias)'>ゲート感:</b> 小さい信号が増幅されず、消え際がブツッとちぎれる（ベルクロファズ）。":"")+
        (v<60?"<b class='ok'>ボリュームを絞る</b>と潰れが浅くなりクランチ〜クリーンへ——Fuzz Face の 1 台 3 役（実機はさらに回路とピックアップの相互作用が乗る）。":"")+
        "実機のファズはこの単純なモデルに、トランジスタの癖・温度・電池電圧の揺らぎが重なる";
    }
    [fz,gate,vol].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 06. comp — コンプレッサー ============ */
  REG.comp=function(el){
    head(el,"DEMO","コンプの効きを見る（DynamicsCompressorNode）");
    var row=ctrls(el);
    var th=slider(row,"スレッショルド (dB)",-60,0,-24,1);
    var ratio=slider(row,"レシオ",1,20,4,1);
    var atk=slider(row,"アタック (ms)",0,100,20,1);
    var rel=slider(row,"リリース (ms)",20,1000,250,10);
    var mk2=slider(row,"メイクアップ (dB)",0,24,6,1);
    var d=fxdemo(el,{
      build:function(ctx){
        var comp=ctx.createDynamicsCompressor(), post=ctx.createGain();
        comp.knee.value=6; comp.connect(post);
        return {input:comp, output:post, comp:comp, post:post};
      },
      apply:function(n){
        n.comp.threshold.value=+th.input.value;
        n.comp.ratio.value=+ratio.input.value;
        n.comp.attack.value=+atk.input.value/1000;
        n.comp.release.value=+rel.input.value/1000;
        n.post.gain.value=Math.pow(10,+mk2.input.value/20);
      }
    });
    var cv=screen(el,170), cc=cctx(cv), out=readout(el);
    function extra(ctx,w,h){ // 入出力カーブ
      var s=Math.min(w*0.30,h-24), x0=10, y0=12;
      ctx.strokeStyle=C("--line"); ctx.strokeRect(x0,y0,s,s);
      var T2=+th.input.value, R=+ratio.input.value;
      ctx.strokeStyle=C("--grid"); ctx.setLineDash([4,3]); ctx.beginPath();
      ctx.moveTo(x0,y0+s); ctx.lineTo(x0+s,y0); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle=C("--blue"); ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=60;i++){ var din=-60+i, dout=din<T2?din:T2+(din-T2)/R;
        var px=x0+(din+60)/60*s, py=y0+s-(dout+60)/60*s;
        i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
      ctx.stroke();
      var pxT=x0+(T2+60)/60*s;
      ctx.fillStyle=C("--alias"); ctx.beginPath(); ctx.arc(pxT,y0+s-(T2+60)/60*s,3.5,0,Math.PI*2); ctx.fill();
      lab(ctx,"入出力カーブ",x0+4,y0+12,C("--faint"),"left",8.5);
    }
    anim(el, drawScope(cc, d.scopeData, extra));
    function upd(){
      th.val.textContent=th.input.value+" dB"; ratio.val.textContent=ratio.input.value+":1";
      atk.val.textContent=atk.input.value+" ms"; rel.val.textContent=rel.input.value+" ms"; mk2.val.textContent="+"+mk2.input.value+" dB";
      d.refresh();
      var a=+atk.input.value;
      out.innerHTML=(a>=15?"<b class='ok'>アタック遅め:</b> ピッキングの頭が通り抜けて残る（パコッ）。ファンク/カントリーの質感":
        "<b>アタック速め:</b> 頭から潰れて粒が完全に揃う。ノペッとしがち")+
        "。メイクアップで持ち上げると消え際が持ち上がる =「伸びる」の正体（音源を「刻み」にして聞き比べると分かりやすい）";
    }
    [th,ratio,atk,rel,mk2].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 07. gate — ノイズゲート ============ */
  REG.gate=function(el){
    head(el,"DEMO","ゲートの開閉を見る（ノイズ付きの音源で）");
    var row=ctrls(el);
    var th=slider(row,"スレッショルド",0,100,30,1);
    var rel=slider(row,"リリース（閉じる速さ ms）",10,500,80,5);
    var noise=slider(row,"足すノイズの量",0,60,25,1);
    var d=fxdemo(el,{
      build:function(ctx){
        // ノイズ源 + ゲート（ScriptProcessor は避け、gain を解析で駆動する簡易ゲート）
        var inp=ctx.createGain(), sum=ctx.createGain(), nz=ctx.createBufferSource(), ng=ctx.createGain(),
            gate=ctx.createGain(), an=ctx.createAnalyser(), out=ctx.createGain();
        var sr=ctx.sampleRate, nb=ctx.createBuffer(1,sr,sr), nd=nb.getChannelData(0);
        for(var i=0;i<sr;i++) nd[i]=(Math.random()*2-1)*0.5;
        nz.buffer=nb; nz.loop=true; nz.start();
        nz.connect(ng); ng.connect(sum); inp.connect(sum);
        an.fftSize=512; inp.connect(an);          // 検出はクリーン信号で（4 ケーブル方式）
        sum.connect(gate); gate.connect(out);
        var buf=new Float32Array(an.fftSize), env=0, open=1;
        var timer=setInterval(function(){
          an.getFloatTimeDomainData(buf);
          var pk=0; for(var j=0;j<buf.length;j++) pk=Math.max(pk,Math.abs(buf[j]));
          env=Math.max(pk, env*0.9);
          var thv=+th.input.value/100*0.5, hys=thv*0.7;
          if(open&&env<hys) open=0; else if(!open&&env>thv) open=1;
          var tc=open?0.004:(+rel.input.value/1000);
          gate.gain.setTargetAtTime(open?1:0.02, ctx.currentTime, tc/3);
          d._open=open; d._env=env;
        },30);
        return {input:inp, output:out, ng:ng,
          dispose:function(){ clearInterval(timer); try{nz.stop();}catch(e){} }};
      },
      apply:function(n){ n.ng.gain.value=+noise.input.value/100; }
    });
    var cv=screen(el,130), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData, function(ctx,w,h){
      if(d.state.playing){
        var open=d._open;
        ctx.fillStyle=open?C("--signal-soft"):C("--alias-soft");
        ctx.fillRect(w-110,8,100,24);
        lab(ctx, open?"開":"閉（ノイズを遮断）", w-60, 24, open?C("--signal"):C("--alias"), "center", 10);
      }
    }));
    function upd(){ th.val.textContent=th.input.value; rel.val.textContent=rel.input.value+" ms"; noise.val.textContent=noise.input.value; d.refresh();
      out.innerHTML="検出はノイズを混ぜる<b>前</b>のクリーン信号で行っている（4 ケーブル方式、7 章）。閾値を上げるほど早く閉じるが、余韻も切れる。開閉の閾値を分ける<b>ヒステリシス</b>でバタつきを防いでいる";
    }
    [th,rel,noise].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 08. eq — イコライザ ============ */
  REG.eq=function(el){
    head(el,"DEMO","イコライザで音色を彫る（5 バンド）");
    var row=ctrls(el);
    var bands=[[100,"lowshelf","100 (棚)"],[250,"peaking","250"],[630,"peaking","630"],[1600,"peaking","1.6k"],[4000,"highshelf","4k (棚)"]];
    var sls=bands.map(function(b){ return slider(row,b[2]+" Hz",-12,12,0,1); });
    var d=fxdemo(el,{
      build:function(ctx){
        var fs=bands.map(function(b){ var f=ctx.createBiquadFilter();
          f.type=b[1]; f.frequency.value=b[0]; f.Q.value=1.0; return f; });
        for(var i=0;i<fs.length-1;i++) fs[i].connect(fs[i+1]);
        return {input:fs[0], output:fs[fs.length-1], fs:fs};
      },
      apply:function(n){ n.fs.forEach(function(f,i){ f.gain.value=+sls[i].input.value; }); }
    });
    var bar=mk("div","btns"); el.appendChild(bar);
    [["フラット",[0,0,0,0,0]],["こもり取り",[0,-4,0,0,0]],["抜け（ミッド）",[0,0,2,3,0]],["ドンシャリ",[4,0,-5,0,4]],["ラジオ声",[-12,-6,4,0,-12]]].forEach(function(p){
      var b=button(bar,p[0]); b.addEventListener("click",function(){ sls.forEach(function(s,i){s.input.value=p[1][i];}); upd(); });});
    var cv=screen(el,160), cc=cctx(cv), out=readout(el);
    function drawCurve(){
      var dd=cc.fit(),ctx=cc.ctx,w=dd.w,h=dd.h;ctx.clearRect(0,0,w,h);
      ctx.strokeStyle=C("--grid");ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
      // 合成カーブ（簡易: 各バンドをガウスで近似）
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var i=0;i<=200;i++){
        var u=i/200, f=20*Math.pow(1000,u), db=0;
        bands.forEach(function(b,k){
          var g=+sls[k].input.value, lf=Math.log(b[0]);
          if(b[1]==="lowshelf") db+=g/(1+Math.exp((Math.log(f)-lf)*3));
          else if(b[1]==="highshelf") db+=g/(1+Math.exp(-(Math.log(f)-lf)*3));
          else db+=g*Math.exp(-Math.pow((Math.log(f)-lf)/0.5,2));
        });
        var y=h/2-db/14*(h/2-14);
        i?ctx.lineTo(u*w,y):ctx.moveTo(u*w,y);
      }
      ctx.stroke();
      [["100",100],["1k",1000],["10k",10000]].forEach(function(t){
        var x=Math.log(t[1]/20)/Math.log(1000)*w;
        lab(ctx,t[0],x,h-6,C("--faint"),"center",8.5); });
      lab(ctx,"+12",4,14,C("--faint"),"left",8.5); lab(ctx,"0 dB",4,h/2-4,C("--faint"),"left",8.5);
      var a2=d.scopeData&&d.scopeData();
      if(a2){ ctx.strokeStyle=C("--blue"); ctx.globalAlpha=0.45; ctx.lineWidth=1.2; ctx.beginPath();
        for(var j=0;j<a2.length;j++){ var x2=j/a2.length*w, y2=h/2-a2[j]*h*0.4; j?ctx.lineTo(x2,y2):ctx.moveTo(x2,y2); }
        ctx.stroke(); ctx.globalAlpha=1; }
    }
    anim(el,drawCurve); reg(cv,drawCurve);
    function upd(){ sls.forEach(function(s){ s.val.textContent=(+s.input.value>0?"+":"")+s.input.value+" dB"; }); d.refresh();
      var boost=sls.reduce(function(a,s){return a+Math.max(0,+s.input.value);},0);
      out.innerHTML=(boost>10?"<b style='color:var(--alias)'>ブーストしすぎ注意:</b> ヘッドルームを食う。「足す前に削る」（8 章）へ。":"")+
        "こもり = 250 付近を削る、抜け = 630〜1.6k を少し足す、±3 dB で足りることが多い";
    }
    sls.forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 09. wah — ワウ ============ */
  REG.wah=function(el){
    head(el,"DEMO","ワウの山を動かす（バンドパス + レゾナンス）");
    var row=ctrls(el);
    var mode=select(row,"動かし方",["ペダル（下のスライダー）","エンベロープ（ピッキングに反応）","LFO（オートワウ）"]);
    var pedal=slider(row,"ペダル位置",0,100,50,1);
    var q=slider(row,"レゾナンス Q",1,15,6,0.5);
    var rate=slider(row,"LFO Rate (Hz)",0.5,6,2,0.1);
    var d=fxdemo(el,{
      build:function(ctx){
        var bp=ctx.createBiquadFilter(), post=ctx.createGain(), an=ctx.createAnalyser(), inp=ctx.createGain();
        bp.type="bandpass"; post.gain.value=1.4; an.fftSize=512;
        inp.connect(bp); inp.connect(an); bp.connect(post);
        var buf=new Float32Array(an.fftSize), env=0, ph=0, last=performance.now();
        var timer=setInterval(function(){
          var m=+mode.value, now=performance.now(), dt=(now-last)/1000; last=now;
          var fmin=350, fmax=2200, u;
          if(m===0){ u=+pedal.input.value/100; }
          else if(m===1){ an.getFloatTimeDomainData(buf);
            var pk=0; for(var j=0;j<buf.length;j++) pk=Math.max(pk,Math.abs(buf[j]));
            env=Math.max(pk, env*0.92); u=Math.min(1, env*2.4); }
          else { ph+=dt*(+rate.input.value)*Math.PI*2; u=(Math.sin(ph)+1)/2; }
          d._u=u;
          bp.frequency.setTargetAtTime(fmin*Math.pow(fmax/fmin,u), ctx.currentTime, 0.02);
        },25);
        return {input:inp, output:post, bp:bp, dispose:function(){clearInterval(timer);}};
      },
      apply:function(n){ n.bp.Q.value=+q.input.value; }
    });
    var cv=screen(el,150), cc=cctx(cv), out=readout(el);
    function draw(){
      var dd=cc.fit(),ctx=cc.ctx,w=dd.w,h=dd.h;ctx.clearRect(0,0,w,h);
      var u=(d._u!=null&&d.state.playing)?d._u:+pedal.input.value/100, Q=+q.input.value;
      var fc=Math.log(350*Math.pow(2200/350,u)/60)/Math.log(100);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var i=0;i<=200;i++){ var x=i/200, dist=(x-fc)*4*Q/6;
        var g=1/(1+dist*dist)*(0.25+Q/16), y=h-16-g*(h-40);
        i?ctx.lineTo(x*w,y):ctx.moveTo(x*w,y); }
      ctx.stroke();
      lab(ctx,"周波数 →",w-10,h-5,C("--faint"),"right",9);
      lab(ctx,"強調される帯域（山）が動く = 母音の変化に聞こえる",10,16,C("--muted"),"left",9.5);
    }
    anim(el,draw); reg(cv,draw);
    function upd(){ pedal.val.textContent=pedal.input.value; q.val.textContent=q.input.value; rate.val.textContent=rate.input.value+" Hz"; d.refresh();
      out.innerHTML=["ペダル位置 = 山の場所。踏み切らず、おいしい範囲を小さく動かすのがコツ",
        "<b>エンベロープフィルタ:</b> 音量検出（6 章の部品）で山が開く。強く弾いたときだけ全開になる感度が肝",
        "<b>オートワウ:</b> LFO（10 章の部品）で周期的に。テンポに合わせると気持ちいい"][+mode.value]+
        "。Q を上げると「クセ」が強くなり、鳴く寸前が一番おいしい（9 章）";
    }
    mode.addEventListener("change",upd);
    [pedal,q,rate].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 10. trem — トレモロ ============ */
  REG.trem=function(el){
    head(el,"DEMO","LFO で音量を揺らす（トレモロ）");
    var row=ctrls(el);
    var rate=slider(row,"Rate (Hz)",0.5,12,4,0.1);
    var depth=slider(row,"Depth (%)",0,100,60,1);
    var shape=select(row,"LFO 波形",["正弦波（滑らか）","矩形波（スライサー的）"]);
    var d=fxdemo(el,{
      build:function(ctx){
        var inp=ctx.createGain(), vca=ctx.createGain(), out=ctx.createGain();
        var o=ctx.createOscillator(), dg=ctx.createGain();
        o.connect(dg); dg.connect(vca.gain); o.start();
        inp.connect(vca); vca.connect(out);
        return {input:inp, output:out, vca:vca, osc:o, dg:dg,
          dispose:function(){ try{o.stop();}catch(e){} }};
      },
      apply:function(n){
        var dep=+depth.input.value/100;
        n.osc.frequency.value=+rate.input.value;
        n.osc.type=+shape.value===0?"sine":"square";
        n.vca.gain.value=1-dep/2;
        n.dg.gain.value=dep/2;
      }
    });
    var cv=screen(el,140), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData, function(ctx,w,h){
      // LFO を薄く重ねる
      var r=+rate.input.value, dep=+depth.input.value/100, sq=+shape.value===1;
      ctx.strokeStyle=C("--blue"); ctx.globalAlpha=0.5; ctx.lineWidth=1.4; ctx.beginPath();
      for(var i=0;i<=200;i++){ var u=i/200, ph=u*r*1.5*Math.PI*2;
        var v=sq?(Math.sin(ph)>0?1:-1):Math.sin(ph);
        var y=h*0.2-v*dep*h*0.12;
        i?ctx.lineTo(u*w,y):ctx.moveTo(u*w,y); }
      ctx.stroke(); ctx.globalAlpha=1;
      lab(ctx,"LFO",6,h*0.2,C("--blue"),"left",9);
    }));
    function upd(){ rate.val.textContent=rate.input.value+" Hz"; depth.val.textContent=depth.input.value+" %"; d.refresh();
      var bpm=Math.round(+rate.input.value*30);
      out.innerHTML="Rate "+rate.input.value+" Hz = BPM "+bpm+" の 8 分に相当（BPM = Rate×60÷2 拍）。テンポに合わせると音楽に嵌まる。"+
        (+shape.value===1?"<b>矩形波 + 深め = スライサー</b>。白玉がシーケンスになる":"Depth は「気づかれる寸前」が上品（常時オンの場合）");
    }
    shape.addEventListener("change",upd);
    [rate,depth].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ---- 共通: 揺れる遅延（コーラス/フランジャー/ビブラート用） ---- */
  function modDelay(ctx, opt){
    var inp=ctx.createGain(), dl=ctx.createDelay(0.1), lfoG=ctx.createGain(), osc=ctx.createOscillator(),
        fb=ctx.createGain(), wet=ctx.createGain(), dry=ctx.createGain(), out=ctx.createGain();
    osc.connect(lfoG); lfoG.connect(dl.delayTime); osc.start();
    inp.connect(dl); dl.connect(wet); wet.connect(out);
    inp.connect(dry); dry.connect(out);
    dl.connect(fb); fb.connect(dl);
    return {input:inp, output:out, dl:dl, osc:osc, lfoG:lfoG, fb:fb, wet:wet, dry:dry,
      dispose:function(){ try{osc.stop();}catch(e){} }};
  }

  /* ============ 11. chorus ============ */
  REG.chorus=function(el){
    head(el,"DEMO","揺れる遅延を混ぜる（コーラス）");
    var row=ctrls(el);
    var rate=slider(row,"Rate (Hz)",0.1,5,0.6,0.1);
    var depth=slider(row,"Depth（揺れ幅 ms）",0.5,8,3,0.1);
    var base=slider(row,"遅延の中心 (ms)",5,35,18,1);
    var mix=slider(row,"Mix（Wet %）",0,100,50,1);
    var d=fxdemo(el,{
      build:function(ctx){ return modDelay(ctx); },
      apply:function(n){
        var b=+base.input.value/1000, dep=Math.min(b*0.9, +depth.input.value/1000);
        n.dl.delayTime.value=b; n.osc.frequency.value=+rate.input.value;
        n.lfoG.gain.value=dep; n.fb.gain.value=0;
        var m=+mix.input.value/100; n.wet.gain.value=m; n.dry.gain.value=1-m*0.3;
      }
    });
    var cv=screen(el,130), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData));
    function upd(){ rate.val.textContent=rate.input.value+" Hz"; depth.val.textContent=depth.input.value+" ms";
      base.val.textContent=base.input.value+" ms"; mix.val.textContent=mix.input.value+" %"; d.refresh();
      var m=+mix.input.value;
      out.innerHTML=(m>=95?"<b>Mix 100 % = ビブラート</b>（原音がないので干渉せず、ただ揺れる。10 章）":
        "原音 + 揺れる遅延の<b>干渉</b>が「複数人で弾いているような」厚み。80s クリーンは Rate 0.4〜0.8 / Depth 深め / Mix 50 %")+
        "。遅延の中心を 5〜10 ms にすると金属的（フランジャー寄り）、20〜30 ms でダブリング的（11 章）";
    }
    [rate,depth,base,mix].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 12. flanger ============ */
  REG.flanger=function(el){
    head(el,"DEMO","櫛形フィルタを掃引する（フランジャー）");
    var row=ctrls(el);
    var rate=slider(row,"Rate (Hz)",0.05,2,0.25,0.05);
    var depth=slider(row,"Depth",10,95,80,1);
    var fb=slider(row,"Feedback（クセ）",0,90,50,1);
    var d=fxdemo(el,{
      build:function(ctx){ return modDelay(ctx); },
      apply:function(n){
        var b=0.0035, dep=b*0.85*(+depth.input.value/100);
        n.dl.delayTime.value=b; n.osc.frequency.value=+rate.input.value;
        n.lfoG.gain.value=dep; n.fb.gain.value=+fb.input.value/100*0.85;
        n.wet.gain.value=0.7; n.dry.gain.value=0.7;
      }
    });
    var cv=screen(el,160), cc=cctx(cv), out=readout(el);
    var t0=performance.now();
    function draw(){
      var dd=cc.fit(),ctx=cc.ctx,w=dd.w,h=dd.h;ctx.clearRect(0,0,w,h);
      var tt=(performance.now()-t0)/1000, r=+rate.input.value, dep=+depth.input.value/100, F=+fb.input.value/100;
      var t=3.5*(1+0.85*dep*Math.sin(tt*r*Math.PI*2)); // ms
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=300;i++){ var u=i/300, f=u*4000;   // 0..4kHz
        var phase=2*Math.PI*f*t/1000, g=(1+F)/2*(1+Math.cos(phase))/(1+F*F/2);
        var y=h-14-Math.min(1,g)*(h-34);
        i?ctx.lineTo(u*w,y):ctx.moveTo(u*w,y); }
      ctx.stroke();
      lab(ctx,"周波数特性（櫛の谷 = 1/2t, 3/2t…。LFO で伸び縮み）",10,16,C("--muted"),"left",9.5);
      lab(ctx,"0",4,h-4,C("--faint"),"left",8.5); lab(ctx,"4 kHz",w-8,h-4,C("--faint"),"right",8.5);
    }
    anim(el,draw); reg(cv,draw);
    function upd(){ rate.val.textContent=rate.input.value+" Hz"; depth.val.textContent=depth.input.value+" %"; fb.val.textContent=fb.input.value+" %"; d.refresh();
      out.innerHTML="遅延 3.5 ms 前後の短さが谷を可聴域に数本並べ、掃引が<b>ジェット音</b>になる（12 章）。"+
        (+fb.input.value>60?"<b>Feedback 深め:</b> 山が尖って金属的な共鳴が乗る":"Feedback を上げると山が尖ってクセが強くなる")+
        "。同じ回路で遅延を 20 ms にすればコーラス（11 章）";
    }
    [rate,depth,fb].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 13. phaser ============ */
  REG.phaser=function(el){
    head(el,"DEMO","ノッチの数と動き（フェイザー）");
    var row=ctrls(el);
    var stages=select(row,"段数",["2 ステージ（ノッチ 1）","4 ステージ（ノッチ 2）","8 ステージ（ノッチ 4）"]);
    var rate=slider(row,"Rate (Hz)",0.1,4,0.6,0.1);
    var d=fxdemo(el,{
      build:function(ctx){
        var inp=ctx.createGain(), out=ctx.createGain(), dry=ctx.createGain(), wet=ctx.createGain();
        var aps=[]; for(var i=0;i<8;i++){ var f=ctx.createBiquadFilter(); f.type="allpass"; f.Q.value=0.6; aps.push(f); }
        for(i=0;i<7;i++) aps[i].connect(aps[i+1]);
        inp.connect(aps[0]);
        dry.gain.value=0.6; wet.gain.value=0.6;
        inp.connect(dry); dry.connect(out); wet.connect(out);
        var taps=[aps[1],aps[3],aps[7]]; // 実際の接続は apply で選ぶ代わりに全部作りタップを切替
        var t0=performance.now();
        var timer=setInterval(function(){
          var tt=(performance.now()-t0)/1000, r=+rate.input.value;
          var f0=400*Math.pow(4,(Math.sin(tt*r*Math.PI*2)+1)/2);
          aps.forEach(function(a){ a.frequency.setTargetAtTime(f0, ctx.currentTime, 0.02); });
        },30);
        return {input:inp, output:out, aps:aps, wet:wet, taps:taps, cur:null,
          dispose:function(){ clearInterval(timer); }};
      },
      apply:function(n){
        if(n.cur) try{ n.cur.disconnect(n.wet); }catch(e){}
        var tap=n.taps[+stages.value];
        tap.connect(n.wet); n.cur=tap;
      }
    });
    var cv=screen(el,160), cc=cctx(cv), out=readout(el);
    var t0=performance.now();
    function draw(){
      var dd=cc.fit(),ctx=cc.ctx,w=dd.w,h=dd.h;ctx.clearRect(0,0,w,h);
      var tt=(performance.now()-t0)/1000, r=+rate.input.value, nst=[2,4,8][+stages.value];
      var f0=400*Math.pow(4,(Math.sin(tt*r*Math.PI*2)+1)/2);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=300;i++){ var u=i/300, f=40*Math.pow(100,u);
        var ph=nst*2*Math.atan(f/f0);          // 一次オールパス n 段の位相
        var g=Math.abs(Math.cos(ph/2));        // 原音と混ぜた振幅
        var y=h-14-g*(h-34);
        i?ctx.lineTo(u*w,y):ctx.moveTo(u*w,y); }
      ctx.stroke();
      lab(ctx,"ノッチ = 段数の半分・不等間隔（フランジャーとの指紋の違い）",10,16,C("--muted"),"left",9.5);
      lab(ctx,"40",4,h-4,C("--faint"),"left",8.5); lab(ctx,"4 kHz",w-8,h-4,C("--faint"),"right",8.5);
    }
    anim(el,draw); reg(cv,draw);
    function upd(){ rate.val.textContent=rate.input.value+" Hz"; d.refresh();
      out.innerHTML="オールパス（音量そのまま・位相だけ回す）を "+[2,4,8][+stages.value]+" 段通し、原音と混ぜている。位相 180° の周波数で打ち消し = ノッチ。"+
        "段数 = 主張の濃さ（4 段はさりげなく、8 段は主役級）。歪みの前に置くと EVH 流の荒い揺れになる（13 章）";
    }
    stages.addEventListener("change",upd);
    rate.input.addEventListener("input",upd); upd();
  };

  /* ============ 14. rotary ============ */
  REG.rotary=function(el){
    head(el,"DEMO","回転を分解する（ドップラー + トレモロ + パン）");
    var row=ctrls(el);
    var speed=select(row,"速度",["Chorale（遅い 0.8 Hz）","Tremolo（速い 6.5 Hz）"]);
    var parts={dop:checkbox(row,"ドップラー（音程の揺れ）",true),
               am:checkbox(row,"トレモロ（音量の揺れ）",true),
               pan:checkbox(row,"パン（左右の揺れ・要ステレオ）",true)};
    var d=fxdemo(el,{
      build:function(ctx){
        var n=modDelay(ctx);
        var vca=ctx.createGain(), pan=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();
        var amO=ctx.createOscillator(), amG=ctx.createGain(), panO=ctx.createOscillator(), panG=ctx.createGain();
        amO.connect(amG); amG.connect(vca.gain); amO.start();
        if(pan.pan){ panO.connect(panG); panG.connect(pan.pan); }
        panO.start();
        n.output.connect(vca); vca.connect(pan);
        var out=ctx.createGain(); pan.connect(out);
        return {input:n.input, output:out, md:n, vca:vca, amO:amO, amG:amG, panO:panO, panG:panG, panner:pan,
          dispose:function(){ n.dispose(); try{amO.stop();panO.stop();}catch(e){} }};
      },
      apply:function(n){
        var r=+speed.value===0?0.8:6.5;
        n.md.dl.delayTime.value=0.012;
        n.md.osc.frequency.value=r;
        n.md.lfoG.gain.value=parts.dop.checked?0.0035:0.00001;
        n.md.wet.gain.value=1; n.md.dry.gain.value=0; n.md.fb.gain.value=0;   // 100% wet = ビブラート
        n.amO.frequency.value=r;
        n.vca.gain.value=parts.am.checked?0.75:1;
        n.amG.gain.value=parts.am.checked?0.25:0;
        n.panO.frequency.value=r;
        n.panG.gain.value=(parts.pan.checked&&n.panner.pan)?0.8:0;
      }
    });
    var cv=screen(el,130), cc=cctx(cv), out=readout(el);
    var t0=performance.now();
    anim(el, drawScope(cc, d.scopeData, function(ctx,w,h){
      var r=+speed.value===0?0.8:6.5, tt=(performance.now()-t0)/1000;
      var a=tt*r*Math.PI*2;
      var cx2=w-60, cy2=h/2;
      ctx.strokeStyle=C("--line"); ctx.beginPath(); ctx.arc(cx2,cy2,26,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=C("--signal"); ctx.beginPath(); ctx.arc(cx2+26*Math.cos(a),cy2+26*Math.sin(a),5,0,Math.PI*2); ctx.fill();
      lab(ctx,"回転ホーン",cx2,cy2-34,C("--muted"),"center",9);
    }));
    function upd(){ d.refresh();
      var on=[parts.dop.checked&&"音程",parts.am.checked&&"音量",parts.pan.checked&&"定位"].filter(Boolean).join("・");
      out.innerHTML="ON: <b>"+(on||"なし")+"</b>。全部 ON にしても実機のレスリーに届かないのは、実機では 4 つが<b>1 つの回転から相関して</b>生まれ、ホーンとドラムが別速度で回るから（14 章）。1 つずつ OFF にして役割を聞き分けてみる";
    }
    speed.addEventListener("change",upd);
    Object.keys(parts).forEach(function(k){parts[k].addEventListener("change",upd);}); upd();
  };

  /* ============ 15. pitch — オクターブ ============ */
  REG.pitch=function(el){
    head(el,"DEMO","オクターブと整流（アナログ式オクターブアップ）");
    var row=ctrls(el);
    var mode=select(row,"処理",["原音のみ","全波整流（|x|）= 1 オクターブ上が乗る","整流 + ファズ（オクタビア風）"]);
    var mix=slider(row,"整流音の Mix",0,100,70,1);
    var d=fxdemo(el,{
      build:function(ctx){
        var inp=ctx.createGain(), dry=ctx.createGain(), wet=ctx.createGain(), out=ctx.createGain();
        var rect=mkDist(ctx,function(x){return Math.abs(x)*2-0.5;});
        var fzz=mkDist(ctx,function(x){return Math.tanh(x*8);});
        var hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=120;
        inp.connect(dry); dry.connect(out); wet.connect(out);
        inp.connect(rect); rect.connect(hp);
        return {input:inp, output:out, dry:dry, wet:wet, rect:rect, hp:hp, fzz:fzz, wired:null,
          dispose:function(){}};
      },
      apply:function(n){
        var m=+mode.value;
        try{ n.hp.disconnect(); }catch(e){}
        if(m===0){ n.dry.gain.value=1; n.wet.gain.value=0; }
        else {
          n.dry.gain.value=0.8;
          if(m===1){ n.hp.connect(n.wet); }
          else { try{n.fzz.disconnect();}catch(e){} n.hp.connect(n.fzz); n.fzz.connect(n.wet); }
          n.wet.gain.value=+mix.input.value/100*0.8;
        }
      }
    });
    var cv=screen(el,150), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData, function(ctx,w,h){
      // 整流の図解
      var x0=10,y0=12,s=Math.min(w*0.26,h-24);
      ctx.strokeStyle=C("--line"); ctx.strokeRect(x0,y0,s,s);
      ctx.strokeStyle=C("--grid"); ctx.beginPath(); ctx.moveTo(x0,y0+s/2); ctx.lineTo(x0+s,y0+s/2); ctx.stroke();
      ctx.strokeStyle=C("--faint"); ctx.lineWidth=1.2; ctx.beginPath();
      for(var i=0;i<=80;i++){ var u=i/80, v=Math.sin(u*Math.PI*4);
        var y=y0+s/2-v*s*0.4; i?ctx.lineTo(x0+u*s,y):ctx.moveTo(x0+u*s,y); } ctx.stroke();
      if(+mode.value>0){ ctx.strokeStyle=C("--blue"); ctx.lineWidth=2; ctx.beginPath();
        for(i=0;i<=80;i++){ var u2=i/80, v2=Math.abs(Math.sin(u2*Math.PI*4));
          var y2=y0+s/2-v2*s*0.4; i?ctx.lineTo(x0+u2*s,y2):ctx.moveTo(x0+u2*s,y2); } ctx.stroke(); }
      lab(ctx,"整流: 周期が半分 = 2 倍の高さ",x0+s+10,y0+14,C("--faint"),"left",8.5);
    }));
    function upd(){ mix.val.textContent=mix.input.value+" %"; d.refresh();
      out.innerHTML=["原音のまま","マイナス側を折り返すと周期が半分 = <b>1 オクターブ上の成分</b>が生まれる（15 章）。単音・低いポジションで聞くとよく分かる。和音では相互変調で崩壊する——それも味",
        "整流 + 深い歪み = <b>オクタビア</b>（5 章）。12 フレット以上の単音で「上が鳴く」"][+mode.value]+
        "。1 オクターブ下（OC-2 系）は山を数えて 2 回に 1 回反転する分周回路——こちらはこのデモでは省略。任意音程はデジタルのグレイン方式（15 章）";
    }
    mode.addEventListener("change",upd); mix.input.addEventListener("input",upd); upd();
  };

  /* ============ 16. delay ============ */
  REG.delay=function(el){
    head(el,"DEMO","タイムとフィードバック（テンポ計算つき）");
    var row=ctrls(el);
    var bpm=slider(row,"BPM",60,180,120,1);
    var div=select(row,"音価",["4 分","付点 8 分","8 分","3 連 8 分","16 分"]);
    var fb=slider(row,"Feedback (%)",0,95,45,1);
    var mix=slider(row,"Mix (%)",0,100,35,1);
    var dark=slider(row,"繰り返しの暗さ（ローパス Hz）",800,8000,2500,100);
    var DIVS=[1,0.75,0.5,1/3,0.25];
    function ms(){ return Math.round(60000/(+bpm.input.value)*DIVS[+div.value]); }
    var d=fxdemo(el,{
      build:function(ctx){
        var inp=ctx.createGain(), dl=ctx.createDelay(2), fbg=ctx.createGain(), lp=ctx.createBiquadFilter(),
            wet=ctx.createGain(), dry=ctx.createGain(), out=ctx.createGain();
        lp.type="lowpass";
        inp.connect(dry); dry.connect(out);
        inp.connect(dl); dl.connect(lp); lp.connect(wet); wet.connect(out);
        lp.connect(fbg); fbg.connect(dl);
        return {input:inp, output:out, dl:dl, fbg:fbg, lp:lp, wet:wet, dry:dry, dispose:function(){}};
      },
      apply:function(n){
        n.dl.delayTime.value=ms()/1000;
        n.fbg.gain.value=+fb.input.value/100;
        n.lp.frequency.value=+dark.input.value;
        n.wet.gain.value=+mix.input.value/100; n.dry.gain.value=1;
      }
    });
    var cv=screen(el,120), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData));
    function upd(){
      bpm.val.textContent=bpm.input.value; fb.val.textContent=fb.input.value+" %"; mix.val.textContent=mix.input.value+" %";
      dark.val.textContent=dark.input.value+" Hz";
      d.refresh();
      var reps=Math.max(0,Math.round(Math.log(0.05)/Math.log(Math.max(0.01,+fb.input.value/100))));
      out.innerHTML="<b>Time = "+ms()+" ms</b>（60000÷"+bpm.input.value+"×"+["1","0.75","0.5","1/3","0.25"][+div.value]+"）。"+
        "Feedback "+fb.input.value+" % ≈ 繰り返し約 "+(+fb.input.value===0?1:reps)+" 回。"+
        (+div.value===1?"<b class='ok'>付点 8 分:</b> 8 分のフレーズを弾くと繰り返しが 16 分の隙間に落ちる（U2 の魔法、16 章）。":"")+
        "繰り返しは原音より小さく・暗く（ローパス）が定石";
    }
    div.addEventListener("change",upd);
    [bpm,fb,mix,dark].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 17. reverb ============ */
  REG.reverb=function(el){
    head(el,"DEMO","空間を設計する（コンボリューション: 生成 IR）");
    var row=ctrls(el);
    var decay=slider(row,"Decay (秒)",0.3,6,2,0.1);
    var pre=slider(row,"Pre-delay (ms)",0,120,40,5);
    var damp=slider(row,"暗さ（高域の減衰）",1,6,3,0.5);
    var mix=slider(row,"Mix (%)",0,100,40,1);
    var d=fxdemo(el,{
      build:function(ctx){
        var inp=ctx.createGain(), conv=ctx.createConvolver(), pd=ctx.createDelay(0.3),
            wet=ctx.createGain(), dry=ctx.createGain(), out=ctx.createGain();
        inp.connect(dry); dry.connect(out);
        inp.connect(pd); pd.connect(conv); conv.connect(wet); wet.connect(out);
        return {input:inp, output:out, conv:conv, pd:pd, wet:wet, dry:dry, lastIR:"", dispose:function(){}};
      },
      apply:function(n){
        var key=decay.input.value+"/"+damp.input.value;
        if(n.lastIR!==key){ n.conv.buffer=mkIR(ac(), +decay.input.value, +damp.input.value); n.lastIR=key; }
        n.pd.delayTime.value=+pre.input.value/1000;
        var m=+mix.input.value/100; n.wet.gain.value=m*1.4; n.dry.gain.value=1-m*0.3;
      }
    });
    var cv=screen(el,140), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData, function(ctx,w,h){
      // 減衰カーブ
      var x0=10,y0=14,pw=w*0.3,ph=h-30, dec=+decay.input.value;
      ctx.strokeStyle=C("--line"); ctx.strokeRect(x0,y0,pw,ph);
      ctx.strokeStyle=C("--blue"); ctx.lineWidth=2; ctx.beginPath();
      for(var i=0;i<=60;i++){ var u=i/60, v=Math.exp(-u*6/(dec/2));
        var y=y0+ph-v*ph*0.9; i?ctx.lineTo(x0+u*pw,y):ctx.moveTo(x0+u*pw,y); } ctx.stroke();
      lab(ctx,"残響の減衰（"+dec+" s）",x0+4,y0+12,C("--faint"),"left",8.5);
    }));
    function upd(){ decay.val.textContent=decay.input.value+" s"; pre.val.textContent=pre.input.value+" ms";
      damp.val.textContent=damp.input.value; mix.val.textContent=mix.input.value+" %"; d.refresh();
      out.innerHTML=(+pre.input.value<15?"<b style='color:var(--alias)'>Pre-delay 0 付近:</b> 残響が原音に貼り付き輪郭がぼやける。40 ms 前後空けてみる":
        "<b class='ok'>Pre-delay "+pre.input.value+" ms:</b> 原音の輪郭が残ってから残響が来る")+
        "。指数減衰するノイズを IR にした簡易コンボリューション（17 章）。実機のアルゴリズム式はコム + オールパス + ローパスの網で同じ形を作る";
    }
    [decay,pre,damp,mix].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 18. weird — 飛び道具 ============ */
  REG.weird=function(el){
    head(el,"DEMO","飛び道具を鳴らす（リングモジュレータ / ビットクラッシャー）");
    var row=ctrls(el);
    var kind=select(row,"エフェクト",["リングモジュレータ（掛け算）","ビットクラッシャー（量子化）"]);
    var carrier=slider(row,"キャリア周波数 (Hz)",30,1200,440,10);
    var bits=slider(row,"ビット数",2,12,5,1);
    var mix=slider(row,"Mix (%)",0,100,100,1);
    var d=fxdemo(el,{
      build:function(ctx){
        var inp=ctx.createGain(), dry=ctx.createGain(), wet=ctx.createGain(), out=ctx.createGain();
        // ring: gain の gain 入力に発振器（AM）
        var ring=ctx.createGain(), osc=ctx.createOscillator();
        ring.gain.value=0; osc.connect(ring.gain); osc.start();
        // crush: 階段カーブ
        var crush=ctx.createWaveShaper();
        inp.connect(dry); dry.connect(out); wet.connect(out);
        return {input:inp, output:out, dry:dry, wet:wet, ring:ring, osc:osc, crush:crush, wired:-1,
          dispose:function(){ try{osc.stop();}catch(e){} }};
      },
      apply:function(n){
        var k=+kind.value;
        if(n.wired!==k){
          try{ n.input.disconnect(n.ring); }catch(e){}
          try{ n.input.disconnect(n.crush); }catch(e){}
          try{ n.ring.disconnect(); }catch(e){}
          try{ n.crush.disconnect(); }catch(e){}
          if(k===0){ n.input.connect(n.ring); n.ring.connect(n.wet); }
          else { n.input.connect(n.crush); n.crush.connect(n.wet); }
          n.wired=k;
        }
        n.osc.frequency.value=+carrier.input.value;
        var b=+bits.input.value, steps=Math.pow(2,b), nn=2048, c=new Float32Array(nn);
        for(var i=0;i<nn;i++){ var x=i/(nn-1)*2-1; c[i]=Math.round(x*steps/2)/(steps/2); }
        n.crush.curve=c;
        var m=+mix.input.value/100; n.wet.gain.value=m; n.dry.gain.value=1-m;
      }
    });
    var cv=screen(el,130), cc=cctx(cv), out=readout(el);
    anim(el, drawScope(cc, d.scopeData));
    function upd(){ carrier.val.textContent=carrier.input.value+" Hz"; bits.val.textContent=bits.input.value+" bit"; mix.val.textContent=mix.input.value+" %"; d.refresh();
      out.innerHTML=+kind.value===0?
        "出力 = 入力 × sin("+carrier.input.value+" Hz)。<b>和と差の周波数だけが残り、元の音程が消える</b>（18 章）。キャリアを曲のキーの音（A=110/220/440）に合わせると調性の内側に入る。Mix を下げて原音と混ぜるのも手":
        bits.input.value+" bit = "+Math.pow(2,+bits.input.value)+" 段階の階段に量子化。<b>ザラつき（量子化ノイズ）</b>がチップチューンの質感。原音と並列（Mix 50 %）にすると芯を残してザラつきだけ足せる";
    }
    kind.addEventListener("change",upd);
    [carrier,bits,mix].forEach(function(s){s.input.addEventListener("input",upd);}); upd();
  };

  /* ============ 19. wiring — 接続 ============ */
  REG.wiring=function(el){
    head(el,"DEMO","接続を設計する — ケーブル長・バッファ・ループ");
    var row=ctrls(el);
    var cable=slider(row,"バッファ前のケーブル総延長 (m)",1,15,6,1);
    var buff=checkbox(row,"チェーンにバッファを入れる（またはバッファードバイパス機）",false);
    var fuzz=checkbox(row,"ファズ/ヴィンテージワウを使う",true);
    var amp=select(row,"アンプの歪み",["ペダルで歪ませる（アンプはクリーン）","アンプで歪ませる（エフェクトループあり）"]);
    var pn=panel(el), out=readout(el);
    function upd(){
      cable.val.textContent=cable.input.value+" m";
      var L=+cable.input.value, hasBuf=buff.checked, hasFuzz=fuzz.checked, loop=+amp.value===1;
      // treble loss estimate: fc = 1/(2π·250k·(100pF/m·L))
      var fc=Math.round(1/(2*Math.PI*250e3*100e-12*L)/100)*100;
      var chain=["ギター"];
      if(hasFuzz) chain.push("ファズ/ワウ（直結側）");
      if(hasBuf) chain.push("バッファ");
      chain.push("コンプ・歪み系");
      if(loop){ chain.push("アンプ input（プリで歪む）"); chain.push("— Send →"); chain.push("モジュレーション・ディレイ・リバーブ"); chain.push("— Return → パワー部"); }
      else { chain.push("モジュレーション"); chain.push("ディレイ・リバーブ"); chain.push("アンプ（クリーン）"); }
      pn.innerHTML='<div style="color:var(--signal);font-weight:600;margin-bottom:.3rem">推奨チェーン</div>'+
        '<div style="line-height:1.9">'+chain.map(function(c2,i){return '<span style="border:1px solid var(--line);border-radius:7px;padding:.15rem .5rem;background:var(--panel);white-space:nowrap;display:inline-block;margin:.12rem 0">'+c2+'</span>'+(i<chain.length-1?' <span style="color:var(--faint)">→</span> ':'');}).join("")+'</div>';
      out.innerHTML=(hasBuf?'<b class="ok">バッファあり:</b> それ以降はケーブルを引き回しても高域が落ちない':
        '<b style="color:var(--alias)">バッファなし:</b> ハイインピーダンスのまま '+L+' m → カットオフ目安 '+(fc/1000).toFixed(1)+' kHz あたりから高域が落ちる（RC フィルタ、19 章）')+
        (hasFuzz?'。<br>ファズ/ワウは<b>バッファより前・ギター直結側</b>に（相互作用が動作条件。5 章）':'')+
        (loop?'。<br>空間系は<b>エフェクトループ</b>へ——アンプの歪みの後ろに置けて 1 章の定石が守れる':'');
    }
    cable.input.addEventListener("input",upd);
    [buff,fuzz].forEach(function(c2){c2.addEventListener("change",upd);});
    amp.addEventListener("change",upd); upd();
  };

  /* ============ 20. recipes ============ */
  REG.recipes=function(el){
    head(el,"DEMO","レシピをつまみに翻訳する");
    var row=ctrls(el);
    var R=[
      ["60s サーフ",["スプリングリバーブ: Mix 高め・Dwell 深め","トレモロ: 正弦波・Rate=テンポの 8 分・Depth 深め","クリーン + シングルコイル"],"リバーブ→トレモロの順なら残響ごと揺れるヴィンテージ流",[["Reverb Mix",0.75],["Trem Rate",0.5],["Trem Depth",0.7]]],
      ["70s ファンク",["コンプ: アタック 20-30ms・レシオ 4:1・リリース速め","エンベロープフィルタ: Sensitivity を自分のピッキングに","右手のミュートが 9 割"],"「パコッ」を残すアタック遅めが肝（6 章）",[["Comp Attack",0.3],["Comp Ratio",0.25],["Filter Sens",0.6]]],
      ["80s クリーンアルペジオ",["コンプ: 浅く","コーラス: Rate 0.4-0.8Hz・Depth 深め・ステレオ","ディレイ: 8 分・Mix 15 %","プレートリバーブ: Pre-delay 40ms"],"コンプ→コーラス→ディレイ→リバーブの定石順（1 章）",[["Chorus Rate",0.2],["Chorus Depth",0.7],["Delay Mix",0.15]]],
      ["ブルースクランチ",["TS 系 OD: Gain 9-10 時・Level 高め","アンプ: クランチ境界に","リバーブ: スプリング浅め"],"手元のボリュームとタッチで歪みを操作できる点に合わせる（4 章）",[["OD Gain",0.35],["OD Level",0.7],["Reverb",0.2]]],
      ["U2 系ディレイ",["ディレイ: タップ + 付点 8 分・FB 4-5 回・繰り返し暗め","2 台目: 4 分でうっすら","コンプ浅め"],"8 分を淡々と弾き、16 分は繰り返しに任せる（16 章）",[["Delay Time",0.375],["Feedback",0.55],["Tone",0.3]]],
      ["シューゲイザー",["Big Muff 全開","リバーブをファズの前後 両方に","ピッチ揺れ（アーム/ビブラート）"],"残響ごと潰す定石破り（5 章）。轟音の壁は濁りが本体",[["Fuzz",1.0],["Reverb(前)",0.6],["Reverb(後)",0.5]]],
      ["メタル刻み",["TS: Gain 0・Level 高め（ブースト）","ハイゲインアンプ/DS","ゲート: 閾値高め・リリース最速"],"TS ブーストで低域を整理して締める（4 章）。深さはアンプで",[["TS Gain",0.05],["TS Level",0.8],["Gate Thresh",0.7]]],
      ["アンビエント",["スウェル（アタック消し）","モジュレーテッドディレイ: 2 拍・FB 多め","シマーリバーブ: Decay 長め"],"ギターであることを忘れさせたら成功（18 章）",[["Delay FB",0.7],["Shimmer Mix",0.6],["Decay",0.9]]]
    ];
    var sel=select(row,"欲しい音",R.map(function(r){return r[0];}));
    var cv=screen(el,150), cc=cctx(cv), pn=panel(el), out=readout(el);
    function draw(){
      var dd=cc.fit(),ctx=cc.ctx,w=dd.w,h=dd.h;ctx.clearRect(0,0,w,h);
      var knobs=R[+sel.value][3];
      var n=knobs.length, r2=Math.min(34,(h-56)/2);
      knobs.forEach(function(k2,i){
        var cx2=w*(i+0.5)/n, cy2=h/2-8;
        ctx.strokeStyle=C("--ink"); ctx.lineWidth=1.6;
        ctx.beginPath(); ctx.arc(cx2,cy2,r2,0,Math.PI*2); ctx.stroke();
        var a=Math.PI*0.75+k2[1]*Math.PI*1.5;
        ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(cx2,cy2);
        ctx.lineTo(cx2+r2*0.7*Math.cos(a), cy2+r2*0.7*Math.sin(a)); ctx.stroke();
        lab(ctx,k2[0],cx2,cy2+r2+16,C("--muted"),"center",10);
      });
    }
    anim(el,draw); reg(cv,draw);
    function upd(){
      var r=R[+sel.value];
      pn.innerHTML='<div style="color:var(--signal);font-weight:600;margin-bottom:.3rem">'+r[0]+'</div>'+
        '<ol style="margin:0;padding-left:1.4rem;line-height:1.7">'+r[1].map(function(s2){return '<li>'+s2+'</li>';}).join("")+'</ol>';
      out.innerHTML='<b>勘どころ:</b> '+r[2]+'。レシピは出発点——「何が好きか」→「担当する章」→「1 ツマミずつ」（20 章）';
      draw();
    }
    sel.addEventListener("change",upd); upd();
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
