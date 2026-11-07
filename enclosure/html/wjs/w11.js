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
