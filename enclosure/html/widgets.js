/* 筐体設計 — 章内インタラクティブ部品 */
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


  /* ===== WIDGETS ===== */

  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */
  /* ============ 01. cost — 作る数と 1 個あたりの費用 ============ */
  REG.cost=function(el){
    head(el,"01","作る数と 1 個あたりの費用");
    var M=[["3D プリント",0,5000,"--signal"],["注型",1e5,2000,"--alias"],
           ["射出（アルミ簡易型）",1e6,150,"--blue"],["射出（鋼の量産型）",3e6,80,"--muted"]];
    var row=ctrls(el), sN=slider(row,"作る数 N（対数）",0,6,2,0.01);
    var cv=screen(el,260), cc=cctx(cv), ro=readout(el);
    function N(){return Math.round(Math.pow(10,+sN.input.value));}
    function draw(){
      var n=N(); sN.val.textContent=n.toLocaleString()+" 個";
      var c=chart(cc,0,6,1,7,{l:52,b:30});
      grid(c,6); axis(c);
      var NM=["1","10","100","1000","1万","10万","100万","1000万"];
      for(var e=0;e<=6;e++)lab(c.ctx,NM[e]+(e==6?" 個":""),c.X(e),c.h-12,C("--muted"),e==6?"right":"center",10);
      for(var k=1;k<=7;k++)lab(c.ctx,NM[k],c.p.l-6,c.Y(k)+4,C("--muted"),"right",10);
      lab(c.ctx,"円/個",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      M.forEach(function(m){
        var pts=[];for(var x=0;x<=6;x+=0.05){var u=m[1]/Math.pow(10,x)+m[2];pts.push([x,Math.log10(u)]);}
        line(c,pts,C(m[3]),2.2);
      });
      var lx=Math.log10(n);
      c.ctx.strokeStyle=C("--ink");c.ctx.setLineDash([4,4]);c.ctx.beginPath();
      c.ctx.moveTo(c.X(lx),c.p.t);c.ctx.lineTo(c.X(lx),c.h-c.p.b);c.ctx.stroke();c.ctx.setLineDash([]);
      var best=0,rows=M.map(function(m,i){var u=m[1]/n+m[2];if(u<M[best][1]/n+M[best][2])best=i;return u;});
      M.forEach(function(m,i){dot(c,lx,Math.log10(rows[i]),4,C(m[3]));});
      ro.innerHTML=tbl(["製法","F/N + v [円/個]","総費用 [円]"],M.map(function(m,i){
        var b=i===best?"<b>":"",be=i===best?" ← 最安</b>":"";
        return ['<span style="color:'+C(m[3])+'">■</span> '+b+m[0]+(i===best?"</b>":""),
          b+Math.round(rows[i]).toLocaleString()+be,Math.round(m[1]+m[2]*n).toLocaleString()];}),
        ["left","right","right"]);
    }
    sN.input.addEventListener("input",draw); reg(cv,draw); draw();
  };

  /* ============ 02. cantilever — 片持ちはりのたわみと応力 ============ */
  REG.cantilever=function(el){
    head(el,"02","片持ちはりのたわみと根元の応力");
    // [名前, E [MPa], 降伏応力（代表値）[MPa]]
    var MAT=[["ABS",2300,40],["PC",2300,60],["PC/ABS",2300,50],["PP",1500,30],["POM",2800,60],
             ["PA66-GF30（乾燥）",9000,180],["アルミ A5052",70000,200],["鋼板 SPCC",205000,200],["SUS304",193000,250]];
    var row=ctrls(el);
    var sm=select(row,"材料（E・降伏応力は代表値）",MAT.map(function(m){return m[0]+"  E="+m[1].toLocaleString()+" MPa";}));
    var sb=slider(row,"幅 b",2,40,10,1), sh=slider(row,"厚さ h",0.5,6,2,0.1);
    var row2=ctrls(el);
    var sL=slider(row2,"長さ L",5,100,30,1), sP=slider(row2,"荷重 P",0.5,50,5,0.5);
    var cv=screen(el,210), cc=cctx(cv);
    var cv2=screen(el,190), cc2=cctx(cv2);
    var ro=readout(el);
    function V(){var m=MAT[+sm.value];return {E:m[1],sy:m[2],nm:m[0],b:+sb.input.value,h:+sh.input.value,L:+sL.input.value,P:+sP.input.value};}
    function calc(v,h){var I=v.b*h*h*h/12,M=v.P*v.L,s=M*(h/2)/I,d=v.P*Math.pow(v.L,3)/(3*v.E*I);
      return {I:I,M:M,s:s,d:d,k:v.P/d,th:v.P*v.L*v.L/(2*v.E*I),eps:s/v.E};}
    function draw(){
      var v=V(), r=calc(v,v.h);
      sb.val.textContent=v.b+" mm"; sh.val.textContent=f(v.h,1)+" mm"; sL.val.textContent=v.L+" mm"; sP.val.textContent=f(v.P,1)+" N";
      var over=r.s>v.sy;
      // ---- はりの図 ----
      var d=cc.fit(),ctx=cc.ctx,w=d.w,H=d.h; ctx.clearRect(0,0,w,H);
      var x0=60,y0=58,avail=w-x0-120, sc=avail/v.L;           // 長さ方向 px/mm
      var hpx=Math.max(2,v.h*sc), dmax=H-y0-40, dpx=r.d*sc, fac=1;
      if(dpx>dmax){fac=dmax/dpx;dpx=dmax;}
      if(hpx>40)hpx=40;
      // 壁
      ctx.strokeStyle=C("--ink");ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0-36);ctx.lineTo(x0,y0+60);ctx.stroke();
      ctx.strokeStyle=C("--muted");ctx.lineWidth=1;
      for(var yy=y0-36;yy<y0+60;yy+=9){ctx.beginPath();ctx.moveTo(x0,yy+7);ctx.lineTo(x0-7,yy);ctx.stroke();}
      // 変形前
      ctx.setLineDash([5,4]);ctx.strokeStyle=C("--muted");ctx.strokeRect(x0,y0-hpx/2,v.L*sc,hpx);ctx.setLineDash([]);
      // 変形後
      var col=over?C("--alias"):C("--signal");
      ctx.beginPath();
      for(var i=0;i<=60;i++){var s=i/60,ww=dpx*(3*s*s-s*s*s)/2;var X=x0+s*v.L*sc;i?ctx.lineTo(X,y0-hpx/2+ww):ctx.moveTo(X,y0-hpx/2+ww);}
      for(i=60;i>=0;i--){s=i/60;ww=dpx*(3*s*s-s*s*s)/2;X=x0+s*v.L*sc;ctx.lineTo(X,y0+hpx/2+ww);}
      ctx.closePath();ctx.globalAlpha=.25;ctx.fillStyle=col;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.stroke();
      // 荷重
      var tx=x0+v.L*sc, ty=y0-hpx/2+dpx;
      ctx.strokeStyle=C("--alias");ctx.fillStyle=C("--alias");ctx.lineWidth=2.2;
      ctx.beginPath();ctx.moveTo(tx,ty-40);ctx.lineTo(tx,ty-6);ctx.stroke();
      ctx.beginPath();ctx.moveTo(tx,ty-1);ctx.lineTo(tx-5,ty-10);ctx.lineTo(tx+5,ty-10);ctx.closePath();ctx.fill();
      lab(ctx,"P = "+f(v.P,1)+" N",tx-8,ty-30,C("--alias"),"right",11);
      // δ 寸法
      var dx=tx+16;
      ctx.strokeStyle=C("--ink");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(dx,y0);ctx.lineTo(dx,y0+dpx);ctx.stroke();
      ctx.beginPath();ctx.moveTo(dx-4,y0);ctx.lineTo(dx+4,y0);ctx.moveTo(dx-4,y0+dpx);ctx.lineTo(dx+4,y0+dpx);ctx.stroke();
      lab(ctx,"δ = "+f(r.d,r.d<1?3:2)+" mm",dx+8,y0+dpx/2+4,C("--ink"),"left",11);
      lab(ctx,"L = "+v.L+" mm",x0+v.L*sc/2,y0-hpx/2-10,C("--muted"),"center",10);
      lab(ctx,"根元の曲げ応力 "+f(r.s,1)+" MPa"+(over?"  降伏を超える":""),x0+6,H-12,col,"left",11);
      lab(ctx,fac<1?"たわみの表示は 1/"+f(1/fac,1)+" に縮小":"たわみは実寸の比率で表示",w-8,H-12,C("--faint"),"right",10);
      // ---- 厚さ-剛性のグラフ ----
      var kmax=calc(v,6).k, st=Math.pow(10,Math.floor(Math.log10(kmax/4))), nst=[1,1.25,1.5,2,2.5,3,4,5,7.5,10].map(function(m){return m*st;}).filter(function(z){return z*4>=kmax;})[0];
      var c=chart(cc2,0.5,6,0,nst*4,{l:56,b:30,t:26});
      grid(c,4);axis(c);
      for(var t=1;t<=6;t++)lab(c.ctx,t+(t==6?" mm":""),c.X(t),c.h-12,C("--muted"),t==6?"right":"center",10);
      for(var q=0;q<=4;q++){var kv=nst*q;lab(c.ctx,kv>=1000?Math.round(kv).toLocaleString():(+kv.toPrecision(3)).toString(),c.p.l-6,c.Y(kv)+4,C("--muted"),"right",10);}
      lab(c.ctx,"剛性 k [N/mm]（横軸: 厚さ h）",c.p.l+6,14,C("--muted"),"left",10);
      var pts=[];for(var hh=0.5;hh<=6.001;hh+=0.05)pts.push([hh,calc(v,hh).k]);
      line(c,pts,C("--signal"),2.2);
      dot(c,v.h,r.k,5,C("--signal"));
      if(2*v.h<=6){var r2=calc(v,2*v.h);dot(c,2*v.h,r2.k,5,C("--alias"));
        lab(c.ctx,"厚さ 2 倍 → "+f(r2.k/r.k,0)+" 倍",c.X(2*v.h)-8,c.Y(r2.k)-4,C("--alias"),"right",10.5);}
      // ---- 数値 ----
      var n=v.sy/r.s;
      ro.innerHTML=tbl(["量","式","値"],[
        ["断面二次モーメント I","bh³/12",f(r.I,r.I<10?3:1)+" mm⁴"],
        ["根元の曲げモーメント M","PL",f(r.M,1)+" N·mm"],
        ["根元の曲げ応力 σ","Mc/I = 6PL/(bh²)","<b>"+f(r.s,1)+" MPa</b>"],
        ["根元表面のひずみ ε","σ/E",f(r.eps*100,3)+" %"],
        ["先端のたわみ δ","PL³/(3EI)","<b>"+f(r.d,3)+" mm</b>"],
        ["剛性 k","P/δ = Ebh³/(4L³)",f(r.k,r.k<10?3:1)+" N/mm"],
        ["安全率 n（降伏応力 "+v.sy+" MPa に対して）","σy/σ",(n<1?'<span style="color:var(--alias)"><b>'+f(n,2)+"（降伏を超える）</b></span>":f(n,2))],
        ["先端の傾き","PL²/(2EI)",f(r.th,3)+" rad"+(r.th>0.15?' <span style="color:var(--alias)">（小たわみの仮定から外れる）</span>':"")]
      ],["left","left","right"]);
    }
    sm.addEventListener("change",draw);
    [sb,sh,sL,sP].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);reg(cv2,draw);draw();
  };

  /* ============ 03. material — 同じ曲げ剛性の板厚と質量 ============ */
  REG.material=function(el){
    head(el,"03","同じ曲げ剛性にする板厚と質量の比");
    // [名前, E [MPa], 密度 [g/cm3], 降伏応力（代表値）[MPa], 種別 0樹脂 1強化 2金属]
    var M=[["ABS",2300,1.05,40,0],["PC",2300,1.20,60,0],["PC/ABS",2300,1.15,50,0],["PP",1500,0.91,30,0],
           ["PA66（乾燥）",3000,1.14,80,0],["POM",2800,1.41,60,0],["PA66-GF30（乾燥）",9000,1.37,180,1],
           ["A5052",70000,2.68,200,2],["ADC12",71000,2.70,150,2],["SPCC",205000,7.85,200,2],["SUS304",193000,7.93,250,2]];
    var row=ctrls(el);
    var sb=select(row,"基準の材料",M.map(function(m){return m[0];}));
    var st=slider(row,"基準の板厚 t₀",0.5,5,2,0.1);
    var cv=screen(el,M.length*28+44), cc=cctx(cv), ro=readout(el);
    var KC=["--signal","--blue","--ink"];
    function draw(){
      var b=M[+sb.value], t0=+st.input.value; st.val.textContent=f(t0,1)+" mm";
      var R=M.map(function(m){var q=Math.pow(b[1]/m[1],1/3),t=t0*q,mr=(m[2]/b[2])*q,sr=Math.pow(t0/t,2);
        return {m:m,t:t,mr:mr,sr:sr,mg:(m[3]/b[3])/sr};});
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var nameW=Math.min(150,w*0.24), half=(w-nameW-20)/2, x1=nameW+8, x2=x1+half+12;
      var tmax=Math.max.apply(null,R.map(function(r){return r.t;})), mmax=Math.max.apply(null,R.map(function(r){return r.mr;}));
      tmax=Math.ceil(tmax*2)/2; mmax=Math.max(1.5,Math.ceil(mmax*2)/2);
      var bw1=half-60, bw2=half-60;
      lab(ctx,"同じ剛性の板厚 [mm]",x1,16,C("--muted"),"left",10.5);
      lab(ctx,"質量の比（基準 = 1）",x2,16,C("--muted"),"left",10.5);
      // 基準線 1.0
      var xr=x2+bw2*(1/mmax);
      ctx.strokeStyle=C("--ink");ctx.setLineDash([3,3]);ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(xr,24);ctx.lineTo(xr,h-6);ctx.stroke();ctx.setLineDash([]);
      R.forEach(function(r,i){
        var y=34+i*28, isb=r.m===b, col=C(KC[r.m[4]]);
        lab(ctx,r.m[0],nameW,y+9,isb?C("--alias"):C("--ink"),"right",11);
        ctx.fillStyle=col;ctx.globalAlpha=isb?1:.8;
        rrect(ctx,x1,y,Math.max(1,bw1*r.t/tmax),14,3);ctx.fill();
        var mc=r.mr<0.95?C("--signal"):(r.mr>1.05?C("--alias"):C("--muted"));
        ctx.fillStyle=mc;rrect(ctx,x2,y,Math.max(1,bw2*r.mr/mmax),14,3);ctx.fill();ctx.globalAlpha=1;
        lab(ctx,f(r.t,2),x1+bw1*r.t/tmax+5,y+11,C("--ink"),"left",10.5);
        lab(ctx,f(r.mr,2)+"×",x2+bw2*r.mr/mmax+5,y+11,mc,"left",10.5);
      });
      ro.innerHTML=tbl(["材料","E [MPa]","ρ [g/cm³]","板厚 [mm]","質量の比","応力の比","強さの余裕の比"],R.map(function(r){
        var isb=r.m===b, nm=(isb?"<b>":"")+r.m[0]+(isb?"（基準）</b>":"");
        var mg=r.mg<0.995?'<span style="color:var(--alias)">'+f(r.mg,2)+"</span>":f(r.mg,2);
        return [nm,r.m[1].toLocaleString(),f(r.m[2],2),f(r.t,2),f(r.mr,2),f(r.sr,2),mg];}),
        ["left","right","right","right","right","right","right"])+
        '<div style="color:var(--muted);margin-top:.4rem">板厚 = t₀(E₀/E)^(1/3)、質量の比 = (ρ/ρ₀)(E₀/E)^(1/3)、応力の比 = (t₀/t)²（同じ荷重のとき）、'+
        '強さの余裕の比 = (σy/σy₀) ÷ 応力の比。値はすべて代表値。</div>';
    }
    sb.addEventListener("change",draw); st.input.addEventListener("input",draw);
    reg(cv,draw); draw();
  };

  /* ============ 04. cooling — 肉厚と冷却時間 ============ */
  REG.cooling=function(el){
    head(el,"04","肉厚と冷却時間");
    // [名前, a mm^2/s, Tm, Tw, Te]（代表値）
    var M=[["ABS",0.10,230,60,90],["PC",0.11,300,90,130],["PP",0.08,230,40,90],["PA66",0.10,285,80,150]];
    var row=ctrls(el), sel=select(row,"材料（物性は代表値）",M.map(function(m){return m[0];}));
    var sS=slider(row,"肉厚 s",0.5,5,2,0.1), sW=slider(row,"金型温度 T_w",20,120,60,1);
    var row2=ctrls(el), sO=slider(row2,"冷却以外の時間",3,30,10,0.5);
    var cv=screen(el,260), cc=cctx(cv), ro=readout(el);
    function tc(s,a,Tm,Tw,Te){var r=4/Math.PI*(Tm-Tw)/(Te-Tw);return r>1?s*s/(Math.PI*Math.PI*a)*Math.log(r):0;}
    function setMat(){var m=M[+sel.value];sW.input.value=m[3];}
    function draw(){
      var m=M[+sel.value],s=+sS.input.value,Tw=+sW.input.value,ot=+sO.input.value;
      if(Tw>m[4]-5){Tw=m[4]-5;sW.input.value=Tw;}
      sS.val.textContent=f(s,1)+" mm"; sW.val.textContent=Tw+" °C"; sO.val.textContent=f(ot,1)+" s";
      var c=chart(cc,0,5,0,60,{l:46,b:32,r:16});
      grid(c,6); axis(c);
      for(var k=0;k<=5;k++)lab(c.ctx,k+(k==5?" mm":""),c.X(k),c.h-14,C("--muted"),k==5?"right":"center",10);
      for(var j=0;j<=6;j++)lab(c.ctx,String(j*10),c.p.l-6,c.Y(j*10)+4,C("--muted"),"right",10);
      lab(c.ctx,"t_c [s]",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      // 他の材料（標準の金型温度）を薄く
      M.forEach(function(q,i){if(i==+sel.value)return;var pts=[];
        for(var x=0;x<=5.001;x+=0.05)pts.push([x,Math.min(60,tc(x,q[1],q[2],q[3],q[4]))]);
        line(c,pts,C("--faint"),1.2,[4,4]);
        var xe=5,ye=tc(5,q[1],q[2],q[3],q[4]);if(ye>58){xe=Math.sqrt(58/tc(1,q[1],q[2],q[3],q[4]));ye=58;}
        lab(c.ctx,q[0],c.X(xe)-4,c.Y(ye)-4,C("--faint"),"right",10);});
      var pts=[];for(var x=0;x<=5.001;x+=0.05)pts.push([x,Math.min(60,tc(x,m[1],m[2],Tw,m[4]))]);
      line(c,pts,C("--signal"),2.4);
      var t=tc(s,m[1],m[2],Tw,m[4]);
      c.ctx.strokeStyle=C("--ink");c.ctx.setLineDash([4,4]);c.ctx.beginPath();
      c.ctx.moveTo(c.X(s),c.p.t);c.ctx.lineTo(c.X(s),c.h-c.p.b);c.ctx.stroke();c.ctx.setLineDash([]);
      if(t<=60)dot(c,s,t,5,C("--signal"));
      lab(c.ctx,m[0]+"  t_c = "+f(t,1)+" s",c.X(s)+(s>3.2?-8:8),c.p.t+14,C("--ink"),s>3.2?"right":"left",11);
      var tau=s*s/(Math.PI*Math.PI*m[1]),r=4/Math.PI*(m[2]-Tw)/(m[4]-Tw);
      var t2=tc(2,m[1],m[2],Tw,m[4]),cyc=t+ot;
      ro.innerHTML=tbl(["量","値"],[
        ["a / T_m / T_e（代表値）",f(m[1],2)+" mm²/s / "+m[2]+" °C / "+m[4]+" °C"],
        ["時定数 s²/(π²a)",f(tau,2)+" s"],
        ["対数の中身 → ln",f(r,2)+" → ln = "+f(Math.log(r),3)],
        ["<b>冷却時間 t_c</b>","<b>"+f(t,1)+" s</b>（2 mm の "+f(t/t2,2)+" 倍）"],
        ["1 ショットの時間（t_c + 冷却以外）",f(cyc,1)+" s"],
        ["1 時間あたりのショット数",Math.floor(3600/cyc).toLocaleString()+" ショット"]
      ],["left","right"]);
    }
    sel.addEventListener("change",function(){setMat();draw();});
    [sS,sW,sO].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 05. rib — リブの寸法と断面二次モーメント ============ */
  REG.rib=function(el){
    head(el,"05","リブの寸法と断面二次モーメント（幅 60 mm の帯）");
    var B=60;
    var row=ctrls(el), sT=slider(row,"肉厚 t",1,4,2,0.1), sH=slider(row,"リブ高さ h",0,15,6,0.5);
    var row2=ctrls(el), sW=slider(row2,"リブ厚さ w / t",0.3,1,0.6,0.05), sN=slider(row2,"リブ本数 n",0,6,3,1);
    var cv1=screen(el,170), c1=cctx(cv1);
    var cv2=screen(el,220), c2=cctx(cv2), ro=readout(el);
    function sec(t,w,h,n){ // 返り値: A, Ybar, I, c
      var A1=B*t,A2=n*w*h,A=A1+A2,Y=(A1*t/2+A2*(t+h/2))/A;
      var I=B*t*t*t/12+A1*Math.pow(Y-t/2,2)+n*(w*h*h*h/12)+A2*Math.pow(t+h/2-Y,2);
      return {A:A,Y:Y,I:I,c:Math.max(Y,(n>0&&h>0?t+h:t)-Y)};}
    function Dt(t,w){return w>=2*t?w/t:1+w*w/(4*t*t);}
    function draw(){
      var t=+sT.input.value,h=+sH.input.value,wr=+sW.input.value,n=+sN.input.value,w=wr*t;
      sT.val.textContent=f(t,1)+" mm"; sH.val.textContent=f(h,1)+" mm ("+f(h/t,1)+" t)";
      sW.val.textContent=f(wr,2)+" → "+f(w,2)+" mm"; sN.val.textContent=n+" 本";
      // 断面図
      var d=c1.fit(),ctx=c1.ctx; ctx.clearRect(0,0,d.w,d.h);
      var sc=Math.min((d.w-40)/B,(d.h-34)/(4+15)), x0=(d.w-B*sc)/2, yb=d.h-14;
      ctx.fillStyle=C("--panel");ctx.strokeStyle=C("--muted");ctx.lineWidth=1.3;
      ctx.beginPath();ctx.rect(x0,yb-t*sc,B*sc,t*sc);ctx.fill();ctx.stroke();
      var s=sec(t,w,h,n);
      for(var i=0;i<n&&h>0;i++){var cx=x0+(i+0.5)*B/n*sc;
        ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");
        ctx.beginPath();ctx.rect(cx-w/2*sc,yb-(t+h)*sc,w*sc,h*sc);ctx.fill();ctx.stroke();}
      ctx.strokeStyle=C("--alias");ctx.setLineDash([6,4]);ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(x0-12,yb-s.Y*sc);ctx.lineTo(x0+B*sc+12,yb-s.Y*sc);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"赤の点線: 中立軸 Ȳ = "+f(s.Y,2)+" mm",x0+B*sc,14,C("--alias"),"right",10);
      if(n>0&&h>0){var cx0=x0+0.5*B/n*sc,r=Dt(t,w)*t/2;
        var ok=Dt(t,w)<=1.1?C("--signal"):(Dt(t,w)<=1.2?C("--blue"):C("--alias"));
        ctx.strokeStyle=ok;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(cx0,yb-r*sc,r*sc,0,Math.PI*2);ctx.stroke();}
      lab(ctx,"幅 "+B+" mm（縦横同じ縮尺）",x0,14,C("--muted"),"left",10);
      // グラフ: h に対する比
      var hs=[],I0=B*t*t*t/12,ymax=1;
      for(var hh=0;hh<=15.001;hh+=0.25){var q=sec(t,w,hh,n),teq=q.A/B,Ieq=B*teq*teq*teq/12;
        hs.push([hh,q.I/I0,q.I/Ieq]);ymax=Math.max(ymax,q.I/I0);}
      ymax=ymax<=2?2:(ymax<=5?5:(ymax<=10?10:Math.ceil(ymax/10)*10));
      var c=chart(c2,0,15,0,ymax,{l:46,b:30,r:14});
      grid(c,5);axis(c);
      for(var k=0;k<=15;k+=3)lab(c.ctx,k+(k==15?" mm":""),c.X(k),c.h-12,C("--muted"),k==15?"right":"center",10);
      for(var j=0;j<=5;j++)lab(c.ctx,f(ymax*j/5,ymax>=10?0:1),c.p.l-6,c.Y(ymax*j/5)+4,C("--muted"),"right",10);
      lab(c.ctx,"倍",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      line(c,hs.map(function(p){return [p[0],p[1]];}),C("--signal"),2.4);
      line(c,hs.map(function(p){return [p[0],p[2]];}),C("--blue"),2,[6,4]);
      c.ctx.fillStyle=C("--grid");c.ctx.fillRect(c.X(3*t),c.p.t,Math.max(0,c.X(15)-c.X(Math.min(15,3*t))),c.h-c.p.t-c.p.b);
      lab(c.ctx,"h > 3t",Math.min(c.X(15)-4,c.X(3*t)+4),c.p.t+12,C("--faint"),c.X(3*t)+50>c.X(15)?"right":"left",10);
      var teq=s.A/B,Ieq=B*teq*teq*teq/12;
      dot(c,h,s.I/I0,5,C("--signal"));dot(c,h,s.I/Ieq,4,C("--blue"));
      lab(c.ctx,"実線: リブなし（同じ t）に対する I の比",c.p.l+10,c.p.t+28,C("--signal"),"left",10);
      lab(c.ctx,"点線: 同じ質量の平板に対する I の比",c.p.l+10,c.p.t+44,C("--blue"),"left",10);
      // 判定
      var dt=Dt(t,w),sink=dt<=1.1?'<span style="color:var(--signal)">少ない</span>':(dt<=1.2?'<span style="color:var(--blue)">注意</span>':'<span style="color:var(--alias)">ひけやすい</span>');
      var gap=n>0?B/n-w:B, tf=Math.pow(12*s.I/B,1/3);
      ro.innerHTML=tbl(["量","値"],[
        ["断面積（質量の比）",f(s.A,1)+" mm²（リブなしの "+f(s.A/(B*t),2)+" 倍）"],
        ["断面二次モーメント I",f(s.I,1)+" mm⁴"],
        ["<b>リブなし（同じ t）に対する I の比</b>","<b>"+f(s.I/I0,2)+" 倍</b>"],
        ["同じ質量の平板（"+f(teq,2)+" mm）に対する比",f(s.I/Ieq,2)+" 倍"],
        ["同じ I の平板の厚さと質量の比",f(tf,2)+" mm（"+f(tf/teq,2)+" 倍）"],
        ["交差部の内接円 D/t = 1 + (w/t)²/4",(n>0&&h>0?f(dt,3)+" → ひけ: "+sink:"リブなし")],
        ["高さ h ≤ 3t / 間隔 ≥ 2t",(h<=3*t+1e-9?"OK":'<span style="color:var(--alias)">高すぎ</span>')+" / "+(n>0?(gap>=2*t?"OK（"+f(gap,1)+" mm）":'<span style="color:var(--alias)">狭すぎ（'+f(gap,1)+' mm）</span>'):"—")]
      ],["left","right"]);
    }
    [sT,sH,sW,sN].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv1,draw); reg(cv2,draw); draw();
  };

  /* ============ 06. bend — 曲げ代と展開長 ============ */
  REG.bend=function(el){
    head(el,"06","曲げ代と展開長（外寸は仮想シャープから測る）");
    var row=ctrls(el), sT=slider(row,"板厚 t",0.5,3,1,0.1), sR=slider(row,"内 R",0.2,5,1,0.1), sK=slider(row,"K 係数",0.25,0.5,0.4,0.01);
    var row2=ctrls(el), sA=slider(row2,"曲げ角度 θ",15,150,90,1), sAA=slider(row2,"外寸 A",5,60,20,1), sBB=slider(row2,"外寸 B",5,60,30,1);
    var cv=screen(el,300), cc=cctx(cv), ro=readout(el);
    function draw(){
      var t=+sT.input.value,R=+sR.input.value,K=+sK.input.value,deg=+sA.input.value,A=+sAA.input.value,B=+sBB.input.value;
      sT.val.textContent=f(t,1)+" mm";sR.val.textContent=f(R,1)+" mm ("+f(R/t,2)+" t)";sK.val.textContent=f(K,2);
      sA.val.textContent=deg+"°";sAA.val.textContent=A+" mm";sBB.val.textContent=B+" mm";
      var th=deg*Math.PI/180,os=(R+t)*Math.tan(th/2),BA=th*(R+K*t),BD=2*os-BA,L=A+B-BD;
      var ok=A>os&&B>os;
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      // 形状（局所座標 mm, y 上向き。P=原点）
      var O=[-os,R+t],u=[Math.cos(th),Math.sin(th)],n=[-Math.sin(th),Math.cos(th)];
      function arc(r,rev){var p=[];for(var k=0;k<=24;k++){var a=th*k/24;p.push([O[0]+r*Math.sin(a),O[1]-r*Math.cos(a)]);}return rev?p.reverse():p;}
      var Eo=[B*u[0],B*u[1]],Ei=[Eo[0]+t*n[0],Eo[1]+t*n[1]];
      var poly=[[-A,0]].concat(arc(R+t)).concat([Eo,Ei]).concat(arc(R,true)).concat([[-A,t]]);
      var xs=poly.map(function(p){return p[0];}).concat([0]),ys=poly.map(function(p){return p[1];}).concat([0]);
      var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
      var lw=w*0.5-20,top=24,bot=h-84;
      var sc=Math.min(lw/(x1-x0),(bot-top)/(y1-y0));
      var ox=14-x0*sc+(lw-(x1-x0)*sc)/2,oy=bot+y0*sc-((bot-top)-(y1-y0)*sc)/2;
      function S(p){return [ox+p[0]*sc,oy-p[1]*sc];}
      ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=1.5;
      ctx.beginPath();poly.forEach(function(p,i){var q=S(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fill();ctx.stroke();
      // 中立面
      var rn=R+K*t,np=arc(rn);ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;ctx.beginPath();
      np.forEach(function(p,i){var q=S(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.stroke();
      // 仮想シャープ
      var P=S([0,0]),T1=S([O[0]+(R+t)*Math.sin(th),O[1]-(R+t)*Math.cos(th)]),T0=S([-os,0]);
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.beginPath();
      ctx.moveTo(T0[0],T0[1]);ctx.lineTo(P[0],P[1]);ctx.lineTo(T1[0],T1[1]);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=C("--ink");ctx.beginPath();ctx.arc(P[0],P[1],3,0,Math.PI*2);ctx.fill();
      lab(ctx,"P",P[0]+6,P[1]+14,C("--ink"),"left",11);
      var Am=S([-A/2,0]);lab(ctx,"A = "+A,Am[0],Am[1]+16,C("--muted"),"center",10);
      var Bm=S([B/2*u[0]+0*n[0],B/2*u[1]]);lab(ctx,"B = "+B,Bm[0]+10,Bm[1],C("--muted"),"left",10);
      lab(ctx,"赤: 中立面（BA）",14,16,C("--alias"),"left",10);
      // 展開図（下）
      var fx0=14,fx1=w-14,fy=h-34,fs=(fx1-fx0)/Math.max(L,1);
      var segs=[[A-os,"--muted","--panel"],[BA,"--alias","--alias-soft"],[B-os,"--muted","--panel"]],xx=fx0;
      segs.forEach(function(sg){var ww=Math.max(0,sg[0])*fs;ctx.fillStyle=C(sg[2]);ctx.strokeStyle=C(sg[1]);ctx.lineWidth=1.2;
        ctx.beginPath();ctx.rect(xx,fy,ww,14);ctx.fill();ctx.stroke();
        if(ww>36)lab(ctx,f(sg[0],2),xx+ww/2,fy+28,C(sg[1]),"center",10);xx+=ww;});
      lab(ctx,"展開図  L = "+f(L,3)+" mm",fx0,fy-8,C("--ink"),"left",11);
      // 右の数値
      var rx=w*0.5+10;
      var lines=[["OSSB = (R+t)tan(θ/2)",f(os,3)+" mm"],["BA = θ(R+Kt)",f(BA,3)+" mm"],["BD = 2·OSSB − BA",f(BD,3)+" mm"],["展開長 L = A + B − BD",f(L,3)+" mm"]];
      lines.forEach(function(l,i){lab(ctx,l[0],rx,40+i*24,C("--muted"),"left",11);lab(ctx,l[1],w-14,40+i*24,i==3?C("--signal"):C("--ink"),"right",12);});
      var eps=1/(2*R/t+1);
      lab(ctx,"外側の面のひずみ（K=0.5 近似） "+f(eps*100,0)+" %",rx,40+4*24+10,eps>0.4?C("--alias"):C("--muted"),"left",11);
      if(!ok)lab(ctx,"外寸が OSSB より短く、平らな部分が残らない",rx,40+5*24+10,C("--alias"),"left",11);
      ro.innerHTML=tbl(["部分","長さ [mm]"],[
        ["辺 A の平らな部分 A − OSSB",f(A-os,3)],["曲げ代 BA（中立面の円弧）",f(BA,3)],["辺 B の平らな部分 B − OSSB",f(B-os,3)],
        ["<b>展開長 L</b>","<b>"+f(L,3)+"</b>"],
        ["参考: 内側の円弧 Rθ / 外側の円弧 (R+t)θ",f(R*th,3)+" / "+f((R+t)*th,3)]],["left","right"]);
    }
    [sT,sR,sK,sA,sAA,sBB].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 07. stack — ワーストケースと RSS の積み上げ ============ */
  REG.stack=function(el){
    head(el,"07","寸法の積み上げ: ワーストケースと RSS");
    var row=ctrls(el);
    var tin=textin(row,"各寸法の公差 ±t [mm]（カンマ区切り。個数が寸法の数）","0.25, 0.25, 0.25, 0.25");
    var row2=ctrls(el);
    var sG=slider(row2,"隙間の基準値 Ḡ [mm]",-0.5,3,1,0.05);
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function erfc(x){var z=Math.abs(x),t=1/(1+0.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+
      t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
    function Q(z){return 0.5*erfc(z/Math.SQRT2);} /* 平均から z σ 以上下に外れる割合 */
    function pfmt(p){
      if(p>=0.001)return f(p*100,2)+" %";
      var ppm=p*1e6; if(ppm>=0.001)return (ppm>=1?f(ppm,0):f(ppm,3))+" ppm";
      return "0.001 ppm 未満";
    }
    function tols(){
      var a=tin.value.split(/[,、\s]+/).map(function(s){return parseFloat(s);}).filter(function(v){return isFinite(v)&&v>=0;});
      return a.length?a.slice(0,30):[0];
    }
    function draw(){
      var t=tols(), n=t.length, G=+sG.input.value; sG.val.textContent=f(G,2)+" mm";
      var wc=0,ss=0; t.forEach(function(v){wc+=v;ss+=v*v;});
      var rss=Math.sqrt(ss), sg=Math.max(rss/3,1e-6);
      var span=Math.max(wc*1.25,0.3);
      var x0=Math.min(G-span,-0.2), x1=Math.max(G+span,0.3);
      var c=chart(cc,x0,x1,0,1.55,{l:20,r:20,t:14,b:30}), ctx=c.ctx;
      axis(c);
      /* 目盛 */
      var st=(x1-x0)>4?1:((x1-x0)>2?0.5:((x1-x0)>0.8?0.2:0.1));
      for(var v=Math.ceil(x0/st)*st;v<=x1+1e-9;v+=st){
        ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(c.X(v),c.h-c.p.b);ctx.lineTo(c.X(v),c.h-c.p.b+4);ctx.stroke();
        lab(ctx,f(v,st<0.2?1:1),c.X(v),c.h-12,C("--muted"),"center",10);}
      lab(ctx,"G [mm]",c.w-c.p.r,c.h-c.p.b-6,C("--muted"),"right",10);
      /* 干渉域 */
      if(x0<0){ctx.fillStyle=C("--alias-soft");ctx.fillRect(c.X(x0),c.p.t,c.X(Math.min(0,x1))-c.X(x0),c.h-c.p.t-c.p.b);
        lab(ctx,"干渉",c.X(x0)+4,c.p.t+12,C("--alias"),"left",10);}
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(c.X(0),c.p.t);ctx.lineTo(c.X(0),c.h-c.p.b);ctx.stroke();
      /* 正規分布（高さを 1 に正規化） */
      var pts=[],N=300;for(var i=0;i<=N;i++){var x=x0+(x1-x0)*i/N;pts.push([x,0.42+Math.exp(-0.5*Math.pow((x-G)/sg,2))]);}
      /* 0 より左の裾を塗る */
      ctx.fillStyle=C("--alias");ctx.globalAlpha=0.45;ctx.beginPath();ctx.moveTo(c.X(x0),c.Y(0.42));
      pts.forEach(function(q){if(q[0]<=0)ctx.lineTo(c.X(q[0]),c.Y(q[1]));});
      ctx.lineTo(c.X(Math.min(0,x1)),c.Y(0.42));ctx.closePath();ctx.fill();ctx.globalAlpha=1;
      line(c,[[x0,0.42],[x1,0.42]],C("--line"),1);
      line(c,pts,C("--signal"),2.2);
      /* 範囲の帯 */
      function band(a,b,y,col,txt,fill){var X0=c.X(a),X1=c.X(b),Y=c.Y(y);
        ctx.strokeStyle=col;ctx.lineWidth=2;rrect(ctx,X0,Y-7,Math.max(X1-X0,1),14,3);
        if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.stroke();
        lab(ctx,txt,c.w-c.p.r,c.p.t+(fill?30:14),col,"right",10.5);}
      band(G-wc,G+wc,0.27,C("--alias"),"□ ワーストケース "+f(G-wc,2)+"〜"+f(G+wc,2),null);
      band(G-rss,G+rss,0.1,C("--signal"),"■ RSS（±3σ） "+f(G-rss,2)+"〜"+f(G+rss,2),C("--signal-soft"));
      var z=G/sg, p=Q(z);
      ro.innerHTML=tbl(["項目","値"],[
        ["寸法の数 n",n+" 個"],
        ["ワーストケース t<sub>WC</sub> = Σt",f(wc,3)+" mm → G = "+f(G-wc,2)+"〜"+f(G+wc,2)+" mm"+(G-wc<0?' <span style="color:var(--alias)">（干渉しうる）</span>':"")],
        ["RSS t<sub>RSS</sub> = √(Σt²)",f(rss,3)+" mm → G = "+f(G-rss,2)+"〜"+f(G+rss,2)+" mm"],
        ["RSS / ワーストケース",wc>0?f(rss/wc,2):"—"],
        ["σ<sub>G</sub> = t<sub>RSS</sub>/3（公差 = ±3σ と仮定）",f(sg,3)+" mm"],
        ["z = Ḡ / σ<sub>G</sub>",f(z,2)],
        ["干渉する確率の目安（G &lt; 0）",'<b style="color:'+(p>1e-3?"var(--alias)":"var(--signal)")+'">'+pfmt(p)+"</b>"]
      ],["left","right"]);
    }
    tin.addEventListener("input",draw); sG.input.addEventListener("input",draw); reg(cv,draw); draw();
  };

  /* ============ 08. torque — 締付トルクと軸力 ============ */
  REG.torque=function(el){
    head(el,"08","締付トルク T = KdF と軸力・ねじの応力");
    var S=[["M2",2,0.4],["M2.5",2.5,0.45],["M3",3,0.5],["M4",4,0.7],["M5",5,0.8],["M6",6,1.0]];
    var G=[["4.8（鋼）",320],["8.8（鋼）",640],["10.9（鋼）",900],["A2-50（ステンレス）",210],["A2-70（ステンレス）",450]];
    var row=ctrls(el);
    var sS=select(row,"ねじの大きさ",S.map(function(s){return s[0]+" × "+s[2];}));
    var sC=select(row,"強度区分（降伏応力の呼び値）",G.map(function(g){return g[0]+" "+g[1]+" MPa";}));
    sS.value="2";
    var row2=ctrls(el);
    var sK=slider(row2,"トルク係数 K",0.10,0.35,0.20,0.005);
    var sT=slider(row2,"締付トルク T（対数）",-1.6,1.3,Math.log10(0.6),0.005);
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function geom(i){var d=S[i][1],P=S[i][2],d2=d-0.649519*P,d3=d-1.226869*P;
      return {d:d,P:P,d2:d2,d3:d3,As:Math.PI/4*Math.pow((d2+d3)/2,2)};}
    function draw(){
      var g=geom(+sS.value), sy=G[+sC.value][1], K=+sK.input.value, T=Math.pow(10,+sT.input.value); /* N·m */
      sK.val.textContent=f(K,3); sT.val.textContent=f(T,T<1?3:2)+" N·m";
      var F=T*1000/(K*g.d), sig=F/g.As;
      /* 横軸: 降伏させるトルク（K = 0.35 のとき）まで */
      function nice(x){var e=Math.pow(10,Math.floor(Math.log10(x))),m=x/e;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*e;}
      var ts=nice(Math.max(1.15*sy*g.As*0.35*g.d/1000,T*1.08)/4), Tmax=4*ts;
      var ss=nice(1.3*sy/5), smax=5*ss;
      var c=chart(cc,0,Tmax,0,smax,{l:52,b:30,r:16}),ctx=c.ctx;
      grid(c,5);axis(c);
      for(var i=0;i<=5;i++){var v=ss*i;lab(ctx,f(v,0),c.p.l-6,c.Y(v)+4,C("--muted"),"right",10);}
      for(var j=0;j<=4;j++){var t=ts*j;lab(ctx,f(t,(ts>=1&&ts%1==0)?0:(Math.abs(ts*10-Math.round(ts*10))<1e-9?1:2)),c.X(t),c.h-12,C("--muted"),j==4?"right":"center",10);}
      lab(ctx,"T [N·m]",c.w-c.p.r-4,c.h-c.p.b-6,C("--muted"),"right",10);
      lab(ctx,"σ [MPa]",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      line(c,[[0,sy],[Tmax,sy]],C("--alias"),1.6,[6,4]);
      lab(ctx,"降伏応力 "+sy+" MPa",c.w-c.p.r-4,c.Y(sy)-5,C("--alias"),"right",10);
      line(c,[[0,0.7*sy],[Tmax,0.7*sy]],C("--faint"),1.2,[3,4]);
      lab(ctx,"70 %",c.w-c.p.r-4,c.Y(0.7*sy)-5,C("--faint"),"right",10);
      function sl(k){return 1000/(k*g.d*g.As);} /* MPa per N·m */
      [0.1,0.3].forEach(function(k){line(c,[[0,0],[Math.min(Tmax,smax/sl(k)),Math.min(smax,Tmax*sl(k))]],C("--muted"),1,[2,3]);});
      var ex=Math.min(Tmax,smax/sl(K));
      line(c,[[0,0],[ex,ex*sl(K)]],C("--signal"),2.4);
      lab(ctx,"K=0.1",c.X(Math.min(Tmax,smax/sl(0.1)))-4,c.Y(Math.min(smax,Tmax*sl(0.1)))+14,C("--muted"),"right",9.5);
      lab(ctx,"K=0.3",c.X(Math.min(Tmax,smax/sl(0.3)))-4,c.Y(Math.min(smax,Tmax*sl(0.3)))+14,C("--muted"),"right",9.5);
      if(sig<=smax)dot(c,T,sig,5,C(sig>sy?"--alias":"--signal"));
      var r=sig/sy, col=r>1?"var(--alias)":(r>0.7?"var(--alias)":"var(--signal)");
      var msg=r>1?"降伏する":(r>0.7?"締めすぎの恐れ（ねじり応力も加わる）":"目安の範囲内");
      ro.innerHTML=tbl(["項目","値"],[
        ["有効径 d₂ / 谷の径 d₃",f(g.d2,3)+" / "+f(g.d3,3)+" mm"],
        ["有効断面積 A<sub>s</sub>",f(g.As,2)+" mm²"],
        ["締付トルク T",f(T*1000,0)+" N·mm"],
        ["軸力 F = T / (K d)",f(F,0)+" N"],
        ["引張応力 σ = F / A<sub>s</sub>",f(sig,0)+" MPa"],
        ["σ / 降伏応力",'<b style="color:'+col+'">'+f(r*100,0)+" %　"+msg+"</b>"],
        ["70 % で締めるトルクの目安",f(0.7*sy*g.As*K*g.d/1000,2)+" N·m"]
      ],["left","right"]);
    }
    [sS,sC].forEach(function(s){s.addEventListener("change",draw);});
    [sK,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 09. snap — 片持ちスナップのひずみと力 ============ */
  REG.snap=function(el){
    head(el,"09","片持ちスナップ: ひずみ ε = 3hy/(2L²) と力 P, W");
    /* [名前, E (MPa), 許容ひずみ（1 回の組み付け、代表値）] */
    var M=[["ABS",2300,0.025],["PC",2300,0.04],["PC/ABS",2300,0.028],["POM",2800,0.055],
           ["PA66（吸湿）",1600,0.05],["PA66-GF30（吸湿）",6000,0.018]];
    var row=ctrls(el);
    var sL=slider(row,"腕の長さ L [mm]",3,30,10,0.5);
    var sH=slider(row,"厚さ h [mm]",0.5,4,1.5,0.05);
    var sB=slider(row,"幅 b [mm]",1,15,5,0.5);
    var row2=ctrls(el);
    var sY=slider(row2,"たわみ y [mm]",0.1,4,1,0.05);
    var sM=select(row2,"材料（E と許容ひずみは代表値）",M.map(function(m){return m[0];}));
    sM.value="1";
    var rep=checkbox(row2,"くり返し着脱（許容ひずみを半分に）",false);
    var row3=ctrls(el);
    var sA=slider(row3,"挿入側の角度 α [°]",10,60,30,1);
    var sR=slider(row3,"戻り側の角度 α′ [°]",10,90,45,1);
    var sU=slider(row3,"摩擦係数 μ",0.1,0.8,0.4,0.05);
    var cv=screen(el,240), cc=cctx(cv), ro=readout(el);
    function wf(P,a,mu){var t=Math.tan(a*Math.PI/180),d=1-mu*t;return d<=1e-6?Infinity:P*(mu+t)/d;}
    function draw(){
      var L=+sL.input.value,h=+sH.input.value,b=+sB.input.value,y=+sY.input.value,m=M[+sM.value];
      var a=+sA.input.value,ar=+sR.input.value,mu=+sU.input.value;
      sL.val.textContent=f(L,1)+" mm";sH.val.textContent=f(h,2)+" mm";sB.val.textContent=f(b,1)+" mm";
      sY.val.textContent=f(y,2)+" mm";sA.val.textContent=a+"°";sR.val.textContent=ar+"°";sU.val.textContent=f(mu,2);
      var E=m[1], ea=m[2]*(rep.checked?0.5:1);
      var eps=3*h*y/(2*L*L), yal=2*ea*L*L/(3*h);
      var P=E*b*h*h*h*y/(4*L*L*L), W=wf(P,a,mu), Wr=wf(P,ar,mu);
      var lock=Math.atan(1/mu)*180/Math.PI;
      /* グラフ: 横軸 y、縦軸 ε [%] */
      var ymax=Math.max(4,y*1.1), emax=Math.max(ea*100*1.6,eps*100*1.15,1);
      var c=chart(cc,0,ymax,0,emax,{l:46,b:30,r:16}),ctx=c.ctx;
      grid(c,4);axis(c);
      for(var i=0;i<=4;i++){var v=emax*i/4;lab(ctx,f(v,1),c.p.l-6,c.Y(v)+4,C("--muted"),"right",10);}
      for(var j=0;j<=4;j++){var t=ymax*j/4;lab(ctx,f(t,1),c.X(t),c.h-12,C("--muted"),j==4?"right":"center",10);}
      lab(ctx,"y [mm]",c.w-c.p.r-30,c.h-c.p.b-6,C("--muted"),"right",10);
      lab(ctx,"ε [%]",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      line(c,[[0,ea*100],[ymax,ea*100]],C("--alias"),1.6,[6,4]);
      lab(ctx,"許容ひずみ "+f(ea*100,1)+" %（"+m[0]+(rep.checked?"、くり返し":"")+"）",c.w-c.p.r-4,c.Y(ea*100)-6,C("--alias"),"right",10);
      var k=3*h/(2*L*L)*100, ye=Math.min(ymax,emax/k);
      line(c,[[0,0],[ye,ye*k]],C("--signal"),2.4);
      if(yal<=ymax){ctx.strokeStyle=C("--faint");ctx.setLineDash([3,4]);ctx.beginPath();
        ctx.moveTo(c.X(yal),c.Y(ea*100));ctx.lineTo(c.X(yal),c.h-c.p.b);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"y_allow",c.X(yal)+4,c.h-c.p.b-6,C("--faint"),"left",10);}
      if(eps*100<=emax)dot(c,y,eps*100,5,C(eps>ea?"--alias":"--signal"));
      var r=eps/ea, col=r>1?"var(--alias)":"var(--signal)";
      function wfmt(v){return isFinite(v)?f(v,1)+" N":'<b style="color:var(--alias)">外れない（自己ロック）</b>';}
      ro.innerHTML=tbl(["項目","値"],[
        ["根元のひずみ ε = 3hy/(2L²)",'<b style="color:'+col+'">'+f(eps*100,2)+" %</b>"],
        ["許容ひずみに対する比",'<b style="color:'+col+'">'+f(r*100,0)+" %"+(r>1?"　超えている":"")+"</b>"],
        ["許されるたわみ y_allow = 2εL²/(3h)",f(yal,2)+" mm"],
        ["たわませる力 P = Ebh³y/(4L³)",f(P,1)+" N（E = "+E+" MPa）"],
        ["組み付ける力 W = P(μ+tanα)/(1−μ tanα)",isFinite(W)?f(W,1)+" N":'<b style="color:var(--alias)">押し込めない</b>'],
        ["外す力 W′（α′ = "+ar+"°）",wfmt(Wr)],
        ["自己ロックになる角度 arctan(1/μ)",f(lock,1)+"°"]
      ],["left","right"]);
    }
    [sL,sH,sB,sY,sA,sR,sU].forEach(function(s){s.input.addEventListener("input",draw);});
    sM.addEventListener("change",draw); rep.addEventListener("change",draw);
    reg(cv,draw); draw();
  };

  /* ============ 10. cte — 熱膨張差と長穴 ============ */
  REG.cte=function(el){
    head(el,"10","熱膨張差と必要な長穴の長さ");
    var A=[["ABS",80],["PC",65],["PC/ABS",70],["PA66",80],["PP",100],["PA66-GF30（流れ方向）",25],["樹脂（代表値）",85],["アルミ A5052",24]];
    var B=[["FR-4（面内）",16],["アルミ A5052",24],["鋼",12],["ガラス",9]];
    var row=ctrls(el);
    var sa=select(row,"材料 A（筐体、α は代表値）",A.map(function(m){return m[0]+"  α="+m[1]+"e-6";}));
    var sb=select(row,"材料 B（基板など、α は代表値）",B.map(function(m){return m[0]+"  α="+m[1]+"e-6";}));
    sa.value="6";
    var row2=ctrls(el);
    var sL=slider(row2,"固定点からの距離 L",10,300,150,1);
    var sT=slider(row2,"温度差 ΔT",0,100,60,1);
    var sH=slider(row2,"丸穴の隙間（片側）",0,0.5,0.2,0.01);
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function draw(){
      var aA=A[+sa.value][1], aB=B[+sb.value][1], L=+sL.input.value, dT=+sT.input.value, cl=+sH.input.value;
      sL.val.textContent=L+" mm"; sT.val.textContent=dT+" K"; sH.val.textContent=f(cl,2)+" mm";
      var da=Math.abs(aA-aB)*1e-6, dL=da*L*dT;
      var ymax=Math.max(0.5,Math.ceil(da*300*Math.max(dT,1)*10)/10);
      var c=chart(cc,0,300,0,ymax,{l:52,b:32});
      grid(c,5); axis(c);
      for(var x=0;x<=300;x+=50)lab(c.ctx,x+(x==300?" mm":""),c.X(x),c.h-12,C("--muted"),x==300?"right":"center",10);
      for(var k=0;k<=5;k++)lab(c.ctx,f(ymax*k/5,2),c.p.l-6,c.Y(ymax*k/5)+4,C("--muted"),"right",10);
      lab(c.ctx,"伸びの差 ΔL [mm]",c.p.l+6,c.p.t+10,C("--muted"),"left",10);
      // 丸穴の隙間（これ以下なら長穴は不要）
      c.ctx.fillStyle=C("--signal-soft");
      c.ctx.fillRect(c.p.l,c.Y(Math.min(cl,ymax)),c.w-c.p.l-c.p.r,c.Y(0)-c.Y(Math.min(cl,ymax)));
      lab(c.ctx,"丸穴の隙間で吸収できる範囲",c.w-c.p.r-6,c.Y(Math.min(cl,ymax))-5,C("--signal"),"right",10);
      line(c,[[0,0],[300,da*300*dT]],C("--alias"),2.4);
      dot(c,L,dL,5,C("--alias"));
      var need=dL>cl;
      var slot=2*dL;
      ro.innerHTML=tbl(["量","式","値"],[
        ["線膨張係数の差 Δα","|α_A − α_B|",f(Math.abs(aA-aB),0)+" ×10⁻⁶ /K"],
        ["伸びの差 ΔL","Δα·L·ΔT","<b>"+f(dL,3)+" mm</b>"],
        ["押さえ込んだときのひずみ","Δα·ΔT",f(da*dT*1e3,2)+" ×10⁻³"],
        ["長穴を丸穴より長くする量","2ΔL（両方向）","<b>"+f(slot,2)+" mm</b>"],
        ["判定","ΔL と丸穴の隙間を比べる",need?'<span style="color:var(--alias)">丸穴の隙間を超える → 長穴が要る</span>':'<span style="color:var(--signal)">丸穴の隙間に収まる</span>']
      ],["left","left","right"]);
    }
    [sa,sb].forEach(function(s){s.addEventListener("change",draw);});
    [sL,sT,sH].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 11. drop — 落下の速さと G ============ */
  REG.drop=function(el){
    head(el,"11","落下の高さ・停止距離と G");
    var g=9.81;
    var row=ctrls(el);
    var sh=slider(row,"高さ h",0.1,3,1,0.05);
    var ss=slider(row,"停止距離 s（対数）",-0.7,1.3,0,0.01);
    var sm=slider(row,"部品の質量 m",1,1000,100,1);
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function niceMax(v){var e=Math.pow(10,Math.floor(Math.log10(v))),k=v/e;
      return (k<=1?1:k<=2?2:k<=5?5:10)*e;}
    function draw(){
      var h=+sh.input.value, s=Math.pow(10,+ss.input.value), m=+sm.input.value;
      sh.val.textContent=f(h,2)+" m"; ss.val.textContent=(s<1?f(s,2):f(s,1))+" mm"; sm.val.textContent=m+" g";
      var v=Math.sqrt(2*g*h), sm_=s/1000, a=v*v/(2*sm_), G=a/g, Gp=G*Math.PI/2, tau=2*sm_/v; // s
      var tms=tau*1e3, xmax=niceMax(tms*1.25), ymax=niceMax(Gp*1.1);
      var c=chart(cc,0,xmax,0,ymax,{l:58,b:32});
      grid(c,5); axis(c);
      for(var k=0;k<=5;k++){var xv=xmax*k/5;lab(c.ctx,(xv<1?f(xv,2):f(xv,1))+(k==5?" ms":""),c.X(xv),c.h-12,C("--muted"),k==5?"right":"center",10);}
      for(k=0;k<=5;k++){var yv=ymax*k/5;lab(c.ctx,Math.round(yv)+"",c.p.l-6,c.Y(yv)+4,C("--muted"),"right",10);}
      lab(c.ctx,"加速度 [G]",c.p.l+6,c.p.t+10,C("--muted"),"left",10);
      line(c,[[0,0],[0,G],[tms,G],[tms,0]],C("--signal"),2.2);
      var pts=[];for(var i=0;i<=100;i++){var u=i/100;pts.push([u*tms,Gp*Math.sin(Math.PI*u)]);}
      line(c,pts,C("--alias"),2.4);
      lab(c.ctx,"平均（一定）",c.X(tms)+6,c.Y(G)-4,C("--signal"),"left",10.5);
      lab(c.ctx,"半正弦波",c.X(tms*0.5),c.Y(Gp)-8,C("--alias"),"center",10.5);
      var mk_=m/1000;
      ro.innerHTML=tbl(["量","式","値"],[
        ["衝突の速さ v","√(2gh)",f(v,2)+" m/s"],
        ["衝撃の時間 τ","2s / v",f(tms,3)+" ms"],
        ["平均の加速度","v²/(2s) = g·h/s","<b>"+Math.round(G).toLocaleString()+" G</b>（"+Math.round(a).toLocaleString()+" m/s²）"],
        ["半正弦波のピーク","π/2 × 平均",'<b style="color:var(--alias)">'+Math.round(Gp).toLocaleString()+" G</b>"],
        ["部品にかかる力（平均）","m·a",f(mk_*a,1)+" N"],
        ["部品にかかる力（ピーク）","m·a·π/2",'<b style="color:var(--alias)">'+f(mk_*a*Math.PI/2,1)+" N</b>"],
        ["部品の重さとの比","= G",Math.round(G).toLocaleString()+" 倍（平均）"]
      ],["left","left","right"]);
    }
    [sh,ss,sm].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 12. oring — O リングのつぶし率と充填率 ============ */
  REG.oring=function(el){
    head(el,"12","O リングのつぶし率と充填率");
    var row=ctrls(el);
    var sd=slider(row,"線径 d",1.0,6.0,2.4,0.1);
    var sh=slider(row,"溝深さ h",0.5,6.0,1.8,0.05);
    var sb=slider(row,"溝幅 b",1.0,8.0,3.4,0.05);
    var cv=screen(el,230), cc=cctx(cv), ro=readout(el);
    function draw(){
      var d=+sd.input.value, h=+sh.input.value, b=+sb.input.value;
      sd.val.textContent=f(d,1)+" mm"; sh.val.textContent=f(h,2)+" mm"; sb.val.textContent=f(b,2)+" mm";
      var sq=(d-h)/d*100, A=Math.PI*d*d/4, fill=A/(b*h)*100;
      var r=cc.fit(), ctx=cc.ctx, w=r.w, H=r.h; ctx.clearRect(0,0,w,H);
      // 図の縮尺: 溝＋周囲が収まるように
      var span=Math.max(b+4, d+4)*1.0, sc=Math.min((w-40)/span, (H-60)/Math.max(d,h)/1.6);
      var cx=w*0.5, base=H-34;                       // 溝の底
      var gw=b*sc, gh=h*sc;
      var mat=C("--muted"), sig=C("--signal"), ali=C("--alias");
      ctx.globalAlpha=0.22; ctx.fillStyle=mat;
      ctx.fillRect(cx-gw/2-2*sc,base-gh,2*sc,gh+20); ctx.fillRect(cx+gw/2,base-gh,2*sc,gh+20);
      ctx.fillRect(cx-gw/2,base,gw,20);
      ctx.fillRect(cx-gw/2-2*sc,base-gh-16,gw+4*sc,16);
      ctx.globalAlpha=1; ctx.strokeStyle=mat; ctx.lineWidth=1.2;
      ctx.strokeRect(cx-gw/2-2*sc,base-gh,2*sc,gh+20); ctx.strokeRect(cx+gw/2,base-gh,2*sc,gh+20);
      ctx.strokeRect(cx-gw/2,base,gw,20); ctx.strokeRect(cx-gw/2-2*sc,base-gh-16,gw+4*sc,16);
      // 元の円（破線）: 溝の底に接して置く
      var R=d/2*sc;
      ctx.setLineDash([4,3]); ctx.strokeStyle=C("--faint"); ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.arc(cx,base-R,R,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      // つぶした形（面積一定の長円、概略）
      if(h<d){
        var Wd=h+(A-Math.PI*h*h/4)/h, ww=Wd*sc;
        ctx.fillStyle=C("--signal-soft"); ctx.strokeStyle=sig; ctx.lineWidth=1.8;
        rrect(ctx,cx-ww/2,base-gh,ww,gh,gh/2); ctx.fill(); ctx.stroke();
        if(Wd>b){ ctx.strokeStyle=ali; ctx.lineWidth=2.4; rrect(ctx,cx-ww/2,base-gh,ww,gh,gh/2); ctx.stroke(); }
      }
      lab(ctx,"破線: つぶす前の O リング　緑: つぶした後（形は概略）",10,16,C("--muted"),"left",10.5);
      lab(ctx,"溝幅 b",cx,base+15,C("--muted"),"center",10);
      var sqOK = sq>=15&&sq<=30, sqTxt = h>=d?"つぶれない（隙間）":sq<10?"不足":sq<15?"少なめ":sq<=30?"範囲内":"過大";
      var flTxt = fill>100?"入らない":fill>85?"過大（はみ出す）":fill>75?"やや多い":"範囲内";
      function col(ok,warn){return ok?"var(--signal)":(warn?"var(--muted)":"var(--alias)");}
      ro.innerHTML=tbl(["量","式","値","判定（代表値の目安）"],[
        ["つぶし率","(d − h)/d","<b>"+f(sq,1)+" %</b>",'<span style="color:'+col(sqOK, sq>=10&&sq<15)+'">'+sqTxt+"</span>（15〜30 %）"],
        ["O リングの断面積","πd²/4",f(A,2)+" mm²",""],
        ["溝の断面積","b·h",f(b*h,2)+" mm²",""],
        ["充填率","(πd²/4)/(b·h)","<b>"+f(fill,1)+" %</b>",'<span style="color:'+col(fill<=75, fill>75&&fill<=85)+'">'+flTxt+"</span>（85 % 以下）"]
      ],["left","left","right","left"]);
    }
    [sd,sh,sb].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 12. pressure — 温度変化と内外の圧力差 ============ */
  REG.pressure=function(el){
    head(el,"12","密閉した筐体の温度変化と内外の圧力差");
    var row=ctrls(el);
    var s1=slider(row,"密閉したときの温度 θ₁",-20,60,25,1);
    var s2=slider(row,"その後の温度 θ₂",-40,85,-10,1);
    var sA=slider(row,"ふたの面積 A",500,20000,6000,100);
    var cv=screen(el,240), cc=cctx(cv), ro=readout(el);
    var P0=101.325;
    function draw(){
      var t1=+s1.input.value, t2=+s2.input.value, A=+sA.input.value;
      s1.val.textContent=t1+" °C"; s2.val.textContent=t2+" °C"; sA.val.textContent=A.toLocaleString()+" mm²";
      var T1=t1+273.15;
      function dp(t){return P0*((t+273.15)/T1-1);}
      var c=chart(cc,-40,85,-30,30,{l:48,b:32});
      grid(c,6); axis(c);
      for(var x=-40;x<=80;x+=20)lab(c.ctx,x+(x==80?" °C":""),c.X(x),c.h-12,C("--muted"),x==80?"right":"center",10);
      for(var y=-30;y<=30;y+=10)lab(c.ctx,(y>0?"+":"")+y,c.p.l-6,c.Y(y)+4,C("--muted"),"right",10);
      lab(c.ctx,"内圧 − 外圧 [kPa]",c.p.l+6,c.p.t+10,C("--muted"),"left",10);
      c.ctx.strokeStyle=C("--line");c.ctx.lineWidth=1;c.ctx.beginPath();c.ctx.moveTo(c.X(-40),c.Y(0));c.ctx.lineTo(c.X(85),c.Y(0));c.ctx.stroke();
      line(c,[[-40,dp(-40)],[85,dp(85)]],C("--blue"),2.2);
      dot(c,t1,0,5,C("--muted"));
      var d=dp(t2);
      dot(c,t2,d,5.5,d<0?C("--alias"):C("--signal"));
      lab(c.ctx,"密閉",c.X(t1),c.Y(0)-10,C("--muted"),"center",10);
      var p2=P0+d, depth=Math.abs(d)*1000/(1000*9.81), F=Math.abs(d)*1e-3*A;
      ro.innerHTML=tbl(["量","式","値"],[
        ["絶対温度 T₁, T₂","θ + 273.15",f(T1,2)+" K, "+f(t2+273.15,2)+" K"],
        ["内圧 p₂","p₁·T₂/T₁（p₁ = 101.3 kPa）",f(p2,1)+" kPa"],
        ["内外の圧力差 Δp","p₂ − p₁",'<b style="color:'+(d<0?"var(--alias)":"var(--signal)")+'">'+(d>0?"+":"")+f(d,1)+" kPa</b>"+(d<0?"（負圧: 吸い込む）":d>0?"（正圧: 押し出す）":"")],
        ["同じ圧力の水深","|Δp| / (ρg)",f(depth,2)+" m"],
        ["ふたにかかる力","|Δp|·A","<b>"+f(F,1)+" N</b>"]
      ],["left","left","right"]);
    }
    [s1,s2,sA].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 13. thermal — 密閉筐体の表面温度上昇 ============ */
  REG.thermal=function(el){
    head(el,"13","密閉筐体の表面温度上昇（対流＋放射）");
    var SB=5.67e-8;
    var r1=ctrls(el),
        sP=slider(r1,"発熱量 P",0.5,30,5,0.5),
        sL=slider(r1,"箱の長さ",30,300,150,5),
        sW=slider(r1,"箱の幅",30,300,100,5),
        sH=slider(r1,"箱の高さ",10,150,50,5);
    var r2=ctrls(el),
        sh=slider(r2,"対流の熱伝達率 hc",1,20,5,0.5),
        se=slider(r2,"放射率 ε",0,1,0.9,0.05),
        sT=slider(r2,"周囲温度 Ta",0,50,25,1),
        cb=checkbox(r2,"底面は放熱に数えない",false);
    var cv=screen(el,260), cc=cctx(cv), ro=readout(el);
    function area(){
      var L=+sL.input.value/1000,W=+sW.input.value/1000,H=+sH.input.value/1000;
      var A=2*(L*W+L*H+W*H); if(cb.checked)A-=L*W; return A;}
    function solve(P,A,hc,eps,Ta){ // 対流+放射 = P となる ΔT（二分法）
      var lo=0,hi=600;
      for(var i=0;i<80;i++){var m=(lo+hi)/2,q=hc*A*m+eps*SB*A*(Math.pow(Ta+m,4)-Math.pow(Ta,4));
        if(q<P)lo=m;else hi=m;}
      var d=(lo+hi)/2;return {dT:d,qc:hc*A*d,qr:eps*SB*A*(Math.pow(Ta+d,4)-Math.pow(Ta,4))};}
    function draw(){
      var P=+sP.input.value,hc=+sh.input.value,eps=+se.input.value,Ta=+sT.input.value+273.15,A=area();
      sP.val.textContent=f(P,1)+" W"; sL.val.textContent=sL.input.value+" mm";
      sW.val.textContent=sW.input.value+" mm"; sH.val.textContent=sH.input.value+" mm";
      sh.val.textContent=f(hc,1)+" W/(m²·K)"; se.val.textContent=f(eps,2); sT.val.textContent=sT.input.value+" °C";
      var r=solve(P,A,hc,eps,Ta);
      var ymax=Math.max(20,Math.ceil(solve(30,A,hc,eps,Ta).dT/10)*10);
      ymax=Math.min(ymax,400);
      var c=chart(cc,0,30,0,ymax,{l:48,b:30,r:16});
      grid(c,5); axis(c);
      for(var k=0;k<=5;k++)lab(c.ctx,f(ymax*k/5,0),c.p.l-6,c.Y(ymax*k/5)+4,C("--muted"),"right",10);
      for(var x=0;x<=30;x+=5)lab(c.ctx,x+(x==30?" W":""),c.X(x),c.h-12,C("--muted"),x==30?"right":"center",10);
      lab(c.ctx,"表面温度上昇 ΔT [K]",c.p.l+6,c.p.t+10,C("--muted"),"left",10);
      var pc=[],pt=[];
      for(var p=0;p<=30;p+=0.5){pc.push([p,Math.min(p/(hc*A),ymax*1.2)]);pt.push([p,solve(p,A,hc,eps,Ta).dT]);}
      c.ctx.save();c.ctx.beginPath();c.ctx.rect(c.p.l,c.p.t,c.w-c.p.l-c.p.r,c.h-c.p.t-c.p.b);c.ctx.clip();
      line(c,pc,C("--muted"),1.6,[5,4]);
      line(c,pt,C("--signal"),2.4);
      c.ctx.restore();
      dot(c,P,Math.min(r.dT,ymax),5,C("--alias"));
      lab(c.ctx,"― 対流＋放射",c.w-c.p.r-170,c.h-c.p.b-28,C("--signal"),"left",10.5);
      lab(c.ctx,"- - 対流だけ（放射なし）",c.w-c.p.r-170,c.h-c.p.b-12,C("--muted"),"left",10.5);
      var Tm=Ta+r.dT/2, hr=4*eps*SB*Math.pow(Tm,3), dlin=P/((hc+hr)*A);
      var sc=r.qc/P*100;
      ro.innerHTML=tbl(["量","値"],[
        ["表面積 A",f(A,4)+" m²"],
        ["放射の等価熱伝達率 h_r = 4εσTm³",f(hr,2)+" W/(m²·K)"],
        ["h = hc + h_r",f(hc+hr,2)+" W/(m²·K)"],
        ["<b>表面温度上昇 ΔT</b>（正確な放射の式）","<b>"+f(r.dT,1)+" K</b>"],
        ["ΔT = P/(hA)（線形化）",f(dlin,1)+" K"],
        ["表面温度 Ta + ΔT",f(Ta-273.15+r.dT,1)+" °C"],
        ['<span style="color:'+C("--signal")+'">■</span> 対流の受け持ち',f(r.qc,2)+" W（"+f(sc,0)+" %）"],
        ['<span style="color:'+C("--blue")+'">■</span> 放射の受け持ち',f(r.qr,2)+" W（"+f(100-sc,0)+" %）"]
      ],["left","right"]);
    }
    [sP,sL,sW,sH,sh,se,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    cb.addEventListener("change",draw);
    reg(cv,draw); draw();
  };

  /* ============ 14. shield — 壁の遮蔽とスロットの漏れ ============ */
  REG.shield=function(el){
    head(el,"14","壁の遮蔽（表皮深さ・吸収・反射）とスロットの漏れ");
    // [名前, 導電率 S/m, 比透磁率]（代表値）
    var MAT=[["銅",5.8e7,1],["アルミ",3.5e7,1],["鋼（μr = 100 と仮定）",1.0e7,100],["ステンレス SUS304",1.4e6,1]];
    var MU0=4*Math.PI*1e-7, CL=3e8;
    var r1=ctrls(el),
        sF=slider(r1,"周波数 f（対数）",6,10,8,0.01),
        sm=select(r1,"材料",MAT.map(function(m){return m[0];})),
        sT=slider(r1,"板厚 t（対数）",0,3.5,2.7,0.01),
        sL=slider(r1,"スロット長 L",1,300,30,1);
    var cv=screen(el,270), cc=cctx(cv), ro=readout(el);
    function fstr(fr){return eng(fr,"Hz",fr>=1e9?2:(fr>=1e6?1:0));}
    function calc(fr,m,t,L){
      var mu=MU0*m[2],d=1/Math.sqrt(Math.PI*fr*mu*m[1]);
      var A=8.686*t/d, R=168-10*Math.log10(m[2]*fr/(m[1]/5.8e7));
      var lam=CL/fr, S=(L<lam/2)?20*Math.log10(lam/(2*L)):0;
      return {d:d,A:A,R:R,M:R+A,S:S,lam:lam,E:Math.min(R+A,S)};}
    function draw(){
      var fr=Math.pow(10,+sF.input.value), m=MAT[+sm.value], t=Math.pow(10,+sT.input.value)*1e-6,
          L=+sL.input.value/1000;
      sF.val.textContent=fstr(fr); sT.val.textContent=t>=1e-3?f(t*1e3,2)+" mm":f(t*1e6,t<1e-5?1:0)+" µm";
      sL.val.textContent=sL.input.value+" mm";
      var r=calc(fr,m,t,L), YM=200;
      var c=chart(cc,6,10,0,YM,{l:44,b:30,r:14,t:28});
      grid(c,4); axis(c);
      for(var k=0;k<=4;k++)lab(c.ctx,(YM*k/4)+"",c.p.l-6,c.Y(YM*k/4)+4,C("--muted"),"right",10);
      var FN=["1 MHz","10 MHz","100 MHz","1 GHz","10 GHz"];
      for(var e=6;e<=10;e++)lab(c.ctx,FN[e-6],c.X(e),c.h-12,C("--muted"),e==10?"right":(e==6?"left":"center"),10);
      lab(c.ctx,"遮蔽効果 [dB]（200 dB 以上は上端に張り付けて表示）",c.p.l+6,16,C("--muted"),"left",10);
      var pM=[],pA=[],pS=[];
      for(var x=6;x<=10.0001;x+=0.02){var q=calc(Math.pow(10,x),m,t,L);
        pM.push([x,Math.min(q.M,YM)]);pA.push([x,Math.min(q.A,YM)]);pS.push([x,Math.min(q.S,YM)]);}
      line(c,pA,C("--blue"),1.6,[5,4]);
      line(c,pM,C("--signal"),2.4);
      line(c,pS,C("--alias"),2.4);
      var lx=Math.log10(fr);
      c.ctx.strokeStyle=C("--ink");c.ctx.setLineDash([4,4]);c.ctx.lineWidth=1;c.ctx.beginPath();
      c.ctx.moveTo(c.X(lx),c.p.t);c.ctx.lineTo(c.X(lx),c.h-c.p.b);c.ctx.stroke();c.ctx.setLineDash([]);
      dot(c,lx,Math.min(r.E,YM),5,C("--ink"));
      var lx0=c.w-c.p.r-210, ly0=c.p.t+40;
      lab(c.ctx,"― 壁（反射＋吸収）R + A",lx0,ly0,C("--signal"),"left",10.5);
      lab(c.ctx,"- - 吸収だけ A",lx0,ly0+16,C("--blue"),"left",10.5);
      lab(c.ctx,"― スロット 20log(λ/2L)",lx0,ly0+32,C("--alias"),"left",10.5);
      function db(v){return v>=1000?"> 1000 dB":f(v,1)+" dB";}
      var dom=r.S<r.M?'<b style="color:'+C("--alias")+'">スロットが支配的</b>（壁を厚くしても変わらない。開口を短くする）'
                     :'<b style="color:'+C("--signal")+'">壁の遮蔽が支配的</b>（材料・板厚が効く）';
      ro.innerHTML=tbl(["量","値"],[
        ["波長 λ = c/f",f(r.lam*1000,r.lam<0.1?1:0)+" mm"],
        ["表皮深さ δ",r.d>=1e-3?f(r.d*1e3,2)+" mm":f(r.d*1e6,2)+" µm"],
        ["t/δ",f(t/r.d,2)],
        ['<span style="color:'+C("--blue")+'">■</span> 吸収損失 A',db(r.A)],
        ["反射損失 R（平面波）",db(r.R)],
        ['<span style="color:'+C("--signal")+'">■</span> 壁の遮蔽 R + A',db(r.M)],
        ['<span style="color:'+C("--alias")+'">■</span> スロットの遮蔽',L>=r.lam/2?"0 dB（L ≥ λ/2）":db(r.S)],
        ["<b>全体の目安</b>","<b>"+db(r.E)+"</b>"],
        ["支配しているもの",dom]
      ],["left","right"]);
    }
    [sF,sT,sL].forEach(function(s){s.input.addEventListener("input",draw);});
    sm.addEventListener("change",draw);
    reg(cv,draw); draw();
  };

  /* ============ 15. creepage — 空間距離と沿面距離 ============ */
  REG.creepage=function(el){
    head(el,"15","空間距離と沿面距離（平面・溝・リブ）");
    var r1=ctrls(el),
        sk=select(r1,"形状",["平面","溝","リブ"]),
        sd=slider(r1,"平面距離 d",2,20,6,0.5),
        sX=slider(r1,"橋渡しの幅 X（仮の値）",0.25,3,1,0.05);
    var r2=ctrls(el),
        sw=slider(r2,"溝の幅 w",0.2,6,1.5,0.1),
        sg=slider(r2,"溝の深さ g",0.2,5,2,0.1),
        sr=slider(r2,"リブの高さ r",0.5,10,3,0.1),
        sb=slider(r2,"リブの厚さ b",0.5,4,1.5,0.1);
    sk.value="2";
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function geo(){
      var k=+sk.value,d=+sd.input.value,X=+sX.input.value,
          w=Math.min(+sw.input.value,d-0.5),g=+sg.input.value,r=+sr.input.value,b=Math.min(+sb.input.value,d-0.5);
      var c=d,s=d,bridged=false,cp,sp; // 経路: [x,y] mm（y は上向き正）
      if(k===0){cp=[[0,0.15],[d,0.15]];sp=[[0,0],[d,0]];}
      else if(k===1){
        var a=(d-w)/2;cp=[[0,0.15],[d,0.15]];
        if(w>=X){s=d+2*g;sp=[[0,0],[a,0],[a,-g],[a+w,-g],[a+w,0],[d,0]];}
        else{bridged=true;s=d;sp=[[0,0],[d,0]];}
      }else{
        var a2=(d-b)/2;c=2*Math.sqrt(a2*a2+r*r)+b;s=d+2*r;
        cp=[[0,0.15],[a2,r+0.15],[a2+b,r+0.15],[d,0.15]];sp=[[0,0],[a2,0],[a2,r],[a2+b,r],[a2+b,0],[d,0]];
      }
      return {k:k,d:d,X:X,w:w,g:g,r:r,b:b,c:c,s:s,bridged:bridged,cp:cp,sp:sp};}
    function draw(){
      var G=geo();
      sd.val.textContent=f(G.d,1)+" mm"; sX.val.textContent=f(G.X,2)+" mm";
      sw.val.textContent=f(+sw.input.value,1)+" mm"; sg.val.textContent=f(G.g,1)+" mm";
      sr.val.textContent=f(G.r,1)+" mm"; sb.val.textContent=f(+sb.input.value,1)+" mm";
      var dim=cc.fit(),W=dim.w,H=dim.h,ctx=cc.ctx; ctx.clearRect(0,0,W,H);
      var cond=Math.max(2,G.d*0.35), xmin=-cond-0.5, xmax=G.d+cond+0.5;
      var ytop=Math.max(G.k===2?G.r:0,2)+1.5, ybot=-(G.k===1?G.g:0)-2.5;
      var sc=Math.min((W-40)/(xmax-xmin),(H-60)/(ytop-ybot));
      var ox=(W-(xmax-xmin)*sc)/2-xmin*sc, oy=24+ytop*sc;
      function X(x){return ox+x*sc;} function Y(y){return oy-y*sc;}
      // 絶縁物
      ctx.fillStyle=C("--panel");ctx.strokeStyle=C("--ink");ctx.lineWidth=1.3;ctx.beginPath();
      var body=[[xmin,0]];
      if(G.k===1){var a=(G.d-G.w)/2;body=body.concat([[a,0],[a,-G.g],[a+G.w,-G.g],[a+G.w,0]]);}
      if(G.k===2){var a2=(G.d-G.b)/2;body=body.concat([[a2,0],[a2,G.r],[a2+G.b,G.r],[a2+G.b,0]]);}
      body=body.concat([[xmax,0],[xmax,ybot+0.5],[xmin,ybot+0.5]]);
      body.forEach(function(p,i){i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1]));});
      ctx.closePath();ctx.fill();ctx.stroke();
      lab(ctx,"絶縁物",X(xmin)+6,Y(ybot+0.5)-8,C("--muted"),"left",10);
      // 導体
      var th=Math.max(0.35,4/sc);
      ctx.fillStyle=C("--alias");
      ctx.fillRect(X(xmin+0.3),Y(th),X(0)-X(xmin+0.3),Y(0)-Y(th));
      ctx.fillRect(X(G.d),Y(th),X(xmax-0.3)-X(G.d),Y(0)-Y(th));
      lab(ctx,"導体 A",X(0)-4,Y(th)-6,C("--alias"),"right",11);
      lab(ctx,"導体 B",X(G.d)+4,Y(th)-6,C("--alias"),"left",11);
      // 経路
      function path(pts,col,lw,dash,dy){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash(dash||[]);ctx.beginPath();
        pts.forEach(function(p,i){var xx=X(p[0]),yy=Y(p[1])+(dy||0);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.stroke();ctx.setLineDash([]);}
      path(G.sp,C("--signal"),3.2,null,2);
      path(G.cp,C("--blue"),2,[6,4],-3);
      if(G.k===1&&G.bridged){ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;ctx.setLineDash([2,2]);
        var a3=(G.d-G.w)/2;ctx.strokeRect(X(a3),Y(0),X(a3+G.w)-X(a3),Y(-G.g)-Y(0));ctx.setLineDash([]);
        lab(ctx,"w < X: 橋渡し",X(G.d/2),Y(-G.g)+14,C("--alias"),"center",10);}
      // 平面距離の寸法
      var yd=Y(ybot+0.5)+16; ctx.strokeStyle=C("--muted");ctx.lineWidth=1;ctx.beginPath();
      ctx.moveTo(X(0),yd);ctx.lineTo(X(G.d),yd);ctx.moveTo(X(0),yd-4);ctx.lineTo(X(0),yd+4);ctx.moveTo(X(G.d),yd-4);ctx.lineTo(X(G.d),yd+4);ctx.stroke();
      lab(ctx,"d = "+f(G.d,1)+" mm",X(G.d/2),yd-5,C("--muted"),"center",10);
      lab(ctx,"━ 沿面距離",10,16,C("--signal"),"left",11);
      lab(ctx,"- - 空間距離",110,16,C("--blue"),"left",11);
      var note=G.k===0?"平面では両方とも d":(G.k===1?(G.bridged?"溝の幅 w が X 未満なので橋渡しされ、沿面距離は d のまま":"溝の幅 w が X 以上なので、溝の輪郭に沿って測る（d + 2g）")
                      :"リブの上の 2 つの角を通る折れ線が空間距離、壁を上り下りする道が沿面距離（d + 2r）");
      ro.innerHTML=tbl(['<span style="color:'+C("--blue")+'">■</span> 空間距離（空気中の最短）',
          '<span style="color:'+C("--signal")+'">■</span> 沿面距離（表面に沿った最短）'],
        [["<b>"+f(G.c,2)+" mm</b>","<b>"+f(G.s,2)+" mm</b>"]],["left","left"])+
        '<div style="padding:.4rem .7rem;line-height:1.6">'+note+'<br>必要な値は、電圧・汚損度・材料グループ・絶縁の種類から規格の表で決まる。</div>';
    }
    [sd,sX,sw,sg,sr,sb].forEach(function(s){s.input.addEventListener("input",draw);});
    sk.addEventListener("change",draw);
    reg(cv,draw); draw();
  };

  /* ============ 16. button — ヒンジ式ボタンの押し荷重とひずみ ============ */
  REG.button=function(el){
    head(el,"16","ヒンジ式ボタンの押し荷重とひずみ");
    var MAT=[["ABS",2300],["PC",2300],["PC/ABS",2300],["POM",2800],["PP",1500]];
    var row=ctrls(el);
    var sL=slider(row,"ヒンジの長さ L",3,15,8,0.5), sT=slider(row,"厚さ t",0.4,1.5,0.8,0.05),
        sB=slider(row,"幅 b",2,8,4,0.5), sD=slider(row,"押し込み量 δ",0.1,1.0,0.5,0.05),
        sS=slider(row,"スイッチの作動荷重",0,3,1.6,0.1);
    var sel=select(row,"材料（E は代表値）",MAT.map(function(m){return m[0]+"  E = "+m[1]+" MPa";}));
    sel.value="1";
    var cv=screen(el,260), cc=cctx(cv), ro=readout(el);
    function calc(E,L,t,b,d){var I=b*t*t*t/12,P=3*E*I*d/(L*L*L),eps=3*t*d/(2*L*L);return {I:I,P:P,eps:eps,sig:E*eps};}
    function draw(){
      var L=+sL.input.value,t=+sT.input.value,b=+sB.input.value,d=+sD.input.value,Fs=+sS.input.value;
      var E=MAT[+sel.value][1];
      sL.val.textContent=f(L,1)+" mm"; sT.val.textContent=f(t,2)+" mm"; sB.val.textContent=f(b,1)+" mm";
      sD.val.textContent=f(d,2)+" mm"; sS.val.textContent=f(Fs,1)+" N";
      var r=calc(E,L,t,b,d);
      // 縦軸の上限: L=3..15 の範囲の P の最大値（上限 20 N）から決める
      var pmax=0,emax=0;
      for(var x=3;x<=15.001;x+=0.1){var q=calc(E,x,t,b,d);if(q.P<20)pmax=Math.max(pmax,q.P);emax=Math.max(emax,q.eps*100);}
      var tops=[0.5,1,2,5,10,20],yt=20;for(var i=0;i<tops.length;i++)if(Math.min(pmax,r.P*2.5+0.5)<=tops[i]){yt=tops[i];break;}
      var et=[0.5,1,2,5,10,20],ye=20;for(i=0;i<et.length;i++)if(Math.min(emax,r.eps*100*2.5+0.2)<=et[i]){ye=et[i];break;}
      var c=chart(cc,3,15,0,yt,{l:50,r:52,b:32,t:22});
      grid(c,5); axis(c);
      for(var k=0;k<=5;k++){
        lab(c.ctx,f(yt*k/5,1),c.p.l-6,c.Y(yt*k/5)+4,C("--signal"),"right",10);
        lab(c.ctx,f(ye*k/5,1),c.w-c.p.r+6,c.Y(yt*k/5)+4,C("--alias"),"left",10);
      }
      for(x=3;x<=15;x+=2)lab(c.ctx,x+"",c.X(x),c.h-14,C("--muted"),"center",10);
      lab(c.ctx,"L [mm]",c.w-c.p.r,c.h-2,C("--muted"),"right",10);
      lab(c.ctx,"押し荷重 P [N]",c.p.l,c.p.t-8,C("--signal"),"left",10);
      lab(c.ctx,"ひずみ ε [%]",c.w-c.p.r,c.p.t-8,C("--alias"),"right",10);
      var pp=[],pe=[];
      for(x=3;x<=15.001;x+=0.05){var q=calc(E,x,t,b,d);
        pp.push([x,Math.min(q.P,yt*1.05)]);pe.push([x,Math.min(q.eps*100/ye*yt,yt*1.05)]);}
      c.ctx.save();c.ctx.beginPath();c.ctx.rect(c.p.l,c.p.t,c.w-c.p.l-c.p.r,c.h-c.p.t-c.p.b);c.ctx.clip();
      line(c,pp,C("--signal"),2.4); line(c,pe,C("--alias"),2,[6,4]);
      c.ctx.restore();
      if(r.P<=yt)dot(c,L,r.P,5,C("--signal"));
      if(r.eps*100<=ye)dot(c,L,r.eps*100/ye*yt,5,C("--alias"),true);
      ro.innerHTML=tbl(["量","式","値"],[
        ["断面二次モーメント I","bt³/12",f(r.I,4)+" mm⁴"],
        ['<span style="color:'+C("--signal")+'">■</span> ヒンジの押し荷重 P',"3EIδ/L³","<b>"+f(r.P,2)+" N</b>"],
        ["剛性 k","P/δ",f(r.P/d,2)+" N/mm"],
        ['<span style="color:'+C("--alias")+'">■</span> 根元のひずみ ε',"3tδ/(2L²)","<b>"+f(r.eps*100,2)+" %</b>"],
        ["根元の曲げ応力 σ","Eε",f(r.sig,1)+" MPa"],
        ["指が感じる力（スイッチ作動時）","P + スイッチ",f(r.P+Fs,2)+" N"]],["left","left","right"])+
        '<div style="color:var(--muted);font-size:.75rem;margin-top:.4rem">ε は材料によらない。繰り返しに耐えるかは材料の疲労データと繰り返し押し試験で確かめる。</div>';
    }
    [sL,sT,sB,sD,sS].forEach(function(s){s.input.addEventListener("input",draw);});
    sel.addEventListener("change",draw); reg(cv,draw); draw();
  };

  /* ============ 17. checklist — 全章のチェックリスト ============ */
  REG.checklist=function(el){
    head(el,"17","全章のチェックリスト");
    var CH=[
      ["01","筐体設計とは",["使用環境・作る数・目標コスト・守る規格を書き出した","作る数から製法を選んだ（初期費用 F と変動費 v）","EVT / DVT / PVT の日程と評価項目を決めた"]],
      ["02","力と変形",["荷重がかかる部分の応力 σ と安全率を確かめた","たわみ δ と剛性 k を見積もった"]],
      ["03","材料",["使用温度に対して荷重たわみ温度に余裕がある","長時間荷重がかかる部分のクリープを考えた","必要な難燃性の等級を確かめた"]],
      ["04","射出成形",["すべての立ち壁に抜き勾配がある","肉厚が均一で急変が無い","アンダーカットを無くしたか、スライドの費用を見込んだ"]],
      ["05","リブとボス",["リブの厚さと高さが目安の範囲にある","ボスを壁やガセットで支えた","外面のひけを確かめた"]],
      ["06","板金",["曲げ半径が最小曲げ半径以上","展開長を曲げ代から計算した","穴と曲げの距離を確保した"]],
      ["07","公差",["重要な寸法の積み上げを計算した（ワーストケースと RSS）","一般公差と個別の公差を図面で区別した"]],
      ["08","ねじ締結",["締付トルクと軸力を決めた","ボスの下穴を業者の基準で決めた","ゆるみ対策を決めた"]],
      ["09","スナップフィット",["根元ひずみが許容ひずみ以下","組み付け力と外し方を確かめた"]],
      ["10","内部の収め方",["基板の固定とクリアランスを決めた","熱膨張差を見積もった","コネクタと穴の位置合わせを確かめた"]],
      ["11","落下と衝撃",["落下の高さから速度と加速度を見積もった","角落下・面落下で弱い所を確かめた"]],
      ["12","防水と防塵",["目標の IP コードを決めた","ガスケットのつぶし率と溝を決めた","温度変化による内部圧力を考えた"]],
      ["13","熱設計",["発熱と許容温度から熱抵抗の目標を決めた","表面温度を確かめた"]],
      ["14","EMC",["開口（スロット）の長さと遮蔽効果を確かめた","接地と導電ガスケットの経路を決めた","ESD の経路を考えた"]],
      ["15","安全と規格",["エネルギー源を分類し、安全防護を決めた","防火用筐体の要否と材料の難燃性を確かめた","空間距離・沿面距離と試験指を確かめた"]],
      ["16","外観と操作部",["意匠面を決め、成形の跡の位置を合意した","見切りを段や溝にした","印刷の摩耗を確かめた","ボタンの押し荷重とひずみを計算した","導光の曲げと光漏れを確かめた"]]
    ];
    var KEY="enclosure-17-checklist", st={};
    try{var raw=window.localStorage.getItem(KEY);if(raw)st=JSON.parse(raw)||{};}catch(e){st={};}
    function save(){try{window.localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
    var row=ctrls(el), bAll=button(row,"すべてチェック"), bClr=button(row,"すべて外す");
    var cv=screen(el,170), cc=cctx(cv), ro=readout(el);
    var list=mk("div");list.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.6rem 1rem;margin-top:.8rem";
    el.appendChild(list);
    var boxes=[];
    CH.forEach(function(ch,ci){
      var g=mk("div");g.style.cssText="border:1px solid var(--line);border-radius:10px;padding:.5rem .7rem;background:var(--screen)";
      g.appendChild(mk("div",null,'<b style="font-family:var(--mono);color:var(--signal)">'+ch[0]+'</b> <span style="font-size:.85rem;font-weight:700">'+esc(ch[1])+'</span>'));
      ch[2].forEach(function(t,ti){
        var id=ch[0]+"-"+ti, lb=mk("label");
        lb.style.cssText="display:flex;gap:.45rem;align-items:flex-start;font-size:.82rem;line-height:1.45;margin-top:.3rem;cursor:pointer";
        var cb=mk("input");cb.type="checkbox";cb.checked=!!st[id];cb.style.cssText="flex:none;margin:.2rem 0 0;accent-color:var(--signal)";
        lb.appendChild(cb);lb.appendChild(mk("span",null,esc(t)));g.appendChild(lb);
        cb.addEventListener("change",function(){if(cb.checked)st[id]=1;else delete st[id];save();draw();});
        boxes.push([id,cb,ci]);
      });
      list.appendChild(g);
    });
    function setAll(v){boxes.forEach(function(b){b[1].checked=v;if(v)st[b[0]]=1;else delete st[b[0]];});save();draw();}
    bAll.addEventListener("click",function(){setAll(true);});
    bClr.addEventListener("click",function(){setAll(false);});
    function draw(){
      var n=CH.map(function(){return 0;}),m=CH.map(function(c){return c[2].length;}),tot=0;
      boxes.forEach(function(b){if(b[1].checked){n[b[2]]++;tot++;}});
      var c=chart(cc,-0.5,CH.length-0.5,0,100,{l:40,r:10,t:24,b:26});
      grid(c,4); axis(c);
      for(var k=0;k<=4;k++)lab(c.ctx,(k*25)+"",c.p.l-6,c.Y(k*25)+4,C("--muted"),"right",10);
      lab(c.ctx,"達成率 [%]",c.p.l-30,c.p.t-12,C("--muted"),"left",10);
      var bw=Math.max(4,(c.X(1)-c.X(0))*0.62);
      CH.forEach(function(ch,i){
        var p=100*n[i]/m[i], x=c.X(i)-bw/2;
        c.ctx.fillStyle=C("--line");rrect(c.ctx,x,c.Y(100),bw,c.Y(0)-c.Y(100),3);c.ctx.globalAlpha=0.35;c.ctx.fill();c.ctx.globalAlpha=1;
        if(p>0){c.ctx.fillStyle=p>=100?C("--signal"):C("--blue");rrect(c.ctx,x,c.Y(p),bw,c.Y(0)-c.Y(p),3);c.ctx.fill();}
        lab(c.ctx,ch[0],c.X(i),c.h-10,C("--muted"),"center",10);
      });
      var all=boxes.length, pc=Math.round(100*tot/all), done=n.filter(function(v,i){return v===m[i];}).length;
      ro.innerHTML='<div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap">'+
        '<div style="flex:1;min-width:180px;height:12px;border-radius:6px;background:var(--line);overflow:hidden">'+
        '<div style="height:100%;width:'+pc+'%;background:var(--signal)"></div></div>'+
        '<b>'+tot+' / '+all+' 項目（'+pc+' %）</b><span style="color:var(--muted)">全項目チェック済みの章: '+done+' / '+CH.length+'</span></div>';
    }
    reg(cv,draw); draw();
  };

  /* ===== END CHAPTER WIDGETS ===== */

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
