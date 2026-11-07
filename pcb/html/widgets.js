/* 基板アートワーク — 章内インタラクティブ部品 */
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


  /* ---- 基板向けの共通定数 ---- */
  var RHO_CU = 1.72e-8;                 /* 銅の抵抗率 [Ω·m] */
  var OZ = 34.8e-6;                     /* 1 oz の厚み [m] */
  function sheetR(oz){return RHO_CU/(oz*OZ);}          /* シート抵抗 [Ω/□] */
  function mil(mm){return mm/0.0254;}
  function z0ms(h,w,t,er){             /* マイクロストリップ [mm 単位] */
    return (87/Math.sqrt(er+1.41))*Math.log(5.98*h/(0.8*w+t));
  }
  function z0sl(b,w,t,er){             /* ストリップライン */
    return (60/Math.sqrt(er))*Math.log(1.9*b/(0.8*w+t));
  }
  function solveW(target,h,t,er,strip){ /* 目標 Z₀ になる線幅を二分法で求める */
    var lo=0.02, hi=8;
    for(var i=0;i<60;i++){
      var m=(lo+hi)/2, z=strip?z0sl(h,m,t,er):z0ms(h,m,t,er);
      if(z>target)lo=m; else hi=m;
    }
    return (lo+hi)/2;
  }

  /* ============ 01. flow — 回路図から製造データまで ============ */
  REG.flow=function(el){
    head(el,"DEMO","各工程で何が決まり、何が生まれるか");
    var STEPS=[
      ["要件の確認","外形寸法・層数・コスト・数量・規制","なし（合意事項）","ここが動くと全部が動く。機構図面の確定を待つ",1],
      ["部品選定とフットプリント","各部品の実装用パターン","フットプリントライブラリ","データシートと 1 対 1 で照合する（06 章）",6],
      ["層構成（スタックアップ）","層の並び・厚み・インピーダンスの素地","層構成図","メーカの標準構成から選ぶのが最も安い（05 章）",5],
      ["部品配置","性能の 8 割。配線の難易度もここで決まる","配置データ","後戻りが最も高くつく工程（07 章）",7],
      ["グラウンドと電源の設計","リターン電流の道","面の割り当て","分割しない。配置で分ける（08 章）",8],
      ["配線（ルーティング）","線幅・間隔・層・ビア","配線データ","配置で決まった距離を埋める作業（09〜16 章）",9],
      ["ベタとスティッチング","熱・シールド・リターン","銅面","流した「形」を必ず目で見る（13 章）",13],
      ["検証（DRC / DFM / レビュー）","作れるか、動くか","指摘リスト","DRC を通っても作れるとは限らない（04・20・24 章）",20],
      ["出図","製造・実装に渡すデータ一式","ガーバー・ドリル・BOM・実装データ","別のビューアで必ず確認する（22 章）",22],
      ["製造・実装","現実との答え合わせ","基板・実装品","エッチング・めっき・リフロー（03・21 章）",3]
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var pn=panel(el), out=readout(el);
    var cur=0;
    var btns=STEPS.map(function(s,i){
      var b=button(bar,String(i+1));
      b.addEventListener("click",function(){cur=i;render();});
      return b;
    });
    function render(){
      btns.forEach(function(b,i){b.setAttribute("aria-pressed",i===cur?"true":"false");});
      var s=STEPS[cur];
      pn.innerHTML='<div style="color:var(--signal);font-weight:700;font-size:.95rem;margin-bottom:.4rem">'+
        (cur+1)+". "+esc(s[0])+'</div>'+
        tbl(["","内容"],[
          ["ここで決まること", esc(s[1])],
          ["生まれるもの", '<b>'+esc(s[2])+'</b>'],
          ["注意", '<span style="color:var(--alias)">'+esc(s[3])+'</span>'],
        ],["left","left"]);
      out.innerHTML="工程 <b>"+(cur+1)+" / "+STEPS.length+"</b>"+
        (cur<=3?' <span class="warn">← ここまでの決定が、後の全部を縛る</span>'
               :' ／ 前の工程に戻る回数と深さを減らすのが設計の腕である')+
        "<br>本シリーズの該当章: <b>"+(s[4]<10?"0":"")+s[4]+" 章</b>";
    }
    render();
  };

  /* ============ 02. stack — 基板の断面と厚み ============ */
  REG.stack=function(el){
    head(el,"DEMO","1.6 mm の中に何がどれだけ入っているか");
    var cv=screen(el,300), cc=cctx(cv);
    var row=ctrls(el);
    var sL=select(row,"層数",["2 層","4 層","6 層"]);
    var sO=select(row,"外層の銅箔厚",["0.5 oz（18 µm）","1 oz（35 µm）","2 oz（70 µm）","3 oz（105 µm）"]);
    var sT=slider(row,"仕上がり板厚 [mm]",0.6,3.2,1.6,0.1);
    var out=readout(el);
    function draw(){
      var nL=[2,4,6][+sL.value], ozv=[0.5,1,2,3][+sO.value], TH=+sT.input.value;
      sT.val.textContent=f(TH,2)+" mm";
      var cuOut=ozv*34.8e-3, cuIn=(ozv>1?1:0.5)*34.8e-3;   /* mm */
      var plate=0.025;                                      /* めっき */
      var cuTot=2*(cuOut+plate)+(nL-2)*cuIn;
      var dielTot=TH-cuTot;
      /* 誘電体の配分: 外側 2 か所を薄く、中央で帳尻 */
      var gaps=nL-1;
      /* 外層から見た隣接基準面までの距離。2 層ではコアそのものになる */
      var thin=(nL===2)?dielTot:Math.min(0.12, dielTot/gaps);
      var layers=[];
      if(nL===2){ layers=[["L1 銅 ＋ めっき",cuOut+plate,"cu"],["コア",dielTot,"core"],["L2 銅 ＋ めっき",cuOut+plate,"cu"]]; }
      else{
        var outerG=thin, inner=(dielTot-2*outerG)/(gaps-2);
        layers.push(["L1 銅 ＋ めっき",cuOut+plate,"cu"]);
        layers.push(["プリプレグ",outerG,"pp"]);
        for(var i=2;i<nL;i++){
          layers.push(["L"+i+" 銅",cuIn,"cu"]);
          layers.push([(i===Math.floor(nL/2)?"コア":"プリプレグ"),inner,(i===Math.floor(nL/2)?"core":"pp")]);
        }
        layers.push(["L"+nL+" 銅 ＋ めっき",cuOut+plate,"cu"]);
      }
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=180,x1=w-190,top=44,bot=h-30, H=bot-top;
      /* ラベルが重ならないよう、左右それぞれで最低 13 px の間隔を確保する */
      var usedL=[], usedR=[];
      function slot(arr,y){var yy=y;arr.forEach(function(p){if(Math.abs(yy-p)<13)yy=p+13;});arr.push(yy);return yy;}
      function leader(x,ya,yb,col){ctx.strokeStyle=col;ctx.lineWidth=0.8;ctx.globalAlpha=.55;
        ctx.beginPath();ctx.moveTo(x,ya);ctx.lineTo(x+(x<x0?6:-6),yb);ctx.stroke();ctx.globalAlpha=1;}
      var scale=H/TH;
      var y=top;
      ctx.fillStyle=C("--blue");ctx.globalAlpha=.35;ctx.fillRect(x0,y-9,x1-x0,8);ctx.globalAlpha=1;
      var ry=slot(usedL,y-2);
      lab(ctx,"ソルダーレジスト（10〜25 µm）",x0-10,ry,C("--blue"),"right",9.5);
      leader(x0-8,ry-3,y-5,C("--blue"));
      layers.forEach(function(L){
        var hh=Math.max(L[1]*scale,2.5), mid=y+hh/2;
        if(L[2]==="cu"){ctx.fillStyle=C("--signal");ctx.fillRect(x0,y,x1-x0,hh);}
        else{ctx.fillStyle=L[2]==="core"?C("--screen"):C("--panel");ctx.fillRect(x0,y,x1-x0,hh);
             ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(x0,y,x1-x0,hh);}
        var col=L[2]==="cu"?C("--signal"):C("--muted");
        var ly=slot(usedL,mid+3.5);
        lab(ctx,L[0],x0-10,ly,col,"right",9.5);
        leader(x0-8,ly-3,mid,col);
        var ry2=slot(usedR,mid+3.5);
        lab(ctx,(L[1]<0.1?f(L[1]*1000,0)+" µm":f(L[1],3)+" mm"),x1+10,ry2,C("--faint"),"left",9.5);
        leader(x1+8,ry2-3,mid,C("--faint"));
        y+=hh;
      });
      ctx.fillStyle=C("--blue");ctx.globalAlpha=.35;ctx.fillRect(x0,y,x1-x0,8);ctx.globalAlpha=1;
      /* 総厚 */
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x0-118,top);ctx.lineTo(x0-118,bot);ctx.stroke();
      lab(ctx,f(TH,2)+" mm",x0-124,(top+bot)/2,C("--ink"),"right",11);
      var cuPct=cuTot/TH*100;
      /* 50 Ω 線幅 */
      var wz=solveW(50,thin,cuOut+plate,4.3,false);
      out.innerHTML="銅の合計厚 <b>"+f(cuTot*1000,0)+" µm</b>（板厚の "+f(cuPct,1)+" %）"+
        " ／ 誘電体の合計 <b>"+f(dielTot,3)+" mm</b>"+
        "<br>外層と隣接基準面の間隔 = <b>"+f(thin,3)+" mm</b> → 50 Ω に必要な線幅は約 <b>"+f(wz,3)+" mm</b>"+
        (nL===2?' <span class="warn">← 2 層では基準面が遠すぎて、現実的な線幅で 50 Ω が作れない（05 章）</span>'
               :(wz>0.5?' <span class="warn">← 太すぎる。外側の誘電体をもっと薄くする</span>'
                       :' <b class="ok">← 現実的な線幅</b>'))+
        "<br>最小線幅の目安（エッチングの制約、03 章）: <b>"+
        (ozv<=1?"0.10〜0.127 mm":(ozv<=2?"0.20 mm":"0.30 mm"))+"</b>"+
        (ozv>=3?' <span class="warn">← この銅厚では細ピッチの IC が載らない</span>':"");
    }
    [sT].forEach(function(s){s.input.addEventListener("input",draw);});
    [sL,sO].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 03. etch — 製造公差が寸法をどう動かすか ============ */
  REG.etch=function(el){
    head(el,"DEMO","設計値どおりの銅は存在しない");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sW=slider(row,"設計線幅 [mm]",0.08,1.0,0.20,0.01);
    var sO=select(row,"銅箔厚",["0.5 oz（18 µm）","1 oz（35 µm）","2 oz（70 µm）","3 oz（105 µm）"]);
    var sL=select(row,"層",["外層（めっきあり）","内層"]);
    var sE=slider(row,"アンダーカット係数",0.4,1.4,1.0,0.05);
    var out=readout(el);
    function draw(){
      var W=+sW.input.value, ozv=[0.5,1,2,3][+sO.value], outer=(+sL.value===0), k=+sE.input.value;
      sW.val.textContent=f(W,3)+" mm"; sE.val.textContent=f(k,2);
      var t=ozv*0.0348+(outer?0.025:0);          /* mm */
      var uc=k*t;                                 /* 片側のアンダーカット */
      var wTop=Math.max(W-2*uc,0);
      var area=(W+wTop)/2*t;                      /* 台形の断面積 mm² */
      var areaIdeal=W*t;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w*0.34, base=h-84, sc=Math.min(220/Math.max(W,0.3), 60/t);
      /* 基板 */
      ctx.fillStyle=C("--panel");ctx.fillRect(cx-170,base,340,26);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(cx-170,base,340,26);
      /* 理想（点線） */
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.4;ctx.setLineDash([4,3]);
      ctx.strokeRect(cx-W*sc/2, base-t*sc, W*sc, t*sc);ctx.setLineDash([]);
      /* 実際（台形） */
      ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;
      ctx.beginPath();
      ctx.moveTo(cx-wTop*sc/2, base-t*sc); ctx.lineTo(cx+wTop*sc/2, base-t*sc);
      ctx.lineTo(cx+W*sc/2, base); ctx.lineTo(cx-W*sc/2, base); ctx.closePath();
      ctx.fill();ctx.stroke();
      lab(ctx,"点線 = 設計値／塗り = 実物",cx,base+50,C("--muted"),"center",10);
      lab(ctx,"上面 "+f(wTop,3)+" mm",cx,base-t*sc-10,wTop<W*0.5?C("--alias"):C("--signal"),"center",10.5);
      lab(ctx,"根元 "+f(W,3)+" mm",cx,base+40,C("--muted"),"center",10);
      /* 右側の数値 */
      var tx=Math.min(w-200,cx+200);
      var minW=ozv<=1?(outer?0.127:0.10):(ozv<=2?0.20:0.30);
      [["銅厚（めっき込み）",f(t*1000,0)+" µm"],
       ["片側アンダーカット",f(uc*1000,0)+" µm"],
       ["上面の残り幅",f(wTop,3)+" mm"],
       ["断面積",f(area*1e6,0)+" µm²（設計比 "+f(area/areaIdeal*100,0)+" %）"],
       ["このクラスの最小線幅",f(minW,3)+" mm"]].forEach(function(p,i){
        lab(ctx,p[0],tx,60+i*30,C("--muted"),"left",10);
        lab(ctx,p[1],tx+178,60+i*30,C("--signal"),"right",10.5);
      });
      out.innerHTML=(wTop<=0.02
        ? '<span class="warn"><b>線として成立しない。</b>この銅厚では、この線幅は作れない</span>'
        : (W<minW ? '<span class="warn">設計幅 '+f(W,3)+' mm は最小線幅 '+f(minW,3)+' mm を下回っている</span>'
                  : '<b class="ok">製造可能な範囲</b>'))+
        " ／ 実効断面積は設計値の <b>"+f(area/areaIdeal*100,0)+" %</b>"+
        "<br>だから電流容量の計算（09 章）は、設計値より細い線で行うのが安全である。"+
        (outer?"外層はめっきで厚くなるぶん、削られる量も増える。":"内層は銅箔のままなので細く引ける。")+
        "<br>アンダーカットはおおむね銅厚と同程度まで進む —— これが「厚い銅ほど細い線が引けない」の正体である";
    }
    [sW,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    [sO,sL].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 04. drc — 設計ルールと製造クラス ============ */
  REG.drc=function(el){
    head(el,"DEMO","どこを緩めれば安くなるか");
    var row=ctrls(el);
    var sW=slider(row,"最小線幅・間隔 [mm]",0.06,0.30,0.15,0.005);
    var sD=slider(row,"最小仕上がり穴径 [mm]",0.10,0.60,0.30,0.01);
    var sP=slider(row,"パッド径 [mm]",0.35,1.20,0.60,0.01);
    var sM=select(row,"公差の見方",["最悪ケース（安全側）","RSS（二乗和平方根）"]);
    var sI=select(row,"層",["外層パッド","内層パッド（層ずれあり）"]);
    var pn=panel(el), out=readout(el);
    function draw(){
      var W=+sW.input.value, D=+sD.input.value, P=+sP.input.value,
          worst=(+sM.value===0), inner=(+sI.value===1);
      sW.val.textContent=f(W,3)+" mm"; sD.val.textContent=f(D,2)+" mm"; sP.val.textContent=f(P,2)+" mm";
      /* クラス判定 */
      var cls, cost, yld;
      if(W>=0.15&&D>=0.30){cls="標準";cost="基準";yld="高い";}
      else if(W>=0.127&&D>=0.25){cls="一般的な高密度";cost="+0〜10 %";yld="高い";}
      else if(W>=0.10&&D>=0.20){cls="高密度";cost="+20〜40 %";yld="やや下がる";}
      else {cls="超高密度（HDI 領域）";cost="+80 % 〜";yld="下がる";}
      /* 公差の積み上げ */
      var design=(P-D)/2;
      var terms=[["ドリル位置公差",0.075],["穴径公差（半径換算）",0.025],["パッドのエッチング公差",0.030]];
      if(inner)terms.splice(1,0,["層ずれ",0.075]);
      var sum=terms.reduce(function(a,t){return a+t[1];},0);
      var rss=Math.sqrt(terms.reduce(function(a,t){return a+t[1]*t[1];},0));
      var used=worst?sum:rss, left=design-used;
      pn.innerHTML=tbl(["項目","値","評価"],[
        ["必要な製造クラス", "<b>"+cls+"</b>", "価格 "+cost+" ／ 歩留まり "+yld],
        ["設計上のアニュラリング", "<b>"+f(design,3)+" mm</b>",
         design>=0.15?'<b class="ok">クラス 2 相当以上</b>':(design>=0.05?"クラス 1 相当":'<span class="warn">不足</span>')],
        ["積み上げる公差の合計", f(used,3)+" mm", worst?"最悪ケース法":"RSS 法"],
        ["残るアニュラリング", "<b>"+f(left,3)+" mm</b>",
         left>=0.05?'<b class="ok">成立する</b>':'<span class="warn">ブレイクアウトの危険</span>'],
      ],["left","right","left"])+
      '<div style="margin-top:.5rem;color:var(--muted)">積み上げた内訳: '+
      terms.map(function(t){return esc(t[0])+" "+f(t[1],3);}).join(" ／ ")+'</div>';
      out.innerHTML=(left>=0.05
        ? '<b class="ok">この寸法は成立する。</b>'
        : '<span class="warn">成立しない。</span>')+
        " 対策は <b>パッドを大きくする</b>（+"+f(Math.max(0,(0.05-left))*2,2)+" mm）／ <b>穴を小さくする</b> ／ <b>公差の良いクラスを選ぶ</b>"+
        "<br>"+(worst
          ? "最悪ケース法は全部が最悪方向に重なる前提。医療・車載（クラス 3）ではこちらで判断する"
          : "RSS 法は各公差が独立にばらつく前提。民生ではこちらで判断し、歩留まりで許容する")+
        "<br><b>どちらの方法で判断したかを記録に残すこと</b>——これが公差の教えである（04 章）";
    }
    [sW,sD,sP].forEach(function(s){s.input.addEventListener("input",draw);});
    [sM,sI].forEach(function(s){s.addEventListener("change",draw);});
    draw();
  };

  /* ============ 05. stackup — 層構成ビルダ ============ */
  REG.stackup=function(el){
    head(el,"DEMO","層の役割を割り当てて、基準面を確認する");
    var row=ctrls(el);
    var sN=select(row,"層数",["2 層","4 層","6 層"]);
    var sH=slider(row,"外側の誘電体厚 [mm]",0.05,0.60,0.10,0.01);
    var sE=slider(row,"比誘電率 εr",2.5,5.0,4.3,0.1);
    var pn=panel(el), out=readout(el);
    var ROLE=["配線","GND","電源"];
    var assign={2:[0,1], 4:[0,1,2,0], 6:[0,1,0,2,1,0]};
    var sel=[];
    function build(){
      var n=[2,4,6][+sN.value];
      pn.innerHTML="";
      sel=[];
      var box=mk("div");box.style.display="flex";box.style.flexDirection="column";box.style.gap=".25rem";
      for(var i=0;i<n;i++){
        var r=mk("div");r.style.display="flex";r.style.alignItems="center";r.style.gap=".5rem";
        r.innerHTML='<span style="width:2.4rem;font-family:var(--mono);color:var(--signal);font-weight:700">L'+(i+1)+'</span>';
        var s=document.createElement("select");
        s.style.cssText="font-family:var(--mono);font-size:.8rem;padding:.25rem;border:1px solid var(--line);border-radius:6px;background:var(--screen);color:var(--ink)";
        ROLE.forEach(function(o,k){var op=document.createElement("option");op.value=k;op.textContent=o;s.appendChild(op);});
        s.value=assign[n][i];
        s.addEventListener("change",draw);
        r.appendChild(s);
        var note=mk("span");note.style.cssText="color:var(--muted);font-size:.8rem";
        r.appendChild(note);
        box.appendChild(r);
        sel.push({s:s,note:note});
      }
      pn.appendChild(box);
      draw();
    }
    function draw(){
      var n=sel.length, h=+sH.input.value, er=+sE.input.value;
      sH.val.textContent=f(h,3)+" mm"; sE.val.textContent=f(er,1);
      var roles=sel.map(function(x){return +x.s.value;});
      var problems=[], ok=0, sig=0;
      roles.forEach(function(r,i){
        var txt="", cls="var(--muted)";
        if(r===0){
          sig++;
          var above=i>0?roles[i-1]:null, below=i<n-1?roles[i+1]:null;
          var adj=(above===1||above===2||below===1||below===2);
          if(adj){txt="隣接基準面あり";cls="var(--blue)";ok++;}
          else{txt="隣接基準面がない → 高速信号を通せない";cls="var(--alias)";
               problems.push("L"+(i+1)+" に隣接基準面がない");}
        }else if(r===1){txt="基準面（リターンの道）";cls="var(--signal)";}
        else{txt="電源面。隣が GND なら面間容量が稼げる";cls="var(--signal)";}
        sel[i].note.textContent=txt; sel[i].note.style.color=cls;
      });
      var nG=roles.filter(function(r){return r===1;}).length;
      if(nG===0)problems.push("GND 面が 1 枚もない");
      /* 対称性 */
      var sym=true;
      if(n>=4){ for(var i=0;i<n/2;i++) if(roles[i]!==roles[n-1-i]) sym=false; }
      /* 50 Ω / 100 Ω 差動の線幅 */
      var t=0.06;
      var w50=solveW(50,h,t,er,false);
      var wd=solveW(55,h,t,er,false);   /* 差動 100 Ω の 1 本ぶんの目安 */
      out.innerHTML="配線層 <b>"+sig+"</b> 層（うち隣接基準面あり <b>"+ok+"</b> 層） ／ GND 面 <b>"+nG+"</b> 枚"+
        (n>=4?" ／ 上下対称性 "+(sym?'<b class="ok">あり</b>':'<span class="warn">なし（反りの原因になる）</span>'):"")+
        "<br>外側の誘電体 "+f(h,3)+" mm・εr "+f(er,1)+" のとき、50 Ω の線幅は約 <b>"+f(w50,3)+" mm</b>"+
        (w50>0.5?' <span class="warn">← 太すぎて配線が入らない。もっと薄くする</span>'
                :(w50<0.09?' <span class="warn">← 細すぎて製造クラスが上がる</span>':' <b class="ok">← 現実的</b>'))+
        "<br>100 Ω 差動なら 1 本あたり約 "+f(wd,3)+" mm（結合ぶん細くなるので実際はこれより細い、11 章）"+
        (problems.length? '<br><span class="warn">問題: '+problems.map(esc).join(" ／ ")+'</span>'
                        : '<br><b class="ok">基準面の割り当てに問題なし。</b>あとはメーカの標準構成に当てはめる（05 章）');
    }
    [sH,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    sN.addEventListener("change",build);
    build();
  };

  /* ============ 06. land — ランドパターン計算 ============ */
  REG.land=function(el){
    head(el,"DEMO","IPC-7351 の考え方でランド寸法を出す");
    var cv=screen(el,220), cc=cctx(cv);
    var row=ctrls(el);
    var sP=select(row,"部品",["1005（0402）","1608（0603）","2012（0805）","3216（1206）","SOP 0.65 mm ピッチ","QFP 0.5 mm ピッチ"]);
    var sD=select(row,"密度レベル",["B（標準）","A（最大・高信頼）","C（最小・高密度）"]);
    var sC=slider(row,"部品寸法の公差 [mm]",0.02,0.30,0.10,0.01);
    var sM=slider(row,"実装機の配置精度 [mm]",0.02,0.20,0.05,0.01);
    var out=readout(el);
    /* [L 全長, S 端子間, W 端子幅, 種別]  種別 0 = チップ、1 = ガルウィング */
    var PARTS=[[1.0,0.4,0.5,0],[1.6,0.7,0.8,0],[2.0,0.9,1.25,0],[3.2,1.6,1.6,0],
               [6.0,4.2,0.4,1],[9.0,7.2,0.28,1]];
    /* 密度レベル B / A / C。チップ部品のかかとは部品の下に隠れるので実質ゼロ */
    var FIL=[{JT:[0.35,0.55,0.15], JH:[0.00,0.10,-0.05], JS:[0.00,0.05,-0.05]},
             {JT:[0.35,0.55,0.15], JH:[0.35,0.45,0.25],  JS:[0.03,0.05,0.01]}];
    function draw(){
      var p=PARTS[+sP.value], lvl=+sD.value, CL=+sC.input.value, PM=+sM.input.value;
      sC.val.textContent=f(CL,2)+" mm"; sM.val.textContent=f(PM,2)+" mm";
      var F=0.05;      /* 基板の製造公差 */
      var rss=Math.sqrt(CL*CL+F*F+PM*PM);
      var fil=FIL[p[3]];
      var Lmin=p[0]-CL/2, Smax=p[1]+CL/2, Wmin=p[2]-CL/2;
      var Z=Lmin+2*fil.JT[lvl]+rss;
      var G=Smax-2*fil.JH[lvl]-rss;
      var X=Wmin+2*fil.JS[lvl]+rss;
      var padLen=(Z-G)/2;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w*0.5, cy=h*0.5, sc=Math.min(300/Z, 90/Math.max(X,1));
      /* ランド */
      ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=1.6;
      [[-1,1],[1,-1]].forEach(function(sgn){
        var x = sgn[0]<0 ? cx-Z*sc/2 : cx+G*sc/2;
        rrect(ctx,x,cy-X*sc/2,padLen*sc,X*sc,2);ctx.fill();ctx.stroke();
      });
      /* 部品 */
      ctx.strokeStyle=C("--ink");ctx.lineWidth=1.4;ctx.fillStyle=C("--panel");
      rrect(ctx,cx-p[0]*sc/2,cy-p[2]*sc/2,p[0]*sc,p[2]*sc,2);ctx.fill();ctx.stroke();
      lab(ctx,"部品",cx,cy+4,C("--ink"),"center",10);
      /* 寸法 */
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1;
      var yb=cy+X*sc/2+22;
      ctx.beginPath();ctx.moveTo(cx-Z*sc/2,yb);ctx.lineTo(cx+Z*sc/2,yb);ctx.stroke();
      lab(ctx,"Z = "+f(Z,3)+" mm",cx,yb+16,C("--signal"),"center",10.5);
      var yt=cy-X*sc/2-14;
      ctx.beginPath();ctx.moveTo(cx-G*sc/2,yt);ctx.lineTo(cx+G*sc/2,yt);ctx.stroke();
      lab(ctx,"G = "+f(G,3)+" mm",cx,yt-6,C("--blue"),"center",10.5);
      lab(ctx,"X = "+f(X,3)+" mm",cx+Z*sc/2+10,cy+4,C("--muted"),"left",10);
      out.innerHTML=tbl(["量","値","意味"],[
        ["Z（外寸・つま先間）", f(Z,3)+" mm", "部品が最も大きくてもフィレットが出る"],
        ["G（内寸・かかと間）", f(G,3)+" mm", "部品が内側に寄ってもかかとが取れる"],
        ["X（ランド幅）", f(X,3)+" mm", "側面のフィレット"],
        ["ランド 1 個の長さ", f(padLen,3)+" mm", "(Z − G) / 2"],
        ["積んだばらつき（RSS）", f(rss,3)+" mm", "部品公差 ＋ 基板公差 0.05 ＋ 実装機精度"],
      ],["left","right","left"])+
      "<br>"+(G<=0
        ? '<span class="warn">G が 0 以下 —— ランドがつながってしまう。密度レベルを C 側に、または公差の小さい部品を選ぶ</span>'
        : (lvl===1?"レベル A: フィレットが大きく、手はんだ・修理・高信頼向き。そのぶん面積を取る"
          :(lvl===2?"レベル C: 最小。実装ラインの能力が前提。業者に確認すること"
                   :"レベル B（標準）: 迷ったらこれ")))+
      "<br><b>部品メーカの推奨ランドパターンがあれば、そちらが最優先である</b>（06 章）";
    }
    [sC,sM].forEach(function(s){s.input.addEventListener("input",draw);});
    [sP,sD].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 07. place — 配置と配線長 ============ */
  REG.place=function(el){
    head(el,"DEMO","配置を動かすと、配線の総長と交差数が変わる");
    var cv=screen(el,300), cc=cctx(cv);
    var row=ctrls(el);
    var sR=slider(row,"IC の回転 [°]",0,270,0,90);
    var sM=slider(row,"メモリの位置",0,100,10,1);
    var sC=slider(row,"コネクタの位置",0,100,80,1);
    var sD=slider(row,"デカップリングの距離 [mm]",1,25,3,1);
    var out=readout(el);
    function draw(){
      var rot=+sR.input.value, mp=+sM.input.value/100, cp=+sC.input.value/100, dd=+sD.input.value;
      sR.val.textContent=rot+"°"; sM.val.textContent=f(mp*100,0)+" %";
      sC.val.textContent=f(cp*100,0)+" %"; sD.val.textContent=dd+" mm";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var bx=30,by=30,bw=w-60,bh=h-70;
      ctx.fillStyle=C("--panel");ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;ctx.strokeRect(bx,by,bw,bh);
      var mm=bw/100;                    /* 1 mm あたりの画素（基板を 100 mm 幅と仮定） */
      var icx=bx+bw*0.5, icy=by+bh*0.5, icw=70, ich=54;
      /* ピンの位置（回転で変わる） */
      var pins=[];
      for(var i=0;i<4;i++){
        var t=(i+0.5)/4;
        var side=(rot/90)%4;
        var px,py;
        if(side===0){px=icx-icw/2;py=icy-ich/2+ich*t;}
        else if(side===1){px=icx-icw/2+icw*t;py=icy-ich/2;}
        else if(side===2){px=icx+icw/2;py=icy-ich/2+ich*t;}
        else {px=icx-icw/2+icw*t;py=icy+ich/2;}
        pins.push([px,py]);
      }
      /* メモリとコネクタ */
      var memx=bx+20+ (bw-70)*mp, memy=by+26;
      var conx=bx+20+ (bw-70)*cp, cony=by+bh-42;
      function part(x,y,w2,h2,label){
        ctx.fillStyle=C("--screen");ctx.strokeStyle=C("--muted");ctx.lineWidth=1.2;
        rrect(ctx,x,y,w2,h2,3);ctx.fill();ctx.stroke();
        lab(ctx,label,x+w2/2,y+h2/2+4,C("--muted"),"center",10);
      }
      part(memx,memy,54,30,"MEM");
      part(conx,cony,54,30,"CON");
      /* IC */
      ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;
      rrect(ctx,icx-icw/2,icy-ich/2,icw,ich,4);ctx.fill();ctx.stroke();
      lab(ctx,"IC",icx,icy+4,C("--ink"),"center",12);
      /* デカップリング */
      var dcx=icx+icw/2+dd*mm+8, dcy=icy;
      ctx.fillStyle=C("--screen");ctx.strokeStyle=C("--blue");ctx.lineWidth=1.4;
      rrect(ctx,dcx,dcy-9,22,18,2);ctx.fill();ctx.stroke();
      lab(ctx,"C",dcx+11,dcy+4,C("--blue"),"center",9.5);
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(icx+icw/2,icy);ctx.lineTo(dcx,dcy);ctx.stroke();
      /* ラッツネスト */
      var nets=[[pins[0],[memx+27,memy+30]],[pins[1],[memx+27,memy+30]],
                [pins[2],[conx+27,cony]],[pins[3],[conx+27,cony]]];
      var total=0;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;
      nets.forEach(function(n){
        ctx.beginPath();ctx.moveTo(n[0][0],n[0][1]);ctx.lineTo(n[1][0],n[1][1]);ctx.stroke();
        total+=Math.hypot(n[1][0]-n[0][0],n[1][1]-n[0][1]);
      });
      /* 交差数 */
      function cross(a,b){
        function ccw(p,q,r){return (r[1]-p[1])*(q[0]-p[0])>(q[1]-p[1])*(r[0]-p[0]);}
        return ccw(a[0],b[0],b[1])!==ccw(a[1],b[0],b[1])&&ccw(a[0],a[1],b[0])!==ccw(a[0],a[1],b[1]);
      }
      var nx=0;
      for(var i2=0;i2<nets.length;i2++)for(var j=i2+1;j<nets.length;j++)if(cross(nets[i2],nets[j]))nx++;
      var totmm=total/mm;
      lab(ctx,"赤線 = ラッツネスト（未配線のネット）",bx,h-16,C("--faint"),"left",10);
      var Ldec=dd*1.0;   /* 約 1 nH/mm */
      out.innerHTML="ラッツネスト総長 <b>"+f(totmm,0)+" mm</b> ／ 交差 <b>"+nx+"</b> 箇所"+
        (nx>0?' <span class="warn">← 交差は層をまたぐ必要＝ビアが増える</span>':' <b class="ok">交差なし</b>')+
        "<br>デカップリングまで "+dd+" mm → 経路のインダクタンス約 <b>"+f(Ldec,1)+" nH</b>"+
        "（1 A/ns の変化で "+f(Ldec,1)+" V の落ち込み、14 章）"+
        (dd>5?' <span class="warn">← 遠すぎる</span>':' <b class="ok">← 良好</b>')+
        "<br>IC を回すだけで総長が変わることを確かめてほしい。<b>配線は、配置で決まった距離を埋めるだけである</b>";
    }
    [sR,sM,sC,sD].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 08. slit — グラウンドを切ってみる ============ */
  REG.slit=function(el){
    head(el,"DEMO","スリットを横切ると、帰り道はどうなるか");
    var cv=screen(el,280), cc=cctx(cv);
    var row=ctrls(el);
    var cS=checkbox(row,"グラウンドにスリットを入れる",true);
    var sL=slider(row,"スリットの長さ [mm]",5,80,40,1);
    var sH=slider(row,"信号と基準面の間隔 [mm]",0.05,1.5,0.10,0.05);
    var sT=slider(row,"立ち上がり時間 [ns]",0.05,5,0.5,0.05);
    var out=readout(el);
    function draw(){
      var slit=cS.checked, SL=+sL.input.value, hh=+sH.input.value, tr=+sT.input.value;
      sL.val.textContent=SL+" mm"; sH.val.textContent=f(hh,2)+" mm"; sT.val.textContent=f(tr,2)+" ns";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var bx=40,by=40,bw=w-80,bh=h-110;
      ctx.fillStyle=C("--panel");ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.strokeRect(bx,by,bw,bh);
      var mm=bw/100;
      var sx=bx+bw*0.55, sw=10;
      var sy=by+bh*0.38;                          /* 信号線の高さ */
      var shMax=bh-46;                            /* 下端に必ず橋を残す */
      var sh=Math.min(SL*mm, shMax);
      var slitEnd=by+sh;                          /* スリットの下端 */
      if(slit){
        ctx.fillStyle=C("--screen");ctx.fillRect(sx-sw/2,by,sw,sh);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
        ctx.strokeRect(sx-sw/2,by,sw,sh);ctx.setLineDash([]);
        lab(ctx,"スリット "+SL+" mm",sx,by-6,C("--alias"),"center",10);
        lab(ctx,"この下だけつながっている",sx,slitEnd+34,C("--muted"),"center",9);
      }
      /* 信号線 */
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(bx+20,sy);ctx.lineTo(bx+bw-20,sy);ctx.stroke();
      lab(ctx,"信号",bx+20,sy-10,C("--signal"),"left",10);
      /* リターン */
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2.4;
      if(!slit){
        ctx.beginPath();ctx.moveTo(bx+bw-20,sy+8);ctx.lineTo(bx+20,sy+8);ctx.stroke();
      }else{
        var yb2=slitEnd+14;
        ctx.beginPath();
        ctx.moveTo(bx+bw-20,sy+8);ctx.lineTo(sx+18,sy+8);
        ctx.lineTo(sx+18,yb2);ctx.lineTo(sx-18,yb2);
        ctx.lineTo(sx-18,sy+8);ctx.lineTo(bx+20,sy+8);
        ctx.stroke();
      }
      lab(ctx,"リターン電流",bx+20,sy+26,C("--blue"),"left",10);
      if(slit&&SL*mm>shMax)lab(ctx,"（図のスリットは縮めて表示）",bx+bw-20,by+bh+8,C("--faint"),"right",9);
      /* 物理量はスライダーの値から計算する（図の縮尺には依存させない） */
      var detour = slit ? SL*0.5 : 0;      /* 信号がスリットの中ほどを横切るとして */
      var sepMM  = 2;                      /* 迂回の往復が離れる距離の目安 */
      var areaBase = hh*100;               /* 真下を帰るときのループ面積 [mm²] */
      var areaExtra = slit ? detour*sepMM*2 : 0;
      var area = areaBase + areaExtra;
      /* 迂回ぶんを長方形ループのインダクタンスで見積もる */
      var Lnh = 0;
      if(slit&&detour>0.5){
        var lm=detour*1e-3, wm=sepMM*1e-3;
        Lnh = 4e-7*lm*Math.max(Math.log(2*lm/wm)-0.75,0.2)*1e9;
      }
      var fknee=0.35/(tr*1e-9);
      var Z=2*Math.PI*fknee*Lnh*1e-9;
      out.innerHTML="ループ面積: 真下を帰れば <b>"+f(areaBase,1)+" mm²</b>"+
        (slit?" ／ 迂回で追加される面積 <b>"+f(areaExtra,0)+" mm²</b>（"+f(area/areaBase,0)+" 倍に）"
             :"（信号線の真下を帰っている）")+
        (slit?"<br>迂回距離 "+f(detour,0)+" mm → 追加インダクタンス <b>"+f(Lnh,1)+" nH</b>":"")+
        "<br>立ち上がり "+f(tr,2)+" ns → ニー周波数 <b>"+eng(fknee,"Hz",1)+"</b> で、"+
        "追加される直列インピーダンスは約 <b>"+f(Z,0)+" Ω</b>"+
        (Z>10?' <span class="warn">← 50 Ω の線路にこれが割り込む。波形は壊れる</span>'
             :(slit?' <b class="ok">← まだ小さい</b>':' <b class="ok">← 追加なし</b>'))+
        "<br>"+(slit
          ? '<span class="warn">スリットを横切らせてはいけない。'+
            'どうしても分けるなら、信号を通す 1 か所に橋を作ってそこに集約する（08 章）</span>'
          : "基準面が連続していれば、ループ面積は自動的に最小になる。設計者は「切らない」だけでよい")+
        "<br>基準面までの距離 "+f(hh,2)+" mm を半分にすると、ループ面積も半分になる（05 章で L1–L2 を薄くする理由）";
    }
    [sL,sH,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    cS.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 09. width — 線幅と電流容量 ============ */
  REG.width=function(el){
    head(el,"DEMO","電流容量と電圧降下、どちらが先に効くか");
    var cv=screen(el,230), cc=cctx(cv);
    var row=ctrls(el);
    var sI=slider(row,"電流 [A]",0.1,10,2,0.1);
    var sT=slider(row,"許容温度上昇 [℃]",5,40,10,1);
    var sO=select(row,"銅箔厚",["0.5 oz","1 oz","2 oz","3 oz"]);
    var sL=select(row,"層",["外層（k = 0.048）","内層（k = 0.024）"]);
    var sD=slider(row,"配線長 [mm]",5,200,30,1);
    var sV=slider(row,"電源電圧 [V]",0.8,24,3.3,0.1);
    var out=readout(el);
    function draw(){
      var I=+sI.input.value, dT=+sT.input.value, ozv=[0.5,1,2,3][+sO.value],
          k=(+sL.value===0)?0.048:0.024, len=+sD.input.value, V=+sV.input.value;
      sI.val.textContent=f(I,1)+" A"; sT.val.textContent=dT+" ℃";
      sD.val.textContent=len+" mm"; sV.val.textContent=f(V,1)+" V";
      /* IPC-2221: I = k ΔT^0.44 A^0.725  →  A = (I/(k ΔT^0.44))^(1/0.725) [mil²] */
      var Amil=Math.pow(I/(k*Math.pow(dT,0.44)),1/0.725);
      var tmil=mil(ozv*0.0348);
      var wmil=Amil/tmil, wmm=wmil*0.0254;
      /* 抵抗と電圧降下（採用幅で） */
      var Rsq=sheetR(ozv);
      var R=Rsq*(len/wmm);
      var dV=I*R, pw=I*I*R;
      var pct=dV/V*100;
      /* 電圧降下から必要な幅（許容 2 %） */
      var wDrop=Rsq*len*I/(0.02*V);
      var need=Math.max(wmm,wDrop);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=210, x1=w-120, mx=Math.max(wmm,wDrop)*1.25;
      [["温度上昇から",wmm,C("--alias")],["電圧降下 2 % から",wDrop,C("--blue")],
       ["採用値（大きい方）",need,C("--signal")]].forEach(function(p,i){
        var y=52+i*54;
        lab(ctx,p[0],x0-10,y+5,C("--muted"),"right",10.5);
        var bw=(x1-x0)*Math.min(p[1]/mx,1);
        ctx.fillStyle=p[2];ctx.globalAlpha=i===2?.38:.22;ctx.fillRect(x0,y-13,bw,26);ctx.globalAlpha=1;
        ctx.strokeStyle=p[2];ctx.lineWidth=1.6;ctx.strokeRect(x0,y-13,bw,26);
        lab(ctx,f(p[1],3)+" mm",x0+bw+8,y+5,p[2],"left",10.5);
      });
      var minW=ozv<=1?0.127:(ozv<=2?0.20:0.30);
      lab(ctx,"製造の下限 "+f(minW,3)+" mm",x0,h-24,C("--faint"),"left",10);
      lab(ctx,wDrop>wmm?"電圧降下が支配的":"温度上昇が支配的",x0,h-46,
          wDrop>wmm?C("--blue"):C("--alias"),"left",11);
      out.innerHTML="シート抵抗 <b>"+f(Rsq*1000,2)+" mΩ/□</b>（"+ozv+" oz）"+
        " ／ 採用幅 "+f(need,3)+" mm・長さ "+len+" mm での抵抗 <b>"+f(Rsq*len/need*1000,1)+" mΩ</b>"+
        "<br>温度上昇基準の幅で使った場合: 電圧降下 <b>"+f(dV*1000,1)+" mV</b>（"+f(pct,2)+" %）"+
        " ／ 発熱 "+f(pw*1000,0)+" mW"+
        (pct>2?' <span class="warn">← 電圧降下が大きい。この幅では足りない</span>':' <b class="ok">← 許容内</b>')+
        "<br>"+(need>5
          ? '<span class="warn">'+f(need,1)+' mm は線として非現実的。ベタで配るか、銅厚を上げるか、複数層を並列にする（13 章）</span>'
          : "内層は係数が半分なので、同じ電流に約 2 倍の幅が要る。IPC-2221 は保守的で、隣にベタがあれば 1.5〜2 倍流せる")+
        "<br>GND 側でも同じだけ落ちる。そして GND の降下は<b>基準電位そのもののずれ</b>である（09・17 章）";
    }
    [sI,sT,sD,sV].forEach(function(s){s.input.addEventListener("input",draw);});
    [sO,sL].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 10. imped — 特性インピーダンス ============ */
  REG.imped=function(el){
    head(el,"DEMO","目標値を寸法に翻訳する");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sS=select(row,"構造",["マイクロストリップ（外層）","ストリップライン（内層）"]);
    var sH=slider(row,"誘電体厚 h（または b）[mm]",0.05,1.60,0.10,0.01);
    var sW=slider(row,"線幅 w [mm]",0.05,3.00,0.18,0.01);
    var sE=slider(row,"比誘電率 εr",2.5,5.0,4.3,0.1);
    var sO=select(row,"銅箔厚",["0.5 oz","1 oz","2 oz"]);
    var cB=checkbox(row,"基準面が途切れている区間がある",false);
    var out=readout(el);
    function draw(){
      var strip=(+sS.value===1), hh=+sH.input.value, ww=+sW.input.value, er=+sE.input.value,
          ozv=[0.5,1,2][+sO.value], broken=cB.checked;
      sH.val.textContent=f(hh,3)+" mm"; sW.val.textContent=f(ww,3)+" mm"; sE.val.textContent=f(er,1);
      var t=ozv*0.0348;
      var Z=strip?z0sl(hh,ww,t,er):z0ms(hh,ww,t,er);
      var eeff=strip?er:( (er+1)/2 + (er-1)/2/Math.sqrt(1+12*hh/ww) );
      var tpd=Math.sqrt(eeff)/0.3;               /* ps/mm */
      var wNeed=solveW(50,hh,t,er,strip);
      /* 公差は RSS で合成する（各要因は独立にばらつく） */
      function zof(h2,w2,t2,e2){return strip?z0sl(h2,w2,t2,e2):z0ms(h2,w2,t2,e2);}
      var dh=zof(hh*1.1,ww,t,er)-Z, dw=zof(hh,ww+0.02,t,er)-Z,
          de=zof(hh,ww,t,er*1.05)-Z, dt=zof(hh,ww,t*1.15,er)-Z;
      var dz=Math.sqrt(dh*dh+dw*dw+de*de+dt*dt);
      var zmin=Z-dz, zmax=Z+dz;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      /* 断面 */
      var cx=w*0.26, base=h-70, sc=Math.min(150/Math.max(hh,0.2), 200/Math.max(ww,0.3));
      sc=Math.min(sc,320);
      if(strip){
        ctx.fillStyle=C("--muted");ctx.fillRect(cx-130,base-hh*sc-8,260,7);
        ctx.fillStyle=C("--panel");ctx.fillRect(cx-130,base-hh*sc,260,hh*sc);
        ctx.strokeStyle=C("--line");ctx.strokeRect(cx-130,base-hh*sc,260,hh*sc);
        ctx.fillStyle=C("--signal");ctx.fillRect(cx-ww*sc/2,base-hh*sc/2-t*sc/2,ww*sc,Math.max(t*sc,4));
        ctx.fillStyle=C("--muted");ctx.fillRect(cx-130,base,260,7);
      }else{
        ctx.fillStyle=C("--panel");ctx.fillRect(cx-130,base-hh*sc,260,hh*sc);
        ctx.strokeStyle=C("--line");ctx.strokeRect(cx-130,base-hh*sc,260,hh*sc);
        ctx.fillStyle=C("--signal");ctx.fillRect(cx-ww*sc/2,base-hh*sc-Math.max(t*sc,4),ww*sc,Math.max(t*sc,4));
        ctx.fillStyle=broken?C("--alias"):C("--muted");
        if(broken){ctx.fillRect(cx-130,base,105,7);ctx.fillRect(cx+25,base,105,7);}
        else ctx.fillRect(cx-130,base,260,7);
      }
      lab(ctx,strip?"ストリップライン":"マイクロストリップ",cx,h-34,C("--muted"),"center",10.5);
      /* 目盛 */
      var tx=cx+150;
      [["特性インピーダンス Z₀",f(Z,1)+" Ω"],
       ["実効比誘電率 ε_eff",f(eeff,2)],
       ["遅延",f(tpd,2)+" ps/mm"],
       ["50 Ω に必要な線幅",f(wNeed,3)+" mm"],
       ["製造ばらつきの範囲",f(zmin,1)+" 〜 "+f(zmax,1)+" Ω"]].forEach(function(p,i){
        lab(ctx,p[0],tx,54+i*32,C("--muted"),"left",10.5);
        lab(ctx,p[1],w-24,54+i*32,C("--signal"),"right",11);
      });
      var Zbroken=Z*2.2;
      out.innerHTML="Z₀ = <b>"+f(Z,1)+" Ω</b>"+
        (Math.abs(Z-50)<5?' <b class="ok">50 Ω に近い</b>':
         (Z>50?' <span class="warn">高い → 線を太くするか、基準面を近づける</span>'
              :' <span class="warn">低い → 線を細くするか、基準面を離す</span>'))+
        " ／ ばらつき込みで "+f(zmin,1)+"〜"+f(zmax,1)+" Ω（±"+f((zmax-zmin)/2/Z*100,1)+" %）"+
        "<br>"+(broken
          ? '<span class="warn"><b>基準面が途切れている区間では、Z₀ が '+f(Zbroken,0)+' Ω 級に跳ね上がる。</b>'+
            '製造ばらつき ±10 % を気にする前に、まずここを確認する（10 章）</span>'
          : "基準面は連続している。あとは製造ばらつきの範囲内に収まるかどうかの話である")+
        "<br>遅延 "+f(tpd,2)+" ps/mm → 制御が必要な配線長は、立ち上がり 200 ps なら約 "+f(200/6/tpd,1)+" mm 以上（t_d > t_r/6）";
    }
    [sH,sW,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    [sS,sO].forEach(function(s){s.addEventListener("change",draw);});
    cB.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 11. diffpair — 差動ペアとスキュー ============ */
  REG.diffpair=function(el){
    head(el,"DEMO","スキューが同相ノイズを作る");
    var cv=screen(el,280), cc=cctx(cv);
    var row=ctrls(el);
    var sW=slider(row,"線幅 w [mm]",0.06,0.40,0.13,0.01);
    var sS=slider(row,"間隔 s [mm]",0.06,1.00,0.13,0.01);
    var sH=slider(row,"基準面までの距離 h [mm]",0.05,0.50,0.10,0.01);
    var sK=slider(row,"長さの差 [mm]",0,15,3,0.1);
    var sT=slider(row,"立ち上がり時間 [ps]",30,1000,300,10);
    var out=readout(el);
    function draw(){
      var ww=+sW.input.value, ss=+sS.input.value, hh=+sH.input.value,
          dl=+sK.input.value, tr=+sT.input.value;
      sW.val.textContent=f(ww,3)+" mm"; sS.val.textContent=f(ss,3)+" mm";
      sH.val.textContent=f(hh,3)+" mm"; sK.val.textContent=f(dl,1)+" mm";
      sT.val.textContent=f(tr,0)+" ps";
      var er=4.3, t=0.035;
      var z0=z0ms(hh,ww,t,er);
      var kc=Math.exp(-2.2*ss/hh);                 /* 結合係数の目安 */
      var zodd=z0*(1-0.45*kc), zdiff=2*zodd;
      var tpd=6.3;                                 /* ps/mm（外層） */
      var skew=dl*tpd;
      var allow=tr/10;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      /* 波形 */
      var x0=118,x1=w-30, ty=70, amp=26;
      function step(t0,c,y){
        ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.beginPath();
        for(var i=0;i<=300;i++){
          var u=i/300, tt=u*1000;      /* ps */
          var v=1/(1+Math.exp(-(tt-t0-tr/2)/(tr/4.4)));
          ctx.lineTo(x0+(x1-x0)*u, y - (v-0.5)*2*amp);
        }
        ctx.stroke();
      }
      step(200, C("--signal"), ty);
      step(200+skew, C("--blue"), ty+70);
      lab(ctx,"V₊",x0-8,ty+4,C("--signal"),"right",10.5);
      lab(ctx,"V₋（"+f(skew,0)+" ps 遅れ）",x0-8,ty+74,C("--blue"),"right",10.5);
      /* 同相成分 */
      var cy=ty+170;
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.2;ctx.beginPath();
      var peak=0;
      for(var i=0;i<=300;i++){
        var u=i/300, tt=u*1000;
        var a=1/(1+Math.exp(-(tt-200-tr/2)/(tr/4.4)));
        var b=1/(1+Math.exp(-(tt-200-skew-tr/2)/(tr/4.4)));
        var cm=(a-b);
        peak=Math.max(peak,Math.abs(cm));
        ctx.lineTo(x0+(x1-x0)*u, cy - cm*amp*2);
      }
      ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      lab(ctx,"同相成分",x0-8,cy+4,C("--alias"),"right",10.5);
      lab(ctx,"ピーク "+f(peak*100,0)+" %（振幅比）",x1,cy-38,C("--alias"),"right",10.5);
      out.innerHTML="1 本の Z₀ = "+f(z0,1)+" Ω ／ 結合で Z_odd = "+f(zodd,1)+" Ω → <b>差動 Z_diff = "+f(zdiff,1)+" Ω</b>"+
        (Math.abs(zdiff-100)<8?' <b class="ok">100 Ω に近い</b>':
         (Math.abs(zdiff-90)<8?' <b class="ok">90 Ω に近い（USB 向き）</b>':
          ' <span class="warn">目標から外れている</span>'))+
        "<br>スキュー <b>"+f(skew,0)+" ps</b>（長さ差 "+f(dl,1)+" mm × 6.3 ps/mm）"+
        " ／ 許容の目安 t_r/10 = <b>"+f(allow,0)+" ps</b>"+
        (skew>allow?' <span class="warn">← 超過。同相成分がピークで振幅の '+f(peak*100,0)+' % に達している</span>'
                   :' <b class="ok">← 許容内</b>')+
        "<br>間隔 s/h = "+f(ss/hh,2)+" → "+(ss/hh<1.5?"<b>タイトカップリング</b>: 放射が小さい代わりに、間隔のばらつきが Z に直接効く"
                                        :(ss/hh>3?"<b>ルースカップリング</b>: Z が安定する代わりに放射が増える"
                                                 :"中間的な結合"))+
        "<br>補正はずれが生じた場所のすぐ近くで。受信側でまとめて補正すると、その間の区間ぜんぶが放射源になる（11 章）";
    }
    [sW,sS,sH,sK,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 12. via — ビアの寸法とスタブ ============ */
  REG.via=function(el){
    head(el,"DEMO","層の割り当てだけでスタブは避けられる");
    var cv=screen(el,290), cc=cctx(cv);
    var row=ctrls(el);
    var sN=select(row,"層数",["4 層","8 層","12 層"]);
    var sT=slider(row,"板厚 [mm]",0.8,3.2,1.6,0.1);
    var sD=slider(row,"ドリル径 [mm]",0.15,0.60,0.30,0.01);
    var sF=slider(row,"信号の入る層",1,1,1,1);
    var sX=slider(row,"信号の出る層",2,2,2,1);
    var cB=checkbox(row,"バックドリルでスタブを除去",false);
    var out=readout(el);
    function sync(){
      var n=[4,8,12][+sN.value];
      sF.input.max=n; sX.input.max=n;
      if(+sX.input.value>n)sX.input.value=n;
      if(+sF.input.value>n)sF.input.value=1;
    }
    function draw(){
      var n=[4,8,12][+sN.value], TH=+sT.input.value, D=+sD.input.value,
          from=Math.min(+sF.input.value,n), to=Math.min(+sX.input.value,n), bd=cB.checked;
      sT.val.textContent=f(TH,2)+" mm"; sD.val.textContent=f(D,2)+" mm";
      sF.val.textContent="L"+from; sX.val.textContent="L"+to;
      var pitch=TH/(n-1);
      var deep=Math.max(from,to);
      var stub=bd?0.2:(n-deep)*pitch;
      var er=4.3;
      var fres=stub>0.05 ? 3e8/(4*(stub/1000)*Math.sqrt(er))/1e9 : Infinity;
      /* インダクタンス（inch 換算） */
      var hin=TH/25.4, din=D/25.4;
      var L=5.08*hin*(Math.log(4*hin/din)+1);
      var asp=TH/D;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w*0.26, top=44, bot=h-64, H=bot-top;
      ctx.fillStyle=C("--panel");ctx.fillRect(cx-110,top,220,H);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(cx-110,top,220,H);
      for(var i=0;i<n;i++){
        var y=top+H*i/(n-1);
        ctx.fillStyle=C("--muted");ctx.fillRect(cx-110,y-2,220,4);
        lab(ctx,"L"+(i+1),cx-118,y+4,C("--faint"),"right",9);
      }
      var yF=top+H*(from-1)/(n-1), yT=top+H*(to-1)/(n-1);
      var yDeep=top+H*(deep-1)/(n-1);
      var yEnd=bd? yDeep+H*0.04 : bot;
      /* ビアの筒 */
      ctx.fillStyle=C("--signal");
      ctx.fillRect(cx-9,top,5,yEnd-top); ctx.fillRect(cx+4,top,5,yEnd-top);
      /* スタブ部分 */
      if(!bd&&deep<n){
        ctx.fillStyle=C("--alias");
        ctx.fillRect(cx-9,yDeep,5,bot-yDeep); ctx.fillRect(cx+4,yDeep,5,bot-yDeep);
        lab(ctx,"スタブ "+f(stub,2)+" mm",cx+120,(yDeep+bot)/2,C("--alias"),"left",10);
      }
      ctx.fillStyle=C("--signal");
      ctx.fillRect(cx-100,yF-3,91,6); ctx.fillRect(cx+9,yT-3,91,6);
      var tx=cx+150;
      [["スタブ長",(stub<0.05?"実質なし":f(stub,2)+" mm")],
       ["スタブ共振",(isFinite(fres)?f(fres,1)+" GHz":"—")],
       ["ビアのインダクタンス",f(L,2)+" nH"],
       ["アスペクト比",f(asp,1)+" : 1"]].forEach(function(p,i){
        lab(ctx,p[0],tx,64+i*34,C("--muted"),"left",10.5);
        lab(ctx,p[1],w-24,64+i*34,C("--signal"),"right",11);
      });
      out.innerHTML="L"+from+" → L"+to+" に信号を渡す構成"+
        (bd?"（バックドリル適用）":"")+
        "<br>"+(isFinite(fres)
          ? "スタブ共振 <b>"+f(fres,1)+" GHz</b>"+
            (fres<20?' <span class="warn">← 25 Gbps 級（12.5 GHz 中心）の帯域に入る。対策が要る</span>'
                    :' <b class="ok">← 一般的な速度なら問題にならない</b>')
          : '<b class="ok">スタブがない構成。</b>これが最も安く確実な解である')+
        "<br>アスペクト比 "+f(asp,1)+":1"+(asp>8?' <span class="warn">← 8:1 を超えている。めっきが奥まで回らない</span>':' <b class="ok">← 製造可能</b>')+
        " ／ インダクタンス "+f(L,2)+" nH（1 A/ns で "+f(L,2)+" V、14 章）"+
        "<br><b>まず「外側に近い層のペアで完結させる」を試す</b>——追加費用ゼロでスタブが消える（12 章）";
    }
    [sT,sD,sF,sX].forEach(function(s){s.input.addEventListener("input",draw);});
    sN.addEventListener("change",function(){sync();draw();});
    cB.addEventListener("change",draw);
    sync();reg(cv,draw);draw();
  };

  /* ============ 13. thermal — サーマルランド ============ */
  REG.thermal=function(el){
    head(el,"DEMO","はんだ付けできることと、電流が流せることの綱引き");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sM=select(row,"接続方式",["4 スポーク（既定）","2 スポーク","直結（ソリッド）"]);
    var sW=slider(row,"スポーク幅 [mm]",0.2,1.0,0.4,0.05);
    var sO=select(row,"銅箔厚",["0.5 oz","1 oz","2 oz"]);
    var sI=slider(row,"流す電流 [A]",0.1,10,1,0.1);
    var out=readout(el);
    function draw(){
      var mode=+sM.value, sw=+sW.input.value, ozv=[0.5,1,2][+sO.value], I=+sI.input.value;
      sW.val.textContent=f(sw,2)+" mm"; sI.val.textContent=f(I,1)+" A";
      var nsp=[4,2,0][mode];
      var Rsq=sheetR(ozv);
      /* スポーク長 0.5 mm 相当 */
      var Reff = nsp===0 ? Rsq*0.15 : Rsq*(0.5/(sw*nsp));
      var dV=I*Reff, pw=I*I*Reff;
      /* 熱の逃げやすさ（相対） */
      var heat = nsp===0 ? 1.0 : Math.min(1, nsp*sw/3.2);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var cx=w*0.28, cy=h*0.5, R=64;
      /* ベタ */
      ctx.fillStyle=C("--signal-soft");ctx.fillRect(cx-130,cy-84,260,168);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1;ctx.strokeRect(cx-130,cy-84,260,168);
      if(nsp>0){
        /* エアギャップ */
        ctx.fillStyle=C("--screen");
        ctx.beginPath();ctx.arc(cx,cy,R*0.72,0,TAU);ctx.fill();
        /* スポーク */
        ctx.fillStyle=C("--signal-soft");
        var swpx=sw*38;
        for(var i=0;i<nsp;i++){
          var a=i*TAU/nsp;
          ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
          ctx.fillRect(-swpx/2,-R*0.75,swpx,R*0.75);
          ctx.restore();
        }
      }
      /* パッド */
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(cx,cy,R*0.42,0,TAU);ctx.fill();
      ctx.fillStyle=C("--screen");ctx.beginPath();ctx.arc(cx,cy,R*0.2,0,TAU);ctx.fill();
      lab(ctx,["4 スポーク","2 スポーク","直結"][mode],cx,cy+104,C("--muted"),"center",10.5);
      var tx=cx+160;
      [["実効的な接続抵抗",f(Reff*1000,2)+" mΩ"],
       ["電圧降下",f(dV*1000,2)+" mV"],
       ["ここでの発熱",f(pw*1000,1)+" mW"],
       ["熱の逃げやすさ",f(heat*100,0)+" %（直結を 100 % として）"]].forEach(function(p,i){
        lab(ctx,p[0],tx,64+i*36,C("--muted"),"left",10.5);
        lab(ctx,p[1],w-24,64+i*36,C("--signal"),"right",11);
      });
      out.innerHTML=(nsp===0
        ? '<b>直結。</b>電気的には最良だが、こてを当てても熱がベタに逃げて<span class="warn">溶けない</span>'
        : "スポーク "+nsp+" 本 × "+f(sw,2)+" mm ＝ 実効的に幅 "+f(nsp*sw,2)+" mm の配線 1 本ぶん")+
        "<br>"+(pw>200
          ? '<span class="warn">この電流でここだけが '+f(pw*1000,0)+' mW 発熱する。大電流部品は直結にし、リフローの熱プロファイルで対応する</span>'
          : (nsp===0 ? "大電流・放熱重視ならこれでよい。ただし手はんだ・修理は不可能になる"
                     : '<b class="ok">この電流なら問題ない。</b>手はんだと修理が可能な状態を保てる'))+
        "<br>チップ部品では<b>両側の熱容量を揃える</b>こと。片側だけベタ直結だとトゥームストーンの原因になる（21 章）";
    }
    [sW,sI].forEach(function(s){s.input.addEventListener("input",draw);});
    [sM,sO].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 14. pdn — デカップリング配置 ============ */
  REG.pdn=function(el){
    head(el,"DEMO","「値を変える」より「1 mm 近づける」");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sD=slider(row,"IC からコンデンサまで [mm]",0.5,20,3,0.5);
    var sN=slider(row,"同じ値のコンデンサの個数",1,8,2,1);
    var sV=select(row,"ビアの本数（各極）",["1 本","2 本"]);
    var sC=select(row,"容量",["22 nF","100 nF","1 µF","10 µF"]);
    var sI=slider(row,"電流変動 ΔI [A]",0.2,5,2,0.1);
    var out=readout(el);
    function draw(){
      var dd=+sD.input.value, n=+sN.input.value, nv=[1,2][+sV.value],
          Cv=[22e-9,100e-9,1e-6,10e-6][+sC.value], dI=+sI.input.value;
      sD.val.textContent=f(dd,1)+" mm"; sN.val.textContent=n+" 個"; sI.val.textContent=f(dI,1)+" A";
      var Lpart=0.5e-9;                       /* 部品 ESL */
      var Ltrace=dd*1.0e-9;                   /* 配線 1 nH/mm */
      var Lvia=2*1.0e-9/nv;                   /* 電源側＋GND 側 */
      var Lone=Lpart+Ltrace+Lvia;
      var Ltot=Lone/n, Ctot=Cv*n;
      var ESR=0.01/n;
      var srf=1/(2*Math.PI*Math.sqrt(Ltot*Ctot));
      var Ztarget=0.05/dI;                    /* 1.0 V の 5 % を仮定 */
      var fmax=Ztarget/(2*Math.PI*Ltot);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      /* Z(f) 曲線 */
      var P={l:56,r:20,t:26,b:38};
      function X(fq){return P.l+(Math.log10(fq)-5)/5*(w-P.l-P.r);}          /* 100 kHz〜10 GHz */
      function Y(z){var v=(Math.log10(Math.max(z,1e-4))+4)/6;                /* 0.1 mΩ〜100 Ω */
        return Math.max(P.t, h-P.b-Math.min(v,1)*(h-P.t-P.b));}
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      [1e-3,1e-2,1e-1,1,10].forEach(function(z){
        ctx.beginPath();ctx.moveTo(P.l,Y(z));ctx.lineTo(w-P.r,Y(z));ctx.stroke();
        lab(ctx,(z<1?f(z*1000,0)+" mΩ":f(z,0)+" Ω"),P.l-6,Y(z)+4,C("--faint"),"right",9);
      });
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(P.l,h-P.b);ctx.lineTo(w-P.r,h-P.b);ctx.stroke();
      [1e5,1e6,1e7,1e8,1e9,1e10].forEach(function(fq){
        lab(ctx,eng(fq,"Hz",0),X(fq),h-P.b+16,C("--faint"),"center",9);});
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      for(var i=0;i<=240;i++){
        var fq=Math.pow(10,5+5*i/240);
        var z=Math.sqrt(ESR*ESR+Math.pow(2*Math.PI*fq*Ltot-1/(2*Math.PI*fq*Ctot),2));
        ctx.lineTo(X(fq),Y(z));
      }
      ctx.stroke();
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(P.l,Y(Ztarget));ctx.lineTo(w-P.r,Y(Ztarget));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"Z_target = "+f(Ztarget*1000,0)+" mΩ",w-P.r-4,Y(Ztarget)-6,C("--alias"),"right",10);
      lab(ctx,"SRF "+eng(srf,"Hz",1),X(srf),Y(ESR)-10,C("--signal"),"center",10);
      out.innerHTML="ループの内訳: 部品 ESL 0.5 nH ＋ <b>配線 "+f(Ltrace*1e9,1)+" nH</b> ＋ ビア "+f(Lvia*1e9,1)+" nH"+
        " = 1 個あたり <b>"+f(Lone*1e9,1)+" nH</b> → "+n+" 個並列で <b>"+f(Ltot*1e9,2)+" nH</b>"+
        "<br>自己共振 <b>"+eng(srf,"Hz",1)+"</b> ／ Z_target "+f(Ztarget*1000,0)+" mΩ を維持できる上限は <b>"+eng(fmax,"Hz",1)+"</b>"+
        (fmax<5e7?' <span class="warn">← 低すぎる</span>':' <b class="ok">← 十分</b>')+
        "<br>"+(Ltrace>2e-9
          ? '<span class="warn"><b>配線のインダクタンスが支配的（'+f(Ltrace*1e9,1)+' nH）。</b>'+
            'この状態で容量値や型番を変えても意味がない。まず距離を詰める</span>'
          : '<b class="ok">配置は良好。</b>ここまで来て初めて、容量値の使い分けに意味が出てくる')+
        "<br>ビアを 2 本にすると、その部分の L は半分になる（コストはほぼゼロ）。同じ値を複数個並べれば反共振も起きない（14 章）";
    }
    [sD,sN,sI].forEach(function(s){s.input.addEventListener("input",draw);});
    [sV,sC].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 15. xtalk — クロストーク ============ */
  REG.xtalk=function(el){
    head(el,"DEMO","s を広げるのと h を薄くするのは同じくらい効く");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sW=slider(row,"線幅 w [mm]",0.08,0.50,0.18,0.01);
    var sS=slider(row,"配線間の隙間 s [mm]",0.08,2.00,0.36,0.02);
    var sH=slider(row,"基準面までの高さ h [mm]",0.05,0.80,0.10,0.01);
    var sL=slider(row,"並走長 [mm]",5,200,50,1);
    var sT=slider(row,"立ち上がり時間 [ps]",30,2000,500,10);
    var sM=select(row,"構造",["マイクロストリップ（外層）","ストリップライン（内層）"]);
    var out=readout(el);
    function draw(){
      var ww=+sW.input.value, ss=+sS.input.value, hh=+sH.input.value,
          len=+sL.input.value, tr=+sT.input.value, strip=(+sM.value===1);
      sW.val.textContent=f(ww,3)+" mm"; sS.val.textContent=f(ss,2)+" mm";
      sH.val.textContent=f(hh,3)+" mm"; sL.val.textContent=len+" mm"; sT.val.textContent=f(tr,0)+" ps";
      var r=ss/hh;
      var kb=1/(1+r*r);                       /* 後方（NEXT）結合係数の目安 */
      var next=kb*0.25;                       /* 飽和値 */
      var tpd=strip?7.0:6.3;                  /* ps/mm */
      var tsat=tr/(2*tpd);                    /* 飽和に必要な長さ [mm] */
      var nextEff=next*Math.min(1,len/Math.max(tsat,0.001));
      var fext = strip ? 0 : kb*0.35*len*tpd/tr;
      fext=Math.min(fext,0.6);
      var ratio3w=(ww+ss)/ww;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      /* 断面 */
      var cx=w*0.24, base=h-58, sc=Math.min(130/Math.max(hh,0.1), 260/Math.max(ww*2+ss,0.4));
      sc=Math.min(sc,190);
      ctx.fillStyle=C("--panel");ctx.fillRect(cx-130,base-hh*sc,260,hh*sc);
      ctx.strokeStyle=C("--line");ctx.strokeRect(cx-130,base-hh*sc,260,hh*sc);
      var tot=(ww*2+ss)*sc;
      ctx.fillStyle=C("--signal");ctx.fillRect(cx-tot/2,base-hh*sc-6,ww*sc,6);
      ctx.fillStyle=C("--blue");ctx.fillRect(cx-tot/2+(ww+ss)*sc,base-hh*sc-6,ww*sc,6);
      ctx.fillStyle=C("--muted");ctx.fillRect(cx-130,base,260,6);
      lab(ctx,"加害者",cx-tot/2+ww*sc/2,base-hh*sc-14,C("--signal"),"center",9.5);
      lab(ctx,"被害者",cx-tot/2+(ww+ss)*sc+ww*sc/2,base-hh*sc-14,C("--blue"),"center",9.5);
      lab(ctx,"s/h = "+f(r,2),cx,base+26,C("--muted"),"center",11);
      /* バー */
      var tx=cx+170, bw=w-tx-90;
      [["NEXT（近端）",nextEff,C("--alias")],["FEXT（遠端）",fext,C("--blue")]].forEach(function(p,i){
        var y=76+i*54;
        lab(ctx,p[0],tx,y-8,C("--muted"),"left",10.5);
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(tx,y,bw,22);
        var fw=bw*Math.min(p[1]/0.3,1);
        ctx.fillStyle=p[2];ctx.globalAlpha=.30;ctx.fillRect(tx,y,fw,22);ctx.globalAlpha=1;
        ctx.strokeStyle=p[2];ctx.lineWidth=1.6;ctx.strokeRect(tx,y,Math.max(fw,1.5),22);
        lab(ctx,f(p[1]*100,1)+" %",tx+bw+8,y+16,p[2],"left",11);
        [0.05,0.10,0.20].forEach(function(g){
          var gx=tx+bw*g/0.3;
          ctx.strokeStyle=C("--line");ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(gx,y+22);ctx.lineTo(gx,y+26);ctx.stroke();
          lab(ctx,f(g*100,0),gx,y+37,C("--faint"),"center",8.5);
        });
      });
      lab(ctx,"（振幅比 %。目盛りは 30 % で満尺）",tx,h-22,C("--faint"),"left",9);
      out.innerHTML="s/h = <b>"+f(r,2)+"</b> ／ 中心間距離は線幅の <b>"+f(ratio3w,2)+" 倍</b>"+
        (ratio3w>=3?' <b class="ok">3W 則を満たす</b>':' <span class="warn">3W 則（中心間 3W）を下回る</span>')+
        "<br>NEXT <b>"+f(nextEff*100,1)+" %</b>"+
        (len>=tsat?"（飽和している。これ以上長くしても増えない）":"（まだ飽和前。長さに比例して増える）")+
        " ／ FEXT <b>"+f(fext*100,1)+" %</b>"+
        (strip?' <b class="ok">← ストリップラインなのでほぼゼロ</b>':"（長さに比例して増え続ける）")+
        "<br>"+(strip
          ? "内層に通すだけで FEXT が消える。長く並走する高速バスでは、間隔を広げるよりこちらが効く（15 章）"
          : "h を半分にすると s/h が 2 倍になり、結合はおよそ 1/4 に減る —— 間隔を 2 倍にするのと同等である")+
        "<br>許容の目安: 1 本あたり 5 % 程度。<b>両隣が同時に切り替わる前提で足し合わせること</b>";
    }
    [sW,sS,sH,sL,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    sM.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 16. iface — インタフェース別の制約 ============ */
  REG.iface=function(el){
    head(el,"DEMO","その規格が要求しているものは何か");
    var row=ctrls(el);
    var sI=select(row,"インタフェース",["USB 2.0 HS","USB 3.x","イーサネット 1000BASE-T","PCIe Gen3/4",
                                 "HDMI / DisplayPort","MIPI D-PHY","DDR3/4","SPI / I²C（低速）"]);
    var sT=slider(row,"想定する立ち上がり時間 [ps]",30,3000,300,10);
    var pn=panel(el), out=readout(el);
    var IF=[
      {n:"USB 2.0 HS",sp:"480 Mbps",z:"90 Ω 差動",sk:"数 mm（緩い）",
       pts:["短く、ビアを最少に","ESD 保護素子はコネクタの近くに、容量の小さいものを","基準面をまたがない","他の信号から 5W 以上離す"],
       cat:"差動シリアル"},
      {n:"USB 3.x",sp:"5〜10 Gbps",z:"90 Ω 差動",sk:"0.1 mm 級",
       pts:["AC カップリング必須。2 本とも同じ位置に対称に","ビアスタブに注意（バックドリルか層の割り当てで）","レーン間の長さ整合は不要","コネクタ直後の不連続が最も響く"],
       cat:"差動シリアル"},
      {n:"イーサネット 1000BASE-T",sp:"125 MHz/ペア",z:"100 Ω 差動",sk:"中程度",
       pts:["トランス以降はシャーシ側。GND を分離する（数少ない正当な分割）","ペア間の長さも整合させる","トランスの下に配線を通さない","コネクタ周りの GND を強化"],
       cat:"差動（磁気結合あり）"},
      {n:"PCIe Gen3/4",sp:"8〜16 GT/s",z:"85 Ω 差動",sk:"非常に厳しい（0.1 mm 級）",
       pts:["AC カップリングは送信側の近くに","スタブ対策必須（バックドリル or 層設計）","リファレンスクロックのジッタに注意","各レーン独立なので、レーン間整合は不要"],
       cat:"差動シリアル"},
      {n:"HDMI / DisplayPort",sp:"〜数 Gbps",z:"100 Ω 差動",sk:"厳しい",
       pts:["ESD 保護は必須（コネクタ直近・低容量品）","ペア間も長さを揃える","コネクタの不連続が支配的","シールド/シャーシ GND の扱いを規格で確認"],
       cat:"差動シリアル"},
      {n:"MIPI D-PHY",sp:"〜2.5 Gbps/レーン",z:"100 Ω 差動",sk:"厳しい",
       pts:["低振幅なのでノイズに弱い。他信号から離す","クロックとデータレーンの長さを揃える","短く、ビア最少","カメラ/ディスプレイのフレキ接続部の不連続に注意"],
       cat:"差動シリアル"},
      {n:"DDR3/4",sp:"〜3200 MT/s",z:"40〜50 Ω 単線",sk:"—（バイト単位で等長）",
       pts:["DQ/DQS は同じバイトレーン内でのみ等長","ADDR/CMD はフライバイ。分岐を作らない","終端抵抗の値と位置は IC のガイドに従う","IC メーカのデザインガイドが規格書より優先"],
       cat:"並列バス"},
      {n:"SPI / I²C（低速）",sp:"〜50 MHz",z:"—",sk:"—",
       pts:["立ち上がりが速ければ配慮が要る（下の判定を見ること）","I²C はプルアップ抵抗値と容量で波形が決まる","クロックは他の信号から離す","必要以上に速いエッジを使わない"],
       cat:"低速"},
    ];
    function draw(){
      var d=IF[+sI.value], tr=+sT.input.value;
      sT.val.textContent=f(tr,0)+" ps";
      var fknee=0.35/(tr*1e-12);
      var lenMS=tr/6/6.3, lenSL=tr/6/7.0;
      pn.innerHTML=tbl(["項目","内容"],[
        ["分類", "<b>"+esc(d.cat)+"</b>"],
        ["速度", esc(d.sp)],
        ["特性インピーダンス", "<b>"+esc(d.z)+"</b>"],
        ["ペア内スキュー許容", esc(d.sk)],
      ],["left","left"])+
      '<div style="margin-top:.5rem;color:var(--signal);font-weight:700">アートワークの要点</div>'+
      '<ul style="margin:.3rem 0 0;padding-left:1.2rem;color:var(--muted)">'+
      d.pts.map(function(p){return "<li>"+esc(p)+"</li>";}).join("")+'</ul>';
      out.innerHTML="立ち上がり "+f(tr,0)+" ps → ニー周波数 <b>"+eng(fknee,"Hz",1)+"</b>"+
        "<br>インピーダンス制御が要る配線長: 外層 <b>"+f(lenMS,1)+" mm</b> 以上 ／ 内層 <b>"+f(lenSL,1)+" mm</b> 以上（t_d > t_r/6）"+
        (lenMS<10?' <span class="warn">← 数 mm で制御が要る。コネクタから IC までの距離が勝負を決める</span>':"")+
        "<br><b>具体的な数値は規格の版と IC で変わる。必ず規格書と IC のデザインガイドで確認すること</b>（16 章）";
    }
    sT.input.addEventListener("input",draw);
    sI.addEventListener("change",draw);
    draw();
  };

  /* ============ 17. mixed — アナログ部の配置 ============ */
  REG.mixed=function(el){
    head(el,"DEMO","配置だけで分離できることを確かめる");
    var cv=screen(el,290), cc=cctx(cv);
    var row=ctrls(el);
    var sA=slider(row,"アナログ領域の位置",0,100,15,1);
    var sD=slider(row,"デジタル領域の位置",0,100,55,1);
    var sP=slider(row,"電源（DC-DC）の位置",0,100,88,1);
    var sR=slider(row,"ADC の回転 [°]",0,180,0,180);
    var cS=checkbox(row,"グラウンドを分割する（非推奨）",false);
    var out=readout(el);
    function draw(){
      var ap=+sA.input.value/100, dp=+sD.input.value/100, pp=+sP.input.value/100,
          rot=+sR.input.value, split=cS.checked;
      sA.val.textContent=f(ap*100,0)+" %"; sD.val.textContent=f(dp*100,0)+" %";
      sP.val.textContent=f(pp*100,0)+" %"; sR.val.textContent=rot+"°";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var bx=30,by=36,bw=w-60,bh=h-96;
      ctx.fillStyle=C("--panel");ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.strokeRect(bx,by,bw,bh);
      var ax=bx+20+(bw-140)*ap, dx=bx+20+(bw-140)*dp, px=bx+20+(bw-140)*pp;
      var cy=by+bh*0.5;
      /* 分割線 */
      if(split){
        var mid=(ax+dx)/2+50;
        ctx.fillStyle=C("--screen");ctx.fillRect(mid-5,by,10,bh);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
        ctx.strokeRect(mid-5,by,10,bh);ctx.setLineDash([]);
        lab(ctx,"スリット",mid,by-6,C("--alias"),"center",9.5);
      }
      /* 領域ブロック */
      function blk(x,label,col,wd){
        ctx.fillStyle=col;ctx.globalAlpha=.16;ctx.fillRect(x,cy-46,wd,92);ctx.globalAlpha=1;
        ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.strokeRect(x,cy-46,wd,92);
        lab(ctx,label,x+wd/2,cy-54,col,"center",10);
      }
      blk(ax,"アナログ",C("--blue"),100);
      blk(dx,"デジタル",C("--signal"),100);
      blk(px,"電源",C("--alias"),100);
      /* 各領域の中身（模式） */
      function chip(x,y,wd,ht,label,col){
        ctx.fillStyle=C("--screen");ctx.strokeStyle=col;ctx.lineWidth=1.2;
        rrect(ctx,x,y,wd,ht,2);ctx.fill();ctx.stroke();
        lab(ctx,label,x+wd/2,y+ht/2+3.5,col,"center",8.5);
      }
      chip(ax+8,cy-32,36,24,"AMP",C("--blue"));
      chip(ax+8,cy+8,36,24,"REF",C("--blue"));
      chip(dx+10,cy-32,40,24,"MCU",C("--signal"));
      chip(dx+10,cy+8,40,24,"MEM",C("--signal"));
      chip(px+8,cy-32,46,24,"DC-DC",C("--alias"));
      chip(px+8,cy+8,46,24,"L",C("--alias"));
      /* ADC はアナログ領域のデジタル側の端に置く */
      var adcx=(rot===0)?ax+56:ax-24;
      ctx.fillStyle=C("--screen");ctx.strokeStyle=C("--ink");ctx.lineWidth=1.6;
      rrect(ctx,adcx,cy-22,42,44,3);ctx.fill();ctx.stroke();
      lab(ctx,"ADC",adcx+21,cy+4,C("--ink"),"center",9.5);
      lab(ctx,(rot===0?"アナログピンが左（正）":"アナログピンが右（逆向き）"),adcx+21,cy+64,
          rot===0?C("--blue"):C("--alias"),"center",9);
      /* リターン電流の領域 */
      ctx.fillStyle=C("--signal");ctx.globalAlpha=.22;
      ctx.fillRect(dx-14,by+bh-26,128,20);ctx.globalAlpha=1;
      ctx.fillStyle=C("--blue");ctx.globalAlpha=.22;
      ctx.fillRect(ax-14,by+bh-26,128,20);ctx.globalAlpha=1;
      lab(ctx,"各領域のリターンは、その真下を流れる",bx+10,by+bh+34,C("--muted"),"left",10);
      /* 判定 */
      var sepAD=Math.abs(dx-ax)/((bw-140)/100);
      var sepAP=Math.abs(px-ax)/((bw-140)/100);
      var overlap=Math.max(0,100-Math.abs(dx-ax)/((bw-140)/100));
      var msgs=[];
      if(sepAD<25)msgs.push("アナログとデジタルが近すぎる（"+f(sepAD,0)+" % 間隔）");
      if(sepAP<40)msgs.push("アナログとスイッチング電源が近すぎる（"+f(sepAP,0)+" % 間隔）");
      if(rot!==0)msgs.push("ADC の向きが逆。アナログピンがデジタル側を向いている");
      if(split)msgs.push("グラウンドを分割している。スリットを横切る信号があれば破綻する（08 章）");
      out.innerHTML=(msgs.length===0
        ? '<b class="ok">配置だけで分離できている。</b>グラウンド面は 1 枚のままでよい'
        : '<span class="warn">'+msgs.map(esc).join(" ／ ")+'</span>')+
        "<br>領域が重ならなければ、各回路のリターン電流も重ならない —— <b>これが分離の実体である</b>（17 章）"+
        "<br>"+(split
          ? "分割が正当なのは、絶縁が必要な場合だけ。そのときも<b>信号がスリットを横切らない</b>ことが絶対条件である"
          : "スイッチング電源からは、物理的に離すのが最も効果的で最も安い対策である");
    }
    [sA,sD,sP,sR].forEach(function(s){s.input.addEventListener("input",draw);});
    cS.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 18. heat — 銅箔で放熱する ============ */
  REG.heat=function(el){
    head(el,"DEMO","面積・ビア・風のどれが効くか");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sP=slider(row,"発熱 [W]",0.1,10,3,0.1);
    var sJ=slider(row,"θ_JC [℃/W]",0.5,10,2,0.1);
    var sA=slider(row,"銅の面積 [mm²]",50,3000,400,10);
    var sN=slider(row,"サーマルビアの本数",0,36,16,1);
    var sV=slider(row,"風速 [m/s]",0,2,0,0.1);
    var sT=slider(row,"周囲温度 [℃]",0,85,60,1);
    var cB=checkbox(row,"裏面にも同じ銅面を作る",true);
    var out=readout(el);
    function draw(){
      var P=+sP.input.value, tJC=+sJ.input.value, A=+sA.input.value,
          nv=+sN.input.value, vel=+sV.input.value, Ta=+sT.input.value, both=cB.checked;
      sP.val.textContent=f(P,1)+" W"; sJ.val.textContent=f(tJC,1)+" ℃/W";
      sA.val.textContent=f(A,0)+" mm²"; sN.val.textContent=nv+" 本";
      sV.val.textContent=f(vel,1)+" m/s"; sT.val.textContent=Ta+" ℃";
      /* 熱抵抗 */
      var tSolder=1;
      var tVia = nv>0 ? 170/nv : 400;
      var tCu = 1500/Math.pow(A,0.62);
      if(both)tCu/=2;
      tCu/= (1+1.3*vel);
      var tot=tJC+tSolder+tVia+tCu;
      var Tj=Ta+P*tot;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=190,x1=w-130;
      var items=[["θ_JC",tJC,C("--muted")],["はんだ接合",tSolder,C("--muted")],
                 ["サーマルビア",tVia,C("--alias")],["銅面 → 空気",tCu,C("--signal")]];
      var mx=Math.max.apply(null,items.map(function(p){return p[1];}))*1.1;
      items.forEach(function(p,i){
        var y=52+i*40;
        lab(ctx,p[0],x0-10,y+5,C("--muted"),"right",10.5);
        var bw=(x1-x0)*Math.min(p[1]/mx,1);
        ctx.fillStyle=p[2];ctx.globalAlpha=.26;ctx.fillRect(x0,y-13,bw,26);ctx.globalAlpha=1;
        ctx.strokeStyle=p[2];ctx.lineWidth=1.4;ctx.strokeRect(x0,y-13,bw,26);
        lab(ctx,f(p[1],1)+" ℃/W",x0+bw+8,y+5,p[2],"left",10.5);
      });
      var y2=h-52;
      lab(ctx,"合計",x0-10,y2+5,C("--ink"),"right",11);
      lab(ctx,f(tot,1)+" ℃/W",x0,y2+5,C("--ink"),"left",11.5);
      lab(ctx,"T_J = "+f(Tj,0)+" ℃",x0+150,y2+5,Tj>125?C("--alias"):C("--blue"),"left",13);
      lab(ctx,Tj>125?"← 上限 125 ℃ を超過":"← 上限 125 ℃ 以内",x0+280,y2+5,
          Tj>125?C("--alias"):C("--blue"),"left",10.5);
      /* 対策の効き */
      function trial(mod){
        var v=tJC+tSolder;
        var tv= mod==="via" ? (nv+16>0?170/(nv+16):400) : tVia;
        var tc= mod==="area" ? 1500/Math.pow(A*2.5,0.62) : 1500/Math.pow(A,0.62);
        if(both)tc/=2;
        tc/=(1+1.3*(mod==="air"?vel+0.5:vel));
        return Ta+P*(v+tv+tc);
      }
      out.innerHTML="合計熱抵抗 <b>"+f(tot,1)+" ℃/W</b> → ジャンクション温度 <b>"+f(Tj,0)+" ℃</b>"+
        (Tj>125?' <span class="warn">← 成立しない</span>':' <b class="ok">← 成立する</b>')+
        "<br>ここから 1 手打った場合の T_J: 風 +0.5 m/s → <b>"+f(trial("air"),0)+" ℃</b>"+
        " ／ 銅面積 2.5 倍 → "+f(trial("area"),0)+" ℃"+
        " ／ ビア +16 本 → "+f(trial("via"),0)+" ℃"+
        "<br>"+(nv<9?'<span class="warn">サーマルビアが '+nv+' 本では、ほぼ効いていない。9 本以上並べること（18 章）</span>'
                    :"サーマルビアは並列なので本数がそのまま効く。ただし必ず埋めるか裏から塞ぐこと")+
        "<br>銅面積の効果は飽和する（有効なのは熱源から半径 15〜25 mm）。<b>最も効くのは風、次にヒートシンク、根本は発熱を減らすこと</b>";
    }
    [sP,sJ,sA,sN,sV,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    cB.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 19. loop — ループ面積と放射 ============ */
  REG.loop=function(el){
    head(el,"DEMO","CM がいかに少ない電流で規格を超えるか");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sA=slider(row,"DM ループ面積 [cm²]",0.05,20,1,0.05);
    var sI=slider(row,"DM 電流 [mA]",1,200,20,1);
    var sL=slider(row,"ケーブル長 [m]",0.1,3,1,0.1);
    var sC=slider(row,"CM 電流 [µA]",0.1,50,3,0.1);
    var sD=select(row,"測定距離",["3 m 法","10 m 法"]);
    var out=readout(el);
    function draw(){
      var A=+sA.input.value*1e-4, I=+sI.input.value*1e-3,
          L=+sL.input.value, Icm=+sC.input.value*1e-6, r=[3,10][+sD.value];
      sA.val.textContent=f(A*1e4,2)+" cm²"; sI.val.textContent=f(I*1000,0)+" mA";
      sL.val.textContent=f(L,1)+" m"; sC.val.textContent=f(Icm*1e6,1)+" µA";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var P={l:52,r:20,t:34,b:36};
      function X(fq){return P.l+(Math.log10(fq)-7)/3*(w-P.l-P.r);}   /* 10 MHz〜10 GHz */
      function Y(db){return Math.max(P.t, h-P.b-Math.min((db+20)/100,1)*(h-P.t-P.b));}  /* −20〜80 dBµV/m */
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      for(var g=0;g<=100;g+=20){
        ctx.beginPath();ctx.moveTo(P.l,Y(g-20));ctx.lineTo(w-P.r,Y(g-20));ctx.stroke();
        lab(ctx,String(g-20),P.l-6,Y(g-20)+4,C("--faint"),"right",9);
      }
      lab(ctx,"dBµV/m",P.l-6,P.t-10,C("--muted"),"right",9.5);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(P.l,h-P.b);ctx.lineTo(w-P.r,h-P.b);ctx.stroke();
      [1e7,1e8,1e9,1e10].forEach(function(fq){lab(ctx,eng(fq,"Hz",0),X(fq),h-P.b+16,C("--faint"),"center",9);});
      function dbuv(E){return 20*Math.log10(Math.max(E,1e-12)/1e-6);}
      function curve(fn,col,lw){
        ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();
        for(var i=0;i<=200;i++){
          var fq=Math.pow(10,7+3*i/200);
          ctx.lineTo(X(fq),Y(dbuv(fn(fq))));
        }
        ctx.stroke();
      }
      curve(function(fq){return 1.3e-14*fq*fq*A*I/r;},C("--signal"),2.4);
      curve(function(fq){return 1.26e-6*fq*L*Icm/r;},C("--alias"),2.4);
      /* 規格の目安線 */
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(P.l,Y(40));ctx.lineTo(w-P.r,Y(40));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"目安 40 dBµV/m",w-P.r-4,Y(40)-6,C("--blue"),"right",10);
      lab(ctx,"DM（ループ）",P.l+10,P.t-10,C("--signal"),"left",10.5);
      lab(ctx,"CM（ケーブル）",P.l+130,P.t-10,C("--alias"),"left",10.5);
      /* 100 MHz での比較 */
      var f0=1e8;
      var edm=1.3e-14*f0*f0*A*I/r, ecm=1.26e-6*f0*L*Icm/r;
      var idmNeed=(1e-4*r)/(1.3e-14*f0*f0*A);
      var icmNeed=(1e-4*r)/(1.26e-6*f0*L);
      out.innerHTML="100 MHz・"+r+" m での予測: DM <b>"+f(dbuv(edm),1)+" dBµV/m</b>"+
        " ／ CM <b>"+f(dbuv(ecm),1)+" dBµV/m</b>"+
        "<br>40 dBµV/m に達する電流: DM は <b>"+f(idmNeed*1000,0)+" mA</b>、CM は <b>"+f(icmNeed*1e6,2)+" µA</b>"+
        " → <b>比は約 "+f(idmNeed/icmNeed,0)+" 倍</b>"+
        "<br>"+(ecm>edm
          ? '<span class="warn">CM が支配的。対策すべきはループ面積ではなく、<b>リターンパスとケーブル</b>である（19 章）</span>'
          : "この条件では DM が支配的。ただし実機ではたいてい CM が上回る")+
        "<br>CM 電流は意図して作られるものではなく、<b>帰り道の不備の副産物</b>である（08・12・13 章）";
    }
    [sA,sI,sL,sC].forEach(function(s){s.input.addEventListener("input",draw);});
    sD.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 20. tol — 公差の積み上げ ============ */
  REG.tol=function(el){
    head(el,"DEMO","どの公差を締めれば成立するか");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sP=slider(row,"パッド径 [mm]",0.35,1.20,0.60,0.01);
    var sD=slider(row,"仕上がり穴径 [mm]",0.10,0.80,0.30,0.01);
    var sR=slider(row,"ドリル位置公差 [mm]",0.02,0.15,0.075,0.005);
    var sM=slider(row,"層ずれ [mm]",0,0.15,0.075,0.005);
    var sE=slider(row,"エッチング公差 [mm]",0.01,0.08,0.030,0.005);
    var sC=select(row,"要求クラス",["クラス 2（産業機器・0.15 mm）","クラス 3（医療車載・0.20 mm）","クラス 1（民生・0.05 mm）"]);
    var out=readout(el);
    function draw(){
      var P=+sP.input.value, D=+sD.input.value, dr=+sR.input.value,
          ms=+sM.input.value, et=+sE.input.value, req=[0.15,0.20,0.05][+sC.value];
      sP.val.textContent=f(P,2)+" mm"; sD.val.textContent=f(D,2)+" mm";
      sR.val.textContent=f(dr,3)+" mm"; sM.val.textContent=f(ms,3)+" mm"; sE.val.textContent=f(et,3)+" mm";
      var design=(P-D)/2;
      var terms=[["ドリル位置",dr],["層ずれ",ms],["穴径公差(半径)",0.025],["エッチング",et]];
      var sum=terms.reduce(function(a,t){return a+t[1];},0);
      var rss=Math.sqrt(terms.reduce(function(a,t){return a+t[1]*t[1];},0));
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=180,x1=w-140, mx=Math.max(design,sum)*1.12;
      function bar(y,label,val,col,alpha){
        lab(ctx,label,x0-10,y+5,C("--muted"),"right",10.5);
        var bw=(x1-x0)*Math.min(val/mx,1);
        ctx.fillStyle=col;ctx.globalAlpha=alpha;ctx.fillRect(x0,y-12,bw,24);ctx.globalAlpha=1;
        ctx.strokeStyle=col;ctx.lineWidth=1.4;ctx.strokeRect(x0,y-12,bw,24);
        lab(ctx,f(val,3)+" mm",x0+bw+8,y+5,col,"left",10.5);
      }
      bar(44,"設計アニュラリング",design,C("--signal"),.30);
      bar(84,"最悪ケースで失う量",sum,C("--alias"),.24);
      bar(124,"RSS で失う量",rss,C("--blue"),.24);
      bar(170,"残り（最悪ケース）",Math.max(design-sum,0),design-sum>=0.05?C("--blue"):C("--alias"),.34);
      bar(206,"残り（RSS）",Math.max(design-rss,0),design-rss>=0.05?C("--blue"):C("--alias"),.34);
      out.innerHTML="設計アニュラリング <b>"+f(design,3)+" mm</b>"+
        (design>=req?' <b class="ok">要求 '+f(req,2)+' mm を満たす</b>':' <span class="warn">要求 '+f(req,2)+' mm に届かない</span>')+
        "<br>最悪ケース: 残り <b>"+f(design-sum,3)+" mm</b>"+
        (design-sum<0?' <span class="warn">← 穴がパッドを突き破る（ブレイクアウト）</span>'
                     :(design-sum<0.05?' <span class="warn">← ぎりぎり</span>':' <b class="ok">← 成立</b>'))+
        " ／ RSS: 残り <b>"+f(design-rss,3)+" mm</b>"+
        (design-rss<0.05?' <span class="warn">← 不足</span>':' <b class="ok">← 成立</b>')+
        "<br>成立させるには、パッドを <b>"+f(Math.max(0,P+2*(0.05-(design-rss))),2)+" mm</b> 以上にするか、"+
        "穴を <b>"+f(Math.max(0.1,D-2*Math.max(0,0.05-(design-rss))),2)+" mm</b> 以下にする"+
        "<br>クラス 3 なら最悪ケース、民生なら RSS＋歩留まりで許容。<b>どちらで判断したかを記録に残すこと</b>（04・20 章）";
    }
    [sP,sD,sR,sM,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    sC.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 21. reflow — リフローとステンシル ============ */
  REG.reflow=function(el){
    head(el,"DEMO","面積比とトゥームストーンのリスク");
    var cv=screen(el,270), cc=cctx(cv);
    var row=ctrls(el);
    var sL=slider(row,"パッド長 [mm]",0.15,2.0,0.80,0.05);
    var sW=slider(row,"パッド幅 [mm]",0.15,2.0,0.30,0.05);
    var sT=slider(row,"ステンシル厚 [mm]",0.08,0.20,0.12,0.01);
    var sA=select(row,"左側の接続",["細い配線","サーマルリリーフ","ベタ直結"]);
    var sB=select(row,"右側の接続",["細い配線","サーマルリリーフ","ベタ直結"]);
    var sP=select(row,"部品サイズ",["1005（0402）","1608（0603）","2012（0805）","3216（1206）"]);
    var out=readout(el);
    function draw(){
      var L=+sL.input.value, W=+sW.input.value, t=+sT.input.value,
          a=+sA.value, b=+sB.value, ps=+sP.value;
      sL.val.textContent=f(L,2)+" mm"; sW.val.textContent=f(W,2)+" mm"; sT.val.textContent=f(t,2)+" mm";
      var ar=(L*W)/(2*(L+W)*t);
      var mass=[1,2.5,6];              /* 熱容量の相対値 */
      var diff=Math.abs(mass[a]-mass[b]);
      var small=[1,0.6,0.3,0.12][ps];  /* 小さいほどトゥームストーンしやすい */
      var risk=Math.min(100, diff*18*small*3);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      /* パッドと接続 */
      var cx=w*0.3, cy=96, sc=Math.min(150/Math.max(L,0.3), 60/Math.max(W,0.2));
      sc=Math.min(sc,120);
      function conn(side){
        var m=side===0?a:b;
        var x = side===0 ? cx-L*sc/2-70 : cx+L*sc/2;
        ctx.fillStyle=C("--signal");ctx.globalAlpha=.30;
        if(m===0)ctx.fillRect(x+(side===0?58:0),cy-3,12,6);
        else if(m===1){ctx.fillRect(x+(side===0?40:0),cy-16,30,6);ctx.fillRect(x+(side===0?40:0),cy+10,30,6);}
        else ctx.fillRect(x,cy-30,70,60);
        ctx.globalAlpha=1;
      }
      conn(0);conn(1);
      ctx.fillStyle=C("--signal");
      ctx.fillRect(cx-L*sc/2, cy-W*sc/2, L*sc*0.42, W*sc);
      ctx.fillRect(cx+L*sc/2-L*sc*0.42, cy-W*sc/2, L*sc*0.42, W*sc);
      ctx.fillStyle=C("--panel");ctx.strokeStyle=C("--ink");ctx.lineWidth=1.4;
      rrect(ctx,cx-L*sc*0.24,cy-W*sc/2-2,L*sc*0.48,W*sc+4,2);ctx.fill();ctx.stroke();
      lab(ctx,["細い配線","サーマル","ベタ直結"][a],cx-L*sc/2-36,cy+46,C("--muted"),"center",9.5);
      lab(ctx,["細い配線","サーマル","ベタ直結"][b],cx+L*sc/2+36,cy+46,C("--muted"),"center",9.5);
      /* 面積比バー */
      var bx=w*0.58, bw=w-bx-40;
      lab(ctx,"ステンシル面積比",bx,52,C("--muted"),"left",10.5);
      ctx.fillStyle=ar>=0.66?C("--blue"):C("--alias");ctx.globalAlpha=.26;
      ctx.fillRect(bx,60,bw*Math.min(ar/1.4,1),22);ctx.globalAlpha=1;
      ctx.strokeStyle=ar>=0.66?C("--blue"):C("--alias");ctx.lineWidth=1.4;
      ctx.strokeRect(bx,60,bw*Math.min(ar/1.4,1),22);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(bx+bw*0.66/1.4,54);ctx.lineTo(bx+bw*0.66/1.4,88);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"0.66",bx+bw*0.66/1.4,102,C("--alias"),"center",9.5);
      lab(ctx,f(ar,2),bx+bw*Math.min(ar/1.4,1)+8,76,ar>=0.66?C("--blue"):C("--alias"),"left",11);
      /* リスクバー */
      lab(ctx,"トゥームストーンのリスク",bx,146,C("--muted"),"left",10.5);
      ctx.fillStyle=risk>40?C("--alias"):C("--blue");ctx.globalAlpha=.26;
      ctx.fillRect(bx,154,bw*risk/100,22);ctx.globalAlpha=1;
      ctx.strokeStyle=risk>40?C("--alias"):C("--blue");ctx.lineWidth=1.4;
      ctx.strokeRect(bx,154,bw*risk/100,22);
      lab(ctx,f(risk,0)+" %",bx+bw*risk/100+8,170,risk>40?C("--alias"):C("--blue"),"left",11);
      lab(ctx,"（左右の熱容量差と部品の小ささから）",bx,196,C("--faint"),"left",9);
      out.innerHTML="面積比 = LW / (2(L+W)t) = <b>"+f(ar,2)+"</b>"+
        (ar>=0.66?' <b class="ok">≥ 0.66 — ペーストが転写される</b>'
                 :' <span class="warn">&lt; 0.66 — 側壁に残って転写されない。ステンシルを薄くするか段付きにする</span>')+
        "<br>左右の熱容量差 <b>"+f(diff,1)+"</b>（"+["細い配線","サーマルリリーフ","ベタ直結"][a]+" ↔ "+
        ["細い配線","サーマルリリーフ","ベタ直結"][b]+"）"+
        (diff>0?' <span class="warn">← 片側だけ先に溶ける。両側を揃えること</span>':' <b class="ok">← 揃っている</b>')+
        "<br>"+(risk>40
          ? '<span class="warn">トゥームストーンのリスクが高い。両側をサーマルリリーフに揃え、部品の向きも揃える（13・21 章）</span>'
          : "リフローの均熱区間が温度差をならせる範囲。アートワーク側の条件は満たしている");
    }
    [sL,sW,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    [sA,sB,sP].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 22. gerber — 出図ファイルを確認する ============ */
  REG.gerber=function(el){
    head(el,"DEMO","そのファイルは何を決めているか");
    var FILES=[
      ["外層（表）の銅　.gtl","L1 の銅パターン","線幅・パッド・ベタが意図どおりか","L1 と最終層が入れ替わると、部品面が逆になる"],
      ["内層の銅　.g2l / .g3l","L2、L3 …のパターン","層の対応表を付けたか","順番を取り違えると、完全に動かない基板が届く"],
      ["レジスト（表・裏）　.gts / .gbs","銅を露出させる開口","パッドの位置に図形があるか","反転すると全面が覆われる／全面が露出する"],
      ["シルク（表・裏）　.gto / .gbo","印刷する図柄","パッドに乗っていないか、線幅 0.15 mm 以上か","パッドにインクが乗るとはんだが濡れない"],
      ["ペースト（表・裏）　.gtp / .gbp","メタルマスクの開口","QFN の分割開口が反映されているか","全面開口だと部品が浮く"],
      ["外形　.gko / .gml","基板の輪郭","全部が輪郭の中に収まっているか","外形がないと加工できない"],
      ["ドリル（PTH）　.drl","めっきあり穴の位置と径","単位・桁数・ゼロサプレス","設定が違うと 10 倍ずれる"],
      ["ドリル（NPTH）","めっきなし穴（取付穴など）","PTH と分けたか","めっきありにするとネジと GND が接触する"],
      ["仕様書","材料・層構成・銅厚・表面処理・インピーダンス","ガーバーに書けない情報すべて","なければメーカが推測する"],
      ["BOM（部品表）","参照記号・完全型番・DNP","DNP を明記したか","明記しないと未実装部品が載る"],
      ["マウントデータ","参照記号・X・Y・回転角・面","原点と回転角の基準","極性部品の向きは図でも伝える"],
      ["実装指示図（PDF）","1 番ピン・極性・特記","データだけでは防げない誤実装を防ぐ","最も確実な誤実装対策"],
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var pn=panel(el), out=readout(el);
    var cur=0, checked=[];
    FILES.forEach(function(){checked.push(false);});
    var btns=FILES.map(function(fl,i){
      var b=button(bar,String(i+1));
      b.addEventListener("click",function(){cur=i;checked[i]=true;render();});
      return b;
    });
    function render(){
      btns.forEach(function(b,i){b.setAttribute("aria-pressed",i===cur?"true":"false");
        b.style.opacity=checked[i]?"1":".62";});
      var fl=FILES[cur];
      pn.innerHTML='<div style="color:var(--signal);font-weight:700;font-size:.95rem;margin-bottom:.4rem">'+
        esc(fl[0])+'</div>'+
        tbl(["","内容"],[
          ["何を決めているか", esc(fl[1])],
          ["確認すべき点", '<b>'+esc(fl[2])+'</b>'],
          ["間違えると", '<span style="color:var(--alias)">'+esc(fl[3])+'</span>'],
        ],["left","left"]);
      var n=checked.filter(Boolean).length;
      out.innerHTML="確認したファイル <b>"+n+" / "+FILES.length+"</b>"+
        (n===FILES.length?' <b class="ok">— 一式そろっている</b>':"")+
        "<br><b>出図前に、CAD とは別のガーバービューアで全層を開くこと。</b>"+
        "CAD の画面で正しく見えても、出力で壊れていることがある（22 章）"+
        "<br>そして基板にリビジョンをシルクで入れる —— 実物を見て版が分からないと、評価データが信用できなくなる";
    }
    render();
  };

  /* ============ 23. panel — 面付けとコスト ============ */
  REG.panel=function(el){
    head(el,"DEMO","あと数 mm 詰めると 1 列増えることがある");
    var cv=screen(el,280), cc=cctx(cv);
    var row=ctrls(el);
    var sW=slider(row,"基板の幅 [mm]",20,250,100,1);
    var sH=slider(row,"基板の高さ [mm]",20,250,80,1);
    var sPW=slider(row,"パネル幅 [mm]",100,400,250,5);
    var sPH=slider(row,"パネル高さ [mm]",100,500,330,5);
    var sR=slider(row,"捨て板の幅 [mm]",0,15,7,1);
    var sG=slider(row,"基板間の隙間 [mm]",0,5,2,0.5);
    var sL=select(row,"層数",["2 層","4 層","6 層"]);
    var sQ=slider(row,"製造枚数",5,1000,50,5);
    var out=readout(el);
    function draw(){
      var bw=+sW.input.value, bh=+sH.input.value, pw=+sPW.input.value, ph=+sPH.input.value,
          rail=+sR.input.value, gap=+sG.input.value, nl=[2,4,6][+sL.value], qty=+sQ.input.value;
      sW.val.textContent=bw+" mm"; sH.val.textContent=bh+" mm";
      sPW.val.textContent=pw+" mm"; sPH.val.textContent=ph+" mm";
      sR.val.textContent=rail+" mm"; sG.val.textContent=f(gap,1)+" mm"; sQ.val.textContent=qty+" 枚";
      function count(a,b){
        var ux=pw, uy=ph-2*rail;
        var nx=Math.floor((ux+gap)/(a+gap)), ny=Math.floor((uy+gap)/(b+gap));
        return {n:Math.max(nx,0)*Math.max(ny,0),nx:nx,ny:ny};
      }
      var A=count(bw,bh), B=count(bh,bw);
      var best=A.n>=B.n?A:B, rot=(B.n>A.n);
      var used=rot?[bh,bw]:[bw,bh];
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var sc=Math.min((w*0.5-40)/pw,(h-70)/ph);
      var ox=40, oy=36;
      ctx.fillStyle=C("--screen");ctx.fillRect(ox,oy,pw*sc,ph*sc);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;ctx.strokeRect(ox,oy,pw*sc,ph*sc);
      ctx.fillStyle=C("--alias");ctx.globalAlpha=.16;
      ctx.fillRect(ox,oy,pw*sc,rail*sc);ctx.fillRect(ox,oy+(ph-rail)*sc,pw*sc,rail*sc);
      ctx.globalAlpha=1;
      for(var i=0;i<best.nx;i++)for(var j=0;j<best.ny;j++){
        var x=ox+i*(used[0]+gap)*sc, y=oy+rail*sc+j*(used[1]+gap)*sc;
        ctx.fillStyle=C("--signal");ctx.globalAlpha=.22;
        ctx.fillRect(x,y,used[0]*sc,used[1]*sc);ctx.globalAlpha=1;
        ctx.strokeStyle=C("--signal");ctx.lineWidth=1;ctx.strokeRect(x,y,used[0]*sc,used[1]*sc);
      }
      lab(ctx,"捨て板 "+rail+" mm",ox+4,oy+rail*sc-5,C("--alias"),"left",9);
      lab(ctx,best.nx+" × "+best.ny+" = "+best.n+" 枚"+(rot?"（90° 回転）":""),
          ox+pw*sc/2,oy+ph*sc+20,C("--signal"),"center",11);
      /* コスト概算 */
      var areaFactor=[1,1.8,2.5][+sL.value];
      var panelCost=(pw*ph/1e4)*80*areaFactor;         /* 円/パネル の概算 */
      var setup=18000*areaFactor;
      var panels=Math.ceil(qty/Math.max(best.n,1));
      var unit=best.n>0 ? (setup+panelCost*panels)/qty : Infinity;
      /* あと何 mm 詰めれば 1 列増えるか */
      var need=null;
      for(var dmm=1;dmm<=30;dmm++){
        var c2=Math.max(count(bw-dmm,bh).n,count(bh,bw-dmm).n);
        if(c2>best.n){need=[dmm,"幅",c2];break;}
      }
      if(!need)for(var dmm2=1;dmm2<=30;dmm2++){
        var c3=Math.max(count(bw,bh-dmm2).n,count(bh-dmm2,bw).n);
        if(c3>best.n){need=[dmm2,"高さ",c3];break;}
      }
      var tx=ox+pw*sc+50;
      [["取り数 / パネル",best.n+" 枚"],
       ["必要パネル数",panels+" 枚"],
       ["面積利用率",f(best.n*bw*bh/(pw*ph)*100,0)+" %"],
       ["概算単価",best.n>0?f(unit,0)+" 円/枚":"—"]].forEach(function(p,i){
        lab(ctx,p[0],tx,70+i*38,C("--muted"),"left",10.5);
        lab(ctx,p[1],w-24,70+i*38,C("--signal"),"right",11.5);
      });
      out.innerHTML=(best.n===0
        ? '<span class="warn">パネルに 1 枚も入らない。基板かパネルの寸法を見直すこと</span>'
        : "取り数 <b>"+best.n+" 枚/パネル</b>（"+best.nx+" × "+best.ny+"）"+(rot?"、90° 回すほうが多く取れる":""))+
        "<br>"+(need
          ? "<b>"+need[1]+"をあと "+need[0]+" mm 詰めれば、取り数が "+need[2]+" 枚に増える（＋"+
            f((need[2]-best.n)/best.n*100,0)+" %）</b>"
          : "この寸法では、30 mm 以内の縮小で取り数は増えない")+
        "<br>単価は「初期費用/枚数 ＋ 面積単価」。<b>5 枚と 500 枚では単価が桁で違う</b>ので、量産の枚数で見積もる"+
        "<br>概算値である。実際の価格はメーカ・時期・仕様で大きく変わるので、必ず見積りを取ること（23 章）";
    }
    [sW,sH,sPW,sPH,sR,sG,sQ].forEach(function(s){s.input.addEventListener("input",draw);});
    sL.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 24. checklist — アートワークレビュー ============ */
  REG.checklist=function(el){
    head(el,"DEMO","出す前に、何を確かめるか");
    var DATA=[
      ["制約（配置の前に）",[
        "外形・取付穴・部品高さ制限が、<b>確定した機構図面</b>に基づいているか",
        "コネクタの位置と向きが筐体と合っているか",
        "層構成が決まり、メーカの標準構成から選ばれているか",
        "高速・敏感・大電流のネットが分類され、要求が明文化されているか",
        "基板メーカの<b>製造仕様書</b>を確認し、設計ルールに反映したか",
        "コストと納期の目標が共有されているか"]],
      ["フットプリント（06 章）",[
        "すべてのフットプリントを<b>データシートと 1 対 1 で照合</b>したか",
        "コネクタのピン番号、1 番ピンの向きを確認したか",
        "レジスト開口・ペースト開口・禁止領域・3D 外形が入っているか",
        "QFN のサーマルパッドのペースト開口率は 50〜70 % か"]],
      ["配置（配線の前に）",[
        "デカップリングは<b>電源ピンの直近</b>にあるか",
        "スイッチング電源の<b>入力ループ</b>が最小か",
        "ノイズ源と敏感回路が離れているか",
        "発熱部品が分散し、熱に弱い部品から離れているか",
        "部品間隔・基板端の禁止領域・部品高さを満たしているか",
        "チップ部品の向きが揃っているか",
        "基準マーク（フィデューシャル）があるか",
        "テストポイントの場所が確保されているか",
        "配線密度が破綻する箇所がないか"]],
      ["グラウンドと電源（08・13・14 章）",[
        "<b>グラウンド面が連続しているか。分割していないか</b>",
        "スリットがある場合、それを横切る信号がないか",
        "ビアの列や部品の穴で面が分断されていないか",
        "層を移る高速信号に<b>リターンビア</b>があるか",
        "電源面の分割線を、その面を基準にする信号が横切っていないか",
        "スティッチングビアが λ/20 間隔で入っているか",
        "<b>基板端にビアフェンス</b>があるか",
        "表層ベタがビアで縫われているか。孤立した銅がないか",
        "電圧降下を計算したか"]],
      ["配線（09〜12・15・16 章）",[
        "電流を流す配線の幅を<b>温度上昇と電圧降下の両方</b>で確認したか",
        "インピーダンス制御が必要なネットを特定し、線幅を設定したか",
        "差動ペアの間隔が一定で、途中で変わっていないか",
        "スキューが規格または t_r/10 以内か。補正はずれた場所の近くか",
        "クロストーク（3W 以上、クリティカルは 5W）を確認したか",
        "クロックが最短・基準面の上・他信号から離れているか",
        "水晶の周りが規定どおりか",
        "スタブを作っていないか。ビアスタブが問題になる速度か",
        "直列終端抵抗が送信ピンの 5 mm 以内にあるか"]],
      ["熱（18 章）",[
        "発熱の大きい部品のジャンクション温度を見積もったか",
        "サーマルビアが <b>9 本以上</b>あり、埋めるか塞ぐ指定をしたか",
        "放熱用の銅面が確保されているか"]],
      ["製造・実装（20・21 章）",[
        "DRC が<b>エラーゼロ</b>で通っているか（警告も確認したか）",
        "アシッドトラップ・細い首・孤立銅・スリバーがないか",
        "銅残り率が層間で大きく偏っていないか（反り）",
        "ドリル径の種類を減らしたか",
        "シルクがパッドに乗っていないか。線幅・文字高は足りるか",
        "銅から基板端まで 0.3 mm 以上あるか",
        "ステンシルの面積比を確認したか"]],
      ["出図（22 章）",[
        "<b>別のガーバービューアで全層を確認</b>したか",
        "層の対応表を付けたか",
        "裏面が鏡像になっていないか",
        "ドリルの単位・桁数・ゼロサプレスが正しいか",
        "PTH と NPTH を分けたか",
        "仕様書に材料・銅厚・表面処理・インピーダンス要求を書いたか",
        "BOM に<b>完全な型番</b>と <b>DNP</b> が明記されているか",
        "極性を示す実装図（PDF）を添えたか",
        "<b>基板にリビジョンのシルク</b>が入っているか"]],
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var bAll=button(bar,"すべてチェック");
    var bNone=button(bar,"すべて外す");
    var pn=panel(el), out=readout(el);
    var state=[], html="";
    DATA.forEach(function(sec,si){
      html+='<div style="margin:'+(si?".85rem":"0")+' 0 .3rem;color:var(--signal);font-weight:600">'+sec[0]+'</div>';
      sec[1].forEach(function(it){
        state.push(false);
        html+='<label data-i="'+(state.length-1)+'" style="display:flex;gap:.5rem;align-items:flex-start;'+
          'padding:.16rem 0;cursor:pointer;line-height:1.5">'+
          '<input type="checkbox" style="flex:none;margin:.25rem 0 0;accent-color:var(--signal)">'+
          '<span>'+it+'</span></label>';
      });
    });
    pn.innerHTML=html;
    var boxesEl=pn.querySelectorAll("label[data-i]");
    function refresh(){
      var n=state.filter(Boolean).length, N=state.length;
      boxesEl.forEach(function(l){
        var i=+l.getAttribute("data-i");
        l.style.opacity=state[i]?".5":"1";
        l.querySelector("span").style.textDecoration=state[i]?"line-through":"none";
      });
      var pct=Math.round(n/N*100);
      out.innerHTML='<div style="height:8px;border-radius:5px;background:var(--panel);overflow:hidden;margin:.1rem 0 .5rem">'+
        '<div style="height:100%;width:'+pct+'%;background:var(--signal);border-radius:5px"></div></div>'+
        "<b>"+n+" / "+N+"</b> 項目を確認済み（"+pct+" %）"+
        (n===N?' <b class="ok">— 出図してよい</b>'
              :'<br>残り '+(N-n)+' 項目。<b>失敗の上位 5 つは、すべて 10 分の確認で防げるものである</b>（24 章）');
    }
    boxesEl.forEach(function(l){
      var i=+l.getAttribute("data-i"), inp=l.querySelector("input");
      inp.addEventListener("change",function(){state[i]=inp.checked;refresh();});
    });
    function setAll(v){
      boxesEl.forEach(function(l){
        var i=+l.getAttribute("data-i");
        state[i]=v; l.querySelector("input").checked=v;
      });
      refresh();
    }
    bAll.addEventListener("click",function(){setAll(true);});
    bNone.addEventListener("click",function(){setAll(false);});
    refresh();
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
