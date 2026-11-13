/* ===== 24 章 総合演習 — GNSS ロガーを設計する ===== */
/* 計算は図（fig/f24.py の _f24_*）と同じ。4 節の電力のモデルは、ホストで動かした C の模擬と、起きた回ごとに一致することを確かめてある */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w24_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w24_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
var _W24_D=Math.PI/180,_W24_L1=1575.42e6,_W24_LAM=299792458/1575.42e6,_W24_KB=1.380649e-23;
var _W24_SPEC=41,_W24_ACQ=35,_W24_TRK=25;   /* 仕様（仰角 30° で 41 dB-Hz）と、捕捉・追尾の目安 [dB-Hz] */

/* ---- 2・3 節: C/N0（3 章 1・3 節の回線計算、9 章 1 節のフリスの式、11 章の線の損失、22 章 2 節の離調） ---- */
/* 利得 0 dBi のアンテナで受ける電力 [dBm]（EIRP 26.4 dBW・大気 0.5 dB）と、例のパッチの右旋の利得 [dBi] */
function _w24_prx(el){var R=6371e3,a=26560e3,r=Math.sqrt(a*a-Math.pow(R*Math.cos(el*_W24_D),2))-R*Math.sin(el*_W24_D);
  return 56.4-20*Math.log10(4*Math.PI*r/_W24_LAM)-0.5;}
function _w24_ga(el){return 3-8*Math.pow((90-el)/85,2);}
/* 段の並び [[名前, 利得 dB, 雑音指数 dB]]。c = {ant: "patch"・"chip"・"active", lna, saw: "after"・"before"・"none", line [cm], cable [m]} */
function _w24_stages(c){var st=[];
  if(c.ant==="active"){st.push(["アンテナの LNA",18,1],["アンテナの SAW",-1.5,1.5],["アンテナの増幅器",11.5,2]);var L=0.5*c.cable;if(L>0)st.push(["ケーブル",-L,L]);}
  else{if(c.line>0){var L2=0.07*c.line;st.push(["線",-L2,L2]);}
    if(c.saw==="before")st.push(["SAW",-1.5,1.5]);if(c.lna)st.push(["LNA",18,1]);if(c.saw==="after")st.push(["SAW",-1.5,1.5]);}
  st.push(["チップの増幅器 1",20,3],["チップの増幅器 2",68.5,3]);return st;}
/* フリスの式: アンテナの端子に換算したシステム雑音温度 [K]（アンテナの雑音温度 100 K）と、段ごとの寄与 [K] */
function _w24_tsys(st){var g=1,tot=0,parts=[];st.forEach(function(s){var c=(Math.pow(10,s[2]/10)-1)*290/g;parts.push([s[0],c]);tot+=c;g*=Math.pow(10,s[1]/10);});
  return {ts:100+tot,parts:parts};}
function _w24_n0(ts){return 10*Math.log10(_W24_KB*ts)+30;}
/* 8 章のパッチのモデル（2 つのモード、Q = 100）: 共振が shift [Hz] ずれたときの L1 での右旋の損失 [dB] */
function _w24_rhcp(shift,U){var cx=U.ctl.cx,c=U.ctl.c,f=_W24_L1,f0=f+shift,Q=100,Z0=50;
  function K(fk){var x=Q*(f/fk-fk/f);return c(1/(1+x*x),-x/(1+x*x));}
  var ku=K(f0*(1-1/(2*Q))),kv=K(f0*(1+1/(2*Q))),Z=cx.scale(cx.add(ku,kv),Z0),I=cx.inv(cx.add(c(Z0,0),Z)),
    Vu=cx.mul(cx.scale(I,Z0),ku),Vv=cx.mul(cx.scale(I,Z0),kv),PR=Math.pow(cx.abs(cx.sub(Vu,cx.mul(c(0,1),Vv))),2)/2;
  return -10*Math.log10(PR/0.25);}
var _W24_DF=-(2.8-1)*0.010*Math.exp(-1/3)*(1-Math.exp(-2/3))*_W24_L1/2;   /* 例の筐体（ABS 2 mm・隙間 1 mm）による共振のずれ: −4.94 MHz */
/* 仰角 el の衛星の C/N0。c.case: 0 筐体なし・1 合わせないアンテナ・2 共振を 5 MHz 上げたアンテナ。c.att: 木の葉・鞄などの弱まり [dB] */
function _w24_cn0(el,c,U){var t=_w24_tsys(_w24_stages(c)),g=_w24_ga(el)-(c.ant==="chip"?3.01:0),
    loss=(c.ant!=="active"&&c.case?_w24_rhcp(_W24_DF+(c.case===2?5e6:0),U):0)+(c.att||0);
  return _w24_prx(el)+g-loss-_w24_n0(t.ts);}
var _W24_BASE={ant:"patch",lna:true,saw:"after",line:2,cable:3,case:2,att:0};   /* 3 節で仕上げた設計 */

/* ---- 空の衛星（東京・時刻 0、1 章の近似の配置）: [{el, az, sys}] ---- */
function _w24_vis(U){var G=U.gnss,r=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),out=[];
  G.constellation().forEach(function(s){if(s.sys==="QZSS")return;var q=G.elaz(r,G.ecef(s,0));if(q[0]>0)out.push({el:q[0],az:q[1],sys:s.sys});});
  return out;}

/* ---- 5 節: 衛星系の数と精度。5 節の図（f24.py の _F24_ACC）と同じ値（24 時間・10 分おきの DOP の計算は重いので、結果を写した）
   [R95 の中央値の倍率（UERE 3.99 m を掛けると [m]）, 22 章 1 節の通りで解ける時間の割合]。GPS → +GLONASS → +Galileo → +BeiDou ---- */
var _W24_UERE=Math.sqrt(1.5*1.5+3.5*3.5+0.4*0.4+1*1+0.5*0.5);
var _W24_ACC=[[2.059402,0.0],[1.311584,0.496552],[1.047575,0.889655],[0.905186,0.993103]];
/* 1 回に出す文のバイトの数（10 章 4 節の例の文。f24.py の _f24_nbytes で数えた値）。GGA と RMC だけなら衛星系によらず 141 B */
var _W24_NB=[466,626,805,999],_W24_NB2=141;

/* ---- 4 節: 1 日の電力（f24.py の _f24_sim・_f24_charge・_f24_cats と同じ規則） ---- */
var _W24_H=3600000,_W24_MIN=60000,_W24_DAY=86400000;
var _W24_P={Tu:60000,TU_MAX:1800000,WAIT_FIX:45000,STOP:100,POLL:10,T_HOT:2000,T_WARM:30000,T_EPH:7200000,UPN:3,RMC:147,
  I_ACQ:35,I_TRK:25,I_BK:0.015,I_LNA:3,I_MCU:3,I_SLP:0.002,I_AON:0.006,backoff:true,Qb:2000,SD:0.02};
var _W24_DAYS={ex:[[7*_W24_H+30*_W24_MIN,9*_W24_H+30*_W24_MIN],[12*_W24_H+15*_W24_MIN,13*_W24_H+15*_W24_MIN],[16*_W24_H+45*_W24_MIN,21*_W24_H+45*_W24_MIN]],
  out:[[0,24*_W24_H]],two:[[7*_W24_H+30*_W24_MIN,9*_W24_H+30*_W24_MIN]],"in":[]};
function _w24_outdoor(t,out){var d=t%_W24_DAY;for(var i=0;i<out.length;i++)if(d>=out[i][0]&&d<out[i][1])return true;return false;}
function _w24_cp(t,poll){return Math.ceil(t/poll)*poll;}
/* 起きた回の並び [電源を入れた時刻, 切った時刻, "hot"/"warm", 記録したか, 位置が出た組の時刻, 記録した時刻]（ms） */
function _w24_sim(days,p,out){var t_wake=0,iv=p.Tu,t_eph=null,w=[];
  while(t_wake<days*_W24_DAY){var t_on=_w24_cp(t_wake,p.POLL),warm=(t_eph===null)||(t_on-t_eph>=p.T_EPH),ttff=warm?p.T_WARM:p.T_HOT,k=1,nfix=0,t_fix=null,t_rec=null;
    while(1000*k<=p.WAIT_FIX+1000){var E=t_on+1000*k;
      if(E-t_on>=ttff&&_w24_outdoor(E,out)){nfix++;if(t_fix===null)t_fix=E;
        if(nfix>=p.UPN){var td=_w24_cp(E+p.RMC,p.POLL);if(td-t_on<=p.WAIT_FIX)t_rec=td;break;}}
      else nfix=0;
      k++;}
    var ok=t_rec!==null,t_off=ok?_w24_cp(t_rec+p.STOP,p.POLL):_w24_cp(t_on+p.WAIT_FIX+p.POLL+p.STOP,p.POLL);
    if(ok&&warm)t_eph=t_fix;
    w.push([t_on,t_off,warm?"warm":"hot",ok,ok?t_fix:null,t_rec]);
    iv=ok?p.Tu:(p.backoff?Math.min(iv*2,p.TU_MAX):p.Tu);t_wake=Math.max(t_wake+iv,t_off);}
  return w;}
/* 起きている間の電荷 [mA・ms]: 位置が出るまで捕捉、出た後は追尾。LNA・マイコンの分と、ext（いつも流れる分など）を足す */
function _w24_on(p,a,b,tf,ext){var c=tf!==null?p.I_ACQ*(tf-a)+p.I_TRK*(b-tf):p.I_ACQ*(b-a);return c+(p.I_LNA+p.I_MCU+ext)*(b-a);}
/* 2 日目（前の日から続く状態）の 1 日。tot: その日の電荷 [mAh]、q: 起きた回の分の内訳、slp: 眠っている間の分、line: 電荷を足していく折れ線 */
function _w24_day(p,out){var w=_w24_sim(3,p,out),t0=_W24_DAY,t1=2*_W24_DAY,q={hot:0,warm:0,fail:0},Ioff=p.I_BK+p.I_SLP+p.I_AON,
    line=[[0,0]],acc=0,last=t0;
  w.forEach(function(x){var a=Math.max(x[0],t0),b=Math.min(x[1],t1);if(b<=a)return;
    acc+=Ioff*(a-last)/3.6e6;line.push([(a-t0)/_W24_H,acc]);
    acc+=_w24_on(p,a,b,x[4]!==null?Math.min(Math.max(x[4],a),b):null,p.I_AON)/3.6e6;line.push([(b-t0)/_W24_H,acc]);last=b;});
  acc+=Ioff*(t1-last)/3.6e6;line.push([24,acc]);
  var d=w.filter(function(x){return x[0]>=t0&&x[0]<t1;});
  d.forEach(function(x){q[x[3]?x[2]:"fail"]+=_w24_on(p,x[0],x[1],x[4],0)/3.6e6;});
  var sd=p.Qb*p.SD/30;
  return {tot:acc,q:q,slp:acc-q.hot-q.warm-q.fail,sd:sd,days:p.Qb/(acc+sd),wakes:d,all:w,line:line};}
/* 連続: モジュールを入れたまま。追尾の 25 mA に LNA・マイコンを足した 31 mA が 1 日中流れるとした（5 節の図と同じ） */
function _w24_cont(p){var tot=(p.I_TRK+p.I_LNA+p.I_MCU+p.I_AON)*24,sd=p.Qb*p.SD/30;return {tot:tot,sd:sd,days:p.Qb/(tot+sd)};}

/* ---- 6 節: 充電の回路の揺れ（10 章 2 節の例のモデル）と LC フィルタ（21 章 3 節。Q = 1） ---- */
function _w24_psrr(f,a0db,fp){var a0=Math.pow(10,a0db/20),x=f/fp,d=1+x*x;return 20*Math.log10(Math.hypot(1+a0/d,-a0*x/d));}
var _W24_Q0=Math.pow(20*Math.pow(10,-(_w24_psrr(2e6,40,20e3)+_w24_psrr(2e6,60,10e3))/20),2);   /* N_p/N_0 = 7.60 */
var _W24_FLC=1/(2*Math.PI*Math.sqrt(2.2e-6*10e-6));
function _w24_af(f){var x=f/_W24_FLC;return 10*Math.log10(Math.pow(1-x*x,2)+x*x);}
function _w24_drop(af){return 10*Math.log10(1+_W24_Q0*Math.pow(10,-af/10));}


/* =====================================================================
   w24_budget: 部品の選び方と置き方で、空の衛星ごとの C/N0 と余裕が変わる
   ===================================================================== */
var _W24_SHORT={"アンテナの LNA":"LNA","アンテナの SAW":"SAW","アンテナの増幅器":"増幅器","チップの増幅器 1":"増幅器 1","チップの増幅器 2":"増幅器 2"};
var _W24_SCOL={"アンテナ":"teal","線":"muted","ケーブル":"muted","SAW":"gold","アンテナの SAW":"gold","LNA":"signal","アンテナの LNA":"signal","アンテナの増幅器":"signal",
  "チップの増幅器 1":"purple","チップの増幅器 2":"purple"};
