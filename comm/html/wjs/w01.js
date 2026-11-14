  /* ===== 01 章 組み込み通信の全体像 ===== */
  /* 方式の一覧（代表値）: 名前, 種類, 距離の上限 [m], 延長 [m], 速さ [bps], 1 日のデータ量の目安の上限 [B], 電池 (2 適 / 1 条件付き / 0 不向き), 必要なもの */
  var _w01_T=[
    ["UART","wired",5,null,[9600,3e6],Infinity,2,"wire"],
    ["RS-485","wired",1200,null,[1e5,1e7],Infinity,1,"wire"],
    ["Ethernet","wired",100,null,[1e7,1e9],Infinity,0,"wire"],
    ["BLE","short",50,400,[1.25e5,2e6],1e8,2,"phone"],
    ["IEEE 802.15.4","short",50,300,[2.2e5,2.8e5],1e7,2,"gw"],
    ["Wi-Fi","short",50,null,[1e6,1.5e8],Infinity,1,"ap"],
    ["LoRaWAN","lpwa",15000,null,[250,1.1e4],5e4,2,"lorawan"],
    ["LTE-M","lpwa",10000,null,[1e5,1e6],1e8,2,"cell"],
    ["NB-IoT","lpwa",15000,null,[2e4,1.5e5],1e7,2,"cell"]];
  var _w01_CC={wired:"gold",short:"signal",lpwa:"green"};
  var _w01_NEED={wire:"配線",phone:"スマートフォンかゲートウェイ",gw:"中継とインターネットへの出口",ap:"アクセスポイント",lorawan:"LoRaWAN のゲートウェイ",cell:"携帯電話の回線"};
  function _w01_bytes(v){v=+v.toPrecision(2);return v>=1e8?(v/1e8)+" 億バイト":v>=1e4?(+(v/1e4).toPrecision(3))+" 万バイト":v+" バイト";}
  function _w01_dist(v){return v<1000?(v<1?v.toFixed(1):Math.round(v))+" m":(+(v/1000).toPrecision(2))+" km";}

  REG.w01_select=function(el,U){
    var S=U.S;
    U.head(el,"SELECT","要求から通信方式の候補をしぼる（目安）");
    var row=U.ctrls(el);
    var dist=U.slider(row,"必要な距離",{min:0.5,max:20000,value:20,log:true,step:0.01,fmt:_w01_dist,onInput:draw});
    var data=U.slider(row,"1 日に送るデータ量",{min:100,max:1e8,value:1e4,log:true,step:0.01,fmt:_w01_bytes,onInput:draw});
    var row2=U.ctrls(el);
    var pw=U.select(row2,"電源",["電池","外部の電源"],0,draw);
    var have={};
    var row3=U.ctrls(el);
    [["wire","配線できる",false],["phone","スマートフォンかゲートウェイがある",true],["gw","Thread などの中継とインターネットへの出口がある",false],["ap","Wi-Fi のアクセスポイントがある",true],
     ["lorawan","LoRaWAN のゲートウェイを使える",false],["cell","携帯電話の回線を契約できる",false]].forEach(function(o){have[o[0]]=U.checkbox(row3,o[1],o[2],draw);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function mark(v){return v===2?'<span class="ok">✓</span>':v===1?'<b style="color:var(--gold)">△</b>':'<span class="warn">×</span>';}
    function draw(){
      var D=dist.get(),B=data.get(),bat=pw.get()===0,avg=B*8/86400;
      var W=700,rh=27,y0=50,n=_w01_T.length,o=[];
      var pd=U.plot(118,y0,270,n*rh,[0.1,30000],[0,n],{xlog:true}), pr=U.plot(420,y0,268,n*rh,[1,1e9],[0,n],{xlog:true});
      o.push(S.T(pd.x+pd.w/2,18,"届く距離","middle",11.5,"ink",true));
      o.push(S.T(pr.x+pr.w/2,18,"物理層の速さ [bps]","middle",11.5,"ink",true));
      [[pd,[0.1,1,10,100,1000,10000],_w01_dist],[pr,[1,100,1e4,1e6,1e8],function(v){return v>=1e6?(v/1e6)+" M":v>=1e3?(v/1e3)+" k":String(v);}]].forEach(function(q){
        q[1].forEach(function(v){var xx=q[0].X(v);o.push(S.L(xx,y0-4,xx,y0+n*rh,"grid",1));o.push(S.T(xx,y0+n*rh+15,q[2](v),"middle",9.5,"muted"));});
        o.push(S.L(q[0].x,y0+n*rh,q[0].x+q[0].w,y0+n*rh,"muted",1.1));});
      var res=[];
      _w01_T.forEach(function(t,i){
        var okD=D<=t[2]?2:(t[3]&&D<=t[3]?1:0), okB=B<=t[5]?2:0, okP=bat?t[6]:2, okN=have[t[7]].get()?2:0;
        var all=Math.min(okD,okB,okP,okN), c=_w01_CC[t[1]], yy=y0+i*rh+5, op=all>0?1:0.3;
        o.push('<g opacity="'+op+'">');
        o.push(S.T(108,yy+12,t[0],"end",11,"ink",true));
        var d0=t[1]==="lpwa"?(t[0]==="LoRaWAN"?1000:100):(t[0]==="UART"?0.1:1);
        o.push(S.RECT(pd.X(d0),yy,pd.X(t[2])-pd.X(d0),rh-10,4,U.soft(c),c,1.3));
        if(t[3])o.push(S.RECT(pd.X(t[2]),yy,pd.X(t[3])-pd.X(t[2]),rh-10,4,"none",c,1.1,"4 3"));
        o.push(S.RECT(pr.X(t[4][0]),yy,Math.max(pr.X(t[4][1])-pr.X(t[4][0]),4),rh-10,4,U.soft(c),c,1.3));
        o.push('</g>');
        res.push([t[0],mark(okD),mark(okB),bat?mark(okP):"—",mark(okN),all===2?'<span class="ok">候補</span>':all===1?'<b style="color:var(--gold)">条件付き</b>':'<span class="warn">外れる</span>']);
      });
      var xd=pd.X(Math.min(D,30000));
      o.push(S.L(xd,y0-6,xd,y0+n*rh,"alias",1.6,"5 3"));o.push(S.T(xd,y0-8,"必要な距離","middle",9.5,"alias",true));
      var xa=pr.X(Math.max(1,Math.min(avg,1e9)));
      o.push(S.L(xa,y0-6,xa,y0+n*rh,"alias",1.6,"5 3"));o.push(S.T(xa,y0-8,"平均の速さ","middle",9.5,"alias",true));
      box.set(S.svg(W,y0+n*rh+26,o));
      ro.innerHTML="必要な平均の速さ = "+_w01_bytes(B)+" × 8 ÷ 86400 秒 = <b>"+U.fmt.rate(avg)+"</b>（どの方式もこれを大きく上回る）"+
        U.tbl(["方式","距離","データ量","電池","必要なもの","判定"],res,["left","center","center","center","center","left"])+
        '<div class="wnote">△ の距離は、BLE の LE Coded や IEEE 802.15.4 の中継で広げた場合。電池の △ は、間欠動作（5 節）にすれば使えるが工夫が要るもの。'+
        'データ量の上限は目安（LoRaWAN は電波の規則による。21 章）。値はすべて代表値で、実際の選定は各章の計算で確かめる。</div>';
    }
    draw();
  };

  REG.w01_battery=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BATTERY","間欠動作の平均電流と電池寿命");
    var row=U.ctrls(el);
    var Is=U.slider(row,"眠っている間の電流 I_s",{min:0.1,max:200,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var Ia=U.slider(row,"起きている間の電流 I_a",{min:0.5,max:300,value:8,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var row2=U.ctrls(el);
    var ta=U.slider(row2,"起きている時間 t_a",{min:0.001,max:10,value:0.05,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var Tp=U.slider(row2,"周期 T",{min:1,max:86400,value:60,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var row3=U.ctrls(el);
    var cap=U.slider(row3,"電池の容量",{min:10,max:5000,value:220,log:true,fmt:function(v){return Math.round(v)+" mAh";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"CR2032（220 mAh）",function(){cap.set(220);draw();});
    U.button(br,"単 3 形 2 本（2000 mAh として）",function(){cap.set(2000);draw();});
    U.button(br,"例の値に戻す",function(){Is.set(2);Ia.set(8);ta.set(0.05);Tp.set(60);cap.set(220);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var is=Is.get()*1e-6, ia=Ia.get()*1e-3, t=ta.get(), T=Tp.get(), C=cap.get()*1e-3;
      var warn="";
      if(t>T){warn='<span class="warn">起きている時間が周期より長い。周期を t_a 以上にした値で計算した。</span><br>';T=t;}
      var act=(ia-is)*t/T, avg=is+act, lifeH=C/avg;   // 容量 [Ah] ÷ 平均電流 [A] = 寿命 [時間]
      var Ts=t*(ia-is)/is;
      var yr=function(TT){return C/(is+(ia-is)*t/TT)/24/365;};
      var W=700,o=[],p=U.plot(80,24,590,220,[1,86400],[1e-3,100],{xlog:true,ylog:true});
      o.push(p.axes({xl:"周期 T",yl:"電池寿命 [年]",xt:[1,10,60,600,3600,86400],yt:[0.001,0.01,0.1,1,10,100],
        xfmt:function(v){return F.time(v,2);},yfmt:function(v){return v>=1?String(v):String(v);}}));
      var pts=[];for(var k=0;k<=120;k++){var TT=Math.pow(10,k/120*Math.log10(86400));if(TT>=t)pts.push([TT,Math.max(1e-3,Math.min(100,yr(TT)))]);}
      o.push(p.line([[1,Math.min(100,C/is/24/365)],[86400,Math.min(100,C/is/24/365)]],"green",1.3,"6 4"));
      o.push(p.line(pts,"signal",2.4));
      if(Ts>=1&&Ts<=86400){o.push(S.L(p.X(Ts),p.Y(1e-3),p.X(Ts),p.Y(Math.max(1e-3,yr(Ts))),"faint",1,"3 3"));
        o.push(S.D(p.X(Ts),p.Y(Math.max(1e-3,yr(Ts))),"alias",4));o.push(S.T(p.X(Ts)+6,p.Y(Math.max(1e-3,yr(Ts)))+15,"T* = "+F.time(Ts),"start",10,"alias"));}
      var ly=Math.max(1e-3,Math.min(100,yr(T)));
      o.push(S.D(p.X(T),p.Y(ly),"signal",5));
      var rt=p.X(T)>560;
      o.push(S.T(p.X(T)+(rt?-8:8),p.Y(ly)+18,"いまの値",rt?"end":"start",10,"signal",true));
      o.push(S.T(p.X(1)+6,p.Y(Math.min(100,C/is/24/365))-6,"眠っている間の電流で決まる上限","start",9.5,"green"));
      // 内訳の帯
      var y2=290,bw=590,fs=is/avg;
      o.push(S.T(80,y2-8,"平均電流の内訳","start",10.5,"ink",true));
      o.push(S.RECT(80,y2,bw*fs,22,3,U.soft("green"),"green",1.2));
      o.push(S.RECT(80+bw*fs,y2,bw*(1-fs),22,3,U.soft("signal"),"signal",1.2));
      if(bw*fs>120)o.push(S.T(80+bw*fs/2,y2+15,"眠っている間 "+Math.round(fs*100)+" %","middle",10,"green",true));
      if(bw*(1-fs)>120)o.push(S.T(80+bw*fs+bw*(1-fs)/2,y2+15,"起きている分 "+Math.round((1-fs)*100)+" %","middle",10,"signal",true));
      box.set(S.svg(W,y2+34,o));
      var years=lifeH/24/365;
      ro.innerHTML=warn+"平均電流 I_avg = "+F.cur(is)+" + ("+F.cur(ia)+" − "+F.cur(is)+") × "+F.time(t)+" ÷ "+F.time(T)+" = <b>"+F.cur(avg)+"</b><br>"+
        "電池寿命 = "+Math.round(cap.get())+" mAh ÷ "+F.cur(avg)+" ≈ <b>"+U.fmt.int(lifeH)+" 時間</b>（"+(years>=1?U.sig(years,3)+" 年":U.sig(lifeH/24,3)+" 日")+"）<br>"+
        "T* = t_a (I_a − I_s) / I_s = <b>"+F.time(Ts)+"</b> → 周期が T* より"+(T<Ts?'<b>短い</b>ので、起きている分を減らす（t_a を短く、T を長く）のが効く':'<b>長い</b>ので、眠っている間の電流を減らすのが効く');
    }
    draw();
  };
