  /* ===== 18 章 接続と GATT ===== */
  function _w18_ms(v){return v>=1000?(+(v/1000).toPrecision(4))+" s":(+v.toPrecision(4))+" ms";}

  /* ---- (1) 接続パラメータ: 接続間隔・ペリフェラルレイテンシ・監視タイムアウト ---- */
  REG.w18_conn=function(el,U){
    var S=U.S;
    U.head(el,"CONNECTION","接続パラメータと監視タイムアウト");
    var row=U.ctrls(el);
    var iv=U.slider(row,"接続間隔 I",{min:7.5,max:4000,value:30,log:true,snap:function(v){return Math.max(7.5,Math.min(4000,Math.round(v/1.25)*1.25));},fmt:_w18_ms,onInput:draw});
    var lt=U.slider(row,"ペリフェラルレイテンシ L",{values:[0,1,2,3,4,5,6,8,10,15,20,30,50,100,200,499],value:4,fmt:function(v){return String(v);},onInput:draw});
    var row2=U.ctrls(el);
    var to=U.slider(row2,"監視タイムアウト",{min:100,max:32000,value:4000,log:true,snap:function(v){return Math.max(100,Math.min(32000,Math.round(v/10)*10));},fmt:_w18_ms,onInput:draw});
    var pl=U.slider(row2,"1 回の機会が失われる確率 p",{values:[0,0.01,0.02,0.05,0.1,0.2,0.3,0.5,0.7],value:0.1,fmt:function(v){return Math.round(v*100)+" %";},onInput:draw});
    var br=U.btnrow(el);
    var seed=1;
    U.button(br,"例: 30 ms・L 4・4 s",function(){iv.set(30);lt.set(4);to.set(4000);draw();});
    U.button(br,"悪い例: 50 ms・L 3・300 ms",function(){iv.set(50);lt.set(3);to.set(300);pl.set(0.1);draw();});
    U.button(br,"良い例: 50 ms・L 3・1 s",function(){iv.set(50);lt.set(3);to.set(1000);pl.set(0.1);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var I=iv.get(),L=lt.get(),TO=to.get(),p=pl.get(),E=(1+L)*I,lim=2*E,ok=TO>lim;
      var M=Math.ceil(TO/E-1e-9)-1;               /* 期限より前に来る機会の数 */
      var r=U.rng(seed*7919+13);
      /* 時間軸に描く範囲: 監視タイムアウトの 3 倍か、機会 12 回分の長いほう（機会は最大 90 回まで描く） */
      var span=Math.min(Math.max(3*TO,12*E),90*E), W=700, x0=86, x1=684, o=[];
      var X=function(t){return x0+(x1-x0)*t/span;};
      var yc=44,yp=84,yt=134,th=40;
      o.push(S.T(10,yc+4,"セントラル","start",10,"purple",true));
      o.push(S.T(10,yp+4,"ペリフェラル","start",10,"signal",true));
      o.push(S.T(10,yt-6,"監視の","start",10,"teal",true));o.push(S.T(10,yt+8,"タイマ","start",10,"teal",true));
      var nev=Math.floor(span/I);
      if(nev<=240){for(var k=0;k<=nev;k++){o.push(S.L(X(k*I),yc-6,X(k*I),yc+6,"purple",1));}}
      else o.push(S.RECT(x0,yc-5,x1-x0,10,2,U.soft("purple"),"purple",1));
      o.push(S.T(x1,yc-12,nev<=240?"どの接続イベントでも送る（"+nev+" 回）":"どの接続イベントでも送る（"+nev+" 回。線は省略）","end",9.5,"muted"));
      /* 機会ごとに失われるかを決め、タイマを進める */
      var last=0,pts=[[X(0),yt+th]],drops=[];
      var nOp=Math.floor(span/E);
      for(var m=1;m<=nOp;m++){
        var t=m*E;
        while(t-last>=TO){                         /* 機会より先に期限が来た（切断と判断し、すぐ接続し直したとする） */
          var td=last+TO; pts.push([X(td),yt]);pts.push([X(td),yt+th]);drops.push(td);last=td;
        }
        var lost=r.chance(p), x=X(t);
        if(lost){o.push(S.X(x,yp,5,"alias",1.8));}
        else{o.push(S.RECT(x-5,yp-7,10,14,2,U.soft("signal"),"signal",1.2));}
        if(!lost){var hh=Math.min(1,(t-last)/TO)*th;pts.push([x,yt+th-hh]);pts.push([x,yt+th]);last=t;}
      }
      /* 最後の機会から右端まで */
      while(span-last>=TO){var td2=last+TO;pts.push([X(td2),yt]);pts.push([X(td2),yt+th]);drops.push(td2);last=td2;}
      pts.push([X(span),yt+th-Math.min(1,(span-last)/TO)*th]);
      o.push(S.L(x0,yt,x1,yt,"alias",1.2,"5 3"));o.push(S.T(x1,yt-4,"監視タイムアウト","end",9.5,"alias"));
      o.push(S.PL(pts,"teal",1.6));
      drops.forEach(function(td){o.push(S.L(X(td),yp-14,X(td),yt+th,"alias",2));o.push(S.T(X(td)+3,yp-16,"切断","start",9.5,"alias",true));});
      /* 目盛 */
      var tk=U.nice(0,span,6);
      tk.forEach(function(t){o.push(S.L(X(t),yt+th,X(t),yt+th+4,"muted",1));o.push(S.T(X(t),yt+th+16,_w18_ms(t),"middle",9.5,"muted"));});
      o.push(S.L(x0,yt+th,x1,yt+th,"muted",1));
      box.set(S.svg(W,yt+th+26,o));
      /* 1 時間の模擬 */
      var r2=U.rng(seed*104729+7),nh=Math.floor(3600000/E),run=0,disc=0;
      if(M>=1){for(var q=0;q<nh;q++){if(r2.chance(p)){run++;if(run>=M){disc++;run=0;}}else run=0;}}
      var Lmax=Math.ceil(TO/(2*I)-1-1e-9)-1;
      var cond=ok?'<span class="ok">満たす</span>':'<span class="warn">満たさない（Core Specification の要件に反する）</span>';
      ro.innerHTML="Interval = "+U.fmt.int(I/1.25)+"（× 1.25 ms）・Latency = "+L+"・Timeout = "+U.fmt.int(TO/10)+"（× 10 ms）<br>"+
        "条件: 監視タイムアウト "+_w18_ms(TO)+" &gt; 2(1 + L)I = "+_w18_ms(lim)+" … "+cond+
        (Lmax>=0?"（この I と監視タイムアウトで使える L は "+Math.min(499,Lmax)+" まで）":"（この I では L = 0 でも満たさない）")+"<br>"+
        "ペリフェラルが受信する間隔（最も少ない場合）(1 + L)I = <b>"+_w18_ms(E)+"</b> ・ セントラル → ペリフェラルの最大の待ち <b>"+_w18_ms(E)+"</b> ・ ペリフェラル → セントラル <b>"+_w18_ms(I)+"</b><br>"+
        (M>=1?"期限より前に来る機会 "+M+" 回 → 続けて <b>"+(M-1)+" 回</b>まで失っても保つ":"<span class=\"warn\">次の機会より先に期限が来る（何も失わなくても切断と判断する）</span>")+"<br>"+
        (M>=1?"模擬した 1 時間（機会 "+U.fmt.int(nh)+" 回、p = "+Math.round(p*100)+" %）で切断と判断した回数: <b>"+disc+"</b>":"")+
        '<div class="wnote">ペリフェラルは送るものが無く、(1 + L) 回に 1 回だけ受信するとした。各機会のやり取りは、互いに関係なく確率 p で失われるとした（実際の干渉は続けて起きやすい）。切断と判断した後は、すぐに接続し直したとして続けた。セントラルの行の縦線は、接続イベントごとの送信。</div>';
    }
    draw();
  };

  /* ---- (2) GATT のクライアントとサーバのやり取り ---- */
  var _w18_U1="45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 01 00 3A 5C",_w18_U2="45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 02 00 3A 5C",_w18_U3="45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 03 00 3A 5C";
  function _w18_hx(s){return s.split(" ").filter(function(x){return x;}).map(function(x){return parseInt(x,16);});}
  function _w18_le(v){return [v&255,(v>>8)&255];}
  function _w18_h4(v){return "0x"+("000"+v.toString(16).toUpperCase()).slice(-4);}
  function _w18_table(){
    /* [ハンドル, 型（16 ビット）か 128 ビットの型の名前, 値, 読める, 書ける, 種類, 名前] */
    return [
      [0x0001,0x2800,[0x00,0x18],1,0,"svc","Generic Access（0x1800）"],
      [0x0002,0x2803,[0x02,0x03,0x00,0x00,0x2A],1,0,"decl","宣言: Read・値 0x0003・0x2A00"],
      [0x0003,0x2A00,[0x54,0x48,0x2D,0x30,0x31],1,0,"val","機器の名前 \"TH-01\""],
      [0x0004,0x2800,[0x0F,0x18],1,0,"svc","Battery Service（0x180F）"],
      [0x0005,0x2803,[0x12,0x06,0x00,0x19,0x2A],1,0,"decl","宣言: Read・Notify・値 0x0006・0x2A19"],
      [0x0006,0x2A19,[87],1,0,"val","電池の残り"],
      [0x0007,0x2902,[0,0],1,1,"desc","CCCD（電池）"],
      [0x0008,0x2800,_w18_hx(_w18_U1),1,0,"svc","独自のサービス 5C3A0001-…"],
      [0x0009,0x2803,[0x32,0x0A,0x00].concat(_w18_hx(_w18_U2)),1,0,"decl","宣言: Read・Notify・Indicate・値 0x000A"],
      [0x000A,"5C3A0002-…",_w18_le(2345),1,0,"val","温度"],
      [0x000B,0x2902,[0,0],1,1,"desc","CCCD（温度）"],
      [0x000C,0x2803,[0x0A,0x0D,0x00].concat(_w18_hx(_w18_U3)),1,0,"decl","宣言: Read・Write・値 0x000D"],
      [0x000D,"5C3A0003-…",_w18_le(60),1,1,"val","測定の間隔"]];
  }
  var _w18_OPN={0x01:"Error Response",0x04:"Find Information Request",0x05:"Find Information Response",0x08:"Read By Type Request",0x09:"Read By Type Response",
    0x0A:"Read Request",0x0B:"Read Response",0x10:"Read By Group Type Request",0x11:"Read By Group Type Response",0x12:"Write Request",0x13:"Write Response",
    0x52:"Write Command",0x1B:"Handle Value Notification",0x1D:"Handle Value Indication",0x1E:"Handle Value Confirmation"};
  var _w18_ERR={0x01:"Invalid Handle",0x02:"Read Not Permitted",0x03:"Write Not Permitted",0x04:"Invalid PDU",0x06:"Request Not Supported",0x0A:"Attribute Not Found",0x0D:"Invalid Attribute Value Length"};
  var _w18_KC={svc:"purple",decl:"gold",val:"signal",desc:"teal"};

  REG.w18_gatt=function(el,U){
    var S=U.S,MTU=23;
    U.head(el,"GATT","スマートフォン（クライアント）と TH-01（サーバ）のやり取り");
    var tbl,log,hl,known,seedT,pendInd,opn;
    function reset(){tbl=_w18_table();log=[];hl={};known={svc:[],chr:[],dsc:[]};seedT=0;pendInd=false;opn=0;}
    reset();
    function find(h){for(var i=0;i<tbl.length;i++)if(tbl[i][0]===h)return tbl[i];return null;}
    function g16(b,i){return b[i]|(b[i+1]<<8);}
    function err(op,h,code){return [0x01,op].concat(_w18_le(h),[code]);}
    /* サーバ: 要求を 1 つ処理して返す PDU（無ければ null） */
    function server(q){
      var op=q[0],cmd=op&0x40;
      if(op===0x10||op===0x08||op===0x04){
        var s=g16(q,1),e=g16(q,3),out=[],el=0;
        if(op===0x04){out=[0x05,0];for(var i=0;i<tbl.length;i++){var a=tbl[i];if(a[0]<s||a[0]>e)continue;var ul=typeof a[1]==="number"?2:16;if(!el)el=ul;if(ul!==el||out.length+2+ul>MTU)break;
            out=out.concat(_w18_le(a[0]),typeof a[1]==="number"?_w18_le(a[1]):_w18_hx(a[1]===tbl[9][1]?_w18_U2:_w18_U3));hl[a[0]]="read";}
          if(!el)return err(op,s,0x0A);out[1]=el===2?1:2;return out;}
        var t=g16(q,5);out=[op+1,0];
        for(var j=0;j<tbl.length;j++){var b=tbl[j];if(b[0]<s||b[0]>e||b[1]!==t)continue;
          var item;
          if(op===0x10){var end=tbl[tbl.length-1][0];for(var k=j+1;k<tbl.length;k++)if(tbl[k][1]===0x2800){end=tbl[k][0]-1;break;}item=_w18_le(b[0]).concat(_w18_le(end),b[2]);}
          else item=_w18_le(b[0]).concat(b[2]);
          if(!el)el=item.length;if(item.length!==el||out.length+el>MTU)break;out=out.concat(item);hl[b[0]]="read";}
        if(!el)return err(op,s,0x0A);out[1]=el;return out;}
      if(op===0x0A||op===0x12||op===0x52){
        var h=g16(q,1),at=find(h);
        if(!at)return cmd?null:err(op,h,0x01);
        if(op===0x0A){if(!at[3])return err(op,h,0x02);hl[h]="read";return [0x0B].concat(at[2].slice(0,MTU-1));}
        var v=q.slice(3);
        if(!at[4]){hl[h]="bad";return cmd?null:err(op,h,0x03);}
        if(v.length!==at[2].length){hl[h]="bad";return cmd?null:err(op,h,0x0D);}
        at[2]=v;hl[h]="write";
        return cmd?null:[0x13];}
      if(op===0x1E){pendInd=false;return null;}
      return cmd?null:err(op,0,0x06);
    }
    /* PDU の解読（欄ごとの色と説明） */
    function decode(b){
      var op=b[0],n=_w18_OPN[op]||"0x"+U.fmt.hex(op),f=[["opc",1]],d=n;
      function hrange(i){return _w18_h4(g16(b,i))+"〜"+_w18_h4(g16(b,i+2));}
      if(op===0x10||op===0x08){f.push(["hdl",4],["typ",b.length-5]);d+=": 範囲 "+hrange(1)+"、型 "+_w18_h4(g16(b,5))+(g16(b,5)===0x2800?"（サービス宣言）":"（キャラクタリスティック宣言）");}
      else if(op===0x04){f.push(["hdl",4]);d+=": 範囲 "+hrange(1);}
      else if(op===0x11){var L=b[1];f.push(["len",1]);var parts=[];for(var i=2;i+L<=b.length;i+=L){f.push(["hdl",4],["val",L-4]);parts.push(hrange(i)+" = "+(L===6?_w18_h4(g16(b,i+4)):"5C3A"+U.fmt.hex(b[i+L-3])+U.fmt.hex(b[i+L-4])+"-…"));}d+=": 組の長さ "+L+"、"+parts.join("、");}
      else if(op===0x09){var L2=b[1];f.push(["len",1]);var ps=[];for(var j=2;j+L2<=b.length;j+=L2){f.push(["hdl",2],["val",L2-2]);ps.push("宣言 "+_w18_h4(g16(b,j))+": プロパティ 0x"+U.fmt.hex(b[j+2])+"・値のハンドル "+_w18_h4(g16(b,j+3)));}d+=": 組の長さ "+L2+"、"+ps.join("、");}
      else if(op===0x05){f.push(["len",1],["hdl",2],["typ",b.length-4]);d+=": "+_w18_h4(g16(b,2))+" の型は "+(b[1]===1?_w18_h4(g16(b,4)):"128 ビット")+(g16(b,4)===0x2902?"（CCCD）":"");}
      else if(op===0x0A){f.push(["hdl",2]);d+=": ハンドル "+_w18_h4(g16(b,1));}
      else if(op===0x0B){f.push(["val",b.length-1]);d+=": 値 "+b.slice(1).map(function(x){return U.fmt.hex(x);}).join(" ");}
      else if(op===0x12||op===0x52||op===0x1B||op===0x1D){f.push(["hdl",2],["val",b.length-3]);d+=": ハンドル "+_w18_h4(g16(b,1))+"、値 "+b.slice(3).map(function(x){return U.fmt.hex(x);}).join(" ");}
      else if(op===0x01){f.push(["opc",1],["hdl",2],["err",1]);d+=": 要求 0x"+U.fmt.hex(b[1])+"・ハンドル "+_w18_h4(g16(b,2))+"・0x"+U.fmt.hex(b[4])+" "+(_w18_ERR[b[4]]||"");}
      var col={opc:"purple",hdl:"gold",typ:"teal",val:"signal",len:"muted",err:"alias"},cs=[];
      f.forEach(function(x){for(var k=0;k<x[1];k++)cs.push(col[x[0]]);});
      return {name:n,desc:d,colors:cs};
    }
    function send(q,note){
      log.push({dir:0,b:q,note:note||"",op:opn});
      var r=server(q);
      if(r)log.push({dir:1,b:r,note:"",op:opn});
      return r;
    }
    function act(fn){hl={};opn++;fn();draw();}
    var r1=U.btnrow(el);
    U.button(r1,"① サービスを探す",function(){act(function(){known.svc=[];var s=1;for(var i=0;i<5;i++){var r=send([0x10].concat(_w18_le(s),[0xFF,0xFF,0x00,0x28]));if(r[0]===0x01)break;var L=r[1];var last=r.length-L;var e=g16(r,last+2);
      for(var j=2;j+L<=r.length;j+=L)known.svc.push(_w18_h4(g16(r,j))+"〜"+_w18_h4(g16(r,j+2)));s=e+1;}});});
    U.button(r1,"② キャラクタリスティックを探す（独自のサービス）",function(){act(function(){known.chr=[];var s=8;for(var i=0;i<5;i++){var r=send([0x08].concat(_w18_le(s),[0x0D,0x00,0x03,0x28]));if(r[0]===0x01)break;
      known.chr.push("値 "+_w18_h4(g16(r,5))+"（プロパティ 0x"+U.fmt.hex(r[4])+"）");s=g16(r,2)+1;}});});
    U.button(r1,"③ 記述子を探す（温度）",function(){act(function(){known.dsc=[];var r=send([0x04,0x0B,0x00,0x0B,0x00]);if(r[0]===0x05)known.dsc.push(_w18_h4(g16(r,2))+" CCCD");});});
    var r2=U.btnrow(el);
    U.button(r2,"温度を読む",function(){act(function(){send([0x0A,0x0A,0x00]);});});
    U.button(r2,"電池の残りを読む",function(){act(function(){send([0x0A,0x06,0x00]);});});
    var ivSel=U.select(r2,"書く測定の間隔",[{v:"10",t:"10 s"},{v:"60",t:"60 s"},{v:"600",t:"600 s"}],"10",null);
    U.button(r2,"間隔を書く（Write Request）",function(){act(function(){send([0x12,0x0D,0x00].concat(_w18_le(+ivSel.get())));});});
    U.button(r2,"間隔を書く（Write Command）",function(){act(function(){send([0x52,0x0D,0x00].concat(_w18_le(+ivSel.get())),"応答なし");});});
    var r3=U.btnrow(el);
    U.button(r3,"温度に書いてみる",function(){act(function(){send([0x12,0x0A,0x00,0x00,0x00]);});});
    U.button(r3,"無いハンドルを読む",function(){act(function(){send([0x0A,0x20,0x00]);});});
    U.button(r3,"通知を有効に（CCCD ← 01 00）",function(){act(function(){send([0x12,0x0B,0x00,0x01,0x00]);});});
    U.button(r3,"指示を有効に（CCCD ← 02 00）",function(){act(function(){send([0x12,0x0B,0x00,0x02,0x00]);});});
    U.button(r3,"止める（CCCD ← 00 00）",function(){act(function(){send([0x12,0x0B,0x00,0x00,0x00]);});});
    var r4=U.btnrow(el);
    U.button(r4,"温度が変わる（TH-01 の側）",function(){act(function(){
      var t=find(0x000A),v=g16(t[2],0);if(v>=0x8000)v-=0x10000;var rr=U.rng(++seedT*31+5);v+=Math.round((rr.next()-0.5)*40);t[2]=_w18_le(v&0xFFFF);hl[0x000A]="write";
      var c=find(0x000B)[2][0];
      if(c&1)log.push({dir:1,b:[0x1B,0x0A,0x00].concat(t[2]),note:"",op:opn});
      else if(c&2){log.push({dir:1,b:[0x1D,0x0A,0x00].concat(t[2]),note:"",op:opn});pendInd=true;send([0x1E],"受け取ったので確認を返す");}
      else log.push({dir:-1,b:[],note:"CCCD が 00 00 なので、TH-01 は何も送らない（値は "+(v/100).toFixed(2)+" °C に変わった）",op:opn});});});
    U.button(r4,"初めから",function(){reset();draw();});
    var ro=U.readout(el);
    var tb=U.mk("div","");el.appendChild(tb);
    function draw(){
      /* 属性の表（強調つき） */
      var hc={read:"signal",write:"gold",bad:"alias"};
      var h='<div class="wtable"><table><thead><tr><th>ハンドル</th><th>型</th><th>値</th><th style="text-align:left">意味</th></tr></thead><tbody>';
      tbl.forEach(function(a){var k=hl[a[0]],st=k?' style="background:'+U.soft(hc[k])+';outline:1.5px solid '+U.col(hc[k])+'"':'';
        var val=a[2].length>6?a[2].slice(0,3).map(function(x){return U.fmt.hex(x);}).join(" ")+" …（"+a[2].length+" バイト）":a[2].map(function(x){return U.fmt.hex(x);}).join(" ");
        var mean=a[6];if(a[0]===0x000A){var v=g16(a[2],0);if(v>=0x8000)v-=0x10000;mean+=" "+(v/100).toFixed(2)+" °C";}
        if(a[0]===0x0006)mean+=" "+a[2][0]+" %";if(a[0]===0x000D)mean+=" "+g16(a[2],0)+" s";
        if(a[1]===0x2902){var cv=g16(a[2],0);mean+=cv===1?"・通知する":cv===2?"・指示する":cv===0?"・送らない":"";}
        h+='<tr'+st+'><td style="color:var(--'+_w18_KC[a[5]]+')">'+_w18_h4(a[0])+'</td><td>'+(typeof a[1]==="number"?_w18_h4(a[1]):a[1])+'</td><td>'+val+'</td><td style="text-align:left">'+U.esc(mean)+'</td></tr>';});
      h+='</tbody></table></div><div class="wnote">TH-01（GATT のサーバ）の属性の表。最後の操作で読まれた行は青、書き換わった行は金、拒んだ行は赤。</div>';
      tb.innerHTML=h;
      /* やり取りの記録（時刻の順、最大 8 個。最後の操作のものを濃く） */
      var lines=log.slice(-8).map(function(e){
        var fade=e.op!==opn?' opacity:.5;':'';
        if(e.dir<0)return '<div class="wnote" style="'+fade+'">'+U.esc(e.note)+'</div>';
        var dd=decode(e.b);
        return '<div style="margin:.35rem 0;'+fade+'"><b style="color:var(--'+(e.dir?"signal":"purple")+')">'+(e.dir?"TH-01 → スマートフォン":"スマートフォン → TH-01")+'</b> '+U.esc(dd.name)+(e.note?'（'+U.esc(e.note)+'）':'')+
          U.hexView(e.b,function(i){return dd.colors[i]||null;})+'<span style="font-size:.76rem">'+U.esc(dd.desc)+'</span></div>';}).join("");
      var kn="スマートフォンが探索で知ったこと: サービス "+(known.svc.length?known.svc.join("・"):"（まだ）")+" ／ キャラクタリスティック "+(known.chr.length?known.chr.join("・"):"（まだ）")+" ／ 記述子 "+(known.dsc.length?known.dsc.join("・"):"（まだ）");
      ro.innerHTML=(lines||'<div class="wnote">上のボタンでスマートフォンの操作を選ぶ。</div>')+'<div class="wnote">'+kn+'。薄い行は前の操作のもの。ATT の PDU の長さの上限は既定の 23 バイト（5 節）。16 進の色: 紫 = オペコード、金 = ハンドル（範囲）、青 = 値、青緑 = 型、赤 = 誤りの番号。</div>';
    }
    draw();
  };

  /* ---- (3) MTU と長い値 ---- */
  REG.w18_mtu=function(el,U){
    var S=U.S;
    U.head(el,"ATT_MTU","1 回に運べる大きさと、長い値の読み書き");
    var row=U.ctrls(el);
    var mt=U.slider(row,"ATT_MTU",{values:[23,27,50,65,100,128,158,185,247,251,512,517],value:23,fmt:function(v){return v+" バイト";},onInput:draw});
    var ln=U.slider(row,"値の長さ",{min:1,max:512,step:1,value:50,fmt:function(v){return v+" バイト";},onInput:draw});
    var row2=U.ctrls(el);
    var c1=U.mk("div","ctrl",'<label><span>操作</span></label>');c1.style.flex="1 1 100%";row2.appendChild(c1);
    var op=U.seg(c1,["読む（Read と Read Blob）","書く（Write か Prepare・Execute）","通知"],0,draw);
    var row3=U.ctrls(el);
    var c2=U.mk("div","ctrl",'<label><span>リンク層のペイロードの上限</span></label>');c2.style.flex="1 1 100%";row3.appendChild(c2);
    var ll=U.seg(c2,["27 バイト（既定）","251 バイト（広げた場合。19 章）"],0,draw);
    var box=U.svgbox(el); var tb=U.mk("div","");el.appendChild(tb); var ro=U.readout(el);
    function draw(){
      var M=mt.get(),n=ln.get(),o=op.get(),LL=ll.get()?251:27;
      var pdus=[],segs=[],warn="";
      if(o===0){var c=M-1,off=0,first=true;
        while(true){var k=Math.min(c,n-off);
          pdus.push([0,first?"Read Request":"Read Blob Request（オフセット "+off+"）",first?3:5]);
          pdus.push([1,(first?"Read Response":"Read Blob Response")+"（"+(k?off+"〜"+(off+k-1):"0 バイト")+"）",1+k]);
          if(k)segs.push([off,k]);off+=k;first=false;if(k<c)break;}
      }else if(o===1){
        if(n<=M-3){pdus.push([0,"Write Request（0〜"+(n-1)+"）",3+n]);pdus.push([1,"Write Response",1]);segs.push([0,n]);}
        else{var c3=M-5,off2=0;while(off2<n){var k2=Math.min(c3,n-off2);pdus.push([0,"Prepare Write Request（"+off2+"〜"+(off2+k2-1)+"）",5+k2]);pdus.push([1,"Prepare Write Response（同じ内容）",5+k2]);segs.push([off2,k2]);off2+=k2;}
          pdus.push([0,"Execute Write Request（書く）",2]);pdus.push([1,"Execute Write Response",1]);}
      }else{var k3=Math.min(n,M-3);pdus.push([1,"Handle Value Notification（0〜"+(k3-1)+"）",3+k3]);segs.push([0,k3]);
        if(n>M-3)warn='<span class="warn">値の '+n+' バイトのうち、通知で送られるのは先頭の '+(M-3)+' バイトだけ（残り '+(n-M+3)+' バイトは送られない）。MTU を交換するか、アプリケーションで分ける。</span><br>';}
      var trips=o===2?0:pdus.length/2,llp=0;
      pdus.forEach(function(p){p.push(Math.ceil((p[2]+4)/LL));llp+=p[3];});
      /* 図: 値の帯と PDU の列 */
      var W=700,x0=60,x1=680,out=[],X=function(b){return x0+(x1-x0)*b/n;};
      out.push(S.T(x0,18,"値（"+n+" バイト）の分け方","start",10.5,"ink",true));
      out.push(S.RECT(x0,26,x1-x0,22,3,"var(--screen)","line",1));
      var cols=["signal","green"];
      segs.forEach(function(s,i){var c=cols[i%2];out.push(S.RECT(X(s[0]),26,Math.max(1,X(s[0]+s[1])-X(s[0])),22,2,U.soft(c),c,1.1));
        if(X(s[0]+s[1])-X(s[0])>26&&segs.length<=24)out.push(S.T((X(s[0])+X(s[0]+s[1]))/2,41,String(s[1]),"middle",9,c,true));});
      if(o===2&&n>M-3){out.push(S.RECT(X(M-3),26,x1-X(M-3),22,2,U.soft("alias"),"alias",1.1,"4 3"));out.push(S.T((X(M-3)+x1)/2,41,"送られない","middle",9.5,"alias",true));}
      out.push(S.T(x0,62,"0","middle",9,"muted"));out.push(S.T(x1,62,String(n),"middle",9,"muted"));
      box.set(S.svg(W,70,out));
      var show=pdus.length<=16?pdus:pdus.slice(0,10).concat([null]).concat(pdus.slice(-4));
      tb.innerHTML=U.tbl(["向き","ATT の PDU","長さ","リンク層のパケット"],show.map(function(p){
        if(!p)return ["","…（"+(pdus.length-14)+" 個を省略）","",""];
        var c=p[0]?"signal":"purple";
        return ['<b style="color:var(--'+c+')">'+(p[0]?"← サーバ":"→ クライアント")+'</b>','<span style="color:var(--'+c+')">'+U.esc(p[1])+'</span>',p[2]+" バイト",(p[3]>1?'<b style="color:var(--gold)">'+p[3]+'</b>':p[3])];}),["left","wrap","right","right"]);
      ro.innerHTML=warn+"ATT_MTU "+M+": 通知・書き込みの値は "+(M-3)+" バイト、Read Response は "+(M-1)+" バイト、Prepare Write は "+(M-5)+" バイトまで<br>"+
        (o===2?"通知 1 つ（確認は無い）":"要求と応答の往復 <b>"+trips+" 回</b>")+" ・ ATT の PDU "+pdus.length+" 個 ・ リンク層のパケット <b>"+llp+" 個</b>（L2CAP の 4 バイトを足し、"+LL+" バイトずつに分けた数。空パケットは数えない）"+
        (o===0?"<br>読む往復の数 = ⌊"+n+" / "+(M-1)+"⌋ + 1 = "+trips+(n%(M-1)===0?"（割り切れるので、最後の応答は 0 バイト）":""):"")+
        (M+4>LL?'<br><span class="warn">ATT の PDU（最大 '+M+' バイト）+ L2CAP 4 バイトが、リンク層の上限 '+LL+' バイトを超えるので、L2CAP が分けて運ぶ。</span>':"");
    }
    draw();
  };
