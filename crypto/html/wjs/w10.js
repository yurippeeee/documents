  /* ============ 10. 共通の補助関数（GF(2^m) と GF(2) 係数の多項式） ============ */
  var W10=(function(){
    var SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
    function sup(e){return String(e).split("").map(function(d){return SUP[+d];}).join("");}
    function al(i){return "α"+sup(i);}
    var PRIM={3:0b1011,4:0b10011,5:0b100101,6:0b1000011};
    /* GF(2^m) を原始多項式で作る。exp[i] = α^i、log[v] = i */
    function field(m){
      var n=(1<<m)-1, exp=new Array(2*n), log=new Array(n+1), v=1;
      for(var i=0;i<n;i++){exp[i]=v;log[v]=i;v<<=1;if(v>>m)v^=PRIM[m];}
      for(i=n;i<2*n;i++)exp[i]=exp[i-n];
      function mul(a,b){return (a&&b)?exp[(log[a]+log[b])%n]:0;}
      function pw(e){return exp[((e%n)+n)%n];}
      return {m:m,n:n,exp:exp,log:log,mul:mul,pw:pw,poly:PRIM[m]};
    }
    function bits(v,m){var s=v.toString(2);while(s.length<m)s="0"+s;return s;}
    /* GF(2) 係数の多項式（昇べきの配列 c[i] = x^i の係数）を文字列に */
    function pstr(c){
      var t=[];for(var i=c.length-1;i>=0;i--)if(c[i])t.push(i===0?"1":i===1?"x":"x"+sup(i));
      return t.join("+")||"0";
    }
    function pmul(a,b){var r=new Array(a.length+b.length-1).fill(0);
      for(var i=0;i<a.length;i++)if(a[i])for(var j=0;j<b.length;j++)r[i+j]^=b[j];return r;}
    /* 指数 j の共役類（j, 2j, 4j, … を n で割った余り） */
    function coset(j,n){var c=[],v=j%n;do{c.push(v);v=(2*v)%n;}while(v!==j%n);return c;}
    /* 共役類の最小多項式 Π(x + α^i)。係数は 0 か 1 になる（昇べき） */
    function minpoly(F,cls){
      var P=[1];
      cls.forEach(function(i){var a=F.pw(i),Q=new Array(P.length+1).fill(0);
        for(var k=0;k<P.length;k++){Q[k+1]^=P[k];Q[k]^=F.mul(P[k],a);}P=Q;});
      return P;
    }
    function cellsHTML(s,st){
      var STY={n:"",c:"background:color-mix(in srgb,var(--blue) 16%,transparent);",e:"background:var(--alias-soft);color:var(--alias);font-weight:700;",
               z:"color:var(--faint);",h:"background:var(--signal-soft);color:var(--signal);font-weight:700;"};
      if(!st)st="n";if(st.length===1)st=new Array(s.length+1).join(st);
      var h="";for(var i=0;i<s.length;i++)h+='<span style="display:inline-block;min-width:1.35em;text-align:center;border-radius:4px;margin:0 1px;'+(STY[st[i]]||"")+'">'+s[i]+'</span>';
      return '<span style="white-space:nowrap">'+h+'</span>';
    }
    return {sup:sup,al:al,field:field,bits:bits,pstr:pstr,pmul:pmul,coset:coset,minpoly:minpoly,cells:cellsHTML};
  })();

  /* ============ 10. rootscan — GF(2) 係数の多項式に α^i を代入する ============ */
  REG.rootscan=function(el){
    head(el,"Roots","GF(2) 係数の多項式に α⁰ … α¹⁴ を代入する");
    var row=ctrls(el);
    var ip=textin(row,"多項式（2 進。左端が最高次）","10011","160px");
    var si=slider(row,"計算を表示する αⁱ の i",0,14,1,1);
    var out=panel(el), rd=readout(el);
    var F=W10.field(4);
    function run(){
      var P=(ip.value||"").replace(/[^01]/g,"").replace(/^0+/,"");
      if(!P||P.length>16){out.innerHTML='<span style="color:var(--alias)">0 と 1 で、次数 15 以下の 0 でない多項式を入れる</span>';rd.innerHTML="";return;}
      var d=P.length-1, coef=[];for(var e=0;e<=d;e++)coef[e]=+P[d-e];
      var vals=[], roots=[];
      for(var i=0;i<15;i++){var v=0;for(var e2=0;e2<=d;e2++)if(coef[e2])v^=F.pw(i*e2);vals.push(v);if(v===0)roots.push(i);}
      var sel=+si.input.value; si.val.textContent=W10.al(sel);
      var h='<div style="margin-bottom:.35rem">p(x) = '+W10.pstr(coef)+'（次数 '+d+'）</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.35rem">';
      for(var k=0;k<15;k++){var z=vals[k]===0;
        h+='<div style="min-width:4.6em;text-align:center;border:1px solid '+(k===sel?'var(--blue)':'var(--line)')+';border-radius:6px;padding:.15rem .3rem;'+(z?'background:var(--signal-soft)':'')+'">'+
          '<div style="color:var(--blue);font-weight:700">'+W10.al(k)+'</div>'+
          '<div style="color:var(--faint);font-size:.72rem">'+W10.bits(F.pw(k),4)+'</div>'+
          '<div style="'+(z?'color:var(--signal);font-weight:700':'')+'">'+W10.bits(vals[k],4)+'</div></div>';}
      h+='</div><div style="color:var(--faint);font-size:.72rem;margin-top:.2rem">各マス: 上から αⁱ、そのビット表現、p(αⁱ) の値（緑のマスが根）</div>';
      /* 選んだ i の計算 */
      var terms=[];for(var e3=d;e3>=0;e3--)if(coef[e3])terms.push(e3);
      h+='<div style="margin-top:.6rem;color:var(--muted)">p('+W10.al(sel)+') の計算（各項 x<sup>e</sup> は α<sup>'+sel+'·e</sup> になる）</div><div>';
      terms.forEach(function(e4,idx){var ex=(sel*e4)%15;
        h+=(idx?' ⊕ ':'')+'<span title="x^'+e4+'">'+W10.al(ex)+'</span> <span style="color:var(--faint)">('+W10.bits(F.pw(ex),4)+')</span>';});
      h+=' = <b>'+W10.bits(vals[sel],4)+'</b>'+(vals[sel]===0?' <span style="color:var(--signal)">→ 根</span>':'')+'</div>';
      out.innerHTML=h;
      var closed=roots.every(function(j){return roots.indexOf((2*j)%15)>=0;});
      rd.innerHTML=(roots.length?'根: <b class="ok">'+roots.map(W10.al).join(", ")+'</b>（'+roots.length+' 個 ≤ 次数 '+d+'）':'GF(2⁴) の 0 以外の要素に根は無い')+
        (roots.length?' ／ 根の指数を 2 倍して 15 で割った余りも、また根の指数 '+(closed?'<span class="ok">✓（2 節）</span>':''):'');
    }
    ip.addEventListener("input",run);si.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 10. bchgen — t から生成多項式を組み立てる ============ */
  REG.bchgen=function(el){
    head(el,"BCH","訂正したいビット数 t から g(x) を組み立てる");
    var row=ctrls(el);
    var sm=select(row,"体 GF(2ᵐ)",["m = 3（n = 7、x³+x+1）","m = 4（n = 15、x⁴+x+1）","m = 5（n = 31、x⁵+x²+1）","m = 6（n = 63、x⁶+x+1）"]);
    sm.value="1";
    var st=slider(row,"訂正したいビット数 t",1,4,2,1);
    var cv=screen(el,250),cc=cctx(cv);
    var out=panel(el), rd=readout(el);
    var th='style="padding:.12rem .6rem;text-align:left;color:var(--muted);font-weight:600"', td='style="padding:.1rem .6rem;text-align:left"';
    var cur=null;
    function build(m,t){
      var F=W10.field(m), n=F.n, need=[], used={}, classes=[];
      for(var j=1;j<=2*t;j++)need.push(j%n);
      need.forEach(function(j){
        var c=W10.coset(j,n), key=Math.min.apply(null,c);
        if(!used[key]){used[key]=true;classes.push({cls:c,M:W10.minpoly(F,c),req:[]});}
        classes.forEach(function(o){if(o.cls.indexOf(j)>=0&&o.req.indexOf(j)<0)o.req.push(j);});
      });
      var g=[1];classes.forEach(function(o){g=W10.pmul(g,o.M);});
      return {F:F,n:n,t:t,need:need,classes:classes,g:g,k:n-(g.length-1)};
    }
    function tmax(m){var n=(1<<m)-1;for(var t=1;t<=n;t++){if(build(m,t).k<=1)return t;}return 1;}
    /* 最小距離（k ≤ 21 なら全符号語の重みを数える） */
    function dmin(B){
      var k=B.k,n=B.n;if(k>21)return null;
      var rows=[];for(var i=0;i<k;i++){var lo=0,hi=0;for(var e=0;e<B.g.length;e++)if(B.g[e]){var p=e+i;if(p<32)lo|=(1<<p);else hi|=(1<<(p-32));}rows.push([lo>>>0,hi>>>0]);}
      function pc(x){x=x-((x>>>1)&0x55555555);x=(x&0x33333333)+((x>>>2)&0x33333333);return (((x+(x>>>4))&0x0F0F0F0F)*0x01010101)>>>24;}
      var lo=0,hi=0,best=n;
      for(var c=1;c<(1<<k);c++){var j=0,v=c;while(!(v&1)){v>>=1;j++;}lo^=rows[j][0];hi^=rows[j][1];var w=pc(lo>>>0)+pc(hi>>>0);if(w<best)best=w;}
      return best;
    }
    function draw(){
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(!cur)return;
      var n=cur.n, cx=w/2, cy=h/2+2, R=Math.min(h/2-34,w/2-40);
      var pal=[C("--signal"),C("--blue"),C("--alias"),C("--muted")];
      var inClass={};cur.classes.forEach(function(o,ci){o.cls.forEach(function(j){inClass[j]=ci;});});
      function P(j){var a=-Math.PI/2+TAU*j/n;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];}
      /* 使う類の中の 2 乗の矢印（j → 2j） */
      cur.classes.forEach(function(o,ci){
        ctx.strokeStyle=pal[ci%pal.length];ctx.lineWidth=1.3;ctx.globalAlpha=0.75;
        o.cls.forEach(function(j){var a=P(j),b=P((2*j)%n);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();});
        ctx.globalAlpha=1;
      });
      var rr=n<=15?11:(n<=31?7:4.2);
      for(var j=0;j<n;j++){
        var p=P(j), ci=inClass[j], col=(ci===undefined)?C("--line"):pal[ci%pal.length];
        ctx.beginPath();ctx.arc(p[0],p[1],rr,0,TAU);ctx.fillStyle=(ci===undefined)?C("--panel"):col;ctx.fill();
        ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.stroke();
        if(cur.need.indexOf(j)>=0){ctx.beginPath();ctx.arc(p[0],p[1],rr+4,0,TAU);ctx.strokeStyle=C("--ink");ctx.lineWidth=1.6;ctx.stroke();}
        if(n<=31||j%3===0){var q=[cx+(R+rr+12)*Math.cos(-Math.PI/2+TAU*j/n),cy+(R+rr+12)*Math.sin(-Math.PI/2+TAU*j/n)+4];
          lab(ctx,String(j),q[0],q[1],ci===undefined?C("--faint"):C("--ink"),"center");}
      }
      lab(ctx,"点 = α の指数（0〜"+(n-1)+"）",10,16,C("--muted"),"left");
      lab(ctx,"輪で囲んだ点 = 要求する根 α¹〜α"+W10.sup(2*cur.t),10,32,C("--muted"),"left");
      lab(ctx,"色 = g に入る共役類",10,48,C("--muted"),"left");
    }
    function run(){
      var m=[3,4,5,6][+sm.value], tm=tmax(m);
      st.input.max=tm; if(+st.input.value>tm)st.input.value=tm;
      var t=+st.input.value; st.val.textContent=t;
      cur=build(m,t);
      var h='<table style="border-collapse:collapse"><tr><th '+th+'>共役類（指数）</th><th '+th+'>要求した根</th><th '+th+'>最小多項式 M(x)</th><th '+th+'>次数</th></tr>';
      cur.classes.forEach(function(o){
        h+='<tr><td '+td+'>{'+o.cls.join(", ")+'}</td><td '+td+'>'+o.req.map(W10.al).join(", ")+'</td><td '+td+' style="padding:.1rem .6rem;color:var(--signal)">'+W10.pstr(o.M)+'</td><td '+td+'>'+(o.M.length-1)+'</td></tr>';
      });
      h+='</table>';
      var gb=cur.g.slice().reverse().join("");
      h+='<div style="margin-top:.5rem">g(x) = '+cur.classes.map(function(o){return "("+W10.pstr(o.M)+")";}).join(" · ")+'</div>';
      h+='<div>　　 = <b>'+W10.pstr(cur.g)+'</b>　<span style="color:var(--faint)">（'+gb+'、次数 '+(cur.g.length-1)+'）</span></div>';
      out.innerHTML=h;
      var d=dmin(cur), des=2*t+1;
      rd.innerHTML='<b class="ok">('+cur.n+', '+cur.k+') 符号</b> ／ 検査ビット n − k = deg g = <b>'+(cur.g.length-1)+'</b> ／ 設計距離 2t + 1 = <b>'+des+'</b> ／ '+
        (d===null?'実際の最小距離: 符号語が多いので数えない（2<sup>'+cur.k+'</sup> 個）':'実際の最小距離（全符号語の重みの最小）= <b>'+d+'</b>'+(d>des?'（設計距離より大きい）':'')+' <span class="ok">≥ '+des+' ✓</span>');
      draw();
    }
    sm.addEventListener("change",run);st.input.addEventListener("input",run);reg(cv,draw);run();
  };

  /* ============ 10. bchdec — (15,7) 符号の復号 ============ */
  REG.bchdec=function(el){
    head(el,"BCH Decode","(15,7) 符号で 2 ビットまでの誤りを訂正する");
    var row=ctrls(el);
    var iu=textin(row,"情報ビット u（7 ビット）","0000001","110px");
    var s1=slider(row,"誤りの位置 1",-1,14,10,1), s2=slider(row,"誤りの位置 2",-1,14,3,1), s3=slider(row,"誤りの位置 3",-1,14,-1,1);
    var out=panel(el), rd=readout(el);
    var F=W10.field(4), G=[1,0,0,0,1,0,1,1,1];  /* g = x^8+x^7+x^6+x^4+1（昇べき） */
    function lg(v){return v===0?"0":W10.al(F.log[v]);}
    function ev(r,i){var v=0;for(var e=0;e<15;e++)if(r[e])v^=F.pw(i*e);return v;}
    function str(a){var s="";for(var i=14;i>=0;i--)s+=a[i];return s;}
    function run(){
      var U=(iu.value||"").replace(/[^01]/g,"");
      if(U.length>7){U=U.slice(U.length-7);}while(U.length<7)U="0"+U;
      var u=[];for(var i=0;i<7;i++)u[i]=+U[6-i];
      var c=W10.pmul(u,G);while(c.length<15)c.push(0);
      var e=new Array(15).fill(0), sl=[s1,s2,s3];
      sl.forEach(function(s){var p=+s.input.value;s.val.textContent=p<0?"なし":p;if(p>=0)e[p]^=1;});
      var r=c.map(function(v,k){return v^e[k];});
      var nerr=e.reduce(function(a,b){return a+b;},0);
      var S1=ev(r,1), S3=ev(r,3), lam=null, kind="";
      if(S1===0&&S3===0){lam=[1];kind="誤り無し";}
      else if(S1===0){lam=null;kind="S₁ = 0 なのに S₃ ≠ 0 → 誤りは 3 個以上";}
      else{
        var S1c=F.mul(S1,F.mul(S1,S1)), sg2=F.mul(S3,F.exp[(15-F.log[S1])%15])^F.mul(S1,S1);
        if(S3===S1c){lam=[1,S1];kind="S₃ = S₁³ なので誤り 1 個として計算";}else{lam=[1,S1,sg2];kind="誤り 2 個として計算（σ₂ = S₃/S₁ + S₁² = "+lg(sg2)+"）";}
      }
      var roots=[], vals=[];
      if(lam){for(var i2=0;i2<15;i2++){var x=F.pw(-i2),v=0,xp=1;for(var k=0;k<lam.length;k++){v^=F.mul(lam[k],xp);xp=F.mul(xp,x);}vals.push(v);if(v===0)roots.push(i2);}}
      var fixed=r.slice(), okRoots=lam&&roots.length===lam.length-1;
      if(okRoots)roots.forEach(function(p){fixed[p]^=1;});
      var est="",cst="",rst="";for(var q=14;q>=0;q--){est+=e[q]?"e":"z";cst+=c[q]?"c":"n";rst+=e[q]?"e":(r[q]?"c":"n");}
      var h='<table style="border-collapse:collapse">';
      function trow(lab,bits,sty){return '<tr><td style="padding:.1rem .5rem;color:var(--muted);white-space:nowrap">'+lab+'</td><td style="padding:.1rem .3rem">'+W10.cells(bits,sty)+'</td></tr>';}
      var posrow="";for(var pp=14;pp>=0;pp--)posrow+='<span style="display:inline-block;min-width:1.35em;text-align:center;border-radius:4px;margin:0 1px;color:var(--faint);letter-spacing:-.06em">'+pp+'</span>';
      h+='<tr><td style="padding:.1rem .5rem;color:var(--muted)">位置</td><td style="padding:.1rem .3rem;white-space:nowrap">'+posrow+'</td></tr>';
      h+=trow("送った c = u·g",str(c),cst)+trow("誤り e",str(e),est)+trow("受信語 r",str(r),rst);
      if(okRoots)h+=trow("訂正後",str(fixed),"n");
      h+='</table>';
      h+='<div style="margin-top:.5rem">S₁ = r(α) = <b>'+lg(S1)+'</b>（'+W10.bits(S1,4)+'） ／ S₃ = r(α³) = <b>'+lg(S3)+'</b>（'+W10.bits(S3,4)+'） ／ 復号器の判断: '+kind+'</div>';
      if(lam){
        var ls=["1"];for(var k2=1;k2<lam.length;k2++)if(lam[k2])ls.push((lam[k2]===1?"":lg(lam[k2]))+(k2===1?"x":"x²"));
        h+='<div>Λ(x) = <b>'+ls.join(" + ")+'</b></div>';
        if(lam.length>1){
          h+='<div style="margin-top:.35rem;color:var(--muted)">チェン探索: Λ(α⁻ⁱ)</div><div style="white-space:nowrap;overflow-x:auto">';
          for(var i3=0;i3<15;i3++){var z=vals[i3]===0;
            h+='<span style="display:inline-block;text-align:center;margin:0 2px;padding:.05rem .15rem;border-radius:4px;'+(z?'background:var(--signal-soft);color:var(--signal);font-weight:700':'')+'"><span style="font-size:.7rem;color:var(--faint)">'+i3+'</span><br>'+W10.bits(vals[i3],4)+'</span>';}
          h+='</div>';
        }
      }
      out.innerHTML=h;
      var same=okRoots&&fixed.join("")===c.join("");
      var msg;
      if(nerr===0)msg='<span class="ok">誤り無し → シンドロームはすべて 0</span>';
      else if(!lam)msg='<span class="warn">訂正できないことが分かる（検出のみ）</span>';
      else if(!okRoots)msg='<span class="warn">Λ の根が '+roots.length+' 個しか見つからない → 訂正できないことが分かる（検出のみ）</span>';
      else if(same)msg='<span class="ok">位置 '+roots.slice().sort(function(a,b){return b-a;}).join(", ")+' を反転して、送った符号語に戻った</span>';
      else msg='<span class="warn">位置 '+roots.join(", ")+' を反転したが、送ったものとは別の符号語になった（誤訂正）</span>';
      rd.innerHTML='誤りの数 <b>'+nerr+'</b> ／ '+msg+(nerr>2?' ／ 訂正能力 t = 2 を超えている':'');
    }
    iu.addEventListener("input",run);[s1,s2,s3].forEach(function(s){s.input.addEventListener("input",run);});reg(null,run);run();
  };
