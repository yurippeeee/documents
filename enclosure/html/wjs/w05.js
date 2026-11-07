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
