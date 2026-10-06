  /* ============ 08. torque — 締付トルクと軸力 ============ */
  REG.torque=function(el){
    head(el,"08","締付トルク T = KdF と軸力・ねじの応力");
    var S=[["M2",2,0.4],["M2.5",2.5,0.45],["M3",3,0.5],["M4",4,0.7],["M5",5,0.8],["M6",6,1.0]];
    var G=[["4.8（鋼）",320],["8.8（鋼）",640],["10.9（鋼）",900],["A2-50（ステンレス）",210],["A2-70（ステンレス）",450]];
    var row=ctrls(el);
    var sS=select(row,"ねじの大きさ",S.map(function(s){return s[0]+" × "+s[2];}));
    var sC=select(row,"強度区分（降伏応力の呼び値）",G.map(function(g){return g[0]+" "+g[1]+" MPa";}));
    sS.value="2";
    var row2=ctrls(el);
    var sK=slider(row2,"トルク係数 K",0.10,0.35,0.20,0.005);
    var sT=slider(row2,"締付トルク T（対数）",-1.6,1.3,Math.log10(0.6),0.005);
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function geom(i){var d=S[i][1],P=S[i][2],d2=d-0.649519*P,d3=d-1.226869*P;
      return {d:d,P:P,d2:d2,d3:d3,As:Math.PI/4*Math.pow((d2+d3)/2,2)};}
    function draw(){
      var g=geom(+sS.value), sy=G[+sC.value][1], K=+sK.input.value, T=Math.pow(10,+sT.input.value); /* N·m */
      sK.val.textContent=f(K,3); sT.val.textContent=f(T,T<1?3:2)+" N·m";
      var F=T*1000/(K*g.d), sig=F/g.As;
      /* 横軸: 降伏させるトルク（K = 0.35 のとき）まで */
      function nice(x){var e=Math.pow(10,Math.floor(Math.log10(x))),m=x/e;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*e;}
      var ts=nice(Math.max(1.15*sy*g.As*0.35*g.d/1000,T*1.08)/4), Tmax=4*ts;
      var ss=nice(1.3*sy/5), smax=5*ss;
      var c=chart(cc,0,Tmax,0,smax,{l:52,b:30,r:16}),ctx=c.ctx;
      grid(c,5);axis(c);
      for(var i=0;i<=5;i++){var v=ss*i;lab(ctx,f(v,0),c.p.l-6,c.Y(v)+4,C("--muted"),"right",10);}
      for(var j=0;j<=4;j++){var t=ts*j;lab(ctx,f(t,(ts>=1&&ts%1==0)?0:(Math.abs(ts*10-Math.round(ts*10))<1e-9?1:2)),c.X(t),c.h-12,C("--muted"),j==4?"right":"center",10);}
      lab(ctx,"T [N·m]",c.w-c.p.r-4,c.h-c.p.b-6,C("--muted"),"right",10);
      lab(ctx,"σ [MPa]",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      line(c,[[0,sy],[Tmax,sy]],C("--alias"),1.6,[6,4]);
      lab(ctx,"降伏応力 "+sy+" MPa",c.w-c.p.r-4,c.Y(sy)-5,C("--alias"),"right",10);
      line(c,[[0,0.7*sy],[Tmax,0.7*sy]],C("--faint"),1.2,[3,4]);
      lab(ctx,"70 %",c.w-c.p.r-4,c.Y(0.7*sy)-5,C("--faint"),"right",10);
      function sl(k){return 1000/(k*g.d*g.As);} /* MPa per N·m */
      [0.1,0.3].forEach(function(k){line(c,[[0,0],[Math.min(Tmax,smax/sl(k)),Math.min(smax,Tmax*sl(k))]],C("--muted"),1,[2,3]);});
      var ex=Math.min(Tmax,smax/sl(K));
      line(c,[[0,0],[ex,ex*sl(K)]],C("--signal"),2.4);
      lab(ctx,"K=0.1",c.X(Math.min(Tmax,smax/sl(0.1)))-4,c.Y(Math.min(smax,Tmax*sl(0.1)))+14,C("--muted"),"right",9.5);
      lab(ctx,"K=0.3",c.X(Math.min(Tmax,smax/sl(0.3)))-4,c.Y(Math.min(smax,Tmax*sl(0.3)))+14,C("--muted"),"right",9.5);
      if(sig<=smax)dot(c,T,sig,5,C(sig>sy?"--alias":"--signal"));
      var r=sig/sy, col=r>1?"var(--alias)":(r>0.7?"var(--alias)":"var(--signal)");
      var msg=r>1?"降伏する":(r>0.7?"締めすぎの恐れ（ねじり応力も加わる）":"目安の範囲内");
      ro.innerHTML=tbl(["項目","値"],[
        ["有効径 d₂ / 谷の径 d₃",f(g.d2,3)+" / "+f(g.d3,3)+" mm"],
        ["有効断面積 A<sub>s</sub>",f(g.As,2)+" mm²"],
        ["締付トルク T",f(T*1000,0)+" N·mm"],
        ["軸力 F = T / (K d)",f(F,0)+" N"],
        ["引張応力 σ = F / A<sub>s</sub>",f(sig,0)+" MPa"],
        ["σ / 降伏応力",'<b style="color:'+col+'">'+f(r*100,0)+" %　"+msg+"</b>"],
        ["70 % で締めるトルクの目安",f(0.7*sy*g.As*K*g.d/1000,2)+" N·m"]
      ],["left","right"]);
    }
    [sS,sC].forEach(function(s){s.addEventListener("change",draw);});
    [sK,sT].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };
