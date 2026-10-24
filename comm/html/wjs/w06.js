  /* ===== 06 章 無線モジュールとつなぐ — AT コマンドと HCI ===== */
  /* 振り分けの色（図 f06.py と同じ） */
  var _w06_KC={echo:"muted",interim:"green",ok:"signal",err:"alias",urc:"gold",data:"purple",prompt:"teal",nl:"faint"};
  var _w06_KN={echo:"エコー",interim:"中間応答",ok:"最終応答（成功）",err:"最終応答（失敗）",urc:"URC",data:"データ",prompt:"プロンプト"};

  /* 本文の at_classify と同じ順番で 1 行を振り分ける */
  function _w06_classify(cmd,s){
    if(cmd){
      if(s===cmd.text)return "echo";
      if(s==="OK"||s==="SEND OK")return "ok";
      if(s==="ERROR"||s==="SEND FAIL"||s.indexOf("+CME ERROR:")===0)return "err";
      if(cmd.prefix&&s.indexOf(cmd.prefix)===0)return "interim";
    }
    var H=["WIFI ","CONNECT","CLOSED","+CEREG:","ready"];
    for(var i=0;i<H.length;i++)if(s.indexOf(H[i])===0)return "urc";
    return cmd?"interim":"urc";
  }
  function _w06_str(a){var s="";for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return s;}
  function _w06_bytes(s){var a=[];for(var i=0;i<s.length;i++)a.push(s.charCodeAt(i)&255);return a;}
  function _w06_wrap(h){return h?'<span style="white-space:normal;display:inline-block;min-width:12em;max-width:24em">'+h+'</span>':"";}
  function _w06_show(s){return s.replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\0/g,"\\0");}

  /* 本文の at_feed と同じ手順の解析器。ev(種類, 中身, 位置の配列) で知らせる */
  function _w06_feeder(ev){
    var P={line:[],idx:[],left:0,MAX:256};
    function ipdLen(a){if(!a.length)return 0;var v=0;for(var i=0;i<a.length;i++){if(a[i]<48||a[i]>57||v>100000)return 0;v=v*10+(a[i]-48);}return v;}
    P.feed=function(b,base){
      var i=0,n=b.length;
      while(i<n){
        if(P.left>0){var k=Math.min(n-i,P.left),ix=[];for(var j=0;j<k;j++)ix.push(base+i+j);ev("data",b.slice(i,i+k),ix);P.left-=k;i+=k;continue;}
        var c=b[i],g=base+i;i++;
        if(c===13||c===10){if(P.line.length)ev("line",P.line.slice(),P.idx.slice());ev("nl",null,[g]);P.line=[];P.idx=[];}
        else if(c===62&&P.line.length===0){ev("prompt",null,[g]);}
        else{
          if(P.line.length<P.MAX){P.line.push(c);P.idx.push(g);}
          if(c===58&&P.line.length>6&&_w06_str(P.line.slice(0,5))==="+IPD,"){
            var v=ipdLen(P.line.slice(5,P.line.length-1));
            if(v>0){P.left=v;ev("ipd",v,P.idx.slice());P.line=[];P.idx=[];}
          }
        }
      }
    };
    return P;
  }

  REG.w06_at=function(el,U){
    var SC=[
      {t:"AT+CSQ（電波の強さを聞く）",st:[{cmd:"AT+CSQ",pre:"+CSQ:"},{rx:"\r\n+CSQ: 20,99\r\n\r\nOK\r\n"}]},
      {t:"AT+CSQ の途中に +IPD（データに OK を含む）",st:[{cmd:"AT+CSQ",pre:"+CSQ:"},{rx:"\r\n+IPD,12:T=23.5\r\nOK\r\n\r\n+CSQ: 20,99\r\n\r\nOK\r\n"}]},
      {t:"AT+CWJAP（AP につなぐ）",st:[{cmd:'AT+CWJAP="home","secret12"',pre:"+CWJAP:"},{rx:"WIFI CONNECTED\r\nWIFI GOT IP\r\n\r\nOK\r\n"}]},
      {t:"AT+CWJAP（つながらなかった）",st:[{cmd:'AT+CWJAP="home","wrong"',pre:"+CWJAP:"},{rx:"\r\n+CWJAP:1\r\n\r\nERROR\r\n"}]},
      {t:"AT+CIPSEND=5（プロンプトとデータ）",st:[{cmd:"AT+CIPSEND=5",pre:null,two:true},{rx:"\r\nOK\r\n\r\n+IPD,5:>\r\nOK\r\n>"},{host:"hello"},{rx:"\r\nSEND OK\r\n"}]},
      {t:"+CEREG（同じ頭の URC と応答）",st:[{rx:"\r\n+CEREG: 2\r\n\r\n+CEREG: 1\r\n"},{cmd:"AT+CEREG?",pre:"+CEREG:"},{rx:"\r\n+CEREG: 1,1\r\n\r\nOK\r\n"}]}
    ];
    U.head(el,"AT PARSER","AT の応答の解析器 — 分かれて届いても結果は同じ");
    var row=U.ctrls(el);
    var sc=U.select(row,"場面",SC.map(function(s){return s.t;}),1,rebuild);
    var ck=U.select(row,"解析器に渡す 1 回分の大きさ",["受信ごとにまとめて","1 バイトずつ","乱数（1〜5 バイト）","乱数（1〜20 バイト）"],2,rebuild);
    var row2=U.ctrls(el);
    var ec=U.checkbox(row2,"エコーあり（ATE1）",true,rebuild);
    var nv=U.checkbox(row2,"長さを見ない解析器の結果も出す",false,function(){render();});
    var br=U.btnrow(el);
    U.button(br,"最初から",function(){reset();render();});
    U.button(br,"1 回分ずつ進める",function(){step();render();});
    U.button(br,"最後まで",function(){while(pos<acts.length)step();render();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rebuild();});
    var stream=U.mk("div","wsvg");stream.style.padding=".5rem";el.appendChild(stream);
    var ro=U.readout(el);
    var seed=6,acts=[],pos=0,S;
    function rebuild(){
      var s=SC[sc.get()],r=U.rng(seed*7919+sc.get()*31+ck.get()),base=0,pend=null;acts=[];
      s.st.forEach(function(x){
        if(x.cmd){pend=x;acts.push({k:"cmd",c:{text:x.cmd,prefix:x.pre,two:!!x.two}});return;}
        if(x.host){acts.push({k:"host",s:x.host});return;}
        var txt=(pend&&ec.get()?pend.cmd+"\r\n":"")+x.rx;pend=null;
        var b=_w06_bytes(txt),i=0;
        while(i<b.length){var m=ck.get(),n=m===0?b.length:m===1?1:m===2?1+r.int(5):1+r.int(20);n=Math.min(n,b.length-i);
          acts.push({k:"rx",b:b.slice(i,i+n),base:base+i});i+=n;}
        acts.push({k:"bytes",b:b,base:base});base+=b.length;
      });
      reset();while(pos<acts.length)step();render();
    }
    function reset(){
      pos=0;S={kind:{},cmd:null,phase:0,events:[],chunk:0,calls:0,done:[]};
      S.P=_w06_feeder(function(k,v,ix){
        if(k==="nl"){ix.forEach(function(g){if(!S.kind[g])S.kind[g]="nl";});return;}
        if(k==="line"){var s=_w06_str(v),c=_w06_classify(S.cmd,s);ix.forEach(function(g){S.kind[g]=c;});
          var note="";
          if(S.cmd&&(c==="ok"||c==="err")){
            if(S.cmd.two&&c==="ok"&&S.phase===0){S.phase=1;note="受け付けた。プロンプトを待つ";}
            else{note="命令の終わり";S.done.push({cmd:S.cmd.text,ok:c==="ok"});S.cmd=null;}
          }
          S.events.push({k:c,s:s,cmd:S.lastCmd,ch:S.chunk,note:note});return;}
        if(k==="prompt"){ix.forEach(function(g){S.kind[g]="prompt";});var nt="";if(S.cmd&&S.cmd.two&&S.phase===1){S.phase=2;nt="データを送ってよい";}
          S.events.push({k:"prompt",s:">",cmd:S.lastCmd,ch:S.chunk,note:nt});return;}
        if(k==="ipd"){ix.forEach(function(g){S.kind[g]="urc";});S.events.push({k:"urc",s:"+IPD,"+v+":",cmd:S.lastCmd,ch:S.chunk,note:"後に "+v+" バイトのデータ"});S.dataEv={k:"data",s:"",n:0,cmd:S.lastCmd,ch:S.chunk,note:"",pieces:[]};S.events.push(S.dataEv);return;}
        if(k==="data"){ix.forEach(function(g){S.kind[g]="data";});S.dataEv.s+=_w06_str(v);S.dataEv.n+=v.length;S.dataEv.pieces.push(v.length);S.dataEv.note="分けて渡された大きさ: "+S.dataEv.pieces.join(" + ")+" バイト";return;}
      });
      S.lastCmd="—";
    }
    function step(){
      if(pos>=acts.length)return;var a=acts[pos++];
      if(a.k==="cmd"){S.cmd=a.c;S.phase=0;S.lastCmd=a.c.text;S.events.push({k:"host",s:a.c.text,cmd:"",ch:"",note:"ホストが命令を送る"});return;}
      if(a.k==="host"){S.events.push({k:"host",s:a.s,cmd:"",ch:"",note:"ホストが "+a.s.length+" バイトのデータを送る"});return;}
      if(a.k==="rx"){S.chunk++;S.calls++;S.P.feed(a.b,a.base);if(pos<acts.length&&acts[pos].k==="bytes")pos++;return;}
      if(a.k==="bytes"){step();}
    }
    function cellHtml(b,g,first,done){
      var k=S.kind[g],lab=b===13?"CR":b===10?"LF":b===32?"SP":b===0?"00":U.esc(String.fromCharCode(b));
      var small=(b===13||b===10||b===32||b===0);
      var st="";if(k&&k!=="nl"){st+="background:"+U.soft(_w06_KC[k])+";border-color:"+U.col(_w06_KC[k])+";";}
      else if(k==="nl"){st+="border-color:var(--line);color:var(--muted);";}
      else if(done){st+="border:1px dashed var(--muted);";}
      if(!done)st+="opacity:.35;";
      if(first)st+="box-shadow:-3px 0 0 0 var(--signal);margin-left:5px;";
      if(small)st+="font-size:.62rem;";
      return '<span style="'+st+'" title="0x'+U.fmt.hex(b)+(k?" "+(_w06_KN[k]||"改行"):"")+'">'+lab+'</span>';
    }
    function render(){
      var h="",cnt=0,done=0;
      /* どこまで処理したか: 処理済みのバイトの位置 */
      for(var i=0;i<pos;i++){var a=acts[i];if(a.k==="rx")done=a.base+a.b.length;}
      var starts={};acts.forEach(function(a){if(a.k==="rx")starts[a.base]=1;});
      acts.forEach(function(a,ai){
        if(a.k==="cmd")h+='<div style="margin:.35rem 0;font-family:var(--mono);font-size:.76rem;color:var(--signal)'+(ai>=pos?';opacity:.35':'')+'">→ ホストが送る: <b>'+U.esc(a.c.text)+'</b></div>';
        else if(a.k==="host")h+='<div style="margin:.35rem 0;font-family:var(--mono);font-size:.76rem;color:var(--purple)'+(ai>=pos?';opacity:.35':'')+'">→ ホストがデータを送る: <b>'+U.esc(a.s)+'</b></div>';
        else if(a.k==="bytes"){h+='<div class="hex" style="margin:.2rem 0">';a.b.forEach(function(b,j){var g=a.base+j;h+=cellHtml(b,g,starts[g]&&j>0,g<done);});h+='</div>';}
      });
      stream.innerHTML='<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-bottom:.3rem">モジュールから届いたバイト（青い縦線 = 解析器に渡す 1 回分の区切り。薄いバイトはまだ渡していない）</div>'+h+
        '<div class="legend">'+["echo","interim","ok","err","urc","data","prompt"].map(function(k){return '<span><b style="color:'+U.col(_w06_KC[k])+'">■</b> '+_w06_KN[k]+'</span>';}).join("")+'</div>';
      var P=S.P,stt=P.left>0?"データを読んでいる（残り <b>"+P.left+"</b> バイト）":"行を読んでいる（読みかけ: <b>"+(P.line.length?U.esc(_w06_show(_w06_str(P.line))):"なし")+"</b>）";
      var rows=S.events.map(function(e,i){var c=e.k==="host"?"signal":_w06_KC[e.k];
        return [String(i+1),'<span style="color:'+U.col(c)+';font-weight:700">'+(e.k==="host"?"ホスト":_w06_KN[e.k])+'</span>',U.esc(_w06_show(e.s)),_w06_wrap(U.esc(e.note||"")),e.ch===""?"":String(e.ch)];});
      var html="解析器に渡した回数: <b>"+S.calls+"</b> 回 ・ 解析器の状態: "+stt+" ・ 応答を待っている命令: <b>"+(S.cmd?U.esc(S.cmd.text)+(S.cmd.two?(S.phase===1?"（プロンプト待ち）":S.phase===2?"（SEND OK 待ち）":""):""):"なし")+"</b>"+
        U.tbl(["#","振り分け","中身","メモ","何回目に"],rows,["right","left","left","left","right"]);
      if(S.done.length)html+=S.done.map(function(d){return "命令 "+U.esc(d.cmd)+" は "+(d.ok?'<span class="ok">成功</span>':'<span class="warn">失敗</span>')+" で終わった";}).join(" ・ ");
      if(nv.get())html+=naive();
      html+='<div class="wnote">区切り方を変えても、振り分けの列は変わらない（解析器が読みかけの行とデータの読み残しを覚えているため）。データは届いた分ずつ渡すので、分け方によって「メモ」の大きさの内訳だけが変わる。</div>';
      ro.innerHTML=html;
    }
    /* 長さを見ずに、CR・LF で区切った行だけで振り分ける解析器（+IPD は URC として扱う） */
    function naive(){
      var s=SC[sc.get()],cmd=null,rows=[],pend=null;
      s.st.forEach(function(x){
        if(x.cmd){cmd={text:x.cmd,prefix:x.pre,two:!!x.two,phase:0};pend=x;return;}
        if(x.host)return;
        var txt=(pend&&ec.get()?pend.cmd+"\r\n":"")+x.rx;pend=null;
        txt.split(/[\r\n]/).forEach(function(l){
          if(!l.length)return;
          var lines=[];if(l.charAt(0)===">"){lines.push(">");l=l.slice(1);}if(l.length)lines.push(l);
          lines.forEach(function(L){
            if(L===">"){rows.push(['<span style="color:var(--teal)">プロンプト</span>',">",""]);if(cmd&&cmd.two&&cmd.phase===1)cmd.phase=2;return;}
            var c=L.indexOf("+IPD,")===0?"urc":_w06_classify(cmd,L),nt="";
            if(cmd&&(c==="ok"||c==="err")){if(cmd.two&&c==="ok"&&cmd.phase===0){cmd.phase=1;}else{nt="命令の終わり";cmd=null;}}
            else if(!cmd&&L.indexOf("+IPD,")!==0&&!/^(WIFI |CONNECT|CLOSED|\+CEREG:|ready)/.test(L))nt="どの命令も待っていない行（取り違えのもと）";
            rows.push(['<span style="color:'+U.col(_w06_KC[c])+';font-weight:700">'+_w06_KN[c]+'</span>',U.esc(L),nt]);
          });
        });
      });
      return '<div style="margin-top:.6rem"><b>長さを見ない解析器（悪い例）</b>の振り分け:</div>'+U.tbl(["振り分け","行","メモ"],rows,["left","left","left"]);
    }
    rebuild();
  };

  /* ---- 4 節: ガードタイム ---- */
  REG.w06_guard=function(el,U){
    var S=U.S,F=U.fmt;
    var GV=[5,10,20,50,100,200,500,1000,1500,2000];               /* ms */
    var XV=[0,0.05,0.1,0.2,0.5,1,2,5,10,15,19,20,21,25,30,50,100,200,300,500,800,999.7,1000,1001,1500,2000,3000];
    function ms(v){return v===0?"0（続けて送る）":v>=1000?U.sig(v/1000,4)+" s":U.sig(v,3)+" ms";}
    U.head(el,"GUARD TIME","+++ がコマンドモードに戻る合図になる条件");
    var row=U.ctrls(el);
    var g=U.slider(row,"ガードタイム G",{min:0,max:GV.length-1,step:1,value:2,fmt:function(i){return ms(GV[i]);},onInput:draw});
    var row2=U.ctrls(el);
    var a=U.slider(row2,"最初の + の前の空き",{min:0,max:XV.length-1,step:1,value:22,fmt:function(i){return ms(XV[i]);},onInput:draw});
    var b=U.slider(row2,"+ と + の間の空き",{min:0,max:XV.length-1,step:1,value:0,fmt:function(i){return ms(XV[i]);},onInput:draw});
    var c=U.slider(row2,"3 つ目の + の後の空き",{min:0,max:XV.length-1,step:1,value:22,fmt:function(i){return ms(XV[i]);},onInput:draw});
    function setv(gi,ai,bi,ci){if(gi!=null)g.set(gi);a.set(ai);b.set(bi);c.set(ci);draw();}
    function ix(v){return XV.indexOf(v);}
    var br=U.btnrow(el);
    U.button(br,"ESP-AT の条件（G = 20 ms）",function(){g.set(2);draw();});
    U.button(br,"G = 1 s の製品",function(){g.set(7);draw();});
    var br2=U.btnrow(el);
    U.button(br2,"連続したデータの途中の +++",function(){setv(null,ix(0),ix(0),ix(0));});
    U.button(br2,"前後を 1.5 s 空けた +++",function(){setv(null,ix(1500),ix(0),ix(1500));});
    U.button(br2,"1 秒ごとの 3 バイトが 2B 2B 2B",function(){setv(null,ix(999.7),ix(0),ix(999.7));});
    U.button(br2,"人が端末から手で打つ（間 300 ms）",function(){setv(null,ix(1500),ix(300),ix(1500));});
    U.button(br2,"+++ の直後に命令を送る",function(){setv(null,ix(1500),ix(0),ix(5));});
    var box=U.svgbox(el);var ro=U.readout(el);
    function wraw(v){return 20+30*Math.log10(1+v/0.05);}
    function draw(){
      var G=GV[g.get()],A=XV[a.get()],B=XV[b.get()],C=XV[c.get()];
      var okA=A>G,okB=B<G,okC=C>G,ok=okA&&okB&&okC;
      var o=[],x=14,y=46,bw=30,sum=wraw(A)+2*wraw(B)+wraw(C),sc=Math.min(1,(700-14-58-90-58-14)/sum);
      function gap(v,good,lab){var w=Math.max(16,wraw(v)*sc);o.push(S.L(x+2,y+40,x+w-2,y+40,good?"green":"alias",1.6));
        o.push(S.L(x+2,y+34,x+2,y+46,good?"green":"alias",1.2));o.push(S.L(x+w-2,y+34,x+w-2,y+46,good?"green":"alias",1.2));
        o.push(S.T(x+w/2,y+60,(v>=1000?U.sig(v/1000,4)+" s":U.sig(v,3)+" ms"),"middle",10,good?"green":"alias",true));
        o.push(S.T(x+w/2,y+74,lab+(good?" ✓":" ✗"),"middle",9.5,good?"green":"alias"));x+=w;}
      o.push(S.RECT(x,y,58,28,4,U.soft("purple"),"purple",1.2));o.push(S.T(x+29,y+19,"前のデータ","middle",9.5,"purple",true));x+=58;
      gap(A,okA,"> G");
      for(var k=0;k<3;k++){o.push(S.RECT(x,y,bw,28,4,U.soft(ok?"teal":"purple"),ok?"teal":"purple",1.2));o.push(S.T(x+bw/2,y+20,"+","middle",14,"ink",true,true));x+=bw;if(k<2)gap(B,okB,"< G");}
      gap(C,okC,"> G");
      o.push(S.RECT(x,y,58,28,4,U.soft("signal"),"signal",1.2));o.push(S.T(x+29,y+19,"次のバイト","middle",9.5,"signal",true));x+=58;
      var W=700;
      o.push(S.T(14,22,"G = "+ms(G)+"（ガードタイム）。空きの長さは対数で描いた（時間に比例しない）。","start",10.5,"muted"));
      o.push(S.T(14,y+104,ok?"→ モジュールはコマンドモードに戻る（+++ は TCP に流れない）":"→ +++ はデータとして TCP に流れる（モードは変わらない）","start",12,ok?"teal":"purple",true));
      box.set(S.svg(W,y+118,o));
      var bt=10/115200*1000,tmin=A+3*bt+2*B+C;
      var why=[];if(!okA)why.push("前の空き "+ms(A)+" が G 以下");if(!okB)why.push("+ の間の空き "+ms(B)+" が G 以上");if(!okC)why.push("後の空き "+ms(C)+" が G 以下");
      ro.innerHTML="条件: 前の空き > G "+(okA?'<span class="ok">✓</span>':'<span class="warn">✗</span>')+" ・ + の間の空き < G "+(okB?'<span class="ok">✓</span>':'<span class="warn">✗</span>')+" ・ 後の空き > G "+(okC?'<span class="ok">✓</span>':'<span class="warn">✗</span>')+
        "<br>結果: "+(ok?'<b style="color:var(--teal)">コマンドモードに戻る</b>':'<b style="color:var(--purple)">データとして送る</b>（'+why.join("、")+"）")+
        "<br>+++ の 3 バイトを 115200 bps・8N1 で送る時間 = 3 × 86.8 µs = 0.26 ms ・ 前の空きから後の空きまでの合計 = <b>"+(tmin>=1000?U.sig(tmin/1000,4)+" s":U.sig(tmin,4)+" ms")+"</b>"+(ok?"（ESP-AT ではさらに 1 秒待ってから次の命令を送る）":"")+
        '<div class="wnote">条件は ESP-AT の説明書の書き方（前と後は G より長い空き、+ の間は G より短い空き）に合わせた。G の値と細かな条件は製品ごとに違う。「1 秒ごとの 3 バイト」では、空きは 1 秒から 3 バイトの 0.26 ms を引いた 999.7 ms になる。</div>';
    }
    draw();
  };

  /* ---- 5 節: HCI の解読 ---- */
  var _w06_OP={0x0C03:["HCI_Reset","コントローラをリセットする"],0x0C01:["HCI_Set_Event_Mask","知らせてほしいイベントを選ぶ"],0x1001:["HCI_Read_Local_Version_Information","版を聞く"],
    0x1009:["HCI_Read_BD_ADDR","自分のアドレスを聞く"],0x2002:["HCI_LE_Read_Buffer_Size","ACL データを置く場所の大きさと数を聞く"],0x2006:["HCI_LE_Set_Advertising_Parameters","アドバタイズの設定"],
    0x2008:["HCI_LE_Set_Advertising_Data","アドバタイズのデータを設定"],0x200A:["HCI_LE_Set_Advertising_Enable","アドバタイズを始める・止める"],0x200B:["HCI_LE_Set_Scan_Parameters","スキャンの設定"],
    0x200C:["HCI_LE_Set_Scan_Enable","スキャンを始める・止める"],0x200D:["HCI_LE_Create_Connection","接続を始める"],0x0406:["HCI_Disconnect","接続を切る"]};
  var _w06_EV={0x05:["Disconnection Complete","接続が切れた"],0x0E:["Command Complete","命令の処理が終わった"],0x0F:["Command Status","命令を受け付けた（結果は後で）"],
    0x10:["Hardware Error","コントローラのハードウェアの誤り"],0x13:["Number Of Completed Packets","ACL データを置く場所が空いた"],0x3E:["LE Meta","LE のイベント（サブイベントで種類を示す）"]};
  var _w06_SUB={0x01:["LE Connection Complete","接続ができた"],0x02:["LE Advertising Report","アドバタイズを受けた"],0x03:["LE Connection Update Complete","接続の設定が変わった"]};
  var _w06_ST={0x00:"成功",0x01:"知らない命令",0x08:"接続のタイムアウト",0x0C:"今は受け付けられない命令",0x12:"パラメータが正しくない",0x13:"相手が接続を切った",0x16:"ホストが接続を切った"};
  var _w06_ATT={0x01:"Error Response",0x02:"Exchange MTU Request",0x03:"Exchange MTU Response",0x0A:"Read Request",0x0B:"Read Response",0x12:"Write Request",0x13:"Write Response",0x1B:"Handle Value Notification（通知）",0x1D:"Handle Value Indication（指示）",0x1E:"Handle Value Confirmation",0x52:"Write Command"};
  function _w06_hx(a){return a.map(function(b){var s=b.toString(16).toUpperCase();return s.length<2?"0"+s:s;}).join(" ");}
  function _w06_le(a,i,n){var v=0;for(var k=n-1;k>=0;k--)v=v*256+(a[i+k]||0);return v;}
  function _w06_addr(a,i){var s=[];for(var k=5;k>=0;k--){var h=a[i+k].toString(16).toUpperCase();s.push(h.length<2?"0"+h:h);}return s.join(":");}
  function _w06_st(v){if(v==null)return "?";return "0x"+(v<16?"0":"")+v.toString(16).toUpperCase()+(_w06_ST[v]!=null?" = "+_w06_ST[v]:"");}
  /* 1 つのパケットを解読する。返り値 {f:[[欄, バイト数, 色, 値, 意味]], sum, len, bad} */
  function _w06_decode(a){
    var f=[],t=a[0],i=1,bad="";
    function need(n){if(a.length<i+n){bad="バイトが足りない（あと "+(i+n-a.length)+" バイト）";return false;}return true;}
    function fld(name,n,c,mean,val){if(!need(n))return false;var v=a.slice(i,i+n);f.push([name,n,c,val!=null?val:_w06_hx(v),mean]);i+=n;return true;}
    if(t===0x01){
      f.push(["種類",1,"signal","01","HCI コマンド（ホスト → コントローラ）"]);
      if(!need(3))return {f:f,bad:bad,len:a.length,sum:"コマンド（途中まで）"};
      var op=_w06_le(a,1,2),ogf=op>>10,ocf=op&1023,nm=_w06_OP[op];
      fld("命令の番号",2,"gold","0x"+_w06_h4(op)+" = OGF 0x"+_w06_h2(ogf)+"・OCF 0x"+_w06_h3(ocf)+(nm?": "+nm[0]+"（"+nm[1]+"）":"（この解読器が知らない命令）"));
      var pl=a[i];fld("長さ",1,"teal","パラメータ "+pl+" バイト");
      var end=i+pl;
      if(op===0x200A){fld("Advertising_Enable",1,"purple",a[i]===1?"1 = 始める":a[i]===0?"0 = 止める":"?");}
      else if(op===0x200C){fld("LE_Scan_Enable",1,"purple",a[i]===1?"1 = 始める":"0 = 止める");fld("Filter_Duplicates",1,"purple","1 = 同じ相手の報告をまとめる");}
      else if(op===0x0406){fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("理由",1,"purple",_w06_st(a[i]));}
      else if(op===0x200D){
        fld("スキャン間隔",2,"purple",U.sig(_w06_le(a,i,2)*0.625,4)+" ms（0.625 ms 単位）");fld("スキャンウィンドウ",2,"purple",U.sig(_w06_le(a,i,2)*0.625,4)+" ms");
        fld("フィルタ",1,"purple","0 = 相手のアドレスで選ぶ");fld("相手のアドレスの種類",1,"purple",a[i]===1?"1 = ランダム（17 章）":"0 = 公開");
        if(need(6)){f.push(["相手のアドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)+"（下位のバイトが先）"]);i+=6;}
        fld("自分のアドレスの種類",1,"purple",a[i]===1?"1 = ランダム":"0 = 公開");
        fld("接続間隔の最小",2,"purple",U.sig(_w06_le(a,i,2)*1.25,4)+" ms（1.25 ms 単位。18 章）");fld("接続間隔の最大",2,"purple",U.sig(_w06_le(a,i,2)*1.25,4)+" ms");
        fld("レイテンシ",2,"purple",String(_w06_le(a,i,2)));fld("監視タイムアウト",2,"purple",U.sig(_w06_le(a,i,2)*10,4)+" ms（10 ms 単位）");
        fld("接続イベントの長さの最小",2,"purple","");fld("接続イベントの長さの最大",2,"purple","");
      }
      else if(pl>0){fld("パラメータ",Math.min(pl,a.length-i),"purple","（この解読器では細かく読まない）");}
      if(i<end&&!bad){f.push(["残り",end-i,"purple",_w06_hx(a.slice(i,end)),""]);i=end;}
      return {f:f,bad:bad,len:i,sum:"HCI コマンド "+(nm?nm[0]:"0x"+_w06_h4(op))};
    }
    if(t===0x04){
      f.push(["種類",1,"signal","04","HCI イベント（コントローラ → ホスト）"]);
      if(!need(2))return {f:f,bad:bad,len:a.length,sum:"イベント（途中まで）"};
      var ev=a[1],en=_w06_EV[ev];
      fld("イベントの番号",1,"gold","0x"+_w06_h2(ev)+(en?" = "+en[0]+"（"+en[1]+"）":"（この解読器が知らないイベント）"));
      var L=a[i];fld("長さ",1,"teal","パラメータ "+L+" バイト");
      var e2=i+L,sum="HCI イベント "+(en?en[0]:"0x"+_w06_h2(ev));
      if(ev===0x0E){fld("送ってよい命令の数",1,"purple",String(a[i]));var op2=need(2)?_w06_le(a,i,2):0,n2=_w06_OP[op2];
        fld("終わった命令",2,"purple","0x"+_w06_h4(op2)+(n2?" = "+n2[0]:""));fld("状態",1,"purple",_w06_st(a[i]));
        if(op2===0x2002){fld("置き場所の大きさ",2,"purple",_w06_le(a,i,2)+" バイト");fld("置き場所の数",1,"purple",String(a[i]));}
        else if(op2===0x1009){if(need(6)){f.push(["自分のアドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)]);i+=6;}}
        sum+="（"+(n2?n2[0]:"0x"+_w06_h4(op2))+"）";}
      else if(ev===0x0F){fld("状態",1,"purple",_w06_st(a[i]));fld("送ってよい命令の数",1,"purple",String(a[i]));var op3=need(2)?_w06_le(a,i,2):0,n3=_w06_OP[op3];
        fld("受け付けた命令",2,"purple","0x"+_w06_h4(op3)+(n3?" = "+n3[0]:""));sum+="（"+(n3?n3[0]:"0x"+_w06_h4(op3))+"）";}
      else if(ev===0x05){fld("状態",1,"purple",_w06_st(a[i]));fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("理由",1,"purple",_w06_st(a[i]));}
      else if(ev===0x10){fld("ハードウェアの番号",1,"purple","製品ごとの意味");}
      else if(ev===0x13){var nh=a[i];fld("ハンドルの数",1,"purple",String(nh));for(var k=0;k<nh&&!bad;k++){fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("空いた数",2,"purple",String(_w06_le(a,i,2)));}}
      else if(ev===0x3E){var se=a[i],sn=_w06_SUB[se];fld("サブイベント",1,"purple","0x"+_w06_h2(se)+(sn?" = "+sn[0]+"（"+sn[1]+"）":""));sum="HCI イベント "+(sn?sn[0]:"LE Meta");
        if(se===0x01){fld("状態",1,"purple",_w06_st(a[i]));fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("役割",1,"purple",a[i]===0?"0 = セントラル（16 章）":"1 = ペリフェラル");
          fld("相手のアドレスの種類",1,"purple",a[i]===1?"1 = ランダム":"0 = 公開");if(need(6)){f.push(["相手のアドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)]);i+=6;}
          fld("接続間隔",2,"purple",U.sig(_w06_le(a,i,2)*1.25,4)+" ms（18 章）");fld("レイテンシ",2,"purple",String(_w06_le(a,i,2)));fld("監視タイムアウト",2,"purple",U.sig(_w06_le(a,i,2)*10,4)+" ms");fld("クロックの精度",1,"purple","");}
        else if(se===0x02){var nr=a[i];fld("報告の数",1,"purple",String(nr)+(nr!==1?"（この解読器は 1 つだけ読む）":""));
          fld("パケットの種類",1,"purple",["0 = ADV_IND（17 章）","1 = ADV_DIRECT_IND","2 = ADV_SCAN_IND","3 = ADV_NONCONN_IND","4 = SCAN_RSP"][a[i]]||"?");
          fld("アドレスの種類",1,"purple",a[i]===1?"1 = ランダム":"0 = 公開");if(need(6)){f.push(["アドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)]);i+=6;}
          var dl=a[i];fld("データの長さ",1,"purple",dl+" バイト");if(dl>0&&need(dl)){var tx="";a.slice(i,i+dl).forEach(function(b){tx+=b>=32&&b<127?String.fromCharCode(b):".";});f.push(["アドバタイズのデータ",dl,"purple",_w06_hx(a.slice(i,i+dl)),"中身は 17 章（文字にすると "+tx+"）"]);i+=dl;}
          if(need(1)){var rs=a[i]>127?a[i]-256:a[i];f.push(["RSSI",1,"purple",_w06_hx([a[i]]),rs+" dBm（受けた電波の強さ）"]);i++;}}
      }
      if(i<e2&&!bad){f.push(["残りのパラメータ",e2-i,"purple",_w06_hx(a.slice(i,e2)),""]);i=e2;}
      if(i>e2&&!bad)bad="長さの欄より多く読んだ（形が正しくない）";
      return {f:f,bad:bad,len:Math.max(i,e2),sum:sum};
    }
    if(t===0x02){
      f.push(["種類",1,"signal","02","ACL データ（両方向）"]);
      if(!need(4))return {f:f,bad:bad,len:a.length,sum:"ACL データ（途中まで）"};
      var hf=_w06_le(a,1,2),hd=hf&0x0FFF,pb=(hf>>12)&3,bc=(hf>>14)&3;
      fld("ハンドル・フラグ",2,"gold","接続ハンドル 0x"+_w06_h3(hd)+" ・ PB = 0b"+("0"+pb.toString(2)).slice(-2)+"（"+(pb===1?"続きの断片":pb===3?"この章では扱わない値":"上の層のパケットの先頭")+"）・ BC = "+bc);
      var dl2=_w06_le(a,i,2);fld("データの長さ",2,"teal",dl2+" バイト");
      var e3=i+dl2;
      if(dl2>=4&&need(4)){var l2=_w06_le(a,i,2),cid=_w06_le(a,i+2,2);fld("L2CAP の長さ",2,"purple",l2+" バイト");
        fld("チャネルの番号",2,"purple","0x"+_w06_h4(cid)+(cid===4?" = ATT（18 章）":cid===6?" = SMP（20 章）":cid===5?" = LE の信号":""));
        if(cid===4&&i<e3&&need(1)){var ao=a[i];fld("ATT の命令",1,"purple","0x"+_w06_h2(ao)+(_w06_ATT[ao]?" = "+_w06_ATT[ao]:""));
          if((ao===0x1B||ao===0x1D||ao===0x12||ao===0x52||ao===0x0A)&&need(2)){fld("属性のハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));}}}
      if(i<e3&&!bad&&a.length>=e3){f.push(["値",e3-i,"purple",_w06_hx(a.slice(i,e3)),"アプリケーションのデータ（18 章）"]);i=e3;}
      if(a.length<e3&&!bad)bad="バイトが足りない（データの長さの欄は "+dl2+"）";
      return {f:f,bad:bad,len:Math.max(i,e3),sum:"ACL データ（ハンドル 0x"+_w06_h3(hd)+"、"+dl2+" バイト）"};
    }
    return {f:[["種類",1,"alias",_w06_hx([t]),"H4 の種類として知らない値（01・02・04 のどれでもない）"]],bad:"種類のバイトが正しくない",len:1,sum:"不明"};
  }
  function _w06_h2(v){v=v||0;var s=v.toString(16).toUpperCase();return s.length<2?"0"+s:s;}
  function _w06_h3(v){v=v||0;var s=v.toString(16).toUpperCase();while(s.length<3)s="0"+s;return s;}
  function _w06_h4(v){v=v||0;var s=v.toString(16).toUpperCase();while(s.length<4)s="0"+s;return s;}

  REG.w06_hci=function(el,U){
    var EX=[["HCI_Reset","01 03 0C 00"],["リセットの完了","04 0E 04 01 03 0C 00"],["置き場所を聞く","01 02 20 00"],["その答え","04 0E 07 01 02 20 00 FB 00 03"],
      ["アドバタイズを始める","01 0A 20 01 01"],["接続を始める","01 0D 20 19 60 00 30 00 00 01 66 55 44 33 22 C1 00 18 00 28 00 00 00 C8 00 00 00 00 00"],
      ["受け付けた","04 0F 04 00 01 0D 20"],["接続できた","04 3E 13 01 00 40 00 00 01 66 55 44 33 22 C1 18 00 00 00 C8 00 00"],
      ["アドバタイズの報告","04 3E 15 02 01 00 01 66 55 44 33 22 C1 09 02 01 06 05 09 54 45 4D 50 C4"],["ACL データ（通知）","02 40 20 09 00 05 00 04 00 1B 12 00 0B 09"],
      ["場所が空いた","04 13 05 01 40 00 01 00"],["接続が切れた","04 05 04 00 40 00 13"]];
    var STREAM="04 0E 04 01 03 0C 00 04 0E 07 01 02 20 00 FB 00 03 04 13 05 01 40 00 01 00 04 05 04 00 40 00 13";
    U.head(el,"HCI","H4 のパケットを解読する");
    var row=U.ctrls(el);
    var tx=U.textin(row,"16 進のバイト（H4 の種類のバイトから）","01 03 0C 00",function(){draw();},{width:"100%"});
    var br=U.btnrow(el);
    EX.forEach(function(e){U.button(br,e[0],function(){mode.set(false);tx.set(e[1]);draw();});});
    var row2=U.ctrls(el);
    var mode=U.checkbox(row2,"並んだパケットの流れとして読む（ホストの側: 02 と 04 だけを区切る）",false,function(){draw();});
    var drop=U.slider(row2,"落とすバイト",{min:0,max:32,step:1,value:0,fmt:function(v){return v===0?"なし":v+" バイト目";},onInput:function(){draw();}});
    var br2=U.btnrow(el);
    U.button(br2,"流れの例（4 つのイベント）",function(){mode.set(true);tx.set(STREAM);drop.set(0);draw();});
    U.button(br2,"2 つ目の先頭の 04 を落とす",function(){mode.set(true);tx.set(STREAM);drop.set(8);draw();});
    var box=U.svgbox(el,{scroll:true});var ro=U.readout(el);
    function parse(){var s=tx.get().replace(/0x/gi," ").replace(/[,;]/g," ").trim(),a=[],badc=false;if(!s)return {a:a,bad:false};
      s.split(/\s+/).forEach(function(w){if(!/^[0-9a-fA-F]{1,2}$/.test(w)){if(/^[0-9a-fA-F]+$/.test(w)&&w.length%2===0){for(var k=0;k<w.length;k+=2)a.push(parseInt(w.substr(k,2),16));}else badc=true;}else a.push(parseInt(w,16));});
      return {a:a,bad:badc};}
    function draw(){
      var p=parse(),a=p.a,warn=p.bad?'<span class="warn">16 進の 2 桁でない語を読み飛ばした。</span><br>':"";
      drop.input.max=Math.max(1,a.length);
      if(!a.length){box.set("");ro.innerHTML=warn+"バイトを入れる。";return;}
      if(!mode.get()){
        var d=_w06_decode(a),o=[],cw=26,per=24,x0=8,y0=26,pos=0,maxr=0;
        o.push(U.S.T(x0,12,"ます目は 1 バイト（16 進）。色は欄、上の数は下の表の番号。","start",9.5,"muted"));
        d.f.forEach(function(x,k){for(var j=0;j<x[1]&&pos<a.length;j++,pos++){var r=Math.floor(pos/per),q=pos%per,xx=x0+q*cw,yy=y0+r*52;maxr=Math.max(maxr,r);
            o.push(U.S.RECT(xx+1,yy+12,cw-2,24,3,U.soft(x[2]),x[2],k%2?1.8:1.1));o.push(U.S.T(xx+cw/2,yy+28,_w06_hx([a[pos]]),"middle",9.5,"ink",true,true));
            if(j===0)o.push(U.S.T(xx+3,yy+8,String(k+1),"start",8.5,x[2],true));}});
        for(;pos<a.length;pos++){var r2=Math.floor(pos/per),q2=pos%per;maxr=Math.max(maxr,r2);o.push(U.S.RECT(x0+q2*cw+1,y0+r2*52+12,cw-2,24,3,"panel","line",1,"3 2"));o.push(U.S.T(x0+q2*cw+cw/2,y0+r2*52+28,_w06_hx([a[pos]]),"middle",9.5,"muted",false,true));}
        box.set(U.S.svg(x0*2+per*cw,y0+(maxr+1)*52,o));
        var rows=d.f.map(function(x,k){return [String(k+1),'<span style="color:'+U.col(x[2])+';font-weight:700">'+U.esc(x[0])+'</span>',String(x[1]),'<span style="font-family:var(--mono)">'+U.esc(x[3])+'</span>',_w06_wrap(U.esc(x[4]||""))];});
        var rest=a.length-d.len;
        ro.innerHTML=warn+"<b>"+U.esc(d.sum)+"</b> ・ 全体 "+Math.min(d.len,a.length)+" バイト"+(d.bad?' ・ <span class="warn">'+U.esc(d.bad)+'</span>':' <span class="ok">形どおり</span>')+
          (rest>0?" ・ 後に "+rest+" バイト残っている（「流れとして読む」で続きを区切れる）":"")+U.tbl(["#","欄","バイト数","値","意味"],rows,["right","left","right","left","left"]);
        return;
      }
      /* 流れ: 本文の h4_feed と同じ手順で区切る */
      var dp=drop.get(),b=a.slice();if(dp>0&&dp<=b.length)b.splice(dp-1,1);
      var st=0,typ=0,got=0,need=0,cur=[],pk=[],skipped=[],role=[];
      for(var i=0;i<b.length;i++){var c=b[i];
        if(st===0){if(c===4)need=2;else if(c===2)need=4;else{skipped.push(i);role[i]=-1;continue;}typ=c;got=0;st=1;cur=[i];role[i]=pk.length;continue;}
        cur.push(i);role[i]=pk.length;got++;
        if(st===1&&got===need){need+=typ===4?b[cur[2]]:(b[cur[3]]|(b[cur[4]]<<8));st=2;}
        if(st===2&&got===need){pk.push({ix:cur.slice(),type:typ});st=0;}}
      var pend=st!==0?{ix:cur.slice(),need:need,got:got}:null;
      var cols=["signal","green","gold","purple","teal"],o=[],cw=24,per=26,x0=8,y0=22,W=x0*2+per*cw;
      var ref=null;if(dp>0){/* 落とさない場合の区切り */var r0=[];(function(){var s2=0,t2=0,g2=0,n2=0,c2=[];for(var j=0;j<a.length;j++){var v=a[j];if(s2===0){if(v===4)n2=2;else if(v===2)n2=4;else continue;t2=v;g2=0;s2=1;c2=[j];continue;}c2.push(j);g2++;if(s2===1&&g2===n2){n2+=t2===4?a[c2[2]]:(a[c2[3]]|(a[c2[4]]<<8));s2=2;}if(s2===2&&g2===n2){r0.push(_w06_hx(c2.map(function(q){return a[q];})));s2=0;}}})();ref=r0;}
      o.push(U.S.T(x0,14,"届いた "+b.length+" バイト（色 = 受け手が区切ったパケット、灰色 = 種類として読めずに捨てたバイト、点線 = 読みかけ）","start",10,"muted"));
      var rowsN=Math.ceil(b.length/per);
      for(var j=0;j<b.length;j++){var r=Math.floor(j/per),q=j%per,xx=x0+q*cw,yy=y0+r*44,ro2=role[j],c3;
        var inPend=pend&&pend.ix.indexOf(j)>=0;
        if(ro2===-1)c3="muted";else if(inPend)c3="alias";else c3=cols[ro2%cols.length];
        o.push(U.S.RECT(xx+1,yy,cw-2,24,3,ro2===-1?"panel":U.soft(c3),c3,1.1,inPend?"3 2":null));
        o.push(U.S.T(xx+cw/2,yy+16,_w06_hx([b[j]]),"middle",9,"ink",true,true));
        if(dp>0&&j===dp-1){o.push(U.S.L(xx,yy-4,xx,yy+30,"alias",2));o.push(U.S.T(xx,yy+38,"↑ ここで 1 バイト欠けた","start",8.5,"alias",true));}
      }
      box.set(U.S.svg(W,y0+rowsN*44+12,o));
      var rows=pk.map(function(p,k){var bs=p.ix.map(function(q){return b[q];}),d=_w06_decode(bs),h=_w06_hx(bs),ok=!ref||ref.indexOf(h)>=0;
        return [String(k+1),'<span style="color:'+U.col(cols[k%cols.length])+';font-weight:700">'+U.esc(d.sum)+'</span>','<span style="font-family:var(--mono)">'+h+'</span>',ok?'<span class="ok">正しい</span>':'<span class="warn">誤った内容</span>'];});
      ro.innerHTML=warn+"区切ったパケット <b>"+pk.length+"</b> 個 ・ 種類として読めずに捨てたバイト <b>"+skipped.length+"</b> 個"+
        (pend?' ・ <span class="warn">読みかけ: あと '+(pend.need-pend.got)+' バイトを待っている</span>':"")+
        U.tbl(["#","受け手が読んだもの","バイト","落とさない場合と比べて"],rows,["right","left","left","left"])+
        '<div class="wnote">H4 には区切り文字も CRC も無いので、受け手は誤った内容のパケットにも気づけない。本文の 4 つのイベントの列では、落とす位置を 32 通り変えると、欠けたパケットが失われるだけで済むのは 1 通りだけである。</div>';
    }
    draw();
  };
