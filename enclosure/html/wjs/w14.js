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
