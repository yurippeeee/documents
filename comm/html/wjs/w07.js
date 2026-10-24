  /* ===== 07 章 階層とカプセル化 ===== */
  /* MQTT の PUBLISH（QoS 0）のヘッダ: 固定ヘッダ 1 + 残りの長さ 1〜4 + トピック名の長さ 2 + トピック名 */
  function _w07_mqtt(n,topic){var rem=2+topic+n,rl=rem<128?1:rem<16384?2:rem<2097152?3:4;return 1+rl+2+topic;}
  /* HTTP の POST の最小限のヘッダ: "POST /data HTTP/1.1\r\n" 21 + "Host: example.com\r\n" 19 + "Content-Length: " 16 + 桁 + "\r\n" 2 + 空行 2 */
  function _w07_http(n){return 60+String(n).length;}
  function _w07_bytes(v){return Math.round(v).toLocaleString("en-US")+" バイト";}
  function _w07_num(U,v){return !isFinite(v)?"∞":v>=1e4?Math.round(v).toLocaleString("en-US"):U.sig(v,3);}
  /* 横に並んだ欄の中に文字が入るなら入れる */
  function _w07_lab(S,x,w,y,nm,b,c){var t1=nm+" "+b,t2=String(b);
    var sz=9.5,tw=function(s){var q=0;for(var i=0;i<s.length;i++)q+=s.charCodeAt(i)<128?sz*0.56:sz;return q;};
    if(w>=tw(t1)+4)return S.T(x+w/2,y,t1,"middle",sz,c,true);sz=9;if(w>=tw(t1)+3)return S.T(x+w/2,y,t1,"middle",sz,c,true);
    sz=9.5;if(w>=tw(t2)+3)return S.T(x+w/2,y,t2,"middle",sz,c,true);return "";}

  REG.w07_encap=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ENCAP","1 つのメッセージを送るとき、各層が足すバイト");
    var row=U.ctrls(el);
    var nS=U.slider(row,"データの大きさ n",{min:1,max:1000,value:20,log:true,step:0.0001,snap:function(v){return Math.max(1,Math.round(v));},fmt:function(v){return v+" バイト";},onInput:draw});
    var app=U.select(row,"アプリケーション層",["なし（データだけ）","MQTT（トピック名 10 バイト）","HTTP の POST（最小限のヘッダ）"],1,draw);
    var tls=U.checkbox(row,"TLS 1.3 で暗号化する（12 章）",false,draw);
    var row2=U.ctrls(el);
    var tr=U.select(row2,"トランスポート層",["TCP","UDP"],0,draw);
    var nw=U.select(row2,"ネットワーク層",["IPv4","IPv6"],0,draw);
    var lk=U.select(row2,"リンク層",["Ethernet","Wi-Fi（WPA2 で暗号化）"],0,draw);
    var rt=U.select(row2,"Ethernet の速さ",["10 Mbps","100 Mbps"],1,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例に戻す",function(){nS.set(20);app.set(1);tls.set(false);tr.set(0);nw.set(0);lk.set(0);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var n=nS.get(),a=app.get(),useTLS=tls.get(),t=tr.get(),v6=nw.get()===1,wifi=lk.get()===1,rate=rt.get()===0?10e6:100e6;
      rt.input.disabled=wifi;
      var notes=[];
      if(a>0&&t===1){t=0;notes.push("MQTT と HTTP は TCP の上で動くので、TCP で計算した。");}
      if(useTLS&&t===1){useTLS=false;notes.push("UDP の上では TLS ではなく DTLS を使う（14 章）。ここでは TLS を外して計算した。");}
      var appH=a===1?_w07_mqtt(n,10):a===2?_w07_http(n):0, appN=a===1?"MQTT":a===2?"HTTP":"";
      var trH=t===0?20:8, trN=t===0?"TCP":"UDP", ipH=v6?40:20, ipN=v6?"IPv6":"IPv4";
      var ipLen=ipH+trH+(useTLS?22:0)+appH+n;
      var pad=wifi?0:Math.max(0,46-ipLen);
      /* 一番下の行の並び（外側から内側へ、データ、内側から外側へ）。lv はその欄が属する層 */
      var P=[];
      if(!wifi)P.push({nm:"前",b:8,c:"muted",lv:6});
      P.push(wifi?{nm:"Wi-Fi",b:42,c:"signal",lv:5}:{nm:"Ethernet",b:14,c:"signal",lv:5});
      P.push({nm:ipN,b:ipH,c:"gold",lv:4});
      P.push({nm:trN,b:trH,c:"green",lv:3});
      if(useTLS)P.push({nm:"TLS",b:5,c:"teal",lv:2});
      if(appH)P.push({nm:appN,b:appH,c:"purple",lv:1});
      P.push({nm:"データ",b:n,c:"ink",lv:0});
      if(useTLS)P.push({nm:"TLS",b:17,c:"teal",lv:2});
      if(pad)P.push({nm:"詰め物",b:pad,c:"muted",lv:5});
      P.push(wifi?{nm:"MIC・FCS",b:12,c:"signal",lv:5}:{nm:"FCS",b:4,c:"signal",lv:5});
      if(!wifi)P.push({nm:"空き",b:12,c:"muted",lv:6});
      var total=0;P.forEach(function(p){total+=p.b;});
      var X0=120,BW=500,s=BW/total,x=X0;P.forEach(function(p){p.x=x;p.w=p.b*s;x+=p.w;});
      var levels=[0];if(appH)levels.push(1);if(useTLS)levels.push(2);levels.push(3,4,5);if(!wifi)levels.push(6);
      var names={0:"データ",1:appN+" のメッセージ",2:"TLS のレコード",3:t===0?"TCP のセグメント":"UDP のデータグラム",4:"IP パケット",5:wifi?"Wi-Fi のフレーム":"Ethernet フレーム",6:"線の上"};
      var o=[],rh=26,gap=10,y0=8;
      levels.forEach(function(L,i){
        var y=y0+i*(rh+gap),inc=P.filter(function(p){return p.lv<=L;}),tot=0;
        inc.forEach(function(p){tot+=p.b;
          var fill=p.c==="ink"?"panel":(p.c==="muted"?"screen":U.soft(p.c));
          o.push(S.RECT(p.x,y,Math.max(p.w,0.6),rh,3,fill,p.c,1.1,p.c==="muted"?"3 2":null));
          o.push(_w07_lab(S,p.x,p.w,y+rh/2+3.6,p.nm,p.b,p.c==="muted"?"ink":p.c));});
        var xl=inc[0].x,xr=inc[inc.length-1].x+inc[inc.length-1].w;
        o.push(S.T(xl-8,y+rh/2+4,names[L],"end",10.5,"ink",true));
        o.push(S.T(xr+8,y+rh/2+4,tot+(L===6?" バイト分":" バイト"),"start",10,"ink"));
      });
      box.set(S.svg(700,y0+levels.length*(rh+gap)+4,o));
      var N=total,H=N-n,eta=n/N;
      var parts=[];
      if(appH)parts.push(appN+" "+appH);
      if(useTLS)parts.push("TLS 22");
      parts.push(trN+" "+trH,ipN+" "+ipH);
      parts.push(wifi?"Wi-Fi 54":"Ethernet 18");
      if(pad)parts.push("詰め物 "+pad);
      if(!wifi)parts.push("線の上 20");
      var h=(wifi?"フレームのバイト数":"線の上のバイト数")+" N = データ "+n+" + オーバーヘッド H（"+parts.join(" + ")+" = "+H+"） = <b>"+N+" バイト"+(wifi?"":"分")+"</b><br>"+
        "効率 η = n / N = "+n+" / "+N+" = <b>"+U.fmt.pct(eta,3)+"</b>"+(eta<0.5?' <span class="warn">データより、各層が足すバイトのほうが多い</span>':'')+"<br>";
      if(!wifi)h+="線の上の時間 = "+N+" × 8 ÷ "+(rate/1e6)+" Mbps = <b>"+F.time(N*8/rate)+"</b>"+(pad?" ・ IP パケットが "+ipLen+" バイトで 46 バイトに満たないので、詰め物が "+pad+" バイト入った":"");
      else h+="Wi-Fi の 54 バイトの内訳: ヘッダ 26・暗号化のヘッダ 8・LLC/SNAP 8・暗号化の検査値（MIC）8・FCS 4。電波の上の前置きの信号や ACK の時間は含まない（09 章）";
      if(notes.length)h+='<br><span class="warn">'+notes.join(" ")+"</span>";
      ro.innerHTML=h;
    }
    draw();
  };

  /* 大きなデータを TCP で送るときの線の上のバイト数（Ethernet。セグメントごとに IP・TCP のヘッダ、Ethernet の 18 と線の上の 20） */
  function _w07_tcpWire(n,mss,ipH){var k=Math.ceil(n/mss),last=n-(k-1)*mss;
    return {k:k,last:last,N:(k-1)*(mss+ipH+20+38)+Math.max(46,ipH+20+last)+38};}

  REG.w07_mss=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"MSS","大きなデータを MSS ごとのセグメントに分けて送る");
    var row=U.ctrls(el);
    var nS=U.slider(row,"送るデータの量 n",{min:1,max:1e6,value:10000,log:true,step:0.0001,snap:function(v){return Math.max(1,Math.round(v));},fmt:_w07_bytes,onInput:draw});
    var mt=U.select(row,"MTU",[{v:"1500",t:"1500（Ethernet）"},{v:"1492",t:"1492（PPPoE の回線）"},{v:"1280",t:"1280（IPv6 の最小）"},{v:"576",t:"576"}],"1500",draw);
    var nw=U.select(row,"ネットワーク層",["IPv4","IPv6"],0,draw);
    var rt=U.select(row,"Ethernet の速さ",["10 Mbps","100 Mbps"],1,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var n=nS.get(),mtu=parseInt(mt.get(),10),v6=nw.get()===1,ipH=v6?40:20,rate=rt.get()===0?10e6:100e6,note="";
      if(v6&&mtu<1280){mtu=1280;note='<br><span class="warn">IPv6 では MTU を 1280 バイト以上にする決まりがあるので、1280 で計算した。</span>';}
      var mss=mtu-ipH-20,r=_w07_tcpWire(n,mss,ipH),eta=n/r.N,emax=mss/(mss+ipH+20+38);
      var o=[],p=U.plot(70,14,600,170,[1,1e6],[0,100],{xlog:true});
      o.push(p.axes({xl:"送るデータの量 n [バイト]（対数目盛）",yl:"効率 [%]",xt:[1,10,100,1e3,1e4,1e5,1e6],yt:[0,25,50,75,100],
        xfmt:function(v){return v>=1e6?"1M":v>=1e3?(v/1e3)+"k":String(v);},yfmt:function(v){return String(v);}}));
      var xs=[];for(var i=0;i<=600;i++)xs.push(Math.max(1,Math.round(Math.pow(10,i/100))));
      for(var k=1;k*mss<=1e6&&k<=60;k++){xs.push(k*mss);xs.push(k*mss+1);}
      xs.sort(function(a,b){return a-b;});
      var pts=[],prev=-1;xs.forEach(function(v){if(v===prev)return;prev=v;pts.push([v,100*v/_w07_tcpWire(v,mss,ipH).N]);});
      o.push(S.L(p.X(1),p.Y(100*emax),p.X(1e6),p.Y(100*emax),"green",1.2,"5 4"));
      o.push(S.T(p.X(1)+6,p.Y(100*emax)-5,"上限 MSS / (MSS + "+(ipH+20+38)+") = "+U.fmt.pct(emax,3),"start",9.5,"green"));
      o.push(p.line(pts,"signal",2));
      o.push(S.D(p.X(n),p.Y(100*eta),"alias",5));
      o.push(S.T(p.X(n)+(p.X(n)>560?-8:8),p.Y(100*eta)+16,"いまの値 "+U.fmt.pct(eta,3),p.X(n)>560?"end":"start",10,"alias",true));
      /* セグメントの並び */
      var ys=248,segs=[],kk=r.k;
      for(var j=0;j<kk;j++){if(kk<=8||j<3||j>=kk-2)segs.push(j);else if(j===3)segs.push(-1);}
      var unitW=600/segs.length,xx=70;
      o.push(S.T(70,ys-8,"セグメントの並び（全部で "+kk+" 個。1 つの箱が 1 つのフレーム）","start",10,"ink",true));
      segs.forEach(function(j){
        if(j<0){o.push(S.T(xx+unitW/2,ys+18,"…","middle",14,"muted",true));xx+=unitW;return;}
        var d=j===kk-1?r.last:mss,hdr=ipH+20+18,bw=unitW-6,hw=Math.max(4,bw*hdr/(mtu+18)),dw=Math.max(3,bw*d/(mtu+18)-0);
        o.push(S.RECT(xx,ys,hw,26,3,U.soft("gold"),"gold",1));
        o.push(S.RECT(xx+hw,ys,dw,26,3,"panel","ink",1));
        if(dw>34)o.push(S.T(xx+hw+dw/2,ys+17,String(d),"middle",9.5,"ink",true));
        xx+=unitW;});
      o.push(S.T(70,ys+44,"金色: そのセグメントの IP・TCP・Ethernet のヘッダと FCS（"+(ipH+20+18)+" バイト）、白: データ（数字はバイト数）","start",9.5,"muted"));
      box.set(S.svg(700,ys+54,o));
      ro.innerHTML="MSS = MTU − IP ヘッダ − TCP ヘッダ = "+mtu+" − "+ipH+" − 20 = <b>"+mss+" バイト</b><br>"+
        "セグメントの数 k = ⌈"+n+" / "+mss+"⌉ = <b>"+kk+"</b>（最後のセグメントのデータは "+r.last+" バイト）<br>"+
        "線の上のバイト数 N = <b>"+U.fmt.int(r.N)+" バイト分</b> ・ 効率 n / N = <b>"+U.fmt.pct(eta,3)+"</b>（上限 "+U.fmt.pct(emax,3)+"）<br>"+
        "線の上の時間 = N × 8 ÷ "+(rate/1e6)+" Mbps = <b>"+F.time(r.N*8/rate)+"</b> ・ 続けて送るときのデータのスループットの上限 = 効率 × "+(rate/1e6)+" Mbps = <b>"+F.rate(eta*rate)+"</b>"+note;
    }
    draw();
  };

  REG.w07_frag=function(el,U){
    var S=U.S,F=U.fmt,seed=7;
    U.head(el,"FRAG","UDP の大きなデータが IP のフラグメントに分かれるとき");
    var row=U.ctrls(el);
    var nS=U.slider(row,"UDP のデータの大きさ",{min:100,max:65507,value:3000,log:true,step:0.0001,snap:function(v){v=Math.round(v);return v>65480?65507:Math.max(1,v);},fmt:_w07_bytes,onInput:draw});
    var mt=U.select(row,"MTU",[{v:"1500",t:"1500（Ethernet）"},{v:"1492",t:"1492（PPPoE の回線）"},{v:"1280",t:"1280（IPv6 の最小）"},{v:"576",t:"576"}],"1500",draw);
    var nw=U.select(row,"ネットワーク層",["IPv4","IPv6"],0,draw);
    var row2=U.ctrls(el);
    var pS=U.slider(row2,"1 つのフラグメントが失われる確率 p",{min:0,max:20,step:0.1,value:1,fmt:function(v){return v.toFixed(1)+" %";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var TRIALS=1000;
    function draw(){
      var n=nS.get(),mtu=parseInt(mt.get(),10),v6=nw.get()===1,p=pS.get()/100,note="";
      if(v6&&mtu<1280){mtu=1280;note='<br><span class="warn">IPv6 では MTU を 1280 バイト以上にする決まりがあるので、1280 で計算した。</span>';}
      var ipH=v6?40:20,L=8+n,fh=v6?8:0,k,per;
      if(ipH+L<=mtu){k=1;per=L;}else{per=Math.floor((mtu-ipH-fh)/8)*8;k=Math.ceil(L/per);}
      var P=Math.pow(1-p,k),maxD=mtu-ipH-8,k2=Math.ceil(n/maxD);
      /* 乱数で TRIALS 個のパケットを送ってみる */
      var R=U.rng(seed),ok=0,res=[];
      for(var t=0;t<TRIALS;t++){var all=true;for(var j=0;j<k;j++)if(R.next()<p)all=false;if(all)ok++;if(t<200)res.push(all);}
      var o=[];
      /* フラグメントの並び */
      o.push(S.T(10,16,k===1?"MTU に収まるので分けない（1 つの IP パケット）":"IP のペイロード "+L+" バイトを "+k+" 個のフラグメントに分ける（1 つに "+per+" バイトまで）","start",10.5,"ink",true));
      var x0=10,W=680,hdrW=Math.max(3,Math.min(14,W/k*0.2)),dataW=(W-k*hdrW)/L,xx=x0;
      for(var i=0;i<k;i++){var d=i<k-1?per:L-(k-1)*per,dw=d*dataW;
        o.push(S.RECT(xx,26,hdrW,26,2,U.soft("gold"),"gold",1));xx+=hdrW;
        o.push(S.RECT(xx,26,Math.max(dw,1),26,2,i===0?U.soft("green"):"panel",i===0?"green":"ink",1));
        if(dw>46)o.push(S.T(xx+dw/2,43,String(d),"middle",9.5,"ink",true));
        if(i<3&&k>1&&dw>70)o.push(S.T(xx+dw/2,66,"オフセット "+(i*per/8),"middle",9,"muted"));
        xx+=dw;}
      o.push(S.T(10,k>1?84:70,"金色: 各フラグメントの IP ヘッダ"+(v6?"（IPv6 では、さらにフラグメント用の 8 バイト）":"")+"、緑: UDP のヘッダを含む最初のフラグメント","start",9.5,"muted"));
      /* 試した結果 */
      var gy=112,cs=13;
      o.push(S.T(10,gy-6,"1000 個送ったうちの最初の 200 個（緑: 全部届いた、赤: どれかが失われて全体が届かなかった）","start",10,"ink",true));
      res.forEach(function(a,q){var r=Math.floor(q/40),c=q%40;o.push(S.RECT(10+c*17,gy+r*(cs+3),cs,cs,2,a?U.soft("green"):U.soft("alias"),a?"green":"alias",1));});
      /* 送り直したときのフラグメントの数 */
      var by=gy+5*(cs+3)+26,e1=P>0?k/P:Infinity,e2=k2/(1-p),mx=Math.max(isFinite(e1)?e1:0,e2,1);
      o.push(S.T(10,by-8,"届くまで送り直したときに送る IP パケットの数の平均","start",10,"ink",true));
      [["丸ごと送り直す",e1,"alias"],["MTU に収まる "+k2+" 個に分ける",e2,"green"]].forEach(function(b,q){
        var yy=by+q*30,w=isFinite(b[1])?480*Math.min(b[1],mx)/mx:480;
        o.push(S.RECT(190,yy,Math.max(w,1),20,3,U.soft(b[2]),b[2],1.1));
        o.push(S.T(182,yy+14,b[0],"end",10,"ink"));
        var wx=190+Math.max(w,1),inR=wx+6>600;
        o.push(S.T(inR?wx-6:wx+6,yy+14,_w07_num(U,b[1])+" 個",inR?"end":"start",10,b[2],true));});
      box.set(S.svg(700,by+66,o));
      var h="フラグメントの数 k = "+(k===1?"1（IP パケットが MTU に収まるので分けない）":"⌈"+L+" / "+per+"⌉ = <b>"+k+"</b>")+"<br>"+
        "全部届く確率 (1 − p)^k = (1 − "+U.sig(p,3)+")^"+k+" = <b>"+U.sig(P,4)+"</b> ・ 乱数で 1000 個試した結果: "+ok+" 個が届いた（"+U.sig(ok/TRIALS,3)+"）<br>";
      if(k===1)h+="届くまで送り直すと、平均 1 / (1 − p) = <b>"+_w07_num(U,e1)+" 回</b>";
      else h+="届くまで丸ごと送り直すと平均 "+_w07_num(U,1/P)+" 回、送るフラグメントは平均 <b>"+_w07_num(U,e1)+" 個</b> ・ "+
        "MTU に収まる大きさ（データ "+maxD+" バイト以下）の "+k2+" 個のデータグラムに分けて、失われた分だけ送り直すと、平均 <b>"+_w07_num(U,e2)+" 個</b>";
      ro.innerHTML=h+note;
    }
    draw();
  };
