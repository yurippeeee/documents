  /* ============ 09. snap — 片持ちスナップのひずみと力 ============ */
  REG.snap=function(el){
    head(el,"09","片持ちスナップ: ひずみ ε = 3hy/(2L²) と力 P, W");
    /* [名前, E (MPa), 許容ひずみ（1 回の組み付け、代表値）] */
    var M=[["ABS",2300,0.025],["PC",2300,0.04],["PC/ABS",2400,0.028],["POM",2800,0.055],
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
