  /* ============ 04. cooling — 肉厚と冷却時間 ============ */
  REG.cooling=function(el){
    head(el,"04","肉厚と冷却時間");
    // [名前, a mm^2/s, Tm, Tw, Te]（代表値）
    var M=[["ABS",0.10,230,60,90],["PC",0.11,300,90,130],["PP",0.08,230,40,90],["PA66",0.10,285,80,150]];
    var row=ctrls(el), sel=select(row,"材料（物性は代表値）",M.map(function(m){return m[0];}));
    var sS=slider(row,"肉厚 s",0.5,5,2,0.1), sW=slider(row,"金型温度 T_w",20,120,60,1);
    var row2=ctrls(el), sO=slider(row2,"冷却以外の時間",3,30,10,0.5);
    var cv=screen(el,260), cc=cctx(cv), ro=readout(el);
    function tc(s,a,Tm,Tw,Te){var r=4/Math.PI*(Tm-Tw)/(Te-Tw);return r>1?s*s/(Math.PI*Math.PI*a)*Math.log(r):0;}
    function setMat(){var m=M[+sel.value];sW.input.value=m[3];}
    function draw(){
      var m=M[+sel.value],s=+sS.input.value,Tw=+sW.input.value,ot=+sO.input.value;
      if(Tw>m[4]-5){Tw=m[4]-5;sW.input.value=Tw;}
      sS.val.textContent=f(s,1)+" mm"; sW.val.textContent=Tw+" °C"; sO.val.textContent=f(ot,1)+" s";
      var c=chart(cc,0,5,0,60,{l:46,b:32,r:16});
      grid(c,6); axis(c);
      for(var k=0;k<=5;k++)lab(c.ctx,k+(k==5?" mm":""),c.X(k),c.h-14,C("--muted"),k==5?"right":"center",10);
      for(var j=0;j<=6;j++)lab(c.ctx,String(j*10),c.p.l-6,c.Y(j*10)+4,C("--muted"),"right",10);
      lab(c.ctx,"t_c [s]",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      // 他の材料（標準の金型温度）を薄く
      M.forEach(function(q,i){if(i==+sel.value)return;var pts=[];
        for(var x=0;x<=5.001;x+=0.05)pts.push([x,Math.min(60,tc(x,q[1],q[2],q[3],q[4]))]);
        line(c,pts,C("--faint"),1.2,[4,4]);
        var xe=5,ye=tc(5,q[1],q[2],q[3],q[4]);if(ye>58){xe=Math.sqrt(58/tc(1,q[1],q[2],q[3],q[4]));ye=58;}
        lab(c.ctx,q[0],c.X(xe)-4,c.Y(ye)-4,C("--faint"),"right",10);});
      var pts=[];for(var x=0;x<=5.001;x+=0.05)pts.push([x,Math.min(60,tc(x,m[1],m[2],Tw,m[4]))]);
      line(c,pts,C("--signal"),2.4);
      var t=tc(s,m[1],m[2],Tw,m[4]);
      c.ctx.strokeStyle=C("--ink");c.ctx.setLineDash([4,4]);c.ctx.beginPath();
      c.ctx.moveTo(c.X(s),c.p.t);c.ctx.lineTo(c.X(s),c.h-c.p.b);c.ctx.stroke();c.ctx.setLineDash([]);
      if(t<=60)dot(c,s,t,5,C("--signal"));
      lab(c.ctx,m[0]+"  t_c = "+f(t,1)+" s",c.X(s)+(s>3.2?-8:8),c.p.t+14,C("--ink"),s>3.2?"right":"left",11);
      var tau=s*s/(Math.PI*Math.PI*m[1]),r=4/Math.PI*(m[2]-Tw)/(m[4]-Tw);
      var t2=tc(2,m[1],m[2],Tw,m[4]),cyc=t+ot;
      ro.innerHTML=tbl(["量","値"],[
        ["a / T_m / T_e（代表値）",f(m[1],2)+" mm²/s / "+m[2]+" °C / "+m[4]+" °C"],
        ["時定数 s²/(π²a)",f(tau,2)+" s"],
        ["対数の中身 → ln",f(r,2)+" → ln = "+f(Math.log(r),3)],
        ["<b>冷却時間 t_c</b>","<b>"+f(t,1)+" s</b>（2 mm の "+f(t/t2,2)+" 倍）"],
        ["1 ショットの時間（t_c + 冷却以外）",f(cyc,1)+" s"],
        ["1 時間あたりのショット数",Math.floor(3600/cyc).toLocaleString()+" ショット"]
      ],["left","right"]);
    }
    sel.addEventListener("change",function(){setMat();draw();});
    [sS,sW,sO].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };
