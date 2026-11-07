  /* ============ 15. phiTable — 1〜mn を m 列に並べて φ(mn) = φ(m)φ(n) を確かめる ============ */
  REG.phiTable=function(el){
    head(el,"Euler φ","1〜mn を m 列に並べ、φ(mn) と φ(m)φ(n) を比べる");
    var row=ctrls(el);
    var sm=slider(row,"列の数 m",2,10,3,1),sn=slider(row,"行の数 n",2,10,5,1);
    var out=panel(el),ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function phi(k){var c=0;for(var a=1;a<=k;a++)if(gcd(a,k)===1)c++;return c;}
    function run(){
      var m=+sm.input.value,n=+sn.input.value,c,i;sm.val.textContent=m;sn.val.textContent=n;
      var h='<table style="border-collapse:separate;border-spacing:3px;width:auto"><tr><th style="padding:.1rem .4rem;font-weight:400">m で割った余り</th>';
      for(c=1;c<=m;c++){var r=c%m,ok=gcd(r,m)===1;
        h+='<th style="padding:.1rem .3rem;text-align:center;color:'+(ok?"var(--signal)":"var(--alias)")+'">'+r+'</th>';}
      h+='</tr>';
      for(i=0;i<n;i++){
        h+='<tr><th style="padding:.1rem .4rem;font-weight:400">'+(i+1)+' 行目</th>';
        for(c=1;c<=m;c++){var x=i*m+c,cm=gcd(x,m)===1,cn=gcd(x,n)===1,st;
          if(cm&&cn)st="background:var(--signal-soft);border-color:var(--signal);font-weight:700";
          else if(cm)st="background:var(--alias-soft);border-color:var(--alias);color:var(--alias)";
          else st="color:var(--faint)";
          h+='<td style="min-width:2.9rem;padding:.12rem .3rem;text-align:center;border:1px solid var(--line);border-radius:4px;'+st+'">'+x+
            '<span style="font-size:.66rem;color:var(--muted);margin-left:.35rem;font-weight:400">'+(x%n)+'</span></td>';}
        h+='</tr>';}
      h+='</table><div style="margin-top:.4rem;color:var(--muted)">マスの右の小さな数字は n で割った余り。緑 = mn と互いに素、赤 = m とは互いに素だが n とは素でない、薄字 = m と互いに素でない列</div>';
      var lines=[];
      for(c=1;c<=m;c++){if(gcd(c%m,m)!==1)continue;
        var rs=[],seen={},dup=false;for(i=0;i<n;i++){var v=(i*m+c)%n;rs.push(v);if(seen[v])dup=true;seen[v]=1;}
        lines.push('<span style="color:'+(dup?"var(--alias)":"var(--signal)")+'">余り '+(c%m)+' の列: '+rs.join(",")+(dup?"（重なりあり）":"")+'</span>');}
      h+='<div style="margin-top:.2rem">n で割った余りの並び　'+lines.join("　")+'</div>';
      out.innerHTML=h;
      var pm=phi(m),pn=phi(n),pmn=phi(m*n),g=gcd(m,n);
      ro.innerHTML='φ(m) = '+pm+'、φ(n) = '+pn+'、φ(m)φ(n) = <b>'+(pm*pn)+'</b> ／ 数えた φ('+(m*n)+') = <b>'+pmn+'</b> ／ '+
        (g===1?'<span class="ok">m と n が互いに素なので一致する</span>':'<span class="warn">gcd(m, n) = '+g+' なので列の中で余りが重なり、一致しない</span>');
    }
    sm.input.addEventListener("input",run);sn.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 15. crtGrid — 余りの組のマスに数を書き込む ============ */
  REG.crtGrid=function(el){
    head(el,"CRT","x を (x mod m₁, x mod m₂) のマスに書き込み、解を作る");
    var row=ctrls(el);
    var s1=slider(row,"法 m₁",2,9,3,1),s2=slider(row,"法 m₂",2,9,5,1);
    var row2=ctrls(el);
    var t1=slider(row2,"余り a₁",0,8,2,1),t2=slider(row2,"余り a₂",0,8,3,1);
    var out=panel(el),ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function inv(a,m){a%=m;for(var x=1;x<m;x++)if(a*x%m===1)return x;return null;}
    function run(){
      var m1=+s1.input.value,m2=+s2.input.value,i,j;
      t1.input.max=m1-1;if(+t1.input.value>m1-1)t1.input.value=m1-1;
      t2.input.max=m2-1;if(+t2.input.value>m2-1)t2.input.value=m2-1;
      var a1=+t1.input.value,a2=+t2.input.value;
      s1.val.textContent=m1;s2.val.textContent=m2;t1.val.textContent=a1;t2.val.textContent=a2;
      var M=m1*m2,cells=[];
      for(i=0;i<m1;i++){cells.push([]);for(j=0;j<m2;j++)cells[i].push([]);}
      for(var x=0;x<M;x++)cells[x%m1][x%m2].push(x);
      var h='<div style="color:var(--muted);margin-bottom:.2rem">0〜'+(M-1)+' の各 x を、行 = x mod '+m1+'、列 = x mod '+m2+' のマスに書き込む（黒枠が余りの組 ('+a1+', '+a2+')）</div>';
      h+='<table style="border-collapse:separate;border-spacing:3px;width:auto"><tr><th style="padding:.1rem .3rem"></th>';
      for(j=0;j<m2;j++)h+='<th style="padding:.1rem .3rem;text-align:center">'+j+'</th>';
      h+='</tr>';
      var empty=0,multi=0;
      for(i=0;i<m1;i++){
        h+='<tr><th style="padding:.1rem .3rem;text-align:center">'+i+'</th>';
        for(j=0;j<m2;j++){var c=cells[i][j],st;
          if(!c.length){empty++;st="background:var(--screen);color:var(--faint)";}
          else if(c.length>1){multi++;st="background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700";}
          else st="background:var(--signal-soft);border-color:var(--signal)";
          if(i===a1&&j===a2)st+=";outline:2px solid var(--ink)";
          h+='<td style="min-width:2.3rem;padding:.15rem .3rem;text-align:center;border:1px solid var(--line);border-radius:4px;'+st+'">'+(c.length?c.join(","):"空")+'</td>';}
        h+='</tr>';}
      h+='</table>';
      var g=gcd(m1,m2);
      if(g===1){
        var M1=m2,N1=inv(M1,m1),M2=m1,N2=inv(M2,m2),xx=(a1*M1*N1+a2*M2*N2)%M;
        h+='<div style="margin-top:.5rem">M = '+m1+'·'+m2+' = '+M+'、M₁ = '+M1+'、N₁ = '+M1+'⁻¹ mod '+m1+' = '+N1+'、M₂ = '+M2+'、N₂ = '+M2+'⁻¹ mod '+m2+' = '+N2+'</div>';
        h+='<div>x = a₁M₁N₁ + a₂M₂N₂ mod M = '+a1+'·'+M1+'·'+N1+' + '+a2+'·'+M2+'·'+N2+' mod '+M+' = <b style="color:var(--signal)">'+xx+'</b>'+
          '　<span style="color:var(--muted)">検算: '+xx+' mod '+m1+' = '+(xx%m1)+'、'+xx+' mod '+m2+' = '+(xx%m2)+'</span></div>';
        ro.innerHTML='余りの組 ('+a1+', '+a2+') の解 x = <b class="ok">'+xx+'</b> ／ <span class="ok">'+M+' 個のマスがちょうど 1 回ずつ埋まる</span>';
      }else{
        h+='<div style="margin-top:.5rem;color:var(--alias)">gcd(m₁, m₂) = '+g+' なので、M₁ = '+m2+' が法 '+m1+' で逆元を持たず、上の作り方が使えない</div>';
        var c0=cells[a1][a2];
        ro.innerHTML='<span class="warn">空きのマス '+empty+' 個、2 つ以上の数が入るマス '+multi+' 個</span> ／ 余りの組 ('+a1+', '+a2+') の解: '+
          (c0.length?c0.length+' 個（'+c0.join(", ")+'）':'無い');
      }
      out.innerHTML=h;
    }
    [s1,s2,t1,t2].forEach(function(o){o.input.addEventListener("input",run);});reg(null,run);run();
  };

  /* ============ 15. orderCycle — x → ax mod n の矢印が同じ長さの輪に分かれる ============ */
  REG.orderCycle=function(el){
    head(el,"Order","n と互いに素な数に a を掛け続けると、同じ長さの輪に分かれる");
    var row=ctrls(el);
    var sn=slider(row,"法 n",3,36,10,1),sa=slider(row,"掛ける数 a",1,35,3,1);
    var cv=screen(el,340),cc=cctx(cv),ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function ordr(x,n){var d=1,v=x%n;while(v!==1){v=v*x%n;d++;}return d;}
    function arrow(ctx,x1,y1,x2,y2,col,lw,rr){
      var dx=x2-x1,dy=y2-y1,L=Math.sqrt(dx*dx+dy*dy);if(L<1)return;
      var ux=dx/L,uy=dy/L,sx=x1+ux*rr,sy=y1+uy*rr,ex=x2-ux*(rr+2),ey=y2-uy*(rr+2);
      ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex-ux*6,ey-uy*6);ctx.stroke();
      ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-ux*8-uy*4,ey-uy*8+ux*4);ctx.lineTo(ex-ux*8+uy*4,ey-uy*8-ux*4);ctx.closePath();ctx.fill();}
    function draw(){
      var n=+sn.input.value;sa.input.max=n-1;if(+sa.input.value>n-1)sa.input.value=n-1;
      var a=+sa.input.value;sn.val.textContent=n;sa.val.textContent=a;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var U=[],x;for(x=1;x<n;x++)if(gcd(x,n)===1)U.push(x);
      var ph=U.length;
      if(gcd(a,n)!==1){
        lab(ctx,"a = "+a+" は n = "+n+" と互いに素でないので、この群の要素ではない",16,30,C("--alias"),"left");
        ro.innerHTML='<span class="warn">gcd(a, n) = '+gcd(a,n)+' ≠ 1。a を n と互いに素な数にする</span>';return;}
      var d=ordr(a,n),seen={},cycles=[];
      U.forEach(function(u){if(seen[u])return;var cyc=[],y=u;while(!seen[y]){seen[y]=1;cyc.push(y);y=y*a%n;}cycles.push(cyc);});
      var cx=w/2,cy=h/2+4,R=Math.min(w*0.42,h/2-26),rr=ph>16?10:12,pos={};
      U.forEach(function(u,i){var ang=-Math.PI/2+TAU*i/ph;pos[u]=[cx+R*Math.cos(ang),cy+R*Math.sin(ang)];});
      var others=[C("--blue"),C("--alias"),C("--muted")];
      cycles.forEach(function(cyc,ci){
        var col=ci===0?C("--signal"):others[(ci-1)%others.length],lw=ci===0?2.2:1.3;
        cyc.forEach(function(u){var v=u*a%n,p1=pos[u],p2=pos[v];
          if(v===u){ctx.strokeStyle=col;ctx.lineWidth=lw;var ox=(p1[0]-cx)/R,oy=(p1[1]-cy)/R;
            ctx.beginPath();ctx.arc(p1[0]+ox*(rr+6),p1[1]+oy*(rr+6),6,0,TAU);ctx.stroke();}
          else arrow(ctx,p1[0],p1[1],p2[0],p2[1],col,lw,rr);});
      });
      U.forEach(function(u){var p=pos[u],inOne=cycles[0].indexOf(u)>=0;
        ctx.beginPath();ctx.arc(p[0],p[1],rr,0,TAU);ctx.fillStyle=inOne?C("--signal-soft"):C("--panel");ctx.fill();
        ctx.strokeStyle=inOne?C("--signal"):C("--muted");ctx.lineWidth=1.4;ctx.stroke();
        ctx.fillStyle=C("--ink");ctx.font=(ph>16?"10px ":"11px ")+C("--mono");ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(u),p[0],p[1]+.5);});
      ctx.textBaseline="alphabetic";
      lab(ctx,"緑の輪 = 1 を含む輪 ⟨a⟩",12,18,C("--signal"),"left");
      var prs=U.filter(function(u){return ordr(u,n)===ph;});
      var ap=1;for(var k=0;k<ph;k++)ap=ap*a%n;
      ro.innerHTML='φ('+n+') = <b>'+ph+'</b> ／ '+a+' の位数 = <b>'+d+'</b> ／ 輪 <b>'+cycles.length+'</b> 本 × 長さ '+d+' = '+ph+
        ' ／ '+a+'<sup>φ('+n+')</sup> mod '+n+' = '+ap+' ／ 原始根: '+(prs.length?'<b class="ok">'+prs.join(", ")+'</b>（'+prs.length+' 個）':'<span class="warn">無い</span>');
    }
    sn.input.addEventListener("input",draw);sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 15. dlogBsgs — gˣ の並びと Baby-step Giant-step ============ */
  REG.dlogBsgs=function(el){
    head(el,"Discrete Log","gˣ mod p の並びと、Baby-step Giant-step の手順");
    var row=ctrls(el);
    var primes=[23,47,101,233,509,1019,2027];
    var sp=select(row,"素数 p",primes.map(String));
    var sy=slider(row,"y",1,22,8,1);
    var cv=screen(el,220),cc=cctx(cv),out=panel(el),ro=readout(el);
    function pw(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=r*b%m;b=b*b%m;e=Math.floor(e/2);}return r;}
    function proot(p){var f=[],q=p-1,d;for(d=2;d*d<=q;d++)if(q%d===0){f.push(d);while(q%d===0)q/=d;}if(q>1)f.push(q);
      for(var g=2;g<p;g++){if(f.every(function(r){return pw(g,(p-1)/r,p)!==1;}))return g;}return null;}
    function draw(){
      var p=primes[+sp.value],g=proot(p);
      sy.input.max=p-1;if(+sy.input.value>p-1)sy.input.value=p-1;
      var y=+sy.input.value;sy.val.textContent=y;
      var xs=0,v=1;while(v!==y){v=v*g%p;xs++;}
      var c=chart(cc,0,p-2,1,p-1,{l:44,b:26,t:24,r:14}),ctx=c.ctx;
      function labBg(t,x0,y0,col,al){ctx.font="11px "+C("--mono");var tw=ctx.measureText(t).width,lx=al==="right"?x0-tw:x0;
        ctx.fillStyle=C("--screen");ctx.fillRect(lx-3,y0-11,tw+6,15);lab(ctx,t,x0,y0,col,al);}
      grid(c,4);axis(c);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.p.l,c.Y(y));ctx.lineTo(c.w-c.p.r,c.Y(y));ctx.stroke();ctx.setLineDash([]);
      v=1;var rad=p>600?1.6:(p>150?2.2:3);
      for(var x=0;x<p-1;x++){dot(c,x,v,rad,C("--signal"));v=v*g%p;}
      dot(c,xs,y,6,C("--alias"),true);
      lab(ctx,"x",c.X((p-2)/2),c.h-8,C("--muted"),"center");lab(ctx,"gˣ mod p",c.p.l+6,c.p.t-8,C("--muted"),"left");lab(ctx,"0",c.p.l,c.h-8,C("--muted"),"center");lab(ctx,String(p-2),c.X(p-2),c.h-8,C("--muted"),"center");
      lab(ctx,"1",c.p.l-6,c.Y(1)+4,C("--muted"),"right");lab(ctx,String(p-1),c.p.l-6,c.Y(p-1)+4,C("--muted"),"right");
      labBg("y = "+y,c.w-c.p.r-4,c.Y(y)-5,C("--alias"),"right");
      var m=Math.ceil(Math.sqrt(p-1)),baby={},bl=[];v=1;
      for(var i=0;i<m;i++){if(baby[v]===undefined)baby[v]=i;bl.push(v);v=v*g%p;}
      var gm=pw(g,m,p),gim=pw(gm,p-2,p),cur=y,steps=[],found=null;
      for(var j=0;j<=m;j++){var hit=baby[cur];steps.push([j,cur,hit]);if(hit!==undefined){found=j*m+hit;break;}cur=cur*gim%p;}
      var h='<div>p = '+p+'、原始根 g = '+g+'、m = ⌈√'+(p-1)+'⌉ = '+m+'、g<sup>m</sup> = '+gm+'、g<sup>−m</sup> = '+gim+'</div>';
      var hb=steps.length?steps[steps.length-1][2]:-1;
      h+='<div style="margin-top:.35rem;color:var(--muted)">① baby step（g<sup>i</sup>, i = 0〜'+(m-1)+'）</div><div style="display:flex;flex-wrap:wrap;gap:.2rem .5rem">';
      bl.forEach(function(b,k){if(k<14||k===hb)h+='<span style="'+(k===hb?"color:var(--signal);font-weight:700":"")+'">'+k+':'+b+'</span>';else if(k===14)h+='<span>…</span>';});
      h+='</div><div style="margin-top:.35rem;color:var(--muted)">② giant step（y·(g<sup>−m</sup>)<sup>j</sup> を表と照合）</div><div style="display:flex;flex-wrap:wrap;gap:.2rem .6rem">';
      steps.forEach(function(st){h+='<span style="'+(st[2]!==undefined?"color:var(--alias);font-weight:700":"")+'">j='+st[0]+': '+st[1]+(st[2]!==undefined?' → 表の i = '+st[2]:"")+'</span>';});
      h+='</div><div style="margin-top:.35rem">x = j·m + i = '+steps[steps.length-1][0]+'·'+m+' + '+hb+' = <b style="color:var(--alias)">'+found+'</b></div>';
      out.innerHTML=h;
      ro.innerHTML=g+'<sup>'+found+'</sup> mod '+p+' = '+y+' ／ 総当たり: g<sup>0</sup> から順に <b>'+(xs+1)+'</b> 個を計算 ／ BSGS: baby '+m+' 回 + giant '+steps.length+' 回 = <b>'+(m+steps.length)+'</b> 回（最大でも約 2√p ≈ '+Math.round(2*Math.sqrt(p))+' 回）';
    }
    sp.addEventListener("change",draw);sy.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 15. millerRabin — 列 x₀, …, xₛ と判定 ============ */
  REG.millerRabin=function(el){
    head(el,"Miller–Rabin","2 乗を繰り返す列 x₀, x₁, …, xₛ で合成数を見つける");
    var row=ctrls(el);
    var tn=textin(row,"判定する奇数 n","561","130px"),ta=textin(row,"底 a","2","90px");
    var out=panel(el),ro=readout(el);
    function mm(a,b,m){return Number((BigInt(a)*BigInt(b))%BigInt(m));}
    function pw(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=mm(r,b,m);b=mm(b,b,m);e=Math.floor(e/2);}return r;}
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function seq(n,a){var d=n-1,s=0;while(d%2===0){d/=2;s++;}var xs=[pw(a,d,n)];for(var k=0;k<s;k++)xs.push(mm(xs[k],xs[k],n));return {d:d,s:s,xs:xs};}
    function pass(n,xs,s){if(xs[0]===1)return true;for(var k=0;k<s;k++)if(xs[k]===n-1)return true;return false;}
    function isPrime(n){if(n<2)return false;for(var q=2;q*q<=n;q++)if(n%q===0)return false;return true;}
    function liars(n){var c=0,d=n-1,s=0;while(d%2===0){d/=2;s++;}
      for(var a=2;a<=n-2;a++){var x=1,b=a,e=d;while(e>0){if(e&1)x=x*b%n;b=b*b%n;e=Math.floor(e/2);}
        if(x===1||x===n-1){c++;continue;}for(var k=1;k<s;k++){x=x*x%n;if(x===n-1){c++;break;}}}
      return c;}
    function run(){
      var n=parseInt(tn.value,10),a=parseInt(ta.value,10);
      if(!(n>=5&&n%2===1&&n<1e9)){out.innerHTML='<span style="color:var(--alias)">n は 5 以上 10 億未満の奇数を入れる</span>';ro.innerHTML="";return;}
      if(!(a>=2&&a<=n-2)){out.innerHTML='<span style="color:var(--alias)">a は 2 以上 n − 2 以下の整数を入れる</span>';ro.innerHTML="";return;}
      var r=seq(n,a),ok=pass(n,r.xs,r.s),bad=-1,k;
      for(k=0;k<r.s;k++)if(r.xs[k]!==1&&r.xs[k]!==n-1&&r.xs[k+1]===1){bad=k;break;}
      var h='<div>n − 1 = '+(n-1)+' = 2<sup>'+r.s+'</sup> × '+r.d+'（s = '+r.s+'、d = '+r.d+'）</div><div style="display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;margin-top:.4rem">';
      r.xs.forEach(function(v,i){
        var st=v===1||v===n-1?"background:var(--signal-soft);border-color:var(--signal)":(i===bad?"background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700":"");
        h+='<span style="display:inline-block;text-align:center"><span style="display:block;font-size:.68rem;color:var(--muted)">x<sub>'+i+'</sub></span>'+
          '<span style="display:inline-block;min-width:2.4rem;padding:.15rem .4rem;border:1px solid var(--line);border-radius:5px;'+st+'">'+v+(v===n-1&&n>3?" (−1)":"")+'</span></span>';
        if(i<r.xs.length-1)h+='<span style="color:var(--muted)">→²</span>';});
      h+='</div>';
      if(bad>=0){var z=r.xs[bad];
        h+='<div style="margin-top:.4rem;color:var(--alias)">x<sub>'+bad+'</sub> = '+z+' は ±1 でないのに 2 乗すると 1 → (z − 1)(z + 1) ≡ 0 で、gcd('+(z-1)+', '+n+') = '+gcd(z-1,n)+'、gcd('+(z+1)+', '+n+') = '+gcd(z+1,n)+' は n の約数</div>';}
      else if(!ok&&r.xs[r.s]!==1)h+='<div style="margin-top:.4rem;color:var(--alias)">x<sub>'+r.s+'</sub> = a<sup>n−1</sup> mod n が 1 でない → フェルマー・テストの段階で合成数</div>';
      if(gcd(a,n)!==1)h+='<div style="color:var(--muted)">（a と n が共通の約数 '+gcd(a,n)+' を持つ）</div>';
      out.innerHTML=h;
      var pr=isPrime(n),txt='判定: '+(ok?'<b class="ok">たぶん素数</b>':'<b class="warn">確実に合成数</b>')+' ／ 実際は '+(pr?'素数':'合成数');
      if(!pr&&n<=20000){var L=liars(n);txt+=' ／ 誤判定させる a: '+(n-3)+' 個中 <b>'+L+'</b> 個（'+(100*L/(n-3)).toFixed(1)+'%、1/4 以下）';}
      ro.innerHTML=txt;
    }
    tn.addEventListener("input",run);ta.addEventListener("input",run);reg(null,run);run();
  };
