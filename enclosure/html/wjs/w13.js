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
