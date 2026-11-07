  /* ===== 04 章 割り込み・DMA・リングバッファ ===== */

  /* ---- 2 節: 受信の ISR が待たされたときの FIFO ---- */
  REG.w04_overrun=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"OVERRUN","受信の ISR が待たされると、FIFO はどこまでもつか");
    var row=U.ctrls(el);
    var bd=U.select(row,"ボーレート（8N1）",[{v:"9600",t:"9600 bps"},{v:"115200",t:"115200 bps"},{v:"460800",t:"460800 bps"},{v:"921600",t:"921600 bps"},{v:"3000000",t:"3 Mbps"}],"115200",draw);
    var dp=U.select(row,"FIFO の深さ D",["1","4","8","16","32","64"].map(function(v){return {v:v,t:v+" バイト"};}),"16",draw);
    var row2=U.ctrls(el);
    var bl=U.slider(row2,"ISR が待たされる最長の時間",{min:1e-6,max:2e-2,value:3.6e-3,log:true,fmt:function(v){return v<=1.05e-6?"ほぼ 0":F.time(v);},onInput:draw});
    var ti=U.slider(row2,"ISR が 1 バイトに使う時間",{min:0.5,max:20,step:0.5,value:2,fmt:function(v){return v+" µs";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"2 節の printf の例",function(){bd.set("115200");dp.set("16");bl.set(3.6e-3);ti.set(2);draw();});
    U.button(br,"FIFO なし・100 µs 待たされる",function(){bd.set("115200");dp.set("1");bl.set(1e-4);ti.set(2);draw();});
    U.button(br,"3 Mbps・ISR 5 µs",function(){bd.set("3000000");dp.set("16");bl.set(1e-6);ti.set(5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var baud=+bd.get(),D=+dp.get(),blk=bl.get(),tisr=ti.get()*1e-6;
      if(blk<=1.05e-6)blk=0;
      var Tb=10/baud;
      var t0=Math.max(4*Tb,0.15*(blk+D*Tb));
      var W=t0+blk+Math.max(10*Tb,0.35*blk,1.2*D*Tb);
      if(tisr>Tb)W=Math.max(W,t0+1.6*D/(1/Tb-1/tisr)+10*Tb);   /* ISR が追いつけないときは、FIFO があふれる所まで見せる */
      var dt=Math.min(Tb,tisr)/4,n=Math.ceil(W/dt);
      if(n>400000){dt=W/400000;n=400000;}
      var fifo=0,lost=0,busy=0,nextArr=Tb,lv=[[0,0]],lostT=[],spans=[],maxf=0;
      for(var i=0;i<=n;i++){
        var t=i*dt;
        while(nextArr<=t){if(fifo<D){fifo++;lv.push([nextArr,fifo-1]);lv.push([nextArr,fifo]);}else{lost++;lostT.push(nextArr);}nextArr+=Tb;}
        if(fifo>maxf)maxf=fifo;
        var blocked=(t>=t0&&t<t0+blk);
        if(busy>0)busy-=dt;
        if(busy<=0&&!blocked&&fifo>0){
          lv.push([t,fifo]);fifo--;lv.push([t,fifo]);busy=tisr;
          if(spans.length&&t-spans[spans.length-1][1]<=dt*1.5)spans[spans.length-1][1]=t+tisr;else spans.push([t,t+tisr]);
        }
      }
      lv.push([W,fifo]);
      var au=W<2e-3?1e6:1e3,ax={u:au,un:W<2e-3?"µs":"ms",ticks:U.nice(0,W*au,6)},o=[],x0=110,pw=560;
      var X=function(t){return x0+t/W*pw;};
      // 待たされる区間
      o.push(S.T(x0-8,34,"待たされる","end",9.5,"teal"));
      if(blk>0){o.push(S.RECT(X(t0),22,Math.max(1,X(t0+blk)-X(t0)),16,2,U.soft("teal"),"teal",1));
        if(X(t0+blk)-X(t0)>200)o.push(S.T((X(t0)+X(t0+blk))/2,34,"ほかの ISR・割り込みの禁止など","middle",9.5,"teal",true));}
      // 受信の ISR
      o.push(S.T(x0-8,58,"受信の ISR","end",9.5,"gold"));
      spans.forEach(function(s){o.push(S.RECT(X(s[0]),46,Math.max(1.2,X(s[1])-X(s[0])),16,1,U.soft("gold"),"gold",0.8));});
      // FIFO の量
      var p=U.plot(x0,84,pw,120,[0,W],[0,D*1.12]);
      o.push(p.axes({yl:"FIFO の量",xt:ax.ticks.map(function(v){return v/ax.u;}),yt:[0,D],xfmt:function(v){return (+(v*ax.u).toPrecision(6))+" "+ax.un;},yfmt:function(v){return String(v);},ylOff:44}));
      o.push(p.line([[0,D],[W,D]],"alias",1.1,"5 4"));
      o.push(S.T(p.X(W)+4,p.Y(D)+4,"D","start",9.5,"alias",true));
      o.push(p.line(lv,"signal",1.8));
      if(lostT.length){
        o.push(S.T(x0-8,76,"失われた","end",9.5,"alias",true));
        var step=Math.max(1,Math.ceil(lostT.length/80));
        for(var k=0;k<lostT.length;k+=step)o.push(S.X(X(lostT[k]),72,3.5,"alias",1.6));
      }
      box.set(S.svg(700,246,o));
      var load=tisr/Tb,margin=D*Tb;
      var verdict=lost?'<span class="warn">'+lost+' バイトがオーバーランで失われた（この図の範囲）</span>':'<span class="ok">失われたバイトはない</span>';
      ro.innerHTML="1 バイトの時間 T_B = 10 ÷ "+baud+" = <b>"+F.time(Tb)+"</b> ・ FIFO の猶予 D × T_B = "+D+" × "+F.time(Tb)+" = <b>"+F.time(margin)+"</b><br>"+
        "ISR が待たされる時間 "+(blk?F.time(blk):"ほぼ 0")+" は猶予より"+(blk<margin?"<b>短い</b>":"<b>長い</b>")+" → "+verdict+"<br>"+
        "受信の ISR が CPU を使う割合 = "+F.time(tisr)+" ÷ "+F.time(Tb)+" = <b>"+U.sig(load*100,3)+" %</b>"+
        (load>=1?' <span class="warn">1 バイトの時間より ISR が長く、待たされなくても追いつけない（DMA を考える）</span>':(load>0.3?' <b style="color:var(--gold)">CPU の多くを受信に使っている</b>':''))+
        "<br>FIFO にたまった最大 = <b>"+maxf+"</b> バイト（深さ "+D+"）";
    }
    draw();
  };

  /* ---- 4 節: 読み書きの順番と、割り込みが入る位置 ---- */
  var _w04_POS=["① の前","① と ② の間","② と ③ の間","③ と ④ の間","④ の後"];
  /* 受信: タスクが ring_get、ISR が ring_put('E')。送信: タスクが ring_put('X')、ISR が ring_get して送る */
  function _w04_run(scene,good,full,at){
    var N=4,st,steps,isrLines=[],out={};
    var tr=[];   /* タスクの各文と、そのときの値 */
    if(scene===0){
      st={buf:full?["A","B","C","D"]:["A","B","C",""],head:full?4:3,tail:0};
      out.before={buf:st.buf.slice(),head:st.head,tail:st.tail};
      var loc={},got=[],dropped=false;
      var S1=function(){loc.t=st.tail;return "t = tail;  → t = "+loc.t;},
          S2=function(){return "if (head == t) …  → "+st.head+" ≠ "+loc.t+"（空でない）";},
          SR=function(){loc.b=st.buf[loc.t%N];return "*b = buf[t & 3];  → b = "+loc.b;},
          ST=function(){st.tail=loc.t+1;return "tail = t + 1;  → tail = "+st.tail;};
      steps=good?[S1,S2,SR,ST]:[S1,S2,ST,SR];
      var isr=function(){var h=st.head;isrLines.push("h = head;  → h = "+h);
        if(h-st.tail===N){dropped=true;isrLines.push("h − tail = "+h+" − "+st.tail+" = 4 → 満杯: E を捨てる（数える）");}
        else{isrLines.push("h − tail = "+h+" − "+st.tail+" = "+(h-st.tail)+" → 空きあり");st.buf[h%N]="E";isrLines.push("buf[h & 3] = buf["+(h%N)+"] = E");st.head=h+1;isrLines.push("head = h + 1;  → head = "+st.head);}};
      for(var i=0;i<4;i++){if(i===at)isr();tr.push(steps[i]());}
      if(at===4)isr();
      out.after={buf:st.buf.slice(),head:st.head,tail:st.tail};
      got.push(loc.b);
      while(st.head!==st.tail){got.push(st.buf[st.tail%N]);st.tail++;}
      var g=got.join("");
      out.result=g;out.dropped=dropped;
      out.ok=full?((g==="ABCD"&&dropped)||g==="ABCDE"):(g==="ABCE");
      out.what="タスクが受け取るバイトの列（この後、空になるまで読んだもの）";
      out.expect=full?"A B C D（E は満杯で捨てて数える）か A B C D E":"A B C E";
    }else{
      st={buf:["p","q","r","s"],head:4,tail:4};
      out.before={buf:st.buf.slice(),head:st.head,tail:st.tail};
      var lc={},sent=[];
      var P1=function(){lc.h=st.head;return "h = head;  → h = "+lc.h;},
          P2=function(){return "if (h − tail == 4) …  → "+(lc.h-st.tail)+"（満杯でない）";},
          PW=function(){st.buf[lc.h%N]="X";return "buf[h & 3] = X;  → buf["+(lc.h%N)+"] = X";},
          PH=function(){st.head=lc.h+1;return "head = h + 1;  → head = "+st.head;};
      steps=good?[P1,P2,PW,PH]:[P1,P2,PH,PW];
      var isr2=function(){var t=st.tail;isrLines.push("t = tail;  → t = "+t);
        if(st.head===t){isrLines.push("head == t → 空なので何もしない");}
        else{var b=st.buf[t%N];isrLines.push("b = buf[t & 3] = buf["+(t%N)+"] = "+b);st.tail=t+1;isrLines.push("tail = t + 1;  → tail = "+st.tail);sent.push(b);isrLines.push("送信データレジスタに "+b+" を書く");}};
      for(var j=0;j<4;j++){if(j===at)isr2();tr.push(steps[j]());}
      if(at===4)isr2();
      out.after={buf:st.buf.slice(),head:st.head,tail:st.tail};
      while(st.head!==st.tail){sent.push(st.buf[st.tail%N]);st.tail++;}
      out.result=sent.join("");out.ok=(out.result==="X");
      out.what="線に送られたバイト（この後、ISR が空になるまで送ったもの）";
      out.expect="X";
    }
    out.trace=tr;out.isr=isrLines;
    return out;
  }
  REG.w04_order=function(el,U){
    var S=U.S;
    U.head(el,"ORDER","読み書きの順番と、ISR が割り込む位置");
    var row=U.ctrls(el);
    var sc=U.select(row,"場面",["受信（ISR → タスク）","送信（タスク → ISR）"],0,draw);
    var od=U.select(row,"タスクの文の順番",["正しい（データ → 添字）","逆（添字 → データ）"],0,draw);
    var stt=U.select(row,"始めの受信バッファ",["満杯（A B C D）","3 個（A B C）"],0,draw);
    var row2=U.ctrls(el);
    var at=U.slider(row2,"ISR が割り込む位置",{min:0,max:4,step:1,value:3,fmt:function(v){return _w04_POS[v];},onInput:draw});
    var br=U.btnrow(el);
    var allOn=false;
    U.button(br,"すべての位置で試す",function(){allOn=true;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function cells(o,x,y,st,hl){
      for(var i=0;i<4;i++){var v=st.buf[i],c=v===""?null:(hl&&hl[i]?"gold":"signal");
        o.push(S.RECT(x+i*30,y,30,24,2,c?U.soft(c):"panel",c||"line",1.1));
        if(v!=="")o.push(S.T(x+i*30+15,y+16,v,"middle",11,c,true,true));
        o.push(S.T(x+i*30+15,y-4,String(i),"middle",8.5,"faint",false,true));}
      o.push(S.T(x+128,y+16,"tail = "+st.tail+"、head = "+st.head,"start",9.5,"muted"));
    }
    function draw(){
      var scene=sc.get(),good=od.get()===0,full=stt.get()===0,a=at.get();
      stt.el.style.opacity=scene===0?"1":"0.4";
      var r=_w04_run(scene,good,full,a),o=[];
      var who=scene===0?"タスク（ring_get で 1 バイト取り出す）":"タスク（ring_put で X を入れる）";
      var isrWho=scene===0?"ISR（E を受け取り、ring_put(E)）":"ISR（送信データレジスタが空いた。ring_get して送る）";
      o.push(S.T(16,18,who,"start",10.5,"purple",true));
      var y=40,nums=["①","②","③","④"];
      for(var i=0;i<=4;i++){
        if(i===a){
          var h=20+r.isr.length*16;
          o.push(S.RECT(36,y-12,400,h,6,U.soft("gold"),"gold",1.3));
          o.push(S.T(46,y+3,isrWho,"start",10,"gold",true));
          r.isr.forEach(function(l,k){o.push(S.T(56,y+20+k*16,l,"start",9.5,"ink",false,true));});
          y+=h+8;
        }
        if(i<4){
          var bad=(!r.ok&&((scene===0&&!good&&i===3)||(scene===1&&!good&&i===3)));
          o.push(S.T(20,y+4,nums[i],"start",10.5,bad?"alias":"purple",true));
          o.push(S.T(40,y+4,r.trace[i],"start",9.5,bad?"alias":"ink",bad,true));
          y+=22;
        }
      }
      var xr=470;
      o.push(S.T(xr,18,"バッファ（大きさ 4）","start",10.5,"signal",true));
      o.push(S.T(xr,44,"始め","start",9.5,"muted"));
      cells(o,xr,56,r.before);
      o.push(S.T(xr,104,"タスクの 4 つの文の後（金: ISR が書いた所）","start",9.5,"muted"));
      var hl=r.before.buf.map(function(v,i){return v!==r.after.buf[i];});
      cells(o,xr,116,r.after,hl);
      var hgt=Math.max(y+10,160);
      o.push(S.T(xr,hgt-6,r.ok?"結果: 正しい":"結果: 壊れた","start",11,r.ok?"green":"alias",true));
      box.set(S.svg(700,hgt+4,o));
      var html=r.what+": <b>"+r.result.split("").join(" ")+"</b> "+(r.ok?'<span class="ok">正しい</span>':'<span class="warn">壊れた</span>')+"（正しい結果: "+r.expect+"）";
      if(!r.ok)html+="<br>"+(scene===0?"タスクが tail を進めた後、データを読む前に ISR が割り込み、空いたと判断した位置に E を書いた。A は失われ、E は 2 回読まれる。":"タスクが head を進めた後、データを書く前に ISR が割り込み、まだ書かれていない位置の古いバイトを送った。X は送られない。");
      if(allOn){
        var rows=[],nbad=0;
        for(var k=0;k<=4;k++){var q=_w04_run(scene,good,full,k);if(!q.ok)nbad++;rows.push([_w04_POS[k],q.result.split("").join(" "),q.ok?'<span class="ok">正しい</span>':'<span class="warn">壊れた</span>']);}
        html+="<br>5 か所のうち <b>"+nbad+"</b> か所で壊れる"+U.tbl(["ISR が割り込む位置",scene===0?"タスクが受け取る列":"送られた列","結果"],rows,["left","left","left"]);
      }
      ro.innerHTML=html;
      allOn=false;
    }
    draw();
  };

  /* ---- 5 節: 受信バッファの中の量 ---- */
  REG.w04_ring=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"RING","受信バッファの中の量の時間変化");
    var row=U.ctrls(el);
    var bd=U.select(row,"届く速さ（8N1）",[{v:"9600",t:"9600 bps"},{v:"115200",t:"115200 bps"},{v:"460800",t:"460800 bps"},{v:"921600",t:"921600 bps"}],"115200",draw);
    var md=U.select(row,"届き方",["続けて届く","まとまって届く"],0,draw);
    var bs=U.select(row,"1 回のまとまり",[64,128,256,512,1024,2048,4096].map(function(v){return {v:String(v),t:v+" バイト"};}),"1024",draw);
    var bi=U.slider(row,"まとまりの間隔",{min:5,max:1000,value:200,log:true,fmt:function(v){return F.time(v/1000);},onInput:draw});
    var row2=U.ctrls(el);
    var per=U.slider(row2,"読み手の周期",{min:1,max:100,value:10,log:true,fmt:function(v){return F.time(v/1000);},onInput:draw});
    var cap=U.slider(row2,"1 回に取り出せる上限",{min:16,max:8192,value:8192,log:true,fmt:function(v){return v>=8000?"制限なし":Math.round(v)+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var stl=U.slider(row3,"ときどき止まる長さ",{min:0,max:200,step:1,value:10,fmt:function(v){return v+" ms";},onInput:draw});
    var stf=U.select(row3,"止まる頻度",["止まらない","2 秒に 1 回","1 秒に 1 回","0.5 秒に 1 回"],1,draw);
    var nb=U.select(row3,"バッファの大きさ N",[64,128,256,512,1024,2048,4096,8192].map(function(v){return {v:String(v),t:v+" バイト"};}),"256",draw);
    var brw=U.btnrow(el);
    U.button(brw,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(brw,"5 節の例（読まない時間が最長 20 ms）",function(){bd.set("115200");md.set(0);per.set(10);cap.set(8192);stl.set(10);stf.set(2);nb.set("256");draw();});
    U.button(brw,"平均の速さが足りない例",function(){bd.set("115200");md.set(0);per.set(10);cap.set(100);stl.set(0);stf.set(0);nb.set("256");draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var r=(+bd.get())/10/1000;            /* 届く速さ [バイト/ms] */
      var burst=md.get()===1,B=+bs.get(),BI=bi.get(),P=per.get(),C=cap.get()>=8000?Infinity:cap.get();
      var SL=stl.get(),fq=[0,0.5,1,2][stf.get()],N=+nb.get();
      bs.el.style.opacity=bi.el.style.opacity=burst?"1":"0.4";
      var Wms=1000,dt=0.05,rg=U.rng(seed*7919+13);
      /* 止まる区間（乱数で置く） */
      var stalls=[];
      if(SL>0&&fq>0){var k=Math.round(fq*Wms/1000);for(var i=0;i<k;i++){var ts=(i+rg.range(0.15,0.85))*Wms/k;stalls.push([ts,ts+SL]);}}
      function stalled(t){for(var i=0;i<stalls.length;i++)if(t>=stalls[i][0]&&t<stalls[i][1])return true;return false;}
      var lvl=0,pts=[[0,0]],drops=0,dropT=[],maxl=0,nextRead=P,inSum=0,wasStall=false,arrOn=null,longest=0,lastRead=0,pinned=false;
      var n=Math.round(Wms/dt);
      for(var s=1;s<=n;s++){
        var t=s*dt,on;
        if(!burst)on=true;else{var ph=t%BI;on=ph<B/r;}
        if(on!==arrOn){pts.push([t-dt,lvl]);arrOn=on;}
        if(on){lvl+=r*dt;inSum+=r*dt;}
        if(lvl>N){if(!pinned){pts.push([t,N]);pinned=true;}drops+=lvl-N;if(!dropT.length||t-dropT[dropT.length-1]>2)dropT.push(t);lvl=N;}else pinned=false;
        if(lvl>maxl)maxl=lvl;
        var stl_=stalled(t);
        if(wasStall&&!stl_){pts.push([t,lvl]);var take=Math.min(lvl,C);lvl-=take;pts.push([t,lvl]);longest=Math.max(longest,t-lastRead);lastRead=t;nextRead=t+P;}
        else if(t>=nextRead-1e-9){if(!stl_){pts.push([t,lvl]);var tk=Math.min(lvl,C);lvl-=tk;pts.push([t,lvl]);longest=Math.max(longest,t-lastRead);lastRead=t;}nextRead+=P;}
        wasStall=stl_;
      }
      pts.push([Wms,lvl]);
      var o=[],p=U.plot(80,30,580,170,[0,Wms],[0,N*1.15]);
      stalls.forEach(function(q){o.push(S.RECT(p.X(q[0]),p.y,Math.max(1,p.X(Math.min(q[1],Wms))-p.X(q[0])),p.h,0,U.soft("teal"),"none",0));});
      o.push(p.axes({xl:"時間 [ms]",yl:"量 [バイト]",xt:[0,200,400,600,800,1000],yt:[0,N/2,N],yfmt:function(v){return String(Math.round(v));},xfmt:function(v){return String(v);}}));
      o.push(p.line([[0,N],[Wms,N]],"alias",1.1,"5 4"));
      o.push(S.T(p.X(Wms)+4,p.Y(N)+4,"N","start",9.5,"alias",true));
      o.push(p.line(pts,"signal",1.4));
      dropT.forEach(function(t){o.push(S.X(p.X(t),p.y-8,3.5,"alias",1.6));});
      if(stalls.length)o.push(S.T(p.x+4,p.y-8,"青緑の帯: 読み手が止まっている","start",9.5,"teal"));
      box.set(S.svg(700,246,o));
      var avgIn=inSum/Wms*1000,capAvg=C===Infinity?Infinity:C/P*1000;
      var Ts=P+(SL>0&&fq>0?SL:0),est=r*1000*Ts/1000;
      if(burst)est=Math.min(est,B);
      var html="届く速さ（届いている間）v = "+U.fmt.int(r*1000)+" バイト/秒 ・ 平均 "+U.fmt.int(avgIn)+" バイト/秒 ・ 読み手が取り出せる平均 "+(capAvg===Infinity?"制限なし":U.fmt.int(capAvg)+" バイト/秒")+"<br>"+
        "最大の量 <b>"+Math.round(maxl)+"</b> バイト（N = "+N+"） ・ あふれて失われた "+(drops>0.5?'<span class="warn">'+U.fmt.int(drops)+" バイト</span>":'<span class="ok">0 バイト</span>')+"<br>"+
        "読み手が読まない最長の時間 T_s = 周期 + 止まる長さ = "+F.time(Ts/1000)+"（この図の中の最長 "+F.time(longest/1000)+"） ・ 見積もり v × T_s = <b>"+U.fmt.int(est)+"</b> バイト"+(burst?"（まとまりの大きさ "+Math.round(B)+" バイトを上限とする）":"");
      if(capAvg<avgIn*0.999)html+='<br><span class="warn">読み手の平均の速さが、届く平均の速さより小さい。どの大きさでもいつかはあふれる</span>';
      ro.innerHTML=html;
    }
    draw();
  };

  /* ---- 6 節: 循環モードの DMA ---- */
  REG.w04_dma=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"DMA","循環モードの DMA と、知らせのたびに処理する範囲");
    var row=U.ctrls(el);
    var nb=U.select(row,"DMA のバッファの大きさ N",["32","64","128","256"].map(function(v){return {v:v,t:v+" バイト"};}),"64",draw);
    var ln=U.slider(row,"メッセージの長さ",{min:1,max:200,step:1,value:20,fmt:function(v){return v+" バイト";},onInput:draw});
    var gp=U.slider(row,"メッセージの間隔",{min:2,max:100,step:1,value:20,fmt:function(v){return v+" バイト分";},onInput:draw});
    var row2=U.ctrls(el);
    var vr=U.checkbox(row2,"長さを乱数で変える（半分〜1.5 倍）",true,draw);
    var idl=U.checkbox(row2,"アイドルライン検出を使う",true,draw);
    var dl=U.slider(row2,"割り込みが待たされる時間",{min:0,max:200,step:1,value:10,fmt:function(v){return v+" バイト分";},onInput:draw});
    var brw=U.btnrow(el);
    U.button(brw,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var N=+nb.get(),L=ln.get(),G=gp.get(),useIdle=idl.get(),d=dl.get(),rg=U.rng(seed*104729+7);
      var TE=Math.max(320,6*N);
      /* メッセージの列（時刻は 1 バイトの時間を単位とする。バイトは整数の時刻に受け取り終わる） */
      var msgs=[],t=2;
      while(true){var l=vr.get()?Math.max(1,Math.round(L*rg.range(0.5,1.5))):L;if(t+l>TE-8)break;msgs.push([t,t+l]);t+=l+G;}
      /* 割り込みが待たされる区間: 2N ごとに 1 回、長さ d、置く位置は乱数 */
      var blocks=[];
      if(d>0){var per=Math.max(2*N,d+N/2);for(var b0=0;b0<TE;b0+=per){var bs0=Math.round(b0+rg.range(0,per-d));if(bs0<TE)blocks.push([bs0,bs0+d]);}}
      function blockEnd(tq){for(var i=0;i<blocks.length;i++)if(tq>=blocks[i][0]&&tq<blocks[i][1])return blocks[i][1];return null;}
      var arrT=[],msgOf=[],pos=0,ev=[];
      msgs.forEach(function(m,mi){for(var tt=m[0]+1;tt<=m[1];tt++){arrT.push(tt);msgOf.push(mi);pos++;
          if(pos===N/2)ev.push([tt,"半分"]);if(pos===N){pos=0;ev.push([tt,"全部"]);}}
        if(useIdle)ev.push([m[1]+1,"アイドル"]);});
      ev.sort(function(a,b){return a[0]-b[0];});
      /* 各知らせを処理する時刻: 待たされる区間の中なら区間の終わり（まとめて 1 回）、そうでなければすぐ */
      var procs=[];
      ev.forEach(function(e){var be=blockEnd(e[0]),tp=be==null?e[0]:be;
        if(procs.length&&procs[procs.length-1].t===tp)procs[procs.length-1].ev.push(e);else procs.push({t:tp,ev:[e]});});
      function stateAt(tq){var p=0,sl=[];for(var i=0;i<N;i++)sl.push(-1);for(var k=0;k<arrT.length&&arrT[k]<=tq;k++){sl[p]=k;p=(p+1)%N;}return {pos:p,slot:sl};}
      var last=0,deliv=[],rows=[],deliveredAt=[];
      procs.forEach(function(q){var stt=stateAt(q.t),p=stt.pos,rngs=[];
        function take(a,b){for(var k=a;k<b;k++){var sq=stt.slot[k];deliv.push(sq);if(sq>=0&&deliveredAt[sq]==null)deliveredAt[sq]=q.t;}rngs.push(a+"〜"+(b-1));}
        if(p>last)take(last,p);else if(p<last){take(last,N);if(p>0)take(0,p);}
        last=p;q.pos=p;
        rows.push([q.ev.map(function(e){return e[0];}).join("・"),q.ev.map(function(e){return e[1];}).join("・"),String(q.t),String(p),rngs.length?rngs.join("、"):"（なし）"]);});
      /* 処理した列を、送った順（0, 1, 2, …）と比べる。最後に処理したものより後は「まだ処理していない」 */
      var okSeq=true,seen={},maxD=-1;
      for(var k=0;k<deliv.length;k++){if(deliv[k]!==k)okSeq=false;if(deliv[k]>=0){seen[deliv[k]]=1;maxD=Math.max(maxD,deliv[k]);}}
      var miss=0,pend=arrT.length-1-maxD;
      for(var s2=0;s2<=maxD;s2++)if(!seen[s2])miss++;
      var dup=deliv.length-Object.keys(seen).length;
      var dls=[];msgs.forEach(function(m,mi){var ls=-1;for(var k=0;k<msgOf.length;k++)if(msgOf[k]===mi)ls=k;if(ls>=0&&deliveredAt[ls]!=null)dls.push(deliveredAt[ls]-m[1]);});
      /* 処理と処理の間に書かれたバイト数の最大 */
      var maxGap=0,prevCnt=0;procs.forEach(function(q){var c=0;for(var k=0;k<arrT.length&&arrT[k]<=q.t;k++)c++;maxGap=Math.max(maxGap,c-prevCnt);prevCnt=c;});
      var o=[],p=U.plot(110,56,560,120,[0,TE],[0,N]);
      o.push(S.T(100,34,"RX の線","end",9.5,"muted"));
      msgs.forEach(function(m){o.push(S.RECT(p.X(m[0]),24,Math.max(1.5,p.X(m[1])-p.X(m[0])),14,2,U.soft("signal"),"signal",1));});
      blocks.forEach(function(q){if(q[0]<TE)o.push(S.RECT(p.X(q[0]),p.y,Math.max(1,p.X(Math.min(q[1],TE))-p.X(q[0])),p.h,0,U.soft("teal"),"none",0));});
      o.push(p.axes({xl:"時間（1 バイトの時間を単位とする。115200 bps なら 1 = 86.8 µs）",yl:"次に書く位置",xt:U.nice(0,TE,6),yt:[0,N/2,N],yfmt:function(v){return String(v);}}));
      o.push(p.line([[0,N/2],[TE,N/2]],"faint",1,"3 3"));
      var pl=[[0,0]],pp=0;
      msgs.forEach(function(m){pl.push([m[0],pp]);for(var tt=m[0]+1;tt<=m[1];tt++){pp++;if(pp===N){pl.push([tt,N]);pp=0;pl.push([tt,0]);}}pl.push([m[1],pp]);});
      pl.push([TE,pp]);
      o.push(p.line(pl,"gold",1.8));
      var ye=228;
      o.push(S.T(100,ye+4,"知らせ","end",9.5,"muted"));
      ev.forEach(function(e){var c=e[1]==="アイドル"?"signal":"gold";o.push(S.L(p.X(e[0]),ye-6,p.X(e[0]),ye+6,c,2));});
      o.push(S.T(100,ye+26,"処理","end",9.5,"muted"));
      procs.forEach(function(q){o.push(S.D(p.X(q.t),ye+22,"purple",2.6));});
      o.push(S.T(p.x,ye+44,"金: 半分完了・全部完了、青: アイドルライン、紫の点: 処理した時刻、青緑の帯: ときどき割り込みが待たされる間","start",9.5,"muted"));
      box.set(S.svg(700,ye+54,o));
      var cond=d<N/2;
      var mx=dls.length?Math.max.apply(null,dls):0,av=dls.length?dls.reduce(function(a,b){return a+b;},0)/dls.length:0;
      var html="知らせ: 半分 "+ev.filter(function(e){return e[1]==="半分";}).length+" 回、全部 "+ev.filter(function(e){return e[1]==="全部";}).length+" 回、アイドル "+ev.filter(function(e){return e[1]==="アイドル";}).length+" 回 ・ "+
        "メッセージの最後のバイトから処理まで: 平均 <b>"+U.sig(av,3)+"</b>、最大 <b>"+Math.round(mx)+"</b> バイト分（115200 bps なら最大 "+F.time(mx*10/115200)+"）<br>"+
        "処理と処理の間に書かれたバイト数の最大 <b>"+maxGap+"</b>（N = "+N+" 未満なら失わない） ・ 条件 L_max < (N/2) T_B: 待たされる時間 "+d+" バイト分、N/2 = "+(N/2)+" バイト分 → "+(cond?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"<br>"+
        (okSeq&&miss===0&&dup===0?'<span class="ok">送ったバイトを、順番どおりに抜けなく処理した</span>':'<span class="warn">上書きされて失われたバイト '+miss+(dup>0?"、2 回処理したバイト "+dup:"")+'（処理した順番も乱れた）</span>')+
        (pend>0?" ・ 図の終わりの時点で、まだ処理されていないバイト "+pend:"");
      if(!useIdle)html+="<br>アイドルライン検出がないので、メッセージの終わりは、次の「半分」か「全部」まで処理されない。";
      html+=U.tbl(["知らせの時刻","種類","処理した時刻","pos","処理した範囲"],rows.slice(0,8),["right","left","right","right","left"])+(rows.length>8?'<div class="wnote">（最初の 8 回だけを表示）</div>':"");
      ro.innerHTML=html;
    }
    draw();
  };
