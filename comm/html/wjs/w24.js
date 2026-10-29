  /* ===== 24 章 1 つの機器の通信を設計する ===== */
  /* 案 B の接続の各段: 名前, 工夫しないときの時間 [s], 工夫したときの時間 [s], 工夫の名前（null は工夫が無い段） */
  var _w24_STG=[
    ["起動と回路の準備",0.3,0.3,null],
    ["スキャン",0.346,0.042,"scan"],
    ["PMK の計算",0.5,0,"pmk"],
    ["認証・アソシエーション・4 ウェイ",0.05,0.05,null],
    ["DHCP",5.51,0.005,"dhcp"],
    ["ARP と DNS",0.035,0.035,null],
    ["TCP と TLS 1.3",1.963,0.6,"tls"],
    ["MQTT の接続",0.1,0.1,null]];
  var _w24_SC=["muted","signal","gold","teal","green","purple","alias","signal"];
  /* TLS の時間: 再開あり・なし × 暗号エンジンあり・なし（12 章 3・6 節の例の値） */
  function _w24_tls(resume,engine){return resume?(engine?0.21:0.60):(engine?0.259:1.963);}
  /* 工夫の組 f から、各段の時間の配列 */
  function _w24_times(f,boot){return _w24_STG.map(function(s,i){
    if(i===0)return boot;
    if(s[3]==="tls")return _w24_tls(f.tls,f.eng);
    return s[3]&&f[s[3]]?s[2]:s[1];});}
  function _w24_sum(a){return a.reduce(function(x,y){return x+y;},0);}
  function _w24_hm(s){var h=s/3600;return h>=48?_w24_sig(h/24)+" 日":(h>=1?_w24_sig(h)+" 時間":Math.round(s/60)+" 分");}
  function _w24_sig(v){return (+v.toPrecision(3)).toString();}

  REG.w24_budget=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BUDGET","電力の予算を積み上げる（案 A と案 B）");
    var r0=U.ctrls(el);
    var plan=U.seg(r0,["案 B（Wi-Fi）","案 A（BLE + ゲートウェイ）"],0,function(){bat.set(plan.get()===0?"2000":"220");draw();});
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"測る間隔",{values:[60,120,300,600,900,1800,3600],value:600,fmt:function(v){return v<3600?(v/60)+" 分":"1 時間";},onInput:draw});
    var ts=U.slider(r1,"送る間隔",{values:[600,1200,1800,3600,7200,10800,21600,43200,86400],value:3600,fmt:function(v){return v<3600?(v/60)+" 分":(v/3600)+" 時間";},onInput:draw});
    var bat=U.select(r1,"電池",[{v:"220",t:"CR2032（220 mAh）"},{v:"2000",t:"単 3 形 2 本（2000 mAh）"}],"2000",draw);
    var qmeas=U.slider(r1,"測定 1 回の電荷",{min:10,max:400,value:40,log:true,int:true,fmt:function(v){return v+" µC";},onInput:draw});
    var rB=U.ctrls(el), rB2=U.ctrls(el);
    var f={};
    [["scan","前回のチャネルと BSSID を覚える（09 章 2 節）"],["pmk","PMK を保存する（09 章 3 節）"],["dhcp","前のアドレスで REQUEST、重複の確認は最初だけ（08 章 3 節）"],
     ["tls","TLS のセッションの再開（12 章 6 節）"],["eng","暗号エンジン（12 章 3 節）"],["pack","送る件を 1 つのメッセージに（15 章 7 節）"]].forEach(function(o){f[o[0]]=U.checkbox(rB,o[1],o[0]!=="eng",draw);});
    var iw=U.slider(rB2,"Wi-Fi が起きている間の電流",{min:50,max:200,step:5,value:100,fmt:function(v){return v+" mA";},onInput:draw});
    var isb=U.slider(rB2,"眠りの電流（B）",{min:1,max:50,value:5,log:true,fmt:function(v){return v+" µA";},onInput:draw});
    var boot=U.slider(rB2,"起動と回路の準備",{min:0.1,max:1,step:0.05,value:0.3,fmt:function(v){return v.toFixed(2)+" s";},onInput:draw});
    var rA=U.ctrls(el);
    var isa=U.slider(rA,"眠りの電流（A）",{min:0.5,max:10,value:2,log:true,fmt:function(v){return v+" µA";},onInput:draw});
    var qa=U.slider(rA,"BLE の接続 1 回の電荷",{min:50,max:2000,value:175,log:true,int:true,fmt:function(v){return v+" µC";},onInput:draw});
    var nadv=U.slider(rA,"速いアドバタイズ（30 秒）の回数",{values:[0,1,2,5,10],value:1,fmt:function(v){return v+" 回/日";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"3 節の例に戻す",function(){tm.set(600);ts.set(3600);qmeas.set(40);iw.set(100);isb.set(5);boot.set(0.3);isa.set(2);qa.set(175);nadv.set(1);
      ["scan","pmk","dhcp","tls","pack"].forEach(function(k){f[k].set(true);});f.eng.set(false);bat.set(plan.get()===0?"2000":"220");draw();});
    U.button(br,"B の工夫をすべて外す",function(){["scan","pmk","dhcp","tls","eng","pack"].forEach(function(k){f[k].set(false);});draw();});
    var box=U.svgbox(el), ro=U.readout(el);
    function flags(){var o={};["scan","pmk","dhcp","tls","eng","pack"].forEach(function(k){o[k]=f[k].get();});return o;}
    function draw(){
      var isB=plan.get()===0;
      rB.style.display=isB?"":"none"; rB2.style.display=isB?"":"none"; rA.style.display=isB?"none":"";
      var Tm=tm.get(), Ts=Tm*Math.max(1,Math.round(ts.get()/Tm)), Bn=Ts/Tm, cap=parseFloat(bat.get());
      var nmeas=86400/Tm, nconn=86400/Ts, Qmeas=qmeas.get()*1e-6, Qm=2.4e-3;
      var fl=flags(), tB=_w24_times(fl,boot.get()), tBsum=_w24_sum(tB), Iw=iw.get()*1e-3, QcB=Iw*tBsum;
      var t0=_w24_times({},0.3), t0sum=_w24_sum(t0);
      var segs, Is, tconn;
      if(isB){
        Is=isb.get()*1e-6; tconn=tBsum;
        var nmsg=fl.pack?nconn:nmeas;
        segs=[["眠り",Is,"muted"],["測定",Qmeas*nmeas/86400,"teal"],["接続",QcB*nconn/86400,"signal"],["メッセージ",Qm*nmsg/86400,"purple"],["時刻合わせ",Qm*2/86400,"gold"]];
      }else{
        Is=isa.get()*1e-6; tconn=1.1;
        segs=[["眠り",Is,"muted"],["測定",Qmeas*nmeas/86400,"teal"],["接続",qa.get()*1e-6*nconn/86400,"signal"],["速いアドバタイズ",4.06e-3*nadv.get()/86400,"green"]];
      }
      var I=_w24_sum(segs.map(function(s){return s[1];}));
      var life=cap*1e-3*3600/I/(86400*365), lim=cap*1e-3/(5*8760);
      var W=700,o=[],y=16;
      // 上の段: B は接続の各段、A は 1 回の接続の電荷の比較
      if(isB){
        o.push(S.T(16,y+2,"Wi-Fi の接続 1 回の各段の時間（上: いまの設定、下: 工夫しないとき）","start",10.5,"ink",true));
        var mx=Math.max(t0sum,tBsum)*1.02, sc=(W-190)/mx;
        [[tB,y+12,"いま"],[t0,y+40,"工夫しない"]].forEach(function(r){
          var x=110;o.push(S.T(102,r[1]+15,r[2],"end",10,"muted"));
          r[0].forEach(function(t,i){var w=t*sc;if(w<=0)return;o.push(S.RECT(x,r[1],Math.max(w,1),20,2,U.soft(_w24_SC[i]),_w24_SC[i],1.1));
            var lab=_w24_STG[i][0];if(w>U.tw(lab,9)+6)o.push(S.T(x+w/2,r[1]+14,lab,"middle",9,_w24_SC[i],true));x+=w;});
          o.push(S.T(x+6,r[1]+15,F.time(_w24_sum(r[0]))+"（"+F.num(Iw*_w24_sum(r[0])*1e3,3)+" mC）","start",10,"ink",true));});
        y+=74;
      }else{
        o.push(S.T(16,y+2,"接続 1 回の電荷（対数目盛）: A の BLE と、いまの設定の B の Wi-Fi","start",10.5,"ink",true));
        var p0=U.plot(150,y+10,440,44,[1e-5,1],[0,2],{xlog:true});
        [[qa.get()*1e-6,"A（BLE）","signal",0],[QcB,"B（Wi-Fi）","gold",1]].forEach(function(r){var yy=y+12+r[3]*22;
          o.push(S.T(142,yy+13,r[1],"end",10,"ink"));o.push(S.RECT(150,yy,Math.max(p0.X(r[0])-150,1),16,2,U.soft(r[2]),r[2],1.2));
          o.push(S.T(p0.X(r[0])+5,yy+13,r[0]<1e-3?F.num(r[0]*1e6,3)+" µC":F.num(r[0]*1e3,3)+" mC","start",10,r[2],true));});
        [1e-5,1e-4,1e-3,1e-2,1e-1,1].forEach(function(v){o.push(S.T(p0.X(v),y+70,v<1e-3?Math.round(v*1e6)+" µC":(v<1?Math.round(v*1e3)+" mC":"1 C"),"middle",9,"muted"));});
        y+=82;
      }
      // 下の段: 予算の積み上げ
      y+=10;
      o.push(S.T(16,y,"平均電流の積み上げ（µA）","start",10.5,"ink",true));
      var top=Math.max(I,lim)*1.12*1e6, sc2=(W-200)/top, x=110, yb=y+12;
      segs.forEach(function(s){var w=s[1]*1e6*sc2;o.push(S.RECT(x,yb,Math.max(w,0.8),24,2,U.soft(s[2]),s[2],1.1));
        var lab=s[0]+" "+F.num(s[1]*1e6,3);if(w>U.tw(lab,9)+6)o.push(S.T(x+w/2,yb+16,lab,"middle",9,s[2],true));x+=w;});
      o.push(S.T(x+6,yb+16,F.num(I*1e6,3)+" µA","start",10.5,"ink",true));
      var xl=110+lim*1e6*sc2;
      o.push(S.L(xl,yb-6,xl,yb+32,"alias",1.4,"5 3"));
      o.push(S.T(xl,yb+46,"5 年の上限 "+F.num(lim*1e6,3)+" µA","middle",9.5,"alias"));
      // 凡例
      var lx=16,ly=yb+66;
      segs.forEach(function(s){o.push(S.RECT(lx,ly-9,10,10,2,U.soft(s[2]),s[2],1.1));o.push(S.T(lx+14,ly,s[0],"start",9.5,"muted"));lx+=24+U.tw(s[0],9.5);});
      box.set(S.svg(W,ly+10,o));
      // 読み出し
      var big=segs.slice().sort(function(a,b){return b[1]-a[1];})[0], Qbig=isB?QcB:qa.get()*1e-6, Tstar=Qbig/Is;
      var ok=life>=5;
      ro.innerHTML="送る間隔 "+(Ts<3600?(Ts/60)+" 分":(Ts/3600)+" 時間")+"（"+Bn+" 件ずつ）・1 日のデータ "+F.int(nmeas*12)+" バイト（1 件 12 バイト）<br>"+
        "平均電流 = 眠り + Σ（回数 × 1 回の電荷）÷ 86400 s = <b>"+F.num(I*1e6,3)+" µA</b> ・ 電池寿命 "+cap+" mAh ÷ 平均電流 ≈ <b>"+F.num(life,3)+" 年</b> "+
        (ok?'<span class="ok">R5（5 年）を満たす</span>':'<span class="warn">R5（5 年）に届かない</span>')+"<br>"+
        "いちばん大きな項: "+big[0]+"（"+Math.round(big[1]/I*100)+" %）・ 接続の T* = 1 回の電荷 ÷ 眠りの電流 = "+_w24_hm(Tstar)+
        (Tstar>Ts?"（送る間隔より長いので、接続 1 回の電荷を減らすのが効く）":"（送る間隔より短いので、眠りの電流を減らすのが効く）")+"<br>"+
        "上りの最大の遅れ = ("+Bn+" − 1) × "+(Tm/60)+" 分 + 接続 "+F.time(tconn)+" ≈ <b>"+_w24_hm((Bn-1)*Tm+tconn)+"</b>（R3: 1 時間以内 "+((Bn-1)*Tm+tconn<=3600?'<span class="ok">○</span>':'<span class="warn">×</span>')+"）・ 下りの最大の遅れ = 送る間隔 <b>"+_w24_hm(Ts)+"</b>（R4 "+(Ts<=3600?'<span class="ok">○</span>':'<span class="warn">×</span>')+"）"+
        '<div class="wnote">値はすべて代表値（3 節の表）。B の接続の電荷は「各段の時間の和 × Wi-Fi の電流」、メッセージと時刻合わせは 1 回 2.4 mC（08 章 5 節）、A の接続の電荷は 19 章 6 節の 175 µC が初めの値。送る間隔は、測る間隔の整数倍に丸めた。</div>';
    }
    draw();
  };

  /* 故障の種類: 名前, 1 回の失敗の時間 [s]（100 mA を掛けて電荷）, 分け方（"temp"・"config"・"time"）, 説明 */
  var _w24_FK=[
    ["AP の電源が切れている（AP が見つからない）",0.688,"temp","起動と 2 回のスキャンで気づく"],
    ["DNS が答えない",8.402,"temp","2 秒ごとに 4 回の期限（08 章 7 節）まで待つ"],
    ["サーバに届かない（TCP の期限 10 s）",10.432,"temp","TCP の期限（08 章 7 節）まで待つ"],
    ["PUBACK が来ない（ブローカの不調）",11.132,"temp","接続して送り、10 s 待つ。件は列に残る"],
    ["ブローカが資格情報を拒む（設定の誤り）",1.132,"config","接続して CONNACK で拒まれる"],
    ["電池を替えて時刻が戻った（前提の崩れ）",0.63,"time","TLS が有効期間の外で失敗し、SNTP の後にやり直す"]];

  REG.w24_fail=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"FAULT","失敗を起こして、起床ごとの動きを見る（案 B）");
    var r1=U.ctrls(el);
    var kind=U.select(r1,"失敗の種類",_w24_FK.map(function(k){return k[0];}),2,draw);
    var pol=U.select(r1,"次に試すまでの待ち方",["毎時そのまま試す","1・2・4・8 時間（上限 8 時間）","1・2・4・…・24 時間（上限 24 時間）"],1,draw);
    var r2=U.ctrls(el);
    var st=U.slider(r2,"失敗が始まる時刻",{values:[2,6,12],value:6,fmt:function(v){return v+" 時間後";},onInput:draw});
    var du=U.slider(r2,"失敗が続く長さ",{values:[1,3,6,12,24,48,96,168,240],value:24,fmt:function(v){return v<48?v+" 時間":(v/24)+" 日";},onInput:draw});
    var box=U.svgbox(el), ro=U.readout(el);
    var QC=0.1132, QM=2.4e-3, CAPQ=1008;
    /* 起床ごとに進める。fk = null なら失敗なし */
    function sim(fk,p,s0,dur,H){
      var nw=H*6, q=[], nextTry=0, fails=0, Q=0, att=[], lost=0, maxDelay=0, qlen=[], recov=null, firstOk=null, timeFixed=false;
      for(var k=0;k<nw;k++){
        var now=k*600;
        Q+=40e-6+5e-6*600;   /* 測定と、10 分の眠り（5 µA） */
        if(q.length>=CAPQ){q.shift();lost++;}
        q.push(now);
        if(now>=nextTry){
          var failing=fk&&now>=s0*3600&&now<(s0+dur)*3600, cls=null;
          if(fk&&fk[2]==="time"){failing=false;if(!timeFixed&&now>=s0*3600){timeFixed=true;Q+=fk[1]*0.1;}}
          if(failing){cls=fk[2];Q+=fk[1]*0.1;att.push([now,false]);fails++;
            var wait=86400;
            if(p===0)wait=3600;
            else if(cls==="temp"){var capw=p===1?8*3600:24*3600;wait=Math.min(capw,3600*Math.pow(2,fails-1));}
            nextTry=now+wait;
          }else{
            Q+=QC+Math.ceil(q.length/6)*QM;att.push([now,true]);
            q.forEach(function(t){maxDelay=Math.max(maxDelay,now-t);});
            q=[];fails=0;nextTry=now+3600;
            if(fk&&now>=(s0+dur)*3600&&firstOk===null)firstOk=now;
          }
        }
        if(k%6===0&&now%86400===0)Q+=2*QM;   /* 時刻合わせ（1 日 2 回）を、日ごとにまとめて足す */
        qlen.push(q.length);
      }
      return {Q:Q,att:att,lost:lost,maxDelay:maxDelay,qlen:qlen,firstOk:firstOk};
    }
    function draw(){
      var fk=_w24_FK[kind.get()], p=pol.get(), s0=st.get(), dur=du.get();
      if(fk[2]==="time")dur=1;
      var H=Math.min(288,Math.max(72,Math.ceil((s0+dur+24)/24)*24));
      var r=sim(fk,p,s0,dur,H), base=sim(null,p,s0,dur,H);
      var W=700,o=[],x0=70,x1=680,X=function(h){return x0+h/H*(x1-x0);};
      o.push(S.T(16,16,"起床ごとの結果（"+H+" 時間）","start",10.5,"ink",true));
      o.push(S.RECT(X(s0),24,X(Math.min(H,s0+dur))-X(s0),56,2,U.soft("alias"),"none",0));
      o.push(S.T(X(s0)+3,36,fk[2]==="time"?"時刻が戻った":"失敗している間","start",9.5,"alias",true));
      o.push(S.T(x0-6,62,"試み","end",9.5,"muted"));
      r.att.forEach(function(a){var h=a[0]/3600;
        if(a[1])o.push(S.RECT(X(h)-1,48,2.4,22,1,"green","green",0.5));
        else o.push(S.X(X(h),59,4,"alias",1.6));});
      // 列の量
      var mx=Math.max(12,Math.max.apply(null,r.qlen))*1.1, gp=U.plot(x0,100,x1-x0,120,[0,H],[0,mx]);
      var xt=[];for(var h=0;h<=H;h+=(H>120?24:12))xt.push(h);
      o.push(gp.axes({xl:"時間 [h]",yl:"列の件数",xt:xt,xfmt:function(v){return String(v);},yfmt:function(v){return String(Math.round(v));}}));
      if(mx>CAPQ*0.8){o.push(S.L(gp.X(0),gp.Y(CAPQ),gp.X(H),gp.Y(CAPQ),"alias",1.2,"5 3"));o.push(S.T(gp.X(H)-4,gp.Y(CAPQ)-5,"列の容量 1008 件（7 日分）","end",9.5,"alias"));}
      o.push(gp.steps(r.qlen.map(function(v,k){return [k/6,v];}),"signal",1.6));
      o.push(S.RECT(x0,266,10,10,2,U.soft("green"),"green",1));o.push(S.T(x0+14,275,"送れた","start",9.5,"muted"));
      o.push(S.X(x0+70,271,4,"alias",1.6));o.push(S.T(x0+80,275,"失敗した","start",9.5,"muted"));
      o.push(S.L(x0+150,271,x0+170,271,"signal",1.6));o.push(S.T(x0+174,275,"送信待ちの列の件数","start",9.5,"muted"));
      box.set(S.svg(W,284,o));
      var nfail=r.att.filter(function(a){return !a[1];}).length, extra=r.Q-base.Q, Iavg=r.Q/(H*3600), Ib=base.Q/(H*3600);
      var rec=r.firstOk!==null?_w24_hm(r.firstOk-(s0+dur)*3600):"—";
      ro.innerHTML=fk[3]+"（1 回の失敗 "+(fk[2]==="time"?"の上乗せ ":"")+F.num(fk[1]*0.1*1e3,3)+" mC）<br>"+
        "試み "+r.att.length+" 回（失敗 "+nfail+" 回）・ 余分にかかった電荷 <b>"+F.num(extra,3)+" C</b> ・ この "+H+" 時間の平均電流 <b>"+F.num(Iavg*1e6,3)+" µA</b>（失敗が無ければ "+F.num(Ib*1e6,3)+" µA）<br>"+
        "上りの最大の遅れ <b>"+_w24_hm(r.maxDelay)+"</b> ・ 直ってから最初に送れるまで <b>"+rec+"</b> ・ 失った件 "+(r.lost?'<span class="warn">'+r.lost+" 件</span>":'<span class="ok">0 件</span>')+
        '<div class="wnote">起床は 10 分ごと、送るのは 1 時間ごと。1 回の失敗の電荷は、気づくまでの時間 × 100 mA（5 節）。送れたときは接続 113 mC と、6 件ごとに 1 つのメッセージ 2.4 mC。列は 1008 件（7 日分）で、満杯なら古いものを捨てる（15 章 3 節）。設定の誤りは、待ち方が「毎時そのまま」でなければ 1 日おきに試す。</div>';
    }
    draw();
  };
