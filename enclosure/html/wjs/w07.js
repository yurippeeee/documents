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
