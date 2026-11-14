  /* ============ 13 章で共通に使う道具 ============ */
  /* 漸化式 s_{k+L} = c1 s_{k+L-1} ⊕ … ⊕ cL s_k の出力 s_0 … s_{n-1}。c = [c1..cL]、init = [s_0..s_{L-1}] */
  function c13seq(c,init,n){var s=init.slice(),L=c.length;
    while(s.length<n){var k=s.length-L,v=0;for(var i=0;i<L;i++)v^=c[i]&s[k+L-1-i];s.push(v);}return s.slice(0,n);}
  /* 特性多項式 x^L + c1 x^{L-1} + … + cL を HTML で */
  function c13poly(c){var L=c.length,t=["x<sup>"+L+"</sup>"];
    for(var i=1;i<=L;i++)if(c[i-1]){var e=L-i;t.push(e===0?"1":(e===1?"x":"x<sup>"+e+"</sup>"));}return t.join(" + ");}
  /* 0/1 の配列で表した多項式（下位から）どうしの剰余 */
  function c13pmod(a,m){a=a.slice();var dm=m.length-1;while(dm>=0&&!m[dm])dm--;
    for(var i=a.length-1;i>=dm;i--)if(a[i])for(var j=0;j<=dm;j++)a[i-dm+j]^=m[j];
    var r=a.slice(0,dm);while(r.length&&!r[r.length-1])r.pop();return r;}
  function c13fromInt(v){var r=[];while(v){r.push(v&1);v>>=1;}return r;}
  /* タップから特性多項式の係数（下位から）を作る: f = x^L + Σ c_i x^{L-i} */
  function c13fcoef(c){var L=c.length,f=[];for(var e=0;e<=L;e++)f.push(e===L?1:c[L-e-1]);return f;}
  /* 既約多項式で割り切れるかを順に調べて因数分解（次数の低い順） */
  function c13factor(f){var fs=[],g=f.slice();
    for(var d=1;2*d<=g.length-1||d===1;d++){
      for(var v=1<<d;v<(1<<(d+1));v++){var q=c13fromInt(v);
        while(g.length-1>=d&&c13pmod(g,q).length===0){fs.push(q);g=c13div(g,q);}}
      if(d>16)break;}
    if(g.length>1)fs.push(g);return fs;}
  function c13div(a,m){a=a.slice();var dm=m.length-1,q=[];for(var t=0;t<=a.length-1-dm;t++)q.push(0);
    for(var i=a.length-1;i>=dm;i--)if(a[i]){q[i-dm]=1;for(var j=0;j<=dm;j++)a[i-dm+j]^=m[j];}
    while(q.length&&!q[q.length-1])q.pop();return q;}
  function c13pstr(p){var t=[];for(var e=p.length-1;e>=0;e--)if(p[e])t.push(e===0?"1":(e===1?"x":"x<sup>"+e+"</sup>"));return t.join("+");}
  /* f を法とする x の位数（f(0) = 1 のとき） */
  function c13order(f){var L=f.length-1,v=[0,1],n=1,lim=1<<(L+1);
    while(n<=lim){var r=c13pmod(v,f);if(r.length===1&&r[0]===1)return n;v=r.slice();v.unshift(0);n++;}return 0;}
  /* 状態（左が新しい順の 0/1 配列）を 1 クロック進める */
  function c13step(c,st){var nb=0;for(var i=0;i<c.length;i++)nb^=c[i]&st[i];return [nb].concat(st.slice(0,st.length-1));}
  function c13period(c,st){var cur=st.slice(),n=0,key=st.join("");do{cur=c13step(c,cur);n++;}while(cur.join("")!==key&&n<=(1<<c.length)+1);return n;}

  /* ============ 13. ksreuse — 鍵ストリームの再利用とクリブ・ドラッギング ============ */
  REG.ksreuse=function(el){
    head(el,"Crib Dragging","同じ鍵ストリームで暗号化した 2 つの文を取り出す");
    var P="MEET ME AT THE OLD BRIDGE AT TEN TONIGHT", Q="THE PACKAGE IS HIDDEN UNDER THE BLUE CAR";
    var Z=[],x=0x2545F491,i;
    for(i=0;i<P.length;i++){x^=(x<<13)>>>0;x>>>=0;x^=x>>>17;x^=(x<<5)>>>0;x>>>=0;Z.push(x&255);}
    var X=[];for(i=0;i<P.length;i++)X.push((P.charCodeAt(i)^Z[i])^(Q.charCodeAt(i)^Z[i]));
    var row=ctrls(el);
    var ti=textin(row,"推測する語（クリブ）"," THE ");
    var sj=slider(row,"当てはめる位置 j",0,P.length-5,10,1);
    var row2=ctrls(el); var ck=checkbox(row2,"答え（2 つの平文）を表示する",false);
    var cv=screen(el,92),cc=cctx(cv), out=panel(el), ro=readout(el);
    function ok(v){return (v>=65&&v<=90)||v===32;}
    function vis(v){return v===32?"␣":(v>=33&&v<=126?esc(String.fromCharCode(v)):"·");}
    function hx(v){return ("0"+v.toString(16)).slice(-2);}
    function res(j,g){var r=[];for(var k=0;k<g.length;k++)r.push(X[j+k]^g.charCodeAt(k));return r;}
    function good(j,g){return res(j,g).every(ok);}
    function draw(){
      var g=ti.value.toUpperCase(); if(!g.length)g=" ";
      var max=Math.max(0,P.length-g.length); sj.input.max=max; if(+sj.input.value>max)sj.input.value=max;
      var j=+sj.input.value; sj.val.textContent=j;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var pl=10,cw=(w-2*pl)/P.length,nOk=0;
      lab(ctx,"どの位置 j で結果が英字と空白だけになるか（緑）",pl,16,C("--muted"),"left");
      for(var k=0;k<=max;k++){var gd=good(k,g);if(gd)nOk++;
        ctx.fillStyle=gd?C("--signal"):C("--line");ctx.globalAlpha=gd?.85:1;ctx.fillRect(pl+k*cw+1,28,cw-2,26);ctx.globalAlpha=1;
        if(k===j){ctx.strokeStyle=C("--alias");ctx.lineWidth=2.2;ctx.strokeRect(pl+k*cw,26,cw,30);}
        if(k%5===0)lab(ctx,String(k),pl+k*cw+cw/2,72,C("--faint"),"center");}
      var r=res(j,g);
      function tr(name,vals,col){return '<tr><th style="padding:.15rem .5rem;text-align:right;color:var(--muted);white-space:nowrap">'+name+'</th>'+
        vals.map(function(v){return '<td style="padding:.15rem .35rem;text-align:center;color:'+(col||"var(--ink)")+'">'+v+'</td>';}).join("")+'</tr>';}
      var idx=[];for(k=0;k<g.length;k++)idx.push(j+k);
      var hh='<table style="border-collapse:collapse">'+tr("位置",idx,"var(--faint)")+
        tr("C ⊕ C′（16 進）",idx.map(function(q){return hx(X[q]);}))+
        tr("クリブ",g.split("").map(function(ch){return vis(ch.charCodeAt(0));}),"var(--blue)")+
        tr("XOR した結果",r.map(function(v){return '<b style="color:'+(ok(v)?"var(--signal)":"var(--alias)")+'">'+vis(v)+'</b>';}));
      if(ck.checked)hh+=tr("平文 P",idx.map(function(q){return vis(P.charCodeAt(q));}),"var(--muted)")+tr("平文 P′",idx.map(function(q){return vis(Q.charCodeAt(q));}),"var(--muted)");
      out.innerHTML=hh+'</table>'+(ck.checked?'<div style="margin-top:.5rem;color:var(--muted)">P = '+P.replace(/ /g,"␣")+'<br>P′ = '+Q.replace(/ /g,"␣")+'</div>':'');
      var all=r.every(ok);
      ro.innerHTML='位置 j = '+j+' の結果「'+r.map(vis).join("")+'」 ／ '+
        (all?'<b class="ok">英字と空白だけ: どちらかの平文のこの位置にクリブがあり、もう一方の平文の断片が見えている候補</b>':
             '<span class="warn">読めない値が混ざる: この位置ではない</span>')+' ／ 緑の位置は '+nOk+' 個';
    }
    ti.addEventListener("input",draw);sj.input.addEventListener("input",draw);ck.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 13. lfsrstep — LFSR を 1 クロックずつ動かす ============ */
  REG.lfsrstep=function(el){
    head(el,"LFSR","タップと初期状態を決めて、1 クロックずつ進める");
    var row=ctrls(el);
    var tt=textin(row,"タップ c₁ c₂ …（0 と 1 を L 個。最後は 1）","0011");
    var ts=textin(row,"初期状態（左が新しい）","1000");
    var row2=ctrls(el);
    var b1=button(row2,"1 クロック進める"), b2=button(row2,"自動で進める"), b3=button(row2,"最初に戻す");
    var cv=screen(el,200),cc=cctx(cv), out=panel(el), ro=readout(el);
    var c=[],st=[],init=[],outs=[],hist=[],n=0,per=0,err="",timer=null;
    function parse(){
      var a=tt.value.replace(/[^01]/g,""),b=ts.value.replace(/[^01]/g,"");
      err="";
      if(a.length<2||a.length>12)err="タップは 2〜12 個の 0/1 で入力する";
      else if(a[a.length-1]!=="1")err="最後のタップ c_L は 1 にする（0 なら長さ L − 1 の LFSR と同じになる）";
      else if(b.length!==a.length)err="初期状態はタップと同じ長さ（"+a.length+" ビット）にする";
      else if(b.indexOf("1")<0)err="初期状態がすべて 0 だと、0 しか出力されない";
      c=a.split("").map(Number); init=b.split("").map(Number);
      reset();
    }
    function reset(){st=init.slice();outs=[];hist=[st.join("")];n=0;per=err?0:c13period(c,init);stop();draw();}
    function step(){if(err)return;outs.push(st[st.length-1]);st=c13step(c,st);n++;hist.push(st.join(""));draw();}
    function stop(){if(timer){clearInterval(timer);timer=null;}b2.setAttribute("aria-pressed","false");b2.textContent="自動で進める";}
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(err){lab(ctx,err,14,30,C("--alias"),"left");out.innerHTML="";ro.innerHTML='<span class="warn">'+err+'</span>';return;}
      var L=c.length,pl=70,pr=96,cw=Math.min(56,(w-pl-pr)/L),y0=48,ch=38,xs=[];
      for(var i=0;i<L;i++)xs.push(pl+i*cw);
      var nb=0;for(i=0;i<L;i++)nb^=c[i]&st[i];
      lab(ctx,"時刻 n = "+n,10,18,C("--ink"),"left");
      lab(ctx,"← 新しい",pl,y0-8,C("--muted"),"left");lab(ctx,"古い →",pl+L*cw-4,y0-8,C("--muted"),"right");
      // バス
      var yb=y0+ch+56,taps=[];for(i=0;i<L;i++)if(c[i])taps.push(xs[i]+cw/2-2);
      ctx.strokeStyle=C("--ink");ctx.lineWidth=1.4;
      taps.forEach(function(x){ctx.beginPath();ctx.moveTo(x,y0+ch);ctx.lineTo(x,y0+ch+4);ctx.moveTo(x,y0+ch+21);ctx.lineTo(x,yb);ctx.stroke();});
      if(taps.length){ctx.beginPath();ctx.moveTo(taps[taps.length-1],yb);ctx.lineTo(36,yb);ctx.lineTo(36,y0+ch/2);ctx.lineTo(xs[0]-6,y0+ch/2);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.stroke();
        ctx.fillStyle=C("--alias");ctx.beginPath();ctx.moveTo(xs[0]-2,y0+ch/2);ctx.lineTo(xs[0]-10,y0+ch/2-5);ctx.lineTo(xs[0]-10,y0+ch/2+5);ctx.closePath();ctx.fill();}
      taps.forEach(function(x){ctx.fillStyle=C("--ink");ctx.beginPath();ctx.arc(x,yb,3,0,TAU);ctx.fill();});
      ctx.fillStyle=C("--screen");ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(36,yb,11,0,TAU);ctx.fill();ctx.stroke();
      lab(ctx,"⊕",36,yb+4,C("--alias"),"center");
      lab(ctx,"次に入るビット = "+taps.length+" 個のタップの XOR = "+nb,48,yb+24,C("--alias"),"left");
      for(i=0;i<L;i++){
        ctx.fillStyle=c[i]?C("--signal-soft"):C("--panel");ctx.strokeStyle=c[i]?C("--signal"):C("--line");ctx.lineWidth=1.6;
        rrect(ctx,xs[i],y0,cw-4,ch,6);ctx.fill();ctx.stroke();
        ctx.font="bold 16px "+C("--mono");ctx.fillStyle=C("--ink");ctx.textAlign="center";ctx.fillText(String(st[i]),xs[i]+cw/2-2,y0+ch/2+6);
        lab(ctx,"c"+(i+1)+"="+c[i],xs[i]+cw/2-2,y0+ch+16,c[i]?C("--signal"):C("--muted"),"center");}
      var xo=pl+L*cw;ctx.strokeStyle=C("--blue");ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(xo,y0+ch/2);ctx.lineTo(xo+40,y0+ch/2);ctx.stroke();
      ctx.fillStyle=C("--blue");ctx.beginPath();ctx.moveTo(xo+46,y0+ch/2);ctx.lineTo(xo+38,y0+ch/2-5);ctx.lineTo(xo+38,y0+ch/2+5);ctx.closePath();ctx.fill();
      lab(ctx,"次の出力 "+st[L-1],xo+4,y0+ch/2-10,C("--blue"),"left");
      var back=n>0&&st.join("")===init.join("");
      out.innerHTML='<div style="color:var(--muted)">出力列 s₀ s₁ s₂ …（'+outs.length+' ビット）</div><div style="word-break:break-all;letter-spacing:.12em">'+
        (outs.length?outs.join("").replace(/(.{5})/g,"$1 "):"（まだ出力していない）")+'</div>'+
        '<div style="color:var(--muted);margin-top:.4rem">状態の移り変わり（直近）</div><div style="word-break:break-all">'+
        hist.slice(-9).map(function(s,k,arr){var last=k===arr.length-1;return last?'<b>'+s+'</b>':s;}).join(" → ")+'</div>';
      ro.innerHTML='時刻 n = '+n+' ／ この初期状態に戻るまでの更新回数 <b>'+per+'</b>（0 以外の状態は 2<sup>'+c.length+'</sup> − 1 = '+((1<<c.length)-1)+' 通り）'+
        (back?' ／ <b class="ok">時刻 '+n+' で初期状態に戻った</b>':'');
    }
    b1.addEventListener("click",function(){stop();step();});
    b2.addEventListener("click",function(){if(timer){stop();return;}if(err)return;b2.setAttribute("aria-pressed","true");b2.textContent="止める";
      timer=setInterval(function(){if(!document.body.contains(el)){stop();return;}step();},450);});
    b3.addEventListener("click",reset);
    tt.addEventListener("input",parse);ts.addEventListener("input",parse);reg(cv,draw);parse();
  };

  /* ============ 13. lfsrcycle — 特性多項式と状態の輪 ============ */
  REG.lfsrcycle=function(el){
    head(el,"State Cycles","0 以外の状態が分かれる輪と、その長さ");
    var row=ctrls(el);
    var sL=select(row,"長さ L",["3","4","5"]); sL.value="1";
    var sp=select(row,"特性多項式",["…"]);
    var wrap=mk("div","wscreen");var cv=mk("canvas");wrap.appendChild(cv);el.appendChild(wrap);var cc=cctx(cv);
    var ro=readout(el);
    var list=[];
    function build(){
      var L=3+(+sL.value);list=[];
      for(var v=0;v<(1<<(L-1));v++){var c=[];for(var i=1;i<L;i++)c.push((v>>(L-1-i))&1);c.push(1);
        var f=c13fcoef(c),fs=c13factor(f),irr=fs.length===1,N=c13order(f),kind=irr?(N===(1<<L)-1?"原始":"既約・原始でない"):"可約";
        list.push({c:c,f:f,fs:fs,kind:kind,N:N});}
      var order={"原始":0,"既約・原始でない":1,"可約":2};
      list.sort(function(a,b){return order[a.kind]-order[b.kind];});
      sp.innerHTML=list.map(function(it,k){return '<option value="'+k+'">'+c13poly(it.c).replace(/<sup>(\d+)<\/sup>/g,function(m,d){return d.split("").map(function(q){return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+q];}).join("");})+'（'+it.kind+'）</option>';}).join("");
      sp.value="0";
    }
    function cycles(c){var L=c.length,seen={},res=[];
      for(var v=1;v<(1<<L);v++){var st=[];for(var i=0;i<L;i++)st.push((v>>(L-1-i))&1);if(seen[st.join("")])continue;
        var cyc=[],cur=st;while(!seen[cur.join("")]){seen[cur.join("")]=1;cyc.push(cur.join(""));cur=c13step(c,cur);}res.push(cyc);}
      res.sort(function(a,b){return b.length-a.length;});return res;}
    function draw(){
      var it=list[+sp.value]; if(!it)return;
      var L=it.c.length,cyc=cycles(it.c);
      var w=wrap.getBoundingClientRect().width||600, nodeW=L*7+10, sp1=nodeW+8, pad=16;
      // 輪の大きさと配置
      var items=cyc.map(function(q){var r=q.length<3?(q.length===1?0:nodeW*0.75):Math.max(nodeW,q.length*sp1/(2*Math.PI));return {q:q,r:r,D:2*r+nodeW+2*pad};});
      var rows=[],cur=[],cw0=0;items.forEach(function(o){if(cur.length&&cw0+o.D>w-8){rows.push(cur);cur=[];cw0=0;}cur.push(o);cw0+=o.D;});if(cur.length)rows.push(cur);
      var H=12;rows.forEach(function(r){var m=0;r.forEach(function(o){m=Math.max(m,o.D+(o.q.length===1?26:0));});r.h=m+22;H+=r.h;});
      wrap.style.height=Math.max(120,H+8)+"px";
      var d=cc.fit(),ctx=cc.ctx;ctx.clearRect(0,0,d.w,d.h);
      var col=it.kind==="原始"?C("--signal"):(it.kind==="可約"?C("--alias"):C("--blue"));
      var y=12;
      rows.forEach(function(r){var tot=0;r.forEach(function(o){tot+=o.D;});var x=(d.w-tot)/2;
        r.forEach(function(o){var cx=x+o.D/2,cy=y+(o.q.length===1?26:0)+o.D/2,n=o.q.length,pts=[];
          for(var k=0;k<n;k++){var th=-Math.PI/2+TAU*k/n;pts.push([cx+(n===1?0:o.r*Math.cos(th)),cy+(n===1?0:o.r*Math.sin(th))]);}
          ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1.3;
          if(n===1){ctx.beginPath();ctx.arc(pts[0][0],pts[0][1]-17,10,Math.PI*0.75,Math.PI*2.25);ctx.stroke();}
          else for(k=0;k<n;k++){var p=pts[k],q=pts[(k+1)%n],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/len,uy=dy/len;
            var off=n===2?(k?8:-8):0,ox=-uy*off,oy=ux*off,cut=Math.min(len/2-2,nodeW/2+3);
            var ax=p[0]+ux*cut+ox,ay=p[1]+uy*cut+oy,bx=q[0]-ux*cut+ox,by=q[1]-uy*cut+oy;
            ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
            ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-ux*6-uy*3.5,by-uy*6+ux*3.5);ctx.lineTo(bx-ux*6+uy*3.5,by-uy*6-ux*3.5);ctx.closePath();ctx.fill();}
          for(k=0;k<n;k++){ctx.fillStyle=C("--panel");ctx.strokeStyle=col;ctx.lineWidth=1.3;rrect(ctx,pts[k][0]-nodeW/2,pts[k][1]-9,nodeW,18,4);ctx.fill();ctx.stroke();
            lab(ctx,o.q[k],pts[k][0],pts[k][1]+4,C("--ink"),"center");}
          lab(ctx,"長さ "+n,cx,y+(o.q.length===1?26:0)+o.D-2,col,"center");
          x+=o.D;});
        y+=r.h;});
      var lens=cyc.map(function(q){return q.length;});
      var fstr=it.fs.length>1?' = '+(function(){var m={},o=[];it.fs.forEach(function(p){var s=c13pstr(p);m[s]=(m[s]||0)+1;});for(var s in m)o.push("("+s+")"+(m[s]>1?"<sup>"+m[s]+"</sup>":""));return o.join("");})():'';
      ro.innerHTML='f(x) = '+c13poly(it.c)+fstr+' ／ <b>'+it.kind+'</b> ／ 輪の長さ: <b>'+lens.join(", ")+'</b>'+
        (it.kind==="原始"?' ／ <b class="ok">1 つの輪で周期 2<sup>'+L+'</sup> − 1 = '+((1<<L)-1)+'（M 系列）</b>':
         it.kind==="既約・原始でない"?' ／ どの輪も x の位数 '+it.N+' と同じ長さ':' ／ <span class="warn">初期状態によって周期が変わる</span>');
    }
    sL.addEventListener("change",function(){build();draw();});sp.addEventListener("change",draw);
    build();
    for(var k=0;k<list.length;k++)if(list[k].c.join("")==="0011")sp.value=String(k);
    reg(cv,draw);
  };

  /* ============ 13. lfsrsolve — 観測した出力からタップを求める ============ */
  REG.lfsrsolve=function(el){
    head(el,"Recover LFSR","観測したビットで連立方程式を立て、タップを求める");
    var row=ctrls(el);
    var sL=slider(row,"秘密の LFSR の長さ L",2,16,4,1);
    var sm=slider(row,"観測するビット数 m",1,48,8,1);
    var row2=ctrls(el); var bt=button(row2,"秘密の LFSR を作り直す"); var ck=checkbox(row2,"秘密の LFSR を表示する",false);
    var out=panel(el), ro=readout(el);
    var sec={c:[0,0,1,1],init:[0,0,0,1]};
    function randPrim(L){for(var t=0;t<4000;t++){var c=[];for(var i=1;i<L;i++)c.push(Math.random()<.5?1:0);c.push(1);
        var st=[];for(i=0;i<L;i++)st.push(i===L-1?1:0);if(c13period(c,st)===(1<<L)-1)return c;}return null;}
    function regen(){var L=+sL.input.value,c=randPrim(L);if(!c)return;var init;
      do{init=[];for(var i=0;i<L;i++)init.push(Math.random()<.5?1:0);}while(init.indexOf(1)<0);sec={c:c,init:init};}
    function solve(s,L,m){ // 行 n: [s_{n+L-1} … s_n] · c = s_{n+L}
      var rows=[];for(var n=0;n+L<m;n++){var r=[];for(var i=0;i<L;i++)r.push(s[n+L-1-i]);r.push(s[n+L]);rows.push(r);}
      var A=rows.map(function(r){return r.slice();}),rank=0,piv=[];
      for(var col=0;col<L&&rank<A.length;col++){var p=-1;for(var i=rank;i<A.length;i++)if(A[i][col]){p=i;break;}if(p<0)continue;
        var t=A[p];A[p]=A[rank];A[rank]=t;for(i=0;i<A.length;i++)if(i!==rank&&A[i][col])for(var k=col;k<=L;k++)A[i][k]^=A[rank][k];
        piv.push(col);rank++;}
      var cons=true;for(var i2=rank;i2<A.length;i2++)if(A[i2][L])cons=false;
      var c=[];for(var q=0;q<L;q++)c.push(0);for(var r2=0;r2<rank;r2++)c[piv[r2]]=A[r2][L];
      return {rows:rows,rank:rank,cons:cons,c:c};}
    function run(){
      var L=+sL.input.value; sm.input.max=Math.max(3*L,8); if(+sm.input.value>+sm.input.max)sm.input.value=sm.input.max;
      var m=+sm.input.value; sL.val.textContent=L; sm.val.textContent=m+"（2L = "+(2*L)+"）";
      if(sec.c.length!==L)regen();
      var s=c13seq(sec.c,sec.init,m+40),obs=s.slice(0,m);
      var R=solve(s,L,m),neq=R.rows.length,nsol=R.cons?Math.pow(2,L-R.rank):0;
      var h='<div style="color:var(--muted)">観測したビット s₀ … s<sub>'+(m-1)+'</sub></div><div style="letter-spacing:.12em;word-break:break-all">'+obs.join("").replace(/(.{4})/g,"$1 ")+'</div>';
      if(neq>0&&L<=6){h+='<div style="color:var(--muted);margin-top:.4rem">式（係数 [c<sub>1</sub> … c<sub>'+L+'</sub>] | 右辺 s<sub>n+'+L+'</sub>）</div><div>'+
        R.rows.slice(0,8).map(function(r,n){return 'n='+n+': ['+r.slice(0,L).join(" ")+' | '+r[L]+']';}).join("　")+(R.rows.length>8?" …":"")+'</div>';}
      var pred=[],act=s.slice(m,m+32),hit=0;
      if(neq>0&&R.cons){var t=obs.slice();for(var k=0;k<32;k++){var n0=t.length-L,v=0;for(var i=0;i<L;i++)v^=R.c[i]&t[n0+L-1-i];t.push(v);pred.push(v);if(v===act[k])hit++;}
        h+='<div style="color:var(--muted);margin-top:.4rem">求めたタップ c = '+R.c.join("")+'（f(x) = '+c13poly(R.c)+'）で予測した続き 32 ビット（<span style="color:var(--signal)">一致</span>／<span style="color:var(--alias)">不一致</span>）</div><div style="letter-spacing:.12em">'+
          pred.map(function(v,k){return '<span style="color:'+(v===act[k]?"var(--signal)":"var(--alias)")+'">'+v+'</span>'+((k%4===3)?" ":"");}).join("")+'</div>';}
      if(ck.checked)h+='<div style="color:var(--muted);margin-top:.4rem">秘密の LFSR: タップ '+sec.c.join("")+'、f(x) = '+c13poly(sec.c)+'、初期状態（左が新しい） '+sec.init.slice().reverse().join("")+'</div>';
      out.innerHTML=h;
      if(neq<=0){ro.innerHTML='<span class="warn">式が立たない（m ≤ L）。少なくとも L + 1 ビット要る</span>';return;}
      ro.innerHTML='式 '+neq+' 本（ほかの式の XOR では作れない式は '+R.rank+' 本）、未知数 '+L+' 個 ／ '+
        (nsol===1?'<b class="ok">解はただ 1 つ</b>':'<span class="warn">解が '+nsol+' 個あり、タップが 1 つに決まらない</span>')+
        ' ／ 予測 '+hit+'/32 ビット一致'+(hit===32&&nsol===1?'（以後の鍵ストリームはすべて分かる）':'');
    }
    sL.input.addEventListener("input",function(){regen();run();});sm.input.addEventListener("input",run);
    bt.addEventListener("click",function(){regen();run();});ck.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 13. geffe — 相関攻撃 ============ */
  REG.geffe=function(el){
    head(el,"Correlation Attack","Geffe 生成器の 1 本目の LFSR だけを総当たりする");
    var row=ctrls(el);
    var sn=slider(row,"観測する出力 z のビット数",8,400,120,4);
    var row2=ctrls(el); var bt=button(row2,"秘密の初期状態を作り直す");
    var cv=screen(el,230),cc=cctx(cv), ro=readout(el);
    var C1=[0,0,1,0,1],C2=[0,0,0,0,1,1],C3=[0,0,0,0,0,1,1];   // x⁵+x²+1, x⁶+x+1, x⁷+x+1
    var ia=[0,1,1,0,1],ib=[1,1,0,0,1,1],ic=[1,0,0,1,1,0,1];
    function rnd(L){var a;do{a=[];for(var i=0;i<L;i++)a.push(Math.random()<.5?1:0);}while(a.indexOf(1)<0);return a;}
    function draw(){
      var N=+sn.input.value; sn.val.textContent=N;
      var a=c13seq(C1,ia,N),b=c13seq(C2,ib,N),c=c13seq(C3,ic,N),z=[],i;
      for(i=0;i<N;i++)z.push(b[i]?a[i]:c[i]);
      var cand=[],best=-1,bi=-1,truth=-1;
      for(var v=1;v<32;v++){var init=[];for(i=0;i<5;i++)init.push((v>>i)&1);var s=c13seq(C1,init,N),m=0;for(i=0;i<N;i++)if(s[i]===z[i])m++;
        var r=m/N;cand.push(r);if(init.join("")===ia.join(""))truth=v-1;if(r>best){best=r;bi=v-1;}}
      var other=0;cand.forEach(function(r,k){if(k!==truth&&r>other)other=r;});
      var ch=chart(cc,0,32,0.2,1.0,{l:40,b:30,t:18,r:12});grid(ch,4);axis(ch);
      [[0.5,"1/2"],[0.75,"3/4"]].forEach(function(q){var y=ch.Y(q[0]);ch.ctx.strokeStyle=C("--faint");ch.ctx.setLineDash([4,4]);ch.ctx.beginPath();ch.ctx.moveTo(ch.p.l,y);ch.ctx.lineTo(ch.w-ch.p.r,y);ch.ctx.stroke();ch.ctx.setLineDash([]);
        lab(ch.ctx,q[1],ch.p.l-6,y+4,C("--muted"),"right");});
      cand.forEach(function(r,k){dot(ch,k+1,r,k===truth?6:3.5,k===truth?C("--alias"):C("--blue"));});
      lab(ch.ctx,"正しい初期状態",ch.X(truth+1)+8,ch.Y(cand[truth])-6,C("--alias"),"left");
      lab(ch.ctx,"1 本目の初期状態の候補（31 通り）",ch.X(16),ch.h-8,C("--muted"),"center");
      lab(ch.ctx,"z との一致率",ch.p.l+4,12,C("--muted"),"left");
      var st=ia.slice().reverse().join("");
      ro.innerHTML='正しい初期状態 '+st+' の一致率 <b>'+f(cand[truth],2)+'</b> ／ ほかの候補の最大 <b>'+f(other,2)+'</b> ／ '+
        (bi===truth&&cand[truth]>other?'<b class="ok">一致率が最大の候補が正しい</b>':'<span class="warn">まだ区別できない（観測ビットを増やす）</span>')+
        ' ／ 試した数は 31 通り（3 本まとめて総当たりすると 31 × 63 × 127 = 248031 通り）';
    }
    sn.input.addEventListener("input",draw);bt.addEventListener("click",function(){ia=rnd(5);ib=rnd(6);ic=rnd(7);draw();});reg(cv,draw);
  };
