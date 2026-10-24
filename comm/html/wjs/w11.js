  /* ===== 11 章 ソケットと組み込みの TCP/IP スタック ===== */
  var _w11_COL=["signal","purple","gold","teal"];

  /* (1) TCP のバイトの列とメッセージの境目 */
  REG.w11_stream=function(el,U){
    var S=U.S;
    U.head(el,"STREAM","TCP のバイトの列と、メッセージの境目");
    var row=U.ctrls(el);
    var nmsg=U.slider(row,"メッセージの数",{values:[2,3,4,5,6,7,8],value:4,fmt:function(v){return v+" 個";},onInput:draw});
    var lmax=U.slider(row,"本体の長さ（最大）",{values:[2,4,8,12,16,24],value:12,fmt:function(v){return v+" バイト";},onInput:draw});
    var row2=U.ctrls(el);
    var mode=U.select(row2,"recv への届き方",["送った単位どおり（たまたま合う）","ランダムな位置で分かれる","受け手が遅れ、たまった分をまとめて読む","1 バイトずつ"],1,draw);
    var cap=U.slider(row2,"recv に渡す配列の大きさ",{values:[4,8,16,32,64,128],value:32,fmt:function(v){return v+" バイト";},onInput:draw});
    var br=U.btnrow(el),seed=11;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el,{scroll:true}),ro=U.readout(el);
    var AL="ABCDEFGHJKLMNPRSTUVWXYZ0123456789=.,";
    function txt(bs){return bs.map(function(b){return String.fromCharCode(b);}).join("");}
    function hex2(b){return U.fmt.hex(b,2);}
    function draw(){
      var r=U.rng(seed),N=nmsg.get(),LM=lmax.get(),C=cap.get(),m=mode.get();
      var msgs=[],bytes=[],own=[],hdr=[],start=[];
      for(var i=0;i<N;i++){
        var L=1+r.int(LM),body=[];
        for(var k=0;k<L;k++)body.push(AL.charCodeAt(r.int(AL.length)));
        msgs.push(body);start.push(bytes.length);
        bytes.push(L>>8,L&255);own.push(i,i);hdr.push(1,1);
        for(var k2=0;k2<L;k2++){bytes.push(body[k2]);own.push(i);hdr.push(0);}
      }
      var total=bytes.length,chunks=[],pos=0;
      if(m===0){for(var a=0;a<N;a++){var e=a+1<N?start[a+1]:total,p=start[a];while(p<e){var c=Math.min(C,e-p);chunks.push([p,p+c]);p+=c;}}}
      else if(m===1){while(pos<total){var c1=Math.min(total-pos,1+r.int(C));chunks.push([pos,pos+c1]);pos+=c1;}}
      else if(m===2){while(pos<total){var c2=Math.min(total-pos,C);chunks.push([pos,pos+c2]);pos+=c2;}}
      else{for(var q=0;q<total;q++)chunks.push([q,q+1]);}
      /* 「1 回の recv = 1 つのメッセージ」と読む */
      var naiveOk={},naiveRows=[];
      chunks.forEach(function(ch){
        var n=ch[1]-ch[0],s;
        if(n<2){s='<span class="warn">長さを読めない（×）</span>';}
        else{var L=bytes[ch[0]]<<8|bytes[ch[0]+1];
          if(n<2+L)s='<span class="warn">長さを '+L+' と読むが、足りない（×）</span>';
          else{var idx=start.indexOf(ch[0]),good=idx>=0&&msgs[idx].length===L;
            if(good)naiveOk[idx]=1;
            s=(good?'<span class="ok">'+String.fromCharCode(65+idx)+' を読む（○）</span>':'<span class="warn">長さ '+L+' の「'+U.esc(txt(bytes.slice(ch[0]+2,ch[0]+2+L)))+'」と読む（×）</span>')+
              (n>2+L?' <span class="warn">残り '+(n-2-L)+' バイトを捨てる</span>':'');}}
        naiveRows.push(s);
      });
      /* 長さで切り出す */
      var acc=0,got=0,goodRows=[];
      chunks.forEach(function(ch){
        acc=ch[1];var done=[];
        while(got<N&&acc>=start[got]+2+msgs[got].length){done.push(String.fromCharCode(65+got));got++;}
        var rest=acc-(got<N?start[got]:total);
        goodRows.push(done.length?'<span class="ok">'+done.join("・")+' がそろう</span>'+(rest>0?'（'+rest+' バイトを残す）':''):'足りないので待つ（'+rest+' バイトを残す）');
      });
      /* 図: バイトのます目と recv の区切り */
      var W=700,unit=18,x0=16,per=Math.floor((W-2*x0)/unit),rows=Math.ceil(total/per),rh=50,o=[];
      function cx(b){return x0+(b%per)*unit;} function cy(b){return 28+Math.floor(b/per)*rh;}
      for(var i2=0;i2<N;i2++){var b0=start[i2];o.push(S.T(cx(b0)+2,cy(b0)-5,String.fromCharCode(65+i2),"start",10,_w11_COL[i2%4],true));}
      for(var b=0;b<total;b++){
        var col=_w11_COL[own[b]%4],x=cx(b),y=cy(b);
        o.push(S.RECT(x,y,unit,20,2,hdr[b]?"panel":U.soft(col),col,hdr[b]?1.6:1.1));
        o.push(S.T(x+unit/2,y+14,hdr[b]?hex2(bytes[b]):String.fromCharCode(bytes[b]),"middle",hdr[b]?7.5:9.5,hdr[b]?col:"ink",!!hdr[b],true));
      }
      chunks.forEach(function(ch,j){
        for(var s=ch[0];s<ch[1];){var e2=Math.min(ch[1],(Math.floor(s/per)+1)*per),xa=cx(s)+2,xb=cx(e2-1)+unit-2,yb=cy(s)+25;
          o.push(S.W([xa,yb,xa,yb+5,xb,yb+5,xb,yb],"ink",1.3));
          if(xb-xa>=14&&s===ch[0])o.push(S.T((xa+xb)/2,yb+16,String(j+1),"middle",9,"ink",true));
          s=e2;}
      });
      box.set(S.svg(W,28+rows*rh,o));
      var nOk=Object.keys(naiveOk).length,lim=12,trs=[];
      for(var j=0;j<Math.min(lim,chunks.length);j++)trs.push([String(j+1),String(chunks[j][1]-chunks[j][0]),naiveRows[j],goodRows[j]]);
      var more=chunks.length>lim?'<div class="wnote">（表は最初の '+lim+' 回だけ。recv は全部で '+chunks.length+' 回）</div>':'';
      ro.innerHTML="メッセージ "+N+" 個、合わせて "+total+" バイト（長さ 2 バイト + 本体）を、recv "+chunks.length+" 回で受け取った<br>"+
        "正しく読めたメッセージ: 「1 回の recv = 1 つ」と読むと <b>"+nOk+" / "+N+"</b>"+(nOk<N?' <span class="warn">誤り</span>':'')+
        " ・ 長さで切り出すと <b>"+got+" / "+N+"</b> <span class=\"ok\">すべて</span>"+
        U.tbl(["recv","バイト数","「1 回 = 1 つ」と読むと","長さで切り出すと"],trs,["center","right","left","left"])+more;
    }
    draw();
  };

  /* (2) 送信バッファと send の戻り値 */
  REG.w11_sendbuf=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"SEND","送信バッファの量と、send の戻り値");
    var row=U.ctrls(el);
    var sb=U.slider(row,"送信バッファの大きさ",{values:[1024,2048,4096,8192,16384,32768],value:4096,fmt:function(v){return v+" バイト";},onInput:draw});
    var rate=U.slider(row,"スタックが送り出せる速さ",{min:1000,max:1000000,log:true,int:true,value:20000,fmt:function(v){return U.sig(v,3)+" B/s";},onInput:draw});
    var row2=U.ctrls(el);
    var msz=U.slider(row2,"1 回に書く量",{values:[256,512,1024,2048,4096,8192,16384],value:8192,fmt:function(v){return v+" バイト";},onInput:draw});
    var per=U.slider(row2,"書く間隔",{values:[10,20,50,100,200,500],value:500,fmt:function(v){return v+" ms";},onInput:draw});
    var row3=U.ctrls(el);
    var mode=U.seg(row3,["ブロッキング（send_all）","ノンブロッキング + select","戻り値を見ない（悪い例）"],0,draw);
    var box=U.svgbox(el),ro=U.readout(el);
    U.note(el,"送り出せる速さは、ウィンドウ ÷ RTT（10 章 3 節）や回線の速さで決まる。select が「書ける」を返すのは、空きが送信バッファの半分以上になったときか、残りが全部入るときとした（実際のしきい値はスタックによって違う）。2 秒間を 1 ms ずつ計算する。");
    function draw(){
      var Sz=sb.get(),v=rate.get()/1000,M=msz.get(),P=per.get(),md=mode.get(),T=2000;
      var L=0,q=[],lev=[],ev=[],blkMs=[],offered=0,acc=0,lost=0,calls=0,part=0,eag=0,maxDelay=0,sent=0;
      for(var t=0;t<T;t++){
        var d=Math.min(L,v);L-=d;sent+=d;
        if(t%P===0){offered+=M;
          if(md===2){calls++;var fr=Math.floor(Sz-L),a=Math.min(fr,M);
            if(a<=0){eag++;lost+=M;ev.push([t,2]);}
            else{L+=a;acc+=a;if(a<M){part++;lost+=M-a;ev.push([t,1]);}else ev.push([t,0]);}}
          else q.push([M,t,M]);}
        if(md!==2&&q.length){
          var free=Math.floor(Sz-L),rem=q[0][0];
          if(md===0){var c=Math.min(free,rem);if(c>0){L+=c;acc+=c;q[0][0]-=c;}
            if(q[0][0]===0){maxDelay=Math.max(maxDelay,t-q[0][1]);ev.push([t,t>q[0][1]?1:0]);q.shift();}
            if(q.length)blkMs.push(t);}
          else if(free>=Math.min(Sz/2,rem)){var c2=Math.min(free,rem);calls++;L+=c2;acc+=c2;q[0][0]-=c2;
            if(c2<rem){part++;ev.push([t,1]);}else ev.push([t,0]);
            if(q[0][0]===0){maxDelay=Math.max(maxDelay,t-q[0][1]);q.shift();}}
        }
        lev.push(L);
      }
      var qb=q.reduce(function(s,x){return s+x[0];},0);
      if(md===0)calls=ev.length;
      var W=700,x0=70,pw=600,y0=40,ph=150,o=[];
      var p=U.plot(x0,y0,pw,ph,[0,T],[0,Sz*1.08]);
      o.push(p.axes({xl:"時間 [ms]",yl:"送信バッファの中の量",xt:[0,500,1000,1500,2000],yt:[0,Sz/2,Sz],yfmt:function(y){return U.sig(y,3);},ylOff:58}));
      var pts=[[p.X(0),p.Y(0)]];for(var t2=0;t2<T;t2+=4)pts.push([p.X(t2),p.Y(lev[t2])]);pts.push([p.X(T-1),p.Y(lev[T-1])],[p.X(T-1),p.Y(0)]);
      o.push(S.PL(pts,"green",1.4,U.soft("green")));
      o.push(S.L(p.X(0),p.Y(Sz),p.X(T),p.Y(Sz),"alias",1.2,"5 4"));
      o.push(S.T(p.X(T)-4,p.Y(Sz)-5,"送信バッファの大きさ","end",9.5,"alias"));
      if(md===1){o.push(S.L(p.X(0),p.Y(Sz/2),p.X(T),p.Y(Sz/2),"faint",1,"3 3"));}
      /* 書いた時刻 */
      for(var t3=0;t3<T;t3+=P)o.push(S.PL([[p.X(t3)-3,y0-14],[p.X(t3)+3,y0-14],[p.X(t3),y0-8]],"purple",1,"purple"));
      o.push(S.T(x0-6,y0-8,"書く","end",9,"purple"));
      /* send の結果 */
      var yr=y0+ph+44;
      o.push(S.T(x0-6,yr+4,md===0?"send_all":"send","end",9,"muted",false,true));
      ev.forEach(function(e){var c=e[1]===0?"green":e[1]===1?"gold":"alias";o.push(S.L(p.X(e[0]),yr-6,p.X(e[0]),yr+6,c,md===1?1:2));});
      if(md===0){var iv=[];
        blkMs.forEach(function(t4){if(iv.length&&iv[iv.length-1][1]===t4-1)iv[iv.length-1][1]=t4;else iv.push([t4,t4]);});
        iv.forEach(function(a){o.push(S.RECT(p.X(a[0]),yr+12,Math.max(1,p.X(a[1]+1)-p.X(a[0])),8,1,U.soft("alias"),"alias",0.8));});
        o.push(S.T(x0-6,yr+20,"止まる","end",9,"alias"));}
      var lg=md===0?[["green","待たずに入った"],["gold","空くまで待って入った"]]:md===1?[["green","残りが全部入った"],["gold","部分送信（残りは次に）"]]:[["green","全部入った"],["gold","部分送信（残りを失う）"],["alias","EAGAIN（全部を失う）"]];
      var lx=x0;lg.forEach(function(g){o.push(S.RECT(lx,yr+30,10,10,2,U.soft(g[0]),g[0],1.2));o.push(S.T(lx+14,yr+39,g[1],"start",9.5,"muted"));lx+=24+U.tw(g[1],9.5);});
      if(md===0){o.push(S.RECT(lx,yr+30,10,10,2,U.soft("alias"),"alias",1.2));o.push(S.T(lx+14,yr+39,"タスクが send_all の中で止まっている間","start",9.5,"muted"));}
      box.set(S.svg(W,yr+48,o));
      var blk=blkMs.length,inRate=M/P*1000,over=inRate>rate.get();
      var h="書いた量 "+F.int(offered)+" バイト（"+U.sig(inRate,3)+" B/s） ・ 送信バッファが受け付けた量 "+F.int(acc)+" バイト ・ 送り出した量 "+F.int(Math.round(sent))+" バイト<br>";
      if(md===0)h+="send_all の回数 "+calls+" ・ タスクが止まっていた時間 <b>"+blk+" ms</b>（2 秒のうち "+Math.round(blk/T*100)+" %） ・ 書いてから入り終わるまでの最大の遅れ "+maxDelay+" ms";
      else if(md===1)h+="send を呼んだ回数 "+calls+"（うち部分送信 <b>"+part+"</b> 回） ・ タスクは止まらない ・ 書いてから入り終わるまでの最大の遅れ "+maxDelay+" ms";
      else h+="send を呼んだ回数 "+calls+" ・ 部分送信 "+part+" 回 ・ EAGAIN "+eag+" 回 ・ <b>失われた量 "+F.int(lost)+" バイト</b>"+(lost>0?' <span class="warn">受け手のバイトの列は途中が抜け、区切りを誤る</span>':' <span class="ok">いまは失われていない（空きが足りれば誤りに気づかない）</span>');
      if(md!==2&&qb>0)h+="<br>2 秒の終わりにまだ送り待ちの量 "+F.int(qb)+" バイト";
      if(over)h+='<br><span class="warn">書く速さ '+U.sig(inRate,3)+' B/s が、送り出せる速さ '+U.sig(rate.get(),3)+' B/s を超えている。どの書き方でも、いずれは待つか捨てるしかない（04 章 5 節と同じ）。</span>';
      ro.innerHTML=h;
    }
    draw();
  };

  /* (3) lwIP の RAM の見積もりと速さの上限 */
  REG.w11_lwipram=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"LWIP RAM","lwIP の受信のプール・送信のヒープと、速さの上限");
    var row=U.ctrls(el);
    var mss=U.select(row,"TCP_MSS",[{v:"536",t:"536 バイト"},{v:"1460",t:"1460 バイト"}],"1460",draw);
    var wnd=U.slider(row,"TCP_WND",{values:[1,2,3,4,6,8,11],value:4,fmt:function(k){return k+" × TCP_MSS";},onInput:draw});
    var snd=U.slider(row,"TCP_SND_BUF",{values:[1,2,3,4,6,8],value:4,fmt:function(k){return k+" × TCP_MSS";},onInput:draw});
    var row2=U.ctrls(el);
    var ncon=U.slider(row2,"同時に受け取る接続の数",{values:[1,2,3,4,6,8],value:2,fmt:function(v){return v+" 個";},onInput:draw});
    var pool=U.slider(row2,"PBUF_POOL_SIZE",{values:[4,6,8,10,12,16,20,24,32,48,64],value:12,fmt:function(v){return v+" 個";},onInput:draw});
    var rtt=U.slider(row2,"RTT",{min:1,max:500,log:true,int:true,value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var box=U.svgbox(el),ro=U.readout(el);
    U.note(el,"32 ビットのマイコン・IPv4・Ethernet として、PBUF_POOL_BUFSIZE は TCP_MSS + 54 を 4 の倍数に切り上げた値、pbuf の構造体は 16 バイトとした。送信のヒープは送るデータの写しの分だけで、実際にはセグメントごとのヘッダの空きなどが加わる。PCB・タスクのスタック・ドライバの領域は含めていない。設定名は lwIP 2.x のもの。");
    function kb(b){return U.sig(b/1024,3)+" KB";}
    function bps(b){return F.int(b)+" B/s（"+F.rate(b*8)+"）";}
    function draw(){
      var M=+mss.get(),W=wnd.get()*M,SB=snd.get()*M,n=ncon.get(),P=pool.get(),R=rtt.get()/1000;
      var bs=Math.ceil((M+54)/4)*4,elt=bs+16,poolRAM=P*elt,per=Math.ceil(W/M),need=n*per,heap=n*SB;
      var rx=W/R,tx=SB/R,poolOk=P>=need,check1=W<=P*(bs-54),check2=SB>=2*M;
      var o=[],Wd=700;
      /* 左: RAM の積み上げ */
      var mx=Math.max(16384,poolRAM+heap)*1.1,x0=20,bw=250,X=function(b){return x0+bw*b/mx;};
      o.push(S.T(x0,18,"RAM（バッファの分）","start",11,"ink",true));
      o.push(S.RECT(X(0),34,X(poolRAM)-X(0),30,3,U.soft("green"),"green",1.2));
      o.push(S.RECT(X(poolRAM),34,X(poolRAM+heap)-X(poolRAM),30,3,U.soft("purple"),"purple",1.2));
      if(X(poolRAM)-X(0)>60)o.push(S.T((X(0)+X(poolRAM))/2,53,"プール","middle",9.5,"green",true));
      if(X(poolRAM+heap)-X(poolRAM)>50)o.push(S.T((X(poolRAM)+X(poolRAM+heap))/2,53,"ヒープ","middle",9.5,"purple",true));
      o.push(S.T(x0,84,"受信のプール "+kb(poolRAM),"start",10,"green",true));
      o.push(S.T(x0,100,"送信のヒープ "+kb(heap)+" 以上","start",10,"purple",true));
      o.push(S.T(x0,118,"合計 "+kb(poolRAM+heap)+" 以上","start",10.5,"ink",true));
      var pc=poolOk?"green":"alias";
      o.push(S.T(x0,140,"ウィンドウいっぱいに受け取るのに","start",9.5,pc));
      o.push(S.T(x0,154,"要る pbuf: "+n+" × "+per+" = "+need+" 個（プールは "+P+" 個）","start",9.5,pc,true));
      /* 右: 速さと RTT */
      var p=U.plot(370,24,300,140,[1,500],[1e3,1e7],{xlog:true,ylog:true});
      o.push(p.axes({xl:"RTT [ms]",yl:"速さの上限 [B/s]",xt:[1,10,100,500],yt:[1e3,1e4,1e5,1e6,1e7],xfmt:function(v){return String(v);},yfmt:function(v){return v>=1e6?(v/1e6)+"M":v>=1e3?(v/1e3)+"k":String(v);},ylOff:44}));
      function ln(Wb,c,dsh){var pts=[];for(var k=0;k<=40;k++){var rt=Math.pow(10,k/40*Math.log10(500));var y=Wb/(rt/1000);pts.push([rt,Math.max(1e3,Math.min(1e7,y))]);}o.push(p.line(pts,c,2,dsh?"6 4":null));}
      ln(W,"green");ln(SB,"purple",true);
      var xr=p.X(rtt.get());o.push(S.L(xr,24,xr,164,"faint",1,"3 3"));
      o.push(S.D(xr,p.Y(Math.max(1e3,Math.min(1e7,rx))),"green",4.5));o.push(S.D(xr,p.Y(Math.max(1e3,Math.min(1e7,tx))),"purple",4.5));
      o.push(S.L(370,214,392,214,"green",2));o.push(S.T(398,218,"受信 ≤ TCP_WND ÷ RTT","start",9.5,"muted"));
      o.push(S.L(530,214,552,214,"purple",2,"6 4"));o.push(S.T(558,218,"送信 ≤ TCP_SND_BUF ÷ RTT","start",9.5,"muted"));
      box.set(S.svg(Wd,228,o));
      var h="PBUF_POOL_BUFSIZE = "+M+" + 54 を 4 の倍数に = <b>"+bs+"</b> バイト ・ 受信のプール = "+P+" × ("+bs+" + 16) = <b>"+F.int(poolRAM)+" バイト</b>（"+kb(poolRAM)+"）<br>"+
        "送信のヒープ ≥ 接続の数 × TCP_SND_BUF = "+n+" × "+SB+" = <b>"+F.int(heap)+" バイト</b> ・ 1 つの接続の速さの上限（RTT "+rtt.get()+" ms）: 受信 "+bps(rx)+"、送信 "+bps(tx)+"<br>";
      h+=poolOk?'<span class="ok">プールは '+n+' 個の接続のウィンドウを持てる</span>':'<span class="warn">プールが足りない: '+(n>1?n+' 個の接続が同時に':'接続が')+'ウィンドウいっぱいに受け取ると pbuf が尽き、ドライバがフレームを捨てて、TCP の再送で遅くなる</span>';
      if(!check1)h+='<br><span class="warn">TCP_WND（'+W+'）が PBUF_POOL_SIZE × (PBUF_POOL_BUFSIZE − 54) = '+P*(bs-54)+' を超える: lwIP 2.x はコンパイルのときにエラーにする</span>';
      if(!check2)h+='<br><span class="warn">TCP_SND_BUF が 2 × TCP_MSS より小さい: lwIP 2.x はコンパイルのときにエラーにする</span>';
      ro.innerHTML=h;
    }
    draw();
  };
