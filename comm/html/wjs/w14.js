  /* ===== 14 章 HTTP と CoAP ===== */
  /* ---- 2 節: チャンク形式の解析器（本文の chunk_feed と同じ動き。状態の番号も同じ順） ---- */
  var _w14_SN=["長さの行（CK_SIZE）","拡張（CK_EXT）","LF を待つ（CK_LF）","データ（CK_DATA）","データの後（CK_DATA_CR）",
    "トレーラ（CK_TRAILER）","トレーラの行（CK_TRAILER_LINE）","終わり（CK_DONE）","誤り（CK_ERR）"];
  function _w14_hexv(c){if(c>=48&&c<=57)return c-48;if(c>=97&&c<=102)return c-87;if(c>=65&&c<=70)return c-55;return -1;}
  function _w14_parser(onData){
    var r={st:0,next:0,left:0,seen:0};
    r.feed=function(s,base){var i=0,n=s.length;
      while(i<n&&r.st!==7&&r.st!==8){
        if(r.st===3){var k=Math.min(n-i,r.left);onData(s.slice(i,i+k),base+i);r.left-=k;i+=k;if(r.left===0)r.st=4;continue;}
        var c=s[i++],h=_w14_hexv(c);
        switch(r.st){
          case 0: if(h>=0&&r.left<=0x0FFFFFF){r.left=r.left*16+h;r.seen=1;}
                  else if(!r.seen)r.st=8;
                  else if(c===13){r.next=r.left?3:5;r.st=2;}
                  else if(c===59||c===32||c===9)r.st=1;
                  else r.st=8; break;
          case 1: if(c===13){r.next=r.left?3:5;r.st=2;} break;
          case 2: r.st=(c===10)?r.next:8; r.seen=0; break;
          case 4: if(c===13){r.next=0;r.st=2;}else r.st=8; break;
          case 5: if(c===13){r.next=7;r.st=2;}else r.st=6; break;
          case 6: if(c===13){r.next=5;r.st=2;} break;
        }
      }
      return i;};
    return r;
  }
  function _w14_bytes(s){var b=[];for(var i=0;i<s.length;i++)b.push(s.charCodeAt(i)&255);return b;}
  function _w14_show(arr){return arr.map(function(c){return c===13?"\\r":c===10?"\\n":(c>=32&&c<127)?String.fromCharCode(c):"\\x"+("0"+c.toString(16).toUpperCase()).slice(-2);}).join("");}
  var _w14_RC={size:"gold",ext:"teal",data:"green",crlf:"muted",last:"purple",trailer:"purple",end:"purple",next:"muted"};
  var _w14_RN={size:"長さの行",ext:"拡張",data:"データ",crlf:"データの後の CR LF",last:"最後のチャンク",trailer:"トレーラ",end:"最後の空行",next:"次の応答（本文ではない）"};

  REG.w14_chunk=function(el,U){
    var BODIES=[
      {t:"測定値の記録 2 行（30 バイト、CR LF を含む）",b:_w14_bytes("t=23.5,h=41.2\r\nt=23.6,h=41.0\r\n")},
      {t:"JSON（40 バイト）",b:_w14_bytes('{"seq":1024,"t":23.5,"h":41.25,"bat":87}')},
      {t:"バイナリ（0 CR LF CR LF を含む 12 バイト）",b:[0x00,0x30,0x0D,0x0A,0x0D,0x0A,0xFF,0x41,0x0D,0x0A,0x30,0x0D]},
      {t:"長い記録（200 バイト）",b:(function(){var s="";for(var k=0;k<13;k++)s+="t="+(21+k%5)+"."+(k%10)+",h="+(40+k%7)+"."+((k*3)%10)+"\r\n";return _w14_bytes(s+"end\r\n");})()}];
    U.head(el,"CHUNKED","チャンク形式 — どこで分かれて届いても、取り出す本文は同じ");
    var row=U.ctrls(el);
    var bd=U.select(row,"本文",BODIES.map(function(x){return x.t;}),0,rebuild);
    var cs=U.slider(row,"チャンクの大きさ",{values:[1,2,4,8,15,16,32,64,256],value:15,fmt:function(v){return v+" バイト";},onInput:rebuild});
    var row2=U.ctrls(el);
    var md=U.select(row2,"TCP から受け取る 1 回分",["まとめて 1 回","1 バイトずつ","乱数（1〜5 バイト）","乱数（1〜20 バイト）"],3,rebuild);
    var cr=U.select(row2,"壊し方",["壊さない","1 つ目の長さの行に 1 を足す（F → 1F）","1 つ目のデータの後の CR LF を落とす","最後のチャンクが届く前に切れる","長さに 16 進でない文字（G）"],0,rebuild);
    var et=U.checkbox(row2,"拡張とトレーラを付ける（正しい形）",false,rebuild);
    var br=U.btnrow(el);
    U.button(br,"最初から",function(){reset();render();});
    U.button(br,"1 回分ずつ進める",function(){step();render();});
    U.button(br,"最後まで",function(){while(pos<pieces.length)step();render();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rebuild();});
    var stream=U.mk("div","wsvg");stream.style.padding=".5rem";el.appendChild(stream);
    var ro=U.readout(el);
    var seed=3,enc=null,pieces=[],pos=0,P=null,out=[],calls=[],used=0;
    function build(body,c,extTr,corrupt){
      var b=[],role=[];
      function push(arr,rl){arr.forEach(function(x){b.push(x);role.push(rl);});}
      var i=0,first=true;
      while(i<body.length){var n=Math.min(c,body.length-i),hx=n.toString(16).toUpperCase();
        if(first&&corrupt===1)hx="1"+hx;
        if(first&&corrupt===4)hx="G"+hx.slice(1);
        push(_w14_bytes(hx),"size");
        if(extTr&&first)push(_w14_bytes(";q=1"),"ext");
        push([13,10],"size");
        push(body.slice(i,i+n),"data");
        if(!(first&&corrupt===2))push([13,10],"crlf");
        i+=n;first=false;}
      if(corrupt!==3){
        push(_w14_bytes("0"),"last");push([13,10],"last");
        if(extTr)push(_w14_bytes("X-Count: 2\r\n"),"trailer");
        push([13,10],"end");
        push(_w14_bytes("HTTP/1.1 200 OK\r\n"),"next");}
      return {b:b,role:role};
    }
    function rebuild(){
      var body=BODIES[bd.get()].b;
      enc=build(body,cs.get(),et.get(),cr.get());enc.body=body;
      var r=U.rng(seed*7919+bd.get()*31+md.get()*7+cs.get()),m=md.get(),i=0;pieces=[];
      while(i<enc.b.length){var n=m===0?enc.b.length:m===1?1:m===2?1+r.int(5):1+r.int(20);n=Math.min(n,enc.b.length-i);pieces.push({a:i,n:n});i+=n;}
      reset();while(pos<pieces.length)step();render();
    }
    function reset(){pos=0;out=[];calls=[];used=0;P=_w14_parser(function(arr,base){out=out.concat(arr);calls.length&&calls[calls.length-1].d.push(arr.length);});}
    function step(){
      if(pos>=pieces.length)return;
      var pc=pieces[pos++],s=enc.b.slice(pc.a,pc.a+pc.n),before=P.st;
      if(P.st===7||P.st===8){calls.push({n:pc.n,u:0,d:[],st:P.st,skip:true});return;}
      calls.push({n:pc.n,u:0,d:[],st:0});
      var u=P.feed(s,pc.a);calls[calls.length-1].u=u;calls[calls.length-1].st=P.st;used+=u;
    }
    function render(){
      var starts={};pieces.forEach(function(p){starts[p.a]=1;});
      var done=pos>0?pieces[pos-1].a+pieces[pos-1].n:0;
      var h='<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-bottom:.3rem">届いたバイト（青い縦線 = 解析器に渡す 1 回分の区切り。薄いバイトはまだ渡していない。点線の枠は、解析器が使わずに残したバイト）</div><div class="hex">';
      enc.b.forEach(function(c,i){var rl=enc.role[i],col=_w14_RC[rl],lab=c===13?"CR":c===10?"LF":c===32?"SP":(c>=33&&c<127)?U.esc(String.fromCharCode(c)):U.fmt.hex(c);
        var small=(c===13||c===10||c===32||!(c>=33&&c<127));
        var st="background:"+(rl==="next"?"var(--screen)":U.soft(col))+";border-color:"+U.col(col)+";";
        if(i>=done)st+="opacity:.35;";
        else if(i>=used)st+="border-style:dashed;border-color:var(--alias);";
        if(starts[i]&&i>0)st+="box-shadow:-3px 0 0 0 var(--signal);margin-left:5px;";
        if(small)st+="font-size:.62rem;";
        h+='<span style="'+st+'" title="'+(_w14_RN[rl]||"")+' 0x'+U.fmt.hex(c)+'">'+lab+'</span>';});
      h+='</div><div class="legend">'+["size","ext","data","crlf","last","next"].map(function(k){return '<span><b style="color:'+U.col(_w14_RC[k])+'">■</b> '+_w14_RN[k]+'</span>';}).join("")+'</div>';
      stream.innerHTML=h;
      var body=enc.body,same=out.length===body.length&&out.every(function(x,i){return x===body[i];});
      var allIn=pos>=pieces.length,st=P.st,msg;
      if(st===7)msg='<span class="ok">本文の終わり（CK_DONE）</span>。使ったバイト '+used+'、渡したバイトのうち残りの '+(done-used)+' バイトは、次の応答の解析に回す';
      else if(st===8)msg='<span class="warn">誤り（CK_ERR）</span>。形が規格と違うので、この応答は捨ててコネクションを閉じる';
      else if(allIn)msg='<span class="warn">届いたバイトが尽きたが、本文はまだ終わっていない</span>（最後のチャンクが来ていないので、途中で切れたと分かる）';
      else msg="まだ途中（次の 1 回分を待つ）";
      var rows=[],skipped=0,skipB=0;
      calls.forEach(function(c,i){if(c.skip){skipped++;skipB+=c.n;return;}rows.push([String(i+1),c.n+" バイト",c.u+" バイト",c.d.length?c.d.join(" + ")+" バイト":"—",_w14_SN[c.st]]);});
      if(skipped)rows.push(["…",skipB+" バイト","—","—","（"+skipped+" 回分は、次の応答の解析へ渡す）"]);
      ro.innerHTML="本文 "+body.length+" バイト → チャンク形式で "+enc.role.filter(function(r){return r!=="next";}).length+" バイト ・ 解析器に渡した回数 <b>"+calls.length+"</b> / "+pieces.length+
        " ・ いまの状態 <b>"+_w14_SN[st]+"</b>"+(st===3?"（データの読み残し "+P.left+" バイト）":"")+"<br>"+msg+"<br>"+
        "取り出した本文（"+out.length+" バイト。\\r\\n は CR LF）: <code>"+U.esc(_w14_show(out))+"</code>"+(st===7?(same?' <span class="ok">元の本文と一致</span>':' <span class="warn">元の本文と違う</span>'):"")+
        U.tbl(["#","渡した大きさ","使った大きさ","on_data で渡した大きさ","渡した後の状態"],rows,["right","right","right","left","left"])+
        '<div class="wnote">区切り方を変えても、取り出す本文・使ったバイトの数・最後の状態は変わらない（解析器が、読みかけの状態を覚えているため）。分け方によって変わるのは、データを何回に分けて渡したかだけである。</div>';
    }
    rebuild();
  };

  /* ---- 5 節: CoAP の再送 ---- */
  /* 1 回の交換。p: 1 回の送信が失われる確率、rtt [s]、at・rf・mr: ACK_TIMEOUT・ACK_RANDOM_FACTOR・MAX_RETRANSMIT */
  function _w14_exchange(r,p,rtt,at,rf,mr,log){
    var T0=at*(1+(rf-1)*r.next()),tg=(Math.pow(2,mr+1)-1)*T0,done=Infinity,got=false,dup=0,sent=0,okAt=0;
    for(var j=0;j<=mr;j++){var tj=(Math.pow(2,j)-1)*T0;if(tj>=done)break;sent++;
      var conOk=!r.chance(p),ackOk=false,isDup=false;
      if(conOk){if(got){dup++;isDup=true;}else got=true;ackOk=!r.chance(p);if(ackOk&&tj+rtt<done){done=tj+rtt;okAt=j+1;}}
      if(log)log.push({t:tj,conOk:conOk,ackOk:ackOk,dup:isDup});}
    var ok=done<=tg;
    return {T0:T0,tg:tg,ok:ok,t:ok?done:tg,k:ok?okAt:0,sent:sent,dup:dup};
  }

  REG.w14_coap=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"COAP","CON の再送 — 喪失の確率と 3 つの定数を変える");
    var row=U.ctrls(el);
    var pl=U.slider(row,"1 回の送信が失われる確率 p（往き・帰りとも）",{min:0,max:60,step:1,value:20,fmt:function(v){return v+" %";},onInput:draw});
    var rt=U.slider(row,"往復時間 RTT",{values:[0.05,0.1,0.2,0.5,1,2],value:0.2,fmt:function(v){return F.time(v);},onInput:draw});
    var row2=U.ctrls(el);
    var at=U.slider(row2,"ACK_TIMEOUT",{values:[1,1.5,2,3,4],value:2,fmt:function(v){return v+" s";},onInput:draw});
    var rf=U.slider(row2,"ACK_RANDOM_FACTOR",{values:[1,1.25,1.5,2],value:1.5,fmt:function(v){return String(v);},onInput:draw});
    var mr=U.slider(row2,"MAX_RETRANSMIT",{min:0,max:8,step:1,value:4,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"規格の既定値に戻す",function(){at.set(2);rf.set(1.5);mr.set(4);draw();});
    var box=U.svgbox(el),box2=U.svgbox(el),ro=U.readout(el);
    var seed=1;
    for(var sd=1;sd<500;sd++){var lg=[],ex=_w14_exchange(U.rng(sd*101+7),0.2,0.2,2,1.5,4,lg);
      if(ex.ok&&lg.length>=3&&lg.some(function(a){return a.dup;})){seed=sd;break;}}
    function draw(){
      var p=pl.get()/100,rtt=rt.get(),A=at.get(),R=rf.get(),M=mr.get();
      var span=A*(Math.pow(2,M)-1)*R,wait=A*(Math.pow(2,M+1)-1)*R;
      /* 1 回の交換の様子 */
      var log=[],e=_w14_exchange(U.rng(seed*101+7),p,rtt,A,R,M,log);
      var tmax=Math.max(e.ok?e.t:e.tg,1)*1.08,x0=110,x1=680,X=function(t){return x0+(x1-x0)*Math.min(t,tmax)/tmax;};
      var ys=46,yc=118,o=[];
      o.push(S.T(x0-10,ys+4,"サーバ","end",10.5,"green",true));o.push(S.T(x0-10,yc+4,"クライアント","end",10.5,"signal",true));
      o.push(S.L(x0,ys,x1,ys,"green",1.4));o.push(S.L(x0,yc,x1,yc,"signal",1.4));
      log.forEach(function(a,j){var t1=a.t,t2=a.t+rtt/2,t3=a.t+rtt;
        o.push(S.T(X(t1),yc+16,String(j+1),"middle",9.5,"gold",true));
        if(a.conOk){o.push(S.ARR(X(t1),yc-2,X(t2),ys+3,"ink",1.5,6));
          if(a.dup)o.push(S.T(X(t2),ys-8,"重複: 同じ ACK","middle",9,"gold",true));
          if(a.ackOk)o.push(S.ARR(X(t2),ys+3,X(t3),yc-3,"green",1.5,6));
          else{var fx=X(t2)+(X(t3)-X(t2))*0.55,fy=ys+(yc-ys)*0.55;o.push(S.L(X(t2),ys+3,fx,fy,"alias",1.5,"4 3"));o.push(S.X(fx,fy,4,"alias",2));}}
        else{var gx=X(t1)+(X(t2)-X(t1))*0.55,gy=yc-(yc-ys)*0.55;o.push(S.L(X(t1),yc-2,gx,gy,"alias",1.5,"4 3"));o.push(S.X(gx,gy,4,"alias",2));}
      });
      var lx=function(x){return Math.max(x0+70,Math.min(x,x1-70));};
      if(e.ok){o.push(S.D(X(e.t),yc,"green",5));o.push(S.T(lx(X(e.t)),yc+30,"ACK が届いた（"+F.time(e.t)+"）","middle",10,"green",true));}
      else{o.push(S.X(X(e.tg),yc,6,"alias",2.4));o.push(S.T(lx(X(e.tg)),yc+30,"諦める（"+F.time(e.tg)+"）","middle",10,"alias",true));}
      var ya=yc+44;o.push(S.L(x0,ya,x1,ya,"muted",1));
      U.nice(0,tmax,6).forEach(function(t){o.push(S.L(X(t),ya,X(t),ya+4,"muted",1));o.push(S.T(X(t),ya+15,F.time(t,2),"middle",9,"muted"));});
      o.push(S.T(x0,18,"1 回の交換（この乱数では最初の待ち時間が "+F.time(e.T0,3)+"。番号は何回目の送信か）","start",10,"ink",true));
      box.set(S.svg(700,ya+24,o));
      /* たくさんの交換 */
      var N=20000,r=U.rng(seed*7919+3),cnt=[],fail=0,times=[],sent=0,dup=0;for(var k=0;k<=M+1;k++)cnt.push(0);
      for(var i=0;i<N;i++){var q=_w14_exchange(r,p,rtt,A,R,M,null);sent+=q.sent;dup+=q.dup;if(q.ok){cnt[q.k]++;times.push(q.t);}else fail++;}
      times.sort(function(a,b){return a-b;});
      var s=(1-p)*(1-p),pf=Math.pow(1-s,M+1);
      var o2=[],bx0=60,bw=Math.min(36,240/(M+2)),pk=U.plot(bx0,24,(M+2)*(bw+6),150,[0,M+2],[0,1]);
      o2.push(S.T(bx0,14,"何回目の送信で ACK が届いたか（点は式の値）","start",10,"ink",true));
      for(var m2=0;m2<=M+1;m2++){var frac=m2<=M?cnt[m2+1]/N:fail/N,th=m2<=M?Math.pow(1-s,m2)*s:pf,xx=bx0+m2*(bw+6),hh=150*frac,c=m2<=M?"green":"alias";
        o2.push(S.RECT(xx,24+150-hh,bw,Math.max(hh,0.5),2,U.soft(c),c,1.1));
        o2.push(S.D(xx+bw/2,24+150-150*th,"ink",3));
        o2.push(S.T(xx+bw/2,24+150+14,m2<=M?String(m2+1):"失敗","middle",9.5,c,true));}
      o2.push(S.L(bx0,174,bx0+(M+2)*(bw+6),174,"muted",1));
      o2.push(S.T(bx0-6,28,"100 %","end",9,"muted"));o2.push(S.T(bx0-6,178,"0","end",9,"muted"));
      /* 完了までの時間のヒストグラム */
      var hx0=380,hw=300,nb=40,tm=Math.max(wait,1),bins=[];for(var b=0;b<nb;b++)bins.push(0);
      times.forEach(function(t){bins[Math.min(nb-1,Math.floor(t/tm*nb))]++;});
      var bmax=Math.max.apply(null,bins.concat([fail,1]));
      o2.push(S.T(hx0,14,"ACK が届くまでの時間の分布（縦は対数）","start",10,"ink",true));
      var Y=function(c){return c<=0?174:174-150*Math.log10(1+c)/Math.log10(1+bmax);};
      bins.forEach(function(c,b){if(c>0)o2.push(S.RECT(hx0+b*hw/nb,Y(c),hw/nb-1,174-Y(c),1,U.soft("green"),"green",0.8));});
      o2.push(S.L(hx0,174,hx0+hw,174,"muted",1));
      U.nice(0,tm,5).forEach(function(t){var xx=hx0+hw*t/tm;o2.push(S.L(xx,174,xx,178,"muted",1));o2.push(S.T(xx,189,F.time(t,2),"middle",9,"muted"));});
      var xs=hx0+hw*span/tm;o2.push(S.L(xs,20,xs,174,"gold",1.2,"4 3"));o2.push(S.T(xs-4,34,"最後の再送 "+F.time(span,3),"end",9,"gold"));
      box2.set(S.svg(700,198,o2));
      var pct=function(a){return times.length?F.time(times[Math.min(times.length-1,Math.floor(a*times.length))],3):"—";};
      ro.innerHTML="最初の待ち時間 T<sub>0</sub> = "+A+"〜"+U.sig(A*R,3)+" s の乱数 ・ 最後の再送は "+U.sig(span,3)+" s 以内（MAX_TRANSMIT_SPAN） ・ 諦めるのは "+U.sig(wait,3)+" s 以内（MAX_TRANSMIT_WAIT）<br>"+
        "1 回の送信で ACK まで届く確率 s = (1 − p)² = <b>"+U.sig(s,3)+"</b> ・ "+N.toLocaleString("en-US")+" 回の交換のうち失敗 <b>"+F.pct(fail/N,3)+"</b>（式 (1 − s)<sup>"+(M+1)+"</sup> = "+F.pct(pf,3)+"）<br>"+
        "1 回の交換で送った CON の平均 <b>"+U.sig(sent/N,3)+"</b> 回 ・ サーバに届いた重複の平均 "+U.sig(dup/N,3)+" 個 ・ 成功したときの時間: 中央 "+pct(0.5)+"、95 % "+pct(0.95)+
        '<div class="wnote">重複は、CON は届いたが ACK が失われたときに起きる。サーバはメッセージ ID で重複に気づき、要求を処理し直さずに同じ ACK を返す。式の値は、往復時間が待ち時間より短いときのもの。</div>';
    }
    draw();
  };

  /* ---- 6 節: 3 つのプロトコルの比較 ---- */
  function _w14_wire(ip){return Math.max(ip,46)+38;}          /* IPv4 のパケットの長さ → Ethernet の線の上のバイト（07 章 5 節） */
  function _w14_B(v){return Math.round(v).toLocaleString("en-US")+" バイト";}
  function _w14_coapOpts(name){var n=0;name.split("/").forEach(function(sg){if(!sg.length)return;var L=sg.length;n+=1+(L>=269?2:L>=13?1:0)+L;});return n;}

  REG.w14_cmp=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"COMPARE","1 回の報告と 1 日に送るバイト — HTTP・MQTT・CoAP");
    var row=U.ctrls(el);
    var dz=U.slider(row,"データの大きさ",{min:1,max:1000,value:20,log:true,int:true,fmt:function(v){return v+" バイト";},onInput:draw});
    var nm=U.textin(row,"名前（パス・トピック）","dev/1/temp",draw);
    var row2=U.ctrls(el);
    var iv=U.slider(row2,"報告の間隔",{values:[10,30,60,300,600,1800,3600],value:600,fmt:function(v){return F.time(v);},onInput:draw});
    var dl=U.select(row2,"下りの命令",["待たない","待つ"],1,draw);
    var row3=U.ctrls(el);
    var tk=U.slider(row3,"キープアライブ・問い合わせの間隔 Tk",{values:[10,30,60,120,300,600],value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var hc=U.select(row3,"HTTP のコネクション",["報告や問い合わせのたびに張って閉じる","張ったまま使い続ける"],1,draw);
    var box=U.svgbox(el),box2=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var n=dz.get(),name=nm.get().replace(/^\/+/,"").slice(0,200)||"x",I=iv.get(),Tk=tk.get(),down=dl.get()===1,reconn=hc.get()===0;
      var ACK=84,CONN=7*84,D=86400,Rn=D/I;
      var httpH=(6+name.length+11)+19+(16+String(n).length+2)+2,rsp204=64,poll=46;
      var rl=function(x){return x<128?1:x<16384?2:x<2097152?3:4;};
      var mq0=1+rl(2+name.length+n)+2+name.length+n,mq1=1+rl(4+name.length+n)+4+name.length+n;
      var co=4+1+_w14_coapOpts(name)+2+(n>0?1+n:0);
      /* 1 回の報告: [名前, アプリ層のヘッダ, データ, 下の層, 応答と確認応答のフレーム, フレームの数] */
      var V=[["HTTP",httpH,n,_w14_wire(40+httpH+n)-httpH-n,[_w14_wire(40+rsp204),ACK],"HTTP"],
             ["MQTT QoS 0",mq0-n,n,_w14_wire(40+mq0)-mq0,[ACK],"MQTT"],
             ["MQTT QoS 1",mq1-n,n,_w14_wire(40+mq1)-mq1,[ACK,ACK],"MQTT"],
             ["CoAP NON",co-n,n,_w14_wire(28+co)-co,[],"CoAP"],
             ["CoAP CON",co-n,n,_w14_wire(28+co)-co,[ACK],"CoAP"]];
      var per=V.map(function(v){return v[1]+v[2]+v[3]+v[4].reduce(function(a,b){return a+b;},0);});
      var pmax=Math.max.apply(null,per),o=[],x0=120,sc=520/pmax;
      o.push(S.T(x0,14,"1 回の報告で線の上に出るバイト（IPv4・Ethernet。07 章 5 節の数え方）","start",10,"muted"));
      V.forEach(function(v,i){var y=24+i*34,x=x0;o.push(S.T(x0-8,y+15,v[0],"end",10.5,"ink",true));
        [[v[1],"purple"],[v[2],"ink"],[v[3],"muted"]].forEach(function(q){o.push(S.RECT(x,y,q[0]*sc,20,2,q[1]==="ink"?"panel":U.soft(q[1]),q[1],1));x+=q[0]*sc;});
        v[4].forEach(function(f){o.push(S.RECT(x,y,f*sc,20,2,U.soft("green"),"green",1));x+=f*sc;});
        o.push(S.T(x+6,y+15,String(per[i]),"start",10,"ink",true));});
      var yl=24+5*34+8,lx=x0;
      [["purple","アプリケーション層のヘッダ"],["ink","データ"],["muted","下の層のヘッダと線の上の分"],["green","応答・確認応答"]].forEach(function(q){
        o.push(S.RECT(lx,yl-9,10,10,2,q[0]==="ink"?"panel":U.soft(q[0]),q[0],1.1));o.push(S.T(lx+15,yl,q[1],"start",9.5,"muted"));lx+=25+U.tw(q[1],9.5)+8;});
      box.set(S.svg(700,yl+10,o));
      /* 1 日 */
      var pingsPerInt=I>Tk?Math.ceil(I/Tk-1e-9)-1:0,pings=Rn*pingsPerInt,polls=down?D/Tk:0;
      var pollB=_w14_wire(40+poll)+_w14_wire(40+rsp204)+ACK;
      var rowsD=V.map(function(v,i){var rep=Rn*per[i],con=0,ka=0,fr=Rn*(1+v[4].length),dly;
        if(v[5]==="HTTP"){if(reconn){con=Rn*CONN;fr+=Rn*7;}if(down){ka=polls*pollB+(reconn?polls*CONN:0);fr+=polls*(3+(reconn?7:0));dly=F.time(Tk);}else dly="届けられない";}
        else if(v[5]==="MQTT"){ka=pings*3*ACK;fr+=pings*3;dly="すぐ（RTT 程度）";}
        else{if(down){ka=pings*2*ACK;fr+=pings*2;dly="すぐ（行が保たれていれば）";}else dly="届けられない";}
        return {name:v[0],rep:rep,con:con,ka:ka,tot:rep+con+ka,fr:fr,dly:dly};});
      var dmax=Math.max.apply(null,rowsD.map(function(r){return r.tot;})),o2=[],sc2=470/dmax;
      o2.push(S.T(x0,14,"1 日に線の上に出るバイト（報告 "+U.fmt.int(Rn)+" 回、問い合わせ・キープアライブの間隔 "+F.time(Tk)+"）","start",10,"muted"));
      rowsD.forEach(function(r,i){var y=24+i*30,x=x0;o2.push(S.T(x0-8,y+14,r.name,"end",10.5,"ink",true));
        [[r.rep,"purple"],[r.con,"gold"],[r.ka,"teal"]].forEach(function(q){if(q[0]>0){o2.push(S.RECT(x,y,q[0]*sc2,18,2,U.soft(q[1]),q[1],1));x+=q[0]*sc2;}});
        o2.push(S.T(x+6,y+14,_w14_B(r.tot),"start",10,"ink",true));});
      var yl2=24+5*30+8;lx=x0;
      [["purple","報告"],["gold","コネクションを張る・閉じる"],["teal","問い合わせ・キープアライブ"]].forEach(function(q){
        o2.push(S.RECT(lx,yl2-9,10,10,2,U.soft(q[0]),q[0],1.1));o2.push(S.T(lx+15,yl2,q[1],"start",9.5,"muted"));lx+=25+U.tw(q[1],9.5)+8;});
      box2.set(S.svg(700,yl2+10,o2));
      ro.innerHTML="アプリケーション層のヘッダ: HTTP "+httpH+" バイト（POST の要求行・Host・Content-Length と空行）、MQTT "+(mq0-n)+"〜"+(mq1-n)+" バイト、CoAP "+(co-n)+" バイト（トークン 1 バイト・Uri-Path・Content-Format）"+
        U.tbl(["方式","1 回の報告","1 日の合計","1 日のフレームの数","下りの命令の最大の遅れ"],
          rowsD.map(function(r,i){return [r.name,_w14_B(per[i]),"<b>"+_w14_B(r.tot)+"</b>",U.fmt.int(r.fr),r.dly];}),
          ["left","right","right","right","left"])+
        '<div class="wnote">仮定: 応答や確認応答だけのセグメント・データグラムは、詰め物をして 1 つ 84 バイト分。HTTP の応答は Date の欄だけの 204（64 バイト）、命令の問い合わせは GET /dev/1/cmd（46 バイト）で、その応答も 204 とした。'+
        'コネクションを張る・閉じるのは小さなセグメント 7 つ（10 章）。MQTT はコネクションを保ち、報告の無い Tk ごとにキープアライブの往復（MQTT の 2 バイトのパケットを運ぶセグメント 2 つと、TCP の ACK）を送る。CoAP で下りを待つときは、Tk ごとに空の CON を送り、RST が返る（変換表の行を保つ）。'+
        'TLS・DTLS は含めていない（使うと、1 レコードごとの増加と、コネクションを張るたびのハンドシェイク（楕円曲線の証明書でも 1.6 KB ほど。12 章 3 節）が加わる）。</div>';
    }
    draw();
  };
