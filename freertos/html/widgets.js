/* FreeRTOS — 章内インタラクティブ部品 */
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

  /* ---------- 共有: 固定優先度プリエンプティブの簡易シミュレータ ---------- */
  /* tasks: [{name,prio,period,exec,offset}]  prio 大 = 高優先度 */
  function simulate(tasks,T,opt){
    opt=opt||{};
    var slice=opt.slice||0;              /* >0 ならタイムスライス長 */
    var dt=opt.dt||0.05;
    var st=tasks.map(function(t,i){
      return {i:i,rem:0,rel:-1,ready:false,done:[],sliceLeft:slice};
    });
    var segs=[],cur=-1,segStart=0,rr={};
    for(var t=0;t<T+1e-9;t+=dt){
      /* 起動 */
      tasks.forEach(function(tk,i){
        var off=tk.offset||0;
        if(t+1e-9>=off && Math.abs(((t-off)/tk.period)-Math.round((t-off)/tk.period))<dt/2
           && (t-off)>=-1e-9){
          var k=Math.round((t-off)/tk.period);
          if(st[i].rel!==k){st[i].rel=k;st[i].rem+=tk.exec;st[i].relT=t;st[i].ready=true;}
        }
      });
      /* 選択: 最高優先度で残作業のあるもの */
      var pick=-1,bp=-1;
      st.forEach(function(s,i){
        if(s.rem>1e-9){ if(tasks[i].prio>bp){bp=tasks[i].prio;pick=i;} }
      });
      /* 同一優先度のラウンドロビン（タイムスライス） */
      if(slice>0&&pick>=0){
        var same=[];st.forEach(function(s,i){if(s.rem>1e-9&&tasks[i].prio===bp)same.push(i);});
        if(same.length>1){
          if(rr[bp]===undefined)rr[bp]=same[0];
          if(same.indexOf(rr[bp])<0)rr[bp]=same[0];
          pick=rr[bp];
        }
      }
      if(pick!==cur){
        if(cur>=0&&t>segStart)segs.push({a:segStart,b:t,i:cur});
        cur=pick;segStart=t;
      }
      if(pick>=0){
        st[pick].rem-=dt;
        if(slice>0){
          st[pick].sliceLeft-=dt;
          if(st[pick].sliceLeft<=1e-9){
            st[pick].sliceLeft=slice;
            var s2=[];st.forEach(function(s,i){if(s.rem>1e-9&&tasks[i].prio===bp)s2.push(i);});
            if(s2.length>1){var k2=s2.indexOf(pick);rr[bp]=s2[(k2+1)%s2.length];}
          }
        }
        if(st[pick].rem<=1e-9){
          st[pick].rem=0;
          st[pick].done.push({rel:st[pick].relT,fin:t+dt});
        }
      }
    }
    if(cur>=0&&T>segStart)segs.push({a:segStart,b:T,i:cur});
    return {segs:segs,st:st};
  }
  var TCOL=["--signal","--alias","--blue","--muted","--faint"];
  function tcol(i){return C(TCOL[i%TCOL.length]);}
  function gantt(cc,tasks,segs,T,opt){
    opt=opt||{};
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
    var padL=opt.padL||78,padR=14,padT=opt.padT||14,padB=22;
    var n=tasks.length,rowH=Math.min(26,(h-padT-padB)/Math.max(n,1));
    var X=function(x){return padL+x/T*(w-padL-padR);};
    tasks.forEach(function(tk,i){
      var y=padT+i*rowH;
      ctx.fillStyle=C("--screen");ctx.fillRect(padL,y+2,w-padL-padR,rowH-5);
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;ctx.strokeRect(padL,y+2,w-padL-padR,rowH-5);
      lab(ctx,tk.name,padL-6,y+rowH/2+4,C("--muted"),"right",10.5);
    });
    segs.forEach(function(s){
      var y=padT+s.i*rowH;
      ctx.fillStyle=tcol(s.i);
      ctx.fillRect(X(s.a),y+2,Math.max(1.2,X(s.b)-X(s.a)),rowH-5);
    });
    /* 起動マーカー */
    if(opt.releases!==false){
      tasks.forEach(function(tk,i){
        var y=padT+i*rowH;
        for(var t=(tk.offset||0);t<=T+1e-9;t+=tk.period){
          ctx.strokeStyle=tcol(i);ctx.lineWidth=1.4;
          ctx.beginPath();ctx.moveTo(X(t),y+rowH-3);ctx.lineTo(X(t),y+1);ctx.stroke();
          ctx.beginPath();ctx.moveTo(X(t),y+1);ctx.lineTo(X(t)-3,y+6);ctx.lineTo(X(t)+3,y+6);
          ctx.closePath();ctx.fillStyle=tcol(i);ctx.fill();
        }
      });
    }
    ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(padL,padT+n*rowH+2);ctx.lineTo(w-padR,padT+n*rowH+2);ctx.stroke();
    lab(ctx,"0",padL,padT+n*rowH+16,C("--muted"),"left",10);
    lab(ctx,T+" ms",w-padR,padT+n*rowH+16,C("--muted"),"right",10);
    return {X:X,padL:padL,padT:padT,rowH:rowH,ctx:ctx,w:w,h:h};
  }

  /* ---------- 01: スーパーループの応答時間 ---------- */
  REG.superloop=function(el){
    head(el,"Super Loop","1 周の長さが、全部の応答時間になる");
    var cv=screen(el,165),cc=cctx(cv);
    var row=ctrls(el);
    var s1=slider(row,"センサ読み（ms）",1,40,3,1);
    var s2=slider(row,"画面描画（ms）",1,80,50,1);
    var s3=slider(row,"ボタン処理（ms）",1,20,2,1);
    var s4=slider(row,"通信送信（ms）",1,40,5,1);
    var out=readout(el);
    function draw(){
      var v=[+s1.input.value,+s2.input.value,+s3.input.value,+s4.input.value];
      s1.val.textContent=v[0]+" ms";s2.val.textContent=v[1]+" ms";
      s3.val.textContent=v[2]+" ms";s4.val.textContent=v[3]+" ms";
      var names=["read_sensor()","update_display()","handle_buttons()","send_uart()"];
      var loop=v[0]+v[1]+v[2]+v[3];
      var T=Math.ceil(loop*2.2);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=14,padR=14,padT=52,barH=34;
      var X=function(x){return padL+x/T*(w-padL-padR);};
      lab(ctx,"CPU の実行（1 本しかない）",padL,16,C("--muted"),"left",11);
      var t=0,k=0;
      while(t<T){
        for(var i=0;i<4;i++){
          var a=t,b=Math.min(T,t+v[i]);
          if(a<T){
            ctx.fillStyle=tcol(i);ctx.fillRect(X(a),padT,Math.max(1,X(b)-X(a)),barH);
            if(X(b)-X(a)>46)lab(ctx,names[i].replace("()",""),X(a)+4,padT+barH/2+4,"#fff","left",9.5);
          }
          t+=v[i];
        }
        k++;
        if(k>40)break;
      }
      /* ボタン押下と、実際に処理されるまで */
      var press=v[0]+1;                       /* update_display に入った直後 */
      var served=v[0]+v[1]+v[2];              /* handle_buttons が終わる時刻 */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(X(press),padT-14);ctx.lineTo(X(press),padT+barH+18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(X(served),padT-14);ctx.lineTo(X(served),padT+barH+18);ctx.stroke();
      ctx.setLineDash([]);
      var ya=padT+barH+30;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(X(press),ya);ctx.lineTo(X(served),ya);ctx.stroke();
      lab(ctx,"ボタンを押した",X(press),padT-20,C("--alias"),"left",10);
      lab(ctx,"待たされる "+(served-press).toFixed(0)+" ms",(X(press)+X(served))/2,ya-6,C("--alias"),"center",10.5);
      var worst=loop-v[2];
      out.innerHTML='ループ 1 周 = <b>'+loop+' ms</b>（'+v.join(" + ")+'）'+
        ' ／ ボタンの<b>最悪応答時間 ≈ '+worst+' ms</b>（押した直後に他の処理が全部入る場合）'+
        ' ／ <span class="'+(worst>50?"warn":"ok")+'">'+
        (worst>50?'画面描画を軽くしないとボタンが「効かない」と感じられる':'この程度なら体感上は問題にならない')+'</span>'+
        ' ／ <b class="warn">画面描画とボタンには論理的な関係がないのに、時間だけが結合している</b>';
    }
    [s1,s2,s3,s4].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 02: 並行と並列 ---------- */
  REG.concurrency=function(el){
    head(el,"Concurrency","切り替えが速ければ「同時」に見える");
    var cv=screen(el,182),cc=cctx(cv);
    var row=ctrls(el);
    var sq=slider(row,"切り替え周期（ms）",1,200,10,1);
    var sn=slider(row,"タスク数",2,5,3,1);
    var out=readout(el);
    function draw(){
      var q=+sq.input.value,n=+sn.input.value;
      sq.val.textContent=q+" ms";sn.val.textContent=n;
      var T=600;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=96,padR=14;
      var X=function(x){return padL+x/T*(w-padL-padR);};
      lab(ctx,"実際の CPU（1 本）",padL,16,C("--muted"),"left",11);
      var yc=26,hc=22;
      ctx.fillStyle=C("--screen");ctx.fillRect(padL,yc,w-padL-padR,hc);
      for(var t=0,k=0;t<T;t+=q,k++){
        var i=k%n;
        ctx.fillStyle=tcol(i);
        ctx.fillRect(X(t),yc,Math.max(0.7,X(Math.min(T,t+q))-X(t)),hc);
      }
      lab(ctx,"CPU",padL-6,yc+hc/2+4,C("--muted"),"right",10.5);
      lab(ctx,"プログラマから見える世界",padL,yc+hc+26,C("--muted"),"left",11);
      var y0=yc+hc+34,rh=Math.min(24,(h-y0-14)/n);
      for(i=0;i<n;i++){
        var y=y0+i*rh;
        ctx.fillStyle=C("--screen");ctx.fillRect(padL,y+2,w-padL-padR,rh-5);
        ctx.fillStyle=tcol(i);ctx.globalAlpha=.35;
        ctx.fillRect(padL,y+2,w-padL-padR,rh-5);ctx.globalAlpha=1;
        lab(ctx,"タスク "+String.fromCharCode(65+i),padL-6,y+rh/2+4,C("--muted"),"right",10.5);
      }
      var visible=q>=40;
      out.innerHTML='切り替え周期 <b>'+q+' ms</b> ／ タスク '+n+' 個'+
        ' ／ 各タスクが CPU を得る割合 = <b>'+(100/n).toFixed(0)+'%</b>'+
        ' ／ 同じ処理にかかる時間は <b>'+n+' 倍</b>になる'+
        ' ／ '+(visible?'<span class="warn">切り替えが遅いので、動きがカクついて見える（1 つずつ順に動いているのが分かる）</span>'
                      :'<span class="ok">切り替えが十分に速いので、同時に動いているように見える</span>')+
        ' ／ <b class="warn">ただし「同時に見える」だけで、共有変数の問題はこの状態でも起きる</b>';
    }
    [sq,sn].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 02: タスク分割の効果 ---------- */
  REG.tasksplit=function(el){
    head(el,"Split into Tasks","優先度を付けると、応答が実行時間から切り離される");
    var cv=screen(el,178),cc=cctx(cv);
    var row=ctrls(el);
    var sd=slider(row,"画面描画の実行時間（ms）",5,90,50,5);
    var sp=slider(row,"ボタンの処理時間（ms）",1,10,2,1);
    var out=readout(el);
    function draw(){
      var dms=+sd.input.value,pms=+sp.input.value;
      sd.val.textContent=dms+" ms";sp.val.textContent=pms+" ms";
      var T=2*dms+pms+8;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=110,padR=14;
      var X=function(x){return padL+x/T*(w-padL-padR);};
      var press=Math.max(2,Math.round(dms*0.55));
      /* (a) スーパーループ */
      lab(ctx,"(a) スーパーループ",padL,15,C("--muted"),"left",11);
      var y=24,hh=24;
      ctx.fillStyle=C("--screen");ctx.fillRect(padL,y,w-padL-padR,hh);
      ctx.fillStyle=tcol(0);ctx.fillRect(X(0),y,X(dms)-X(0),hh);
      ctx.fillStyle=tcol(1);ctx.fillRect(X(dms),y,Math.max(1.5,X(dms+pms)-X(dms)),hh);
      ctx.fillStyle=tcol(0);ctx.fillRect(X(dms+pms),y,X(2*dms+pms)-X(dms+pms),hh);
      lab(ctx,"1 本の流れ",padL-6,y+hh/2+4,C("--muted"),"right",10.5);
      var respA=dms-press+pms;
      /* (b) タスク分割 */
      lab(ctx,"(b) タスク分割（ボタンを高優先度に）",padL,y+hh+24,C("--muted"),"left",11);
      var y2=y+hh+32;
      ["描画タスク（低）","ボタンタスク（高）"].forEach(function(nm,i){
        var yy=y2+i*24;
        ctx.fillStyle=C("--screen");ctx.fillRect(padL,yy,w-padL-padR,20);
        lab(ctx,nm,padL-6,yy+14,C("--muted"),"right",10.5);
      });
      /* 描画は press..press+pms で中断される */
      ctx.fillStyle=tcol(0);
      ctx.fillRect(X(0),y2,X(press)-X(0),20);
      ctx.fillRect(X(press+pms),y2,X(Math.min(T,dms+pms))-X(press+pms),20);
      ctx.fillStyle=tcol(1);
      ctx.fillRect(X(press),y2+24,Math.max(1.5,X(press+pms)-X(press)),20);
      /* 押下マーカー */
      [ [y,hh],[y2,44] ].forEach(function(g){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.moveTo(X(press),g[0]-4);ctx.lineTo(X(press),g[0]+g[1]+4);ctx.stroke();
        ctx.setLineDash([]);
      });
      lab(ctx,"押した",X(press)+4,y-6,C("--alias"),"left",10);
      out.innerHTML='(a) スーパーループのボタン応答 = <b class="warn">'+respA+' ms</b>'+
        '（描画の残り '+(dms-press)+' ms を待ってから '+pms+' ms）'+
        ' ／ (b) タスク分割のボタン応答 = <b class="ok">'+pms+' ms</b>（押した瞬間に描画を中断する）'+
        ' ／ <b>差は '+(respA-pms)+' ms</b>'+
        ' ／ <b class="warn">(b) では、描画がどれだけ重くなってもボタンの応答は変わらない</b>。これがプリエンプションの効果である';
    }
    [sd,sp].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 03: カーネルの地図 ---------- */
  REG.kernelmap=function(el){
    head(el,"Kernel Map","どこまでがカーネルで、どこからが移植層か");
    var LAYERS=[
      {n:"アプリケーション",f:"（あなたのコード）",c:"--faint",
       d:"タスク関数。カーネルの API を呼ぶ側。",ch:"—"},
      {n:"同期・通信",f:"queue.c / event_groups.c / stream_buffer.c",c:"--signal",
       d:"キュー・セマフォ・ミューテックス・イベントグループ・バッファ。全部 queue.c が土台。",ch:"11〜14"},
      {n:"時間",f:"timers.c / tasks.c",c:"--signal",
       d:"ソフトウェアタイマとティック管理。タイマは「タイマタスク」という普通のタスクで動く。",ch:"08, 15"},
      {n:"スケジューラ",f:"tasks.c　★カーネルの心臓",c:"--signal",
       d:"状態遷移・優先度判定・次タスクの選択。vTaskSwitchContext() がここ。",ch:"04〜09"},
      {n:"データ構造",f:"list.c（約 250 行）",c:"--blue",
       d:"番兵付き循環双方向リンクリスト。Ready リストも遅延リストも待ちキューも全部これ。",ch:"07"},
      {n:"メモリ",f:"heap_1.c 〜 heap_5.c",c:"--blue",
       d:"5 つの実装から 1 つ選ぶ。静的確保だけにすることもできる。",ch:"16"},
      {n:"移植層",f:"port.c / portmacro.h　★このシリーズでは扱わない",c:"--alias",
       d:"CPU 依存部。約束するのは 5 つだけ: ①切り替え ②ティック ③クリティカルセクション ④スタック初期化 ⑤最上位ビット。中身はアセンブラだが、契約さえ分かればカーネルは完全に読める。",ch:"—"},
      {n:"ハードウェア",f:"CPU・タイマ・割り込みコントローラ",c:"--faint",
       d:"扱わない。",ch:"—"}
    ];
    var wrap=mk("div","wscreen");wrap.style.padding=".7rem";el.appendChild(wrap);
    var out=readout(el);
    var sel=3;
    function render(){
      var h='<div style="display:flex;flex-direction:column;gap:.22rem">';
      LAYERS.forEach(function(L,i){
        var on=(i===sel);
        h+='<div data-i="'+i+'" style="cursor:pointer;padding:.36rem .6rem;border-radius:7px;'+
           'border:1px solid '+(on?C(L.c):"transparent")+';'+
           'background:'+(on?"var(--signal-soft)":"var(--panel)")+'">'+
           '<div style="display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap">'+
           '<b style="color:var('+L.c+')">'+esc(L.n)+'</b>'+
           '<span style="font-family:var(--mono);font-size:.72rem;color:var(--muted)">'+esc(L.f)+'</span>'+
           '</div></div>';
      });
      h+='</div>';
      wrap.innerHTML=h;
      wrap.querySelectorAll("[data-i]").forEach(function(d){
        d.addEventListener("click",function(){sel=+d.getAttribute("data-i");render();});
      });
      var L=LAYERS[sel];
      out.innerHTML='<b>'+esc(L.n)+'</b> — '+esc(L.d)+' ／ 章: <b>'+esc(L.ch)+'</b>';
    }
    reg(null,render);render();
  };

  /* ---------- 04: 状態機械 ---------- */
  REG.taskstate=function(el){
    head(el,"Task States","状態とは「どのリストに入っているか」");
    var cv=screen(el,230),cc=cctx(cv);
    var TR=[
      {k:"create",a:null,b:"Ready",l:"xTaskCreate",
       d:"TCB とスタックを確保し、Ready リストへ入れる。既に走っているタスクより優先度が高ければ、その場で切り替わる。"},
      {k:"run",a:"Ready",b:"Running",l:"スケジューラが選んだ",
       d:"pxReadyTasksLists[] の空でない最高優先度リストの先頭を取り、pxCurrentTCB に代入する。"},
      {k:"preempt",a:"Running",b:"Ready",l:"横取りされた／タイムスライス切れ",
       d:"Ready リストの末尾へ戻す。より高優先度のタスクが Ready になったか、同一優先度のタイムスライスが切れた。"},
      {k:"block",a:"Running",b:"Blocked",l:"待つ API を呼んだ",
       d:"Ready リストから外し、遅延リスト（起床時刻の昇順）へ入れる。イベント待ちならイベントリストにも同時に登録する。"},
      {k:"wake",a:"Blocked",b:"Ready",l:"条件成立／タイムアウト",
       d:"遅延リストとイベントリストの両方から外し、Ready リストへ入れる。片方だけ外すとリストが壊れる。"},
      {k:"susp",a:"Running",b:"Suspended",l:"vTaskSuspend",
       d:"いまいるリストから外し、xSuspendedTaskList へ。何があっても実行されなくなる。他タスクへの使用は避けるべき。"},
      {k:"resume",a:"Suspended",b:"Ready",l:"vTaskResume",
       d:"xSuspendedTaskList から外して Ready リストへ。3 回 Suspend しても 1 回の Resume で起きる（ネストしない）。"}
    ];
    var row=ctrls(el);
    var srow=mk("div","ctrl");srow.style.gridColumn="1/-1";
    srow.innerHTML='<label>遷移を選ぶ</label><div class="tr-btns" style="display:flex;flex-wrap:wrap;gap:.3rem"></div>';
    row.appendChild(srow);
    var btns=srow.querySelector(".tr-btns");
    var sel=3;
    TR.forEach(function(t,i){
      var b=mk("button","btn",t.l);b.style.fontSize=".72rem";
      b.addEventListener("click",function(){sel=i;draw();});
      btns.appendChild(b);
    });
    var out=readout(el);
    var POS={Ready:[0.24,0.30],Running:[0.72,0.30],Blocked:[0.72,0.76],Suspended:[0.24,0.76]};
    var LIST={Ready:"pxReadyTasksLists[prio]",Running:"pxCurrentTCB",
              Blocked:"pxDelayedTaskList (+ イベントリスト)",Suspended:"xSuspendedTaskList"};
    function draw(){
      Array.prototype.forEach.call(btns.children,function(b,i){
        b.style.background=(i===sel)?C("--signal"):"var(--panel)";
        b.style.color=(i===sel)?"#fff":"var(--muted)";
        b.style.borderColor=(i===sel)?C("--signal"):"var(--line)";
      });
      var t=TR[sel];
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var bw=Math.min(150,w*0.34),bh=40;
      function box(name){
        var p=POS[name],x=p[0]*w-bw/2,y=p[1]*h-bh/2;
        var act=(name===t.a||name===t.b);
        ctx.fillStyle=act?C("--signal"):C("--screen");
        rrect(ctx,x,y,bw,bh,9);ctx.fill();
        ctx.strokeStyle=act?C("--signal"):C("--line");ctx.lineWidth=1.4;
        rrect(ctx,x,y,bw,bh,9);ctx.stroke();
        lab(ctx,name,x+bw/2,y+bh/2-1,act?"#fff":C("--ink"),"center",12);
        lab(ctx,LIST[name],x+bw/2,y+bh+13,act?C("--signal"):C("--faint"),"center",8.6);
        return {x:x,y:y,w:bw,h:bh,cx:x+bw/2,cy:y+bh/2};
      }
      var B={};for(var k in POS)B[k]=box(k);
      if(t.a&&t.b){
        var A=B[t.a],Z=B[t.b];
        var dx=Z.cx-A.cx,dy=Z.cy-A.cy,L=Math.hypot(dx,dy);
        var ux=dx/L,uy=dy/L;
        var m=Math.min(bw/2+8,L/2-4);
        var x1=A.cx+ux*m,y1=A.cy+uy*(bh/2+8)*(Math.abs(uy)>Math.abs(ux)?1:0)+ (Math.abs(uy)>Math.abs(ux)?0:0);
        x1=A.cx+ux*(Math.abs(ux)>Math.abs(uy)?bw/2+6:m);
        y1=A.cy+uy*(Math.abs(uy)>=Math.abs(ux)?bh/2+6:m*0.3);
        var x2=Z.cx-ux*(Math.abs(ux)>Math.abs(uy)?bw/2+10:m);
        var y2=Z.cy-uy*(Math.abs(uy)>=Math.abs(ux)?bh/2+10:m*0.3);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        var ang=Math.atan2(y2-y1,x2-x1);
        ctx.fillStyle=C("--alias");ctx.beginPath();
        ctx.moveTo(x2,y2);
        ctx.lineTo(x2-9*Math.cos(ang-0.4),y2-9*Math.sin(ang-0.4));
        ctx.lineTo(x2-9*Math.cos(ang+0.4),y2-9*Math.sin(ang+0.4));
        ctx.closePath();ctx.fill();
        lab(ctx,t.l,(x1+x2)/2+(Math.abs(uy)>=Math.abs(ux)?46:0),(y1+y2)/2+(Math.abs(uy)>=Math.abs(ux)?4:-9),C("--alias"),"center",10.5);
      } else {
        var Z2=B[t.b];
        ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(Z2.x-42,Z2.cy);ctx.lineTo(Z2.x-8,Z2.cy);ctx.stroke();
        ctx.fillStyle=C("--alias");ctx.beginPath();
        ctx.moveTo(Z2.x-6,Z2.cy);ctx.lineTo(Z2.x-15,Z2.cy-5);ctx.lineTo(Z2.x-15,Z2.cy+5);
        ctx.closePath();ctx.fill();
        lab(ctx,t.l,Z2.x-46,Z2.cy-8,C("--alias"),"right",10.5);
      }
      out.innerHTML='<b>'+(t.a?esc(t.a)+" → ":"生成 → ")+esc(t.b)+'</b>（'+esc(t.l)+'）'+
        ' ／ '+esc(t.d)+
        ' ／ <b class="warn">Blocked → Running と Suspended → Running の直行はない</b>。必ず Ready を経由する';
    }
    reg(cv,draw);
  };

  /* ---------- 05: コンテキストスイッチのステップ実行 ---------- */
  REG.ctxswitch=function(el){
    head(el,"Context Switch","保存するのはスタックポインタ 1 個だけ");
    var STEPS=[
      {t:"0. タスク A が実行中",
       d:"CPU の SP はタスク A のスタックを指している。pxCurrentTCB は A の TCB。",
       sp:"A", cur:"A", pushed:false, restored:false},
      {t:"1. 現在のレジスタを、いまの SP のスタックに積む",
       d:"R4〜R11 などをタスク A のスタックに退避する。ハードウェアが自動で積む分（R0-R3, R12, LR, PC, xPSR）と、移植層が手で積む分がある。",
       sp:"A", cur:"A", pushed:true, restored:false},
      {t:"2. pxCurrentTCB->pxTopOfStack = SP",
       d:"★ここが「保存」の実体。積んだ後の SP の値を TCB の先頭フィールドに書く。これでタスク A の「実行の途中」は完全にメモリ上のデータになった。",
       sp:"A", cur:"A", pushed:true, restored:false, save:true},
      {t:"3. vTaskSwitchContext() を呼ぶ",
       d:"★カーネルの仕事はここだけ。Ready リストから最高優先度のタスクを選び、pxCurrentTCB に代入する。中身は taskSELECT_HIGHEST_PRIORITY_TASK() の 1 行。",
       sp:"A", cur:"B", pushed:true, restored:false, kernel:true},
      {t:"4. SP = pxCurrentTCB->pxTopOfStack",
       d:"新しい pxCurrentTCB（タスク B）の TCB から、保存されていたスタックポインタを読んで SP に入れる。この瞬間、スタックが B のものに切り替わる。",
       sp:"B", cur:"B", pushed:true, restored:false, load:true},
      {t:"5. スタックからレジスタを降ろす",
       d:"タスク B が前回止まったときに積んだレジスタを復元する。積んだのと逆順に降ろす。",
       sp:"B", cur:"B", pushed:false, restored:true},
      {t:"6. 復帰する（PC が復元される）",
       d:"★ここが最も面白い。復元されるレジスタには PC が含まれている。PC を書き換えた瞬間、実行がタスク B の続きに飛ぶ。入ったのは A のコンテキスト、出ていくのは B のコンテキスト。C 言語では書けないので、この部分だけアセンブラになる。",
       sp:"B", cur:"B", pushed:false, restored:false, done:true}
    ];
    var cv=screen(el,250),cc=cctx(cv);
    var row=ctrls(el);
    var ss=slider(row,"ステップ",0,6,0,1);
    var out=readout(el);
    function draw(){
      var k=+ss.input.value;var S=STEPS[k];
      ss.val.textContent=k+" / 6";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var colW=Math.min(150,(w-40)/3.4),gap=(w-colW*3)/4;
      function stack(x,name,active,pushed){
        var y=52,hh=h-78;
        ctx.fillStyle=C("--screen");rrect(ctx,x,y,colW,hh,8);ctx.fill();
        ctx.strokeStyle=active?C("--signal"):C("--line");ctx.lineWidth=active?2:1.2;
        rrect(ctx,x,y,colW,hh,8);ctx.stroke();
        lab(ctx,"タスク "+name+" のスタック",x+colW/2,y-7,active?C("--signal"):C("--muted"),"center",10.5);
        /* 中身 */
        var items=[];
        if(name==="A"&&pushed)items=["xPSR","PC","LR","R12","R3-R0","R11-R4"];
        else if(name==="A")items=["（実行中）","ローカル変数","戻りアドレス"];
        if(name==="B")items=["xPSR","PC","LR","R12","R3-R0","R11-R4"];
        var iy=y+hh-16;
        items.forEach(function(it,i){
          ctx.fillStyle=C("--panel");
          rrect(ctx,x+8,iy-16,colW-16,15,4);ctx.fill();
          lab(ctx,it,x+colW/2,iy-5,C("--muted"),"center",9.5);
          iy-=18;
        });
        return {x:x,y:y,w:colW,h:hh,top:iy+2};
      }
      var A=stack(gap,"A",S.sp==="A",S.pushed);
      var B=stack(gap*2+colW,"B",S.sp==="B",true);
      /* TCB 列 */
      var tx=gap*3+colW*2,ty=52;
      [["A",A],["B",B]].forEach(function(p,i){
        var yy=ty+i*76;
        var on=(S.cur===p[0]);
        ctx.fillStyle=on?C("--signal"):C("--screen");
        rrect(ctx,tx,yy,colW,62,8);ctx.fill();
        ctx.strokeStyle=on?C("--signal"):C("--line");ctx.lineWidth=1.4;
        rrect(ctx,tx,yy,colW,62,8);ctx.stroke();
        lab(ctx,"TCB "+p[0],tx+8,yy+16,on?"#fff":C("--muted"),"left",10.5);
        var stored=(p[0]==="A")?(k>=3?"保存済み":"（古い値）"):"保存済み";
        lab(ctx,"pxTopOfStack",tx+8,yy+34,on?"rgba(255,255,255,.85)":C("--faint"),"left",9);
        lab(ctx,stored,tx+8,yy+50,on?"#fff":C("--muted"),"left",9.5);
      });
      lab(ctx,"pxCurrentTCB →",tx-4,ty+(S.cur==="A"?30:106),C("--alias"),"right",10.5);
      /* SP 矢印 */
      var sp=(S.sp==="A")?A:B;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(sp.x-26,sp.top);ctx.lineTo(sp.x-4,sp.top);ctx.stroke();
      ctx.fillStyle=C("--alias");ctx.beginPath();
      ctx.moveTo(sp.x-2,sp.top);ctx.lineTo(sp.x-11,sp.top-4);ctx.lineTo(sp.x-11,sp.top+4);
      ctx.closePath();ctx.fill();
      lab(ctx,"SP",sp.x-30,sp.top+4,C("--alias"),"right",10.5);
      lab(ctx,S.t,gap,18,C("--ink"),"left",12);
      out.innerHTML=esc(S.d)+
        (S.kernel?' ／ <b class="ok">カーネルがやるのはこのステップだけ。残りは全部移植層</b>':'')+
        (S.done?' ／ <b class="warn">スタックの中身は一度も移動していない。動いたのは SP という 1 個の値だけである</b>':'');
    }
    ss.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 05: 切り替えコスト ---------- */
  REG.swcost=function(el){
    head(el,"Switch Overhead","1 % を超えたら設計を疑う");
    var cv=screen(el,200),cc=cctx(cv);
    var row=ctrls(el);
    var scpu=select(row,"CPU",["Cortex-M0+ @48MHz（約 4 µs）","Cortex-M4 @168MHz（約 1.5 µs）",
                               "Cortex-M4F @168MHz・FPU 使用（約 3.5 µs）","RISC-V RV32 @100MHz（約 3 µs）"]);
    var COST=[4.0,1.5,3.5,3.0];
    var st=slider(row,"ティック周期（µs）",100,10000,1000,100);
    var sn=slider(row,"1 ティックあたりの切り替え回数",1,60,4,1);
    var out=readout(el);
    function draw(){
      var c=COST[+scpu.value],T=+st.input.value,n=+sn.input.value;
      st.val.textContent=(T/1000).toFixed(1)+" ms";sn.val.textContent=n+" 回";
      var eta=n*c/T*100;
      var d=cc.fit(),w=d.w,h=d.h;
      var ymax=Math.max(2,60*c/T*100*1.06);
      var ch=chart(cc,1,60,0,ymax,{l:52,r:16,t:26,b:36});
      grid(ch,4);
      var pts=[];for(var i=1;i<=60;i++)pts.push([i,i*c/T*100]);
      line(ch,pts,C("--signal"),2.4);
      /* 1% ライン */
      if(ch.y1>1){
        ch.ctx.strokeStyle=C("--faint");ch.ctx.setLineDash([5,4]);ch.ctx.lineWidth=1.2;
        ch.ctx.beginPath();ch.ctx.moveTo(ch.p.l,ch.Y(1));ch.ctx.lineTo(ch.w-ch.p.r,ch.Y(1));
        ch.ctx.stroke();ch.ctx.setLineDash([]);
        lab(ch.ctx,"1%",ch.w-ch.p.r-4,ch.Y(1)-5,C("--faint"),"right",10);
      }
      dot(ch,n,eta,5,C("--alias"));
      axis(ch);
      lab(ch.ctx,"オーバーヘッド（%）",ch.p.l+2,14,C("--muted"),"left",10.5);
      lab(ch.ctx,"1 ティックあたりの切り替え回数",ch.w-ch.p.r,14,C("--muted"),"right",10.5);
      lab(ch.ctx,"1",ch.p.l,ch.h-ch.p.b+17,C("--muted"),"left",10);
      lab(ch.ctx,"60 回",ch.w-ch.p.r,ch.h-ch.p.b+17,C("--muted"),"right",10);
      lab(ch.ctx,f(ch.y1,1)+"%",ch.p.l-6,ch.p.t+4,C("--muted"),"right",10);
      lab(ch.ctx,"0%",ch.p.l-6,ch.h-ch.p.b+4,C("--muted"),"right",10);
      out.innerHTML='オーバーヘッド = '+n+' × '+f(c,1)+' µs / '+T+' µs = <b class="'+(eta<1?"ok":(eta<5?"":"warn"))+'">'+
        f(eta,2)+' %</b>'+
        ' ／ 1 秒あたり <b>'+Math.round(1e6/T*n)+' 回</b>の切り替え'+
        ' ／ '+(eta<1?'<span class="ok">まず問題にならない水準</span>'
              :(eta<5?'許容範囲だが、ティック周期を延ばすか切り替え回数を減らす余地がある'
                     :'<span class="warn">切り替えだけで CPU を消費しすぎている。ビジーウェイトか、細かすぎるタスク分割を疑うこと</span>'))+
        ' ／ <b>FPU を使うタスクは退避量が 2 倍以上になる</b>。割り込みハンドラの中で float を使わないこと';
    }
    scpu.addEventListener("change",draw);
    [st,sn].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 06: スケジューリングのガントチャート ---------- */
  REG.sched=function(el){
    head(el,"Fixed-Priority Preemptive","実行可能な最高優先度が、必ず走っている");
    var cv=screen(el,152),cc=cctx(cv);
    var row=ctrls(el);
    var pA=slider(row,"A の優先度",1,5,4,1);
    var eA=slider(row,"A の実行時間（ms）",1,10,2,1);
    var tA=slider(row,"A の周期（ms）",4,40,10,1);
    var row2=ctrls(el);
    var pB=slider(row2,"B の優先度",1,5,3,1);
    var eB=slider(row2,"B の実行時間（ms）",1,15,4,1);
    var tB=slider(row2,"B の周期（ms）",6,60,20,1);
    var out=readout(el);
    function draw(){
      var T=60;
      var tasks=[
        {name:"A（高）",prio:+pA.input.value,period:+tA.input.value,exec:+eA.input.value,offset:0},
        {name:"B（中）",prio:+pB.input.value,period:+tB.input.value,exec:+eB.input.value,offset:0},
        {name:"IDLE",prio:0,period:T*2,exec:T*2,offset:0}
      ];
      pA.val.textContent=tasks[0].prio;eA.val.textContent=tasks[0].exec+" ms";tA.val.textContent=tasks[0].period+" ms";
      pB.val.textContent=tasks[1].prio;eB.val.textContent=tasks[1].exec+" ms";tB.val.textContent=tasks[1].period+" ms";
      tasks[0].name="A（優先度 "+tasks[0].prio+"）";
      tasks[1].name="B（優先度 "+tasks[1].prio+"）";
      var r=simulate(tasks,T,{dt:0.05});
      gantt(cc,tasks,r.segs,T,{padL:104});
      var U=tasks[0].exec/tasks[0].period+tasks[1].exec/tasks[1].period;
      function worst(i){var mx=0;r.st[i].done.forEach(function(j){mx=Math.max(mx,j.fin-j.rel);});return mx;}
      var wA=worst(0),wB=worst(1);
      var okA=wA<=tasks[0].period+1e-6,okB=wB<=tasks[1].period+1e-6;
      var rm=(tasks[0].period<tasks[1].period)===(tasks[0].prio>tasks[1].prio);
      out.innerHTML='CPU 利用率 <b>'+f(U*100,1)+' %</b>'+
        ' ／ A の最悪応答 <b class="'+(okA?"ok":"warn")+'">'+f(wA,1)+' ms</b>（期限 '+tasks[0].period+' ms）'+
        ' ／ B の最悪応答 <b class="'+(okB?"ok":"warn")+'">'+f(wB,1)+' ms</b>（期限 '+tasks[1].period+' ms）'+
        ' ／ '+(rm?'<span class="ok">レートモノトニック（周期の短い方が高優先度）に従っている</span>'
                 :'<span class="warn">レートモノトニックに反している。周期の短いタスクを高優先度にすること（20 章）</span>')+
        (okA&&okB?'':' ／ <span class="warn">期限を守れていないタスクがある</span>');
    }
    [pA,eA,tA,pB,eB,tB].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 07: リストの操作 ---------- */
  REG.listops=function(el){
    head(el,"list.c","番兵付き循環双方向リンクリスト");
    var cv=screen(el,152),cc=cctx(cv);
    var row=ctrls(el);
    var smode=select(row,"リストの種類",
      ["Ready リスト（ソートしない・vListInsertEnd）","遅延リスト（xItemValue 昇順・vListInsert）"]);
    var out2=panel(el);
    var row2=ctrls(el);
    var bAdd=button(row2,"項目を追加");
    var bDel=button(row2,"先頭を削除");
    var bNext=button(row2,"カーソルを 1 つ進める（ラウンドロビン）");
    var bRst=button(row2,"リセット");
    var out=readout(el);
    var items=[],idx=-1,nextId=1,lastOp="初期状態";
    function reset(){items=[{id:"A",v:5},{id:"B",v:12},{id:"C",v:30}];idx=-1;nextId=4;lastOp="初期状態";}
    reset();
    function sorted(){return +smode.value===1;}
    function draw(){
      if(sorted())items.sort(function(a,b){return a.v-b.v;});
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var seq=[{id:"xListEnd",v:"MAX",sent:true}].concat(items);
      var n=seq.length;
      var bw=Math.min(112,(w-30)/n-10),gap=(w-30-bw*n)/Math.max(n-1,1);
      var y=54,bh=48;
      lab(ctx,"pxIndex（カーソル）は 1 つだけ。ラウンドロビンはこれを進めるだけで実現する",14,20,C("--muted"),"left",10.5);
      seq.forEach(function(it,i){
        var x=15+i*(bw+gap);
        var isCur=(!it.sent&&items.indexOf(it)===idx);
        ctx.fillStyle=it.sent?C("--screen"):(isCur?C("--signal"):C("--panel"));
        rrect(ctx,x,y,bw,bh,7);ctx.fill();
        ctx.strokeStyle=it.sent?C("--faint"):(isCur?C("--signal"):C("--line"));
        ctx.lineWidth=it.sent?1.6:1.3;
        if(it.sent)ctx.setLineDash([4,3]);
        rrect(ctx,x,y,bw,bh,7);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,it.id,x+bw/2,y+19,it.sent?C("--faint"):(isCur?"#fff":C("--ink")),"center",11);
        lab(ctx,"value="+it.v,x+bw/2,y+36,it.sent?C("--faint"):(isCur?"rgba(255,255,255,.9)":C("--muted")),"center",9.5);
        if(i<n-1){
          ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;
          ctx.beginPath();ctx.moveTo(x+bw,y+bh/2);ctx.lineTo(x+bw+gap,y+bh/2);ctx.stroke();
        }
      });
      /* 循環の矢印 */
      var x0=15,x1=15+(n-1)*(bw+gap)+bw;
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.4;ctx.setLineDash([4,3]);
      ctx.beginPath();
      ctx.moveTo(x1,y+bh+6);ctx.lineTo(x1,y+bh+20);ctx.lineTo(x0,y+bh+20);ctx.lineTo(x0,y+bh+6);
      ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"末尾の次は先頭に戻る（循環）→ NULL チェックが不要",(x0+x1)/2,y+bh+34,C("--faint"),"center",9.5);
      var cur=(idx>=0&&idx<items.length)?items[idx]:null;
      out2.innerHTML='<span style="color:var(--muted)">uxNumberOfItems</span> = <b>'+items.length+'</b>'+
        ' ／ <span style="color:var(--muted)">pxIndex</span> → <b>'+(cur?cur.id:"xListEnd")+'</b>'+
        ' ／ <span style="color:var(--muted)">直前の操作</span>: '+esc(lastOp);
      out.innerHTML=(sorted()
        ? '<b>vListInsert()</b> は xItemValue の昇順を保つ位置に挿入する（O(n)）。番兵の xItemValue は最大値なので、必ずその手前で止まる ／ <b>遅延リストが昇順なので、先頭を見るだけで「次に起きるタスク」が分かる</b>（毎ティックの判定が O(1)）'
        : '<b>vListInsertEnd()</b> はカーソルの直前に入れるだけ（O(1)）。Ready リストは優先度ごとに分かれているので、そもそも並べ替える必要がない')+
        ' ／ 削除は <b>pvContainer</b> のおかげでリストを探索せず <b>O(1)</b> で行える';
    }
    bAdd.addEventListener("click",function(){
      var id=String.fromCharCode(64+nextId);nextId++;
      var v=sorted()?Math.floor(Math.random()*40)+1:items.length*7+3;
      items.push({id:id,v:v});lastOp="vListInsert"+(sorted()?"":"End")+"( "+id+", value="+v+" )";draw();
    });
    bDel.addEventListener("click",function(){
      if(!items.length)return;
      var g=items.shift();if(idx>=items.length)idx=items.length-1;
      lastOp="uxListRemove( "+g.id+" )";draw();
    });
    bNext.addEventListener("click",function(){
      if(!items.length)return;
      idx=(idx+1)%items.length;
      lastOp="listGET_OWNER_OF_NEXT_ENTRY() → "+items[idx].id;draw();
    });
    bRst.addEventListener("click",function(){reset();draw();});
    smode.addEventListener("change",function(){reset();draw();});
    reg(cv,draw);
  };

  /* ---------- 07: Ready リストと最高優先度の選択 ---------- */
  REG.readylist=function(el){
    head(el,"Ready Lists","優先度ごとに独立したリストを持つ");
    var cv=screen(el,240),cc=cctx(cv);
    var row=ctrls(el);
    var NP=6;
    var TASKS=[{n:"Control",p:4},{n:"Comm",p:3},{n:"Sensor",p:3},{n:"Display",p:2},{n:"Log",p:1}];
    var boxrow=ctrls(el);
    var chks=TASKS.map(function(t){return checkbox(row,t.n+"（優先度 "+t.p+"）が Ready",true);});
    var sopt=checkbox(boxrow,"ビットマップ最適化を使う（configUSE_PORT_OPTIMISED_TASK_SELECTION）",true);
    var out=readout(el);
    function draw(){
      var ready=TASKS.filter(function(t,i){return chks[i].checked;});
      /* アイドルは常に Ready */
      var all=ready.concat([{n:"IDLE",p:0}]);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=136,rowH=Math.min(30,(h-30)/NP);
      var bits=0;
      all.forEach(function(t){bits|=(1<<t.p);});
      var top=-1;for(var b=NP-1;b>=0;b--){if(bits&(1<<b)){top=b;break;}}
      for(var p=NP-1;p>=0;p--){
        var y=12+(NP-1-p)*rowH;
        var lst=all.filter(function(t){return t.p===p;});
        var on=(p===top);
        ctx.fillStyle=on?C("--signal-soft"):C("--screen");
        rrect(ctx,padL,y,w-padL-92,rowH-6,6);ctx.fill();
        ctx.strokeStyle=on?C("--signal"):C("--grid");ctx.lineWidth=on?1.6:1;
        rrect(ctx,padL,y,w-padL-92,rowH-6,6);ctx.stroke();
        lab(ctx,"pxReadyTasksLists["+p+"]",padL-6,y+rowH/2,C(on?"--signal":"--muted"),"right",10);
        var x=padL+8;
        if(!lst.length)lab(ctx,"（空）",x,y+rowH/2,C("--faint"),"left",10);
        lst.forEach(function(t,i){
          var tw=Math.max(52,t.n.length*7+14);
          ctx.fillStyle=(on&&i===0)?C("--signal"):C("--panel");
          rrect(ctx,x,y+3,tw,rowH-12,5);ctx.fill();
          ctx.strokeStyle=(on&&i===0)?C("--signal"):C("--line");ctx.lineWidth=1.2;
          rrect(ctx,x,y+3,tw,rowH-12,5);ctx.stroke();
          lab(ctx,t.n,x+tw/2,y+rowH/2,(on&&i===0)?"#fff":C("--muted"),"center",9.5);
          x+=tw+6;
        });
        /* ビットマップ */
        var bx=w-78;
        var set=!!(bits&(1<<p));
        ctx.fillStyle=set?C("--signal"):C("--screen");
        rrect(ctx,bx,y+3,22,rowH-12,4);ctx.fill();
        ctx.strokeStyle=set?C("--signal"):C("--line");ctx.lineWidth=1.2;
        rrect(ctx,bx,y+3,22,rowH-12,4);ctx.stroke();
        lab(ctx,set?"1":"0",bx+11,y+rowH/2,set?"#fff":C("--faint"),"center",10);
      }
      lab(ctx,"bit",w-67,6,C("--muted"),"center",9);
      var pick=all.filter(function(t){return t.p===top;})[0];
      var opt=sopt.checked;
      var bs=("00000000"+(bits>>>0).toString(2)).slice(-8);
      out.innerHTML='ビットマップ = <b style="font-family:var(--mono)">0b'+bs+'</b>'+
        ' ／ 最高優先度 = <b>'+top+'</b> ／ 次に走るのは <b>'+esc(pick.n)+'</b>'+
        ' ／ '+(opt
          ? '選択は <code>31 - CLZ(bitmap)</code> の <b class="ok">1 命令</b>。タスク数にも優先度の段数にも依存しない真の O(1)'
          : '選択は「ヒントから空でないリストまで下る」ループ。<b>'+(NP-top)+' 回</b>の比較。'+
            'O(configMAX_PRIORITIES) だがタスク数には依存しないので、最悪実行時間は計算できる')+
        ' ／ <b>同一優先度に複数いる場合は先頭が走る</b>。走った後はカーソルが進んで次の番になる';
    }
    chks.concat([sopt]).forEach(function(c){c.addEventListener("change",draw);});
    reg(cv,draw);
  };

  /* ---------- 08: ティックとタイムスライス ---------- */
  REG.tick=function(el){
    head(el,"Tick & Time Slicing","同一優先度は毎ティック交代する");
    var cv=screen(el,166),cc=cctx(cv);
    var row=ctrls(el);
    var sn=slider(row,"同一優先度（2）のタスク数",1,4,3,1);
    var sh=checkbox(row,"優先度 3 の周期タスクを走らせる（5 ms 周期・1 ms）",true);
    var sl=checkbox(row,"タイムスライスを使う（configUSE_TIME_SLICING）",true);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value;sn.val.textContent=n+" 個";
      var T=30;
      var tasks=[];
      if(sh.checked)tasks.push({name:"高（優先度 3）",prio:3,period:5,exec:1,offset:0});
      for(var i=0;i<n;i++)tasks.push({name:String.fromCharCode(65+i)+"（優先度 2）",prio:2,period:T*2,exec:T*2,offset:0});
      var r=simulate(tasks,T,{dt:0.05,slice:sl.checked?1:0});
      var G=gantt(cc,tasks,r.segs,T,{padL:100,releases:false});
      var ctx=G.ctx,X=G.X,w=G.w,h=G.h;
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;ctx.globalAlpha=.75;
      for(var t=0;t<=T;t++){ctx.beginPath();ctx.moveTo(X(t),G.padT);ctx.lineTo(X(t),G.padT+tasks.length*G.rowH);ctx.stroke();}
      ctx.globalAlpha=1;
      lab(ctx,"縦線 = ティック割り込み（1 ms ごと）",G.padL,h-6,C("--faint"),"left",9.5);
      /* 各タスクの取り分 */
      var share=tasks.map(function(_,i){
        var s=0;r.segs.forEach(function(sg){if(sg.i===i)s+=sg.b-sg.a;});return s;});
      var lowTot=0;for(i=(sh.checked?1:0);i<tasks.length;i++)lowTot+=share[i];
      out.innerHTML='ティック割り込みがやることは 4 つだけ: '+
        '<b>①折り返し判定 ②起こすタスクの確認 ③タイムスライス判定 ④ティックフック</b>'+
        ' ／ 大多数のティックでは <code>xTickCount &gt;= xNextTaskUnblockTime</code> が偽になり、'+
        '<b class="ok">リストを一切触らずに終わる</b>（典型 1〜3 µs）'+
        ' ／ '+(sl.checked
          ? '優先度 2 の '+n+' 個は毎ティック順番に交代する（各 '+f(100*(lowTot?share[sh.checked?1:0]/lowTot:0),0)+' % ずつ）'
          : '<span class="warn">タイムスライスを切ったので、先頭のタスクがブロックするまで走り続ける（早い者勝ち）</span>')+
        ' ／ <b class="warn">vTaskDelay(1) は「1 ティック待つ」ではなく「次のティックまで待つ」</b>。実際の待ち時間は 0〜1 ティックでばらつく';
    }
    sn.input.addEventListener("input",draw);
    [sh,sl].forEach(function(c){c.addEventListener("change",draw);});
    reg(cv,draw);
  };

  /* ---------- 09: CPU 使用率とアイドル ---------- */
  REG.cpuload=function(el){
    head(el,"Idle & CPU Load","アイドルタスクの割合が、そのまま余裕である");
    var cv=screen(el,178),cc=cctx(cv);
    var row=ctrls(el);
    var s1=slider(row,"制御 10ms 周期の C",0,8,2,0.5);
    var s2=slider(row,"通信 50ms 周期の C",0,30,5,0.5);
    var s3=slider(row,"表示 200ms 周期の C",0,80,20,1);
    var swfi=checkbox(row,"アイドルフックで __WFI() を呼ぶ",true);
    var out=readout(el);
    function draw(){
      var v=[+s1.input.value,+s2.input.value,+s3.input.value];
      s1.val.textContent=f(v[0],1)+" ms";s2.val.textContent=f(v[1],1)+" ms";s3.val.textContent=f(v[2],1)+" ms";
      var per=[10,50,200],nm=["Control","Comm","Display"];
      var u=[0,0,0],U=0;
      for(var i=0;i<3;i++){u[i]=v[i]/per[i];U+=u[i];}
      var idle=Math.max(0,1-U);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      /* 積み上げバー */
      var bx=24,by=44,bw=w-48,bh=44;
      var x=bx;
      var parts=[];
      for(i=0;i<3;i++)parts.push({n:nm[i],v:Math.min(u[i],1),c:tcol(i)});
      parts.push({n:"IDLE",v:idle,c:C("--faint")});
      lab(ctx,"CPU の配分",bx,30,C("--muted"),"left",11);
      parts.forEach(function(p){
        var pw=p.v*bw;
        ctx.fillStyle=p.c;ctx.fillRect(x,by,Math.max(0,pw),bh);
        if(pw>52){
          lab(ctx,p.n,x+pw/2,by+bh/2-2,"#fff","center",10);
          lab(ctx,f(p.v*100,1)+"%",x+pw/2,by+bh/2+13,"rgba(255,255,255,.9)","center",9.5);
        }
        x+=pw;
      });
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.strokeRect(bx,by,bw,bh);
      /* 70% ライン */
      ctx.strokeStyle=C("--alias");ctx.setLineDash([4,3]);ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(bx+bw*0.7,by-8);ctx.lineTo(bx+bw*0.7,by+bh+8);ctx.stroke();
      ctx.setLineDash([]);
      lab(ctx,"70%（利用率境界の目安）",bx+bw*0.7+4,by+bh+22,C("--alias"),"left",9.5);
      /* 消費電流の目安 */
      var base=42,cur=swfi.checked?(base*U+3):(base);
      lab(ctx,"消費電流の目安: 約 "+f(cur,1)+" mA"+(swfi.checked?"（__WFI あり）":"（__WFI なし・常に全力で回る）"),
          bx,h-12,C("--muted"),"left",10.5);
      out.innerHTML='CPU 利用率 <b class="'+(U<0.7?"ok":"warn")+'">'+f(U*100,1)+' %</b>'+
        ' ／ アイドル <b>'+f(idle*100,1)+' %</b>'+
        ' ／ '+(U<0.7?'<span class="ok">利用率境界（3 タスクで 78 %）の内側。余裕がある</span>'
                    :'<span class="warn">境界を超えている。応答時間解析（20 章）で個別に確認すること</span>')+
        ' ／ '+(swfi.checked
          ? '<b class="ok">__WFI() を 1 行入れるだけで、アイドル中の消費電流が大幅に下がる</b>。ただしアイドルフックの呼び出し回数による CPU 使用率測定は成立しなくなる（21 章の実行時間統計を使う）'
          : '<span class="warn">アイドルタスクが全力でループを回っている。数十 mA を無駄に消費する</span>')+
        ' ／ <b>アイドルタスクが走らないと、削除済みタスクのメモリが返ってこない</b>';
    }
    [s1,s2,s3].forEach(function(s){s.input.addEventListener("input",draw);});
    swfi.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 10: 遅延リスト ---------- */
  REG.delaylist=function(el){
    head(el,"Delayed Task List","起床時刻の昇順。折り返しはリスト 2 本の交換で扱う");
    var cv=screen(el,210),cc=cctx(cv);
    var row=ctrls(el);
    var st=slider(row,"xTickCount",0,60,0,1);
    var sov=checkbox(row,"折り返し直前から始める（xTickCount を 0xFFFFFFF0 相当にする）",false);
    var out2=panel(el);
    var out=readout(el);
    var BASE=0xFFFFFFF0;
    var TASKS=[{n:"A",d:5},{n:"B",d:12},{n:"C",d:30},{n:"D",d:45}];
    function draw(){
      var t=+st.input.value;st.val.textContent=t;
      var ov=sov.checked;
      var now=ov?((BASE+t)>>>0):t;
      var list=[],olist=[],woke=[];
      TASKS.forEach(function(tk){
        var wake=ov?(((BASE+tk.d)>>>0)):(tk.d);
        var flips=ov&&((BASE+tk.d)>0xFFFFFFFF);
        var elapsed=ov?((now-BASE)>>>0):t;
        if(elapsed>=tk.d)woke.push(tk.n);
        else (flips?olist:list).push({n:tk.n,w:wake,f:flips});
      });
      /* 折り返し後は 2 本を交換 */
      var swapped=ov&&(now<BASE);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      function drawList(y,title,arr,active){
        lab(ctx,title,16,y-6,active?C("--signal"):C("--muted"),"left",10.5);
        ctx.fillStyle=C("--screen");rrect(ctx,16,y,w-32,44,7);ctx.fill();
        ctx.strokeStyle=active?C("--signal"):C("--line");ctx.lineWidth=active?1.6:1.2;
        rrect(ctx,16,y,w-32,44,7);ctx.stroke();
        var x=26;
        if(!arr.length)lab(ctx,"（空）",x,y+26,C("--faint"),"left",10);
        arr.sort(function(a,b){return a.w-b.w;}).forEach(function(it,i){
          var bw2=96;
          ctx.fillStyle=(i===0&&active)?C("--signal"):C("--panel");
          rrect(ctx,x,y+6,bw2,32,5);ctx.fill();
          ctx.strokeStyle=(i===0&&active)?C("--signal"):C("--line");ctx.lineWidth=1.2;
          rrect(ctx,x,y+6,bw2,32,5);ctx.stroke();
          var col=(i===0&&active)?"#fff":C("--muted");
          lab(ctx,it.n,x+bw2/2,y+19,col,"center",10.5);
          lab(ctx,"起床 "+(ov?hex(it.w,8):it.w),x+bw2/2,y+33,col,"center",8.8);
          x+=bw2+8;
          if(x>w-140)return;
        });
      }
      drawList(28,swapped?"pxDelayedTaskList（交換後：元 List2）":"pxDelayedTaskList（List1）",
               swapped?olist:list,true);
      drawList(104,swapped?"pxOverflowDelayedTaskList（元 List1・空）":"pxOverflowDelayedTaskList（List2）",
               swapped?list:olist,false);
      /* 起床済み */
      lab(ctx,"起床して Ready へ移動: "+(woke.length?woke.join(", "):"（まだなし）"),
          16,h-14,C("--alias"),"left",10.5);
      var head0=(swapped?olist:list).slice().sort(function(a,b){return a.w-b.w;})[0];
      out2.innerHTML='<span style="color:var(--muted)">xTickCount</span> = <b>'+(ov?hex(now,8):now)+'</b>'+
        ' ／ <span style="color:var(--muted)">xNextTaskUnblockTime</span> = <b>'+
        (head0?(ov?hex(head0.w,8):head0.w):"portMAX_DELAY")+'</b>'+
        ' ／ 判定: <code>xTickCount &gt;= xNextTaskUnblockTime</code> → <b>'+
        (head0?((now>=head0.w)?"真（起こす）":"偽（リストを触らない）"):"偽")+'</b>';
      out.innerHTML=(ov
        ? '折り返し判定は <code>xTimeToWake &lt; xConstTickCount</code> の一行。符号なし加算が折り返すと結果が元より小さくなる、という性質を使っている'+
          (swapped?' ／ <b class="ok">xTickCount が 0 に戻った瞬間、2 本のポインタを交換した</b>。比較のロジックは一切変えていない':
                   ' ／ 折り返す起床時刻を持つタスクは、あらかじめオーバーフロー用のリストに入れておく')
        : '遅延リストは<b>起床時刻の昇順</b>にソートされている。だから<b class="ok">先頭を見るだけで「次に起きるタスク」が分かる</b>')+
        ' ／ 挿入は O(n) だが<b>毎ティックの判定は O(1)</b>。頻度の高い方を速くしている';
    }
    st.input.addEventListener("input",draw);
    sov.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 11: キュー ---------- */
  REG.queue=function(el){
    head(el,"Queue","値渡し（コピー）。満杯なら送信側が待つ");
    var cv=screen(el,172),cc=cctx(cv);
    var row=ctrls(el);
    var slen=slider(row,"キューの長さ",1,8,4,1);
    var ssz=slider(row,"1 要素のバイト数 B",1,256,4,1);
    var row2=ctrls(el);
    var bs=button(row2,"xQueueSend（送る）");
    var br=button(row2,"xQueueReceive（受ける）");
    var bws=button(row2,"送信タスクを待たせる");
    var bwr=button(row2,"受信タスクを待たせる");
    var bx=button(row2,"リセット");
    var out2=panel(el);
    var out=readout(el);
    var q=[],waitSend=[],waitRecv=[],nextV=1,msg="初期状態";
    function reset(){q=[];waitSend=[];waitRecv=[];nextV=1;msg="初期状態";}
    reset();
    function draw(){
      var L=+slen.input.value,sz=+ssz.input.value;
      slen.val.textContent=L;ssz.val.textContent=sz+" B";
      while(q.length>L)q.pop();
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      /* リングバッファ */
      lab(ctx,"リングバッファ（uxLength = "+L+"）",18,22,C("--muted"),"left",11);
      var cw=Math.min(78,(w-40)/L-6),y=32,ch2=42;
      for(var i=0;i<L;i++){
        var x=20+i*(cw+6);
        var full=i<q.length;
        ctx.fillStyle=full?C("--signal"):C("--screen");
        rrect(ctx,x,y,cw,ch2,6);ctx.fill();
        ctx.strokeStyle=full?C("--signal"):C("--line");ctx.lineWidth=1.3;
        rrect(ctx,x,y,cw,ch2,6);ctx.stroke();
        lab(ctx,full?String(q[i]):"—",x+cw/2,y+ch2/2+4,full?"#fff":C("--faint"),"center",12);
      }
      if(q.length<L){
        var wx=20+q.length*(cw+6);
        lab(ctx,"pcWriteTo",wx+cw/2,y+ch2+15,C("--alias"),"center",9);
      }
      if(q.length)lab(ctx,"pcReadFrom",20+cw/2,y-6,C("--blue"),"center",9);
      /* 待ちリスト */
      function wl(yy,title,arr,col){
        lab(ctx,title+"("+arr.length+")",18,yy,C("--muted"),"left",10.5);
        var x2=190;
        arr.forEach(function(t){
          ctx.fillStyle=col;rrect(ctx,x2,yy-12,58,17,4);ctx.fill();
          lab(ctx,t,x2+29,yy,"#fff","center",9.5);x2+=64;
        });
        if(!arr.length)lab(ctx,"（空）",190,yy,C("--faint"),"left",10);
      }
      wl(y+ch2+40,"xTasksWaitingToSend",waitSend,C("--alias"));
      wl(y+ch2+66,"xTasksWaitingToReceive",waitRecv,C("--blue"));
      var mem=L*sz+80;
      out2.innerHTML='<span style="color:var(--muted)">uxMessagesWaiting</span> = <b>'+q.length+'</b> / '+L+
        ' ／ <span style="color:var(--muted)">メモリ</span> ≈ '+L+' × '+sz+' B + 構造体約 80 B = <b>'+mem+' B</b>'+
        ' ／ <span style="color:var(--muted)">直前の操作</span>: '+esc(msg);
      out.innerHTML=(sz>=64
        ? '<span class="warn">1 要素 '+sz+' バイトはコピーのコストが無視できない</span>。大きなデータは<b>ポインタを送り、所有権を設計で決める</b>（誰が確保し、誰が解放し、送信失敗時に誰が解放するか）'
        : '<b>値渡し</b>なので、送った瞬間にコピーが完了する。送信側はその後 local 変数を書き換えてよい。<b class="ok">所有権の問題が発生しない</b>')+
        ' ／ 待ちは <code>for(;;)</code> で<b>やり直す</b>構造になっている（起きてもまだ満杯／空かもしれない＝偽の目覚め）';
    }
    bs.addEventListener("click",function(){
      var L=+slen.input.value;
      if(q.length<L){
        q.push(nextV++);
        if(waitRecv.length){var t=waitRecv.shift();msg="送信 → 待っていた "+t+" を起こす（最高優先度から）";}
        else msg="送信（空きがあったのでコピーして即座に戻る）";
      } else { msg="送信失敗: errQUEUE_FULL（タイムアウト 0 の場合）／ タイムアウト指定なら xTasksWaitingToSend で待つ"; }
      draw();
    });
    br.addEventListener("click",function(){
      if(q.length){
        q.shift();
        if(waitSend.length){var t=waitSend.shift();msg="受信 → 空きができたので待っていた "+t+" を起こす";}
        else msg="受信（データがあったのでコピーして即座に戻る）";
      } else { msg="受信失敗: キューが空（タイムアウト 0）／ タイムアウト指定なら xTasksWaitingToReceive で待つ"; }
      draw();
    });
    bws.addEventListener("click",function(){
      waitSend.push("T"+(waitSend.length+1));msg="vTaskPlaceOnEventList( xTasksWaitingToSend )";draw();});
    bwr.addEventListener("click",function(){
      waitRecv.push("R"+(waitRecv.length+1));msg="vTaskPlaceOnEventList( xTasksWaitingToReceive )";draw();});
    bx.addEventListener("click",function(){reset();draw();});
    [slen,ssz].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 12: セマフォとミューテックス ---------- */
  REG.semaphore=function(el){
    head(el,"Semaphore vs Mutex","違いは「所有者」の有無だけ");
    var row=ctrls(el);
    var skind=select(row,"種類",["バイナリセマフォ","カウンティングセマフォ（最大 3）","ミューテックス"]);
    var row2=ctrls(el);
    var bTA=button(row2,"タスク A が Take");
    var bTB=button(row2,"タスク B が Take");
    var bGA=button(row2,"タスク A が Give");
    var bGB=button(row2,"タスク B が Give");
    var bI=button(row2,"ISR が Give");
    var bR=button(row2,"リセット");
    var out2=panel(el,120);
    var out=readout(el);
    var cnt=0,owner=null,log=[];
    function maxc(){return +skind.value===1?3:1;}
    function reset(){
      cnt=(+skind.value===2)?1:(+skind.value===1?3:0);   /* ミューテックスは生成直後「満」*/
      owner=null;log=[];
    }
    reset();
    function push(s,cls){log.push('<span class="'+(cls||"")+'">'+s+'</span>');if(log.length>6)log.shift();}
    function take(who){
      var k=+skind.value;
      if(k===2&&owner!==null){push("✗ "+who+" が Take → "+owner+" が所有中なのでブロック。"+
        "<b>"+owner+" の優先度を "+who+" と同じまで昇格（優先度継承）</b>","warn");return;}
      if(cnt>0){cnt--;if(k===2)owner=who;
        push("✓ "+who+" が Take 成功（カウント "+(cnt+1)+" → "+cnt+"）"+(k===2?"　所有者 = "+who:""),"ok");}
      else push("✗ "+who+" が Take → カウント 0 なのでブロック","warn");
    }
    function give(who,isr){
      var k=+skind.value;
      if(k===2){
        if(isr){push("✗ ISR からミューテックスは Give できない（configASSERT で止まる）。ISR は所有者になれず、優先度継承の解除も行えない","warn");return;}
        if(owner!==who){push("✗ "+who+" は所有者ではない（所有者 = "+(owner||"なし")+"）。configASSERT で捕まる","warn");return;}
        cnt=1;owner=null;push("✓ "+who+" が Give。<b>昇格していた優先度を元に戻す</b>","ok");return;
      }
      if(cnt<maxc()){cnt++;push("✓ "+(isr?"ISR":who)+" が Give（カウント "+(cnt-1)+" → "+cnt+"）","ok");}
      else push("✗ Give したが上限に達している。<b>イベントが 1 回失われた</b>"+
        (k===0?"（バイナリなので 1 個しか覚えられない）":""),"warn");
    }
    function draw(){
      var k=+skind.value;
      var names=["バイナリセマフォ","カウンティングセマフォ","ミューテックス"];
      out2.innerHTML=
        '<div>'+tbl(["項目","値"],[
          ["種類","<b>"+names[k]+"</b>"],
          ["実装","キュー長 "+(k===1?"3":"1")+" ／ <b>アイテムサイズ 0</b>（個数を数えるだけ）"],
          ["カウント","<b>"+cnt+" / "+maxc()+"</b>"],
          ["所有者 (xMutexHolder)",k===2?("<b>"+(owner||"なし")+"</b>"):'<span style="color:var(--faint)">— この種類にはない</span>'],
          ["優先度継承",k===2?'<b class="ok">あり</b>':'<span class="warn">なし → 優先度逆転が起きる</span>'],
          ["ISR から Give",k===2?'<span class="warn">不可</span>':'<b class="ok">可</b>']
        ])+'</div>'+
        '<div style="margin-top:.6rem;color:var(--muted)">操作ログ</div>'+
        '<div style="line-height:1.5">'+(log.length?log.join("<br>"):"（まだ操作していません）")+'</div>';
      out.innerHTML=(k===2
        ? '<b>ロックにはミューテックスを使う。</b>所有者を記録しているので、①待たれたときに所有者の優先度を上げられる ②他人が Give することを防げる ／ <b class="warn">生成直後は「満」</b>（誰も持っていない状態）'
        : (k===0
          ? '<b>バイナリセマフォは「事象が起きた」を伝えるためのもの。</b>ISR → タスクの通知が典型 ／ <b class="warn">生成直後は「空」</b> ／ 1 個しか覚えられないので、割り込みが速いと取りこぼす'
          : '<b>カウンティングセマフォ</b>は「資源プール（初期値 = 最大）」と「イベント計数（初期値 = 0）」の 2 通りに使う ／ 何回起きたかは分かるが、<b>どの順で何が起きたかは分からない</b>（それが要るならキュー）'))+
        ' ／ <b>実装はすべて queue.c。違いは所有者フィールドだけ</b>';
    }
    bTA.addEventListener("click",function(){take("A");draw();});
    bTB.addEventListener("click",function(){take("B");draw();});
    bGA.addEventListener("click",function(){give("A",false);draw();});
    bGB.addEventListener("click",function(){give("B",false);draw();});
    bI.addEventListener("click",function(){give("ISR",true);draw();});
    bR.addEventListener("click",function(){reset();draw();});
    skind.addEventListener("change",function(){reset();draw();});
    reg(null,draw);draw();
  };

  /* ---------- 13: 優先度逆転 ---------- */
  REG.priinv=function(el){
    head(el,"Priority Inversion","継承がないと、待ち時間の上限が計算できなくなる");
    var cv=screen(el,214),cc=cctx(cv);
    var row=ctrls(el);
    var sc=slider(row,"L のクリティカルセクション（ms）",1,12,6,1);
    var sm=slider(row,"M の実行時間（ms）",0,30,14,1);
    var si=checkbox(row,"優先度継承を有効にする（ミューテックスを使う）",true);
    var out=readout(el);
    function draw(){
      var cs=+sc.input.value,me=+sm.input.value,inh=si.checked;
      sc.val.textContent=cs+" ms";sm.val.textContent=me+" ms";
      /* シナリオ: t=0 で L 起動(ロックを 1ms 後に取る)、t=3 で H が起動しロックを要求、t=5 で M が起動 */
      var T=Math.max(40,cs+me+16);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=118,padR=14,padT=26,rowH=40;
      var X=function(x){return padL+x/T*(w-padL-padR);};
      var names=["H（高・優先度 5）","M（中・優先度 3）","L（低・優先度 1）"];
      names.forEach(function(n,i){
        var y=padT+i*rowH;
        ctx.fillStyle=C("--screen");ctx.fillRect(padL,y,w-padL-padR,rowH-8);
        ctx.strokeStyle=C("--grid");ctx.strokeRect(padL,y,w-padL-padR,rowH-8);
        lab(ctx,n,padL-6,y+(rowH-8)/2+4,C("--muted"),"right",10);
      });
      function bar(r,a,b,col,txt){
        if(b<=a)return;
        var y=padT+r*rowH;
        ctx.fillStyle=col;ctx.fillRect(X(a),y+2,Math.max(1.2,X(b)-X(a)),rowH-12);
        if(txt&&X(b)-X(a)>44)lab(ctx,txt,(X(a)+X(b))/2,y+(rowH-8)/2+4,"#fff","center",9.5);
      }
      var tH=3,tM=5,lockAt=1;
      var segs=[];
      var wait,note="",noteCol="--muted";
      if(inh){
        /* L: 0..1 実行, 1 でロック, H が 3 で要求 → L を昇格 → L が cs 完了まで走る */
        bar(2,0,lockAt,tcol(2));
        bar(2,lockAt,lockAt+cs,C("--signal"),"ロック保持");
        var rel=lockAt+cs;
        bar(0,rel,rel+4,tcol(0),"H が走る");
        bar(1,rel+4,rel+4+me,tcol(1),"M");
        wait=rel-tH;
        ctx.strokeStyle=C("--signal");ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(X(tH),padT+2*rowH-4);ctx.lineTo(X(tH),padT+2*rowH+6);ctx.stroke();
        note="H が要求 → L を優先度 5 に昇格";noteCol="--signal";
      } else {
        /* L: 0..1, ロック取得, 3 で H ブロック, 5 で M が L をプリエンプト */
        bar(2,0,lockAt,tcol(2));
        bar(2,lockAt,tM,C("--alias"),"ロック");
        bar(1,tM,tM+me,tcol(1),"M が L を止める");
        var restLock=cs-(tM-lockAt);
        var rel2=tM+me+Math.max(0,restLock);
        bar(2,tM+me,rel2,C("--alias"),"ロック（続き）");
        bar(0,rel2,rel2+4,tcol(0),"H が走る");
        wait=rel2-tH;
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(X(tM),padT+rowH-6);ctx.lineTo(X(tM),padT+2*rowH+6);ctx.stroke();
        note="M が割り込む → L が止まる → H も進めない";noteCol="--alias";
      }
      /* H の待ち時間 */
      var yH=padT+2;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(X(tH),yH-14);ctx.lineTo(X(tH),padT+3*rowH);ctx.stroke();
      ctx.setLineDash([]);
      lab(ctx,"H が要求",X(tH),yH-18,C("--alias"),"left",10);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;
      var yw=padT+3*rowH+6;
      ctx.beginPath();ctx.moveTo(X(tH),yw);ctx.lineTo(X(tH+wait),yw);ctx.stroke();
      [X(tH),X(tH+wait)].forEach(function(xx){
        ctx.beginPath();ctx.moveTo(xx,yw-5);ctx.lineTo(xx,yw+5);ctx.stroke();});
      lab(ctx,"H の待ち時間 "+wait+" ms",(X(tH)+X(tH+wait))/2,yw+18,C("--alias"),"center",10.5);
      lab(ctx,note,padL,yw+36,C(noteCol),"left",9.5);
      out.innerHTML=(inh
        ? '<b class="ok">H の待ち時間 = '+wait+' ms</b>。これは <b>L のクリティカルセクションの長さ</b>だけで決まり、M の実行時間には依存しない'+
          ' ／ これを<b>有界な優先度逆転</b>と呼ぶ。避けられないが、<b class="ok">計算できる</b>'+
          ' ／ 20 章の応答時間解析で B_i として扱えるのは、この性質があるからである'
        : '<b class="warn">H の待ち時間 = '+wait+' ms</b>。M の実行時間（'+me+' ms）がそのまま乗っている'+
          ' ／ M が何個いて、それぞれ何 ms 走るかは事前に分からない → <b class="warn">待ち時間の上限が計算できない（無制限の優先度逆転）</b>'+
          ' ／ 1997 年、Mars Pathfinder はこれでリセットを繰り返した。JPL は火星の探査機に「優先度継承を有効にする」パッチを送信して直した')+
        ' ／ <b>ロックには必ずミューテックスを使うこと。</b>バイナリセマフォには所有者がないので継承できない';
    }
    [sc,sm].forEach(function(s){s.input.addEventListener("input",draw);});
    si.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 14: タスク通知 vs キュー ---------- */
  REG.notifycost=function(el){
    head(el,"Notification vs Queue","TCB に直接書く。オブジェクトを作らない");
    var cv=screen(el,268),cc=cctx(cv);
    var row=ctrls(el);
    var sn=slider(row,"通知路の数（1 対 1 の経路）",1,12,4,1);
    var ssz=slider(row,"1 回に渡すデータ（バイト）",0,64,4,1);
    var sq=slider(row,"キューの長さ",1,10,4,1);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,sz=+ssz.input.value,ql=+sq.input.value;
      sn.val.textContent=n+" 本";ssz.val.textContent=sz+" B";sq.val.textContent=ql;
      /* メモリ: キュー = 構造体 80 + 長さ*サイズ ; セマフォ = 構造体 80 ; 通知 = TCB 内 5 B (uint32 + state) */
      var memQ=n*(80+ql*Math.max(sz,1));
      var memS=n*80;
      var memN=n*5;
      /* 時間（相対・公称値。FreeRTOS 公式の測定では通知はキューより約 45 % 速い） */
      var tQ=100,tS=78,tN=55;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var items=[
        {n:"キュー",m:memQ,t:tQ,c:tcol(1)},
        {n:"バイナリセマフォ",m:memS,t:tS,c:tcol(2)},
        {n:"タスク通知",m:memN,t:tN,c:C("--signal")}
      ];
      var maxM=Math.max.apply(null,items.map(function(i){return i.m;}));
      var padL=126,padR=64,y0=34,rh=34;
      lab(ctx,"RAM 使用量（"+n+" 本ぶん）",padL,20,C("--muted"),"left",11);
      items.forEach(function(it,i){
        var y=y0+i*rh;
        var bw=(w-padL-padR)*(it.m/maxM);
        ctx.fillStyle=it.c;rrect(ctx,padL,y,Math.max(3,bw),rh-12,4);ctx.fill();
        lab(ctx,it.n,padL-6,y+(rh-12)/2+4,C("--muted"),"right",10);
        lab(ctx,it.m+" B",padL+Math.max(3,bw)+6,y+(rh-12)/2+4,C("--muted"),"left",10);
      });
      var y1=y0+3*rh+18;
      lab(ctx,"送信 1 回の相対処理時間",padL,y1-8,C("--muted"),"left",11);
      items.forEach(function(it,i){
        var y=y1+i*rh;
        var bw=(w-padL-padR)*(it.t/100);
        ctx.fillStyle=it.c;ctx.globalAlpha=.65;
        rrect(ctx,padL,y,Math.max(3,bw),rh-12,4);ctx.fill();ctx.globalAlpha=1;
        lab(ctx,it.n,padL-6,y+(rh-12)/2+4,C("--muted"),"right",10);
        lab(ctx,it.t+" %",padL+Math.max(3,bw)+6,y+(rh-12)/2+4,C("--muted"),"left",10);
      });
      out2.innerHTML=tbl(["用途","タスク通知","キュー"],[
        ["受信者","<b>1 つのタスク専用</b>","誰でも／複数可"],
        ["送信側のブロック",'<span class="warn">できない</span>',"<b>できる（流量調整）</b>"],
        ["バッファ",'<span class="warn">なし（上書き）</span>',"あり"],
        ["渡せるデータ","32 bit × "+1,"任意サイズ × "+ql],
        ["ISR からの即時性","<b>その場で完了</b>","その場で完了"]
      ]);
      out.innerHTML='RAM は <b class="ok">'+(memQ/Math.max(memN,1)).toFixed(0)+' 分の 1</b>'+
        '（'+memQ+' B → '+memN+' B）'+
        ' ／ タスク通知が速いのは、<b>イベントリストを一切使わない</b>から。起こす処理が '+
        '<code>uxListRemove</code> と <code>prvAddTaskToReadyList</code> の 2 行で済む'+
        ' ／ '+(sz>4
          ? '<span class="warn">4 バイトを超えるデータは通知では渡せない</span>。キューかメッセージバッファを使うこと'
          : '<b class="ok">この用途なら通知で足りる</b>')+
        ' ／ <b class="warn">送信側がブロックできない</b>ので、受信が遅いと通知が失われる。流量制御が要るならキューを使う';
    }
    [sn,ssz,sq].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 15: ソフトウェアタイマ ---------- */
  REG.swtimer=function(el){
    head(el,"Software Timers","コールバックはタイマタスクの中で走る");
    var cv=screen(el,172),cc=cctx(cv);
    var row=ctrls(el);
    var sp=slider(row,"タイマ周期（ms）",5,40,10,1);
    var scb=slider(row,"コールバックの実行時間（ms）",0,15,1,1);
    var sbusy=slider(row,"上位タスクの負荷（%）",0,90,20,5);
    var shi=checkbox(row,"タイマタスクの優先度を高くする（configTIMER_TASK_PRIORITY）",true);
    var out=readout(el);
    function draw(){
      var per=+sp.input.value,cb=+scb.input.value,busy=+sbusy.input.value,hi=shi.checked;
      sp.val.textContent=per+" ms";scb.val.textContent=cb+" ms";sbusy.val.textContent=busy+" %";
      var T=60;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=126,padR=14,padT=26,rowH=38;
      var X=function(x){return padL+x/T*(w-padL-padR);};
      ["アプリタスク（高）","タイマタスク","コールバックの期限"].forEach(function(n,i){
        var y=padT+i*rowH;
        ctx.fillStyle=C("--screen");ctx.fillRect(padL,y,w-padL-padR,rowH-10);
        ctx.strokeStyle=C("--grid");ctx.strokeRect(padL,y,w-padL-padR,rowH-10);
        lab(ctx,n,padL-6,y+(rowH-10)/2+4,C("--muted"),"right",10);
      });
      /* アプリタスクは busy% の割合で 3ms 周期のバースト */
      var appPer=4,appExec=appPer*busy/100;
      for(var t=0;t<T;t+=appPer){
        if(appExec<=0)break;
        ctx.fillStyle=tcol(1);
        ctx.fillRect(X(t),padT+2,Math.max(0.8,X(Math.min(T,t+appExec))-X(t)),rowH-14);
      }
      /* タイマタスクの実行 */
      var lat=[],late=0;
      for(var k=0;k*per<=T;k++){
        var due=k*per;
        var start=due;
        if(!hi){
          /* 低優先度: アプリタスクの空き時間を待つ */
          var slot=due%appPer;
          if(slot<appExec)start=due+(appExec-slot);
        }
        var end=Math.min(T,start+Math.max(cb,0.4));
        if(start>T)break;
        ctx.fillStyle=C("--signal");
        ctx.fillRect(X(start),padT+rowH+2,Math.max(1.2,X(end)-X(start)),rowH-14);
        /* 期限マーカー */
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;
        ctx.beginPath();ctx.moveTo(X(due),padT+2*rowH+2);ctx.lineTo(X(due),padT+2*rowH+rowH-14);ctx.stroke();
        lat.push(start-due);
        if(start-due>0.05)late++;
      }
      var avg=lat.length?lat.reduce(function(a,b){return a+b;},0)/lat.length:0;
      var mx=lat.length?Math.max.apply(null,lat):0;
      lab(ctx,"赤い縦線 = 本来の期限、青いバー = 実際にコールバックが走った区間",
          padL,h-8,C("--faint"),"left",9.5);
      var load=cb/per*100;
      out.innerHTML='コールバックの遅れ: 平均 <b>'+f(avg,1)+' ms</b> / 最大 <b class="'+(mx>1?"warn":"ok")+'">'+f(mx,1)+' ms</b>'+
        ' ／ タイマタスクの負荷 = '+cb+' / '+per+' = <b class="'+(load>50?"warn":"")+'">'+f(load,0)+' %</b>'+
        ' ／ '+(hi?'<b class="ok">タイマタスクの優先度が高いので、期限どおりに走れている</b>'
                 :'<span class="warn">タイマタスクの優先度が低いので、上位タスクが空くまでコールバックが走らない</span>')+
        ' ／ <b class="warn">xTimerStart() はタイマを開始しない。「開始してくれ」というコマンドをキューに送るだけ</b>。'+
        '実際に処理されるのはタイマタスクが走ったとき'+
        (cb>3?' ／ <span class="warn">コールバックが重い。全タイマが道連れになる。通知を送って別タスクで処理すること</span>':'');
    }
    [sp,scb,sbusy].forEach(function(s){s.input.addEventListener("input",draw);});
    shi.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 16: ヒープと断片化 ---------- */
  REG.heap=function(el){
    head(el,"Heap","結合するかどうかで、断片化の進み方が変わる");
    var cv=screen(el,146),cc=cctx(cv);
    var row=ctrls(el);
    var skind=select(row,"実装",["heap_1（解放できない）","heap_2（結合しない・非推奨）","heap_4（結合する）"]);
    var row2=ctrls(el);
    var bA=button(row2,"64 B 確保");
    var bB=button(row2,"128 B 確保");
    var bF=button(row2,"ランダムに 1 つ解放");
    var bBig=button(row2,"256 B 確保を試す");
    var bR=button(row2,"リセット");
    var out2=panel(el);
    var out=readout(el);
    var SIZE=1024,blocks=[],nextId=1,msg="初期状態";
    function reset(){blocks=[];nextId=1;msg="初期状態";}
    reset();
    function used(){var s=0;blocks.forEach(function(b){if(!b.free)s+=b.sz;});return s;}
    function coalesce(){
      if(+skind.value<2)return;
      blocks.sort(function(a,b){return a.at-b.at;});
      for(var i=0;i<blocks.length-1;i++){
        if(blocks[i].free&&blocks[i+1].free&&blocks[i].at+blocks[i].sz===blocks[i+1].at){
          blocks[i].sz+=blocks[i+1].sz;blocks.splice(i+1,1);i--;
        }
      }
    }
    function alloc(sz){
      var k=+skind.value;
      var tot=sz+8;   /* BlockLink_t のオーバーヘッド */
      if(k>=1){
        coalesce();
        blocks.sort(function(a,b){return a.at-b.at;});
        for(var i=0;i<blocks.length;i++){
          if(blocks[i].free&&blocks[i].sz>=tot){
            var rest=blocks[i].sz-tot;
            blocks[i].free=false;blocks[i].sz=tot;blocks[i].id=nextId++;blocks[i].req=sz;
            if(rest>8)blocks.splice(i+1,0,{at:blocks[i].at+tot,sz:rest,free:true});
            msg="pvPortMalloc("+sz+") → 空きブロックを再利用（"+(k===1?"最適合":"最初適合")+"）";
            return true;
          }
        }
      }
      var top=0;blocks.forEach(function(b){top=Math.max(top,b.at+b.sz);});
      if(top+tot<=SIZE){
        blocks.push({at:top,sz:tot,free:false,id:nextId++,req:sz});
        msg="pvPortMalloc("+sz+") → 未使用領域から確保（+8 B のオーバーヘッド）";
        return true;
      }
      msg='<span class="warn">pvPortMalloc('+sz+") 失敗 → NULL。vApplicationMallocFailedHook が呼ばれる</span>";
      return false;
    }
    function draw(){
      var k=+skind.value;
      bF.style.opacity=(k===0)?".4":"1";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=16,y=40,bh=52;
      var W=w-32;
      var X=function(a){return padL+a/SIZE*W;};
      lab(ctx,"configTOTAL_HEAP_SIZE = "+SIZE+" B",padL,24,C("--muted"),"left",11);
      ctx.fillStyle=C("--screen");rrect(ctx,padL,y,W,bh,6);ctx.fill();
      blocks.slice().sort(function(a,b){return a.at-b.at;}).forEach(function(b){
        ctx.fillStyle=b.free?C("--alias-soft"):C("--signal");
        ctx.fillRect(X(b.at),y,Math.max(1,X(b.at+b.sz)-X(b.at)),bh);
        if(b.free){
          ctx.strokeStyle=C("--alias");ctx.lineWidth=1;ctx.setLineDash([3,3]);
          ctx.strokeRect(X(b.at)+.5,y+.5,Math.max(1,X(b.at+b.sz)-X(b.at))-1,bh-1);ctx.setLineDash([]);
        }
        if(X(b.at+b.sz)-X(b.at)>34)
          lab(ctx,b.free?("空 "+b.sz):(""+b.req),(X(b.at)+X(b.at+b.sz))/2,y+bh/2+4,
              b.free?C("--alias"):"#fff","center",9.5);
      });
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;rrect(ctx,padL,y,W,bh,6);ctx.stroke();
      var top=0;blocks.forEach(function(b){top=Math.max(top,b.at+b.sz);});
      var freeTot=SIZE-used();
      var freeBlocks=blocks.filter(function(b){return b.free;});
      var largest=Math.max(SIZE-top,freeBlocks.length?Math.max.apply(null,freeBlocks.map(function(b){return b.sz;})):0);
      lab(ctx,"実線 = 使用中　破線 = 空きブロック",padL,y+bh+20,C("--faint"),"left",9.5);
      out2.innerHTML='<span style="color:var(--muted)">xPortGetFreeHeapSize()</span> = <b>'+freeTot+' B</b>'+
        ' ／ <span style="color:var(--muted)">確保できる最大の連続領域</span> = <b>'+largest+' B</b>'+
        ' ／ <span style="color:var(--muted)">空きブロック数</span> = '+freeBlocks.length+
        '<br><span style="color:var(--muted)">直前の操作</span>: '+msg;
      var frag=freeTot>0?(1-largest/freeTot):0;
      out.innerHTML=(k===0
        ? '<b>heap_1</b>: ポインタを進めるだけ。<b class="ok">実行時間は完全に一定、断片化は起こりえない</b> ／ 解放できないが、「起動時に全部作って以後解放しない」設計ならこれで足りる'
        : (k===1
          ? '<b class="warn">heap_2 は隣接する空きブロックを結合しない</b> ／ 空き合計 '+freeTot+' B のうち、実際に使えるのは最大 '+largest+' B（断片化率 '+f(frag*100,0)+' %）／ <b>FreeRTOS 公式で非推奨</b>。heap_4 を使うこと'
          : '<b class="ok">heap_4 は隣接する空きブロックを自動的に結合する</b>（prvInsertBlockIntoFreeList でアドレス順に挿入し、前後と連続していれば結合）／ 断片化率 '+f(frag*100,0)+' %'))+
        ' ／ 1 回の確保あたり <b>8 B のオーバーヘッド</b>（BlockLink_t）＋アラインメント調整。小さな確保を大量に行うと無視できない';
    }
    bA.addEventListener("click",function(){alloc(64);draw();});
    bB.addEventListener("click",function(){alloc(128);draw();});
    bBig.addEventListener("click",function(){alloc(256);draw();});
    bF.addEventListener("click",function(){
      if(+skind.value===0){msg='<span class="warn">heap_1 では vPortFree() は何もしない</span>';draw();return;}
      var use=blocks.filter(function(b){return !b.free;});
      if(!use.length){msg="解放できるブロックがない";draw();return;}
      var b=use[Math.floor(Math.random()*use.length)];
      b.free=true;delete b.id;delete b.req;
      msg="vPortFree() → 空きリストへ戻す"+(+skind.value>=2?"（隣接する空きと結合する）":"（結合しない）");
      coalesce();draw();
    });
    bR.addEventListener("click",function(){reset();draw();});
    skind.addEventListener("change",function(){reset();draw();});
    reg(cv,draw);
  };

  /* ---------- 17: スタック使用量 ---------- */
  REG.stack=function(el){
    head(el,"Stack & High Water Mark","溢れても CPU は何も教えてくれない");
    var cv=screen(el,164),cc=cctx(cv);
    var row=ctrls(el);
    var ssz=slider(row,"スタック（ワード）",64,1024,256,32);
    var sdep=slider(row,"関数の呼び出し段数",1,12,4,1);
    var sloc=slider(row,"1 段のローカル変数 B",8,256,48,8);
    var row2=ctrls(el);
    var sisr=slider(row2,"割り込みのネスト段数",0,4,1,1);
    var spf=checkbox(row2,"printf を呼ぶ（+1200 B）",false);
    var sfpu=checkbox(row2,"FPU を使う（退避量が増える）",false);
    var out=readout(el);
    function draw(){
      var W=+ssz.input.value,dep=+sdep.input.value,loc=+sloc.input.value;
      var isr=+sisr.input.value;
      ssz.val.textContent=W+" w ("+(W*4)+" B)";sdep.val.textContent=dep+" 段";sloc.val.textContent=loc+" B";
      sisr.val.textContent=isr+" 段";
      var ctxB=sfpu.checked?200:64;
      var frameB=(loc+28)*dep;
      var pf=spf.checked?1200:0;
      var isrB=isr*(sfpu.checked?140:40);
      var used=ctxB+frameB+pf+isrB;
      var cap=W*4;
      var hwm=Math.max(0,cap-used);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=18,y=44,bh=54,BW=w-36;
      lab(ctx,"タスクのスタック（"+cap+" B）",padL,26,C("--muted"),"left",11);
      ctx.fillStyle=C("--screen");rrect(ctx,padL,y,BW,bh,6);ctx.fill();
      var parts=[
        {n:"コンテキスト退避",v:ctxB,c:C("--blue")},
        {n:"呼び出しフレーム",v:frameB,c:C("--signal")},
        {n:"printf",v:pf,c:tcol(1)},
        {n:"割り込み",v:isrB,c:C("--muted")}
      ];
      var x=padL;
      parts.forEach(function(p){
        if(p.v<=0)return;
        var pw=Math.min(BW-(x-padL),p.v/cap*BW);
        if(pw<=0)return;
        ctx.fillStyle=p.c;ctx.fillRect(x,y,pw,bh);
        if(pw>72)lab(ctx,p.n,x+pw/2,y+bh/2+4,"#fff","center",9.5);
        x+=pw;
      });
      /* 0xA5 の埋め草 */
      if(hwm>0){
        var fx=padL+used/cap*BW;
        ctx.fillStyle=C("--screen");ctx.fillRect(fx,y,BW-(fx-padL),bh);
        for(var i=0;i<(BW-(fx-padL))/16;i++){
          lab(ctx,"A5",fx+i*16+3,y+bh/2+4,C("--faint"),"left",8);
        }
      }
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;rrect(ctx,padL,y,BW,bh,6);ctx.stroke();
      if(used>cap){
        ctx.fillStyle=C("--alias");
        ctx.fillRect(padL+BW,y,Math.min(60,(used-cap)/cap*BW),bh);
        lab(ctx,"溢れ",padL+BW+6,y+bh/2+4,"#fff","left",10);
      }
      lab(ctx,"未使用領域は 0xA5A5A5A5 のまま。ここの残り量が High Water Mark",
          padL,y+bh+22,C("--faint"),"left",9.5);
      var ok=used<=cap*0.7;
      out.innerHTML='使用量 <b>'+used+' B</b>（退避 '+ctxB+' + フレーム '+frameB+
        (pf?' + printf '+pf:'')+(isrB?' + 割込 '+isrB:'')+'）／ 割り当て <b>'+cap+' B</b>'+
        ' ／ <b>uxTaskGetStackHighWaterMark() = '+Math.floor(hwm/4)+' ワード（'+hwm+' B）</b>'+
        ' ／ '+(used>cap
          ? '<span class="warn">スタックオーバーフロー。隣のメモリ（別タスクの TCB やスタック）を黙って壊す。原因と症状が別のタスクに現れる</span>'
          : (ok?'<span class="ok">余裕 '+f(100*hwm/cap,0)+' %。30〜50 % を目安に</span>'
               :'<span class="warn">余裕が '+f(100*hwm/cap,0)+' % しかない。エラー処理経路を通ると溢れる可能性がある</span>'))+
        ' ／ <b class="warn">High Water Mark は「まだ深い経路を通っていない」だけかもしれない</b>。'+
        'エラー処理も含めてテストし、-fstack-usage で静的にも確認すること'+
        (spf.checked?' ／ <span class="warn">printf は単独で 1〜2 KB 使う。ログ専用タスクに集約すること</span>':'');
    }
    [ssz,sdep,sloc,sisr].forEach(function(s){s.input.addEventListener("input",draw);});
    [spf,sfpu].forEach(function(c){c.addEventListener("change",draw);});
    reg(cv,draw);
  };

  /* ---------- 18: 割り込みレイテンシ ---------- */
  REG.isrlatency=function(el){
    head(el,"Interrupt Latency","クリティカルセクションの長さが、そのまま乗る");
    var cv=screen(el,172),cc=cctx(cv);
    var row=ctrls(el);
    var scs=slider(row,"最長クリティカル区間 µs",0,200,30,5);
    var sisr=slider(row,"上位割り込み µs",0,150,20,5);
    var shw=slider(row,"HW 応答 サイクル",6,30,12,1);
    var sf=slider(row,"CPU クロック（MHz）",8,300,168,8);
    var shigh=checkbox(row,"この割り込みを configMAX_SYSCALL より高い優先度に置く（FreeRTOS API は呼べなくなる）",false);
    var out=readout(el);
    function draw(){
      var cs=+scs.input.value,up=+sisr.input.value,hw=+shw.input.value,fq=+sf.input.value;
      scs.val.textContent=cs+" µs";sisr.val.textContent=up+" µs";
      shw.val.textContent=hw+" cyc";sf.val.textContent=fq+" MHz";
      var hwus=hw/fq;
      var csEff=shigh.checked?0:cs;
      var total=hwus+csEff+up;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=18,padR=18,y=52,bh=44,BW=w-padL-padR;
      var mx=Math.max(total,1);
      lab(ctx,"割り込みが発生してから、ハンドラの処理が始まるまで",padL,24,C("--muted"),"left",11);
      var parts=[
        {n:"クリティカルセクション待ち",v:csEff,c:C("--alias")},
        {n:"上位割り込み",v:up,c:tcol(1)},
        {n:"ハードウェア応答",v:hwus,c:C("--blue")}
      ];
      var x=padL;
      parts.forEach(function(p){
        if(p.v<=0)return;
        var pw=p.v/mx*BW;
        ctx.fillStyle=p.c;ctx.fillRect(x,y,pw,bh);
        if(pw>110)lab(ctx,p.n+" "+f(p.v,1)+" µs",x+pw/2,y+bh/2+4,"#fff","center",9.5);
        else if(pw>34)lab(ctx,f(p.v,1),x+pw/2,y+bh/2+4,"#fff","center",9.5);
        x+=pw;
      });
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.strokeRect(padL,y,BW,bh);
      lab(ctx,"0",padL,y+bh+18,C("--muted"),"left",10);
      lab(ctx,f(mx,1)+" µs",padL+BW,y+bh+18,C("--muted"),"right",10);
      /* 凡例 */
      var lx=padL,ly=y+bh+40;
      ctx.font="10px "+C("--mono");
      parts.forEach(function(p){
        if(p.v<=0)return;
        var txt=p.n+" = "+f(p.v,2)+" µs";
        var tw2=ctx.measureText(txt).width+16;
        if(lx+tw2>w-padR){lx=padL;ly+=19;}
        ctx.fillStyle=p.c;rrect(ctx,lx,ly-9,11,11,3);ctx.fill();
        lab(ctx,txt,lx+16,ly,C("--muted"),"left",10);
        ctx.font="10px "+C("--mono");
        lx+=tw2+22;
      });
      out.innerHTML='割り込みレイテンシ = <b class="'+(total<20?"ok":"warn")+'">'+f(total,2)+' µs</b>'+
        '（ハードウェア '+f(hwus,2)+' + クリティカル '+f(csEff,1)+' + 上位割り込み '+up+'）'+
        ' ／ '+(shigh.checked
          ? '<b class="ok">configMAX_SYSCALL_INTERRUPT_PRIORITY より高い優先度なので、クリティカルセクションに止められない</b>'+
            ' ／ <span class="warn">その代わり、この ISR からは FreeRTOS API を一切呼べない</span>。'+
            '「API を呼べる」と「止められる」は同じことの裏表である（BASEPRI で実現されている）'
          : 'クリティカルセクションの長さがそのままレイテンシに乗る。<b>数マイクロ秒に抑えること</b>')+
        ' ／ <b class="warn">ISR の実行時間は 10 µs 以下</b>を目安に。本処理は遅延タスクへ回す'+
        '（この時間は 20 章の応答時間解析で、全タスクの応答時間に上乗せされる）';
    }
    [scs,sisr,shw,sf].forEach(function(s){s.input.addEventListener("input",draw);});
    shigh.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 19: デッドロック ---------- */
  REG.deadlock=function(el){
    head(el,"Deadlock","循環待ちを消せば、原理的に起きない");
    var cv=screen(el,230),cc=cctx(cv);
    var row=ctrls(el);
    var so=select(row,"タスク B のロック順序",
      ["Y → X（順序がバラバラ）","X → Y（順序規約を守る）"]);
    var sc=select(row,"タスク C を追加する",["追加しない","Z → X を追加（3 つ巴）"]);
    var out=readout(el);
    function draw(){
      var rev=(+so.value===0),third=(+sc.value===1);
      var LOCKS=third?["X","Y","Z"]:["X","Y"];
      var TASKS=[
        {n:"A",order:["X","Y"]},
        {n:"B",order:rev?["Y","X"]:["X","Y"]}
      ];
      if(third)TASKS.push({n:"C",order:rev?["Z","X"]:["X","Z"]});
      /* 最悪ケース: 各タスクが 1 つ目を取った状態 */
      var holds={},waits={};
      TASKS.forEach(function(t){holds[t.order[0]]=t.n;});
      TASKS.forEach(function(t){
        var want=t.order[1];
        if(holds[want]&&holds[want]!==t.n)waits[t.n]=want;
      });
      /* 循環検出 */
      function cyclic(){
        for(var i=0;i<TASKS.length;i++){
          var seen={},cur=TASKS[i].n;
          for(var k=0;k<TASKS.length+2;k++){
            var lk=waits[cur];if(!lk)break;
            var nx=holds[lk];if(!nx)break;
            if(seen[nx])return true;
            seen[nx]=1;cur=nx;
            if(cur===TASKS[i].n)return true;
          }
        }
        return false;
      }
      var dead=cyclic();
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var n=TASKS.length;
      var TX=w*0.26,LX=w*0.72;
      var tpos={},lpos={};
      TASKS.forEach(function(t,i){tpos[t.n]=[TX,54+i*Math.min(66,(h-90)/n)];});
      LOCKS.forEach(function(l,i){lpos[l]=[LX,54+i*Math.min(66,(h-90)/LOCKS.length)];});
      lab(ctx,"タスク",TX,30,C("--muted"),"center",11);
      lab(ctx,"ミューテックス",LX,30,C("--muted"),"center",11);
      /* 辺 */
      function arrow(p,q,col,dash,txt,fr){
        ctx.strokeStyle=col;ctx.lineWidth=2;
        if(dash)ctx.setLineDash([5,4]);
        var a=Math.atan2(q[1]-p[1],q[0]-p[0]);
        var x1=p[0]+26*Math.cos(a),y1=p[1]+26*Math.sin(a);
        var x2=q[0]-30*Math.cos(a),y2=q[1]-30*Math.sin(a);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=col;ctx.beginPath();
        ctx.moveTo(x2,y2);
        ctx.lineTo(x2-9*Math.cos(a-0.4),y2-9*Math.sin(a-0.4));
        ctx.lineTo(x2-9*Math.cos(a+0.4),y2-9*Math.sin(a+0.4));
        ctx.closePath();ctx.fill();
        if(txt)lab(ctx,txt,x1+(x2-x1)*(fr||0.5),y1+(y2-y1)*(fr||0.5)-6,col,"center",9.5);
      }
      LOCKS.forEach(function(l){
        if(holds[l])arrow(lpos[l],tpos[holds[l]],C("--signal"),false,"保持");
      });
      TASKS.forEach(function(t){
        if(waits[t.n])arrow(tpos[t.n],lpos[waits[t.n]],C("--alias"),true,"待つ",0.24+0.46*TASKS.indexOf(t)/Math.max(TASKS.length-1,1));
      });
      /* ノード */
      TASKS.forEach(function(t){
        var p=tpos[t.n];
        ctx.fillStyle=waits[t.n]?C("--alias"):C("--signal");
        ctx.beginPath();ctx.arc(p[0],p[1],22,0,TAU);ctx.fill();
        lab(ctx,t.n,p[0],p[1]+5,"#fff","center",14);
        lab(ctx,t.order.join(" → "),p[0]-30,p[1]+5,C("--muted"),"right",9.5);
      });
      LOCKS.forEach(function(l){
        var p=lpos[l];
        ctx.fillStyle=C("--panel");
        rrect(ctx,p[0]-24,p[1]-18,48,36,7);ctx.fill();
        ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;
        rrect(ctx,p[0]-24,p[1]-18,48,36,7);ctx.stroke();
        lab(ctx,"mutex"+l,p[0],p[1]+4,C("--ink"),"center",10);
      });
      if(dead){
        ctx.fillStyle=C("--alias");
        lab(ctx,"循環待ちが成立 → デッドロック",w/2,h-12,C("--alias"),"center",12);
      } else {
        lab(ctx,"循環がないので、必ず誰かが進める",w/2,h-12,C("--signal"),"center",12);
      }
      out.innerHTML=(dead
        ? '<b class="warn">デッドロック。</b>Coffman の 4 条件（相互排除・保持と待機・横取り不可・<b>循環待ち</b>）が全部揃っている'+
          ' ／ 4 条件のうち<b>どれか 1 つを崩せば起きない</b>。最も実用的なのは「循環待ちを消す」＝<b class="ok">ロック順序を決める</b>'
        : '<b class="ok">デッドロックは起きない。</b>全タスクが同じ順序（'+LOCKS.join(" → ")+'）でしか取らないので、循環が発生しえない'+
          ' ／ Linux カーネルも同じ方式で、ロック順序をドキュメントに明記し、lockdep で実行時に検証している')+
        ' ／ <b>より確実なのは「ミューテックスをネストしない」設計</b>。1 度に 1 つしか持たなければ、条件 2（保持と待機）自体が消える'+
        ' ／ タイムアウトによる回避は対症療法で、<span class="warn">ライブロックになりうる</span>。最悪時間が保証できないのでリアルタイムには向かない';
    }
    [so,sc].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);
  };

  /* ---------- 20: 利用率境界 ---------- */
  REG.rmbound=function(el){
    head(el,"Utilization Bound","70 % という経験則の出どころ");
    var cv=screen(el,210),cc=cctx(cv);
    var row=ctrls(el);
    var sn=slider(row,"タスク数 n",1,10,3,1);
    var su=slider(row,"CPU 利用率 U（%）",10,100,75,1);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,U=+su.input.value/100;
      sn.val.textContent=n+" 個";su.val.textContent=(U*100).toFixed(0)+" %";
      var B=function(k){return k*(Math.pow(2,1/k)-1);};
      var b=B(n);
      var ch=chart(cc,1,10,0.6,1.02,{l:52,r:22,t:24,b:32});
      grid(ch,4);
      var pts=[];for(var k=1;k<=10;k+=0.25)pts.push([k,B(k)]);
      line(ch,pts,C("--signal"),2.4);
      /* ln2 */
      var l2=Math.log(2);
      ch.ctx.strokeStyle=C("--faint");ch.ctx.setLineDash([5,4]);ch.ctx.lineWidth=1.2;
      ch.ctx.beginPath();ch.ctx.moveTo(ch.p.l,ch.Y(l2));ch.ctx.lineTo(ch.w-ch.p.r,ch.Y(l2));
      ch.ctx.stroke();ch.ctx.setLineDash([]);
      lab(ch.ctx,"ln2 = 0.693",ch.w-ch.p.r-4,ch.Y(l2)+13,C("--faint"),"right",10);
      /* 現在の U */
      ch.ctx.strokeStyle=C("--alias");ch.ctx.lineWidth=1.8;ch.ctx.setLineDash([4,3]);
      ch.ctx.beginPath();ch.ctx.moveTo(ch.p.l,ch.Y(Math.min(U,1.02)));
      ch.ctx.lineTo(ch.w-ch.p.r,ch.Y(Math.min(U,1.02)));ch.ctx.stroke();ch.ctx.setLineDash([]);
      lab(ch.ctx,"U = "+(U*100).toFixed(0)+"%",ch.p.l+4,ch.Y(Math.min(U,1.02))-6,C("--alias"),"left",10.5);
      dot(ch,n,b,5.5,C("--signal"));
      axis(ch);
      lab(ch.ctx,"利用率境界",ch.p.l+2,13,C("--muted"),"left",10.5);
      lab(ch.ctx,"タスク数 n",ch.w-ch.p.r,13,C("--muted"),"right",10.5);
      for(var i=1;i<=10;i++)lab(ch.ctx,String(i),ch.X(i),ch.h-ch.p.b+17,C("--faint"),"center",9);
      [0.7,0.8,0.9,1.0].forEach(function(v){
        lab(ch.ctx,(v*100).toFixed(0)+"%",ch.p.l-6,ch.Y(v)+4,C("--muted"),"right",9.5);
      });
      var pass=U<=b+1e-9;
      out.innerHTML='n = '+n+' の利用率境界 = n(2^(1/n) − 1) = <b>'+f(b*100,1)+' %</b>'+
        ' ／ 現在の U = <b>'+f(U*100,1)+' %</b>'+
        ' ／ '+(pass
          ? '<b class="ok">境界を満たしている → レートモノトニックで全タスクが必ず期限を守る</b>（十分条件）'
          : (U<=1
            ? '<span class="warn">境界を超えている。「間に合わないかもしれない」だけで、間に合わないとは限らない</span>。応答時間解析で個別に確認すること'
            : '<span class="warn">U &gt; 100 %。どんなスケジューラでも物理的に不可能</span>'))+
        ' ／ n → ∞ の極限が <b>ln2 ≈ 69.3 %</b>。これが「CPU 使用率を 70 % 以下に」という経験則の根拠である'+
        ' ／ <b>この境界は十分条件であって必要条件ではない</b>。U = 90 % でも間に合う場合はいくらでもある';
    }
    [sn,su].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 20: 応答時間解析 ---------- */
  REG.rta=function(el){
    head(el,"Response Time Analysis","反復で不動点を求める。これが正確な判定");
    var row=ctrls(el);
    var c1=slider(row,"A の実行時間 C（ms）",0.5,6,1,0.5);
    var t1=slider(row,"A の周期 T（ms）",2,30,4,1);
    var row2=ctrls(el);
    var c2=slider(row2,"B の実行時間 C（ms）",0.5,10,2,0.5);
    var t2=slider(row2,"B の周期 T（ms）",3,40,6,1);
    var row3=ctrls(el);
    var c3=slider(row3,"C の実行時間 C（ms）",0.5,14,2,0.5);
    var t3=slider(row3,"C の周期 T（ms）",4,80,12,1);
    var sb=slider(row3,"ブロッキング時間 B（ms・優先度逆転）",0,6,0,0.5);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var TS=[
        {n:"A",C:+c1.input.value,T:+t1.input.value},
        {n:"B",C:+c2.input.value,T:+t2.input.value},
        {n:"C",C:+c3.input.value,T:+t3.input.value}
      ];
      var B=+sb.input.value;
      c1.val.textContent=f(TS[0].C,1)+" ms";t1.val.textContent=TS[0].T+" ms";
      c2.val.textContent=f(TS[1].C,1)+" ms";t2.val.textContent=TS[1].T+" ms";
      c3.val.textContent=f(TS[2].C,1)+" ms";t3.val.textContent=TS[2].T+" ms";
      sb.val.textContent=f(B,1)+" ms";
      /* レートモノトニック: 周期の短い順に高優先度 */
      var ord=TS.slice().sort(function(a,b){return a.T-b.T;});
      var rows=[],allok=true,U=0;
      TS.forEach(function(t){U+=t.C/t.T;});
      ord.forEach(function(t,i){
        var hp=ord.slice(0,i);
        var R=t.C+B,steps=[f(t.C+B,2)],ok=true,it=0;
        for(;;){
          var nx=t.C+B;
          hp.forEach(function(j){nx+=Math.ceil(R/j.T)*j.C;});
          it++;
          if(Math.abs(nx-R)<1e-9){R=nx;break;}
          R=nx;steps.push(f(R,2));
          if(R>t.T||it>40){ok=false;break;}
        }
        if(R>t.T+1e-9)ok=false;
        if(!ok)allok=false;
        rows.push([
          "<b>"+t.n+"</b>",
          i===0?"最高":(i===ord.length-1?"最低":"中"),
          f(t.C,1),f(t.T,0),
          steps.join(" → ")+(ok?"":" …発散"),
          '<b class="'+(ok?"ok":"warn")+'">'+(ok?f(R,2):"> "+f(t.T,0))+'</b>',
          ok?"✓ 間に合う":"✗ 期限超過"
        ]);
      });
      out2.innerHTML=
        '<div style="color:var(--muted);margin-bottom:.3rem">R = C + B + Σ ⌈R / Tj⌉ × Cj　（優先度は周期の短い順＝レートモノトニック）</div>'+
        tbl(["タスク","優先度","C","T=D","反復の経過","最悪応答 R","判定"],rows);
      out.innerHTML='CPU 利用率 <b>'+f(U*100,1)+' %</b>'+
        ' ／ '+(allok
          ? '<b class="ok">全タスクが期限を守る（R ≤ D）</b>。利用率境界を超えていても、応答時間解析で通ればよい'
          : '<span class="warn">期限を守れないタスクがある</span>。周期を延ばす／実行時間を削る／優先度を見直すこと')+
        ' ／ 天井関数 ⌈R / Tj⌉ は「R の間に高優先度タスクが何回起動されるか」。'+
        '起動タイミングが最悪の場合を考えるので切り上げになる'+
        (B>0?' ／ <b>B = '+f(B,1)+' ms</b> は優先度逆転による待ち時間。<b class="ok">優先度継承があるからこれを有限の値として計算できる</b>（13 章）':
             ' ／ 実際には、これに<b>ブロッキング B・ジッタ・切り替えコスト・割り込み負荷</b>を足す必要がある');
    }
    [c1,t1,c2,t2,c3,t3,sb].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 21: 実行時間統計 ---------- */
  REG.runtimestats=function(el){
    head(el,"Run-Time Stats","IDLE の割合が、そのまま余裕である");
    var cv=screen(el,210),cc=cctx(cv);
    var row=ctrls(el);
    var s1=slider(row,"Control の負荷（%）",0,60,13,1);
    var s2=slider(row,"Comm の負荷（%）",0,60,6,1);
    var s3=slider(row,"Display の負荷（%）",0,60,4,1);
    var s4=slider(row,"ISR の負荷（%）",0,40,2,1);
    var sf=slider(row,"統計用タイマの周波数（kHz）",1,200,20,1);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var v=[+s1.input.value,+s2.input.value,+s3.input.value],isr=+s4.input.value;
      var fk=+sf.input.value;
      s1.val.textContent=v[0]+" %";s2.val.textContent=v[1]+" %";s3.val.textContent=v[2]+" %";
      s4.val.textContent=isr+" %";sf.val.textContent=fk+" kHz";
      var names=["Control","Comm","Display","Tmr Svc","LogTask"];
      var extra=[1,0.4];
      var tot=v[0]+v[1]+v[2]+isr+extra[0]+extra[1];
      var idle=Math.max(0,100-tot);
      var parts=[
        {n:"IDLE",v:idle,c:C("--faint")},
        {n:"Control",v:v[0],c:tcol(0)},
        {n:"Comm",v:v[1],c:tcol(1)},
        {n:"Display",v:v[2],c:tcol(2)},
        {n:"Tmr Svc",v:extra[0],c:tcol(3)},
        {n:"LogTask",v:extra[1],c:tcol(4)},
        {n:"（ISR）",v:isr,c:C("--alias")}
      ];
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=96,padR=70,y0=28,rh=Math.min(26,(h-40)/parts.length);
      parts.forEach(function(p,i){
        var y=y0+i*rh;
        var bw=(w-padL-padR)*p.v/100;
        ctx.fillStyle=p.c;rrect(ctx,padL,y+2,Math.max(2,bw),rh-8,3);ctx.fill();
        lab(ctx,p.n,padL-6,y+rh/2+2,C("--muted"),"right",10);
        lab(ctx,f(p.v,1)+" %",padL+Math.max(2,bw)+6,y+rh/2+2,C("--muted"),"left",10);
      });
      /* オーバーフロー時間 */
      var ovf=Math.pow(2,32)/(fk*1000);
      out2.innerHTML=
        '<div style="color:var(--muted)">vTaskGetRunTimeStats() の出力イメージ</div>'+
        tbl(["Task","Abs Time","% Time"],
          parts.filter(function(p){return p.n!=="（ISR）";}).map(function(p){
            return [p.n,String(Math.round(p.v*1e6/100)),f(p.v,0)+" %"];
          }));
      out.innerHTML='CPU の余裕（IDLE）= <b class="'+(idle>30?"ok":"warn")+'">'+f(idle,1)+' %</b>'+
        ' ／ ISR が '+isr+' % を無条件に奪っている（<b>どのタスクよりも優先度が高い</b>ので、'+
        '20 章では最高優先度タスクとして扱う）'+
        ' ／ 統計タイマ '+fk+' kHz なら 32 bit カウンタは <b>'+f(ovf,1)+' 秒</b>で折り返す'+
        (ovf<60?'。<span class="warn">短すぎる。定期的にリセットするか、より粗いタイマを使うこと</span>'
               :'。<b class="ok">ティック周波数の 10〜100 倍が目安</b>')+
        ' ／ <b class="warn">vTaskGetRunTimeStats() と vTaskList() は内部で vTaskSuspendAll() を呼ぶ</b>。'+
        '本番では使わず、uxTaskGetSystemState() で生データだけ取って整形は PC 側で行うこと';
    }
    [s1,s2,s3,s4,sf].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 22: 設計レビュー用チェックリスト ---------- */
  REG.checklist=function(el){
    head(el,"Review Checklist","分野を選んで、設計・コードレビューで使う");
    var CL={
      "設計段階":[
        ["タスク数は 15 個以内か","1 タスクあたり数百 B〜数 KB。RAM が尽きる（02 章）"],
        ["各タスクは「独立して待つもの」か","待ちが共通なら 1 タスクでよい（02 章）"],
        ["優先度はレートモノトニックか","周期の短いタスクほど高優先度。実行時間で決めない（20 章）"],
        ["優先度 0 を使っていないか","アイドルタスク専用（09 章）"],
        ["共有データを一覧にしたか","誰が読み、誰が書くかを表にする（19 章）"],
        ["ミューテックスに順序番号を振ったか","循環待ちを防ぐ唯一の実用的な方法（19 章）"],
        ["CPU 利用率の見積りは 70 % 以下か","利用率境界。将来の機能追加の余地も残る（20 章）"],
        ["静的確保にできないか","ヒープ不足で NULL が返る可能性が消える（16 章）"]
      ],
      "タスク実装":[
        ["ループにブロックする API があるか","ビジーウェイトは低優先度を飢えさせる（02・06 章）"],
        ["タスク関数から return していないか","戻る先がない。vTaskDelete(NULL) を書く（02 章）"],
        ["周期処理に vTaskDelayUntil を使っているか","vTaskDelay は誤差が累積する（08 章）"],
        ["大きな配列をローカルに置いていないか","static かヒープへ（17 章）"],
        ["再帰・VLA・alloca を使っていないか","スタック深さが計算できなくなる（17 章）"],
        ["printf を高優先度タスクから直接呼んでいないか","単独で 1〜2 KB。ログタスクに集約（17・21 章）"]
      ],
      "排他制御":[
        ["ロックにミューテックスを使っているか","バイナリセマフォには優先度継承がない（12・13 章）"],
        ["ミューテックスを持ったままブロックしていないか","最重要。継承をもってしても救えない（13 章）"],
        ["ミューテックスをネストしていないか","デッドロックと連鎖継承の限界（13・19 章）"],
        ["クリティカルセクションは数 µs 以下か","割り込みレイテンシに直結（18・19 章）"],
        ["クリティカルセクション内でブロックしていないか","切り替えられないので永久に止まる（06 章）"],
        ["static 変数を持つ関数を複数タスクから呼んでいないか","再入問題（19 章）"],
        ["確認と実行を分けていないか","TOCTOU。API は内部で原子的（19 章）"]
      ],
      "割り込み":[
        ["ISR から FromISR 版だけを呼んでいるか","通常版はブロックしうる（18 章）"],
        ["portYIELD_FROM_ISR を書いたか","忘れると応答が 1 ティック遅れる（18 章）"],
        ["xHigherPriorityTaskWoken を pdFALSE で初期化したか","未初期化だと誤動作（11・18 章）"],
        ["割り込み優先度は configMAX_SYSCALL 以下か","超えると API を呼べない。configASSERT で捕まる（18 章）"],
        ["configPRIO_BITS をチップに合わせたか","論理優先度とレジスタ値の混同が事故の元（18 章）"],
        ["優先度グルーピングを全ビット割り当てにしたか","FreeRTOS はサブ優先度を使わない前提（18 章）"],
        ["ISR は 10 µs 以下か","全タスクの応答時間に上乗せされる（18・20 章）"]
      ],
      "フックとタイマ":[
        ["タイマコールバックでブロックしていないか","全タイマが道連れになる（15 章）"],
        ["アイドルフックでブロックしていないか","走るタスクがゼロになる（09 章）"],
        ["vApplicationTickHook で FromISR 版を使っているか","ここは ISR コンテキスト（09 章）"],
        ["タイマタスクのスタックは足りるか","既定値は最小サイズ。printf 1 行で溢れる（15・17 章）"],
        ["xTimerStart の戻り値を見ているか","コマンドキュー満杯で静かに失敗する（15 章）"]
      ],
      "検証":[
        ["configASSERT を定義したか","300 か所以上の無料のチェック（03・21 章）"],
        ["configCHECK_FOR_STACK_OVERFLOW = 2 か","開発中は必須（17 章）"],
        ["全タスクの High Water Mark を確認したか","エラー処理経路も含めて（17 章）"],
        ["xPortGetMinimumEverFreeHeapSize を確認したか","最も苦しかったときの残量（16 章）"],
        ["デッドラインミスをカウントしているか","xTaskDelayUntil の戻り値で分かる（08・20 章）"],
        ["生成 API・送信 API の戻り値を確認しているか","静かな失敗が最も厄介"],
        ["49.7 日（ティック折り返し）を跨ぐ試験をしたか","32 bit・1 kHz での折り返し（08・10 章）"]
      ]
    };
    var keys=Object.keys(CL);
    var row=ctrls(el);
    var ssel=select(row,"分野",keys);
    var wrap=mk("div","wscreen");wrap.style.padding=".7rem";el.appendChild(wrap);
    var out=readout(el);
    var state={};
    function render(){
      var k=keys[+ssel.value],items=CL[k];
      var h='<div style="display:flex;flex-direction:column;gap:.3rem">';
      items.forEach(function(it,i){
        var id=k+"#"+i,on=!!state[id];
        h+='<div data-id="'+esc(id)+'" style="cursor:pointer;padding:.3rem .1rem;display:flex;gap:.5rem;align-items:flex-start">'+
           '<span style="flex:none;color:var('+(on?"--signal":"--faint")+');font-family:var(--mono)">'+
           (on?"☑":"☐")+'</span><span>'+
           '<span style="'+(on?"color:var(--muted);text-decoration:line-through":"")+'">'+esc(it[0])+'</span>'+
           '<div style="color:var(--muted);font-size:.86em;margin-left:0">→ '+esc(it[1])+'</div></span></div>';
      });
      h+='</div>';
      wrap.innerHTML=h;
      wrap.querySelectorAll("[data-id]").forEach(function(d){
        d.addEventListener("click",function(){
          var id=d.getAttribute("data-id");state[id]=!state[id];render();});
      });
      var done=items.filter(function(_,i){return state[k+"#"+i];}).length;
      out.innerHTML='<b>'+done+' / '+items.length+'</b> 項目'+
        (done<items.length?' ／ <span class="warn">未確認 '+(items.length-done)+' 項目</span>':' ／ <span class="ok">この分野は確認済み</span>')+
        ' ／ クリックでチェックできます（設計レビューで使ってください）';
    }
    ssel.addEventListener("change",render);
    reg(null,render);render();
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