REG.w24_budget=function(el,U){
  var S=U.S;
  U.head(el,"C/N0 BUDGET","アンテナ・LNA・SAW フィルタ・線・筐体の選び方と、空の衛星ごとの C/N<sub>0</sub>");
  var r1=U.ctrls(el);
  var an=U.select(r1,"アンテナ",[{v:"patch",t:"パッチ（右旋・パッシブ）"},{v:"chip",t:"チップ（直線偏波・パッシブ）"},{v:"active",t:"外付けのアクティブアンテナ（28 dB）"}],"patch",function(){sync();draw();});
  var ln=U.select(r1,"LNA（雑音指数 1 dB・利得 18 dB）",[{v:"1",t:"あり"},{v:"0",t:"なし"}],"1",function(){draw();});
  var sw=U.select(r1,"SAW フィルタ",[{v:"after",t:"LNA の後"},{v:"before",t:"LNA の前"},{v:"none",t:"なし"}],"after",function(){draw();});
  var r2=U.ctrls(el);
  var li=U.slider(r2,"アンテナから LNA までの線（0.07 dB/cm）",{min:0,max:10,step:0.5,value:2,fmt:function(v){return _w24_f(v,1)+" cm（"+_w24_f(0.07*v,2)+" dB）";},onInput:function(){draw();}});
  var cb=U.slider(r2,"ケーブル（0.5 dB/m）",{min:0,max:20,step:0.5,value:3,fmt:function(v){return _w24_f(v,1)+" m（"+_w24_f(0.5*v,2)+" dB）";},onInput:function(){draw();}});
  var cs=U.select(r2,"筐体（ABS 2 mm・隙間 1 mm）",[{v:"0",t:"入れない"},{v:"1",t:"入れる・合わせないアンテナ"},{v:"2",t:"入れる・共振を 5 MHz 上げたアンテナ"}],"2",function(){draw();});
  var r3=U.ctrls(el);
  var at=U.slider(r3,"木の葉・鞄などの弱まり",{min:0,max:15,step:0.5,value:0,fmt:function(v){return _w24_f(v,1)+" dB";},onInput:function(){draw();}});
  var ev=U.slider(r3,"読み出す衛星の仰角",{min:5,max:90,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function set(o){an.set(o.ant||"patch");ln.set(o.lna===false?"0":"1");sw.set(o.saw||"after");li.set(o.line==null?2:o.line);cb.set(o.cable==null?3:o.cable);
    cs.set(String(o.case==null?2:o.case));at.set(o.att||0);ev.set(30);sync();draw();}
  U.button(br,"本文の例（3 節で仕上げた設計）",function(){set({});});
  U.button(br,"LNA なし",function(){set({lna:false});});
  U.button(br,"チップアンテナ",function(){set({ant:"chip"});});
  U.button(br,"合わせないアンテナ",function(){set({case:1});});
  U.button(br,"鞄の中（6 dB 弱まる）",function(){set({att:6});});
  U.button(br,"アクティブアンテナ・ケーブル 3 m",function(){set({ant:"active"});});
  var box=U.svgbox(el),ro=U.readout(el),sats=_w24_vis(U);
  function sync(){var a=an.get()==="active";[ln,sw,li,cs].forEach(function(c){c.el.style.display=a?"none":"";});cb.el.style.display=a?"":"none";}
  function cfg(){return {ant:an.get(),lna:ln.get()==="1",saw:sw.get(),line:li.get(),cable:cb.get(),case:+cs.get(),att:at.get()};}
  function cls(v){return v>=_W24_SPEC?"green":(v>=_W24_ACQ?"gold":(v>=_W24_TRK?"purple":"alias"));}
  function draw(){
    var c=cfg(),st=_w24_stages(c),t=_w24_tsys(st),n0=_w24_n0(t.ts),nar=_w24_nar(box),Wd=nar?400:700,o=[];
    var cn30=_w24_cn0(30,c,U),cne=_w24_cn0(ev.get(),c,U);
    /* (a) 段の並びと、各段が足す雑音温度 */
    o.push(S.TX(10,16,"(a) 段の並びと、各段が T_{sys} に足す雑音温度 [K]（アンテナの端子に換算）","start",nar?10:11,"ink",true));
    var stg=[["アンテナ",null]].concat(st),vals=[100].concat(t.parts.map(function(q){return q[1];})),vmax=Math.max(200,Math.max.apply(null,vals));
    var bw=nar?50:62,gap=nar?4:8,fs=8.5,x=10,y=30,xs=[];
    stg.forEach(function(s,i){var cl=_W24_SCOL[s[0]]||"muted",g=s[1];
      o.push(S.RECT(x,y,bw,30,4,U.soft(cl),cl,1.2));o.push(S.T(x+bw/2,y+13,_W24_SHORT[s[0]]||s[0],"middle",fs,"ink",true));
      var d=g===null?0:(Math.abs(g-Math.round(g))<1e-9?0:(Math.abs(10*g-Math.round(10*g))<1e-9?1:2));
      o.push(S.T(x+bw/2,y+25,g===null?"100 K":(g>0?"+":"")+_w24_f(g,d)+" dB","middle",fs,"muted"));
      var hv=Math.max(1,44*Math.min(vals[i],vmax)/vmax);o.push(S.RECT(x+bw*0.2,y+88-hv,bw*0.6,hv,1,U.soft(cl),cl,1));
      o.push(S.T(x+bw/2,y+100,_w24_f(vals[i],vals[i]<10?1:0),"middle",fs,cl==="muted"?"ink":cl,true));
      if(i<stg.length-1)o.push(S.ARR(x+bw,y+15,x+bw+gap,y+15,"muted",1.1,5));xs.push([x,x+bw]);x+=bw+gap;});
    function brk(i0,i1,lab){var a=xs[i0][0],b=xs[i1][1];o.push(S.W([a,y+106,a,y+110,b,y+110,b,y+106],"muted",1));o.push(S.T((a+b)/2,y+122,lab,"middle",fs,"muted"));}
    brk(stg.length-2,stg.length-1,"モジュールの中");if(c.ant==="active")brk(1,3,"アクティブアンテナ");
    var ty;
    if(nar){ty=y+142;o.push(S.TX(10,ty,"T_{sys} = "+_w24_f(t.ts,1)+" K、N_0 = "+_w24_f(n0,2)+" dBm/Hz","start",9.5,"teal",true));}
    else{ty=y+122;o.push(S.TX(x+6,y+58,"T_{sys} = "+_w24_f(t.ts,1)+" K","start",10,"teal",true));o.push(S.TX(x+6,y+76,"N_0 = "+_w24_f(n0,2)+" dBm/Hz","start",10,"teal",true));}
    /* (b) スカイプロット（衛星ごとの C/N0 で色を分ける） */
    var by=ty+24,R=nar?80:88,cx=nar?200:110,cy=by+26+R;
    o.push(S.TX(10,by,"(b) 空の衛星ごとの C/N_0（東京・時刻 0）","start",nar?10:11,"ink",true));
    var n41=0,n35=0,n25=0,sv=sats.map(function(q){var v=_w24_cn0(q.el,c,U);if(v>=_W24_SPEC)n41++;if(v>=_W24_ACQ)n35++;if(v>=_W24_TRK)n25++;return {el:q.el,az:q.az,col:cls(v),v:v};});
    o.push(U.gnss.sky(U,cx,cy,R,sv,{labels:false,dot:3.4}));
    /* (c) 仰角と C/N0 */
    var cy0=nar?cy+R+34:by,P=nar?U.plot(52,cy0+16,330,150,[0,90],[20,56]):U.plot(320,by+22,350,170,[0,90],[20,56]);
    o.push(S.TX(nar?10:270,cy0,"(c) 仰角と C/N_0","start",nar?10:11,"ink",true));
    o.push(P.axes({xl:"仰角 [°]",yl:"C/N_0 [dB-Hz]",xt:[0,30,60,90],yt:[20,25,30,35,40,45,50,55],sz:9,ylOff:34}));
    [[_W24_ACQ,"alias","捕捉の目安 35"],[_W24_TRK,"purple","追尾の目安 25"]].forEach(function(q){o.push(S.L(P.x,P.Y(q[0]),P.x+P.w,P.Y(q[0]),q[1],1,"3 3"));
      o.push(S.T(P.x+P.w-3,P.Y(q[0])-4,q[2],"end",8.5,q[1],false,false,null,true));});
    var base=[],cur=[];for(var e=2;e<=90;e+=2){base.push([e,_w24_cn0(e,_W24_BASE,U)]);cur.push([e,_w24_cn0(e,c,U)]);}
    o.push(P.clip(base,"faint",1.5,"5 3"));o.push(P.clip(cur,"signal",2.4));
    sv.forEach(function(q){if(q.v>=20&&q.v<=56)o.push(S.D(P.X(q.el),P.Y(q.v),q.col,2.6));});
    o.push(S.D(P.X(30),P.Y(_W24_SPEC),"gold",4));o.push(S.T(P.X(30)+6,P.Y(_W24_SPEC)+13,"仕様: 30° で 41","start",8.5,"gold",true,false,null,true));
    var ex=ev.get();o.push(S.L(P.X(ex),P.y,P.X(ex),P.y+P.h,"ink",1,"2 3"));if(cne>=20&&cne<=56)o.push(S.CIRC(P.X(ex),P.Y(cne),5,"ink",1.6));
    var ly=P.y+P.h+48,lx=nar?10:270;
    o.push(S.LEGL(lx,ly,[["signal",null,"いまの設計"],["faint","5 3","3 節で仕上げた設計"]],9,12));
    o.push(S.T(lx,ly+16,"点の色: 緑 41 以上・金 35〜41・紫 25〜35・赤 25 未満 [dB-Hz]","start",8.5,"muted"));
    box.set(S.svg(Wd,ly+24,o));
    var m=cn30-_W24_SPEC;
    ro.innerHTML="T<sub>sys</sub> "+_w24_f(t.ts,1)+" K、N<sub>0</sub> "+_w24_f(n0,2)+" dBm/Hz"+
      (c.ant!=="active"&&c.case?"、筐体による右旋の損失 "+_w24_f(_w24_rhcp(_W24_DF+(c.case===2?5e6:0),U),2)+" dB":"")+"<br>"+
      "仰角 30° の C/N<sub>0</sub> <b>"+_w24_f(cn30,2)+" dB-Hz</b>、仕様 41 dB-Hz に対する余裕 "+(m>=0?'<span class="ok">'+_w24_f(m,1)+" dB</span>":'<span class="warn">'+_w24_f(m,1)+" dB（仕様を割る）</span>")+
      "。仰角 "+ex+"° では "+_w24_f(cne,2)+" dB-Hz<br>見えている "+sats.length+" 機のうち、41 dB-Hz 以上 "+n41+" 機・捕捉の目安 35 以上 "+n35+" 機・追尾の目安 25 以上 "+n25+" 機";
  }
  sync();draw();
};


/* =====================================================================
   w24_power: 記録の間隔・方式・1 日の過ごし方・ファームウェアの決めごとで、1 日の電荷と電池の持ち時間が変わる
   ===================================================================== */
REG.w24_power=function(el,U){
  var S=U.S;
  U.head(el,"POWER","記録の間隔・方式・1 日の過ごし方と、1 日に使う電荷・電池の持ち時間");
  var r1=U.ctrls(el);
  var md=U.select(r1,"方式",[{v:"p",t:"周期的に起きる（本文）"},{v:"c",t:"連続（モジュールを入れたまま）"}],"p",function(){sync();draw();});
  var tu=U.slider(r1,"記録の間隔",{values:[10,20,30,60,120,300,600,1800,3600],value:60,fmt:function(v){return v<60?v+" s":(v<3600?(v/60)+" 分":"1 時間");},onInput:function(){draw();}});
  var dy=U.select(r1,"1 日の過ごし方",[{v:"ex",t:"例の 1 日（屋外 8 時間）"},{v:"two",t:"屋外 2 時間"},{v:"out",t:"ずっと屋外"},{v:"in",t:"ずっと屋内"}],"ex",function(){draw();});
  var r2=U.ctrls(el);
  var bo=U.checkbox(r2,"位置が出ないとき、起きる間隔を 2 倍ずつ延ばす（上限 30 分）",true,function(){draw();});
  var bk=U.checkbox(r2,"バックアップ電源で時計とエフェメリスを保つ",true,function(){draw();});
  var r3=U.ctrls(el);
  var up=U.slider(r3,"3D に上がるまでの組（UP_N）",{values:[1,2,3,4,5],value:3,fmt:function(v){return v+" 組";},onInput:function(){draw();}});
  var wf=U.slider(r3,"測位を待つ上限",{values:[15,30,45,60,90],value:45,fmt:function(v){return v+" s";},onInput:function(){draw();}});
  var bt=U.select(r3,"電池",[{v:"1000",t:"1000 mAh"},{v:"2000",t:"2000 mAh（本文）"},{v:"3000",t:"3000 mAh"}],"2000",function(){draw();});
  var br=U.btnrow(el);
  function set(o){md.set(o.md||"p");tu.set(o.tu||60);dy.set(o.dy||"ex");bt.set("2000");bo.set(o.bo!==false);bk.set(o.bk!==false);up.set(o.up||3);wf.set(o.wf||45);sync();draw();}
  U.button(br,"本文の例",function(){set({});});
  U.button(br,"起きる間隔を延ばさない",function(){set({bo:false});});
  U.button(br,"バックアップ電源なし",function(){set({bk:false});});
  U.button(br,"待つ上限 30 s",function(){set({wf:30});});
  U.button(br,"ずっと屋外",function(){set({dy:"out"});});
  U.button(br,"連続",function(){set({md:"c"});});
  var box=U.svgbox(el),ro=U.readout(el);
  function sync(){var c=md.get()==="c";[bo,bk,up,wf].forEach(function(x){x.el.style.display=c?"none":"";});}
  function draw(){
    var nar=_w24_nar(box),Wd=nar?400:700,o=[],cont=md.get()==="c",out=_W24_DAYS[dy.get()],p={};
    for(var k in _W24_P)p[k]=_W24_P[k];
    p.Tu=tu.get()*1000;p.backoff=bo.get();p.UPN=up.get();p.WAIT_FIX=wf.get()*1000;p.Qb=+bt.get();if(!bk.get())p.T_EPH=0;
    var r=cont?_w24_cont(p):_w24_day(p,out),all=r.tot+r.sd,x0=nar?46:62,pw=Wd-x0-16;
    /* (a) 1 日の電荷を足していく */
    o.push(S.T(10,16,"(a) 1 日に使う電荷を、0 時から足していく","start",nar?10:11,"ink",true));
    var ymax=Math.max(10,Math.ceil(r.tot/10)*10),P=U.plot(x0,30,pw,110,[0,24],[0,ymax]);
    out.forEach(function(q){o.push(S.RECT(P.X(q[0]/_W24_H),P.y,P.X(q[1]/_W24_H)-P.X(q[0]/_W24_H),P.h,0,U.soft("green"),"none",0));});
    o.push(P.axes({xl:"時刻 [時]",yl:"電荷 [mAh]",xt:[0,6,12,18,24],yt:U.nice(0,ymax,4),sz:9,ylOff:nar?34:40}));
    if(out.length)o.push(S.T(P.X((out[0][0]+out[0][1])/2/_W24_H),P.y+12,"屋外","middle",9,"green",true,false,null,true));
    if(cont)o.push(P.line([[0,0],[24,r.tot]],"gold",2));
    else{o.push(P.line(r.line,"gold",2));
      r.wakes.forEach(function(x){var c=x[3]?(x[2]==="warm"?"gold":"green"):"alias",xx=P.X((x[0]-_W24_DAY)/_W24_H);o.push(S.L(xx,P.y+P.h-(x[3]?5:10),xx,P.y+P.h,c,1));});}
    o.push(S.T(P.x+P.w-4,P.y+12,_w24_f(r.tot,1)+" mAh","end",9.5,"gold",true,false,null,true));
    /* (b) 内訳と電池の日数 */
    var yb=P.y+P.h+58,items=cont?[["受信を続ける（31 mA）",r.tot,"signal"],["電池の自己放電",r.sd,"muted"]]:
      [["屋外で記録（ホット）",r.q.hot,"green"],["受け直す（ウォーム）",r.q.warm,"gold"],["屋内で探して止める",r.q.fail,"alias"],["眠っている間",r.slp,"purple"],["電池の自己放電",r.sd,"muted"]];
    o.push(S.T(10,yb,"(b) 1 日の内訳 "+_w24_f(all,1)+" mAh と、電池の持ち時間","start",nar?10:11,"ink",true));
    var xx=10,bwid=Wd-20;
    items.forEach(function(it){var w=bwid*it[1]/all;o.push(S.RECT(xx,yb+10,Math.max(w,0.8),18,1,U.soft(it[2]),it[2],1));xx+=w;});
    var nc=nar?1:2;
    items.forEach(function(it,i){var cxp=10+(i%nc)*((Wd-20)/nc),cyp=yb+48+Math.floor(i/nc)*16;
      o.push(S.RECT(cxp,cyp-9,9,9,2,U.soft(it[2]),it[2],1));o.push(S.T(cxp+14,cyp,it[0]+" "+_w24_f(it[1],2)+" mAh","start",9,"ink"));});
    var yd=yb+48+Math.ceil(items.length/nc)*16+12,D=U.plot(10,yd,Wd-84,16,[0,90],[0,1]),ok=r.days>=30;
    o.push(S.RECT(D.x,yd,D.w,16,2,"var(--screen)","line",0.8));
    o.push(S.RECT(D.x,yd,Math.max(1,D.X(Math.min(r.days,90))-D.x),16,2,U.soft(ok?"green":"alias"),ok?"green":"alias",1.2));
    o.push(S.L(D.X(30),yd-4,D.X(30),yd+20,"gold",1.5,"4 3"));
    [0,30,60,90].forEach(function(v){o.push(S.T(D.X(v),yd+31,v+" 日","middle",8.5,v===30?"gold":"muted",v===30));});
    o.push(S.T(D.x+D.w+6,yd+12,(r.days>90?"> ":"")+_w24_f(Math.min(r.days,999),1)+" 日","start",10,ok?"green":"alias",true));
    box.set(S.svg(Wd,yd+40,o));
    /* 読み出し */
    var h="1 日 <b>"+_w24_f(all,1)+" mAh</b>（自己放電 "+_w24_f(r.sd,2)+" mAh を含む。平均の電流 "+_w24_f(all/24,3)+" mA）、"+bt.get()+" mAh の電池で <b>"+_w24_f(r.days,1)+" 日</b> "+
      (ok?'<span class="ok">仕様（30 日以上）を満たす</span>':'<span class="warn">仕様（30 日以上）を割る</span>');
    if(cont){var oh=0;out.forEach(function(q){oh+=(q[1]-q[0])/_W24_H;});
      h+="<br>連続: 追尾の 25 mA に LNA とマイコンの 6 mA を足した 31 mA が 1 日中流れるとした（屋内で探し続ける間は 35 mA で、さらに多い）。記録 "+Math.round(oh*3600/tu.get())+" 件/日";}
    else{var nh=0,nw=0,nf=0;r.wakes.forEach(function(x){if(!x[3])nf++;else if(x[2]==="warm")nw++;else nh++;});
      var th=(Math.ceil(p.T_HOT/1000)*1000+1000*(p.UPN-1)+_w24_cp(p.RMC,p.POLL))/1000,tw=(Math.ceil(p.T_WARM/1000)*1000+1000*(p.UPN-1)+_w24_cp(p.RMC,p.POLL))/1000;
      h+="<br>1 日に起きる回: ホットスタートで記録 "+nh+" 回・ウォームスタートで記録 "+nw+" 回・位置が出ない "+nf+" 回<br>起きてから記録まで: ホット "+_w24_f(th,2)+" s・ウォーム "+_w24_f(tw,2)+" s"+
        (tw*1000>p.WAIT_FIX?'（<span class="warn">ウォームは待つ上限 '+wf.get()+" s を超える</span>）":"");
      var first=[];out.forEach(function(q){if(q[1]-q[0]>=24*_W24_H)return;var t0=_W24_DAY+q[0],f=null;
        r.all.forEach(function(x){if(f===null&&x[3]&&x[5]>=t0)f=x[5];});first.push(f===null?"記録なし":_w24_f((f-t0)/60000,1)+" 分");});
      if(first.length)h+="<br>外に出てから最初の記録まで: "+first.join("・");
      if(nh+nw===0&&out.length)h+='<br><span class="warn">屋外でも一度も記録できない</span>（エフェメリスを受け直す前に電源を切るので、毎回ウォームスタートになる）';}
    ro.innerHTML=h;
  }
  sync();draw();
};


/* =====================================================================
   w24_check: 回路とファームウェアの選び方で、仕様の表の各行の設計の値と判定が変わる
   ===================================================================== */
REG.w24_check=function(el,U){
  var S=U.S;
  U.head(el,"SPEC CHECK","設計の選び方と、1 節の仕様の表の各行の判定");
  var r1=U.ctrls(el);
  var an=U.select(r1,"アンテナ",[{v:"patch",t:"パッチ（右旋）"},{v:"chip",t:"チップ（直線偏波）"}],"patch",function(){draw();});
  var ln=U.select(r1,"LNA",[{v:"1",t:"あり"},{v:"0",t:"なし"}],"1",function(){draw();});
  var cs=U.select(r1,"アンテナの共振",[{v:"2",t:"筐体に合わせて 5 MHz 上げる"},{v:"1",t:"合わせない"}],"2",function(){draw();});
  var r2=U.ctrls(el);
  var lc=U.select(r2,"充電の回路の後の LC フィルタ",[{v:"1",t:"あり"},{v:"0",t:"なし"}],"1",function(){draw();});
  var bk=U.select(r2,"バックアップ電源",[{v:"1",t:"いつも給電"},{v:"0",t:"なし"}],"1",function(){draw();});
  var bo=U.select(r2,"位置が出ないとき",[{v:"1",t:"起きる間隔を延ばす"},{v:"0",t:"延ばさない"}],"1",function(){draw();});
  var r3=U.ctrls(el);
  var sy=U.select(r3,"衛星系",[{v:"1",t:"GPS"},{v:"2",t:"GPS + GLONASS"},{v:"3",t:"GPS + GLONASS + Galileo"},{v:"4",t:"4 つ（+ BeiDou）"}],"4",function(){draw();});
  var se=U.select(r3,"出す文",[{v:"0",t:"GGA と RMC だけ"},{v:"1",t:"10 章 4 節の例の 6 種類"}],"0",function(){draw();});
  var bd=U.select(r3,"ボーレート",[{v:"9600",t:"9600 bit/s"},{v:"38400",t:"38 400 bit/s"},{v:"115200",t:"115 200 bit/s"}],"9600",function(){draw();});
  var r4=U.ctrls(el);
  var ts=U.select(r4,"記録に付ける時刻",[{v:"0",t:"組の時刻の欄"},{v:"1",t:"組を受け終えたマイコンの時刻"}],"0",function(){draw();});
  var bt=U.select(r4,"電池",[{v:"1000",t:"1000 mAh"},{v:"2000",t:"2000 mAh"},{v:"3000",t:"3000 mAh"}],"2000",function(){draw();});
  var fl=U.select(r4,"フラッシュ",[{v:"4",t:"4 MB"},{v:"8",t:"8 MB"},{v:"16",t:"16 MB"}],"8",function(){draw();});
  var br=U.btnrow(el);
  function set(o){an.set(o.an||"patch");ln.set(o.ln||"1");cs.set(o.cs||"2");lc.set(o.lc||"1");bk.set(o.bk||"1");sy.set(o.sy||"4");se.set(o.se||"0");
    bd.set(o.bd||"9600");ts.set(o.ts||"0");bo.set(o.bo||"1");bt.set(o.bt||"2000");fl.set(o.fl||"8");draw();}
  U.button(br,"本文の設計（6 節で仕上げた後）",function(){set({});});
  U.button(br,"LC フィルタを入れる前",function(){set({lc:"0"});});
  U.button(br,"例の 6 種類の文のまま",function(){set({se:"1"});});
  U.button(br,"GPS だけ・LNA なし",function(){set({sy:"1",ln:"0"});});
  U.button(br,"受け終えた時刻・バックアップなし",function(){set({ts:"1",bk:"0"});});
  var box=U.svgbox(el),tb=U.mk("div");el.appendChild(tb);var ro=U.readout(el);
  function rows(){
    var n=+sy.get(),acc=_W24_ACC[n-1],c={ant:an.get(),lna:ln.get()==="1",saw:"after",line:2,cable:3,case:+cs.get(),att:0};
    var r95=acc[0]*_W24_UERE,str=100*acc[1],tt=bk.get()==="1"?2:30,cn=_w24_cn0(30,c,U),drop=_w24_drop(lc.get()==="1"?_w24_af(2e6):0);
    var nb=se.get()==="1"?_W24_NB[n-1]:_W24_NB2,baud=+bd.get(),load=100*10*nb/baud;
    var tm=ts.get()==="0"?10.5e-9:0.12+10*_W24_NB2/baud;   /* 組の時刻の欄: 14 章 2 節の例の 10.5 ns。受け終えた時刻: 位置の遅れ（13 章 3 節: 計算 0.12 s + GGA と RMC を送る時間） */
    var p={};for(var k in _W24_P)p[k]=_W24_P[k];p.backoff=bo.get()==="1";p.Qb=+bt.get();if(ln.get()!=="1")p.I_LNA=0;if(bk.get()!=="1")p.T_EPH=0;
    var day=_w24_day(p,_W24_DAYS.ex),stor=(+fl.get())*1048576/32/1440;
    function tfmt(s){return s<1e-6?_w24_f(s*1e9,1)+" ns":_w24_f(s,2)+" s";}
    /* [項目, 仕様, 設計の値, 満たすか, 余裕, ゲージ {lo, hi, th, good: "low"/"high", log, v, lab}] */
    return [
      ["1 開けた空の精度","R95 10 m 以下",_w24_f(r95,1)+" m",r95<=10,_w24_f(10-r95,1)+" m",{lo:0,hi:20,th:10,good:"low",v:r95,lab:_w24_f(r95,1)+" m"}],
      ["2 通りで位置が出る割合","90 % 以上",_w24_f(str,0)+" %",str>=90,_w24_f(str-90,0)+" ポイント",{lo:0,hi:100,th:90,good:"high",v:str,lab:_w24_f(str,0)+" %"}],
      ["3 TTFF（ホットスタート）","5 s 以下",tt+" s"+(tt>5?"（毎回ウォームスタート）":""),tt<=5,_w24_f(5-tt,0)+" s",{lo:0,hi:40,th:5,good:"low",v:tt,lab:tt+" s"}],
      ["4 受信の強さ","41 dB-Hz 以上",_w24_f(cn,1)+" dB-Hz",cn>=41,_w24_f(cn-41,1)+" dB",{lo:30,hi:50,th:41,good:"high",v:cn,lab:_w24_f(cn,1)+" dB-Hz"}],
      ["5 充電しながらの記録","下がり 0.5 dB 以下",_w24_f(drop,2)+" dB",drop<=0.5,_w24_f(0.5-drop,2)+" dB",{lo:0,hi:10,th:0.5,good:"low",v:drop,lab:_w24_f(drop,2)+" dB"}],
      ["6 記録の時刻","UTC との差 1 ms 以下",tm<1e-6?"約 10 ns（組の時刻の欄）":_w24_f(tm,2)+" s（位置の遅れ）",tm<=1e-3,"約 1 ms",{lo:1e-9,hi:1,th:1e-3,good:"low",log:true,v:tm,lab:tfmt(tm)}],
      ["7 最短の記録の間隔","1 s","負荷率 "+_w24_f(load,1)+" %・1 回 "+nb+" B",load<100&&nb<=1024,_w24_f(100-load,0)+" ポイント",{lo:0,hi:120,th:100,good:"low",v:load,lab:"負荷率 "+_w24_f(load,1)+" %"}],
      ["8 記録できる量","90 日分以上",_w24_f(stor,0)+" 日分",stor>=90,_w24_f(stor-90,0)+" 日分",{lo:0,hi:400,th:90,good:"high",v:stor,lab:_w24_f(stor,0)+" 日分"}],
      ["9 電池の持ち時間","30 日以上",_w24_f(day.days,1)+" 日",day.days>=30,_w24_f(day.days-30,1)+" 日",{lo:0,hi:90,th:30,good:"high",v:day.days,lab:_w24_f(day.days,1)+" 日"}],
      ["10 大きさ・防水","80 × 55 × 25 mm 以下・IPX7 相当","78 × 52 × 22 mm・パッキンと USB のふた（防水は試験で判定）",true,"2・3・3 mm",{lo:0,hi:100,th:80,good:"low",v:78,lab:"長さ 78 mm"}]];}
  function draw(){
    var R=rows(),nar=_w24_nar(box),Wd=nar?400:700,o=[],x0=nar?126:200,bw=nar?150:330,rh=24,fs=nar?9:9.5;
    o.push(S.T(10,16,"設計の値（点）と仕様の値（金の線）。緑の側が仕様を満たす（6 行目は対数の目盛）","start",nar?8.5:10,"ink",true));
    R.forEach(function(r,i){var y=28+i*rh,g=r[5],ok=r[3],col=ok?"green":"alias";
      function X(v){var q=g.log?(Math.log10(v)-Math.log10(g.lo))/(Math.log10(g.hi)-Math.log10(g.lo)):(v-g.lo)/(g.hi-g.lo);return x0+bw*Math.max(0,Math.min(1,q));}
      o.push(S.T(x0-8,y+13,r[0],"end",fs,"ink",true));
      o.push(S.RECT(x0,y+6,bw,10,2,"var(--screen)","line",0.8));
      var a=g.good==="low"?x0:X(g.th),b=g.good==="low"?X(g.th):x0+bw;o.push(S.RECT(a,y+6,Math.max(1,b-a),10,0,U.soft("green"),"none",0));
      o.push(S.L(X(g.th),y+2,X(g.th),y+20,"gold",1.6));
      o.push(S.D(X(g.v),y+11,col,4.5));
      o.push(S.T(x0+bw+8,y+14,g.lab,"start",nar?8.5:9,col,true));
      o.push(S.T(Wd-10,y+15,ok?"○":"×","end",12,col,true));});
    box.set(S.svg(Wd,32+R.length*rh,o));
    tb.innerHTML=U.tbl(["項目","仕様","設計の値","余裕","判定"],R.map(function(r){
      return [r[0],r[1],r[2],r[3]?r[4]:"—",r[3]?'<span class="ok">○</span>':'<span class="warn">×</span>'];}),["left","wrap","wrap","right","center"]);
    var bad=R.filter(function(r){return !r[3];}).map(function(r){return r[0].split(" ")[0];});
    ro.innerHTML=bad.length?'<span class="warn">仕様を満たさない行: '+bad.join("・")+"</span>。その値を見積もった節に戻って、選び方を変える":
      '<span class="ok">全部の行が仕様を満たす</span>（10 行目の防水は、23 章の試験の計画で確かめる）';
  }
  draw();
};
