/* ===== 24 章 総合演習 — GNSS ロガーを設計する ===== */
/* 計算は図（fig/f24.py の _f24_*）と同じ。4 節の電力のモデルは、ホストで動かした C の模擬と起きた回ごとに一致することを確かめてある */
function _w24_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w24_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
var _W24_D=Math.PI/180,_W24_L1=1575.42e6,_W24_LAM=299792458/1575.42e6,_W24_KB=1.380649e-23;
var _W24_SPEC=41,_W24_ACQ=35,_W24_TRK=25;

/* ---- 2・3 節: C/N0（3 章 1・3 節の回線計算、9 章 1 節のフリスの式、11 章の線の損失、22 章 2 節の離調） ---- */
function _w24_prx(el){var R=6371e3,a=26560e3,r=Math.sqrt(a*a-Math.pow(R*Math.cos(el*_W24_D),2))-R*Math.sin(el*_W24_D);
  return 56.4-20*Math.log10(4*Math.PI*r/_W24_LAM)-0.5;}
function _w24_ga(el){return 3-8*Math.pow((90-el)/85,2);}
/* 段の並び [[名前, 利得 dB, 雑音指数 dB]]。c = {ant: "patch"・"chip"・"active", lna, saw: "after"・"before"・"none", line（cm）, cable（m）} */
function _w24_stages(c){var st=[];
  if(c.ant==="active"){st.push(["アンテナの LNA",18,1],["アンテナの SAW",-1.5,1.5],["アンテナの増幅器",11.5,2]);var L=0.5*c.cable;if(L>0)st.push(["ケーブル",-L,L]);}
  else{if(c.line>0){var L2=0.07*c.line;st.push(["線",-L2,L2]);}
    if(c.saw==="before")st.push(["SAW",-1.5,1.5]);if(c.lna)st.push(["LNA",18,1]);if(c.saw==="after")st.push(["SAW",-1.5,1.5]);}
  st.push(["チップの増幅器 1",20,3],["チップの増幅器 2",68.5,3]);return st;}
function _w24_tsys(st){var g=1,tot=0,parts=[];st.forEach(function(s){var c=(Math.pow(10,s[2]/10)-1)*290/g;parts.push([s[0],c]);tot+=c;g*=Math.pow(10,s[1]/10);});
  return {ts:100+tot,parts:parts};}
function _w24_n0(ts){return 10*Math.log10(_W24_KB*ts)+30;}
/* 8 章のパッチのモデル（2 つのモード、Q = 100）: 共振が shift [Hz] ずれたときの L1 での S11・軸比・右旋の損失 */
function _w24_l1(shift,U){var cx=U.ctl.cx,c=U.ctl.c,f=_W24_L1,f0=f+shift,Q=100,Z0=50;
  function K(fk){var x=Q*(f/fk-fk/f);return c(1/(1+x*x),-x/(1+x*x));}
  var ku=K(f0*(1-1/(2*Q))),kv=K(f0*(1+1/(2*Q))),Z=cx.scale(cx.add(ku,kv),Z0),G=cx.div(cx.sub(Z,c(Z0,0)),cx.add(Z,c(Z0,0))),
    I=cx.inv(cx.add(c(Z0,0),Z)),Vu=cx.mul(cx.scale(I,Z0),ku),Vv=cx.mul(cx.scale(I,Z0),kv),jVv=cx.mul(c(0,1),Vv),
    PR=Math.pow(cx.abs(cx.sub(Vu,jVv)),2)/2,PL=Math.pow(cx.abs(cx.add(Vu,jVv)),2)/2,aR=Math.sqrt(PR),aL=Math.sqrt(PL);
  return {s11:20*Math.log10(Math.max(cx.abs(G),1e-6)),ar:20*Math.log10((aR+aL)/Math.max(Math.abs(aR-aL),1e-12)),rhcp:-10*Math.log10(PR/0.25)};}
var _W24_DF=-(2.8-1)*0.010*Math.exp(-1/3)*(1-Math.exp(-2/3))*_W24_L1/2;   /* 例の筐体（ABS 2 mm・隙間 1 mm）: −4.94 MHz */
function _w24_caseLoss(pre,U){return _w24_l1(_W24_DF+(pre?5e6:0),U).rhcp;}
/* 仰角 el の衛星の C/N0。c.case: 0 筐体なし・1 合わせないアンテナ・2 共振を 5 MHz 上げたアンテナ、c.att: 木の葉などの弱まり [dB] */
function _w24_cn0(el,c,U){var t=_w24_tsys(_w24_stages(c)),g=_w24_ga(el)-(c.ant==="chip"?3.01:0),
    loss=(c.ant!=="active"&&c.case?_w24_caseLoss(c.case===2,U):0)+(c.att||0);
  return _w24_prx(el)+g-loss-_w24_n0(t.ts);}
var _W24_BASE={ant:"patch",lna:true,saw:"after",line:2,cable:3,case:2,att:0};

/* ---- 空の衛星（東京・時刻 0、1 章の近似の配置） ---- */
var _W24_SYS4=["GPS","GLONASS","Galileo","BeiDou"],_W24_VIS=null;
function _w24_vis(U,systems,t,mask){var G=U.gnss,r=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),out=[];
  G.constellation().forEach(function(s){if(systems.indexOf(s.sys)<0)return;var q=G.elaz(r,G.ecef(s,t));if(q[0]>mask)out.push({nm:s.nm,el:q[0],az:q[1],sys:s.sys});});
  return out.sort(function(a,b){return b.el-a.el;});}

/* ---- 5 節: 衛星系と精度（24 時間・10 分おき・仰角マスク 10° の R95 の中央値の倍率、通りの中で解ける割合） ---- */
var _W24_UERE=Math.sqrt(1.5*1.5+3.5*3.5+0.4*0.4+1+0.25),_W24_ACC={};
function _w24_canyon(az){return Math.atan(2*24/18*Math.abs(Math.sin((az-45)*_W24_D)))/_W24_D;}
function _w24_G(sats){var us=[];sats.forEach(function(q){if(us.indexOf(q.sys)<0)us.push(q.sys);});
  return {G:sats.map(function(q){var e=q.el*_W24_D,a=q.az*_W24_D,r=[-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e)];us.forEach(function(u){r.push(u===q.sys?1:0);});return r;}),nu:us.length};}
function _w24_r95(s1,s2){function pin(R){var n=360,sm=0;for(var i=0;i<n;i++){var ph=2*Math.PI*i/n,q=Math.cos(ph)*Math.cos(ph)/(s1*s1)+Math.sin(ph)*Math.sin(ph)/(s2*s2);sm+=(1-Math.exp(-R*R*q/2))/q;}return sm/n/(s1*s2);}
  var lo=0,hi=10*(s1+s2);for(var i=0;i<60;i++){var m=(lo+hi)/2;if(pin(m)<0.95)lo=m;else hi=m;}return (lo+hi)/2;}
function _w24_acc(U,n){if(_W24_ACC[n])return _W24_ACC[n];var sys=_W24_SYS4.slice(0,n),M=U.ctl.mat,rs=[],ok=0;
  for(var k=0;k<=144;k++){var vis=_w24_vis(U,sys,k*600,10),g=_w24_G(vis),H=M.inv(M.mul(M.T(g.G),g.G)),a=H[0][0],b=H[0][1],c=H[1][1],m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);
    rs.push(_w24_r95(Math.sqrt(m+r),Math.sqrt(Math.max(m-r,0))));
    var st=_w24_vis(U,sys,k*600,0).filter(function(q){return q.el>_w24_canyon(q.az);});if(st.length){var g2=_w24_G(st);if(st.length>=3+g2.nu)ok++;}}
  rs.sort(function(x,y){return x-y;});_W24_ACC[n]={k:rs[72],street:ok/145};return _W24_ACC[n];}

/* ---- 5 節: 1 回に出す文のバイトの数（10 章 4 節と同じ作り方） ---- */
var _W24_SATS={GP:[[5,45,123,47],[13,62,45,49],[15,30,210,44],[18,15,300,38],[20,72,280,50],[23,25,150,42],[24,40,330,45],[29,10,60,36],[30,5,250,null],[31,2,100,null]],
  GL:[[66,35,20,43],[67,55,110,46],[76,20,250,40],[77,48,300,44],[82,8,180,null],[83,3,140,null]],
  GA:[[2,40,70,45],[7,65,200,48],[8,22,320,41],[13,30,140,43],[26,50,260,46],[30,12,30,37],[33,4,190,null]],
  GB:[[6,55,190,42],[9,62,210,44],[16,48,170,43],[19,33,60,45],[20,70,320,47],[29,25,280,41],[35,15,110,38],[44,6,40,null]]};
function _w24_nbytes(nsys,all){var talk=["GP","GL","GA","GB"].slice(0,nsys),used=talk.map(function(t){return _W24_SATS[t].filter(function(s){return s[3]!=null;}).map(function(s){return s[0];});}),nu=0;
  used.forEach(function(u){nu+=u.length;});function p2(v){return (v<10?"0":"")+v;}function p3(v){return (v<10?"00":(v<100?"0":""))+v;}
  var b=["GNGGA,092750.00,3540.86000,N,13946.02000,E,1,"+p2(nu)+",0.80,3.3,M,36.7,M,,","GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"];
  if(all){used.forEach(function(u){var f=u.map(p2);while(f.length<12)f.push("");b.push("GNGSA,A,3,"+f.join(",")+",1.50,0.80,1.27");});
    talk.forEach(function(t){var ss=_W24_SATS[t],nm=Math.ceil(ss.length/4);for(var m=0;m<nm;m++){var fl=[t+"GSV",String(nm),String(m+1),p2(ss.length)];
      ss.slice(4*m,4*m+4).forEach(function(s){fl.push(p2(s[0]),p2(s[1]),p3(s[2]),s[3]==null?"":p2(s[3]));});b.push(fl.join(","));}});
    b.push("GNVTG,,T,,M,0.012,N,0.022,K,A","GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A");}
  var n=0;b.forEach(function(s){n+=s.length+6;});return n;}   /* $・*・2 桁・CR・LF の 6 文字を足す */

/* ---- 4 節: 1 日の電力（f24.py の _f24_sim・_f24_charge と同じ規則） ---- */
var _W24_H=3600000,_W24_MIN=60000;
var _W24_P={Tu:60000,TU_MAX:1800000,WAIT_FIX:45000,STOP:100,POLL:10,T_HOT:2000,T_WARM:30000,T_EPH:7200000,UPN:3,RMC:147,
  I_ACQ:35,I_TRK:25,I_BK:0.015,I_LNA:3,I_MCU:3,I_SLP:0.002,I_AON:0.006,backoff:true,Qb:2000,SD:0.02};
var _W24_DAYS={ex:[[7*_W24_H+30*_W24_MIN,9*_W24_H+30*_W24_MIN],[12*_W24_H+15*_W24_MIN,13*_W24_H+15*_W24_MIN],[16*_W24_H+45*_W24_MIN,21*_W24_H+45*_W24_MIN]],
  out:[[0,24*_W24_H]],in:[],two:[[7*_W24_H+30*_W24_MIN,9*_W24_H+30*_W24_MIN]]};
function _w24_outdoor(t,out){var d=t%86400000;for(var i=0;i<out.length;i++)if(d>=out[i][0]&&d<out[i][1])return true;return false;}
function _w24_cp(t,poll){return Math.ceil(t/poll)*poll;}
function _w24_sim(days,p,out){var t_wake=0,iv=p.Tu,t_eph=null,w=[];
  while(t_wake<days*86400000){var t_on=_w24_cp(t_wake,p.POLL),warm=(t_eph===null)||(t_on-t_eph>=p.T_EPH),ttff=warm?p.T_WARM:p.T_HOT,k=1,nfix=0,t_fix=null,t_rec=null;
    while(1000*k<=p.WAIT_FIX+1000){var E=t_on+1000*k;
      if(E-t_on>=ttff&&_w24_outdoor(E,out)){nfix++;if(t_fix===null)t_fix=E;if(nfix>=p.UPN){var td=_w24_cp(E+p.RMC,p.POLL);if(td-t_on<=p.WAIT_FIX)t_rec=td;break;}}
      else nfix=0;k++;}
    var t_off,ok=t_rec!==null;
    if(ok){t_off=_w24_cp(t_rec+p.STOP,p.POLL);if(warm)t_eph=t_fix;}else t_off=_w24_cp(t_on+p.WAIT_FIX+p.POLL+p.STOP,p.POLL);
    w.push([t_on,t_off,warm?"warm":"hot",ok,ok?t_fix:null]);
    iv=ok?p.Tu:(p.backoff?Math.min(iv*2,p.TU_MAX):p.Tu);t_wake=Math.max(t_wake+iv,t_off);}
  return w;}
/* 2 日目の電荷 [mAh]: 起きた回の分（ホットで記録・ウォームで記録・位置が出ない）と、眠っている間の分 */
function _w24_day(p,out){var w=_w24_sim(3,p,out),d=w.filter(function(x){return x[0]>=86400000&&x[0]<2*86400000;}),q={hot:0,warm:0,fail:0},on=0;
  d.forEach(function(x){var a=x[0],b=x[1],key=x[3]?x[2]:"fail",c=x[4]!==null?p.I_ACQ*(x[4]-a)+p.I_TRK*(b-x[4]):p.I_ACQ*(b-a);
    q[key]+=(c+(p.I_LNA+p.I_MCU)*(b-a))/3.6e6;on+=b-a;});
  var slp=((86400000-on)*(p.I_BK+p.I_SLP)+86400000*p.I_AON)/3.6e6,sd=p.Qb*p.SD/30,tot=q.hot+q.warm+q.fail+slp;
  return {q:q,slp:slp,sd:sd,tot:tot,days:p.Qb/(tot+sd),wakes:d,all:w};}
/* 連続: 屋外では追尾 25 mA、屋内では探し続ける 35 mA（LNA・マイコンを足す） */
function _w24_cont(p,out){var oh=0;out.forEach(function(o){oh+=(o[1]-o[0])/_W24_H;});
  var tot=oh*(p.I_TRK+p.I_LNA+p.I_MCU)+(24-oh)*(p.I_ACQ+p.I_LNA+p.I_MCU)+24*p.I_AON,sd=p.Qb*p.SD/30;return {tot:tot,sd:sd,days:p.Qb/(tot+sd)};}
function _w24_hm(t){var d=((t%86400000)+86400000)%86400000,h=Math.floor(d/_W24_H),m=Math.floor(d/_W24_MIN)%60;return h+":"+(m<10?"0":"")+m;}

/* ---- 6 節: 充電の回路の揺れ（10 章 2 節の例のモデル）と LC フィルタ（21 章 3 節） ---- */
function _w24_psrr(f,a0db,fp){var a0=Math.pow(10,a0db/20),x=f/fp,d=1+x*x;return 20*Math.log10(Math.hypot(1+a0/d,-a0*x/d));}
var _W24_Q0=Math.pow(20*Math.pow(10,-(_w24_psrr(2e6,40,20e3)+_w24_psrr(2e6,60,10e3))/20),2);
var _W24_FLC=1/(2*Math.PI*Math.sqrt(2.2e-6*10e-6));
function _w24_af(f){var x=f/_W24_FLC;return 10*Math.log10(Math.pow(1-x*x,2)+x*x);}
function _w24_drop(af){return 10*Math.log10(1+_W24_Q0*Math.pow(10,-af/10));}


/* =====================================================================
   w24_budget: 部品の選び方と置き方で、空の衛星ごとの C/N0 と余裕が変わる
   ===================================================================== */
REG.w24_budget=function(el,U){
  var S=U.S;
  U.head(el,"C/N0 BUDGET","アンテナ・LNA・SAW フィルタ・線・筐体の選び方と、空の衛星ごとの C/N<sub>0</sub>");
  var r1=U.ctrls(el);
  var an=U.select(r1,"アンテナ",[{v:"patch",t:"パッチ（右旋・パッシブ）"},{v:"chip",t:"チップ（直線偏波・パッシブ）"},{v:"active",t:"外付けのアクティブアンテナ（28 dB）"}],"patch",function(){sync();draw();});
  var ln=U.select(r1,"LNA",[{v:"1",t:"あり（1 dB・18 dB）"},{v:"0",t:"なし"}],"1",function(){draw();});
  var sw=U.select(r1,"SAW フィルタ",[{v:"after",t:"LNA の後"},{v:"before",t:"LNA の前"},{v:"none",t:"なし"}],"after",function(){draw();});
  var r2=U.ctrls(el);
  var li=U.slider(r2,"アンテナから LNA までの線（0.07 dB/cm）",{min:0,max:10,step:0.5,value:2,fmt:function(v){return _w24_f(v,1)+" cm（"+_w24_f(0.07*v,2)+" dB）";},onInput:function(){draw();}});
  var cb=U.slider(r2,"ケーブル（0.5 dB/m）",{min:0,max:20,step:0.5,value:3,fmt:function(v){return _w24_f(v,1)+" m（"+_w24_f(0.5*v,1)+" dB）";},onInput:function(){draw();}});
  var cs=U.select(r2,"筐体",[{v:"0",t:"なし"},{v:"1",t:"ABS 2 mm・隙間 1 mm（合わせないアンテナ）"},{v:"2",t:"同じ筐体・共振を 5 MHz 上げたアンテナ"}],"2",function(){draw();});
  var r3=U.ctrls(el);
  var at=U.slider(r3,"木の葉・鞄などの弱まり",{min:0,max:15,step:0.5,value:0,fmt:function(v){return _w24_f(v,1)+" dB";},onInput:function(){draw();}});
  var ev=U.slider(r3,"読み出す仰角 θ",{min:5,max:90,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function set(o){an.set(o.ant||"patch");ln.set(o.lna===false?"0":"1");sw.set(o.saw||"after");li.set(o.line==null?2:o.line);cb.set(3);cs.set(String(o.case==null?2:o.case));at.set(o.att||0);ev.set(30);sync();draw();}
  U.button(br,"本文の例（仕上げた設計）",function(){set({});});
  U.button(br,"LNA なし",function(){set({lna:false});});
  U.button(br,"チップアンテナ",function(){set({ant:"chip"});});
  U.button(br,"合わせないアンテナ",function(){set({case:1});});
  U.button(br,"鞄の中（6 dB 弱まる）",function(){set({att:6});});
  var box=U.svgbox(el),ro=U.readout(el);
  var sats=_w24_vis(U,_W24_SYS4,0,0);
  function sync(){var a=an.get()==="active";li.el.style.display=a?"none":"";cb.el.style.display=a?"":"none";
    ln.el.style.display=a?"none":"";sw.el.style.display=a?"none":"";cs.el.style.display=a?"none":"";}
  function cfg(){var a=an.get();return {ant:a,lna:ln.get()==="1",saw:sw.get(),line:li.get(),cable:cb.get(),case:+cs.get(),att:at.get()};}
  function cls(v){return v>=_W24_SPEC?"green":(v>=_W24_ACQ?"gold":(v>=_W24_TRK?"purple":"alias"));}
  function draw(){
    var c=cfg(),st=_w24_stages(c),t=_w24_tsys(st),n0=_w24_n0(t.ts),nar=_w24_nar(box),Wd=nar?400:700,o=[];
    var cn30=_w24_cn0(30,c,U),cne=_w24_cn0(ev.get(),c,U);
    /* (a) 段の並びと、システム雑音温度の内訳 */
    o.push(S.TX(10,16,"(a) 段の並びと、T_{sys} の内訳 [K]（アンテナの端子に換算）","start",nar?10:11,"ink",true));
    var all=[["アンテナ",-0,0]].concat(st),bw=nar?44:62,gap=nar?5:8,x=10,y=30,cols={"アンテナ":"teal","線":"muted","ケーブル":"muted","SAW":"gold","アンテナの SAW":"gold","LNA":"signal","アンテナの LNA":"signal","アンテナの増幅器":"signal"};
    var vals=[100].concat(t.parts.map(function(q){return q[1];})),vmax=Math.max(400,Math.max.apply(null,vals));
    all.forEach(function(s,i){var col=cols[s[0]]||"purple",nm=s[0].replace("チップの増幅器","増幅器").replace("アンテナの ","ア・");
      o.push(S.RECT(x,y,bw,30,4,U.soft(col),col,1.2));o.push(S.T(x+bw/2,y+13,nm,"middle",nar?7.5:8.5,"ink",true));
      o.push(S.T(x+bw/2,y+25,i===0?"100 K":(s[1]>=0?"+"+_w24_f(s[1],1):_w24_f(s[1],2))+" dB","middle",nar?7.5:8.5,"muted"));
      var hv=Math.max(1,46*vals[i]/vmax);o.push(S.RECT(x+bw*0.2,y+86-hv,bw*0.6,hv,1,U.soft(col),col,1));
      o.push(S.T(x+bw/2,y+98,_w24_f(vals[i],vals[i]<10?1:0),"middle",nar?7.5:8.5,col,true));
      if(i<all.length-1)o.push(S.ARR(x+bw,y+15,x+bw+gap,y+15,"muted",1.1,5));x+=bw+gap;});
    o.push(S.TX(x+4,y+60,"T_{sys} = "+_w24_f(t.ts,1)+" K","start",nar?9:10,"teal",true));
    o.push(S.TX(x+4,y+76,"N_0 = "+_w24_f(n0,2)+" dBm/Hz","start",nar?9:10,"teal",true));
    /* (b) スカイプロット（衛星ごとの C/N0） */
    var cx=nar?110:110,cy=nar?250:258,R=nar?78:88;
    o.push(S.TX(10,nar?150:156,"(b) 空の衛星ごとの C/N_0（東京・時刻 0）","start",nar?10:11,"ink",true));
    var sv=sats.map(function(q){var v=_w24_cn0(q.el,c,U);return {el:q.el,az:q.az,name:null,col:cls(v)};});
    o.push(U.gnss.sky(U,cx,cy,R,sv,{labels:false,dot:3.4}));
    var nOK=0,nA=0,nT=0;sats.forEach(function(q){var v=_w24_cn0(q.el,c,U);if(v>=_W24_SPEC)nOK++;if(v>=_W24_ACQ)nA++;if(v>=_W24_TRK)nT++;});
    /* (c) 仰角と C/N0 */
    var px=nar?60:300,py=nar?370:176,P=U.plot(px,py,nar?320:370,nar?150:180,[0,90],[20,56]);
    o.push(S.TX(nar?10:250,py-12,"(c) 仰角と C/N_0","start",nar?10:11,"ink",true));
    o.push(P.axes({xl:"仰角 θ [°]",yl:"C/N_0 [dB-Hz]",xt:[0,30,60,90],yt:[20,25,30,35,40,45,50,55],sz:9,ylOff:34}));
    [[_W24_ACQ,"alias","捕捉の目安 35"],[_W24_TRK,"purple","追尾の目安 25"]].forEach(function(q){o.push(S.L(P.x,P.Y(q[0]),P.x+P.w,P.Y(q[0]),q[1],1,"3 3"));o.push(S.T(P.x+P.w-3,P.Y(q[0])-4,q[2],"end",8.5,q[1],false,false,null,true));});
    var base=[],cur=[];for(var e=2;e<=90;e+=2){base.push([e,_w24_cn0(e,_W24_BASE,U)]);cur.push([e,_w24_cn0(e,c,U)]);}
    o.push(P.clip(base,"faint",1.5,"5 3"));o.push(P.clip(cur,"signal",2.4));
    o.push(S.D(P.X(30),P.Y(_W24_SPEC),"gold",4));o.push(S.T(P.X(30)+6,P.Y(_W24_SPEC)+13,"仕様: 30° で 41","start",8.5,"gold",true,false,null,true));
    o.push(S.L(P.X(ev.get()),P.y,P.X(ev.get()),P.y+P.h,"ink",1,"2 3"));o.push(S.D(P.X(ev.get()),P.Y(Math.max(20,Math.min(56,cne))),"ink",3.6));
    sats.forEach(function(q){if(q.el>2){var v=_w24_cn0(q.el,c,U);if(v>=20&&v<=56)o.push(S.D(P.X(q.el),P.Y(v),cls(v),2.6));}});
    var ly=nar?P.y+P.h+44:P.y+P.h+42;
    o.push(S.LEGL(nar?10:250,ly,[["signal",null,"いまの設計"],["faint","5 3","本文の設計"]],9,12));
    o.push(S.T(nar?10:250,ly+16,"点の色: 緑 41 以上・金 35〜41・紫 25〜35・赤 25 未満","start",8.5,"muted"));
    box.set(S.svg(Wd,ly+24,o));
    var m=cn30-_W24_SPEC;
    ro.innerHTML="システム雑音温度 "+_w24_f(t.ts,1)+" K（雑音指数 "+_w24_f(10*Math.log10(1+(t.ts-100)/290),2)+" dB）、N<sub>0</sub> "+_w24_f(n0,2)+" dBm/Hz<br>"+
      "仰角 30° の C/N<sub>0</sub> <b>"+_w24_f(cn30,2)+" dB-Hz</b>、仕様 41 dB-Hz に対する余裕 "+(m>=0?'<span class="ok">'+_w24_f(m,1)+" dB</span>":'<span class="warn">'+_w24_f(m,1)+" dB（仕様を割る）</span>")+
      "、仰角 "+ev.get()+"° で "+_w24_f(cne,2)+" dB-Hz<br>見えている "+sats.length+" 機のうち、41 以上 "+nOK+" 機・捕捉の目安 35 以上 "+nA+" 機・追尾の目安 25 以上 "+nT+" 機"+
      (c.ant!=="active"&&c.case?"（筐体による右旋の損失 "+_w24_f(_w24_caseLoss(c.case===2,U),2)+" dB）":"");
  }
  sync();draw();
};


/* =====================================================================
   w24_power: 記録の間隔・省電力の方式・1 日の過ごし方で、電池の持ち時間と TTFF が変わる
   ===================================================================== */
REG.w24_power=function(el,U){
  var S=U.S;
  U.head(el,"POWER","記録の間隔・方式・1 日の過ごし方と、1 日の電流の並び・電池の持ち時間");
  var r1=U.ctrls(el);
  var md=U.select(r1,"方式",[{v:"p",t:"周期的に起きる（本文）"},{v:"c",t:"連続（追尾を続ける）"}],"p",function(){sync();draw();});
  var tu=U.slider(r1,"記録の間隔",{values:[10,20,30,60,120,300,600,1800,3600],value:60,fmt:function(v){return v<60?v+" s":(v<3600?v/60+" 分":"1 時間");},onInput:function(){draw();}});
  var dy=U.select(r1,"1 日の過ごし方",[{v:"ex",t:"例の 1 日（屋外 8 時間）"},{v:"out",t:"ずっと屋外"},{v:"two",t:"屋外 2 時間"},{v:"in",t:"ずっと屋内"}],"ex",function(){draw();});
  var r2=U.ctrls(el);
  var bo=U.checkbox(r2,"位置が出ないとき、起きる間隔を 2 倍ずつ延ばす（上限 30 分）",true,function(){draw();});
  var up=U.slider(r2,"位置が出てから記録までに待つ組",{values:[1,2,3,4,5],value:3,fmt:function(v){return v+" 組"+(v===3?"（15 章の UP_N）":"");},onInput:function(){draw();}});
  var wf=U.slider(r2,"測位を待つ上限",{values:[15,30,45,60,90],value:45,fmt:function(v){return v+" s";},onInput:function(){draw();}});
  var bt=U.select(r2,"電池",[{v:"1000",t:"1000 mAh"},{v:"2000",t:"2000 mAh（本文）"},{v:"3000",t:"3000 mAh"}],"2000",function(){draw();});
  var br=U.btnrow(el);
  function set(o){md.set(o.md||"p");tu.set(o.tu||60);dy.set(o.dy||"ex");bo.set(o.bo!==false);up.set(o.up||3);wf.set(o.wf||45);bt.set("2000");sync();draw();}
  U.button(br,"本文の例",function(){set({});});
  U.button(br,"起きる間隔を延ばさない",function(){set({bo:false});});
  U.button(br,"ずっと屋外",function(){set({dy:"out"});});
  U.button(br,"上限 30 s（ウォームが間に合わない）",function(){set({wf:30});});
  U.button(br,"連続",function(){set({md:"c"});});
  var box=U.svgbox(el),ro=U.readout(el);
  function sync(){var c=md.get()==="c";bo.el.style.display=c?"none":"";up.el.style.display=c?"none":"";wf.el.style.display=c?"none":"";}
  function draw(){
    var nar=_w24_nar(box),Wd=nar?400:700,o=[],cont=md.get()==="c",out=_W24_DAYS[dy.get()];
    var p={};for(var k in _W24_P)p[k]=_W24_P[k];
    p.Tu=tu.get()*1000;p.backoff=bo.get();p.UPN=up.get();p.WAIT_FIX=wf.get()*1000;p.Qb=+bt.get();
    var r=cont?_w24_cont(p,out):_w24_day(p,out),x0=nar?44:62,pw=Wd-x0-16;
    /* (a) 1 日の電荷を足していく */
    o.push(S.T(10,16,"(a) 1 日に使う電荷（2 日目の 0 時から足していく）","start",nar?10:11,"ink",true));
    var tot=r.tot,ymax=Math.max(10,Math.ceil(tot/10)*10),P=U.plot(x0,30,pw,110,[0,24],[0,ymax]);
    out.forEach(function(q){o.push(S.RECT(P.X(q[0]/_W24_H),P.y,P.X(q[1]/_W24_H)-P.X(q[0]/_W24_H),P.h,0,U.soft("green"),"none",0));});
    o.push(P.axes({xl:"時刻 [時]",yl:"電荷 [mAh]",xt:[0,6,12,18,24],yt:U.nice(0,ymax,4),sz:9,ylOff:nar?32:38}));
    if(cont){var pts=[[0,0]],q=0,prev=0;
      for(var h=0;h<=24;h+=0.05){var I=(_w24_outdoor(h*_W24_H,out)?p.I_TRK:p.I_ACQ)+p.I_LNA+p.I_MCU+p.I_AON;q+=I*(h-prev);prev=h;pts.push([h,q]);}
      o.push(P.line(pts,"gold",2));}
    else{var pts2=[[0,0]],q2=0,last=86400000,Ioff=p.I_BK+p.I_SLP+p.I_AON;
      r.wakes.forEach(function(x){q2+=Ioff*(x[0]-last)/3.6e6;pts2.push([(x[0]-86400000)/_W24_H,q2]);
        var c=x[4]!==null?p.I_ACQ*(x[4]-x[0])+p.I_TRK*(x[1]-x[4]):p.I_ACQ*(x[1]-x[0]);q2+=(c+(p.I_LNA+p.I_MCU+p.I_AON)*(x[1]-x[0]))/3.6e6;pts2.push([(x[1]-86400000)/_W24_H,q2]);last=x[1];});
      q2+=Ioff*(2*86400000-last)/3.6e6;pts2.push([24,q2]);o.push(P.line(pts2,"gold",2));
      r.wakes.forEach(function(x){var c=x[3]?(x[2]==="warm"?"gold":"green"):"alias",xx=P.X((x[0]-86400000)/_W24_H);o.push(S.L(xx,P.y+P.h+(x[3]?-6:-12),xx,P.y+P.h,c,1));});}
    o.push(S.T(P.x+P.w-2,P.y+12,_w24_f(tot,1)+" mAh/日","end",9.5,"gold",true,false,null,true));
    /* (b) 内訳と電池の日数 */
    var yb=P.y+P.h+56;
    o.push(S.T(10,yb,"(b) 1 日の内訳と電池の持ち時間（仕様 30 日以上）","start",nar?10:11,"ink",true));
    var items=cont?[["連続の受信（屋外 25 mA・屋内 35 mA）",r.tot,"signal"],["自己放電",r.sd,"muted"]]:
      [["屋外で記録（ホット）",r.q.hot,"green"],["受け直す（ウォーム）",r.q.warm,"gold"],["屋内で探して止める",r.q.fail,"alias"],["眠っている間",r.slp,"purple"],["自己放電",r.sd,"muted"]];
    var all=r.tot+r.sd,xx=10,bwid=Wd-20;
    items.forEach(function(it){var w=bwid*it[1]/all;o.push(S.RECT(xx,yb+10,Math.max(w,0.8),18,1,U.soft(it[2]),it[2],1));xx+=w;});
    items.forEach(function(it,i){var col=nar?1:2,cxp=10+(i%col)*((Wd-20)/col),cyp=yb+46+Math.floor(i/col)*15;
      o.push(S.RECT(cxp,cyp-9,9,9,2,U.soft(it[2]),it[2],1));o.push(S.T(cxp+14,cyp,it[0]+" "+_w24_f(it[1],2)+" mAh","start",9,"ink"));});
    var yd=yb+46+Math.ceil(items.length/(nar?1:2))*15+16,D=U.plot(10,yd,Wd-90,16,[0,90],[0,1]);
    o.push(S.RECT(D.x,yd,D.w,16,2,"var(--screen)","line",0.8));
    o.push(S.RECT(D.x,yd,Math.max(1,D.X(Math.min(r.days,90))-D.x),16,2,U.soft(r.days>=30?"green":"alias"),r.days>=30?"green":"alias",1.2));
    o.push(S.L(D.X(30),yd-4,D.X(30),yd+20,"gold",1.5,"4 3"));
    [0,30,60,90].forEach(function(v){o.push(S.T(D.X(v),yd+31,v+" 日","middle",8.5,"muted"));});
    o.push(S.T(D.x+D.w+6,yd+12,_w24_f(r.days,1)+" 日","start",10,r.days>=30?"green":"alias",true));
    box.set(S.svg(Wd,yd+40,o));
    /* 読み出し */
    var h="平均の電流 <b>"+_w24_f(all/24,3)+" mA</b>（自己放電を含む）、"+bt.get()+" mAh の電池で <b>"+_w24_f(r.days,1)+" 日</b> "+(r.days>=30?'<span class="ok">仕様を満たす</span>':'<span class="warn">仕様（30 日）を割る</span>')+"<br>";
    if(cont){var oh=0;out.forEach(function(q){oh+=(q[1]-q[0])/_W24_H;});h+="モジュールは入れたまま。記録 "+Math.round(oh*3600/tu.get())+" 件/日。位置が出ている間の待ちは無い";}
    else{var nh=0,nw=0,nf=0,first=[];r.wakes.forEach(function(x){if(!x[3])nf++;else if(x[2]==="warm")nw++;else nh++;});
      out.forEach(function(q){var t0=86400000+q[0],f=null;r.wakes.forEach(function(x){if(x[3]&&x[0]>=t0&&f===null)f=x[0];});if(f!==null&&q[1]-q[0]<24*_W24_H)first.push((f-t0)/60000);});
      var tr=(p.T_HOT+1000*(p.UPN-1)+150)/1000;
      h+="1 日に起きる回: ホットで記録 "+nh+" 回・ウォームで記録 "+nw+" 回・位置が出ない "+nf+" 回。起きてから記録まで: ホット "+_w24_f(tr,2)+" s（TTFF 2 s）・ウォーム "+_w24_f(tr+28,2)+" s（TTFF 30 s）";
      if(first.length)h+="<br>外に出てから最初の記録まで: "+first.map(function(v){return _w24_f(v,v<10?1:0)+" 分";}).join("・");
      if(nh+nw===0&&out.length)h+='<br><span class="warn">屋外でも一度も記録できない（測位を待つ上限が、ウォームスタートの 30 s と組を待つ時間より短い）</span>';}
    ro.innerHTML=h;
  }
  sync();draw();
};


/* =====================================================================
   w24_check: 回路とファームウェアの選び方で、仕様の表の各行の設計の値と判定が変わる
   ===================================================================== */
REG.w24_check=function(el,U){
  var S=U.S;
  U.head(el,"SPEC CHECK","設計の選び方と、仕様の表の各行の判定（1 節の表の 10 行）");
  var r1=U.ctrls(el);
  var an=U.select(r1,"アンテナ",[{v:"patch",t:"パッチ（右旋）"},{v:"chip",t:"チップ（直線偏波）"}],"patch",function(){draw();});
  var ln=U.select(r1,"LNA",[{v:"1",t:"あり"},{v:"0",t:"なし"}],"1",function(){draw();});
  var cs=U.select(r1,"筐体のアンテナ",[{v:"2",t:"共振を 5 MHz 上げたもの"},{v:"1",t:"合わせないもの"}],"2",function(){draw();});
  var lc=U.select(r1,"充電の回路の後の LC フィルタ",[{v:"1",t:"あり"},{v:"0",t:"なし"}],"1",function(){draw();});
  var bk=U.select(r1,"バックアップ電源",[{v:"1",t:"いつも給電"},{v:"0",t:"なし（主の電源と一緒に切れる）"}],"1",function(){draw();});
  var r2=U.ctrls(el);
  var sy=U.select(r2,"衛星系",[{v:"1",t:"GPS"},{v:"2",t:"GPS + GLONASS"},{v:"3",t:"+ Galileo"},{v:"4",t:"4 つ（+ BeiDou）"}],"4",function(){draw();});
  var se=U.select(r2,"出す文",[{v:"0",t:"GGA と RMC だけ"},{v:"1",t:"初めの 6 種類（GSA・GSV など）"}],"0",function(){draw();});
  var bd=U.select(r2,"ボーレート",[{v:"9600",t:"9600 bit/s"},{v:"38400",t:"38 400 bit/s"},{v:"115200",t:"115 200 bit/s"}],"9600",function(){draw();});
  var ts=U.select(r2,"記録に付ける時刻",[{v:"0",t:"組の時刻の欄"},{v:"1",t:"組を受け終えたマイコンの時刻"}],"0",function(){draw();});
  var bo=U.select(r2,"位置が出ないとき",[{v:"1",t:"起きる間隔を延ばす"},{v:"0",t:"延ばさない"}],"1",function(){draw();});
  var r3=U.ctrls(el);
  var bt=U.select(r3,"電池",[{v:"1000",t:"1000 mAh"},{v:"2000",t:"2000 mAh"},{v:"3000",t:"3000 mAh"}],"2000",function(){draw();});
  var fl=U.select(r3,"フラッシュ",[{v:"4",t:"4 MB"},{v:"8",t:"8 MB"},{v:"16",t:"16 MB"}],"8",function(){draw();});
  var br=U.btnrow(el);
  function set(o){an.set(o.an||"patch");ln.set(o.ln||"1");cs.set(o.cs||"2");lc.set(o.lc||"1");bk.set(o.bk||"1");sy.set(o.sy||"4");se.set(o.se||"0");bd.set(o.bd||"9600");ts.set(o.ts||"0");bo.set(o.bo||"1");bt.set(o.bt||"2000");fl.set(o.fl||"8");draw();}
  U.button(br,"本文の設計（仕上げた後）",function(){set({});});
  U.button(br,"仕上げる前（LC フィルタなし）",function(){set({lc:"0"});});
  U.button(br,"初めの文のまま 4 つの衛星系",function(){set({se:"1"});});
  U.button(br,"GPS だけ・LNA なし",function(){set({sy:"1",ln:"0"});});
  U.button(br,"よくある失敗（届いた時刻・バックアップなし）",function(){set({ts:"1",bk:"0"});});
  var box=U.svgbox(el),tb=U.mk("div");el.appendChild(tb);var ro=U.readout(el);
  function rows(){
    var n=+sy.get(),acc=_w24_acc(U,n),c={ant:an.get(),lna:ln.get()==="1",saw:"after",line:2,cable:3,case:+cs.get(),att:0};
    var cn=_w24_cn0(30,c,U),drop=_w24_drop(lc.get()==="1"?_w24_af(2e6):0),nb=_w24_nbytes(n,se.get()==="1"),baud=+bd.get(),load=10*nb/baud;
    var p={};for(var k in _W24_P)p[k]=_W24_P[k];p.backoff=bo.get()==="1";p.Qb=+bt.get();if(ln.get()!=="1")p.I_LNA=0;if(bk.get()!=="1")p.T_EPH=0;
    var day=_w24_day(p,_W24_DAYS.ex),stor=(+fl.get())*1048576/32/1440;
    var tdel=0.12+10*141/baud;   /* 位置の遅れ: 計算の時間 0.12 s（13 章 3 節の例）+ RMC を受け終えるまで */
    var r95=acc.k*_W24_UERE,str=100*acc.street,tt=bk.get()==="1"?2:30,tm=ts.get()==="0"?10.5e-9:tdel;
    return [
      ["1 開けた空の精度","R95 10 m 以下",_w24_f(r95,1)+" m",10-r95,_w24_f(10-r95,1)+" m",(10-r95)/10],
      ["2 通りで位置が出る割合","90 % 以上",_w24_f(str,0)+" %",str-90,_w24_f(str-90,0)+" ポイント",(str-90)/90],
      ["3 TTFF（ホット）","5 s 以下",tt+" s"+(tt>5?"（毎回 30 s 探す）":""),5-tt,_w24_f(5-tt,0)+" s",(5-tt)/5],
      ["4 受信の強さ（30°）","41 dB-Hz 以上",_w24_f(cn,1)+" dB-Hz",cn-41,_w24_f(cn-41,1)+" dB",(cn-41)/12],
      ["5 充電しながらの記録","下がり 0.5 dB 以下",_w24_f(drop,2)+" dB",0.5-drop,_w24_f(0.5-drop,2)+" dB",(0.5-drop)/0.5],
      ["6 記録の時刻","UTC との差 1 ms 以下",tm<1e-6?"約 10 ns":_w24_f(tm,2)+" s（位置の遅れ）",1e-3-tm,tm<1e-6?"約 1 ms":_w24_f((1e-3-tm)*1000,0)+" ms",tm<1e-3?1:-1],
      ["7 最短の記録の間隔","1 s",_w24_f(load*100,1)+" %・1 回 "+nb+" B",(load<1&&nb<=1024)?1:-1,_w24_f((1-load)*100,1)+" ポイント",(load<1&&nb<=1024)?(1-load):-(load-1)-0.01],
      ["8 記録できる量","90 日分以上",_w24_f(stor,0)+" 日分",stor-90,_w24_f(stor-90,0)+" 日分",(stor-90)/90],
      ["9 電池の持ち時間","30 日以上",_w24_f(day.days,1)+" 日",day.days-30,_w24_f(day.days-30,1)+" 日",(day.days-30)/30],
      ["10 大きさ・防水","80 × 55 × 25 mm 以下",  "78 × 52 × 22 mm",1,"2・3・3 mm",0.1]];}
  function draw(){
    var R=rows(),nar=_w24_nar(box),Wd=nar?400:700,o=[],x0=nar?150:200,bw=Wd-x0-70;
    o.push(S.T(10,16,"余裕（仕様の値との差を、仕様の値で割って描いた。右へ伸びるほど余裕がある）","start",nar?9:10,"ink",true));
    var X=function(v){return x0+bw/2+Math.max(-1,Math.min(1,v))*bw/2;};
    o.push(S.L(X(0),24,X(0),24+R.length*22,"ink",1.2));
    R.forEach(function(r,i){var y=28+i*22,ok=r[3]>=0,col=ok?"green":"alias";
      o.push(S.T(x0-8,y+12,r[0],"end",nar?8.5:9.5,"ink",true));
      o.push(S.RECT(Math.min(X(0),X(r[5])),y+2,Math.max(1,Math.abs(X(r[5])-X(0))),14,2,U.soft(col),col,1));
      o.push(S.T(Wd-8,y+13,ok?"○":"×","end",11,col,true));});
    box.set(S.svg(Wd,32+R.length*22,o));
    tb.innerHTML=U.tbl(["項目","仕様","設計の値","余裕","判定"],R.map(function(r){var ok=r[3]>=0;
      return [r[0],r[1],r[2],ok?r[4]:"—",r[0].indexOf("10 ")===0?"大きさは ○、防水は試験":(ok?'<span class="ok">○</span>':'<span class="warn">×</span>')];}),["left","left","left","right","center"]);
    var bad=R.filter(function(r){return r[3]<0;}).map(function(r){return r[0].split(" ")[0];});
    ro.innerHTML=bad.length?'<span class="warn">仕様を割る行: '+bad.join("・")+" 行目</span>。その値を決めた節に戻って直す":'<span class="ok">全部の行が仕様を満たす</span>（防水は 23 章の試験の計画で確かめる）';
  }
  draw();
};
