  /* ===== 10 章 TCP ===== */
  /* RFC 6298 の RTO の推定（時間はミリ秒）。floor: 下限（0 なら下限なし）、G: 時計の細かさ */
  function _w10_est(floor){
    var e={srtt:0,var_:0,rto:1000,have:false,floor:floor,G:10};
    e.clamp=function(v){return Math.min(60000,Math.max(e.floor,v));};
    e.sample=function(r){
      if(!e.have){e.srtt=r;e.var_=r/2;e.have=true;}
      else{e.var_=0.75*e.var_+0.25*Math.abs(e.srtt-r);e.srtt=0.875*e.srtt+0.125*r;}
      e.rto=e.clamp(e.srtt+Math.max(e.G,4*e.var_));};
    e.backoff=function(){e.rto=Math.min(60000,2*e.rto);};
    return e;
  }
  var _W10_EX=[800,600,1000,700,1500,900,850,800,780,820,800,790];

  REG.w10_rto=function(el,U){
    var S=U.S,F=U.fmt,N=60;
    U.head(el,"RTO","RTT の測定値の列から RTO を決める（RFC 6298）");
    var row=U.ctrls(el);
    var pat=U.select(row,"RTT の測定値の列",["本文の表の例（800, 600, 1000, 700, 1500, 900 ms …）","近くのサーバ（100 ms 前後）",
      "携帯電話の網（平均 800 ms、揺らぎが大きい）","途中で急に増える（200 ms → 1.5 s）","途中で急に減る（1.5 s → 200 ms）"],3,draw);
    var row2=U.ctrls(el);
    var fl=U.checkbox(row2,"1 秒未満は 1 秒に切り上げる（RFC の推奨）",true,draw);
    var ka=U.checkbox(row2,"Karn のアルゴリズム（再送したセグメントの RTT は測らない）",true,draw);
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function series(k,R){
      var a=[];
      for(var i=0;i<N;i++){var u=R.next(),v;
        if(k===0)v=i<_W10_EX.length?_W10_EX[i]:Math.round(800*(0.88+0.24*u));
        else if(k===1)v=100*(0.85+0.3*u)+(R.chance(0.08)?50+100*R.next():0);
        else if(k===2)v=Math.min(4000,Math.max(250,800*Math.exp(0.3*R.normal())))*(R.chance(0.05)?2:1);
        else if(k===3)v=(i<25?200:1500)*(0.9+0.2*u);
        else v=(i<25?1500:200)*(0.9+0.2*u);
        a.push(Math.round(v));}
      return a;
    }
    function draw(){
      var R=U.rng(seed*7919+pat.get()),rs=series(pat.get(),R),e=_w10_est(fl.get()?1000:0),rows=[],spur=0,segsp=0,sumRto=0,sumR=0;
      rs.forEach(function(r,i){
        var used=e.rto,t=0,cur=e.rto,n=0;
        while(r>t+cur){t+=cur;n++;e.backoff();cur=e.rto;}      /* 時間切れ: 再送して RTO を 2 倍 */
        if(n===0)e.sample(r);
        else if(!ka.get())e.sample(r-t);                         /* 再送からの時間を測ってしまう */
        spur+=n;if(n)segsp++;sumRto+=used;sumR+=r;
        rows.push({r:r,used:used,n:n,srtt:e.srtt,var_:e.var_,rto:e.rto,have:e.have,meas:n===0?r:(ka.get()?null:r-t)});
      });
      var top=0;rows.forEach(function(q){top=Math.max(top,q.used,q.r);});var ymax=top<=8000?10000:60000;
      var W=700,o=[],p=U.plot(80,24,580,250,[0.5,N+0.5],[50,ymax],{ylog:true});
      o.push(p.axes({xl:"何個目のセグメントか（1 つずつ送り、ACK が来てから次を送る）",yl:"時間",xt:[1,10,20,30,40,50,60],yt:ymax>10000?[100,300,1000,3000,10000,30000]:[100,300,1000,3000,10000],
        xfmt:function(v){return String(v);},yfmt:function(v){return v>=1000?(v/1000)+" s":String(v);}}));
      if(fl.get())o.push(p.line([[0.5,1000],[N+0.5,1000]],"muted",1.1,"2 3"));
      o.push(p.line(rows.map(function(q,i){return [i+1,Math.max(50,q.used)];}),"teal",2.2));
      o.push(p.line(rows.map(function(q,i){return q.have?[i+1,Math.max(50,q.srtt)]:null;}).filter(function(v){return v;}),"green",1.8));
      rows.forEach(function(q,i){var c=q.n?"alias":"ink";o.push(S.D(p.X(i+1),p.Y(q.r),c,q.n?4.2:3));
        if(q.n)o.push(S.T(p.X(i+1),p.Y(q.r)-8,q.n>1?"×"+q.n:"×","middle",9.5,"alias",true));});
      var ly=24+250+44,xx=80;
      [["ink","測定値（実際の RTT）",null],["alias","RTO より長く、不要な再送が起きた",null],["green","SRTT",2],["teal","送ったときの RTO",2]].forEach(function(L){
        if(L[2]){o.push(S.L(xx,ly-4,xx+20,ly-4,L[0],2));xx+=26;}else{o.push(S.D(xx+4,ly-4,L[0],3.6));xx+=12;}
        o.push(S.T(xx,ly,L[1],"start",10,"muted"));xx+=U.tw(L[1],10)+18;});
      box.set(S.svg(W,ly+10,o));
      var head6=rows.slice(0,6).map(function(q,i){return [String(i+1),q.r+" ms",q.n?'<span class="warn">'+q.n+" 回</span>":"0",q.meas==null?"使わない":Math.round(q.meas)+" ms",
        q.have?U.sig(q.var_,4)+" ms":"（まだ無い）",q.have?U.sig(q.srtt,4)+" ms":"（まだ無い）",Math.round(q.rto)+" ms"];});
      ro.innerHTML="不要な再送: <b>"+spur+" 回</b>"+(spur?"（"+N+" 個のうち "+segsp+" 個で。このデモではセグメントは失われないので、再送はすべて不要なもの）":"（RTO は、いつも実際の RTT より長かった）")+"<br>"+
        "送ったときの RTO の平均 "+F.time(sumRto/N/1000)+" ・ 実際の RTT の平均 "+F.time(sumR/N/1000)+" → 本当に失われたときは、再送まで RTT の平均の <b>"+U.sig(sumRto/sumR,3)+" 倍</b> 待つ"+
        (!ka.get()&&spur?'<br><span class="warn">Karn のアルゴリズムを外すと、再送からの短い時間を RTT として測るので、RTO が上がらず、不要な再送が続く。</span>':"")+
        U.tbl(["回","測定値（実際）","不要な再送","RTT として使った値","RTTVAR","SRTT","次の RTO"],head6,["right","right","right","right","right","right","right"]);
    }
    draw();
  };

  /* TCP の転送の模擬（送り手 1 つ・受け手 1 つ）。o = {N, mss, rwnd, rtt[ms], rate[bps], loss, cc, R(乱数)}
     ・回線（送り手から受け手の向き）は速さ rate の 1 本で、送るセグメントは並んで順に送り出される。片道の伝わる時間は RTT/2。
     ・失われるのはデータのセグメントだけ（確率 loss）。受け手は順番の外れたセグメントを取っておき、届くたびにすぐ ACK を返す。
     ・送り手: 実効のウィンドウ = min(rwnd, cwnd)。RTO は RFC 6298（下限 1 秒）、重複 ACK 3 つで高速再送（NewReno の形）、
       輻輳制御ありなら RFC 5681 のスロースタート・輻輳回避・半減・時間切れで 1 MSS。 */
  function _w10_xsim(o){
    var R=o.R,d=o.rtt/2000,mss=Math.min(o.mss,o.rwnd),N=o.N,HDR=40;
    var IW=mss<=1095?4*mss:(mss<=2190?3*mss:2*mss);
    var now=0,ev=[],evn=0;
    function push(e){var i=ev.length;ev.push(e);while(i>0&&ev[i-1].t>e.t){ev[i]=ev[i-1];i--;}ev[i]=e;}
    var una=0,nxt=0,high=0,cwnd=o.cc?IW:1e12,ssth=1e12,dup=0,inRec=false,recover=0,timed=null,linkFree=0;
    var est=_w10_est(1000),tgen=0,tOn=false;
    var rnxt=0,ooo=[];
    var segs=[],acks=[],cw=[],done=null,nFast=0,nRto=0,nDup=0,nLost=0,nRetx=0;
    function logCw(){cw.push([now,cwnd,Math.min(cwnd,o.rwnd)]);}
    function startTimer(){tgen++;tOn=true;push({t:now+est.rto/1000,k:"to",g:tgen});}
    function stopTimer(){tgen++;tOn=false;}
    function sendSeg(seq,len,kind){
      var ts=(len+HDR)*8/o.rate,st=Math.max(now,linkFree);linkFree=st+ts;
      var lost=R.chance(o.loss),retx=seq<high;
      if(retx)nRetx++;if(lost)nLost++;
      segs.push({t:st,a:st+ts+d,seq:seq,len:len,retx:retx,lost:lost});
      if(!lost)push({t:st+ts+d,k:"data",seq:seq,len:len});
      if(!retx&&!timed)timed={seq:seq,t:now};
      if(seq+len>high)high=seq+len;
      if(!tOn)startTimer();
    }
    function trySend(){
      var win=Math.min(cwnd,o.rwnd);
      while(nxt<N){var len=Math.min(mss,N-nxt);
        if(nxt+len-una>win+1e-9)break;          /* 確認されていない量がウィンドウを超えるなら待つ */
        sendSeg(nxt,len);nxt+=len;}
    }
    function onAck(ack){
      if(ack>una){
        var newly=ack-una;
        if(timed&&ack>timed.seq){est.sample((now-timed.t)*1000);timed=null;}
        if(inRec){
          if(ack>=recover){inRec=false;if(o.cc)cwnd=ssth;}
          else{if(o.cc)cwnd=Math.max(mss,cwnd-newly+mss);sendSeg(ack,Math.min(mss,N-ack),"fast");}
        }else if(o.cc){if(cwnd<ssth)cwnd+=Math.min(newly,mss);else cwnd+=mss*mss/cwnd;}
        una=ack;dup=0;if(nxt<una)nxt=una;
        if(una>=N){done=now;stopTimer();logCw();return;}
        startTimer();
      }else if(ack===una&&nxt>una){
        dup++;nDup++;
        if(!inRec&&dup===3){
          nFast++;
          if(o.cc){ssth=Math.max((nxt-una)/2,2*mss);cwnd=ssth+3*mss;}
          inRec=true;recover=nxt;
          if(timed&&timed.seq>=una&&timed.seq<una+mss)timed=null;
          sendSeg(una,Math.min(mss,N-una),"fast");
        }else if(inRec&&o.cc)cwnd+=mss;
      }
      logCw();trySend();
    }
    function onTimeout(){
      nRto++;
      if(o.cc){ssth=Math.max((nxt-una)/2,2*mss);cwnd=mss;}
      inRec=false;dup=0;timed=null;est.backoff();nxt=una;
      logCw();trySend();startTimer();
    }
    function onData(seq,len){
      if(seq<=rnxt&&seq+len>rnxt){rnxt=seq+len;
        var moved=true;while(moved){moved=false;for(var i=0;i<ooo.length;i++){if(ooo[i][0]<=rnxt){if(ooo[i][1]>rnxt)rnxt=ooo[i][1];ooo.splice(i,1);moved=true;break;}}}}
      else if(seq>rnxt&&seq+len<=rnxt+o.rwnd){ooo.push([seq,seq+len]);}
      acks.push({t:now,a:now+d,ack:rnxt});
      push({t:now+d,k:"ack",ack:rnxt});
    }
    logCw();trySend();
    while(ev.length&&done===null&&evn<400000){
      var e=ev.shift();evn++;now=e.t;if(now>3600)break;
      if(e.k==="data")onData(e.seq,e.len);
      else if(e.k==="ack")onAck(e.ack);
      else if(e.k==="to"&&e.g===tgen&&tOn)onTimeout();
    }
    return {segs:segs,acks:acks,cw:cw,done:done,end:now,nFast:nFast,nRto:nRto,nDup:nDup,nLost:nLost,nRetx:nRetx,mss:mss,IW:IW};
  }

  REG.w10_xfer=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"TCP","スライディングウィンドウ・再送・輻輳制御で、データを送り切るまで");
    var row=U.ctrls(el);
    var nb=U.slider(row,"データの量",{values:[10000,20000,50000,100000,200000,500000],value:50000,fmt:function(v){return F.int(v)+" バイト";},onInput:draw});
    var ms=U.select(row,"MSS",["536 バイト","1460 バイト"],0,draw);
    var rw=U.slider(row,"受信ウィンドウ",{values:[536,1072,2144,4288,8760,17520,32768,65535],value:2144,fmt:function(v){return F.int(v)+" バイト";},onInput:draw});
    var row2=U.ctrls(el);
    var rt=U.slider(row2,"RTT（回線を送る時間を除く）",{min:5,max:1000,log:true,int:true,value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var rate=U.slider(row2,"回線の速さ",{values:[0.1,0.25,0.5,1,2,5,10,20,50,100],value:10,fmt:function(v){return v+" Mbps";},onInput:draw});
    var ls=U.slider(row2,"データのセグメントが失われる確率",{min:0,max:20,step:0.5,value:2,fmt:function(v){return v+" %";},onInput:draw});
    var row3=U.ctrls(el);
    var cc=U.checkbox(row3,"輻輳制御（スロースタート・輻輳回避）",true,draw);
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"小さな機器（MSS 536・ウィンドウ 2144）",function(){ms.set("0");rw.set(2144);draw();});
    U.button(br,"大きなウィンドウ（MSS 1460・65535）",function(){ms.set("1");rw.set(65535);draw();});
    var box=U.svgbox(el),box2=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var mss=ms.get()===0?536:1460,o={N:nb.get(),mss:mss,rwnd:rw.get(),rtt:rt.get(),rate:rate.get()*1e6,loss:ls.get()/100,cc:cc.get(),R:U.rng(seed*104729+7)};
      var r=_w10_xsim(o),T=r.done||r.end,mssE=r.mss;
      /* 1 枚目: 最初の部分のシーケンス図 */
      var first=r.segs.slice(0,18),T1=0;first.forEach(function(s){T1=Math.max(T1,s.a+o.rtt/2000);});T1=Math.min(T1,T);
      var W=700,xa=236,xb=540,y0=58,H=320,Y=function(t){return y0+t/T1*H;},q=[];
      q.push(S.RECT(xa-44,8,88,26,7,U.soft("signal"),"signal",1.3));q.push(S.T(xa,25,"送り手（機器）","middle",10.5,"signal",true));
      q.push(S.RECT(xb-44,8,88,26,7,U.soft("green"),"green",1.3));q.push(S.T(xb,25,"受け手","middle",10.5,"green",true));
      q.push(S.L(xa,34,xa,y0+H+6,"signal",1.2,"3 4"));q.push(S.L(xb,34,xb,y0+H+6,"green",1.2,"3 4"));
      var tk=U.nice(0,T1*1000,5);tk.forEach(function(v){var yy=Y(v/1000);q.push(S.L(40,yy,46,yy,"muted",1));q.push(S.T(52,yy+3.5,F.time(v/1000),"start",9,"muted"));});
      q.push(S.L(43,y0,43,y0+H,"muted",1));
      r.acks.forEach(function(a){if(a.t<=T1)q.push(S.ARR(xb,Y(a.t),xa,Y(Math.min(a.a,T1)),"green",1.1,5));});
      var groups=[];
      r.segs.forEach(function(s){if(s.t>T1)return;var c=s.retx?"alias":"ink";
        if(s.lost){var fx=xa+(xb-xa)*0.55,fy=Y(s.t)+(Y(s.a)-Y(s.t))*0.55;q.push(S.L(xa,Y(s.t),fx,fy,"alias",1.4,"5 3"));q.push(S.X(fx,fy,4.5,"alias",2));}
        else q.push(S.ARR(xa,Y(s.t),xb,Y(Math.min(s.a,T1)),c,1.4,6));
        var g=groups[groups.length-1];
        if(g&&Y(s.t)-g.y<11&&g.retx===s.retx){g.n++;g.e=Math.max(g.e,s.seq+s.len);}else groups.push({y:Y(s.t),s:s.seq,e:s.seq+s.len,n:1,retx:s.retx});});
      groups.forEach(function(g){q.push(S.T(xa-8,g.y+3.5,(g.retx?"再送 ":"")+F.int(g.s+1)+"〜"+F.int(g.e)+(g.n>1?"（"+g.n+" 個）":""),"end",9,g.retx?"alias":"ink",g.retx,true));});
      q.push(S.T(W/2,y0+H+24,"最初の部分（0〜"+F.time(T1)+"）。黒: データ（左は運んだバイトの番号。ISN + 1 を 1 とした）、赤: 再送、×: 失われた、緑: ACK","middle",9.5,"muted"));
      box.set(S.svg(W,y0+H+34,q));
      /* 2 枚目: 番号と時間、ウィンドウの推移 */
      var z=[],p=U.plot(90,16,560,190,[0,T],[0,o.N]);
      z.push(p.axes({xl:"",yl:"バイトの番号",xt:U.nice(0,T,6),yt:U.nice(0,o.N,4),xfmt:function(v){return F.time(v);},yfmt:function(v){return F.int(v);}}));
      var ap=[[0,0]];var cur=0;r.acks.forEach(function(a){if(a.ack>cur){ap.push([a.a,cur]);ap.push([a.a,a.ack]);cur=a.ack;}});ap.push([T,cur]);
      z.push(p.line(ap,"green",1.8));
      r.segs.forEach(function(s){var x=p.X(s.t);z.push(S.L(x,p.Y(s.seq),x,p.Y(s.seq+s.len),s.retx?"alias":(s.lost?"faint":"signal"),s.retx?2.2:1.6));
        if(s.lost)z.push(S.X(x,p.Y(s.seq+s.len/2),3,"alias",1.4));});
      z.push(S.T(p.x+8,p.y+14,"縦の短い線: 送ったセグメント（赤は再送、× は失われたもの） 緑: 確認された番号","start",9.5,"muted"));
      var wy=16+190+50,ymax=Math.max(o.rwnd*1.25,Math.min(o.rwnd*3,Math.max.apply(null,r.cw.map(function(c){return c[1];}))*1.05));
      if(!o.cc)ymax=o.rwnd*1.25;
      var p2=U.plot(90,wy,560,110,[0,T],[0,ymax]);
      z.push(p2.axes({xl:"時間",yl:"ウィンドウ [バイト]",xt:U.nice(0,T,6),yt:U.nice(0,ymax,3),xfmt:function(v){return F.time(v);},yfmt:function(v){return F.int(v);}}));
      z.push(p2.line([[0,o.rwnd],[T,o.rwnd]],"green",1.3,"6 4"));
      if(o.cc){var cp=[];r.cw.forEach(function(c,i){if(i)cp.push([c[0],Math.min(ymax,r.cw[i-1][1])]);cp.push([c[0],Math.min(ymax,c[1])]);});cp.push([T,Math.min(ymax,r.cw[r.cw.length-1][1])]);
        z.push(p2.line(cp,"signal",1.3,"3 3"));}
      var ep=[];r.cw.forEach(function(c,i){if(i)ep.push([c[0],r.cw[i-1][2]]);ep.push([c[0],c[2]]);});ep.push([T,r.cw[r.cw.length-1][2]]);
      z.push(p2.line(ep,"ink",2));
      z.push(S.T(p2.x+p2.w-4,p2.Y(o.rwnd)-5,"受信ウィンドウ","end",9.5,"green",true));
      z.push(S.T(p2.x+8,p2.y+12,"太線: 実効のウィンドウ = min(受信ウィンドウ, cwnd)"+(o.cc?"　点線: cwnd":"（輻輳制御なし）"),"start",9.5,"muted"));
      box2.set(S.svg(700,wy+110+44,z));
      var ts=(mssE+40)*8/o.rate,bound=Math.min(o.rate/8,o.rwnd/(ts+o.rtt/1000)),thr=r.done?o.N/r.done:0;
      ro.innerHTML=(r.done?"送り切るまで <b>"+F.time(r.done)+"</b> ・ スループット <b>"+F.int(thr)+" B/s</b>（"+F.rate(thr*8)+"）":'<span class="warn">1 時間で送り切れなかった</span>')+"<br>"+
        "上限 min(回線の速さ, 受信ウィンドウ ÷ (T_s + RTT)) = min("+F.int(o.rate/8)+", "+F.int(o.rwnd)+" ÷ "+F.time(ts+o.rtt/1000)+") = <b>"+F.int(bound)+" B/s</b>"+
        "（"+(o.rate/8<=o.rwnd/(ts+o.rtt/1000)?"回線の速さで決まる":"受信ウィンドウで決まる")+"） ・ ストップアンドウェイトなら "+F.int(mssE/(ts+o.rtt/1000))+" B/s<br>"+
        "送ったセグメント "+r.segs.length+"（うち再送 <b>"+r.nRetx+"</b>）・ 失われた "+r.nLost+" ・ 重複 ACK "+r.nDup+" ・ 高速再送 <b>"+r.nFast+"</b> 回 ・ 時間切れ <b>"+r.nRto+"</b> 回"+
        (o.cc?" ・ 始めの cwnd "+F.int(r.IW)+" バイト":"")+
        (r.done&&o.cc&&r.nRetx===0&&thr<0.8*bound?'<br>上限に届かないのは、cwnd が小さい始めの部分（スロースタート）が、転送の時間の多くを占めるため。データを増やすと上限に近づく。':"");
    }
    draw();
  };

  /* Nagle アルゴリズムと遅延 ACK の模擬（失われることは考えない）。時間は ms。
     p = {pat: 0 書く・書く・読む / 1 1 回で書く / 2 大きなデータ, nagle, delack, rtt, D, cap(送信バッファ [MSS])}
     機器（A）が要求を送り、サーバ（B）が応答する。Nagle アルゴリズムは機器の側にだけ働かせ、遅延 ACK は両方の受け手に働かせる。 */
  function _w10_dsim(p){
    var MSS=536,RATE=125,d=p.rtt/2,K=4,M=12*MSS,now=0,ev=[],segs=[],spans=[],ex=[],done=null;
    function push(e){var i=ev.length;ev.push(e);while(i>0&&ev[i-1].t>e.t){ev[i]=ev[i-1];i--;}ev[i]=e;}
    function host(nm){return {nm:nm,una:0,nxt:0,wr:0,rcv:0,pend:false,full:0,tmr:null,lf:0,hold:null};}
    var A=host("A"),B=host("B");A.peer=B;B.peer=A;
    function tx(h,len,lab){
      var st=Math.max(now,h.lf),ts=(len+40)/RATE;h.lf=st+ts;
      var s={from:h.nm,t:st,a:st+ts+d,seq:h.nxt,len:len,ack:h.rcv,lab:lab};segs.push(s);
      push({t:s.a,k:"seg",to:h.peer,s:s});
      if(h.tmr!==null){spans.push({h:h.nm,t0:h.tmr.t0,t1:now,k:"d"});h.tmr.dead=true;h.tmr=null;}
      h.pend=false;h.full=0;
    }
    function label(h,len){
      if(p.pat===2)return h===A?len+" B":"ACK";
      if(h===B)return "応答 "+len+" B";
      return p.pat===1?"要求 "+len+" B":(len===10?"ヘッダ 10 B":(len===20?"本体 20 B":"ヘッダ+本体 30 B"));
    }
    function output(h){
      for(;;){
        var un=h.wr-h.nxt;if(un<=0)break;
        var len=Math.min(un,MSS);
        if(h===A&&p.nagle&&h.nxt>h.una&&len<MSS){if(h.hold===null)h.hold=now;break;}
        if(h.hold!==null){spans.push({h:h.nm,t0:h.hold,t1:now,k:"n"});h.hold=null;}
        /* 書き込みの区切りどおりに送る（ためていない限り）: 機器の書き込みは 10 B と 20 B */
        if(h===A&&p.pat===0&&!p.nagle){var w=h.chunks.shift();if(w)len=w;}
        else if(h===A&&p.pat===0&&p.nagle){var tot=0;while(h.chunks.length&&tot+h.chunks[0]<=len){tot+=h.chunks.shift();}len=tot||len;}
        var lab=label(h,len);tx(h,len,lab);h.nxt+=len;
      }
    }
    function ackDecide(h){
      if(!h.pend)return;
      if(!p.delack||h.full>=2){tx(h,0,"ACK");return;}
      if(h.tmr===null){h.tmr={t0:now};push({t:now+p.D,k:"tmr",h:h,o:h.tmr});}
    }
    var k=0,t0=0;
    function appA(){
      if(p.pat===2){while(A.wr<M&&A.wr-A.una<p.cap*MSS){A.wr+=Math.min(MSS,M-A.wr);}if(A.una>=M&&done===null)done=now;return;}
      if(A.rcv>=30*(k+1)){ex.push(now-t0);k++;}
      if(k<K&&A.wr<30*(k+1)){t0=now;
        if(p.pat===0){A.wr+=10;A.chunks.push(10);output(A);A.wr+=20;A.chunks.push(20);}   /* 2 回に分けて書く */
        else{A.wr+=30;A.chunks.push(30);}}
    }
    function appB(){if(p.pat!==2&&B.rcv>=30*(B.done||0)+30){B.done=(B.done||0)+1;B.wr+=30;}}
    A.chunks=[];B.chunks=[];
    appA();output(A);
    var guard=0;
    while(ev.length&&guard++<20000){
      var e=ev.shift();now=e.t;
      if(e.k==="tmr"){if(!e.o.dead&&e.h.tmr===e.o){spans.push({h:e.h.nm,t0:e.o.t0,t1:now,k:"d"});e.h.tmr=null;tx(e.h,0,"ACK");}continue;}
      var h=e.to,s=e.s;
      if(s.ack>h.una)h.una=s.ack;
      if(s.len>0){if(s.seq===h.rcv)h.rcv+=s.len;h.pend=true;if(s.len>=MSS)h.full++;}
      if(h===A)appA();else appB();
      output(h);ackDecide(h);
      if(p.pat!==2&&k>=K&&ev.length===0)break;
      if(p.pat===2&&done!==null)break;
    }
    return {segs:segs,spans:spans,ex:ex,done:done,M:M,MSS:MSS};
  }

  REG.w10_delack=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"DELAYED ACK","Nagle アルゴリズムと遅延 ACK が重なると");
    var row=U.ctrls(el);
    var pt=U.select(row,"送り方",["書く・書く・読む（10 B と 20 B を書き、30 B の応答を読む）","1 回で書く（30 B を書き、30 B の応答を読む）","大きなデータを流す（536 B の満杯のセグメント 12 個）"],0,draw);
    var row2=U.ctrls(el);
    var ng=U.checkbox(row2,"Nagle アルゴリズム（機器）",true,draw);
    var da=U.checkbox(row2,"遅延 ACK（受け手）",true,draw);
    var row3=U.ctrls(el);
    var rt=U.slider(row3,"RTT",{min:1,max:200,log:true,int:true,value:40,fmt:function(v){return v+" ms";},onInput:draw});
    var dd=U.slider(row3,"遅延 ACK の待ち時間 D",{values:[40,100,200,300,500],value:200,fmt:function(v){return v+" ms";},onInput:draw});
    var cp=U.select(row3,"送信バッファ（大きなデータのとき）",["MSS 1 つ分","MSS 2 つ分","MSS 4 つ分"],0,draw);
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var p={pat:pt.get(),nagle:ng.get(),delack:da.get(),rtt:rt.get(),D:dd.get(),cap:[1,2,4][cp.get()]};
      var r=_w10_dsim(p);
      var T1;
      if(p.pat===2){var cnt=0;T1=0;r.segs.forEach(function(s){if(s.from==="A"&&s.len>0&&cnt<6){cnt++;T1=Math.max(T1,s.a);}});T1+=p.rtt/2+(p.delack?p.D:0)+5;}
      else T1=(r.ex.length>=2?r.ex[0]+r.ex[1]:(r.ex[0]||100))+2;
      if(r.done!==null)T1=Math.min(T1,r.done+1);
      var W=700,xa=230,xb=500,y0=58,H=330,Y=function(t){return y0+t/T1*H;},q=[];
      q.push(S.RECT(xa-40,8,80,26,7,U.soft("signal"),"signal",1.3));q.push(S.T(xa,25,"機器","middle",11,"signal",true));
      q.push(S.RECT(xb-40,8,80,26,7,U.soft("green"),"green",1.3));q.push(S.T(xb,25,"サーバ","middle",11,"green",true));
      q.push(S.L(xa,34,xa,y0+H+6,"signal",1.2,"3 4"));q.push(S.L(xb,34,xb,y0+H+6,"green",1.2,"3 4"));
      U.nice(0,T1,5).forEach(function(v){var yy=Y(v);q.push(S.L(40,yy,46,yy,"muted",1));q.push(S.T(52,yy+3.5,F.time(v/1000),"start",9,"muted"));});
      q.push(S.L(43,y0,43,y0+H,"muted",1));
      r.spans.forEach(function(sp){if(sp.t0>T1)return;var x=sp.h==="A"?xa-10:xb+10,s=sp.h==="A"?-1:1,y1=Y(sp.t0),y2=Y(Math.min(sp.t1,T1));if(y2-y1<3)return;
        var c=sp.k==="d"?"teal":"signal";q.push(S.W([x,y1,x+s*5,y1,x+s*5,y2,x,y2],c,1.4));
        q.push(S.T(x+s*9,(y1+y2)/2+4,sp.k==="d"?"遅延 ACK":"Nagle でためる","start"===(s>0?"start":"end")?"start":(s>0?"start":"end"),9.5,c,true));});
      var lastA=-99,lastB=-99;
      r.segs.forEach(function(sg){if(sg.t>T1)return;var fromA=sg.from==="A",x1=fromA?xa:xb,x2=fromA?xb:xa,c=sg.len===0?"green":(fromA?"ink":"purple");
        q.push(S.ARR(x1,Y(sg.t),x2,Y(Math.min(sg.a,T1)),c,1.4,6));
        var ly=(Y(sg.t)+Y(Math.min(sg.a,T1)))/2-5;
        if(fromA){if(ly-lastA>=12){q.push(S.T((x1+x2)/2-40,ly,sg.lab,"middle",9.5,c,sg.len>0));lastA=ly;}}
        else{if(ly-lastB>=12){q.push(S.T((x1+x2)/2+40,ly,sg.lab,"middle",9.5,c,sg.len>0));lastB=ly;}}});
      q.push(S.T(W/2,y0+H+24,(p.pat===2?"最初の 6 つのセグメントまで":"最初の 2 回の要求")+"（縮尺どおり。黒: 機器のデータ、紫: サーバのデータ、緑: ACK だけのセグメント）","middle",9.5,"muted"));
      box.set(S.svg(W,y0+H+34,q));
      if(p.pat===2){
        var thr=r.done?r.M/r.done*1000:0;
        ro.innerHTML="12 個（"+F.int(r.M)+" バイト）を送り切るまで <b>"+F.time((r.done||0)/1000)+"</b> ・ スループット <b>"+F.int(thr)+" B/s</b>（回線 1 Mbps として、送る時間も含む）"+
          (p.cap===1&&p.delack?' ・ <span class="warn">送信バッファが 1 つ分なので、受け手は 2 つ目を待って ACK を遅らせる: MSS ÷ (RTT + D) = '+F.int(536/((p.rtt+p.D)/1000))+" B/s（送る時間を除く）</span>":"");
      }else{
        var av=r.ex.reduce(function(a,b){return a+b;},0)/Math.max(1,r.ex.length);
        var f=(p.pat===0&&p.nagle)?(p.delack?"2RTT + D = "+F.time((2*p.rtt+p.D)/1000):"2RTT = "+F.time(2*p.rtt/1000)+"（本体はヘッダの ACK を待つ）"):"RTT = "+F.time(p.rtt/1000);
        ro.innerHTML="1 回の要求にかかる時間 <b>"+F.time(av/1000)+"</b>（"+r.ex.length+" 回の平均。回線 1 Mbps として送る時間も含む）・ 1 秒に <b>"+U.sig(1000/av,3)+" 回</b> ・ 式では "+f+"（送る時間を除く）"+
          (p.pat===0&&p.nagle&&p.delack?'<br><span class="warn">本体が Nagle アルゴリズムにためられ、ヘッダの ACK が遅延 ACK で D だけ遅れる。1 回で書くか、Nagle アルゴリズムを止める（TCP_NODELAY）と RTT で済む。</span>':"");
      }
    }
    draw();
  };
