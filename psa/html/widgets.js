/* PSA API 編 — 章内インタラクティブ部品 */
(function(){
  "use strict";
  var root=document.documentElement, TAU=Math.PI*2;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var draws=[];
  function redrawAll(){draws.forEach(function(f){try{f();}catch(e){}});}
  window.addEventListener("themechange",function(){requestAnimationFrame(redrawAll);});
  window.addEventListener("resize",function(){requestAnimationFrame(redrawAll);});
  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+k+'</span><span class="t">'+t+'</span>'));}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function slider(row,label,min,max,val,step){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+' <b class="val"></b></label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+step+'">';
    row.appendChild(c);return {input:c.querySelector("input"),val:c.querySelector(".val")};}
  function textin(row,label,val,w){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><input type="text" value="'+val+'" style="font-family:var(--mono);font-size:.85rem;padding:.35rem .5rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:'+(w||"100%")+'">';
    row.appendChild(c);return c.querySelector("input");}
  function select(row,label,opts){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:100%">'+
      opts.map(function(o,i){return '<option value="'+i+'">'+o+'</option>';}).join("")+'</select>';
    row.appendChild(c);return c.querySelector("select");}
  function checkbox(row,label,on){var c=mk("div","ctrl");
    c.innerHTML='<label style="cursor:pointer;justify-content:flex-start;align-items:center;gap:.45rem;'+
      'line-height:1.4"><input type="checkbox"'+(on?" checked":"")+
      ' style="flex:none;margin:0;accent-color:var(--signal)"><span>'+label+'</span></label>';
    row.appendChild(c);return c.querySelector("input");}
  function button(row,t){var b=mk("button","btn",t);b.setAttribute("aria-pressed","false");row.appendChild(b);return b;}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function panel(el,h){var d=mk("div","wscreen");d.style.padding=".8rem";d.style.overflowX="auto";
    d.style.fontFamily="var(--mono)";d.style.fontSize=".8rem";d.style.lineHeight="1.6";
    if(h)d.style.minHeight=h+"px";el.appendChild(d);return d;}
  function screen(el,h){var s=mk("div","wscreen");s.style.height=h+"px";var c=mk("canvas");s.appendChild(c);el.appendChild(s);return c;}
  function cctx(cv){var ctx=cv.getContext("2d");function fit(){var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));
    cv.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height};}
    return {ctx:ctx,fit:fit};}
  function reg(cv,draw){draws.push(draw);if(cv)new ResizeObserver(draw).observe(cv);}
  function lab(ctx,t,x,y,c,a,sz){ctx.fillStyle=c;ctx.font=(sz||11)+"px "+C("--mono");ctx.textAlign=a||"left";
    ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function f(x,d){return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);}
  function hex(v,w){var s=(v>>>0).toString(16).toUpperCase();while(s.length<(w||0))s="0"+s;return "0x"+s;}
  function tbl(headers,rows,align){
    var h='<table style="border-collapse:collapse;width:100%"><tr>'+headers.map(function(t,i){
      return '<th style="padding:.25rem .7rem;text-align:'+((align&&align[i])||"left")+
        ';color:var(--muted);font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap">'+t+'</th>';}).join("")+'</tr>';
    rows.forEach(function(r){
      h+='<tr>'+r.map(function(v,i){return '<td style="padding:.22rem .7rem;text-align:'+
        ((align&&align[i])||"left")+';vertical-align:top">'+v+'</td>';}).join("")+'</tr>';});
    return h+'</table>';
  }
  function boxes(items){ // クリック可能なブロック列
    return '<div style="display:flex;flex-direction:column;gap:.25rem">'+items+'</div>';
  }
  function chart(cc,x0,x1,y0,y1,pad){
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
    var p={l:44,r:14,t:16,b:28};
    if(pad)for(var k in pad)p[k]=pad[k];
    ctx.clearRect(0,0,w,h);
    return {ctx:ctx,w:w,h:h,p:p,
      X:function(x){return p.l+(x-x0)/(x1-x0)*(w-p.l-p.r);},
      Y:function(y){return h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);},x0:x0,x1:x1,y0:y0,y1:y1};
  }
  function grid(c,ny){var ctx=c.ctx;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
    for(var i=0;i<=ny;i++){var yy=c.p.t+i/ny*(c.h-c.p.t-c.p.b);
      ctx.beginPath();ctx.moveTo(c.p.l,yy);ctx.lineTo(c.w-c.p.r,yy);ctx.stroke();}}
  function axis(c){var ctx=c.ctx;ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(c.p.l,c.h-c.p.b);ctx.lineTo(c.w-c.p.r,c.h-c.p.b);ctx.stroke();}
  function line(c,pts,col,lw,dash){var ctx=c.ctx;ctx.strokeStyle=col;ctx.lineWidth=lw||2.2;
    if(dash)ctx.setLineDash(dash);ctx.beginPath();
    pts.forEach(function(q,i){i?ctx.lineTo(c.X(q[0]),c.Y(q[1])):ctx.moveTo(c.X(q[0]),c.Y(q[1]));});
    ctx.stroke();ctx.setLineDash([]);}
  function dot(c,x,y,r,col,st){var ctx=c.ctx;ctx.beginPath();ctx.arc(c.X(x),c.Y(y),r,0,TAU);
    if(st){ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}
  function rrect(ctx,x,y,w,h,r){ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  var REG={};
  function anim(el,fn){
    var run=true,t0=performance.now();
    function step(now){
      if(!run)return;
      if(!document.hidden&&el.getBoundingClientRect().bottom>0&&
         el.getBoundingClientRect().top<innerHeight){
        try{fn((now-t0)/1000);}catch(e){run=false;}
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return {stop:function(){run=false;}};
  }
  var C0=3e8, MU0=4*Math.PI*1e-7, EPS0=8.854e-12, ETA0=376.73;
  function db20(x){return 20*Math.log10(Math.max(x,1e-12));}
  function db10(x){return 10*Math.log10(Math.max(x,1e-30));}
  function eng(v,u,d){ // 工学表記
    var a=Math.abs(v);
    if(a>=1e9)return f(v/1e9,d==null?2:d)+" G"+u;
    if(a>=1e6)return f(v/1e6,d==null?2:d)+" M"+u;
    if(a>=1e3)return f(v/1e3,d==null?2:d)+" k"+u;
    if(a>=1)return f(v,d==null?2:d)+" "+u;
    if(a>=1e-3)return f(v*1e3,d==null?2:d)+" m"+u;
    if(a>=1e-6)return f(v*1e6,d==null?2:d)+" µ"+u;
    if(a>=1e-9)return f(v*1e9,d==null?2:d)+" n"+u;
    return f(v*1e12,d==null?2:d)+" p"+u;
  }


  /* ---- 基板向けの共通定数 ---- */
  /* ---- PSA 向け共通部品 ---- */
  function u8(s){return new TextEncoder().encode(s);}
  function hex(b,sep){var o=[];for(var i=0;i<b.length;i++)o.push(("0"+b[i].toString(16)).slice(-2));return o.join(sep||"");}
  function cat(){var n=0,i;for(i=0;i<arguments.length;i++)n+=arguments[i].length;var r=new Uint8Array(n),p=0;
    for(i=0;i<arguments.length;i++){r.set(arguments[i],p);p+=arguments[i].length;}return r;}
  /* SHA-256（FIPS 180-4）— デモ用の純 JS 実装 */
  var K256=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function sha256(msg){
    var h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l=msg.length, bl=l*8, pad=((l+9+63)>>6)<<6, m=new Uint8Array(pad); m.set(msg); m[l]=0x80;
    m[pad-4]=(bl>>>24)&255;m[pad-3]=(bl>>>16)&255;m[pad-2]=(bl>>>8)&255;m[pad-1]=bl&255;
    var w=new Uint32Array(64);
    for(var off=0;off<pad;off+=64){
      for(var i=0;i<16;i++)w[i]=(m[off+4*i]<<24)|(m[off+4*i+1]<<16)|(m[off+4*i+2]<<8)|m[off+4*i+3];
      for(i=16;i<64;i++){var s0=((w[i-15]>>>7)|(w[i-15]<<25))^((w[i-15]>>>18)|(w[i-15]<<14))^(w[i-15]>>>3);
        var s1=((w[i-2]>>>17)|(w[i-2]<<15))^((w[i-2]>>>19)|(w[i-2]<<13))^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
      var a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
      for(i=0;i<64;i++){var S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));var ch=(e&f)^(~e&g);
        var t1=(hh+S1+ch+K256[i]+w[i])|0;var S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));
        var mj=(a&b)^(a&c)^(b&c);var t2=(S0+mj)|0;hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
      h[0]=(h[0]+a)|0;h[1]=(h[1]+b)|0;h[2]=(h[2]+c)|0;h[3]=(h[3]+d)|0;h[4]=(h[4]+e)|0;h[5]=(h[5]+f)|0;h[6]=(h[6]+g)|0;h[7]=(h[7]+hh)|0;
    }
    var out=new Uint8Array(32);for(i=0;i<8;i++){out[4*i]=(h[i]>>>24)&255;out[4*i+1]=(h[i]>>>16)&255;out[4*i+2]=(h[i]>>>8)&255;out[4*i+3]=h[i]&255;}
    return out;
  }
  function hmac(key,msg){
    if(key.length>64)key=sha256(key);
    var k=new Uint8Array(64);k.set(key);var ip=new Uint8Array(64),op=new Uint8Array(64);
    for(var i=0;i<64;i++){ip[i]=k[i]^0x36;op[i]=k[i]^0x5c;}
    return sha256(cat(op,sha256(cat(ip,msg))));
  }
  function hkdf(ikm,salt,info,len){
    var prk=hmac(salt.length?salt:new Uint8Array(32),ikm), out=new Uint8Array(len), t=new Uint8Array(0), p=0, i=1;
    while(p<len){t=hmac(prk,cat(t,info,new Uint8Array([i])));out.set(t.subarray(0,Math.min(32,len-p)),p);p+=32;i++;}
    return {prk:prk,okm:out};
  }
  function rnd(n){var b=new Uint8Array(n);crypto.getRandomValues(b);return b;}
  /* 模擬 CTR: keystream = SHA256(key ∥ iv ∥ counter)。AES ではない（デモの構造説明用） */
  function ctr(key,iv,data){var out=new Uint8Array(data.length);
    for(var i=0;i<data.length;i+=32){var ks=sha256(cat(key,iv,new Uint8Array([i>>5])));
      for(var j=0;j<32&&i+j<data.length;j++)out[i+j]=data[i+j]^ks[j];}return out;}
  function pill(t,c){return '<span style="display:inline-block;padding:.05rem .45rem;border-radius:9px;border:1px solid '+c+';color:'+c+';font-size:.72rem;margin-right:.3rem">'+t+'</span>';}
  var OK='<b class="ok">PSA_SUCCESS</b>';
  function ERR(n){return '<b style="color:var(--alias)">'+n+'</b>';}
  function hexblock(b,groups){ // 色分けした 16 進表示。groups=[{n,c,label}]
    var h='',p=0;(groups||[{n:b.length,c:"var(--ink)"}]).forEach(function(g){
      h+='<span style="color:'+g.c+'" title="'+(g.label||"")+'">'+hex(b.subarray(p,p+g.n)," ")+'</span> ';p+=g.n;});return h;}

  /* ============ 01. map — 仕様と実装の地図 ============ */
  REG.map=function(el){
    head(el,"DEMO","同じ関数が、どこで実行されるか");
    var row=ctrls(el);
    var fn=select(row,"呼ぶ関数",["psa_import_key（鍵を預ける）","psa_sign_hash（署名）","psa_its_set（ストレージ）","psa_initial_attest_get_token（証明）"]);
    var dep=select(row,"配置",["A. Mbed TLS 単体（同じ場所）","B. TF-M（壁越し）"]);
    var cv=screen(el,250), cc=cctx(cv), out=readout(el);
    var STEPS=[
      [["アプリ","psa_import_key()"],["Mbed TLS","鍵ストア（配列）に置く"]],
      [["アプリ","psa_import_key()"],["NS ライブラリ","invec に詰める"],["ベニア","SG で切替"],["Crypto パーティション","鍵ストアに置く"]]
    ];
    var t0=performance.now();
    function draw(){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var b=+dep.value, st=STEPS[b].slice(), f=+fn.value;
      if(f===3&&b===0){ st=[["アプリ","psa_initial_attest_get_token()"],["（存在しない）","Mbed TLS 単体にこの API はない"]]; }
      if(f===2&&b===0){ st=[["アプリ","psa_its_set()"],["ITS 実装","ファイル/フラッシュに平文で書く"]]; }
      if(f===1){ st=st.map(function(s){return s[1]==="psa_import_key()"?[s[0],"psa_sign_hash()"]:(s[1].indexOf("鍵ストア")>=0?[s[0],"鍵で署名を計算"]:s);}); }
      if(f===2&&b===1){ st=[["アプリ","psa_its_set()"],["NS ライブラリ","invec に詰める"],["ベニア","SG で切替"],["ITS パーティション","セキュア側フラッシュへ"]]; }
      if(f===3&&b===1){ st=[["アプリ","get_token()"],["NS ライブラリ","invec に詰める"],["ベニア","SG で切替"],["Attestation パーティション","測定値に IAK で署名"]]; }
      var n=st.length, bw=Math.min(170,(w-40)/n-16), gap=(w-40-bw*n)/(n-1||1), y=h/2-30;
      var xs=[];
      for(var i=0;i<n;i++){var x=20+i*(bw+gap);xs.push(x+bw/2);
        var sec=b===1&&i>=2, bad=st[i][0].indexOf("存在しない")>=0;
        ctx.fillStyle=bad?C("--alias-soft"):(sec?C("--signal-soft"):C("--panel"));ctx.strokeStyle=bad?C("--alias"):(sec?C("--signal"):C("--line"));ctx.lineWidth=1.4;
        rrect(ctx,x,y,bw,60,8);ctx.fill();ctx.stroke();
        lab(ctx,st[i][0],x+bw/2,y+24,C("--ink"),"center",11.5);
        lab(ctx,st[i][1],x+bw/2,y+44,C("--muted"),"center",9.5);
        if(i<n-1){ctx.strokeStyle=C("--muted");ctx.beginPath();ctx.moveTo(x+bw,y+30);ctx.lineTo(x+bw+gap-4,y+30);ctx.stroke();}
      }
      if(b===1&&n>2){var xb=(xs[1]+xs[2])/2;ctx.strokeStyle=C("--signal");ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xb,y-30);ctx.lineTo(xb,y+95);ctx.stroke();
        lab(ctx,"TrustZone の壁",xb,y+112,C("--signal"),"center",10);}
      var tt=((performance.now()-t0)/1000)%3, u=Math.min(1,tt/2), seg=u*(n-1), i0=Math.floor(seg), fr=seg-i0;
      var px=i0>=n-1?xs[n-1]:xs[i0]+(xs[i0+1]-xs[i0])*fr;
      ctx.fillStyle=tt<2?C("--signal"):C("--blue");ctx.beginPath();ctx.arc(px,y-14,5,0,TAU);ctx.fill();
      lab(ctx,tt<2?"要求":"結果（戻り値）",px,y-24,C("--muted"),"center",9.5);
    }
    anim(el,draw); reg(cv,draw);
    function upd(){
      var b=+dep.value;
      out.innerHTML=(b===0?'<b>A.</b> 関数は普通の C 関数。鍵はライブラリ内の配列にあり、アプリのバグで読まれ得る。API を覚えるにはここで十分。'
        :'<b>B.</b> 非セキュア側の関数はスタブ。引数を包んでベニアから SPM に渡し、パーティションの本物が実行する。鍵は壁の向こう。')+
        '<br><b>アプリのソースコードはどちらでも同じ</b>: '+["psa_import_key(&attr, data, len, &key)","psa_sign_hash(key, alg, hash, 32, sig, 64, &len)","psa_its_set(uid, len, data, flags)","psa_initial_attest_get_token(ch, 32, tok, size, &len)"][+fn.value];
    }
    fn.addEventListener("change",upd);dep.addEventListener("change",upd);upd();
  };

  /* ============ 02. status — エラーコードデコーダ ============ */
  var STATUS=[
    [0,"PSA_SUCCESS","成功","—","ok"],
    [-129,"PSA_ERROR_PROGRAMMER_ERROR","呼び出し側の明らかな誤用（TF-M）","セキュア側のメモリやフラッシュ定数を指すポインタを渡した","code"],
    [-130,"PSA_ERROR_CONNECTION_REFUSED","サービスへの接続拒否","パーティションが無効でビルドされた。SID 違い","env"],
    [-131,"PSA_ERROR_CONNECTION_BUSY","サービスが混雑","IPC モデルで同時接続数を超えた","env"],
    [-132,"PSA_ERROR_GENERIC_ERROR","分類できない失敗","実装の内部エラー","env"],
    [-133,"PSA_ERROR_NOT_PERMITTED","鍵の用途・方針が許していない","usage フラグ漏れ、algorithm 不一致、WRITE_ONCE への再書き込み、read-only 鍵の破棄","code"],
    [-134,"PSA_ERROR_NOT_SUPPORTED","実装が対応していない","PSA_WANT_* の宣言漏れ（特に _GENERATE / _EXPORT）、曲線の宣言漏れ、プロファイルの制限","env"],
    [-135,"PSA_ERROR_INVALID_ARGUMENT","引数の組み合わせ・形式が不正","バイト列の形式（PEM、DER 包装）、ハッシュ長不一致、鍵長（255 vs 256）、揮発鍵に ID","code"],
    [-136,"PSA_ERROR_INVALID_HANDLE","鍵 ID が無効","未初期化（0）、破棄済み、他クライアントの鍵、存在しない永続鍵","code"],
    [-137,"PSA_ERROR_BAD_STATE","呼ぶ順番が違う","psa_crypto_init 忘れ、setup 前の update、abort せず再利用","code"],
    [-138,"PSA_ERROR_BUFFER_TOO_SMALL","出力バッファ不足","サイズマクロ未使用。IV（16）やタグ（16）の分を忘れた","code"],
    [-139,"PSA_ERROR_ALREADY_EXISTS","同じ ID の永続鍵がある","毎回 generate している。「あれば使う」に直す","data"],
    [-140,"PSA_ERROR_DOES_NOT_EXIST","指定 ID のデータがない","UID 違い、鍵が未作成","data"],
    [-141,"PSA_ERROR_INSUFFICIENT_MEMORY","メモリ不足","鍵スロット上限、CRYPTO_ENGINE_BUF_SIZE、揮発鍵の破棄漏れ","env"],
    [-142,"PSA_ERROR_INSUFFICIENT_STORAGE","不揮発ストレージ不足","ITS/PS 満杯、ITS_MAX_ASSET_SIZE 超え","env"],
    [-143,"PSA_ERROR_INSUFFICIENT_DATA","データ不足","鍵導出の容量超え、分割操作の入力不足","code"],
    [-144,"PSA_ERROR_SERVICE_FAILURE","サービス内部の失敗","パーティション側の異常","env"],
    [-145,"PSA_ERROR_COMMUNICATION_FAILURE","セキュア側・SE との通信失敗","I²C/SPI 応答なし、割り込み中の呼び出し","env"],
    [-146,"PSA_ERROR_STORAGE_FAILURE","ストレージの読み書き失敗","フラッシュドライバの不具合","env"],
    [-147,"PSA_ERROR_HARDWARE_FAILURE","ハードウェア異常","暗号エンジンのクロック未供給、ドライバのバグ","env"],
    [-148,"PSA_ERROR_INSUFFICIENT_ENTROPY","乱数の種が足りない","エントロピー源が未接続（mbedtls_hardware_poll）","env"],
    [-149,"PSA_ERROR_INVALID_SIGNATURE","署名・MAC・タグの検証失敗","改ざん、または鍵・データ・AD・ノンス・形式の不一致","data"],
    [-150,"PSA_ERROR_INVALID_PADDING","詰め物が不正","CBC_PKCS7 / PKCS1v15 の復号。パディングオラクルに注意","data"],
    [-151,"PSA_ERROR_CORRUPTION_DETECTED","内部データの整合性が壊れた","メモリ破壊。攻撃の可能性","env"],
    [-152,"PSA_ERROR_DATA_CORRUPT","保存データの破損","ストレージの物理的破損、電源断中の書き込み","data"],
    [-153,"PSA_ERROR_DATA_INVALID","保存データの形式不正","別バージョンのファームウェアが書いたデータ","data"],
    [-248,"PSA_OPERATION_INCOMPLETE","中断可能操作が未完了","psa_sign_hash_complete をもう一度呼ぶ（エラーではない）","ok"]
  ];
  REG.status=function(el){
    head(el,"DEMO","数値や定数名から、原因の当たりをつける");
    var row=ctrls(el);
    var inp=textin(row,"数値（10 進 / 16 進）または定数名の一部","-133","100%");
    var pn=panel(el), out=readout(el);
    var CAT={ok:["var(--signal)","成功・継続"],code:["var(--alias)","コードを直す"],env:["var(--blue)","設定・環境を直す"],data:["var(--muted)","データ・設計で対処"]};
    function find(q){q=q.trim();if(!q)return null;var n=q.indexOf("0x")===0?(parseInt(q,16)|0):parseInt(q,10);
      if(!isNaN(n)&&/^-?(0x)?[0-9a-f]+$/i.test(q)){if(n>0x7fffffff)n=n-0x100000000;for(var i=0;i<STATUS.length;i++)if(STATUS[i][0]===n)return STATUS[i];return {none:n};}
      q=q.toUpperCase();for(i=0;i<STATUS.length;i++)if(STATUS[i][1].indexOf(q)>=0)return STATUS[i];return null;}
    function upd(){
      var s=find(inp.value);
      if(!s)out.innerHTML='見つからない。数値（例: -133、0xFFFFFF7B）か、定数名の一部（例: PERMITTED）を入れる';
      else if(s.none!==undefined)out.innerHTML='<b>'+s.none+'</b> は psa/error.h に定義がない。実装固有の値か、psa_status_t 以外の戻り値（Mbed TLS の旧 API は別の負の値を使う）';
      else{var c=CAT[s[4]];out.innerHTML='<b style="font-size:1rem">'+s[1]+'</b> = '+s[0]+'（0x'+(s[0]>>>0).toString(16).toUpperCase()+'）'+pill(c[1],c[0])+
        '<br>'+s[2]+'<br><b>よくある原因:</b> '+s[3];}
      pn.innerHTML=tbl(["値","定数","意味","分類"],STATUS.map(function(r){var c=CAT[r[4]];
        return [r[0],'<span style="cursor:pointer;color:'+(s&&s[1]===r[1]?"var(--signal)":"var(--ink)")+'" data-n="'+r[1]+'">'+r[1]+'</span>',r[2],'<span style="color:'+c[0]+'">'+c[1]+'</span>'];}),["right","left","left","left"]);
      pn.querySelectorAll("[data-n]").forEach(function(e){e.addEventListener("click",function(){inp.value=e.getAttribute("data-n");upd();});});
    }
    inp.addEventListener("input",upd);upd();
  };

  /* ============ 03. attr — 鍵属性ビルダー ============ */
  var KT=[["PSA_KEY_TYPE_AES",0x2400,[128,192,256],"sym"],["PSA_KEY_TYPE_CHACHA20",0x2004,[256],"sym"],["PSA_KEY_TYPE_HMAC",0x1100,[128,256,512],"mac"],
          ["PSA_KEY_TYPE_DERIVE",0x1200,[128,256],"der"],["PSA_KEY_TYPE_RAW_DATA",0x1001,[64,256],"raw"],
          ["PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1)",0x7112,[256,384,521],"ecpair"],["PSA_KEY_TYPE_ECC_PUBLIC_KEY(PSA_ECC_FAMILY_SECP_R1)",0x4112,[256,384,521],"ecpub"],
          ["PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_MONTGOMERY)",0x7141,[255,448],"xpair"],["PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_TWISTED_EDWARDS)",0x7142,[255],"edpair"],
          ["PSA_KEY_TYPE_RSA_KEY_PAIR",0x7001,[2048,3072,4096],"rsapair"],["PSA_KEY_TYPE_RSA_PUBLIC_KEY",0x4001,[2048,3072,4096],"rsapub"]];
  var ALGS=[["PSA_ALG_GCM",0x05500200,["sym"],"aead"],["PSA_ALG_CCM",0x05500100,["sym"],"aead"],["PSA_ALG_CHACHA20_POLY1305",0x05100500,["sym"],"aead"],
            ["PSA_ALG_CTR",0x04c01000,["sym"],"cipher"],["PSA_ALG_CBC_PKCS7",0x04404100,["sym"],"cipher"],
            ["PSA_ALG_HMAC(PSA_ALG_SHA_256)",0x03800009,["mac"],"mac"],["PSA_ALG_CMAC",0x03c00200,["sym"],"mac"],
            ["PSA_ALG_ECDSA(PSA_ALG_SHA_256)",0x06000609,["ecpair","ecpub"],"sign"],["PSA_ALG_DETERMINISTIC_ECDSA(PSA_ALG_SHA_256)",0x06000709,["ecpair","ecpub"],"sign"],
            ["PSA_ALG_PURE_EDDSA",0x06000800,["edpair"],"signmsg"],["PSA_ALG_RSA_PSS(PSA_ALG_SHA_256)",0x06000309,["rsapair","rsapub"],"sign"],
            ["PSA_ALG_RSA_OAEP(PSA_ALG_SHA_256)",0x07000309,["rsapair","rsapub"],"asym"],
            ["PSA_ALG_ECDH",0x09020000,["ecpair","xpair"],"ka"],["PSA_ALG_KEY_AGREEMENT(PSA_ALG_ECDH, PSA_ALG_HKDF(PSA_ALG_SHA_256))",0x09020109,["ecpair","xpair"],"ka"],
            ["PSA_ALG_HKDF(PSA_ALG_SHA_256)",0x08000109,["der","mac"],"kdf"],["PSA_ALG_PBKDF2_HMAC(PSA_ALG_SHA_256)",0x08800109,["pw"],"kdf"],["PSA_ALG_NONE",0,["raw"],"none"]];
  var USG=[["EXPORT",0x0001],["COPY",0x0002],["CACHE",0x0004],["ENCRYPT",0x0100],["DECRYPT",0x0200],["SIGN_MESSAGE",0x0400],["VERIFY_MESSAGE",0x0800],["SIGN_HASH",0x1000],["VERIFY_HASH",0x2000],["DERIVE",0x4000],["VERIFY_DERIVATION",0x8000]];
  REG.attr=function(el){
    head(el,"DEMO","type・bits・usage・algorithm・lifetime の組み合わせを検査し、C コードにする");
    var row=ctrls(el);
    var st=select(row,"type",KT.map(function(k){return k[0];}));
    var sb=select(row,"bits",["256"]);
    var sa=select(row,"algorithm",ALGS.map(function(a){return a[0];}));
    var sl=select(row,"lifetime",["PSA_KEY_LIFETIME_VOLATILE","PSA_KEY_LIFETIME_PERSISTENT","永続 + セキュアエレメント"]);
    var row2=ctrls(el); var cbs=USG.map(function(u){return checkbox(row2,"PSA_KEY_USAGE_"+u[0],u[0]==="ENCRYPT"||u[0]==="DECRYPT");});
    var pn=panel(el), out=readout(el);
    function fillBits(){var k=KT[+st.value];sb.innerHTML=k[2].map(function(b,i){return '<option value="'+i+'">'+b+'</option>';}).join("");}
    fillBits();
    function upd(){
      var k=KT[+st.value], bits=k[2][+sb.value], a=ALGS[+sa.value], lt=+sl.value, u=0, names=[];
      cbs.forEach(function(c,i){if(c.checked){u|=USG[i][1];names.push("PSA_KEY_USAGE_"+USG[i][0]);}});
      var probs=[], warns=[];
      if(a[2].indexOf(k[3])<0&&a[3]!=="none")probs.push("type と algorithm が合わない → INVALID_ARGUMENT（"+a[0]+" は "+a[2].join(" / ")+" 向け）");
      var need={aead:["ENCRYPT","DECRYPT"],cipher:["ENCRYPT","DECRYPT"],mac:["SIGN_MESSAGE","VERIFY_MESSAGE"],sign:["SIGN_HASH","VERIFY_HASH","SIGN_MESSAGE","VERIFY_MESSAGE"],signmsg:["SIGN_MESSAGE","VERIFY_MESSAGE"],asym:["ENCRYPT","DECRYPT"],ka:["DERIVE"],kdf:["DERIVE"],none:[]}[a[3]];
      var has=need.filter(function(n){return names.indexOf("PSA_KEY_USAGE_"+n)>=0;});
      if(need.length&&!has.length)probs.push("この algorithm で使う用途がない → 操作時に NOT_PERMITTED（"+need.join(" / ")+" のどれか）");
      if(a[3]==="sign"&&names.indexOf("PSA_KEY_USAGE_SIGN_HASH")<0&&names.indexOf("PSA_KEY_USAGE_SIGN_MESSAGE")>=0)warns.push("SIGN_MESSAGE だけでは psa_sign_hash は NOT_PERMITTED（SIGN_HASH が SIGN_MESSAGE を含む。逆は含まない）");
      if(k[3]==="ecpub"||k[3]==="rsapub"){if(u&0x1400)probs.push("公開鍵で署名はできない → SIGN_* は無意味（NOT_PERMITTED）");}
      if(k[3]==="mac"&&(u&0x300))warns.push("MAC の用途は SIGN_MESSAGE / VERIFY_MESSAGE。ENCRYPT / DECRYPT は効かない");
      if(u&1)warns.push("EXPORT が付いている。psa_export_key で値が取り出せる。理由を説明できる鍵だけに");
      if(k[3]==="raw"&&a[3]!=="none")probs.push("RAW_DATA は暗号操作に使えない");
      if(a[3]==="kdf"&&a[2].indexOf("pw")>=0&&k[3]!=="pw")probs.push("PBKDF2 の入力は PSA_KEY_TYPE_PASSWORD");
      var ltv=[0,1,0x101][lt];
      var code=['psa_key_attributes_t attr = PSA_KEY_ATTRIBUTES_INIT;',
        'psa_set_key_type(&attr, '+k[0]+');           /* 0x'+k[1].toString(16)+' */',
        'psa_set_key_bits(&attr, '+bits+');',
        'psa_set_key_usage_flags(&attr, '+(names.length?names.join(' | '):'0')+');   /* 0x'+u.toString(16)+' */',
        'psa_set_key_algorithm(&attr, '+a[0]+');   /* 0x'+("0000000"+a[1].toString(16)).slice(-8)+' */'];
      if(lt===1)code.push('psa_set_key_lifetime(&attr, PSA_KEY_LIFETIME_PERSISTENT);','psa_set_key_id(&attr, KEY_ID_xxx);          /* 1 〜 0x3FFFFFFF */');
      if(lt===2)code.push('psa_set_key_lifetime(&attr, PSA_KEY_LIFETIME_FROM_PERSISTENCE_AND_LOCATION(','    PSA_KEY_PERSISTENCE_DEFAULT, PSA_KEY_LOCATION_PRIMARY_SECURE_ELEMENT));  /* 0x101 */','psa_set_key_id(&attr, KEY_ID_xxx);');
      code.push((k[3].indexOf("pub")>=0?'psa_import_key(&attr, pub_bytes, len, &key);   /* 公開鍵は import */':'psa_generate_key(&attr, &key);   /* または psa_import_key */'),'psa_reset_key_attributes(&attr);');
      pn.innerHTML='<pre style="margin:0;white-space:pre-wrap">'+esc(code.join("\n"))+'</pre>';
      out.innerHTML=(probs.length?probs.map(function(p){return '<div>'+ERR("✗")+' '+p+'</div>';}).join(""):'<div><b class="ok">✓ 整合している</b>。lifetime = 0x'+ltv.toString(16)+'</div>')+
        warns.map(function(p){return '<div style="color:var(--muted)">⚠ '+p+'</div>';}).join("");
    }
    st.addEventListener("change",function(){fillBits();upd();});[sb,sa,sl].forEach(function(s){s.addEventListener("change",upd);});cbs.forEach(function(c){c.addEventListener("change",upd);});upd();
  };

  /* ============ 04. lifecycle — 鍵の一生 ============ */
  REG.lifecycle=function(el){
    head(el,"DEMO","関数を順に呼んで、状態と戻り値を見る（模擬）");
    var row=ctrls(el);
    var per=checkbox(row,"永続鍵（PERSISTENT、ID = 0x10001）",false);
    var exp=checkbox(row,"属性に PSA_KEY_USAGE_EXPORT を付ける",false);
    var bar=mk("div","btns");el.appendChild(bar);
    var B={};["psa_generate_key","psa_import_key","psa_export_public_key","psa_export_key","psa_sign_hash","psa_destroy_key","再起動（電源断）","psa_get_key_attributes"].forEach(function(n){B[n]=button(bar,n);});
    var pn=panel(el,120), out=readout(el);
    var state="none", store=false, log=[], id=0;
    function show(){
      var col={none:"var(--muted)",exists:"var(--signal)",destroyed:"var(--alias)"}[state];
      out.innerHTML='鍵の状態: <b style="color:'+col+'">'+{none:"存在しない",exists:"存在する（ID = 0x"+id.toString(16)+"）",destroyed:"破棄済み（ID は無効）"}[state]+'</b>'+(store?' ・ ITS に保存あり':'');
      pn.innerHTML=log.slice(-8).map(function(l){return '<div>'+l+'</div>';}).join("")||'<span style="color:var(--faint)">ボタンを押して関数を呼ぶ</span>';
    }
    function call(n){
      var r;
      if(n==="psa_generate_key"||n==="psa_import_key"){
        if(per.checked&&store)r=ERR("PSA_ERROR_ALREADY_EXISTS")+' — 同じ ID の永続鍵が残っている。「あれば使う」に';
        else{state="exists";id=per.checked?0x10001:0x7fff0000+Math.floor(Math.random()*4096);if(per.checked)store=true;r=OK+' → key = 0x'+id.toString(16)+(per.checked?"（自分で決めた ID。ITS に書かれた）":"（実装が振った揮発鍵の ID）");}
      }else if(n==="psa_export_public_key"){r=state==="exists"?OK+' → 65 バイト（04 ∥ X ∥ Y）。用途に関係なく可':ERR("PSA_ERROR_INVALID_HANDLE");}
      else if(n==="psa_export_key"){r=state!=="exists"?ERR("PSA_ERROR_INVALID_HANDLE"):(exp.checked?OK+' → 秘密鍵 32 バイトが出た（EXPORT が付いている）':ERR("PSA_ERROR_NOT_PERMITTED")+' — EXPORT 用途がない。これが「鍵が外に出ない」保証');}
      else if(n==="psa_sign_hash"){r=state==="exists"?OK+' → 署名 64 バイト':ERR("PSA_ERROR_INVALID_HANDLE")+' — '+(state==="none"?"未作成（ID = 0）":"破棄済み");}
      else if(n==="psa_destroy_key"){if(state==="exists"){state="destroyed";store=false;r=OK+(per.checked?' → ITS からも消えた':' → メモリから消えた');}else r=(state==="none"?OK+'（PSA_KEY_ID_NULL は何もしない）':ERR("PSA_ERROR_INVALID_HANDLE"));}
      else if(n==="再起動（電源断）"){if(per.checked&&store){state="exists";r='<b>再起動</b> → 永続鍵は残っている。ID 0x10001 をそのまま使える';}else{state="none";r='<b>再起動</b> → 揮発鍵は消えた。ID は無効';}}
      else if(n==="psa_get_key_attributes"){r=state==="exists"?OK+' → type/bits/usage/algorithm が読める（存在確認にも使う）':ERR("PSA_ERROR_INVALID_HANDLE")+' / '+ERR("DOES_NOT_EXIST")+'（実装差あり）';}
      log.push('<span style="color:var(--muted)">'+n+'</span>: '+r);show();
    }
    Object.keys(B).forEach(function(n){B[n].addEventListener("click",function(){call(n);});});
    per.addEventListener("change",function(){state="none";store=false;log=[];show();});show();
  };

  /* ============ 05. hash — ハッシュの性質 ============ */
  REG.hash=function(el){
    head(el,"DEMO","SHA-256 を実際に計算する（純 JS 実装）");
    var row=ctrls(el);
    var inp=textin(row,"入力（文字列）","hello","100%");
    var chunk=slider(row,"update の分割サイズ（バイト）",1,64,16,1);
    var flip=checkbox(row,"入力の最後の文字を 1 文字変える（1 ビット差の比較）",true);
    var cv=screen(el,150), cc=cctx(cv), pn=panel(el), out=readout(el);
    var h1,h2;
    function draw(){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);if(!h1)return;
      var cell=Math.min(12,(w-40)/64), x0=(w-cell*64)/2;
      lab(ctx,"256 ビットを 4 行 × 64 で表示。上: 元、下: 1 文字違い。赤 = 違うビット",w/2,14,C("--muted"),"center",9.5);
      for(var b=0;b<256;b++){var r=Math.floor(b/64),c=b%64;var v1=(h1[b>>3]>>(7-(b&7)))&1,v2=h2?(h2[b>>3]>>(7-(b&7)))&1:v1;
        ctx.fillStyle=v1?C("--signal"):C("--panel");ctx.fillRect(x0+c*cell,24+r*cell,cell-1,cell-1);
        if(h2){ctx.fillStyle=v1!==v2?C("--alias"):(v2?C("--signal"):C("--panel"));ctx.fillRect(x0+c*cell,24+4*cell+8+r*cell,cell-1,cell-1);}}
    }
    reg(cv,draw);
    function upd(){
      var s=inp.value, m=u8(s); h1=sha256(m);
      var s2=s.length?s.slice(0,-1)+String.fromCharCode(s.charCodeAt(s.length-1)^1):"\x01"; h2=flip.checked?sha256(u8(s2)):null;
      var n=Math.max(1,+chunk.input.value);chunk.val.textContent=n;
      // 分割計算: 単純化のため一括で計算し、分割数だけ示す（結果は同一）
      var diff=0;if(h2)for(var i=0;i<32;i++){var x=h1[i]^h2[i];while(x){diff+=x&1;x>>=1;}}
      pn.innerHTML='<div>psa_hash_compute(SHA_256, "'+esc(s)+'", '+m.length+') →</div><div style="color:var(--signal);word-break:break-all">'+hex(h1)+'</div>'+
        (h2?'<div style="margin-top:.4rem">"'+esc(s2)+'" →</div><div style="color:var(--alias);word-break:break-all">'+hex(h2)+'</div>':'');
      out.innerHTML='出力は常に <b>32 バイト</b>（PSA_HASH_LENGTH(PSA_ALG_SHA_256)）。'+m.length+' バイトを '+n+' バイトずつ '+Math.ceil(m.length/n)+' 回 update しても、一括でも、<b>同じ値</b>。'+
        (h2?'<br>1 ビット違いの入力で <b>'+diff+' / 256 ビット</b>が変わった（理想は約 128）。出力から入力は逆算できない。':'');
      draw();
    }
    inp.addEventListener("input",upd);chunk.input.addEventListener("input",upd);flip.addEventListener("change",upd);upd();
  };

  /* ============ 06. mac — HMAC ============ */
  REG.mac=function(el){
    head(el,"DEMO","HMAC-SHA256 を計算し、検証する");
    var row=ctrls(el);
    var key=textin(row,"鍵（文字列。本来は psa_generate_key で 32 バイト）","secret-key-32bytes","100%");
    var msg=textin(row,"メッセージ","counter=42;temp=21.5","100%");
    var tr=slider(row,"タグ長（PSA_ALG_TRUNCATED_MAC）",4,32,32,1);
    var bar=mk("div","btns");el.appendChild(bar);
    var bTamper=button(bar,"受信メッセージを 1 文字改ざん"), bKey=button(bar,"受信側の鍵を違うものに"), bReset=button(bar,"元に戻す");
    var pn=panel(el), out=readout(el);
    var tamper=false, wrongkey=false;
    function upd(){
      var n=+tr.input.value;tr.val.textContent=n+" バイト";
      var k=u8(key.value), m=u8(msg.value), tag=hmac(k,m).subarray(0,n);
      var rm=tamper?u8(msg.value.slice(0,-1)+String.fromCharCode((msg.value.charCodeAt(msg.value.length-1)||48)^1)):m;
      var rk=wrongkey?u8(key.value+"x"):k;
      var tag2=hmac(rk,rm).subarray(0,n), okv=hex(tag)===hex(tag2);
      var alg=n===32?"PSA_ALG_HMAC(PSA_ALG_SHA_256)":"PSA_ALG_TRUNCATED_MAC(PSA_ALG_HMAC(PSA_ALG_SHA_256), "+n+")";
      pn.innerHTML='<div>送信側: psa_mac_compute(key, '+alg+', msg) →</div><div style="color:var(--signal);word-break:break-all">'+hex(tag," ")+'</div>'+
        '<div style="margin-top:.4rem">受信側: psa_mac_verify('+(wrongkey?'<span style="color:var(--alias)">違う鍵</span>':'key')+', alg, '+(tamper?'<span style="color:var(--alias)">"'+esc(new TextDecoder().decode(rm))+'"</span>':'msg')+', tag) → '+(okv?OK:ERR("PSA_ERROR_INVALID_SIGNATURE"))+'</div>'+
        '<div style="color:var(--muted)">受信側が計算し直した値: '+hex(tag2," ")+'</div>';
      var p=Math.pow(2,-8*n);
      out.innerHTML='当てずっぽうで検証を通す確率は 1 回あたり 2^−'+(8*n)+(n<=4?' <b style="color:var(--alias)">（'+n+' バイトは短すぎる。43 億回で当たる）</b>':n<8?'（無線フレームなどの最小限）':'')+
        '。<br>比較はライブラリの中で一定時間に行う。psa_mac_compute + memcmp は禁止。';
    }
    [key,msg].forEach(function(i){i.addEventListener("input",upd);});tr.input.addEventListener("input",upd);
    bTamper.addEventListener("click",function(){tamper=true;upd();});bKey.addEventListener("click",function(){wrongkey=true;upd();});bReset.addEventListener("click",function(){tamper=false;wrongkey=false;upd();});upd();
  };

  /* ============ 07. cipher — モードと IV ============ */
  REG.cipher=function(el){
    head(el,"DEMO","出力の形（IV ∥ 暗号文）と、ビット反転が復号に何をするか（模擬 CTR）");
    var row=ctrls(el);
    var mode=select(row,"モード",["PSA_ALG_CTR","PSA_ALG_CBC_PKCS7","PSA_ALG_CBC_NO_PADDING","PSA_ALG_ECB_NO_PADDING"]);
    var pt=textin(row,"平文","amount=100;to=alice","100%");
    var fl=slider(row,"反転するバイト位置（-1: なし）",-1,40,-1,1);
    var bar=mk("div","btns");el.appendChild(bar);var bIv=button(bar,"IV を作り直す（psa_cipher_encrypt は毎回乱数）");
    var cv=screen(el,120), cc=cctx(cv), pn=panel(el), out=readout(el);
    var iv=rnd(16), key=rnd(16);
    function draw(sizes){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var tot=sizes.reduce(function(a,s){return a+s[1];},0), x=20, sc=(w-40)/Math.max(tot,1);
      sizes.forEach(function(s){var ww=s[1]*sc;ctx.fillStyle=s[2];ctx.strokeStyle=C("--line");rrect(ctx,x,40,ww,34,4);ctx.fill();ctx.stroke();
        lab(ctx,s[0]+" "+s[1]+" B",x+ww/2,62,C("--ink"),"center",10.5);x+=ww;});
      lab(ctx,"psa_cipher_encrypt の出力 = "+tot+" バイト（PSA_CIPHER_ENCRYPT_OUTPUT_SIZE）",w/2,22,C("--muted"),"center",10);
      lab(ctx,"復号は先頭 16 バイトを IV として読む",w/2,100,C("--muted"),"center",10);
    }
    function upd(){
      var m=+mode.value, p=u8(pt.value), L=p.length, ivl=m===3?0:16;
      var ctl=m===0?L:(m===1?(Math.floor(L/16)+1)*16:Math.ceil(L/16)*16);
      var bad=(m===2||m===3)&&L%16!==0;
      var pos=+fl.input.value;fl.val.textContent=pos<0?"なし":pos;
      draw(ivl?[["IV",ivl,C("--blue")],["暗号文",ctl,C("--signal-soft")]]:[["暗号文（IV なし）",ctl,C("--signal-soft")]]);
      var html='';
      if(bad){html='<div>'+ERR("PSA_ERROR_INVALID_ARGUMENT")+' — '+L+' バイトは 16 の倍数ではない（NO_PADDING モード）</div>';}
      else if(m===0){
        var ct=ctr(key,iv,p), ct2=new Uint8Array(ct); if(pos>=0&&pos<ct2.length)ct2[pos]^=0x04;
        var back=ctr(key,iv,ct2);
        html='<div>IV: <span style="color:var(--blue)">'+hex(iv," ")+'</span></div><div>暗号文: '+hex(ct2," ")+'</div>'+
          '<div style="margin-top:.4rem">psa_cipher_decrypt → '+OK+' 平文: <b style="color:'+(pos>=0?"var(--alias)":"var(--signal)")+'">'+esc(new TextDecoder().decode(back))+'</b></div>';
        out.innerHTML=(pos>=0&&pos<L?'<b style="color:var(--alias)">暗号文の '+pos+' バイト目の 1 ビットを反転したら、平文の同じ位置の文字が変わった。復号は失敗しない。</b>':'CTR は平文と同じ長さの暗号文。IV は乱数で毎回違う。')+'<br>これが「対称暗号を単独で使わない」理由。AEAD（8 章）なら INVALID_SIGNATURE で止まる。';
      }else{
        html='<div>'+(m===1?'PKCS#7 で '+(ctl-L)+' バイト詰める（16 の倍数ちょうどでも 16 バイト足す）':'詰め物なし')+'。暗号文 '+ctl+' バイト'+(ivl?' + IV 16':'')+'</div>';
        out.innerHTML=m===3?'<b style="color:var(--alias)">ECB は同じ平文ブロックが同じ暗号文になる。データの暗号化には使わない。</b>':'CBC は前ブロックが次に混ざる。詰め物の検証結果が漏れるとパディングオラクル攻撃の温床。新規設計では CTR か AEAD。';
      }
      pn.innerHTML=html;
    }
    mode.addEventListener("change",upd);pt.addEventListener("input",upd);fl.input.addEventListener("input",upd);bIv.addEventListener("click",function(){iv=rnd(16);upd();});reg(cv,function(){upd();});upd();
  };

  /* ============ 08. aead — 4 つの入力 ============ */
  REG.aead=function(el){
    head(el,"DEMO","鍵・ノンス・追加データ・平文 → 暗号文 ∥ タグ。どれか 1 つ違えば復号は失敗する（模擬 AEAD）");
    var row=ctrls(el);
    var ad=textin(row,"追加データ（AD、暗号化しないヘッダ）","v1;dst=07","100%");
    var pt=textin(row,"平文","set_temp=21.5","100%");
    var bar=mk("div","btns");el.appendChild(bar);
    var bN=button(bar,"新しいノンス"), bT=button(bar,"暗号文を改ざん"), bA=button(bar,"受信側の AD を変える"), bR=button(bar,"受信側のノンスを変える"), bZ=button(bar,"元に戻す");
    var cv=screen(el,110), cc=cctx(cv), pn=panel(el), out=readout(el);
    var key=rnd(16), nonce=rnd(12), used={}, t=0,a=0,r=0;
    function aead(k,n,adb,p){var ct=ctr(k,n,p);var tag=hmac(k,cat(adb,n,ct)).subarray(0,16);return cat(ct,tag);}
    function draw(L){var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var segs=[["AD "+u8(ad.value).length,u8(ad.value).length,C("--panel")],["nonce 12",12,C("--blue")],["ciphertext "+L,L,C("--signal-soft")],["tag 16",16,C("--blue")]];
      var tot=segs.reduce(function(s,x){return s+x[1];},0),x=20,sc=(w-40)/tot;
      segs.forEach(function(s){var ww=s[1]*sc;ctx.fillStyle=s[2];ctx.strokeStyle=C("--line");rrect(ctx,x,36,ww,34,4);ctx.fill();ctx.stroke();lab(ctx,s[0],x+ww/2,58,C("--ink"),"center",10);x+=ww;});
      lab(ctx,"送るフレーム。psa_aead_encrypt の出力は「ciphertext ∥ tag」= "+(L+16)+" B（PSA_AEAD_ENCRYPT_OUTPUT_SIZE）",w/2,20,C("--muted"),"center",10);
      lab(ctx,"復号側は AD・nonce・ciphertext∥tag をすべて揃えて psa_aead_decrypt",w/2,92,C("--muted"),"center",10);
    }
    function upd(){
      var p=u8(pt.value), adb=u8(ad.value), out1=aead(key,nonce,adb,p);
      var nh=hex(nonce);used[nh]=(used[nh]||0)+1;
      var rx=new Uint8Array(out1);if(t&&rx.length>16)rx[0]^=1;
      var radb=a?u8(ad.value+"!"):adb, rn=r?rnd(12):nonce;
      var ct=rx.subarray(0,rx.length-16), tag=rx.subarray(rx.length-16), tag2=hmac(key,cat(radb,rn,ct)).subarray(0,16), okv=hex(tag)===hex(tag2);
      var plain=okv?new TextDecoder().decode(ctr(key,rn,ct)):null;
      draw(p.length);
      pn.innerHTML='<div>nonce: <span style="color:var(--blue)">'+hex(nonce," ")+'</span>'+(used[nh]>1?' <b style="color:var(--alias)">← 同じ鍵で '+used[nh]+' 回目！GCM なら認証鍵が漏れる</b>':'')+'</div>'+
        '<div>ciphertext: '+hex(ct," ")+'</div><div>tag: <span style="color:var(--blue)">'+hex(tag," ")+'</span></div>'+
        '<div style="margin-top:.4rem">psa_aead_decrypt(key, GCM, '+(r?'<span style="color:var(--alias)">別の nonce</span>':'nonce')+', '+(a?'<span style="color:var(--alias)">変えた AD</span>':'AD')+', '+(t?'<span style="color:var(--alias)">改ざん ct</span>':'ct')+'∥tag) → '+
        (okv?OK+' 平文: <b class="ok">'+esc(plain)+'</b>':ERR("PSA_ERROR_INVALID_SIGNATURE")+' — 平文は返らない')+'</div>';
      out.innerHTML=okv?'4 つの入力がすべて一致したので平文が出た。ノンスは呼ぶ側が渡す。<b>同じ鍵で同じノンスを二度使わない</b>（「新しいノンス」を押さずに再送すると警告が出る）':
        '<b style="color:var(--alias)">1 ビットでも違えば失敗し、平文は一切出ない。</b>7 章の CTR との決定的な違い。失敗時は出力バッファを使わない。';
    }
    [ad,pt].forEach(function(i){i.addEventListener("input",function(){upd();});});
    bN.addEventListener("click",function(){nonce=rnd(12);upd();});bT.addEventListener("click",function(){t=1;upd();});bA.addEventListener("click",function(){a=1;upd();});bR.addEventListener("click",function(){r=1;upd();});bZ.addEventListener("click",function(){t=a=r=0;upd();});
    reg(cv,function(){upd();});upd();
  };

  /* ============ 09. sign — 署名の流れとサイズ ============ */
  REG.sign=function(el){
    head(el,"DEMO","アルゴリズムごとのサイズ・時間・API を比べる");
    var row=ctrls(el);
    var alg=select(row,"アルゴリズム",["ECDSA P-256 + SHA-256","ECDSA P-384 + SHA-384","Deterministic ECDSA P-256","Ed25519（PURE_EDDSA）","RSA-2048 PSS + SHA-256","RSA-3072 PSS + SHA-256"]);
    var api=select(row,"API",["psa_sign_hash / psa_verify_hash","psa_sign_message / psa_verify_message"]);
    var sz=slider(row,"データの大きさ（KB）",1,4096,256,1);
    var cv=screen(el,170), cc=cctx(cv), pn=panel(el), out=readout(el);
    var A=[{t:"PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1)",b:256,a:"PSA_ALG_ECDSA(PSA_ALG_SHA_256)",h:32,sig:64,pub:65,ts:40,tv:70,rand:true,hashok:true},
      {t:"PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1)",b:384,a:"PSA_ALG_ECDSA(PSA_ALG_SHA_384)",h:48,sig:96,pub:97,ts:120,tv:200,rand:true,hashok:true},
      {t:"PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_SECP_R1)",b:256,a:"PSA_ALG_DETERMINISTIC_ECDSA(PSA_ALG_SHA_256)",h:32,sig:64,pub:65,ts:42,tv:70,rand:false,hashok:true},
      {t:"PSA_KEY_TYPE_ECC_KEY_PAIR(PSA_ECC_FAMILY_TWISTED_EDWARDS)",b:255,a:"PSA_ALG_PURE_EDDSA",h:0,sig:64,pub:32,ts:25,tv:60,rand:false,hashok:false},
      {t:"PSA_KEY_TYPE_RSA_KEY_PAIR",b:2048,a:"PSA_ALG_RSA_PSS(PSA_ALG_SHA_256)",h:32,sig:256,pub:270,ts:600,tv:20,rand:true,hashok:true},
      {t:"PSA_KEY_TYPE_RSA_KEY_PAIR",b:3072,a:"PSA_ALG_RSA_PSS(PSA_ALG_SHA_256)",h:32,sig:384,pub:398,ts:1800,tv:45,rand:true,hashok:true}];
    function draw(a,useHash){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var steps=useHash?[["データ",+sz.input.value+" KB"],["psa_hash_*","分割で "+(a.h||32)+" B"],["psa_sign_hash","秘密鍵"],["署名",a.sig+" B"],["psa_verify_hash","公開鍵 "+a.pub+" B"]]
                        :[["データ",+sz.input.value+" KB"],["psa_sign_message","内部でハッシュ"],["署名",a.sig+" B"],["psa_verify_message","公開鍵 "+a.pub+" B"]];
      var n=steps.length,bw=Math.min(150,(w-40)/n-14),gap=(w-40-bw*n)/(n-1),y=h/2-28;
      steps.forEach(function(s,i){var x=20+i*(bw+gap);ctx.fillStyle=i%2?C("--signal-soft"):C("--panel");ctx.strokeStyle=i%2?C("--signal"):C("--line");ctx.lineWidth=1.3;rrect(ctx,x,y,bw,56,8);ctx.fill();ctx.stroke();
        lab(ctx,s[0],x+bw/2,y+23,C("--ink"),"center",11);lab(ctx,s[1],x+bw/2,y+42,C("--muted"),"center",9.5);
        if(i<n-1){ctx.strokeStyle=C("--muted");ctx.beginPath();ctx.moveTo(x+bw,y+28);ctx.lineTo(x+bw+gap-3,y+28);ctx.stroke();}});
      lab(ctx,"署名時間の目安 "+a.ts+" ms、検証 "+a.tv+" ms（Cortex-M33 100 MHz、ソフトウェア）",w/2,h-12,C("--muted"),"center",10);
    }
    function upd(){
      var a=A[+alg.value], useHash=+api.value===0, kb=+sz.input.value;sz.val.textContent=kb+" KB";
      var err=null;if(useHash&&!a.hashok)err="Ed25519（PURE_EDDSA）はメッセージ全体が必要なので sign_hash は使えない → INVALID_ARGUMENT。sign_message を使う";
      draw(a,useHash&&a.hashok);
      var code=useHash?['uint8_t hash['+(a.h||32)+'], sig[PSA_SIGN_OUTPUT_SIZE('+a.t.split("(")[0].replace("PSA_KEY_TYPE_","")+', '+a.b+', alg)];  /* '+a.sig+' */',
        'psa_hash_compute('+(a.a.match(/SHA_\d+/)||["…"])[0]+', data, len, hash, sizeof hash, &hlen);   /* 大きなら分割 */',
        'psa_sign_hash(key, '+a.a+', hash, '+(a.h||32)+', sig, sizeof sig, &slen);',
        'psa_verify_hash(pub, '+a.a+', hash, '+(a.h||32)+', sig, slen);   /* SUCCESS or INVALID_SIGNATURE */']:
        ['uint8_t sig['+a.sig+'];','psa_sign_message(key, '+a.a+', data, len, sig, sizeof sig, &slen);','psa_verify_message(pub, '+a.a+', data, len, sig, slen);'];
      pn.innerHTML='<pre style="margin:0;white-space:pre-wrap">'+esc(code.join("\n"))+'</pre>';
      out.innerHTML=(err?'<div>'+ERR("✗")+' '+err+'</div>':'')+
        '署名 <b>'+a.sig+' B</b>、公開鍵 <b>'+a.pub+' B</b>'+(a.sig===64||a.sig===96?'（ECDSA は r ∥ s の生連結。DER ではない）':'')+
        '。用途: 署名側 SIGN_'+(useHash?'HASH':'MESSAGE')+'、検証側 VERIFY_'+(useHash?'HASH':'MESSAGE')+
        (a.rand?'<br>署名に乱数を使う。乱数が悪いと秘密鍵が漏れる → 乱数源に不安なら DETERMINISTIC_ECDSA か Ed25519':'<br>決定論的（乱数不要）。同じ入力には同じ署名');
    }
    [alg,api].forEach(function(s){s.addEventListener("change",upd);});sz.input.addEventListener("input",upd);reg(cv,function(){upd();});upd();
  };

  /* ============ 10. kdf — HKDF ============ */
  REG.kdf=function(el){
    head(el,"DEMO","HKDF-SHA256 を実際に計算する。info を変えると出力が全く変わる");
    var row=ctrls(el);
    var ikm=textin(row,"SECRET（IKM。本来は鍵 ID で input_key）","master-secret","100%");
    var salt=textin(row,"SALT（公開の乱数。空でもよい）","0102030405","100%");
    var info=textin(row,"INFO（用途ラベル）","session-tx","100%");
    var len=slider(row,"output の長さ（バイト）",16,64,32,16);
    var pn=panel(el), out=readout(el);
    function upd(){
      var L=+len.input.value;len.val.textContent=L;
      var i=u8(ikm.value), s=/^[0-9a-f]*$/i.test(salt.value)&&salt.value.length%2===0?new Uint8Array((salt.value.match(/../g)||[]).map(function(h){return parseInt(h,16);})):u8(salt.value);
      var r=hkdf(i,s,u8(info.value),L), r2=hkdf(i,s,u8(info.value+"-other"),L), r3=hkdf(i,s,u8(""),L);
      pn.innerHTML='<div>extract: PRK = HMAC(salt, IKM) = <span style="color:var(--muted)">'+hex(r.prk)+'</span></div>'+
        '<div style="margin-top:.35rem">expand（info = "'+esc(info.value)+'"）→ <span style="color:var(--signal)">'+hex(r.okm," ")+'</span></div>'+
        '<div style="margin-top:.35rem">同じ SECRET・SALT で info = "'+esc(info.value)+'-other" → <span style="color:var(--blue)">'+hex(r2.okm," ")+'</span></div>'+
        '<div style="margin-top:.35rem;color:var(--muted)">info なし → '+hex(r3.okm," ")+'（用途を区別できない。送信鍵 = 受信鍵になる）</div>';
      out.innerHTML='入力順は <b>SALT → SECRET → INFO</b>。結果は output_key で鍵として取り出す（値をアプリに出さない）。output_bytes は PSA の外に渡すときだけ。'+
        '<br>容量: HKDF-SHA256 は最大 255 × 32 = 8160 バイト。'+L+' バイトなら HMAC を '+Math.ceil(L/32)+' 回。';
    }
    [ikm,salt,info].forEach(function(x){x.addEventListener("input",upd);});len.input.addEventListener("input",upd);upd();
  };

  /* ============ 11. ecdh — 鍵合意（小さな有限体 DH で模擬） ============ */
  REG.ecdh=function(el){
    head(el,"DEMO","公開値を交換して同じ秘密を作る（楕円曲線の代わりに 61 ビットの素数体で模擬）");
    var bar=mk("div","btns");el.appendChild(bar);
    var bA=button(bar,"自分の一時鍵を作り直す"), bB=button(bar,"相手の一時鍵を作り直す"), bM=button(bar,"中間者が自分の公開値を差し込む");
    var pn=panel(el), out=readout(el);
    var P=(1n<<61n)-1n, G=3n;
    function mp(b,e){var r=1n;b%=P;while(e>0n){if(e&1n)r=r*b%P;b=b*b%P;e>>=1n;}return r;}
    function rk(){var b=rnd(8);var v=0n;for(var i=0;i<8;i++)v=(v<<8n)|BigInt(b[i]);return v%(P-2n)+1n;}
    var a=rk(),b=rk(),m=null;
    function upd(){
      var A=mp(G,a),B=mp(G,b);
      var sa,sb,html;
      if(m===null){sa=mp(B,a);sb=mp(A,b);
        html='<div>自分: 秘密 a（psa_generate_key、揮発）、公開 A = g^a = <span style="color:var(--signal)">'+A+'</span> → psa_export_public_key で送る</div>'+
          '<div>相手: 秘密 b、公開 B = g^b = <span style="color:var(--blue)">'+B+'</span></div>'+
          '<div style="margin-top:.4rem">自分: psa_key_derivation_key_agreement(op, SECRET, a, B) → B^a = <b style="color:var(--signal)">'+sa+'</b></div>'+
          '<div>相手: 同じく A^b = <b style="color:var(--blue)">'+sb+'</b></div>'+
          '<div style="margin-top:.4rem">'+(sa===sb?'<b class="ok">一致</b>。盗聴者は A と B を見ているが a も b も知らない':'不一致')+'</div>';
        var okm=hkdf(u8(sa.toString()),new Uint8Array(0),u8("app-session-v1"),16).okm;
        html+='<div style="margin-top:.4rem;color:var(--muted)">→ HKDF(info="app-session-v1") → AES 鍵 '+hex(okm," ")+'（共有秘密をそのまま鍵にしない）</div>';
        out.innerHTML='実際は P-256 または X25519 で、公開鍵は 65 / 32 バイト。鍵の algorithm は KEY_AGREEMENT(ECDH, HKDF(SHA_256)) にし、操作と完全一致させる。<br>一時鍵は使い終わったら destroy（前方秘匿性）。';
      }else{var M=mp(G,m);var s1=mp(M,a),s2=mp(M,b);
        html='<div>自分は「相手の公開値」として M = <span style="color:var(--alias)">'+M+'</span> を受け取った（本当は中間者のもの）</div>'+
          '<div>自分の共有秘密 M^a = '+s1+'　←→　中間者は A^m で同じ値を持つ</div><div>相手の共有秘密 M^b = '+s2+'　←→　中間者は B^m で同じ値を持つ</div>'+
          '<div style="margin-top:.4rem"><b style="color:var(--alias)">両側と別々に鍵合意が成立し、中間者はすべてを復号・改ざんできる</b></div>';
        out.innerHTML='ECDH は相手を認証しない。<b>一時公開鍵に長期署名鍵で署名し、登録済みの公開鍵で検証</b>してから鍵合意する（11 章 6 節）。中間者は署名を偽造できないので排除される。';}
      pn.innerHTML=html;
    }
    bA.addEventListener("click",function(){a=rk();m=null;upd();});bB.addEventListener("click",function(){b=rk();m=null;upd();});bM.addEventListener("click",function(){m=rk();upd();});upd();
  };

  /* ============ 12. lifetime — ライフタイムと鍵 ID ============ */
  REG.lifetime=function(el){
    head(el,"DEMO","lifetime の 32 ビットと、鍵 ID の範囲を確かめる");
    var row=ctrls(el);
    var per=select(row,"persistence（下位 8 ビット）",["PSA_KEY_PERSISTENCE_VOLATILE (0x00)","PSA_KEY_PERSISTENCE_DEFAULT (0x01)","PSA_KEY_PERSISTENCE_READ_ONLY (0xff)"]);
    var loc=select(row,"location（上位 24 ビット）",["PSA_KEY_LOCATION_LOCAL_STORAGE (0)","PSA_KEY_LOCATION_PRIMARY_SECURE_ELEMENT (1)","ベンダ定義 (0x800001)"]);
    var kid=textin(row,"psa_set_key_id に渡す値（16 進）","0x00010001","100%");
    var pn=panel(el), out=readout(el);
    function upd(){
      var p=[0,1,0xff][+per.value], l=[0,1,0x800001][+loc.value], lt=((l<<8)|p)>>>0;
      var id=parseInt(kid.value,16); if(isNaN(id))id=0;
      var range=id===0?["PSA_KEY_ID_NULL","var(--alias)","鍵なし。INVALID_HANDLE"]:id<=0x3fffffff?["アプリケーション範囲（USER_MIN〜USER_MAX）","var(--signal)","永続鍵の ID に使える"]:id<=0x7fffffff?["実装・ベンダ範囲","var(--alias)","揮発鍵の自動 ID や組み込み鍵（TF-M の HUK は 0x7FFF815B など）。アプリが指定すると INVALID_ARGUMENT"]:["予約","var(--alias)","使えない"];
      var probs=[];
      if(p===0&&id!==0)probs.push("揮発鍵に ID を設定 → INVALID_ARGUMENT（揮発鍵の ID は実装が振る）");
      if(p!==0&&id===0)probs.push("永続鍵で ID 未設定 → INVALID_ARGUMENT");
      if(p===0xff)probs.push("READ_ONLY: psa_destroy_key は NOT_PERMITTED。工場出荷鍵・ハードウェア固有鍵向け。通常はアプリから作れない");
      pn.innerHTML='<div>lifetime = (location << 8) | persistence = (0x'+l.toString(16)+' << 8) | 0x'+p.toString(16)+' = <b>0x'+("0000000"+lt.toString(16)).slice(-8)+'</b></div>'+
        '<div style="color:var(--muted)">'+(lt===0?'= PSA_KEY_LIFETIME_VOLATILE':lt===1?'= PSA_KEY_LIFETIME_PERSISTENT':'= PSA_KEY_LIFETIME_FROM_PERSISTENCE_AND_LOCATION('+["VOLATILE","DEFAULT","READ_ONLY"][+per.value]+', '+["LOCAL_STORAGE","PRIMARY_SECURE_ELEMENT","0x800001"][+loc.value]+')')+'</div>'+
        '<div style="margin-top:.4rem">鍵 ID 0x'+("0000000"+id.toString(16)).slice(-8)+': <b style="color:'+range[1]+'">'+range[0]+'</b> — '+range[2]+'</div>';
      out.innerHTML=(probs.length?probs.map(function(x){return '<div>'+ERR("✗")+' '+x+'</div>';}).join(""):'<div><b class="ok">✓</b> 整合している</div>')+
        (l!==0?'<div style="color:var(--muted)">location ≠ 0: この鍵の操作はドライバ（セキュアエレメント）に振り分けられる。アプリのコードは変わらない</div>':'');
    }
    [per,loc].forEach(function(s){s.addEventListener("change",upd);});kid.addEventListener("input",upd);upd();
  };

  /* ============ 13. its — ITS シミュレータ ============ */
  REG.its=function(el){
    head(el,"DEMO","psa_its_set / get / get_info / remove を模擬ストレージで動かす");
    var row=ctrls(el);
    var uid=textin(row,"UID（16 進、64 ビット。0 は無効）","0x100000001","100%");
    var data=textin(row,"データ","boot=17","100%");
    var wo=checkbox(row,"PSA_STORAGE_FLAG_WRITE_ONCE で作成",false);
    var bar=mk("div","btns");el.appendChild(bar);
    var B={};["psa_its_set","psa_its_get","psa_its_get_info","psa_its_remove","RSA 鍵ペア（1190 B）を set"].forEach(function(n){B[n]=button(bar,n);});
    var pn=panel(el,90), out=readout(el);
    var store={}, QUOTA=2048, MAXA=512, log=[];
    function used(){var s=0;for(var k in store)s+=store[k].d.length+16;return s;}
    function show(){
      var u=used(), pct=Math.round(u/QUOTA*100);
      out.innerHTML='<div style="height:8px;border-radius:5px;background:var(--panel);overflow:hidden;margin:.1rem 0 .4rem"><div style="height:100%;width:'+pct+'%;background:var(--signal)"></div></div>'+
        '使用 '+u+' / '+QUOTA+' B（ITS_FLASH_AREA_SIZE の模擬）・ITS_MAX_ASSET_SIZE = '+MAXA+' B・オブジェクト '+Object.keys(store).length+' 個'+
        '<div style="margin-top:.3rem">'+Object.keys(store).map(function(k){return '<span style="color:var(--muted)">'+k+'</span>: '+store[k].d.length+' B'+(store[k].f&1?' '+pill("WRITE_ONCE","var(--alias)"):'');}).join(" ・ ")+'</div>';
      pn.innerHTML=log.slice(-6).map(function(l){return '<div>'+l+'</div>';}).join("")||'<span style="color:var(--faint)">ボタンで関数を呼ぶ</span>';
    }
    function call(n){
      var u=uid.value.trim().toLowerCase(), r;
      if(!/^0x[0-9a-f]{1,16}$/.test(u)||/^0x0*$/.test(u)){log.push(n+': '+ERR("PSA_ERROR_INVALID_ARGUMENT")+' — UID は 64 ビットの非ゼロ');show();return;}
      var d=n.indexOf("RSA")===0?new Uint8Array(1190):u8(data.value), f=wo.checked?1:0;
      if(n==="psa_its_set"||n.indexOf("RSA")===0){
        if(store[u]&&(store[u].f&1))r=ERR("PSA_ERROR_NOT_PERMITTED")+' — WRITE_ONCE のオブジェクトは上書きできない';
        else if(d.length>MAXA)r=ERR("PSA_ERROR_INSUFFICIENT_STORAGE")+' — '+d.length+' B > ITS_MAX_ASSET_SIZE '+MAXA+'（TF-M では -DITS_MAX_ASSET_SIZE で広げる）';
        else if(used()-(store[u]?store[u].d.length+16:0)+d.length+16>QUOTA)r=ERR("PSA_ERROR_INSUFFICIENT_STORAGE")+' — 領域が満杯';
        else{var was=!!store[u];store[u]={d:d,f:was?store[u].f:f};r=OK+(was?'（上書き。フラグは最初の作成時のものが残る）':'（作成'+(f?'、WRITE_ONCE':'')+'）');}
        n="psa_its_set("+u+", "+d.length+", data, "+(f?"WRITE_ONCE":"NONE")+")";
      }else if(n==="psa_its_get"){r=store[u]?OK+' → '+store[u].d.length+' B: "'+esc(new TextDecoder().decode(store[u].d).replace(/\0+/g,"\\0…"))+'"':ERR("PSA_ERROR_DOES_NOT_EXIST");}
      else if(n==="psa_its_get_info"){r=store[u]?OK+' → size='+store[u].d.length+', capacity='+store[u].d.length+', flags=0x'+store[u].f:ERR("PSA_ERROR_DOES_NOT_EXIST");}
      else if(n==="psa_its_remove"){if(!store[u])r=ERR("PSA_ERROR_DOES_NOT_EXIST");else if(store[u].f&1)r=ERR("PSA_ERROR_NOT_PERMITTED")+' — WRITE_ONCE は消せない（テストで使うと消せなくなる）';else{delete store[u];r=OK;}}
      log.push('<span style="color:var(--muted)">'+n+'</span>: '+r);show();
    }
    Object.keys(B).forEach(function(n){B[n].addEventListener("click",function(){call(n);});});show();
  };

  /* ============ 14. attest — トークン構造 ============ */
  REG.attest=function(el){
    head(el,"DEMO","トークンの主張を組み立て、検証側の判定を見る");
    var row=ctrls(el);
    var lc=select(row,"security lifecycle（2395）",["0x3000 SECURED","0x1000 PSA_ROT_PROVISIONING","0x4000 NON_PSA_ROT_DEBUG","0x2000 NON_PSA_ROT_PROVISIONING"]);
    var ver=textin(row,"NSPE のバージョン（sw component）","1.2.0","100%");
    var nonceOk=checkbox(row,"nonce がサーバの送ったチャレンジと一致",true);
    var allow=checkbox(row,"NSPE の測定値が許可リストにある",true);
    var sigOk=checkbox(row,"IAK の署名が検証できる（テスト用 IAK を差し替え済み）",true);
    var bar=mk("div","btns");el.appendChild(bar);var bC=button(bar,"新しいチャレンジ");
    var pn=panel(el), out=readout(el);
    var ch=rnd(32);
    function upd(){
      var meas=sha256(u8("nspe-image-"+ver.value)), bseed=rnd(8), lcv=[0x3000,0x1000,0x4000,0x2000][+lc.value];
      var lines=['{ /* COSE_Sign1 payload（CBOR マップ） */',
        '  10   (nonce):               h\''+hex(ch)+'\'',
        '  256  (ueid):                h\'01'+hex(sha256(u8("iak-pub")).subarray(0,16))+'…\'',
        '  265  (profile):             "http://arm.com/psa/2.0.0"',
        '  2394 (client id):           -1',
        '  2395 (security lifecycle):  0x'+lcv.toString(16)+'  ('+["SECURED","PSA_ROT_PROVISIONING","NON_PSA_ROT_DEBUG","NON_PSA_ROT_PROVISIONING"][+lc.value]+')',
        '  2396 (implementation id):   h\''+hex(sha256(u8("impl")).subarray(0,8))+'…\'',
        '  2397 (boot seed):           h\''+hex(bseed)+'…\'',
        '  2399 (sw components): [',
        '    { 1: "BL2",  2: h\''+hex(sha256(u8("bl2")).subarray(0,6))+'…\', 4: "2.1.0", 5: h\'…\', 6: "SHA256" },',
        '    { 1: "SPE",  2: h\''+hex(sha256(u8("spe")).subarray(0,6))+'…\', 4: "2.1.0", 5: h\'…\', 6: "SHA256" },',
        '    { 1: "NSPE", 2: h\''+hex(meas.subarray(0,6))+'…\', 4: "'+ver.value+'", 5: h\'…\', 6: "SHA256" }',
        '  ]',
        '}',
        'signature (ES256): '+hex(rnd(6))+'…  (64 B)'];
      pn.innerHTML='<pre style="margin:0;white-space:pre-wrap">'+esc(lines.join("\n"))+'</pre>';
      var checks=[["署名（IAK 公開鍵で ECDSA）",sigOk.checked],["nonce = 送ったチャレンジ",nonceOk.checked],["lifecycle = SECURED",lcv===0x3000],["NSPE の測定値が許可リストに",allow.checked]];
      var pass=checks.every(function(c){return c[1];});
      out.innerHTML=checks.map(function(c){return '<div>'+(c[1]?'<b class="ok">✓</b>':ERR("✗"))+' '+c[0]+'</div>';}).join("")+
        '<div style="margin-top:.3rem"><b style="color:'+(pass?"var(--signal)":"var(--alias)")+'">'+(pass?'合格 — 正規のハードウェアで、正規のファームウェアが、保護された状態で動いている':'不合格 — 接続や鍵の配布を拒否する')+'</b></div>'+
        '<div style="color:var(--muted)">装置側は psa_initial_attest_get_token(challenge, 32, buf, size, &len) を呼ぶだけ。トークンは 300〜700 B</div>';
    }
    [lc].forEach(function(s){s.addEventListener("change",upd);});ver.addEventListener("input",upd);[nonceOk,allow,sigOk].forEach(function(c){c.addEventListener("change",upd);});bC.addEventListener("click",function(){ch=rnd(32);upd();});upd();
  };

  /* ============ 15. config — PSA_WANT_* ビルダー ============ */
  REG.config=function(el){
    head(el,"DEMO","使う機能を選び、psa/crypto_config.h の宣言とサイズの目安を出す");
    var row=ctrls(el);
    var FEAT=[["SHA-256 ハッシュ",["PSA_WANT_ALG_SHA_256"],6,true],["HMAC",["PSA_WANT_ALG_HMAC","PSA_WANT_KEY_TYPE_HMAC"],1,true],
      ["AES-GCM（AEAD）",["PSA_WANT_ALG_GCM","PSA_WANT_KEY_TYPE_AES"],9,true],["AES-CTR",["PSA_WANT_ALG_CTR","PSA_WANT_KEY_TYPE_AES"],1,false],
      ["ChaCha20-Poly1305",["PSA_WANT_ALG_CHACHA20_POLY1305","PSA_WANT_KEY_TYPE_CHACHA20"],4,false],
      ["ECDSA P-256 署名",["PSA_WANT_ALG_ECDSA","PSA_WANT_ECC_SECP_R1_256","PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC","PSA_WANT_KEY_TYPE_ECC_PUBLIC_KEY"],28,true],
      ["ECDSA の検証だけ（署名しない）",["PSA_WANT_ALG_ECDSA","PSA_WANT_ECC_SECP_R1_256","PSA_WANT_KEY_TYPE_ECC_PUBLIC_KEY"],22,false],
      ["ECC 鍵ペアの生成（psa_generate_key）",["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_GENERATE"],3,true],
      ["ECC 鍵ペアの import / export（公開鍵 export 含む）",["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_IMPORT","PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_EXPORT"],2,true],
      ["ECDH 鍵合意",["PSA_WANT_ALG_ECDH"],4,true],["X25519",["PSA_WANT_ECC_MONTGOMERY_255"],6,false],["Ed25519",["PSA_WANT_ALG_PURE_EDDSA","PSA_WANT_ECC_TWISTED_EDWARDS_255"],10,false],
      ["HKDF 鍵導出",["PSA_WANT_ALG_HKDF","PSA_WANT_KEY_TYPE_DERIVE"],2,true],["PBKDF2",["PSA_WANT_ALG_PBKDF2_HMAC","PSA_WANT_KEY_TYPE_PASSWORD"],2,false],
      ["RSA-2048 署名・OAEP",["PSA_WANT_ALG_RSA_PSS","PSA_WANT_ALG_RSA_OAEP","PSA_WANT_KEY_TYPE_RSA_KEY_PAIR_BASIC","PSA_WANT_KEY_TYPE_RSA_KEY_PAIR_IMPORT","PSA_WANT_KEY_TYPE_RSA_PUBLIC_KEY"],30,false],
      ["永続鍵（MBEDTLS_PSA_CRYPTO_STORAGE_C + ITS）",["MBEDTLS_PSA_CRYPTO_STORAGE_C"],4,true]];
    var cbs=FEAT.map(function(f){return checkbox(row,f[0],f[3]);});
    var hw=checkbox(row,"AES / SHA のハードウェアアクセラレータ（MBEDTLS_PSA_ACCEL_*）",false);
    var pn=panel(el), out=readout(el);
    function upd(){
      var defs={}, kb=14;
      FEAT.forEach(function(f,i){if(cbs[i].checked){f[1].forEach(function(d){defs[d]=1;});kb+=f[2];}});
      if(hw.checked){kb-=8;defs["MBEDTLS_PSA_ACCEL_ALG_GCM"]=1;defs["MBEDTLS_PSA_ACCEL_ALG_SHA_256"]=1;}
      var warn=[];
      if(defs["PSA_WANT_ALG_ECDSA"]&&!defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC"]&&!defs["PSA_WANT_KEY_TYPE_ECC_PUBLIC_KEY"])warn.push("ECDSA を宣言したが鍵種別がない");
      if(defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_GENERATE"]&&!defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC"])warn.push("_GENERATE には _BASIC が要る");
      if(defs["PSA_WANT_ALG_ECDH"]&&!defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC"])warn.push("ECDH には ECC 鍵ペア（_BASIC）が要る");
      if(defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC"]&&!defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_GENERATE"])warn.push("psa_generate_key で ECC 鍵を作るなら _GENERATE。ないと NOT_SUPPORTED");
      if(defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_BASIC"]&&!defs["PSA_WANT_KEY_TYPE_ECC_KEY_PAIR_EXPORT"])warn.push("psa_export_public_key には _EXPORT が要る実装がある（Mbed TLS 3.6）");
      if(!defs["PSA_WANT_ALG_SHA_256"]&&(defs["PSA_WANT_ALG_HMAC"]||defs["PSA_WANT_ALG_ECDSA"]||defs["PSA_WANT_ALG_HKDF"]))warn.push("HMAC / ECDSA / HKDF は SHA-256 が要る");
      var lines=["/* psa/crypto_config.h */","#define MBEDTLS_PSA_CRYPTO_C","#define MBEDTLS_PSA_CRYPTO_CONFIG"].concat(Object.keys(defs).sort().map(function(d){return "#define "+d+(d.indexOf("PSA_WANT")===0||d.indexOf("ACCEL")>0?" 1":"");}));
      pn.innerHTML='<pre style="margin:0;white-space:pre-wrap">'+esc(lines.join("\n"))+'</pre>';
      out.innerHTML='コードサイズの目安: <b>約 '+kb+' KB</b>（Cortex-M4、-Os。実測はビルドで）'+
        '<div style="height:8px;border-radius:5px;background:var(--panel);overflow:hidden;margin:.3rem 0"><div style="height:100%;width:'+Math.min(100,kb)+'%;background:var(--signal)"></div></div>'+
        (warn.length?warn.map(function(w){return '<div style="color:var(--alias)">⚠ '+w+'</div>';}).join(""):'<div class="ok">✓ 宣言の整合は取れている</div>')+
        '<div style="color:var(--muted)">マイコンではさらにエントロピー源（mbedtls_hardware_poll か EXTERNAL_RNG）が必須</div>';
    }
    cbs.concat([hw]).forEach(function(c){c.addEventListener("change",upd);});upd();
  };

  /* ============ 16. tfm — 壁越しの呼び出し ============ */
  REG.tfm=function(el){
    head(el,"DEMO","psa_sign_hash が NSPE → SPE を往復する様子");
    var row=ctrls(el);
    var lvl=select(row,"隔離レベル",["1（SPE/NSPE のみ）","2（PSA-RoT / ARoT を MPU で）","3（全パーティション）"]);
    var ptr=select(row,"署名バッファのポインタ",["NSPE の RAM（スタック・静的配列）","NSPE のフラッシュ定数（const）","SPE のアドレス（攻撃または誤り）"]);
    var rtos=checkbox(row,"RTOS で 2 スレッドが同時に呼ぶ（tfm_ns_interface_dispatch のロック）",true);
    var cv=screen(el,230), cc=cctx(cv), out=readout(el);
    var t0=performance.now();
    function draw(){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var names=["アプリ","NS ライブラリ","ベニア / SPM","Crypto パーティション"], n=4, bw=Math.min(160,(w-40)/n-14), gap=(w-40-bw*n)/(n-1), y=60, xs=[];
      var xb=20+2*(bw+gap)-gap/2;
      ctx.fillStyle=C("--signal-soft");ctx.fillRect(xb,10,w-xb-10,h-20);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(xb,10);ctx.lineTo(xb,h-10);ctx.stroke();
      lab(ctx,"NSPE",xb-8,26,C("--muted"),"right",10);lab(ctx,"SPE（TrustZone）",xb+8,26,C("--signal"),"left",10);
      names.forEach(function(nm,i){var x=20+i*(bw+gap);xs.push(x+bw/2);ctx.fillStyle=C("--panel");ctx.strokeStyle=i>=2?C("--signal"):C("--line");ctx.lineWidth=1.3;rrect(ctx,x,y,bw,46,8);ctx.fill();ctx.stroke();lab(ctx,nm,x+bw/2,y+28,C("--ink"),"center",11);});
      var bad=+ptr.value, L=+lvl.value, over=[6,12,18][L];
      var T=2.6, tt=((performance.now()-t0)/1000)%T, phases=[[0,0.5,0,1,"引数を invec/outvec に"],[0.5,0.9,1,2,"psa_call → SG 命令"],[0.9,1.2,2,2,"ポインタ検査"],[1.2,1.5,2,3,"要求を渡す"],[1.5,2.0,3,3,"本物の psa_sign_hash"],[2.0,2.6,3,0,"結果と status を返す"]];
      var ph=phases.filter(function(p){return tt>=p[0]&&tt<p[1];})[0]||phases[0];
      var fr=(tt-ph[0])/(ph[1]-ph[0]), px=xs[ph[2]]+(xs[ph[3]]-xs[ph[2]])*fr;
      var fail=bad&&tt>=0.9;
      if(fail){px=xs[2];lab(ctx,"検査失敗 → PSA_ERROR_PROGRAMMER_ERROR（−129）",xs[2],y+72,C("--alias"),"center",10.5);}
      ctx.fillStyle=fail?C("--alias"):C("--signal");ctx.beginPath();ctx.arc(px,y+58,5,0,TAU);ctx.fill();
      if(!fail)lab(ctx,ph[4],px,y+80,C("--muted"),"center",10);
      if(ph[2]===2&&ph[3]===3&&!fail)lab(ctx,"隔離レベル "+(L+1)+": MPU 再設定",xs[2],y+100,C("--muted"),"center",9.5);
      lab(ctx,"往復オーバーヘッド 約 "+over+" µs（レベル "+(L+1)+"）。署名本体 20〜60 ms に比べれば小さいが、1 バイトずつ update する書き方は避ける",w/2,h-24,C("--muted"),"center",9.5);
      if(rtos.checked)lab(ctx,"スレッド 2 はロック待ち（tfm_ns_interface_dispatch）",20,y+120,C("--blue"),"left",9.5);
    }
    anim(el,draw);reg(cv,draw);
    function upd(){var b=+ptr.value;out.innerHTML=b===0?'渡すバッファはすべて NSPE の RAM。SPM が検査して通す。':b===1?'<b style="color:var(--alias)">フラッシュ定数は、プラットフォームによっては NS 側の「読める領域」に登録されておらず PROGRAMMER_ERROR</b>。RAM にコピーしてから渡す。':'<b style="color:var(--alias)">SPE のメモリを指すポインタは検査で拒否される</b>。これが「非セキュア側がセキュアメモリを読み書きさせる」攻撃を防ぐ仕組み。';}
    [lvl,ptr].forEach(function(s){s.addEventListener("change",upd);});rtos.addEventListener("change",upd);upd();
  };

  /* ============ 17. pattern — 要件から呼び出し列 ============ */
  REG.pattern=function(el){
    head(el,"DEMO","パターンを選ぶと、鍵の属性と関数の順序が出る");
    var row=ctrls(el);
    var P=[["A. 装置の認証（TLS クライアント）",
        [["ECC P-256 鍵ペア","SIGN_HASH","ECDSA(ANY_HASH)","永続 0x10001","装置内 generate"]],
        ["初回: psa_get_key_attributes(KEY_ID) で存在確認 → なければ psa_generate_key","psa_export_public_key → CSR → 装置証明書を PS に保存","毎回: mbedtls_pk_setup_opaque(&pk, KEY_ID) → mbedtls_ssl_conf_own_cert","（TLS が内部で psa_sign_hash を呼ぶ）"],"04・09・15"],
      ["B. 設定の暗号化保存（TF-M なし）",
        [["AES 256","ENCRYPT | DECRYPT","GCM","永続 0x30001","装置内 generate"]],
        ["psa_generate_random(nonce, 12)","AD = \"config\" ∥ version","psa_aead_encrypt(KEY, GCM, nonce, 12, AD, plain) → ct∥tag","[version][nonce][ct∥tag] を保存。最新 version を ITS に","読み出し: psa_aead_decrypt。失敗なら工場出荷状態へ"],"08・12・13"],
      ["C. OTA イメージの検証",
        [["ECC P-256 公開鍵","VERIFY_HASH","ECDSA(SHA_256)","read-only / WRITE_ONCE","工場で import"]],
        ["psa_hash_setup(SHA_256)","受信チャンクごとに psa_hash_update","psa_hash_finish → hash","psa_verify_hash(PUB, ECDSA(SHA_256), hash, 32, sig, 64)","version > ITS の値なら切替、ITS を更新"],"05・09・13"],
      ["D. 装置間の暗号化通信",
        [["ECC P-256 鍵ペア（長期）","SIGN_HASH","ECDSA(SHA_256)","永続","装置内 generate"],["ECC P-256 鍵ペア（一時）","DERIVE","KEY_AGREEMENT(ECDH, HKDF(SHA_256))","揮発","接続ごとに generate"],["AES 256 × 2（tx / rx）","ENCRYPT / DECRYPT","GCM","揮発","導出"]],
        ["psa_generate_key（一時 ECDH）→ psa_export_public_key","psa_sign_message(長期鍵, 一時公開鍵 ∥ 乱数) → 送る","受信: psa_verify_message(相手の公開鍵, …)","psa_key_derivation_setup(KEY_AGREEMENT(ECDH, HKDF)) → input SALT → key_agreement(SECRET) → input INFO=\"tx\" → output_key","同じく INFO=\"rx\" で受信鍵","psa_destroy_key(一時鍵)。以後 psa_aead_encrypt/decrypt（カウンタノンス）"],"09・10・11"],
      ["E. データの改ざん防止（MAC チェーン）",
        [["HMAC 256","SIGN_MESSAGE","HMAC(SHA_256) を 16 に切り詰め","永続","導出注入"]],
        ["record = [timestamp][value][prev_tag]","psa_mac_compute(KEY, TRUNCATED_MAC(HMAC(SHA_256), 16), record) → tag","保存。次のレコードの prev_tag にする","検証側: psa_mac_verify で連鎖を辿る"],"06・10"],
      ["F. 製造時の鍵注入",
        [["DERIVE（HSM 側のマスター鍵）","DERIVE","HKDF(SHA_256)","HSM 内","—"],["AES 256（装置鍵）","ENCRYPT | DECRYPT","GCM","永続、EXPORT なし","import"]],
        ["HSM: HKDF(master, salt=∅, info=\"dev-key/v1/\" ∥ serial) → 32 B","治具経由で装置へ（経路は保護）","装置: psa_import_key(attr{永続, EXPORT なし}, key, 32, &id)","注入インタフェースを無効化、ライフサイクルを SECURED へ"],"04・10・12"],
      ["G. 健全性の証明",
        [["IAK（TF-M 管理）","—","ECDSA P-256","read-only","プロビジョニング"]],
        ["サーバ → challenge（32 B）","psa_initial_attest_get_token(challenge, 32, buf, 1024, &len)","トークンを送る","サーバ: 署名・nonce・lifecycle・sw components を検証"],"14"]];
    var sel=select(row,"パターン",P.map(function(p){return p[0];}));
    var pn=panel(el), out=readout(el);
    function upd(){var p=P[+sel.value];
      pn.innerHTML='<div style="color:var(--signal);font-weight:600;margin-bottom:.3rem">鍵</div>'+tbl(["type","usage","algorithm","lifetime","作り方"],p[1])+
        '<div style="color:var(--signal);font-weight:600;margin:.6rem 0 .3rem">呼び出し列</div><ol style="margin:0;padding-left:1.4rem">'+p[2].map(function(s){return '<li>'+esc(s)+'</li>';}).join("")+'</ol>';
      out.innerHTML='関連章: '+p[3]+'。実装前に「鍵の一覧・ノンス管理・失敗時の動作・更新手順・保存場所」を紙に書く（17 章 9 節）';}
    sel.addEventListener("change",upd);upd();
  };

  /* ============ 18. checklist ============ */
  REG.checklist=function(el){
    head(el,"DEMO","出荷前に確かめること");
    var DATA=[
      ["作法（02 章）",["すべての psa_* の戻り値を検査し、失敗時に <b>goto cleanup</b> で abort / destroy しているか","psa_crypto_init() を全 API の前に呼んでいるか","出力バッファのサイズを<b>マクロ</b>で決めているか（決め打ちの 16 / 32 / 64 がないか）","操作オブジェクトを INIT 初期化子で宣言し、memcpy していないか"]],
      ["鍵（03・04・12 章）",["鍵の一覧（type / bits / usage / algorithm / lifetime / ID / 作り方）が文書化されているか","<b>EXPORT</b> を持つ鍵をすべて列挙し、理由を説明できるか","1 つの鍵を複数用途（署名と ECDH、暗号化と MAC）に使っていないか","永続鍵は「あれば使う、なければ作る」になっているか","永続鍵の ID が 1〜0x3FFFFFFF で、プロジェクトの台帳にあるか","デバイス固有の秘密鍵は<b>装置内で生成</b>しているか","cleanup で揮発鍵を destroy し、リークしていないか"]],
      ["乱数・ノンス（05・07・08 章）",["鍵・ノンス・チャレンジに psa_generate_random / psa_generate_key 以外を使っていないか","AEAD のノンスが同じ鍵で<b>再起動をまたいでも繰り返さない</b>設計か","対称暗号（psa_cipher_*）を単独でデータ暗号化に使っていないか","AEAD の追加データにヘッダ・バージョン・宛先が入っているか","AEAD 分割復号で verify 前の出力を使っていないか"]],
      ["MAC・署名（06・09 章）",["MAC の検証を psa_mac_verify で行い、compute + memcmp していないか","署名検証の公開鍵が<b>書き換え不能な場所</b>にあるか","ECDSA 署名の形式（r∥s 64 B）を相手側と合わせたか","チャレンジ応答のチャレンジがサーバの乱数か。署名対象に文脈が入っているか","乱数源に不安があるなら DETERMINISTIC_ECDSA か Ed25519 か"]],
      ["導出・鍵合意（10・11 章）",["ECDH の共有秘密を KDF なしで鍵にしていないか","HKDF の info に方向・用途・バージョンが入っているか","パスワードは PBKDF2（HKDF ではない）か","一時 ECDH 鍵を使用後に destroy しているか","一時公開鍵に長期鍵で署名し、相手を認証しているか"]],
      ["ストレージ（13 章）",["鍵の値を自分で ITS / PS に書いていないか（鍵 API を使っているか）","WRITE_ONCE を工場データ以外に使っていないか","ITS_MAX_ASSET_SIZE と領域サイズが最大オブジェクトに足りるか","ロールバック番号（OTA、設定）を ITS に持っているか"]],
      ["実装環境（15・16 章）",["エントロピー源（TRNG）が接続され、健全性テストがあるか","PSA_WANT_* が使う機能を過不足なく宣言しているか（_GENERATE / _EXPORT）","TF-M: 渡すバッファが NSPE の RAM か。フラッシュ定数を直接渡していないか","TF-M: RTOS のロック（tfm_ns_interface_dispatch）を実装したか","TF-M: CRYPTO_ENGINE_BUF_SIZE が RSA / 大きな AEAD に足りるか","<b>テスト用 IAK と MCUboot 鍵を差し替えた</b>か","ITS の置き場所（フラッシュ読み出し保護、セキュア側）を確認したか","割り込みハンドラから PSA を呼んでいないか"]],
      ["運用（14・17 章）",["OTA でバージョン比較（ロールバック防止）があるか","アテステーションの検証側で署名・nonce・lifecycle・許可リストを確認するか","鍵の更新手順と、更新中の電源断時の状態が決まっているか","復号・検証失敗時の動作（ログ・拒否・初期化）が決まっているか","フラッシュを丸ごと読まれたとき何が漏れるかを列挙したか"]]
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var bAll=button(bar,"すべてチェック"), bNone=button(bar,"すべて外す");
    var pn=panel(el), out=readout(el);
    var state=[], html="";
    DATA.forEach(function(sec,si){
      html+='<div style="margin:'+(si?".85rem":"0")+' 0 .3rem;color:var(--signal);font-weight:600">'+sec[0]+'</div>';
      sec[1].forEach(function(it){state.push(false);
        html+='<label data-i="'+(state.length-1)+'" style="display:flex;gap:.5rem;align-items:flex-start;padding:.16rem 0;cursor:pointer;line-height:1.5"><input type="checkbox" style="flex:none;margin:.25rem 0 0;accent-color:var(--signal)"><span>'+it+'</span></label>';});
    });
    pn.innerHTML=html;
    var boxesEl=pn.querySelectorAll("label[data-i]");
    function refresh(){
      var n=state.filter(Boolean).length,N=state.length;
      boxesEl.forEach(function(l){var i=+l.getAttribute("data-i");l.style.opacity=state[i]?".5":"1";l.querySelector("span").style.textDecoration=state[i]?"line-through":"none";});
      var pct=Math.round(n/N*100);
      out.innerHTML='<div style="height:8px;border-radius:5px;background:var(--panel);overflow:hidden;margin:.1rem 0 .5rem"><div style="height:100%;width:'+pct+'%;background:var(--signal);border-radius:5px"></div></div>'+
        "<b>"+n+" / "+N+"</b> 項目を確認済み（"+pct+" %）"+(n===N?' <b class="ok">— 出荷してよい</b>':'<br>残り '+(N-n)+' 項目。<b>動くが安全でない失敗は、エラーコードでは見つからない</b>（18 章 2 節）');
    }
    boxesEl.forEach(function(l){var i=+l.getAttribute("data-i"),inp=l.querySelector("input");inp.addEventListener("change",function(){state[i]=inp.checked;refresh();});});
    function setAll(v){boxesEl.forEach(function(l){var i=+l.getAttribute("data-i");state[i]=v;l.querySelector("input").checked=v;});refresh();}
    bAll.addEventListener("click",function(){setAll(true);});bNone.addEventListener("click",function(){setAll(false);});refresh();
  };

  function init(){
    document.querySelectorAll("[data-widget]").forEach(function(el){
      if(el.dataset.done)return; el.dataset.done="1";
      var fn=REG[el.getAttribute("data-widget")];
      if(fn){try{fn(el);}catch(e){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: '+esc(e.message)+'</div>';}}
    });
    requestAnimationFrame(redrawAll);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
