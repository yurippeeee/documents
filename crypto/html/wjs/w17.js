  /* ============ 17. 共通: 整数と楕円曲線の計算（ほかの章と名前が衝突しないよう E17 にまとめる） ============ */
  var E17=(function(){
    function big(s){s=String(s).trim();if(!/^\d+$/.test(s))return null;try{return BigInt(s);}catch(e){return null;}}
    function bmod(a,m){var r=a%m;return r<0n?r+m:r;}
    function bpow(b,e,m){var r=1n;b=bmod(b,m);while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return m===1n?0n:r;}
    var SP=[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
    function isPrime(n){if(n<2n)return false;
      for(var i=0;i<SP.length;i++){if(n===SP[i])return true;if(n%SP[i]===0n)return false;}
      var d=n-1n,s=0;while((d&1n)===0n){d>>=1n;s++;}
      for(var j=0;j<SP.length;j++){var x=bpow(SP[j],d,n);if(x===1n||x===n-1n)continue;
        var ok=false;for(var r=1;r<s;r++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}
      return true;}
    /* g の法 p での位数（p − 1 を素因数分解できたときだけ。できなければ 0n） */
    function order(g,p){var m=p-1n,fs=[],q=2n;
      while(q*q<=m&&q<1000000n){if(m%q===0n){fs.push(q);while(m%q===0n)m/=q;}q+=(q===2n?1n:2n);}
      if(m>1n){if(isPrime(m))fs.push(m);else return 0n;}
      var o=p-1n;fs.forEach(function(f){while(o%f===0n&&bpow(g,o/f,p)===1n)o/=f;});return o;}
    /* 有限体上の楕円曲線（Number で計算。p は 1 万程度まで） */
    function nm(a,p){a%=p;return a<0?a+p:a;}
    function ninv(a,p){a=nm(a,p);var t=0,nt=1,r=p,nr=a;while(nr){var q=Math.floor(r/nr),tmp=t-q*nt;t=nt;nt=tmp;tmp=r-q*nr;r=nr;nr=tmp;}return r===1?nm(t,p):null;}
    function add(P,Q,a,p){if(!P)return Q;if(!Q)return P;
      if(P[0]===Q[0]&&nm(P[1]+Q[1],p)===0)return null;
      var lam=(P[0]===Q[0])?nm(nm(3*P[0]*P[0]+a,p)*ninv(2*P[1],p),p):nm(nm(Q[1]-P[1],p)*ninv(Q[0]-P[0],p),p);
      var x=nm(lam*lam-P[0]-Q[0],p);return [x,nm(lam*(P[0]-x)-P[1],p)];}
    function mul(k,P,a,p){var R=null,B=P;while(k>0){if(k%2===1)R=add(R,B,a,p);B=add(B,B,a,p);k=Math.floor(k/2);}return R;}
    function points(a,b,p){var sq={};for(var y=0;y<p;y++){var v=y*y%p;(sq[v]=sq[v]||[]).push(y);}
      var out=[];for(var x=0;x<p;x++){var r=nm((x*x%p)*x+a*x+b,p),ys=sq[r];if(ys)ys.forEach(function(y){out.push([x,y]);});}return out;}
    function ord(P,a,p){var R=P,k=1;while(R){R=add(R,P,a,p);k++;if(k>4*p+20)return 0;}return k;}
    function ps(P){return P?'('+P[0]+', '+P[1]+')':'O';}
    function eq(P,Q){return (!P&&!Q)||(P&&Q&&P[0]===Q[0]&&P[1]===Q[1]);}
    function sup(a,b){return a+'<sup>'+b+'</sup>';}
    return {big:big,bpow:bpow,isPrime:isPrime,order:order,nm:nm,add:add,mul:mul,points:points,ord:ord,ps:ps,eq:eq,sup:sup};
  })();

  /* ============ 17. dhflow — DH 鍵交換と盗聴者の総当たり ============ */
  REG.dhflow=function(el){
    head(el,"Diffie-Hellman","公開の値だけで同じ鍵に到達する");
    var row=ctrls(el);
    var ip=textin(row,"素数 p","23"),ig=textin(row,"g","5"),ia=textin(row,"Alice の秘密 a","6"),ib=textin(row,"Bob の秘密 b","15");
    var out=panel(el),ro=readout(el);
    function bad(m){out.innerHTML='<span style="color:var(--alias)">'+m+'</span>';ro.innerHTML="";}
    function td(t,al){return '<td style="padding:.25rem .5rem;text-align:'+(al||"left")+'">'+t+'</td>';}
    function run(){
      var p=E17.big(ip.value),g=E17.big(ig.value),a=E17.big(ia.value),b=E17.big(ib.value);
      if(p===null||g===null||a===null||b===null)return bad("p、g、a、b には 0 以上の整数を入れる");
      if(p.toString().length>40)return bad("p は 40 桁までにする");
      if(p<5n||!E17.isPrime(p))return bad("p は 5 以上の素数にする");
      if(g<2n||g>p-2n)return bad("g は 2 以上 p − 2 以下にする");
      if(a<1n||a>p-2n||b<1n||b>p-2n)return bad("a と b は 1 以上 p − 2 以下にする");
      var A=E17.bpow(g,a,p),B=E17.bpow(g,b,p),K1=E17.bpow(B,a,p),K2=E17.bpow(A,b,p),o=E17.order(g,p);
      var h='<div style="color:var(--muted);margin-bottom:.3rem">公開: p = '+p+'、g = '+g+
        (o===0n?'':'（g の位数 '+o+(o===p-1n?' = p − 1 なので原始根）':'。原始根ではないので、K の候補は '+o+' 通りに減る）'))+'</div>';
      h+='<table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:.2rem .5rem;color:var(--muted)">Alice</th>'+
        '<th style="text-align:center;color:var(--muted)">通信路（Eve に見える）</th><th style="text-align:right;padding:.2rem .5rem;color:var(--muted)">Bob</th></tr>';
      h+='<tr>'+td('秘密 a = <b style="color:var(--alias)">'+a+'</b>')+td('')+td('秘密 b = <b style="color:var(--alias)">'+b+'</b>',"right")+'</tr>';
      h+='<tr>'+td('A = '+E17.sup(g,a)+' mod p = <b style="color:var(--blue)">'+A+'</b>')+td('<span style="color:var(--blue)">A = '+A+' →</span>',"center")+td('')+'</tr>';
      h+='<tr>'+td('')+td('<span style="color:var(--blue)">← B = '+B+'</span>',"center")+td('B = '+E17.sup(g,b)+' mod p = <b style="color:var(--blue)">'+B+'</b>',"right")+'</tr>';
      h+='<tr>'+td('K = '+E17.sup('B','a')+' mod p = <b style="color:var(--signal)">'+K1+'</b>')+td('<span style="color:var(--faint)">K は流れない</span>',"center")+
        td('K = '+E17.sup('A','b')+' mod p = <b style="color:var(--signal)">'+K2+'</b>',"right")+'</tr></table>';
      /* Eve の総当たり: g^1, g^2, … を順に計算して A と比べる */
      var small=p<67108864n,lim=small?3000000:300000,found=0,x=1;
      if(small){var pn=Number(p),gn=Number(g),An=Number(A),v=gn;
        while(x<=lim){if(v===An){found=x;break;}v=v*gn%pn;x++;}}
      else{var vb=g%p;while(x<=lim){if(vb===A){found=x;break;}vb=vb*g%p;x++;}}
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line)">Eve の総当たり: '+E17.sup('g','1')+'、'+E17.sup('g','2')+'、… を順に計算して A = '+A+' と比べる → ';
      if(found){var Ke=E17.bpow(B,BigInt(found),p);
        h+='x = <b style="color:var(--alias)">'+found+'</b> で一致（'+found+' 回）。K = '+E17.sup('B','x')+' mod p = <b style="color:var(--alias)">'+Ke+'</b> も計算できる</div>';}
      else h+='<b>'+lim.toLocaleString()+'</b> 回試しても見つからない</div>';
      out.innerHTML=h;
      ro.innerHTML=(K1===K2?'<span class="ok">両者の K が一致（'+K1+'）</span>':'<span class="warn">不一致</span>')+
        ' ／ p は '+p.toString(2).length+' ビット。総当たりでは最悪 p − 2 回、平均でその半分の掛け算が要る（実際の DH の p は 2048 ビット以上）';
    }
    [ip,ig,ia,ib].forEach(function(x){x.addEventListener("input",run);});run();
  };

  /* ============ 17. dhmitm — 中間者攻撃 ============ */
  REG.dhmitm=function(el){
    head(el,"Man-in-the-middle","Mallory が DH に割り込む");
    var row=ctrls(el);
    var sa=slider(row,"Alice の秘密 a",1,21,6,1),sb=slider(row,"Bob の秘密 b",1,21,15,1),sm=slider(row,"Mallory の秘密 m",1,21,9,1);
    var on=checkbox(ctrls(el),"Mallory が通信路に割り込む",true);
    var out=panel(el),ro=readout(el);
    var p=23n,g=5n;
    function P(x,e){return E17.bpow(x,e,p);}
    function cell(t,al){return '<td style="padding:.3rem .5rem;vertical-align:top;text-align:'+(al||"left")+'">'+t+'</td>';}
    function run(){
      var a=BigInt(sa.input.value),b=BigInt(sb.input.value),m=BigInt(sm.input.value),mal=on.checked;
      sa.val.textContent=a;sb.val.textContent=b;sm.val.textContent=mal?m:"—";
      var A=P(g,a),B=P(g,b),Mv=P(g,m);
      var gotA=mal?Mv:B,gotB=mal?Mv:A,KA=P(gotA,a),KB=P(gotB,b);
      var h='<div style="color:var(--muted);margin-bottom:.3rem">公開: p = 23、g = 5</div><table style="border-collapse:collapse;width:100%">';
      h+='<tr><th style="text-align:left;padding:.2rem .5rem;color:var(--muted)">Alice</th><th style="text-align:center;color:'+(mal?'var(--alias)':'var(--muted)')+'">'+
        (mal?'Mallory（通信路の途中）':'通信路')+'</th><th style="text-align:right;padding:.2rem .5rem;color:var(--muted)">Bob</th></tr>';
      h+='<tr>'+cell('秘密 a = <b style="color:var(--alias)">'+a+'</b>')+cell(mal?'秘密 m = <b style="color:var(--alias)">'+m+'</b>':'','center')+cell('秘密 b = <b style="color:var(--alias)">'+b+'</b>','right')+'</tr>';
      h+='<tr>'+cell('A = '+E17.sup(5,a)+' mod 23 = '+A+' を送る')+cell(mal?'A = '+A+' と B = '+B+' を受け取り、<br>両者に '+E17.sup(5,m)+' mod 23 = <b style="color:var(--alias)">'+Mv+'</b> を送る':
        'A = '+A+' →<br>← B = '+B,'center')+cell('B = '+E17.sup(5,b)+' mod 23 = '+B+' を送る','right')+'</tr>';
      h+='<tr>'+cell('受け取った値 '+gotA+(mal?'（Bob の値だと思っている）':''))+cell('','center')+cell('受け取った値 '+gotB+(mal?'（Alice の値だと思っている）':''),'right')+'</tr>';
      h+='<tr>'+cell('鍵 = '+E17.sup(gotA,a)+' mod 23 = <b style="color:var(--signal)">'+KA+'</b>')+
        cell(mal?'鍵 '+E17.sup(A,m)+' mod 23 = <b style="color:var(--alias)">'+P(A,m)+'</b>（Alice と）<br>鍵 '+E17.sup(B,m)+' mod 23 = <b style="color:var(--alias)">'+P(B,m)+'</b>（Bob と）':'','center')+
        cell('鍵 = '+E17.sup(gotB,b)+' mod 23 = <b style="color:var(--signal)">'+KB+'</b>','right')+'</tr></table>';
      out.innerHTML=h;
      if(!mal)ro.innerHTML='<span class="ok">Alice と Bob は同じ鍵 '+KA+' を得る</span>（DH の通常の動作）';
      else ro.innerHTML='<span class="warn">Alice の鍵 '+KA+' と Bob の鍵 '+KB+' は'+(KA===KB?'たまたま同じだが、どちらも Mallory が知っている':'違う')+
        '。2 人はそれぞれ相手と共有したと思っている</span> ／ Mallory は両方の鍵を知っているので、Alice からの暗号文を鍵 '+KA+' で復号して読み、鍵 '+KB+' で暗号化し直して Bob に渡せる';
    }
    [sa,sb,sm].forEach(function(s){s.input.addEventListener("input",run);});on.addEventListener("change",run);run();
  };

  /* ============ 17. ecadd — 実数の曲線での点の足し算 ============ */
  REG.ecadd=function(el){
    head(el,"Point addition","直線を引いて点を足す（実数の曲線）");
    var cv=screen(el,330),cc=cctx(cv);
    var row=ctrls(el);
    var sa=slider(row,"係数 a",-3,3,-1,0.5),sb=slider(row,"係数 b",-2,3,1,0.5);
    var row2=ctrls(el);
    var sP=slider(row2,"P の位置",-100,100,53,1),sQ=slider(row2,"Q の位置",-100,100,-70,1);
    var dbl=checkbox(ctrls(el),"Q を P に重ねる（P + P、接線を使う）",false);
    var ro=readout(el);
    var XR=[-3,4.2],YR=[-6,6];
    function F(x,a,b){return x*x*x+a*x+b;}
    function rootOf(a,b,c){var x=Math.max(4,Math.sqrt(Math.abs(a))+4);/* x^3 + a x + b = c の最大の実数解（ニュートン法） */
      for(var i=0;i<200;i++){var d=3*x*x+a,nx=x-(F(x,a,b)-c)/(Math.abs(d)<1e-9?1e-9:d);if(Math.abs(nx-x)<1e-13){x=nx;break;}x=nx;}return x;}
    function at(s,a,b,x0,xr){var t=s/100,x=x0+(xr-x0)*t*t,y=Math.sqrt(Math.max(0,F(x,a,b)));return [x,t<0?-y:y];}
    function fmt(v){return (Math.abs(v)<5e-4?0:v).toFixed(3);}
    function draw(){
      var a=+sa.input.value,b=+sb.input.value;sa.val.textContent=a;sb.val.textContent=b;
      sP.val.textContent=sP.input.value;sQ.val.textContent=dbl.checked?"P と同じ":sQ.input.value;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var X=function(x){return 12+(x-XR[0])/(XR[1]-XR[0])*(w-24);},Y=function(y){return h-12-(y-YR[0])/(YR[1]-YR[0])*(h-24);};
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();
      ctx.moveTo(X(XR[0]),Y(0));ctx.lineTo(X(XR[1]),Y(0));ctx.moveTo(X(0),Y(YR[0]));ctx.lineTo(X(0),Y(YR[1]));ctx.stroke();
      /* 曲線: x を細かく刻み、x^3 + a x + b ≥ 0 の範囲で y = ±√ を描く */
      ctx.strokeStyle=C("--muted");ctx.lineWidth=2;
      [1,-1].forEach(function(sg){var on=false;ctx.beginPath();
        for(var i=0;i<=1400;i++){var x=XR[0]+(XR[1]-XR[0])*i/1400,v=F(x,a,b);
          if(v<0||Math.sqrt(v)>YR[1]){on=false;continue;}
          var y=sg*Math.sqrt(v);if(!on){ctx.moveTo(X(x),Y(y));on=true;}else ctx.lineTo(X(x),Y(y));}
        ctx.stroke();});
      var disc=4*a*a*a+27*b*b,x0=rootOf(a,b,0),xr=Math.min(XR[1]-0.05,rootOf(a,b,YR[1]*YR[1]*0.97));
      /* 曲線の右側の部分が x0 の近くで上下につながるように、y = 0 付近も描き足す */
      ctx.beginPath();for(var j=0;j<=200;j++){var tt=-1+2*j/200,c0=at(tt*25,a,b,x0,xr);j?ctx.lineTo(X(c0[0]),Y(c0[1])):ctx.moveTo(X(c0[0]),Y(c0[1]));}ctx.stroke();
      var P=at(+sP.input.value,a,b,x0,xr),Q=dbl.checked?P.slice():at(+sQ.input.value,a,b,x0,xr);
      var same=dbl.checked||+sP.input.value===+sQ.input.value,vert=false,lam=0;
      if(same){if(Math.abs(P[1])<1e-9)vert=true;else lam=(3*P[0]*P[0]+a)/(2*P[1]);}
      else if(Math.abs(P[0]-Q[0])<1e-9){vert=true;}
      else lam=(Q[1]-P[1])/(Q[0]-P[0]);
      function pt(p,lb,col,fill,dx,dy){var x=X(p[0]),y=Y(p[1]);ctx.beginPath();ctx.arc(x,y,6,0,TAU);
        ctx.fillStyle=fill?col:C("--panel");ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
        ctx.font="bold 12px "+C("--sans");ctx.fillStyle=col;ctx.textAlign="left";ctx.fillText(lb,x+(dx||9),y+(dy||-8));}
      if(vert){
        ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(X(P[0]),Y(YR[0]));ctx.lineTo(X(P[0]),Y(YR[1]));ctx.stroke();
        pt(P,"P",C("--ink"),true);if(!same)pt(Q,"Q",C("--ink"),true,9,16);
        lab(ctx,"垂直線: 3 つ目の交点は無限遠点 O",X(P[0])+8,Y(YR[1])+14,C("--blue"),"left");
        ro.innerHTML=(disc===0?'<span class="warn">4a³ + 27b² = 0（特異な曲線）。特異点の近くでは足し算が定義できない</span> ／ ':'')+
          'P = ('+fmt(P[0])+', '+fmt(P[1])+')'+(same?'':'、Q = ('+fmt(Q[0])+', '+fmt(Q[1])+')')+' ／ 直線が垂直なので <b class="ok">P + '+(same?'P':'Q')+' = O</b>（無限遠点）';
        return;}
      var x3=lam*lam-P[0]-Q[0],y3=lam*(P[0]-x3)-P[1],R=[x3,-y3];
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.beginPath();
      ctx.moveTo(X(XR[0]),Y(lam*(XR[0]-P[0])+P[1]));ctx.lineTo(X(XR[1]),Y(lam*(XR[1]-P[0])+P[1]));ctx.stroke();
      var inView=x3>=XR[0]&&x3<=XR[1]&&Math.abs(y3)<=YR[1];
      if(inView){ctx.setLineDash([5,4]);ctx.strokeStyle=C("--signal");ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(X(x3),Y(-y3));ctx.lineTo(X(x3),Y(y3));ctx.stroke();ctx.setLineDash([]);
        pt(R,"R′",C("--blue"),false,9,R[1]<0?16:-8);pt([x3,y3],same?"2P":"P + Q",C("--signal"),true,9,y3<0?16:-8);}
      pt(P,"P",C("--ink"),true);if(!same)pt(Q,"Q",C("--ink"),true,9,16);
      if(!inView)lab(ctx,"R′ と P + Q は表示範囲の外",16,22,C("--alias"),"left");
      var chk=y3*y3-F(x3,a,b);
      ro.innerHTML=(disc===0?'<span class="warn">4a³ + 27b² = 0（特異な曲線）。特異点では接線が決まらず、足し算が定義できない</span> ／ ':'')+
        'P = ('+fmt(P[0])+', '+fmt(P[1])+')'+(same?'':'、Q = ('+fmt(Q[0])+', '+fmt(Q[1])+')')+
        ' ／ λ = '+(same?'(3x₁² + a)/(2y₁)':'(y₂ − y₁)/(x₂ − x₁)')+' = '+fmt(lam)+
        ' ／ x₃ = λ² − x₁ − x₂ = '+fmt(x3)+'、y₃ = λ(x₁ − x₃) − y₁ = '+fmt(y3)+
        ' ／ <b class="ok">'+(same?'2P':'P + Q')+' = ('+fmt(x3)+', '+fmt(y3)+')</b>（y₃² − (x₃³ + a x₃ + b) = '+fmt(chk)+' なので曲線上）';
    }
    [sa,sb,sP,sQ].forEach(function(s){s.input.addEventListener("input",draw);});dbl.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 17. ecmul — ダブル・アンド・アッドでスカラー倍 ============ */
  REG.ecmul=function(el){
    head(el,"Scalar multiplication","ダブル・アンド・アッドで kG を求める");
    var cv=screen(el,330),cc=cctx(cv);
    var row=ctrls(el);
    var PR=[11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97];
    var sp=select(row,"素数 p",PR.map(String));sp.value=String(PR.indexOf(17));
    var sa=slider(row,"係数 a",0,16,2,1),sb=slider(row,"係数 b",0,16,2,1);
    var row2=ctrls(el);
    var sg=slider(row2,"ベースポイント G（点の番号）",0,17,4,1),sk=slider(row2,"k",1,19,13,1);
    var out=panel(el),ro=readout(el);
    function draw(){
      var p=PR[+sp.value];sa.input.max=p-1;sb.input.max=p-1;
      if(+sa.input.value>p-1)sa.input.value=p-1;if(+sb.input.value>p-1)sb.input.value=p-1;
      var a=+sa.input.value,b=+sb.input.value;sa.val.textContent=a;sb.val.textContent=b;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(E17.nm(4*a*a*a+27*b*b,p)===0){lab(ctx,"4a³ + 27b² ≡ 0 (mod "+p+") なので特異な曲線。a か b を変える",14,24,C("--alias"),"left");
        out.innerHTML="";ro.innerHTML="";sg.val.textContent="—";sk.val.textContent="—";return;}
      var pts=E17.points(a,b,p);sg.input.max=pts.length-1;if(+sg.input.value>pts.length-1)sg.input.value=0;
      var G=pts[+sg.input.value],n=E17.ord(G,a,p);sg.val.textContent=E17.ps(G);
      sk.input.max=n;if(+sk.input.value>n)sk.input.value=n;var k=+sk.input.value;sk.val.textContent=k;
      /* 方眼と点 */
      var pad=22,S=Math.min((w-2*pad-150)/p,(h-2*pad)/p),gx=pad,gy=h-pad;
      var X=function(x){return gx+x*S+S/2;},Y=function(y){return gy-y*S-S/2;};
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(gx,gy-p*S,p*S,p*S);
      ctx.fillStyle=C("--faint");pts.forEach(function(q){ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),Math.max(1.6,S*0.18),0,TAU);ctx.fill();});
      /* ダブル・アンド・アッド */
      var bits=k.toString(2).split("").reverse(),B=G,acc=null,rows=[],dbl=0,adds=0,chain=[];
      for(var i=0;i<bits.length;i++){chain.push(B);
        if(bits[i]==="1"){acc=acc?E17.add(acc,B,a,p):B;if(rows.some(function(r){return r.added;}))adds++;rows.push({i:i,B:B,bit:1,acc:acc,added:true});}
        else rows.push({i:i,B:B,bit:0,acc:acc,added:false});
        if(i<bits.length-1){B=E17.add(B,B,a,p);dbl++;}}
      function mark(q,col,r,fill,lb,dy){if(!q)return;var x=X(q[0]),y=Y(q[1]);ctx.beginPath();ctx.arc(x,y,r,0,TAU);
        if(fill){ctx.fillStyle=col;ctx.fill();}else{ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();}
        if(lb&&p<=47)lab(ctx,lb,x+r+2,y+(dy||-4),col,"left");}
      chain.forEach(function(q,i){mark(q,C("--blue"),Math.max(5,S*0.42),false,i?Math.pow(2,i)+"G":"G",-6);});
      rows.forEach(function(r){if(r.added&&r.acc&&!E17.eq(r.acc,acc))mark(r.acc,C("--signal"),Math.max(4,S*0.3),true,null);});
      mark(acc,C("--alias"),Math.max(6,S*0.5),true,k+"G",12);
      var lx=gx+p*S+16;lab(ctx,"○ 2 倍した点",lx,gy-p*S+14,C("--blue"),"left");lab(ctx,"● 途中の和",lx,gy-p*S+32,C("--signal"),"left");
      lab(ctx,"● "+k+"G",lx,gy-p*S+50,C("--alias"),"left");lab(ctx,"点の個数 "+pts.length+" + O",lx,gy-p*S+76,C("--muted"),"left");
      lab(ctx,"G の位数 n = "+n,lx,gy-p*S+94,C("--muted"),"left");
      var tb=rows.map(function(r){return ['2<sup>'+r.i+'</sup>G = '+E17.ps(r.B),r.bit?'<b style="color:var(--signal)">1</b>':'0',
        r.added?'<b style="color:var(--signal)">'+E17.ps(r.acc)+'</b>':'<span style="color:var(--faint)">（足さない）</span>'];});
      out.innerHTML='<div style="color:var(--muted);margin-bottom:.2rem">k = '+k+' = '+k.toString(2)+'₂（下の表は 2⁰ の桁から）</div>'+tbl(["2 倍を繰り返した点","k の桁","足した結果"],tb,["left","center","left"]);
      ro.innerHTML='2 倍 <b>'+dbl+'</b> 回 + 足し算 <b>'+adds+'</b> 回 = '+(dbl+adds)+' 回（G を 1 つずつ足すと '+Math.max(0,k-1)+' 回） ／ <b class="ok">'+k+'G = '+E17.ps(acc)+'</b>'+
        (k===n?'（k = n なので無限遠点 O に戻る）':'')+' ／ G の位数 n = '+n;
    }
    sp.addEventListener("change",draw);[sa,sb,sg,sk].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ============ 17. ecdh — 楕円曲線ディフィー・ヘルマン ============ */
  REG.ecdh=function(el){
    head(el,"ECDH","楕円曲線の点で鍵を共有する");
    var cv=screen(el,280),cc=cctx(cv);
    var CUR=[{p:17,a:2,b:2,G:[5,1]},{p:97,a:1,b:4,G:[0,2]},{p:1009,a:5,b:1,G:[0,1]},{p:10007,a:7,b:4,G:[0,2]}];
    var row=ctrls(el);
    var sc=select(row,"曲線（法 p）",CUR.map(function(c){return 'p = '+c.p+': y² = x³ + '+c.a+'x + '+c.b+'、G = ('+c.G[0]+', '+c.G[1]+')';}));
    var row2=ctrls(el);
    var ia=textin(row2,"<span>Alice の秘密 d<sub>A</sub></span>","3"),ib=textin(row2,"<span>Bob の秘密 d<sub>B</sub></span>","7");
    var out=panel(el),ro=readout(el),cache={};
    function info(c){var key=c.p;if(!cache[key])cache[key]={pts:E17.points(c.a,c.b,c.p),n:E17.ord(c.G,c.a,c.p)};return cache[key];}
    function draw(){
      var c=CUR[+sc.value],I=info(c),n=I.n,a=c.a,p=c.p,G=c.G;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var dA=parseInt(ia.value,10),dB=parseInt(ib.value,10);
      var pad=18,S=Math.min((w-2*pad-170)/p,(h-2*pad)/p),gx=pad,gy=h-pad;
      var X=function(x){return gx+x*S+S/2;},Y=function(y){return gy-y*S-S/2;};
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(gx,gy-p*S,p*S,p*S);
      ctx.fillStyle=C("--faint");var rr=Math.max(0.8,Math.min(2.6,S*0.2));
      I.pts.forEach(function(q){ctx.fillRect(X(q[0])-rr,Y(q[1])-rr,2*rr,2*rr);});
      if(!(dA>=1&&dA<n&&dB>=1&&dB<n)){out.innerHTML='<span style="color:var(--alias)">d_A と d_B は 1 以上 n − 1 = '+(n-1)+' 以下の整数にする</span>';ro.innerHTML="";return;}
      var QA=E17.mul(dA,G,a,p),QB=E17.mul(dB,G,a,p),SA=E17.mul(dA,QB,a,p),SB=E17.mul(dB,QA,a,p);
      function mark(q,col,lb,dy){if(!q)return;var x=X(q[0]),y=Y(q[1]);ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fillStyle=col;ctx.fill();
        lab(ctx,lb,x+9,y+(dy||-6),col,"left");}
      mark(G,C("--blue"),"G");mark(QA,C("--alias"),"Alice の Q");mark(QB,C("--alias"),"Bob の Q",14);mark(SA,C("--signal"),"共有した点",-8);
      var lx=gx+p*S+16;lab(ctx,"点の個数 "+I.pts.length+" + O",lx,gy-p*S+14,C("--muted"),"left");lab(ctx,"G の位数 n = "+n,lx,gy-p*S+32,C("--muted"),"left");
      /* Eve の総当たり: G, 2G, 3G, … と足して Q_A と比べる */
      var R=G,steps=1;while(!E17.eq(R,QA)&&steps<n){R=E17.add(R,G,a,p);steps++;}
      var h2='<table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:.2rem .5rem;color:var(--muted)">Alice</th><th style="text-align:center;color:var(--muted)">通信路（Eve に見える）</th><th style="text-align:right;padding:.2rem .5rem;color:var(--muted)">Bob</th></tr>';
      h2+='<tr><td style="padding:.2rem .5rem">秘密 d<sub>A</sub> = <b style="color:var(--alias)">'+dA+'</b></td><td></td><td style="padding:.2rem .5rem;text-align:right">秘密 d<sub>B</sub> = <b style="color:var(--alias)">'+dB+'</b></td></tr>';
      h2+='<tr><td style="padding:.2rem .5rem">Q<sub>A</sub> = d<sub>A</sub>G = '+E17.ps(QA)+'</td><td style="text-align:center;color:var(--blue)">Q<sub>A</sub> →　← Q<sub>B</sub></td><td style="padding:.2rem .5rem;text-align:right">Q<sub>B</sub> = d<sub>B</sub>G = '+E17.ps(QB)+'</td></tr>';
      h2+='<tr><td style="padding:.2rem .5rem">d<sub>A</sub>Q<sub>B</sub> = <b style="color:var(--signal)">'+E17.ps(SA)+'</b></td><td style="text-align:center;color:var(--faint)">共有した点は流れない</td><td style="padding:.2rem .5rem;text-align:right">d<sub>B</sub>Q<sub>A</sub> = <b style="color:var(--signal)">'+E17.ps(SB)+'</b></td></tr></table>';
      h2+='<div style="margin-top:.4rem;padding-top:.4rem;border-top:1px dashed var(--line)">Eve の総当たり: G、2G、3G、… と G を足していき、Q<sub>A</sub> と比べる → <b style="color:var(--alias)">'+steps+'</b> 個目で一致し、d<sub>A</sub> = '+steps+' が分かる</div>';
      out.innerHTML=h2;
      ro.innerHTML=(E17.eq(SA,SB)?'<span class="ok">両者の点が一致: '+E17.ps(SA)+'</span>':'<span class="warn">不一致</span>')+
        ' ／ n = '+n+' なら総当たりは最大 n − 1 回で終わるが、実際の曲線では n が約 2²⁵⁶ なので、ポラードの ρ 法でも約 2¹²⁸ 回かかる';
    }
    sc.addEventListener("change",draw);[ia,ib].forEach(function(x){x.addEventListener("input",draw);});reg(cv,draw);
  };
