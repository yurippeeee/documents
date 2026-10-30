  /* ============ 03. gfpcycle — g^k の位数を指数の円で見る ============ */
  REG.gfpcycle=function(el){
    head(el,"Order","g^k の位数 — 指数の円を k ずつ進み、0 に戻るまでの歩数を数える");
    var PR=[3,5,7,11,13,17,19,23,29,31];
    var row=ctrls(el);
    var sp=slider(row,"素数 p",0,PR.length-1,2,1), sk=slider(row,"指数 k",1,6,2,1);
    var cv=screen(el,330),cc=cctx(cv), ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function pw(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=r*b%m;b=b*b%m;e>>=1;}return r;}
    function primroot(p){for(var g=2;g<p;g++){var v=1,ok=true;for(var i=1;i<p-1;i++){v=v*g%p;if(v===1){ok=false;break;}}if(ok)return g;}return 1;}
    function draw(){
      var p=PR[+sp.input.value], n=p-1;
      sk.input.max=n; if(+sk.input.value>n)sk.input.value=n;
      var k=+sk.input.value, g=primroot(p), d=gcd(k,n), ord=n/d;
      sp.val.textContent=p; sk.val.textContent=k;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var cx=w/2, cy=h/2+4, R=Math.min(w*0.36,h/2-44), nr=n>20?9:12;
      function P(e){var a=-Math.PI/2+TAU*e/n;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];}
      var seen=[0];while(true){var nx=(seen[seen.length-1]+k)%n;if(nx===0)break;seen.push(nx);}
      var on={};seen.forEach(function(e){on[e]=true;});
      var col=d===1?C("--signal"):C("--blue");
      /* 進む向きの矢印 */
      ctx.lineWidth=1.6;
      seen.forEach(function(e,i){
        var f=seen[(i+1)%seen.length], a=P(e), b=P(f), dx=b[0]-a[0], dy=b[1]-a[1], L=Math.sqrt(dx*dx+dy*dy);
        if(L<1)return;
        var ox=0,oy=0; if(seen.length===2){ox=-dy/L*4;oy=dx/L*4;}
        var x1=a[0]+dx/L*(nr+2)+ox, y1=a[1]+dy/L*(nr+2)+oy, x2=b[0]-dx/L*(nr+3)+ox, y2=b[1]-dy/L*(nr+3)+oy;
        ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        var an=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x2,y2);
        ctx.lineTo(x2-7*Math.cos(an-0.4),y2-7*Math.sin(an-0.4));ctx.lineTo(x2-7*Math.cos(an+0.4),y2-7*Math.sin(an+0.4));ctx.closePath();ctx.fill();
      });
      /* 位置（指数 e）と、その位置の要素 g^e */
      for(var e=0;e<n;e++){
        var q=P(e), hit=!!on[e];
        ctx.beginPath();ctx.arc(q[0],q[1],nr,0,TAU);
        ctx.fillStyle=hit?(d===1?C("--signal-soft"):C("--blue-soft")):C("--panel");ctx.fill();
        ctx.strokeStyle=hit?col:C("--faint");ctx.lineWidth=hit?1.6:1;ctx.setLineDash(hit?[]:[3,3]);ctx.stroke();ctx.setLineDash([]);
        ctx.font=(n>20?"10px ":"11px ")+C("--mono");ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillStyle=hit?C("--ink"):C("--muted");ctx.fillText(String(e),q[0],q[1]+0.5);
        var a2=-Math.PI/2+TAU*e/n, rx=cx+(R+nr+11)*Math.cos(a2), ry=cy+(R+nr+11)*Math.sin(a2);
        ctx.font="10px "+C("--mono");ctx.fillStyle=C("--faint");ctx.fillText(String(pw(g,e,p)),rx,ry);
      }
      ctx.textBaseline="alphabetic";
      lab(ctx,"内側の数: 指数 e",10,16,C("--muted"),"left");
      lab(ctx,"外側の数: 要素 "+g+"^e mod "+p,10,32,C("--faint"),"left");
      lab(ctx,"×g^k = 1 回ごとに k 進む",w-10,16,col,"right");
      var prims=[];for(var j=1;j<=n;j++)if(gcd(j,n)===1)prims.push(pw(g,j,p));
      prims.sort(function(a,b){return a-b;});
      ro.innerHTML='g = <b>'+g+'</b>（p = '+p+' の最小の原始元） ／ g^k = '+g+'^'+k+' ≡ <b>'+pw(g,k,p)+'</b> ／ gcd('+k+', '+n+') = <b>'+d+
        '</b> ／ 位数 '+n+' / '+d+' = <b>'+ord+'</b> ／ '+
        (d===1?'<span class="ok">原始元</span>':'<span class="warn">原始元でない</span>')+
        '<br>原始元（gcd(k, '+n+') = 1 となる k の g^k）: <b>'+prims.join(", ")+'</b>（'+prims.length+' 個 = φ('+n+')）';
    }
    sp.input.addEventListener("input",draw);sk.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 03. gfpsolve — GF(p) 上の掃き出し法 ============ */
  REG.gfpsolve=function(el){
    head(el,"Elimination","GF(p) で連立 1 次方程式を掃き出す");
    var PS=[2,3,5,7,11,13];
    var row=ctrls(el);
    var sel=select(row,"法 p（素数）",PS.map(String)); sel.value="2";
    var ti=textin(row,"係数と右辺（1 本の式を ; で区切る）","2 3 4; 1 1 3");
    var out=panel(el), ro=readout(el);
    var VN=["x","y","z","w"];
    function md(a,p){return ((a%p)+p)%p;}
    function inv(a,p){for(var x=1;x<p;x++)if(a*x%p===1)return x;return 0;}
    function eq(r,n){var t=[];for(var j=0;j<n;j++)if(r[j])t.push((r[j]===1?"":r[j])+VN[j]);return (t.length?t.join(" + "):"0")+" = "+r[n];}
    function show(A,n,hl){return A.map(function(r,i){
      return '<div style="padding:.05rem .45rem;border-radius:5px;'+(hl&&hl.indexOf(i)>=0?'background:var(--signal-soft);color:var(--ink);font-weight:700':'')+'">'+(i+1)+' 本目: '+esc(eq(r,n))+'</div>';}).join("");}
    function run(){
      var p=PS[+sel.value];
      var rows=(ti.value||"").split(/[;\n]/).map(function(s){return s.trim();}).filter(function(s){return s.length;});
      var M=rows.map(function(s){return s.split(/[\s,]+/).map(Number);});
      var n=M.length;
      if(n<1||n>4||M.some(function(r){return r.length!==n+1||r.some(function(v){return !isFinite(v)||v!==Math.floor(v);});})){
        out.innerHTML='<span style="color:var(--alias)">式の本数を n（1〜4）として、各式に整数を n + 1 個（係数 n 個と右辺）並べる。例: 2 3 4; 1 1 3</span>';ro.innerHTML="";return;}
      var A=M.map(function(r){return r.map(function(v){return md(v,p);});});
      var h='<div style="color:var(--muted)">始め（係数と右辺を '+p+' で割った余りに直したもの）</div>'+show(A,n,null);
      var ok=true, stepNo=0;
      function step(txt,hl){stepNo++;h+='<div style="color:var(--muted);margin-top:.45rem">'+stepNo+'. '+txt+'</div>'+show(A,n,hl);}
      for(var c=0;c<n&&ok;c++){
        var r=-1;for(var i=c;i<n;i++)if(A[i][c]){r=i;break;}
        if(r<0){ok=false;h+='<div style="margin-top:.45rem;color:var(--alias);font-weight:700">'+VN[c]+' の係数が '+(c+1)+' 本目以降のどの式でも 0 なので、'+VN[c]+' で割ることができない</div>';break;}
        if(r!==c){var t=A[r];A[r]=A[c];A[c]=t;step((c+1)+' 本目と '+(r+1)+' 本目を入れ替える（'+(c+1)+' 本目の '+VN[c]+' の係数が 0 だった）',[c,r]);}
        var a=A[c][c];
        if(a!==1){var ia=inv(a,p);A[c]=A[c].map(function(v){return v*ia%p;});step((c+1)+' 本目に '+a+'⁻¹ = '+ia+' を掛ける（'+a+' × '+ia+' = '+(a*ia)+' ≡ 1）',[c]);}
        for(var i2=0;i2<n;i2++){
          if(i2===c||!A[i2][c])continue;
          var f=A[i2][c];
          A[i2]=A[i2].map(function(v,j){return md(v-f*A[c][j],p);});
          step((i2+1)+' 本目から '+(c+1)+' 本目の '+f+' 倍を引く（'+VN[c]+' を消す）',[i2]);
        }
      }
      out.innerHTML=h;
      if(!ok){ro.innerHTML='<span class="warn">解はただ 1 つには決まらない（解が無いか、複数ある）</span>';return;}
      var sol=A.map(function(r){return r[n];});
      var chk=M.map(function(r){var s=0;for(var j=0;j<n;j++)s+=md(r[j],p)*sol[j];var lhs=md(s,p),rhs=md(r[n],p);
        return s+' ≡ '+lhs+'（右辺 '+rhs+'）'+(lhs===rhs?' <span class="ok">✓</span>':' <span class="warn">✗</span>');});
      ro.innerHTML='解: <b>'+sol.map(function(v,j){return VN[j]+' = '+v;}).join(", ")+'</b> ／ 検算（元の式の左辺）: '+chk.join(" ／ ");
    }
    sel.addEventListener("change",run);ti.addEventListener("input",run);reg(null,run);run();
  };
