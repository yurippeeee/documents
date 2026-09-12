/* バイナリ解析編 — 章内インタラクティブ部品 */
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

  /* ---- バイナリ解析 向け共通部品 ---- */
  function xxdview(bytes, base, groups){
    // 16 進 + ASCII のダンプ表示。groups=[{s,e,c,label}] で範囲に色
    base = base||0;
    function col(i){ if(groups) for(var g=0;g<groups.length;g++) if(i>=groups[g].s&&i<groups[g].e) return groups[g].c; return "var(--ink)"; }
    var out='<div style="font-family:var(--mono);font-size:.78rem;line-height:1.55;overflow-x:auto">';
    for(var off=0; off<bytes.length; off+=16){
      var h='', a='';
      for(var i=0;i<16;i++){
        if(off+i<bytes.length){var v=bytes[off+i], c=col(off+i);
          h+='<span style="color:'+c+'">'+("0"+v.toString(16)).slice(-2)+'</span> ';
          a+='<span style="color:'+c+'">'+((v>=0x20&&v<0x7f)?esc(String.fromCharCode(v)):'.')+'</span>';
        } else { h+='   '; a+=' '; }
        if(i===7) h+=' ';
      }
      out+='<span style="color:var(--faint)">'+("0000000"+(base+off).toString(16)).slice(-8)+'</span>  '+h+' '+a+'<br>';
    }
    return out+'</div>';
  }
  function u32le(b,o){return (b[o]|(b[o+1]<<8)|(b[o+2]<<16)|(b[o+3]<<24))>>>0;}
  function u32be(b,o){return ((b[o]<<24)|(b[o+1]<<16)|(b[o+2]<<8)|b[o+3])>>>0;}
  function u16le(b,o){return b[o]|(b[o+1]<<8);}
  function h8(v){return "0x"+("0000000"+(v>>>0).toString(16)).slice(-8);}
  function crc32(bytes){
    var c, crc=0xFFFFFFFF;
    for(var i=0;i<bytes.length;i++){ c=(crc^bytes[i])&0xFF;
      for(var k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);
      crc=(crc>>>8)^c; }
    return (crc^0xFFFFFFFF)>>>0;
  }
  function entropy(bytes){
    if(!bytes.length) return 0;
    var f=new Array(256).fill(0), i;
    for(i=0;i<bytes.length;i++) f[bytes[i]]++;
    var h=0; for(i=0;i<256;i++){ if(f[i]){ var p=f[i]/bytes.length; h-=p*Math.log2(p); } }
    return h;
  }
  var GOOD='<b class="ok">OK</b>', BAD=function(t){return '<b style="color:var(--alias)">'+t+'</b>';};

  /* ============ 01. workflow ============ */
  REG.workflow=function(el){
    head(el,"DEMO","ダンプを手にしてからの 5 手順");
    var STEPS=[
      ["① 固定","証拠を固定する","ダンプの SHA-256 を記録し、原本を読み取り専用に。由来（機器・アドレス範囲・方法・日時）を記録。以後はコピーで作業","sha256sum dump.bin > dump.bin.sha256\nchmod 444 dump.bin ; cp dump.bin work.bin"],
      ["② 眺める","全体を眺める","サイズはフラッシュ容量と一致するか。エントロピー・文字列・マジックで粗く分類","binwalk -E work.bin\nstrings -n 8 work.bin | head\nbinwalk work.bin"],
      ["③ 地図","メモリマップを描く","アドレス範囲ごとに「何が入っているか」の表を作る。粗くてよい。チップのリファレンスマニュアルとリンカスクリプトが手がかり","0x00000  Bootloader\n0x08000  Application (MCUboot)\n0x78000  Config (NVM3/NVS)"],
      ["④ 解く","対象ごとに構造を解く","各領域を本編の該当章の手順で。まず公式ツール（commander / imgtool / littlefs-python）を試し、なければ手動","imgtool dumpinfo slot0.bin\ncommander nvm3 parse cfg.bin"],
      ["⑤ 記録","記録し再現可能に","構造を表と図に。スクリプトを保存し、同じ入力から同じ結果が出るか確認。分からなかったことも書く","parse.py + memmap.md + notes"]
    ];
    var bar=mk("div","btns");el.appendChild(bar);
    var btns=STEPS.map(function(s){return button(bar,s[0]);});
    var pn=panel(el,150), out=readout(el);
    function show(i){
      var s=STEPS[i];
      btns.forEach(function(b,j){b.setAttribute("aria-pressed",j===i?"true":"false");});
      pn.innerHTML='<div style="color:var(--signal);font-weight:600;font-size:1rem">'+s[0]+' '+s[1]+'</div>'+
        '<div style="margin:.4rem 0 .5rem;line-height:1.6">'+s[2]+'</div>'+
        '<pre style="margin:0;white-space:pre-wrap;background:var(--panel);padding:.5rem .6rem;border-radius:7px;border:1px solid var(--line)">'+esc(s[3])+'</pre>';
      out.innerHTML=(i<4?'次: '+STEPS[i+1][1]:'<b class="ok">対象が変わっても、この 5 手順は同じ。</b>まず既知の形式と公式ツールを試す（ライブラリのソースが最強の仕様書）');
    }
    btns.forEach(function(b,i){b.addEventListener("click",function(){show(i);});});show(0);
  };

  /* ============ 02. tools ============ */
  REG.tools=function(el){
    head(el,"DEMO","やりたいことから、道具とコマンドを引く");
    var DATA=[
      ["先頭の 32 ビット値を読む（ベクタテーブル・ポインタ・長さ）","眺める","xxd -e -g4 -l 64 work.bin","リトルエンディアンの 4 バイトごとに表示。バイト順のままだと 0x20000400 が 00 04 00 20 に見える"],
      ["読める文字列を拾う（バージョン・ライブラリ名・パス）","拾う","strings -n 8 -t x work.bin","-t x でオフセット付き。UTF-16 は -e l"],
      ["既知の形式の位置を全部探す","拾う","binwalk work.bin","ELF・圧縮・FS のマジックを一覧。マイコン固有形式（NVM3・ベクタ）は検出しない"],
      ["領域ごとの中身の種類を粗く分ける","測る","binwalk -E work.bin","エントロピーのグラフ。コード ~6、圧縮/暗号 ~8、空き 0"],
      ["2 つのダンプの違いを見る","測る","cmp -l a.bin b.bin | wc -l  /  radiff2 a.bin b.bin","違うバイト数と位置。radiff2 は 16 進で見やすい"],
      ["ELF のセクション・シンボルを見る","解く（形式）","readelf -S fw.elf ; nm -n fw.elf","セクション一覧とアドレス順のシンボル"],
      ["HEX/BIN を相互変換する","解く（形式）","srec_cat fw.hex -intel -o fw.bin -binary","BIN→HEX は -offset で焼く先頭アドレスを必ず指定"],
      ["MCUboot イメージを読む","解く（形式）","imgtool dumpinfo slot0.bin","ヘッダと TLV を一覧"],
      ["生バイナリを逆アセンブルする","解く（コード）","Ghidra（ARM Cortex / ロードアドレス指定）","シンボルなしなら文字列・周辺レジスタから入る"],
      ["実機のフラッシュ・RAM を読む","動かす／取る","pyocd cmd -t <target> → savemem  /  esptool.py read_flash","4 章。読み出し保護に注意"],
      ["自分でパーサを書く","作る","python -c 'import struct; ...'  /  construct  /  Kaitai","固定は struct、可変は construct、多言語+可視化は Kaitai"]
    ];
    var row=ctrls(el);
    var inp=textin(row,"やりたいこと（キーワード）","","100%");
    var pn=panel(el), out=readout(el);
    function render(q){
      q=(q||"").toLowerCase();
      var rows=DATA.filter(function(d){return !q || (d[0]+d[1]+d[2]+d[3]).toLowerCase().indexOf(q)>=0;});
      pn.innerHTML=tbl(["やりたいこと","分類","コマンド"],rows.map(function(d){
        return ['<span style="cursor:pointer" data-i="'+DATA.indexOf(d)+'">'+d[0]+'</span>',
          '<span style="color:var(--muted)">'+d[1]+'</span>',
          '<code style="font-size:.8rem">'+esc(d[2])+'</code>'];}));
      pn.querySelectorAll("[data-i]").forEach(function(e){e.addEventListener("click",function(){
        var d=DATA[+e.getAttribute("data-i")];
        out.innerHTML='<b>'+d[0]+'</b>（'+d[1]+'）<br><code>'+esc(d[2])+'</code><br><span style="color:var(--muted)">'+d[3]+'</span>';});});
    }
    inp.addEventListener("input",function(){render(inp.value);});
    render("");
    out.innerHTML='基本の 4 つ = <b>hexdump（xxd -e -g4）・strings・binwalk・Python の struct</b>。表の項目をクリックで詳細';
  };

  /* ============ 03. interp ============ */
  REG.interp=function(el){
    head(el,"DEMO","同じ 4 バイトを、型とエンディアンを変えて解釈する");
    var row=ctrls(el);
    var inp=textin(row,"4 バイト（16 進、空白区切り）","00 04 00 20","100%");
    var pn=panel(el), out=readout(el);
    function parse(){
      var parts=(inp.value.match(/[0-9a-fA-F]{2}/g)||[]).slice(0,8);
      var b=new Uint8Array(parts.map(function(h){return parseInt(h,16);}));
      if(b.length<1){pn.innerHTML='<span style="color:var(--faint)">16 進を入れる</span>';out.innerHTML='';return;}
      var rows=[];
      if(b.length>=1) rows.push(["u8 / i8", b[0]+" / "+(b[0]>127?b[0]-256:b[0])]);
      if(b.length>=2){ rows.push(["u16 LE", u16le(b,0)+"  (0x"+u16le(b,0).toString(16)+")"]); rows.push(["u16 BE", ((b[0]<<8)|b[1])+"  (0x"+((b[0]<<8)|b[1]).toString(16)+")"]); }
      if(b.length>=4){
        var le=u32le(b,0), be=u32be(b,0);
        rows.push(["u32 LE", le+"  ("+h8(le)+")"]);
        rows.push(["u32 BE", be+"  ("+h8(be)+")"]);
        rows.push(["i32 LE", (le>0x7fffffff?le-0x100000000:le)]);
        var asc=""; for(var i=0;i<b.length;i++) asc+=(b[i]>=0x20&&b[i]<0x7f)?String.fromCharCode(b[i]):".";
        rows.push(["ASCII", esc(asc)]);
        // タイムスタンプ推定
        if(le>=0x50000000&&le<=0x80000000){ var dt=new Date(le*1000); rows.push(["Unix秒 (LE) の推定", dt.toISOString().slice(0,19)+" UTC"]); }
      }
      // 判定コメント
      var note=[];
      if(b.length>=4){
        var le2=u32le(b,0);
        if(le2===0xFFFFFFFF) note.push("FF FF FF FF = 消去済みフラッシュのことが多い（数値の 4294967295 ではない）");
        else if((le2>=0x20000000&&le2<0x20080000)) note.push("0x2000xxxx = RAM 範囲。ベクタテーブルの先頭なら MSP（初期スタックポインタ）");
        else if((le2>=0x08000000&&le2<0x08200000)) note.push("0x0800xxxx = フラッシュ範囲。"+(le2&1?"奇数 → Thumb ビット付き。ハンドラ/戻りアドレスの候補（実コードは -1）":"偶数"));
        else if((le2>=0x40000000&&le2<0x50000000)) note.push("0x4000xxxx = 周辺レジスタのアドレス（リテラルプール）");
        else if(le2<0x10000&&le2>0) note.push("小さな正の整数 → 長さ・カウンタ・バージョンらしい。LE の解釈が妥当");
      }
      pn.innerHTML=tbl(["解釈","値"],rows,["left","left"]);
      out.innerHTML=note.length?note.map(function(n){return '<div>'+n+'</div>';}).join(""):
        '同じバイトでも型とエンディアンで全く違う値になる。「小さな正の整数になるほう」が正しいエンディアンのことが多い';
    }
    inp.addEventListener("input",parse);
    // プリセット
    var bar=mk("div","btns");el.appendChild(bar);
    [["00 04 00 20","MSP らしい"],["c5 81 00 08","Reset らしい"],["ff ff ff ff","消去済み"],["2a 00 00 00","小さな整数"],["00 80 b0 65","Unix秒"]].forEach(function(p){
      var b=button(bar,p[1]);b.addEventListener("click",function(){inp.value=p[0];parse();});});
    parse();
  };

  /* ============ 04. acquire ============ */
  REG.acquire=function(el){
    head(el,"DEMO","状況から吸い出しの経路を選ぶ");
    var row=ctrls(el);
    var q1=select(row,"デバッグ端子（SWD/JTAG）は",["基板に露出している","ない/塞がれている","不明"]);
    var q2=select(row,"読み出し保護は",["無効（開発機）","有効（量産）","不明"]);
    var q3=select(row,"対象",["内蔵フラッシュ/RAM","外付け SPI フラッシュ","もう .bin/.elf がある"]);
    var pn=panel(el), out=readout(el);
    function advise(){
      var a=[], warn=[];
      if(+q3.value===2){ a.push(["ファイルがある","吸い出し不要。5〜6 章（ELF/HEX）や 8 章（イメージ）へ直行。エミュレータ（QEMU/Renode）で動かす手もある（17 章）"]); }
      else if(+q3.value===1){ a.push(["SPI 直読み","SOIC8 クリップ + CH341A/FT2232 + flashrom。基板に載ったまま読めることが多い。電源競合で失敗したら取り外す","flashrom -p ch341a_spi -r spiflash.bin"]); }
      else {
        if(+q1.value===0){ a.push(["デバッグポート","OpenOCD / pyOCD / J-Link で内蔵フラッシュ・RAM を読む","pyocd cmd -t <target>\n> savemem 0x08000000 0x200000 flash.bin"]); }
        else { a.push(["ブートローダ / ISP","端子がなければ ROM ブートローダ経由（UART/USB）","esptool.py read_flash 0 ALL flash.bin\nstm32flash / dfu-util"]); }
      }
      if(+q2.value===1){ warn.push("読み出し保護が有効 → フラッシュは 0x00/0xFF が返るか接続拒否。これは設計どおりの安全機構。正規手段で読むにはレベル下げ（全消去を伴い中身は失われる）が必要"); }
      if(+q2.value===2){ warn.push("保護が不明なら、まず読んでみて全部 0/0xFF なら保護を疑う"); }
      pn.innerHTML=a.map(function(x){return '<div style="color:var(--signal);font-weight:600">'+x[0]+'</div><div style="margin:.2rem 0 .5rem">'+x[1]+'</div>'+
        (x[2]?'<pre style="margin:0 0 .5rem;white-space:pre-wrap;background:var(--panel);padding:.4rem .6rem;border-radius:7px;border:1px solid var(--line)">'+esc(x[2])+'</pre>':'');}).join("");
      out.innerHTML=(warn.length?warn.map(function(w){return '<div style="color:var(--alias)">⚠ '+w+'</div>';}).join(""):'')+
        '<div style="color:var(--muted);margin-top:.3rem">吸い出したら 2 回読んで比較・サイズ確認・先頭がベクタテーブルか。オフセット 0 が実機のどのアドレスかを記録する</div>';
    }
    [q1,q2,q3].forEach(function(s){s.addEventListener("change",advise);});advise();
  };

  /* ============ 05. elf ============ */
  REG.elf=function(el){
    head(el,"DEMO","ELF から実機イメージへ — 何が残り、何が捨てられるか");
    var SEC=[
      [".isr_vector","ベクタテーブル","フラッシュ","load",1],
      [".text","プログラムのコード","フラッシュ","load",1],
      [".rodata","読み取り専用データ・文字列","フラッシュ","load",1],
      [".data","初期値のある変数","値はフラッシュ→RAM にコピー","load",1],
      [".bss","初期値ゼロの変数","RAM（起動時 0 埋め）","nobits",0],
      [".symtab / .strtab","シンボル表（名前とアドレス）","ファイルのみ","info",0],
      [".debug_info","デバッグ情報（DWARF）","ファイルのみ","info",0],
      [".comment","コンパイラの版","ファイルのみ","info",0]
    ];
    var row=ctrls(el);
    var mode=select(row,"変換",["ELF そのまま","objcopy -O binary → .bin","strip 済み ELF"]);
    var pn=panel(el), out=readout(el);
    function render(){
      var m=+mode.value;
      pn.innerHTML=tbl(["セクション","内容","実機での置き場所","状態"],SEC.map(function(s){
        var kept = m===0 ? true : m===1 ? (s[3]==="load") : (s[3]!=="info");
        var style = kept?"":"opacity:.4;text-decoration:line-through";
        return ['<span style="'+style+'"><code>'+s[0]+'</code></span>',
          '<span style="'+style+'">'+s[1]+'</span>',
          '<span style="'+style+';color:var(--muted)">'+s[2]+'</span>',
          kept?'<span style="color:var(--signal)">残る</span>':'<span style="color:var(--alias)">捨てる</span>'];
      }));
      out.innerHTML=[
        'ELF は最も情報が多い。コード・データ・<b>シンボル・デバッグ情報</b>を全部含む。readelf -S / nm -n / objdump -d / addr2line が使える',
        'objcopy -O binary は <b>LOAD セグメントの中身だけ</b>を LMA 順に。シンボル・デバッグ情報・.bss を捨てる。<b>だから生バイナリから名前は復元できず、ELF には戻せない</b>（16 章で構造を推定し直す）',
        'strip 済みは <b>シンボルとデバッグ情報がない</b>。アドレスから名前を復元できない。だから<b>シンボル付き ELF をリリースごとに保存</b>するのが鉄則'][m];
    }
    mode.addEventListener("change",render);render();
  };

  /* ============ 06. hex ============ */
  REG.hex=function(el){
    head(el,"DEMO","Intel HEX の 1 行を解剖し、チェックサムを検算する");
    var row=ctrls(el);
    var inp=textin(row,"HEX の 1 行",":10800000000400200C58100088180008838000087A","100%");
    var pn=panel(el), out=readout(el);
    function parse(){
      var s=inp.value.trim();
      if(s[0]!==":"){pn.innerHTML=BAD("先頭は : でなければならない");out.innerHTML='';return;}
      var hexs=s.slice(1).replace(/[^0-9a-fA-F]/g,"");
      if(hexs.length<10 || hexs.length%2){pen("桁数が不正");return;}
      var b=[]; for(var i=0;i<hexs.length;i+=2) b.push(parseInt(hexs.substr(i,2),16));
      var bc=b[0], addr=(b[1]<<8)|b[2], type=b[3], data=b.slice(4,4+bc), cksum=b[4+bc];
      var TYPE={0:"Data",1:"End Of File",2:"Ext Segment Address",4:"Ext Linear Address (上位16bit)",5:"Start Linear Address"};
      var sum=0; for(var j=0;j<b.length;j++) sum=(sum+b[j])&0xFF;
      var okv=(sum===0);
      var rows=[
        [":","行の始まり"],
        ["Byte count","0x"+bc.toString(16)+" = "+bc+" バイト"],
        ["アドレス（下位16bit）","0x"+("000"+addr.toString(16)).slice(-4)+(type===0?"　（上位は直前の 04 レコードで決まる）":"")],
        ["レコード種別","0x0"+type+" = "+(TYPE[type]||"?")],
        ["データ",data.map(function(x){return("0"+x.toString(16)).slice(-2);}).join(" ")||"(なし)"],
        ["チェックサム","0x"+("0"+cksum.toString(16)).slice(-2)]
      ];
      pn.innerHTML=tbl(["部分","値"],rows,["left","left"]);
      out.innerHTML='チェックサム検算: : を除く全バイトの和 = 0x'+sum.toString(16)+' → '+(okv?GOOD+'（和が 0 mod 256）':BAD("不一致（壊れた行）"))+
        (type===4?'<br><b>04 レコード</b>: 以降のデータ行の実アドレスは 0x'+((data[0]<<8)|data[1]).toString(16)+'0000 + 下位16bit':
         type===0?'<br>この行は '+bc+' バイトを、実アドレス（上位16bit ∥ 0x'+("000"+addr.toString(16)).slice(-4)+'）に書く':'');
      function pen(m){pn.innerHTML=BAD(m);out.innerHTML='';}
    }
    inp.addEventListener("input",parse);
    var bar=mk("div","btns");el.appendChild(bar);
    [[":020000040800F2","04: 上位アドレス 0x0800"],[":10800000000400200C58100088180008838000087A","データ行"],[":00000001FF","EOF"],[":108000000004002000000000000000000000000068","壊す例（末尾変更）"]].forEach(function(p){
      var x=button(bar,p[1]);x.addEventListener("click",function(){inp.value=p[0];parse();});});
    parse();
  };

  /* ============ 07. vectors ============ */
  REG.vectors=function(el){
    head(el,"DEMO","ベクタテーブルを読み、Cortex-M か判定してロードアドレスを推定する");
    var row=ctrls(el);
    var inp=textin(row,"先頭 32 バイト（16 進）","00 04 00 20 c5 81 00 08 81 81 00 08 83 81 00 08 85 81 00 08 87 81 00 08 89 81 00 08 01 a2 00 08","100%");
    var pn=panel(el), out=readout(el);
    function parse(){
      var b=(inp.value.match(/[0-9a-fA-F]{2}/g)||[]).map(function(h){return parseInt(h,16);});
      if(b.length<8){pn.innerHTML=BAD("最低 8 バイト");out.innerHTML='';return;}
      var a=new Uint8Array(b);
      var words=[]; for(var i=0;i+4<=a.length;i+=4) words.push(u32le(a,i));
      var NAMES=["MSP（初期スタックポインタ）","Reset","NMI","HardFault","MemManage","BusFault","UsageFault","Reserved"];
      var rows=words.map(function(w,i){
        var kind = (w>=0x20000000&&w<0x20080000)?"<span style='color:var(--blue)'>RAM 範囲</span>":
          (w>=0x08000000&&w<0x08200000)?"<span style='color:var(--signal)'>フラッシュ範囲"+(w&1?"・奇数(Thumb)":"")+"</span>":
          (w===0?"<span style='color:var(--muted)'>予約/0</span>":"<span style='color:var(--muted)'>?</span>");
        return ["+0x"+("0"+(i*4).toString(16)).slice(-2), NAMES[i]||("IRQ "+(i-16)), h8(w), kind];
      });
      pn.innerHTML=tbl(["offset","ベクタ","値","判定"],rows,["left","left","left","left"]);
      var msp=words[0], reset=words[1];
      var isCM = (msp>=0x20000000&&msp<0x20080000) && (reset>=0x08000000&&reset<0x08200000) && (reset&1);
      if(isCM){
        var codeAddr=reset&~1;
        var load=(reset&0xFFFF0000)>>>0;
        out.innerHTML='<b class="ok">Cortex-M イメージと判定。</b>オフセット 0 が RAM 範囲の MSP（'+h8(msp)+'）、オフセット 4 がフラッシュ範囲・奇数のリセットハンドラ。'+
          '<br>リセットの実コードは '+h8(codeAddr)+'（Thumb ビットを落とす）。<b>推定ロードアドレス ≈ '+h8(load)+'</b>（リセットの上位から）。ファイル内オフセット = アドレス − ロードアドレス';
      } else {
        out.innerHTML='Cortex-M の条件を満たさない。オフセット 0 が RAM 範囲、オフセット 4 がフラッシュ範囲・奇数、が決め手。'+
          (msp<0x20000000||msp>=0x20080000?'<br>先頭が RAM 範囲でない → 別アーキor別オフセット':'')+
          (!(reset&1)?'<br>オフセット 4 が偶数 → Thumb ビットがない':'');
      }
    }
    inp.addEventListener("input",parse);parse();
  };

  /* ============ 08. mcuboot ============ */
  REG.mcuboot=function(el){
    head(el,"DEMO","MCUboot イメージのヘッダとスロット状態を読む");
    var row=ctrls(el);
    var okstate=select(row,"slot1 の状態",["image ok がセット済み（確認済み）","image ok が未セット（テスト起動中）","boot magic が消去済み（空スロット）"]);
    var hashm=checkbox(row,"アプリ本体を 1 バイト改ざんする",false);
    var pn=panel(el), out=readout(el);
    // 疑似ヘッダを組み立て
    function build(){
      var hdr=new Uint8Array(32);
      var dv=new DataView(hdr.buffer);
      dv.setUint32(0,0x96f3b83d,true);   // magic
      dv.setUint16(8,32,true);            // hdr_size
      dv.setUint32(12,0x1D000,true);      // img_size
      dv.setUint8(20,1); dv.setUint8(21,2); dv.setUint16(22,0,true); dv.setUint32(24,45,true); // v1.2.0+45
      return hdr;
    }
    function render(){
      var h=build();
      var magic=u32le(h,0), hdr=u16le(h,8), img=u32le(h,12);
      var vmaj=h[20],vmin=h[21],vrev=u16le(h,22),vbuild=u32le(h,24);
      var body=new Uint8Array(64); for(var i=0;i<64;i++) body[i]=(i*7+3)&0xFF;
      if(hashm.checked) body[10]^=1;
      var digest=sha256(body);
      var stored=sha256(new Uint8Array(64).map(function(_,i){return (i*7+3)&0xFF;}));
      var hashok=hex(digest)===hex(stored);
      pn.innerHTML=
        '<div style="color:var(--signal);font-weight:600">イメージヘッダ（先頭 32 バイト）</div>'+
        xxdview(h,0,[{s:0,e:4,c:"var(--signal)"},{s:8,e:10,c:"var(--blue)"},{s:12,e:16,c:"var(--blue)"},{s:20,e:28,c:"var(--muted)"}])+
        tbl(["フィールド","値"],[
          ["ih_magic",h8(magic)+(magic===0x96f3b83d?' '+GOOD:' '+BAD("違う"))],
          ["ih_hdr_size",hdr+" バイト（アプリ本体はこの後ろ = ベクタテーブルの起点）"],
          ["ih_img_size",img+" バイト（0x"+img.toString(16)+"）"],
          ["ih_ver",vmaj+"."+vmin+"."+vrev+"+"+vbuild]
        ],["left","left"])+
        '<div style="color:var(--signal);font-weight:600;margin-top:.5rem">TLV トレーラ</div>'+
        '<div style="font-family:var(--mono);font-size:.8rem">0x10 SHA256: '+hex(digest).slice(0,32)+'…  '+(hashok?GOOD:BAD("本体と不一致 = 改ざん or 破損"))+'</div>';
      var st=+okstate.value;
      var boot = st===2 ? BAD("boot magic 消去済み → 空スロット。更新イメージが書かれていない") :
        st===1 ? '<b style="color:var(--alias)">image ok 未セット</b> → テスト起動中。次の再起動で前スロットに戻る（ロールバック）。アプリの「自己確認」処理が呼ばれているか（ケース A）' :
        '<b class="ok">image ok セット済み</b> → このスロットは有効・確認済み';
      out.innerHTML='<b>マジックは 0x96f3b83d。</b>アプリのベクタテーブルは「スロット先頭 + '+hdr+'」から始まる（7 章と組み合わせる）。'+
        '<br>スロット状態: '+boot+
        (hashm.checked?'<br>'+BAD("本体を改ざんしたので TLV の SHA-256 と一致しない → ブートローダは起動を拒否"):'');
    }
    okstate.addEventListener("change",render);hashm.addEventListener("change",render);render();
  };

  /* ============ 09. fs ============ */
  REG.fs=function(el){
    head(el,"DEMO","先頭バイトとマジックからファイルシステムを見分ける");
    var FS=[
      ["FAT16/32","EB 3C 90 ... 55 AA","SD/USB/大きめ外付け","mtools / 7z / マウント（-i fs.bin@@<offset>）"],
      ["LittleFS","... 'littlefs' 文字列","マイコン内蔵/外付け","littlefs-python（block_size/block_count を機器に合わせる）/ littlefs-fuse"],
      ["SPIFFS","明確なマジックなし・規則的な索引","古い ESP8266/ESP32","mkspiffs（page/block サイズを合わせる）"],
      ["squashfs","hsqs / sqsh","読み取り専用ルート（Linux）","unsquashfs"],
      ["JFFS2","85 19（0x1985）","古い NOR Linux","jefferson"],
      ["UBI/UBIFS","UBI# (23 49 42 55)","NAND Linux","ubireader_extract_files"]
    ];
    var row=ctrls(el);
    var inp=textin(row,"先頭バイト（16 進）または含まれる文字列","68 73 71 73","100%");
    var pn=panel(el), out=readout(el);
    function detect(){
      var s=inp.value.toLowerCase();
      var bytes=(s.match(/[0-9a-f]{2}/g)||[]).map(function(h){return parseInt(h,16);});
      var asc=String.fromCharCode.apply(null,bytes.filter(function(x){return x>=0x20&&x<0x7f;}));
      var found=null;
      if(bytes[0]===0xEB||bytes[0]===0xE9||(bytes.length>=2&&bytes[510]===0x55)) found="FAT16/32";
      else if(/hsqs|sqsh|68 73 71 73/.test(s)||asc.indexOf("hsqs")>=0) found="squashfs";
      else if(bytes[0]===0x85&&bytes[1]===0x19) found="JFFS2";
      else if(asc.indexOf("UBI#")>=0||(bytes[0]===0x55&&bytes[3]===0x23)) found="UBI/UBIFS";
      else if(s.indexOf("littlefs")>=0||asc.indexOf("littlefs")>=0) found="LittleFS";
      pn.innerHTML=tbl(["FS","目印","用途","取り出し"],FS.map(function(f){
        var hit=f[0]===found;
        return ['<span style="'+(hit?"color:var(--signal);font-weight:600":"")+'">'+f[0]+'</span>',
          '<code style="font-size:.78rem">'+esc(f[1])+'</code>',
          '<span style="color:var(--muted)">'+f[2]+'</span>',
          '<span style="font-size:.85rem'+(hit?";color:var(--signal)":"")+'">'+esc(f[3])+'</span>'];}));
      out.innerHTML=found?'<b class="ok">'+found+' と判定。</b>フラッシュ FS はブロックサイズ・領域オフセットが分からないと読めない。ソース・データシート・繰り返し境界から求める':
        'マジックが一致しない。まず binwalk / strings で目印を探す。先頭 55 AA と EB/E9 なら FAT、"littlefs" 文字列なら LittleFS';
    }
    inp.addEventListener("input",detect);
    var bar=mk("div","btns");el.appendChild(bar);
    [["68 73 71 73","hsqs"],["eb 3c 90 4d 53 44 4f 53","FAT"],["6c 69 74 74 6c 65 66 73","littlefs"],["85 19 00 00","JFFS2"]].forEach(function(p){
      var x=button(bar,p[1]);x.addEventListener("click",function(){inp.value=p[0];detect();});});
    detect();
  };

  /* ============ 10. nvm3 — 追記型から最新値を復元 ============ */
  function kvDemo(el, opts){
    // 汎用: 追記型キー値ストアのオブジェクト列 → 最新値
    head(el,"DEMO",opts.title);
    var pn=panel(el,110), out=readout(el);
    var bar=mk("div","btns");el.appendChild(bar);
    var log=opts.records.slice(); // [{gen,key,op,val}]
    var showHist=checkbox(ctrls(el),"古い版（履歴）も表示する",false);
    function render(){
      // 物理順に表示
      pn.innerHTML='<div style="color:var(--signal);font-weight:600">'+opts.storeName+' の中身（フラッシュ上の物理順）</div>'+
        tbl(["#","世代","キー","操作","値"],log.map(function(r,i){
          return [i, r.gen, opts.keyfmt(r.key), r.op==="del"?'<span style="color:var(--alias)">削除マーカ</span>':"set", r.op==="del"?"—":esc(r.val)];
        }),["right","right","left","left","left"]);
      // 最新値を計算: 同じキーは後（大きい gen、後ろの物理位置）を優先
      var latest={};
      log.forEach(function(r){ latest[r.key]={op:r.op,val:r.val,gen:r.gen}; });
      var keys=Object.keys(latest);
      var active=keys.filter(function(k){return latest[k].op!=="del";});
      var deleted=keys.filter(function(k){return latest[k].op==="del";});
      var histCount=log.length-keys.length;
      out.innerHTML='<b>有効な最新値</b>（同じキーは後に書かれたものを採用）:<br>'+
        active.map(function(k){return '<code>'+opts.keyfmt(k)+'</code> = <b>'+esc(latest[k].val)+'</b>';}).join("　")+
        (deleted.length?'<br><span style="color:var(--muted)">削除済み: '+deleted.map(opts.keyfmt).join(", ")+'</span>':'')+
        (showHist.checked?'<br><b style="color:var(--alias)">履歴に残る古い版が '+histCount+' 件</b>（追記型なので消えていない。過去の値・削除したはずのデータが読める → 障害解析の宝、監査の危険。13 章）':
          '<br><span style="color:var(--muted)">追記型なので古い版が '+histCount+' 件フラッシュに残っている（「履歴も表示」で確認）</span>');
    }
    function addUpdate(){
      var k=opts.keys[Math.floor(Math.random()*opts.keys.length)];
      var g=Math.max.apply(null,log.map(function(r){return r.gen;}))+ (Math.random()<0.3?1:0);
      log.push({gen:g,key:k,op:"set",val:opts.mkval(k)});
      render();
    }
    var b1=button(bar,"設定を 1 つ更新（追記）"); b1.addEventListener("click",addUpdate);
    var b2=button(bar,"あるキーを削除"); b2.addEventListener("click",function(){
      var actives=log.filter(function(r){return r.op!=="del";}).map(function(r){return r.key;});
      if(actives.length){ var k=actives[actives.length-1]; log.push({gen:log[log.length-1].gen,key:k,op:"del",val:""}); render(); }});
    showHist.addEventListener("change",render);
    render();
  }
  REG.nvm3=function(el){
    kvDemo(el,{title:"NVM3 の追記型ストレージから最新値を復元する", storeName:"NVM3",
      keyfmt:function(k){return "0x"+(+k).toString(16).toUpperCase();},
      keys:[0x4001,0x4002,0xA010], keyfmt2:null,
      mkval:function(k){return k===0x4001?("txpower="+(5+Math.floor(Math.random()*15))):("val"+Math.floor(Math.random()*100));},
      records:[{gen:1,key:0x4001,op:"set",val:"txpower=10"},{gen:1,key:0x4002,op:"set",val:"channel=15"},
               {gen:1,key:0x4001,op:"set",val:"txpower=12"},{gen:2,key:0xA010,op:"set",val:"netkey=..."},{gen:2,key:0x4001,op:"set",val:"txpower=15"}]});
  };

  /* ============ 11. kvstore — 共通パターン ============ */
  REG.kvstore=function(el){
    head(el,"DEMO","追記型キー値ストアの共通パターン — 3 実装を同じ型で");
    var row=ctrls(el);
    var sel=select(row,"実装",["NVM3（Silicon Labs）","ESP-IDF NVS","Zephyr NVS"]);
    var pn=panel(el), out=readout(el);
    var TAB=[
      ["区画を分ける単位","ページ（消去ブロック）","4 KB ページ","セクタ"],
      ["世代の順序","消去カウンタ","ページのシーケンス番号","ATE の並び順（後方から）"],
      ["キー","20 ビット番号","Namespace + 文字列","16 ビット ID"],
      ["エントリの状態","型 / 削除マーカ","状態ビットマップ","ATE の有無・CRC"],
      ["最新版の決定","後に書かれたもの","後に書かれたもの","後の ATE"]
    ];
    function render(){
      var c=+sel.value+1;
      pn.innerHTML=tbl(["共通の 5 部品","NVM3","ESP-IDF NVS","Zephyr NVS"],TAB.map(function(r){
        return [ '<b>'+r[0]+'</b>',
          '<span style="'+(c===1?"color:var(--signal);font-weight:600":"")+'">'+r[1]+'</span>',
          '<span style="'+(c===2?"color:var(--signal);font-weight:600":"")+'">'+r[2]+'</span>',
          '<span style="'+(c===3?"color:var(--signal);font-weight:600":"")+'">'+r[3]+'</span>'];}));
      out.innerHTML='<b>共通の 5 手順:</b> ① 区画を消去ブロックに区切る → ② 各ブロックの世代番号で新旧を並べる → ③ 有効なエントリを拾う（消去済みは飛ばす）→ ④ 同じキーは最新世代を採用 → ⑤ 値の型に従い解釈（3 章）。'+
        '<br>この型を覚えると、初見の独自ストアも読める。ソース（'+["nvm3_*.c","nvs のパーサ","subsys/fs/nvs/nvs.c"][+sel.value]+'）が仕様書';
    }
    sel.addEventListener("change",render);render();
  };

  /* ============ 12. ring — リングバッファを時系列に戻す ============ */
  REG.ring=function(el){
    head(el,"DEMO","リングバッファの物理順を、シーケンス番号で時系列に戻す");
    var N=6, cap=8;
    var events=["boot","wifi connect","sensor read","config save","low battery","error 0x12","ota start","reset"];
    // シミュレート: seq 順に書き、cap を超えたら巻き戻る
    var buf=new Array(cap).fill(null);
    var wpos=0, seq=1;
    function write(){ buf[wpos%cap]={seq:seq, t:"00:"+("0"+(10+seq)).slice(-2)+":00", msg:events[(seq-1)%events.length]}; wpos++; seq++; }
    for(var k=0;k<N;k++) write();
    var row=ctrls(el);
    var byseq=checkbox(row,"シーケンス番号でソート（時系列に戻す）",false);
    var pn=panel(el), out=readout(el);
    function render(){
      var physical=buf.map(function(r,i){return {slot:i,r:r};}).filter(function(x){return x.r;});
      var rows=physical.slice();
      var headSlot=wpos%cap;
      if(byseq.checked) rows.sort(function(a,b){return a.r.seq-b.r.seq;});
      pn.innerHTML='<div style="color:var(--signal);font-weight:600">'+(byseq.checked?"シーケンス番号でソート（＝時系列）":"フラッシュ上の物理順（スロット順）")+'</div>'+
        tbl(["スロット","seq","時刻","メッセージ"],rows.map(function(x){
          var isHead=(x.slot===headSlot);
          return ['<span style="'+(isHead?"color:var(--alias)":"")+'">'+x.slot+(isHead?" ← head":"")+'</span>',
            x.r.seq, x.r.t, x.r.msg];}),["right","right","left","left"]);
      out.innerHTML=byseq.checked?'<b class="ok">seq でソートすれば物理位置は無視できる。</b>これが最も確実。head の探索も要らない':
        '物理順 ≠ 時系列。<b style="color:var(--alias)">head（次に書く位置、スロット '+headSlot+'）の後ろが最古、前が最新。</b>seq が急に小さくなる継ぎ目が head。「seq でソート」を押すと時系列に戻る';
    }
    var bar=mk("div","btns");el.appendChild(bar);
    var b=button(bar,"新しいイベントを 1 件書く（巻き戻る）");
    b.addEventListener("click",function(){write();render();});
    byseq.addEventListener("change",render);render();
  };

  /* ============ 13. secrets — 秘密の捜索 ============ */
  REG.secrets=function(el){
    head(el,"DEMO","ダンプ（模擬）から平文の秘密を捜索する — 自己監査");
    var row=ctrls(el);
    var proto=select(row,"読み出し保護",["無効（開発機 / 未設定）","有効（量産）"]);
    var pn=panel(el), out=readout(el);
    // 模擬ダンプ（文字列として）
    var DUMP=[
      {off:0x0100,kind:"code",text:"(機械語・H≈6)"},
      {off:0x1200,kind:"str",text:'FreeRTOS V10.4.3'},
      {off:0x1240,kind:"str",text:'https://api.example.com/v1'},
      {off:0x2000,kind:"pem",text:'-----BEGIN EC PRIVATE KEY-----'},
      {off:0x2400,kind:"cert",text:'-----BEGIN CERTIFICATE-----'},
      {off:0x3100,kind:"token",text:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...'},
      {off:0x3200,kind:"aws",text:'AKIAIOSFODNN7EXAMPLE'},
      {off:0x7800,kind:"nvs_del",text:'ssid_pw (削除マーカ) = "hunter2wifi"'},
      {off:0x9000,kind:"high",text:"(H≈8・32 バイト単位に区切れる)"}
    ];
    function run(){
      var prot=+proto.value===1;
      var findings=[];
      DUMP.forEach(function(d){
        if(d.kind==="pem") findings.push(["秘密鍵（PEM 平文）","0x"+d.off.toString(16),d.text,"critical","strings | grep 'BEGIN .*PRIVATE KEY'"]);
        if(d.kind==="cert") findings.push(["証明書","0x"+d.off.toString(16),d.text,"ok","openssl x509 -text（公開情報。問題なし）"]);
        if(d.kind==="token") findings.push(["JWT トークン","0x"+d.off.toString(16),d.text.slice(0,24)+"…","warn","grep -oE 'eyJ[..].[..].[..]'"]);
        if(d.kind==="aws") findings.push(["AWS アクセスキー","0x"+d.off.toString(16),d.text,"critical","grep -oE 'AKIA[0-9A-Z]{16}'"]);
        if(d.kind==="high") findings.push(["高エントロピー 32 バイト","0x"+d.off.toString(16),d.text,"warn","binwalk -E（鍵の候補。圧縮/暗号かは文脈）"]);
        if(d.kind==="nvs_del") findings.push(["削除済み資格情報が履歴に残存","0x"+d.off.toString(16),d.text,"critical","NVS 全履歴の検査（11 章）"]);
      });
      pn.innerHTML=tbl(["見つかったもの","offset","内容","検出方法"],findings.map(function(f){
        var color={critical:"var(--alias)",warn:"var(--muted)",ok:"var(--signal)"}[f[3]];
        return ['<span style="color:'+color+';font-weight:600">'+f[0]+'</span>','<code>'+f[1]+'</code>',
          '<code style="font-size:.78rem">'+esc(f[2])+'</code>','<span style="font-size:.85rem;color:var(--muted)">'+esc(f[4])+'</span>'];}));
      var crit=findings.filter(function(f){return f[3]==="critical";}).length;
      out.innerHTML=prot?
        '<b>読み出し保護が有効。</b>正規手段ではフラッシュを読めないので、平文の秘密も一定は守られる。だが保護回避（フォールト注入）には無力なので多層防御が望ましい。<br>見つかった秘密は <b>'+crit+' 件</b>——保護が破られたときのために、本来は暗号化かセキュアエレメント（PSA 編 12・13 章）へ':
        '<b style="color:var(--alias)">読み出し保護が無効 → 攻撃者にも同じものが読める。</b>致命的な指摘 '+crit+' 件。'+
        '<br>問題は「見つかったこと」より「<b>読み出せる状態だったこと</b>」。対策は PSA 編・IoT セキュリティ編（フラッシュ暗号化、セキュアエレメント、ストレージの適切な消去）。監査は 19 章でスクリプト化して CI に';
    }
    proto.addEventListener("change",run);run();
  };

  /* ============ 14. entropy ============ */
  REG.entropy=function(el){
    head(el,"DEMO","エントロピーで領域を塗り分け、圧縮と暗号を見分ける");
    var cv=screen(el,220), cc=cctx(cv), pn=panel(el), out=readout(el);
    // 模擬ダンプの区間 [start_kb, H, kind, label]
    var REGIONS=[
      [0,32,6.1,"code","コード（.text）"],
      [32,48,4.2,"str","文字列・データ（.rodata）"],
      [48,64,0.1,"empty","空き（0xFF）"],
      [64,96,7.98,"gzip","gzip 圧縮（1F 8B）"],
      [96,112,7.99,"enc","暗号化（マジックなし）"],
      [112,128,6.0,"code","コード"]
    ];
    var showType=select(ctrls(el),"表示",["エントロピー H","種類で塗り分け"]);
    function draw(){
      var d=cc.fit(),ctx=cc.ctx,w=d.w,h=d.h;ctx.clearRect(0,0,w,h);
      var total=128, x0=40, x1=w-14, y0=h-40, top=20, mode=+showType.value;
      // 軸
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x0,top);ctx.lineTo(x0,y0);ctx.lineTo(x1,y0);ctx.stroke();
      lab(ctx,"H",x0-6,top+4,C("--muted"),"right",10);lab(ctx,"8",x0-6,top+10,C("--faint"),"right",9);lab(ctx,"0",x0-6,y0,C("--faint"),"right",9);
      var COL={code:C("--signal"),str:C("--line"),empty:C("--muted"),gzip:C("--blue"),enc:C("--alias")};
      REGIONS.forEach(function(r){
        var rx0=x0+(r[0]/total)*(x1-x0), rx1=x0+(r[1]/total)*(x1-x0);
        if(mode===0){
          var ry=y0-(r[2]/8)*(y0-top);
          ctx.fillStyle=r[2]>7.5?C("--alias-soft"):r[2]>5?C("--signal-soft"):C("--panel");
          ctx.fillRect(rx0,ry,rx1-rx0-1,y0-ry);
          ctx.strokeStyle=r[2]>7.5?C("--alias"):C("--signal");ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(rx0,ry);ctx.lineTo(rx1,ry);ctx.stroke();
          lab(ctx,r[2].toFixed(1),(rx0+rx1)/2,ry-4,C("--muted"),"center",9);
        } else {
          ctx.fillStyle=COL[r[3]]||C("--line");ctx.fillRect(rx0,top,rx1-rx0-1,y0-top);
        }
        lab(ctx,r[0]+"K",rx0,y0+13,C("--faint"),"left",8);
      });
      lab(ctx,"オフセット →",x1,y0+26,C("--muted"),"right",9);
    }
    reg(cv,draw);
    pn.innerHTML=tbl(["区間","H","種類","見分けの手がかり"],REGIONS.map(function(r){
      var note={code:"~6 = 機械語",str:"~4 = 文字列",empty:"0 = 空き",gzip:"~8 だがマジック 1F 8B → 圧縮。展開できる",enc:"~8 でマジックなし → 暗号。展開できない"}[r[3]];
      return [(r[0]+"–"+r[1]+" KB"), r[2].toFixed(2), r[4], note];}));
    showType.addEventListener("change",draw);
    out.innerHTML='H≈8 は圧縮か暗号。<b>マジックがあれば圧縮</b>（gzip 1F 8B）、なければ暗号を疑う。<b>展開できれば圧縮</b>（binwalk -e / unblob が自動判定）。ヘッダは低エントロピーで手がかりが残る';
    draw();
  };

  /* ============ 15. linux ============ */
  REG.linux=function(el){
    head(el,"DEMO","Linux イメージを層に分ける — binwalk の出力を読む");
    var pn=panel(el), out=readout(el);
    var LAYERS=[
      [0,"U-Boot SPL","1次/2次ブートローダ","生バイナリ","code"],
      [0x40000,"U-Boot","環境変数（bootargs / mtdparts）が平文","uboot","str"],
      [0x60000,"U-Boot 環境","bootcmd= / bootargs=root=... / mtdparts=...","env","str"],
      [0x80000,"uImage header + kernel","マジック 0x27051956、lzma 圧縮","kernel","high"],
      [0x300000,"DTB","0xd00dfeed。dtc -I dtb -O dts で読める。パーティション定義","dtb","str"],
      [0x340000,"Squashfs","hsqs。unsquashfs で /etc /bin /lib を展開","rootfs","high"],
      [0xE00000,"JFFS2","85 19。設定・ログのオーバーレイ","overlay","str"]
    ];
    var row=ctrls(el);
    var sel=select(row,"注目する層",LAYERS.map(function(l){return l[1];}));
    function render(){
      pn.innerHTML=tbl(["offset","層","内容"],LAYERS.map(function(l,i){
        var hit=i===+sel.value;
        return ['<code style="'+(hit?"color:var(--signal)":"")+'">0x'+l[0].toString(16)+'</code>',
          '<span style="'+(hit?"color:var(--signal);font-weight:600":"")+'">'+l[1]+'</span>',
          '<span style="color:var(--muted);font-size:.88rem">'+l[2]+'</span>'];}));
      var l=LAYERS[+sel.value];
      var detail={
        "U-Boot 環境":"strings uboot_env.bin | grep -E 'bootcmd|bootargs|mtdparts'。mtdparts= はフラッシュ分割そのもので、メモリマップの決定版",
        "DTB":"dtc -I dtb -O dts board.dtb。ハードウェア構成（メモリ・周辺・パーティション）の設計図",
        "Squashfs":"unsquashfs -d rootfs rootfs.squashfs → /etc/shadow・鍵・独自バイナリ・バージョンを監査（16 章の対象）",
        "uImage header + kernel":"binwalk -e で中の zImage を取り出し展開。vmlinux-to-elf で解析用 ELF に",
        "JFFS2":"jefferson で展開。NAND なら OOB/ECC を剥がしてから"
      }[l[1]]||"binwalk -e / unblob で自動抽出できる";
      out.innerHTML='<b>まず binwalk -e / unblob。</b>既知形式の塊なので自動で割れ、メモリマップがほぼ完成する。'+
        '<br><b>'+l[1]+'</b>: '+detail;
    }
    sel.addEventListener("change",render);render();
  };

  /* ============ 16. disasm ============ */
  REG.disasm=function(el){
    head(el,"DEMO","シンボルのないコードで、とっかかりを選ぶ");
    var row=ctrls(el);
    var goal=select(row,"知りたいこと",["この関数が何をするか全般","通信処理を見つけたい","暗号/チェックサムを見つけたい","起動処理を追いたい","割り込み処理を見たい"]);
    var pn=panel(el), out=readout(el);
    var ANCHORS={
      0:[["文字列から","特徴的な文字列（\"Login failed\"、フォーマット文字列）を Ghidra で探し、XREF でそれを使う関数へ。エラーメッセージは機能の目印"],
         ["エントリポイントから","リセットハンドラ → スタートアップ → main と順にたどる"]],
      1:[["周辺レジスタから","0x40013800（USART1）など 0x4000 台の定数を触る関数 = 通信処理。データシートでレジスタを引く"],
         ["文字列から","\"AT+\"、\"baud\"、プロトコル名の文字列を XREF"]],
      2:[["既知の定数から","AES の S-box、SHA の初期値 0x6a09e667、CRC 多項式（0xEDB88320 など）を検索。暗号・チェックサムを扱う関数が見つかる"],
         ["高エントロピー定数","鍵や S-box のテーブルの XREF をたどる。Unicorn で関数だけ動かして確かめる（17 章）"]],
      3:[["ベクタテーブルから","オフセット 4 のリセットハンドラ（Thumb ビットを落とす）が起動の入口。7 章"],
         ["データコピーのループ",".data の LMA→VMA コピー、.bss の 0 埋めがスタートアップの目印"]],
      4:[["割り込みハンドラから","ベクタテーブルの各エントリがその周辺機器の処理。SysTick=タイマ、USART=通信、DMA=転送完了"],
         ["繰り返すアドレス","未使用割り込みはデフォルトハンドラ（B .）を指す。テーブルの終わりの目印"]]
    };
    function render(){
      var a=ANCHORS[+goal.value];
      pn.innerHTML='<div style="color:var(--signal);font-weight:600;margin-bottom:.3rem">とっかかり</div>'+
        a.map(function(x){return '<div style="margin:.3rem 0"><b>'+x[0]+'</b><br><span style="line-height:1.55">'+x[1]+'</span></div>';}).join("");
      out.innerHTML='生バイナリを Ghidra に読ませるには <b>アーキテクチャ（ARM:LE:32:Cortex）・ロードアドレス（7 章）・ベクタテーブル</b>の 3 設定。ロードアドレスが正しいと参照がつながる。'+
        '<br>シンボルがないと FUN_08001234 が並ぶだけ。上の入口から入り、<b>XREF で役割を逆にたどる</b>。分かったら名前と型を付けて育てる。シンボル付き ELF なら objdump -d が速い';
    }
    goal.addEventListener("change",render);render();
  };

  /* ============ 17. dynamic ============ */
  REG.dynamic=function(el){
    head(el,"DEMO","静的で行き詰まったとき、動的解析の手段を選ぶ");
    var row=ctrls(el);
    var q1=select(row,"実機とデバッグ端子は",["ある（SWD/JTAG 接続可）","ない"]);
    var q2=select(row,"やりたいこと",["実行時に組み立てられる鍵/値を捕まえる","系全体（周辺込み）を動かす","特定の関数だけ動かして出力を見る","クラッシュの原因を突き止める"]);
    var pn=panel(el), out=readout(el);
    function advise(){
      var r=[];
      var q=+q2.value, hw=+q1.value===0;
      if(q===0){ r.push(hw?["gdb + OpenOCD / pyOCD","「鍵を使う関数」にブレークして、その瞬間の RAM を読む（13 章の動的版）","(gdb) break *0x08001200\n(gdb) x/8xw 0x20001000"]
        :["Renode / QEMU + gdb","実機がなければエミュレータで同じことをする","qemu-system-arm -M mps2-an385 -kernel fw.elf -s -S"]); }
      else if(q===1){ r.push(["Renode（推奨）/ QEMU","多数のボードと周辺を再現。周辺の応答を差し替え、実行を記録・再現できる","(monitor) sysbus LoadELF @fw.elf\n(monitor) sysbus.cpu LogFunctionNames true"]); }
      else if(q===2){ r.push(["Unicorn Engine","CPU コアだけで対象関数を実行。チェックサム・鍵導出・独自エンコードの検証に","mu.emu_start(0x1200|1, 0x1300)  # Thumb は |1"]); }
      else if(q===3){ r.push(["スタックトレース復元","例外時に積まれた PC/LR、スタック上の 0x0800xxxx の奇数値（戻りアドレス）を拾う。addr2line で行に","espcoredump.py info_corefile / Zephyr coredump / 自作フォールトハンドラ"]); }
      pn.innerHTML=r.map(function(x){return '<div style="color:var(--signal);font-weight:600">'+x[0]+'</div><div style="margin:.2rem 0 .4rem;line-height:1.55">'+x[1]+'</div>'+
        '<pre style="margin:0 0 .5rem;white-space:pre-wrap;background:var(--panel);padding:.4rem .6rem;border-radius:7px;border:1px solid var(--line)">'+esc(x[2])+'</pre>';}).join("");
      out.innerHTML='<b>静的と動的を往復する。</b>16 章で「この関数が鍵を作るらしい」と当たりをつけ、動的で入出力を確かめ、分かったことを静的解析に書き戻す。'+
        (!hw&&q!==2&&q!==3?'<br><span style="color:var(--muted)">実機がなくてもエミュレータで多くが再現できる</span>':'');
    }
    [q1,q2].forEach(function(s){s.addEventListener("change",advise);});advise();
  };

  /* ============ 18. diff ============ */
  REG.diff=function(el){
    head(el,"DEMO","操作を 1 つ変えて前後をダンプ — 差分から格納場所を突き止める");
    var row=ctrls(el);
    var param=select(row,"変える設定",["送信出力 10 → 15","チャンネル 15 → 20","デバイス名を変更"]);
    var pn=panel(el), out=readout(el);
    // 模擬: before/after のダンプ（設定領域）
    function build(v){
      var b=new Uint8Array(48);
      for(var i=0;i<48;i++) b[i]=0xFF;
      b.set([0x01,0x00,v.txpow,0x00],0x08);           // txpower @ 0x08
      b.set([0x02,0x00,v.chan,0x00],0x10);            // channel @ 0x10
      var name=u8(v.name); b.set([0x03,0x00,name.length],0x18); b.set(name,0x1B);  // name @ 0x18
      return b;
    }
    function render(){
      var p=+param.value;
      var before=build({txpow:10,chan:15,name:"node-A"});
      var after=build({txpow:p===0?15:10, chan:p===1?20:15, name:p===2?"node-B":"node-A"});
      // 差分区間
      var runs=[], start=null;
      for(var i=0;i<48;i++){ if(before[i]!==after[i]){ if(start===null)start=i; } else { if(start!==null){runs.push([start,i]);start=null;} } }
      if(start!==null)runs.push([start,48]);
      var groups=runs.map(function(r){return {s:r[0],e:r[1],c:"var(--alias)"};});
      pn.innerHTML='<div style="color:var(--signal);font-weight:600">before（設定領域）</div>'+xxdview(before,0x7800,groups)+
        '<div style="color:var(--signal);font-weight:600;margin-top:.4rem">after（変更後）</div>'+xxdview(after,0x7800,groups)+
        '<div style="margin-top:.4rem"><b>差分:</b> '+runs.map(function(r){
          return '0x'+(0x7800+r[0]).toString(16)+'–0x'+(0x7800+r[1]).toString(16)+' ('+(r[1]-r[0])+' B): '+
            hex(before.subarray(r[0],r[1])," ")+' → '+hex(after.subarray(r[0],r[1])," ");}).join("<br>")+'</div>';
      var loc=[["0x7808","送信出力（txpower）の格納場所"],["0x7810","チャンネルの格納場所"],["0x7818","デバイス名の格納場所"]][p];
      out.innerHTML='<b class="ok">変わった数バイトが、その設定の格納場所。</b>'+loc[0]+' が '+loc[1]+'。値も変更に対応して変わっている。'+
        '<br>これを設定項目ごとに繰り返せば、ドキュメントのないストレージの地図が埋まる（10・11 章の地図作りの最短路）。cmp -l / radiff2 / vbindiff で差分を取る';
    }
    param.addEventListener("change",render);render();
  };

  /* ============ 19. parser ============ */
  REG.parser=function(el){
    head(el,"DEMO","構造の性質から、パーサの道具を選ぶ");
    var row=ctrls(el);
    var q1=select(row,"構造は",["固定長・境界が分かっている","可変長・繰り返し・条件で形が変わる","多言語で共有／可視化したい"]);
    var pn=panel(el), out=readout(el);
    var CODE={
      0:["struct","import struct\n# <II = リトルエンディアンの u32 が 2 つ\nmagic, size = struct.unpack_from('<II', data, 0)\nassert magic == 0x96f3b83d, f'bad magic {magic:#x}'","固定長・アラインメントの分かった構造に最適。assert でマジック・長さを検査し、理解違いをすぐ露見させる"],
      1:["construct","from construct import Struct, Int16ul, Bytes, this, GreedyRange\nTlv = Struct('type'/Int16ul, 'length'/Int16ul, 'value'/Bytes(this.length))\nTrailer = Struct('entries'/GreedyRange(Tlv))","TLV・追記型ストレージ・ログのような可変長を宣言的に書ける。build で書き戻せるのでテストデータ生成にも"],
      2:["Kaitai Struct",'meta:\n  id: mcuboot_header\n  endian: le\nseq:\n  - id: magic\n    contents: [0x3d, 0xb8, 0xf3, 0x96]\n  - id: img_size\n    type: u4',".ksy を 1 回書くと Python/C++/JS のパーサを生成。ide.kaitai.io で色付きの構造ビュー。チームの形式仕様として残せる"]
    };
    function render(){
      var c=CODE[+q1.value];
      pn.innerHTML='<div style="color:var(--signal);font-weight:600">→ '+c[0]+'</div>'+
        '<pre style="margin:.3rem 0;white-space:pre-wrap;background:var(--panel);padding:.5rem .6rem;border-radius:7px;border:1px solid var(--line)">'+esc(c[1])+'</pre>'+
        '<div style="line-height:1.6">'+c[2]+'</div>';
      out.innerHTML='<b>検証を必ず組み込む:</b> マジックの assert・CRC/ハッシュ照合・末尾までちょうど読み切るか・ラウンドトリップ（読んで書き戻すと元に一致）。'+
        '<br>ダンプ → 分類 → パース → 報告をパイプライン化し、CI で「秘密が平文で残っていないか」（13 章）を自動チェック。パーサ・スクリプト・メモリマップ・由来を残すのが解析の完成';
    }
    q1.addEventListener("change",render);render();
  };

  /* ============ 20. cases ============ */
  REG.cases=function(el){
    head(el,"DEMO","4 つのケースを、判断の順に追う");
    var row=ctrls(el);
    var sel=select(row,"ケース",["A. 更新に失敗する機器","C. 秘密の監査","D. 素性の分からないファーム"]);
    var pn=panel(el), out=readout(el);
    var CASES={
      0:{title:"A. 更新に失敗する（STM32 + MCUboot、旧版に戻る）",
        steps:["SWD で全体ダンプ。2 回読んで一致、SHA-256 記録（1・4 章）","binwalk とベクタテーブルでメモリマップ（7 章）。Boot / slot0 / slot1 / 設定","slot0・slot1 の MCUboot ヘッダ（8 章）→ slot1 のほうが新しい。更新は届いている","各スロットの末尾トレーラ（8 章）→ slot1 の image ok が未セット","slot1 の TLV の SHA-256 を本体から計算し直して照合 → 一致（壊れていない）"],
        judge:"イメージも署名も正しい。だがアプリの「自己確認（image ok を書く）」処理が呼ばれず、ブートローダがロールバックしている。アプリのコードを 16 章で確認する方向へ"},
      1:{title:"C. 秘密が漏れていないか（出荷前の自己監査）",
        steps:["量産設定で読み出し保護が有効か確認（4 章）。レビューのため開発機でダンプ","binwalk -E でエントロピーマップ（13・14 章）。ファーム本体は暗号化なし（H≈6）","PEM/DER の証明書・鍵を検索（13 章）→ 公開鍵と証明書はあるが秘密鍵はない（正しい）","NVS の全履歴を検査（11・13 章）→ 削除済みマーカ付きのテスト用 Wi-Fi パスワードが平文で残存","パターンスキャンで API キー・トークン → なし"],
        judge:"致命的な鍵漏れはないが、(1) 本体が暗号化されず保護のみが防御、(2) 削除したはずの資格情報が履歴に残る、の 2 点が指摘。対策は PSA 編・IoT セキュリティ編。監査は 19 章で自動化"},
      2:{title:"D. 素性の分からないファーム（ソースもビルド環境もない .bin）",
        steps:["file / strings / binwalk（2 章）→ 生バイナリ。RTOS/ベアメタルの手がかりを探す","xxd -e -g4 で先頭（7 章）→ 0 が RAM、4 がフラッシュ奇数 = Cortex-M 確定。ロードアドレス推定","ベクタテーブルの繰り返しアドレス・割り込み数からチップ系列を推定（7 章）","Ghidra に ARM Cortex / ロードアドレス / ベクタテーブルで読み込む（16 章）","文字列 \"FreeRTOS V10.4.3\" を XREF、周辺レジスタ 0x40013800(USART1) から通信処理を発見","独自チェックサム関数を Unicorn で実行（17 章）→ CRC-16/CCITT と判明"],
        judge:"ソースなしでも使用 RTOS・通信周辺・設定形式が復元でき、保守に必要な範囲は把握できた。分かった構造は 19 章でパーサに残す"}
    };
    function render(){
      var c=CASES[+sel.value];
      pn.innerHTML='<div style="color:var(--signal);font-weight:600;margin-bottom:.3rem">'+c.title+'</div>'+
        '<ol style="margin:0;padding-left:1.4rem;line-height:1.6">'+c.steps.map(function(s){return '<li style="margin:.2rem 0">'+s+'</li>';}).join("")+'</ol>';
      out.innerHTML='<b>判断:</b> '+c.judge;
    }
    sel.addEventListener("change",render);render();
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
