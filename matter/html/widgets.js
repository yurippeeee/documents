/* Matter — 章内インタラクティブ部品 */
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

  /* ---------- 共有ロジック: オンボーディングコード ---------- */
  var B38="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-.";
  function b38enc(bytes){
    var out="",i=0;
    while(i<bytes.length){
      var rem=bytes.length-i,n,ch;
      if(rem>=3){n=bytes[i]|(bytes[i+1]<<8)|(bytes[i+2]<<16);ch=5;i+=3;}
      else if(rem===2){n=bytes[i]|(bytes[i+1]<<8);ch=4;i+=2;}
      else{n=bytes[i];ch=2;i+=1;}
      for(var k=0;k<ch;k++){out+=B38[n%38];n=Math.floor(n/38);}
    }
    return out;
  }
  function b38dec(s){
    var out=[],i=0;
    while(i<s.length){
      var rem=s.length-i,ch,nb;
      if(rem>=5){ch=5;nb=3;}else if(rem===4){ch=4;nb=2;}else if(rem===2){ch=2;nb=1;}else return null;
      var n=0;
      for(var k=ch-1;k>=0;k--){var d=B38.indexOf(s[i+k]);if(d<0)return null;n=n*38+d;}
      for(k=0;k<nb;k++){out.push(n&0xFF);n=Math.floor(n/256);}
      i+=ch;
    }
    return out;
  }
  function packBits(fields,nbytes){
    var bytes=new Array(nbytes).fill(0),off=0;
    fields.forEach(function(fl){
      var v=fl[0],n=fl[1];
      for(var b=0;b<n;b++){
        if((Math.floor(v/Math.pow(2,b)))&1) bytes[(off+b)>>3]|=(1<<((off+b)&7));
      }
      off+=n;
    });
    return bytes;
  }
  function unpackBits(bytes,widths){
    var off=0,out=[];
    widths.forEach(function(n){
      var v=0;
      for(var b=0;b<n;b++){if((bytes[(off+b)>>3]>>((off+b)&7))&1) v+=Math.pow(2,b);}
      off+=n;out.push(v);
    });
    return out;
  }
  function qrEncode(o){
    return "MT:"+b38enc(packBits([[o.version||0,3],[o.vid,16],[o.pid,16],
      [o.flow||0,2],[o.cap,8],[o.discriminator,12],[o.passcode,27],[0,4]],11));
  }
  function qrDecode(s){
    s=String(s).trim().toUpperCase();
    if(s.indexOf("MT:")===0)s=s.slice(3);
    if(s.length!==19)return {error:"長さが 19 文字ではありません（現在 "+s.length+" 文字）"};
    var b=b38dec(s);
    if(!b)return {error:"Base38 に無い文字が含まれています"};
    var v=unpackBits(b,[3,16,16,2,8,12,27,4]);
    return {version:v[0],vid:v[1],pid:v[2],flow:v[3],cap:v[4],discriminator:v[5],passcode:v[6],bytes:b};
  }
  var VD=[[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
          [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
          [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
          [9,8,7,6,5,4,3,2,1,0]];
  var VP=[[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
          [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
          [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  var VINV=[0,4,3,2,1,5,6,7,8,9];
  function verhoeff(s){var c=0,r=s.split("").reverse();
    for(var i=0;i<r.length;i++)c=VD[c][VP[(i+1)%8][+r[i]]];return VINV[c];}
  function verhoeffOk(s){var c=0,r=s.split("").reverse();
    for(var i=0;i<r.length;i++)c=VD[c][VP[i%8][+r[i]]];return c===0;}
  function pad(n,w){var s=String(n);while(s.length<w)s="0"+s;return s;}
  function manualEncode(disc,passcode,vid,pid){
    var withVP=(vid!==undefined&&vid!==null);
    var d1=((withVP?1:0)<<2)|((disc>>10)&0x03);
    var c2=((disc&0x300)<<6)|(passcode&0x3FFF);
    var c3=passcode>>14;
    var s=String(d1)+pad(c2,5)+pad(c3,4);
    if(withVP)s+=pad(vid,5)+pad(pid,5);
    return s+verhoeff(s);
  }
  function manualDecode(code){
    code=String(code).replace(/[^0-9]/g,"");
    if(code.length!==11&&code.length!==21)
      return {error:"11 桁または 21 桁である必要があります（現在 "+code.length+" 桁）"};
    if(!verhoeffOk(code))return {error:"チェックディジットが一致しません（入力ミスの可能性）"};
    var d1=+code[0],c2=+code.slice(1,6),c3=+code.slice(6,10);
    var disc=((d1&0x03)<<10)|((c2>>6)&0x300);
    var r={shortDiscriminator:(disc>>8)&0xF,passcode:(c2&0x3FFF)|(c3<<14),hasVidPid:!!(d1&0x04)};
    if(code.length===21){r.vid=+code.slice(10,15);r.pid=+code.slice(15,20);}
    return r;
  }
  var REG={};

  /* ---------- 01: 組み合わせ爆発 ---------- */
  REG.ecosystem=function(el){
    head(el,"n×m → n+m","共通言語が 1 つあれば実装は足し算になる");
    var cv=screen(el,250),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"メーカー数 n",1,12,6,1);
    var sm=slider(row,"エコシステム数 m",1,8,4,1);
    var sw=checkbox(row,"Matter を使う",false);
    var out=readout(el);
    function draw(){
      var n=+sn.input.value,m=+sm.input.value,useM=sw.checked;
      sn.val.textContent=n;sm.val.textContent=m;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var lx=w*0.18,rx=w*0.82,mx=w*0.5;
      var ly=[],ry=[];
      for(var i=0;i<n;i++)ly.push(34+(h-70)*(n===1?0.5:i/(n-1)));
      for(i=0;i<m;i++)ry.push(34+(h-70)*(m===1?0.5:i/(m-1)));
      ctx.lineWidth=1;
      if(useM){
        ctx.strokeStyle=C("--signal");ctx.globalAlpha=.75;
        for(i=0;i<n;i++){ctx.beginPath();ctx.moveTo(lx,ly[i]);ctx.lineTo(mx,h/2);ctx.stroke();}
        for(i=0;i<m;i++){ctx.beginPath();ctx.moveTo(mx,h/2);ctx.lineTo(rx,ry[i]);ctx.stroke();}
        ctx.globalAlpha=1;
        ctx.fillStyle=C("--signal");rrect(ctx,mx-34,h/2-15,68,30,8);ctx.fill();
        lab(ctx,"Matter",mx,h/2+4,"#fff","center",12);
      }else{
        ctx.strokeStyle=C("--alias");ctx.globalAlpha=.35;
        for(i=0;i<n;i++)for(var j=0;j<m;j++){
          ctx.beginPath();ctx.moveTo(lx,ly[i]);ctx.lineTo(rx,ry[j]);ctx.stroke();}
        ctx.globalAlpha=1;
      }
      for(i=0;i<n;i++){ctx.fillStyle=C("--blue");ctx.beginPath();ctx.arc(lx,ly[i],6,0,TAU);ctx.fill();}
      for(i=0;i<m;i++){ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(rx,ry[i],6,0,TAU);ctx.fill();}
      lab(ctx,"メーカー "+n+" 社",lx,18,C("--blue"),"center");
      lab(ctx,"エコシステム "+m+" 個",rx,18,C("--alias"),"center");
      var cnt=useM?(n+m):(n*m);
      out.innerHTML='必要な実装の数 = <b class="'+(useM?"ok":"warn")+'">'+cnt+'</b>'+
        '（'+(useM?('n + m = '+n+' + '+m):('n × m = '+n+' × '+m))+'）'+
        ' ／ 従来方式なら <b class="warn">'+(n*m)+'</b>、Matter なら <b class="ok">'+(n+m)+'</b>'+
        ' ／ '+(useM?'<span class="ok">メーカーは 1 回実装すれば全エコシステムで動く</span>'
                   :'<span class="warn">エコシステムが増えるたびに全社が実装を追加する必要がある</span>');
    }
    sn.input.addEventListener("input",draw);sm.input.addEventListener("input",draw);
    sw.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 02: レイヤ構造 ---------- */
  REG.stack=function(el){
    head(el,"Layers","IPv6 のところで一本化される");
    var row=ctrls(el);
    var sl=select(row,"下位リンク",["Wi-Fi","Thread","Ethernet","BLE（コミッショニングのみ）"]);
    var out=panel(el);
    var LAYERS=[
      ["アプリケーション","機器のロジック（電球を点ける）","—"],
      ["データモデル","Endpoint / Cluster / Attribute / Command / Event","07-08"],
      ["インタラクションモデル","Read / Write / Invoke / Subscribe","09-10"],
      ["アクション（フレーミング）","TLV でシリアライズ","17"],
      ["セキュリティ","AES-CCM でセッション暗号化・認証","11-14"],
      ["メッセージング","Matter メッセージ、MRP で信頼性","06"],
      ["トランスポート",null,"06"],
      ["ネットワーク",null,"03"],
      ["リンク",null,"04-05"]
    ];
    function draw(){
      var k=+sl.value;
      var transport=["UDP (5540)","UDP (5540)","UDP (5540)","BTP（GATT 上）"][k];
      var network=["IPv6","IPv6 + 6LoWPAN","IPv6","（IP なし）"][k];
      var linkl=["802.11 Wi-Fi","802.15.4","802.3 Ethernet","Bluetooth LE"][k];
      var rows=LAYERS.map(function(L,i){
        var content=L[1];
        if(L[0]==="トランスポート")content=transport;
        if(L[0]==="ネットワーク")content=network;
        if(L[0]==="リンク")content=linkl;
        var shared=(i<=5)||(k!==3&&i===6)||(k!==3&&i===7);
        return ['<b>'+L[0]+'</b>',
                '<span style="color:'+(shared?"var(--ink)":"var(--alias)")+'">'+content+'</span>',
                '<span style="color:var(--faint)">'+L[2]+'</span>'];
      });
      var h=tbl(["層","内容","章"],rows);
      h+='<div style="margin-top:.6rem;color:var(--muted)">'+
        (k===3?'<span class="warn">BLE は IP を持たないので BTP で Matter メッセージを運ぶ。コミッショニング時のみ使う。</span>'
              :'<span class="ok">IPv6 より上は、下位リンクが何であってもまったく同じコードが動く。</span>')+'</div>';
      out.innerHTML=h;
    }
    sl.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 02: 1 つの操作を追う ---------- */
  REG.trace=function(el){
    head(el,"Trace","「電球を点ける」が各層でどうなるか");
    var row=ctrls(el);
    var ss=slider(row,"ステップ",1,11,11,1);
    var out=panel(el);
    var STEPS=[
      ["アプリ","ユーザーが「点ける」をタップ"],
      ["データモデル","対象を特定: Node 0x1234 / Endpoint 1 / Cluster 0x0006 / Command 0x01 (On)"],
      ["インタラクション","Invoke Request を構築"],
      ["アクション","TLV でエンコード（バイナリ）"],
      ["セキュリティ","CASE セッション鍵で AES-CCM 暗号化＋MIC 付与"],
      ["メッセージング","Matter メッセージヘッダ、MRP で ACK を要求"],
      ["トランスポート","UDP ポート 5540 へ"],
      ["ネットワーク","IPv6 パケットとして送出（宛先は DNS-SD で解決済み）"],
      ["リンク","Wi-Fi / Thread で物理的に飛ぶ"],
      ["（機器側）","逆順に処理され、リレーが ON になる"],
      ["応答","Invoke Response + MRP ACK。購読していれば OnOff 属性の Report も飛ぶ"]
    ];
    function draw(){
      var n=+ss.input.value;ss.val.textContent=n+" / 11";
      var h="";
      STEPS.forEach(function(s,i){
        var on=(i<n),cur=(i===n-1);
        h+='<div style="padding:.3rem .6rem;margin-bottom:.2rem;border-radius:6px;'+
           (cur?'background:var(--signal);color:#fff':
                (on?'background:var(--signal-soft)':'opacity:.35'))+'">'+
           '<b style="display:inline-block;min-width:9.5em">'+(i+1)+'. '+s[0]+'</b> '+esc(s[1])+'</div>';
      });
      out.innerHTML=h;
    }
    ss.input.addEventListener("input",draw);reg(null,draw);draw();
  };

  /* ---------- 03: IPv6 アドレスの分解 ---------- */
  REG.ipv6=function(el){
    head(el,"IPv6","アドレスの種類で到達範囲が決まる");
    var row=ctrls(el);
    var ip=textin(row,"IPv6 アドレス","fd11:2233:4455:0001:0011:2233:4455:6677","100%");
    var sp=select(row,"例を選ぶ",["（手入力）","リンクローカル fe80::…","ULA（Thread Mesh-Local）","ULA（OMR）",
      "グローバル 2001:db8::…","mDNS マルチキャスト ff02::fb","Thread の mDNS ff03::fb","全ノード ff02::1"]);
    var EX=["","fe80::1a2b:3c4d:5e6f:7a8b","fd11:2233:4455:0001:0011:2233:4455:6677",
      "fd8c:1234:5678:1::a1b2:c3d4:e5f6:0708","2001:db8:85a3::8a2e:370:7334","ff02::fb","ff03::fb","ff02::1"];
    var out=panel(el),rd=readout(el);
    function expand(s){
      s=s.trim().toLowerCase();
      if(s.indexOf("::")>=0){
        var parts=s.split("::");
        var a=parts[0]?parts[0].split(":"):[],b=parts[1]?parts[1].split(":"):[];
        var fill=8-a.length-b.length;
        if(fill<0)return null;
        var g=a.concat(new Array(fill).fill("0"),b);
        return g.map(function(x){return pad(parseInt(x||"0",16).toString(16),4);});
      }
      var g2=s.split(":");
      if(g2.length!==8)return null;
      return g2.map(function(x){return pad(parseInt(x,16).toString(16),4);});
    }
    function classify(g){
      var first=parseInt(g[0],16);
      if((first&0xFFC0)===0xFE80)return {t:"リンクローカル (LLA)",scope:"同一リンク内のみ",
        note:"ルータを越えない。使うときはスコープ ID（%eth0 など）が必須",col:"--blue"};
      if((first&0xFE00)===0xFC00)return {t:"ユニークローカル (ULA)",scope:"サイト内（家庭内）",
        note:"Matter の主戦場。Thread の Mesh-Local / OMR がこれ",col:"--signal"};
      if((first&0xFF00)===0xFF00){
        var sc=(parseInt(g[0],16))&0x000F;
        var sn={1:"インタフェースローカル",2:"リンクローカル",3:"サイト（Thread のメッシュ全体）",
                4:"管理ローカル",5:"サイトローカル",8:"組織",14:"グローバル"}[sc]||("スコープ "+sc);
        return {t:"マルチキャスト",scope:sn,
          note:"ff02::fb = mDNS（リンク内）／ ff03::fb = mDNS（Thread のメッシュ全体）。この 2 つを橋渡しするのが Border Router",col:"--alias"};
      }
      if((first&0xE000)===0x2000)return {t:"グローバル (GUA)",scope:"インターネット全体",
        note:"ISP から配られていれば使える。Matter に必須ではない",col:"--alias"};
      if(g.join("")==="00000000000000000000000000000001")
        return {t:"ループバック",scope:"自ノード",note:"::1",col:"--faint"};
      return {t:"その他",scope:"—",note:"",col:"--faint"};
    }
    function draw(){
      var g=expand(ip.value);
      if(!g){out.innerHTML='<span class="warn">アドレスの形式が正しくありません</span>';rd.innerHTML="";return;}
      var cl=classify(g);
      var net=g.slice(0,4).join(":"),iid=g.slice(4).join(":");
      var h='<div style="letter-spacing:.06em;font-size:.95rem">'+
        '<span style="color:var(--signal);font-weight:700">'+net+'</span>'+
        '<span style="color:var(--faint)">:</span>'+
        '<span style="color:var(--alias);font-weight:700">'+iid+'</span></div>';
      h+='<div style="color:var(--muted);margin-top:.2rem">'+
        '<span style="color:var(--signal)">■</span> ネットワーク部（上位 64 bit）　'+
        '<span style="color:var(--alias)">■</span> インタフェース ID（下位 64 bit）</div>';
      h+='<div style="margin-top:.6rem">'+tbl(["項目","値"],[
        ["種類",'<b style="color:var('+cl.col+')">'+cl.t+'</b>'],
        ["到達範囲",cl.scope],
        ["先頭 16 bit（2 進）",pad(parseInt(g[0],16).toString(2),16).replace(/(.{4})/g,"$1 ")],
        ["完全表記",g.join(":")]
      ])+'</div>';
      out.innerHTML=h;
      rd.innerHTML=cl.note||"—";
    }
    ip.addEventListener("input",function(){sp.value=0;draw();});
    sp.addEventListener("change",function(){if(+sp.value>0){ip.value=EX[+sp.value];draw();}});
    reg(null,draw);draw();
  };

  /* ---------- 03: マルチキャストの到達 ---------- */
  REG.mcast=function(el){
    head(el,"Multicast","Border Router がスコープを橋渡しする");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sb=checkbox(row,"Border Router が mDNS を中継する",true);
    var ss=select(row,"送信元",["スマホ（Wi-Fi）が ff02::fb でクエリ","Thread 機器が ff03::fb で応答"]);
    var out=readout(el);
    function draw(){
      var relay=sb.checked,src=+ss.value;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var phone={x:w*0.13,y:h*0.30},rtr={x:w*0.40,y:h*0.30},br={x:w*0.62,y:h*0.5};
      var th=[{x:w*0.85,y:h*0.22},{x:w*0.90,y:h*0.52},{x:w*0.82,y:h*0.80}];
      function node(p,label,col,r){
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,r||13,0,TAU);ctx.fill();
        lab(ctx,label,p.x,p.y+(r||13)+14,C("--muted"),"center");
      }
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(phone.x,phone.y);ctx.lineTo(rtr.x,rtr.y);
      ctx.moveTo(rtr.x,rtr.y);ctx.lineTo(br.x,br.y);ctx.stroke();
      ctx.strokeStyle=C("--signal-soft");ctx.lineWidth=1.4;
      th.forEach(function(t){ctx.beginPath();ctx.moveTo(br.x,br.y);ctx.lineTo(t.x,t.y);ctx.stroke();});
      // 到達を描く
      var reach = relay;
      ctx.lineWidth=3;ctx.strokeStyle=reach?C("--signal"):C("--alias");
      ctx.setLineDash(reach?[]:[5,4]);
      if(src===0){
        ctx.beginPath();ctx.moveTo(phone.x,phone.y);ctx.lineTo(rtr.x,rtr.y);ctx.lineTo(br.x,br.y);ctx.stroke();
        if(reach)th.forEach(function(t){ctx.beginPath();ctx.moveTo(br.x,br.y);ctx.lineTo(t.x,t.y);ctx.stroke();});
      }else{
        th.forEach(function(t){ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(br.x,br.y);ctx.stroke();});
        if(reach){ctx.beginPath();ctx.moveTo(br.x,br.y);ctx.lineTo(rtr.x,rtr.y);ctx.lineTo(phone.x,phone.y);ctx.stroke();}
      }
      ctx.setLineDash([]);
      node(phone,"スマホ",C("--blue"));
      node(rtr,"ルータ",C("--faint"));
      node(br,"Border Router",relay?C("--signal"):C("--alias"),16);
      th.forEach(function(t,i){node(t,["電球","センサー","ロック"][i],C("--signal"),10);});
      lab(ctx,"Wi-Fi 側: ff02::fb（リンクローカル）",w*0.03,18,C("--muted"),"left");
      lab(ctx,"Thread 側: ff03::fb（サイト）",w-8,18,C("--muted"),"right");
      out.innerHTML=(relay
        ?'<span class="ok">Border Router が ff02::fb ↔ ff03::fb を中継しているので、スマホから Thread 機器が見える</span>'
        :'<span class="warn">中継がないと、Wi-Fi 側の mDNS は Thread のメッシュに届かない → 「機器が見つかりません」</span>')+
        ' ／ Thread 機器は SRP で Border Router にサービス登録し、BR が代理で mDNS を広告する（06 章）'+
        ' ／ 確認: <code>ot-ctl srp server service</code>';
    }
    sb.addEventListener("change",draw);ss.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 04: Thread のトポロジ ---------- */
  REG.thread=function(el){
    head(el,"Thread Mesh","役割で中継と消費電力が決まる");
    var cv=screen(el,270),cc=cctx(cv);var row=ctrls(el);
    var sr=slider(row,"Router の数",1,8,4,1);
    var se=slider(row,"End Device の数",0,14,8,1);
    var ss=slider(row,"うち SED（電池）の割合 %",0,100,60,10);
    var sf=checkbox(row,"Router を 1 台停止させる",false);
    var out=readout(el);
    function draw(){
      var nr=+sr.input.value,ne=+se.input.value,sp=+ss.input.value/100,fail=sf.checked;
      sr.val.textContent=nr;se.val.textContent=ne;ss.val.textContent=(sp*100)+"%";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var cx=w/2,cy=h/2+6,R=Math.min(w,h)*0.26;
      var rp=[];
      for(var i=0;i<nr;i++){var a=-Math.PI/2+TAU*i/nr;rp.push({x:cx+R*Math.cos(a),y:cy+R*Math.sin(a),dead:(fail&&i===1)});}
      // Router 間のメッシュ
      ctx.lineWidth=1.6;
      for(i=0;i<nr;i++)for(var j=i+1;j<nr;j++){
        var dead=rp[i].dead||rp[j].dead;
        ctx.strokeStyle=dead?C("--grid"):C("--signal-soft");
        ctx.beginPath();ctx.moveTo(rp[i].x,rp[i].y);ctx.lineTo(rp[j].x,rp[j].y);ctx.stroke();
      }
      // End Device
      var orphan=0;
      for(i=0;i<ne;i++){
        var a2=-Math.PI/2+TAU*i/Math.max(ne,1)+0.2;
        var R2=R*1.85;
        var ex=cx+R2*Math.cos(a2),ey=cy+R2*Math.sin(a2)*0.82;
        var parent=rp[i%nr];
        var isSED=(i/Math.max(ne,1))<sp;
        if(parent.dead)orphan++;
        ctx.strokeStyle=parent.dead?C("--alias"):C("--grid");
        ctx.lineWidth=parent.dead?2:1.2;
        if(parent.dead)ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(parent.x,parent.y);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=parent.dead?C("--alias"):(isSED?C("--blue"):C("--faint"));
        ctx.beginPath();ctx.arc(ex,ey,6,0,TAU);ctx.fill();
      }
      rp.forEach(function(p,i){
        ctx.fillStyle=p.dead?C("--alias"):(i===0?C("--signal"):C("--faint"));
        ctx.beginPath();ctx.arc(p.x,p.y,i===0?13:10,0,TAU);ctx.fill();
        if(i===0)lab(ctx,"Leader",p.x,p.y-18,C("--signal"),"center");
        if(p.dead)lab(ctx,"停止",p.x,p.y-16,C("--alias"),"center");
      });
      lab(ctx,"● Leader / Router（常時給電・中継）",8,16,C("--muted"),"left");
      lab(ctx,"● SED（電池・間欠受信）　● 常時給電の End Device",8,30,C("--muted"),"left");
      out.innerHTML='Router '+nr+' 台（上限 32）／ End Device '+ne+' 台（うち SED 約 '+Math.round(ne*sp)+' 台）'+
        ' ／ '+(fail&&orphan>0
          ?'<span class="warn">Router が 1 台落ちると、その子 '+orphan+' 台は通信不能になり、新しい親を探す（Reattach）</span>'
          :(nr<2?'<span class="warn">Router が 1 台だけだと、それが落ちると全滅する。常時給電の Router を複数配置すること</span>'
                :'<span class="ok">Leader が落ちても他の Router が自動的に昇格する。Leader は単一障害点ではない</span>'));
    }
    [sr,se,ss].forEach(function(s){s.input.addEventListener("input",draw);});
    sf.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 04/17: SED の電池寿命 ---------- */
  REG.sedpower=function(el){
    head(el,"Battery Life","ポーリング間隔が寿命を支配する");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sp=slider(row,"ポーリング間隔（秒）",0.2,60,5,0.2);
    var sa=slider(row,"1 回の起動時間（ms）",1,50,6,1);
    var si=slider(row,"起動時の電流（mA）",1,30,5,0.5);
    var sq=slider(row,"スリープ電流（µA）",0.5,20,2,0.5);
    var sb=select(row,"電池",["CR2032 (220 mAh)","CR123A (1500 mAh)","単三×2 (2000 mAh)","単四×2 (1000 mAh)"]);
    var out=readout(el);
    var CAP=[220,1500,2000,1000];
    function avgUA(T,tms,Ima,Isl){
      return Isl + (tms/1000)/T*(Ima*1000 - Isl);
    }
    function draw(){
      var T=+sp.input.value,tms=+sa.input.value,Ima=+si.input.value,Isl=+sq.input.value;
      var cap=CAP[+sb.value];
      sp.val.textContent=f(T,1)+" s";sa.val.textContent=tms+" ms";
      si.val.textContent=f(Ima,1)+" mA";sq.val.textContent=f(Isl,1)+" µA";
      var c=chart(cc,0.2,60,0,10);
      grid(c,4);
      var pts=[],mx=0;
      for(var t=0.2;t<=60;t+=0.2){
        var ua=avgUA(t,tms,Ima,Isl);
        var yrs=cap*0.75/(ua/1000)/8760;
        pts.push([t,Math.min(yrs,10)]);if(yrs>mx)mx=yrs;
      }
      line(c,pts,C("--signal"),2.6);
      axis(c);
      var ua=avgUA(T,tms,Ima,Isl), yrs=cap*0.75/(ua/1000)/8760;
      c.ctx.strokeStyle=C("--faint");c.ctx.setLineDash([5,4]);
      c.ctx.beginPath();c.ctx.moveTo(c.p.l,c.Y(2));c.ctx.lineTo(c.w-c.p.r,c.Y(2));c.ctx.stroke();c.ctx.setLineDash([]);
      c.ctx.strokeStyle=C("--alias");c.ctx.lineWidth=1.6;c.ctx.setLineDash([4,3]);
      c.ctx.beginPath();c.ctx.moveTo(c.X(T),c.p.t);c.ctx.lineTo(c.X(T),c.h-c.p.b);c.ctx.stroke();c.ctx.setLineDash([]);
      dot(c,T,Math.min(yrs,10),5,C("--alias"));
      var ctx=c.ctx;
      lab(ctx,"電池寿命（年）",c.p.l+2,c.p.t+24,C("--muted"),"left");
      lab(ctx,"ポーリング間隔（秒）",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"2 年",c.p.l-6,c.Y(2)+4,C("--muted"),"right");
      lab(ctx,"10 年+",c.p.l-6,c.Y(10)+4,C("--muted"),"right");
      out.innerHTML='平均電流 = '+f(Isl,1)+' µA + ('+tms+'ms/'+f(T,1)+'s)×'+f(Ima,1)+'mA = <b>'+f(ua,2)+' µA</b>'+
        ' ／ 寿命 ≈ '+cap+' mAh × 0.75 / '+f(ua,2)+' µA = <b class="'+(yrs>=2?"ok":"warn")+'">'+f(yrs,2)+' 年</b>'+
        ' ／ 下り方向の最悪レイテンシ ≈ <b>'+f(T,1)+' 秒</b>'+
        ' ／ '+(T<2?'<span class="warn">応答は速いが電池が持たない。ドアロックなど即応性が要る機器向け</span>'
              :(T>20?'<span class="ok">電池は持つが応答が遅い。センサーなど上り主体の機器向け</span>'
                    :'<span class="ok">バランス型</span>'))+
        ' ／ <span class="warn">この試算は必ず実測で検証すること（再送・OTA・低温は含まれていない）</span>';
    }
    [sp,sa,si,sq].forEach(function(s){s.input.addEventListener("input",draw);});
    sb.addEventListener("change",draw);reg(cv,draw);
  };

  /* ---------- 05: ネットワークの選び方 ---------- */
  REG.netchoice=function(el){
    head(el,"Which Network?","要件を入れると推奨が決まる");
    var row=ctrls(el);
    var b1=checkbox(row,"電池駆動である",true);
    var b2=checkbox(row,"下り方向の即応性が要る（ロック等）",false);
    var b3=checkbox(row,"大きなデータを流す（映像・音声）",false);
    var b4=checkbox(row,"有線を引ける据置機器",false);
    var b5=checkbox(row,"ユーザーにハブ（Border Router）を要求できる",true);
    var b6=checkbox(row,"既存 Wi-Fi 製品の Matter 化",false);
    var out=panel(el),rd=readout(el);
    function draw(){
      var rec,why;
      if(b4.checked){rec="Ethernet";why="有線が引けるなら最も安定。マルチキャストの問題も起きにくい。ハブ・ブリッジ・据置機器向け。";}
      else if(b6.checked){rec="Wi-Fi";why="既存のハードを変えずに Matter 対応できる可能性がある。ハブも不要。";}
      else if(b3.checked){rec="Wi-Fi";why="Thread は 250 kbps しかない。映像・音声には帯域が足りない。";}
      else if(b1.checked){
        if(!b5.checked){rec="Thread（ただし要検討）";why="電池駆動なら Thread 一択だが、Border Router が必須。ハブを要求できないなら、Wi-Fi + 完全切断の間欠動作という苦しい設計になる。";}
        else if(b2.checked){rec="Thread（SED・短いポーリング）";why="電池駆動で即応性も要るなら Thread。ポーリング間隔を短めにし、電池寿命を実測で確認する。";}
        else {rec="Thread（SED・長いポーリング）";why="電池寿命を最優先。ポーリング間隔を長くすれば数年持つ。上り主体のセンサー向け。";}
      }
      else if(b5.checked){rec="Thread";why="常時給電でハブを要求できるなら、メッシュによる到達範囲の拡大が効く。多数配置に有利。";}
      else {rec="Wi-Fi";why="ハブ不要で導入障壁が低い。ただし電池駆動はほぼ不可。";}
      var rows=[
        ["電池駆動","ほぼ不可","<b>○</b>","不可"],
        ["スループット","高い","250 kbps","高い"],
        ["到達範囲","ルータ次第","<b>メッシュで拡張</b>","ケーブル次第"],
        ["ハブ（Border Router）","不要","<b class='warn'>必要</b>","不要"],
        ["設置の手軽さ","○","○","×"],
        ["ネットワークトラブル","起きやすい","BR 依存","少ない"]
      ];
      out.innerHTML='<div style="margin-bottom:.5rem">推奨: <b class="ok" style="font-size:1.1rem">'+rec+'</b></div>'+
        '<div style="color:var(--muted);margin-bottom:.6rem">'+why+'</div>'+
        tbl(["観点","Wi-Fi","Thread","Ethernet"],rows);
      rd.innerHTML='<span class="warn">ネットワークの選択は基板を起こす前に決めること。あとから変えられない。</span>'+
        ' ／ 両方のモデルを出すメーカーも多い（SDK は共通なのでアプリ層は使い回せる）';
    }
    [b1,b2,b3,b4,b5,b6].forEach(function(b){b.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 06: DNS-SD レコード ---------- */
  REG.dnssd=function(el){
    head(el,"DNS-SD","サービス名と TXT レコードを組み立てる");
    var row=ctrls(el);
    var sm=select(row,"サービス",["_matterc._udp（コミッショニング可）","_matter._tcp（運用中）","_matterd._udp（コミッショナ）"]);
    var sd=slider(row,"Discriminator",0,4095,3840,1);
    var sf=textin(row,"Compressed Fabric ID (16 hex)","DEDEDEDE00010001","100%");
    var sn=textin(row,"Node ID (16 hex)","0000000000000042","100%");
    var si=slider(row,"SII（ms）",100,3600000,500,100);
    var sa=slider(row,"SAI（ms）",100,3600000,300,100);
    var out=panel(el),rd=readout(el);
    function draw(){
      var mode=+sm.value,disc=+sd.input.value,sii=+si.input.value,sai=+sa.input.value;
      sd.val.textContent=disc+" (0x"+disc.toString(16).toUpperCase()+")";
      si.val.textContent=sii+" ms";sa.val.textContent=sai+" ms";
      var srv=["_matterc._udp","_matter._tcp","_matterd._udp"][mode];
      var inst,sub=[],txt=[];
      if(mode===1){
        inst=(sf.value.toUpperCase().replace(/[^0-9A-F]/g,"")+"----------------").slice(0,16)+"-"+
             (sn.value.toUpperCase().replace(/[^0-9A-F]/g,"")+"0000000000000000").slice(0,16);
        txt=[["SII",sii],["SAI",sai],["SAT",4000],["T",0]];
      }else{
        inst="<ランダムな 16 進 16 桁>";
        sub=["_S"+((disc>>8)&0xF),"_L"+disc,"_V65521","_T257","_CM"];
        txt=[["D",disc],["VP","65521+32768"],["CM",1],["DT",257],["DN","MyLight"],
             ["SII",sii],["SAI",sai],["SAT",4000]];
      }
      var h='<div style="color:var(--muted)">サービスインスタンス名</div>';
      h+='<div style="word-break:break-all;color:var(--signal);font-weight:700">'+inst+'.'+srv+'.local.</div>';
      if(sub.length){
        h+='<div style="color:var(--muted);margin-top:.5rem">サブタイプ（絞り込み検索に使う）</div>';
        h+='<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.2rem">'+
          sub.map(function(s){return '<span style="background:var(--signal-soft);padding:.1rem .5rem;border-radius:5px">'+
            s+'.'+srv+'</span>';}).join("")+'</div>';
      }
      h+='<div style="color:var(--muted);margin-top:.5rem">TXT レコード</div>';
      h+=tbl(["キー","値","意味"],txt.map(function(t){
        var meanings={D:"Discriminator（12 bit 全体）",VP:"VendorID+ProductID",CM:"Commissioning Mode",
          DT:"Device Type",DN:"表示名",SII:"Session Idle Interval（相手が寝ているときの再送間隔）",
          SAI:"Session Active Interval（起きているときの再送間隔）",SAT:"Session Active Threshold",
          T:"TCP サポートのビットマップ"};
        return ['<b>'+t[0]+'</b>',String(t[1]),'<span style="color:var(--muted)">'+(meanings[t[0]]||"")+'</span>'];
      }));
      h+='<div style="color:var(--muted);margin-top:.6rem">確認コマンド</div>'+
         '<div style="color:var(--ink)">dns-sd -B '+srv+'　／　avahi-browse -r '+srv+'</div>';
      out.innerHTML=h;
      rd.innerHTML=(mode===1
        ? 'マルチアドミンでは <b>Fabric の数だけ</b> インスタンスが広告される（名前がすべて違う）'
        : '手動ペアリングコードには Short Discriminator（上位 4 bit = <b>'+((disc>>8)&0xF)+
          '</b>）しか入らないので、<code>_S</code> サブタイプが用意されている')+
        ' ／ <span class="warn">SII/SAI を広告しないと、コントローラが短周期で再送して電池を消耗させる</span>';
    }
    [sd,si,sa].forEach(function(s){s.input.addEventListener("input",draw);});
    [sf,sn].forEach(function(t){t.addEventListener("input",draw);});
    sm.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 06: MRP バックオフ ---------- */
  REG.mrp=function(el){
    head(el,"MRP Backoff","再送間隔は相手の SII/SAI で決まる");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);
    var si=slider(row,"基準間隔 i（SII か SAI, ms）",50,10000,500,50);
    var sj=slider(row,"ジッタの実現値 U（0〜1）",0,1,0.5,0.05);
    var out=panel(el),rd=readout(el);
    var MARGIN=1.1,BASE=1.6,THRESH=1,JITTER=0.25,MAXTX=5;
    function draw(){
      var i=+si.input.value,U=+sj.input.value;
      si.val.textContent=i+" ms";sj.val.textContent=f(U,2);
      var t=[],cum=0,cums=[];
      for(var n=0;n<MAXTX-1;n++){
        var dt=i*MARGIN*Math.pow(BASE,Math.max(0,n-THRESH))*(1+U*JITTER);
        t.push(dt);cum+=dt;cums.push(cum);
      }
      var total=cum;
      var c=chart(cc,0,total*1.06,0,1,{l:20,r:16,t:26,b:34});
      var ctx=c.ctx;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.4;
      ctx.beginPath();ctx.moveTo(c.p.l,c.h-c.p.b);ctx.lineTo(c.w-c.p.r,c.h-c.p.b);ctx.stroke();
      // 送信のマーク
      var xs=[0].concat(cums);
      xs.forEach(function(x,k){
        var px=c.X(x),y0=c.h-c.p.b;
        ctx.strokeStyle=k===0?C("--signal"):C("--alias");ctx.lineWidth=2.4;
        ctx.beginPath();ctx.moveTo(px,y0);ctx.lineTo(px,c.p.t+14);ctx.stroke();
        ctx.fillStyle=k===0?C("--signal"):C("--alias");
        ctx.beginPath();ctx.arc(px,c.p.t+14,4,0,TAU);ctx.fill();
        lab(ctx,k===0?"初回":("再送"+k),px,c.p.t+8,k===0?C("--signal"):C("--alias"),"center");
        lab(ctx,f(x/1000,2)+"s",px,c.h-c.p.b+16,C("--muted"),"center");
      });
      lab(ctx,"ACK が来ないまま "+MAXTX+" 回で諦める（合計 "+f(total/1000,2)+" 秒）",
        c.p.l,c.h-c.p.b+30,C("--muted"),"left");
      var rows=t.map(function(dt,n){
        return ["再送 "+(n+1),
          'i × 1.1 × 1.6<sup>max(0, '+n+'−1)</sup> × (1 + '+f(U,2)+'×0.25)',
          f(dt,0)+" ms", f(cums[n]/1000,2)+" s"];
      });
      out.innerHTML=tbl(["","式","待ち時間","初回からの経過"],rows,["left","left","right","right"]);
      rd.innerHTML='定数: MARGIN=1.1、BASE=1.6、THRESHOLD=1、JITTER=0.25、MAX_TRANSMISSIONS=5'+
        ' ／ 合計 <b>'+f(total/1000,2)+' 秒</b>で断念'+
        ' ／ '+(i>=2000?'<span class="warn">相手が長い SII を広告している（電池機器）。全体で数十秒かかる。コントローラのタイムアウトを長めに取る必要がある</span>'
                     :'<span class="ok">THRESHOLD=1 なので最初の 1 回はバックオフなし。ジッタは同時再送の衝突を防ぐ</span>');
    }
    si.input.addEventListener("input",draw);sj.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 07: データモデルのツリー ---------- */
  REG.tree=function(el){
    head(el,"Data Model","Node → Endpoint → Cluster → Attribute");
    var row=ctrls(el);
    var sm=select(row,"機器の例",["調光ライト","3 口の電源タップ","温湿度センサー","ドアロック","ブリッジ（Zigbee 3 台）"]);
    var out=panel(el),rd=readout(el);
    var MODELS=[
      {name:"調光ライト",eps:[
        {id:0,dt:"Root Node (0x0016)",cl:["Descriptor (0x001D)","Basic Information (0x0028)","Access Control (0x001F)","Operational Credentials (0x003E)","General Commissioning (0x0030)","Network Commissioning (0x0031)","OTA Requestor (0x002A)"]},
        {id:1,dt:"Dimmable Light (0x0101)",cl:["Descriptor (0x001D)","Identify (0x0003)","Groups (0x0004)","On/Off (0x0006)","Level Control (0x0008)"]}
      ],note:"最も基本的な構成。Endpoint 1 に機能を載せる。"},
      {name:"3 口の電源タップ",eps:[
        {id:0,dt:"Root Node (0x0016)",cl:["…（ユーティリティ）"]},
        {id:1,dt:"On/Off Plug-in Unit (0x010A)",cl:["Identify","Groups","On/Off"]},
        {id:2,dt:"On/Off Plug-in Unit (0x010A)",cl:["Identify","Groups","On/Off"]},
        {id:3,dt:"On/Off Plug-in Unit (0x010A)",cl:["Identify","Groups","On/Off"]}
      ],note:"独立に制御できる口ごとに Endpoint を分ける。TagList で「左/中/右」を示せる（1.3 以降）。"},
      {name:"温湿度センサー",eps:[
        {id:0,dt:"Root Node (0x0016)",cl:["…（ユーティリティ）","Power Source (0x002F)","ICD Management (0x0046)"]},
        {id:1,dt:"Temperature Sensor (0x0302)",cl:["Identify","Temperature Measurement (0x0402)"]},
        {id:2,dt:"Humidity Sensor (0x0307)",cl:["Identify","Relative Humidity Measurement (0x0405)"]}
      ],note:"温度と湿度は別のデバイスタイプ。Endpoint を分ける。電池機器なので Power Source と ICD Management を載せる。"},
      {name:"ドアロック",eps:[
        {id:0,dt:"Root Node (0x0016)",cl:["…（ユーティリティ）","Power Source (0x002F)","ICD Management (0x0046)"]},
        {id:1,dt:"Door Lock (0x000A)",cl:["Identify","Door Lock (0x0101)"]}
      ],note:"解錠は Timed Interaction が必須（09 章）。LockOperation イベントは Critical 優先度で保持する。"},
      {name:"ブリッジ（Zigbee 3 台）",eps:[
        {id:0,dt:"Root Node (0x0016)",cl:["…（ユーティリティ）"]},
        {id:1,dt:"Aggregator (0x000E)",cl:["Descriptor（PartsList = [2,3,4]）"]},
        {id:2,dt:"Bridged Node (0x0013) + On/Off Light (0x0100)",cl:["Bridged Device Basic Information (0x0039)","Identify","On/Off"]},
        {id:3,dt:"Bridged Node (0x0013) + Temperature Sensor (0x0302)",cl:["Bridged Device Basic Information (0x0039)","Temperature Measurement"]},
        {id:4,dt:"Bridged Node (0x0013) + Contact Sensor (0x0015)",cl:["Bridged Device Basic Information (0x0039)","Boolean State"]}
      ],note:"1 台の Node が複数の配下機器を Endpoint として表現する。Reachable 属性が最重要（19 章）。"}
    ];
    function draw(){
      var M=MODELS[+sm.value];
      var h='<div style="color:var(--muted);margin-bottom:.4rem">Node（1 台の機器）</div>';
      M.eps.forEach(function(ep){
        var isRoot=(ep.id===0);
        h+='<div style="margin-left:1rem;margin-bottom:.5rem;padding-left:.7rem;border-left:2px solid '+
           (isRoot?'var(--faint)':'var(--signal)')+'">';
        h+='<div><b>Endpoint '+ep.id+'</b> — <span style="color:'+(isRoot?'var(--muted)':'var(--signal)')+'">'+
           esc(ep.dt)+'</span></div>';
        ep.cl.forEach(function(c){
          h+='<div style="margin-left:1.2rem;color:var(--muted)">└ Cluster: '+esc(c)+'</div>';
        });
        h+='</div>';
      });
      out.innerHTML=h;
      rd.innerHTML=M.note+' ／ Endpoint 0 は必ず Root Node で、機器全体に関わるユーティリティクラスタが載る';
    }
    sm.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 07: FeatureMap ---------- */
  REG.featuremap=function(el){
    head(el,"FeatureMap","宣言した機能は必ず全部動かすこと");
    var row=ctrls(el);
    var sc=select(row,"クラスタ",["Color Control (0x0300)","Level Control (0x0008)","Door Lock (0x0101)","Window Covering (0x0102)"]);
    var out=panel(el),rd=readout(el);
    var FM=[
      {n:"Color Control",bits:[["HS",0,"色相・彩度で色を指定"],["EHUE",1,"拡張色相（16 bit 精度）"],
        ["CL",2,"色ループ（自動で色が変わる）"],["XY",3,"CIE xy 座標で指定"],["CT",4,"色温度（ミレッド）"]],
        note:"電球が「調色できるか」「色温度だけか」はこれで判別する。コントローラは UI を出し分ける。"},
      {n:"Level Control",bits:[["OO",0,"On/Off と連動"],["LT",1,"点灯（Lighting）用の挙動"],
        ["FQ",2,"周波数"]],note:"照明なら LT を立てる。最小レベルの扱いなどが照明向けに規定される。"},
      {n:"Door Lock",bits:[["PIN",0,"PIN コード対応"],["RID",1,"RFID 対応"],["FGP",2,"指紋"],
        ["LOG",3,"操作ログ"],["WDSCH",4,"曜日スケジュール"],["DPS",5,"ドア位置センサー"],
        ["FACE",6,"顔認証"],["COTA",7,"OTA 経由の認証情報"],["USR",8,"ユーザー管理"]],
        note:"実装しない認証方式のビットを立てると、コントローラが対応する UI を出して失敗する。"},
      {n:"Window Covering",bits:[["LF",0,"リフト（上下）"],["TL",1,"チルト（角度）"],
        ["PA_LF",2,"位置認識（リフト）"],["ABS",3,"絶対位置"],["PA_TL",4,"位置認識（チルト）"]],
        note:"ブラインドかロールカーテンかで、対応するビットが変わる。"}
    ];
    var state={};
    function draw(){
      var M=FM[+sc.value];
      if(!state[M.n])state[M.n]=M.bits.map(function(b,i){return i<2;});
      var st=state[M.n];
      var v=0;st.forEach(function(on,i){if(on)v|=(1<<M.bits[i][1]);});
      var h='<div style="color:var(--muted);margin-bottom:.4rem">'+M.n+' の FeatureMap（属性 0xFFFC）</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.6rem">';
      M.bits.forEach(function(b,i){
        h+='<button data-i="'+i+'" style="cursor:pointer;font-family:var(--mono);font-size:.78rem;'+
           'padding:.25rem .6rem;border-radius:6px;border:1px solid '+(st[i]?'var(--signal)':'var(--line)')+';'+
           'background:'+(st[i]?'var(--signal)':'var(--panel)')+';color:'+(st[i]?'#fff':'var(--muted)')+'">'+
           'bit'+b[1]+' '+b[0]+'</button>';
      });
      h+='</div>';
      h+=tbl(["ビット","名前","意味","状態"],M.bits.map(function(b,i){
        return ['bit '+b[1],'<b>'+b[0]+'</b>',b[2],
          st[i]?'<b class="ok">対応と宣言</b>':'<span style="color:var(--faint)">非対応</span>'];
      }));
      h+='<div style="margin-top:.6rem">FeatureMap = <b class="ok">0x'+pad(v.toString(16).toUpperCase(),8)+
         '</b>（2 進 '+pad(v.toString(2),Math.max(8,M.bits.length))+'）</div>';
      out.innerHTML=h;
      out.querySelectorAll("button").forEach(function(b){
        b.addEventListener("click",function(){st[+b.dataset.i]=!st[+b.dataset.i];draw();});
      });
      rd.innerHTML=M.note+
        ' ／ <span class="warn">宣言したビットに対応する属性・コマンドが動かないと、認証テストで確実に落ちる（22 章）</span>';
    }
    sc.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 08: クラスタのカタログ ---------- */
  REG.clusters=function(el){
    head(el,"Cluster Catalog","よく使うクラスタを引く");
    var row=ctrls(el);
    var q=textin(row,"検索（名前・ID・用途）","","100%");
    var sg=select(row,"分類",["すべて","ユーティリティ（Endpoint 0）","汎用アプリケーション","センサー","住宅設備"]);
    var out=panel(el),rd=readout(el);
    var CL=[
      ["0x001D","Descriptor","u","Endpoint の目次。DeviceTypeList / ServerList / PartsList / TagList"],
      ["0x0028","Basic Information","u","VID/PID、製品名、SoftwareVersion、UniqueID、NodeLabel"],
      ["0x0039","Bridged Device Basic Information","u","ブリッジ機器版。<b>Reachable</b> が最重要（19 章）"],
      ["0x001F","Access Control","u","ACL。Fabric-Scoped（14 章）"],
      ["0x003E","Operational Credentials","u","NOC / Fabric の管理（12-14 章）"],
      ["0x003F","Group Key Management","u","グループ鍵"],
      ["0x0030","General Commissioning","u","Fail-Safe、コミッショニングの進行（09・13 章）"],
      ["0x0031","Network Commissioning","u","Wi-Fi / Thread の設定（13 章）"],
      ["0x003C","Administrator Commissioning","u","Commissioning Window の開閉。マルチアドミン（14 章）"],
      ["0x0033","General Diagnostics","u","再起動理由、ネットワーク状態"],
      ["0x0035","Thread Network Diagnostics","u","Thread の統計"],
      ["0x0036","WiFi Network Diagnostics","u","Wi-Fi の統計"],
      ["0x002A","OTA Software Update Requestor","u","更新を受ける側（18 章）"],
      ["0x0029","OTA Software Update Provider","u","更新を配る側（18 章）"],
      ["0x002F","Power Source","u","電池残量・電源種別"],
      ["0x0046","ICD Management","u","間欠動作の管理。SIT / LIT（17 章）"],
      ["0x0038","Time Synchronization","u","時刻同期"],
      ["0x0003","Identify","a","「どれ？」を知らせる。<b>必須級</b>"],
      ["0x0004","Groups","a","グループへの参加"],
      ["0x0006","On/Off","a","OnOff 属性（読み取り専用）+ On/Off/Toggle コマンド"],
      ["0x0008","Level Control","a","CurrentLevel（<b>0〜254</b>）+ MoveToLevel など"],
      ["0x0300","Color Control","a","HS / XY / CT。<b>色温度はミレッド</b>"],
      ["0x0062","Scenes Management","a","シーン（1.4 以降。旧 0x0005）"],
      ["0x001E","Binding","a","機器どうしの直接連携。ハブなしで動く（07 章）"],
      ["0x003B","Switch","a","ボタン。<b>イベント</b>で通知（Generic Switch と組む）"],
      ["0x0025","Actions","a","ブリッジ固有の一括操作（19 章）"],
      ["0x0402","Temperature Measurement","s","MeasuredValue は <b>0.01 °C 単位</b>。Nullable"],
      ["0x0405","Relative Humidity Measurement","s","<b>0.01 % 単位</b>。Nullable"],
      ["0x0403","Pressure Measurement","s","kPa"],
      ["0x0400","Illuminance Measurement","s","<b>対数スケール</b>: 10000×log10(lux)+1"],
      ["0x0406","Occupancy Sensing","s","在室検知"],
      ["0x0045","Boolean State","s","接点など単純な真偽値"],
      ["0x005B","Air Quality","s","空気質（1.2 以降）"],
      ["0x005C","Smoke CO Alarm","s","煙・CO 警報（1.2 以降）"],
      ["0x0101","Door Lock","h","施錠・解錠。<b>Timed Interaction 必須</b>"],
      ["0x0102","Window Covering","h","ブラインド・カーテン"],
      ["0x0201","Thermostat","h","温度制御"],
      ["0x0202","Fan Control","h","ファン"],
      ["0x0071","HEPA Filter Monitoring","h","フィルタ監視（1.2 以降）"]
    ];
    var GRP={u:"ユーティリティ",a:"汎用アプリ",s:"センサー",h:"住宅設備"};
    function draw(){
      var kw=q.value.trim().toLowerCase(),g=+sg.value;
      var keys=["","u","a","s","h"];
      var rows=CL.filter(function(c){
        if(g>0&&c[2]!==keys[g])return false;
        if(!kw)return true;
        return (c[0]+" "+c[1]+" "+c[3]).toLowerCase().indexOf(kw)>=0;
      }).map(function(c){
        return ['<code>'+c[0]+'</code>','<b>'+c[1]+'</b>',
          '<span style="color:var(--faint)">'+GRP[c[2]]+'</span>',c[3]];
      });
      out.innerHTML=rows.length?tbl(["ID","クラスタ","分類","内容"],rows)
        :'<span class="warn">該当なし</span>';
      rd.innerHTML=rows.length+' 件 ／ <span class="warn">正確な定義は必ず Application Cluster Specification で確認すること</span>'+
        ' ／ 単位の誤りは最頻出のバグ（温度 0.01°C、明るさ 0〜254、色温度ミレッド、照度は対数）';
    }
    q.addEventListener("input",draw);sg.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 08: デバイスタイプ ---------- */
  REG.devtype=function(el){
    head(el,"Device Types","必須クラスタは Device Library が決める");
    var row=ctrls(el);
    var sd=select(row,"デバイスタイプ",["On/Off Light (0x0100)","Dimmable Light (0x0101)",
      "Color Temperature Light (0x010C)","Extended Color Light (0x010D)","On/Off Plug-in Unit (0x010A)",
      "Generic Switch (0x000F)","Contact Sensor (0x0015)","Temperature Sensor (0x0302)",
      "Occupancy Sensor (0x0107)","Door Lock (0x000A)","Thermostat (0x0301)",
      "Window Covering (0x0202)","Aggregator (0x000E)","Bridged Node (0x0013)"]);
    var out=panel(el),rd=readout(el);
    var DT=[
      {v:"1.0",cl:[["Identify","M"],["Groups","M"],["On/Off","M"],["Scenes Management","O"]],
       note:"最も基本的なデバイスタイプ。"},
      {v:"1.0",cl:[["Identify","M"],["Groups","M"],["On/Off","M"],["Level Control","M"],["Scenes Management","O"]],
       note:"Level Control が加わる。CurrentLevel は 0〜254。"},
      {v:"1.0",cl:[["Identify","M"],["Groups","M"],["On/Off","M"],["Level Control","M"],["Color Control (CT)","M"]],
       note:"Color Control の FeatureMap で CT ビットを立てる。"},
      {v:"1.0",cl:[["Identify","M"],["Groups","M"],["On/Off","M"],["Level Control","M"],["Color Control (HS/XY/CT)","M"]],
       note:"フルカラー。HS または XY と、CT の両方に対応する。"},
      {v:"1.0",cl:[["Identify","M"],["Groups","M"],["On/Off","M"],["Scenes Management","O"]],
       note:"スマートプラグ。複数口なら Endpoint を分ける。"},
      {v:"1.0",cl:[["Identify","M"],["Switch","M"]],
       note:"ボタン。Switch クラスタの<b>イベント</b>でシングル/ダブル/長押しを通知する。属性では表現できない。"},
      {v:"1.0",cl:[["Identify","M"],["Boolean State","M"]],
       note:"接点センサー（ドア・窓の開閉）。電池機器なら Power Source と ICD Management も。"},
      {v:"1.0",cl:[["Identify","M"],["Temperature Measurement","M"]],
       note:"MeasuredValue は 0.01 °C 単位、Nullable。測れないときは null を返す。"},
      {v:"1.0",cl:[["Identify","M"],["Occupancy Sensing","M"]],note:"在室センサー。"},
      {v:"1.0",cl:[["Identify","M"],["Door Lock","M"]],
       note:"解錠は Timed Interaction が必須。LockOperation イベントは Critical 優先度。"},
      {v:"1.0",cl:[["Identify","M"],["Thermostat","M"],["Groups","O"],["Scenes Management","O"]],
       note:"暖房・冷房の設定温度とモード。"},
      {v:"1.0",cl:[["Identify","M"],["Window Covering","M"],["Groups","O"],["Scenes Management","O"]],
       note:"リフト（上下）とチルト（角度）を FeatureMap で宣言する。"},
      {v:"1.0",cl:[["Descriptor","M"],["Actions","O"]],
       note:"ブリッジの親 Endpoint。PartsList に配下の Endpoint を列挙する（19 章）。"},
      {v:"1.0",cl:[["Bridged Device Basic Information","M"]],
       note:"実機能のデバイスタイプと<b>組み合わせて</b>使う。Reachable の実装が最重要（19 章）。"}
    ];
    function draw(){
      var D=DT[+sd.value];
      var h=tbl(["クラスタ","適合性"],D.cl.map(function(c){
        return [c[0], c[1]==="M"?'<b class="ok">M（必須）</b>':'<span style="color:var(--muted)">O（任意）</span>'];
      }));
      h+='<div style="color:var(--muted);margin-top:.5rem">加えて Descriptor はすべての Endpoint で必須。'+
         'Endpoint 0 には Root Node のユーティリティクラスタが載る。</div>';
      out.innerHTML=h;
      rd.innerHTML=D.note+
        ' ／ <span class="warn">M のクラスタを 1 つでも欠くと認証は通らない。Device Library Specification が最終的なチェックリスト</span>';
    }
    sd.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 09: ワイルドカードの展開 ---------- */
  REG.path=function(el){
    head(el,"Attribute Path","省略はワイルドカードになる");
    var row=ctrls(el);
    var pe=textin(row,"Endpoint（* で全部）","1","100%");
    var pc=textin(row,"Cluster（* で全部）","0x0006","100%");
    var pa=textin(row,"Attribute（* で全部）","*","100%");
    var out=panel(el),rd=readout(el);
    // 仮の機器: 3 口タップ + Endpoint 0
    var DEV={
      0:{name:"Root Node",cl:{
        "0x001D":{n:"Descriptor",at:["0x0000 DeviceTypeList","0x0001 ServerList","0x0002 ClientList","0x0003 PartsList"]},
        "0x0028":{n:"Basic Information",at:["0x0002 VendorID","0x0004 ProductID","0x0005 NodeLabel","0x0009 SoftwareVersion"]}}},
      1:{name:"On/Off Plug-in Unit",cl:{
        "0x0003":{n:"Identify",at:["0x0000 IdentifyTime","0x0001 IdentifyType"]},
        "0x0006":{n:"On/Off",at:["0x0000 OnOff","0x4003 StartUpOnOff"]}}},
      2:{name:"On/Off Plug-in Unit",cl:{
        "0x0003":{n:"Identify",at:["0x0000 IdentifyTime","0x0001 IdentifyType"]},
        "0x0006":{n:"On/Off",at:["0x0000 OnOff","0x4003 StartUpOnOff"]}}},
      3:{name:"On/Off Plug-in Unit",cl:{
        "0x0003":{n:"Identify",at:["0x0000 IdentifyTime","0x0001 IdentifyType"]},
        "0x0006":{n:"On/Off",at:["0x0000 OnOff","0x4003 StartUpOnOff"]}}}
    };
    var GLOBAL=["0xFFFC FeatureMap","0xFFFD ClusterRevision","0xFFFB AttributeList",
                "0xFFF9 AcceptedCommandList","0xFFF8 GeneratedCommandList"];
    function norm(s){
      s=String(s).trim();
      if(s==="*"||s===""||s.toLowerCase()==="0xffff"||s.toLowerCase()==="0xffffffff")return null;
      return s.toLowerCase().indexOf("0x")===0?("0x"+pad(parseInt(s,16).toString(16).toUpperCase(),4)):s;
    }
    function draw(){
      var e=norm(pe.value),c=norm(pc.value),a=norm(pa.value);
      var hits=[];
      Object.keys(DEV).forEach(function(ep){
        if(e!==null&&String(+ep)!==String(parseInt(e,e.indexOf("0x")===0?16:10)))return;
        var D=DEV[ep];
        Object.keys(D.cl).forEach(function(cid){
          if(c!==null&&cid.toUpperCase()!==c.toUpperCase())return;
          var all=D.cl[cid].at.concat(GLOBAL);
          all.forEach(function(at){
            var aid=at.split(" ")[0];
            if(a!==null&&aid.toUpperCase()!==a.toUpperCase())return;
            hits.push([ep,cid+" "+D.cl[cid].n,at]);
          });
        });
      });
      var shown=hits.slice(0,60);
      var h='<div style="color:var(--muted);margin-bottom:.4rem">対象機器: 3 口の電源タップ（Endpoint 0〜3）</div>';
      h+=tbl(["Endpoint","Cluster","Attribute"],shown.map(function(x){
        return [String(x[0]),x[1],x[2]];
      }));
      if(hits.length>shown.length)
        h+='<div style="color:var(--muted);margin-top:.3rem">…ほか '+(hits.length-shown.length)+' 件</div>';
      out.innerHTML=h;
      var chip="chip-tool any read-by-id "+(c===null?"0xFFFFFFFF":c)+" "+(a===null?"0xFFFFFFFF":a)+
               " <node-id> "+(e===null?"0xFFFF":e);
      rd.innerHTML='展開結果: <b>'+hits.length+'</b> 個の属性'+
        ' ／ <code>'+esc(chip)+'</code>'+
        ' ／ '+(hits.length>30?'<span class="warn">Thread 機器ではこの規模の一括読み出しは応答が巨大になり失敗しやすい。段階的に読むこと（03・09 章）</span>'
                             :'<span class="ok">この程度なら問題ない</span>');
    }
    [pe,pc,pa].forEach(function(t){t.addEventListener("input",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 09: ステータスコード ---------- */
  REG.status=function(el){
    head(el,"Status Codes","エラーの意味を知ると診断が速い");
    var row=ctrls(el);
    var q=textin(row,"検索（コード・名前・原因）","","100%");
    var out=panel(el),rd=readout(el);
    var ST=[
      ["0x00","SUCCESS","成功","—"],
      ["0x01","FAILURE","一般的な失敗","実装側の内部エラー"],
      ["0x7D","INVALID_SUBSCRIPTION","サブスクリプション ID が不正","期限切れ・再確立が必要"],
      ["0x7E","UNSUPPORTED_ACCESS","<b>権限不足</b>","<b class='warn'>ACL の設定漏れ（最頻出）</b>"],
      ["0x7F","UNSUPPORTED_ENDPOINT","その Endpoint がない","Endpoint 番号の誤り"],
      ["0x80","INVALID_ACTION","要求の形式が不正","パスやエンコードの誤り"],
      ["0x81","UNSUPPORTED_COMMAND","そのコマンドがない","未実装。AcceptedCommandList を確認"],
      ["0x85","INVALID_COMMAND","引数が不正","値域外の引数"],
      ["0x86","UNSUPPORTED_ATTRIBUTE","その属性がない","未実装。AttributeList を確認"],
      ["0x87","CONSTRAINT_ERROR","値が制約に反する","値域外（Level に 255 など）"],
      ["0x88","UNSUPPORTED_WRITE","読み取り専用","OnOff は書けない。コマンドを使う"],
      ["0x89","RESOURCE_EXHAUSTED","リソース不足","サブスクリプション／Fabric の上限"],
      ["0x8B","NOT_FOUND","見つからない","—"],
      ["0x8C","UNREPORTABLE_ATTRIBUTE","購読できない属性","—"],
      ["0x8D","INVALID_DATA_TYPE","型が違う","TLV の型の誤り"],
      ["0x8F","UNSUPPORTED_READ","書き込み専用","—"],
      ["0x92","DATA_VERSION_MISMATCH","版が古い","他者が先に変更した。読み直して再試行"],
      ["0x94","TIMEOUT","タイムアウト","—"],
      ["0x9C","BUSY","処理中","後で再試行"],
      ["0xC3","UNSUPPORTED_CLUSTER","そのクラスタがない","未実装。ServerList を確認"],
      ["0xC5","NO_UPSTREAM_SUBSCRIPTION","上流の購読がない","プロキシ関連"],
      ["0xC6","NEEDS_TIMED_INTERACTION","<b>Timed 必須</b>","Timed Request を先行させる（09 章）"],
      ["0xC7","UNSUPPORTED_EVENT","そのイベントがない","—"],
      ["0xC8","PATHS_EXHAUSTED","パス数の上限","一度に要求しすぎ"],
      ["0xC9","TIMED_REQUEST_MISMATCH","Timed の不整合","—"],
      ["0xCA","FAILSAFE_REQUIRED","Fail-Safe が必要","コミッショニング手順の誤り（09 章）"]
    ];
    function draw(){
      var kw=q.value.trim().toLowerCase();
      var rows=ST.filter(function(s){
        if(!kw)return true;
        return (s[0]+" "+s[1]+" "+s[2]+" "+s[3]).toLowerCase().indexOf(kw)>=0;
      }).map(function(s){return ['<code>'+s[0]+'</code>','<b>'+s[1]+'</b>',s[2],s[3]];});
      out.innerHTML=rows.length?tbl(["コード","名前","意味","よくある原因"],rows):'<span class="warn">該当なし</span>';
      rd.innerHTML='<b class="warn">0x7E (UNSUPPORTED_ACCESS) が最頻出</b>。'+
        '「コミッショニングは成功したのに読めない」なら、ほぼ確実に ACL の問題（14 章）'+
        ' ／ 確認: <code>chip-tool accesscontrol read acl &lt;node-id&gt; 0</code>';
    }
    q.addEventListener("input",draw);reg(null,draw);draw();
  };

  /* ---------- 10: サブスクリプション ---------- */
  REG.subscribe=function(el){
    head(el,"Subscription","MinInterval で抑制、MaxInterval で生存確認");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var smin=slider(row,"MinIntervalFloor（秒）",0,20,5,1);
    var smax=slider(row,"MaxIntervalCeiling（秒）",5,300,60,5);
    var sch=slider(row,"属性が変化する間隔（秒）",0.2,30,4,0.2);
    var sdev=slider(row,"機器が返す MaxInterval（秒）",5,600,60,5);
    var out=readout(el);
    function draw(){
      var mn=+smin.input.value,mx=+smax.input.value,ch=+sch.input.value,dev=+sdev.input.value;
      smin.val.textContent=mn+" s";smax.val.textContent=mx+" s";
      sch.val.textContent=f(ch,1)+" s";sdev.val.textContent=dev+" s";
      var T=180;
      var c=chart(cc,0,T,0,3,{l:80,r:16,t:20,b:34});
      var ctx=c.ctx;
      // 変化のタイミング
      var changes=[];for(var t=ch;t<T;t+=ch)changes.push(t);
      // 報告のタイミング
      var reports=[],last=0,pending=false;
      var evs=changes.slice();
      for(t=0;t<=T;t+=0.05){
        while(evs.length&&evs[0]<=t){evs.shift();pending=true;}
        if(pending&&t-last>=mn){reports.push([t,"変化"]);last=t;pending=false;}
        else if(t-last>=dev&&t>0){reports.push([t,"生存"]);last=t;}
      }
      function lane(y,label,col){
        ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(c.p.l,c.Y(y));ctx.lineTo(c.w-c.p.r,c.Y(y));ctx.stroke();
        lab(ctx,label,c.p.l-6,c.Y(y)+4,col,"right");
      }
      lane(2.3,"属性の変化",C("--faint"));
      lane(1.2,"報告",C("--signal"));
      changes.forEach(function(x){
        ctx.strokeStyle=C("--faint");ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(c.X(x),c.Y(2.05));ctx.lineTo(c.X(x),c.Y(2.55));ctx.stroke();});
      reports.forEach(function(r){
        var col=r[1]==="変化"?C("--signal"):C("--alias");
        ctx.strokeStyle=col;ctx.lineWidth=2.2;
        ctx.beginPath();ctx.moveTo(c.X(r[0]),c.Y(0.95));ctx.lineTo(c.X(r[0]),c.Y(1.45));ctx.stroke();});
      axis(c);
      lab(ctx,"0 s",c.p.l,c.h-c.p.b+16,C("--muted"),"left");
      lab(ctx,T+" s",c.w-c.p.r,c.h-c.p.b+16,C("--muted"),"right");
      lab(ctx,"緑 = 変化による報告 ／ 赤 = 変化がなくても送る生存確認",c.p.l,c.p.t+6,C("--muted"),"left");
      var nCh=reports.filter(function(r){return r[1]==="変化";}).length;
      var nAl=reports.length-nCh;
      var suppressed=changes.length-nCh;
      out.innerHTML=T+' 秒間で: 属性の変化 <b>'+changes.length+'</b> 回 → 報告 <b>'+nCh+'</b> 回'+
        (suppressed>0?'（<b class="warn">'+suppressed+' 回は MinInterval で間引かれた</b>）':'')+
        ' ／ 生存確認の報告 <b>'+nAl+'</b> 回'+
        ' ／ 合計 <b>'+reports.length+'</b> 回の送信'+
        ' ／ '+(dev>mx?'<span class="warn">機器が要求（'+mx+'s）より長い MaxInterval（'+dev+'s）を返している。コントローラはこれを受け入れること</span>'
              :(dev<20?'<span class="warn">MaxInterval が短い。変化がなくても機器が起き続けて電池を消耗する</span>'
                      :'<span class="ok">MinInterval で無駄な報告を抑え、MaxInterval で生存確認している</span>'));
    }
    [smin,smax,sch,sdev].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 11: 暗号プリミティブ ---------- */
  REG.crypto=function(el){
    head(el,"Crypto","すべて標準的なもの。独自暗号はない");
    var row=ctrls(el);
    var sm=select(row,"場面",["すべて","コミッショニング (PASE)","デバイス認証","運用セッション (CASE)","グループ通信","OTA"]);
    var out=panel(el),rd=readout(el);
    var CR=[
      ["AES-CCM","共通鍵暗号（認証付き）","128 bit 鍵、16 byte MIC","全通信の暗号化","cgo"],
      ["SHA-256","ハッシュ","","証明書、鍵導出、各所","pdcgo"],
      ["HMAC-SHA-256","メッセージ認証","","鍵導出、検証","pcg"],
      ["HKDF-SHA-256","鍵導出","","セッション鍵の生成","pcg"],
      ["PBKDF2-HMAC-SHA-256","パスワードからの鍵導出","反復回数 1000 以上","SPAKE2+ の w0/w1","p"],
      ["ECDH (P-256)","鍵交換","secp256r1","PASE / CASE の共有秘密","pc"],
      ["ECDSA-SHA-256 (P-256)","署名","secp256r1","証明書、Attestation、CASE","dco"],
      ["SPAKE2+ (P-256)","パスワード認証鍵交換","","PASE。オフライン総当たりを防ぐ","p"],
      ["CSPRNG / TRNG","乱数","","<b class='warn'>すべての土台</b>","pdcgo"]
    ];
    function draw(){
      var k=+sm.value,key=["","p","d","c","g","o"][k];
      var rows=CR.filter(function(c){return k===0||c[4].indexOf(key)>=0;})
        .map(function(c){return ['<b>'+c[0]+'</b>',c[1],c[2]||"—",c[3]];});
      out.innerHTML=tbl(["アルゴリズム","種類","パラメータ","用途"],rows);
      rd.innerHTML='<b>曲線はすべて NIST P-256 (secp256r1) に統一</b>されている。RSA は使わない。'+
        '実装が単純になり、ハードウェアアクセラレータも 1 種類で済む'+
        ' ／ <span class="warn">乱数の質がすべてを決める。rand() や固定シードは絶対に使わない。ハードウェア TRNG を使うこと</span>';
    }
    sm.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 12: 証明書チェーンの検証 ---------- */
  REG.certchain=function(el){
    head(el,"Attestation","DAC と CD の両方が揃って初めて証明される");
    var row=ctrls(el);
    var b1=checkbox(row,"DAC → PAI → PAA のチェーンが検証できる",true);
    var b2=checkbox(row,"PAA が DCL に登録されている",true);
    var b3=checkbox(row,"ノンスへの署名が正しい",true);
    var b4=checkbox(row,"CD の CSA 署名が正しい",true);
    var b5=checkbox(row,"CD の VID/PID と DAC が一致",true);
    var b6=checkbox(row,"Basic Information の VID/PID とも一致",true);
    var out=panel(el),rd=readout(el);
    function draw(){
      var ck=[b1,b2,b3,b4,b5,b6].map(function(b){return b.checked;});
      var labels=[
        ["a. 証明書チェーンの検証","DAC ← PAI ← PAA。PAA は DCL から取得する","この機器を作ったメーカーが本物か"],
        ["b. PAA の信頼性","DCL（分散台帳）に登録されたルート CA か","信頼の起点が正しいか"],
        ["c. ノンスへの署名","コントローラが送った 32 byte のノンスに DAC 秘密鍵で署名","<b>鍵を実際に持っているか</b>（署名の使い回しを防ぐ）"],
        ["d. CD の署名","CSA が署名した Certification Declaration","この製品モデルが認証を通っているか"],
        ["e. CD と DAC の VID/PID 一致","","他社製品の DAC を流用していないか"],
        ["f. Basic Information との一致","","名乗っている VID/PID と証明書が食い違わないか"]
      ];
      var h="";
      labels.forEach(function(L,i){
        h+='<div style="padding:.35rem .6rem;margin-bottom:.25rem;border-radius:6px;background:'+
           (ck[i]?"var(--signal-soft)":"var(--alias-soft)")+'">'+
           '<b>'+(ck[i]?"✓":"✗")+' '+L[0]+'</b>'+
           (L[1]?'<div style="color:var(--muted)">'+L[1]+'</div>':'')+
           '<div style="color:var(--muted)">→ '+L[2]+'</div></div>';
      });
      out.innerHTML=h;
      var ok=ck.every(function(x){return x;});
      var fail=labels.filter(function(_,i){return !ck[i];}).map(function(L){return L[0].split(".")[0];});
      rd.innerHTML=ok
        ? '<span class="ok">すべて成功 → 認証を受けた正規品の個体であることが暗号学的に確認された</span>'
        : '<span class="warn">'+fail.join(", ")+' が失敗 → 検証失敗。エコシステムによっては拒否、または「未認証の機器」として警告付きで扱われる</span>';
      rd.innerHTML+=' ／ <b>DAC</b>（メーカー発行・個体ごと）と <b>CD</b>（CSA 発行・モデル共通）は役割が違う。両方要る';
    }
    [b1,b2,b3,b4,b5,b6].forEach(function(b){b.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 13: QR ペイロード ---------- */
  REG.qrcode=function(el){
    head(el,"Onboarding Payload","88 bit を Base38 で 19 文字に");
    var row=ctrls(el);
    var sv=textin(row,"Vendor ID","0xFFF1","100%");
    var sp2=textin(row,"Product ID","0x8001","100%");
    var sd=slider(row,"Discriminator (12 bit)",0,4095,3840,1);
    var spc=textin(row,"Passcode (1〜99999998)","20202021","100%");
    var scap=select(row,"Discovery Capabilities",["bit1: BLE (=2)","bit0: SoftAP (=1)","bit2: 既存ネットワーク上 (=4)","BLE + ネットワーク (=6)"]);
    var row2=ctrls(el);
    var dec=textin(row2,"QR ペイロードを貼ってデコード","","100%");
    var out=panel(el),rd=readout(el);
    var CAPV=[2,1,4,6];
    var BAD=[0,11111111,22222222,33333333,44444444,55555555,66666666,77777777,88888888,99999999,12345678,87654321];
    function pnum(s){s=String(s).trim();return s.toLowerCase().indexOf("0x")===0?parseInt(s,16):parseInt(s,10);}
    function draw(fromDecode){
      var o;
      if(fromDecode){
        var r=qrDecode(dec.value);
        if(r.error){out.innerHTML='<span class="warn">'+esc(r.error)+'</span>';rd.innerHTML="";return;}
        o=r;
        sv.value="0x"+pad(o.vid.toString(16).toUpperCase(),4);
        sp2.value="0x"+pad(o.pid.toString(16).toUpperCase(),4);
        sd.input.value=o.discriminator;spc.value=o.passcode;
        var ci=CAPV.indexOf(o.cap);if(ci>=0)scap.value=ci;
      }else{
        o={version:0,vid:pnum(sv.value),pid:pnum(sp2.value),flow:0,cap:CAPV[+scap.value],
           discriminator:+sd.input.value,passcode:pnum(spc.value)};
      }
      sd.val.textContent=o.discriminator+" (0x"+o.discriminator.toString(16).toUpperCase()+")";
      if(!(o.vid>=0&&o.vid<=0xFFFF)||!(o.pid>=0&&o.pid<=0xFFFF)||
         !(o.passcode>=1&&o.passcode<=99999998)){
        out.innerHTML='<span class="warn">VID/PID は 0〜65535、Passcode は 1〜99999998 の範囲で</span>';
        rd.innerHTML="";return;
      }
      var qr=qrEncode(o);
      if(!fromDecode)dec.value=qr;
      var bytes=packBits([[0,3],[o.vid,16],[o.pid,16],[0,2],[o.cap,8],
                          [o.discriminator,12],[o.passcode,27],[0,4]],11);
      var fields=[["Version",0,3],["Vendor ID",o.vid,16],["Product ID",o.pid,16],
                  ["Custom Flow",0,2],["Discovery Capabilities",o.cap,8],
                  ["Discriminator",o.discriminator,12],["Passcode",o.passcode,27],["Padding",0,4]];
      var off=0;
      var rows=fields.map(function(fl){
        var r=[fl[0],String(fl[2]),String(off)+"〜"+String(off+fl[2]-1),
               String(fl[1]),"0b"+pad(fl[1].toString(2),Math.min(fl[2],32))];
        off+=fl[2];return r;
      });
      var h='<div style="color:var(--muted)">ビットのパック（LSB 側から詰める。合計 88 bit = 11 byte）</div>';
      h+=tbl(["フィールド","bit","位置","値","2 進"],rows,["left","right","right","right","left"]);
      h+='<div style="color:var(--muted);margin-top:.5rem">11 バイト（16 進）</div>';
      h+='<div style="letter-spacing:.08em">'+bytes.map(function(b){return pad(b.toString(16).toUpperCase(),2);}).join(" ")+'</div>';
      h+='<div style="color:var(--muted);margin-top:.5rem">Base38（3 byte→5 文字、2 byte→4 文字）</div>';
      h+='<div style="font-size:1.15rem;font-weight:700;color:var(--signal);word-break:break-all;letter-spacing:.06em">'+
         esc(qr)+'</div>';
      out.innerHTML=h;
      var badPass=BAD.indexOf(o.passcode)>=0;
      rd.innerHTML='全長 <b>'+qr.length+'</b> 文字（MT: + 19 文字）'+
        ' ／ Base38 の文字集合: 0-9 A-Z - .（38 文字）'+
        (badPass?' ／ <span class="warn">この Passcode は仕様で禁止されている値です（推測されやすい）</span>':'')+
        (o.passcode===20202021?' ／ <span class="warn">これは SDK のテスト用デフォルト値。製品では個体ごとにランダムな値を使うこと</span>':'')+
        ' ／ 検証: <code>chip-tool payload parse-setup-payload '+esc(qr)+'</code>';
    }
    [sv,sp2,spc].forEach(function(t){t.addEventListener("input",function(){draw(false);});});
    sd.input.addEventListener("input",function(){draw(false);});
    scap.addEventListener("change",function(){draw(false);});
    dec.addEventListener("input",function(){draw(true);});
    reg(null,function(){draw(false);});draw(false);
  };

  /* ---------- 13: 手動ペアリングコード ---------- */
  REG.manualcode=function(el){
    head(el,"Manual Code","Verhoeff チェックディジットで入力ミスを検出");
    var row=ctrls(el);
    var sd=slider(row,"Discriminator",0,4095,3840,1);
    var spc=textin(row,"Passcode","20202021","100%");
    var sv=checkbox(row,"VID/PID を含める（21 桁版）",false);
    var row2=ctrls(el);
    var dec=textin(row2,"コードを貼ってデコード（1 桁変えて試してみてください）","","100%");
    var out=panel(el),rd=readout(el);
    function draw(fromDecode){
      var disc,pc,withVP;
      if(fromDecode){
        var r=manualDecode(dec.value);
        if(r.error){
          out.innerHTML='<span class="warn">'+esc(r.error)+'</span>';
          rd.innerHTML='<span class="warn">Verhoeff は「1 桁の誤り」と「隣接する 2 桁の入れ替え」を 100% 検出する</span>';
          return;
        }
        var h2='<div style="color:var(--muted)">デコード結果</div>';
        h2+=tbl(["項目","値"],[
          ["Short Discriminator（上位 4 bit）",'<b>'+r.shortDiscriminator+'</b>'],
          ["Passcode",'<b>'+r.passcode+'</b>'],
          ["VID/PID を含むか",r.hasVidPid?"はい":"いいえ"]
        ].concat(r.vid!==undefined?[["Vendor ID","0x"+pad(r.vid.toString(16).toUpperCase(),4)+" ("+r.vid+")"],
                                    ["Product ID","0x"+pad(r.pid.toString(16).toUpperCase(),4)+" ("+r.pid+")"]]:[]));
        out.innerHTML=h2;
        rd.innerHTML='<span class="ok">チェックディジット OK</span>'+
          ' ／ <b>手動コードには Discriminator の上位 4 bit しか入らない</b>（Short Discriminator）。'+
          '16 通りしかないので、周囲に同じ製品が複数あると絞り込めない。QR コードの方が確実';
        return;
      }
      disc=+sd.input.value;pc=parseInt(spc.value,10);withVP=sv.checked;
      sd.val.textContent=disc+"／上位4bit="+((disc>>8)&0xF);
      if(!(pc>=1&&pc<=99999998)){out.innerHTML='<span class="warn">Passcode は 1〜99999998</span>';rd.innerHTML="";return;}
      var code=withVP?manualEncode(disc,pc,65521,32769):manualEncode(disc,pc);
      dec.value=code;
      var d1=((withVP?1:0)<<2)|((disc>>10)&0x03);
      var c2=((disc&0x300)<<6)|(pc&0x3FFF);
      var c3=pc>>14;
      var body=String(d1)+pad(c2,5)+pad(c3,4)+(withVP?pad(65521,5)+pad(32769,5):"");
      var chk=verhoeff(body);
      var rows=[
        ["1 桁目","(VID/PID 有無)&lt;&lt;2 | (disc &gt;&gt; 10)","("+(withVP?1:0)+"&lt;&lt;2) | "+((disc>>10)&3),String(d1)],
        ["2〜6 桁","((disc &amp; 0x300) &lt;&lt; 6) | (passcode &amp; 0x3FFF)",
         "("+(disc&0x300)+"&lt;&lt;6) | "+(pc&0x3FFF),pad(c2,5)],
        ["7〜10 桁","passcode &gt;&gt; 14",String(pc)+"&gt;&gt;14",pad(c3,4)]
      ];
      if(withVP){rows.push(["11〜15 桁","Vendor ID","65521",pad(65521,5)]);
                 rows.push(["16〜20 桁","Product ID","32769",pad(32769,5)]);}
      rows.push(["最終桁","<b>Verhoeff チェックディジット</b>","D5 の演算表で計算",'<b>'+chk+'</b>']);
      var h='<div style="color:var(--muted)">桁の構成</div>'+tbl(["位置","式","計算","値"],rows);
      h+='<div style="color:var(--muted);margin-top:.5rem">生成されたコード</div>';
      h+='<div style="font-size:1.3rem;font-weight:700;color:var(--signal);letter-spacing:.12em">'+
         code.slice(0,code.length-1)+'<span style="color:var(--alias)">'+code.slice(-1)+'</span></div>';
      out.innerHTML=h;
      rd.innerHTML='全 <b>'+code.length+'</b> 桁 ／ 最後の 1 桁（赤）がチェックディジット'+
        ' ／ <b>Verhoeff は単一桁の誤りと隣接転置を 100% 検出する</b>（単純な mod 10 より強い）'+
        ' ／ 上の欄で 1 桁書き換えると検出されることを確かめてください';
    }
    sd.input.addEventListener("input",function(){draw(false);});
    spc.addEventListener("input",function(){draw(false);});
    sv.addEventListener("change",function(){draw(false);});
    dec.addEventListener("input",function(){draw(true);});
    reg(null,function(){draw(false);});draw(false);
  };

  /* ---------- 13: コミッショニングの手順 ---------- */
  REG.commission=function(el){
    head(el,"Commissioning","15 段階。どこで失敗しうるか");
    var row=ctrls(el);
    var ss=slider(row,"ステップ",1,15,15,1);
    var out=panel(el),rd=readout(el);
    var S=[
      ["機器が待機","BLE / mDNS でコミッショニング可能と広告","広告していない／Discriminator 不一致／既に参加済み"],
      ["コードの読み取り","QR / 手動コードから passcode・discriminator・VID/PID を得る","QR が読めない／コードの誤入力"],
      ["機器の発見","BLE アドバタイズ or mDNS","BLE 権限／マルチキャストの遮断"],
      ["PASE 確立","SPAKE2+。passcode が根拠。以降暗号化","passcode 不一致／検証子の計算ミス／salt・iterations の不整合"],
      ["ArmFailSafe","失敗時に巻き戻すタイマーを開始","—"],
      ["デバイス認証","AttestationRequest → DAC/PAI/CD を検証","証明書チェーン／VID-PID 不一致／PAA が信頼されていない"],
      ["CSRRequest","機器が操作用鍵ペアを生成し CSR を返す","鍵生成の失敗／エントロピー不足"],
      ["NOC の発行","コントローラの CA が NOC を発行","—"],
      ["AddTrustedRootCertificate","Fabric のルート証明書を渡す","不揮発メモリの不足"],
      ["AddNOC","NOC・IPK・CaseAdminSubject を渡す。Fabric を仮追加","Fabric 数の上限／メモリ不足"],
      ["ネットワーク設定","Wi-Fi 認証情報 or Thread Dataset を渡す","パスワードの誤り／Dataset の不一致"],
      ["ネットワーク参加","機器が Wi-Fi / Thread に参加","電波／認証情報／Border Router"],
      ["運用ネットワークで再発見","mDNS で機器を探す","<b class='warn'>最頻出。mDNS / SRP の問題（03・06 章）</b>"],
      ["CASE 確立","NOC が根拠の運用セッション","NOC の内容／時刻／IPK 不一致"],
      ["CommissioningComplete","Fail-Safe 解除、Fabric を確定。BLE 切断","—"]
    ];
    function draw(){
      var n=+ss.input.value;ss.val.textContent=n+" / 15";
      var h="";
      S.forEach(function(s,i){
        var cur=(i===n-1),done=(i<n-1);
        h+='<div style="padding:.32rem .6rem;margin-bottom:.2rem;border-radius:6px;'+
          (cur?'background:var(--signal);color:#fff':(done?'background:var(--signal-soft)':'opacity:.32'))+'">'+
          '<b>'+pad(i+1,2)+'. '+s[0]+'</b>'+
          (cur||done?'<div style="'+(cur?'color:rgba(255,255,255,.9)':'color:var(--muted)')+'">'+s[1]+'</div>':'')+
          (cur&&s[2]!=="—"?'<div style="color:'+(cur?'#ffd9c8':'var(--alias)')+'">失敗の原因: '+s[2]+'</div>':'')+
          '</div>';
      });
      out.innerHTML=h;
      rd.innerHTML='ステップ 12〜14 が<b>トランスポートの切り替え</b>（BLE → Wi-Fi/Thread）。ここが最も失敗しやすい'+
        ' ／ 「90% で止まる」は ConnectNetwork 後の再発見が失敗している'+
        ' ／ 失敗しても Fail-Safe（ステップ 5）が全部巻き戻す';
    }
    ss.input.addEventListener("input",draw);reg(null,draw);draw();
  };

  /* ---------- 14: ACL 判定 ---------- */
  REG.acl=function(el){
    head(el,"Access Control","許可リストのみ。空なら誰も何もできない");
    var row=ctrls(el);
    var sp=select(row,"エントリの Privilege",["View (1)","ProxyView (2)","Operate (3)","Manage (4)","Administer (5)"]);
    var sa=select(row,"エントリの AuthMode",["CASE (2)","Group (3)","PASE (1)"]);
    var ssub=textin(row,"Subjects（Node ID、空 = 全員）","112233","100%");
    var stg=textin(row,"Targets（例 6/1、空 = すべて）","","100%");
    var row2=ctrls(el);
    var rn=textin(row2,"要求元 Node ID","112233","100%");
    var ram=select(row2,"要求元の AuthMode",["CASE","Group","PASE"]);
    var rop=select(row2,"操作",["OnOff 属性を読む（View）","On コマンド（Operate）",
      "NodeLabel を書く（Manage）","ACL を書き換える（Administer）","解錠する（Operate + Timed）"]);
    var rep=textin(row2,"対象 Endpoint","1","100%");
    var rcl=textin(row2,"対象 Cluster","0x0006","100%");
    var out=panel(el),rd=readout(el);
    var PRIV=[1,2,3,4,5],PRIVN=["View","ProxyView","Operate","Manage","Administer"];
    var AM=[2,3,1],AMN={2:"CASE",3:"Group",1:"PASE"};
    var OPS=[[1,"OnOff 属性の読み取り"],[3,"On コマンド"],[4,"NodeLabel の書き込み"],
             [5,"ACL の書き換え"],[3,"解錠コマンド"]];
    function draw(){
      var ep=PRIV[+sp.value],eam=AM[+sa.value];
      var subs=ssub.value.trim()?ssub.value.split(",").map(function(s){return s.trim();}).filter(Boolean):[];
      var tgs=stg.value.trim()?stg.value.split(",").map(function(s){return s.trim();}).filter(Boolean):[];
      var reqNode=rn.value.trim(),reqAm=AM[+ram.value];
      var need=OPS[+rop.value][0],opName=OPS[+rop.value][1];
      var tEp=rep.value.trim(),tCl=rcl.value.trim().toLowerCase();
      var checks=[];
      var amOk=(eam===reqAm);
      checks.push(["AuthMode の一致",amOk,"エントリ: "+AMN[eam]+" ／ 要求元: "+AMN[reqAm]]);
      var subOk=(subs.length===0)||(subs.indexOf(reqNode)>=0);
      checks.push(["Subjects に含まれるか",subOk,
        subs.length===0?"空 = 全員が対象":("["+subs.join(", ")+"] に "+reqNode+" が"+(subOk?"含まれる":"含まれない"))]);
      var tgOk=true,tgDesc="空 = すべての対象";
      if(tgs.length){
        tgOk=tgs.some(function(t){
          var pr=t.split("/");
          var c=(pr[0]||"").toLowerCase(),e=pr[1];
          var cm=!c||c==="*"||c===tCl||("0x"+pad(parseInt(c,10).toString(16),4))===tCl||parseInt(c,16)===parseInt(tCl,16);
          var em=!e||e==="*"||e===tEp;
          return cm&&em;
        });
        tgDesc="["+tgs.join(", ")+"] に Cluster="+tCl+" / Endpoint="+tEp+" が"+(tgOk?"一致":"不一致");
      }
      checks.push(["Targets に一致するか",tgOk,tgDesc]);
      var prOk=(ep>=need);
      checks.push(["Privilege が十分か",prOk,
        "エントリ: "+PRIVN[ep-1]+" ("+ep+") ／ 必要: "+PRIVN[need-1]+" ("+need+")"]);
      var allow=checks.every(function(c){return c[1];});
      var h='<div style="color:var(--muted);margin-bottom:.4rem">要求: <b>'+opName+
        '</b>（Endpoint '+tEp+' / Cluster '+tCl+'、必要な特権 = '+PRIVN[need-1]+'）</div>';
      h+=checks.map(function(c){
        return '<div style="padding:.28rem .6rem;margin-bottom:.2rem;border-radius:6px;background:'+
          (c[1]?"var(--signal-soft)":"var(--alias-soft)")+'">'+
          '<b>'+(c[1]?"✓":"✗")+' '+c[0]+'</b><span style="color:var(--muted)"> — '+esc(c[2])+'</span></div>';
      }).join("");
      h+='<div style="margin-top:.6rem;font-size:1.05rem">判定: '+
        (allow?'<b class="ok">許可</b>':'<b class="warn">拒否 → UNSUPPORTED_ACCESS (0x7E)</b>')+'</div>';
      out.innerHTML=h;
      rd.innerHTML='ACL は<b>許可リストのみ</b>。「拒否」のエントリは存在しない。1 つでも条件を満たすエントリがあれば許可'+
        ' ／ 特権は階層: Administer ⊃ Manage ⊃ Operate ⊃ View'+
        ' ／ コミッショニング時、AddNOC の CaseAdminSubject から 1 件目が自動生成される（13 章）'+
        ' ／ <span class="warn">0x7E が出たら真っ先にここを疑う</span>';
    }
    [ssub,stg,rn,rep,rcl].forEach(function(t){t.addEventListener("input",draw);});
    [sp,sa,ram,rop].forEach(function(s){s.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 14: Fabric とマルチアドミン ---------- */
  REG.fabric=function(el){
    head(el,"Multi-Admin","1 台が複数のエコシステムに同時所属する");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"所属している Fabric 数",0,8,2,1);
    var ss=slider(row,"SupportedFabrics（機器の上限）",1,10,5,1);
    var sk=slider(row,"1 件あたりの不揮発（KB）",0.5,3,1.5,0.1);
    var out=readout(el);
    var NAMES=["Apple Home","Google Home","Amazon Alexa","SmartThings","Home Assistant",
               "自社アプリ","エコシステム G","エコシステム H"];
    var COLS=["#8a7fb5","#4f9a70","#c2853f","#4a86b8","#5b9bd5","#b5657f","#7a9a4f","#a06b8a"];
    function draw(){
      var n=+sn.input.value,sup=+ss.input.value,kb=+sk.input.value;
      sn.val.textContent=n;ss.val.textContent=sup;sk.val.textContent=f(kb,1)+" KB";
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var dev={x:w/2,y:h*0.80};
      var R=Math.min(w*0.40,h*0.60);
      var A0=Math.PI*1.14,A1=Math.PI*1.86;
      for(var i=0;i<n;i++){
        var a=(n===1)?Math.PI*1.5:(A0+(A1-A0)*i/(n-1));
        var fx=dev.x+R*Math.cos(a),fy=dev.y+R*Math.sin(a);
        var over=(i>=sup);
        ctx.strokeStyle=over?C("--alias"):COLS[i%COLS.length];
        ctx.lineWidth=over?2:2.4;if(over)ctx.setLineDash([5,4]);
        ctx.beginPath();ctx.moveTo(dev.x,dev.y);ctx.lineTo(fx,fy);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=over?C("--alias"):COLS[i%COLS.length];
        ctx.beginPath();ctx.arc(fx,fy,13,0,TAU);ctx.fill();
        lab(ctx,String(i+1),fx,fy+4,"#fff","center",11);
        lab(ctx,NAMES[i%NAMES.length],fx,fy-20,over?C("--alias"):C("--muted"),"center");
      }
      ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(dev.x,dev.y,22,0,TAU);ctx.fill();
      lab(ctx,"電球",dev.x,dev.y+4,"#fff","center",11);
      lab(ctx,"1 台の Node",dev.x,dev.y+38,C("--muted"),"center");
      if(n===0)lab(ctx,"どの Fabric にも所属していない（工場出荷状態）",dev.x,h*0.3,C("--muted"),"center");
      else lab(ctx,"円の中の数字 = Fabric Index",w-8,14,C("--faint"),"right");
      var used=n*kb,over=Math.max(0,n-sup);
      out.innerHTML='所属 Fabric = <b>'+n+'</b> / 上限 '+sup+
        ' ／ 不揮発メモリ ≈ <b>'+f(used,1)+' KB</b>（'+f(kb,1)+' KB × '+n+'）'+
        ' ／ 各 Fabric ごとに <b>RCAC・NOC・操作用秘密鍵・IPK・ACL・グループ鍵</b>を独立に保持する'+
        ' ／ '+(over>0?'<span class="warn">上限を超えている。'+over+' 件は RESOURCE_EXHAUSTED (0x89) で拒否される</span>'
              :(n>=2?'<span class="ok">Fabric どうしは完全に独立。片方の管理者が他方の設定を見ることはできない（Fabric-Sensitive）</span>'
                    :'<span class="warn">開発中は必ず 3 つ以上の Fabric でテストすること。「1 つ目は動くが 2 つ目で失敗」は定番の不具合</span>'));
    }
    [sn,ss,sk].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 15: chip-tool コマンドビルダー ---------- */
  REG.chiptool=function(el){
    head(el,"chip-tool","コマンドを組み立てる");
    var row=ctrls(el);
    var sk=select(row,"やりたいこと",["コミッショニング（同一ネットワーク上）","コミッショニング（BLE + Wi-Fi）",
      "コミッショニング（BLE + Thread）","コミッショニング（QR / 手動コード）","属性を読む","属性を書く",
      "コマンドを実行","サブスクライブ","ID 直接指定で読む","ワイルドカードで全部読む",
      "ACL を読む","Fabric を確認","コミッショニングウィンドウを開く","ペアリング解除"]);
    var row2=ctrls(el);
    var nid=textin(row2,"Node ID","1","100%");
    var epn=textin(row2,"Endpoint","1","100%");
    var arg=textin(row2,"追加パラメータ","","100%");
    var out=panel(el),rd=readout(el);
    var HINT=["passcode（例 20202021）","SSID PASSWORD passcode discriminator",
      "hex:<dataset> passcode discriminator","MT:… または 11 桁コード",
      "クラスタと属性（例 onoff on-off）","クラスタ 属性 値（例 basicinformation node-label '\"居間\"'）",
      "クラスタ コマンド（例 onoff toggle）","クラスタ 属性 min max（例 onoff on-off 1 60）",
      "cluster-id attribute-id（例 0x0006 0x0000）","（不要）","（不要）","（不要）",
      "timeout iterations discriminator（例 300 1000 3840）","（不要）"];
    function draw(){
      var k=+sk.value,n=nid.value.trim()||"1",e=epn.value.trim()||"1",a=arg.value.trim();
      arg.parentElement.querySelector("label").textContent="追加パラメータ — "+HINT[k];
      var cmd,note;
      switch(k){
        case 0: cmd="chip-tool pairing onnetwork "+n+" "+(a||"20202021");
                note="開発中に最速。Linux 上のサンプルアプリなら BLE もネットワーク設定も不要。";break;
        case 1: cmd="chip-tool pairing ble-wifi "+n+" "+(a||"<SSID> <PASSWORD> 20202021 3840");
                note="BLE で接続し、Wi-Fi 認証情報を渡す。";break;
        case 2: cmd="chip-tool pairing ble-thread "+n+" "+(a||"hex:<dataset> 20202021 3840");
                note="Dataset は ot-ctl dataset active -x で取得する（04 章）。";break;
        case 3: cmd="chip-tool pairing code "+n+" "+(a||"MT:-24J0AFN00KA0648G00");
                note="QR ペイロードでも 11 桁の手動コードでもよい。";break;
        case 4: cmd="chip-tool "+(a||"onoff on-off").split(" ").slice(0,1)+" read "+
                    (a||"onoff on-off").split(" ").slice(1).join(" ")+" "+n+" "+e;
                note="属性名はハイフン区切りの小文字。chip-tool <cluster> read --help で一覧が出る。";break;
        case 5: cmd="chip-tool "+(a||"basicinformation node-label '\"居間\"'").split(" ")[0]+" write "+
                    (a||"basicinformation node-label '\"居間\"'").split(" ").slice(1).join(" ")+" "+n+" 0";
                note="文字列はシングルクォートの中にダブルクォートで囲む。";break;
        case 6: cmd="chip-tool "+(a||"onoff toggle").split(" ")[0]+" "+
                    (a||"onoff toggle").split(" ").slice(1).join(" ")+" "+n+" "+e;
                note="コマンドに引数があれば、コマンド名の後ろに並べる。";break;
        case 7: cmd="chip-tool "+(a||"onoff on-off 1 60").split(" ")[0]+" subscribe "+
                    (a||"onoff on-off 1 60").split(" ").slice(1).join(" ")+" "+n+" "+e;
                note="min / max は秒。interactive start の中で使うと継続して受信できる。";break;
        case 8: cmd="chip-tool any read-by-id "+(a||"0x0006 0x0000")+" "+n+" "+e;
                note="未対応クラスタや独自クラスタを叩くときに便利。";break;
        case 9: cmd="chip-tool any read-by-id 0xFFFFFFFF 0xFFFFFFFF "+n+" 0xFFFF";
                note="全 Endpoint / 全クラスタ / 全属性。Thread 機器では応答が巨大になり失敗しやすい（09 章）。";break;
        case 10: cmd="chip-tool accesscontrol read acl "+n+" 0";
                 note="0x7E (UNSUPPORTED_ACCESS) が出たら真っ先に確認する（14 章）。";break;
        case 11: cmd="chip-tool operationalcredentials read fabrics "+n+" 0\n"+
                     "chip-tool operationalcredentials read commissioned-fabrics "+n+" 0\n"+
                     "chip-tool operationalcredentials read supported-fabrics "+n+" 0";
                 note="「2 つ目の Fabric で失敗する」ときの確認（14 章）。";break;
        case 12: cmd="chip-tool pairing open-commissioning-window "+n+" 1 "+(a||"300 1000 3840");
                 note="マルチアドミン。1 = ECM（新しい検証子を使う。推奨）。表示されたコードを別のコントローラで読む。";break;
        case 13: cmd="chip-tool pairing unpair "+n;
                 note="コントローラ側の Fabric から削除する。機器側にも RemoveFabric が送られる。";break;
      }
      out.innerHTML='<div style="color:var(--muted)">コマンド</div>'+
        '<div style="background:var(--screen);padding:.6rem;border-radius:8px;margin-top:.3rem;'+
        'white-space:pre-wrap;word-break:break-all;color:var(--signal);font-weight:600">'+esc(cmd)+'</div>'+
        '<div style="color:var(--muted);margin-top:.5rem">'+note+'</div>';
      rd.innerHTML='<b>interactive start</b> を使うと CASE セッションが維持され、応答が劇的に速くなる'+
        ' ／ 実機の証明書を検証するには <code>--paa-trust-store-path</code> を指定する'+
        ' ／ 別 Fabric として動かすには <code>--commissioner-name beta</code>';
    }
    sk.addEventListener("change",draw);
    [nid,epn,arg].forEach(function(t){t.addEventListener("input",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 16: ZAP の属性格納方式 ---------- */
  REG.zap=function(el){
    head(el,"ZAP Storage","RAM / 不揮発 / External の使い分け");
    var row=ctrls(el);
    var sa=select(row,"属性の例",["OnOff（電球の点灯状態）","NodeLabel（ユーザーが付けた名前）",
      "MeasuredValue（温度センサー）","StartUpOnOff（電源投入時の状態）","CurrentLevel（明るさ）"]);
    var out=panel(el),rd=readout(el);
    var A=[
      {n:"OnOff",rec:"RAM",why:"電源断で保持する必要は通常ない（StartUpOnOff が起動時の値を決める）。",
       code:"// Matter → ハードウェア\nvoid MatterPostAttributeChangeCallback(const ConcreteAttributePath & path,\n                                       uint8_t type, uint16_t size, uint8_t * value)\n{\n    if (path.mClusterId == OnOff::Id &&\n        path.mAttributeId == OnOff::Attributes::OnOff::Id)\n        SetRelay(path.mEndpointId, *value);\n}\n\n// ハードウェア → Matter（物理スイッチが押されたとき）\nOnOff::Attributes::OnOff::Set(endpoint, on);   // 報告も自動でトリガされる"},
      {n:"NodeLabel",rec:"不揮発 (NVM)",why:"ユーザーが付けた名前は電源を切っても残らなければならない。",
       code:"// ZAP で「不揮発」を選ぶだけ。SDK が保存・復元する。\n// 手動で読み書きする場合:\nBasicInformation::Attributes::NodeLabel::Get(0, span);"},
      {n:"MeasuredValue",rec:"External",why:"読まれたときだけセンサーを叩けばよい。消費電力の面で有利。",
       code:"Protocols::InteractionModel::Status\nemberAfExternalAttributeReadCallback(EndpointId ep, ClusterId cl,\n        const EmberAfAttributeMetadata * md, uint8_t * buf, uint16_t maxLen)\n{\n    if (cl == TemperatureMeasurement::Id &&\n        md->attributeId == TemperatureMeasurement::Attributes::MeasuredValue::Id)\n    {\n        int16_t v = ReadSensor();      // 0.01 °C 単位\n        memcpy(buf, &v, sizeof(v));\n        return Status::Success;\n    }\n    return Status::Failure;\n}\n\n// External では変更通知が自動では飛ばない。自分で呼ぶこと:\nMatterReportingAttributeChangeCallback(ep,\n    TemperatureMeasurement::Id,\n    TemperatureMeasurement::Attributes::MeasuredValue::Id);"},
      {n:"StartUpOnOff",rec:"不揮発 (NVM)",why:"「停電から復帰したら点灯する」という設定は保持が必要。",
       code:"// ZAP で不揮発を指定。起動時に読んで初期状態を決める。"},
      {n:"CurrentLevel",rec:"RAM（または不揮発）",why:"揮発でよいことが多いが、復帰時に前の明るさに戻したいなら不揮発。",
       code:"LevelControl::Attributes::CurrentLevel::Set(endpoint, level);  // 0〜254"}
    ];
    function draw(){
      var a=A[+sa.value];
      var h=tbl(["方式","内容","この属性には"],[
        ["<b>RAM</b>","SDK 内部の配列に保持",a.rec==="RAM"||a.rec.indexOf("RAM")===0?'<b class="ok">推奨</b>':"—"],
        ["<b>不揮発 (NVM)</b>","電源断で保持",a.rec.indexOf("不揮発")>=0?'<b class="ok">推奨</b>':"—"],
        ["<b>External</b>","SDK は値を持たず、毎回コールバックで取得",a.rec==="External"?'<b class="ok">推奨</b>':"—"]
      ]);
      h+='<div style="color:var(--muted);margin-top:.5rem">理由</div><div>'+a.why+'</div>';
      h+='<div style="color:var(--muted);margin-top:.5rem">実装</div>'+
         '<pre style="background:var(--screen);padding:.6rem;border-radius:8px;overflow-x:auto;'+
         'font-size:.76rem;line-height:1.5;margin:.3rem 0 0">'+esc(a.code)+'</pre>';
      out.innerHTML=h;
      rd.innerHTML='<span class="warn">最頻出のバグ: 報告トリガの呼び忘れ</span>。'+
        '「読めば正しいが通知が来ない」ならこれ（10 章）'+
        ' ／ <span class="warn">別スレッド／割り込みから SDK API を直接呼ばない</span>。'+
        '<code>PlatformMgr().ScheduleWork()</code> かロックを使う（16 章）';
    }
    sa.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 17: TLV コーデック ---------- */
  REG.tlv=function(el){
    head(el,"Matter TLV","JSON ではなくバイナリ。整数は最小サイズで符号化される");
    var row=ctrls(el);
    var sm=select(row,"エンコードする値",["構造体 { 0: true, 1: 42 }","構造体 { 0: false, 1: 300 }",
      "符号なし整数 5","符号なし整数 1000","符号付き整数 -42","文字列 \"Light\"",
      "配列 [1, 2, 3]","真偽値 true","null","構造体 { 0: 1, 1: \"居間\" }"]);
    var out=panel(el),rd=readout(el);
    // TLV エンコーダ（この章で扱う範囲に限定した実装）
    function u(v){ // 最小サイズの符号なし整数
      if(v<=0xFF)return {t:0x04,b:[v]};
      if(v<=0xFFFF)return {t:0x05,b:[v&0xFF,(v>>8)&0xFF]};
      return {t:0x06,b:[v&0xFF,(v>>8)&0xFF,(v>>16)&0xFF,(v>>>24)&0xFF]};
    }
    function s(v){
      if(v>=-128&&v<=127)return {t:0x00,b:[v&0xFF]};
      if(v>=-32768&&v<=32767)return {t:0x01,b:[v&0xFF,(v>>8)&0xFF]};
      return {t:0x02,b:[v&0xFF,(v>>8)&0xFF,(v>>16)&0xFF,(v>>>24)&0xFF]};
    }
    function utf8(str){var o=[],e=new TextEncoder().encode(str);for(var i=0;i<e.length;i++)o.push(e[i]);return o;}
    function build(kind){
      var out=[],desc=[];
      function push(ctrl,tag,payload,note){
        out.push(ctrl);if(tag!==null)out.push(tag);
        payload.forEach(function(b){out.push(b);});
        desc.push([pad(ctrl.toString(16).toUpperCase(),2)+
          (tag!==null?" "+pad(tag.toString(16).toUpperCase(),2):"")+
          (payload.length?" "+payload.map(function(b){return pad(b.toString(16).toUpperCase(),2);}).join(" "):""),note]);
      }
      switch(kind){
        case 0:
          push(0x15,null,[],"Structure 開始（Anonymous tag）");
          push(0x29,0x00,[],"Context tag 0, Boolean = true");
          push(0x24,0x01,[42],"Context tag 1, UInt8 = 42 (0x2A)");
          push(0x18,null,[],"End of Container");break;
        case 1:
          push(0x15,null,[],"Structure 開始");
          push(0x28,0x00,[],"Context tag 0, Boolean = false");
          push(0x25,0x01,[0x2C,0x01],"Context tag 1, UInt16 = 300（1 byte に収まらない）");
          push(0x18,null,[],"End of Container");break;
        case 2: push(0x04,null,[5],"Anonymous, UInt8 = 5");break;
        case 3: push(0x05,null,[0xE8,0x03],"Anonymous, UInt16 = 1000（リトルエンディアン）");break;
        case 4: push(0x00,null,[0xD6],"Anonymous, Int8 = -42（2 の補数 0xD6）");break;
        case 5: var b5=utf8("Light");
          push(0x0C,null,[b5.length].concat(b5),"UTF-8 String（長さ 1 byte）: \"Light\"");break;
        case 6:
          push(0x16,null,[],"Array 開始");
          push(0x04,null,[1],"UInt8 = 1");
          push(0x04,null,[2],"UInt8 = 2");
          push(0x04,null,[3],"UInt8 = 3");
          push(0x18,null,[],"End of Container");break;
        case 7: push(0x09,null,[],"Boolean = true（値のバイトを持たない）");break;
        case 8: push(0x14,null,[],"Null");break;
        case 9:
          push(0x15,null,[],"Structure 開始");
          push(0x24,0x00,[1],"Context tag 0, UInt8 = 1");
          var b9=utf8("居間");
          push(0x2C,0x01,[b9.length].concat(b9),"Context tag 1, UTF-8 String = \"居間\"（"+b9.length+" byte）");
          push(0x18,null,[],"End of Container");break;
      }
      return {bytes:out,desc:desc};
    }
    function draw(){
      var r=build(+sm.value);
      var h='<div style="color:var(--muted)">エンコード結果（'+r.bytes.length+' バイト）</div>';
      h+='<div style="font-size:1.05rem;font-weight:700;color:var(--signal);letter-spacing:.1em;word-break:break-all">'+
         r.bytes.map(function(b){return pad(b.toString(16).toUpperCase(),2);}).join(" ")+'</div>';
      h+='<div style="color:var(--muted);margin-top:.5rem">要素ごとの内訳</div>';
      h+=tbl(["バイト列","意味"],r.desc);
      h+='<div style="color:var(--muted);margin-top:.5rem">参考: 同じ内容の JSON</div>';
      var js=['{"0":true,"1":42}','{"0":false,"1":300}','5','1000','-42','"Light"','[1,2,3]','true','null','{"0":1,"1":"居間"}'][+sm.value];
      h+='<div>'+esc(js)+'　<span style="color:var(--muted)">（'+new TextEncoder().encode(js).length+' バイト）</span></div>';
      out.innerHTML=h;
      var jb=new TextEncoder().encode(js).length;
      rd.innerHTML='TLV <b>'+r.bytes.length+'</b> バイト vs JSON <b>'+jb+'</b> バイト'+
        ' ／ Control Byte の上位 3 bit が Tag の形式、下位 5 bit が型'+
        ' ／ <b>整数は必要な最小サイズで符号化される</b>（5 は 1 バイト、300 は 2 バイト）'+
        ' ／ <b>Boolean は値のバイトを持たない</b>（Control Byte だけ）'+
        ' ／ 知らないタグは読み飛ばせるので、仕様の拡張に強い'+
        ' ／ <span class="warn">802.15.4 の 127 バイトフレームに収めるための設計である（03 章）</span>';
    }
    sm.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 17: 電池寿命（章 17 用の別名） ---------- */
  REG.battery=REG.sedpower;

  /* ---------- 18: OTA のシーケンス ---------- */
  REG.ota=function(el){
    head(el,"OTA","QueryImage → BDX → Apply");
    var row=ctrls(el);
    var ss=slider(row,"ステップ",1,7,7,1);
    var sz=slider(row,"イメージのサイズ（KB）",64,4096,800,32);
    var sn=select(row,"ネットワーク",["Thread (250 kbps, 実効 ~15%)","Wi-Fi (実効 5 Mbps)","Ethernet (実効 50 Mbps)"]);
    var out=panel(el),rd=readout(el);
    var S=[
      ["Provider を知る","DefaultOTAProviders 属性、または AnnounceOTAProvider コマンド"],
      ["QueryImage","VID/PID/現在の SoftwareVersion を送って問い合わせる"],
      ["QueryImageResponse","UpdateAvailable / Busy / NotAvailable。Busy なら DelayedActionTime だけ待つ"],
      ["BDX でダウンロード","Matter セッション上のブロック転送。暗号化・認証済み"],
      ["ApplyUpdateRequest","「適用してよいですか」"],
      ["ApplyUpdateResponse","Proceed / AwaitNextAction / Discontinue"],
      ["再起動して適用 → NotifyUpdateApplied","起動に失敗したら旧イメージへロールバック"]
    ];
    var RATE=[250*0.15,5000,50000]; // kbps 実効
    function draw(){
      var n=+ss.input.value,kb=+sz.input.value,r=RATE[+sn.value];
      ss.val.textContent=n+" / 7";sz.val.textContent=kb+" KB";
      var sec=kb*8/r;
      var h="";
      S.forEach(function(s,i){
        var cur=(i===n-1),done=(i<n-1);
        h+='<div style="padding:.32rem .6rem;margin-bottom:.2rem;border-radius:6px;'+
          (cur?'background:var(--signal);color:#fff':(done?'background:var(--signal-soft)':'opacity:.32'))+'">'+
          '<b>'+(i+1)+'. '+s[0]+'</b>'+
          (cur||done?'<div style="'+(cur?'color:rgba(255,255,255,.9)':'color:var(--muted)')+'">'+s[1]+'</div>':'')+
          '</div>';
      });
      h+='<div style="margin-top:.6rem;color:var(--muted)">転送時間の見積り</div>';
      h+=tbl(["ネットワーク","実効速度",kb+" KB の転送時間"],[
        ["Thread","約 "+f(RATE[0],0)+" kbps",f(kb*8/RATE[0]/60,1)+" 分"],
        ["Wi-Fi","約 5 Mbps",f(kb*8/RATE[1],1)+" 秒"],
        ["Ethernet","約 50 Mbps",f(kb*8/RATE[2],2)+" 秒"]
      ]);
      out.innerHTML=h;
      rd.innerHTML='この構成での転送時間 ≈ <b class="'+(sec>600?"warn":"ok")+'">'+
        (sec>60?f(sec/60,1)+" 分":f(sec,1)+" 秒")+'</b>'+
        ' ／ Flash は<b>新旧 2 面分</b>が必要（'+f(kb*2/1024,1)+' MB 以上）'+
        ' ／ '+(sec>600?'<span class="warn">Thread では数十分かかる。イメージを小さくし、更新中も基本機能が動く設計にすること</span>'
                     :'<span class="ok">現実的な転送時間</span>')+
        ' ／ <span class="warn">転送路は Matter セッションで保護されるが、イメージ自体の署名検証はメーカーの責任。セキュアブートで検証するのが定石</span>';
    }
    ss.input.addEventListener("input",draw);sz.input.addEventListener("input",draw);
    sn.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 19: ブリッジの構成 ---------- */
  REG.bridge=function(el){
    head(el,"Bridge","1 台の Node が配下機器を Endpoint で表現する");
    var row=ctrls(el);
    var sn=slider(row,"配下機器の数",1,20,4,1);
    var sr=slider(row,"うち到達不能な機器",0,5,1,1);
    var sf=slider(row,"Fabric 数",1,5,3,1);
    var sa=slider(row,"機器あたりの購読属性数",1,10,4,1);
    var out=panel(el),rd=readout(el);
    var TYPES=[["On/Off Light (0x0100)","On/Off"],["Temperature Sensor (0x0302)","Temperature Measurement"],
      ["Contact Sensor (0x0015)","Boolean State"],["Dimmable Light (0x0101)","On/Off, Level Control"],
      ["Occupancy Sensor (0x0107)","Occupancy Sensing"]];
    function draw(){
      var n=+sn.input.value,unreach=Math.min(+sr.input.value,n),nf=+sf.input.value,na=+sa.input.value;
      sn.val.textContent=n;sr.val.textContent=unreach;sf.val.textContent=nf;sa.val.textContent=na;
      var rows=[["<b>0</b>","Root Node (0x0016)","Descriptor, Basic Information, Access Control, …","—"]];
      rows.push(["<b>1</b>","<b>Aggregator (0x000E)</b>",
        "Descriptor（PartsList = ["+Array.from({length:n},function(_,i){return i+2;}).join(", ")+"]）","—"]);
      for(var i=0;i<Math.min(n,12);i++){
        var t=TYPES[i%TYPES.length];
        var ok=(i>=unreach);
        rows.push([String(i+2),"Bridged Node (0x0013) + "+t[0],
          "Bridged Device Basic Information, "+t[1],
          ok?'<b class="ok">Reachable = true</b>':'<b class="warn">Reachable = false</b>']);
      }
      if(n>12)rows.push(["…","（ほか "+(n-12)+" 台）","",""]);
      var h=tbl(["Endpoint","Device Type","主なクラスタ","状態"],rows);
      var paths=n*na*nf;
      h+='<div style="color:var(--muted);margin-top:.6rem">リソースの見積り</div>';
      h+=tbl(["項目","値"],[
        ["動的 Endpoint 数",String(n)+"（CHIP_DEVICE_CONFIG_DYNAMIC_ENDPOINT_COUNT の上限内であること）"],
        ["サブスクリプションのパス数",'<b class="'+(paths>200?"warn":"ok")+'">'+paths+'</b>'+
          "（"+n+" 台 × "+na+" 属性 × "+nf+" Fabric）"],
        ["Fabric ごとの不揮発","約 1.5 KB × "+nf+" = "+f(nf*1.5,1)+" KB"]
      ]);
      out.innerHTML=h;
      rd.innerHTML=(unreach>0
        ?'<span class="ok">到達不能な '+unreach+' 台は Reachable = false。コントローラが「オフライン」と正しく表示できる</span>'
        :'<span class="warn">Reachable を常に true にすると、電源が抜かれた機器も操作可能に見えてしまう。ユーザーにとって最悪の体験</span>')+
        ' ／ '+(paths>200?'<span class="warn">パス数が多い。MCU では厳しい。ブリッジが Linux クラスで作られるのはこのため</span>'
                       :'<span class="ok">現実的な規模</span>')+
        ' ／ 配下機器が増減したら <b>Aggregator の PartsList の変更を報告する</b>こと（忘れるとアプリに出てこない）';
    }
    [sn,sr,sf,sa].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 20: コントローラ開発の道 ---------- */
  REG.ctrlpath=function(el){
    head(el,"Controller","3 つの道。できることが違う");
    var row=ctrls(el);
    var b1=checkbox(row,"独自クラスタ／独自機能を扱いたい",false);
    var b2=checkbox(row,"ユーザーの既存の家（Apple/Google 等）に統合したい",true);
    var b3=checkbox(row,"自分でハブ製品を作る",false);
    var b4=checkbox(row,"プロトタイプ／社内ツールで十分",false);
    var out=panel(el),rd=readout(el);
    function draw(){
      var rec,why;
      if(b4.checked){rec="(c) 既存 OSS を使う";
        why="python-matter-server や Home Assistant を立てれば、WebSocket 経由でコミッショニングも属性操作もできる。自社製品の検証環境としても有用。";}
      else if(b3.checked||b1.checked){rec="(b) 自前のコントローラ（自分の Fabric）";
        why="すべての機能にアクセスでき、独自クラスタも扱える。ただし Root CA を運営し、機器ごとに NOC を発行する必要がある（最大の負担）。";}
      else if(b2.checked){rec="(a) エコシステムの API を使う";
        why="ユーザーはすでに Apple Home や Google Home を使っている。そこに載せるのが自然。コミッショニングもエコシステムに任せられる。ただし独自クラスタは扱えないことが多い。";}
      else {rec="(a) エコシステムの API を使う";why="最も導入が容易。まずここから検討する。";}
      var rows=[
        ["Fabric","エコシステムの Fabric","<b>自分の Fabric</b>","その実装の Fabric"],
        ["CA の運営","不要","<b class='warn'>必要</b>","不要"],
        ["独自クラスタ","扱えないことが多い","<b class='ok'>扱える</b>","実装次第"],
        ["実装量","小","<b class='warn'>大</b>","極小"],
        ["音声・自動化との連携","<b class='ok'>あり</b>","自前","限定的"],
        ["向くケース","メーカーのアプリ","ハブ製品・特殊用途","プロトタイプ・検証"]
      ];
      out.innerHTML='<div style="margin-bottom:.5rem">推奨: <b class="ok" style="font-size:1.05rem">'+rec+'</b></div>'+
        '<div style="color:var(--muted);margin-bottom:.6rem">'+why+'</div>'+
        tbl(["観点","(a) エコシステム API","(b) 自前 Fabric","(c) 既存 OSS"],rows);
      rd.innerHTML='「Matter で基本操作、独自機能は自社アプリの直接通信で」というハイブリッド構成が現実的な落としどころになることが多い'+
        ' ／ <span class="warn">マルチアドミン（OpenCommissioningWindow）はアプリの必須機能。実装しないと他社エコシステムに追加できない</span>';
    }
    [b1,b2,b3,b4].forEach(function(b){b.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 21: 障害の切り分け ---------- */
  REG.triage=function(el){
    head(el,"Triage","必ず下の層から切り分ける");
    var row=ctrls(el);
    var sm=select(row,"症状",["BLE で見つからない","ネットワーク参加後に見つからない",
      "コマンドが失敗する（0x7E）","コマンドが失敗する（0x81 / 0x86 / 0xC3）",
      "サブスクリプションの通知が来ない","時々失敗する・たまにクラッシュする",
      "2 つ目の Fabric で失敗する","コミッショニングが 90% で止まる","OTA が始まらない"]);
    var out=panel(el),rd=readout(el);
    var T=[
      {steps:[["機器がアドバタイズしているか","BLE スキャナアプリ（nRF Connect など）で確認"],
              ["Discriminator が一致しているか","機器のログと QR コードを突き合わせる"],
              ["Commissioning Window が開いているか","機器のログ。既に参加済みならファクトリリセット"],
              ["スマホの BLE 権限","OS の設定。位置情報権限が絡む OS もある"]],
       ch:"05・13 章"},
      {steps:[["機器が IP アドレスを取得しているか","機器のログ、<code>ot-ctl ipaddr</code>"],
              ["ping6 が通るか","<code>ping6 ff02::1</code> で機器が見えるか → <code>ping6 &lt;addr&gt;</code>"],
              ["mDNS が出ているか","<code>dns-sd -B _matter._tcp</code> / <code>avahi-browse -r _matter._tcp</code>"],
              ["Thread なら SRP 登録","<code>ot-ctl srp client state</code> → <code>ot-ctl srp server service</code>"],
              ["マルチキャストが通る環境か","ゲスト Wi-Fi・クライアント分離・VLAN・メッシュ中継を疑う"]],
       ch:"<b class='warn'>最頻出。03・06 章</b>"},
      {steps:[["ACL を読む","<code>chip-tool accesscontrol read acl &lt;node-id&gt; 0</code>"],
              ["エントリの AuthMode / Subjects / Targets / Privilege を確認","14 章のデモで判定できる"],
              ["コミッショニング時の CaseAdminSubject","AddNOC で 1 件目が自動生成されているか"],
              ["Fabric-Scoped の実装","他 Fabric のエントリを消していないか"]],
       ch:"14 章"},
      {steps:[["実装されているか確認","<code>chip-tool any read-by-id &lt;cluster&gt; 0xFFFB &lt;node&gt; &lt;ep&gt;</code>（AttributeList）"],
              ["コマンドの一覧","<code>0xFFF9</code>（AcceptedCommandList）"],
              ["クラスタの一覧","Descriptor の ServerList"],
              ["ZAP の定義と生成コードの整合","<code>.matter</code> の差分を確認"]],
       ch:"08・16 章"},
      {steps:[["属性を直接読んで値を比べる","読めば正しいなら → <b>報告トリガの呼び忘れ</b>"],
              ["MatterReportingAttributeChangeCallback を呼んでいるか","External 属性では自動では飛ばない"],
              ["MinIntervalFloor で間引かれていないか","購読パラメータを確認"],
              ["購読自体が成立しているか","RESOURCE_EXHAUSTED / ACL / パス数"]],
       ch:"10・16 章"},
      {steps:[["<b>別スレッド／割り込みから SDK API を呼んでいないか</b>","第 1 容疑者。<code>PlatformMgr().ScheduleWork()</code> かロックを使う"],
              ["電波干渉","チャネルを変えて再現するか（Thread/Wi-Fi/BLE はすべて 2.4 GHz）"],
              ["メモリ不足","ヒープ使用量、RESOURCE_EXHAUSTED"],
              ["メッセージカウンタ","再起動後に失敗するなら不揮発保存の漏れ"],
              ["電源の不安定","突入電流を実測"]],
       ch:"16・17 章"},
      {steps:[["CommissionedFabrics と SupportedFabrics を読む","上限に達していないか"],
              ["不揮発メモリの空き","書き込みが失敗していないか"],
              ["Fabric-Scoped 属性の実装","1 つ目の設定を上書きしていないか"],
              ["ACL","2 つ目の Fabric のエントリが作られているか"],
              ["Fail-Safe の巻き戻し","前回の失敗が残っていないか"]],
       ch:"14 章"},
      {steps:[["ConnectNetwork の応答","応答が返る前に機器がネットワークへ移動する。応答なしを異常と決めつけない"],
              ["運用ネットワーク上での再発見","mDNS / SRP（症状 2 と同じ）"],
              ["CASE の確立","NOC・時刻・IPK"]],
       ch:"13 章"},
      {steps:[["Provider の ACL","Requestor が QueryImage を呼べるか。「誰でも Operate 可」のエントリが要る"],
              ["DefaultOTAProviders / AnnounceOTAProvider","Provider を知っているか"],
              ["SoftwareVersion","Provider 側の版が大きいか。単調増加の整数か"],
              ["UpdateState 属性","どこで止まっているかが読める"]],
       ch:"18 章"}
    ];
    function draw(){
      var t=T[+sm.value];
      var h='<div style="color:var(--muted);margin-bottom:.4rem">確認する順序（上から）</div>';
      t.steps.forEach(function(s,i){
        h+='<div style="padding:.35rem .6rem;margin-bottom:.22rem;border-radius:6px;background:var(--signal-soft)">'+
           '<b>'+(i+1)+'. '+s[0]+'</b><div style="color:var(--muted)">'+s[1]+'</div></div>';
      });
      out.innerHTML=h;
      rd.innerHTML='参照: '+t.ch+
        ' ／ <b>下の層から順に</b>切り分ける。いきなり Matter のログを読み始めると、実はネットワークの問題だったケースで時間を溶かす'+
        ' ／ エラーメッセージをそのまま GitHub Issue で検索するのも有効（既知であることが多い）';
    }
    sm.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 22: 認証プロセス ---------- */
  REG.certflow=function(el){
    head(el,"Certification","数か月のリードタイムを見込む");
    var row=ctrls(el);
    var ss=slider(row,"進捗",0,11,4,1);
    var out=panel(el),rd=readout(el);
    var P=[
      ["CSA 会員登録","最低 Adopter。年会費。法務・調達との連携が要る","数週間"],
      ["VID の取得","<b>最優先</b>。これがないと証明書も CD も認証申請もできない","数週間"],
      ["仕様バージョンの決定","製品カテゴリが定義された版以降、かつエコシステムが対応している版","—"],
      ["開発","テスト VID (0xFFF1-4) で進める。Test Harness を早期に導入","—"],
      ["証明書の調達体制","CSA の PAA / 自社 PAA / PKI ベンダー。量産ラインの設計も","1〜数か月"],
      ["CD の取得","CSA に VID/PID を申請","数週間"],
      ["社内テスト","Test Harness で全項目パスさせる","—"],
      ["認証テスト","認定試験所（ATL）または規定に沿った自己試験","数週間〜"],
      ["CSA へ申請・審査","","数週間"],
      ["認証取得・DCL 登録","","—"],
      ["各エコシステムでの動作確認","CSA 認証とは<b>別の手続き</b>。バッジも各社別","—"],
      ["出荷","量産の Factory Data 書き込み、個体の一意性検査","—"]
    ];
    function draw(){
      var n=+ss.input.value;ss.val.textContent=n+" / 12";
      var h="";
      P.forEach(function(p,i){
        var done=(i<n),cur=(i===n);
        h+='<div style="padding:.32rem .6rem;margin-bottom:.2rem;border-radius:6px;display:flex;gap:.6rem;'+
          (cur?'background:var(--signal);color:#fff':(done?'background:var(--signal-soft)':'opacity:.35'))+'">'+
          '<b style="min-width:1.4em">'+(done?"✓":(i+1))+'</b>'+
          '<div style="flex:1"><b>'+p[0]+'</b>'+
          (p[1]?'<div style="'+(cur?'color:rgba(255,255,255,.9)':'color:var(--muted)')+'">'+p[1]+'</div>':'')+
          '</div><span style="color:'+(cur?'rgba(255,255,255,.8)':'var(--faint)')+';white-space:nowrap">'+p[2]+'</span></div>';
      });
      out.innerHTML=h;
      rd.innerHTML=(n<2?'<span class="warn">CSA 会員登録と VID 取得は最優先。開発開始と同時に着手すること</span>'
        :(n<7?'<span class="warn">Test Harness は開発中から定期的に回すこと。直前に初めて走らせると大量に落ちて手戻りになる</span>'
              :(n<11?'<span class="ok">よく落ちるのは: 必須クラスタの欠落、FeatureMap の不一致、Fail-Safe、マルチアドミン、ファクトリリセット、ACL</span>'
                    :'<span class="warn">CSA 認証を取っても、各エコシステムでの動作は別途確認が必要。出荷前にターゲット全社の実機で確認すること</span>')))+
        ' ／ 合計で<b>数か月</b>。「ソフトが完成したら認証を取ろう」では間に合わない';
    }
    ss.input.addEventListener("input",draw);reg(null,draw);draw();
  };

  /* ---------- 23: チェックリスト ---------- */
  REG.checklist=function(el){
    head(el,"Checklist","設計・コードレビューで使う");
    var row=ctrls(el);
    var sg=select(row,"分野",["設計段階で決めること","ネットワーク","データモデル","セキュリティ","実装","認証・製品化"]);
    var out=panel(el),rd=readout(el);
    var CK=[
      [["ネットワーク（Wi-Fi / Thread）を決めた","基板からやり直しになる（05 章）"],
       ["Flash 2 MB 以上・RAM 128 KB 以上を確保した","OTA が載らない（17 章）"],
       ["証明書の調達方式を決めた","量産に間に合わない（12 章）"],
       ["VID を申請した","認証申請ができない（22 章）"],
       ["セキュアストレージのある SoC を選んだ","鍵の保護ができない（11 章）"],
       ["対応 Fabric 数と不揮発メモリを見積もった","2 つ目の Fabric で失敗する（14 章）"],
       ["仕様バージョンを決め、SDK をタグで固定した","認証で対象外になる（22 章）"],
       ["Factory Data の書き込み方式を製造部門と決めた","量産ラインが組めない（17 章）"],
       ["対象エコシステムを決めた","出荷後に「動かない」と発覚（20 章）"]],
      [["SII/SAI を DNS-SD で正しく広告している","再送で電池が減る（06 章）"],
       ["メッセージカウンタを不揮発に保存している","再起動後に拒否される（06 章）"],
       ["起動時にランダム遅延を入れている","停電の一斉復帰で輻輳（17 章）"],
       ["Thread なら SRP 登録を確認できる","機器が見つからない（04 章）"],
       ["大きな読み出しを分割している","127 バイトフレーム（03 章）"],
       ["IPv6 が必要である旨をユーザー向けに案内する","ルータ設定への依存（05 章）"]],
      [["FeatureMap で宣言した機能がすべて動く","認証で確実に落ちる（08 章）"],
       ["Device Library の必須クラスタをすべて実装した","認証で落ちる（08 章）"],
       ["単位が正しい（温度 0.01°C・明るさ 0〜254・色温度ミレッド・照度は対数）","最頻出のバグ（08 章）"],
       ["Nullable に対応している（測れないときは null）","0 を返さない（07 章）"],
       ["Identify が目に見える反応を返す","ユーザーが機器を特定できない（08 章）"],
       ["SoftwareVersion が単調増加の整数","OTA が壊れる（08 章）"],
       ["UniqueID が個体ごとに違う","複数台登録で問題（08 章）"],
       ["<b>ハードウェア → Matter の反映を実装した</b>","物理操作がアプリに反映されない（16 章）"],
       ["<b>報告トリガを呼んでいる</b>","「読めば正しいが通知が来ない」（10 章）"],
       ["Client 側クラスタも実装した（スイッチなら）","何も制御できない（07 章）"]],
      [["ハードウェア TRNG を使っている","rand() は暗号を無意味にする（11 章）"],
       ["DAC 秘密鍵を SE か暗号化領域に置いている","平文保存は論外（11 章）"],
       ["passcode / discriminator / DAC が個体ごとに違う","誰でもコミッショニングできる（13 章）"],
       ["テスト証明書が量産ビルドに入らない仕組みがある","CI でチェック（12 章）"],
       ["PASE の試行回数を制限している","総当たりを許す（13 章）"],
       ["Commissioning Window を確実に閉じる","参加可能な状態が残る（13 章）"],
       ["ファクトリリセットで全部消える（実際にダンプして確認）","前の持ち主の情報が残る（14 章）"],
       ["セキュアブートを有効にした","改竄ファームが動く（11 章）"],
       ["デバッグポートを出荷時に閉じる","鍵が抜かれる（11 章）"],
       ["リリースビルドのログに鍵が出ない","GitHub の issue から漏れる事故がある（11 章）"]],
      [["<b>別スレッドから SDK API を直接呼んでいない</b>","たまにクラッシュする（16 章）"],
       ["コールバックの中でブロックしていない","スタック全体が止まる（09 章）"],
       ["生成コードを手で編集していない","再生成で消える（16 章）"],
       ["CI で ZAP 再生成の差分がゼロ","定義と実装の食い違い（16 章）"],
       ["OTA イメージの署名を検証している","重大な脆弱性（18 章）"],
       ["OTA のロールバックがある","更新失敗で文鎮化（18 章）"],
       ["電池寿命を実測した","机上計算だけでは危険（17 章）"],
       ["ブリッジなら Reachable を実装した","オフライン機器が操作可能に見える（19 章）"],
       ["マルチアドミンを 3 Fabric 以上でテストした","定番の不具合（14 章）"]],
      [["Test Harness を開発中から定期的に回している","直前では手遅れ（22 章）"],
       ["CD を取得した","認証申請の前提（12 章）"],
       ["QR コードの印刷品質を実機で確認した","読めないと詰む（22 章）"],
       ["手動コードを併記した","QR が読めないときの救済（13 章）"],
       ["Thread なら「Border Router が必要」を箱に明記した","ユーザーが設定できない（04 章）"],
       ["各エコシステムの実機で動作確認した","仕様 ≠ エコシステム対応（24 章）"],
       ["OTA の配信体制を整えた","脆弱性対応の前提（18 章）"],
       ["トラブルシューティング手順を用意した","問い合わせは必ず来る（05 章）"]]
    ];
    var state={};
    function draw(){
      var g=+sg.value,L=CK[g];
      if(!state[g])state[g]=L.map(function(){return false;});
      var st=state[g];
      var h="";
      L.forEach(function(c,i){
        h+='<div data-i="'+i+'" style="cursor:pointer;padding:.3rem .6rem;margin-bottom:.2rem;border-radius:6px;'+
           'display:flex;gap:.5rem;background:'+(st[i]?"var(--signal-soft)":"var(--screen)")+'">'+
           '<span style="color:'+(st[i]?"var(--signal)":"var(--faint)")+';font-weight:700">'+(st[i]?"☑":"☐")+'</span>'+
           '<div style="flex:1"><div>'+c[0]+'</div>'+
           '<div style="color:var(--muted);font-size:.92em">→ '+c[1]+'</div></div></div>';
      });
      out.innerHTML=h;
      out.querySelectorAll("[data-i]").forEach(function(d){
        d.addEventListener("click",function(){st[+d.dataset.i]=!st[+d.dataset.i];draw();});
      });
      var done=st.filter(Boolean).length;
      rd.innerHTML='<b>'+done+' / '+L.length+'</b> 項目 ／ '+
        (done===L.length?'<span class="ok">この分野はすべて確認済み</span>'
          :'<span class="warn">未確認 '+(L.length-done)+' 項目</span>')+
        ' ／ クリックでチェックできます（設計レビューで使ってください）';
    }
    sg.addEventListener("change",draw);reg(null,draw);draw();
  };

  /* ---------- 24: バージョンのタイムライン ---------- */
  REG.timeline=function(el){
    head(el,"Versions","対象領域が家全体へ広がってきた");
    var cv=screen(el,220),cc=cctx(cv);var row=ctrls(el);
    var sv=select(row,"バージョン",["1.0 (2022/10)","1.1 (2023/05)","1.2 (2023/10)","1.3 (2024/05)","1.4 (2024/11)","1.4 以降"]);
    var out=panel(el),rd=readout(el);
    var V=[
      {n:"1.0",t:"最初の仕様",add:["照明（On/Off・調光・調色）","スマートプラグ","スイッチ","各種センサー",
        "ドアロック","サーモスタット","ブラインド","メディア機器","ブリッジ"],
       note:"「照明とセンサーの標準」として出発した。"},
      {n:"1.1",t:"安定性と明確化",add:["ICD（間欠動作）の改善","相互運用性の問題修正","仕様の曖昧さの解消"],
       note:"新デバイスタイプの追加はほぼなく、実装の質を上げる版。"},
      {n:"1.2",t:"大型家電",add:["冷蔵庫","ルームエアコン","食洗機","洗濯機","ロボット掃除機",
        "煙/CO 警報器","空気質センサー","空気清浄機","ファン"],
       note:"白物家電へ本格的に拡大。9 種のデバイスタイプが一度に追加された。"},
      {n:"1.3",t:"エネルギー・水・調理",add:["EV 充電器","電力測定","漏水検知・バルブ",
        "電子レンジ","オーブン","コンロ","レンジフード","乾燥機","シーンの改良"],
       note:"エネルギー管理への注力が始まった版。"},
      {n:"1.4",t:"エネルギーの本格対応",add:["太陽光発電","蓄電池","ヒートポンプ","給湯器",
        "Enhanced Multi-Admin","Thread 認証情報の共有","NFC コミッショニング"],
       note:"電力需給の調整（デマンドレスポンス）に使える基盤が揃った。セットアップ体験も改善。"},
      {n:"1.4 以降",t:"継続的な拡大",add:["映像・カメラ領域","開閉制御の拡充","保守リリース"],
       note:"リリースは継続している。<b>最新の状況は必ず CSA の公式情報で確認すること。</b>"}
    ];
    function draw(){
      var k=+sv.value;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var y=h*0.55,x0=w*0.08,x1=w*0.92;
      ctx.strokeStyle=C("--line");ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();
      V.forEach(function(v,i){
        var x=x0+(x1-x0)*i/(V.length-1);
        var cur=(i===k),past=(i<k);
        ctx.fillStyle=cur?C("--signal"):(past?C("--signal-soft"):C("--grid"));
        ctx.beginPath();ctx.arc(x,y,cur?12:8,0,TAU);ctx.fill();
        if(cur){ctx.strokeStyle=C("--signal");ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(x,y,17,0,TAU);ctx.stroke();}
        lab(ctx,v.n,x,y-26,cur?C("--signal"):C("--muted"),"center",cur?13:11);
        lab(ctx,v.t,x,y+34,cur?C("--ink"):C("--faint"),"center",10);
        // 追加数のバー
        var bh=v.add.length*5;
        ctx.fillStyle=cur?C("--signal"):C("--grid");
        ctx.fillRect(x-5,y-40-bh,10,bh);
      });
      lab(ctx,"棒の高さ = 追加された項目の数",x0,18,C("--muted"),"left");
      var v=V[k];
      var hh='<div style="color:var(--muted)">'+v.n+' — '+v.t+'</div>';
      hh+='<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem">'+
        v.add.map(function(a){return '<span style="background:var(--signal-soft);padding:.15rem .55rem;'+
          'border-radius:5px">'+a+'</span>';}).join("")+'</div>';
      hh+='<div style="color:var(--muted);margin-top:.6rem">'+v.note+'</div>';
      out.innerHTML=hh;
      rd.innerHTML='<span class="warn">自分の製品カテゴリが定義された版以降でないと認証は取れない</span>'+
        ' ／ 一方で、<b>エコシステムが対応している版</b>が現実的な上限になる'+
        ' ／ <span class="warn">仕様 ≠ 認証 ≠ エコシステム対応 ≠ 実機動作</span>。出荷前に各社の実機で確認すること';
    }
    sv.addEventListener("change",draw);reg(cv,draw);
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
