  /* ===== 03 章 フレーミングと誤り検出 ===== */
  /* 本文の C と同じ計算（SLIP・COBS・チェックサム・CRC） */
  function _w03_slip(d){var o=[0xC0];d.forEach(function(b){if(b===0xC0)o.push(0xDB,0xDC);else if(b===0xDB)o.push(0xDB,0xDD);else o.push(b);});o.push(0xC0);return o;}
  function _w03_cobs(d){var out=[0],cp=0,code=1,n=d.length;
    for(var i=0;i<n;i++){var b=d[i];
      if(b===0){out[cp]=code;cp=out.length;out.push(0);code=1;}
      else{out.push(b);code++;if(code===0xFF){out[cp]=code;code=1;if(i+1===n)return out;cp=out.length;out.push(0);}}}
    out[cp]=code;return out;}
  /* COBS の列（区切りの 0 を除く）を戻す。形が壊れていれば null */
  function _w03_uncobs(e){var i=0,k=[],n=e.length;
    while(i<n){var c=e[i++];if(c===0||c-1>n-i)return null;
      for(var j=1;j<c;j++){if(e[i]===0)return null;k.push(e[i++]);}
      if(c!==0xFF&&i<n)k.push(0);}
    return k;}
  function _w03_sum8(d){var s=0;for(var i=0;i<d.length;i++)s=(s+d[i])&255;return s;}
  var _w03_T8=[],_w03_T16=[],_w03_T32=[];
  (function(){for(var i=0;i<256;i++){var a=i;for(var b=0;b<8;b++)a=(a&0x80)?((a<<1)^0x07)&255:(a<<1)&255;_w03_T8.push(a);
    var c=i<<8;for(b=0;b<8;b++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF;_w03_T16.push(c);
    var d=i;for(b=0;b<8;b++)d=(d&1)?((d>>>1)^0xEDB88320)>>>0:d>>>1;_w03_T32.push(d>>>0);}})();
  function _w03_crc8(d){var c=0;for(var i=0;i<d.length;i++)c=_w03_T8[c^d[i]];return c;}
  function _w03_crc16(d){var c=0xFFFF;for(var i=0;i<d.length;i++)c=((c<<8)^_w03_T16[((c>>8)^d[i])&255])&0xFFFF;return c;}
  function _w03_crc32(d){var c=0xFFFFFFFF;for(var i=0;i<d.length;i++)c=(c>>>8)^_w03_T32[(c^d[i])&255];return (c^0xFFFFFFFF)>>>0;}
  var _w03_M=[{n:"8 ビットの和",f:_w03_sum8,w:2},{n:"CRC-8",f:_w03_crc8,w:2},{n:"CRC-16",f:_w03_crc16,w:4},{n:"CRC-32",f:_w03_crc32,w:8}];
  function _w03_hx(v,w){return "0x"+("00000000"+(v>>>0).toString(16).toUpperCase()).slice(-w);}
  /* 16 進の文字列を読む。返り値 {b: バイトの配列, bad: 読めなかった部分} */
  function _w03_parseHex(s){var b=[],bad=[];String(s).replace(/0x/gi," ").split(/[\s,;:]+/).forEach(function(t){if(!t)return;
      if(!/^[0-9a-fA-F]+$/.test(t)){bad.push(t);return;}if(t.length%2)t="0"+t;for(var i=0;i<t.length;i+=2)b.push(parseInt(t.substr(i,2),16));});
    return {b:b,bad:bad};}

  /* ---- デモ 1: SLIP と COBS の符号化 ---- */
  REG.w03_stuff=function(el,U){
    var S=U.S;
    U.head(el,"STUFF","SLIP と COBS で置き換えたバイトの列");
    var row=U.ctrls(el);
    var tx=U.textin(row,"データ（16 進。空白で区切る）","11 22 00 33 C0 DB 44",draw,{width:"100%"});
    var br=U.btnrow(el),seed=1;
    function set(a){tx.set(a.map(function(v){return U.fmt.hex(v);}).join(" "));draw();}
    U.button(br,"本文の COBS の例",function(){set([0x11,0x22,0x00,0x33,0x00,0x00,0x44]);});
    U.button(br,"本文の SLIP の例",function(){set([0x01,0xC0,0x02,0xDB,0x03]);});
    U.button(br,"0xC0・0xDB だけ 20 バイト",function(){var a=[];for(var i=0;i<20;i++)a.push(i%2?0xDB:0xC0);set(a);});
    U.button(br,"0x00 だけ 20 バイト",function(){var a=[];for(var i=0;i<20;i++)a.push(0);set(a);});
    U.button(br,"0x00 を含まない 300 バイト",function(){var a=[];for(var i=0;i<300;i++)a.push(i%255+1);set(a);});
    U.button(br,"乱数 100 バイト（押すたびに変わる）",function(){var r=U.rng(seed++),a=[];for(var i=0;i<100;i++)a.push(r.int(256));set(a);});
    var hv=U.mk("div");hv.style.marginTop=".6rem";el.appendChild(hv);
    var box=U.svgbox(el,{scroll:true});box.el.style.marginTop=".7rem";
    var ro=U.readout(el);
    function lab(t){return '<div style="font-family:var(--mono);font-size:.74rem;color:var(--muted);margin:.55rem 0 .2rem">'+t+'</div>';}
    function draw(){
      var p=_w03_parseHex(tx.get()),d=p.b.slice(0,1000),warn="";
      if(p.bad.length)warn+='<span class="warn">16 進として読めない所を飛ばした: '+U.esc(p.bad.slice(0,3).join(" "))+'</span><br>';
      if(p.b.length>1000)warn+='<span class="warn">先頭の 1000 バイトだけを使う。</span><br>';
      var n=d.length,sl=_w03_slip(d),cb=_w03_cobs(d),co=cb.concat([0]);
      var k=d.filter(function(v){return v===0xC0||v===0xDB;}).length;
      /* SLIP の各バイトの色: END = gold、置き換えた 2 バイト（ESC とその次）= purple */
      var slc=[],esc=false;sl.forEach(function(v,i){if(i===0||i===sl.length-1){slc[i]="gold";return;}if(esc){slc[i]="purple";esc=false;return;}if(v===0xDB){slc[i]="purple";esc=true;return;}slc[i]=null;});
      /* COBS のコードバイトの位置 */
      var codes={},j=0;while(j<cb.length){codes[j]=1;var c=cb[j];j+=c;}
      var coc=co.map(function(v,i){return i===co.length-1?"gold":(codes[i]?"purple":null);});
      hv.innerHTML=lab("データ（"+n+" バイト）: 0x00 は青緑、0xC0・0xDB は紫")+U.hexView(d,function(i){return d[i]===0?"teal":(d[i]===0xC0||d[i]===0xDB?"purple":null);})+
        lab("SLIP（"+sl.length+" バイト、+"+(sl.length-n)+"）: END は金、置き換えた 2 バイトは紫")+U.hexView(sl,function(i){return slc[i];})+
        lab("COBS（区切りを含めて "+co.length+" バイト、+"+(co.length-n)+"）: コードバイトは紫、区切りの 00 は金")+U.hexView(co,function(i){return coc[i];});
      /* 短いときは、COBS のコードバイトが指す先を矢印で */
      if(n>=1&&n<=24){
        var cw=34,x0=12,y=62,W=Math.max(600,x0*2+co.length*cw),o=[];
        o.push(S.T(x0,18,"COBS の列: コードバイトの値だけ先へ飛ぶ（飛んだ先が、元のデータの 00 の位置）","start",11,"ink",true));
        co.forEach(function(v,i){var c=coc[i]||"line";o.push(S.RECT(x0+i*cw+2,y,cw-4,24,3,coc[i]?U.soft(coc[i]):"panel",c,1.2));o.push(S.T(x0+i*cw+cw/2,y+16,U.fmt.hex(v),"middle",11,"ink",!!coc[i],true));});
        var q=0;while(q<cb.length){var to=q+cb[q],xa=x0+q*cw+cw/2,xb=x0+to*cw+cw/2,h=Math.min(26,8+(to-q)*4);
          o.push(S.PATH("M"+xa+","+(y-2)+" Q"+((xa+xb)/2)+","+(y-2-2*h)+" "+(xb-2)+","+(y-4),"purple",1.4));
          o.push(S.head((xa+xb)/2,y-2-2*h,xb-2,y-4,"purple",6));
          o.push(S.T((xa+xb)/2,y-6-h,String(cb[q]),"middle",10,"purple",true));
          q=to;}
        box.el.style.display="";box.set(S.svg(W,y+34,o));
      }else{box.el.style.display="none";box.set("");}
      /* 元に戻せるか */
      var back=_w03_uncobs(cb),okC=back&&back.length===n&&back.every(function(v,i){return v===d[i];});
      var sb=[],e2=false;for(var i=1;i<sl.length-1;i++){var v=sl[i];if(e2){sb.push(v===0xDC?0xC0:0xDB);e2=false;}else if(v===0xDB)e2=true;else sb.push(v);}
      var okS=sb.length===n&&sb.every(function(v,i){return v===d[i];});
      var lim=n>=1?Math.ceil(n/254):1;
      ro.innerHTML=warn+"データ n = <b>"+n+"</b> バイト（うち 0xC0・0xDB が "+k+" 個、0x00 が "+d.filter(function(v){return v===0;}).length+" 個）<br>"+
        "SLIP: n + k + 2 = "+n+" + "+k+" + 2 = <b>"+sl.length+"</b> バイト（最悪 2n + 2 = "+(2*n+2)+"）・ 戻すと "+(okS?'<span class="ok">一致</span>':'<span class="warn">不一致</span>')+"<br>"+
        "COBS: <b>"+co.length+"</b> バイト = n + "+(cb.length-n)+"（増える量）+ 1（区切り）・ 増える量の上限 ⌈n/254⌉ = "+lim+" ・ 戻すと "+(okC?'<span class="ok">一致</span>':'<span class="warn">不一致</span>');
    }
    draw();
  };

  /* ---- デモ 2: 1 バイトが壊れたとき、何フレームを失うか ---- */
  REG.w03_resync=function(el,U){
    var S=U.S;
    var PAY=[[0x01,0x17,0x2D,0x64],[0x02,0xC0,0x00,0x63],[0x03,0xAA,0x55,0x10],[0x04,0x18,0xDB,0x64]];
    U.head(el,"RESYNC","1 バイトが壊れたとき、受け手は何フレームを失うか");
    var row=U.ctrls(el);
    var md=U.seg(row,["SLIP","COBS","長さフィールド"],0,function(){clampPos();draw();});
    var row2=U.ctrls(el);
    var ev=U.select(row2,"起きること",["何も起きない","1 バイトを書き換える","1 バイトが失われる","途中から聞き始める"],1,draw);
    var how=U.select(row2,"書き換え方",["ビット 0 を反転（XOR 0x01）","ビット 3 を反転（XOR 0x08）","ビット 6 を反転（XOR 0x40）","0x00 にする","0xC0 にする","0xAA にする"],2,draw);
    var row3=U.ctrls(el);
    var pos=U.slider(row3,"位置（何バイト目か。0 から数える）",{min:0,max:40,step:1,value:2,fmt:function(v){return String(v);},onInput:draw});
    var row4=U.ctrls(el);
    var cMax=U.checkbox(row4,"長さの上限（16）を確かめる",true,draw);
    var cHdr=U.checkbox(row4,"ヘッダの CRC を付ける",false,draw);
    var cRes=U.checkbox(row4,"捨てたら同期パターンの次から探し直す",false,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    /* フレームを作る。返り値 {s: バイト, role: 役割, fr: どのメッセージか} */
    function build(m){
      var s=[],role=[],fr=[];
      PAY.forEach(function(p,k){
        if(m===2){var body=[p.length].concat(p),c=_w03_crc16(body);
          var f=[0xAA,0x55,p.length],r=["y","y","l"];
          if(cHdr.get()){f.push(_w03_crc8([0xAA,0x55,p.length]));r.push("h");}
          p.forEach(function(v){f.push(v);r.push("p");});f.push(c>>8,c&255);r.push("c","c");
          f.forEach(function(v,i){s.push(v);role.push(r[i]);fr.push(k);});return;}
        var c2=_w03_crc16(p),src=p.concat([c2>>8,c2&255]),srole=["p","p","p","p","c","c"];
        if(m===0){s.push(0xC0);role.push("y");fr.push(k);
          src.forEach(function(v,i){if(v===0xC0||v===0xDB){s.push(0xDB,v===0xC0?0xDC:0xDD);role.push("e","e");fr.push(k,k);}else{s.push(v);role.push(srole[i]);fr.push(k);}});
          s.push(0xC0);role.push("y");fr.push(k);}
        else{var e=_w03_cobs(src),cs={},j=0;while(j<e.length){cs[j]=1;j+=e[j];}
          var si=0;e.forEach(function(v,i){s.push(v);fr.push(k);if(cs[i]){role.push("e");if(i>0)si++;}else{role.push(srole[si]);si++;}});
          s.push(0);role.push("y");fr.push(k);}
      });
      return {s:s,role:role,fr:fr};
    }
    function clampPos(){var b=build(md.get());pos.input.max=b.s.length-1;if(pos.get()>b.s.length-1)pos.set(b.s.length-1);}
    /* 受け手。返り値 [{a: 始まり, b: 終わり（含む）, k: 種類, t: 説明, p: 渡したペイロード}] （a, b は届いた列の位置） */
    function rxSlip(r){var out=[],buf=[],esc=false,bad=false,st=0;
      for(var i=0;i<r.length;i++){var c=r[i];
        if(c===0xC0){if(buf.length&&!bad&&!esc)out.push(check(st,i,buf));else if(buf.length||bad||esc)out.push({a:st,b:i,k:"x",t:"規則にない並びで捨てた"});
          buf=[];esc=false;bad=false;st=i+1;continue;}
        if(esc){esc=false;if(c===0xDC)buf.push(0xC0);else if(c===0xDD)buf.push(0xDB);else bad=true;}
        else if(c===0xDB)esc=true;else buf.push(c);}
      if(st<r.length)out.push({a:st,b:r.length-1,k:"w",t:"END が来ないまま終わった（待つ時間の上限で捨てる）"});
      return out;}
    function rxCobs(r){var out=[],st=0;
      for(var i=0;i<r.length;i++){if(r[i]!==0)continue;
        if(i>st){var d=_w03_uncobs(r.slice(st,i));out.push(d?check(st,i,d):{a:st,b:i,k:"x",t:"コードバイトが壊れていて戻せない"});}
        st=i+1;}
      if(st<r.length)out.push({a:st,b:r.length-1,k:"w",t:"00 が来ないまま終わった（待つ時間の上限で捨てる）"});
      return out;}
    function check(a,b,d){if(d.length<3)return {a:a,b:b,k:"x",t:"短すぎるので捨てた"};
      var p=d.slice(0,d.length-2),c=_w03_crc16(p);
      if((c>>8)===d[d.length-2]&&(c&255)===d[d.length-1])return {a:a,b:b,k:"ok",t:"CRC が合った",p:p};
      return {a:a,b:b,k:"x",t:"CRC が合わず捨てた"};}
    function rxLen(r){var out=[],i=0,hdr=cHdr.get()?1:0,MAX=16,n=r.length;
      while(i<n){var j=-1;for(var q=i;q+1<n;q++)if(r[q]===0xAA&&r[q+1]===0x55){j=q;break;}
        if(j<0){if(i<n)out.push({a:i,b:n-1,k:"s",t:"同期パターンが無いので読み捨てた"});break;}
        if(j>i)out.push({a:i,b:j-1,k:"s",t:"同期パターンを探して読み捨てた"});
        if(j+2>=n){out.push({a:j,b:n-1,k:"w",t:"途中で終わった（待つ時間の上限で捨てる）"});break;}
        var L=r[j+2];
        if(hdr){if(j+3>=n){out.push({a:j,b:n-1,k:"w",t:"途中で終わった（待つ時間の上限で捨てる）"});break;}
          if(_w03_crc8([0xAA,0x55,L])!==r[j+3]){out.push({a:j,b:j+3,k:"x",t:"ヘッダの CRC が合わず捨てた"});i=j+1;continue;}}
        if(cMax.get()&&L>MAX){out.push({a:j,b:j+2+hdr,k:"x",t:"長さ "+L+" が上限 16 を超えるので捨てた"});i=j+1;continue;}
        var end=j+3+hdr+L+2;
        if(end>n){out.push({a:j,b:n-1,k:"w",t:"長さ "+L+" の分が届かないまま終わった（待つ時間の上限で捨てる）"});
          if(cRes.get()){i=j+1;continue;}break;}
        var body=[L].concat(r.slice(j+3+hdr,j+3+hdr+L)),c=_w03_crc16(body);
        if((c>>8)===r[end-2]&&(c&255)===r[end-1]){out.push({a:j,b:end-1,k:"ok",t:"CRC が合った",p:body.slice(1)});i=end;}
        else{out.push({a:j,b:end-1,k:"x",t:"CRC が合わず捨てた"});i=cRes.get()?j+1:end;}}
      return out;}
    function draw(){
      var m=md.get(),B=build(m),s=B.s,N=s.length,e=ev.get(),P=Math.min(pos.get(),N-1),mask=[0x01,0x08,0x40][how.get()];
      var lenOpt=(m===2);[cMax,cHdr,cRes].forEach(function(c){c.el.style.opacity=lenOpt?1:0.4;c.input.disabled=!lenOpt;});
      how.el.style.opacity=e===1?1:0.4;how.input.disabled=e!==1;
      /* 届いた列: map[届いた位置] = 送った位置 */
      var recv=[],map=[],newv=null;
      for(var i=0;i<N;i++){
        if(e===2&&i===P)continue;
        if(e===3&&i<P)continue;
        var v=s[i];
        if(e===1&&i===P){v=how.get()<3?(v^mask):[0x00,0xC0,0xAA][how.get()-3];newv=v;}
        recv.push(v);map.push(i);}
      var res=m===0?rxSlip(recv):m===1?rxCobs(recv):rxLen(recv);
      /* 描く */
      var cw=24,x0=14,y1=50,o=[],W=x0*2+N*cw;
      var col={y:"gold",l:"purple",h:"teal",p:"signal",c:"green",e:"purple"};
      var names=["メッセージ 1","メッセージ 2","メッセージ 3","メッセージ 4"];
      for(var k=0;k<4;k++){var a=B.fr.indexOf(k),b=B.fr.lastIndexOf(k);
        o.push(S.W([x0+a*cw+3,y1-6,x0+a*cw+3,y1-11,x0+(b+1)*cw-3,y1-11,x0+(b+1)*cw-3,y1-6],"faint",1.1));
        o.push(S.T(x0+(a+b+1)*cw/2,y1-16,names[k],"middle",10,"ink",true));}
      o.push(S.T(x0,14,"送った列","start",10,"muted",true));
      s.forEach(function(v,i){var c=col[B.role[i]];o.push(S.RECT(x0+i*cw+1,y1,cw-2,22,3,U.soft(c),c,1.1));o.push(S.T(x0+i*cw+cw/2,y1+15,U.fmt.hex(v),"middle",9.5,"ink",false,true));});
      var y2=y1+56;
      o.push(S.T(x0,y2-10,"受け手に届いた列（位置は送った列にそろえた）","start",10,"muted",true));
      for(i=0;i<N;i++){var ri=map.indexOf(i),xx=x0+i*cw;
        if(ri<0){if(e===2&&i===P){o.push(S.RECT(xx+1,y2,cw-2,22,3,"none","alias",1.2,"3 3"));o.push(S.X(xx+cw/2,y2+11,5,"alias",1.6));}
          else{o.push(S.RECT(xx+1,y2,cw-2,22,3,"none","faint",1,"2 3"));}continue;}
        var bad=(e===1&&i===P),c2=bad?"alias":col[B.role[i]];
        o.push(S.RECT(xx+1,y2,cw-2,22,3,U.soft(c2),c2,bad?2:1.1));o.push(S.T(xx+cw/2,y2+15,U.fmt.hex(recv[ri]),"middle",9.5,bad?"alias":"ink",bad,true));}
      /* 受け手の動き（括弧）。重ならないように段を分ける */
      var lv=[],y3=y2+58,got={},wrong=0;
      o.push(S.T(x0,y3-16,"受け手が切り出したもの（✓ = CRC が合って渡した、× = 捨てた、灰色 = 同期パターンを探して読み捨てた）","start",10,"muted",true));
      res.forEach(function(r){var xa=x0+map[r.a]*cw+2,xb=x0+(map[r.b]+1)*cw-2,L=0;
        while(lv[L]!=null&&lv[L]>xa-1)L++;lv[L]=xb;
        var c=r.k==="ok"?"green":(r.k==="s"?"faint":(r.k==="w"?"gold":"alias")),yy=y3+L*34;
        o.push(S.W([xa,yy-5,xa,yy,xb,yy,xb,yy-5],c,1.5));
        var t=r.k==="ok"?"✓":(r.k==="s"?"":"×");
        if(r.k==="ok"){var idx=-1;PAY.forEach(function(p,k){if(p.length===r.p.length&&p.every(function(v,q){return v===r.p[q];}))idx=k;});
          if(idx>=0){got[idx]=1;t="✓ "+(idx+1);}else{wrong++;t="✓? 送っていない内容";c="alias";}}
        o.push(S.T((xa+xb)/2,yy+13,t,"middle",10,c,true));});
      var H=y3+Math.max(1,lv.length)*34+8;
      box.set(S.svg(W,H,o));
      var lost=[];for(k=0;k<4;k++)if(!got[k])lost.push(k+1);
      var lines=res.map(function(r){var a=map[r.a],b=map[r.b];return "位置 "+a+"〜"+b+": "+(r.k==="ok"?'<span class="ok">'+r.t+"</span>":(r.k==="s"?r.t:'<span class="warn">'+r.t+"</span>"));});
      var what=e===0?"何も起きていない":(e===1?"位置 "+P+" の "+U.fmt.hex(s[P])+" が "+U.fmt.hex(newv)+" に変わった":(e===2?"位置 "+P+" の "+U.fmt.hex(s[P])+" が失われた":"位置 "+P+" から聞き始めた"));
      ro.innerHTML=what+" ・ 受け取ったメッセージ <b>"+(4-lost.length)+" / 4</b>"+(lost.length?'（<span class="warn">失った: '+lost.join("・")+"</span>）":' <span class="ok">すべて受け取った</span>')+
        (wrong?' ・ <span class="warn">CRC が偶然合った誤ったフレームがある</span>':"")+"<br>"+lines.join("<br>");
    }
    clampPos();draw();
  };

  /* ---- デモ 3: チェックサムと CRC が誤りに気づくか ---- */
  REG.w03_detect=function(el,U){
    var S=U.S;
    U.head(el,"DETECT","誤りを入れて、チェックサムと CRC が気づくかを試す");
    var row=U.ctrls(el);
    var tx=U.textin(row,"データ（文字）","TEMP=23.45;HUM=45",function(){shot();},{width:"100%"});
    var row2=U.ctrls(el);
    var KIND=["1 ビットの反転","2 ビットの反転（ばらばらの位置）","3 ビットの反転","長さ b のバースト","2 バイトの入れ替え","打ち消し合う 2 ビット（同じ桁を逆向きに）"];
    var kd=U.select(row2,"誤りの形",KIND,1,function(){upd();shot();});
    var bl=U.slider(row2,"バーストの長さ b",{min:2,max:48,step:1,value:12,fmt:function(v){return v+" ビット";},onInput:function(){shot();}});
    var br=U.btnrow(el),seed=7,mcSeed=1;
    U.button(br,"誤りを入れる（別の乱数で）",function(){seed++;shot();});
    U.button(br,"1 万回試す",function(){mc();});
    var hv=U.mk("div");el.appendChild(hv);
    var tb=U.mk("div");el.appendChild(tb);
    var box=U.svgbox(el);box.el.style.marginTop=".7rem"; var ro=U.readout(el);
    var last=null;
    function upd(){var b=kd.get()===3;bl.el.style.opacity=b?1:0.4;bl.input.disabled=!b;}
    function bytesOf(s){var a=[];try{a=Array.prototype.slice.call(new TextEncoder().encode(s));}catch(e){for(var i=0;i<s.length;i++)a.push(s.charCodeAt(i)&255);}return a.slice(0,64);}
    /* d に誤りを入れた列を返す（ビットは各バイトを MSB から並べた順番で数える）。入れられなければ null */
    function corrupt(d,k,b,r){var f=d.slice(),nb=d.length*8;
      function fl(i){f[i>>3]^=0x80>>(i&7);}
      if(k<=2){var need=k+1;if(nb<need)return null;var used={};for(var q=0;q<need;q++){var x;do x=r.int(nb);while(used[x]);used[x]=1;fl(x);}return f;}
      if(k===3){var L=Math.min(b,nb);if(L<2)return null;var st=r.int(nb-L+1);fl(st);fl(st+L-1);for(var j=st+1;j<st+L-1;j++)if(r.next()<0.5)fl(j);return f;}
      /* 入れ替えと打ち消し合う 2 ビットは、条件に合う組を乱数で探す（見つからなければ null） */
      for(var tries=0;tries<2000;tries++){var a=r.int(d.length),c=r.int(d.length);if(a===c)continue;
        if(k===4){if(d[a]===d[c])continue;var t=f[a];f[a]=f[c];f[c]=t;return f;}
        var bit=r.int(8);if(((d[a]>>bit)&1)||!((d[c]>>bit)&1))continue;f[a]^=1<<bit;f[c]^=1<<bit;return f;}
      return null;}
    function shot(){
      var d=bytesOf(tx.get()),k=kd.get(),r=U.rng(seed*7919+k);
      if(d.length<2){hv.innerHTML='<div class="wnote">2 文字以上を入れてほしい。</div>';return;}
      var f=corrupt(d,k,bl.get(),r);
      if(!f){hv.innerHTML='<div class="wnote">このデータには、この形の誤りを入れられない（同じ値のバイトばかり、など）。</div>';last=null;show();return;}
      var ch=function(i){return f[i]!==d[i]?"alias":null;};
      var bits=[];d.forEach(function(v,i){if(f[i]!==v)bits.push("位置 "+i+": "+("0000000"+v.toString(2)).slice(-8)+" → "+("0000000"+f[i].toString(2)).slice(-8));});
      hv.innerHTML='<div class="wnote">送ったデータ（'+d.length+' バイト）</div>'+U.hexView(d,null)+'<div class="wnote">届いたデータ（変わったバイトは赤）</div>'+U.hexView(f,ch)+
        '<div class="wnote" style="font-family:var(--mono)">'+bits.slice(0,6).join("<br>")+(bits.length>6?"<br>…":"")+'</div>';
      last={rows:_w03_M.map(function(M){var a=M.f(d),b=M.f(f);return [M.n,_w03_hx(a,M.w),_w03_hx(b,M.w),a===b?'<span class="warn">見逃した</span>':'<span class="ok">気づいた</span>'];})};
      show();
    }
    var mcRes=null;
    function mc(){
      var n=Math.max(2,bytesOf(tx.get()).length),k=kd.get(),b=bl.get(),N=10000,r=U.rng(1000+mcSeed++),miss=[0,0,0,0],tried=0;
      for(var t=0;t<N;t++){var d=[];for(var i=0;i<n;i++)d.push(r.int(256));var f=corrupt(d,k,b,r);if(!f)continue;tried++;
        for(var m=0;m<4;m++)if(_w03_M[m].f(d)===_w03_M[m].f(f))miss[m]++;}
      mcRes={miss:miss,tried:tried,n:n,k:k,b:b};show();
    }
    function show(){
      tb.innerHTML=last?U.tbl(["方法","送り手が付けた値","受け手が計算した値","判定"],last.rows,["left","left","left","left"]):"";
      var o=[],W=700;
      if(mcRes){var p=U.plot(150,30,400,120,[1e-5,1],[0,4],{xlog:true});
        o.push(S.T(20,18,"見逃した割合（"+mcRes.tried+" 回。データ "+mcRes.n+" バイト、誤りの形: "+KIND[mcRes.k]+(mcRes.k===3?"、b = "+mcRes.b:"")+"）","start",10.5,"ink",true));
        [1e-5,1e-4,1e-3,1e-2,0.1,1].forEach(function(v){var x=p.X(v);o.push(S.L(x,30,x,150,"grid",1));o.push(S.T(x,166,v>=0.01?(v*100)+" %":(v*100).toPrecision(1)+" %","middle",9,"muted"));});
        _w03_M.forEach(function(M,m){var y=34+m*29,v=mcRes.miss[m]/Math.max(1,mcRes.tried),c=v===0?"green":(v>=0.01?"alias":"gold");
          o.push(S.T(142,y+15,M.n,"end",10.5,"ink",true));
          if(v>0){var x=p.X(Math.max(v,1e-5));o.push(S.RECT(150,y+2,x-150,18,3,U.soft(c),c,1.1));o.push(S.T(x+6,y+15,mcRes.miss[m]+" 回（"+U.sig(v*100,2)+" %）","start",10,c,true));}
          else o.push(S.T(156,y+15,"0 回（一度も見逃さなかった）","start",10,"green",true));});
        o.push(S.T(20,190,"誤りの形がでたらめなときの目安: 8 ビットの値なら 1/256 ≈ 0.39 %、16 ビットなら 1/65536 ≈ 0.0015 %（1 万回では 0 回が多い）","start",9.5,"muted"));
        box.el.style.display="";box.set(S.svg(W,200,o));
      }else{box.el.style.display="none";}
      ro.innerHTML=mcRes?"同じ形の誤りを 1 万回入れたとき、4 つの方法が見逃した回数（上のグラフ）。「1 万回試す」をもう一度押すと、別の乱数で試す。":"「1 万回試す」を押すと、データを毎回乱数で作って同じ形の誤りを 1 万回入れ、見逃した割合のグラフが表示される。";
    }
    upd();shot();
  };

  /* ---- デモ 4: TLV の組み立てと、壊れた列の解析 ---- */
  REG.w03_tlv=function(el,U){
    var S=U.S;
    U.head(el,"TLV","TLV を組み立て、壊れた列を 2 つの解析で読む");
    var row=U.ctrls(el);
    var iT=U.checkbox(row,"温度（型 01）",true,draw),iH=U.checkbox(row,"湿度（型 02）",true,draw),iB=U.checkbox(row,"電池（型 03）",true,draw),iU=U.checkbox(row,"新しい型 20（3 バイト）",false,draw);
    var row2=U.ctrls(el);
    var tC=U.slider(row2,"温度",{min:-40,max:60,step:0.05,value:23.45,fmt:function(v){return v.toFixed(2)+" °C";},onInput:draw});
    var hP=U.slider(row2,"湿度",{min:0,max:100,step:1,value:45,fmt:function(v){return v+" %";},onInput:draw});
    var bV=U.slider(row2,"電池",{min:2000,max:4200,step:10,value:3700,fmt:function(v){return v+" mV";},onInput:draw});
    var row3=U.ctrls(el);
    var bk=U.select(row3,"壊し方",["壊さない","2 つ目の項目の長さを 0x41 にする","1 つ目の項目の長さを 1 増やす","1 つ目の項目の長さを 0xFF にする","最後の 3 バイトが届かない"],1,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function items(){var a=[],t=Math.round(tC.get()*100);t=Math.max(-32768,Math.min(32767,t));var u=t&0xFFFF;
      if(iT.get())a.push({t:1,v:[u&255,u>>8],n:"温度"});
      if(iU.get())a.push({t:0x20,v:[0xAA,0xBB,0xCC],n:"新しい型"});
      if(iH.get())a.push({t:2,v:[hP.get()],n:"湿度"});
      if(iB.get()){var b=bV.get();a.push({t:3,v:[b&255,b>>8],n:"電池"});}
      return a;}
    function meaning(t,v){
      if(t===1&&v.length===2){var u=v[0]|(v[1]<<8),s=u>=0x8000?u-0x10000:u;return "温度 "+(s/100).toFixed(2).replace("-","−")+" °C";}
      if(t===2&&v.length===1)return "湿度 "+v[0]+" %";
      if(t===3&&v.length===2)return "電池 "+(v[0]|(v[1]<<8))+" mV";
      if(t>=1&&t<=3)return '<span class="warn">型 '+U.fmt.hex(t)+" なのに長さ "+v.length+"（型の決まりと違う → -1）</span>";
      return "型 "+U.fmt.hex(t)+"（知らない型なので読み飛ばす）";}
    function draw(){
      var it=items(),buf=[],role=[];
      it.forEach(function(x){buf.push(x.t,x.v.length);role.push(x.t>3?"u":"t",x.t>3?"u":"l");x.v.forEach(function(b){buf.push(b);role.push(x.t>3?"u":"v");});});
      var b=bk.get(),badAt=-1;
      if(b===1){var off=0;if(it.length>=2){off=2+it[0].v.length;buf[off+1]=0x41;badAt=off+1;}}
      if(b===2&&it.length){buf[1]=buf[1]+1;badAt=1;}
      if(b===3&&it.length){buf[1]=0xFF;badAt=1;}
      if(b===4){buf=buf.slice(0,Math.max(0,buf.length-3));role=role.slice(0,buf.length);}
      var n=buf.length;
      /* 長さを確かめる解析（tlv_next と sensor_parse） */
      var good=[],i=0,stop="",gEnd=0;
      while(true){if(i===n){stop='<span class="ok">最後まで読めた（0）</span>';break;}
        if(n-i<2){stop='<span class="warn">位置 '+i+" で止めた（-1）: 型と長さの 2 バイトが無い</span>";break;}
        var L=buf[i+1];if(L>n-i-2){stop='<span class="warn">位置 '+i+" で止めた（-1）: 長さ "+L+" が残り "+(n-i-2)+" バイトを越える</span>";break;}
        var v=buf.slice(i+2,i+2+L),mm=meaning(buf[i],v);good.push({a:i,b:i+1+L,m:mm});
        if(/-1/.test(mm)){stop='<span class="warn">型の決まりと違う長さなので止めた（-1）</span>';break;}
        i+=2+L;}
      gEnd=i;
      /* 長さを確かめない解析 */
      var naive=[],j=0,out=null;
      while(j<n){var Lb=(j+1<n)?buf[j+1]:null;
        if(Lb===null){out={a:j+1,b:j+1};naive.push({a:j,b:j+1,m:"長さを配列の外から読んだ"});break;}
        var e=j+1+Lb;naive.push({a:j,b:e,m:e>=n?"値の途中から配列の外":meaning(buf[j],buf.slice(j+2,j+2+Lb))});
        if(e>=n){out={a:n,b:e};break;}j=e+1;}
      /* 描く */
      var cw=28,x0=14,y=34,ext=out?Math.min(out.b-n+1,24):0,W=x0*2+(n+ext+1)*cw,o=[];
      var col={t:"signal",l:"purple",v:"green",u:"muted"};
      o.push(S.T(x0,20,"届いた列（"+n+" バイト）","start",10.5,"ink",true));
      buf.forEach(function(v,k){var bad=(k===badAt),c=bad?"alias":col[role[k]];o.push(S.RECT(x0+k*cw+1,y,cw-2,22,3,U.soft(c),c,bad?2:1.1));o.push(S.T(x0+k*cw+cw/2,y+15,U.fmt.hex(v),"middle",10,bad?"alias":"ink",bad,true));});
      for(var q=n;q<n+ext;q++){o.push(S.RECT(x0+q*cw+1,y,cw-2,22,3,"none","faint",1,"2 3"));o.push(S.T(x0+q*cw+cw/2,y+15,"??","middle",9.5,"faint",false,true));}
      if(ext)o.push(S.T(x0+(n+ext/2)*cw,y+40,"配列の外（ほかの変数などの場所）","middle",9.5,"alias"));
      o.push(S.L(x0+n*cw,y-8,x0+n*cw,y+30,"alias",1.2,"4 3"));
      function brs(list,yy,c,title){o.push(S.T(x0,yy-10,title,"start",10,c,true));
        list.forEach(function(g){var xa=x0+g.a*cw+2,xb=x0+(Math.min(g.b,n+ext-1)+1)*cw-2;o.push(S.W([xa,yy-4,xa,yy,xb,yy,xb,yy-4],g.b>=n?"alias":c,1.5));});}
      brs(good,y+72,"green","長さを確かめる解析");
      if(gEnd<n)o.push(S.T(x0+gEnd*cw+cw/2,y+88,"ここで止める","middle",9.5,"green",true));
      brs(naive,y+122,"alias","長さを確かめない解析");
      box.set(S.svg(W,y+136,o));
      ro.innerHTML="<b>長さを確かめる解析</b>: "+(good.length?good.map(function(g){return g.m;}).join("、"):"（読めた項目なし）")+" → "+stop+"<br>"+
        "<b>長さを確かめない解析</b>: "+naive.map(function(g){return g.m;}).join("、")+(out?' → <span class="warn">配列の外を '+(out.b-out.a+1)+" バイト読んだ（C なら、ほかの変数の値を読むか、例外で止まる）</span>":' → <span class="ok">配列の外は読まなかった</span>');
    }
    draw();
  };
