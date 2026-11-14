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
