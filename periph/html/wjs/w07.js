  /* ===== 07 章 眠らせ方と起こし方 ===== */
  function _w07_nar(box){return box.el.clientWidth>0&&box.el.clientWidth<520;}
  function _w07_life(h,U){var d=h/24;if(d>=365*30)return "30 年を超える";return d>=365?U.sig(d/365,3)+" 年":(d>=1?U.sig(d,3)+" 日":U.sig(h,3)+" 時間");}
  function _w07_R(v){return v>=1e6?(+(v/1e6).toPrecision(3))+" MΩ":(v>=1e3?(+(v/1e3).toPrecision(3))+" kΩ":v+" Ω");}
  /* 対数の横棒の x（lo〜hi を x0〜x1 に） */
  function _w07_lx(v,lo,hi,x0,x1){v=Math.max(lo,Math.min(hi,v));return x0+(Math.log10(v)-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(x1-x0);}

  /* ---- 3 節: 眠る間のピンの設定と、眠りの電流の内訳 ---- */
  REG.w07_pins=function(el,U){
    var S=U.S,F=U.fmt,seed=7;
    var V=3.0,VIH=2.1,VMG=0.3,IFL=100e-6,WFL=0.38,ROUT=50,VF=0.5,RX=5e3,RSP=4.7e3,RRADIO=100e3,QTASK=42e-6,TTASK=60,CAP=220;
    U.head(el,"PINS","眠る間のピンの設定と、眠りの電流の内訳");
    var r1=U.ctrls(el);
    var nUn=U.slider(r1,"使っていないピンの本数",{min:0,max:20,step:1,value:6,fmt:function(v){return v+" 本";},onInput:draw});
    var mUn=U.select(r1,"使っていないピンの設定",["浮いた入力のまま","アナログの設定","L を出す","内蔵のプルダウン"],0,draw);
    var r2=U.ctrls(el);
    var door=U.select(r2,"扉のスイッチ（閉じると L）",["開いている","閉じている"],1,draw);
    var how=U.select(r2,"閉じている間の読み方",["プルアップしたまま","プルアップを外し、周期的に読む"],0,draw);
    var rpu=U.slider(r2,"プルアップ抵抗",{values:[10e3,20e3,40e3,100e3,220e3,560e3,1e6,2.2e6,4.7e6],value:40e3,fmt:_w07_R,onInput:draw});
    var poll=U.slider(r2,"周期的に読む間隔",{values:[0.02,0.05,0.1,0.2,0.5,1],value:0.1,fmt:function(v){return F.time(v);},onInput:draw});
    var r3=U.ctrls(el);
    var sens=U.select(r3,"電源を切ったセンサへの 2 本の線",["H を出したまま","L を出す","アナログの設定"],0,draw);
    var spu=U.select(r3,"その線のプルアップ抵抗（4.7 kΩ）",["無し","いつも入っている電源へ","センサと同じ、切る電源へ"],0,draw);
    var radio=U.select(r3,"電源を入れたままの無線を選ぶ線（相手のプルアップ 100 kΩ）",["H（選ばない側）を出す","L を出す"],1,draw);
    var r4=U.ctrls(el);
    var base=U.slider(r4,"マイコンの深い眠りの電流",{min:0.3,max:20,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var ilk=U.slider(r4,"ピンの漏れ電流の最大値（抵抗の上限に使う）",{values:[0.01,0.05,0.1,0.5,1],value:1,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"直す前（3 節の失敗を全部）",function(){nUn.set(6);mUn.set(0);door.set(1);how.set(0);rpu.set(40e3);sens.set(0);spu.set(1);radio.set(1);base.set(2);draw();});
    U.button(br,"3 節の直し方",function(){mUn.set(1);how.set(1);poll.set(0.1);sens.set(1);spu.set(2);radio.set(0);draw();});
    U.button(br,"もう一度（浮いた入力の電圧を別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* 電源を切ったセンサの電源の線: 中の回路を抵抗 RX とみなし、保護ダイオード（VF）や抵抗から流れ込む電流と釣り合う電圧を求める */
    function sensorCalc(mode,pu){
      function inj(vx){var s=0;for(var k=0;k<2;k++){
          if(mode===0){s+=Math.max(0,(V-VF-vx)/ROUT);if(pu===2)s+=(V-vx)/RSP;}
          else if(mode===2){if(pu===1)s+=Math.max(0,(V-VF-vx)/RSP);}
          else{if(pu===2)s-=vx/RSP;}}
        return s;}
      var lo=0,hi=V;for(var it=0;it<60;it++){var m=(lo+hi)/2;if(inj(m)-m/RX>0)lo=m;else hi=m;}
      var vx=(lo+hi)/2,Iin=Math.max(0,vx/RX+(mode===1&&pu===2?2*vx/RSP:0));
      var Ipu=(mode===1&&pu===1)?2*V/RSP:0;     /* L を出す線へ、いつもの電源のプルアップから流れる */
      return {vx:vx,I:(mode===1&&pu===2)?0:Iin+Ipu,Ipu:Ipu,Iback:(mode===1)?0:Iin};
    }
    function draw(){
      var nar=_w07_nar(box),R=U.rng(seed);
      var nu=nUn.get(),mu=mUn.get(),dc=door.get()===1,hw=how.get(),Rp=rpu.get(),Tp=poll.get(),sm=sens.get(),sp=spu.get(),rl=radio.get()===1;
      how.el.style.display=dc?"":"none";poll.el.style.display=dc&&hw===1?"":"none";
      var Ib=base.get()*1e-6,Ilk=ilk.get()*1e-6,Rmax=(V-VIH-VMG)/Ilk;
      /* 浮いた入力: 電圧は乱数で 0〜3 V のどこか */
      var Ifl=0,vs=[];for(var i=0;i<nu;i++){var v=R.next()*V;vs.push(v);if(mu===0)Ifl+=IFL*Math.exp(-Math.pow((v-1.5)/WFL,2));}
      var Idoor=0,dnote;
      if(!dc){Idoor=0;dnote="開いている: 電流は流れない";}
      else if(hw===0){Idoor=V/Rp;dnote="閉じている: 3.0 V ÷ "+_w07_R(Rp);}
      else{Idoor=(0.15e-6+V/Rp*20e-6)/Tp;dnote="閉じている: "+F.time(Tp)+" ごとに起きて読む";}
      var sc=sensorCalc(sm,sp),Irad=rl?V/RRADIO:0;
      var parts=[["マイコンの眠り",Ib,"signal"],["使っていないピン",Ifl,"alias"],["扉のスイッチ",Idoor,"gold"],["センサへの線",sc.I,"teal"],["無線を選ぶ線",Irad,"purple"]];
      var tot=parts.reduce(function(a,p){return a+p[1];},0),Iavg=tot+QTASK/TTASK,life=CAP*1e-3/Iavg;
      /* ---- 図 ---- */
      var W=nar?400:700,o=[],rowsX=nar?[10,150,250,390]:[10,190,330,480],rh=34,y0=24;
      var lo=1e-8,hi=1e-2;
      o.push(S.T(rowsX[0],14,"ピン（線）","start",10,"ink",true));
      if(!nar)o.push(S.T(rowsX[1],14,"設定","start",10,"ink",true));
      o.push(S.T(rowsX[2],14,"眠っている間の電流（対数目盛）","start",10,"ink",true));
      var desc=[["マイコンの眠り","データシートの値"],["使っていない "+nu+" 本",["浮いた入力","アナログの設定","L","内蔵のプルダウン"][mu]],
        ["扉のスイッチ",dnote],["センサへの 2 本",["H","L","アナログの設定"][sm]+"・"+["プルアップ無し","いつもの電源へ","切る電源へ"][sp]],["無線を選ぶ線",rl?"L（相手のプルアップと引き合う）":"H"]];
      [1e-8,1e-6,1e-4,1e-2].forEach(function(v){var x=_w07_lx(v,lo,hi,rowsX[2],rowsX[3]);o.push(S.L(x,y0,x,y0+5*rh,"grid",1));o.push(S.T(x,y0+5*rh+13,F.cur(v,1),"middle",9,"muted"));});
      parts.forEach(function(p,i){var y=y0+i*rh,x0=rowsX[2],x1=_w07_lx(p[1],lo,hi,rowsX[2],rowsX[3]);
        o.push(S.T(rowsX[0],y+14,desc[i][0],"start",10,p[2],true));
        o.push(S.T(nar?rowsX[0]:rowsX[1],nar?y+27:y+14,desc[i][1],"start",9,"muted"));
        if(p[1]>lo)o.push(S.RECT(x0,y+5,Math.max(1,x1-x0),14,2,U.soft(p[2]),p[2],1));
        o.push(S.T(Math.min(x1+5,W-4),y+16,p[1]>0?F.cur(p[1]):"0",x1+5>W-60?"end":"start",9.5,p[2],true,false,null,true));});
      /* 合計の帯 */
      var yt=y0+5*rh+30,bx=10,bw=W-20;
      o.push(S.T(bx,yt,"眠りの電流の合計 "+F.cur(tot)+"（内訳は割合）","start",10.5,"ink",true));
      var xx=bx;parts.forEach(function(p){var w=bw*p[1]/tot;if(w<=0)return;o.push(S.RECT(xx,yt+8,Math.max(w,0.8),18,2,U.soft(p[2]),p[2],1));
        if(w>70)o.push(S.T(xx+w/2,yt+21,Math.round(p[1]/tot*100)+" %","middle",9.5,p[2],true));xx+=w;});
      /* 浮いた入力の電圧（使っていないピンが浮いているとき） */
      var yh=yt+44;
      if(mu===0&&nu>0){o.push(S.T(bx,yh,"浮いた入力の電圧（乱数の例）と電流","start",9.5,"muted"));
        var px=bx,pw=nar?380:330,ph=36,yy=yh+6;o.push(S.RECT(px,yy,pw,ph,3,"none","line",1));
        var X=function(v){return px+v/V*pw;};o.push(S.RECT(X(0.9),yy,X(2.1)-X(0.9),ph,0,U.soft("alias"),"none",0));
        vs.forEach(function(v){o.push(S.L(X(v),yy+4,X(v),yy+ph-4,"alias",2));});
        [0,0.9,2.1,3].forEach(function(v){o.push(S.T(X(v),yy+ph+12,v+" V","middle",9,"muted"));});
        yh+=ph+26;}
      box.set(S.svg(W,yh,o));
      var warn="";
      if(!dc&&Rp>Rmax)warn+='<span class="warn">プルアップ抵抗 '+_w07_R(Rp)+' は上限 '+_w07_R(Rmax)+' を超える。開いていても、漏れ電流でピンの電圧が '+U.fmt.fix(V-Ilk*Rp,2)+' V まで下がり、H と読めないことがある。</span><br>';
      if(dc&&hw===0&&Rp>Rmax)warn+='<span class="warn">プルアップ抵抗が上限 '+_w07_R(Rmax)+' を超えている。開いたときに H と読めないことがある。</span><br>';
      if(mu===0&&nu>0)warn+='<span class="warn">浮いた入力が '+nu+' 本ある。電流は電圧しだいで変わり、ピンで起こす設定なら勝手に起きる。</span><br>';
      ro.innerHTML=warn+"抵抗の上限 (V_DD − V_IH − V_mg) ÷ I_lk = (3.0 − 2.1 − 0.3) V ÷ "+F.cur(Ilk)+" = <b>"+_w07_R(Rmax)+"</b>"+
        (dc&&hw===1?" ・ 周期的に読むので、閉じたことに気づくのは最大 "+F.time(Tp)+" 遅れる":"")+"<br>"+
        "センサの電源の線の電圧 "+U.fmt.fix(sc.vx,2)+" V（流れ込み "+F.cur(sc.Iback)+(sc.Ipu>0?"、L の線へプルアップから "+F.cur(sc.Ipu):"")+"）<br>"+
        "眠りの電流の合計 <b>"+F.cur(tot)+"</b>（マイコンの "+U.sig(tot/Ib,3)+" 倍） ・ 仕事の分 0.70 µA を足した平均電流 "+F.cur(Iavg)+" ・ CR2032 の電池寿命 <b>"+_w07_life(life/1,U)+"</b>"+
        '<div class="wnote">例の値: 電源 3.0 V、浮いた入力の電流は中ほどの電圧で最大 100 µA、周期的に読む 1 回は 0.15 µC（起床時間 20 µs と読む 30 µs に 3 mA）。電源を切ったセンサの中の回路を 5 kΩ、保護ダイオードの電圧を 0.5 V とした。仕事の分は 01 章 4 節のドアの開閉センサ（60 s ごとに 42 µC）。ピンの漏れ電流そのものは数えていない。電池寿命は 220 mAh ÷ 平均電流（自己放電は含めない）。</div>';
    }
    draw();
  };

  /* ---- 5 節: どの深さで眠るか ---- */
  REG.w07_depth=function(el,U){
    var S=U.S,F=U.fmt;
    var COL=["signal","teal","purple"],NM=["軽い眠り","深い眠り","最も深い眠り"];
    U.head(el,"DEPTH","起きる周期と、得な眠りの段階");
    var r1=U.ctrls(el);
    var i1=U.slider(r1,"軽い眠りの電流",{min:50,max:3000,log:true,value:500,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var t1=U.slider(r1,"軽い眠りの起床時間",{min:0.1,max:20,log:true,value:1,fmt:function(v){return F.time(v*1e-6);},onInput:draw});
    var r2=U.ctrls(el);
    var i2=U.slider(r2,"深い眠りの電流",{min:0.3,max:50,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var t2=U.slider(r2,"深い眠りの起床時間",{min:2,max:1000,log:true,value:20,fmt:function(v){return F.time(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var i3=U.slider(r3,"最も深い眠りの電流",{min:0.05,max:5,log:true,value:0.4,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var t3=U.slider(r3,"最も深い眠りの起床時間",{min:0.1,max:20,log:true,value:2,fmt:function(v){return F.time(v*1e-3);},onInput:draw});
    var r4=U.ctrls(el);
    var iw=U.slider(r4,"起床時間の間の電流",{min:0.5,max:20,log:true,value:3,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var qt=U.slider(r4,"仕事の上乗せの電荷 Q_task",{min:0.01,max:1000,log:true,value:42,fmt:function(v){return U.sig(v,3)+" µC";},onInput:draw});
    var Tp=U.slider(r4,"起きる周期 T",{min:0.001,max:86400,log:true,value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var r5=U.ctrls(el);
    var resp=U.slider(r5,"応えるまでに許される時間",{min:1e-6,max:10,log:true,value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var ram=U.checkbox(r5,"保持用の RAM に入らない状態がある",false,draw);
    var fast=U.checkbox(r5,"速いクロックで動く周辺回路を使っている",false,draw);
    var br=U.btnrow(el);
    function preset(T,q){i1.set(500);t1.set(1);i2.set(2);t2.set(20);i3.set(0.4);t3.set(2);iw.set(3);qt.set(q);Tp.set(T);resp.set(1);ram.set(false);fast.set(false);draw();}
    U.button(br,"5 節の例: 60 s ごと",function(){preset(60,42);});
    U.button(br,"1 s ごとに小さな仕事",function(){preset(1,0.1);});
    U.button(br,"1 ms ごと",function(){preset(0.001,0.05);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var nar=_w07_nar(box);
      var Is=[i1.get()*1e-6,i2.get()*1e-6,i3.get()*1e-6],tw=[t1.get()*1e-6,t2.get()*1e-6,t3.get()*1e-3],Iw=iw.get()*1e-3,Qt=qt.get()*1e-6,T=Tp.get();
      var Qw=Is.map(function(I,m){return Math.max(0,(Iw-I)*tw[m]);});
      /* 使えるか: 軽い眠りは、ほかが使えないときの最後の選択肢として、いつも残す */
      var ok=[true,!(fast.get()||resp.get()<tw[1]),!(fast.get()||ram.get()||resp.get()<tw[2])],tooSlow=resp.get()<tw[0];
      var Iavg=function(m,t){return Is[m]+(Qt+Qw[m])/t;};
      var tbe=function(a,b){var d=Is[a]-Is[b];if(d<=0)return Infinity;return (Qw[b]-Qw[a])/d;};
      var best=-1;[0,1,2].forEach(function(m){if(ok[m]&&(best<0||Iavg(m,T)<Iavg(best,T)))best=m;});
      var W=nar?400:700,o=[];
      var pw=nar?300:420,X0=1e-5,p=U.plot(70,16,pw,200,[X0,86400],[1e-7,1e-1],{xlog:true,ylog:true});
      o.push(p.axes({xl:"起きる周期 T",yl:"平均電流",xt:[1e-5,1e-3,1e-1,10,1000,86400],yt:[1e-7,1e-5,1e-3,1e-1],xfmt:function(v){return v===86400?"1 日":F.time(v,1);},yfmt:function(v){return F.cur(v,1);},ylOff:56}));
      [0,1,2].forEach(function(m){var pts=[];for(var k=0;k<=140;k++){var t=Math.pow(10,-5+k*(Math.log10(86400)+5)/140),v=Iavg(m,t);if(v>=1e-7&&v<=1e-1)pts.push([t,v]);}
        o.push(p.line(pts,COL[m],ok[m]?2.2:1.2,ok[m]?null:"4 4"));});
      [[0,1],[1,2]].forEach(function(ab){var t=tbe(ab[0],ab[1]);if(t>=X0&&t<=86400){var v=Iavg(ab[1],t);if(v>=1e-7&&v<=1e-1){o.push(S.L(p.X(t),p.Y(1e-7),p.X(t),p.Y(v),"alias",1,"3 3"));o.push(S.D(p.X(t),p.Y(v),"alias",3.5));}}});
      if(T>=X0&&T<=86400){o.push(S.L(p.X(T),p.y,p.X(T),p.y+p.h,"ink",1,"2 3"));if(best>=0)o.push(S.D(p.X(T),p.Y(Math.max(1e-7,Math.min(1e-1,Iavg(best,T)))),COL[best],5));}
      /* 凡例 */
      var lx=nar?70:p.x+pw+20,ly=nar?262:30;
      [0,1,2].forEach(function(m,i){var yy=nar?ly:ly+i*18,xx=nar?lx+i*110:lx;o.push(S.RECT(xx,yy-9,10,10,2,U.soft(COL[m]),COL[m],1));o.push(S.T(xx+15,yy,NM[m]+(ok[m]?"":"（使えない）"),"start",9.5,ok[m]?COL[m]:"muted",ok[m]));});
      /* 内訳の棒（いまの周期） */
      var bx=nar?70:p.x+pw+20,by=nar?300:100,bw=nar?310:W-bx-14;
      o.push(S.T(bx,by,"T = "+F.time(T)+" の平均電流と内訳の割合","start",10,"ink",true));
      [0,1,2].forEach(function(m,i){var yy=by+22+i*30,tot=Iavg(m,T),parts=[[Is[m],"green"],[Qt/T,"signal"],[Qw[m]/T,"alias"]],xx=bx,bw2=bw*0.62;
        o.push(S.T(bx,yy-3,NM[m]+" "+F.cur(tot)+(m===best?"（得）":""),"start",9,COL[m],m===best));
        parts.forEach(function(q){var w=bw2*q[0]/tot;o.push(S.RECT(xx,yy,Math.max(0.6,w),11,2,U.soft(q[1]),q[1],1));xx+=w;});});
      var lg=by+22+3*30-6;
      [["眠り","green"],["仕事","signal"],["起床","alias"]].forEach(function(q,i){o.push(S.RECT(bx+i*62,lg,9,9,2,U.soft(q[1]),q[1],1));o.push(S.T(bx+i*62+13,lg+8,q[0],"start",9,"muted"));});
      box.set(S.svg(W,nar?lg+18:Math.max(260,lg+18),o));
      var t12=tbe(0,1),t23=tbe(1,2),fmtT=function(t){return isFinite(t)?(t<=0?"0（どの長さでも深いほうが得）":F.time(t)):"なし（深いほうの電流が小さくない）";};
      var why=[];if(!ok[1])why.push("深い眠り");if(!ok[2])why.push("最も深い眠り");
      ro.innerHTML="起床の電荷 Q_w = (起床時間の間の電流 − 眠りの電流) × 起床時間: "+[0,1,2].map(function(m){return NM[m]+" "+U.sig(Qw[m]*1e6,3)+" µC";}).join("、")+"<br>"+
        "損益分岐の眠りの長さ: 軽い → 深い <b>"+fmtT(t12)+"</b>、深い → 最も深い <b>"+fmtT(t23)+"</b><br>"+
        (why.length?'<span class="warn">'+why.join("・")+" は、応える速さ・保つもの・動かす周辺回路の条件で使えない。</span><br>":"")+
        (tooSlow?'<span class="warn">軽い眠りの起床時間も、応えるまでに許される時間より長い。眠らずに待つ必要がある。</span><br>':"")+
        "T = "+F.time(T)+" で得な段階: <b>"+NM[best]+"</b>（平均電流 "+F.cur(Iavg(best,T))+"、CR2032 で "+_w07_life(220e-3/Iavg(best,T),U)+"） ・ "+
        [0,1,2].map(function(m){return NM[m]+" "+F.cur(Iavg(m,T));}).join("、")+
        '<div class="wnote">平均電流 = 眠りの電流 + (仕事の上乗せ + 起床の電荷) ÷ T（5 節）。周期が仕事と起床時間より短い所は、この式の外である。電池寿命は 220 mAh ÷ 平均電流。値はすべて例の値で、製品の値で確かめる。</div>';
    }
    draw();
  };

  /* ---- 6 節: 小さな電流を測る ---- */
  REG.w07_meter=function(el,U){
    var S=U.S,F=U.fmt,seed=3;
    var E=3.0,RIN=15,VBOR=2.2;
    U.head(el,"MEASURE","電流計・シャント抵抗と、平均をとる時間");
    var r1=U.ctrls(el);
    var how=U.select(r1,"測り方",["テスタの µA の範囲（中の抵抗 100 Ω）","テスタの mA の範囲（中の抵抗 1.8 Ω）","シャント抵抗と増幅器","範囲を自動で切り替える測定器"],0,draw);
    var rs=U.slider(r1,"シャント抵抗",{values:[0.1,1,10,100,1000],value:1,fmt:function(v){return v>=1000?"1 kΩ":v+" Ω";},onInput:draw});
    var ve=U.slider(r1,"増幅器の誤差",{values:[5,10,20,50,100,200,500],value:50,fmt:function(v){return v+" µV";},onInput:draw});
    var r2=U.ctrls(el);
    var is=U.slider(r2,"眠りの電流",{min:0.1,max:100,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var ip=U.slider(r2,"起きている間の電流",{min:0.5,max:50,log:true,value:10,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var tp=U.slider(r2,"起きている時間",{min:0.5,max:50,log:true,value:4.2,fmt:function(v){return F.time(v*1e-3);},onInput:draw});
    var r3=U.ctrls(el);
    var Tp=U.slider(r3,"起きる周期",{min:1,max:600,log:true,value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var Wn=U.slider(r3,"平均をとる時間 W",{min:1,max:3600,log:true,value:10,fmt:function(v){return F.time(v);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"6 節の例に戻す",function(){how.set(0);rs.set(1);ve.set(50);is.set(2);ip.set(10);tp.set(4.2);Tp.set(60);Wn.set(10);draw();});
    U.button(br,"W を周期の 5 倍にする",function(){Wn.set(5*Tp.get());draw();});
    U.button(br,"もう一度（平均を始める時刻を別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var nar=_w07_nar(box),h=how.get();
      rs.el.style.display=h===2?"":"none";ve.el.style.display=h===2?"":"none";
      var Rm=[100,1.8,rs.get(),0.05][h],Is=is.get()*1e-6,Ip=ip.get()*1e-3,tp_=tp.get()*1e-3,T=Tp.get(),W_=Wn.get();
      if(tp_>T)tp_=T;
      /* 眠りの電流の読みの誤差: テスタは表示の 1 桁（µA の範囲 0.1 µA、mA の範囲 10 µA）、シャントは誤差電圧 ÷ 抵抗、測定器は 1 % + 10 nA（どれも例の値） */
      var err=[0.1e-6+0.01*Is,10e-6+0.01*Is,ve.get()*1e-6/rs.get(),0.01*Is+10e-9][h];
      var Vwake=E-Ip*(RIN+Rm),reset=Vwake<VBOR,Vsl=Is*Rm;
      var Qe=(Ip-Is)*tp_,Itrue=Is+Qe/T;
      var R=U.rng(seed),t0=R.next()*T;
      /* 窓 [t0, t0+W] に入る起きている時間の長さ（周期 T、各周期の 0〜tp_ に起きる） */
      function inWin(a,b){var s=0,k0=Math.floor(a/T)-1,k1=Math.ceil(b/T)+1;for(var k=k0;k<=k1;k++){var x0=k*T,x1=k*T+tp_;s+=Math.max(0,Math.min(b,x1)-Math.max(a,x0));}return s;}
      var Imeas=Is+(Ip-Is)*inWin(t0,t0+W_)/W_;
      var Wd=nar?400:700,o=[];
      /* 上: 起きている間の機器の電圧 */
      var vx=nar?40:60,vw=nar?150:200,vy=26,vh=90,Y=function(v){return vy+vh-(v-1.0)/2.0*vh;};
      o.push(S.T(10,14,"起きている間の機器の電圧 [V]","start",10,"ink",true));
      o.push(S.W([vx,vy,vx,vy+vh,vx+vw,vy+vh],"muted",1));
      [1,2,3].forEach(function(v){o.push(S.L(vx-4,Y(v),vx,Y(v),"muted",1));o.push(S.T(vx-7,Y(v)+3.5,String(v),"end",9,"muted"));});
      var c=reset?"alias":"green";o.push(S.RECT(vx+30,Y(Math.max(1.0,Vwake)),60,vy+vh-Y(Math.max(1.0,Vwake)),2,U.soft(c),c,1.1));
      o.push(S.T(vx+96,Y(Math.max(1.0,Vwake))+4,U.fmt.fix(Vwake,2)+" V"+(reset?" リセット":""),"start",10,c,true,false,null,true));
      o.push(S.L(vx,Y(VBOR),vx+vw,Y(VBOR),"alias",1.1,"4 3"));o.push(S.T(vx+vw,Y(VBOR)-4,"BOR 2.2 V","end",9,"alias",true,false,null,true));
      /* 上右: 眠りの電流の読み */
      var rx=nar?10:330,ryy=nar?vy+vh+40:26;
      o.push(S.T(rx,nar?ryy-12:14,"眠りの電流の読み","start",10,"ink",true));
      var rel=err/Is,cc=rel<=0.1?"green":(rel<1?"gold":"alias");
      var lo=1e-8,hi=1e-3,lx0=rx+10,lx1=rx+(nar?370:350);
      [1e-8,1e-7,1e-6,1e-5,1e-4,1e-3].forEach(function(v){var x=_w07_lx(v,lo,hi,lx0,lx1);o.push(S.L(x,ryy+8,x,ryy+40,"grid",1));o.push(S.T(x,ryy+52,F.cur(v,1),"middle",8.5,"muted"));});
      var xa=_w07_lx(Math.max(lo,Is-err),lo,hi,lx0,lx1),xb=_w07_lx(Is+err,lo,hi,lx0,lx1),xi=_w07_lx(Is,lo,hi,lx0,lx1);
      o.push(S.RECT(xa,ryy+14,Math.max(2,xb-xa),18,3,U.soft(cc),cc,1));o.push(S.L(xi,ryy+10,xi,ryy+36,"ink",2));
      o.push(S.T(lx0,ryy+70,"本当の値 "+F.cur(Is)+"、読みの幅 ±"+F.cur(err)+"（"+(rel>=1?"読めない":"誤差 "+U.sig(rel*100,2)+" %")+"）","start",9.5,cc,true));
      /* 下: 電流と平均をとる時間 */
      var ty=nar?ryy+100:150,tx=60,twd=Wd-tx-20,span=Math.max(W_*1.25,2.2*T),Xt=function(t){return tx+t/span*twd;};
      var ly=function(I){return ty+70-(Math.log10(Math.max(I,1e-7))+7)/5*70;};
      o.push(S.T(10,ty-8,"電流（対数目盛）と、平均をとる時間","start",10,"ink",true));
      o.push(S.W([tx,ty,tx,ty+70,tx+twd,ty+70],"muted",1));
      [1e-6,1e-4,1e-2].forEach(function(v){o.push(S.T(tx-5,ly(v)+3,F.cur(v,1),"end",8.5,"muted"));o.push(S.L(tx,ly(v),tx+twd,ly(v),"grid",1));});
      o.push(S.RECT(Xt(t0),ty,Math.max(1.5,Xt(t0+W_)-Xt(t0)),70,0,U.soft("alias"),"alias",1));
      o.push(S.L(tx,ly(Is),tx+twd,ly(Is),"green",1.4));
      for(var k=0;k*T<=span;k++){var x=Xt(k*T);o.push(S.L(x,ly(Is),x,ly(Ip),"signal",2));}
      var nt=U.nice(0,span,5);nt.forEach(function(v){o.push(S.L(Xt(v),ty+70,Xt(v),ty+74,"muted",1));o.push(S.T(Xt(v),ty+86,U.sig(v,4)+" s","middle",8.5,"muted"));});
      box.set(S.svg(Wd,ty+96,o));
      var bound=Qe/W_,mult=Math.abs(W_/T-Math.round(W_/T))<1e-9;
      ro.innerHTML=(reset?'<span class="warn">起きている間に機器の電圧が '+U.fmt.fix(Vwake,2)+' V まで下がり、BOR（2.2 V）を割ってリセットする。測っている間だけ、機器は正しく動かない。</span><br>':"")+
        "起きている間: "+F.cur(Ip)+" × (電池の内部抵抗 15 Ω + 測る道具 "+(Rm<1?U.sig(Rm,2)+" Ω":Rm+" Ω")+") = "+U.fmt.fix(Ip*(RIN+Rm),3)+" V 下がる ・ 眠りの電流が測る道具に作る電圧 "+(Vsl<1e-3?U.sig(Vsl*1e6,3)+" µV":U.sig(Vsl*1e3,3)+" mV")+"<br>"+
        "1 回の上乗せの電荷 Q_e = "+U.sig(Qe*1e6,3)+" µC、本当の平均 <b>"+F.cur(Itrue)+"</b> ・ 長さ "+F.time(W_)+" の平均の読み <b>"+F.cur(Imeas)+"</b>（誤差の上限 Q_e ÷ W = "+F.cur(bound)+(mult?"。W が周期の整数倍なので誤差は 0":"")+"）"+
        '<div class="wnote">電池は起電力 3.0 V・内部抵抗 15 Ω。テスタの読みの幅は表示の最後の桁（µA の範囲 0.1 µA、mA の範囲 10 µA）と 1 %、範囲を自動で切り替える測定器は 1 % + 10 nA、中の抵抗 0.05 Ω とした（どれも例の値。計器の仕様書で確かめる）。平均を始める時刻は乱数で決めた。</div>';
    }
    draw();
  };
