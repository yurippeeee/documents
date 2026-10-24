  /* ===== 13 章 MQTT ===== */
  /* ---- デモ 1: トピックの照合 ---- */
  function _w13_badFilter(f){
    if(!f.length)return "空のフィルタは使えない";
    var lv=f.split("/");
    for(var i=0;i<lv.length;i++){
      if(lv[i].indexOf("#")>=0&&(lv[i]!=="#"||i!==lv.length-1))return "# は最後のレベルに、それだけで置く";
      if(lv[i].indexOf("+")>=0&&lv[i]!=="+")return "+ はレベル全体を占める";
    }
    return "";
  }
  function _w13_badName(t){
    if(!t.length)return "空のトピック名は使えない";
    if(/[+#]/.test(t))return "トピック名にワイルドカードは使えない";
    return "";
  }
  /* フィルタ f とトピック名 t を、先頭からレベルごとに比べる（MQTT 3.1.1 の規則） */
  function _w13_match(f,t){
    var fl=f.split("/"),tl=t.split("/"),st=[];
    if((f[0]==="+"||f[0]==="#")&&t[0]==="$")return {ok:false,st:st,why:"$ で始まる名前に、ワイルドカードで始まるフィルタは一致しない"};
    for(var i=0;i<fl.length;i++){
      if(fl[i]==="#"){st.push({i:i,k:"hash"});return {ok:true,st:st,why:(i+1)+" つ目から後のレベル（"+Math.max(0,tl.length-i)+" 個）は # が引き受ける"};}
      if(i>=tl.length){st.push({i:i,k:"miss"});return {ok:false,st:st,why:"トピック名に "+(i+1)+" つ目のレベルが無い"};}
      if(fl[i]==="+"){st.push({i:i,k:"plus"});continue;}
      if(fl[i]===tl[i]){st.push({i:i,k:"eq"});continue;}
      st.push({i:i,k:"ne"});return {ok:false,st:st,why:(i+1)+" つ目のレベルが違う"};
    }
    if(tl.length>fl.length){for(var j=fl.length;j<tl.length;j++)st.push({i:j,k:"extra"});return {ok:false,st:st,why:"トピック名のレベルが "+(tl.length-fl.length)+" 個多い"};}
    return {ok:true,st:st,why:"すべてのレベルが合い、レベルの数も等しい"};
  }
  var _w13_NAMES=["dev/1/temp","dev/2/temp","dev/1/hum","dev/1","dev/1/temp/raw","/dev/1/temp","Dev/1/temp","$SYS/broker/uptime"];

  REG.w13_topic=function(el,U){
    var S=U.S;
    U.head(el,"TOPIC","購読のフィルタとトピック名の照合");
    var row=U.ctrls(el);
    var fs=[U.textin(row,"フィルタ A","dev/+/temp",draw),U.textin(row,"フィルタ B","dev/1/#",draw),U.textin(row,"フィルタ C","#",draw)];
    var row2=U.ctrls(el);
    var add=U.textin(row2,"トピック名を足す","dev/7/temp",draw);
    var pf=U.select(row2,"詳しく比べるフィルタ",["A","B","C"],0,draw);
    var pt=U.select(row2,"詳しく比べるトピック名",_w13_NAMES.concat(["（足したトピック名）"]),8,draw);
    var br=U.btnrow(el);
    U.button(br,"例: 機器ごと・量ごと",function(){fs[0].set("dev/+/temp");fs[1].set("dev/1/#");fs[2].set("#");draw();});
    U.button(br,"例: 空のレベルと親",function(){fs[0].set("dev/+");fs[1].set("+/+/temp");fs[2].set("dev/#");draw();});
    U.button(br,"例: 規則に反するフィルタ",function(){fs[0].set("dev+");fs[1].set("dev/#/temp");fs[2].set("$SYS/#");draw();});
    var box=U.svgbox(el,{scroll:true});var tb=U.mk("div");el.appendChild(tb);var ro=U.readout(el);
    function lvText(s){return s===""?"（空）":s;}
    function draw(){
      var F=fs.map(function(x){return x.get();}),extra=add.get(),names=_w13_NAMES.concat([extra]);
      var bad=F.map(_w13_badFilter),badN=names.map(_w13_badName);
      var head=["トピック名"].concat(F.map(function(f,j){return "ABC"[j]+": <code>"+U.esc(f)+"</code>"+(bad[j]?'<br><span class="warn">'+U.esc(bad[j])+'</span>':"");}));
      var rows=names.map(function(t,i){
        var c=["<code>"+U.esc(t)+"</code>"+(i===names.length-1?"（足した）":"")+(badN[i]?' <span class="warn">'+U.esc(badN[i])+'</span>':"")];
        F.forEach(function(f,j){
          if(bad[j]||badN[i]){c.push("—");return;}
          var m=_w13_match(f,t);c.push(m.ok?'<span class="ok">✓ 一致</span>':'<span style="color:var(--muted)">×</span>');});
        return c;});
      tb.innerHTML=U.tbl(head,rows,["left","center","center","center"]);
      /* 選んだ組をレベルごとに並べる */
      var j=pf.get(),f=F[j],t=names[pt.get()],o=[];
      if(bad[j]||badN[pt.get()]){
        box.set(S.svg(700,40,[S.T(14,24,bad[j]?"フィルタ "+"ABC"[j]+" は規則に反する: "+bad[j]:"このトピック名は使えない: "+badN[pt.get()],"start",11,"alias",true)]));
        ro.innerHTML="規則に反するフィルタやトピック名を送ると、ブローカは接続を切る。";return;
      }
      var m=_w13_match(f,t),fl=f.split("/"),tl=t.split("/"),n=Math.max(fl.length,tl.length),xs=[],x=110;
      for(var i=0;i<n;i++){var w=Math.max(54,U.tw(lvText(fl[i]||""),11,true)+18,U.tw(lvText(tl[i]||""),11,true)+18);xs.push([x,w]);x+=w+14;}
      var W=Math.max(700,x+20),yf=40,yt=118,h=28;
      o.push(S.T(100,yf+19,"フィルタ "+"ABC"[j],"end",11,"purple",true));
      o.push(S.T(100,yt+19,"トピック名","end",11,"signal",true));
      var hashAt=-1;m.st.forEach(function(s){if(s.k==="hash")hashAt=s.i;});
      for(var i2=0;i2<n;i2++){
        var X=xs[i2][0],Wd=xs[i2][1];
        if(i2<fl.length&&!(hashAt>=0&&i2>hashAt)){
          var isH=fl[i2]==="#",isP=fl[i2]==="+";
          var cw=isH?(xs[n-1][0]+xs[n-1][1]-X):Wd;
          o.push(S.RECT(X,yf,Math.max(cw,Wd),h,5,U.soft(isH?"gold":isP?"purple":"panel"),isH?"gold":"purple",1.3));
          o.push(S.T(X+(isH?Math.max(cw,Wd):Wd)/2,yf+19,lvText(fl[i2]),"middle",11,"ink",true,true));
        }
        if(i2<tl.length){
          o.push(S.RECT(X,yt,Wd,h,5,U.soft("signal"),"signal",1.3));
          o.push(S.T(X+Wd/2,yt+19,lvText(tl[i2]),"middle",11,"ink",false,true));
        }
      }
      m.st.forEach(function(s){
        var X=xs[s.i][0]+xs[s.i][1]/2;
        if(s.k==="eq"){o.push(S.L(X,yf+h,X,yt,"green",2));o.push(S.T(X+6,(yf+h+yt)/2+4,"同じ","start",9.5,"green"));}
        else if(s.k==="plus"){o.push(S.L(X,yf+h,X,yt,"purple",2,"4 3"));o.push(S.T(X+6,(yf+h+yt)/2+4,"+ が一致","start",9.5,"purple"));}
        else if(s.k==="ne"){o.push(S.L(X,yf+h,X,yt,"alias",2));o.push(S.X(X,(yf+h+yt)/2,6,"alias",2.2));o.push(S.T(X+9,(yf+h+yt)/2+4,"違う","start",9.5,"alias",true));}
        else if(s.k==="miss"){o.push(S.RECT(xs[s.i][0],yt,xs[s.i][1],h,5,"none","alias",1.3,"4 3"));o.push(S.T(X,yt+19,"（無い）","middle",10,"alias"));o.push(S.L(X,yf+h,X,yt,"alias",1.6,"4 3"));}
        else if(s.k==="extra"){o.push(S.RECT(xs[s.i][0]-2,yt-2,xs[s.i][1]+4,h+4,6,"none","alias",1.8));o.push(S.T(X,yt-8,"余る","middle",9.5,"alias",true));}
        else if(s.k==="hash"){var x0=xs[s.i][0],x1=xs[n-1][0]+xs[n-1][1];o.push(S.RECT(x0,yt+h+6,x1-x0,5,2,U.soft("gold"),"gold",1));o.push(S.T((x0+x1)/2,yt+h+22,"# が残り（"+Math.max(0,tl.length-s.i)+" 個）を引き受ける","middle",9.5,"gold",true));}
      });
      o.push(S.T(14,yt+h+48,(m.ok?"一致する": "一致しない")+": "+m.why,"start",11.5,m.ok?"green":"alias",true));
      box.set(S.svg(W,yt+h+58,o));
      ro.innerHTML="フィルタ "+"ABC"[j]+" <code>"+U.esc(f)+"</code> と <code>"+U.esc(t)+"</code>: <b>"+(m.ok?'<span class="ok">一致する</span>':'<span class="warn">一致しない</span>')+"</b>（"+U.esc(m.why)+"）";
    }
    draw();
  };

  /* ---- デモ 2: PUBLISH の組み立て ---- */
  function _w13_utf8(s){try{return Array.prototype.slice.call(new TextEncoder().encode(s));}catch(e){var o=[];for(var i=0;i<s.length;i++)o.push(s.charCodeAt(i)&255);return o;}}
  function _w13_remlen(n){var o=[];do{var d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d);}while(n>0);return o;}
  function _w13_bin7(v){var s=v.toString(2);while(s.length<7)s="0"+s;return s;}

  REG.w13_publish=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"PUBLISH","PUBLISH（QoS 0）のバイト列と、残りの長さの符号化");
    var row=U.ctrls(el);
    var tp=U.textin(row,"トピック名","dev/1/temp",draw);
    var pl=U.textin(row,"ペイロード（文字）","{\"t\":23.5,\"h\":41.25}",draw,{width:"240px"});
    var row2=U.ctrls(el);
    var ex=U.slider(row2,"ペイロードに足すバイト（中身は 00）",{min:0,max:300,step:1,value:0,fmt:function(v){return F.int(v)+" バイト";},onInput:draw});
    var br=U.btnrow(el);
    function setRem(R){var e=R-2-_w13_utf8(tp.get()).length-_w13_utf8(pl.get()).length;ex.set(Math.max(0,e));draw();}
    U.button(br,"07 章の例に戻す",function(){tp.set("dev/1/temp");pl.set("{\"t\":23.5,\"h\":41.25}");ex.set(0);draw();});
    U.button(br,"残りの長さを 127 に",function(){setRem(127);});
    U.button(br,"128 に",function(){setRem(128);});
    U.button(br,"16,383 に",function(){setRem(16383);});
    U.button(br,"16,384 に",function(){setRem(16384);});
    var hx=U.mk("div");el.appendChild(hx);var box=U.svgbox(el);var ro=U.readout(el);
    function draw(){
      var t=tp.get(),tb=_w13_utf8(t),pb=_w13_utf8(pl.get()),add=ex.get();
      var bad=_w13_badName(t)||(tb.length>65535?"トピック名が 65535 バイトを超える":"");
      var P=pb.length+add,R=2+tb.length+P,rl=_w13_remlen(R),N=1+rl.length+R;
      var head=[0x30].concat(rl,[tb.length>>8,tb.length&255],tb),bytes=head.concat(pb);
      var nh=head.length,show=Math.min(N,nh+Math.min(P,40));
      var cols=["teal"],k;for(k=0;k<rl.length;k++)cols.push("gold");cols.push("muted","muted");for(k=0;k<tb.length;k++)cols.push("purple");
      var names=["1 バイト目（PUBLISH・QoS 0）"];for(k=0;k<rl.length;k++)names.push("残りの長さ（"+(k+1)+" バイト目）");names.push("トピック名の長さ","トピック名の長さ");for(k=0;k<tb.length;k++)names.push("トピック名");
      var shown=[];for(k=0;k<show;k++)shown.push(k<bytes.length?bytes[k]:0);
      hx.innerHTML=U.hexView(shown,function(i){return i<nh?cols[i]:"green";},function(i){return i<nh?names[i]:"ペイロード";})+
        (N>show?'<div class="wnote">… 以下 '+F.int(N-show)+" バイト（ペイロードの続き）は省略</div>":"");
      /* 残りの長さの筆算 */
      var o=[],x0=12,y0=22;
      o.push(S.T(x0,y0,"残りの長さ R = 2 + "+tb.length+" + "+F.int(P)+" = "+F.int(R),"start",11.5,"ink",true));
      o.push(S.T(x0,y0+17,"（トピック名の長さの欄 + トピック名 + ペイロード）","start",9.5,"muted"));
      var g=[],v=R;do{g.push(v%128);v=Math.floor(v/128);}while(v>0);
      o.push(S.T(x0,y0+37,"R = "+g.map(function(d,i){return d+(i?" × 128"+(i>1?"^"+i:""):"");}).join(" + ")+" → 下の桁から 7 ビットずつ","start",10,"muted"));
      var cw=14,bx=x0+74;
      g.forEach(function(d,i){
        var y=y0+50+i*32,more=i<g.length-1,bits=(more?"1":"0")+_w13_bin7(d);
        o.push(S.T(bx-10,y+16,(i+1)+" バイト目","end",10,"ink",true));
        for(var b=0;b<8;b++){var c=b===0?(more?"alias":"green"):"gold";o.push(S.RECT(bx+b*cw,y,cw,24,2,U.soft(c),c,1));o.push(S.T(bx+b*cw+cw/2,y+16,bits[b],"middle",10,"ink",false,true));}
        o.push(S.T(bx+8*cw+10,y+16,"= 0x"+F.hex(rl[i])+"（"+d+"、"+(more?"続く":"終わり")+"）","start",10.5,more?"alias":"green",true));
      });
      var yb=y0+50+g.length*32+10;
      o.push(S.T(x0,yb+4,"最上位ビット: 1 = 続きがある、0 = 終わり。残りの長さの欄は "+rl.length+" バイト","start",10,"ink"));
      o.push(S.T(x0,yb+20,"（"+(R<=127?"127 以下なので 1 バイト":R<=16383?"16,383 以下なので 2 バイト":R<=2097151?"2,097,151 以下なので 3 バイト":"4 バイト")+"）","start",10,"muted"));
      box.set(S.svg(470,yb+30,o));
      var wire=N+78*Math.max(1,Math.ceil(N/1460));
      ro.innerHTML=(bad?'<span class="warn">'+U.esc(bad)+"（ブローカは接続を切る）</span><br>":"")+
        "全体 <b>"+F.int(N)+" バイト</b> = 1 バイト目 1 + 残りの長さの欄 "+rl.length+" + 残り "+F.int(R)+" ・ データ以外 <b>"+F.int(N-P)+" バイト</b> ・ データの割合 "+(N?U.sig(P/N*100,3):0)+" %<br>"+
        "07 章 5 節の数え方（Ethernet・IPv4・TCP。セグメント "+Math.max(1,Math.ceil(N/1460))+" 個）では、線の上で約 "+F.int(wire)+" バイト";
    }
    draw();
  };

  /* ---- デモ 3: QoS ごとの届き方 ---- */
  /* 送り手（機器）からブローカまでの 1 区間。メッセージは 1 つずつ送る（確認待ちは 1 個）。
     どのパケットも確率 p で、送っている途中で接続が切れて失われる。切れたらつなぎ直し、
     永続セッションなら確認の済んでいない PUBLISH（DUP = 1）か PUBREL を送り直す。クリーンセッションなら両方の側で捨てる。 */
  function _w13_qsim(U,N,qos,pers,p,seed){
    var r=U.rng(seed),ev=[],deliv=[],pkts=0,bytes=0,cuts=0,stored={};
    function send(name,up,pid,dup,m){var lost=r.chance(p);pkts++;bytes+=name==="PUBLISH"?(qos?36:34):4;ev.push({k:"p",name:name,up:up,pid:pid,dup:dup,lost:lost,m:m});return !lost;}
    function cut(m){cuts++;bytes+=19+4;ev.push({k:"cut",m:m});if(!pers)stored={};}
    function note(m,t,c){ev.push({k:"n",m:m,t:t,c:c});}
    for(var m=0;m<N;m++){
      deliv[m]=0;var pid=m%65535+1;
      if(qos===0){if(send("PUBLISH",1,0,0,m)){deliv[m]++;note(m,"渡す","green");}else{cut(m);note(m,"失われた","alias");}continue;}
      var st="pub",dup=0,guard=0;
      while(st!=="done"&&guard++<80){
        if(st==="pub"){
          if(!send("PUBLISH",1,pid,dup,m)){cut(m);if(!pers){note(m,deliv[m]?"":"失われた（捨てた）","alias");st="done";}else dup=1;continue;}
          if(qos===1){deliv[m]++;note(m,deliv[m]>1?"重複して渡す":"渡す",deliv[m]>1?"alias":"green");
            if(!send("PUBACK",0,pid,0,m)){cut(m);if(!pers)st="done";else dup=1;continue;}st="done";}
          else{if(stored[pid])note(m,"番号を覚えている → 渡さない","green");else{stored[pid]=1;deliv[m]++;note(m,"番号を覚えて渡す","green");}
            if(!send("PUBREC",0,pid,0,m)){cut(m);if(!pers)st="done";else dup=1;continue;}st="rel";}
        }else{
          if(!send("PUBREL",1,pid,0,m)){cut(m);if(!pers)st="done";continue;}
          if(stored[pid]){delete stored[pid];note(m,"番号を忘れる","purple");}
          if(!send("PUBCOMP",0,pid,0,m)){cut(m);if(!pers)st="done";continue;}st="done";
        }
      }
    }
    var once=0,dupN=0,lostN=0;deliv.forEach(function(d){if(d===1)once++;else if(d>1)dupN++;else lostN++;});
    return {ev:ev,once:once,dup:dupN,lost:lostN,pkts:pkts,bytes:bytes,cuts:cuts,N:N};
  }

  REG.w13_qos=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"QOS","QoS ごとの届き方（接続が切れると、つなぎ直す）");
    var row=U.ctrls(el);
    var q=U.seg(row,["QoS 0","QoS 1","QoS 2"],1,draw);
    var se=U.select(row,"セッション",["永続セッション（送り直す）","クリーンセッション（捨てる）"],0,draw);
    var row2=U.ctrls(el);
    var pp=U.slider(row2,"1 つのパケットの途中で接続が切れる確率",{min:0,max:40,step:1,value:15,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);var seed=13;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el);var ro=U.readout(el);
    function draw(){
      var qos=q.get(),pers=se.get()===0,p=pp.get()/100;
      var res=_w13_qsim(U,20,qos,pers,p,seed),big=_w13_qsim(U,10000,qos,pers,p,seed+7777);
      /* シーケンス図: 最初のいくつかのメッセージ */
      var xa=170,xb=470,y0=40,dy=21,o=[],y=y0+16,last=null,maxRows=22,rows=0,shownM=0;
      o.push(S.RECT(xa-44,6,88,26,7,U.soft("signal"),"signal",1.3));o.push(S.T(xa,23,"機器","middle",11,"signal",true));
      o.push(S.RECT(xb-44,6,88,26,7,U.soft("green"),"green",1.3));o.push(S.T(xb,23,"ブローカ","middle",11,"green",true));
      var body=[];
      for(var i=0;i<res.ev.length;i++){
        var e=res.ev[i];
        if(e.k!=="n"&&rows>=maxRows)break;
        if(e.k==="p"){
          var x1=e.up?xa:xb,x2=e.up?xb:xa,y1=y,y2=y+8,lab=e.name+"（#"+(e.m+1)+(e.dup?", DUP":"")+"）";
          if(e.lost){var fx=x1+(x2-x1)*0.55,fy=y1+(y2-y1)*0.55;body.push(S.L(x1,y1,fx,fy,"alias",1.5,"5 3"));body.push(S.X(fx,fy,5,"alias",2));}
          else body.push(S.ARR(x1,y1,x2,y2,e.up?"ink":"green",1.5,6));
          body.push(S.T((x1+x2)/2,y1-3,lab,"middle",9.5,e.lost?"alias":(e.up?"ink":"green"),e.name==="PUBLISH"));
          last=y2;y+=dy;rows++;shownM=Math.max(shownM,e.m+1);
        }else if(e.k==="cut"){
          body.push(S.L(60,y-4,640,y-4,"faint",1.1,"6 4"));body.push(S.T(640,y-8,"切断 → つなぎ直す（CONNECT・CONNACK）","end",9,"muted"));
          y+=dy*0.8;rows++;
        }else if(e.k==="n"&&e.t&&last!=null){
          body.push(S.T(xb+10,last+3,e.t,"start",9.5,e.c,e.c==="alias"));
        }
      }
      o.push(S.L(xa,32,xa,y,"signal",1.2,"3 4"));o.push(S.L(xb,32,xb,y,"green",1.2,"3 4"));
      o=o.concat(body);
      o.push(S.T(350,y+14,"時間は下へ進む（最初の "+shownM+" 個のメッセージ。番号 #k は k 番目のメッセージ）","middle",9.5,"muted"));
      box.set(S.svg(700,y+22,o));
      function rate(n,N){return U.sig(n/N*100,3)+" %";}
      ro.innerHTML="20 個のうち: 1 回だけ届いた <b>"+res.once+"</b> ・ "+(res.dup?'<span class="warn">2 回以上届いた '+res.dup+"</span>":"2 回以上届いた 0")+" ・ "+(res.lost?'<span class="warn">届かなかった '+res.lost+"</span>":"届かなかった 0")+
        " ・ パケット "+res.pkts+" 個 ・ 切断 "+res.cuts+" 回 ・ MQTT の層で "+F.int(res.bytes)+" バイト（つなぎ直しの CONNECT 19・CONNACK 4 を含む）<br>"+
        "1 万個で数えると: 重複 "+rate(big.dup,big.N)+" ・ 失われた "+rate(big.lost,big.N)+" ・ 1 個あたりのパケット "+U.sig(big.pkts/big.N,3)+" 個<br>"+
        '<span style="color:var(--muted)">'+(qos===0?"QoS 0 は確認が無いので、PUBLISH の途中で切れると失われる。":qos===1?(pers?"QoS 1 は PUBACK の途中で切れると、届いていたものを送り直すので重複する。":"クリーンセッションでは確認待ちを捨てるので、PUBLISH の途中で切れたものは失われる。"):(pers?"QoS 2 は受け手が番号を覚えているので、送り直しても重複しない。":"クリーンセッションでは確認待ちを捨てるので、QoS 2 でも失われうる。"))+"</span>";
    }
    draw();
  };

  /* ---- デモ 4: キープアライブと切断に気づくまで ---- */
  /* 1 秒刻みで動かす。機器は時刻 0 につながり、per 秒ごとに QoS 0 の PUBLISH を送る（0 なら送らない）。
     PINGREQ は、送っていない時間（mode 1 では、受け取っていない時間も）が K に達したら送る。
     NAT の行は、行を通って外へ出たパケットで数え直し、Th 秒たつと消える。消えた後のパケット（CONNECT 以外）は NAT で捨てられる。
     fault: 0 なし、1 時刻 300 s に機器の電源が切れる、2 時刻 300 s に回線（NAT より先）が切れる。 */
  function _w13_kasim(K,per,Th,Tr,fault,mode,Tend){
    var TF=300,ev=[],ok=[0],line=true,alive=true;
    var dev={conn:true,lastTx:0,lastRx:0,ping:null,retry:null},natOut=0,brk={conn:true,lastRx:0};
    var res={detect:null,bclose:null,take:[],pings:0,natDead:[]};
    ev.push({t:0,k:"tx",n:"CONNECT",ok:true});
    function natAlive(t){return Th===Infinity||t-natOut<Th;}
    function send(t,n){
      dev.lastTx=t;var why=null;
      if(!natAlive(t))why="nat";else{natOut=t;ok.push(t);if(!line)why="line";}
      ev.push({t:t,k:"tx",n:n,ok:!why,why:why});
      if(!why&&brk.conn)brk.lastRx=t;
      return !why;
    }
    for(var t=1;t<=Tend;t++){
      if(fault===1&&t===TF)alive=false;
      if(fault===2&&t===TF)line=false;
      if(alive&&dev.conn){
        if(per>0&&t%per===0)send(t,"PUBLISH");
        if(dev.ping===null&&(t-dev.lastTx>=K||(mode===1&&t-dev.lastRx>=K))){
          dev.ping=t;res.pings++;
          if(send(t,"PINGREQ")){dev.lastRx=t;dev.ping=null;ev.push({t:t,k:"rx"});}
        }
        if(dev.ping!==null&&t-dev.ping>=Tr){
          ev.push({t:t,k:"detect"});if(res.detect===null&&t>=TF)res.detect=t;if(t<TF)res.early=res.early||t;
          dev.conn=false;dev.ping=null;dev.retry=t+1;
        }
      }
      if(alive&&!dev.conn&&t>=dev.retry){
        if(line){
          natOut=t;ok.push(t);dev.conn=true;dev.lastTx=t;dev.lastRx=t;
          ev.push({t:t,k:"tx",n:"CONNECT",ok:true});
          if(brk.conn)res.take.push(t);
          brk.conn=true;brk.lastRx=t;
        }else{ev.push({t:t,k:"tx",n:"CONNECT",ok:false,why:"line"});dev.retry=t+30;}
      }
      if(brk.conn&&t-brk.lastRx>=1.5*K){brk.conn=false;ev.push({t:t,k:"bclose"});if(res.bclose===null)res.bclose=t;}
    }
    /* NAT の行が消えていた区間 */
    if(Th!==Infinity){for(var i=0;i<ok.length;i++){var a=ok[i]+Th,b=i+1<ok.length?ok[i+1]:Tend;if(b>a)res.natDead.push([a,Math.min(b,Tend)]);}}
    res.ev=ev;res.TF=TF;return res;
  }

  REG.w13_ka=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"KEEPALIVE","キープアライブと、切断に気づくまでの時間");
    var row=U.ctrls(el);
    var kk=U.slider(row,"キープアライブ K",{values:[10,20,30,45,60,90,120,180,300,600],value:60,fmt:function(v){return v+" s";},onInput:draw});
    var pe=U.slider(row,"測定値を送る間隔（QoS 0）",{values:[0,10,30,60,120,300],value:0,fmt:function(v){return v?v+" s":"送らない";},onInput:draw});
    var row2=U.ctrls(el);
    var th=U.slider(row2,"NAT の保持時間 T_h",{values:[30,60,120,300,600,1800,0],value:300,fmt:function(v){return v?F.time(v):"NAT なし";},onInput:draw});
    var tr=U.slider(row2,"PINGRESP を待つ時間 T_r",{values:[2,5,10,20,30],value:10,fmt:function(v){return v+" s";},onInput:draw});
    var row3=U.ctrls(el);
    var fa=U.select(row3,"故障（時刻 300 s）",["なし","機器の電源が切れる","回線が切れる（NAT より先）"],2,draw);
    var md=U.select(row3,"PINGREQ を送る条件",["送っていない時間が K に達したら（規格の最低限）","送っていない時間か、受け取っていない時間が K に達したら"],0,draw);
    var box=U.svgbox(el,{scroll:true});var ro=U.readout(el);
    function draw(){
      var K=kk.get(),per=pe.get(),Th=th.get()||Infinity,Tr=tr.get(),fault=fa.get(),mode=md.get();
      var Tend=Math.min(1800,Math.max(900,300+1.5*K+150));
      var r=_w13_kasim(K,per,Th,Tr,fault,mode,Tend);
      var x0=150,x1=680,X=function(t){return x0+t/Tend*(x1-x0);},o=[];
      var rowsY=[46,92,134,176],names=["機器が送る","機器が受け取る","NAT の行","ブローカの接続"];
      names.forEach(function(nm,i){o.push(S.T(x0-12,rowsY[i]+4,nm,"end",10.5,"ink",true));o.push(S.L(X(0),rowsY[i],X(Tend),rowsY[i],"grid",1));});
      /* NAT の行 */
      if(Th===Infinity)o.push(S.T(X(0)+4,rowsY[2]-6,"NAT なし","start",9.5,"muted"));
      else{o.push(S.RECT(X(0),rowsY[2]-5,X(Tend)-X(0),10,2,U.soft("green"),"green",1));
        r.natDead.forEach(function(d){o.push(S.RECT(X(d[0]),rowsY[2]-5,Math.max(1.5,X(d[1])-X(d[0])),10,2,U.soft("alias"),"alias",1.2));});}
      /* ブローカの接続 */
      var bOn=0,segs=[];r.ev.forEach(function(e){if(e.k==="bclose"){segs.push([bOn,e.t]);bOn=null;}if(e.k==="tx"&&e.n==="CONNECT"&&e.ok&&bOn===null)bOn=e.t;});
      if(bOn!==null)segs.push([bOn,Tend]);
      segs.forEach(function(sg){o.push(S.RECT(X(sg[0]),rowsY[3]-5,Math.max(1.5,X(sg[1])-X(sg[0])),10,2,U.soft("teal"),"teal",1));});
      /* 送ったもの・受け取ったもの */
      r.ev.forEach(function(e){
        if(e.k==="tx"){var x=X(e.t),c=e.n==="PUBLISH"?"signal":e.n==="PINGREQ"?"teal":"purple";
          if(e.ok){if(e.n==="CONNECT")o.push(S.RECT(x-4,rowsY[0]-4,8,8,1,U.soft(c),c,1.4));else o.push(S.D(x,rowsY[0],c,e.n==="PINGREQ"?3.6:2.4));}
          else o.push(S.X(x,rowsY[0],4,e.why==="nat"?"gold":"alias",1.8));}
        else if(e.k==="rx")o.push(S.D(X(e.t),rowsY[1],"green",3));
        else if(e.k==="detect"){o.push(S.D(X(e.t),rowsY[1],"alias",5));}
        else if(e.k==="bclose"){o.push(S.D(X(e.t),rowsY[3],"alias",5));}
      });
      r.take.forEach(function(t){o.push(S.D(X(t),rowsY[3],"gold",5));});
      if(fault){o.push(S.L(X(r.TF),24,X(r.TF),rowsY[3]+10,"alias",1.5,"5 3"));o.push(S.T(X(r.TF),18,fault===1?"電源が切れる":"回線が切れる","middle",10,"alias",true));}
      /* 時間軸 */
      var ya=rowsY[3]+28,step=Tend<=900?100:200;
      o.push(S.L(X(0),ya,X(Tend),ya,"muted",1.1));
      for(var t=0;t<=Tend;t+=step){o.push(S.L(X(t),ya,X(t),ya+4,"muted",1));o.push(S.T(X(t),ya+16,String(t),"middle",9.5,"muted"));}
      o.push(S.T(x0-12,ya+16,"時刻 [s]","end",9.5,"muted"));
      var lg=[[["signal","● PUBLISH"],["teal","● PINGREQ"],["purple","■ CONNECT"],["green","● PINGRESP"]],
              [["gold","× NAT で捨てられた"],["alias","× 回線で失われた"],["alias","● 機器が気づく・ブローカが切る"],["gold","● つなぎ直しで古い接続を切る"]]];
      lg.forEach(function(line,li){var lx=14;line.forEach(function(l){o.push(S.T(lx,ya+30+li*15,l[1],"start",9.5,l[0],true));lx+=U.tw(l[1],9.5)+14;});});
      box.set(S.svg(700,ya+54,o));
      /* 読み出し */
      var gap=per>0?Math.min(per,K):K,msg=[];
      if(fault){
        msg.push("ブローカが切断に気づく: "+(r.bclose!==null&&r.bclose>=r.TF?"故障から <b>"+(r.bclose-r.TF)+" s</b>":"この範囲では気づかない")+"（上限 1.5 K = "+(1.5*K)+" s）。ウィルメッセージはこのとき出る");
        if(fault===1)msg.push("機器は電源が切れたので、何も気づかない");
        else msg.push("機器が切断に気づく: "+(r.detect!==null?"故障から <b>"+(r.detect-r.TF)+" s</b>（上限 K + T_r = "+(K+Tr)+" s）":'<span class="warn">この範囲では気づかない</span>'+(mode===0&&per>0&&per<K?"。測定値を K より短い間隔で送り続けるので PINGREQ を送らず、QoS 0 の PUBLISH には答えが無い（TCP があきらめるまで気づかない）":"")));
      }else msg.push("故障なし: ブローカの期限 1.5 K = "+(1.5*K)+" s、機器の PINGRESP の期限 T_r = "+Tr+" s");
      if(Th!==Infinity){
        if(gap>=Th)msg.push('<span class="warn">外へ送る間隔が最大 '+gap+" s で、保持時間 "+F.time(Th)+" 以上なので、NAT の行が消える（赤）。消えている間の下りは捨てられ、次のパケットも NAT で捨てられる</span>");
        else msg.push("外へ送る間隔は最大 "+gap+" s で、保持時間 "+F.time(Th)+" より短いので、NAT の行は消えない");
      }
      if(r.take.length)msg.push('<span class="warn">つなぎ直したとき、ブローカはまだ古い接続を持っていたので、それを切った（その接続のウィル offline が出る）: '+r.take.length+" 回</span>");
      msg.push("PINGREQ の数: "+r.pings+"（"+Tend+" s の間）");
      ro.innerHTML=msg.join("<br>");
    }
    draw();
  };
