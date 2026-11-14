  /* ===== 04 章 実例 設計書（温湿度ロガー LG-DES-001） ===== */
  function _w04_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w04_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた整数（63 240 など） */
  function _w04_g(v){var s=String(Math.round(v)),neg=s.charAt(0)==="-";if(neg)s=s.slice(1);return (neg?"−":"")+s.replace(/\B(?=(\d{3})+(?!\d))/g," ");}
  function _w04_ua(v){if(v>=1)return _w04_f(v,2);if(v>=0.01)return _w04_f(v,3);return _w04_f(v,4);}
  function _w04_yr(L){return L>=1?_w04_f(L,1):_w04_f(L,2);}

  /* ---- 3 節: 記録用フラッシュのリングバッファと起動時の走査 ---- */
  var _W04_SPR=510,_W04_NS=126,_W04_CAPREQ=52560;
  REG.w04_flash=function(el,U){
    var S=U.S;
    U.head(el,"FLASH RING","記録用フラッシュ — リングバッファ・空きのセクタ・書きかけの記録と起動時の走査");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"容量に達したときの動作",["上書き（初期値）","記録を止める"],0,function(){if(mode.get()===0&&stopped){stopped=false;scanlog=[];msg='上書きの設定にしたので、記録を開始すれば、最も古いセクタを消して書き続ける';}draw();});
    var iv=U.slider(r1,"記録の間隔",{values:[1,10,60],value:10,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var b1=U.btnrow(el);
    U.button(b1,"+1 件",function(){add(1);});
    U.button(b1,"+1 日",function(){add(1440/iv.get());});
    U.button(b1,"+1 セクタ分（510 件）",function(){add(_W04_SPR);});
    U.button(b1,"+30 日",function(){add(30*1440/iv.get());});
    U.button(b1,"本文の例（空から）",function(){mode.set(0);iv.set(10);reset();draw();});
    var b2=U.btnrow(el);
    var pulls=[["記録の書き込み中に電池を抜く","rec"],["書き終わりの印の書き込み中に抜く","commit"],["空きのセクタの消去中に抜く","erase"],["セクタの頭の書き込み中に抜く","head"]];
    var pb=pulls.map(function(p){return U.button(b2,p[0],function(){pull(p[1]);});});
    var bin=U.button(b2,"電池を入れる（起動時の走査）",function(){boot();});
    var box=U.svgbox(el),ro=U.readout(el);
    var sec,cur,seq,stopped,off,msg,scanlog,erases,total,lastTorn;
    function reset(){sec=[];for(var k=0;k<_W04_NS;k++)sec.push({st:"erased",seq:-1,n:0,torn:{}});
      cur=0;seq=0;sec[0].st="open";sec[0].seq=0;stopped=false;off=false;msg="";scanlog=[];erases=[];for(var j=0;j<_W04_NS;j++)erases.push(0);total=0;lastTorn=null;}
    function held(){var n=0;sec.forEach(function(s){if(s.st==="open"||s.st==="full"){n+=s.n;for(var t in s.torn)if(s.torn.hasOwnProperty(t))n--;}});return n;}
    function nfull(){var n=0;sec.forEach(function(s){if(s.st==="full")n++;});return n;}
    /* 書いているセクタが満ちたときに、次のセクタへ移る。返り値 false なら止めた */
    function advance(interrupt){
      if(mode.get()===1&&nfull()+1>=_W04_NS-1){sec[cur].st="full";stopped=true;return false;}
      sec[cur].st="full";var nx=(cur+1)%_W04_NS;
      if(interrupt==="head"){sec[nx].st="bad";sec[nx].seq=-1;sec[nx].n=0;sec[nx].torn={};return "off";}
      cur=nx;seq++;sec[cur]={st:"open",seq:seq,n:0,torn:{}};
      var sp=(cur+1)%_W04_NS;
      if(sec[sp].st==="full"||sec[sp].st==="bad"){   /* 最も古いセクタを消して、空きのセクタにする */
        if(interrupt==="erase"){sec[sp].st="bad";sec[sp].n=0;sec[sp].torn={};return "off";}
        sec[sp]={st:"erased",seq:-1,n:0,torn:{}};erases[sp]++;}
      return true;}
    function add(n){if(off){msg='電池が抜けている。「電池を入れる」で起動する';draw();return;}
      n=Math.round(n);msg="";scanlog=[];
      for(var i=0;i<n;i++){if(stopped)break;
        if(sec[cur].n>=_W04_SPR){if(advance()===false)break;}
        sec[cur].n++;total++;}
      draw();}
    function pull(kind){if(off){msg='電池はもう抜けている';draw();return;}
      scanlog=[];
      if(stopped){msg='止める設定で容量に達して停止中なので、記録の書き込みも消去も頭の書き込みも起きない';draw();return;}
      if(kind==="rec"||kind==="commit"){
        if(sec[cur].n>=_W04_SPR){var a=advance();if(a===false){draw();return;}}
        sec[cur].torn[sec[cur].n]=kind;sec[cur].n++;total++;lastTorn=kind;
        msg=kind==="rec"?'記録 8 B を書いている途中で電池が抜けた。書き終わりの印（ビット 7）は 1 のまま':'書き終わりの印を書いている途中で電池が抜けた。記録の値はそろっているが、印は 1 のままかもしれない（悪いほうを描いた）';}
      else if(kind==="erase"){ /* 回り込むまで書き進め、最も古いセクタを消している所で抜く */
        if(mode.get()===1){msg='止める設定では、記録の領域の消去は起きない（125 セクタが満ちたら止める）';draw();return;}
        for(var g=0;g<300;g++){var need=_W04_SPR-sec[cur].n;sec[cur].n=_W04_SPR;total+=need;
          var sp2=(cur+2)%_W04_NS;
          if(sec[sp2].st==="full"||sec[sp2].st==="bad"){advance("erase");break;}
          if(advance()===false){draw();return;}}
        msg='回り込むまで書き進め、次のセクタへ移ってから最も古いセクタを消している途中で電池が抜けた（そのセクタは消し残しのまま）';}
      else{ /* 頭: 書いているセクタを満たし、次のセクタを開く所で抜く */
        var need2=_W04_SPR-sec[cur].n;sec[cur].n=_W04_SPR;total+=need2;
        if(advance("head")===false){draw();return;}
        msg='書いているセクタが満ち、次のセクタの頭（通し番号と CRC）を書いている途中で電池が抜けた';}
      off=true;draw();}
    function boot(){if(!off){msg='電池は入っている（走査はリセットのたびに行う。ここでは抜いた後に試す）';draw();return;}
      off=false;scanlog=[];
      /* ① 頭を読む */
      var best=-1,bi=-1;sec.forEach(function(s,k){if((s.st==="open"||s.st==="full")&&s.seq>best){best=s.seq;bi=k;}});
      scanlog.push("① 126 の頭を読み、通し番号の最も大きいセクタ "+bi+"（通し番号 "+best+"）を書いているセクタとした"+(sec.some(function(s){return s.st==="bad";})?"。頭の CRC が合わないセクタは数えない":""));
      cur=bi;seq=best;
      /* ② 書いているセクタを頭から読む */
      var s=sec[cur],nt=0;for(var t in s.torn)if(s.torn.hasOwnProperty(t))nt++;
      if(s.st==="full"){scanlog.push("② セクタ "+cur+" は満ちている。次のセクタを開く");}
      else scanlog.push("② セクタ "+cur+" を頭から読み、"+s.n+" 番目の場所から書く"+(nt?"（書き終わりの印が 1 の記録 "+nt+" 件は書きかけとして使わない）":""));
      /* ③ 空きのセクタ */
      var nx=(cur+1)%_W04_NS;
      if(s.st==="full"){
        if(sec[nx].st==="bad"){sec[nx]={st:"erased",seq:-1,n:0,torn:{}};erases[nx]++;scanlog.push("③ 次のセクタ "+nx+" は頭が壊れている（全部が FF でない）ので、消し直した");}
        s.st="full";var a=advance();scanlog.push("　 セクタ "+cur+" を通し番号 "+seq+" で開いた");}
      else{if(sec[nx].st==="bad"){sec[nx]={st:"erased",seq:-1,n:0,torn:{}};erases[nx]++;scanlog.push("③ 空きのセクタ "+nx+" に消し残しがあったので、消し直した");}
        else scanlog.push("③ 空きのセクタ "+nx+" は全部が FF");}
      scanlog.push("④ 設定の 2 面を読み、CRC の合う新しいほうを使う");
      msg='起動時の走査を終えた。電池を抜いた時点までに書き終えた記録は、すべて残っている（SR-W04）';
      draw();}
    function draw(){
      pb.forEach(function(b){b.disabled=off;});bin.disabled=!off;
      var nar=_w04_nar(box),Wd=nar?400:700,o=[],cols=nar?14:21,cw=nar?26:30,ch=nar?22:24,x0=nar?14:20,y0=26;
      o.push(S.T(x0,16,"記録の 126 セクタ（数字はセクタの番号。1 マス = 510 件）"+(off?"　電池が抜けている":""),"start",10,off?"alias":"ink",true));
      var oldest=-1,os=1e9;sec.forEach(function(s,k){if((s.st==="full"||s.st==="open")&&s.seq>=0&&s.seq<os&&s.n>0){os=s.seq;oldest=k;}});
      var spare=(cur+1)%_W04_NS;
      sec.forEach(function(s,k){var cx=x0+(k%cols)*cw,cy=y0+Math.floor(k/cols)*(ch+4),fill="panel",c="line",lw=1,col="muted";
        if(s.st==="full"){fill="var(--purple-soft)";c="purple";col="purple";}
        else if(s.st==="open"){fill="var(--screen)";c="purple";lw=2;col="purple";}
        else if(s.st==="bad"){fill="var(--alias-soft)";c="alias";col="alias";}
        else if(k===spare&&!stopped){fill="var(--green-soft)";c="green";col="green";}
        o.push(S.RECT(cx,cy,cw-3,ch,3,fill,c,lw));
        if(s.st==="open"&&s.n>0){var f=s.n/_W04_SPR;o.push(S.RECT(cx,cy+ch*(1-f),cw-3,ch*f,0,"purple","none",0));}
        var nt=0;for(var t in s.torn)if(s.torn.hasOwnProperty(t))nt++;
        if(nt)o.push(S.X(cx+(cw-3)/2,cy+ch/2,4,"alias",2));
        else o.push(S.T(cx+(cw-3)/2,cy+ch/2+3.5,String(k),"middle",8.5,s.st==="open"&&s.n/_W04_SPR>0.5?"screen":col,s.st==="open"));
        if(k===oldest&&s.st!=="open")o.push(S.RECT(cx,cy,cw-3,ch,3,"none","ink",2));});
      var yb=y0+Math.ceil(_W04_NS/cols)*(ch+4)+6;
      /* 凡例 */
      var lg=[["none","ink","最も古い"],["var(--purple-soft)","purple","満ちた"],["var(--screen)","purple","書いている"],["var(--green-soft)","green","空きのセクタ"],["var(--alias-soft)","alias","消し残し・頭が壊れた"],["panel","line","まだ使っていない"]],lx=x0;
      lg.push(["x","alias","書きかけの記録がある"]);
      lg.forEach(function(g){var wi=15+U.tw(g[2],9);if(lx>x0&&lx+wi>Wd-8){lx=x0;yb+=16;}
        if(g[0]==="x")o.push(S.X(lx+5.5,yb+5.5,4,"alias",2));else o.push(S.RECT(lx,yb,11,11,2,g[0],g[1],1));
        o.push(S.T(lx+15,yb+9.5,g[2],"start",9,"muted"));lx+=wi+14;});
      yb+=24;
      /* 書いているセクタの終わりの拡大 */
      var s=sec[cur],m=Math.max(0,Math.min(s.n-5,_W04_SPR-8));
      o.push(S.T(x0,yb+10,"書いているセクタ "+cur+" の "+m+"〜"+(m+7)+" 番目の場所","start",9.5,"ink",true));
      for(var j=0;j<8;j++){var idx=m+j,x=x0+j*(nar?46:62),st=idx<s.n?(s.torn[idx]?"書きかけ":"記録"):"FF",c2=st==="記録"?"purple":(st==="FF"?"muted":"alias");
        o.push(S.RECT(x,yb+16,(nar?42:58),20,3,st==="FF"?"panel":U.soft(c2),c2,1));o.push(S.T(x+(nar?21:29),yb+30,st,"middle",9,c2,true));
        if(idx===s.n&&!off&&!stopped)o.push(S.ARR(x+(nar?21:29),yb+52,x+(nar?21:29),yb+38,"green",1.4,6));}
      var H=yb+60;
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var n=held(),days=n*iv.get()/1440,mx=Math.max.apply(null,erases),tot=0;erases.forEach(function(e){tot+=e;});
      var h="保存している記録: <b>"+_w04_g(n)+" 件</b>（記録の間隔 "+iv.get()+" 分で "+_w04_f(days,1)+" 日分）。書いた記録の合計 "+_w04_g(total)+" 件<br>";
      h+="SR-F04（52 560 件）: "+(n>=_W04_CAPREQ?'<span class="ok">保存している件数が 52 560 件以上</span>':(total>=63750?'<span class="warn">52 560 件より少ない</span>':"まだ容量に達していない（上書きのとき、満ちた後は 63 240〜63 750 件を保つ）"))+"<br>";
      h+="セクタの消去: 合計 "+_w04_g(tot)+" 回、1 セクタで最も多いのは "+mx+" 回（書き換えの上限 10 万回）<br>";
      if(stopped)h+='<span class="warn">止める設定で 125 セクタ（63 750 件）が満ちたので、REC_FULL を返して停止中になった（SR-F05）</span>。記録を続けるには、読み出してから記録を消す<br>';
      if(msg)h+=(off?'<span class="warn">'+msg+'</span>':msg)+"<br>";
      if(scanlog.length)h+=scanlog.join("<br>")+"<br>";
      ro.innerHTML=h+'<div class="wnote">1 マスは記録用フラッシュの 1 セクタ（4 KiB）で、頭の 16 B と記録 510 件が入る。書いているセクタの次は、いつも消しておく（空きのセクタ）。「+30 日」は記録の間隔で件数が変わる（10 分なら 4 320 件、1 分なら 43 200 件）。電池を抜いた後は、「電池を入れる」で起動時の走査（図 3-3 の ①〜④）を行う。</div>';
    }
    reset();draw();
  };

  /* ---- 4 節: 測定 1 回の時間割と電流 ---- */
  REG.w04_seq=function(el,U){
    var S=U.S;
    U.head(el,"ONE MEASUREMENT","測定 1 回の時間割と電流 — 1 回に電池から流れ出る電荷");
    var r1=U.ctrls(el);
    var ts=U.slider(r1,"センサの測定の時間",{values:[1.6,5,12.5],value:5,fmt:function(v){return v+" ms";},onInput:function(){draw();}});
    var wait=U.select(r1,"測る間のマイコン",["眠って待つ（2 µA）","起きたまま待つ（3 mA）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var wr=U.select(r2,"記録の書き方",["1 件ずつ書く（本文の設計）","32 件をまとめて書く"],0,function(){draw();});
    var cm=U.select(r2,"書き終わりの印",["書く（本文の設計）","書かない"],0,function(){draw();});
    var ov=U.select(r2,"この回に重なる処理",["なし","セクタの消去（510 回に 1 回）","電池の電圧の測定（1 時間に 1 回）"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){ts.set(5);wait.set(0);wr.set(0);cm.set(0);ov.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 区間: [始め, 終わり, 部品, 状態, 電流 mA] */
    function segs(p){var t=p.ts,o=[],w0=0.3,rd=0.4,tx=0.3,pw=0.7,fin=0.1;
      o.push([0,w0,"mcu","動作",3.0]);
      o.push([w0,w0+t,"mcu",p.awake?"待つ":"眠り",p.awake?3.0:0.002]);
      o.push([w0,w0+t,"sen","測る",0.3]);
      var a=w0+t;o.push([a,a+rd,"mcu","動作",3.0]);a+=rd;
      if(p.write){o.push([a,a+tx,"mcu","動作",3.0]);o.push([a,a+tx,"fla","受ける",0.025]);a+=tx;
        o.push([a,a+pw,"mcu","眠り",0.002]);o.push([a,a+pw,"fla","書く",5.0]);a+=pw;
        o.push([a,a+fin,"mcu","動作",3.0]);
        if(p.commit){o.push([a+0.02,a+0.07,"fla","印",5.0]);o.push([a,a+0.02,"fla","受ける",0.025]);o.push([a+0.07,a+fin,"fla","受ける",0.025]);}
        else o.push([a,a+fin,"fla","受ける",0.025]);
        a+=fin;}
      else{o.push([a,a+0.1,"mcu","動作",3.0]);a+=0.1;}
      if(p.ov===1){o.push([a,a+45,"fla","消去",10.0]);o.push([a,a+45,"mcu","眠り",0.002]);a+=45;}
      if(p.ov===2){o.push([a,a+1,"mcu","動作",3.0]);o.push([a,a+1,"bat","試しの負荷",8.0]);a+=1;}
      return {s:o,end:a};}
    /* 動作の電荷（眠りと待機を除く）[µC] */
    function charge(sg){var q=0;sg.forEach(function(g){if(g[4]>=0.1)q+=g[4]*(g[1]-g[0]);});return q;}
    function draw(){
      var p={ts:ts.get(),awake:wait.get()===1,write:wr.get()===0,commit:cm.get()===0,ov:ov.get()};
      var R=segs(p),q=charge(R.s);
      /* 平均（1 回あたり）: まとめて書くなら書き込みは 32 回に 1 回、消去は 510 回に 1 回、電池の測定は 6 回に 1 回 */
      var pn={ts:p.ts,awake:p.awake,write:true,commit:p.commit,ov:0},qw=charge(segs(pn).s);
      var pnw={ts:p.ts,awake:p.awake,write:false,commit:p.commit,ov:0},qn=charge(segs(pnw).s);
      var batch=wr.get()===1,qavg=(batch?(qn*31+qw)/32:qw)+450/_W04_SPR,save=batch?31*(qw-qn)/32:0;
      var q0=3.3+1.5+3.5+0.25+450/_W04_SPR;     /* 本文の設計の 1 回あたり 9.43 µC */
      var base=4.1714,dI=(qavg-q0)*144/86400,Itot=base+dI,L=180/(Itot/1000)/8760;
      var nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* 時間の軸: 長い区間（5 ms を超える）は縮めて描く */
      var cap=5.5,pts=[],tl=[];R.s.forEach(function(g){pts.push(g[0]);pts.push(g[1]);});pts.push(-0.4);pts=pts.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
      var map=[[pts[0],0]];for(var i=1;i<pts.length;i++){var d=pts[i]-pts[i-1],dd=d>cap?cap:d;map.push([pts[i],map[i-1][1]+dd]);if(d>cap)tl.push([pts[i-1],pts[i]]);}
      var tot=map[map.length-1][1]+0.6,x0=nar?78:100,x1=Wd-14;
      function X(t){if(t<=map[0][0])return x0;for(var i=1;i<map.length;i++){if(t<=map[i][0]){var a=map[i-1],b=map[i],f=(t-a[0])/(b[0]-a[0]||1);return x0+(a[1]+f*(b[1]-a[1]))/tot*(x1-x0);}}return x0+(map[map.length-1][1]+(t-map[map.length-1][0]))/tot*(x1-x0);}
      var rows=[["mcu","マイコン","purple",34],["sen","センサ","teal",62],["fla","フラッシュ","teal",90],["bat","電圧を測る","gold",118]];
      o.push(S.T(8,16,"時間割（記録の時刻を 0 とする。≈ の区間は縮めて描いた）","start",10,"ink",true));
      rows.forEach(function(r){o.push(S.T(x0-6,r[3]+13,r[1],"end",9.5,"ink",true));o.push(S.RECT(x0,r[3],x1-x0,18,2,"panel","line",0.6));});
      R.s.forEach(function(g){var r=rows.filter(function(q){return q[0]===g[2];})[0],on=g[4]>=0.02,c=r[2];
        o.push(S.RECT(X(g[0]),r[3],Math.max(1,X(g[1])-X(g[0])),18,2,on?U.soft(c):"panel",on?c:"line",1));
        if(on&&X(g[1])-X(g[0])>U.tw(g[3],9)+4)o.push(S.T((X(g[0])+X(g[1]))/2,r[3]+13,g[3],"middle",9,c,true));});
      tl.forEach(function(b){var xm=(X(b[0])+X(b[1]))/2;o.push(S.T(xm,30,"≈ "+_w04_f(b[1]-b[0],b[1]-b[0]>=10?0:1)+" ms","middle",9,"muted",true,false,null,true));});
      /* 電流（対数の目盛） */
      var yp=172,hp=nar?96:110,P=U.plot(x0,yp,x1-x0,hp,[0,1],[0.001,20],{ylog:true});
      [0.001,0.01,0.1,1,10].forEach(function(v){o.push(S.L(x0,P.Y(v),x1,P.Y(v),"grid",1));o.push(S.T(x0-6,P.Y(v)+3,v>=1?v+" mA":(v*1000)+" µA","end",9,"muted"));});
      var ev=[];R.s.forEach(function(g){ev.push(g[0]);ev.push(g[1]);});ev.push(-0.4);ev.push(R.end+0.5);ev=ev.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
      var sp=[];for(var k=0;k<ev.length-1;k++){var tm=(ev[k]+ev[k+1])/2,I=0.0025;R.s.forEach(function(g){if(tm>=g[0]&&tm<g[1]&&g[4]>=0.02)I+=g[4];});
sp.push([X(ev[k]),P.Y(I)]);sp.push([X(ev[k+1]),P.Y(I)]);}
      o.push(S.PL(sp,"signal",2));
      o.push(S.L(x0,yp+hp,x1,yp+hp,"muted",1.2));
      o.push(S.T(8,yp-14,"電流の合計（対数の目盛）","start",10,"ink",true));
      var H=yp+hp+18;
      box.set(S.svg(Wd,H,o));
      var h="この回の動作の電荷: <b>"+_w04_f(q,2)+" µC</b>"+(batch?"（まとめて書くとき、32 回のうち書かない 31 回の 1 回）":"（0.1 mA 以上の動作。本文の設計のふつうの回は 8.55 µC）")+"<br>";
      h+="1 回あたりの平均: <b>"+_w04_f(qavg,2)+" µC</b>（消去 450 µC を 510 回に割り振った "+_w04_f(450/_W04_SPR,2)+" µC を含む"+(batch?"。書き込みは 32 回に 1 回":"")+"。本文の設計は 9.43 µC）<br>";
      h+="1 日（144 回）: "+_w04_g(qavg*144)+" µC。平均電流は"+(Math.abs(dI)<0.00005?"本文と同じ "+_w04_ua(Itot)+" µA":"本文の 4.17 µA から "+(dI>=0?"+":"−")+_w04_ua(Math.abs(dI))+" µA で "+_w04_ua(Itot)+" µA")+"、電池寿命 "+_w04_yr(L)+" 年<br>";
      if(p.ov===1)h+="消去の回は、消去だけで 450 µC（ふつうの回の "+_w04_f(450/8.55,0)+" 倍）。それでも 510 回に 1 回なので、1 回あたりでは 0.88 µC<br>";
      if(p.ov===2)h+="電池の電圧の測定は、試しの負荷 8 mA とマイコン 3 mA を 1 ms（11 µC）。1 時間に 1 回なので平均電流では 0.003 µA<br>";
      if(p.awake)h+='<span class="warn">測る間も起きていると、1 回に '+_w04_f(3*p.ts,1)+' µC 増える</span>（センサの測定の時間 × 3 mA）<br>';
      if(batch)h+='<span class="warn">まとめて書くと、1 回あたり '+_w04_f(save,2)+' µC 減るが、平均電流では '+_w04_ua(save*144/86400)+' µA（'+_w04_f(save*144/86400/base*100,1)+' %）にすぎない。電池を抜くと、まだ書いていない最大 31 件を失う（SR-W04・SR-R05 を満たさない）</span><br>';
      if(!p.commit)h+='<span class="warn">書き終わりの印を書かないと、書いている途中で電池が抜けた記録を、起動時の走査で見分けられない</span>（減る電荷は 1 回 0.25 µC）<br>';
      ro.innerHTML=h+'<div class="wnote">電流は例の値: マイコン 動作 3 mA・眠り 2 µA、センサ 測定 0.3 mA、フラッシュ 書き込み 5 mA・受ける 25 µA・消去 10 mA、試しの負荷 8 mA。眠りの電流（合わせて 2.55 µA）は、1 回の電荷に入れずに 5.1 の予算の眠りの行で数える。</div>';
    }
    draw();
  };

  /* ---- 5 節: 電力の予算（s04/check.py の budget と同じ計算） ---- */
  var _W04_DAY=86400;
  function _w04_budget(p){
    var nM=1440/p.iv,tAct=p.act*1e-3*nM,tAdv=p.adv===0?p.press*(p.win/0.1)*2e-3:(p.adv===1?_W04_DAY/1*2e-3:_W04_DAY/0.1*2e-3),tConn=p.read/7*60*0.2;
    var tSen=5e-3*nM,tWr=0.7e-3*nM,tCm=0.05e-3*nM,tEr=45e-3*nM/510,ton=p.on*1e-3;
    var n30=_W04_DAY/30*((p.alarm||p.low)?2:1),ncom=(p.press*p.win+p.read/7*60)/2,nst=p.press,tDisp=(n30+ncom+nst)*0.01e-3,tBat=24e-3;
    var it=[["マイコン","眠り",p.sl*1e-3,_W04_DAY-(tAct+tAdv+tConn+tDisp+tBat)],["マイコン","動作（測定と記録）",3.0,tAct],["マイコン","動作（表示を始める）＊",3.0,tDisp],
      ["マイコン","動作（電池の電圧を測る）＊",3.0,tBat],["マイコン","送信（受付）",5.0,tAdv],["マイコン","送信（接続）",5.0,tConn],
      ["センサ","待機",0.05e-3,_W04_DAY-tSen],["センサ","測定",0.3,tSen],["フラッシュ","眠り",0.5e-3,_W04_DAY-(tWr+tCm+tEr)],["フラッシュ","書き込み（記録）",5.0,tWr],
      ["フラッシュ","書き込み（印）＊",5.0,tCm],["フラッシュ","消去",10.0,tEr],["電圧を測る回路","試しの負荷＊",8.0,tBat],
      ["LED",p.alarm?"警報の表示":(p.low?"電池少の表示":"記録中の表示"),2.0,n30*ton],["LED","通信中の表示",2.0,ncom*ton],["LED","状態の応答",2.0,nst*ton]];
    var tot=0;it.forEach(function(r){r.push(r[2]*r[3]/_W04_DAY*1000);tot+=r[4];});
    return {it:it,tot:tot,lim:180/8760*1000};}
  var _W04_P0={iv:10,sl:2.0,act:1.1,on:20,adv:0,win:120,press:1,read:1,alarm:false,low:false,temp:0};
  var _W04_QT=[180,178.2,120.9],_W04_DQ=5.4;
  REG.w04_power=function(el,U){
    var S=U.S;
    U.head(el,"POWER BUDGET","ロガーの電力の予算 — 設計のパラメータと使い方を変えて、平均電流と電池寿命を比べる");
    var r1=U.ctrls(el);
    var sl=U.slider(r1,"マイコンの眠りの電流",{min:0.5,max:10,step:0.1,value:2.0,fmt:function(v){return _w04_f(v,1)+" µA";},onInput:draw});
    var act=U.slider(r1,"測定 1 回のマイコンの動作",{values:[0.5,1.1,2,5,10,20],value:1.1,fmt:function(v){return v+" ms";},onInput:draw});
    var on=U.slider(r1,"表示の 1 回の点灯",{values:[5,10,20,50,100,150,200],value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var adv=U.select(r2,"アドバタイズの仕方",["A: 受付の窓の間だけ 100 ms ごと","B: 常に 1 秒ごと（SR-U06 の変更が要る）","C: 常に 100 ms ごと（SR-U06 の変更が要る）"],0,draw);
    var win=U.slider(r2,"受付の窓の長さ",{values:[30,60,120,300,600],value:120,fmt:function(v){return v>=60?(v/60)+" 分":v+" 秒";},onInput:draw});
    var tmp=U.select(r2,"使う温度と使える電荷",["25 °C（設計で使う容量 180 mAh）","0 °C で使い続ける（178 mAh）","−20 °C で使い続ける（121 mAh）"],0,draw);
    var r3=U.ctrls(el);
    var iv=U.slider(r3,"記録の間隔",{values:[1,2,5,10,15,20,30,60],value:10,fmt:function(v){return v+" 分";},onInput:draw});
    var press=U.slider(r3,"短押しの回数",{values:[0,1,2,5,10],value:1,fmt:function(v){return "1 日に "+v+" 回";},onInput:draw});
    var read=U.slider(r3,"読み出しの回数",{values:[0,1,2,7],value:1,fmt:function(v){return "1 週間に "+v+" 回";},onInput:draw});
    var r4=U.ctrls(el);
    var alarm=U.checkbox(r4,"警報の表示が続く（30 秒ごとに赤 2 回）",false,draw);
    var low=U.checkbox(r4,"電池少の期間（ΔQ = 5.4 mAh）を入れる",false,draw);
    var br=U.btnrow(el);
    function setp(p){sl.set(p.sl);act.set(p.act);on.set(p.on);adv.set(p.adv);win.set(p.win);iv.set(p.iv);press.set(p.press);read.set(p.read);alarm.set(p.alarm);low.set(p.low);tmp.set(p.temp);}
    U.button(br,"本文の例",function(){setp(_W04_P0);draw();});
    U.button(br,"電池少の期間を入れる",function(){setp(_W04_P0);low.set(true);draw();});
    U.button(br,"警報の表示が続く",function(){setp(_W04_P0);alarm.set(true);draw();});
    U.button(br,"−20 °C で使い続ける",function(){setp(_W04_P0);tmp.set(2);draw();});
    U.button(br,"代案 B（常に 1 秒ごと）",function(){setp(_W04_P0);adv.set(1);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var p={sl:sl.get(),act:act.get(),on:on.get(),adv:+adv.get(),win:win.get(),iv:iv.get(),press:press.get(),read:read.get(),alarm:alarm.get(),low:false},b=_w04_budget(p);
      var Q=_W04_QT[+tmp.get()],L,days=null;
      b.lim=Q/8760*1000;   /* 上限は、使える電荷を 1 年で使い切る平均電流 */
      if(low.get()){var bl=_w04_budget({sl:p.sl,act:p.act,on:p.on,adv:p.adv,win:p.win,iv:p.iv,press:p.press,read:p.read,alarm:p.alarm,low:true});
        var Il=p.alarm?b.tot:bl.tot;L=((Q-_W04_DQ)/(b.tot/1000)+_W04_DQ/(Il/1000))/8760;days=_W04_DQ/(Il/1000)/24;}
      else L=Q/(b.tot/1000)/8760;
      var nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var xb0=nar?168:196,xb1=nar?330:430,X=function(v){return xb0+(Math.log10(Math.max(v,1e-4))+4)/6*(xb1-xb0);},y0=30,rh=nar?16:17,n=b.it.length+1;
      o.push(S.T(8,16,"平均電流の内訳（＊はこの設計で足した項目）","start",10,"ink",true));
      [[1e-4,"0.0001"],[1e-2,"0.01"],[1,"1"],[100,"100"]].forEach(function(t){o.push(S.L(X(t[0]),y0-2,X(t[0]),y0+rh*n+2,"grid",1));o.push(S.T(X(t[0]),y0+rh*n+15,t[1],"middle",9.5,"muted"));});
      o.push(S.T((xb0+xb1)/2,y0+rh*n+30,"平均電流 [µA]（対数の目盛）","middle",9.5,"muted"));
      var mx=0,mk=0;b.it.forEach(function(r,k){if(r[4]>mx){mx=r[4];mk=k;}});
      var xl=X(b.lim);o.push(S.L(xl,y0-2,xl,y0+rh*n,"signal",1.6));
      b.it.concat([["合計","",0,0,b.tot]]).forEach(function(r,k){var y=y0+k*rh,last=k===n-1,add=/＊/.test(r[1]),c=last?"purple":(add?"gold":(k===mk?"alias":"teal"));
        o.push(S.T(xb0-6,y+12.5,r[1]?r[0]+" "+r[1]:r[0],"end",nar?8.5:9.5,"ink",last||r[4]>=0.4));
        o.push(S.RECT(xb0,y+3,Math.max(1,X(r[4])-xb0),rh-6,2,U.soft(c),c,1));
        o.push(S.T(X(r[4])+4,y+12.5,_w04_ua(r[4])+" µA","start",9,c,true,false,null,true));});
      o.push(S.T(xl-2,y0-5,"上限 "+_w04_f(b.lim,1)+" µA","end",9.5,"signal",true,false,null,true));
      /* 電池寿命 */
      var lx=nar?20:470,ly=nar?y0+rh*n+64:52,lw=nar?340:200,Lmax=Math.max(6,Math.ceil(L/2)*2),XL=function(v){return lx+Math.min(v,Lmax)/Lmax*lw;},ok=L>=1,good=L>=2;
      o.push(S.T(nar?8:460,ly-24,"電池寿命（Q = "+_w04_f(Q,Q%1?1:0)+" mAh）","start",10,"ink",true));
      var cL=good?"green":(ok?"gold":"alias");
      o.push(S.RECT(lx,ly,Math.max(1,XL(L)-lx),24,3,U.soft(cL),cL,1.3));
      var lt=_w04_yr(L)+" 年",inside=XL(L)-lx>U.tw(lt,12)+12;
      o.push(S.L(XL(1),ly-8,XL(1),ly+30,"signal",1.6));o.push(S.L(XL(2),ly-8,XL(2),ly+30,"purple",1.3,"5 3"));
      o.push(S.T(inside?XL(L)-6:XL(L)+6,ly+17,lt,inside?"end":"start",12,cL,true,false,null,!inside));
      o.push(S.L(lx,ly+30,lx+lw,ly+30,"muted",1));
      for(var v=0;v<=Lmax;v+=Lmax>10?4:2){o.push(S.L(XL(v),ly+30,XL(v),ly+34,"muted",1));o.push(S.T(XL(v),ly+46,String(v),"middle",9.5,"muted"));}
      o.push(S.T(lx+lw/2,ly+62,"電池寿命 [年]","middle",9.5,"muted"));
      o.push(S.LEGL(lx,ly+84,[["signal",null,"要求 1 年"],["purple","5 3","目標 2 年"]],9.5,12));
      o.push(S.T(lx,ly+106,"余裕（上限 ÷ 平均電流）"+_w04_f(b.lim/b.tot,1)+" 倍","start",10,ok?"ink":"alias",true));
      box.set(S.svg(Wd,nar?ly+118:Math.max(y0+rh*n+40,ly+118),o));
      var cond=(p.iv===10&&p.press===1&&p.read===1&&!p.alarm&&p.win===120&&+tmp.get()===0);
      var h="平均電流 Ī = Σ I·d = <b>"+_w04_ua(b.tot)+" µA</b>、上限 "+_w04_f(b.lim,1)+" µA（"+_w04_f(Q,Q%1?1:0)+" mAh ÷ 1 年）に対する余裕 <b>"+_w04_f(b.lim/b.tot,1)+" 倍</b><br>";
      if(days!==null)h+="電池寿命 L = (Q − ΔQ) ÷ Ī + ΔQ ÷ Ī<sub>low</sub> = <b>"+_w04_g(L*8760)+" h = "+_w04_yr(L)+" 年</b>（電池少から電池切れまで "+_w04_f(days,0)+" 日）<br>";
      else h+="電池寿命 L = Q ÷ Ī = "+_w04_f(Q,Q%1?1:0)+" mAh ÷ "+_w04_ua(b.tot)+" µA = <b>"+_w04_g(L*8760)+" h = "+_w04_yr(L)+" 年</b><br>";
      if(cond)h+=(ok?(good?'<span class="ok">要求の 1 年を満たし、目標の余裕 2 倍にも届く</span>':'<span class="ok">要求の 1 年は満たす</span>が、目標の余裕 2 倍（2 年）に届かない'):'<span class="warn">要求の 1 年を満たさない</span>')+"<br>";
      else h+=(ok?'寿命は 1 年より長い':'<span class="warn">寿命は 1 年より短い</span>')+'（SR-W02 の使い方の条件と違う所があるので、SR-W02 の合否ではない）<br>';
      if(+adv.get()>0)h+='<span class="warn">常にアドバタイズする代案は、受付を短押しから 2 分に限る SR-U06 に反し、仕様書の変更（変更要求）が要る</span><br>';
      if(p.win!==120)h+='受付の窓を 2 分以外にすると、SR-U06（2 分間受け付ける）と食い違う<br>';
      h+="最も大きい項目: <b>"+b.it[mk][0]+" "+b.it[mk][1]+"</b>（"+_w04_f(b.it[mk][4]/b.tot*100,1)+" %）<br>";
      ro.innerHTML=h+'<div class="wnote">表 5-1 と同じ計算（02 章 5 節と同じ置き方に、＊の 4 項目を足した）。アドバタイズ 1 回は 5 mA で 2 ms、接続の間は時間の 20 % だけ無線が動く。使える電荷は、電池の例の模型で電池切れの判定（2.50 V）までに取り出せる電荷で、25 °C は設計で使う容量 180 mAh を使う。電池少の期間は、25 °C の模型の ΔQ = 5.4 mAh を、電池少の表示の電流で使う。</div>';
    }
    draw();
  };

  /* ---- 6 節: 要求・設計の要素・試験のトレーサビリティマトリクス ---- */
  var _W04_DS=["H01","H02","H03","H04","H05","H06","H07","H08","S01","S02","S03","S04","S05","S06","S07","D01","D02","D03","B01","B02","B03","B04"];
  var _W04_DSN={H01:"マイコン",H02:"温湿度センサ",H03:"記録用フラッシュ",H04:"時計の水晶",H05:"ボタンと LED",H06:"電池ホルダと電圧を測る回路",H07:"アンテナ",H08:"筐体",
    S01:"測定",S02:"記録",S03:"通信",S04:"操作と表示",S05:"時刻と監視",S06:"設定",S07:"基盤",D01:"記録の形式",D02:"フラッシュの配置",D03:"設定の形式",
    B01:"電力の予算",B02:"メモリの予算",B03:"処理時間の予算",B04:"費用の予算"};
  var _W04_REQ=[["F01","温度と湿度を測る","H02 H04 S01 S05"],["F02","記録の間隔 1〜60 分","S01 S03 S06 D03"],["F03","1 件の記録を保存","S01 S02 D01"],["F04","52 560 件以上","H03 S02 D02 B02"],
    ["F05","容量に達したとき","S02 S06 D03"],["F06","長押しで開始・停止","H05 S01 S04"],["F07","全部・差分の読み出し","S02 S03 S06"],["F08","接続のたびに時刻","S03 S05"],
    ["F09","時刻未設定の印","S05 D01"],["F10","警報の印","S01 D01"],["F11","確認まで警報の表示","S03 S04 S06"],["F12","アプリから設定","S03 S06 D03"],
    ["F13","電池少を 14 日前に","H06 S03 S04 S05"],["F14","アプリから開始・停止","S01 S03"],["F15","警報を LED で","H05 S01 S04"],["F16","上限と下限の範囲","S03 D03"],
    ["F17","設定を保持","H03 S06 D03"],["F18","状態遷移表のとおり","S01 S03 S04"],["U01","ボタン 1 個・短押し・長押し","H05 S04"],["U02","状態の応答","S04"],
    ["U03","LED の表示の表","H05 S04"],["U04","開始で緑 3 回","S04"],["U05","1〜3 秒は何もしない","S04"],["U06","2 分間受け付ける","S03"],["U07","停止で赤 3 回","S04"],
    ["I01","BLE 4.2 以上","H01 S07"],["I02","見通し 10 m","H01 H07"],["I03","LG-ICD-001 に従う","S03 D01"],["P01","温度の誤差","H02 S01"],["P02","湿度の誤差","H02 S01"],
    ["P03","記録の時刻 ±2 秒","S05 B03"],["P04","30 日で ±60 秒","H04 S05"],["P05","読み出し 60 秒以内","H01 S02 S03 B03"],["P06","10 秒以内に接続","H01 S03 S04"],
    ["W01","CR2032 1 個","H06 H08"],["W02","電池寿命 1 年","H01 H02 H03 H05 B01"],["W03","工具なしで交換","H08"],["W04","交換しても保持","H03 S02 S06 D02 D03"],
    ["E01","−20〜+60 °C で動く","H01 H02 H03 H08"],["E02","−30〜+70 °C で保存","H03 H08"],["E03","IP54 相当","H08"],["E04","1.0 m の落下","H06 H08"],
    ["R01","10 年保持","H03 D02"],["R02","誤りを検出できる","S03 D02"],["R03","10 秒以内に戻る","H01 S05 S06"],["R04","1 分間隔で 5 年","H03 S02 B02"],
    ["R05","止まっても保持","S02 S06 D03"],["S01","PIN","S03 S06"],["S02","電波法","H01 H07"],["C01","大きさと重さ","H08"],["C02","部品の費用","B04"]];
  var _W04_CAT={F:"機能",U:"操作と表示",I:"外部インタフェース",P:"性能",W:"電源",E:"環境",R:"信頼性",S:"安全とセキュリティ",C:"制約"};
  function _w04_dscol(d){return d.charAt(0)==="H"?"teal":(d.charAt(0)==="B"?"gold":"purple");}
  REG.w04_trace=function(el,U){
    var S=U.S;
    U.head(el,"TRACEABILITY","トレーサビリティマトリクス — 要求を選ぶと設計の要素と試験が、設計の要素を選ぶと使う要求と確かめ直す試験が光る");
    var r1=U.ctrls(el);
    var cats=["すべて"].concat(Object.keys(_W04_CAT).map(function(k){return k+" "+_W04_CAT[k];}));
    var cat=U.select(r1,"区分",cats,0,function(){draw();});
    var rq=U.select(r1,"要求",[{v:"",t:"（選ばない）"}].concat(_W04_REQ.map(function(r){return {v:r[0],t:"SR-"+r[0]+" "+r[1]};})),"F04",function(v){selR=v;selD="";ds.set("");draw();});
    var ds=U.select(r1,"設計の要素",[{v:"",t:"（選ばない）"}].concat(_W04_DS.map(function(d){return {v:d,t:"DS-"+d+" "+_W04_DSN[d]};})),"",function(v){selD=v;selR="";rq.set("");draw();});
    var r2=U.ctrls(el);
    var imp=U.checkbox(r2,"要求を変えたときの影響（同じ要素を使うほかの要求と試験）も光らせる",false,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（SR-F04）",function(){cat.set(0);selR="F04";selD="";rq.set("F04");ds.set("");imp.set(false);draw();});
    U.button(br,"設定（DS-S06）を変えると",function(){cat.set(0);selD="S06";selR="";ds.set("S06");rq.set("");draw();});
    var box=U.svgbox(el),ro=U.readout(el),selR="F04",selD="",MP=null;
    function rowsOf(){var c=cat.get();if(c===0)return _W04_REQ;var k=Object.keys(_W04_CAT)[c-1];return _W04_REQ.filter(function(r){return r[0].charAt(0)===k;});}
    U.ctl.drag(box,function(type,x,y){if(type!=="down"||!MP)return false;
      var hit=MP.hit(x,y);if(!hit)return false;
      if(hit.r){selR=hit.r;selD="";rq.set(hit.r);ds.set("");}else if(hit.d){selD=hit.d;selR="";ds.set(hit.d);rq.set("");}
      draw();return false;});
    function draw(){
      var rows=rowsOf(),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var two=!nar&&rows.length>26,half=two?Math.ceil(rows.length/2):rows.length,cw=nar?11.2:11.6,rh=nar?13:13.2,lw=46,stw=44,y0=58;
      var hiR={},hiD={},hiS={},impR={};
      if(selR){var rr=_W04_REQ.filter(function(r){return r[0]===selR;})[0];hiR[selR]=1;rr[2].split(" ").forEach(function(d){hiD[d]=1;});hiS[selR]=1;
        if(imp.get())_W04_REQ.forEach(function(r){if(r[0]!==selR&&r[2].split(" ").some(function(d){return hiD[d];})){impR[r[0]]=1;hiS[r[0]]=1;}});}
      if(selD){hiD[selD]=1;_W04_REQ.forEach(function(r){if(r[2].split(" ").indexOf(selD)>=0){hiR[r[0]]=1;hiS[r[0]]=1;}});}
      var blocks=two?[rows.slice(0,half),rows.slice(half)]:[rows],hits=[];
      blocks.forEach(function(bl,bi){var x0=(nar?6:14)+bi*346,xm=x0+lw;
        _W04_DS.forEach(function(d,j){var c=_w04_dscol(d),xx=xm+j*cw;
          if(hiD[d])o.push(S.RECT(xx,y0-50,cw,50+bl.length*rh,0,U.soft(c),"none",0));
          o.push(S.T(xx+cw/2+3,y0-6,d,"start",8.5,hiD[d]?c:"muted",!!hiD[d],true,-90));
          hits.push({x:xx,y:y0-50,w:cw,h:50,d:d});});
        o.push(S.T(xm+_W04_DS.length*cw+6,y0-6,"試験","start",9,"green",true));
        bl.forEach(function(r,k){var y=y0+k*rh,on=!!hiR[r[0]],im=!!impR[r[0]];
          if(on||im)o.push(S.RECT(x0,y,lw+_W04_DS.length*cw+stw,rh,0,on?"var(--signal-soft)":"var(--gold-soft)","none",0));
          o.push(S.T(x0+2,y+rh-3.5,"SR-"+r[0],"start",8.5,on?"signal":(im?"gold":"muted"),on||im,true));
          var got=r[2].split(" ");
          _W04_DS.forEach(function(d,j){if(got.indexOf(d)>=0){var c=_w04_dscol(d),big=(on&&hiD[d])||(selD===d&&on);o.push(S.D(xm+j*cw+cw/2,y+rh/2,c,big?4:2.8));}});
          var st=_W04_REQ.indexOf(r)+1,stt="ST-"+(st<10?"00":"0")+st;
          o.push(S.T(xm+_W04_DS.length*cw+6,y+rh-3.5,stt,"start",8.5,hiS[r[0]]?"green":"muted",!!hiS[r[0]],true));
          hits.push({x:x0,y:y,w:lw+_W04_DS.length*cw+stw,h:rh,r:r[0]});});
        for(var j=0;j<=_W04_DS.length;j++)o.push(S.L(xm+j*cw,y0,xm+j*cw,y0+bl.length*rh,"line",0.4));
        o.push(S.RECT(x0,y0,lw+_W04_DS.length*cw+stw,bl.length*rh,0,"none","line",0.8));});
      var H=y0+half*rh+10;
      MP={hit:function(x,y){for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)return h;}return null;}};
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var h="";
      if(selR){var r0=_W04_REQ.filter(function(r){return r[0]===selR;})[0],st0=_W04_REQ.indexOf(r0)+1;
        h+="<b>SR-"+r0[0]+"</b> "+r0[1]+" → 設計の要素: "+r0[2].split(" ").map(function(d){return "DS-"+d+" "+_W04_DSN[d];}).join("・")+" → 試験: <b>ST-"+(st0<10?"00":"0")+st0+"</b><br>";
        if(imp.get()){var ks=Object.keys(impR);h+="同じ要素を使うほかの要求 "+ks.length+" 件: "+ks.map(function(k){return "SR-"+k;}).join("・")+"<br>確かめ直す試験 "+(ks.length+1)+" 件: "+Object.keys(hiS).map(function(k){var i=_W04_REQ.map(function(r){return r[0];}).indexOf(k)+1;return "ST-"+(i<10?"00":"0")+i;}).sort().join("・")+"<br>";}}
      if(selD){var ks2=Object.keys(hiR);h+="<b>DS-"+selD+"</b> "+_W04_DSN[selD]+" を使う要求 "+ks2.length+" 件: "+ks2.map(function(k){return "SR-"+k;}).join("・")+"<br>この要素を変えたら確かめ直す試験: "+ks2.map(function(k){var i=_W04_REQ.map(function(r){return r[0];}).indexOf(k)+1;return "ST-"+(i<10?"00":"0")+i;}).join("・")+"<br>";}
      var noDS=_W04_REQ.filter(function(r){return !r[2];}).length,noReq=_W04_DS.filter(function(d){return !_W04_REQ.some(function(r){return r[2].split(" ").indexOf(d)>=0;});}).length;
      h+=(noDS===0&&noReq===0?'<span class="ok">設計の要素の無い要求 0 件・要求の無い設計の要素 0 個・試験の無い要求 0 件</span>':'<span class="warn">空の行か列がある</span>')+"<br>";
      ro.innerHTML=h+'<div class="wnote">行は仕様書の要求 51 件、列は設計の要素 22 個（H: ハードウェア、S: ソフトウェア、D: データの形式、B: 予算）、右端は仕様書の表 6-1 の試験の番号。行か列の見出しを押すか、上の選択で選ぶ。</div>';
    }
    draw();
  };
