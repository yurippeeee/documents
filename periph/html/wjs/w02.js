  /* ===== 02 章 電源の種類と性質 ===== */

  /* ---- 3 節: 電源の種類とパルスの電流 → 端子電圧 ---- */
  /* 電源の例（代表値）: E 起電力 [V]、R 内部抵抗（ケーブルを含む）[Ω]、lim 取り出せる電流 [A]（0 は決まりなし）、
     kind: bat 電池 / usb 規則で決まる上限 / prot 超えると保護が働く / unreg 安定化していない（超えると熱くなる）、vmin 例の最低の電圧 */
  var _w02_SRC=[
    {t:"コイン形リチウム電池 1 個（3.0 V・20 Ω）",E:3.0,R:20,lim:0,kind:"bat",vmin:1.8},
    {t:"単 3 形アルカリ乾電池 2 本（3.1 V・0.3 Ω）",E:3.1,R:0.3,lim:0,kind:"bat",vmin:1.8},
    {t:"リチウムイオン電池 1 セル（3.8 V・0.1 Ω）",E:3.8,R:0.1,lim:0,kind:"bat",vmin:3.4},
    {t:"USB 2.0 のポート・設定の後（5.0 V・ケーブル 0.4 Ω・500 mA）",E:5.0,R:0.4,lim:0.5,kind:"usb",vmin:3.4},
    {t:"USB 2.0 のポート・設定の前（5.0 V・0.4 Ω・100 mA）",E:5.0,R:0.4,lim:0.1,kind:"usb",vmin:3.4},
    {t:"USB Type-C の 3.0 A の表示（5.0 V・0.2 Ω）",E:5.0,R:0.2,lim:3.0,kind:"usb",vmin:3.4},
    {t:"安定化した AC アダプタ 5 V・1 A（0.15 Ω）",E:5.0,R:0.15,lim:1.0,kind:"prot",vmin:3.4},
    {t:"安定化していない AC アダプタ 9 V・0.5 A（12 V・6 Ω）",E:12.0,R:6.0,lim:0.5,kind:"unreg",vmin:5.0}];

  function _w02_volt(v){var a=Math.abs(v);return a>=1?_w02_s(v,4)+" V":a>=1e-3?_w02_s(v*1e3,3)+" mV":a>=1e-6?_w02_s(v*1e6,3)+" µV":"0 V";}
  function _w02_pow(w){var a=Math.abs(w);return a>=1?_w02_s(w,3)+" W":a>=1e-3?_w02_s(w*1e3,3)+" mW":a>=1e-6?_w02_s(w*1e6,3)+" µW":a>=1e-9?_w02_s(w*1e9,3)+" nW":"0 W";}
  function _w02_s(v,d){var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  REG.w02_supply=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"SUPPLY","電源の種類とピーク電流 — 端子電圧はどこまで下がるか");
    var r1=U.ctrls(el);
    var src=U.select(r1,"電源（値は代表値の例）",_w02_SRC.map(function(s){return s.t;}),1,function(){var s=_w02_SRC[src.get()];E.set(s.E);R.set(s.R);vmin.set(s.vmin);draw();});
    var r2=U.ctrls(el);
    var E=U.slider(r2,"起電力 E",{min:1,max:13,step:0.1,value:3.1,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var R=U.slider(r2,"内部抵抗 R_in",{min:0.01,max:100,log:true,value:0.3,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var vmin=U.slider(r2,"動く最低の電圧（例）",{min:0.5,max:12,step:0.1,value:1.8,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var r3=U.ctrls(el);
    var isl=U.slider(r3,"眠りの電流",{min:1,max:1000,log:true,value:5,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var ish=U.slider(r3,"短いパルス（無線の送信など）",{min:1,max:500,log:true,value:15,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var tsh=U.slider(r3,"短いパルスの長さ",{min:0.5,max:50,log:true,value:3,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var r4=U.ctrls(el);
    var lon=U.checkbox(r4,"長いパルス（モータ・LED など）を入れる",true,draw);
    var ilg=U.slider(r4,"長いパルスの電流",{min:1,max:3000,log:true,value:200,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var tlg=U.slider(r4,"長いパルスの長さ",{min:10,max:1000,log:true,value:300,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* 区間の電流から端子電圧を求める。保護が働く電源は、上限の 1.2 倍を超えると出力を止める（例） */
    function volt(I,s,e,r){
      if(s.kind==="prot"&&I>s.lim*1.2)return {v:0,why:"prot"};
      var v=e-I*r;
      if(v<0)return {v:0,why:"cant"};
      return {v:v,why:""};}
    function draw(){
      var s=_w02_SRC[src.get()],e=E.get(),r=R.get(),vm=vmin.get();
      var Is=isl.get()*1e-6,Ip=ish.get()*1e-3,tp=tsh.get(),useL=lon.get(),IL=ilg.get()*1e-3,tl=tlg.get();
      ilg.el.style.opacity=useL?1:0.45;tlg.el.style.opacity=useL?1:0.45;
      /* 区間の並び: 眠り → 短いパルス → 眠り → 長いパルス → 眠り → 短いパルス → 眠り */
      var t1=100,t2=t1+tp+150,t3=t2+(useL?tl:0)+150,Tend=Math.max(1000,t3+tp+150);
      var segs=[[0,t1,Is,"sleep"],[t1,t1+tp,Ip,"short"],[t1+tp,t2,Is,"sleep"]];
      if(useL)segs.push([t2,t2+tl,IL,"long"]);
      segs.push([t2+(useL?tl:0),t3,Is,"sleep"],[t3,t3+tp,Ip,"short"],[t3+tp,Tend,Is,"sleep"]);
      var W=700,x0=78,wd=592,o=[],X=function(t){return x0+t/Tend*wd;};
      var Imax=Math.max(Ip,useL?IL:0,Is)*1.6;
      var pi=U.plot(x0,26,wd,100,[0,Tend],[1e-6,Math.max(Imax,1e-3)],{ylog:true});
      var pv=U.plot(x0,166,wd,120,[0,Tend],[0,Math.max(e,vm)*1.08]);
      o.push(S.T(x0,16,"負荷の電流（対数目盛）","start",10,"purple",true));
      o.push(pi.axes({yt:[1e-6,1e-5,1e-4,1e-3,1e-2,1e-1,1].filter(function(v){return v<=Math.max(Imax,1e-3);}),xt:[],yfmt:function(v){return F.cur(v,1);},ylOff:60}));
      if(s.lim>0){o.push(pi.line([[0,s.lim],[Tend,s.lim]],"gold",1.3,"6 4"));
        o.push(S.T(x0+wd-4,pi.Y(s.lim)-5,(s.kind==="usb"?"使ってよい電流 ":"定格 ")+F.cur(s.lim),"end",9.5,"gold",true));}
      var pts=[[X(0),pi.Y(Is)]];
      segs.forEach(function(g){var w=Math.max(X(g[1])-X(g[0]),2);pts.push([X(g[0]),pi.Y(g[2])]);pts.push([X(g[0])+w,pi.Y(g[2])]);});
      o.push(S.PL(pts,"purple",1.8));
      o.push(S.T(x0,156,"端子電圧","start",10,"gold",true));
      o.push(pv.axes({xt:U.nice(0,Tend,6),xl:"時間 [ms]",yfmt:function(v){return U.sig(v,3);},yl:"電圧 [V]",ylOff:44}));
      o.push(pv.line([[0,vm],[Tend,vm]],"alias",1.3,"5 4"));
      o.push(S.T(x0+wd-4,pv.Y(vm)+14,"動く最低の電圧 "+vm.toFixed(1)+" V","end",9.5,"alias",true));
      o.push(pv.line([[0,e],[Tend,e]],"faint",1,"2 4"));
      var res={},vp=[];
      segs.forEach(function(g){var q=volt(g[2],s,e,r),w=Math.max(X(g[1])-X(g[0]),2),bad=q.v<vm;
        o.push(S.L(X(g[0]),pv.Y(q.v),X(g[0])+w,pv.Y(q.v),bad?"alias":"gold",2.2));vp.push([X(g[0]),pv.Y(q.v)],[X(g[0])+w,pv.Y(q.v)]);
        if(!res[g[3]])res[g[3]]={I:g[2],q:q};});
      o.push(S.PL(vp,"gold",0.8));
      box.set(S.svg(W,320,o));
      /* 読み出し */
      var names={sleep:"眠り",short:"短いパルス",long:"長いパルス"},rows=[],worst=null;
      ["sleep","short","long"].forEach(function(k){if(!res[k])return;var I=res[k].I,q=res[k].q,v=q.v,dv=e-v;
        var verdict;
        if(q.why==="prot")verdict='<span class="warn">保護が働いて出力が止まる（リセット）</span>';
        else if(q.why==="cant")verdict='<span class="warn">この電流は流せない（電圧が 0 まで下がる）</span>';
        else if(v<vm)verdict='<span class="warn">最低の電圧を割る</span>';
        else verdict='<span class="ok">動く</span>';
        if(s.lim>0&&I>s.lim&&q.why!=="prot")verdict+=s.kind==="usb"?' ・ <span class="warn">使ってよい電流を超える（規格に反する）</span>':' ・ <span class="warn">定格を超える（熱くなる）</span>';
        if(worst===null||v<worst)worst=v;
        rows.push([names[k],F.cur(I),q.why?"—":_w02_volt(v),q.why?"—":_w02_volt(dv),q.why?"—":_w02_pow(I*I*r),verdict]);});
      var imax=(e-vm)/r;
      ro.innerHTML="端子電圧 V = E − I × R_in = "+e.toFixed(2)+" V − I × "+U.sig(r,3)+" Ω"+
        U.tbl(["区間","電流 I","端子電圧 V","下がる電圧","内部抵抗の熱","判定"],rows,["left","right","right","right","right","wrap"])+
        "動く最低の電圧を保てる電流の上限 = (E − 最低の電圧) ÷ R_in = <b>"+(imax>0?F.cur(imax):"0（E が最低の電圧より低い）")+"</b>"+(s.lim>0?"、電源の取り出せる電流 "+F.cur(s.lim):"")+
        '<div class="wnote">内部抵抗の模型（1 節）だけで計算した。実際の電池では内部抵抗が温度と残量で変わり（03 章）、パルスの間に電圧がさらにゆっくり下がることもある。保護が働く電流と動き方は製品による（ここでは定格の 1.2 倍で止まるとした）。ピーク電流をコンデンサで補う方法は 04 章で扱う。</div>';
    }
    draw();
  };

  /* ---- 6 節: 環境発電の収支 ---- */
  REG.w02_harvest=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"HARVEST","環境発電の収支 — 蓄えは暗い間を越せるか");
    var r1=U.ctrls(el);
    var light=U.select(r1,"光",["室内の照明（平日の 8〜18 時、週末は消える）","室内の照明（毎日 8〜18 時）","屋外（晴れ。日中の山 10 mW/cm²）","屋外（曇り。日中の山 2 mW/cm²）"],0,draw);
    var area=U.slider(r1,"太陽電池の面積",{min:1,max:100,log:true,value:10,fmt:function(v){return U.sig(v,3)+" cm²";},onInput:draw});
    var r2=U.ctrls(el);
    var cap=U.slider(r2,"蓄えのコンデンサ",{values:[0.047,0.1,0.22,0.47,0.68,1,2.2,4.7],value:0.47,fmt:function(v){return v<0.1?Math.round(v*1000)+" mF":v+" F";},onInput:draw});
    var pl=U.slider(r2,"機器の平均の消費電力",{min:1,max:3000,log:true,value:30,fmt:function(v){return U.sig(v,3)+" µW";},onInput:draw});
    var r3=U.ctrls(el);
    var voff=U.slider(r3,"止める電圧",{min:1.8,max:3.5,step:0.1,value:2.2,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var von=U.slider(r3,"動かす電圧",{min:1.8,max:4.8,step:0.1,value:3.0,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var wk=U.slider(r3,"期間",{values:[1,2,3],value:1,fmt:function(v){return v+" 週間";},onInput:draw});
    var r4=U.ctrls(el);
    var empty=U.checkbox(r4,"空の蓄え（0 V）から始める（チェックなしは満杯の 5.0 V から）",false,draw);
    var br=U.btnrow(el);
    function preset(a,c,p,n){light.set(0);area.set(a);cap.set(c);pl.set(p);voff.set(2.2);von.set(3.0);wk.set(n);empty.set(false);draw();}
    U.button(br,"例の値（10 cm²・0.47 F・30 µW）",function(){preset(10,0.47,30,1);});
    U.button(br,"1 F にする（3 週間）",function(){preset(10,1,30,3);});
    U.button(br,"15 cm²・1 F（3 週間）",function(){preset(15,1,30,3);});
    var box=U.svgbox(el); var ro=U.readout(el);
    var VMAX=5.0,ETA=0.8,POFF=1e-6;
    /* 時刻 t [s] に太陽電池から取り出せる電力 [W] */
    function ph(t,L,A){var day=Math.floor(t/86400),h=(t%86400)/3600;
      if(L<=1){var on=h>=8&&h<18&&(L===1||day%7<5);return on?A*10e-6:0;}
      var pk=(L===2?10e-3:2e-3)*A;return (h>=6&&h<18)?pk*Math.sin(Math.PI*(h-6)/12):0;}
    function draw(){
      var L=light.get(),A=area.get(),C=cap.get(),P=pl.get()*1e-6,Vf=voff.get(),Vo=von.get(),N=wk.get();
      var warn="";
      if(Vo<Vf){warn='<span class="warn">動かす電圧が止める電圧より低いので、止める電圧と同じにして計算した。</span><br>';Vo=Vf;}
      var dt=60,steps=Math.round(N*7*86400/dt),Emax=0.5*C*VMAX*VMAX,Eoff=0.5*C*Vf*Vf;
      var Ec=empty.get()?0:Emax,run=!empty.get(),stops=0,downT=0,pts=[],red=[],r0=null,inJ=0,outJ=0;
      for(var k=0;k<steps;k++){var t=k*dt,p=ph(t,L,A);
        var add=ETA*p*dt;inJ+=add;Ec=Math.min(Ec+add,Emax);
        if(run){Ec-=P*dt;outJ+=P*dt;if(Ec<Eoff){run=false;stops++;r0=t;}}
        else{Ec-=POFF*dt;downT+=dt;if(Math.sqrt(2*Math.max(Ec,0)/C)>=Vo){run=true;if(r0!==null){red.push([r0,t]);}r0=null;}}
        if(!run&&r0===null)r0=t;
        Ec=Math.max(Ec,0);
        if(k%10===0)pts.push([t/86400,Math.sqrt(2*Ec/C)]);}
      if(r0!==null)red.push([r0,steps*dt]);
      var D=N*7,W=700,o=[],p=U.plot(70,30,600,190,[0,D],[0,5.5]);
      /* 光のある時間 */
      for(var d=0;d<D;d++){if(L<=1){if(L===1||d%7<5)o.push(S.RECT(p.X(d+8/24),p.y,p.X(d+18/24)-p.X(d+8/24),p.h,0,U.soft("gold"),"none",0));}
        else o.push(S.RECT(p.X(d+6/24),p.y,p.X(d+18/24)-p.X(d+6/24),p.h,0,U.soft("gold"),"none",0));}
      red.forEach(function(q){o.push(S.RECT(p.X(q[0]/86400),p.y,Math.max(p.X(q[1]/86400)-p.X(q[0]/86400),1),p.h,0,U.soft("alias"),"none",0));});
      var xt=[];for(var i=0;i<=D;i++)xt.push(i);
      o.push(p.axes({yl:"蓄えの電圧 [V]",xt:xt,yt:[0,1,2,3,4,5],xfmt:function(){return "";},yfmt:function(v){return String(v);}}));
      for(i=0;i<D;i++)o.push(S.T(p.X(i+0.5),p.y+p.h+15,"月火水木金土日".charAt(i%7),"middle",D>7?9:10,"ink",true));
      o.push(p.line([[0,Vf],[D,Vf]],"alias",1.2,"5 4"));o.push(p.line([[0,Vo],[D,Vo]],"muted",1.1,"3 3"));
      o.push(S.T(p.X(D)-4,p.Y(Vf)+13,"止める "+Vf.toFixed(1)+" V","end",9.5,"alias"));
      o.push(S.T(p.X(D)-4,p.Y(Vo)-5,"動かす "+Vo.toFixed(1)+" V","end",9.5,"muted"));
      o.push(p.line(pts,"signal",1.8));
      o.push(S.RECT(70,252,10,10,2,U.soft("gold"),"gold",1.2));o.push(S.T(85,261,"光のある時間","start",10,"muted"));
      o.push(S.RECT(190,252,10,10,2,U.soft("signal"),"signal",1.2));o.push(S.T(205,261,"蓄えの電圧","start",10,"muted"));
      o.push(S.RECT(300,252,10,10,2,U.soft("alias"),"alias",1.2));o.push(S.T(315,261,"機器が止まっている時間","start",10,"muted"));
      box.set(S.svg(W,270,o));
      /* 収支（1 日・1 週） */
      var dayIn=0,weekIn=0;for(var tt=0;tt<7*86400;tt+=60){var e=ETA*ph(tt,L,A)*60;weekIn+=e;if(tt<86400)dayIn+=e;}
      var dayOut=P*86400,weekOut=P*7*86400,use=0.5*C*(VMAX*VMAX-Vf*Vf),hold=use/P/3600;
      ro.innerHTML=warn+"1 日（"+(L===0?"平日":"毎日")+"）に蓄えへ入る "+U.sig(dayIn,3)+" J（取り込みで 2 割を失った後）、出る "+U.sig(dayOut,3)+" J → "+(dayIn>=dayOut?'<span class="ok">足りる</span>':'<span class="warn">足りない</span>')+"<br>"+
        "1 週間に入る "+U.sig(weekIn,3)+" J、出る "+U.sig(weekOut,3)+" J → "+(weekIn>=weekOut?'<span class="ok">足りる</span>':'<span class="warn">足りない（毎週 '+U.sig(weekOut-weekIn,3)+' J 減る）</span>')+"<br>"+
        "蓄え（"+(C<0.1?Math.round(C*1000)+" mF":C+" F")+"）から 5.0 V → "+Vf.toFixed(1)+" V で取り出せる ½ C (5.0² − "+Vf.toFixed(1)+"²) = <b>"+U.sig(use,3)+" J</b> → 光が無くても <b>"+U.sig(hold,3)+" 時間</b>動ける<br>"+
        (stops?'<span class="warn">'+N+' 週間で '+stops+' 回止まり、合わせて '+U.sig(downT/3600,3)+' 時間止まっていた</span>':(empty.get()&&downT>0?'空から始めて '+U.sig(downT/3600,3)+' 時間で動き始め、その後は止まらなかった':'<span class="ok">'+N+' 週間、止まらずに動き続けた</span>'))+
        '<div class="wnote">取り込みで失う割合 2 割、蓄えの上限 5.0 V、止まっている間の電力 1 µW は固定にした。室内は 1 cm² あたり 10 µW、屋外は 6〜18 時の正弦波とした（どれも代表値の例）。コンデンサ自身が失う電荷と、温度による変化は入れていない。</div>';
    }
    draw();
  };

  /* ---- 7 節: OR 接続 ---- */
  var _w02_VT=0.025693;
  var _w02_DI={si:{n:1.8,vf1:0.85,ir:10e-9},sk:{n:1.05,vf1:0.40,ir:10e-6}};
  /* 電源 E・内部抵抗 R・素子 k を通って、電圧 V の点（負荷）へ流れる電流 [A]（負は逆向き） */
  function _w02_br(E,R,V,k){
    if(k==="direct")return (E-V)/R;
    if(k==="ideal")return E-V>0?(E-V)/(R+0.05):0;
    var p=_w02_DI[k],nv=p.n*_w02_VT,Is=Math.exp(-p.vf1/nv);
    if(E-V<=0)return -p.ir;
    var lo=0,hi=(E-V)/R;
    for(var i=0;i<90;i++){var I=(lo+hi)/2,Vd=E-V-I*R,f=Is*(Math.exp(Math.min(Vd/nv,700))-1)-I;if(f>0)lo=I;else hi=I;}
    return (lo+hi)/2;}
  /* 負荷の電流 IL を流すときの負荷の電圧と、各電源の電流。aOn=false なら A を外した状態 */
  function _w02_solve(EA,RA,EB,RB,IL,k,aOn){
    var lo=0,hi=Math.max(EA,EB);
    for(var i=0;i<90;i++){var V=(lo+hi)/2,It=(aOn?_w02_br(EA,RA,V,k):0)+_w02_br(EB,RB,V,k);if(It>IL)lo=V;else hi=V;}
    var Vo=(lo+hi)/2;return {V:Vo,IA:aOn?_w02_br(EA,RA,Vo,k):0,IB:_w02_br(EB,RB,Vo,k)};}

  REG.w02_oring=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"OR","2 つの電源のつなぎ方 — どちらが流し、何が流れ込むか");
    var KN=["直接つなぐ（悪い例）","シリコンダイオード","ショットキーダイオード","理想ダイオード"],KK=["direct","si","sk","ideal"];
    var r0=U.ctrls(el);
    var kind=U.seg(r0,KN,2,draw);
    var r1=U.ctrls(el);
    var ea=U.slider(r1,"主な電源 A の電圧",{min:2,max:15,step:0.05,value:5.0,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var ra=U.slider(r1,"A の内部抵抗（ケーブルを含む）",{min:0.01,max:3,log:true,value:0.4,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var r2=U.ctrls(el);
    var eb=U.slider(r2,"予備の電池 B の電圧",{min:1,max:15,step:0.05,value:3.1,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var rb=U.slider(r2,"B の内部抵抗",{min:0.01,max:50,log:true,value:0.3,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var r3=U.ctrls(el);
    var il=U.slider(r3,"負荷の電流",{min:1,max:3000,log:true,value:300,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var vm=U.slider(r3,"負荷が動く最低の電圧（例）",{min:0.5,max:12,step:0.1,value:2.5,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(a,b,c,d,i,m){ea.set(a);ra.set(b);eb.set(c);rb.set(d);il.set(i);vm.set(m);draw();}
    U.button(br,"USB 5 V と単 3 形 2 本",function(){preset(5.0,0.4,3.1,0.3,300,2.5);});
    U.button(br,"USB 5 V と新しい単 3 形 3 本",function(){preset(5.0,0.4,4.8,0.45,300,3.4);});
    U.button(br,"3.3 V と新しいコイン電池",function(){preset(3.3,0.05,3.2,20,10,2.0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var k=KK[kind.get()],EA=ea.get(),RA=ra.get(),EB=eb.get(),RB=rb.get(),IL=il.get()*1e-3,Vm=vm.get();
      var on=_w02_solve(EA,RA,EB,RB,IL,k,true),off=_w02_solve(EA,RA,EB,RB,IL,k,false);
      var W=700,o=[],x0=86,wd=584,X=function(f){return x0+f*wd;};
      /* 3 つの区間: A あり → A を外す → A が戻る */
      var ph=[[0,0.36,on],[0.36,0.68,off],[0.68,1,on]];
      var vtop=Math.max(EA,EB,Vm)*1.1,pv=U.plot(x0,30,wd,110,[0,1],[0,vtop]);
      o.push(S.T(x0,20,"負荷の電圧","start",10,"signal",true));
      o.push(pv.axes({xt:[],yfmt:function(v){return U.sig(v,3);},yl:"電圧 [V]",ylOff:44}));
      o.push(pv.line([[0,Vm],[1,Vm]],"alias",1.2,"5 4"));o.push(S.T(X(1)-4,pv.Y(Vm)+13,"動く最低の電圧 "+Vm.toFixed(1)+" V","end",9.5,"alias"));
      ph.forEach(function(q){var v=q[2].V,bad=v<Vm;o.push(S.L(X(q[0]),pv.Y(v),X(q[1]),pv.Y(v),bad?"alias":"signal",2.4));
        o.push(S.T((X(q[0])+X(q[1]))/2,pv.Y(v)-6,U.sig(v,3)+" V","middle",10,bad?"alias":"signal",true));});
      for(var j=1;j<3;j++)o.push(S.L(X(ph[j][0]),26,X(ph[j][0]),290,"faint",1,"3 3"));
      [["A と B がある",0.18],["A を外した（停電・抜いた）",0.52],["A が戻った",0.84]].forEach(function(t){o.push(S.T(X(t[1]),14,t[0],"middle",9.5,"ink",true));});
      /* 電流 */
      var imax=Math.max(IL,Math.abs(on.IA),Math.abs(on.IB),Math.abs(off.IB))*1.15,pi=U.plot(x0,170,wd,110,[0,1],[-imax,imax]);
      o.push(S.T(x0,162,"各電源から負荷の側へ流れる電流（負は電源へ流れ込む向き）","start",10,"gold",true));
      o.push(pi.axes({xt:[],yt:U.nice(-imax,imax,4),yfmt:function(v){return v===0?"0":F.cur(v,2);},ylOff:62}));
      ph.forEach(function(q){var r=q[2];
        o.push(S.L(X(q[0]),pi.Y(r.IA),X(q[1]),pi.Y(r.IA),"gold",2.2));
        o.push(S.L(X(q[0]),pi.Y(r.IB),X(q[1]),pi.Y(r.IB),r.IB<0?"alias":"green",2.2,"6 3"));});
      o.push(S.L(x0,312,x0+24,312,"gold",2.2));o.push(S.T(x0+30,316,"A の電流","start",10,"muted"));
      o.push(S.L(x0+110,312,x0+134,312,"green",2.2,"6 3"));o.push(S.T(x0+140,316,"B の電流（赤は B へ流れ込む）","start",10,"muted"));
      box.set(S.svg(W,326,o));
      /* 読み出し */
      function loss(E,R,I){if(I<=0)return 0;if(k==="direct")return I*I*R;if(k==="ideal")return I*I*0.05;return (E-I*R-on.V)*I;}
      var share=on.IB>0?on.IB/IL:0,txt="";
      var bt;
      if(Math.abs(on.IB)<1e-12)bt="B から 0";
      else if(on.IB>0)bt="B から "+F.cur(on.IB)+"（負荷の電流の "+U.sig(share*100,3)+" %）";
      else if(-on.IB>1e-3)bt='<span class="warn">B へ '+F.cur(-on.IB)+" 流れ込む</span>";
      else bt="B から 0（B へは逆向きに "+F.cur(-on.IB)+"）";
      txt+="<b>A と B がある</b>: 負荷の電圧 <b>"+U.sig(on.V,4)+" V</b>、A から "+F.cur(on.IA)+"、"+bt+"<br>";
      if(k!=="direct")txt+="A の側の素子の電圧の低下 "+U.sig((EA-on.IA*RA-on.V)*1000,3)+" mV、熱 "+F.num(loss(EA,RA,on.IA)*1000,3)+" mW<br>";
      else txt+='直接つないだので、電流を制限するのは内部抵抗だけ: 負荷が無くても (E_A − E_B) ÷ (R_A + R_B) = <span class="warn">'+F.cur((EA-EB)/(RA+RB))+"</span><br>";
      txt+="<b>A を外したとき</b>: 負荷の電圧 <b>"+U.sig(off.V,4)+" V</b>"+(off.V<Vm?' <span class="warn">（動く最低の電圧を割る）</span>':' <span class="ok">（動く）</span>')+"、B から "+F.cur(off.IB)+"<br>";
      var msg;
      if(k==="direct")msg='<span class="warn">充電できない電池に電流を流し込むと、発熱・液漏れ・破裂のおそれがある。直接つないではいけない。</span>';
      else if(share>0.01)msg='<span class="warn">A があるのに、B が負荷の電流の '+U.sig(share*100,3)+' % を流し続けて減っていく。A の電圧を B の最も高い電圧より十分に高くする。</span>';
      else if(on.IB<0)msg='B へは逆向きに '+F.cur(-on.IB)+' だけ流れ込む（'+(k==="sk"?"ショットキーの逆向きのわずかな電流。温度が高いと増える":"シリコンの逆向きのわずかな電流")+'）。';
      else msg='<span class="ok">A があるときは、B はほとんど流さない。</span>';
      ro.innerHTML=txt+msg+'<div class="wnote">ダイオードは I = I_S × exp(V ÷ (n V_T))（シリコン n = 1.8・1 A で 0.85 V、ショットキー n = 1.05・1 A で 0.40 V、逆向きの電流はそれぞれ 10 nA と 10 µA）、理想ダイオードは順方向だけ 50 mΩ とした（どれも例の値）。切り替わりの間を出力のコンデンサが支えることと、理想ダイオードが切れるまでの短い逆向きの電流は入れていない。</div>';
    }
    draw();
  };
