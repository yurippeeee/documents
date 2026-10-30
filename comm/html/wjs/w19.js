  /* ===== 19 章 BLE のスループットと消費電力 ===== */
  /* リンク層のパケットの空中時間 [µs]。P はペイロード（MIC を除く）のバイト数、phy は "1M" "2M" "S2" "S8" */
  function _w19_air(P,phy,mic){var m=(mic&&P>0)?4:0;
    if(phy==="1M")return (1+4+2+P+m+3)*8;
    if(phy==="2M")return (2+4+2+P+m+3)*4;
    var S=phy==="S8"?8:2;return 80+296+S*(8*(2+P+m)+27);}
  var _w19_PHYNAME={"1M":"LE 1M","2M":"LE 2M","S2":"LE Coded（S = 2）","S8":"LE Coded（S = 8）"};
  function _w19_life(h){var d=h/24;return d>=365?_w19_sig(d/365,3)+" 年":(d>=1?_w19_sig(d,3)+" 日":_w19_sig(h,3)+" 時間");}
  function _w19_sig(v,d){d=d||3;if(v===0)return "0";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  /* ---- 3 節: スループットの計算機 ---- */
  REG.w19_tput=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"THROUGHPUT","1 回の接続イベントと、理論値から実効値の目安まで");
    var r1=U.ctrls(el);
    var phy=U.select(r1,"PHY",[{v:"1M",t:"LE 1M"},{v:"2M",t:"LE 2M"},{v:"S2",t:"LE Coded（S = 2）"},{v:"S8",t:"LE Coded（S = 8）"}],"2M",draw);
    var ll=U.slider(r1,"ペイロードの最大（DLE）",{values:[27,60,100,123,160,200,251],value:251,fmt:function(v){return v+" バイト"+(v===27?"（DLE なし）":"");},onInput:draw});
    var mtu=U.slider(r1,"ATT_MTU",{values:[23,50,100,158,185,247,300,512],value:247,fmt:function(v){return String(v);},onInput:draw});
    var r2=U.ctrls(el);
    var how=U.select(r2,"送り方",["通知・Write Command（待たない）","Write Request・指示（1 回に接続間隔 1 回分）","Write Request・指示（1 回に接続間隔 2 回分）"],0,draw);
    var enc=U.checkbox(r2,"暗号化（MIC 4 バイト）",true,draw);
    var r3=U.ctrls(el);
    var ci=U.slider(r3,"接続間隔",{values:[7.5,10,15,20,30,45,50,75,100,200,500,1000,4000],value:15,fmt:function(v){return v+" ms";},onInput:draw});
    var cap=U.slider(r3,"1 イベントの往復の上限",{values:[1,2,3,4,5,6,7,8,10,12,16,20,30,0],value:7,fmt:function(v){return v?v+" 往復":"制限なし";},onInput:draw});
    var loss=U.slider(r3,"失われる往復の割合",{min:0,max:30,step:1,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var r4=U.ctrls(el);
    var pess=U.checkbox(r4,"失われたら、そのイベントを終える（悲観的な見積もり）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"3 節の例 (a)",function(){phy.set("2M");ll.set(251);mtu.set(247);how.set(0);enc.set(true);ci.set(15);cap.set(7);loss.set(5);pess.set(false);draw();});
    U.button(br,"3 節の例 (b)",function(){phy.set("1M");ll.set(27);mtu.set(23);how.set(0);enc.set(true);ci.set(30);cap.set(4);loss.set(5);pess.set(false);draw();});
    U.button(br,"理論値の条件（上限なし・失われない）",function(){cap.set(0);loss.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);

    /* frags: データのパケットの空中時間の列（L2CAP のパケット 1 つ分）、t0: 空パケット、k: 書き込みなら 1・2、通知なら 0 */
    function simulate(o){
      var R=U.rng(o.seed),fi=0,pdus=0,lost=0,rounds=0,next=0,ev0=[];
      for(var e=0;e<o.Nev;e++){
        if(o.k&&e<next)continue;
        var used=0,k=0,log=[];
        for(;;){
          var d=o.frags[fi],rt=d+300+o.t0;
          if(used+rt>o.Tci+1e-6)break;
          if(o.cap&&k>=o.cap)break;
          var bad=o.p>0&&R.chance(o.p);
          log.push({t:used,d:d,bad:bad,first:fi===0});
          used+=rt;k++;rounds++;
          if(bad){lost++;if(o.pess)break;continue;}
          fi++;
          if(fi===o.frags.length){fi=0;pdus++;if(o.k){next=e+o.k;break;}}
        }
        if(e===0)ev0=log;
      }
      return {kbps:pdus*o.D*8/(o.Nev*o.Tci)*1000,ev0:ev0,lost:lost,rounds:rounds,pdus:pdus};
    }
    function draw(){
      var P=phy.get(),LL=ll.get(),M=mtu.get(),k=how.get(),E=enc.get(),Tci=ci.get()*1000,NC=cap.get(),p=loss.get()/100;
      var D=M-3,Lm=M+4,f=Math.ceil(Lm/LL),sizes=[];
      for(var i=0;i<f;i++)sizes.push(i<f-1?LL:Lm-LL*(f-1));
      var t0=_w19_air(0,P,false);
      var frE=sizes.map(function(s){return _w19_air(s,P,E);}),fr0=sizes.map(function(s){return _w19_air(s,P,false);});
      var sum=function(a){return a.reduce(function(x,y){return x+y;},0);};
      var Tpdu0=sum(fr0)+f*(300+t0),TpduE=sum(frE)+f*(300+t0);
      var th0=D*8/Tpdu0*1000,thE=D*8/TpduE*1000;
      var base={frags:frE,t0:t0,D:D,Tci:Tci,seed:seed,Nev:400,pess:pess.get()};
      function run(o){var q={};for(var a in base)q[a]=base[a];for(var b in o)q[b]=o[b];return simulate(q);}
      var sQ=run({cap:0,p:0,k:0}),sC=run({cap:NC,p:0,k:0}),sW=k?run({cap:NC,p:0,k:k}):null,sL=run({cap:NC,p:p,k:k});
      var steps=[["理論値（暗号化なし）",th0,"signal","8D ÷ T_ex（2 節）"]];
      if(E)steps.push(["暗号化（MIC 4 バイト）",thE,"gold","データのパケットだけ 4 バイト長い"]);
      steps.push(["接続間隔の端数",sQ.kbps,"gold","間隔に入る往復だけ"]);
      if(NC)steps.push(["1 イベント "+NC+" 往復まで",sC.kbps,"gold","コントローラの上限"]);
      if(k)steps.push(["応答を待つ（間隔 "+k+" 回に 1 回）",sW.kbps,"gold","ATT のストップアンドウェイト"]);
      if(p>0)steps.push([Math.round(p*100)+" % の往復が失われる",sL.kbps,"alias","乱数で 400 イベントを試した値"]);
      var fin=steps[steps.length-1][1];
      steps[steps.length-1][2]="alias";
      /* ---- 図: 1 回目の接続イベント ---- */
      var W=700,o=[],ev=sL.ev0,used=ev.length?ev[ev.length-1].t+ev[ev.length-1].d+300+t0:0;
      var span=Math.min(Tci,Math.max(used*1.15,600)),cut=span<Tci,x0=96,wd=560,sc=wd/span,X=function(t){return x0+t*sc;};
      var yC=30,yP=62,hh=14,dataUp=k>0;
      o.push(S.T(10,yC+11,"セントラル","start",10,"purple",true));o.push(S.T(10,yP+11,"ペリフェラル","start",10,"signal",true));
      o.push(S.L(x0,yC+hh,x0+wd,yC+hh,"faint",1));o.push(S.L(x0,yP+hh,x0+wd,yP+hh,"faint",1));
      o.push(S.L(X(0),14,X(0),yP+hh+6,"muted",1,"3 3"));o.push(S.T(X(0)+2,12,"アンカーポイント","start",9,"muted"));
      ev.forEach(function(r){
        /* 通知: セントラルの空パケット → IFS → ペリフェラルのデータ。書き込み: セントラルのデータ → IFS → ペリフェラルの空パケット */
        var tc=r.t,cD=dataUp?r.d:t0,tp=r.t+cD+150,pD=dataUp?t0:r.d;
        var cBad=dataUp&&r.bad,pBad=!dataUp&&r.bad;
        o.push(S.RECT(X(tc),yC,Math.max(cD*sc,1),hh,1,cBad?U.soft("alias"):U.soft("purple"),cBad?"alias":"purple",0.9));
        o.push(S.RECT(X(tp),yP,Math.max(pD*sc,1),hh,1,pBad?U.soft("alias"):U.soft("signal"),pBad?"alias":"signal",0.9));
        if(r.bad)o.push(S.X(X(dataUp?tc+cD/2:tp+pD/2),(dataUp?yC:yP)+hh/2,4,"alias",1.6));
      });
      if(cut){o.push(S.T(x0+wd+4,yC+hh+12,"…","start",12,"muted"));o.push(S.T(x0+wd,yP+hh+28,"次のアンカーポイントは "+F.time(Tci*1e-6)+" 後","end",9.5,"muted"));}
      else{o.push(S.L(X(Tci),14,X(Tci),yP+hh+6,"alias",1.2,"4 3"));o.push(S.T(X(Tci)-2,12,"次のアンカーポイント","end",9,"alias"));}
      o.push(S.T(x0,yP+hh+28,ev.length?"このイベントは "+ev.length+" 往復（"+F.time(used*1e-6)+"）":"1 往復も入らない","start",9.5,ev.length?"ink":"alias",true));
      /* ---- 図: 落ち方の棒 ---- */
      var yb=yP+hh+46,vmax=steps[0][1],bx=200,bw=220;
      steps.forEach(function(s,i){var y=yb+i*22,v=Math.max(0,s[1]),w=bw*v/vmax;
        o.push(S.T(bx-8,y+12,s[0],"end",9.5,"ink"));
        o.push(S.RECT(bx,y+1,Math.max(w,0.8),15,2,U.soft(s[2]),s[2],1));
        o.push(S.T(bx+w+6,y+12,_w19_sig(v,4)+" kbps","start",9.5,s[2],true));
        o.push(S.T(bx+w+72,y+12,s[3],"start",8.5,"muted"));});
      box.set(S.svg(W,yb+steps.length*22+8,o));
      var warn="";
      if(!sQ.rounds)warn='<span class="warn">1 往復（'+F.time((frE[0]+300+t0)*1e-6)+'）が接続間隔より長く、1 つも送れない。実際には、データ長の更新で、間隔に入る長さのパケットに決まる。</span><br>';
      ro.innerHTML=warn+_w19_PHYNAME[P]+": データのパケット t_d = "+_w19_sig(frE[0],5)+" µs（ペイロード "+sizes[0]+" バイト"+(E?"・MIC あり":"")+"）、空パケット t_0 = "+t0+" µs、1 往復 T_ex = "+_w19_sig(frE[0]+300+t0,5)+" µs<br>"+
        "値 D = ATT_MTU − 3 = <b>"+D+" バイト</b>、L2CAP のパケット "+Lm+" バイト → リンク層のパケット <b>"+f+" 個</b>"+(f>1?'（<span class="warn">分かれる</span>。ATT_MTU を '+(LL-4)+' 以下にするか DLE を大きくすると 1 個に収まる）':"")+(LL>Lm?'（ペイロードの最大 '+LL+' のうち '+Lm+' バイトしか使わない）':"")+"<br>"+
        "理論値 <b>"+_w19_sig(th0,4)+" kbps</b>"+(E?"（暗号化で "+_w19_sig(thE,4)+" kbps）":"")+" → 実効値の目安 <b>"+_w19_sig(fin,4)+" kbps</b>（理論値の "+_w19_sig(fin/th0*100,3)+" %）<br>"+
        "100 KB（102,400 バイト）を送る時間: 理論値で "+F.time(102400*8/(th0*1000))+"、目安で <b>"+(fin>0?F.time(102400*8/(fin*1000)):"—")+"</b>"+
        '<div class="wnote">失われ方は、往復ごとに無関係に、決めた割合で失われるとした。失われた往復は次の往復で送り直す。Write Request・指示では、1 回の後、次を送るまで接続間隔 1〜2 回分待つとした（実装による）。</div>';
    }
    draw();
  };

  /* ---- 4 節: 1 回のイベントの電流の波形 ---- */
  REG.w19_event=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"EVENT","1 回のイベントの電流の波形と電荷");
    var r1=U.ctrls(el);
    var kind=U.select(r1,"イベントの種類",["アドバタイズ ADV_IND（接続可能。受信あり）","アドバタイズ ADV_NONCONN_IND（受信なし）","接続イベント（ペリフェラル）"],0,draw);
    var adl=U.slider(r1,"AdvData の長さ",{min:0,max:31,step:1,value:31,fmt:function(v){return v+" バイト";},onInput:draw});
    var rC=U.ctrls(el);
    var nd=U.slider(rC,"ペリフェラルが送る通知の数",{min:0,max:8,step:1,value:0,fmt:function(v){return v?v+" 個":"0（空パケットだけ）";},onInput:draw});
    var pl=U.select(rC,"通知のパケット",[{v:"1M27",t:"LE 1M・ペイロード 27"},{v:"1M251",t:"LE 1M・ペイロード 251"},{v:"2M251",t:"LE 2M・ペイロード 251"}],"1M27",draw);
    var rC2=U.ctrls(el);
    var te=U.slider(rC2,"前回の起床からの時間 T_e",{values:[0.0075,0.015,0.03,0.1,0.3,1,2,4],value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var ep=U.slider(rC2,"時計の誤差の合計 ε",{values:[40,70,100,200,300,550,1000],value:100,fmt:function(v){return v+" ppm";},onInput:draw});
    var r3=U.ctrls(el);
    var itx=U.slider(r3,"送信の電流",{min:3,max:20,step:0.5,value:7,fmt:function(v){return v+" mA";},onInput:draw});
    var irx=U.slider(r3,"受信の電流",{min:3,max:20,step:0.5,value:6,fmt:function(v){return v+" mA";},onInput:draw});
    var r4=U.ctrls(el);
    var tw=U.slider(r4,"起床（発振器の立ち上がり）",{min:0.1,max:1.5,step:0.05,value:0.4,fmt:function(v){return _w19_sig(v,3)+" ms（1.5 mA）";},onInput:draw});
    var tp=U.slider(r4,"処理の時間",{min:0.05,max:2,step:0.05,value:0.3,fmt:function(v){return _w19_sig(v,3)+" ms（3 mA）";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"4 節の例の値に戻す",function(){adl.set(31);nd.set(0);pl.set("1M27");te.set(1);ep.set(100);itx.set(7);irx.set(6);tw.set(0.4);tp.set(0.3);draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var KC={w:"gold",r:"muted",t:"signal",x:"teal",p:"purple"},KN={w:"起床",r:"立ち上げ・切り替え",t:"送信",x:"受信",p:"処理"};
    function segs(){
      var K=kind.get(),Itx=itx.get(),Irx=irx.get(),s=[["起床",tw.get(),1.5,"w"]];
      if(K<2){var L=adl.get(),ta=_w19_air(6+L,"1M")/1000;
        [37,38,39].forEach(function(ch){s.push(["立ち上げ",0.1,4,"r"]);s.push(["送信 "+ch,ta,Itx,"t"]);if(K===0)s.push(["受信",0.2,Irx,"x"]);});}
      else{var c=pl.get(),phy=c.slice(0,2),P=+c.slice(2),t0=_w19_air(0,phy)/1000,td=_w19_air(P,phy)/1000,n=nd.get(),w=ep.get()*1e-6*te.get()*1000;
        s.push(["立ち上げ",0.1,4,"r"]);s.push(["受信（窓 "+_w19_sig(w*1000,3)+" µs + 空パケット）",w+t0,Irx,"x"]);
        var m=Math.max(n,1);
        for(var i=0;i<m;i++){s.push(["切り替え",0.15,5,"r"]);s.push([n?"送信（通知 "+(i+1)+"）":"送信（空パケット）",n?td:t0,Itx,"t"]);
          if(i<m-1)s.push(["受信（IFS + 空パケット）",0.15+t0,Irx,"x"]);}}
      s.push(["処理",tp.get(),3,"p"]);return s;}
    function draw(){
      var K=kind.get();adl.el.style.display=K<2?"":"none";rC.style.display=K===2?"":"none";rC2.style.display=K===2?"":"none";
      var s=segs(),tot=0,Q=0,agg={};s.forEach(function(x){tot+=x[1];Q+=x[1]*x[2];agg[x[3]]=agg[x[3]]||[0,0];agg[x[3]][0]+=x[1];agg[x[3]][1]+=x[1]*x[2];});
      var Imax=Math.max(8,Math.ceil(Math.max(itx.get(),irx.get())/2)*2),W=700,x0=60,wd=600,sc=wd/Math.max(tot,0.5),h=110,y0=24,o=[];
      var Y=function(i){return y0+h-i/Imax*h;};
      o.push(S.W([x0,y0,x0,y0+h,x0+wd+10,y0+h],"muted",1.1));
      for(var m=0;m<=Imax;m+=Imax>12?4:2){o.push(S.L(x0-4,Y(m),x0,Y(m),"muted",1));o.push(S.T(x0-7,Y(m)+3.5,String(m),"end",9,"muted"));}
      o.push(S.T(x0-34,y0+h/2,"mA","middle",9.5,"muted",false,false,-90));
      var t=0,pts=[[x0,Y(0)]];
      s.forEach(function(x,i){var xa=x0+t*sc,xb=x0+(t+x[1])*sc;o.push(S.RECT(xa,Y(x[2]),xb-xa,Y(0)-Y(x[2]),0,U.soft(KC[x[3]]),"none",0));pts.push([xa,Y(x[2])]);pts.push([xb,Y(x[2])]);
        if(xb-xa>34&&x[3]!=="r")o.push(S.T((xa+xb)/2,Y(x[2])-4,x[0].replace(/（.*$/,""),"middle",9,KC[x[3]],true));
        if(xb-xa>16)o.push(S.T((xa+xb)/2,y0+h+13+(i%2?10:0),_w19_sig(x[1]*x[2],3),"middle",8.5,KC[x[3]]));
        t+=x[1];});
      pts.push([x0+t*sc,Y(0)]);o.push(S.PL(pts,"signal",1.6));
      var ya=y0+h+34,nt=U.nice(0,tot,6);o.push(S.L(x0,ya,x0+wd,ya,"muted",1));
      nt.forEach(function(v){if(v<=tot+1e-9){o.push(S.L(x0+v*sc,ya,x0+v*sc,ya+4,"muted",1));o.push(S.T(x0+v*sc,ya+16,_w19_sig(v,3),"middle",9.5,"muted"));}});
      o.push(S.T(x0+wd,ya+30,"時間 [ms]（波形の下の数字は各段の電荷 [µC]）","end",9.5,"muted"));
      box.set(S.svg(W,ya+38,o));
      var rows=["w","r","t","x","p"].filter(function(k){return agg[k];}).map(function(k){return ['<b style="color:var(--'+(KC[k]==="muted"?"muted":KC[k])+')">'+KN[k]+"</b>",_w19_sig(agg[k][0],3)+" ms",_w19_sig(agg[k][1],3)+" µC",_w19_sig(agg[k][1]/Q*100,3)+" %"];});
      ro.innerHTML="1 回のイベントの電荷 Q = Σ I_k t_k = <b>"+_w19_sig(Q,4)+" µC</b>（長さ "+_w19_sig(tot,4)+" ms）"+
        (K===2?" ・ 受信の窓 t_w = ε T_e = "+_w19_sig(ep.get()*te.get(),3)+" µs":"")+
        U.tbl(["段","時間の合計","電荷","割合"],rows,["left","right","right","right"])+
        '<div class="wnote">立ち上げ 0.1 ms・4 mA、切り替え（IFS）0.15 ms・5 mA は固定にした。アドバタイズの受信（応答を待つ時間）は 0.2 ms とした。値はすべて代表値の例。</div>';
    }
    draw();
  };

  /* ---- 5 節: 平均電流と電池寿命 ---- */
  REG.w19_power=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"POWER","起きる間隔と平均電流・電池寿命");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"動作",["アドバタイズ","接続"],0,function(){q0.set(mode.get()===0?14.2:3.69);draw();});
    var q0=U.slider(r1,"1 回の電荷（窓の分を除く）Q",{min:1,max:60,log:true,value:14.2,fmt:function(v){return _w19_sig(v,3)+" µC";},onInput:draw});
    var rA=U.ctrls(el);
    var adv=U.slider(rA,"advInterval",{values:[0.02,0.05,0.1,0.2,0.5,1,1.28,2,5,10.24],value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var rC=U.ctrls(el);
    var ci=U.slider(rC,"接続間隔",{values:[0.0075,0.015,0.03,0.05,0.1,0.2,0.5,1,2,4],value:0.03,fmt:function(v){return F.time(v);},onInput:draw});
    var lat=U.slider(rC,"ペリフェラルレイテンシ L",{values:[0,1,2,4,9,19,49,99,199,499],value:0,fmt:function(v){return String(v);},onInput:draw});
    var ep=U.slider(rC,"時計の誤差の合計 ε",{values:[40,70,100,200,300,550,1000],value:100,fmt:function(v){return v+" ppm";},onInput:draw});
    var r3=U.ctrls(el);
    var is=U.slider(r3,"眠りの電流 I_s",{min:0.3,max:50,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var irx=U.slider(r3,"受信の電流（窓の分）",{min:3,max:20,step:0.5,value:6,fmt:function(v){return v+" mA";},onInput:draw});
    var cap=U.slider(r3,"電池の容量",{values:[100,220,620,1000,2000,3000],value:220,fmt:function(v){return v+" mAh"+(v===220?"（CR2032）":"");},onInput:draw});
    var br=U.btnrow(el);
    function preset(m,q,a,c,l){mode.set(m);q0.set(q);if(a)adv.set(a);if(c)ci.set(c);lat.set(l||0);ep.set(100);is.set(2);irx.set(6);cap.set(220);draw();}
    U.button(br,"アドバタイズ 1 s",function(){preset(0,14.2,1);});
    U.button(br,"接続 30 ms",function(){preset(1,3.69,0,0.03,0);});
    U.button(br,"接続 30 ms・L 9",function(){preset(1,3.69,0,0.03,9);});
    U.button(br,"接続 1 s・毎回通知",function(){preset(1,5.2,0,1,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var M=mode.get();rA.style.display=M===0?"":"none";rC.style.display=M===1?"":"none";
      var Q=q0.get()*1e-6,Is=is.get()*1e-6,Ir=irx.get()*1e-3,E=ep.get()*1e-6,C=cap.get()*1e-3*3600;
      var Te=M===0?adv.get()+0.005:(1+lat.get())*ci.get(),Iw=M===1?Ir*E:0;
      var Iev=Q/Te,I=Is+Iw+Iev,lifeH=C/I/3600,Ts=Q/(Is+Iw);
      var W=700,o=[];
      /* 上: 内訳 */
      var bx=110,bw=470,sc=bw/I;
      o.push(S.T(bx-10,26,"内訳","end",10.5,"ink",true));var xx=bx;
      [[Is,"green","眠り"],[Iw,"teal","受信の窓"],[Iev,M===0?"gold":"signal","イベント"]].forEach(function(s){if(s[0]<=0)return;var w=s[0]*sc;
        o.push(S.RECT(xx,12,Math.max(0.8,w),22,2,U.soft(s[1]),s[1],1.1));if(w>64)o.push(S.T(xx+w/2,27,s[2]+" "+F.cur(s[0]),"middle",9.5,s[1],true));xx+=w;});
      o.push(S.T(xx+6,27,F.cur(I),"start",10.5,"ink",true));
      /* 下: 間隔と平均電流 */
      var p=U.plot(110,58,470,190,[0.005,20],[1e-7,2e-3],{xlog:true,ylog:true});
      o.push(p.axes({xl:"起きる間隔 T_e",yl:"平均電流",xt:[0.01,0.1,1,10],yt:[1e-7,1e-6,1e-5,1e-4,1e-3],xfmt:function(v){return F.time(v);},yfmt:function(v){return F.cur(v,1);},ylOff:58}));
      var pts=[];for(var k=0;k<=80;k++){var t=Math.pow(10,Math.log10(0.005)+k/80*(Math.log10(20)-Math.log10(0.005))),v=Is+Iw+Q/t;if(v<=2e-3&&v>=1e-7)pts.push([t,v]);}
      o.push(p.line([[0.005,Is+Iw],[20,Is+Iw]],"green",1.2,"6 4"));o.push(p.line(pts,M===0?"gold":"signal",2.2));
      if(Ts>=0.005&&Ts<=20){o.push(S.L(p.X(Ts),p.Y(1e-7),p.X(Ts),p.Y(Is+Iw+Q/Ts),"faint",1,"3 3"));o.push(S.D(p.X(Ts),p.Y(Is+Iw+Q/Ts),"alias",4));
        o.push(S.T(p.X(Ts)+(p.X(Ts)>500?-6:6),p.Y(1e-7)-8,"T* = "+F.time(Ts),p.X(Ts)>500?"end":"start",9.5,"alias",true));}
      if(Te>=0.005&&Te<=20&&I<=2e-3){o.push(S.D(p.X(Te),p.Y(I),M===0?"gold":"signal",5.5));o.push(S.T(p.X(Te)+(p.X(Te)>500?-8:8),p.Y(I)-8,"いまの値",p.X(Te)>500?"end":"start",9.5,M===0?"gold":"signal",true));}
      o.push(S.T(p.X(0.0055),p.Y(Is+Iw)+13,"眠り"+(M===1?" + 窓":"")+" "+F.cur(Is+Iw),"start",9,"green"));
      [[1e-6,"CR2032 で 25 年"],[1e-5,"2.5 年"],[1e-4,"92 日"],[1e-3,"9.2 日"]].forEach(function(r){o.push(S.T(p.x+p.w+8,p.Y(r[0])+3.5,cap.get()===220?r[1]:"","start",9,"muted"));});
      box.set(S.svg(W,290,o));
      var warn="",sto=2*Te;
      if(M===1&&sto>32)warn='<span class="warn">(1 + L) × 接続間隔 × 2 = '+F.time(sto)+' が、監視タイムアウトの上限 32 s を超える。この組み合わせは使えない（18 章 1 節）。</span><br>';
      ro.innerHTML=warn+"平均の間隔 T_e = "+(M===0?"advInterval + 5 ms = "+F.time(Te,4):"(1 + L) × 接続間隔 = "+(1+lat.get())+" × "+F.time(ci.get())+" = "+F.time(Te,4))+"<br>"+
        "I_avg = I_s"+(M===1?" + I_rx ε":"")+" + Q ÷ T_e = "+F.cur(Is)+(M===1?" + "+F.cur(Iw):"")+" + "+F.cur(Iev)+" = <b>"+F.cur(I)+"</b><br>"+
        "電池寿命 = "+cap.get()+" mAh ÷ "+F.cur(I)+" ≈ <b>"+_w19_life(lifeH)+"</b> ・ T* = Q ÷ (I_s"+(M===1?" + I_rx ε":"")+") = <b>"+F.time(Ts)+"</b> → "+
        (Te<Ts?'間隔が T* より<b>短い</b>ので、間隔を延ばす（1 回の電荷を減らす）のが効く':'間隔が T* より<b>長い</b>ので、眠りの電流'+(M===1?"と時計の誤差":"")+'を減らすのが効く')+
        (M===1?"<br>上りの遅れ（ペリフェラル → セントラル）は最大 "+F.time(ci.get())+"、下りの遅れ（セントラル → ペリフェラル）は最大 "+F.time(Te)+" ・ 監視タイムアウト（100 ms〜32 s）は 2 × (1 + L) × 接続間隔 = "+F.time(sto)+" より長くする":"")+
        '<div class="wnote">1 回の電荷は 4 節の例（アドバタイズ ADV_IND 14.2 µC、送るもののない接続イベント 3.69 µC + 窓の分、通知 20 バイトを毎回送るなら約 5.2 µC）。接続では、窓の分を受信の電流 × ε × T_e として別に数える。</div>';
    }
    draw();
  };
