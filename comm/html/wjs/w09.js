  /* ===== 09 章 Wi-Fi ===== */
  function _w09_fc(n){return 2407+5*n;}                       /* チャネル n の中心の周波数 [MHz] */
  function _w09_sig(v){return String(+v.toPrecision(3));}
  function _w09_life(h){var d=h/24;return d>=730?_w09_sig(d/365)+" 年":(d>=2?Math.round(d)+" 日":_w09_sig(h)+" 時間");}

  /* ---- 1 節: チャネルの重なり ---- */
  REG.w09_channels=function(el,U){
    var S=U.S;
    U.head(el,"CHANNELS","2.4 GHz 帯のチャネルの重なり");
    var chs=[];for(var n=1;n<=13;n++)chs.push({v:String(n),t:n+"（"+_w09_fc(n)+" MHz）"});
    var none=[{v:"0",t:"なし"}].concat(chs);
    var row=U.ctrls(el);
    var me=U.select(row,"自分の家の AP",chs,"6",draw);
    var a1=U.select(row,"近くの AP 1",none,"1",draw);
    var a2=U.select(row,"近くの AP 2",none,"3",draw);
    var row2=U.ctrls(el);
    var wd=U.select(row2,"自分の AP の信号の幅",[{v:"20",t:"20 MHz（802.11g・n）"},{v:"22",t:"22 MHz（802.11b）"},{v:"40",t:"40 MHz（802.11n、2 チャネル分）"}],"20",draw);
    var br=U.btnrow(el);
    function ex(m,x,y,w){me.set(String(m));a1.set(String(x));a2.set(String(y));wd.set(String(w));draw();}
    U.button(br,"1・6・11 に分ける",function(){ex(6,1,11,20);});
    U.button(br,"一部が重なる",function(){ex(6,1,3,20);});
    U.button(br,"同じチャネルを分け合う",function(){ex(6,6,11,20);});
    U.button(br,"自分だけ 40 MHz にする",function(){ex(6,1,11,40);});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* 信号の中心と幅。40 MHz は、主のチャネルの上か下の 20 MHz を足す（ここでは 7 以下なら上） */
    function sg(ch,w){var f=_w09_fc(ch);if(w===40)f+=ch<=7?10:-10;return {ch:ch,f:f,w:w,lo:f-w/2,hi:f+w/2};}
    function rel(a,b){if(a.ch===b.ch)return "same";return Math.abs(a.f-b.f)<(a.w+b.w)/2-1e-9?"over":"none";}
    var TXT={same:'<b style="color:var(--green)">同じチャネル</b>: 互いの送信を聞き取って待ち合い、時間を分け合う',
             over:'<span class="warn">一部が重なる</span>: 相手の信号が雑音として届き、フレームが壊れやすい',
             none:'<span class="ok">重ならない</span>: 互いに影響しない（信号の裾の分を除く）'};
    function draw(){
      var w=+wd.get(),m=sg(+me.get(),w),nb=[];
      [[a1,"近くの AP 1","purple"],[a2,"近くの AP 2","teal"]].forEach(function(q){var c=+q[0].get();if(c>0)nb.push({s:sg(c,20),name:q[1],col:q[2]});});
      var W=700,o=[],p=U.plot(40,40,640,150,[2398,2496],[0,1]),yb=190,yt=80;
      o.push(S.RECT(p.X(2400),30,p.X(2483.5)-p.X(2400),yb-30,0,"var(--muted-soft)","none",0));
      o.push(S.T(p.X(2400)+4,46,"2.4 GHz 帯","start",9.5,"muted"));
      for(var k=1;k<=13;k++){var x=p.X(_w09_fc(k));o.push(S.L(x,yb,x,yb+4,"muted",1));o.push(S.T(x,yt-26,String(k),"middle",10,"muted",false,true));}
      o.push(S.L(p.X(2398),yb,p.X(2496),yb,"muted",1.2));
      [2400,2420,2440,2460,2480].forEach(function(f){o.push(S.T(p.X(f),yb+16,String(f),"middle",9.5,"muted"));});
      o.push(S.T(p.X(2496),yb+32,"周波数 [MHz]","end",9.5,"muted"));
      function hump(s,c,y,lw){var e=Math.min(2,s.w*0.12);return S.PL([[p.X(s.lo),yb],[p.X(s.lo+e),y],[p.X(s.hi-e),y],[p.X(s.hi),yb]],c,lw,U.soft(c),null,0.45);}
      nb.forEach(function(q,i){o.push(hump(q.s,q.col,yt+14+i*14,1.6));});
      o.push(hump(m,"gold",yt,2.4));
      /* 重なりの範囲 */
      nb.forEach(function(q){if(rel(m,q.s)==="over"){var lo=Math.max(m.lo,q.s.lo),hi=Math.min(m.hi,q.s.hi);
        o.push(S.RECT(p.X(lo),yb-12,p.X(hi)-p.X(lo),12,1,U.soft("alias"),"alias",1.2));}});
      var lx=60;
      [[ "自分の AP（"+m.ch+(w===40?(m.ch<=7?"+上":"+下"):"")+"、"+w+" MHz）","gold"]].concat(nb.map(function(q){return [q.name+"（"+q.s.ch+"）",q.col];})).forEach(function(L){
        o.push(S.RECT(lx,yb+40,10,10,2,U.soft(L[1]),L[1],1.2));o.push(S.T(lx+15,yb+49,L[0],"start",10,L[1],true));lx+=U.tw(L[0],10)+40;});
      o.push(S.RECT(lx,yb+40,10,10,2,U.soft("alias"),"alias",1.2));o.push(S.T(lx+15,yb+49,"一部が重なる範囲","start",10,"alias",true));
      box.set(S.svg(W,yb+60,o));
      var rows=nb.map(function(q){return ["自分の AP と "+q.name,TXT[rel(m,q.s)]];});
      if(nb.length===2)rows.push(["近くの AP 1 と 2",TXT[rel(nb[0].s,nb[1].s)]]);
      /* 自分の AP に選ぶとよいチャネル */
      var good=[],ok=[];
      for(var c=1;c<=13;c++){var s=sg(c,w),ov=0,same=0;nb.forEach(function(q){var r=rel(s,q.s);if(r==="over")ov++;if(r==="same")same++;});
        if(!ov&&!same)good.push(c);else if(!ov)ok.push(c);}
      ro.innerHTML=(rows.length?U.tbl(["組","関係"],rows):"近くの AP は無い。")+
        "近くの AP と重ならないチャネル（この幅で）: <b>"+(good.length?good.join("・"):"なし")+"</b>"+
        (ok.length?" ・ 一部は重ならず、同じチャネルを分け合うもの: <b>"+ok.join("・")+"</b>":"")+
        (w===40?'<div class="wnote">40 MHz の信号は 2.4 GHz 帯の 83.5 MHz の半分ほどを占めるので、近くに AP があると、ほとんどの選び方で重なる。</div>':
         '<div class="wnote">20 MHz 幅の信号どうしは、中心が 20 MHz 以上（番号の差が 4 以上）離れていれば重ならない。22 MHz 幅の 802.11b を含めるなら差を 5 以上にする。台形は簡単にした形で、実際の信号の裾はもっと広い。</div>');
    }
    draw();
  };

  /* ---- 2 節: スキャン ---- */
  var _w09_APS=[{s:"home",b:"00:00:5E:00:53:A0",ch:6,r:-52},{s:"home-guest",b:"00:00:5E:00:53:A1",ch:6,r:-53},
    {s:"home",b:"00:00:5E:00:53:B0",ch:11,r:-71},{s:"next-door",b:"00:00:5E:00:53:C0",ch:1,r:-80},{s:"",b:"00:00:5E:00:53:D0",ch:11,r:-86,hid:true}];
  REG.w09_scan=function(el,U){
    var S=U.S;
    U.head(el,"SCAN","スキャンにかかる時間と、見つかる AP");
    var row=U.ctrls(el);
    var md=U.seg(row,["パッシブ","アクティブ","前回のチャネル 6 だけ（アクティブ）"],0,draw);
    var row1=U.ctrls(el);
    var nc=U.slider(row1,"調べるチャネル",{min:1,max:13,step:1,value:13,fmt:function(v){return "1〜"+v;},onInput:draw});
    var bi=U.select(row1,"ビーコン間隔",[{v:"50",t:"50 TU（51.2 ms）"},{v:"100",t:"100 TU（102.4 ms）"},{v:"200",t:"200 TU（204.8 ms）"}],"100",draw);
    var row2=U.ctrls(el);
    var td=U.slider(row2,"パッシブの待ち時間 t_d",{min:10,max:300,step:0.2,value:104.4,fmt:function(v){return v.toFixed(1)+" ms";},onInput:draw});
    var mn=U.slider(row2,"アクティブの最小",{min:5,max:60,step:1,value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var mx=U.slider(row2,"アクティブの最大",{min:10,max:120,step:1,value:40,fmt:function(v){return v+" ms";},onInput:draw});
    var row3=U.ctrls(el);
    var pl=U.slider(row3,"フレームが失われる確率",{min:0,max:60,step:1,value:0,fmt:function(v){return v+" %";},onInput:draw});
    var seed=1,br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例の値に戻す",function(){md.set(0);nc.set(13);bi.set("100");td.set(104.4);mn.set(20);mx.set(40);pl.set(0);seed=1;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var TB_=2,TS=2;     /* ビーコン 1 つを受ける時間・チャネルの切り替え [ms] */
    function draw(){
      var mode=md.get(),R=U.rng(seed*7919+13),TB=+bi.get()*1.024,p=pl.get()/100,dmin=mn.get(),dmax=Math.max(mx.get(),dmin);
      var phase=_w09_APS.map(function(){return R.range(0,TB);});
      var chans=[];if(mode===2)chans=[6];else for(var c=1;c<=nc.get();c++)chans.push(c);
      var t=0,rows=[],found={};
      chans.forEach(function(ch){
        var t0=t+TS,ev=[],end,heard=false;          /* チャネルを切り替えてから聞き始める */
        var aps=_w09_APS.map(function(a,i){return {a:a,i:i};}).filter(function(q){return q.a.ch===ch;});
        var probeLost=false;
        if(mode>0){probeLost=R.chance(p);ev.push({t:t0+0.3,k:"probe",lost:probeLost});
          aps.forEach(function(q){var ans=mode===2?(q.a.s==="home"):!q.a.hid;if(!ans)return;
            var tr=t0+R.range(1,6),lost=probeLost||R.chance(p);ev.push({t:tr,k:"resp",lost:lost,ap:q.i,pl:probeLost});
            if(!lost&&tr<=t0+dmin){heard=true;}
            if(!lost){found[q.i]=found[q.i]||"プローブ応答";}});
          end=t0+(heard?dmax:dmin);
        }else end=t0+td.get();
        /* その間に聞こえたビーコン（パッシブでもアクティブでも受け取れる） */
        aps.forEach(function(q){for(var s=phase[q.i]+Math.ceil((t0-phase[q.i])/TB)*TB;s<end;s+=TB){
          var full=s+TB_<=end,lost=R.chance(p);ev.push({t:s,k:"beacon",lost:lost,ap:q.i,full:full});
          if(full&&!lost)found[q.i]=found[q.i]||"ビーコン";}});
        rows.push({ch:ch,t0:t0,end:end,ev:ev,has:aps.length>0});
        t=end;
      });
      var total=t;
      /* 図: チャネルごとの時間の帯 */
      var W=700,x0=90,x1=W-20,sc=(x1-x0)/Math.max(total,1),rh=mode===2?40:20,y0=24,o=[];
      function X(v){return x0+v*sc;}
      rows.forEach(function(r,i){var y=y0+i*rh;
        o.push(S.T(x0-8,y+rh/2+4,"チャネル "+r.ch,"end",9.5,r.has?"signal":"muted",r.has));
        o.push(S.L(x0,y+rh-2,x1,y+rh-2,"grid",1));
        o.push(S.RECT(X(r.t0),y+3,Math.max(1.5,(r.end-r.t0)*sc),rh-8,2,mode===0?U.soft("signal"):U.soft("purple"),mode===0?"signal":"purple",1));
        r.ev.forEach(function(e){var x=X(e.t);
          if(e.k==="probe"){o.push(S.RECT(x,y+1,2.5,rh-4,0,"purple","purple",0.5));if(e.lost)o.push(S.X(x+1,y+rh/2,4,"alias",1.6));}
          else if(e.lost||(e.k==="beacon"&&!e.full)){o.push(S.X(x+1,y+rh/2,4,e.lost?"alias":"faint",1.6));}
          else o.push(S.RECT(x,y+2,Math.max(2,2*sc),rh-6,1,"gold","gold",0.6));});
      });
      var ya=y0+rows.length*rh+4;
      o.push(S.L(x0,ya,x1,ya,"muted",1.1));
      U.nice(0,total,6).forEach(function(v){o.push(S.L(X(v),ya,X(v),ya+4,"muted",1));o.push(S.T(X(v),ya+16,String(v),"middle",9.5,"muted"));});
      o.push(S.T(x1,ya+32,"時間 [ms]","end",9.5,"muted"));
      o.push(S.T(x0,ya+48,"帯: そのチャネルにいる時間　金: 受け取ったビーコン・応答　赤の ×: 失われた　灰色の ×: 帯からはみ出したビーコン","start",9.5,"muted"));
      box.set(S.svg(W,ya+58,o));
      /* 読み出し */
      var fl=[],ms=[];
      _w09_APS.forEach(function(a,i){var scanned=chans.indexOf(a.ch)>=0;
        if(found[i])fl.push([a.s||"（空）",a.b,String(a.ch),a.r+" dBm",found[i]]);else if(scanned)ms.push((a.s||"（空）")+"（"+a.b.slice(-5)+"、ch "+a.ch+"）");});
      var best=null;_w09_APS.forEach(function(a,i){if(found[i]&&a.s==="home"&&(!best||a.r>best.r))best=a;});
      var f="";
      if(mode===0){var miss=Math.max(0,1-(td.get()-TB_)/TB);
        f="式: n (t_d + 切り替え 2 ms) = "+chans.length+" × ("+td.get().toFixed(1)+" + 2) = "+(chans.length*(td.get()+TS)).toFixed(1)+" ms<br>"+
          "ビーコンが失われないとき、1 つの AP を見落とす確率 = max(0, 1 − (t_d − t_b)/T_B) = <b>"+U.fmt.pct(miss)+"</b>（t_b = 2 ms、T_B = "+TB.toFixed(1)+" ms）<br>";}
      else f="AP の答えが聞こえたチャネルは最大の時間まで、聞こえなければ最小の時間で次へ移る（各チャネルの前に切り替え 2 ms。SSID を出さない AP は、SSID を空にしたプローブ要求には答えない）<br>";
      ro.innerHTML="かかった時間 = <b>"+total.toFixed(1)+" ms</b><br>"+f+
        (fl.length?U.tbl(["SSID","BSSID","チャネル","RSSI","聞こえたもの"],fl):"見つかった AP は無い。")+
        (ms.length?'<span class="warn">見落とした AP: '+ms.join("、")+'</span><br>':"")+
        (best?'つなぐ AP: <span class="ok">home（'+best.b+"、"+best.r+" dBm）</span>":'<span class="warn">home の AP が見つからない'+(mode===2?" → 全部のチャネルを調べ直す":"")+'</span>');
    }
    draw();
  };

  /* ---- 4 節: 省電力の計算機 ---- */
  REG.w09_power=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"POWER","省電力モードの平均電流と、送るときだけつなぐ場合との比べ");
    var r1=U.ctrls(el);
    var dt=U.slider(r1,"DTIM 周期 D（何回に 1 回起きるか）",{values:[1,2,3,4,5,10,20],value:3,fmt:function(v){return String(v);},onInput:draw});
    var bi=U.select(r1,"ビーコン間隔",[{v:"100",t:"100 TU（102.4 ms）"},{v:"200",t:"200 TU（204.8 ms）"},{v:"300",t:"300 TU（307.2 ms）"}],"100",draw);
    var r2=U.ctrls(el);
    var ta=U.slider(r2,"1 回起きている時間 t_a",{min:0.5,max:20,log:true,value:3,fmt:function(v){return v+" ms";},onInput:draw});
    var ia=U.slider(r2,"起きている間の電流 I_a",{min:10,max:150,step:1,value:50,fmt:function(v){return v+" mA";},onInput:draw});
    var is=U.slider(r2,"眠っている間の電流 I_s",{min:1,max:2000,log:true,value:100,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var tk=U.slider(r3,"キープアライブの間隔 T_k",{values:[10,20,30,60,120,300,600,1800,3600],value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var qk=U.slider(r3,"キープアライブの電荷 Q_k",{min:0.1,max:20,log:true,value:2.4,fmt:function(v){return v+" mC";},onInput:draw});
    var cap=U.slider(r3,"電池の容量",{min:100,max:10000,log:true,int:true,value:2000,fmt:function(v){return v+" mAh";},onInput:draw});
    var r4=U.ctrls(el);
    var tr=U.slider(r4,"測定値を送る間隔 T_r",{min:10,max:86400,log:true,int:true,value:3600,fmt:function(v){return F.time(v);},onInput:draw});
    var qc=U.slider(r4,"1 回の接続の電荷 Q_c",{min:10,max:2000,log:true,value:150,fmt:function(v){return v+" mC";},onInput:draw});
    var id=U.slider(r4,"深く眠る電流 I_d",{min:0.5,max:100,log:true,value:5,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"DTIM 1",function(){dt.set(1);draw();});
    U.button(br,"DTIM 3",function(){dt.set(3);draw();});
    U.button(br,"DTIM 10",function(){dt.set(10);draw();});
    U.button(br,"例の値に戻す",function(){dt.set(3);bi.set("100");ta.set(3);ia.set(50);is.set(100);tk.set(60);qk.set(2.4);cap.set(2000);tr.set(3600);qc.set(150);id.set(5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var D=dt.get(),TB=+bi.get()*1.024e-3,Ta=ta.get()*1e-3,Ia=ia.get()*1e-3,Is=is.get()*1e-6,Tk=tk.get(),Qk=qk.get()*1e-3,C=cap.get()*1e-3*3600,
          Tr=tr.get(),Qc=qc.get()*1e-3,Id=id.get()*1e-6;
      var warn="";if(Ta>=D*TB){warn='<span class="warn">起きている時間が起きる間隔より長い。値を見直してほしい。</span><br>';}
      var Ib=(Ia-Is)*Ta/(D*TB),Ik=Qk/Tk,IA=Is+Ib+Ik,IB=Id+Qc/Tr,Ts=Qc/(IA-Id);
      var W=700,o=[];
      /* 上: 内訳の棒 */
      var bx=150,bw=440,mxv=Math.max(IA,IB),sc=bw/mxv;
      function bar(y,label,segs,tot){o.push(S.T(bx-10,y+15,label,"end",10.5,"ink",true));var xx=bx;
        segs.forEach(function(s){var w=s[0]*sc;o.push(S.RECT(xx,y,Math.max(0.8,w),22,2,U.soft(s[1]),s[1],1.1));if(w>70)o.push(S.T(xx+w/2,y+15,s[2],"middle",9.5,s[1],true));xx+=w;});
        o.push(S.T(xx+6,y+15,F.cur(tot),"start",10.5,"ink",true));}
      bar(14,"つなぎ続ける",[[Is,"green","眠り"],[Ib,"signal","ビーコン"],[Ik,"teal","キープアライブ"]],IA);
      bar(46,"送るときだけ",[[Id,"green","深い眠り"],[Qc/Tr,"purple","接続"]],IB);
      /* 下: 送る間隔と平均電流 */
      var p=U.plot(110,100,540,170,[10,86400],[1e-6,0.05],{xlog:true,ylog:true});
      o.push(p.axes({xl:"測定値を送る間隔 T_r",yl:"平均電流",xt:[10,60,600,3600,86400],yt:[1e-6,1e-5,1e-4,1e-3,1e-2],
        xfmt:function(v){return {10:"10 秒",60:"1 分",600:"10 分",3600:"1 時間",86400:"1 日"}[v];},yfmt:function(v){return F.cur(v,1);},ylOff:62}));
      var pts=[];for(var k=0;k<=80;k++){var t=Math.pow(10,1+k*(Math.log10(86400)-1)/80),v=Id+Qc/t;if(v<=0.05&&v>=1e-6)pts.push([t,v]);}
      o.push(p.line(pts,"purple",2.2));
      if(IA<=0.05&&IA>=1e-6){o.push(p.line([[10,IA],[86400,IA]],"signal",2));o.push(S.T(p.X(86400)-4,p.Y(IA)-6,"つなぎ続ける "+F.cur(IA),"end",9.5,"signal",true));}
      if(Ts>=10&&Ts<=86400){o.push(S.L(p.X(Ts),p.Y(1e-6),p.X(Ts),p.Y(IA),"faint",1,"3 3"));o.push(S.D(p.X(Ts),p.Y(IA),"alias",4.2));
        o.push(S.T(p.X(Ts)+(p.X(Ts)>520?-6:6),p.Y(1e-6)-8,"T_r* = "+F.time(Ts),p.X(Ts)>520?"end":"start",9.5,"alias",true));}
      var vb=Math.min(0.05,Math.max(1e-6,IB));o.push(S.D(p.X(Tr),p.Y(vb),"purple",5));
      o.push(S.T(p.X(Tr)+(p.X(Tr)>520?-8:8),p.Y(vb)-8,"いまの T_r",p.X(Tr)>520?"end":"start",9.5,"purple",true));
      var yl=Math.min(0.05,Id+Qc/14);if(yl>1e-6)o.push(S.T(p.X(14),Math.max(p.y+12,p.Y(yl)-8),"送るときだけつなぐ","start",9.5,"purple",true));
      box.set(S.svg(W,312,o));
      var lifeA=C/IA/3600,lifeB=C/IB/3600;
      ro.innerHTML=warn+"つなぎ続ける: I_avg = I_s + Q_b/(D T_B) + Q_k/T_k = "+F.cur(Is)+" + "+F.cur(Ib)+" + "+F.cur(Ik)+" = <b>"+F.cur(IA)+"</b>"+
        "（Q_b = (I_a − I_s) t_a = "+U.sig((Ia-Is)*Ta*1e3,3)+" mC、D T_B = "+F.time(D*TB,4)+"）<br>"+
        "　電池寿命 <b>"+_w09_life(lifeA)+"</b> ・ 下りのデータが届くまでの遅れ: 最大 <b>"+F.time(D*TB,4)+"</b>、平均 "+F.time(D*TB/2,4)+"<br>"+
        "送るときだけつなぐ: I_avg = I_d + Q_c/T_r = "+F.cur(Id)+" + "+F.cur(Qc/Tr)+" = <b>"+F.cur(IB)+"</b>"+
        " ・ 電池寿命 <b>"+_w09_life(lifeB)+"</b> ・ 下りの遅れ: 最大 <b>"+F.time(Tr)+"</b>（次に接続するまで）<br>"+
        "T_r* = Q_c / (I_A − I_d) = <b>"+(Ts>0?Math.round(Ts)+" 秒（"+F.time(Ts)+"）":"—")+"</b> → いまの T_r（"+F.time(Tr)+"）では"+
        (IB<IA?'<span class="ok">送るときだけつなぐほうが小さい</span>':'<b style="color:var(--signal)">つなぎ続けるほうが小さい</b>')+
        '<div class="wnote">どちらも、測定値を送る電荷そのものは含めていない（同じなので）。電流と時間はすべて代表値で、製品によって大きく違う。</div>';
    }
    draw();
  };

  /* ---- 5 節: ビーコンロスの判定 ---- */
  REG.w09_loss=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BEACON LOSS","N 回続けて失われたら切断と判断する: 誤った判断と、気づくまでの時間");
    var r1=U.ctrls(el);
    var pl=U.slider(r1,"ビーコンが失われる確率 p",{min:0,max:50,step:0.5,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var nn=U.slider(r1,"切断と判断する回数 N",{min:1,max:20,step:1,value:7,onInput:draw});
    var iv=U.select(r1,"ビーコンを聞く間隔",[{v:"1",t:"102.4 ms（DTIM 1）"},{v:"3",t:"307.2 ms（DTIM 3）"},{v:"10",t:"1024 ms（DTIM 10）"}],"1",draw);
    var r2=U.ctrls(el);
    var md=U.seg(r2,["互いに関係なく失われる","続けて失われやすい（平均 3 回続く）","（平均 10 回続く）"],0,draw);
    var seed=1,br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var cache={key:null};
    function sim(p,L,n){ /* 2 つの状態（受け取れる・失われる）の間を移る失われ方。L は失われる区間の平均の長さ（L = 0 なら互いに関係なく） */
      var key=[p,L,n,seed].join(",");if(cache.key===key)return cache;
      var R=U.rng(seed*104729+7),bits=new Uint8Array(n),a,b;
      if(L===0){a=p;b=1-p;}else{b=1/L;a=p*b/Math.max(1e-12,1-p);if(a>1)a=1;}
      var bad=R.chance(p),run=0,runs=[],first={};
      for(var i=0;i<n;i++){
        if(i>0)bad=bad?!R.chance(b):R.chance(a);
        bits[i]=bad?1:0;
        if(bad){run++;}else if(run){runs.push(run);for(var k=1;k<=run;k++)if(first[k]===undefined)first[k]=i-run;run=0;}
      }
      if(run){runs.push(run);for(var k2=1;k2<=run;k2++)if(first[k2]===undefined)first[k2]=n-run;}
      cache={key:key,bits:bits,runs:runs,first:first,a:a,b:b};return cache;
    }
    function draw(){
      var p=pl.get()/100,N=nn.get(),D=+iv.get(),T=0.1024*D,n=Math.floor(86400/T),Lm=[0,3,10][md.get()];
      if(Lm>0&&Lm<1/(1-p))Lm=1/(1-p);      /* 平均の長さは、互いに関係ない場合の 1/(1−p) より短くできない */
      var r=sim(p,Lm,n);
      var cnt=0;r.runs.forEach(function(x){if(x>=N)cnt++;});
      var fIndep=n*(1-p)*Math.pow(p,N), fModel=Lm>0?n*(1-p)*r.a*Math.pow(1-r.b,N-1):fIndep;
      var W=700,o=[];
      /* 上: 1 回目の誤った判断の前後のビーコンの列 */
      var M=56,st=r.first[N]!==undefined?Math.max(0,Math.min(n-M,r.first[N]-12)):0,dx=11.5,x0=30;
      o.push(S.T(14,16,r.first[N]!==undefined?"1 回目の誤った判断の前後（"+F.time(st*T)+" から）":"この日は、N 回続けて失われることが 1 回も無かった（先頭の部分）","start",10,"ink",true));
      var c=0;for(var i=0;i<M&&st+i<n;i++){var lost=r.bits[st+i],x=x0+i*dx;
        if(i===0&&st>0){var j=st-1;c=0;while(j>=0&&r.bits[j]){c++;j--;}}
        if(lost){c++;o.push(S.X(x,36,3.6,"alias",1.6));}else{c=0;o.push(S.D(x,36,"green",3.6));}
        if(c>=N&&c===N){o.push(S.L(x,24,x,58,"alias",1.6));o.push(S.T(x+4,66,"切断と判断","start",9.5,"alias",true));}
        if(lost&&c<N&&c>0)o.push(S.T(x,54,String(c),"middle",8.5,"muted",false,true));}
      /* 下: N と 1 日の回数 */
      var p2=U.plot(110,92,450,170,[1,20],[1e-6,1e5],{ylog:true});
      o.push(p2.axes({xl:"切断と判断する回数 N",yl:"1 日の誤った判断",xt:[1,5,10,15,20],yt:[1e-6,1e-4,1e-2,1,100,1e4],xfmt:function(v){return String(v);},
        yfmt:function(v){var e=Math.round(Math.log10(v));return v>=1?String(v):(e===-2?"0.01":"10"+(e===-4?"⁻⁴":"⁻⁶"));},ylOff:56}));
      [[1,"1 日に 1 回"],[1/365,"1 年に 1 回"]].forEach(function(q){o.push(p2.line([[1,q[0]],[20,q[0]]],"muted",1,"4 3"));o.push(S.T(p2.X(20)+6,p2.Y(q[0])+4,q[1],"start",9.5,"muted"));});
      function curve(f,c,dash){var pts=[];for(var k=0;k<=190;k++){var x=1+k*0.1,v=f(x);if(v>=1e-6&&v<=1e5)pts.push([x,v]);}if(pts.length>1)o.push(p2.line(pts,c,2,dash));}
      if(p>0){curve(function(x){return n*(1-p)*Math.pow(p,x);},"signal");
        if(Lm>0)curve(function(x){return n*(1-p)*r.a*Math.pow(1-r.b,x-1);},"gold","5 3");}
      var yv=Math.max(1e-6,Math.min(1e5,cnt||1e-6));
      o.push(S.D(p2.X(N),p2.Y(yv),"alias",5));
      o.push(S.T(p2.X(N)+7,p2.Y(yv)-7,"シミュレーション "+cnt+" 回","start",9.5,"alias",true));
      o.push(S.T(p2.X(20)+6,p2.y+12,"青: 互いに関係ないときの式","start",9.5,"signal"));
      if(Lm>0)o.push(S.T(p2.X(20)+6,p2.y+28,"金: 続けて失われやすい場合","start",9.5,"gold"));
      box.set(S.svg(W,300,o));
      ro.innerHTML="1 日に聞くビーコン n = 86400 s ÷ "+F.time(T,4)+" = "+F.int(n)+"<br>"+
        "式（互いに関係ないとき）n(1 − p)p^N = "+F.int(n)+" × "+(1-p).toFixed(3)+" × "+U.sig(p,3)+"^"+N+" = <b>"+U.sig(fIndep,3)+" 回/日</b>"+(fIndep>0&&fIndep<1?"（"+F.time(86400/fIndep)+"に 1 回）":"")+"<br>"+
        (Lm>0?"続けて失われやすい場合の期待値 = <b>"+U.sig(fModel,3)+" 回/日</b>（式の "+U.sig(fModel/Math.max(fIndep,1e-300),3)+" 倍）<br>":"")+
        "シミュレーション（1 日分）: <b>"+cnt+" 回</b> ・ AP が消えてから気づくまで N × "+F.time(T,4)+" = <b>"+F.time(N*T,4)+"</b>";
    }
    draw();
  };
