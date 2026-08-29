/* 電磁界シミュレーション — 章内インタラクティブ部品 */
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

  /* ============ 01. regime — 適用範囲 ============ */
  REG.regime=function(el){
    head(el,"DEMO","構造サイズと周波数 → 使うべき道具");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sL=slider(row,"構造の長さ ℓ [mm]（対数）",0,100,45,1);
    var sF=slider(row,"周波数 [GHz]（対数）",0,100,50,1);
    var sE=slider(row,"比誘電率 εr",1,12,4.4,0.1);
    var out=readout(el);
    function draw(){
      var L=Math.pow(10,-1+(+sL.input.value/100)*4)/1000;     // 0.1mm..1m
      var fq=Math.pow(10,7+(+sF.input.value/100)*4);           // 10MHz..100GHz
      var er=+sE.input.value;
      sL.val.textContent=eng(L,"m",2); sF.val.textContent=eng(fq,"Hz",2);
      sE.val.textContent=f(er,1);
      var lam=C0/fq/Math.sqrt(er), r=L/lam;
      var c=chart(cc,-1,3,-2,2,{l:56,b:36});
      var ctx=c.ctx; grid(c,4); axis(c);
      function X(v){return c.p.l+(Math.log10(v*1000)+1)/4*(c.w-c.p.l-c.p.r);}      // mm 対数
      function Y(v){return c.h-c.p.b-(Math.log10(v/1e7))/4*(c.h-c.p.t-c.p.b);}     // Hz 対数
      // 領域の境界線 ℓ = λ/20, λ/4
      var xl=c.p.l, xr=c.w-c.p.r, yt=c.p.t, yb=c.h-c.p.b;
      function bound(k){
        var a=[];
        for(var i=0;i<=100;i++){
          var ff=1e7*Math.pow(10,4*i/100);
          a.push([Math.min(xr,Math.max(xl,X(C0/ff/Math.sqrt(er)/k))),Y(ff)]);
        }
        return a;
      }
      var b20=bound(20), b4=bound(4);
      function poly(pts,col){
        ctx.fillStyle=col;ctx.globalAlpha=.13;ctx.beginPath();
        pts.forEach(function(q,i){i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});
        ctx.closePath();ctx.fill();ctx.globalAlpha=1;
      }
      poly(b20.concat([[xl,b20[b20.length-1][1]],[xl,b20[0][1]]]),C("--blue"));
      poly(b20.concat(b4.slice().reverse()),C("--signal"));
      poly(b4.concat([[xr,b4[b4.length-1][1]],[xr,b4[0][1]]]),C("--alias"));
      [[b20,C("--blue")],[b4,C("--alias")]].forEach(function(p){
        ctx.strokeStyle=p[1];ctx.lineWidth=2;ctx.beginPath();
        p[0].forEach(function(q,i){i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});
        ctx.stroke();
      });
      // 境界線のラベルは、線が図の中央の高さを横切る位置に置く
      var ymid=(yt+yb)/2;
      function atY(pts){
        for(var i=1;i<pts.length;i++){
          if((pts[i-1][1]-ymid)*(pts[i][1]-ymid)<=0)return pts[i][0];
        }
        return (xl+xr)/2;
      }
      lab(ctx,"ℓ = λ/20",Math.max(xl+52,atY(b20)-8),ymid-14,C("--blue"),"right",10.5);
      lab(ctx,"ℓ = λ/4",Math.min(xr-52,atY(b4)+8),ymid+22,C("--alias"),"left",10.5);
      lab(ctx,"集中定数",xl+10,yb-12,C("--blue"),"left",11);
      lab(ctx,"分布定数",(xl+xr)/2-10,yb-12,C("--signal"),"center",11);
      lab(ctx,"3D 電磁界解析",xr-8,yt+16,C("--alias"),"right",11);
      var px=X(L),py=Y(fq);
      ctx.fillStyle=r<0.05?C("--blue"):(r<0.25?C("--signal"):C("--alias"));
      ctx.beginPath();ctx.arc(px,py,7,0,TAU);ctx.fill();
      ctx.strokeStyle=C("--screen");ctx.lineWidth=2;ctx.stroke();
      [0.1,1,10,100,1000].forEach(function(v,i){
        lab(ctx,String(v),X(v/1000),c.h-8,C("--faint"),i===4?"right":"center",9.5);});
      [1e7,1e8,1e9,1e10,1e11].forEach(function(v){lab(ctx,eng(v,"Hz",0),c.p.l-6,Y(v)+4,C("--faint"),"right");});
      var verdict=r<0.05?['<b class="ok">集中定数で足りる</b>','回路シミュレータ（SPICE）']
        :(r<0.25?['<b>分布定数として扱う</b>','伝送線路モデル・2.5D ソルバ']
        :['<b class="warn">3D 電磁界解析が要る</b>','放射・共振・結合が主役になる']);
      out.innerHTML="材料中の波長 λ = <b>"+eng(lam,"m",1)+"</b> ／ ℓ/λ = <b>"+f(r,3)+"</b> ／ "+verdict[0]+
        "<br>"+verdict[1]+" ／ 判断は必ず材料中の波長（λ₀/√εr）で行う";
    }
    [sL,sF,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 02. maxwell — 各項の役割 ============ */
  REG.maxwell=function(el){
    head(el,"DEMO","各項を切ると、何が消えるか");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var cF=checkbox(row,"∂B/∂t（ファラデー: 磁界の変化 → 電界）",true);
    var cD=checkbox(row,"∂D/∂t（変位電流: 電界の変化 → 磁界）",true);
    var cJ=checkbox(row,"J（伝導電流）",true);
    var out=readout(el);
    function draw(t){
      var F0=cF.checked,D0=cD.checked;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var y=h*0.5, x0=40, x1=w-40;
      var alive=F0&&D0;
      if(alive){
        ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
        for(var i=0;i<=400;i++){
          var u=i/400,xx=x0+(x1-x0)*u;
          ctx.lineTo(xx,y-40*Math.sin(TAU*(3*u-t*0.5)));
        }
        ctx.stroke();
        ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
        for(var i2=0;i2<=400;i2++){
          var u2=i2/400,xx2=x0+(x1-x0)*u2;
          ctx.lineTo(xx2,y-40*Math.sin(TAU*(3*u2-t*0.5))*0.55+58);
        }
        ctx.stroke();
        lab(ctx,"E",x0,y-56,C("--signal"),"left",13);
        lab(ctx,"H",x0,y+40,C("--blue"),"left",13);
        lab(ctx,"電磁波が伝わる →",x1,y-56,C("--muted"),"right");
      }else{
        ctx.strokeStyle=C("--faint");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
        ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"波が伝わらない（局所的な場が残るだけ）",w/2,y-20,C("--alias"),"center",13);
      }
      out.innerHTML=(alive?"両方の回転項が生きている → <b>電磁波が存在する</b>"
        :'<span class="warn">回転項のどちらかが欠けている → 電磁波は存在しない</span>')+
        "<br>"+(!D0?"<b>変位電流 ∂D/∂t を切ると波が消える</b> —— これがマクスウェルの最大の貢献である。"
                :(!F0?"ファラデーの項を切ると、磁界の変化が電界を作らなくなる。"
                     :"変化する磁界が電界を生み、その電界の変化が磁界を生む——この連鎖が波である。"))+
        (cJ.checked?" ／ J は源（アンテナの給電など）を与える項。":" ／ J = 0 は源のない空間。");
    }
    [cF,cD,cJ].forEach(function(c){c.addEventListener("change",function(){});});
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 03. material — 材料と表皮深さ ============ */
  REG.material=function(el){
    head(el,"DEMO","材料中の波長と表皮深さ");
    var cv=screen(el,240), cc=cctx(cv);
    var row=ctrls(el);
    var sF=slider(row,"周波数 [Hz]（対数）",0,100,60,1);
    var sE=slider(row,"比誘電率 εr",1,12,4.4,0.1);
    var sel=select(row,"導体",["銅 σ=5.8e7","アルミ σ=3.8e7","ステンレス σ=1.4e6","導電塗料 σ=1e4"]);
    var out=readout(el);
    var SIG=[5.8e7,3.8e7,1.4e6,1e4];
    function draw(){
      var fq=Math.pow(10,4+(+sF.input.value/100)*7);  // 10kHz..100GHz
      var er=+sE.input.value, sg=SIG[+sel.value];
      sF.val.textContent=eng(fq,"Hz",2); sE.val.textContent=f(er,1);
      var lam0=C0/fq, lam=lam0/Math.sqrt(er);
      var dl=1/Math.sqrt(Math.PI*fq*MU0*sg);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      // 上: 波長の比較
      var y1=64;
      lab(ctx,"自由空間の波長 λ₀",20,y1-26,C("--muted"));
      var scale=Math.min((w-140)/lam0,1e9);
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.6;ctx.beginPath();
      for(var i=0;i<=300;i++){var u=i/300;ctx.lineTo(20+u*(w-140),y1-20*Math.sin(TAU*2*u));}
      ctx.stroke();
      lab(ctx,eng(lam0,"m",1),w-120,y1+4,C("--faint"));
      var y2=134;
      lab(ctx,"材料中の波長 λ",20,y2-26,C("--signal"));
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i2=0;i2<=400;i2++){var u2=i2/400;ctx.lineTo(20+u2*(w-140),y2-20*Math.sin(TAU*2*Math.sqrt(er)*u2));}
      ctx.stroke();
      lab(ctx,eng(lam,"m",1),w-120,y2+4,C("--signal"),"left",11);
      // 下: 表皮深さ
      var y3=200;
      lab(ctx,"表皮深さ δ",20,y3-24,C("--alias"));
      var bw=Math.max(2,Math.min((w-160),(dl/lam)*(w-160)*40));
      ctx.fillStyle=C("--alias-soft");ctx.fillRect(20,y3-14,Math.max(bw,3),24);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.strokeRect(20,y3-14,Math.max(bw,3),24);
      lab(ctx,eng(dl,"m",2),w-120,y3+4,C("--alias"),"left",11);
      var cells=lam/20;
      out.innerHTML="λ₀ = <b>"+eng(lam0,"m",1)+"</b> → 材料中 λ = <b>"+eng(lam,"m",1)+
        "</b>（1/√εr = "+f(1/Math.sqrt(er),2)+" 倍）"+
        "<br>表皮深さ δ = <b>"+eng(dl,"m",2)+"</b>"+
        (dl<1e-5?' <span class="warn">→ メッシュで刻むのは非現実的。表面インピーダンス境界を使う</span>':"")+
        "<br>20 セル/λ とすると、必要なセルサイズは <b>"+eng(cells,"m",2)+"</b>";
    }
    [sF,sE].forEach(function(s){s.input.addEventListener("input",draw);});
    sel.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 04. discretize — 離散化誤差 ============ */
  REG.discretize=function(el){
    head(el,"DEMO","セル/波長と位相誤差の積み上がり");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sN=slider(row,"セル/波長 N",4,40,10,1);
    var sD=slider(row,"伝搬距離（波長数）",1,40,10,1);
    var out=readout(el);
    function draw(){
      var N=+sN.input.value, D=+sD.input.value;
      sN.val.textContent=N+" セル/λ"; sD.val.textContent=D+" λ";
      var ratio=Math.sin(2*Math.PI/N)/(2*Math.PI/N);   // k_eff/k
      var errDeg=Math.abs(1-ratio)*D*360;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=40,x1=w-30,y=h*0.42;
      // 真の波と離散化された波
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.6;ctx.beginPath();
      for(var i=0;i<=600;i++){var u=i/600;ctx.lineTo(x0+(x1-x0)*u,y-40*Math.sin(TAU*D*u));}
      ctx.stroke();
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var i2=0;i2<=600;i2++){var u2=i2/600;ctx.lineTo(x0+(x1-x0)*u2,y-40*Math.sin(TAU*D*ratio*u2));}
      ctx.stroke();
      lab(ctx,"真の波（細線）／ 離散化された波（太線）",x0,y-58,C("--muted"));
      lab(ctx,"位相のずれが距離とともに開く →",x1,y+62,C("--alias"),"right");
      // 誤差バー
      var by=h-52;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,by);ctx.lineTo(x1,by);ctx.stroke();
      var FS=180, sat=errDeg>=FS;
      var bw=Math.min((x1-x0),(errDeg/FS)*(x1-x0));
      ctx.fillStyle=errDeg>30?C("--alias-soft"):C("--signal-soft");
      ctx.fillRect(x0,by-16,Math.max(bw,2),16);
      ctx.strokeStyle=errDeg>30?C("--alias"):C("--signal");ctx.lineWidth=1.4;
      ctx.strokeRect(x0,by-16,Math.max(bw,2),16);
      [0,45,90,135,180].forEach(function(t){
        var tx=x0+(t/FS)*(x1-x0);
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(tx,by);ctx.lineTo(tx,by+4);ctx.stroke();
        lab(ctx,t+"°",tx,by+16,C("--faint"),"center",9);
      });
      var thx=x0+(30/FS)*(x1-x0);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(thx,by-20);ctx.lineTo(thx,by+22);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"許容の目安 30°",thx+6,by+32,C("--alias"),"left",9.5);
      lab(ctx,"累積位相誤差 "+f(errDeg,1)+"°"+(sat?"（目盛りの上限 180° を振り切れている）":""),
          x0,by-24,C("--muted"),"left",10.5);
      out.innerHTML="波数の相対誤差 = sin(2π/N)/(2π/N) − 1 = <b>"+f((ratio-1)*100,3)+" %</b>"+
        " ／ "+D+" λ 進んだ後の累積位相誤差 <b>"+f(errDeg,1)+"°</b>"+
        (errDeg>30?' <span class="warn">← 大きすぎる。セル/波長を増やすこと</span>':"")+
        "<br>誤差は距離に比例して溜まる → <b>必要なセル数は構造が電気的に何波長あるかで決まる</b>";
    }
    [sN,sD].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 05. fdtd1d — 本物の 1D FDTD ============ */
  REG.fdtd1d=function(el){
    head(el,"DEMO","1D FDTD — 更新式をそのまま実行する");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sEr=slider(row,"スラブの比誘電率 εr",1,9,4,0.5);
    var sSg=slider(row,"スラブの導電率 σ [S/m]",0,0.2,0,0.01);
    var sS=slider(row,"クーラン数 S",0.2,1.0,0.5,0.05);
    var bRun=button(row,"実行 / 一時停止");
    var bRst=button(row,"リセット");
    var out=readout(el);
    var NX=400, SLAB0=Math.round(NX*0.55), SLAB1=Math.round(NX*0.78);
    var st={E:new Float64Array(NX),H:new Float64Array(NX),n:0,run:true,peak:0,refl:0,tran:0};
    function reset(){
      st.E.fill(0);st.H.fill(0);st.n=0;st.peak=0;st.refl=0;st.tran=0;
    }
    bRst.addEventListener("click",function(){reset();});
    bRun.addEventListener("click",function(){
      st.run=!st.run;bRun.setAttribute("aria-pressed",st.run?"false":"true");
    });
    function stepFDTD(){
      var er=+sEr.input.value, sg=+sSg.input.value, S=+sS.input.value;
      // 係数（セルごと）: Ca, Cb と Db
      // Δt = S·Δx/c、Δx = 1（正規化）→ 更新式は S を係数に持つ
      for(var k=0;k<3;k++){
        // H 更新
        for(var i=0;i<NX-1;i++){ st.H[i]+=S*(st.E[i+1]-st.E[i]); }
        // E 更新（材料つき）
        for(var i2=1;i2<NX;i2++){
          var e=(i2>=SLAB0&&i2<SLAB1)?er:1, s=(i2>=SLAB0&&i2<SLAB1)?sg:0;
          var loss=s*S/(2*e);
          var ca=(1-loss)/(1+loss), cb=(S/e)/(1+loss);
          st.E[i2]=ca*st.E[i2]+cb*(st.H[i2]-st.H[i2-1]);
        }
        // 励振（微分ガウシアン）
        var t0=60,tau=16,tt=st.n-t0;
        st.E[20]+=-2*(tt/tau)*Math.exp(-(tt/tau)*(tt/tau));
        // 簡易吸収境界（1 次 Mur 相当）
        st.E[0]=st.E[1];st.E[NX-1]=st.E[NX-2];
        st.n++;
        if(st.n>1500)reset();   // ひと通り見終わったら最初から流し直す
        // 記録
        var pr=Math.abs(st.E[60]),pt=Math.abs(st.E[NX-40]);
        if(st.n>200)st.refl=Math.max(st.refl,pr);
        st.tran=Math.max(st.tran,pt);
        st.peak=Math.max(st.peak,Math.abs(st.E[20]));
      }
    }
    function draw(){
      if(st.run)stepFDTD();
      var er=+sEr.input.value, sg=+sSg.input.value, S=+sS.input.value;
      sEr.val.textContent=f(er,1); sSg.val.textContent=f(sg,2)+" S/m"; sS.val.textContent=f(S,2);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=20,x1=w-20,ymid=h*0.46,amp=h*0.30;
      // スラブ
      ctx.fillStyle=C("--signal-soft");
      ctx.fillRect(x0+(x1-x0)*SLAB0/NX,20,(x1-x0)*(SLAB1-SLAB0)/NX,h-58);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.2;
      ctx.strokeRect(x0+(x1-x0)*SLAB0/NX,20,(x1-x0)*(SLAB1-SLAB0)/NX,h-58);
      lab(ctx,"誘電体スラブ εr="+f(er,1)+(sg>0?", σ="+f(sg,2):""),
          x0+(x1-x0)*(SLAB0+SLAB1)/2/NX,36,C("--signal"),"center");
      // 場
      var bad=false;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<NX;i++){
        var v=st.E[i]; if(!isFinite(v)||Math.abs(v)>1e3){bad=true;break;}
        var xx=x0+(x1-x0)*i/NX, yy=ymid-Math.max(-1.6,Math.min(1.6,v))*amp;
        i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
      }
      if(!bad)ctx.stroke();
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.4;ctx.globalAlpha=.75;ctx.beginPath();
      for(var j=0;j<NX-1;j++){
        var v2=st.H[j]; if(!isFinite(v2))break;
        var xx2=x0+(x1-x0)*j/NX, yy2=ymid-Math.max(-1.6,Math.min(1.6,v2))*amp*0.9;
        j?ctx.lineTo(xx2,yy2):ctx.moveTo(xx2,yy2);
      }
      ctx.stroke();ctx.globalAlpha=1;
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,ymid);ctx.lineTo(x1,ymid);ctx.stroke();
      lab(ctx,"Ez（太線）",x0,h-14,C("--signal"));
      lab(ctx,"Hy（細線）",x0+90,h-14,C("--blue"));
      lab(ctx,"ステップ "+st.n,x1,h-14,C("--muted"),"right");
      if(bad){
        ctx.fillStyle=C("--alias");ctx.font="bold 16px "+C("--sans");ctx.textAlign="center";
        ctx.fillText("発散しました（S > 1）",w/2,ymid);
      }
      var eta=Math.sqrt(1/er), G=(eta-1)/(eta+1);
      out.innerHTML=(bad?'<span class="warn"><b>数値が発散した。</b>クーラン条件 S ≤ 1 を破っている（06 章）</span>'
        :"理論反射係数 Γ = (η₂−η₁)/(η₂+η₁) = <b>"+f(G,3)+"</b>（|Γ| = "+f(Math.abs(G),3)+
         "、"+f(db20(Math.abs(G)),1)+" dB）")+
        "<br>この波形は上の更新式 2 行をそのまま実行した結果である。σ を上げると透過波が減衰する";
    }
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 06. courant — 安定性と数値分散 ============ */
  REG.courant=function(el){
    head(el,"DEMO","クーラン条件を破ると何が起きるか");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sS=slider(row,"クーラン数 S = cΔt/Δx",0.5,1.4,0.95,0.01);
    var bRst=button(row,"リセット");
    var out=readout(el);
    var NX=320;
    var st={E:new Float64Array(NX),H:new Float64Array(NX),n:0,maxv:0};
    function reset(){st.E.fill(0);st.H.fill(0);st.n=0;st.maxv=0;}
    bRst.addEventListener("click",reset);
    sS.input.addEventListener("input",reset);
    function draw(){
      var S=+sS.input.value;
      sS.val.textContent=f(S,2);
      for(var k=0;k<2;k++){
        for(var i=0;i<NX-1;i++)st.H[i]+=S*(st.E[i+1]-st.E[i]);
        for(var i2=1;i2<NX;i2++)st.E[i2]+=S*(st.H[i2]-st.H[i2-1]);
        var t0=40,tau=12,tt=st.n-t0;
        if(st.n<120)st.E[30]+=-2*(tt/tau)*Math.exp(-(tt/tau)*(tt/tau));
        st.E[0]=0;st.E[NX-1]=0;
        st.n++;
      }
      var mv=0;for(var q=0;q<NX;q++){var a=Math.abs(st.E[q]);if(isFinite(a)&&a>mv)mv=a;}
      st.maxv=mv;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=20,x1=w-20,ymid=h*0.5,amp=h*0.34;
      var sc=st.maxv>1.2?1.2/st.maxv:1;
      ctx.strokeStyle=S<=1?C("--signal"):C("--alias");ctx.lineWidth=2;ctx.beginPath();
      var bad=false;
      for(var i3=0;i3<NX;i3++){
        var v=st.E[i3]*sc;
        if(!isFinite(v)){bad=true;break;}
        ctx.lineTo(x0+(x1-x0)*i3/NX, ymid-Math.max(-1.5,Math.min(1.5,v))*amp);
      }
      if(!bad)ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,ymid);ctx.lineTo(x1,ymid);ctx.stroke();
      lab(ctx,"ステップ "+st.n,x1,h-12,C("--muted"),"right");
      if(st.maxv>1e6||bad){
        ctx.fillStyle=C("--alias");ctx.font="bold 18px "+C("--sans");ctx.textAlign="center";
        ctx.fillText("発散",w/2,ymid-60);
      }
      lab(ctx,"最大振幅 "+(isFinite(st.maxv)?st.maxv.toExponential(2):"∞"),x0,h-12,
          st.maxv>2?C("--alias"):C("--muted"));
      out.innerHTML=(S<=1?'<b class="ok">S ≤ 1: 安定</b> —— 振幅が保たれる（|q| = 1）'
        :'<span class="warn"><b>S > 1: 発散</b> —— 1 ステップで波が 1 セル以上進もうとして因果関係が壊れる</span>')+
        "<br>3D の限界は S ≤ 1/√3 ≈ 0.577。実務では安定限界の 0.95〜0.99 倍を使う（数値分散も小さくなる）";
    }
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 07. fem — 基底関数による近似 ============ */
  REG.fem=function(el){
    head(el,"DEMO","基底関数の重ね合わせで解を近似する");
    var cv=screen(el,290), cc=cctx(cv);
    var row=ctrls(el);
    var sN=slider(row,"要素数",2,20,4,1);
    var cB=checkbox(row,"基底関数を表示",true);
    var out=readout(el);
    function target(x){return Math.sin(Math.PI*x)+0.35*Math.sin(3*Math.PI*x);}
    function draw(){
      var N=+sN.input.value;
      sN.val.textContent=N+" 要素";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=50,x1=w-30,y0=h-42,amp=h*0.26,ymid=h*0.40;
      // 真の解
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.6;ctx.beginPath();
      for(var i=0;i<=300;i++){var u=i/300;ctx.lineTo(x0+(x1-x0)*u,ymid-target(u)*amp);}
      ctx.stroke();
      // 節点値（真値をサンプル）と 1 次要素による近似
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.4;ctx.beginPath();
      for(var k=0;k<=N;k++){
        var u2=k/N;ctx.lineTo(x0+(x1-x0)*u2,ymid-target(u2)*amp);
      }
      ctx.stroke();
      for(var k2=0;k2<=N;k2++){
        var u3=k2/N;
        ctx.fillStyle=C("--signal");
        ctx.beginPath();ctx.arc(x0+(x1-x0)*u3,ymid-target(u3)*amp,4,0,TAU);ctx.fill();
      }
      // 基底関数（帽子関数）
      if(cB.checked){
        ctx.strokeStyle=C("--line");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.stroke();
        ctx.strokeStyle=C("--blue");ctx.lineWidth=1.4;ctx.globalAlpha=.85;
        for(var m=0;m<=N;m++){
          ctx.beginPath();
          var c0=(m-1)/N,c1=m/N,c2=(m+1)/N;
          ctx.moveTo(x0+(x1-x0)*Math.max(c0,0),y0);
          ctx.lineTo(x0+(x1-x0)*c1,y0-42);
          ctx.lineTo(x0+(x1-x0)*Math.min(c2,1),y0);
          ctx.stroke();
        }
        ctx.globalAlpha=1;
        lab(ctx,"各節点に 1 つ。頂点で 1、隣の節点で 0",x1,y0-46,C("--faint"),"right",9.5);
        lab(ctx,"基底関数 φₙ（帽子関数）",x0,y0+20,C("--blue"));
      }
      lab(ctx,"真の解（細線）／ 有限要素近似（太線）",x0,30,C("--muted"));
      // 誤差
      var err=0;
      for(var q=0;q<=200;q++){
        var uq=q/200, seg=Math.min(N-1,Math.floor(uq*N)), a=seg/N,b=(seg+1)/N;
        var interp=target(a)+(target(b)-target(a))*(uq-a)/(b-a);
        err=Math.max(err,Math.abs(interp-target(uq)));
      }
      out.innerHTML="最大誤差 <b>"+f(err,4)+"</b>（要素数 "+N+"）"+
        "<br>要素を増やすと真の解に近づく。これが有限要素法の本質である —— 未知数は節点（辺）の値、"+
        "解は基底関数の重ね合わせで表される";
    }
    sN.input.addEventListener("input",draw);cB.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 08. mom — 行列のスケーリング ============ */
  REG.mom=function(el){
    head(el,"DEMO","密行列のコストと MLFMA");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sN=slider(row,"未知数 N（対数）",0,100,50,1);
    var cM=checkbox(row,"MLFMA を使う",false);
    var out=readout(el);
    function draw(){
      var N=Math.round(Math.pow(10,3+(+sN.input.value/100)*4));  // 1e3..1e7
      sN.val.textContent=N.toExponential(1);
      var mlf=cM.checked;
      var memDense=N*N*16;                       // 倍精度複素数 [byte]
      var memMLFMA=N*Math.log2(Math.max(N,2))*16*40;
      var mem=mlf?memMLFMA:memDense;
      var c=chart(cc,3,7,0,16,{l:60,b:36});
      var ctx=c.ctx;axis(c);
      function X(n){return c.p.l+(Math.log10(n)-3)/4*(c.w-c.p.l-c.p.r);}
      function Y(b){return c.h-c.p.b-(Math.min(Math.max(Math.log10(Math.max(b,1)),6),16)-6)/10*(c.h-c.p.t-c.p.b);}
      [[1e6,"1 MB"],[1e9,"1 GB"],[1e12,"1 TB"],[1e15,"1 PB"]].forEach(function(p){
        ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(c.p.l,Y(p[0]));ctx.lineTo(c.w-c.p.r,Y(p[0]));ctx.stroke();
        lab(ctx,p[1],c.p.l-6,Y(p[0])+4,C("--faint"),"right",9.5);
      });
      [[false,C("--alias"),"密行列 O(N²)"],[true,C("--blue"),"MLFMA O(N log N)"]].forEach(function(p){
        ctx.strokeStyle=p[1];ctx.lineWidth=p[0]===mlf?2.6:1.4;
        ctx.globalAlpha=p[0]===mlf?1:0.5;ctx.beginPath();
        for(var i=0;i<=100;i++){
          var n=Math.pow(10,3+4*i/100);
          var b=p[0]?n*Math.log2(n)*16*40:n*n*16;
          i?ctx.lineTo(X(n),Y(b)):ctx.moveTo(X(n),Y(b));
        }
        ctx.stroke();ctx.globalAlpha=1;
      });
      // 目安ライン
      [[8e9,"8 GB"],[512e9,"512 GB"]].forEach(function(p){
        ctx.strokeStyle=C("--muted");ctx.setLineDash([4,4]);ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(c.p.l,Y(p[0]));ctx.lineTo(c.w-c.p.r,Y(p[0]));ctx.stroke();
        ctx.setLineDash([]);lab(ctx,p[1]+" の壁",c.w-c.p.r-4,Y(p[0])-4,C("--muted"),"right",9);
      });
      ctx.fillStyle=mlf?C("--blue"):C("--alias");
      ctx.beginPath();ctx.arc(X(N),Y(mem),6,0,TAU);ctx.fill();
      [1e3,1e4,1e5,1e6,1e7].forEach(function(n){lab(ctx,n.toExponential(0),X(n),c.h-8,C("--faint"),"center");});
      lab(ctx,"未知数 N",c.w-c.p.r,c.p.t-2,C("--muted"),"right");
      lab(ctx,"必要メモリ",c.p.l-6,c.p.t-2,C("--muted"),"right");
      out.innerHTML="未知数 N = <b>"+N.toExponential(1)+"</b> ／ メモリ ≈ <b>"+
        (mem>1e12?f(mem/1e12,1)+" TB":mem>1e9?f(mem/1e9,1)+" GB":f(mem/1e6,1)+" MB")+"</b>"+
        (mlf?"（MLFMA）":"（密行列）")+
        (!mlf&&mem>8e9?' <span class="warn">← 通常の計算機では扱えない</span>':"")+
        "<br>MoM は未知数が表面だけで少ないが、行列が密になる。MLFMA が O(N log N) に落として大規模問題を解放した";
    }
    sN.input.addEventListener("input",draw);cM.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 09. chooser — 解法選択 ============ */
  REG.chooser=function(el){
    head(el,"DEMO","問題の性質から手法を選ぶ");
    var row=ctrls(el);
    var q1=select(row,"Q1. 欲しいのは",["広い帯域の特性","1 点・狭帯域の高精度"]);
    var q2=select(row,"Q2. 構造は",["導体が主体（アンテナ・散乱体）","誘電体が体積を占める","層構造 + 平面パターン"]);
    var q3=select(row,"Q3. 形状は",["直方体・層構造が主体","曲面・斜めが主役"]);
    var q4=select(row,"Q4. 領域は",["開放（放射・散乱）","閉じている（導波・共振）"]);
    var q5=select(row,"Q5. 電気的な大きさ",["数波長","数十波長以上"]);
    var pan=panel(el);
    var out=readout(el);
    function draw(){
      var a1=+q1.value,a2=+q2.value,a3=+q3.value,a4=+q4.value,a5=+q5.value;
      var score={FDTD:0,FEM:0,MoM:0,"2.5D":0};
      var why=[];
      if(a1===0){score.FDTD+=3;why.push(["Q1 広帯域","時間領域なら 1 回の計算で全周波数が出る → FDTD"]);}
      else{score.FEM+=2;score.MoM+=2;why.push(["Q1 狭帯域・高精度","周波数領域が有利。共振なら FEM が強い"]);}
      if(a2===0){score.MoM+=3;why.push(["Q2 導体主体","未知数が表面だけで済む → MoM。空気も吸収境界も不要"]);}
      else if(a2===1){score.FDTD+=2;score.FEM+=2;score.MoM-=3;why.push(["Q2 誘電体が体積を占める","MoM は体積積分方程式が要り不利。体積を刻む FDTD/FEM"]);}
      else{score["2.5D"]+=4;why.push(["Q2 層構造 + 平面パターン","層構造グリーン関数で金属だけメッシュ → 2.5D が圧倒的に速い"]);}
      if(a3===0){score.FDTD+=2;why.push(["Q3 直方体","直交格子と相性が良い → FDTD"]);}
      else{score.FEM+=3;score.FDTD-=2;why.push(["Q3 曲面が主役","階段近似で精度が 1 次に落ちる → 四面体の FEM"]);}
      if(a4===0){score.MoM+=2;why.push(["Q4 開放領域","MoM は放射条件が自動で入り、吸収境界が要らない"]);}
      else{score.FEM+=2;why.push(["Q4 閉領域","共振・導波は周波数領域の FEM が得意"]);}
      if(a5===1){score.FDTD+=2;score.MoM+=1;score.FEM-=2;
        why.push(["Q5 電気的に大きい","FEM は未知数が爆発。FDTD（O(N)）か MoM+MLFMA"]);}
      var ranked=Object.keys(score).sort(function(a,b){return score[b]-score[a];});
      var top=ranked[0];
      var notes={
        FDTD:"注意: 曲面は適合メッシュを有効に。高 Q 共振は減衰待ちが長い。最小セルが Δt を支配する（06 章）",
        FEM:"注意: 周波数ごとに解き直し。高速掃引の補間が共振で外れることがある（07 章）",
        MoM:"注意: 誘電体が多いと不利。行列が密（MLFMA を使う）。周波数掃引は解き直し（08 章）",
        "2.5D":"注意: 層構造から外れる立体形状・強い放射・筐体が絡むなら 3D へ移行する（08 章）"};
      pan.innerHTML=tbl(["手法","スコア","評価"],ranked.map(function(k){
        return ['<b>'+k+'</b>',String(score[k]),
          k===top?'<b class="ok">推奨</b>':(score[k]>=score[top]-2?'候補':'不向き')];
      }),["left","right","left"])+
      '<div style="margin-top:.7rem;border-top:1px solid var(--line);padding-top:.5rem">'+
      why.map(function(p){return '<div style="margin:.2rem 0"><b>'+p[0]+'</b> — '+p[1]+'</div>';}).join("")+
      '</div>';
      out.innerHTML="推奨: <b>"+top+"</b><br>"+notes[top]+
        "<br>複数が競合したら、まず軽い手法で傾向を掴み、詰めで重い手法に移るのが実務的である（09 章）";
    }
    [q1,q2,q3,q4,q5].forEach(function(s){s.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ============ 10. mesh — メッシュ密度と精度 ============ */
  REG.mesh=function(el){
    head(el,"DEMO","3 つの基準が決めるセルサイズ");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sF=slider(row,"周波数 [GHz]",0.5,40,10,0.5);
    var sE=slider(row,"比誘電率 εr",1,12,4.4,0.1);
    var sG=slider(row,"最小構造の寸法 [mm]",0.05,5,0.2,0.05);
    var sN=slider(row,"波長あたりセル数",6,30,15,1);
    var out=readout(el);
    function draw(){
      var fq=+sF.input.value*1e9, er=+sE.input.value, gap=+sG.input.value/1000, N=+sN.input.value;
      sF.val.textContent=f(fq/1e9,1)+" GHz"; sE.val.textContent=f(er,1);
      sG.val.textContent=f(gap*1000,2)+" mm"; sN.val.textContent=N+" セル/λ";
      var lam=C0/fq/Math.sqrt(er);
      var c1=lam/N, c2=gap/3, cell=Math.min(c1,c2);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=200,x1=w-96,by=h-28;
      // 3 つの基準の棒
      var mx=Math.max(c1,c2)*1.2;
      [["① 波長基準 λ/N",c1,C("--signal")],["② 形状基準（最小寸法/3）",c2,C("--blue")],
       ["採用値（3 つの最小）",cell,C("--alias")]].forEach(function(p,i){
        var y=56+i*52;
        lab(ctx,p[0],x0-8,y+4,C("--muted"),"right",10.5);
        var bw=(x1-x0)*(p[1]/mx);
        ctx.fillStyle=p[2];ctx.globalAlpha=i===2?.35:.22;ctx.fillRect(x0,y-14,bw,26);ctx.globalAlpha=1;
        ctx.strokeStyle=p[2];ctx.lineWidth=1.6;ctx.strokeRect(x0,y-14,bw,26);
        lab(ctx,eng(p[1],"m",2),x0+bw+8,y+4,p[2],"left",10.5);
      });
      lab(ctx,c2<c1?"形状基準が波長基準を上回っている —— 実務では日常茶飯事である"
                   :"波長基準が支配的 —— 最小構造には十分な余裕がある",
          20,by,c2<c1?C("--alias"):C("--muted"),"left",11);
      // コスト概算（1 辺 20λ の立方体と仮定）
      var side=20*lam, cells=Math.pow(side/cell,3);
      out.innerHTML="材料中の波長 λ = <b>"+eng(lam,"m",2)+"</b> ／ 採用セルサイズ = <b>"+eng(cell,"m",2)+"</b>"+
        (c2<c1?' <span class="warn">← 形状基準が支配（最小構造に 3 セル）</span>':"")+
        "<br>参考: 1 辺 20λ の領域なら総セル数 ≈ <b>"+cells.toExponential(1)+"</b>"+
        (cells>1e9?' <span class="warn">← 一律細分化では破綻する。局所細分化が要る</span>':"");
    }
    [sF,sE,sG,sN].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 11. pml2d — 本物の 2D FDTD ============ */
  REG.pml2d=function(el){
    head(el,"DEMO","2D FDTD — 境界を PEC と PML で比べる");
    var cv=screen(el,320), cc=cctx(cv);
    var row=ctrls(el);
    var bar=mk("div","btns");el.insertBefore(bar,row);
    var bPEC=button(bar,"境界 = PEC（全反射）");
    var bPML=button(bar,"境界 = PML（吸収）");
    var bRst=button(bar,"リセット");
    var sNp=slider(row,"PML の層数",4,16,10,1);
    var out=readout(el);
    var NX=140,NY=100;
    var st={mode:1,n:0};
    var Ez=new Float64Array(NX*NY),Hx=new Float64Array(NX*NY),Hy=new Float64Array(NX*NY);
    var Ezx=new Float64Array(NX*NY),Ezy=new Float64Array(NX*NY);
    var sx=new Float64Array(NX),sy=new Float64Array(NY);
    function buildPML(){
      var np=+sNp.input.value, smax=0.33;
      sx.fill(0);sy.fill(0);
      if(st.mode===1){
        for(var i=0;i<np;i++){
          var v=smax*Math.pow((np-i)/np,3);
          sx[i]=v;sx[NX-1-i]=v;
        }
        for(var j=0;j<np;j++){
          var v2=smax*Math.pow((np-j)/np,3);
          sy[j]=v2;sy[NY-1-j]=v2;
        }
      }
    }
    function reset(){Ez.fill(0);Hx.fill(0);Hy.fill(0);Ezx.fill(0);Ezy.fill(0);st.n=0;buildPML();}
    bRst.addEventListener("click",reset);
    sNp.input.addEventListener("input",function(){sNp.val.textContent=sNp.input.value+" 層";buildPML();});
    sNp.val.textContent=sNp.input.value+" 層";
    function setMode(m){
      st.mode=m;reset();
      bPEC.setAttribute("aria-pressed",m===0?"true":"false");
      bPML.setAttribute("aria-pressed",m===1?"true":"false");
    }
    bPEC.addEventListener("click",function(){setMode(0);});
    bPML.addEventListener("click",function(){setMode(1);});
    setMode(1);
    var S=0.5;
    function stepFDTD(){
      var i,j,k;
      for(var it=0;it<2;it++){
        // H 更新
        for(j=0;j<NY-1;j++)for(i=0;i<NX-1;i++){
          k=j*NX+i;
          Hx[k]=(1-sy[j])*Hx[k]-S*(Ez[k+NX]-Ez[k]);
          Hy[k]=(1-sx[i])*Hy[k]+S*(Ez[k+1]-Ez[k]);
        }
        // E 更新（分離型 PML）
        for(j=1;j<NY-1;j++)for(i=1;i<NX-1;i++){
          k=j*NX+i;
          Ezx[k]=(1-sx[i])*Ezx[k]+S*(Hy[k]-Hy[k-1]);
          Ezy[k]=(1-sy[j])*Ezy[k]-S*(Hx[k]-Hx[k-NX]);
          Ez[k]=Ezx[k]+Ezy[k];
        }
        // 点源（変調ガウシアン）
        if(st.n>420)reset();          // 波が消えたら撃ち直す
        var t0=30,tau=10,tt=st.n-t0;
        var src=Math.exp(-(tt/tau)*(tt/tau))*Math.cos(0.32*tt);
        var kc=Math.floor(NY/2)*NX+Math.floor(NX/2);
        Ezx[kc]+=src*0.5;Ezy[kc]+=src*0.5;Ez[kc]=Ezx[kc]+Ezy[kc];
        st.n++;
      }
    }
    function draw(){
      stepFDTD();
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      var img=ctx.createImageData(NX,NY);
      var isDark=C("--paper").length&&(function(){var t=root.getAttribute("data-theme");
        return t?t==="dark":matchMedia("(prefers-color-scheme:dark)").matches;})();
      for(var j=0;j<NY;j++)for(var i=0;i<NX;i++){
        var v=Ez[j*NX+i];
        if(!isFinite(v))v=0;
        var s=Math.max(-1,Math.min(1,v*7));
        var p=(j*NX+i)*4;
        // 発散配色: 負=青、正=赤（テーマに合わせて背景を変える）
        var base=isDark?24:246;
        img.data[p]  =base+(s>0? s*(isDark?200:-10):0)+(s<0?0:0);
        img.data[p+1]=base-Math.abs(s)*(isDark?10:120);
        img.data[p+2]=base+(s<0?-s*(isDark?200:-10):0);
        if(!isDark){
          img.data[p]  =246-(s<0?-s*120:0);
          img.data[p+1]=246-Math.abs(s)*150;
          img.data[p+2]=246-(s>0? s*120:0);
        }
        img.data[p+3]=255;
      }
      // PML 領域を薄く着色
      var np=+sNp.input.value;
      if(st.mode===1){
        for(var j2=0;j2<NY;j2++)for(var i2=0;i2<NX;i2++){
          if(i2<np||i2>=NX-np||j2<np||j2>=NY-np){
            var p2=(j2*NX+i2)*4;
            img.data[p2+1]=Math.max(0,img.data[p2+1]-8);
          }
        }
      }
      var tmp=document.createElement("canvas");tmp.width=NX;tmp.height=NY;
      tmp.getContext("2d").putImageData(img,0,0);
      ctx.clearRect(0,0,w,h);
      ctx.imageSmoothingEnabled=true;
      ctx.drawImage(tmp,0,0,w,h);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(0.5,0.5,w-1,h-1);
      if(st.mode===1){
        ctx.strokeStyle=C("--blue");ctx.lineWidth=1.4;ctx.setLineDash([5,4]);
        ctx.strokeRect(w*np/NX,h*np/NY,w*(NX-2*np)/NX,h*(NY-2*np)/NY);ctx.setLineDash([]);
        lab(ctx,"PML "+np+" 層",8,16,C("--blue"));
      }else{
        lab(ctx,"PEC（全反射）",8,16,C("--alias"));
      }
      lab(ctx,"ステップ "+st.n,w-8,16,C("--muted"),"right");
      // 残留エネルギー
      var en=0;for(var q=0;q<NX*NY;q++){var e=Ez[q];if(isFinite(e))en+=e*e;}
      out.innerHTML=(st.mode===1
        ?"<b>PML</b>: 出ていった波は戻ってこない。計算領域の中央付近は静かになる"
        :'<span class="warn"><b>PEC</b>: 壁で跳ね返った波が計算領域を汚し続ける</span>')+
        "<br>残留エネルギー <b>"+en.toExponential(2)+"</b> ／ "+
        "PML は座標を複素数に伸長する装置で、接線波数が保存されるのでどんな入射角でも反射しない";
    }
    anim(el,draw);reg(cv,function(){});
  };

  /* ============ 12. port — 励振波形 ============ */
  REG.port=function(el){
    head(el,"DEMO","励振波形と解析帯域");
    var cv=screen(el,250), cc=cctx(cv);
    var row=ctrls(el);
    var sel=select(row,"波形",["微分ガウシアン（標準）","ガウシアン","変調ガウシアン"]);
    var sT=slider(row,"パルス幅 τ [ps]",5,120,30,1);
    var sB=slider(row,"解析したい上限周波数 [GHz]",5,60,20,1);
    var out=readout(el);
    function draw(){
      var kind=+sel.value, tau=+sT.input.value*1e-12, fmax=+sB.input.value*1e9;
      sT.val.textContent=f(tau*1e12,0)+" ps"; sB.val.textContent=f(fmax/1e9,0)+" GHz";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=50,x1=w-30;
      // 時間波形
      var ty=80;
      lab(ctx,"時間波形",x0,32,C("--muted"));
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      var span=6*tau;
      for(var i=0;i<=400;i++){
        var u=i/400, t=(u-0.5)*span;
        var g=Math.exp(-(t/tau)*(t/tau)),v;
        if(kind===0)v=-2*(t/tau)*g;
        else if(kind===1)v=g;
        else v=g*Math.cos(2*Math.PI*fmax*0.5*t);
        ctx.lineTo(x0+(x1-x0)*u,ty-v*36);
      }
      ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,ty);ctx.lineTo(x1,ty);ctx.stroke();
      // スペクトル
      var sy0=h-56;
      lab(ctx,"スペクトル",x0,152,C("--muted"));
      var fdisp=fmax*2.2;
      function spec(fr){
        var g=Math.exp(-Math.pow(Math.PI*fr*tau,2));
        if(kind===0)return (fr/(1/(Math.PI*tau)))*g*2.2;
        if(kind===1)return g;
        var fc=fmax*0.5;
        return Math.exp(-Math.pow(Math.PI*(fr-fc)*tau,2));
      }
      var mx=0;for(var q=0;q<=200;q++)mx=Math.max(mx,spec(fdisp*q/200));
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
      for(var i2=0;i2<=300;i2++){
        var fr=fdisp*i2/300;
        ctx.lineTo(x0+(x1-x0)*i2/300, sy0-spec(fr)/mx*74);
      }
      ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,sy0);ctx.lineTo(x1,sy0);ctx.stroke();
      var fx=x0+(x1-x0)*(fmax/fdisp);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(fx,sy0);ctx.lineTo(fx,sy0-62);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"解析上限 "+f(fmax/1e9,0)+" GHz",fx+6,sy0-50,C("--alias"));
      lab(ctx,"0",x0,sy0+16,C("--faint"),"center");
      lab(ctx,f(fdisp/1e9,0)+" GHz",x1,sy0+16,C("--faint"),"right");
      var lvl=spec(fmax)/mx;
      out.innerHTML="解析上限でのスペクトル強度 <b>"+f(db20(lvl),1)+" dB</b>（ピーク比）"+
        (lvl<0.05?' <span class="warn">← 成分が乏しい。この帯域の S パラメータは雑音を割った値になる</span>'
                 :' <b class="ok">十分な成分がある</b>')+
        "<br>鉄則: 解析帯域の 1.5〜2 倍まで含み、それ以上は含まない（鋭すぎるとメッシュで解像できず数値分散で汚れる）";
    }
    sel.addEventListener("change",draw);
    [sT,sB].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 13. converge — メッシュ収束と外挿 ============ */
  REG.converge=function(el){
    head(el,"DEMO","メッシュ収束 — どこで打ち切るか");
    var cv=screen(el,260), cc=cctx(cv);
    var row=ctrls(el);
    var sN0=slider(row,"最初のメッシュ密度 [セル/λ]",4,14,6,1);
    var sK=slider(row,"細分化の段数",2,6,4,1);
    var sP=select(row,"収束次数 p",["2 次（滑らかな形状・素直な離散化）","1 次（階段近似・特異点あり）"]);
    var sA=slider(row,"離散化誤差の大きさ",0.2,3,1,0.1);
    var out=readout(el);
    var TRUE=2.450; // 真の共振周波数 [GHz]
    function draw(){
      var N0=+sN0.input.value, K=+sK.input.value, p=(+sP.value===0)?2:1, A=+sA.input.value;
      sN0.val.textContent=N0+" セル/λ"; sK.val.textContent=K+" 段"; sA.val.textContent=f(A,1);
      // 各段のセル数は 1.4 倍ずつ増やす（＝セルサイズ h は 1/1.4 倍）
      var lv=[];
      for(var i=0;i<K;i++){
        var N=N0*Math.pow(1.4,i);
        var h=1/N;                       // 波長で規格化したセルサイズ
        var val=TRUE+A*(p===2?0.036:0.060)*Math.pow(h*10,p); // f(h) = f_exact + A h^p
        lv.push({N:N,h:h,v:val});
      }
      // 最後の 2 点からリチャードソン外挿
      var n=lv.length, h1=lv[n-2].h, h2=lv[n-1].h, v1=lv[n-2].v, v2=lv[n-1].v;
      var rr=h1/h2;
      var ext=v2+(v2-v1)/(Math.pow(rr,p)-1);
      var d=cc.fit(),w=d.w,hh=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,hh);
      var hmax=lv[0].h*1.15;
      var vlo=Math.min(TRUE,ext)-0.02, vhi=Math.max.apply(null,lv.map(function(q){return q.v;}))+0.02;
      var P={l:58,r:16,t:20,b:34};
      function X(x){return P.l+x/hmax*(w-P.l-P.r);}
      function Y(y){return hh-P.b-(y-vlo)/(vhi-vlo)*(hh-P.t-P.b);}
      // 軸
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(P.l,P.t);ctx.lineTo(P.l,hh-P.b);ctx.lineTo(w-P.r,hh-P.b);ctx.stroke();
      lab(ctx,"セルサイズ h（大 →）",w-P.r,hh-P.b+22,C("--muted"),"right",10.5);
      lab(ctx,"評価量 [GHz]",8,P.t-6,C("--muted"),"left",10.5);
      // 真値の線
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1.4;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(P.l,Y(TRUE));ctx.lineTo(w-P.r,Y(TRUE));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"真値 "+f(TRUE,3),w-P.r,Y(TRUE)-6,C("--faint"),"right",10);
      // 曲線
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var q=0;q<=120;q++){
        var hx=hmax*q/120;
        ctx.lineTo(X(hx),Y(TRUE+A*(p===2?0.036:0.060)*Math.pow(hx*10,p)));
      }
      ctx.stroke();
      // 各段の点
      lv.forEach(function(q,i){
        ctx.beginPath();ctx.arc(X(q.h),Y(q.v),4.5,0,TAU);ctx.fillStyle=C("--signal");ctx.fill();
        lab(ctx,String(i+1),X(q.h),Y(q.v)-10,C("--signal"),"center",10);
      });
      // 外挿点
      ctx.beginPath();ctx.arc(X(0),Y(ext),5.5,0,TAU);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.2;ctx.stroke();
      lab(ctx,"外挿 "+f(ext,3),X(0)+10,Y(ext)-8,C("--alias"),"left",10.5);
      // 表
      var rows=lv.map(function(q,i){
        var ch=i?Math.abs((q.v-lv[i-1].v)/lv[i-1].v*100):null;
        return [String(i+1), f(q.N,1), f(q.v,4),
          ch==null?"—":(f(ch,2)+" %"+(ch<1?' <b class="ok">◎</b>':(ch<3?" △":' <span class="warn">×</span>')))];
      });
      out.innerHTML=tbl(["段","セル/λ","評価量 [GHz]","前段からの変化"],rows,["center","right","right","right"])+
        "<br>リチャードソン外挿値 = <b>"+f(ext,4)+" GHz</b>（真値との差 "+
        f(Math.abs(ext-TRUE)/TRUE*100,3)+" %）／最終段そのままの誤差 "+
        f(Math.abs(v2-TRUE)/TRUE*100,3)+" %"+
        "<br>"+(p===2
          ? "収束次数 2 なので、h を 1.4 倍細かくすると誤差はおよそ 1/2 になる。外挿がよく効く。"
          : '<span class="warn">収束次数 1（階段近似や特異点がある場合）では誤差の落ち方が遅く、同じ精度に何倍ものセルが要る。</span>')+
        "<br>判断の目安: <b>前段からの変化が 1 % を切ったら打ち切る</b>。まだ動いているうちに止めたら、その数字は「未収束の値」でしかない。";
    }
    [sN0,sK,sA].forEach(function(s){s.input.addEventListener("input",draw);});
    sP.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 14. sparam — S パラメータを読む ============ */
  REG.sparam=function(el){
    head(el,"DEMO","反射係数・VSWR・電力の対応");
    var cv=screen(el,180), cc=cctx(cv);
    var row=ctrls(el);
    var s11=slider(row,"|S11| [dB]",-40,0,-15,0.5);
    var s21=slider(row,"|S21| [dB]",-20,0,-0.5,0.1);
    var sZ=slider(row,"参照インピーダンス [Ω]",25,100,50,1);
    var out=readout(el);
    function draw(){
      var d11=+s11.input.value, d21=+s21.input.value, Z0=+sZ.input.value;
      s11.val.textContent=f(d11,1)+" dB"; s21.val.textContent=f(d21,1)+" dB";
      sZ.val.textContent=f(Z0,0)+" Ω";
      var g=Math.pow(10,d11/20), t=Math.pow(10,d21/20);
      var Pr=g*g, Pt=t*t, Pl=1-Pr-Pt;
      var vswr=(1+g)/(1-g);
      var ZL=Z0*(1+g)/(1-g); // 位相 0（純抵抗）と仮定した場合の負荷
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      // 入射電力 1 の行き先を帯グラフで
      var x0=24,x1=w-24,by=76,bh=40;
      var segs=[["反射 "+f(Pr*100,1)+"%",Math.max(Pr,0),C("--alias")],
                ["透過 "+f(Pt*100,1)+"%",Math.max(Pt,0),C("--signal")],
                ["損失 "+f(Math.max(Pl,0)*100,1)+"%",Math.max(Pl,0),C("--muted")]];
      var acc=0;
      lab(ctx,"入射電力 1 W の行き先",x0,by-14,C("--muted"),"left",11);
      segs.forEach(function(p){
        var bw=(x1-x0)*p[1];
        if(bw>0.5){
          ctx.fillStyle=p[2];ctx.globalAlpha=.28;ctx.fillRect(x0+acc,by,bw,bh);ctx.globalAlpha=1;
          ctx.strokeStyle=p[2];ctx.lineWidth=1.4;ctx.strokeRect(x0+acc,by,bw,bh);
          if(bw>78)lab(ctx,p[0],x0+acc+bw/2,by+bh/2+4,p[2],"center",10.5);
        }
        acc+=bw;
      });
      if(Pl<-1e-9){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=2;ctx.setLineDash([4,3]);
        ctx.strokeRect(x0,by-4,x1-x0,bh+8);ctx.setLineDash([]);
      }
      var legy=by+bh+26, lx=x0;
      segs.forEach(function(p){
        ctx.fillStyle=p[2];ctx.globalAlpha=.28;ctx.fillRect(lx,legy-9,11,11);ctx.globalAlpha=1;
        ctx.strokeStyle=p[2];ctx.lineWidth=1.2;ctx.strokeRect(lx,legy-9,11,11);
        lab(ctx,p[0],lx+16,legy,C("--muted"),"left",10.5);
        lx+=Math.max(120,ctx.measureText(p[0]).width+42);
      });
      out.innerHTML=tbl(["量","値","読み方"],[
        ["反射係数 |Γ|", f(g,4), "電圧の比。0 が完全整合、1 が全反射"],
        ["リターンロス", f(-d11,1)+" dB", "戻ってくる電力の小ささ。大きいほど良い"],
        ["VSWR", f(vswr,3), "定在波の山谷比。1.0 が理想、2.0 で反射 11 %"],
        ["反射電力", f(Pr*100,2)+" %", "|S11|² そのもの"],
        ["透過電力", f(Pt*100,2)+" %", "|S21|² そのもの"],
        ["等価な負荷（純抵抗と仮定）", f(ZL,1)+" Ω", "参照 "+f(Z0,0)+" Ω に対して"]
      ],["left","right","left"])+
      "<br><b>パッシブ性の検算:</b> |S11|²+|S21|² = <b>"+f(Pr+Pt,4)+"</b> "+
      (Pr+Pt<=1.0000001?'<b class="ok">≤ 1 — 受動素子として矛盾なし</b>'
        :'<span class="warn">&gt; 1 — 入れた以上の電力が出ている。解析が破綻している（メッシュ・ポート・材料を疑う）</span>')+
      "<br>差の "+f(Math.max(Pl,0)*100,2)+" % が導体損・誘電損・放射に消えた分である。"+
      "無損失構造を解析してこの値が大きく出たら、数値誤差か PML への漏れを疑う。"+
      '<br><span class="warn">注意:</span> 参照インピーダンスを変えると同じ構造でも S パラメータの値は変わる。'+
      "比較する 2 つのデータが同じ参照系かを必ず確認すること。";
    }
    [s11,s21,sZ].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 15. pattern — 遠方界パターン ============ */
  REG.pattern=function(el){
    head(el,"DEMO","開口の大きさとテーパ → 放射パターン");
    var cv=screen(el,280), cc=cctx(cv);
    var row=ctrls(el);
    var sL=slider(row,"開口長 [波長]",1,20,6,0.5);
    var sT=select(row,"開口分布（テーパ）",["一様（振幅が端まで一定）","コサイン（端で 0 に落とす）","三角（さらに強いテーパ）"]);
    var sS=select(row,"縦軸",["dB 表示","電力の直線表示"]);
    var out=readout(el);
    function draw(){
      var L=+sL.input.value, tp=+sT.value, logsc=(+sS.value===0);
      sL.val.textContent=f(L,1)+" λ";
      // 開口を細かい素子列に分ける（d = λ/8 → グレーティングローブは出ない）
      var K=Math.max(16,Math.round(L*8)), d=L/K;
      var wt=[],sum=0;
      for(var k=0;k<K;k++){
        var u=(k+0.5)/K, a;
        if(tp===0)a=1;
        else if(tp===1)a=Math.cos(Math.PI*(u-0.5));
        else a=1-Math.abs(2*u-1);
        wt.push(a);sum+=a;
      }
      function AF(th){
        var re=0,im=0, s=Math.sin(th);
        for(var k=0;k<K;k++){
          var ph=TAU*d*(k-(K-1)/2)*s;
          re+=wt[k]*Math.cos(ph); im+=wt[k]*Math.sin(ph);
        }
        return Math.sqrt(re*re+im*im)/sum;
      }
      // サンプリングして特徴量を測る
      var M=1200, pat=[];
      for(var i=0;i<=M;i++){
        var th=(-90+180*i/M)*Math.PI/180;
        pat.push(AF(th));
      }
      // 半値幅
      var hp=null;
      for(var i2=Math.floor(M/2);i2<=M;i2++){ if(pat[i2]<Math.SQRT1_2){ hp=2*(-90+180*i2/M); break; } }
      // 第 1 サイドローブ
      var sll=null, minSeen=1;
      for(var i3=Math.floor(M/2)+1;i3<M;i3++){
        minSeen=Math.min(minSeen,pat[i3]);
        if(pat[i3]>pat[i3-1]&&pat[i3]>=pat[i3+1]&&pat[i3]<0.7){ sll=db20(pat[i3]); break; }
      }
      var d0=cc.fit(),w=d0.w,h=d0.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var P={l:52,r:18,t:22,b:34}, ylo=logsc?-45:0, yhi=logsc?2:1.02;
      function X(t){return P.l+(t+90)/180*(w-P.l-P.r);}
      function Y(v){return h-P.b-(v-ylo)/(yhi-ylo)*(h-P.t-P.b);}
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      for(var g2=0;g2<=5;g2++){var yy=P.t+g2/5*(h-P.t-P.b);
        ctx.beginPath();ctx.moveTo(P.l,yy);ctx.lineTo(w-P.r,yy);ctx.stroke();
        lab(ctx,logsc?f(yhi-(yhi-ylo)*g2/5,0):f(yhi-(yhi-ylo)*g2/5,1),P.l-6,yy+4,C("--faint"),"right",9.5);}
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(P.l,h-P.b);ctx.lineTo(w-P.r,h-P.b);ctx.stroke();
      [-90,-60,-30,0,30,60,90].forEach(function(t){
        lab(ctx,t+"°",X(t),h-P.b+18,C("--faint"),"center",9.5);});
      lab(ctx,logsc?"正規化強度 [dB]":"正規化電力",8,P.t-6,C("--muted"),"left",10);
      lab(ctx,"到来角 θ",w-P.r,P.t-6,C("--muted"),"right",10);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i4=0;i4<=M;i4++){
        var t4=-90+180*i4/M, v=logsc?Math.max(db20(pat[i4]),ylo-3):pat[i4]*pat[i4];
        ctx.lineTo(X(t4),Y(v));
      }
      ctx.stroke();
      // 半値幅を示す
      if(hp){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.moveTo(X(-hp/2),P.t);ctx.lineTo(X(-hp/2),h-P.b);
        ctx.moveTo(X(hp/2),P.t);ctx.lineTo(X(hp/2),h-P.b);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"半値幅 "+f(hp,1)+"°",X(0),Y(logsc?-9:0.72),C("--alias"),"center",10.5);
      }
      var dir=db10(2*L*(tp===0?1:(tp===1?0.81:0.75))); // 開口能率込みの目安
      out.innerHTML="半値幅 <b>"+(hp?f(hp,1)+"°":"—")+"</b>（目安の式 λ/D → "+f(51/L,1)+"°）"+
        "／第 1 サイドローブ <b>"+(sll!=null?f(sll,1)+" dB":"—")+"</b>"+
        "／指向性の目安 <b>"+f(dir,1)+" dBi</b>"+
        "<br>"+(tp===0?"一様分布はビームが最も細いが、サイドローブが −13.3 dB と高い。":
                tp===1?"コサインテーパでサイドローブが下がった代わりに、ビームは太くなった。":
                       "強いテーパはサイドローブを大きく下げるが、ビームはさらに太り、開口能率（実効的に使えている面積の割合）も落ちる。")+
        "<br><b>開口とパターンはフーリエ変換の関係にある。</b>開口を 2 倍にすればビーム幅は半分、"+
        "端を滑らかに落とせばサイドローブが下がりビームが太る——時間波形と窓関数の関係と全く同じ構図である。";
    }
    [sL].forEach(function(s){s.input.addEventListener("input",draw);});
    [sT,sS].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 16. fft — 時間領域 ↔ 周波数領域 ============ */
  REG.fft=function(el){
    head(el,"DEMO","打ち切りとスペクトルの荒れ");
    var cv=screen(el,290), cc=cctx(cv);
    var row=ctrls(el);
    var sQ=slider(row,"共振の鋭さ Q",5,200,60,1);
    var sT=slider(row,"計算を打ち切る時刻 [ns]",0.5,20,20,0.1);
    var sW=checkbox(row,"窓関数をかける",false);
    var out=readout(el);
    var F0=5e9; // 5 GHz の共振
    function draw(){
      var Q=+sQ.input.value, Tmax=+sT.input.value*1e-9, win=sW.checked;
      sQ.val.textContent=f(Q,0); sT.val.textContent=f(Tmax*1e9,1)+" ns";
      var tau=Q/(Math.PI*F0);          // 振幅が 1/e になる時定数
      var Tfull=tau*Math.log(1e4);     // −80 dB まで落ちる時刻（実質の全長）
      var N=1024, dt=Tmax/N;
      var y=new Float64Array(N);
      for(var n=0;n<N;n++){
        var t=n*dt;
        var v=Math.exp(-t/tau)*Math.sin(TAU*F0*t);
        if(win)v*=0.5*(1-Math.cos(TAU*n/(N-1))); // ハン窓
        y[n]=v;
      }
      // DFT（表示用に 300 点だけ評価する）
      var NF=300, fmax=12e9, mag=[];
      for(var i=0;i<NF;i++){
        var fr=fmax*i/(NF-1), re=0,im=0;
        for(var n2=0;n2<N;n2++){
          var ph=-TAU*fr*n2*dt;
          re+=y[n2]*Math.cos(ph); im+=y[n2]*Math.sin(ph);
        }
        mag.push(Math.sqrt(re*re+im*im)*dt);
      }
      var mx=Math.max.apply(null,mag);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      // 上段: 時間波形
      var x0=54,x1=w-20,ty=64;
      lab(ctx,"時間波形（打ち切りまで）",x0,28,C("--muted"),"left",11);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,ty);ctx.lineTo(x1,ty);ctx.stroke();
      // 表示は常に全長 Tfull を横軸に取り、打ち切り位置を見せる
      var Tdisp=Math.max(Tfull,Tmax);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.4;ctx.beginPath();
      for(var q=0;q<=900;q++){
        var t2=Tdisp*q/900;
        if(t2>Tmax)break;
        var v2=Math.exp(-t2/tau)*Math.sin(TAU*F0*t2);
        if(win)v2*=0.5*(1-Math.cos(TAU*(t2/Tmax)));
        ctx.lineTo(x0+(x1-x0)*(t2/Tdisp),ty-v2*34);
      }
      ctx.stroke();
      // 打ち切り後の「見ていない部分」を薄く
      if(Tmax<Tdisp){
        ctx.strokeStyle=C("--faint");ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();
        for(var q2=0;q2<=900;q2++){
          var t3=Tdisp*q2/900; if(t3<Tmax)continue;
          ctx.lineTo(x0+(x1-x0)*(t3/Tdisp),ty-Math.exp(-t3/tau)*Math.sin(TAU*F0*t3)*34);
        }
        ctx.stroke();ctx.setLineDash([]);
        var cx=x0+(x1-x0)*(Tmax/Tdisp);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.beginPath();
        ctx.moveTo(cx,ty-42);ctx.lineTo(cx,ty+42);ctx.stroke();
        lab(ctx,"ここで打ち切り",cx-6,ty-46,C("--alias"),"right",10);
      }
      // 残留レベル
      var resid=Math.exp(-Tmax/tau);
      // 下段: スペクトル
      var sy=h-42;
      lab(ctx,"スペクトル（上の波形を FFT したもの）",x0,ty+72,C("--muted"),"left",11);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,sy);ctx.lineTo(x1,sy);ctx.stroke();
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.beginPath();
      for(var i2=0;i2<NF;i2++){
        ctx.lineTo(x0+(x1-x0)*i2/(NF-1), sy-(mag[i2]/mx)*104);
      }
      ctx.stroke();
      [0,3,6,9,12].forEach(function(gz){
        lab(ctx,gz+" GHz",x0+(x1-x0)*(gz*1e9/fmax),sy+16,C("--faint"),"center",9.5);});
      out.innerHTML="打ち切り時点の残留振幅 <b>"+f(db20(resid),1)+" dB</b>（初期比）"+
        (resid>0.01?' <span class="warn">← まだ −40 dB まで落ちていない。スペクトルがリップル（さざ波状のうねり）で汚れている</span>'
                   :' <b class="ok">← 十分に減衰。スペクトルは信用できる</b>')+
        "<br>周波数分解能 Δf = 1/T = <b>"+eng(1/Tmax,"Hz",2)+"</b>（打ち切り時刻の逆数。短く切るほど粗くなる）"+
        "<br>Q = "+f(Q,0)+" の共振が −80 dB まで落ちるには <b>"+f(Tfull*1e9,1)+" ns</b> 必要である。"+
        "<br>"+(win
          ?"窓関数はリップルを抑えるが、そのぶんスペクトルのピークが太る。<b>「切ってから窓で誤魔化した」値をそのまま Q の測定に使ってはいけない</b>。"
          :"窓関数なしでは、打ち切りが矩形窓として掛かり、その周波数応答（sinc 関数）がリップルとして重畳する。")+
        "<br><b>高 Q の構造を時間領域ソルバで解くのは高くつく</b>——これが 09 章で「狭帯域の共振器は周波数領域が有利」と言った理由の実体である。";
    }
    [sQ,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    sW.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 17. patch — パッチアンテナの初期寸法 ============ */
  REG.patch=function(el){
    head(el,"DEMO","4 つの式でパッチの寸法を出す");
    var cv=screen(el,230), cc=cctx(cv);
    var row=ctrls(el);
    var sF=slider(row,"共振周波数 f0 [GHz]",0.5,10,2.45,0.05);
    var sE=slider(row,"基板の比誘電率 εr",1.8,10.5,4.4,0.1);
    var sH=slider(row,"基板厚 h [mm]",0.2,3.2,1.6,0.05);
    var sD=slider(row,"誘電正接 tanδ",0.0005,0.03,0.02,0.0005);
    var out=readout(el);
    function draw(){
      var f0=+sF.input.value*1e9, er=+sE.input.value, hs=+sH.input.value/1000, td=+sD.input.value;
      sF.val.textContent=f(f0/1e9,2)+" GHz"; sE.val.textContent=f(er,1);
      sH.val.textContent=f(hs*1000,2)+" mm"; sD.val.textContent=f(td,4);
      // Step 1: 幅 W
      var W=C0/(2*f0)*Math.sqrt(2/(er+1));
      // Step 2: 実効誘電率
      var eeff=(er+1)/2+(er-1)/2/Math.sqrt(1+12*hs/W);
      // Step 3: フリンジングによる伸び ΔL
      var dL=0.412*hs*((eeff+0.3)*(W/hs+0.264))/((eeff-0.258)*(W/hs+0.8));
      // Step 4: 長さ L
      var L=C0/(2*f0*Math.sqrt(eeff))-2*dL;
      // 帯域と効率の目安
      var lam0=C0/f0;
      var bw=3.77*(er-1)/(er*er)*(hs/lam0)*(W/L)*100; // 比帯域 [%] の経験式
      var Qd=1/td;
      var d=cc.fit(),w=d.w,hh=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,hh);
      // 寸法図（上から見たパッチ）
      var maxmm=Math.max(W,L)*1000;
      var sc=Math.min((w*0.45)/maxmm,(hh-90)/maxmm);
      var pw=W*1000*sc, pl=L*1000*sc;
      var cx=w*0.32, cy=hh/2+6;
      ctx.fillStyle=C("--signal");ctx.globalAlpha=.20;
      ctx.fillRect(cx-pw/2,cy-pl/2,pw,pl);ctx.globalAlpha=1;
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;ctx.strokeRect(cx-pw/2,cy-pl/2,pw,pl);
      // 給電（インセット）
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(cx,cy+pl/2);ctx.lineTo(cx,cy+pl/2+22);ctx.stroke();
      lab(ctx,"給電",cx+6,cy+pl/2+20,C("--blue"),"left",10);
      // 寸法線
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx-pw/2,cy-pl/2-14);ctx.lineTo(cx+pw/2,cy-pl/2-14);ctx.stroke();
      lab(ctx,"W = "+f(W*1000,2)+" mm",cx,cy-pl/2-20,C("--muted"),"center",10.5);
      ctx.beginPath();ctx.moveTo(cx+pw/2+14,cy-pl/2);ctx.lineTo(cx+pw/2+14,cy+pl/2);ctx.stroke();
      lab(ctx,"L = "+f(L*1000,2)+" mm",cx+pw/2+20,cy+4,C("--muted"),"left",10.5);
      // 右側に導出の 4 ステップ
      var tx=Math.min(w-16,cx+pw/2+130), ty=44;
      if(tx<w-190)tx=w-190;
      [["① 幅 W","c/(2f0)·√(2/(εr+1))",f(W*1000,2)+" mm"],
       ["② 実効誘電率 εeff","(εr+1)/2 + …",f(eeff,3)],
       ["③ 縁の伸び ΔL","0.412h·(…)/(…)",f(dL*1000,3)+" mm"],
       ["④ 長さ L","c/(2f0√εeff) − 2ΔL",f(L*1000,2)+" mm"]].forEach(function(p,i){
        var y=ty+i*44;
        lab(ctx,p[0],tx,y,C("--ink"),"left",11);
        lab(ctx,p[1],tx,y+15,C("--faint"),"left",9.5);
        lab(ctx,p[2],tx,y+30,C("--signal"),"left",11.5);
      });
      out.innerHTML=tbl(["量","値","効き方"],[
        ["幅 W", f(W*1000,3)+" mm", "放射抵抗と帯域を決める。広いほど帯域が広く効率が良い"],
        ["長さ L", f(L*1000,3)+" mm", "共振周波数を決める主役。ここが 1 % ずれれば f0 も 1 % ずれる"],
        ["実効誘電率 εeff", f(eeff,3), "電界の一部が空気を通るので εr より小さい"],
        ["縁の伸び ΔL", f(dL*1000,3)+" mm（片側）", "厚い基板ほど大きい。L の "+f(2*dL/L*100,1)+" % に相当"],
        ["比帯域の目安", f(bw,2)+" %", "基板が厚く εr が低いほど広い"],
        ["誘電損の Q", f(Qd,0), "tanδ の逆数。小さいと効率が落ちる"]
      ],["left","right","left"])+
      "<br>"+(hs/lam0>0.05
        ? '<span class="warn">基板が厚い（h/λ0 = '+f(hs/lam0,3)+'）。帯域は稼げるが、給電プローブのインダクタンスと表面波が無視できなくなる。この経験式の精度も落ちる。</span>'
        : "h/λ0 = "+f(hs/lam0,3)+" — 経験式が素直に効く範囲である。")+
      "<br><b>ここで出た寸法は「解析の出発点」であって答えではない。</b>"+
      "実際の値は電磁界解析で L を数 % 掃引して f0 を合わせ込む。式の役割は、"+
      "闇雲な掃引ではなく<b>正解の近くから始める</b>ことにある。";
    }
    [sF,sE,sH,sD].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);draw();
  };

  /* ============ 18. tdr — TDR で不整合の場所を見つける ============ */
  REG.tdr=function(el){
    head(el,"DEMO","TDR — 反射波形から不連続の位置とインピーダンスを読む");
    var cv=screen(el,320), cc=cctx(cv);
    var row=ctrls(el);
    var sP=slider(row,"不整合区間の開始位置 [mm]",5,80,30,1);
    var sW=slider(row,"不整合区間の長さ [mm]",2,40,12,1);
    var sZ=slider(row,"不整合区間のインピーダンス [Ω]",15,110,80,1);
    var sR=slider(row,"立ち上がり時間 [ps]",5,150,25,1);
    var sT=select(row,"終端",["50 Ω で整合","開放（オープン）","短絡（ショート）"]);
    var out=readout(el);
    var Z0=50, EREFF=3.0, LTOT=0.100; // 100 mm
    function draw(){
      var p0=+sP.input.value/1000, wl=+sW.input.value/1000, Zm=+sZ.input.value,
          tr=+sR.input.value*1e-12, term=+sT.value;
      sP.val.textContent=f(p0*1000,0)+" mm"; sW.val.textContent=f(wl*1000,0)+" mm";
      sZ.val.textContent=f(Zm,0)+" Ω"; sR.val.textContent=f(tr*1e12,0)+" ps";
      var vp=C0/Math.sqrt(EREFF);
      var N=200, dx=LTOT/N, dt=dx/vp;
      var Z=new Float64Array(N);
      for(var k=0;k<N;k++){
        var x=(k+0.5)*dx;
        Z[k]=(x>=p0&&x<p0+wl)?Zm:Z0;
      }
      var rL=(term===0)?0:(term===1?1:-1);
      var fw=new Float64Array(N), bw=new Float64Array(N),
          nf=new Float64Array(N), nb=new Float64Array(N);
      var Nt=Math.round(2.6*N), trace=new Float64Array(Nt);
      var nr=Math.max(1,Math.round(tr/dt));
      for(var n=0;n<Nt;n++){
        // 入力端で観測される全電圧 = 入射（1 V の階段）＋戻ってきた波
        var s=n<nr?0.5*(1-Math.cos(Math.PI*n/nr)):1;
        trace[n]=s+bw[0];
        nf[0]=s;
        for(var j=0;j<N-1;j++){
          var r=(Z[j+1]-Z[j])/(Z[j+1]+Z[j]);
          nb[j]=r*fw[j]+(1-r)*bw[j+1];
          nf[j+1]=(1+r)*fw[j]-r*bw[j+1];
        }
        nb[N-1]=rL*fw[N-1];
        var t1=fw;fw=nf;nf=t1; var t2=bw;bw=nb;nb=t2;
      }
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var x0=58,x1=w-56;
      function XD(mm){return x0+(x1-x0)*(mm/(LTOT*1000));} // 見かけ距離 [mm] → 画面
      // 上段: 線路の断面図
      var ly=54, lh=26;
      lab(ctx,"伝送線路（上から見た構成）",x0,26,C("--muted"),"left",11);
      ctx.fillStyle=C("--signal");ctx.globalAlpha=.10;ctx.fillRect(x0,ly,x1-x0,lh);ctx.globalAlpha=1;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.strokeRect(x0,ly,x1-x0,lh);
      var ax=XD(p0*1000), bx=XD((p0+wl)*1000);
      ctx.fillStyle=Zm>Z0?C("--alias"):C("--blue");ctx.globalAlpha=.28;
      ctx.fillRect(ax,ly,bx-ax,lh);ctx.globalAlpha=1;
      ctx.strokeStyle=Zm>Z0?C("--alias"):C("--blue");ctx.lineWidth=1.6;ctx.strokeRect(ax,ly,bx-ax,lh);
      lab(ctx,f(Zm,0)+" Ω",(ax+bx)/2,ly-6,Zm>Z0?C("--alias"):C("--blue"),"center",10.5);
      lab(ctx,"50 Ω",x0+8,ly+lh/2+4,C("--muted"),"left",10);
      lab(ctx,"TDR",x0-8,ly+lh/2+4,C("--signal"),"right",10.5);
      lab(ctx,term===0?"50 Ω":(term===1?"開放":"短絡"),x1+6,ly+lh/2+4,C("--muted"),"left",10);
      // 下段: TDR 波形
      var gy0=118, gy1=h-40;
      var vlo=term===2?-0.15:0.35, vhi=term===1?2.15:1.75;
      function YV(v){return gy1-(v-vlo)/(vhi-vlo)*(gy1-gy0);}
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      [0,0.5,1,1.5,2].forEach(function(v){
        if(v<vlo||v>vhi)return;
        ctx.beginPath();ctx.moveTo(x0,YV(v));ctx.lineTo(x1,YV(v));ctx.stroke();
        lab(ctx,f(v,1)+" V",x0-6,YV(v)+4,C("--faint"),"right",9.5);
        var za=Z0*(1+(v-1))/(1-(v-1));
        if(v!==1&&Math.abs(v-1)<0.99)lab(ctx,f(za,0)+" Ω",x1+6,YV(v)+4,C("--faint"),"left",9.5);
      });
      lab(ctx,"50 Ω",x1+6,YV(1)+4,C("--muted"),"left",9.5);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x0,gy1);ctx.lineTo(x1,gy1);ctx.stroke();
      // 不整合区間の位置を下段にも投影
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1;ctx.setLineDash([3,4]);
      ctx.beginPath();ctx.moveTo(ax,ly+lh);ctx.lineTo(ax,gy1);
      ctx.moveTo(bx,ly+lh);ctx.lineTo(bx,gy1);ctx.stroke();ctx.setLineDash([]);
      // 波形（横軸 = 見かけ距離 = vp·t/2）
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.2;ctx.beginPath();
      for(var n2=0;n2<Nt;n2++){
        var dmm=(vp*(n2*dt)/2)*1000;
        if(dmm>LTOT*1000)break;
        ctx.lineTo(XD(dmm),YV(trace[n2]));
      }
      ctx.stroke();
      [0,25,50,75,100].forEach(function(mm){
        lab(ctx,mm+" mm",XD(mm),gy1+18,C("--faint"),"center",9.5);});
      lab(ctx,"見かけ距離（往復時間 × vp / 2）",x1,gy1+32,C("--muted"),"right",10);
      // 段の向きの注記
      var gam=(Zm-Z0)/(Zm+Z0);
      lab(ctx,gam>0?"上向きの段 = インピーダンスが高い（細い線・容量不足）":
                    "下向きの段 = インピーダンスが低い（太い線・容量過多）",
          x0,gy0-10,gam>0?C("--alias"):C("--blue"),"left",10.5);
      var res=vp*tr/2;
      out.innerHTML="不整合区間の反射係数 Γ = (Z−Z0)/(Z+Z0) = <b>"+f(gam,3)+"</b> → TDR の段の高さ ≈ "+
        f(1+gam,3)+" V"+
        "<br>位置分解能 Δd ≈ vp·tr/2 = <b>"+f(res*1000,2)+" mm</b>"+
        (res>wl?' <span class="warn">← 区間長 '+f(wl*1000,0)+' mm より粗い。段が丸まって本来の高さに達せず、Z を読み違える</span>'
               :' <b class="ok">← 区間長より細かい。段の高さがそのまま Z を表す</b>')+
        "<br>基板の実効比誘電率 "+f(EREFF,1)+" → 伝搬速度 vp = <b>"+eng(vp,"m/s",2)+"</b>"+
        "（1 mm 進むのに "+f(1/vp*1e12/1000,1)+" ps、往復で "+f(2/vp*1e12/1000,1)+" ps）"+
        "<br>"+(term===0?"終端が整合しているので、右端からの反射はない。波形の乱れは途中の不連続だけが作っている。"
              :term===1?"開放終端では Γ=+1。右端で全反射して電圧が 2 V に跳ね上がる。":
                        "短絡終端では Γ=−1。右端で全反射して電圧が 0 V まで落ちる。")+
        "<br><b>TDR は「周波数特性を時間軸に並べ直したもの」である。</b>"+
        "S パラメータを逆フーリエ変換すれば同じ波形が得られる（16 章）。"+
        "周波数領域では「どこかが悪い」しか分からないのに対し、時間領域は<b>位置を教えてくれる</b>。";
    }
    [sP,sW,sZ,sR].forEach(function(s){s.input.addEventListener("input",draw);});
    sT.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 19. shield — シールド効果 ============ */
  REG.shield=function(el){
    head(el,"DEMO","シールド効果 — 効かなくするのは厚さではなく穴");
    var cv=screen(el,290), cc=cctx(cv);
    var row=ctrls(el);
    var MAT=[["銅",5.8e7,1],["アルミ",3.5e7,1],["鋼（磁性）",1.0e7,200],["導電塗料",1.0e5,1],["炭素入り樹脂",1.0e2,1]];
    var sM=select(row,"シールド材",MAT.map(function(m){return m[0];}));
    var sT=slider(row,"厚さ [µm]",1,3000,100,1);
    var sL=slider(row,"最長の開口寸法 [mm]",0.5,300,60,0.5);
    var sN=checkbox(row,"開口を無視する（理想の密閉箱）",false);
    var out=readout(el);
    function calc(fq,sig,mur,t,slot,ideal){
      var del=1/Math.sqrt(Math.PI*fq*MU0*mur*sig);
      var A=8.686*t/del;
      var R=168-10*Math.log10(fq*mur/(sig/5.8e7));
      var u=t/del, B=20*Math.log10(Math.max(1-Math.exp(-2*u),1e-6));
      var wall=Math.max(R+A+B,0);
      var lam=C0/fq;
      var sl=ideal?1e9:Math.max(20*Math.log10(lam/(2*slot)),0);
      return {del:del,A:A,R:R,B:B,wall:wall,slot:sl,tot:Math.min(wall,sl)};
    }
    function draw(){
      var m=MAT[+sM.value], sig=m[1], mur=m[2];
      var t=+sT.input.value*1e-6, slot=+sL.input.value/1000, ideal=sN.checked;
      sT.val.textContent=(t*1e6>=1000?f(t*1e3,2)+" mm":f(t*1e6,0)+" µm");
      sL.val.textContent=f(slot*1000,1)+" mm";
      var f1=1e7, f2=1e10;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
      ctx.clearRect(0,0,w,h);
      var P={l:56,r:18,t:52,b:36}, ymax=160;
      function X(fq){return P.l+(Math.log10(fq)-Math.log10(f1))/(Math.log10(f2)-Math.log10(f1))*(w-P.l-P.r);}
      function Y(v){return h-P.b-Math.min(v,ymax)/ymax*(h-P.t-P.b);}
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      for(var g=0;g<=4;g++){var v=g*40;
        ctx.beginPath();ctx.moveTo(P.l,Y(v));ctx.lineTo(w-P.r,Y(v));ctx.stroke();
        lab(ctx,v+" dB",P.l-6,Y(v)+4,C("--faint"),"right",9.5);}
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(P.l,h-P.b);ctx.lineTo(w-P.r,h-P.b);ctx.stroke();
      [1e7,1e8,1e9,1e10].forEach(function(fq){
        lab(ctx,eng(fq,"Hz",0),X(fq),h-P.b+18,C("--faint"),"center",9.5);});
      lab(ctx,"周波数",w-P.r,h-P.b+32,C("--muted"),"right",10);
      lab(ctx,"シールド効果 SE [dB]",8,16,C("--muted"),"left",10);
      var M=240;
      function curve(key,col,lw,dash){
        ctx.strokeStyle=col;ctx.lineWidth=lw;if(dash)ctx.setLineDash(dash);
        ctx.beginPath();
        for(var i=0;i<=M;i++){
          var fq=Math.pow(10,Math.log10(f1)+(Math.log10(f2)-Math.log10(f1))*i/M);
          ctx.lineTo(X(fq),Y(calc(fq,sig,mur,t,slot,ideal)[key]));
        }
        ctx.stroke();ctx.setLineDash([]);
      }
      curve("wall",C("--blue"),1.6,[5,4]);
      if(!ideal)curve("slot",C("--alias"),1.6,[5,4]);
      curve("tot",C("--signal"),2.4,null);
      // 凡例（プロット枠の外・上端に置く）
      var ly=36, lx=P.l+4;
      [["材料そのもの（R+A+B）",C("--blue")],["開口による上限",C("--alias")],["実際の SE（小さい方）",C("--signal")]]
        .forEach(function(p,i){
          if(i===1&&ideal)return;
          ctx.strokeStyle=p[1];ctx.lineWidth=2.2;ctx.beginPath();
          ctx.moveTo(lx,ly-4);ctx.lineTo(lx+18,ly-4);ctx.stroke();
          lab(ctx,p[0],lx+24,ly,C("--muted"),"left",10);
          lx+=ctx.measureText(p[0]).width+62;
        });
      // λ/2 共振点
      var fres=C0/(2*slot);
      if(!ideal&&fres>f1&&fres<f2){
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;ctx.setLineDash([3,3]);
        ctx.beginPath();ctx.moveTo(X(fres),P.t);ctx.lineTo(X(fres),h-P.b);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"開口が λ/2（SE = 0）",X(fres)-6,Y(70),C("--alias"),"right",10);
      }
      var g1=calc(1e9,sig,mur,t,slot,ideal);
      out.innerHTML=tbl(["1 GHz での量","値","意味"],[
        ["表皮深さ δ", eng(g1.del,"m",2), "この深さで振幅が 1/e になる"],
        ["厚さ / δ", f(t/g1.del,2), "3 以上あれば吸収だけで 26 dB 以上"],
        ["吸収損 A", f(g1.A,1)+" dB", "8.69·t/δ。高周波で支配的"],
        ["反射損 R", f(g1.R,1)+" dB", "表面のインピーダンス不整合。低周波で支配的"],
        ["多重反射補正 B", f(g1.B,1)+" dB", "薄いと負に効く（A が小さいとき）"],
        ["材料の SE", (g1.wall>200?"&gt; 200":f(g1.wall,1))+" dB", "R+A+B。100 dB を超えた先の数字に実用上の意味はない"],
        [ideal?"開口":"開口の上限 SE", ideal?"（無視）":f(g1.slot,1)+" dB", "20log(λ/2ℓ)"],
        ["<b>実際の SE</b>", "<b>"+f(g1.tot,1)+" dB</b>", "小さい方が全体を決める"]
      ],["left","right","left"])+
      "<br>"+(ideal
        ? "開口を無視すれば "+(g1.wall>200?"200 dB 超":f(g1.wall,0)+" dB")+"——<b>紙の上ではどんな材料でも十分に見える</b>。しかしこれは実機では絶対に達成されない。"
        : (g1.slot<g1.wall
          ? '<span class="warn">開口が全体を支配している（材料 '+(g1.wall>200?"200 dB 超":f(g1.wall,0)+" dB")+' に対して開口 '+f(g1.slot,0)+' dB）。厚さを増やしても何も改善しない。</span>'
          : "この周波数では材料側が支配的。厚さや材質の改善が効く。"))+
      "<br>開口 "+f(slot*1000,1)+" mm は <b>"+eng(fres,"Hz",2)+"</b> で λ/2 になり、そこで遮蔽が完全に失われる。"+
      "<br><b>効くのは開口の面積ではなく「最も長い寸法」である。</b>"+
      "1 mm×100 mm のスリットと 10 mm×10 mm の穴は面積が同じでも、前者は 100 mm のスロットアンテナとして働く。"+
      "対策は「長いスリットを短く分割する」——ガスケット、ネジ間隔の短縮、ハニカム通気口。";
    }
    [sT,sL].forEach(function(s){s.input.addEventListener("input",draw);});
    [sM].forEach(function(s){s.addEventListener("change",draw);});
    sN.addEventListener("change",draw);
    reg(cv,draw);draw();
  };

  /* ============ 20. checklist — 設計レビュー用チェックリスト ============ */
  REG.checklist=function(el){
    head(el,"DEMO","解析を提出する前の点検");
    var DATA=[
      ["モデル",[
        "材料定数は実測値かデータシート値か（公称値の丸写しでないか）",
        "誘電正接 tanδ と導電率を入れたか（PEC のまま放置していないか）",
        "表面粗さを考慮したか（高速・高周波の場合）",
        "寸法は製造後の実寸か（設計値のままでないか）",
        "ケーブル・コネクタ・筐体・グラウンドを含めたか"]],
      ["メッシュ（10 章）",[
        "最小構造に 3 セル以上あるか",
        "<b>材料中の</b>波長で 10〜20 セル/λ を確保したか",
        "エッジ・給電点を局所細分化したか",
        "メッシュを目で見たか（自動生成を信用しきっていないか）"]],
      ["境界（11 章）",[
        "PML までの距離が最低周波数の λ/4 以上あるか",
        "対称面は構造と励振の<b>両方</b>が対称か",
        "周期境界の適用条件（無限周期・入射角）を満たすか"]],
      ["ポート（12 章）",[
        "種類（集中ポート／導波ポート）が構造に対して適切か",
        "導波ポートのサイズを変えても結果が動かないか",
        "基準面（デエンベッド位置）が比較対象と一致しているか",
        "励振波形の帯域が解析帯域をカバーしているか"]],
      ["収束（13 章）",[
        "メッシュ収束を確認したか（変化 1 % 以下）",
        "時間領域なら残留エネルギーが −40 dB まで落ちたか",
        "パッシブ性・相反性を満たすか（|S11|²+|S21|² ≤ 1）"]],
      ["結果の解釈",[
        "解析帯域の上限を超えた領域を読んでいないか（16 章）",
        "利得と指向性を取り違えていないか（15 章）",
        "S パラメータの参照インピーダンスは意図通りか（14 章）",
        "モデルの限界（何を含めていないか）を文書に書いたか（20 章）"]]
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var bAll=button(bar,"すべてチェック");
    var bNone=button(bar,"すべて外す");
    var pn=panel(el);
    var out=readout(el);
    var state=[];
    var html="";
    DATA.forEach(function(sec,si){
      html+='<div style="margin:'+(si?".85rem":"0")+' 0 .3rem;color:var(--signal);font-weight:600">'+sec[0]+'</div>';
      sec[1].forEach(function(it,ii){
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
        (n===N?' <b class="ok">— 提出してよい</b>'
              :'<br>残り '+(N-n)+' 項目。<b>「たぶん大丈夫」で飛ばした項目こそが、半年後に結果をひっくり返す。</b>');
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
