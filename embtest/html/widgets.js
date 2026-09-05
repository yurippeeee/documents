/* 組み込みブラックボックステスト編 — 章内インタラクティブ部品 */
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



  /* ============ 01. oracle ============ */
  REG.oracle=function(el){
    head(el,"DEMO","仕様の 1 文 → 観測点とオラクル");
    var SPECS=[
      ["ボタンを押すと LED が点く","GPIO をロジアナで観測（4章）／消費電流の変化（3章）","押下→数十 ms 以内に該当 GPIO が H、電流が増える"],
      ["10 秒無操作でスリープに入る","消費電流を PPK2 で観測（3章）","10 秒後に電流が µA 級へ落ちる。落ちなければ NG"],
      ["温度が 80℃ を超えたら警報を出す","偽センサで温度注入（6章）＋BLE通知/GPIO観測（9章）","79→OK・80→？・81→警報。境界の取り違えを暴く"],
      ["BLE で送った設定が保存される","GATT に write→再接続して read（9章）","書いた値が電源再投入後も read で返る"],
      ["電源瞬断から正常復帰する","プログラマブル電源で瞬断（16章）＋起動観測","瞬断後に既定状態へ。設定・データが壊れない"]
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var btns=SPECS.map(function(s){return button(bar,s[0].length>14?s[0].slice(0,13)+"…":s[0]);});
    var pn=panel(el,120),out=readout(el);
    function show(i){
      var s=SPECS[i];btns.forEach(function(b,j){b.setAttribute("aria-pressed",j===i?"true":"false");});
      pn.innerHTML=tbl(["段","内容"],[
        ["<b>仕様</b>","<span style=\"color:var(--ink)\">"+esc(s[0])+"</span>"],
        ["<b style=\"color:var(--signal)\">観測点</b>",esc(s[1])],
        ["<b style=\"color:var(--alias)\">オラクル（合否判定）</b>",esc(s[2])]
      ],["left","left"]);
    }
    btns.forEach(function(b,i){b.addEventListener("click",function(){show(i);});});
    show(2);
    out.innerHTML='どんな仕様も「どこを観測すれば・何が起きれば合格か」に翻訳できる。これがブラックボックスの出発点';
  };

  /* ============ 02. decompose ============ */
  REG.decompose=function(el){
    head(el,"DEMO","刺激 → 観測 → 判定 に分解する");
    var row=ctrls(el);
    var sel=select(row,"検証したい仕様",[
      "温度 80℃ 超で警報","ボタン長押しで工場出荷リセット","無通信 30 秒で再接続を試みる","過電流でモーターを停止"]);
    var DATA=[
      ["偽センサで 81℃ を注入","警報 GPIO / BLE 通知を観測","1 秒以内に警報が出る"],
      ["ボタン線を 3 秒 L に駆動","設定領域の値・LED を観測","設定が既定に戻り、確認 LED が点滅"],
      ["Wi-Fi を切って 30 秒待つ","パケットキャプチャで再接続要求を観測","30±5 秒で再接続を開始する"],
      ["偽の電流センサで過電流値を注入","モーター駆動 PWM をオシロで観測","規定時間内に PWM が 0（停止）へ"]
    ];
    var pn=panel(el,120),out=readout(el);
    function render(){
      var d=DATA[+sel.value];
      pn.innerHTML='<div style="display:flex;gap:.5rem;flex-wrap:wrap">'+
        ['① 刺激,'+d[0]+',var(--signal)','② 観測,'+d[1]+',var(--blue)','③ 判定,'+d[2]+',var(--alias)']
        .map(function(x){var p=x.split(",");return '<div style="flex:1;min-width:150px;border:1px solid '+p[2]+
          ';border-radius:8px;padding:.5rem .6rem;background:var(--panel)"><b style="color:'+p[2]+'">'+p[0]+
          '</b><div style="margin-top:.3rem;line-height:1.5">'+esc(p[1])+'</div></div>';}).join("")+'</div>';
    }
    sel.addEventListener("change",render);render();
    out.innerHTML='「刺激なしの観測」はモニタリング。テストは必ず 3 段そろって初めて合否が言える';
  };

  /* ============ 03. current ============ */
  REG.current=function(el){
    head(el,"DEMO","電流波形から状態を読み、電池寿命を見積もる");
    var row=ctrls(el);
    var slSleep=slider(row,"スリープに入る",0,1,1,1);
    var slInt=slider(row,"送信間隔（秒）",1,60,10,1);
    var cv=screen(el,200),cc=cctx(cv),out=readout(el);
    function draw(){
      var sleepOn=+slSleep.input.value, iv=+slInt.input.value;
      slSleep.val.textContent=sleepOn?"する（正しい）":"しない（バグ）";
      slInt.val.textContent=iv+" s";
      var c=chart(cc,0,10,0,25,{l:46,b:26,t:14});
      grid(c,4);axis(c);
      lab(c.ctx,"mA",8,c.p.t+4,C("--muted"),"left",10);
      // build waveform over 10s window
      var sleepI=sleepOn?0.01:8, actI=6, txI=22;
      var pts=[],t;
      for(t=0;t<=10;t+=0.02){
        var phase=t%iv, cur=sleepI;
        if(phase<0.3)cur=actI;                 // wake+process
        if(phase>=0.3&&phase<0.45)cur=txI;     // tx burst
        pts.push([t,cur]);
      }
      line(c,pts,C("--signal"),2);
      // avg current
      var avg=(sleepI*(iv-0.45)+actI*0.3+txI*0.15)/iv;
      var mah=1000, life=mah/avg/24;
      out.innerHTML='平均電流 <b>'+f(avg,3)+' mA</b> → 1000 mAh 電池で約 <b>'+
        (life>2?f(life,1)+' 日':f(life*24,1)+' 時間')+'</b>。'+
        (sleepOn?'<b class="ok">スリープが効いている</b>':'<b style="color:var(--alias)">スリープに入らず、電池が数十倍速く減る（AI 生成コードで頻出の欠陥）</b>');
    }
    reg(cv,draw);[slSleep,slInt].forEach(function(s){s.input.addEventListener("input",draw);});draw();
  };

  /* ============ 04. sample ============ */
  REG.sample=function(el){
    head(el,"DEMO","サンプリングレートとデコードの成否");
    var row=ctrls(el);
    var slRate=slider(row,"サンプリング倍率（信号速度比）",1,12,8,1);
    var cv=screen(el,190),cc=cctx(cv),out=readout(el);
    var BITS=[1,0,1,1,0,0,1,0];  // signal pattern
    function draw(){
      var mult=+slRate.input.value;slRate.val.textContent=mult+"×";
      var c=chart(cc,0,8,-0.3,1.4,{l:30,b:24,t:14});
      // true signal (step)
      var tp=[];for(var i=0;i<=8;i+=0.01){tp.push([i,BITS[Math.min(7,Math.floor(i))]]);}
      line(c,tp,C("--line"),1.5);
      // samples
      var N=mult, ok=mult>=4;
      var sp=[];
      for(var k=0;k<=N*8;k++){var x=k/N;if(x>8)break;var b=BITS[Math.min(7,Math.floor(x+1e-6))];sp.push([x,b]);
        dot(c,x,b,3,ok?C("--signal"):C("--alias"));}
      // reconstructed
      line(c,sp,ok?C("--signal"):C("--alias"),1.8,ok?null:[5,4]);
      lab(c.ctx,"元の 0/1",c.p.l+4,c.p.t+10,C("--muted"),"left",10);
      out.innerHTML=ok?
        '<b class="ok">デコード成功</b>：'+BITS.join("")+' を正しく復元。目安の 4× 以上を満たす':
        '<b style="color:var(--alias)">デコード失敗</b>：標本が粗く、短いビットを取りこぼして別の列に化ける。「読めない」ときはまずレートを疑う';
    }
    reg(cv,draw);slRate.input.addEventListener("input",draw);draw();
  };

  /* ============ 05. uart ============ */
  REG.uart=function(el){
    head(el,"DEMO","パルス幅からボーレートを割り出す");
    var row=ctrls(el);
    var slBaud=slider(row,"設定ボーレート",0,4,2,1);
    var BAUDS=[9600,19200,38400,57600,115200];
    var cv=screen(el,150),cc=cctx(cv);var out=readout(el);
    var TRUE=115200, MSG="OK>";
    function draw(){
      var bi=+slBaud.input.value,baud=BAUDS[bi];slBaud.val.textContent=baud+" bps";
      var c=chart(cc,0,10,-0.3,1.4,{l:20,b:20,t:12});
      // draw the actual line (bits of MSG at TRUE baud), time axis in "true bit" units
      var bits=[1];  // idle high, start bit low then data
      // build one char frame '0'(start)+8 data LSB-first+1 stop
      var ch=MSG.charCodeAt(0);
      var fr=[0];for(var i=0;i<8;i++)fr.push((ch>>i)&1);fr.push(1);
      var wave=[];var tb=0;
      fr.forEach(function(bt){wave.push([tb,bt]);tb++;wave.push([tb,bt]);});
      line(c,wave.map(function(p){return [p[0],p[1]];}),C("--signal"),2);
      // sampling ticks at chosen baud
      var ratio=TRUE/baud;
      for(var s=0.5;s<10;s+=ratio){dot(c,s,0.5, 3, baud===TRUE?C("--blue"):C("--alias"));}
      out.innerHTML=(baud===TRUE)?
        '<b class="ok">一致</b>：1 ビット幅とサンプル間隔がそろい、"'+esc(MSG)+'" が読める':
        '<b style="color:var(--alias)">ずれ</b>：サンプル位置（点）がビット境界からずれ、文字化けする。最短パルス幅を測って合わせる';
    }
    reg(cv,draw);slBaud.input.addEventListener("input",draw);draw();
  };

  /* ============ 06. i2c ============ */
  REG.i2c=function(el){
    head(el,"DEMO","I²C の会話を読み、偽の値を返す");
    var row=ctrls(el);
    var sel=select(row,"偽センサが返す値",["25.0℃（正常）","-40.0℃（下限）","NaN 相当（0xFFFF）","NACK（応答なし）"]);
    var pn=panel(el,120),out=readout(el);
    var RAW=[["S","start"],["0x90","addr+W"],["0x00","reg=温度"],["Sr","restart"],["0x91","addr+R"]];
    var VALS=[
      ["0x0C 0x80","25.0℃","正常に表示",""],
      ["0xE7 0x00","-40.0℃","下限。クリップ処理が要る","color:var(--muted)"],
      ["0xFF 0xFF","異常値","無視 or エラー表示が正しい。そのまま表示や暴走は NG","color:var(--alias)"],
      ["(なし)","タイムアウト","再試行 or エラー。ハングは NG","color:var(--alias)"]
    ];
    function render(){
      var v=VALS[+sel.value];
      var cells=RAW.concat([[v[0]==="(なし)"?"—":v[0],"data"]]);
      pn.innerHTML='<div style="display:flex;gap:.25rem;flex-wrap:wrap;margin-bottom:.5rem">'+
        cells.map(function(x,i){var last=i===cells.length-1;
          return '<div style="border:1px solid '+(last?"var(--alias)":"var(--line)")+
          ';border-radius:6px;padding:.3rem .5rem;background:'+(last?"var(--alias-soft)":"var(--panel)")+
          '"><b style="font-family:var(--mono)">'+esc(x[0])+'</b><div style="font-size:.72rem;color:var(--muted)">'+x[1]+'</div></div>';}).join("")+'</div>'+
        '<div style="line-height:1.5">MCU の解釈: <b style="'+v[3]+'">'+esc(v[1])+'</b> — '+esc(v[2])+'</div>';
      out.innerHTML=(+sel.value>=2)?
        'ここが堅牢性の勝負所。本物のセンサは異常を出さないが、<b>偽センサなら意地悪ができる</b>':
        'まず正常な会話を読めることを確認してから、異常注入に進む';
    }
    sel.addEventListener("change",render);render();
  };

  /* ============ 07. analog ============ */
  REG.analog=function(el){
    head(el,"DEMO","電圧を掃引して ADC 校正と飽和を見る");
    var row=ctrls(el);
    var slV=slider(row,"注入電圧",0,3.3,1.65,0.01);
    var cv=screen(el,190),cc=cctx(cv),out=readout(el);
    // sensor: 10mV/℃, 0.5V at 0℃; ADC 12bit ref 3.3V, saturates
    function draw(){
      var v=+slV.input.value;slV.val.textContent=f(v,2)+" V";
      var c=chart(cc,0,3.3,-50,300,{l:48,b:26,t:14});
      grid(c,5);axis(c);
      lab(c.ctx,"℃",8,c.p.t+4,C("--muted"),"left",10);
      // transfer curve temp = (V-0.5)*100, clipped to sensor range -40..250
      var pts=[];for(var x=0;x<=3.3;x+=0.02){var tC=(x-0.5)*100;tC=Math.max(-40,Math.min(250,tC));pts.push([x,tC]);}
      line(c,pts,C("--line"),1.5);
      var tC=(v-0.5)*100, clip=false, disp=tC;
      if(disp<-40){disp=-40;clip=true;}if(disp>250){disp=250;clip=true;}
      dot(c,v,disp,4,clip?C("--alias"):C("--signal"));
      var adc=Math.round(v/3.3*4095);
      out.innerHTML='電圧 '+f(v,2)+' V → ADC <b>'+adc+'</b> カウント → 温度 <b>'+f(disp,1)+' ℃</b>。'+
        (clip?'<b style="color:var(--alias)">飽和／範囲外</b>：クリップされる。範囲外を検知しているか要確認':
        (v<0.5?'<span style="color:var(--muted)">0℃ 未満（負電圧に相当しない領域）</span>':'<b class="ok">正常範囲</b>'));
    }
    reg(cv,draw);slV.input.addEventListener("input",draw);draw();
  };

  /* ============ 08. debugport ============ */
  REG.debugport=function(el){
    head(el,"DEMO","止める観測 と 止めない観測");
    var bar=mk("div","btns");el.appendChild(bar);
    var b1=button(bar,"ブレークで止める"),b2=button(bar,"RTT/SWO で流す");
    var pn=panel(el,150),out=readout(el);
    function show(mode){
      b1.setAttribute("aria-pressed",mode===0?"true":"false");
      b2.setAttribute("aria-pressed",mode===1?"true":"false");
      if(mode===0){
        pn.innerHTML=tbl(["観測できる","代償"],[
          ["メモリ・レジスタ・変数を任意精度で","実行が止まる＝時間が凍る"],
          ["特定関数で確実に停止","BLE 接続がタイムアウトで切れる（数百 ms）"],
          ["ステップ実行で追える","リアルタイム処理・割り込みが乱れる"]
        ]);
        out.innerHTML='<b style="color:var(--alias)">原因究明には最強だが、タイミング・無線が絡む挙動は壊してしまう</b>';
      }else{
        pn.innerHTML=tbl(["観測できる","特徴"],[
          ["printf / 変数を高速に流し出す","実行を止めない（低侵襲）"],
          ["状態遷移をリアルタイムに追う","UART より速い。無線も切れない"],
          ["長時間のログ収集","ETM なら完全な命令トレース（高価）"]
        ]);
        out.innerHTML='<b class="ok">タイミングを乱さず内部を見る鍵。リアルタイム系・無線系のグレーボックス観測はこちら</b>';
      }
    }
    b1.addEventListener("click",function(){show(0);});
    b2.addEventListener("click",function(){show(1);});show(1);
  };

  /* ============ 09. ble_scan ============ */
  REG.ble_scan=function(el){
    head(el,"DEMO","アドバタイズを分解し、GATT を並べる");
    var row=ctrls(el);
    var sel=select(row,"受信したアドバタイズ",[
      "TempLogger（正常）","TL_devkit_SN12345（開発名残存）","生温度をブロードキャスト"]);
    var pn=panel(el,150),out=readout(el);
    var CASES=[
      {adv:[["02 01 06","Flags","接続可能・BR/EDR非対応"],["0B 09 54 65 6D 70 4C 6F 67 67 65 72","Name","\"TempLogger\""],["03 03 09 18","Service UUID","0x1809 体温計"]],
       gatt:[["0x1809 体温計","Service"],["0x2A1C 測定値","Read/Notify"],["0x2A1D しきい値","Read/Write"]],ok:1,note:"素直な設計。名前・サービスが素性を表す"},
      {adv:[["02 01 06","Flags",""],["12 09 54 4C 5F 64 65 76 6B 69 74 5F 53 4E 31 32 33 34 35","Name","\"TL_devkit_SN12345\""],["03 03 09 18","Service UUID","0x1809"]],
       gatt:[["0x1809 体温計","Service"],["0x2A1C 測定値","Read/Notify"]],ok:0,note:"開発機の名前とシリアルが製品に残存。追跡・情報漏れの元"},
      {adv:[["02 01 06","Flags",""],["05 FF 34 12 1C 0A","Manufacturer","生温度 25.8℃ を平文で"],["03 03 09 18","Service UUID","0x1809"]],
       gatt:[["0x1809 体温計","Service"],["0x2A1C 測定値","Read（無認証）"]],ok:0,note:"接続不要で測定値が読める。秘匿すべき値がアドバタイズに漏れている"}
    ];
    function render(){
      var d=CASES[+sel.value];
      pn.innerHTML='<div style="color:var(--muted);font-weight:600;margin-bottom:.3rem">アドバタイズの中身</div>'+
        tbl(["バイト列","種別","意味"],d.adv.map(function(a){return ['<code style="font-size:.75rem">'+a[0]+'</code>',a[1],esc(a[2])];}))+
        '<div style="color:var(--muted);font-weight:600;margin:.5rem 0 .3rem">接続後の GATT</div>'+
        tbl(["属性","権限"],d.gatt.map(function(g){return [g[0],g[1]];}));
      out.innerHTML=d.ok?'<b class="ok">'+esc(d.note)+'</b>':'<b style="color:var(--alias)">設計ミス: '+esc(d.note)+'</b>';
    }
    sel.addEventListener("change",render);render();
  };

  /* ============ 10. ble_fuzz ============ */
  REG.ble_fuzz=function(el){
    head(el,"DEMO","GATT に書き込んでファジング（生存確認つき）");
    var row=ctrls(el);
    var btn=button(row,"500 回ファジングを実行");
    var pn=panel(el,150),out=readout(el);
    function run(){
      var lengths=[0,1,20,255],log=[],alive=true,crashN=-1;
      for(var i=0;i<500&&alive;i++){
        var L=lengths[i%4];
        var reject=(L>64);           // 正しいファーム: 長すぎを拒否
        var hang=(L===255 && i>200 && Math.random()<0.02); // まれにバグ
        if(hang){alive=false;crashN=i;}
        if(i<6)log.push([i,L+" B",hang?"HANG":reject?"拒否(正常)":"受理"]);
      }
      pn.innerHTML=tbl(["#","長さ","結果"],log.map(function(r){
        return [r[0],r[1],r[2]==="HANG"?'<b style="color:var(--alias)">'+r[2]+'</b>':r[2]];}))+
        '<div style="margin-top:.4rem;color:var(--muted)">… 生存確認を毎回実行</div>';
      out.innerHTML=alive?
        '<b class="ok">500 回完了・ハングなし</b>。境界長を拒否し、生存確認が通り続けた':
        '<b style="color:var(--alias)">#'+crashN+' でハング検出</b>：255 B 書き込みで停止。この入力を保存＝再現できるバグに（生存確認が捕まえた）';
    }
    btn.addEventListener("click",run);
    pn.innerHTML='<span style="color:var(--muted)">ボタンを押すと、長さ 0/1/20/255 B を巡回しながら書き込み、毎回「まだ生きているか」を確認します。</span>';
    out.innerHTML='肝は<b>生存確認</b>。撃つたびに別経路で反応を確かめ、落ちた瞬間の入力を残す';
  };

  /* ============ 11. net_probe ============ */
  REG.net_probe=function(el){
    head(el,"DEMO","ポートスキャンとレイテンシ観測");
    var bar=mk("div","btns");el.appendChild(bar);
    var b1=button(bar,"nmap 風スキャン"),b2=button(bar,"API レイテンシ測定");
    var pn=panel(el,150),out=readout(el);
    function scan(){
      b1.setAttribute("aria-pressed","true");b2.setAttribute("aria-pressed","false");
      pn.innerHTML=tbl(["ポート","サービス","評価"],[
        ["80/tcp","http（設定 UI）","<span style=\"color:var(--muted)\">想定内</span>"],
        ["1883/tcp","mqtt","<span style=\"color:var(--muted)\">想定内</span>"],
        ["23/tcp","telnet","<b style=\"color:var(--alias)\">要注意: デバッグ用が残存</b>"],
        ["8080/tcp","http-alt（開発サーバ）","<b style=\"color:var(--alias)\">要注意: 想定外</b>"]
      ]);
      out.innerHTML='想定外のポート（telnet・開発サーバ）は攻撃面。製品ビルドで閉じるべき';
    }
    function lat(){
      b1.setAttribute("aria-pressed","false");b2.setAttribute("aria-pressed","true");
      var s=[],i;for(i=0;i<200;i++){var base=8+Math.random()*4;if(Math.random()<0.03)base+=40;s.push(base);}
      s.sort(function(a,b){return a-b;});
      var med=s[100],worst=s[199],avg=s.reduce(function(a,b){return a+b;},0)/s.length;
      pn.innerHTML=tbl(["指標","値","判定（デッドライン 100ms）"],[
        ["中央値",f(med,1)+" ms","<b class=\"ok\">OK</b>"],
        ["平均",f(avg,1)+" ms","<b class=\"ok\">OK</b>"],
        ["最悪値",f(worst,1)+" ms",worst>100?"<b style=\"color:var(--alias)\">超過の恐れ</b>":"<b class=\"ok\">OK</b>"]
      ]);
      out.innerHTML='平均が良くても、まれな大遅延（裾）がデッドラインを破ると故障（14 章）';
    }
    b1.addEventListener("click",scan);b2.addEventListener("click",lat);scan();
  };

  /* ============ 12. sdr_spec ============ */
  REG.sdr_spec=function(el){
    head(el,"DEMO","スペクトラムと OOK 変調のデコード");
    var row=ctrls(el);
    var slSym=slider(row,"シンボル速度の推定",1,8,4,1);
    var cv=screen(el,180),cc=cctx(cv),out=readout(el);
    var BITS=[1,1,0,1,0,0,1,0];  // OOK payload after preamble
    var TRUE=4;
    function draw(){
      var sym=+slSym.input.value;slSym.val.textContent="×"+sym;
      var c=chart(cc,0,8,-0.2,1.3,{l:20,b:22,t:12});
      // OOK envelope
      var env=[];for(var i=0;i<=8;i+=0.01){env.push([i,BITS[Math.min(7,Math.floor(i))]]);}
      line(c,env,C("--line"),1.4);
      // draw carrier bursts where bit=1
      var ctx=c.ctx;ctx.strokeStyle=C("--signal");ctx.lineWidth=1;ctx.beginPath();
      for(var x=0;x<8;x+=0.02){var b=BITS[Math.min(7,Math.floor(x))];var y=b?(1+0.12*Math.sin(x*120)):0;
        var px=c.X(x),py=c.Y(y);x===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}ctx.stroke();
      // sampling per estimated symbol rate
      var ok=(sym===TRUE);
      var decoded=[];for(var k=0;k<8*sym/TRUE;k++){var t=(k+0.5)*TRUE/sym;if(t>8)break;decoded.push(BITS[Math.min(7,Math.floor(t))]);
        dot(c,t,0.5,3,ok?C("--blue"):C("--alias"));}
      out.innerHTML=ok?
        '<b class="ok">復調成功</b>：ビット列 '+BITS.join("")+' を復元。次はプリアンブル・CRC を解いて意味へ':
        '<b style="color:var(--alias)">シンボル速度がずれ</b>：標本位置がビット境界からずれ、'+decoded.join("")+' と誤読。最短パルス幅から速度を測り直す';
    }
    reg(cv,draw);slSym.input.addEventListener("input",draw);draw();
  };

  /* ============ 13. usb_desc ============ */
  REG.usb_desc=function(el){
    head(el,"DEMO","USB 記述子から正体を読む");
    var row=ctrls(el);
    var sel=select(row,"接続された機器",["温度ロガー（CDC）","複合: CDC + 隠しストレージ"]);
    var pn=panel(el,150),out=readout(el);
    var CASES=[
      {tree:[["Device","VID=0x1234 PID=0x5678 / class=CDC",0],["Config","1 interface / bus-powered 100mA",1],["Interface 0","CDC-ACM（仮想シリアル）",1],["Endpoint","bulk IN/OUT",2],["String","\"TempLogger v1.2\"",1]],ok:1,note:"宣言（CDC）と機能が一致。文字列も素直"},
      {tree:[["Device","VID=0x1234 PID=0x5678 / class=Misc",0],["Config","2 interfaces",1],["Interface 0","CDC-ACM",1],["Interface 1","Mass Storage（想定外）",1],["String","\"TL_dev_SN12345\"",1]],ok:0,note:"余計な顔（ストレージ）と開発シリアルが残存。攻撃面が広がる"}
    ];
    function render(){
      var d=CASES[+sel.value];
      pn.innerHTML=d.tree.map(function(t){
        return '<div style="margin-left:'+(t[2]*1.2)+'rem;padding:.15rem 0"><b style="font-family:var(--mono);color:var(--signal)">'+t[0]+'</b> <span style="color:var(--muted)">'+esc(t[1])+'</span></div>';}).join("");
      out.innerHTML=d.ok?'<b class="ok">'+esc(d.note)+'</b>':'<b style="color:var(--alias)">'+esc(d.note)+'</b>';
    }
    sel.addEventListener("change",render);render();
    row.appendChild(mk("div","",'<span style="color:var(--muted);font-size:.78rem">lsusb -v 相当。宣言クラスと実機能・文字列を突き合わせる</span>'));
  };

  /* ============ 14. jitter ============ */
  REG.jitter=function(el){
    head(el,"DEMO","負荷を上げてレイテンシ分布を見る");
    var row=ctrls(el);
    var slLoad=slider(row,"負荷",0,100,20,1);
    var cv=screen(el,190),cc=cctx(cv),out=readout(el);
    function draw(){
      var load=+slLoad.input.value;slLoad.val.textContent=load+" %";
      // histogram: base latency grows and tail lengthens with load
      var base=5+load*0.15, tailP=load/100*0.15;
      var bins=new Array(24).fill(0),samples=[];
      for(var i=0;i<3000;i++){
        var v=base+Math.abs(gauss())*3;
        if(Math.random()<tailP)v+=30+Math.random()*40;
        samples.push(v);var b=Math.floor(v/5);if(b>=0&&b<24)bins[b]++;
      }
      samples.sort(function(a,b){return a-b;});
      var med=samples[1500],worst=samples[2970];
      var c=chart(cc,0,120,0,Math.max.apply(null,bins)*1.1,{l:40,b:26,t:12});
      grid(c,4);axis(c);
      var ctx=c.ctx;
      bins.forEach(function(n,i){if(!n)return;var x0=c.X(i*5),x1=c.X(i*5+5),y=c.Y(n),y0=c.Y(0);
        ctx.fillStyle=(i*5>100)?C("--alias"):C("--signal-soft");ctx.strokeStyle=(i*5>100)?C("--alias"):C("--signal");ctx.lineWidth=1;
        ctx.fillRect(x0+1,y,x1-x0-2,y0-y);ctx.strokeRect(x0+1,y,x1-x0-2,y0-y);});
      // deadline line
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.5;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(c.X(100),c.p.t);ctx.lineTo(c.X(100),c.h-c.p.b);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"締切 100ms",c.X(100)-4,c.p.t+10,C("--alias"),"right",10);
      lab(ctx,"ms",c.w-c.p.r,c.h-c.p.b+18,C("--muted"),"right",10);
      out.innerHTML='中央値 <b>'+f(med,1)+' ms</b>／最悪値 <b>'+f(worst,1)+' ms</b>。'+
        (worst>100?'<b style="color:var(--alias)">最悪値がデッドラインを超過</b>：負荷で裾が伸びた':'<b class="ok">締切内</b>');
    }
    var g2=null;function gauss(){if(g2!==null){var t=g2;g2=null;return t;}var u=Math.random(),v=Math.random();
      var r=Math.sqrt(-2*Math.log(u+1e-9));g2=r*Math.sin(6.283*v);return r*Math.cos(6.283*v);}
    reg(cv,draw);slLoad.input.addEventListener("input",draw);draw();
  };

  /* ============ 15. hil ============ */
  REG.hil=function(el){
    head(el,"DEMO","時刻付きシナリオを組んで走らせる");
    var pn=panel(el,150),out=readout(el);
    var STEPS=[
      ["t=0.0s","電源 3.3V 投入・起動","状態 = IDLE",true],
      ["t=1.0s","偽センサ 25℃","状態 = IDLE",true],
      ["t=2.0s","偽センサ 85℃ 注入","0.5s 以内に ALARM",true],
      ["t=2.4s","警報 GPIO を観測","ALARM 検出（成功）",true],
      ["t=3.0s","偽センサ 25℃ に戻す","0.5s 以内に IDLE 復帰",false]
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var btn=button(bar,"シナリオを実行");
    function render(ran){
      pn.innerHTML=tbl(["時刻","刺激","期待（オラクル）","結果"],STEPS.map(function(s){
        var res=ran?(s[3]?'<b class="ok">PASS</b>':'<b style="color:var(--alias)">FAIL</b>'):'<span style="color:var(--muted)">—</span>';
        return [s[0],esc(s[1]),esc(s[2]),res];}));
      out.innerHTML=ran?
        '<b style="color:var(--alias)">t=3.0s で FAIL</b>：温度が下がっても IDLE に戻らない（復帰漏れ）。HIL なら同じ筋書きを何度でも再現できる':
        '実機はそのまま、周囲（電源・センサ）を偽物で模擬。ボタンで実行';
    }
    btn.addEventListener("click",function(){render(true);});render(false);
  };

  /* ============ 16. fuzz ============ */
  REG.fuzz=function(el){
    head(el,"DEMO","全入口へのファジングと発見数");
    var row=ctrls(el);
    var sel=select(row,"攻める入口",["UART コマンド","BLE 書き込み","設定ファイル","ファーム更新パッケージ"]);
    var btn=button(row,"1000 ケース実行");
    var pn=panel(el,140),out=readout(el);
    var FINDINGS=[
      [["長さ 0 のコマンドでハング","境界"],["制御文字で表示崩れ","型/書式"]],
      [["255B 書き込みでハング","境界"],["初期化前 write を受理","順序"]],
      [["巨大な数値でオーバーフロー","境界"],["不正 JSON でクラッシュ","型/書式"]],
      [["署名不正を弾かない","順序/認証"],["切り詰めイメージでブリック","境界"]]
    ];
    function run(){
      var fs=FINDINGS[+sel.value];
      pn.innerHTML='<div style="margin-bottom:.3rem;color:var(--muted)">1000 ケース中 '+fs.length+' 件の不具合を検出（生存確認で捕捉）</div>'+
        tbl(["発見した不具合","軸"],fs.map(function(x){return ['<b style="color:var(--alias)">'+esc(x[0])+'</b>',x[1]];}));
      out.innerHTML='4 軸（境界・型/書式・順序・タイミング）で全入口を踏み荒らす。落ちた入力は保存して再現可能に';
    }
    btn.addEventListener("click",run);
    pn.innerHTML='<span style="color:var(--muted)">入口を選んで実行。境界・不正値・異常順序を自動生成して送り込みます。</span>';
    out.innerHTML='生成 AI 製ファームは例外処理が弱い。ここが最も落とし穴が見つかる領域';
  };

  /* ============ 17. attack ============ */
  REG.attack=function(el){
    head(el,"DEMO","攻撃面チェックリスト（自己監査）");
    var pn=panel(el,150),out=readout(el);
    var ITEMS=[
      ["通信キャプチャに平文の鍵・トークンが流れていないか","秘密"],
      ["フラッシュ吸い出しで鍵がべた書きされていないか","秘密"],
      ["BLE/HTTP/UART に無認証で書ける重要操作がないか","認証"],
      ["同じ通信のリプレイが通ってしまわないか","認証"],
      ["HTTPS の証明書検証をサボっていないか","通信"],
      ["デフォルト認証情報（admin/admin）が残っていないか","秘密"],
      ["製品でデバッグポートがロックされているか","デバッグ"],
      ["ファーム更新に署名検証があるか","更新"]
    ];
    var checked=ITEMS.map(function(){return false;});
    function render(){
      pn.innerHTML='<div style="display:flex;flex-direction:column;gap:.3rem">'+ITEMS.map(function(it,i){
        return '<label style="display:flex;gap:.5rem;align-items:flex-start;cursor:pointer;line-height:1.4">'+
          '<input type="checkbox" data-i="'+i+'"'+(checked[i]?" checked":"")+' style="margin:.15rem 0 0;accent-color:var(--signal);flex:none">'+
          '<span><span style="color:var(--muted);font-size:.72rem;border:1px solid var(--line);border-radius:4px;padding:0 .3rem;margin-right:.35rem">'+it[1]+'</span>'+esc(it[0])+'</span></label>';}).join("")+'</div>';
      pn.querySelectorAll("input").forEach(function(inp){inp.addEventListener("change",function(){
        checked[+inp.getAttribute("data-i")]=inp.checked;update();});});
    }
    function update(){var n=checked.filter(Boolean).length;
      out.innerHTML='確認済み <b>'+n+' / '+ITEMS.length+'</b>。'+(n===ITEMS.length?'<b class="ok">主要な攻撃面を一通り監査</b>':'「できてはいけないこと」が本当にできないかを一つずつ確かめる');}
    render();update();
  };

  /* ============ 18. harness ============ */
  REG.harness=function(el){
    head(el,"DEMO","三層に分けて役割を確かめる");
    var bar=mk("div","btns");el.appendChild(bar);
    var LAYERS=[
      ["テスト層","仕様書のように読める筋書き。ハード非依存",
       "def test_overheat(dut):\n    dut.set_temp(25)\n    assert dut.state()==\"IDLE\"\n    dut.set_temp(85)\n    assert dut.wait_for(\"ALARM\",0.5)","var(--alias)"],
      ["機器モデル層","意味のある操作に翻訳（刺激・観測・判定）",
       "class DUT:\n    def set_temp(self,c): self._temp.set_celsius(c)\n    def state(self): return self._uart.query(\"state?\")","var(--blue)"],
      ["トランスポート層","実際に線・電波を叩く。ハード交換時はここだけ",
       "uart = Serial(\"/dev/ttyUSB0\",115200)\nppk  = PPK2(); ppk.start()\nfake = FakeI2CSensor(bus=1,addr=0x48)","var(--signal)"]
    ];
    var btns=LAYERS.map(function(l){return button(bar,l[0]);});
    var pn=panel(el,140),out=readout(el);
    function show(i){var l=LAYERS[i];btns.forEach(function(b,j){b.setAttribute("aria-pressed",j===i?"true":"false");});
      pn.innerHTML='<div style="color:'+l[3]+';font-weight:600;margin-bottom:.3rem">'+l[0]+'</div>'+
        '<div style="margin-bottom:.4rem;line-height:1.5">'+esc(l[1])+'</div>'+
        '<pre style="margin:0;white-space:pre-wrap;background:var(--panel);padding:.5rem .6rem;border-radius:7px;border:1px solid var(--line);font-size:.78rem">'+esc(l[2])+'</pre>';
      out.innerHTML=i===0?'上層は仕様に近く読みやすい':(i===2?'下層だけがハードの都合を知る＝差し替えが楽':'中層が上下をつなぐ');}
    btns.forEach(function(b,i){b.addEventListener("click",function(){show(i);});});show(0);
  };

  /* ============ 19. toolbuild ============ */
  REG.toolbuild=function(el){
    head(el,"DEMO","作る／買う を選ぶ");
    var row=ctrls(el);
    var s1=select(row,"必要な精度・速度",["標準で十分","高精度・高速が必須"]);
    var s2=select(row,"プロトコル",["標準（既製対応）","独自"]);
    var s3=select(row,"使う頻度",["一度きり・探索","繰り返す・共有する"]);
    var pn=panel(el,110),out=readout(el);
    function render(){
      var hiPrec=+s1.value===1,custom=+s2.value===1,repeat=+s3.value===1;
      var verdict,detail,col;
      if(hiPrec&&!custom){verdict="買う";col="var(--blue)";detail="標準プロトコルで高精度が要る → ロジアナ・PPK2・オシロ・SDR を買うのが早い";}
      else if(custom&&repeat){verdict="作る";col="var(--signal)";detail="独自プロトコル＋繰り返す → マイコン注入器＋スクリプトを作り、ハーネス（18章）へ組み込む";}
      else if(!repeat){verdict="まず糊付け";col="var(--muted)";detail="一度きり・探索段階 → sigrok-cli・rtl_433・bleak を Python で束ねるのが最安";}
      else{verdict="作る（軽く）";col="var(--signal)";detail="独自だが軽い → 既存ツールのラッパ＋小さな自作エージェント";}
      pn.innerHTML='<div style="font-size:1.3rem;font-weight:700;color:'+col+'">→ '+verdict+'</div>'+
        '<div style="margin-top:.4rem;line-height:1.6">'+esc(detail)+'</div>';
      out.innerHTML='原則: 観測・解析はホストのソフト、正確なタイミング注入はマイコン。分担すると相性がいい';
    }
    [s1,s2,s3].forEach(function(s){s.addEventListener("change",render);});render();
  };

  /* ============ 20. plan ============ */
  REG.plan=function(el){
    head(el,"DEMO","リスク×面 で優先度を決める");
    var pn=panel(el,150),out=readout(el);
    var ITEMS=[
      ["警報が出ない","高","偽センサ+GPIO/BLE 観測（6・9章）",9],
      ["電池が異常に減る","高","電流波形（3章）",9],
      ["秘密が漏れる","高","通信キャプチャ（9・11章）",8],
      ["境界値で誤動作","中","電圧掃引・境界攻め（7・16章）",6],
      ["長時間で劣化","中","ソーク試験（16章）",5],
      ["UI の表示崩れ","低","目視・スクショ",2]
    ];
    ITEMS.sort(function(a,b){return b[3]-a[3];});
    pn.innerHTML=tbl(["リスク項目","痛み","当てる道具（章）","優先"],ITEMS.map(function(it){
      var col=it[1]==="高"?"var(--alias)":it[1]==="中"?"var(--blue)":"var(--muted)";
      return [esc(it[0]),'<b style="color:'+col+'">'+it[1]+'</b>',esc(it[2]),
        '<span style="font-family:var(--mono)">'+it[3]+'</span>'];}));
    out.innerHTML='高リスク×触れる面から着手。層（スモーク→機能→境界→堅牢→セキュリティ→性能）で軽い順に積む';
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
