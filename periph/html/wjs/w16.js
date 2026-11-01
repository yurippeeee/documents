  /* ===== 16 章 条件別の設計ガイド ===== */
  /* 電池の模型（03 章 4 節・04 章 1 節と同じ代表的な形と例の値。1 セルあたり）
     E: 休んでいるときの電圧の点 [x, V]、R: 25 °C の R0 + R1 の点 [x, Ω]、k10: 10 °C 下がるごとの倍率、tau: R1 と C1 の時定数 [s] */
  var _w16_B={
    cr:{nm:"CR2032 1 個",Qn:220,N:1,sd:0.01,vnom:3.0,k10:1.4,tau:0.005,
      E:[[0,3.20],[0.02,3.05],[0.1,3.00],[0.3,2.96],[0.5,2.92],[0.7,2.87],[0.8,2.82],[0.88,2.74],[0.93,2.60],[0.97,2.40],[1.0,2.00]],
      R:[[0,15],[0.5,17],[0.7,20],[0.8,25],[0.9,40],[0.95,60],[1.0,120]]},
    alk:{nm:"単 3 形アルカリ乾電池 2 本",Qn:2000,N:2,sd:0.02,vnom:3.0,k10:1.5,tau:0.010,
      E:[[0,1.58],[0.03,1.48],[0.2,1.36],[0.4,1.27],[0.6,1.19],[0.75,1.12],[0.85,1.06],[0.93,1.00],[0.97,0.95],[1.0,0.90]],
      R:[[0,0.15],[0.3,0.19],[0.5,0.26],[0.7,0.37],[0.85,0.48],[1.0,0.60]]},
    soc:{nm:"塩化チオニルリチウム電池 1 本",Qn:2400,N:1,sd:0.01,vnom:3.6,k10:1.3,tau:0.010,
      E:[[0,3.66],[0.02,3.62],[0.3,3.60],[0.6,3.58],[0.85,3.54],[0.92,3.48],[0.96,3.35],[0.985,3.00],[1.0,2.00]],
      R:[[0,4.0],[0.5,4.5],[0.8,6.0],[0.9,9.0],[0.96,15.0],[1.0,40.0]]}};
  function _w16_ip(p,x){if(x<=p[0][0])return p[0][1];for(var i=1;i<p.length;i++)if(x<=p[i][0])return p[i-1][1]+(p[i][1]-p[i-1][1])*(x-p[i-1][0])/(p[i][0]-p[i-1][0]);return p[p.length-1][1];}
  function _w16_E(b,x){return b.N*_w16_ip(b.E,x);}
  function _w16_R(b,x,T){return b.N*_w16_ip(b.R,x)*Math.pow(b.k10,(25-T)/10);}
  /* 長さ tp のパルスに対する電圧降下 ÷ 電流 [Ω]。コンデンサが無ければ 03 章の R0 + R1(1 − e^(−tp/τ))（R0 は 55 %）、
     あれば 04 章の、電池（1 つの内部抵抗）とコンデンサ（容量 C・ESR）の式 */
  function _w16_drop(b,x,T,tp,C,esr){var R=_w16_R(b,x,T);
    if(!(C>0))return R*(0.55+0.45*(1-Math.exp(-tp/b.tau)));
    var Rp=R*esr/(R+esr),tau=C*(R+esr);return R-(R-Rp)*Math.exp(-tp/tau);}
  function _w16_cross(f){if(f(0)<=0)return 0;if(f(1)>0)return 1;var lo=0,hi=1;for(var i=0;i<50;i++){var m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}
  /* パルスの底が vb に届くまでに使える割合。pulses = [[電流 A, 長さ s], ...] の最も厳しいもの */
  function _w16_usable(b,T,pulses,C,esr,vb){var u=1,which=0;
    pulses.forEach(function(p,i){var v=_w16_cross(function(x){return _w16_E(b,x)-p[0]*_w16_drop(b,x,T,p[1],C,esr)-vb;});if(v<u){u=v;which=i;}});
    return {u:u,which:which};}
  function _w16_sig(v,d){d=d||3;if(v===0)return "0";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w16_yr(h){var y=h/8760;return y>=1?_w16_sig(y,3)+" 年":(h/24>=1?_w16_sig(h/24,3)+" 日":_w16_sig(h,3)+" 時間");}
  function _w16_ok(b,t){return b?'<span class="ok">'+(t||"○")+'</span>':'<span class="warn">'+(t||"×")+'</span>';}
  /* 前の章の節へのリンク（ページの名前は NN.html） */
  function _w16_a(ch,sec,anc,txt){return '<a href="'+ch+'.html#'+anc+'">'+(txt||(ch+" 章 "+sec+" 節"))+'</a>';}
  var _w16_L={
    p01_4:["01",4,"平均電流とピーク電流"],p02_3:["02",3,"usb-と-ac-アダプタ"],p02_4:["02",4,"商用電源から直接つくる"],p02_5:["02",5,"車の電源"],p02_6:["02",6,"環境発電"],
    p03_3:["03",3,"容量は使い方で変わる-電流と温度"],p03_4:["03",4,"内部抵抗とパルス負荷"],p03_5:["03",5,"自己放電と保管"],
    p04_1:["04",1,"ピーク電流を電池から隠す-大容量コンデンサ"],p04_2:["04",2,"負荷を重ねない-動作の順番を決める"],p04_3:["04",3,"低電圧で正しく止まる"],p04_5:["04",5,"二次電池を充電する"],p04_6:["04",6,"電池を守る-逆接続-過放電-出荷時"],
    p05_2:["05",2,"静止電流が効く条件"],p05_3:["05",3,"周辺の電源を切る-負荷スイッチと突入電流"],p05_5:["05",5,"電源の立ち上がりと立ち下がり-por-と-bor"],p05_6:["05",6,"電源電圧を見張る"],
    p06_2:["06",2,"安全のための絶縁"],p06_3:["06",3,"停電を知り-保持時間で後始末する"],p06_4:["06",4,"電源が戻ったとき"],p06_5:["06",5,"サージと電源のノイズ"],p06_6:["06",6,"商用電源に合わせる-ゼロクロス検出"],p06_7:["06",7,"待機電力"],
    p07_3:["07",3,"眠る間のピンの状態と漏れ電流"],p08_3:["08",3,"センサの電源を切る-起動時間との釣り合い"],p09_2:["09",2,"電池の電圧が変わるとき-基準の選び方"],p09_4:["09",4,"分圧の電流と-測るときだけ流す工夫"],
    p10_6:["10",6,"センサの故障を見つける"],p11_5:["11",5,"長い配線-esd-誘導ノイズ-保護"],p11_6:["11",6,"電圧の違う入力と絶縁"],p12_2:["12",2,"led-を点ける-電流と-pwm"],p12_6:["12",6,"突入電流の大きい負荷"],
    p13_3:["13",3,"回し始めと止め方"],p13_7:["13",7,"電池で回すとき"],p14_4:["14",4,"ac-のヒータをオンオフする"],p14_5:["14",5,"過熱から守る"],p14_6:["14",6,"機器自身の発熱"],
    p15_1:["15",1,"リセットの間のピンの状態"],p15_2:["15",2,"安全な状態を決める"],p15_3:["15",3,"負荷がマイコンを乱すとき-電源の揺れとグラウンド"],p15_4:["15",4,"ウォッチドッグと安全な停止"],p15_5:["15",5,"故障を見つけて縮退する"],p15_6:["15",6,"電源が戻った後と-更新の間"]};
  function _w16_lk(keys){return keys.map(function(k){var l=_w16_L[k];return _w16_a(l[0],l[1],l[2]);}).join("・");}

  /* ---- 2 節: 電池の機器の電力の予算 ---- */
  REG.w16_budget=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BUDGET","電池の機器の電力の予算と電池寿命");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",[{v:"cr",t:"CR2032 1 個"},{v:"alk",t:"単 3 形アルカリ乾電池 2 本"},{v:"soc",t:"塩化チオニルリチウム電池 1 本"}],"cr",draw);
    var per=U.slider(r1,"測って送る周期",{values:[10,30,60,300,600,1800,3600],value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var slp=U.slider(r1,"眠りの電流",{min:0.5,max:20,log:true,value:2,fmt:function(v){return U.sig(v,3)+" µA";},onInput:draw});
    var r2=U.ctrls(el);
    var sen=U.select(r2,"温度センサ",["入れたまま待たせる（待機 2 µA）","測るときだけ電源を入れる"],0,draw);
    var div=U.select(r2,"電池の電圧の測り方",["1 MΩ と 1 MΩ の分圧（流しっぱなし）","内部の基準電圧で電源電圧を求める"],0,draw);
    var r3=U.ctrls(el);
    var ord=U.select(r3,"LED と送信",["同時に始める（15 mA）","重ねない（10 mA と 5 mA）"],0,draw);
    var cap=U.select(r3,"大容量コンデンサ",["なし","100 µF（漏れ電流 0.1 µA）"],0,draw);
    var shp=U.select(r3,"出荷まで 6 か月",["電池を入れたまま（機器が動く）","絶縁のシートで止めておく"],0,draw);
    var r4=U.ctrls(el);
    var tmin=U.slider(r4,"使う場所の最も低い温度",{min:-20,max:25,step:1,value:0,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var goal=U.slider(r4,"目標の寿命",{min:1,max:15,step:1,value:5,fmt:function(v){return v+" 年";},onInput:draw});
    var br=U.btnrow(el);
    function preset(a){bt.set("cr");per.set(60);slp.set(2);sen.set(a);div.set(a);ord.set(a);cap.set(a);shp.set(a);goal.set(5);draw();}
    U.button(br,"2 節: はじめの設計",function(){preset(0);});
    U.button(br,"2 節: 直した設計",function(){preset(1);});
    U.button(br,"冷凍庫（−20 °C）",function(){tmin.set(-20);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var b=_w16_B[bt.get()],T=per.get(),Is=slp.get();
      /* 平均電流の行 [µA]（µC ÷ s = µA） */
      var tsen=sen.get()===0?2+(600-2)*0.010/T:0.05+(4.0+600*0.010)/T;
      var rows=[["眠り（マイコン・RTC）",Is,"07 章 1 節"],["処理（3 mA・4 ms）",3000*0.004/T,"01 章 4 節"],["送信（10 mA・3 ms）",10000*0.003/T,"01 章 4 節"],
        ["温度センサ",tsen,"08 章 3 節"],["電池の電圧の分圧",div.get()===0?b.vnom/2e6*1e6:0,"09 章 2・4 節"],["コンデンサの漏れ電流",cap.get()===1?0.1:0,"04 章 1 節"],
        ["LED（1 日 10 回）",5000*0.020*10/86400,"12 章 2 節"],["自己放電",b.sd*b.Qn*1000/8760,"03 章 5 節"]];
      var dev=0,tot=0;rows.forEach(function(r,i){tot+=r[1];if(i<7)dev+=r[1];});
      var Tc=tmin.get(),C=cap.get()===1?100e-6:0,ov=ord.get()===0;
      var pulses=ov?[[0.015,0.003],[0.005,0.020]]:[[0.010,0.003],[0.005,0.020]];
      var us=_w16_usable(b,Tc,pulses,C,0.1,2.2),Ipk=ov?15:10;
      var stor=(shp.get()===0?dev*1e-3*4380:0)+b.sd*b.Qn*0.5;   /* mAh */
      var Qu=us.u*b.Qn,Qleft=Qu-stor,lifeH=Qleft>0?Qleft/(tot*1e-3):0;
      /* ---- 図: 左に行ごとの平均電流、下に容量の内訳 ---- */
      var W=700,o=[],x0=176,mx=Math.max.apply(null,rows.map(function(r){return r[1];})),sc=300/Math.max(mx,0.5),rh=22;
      o.push(S.T(x0,14,"1 行ごとの平均電流 [µA]","start",10.5,"ink",true));
      rows.forEach(function(r,i){var y=24+i*rh,c=i===7?"gold":(r[1]>1?"alias":"signal");
        o.push(S.T(x0-8,y+13,r[0],"end",10,"ink"));
        o.push(S.RECT(x0,y+3,Math.max(r[1]*sc,0.8),13,2,U.soft(c),c,1.1));
        o.push(S.T(x0+r[1]*sc+6,y+13,U.sig(r[1],3),"start",9.5,c,true));
        o.push(S.T(640,y+13,r[2],"end",9,"muted"));});
      var yt=24+rows.length*rh+8;
      o.push(S.T(x0-8,yt+12,"合計","end",10.5,"ink",true));
      o.push(S.T(x0,yt+12,U.sig(tot,3)+" µA（自己放電を含む）・ピーク電流 "+Ipk+" mA","start",10.5,"ink",true));
      var yc=yt+30,wd=470,s2=wd/b.Qn;
      o.push(S.T(x0-8,yc+13,"公称容量 "+b.Qn+" mAh","end",10,"ink",true));
      var xx=x0;
      if(Qleft>0){o.push(S.RECT(xx,yc,Qleft*s2,18,2,U.soft("green"),"green",1.1));xx+=Qleft*s2;o.push(S.RECT(xx,yc,stor*s2,18,2,U.soft("gold"),"gold",1.1));xx+=stor*s2;}
      else{o.push(S.RECT(xx,yc,Qu*s2,18,2,U.soft("gold"),"gold",1.1));xx+=Qu*s2;}
      o.push(S.RECT(xx,yc,Math.max(0,x0+wd-xx),18,2,U.soft("muted"),"muted",1,"3 2"));
      o.push(S.T(x0,yc+34,"緑: 寿命の間に使える "+U.sig(Math.max(Qleft,0),3)+" mAh　金: 保管で失う "+U.sig(stor,3)+" mAh　灰: パルスの底で使えない "+U.sig((1-us.u)*100,3)+" %","start",9.5,"muted"));
      box.set(S.svg(W,yc+44,o));
      var okLife=lifeH/8760>=goal.get();
      var lim=["LED と送信が重なるパルス（15 mA・3 ms）","LED のパルス（5 mA・20 ms）"];if(!ov)lim[0]="送信のパルス（10 mA・3 ms）";
      var trs=[["電力の予算","平均電流（自己放電を含む）","—",U.sig(tot,3)+" µA","",_w16_lk(["p01_4","p03_5"])],
        ["電力の予算","ピーク電流","—",Ipk+" mA","",_w16_lk(["p04_2"])],
        ["電源の構成","パルスの底で使える割合（"+String(Tc).replace("-","−")+" °C）","—",U.sig(us.u*100,3)+" %（"+lim[us.which]+"で決まる）","",_w16_lk(["p03_4","p04_1"])],
        ["条件の書き出し","出荷までに失う電荷","—",U.sig(stor,3)+" mAh","",_w16_lk(["p04_6"])],
        ["確かめ","電池寿命",goal.get()+" 年以上",Qleft>0?_w16_yr(lifeH):"保管の後に使える電荷が残らない",_w16_ok(okLife),_w16_lk(["p03_5"])]];
      ro.innerHTML="平均電流 = Σ（行の電流）= <b>"+U.sig(tot,3)+" µA</b>、使える電荷 = "+U.sig(us.u*100,3)+" % × "+b.Qn+" mAh − 保管 "+U.sig(stor,3)+" mAh = <b>"+U.sig(Math.max(Qleft,0),3)+" mAh</b> → 電池寿命 <b>"+(Qleft>0?_w16_yr(lifeH):"0（すぐ止まる）")+"</b><br>"+
        U.tbl(["段","確かめること","基準","値","判定","読む節"],trs,["left","wrap","left","wrap","center","left"])+
        '<div class="wnote">温度センサ・分圧・LED・送信・自己放電の値は 2 節と同じ例の値（08 章 3 節の待機 2 µA のセンサ、起動の電荷 4 µC）。使える割合は、BOR のしきい値 2.2 V として、03 章 4 節（コンデンサなし）と 04 章 1 節（コンデンサあり、ESR 0.1 Ω）の電池の模型で、LED と送信のパルスのうち厳しいほうで求めた。実際の電池の値は仕様書で確かめる。</div>';
    }
    draw();
  };

  /* ---- 6 節: 冬の 1 週間（fig/f16.py の _f16_week_sim と同じ計算。1 分刻み） ---- */
  var _w16_WK={
    ex:[["晴れ",-8,1],["曇り",-8,-2],["雪",-10,-4],["雪",-12,-6],["晴れ",-14,-3],["曇り",-10,-3],["晴れ",-9,0]],
    sun:[["晴れ",-8,1],["晴れ",-8,-2],["晴れ",-10,-4],["晴れ",-12,-6],["晴れ",-14,-3],["晴れ",-10,-3],["晴れ",-9,0]],
    snow:[["曇り",-8,1],["雪",-8,-2],["雪",-10,-4],["曇り",-12,-6],["雪",-14,-3],["曇り",-10,-3],["雪",-9,0]]};
  var _w16_FAC={"晴れ":0.6,"曇り":0.12,"雪":0};
  /* p: {wk, shift [K], Pp [W], Emax [Wh], soc0, dT [K], tau [h], adapt, hold [日]} */
  function _w16_week(p){
    var E=p.soc0*p.Emax*3600,Emax=p.Emax*3600,Tb=p.wk[0][1]+p.shift,dt=60,pts=[],down=0,inJ=0,outJ=0,chg=0,nrep=0,minE=E,stopAt=null;
    for(var k=0;k<7*1440;k++){
      var t=k*dt,d=Math.floor(t/86400),h=(t%86400)/3600,day=p.wk[d],lo=day[1]+p.shift,hi=day[2]+p.shift;
      var Ta=(lo+hi)/2-(hi-lo)/2*Math.cos(2*Math.PI*(h-4)/24);
      var irr=(h>=8&&h<=16)?_w16_FAC[day[0]]*Math.sin(Math.PI*(h-8)/8):0;
      Tb+=(Ta+p.dT*irr-Tb)/(p.tau*3600)*dt;
      var c=Tb>=0&&Tb<=45&&irr>0&&E<Emax;
      if(c){var add=0.8*p.Pp*irr*dt;E=Math.min(Emax,E+add);inJ+=add;chg+=dt;}
      var Tr=300;
      if(p.adapt){var pt=E/(p.hold*86400)-1e-3;Tr=pt<=0?3600:Math.min(3600,Math.max(300,2.7/pt));}
      var run=E>0;
      if(run){var use=(1e-3+2.7/Tr)*dt;E=Math.max(0,E-use);outJ+=use;nrep+=dt/Tr;if(E===0&&stopAt===null)stopAt=(t+dt)/86400;}
      else down+=dt;
      if(E<minE)minE=E;
      if(k%10===0)pts.push([t/86400,E/3600,Tb,Ta,c,run]);
    }
    return {pts:pts,downH:down/3600,inWh:inJ/3600,outWh:outJ/3600,chgH:chg/3600,nrep:nrep,minWh:minE/3600,stopAt:stopAt};
  }
  REG.w16_week=function(el,U){
    var S=U.S;
    U.head(el,"WINTER","冬の 1 週間の蓄え — 低温で充電できない時間");
    var r1=U.ctrls(el);
    var wk=U.select(r1,"天気の並び",[{v:"ex",t:"例の週（晴れ・曇り・雪・雪・晴れ・曇り・晴れ）"},{v:"sun",t:"晴れが続く週"},{v:"snow",t:"曇りと雪が続く週"}],"ex",draw);
    var sh=U.slider(r1,"気温を全体にずらす",{min:-6,max:12,step:1,value:0,fmt:function(v){return (v>0?"+":"")+String(v).replace("-","−")+" K";},onInput:draw});
    var r2=U.ctrls(el);
    var pp=U.slider(r2,"太陽電池（晴れた夏の山）",{values:[0.1,0.2,0.3,0.5,0.8,1,1.5,2],value:0.5,fmt:function(v){return v+" W";},onInput:draw});
    var em=U.slider(r2,"蓄え（使えるエネルギー）",{values:[0.4,0.8,1.6,3.2,6.4],value:1.6,fmt:function(v){return v+" Wh";},onInput:draw});
    var s0=U.slider(r2,"始めの蓄え",{min:10,max:100,step:10,value:60,fmt:function(v){return v+" %";},onInput:draw});
    var r3=U.ctrls(el);
    var pl=U.select(r3,"電池の置き方",["日陰の箱（日が当たると最大 +1.8 K、時定数 2 時間）","日の当たる側で断熱（最大 +9 K、時定数 4 時間）"],0,draw);
    var md=U.select(r3,"送る間隔",["5 分ごと（平均 10 mW）","蓄えに合わせる（5〜60 分）"],0,draw);
    var hd=U.slider(r3,"蓄えを使い切る日数の見込み",{min:2,max:10,step:1,value:5,fmt:function(v){return v+" 日";},onInput:draw});
    var br=U.btnrow(el);
    function preset(a,b){wk.set("ex");sh.set(0);pp.set(0.5);em.set(1.6);s0.set(60);pl.set(a);md.set(b);hd.set(5);draw();}
    U.button(br,"(a) 日陰・5 分ごと",function(){preset(0,0);});
    U.button(br,"(b) 日陰・蓄えに合わせる",function(){preset(0,1);});
    U.button(br,"(c) 日なた・断熱・蓄えに合わせる",function(){preset(1,1);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      hd.el.style.display=md.get()===1?"":"none";
      var W=_w16_WK[wk.get()],shift=sh.get(),place=pl.get();
      var r=_w16_week({wk:W,shift:shift,Pp:pp.get(),Emax:em.get(),soc0:s0.get()/100,dT:place?15:3,tau:place?4:2,adapt:md.get()===1,hold:hd.get()});
      var o=[],x0=70,wd=600,dw=wd/7;
      W.forEach(function(d,i){var xc=x0+i*dw+dw/2;o.push(S.T(xc,16,(i+1)+" 日目 "+d[0],"middle",10,"ink",true));
        o.push(S.T(xc,30,String(d[1]+shift).replace("-","−")+"〜"+String(d[2]+shift).replace("-","−")+" °C","middle",9.5,"muted"));});
      var pt=U.plot(x0,42,wd,100,[0,7],[-20,20]);
      o.push(pt.axes({yl:"温度 [°C]",xt:[],yt:[-20,-10,0,10,20],yfmt:function(v){return String(v).replace("-","−");}}));
      for(var d=1;d<7;d++)o.push(S.L(pt.X(d),pt.y,pt.X(d),pt.y+pt.h,"grid",1));
      o.push(pt.line([[0,0],[7,0]],"alias",1.2,"6 4"));
      o.push(pt.line(r.pts.map(function(q){return [q[0],Math.max(-20,Math.min(20,q[3]))];}),"muted",1.1));
      o.push(pt.line(r.pts.map(function(q){return [q[0],Math.max(-20,Math.min(20,q[2]))];}),"teal",2));
      o.push(S.T(pt.X(7)-4,pt.Y(0)-5,"0 °C より冷たい間は充電しない","end",9.5,"alias",false,false,null,true));
      var yc=pt.y+pt.h+8;
      o.push(S.T(x0-6,yc+8,"充電","end",9,"green",true));o.push(S.RECT(x0,yc,wd,9,1,"panel","line",0.8));
      var st=null;r.pts.concat([[7,0,0,0,false,true]]).forEach(function(q){if(q[4]&&st===null)st=q[0];if(!q[4]&&st!==null){o.push(S.RECT(pt.X(st),yc,Math.max(1.5,pt.X(q[0])-pt.X(st)),9,0,U.soft("green"),"green",0.8));st=null;}});
      var ymax=Math.max(1.0,em.get()*1.06),pe=U.plot(x0,yc+30,wd,140,[0,7],[0,ymax]);
      o.push(pe.axes({xl:"日",yl:"蓄え [Wh]",xt:[0,1,2,3,4,5,6,7],yt:U.nice(0,ymax,4),xfmt:function(v){return String(v);},yfmt:function(v){return String(+v.toFixed(2));}}));
      st=null;r.pts.concat([[7,1,0,0,false,true]]).forEach(function(q){if(!q[5]&&st===null)st=q[0];if(q[5]&&st!==null){o.push(S.RECT(pe.X(st),pe.y,pe.X(q[0])-pe.X(st),pe.h,0,U.soft("alias"),"none",0));
        o.push(S.T((pe.X(st)+pe.X(q[0]))/2,pe.y+14,"止まる","middle",9.5,"alias",true,false,null,true));st=null;}});
      o.push(pe.line(r.pts.map(function(q){return [q[0],q[1]];}),r.downH>0?"alias":"green",2.2));
      box.set(S.svg(700,pe.y+pe.h+40,o));
      var stopTxt=r.stopAt===null?'<span class="ok">止まらない</span>':'<span class="warn">'+(Math.floor(r.stopAt)+1)+' 日目の '+Math.floor((r.stopAt%1)*24)+' 時ごろに蓄えが尽き、'+U.sig(r.downH,3)+' 時間止まる</span>';
      ro.innerHTML="入ったエネルギー <b>"+U.sig(r.inWh,3)+" Wh</b>（充電できた時間 "+U.sig(r.chgH,3)+" 時間）・使ったエネルギー <b>"+U.sig(r.outWh,3)+" Wh</b>・最も少ない蓄え <b>"+U.sig(r.minWh,3)+" Wh</b><br>"+
        "送った回数 "+Math.round(r.nrep)+" 回（5 分ごとなら 2016 回）・"+stopTxt+
        '<div class="wnote">電池の温度は、気温に時定数で追いつき、日が当たると高くなる簡単な模型（例の値）。太陽電池は 8〜16 時に、晴れで夏の山の 6 割、曇りで 1.2 割、雪で 0 の正弦の形で電力を出し、蓄えへ移すときに 2 割を失う。眠りとセンサで 1 mW、1 回の送信に 2.7 J。蓄えに合わせるときは、蓄えを見込みの日数で使い切る電力を上限に間隔を決める（02 章 6 節のコードと同じ考え方）。</div>';
    }
    draw();
  };

  /* ---- 6 節の最後: 5 つの条件のチェックの表 ---- */
  /* 停電の後に残る時間（06 章 3 節の模型を解析的に解く）: 全波整流の山から一定の電力で下がる。
     停電の始まりを半周期の中で 200 通りに変え、交流の検出の信号が H になってから 3.0〜3.5 ms で気づくとして、最も短いものを返す */
  function _w16_hold(Vr,f,C,P,V2,Pa){
    var Vp=Math.SQRT2*Vr,w=2*Math.PI*f,Th=0.5/f,tpk=0.25/f,tz=0.5/f,a=Math.asin(Math.min(1,20/Vp))/w;
    function vd(t){return Math.sqrt(Math.max(Vp*Vp-2*P*(t-tpk)/C,0));}
    var t=tz;while(t<1/f){t+=1e-6;if(Math.abs(Vp*Math.sin(w*t))>=vd(t))break;}
    var tch=t,vv=vd(tch),best=1e9;
    for(var k=0;k<200;k++){var T0=tpk+k/200*Th,v0=T0<tch?vd(T0):Math.abs(Vp*Math.sin(w*T0));
      var hs=(T0>=tz-a&&T0<=tz+a)?tz-a:T0,j=0;while(T0+j*5e-4-hs<=3e-3+1e-12)j++;
      var rem=(0.5*C*v0*v0-P*j*5e-4-0.5*C*V2*V2)/Pa;if(rem<best)best=rem;}
    return {valley:vv,rem:best};
  }
  /* 空だき: 底の板（熱容量 Cb）とサーミスタ（時定数 tau の一次遅れ）。1 秒ごとの読みの差が r を超えることが 3 回続いたら気づく */
  function _w16_dry(P,Cb,tau,r){var Tp=20,Ts=20,dt=0.01,prev=20,cnt=0;
    for(var n=1;n<=12000;n++){Tp+=P/Cb*dt;Ts+=(Tp-Ts)/tau*dt;
      if(n%100===0){cnt=(Ts-prev>r)?cnt+1:0;prev=Ts;if(cnt>=3)return {t:n*dt,Tp:Tp};}}
    return null;}
  REG.w16_check=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"CHECK","条件ごとのチェックの表 — 例の機器の値で判定する");
    var r0=U.ctrls(el);
    var cond=U.select(r0,"条件",["電池（2 節の記録計）","USB・AC アダプタ（3 節の扇風機）","商用電源に直結（4 節の電気ポット）","車の電源（5 節の記録計）","屋外・環境発電（6 節の観測器）"],0,draw);
    var G=[],QL=[];
    function grp(){var d=U.mk("div");el.appendChild(d);G.push(d);return d;}
    function quals(g,list){var row=U.ctrls(g),cs=list.map(function(q){return U.checkbox(row,"確かめた: "+q[1],false,draw);});QL.push({list:list,cs:cs});}
    function C(v,u){return U.sig(v,3)+(u||"");}
    /* 0: 電池 */
    var g=grp(),c1=U.ctrls(g);
    var bb=U.select(c1,"電池",[{v:"cr",t:"CR2032 1 個"},{v:"alk",t:"単 3 形アルカリ乾電池 2 本"},{v:"soc",t:"塩化チオニルリチウム電池 1 本"}],"cr",draw);
    var bi=U.slider(c1,"機器の平均電流（自己放電を除く）",{min:0.5,max:500,log:true,value:3.03,fmt:function(v){return U.sig(v,3)+" µA";},onInput:draw});
    var c2=U.ctrls(g);
    var bp=U.slider(c2,"最も厳しいパルスの電流",{min:1,max:200,log:true,value:5,fmt:function(v){return U.sig(v,3)+" mA";},onInput:draw});
    var bl=U.slider(c2,"その長さ",{min:0.5,max:100,log:true,value:20,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var bc=U.select(c2,"大容量コンデンサ",["なし","100 µF","1 mF"],1,draw);
    var c3=U.ctrls(g);
    var bt=U.slider(c3,"最も低い温度",{min:-20,max:25,step:1,value:0,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var bv=U.slider(c3,"BOR のしきい値",{min:1.8,max:3.0,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var bs=U.slider(c3,"出荷までの月数",{min:0,max:24,step:1,value:6,fmt:function(v){return v+" か月";},onInput:draw});
    var bg=U.slider(c3,"目標の寿命",{min:1,max:15,step:1,value:5,fmt:function(v){return v+" 年";},onInput:draw});
    var c4=U.ctrls(g);var ba=U.checkbox(c4,"保管の間も機器が動く（電池を入れたまま出荷）",false,draw);
    var p0=U.btnrow(g);
    U.button(p0,"2 節: はじめの設計",function(){bb.set("cr");bi.set(6.31);bp.set(15);bl.set(3);bc.set(0);bt.set(0);bv.set(2.2);bs.set(6);ba.set(true);bg.set(5);draw();});
    U.button(p0,"2 節: 直した設計",function(){bb.set("cr");bi.set(3.03);bp.set(5);bl.set(20);bc.set(1);bt.set(0);bv.set(2.2);bs.set(6);ba.set(false);bg.set(5);draw();});
    quals(g,[["異常への備え","尽きかけたら OK・LOW・CRIT で止まる",["p04_3"]],["電力の予算","眠る前にピンを整え、センサと分圧は測るときだけ",["p07_3","p08_3","p09_4"]],
      ["駆動の設計","大きな動作を重ねない",["p04_2"]],["電源の構成","逆に入れても壊れない・出荷モード",["p04_6"]]]);
    /* 1: USB・AC アダプタ */
    g=grp();c1=U.ctrls(g);
    var us=U.select(c1,"電源",[{v:"0.1",t:"ふつうのポート（通信しない機器）100 mA"},{v:"0.5",t:"USB 2.0（設定の後）500 mA"},{v:"1.5",t:"BC 1.2・Type-C 1.5 A"},{v:"3",t:"Type-C 3.0 A"},{v:"1",t:"専用の AC アダプタ 1 A"},{v:"2",t:"専用の AC アダプタ 2 A"}],"1",draw);
    c2=U.ctrls(g);
    var ui=U.slider(c2,"定常の電流",{min:10,max:3000,log:true,value:370,int:true,fmt:function(v){return v+" mA";},onInput:draw});
    var up=U.slider(c2,"回し始め・入れた瞬間の最大の電流",{min:10,max:5000,log:true,value:1010,int:true,fmt:function(v){return v+" mA";},onInput:draw});
    c3=U.ctrls(g);
    var ur=U.slider(c3,"ケーブルとコネクタの往復の抵抗",{min:0.05,max:1,step:0.05,value:0.4,fmt:function(v){return v.toFixed(2)+" Ω";},onInput:draw});
    var uv=U.slider(c3,"機器が動く最低の入力の電圧",{min:3,max:4.8,step:0.1,value:3.6,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    p0=U.btnrow(g);
    U.button(p0,"強を一気に（AC アダプタ）",function(){us.set("1");ui.set(370);up.set(1010);draw();});
    U.button(p0,"強を 0.5 s で上げる",function(){ui.set(370);up.set(420);draw();});
    U.button(p0,"弱を 2 s で（ふつうのポート）",function(){us.set("0.1");ui.set(80);up.set(85);draw();});
    quals(g,[["電源の構成","差した瞬間の突入電流を抑える",["p05_3"]],["異常への備え","抜かれたら新しく書き始めない",["p05_6"]],
      ["電力の予算","充電の電流は予算の残りにする",["p02_3","p04_5"]],["駆動の設計","回し始めは時間をかけて上げる",["p13_3","p12_6"]]]);
    /* 2: 商用電源に直結 */
    g=grp();c1=U.ctrls(g);
    var mt=U.checkbox(c1,"人が触れる所がある",true,draw),mc=U.checkbox(c1,"ほかの機器と配線でつなぐ",false,draw);
    c2=U.ctrls(g);
    var mv=U.slider(c2,"コンセントの電圧の下限",{min:85,max:100,step:1,value:90,fmt:function(v){return v+" V";},onInput:draw});
    var mf=U.select(c2,"周波数",["50 Hz","60 Hz"],0,draw);
    var mcap=U.slider(c2,"平滑コンデンサ",{values:[4.7,10,22,47,100],value:22,fmt:function(v){return v+" µF";},onInput:draw});
    var mp=U.slider(c2,"入力の電力",{min:0.5,max:10,step:0.5,value:2,fmt:function(v){return v+" W";},onInput:draw});
    c3=U.ctrls(g);
    var mr=U.select(c3,"気づいた後の電力",["そのまま","1/4 に減らす"],0,draw);
    var mw=U.slider(c3,"後始末の時間",{min:0.1,max:30,log:true,value:0.7,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var ms=U.slider(c3,"待機電力",{min:0.05,max:2,log:true,value:0.3,fmt:function(v){return U.sig(v,3)+" W";},onInput:draw});
    c4=U.ctrls(g);
    var mh=U.slider(c4,"ヒータ",{min:300,max:2000,step:100,value:1000,fmt:function(v){return v+" W";},onInput:draw});
    var mb=U.slider(c4,"本体の熱容量",{min:100,max:1000,step:50,value:400,fmt:function(v){return v+" J/K";},onInput:draw});
    var mk=U.slider(c4,"判定の速さ",{min:0.3,max:3,step:0.1,value:1,fmt:function(v){return v.toFixed(1)+" K/s";},onInput:draw});
    var mtau=U.slider(c4,"サーミスタの遅れ（時定数）",{min:1,max:20,step:1,value:5,fmt:function(v){return v+" s";},onInput:draw});
    quals(g,[["異常への備え","復電で危険な動作は利用者の操作を待つ",["p06_4","p15_6"]],["異常への備え","リセットの間は既定の状態で切れる",["p15_1"]],
      ["異常への備え","2 つ目のスイッチとマイコンに頼らない保護",["p15_2","p14_5"]],["駆動の設計","ゼロクロスに合わせて入れ切りする",["p06_6","p14_4"]],["電源の構成","サージは入口の部品で守る",["p06_5"]]]);
    /* 3: 車の電源 */
    g=grp();c1=U.ctrls(g);
    var vr=U.slider(c1,"バッテリの内部抵抗と配線",{min:5,max:50,step:1,value:30,fmt:function(v){return v+" mΩ";},onInput:draw});
    var vd=U.slider(c1,"入口のダイオードの電圧",{min:0,max:0.8,step:0.05,value:0.4,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var vm=U.slider(c1,"電源が保てる最低の入力",{min:3,max:8,step:0.1,value:4,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    c2=U.ctrls(g);
    var vc=U.slider(c2,"保持のコンデンサ",{values:[0.1,0.22,0.47,1,2.2,4.7],value:0.47,fmt:function(v){return v+" mF";},onInput:draw});
    var vp=U.slider(c2,"動作中の電力",{min:0.01,max:1,log:true,value:0.1,fmt:function(v){return U.sig(v,3)+" W";},onInput:draw});
    var vq=U.slider(c2,"気づいた後の電力",{min:1,max:100,log:true,value:5,fmt:function(v){return U.sig(v,3)+" mW";},onInput:draw});
    var vt=U.slider(c2,"クランキングの長さ",{min:0.2,max:3,step:0.1,value:1,fmt:function(v){return v.toFixed(1)+" s";},onInput:draw});
    c3=U.ctrls(g);
    var vk=U.checkbox(c3,"下がったことに気づいて電力を減らす",true,draw);
    var vi=U.slider(c3,"止めている間の平均電流",{min:1,max:2000,log:true,value:5.7,fmt:function(v){return U.sig(v,3)+" µA";},onInput:draw});
    var vn=U.slider(c3,"乗らない日数",{min:1,max:90,step:1,value:30,fmt:function(v){return v+" 日";},onInput:draw});
    quals(g,[["電源の構成","ロードダンプ・ノイズ・逆接続を入口の回路で守る（規格で確かめる）",["p02_5","p04_6"]],["測り方の設計","ACC の途切れの長さで判断する",["p02_5","p11_6"]],
      ["異常への備え","BOR から起動したら重い負荷をすぐ動かさない",["p05_5","p15_3"]],["駆動の設計","夏の高温で出力を下げる",["p14_6"]]]);
    /* 4: 屋外・環境発電 */
    g=grp();c1=U.ctrls(g);
    var op=U.slider(c1,"太陽電池（晴れた夏の山）",{values:[0.1,0.2,0.3,0.5,0.8,1,1.5,2],value:0.5,fmt:function(v){return v+" W";},onInput:draw});
    var of=U.slider(c1,"冬の山の割合",{min:0.3,max:1,step:0.05,value:0.6,fmt:function(v){return Math.round(v*100)+" %";},onInput:draw});
    var oh=U.slider(c1,"冬の日の出ている時間",{min:6,max:12,step:1,value:8,fmt:function(v){return v+" 時間";},onInput:draw});
    c2=U.ctrls(g);
    var ol=U.slider(c2,"平均の電力",{min:1,max:50,log:true,value:10,fmt:function(v){return U.sig(v,3)+" mW";},onInput:draw});
    var oe=U.slider(c2,"蓄え",{values:[0.4,0.8,1.6,3.2,6.4],value:1.6,fmt:function(v){return v+" Wh";},onInput:draw});
    var os=U.slider(c2,"始めの蓄え",{min:10,max:100,step:10,value:60,fmt:function(v){return v+" %";},onInput:draw});
    c3=U.ctrls(g);
    var oc=U.slider(c3,"寒くて充電できない日が続く日数",{min:0,max:14,step:1,value:5,fmt:function(v){return v+" 日";},onInput:draw});
    var ow=U.slider(c3,"晴れた日に充電できる時間（電池が 0 °C 以上）",{min:0,max:8,step:0.1,value:2.1,fmt:function(v){return v.toFixed(1)+" 時間";},onInput:draw});
    quals(g,[["測り方の設計","結露のときの値を妥当性の検査で確かめる",["p10_6"]],["測り方の設計","長い配線を TVS と直列抵抗で守る",["p11_5"]],
      ["電力の予算","蓄えに合わせて送る間隔を決める",["p02_6"]],["異常への備え","故障したら縮退運転する",["p15_5"]]]);
    var box=U.svgbox(el); var ro=U.readout(el);
    /* rows: [段, 確かめること, 基準, 値, 余裕の比（≥ 1 で満たす。null は判定なし）, 読む節のキー] */
    function rowsOf(m){
      var R=[];
      if(m===0){var b=_w16_B[bb.get()],T=bt.get(),Cc=[0,100e-6,1e-3][bc.get()],I=bi.get(),Isd=b.sd*b.Qn*1000/8760;
        var u=_w16_usable(b,T,[[bp.get()*1e-3,bl.get()*1e-3]],Cc,0.1,bv.get()).u;
        var st=(ba.get()?I*1e-3*730*bs.get():0)+b.sd*b.Qn*bs.get()/12,left=u*b.Qn-st,life=left>0?left/((I+Isd)*1e-3)/8760:0;
        var vb0=_w16_E(b,0)-bp.get()*1e-3*_w16_drop(b,0,T,bl.get()*1e-3,Cc,0.1);
        R.push(["電源の構成","新しい電池のパルスの底（"+String(T).replace("-","−")+" °C）","BOR + 0.1 V 以上",C(vb0," V"),vb0/(bv.get()+0.1),["p03_4","p04_1"]]);
        R.push(["電源の構成","パルスの底で使える割合","—",C(u*100," %"),null,["p03_4","p04_1"]]);
        R.push(["条件の書き出し","出荷までに失う電荷","—",C(st," mAh"),null,["p03_5","p04_6"]]);
        R.push(["確かめ","電池寿命（自己放電 "+C(Isd," µA")+" を含む）",bg.get()+" 年以上",left>0?C(life," 年"):"残らない",left>0?life/bg.get():0.01,["p03_5"]]);}
      if(m===1){var bud=+us.get()*1000*0.9,Vd=5-ur.get()*up.get()/1000;
        R.push(["電力の予算","定常の電流","予算の 9 割 "+bud+" mA 以下",ui.get()+" mA",bud/ui.get(),["p02_3"]]);
        R.push(["駆動の設計","回し始め・入れた瞬間の最大","同じ",up.get()+" mA",bud/up.get(),["p13_3","p12_6"]]);
        R.push(["電源の構成","最大の電流のときの端子の電圧","最低の入力 "+uv.get().toFixed(1)+" V 以上",C(Vd," V"),Vd/uv.get(),["p02_3"]]);}
      if(m===2){var iso=mt.get()||mc.get(),f=mf.get()?60:50,P=mp.get(),h=_w16_hold(mv.get(),f,mcap.get()*1e-6,P,70,mr.get()?P/4:P),rem=Math.max(0,h.rem*1000);
        var dry=_w16_dry(mh.get(),mb.get(),mtau.get(),mk.get()),mmin=(mh.get()/mk.get()-mb.get())/4.18;
        R.push(["電源の構成","絶縁が要るか","触れる・つなぐなら要る",iso?"要る（絶縁電源）":"非絶縁も選べる",null,["p02_4","p06_2"]]);
        R.push(["異常への備え","停電に気づいてから電源が保てるまで（後始末の 2 倍以上）",C(2*mw.get()," ms")+" 以上",h.rem>0?C(rem," ms"):"谷で既に下限を割る",h.rem>0?rem/(2*mw.get()):0.01,["p06_3"]]);
        R.push(["異常への備え","空だきに気づく時間と底の板の温度","100 °C より低いうち（例の基準）",dry?C(dry.t," s")+"・"+C(dry.Tp," °C"):"2 分では気づかない",dry?100/dry.Tp:0.01,["p14_5","p10_6"]]);
        R.push(["測り方の設計","空とみなす水の量（これより少ないと判定の速さを超える）","—",mmin>0?C(mmin," g"):"水があっても超える",null,["p14_5"]]);
        R.push(["条件の書き出し","待機電力の 1 年の電力量","規格と地域の値",C(ms.get()*8.76," kWh"),null,["p06_7"]]);}
      if(m===3){var E0=12.6,Rb=vr.get()/1000,I0=E0/(Rb+0.015),Vc=E0-I0*Rb-vd.get(),need=Vc<vm.get();
        var V1=E0-vd.get(),Ej=0.5*vc.get()*1e-3*(V1*V1-vm.get()*vm.get()),th=Ej/(vk.get()?vq.get()*1e-3:vp.get());
        R.push(["電源の構成","クランキングの間の入力（ダイオードの後。スタータ 15 mΩ）",vm.get().toFixed(1)+" V 以上",C(Vc," V"),Vc/vm.get(),["p02_5"]]);
        R.push(["異常への備え","保持のコンデンサで支えられる時間",need?"クランキングの "+vt.get().toFixed(1)+" s 以上":"（要らない）",need?C(th," s"):"—",need?th/vt.get():null,["p06_3","p05_6"]]);
        var ah=vi.get()*1e-6*24*vn.get();
        R.push(["電力の予算","止めている間の電荷（"+vn.get()+" 日）","車両のメーカの上限",C(ah*1000," mAh")+"（40 Ah の "+C(ah/40*100," %")+"）",null,["p02_5","p05_2","p09_4"]]);}
      if(m===4){var L=oh.get(),Pk=op.get()*of.get(),use=ol.get()*24/1000;
        var full=0.8*Pk*2*L/Math.PI,win=Math.min(ow.get(),L),part=0.8*Pk*(L/Math.PI)*(1+Math.cos(Math.PI*(L-win)/L));
        var E0b=oe.get()*os.get()/100,days=E0b/use;
        R.push(["電力の予算","晴れて 1 日中充電できたときの収支","使う "+C(use*1000," mWh")+" 以上",C(full*1000," mWh"),full/use,["p02_6"]]);
        R.push(["電源の構成","晴れても電池が 0 °C 以上の "+win.toFixed(1)+" 時間だけ充電できるとき","同じ",C(part*1000," mWh"),part/use,["p04_5","p02_6"]]);
        R.push(["電力の予算","蓄えだけで動ける日数","充電できない "+oc.get()+" 日以上",C(days," 日"),oc.get()>0?days/oc.get():null,["p02_6"]]);}
      return R;
    }
    function draw(){
      var m=cond.get();G.forEach(function(d,i){d.style.display=i===m?"":"none";});
      var R=rowsOf(m),q=QL[m],num=R.filter(function(r){return r[4]!==null;});
      /* 余裕の図: log2(比) を ±3 に限って、基準を真ん中に置く */
      var o=[],x0=290,wd=360,xc=x0+wd/2,rh=34,W=700;
      o.push(S.T(xc,14,"基準","middle",10,"ink",true));o.push(S.T(x0,14,"足りない","start",9.5,"alias",true));o.push(S.T(x0+wd,14,"余裕がある","end",9.5,"green",true));
      [-3,-2,-1,0,1,2,3].forEach(function(k){var xx=xc+k*wd/6;o.push(S.L(xx,22,xx,26+Math.max(1,num.length)*rh,k===0?"ink":"grid",k===0?1.4:1));
        o.push(S.T(xx,38+Math.max(1,num.length)*rh,k===0?"1 倍":(k>0?Math.pow(2,k)+" 倍":"1/"+Math.pow(2,-k)),"middle",9,"muted"));});
      num.forEach(function(r,i){var y=28+i*rh,lr=Math.max(-3,Math.min(3,Math.log(Math.max(r[4],1e-9))/Math.LN2)),ok=r[4]>=1,c=ok?"green":"alias";
        o.push(S.T(x0-8,y+12,r[1].length>24?r[1].slice(0,23)+"…":r[1],"end",9.5,"ink"));
        o.push(S.T(x0-8,y+25,"値 "+r[3].replace(/<[^>]*>/g,""),"end",9,"muted"));
        o.push(S.RECT(Math.min(xc,xc+lr*wd/6),y+6,Math.max(2,Math.abs(lr*wd/6)),14,2,U.soft(c),c,1.2));});
      if(!num.length)o.push(S.T(xc,50,"この条件には、数で判定する行がない","middle",10,"muted"));
      box.set(S.svg(W,46+Math.max(1,num.length)*rh,o));
      var rows=R.map(function(r){return [r[0],r[1],r[2],r[3],r[4]===null?"—":_w16_ok(r[4]>=1),_w16_lk(r[5])];});
      q.list.forEach(function(x,i){rows.push([x[0],x[1],"—","—",q.cs[i].get()?'<span class="ok">確かめた</span>':"まだ",_w16_lk(x[2])]);});
      var bad=num.filter(function(r){return r[4]<1;}).length,done=q.cs.filter(function(c){return c.get();}).length;
      ro.innerHTML="数で判定した "+num.length+" 行のうち、基準を満たさないもの <b>"+bad+"</b> 行・確かめた印 <b>"+done+" / "+q.cs.length+"</b>"+
        U.tbl(["段","確かめること","基準","値","判定","読む節"],rows,["left","wrap","wrap","wrap","center","left"])+
        '<div class="wnote">値はどれも例の値で、前の章の模型で計算した。基準を満たさない行は、読む節の方法で直してから、もう一度確かめる。商用電源と車の電源では、規格・法令・車両のメーカの要求を必ず確かめること。</div>';
    }
    draw();
  };
