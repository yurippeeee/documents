  /* ============ 16. 共通: BigInt による整数の計算（ほかの章と名前が衝突しないよう R16 にまとめる） ============ */
  var R16=(function(){
    function big(s){s=String(s).trim();if(!/^\d+$/.test(s))return null;try{return BigInt(s);}catch(e){return null;}}
    function mod(a,m){var r=a%m;return r<0n?r+m:r;}
    function powmod(b,e,m){var r=1n;b=mod(b,m);while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return m===1n?0n:r;}
    function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){var t=a%b;a=b;b=t;}return a;}
    /* 拡張ユークリッド: r0 = a, r1 = b から始め、r_i = a x_i + b y_i を保つ */
    function egcd(a,b){var r=[a,b],x=[1n,0n],y=[0n,1n],q=[];
      while(r[r.length-1]!==0n){var i=r.length-1,qq=r[i-1]/r[i];q.push(qq);
        r.push(r[i-1]-qq*r[i]);x.push(x[i-1]-qq*x[i]);y.push(y[i-1]-qq*y[i]);}
      return {r:r,x:x,y:y,q:q};}
    function inv(a,m){var t=egcd(m,mod(a,m)),k=t.r.length-2;if(t.r[k]!==1n)return null;return mod(t.y[k],m);}
    var SP=[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
    function isPrime(n){if(n<2n)return false;
      for(var i=0;i<SP.length;i++){if(n===SP[i])return true;if(n%SP[i]===0n)return false;}
      var d=n-1n,s=0;while((d&1n)===0n){d>>=1n;s++;}
      for(var j=0;j<SP.length;j++){var x=powmod(SP[j],d,n);if(x===1n||x===n-1n)continue;
        var ok=false;for(var r=1;r<s;r++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}
      return true;}
    function bits(x){return x.toString(2);}
    function ops(x){var b=bits(x);return {sq:b.length-1,mul:(b.match(/1/g)||[]).length-1};}
    function sup(a,b){return a+'<sup>'+b+'</sup>';}
    var RED='color:var(--alias)',BLUE='color:var(--blue)',SIGC='color:var(--signal)',FAINT='color:var(--faint)';
    return {big:big,mod:mod,powmod:powmod,gcd:gcd,egcd:egcd,inv:inv,isPrime:isPrime,bits:bits,ops:ops,sup:sup,
      RED:RED,BLUE:BLUE,SIGC:SIGC,FAINT:FAINT};
  })();

  /* ============ 16. rsaflow — 鍵生成から暗号化・復号まで ============ */
  REG.rsaflow=function(el){
    head(el,"RSA","鍵生成から暗号化・復号まで");
    var row=ctrls(el);
    var ip=textin(row,"素数 p","61"),iq=textin(row,"素数 q","53"),ie=textin(row,"公開指数 e","17"),im=textin(row,"平文 M","65");
    var show=checkbox(ctrls(el),"d を求める拡張ユークリッドの表を表示する",false);
    var out=panel(el),rd=readout(el);
    function bad(msg){out.innerHTML='<span style="'+R16.RED+'">'+msg+'</span>';rd.innerHTML="";}
    function line(t,cls){return '<div>'+t+(cls?' <span style="'+cls[1]+'">（'+cls[0]+'）</span>':'')+'</div>';}
    function run(){
      var p=R16.big(ip.value),q=R16.big(iq.value),e=R16.big(ie.value),M=R16.big(im.value);
      if(p===null||q===null||e===null||M===null)return bad("p、q、e、M には 0 以上の整数を入れる");
      if(p.toString().length>160||q.toString().length>160)return bad("p、q は 160 桁までにする");
      if(!R16.isPrime(p)||!R16.isPrime(q))return bad("p と q はどちらも素数にする（"+(!R16.isPrime(p)?"p":"q")+" が素数でない）");
      if(p===q)return bad("p と q は異なる素数にする");
      var n=p*q,phi=(p-1n)*(q-1n);
      if(e<=1n||e>=phi)return bad("e は 1 < e < φ(n) = "+phi+" の範囲にする");
      var g=R16.gcd(e,phi);
      if(g!==1n)return bad("gcd(e, φ(n)) = gcd("+e+", "+phi+") = "+g+" ≠ 1 なので、e の逆元 d が存在しない。e を変える");
      if(M>=n)return bad("平文 M は n = "+n+" 未満にする");
      var d=R16.inv(e,phi),ct=R16.powmod(M,e,n),back=R16.powmod(ct,d,n);
      var oe=R16.ops(e),od=R16.ops(d);
      var h='<div style="color:var(--muted)">鍵生成（Bob）</div>';
      h+=line('n = p × q = '+p+' × '+q+' = <b style="'+R16.BLUE+'">'+n+'</b>',["公開",R16.BLUE]);
      h+=line('φ(n) = (p − 1)(q − 1) = '+(p-1n)+' × '+(q-1n)+' = <b style="'+R16.RED+'">'+phi+'</b>',["秘密",R16.RED]);
      h+=line('e = <b style="'+R16.BLUE+'">'+e+'</b>、gcd(e, φ(n)) = 1',["公開",R16.BLUE]);
      h+=line('d = e<sup>−1</sup> mod φ(n) = <b style="'+R16.RED+'">'+d+'</b>　<span style="'+R16.FAINT+'">検算: e × d mod φ(n) = '+(e*d%phi)+'</span>',["秘密",R16.RED]);
      if(show.checked){
        var t=R16.egcd(phi,e),rows=[],k=t.r.length-2,N=Math.min(t.r.length,32);
        for(var i=0;i<N;i++){var last=i===t.r.length-1;
          rows.push([i,(i===k?'<b>'+t.r[i]+'</b>':t.r[i]),(i>=1&&i<=t.q.length?t.q[i-1]:"—"),last?"":t.x[i],last?"":(i===k?'<b style="'+R16.RED+'">'+t.y[i]+'</b>':t.y[i])]);}
        h+='<div style="margin:.4rem 0 .2rem;color:var(--muted)">r₀ = φ(n)、r₁ = e から始め、各行で r = φ(n)·x + e·y を保つ（商は 1 行上の r をその行の r で割った商）</div>';
        h+=tbl(["i","r","商","x","y"],rows,["right","right","right","right","right"]);
        if(t.r.length>N)h+='<div style="'+R16.FAINT+'">（表は 32 行までを表示）</div>';
        h+='<div>r = 1 の行の y = '+t.y[k]+' を法 φ(n) で 0 以上にした値が d = '+d+'</div>';
      }
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line);color:var(--muted)">暗号化（Alice、公開鍵だけを使う）</div>';
      h+='<div>C = '+R16.sup('M','e')+' mod n = '+R16.sup(M,e)+' mod '+n+' = <b style="'+R16.SIGC+'">'+ct+'</b>　<span style="'+R16.FAINT+'">2 乗 '+oe.sq+' 回 + 掛け算 '+oe.mul+' 回</span></div>';
      h+='<div style="margin-top:.4rem;color:var(--muted)">復号（Bob、秘密鍵 d を使う）</div>';
      h+='<div>'+R16.sup('C','d')+' mod n = '+R16.sup(ct,d)+' mod '+n+' = <b style="'+R16.SIGC+'">'+back+'</b>　<span style="'+R16.FAINT+'">2 乗 '+od.sq+' 回 + 掛け算 '+od.mul+' 回</span></div>';
      out.innerHTML=h;
      rd.innerHTML=(back===M?'<span class="ok">復号すると M = '+M+' に戻る</span>':'<span class="warn">戻らない</span>')+
        ' ／ 公開されるのは n、e、C だけ（青）。赤の値を知らずに d を求めるには n を素因数分解する必要がある';
    }
    [ip,iq,ie,im].forEach(function(x){x.addEventListener("input",run);});show.addEventListener("change",run);run();
  };

  /* ============ 16. rsacycle — M^k mod n の列が M に戻る ============ */
  REG.rsacycle=function(el){
    head(el,"Cycle","Mᵏ mod n を k = 1 から並べる");
    var row=ctrls(el);
    var PR=[3,5,7,11,13];
    var sp=select(row,"素数 p",PR.map(String)),sq=select(row,"素数 q",PR.map(String));
    sp.value="1";sq.value="3";
    var row2=ctrls(el);
    var sm=slider(row2,"平文 M",0,54,2,1),se=select(row2,"公開指数 e",["3"]);
    var out=panel(el),rd=readout(el);
    function g(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function pw(b,e,m){var r=1;b%=m;for(var i=0;i<e;i++)r=r*b%m;return r;}
    function period(M,m){var x=M%m;for(var t=1;t<=m*m;t++){if(pw(M,1+t,m)===x)return t;}return 0;}
    var lastPQ="";
    function run(){
      var p=PR[+sp.value],q=PR[+sq.value];
      if(p===q){out.innerHTML='<span style="'+R16.RED+'">p と q は異なる素数にする</span>';rd.innerHTML="";return;}
      var n=p*q,phi=(p-1)*(q-1);
      if(lastPQ!==p+","+q){lastPQ=p+","+q;
        var es=[];for(var e=3;e<phi&&es.length<12;e++)if(g(e,phi)===1)es.push(e);
        var cur=se.options[se.selectedIndex]?+se.options[se.selectedIndex].text:3;
        se.innerHTML=es.map(function(v,i){return '<option value="'+i+'">'+v+'</option>';}).join("");
        var j=es.indexOf(cur);se.value=String(j>=0?j:0);
        sm.input.max=n-1;if(+sm.input.value>n-1)sm.input.value=n-1;}
      var M=+sm.input.value,e=+se.options[se.selectedIndex].text,d=0;
      for(var x=1;x<phi;x++)if(e*x%phi===1){d=x;break;}
      sm.val.textContent=M;
      var t=period(M,n),tp=period(M,p),tq=period(M,q),L=phi+1;
      var per=(t>=2&&t<=20)?t*Math.floor(20/t):20;
      var h='<div style="color:var(--muted);margin-bottom:.3rem">n = '+n+'、φ(n) = '+phi+'。各行に '+per+' 個ずつ並べる（色付き = M と同じ値、枠 = k = φ(n) + 1）</div>';
      for(var r=0;r*per<L;r++){
        h+='<div style="white-space:nowrap;margin:.12rem 0"><span style="display:inline-block;width:4.6em;color:var(--faint);font-size:.72rem">k='+(r*per+1)+'〜</span>';
        for(var c=0;c<per&&r*per+c<L;c++){var k=r*per+c+1,v=pw(M,k,n),on=v===M%n,fin=k===L;
          h+='<span style="display:inline-block;width:2.2em;text-align:center;margin-right:2px;border-radius:4px;'+
            'border:'+(fin?'2px solid var(--alias)':'1px solid var(--line)')+';background:'+(on?'var(--signal-soft)':'var(--panel)')+
            ';color:'+(on?'var(--signal)':'var(--ink)')+';font-weight:'+(on?'700':'400')+'">'+v+'</span>';}
        h+='</div>';}
      out.innerHTML=h;
      var ed=e*d,kk=(ed-1)/phi;
      function side(m,tt){return (M%m===0)?'法 '+m+' では M ≡ 0 なので常に 0':'法 '+m+' では '+tt+' ごとに M mod '+m+' = '+(M%m)+' に戻る';}
      rd.innerHTML='e = '+e+'、d = '+d+'、ed = '+ed+' = 1 + '+kk+' × '+phi+' ／ '+side(p,tp)+'、'+side(q,tq)+
        ' ／ 全体では <b>'+t+'</b> ごとに M に戻り、'+t+' は φ(n) = '+phi+' の約数 ／ '+
        '<span class="ok">M<sup>ed</sup> mod n = '+pw(M,ed,n)+' = M</span>'+(g(M,n)!==1&&M!==0?' （M は n と互いに素でない: 3 節の場合 2）':'');
    }
    [sp,sq,se].forEach(function(x){x.addEventListener("change",run);});sm.input.addEventListener("input",run);run();
  };

  /* ============ 16. rsasign — 署名と検証 ============ */
  REG.rsasign=function(el){
    head(el,"Signature","秘密鍵で署名し、公開鍵で確かめる");
    var row=ctrls(el);
    var ih=textin(row,"Bob が署名するハッシュ値 h","123"),iv=textin(row,"検証者が計算したハッシュ値","123");
    var tamper=checkbox(ctrls(el),"届いた署名 σ を 1 だけ書き換える",false);
    var out=panel(el),rd=readout(el);
    var n=3233n,e=17n,d=2753n;
    function run(){
      var h=R16.big(ih.value),hv=R16.big(iv.value);
      if(h===null||hv===null||h>=n||hv>=n){out.innerHTML='<span style="'+R16.RED+'">ハッシュ値は 0〜3232 の整数にする（n = 3233 未満）</span>';rd.innerHTML="";return;}
      var s=R16.powmod(h,d,n),sr=tamper.checked?(s+1n)%n:s,back=R16.powmod(sr,e,n),ok=back===hv;
      var H='<div style="color:var(--muted)">鍵: 公開鍵 (n, e) = (3233, 17)、秘密鍵 d = 2753（1 節）</div>';
      H+='<div style="margin-top:.4rem">署名（Bob）: σ = '+R16.sup('h','d')+' mod n = '+R16.sup(h,d)+' mod 3233 = <b style="'+R16.RED+'">'+s+'</b></div>';
      H+='<div>送るもの: メッセージと σ'+(tamper.checked?'　<span style="'+R16.RED+'">→ 途中で σ が '+sr+' に書き換えられた</span>':'')+'</div>';
      H+='<div style="margin-top:.4rem">検証（誰でも）: '+R16.sup('σ','e')+' mod n = '+R16.sup(sr,e)+' mod 3233 = <b style="'+R16.BLUE+'">'+back+'</b>'+
        '　と、届いたメッセージから計算したハッシュ値 <b>'+hv+'</b> を比べる</div>';
      out.innerHTML=H;
      rd.innerHTML=ok?'<span class="ok">一致 → 署名は有効</span> ／ σ を作れるのは d を持つ Bob だけ':
        '<span class="warn">不一致 → 署名は無効（改ざんを検出）</span> ／ '+(hv!==h?'メッセージが書き換えられると、ハッシュ値 '+hv+' に対する正しい署名は '+R16.powmod(hv,d,n)+' だが、それを作るには d が要る':'σ を書き換えると、e 乗しても h に戻らない');
    }
    [ih,iv].forEach(function(x){x.addEventListener("input",run);});tamper.addEventListener("change",run);run();
  };

  /* ============ 16. rsablind — ブラインディング攻撃 ============ */
  REG.rsablind=function(el){
    head(el,"Blinding","復号オラクルから狙いの平文を引き出す");
    var row=ctrls(el);
    var im=textin(row,"狙いの平文 M（Eve は知らない）","65"),sr=slider(row,"Eve が選ぶ r",1,80,2,1);
    var out=panel(el),rd=readout(el);
    var n=3233n,e=17n,d=2753n;
    function run(){
      var M=R16.big(im.value);sr.val.textContent=sr.input.value;
      if(M===null||M>=n){out.innerHTML='<span style="'+R16.RED+'">M は 0〜3232 の整数にする</span>';rd.innerHTML="";return;}
      var r=BigInt(sr.input.value),ct=R16.powmod(M,e,n),re=R16.powmod(r,e,n),c2=ct*re%n;
      var h='<div>① 盗聴した暗号文: C = '+R16.sup(M,17)+' mod 3233 = <b>'+ct+'</b>（Eve は C と公開鍵 (3233, 17) だけを知っている）</div>';
      h+='<div>② Eve: '+R16.sup('r','e')+' mod n = '+R16.sup(r,17)+' mod 3233 = '+re+'、C′ = C × '+R16.sup('r','e')+' mod n = '+ct+' × '+re+' mod 3233 = <b style="'+R16.RED+'">'+c2+'</b></div>';
      var g=R16.gcd(r,n);
      if(c2===ct){h+='<div>③ オラクル: C′ = C なので<b style="'+R16.RED+'">復号を断る</b></div>';out.innerHTML=h;
        rd.innerHTML='<span class="warn">r = 1 では C′ が C と同じになり、断られる。r を変える</span>';return;}
      var m2=R16.powmod(c2,d,n);
      h+='<div>③ オラクル: C′ ≠ C なので復号して返す: '+R16.sup("C′",'d')+' mod n = <b>'+m2+'</b></div>';
      if(g!==1n){h+='<div>④ r と n が共通の約数 '+g+' を持つので r の逆元は無い</div>';out.innerHTML=h;
        rd.innerHTML='<span class="warn">gcd(r, n) = '+g+'。ただしこの場合は gcd から n = '+g+' × '+(n/g)+' と素因数分解できてしまう</span>';return;}
      var ri=R16.inv(r,n),rec=m2*ri%n;
      h+='<div>④ Eve: '+R16.sup('r','−1')+' mod n = '+ri+'、M = '+m2+' × '+ri+' mod 3233 = <b style="'+R16.SIGC+'">'+rec+'</b></div>';
      out.innerHTML=h;
      rd.innerHTML=(rec===M?'<span class="ok">M = '+rec+' を復元</span>':'<span class="warn">失敗</span>')+' ／ オラクルが返したのは M × r mod n = '+M+' × '+r+' mod 3233 = '+(M*r%n)+'。C そのものは一度も復号させていない';
    }
    im.addEventListener("input",run);sr.input.addEventListener("input",run);run();
  };

  /* ============ 16. rsatiming — 繰り返し二乗法の演算の並び ============ */
  REG.rsatiming=function(el){
    head(el,"Side channel","演算の並びから秘密指数を読む");
    var row=ctrls(el);
    var idd=textin(row,"秘密指数 d（10 進）","2753");
    var cst=checkbox(ctrls(el),"定数時間の実装（桁が 0 でも掛け算をして結果を捨てる）",false);
    var cv=screen(el,200),cc=cctx(cv),rd=readout(el);
    function draw(){
      var s=cc.fit(),w=s.w,hh=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,hh);
      var d=R16.big(idd.value);
      if(d===null||d<1n){lab(ctx,"d には 1 以上の整数を入れる",12,24,C("--alias"),"left");rd.innerHTML="";return;}
      var b=d.toString(2).split("").reverse().map(Number);
      if(b.length>64){lab(ctx,"d は 64 ビットまでにする",12,24,C("--alias"),"left");rd.innerHTML="";return;}
      var ops=[];/* [種類, 桁の番号, 見せかけか] */
      b.forEach(function(bit,i){
        if(bit)ops.push(["M",i,false]);else if(cst.checked)ops.push(["M",i,true]);
        if(i<b.length-1)ops.push(["S",i,false]);});
      var x0=12,bw=Math.max(4,Math.min(22,(w-24)/ops.length-2)),gap=Math.min(2,bw/6),y0=40;
      lab(ctx,"演算の並び（時間の順）",x0,18,C("--muted"),"left");
      var trace=[],x=x0;
      ops.forEach(function(op){
        var mul=op[0]==="M",dm=op[2],hgt=mul?44:30,col=mul?(dm?C("--faint"):C("--alias")):C("--blue");
        ctx.fillStyle=mul?(dm?C("--screen"):C("--alias-soft")):"rgba(47,111,158,.16)";ctx.strokeStyle=col;ctx.lineWidth=1.2;
        if(dm)ctx.setLineDash([3,2]);rrect(ctx,x,y0+(44-hgt),bw,hgt,3);ctx.fill();ctx.stroke();ctx.setLineDash([]);
        if(bw>=14)lab(ctx,mul?"掛":"2",x+bw/2,y0+40,col,"center");
        trace.push([x,x+bw,mul&&!dm?1:(mul?1:0.62)]);x+=bw+gap;});
      /* 消費電力の模式図 */
      var yb=hh-26;lab(ctx,"消費電力の波形（模式図）",x0,y0+70,C("--muted"),"left");
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x0,yb);
      trace.forEach(function(t){var a=t[0],bb=t[1],amp=t[2]*48;ctx.lineTo(a,yb);ctx.lineTo(a+1,yb-amp);ctx.lineTo(bb-1,yb-amp);ctx.lineTo(bb,yb);});
      ctx.lineTo(Math.min(w-8,x+4),yb);ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,yb+0.5);ctx.lineTo(w-8,yb+0.5);ctx.stroke();
      var nm=ops.filter(function(o){return o[0]==="M";}).length,ns=ops.length-nm;
      var readBits=[];if(!cst.checked){for(var i=0;i<ops.length;i++){if(ops[i][0]==="S"){var prev=ops[i-1];readBits.push(prev&&prev[0]==="M"&&prev[1]===ops[i][1]?1:0);}}
        readBits.push(1);}
      rd.innerHTML='2 乗 <b>'+ns+'</b> 回、掛け算 <b>'+nm+'</b> 回 → 処理時間はこの回数に比例する ／ '+
        (cst.checked?'<span class="ok">どの桁でも「掛→2」の同じ並びなので、波形からも総時間からも桁は読めない</span>':
          '<span class="warn">掛け算の有無から桁が読める: 下位から '+readBits.join("")+' → d = '+b.slice().reverse().join("")+'₂ = '+d+'</span>（総時間だけでも 1 の個数 '+nm+' が分かる）');
    }
    idd.addEventListener("input",draw);cst.addEventListener("change",draw);reg(cv,draw);
  };
