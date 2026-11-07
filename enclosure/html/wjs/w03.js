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
