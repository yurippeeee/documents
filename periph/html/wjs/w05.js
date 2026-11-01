  /* ===== 05 章 マイコンの電源まわり ===== */
  function _w05_life(h,U){var d=h/24;if(d>=365*30)return "30 年を超える";return d>=365?U.sig(d/365,3)+" 年":(d>=1?U.sig(d,3)+" 日":U.sig(h,3)+" 時間");}
  function _w05_v(v,d){return (+v).toFixed(d==null?2:d)+" V";}

  /* ---- 2 節: 静止電流と入力の平均電流 ---- */
  REG.w05_reg=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"QUIESCENT","静止電流と入力の平均電流 — LDO かスイッチング電源か");
    var r1=U.ctrls(el);
    var vin=U.slider(r1,"電池の電圧 V_in",{values:[1.5,2.4,3.0,3.3,3.6,3.7,4.2,5,9,12],value:3.6,fmt:function(v){return v+" V";},onInput:draw});
    var vout=U.slider(r1,"出力の電圧 V_out",{values:[1.2,1.8,2.5,3.0,3.3,5.0],value:1.8,fmt:function(v){return v+" V";},onInput:draw});
    var eta=U.slider(r1,"スイッチング電源の効率 η_0（静止電流の分を除く）",{min:0.6,max:0.98,step:0.01,value:0.9,fmt:function(v){return Math.round(v*100)+" %";},onInput:draw});
    var r2=U.ctrls(el);
    var iql=U.slider(r2,"LDO の静止電流 I_q,L",{min:0.05,max:100,log:true,value:1,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var iqs=U.slider(r2,"スイッチング電源の静止電流 I_q,S",{min:0.1,max:100,log:true,value:10,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var is=U.slider(r3,"眠りの電流 I_s",{min:0.1,max:100,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var ia=U.slider(r3,"起きている間の電流 I_a",{min:0.1,max:100,log:true,value:6,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var ta=U.slider(r3,"起きている時間 t_a",{min:0.001,max:10,log:true,value:0.02,fmt:function(v){return F.time(v);},onInput:draw});
    var r4=U.ctrls(el);
    var Tp=U.slider(r4,"起きる周期 T",{min:0.1,max:86400,log:true,value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var cap=U.slider(r4,"電池の容量",{values:[220,1000,2000,2400,3000],value:2400,fmt:function(v){return v+" mAh";},onInput:draw});
    var br=U.btnrow(el);
    function preset(T,a){vin.set(a&&a.vin||3.6);vout.set(a&&a.vout||1.8);eta.set(0.9);iql.set(1);iqs.set(a&&a.iqs||10);is.set(2);ia.set(6);ta.set(0.02);Tp.set(T);cap.set(2400);draw();}
    U.button(br,"2 節の例・T = 1 s",function(){preset(1);});
    U.button(br,"2 節の例・T = 60 s",function(){preset(60);});
    U.button(br,"静止電流 0.5 µA のスイッチング電源",function(){preset(60,{iqs:0.5});});
    U.button(br,"3.6 V から 3.3 V（k ≥ 1）",function(){preset(1,{vout:3.3});});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Vi=vin.get(),Vo=vout.get(),e0=eta.get(),qL=iql.get()*1e-6,qS=iqs.get()*1e-6,Is=is.get()*1e-6,Ia=ia.get()*1e-3,ta_=ta.get(),T=Tp.get(),C=cap.get();
      var warn="";
      if(ta_>T){warn+='<span class="warn">起きている時間が周期より長い。周期を t_a にして計算した。</span><br>';T=ta_;}
      var ldoOk=Vi>=Vo+0.2,k=Vo/(e0*Vi);
      var Iout=function(t){return Is+(Ia-Is)*Math.min(ta_,t)/t;};
      var IL=function(t){return Iout(t)+qL;},IS=function(t){return k*Iout(t)+qS;};
      /* 損得の境目: 差 = (qS − qL) − (1 − k) Iout は Iout について一次 */
      var d0=qS-qL,d1=1-k,Ist=null,Tst=null,shortBetter;
      if(Math.abs(d1)>1e-12){Ist=d0/d1;}
      if(Ist!==null&&Ist>Is&&Ist<Ia){Tst=(Ia-Is)*ta_/(Ist-Is);}
      shortBetter=(d0-d1*Ia)<0?"sw":"ldo";               /* 周期が短い（平均が I_a に近い）ときに得なほう */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[];
      /* グラフ: 周期と入力の平均電流 */
      var Ts=[],lo=Infinity,hi=0;for(var j=0;j<=120;j++){var t=Math.pow(10,-1+j*Math.log10(864000)/120);Ts.push(t);
        [IL(t),IS(t)].forEach(function(v){lo=Math.min(lo,v);hi=Math.max(hi,v);});}
      var y0=Math.pow(10,Math.floor(Math.log10(lo*0.8))),y1=Math.pow(10,Math.ceil(Math.log10(hi*1.2)));
      var pw=nar?310:360,p=U.plot(70,20,pw,200,[0.1,86400],[y0,y1],{xlog:true,ylog:true});
      var yt=[];for(var v=y0;v<=y1*1.0001;v*=10)yt.push(v);
      o.push(p.axes({xl:"起きる周期 T",yl:"入力の平均電流",xt:[0.1,1,10,100,1000,1e4,86400],yt:yt,xfmt:function(v){return v===86400?"1 日":(v>=1000?(v/1000)+"k s":v+" s");},yfmt:function(v){return F.cur(v,1);},ylOff:58}));
      if(ldoOk)o.push(p.line(Ts.map(function(t){return [t,IL(t)];}),"signal",2.2));
      o.push(p.line(Ts.map(function(t){return [t,IS(t)];}),"green",2.2));
      if(Tst&&Tst>=0.1&&Tst<=86400){o.push(S.L(p.X(Tst),p.Y(y0),p.X(Tst),p.Y(IL(Tst)),"alias",1,"3 3"));o.push(S.D(p.X(Tst),p.Y(IL(Tst)),"alias",4));
        o.push(S.T(p.X(Tst)+(p.X(Tst)>p.x+p.w-70?-6:6),p.Y(y0)-8,"T* = "+F.time(Tst),p.X(Tst)>p.x+p.w-70?"end":"start",9.5,"alias",true,false,null,true));}
      var tc=Math.max(0.1,Math.min(86400,T));
      if(ldoOk)o.push(S.D(p.X(tc),p.Y(IL(tc)),"signal",5));
      o.push(S.D(p.X(tc),p.Y(IS(tc)),"green",5));
      o.push(S.T(p.x+6,p.y+12,ldoOk?"LDO（青）":"LDO は作れない","start",9.5,ldoOk?"signal":"alias",true,false,null,true));
      o.push(S.T(p.x+6,p.y+26,"スイッチング電源（緑）","start",9.5,"green",true,false,null,true));
      /* 内訳の棒 */
      var bx=nar?20:470,by=nar?270:30,bw=nar?250:150,mx=Math.max(ldoOk?IL(T):0,IS(T));
      o.push(S.T(bx,by,"T = "+F.time(T)+" のときの内訳","start",10.5,"ink",true));
      var rows=[["LDO",ldoOk?Iout(T):0,ldoOk?qL:0,"signal"],["スイッチング",k*Iout(T),qS,"green"]];
      rows.forEach(function(r,i){var yy=by+16+i*46,a=r[1]/mx*bw,b=r[2]/mx*bw;
        o.push(S.T(bx,yy+12,r[0],"start",10,r[3],true));
        if(r[0]==="LDO"&&!ldoOk){o.push(S.T(bx,yy+30,"入力が出力 + 0.2 V より低い","start",9.5,"alias",true));return;}
        o.push(S.RECT(bx,yy+18,Math.max(a,0.6),16,2,U.soft(r[3]),r[3],1));o.push(S.RECT(bx+a,yy+18,Math.max(b,0.6),16,2,U.soft("gold"),"gold",1));
        o.push(S.T(bx+a+b+5,yy+31,F.cur(r[1]+r[2]),"start",9.5,r[3],true));});
      var ly=by+16+2*46+8;
      o.push(S.RECT(bx,ly-9,10,10,2,U.soft("gold"),"gold",1));o.push(S.T(bx+15,ly,"静止電流","start",9.5,"muted"));
      o.push(S.RECT(bx+80,ly-9,10,10,2,U.soft("signal"),"signal",1));o.push(S.T(bx+95,ly,"負荷の分","start",9.5,"muted"));
      box.set(S.svg(W,nar?ly+14:262,o));
      var lifeL=C*1e-3/IL(T),lifeS=C*1e-3/IS(T),better=!ldoOk?"sw":(IS(T)<IL(T)?"sw":"ldo");
      var cs;
      if(!ldoOk)cs="LDO は、入力が出力 + V_do（0.2 V とした）より低いので使えない。";
      else if(Tst)cs="I* = (I_q,S − I_q,L) ÷ (1 − k) = "+F.cur(Ist)+"、T* = (I_a − I_s) t_a ÷ (I* − I_s) = <b>"+F.time(Tst)+"</b>。T* より短い周期では"+(shortBetter==="sw"?"スイッチング電源":" LDO ")+"、長い周期では"+(shortBetter==="sw"?" LDO ":"スイッチング電源")+"が得。";
      else if(k>=1&&d0>=0)cs="k ≥ 1 で静止電流も LDO のほうが小さいので、どの周期でも LDO が得。";
      else if(k<1&&d0<=0)cs="k < 1 で静止電流もスイッチング電源のほうが小さいので、どの周期でもスイッチング電源が得。";
      else if(Ist!==null&&Ist<=Is)cs="I* = "+F.cur(Ist)+" が眠りの電流 I_s 以下なので、周期をいくら延ばしてもスイッチング電源が得。";
      else cs="この範囲では、どの周期でも"+(shortBetter==="sw"?"スイッチング電源":"LDO")+"が得。";
      ro.innerHTML=warn+"負荷の平均電流 I_out,avg = I_s + (I_a − I_s) t_a ÷ T = <b>"+F.cur(Iout(T))+"</b>、k = V_out ÷ (η_0 V_in) = "+U.sig(k,3)+"<br>"+
        (ldoOk?"LDO の入力: I_out,avg + I_q,L = <b>"+F.cur(IL(T))+"</b>（電池寿命 "+_w05_life(lifeL,U)+"）<br>":"")+
        "スイッチング電源の入力: k I_out,avg + I_q,S = "+F.cur(k*Iout(T))+" + "+F.cur(qS)+" = <b>"+F.cur(IS(T))+"</b>（電池寿命 "+_w05_life(lifeS,U)+"）<br>"+
        cs+" いまの周期では <b>"+(better==="sw"?"スイッチング電源":"LDO")+"</b> が得"+(ldoOk?"（"+U.sig(Math.max(IL(T),IS(T))/Math.min(IL(T),IS(T)),3)+" 倍の差）":"")+"。"+
        '<div class="wnote">電池寿命は、容量 ÷ 入力の平均電流で求めた。自己放電（03 章 5 節）と、電池の電圧が下がることは含めていない。電流と静止電流は例の値で、実際は製品のデータシートで確かめる。</div>';
    }
    draw();
  };

  /* ---- 3 節: 負荷スイッチの突入電流 ---- */
  /* 回路: 電池（E, Rin）→ マイコンの側（CA、マイコンの電流 Im）→ 負荷スイッチ（オン抵抗 Ron）→ 周辺の側（CL）。
     trise = 0 は一気に入れる。trise > 0 は、周辺の側の電圧を傾き E/trise の直線に沿わせる（流せる電流はオン抵抗で決まる上限まで）。
     線形の部分は後退オイラー法で解く（時間刻みが大きくても発散しない）。 */
  function _w05_isim(E,Rin,CA,CL,Im,tr,tend,N){
    var Ron=0.1,dt=tend/N,va=Math.max(0,E-Rin*Im),vb=0,S=tr>0?E/tr:0,tc=Math.max(2e-6,3*dt),out=[];
    for(var k=0;k<=N;k++){
      var t=k*dt,isw,ib=(E-va)/Rin;
      out.push([t,va,vb,0,ib]);
      if(k===N)break;
      var want=tr>0?((S*t<va?CL*S:0)+(Math.min(S*t,10)-vb)*CL/tc):Infinity;
      var imax=Math.max(0,(va-vb)/Ron);
      if(want>=imax){ /* スイッチが入りきっている: 抵抗 Ron として 2 つの節点を同時に解く */
        var a11=CA/dt+1/Rin+1/Ron,a12=-1/Ron,b1=CA/dt*va+E/Rin-Im,a21=-1/Ron,a22=CL/dt+1/Ron,b2=CL/dt*vb;
        var det=a11*a22-a12*a21,nva=(b1*a22-a12*b2)/det,nvb=(a11*b2-a21*b1)/det;
        isw=(nva-nvb)/Ron;va=nva;vb=nvb;
      }else{
        isw=Math.max(0,want);
        va=(CA/dt*va+E/Rin-Im-isw)/(CA/dt+1/Rin);vb+=isw*dt/CL;
      }
      if(va<0)va=0;
      out[out.length-1][3]=isw;
    }
    return out;
  }
  var _w05_SRC=[["新しい CR2032（3.0 V・15 Ω）",3.0,15],["使い終わりの CR2032・寒い所（2.8 V・100 Ω）",2.8,100],["単 3 形アルカリ 2 本（3.0 V・0.4 Ω）",3.0,0.4],["自分で決める",null,null]];
  REG.w05_inrush=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"INRUSH","負荷スイッチの突入電流 — マイコンの電圧はどこまで落ちるか");
    var r1=U.ctrls(el);
    var src=U.select(r1,"電源",_w05_SRC.map(function(s){return s[0];}),0,function(){var s=_w05_SRC[src.get()];if(s[1]!==null){E.set(s[1]);R.set(s[2]);}draw();});
    var E=U.slider(r1,"起電力 E",{min:2.0,max:5.5,step:0.05,value:3.0,fmt:function(v){return _w05_v(v);},onInput:function(){src.set(3);draw();}});
    var R=U.slider(r1,"内部抵抗 R_in",{min:0.1,max:300,log:true,value:15,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:function(){src.set(3);draw();}});
    var r2=U.ctrls(el);
    var CA=U.slider(r2,"マイコンの側の容量 C_A",{min:1,max:1000,log:true,value:10,fmt:function(v){return U.sig(v,3)+" µF";},onInput:draw});
    var CL=U.slider(r2,"周辺の側の容量 C_L",{min:0.1,max:1000,log:true,value:10,fmt:function(v){return U.sig(v,3)+" µF";},onInput:draw});
    var tr=U.slider(r2,"立ち上がりの時間 t_rise",{values:[0,0.01,0.03,0.1,0.3,0.69,1,3,10,14,30,100],value:0,fmt:function(v){return v?F.time(v*1e-3):"0（一気に入れる）";},onInput:draw});
    var r3=U.ctrls(el);
    var Im=U.slider(r3,"マイコンの電流 I_m",{min:0.1,max:30,log:true,value:3,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Vm=U.slider(r3,"マイコンが動く最低の電圧 V_min",{min:1.6,max:3.2,step:0.05,value:2.2,fmt:function(v){return _w05_v(v);},onInput:draw});
    var br=U.btnrow(el);
    function preset(s,ca,cl,t){src.set(s);E.set(_w05_SRC[s][1]);R.set(_w05_SRC[s][2]);CA.set(ca);CL.set(cl);tr.set(t);Im.set(3);Vm.set(2.2);draw();}
    U.button(br,"3 節 (a) 一気に入れる",function(){preset(0,10,10,0);});
    U.button(br,"3 節 (b) 1 ms で",function(){preset(0,10,10,1);});
    U.button(br,"古い電池で 1 ms",function(){preset(1,10,10,1);});
    U.button(br,"古い電池で 14 ms",function(){preset(1,10,10,14);});
    U.button(br,"大容量コンデンサ 100 µF を足して一気に",function(){preset(0,110,10,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var e=E.get(),r=R.get(),ca=CA.get()*1e-6,cl=CL.get()*1e-6,t_r=tr.get()*1e-3,im=Im.get()*1e-3,vm=Vm.get();
      var tau=r*(ca+cl),tend=Math.min(0.5,Math.max(2e-4,1.6*t_r+5*tau));
      var res=_w05_isim(e,r,ca,cl,im,t_r,tend,8000);
      var vmin=Infinity,tmin=0,below=0,ipk=0,ibpk=0,dt=tend/8000;
      res.forEach(function(q,i){if(q[1]<vmin){vmin=q[1];tmin=q[0];}if(q[1]<vm)below+=dt;if(i>0)ipk=Math.max(ipk,q[3]);ibpk=Math.max(ibpk,q[4]);});
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[],pw=nar?320:560,x0=nar?62:80;
      var tu=tend<2e-3?1e6:1e3,un=tu===1e6?"µs":"ms",tx=U.nice(0,tend*tu,5);
      var pv=U.plot(x0,16,pw,140,[0,tend*tu],[0,Math.max(e,3.2)*1.05]);
      o.push(pv.axes({yl:"電圧 [V]",xt:tx,yt:U.nice(0,Math.max(e,3.2),4),xfmt:function(){return "";},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      o.push(pv.line([[0,vm],[tend*tu,vm]],"alias",1.1,"5 3"));
      o.push(S.T(pv.x+pv.w-4,pv.Y(vm)+13,"V_min "+_w05_v(vm),"end",9.5,"alias",false,false,null,true));
      var step=Math.max(1,Math.floor(res.length/1500));
      var pts=function(ix,sc,cap){var a=[];for(var i=0;i<res.length;i+=step)a.push([res[i][0]*tu,Math.min(res[i][ix]*sc,cap)]);return a;};
      o.push(pv.line(pts(2,1,99),"purple",1.8));o.push(pv.line(pts(1,1,99),"signal",2.2));
      o.push(S.D(pv.X(tmin*tu),pv.Y(vmin),vmin<vm?"alias":"green",4.5));
      var ymax=Math.max(ibpk,t_r>0?ipk:ibpk)*1e3*1.15||1,cap=ymax;
      var pi=U.plot(x0,196,pw,90,[0,tend*tu],[0,ymax]);
      o.push(pi.axes({xl:"時間 ["+un+"]",yl:"電流 [mA]",xt:tx,yt:U.nice(0,ymax,3),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      o.push(pi.line(pts(3,1e3,cap),"purple",1.6));o.push(pi.line(pts(4,1e3,cap),"gold",2));
      if(t_r===0)o.push(S.T(pi.x+8,pi.y+12,"↑ スイッチの電流のピークは A の桁（軸の外）","start",9,"purple",true,false,null,true));
      var ly=330;
      [["signal","マイコンの側 V_A"],["purple","周辺の側 V_B・スイッチの電流"],["gold","電池の電流"]].forEach(function(l,i){var xx=nar?10:20+i*200,yy=nar?ly+i*16:ly;
        o.push(S.RECT(xx,yy-9,10,10,2,U.soft(l[0]),l[0],1));o.push(S.T(xx+15,yy,l[1],"start",9.5,"muted"));});
      box.set(S.svg(W,nar?ly+40:ly+8,o));
      var den=e-r*im-vm-0.1,need=den>0?r*cl*e/den:Infinity,reset=vmin<vm;
      ro.innerHTML=(t_r>0?"突入電流 C_L V ÷ t_rise ≈ "+F.cur(cl*e/t_r)+"、":"一気に入れる（電荷の分け合いで V_A は "+_w05_v((e-r*im)*ca/(ca+cl))+" まで落ちる計算）、")+
        "マイコンの側の最低 <b>"+_w05_v(vmin)+"</b>（"+F.time(tmin)+" で）、電池の電流の最大 "+F.cur(ibpk)+"<br>"+
        (reset?'<span class="warn">V_min を '+F.time(below)+' 下回り、マイコンはリセットされる</span>':'<span class="ok">V_min を下回らない</span>')+"<br>"+
        "余裕 0.1 V を残すのに要る立ち上がりの時間（3 節の式）: t_rise ≥ R_in C_L E ÷ (E − R_in I_m − V_min − 0.1) = "+(den>0?"<b>"+F.time(need)+"</b>":'<span class="warn">分母が 0 以下で、どれだけゆっくり入れても足りない</span>')+
        "（C_A が電荷を出す分、実際の落ち込みは式より小さい）"+
        '<div class="wnote">負荷スイッチのオン抵抗は 0.1 Ω、周辺は立ち上がりの間は電流を使わないとした。一気に入れたときのスイッチの電流のピークは、配線の抵抗とスイッチの入る速さで決まり、この模型では正しく求まらない。値はすべて例の値。</div>';
    }
    draw();
  };

  /* ---- 5 節: BOR とリセットの繰り返し ---- */
  /* 状態: rst（リセット中）→ por（t_POR を待つ）→ boot（起動の処理 1 ms）→ run（動く）。backoff なら BOR からの起動の後に slp（眠る）を挟む。
     どの状態でも、V が V_BOR を下回ったら rst に戻る（rst 以外から移ったら BOR 1 回）。電圧は後退オイラー法で解く。 */
  function _w05_bsim(o){
    var N=60000,dt=o.tend/N,v=o.Vb,st="rst",tt=0,streak=0,cb=true,sleep=0,resets=0,q=0,tr=[];
    for(var k=0;k<N;k++){
      var I=(st==="rst"||st==="por")?o.Irst:(st==="slp"?o.Islp:o.Irun);
      if(st!=="rst"&&v<o.Vb){st="rst";resets++;cb=true;tt=0;}
      else if(st==="rst"&&v>o.Vb+o.Vh){st="por";tt=0;}
      else if(st==="por"&&tt>=o.tpor){st="boot";tt=0;}
      else if(st==="boot"&&tt>=1e-3){if(o.bo&&cb){streak=Math.min(streak+1,9);sleep=0.05*Math.pow(2,streak-1);st="slp";}else{streak=0;st="run";}cb=false;tt=0;}
      else if(st==="slp"&&tt>=sleep){st="run";tt=0;}
      var nv=(o.C/dt*v+o.E/o.R-I)/(o.C/dt+1/o.R);
      q+=(o.E-nv)/o.R*dt;v=nv;tt+=dt;
      if(k%20===0)tr.push([k*dt,v,st]);
    }
    return {n:resets,iav:q/o.tend,tr:tr};
  }
  REG.w05_bor=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BOR","BOR のしきい値・ヒステリシスとリセットの繰り返し");
    var r1=U.ctrls(el);
    var E=U.slider(r1,"電池の起電力 E",{min:2.0,max:3.2,step:0.01,value:2.45,fmt:function(v){return _w05_v(v);},onInput:draw});
    var R=U.slider(r1,"内部抵抗 R_in",{min:1,max:300,log:true,value:100,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var C=U.slider(r1,"電源の線の容量",{min:1,max:1000,log:true,value:100,fmt:function(v){return U.sig(v,3)+" µF";},onInput:draw});
    var r2=U.ctrls(el);
    var Irun=U.slider(r2,"動いている間の電流 I_run",{min:0.3,max:20,log:true,value:3,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Irst=U.slider(r2,"リセット中の電流 I_rst",{min:0.01,max:1,log:true,value:0.1,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var r3=U.ctrls(el);
    var Vb=U.slider(r3,"BOR のしきい値 V_BOR",{min:1.8,max:2.8,step:0.05,value:2.2,fmt:function(v){return _w05_v(v);},onInput:draw});
    var Vh=U.slider(r3,"ヒステリシス V_hys",{min:0.02,max:0.5,step:0.01,value:0.1,fmt:function(v){return U.sig(v*1000,3)+" mV";},onInput:draw});
    var tp=U.slider(r3,"待ち時間 t_POR",{min:0.5,max:20,log:true,value:2,fmt:function(v){return F.time(v*1e-3);},onInput:draw});
    var r4=U.ctrls(el);
    var bo=U.checkbox(r4,"BOR から起動したら眠り、BOR が続くたびに眠る時間を 2 倍にする（50 ms から 12.8 s まで）",false,draw);
    var win=U.select(r4,"表示する時間",["0.1 秒","1 秒","10 秒"],0,draw);
    var br=U.btnrow(el);
    function preset(e,r,h,b,w){E.set(e);R.set(r);C.set(100);Irun.set(3);Irst.set(0.1);Vb.set(2.2);Vh.set(h);tp.set(2);bo.set(b);win.set(w);draw();}
    U.button(br,"5 節 (a) 繰り返す",function(){preset(2.45,100,0.1,false,0);});
    U.button(br,"5 節 (b) 眠る時間を延ばす",function(){preset(2.45,100,0.1,true,1);});
    U.button(br,"ヒステリシス 0.35 V",function(){preset(2.45,100,0.35,false,0);});
    U.button(br,"新しい電池（3.0 V・15 Ω）",function(){preset(3.0,15,0.1,false,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var o_={E:E.get(),R:R.get(),C:C.get()*1e-6,Irun:Irun.get()*1e-3,Irst:Irst.get()*1e-3,Vb:Vb.get(),Vh:Vh.get(),tpor:tp.get()*1e-3,bo:bo.get(),Islp:2e-6,tend:[0.1,1,10][win.get()]};
      var r=_w05_bsim(o_),sc=o_.tend<=0.1?1e3:(o_.tend<=1?1e3:1),un=sc===1e3?"ms":"s";
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[],pw=nar?320:560,x0=nar?62:80;
      var lo=Math.min(o_.Vb-0.15,o_.E-o_.R*o_.Irun-0.05),hi=Math.max(o_.Vb+o_.Vh+0.1,o_.E+0.05);
      var p=U.plot(x0,16,pw,170,[0,o_.tend*sc],[lo,hi]);
      o.push(p.axes({xl:"時間 ["+un+"]",yl:"電源電圧 [V]",xt:U.nice(0,o_.tend*sc,5),yt:U.nice(lo,hi,5),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      var hl=[[o_.Vb,"alias","V_BOR"],[o_.Vb+o_.Vh,"gold","V_BOR + V_hys"],[o_.E-o_.R*o_.Irst,"faint","E − R_in I_rst"],[o_.E-o_.R*o_.Irun,"faint","E − R_in I_run"]];
      hl.forEach(function(h,i){if(h[0]<lo||h[0]>hi)return;o.push(p.line([[0,h[0]],[o_.tend*sc,h[0]]],h[1],1.1,"5 3"));
        var left=i>=2,dy=(i===0||i===3)?12:-4;
        o.push(S.T(left?p.x+4:p.x+p.w-4,p.Y(h[0])+dy,h[2]+" "+_w05_v(h[0]),left?"start":"end",9,h[1]==="faint"?"muted":h[1],false,false,null,true));});
      o.push(p.line(r.tr.map(function(q){return [q[0]*sc,q[1]];}),"signal",1.6));
      /* 状態の帯 */
      var yb=p.y+p.h+38,prev=null,t0=0;
      var put=function(a,b,g){var c={rst:"alias",run:"signal",slp:"green"}[g];o.push(S.RECT(p.X(a*sc),yb,Math.max(p.X(b*sc)-p.X(a*sc),0.6),12,1,U.soft(c),c,0.8));};
      r.tr.forEach(function(q){var g=(q[2]==="rst"||q[2]==="por")?"rst":(q[2]==="slp"?"slp":"run");if(g!==prev){if(prev)put(t0,q[0],prev);prev=g;t0=q[0];}});
      if(prev)put(t0,o_.tend,prev);
      o.push(S.T(p.x-8,yb+10,"状態","end",9.5,"muted"));
      var ly=yb+34;
      [["alias","リセット"],["signal","動く"],["green","眠る"]].forEach(function(l,i){var xx=x0+i*100;o.push(S.RECT(xx,ly-9,10,10,2,U.soft(l[0]),l[0],1));o.push(S.T(xx+15,ly,l[1],"start",9.5,"muted"));});
      box.set(S.svg(W,ly+8,o));
      var a=o_.Vb+o_.Vh+o_.R*o_.Irst,b=o_.Vb+o_.R*o_.Irun,inWin=o_.E>a&&o_.E<b,need=o_.R*(o_.Irun-o_.Irst);
      ro.innerHTML="リセットを繰り返す E の範囲: V_BOR + V_hys + R_in I_rst = "+_w05_v(a)+" ＜ E ＜ V_BOR + R_in I_run = "+_w05_v(b)+
        (a<b?"（いまの E = "+_w05_v(o_.E)+" は"+(inWin?'<span class="warn">範囲の中</span>':"範囲の外")+"）":"（範囲が無い: V_hys ≥ R_in (I_run − I_rst) = "+U.sig(need*1000,3)+" mV）")+"<br>"+
        "リセットの回数 <b>"+r.n+" 回</b>（"+F.time(o_.tend)+" の間）、電池の平均の電流 <b>"+F.cur(r.iav)+"</b>"+
        (o_.E<=o_.Vb+o_.Vh+o_.R*o_.Irst?" ・ リセットが解けない（電池の電圧が V_BOR + V_hys に届かない）":"")+
        '<div class="wnote">起動の処理は 1 ms（I_run）、眠っている間は 2 µA とした。ここでの「動く」は、動き続ける仕事（例: 受信を続ける）を表す。値はすべて例の値で、しきい値の働き方の細部は製品による。</div>';
    }
    draw();
  };
