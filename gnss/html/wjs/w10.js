/* ===== 10 章 モジュールの回路 — 電源・バックアップ・1PPS・通信 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w10_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w10_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 3 桁ごとに空白を入れた整数（115 200 など） */
function _w10_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
var _W10_CN0=47.5,_W10_L1=1575.42,_W10_HB=1.023;
/* 例のモデルの PSRR [dB] = 20 log10 |1 + A0/(1 + j f/fp)|（図の _f10_psrr と同じ） */
function _w10_psrr(f,a0db,fp){var a0=Math.pow(10,a0db/20),x=f/fp,d=1+x*x;return 20*Math.log10(Math.hypot(1+a0/d,-a0*x/d));}
var _W10_INT=[40,20e3],_W10_EXT=[60,10e3];
/* 揺れ vr [mVpp]・周波数 f [Hz]・LDO の有無・感度 v1 [mVpp] → 各段の値 */
function _w10_model(vr,f,ldo,v1){var pe=_w10_psrr(f,_W10_EXT[0],_W10_EXT[1]),pi=_w10_psrr(f,_W10_INT[0],_W10_INT[1]),att=pi+(ldo?pe:0),
    vp=vr*Math.pow(10,-(ldo?pe:0)/20),v=vr*Math.pow(10,-att/20),q=(v/v1)*(v/v1);
  return {pe:pe,pi:pi,att:att,vp:vp,v:v,q:q,drop:10*Math.log10(1+q),cn0:_W10_CN0-10*Math.log10(1+q)};}
function _w10_hz(v){if(v>=1e6)return _w10_f(v/1e6,v<1e7?2:1).replace(/\.?0+$/,"")+" MHz";if(v>=1e3)return _w10_f(v/1e3,v<1e4?2:(v<1e5?1:0)).replace(/\.0+$/,"")+" kHz";return _w10_f(v,0)+" Hz";}
function _w10_mv(v){return (v>=100?_w10_f(v,0):(v>=10?_w10_f(v,1):(v>=1?_w10_f(v,2):(v>=0.01?_w10_f(v,3):v.toExponential(1).replace("-","−")))))+" mVpp";}

/* ---- 2 節: 電源の雑音の道と C/N0（例のモデル） ---- */
REG.w10_supply=function(el,U){
  var S=U.S;
  U.head(el,"SUPPLY NOISE","電源の雑音と C/N0 — どの道で小さくなり、どこで頭打ちになるか（例のモデル）");
  var r1=U.ctrls(el);
  var fr=U.slider(r1,"雑音の周波数 f（スイッチング周波数）",{min:1e3,max:1e7,log:true,value:2e6,fmt:_w10_hz,onInput:function(){draw();}});
  var vr=U.slider(r1,"スイッチング電源の出力の揺れ",{min:1,max:300,log:true,value:20,fmt:_w10_mv,onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var ldo=U.checkbox(r2,"外付けの LDO を入れる",false,function(){draw();});
  var v1=U.slider(r2,"RF の段の感度 v<sub>1</sub>（例のモデル）",{min:0.3,max:3,step:0.1,value:1,fmt:function(v){return _w10_f(v,1)+" mVpp";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function setAll(f,v,l){fr.set(f);vr.set(v);ldo.set(l);v1.set(1);draw();}
  U.button(br,"本文の例: 2 MHz・LDO なし",function(){setAll(2e6,20,false);});
  U.button(br,"2 MHz・LDO あり",function(){setAll(2e6,20,true);});
  U.button(br,"500 kHz・LDO あり",function(){setAll(5e5,20,true);});
  var box=U.svgbox(el),ro=U.readout(el);
  function verdict(c){return c>=47?["ほとんど下がらない（頭打ち）","green"]:(c>=35?["捕捉もできる（目安 30〜35 dB-Hz 以上）","green"]:(c>=25?["追尾は続くが、捕捉が難しくなる","gold"]:["追尾の目安 25 dB-Hz を下回る","alias"]));}
  function draw(){
    var f=fr.get(),v=vr.get(),l=ldo.get(),s1=v1.get(),m=_w10_model(v,f,l,s1),nar=_w10_nar(box),Wd=nar?400:700,o=[];
    var vd=verdict(m.cn0);
    /* (a) 道 1 の各段 */
    o.push(S.T(nar?6:14,16,"(a) 道 1: 電源の線（各段の揺れと PSRR）","start",11,"ink",true));
    var items=[["スイッチング電源",_w10_mv(v),"alias"],["外付けの LDO",l?"−"+_w10_f(m.pe,1)+" dB":"（なし）","purple"],["電源の端子",_w10_mv(m.vp),"muted"],
      ["中の電源の回路","−"+_w10_f(m.pi,1)+" dB","purple"],["RF の段",_w10_mv(m.v),"signal"],["N_p/N_0",(m.q>=100?_w10_f(m.q,0):(m.q>=0.01?String(+m.q.toPrecision(3)):m.q.toExponential(1).replace("-","−"))),"teal"],
      ["C/N_0",_w10_f(m.cn0,1)+" dB-Hz",vd[1]]];
    var bw=nar?88:88,gap=nar?11:12,perRow=nar?4:7,y0=26,bh=40;
    items.forEach(function(it,i){var row=Math.floor(i/perRow),col=i%perRow,x=(nar?6:6)+col*(bw+gap),y=y0+row*(bh+16);
      var dash=(i===1&&!l)?"4 3":null;
      o.push(S.RECT(x,y,bw,bh,6,U.soft(it[2]),it[2],1.2,dash));
      o.push(S.TX(x+bw/2,y+16,it[0],"middle",9.5,"ink",true));
      o.push(S.T(x+bw/2,y+32,it[1],"middle",9.5,it[2],true));
      if(i<items.length-1){if(col<perRow-1)o.push(S.ARR(x+bw,y+bh/2,x+bw+gap,y+bh/2,"alias",1.4,6));
        else o.push(S.PATH("M"+(x+bw/2)+","+(y+bh)+" v8 H"+(6+bw/2)+" v6",  "alias",1.4));}});
    var ya=y0+(nar?2*(bh+16):bh+16)+6;
    /* (b) PSRR と (c) C/N0 */
    var P,Q,yb=ya+8;
    if(nar){P=U.plot(48,yb+16,330,140,[1e3,1e7],[0,100],{xlog:true});Q=U.plot(48,yb+16+140+68,330,140,[1,300],[15,50],{xlog:true});}
    else{P=U.plot(60,yb+16,260,160,[1e3,1e7],[0,100],{xlog:true});Q=U.plot(420,yb+16,256,160,[1,300],[15,50],{xlog:true});}
    o.push(S.T(nar?6:14,yb+4,"(b) PSRR（例のモデル）","start",11,"ink",true));
    o.push(P.axes({xl:"雑音の周波数 f [Hz]",yl:"PSRR [dB]",xt:[1e3,1e4,1e5,1e6,1e7],yt:[0,20,40,60,80,100],xfmt:function(v){return {1000:"1 k",10000:"10 k",100000:"100 k",1000000:"1 M",10000000:"10 M"}[v]||"";},sz:9}));
    var fs=U.ctl.logspace(3,7,160);
    o.push(P.clip(fs.map(function(x){return [x,_w10_psrr(x,_W10_INT[0],_W10_INT[1])];}),"purple",1.8,"2 3"));
    o.push(P.clip(fs.map(function(x){return [x,_w10_psrr(x,_W10_EXT[0],_W10_EXT[1])];}),l?"signal":"faint",1.8,"6 3"));
    o.push(P.clip(fs.map(function(x){return [x,_w10_psrr(x,_W10_INT[0],_W10_INT[1])+(l?_w10_psrr(x,_W10_EXT[0],_W10_EXT[1]):0)];}),"green",2.4));
    o.push(S.L(P.X(f),P.y,P.X(f),P.y+P.h,"ink",1,"3 3"));
    o.push(S.D(P.X(f),P.Y(Math.min(100,m.att)),"green",4.5));
    o.push(S.T(P.X(f)+(P.X(f)>P.x+P.w-60?-6:6),Math.max(P.y+12,P.Y(Math.min(100,m.att))-7),_w10_f(m.att,1)+" dB",P.X(f)>P.x+P.w-60?"end":"start",9.5,"green",true,false,null,true));
    o.push(S.LEGL(P.x-40,P.y+P.h+(nar?44:46),[["green",null,"合わせた値"],[l?"signal":"faint","6 3","LDO"],["purple","2 3","中の回路"]],9,10));
    var qx=nar?6:372;
    o.push(S.TX(qx,(nar?Q.y-12:yb+4),"(c) 揺れの大きさと C/N_0（いまの f と LDO）","start",11,"ink",true));
    o.push(Q.axes({xl:"スイッチング電源の出力の揺れ [mVpp]",yl:"C/N_0 [dB-Hz]",xt:[1,10,100],yt:[15,20,25,30,35,40,45,50],xfmt:function(v){return String(v);},sz:9}));
    o.push(S.RECT(Q.x,Q.Y(35),Q.w,Q.Y(30)-Q.Y(35),0,U.soft("gold"),"none",0));
    o.push(S.T(Q.x+4,Q.Y(35)+12,"捕捉の目安 30〜35","start",9,"gold",true,false,null,true));
    o.push(S.L(Q.x,Q.Y(25),Q.x+Q.w,Q.Y(25),"alias",1,"4 3"));
    o.push(S.T(Q.x+Q.w-4,Q.Y(25)+12,"追尾の目安 25","end",9,"alias",true,false,null,true));
    o.push(S.L(Q.x,Q.Y(_W10_CN0),Q.x+Q.w,Q.Y(_W10_CN0),"green",1,"5 3"));
    o.push(S.T(Q.x+4,Q.Y(_W10_CN0)-5,"頭打ち 47.5","start",9,"green",true,false,null,true));
    var vs=U.ctl.logspace(0,Math.log10(300),120);
    o.push(Q.clip(vs.map(function(x){return [x,_w10_model(x,f,!l,s1).cn0];}),"faint",1.6,"5 3"));
    o.push(Q.clip(vs.map(function(x){return [x,_w10_model(x,f,l,s1).cn0];}),vd[1],2.4));
    o.push(S.D(Q.X(v),Q.Y(Math.max(15,m.cn0)),vd[1],5));
    o.push(S.T(Q.X(v)+(Q.X(v)>Q.x+Q.w-70?-7:7),Math.max(Q.y+14,Q.Y(Math.max(15,m.cn0))+(m.cn0>40?16:-7)),_w10_f(m.cn0,1),Q.X(v)>Q.x+Q.w-70?"end":"start",9.5,vd[1],true,false,null,true));
    o.push(S.LEGL(Q.x-40,Q.y+Q.h+(nar?44:46),[[vd[1],null,l?"LDO あり（いま）":"LDO なし（いま）"],["faint","5 3",l?"LDO なし":"LDO あり"]],9,10));
    /* (d) 道 2: L1 の近くの高調波 */
    var yd=Q.y+Q.h+(nar?62:66),fM=f/1e6,lo=_W10_L1-3,hi=_W10_L1+3,R=U.plot(nar?20:150,yd+18,nar?360:520,34,[lo,hi],[0,1]);
    o.push(S.T(nar?6:14,yd+6,"(d) 道 2: L1 の近くの高調波（f の整数倍）","start",11,"ink",true));
    o.push(S.RECT(R.X(_W10_L1-_W10_HB),R.y,R.X(_W10_L1+_W10_HB)-R.X(_W10_L1-_W10_HB),R.h,0,U.soft("signal"),"none",0));
    o.push(S.L(R.x,R.y+R.h,R.x+R.w,R.y+R.h,"muted",1.1));
    var n0=Math.ceil(lo/fM),n1=Math.floor(hi/fM),nin=[],dense=(n1-n0)>120;
    if(dense){o.push(S.RECT(R.x,R.y+8,R.w,R.h-8,0,U.soft("alias"),"alias",0.8));o.push(S.T(R.x+R.w/2,R.y+24,"高調波が "+_w10_f(fM*1e3,fM<0.01?1:0)+" kHz おきに密に並ぶ","middle",9,"alias",true,false,null,true));
      for(var n=Math.ceil((_W10_L1-_W10_HB)/fM);n<=Math.floor((_W10_L1+_W10_HB)/fM);n++)nin.push(n);}
    else for(var k=n0;k<=n1;k++){var fh=k*fM,inb=Math.abs(fh-_W10_L1)<=_W10_HB;if(inb)nin.push(k);
      o.push(S.L(R.X(fh),R.y+R.h,R.X(fh),R.y+5,inb?"alias":"muted",inb?2.2:1.3));}
    o.push(S.L(R.X(_W10_L1),R.y,R.X(_W10_L1),R.y+R.h,"signal",1,"3 3"));
    [-3,-2,-1,0,1,2,3].forEach(function(d){var x=R.X(_W10_L1+d);o.push(S.L(x,R.y+R.h,x,R.y+R.h+4,"muted",1));o.push(S.T(x,R.y+R.h+15,d===0?"L1":(d>0?"+":"−")+Math.abs(d),"middle",9,"muted"));});
    o.push(S.T(R.x+R.w/2,R.y+R.h+29,"L1 からの周波数の差 [MHz]（青い帯は主ローブ ±1.023 MHz）","middle",9.5,"muted"));
    if(!nar){o.push(S.T(14,R.y+16,"帯域に入る","start",9.5,nin.length?"alias":"green",true));o.push(S.T(14,R.y+30,nin.length+" 本","start",10,nin.length?"alias":"green",true));}
    box.set(S.svg(Wd,R.y+R.h+38,o));
    /* 読み出し */
    var h="PSRR: 外付けの LDO <b>"+(l?_w10_f(m.pe,1)+" dB":"なし")+"</b>、中の電源の回路 <b>"+_w10_f(m.pi,1)+" dB</b>、合わせて <b>"+_w10_f(m.att,1)+" dB</b>"+
      "（揺れは "+_w10_f(Math.pow(10,m.att/20),m.att>40?0:1)+" 分の 1）<br>";
    h+="RF の段に残る揺れ <b>"+_w10_mv(m.v)+"</b>、N<sub>p</sub>/N<sub>0</sub> = (v/v<sub>1</sub>)<sup>2</sup> = <b>"+(m.q>=0.01?String(+m.q.toPrecision(3)):m.q.toExponential(1).replace("-","−"))+"</b>、"+
      "C/N<sub>0</sub> は 47.5 dB-Hz から <b>"+_w10_f(m.drop,m.drop<0.1?2:1)+" dB</b> 下がって <b>"+_w10_f(m.cn0,1)+" dB-Hz</b>: <span class=\""+(vd[1]==="alias"?"warn":(vd[1]==="green"?"ok":""))+"\">"+vd[0]+"</span><br>";
    h+="道 2: L1 の主ローブに入る高調波 <b>"+nin.length+" 本</b>"+(nin.length?"（n = "+(nin.length>3?_w10_g(nin[0])+"〜"+_w10_g(nin[nin.length-1]):nin.map(_w10_g).join("・"))+"）。LDO では減らせない。強さは基板と置き方で決まる（20 章）":"。この f なら主ローブに落ちない")+
      (fM<2*_W10_HB&&nin.length?"。f が主ローブの幅 2.046 MHz より低いので、必ずどれかが入る":"");
    ro.innerHTML=h+'<div class="wnote">例のモデル: PSRR(f) = 20 log<sub>10</sub>|1 + A/(1 + j f/f<sub>p</sub>)|（外付けの LDO A = 60 dB・f<sub>p</sub> = 10 kHz、中の電源の回路 A = 40 dB・f<sub>p</sub> = 20 kHz）、N<sub>p</sub>/N<sub>0</sub> = (RF の段に残った揺れ ÷ v<sub>1</sub>)<sup>2</sup>。仕組みを見るための例の値で、実際の値は製品と基板で大きく違う（製品の資料の許容できるリップルで確かめる）。(c) の破線は、LDO の有無を逆にしたとき。</div>';
  }
  draw();
};

/* ---- 3 節: バックアップ電源の保持時間と、次のスタート ---- */
var _W10_TOFF=[60,300,600,1800,3600,7200,10800,14400,21600,43200,86400,172800,345600,604800,1209600,2592000,5184000,15552000,31536000];
function _w10_tstr(s){if(s<120)return _w10_f(s,0)+" s";if(s<3600)return _w10_f(s/60,0)+" 分";if(s<172800)return _w10_f(s/3600,s<36000?1:0).replace(/\.0$/,"")+" 時間";
  if(s<60*86400)return _w10_f(s/86400,s<864000?1:0).replace(/\.0$/,"")+" 日";if(s<2*365*86400)return _w10_f(s/2592000,1).replace(/\.0$/,"")+" か月";return _w10_f(s/31536000,1)+" 年";}
/* 電源を切っていた時間 t [s]・保持時間 th [s] → 次のスタート [名前, 色, 説明] */
function _w10_start(t,th){if(t>=th)return ["コールドスタート","alias","バックアップ電源が保てなくなり、時刻も軌道の情報も消えた"];
  if(t<7200)return ["ホットスタート","green","エフェメリスが有効（2〜4 時間。代表値）"];
  if(t<14400)return ["ホットかウォーム","green","エフェメリスが有効な時間（2〜4 時間。代表値）の境目のあたり"];
  if(t<1209600)return ["ウォームスタート","gold","エフェメリスは古いが、アルマナック・時刻・位置がある"];
  if(t<5184000)return ["ウォームかコールド","gold","アルマナックが使える時間（2 週間〜2 か月。代表値）の境目のあたり"];
  return ["コールドスタート","alias","アルマナックが古い"];}
REG.w10_backup=function(el,U){
  var S=U.S;
  U.head(el,"BACKUP SUPPLY","バックアップ電源の保持時間と、次に電源を入れたときのスタート");
  var r0=U.ctrls(el);
  var kind=U.seg(r0,["スーパーキャパシタ","コイン形の電池"],0,function(){sync();draw();});
  var rc=U.ctrls(el);
  var cap=U.slider(rc,"キャパシタの容量 C<sub>b</sub>",{min:0.01,max:2,log:true,value:0.2,fmt:function(v){return (v<0.1?_w10_f(v*1e3,0)+" mF":_w10_f(v,2).replace(/0$/,"")+" F");},onInput:function(){draw();}});
  var v0=U.slider(rc,"充電した電圧 V<sub>0</sub>",{min:2,max:3.3,step:0.05,value:3.0,fmt:function(v){return _w10_f(v,2)+" V";},onInput:function(){draw();}});
  var lk=U.slider(rc,"漏れ電流",{min:0,max:5,step:0.1,value:1,fmt:function(v){return _w10_f(v,1)+" µA";},onInput:function(){draw();}});
  var vm=U.slider(rc,"最低の電圧 V<sub>min</sub>",{min:1.4,max:2.5,step:0.05,value:1.65,fmt:function(v){return _w10_f(v,2)+" V";},onInput:function(){draw();}});
  var rb=U.ctrls(el);
  var qb=U.slider(rb,"電池の容量 Q<sub>b</sub>",{min:20,max:1000,step:10,value:220,fmt:function(v){return v+" mAh";},onInput:function(){draw();}});
  var sd=U.slider(rb,"自己放電（1 年に）",{min:0,max:5,step:0.1,value:1,fmt:function(v){return _w10_f(v,1)+" %";},onInput:function(){draw();}});
  var r3=U.ctrls(el);
  var ib=U.slider(r3,"バックアップの電流 I<sub>bk</sub>",{min:1,max:100,log:true,value:15,fmt:function(v){return _w10_f(v,v<10?1:0)+" µA";},onInput:function(){draw();}});
  var to=U.slider(r3,"電源を切っていた時間",{values:_W10_TOFF,value:3600,fmt:_w10_tstr,onInput:function(){draw();}});
  var br=U.btnrow(el);
  U.button(br,"本文の例（0.2 F）",function(){kind.set(0);cap.set(0.2);v0.set(3.0);lk.set(1);vm.set(1.65);ib.set(15);to.set(3600);sync();draw();});
  U.button(br,"本文の例（CR2032）",function(){kind.set(1);qb.set(220);sd.set(1);ib.set(15);to.set(604800);sync();draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function sync(){var c=kind.get()===0;rc.style.display=c?"":"none";rb.style.display=c?"none":"";}
  function hold(){var I=ib.get()*1e-6;
    if(kind.get()===0){var It=I+lk.get()*1e-6;return {th:cap.get()*Math.max(0,v0.get()-vm.get())/It,I:It};}
    var Isd=sd.get()/100*qb.get()*1e-3/8760,It2=I+Isd;return {th:qb.get()*1e-3*3600/It2,I:It2,Isd:Isd};}
  function draw(){
    var nar=_w10_nar(box),Wd=nar?400:700,o=[],c=kind.get()===0,hd=hold(),th=hd.th,t=to.get(),st=_w10_start(t,th);
    /* (a) 電圧（キャパシタ）か残り（電池）の時間の変化 */
    var tmax=Math.max(th*1.25,t*1.15),uh=tmax<2*86400?3600:(tmax<120*86400?86400:31536000),un=uh===3600?"時間":(uh===86400?"日":"年");
    var P=U.plot(nar?52:66,30,nar?330:262,160,[0,tmax/uh],c?[0,3.4]:[0,100]);
    o.push(S.T(nar?6:14,16,c?"(a) キャパシタの電圧":"(a) 電池の残り","start",11,"ink",true));
    o.push(P.axes({xl:"主の電源を切ってからの時間 ["+un+"]",yl:c?"電圧 v [V]":"残り [%]",yt:c?[0,1,2,3]:[0,25,50,75,100],sz:9}));
    if(c){o.push(S.L(P.x,P.Y(vm.get()),P.x+P.w,P.Y(vm.get()),"alias",1,"5 3"));
      o.push(S.TX(P.x+P.w-4,P.Y(vm.get())+13,"V_{min} "+_w10_f(vm.get(),2)+" V","end",9,"alias",true,true));
      var te=Math.min(th,tmax);o.push(P.line([[0,v0.get()],[te/uh,v0.get()-hd.I*te/cap.get()]],"green",2.4));
      if(th<tmax)o.push(P.line([[th/uh,vm.get()],[tmax/uh,Math.max(0,vm.get()-hd.I*(tmax-th)/cap.get())]],"faint",1.6,"4 3"));}
    else{o.push(P.line([[0,100],[Math.min(th,tmax)/uh,100*(1-Math.min(th,tmax)/th)]],"signal",2.4));}
    o.push(S.L(P.X(Math.min(th,tmax)/uh),P.y,P.X(Math.min(th,tmax)/uh),P.y+P.h,"purple",1,"3 3"));
    o.push(S.T(P.X(Math.min(th,tmax)/uh)-4,P.y+12,"保持時間 "+_w10_tstr(th),"end",9.5,"purple",true,false,null,true));
    var vt=c?Math.max(0,v0.get()-hd.I*t/cap.get()):Math.max(0,100*(1-t/th));
    o.push(S.L(P.X(t/uh),P.y,P.X(t/uh),P.y+P.h,st[1],1.6));
    o.push(S.D(P.X(t/uh),P.Y(c?Math.max(0,vt):vt),st[1],4.5));
    o.push(S.T(P.X(t/uh)+5,P.y+P.h-8,"切っていた時間","start",9,st[1],true,false,null,true));
    /* (b) 時間の帯（対数） */
    var bx=nar?6:372,by=nar?P.y+P.h+58:16,L=U.plot(nar?100:470,by+20,nar?290:214,120,[30,4e7],[0,1],{xlog:true}),X=L.X;
    o.push(S.T(bx,by,"(b) 次のスタート（代表値）","start",11,"ink",true));
    var rows=[["保つ間",by+26],["エフェメリス",by+52],["アルマナック",by+78],["スタート",by+104]];
    rows.forEach(function(r){o.push(S.T(L.x-8,r[1]+12,r[0],"end",9.5,"ink",true));});
    o.push(S.RECT(X(30),rows[0][1],Math.max(1,Math.min(X(4e7),X(Math.max(31,th)))-X(30)),16,3,U.soft("purple"),"purple",1.1));
    o.push(S.RECT(X(30),rows[1][1],X(7200)-X(30),16,3,U.soft("green"),"green",1));o.push(S.RECT(X(7200),rows[1][1],X(14400)-X(7200),16,3,"none","green",1,"3 2"));
    o.push(S.RECT(X(30),rows[2][1],X(1209600)-X(30),16,3,U.soft("gold"),"gold",1));o.push(S.RECT(X(1209600),rows[2][1],X(5184000)-X(1209600),16,3,"none","gold",1,"3 2"));
    [[30,7200,"ホット","green"],[14400,1209600,"ウォーム","gold"],[5184000,4e7,"コールド","alias"]].forEach(function(sg){var a=X(sg[0]),b=X(sg[1]);
      o.push(S.RECT(a,rows[3][1],b-a,16,3,U.soft(sg[3]),sg[3],1));if(b-a>34)o.push(S.T((a+b)/2,rows[3][1]+12,sg[2],"middle",9,sg[3],true));});
    o.push(S.L(X(Math.max(30,t)),by+20,X(Math.max(30,t)),by+124,st[1],2));
    [[60,"1 分"],[3600,"1 時間"],[86400,"1 日"],[2592000,"1 か月"],[31536000,"1 年"]].forEach(function(tk){o.push(S.L(X(tk[0]),by+122,X(tk[0]),by+126,"muted",1));o.push(S.T(X(tk[0]),by+137,tk[1],"middle",9,"muted"));});
    o.push(S.T(bx,by+160,"→ "+st[0],"start",11,st[1],true));
    o.push(S.T(bx,by+176,st[2],"start",9,"muted"));
    var Hh=nar?by+186:Math.max(P.y+P.h+44,by+186);
    box.set(S.svg(Wd,Hh,o));
    /* 読み出し */
    var h=c?"保持時間 t<sub>h</sub> = C<sub>b</sub>(V<sub>0</sub> − V<sub>min</sub>)/I = "+_w10_f(cap.get(),3).replace(/0+$/,"").replace(/\.$/,"")+" F × "+_w10_f(v0.get()-vm.get(),2)+" V ÷ "+_w10_f(hd.I*1e6,1)+" µA = <b>"+_w10_g(th)+" s（"+_w10_tstr(th)+"）</b><br>"
      :"保持時間 t<sub>h</sub> = Q<sub>b</sub>/I = "+qb.get()+" mAh ÷ （"+_w10_f(ib.get(),1)+" + 自己放電 "+_w10_f(hd.Isd*1e6,2)+"）µA = <b>"+_w10_g(th/3600)+" 時間（"+_w10_tstr(th)+"）</b><br>";
    var er=20e-6*t;h+="電源を切っていた時間 "+_w10_tstr(t)+"・そのときの"+(c?"電圧 "+_w10_f(vt,2)+" V":"残り "+_w10_f(vt,1)+" %")+"・RTC の誤差（20 ppm）"+(er<1?_w10_f(er*1000,er<0.01?2:0)+" ms":_w10_f(er,er<10?1:0)+" s")+"<br>";
    h+="次に電源を入れたとき: <b><span class=\""+(st[1]==="alias"?"warn":"ok")+"\">"+st[0]+"</span></b>（"+st[2]+"）";
    ro.innerHTML=h+'<div class="wnote">'+(c?"キャパシタは一定の電流で電圧が直線に下がる（漏れ電流を足した電流で計算）。V<sub>min</sub> を割ると、RTC とメモリが止まる。":"電池は自己放電を電流に直して足した（電源と周辺の制御シリーズ 3 章 5 節）。電圧は終わり近くまでほぼ一定なので、(a) は残りの割合で描いた。")+
      "スタートの境目（エフェメリス 2〜4 時間、アルマナック 2 週間〜2 か月）は代表値で、受信機によって違う。</div>";
  }
  sync();draw();
};

/* ---- 4 節: 出す文・更新レート・ボーレートと、データ量・負荷率 ---- */
var _W10_SATS={GP:[[5,45,123,47],[13,62,45,49],[15,30,210,44],[18,15,300,38],[20,72,280,50],[23,25,150,42],[24,40,330,45],[29,10,60,36],[30,5,250,null],[31,2,100,null]],
  GL:[[66,35,20,43],[67,55,110,46],[76,20,250,40],[77,48,300,44],[82,8,180,null],[83,3,140,null]],
  GA:[[2,40,70,45],[7,65,200,48],[8,22,320,41],[13,30,140,43],[26,50,260,46],[30,12,30,37],[33,4,190,null]],
  GB:[[6,55,190,42],[9,62,210,44],[16,48,170,43],[19,33,60,45],[20,70,320,47],[29,25,280,41],[35,15,110,38],[44,6,40,null]]};
/* 例の文の並び [[種類, 文（$ から CR LF まで）], …]（図の _f10_nmea と同じ作り方） */
function _w10_nmea(nsys,kinds){var talk=["GP","GL","GA","GB"].slice(0,nsys),used=talk.map(function(t){return _W10_SATS[t].filter(function(s){return s[3]!=null;}).map(function(s){return s[0];});}),nused=0;
  used.forEach(function(u){nused+=u.length;});
  function p2(v){return (v<10?"0":"")+v;} function p3(v){return (v<10?"00":(v<100?"0":""))+v;}
  var bodies=[];
  kinds.forEach(function(k){
    if(k==="GGA")bodies.push([k,"GNGGA,092750.00,3540.86000,N,13946.02000,E,1,"+p2(nused)+",0.80,3.3,M,36.7,M,,"]);
    else if(k==="RMC")bodies.push([k,"GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"]);
    else if(k==="GSA")used.forEach(function(u){var f=u.map(p2);while(f.length<12)f.push("");bodies.push([k,"GNGSA,A,3,"+f.join(",")+",1.50,0.80,1.27"]);});
    else if(k==="GSV")talk.forEach(function(t){var ss=_W10_SATS[t],nm=Math.ceil(ss.length/4);for(var m=0;m<nm;m++){var fl=[t+"GSV",String(nm),String(m+1),p2(ss.length)];
      ss.slice(4*m,4*m+4).forEach(function(s){fl.push(p2(s[0]),p2(s[1]),p3(s[2]),s[3]==null?"":p2(s[3]));});bodies.push([k,fl.join(",")]);}});
    else if(k==="VTG")bodies.push([k,"GNVTG,,T,,M,0.012,N,0.022,K,A"]);
    else if(k==="GLL")bodies.push([k,"GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A"]);});
  return bodies.map(function(b){var x=0;for(var i=0;i<b[1].length;i++)x^=b[1].charCodeAt(i);var hx=x.toString(16).toUpperCase();if(hx.length<2)hx="0"+hx;return [b[0],"$"+b[1]+"*"+hx+"\r\n"];});}
var _W10_KINDS=[["GGA","位置","signal"],["RMC","時刻・位置・速度","purple"],["GSA","使った衛星と DOP","green"],["GSV","見えている衛星","gold"],["VTG","速度","teal"],["GLL","緯度・経度","muted"]];
REG.w10_uart=function(el,U){
  var S=U.S;
  U.head(el,"UART LOAD","出す文・更新レート・ボーレートと、データ量・負荷率");
  var r1=U.ctrls(el),ck={};
  _W10_KINDS.forEach(function(k){ck[k[0]]=U.checkbox(r1,k[0]+"（"+k[1]+"）",true,function(){draw();});});
  var r2=U.ctrls(el);
  var sys=U.select(r2,"衛星系",["GPS","GPS + GLONASS","GPS + GLONASS + Galileo","GPS + GLONASS + Galileo + BeiDou"],1,function(){draw();});
  var rate=U.slider(r2,"更新レート（1 秒に出す回数。13 章で設定する）",{values:[1,2,4,5,10],value:1,fmt:function(v){return v+" 回/s";},onInput:function(){draw();}});
  var bauds=[4800,9600,19200,38400,57600,115200,230400,460800,921600];
  var baud=U.select(r2,"ボーレート",bauds.map(function(b){return {v:String(b),t:_w10_g(b)+" bit/s"};}),"9600",function(){draw();});
  var br=U.btnrow(el),show=false;
  U.button(br,"本文の例（GPS + GLONASS・1 回/s・9600 bit/s）",function(){_W10_KINDS.forEach(function(k){ck[k[0]].set(true);});sys.set(1);rate.set(1);baud.set("9600");draw();});
  U.button(br,"2 回/s にする",function(){rate.set(2);draw();});
  U.button(br,"5 回/s・115 200 bit/s",function(){rate.set(5);baud.set("115200");draw();});
  var sb=U.button(br,"例の文を見る",function(){show=!show;sb.textContent=show?"例の文を隠す":"例の文を見る";draw();});
  var box=U.svgbox(el),ro=U.readout(el),pre=U.mk("div","wnote");el.appendChild(pre);
  function draw(){
    var kinds=_W10_KINDS.map(function(k){return k[0];}).filter(function(k){return ck[k].get();}),ns=sys.get()+1,ss=_w10_nmea(ns,kinds),
      tot=0;ss.forEach(function(s){tot+=s[1].length;});
    var R=rate.get(),B=parseInt(baud.get(),10),D=tot*R,load=10*D/B,burst=tot*10/B,nar=_w10_nar(box),Wd=nar?400:700,o=[];
    var bad=load>1;
    /* (a) 1 回に出す文のバイト数 */
    o.push(S.T(nar?6:14,16,"(a) 1 回に出す文: "+ss.length+" 文・"+tot+" バイト","start",11,"ink",true));
    var x0=nar?6:14,ww=nar?388:672,sc=ww/Math.max(1200,tot),xx=x0;
    _W10_KINDS.forEach(function(k){var ls=ss.filter(function(s){return s[0]===k[0];}).map(function(s){return s[1].length;});if(!ls.length)return;
      var sum=0;ls.forEach(function(l){sum+=l;});
      ls.forEach(function(l){o.push(S.RECT(xx,26,l*sc,22,2,U.soft(k[2]),k[2],1));xx+=l*sc;});
      var mid=xx-sum*sc/2;if(sum*sc>34)o.push(S.T(mid,41,k[0],"middle",9,k[2],true));
      if(sum*sc>44)o.push(S.T(mid,62,sum+" B","middle",8.5,k[2],true));});
    /* (b) 線の上の時間（2 s） */
    var yb=86,P=U.plot(nar?6:14,yb+18,nar?388:672,26,[0,2],[0,1]);
    o.push(S.T(nar?6:14,yb+6,"(b) 線の上の時間（8N1。濃い所が送っている時間、縦の線は位置を出す時刻）","start",nar?9.5:11,"ink",true));
    o.push(S.RECT(P.x,P.y,P.w,P.h,2,"var(--screen)","line",0.8));
    var rb=B/10,q=0,tprev=0,maxq=0,busy=[],ep=[];
    for(var k=0;k<=Math.round(2*R);k++)ep.push(k/R);
    ep.forEach(function(te,i){if(i>0){var dt=te-ep[i-1];if(q>0){var send=Math.min(q,rb*dt);busy.push([ep[i-1],Math.min(2,ep[i-1]+send/rb)]);q-=send;}}if(te<2){q+=tot;maxq=Math.max(maxq,q);}});
    var cl=bad?"alias":"gold";
    busy.forEach(function(b){o.push(S.RECT(P.X(b[0]),P.y,Math.max(1,P.X(b[1])-P.X(b[0])),P.h,0,U.soft(cl),cl,1));});
    ep.forEach(function(te){if(te<2)o.push(S.L(P.X(te),P.y-4,P.X(te),P.y+P.h+4,"ink",1.4));});
    [0,0.5,1,1.5,2].forEach(function(v){o.push(S.T(P.X(v),P.y+P.h+15,String(v),"middle",9,"muted"));});
    o.push(S.T(P.x+P.w,P.y+P.h+15,"時間 [s]","end",9,"muted"));
    var back=tot*ep.filter(function(e){return e<2;}).length-2*rb;
    if(bad)o.push(S.T(P.x+P.w,P.y-6,"2 s までに "+_w10_g(back)+" B がたまる","end",9.5,"alias",true,false,null,true));
    /* (c) 負荷率 */
    var yc=yb+80,Q=U.plot(nar?6:14,yc+18,nar?388:672,20,[0,2],[0,1]);
    o.push(S.TX(nar?6:14,yc+6,"(c) 負荷率 = 10 D / R_B = "+_w10_f(load*100,load<0.1?1:0)+" %","start",11,bad?"alias":"ink",true));
    o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,2,"var(--screen)","line",0.8));
    o.push(S.RECT(Q.x,Q.y,Math.max(1,Q.X(Math.min(2,load))-Q.x),Q.h,2,U.soft(bad?"alias":"green"),bad?"alias":"green",1));
    o.push(S.L(Q.X(1),Q.y-4,Q.X(1),Q.y+Q.h+4,"alias",1.6,"4 3"));
    o.push(S.T(Q.X(1),Q.y+Q.h+15,"100 %","middle",9,"alias",true));
    o.push(S.T(Q.x,Q.y+Q.h+15,"0","start",9,"muted"));o.push(S.T(Q.x+Q.w,Q.y+Q.h+15,"200 %","end",9,"muted"));
    box.set(S.svg(Wd,yc+62,o));
    var h="1 回 <b>"+tot+" バイト</b>（"+ss.length+" 文）× "+R+" 回/s = データ量 D = <b>"+_w10_g(D)+" B/s</b>、線の上では "+_w10_g(10*D)+" bit/s<br>";
    h+="ボーレート "+_w10_g(B)+" bit/s で送れるのは "+_w10_g(rb)+" B/s、負荷率 <b>"+_w10_f(load*100,load<0.1?1:0)+" %</b>、1 回の文を出し終えるまで "+_w10_f(burst*1000,burst<0.1?1:0)+" ms<br>";
    h+=bad?'<span class="warn">送り切れない: 1 秒に '+_w10_g(D-rb)+" B ずつたまり、文が遅れるか捨てられる（製品による）。ボーレートを上げるか、出す文を減らす（13 章）</span>"
      :(load>0.8?'<span class="warn">余裕が少ない（文がまとめて出る間、線がほとんど空かない）</span>':'<span class="ok">送り切れる</span>（マイコンは 1 回分 '+tot+" バイトを取りこぼさずに受ける。15 章）");
    ro.innerHTML=h;
    pre.style.display=show?"":"none";
    pre.innerHTML=show?'<div style="font-family:var(--mono);font-size:11px;white-space:pre;overflow-x:auto">'+ss.map(function(s){return U.esc(s[1].replace("\r\n",""))+"  ("+s[1].length+")";}).join("\n")+'</div>文の長さは $ から * とチェックサム、CR LF までを数えた（中身は例。形は 12 章）。':"";
  }
  draw();
};
