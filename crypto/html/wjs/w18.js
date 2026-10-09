  /* ============ 18 章 ハッシュ・MAC・デジタル署名 ============ */

  /* ---- SHA-256（avalanche と rsasig で使う。数値は Python の hashlib と一致） ---- */
  function SHA18_bytes(str){
    try{return Array.from(new TextEncoder().encode(str));}
    catch(e){var u=unescape(encodeURIComponent(str)),a=[];for(var i=0;i<u.length;i++)a.push(u.charCodeAt(i));return a;}
  }
  function SHA18(bytes){
    function rotr(x,n){return (x>>>n)|(x<<(32-n));}
    var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l=bytes.length,bitLen=l*8,withOne=l+1,k=(56-withOne%64+64)%64,total=withOne+k+8;
    var msg=new Array(total);for(var i=0;i<l;i++)msg[i]=bytes[i];for(i=l;i<total;i++)msg[i]=0;
    msg[l]=0x80;for(i=0;i<4;i++)msg[total-1-i]=(bitLen>>>(8*i))&0xff;
    var w=new Array(64);
    for(var off=0;off<total;off+=64){
      for(var t=0;t<16;t++)w[t]=(msg[off+4*t]<<24|msg[off+4*t+1]<<16|msg[off+4*t+2]<<8|msg[off+4*t+3])>>>0;
      for(t=16;t<64;t++){var s0=rotr(w[t-15],7)^rotr(w[t-15],18)^(w[t-15]>>>3);
        var s1=rotr(w[t-2],17)^rotr(w[t-2],19)^(w[t-2]>>>10);w[t]=(w[t-16]+s0+w[t-7]+s1)>>>0;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(t=0;t<64;t++){var S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g);
        var t1=(h+S1+ch+K[t]+w[t])>>>0;var S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c);
        var t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
    }
    var hex="";for(i=0;i<8;i++)hex+=("00000000"+H[i].toString(16)).slice(-8);return hex;
  }
  function SHA18hex(str){return SHA18(SHA18_bytes(str));}

  /* ---- 18. avalanche — 1 文字変えると出力の約半分が変わる ---- */
  REG.avalanche=function(el){
    head(el,"Hash","SHA-256: 1 文字変えるとどれだけ変わるか");
    var row=ctrls(el);
    var i1=textin(row,"メッセージ 1","abc"), i2=textin(row,"メッセージ 2","abd");
    var out=panel(el); var cv=screen(el,150),cc=cctx(cv); var ro=readout(el);
    function bits(hex){var b="";for(var i=0;i<hex.length;i++)b+=("000"+parseInt(hex[i],16).toString(2)).slice(-4);return b;}
    function run(){
      var h1=SHA18hex(i1.value), h2=SHA18hex(i2.value);
      function colored(h,other){var s="";for(var i=0;i<64;i++){var diff=h[i]!==other[i];
        s+='<span style="color:'+(diff?"var(--alias)":"var(--ink)")+';font-weight:'+(diff?700:400)+'">'+h[i]+'</span>';}
        return s;}
      out.innerHTML='<div style="word-break:break-all;line-height:1.7">'+
        '<div style="color:var(--muted);font-size:.72rem">H(メッセージ 1)</div>'+colored(h1,h2)+
        '<div style="color:var(--muted);font-size:.72rem;margin-top:.4rem">H(メッセージ 2)</div>'+colored(h2,h1)+'</div>';
      var b1=bits(h1),b2=bits(h2),nd=0;for(var i=0;i<256;i++)if(b1[i]!==b2[i])nd++;
      var s=cc.fit(),w=s.w,hgt=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,hgt);
      var cols=32,rows=8,y0=24,cell=Math.min((w-16)/cols,(hgt-y0-8)/rows),x0=(w-cell*cols)/2;
      lab(ctx,"値が違うビット（赤）。1 行 32 ビット × 8 行 = 256 ビット",x0,16,C("--muted"),"left");
      for(i=0;i<256;i++){var r=Math.floor(i/cols),c2=i%cols,diff=b1[i]!==b2[i];
        ctx.fillStyle=diff?C("--alias"):C("--screen");ctx.strokeStyle=C("--line");ctx.lineWidth=.5;
        ctx.fillRect(x0+c2*cell,y0+r*cell,cell-1,cell-1);ctx.strokeRect(x0+c2*cell,y0+r*cell,cell-1,cell-1);}
      ro.innerHTML=(i1.value===i2.value?'<span class="warn">2 つのメッセージが同じ</span>':
        'ハミング距離 = <b>'+nd+'</b> / 256 ビット（<b>'+Math.round(nd*100/256)+'%</b>）が違う ／ '+
        (Math.abs(nd-128)<40?'<b class="ok">約半分。入力と無関係なでたらめに見える</b>':''));
    }
    i1.addEventListener("input",run);i2.addEventListener("input",run);reg(cv,run);run();
  };

  /* ---- 18. mdext — 素朴な MAC は長さ拡張で破れ、HMAC は破れない ---- */
  REG.mdext=function(el){
    head(el,"Length Extension","トイのハッシュ（状態 16 ビット・ブロック 8 バイト）で比べる");
    var row=ctrls(el);
    var iK=textin(row,"鍵 K","key!"), iM=textin(row,"メッセージ m","amount=100"), iX=textin(row,"付け足すデータ x","&to=bob");
    var out=panel(el); var ro=readout(el);
    var H0=0x6a09,B=8;
    function by(s){return SHA18_bytes(s);}
    function rotl(x,n){return ((x<<n)|(x>>>(16-n)))&0xffff;}
    function comp(h,blk){for(var i=0;i<8;i++){h=(rotl(h,5)+(blk[i]||0)+0x9e37)&0xffff;h^=rotl(h,7);h&=0xffff;}return h;}
    function pad(L){var bl=L*8,w=L+1,k=(6-w%8+8)%8,p=[0x80];for(var i=0;i<k;i++)p.push(0);p.push((bl>>>8)&0xff,bl&0xff);return p;}
    function hashSeq(bytes){var d=bytes.concat(pad(bytes.length)),h=H0,seq=[h];
      for(var i=0;i<d.length;i+=8){h=comp(h,d.slice(i,i+8));seq.push(h);}return {h:h,seq:seq,blocks:d.length/8};}
    function hashB(bytes){return hashSeq(bytes).h;}
    function cont(st,bytes){var h=st;for(var i=0;i<bytes.length;i+=8)h=comp(h,bytes.slice(i,i+8));return h;}
    function hx(h){return ("0000"+h.toString(16)).slice(-4);}
    function b2(h){return [(h>>>8)&0xff,h&0xff];}
    function k0(K){var kk=K.slice();if(kk.length>B)kk=b2(hashB(kk));while(kk.length<B)kk.push(0);return kk;}
    function xp(kk,p){return kk.map(function(b){return b^p;});}
    function hmac(K,m){var kk=k0(K);var inner=hashB(xp(kk,0x36).concat(m));return hashB(xp(kk,0x5c).concat(b2(inner)));}
    function run(){
      var K=by(iK.value),m=by(iM.value),x=by(iX.value);
      var r=hashSeq(K.concat(m)),t=r.h;
      var innerLen=K.length+m.length,pIn=pad(innerLen),Mlen=innerLen+pIn.length+x.length;
      var forged=cont(t,x.concat(pad(Mlen)));
      var real=hashB(K.concat(m).concat(pIn).concat(x));
      var hm=hmac(K,m),attempt=cont(hm,x.concat(pad(Mlen))),realH=hmac(K,m.concat(pIn).concat(x));
      var h='<div style="color:var(--muted);font-size:.72rem">① 素朴な MAC：t = H(K‖m)</div>';
      h+='<div>内部状態: '+r.seq.map(hx).join(' <span style="color:var(--faint)">→</span> ')+'　<span style="color:var(--faint)">('+r.blocks+' ブロック)</span></div>';
      h+='<div>攻撃者は K を知らずに t から計算: H(K‖m‖pad‖x) = <b style="color:var(--alias)">'+hx(forged)+'</b></div>';
      h+='<div>実際の H(K‖m‖pad‖x) = <b style="color:var(--alias)">'+hx(real)+'</b> '+(forged===real?'<span class="warn">← 一致（偽造成功）</span>':'')+'</div>';
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line);color:var(--muted);font-size:.72rem">② HMAC</div>';
      h+='<div>HMAC_K(m) = <b style="color:var(--signal)">'+hx(hm)+'</b></div>';
      h+='<div>同じやり方で延長を試みる = <b>'+hx(attempt)+'</b></div>';
      h+='<div>実際の HMAC_K(m‖pad‖x) = <b style="color:var(--signal)">'+hx(realH)+'</b> '+(attempt===realH?'':'<span class="ok">← 一致しない（偽造失敗）</span>')+'</div>';
      out.innerHTML=h;
      ro.innerHTML='素朴な MAC は '+(forged===real?'<span class="warn">破れる</span>':'—')+
        ' ／ HMAC は '+(attempt!==realH?'<span class="ok">破れない</span>':'—')+
        '　外に出るのが内部状態そのものか（素朴）、外側のハッシュで隠されているか（HMAC）の違い';
    }
    [iK,iM,iX].forEach(function(o){o.addEventListener("input",run);});reg(null,run);run();
  };

  /* ---- 18. rsasig — 署名して検証し、改ざんを検出する ---- */
  REG.rsasig=function(el){
    head(el,"RSA Signature","σ = H(m)^d mod n を作り、σ^e mod n = H(m) を確かめる");
    var row=ctrls(el);
    var iM=textin(row,"署名するメッセージ m","Alice は Bob に 100 円払う");
    var iR=textin(row,"検証者が受け取ったメッセージ","Alice は Bob に 100 円払う");
    var out=panel(el); var ro=readout(el);
    var n=3233,e=17,d=2753;
    function modexp(b,x,m){var r=1;b%=m;while(x>0){if(x&1)r=(r*b)%m;b=(b*b)%m;x=Math.floor(x/2);}return r;}
    function Hn(s){var hex=SHA18hex(s),v=0;for(var i=0;i<hex.length;i++)v=(v*16+parseInt(hex[i],16))%n;return v;}
    function run(){
      var hm=Hn(iM.value), sig=modexp(hm,d,n);
      var hr=Hn(iR.value), chk=modexp(sig,e,n);
      var h='<div style="color:var(--muted);font-size:.72rem">鍵（16 章の例）: n = '+n+'、e = '+e+'（公開）、d = '+d+'（秘密）</div>';
      h+='<div style="margin-top:.3rem">署名者: H(m) = SHA-256(m) mod '+n+' = <b>'+hm+'</b></div>';
      h+='<div>　　　　σ = H(m)^d mod n = '+hm+'^'+d+' mod '+n+' = <b style="color:var(--blue)">'+sig+'</b>　<span style="color:var(--faint)">← m と一緒に送る</span></div>';
      h+='<div style="margin-top:.4rem;padding-top:.35rem;border-top:1px dashed var(--line)">検証者: 受け取った m\' から H(m\') = <b>'+hr+'</b></div>';
      h+='<div>　　　　σ^e mod n = '+sig+'^'+e+' mod '+n+' = <b style="color:var(--signal)">'+chk+'</b></div>';
      out.innerHTML=h;
      var ok=chk===hr, same=iM.value===iR.value;
      ro.innerHTML=(ok?'<span class="ok">✓ σ^e mod n = H(m\') なので署名は有効</span>':
        '<span class="warn">✗ '+chk+' ≠ '+hr+' なので署名は無効</span>')+' ／ '+
        (same?'メッセージは書き換えられていない':'<span class="warn">メッセージが書き換えられている → ハッシュ値が変わり検出される</span>');
    }
    [iM,iR].forEach(function(o){o.addEventListener("input",run);});reg(null,run);run();
  };
