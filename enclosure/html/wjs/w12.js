  /* ============ 12. oring — O リングのつぶし率と充填率 ============ */
  REG.oring=function(el){
    head(el,"12","O リングのつぶし率と充填率");
    var row=ctrls(el);
    var sd=slider(row,"線径 d",1.0,6.0,2.4,0.1);
    var sh=slider(row,"溝深さ h",0.5,6.0,1.8,0.05);
    var sb=slider(row,"溝幅 b",1.0,8.0,3.4,0.05);
    var cv=screen(el,230), cc=cctx(cv), ro=readout(el);
    function draw(){
      var d=+sd.input.value, h=+sh.input.value, b=+sb.input.value;
      sd.val.textContent=f(d,1)+" mm"; sh.val.textContent=f(h,2)+" mm"; sb.val.textContent=f(b,2)+" mm";
      var sq=(d-h)/d*100, A=Math.PI*d*d/4, fill=A/(b*h)*100;
      var r=cc.fit(), ctx=cc.ctx, w=r.w, H=r.h; ctx.clearRect(0,0,w,H);
      // 図の縮尺: 溝＋周囲が収まるように
      var span=Math.max(b+4, d+4)*1.0, sc=Math.min((w-40)/span, (H-60)/Math.max(d,h)/1.6);
      var cx=w*0.5, base=H-34;                       // 溝の底
      var gw=b*sc, gh=h*sc;
      var mat=C("--muted"), sig=C("--signal"), ali=C("--alias");
      ctx.globalAlpha=0.22; ctx.fillStyle=mat;
      ctx.fillRect(cx-gw/2-2*sc,base-gh,2*sc,gh+20); ctx.fillRect(cx+gw/2,base-gh,2*sc,gh+20);
      ctx.fillRect(cx-gw/2,base,gw,20);
      ctx.fillRect(cx-gw/2-2*sc,base-gh-16,gw+4*sc,16);
      ctx.globalAlpha=1; ctx.strokeStyle=mat; ctx.lineWidth=1.2;
      ctx.strokeRect(cx-gw/2-2*sc,base-gh,2*sc,gh+20); ctx.strokeRect(cx+gw/2,base-gh,2*sc,gh+20);
      ctx.strokeRect(cx-gw/2,base,gw,20); ctx.strokeRect(cx-gw/2-2*sc,base-gh-16,gw+4*sc,16);
      // 元の円（破線）: 溝の底に接して置く
      var R=d/2*sc;
      ctx.setLineDash([4,3]); ctx.strokeStyle=C("--faint"); ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.arc(cx,base-R,R,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      // つぶした形（面積一定の長円、概略）
      if(h<d){
        var Wd=h+(A-Math.PI*h*h/4)/h, ww=Wd*sc;
        ctx.fillStyle=C("--signal-soft"); ctx.strokeStyle=sig; ctx.lineWidth=1.8;
        rrect(ctx,cx-ww/2,base-gh,ww,gh,gh/2); ctx.fill(); ctx.stroke();
        if(Wd>b){ ctx.strokeStyle=ali; ctx.lineWidth=2.4; rrect(ctx,cx-ww/2,base-gh,ww,gh,gh/2); ctx.stroke(); }
      }
      lab(ctx,"破線: つぶす前の O リング　緑: つぶした後（形は概略）",10,16,C("--muted"),"left",10.5);
      lab(ctx,"溝幅 b",cx,base+15,C("--muted"),"center",10);
      var sqOK = sq>=15&&sq<=30, sqTxt = h>=d?"つぶれない（隙間）":sq<10?"不足":sq<15?"少なめ":sq<=30?"範囲内":"過大";
      var flTxt = fill>100?"入らない":fill>85?"過大（はみ出す）":fill>75?"やや多い":"範囲内";
      function col(ok,warn){return ok?"var(--signal)":(warn?"var(--muted)":"var(--alias)");}
      ro.innerHTML=tbl(["量","式","値","判定（代表値の目安）"],[
        ["つぶし率","(d − h)/d","<b>"+f(sq,1)+" %</b>",'<span style="color:'+col(sqOK, sq>=10&&sq<15)+'">'+sqTxt+"</span>（15〜30 %）"],
        ["O リングの断面積","πd²/4",f(A,2)+" mm²",""],
        ["溝の断面積","b·h",f(b*h,2)+" mm²",""],
        ["充填率","(πd²/4)/(b·h)","<b>"+f(fill,1)+" %</b>",'<span style="color:'+col(fill<=75, fill>75&&fill<=85)+'">'+flTxt+"</span>（85 % 以下）"]
      ],["left","left","right","left"]);
    }
    [sd,sh,sb].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };

  /* ============ 12. pressure — 温度変化と内外の圧力差 ============ */
  REG.pressure=function(el){
    head(el,"12","密閉した筐体の温度変化と内外の圧力差");
    var row=ctrls(el);
    var s1=slider(row,"密閉したときの温度 θ₁",-20,60,25,1);
    var s2=slider(row,"その後の温度 θ₂",-40,85,-10,1);
    var sA=slider(row,"ふたの面積 A",500,20000,6000,100);
    var cv=screen(el,240), cc=cctx(cv), ro=readout(el);
    var P0=101.325;
    function draw(){
      var t1=+s1.input.value, t2=+s2.input.value, A=+sA.input.value;
      s1.val.textContent=t1+" °C"; s2.val.textContent=t2+" °C"; sA.val.textContent=A.toLocaleString()+" mm²";
      var T1=t1+273.15;
      function dp(t){return P0*((t+273.15)/T1-1);}
      var c=chart(cc,-40,85,-30,30,{l:48,b:32});
      grid(c,6); axis(c);
      for(var x=-40;x<=80;x+=20)lab(c.ctx,x+(x==80?" °C":""),c.X(x),c.h-12,C("--muted"),x==80?"right":"center",10);
      for(var y=-30;y<=30;y+=10)lab(c.ctx,(y>0?"+":"")+y,c.p.l-6,c.Y(y)+4,C("--muted"),"right",10);
      lab(c.ctx,"内圧 − 外圧 [kPa]",c.p.l+6,c.p.t+10,C("--muted"),"left",10);
      c.ctx.strokeStyle=C("--line");c.ctx.lineWidth=1;c.ctx.beginPath();c.ctx.moveTo(c.X(-40),c.Y(0));c.ctx.lineTo(c.X(85),c.Y(0));c.ctx.stroke();
      line(c,[[-40,dp(-40)],[85,dp(85)]],C("--blue"),2.2);
      dot(c,t1,0,5,C("--muted"));
      var d=dp(t2);
      dot(c,t2,d,5.5,d<0?C("--alias"):C("--signal"));
      lab(c.ctx,"密閉",c.X(t1),c.Y(0)-10,C("--muted"),"center",10);
      var p2=P0+d, depth=Math.abs(d)*1000/(1000*9.81), F=Math.abs(d)*1e-3*A;
      ro.innerHTML=tbl(["量","式","値"],[
        ["絶対温度 T₁, T₂","θ + 273.15",f(T1,2)+" K, "+f(t2+273.15,2)+" K"],
        ["内圧 p₂","p₁·T₂/T₁（p₁ = 101.3 kPa）",f(p2,1)+" kPa"],
        ["内外の圧力差 Δp","p₂ − p₁",'<b style="color:'+(d<0?"var(--alias)":"var(--signal)")+'">'+(d>0?"+":"")+f(d,1)+" kPa</b>"+(d<0?"（負圧: 吸い込む）":d>0?"（正圧: 押し出す）":"")],
        ["同じ圧力の水深","|Δp| / (ρg)",f(depth,2)+" m"],
        ["ふたにかかる力","|Δp|·A","<b>"+f(F,1)+" N</b>"]
      ],["left","left","right"]);
    }
    [s1,s2,sA].forEach(function(q){q.input.addEventListener("input",draw);});
    reg(cv,draw); draw();
  };
