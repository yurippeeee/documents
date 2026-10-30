  /* ===== 08 章 ネットワークに参加する ===== */
  /* IPv4 アドレスの文字列 → 32 ビットの数（不正なら null） */
  function _w08_ip(s){var m=/^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(String(s));if(!m)return null;
    var v=0;for(var i=1;i<=4;i++){var k=+m[i];if(k>255)return null;v=v*256+k;}return v>>>0;}
  function _w08_ips(v){return [v>>>24,(v>>>16)&255,(v>>>8)&255,v&255].join(".");}
  /* プレフィックス長 → マスク。JS のシフトも 32 で割った余りを使うので、0 を分ける（C と同じ注意） */
  function _w08_mask(n){return n===0?0:((0xFFFFFFFF<<(32-n))>>>0);}
  function _w08_bits(v){var s=(v>>>0).toString(2);while(s.length<32)s="0"+s;return s;}

  REG.w08_subnet=function(el,U){
    var S=U.S;
    U.head(el,"SUBNET","同じサブネットか、次に誰へ渡すか");
    var row=U.ctrls(el);
    var me=U.textin(row,"自分の IP アドレス","192.168.1.23",draw);
    var pf=U.slider(row,"プレフィックス長",{min:0,max:32,step:1,value:24,fmt:function(v){return "/"+v+"（"+_w08_ips(_w08_mask(v))+"）";},onInput:draw});
    var row2=U.ctrls(el);
    var gw=U.textin(row2,"デフォルトゲートウェイ","192.168.1.1",draw);
    var dst=U.textin(row2,"宛先の IP アドレス","203.0.113.10",draw);
    var br=U.btnrow(el);
    function ex(a,n,g,d){me.set(a);pf.set(n);gw.set(g);dst.set(d);draw();}
    U.button(br,"PC へ（同じサブネット）",function(){ex("192.168.1.23",24,"192.168.1.1","192.168.1.40");});
    U.button(br,"外のサーバへ",function(){ex("192.168.1.23",24,"192.168.1.1","203.0.113.10");});
    U.button(br,"/26 で外になる例",function(){ex("192.168.1.23",26,"192.168.1.1","192.168.1.100");});
    U.button(br,"ゲートウェイの設定の誤り",function(){ex("192.168.1.23",26,"192.168.1.100","203.0.113.10");});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var a=_w08_ip(me.get()),g=_w08_ip(gw.get()),d=_w08_ip(dst.get()),n=pf.get(),m=_w08_mask(n);
      var bad=[];
      if(a===null)bad.push("自分の IP アドレス");if(g===null)bad.push("デフォルトゲートウェイ");if(d===null)bad.push("宛先");
      if(bad.length){box.set(S.svg(520,40,[S.T(260,24,"入力を a.b.c.d（各 0〜255）の形にしてください","middle",11,"alias",true)]));
        ro.innerHTML='<span class="warn">'+bad.join("・")+' の形が正しくない</span>';return;}
      var am=(a&m)>>>0,dm=(d&m)>>>0,gm=(g&m)>>>0,same=am===dm;
      var cw=6.9,xb=148,og=8,W=540,o=[];
      function bx(i){return xb+i*cw+Math.floor(i/8)*og+cw/2;}
      var xr=bx(31)+cw/2+12,rh=18,y=34;
      o.push(S.T(bx(0)-cw/2,16,"ネットワーク部（上位 "+n+" ビット）","start",9.5,"gold",true));
      if(n>0)o.push(S.RECT(bx(0)-cw/2-3,22,bx(n-1)-bx(0)+cw+6,5*rh+8,4,U.soft("gold"),"none",0));
      function row(lab,v,kind,ref,lc){var b=_w08_bits(v);o.push(S.T(xb-10,y,lab,"end",10,lc||"ink",kind!=="addr"));
        for(var i=0;i<32;i++){var ch=b.charAt(i),c;
          if(kind==="mask")c=ch==="1"?"gold":"faint";
          else if(kind==="res")c=i<n?((ref!=null&&_w08_bits(ref).charAt(i)!==ch)?"alias":"signal"):"faint";
          else c=i<n?"ink":"muted";
          o.push(S.T(bx(i),y,ch,"middle",11.5,c,kind==="res"&&i<n,true));}
        o.push(S.T(xr,y,_w08_ips(v),"start",10.5,kind==="res"?(ref!=null&&ref!==v?"alias":"signal"):(kind==="mask"?"gold":"ink"),kind==="res",true));
        y+=rh;}
      row("マスク /"+n,m,"mask",null,"gold");
      o.push(S.L(xb-110,y-13,bx(31)+6,y-13,"line",1));
      row("自分 "+_w08_ips(a),a,"addr");row("AND マスク",am,"res",null,"signal");
      o.push(S.L(xb-110,y-13,bx(31)+6,y-13,"line",1));
      row("宛先 "+_w08_ips(d),d,"addr");row("AND マスク",dm,"res",am,"signal");
      y+=8;
      var bcast=(am|(~m>>>0))>>>0;
      var isB=(d===0xFFFFFFFF)||(d===bcast&&n<31);
      var hop=isB?null:(same?d:g);
      var verdict=d===a?"自分あて":(isB?"ブロードキャスト（リンクの全員）":(same?"同じサブネット → 宛先へ直接渡す":"外 → デフォルトゲートウェイへ渡す"));
      o.push(S.T(20,y+4,verdict,"start",11.5,same||isB?"green":"gold",true));
      y+=14;
      box.set(S.svg(W,y,o));
      var gwIn=((g&m)>>>0)===am, nAddr=Math.pow(2,32-n);
      var msg="自分 AND マスク = <b>"+_w08_ips(am)+"</b>、宛先 AND マスク = <b>"+_w08_ips(dm)+"</b> → "+(same?'<span class="ok">等しい: 同じサブネット</span>':'<b style="color:var(--gold)">違う: 外</b>')+"<br>";
      if(d===a)msg+="宛先は自分自身なので、リンクには出さない。<br>";
      else if(isB)msg+="宛先はブロードキャストのアドレスなので、ARP は使わず、宛先 MAC を FF:FF:FF:FF:FF:FF にして送る。<br>";
      else msg+="次に渡す相手 = <b>"+_w08_ips(hop)+"</b>"+(same?"（宛先そのもの）":"（デフォルトゲートウェイ）")+" → ARP でこの IP アドレスの MAC アドレスを聞く。IP パケットの宛先は "+_w08_ips(d)+" のまま。<br>";
      msg+="このサブネット: "+_w08_ips(am)+"/"+n+"、ブロードキャストのアドレス "+_w08_ips(bcast)+"、アドレスの数 2<sup>"+(32-n)+"</sup> = "+U.fmt.int(nAddr)+
        (n<=30?"、機器に割り当てられる数 "+U.fmt.int(nAddr-2):"（/31 と /32 は特別な使い方をするので、ここでは扱わない）");
      var w=[];
      if(n<=30&&(a===am||a===bcast))w.push("自分のアドレスがサブネットそのもの（後ろが全部 0）かブロードキャスト（全部 1）のアドレスになっている。機器には割り当てない値である");
      if(!gwIn)w.push("デフォルトゲートウェイ "+_w08_ips(g)+" が自分のサブネットの外にある（AND の結果 "+_w08_ips(gm)+"）。ゲートウェイにもフレームを直接届けられないので、外の宛先へは送れない（設定の誤り）");
      if(w.length)msg+='<br><span class="warn">'+w.join("。<br>")+"。</span>";
      ro.innerHTML=msg;
    }
    draw();
  };

  /* DNS の質問を組み立てる（本文の dns_build_query と同じ規則）。返り値 {bytes, kinds, err} */
  function _w08_dnsq(id,name,qtype){
    var b=[],k=[];function put(v,kind){b.push(v&255);k.push(kind);}
    put(id>>8,"id");put(id,"id");put(0x01,"flags");put(0x00,"flags");
    put(0,"cnt");put(1,"cnt");for(var i=0;i<6;i++)put(0,"cnt");
    var labs=String(name).split("."),total=0;
    for(var j=0;j<labs.length;j++){var L=labs[j];
      if(L.length===0)return {err:"空のラベルがある（. が続いている、先頭か末尾が . など）"};
      var enc=[];for(var c=0;c<L.length;c++){var cc=L.charCodeAt(c);if(cc>126||cc<33)return {err:"ラベルに使えない文字がある（この図では ASCII の文字だけを扱う）"};enc.push(cc);}
      if(enc.length>63)return {err:"ラベル「"+_w08_esc(L.slice(0,20))+"…」が "+enc.length+" バイトで、63 バイトを超える"};
      put(enc.length,"len");enc.forEach(function(v){put(v,"lab");});total+=1+enc.length;}
    if(total+1>255)return {err:"名前が全体で "+(total+1)+" バイトになり、255 バイトを超える"};
    put(0,"len");put(qtype>>8,"tc");put(qtype,"tc");put(0,"tc");put(1,"tc");
    return {bytes:b,kinds:k};
  }
  function _w08_esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}
  var _w08_KC={id:"signal",flags:"gold",cnt:null,len:"gold",lab:"signal",tc:"purple",ptr:"gold",ttl:"teal",rdl:null,addr:"green"};

  REG.w08_dns=function(el,U){
    U.head(el,"DNS","名前解決の質問のバイト列");
    var row=U.ctrls(el);
    var nm=U.textin(row,"名前","mqtt.example.com",draw,{width:"260px"});
    var ty=U.select(row,"型",[{v:"1",t:"A（IPv4 アドレス）"},{v:"28",t:"AAAA（IPv6 アドレス）"}],"1",draw);
    var idt=U.textin(row,"ID（16 進 4 桁）","1A2B",draw);
    var br=U.btnrow(el);
    var seed=12345;
    U.button(br,"ID を乱数で決める",function(){var r=U.rng(seed++);var v=r.int(65536);idt.set(U.fmt.hex(v,4));draw();});
    U.button(br,"長すぎるラベルの例",function(){nm.set(new Array(65).join("a")+".example.com");draw();});
    U.button(br,"空のラベルの例",function(){nm.set("mqtt..example.com");draw();});
    U.button(br,"元に戻す",function(){nm.set("mqtt.example.com");idt.set("1A2B");ty.set("1");draw();});
    var ans=U.checkbox(br,"答えの例も表示する",true,draw);
    var out=U.mk("div");el.appendChild(out);
    var ro=U.readout(el);
    function draw(){
      var idv=parseInt(idt.get(),16),qt=+ty.get();
      if(!/^[0-9a-fA-F]{1,4}$/.test(idt.get().trim())||isNaN(idv)){out.innerHTML="";ro.innerHTML='<span class="warn">ID は 16 進 1〜4 桁で入れてください</span>';return;}
      var q=_w08_dnsq(idv,nm.get().trim(),qt);
      if(q.err){out.innerHTML="";ro.innerHTML='<span class="warn">組み立てられない: '+q.err+'。</span>本文の関数は、この場合 0 を返す。';return;}
      var names={id:"ID",flags:"フラグ",cnt:"数",len:"ラベルの長さ",lab:"ラベルの文字",tc:"型とクラス"};
      var h='<div class="wnote">質問（'+q.bytes.length+' バイト）: <span style="color:var(--signal)">ID</span>・<span style="color:var(--gold)">フラグ</span>・数・<span style="color:var(--gold)">長さ</span>・<span style="color:var(--signal)">文字</span>・<span style="color:var(--purple)">型とクラス</span></div>'+
        U.hexView(q.bytes,function(i){return _w08_KC[q.kinds[i]];},function(i){var k=q.kinds[i],v=q.bytes[i];return i+" バイト目: "+names[k]+(k==="lab"?"「"+String.fromCharCode(v)+"」":"");});
      // 名前の部分の読み方（筆算風に: 長さ → 文字）
      var parts=[],i=12;
      while(q.bytes[i]!==0){var L=q.bytes[i],s="";for(var j=1;j<=L;j++)s+=String.fromCharCode(q.bytes[i+j]);parts.push('<b style="color:var(--gold)">'+U.fmt.hex(L)+"</b> → 次の "+L+" バイト「"+_w08_esc(s)+"」");i+=1+L;}
      parts.push('<b style="color:var(--gold)">00</b> → 名前の終わり');
      var rows=[["0〜1","ID",U.fmt.hex(q.bytes[0])+" "+U.fmt.hex(q.bytes[1]),"答えに同じ値が入る"],["2〜3","フラグ","01 00","RD = 1（最後まで調べてほしい）"],
        ["4〜11","数","00 01 00 00 00 00 00 00","質問 1・答え 0・権威 0・追加 0"],["12〜"+(i),"名前",(i-11)+" バイト",parts.join("<br>")],
        [(i+1)+"〜"+(i+4),"型・クラス",U.fmt.hex(qt>>8)+" "+U.fmt.hex(qt)+" 00 01",(qt===1?"A":"AAAA")+"・IN"]];
      h+=U.tbl(["位置","欄","値","意味"],rows,["left","left","left","left"]);
      if(ans.get()){
        var a=q.bytes.slice(),k=q.kinds.slice();a[2]=0x81;a[3]=0x80;a[7]=1;   /* QR=1 RD=1 RA=1、答えの数 = 1 */
        function put(v,kind){a.push(v&255);k.push(kind);}
        put(0xC0,"ptr");put(0x0C,"ptr");put(qt>>8,"tc");put(qt,"tc");put(0,"tc");put(1,"tc");
        put(0,"ttl");put(0,"ttl");put(1,"ttl");put(0x2C,"ttl");
        var addr=qt===1?[203,0,113,10]:[0x20,0x01,0x0d,0xb8,0,0,0,0,0,0,0,0,0,0,0,0x10];
        put(0,"rdl");put(addr.length,"rdl");addr.forEach(function(v){put(v,"addr");});
        var nmA=qt===1?"203.0.113.10":"2001:db8::10";
        h+='<div class="wnote" style="margin-top:.8rem">答えの例（'+a.length+' バイト。アドレスは文書の例のための値）: フラグ <b>81 80</b>（QR = 1・RD = 1・RA = 1・RCODE = 0）、答えの数 1、同じ質問の後に答えのレコード</div>'+
          U.hexView(a,function(i){return i<q.bytes.length?(i===2||i===3||i===7?"alias":null):_w08_KC[k[i]];},function(i){return i+" バイト目";});
        h+=U.tbl(["欄","値","意味"],[["名前","C0 0C","12 バイト目の名前（質問の名前）を指す"],["型・クラス",U.fmt.hex(qt>>8)+" "+U.fmt.hex(qt)+" 00 01",(qt===1?"A":"AAAA")+"・IN"],
          ["TTL","00 00 01 2C","300 秒覚えてよい"],["データの長さ","00 "+U.fmt.hex(addr.length),addr.length+" バイト"],["データ",addr.map(function(v){return U.fmt.hex(v);}).join(" "),nmA]],["left","left","left"]);
      }
      out.innerHTML=h;
      ro.innerHTML="質問の長さ = ヘッダ 12 + 名前 "+(i-11)+" + 型とクラス 4 = <b>"+q.bytes.length+" バイト</b>（UDP のポート 53 へ送る）。ID = 0x"+U.fmt.hex(idv,4)+"。"+
        (ans.get()?" 赤で示した 3 バイトが、質問から答えに変わった所（フラグと答えの数）。":"");
    }
    draw();
  };

  /* NAT の変換表の行のシミュレーション（1 時間）。行は 0 秒に接続して作られる。
     キープアライブ（T_k ごと）がルータに届くと時計が 0 に戻り、T_h 届かないと行が消える。
     行が消えた後、ルータに届いたキープアライブで機器は切断に気づき、すぐに接続し直す（新しい行）。 */
  function _w08_natsim(Tk,Th,p,M,r,H){
    var ka=[],alive=[],last=0,start=0,up=true,deaths=0,recon=0;
    for(var t=Tk;t<=H+1e-9;t+=Tk){
      var lost=r.chance(p);ka.push([t,lost]);
      if(up&&t-last>=Th){alive.push([start,last+Th]);up=false;deaths++;}
      if(!lost){if(up)last=t;else{up=true;start=t;last=t;recon++;}}
    }
    if(up){if(H-last>=Th){alive.push([start,last+Th]);deaths++;}else alive.push([start,H]);}
    var nt=[],t2=r.exp(M);
    while(t2<H){var ok=alive.some(function(a){return t2>=a[0]&&t2<a[1];});nt.push([t2,ok]);t2+=r.exp(M);}
    var at=alive.reduce(function(s,a){return s+(a[1]-a[0]);},0);
    return {ka:ka,alive:alive,deaths:deaths,recon:recon,nt:nt,aliveFrac:at/H};
  }

  REG.w08_nat=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"NAT","変換表の行の保持時間とキープアライブ（1 時間のシミュレーション）");
    var row=U.ctrls(el);
    var sec=function(v){return Math.round(v);};
    var tk=U.slider(row,"キープアライブの間隔 T_k",{min:5,max:600,value:25,log:true,step:0.0001,snap:sec,fmt:function(v){return F.time(v);},onInput:draw});
    var th=U.slider(row,"変換表の保持時間 T_h",{min:10,max:1800,value:60,log:true,step:0.0001,snap:sec,fmt:function(v){return F.time(v);},onInput:draw});
    var row2=U.ctrls(el);
    var pl=U.slider(row2,"キープアライブがルータに届く前に失われる確率 p",{min:0,max:50,step:1,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var mn=U.slider(row2,"サーバからの通知の平均の間隔",{min:10,max:600,value:60,log:true,step:0.0001,snap:sec,fmt:function(v){return F.time(v);},onInput:draw});
    var row3=U.ctrls(el);
    var qk=U.slider(row3,"1 回のキープアライブの電荷 Q_k（代表値）",{min:0.1,max:10,value:2.4,log:true,fmt:function(v){return U.sig(v,3)+" mC";},onInput:draw});
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"25 秒と 60 秒（条件を満たす）",function(){tk.set(25);th.set(60);draw();});
    U.button(br,"90 秒と 60 秒（間隔が長すぎる）",function(){tk.set(90);th.set(60);draw();});
    U.button(br,"保持時間が長い（300 秒と 1800 秒）",function(){tk.set(300);th.set(1800);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Tk=tk.get(),Th=th.get(),p=pl.get()/100,M=mn.get(),H=3600;
      var s=_w08_natsim(Tk,Th,p,M,U.rng(seed*104729+7),H);
      var W=700,x0=110,w=570,o=[],X=function(t){return x0+t/H*w;};
      var y1=26;
      o.push(S.T(x0-10,y1+15,"変換表の行","end",10.5,"ink",true));
      o.push(S.RECT(x0,y1,w,22,3,"screen","line",1));
      var prev=0;s.alive.forEach(function(a){if(a[0]>prev)o.push(S.RECT(X(prev),y1,Math.max(1,X(a[0])-X(prev)),22,2,U.soft("alias"),"alias",1));
        o.push(S.RECT(X(a[0]),y1,Math.max(1,X(a[1])-X(a[0])),22,2,U.soft("green"),"green",1));prev=a[1];});
      if(prev<H)o.push(S.RECT(X(prev),y1,Math.max(1,X(H)-X(prev)),22,2,U.soft("alias"),"alias",1));
      o.push(S.T(x0+4,y1-6,"緑: 行がある　赤: 行が無い（サーバからのパケットは捨てられる）","start",9.5,"muted"));
      var y2=y1+44;
      o.push(S.T(x0-10,y2+4,"キープアライブ","end",10,"signal",true));
      s.ka.forEach(function(k){if(k[1])o.push(S.X(X(k[0]),y2,3.2,"alias",1.6));else o.push(S.L(X(k[0]),y2-7,X(k[0]),y2+7,"signal",1.3));});
      var y3=y2+30;
      o.push(S.T(x0-10,y3+4,"サーバからの通知","end",10,"purple",true));
      s.nt.forEach(function(n){o.push(S.D(X(n[0]),y3,n[1]?"green":"alias",3.4));});
      var ya=y3+20;
      o.push(S.L(x0,ya,x0+w,ya,"muted",1));
      for(var m=0;m<=60;m+=10){o.push(S.L(X(m*60),ya,X(m*60),ya+4,"muted",1));o.push(S.T(X(m*60),ya+16,m+" 分","middle",9.5,"muted"));}
      box.set(S.svg(W,ya+26,o));
      var nOk=s.nt.filter(function(n){return n[1];}).length,nLost=s.nt.length-nOk;
      var jmax=Math.ceil(Th/Tk-1e-9)-2;
      var cond=Tk<Th?'<span class="ok">'+U.sig(Tk,3)+" s < "+U.sig(Th,3)+" s で満たす</span>":'<span class="warn">'+U.sig(Tk,3)+" s ≧ "+U.sig(Th,3)+" s で満たさない（間隔ごとに行が消える）</span>";
      var jtxt=Tk<Th?"続けて失われても行を保てる回数の最大 j = ⌈T_h / T_k⌉ − 2 = <b>"+jmax+"</b>（(j + 1) T_k < T_h を満たす最大の j。"+(jmax+1)+" 回続けて失われると消える）"+
        "。1 時間に行が消える回数の目安 ≈ (3600 / T_k) × (1 − p) × p<sup>"+(jmax+1)+"</sup> = "+U.sig(3600/Tk*(1-p)*Math.pow(p,jmax+1),3)+" 回（"+(jmax+1)+" 回以上続けて失われる並びの数）":"";
      ro.innerHTML="条件 T_k < T_h: "+cond+"<br>"+(jtxt?jtxt+"<br>":"")+
        "シミュレーション: 行があった時間 <b>"+U.sig(s.aliveFrac*100,4)+" %</b>、行が消えた回数 <b>"+s.deaths+"</b>"+(s.deaths?"（そのうち "+s.recon+" 回は、その後のキープアライブで気づいて接続し直した）":"")+"<br>"+
        "サーバからの通知 "+s.nt.length+" 件のうち、届いた <b>"+nOk+"</b> 件、捨てられた "+(nLost?'<span class="warn">'+nLost+" 件</span>":"0 件")+"<br>"+
        "キープアライブで増える平均電流 = Q_k / T_k = "+U.sig(qk.get(),3)+" mC ÷ "+U.sig(Tk,3)+" s = <b>"+F.cur(qk.get()*1e-3/Tk)+"</b>（接続し直す電力は含まない）"+
        '<div class="wnote">機器は、行が消えた後にルータに届いたキープアライブに答えが来ないことで切断に気づき、すぐに接続し直す（新しい行ができる）とした。その前に届いた通知は捨てられる。通知は平均の間隔の指数分布で、乱数で発生させた。</div>';
    }
    draw();
  };

  /* 起動から接続までの 1 回の試行（本文の join_on と同じ段・期限・回数）。時間の単位は秒 */
  function _w08_trial(P,r){
    var t=0,segs=[],marks=[],fails=0,state="DHCP",MAXT=600;
    function seg(a,b,k){if(b>a)segs.push([a,b,k]);}
    function rt(base){return base*(0.8+0.4*r.next());}            /* 往復の時間に ±20 % の揺らぎ */
    function ok(){return !r.chance(P.p)&&!r.chance(P.p);}          /* 往きと帰りの両方が届けば成り立つ */
    function wait(){fails++;var w=r.next()*Math.pow(2,Math.min(fails,6));seg(t,t+w,"wait");t+=w;}   /* 0〜上限の一様乱数 */
    while(t<MAXT){
      var t0=t,got=false,i;
      if(state==="DHCP"){
        var dl=t+30,need=P.reuse?1:2,e=0;
        while(e<need&&t<dl){
          for(var k=0;;k++){marks.push([t,"dhcp"]);
            if(ok()){t+=rt(P.lan);e++;break;}
            var iv=Math.min(4*Math.pow(2,k),64)+r.range(-1,1);
            if(t+iv>=dl){t=dl;break;} t+=iv;}
        }
        seg(t0,t,"dhcp");
        if(e<need){wait();continue;}
        if(P.acd){var c=r.range(0,1)+r.range(1,2)+r.range(1,2)+2;seg(t,t+c,"acd");t+=c;}
        state="ARP";continue;
      }
      if(state==="ARP"){
        for(i=0;i<3;i++){marks.push([t,"arp"]);if(ok()){t+=rt(P.lan);got=true;break;}t+=1;}
        seg(t0,t,"arp");state=got?"DNS":"DHCP";continue;
      }
      if(state==="DNS"){
        for(i=0;i<4;i++){marks.push([t,"dns"]);if(ok()){t+=rt(P.dns);got=true;break;}t+=2;}
        seg(t0,t,"dns");
        if(!got){wait();continue;}
        state="TCP";continue;
      }
      var rto=1,el=0;
      for(;;){marks.push([t,"tcp"]);if(ok()){t+=rt(P.srv);got=true;break;}if(el+rto>=10){t=t0+10;break;}t+=rto;el+=rto;rto*=2;}
      seg(t0,t,"tcp");
      if(!got){wait();state="DNS";continue;}
      return {total:t,segs:segs,marks:marks};
    }
    return {total:t,segs:segs,marks:marks,cut:true};
  }
  var _w08_JK={dhcp:["DHCP","gold"],acd:["重複の確認","teal"],arp:["ARP","signal"],dns:["DNS","purple"],tcp:["接続","green"],wait:["待つ","alias"]};

  REG.w08_join=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"JOIN","起動から接続までの時間（リンクアップから。2000 回の試行）");
    var row=U.ctrls(el);
    var pl=U.slider(row,"1 つのメッセージが失われる確率 p",{min:0,max:30,step:0.5,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var lan=U.slider(row,"LAN の中の往復",{min:1,max:50,value:5,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var row2=U.ctrls(el);
    var dns=U.slider(row2,"DNS サーバの答えまで",{min:5,max:500,value:30,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var srv=U.slider(row2,"サーバまでの往復",{min:10,max:1000,value:100,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var row3=U.ctrls(el);
    var reuse=U.checkbox(row3,"前に借りたアドレスで REQUEST から始める",false,draw);
    var acd=U.select(row3,"受け取ったアドレスの重複の確認",["しない","RFC 5227 の手順（4〜7 秒）"],0,draw);
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),box2=U.svgbox(el); var ro=U.readout(el);
    function q(a,f){var k=Math.min(a.length-1,Math.floor(f*a.length));return a[k];}
    function draw(){
      var P={p:pl.get()/100,lan:lan.get()/1000,dns:dns.get()/1000,srv:srv.get()/1000,reuse:reuse.get(),acd:acd.get()===1};
      var r=U.rng(seed*7919+13),N=2000,tot=[],one=null;
      for(var n=0;n<N;n++){var tr=_w08_trial(P,r);if(n===0)one=tr;tot.push(tr.total);}
      // 1 回分の内訳
      var W=700,x0=20,w=600,T1=Math.max(one.total*1.04,0.2),X=function(t){return x0+t/T1*w;},o=[];
      o.push(S.T(x0,16,"1 回分の内訳（全体 "+F.time(one.total)+"）","start",10.5,"ink",true));
      var y=26;o.push(S.RECT(x0,y,w,24,3,"screen","line",1));
      one.segs.forEach(function(sg){var k=_w08_JK[sg[2]],ww=Math.max(1.2,X(sg[1])-X(sg[0]));
        o.push(S.RECT(X(sg[0]),y,ww,24,2,U.soft(k[1]),k[1],1,sg[2]==="wait"?"4 3":null));
        if(ww>U.tw(k[0],9.5)+6)o.push(S.T(X(sg[0])+ww/2,y+16,k[0],"middle",9.5,k[1],true));});
      one.marks.forEach(function(m){o.push(S.L(X(m[0]),y+24,X(m[0]),y+30,_w08_JK[m[1]][1],1.4));});
      var lx=x0;["dhcp","acd","arp","dns","tcp","wait"].forEach(function(k){var c=_w08_JK[k];o.push(S.RECT(lx,y+38,10,10,2,U.soft(c[1]),c[1],1));o.push(S.T(lx+14,y+47,c[0]+(k==="wait"?"（バックオフ）":""),"start",9.5,"muted"));lx+=U.tw(c[0]+(k==="wait"?"（バックオフ）":""),9.5)+30;});
      o.push(S.T(x0+w,y+47,"下の短い線: 送った時刻","end",9.5,"muted"));
      o.push(S.T(x0,y+66,"0","start",9,"muted"));o.push(S.T(x0+w,y+66,F.time(T1),"end",9,"muted"));
      box.set(S.svg(W,y+72,o));
      // 分布（対数の横軸）
      var s=tot.slice().sort(function(a,b){return a-b;}),lo=0.05,hi=600,nb=48,bins=[];for(var b=0;b<nb;b++)bins.push(0);
      s.forEach(function(v){var k=Math.floor((Math.log10(Math.max(lo,Math.min(hi*0.999,v)))-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*nb);bins[k]++;});
      var bmax=Math.max.apply(null,bins),p=U.plot(60,14,600,120,[lo,hi],[0,bmax*1.1],{xlog:true}),o2=[];
      o2.push(p.axes({xl:"リンクアップから接続までの時間（対数目盛）",yl:"回数",xt:[0.1,1,10,100],xfmt:function(v){return v<1?(v*1000)+" ms":v+" s";},yt:[0,Math.round(bmax/2),bmax],ylOff:42}));
      bins.forEach(function(c,k){if(!c)return;var a=lo*Math.pow(hi/lo,k/nb),bb=lo*Math.pow(hi/lo,(k+1)/nb);o2.push(S.RECT(p.X(a),p.Y(c),Math.max(1,p.X(bb)-p.X(a)-1),p.Y(0)-p.Y(c),1,U.soft("signal"),"signal",1));});
      var med=q(s,0.5),p95=q(s,0.95),mean=s.reduce(function(a,v){return a+v;},0)/N;
      [[med,"中央値","green"],[p95,"95 %","alias"]].forEach(function(m,i){var xx=p.X(Math.max(lo,m[0]));o2.push(S.L(xx,p.Y(bmax*1.1),xx,p.Y(0),m[2],1.6,"5 3"));o2.push(S.T(xx+4,p.Y(bmax*1.05)+i*13,m[1]+" "+F.time(m[0]),"start",9.5,m[2],true));});
      box2.set(S.svg(W,180,o2));
      var base=(P.reuse?1:2)*P.lan+P.lan+P.dns+P.srv,over1=s.filter(function(v){return v>1;}).length/N,over10=s.filter(function(v){return v>10;}).length/N;
      var qq=Math.pow(1-P.p,2);
      ro.innerHTML="1 つも失われないときの時間 = DHCP "+(P.reuse?"1":"2")+" 往復 + ARP 1 往復 + DNS + 接続 ≈ <b>"+F.time(base)+"</b>"+(P.acd?" + 重複の確認 4〜7 s":"")+"<br>"+
        "1 回の往復が成り立つ確率 q = (1 − p)<sup>2</sup> = "+U.sig(qq,4)+"、1 つの段の平均の試行回数 1/q = "+U.sig(1/qq,4)+"<br>"+
        "2000 回の試行: 平均 <b>"+F.time(mean)+"</b>・中央値 <b>"+F.time(med)+"</b>・95 % <b>"+F.time(p95)+"</b>・99 % "+F.time(q(s,0.99))+"・最大 "+F.time(s[N-1])+"<br>"+
        "1 秒を超えた試行 "+U.sig(over1*100,3)+" %、10 秒を超えた試行 "+U.sig(over10*100,3)+" %"+
        '<div class="wnote">段・期限・回数は本文の表のとおり（DHCP は RFC 2131 の間隔で全体 30 秒、ARP は 1 秒ごとに 3 回、DNS は 2 秒ごとに 4 回、接続は 10 秒まで）。接続の要求は、TCP が中で 1・2・4 秒と倍の間隔で送り直すものとした（10 章）。失敗した段の後の待ち時間は、0 秒から 2 秒・4 秒・…・64 秒までの一様な乱数（05 章 5 節）。往復の時間には ±20 % の揺らぎを入れた。リンクアップまでの時間（09 章）は含まない。値はすべて仮定である。</div>';
    }
    draw();
  };
