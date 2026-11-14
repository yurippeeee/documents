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
