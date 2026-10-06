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
