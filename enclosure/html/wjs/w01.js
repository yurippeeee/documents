  /* ============ 01. cost — 作る数と 1 個あたりの費用 ============ */
  REG.cost=function(el){
    head(el,"01","作る数と 1 個あたりの費用");
    var M=[["3D プリント",0,5000,"--signal"],["注型",1e5,2000,"--alias"],
           ["射出（アルミ簡易型）",1e6,150,"--blue"],["射出（鋼の量産型）",3e6,80,"--muted"]];
    var row=ctrls(el), sN=slider(row,"作る数 N（対数）",0,6,2,0.01);
    var cv=screen(el,260), cc=cctx(cv), ro=readout(el);
    function N(){return Math.round(Math.pow(10,+sN.input.value));}
    function draw(){
      var n=N(); sN.val.textContent=n.toLocaleString()+" 個";
      var c=chart(cc,0,6,1,7,{l:52,b:30});
      grid(c,6); axis(c);
      var NM=["1","10","100","1000","1万","10万","100万","1000万"];
      for(var e=0;e<=6;e++)lab(c.ctx,NM[e]+(e==6?" 個":""),c.X(e),c.h-12,C("--muted"),e==6?"right":"center",10);
      for(var k=1;k<=7;k++)lab(c.ctx,NM[k],c.p.l-6,c.Y(k)+4,C("--muted"),"right",10);
      lab(c.ctx,"円/個",c.p.l+4,c.p.t+2,C("--muted"),"left",10);
      M.forEach(function(m){
        var pts=[];for(var x=0;x<=6;x+=0.05){var u=m[1]/Math.pow(10,x)+m[2];pts.push([x,Math.log10(u)]);}
        line(c,pts,C(m[3]),2.2);
      });
      var lx=Math.log10(n);
      c.ctx.strokeStyle=C("--ink");c.ctx.setLineDash([4,4]);c.ctx.beginPath();
      c.ctx.moveTo(c.X(lx),c.p.t);c.ctx.lineTo(c.X(lx),c.h-c.p.b);c.ctx.stroke();c.ctx.setLineDash([]);
      var best=0,rows=M.map(function(m,i){var u=m[1]/n+m[2];if(u<M[best][1]/n+M[best][2])best=i;return u;});
      M.forEach(function(m,i){dot(c,lx,Math.log10(rows[i]),4,C(m[3]));});
      ro.innerHTML=tbl(["製法","F/N + v [円/個]","総費用 [円]"],M.map(function(m,i){
        var b=i===best?"<b>":"",be=i===best?" ← 最安</b>":"";
        return ['<span style="color:'+C(m[3])+'">■</span> '+b+m[0]+(i===best?"</b>":""),
          b+Math.round(rows[i]).toLocaleString()+be,Math.round(m[1]+m[2]*n).toLocaleString()];}),
        ["left","right","right"]);
    }
    sN.input.addEventListener("input",draw); reg(cv,draw); draw();
  };
