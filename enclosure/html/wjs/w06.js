  /* ============ 06. bend — 曲げ代と展開長 ============ */
  REG.bend=function(el){
    head(el,"06","曲げ代と展開長（外寸は仮想シャープから測る）");
    var row=ctrls(el), sT=slider(row,"板厚 t",0.5,3,1,0.1), sR=slider(row,"内 R",0.2,5,1,0.1), sK=slider(row,"K 係数",0.25,0.5,0.4,0.01);
    var row2=ctrls(el), sA=slider(row2,"曲げ角度 θ",15,150,90,1), sAA=slider(row2,"外寸 A",5,60,20,1), sBB=slider(row2,"外寸 B",5,60,30,1);
    var cv=screen(el,300), cc=cctx(cv), ro=readout(el);
    function draw(){
      var t=+sT.input.value,R=+sR.input.value,K=+sK.input.value,deg=+sA.input.value,A=+sAA.input.value,B=+sBB.input.value;
      sT.val.textContent=f(t,1)+" mm";sR.val.textContent=f(R,1)+" mm ("+f(R/t,2)+" t)";sK.val.textContent=f(K,2);
      sA.val.textContent=deg+"°";sAA.val.textContent=A+" mm";sBB.val.textContent=B+" mm";
      var th=deg*Math.PI/180,os=(R+t)*Math.tan(th/2),BA=th*(R+K*t),BD=2*os-BA,L=A+B-BD;
      var ok=A>os&&B>os;
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      // 形状（局所座標 mm, y 上向き。P=原点）
      var O=[-os,R+t],u=[Math.cos(th),Math.sin(th)],n=[-Math.sin(th),Math.cos(th)];
      function arc(r,rev){var p=[];for(var k=0;k<=24;k++){var a=th*k/24;p.push([O[0]+r*Math.sin(a),O[1]-r*Math.cos(a)]);}return rev?p.reverse():p;}
      var Eo=[B*u[0],B*u[1]],Ei=[Eo[0]+t*n[0],Eo[1]+t*n[1]];
      var poly=[[-A,0]].concat(arc(R+t)).concat([Eo,Ei]).concat(arc(R,true)).concat([[-A,t]]);
      var xs=poly.map(function(p){return p[0];}).concat([0]),ys=poly.map(function(p){return p[1];}).concat([0]);
      var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
      var lw=w*0.5-20,top=24,bot=h-84;
      var sc=Math.min(lw/(x1-x0),(bot-top)/(y1-y0));
      var ox=14-x0*sc+(lw-(x1-x0)*sc)/2,oy=bot+y0*sc-((bot-top)-(y1-y0)*sc)/2;
      function S(p){return [ox+p[0]*sc,oy-p[1]*sc];}
      ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=1.5;
      ctx.beginPath();poly.forEach(function(p,i){var q=S(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.fill();ctx.stroke();
      // 中立面
      var rn=R+K*t,np=arc(rn);ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;ctx.beginPath();
      np.forEach(function(p,i){var q=S(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.stroke();
      // 仮想シャープ
      var P=S([0,0]),T1=S([O[0]+(R+t)*Math.sin(th),O[1]-(R+t)*Math.cos(th)]),T0=S([-os,0]);
      ctx.strokeStyle=C("--faint");ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.beginPath();
      ctx.moveTo(T0[0],T0[1]);ctx.lineTo(P[0],P[1]);ctx.lineTo(T1[0],T1[1]);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=C("--ink");ctx.beginPath();ctx.arc(P[0],P[1],3,0,Math.PI*2);ctx.fill();
      lab(ctx,"P",P[0]+6,P[1]+14,C("--ink"),"left",11);
      var Am=S([-A/2,0]);lab(ctx,"A = "+A,Am[0],Am[1]+16,C("--muted"),"center",10);
      var Bm=S([B/2*u[0]+0*n[0],B/2*u[1]]);lab(ctx,"B = "+B,Bm[0]+10,Bm[1],C("--muted"),"left",10);
      lab(ctx,"赤: 中立面（BA）",14,16,C("--alias"),"left",10);
      // 展開図（下）
      var fx0=14,fx1=w-14,fy=h-34,fs=(fx1-fx0)/Math.max(L,1);
      var segs=[[A-os,"--muted","--panel"],[BA,"--alias","--alias-soft"],[B-os,"--muted","--panel"]],xx=fx0;
      segs.forEach(function(sg){var ww=Math.max(0,sg[0])*fs;ctx.fillStyle=C(sg[2]);ctx.strokeStyle=C(sg[1]);ctx.lineWidth=1.2;
        ctx.beginPath();ctx.rect(xx,fy,ww,14);ctx.fill();ctx.stroke();
        if(ww>36)lab(ctx,f(sg[0],2),xx+ww/2,fy+28,C(sg[1]),"center",10);xx+=ww;});
      lab(ctx,"展開図  L = "+f(L,3)+" mm",fx0,fy-8,C("--ink"),"left",11);
      // 右の数値
      var rx=w*0.5+10;
      var lines=[["OSSB = (R+t)tan(θ/2)",f(os,3)+" mm"],["BA = θ(R+Kt)",f(BA,3)+" mm"],["BD = 2·OSSB − BA",f(BD,3)+" mm"],["展開長 L = A + B − BD",f(L,3)+" mm"]];
      lines.forEach(function(l,i){lab(ctx,l[0],rx,40+i*24,C("--muted"),"left",11);lab(ctx,l[1],w-14,40+i*24,i==3?C("--signal"):C("--ink"),"right",12);});
      var eps=1/(2*R/t+1);
      lab(ctx,"外側の面のひずみ（K=0.5 近似） "+f(eps*100,0)+" %",rx,40+4*24+10,eps>0.4?C("--alias"):C("--muted"),"left",11);
      if(!ok)lab(ctx,"外寸が OSSB より短く、平らな部分が残らない",rx,40+5*24+10,C("--alias"),"left",11);
      ro.innerHTML=tbl(["部分","長さ [mm]"],[
        ["辺 A の平らな部分 A − OSSB",f(A-os,3)],["曲げ代 BA（中立面の円弧）",f(BA,3)],["辺 B の平らな部分 B − OSSB",f(B-os,3)],
        ["<b>展開長 L</b>","<b>"+f(L,3)+"</b>"],
        ["参考: 内側の円弧 Rθ / 外側の円弧 (R+t)θ",f(R*th,3)+" / "+f((R+t)*th,3)]],["left","right"]);
    }
    [sT,sR,sK,sA,sAA,sBB].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };
