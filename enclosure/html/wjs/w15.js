  /* ============ 15. creepage — 空間距離と沿面距離 ============ */
  REG.creepage=function(el){
    head(el,"15","空間距離と沿面距離（平面・溝・リブ）");
    var r1=ctrls(el),
        sk=select(r1,"形状",["平面","溝","リブ"]),
        sd=slider(r1,"平面距離 d",2,20,6,0.5),
        sX=slider(r1,"橋渡しの幅 X（仮の値）",0.25,3,1,0.05);
    var r2=ctrls(el),
        sw=slider(r2,"溝の幅 w",0.2,6,1.5,0.1),
        sg=slider(r2,"溝の深さ g",0.2,5,2,0.1),
        sr=slider(r2,"リブの高さ r",0.5,10,3,0.1),
        sb=slider(r2,"リブの厚さ b",0.5,4,1.5,0.1);
    sk.value="2";
    var cv=screen(el,250), cc=cctx(cv), ro=readout(el);
    function geo(){
      var k=+sk.value,d=+sd.input.value,X=+sX.input.value,
          w=Math.min(+sw.input.value,d-0.5),g=+sg.input.value,r=+sr.input.value,b=Math.min(+sb.input.value,d-0.5);
      var c=d,s=d,bridged=false,cp,sp; // 経路: [x,y] mm（y は上向き正）
      if(k===0){cp=[[0,0.15],[d,0.15]];sp=[[0,0],[d,0]];}
      else if(k===1){
        var a=(d-w)/2;cp=[[0,0.15],[d,0.15]];
        if(w>=X){s=d+2*g;sp=[[0,0],[a,0],[a,-g],[a+w,-g],[a+w,0],[d,0]];}
        else{bridged=true;s=d;sp=[[0,0],[d,0]];}
      }else{
        var a2=(d-b)/2;c=2*Math.sqrt(a2*a2+r*r)+b;s=d+2*r;
        cp=[[0,0.15],[a2,r+0.15],[a2+b,r+0.15],[d,0.15]];sp=[[0,0],[a2,0],[a2,r],[a2+b,r],[a2+b,0],[d,0]];
      }
      return {k:k,d:d,X:X,w:w,g:g,r:r,b:b,c:c,s:s,bridged:bridged,cp:cp,sp:sp};}
    function draw(){
      var G=geo();
      sd.val.textContent=f(G.d,1)+" mm"; sX.val.textContent=f(G.X,2)+" mm";
      sw.val.textContent=f(+sw.input.value,1)+" mm"; sg.val.textContent=f(G.g,1)+" mm";
      sr.val.textContent=f(G.r,1)+" mm"; sb.val.textContent=f(+sb.input.value,1)+" mm";
      var dim=cc.fit(),W=dim.w,H=dim.h,ctx=cc.ctx; ctx.clearRect(0,0,W,H);
      var cond=Math.max(2,G.d*0.35), xmin=-cond-0.5, xmax=G.d+cond+0.5;
      var ytop=Math.max(G.k===2?G.r:0,2)+1.5, ybot=-(G.k===1?G.g:0)-2.5;
      var sc=Math.min((W-40)/(xmax-xmin),(H-60)/(ytop-ybot));
      var ox=(W-(xmax-xmin)*sc)/2-xmin*sc, oy=24+ytop*sc;
      function X(x){return ox+x*sc;} function Y(y){return oy-y*sc;}
      // 絶縁物
      ctx.fillStyle=C("--panel");ctx.strokeStyle=C("--ink");ctx.lineWidth=1.3;ctx.beginPath();
      var body=[[xmin,0]];
      if(G.k===1){var a=(G.d-G.w)/2;body=body.concat([[a,0],[a,-G.g],[a+G.w,-G.g],[a+G.w,0]]);}
      if(G.k===2){var a2=(G.d-G.b)/2;body=body.concat([[a2,0],[a2,G.r],[a2+G.b,G.r],[a2+G.b,0]]);}
      body=body.concat([[xmax,0],[xmax,ybot+0.5],[xmin,ybot+0.5]]);
      body.forEach(function(p,i){i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1]));});
      ctx.closePath();ctx.fill();ctx.stroke();
      lab(ctx,"絶縁物",X(xmin)+6,Y(ybot+0.5)-8,C("--muted"),"left",10);
      // 導体
      var th=Math.max(0.35,4/sc);
      ctx.fillStyle=C("--alias");
      ctx.fillRect(X(xmin+0.3),Y(th),X(0)-X(xmin+0.3),Y(0)-Y(th));
      ctx.fillRect(X(G.d),Y(th),X(xmax-0.3)-X(G.d),Y(0)-Y(th));
      lab(ctx,"導体 A",X(0)-4,Y(th)-6,C("--alias"),"right",11);
      lab(ctx,"導体 B",X(G.d)+4,Y(th)-6,C("--alias"),"left",11);
      // 経路
      function path(pts,col,lw,dash,dy){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash(dash||[]);ctx.beginPath();
        pts.forEach(function(p,i){var xx=X(p[0]),yy=Y(p[1])+(dy||0);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);});ctx.stroke();ctx.setLineDash([]);}
      path(G.sp,C("--signal"),3.2,null,2);
      path(G.cp,C("--blue"),2,[6,4],-3);
      if(G.k===1&&G.bridged){ctx.strokeStyle=C("--alias");ctx.lineWidth=1.2;ctx.setLineDash([2,2]);
        var a3=(G.d-G.w)/2;ctx.strokeRect(X(a3),Y(0),X(a3+G.w)-X(a3),Y(-G.g)-Y(0));ctx.setLineDash([]);
        lab(ctx,"w < X: 橋渡し",X(G.d/2),Y(-G.g)+14,C("--alias"),"center",10);}
      // 平面距離の寸法
      var yd=Y(ybot+0.5)+16; ctx.strokeStyle=C("--muted");ctx.lineWidth=1;ctx.beginPath();
      ctx.moveTo(X(0),yd);ctx.lineTo(X(G.d),yd);ctx.moveTo(X(0),yd-4);ctx.lineTo(X(0),yd+4);ctx.moveTo(X(G.d),yd-4);ctx.lineTo(X(G.d),yd+4);ctx.stroke();
      lab(ctx,"d = "+f(G.d,1)+" mm",X(G.d/2),yd-5,C("--muted"),"center",10);
      lab(ctx,"━ 沿面距離",10,16,C("--signal"),"left",11);
      lab(ctx,"- - 空間距離",110,16,C("--blue"),"left",11);
      var note=G.k===0?"平面では両方とも d":(G.k===1?(G.bridged?"溝の幅 w が X 未満なので橋渡しされ、沿面距離は d のまま":"溝の幅 w が X 以上なので、溝の輪郭に沿って測る（d + 2g）")
                      :"リブの上の 2 つの角を通る折れ線が空間距離、壁を上り下りする道が沿面距離（d + 2r）");
      ro.innerHTML=tbl(['<span style="color:'+C("--blue")+'">■</span> 空間距離（空気中の最短）',
          '<span style="color:'+C("--signal")+'">■</span> 沿面距離（表面に沿った最短）'],
        [["<b>"+f(G.c,2)+" mm</b>","<b>"+f(G.s,2)+" mm</b>"]],["left","left"])+
        '<div style="padding:.4rem .7rem;line-height:1.6">'+note+'<br>必要な値は、電圧・汚損度・材料グループ・絶縁の種類から規格の表で決まる。</div>';
    }
    [sd,sX,sw,sg,sr,sb].forEach(function(s){s.input.addEventListener("input",draw);});
    sk.addEventListener("change",draw);
    reg(cv,draw); draw();
  };
