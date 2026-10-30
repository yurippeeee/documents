  /* ============ 14. 共通: AES-128 の実装（デモ用。速さより読みやすさを優先） ============ */
  var AES14=(function(){
    function xt(a){return ((a<<1)&0xFF)^((a&0x80)?0x1B:0);}
    function mul(a,b){var r=0;for(var i=0;i<8;i++){if(b&1)r^=a;a=xt(a);b>>=1;}return r;}
    function inv(a){if(!a)return 0;var r=1,e=254,x=a;while(e){if(e&1)r=mul(r,x);x=mul(x,x);e>>=1;}return r;}
    function rotl(x,k){return ((x<<k)|(x>>(8-k)))&0xFF;}
    function aff(b){return b^rotl(b,1)^rotl(b,2)^rotl(b,3)^rotl(b,4)^0x63;}
    var S=[],SI=[],i;
    for(i=0;i<256;i++)S[i]=aff(inv(i));
    for(i=0;i<256;i++)SI[S[i]]=i;
    function sub(s){return s.map(function(x){return S[x];});}
    function isub(s){return s.map(function(x){return SI[x];});}
    function shift(s){var o=[];for(var r=0;r<4;r++)for(var c=0;c<4;c++)o[r+4*c]=s[r+4*((c+r)%4)];return o;}
    function ishift(s){var o=[];for(var r=0;r<4;r++)for(var c=0;c<4;c++)o[r+4*((c+r)%4)]=s[r+4*c];return o;}
    var M=[[2,3,1,1],[1,2,3,1],[1,1,2,3],[3,1,1,2]],MI=[[14,11,13,9],[9,14,11,13],[13,9,14,11],[11,13,9,14]];
    function mixm(s,m){var o=[];for(var c=0;c<4;c++)for(var r=0;r<4;r++){var v=0;for(var k=0;k<4;k++)v^=mul(m[r][k],s[k+4*c]);o[r+4*c]=v;}return o;}
    function xor(a,b){return a.map(function(x,j){return x^b[j];});}
    function keys(key){
      var W=[],j;for(j=0;j<4;j++)W.push(key.slice(4*j,4*j+4));var rc=1;
      for(j=4;j<44;j++){var t=W[j-1].slice();
        if(j%4===0){t=[S[t[1]],S[t[2]],S[t[3]],S[t[0]]];t[0]^=rc;rc=xt(rc);}
        W.push([W[j-4][0]^t[0],W[j-4][1]^t[1],W[j-4][2]^t[2],W[j-4][3]^t[3]]);}
      var K=[];for(var r=0;r<11;r++)K.push(W[4*r].concat(W[4*r+1],W[4*r+2],W[4*r+3]));
      return {W:W,K:K};}
    function enc(p,K){var s=xor(p,K[0]);for(var r=1;r<=10;r++){s=shift(sub(s));if(r<10)s=mixm(s,M);s=xor(s,K[r]);}return s;}
    function dec(c,K){var s=xor(c,K[10]);for(var r=9;r>=0;r--){s=isub(ishift(s));s=xor(s,K[r]);if(r>0)s=mixm(s,MI);}return s;}
    /* 各操作の後の状態を順に記録する（入力・ラウンド 0 の AddRoundKey・…・ラウンド 10 の AddRoundKey の 41 個） */
    function trace(p,key){
      var K=keys(key).K,st=[{r:0,op:"入力",s:p.slice()}],s=xor(p,K[0]);
      st.push({r:0,op:"AddRoundKey",s:s,k:K[0]});
      for(var r=1;r<=10;r++){
        s=sub(s);st.push({r:r,op:"SubBytes",s:s});
        s=shift(s);st.push({r:r,op:"ShiftRows",s:s});
        if(r<10){s=mixm(s,M);st.push({r:r,op:"MixColumns",s:s});}
        s=xor(s,K[r]);st.push({r:r,op:"AddRoundKey",s:s,k:K[r]});
      }
      return st;}
    /* GCM: GF(2^128) の掛け算（ビットの並びは GCM の約束どおり、バイト 0 の最上位ビットが x^0 の係数） */
    function gfmul128(X,Y){
      var Z=[],V=Y.slice(),j,k;for(j=0;j<16;j++)Z.push(0);
      for(j=0;j<128;j++){
        if((X[j>>3]>>(7-(j&7)))&1)for(k=0;k<16;k++)Z[k]^=V[k];
        var lsb=V[15]&1;for(k=15;k>0;k--)V[k]=(V[k]>>1)|((V[k-1]&1)<<7);V[0]>>=1;if(lsb)V[0]^=0xE1;
      }
      return Z;}
    function ctrblk(nonce,n){return nonce.concat([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
    /* data は暗号化なら平文、復号なら暗号文。ノンスは 12 バイト、付随データは無し */
    function gcm(K,nonce,data,encrypt){
      var H=enc([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],K),out=[],j,k,nb=Math.ceil(data.length/16);
      for(j=0;j<nb;j++){var ks=enc(ctrblk(nonce,j+2),K);for(k=0;k<16&&16*j+k<data.length;k++)out.push(data[16*j+k]^ks[k]);}
      var Cx=encrypt?out:data,Y=[];for(j=0;j<16;j++)Y.push(0);
      for(j=0;j<nb;j++){var blk=[];for(k=0;k<16;k++)blk.push(16*j+k<Cx.length?Cx[16*j+k]:0);Y=gfmul128(xor(Y,blk),H);}
      var bits=Cx.length*8,L=[0,0,0,0,0,0,0,0,0,0,0,0,(bits>>>24)&255,(bits>>>16)&255,(bits>>>8)&255,bits&255];
      Y=gfmul128(xor(Y,L),H);
      return {out:out,tag:xor(Y,enc(ctrblk(nonce,1),K))};}
    function h2(v){return (v<16?"0":"")+v.toString(16);}
    function hexs(a,sep){return a.map(h2).join(sep==null?" ":sep);}
    function parse(t){t=String(t||"").replace(/[^0-9a-fA-F]/g,"");if(t.length!==32)return null;
      var o=[];for(var j=0;j<16;j++)o.push(parseInt(t.substr(2*j,2),16));return o;}
    function bits8(v){var s=v.toString(2);while(s.length<8)s="0"+s;return s;}
    return {S:S,SI:SI,xt:xt,mul:mul,inv:inv,rotl:rotl,sub:sub,shift:shift,mix:function(s){return mixm(s,M);},xor:xor,
      keys:keys,enc:enc,dec:dec,trace:trace,gcm:gcm,h2:h2,hexs:hexs,parse:parse,bits8:bits8};
  })();

  /* ============ 14. aesSbox — 段階 1・段階 2 と S-box の表 ============ */
  REG.aesSbox=function(el){
    head(el,"S-box","逆元（段階 1）とアフィン変換（段階 2）で S(a) を求める");
    var A=AES14,row=ctrls(el);
    var sv=slider(row,"入力バイト a",0,255,0x53,1);
    var out=panel(el),ro=readout(el);
    function hx(v){return "0x"+A.h2(v).toUpperCase();}
    function td(t,st){return '<td style="padding:.05rem .45rem;border-bottom:0;'+(st||"")+'">'+t+'</td>';}
    function run(){
      var a=+sv.input.value;sv.val.textContent=hx(a);
      var b=A.inv(a),c=A.S[a],k;
      var h='<div style="display:flex;flex-wrap:wrap;gap:1rem 1.6rem;align-items:flex-start">';
      h+='<div style="flex:1 1 300px;min-width:270px">';
      h+='<div style="color:var(--muted)">段階 1: 逆元 a<sup>−1</sup> = a<sup>254</sup>（2 乗を 7 回して、7 個を掛け合わせる）</div>';
      if(a===0){h+='<div>a = 0 には逆元が無いので、b = 0 とする</div>';}
      else{
        var sq=[],x=a;for(k=1;k<=7;k++){x=A.mul(x,x);sq.push(x);}
        var lab=["2","4","8","16","32","64","128"];
        h+='<table style="border-collapse:collapse;width:auto;margin:.25rem 0"><tr>'+lab.map(function(t){return '<th style="padding:.1rem .4rem;font-size:.7rem">a<sup>'+t+'</sup></th>';}).join("")+'</tr>';
        h+='<tr>'+sq.map(function(v){return td(A.h2(v).toUpperCase(),"text-align:center");}).join("")+'</tr></table>';
        h+='<div>積 = a<sup>254</sup> = <b style="color:var(--blue)">'+hx(b)+'</b>　<span style="color:var(--muted)">検算: '+hx(a)+' × '+hx(b)+' = '+hx(A.mul(a,b))+'</span></div>';
      }
      h+='<div style="color:var(--muted);margin-top:.7rem">段階 2: 回転した b と 0x63 を列ごとに XOR する</div>';
      var rows=[["b",b],["b⋘1",A.rotl(b,1)],["b⋘2",A.rotl(b,2)],["b⋘3",A.rotl(b,3)],["b⋘4",A.rotl(b,4)],["0x63",0x63]];
      h+='<table style="border-collapse:collapse;width:auto;margin-top:.2rem">';
      rows.forEach(function(r,i){var bt=i===5?"border-bottom:1px solid var(--ink);":"";
        h+='<tr>'+td(r[0],"text-align:right;color:var(--muted);"+bt)+td(A.bits8(r[1]),"letter-spacing:.3em;"+bt)+td(A.h2(r[1]).toUpperCase(),bt)+'</tr>';});
      var em="color:var(--signal);font-weight:700;";
      h+='<tr>'+td("S(a)","text-align:right;"+em)+td(A.bits8(c),"letter-spacing:.3em;"+em)+td(A.h2(c).toUpperCase(),em)+'</tr></table>';
      h+='</div>';
      h+='<div style="flex:0 0 auto"><div style="color:var(--muted);margin-bottom:.2rem">S-box の表（行 = a の上位 4 ビット、列 = 下位 4 ビット）</div>';
      h+='<table style="border-collapse:collapse;width:auto;font-size:.66rem;line-height:1.3"><tr><th style="padding:.05rem .2rem"></th>';
      var lo,hi;
      for(lo=0;lo<16;lo++)h+='<th style="padding:.05rem .22rem;text-align:center;font-size:.62rem">'+lo.toString(16).toUpperCase()+'</th>';
      h+='</tr>';
      for(hi=0;hi<16;hi++){
        h+='<tr><th style="padding:.05rem .25rem;font-size:.62rem">'+hi.toString(16).toUpperCase()+'</th>';
        for(lo=0;lo<16;lo++){var v=hi*16+lo,on=v===a,near=hi===(a>>4)||lo===(a&15);
          h+=td(A.h2(A.S[v]),"text-align:center;padding:.05rem .22rem;"+(on?"background:var(--signal);color:var(--panel);font-weight:700;border-radius:3px":(near?"background:var(--signal-soft)":"")));}
        h+='</tr>';}
      h+='</table></div></div>';
      out.innerHTML=h;
      ro.innerHTML='S('+hx(a)+') = <b class="ok">'+hx(c)+'</b> ／ 表の '+(a>>4).toString(16).toUpperCase()+' 行 '+(a&15).toString(16).toUpperCase()+' 列 ／ '+
        (a===c?'<span class="warn">不動点</span>':'S(a) ≠ a（どの a でも不動点にならない）');
    }
    sv.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 14. aesCache — 読まれたキャッシュラインから鍵を絞り込む ============ */
  REG.aesCache=function(el){
    head(el,"Cache","1 ラウンド目の表引きで読まれるキャッシュラインと、鍵の候補");
    var A=AES14,row=ctrls(el);
    var sk=slider(row,"鍵のバイト k（秘密）",0,255,0x2B,1),sp=slider(row,"平文のバイト p（攻撃者が選ぶ）",0,255,0xA0,1);
    var row2=ctrls(el);var cb=checkbox(row2,"毎回すべての項を読む（定数時間の実装）",false);
    var out=panel(el),ro=readout(el);
    function hx(v){return "0x"+A.h2(v).toUpperCase();}
    function b2(v){return (v>>1)+""+(v&1);}
    function tab(fn,lb){
      var h='<table style="border-collapse:separate;border-spacing:2px;width:auto">';
      for(var hi=0;hi<16;hi++){h+='<tr>';
        for(var lo=0;lo<16;lo++){var v=hi*16+lo;h+='<td style="width:.78rem;height:.72rem;padding:0;border-radius:2px;border:1px solid var(--line);'+fn(v)+'"></td>';}
        h+='<td style="padding:0 0 0 .4rem;border:0;font-size:.66rem;color:var(--muted);white-space:nowrap;line-height:1">'+(hi%4===0?lb(hi>>2):"")+'</td></tr>';}
      return h+'</table>';}
    function run(){
      var k=+sk.input.value,p=+sp.input.value,ct=cb.checked;sk.val.textContent=hx(k);sp.val.textContent=hx(p);
      var idx=p^k,line=idx>>6,cand=[],g;
      for(g=0;g<256;g++)if(ct||((p^g)>>6)===line)cand.push(g);
      var h='<div style="display:flex;flex-wrap:wrap;gap:1rem 2rem">';
      h+='<div><div style="color:var(--muted);margin-bottom:.3rem">S-box の表（64 バイトずつ 4 本のライン）</div>'+tab(function(v){
        var ln=v>>6,read=ct||ln===line;
        if(v===idx)return "background:var(--alias);border-color:var(--alias)";
        return read?"background:var(--alias-soft);border-color:var(--alias)":(ln%2?"background:var(--grid)":"background:var(--screen)");},
        function(q){return "ライン "+q;})+'</div>';
      h+='<div><div style="color:var(--muted);margin-bottom:.3rem">鍵 k の候補（色付き。黒枠が本当の k）</div>'+tab(function(v){
        var c=cand.indexOf(v)>=0;
        return (c?"background:var(--signal-soft);border-color:var(--signal)":"background:var(--screen)")+(v===k?";outline:2px solid var(--ink)":"");},
        function(q){return "上位 "+b2(q);})+'</div></div>';
      h+='<div style="margin-top:.5rem">読む位置 p ⊕ k = '+hx(p)+' ⊕ '+hx(k)+' = <b style="color:var(--alias)">'+hx(idx)+'</b>（上位 2 ビット '+b2(idx>>6)+' → ライン '+line+'）</div>';
      out.innerHTML=h;
      ro.innerHTML=ct?'4 本のラインが毎回すべて読まれる → 観測から鍵について何も分からない ／ 候補 <b>256</b> 個':
        '観測: ライン <b>'+line+'</b> ／ k の上位 2 ビット = '+b2(line)+' ⊕ '+b2(p>>6)+'（p の上位 2 ビット）= <b class="warn">'+b2(line^(p>>6))+'</b> ／ 候補 <b>'+cand.length+'</b> 個 ／ p を変えても、分かるのは同じ上位 2 ビットだけ';
    }
    [sk,sp].forEach(function(o){o.input.addEventListener("input",run);});cb.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 14. aesRounds — ラウンドごとの状態とラウンド鍵 ============ */
  REG.aesRounds=function(el){
    head(el,"AES-128","各操作の前後の状態と、使われるラウンド鍵");
    var A=AES14,row=ctrls(el);
    var ip=textin(row,"平文（16 進 32 桁）","3243f6a8885a308d313198a2e0370734");
    var ik=textin(row,"鍵（16 進 32 桁）","2b7e151628aed2a6abf7158809cf4f3c");
    var row2=ctrls(el);
    var ss=slider(row2,"段階",0,40,1,1);
    var sb=slider(row2,"反転するビット（0 = 先頭バイトの最上位）",0,127,7,1);
    var row3=ctrls(el);
    var cb=checkbox(row3,"平文の 1 ビットを反転して比べる",false);
    var out=panel(el),ro=readout(el);
    var desc={"入力":"平文を列ごとに上から詰めた状態","SubBytes":"各バイトを S-box で置き換える","ShiftRows":"第 i 行を左へ i バイト巡回シフトする",
      "MixColumns":"各列に行列を掛ける","AddRoundKey":"ラウンド鍵を XOR する"};
    function grid(s,fn){
      var h='<table style="border-collapse:separate;border-spacing:3px;width:auto">';
      for(var r=0;r<4;r++){h+='<tr>';
        for(var c=0;c<4;c++){var k=r+4*c;
          h+='<td style="width:2rem;padding:.12rem .2rem;text-align:center;border:1px solid var(--line);border-radius:4px;background:var(--panel);'+(fn?fn(k):"")+'">'+A.h2(s[k])+'</td>';}
        h+='</tr>';}
      return h+'</table>';}
    function cap(t,c){return '<div style="font-size:.72rem;color:'+(c||"var(--muted)")+';margin-bottom:.15rem">'+t+'</div>';}
    function run(){
      var P=A.parse(ip.value),K=A.parse(ik.value);
      ss.val.textContent=ss.input.value+" / 40";sb.val.textContent=sb.input.value;sb.input.disabled=!cb.checked;
      if(!P||!K){out.innerHTML='<span style="color:var(--alias)">平文と鍵は 16 進数 32 桁（16 バイト）で入力する</span>';ro.innerHTML="";return;}
      var st=A.trace(P,K),n=+ss.input.value,cur=st[n],prev=n>0?st[n-1]:null;
      var title=cur.op==="入力"?"入力（平文）":"ラウンド "+cur.r+": "+cur.op;
      var h='<div style="margin-bottom:.5rem"><b>'+title+'</b>　<span style="color:var(--muted)">'+desc[cur.op]+'</span></div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center">';
      if(prev){
        h+='<div>'+cap("操作の前")+grid(prev.s)+'</div>';
        if(cur.op==="AddRoundKey"){
          h+='<div style="font-size:1.1rem">⊕</div><div>'+cap("ラウンド鍵 K<sub>"+cur.r+"</sub>","var(--signal)")+
            grid(cur.k,function(){return "background:var(--signal-soft);border-color:var(--signal)";})+'</div><div style="font-size:1.1rem">=</div>';
        }else h+='<div style="font-size:1.1rem">→</div>';
      }
      h+='<div>'+cap(prev?"操作の後（値が変わったマスに色）":"状態")+grid(cur.s,function(k){
        return prev&&prev.s[k]!==cur.s[k]?"background:var(--signal-soft);border-color:var(--signal)":"";})+'</div>';
      var nb=0,diffb=0;
      if(cb.checked){
        var bi=+sb.input.value,P2=P.slice();P2[bi>>3]^=(0x80>>(bi&7));
        var s2=A.trace(P2,K)[n].s;
        for(var j=0;j<16;j++){var x=s2[j]^cur.s[j];if(x)nb++;while(x){diffb+=x&1;x>>=1;}}
        h+='<div>'+cap("1 ビット反転した平文での同じ段階（違うバイトに色）","var(--alias)")+grid(s2,function(k){
          return s2[k]!==cur.s[k]?"background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700":"";})+'</div>';
      }
      h+='</div>';
      out.innerHTML=h;
      ro.innerHTML='暗号文（段階 40 の状態）= <b>'+A.hexs(st[40].s,"")+'</b>'+
        (cb.checked?' ／ 違うバイト <b class="warn">'+nb+'</b> / 16 ・ 違うビット <b class="warn">'+diffb+'</b> / 128':'');
    }
    [ip,ik].forEach(function(t){t.addEventListener("input",run);});
    [ss,sb].forEach(function(o){o.input.addEventListener("input",run);});cb.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 14. aesEcb — 同じ絵を ECB・CBC・CTR で暗号化する ============ */
  REG.aesEcb=function(el){
    head(el,"Modes","同じ絵を ECB・CBC・CTR で暗号化して比べる");
    var A=AES14,row=ctrls(el);
    var sel=select(row,"利用モード",["ECB","CBC","CTR"]);
    var cv=screen(el,260),cc=cctx(cv),ro=readout(el);
    var Wd=96,Ht=64,K=A.keys(A.parse("000102030405060708090a0b0c0d0e0f")).K;
    var IV=[0x12,0x9a,0x33,0x0c,0xe1,0x57,0x6d,0x2f,0xa4,0x48,0xb5,0x71,0x0e,0xc9,0x26,0x83];
    var BG=0xE6,BODY=0x46,SHK=0x8C,HOLE=0xE6;
    function pix(x,y){
      var dx=x-48,dy=y-24,r2=dx*dx+dy*dy;
      if(y>=30&&y<58&&x>=22&&x<74){
        var hx=x-48,hy=y-40;
        if(hx*hx+hy*hy<=16||(y>=40&&y<51&&x>=46&&x<50))return HOLE;
        return BODY;}
      if(y<=24&&r2<=18*18&&r2>=11*11)return SHK;
      if(y>24&&y<30&&((x>=30&&x<37)||(x>=59&&x<66)))return SHK;
      return BG;}
    var img=[],x,y;for(y=0;y<Ht;y++)for(x=0;x<Wd;x++)img.push(pix(x,y));
    var cache={};
    function encImg(mode){
      if(cache[mode])return cache[mode];
      var out=[],prev=IV.slice(),nb=img.length/16;
      for(var b=0;b<nb;b++){var P=img.slice(16*b,16*b+16),Cb;
        if(mode===0)Cb=A.enc(P,K);
        else if(mode===1){Cb=A.enc(A.xor(P,prev),K);prev=Cb;}
        else{var ctr=IV.slice(0,12).concat([0,0,((b+1)>>8)&255,(b+1)&255]);Cb=A.xor(P,A.enc(ctr,K));}
        for(var j=0;j<16;j++)out.push(Cb[j]);}
      cache[mode]=out;return out;}
    function count(arr){var s={},n=arr.length/16;for(var b=0;b<n;b++)s[A.hexs(arr.slice(16*b,16*b+16),"")]=1;return Object.keys(s).length;}
    function draw(){
      var mode=+sel.value,s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var sc=Math.max(1,Math.min((w-48)/(2*Wd),(h-36)/Ht)),iw=Wd*sc,gap=Math.max(12,(w-2*iw)/3),x1=gap,x2=2*gap+iw,y0=26;
      var enc=encImg(mode);
      function paint(arr,x0){
        for(var yy=0;yy<Ht;yy++)for(var xx=0;xx<Wd;xx++){var v=arr[yy*Wd+xx];
          ctx.fillStyle="rgb("+v+","+v+","+v+")";ctx.fillRect(x0+xx*sc,y0+yy*sc,Math.ceil(sc),Math.ceil(sc));}}
      paint(img,x1);paint(enc,x2);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(x1-.5,y0-.5,iw+1,Ht*sc+1);ctx.strokeRect(x2-.5,y0-.5,iw+1,Ht*sc+1);
      lab(ctx,"平文の絵（1 画素 = 1 バイト）",x1,16,C("--muted"),"left");
      lab(ctx,["ECB","CBC","CTR"][mode]+" で暗号化した結果",x2,16,C("--muted"),"left");
      var nb=img.length/16,a=count(img),c=count(enc);
      ro.innerHTML='ブロック数 '+nb+' ／ 平文の異なるブロック <b>'+a+'</b> 種類 → 暗号文の異なるブロック <b>'+c+'</b> 種類 ／ '+
        (c<nb?'<span class="warn">同じ平文ブロックが同じ暗号文ブロックになり、形が残る</span>':'<span class="ok">暗号文のブロックがすべて異なり、形が消える</span>');
    }
    sel.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 14. aesTamper — 暗号文を書き換えたときの受信者の復号結果 ============ */
  REG.aesTamper=function(el){
    head(el,"Tamper","暗号文を書き換えると、受信者の復号結果はどうなるか");
    var A=AES14,row=ctrls(el);
    var sm=select(row,"利用モード",["ECB","CBC","CTR","GCM"]);
    var sa=select(row,"攻撃者の改ざん",["なし","1 ビット反転（位置はスライダー）","金額の先頭の桁を 0 → 9 に書き換える"]);
    var row2=ctrls(el);var sb=slider(row2,"反転するビットの位置",0,255,37,1);
    var out=panel(el),ro=readout(el);
    var K=A.keys(A.parse("2b7e151628aed2a6abf7158809cf4f3c")).K;
    var MSG="PAY 0100 YEN TO BOB, FROM ALICE.",P=[],i;
    for(i=0;i<MSG.length;i++)P.push(MSG.charCodeAt(i));
    var IV=[0x5f,0x21,0x9c,0x04,0x7e,0xd3,0x18,0xa6,0x33,0xf0,0x6b,0x92,0x0d,0xc4,0x57,0xe8];
    var N=[0xca,0xfe,0xba,0xbe,0xfa,0xce,0xdb,0xad,0xde,0xca,0xf8,0x88];
    function ctrks(n){return A.enc(N.concat([0,0,0,n]),K);}
    function encrypt(mode){
      if(mode===0)return [["C₁",A.enc(P.slice(0,16),K)],["C₂",A.enc(P.slice(16),K)]];
      if(mode===1){var c1=A.enc(A.xor(P.slice(0,16),IV),K),c2=A.enc(A.xor(P.slice(16),c1),K);return [["IV",IV.slice()],["C₁",c1],["C₂",c2]];}
      if(mode===2)return [["C₁",A.xor(P.slice(0,16),ctrks(1))],["C₂",A.xor(P.slice(16),ctrks(2))]];
      var g=A.gcm(K,N,P,true);return [["C₁",g.out.slice(0,16)],["C₂",g.out.slice(16)],["T",g.tag]];
    }
    function decrypt(mode,pr){
      if(mode===0)return {pt:A.dec(pr[0][1],K).concat(A.dec(pr[1][1],K)),ok:true};
      if(mode===1)return {pt:A.xor(A.dec(pr[1][1],K),pr[0][1]).concat(A.xor(A.dec(pr[2][1],K),pr[1][1])),ok:true};
      if(mode===2)return {pt:A.xor(pr[0][1],ctrks(1)).concat(A.xor(pr[1][1],ctrks(2))),ok:true};
      var g=A.gcm(K,N,pr[0][1].concat(pr[1][1]),false);
      return {pt:g.out,ok:A.hexs(g.tag,"")===A.hexs(pr[2][1],"")};
    }
    function run(){
      var mode=+sm.value,att=+sa.value,pr=encrypt(mode),orig=pr.map(function(q){return q[1].slice();});
      var nbits=pr.length*128;sb.input.max=nbits-1;if(+sb.input.value>nbits-1)sb.input.value=nbits-1;
      sb.input.disabled=att!==1;
      var bi=+sb.input.value;sb.val.textContent=bi+"（"+pr[bi>>7][0]+" の先頭から "+(((bi&127)>>3)+1)+" バイト目）";
      var note="";
      if(att===1){pr[bi>>7][1][(bi&127)>>3]^=0x80>>(bi&7);}
      else if(att===2){
        if(mode===1){pr[0][1][4]^=0x09;note="IV の 5 バイト目に 0x09（'0' と '9' の文字コード 0x30・0x39 の XOR）を XOR した";}
        else if(mode===0){pr[0][1][4]^=0x09;note="ECB では狙った 1 バイトだけを変える方法が無い（試しに C₁ の 5 バイト目に 0x09 を XOR した）";}
        else{pr[0][1][4]^=0x09;note="C₁ の 5 バイト目に 0x09（'0' と '9' の文字コード 0x30・0x39 の XOR）を XOR した";}
      }
      var d=decrypt(mode,pr),changed=0,j;
      for(j=0;j<32;j++)if(d.pt[j]!==P[j])changed++;
      var h='<div><span style="color:var(--muted)">送信者の平文:</span> '+esc(MSG)+'</div>';
      h+='<div style="color:var(--muted);margin-top:.5rem">通信路を流れるデータ（攻撃者が書き換えたバイトに色）</div>';
      pr.forEach(function(q,qi){
        h+='<div style="white-space:nowrap"><span style="display:inline-block;width:2.3rem;color:var(--muted)">'+q[0]+'</span>'+q[1].map(function(v,jj){
          var ch=v!==orig[qi][jj];return '<span style="'+(ch?"background:var(--alias-soft);color:var(--alias);font-weight:700;border-radius:3px":"")+'">'+A.h2(v)+'</span>';}).join(" ")+'</div>';});
      h+='<div style="color:var(--muted);margin-top:.5rem">受信者の復号結果</div>';
      if(mode===3&&!d.ok)h+='<div style="color:var(--alias);font-weight:700">認証タグが一致しない → 復号結果を捨てる（何も受け取らない）</div>';
      else h+='<div style="font-size:.95rem;letter-spacing:.05em">'+d.pt.map(function(v,jj){
          var c=(v>=32&&v<127)?String.fromCharCode(v):"·",ch=v!==P[jj];
          return '<span style="'+(ch?"background:var(--alias-soft);color:var(--alias);font-weight:700;border-radius:2px":"")+'">'+(c===" "?"&nbsp;":esc(c))+'</span>';}).join("")+'</div>';
      out.innerHTML=h;
      var res;
      if(mode===3)res=d.ok?'<span class="ok">タグが一致し、平文は送ったとおり</span>':'<span class="ok">改ざんを検知した（受信者は書き換えられた平文を受け取らない）</span>';
      else res=changed?'<span class="warn">復号の処理は書き換えを検出しない（平文の '+changed+' バイトが変わった）</span>':'<span class="ok">平文は送ったとおり</span>';
      ro.innerHTML=(note?note+' ／ ':'')+res;
    }
    [sm,sa].forEach(function(s){s.addEventListener("change",run);});sb.input.addEventListener("input",run);reg(null,run);run();
  };
