  /* ===== 08 章 センサをつなぐ ===== */
  function _w08_bin(v){var s=(v>>>0).toString(2);while(s.length<8)s="0"+s;return s;}
  function _w08_logrange(vals){var lo=Infinity,hi=0;vals.forEach(function(v){if(v>0&&isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}});
    return [Math.pow(10,Math.floor(Math.log10(lo)-1e-9)),Math.pow(10,Math.ceil(Math.log10(hi)+1e-9))];}

  /* ---- 3 節: センサの電源を入れたままにするか、測るときだけ入れるか ---- */
  REG.w08_gate=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"POWER GATING","センサの電源: 入れたまま待機させるか、測るときだけ入れるか");
    var r1=U.ctrls(el);
    var Tp=U.slider(r1,"測る周期 T",{min:1,max:3600,value:60,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var Isb=U.slider(r1,"センサの待機の電流 I_sb",{min:0.05,max:1000,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r2=U.ctrls(el);
    var Im=U.slider(r2,"測る間の電流 I_m",{min:0.05,max:50,value:0.6,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var tm=U.slider(r2,"測る時間 t_m",{min:0.0001,max:10,value:0.01,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var r3=U.ctrls(el);
    var tsu=U.slider(r3,"起動時間 t_su",{min:0.0001,max:300,value:0.002,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var Isu=U.slider(r3,"起動の間の電流 I_su",{min:0.01,max:100,value:0.3,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var r4=U.ctrls(el);
    var CL=U.slider(r4,"入口のコンデンサ C_L",{values:[0.1,0.47,1,2.2,4.7,10,22,47,100],value:1,fmt:function(v){return v+" µF";},onInput:draw});
    var Qc=U.slider(r4,"設定の書き直し Q_cfg",{values:[0,0.1,0.2,0.4,1,2,5],value:0.4,fmt:function(v){return v+" µC";},onInput:draw});
    var Ioff=U.slider(r4,"漏れ電流 I_off",{values:[0.01,0.02,0.05,0.1,0.2,0.5,1],value:0.05,fmt:function(v){return v+" µA";},onInput:draw});
    var r5=U.ctrls(el);
    var busy=U.checkbox(r5,"起動を待つ間、マイコンは起きて待つ（3 mA）",false,draw);
    var br=U.btnrow(el);
    function preset(a){Tp.set(a[0]);Isb.set(a[1]);Im.set(a[2]);tm.set(a[3]);tsu.set(a[4]);Isu.set(a[5]);CL.set(a[6]);Qc.set(a[7]);Ioff.set(0.05);busy.set(false);draw();}
    U.button(br,"3 節の例（待機 2 µA）",function(){preset([60,2,0.6,0.01,0.002,0.3,1,0.4]);});
    U.button(br,"3 節の例（待機 0.2 µA）",function(){preset([60,0.2,0.6,0.01,0.002,0.3,1,0.4]);});
    U.button(br,"レギュレータと LED を載せたモジュール（例）",function(){preset([60,300,1.5,0.01,0.005,1,10,0.4]);});
    U.button(br,"温めるのに時間のかかるセンサ（例）",function(){preset([600,20,20,1,30,20,10,0.4]);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var T=Tp.get(),isb=Isb.get()*1e-6,im=Im.get()*1e-3,t_m=tm.get(),t_su=tsu.get(),isu=Isu.get()*1e-3,cl=CL.get()*1e-6,qcfg=Qc.get()*1e-6,ioff=Ioff.get()*1e-6;
      var V=3.0,qin=cl*V,qsu=isu*t_su,qw=busy.get()?3e-3*t_su:0,Qon=qin+qsu+qcfg+qw;
      var IA=function(TT){return isb+(im-isb)*t_m/TT;},IB=function(TT){return ioff+(Qon+im*t_m)/TT;};
      var Tbe=isb>ioff?(Qon+isb*t_m)/(isb-ioff):Infinity;
      var W=700,o=[],xr=[1,1e4];
      var samp=[];for(var k=0;k<=80;k++){var tt=Math.pow(10,k/20);samp.push(IA(tt),IB(tt));}
      var yr=_w08_logrange(samp.concat([IA(T),IB(T)]));
      var p=U.plot(80,22,430,200,xr,yr,{xlog:true,ylog:true});
      o.push(p.axes({xl:"測る周期 T",yl:"センサの平均電流",xt:[1,10,100,1000,1e4],xfmt:function(v){return v<1e4?v+" s":"10⁴ s";},yfmt:function(v){return F.cur(v,1);},ylOff:58}));
      var la=[],lb=[];for(var j=0;j<=80;j++){var t2=Math.pow(10,j/20);la.push([t2,IA(t2)]);lb.push([t2,IB(t2)]);}
      o.push(p.line(la,"purple",2.2));o.push(p.line(lb,"signal",2.4));
      if(Tbe>=1&&Tbe<=1e4){var yb=IA(Tbe);o.push(S.L(p.X(Tbe),p.Y(yr[0]),p.X(Tbe),p.Y(yb),"faint",1,"3 3"));o.push(S.D(p.X(Tbe),p.Y(yb),"alias",4.5));
        o.push(S.T(p.X(Tbe)+(p.X(Tbe)>430?-6:6),p.Y(yr[0])-7,"T_be = "+F.time(Tbe),p.X(Tbe)>430?"end":"start",9.5,"alias",true,false,null,true));}
      o.push(S.L(p.X(T),p.Y(yr[0]),p.X(T),p.Y(yr[1]),"faint",1,"2 3"));
      o.push(S.D(p.X(T),p.Y(IA(T)),"purple",5));o.push(S.D(p.X(T),p.Y(IB(T)),"signal",5));
      o.push(S.T(p.x+p.w+10,40,"A: 入れたまま","start",10,"purple",true));o.push(S.T(p.x+p.w+10,56,F.cur(IA(T)),"start",10,"purple"));
      o.push(S.T(p.x+p.w+10,84,"B: 測るときだけ","start",10,"signal",true));o.push(S.T(p.x+p.w+10,100,F.cur(IB(T)),"start",10,"signal"));
      o.push(S.T(p.x+p.w+10,128,"点: いまの周期","start",9,"muted"));
      /* 1 周期の電荷の内訳 */
      var QA=[[isb*Math.max(T-t_m,0),"purple","待機"],[im*t_m,"gold","測る"]];
      var QB=[[ioff*T,"teal","漏れ"],[qin,"alias","突入"],[qsu,"green","起動"],[qw,"muted","待つ間のマイコン"],[qcfg,"purple","設定"],[im*t_m,"gold","測る"]];
      var sum=function(a){return a.reduce(function(s,x){return s+x[0];},0);};
      var qa=sum(QA),qb=sum(QB),qm=Math.max(qa,qb),bx=150,bw=460,y0=268;
      o.push(S.T(14,y0-12,"1 周期の電荷の内訳","start",10.5,"ink",true));
      [[QA,"A: 入れたまま","purple",qa],[QB,"B: 測るときだけ","signal",qb]].forEach(function(r,i){var y=y0+i*30,xx=bx;
        o.push(S.T(bx-8,y+13,r[1],"end",9.5,r[2],true));
        r[0].forEach(function(s){if(s[0]<=0)return;var w=bw*s[0]/qm;o.push(S.RECT(xx,y,Math.max(w,0.6),18,2,U.soft(s[1]),s[1],1));
          if(w>58)o.push(S.T(xx+w/2,y+13,s[2],"middle",9,s[1],true));xx+=w;});
        o.push(S.T(xx+6,y+13,U.sig(r[3]*1e6,3)+" µC","start",9.5,"ink",true));});
      box.set(S.svg(W,y0+66,o));
      var better=IB(T)<IA(T);
      var warn=(t_su+t_m>T)?'<span class="warn">起動時間と測る時間の和が周期より長い。切る場合は、電源を切る間が無い（式のまま計算した）。</span><br>':"";
      ro.innerHTML=warn+"起動の電荷 Q_on = C_L V + I_su t_su + Q_cfg"+(qw?" + マイコンの待ち":"")+" = "+U.sig(qin*1e6,3)+" + "+U.sig(qsu*1e6,3)+" + "+U.sig(qcfg*1e6,3)+(qw?" + "+U.sig(qw*1e6,3):"")+" = <b>"+U.sig(Qon*1e6,3)+" µC</b><br>"+
        "損益分岐の周期 T_be = (Q_on + I_sb t_m) ÷ (I_sb − I_off) = <b>"+(isFinite(Tbe)?F.time(Tbe):"なし（待機の電流が漏れ電流以下）")+"</b><br>"+
        "いまの周期 "+F.time(T)+" で、A（入れたまま）"+F.cur(IA(T))+"、B（測るときだけ）"+F.cur(IB(T))+" → "+(better?'<span class="ok">切るほうが得</span>（'+U.sig(IA(T)/IB(T),3)+" 倍小さい）":'<span class="warn">入れたままのほうが得</span>')+"<br>"+
        "切る場合は、測るたびに起動時間 "+F.time(t_su)+" だけ遅れる"+(t_su>1?'（<span class="warn">欲しいときに値が無いことがある</span>）':"")+
        '<div class="wnote">電源の電圧は 3.0 V とした。B の漏れ電流は周期の全体に流れるとみなした。値はすべて例の値で、実際の値はデータシートで確かめる。</div>';
    }
    draw();
  };

  /* ---- 5 節: プルアップ抵抗と立ち上がり時間 ---- */
  REG.w08_rise=function(el,U){
    var S=U.S,F=U.fmt,K=Math.log(7/3);
    var MODES=[{n:"Standard-mode（100 kHz）",f:100e3,tr:1000e-9,cb:400e-12,iol:3e-3},
               {n:"Fast-mode（400 kHz）",f:400e3,tr:300e-9,cb:400e-12,iol:3e-3},
               {n:"Fast-mode Plus（1 MHz）",f:1e6,tr:120e-9,cb:550e-12,iol:20e-3}];
    var VDDS=[3.0,3.3,5.0];
    U.head(el,"PULL-UP","I2C のプルアップ抵抗と立ち上がり時間");
    var r1=U.ctrls(el);
    var R=U.slider(r1,"プルアップ抵抗 R_p",{min:0.1,max:50,value:2.2,log:true,fmt:function(v){return v<1?Math.round(v*1000)+" Ω":U.sig(v,3)+" kΩ";},onInput:draw});
    var C=U.slider(r1,"バス容量 C_b",{min:10,max:600,value:100,log:true,int:true,fmt:function(v){return v+" pF";},onInput:draw});
    var r2=U.ctrls(el);
    var md=U.select(r2,"速さの区分",MODES.map(function(m){return m.n;}),1,draw);
    var vd=U.select(r2,"電源の電圧 V_DD",VDDS.map(function(v){return v.toFixed(1)+" V";}),0,draw);
    var br=U.btnrow(el);
    U.button(br,"5 節の例（2.2 kΩ・100 pF）",function(){R.set(2.2);C.set(100);md.set(1);vd.set(0);draw();});
    U.button(br,"マイコンの内蔵プルアップ（40 kΩ。例）",function(){R.set(40);draw();});
    U.button(br,"2.2 kΩ のモジュールを 3 枚つないだ（733 Ω）",function(){R.set(0.733);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var m=MODES[md.get()],Vdd=VDDS[vd.get()],Rp=R.get()*1e3,Cb=C.get()*1e-12,tau=Rp*Cb,tr=K*tau;
      var Rmin=(Vdd-0.4)/m.iol,Rmax=m.tr/(K*Cb),okR=tr<=m.tr,okI=Rp>=Rmin,okC=Cb<=m.cb;
      var P=1/m.f,half=P/2,tend=2.5*P,W=700,o=[];
      /* SCL の波形: L（マスタが引く）→ 離す（RC で上がる）を繰り返す */
      var p=U.plot(64,22,400,170,[0,tend*1e9],[0,Vdd*1.08]);
      o.push(p.axes({xl:"時間 [ns]",yl:"SCL の電圧 [V]",yfmt:function(v){return U.sig(v,2);},xfmt:function(v){return String(Math.round(v));},ylOff:42}));
      [[0.3,"0.3 V_DD"],[0.7,"0.7 V_DD"]].forEach(function(q){o.push(p.line([[0,q[0]*Vdd],[tend*1e9,q[0]*Vdd]],"muted",1.1,"5 4"));
        o.push(S.T(p.x+p.w-4,p.Y(q[0]*Vdd)-4,q[1],"end",9,"muted",false,false,null,true));});
      var pts=[],v=0,N=600,dt=tend/N,tf=Math.min(10e-9,half/20);
      for(var i=0;i<=N;i++){var t=i*dt,ph=t%P;
        if(ph<half){v=Math.max(0,v-(dt/tf)*Vdd);} else {v=Vdd-(Vdd-v)*Math.exp(-dt/tau);}
        pts.push([t*1e9,v]);}
      o.push(p.line(pts,okR?"green":"alias",2.2));
      /* 最初に離した所で、30 % と 70 % を通る時刻 */
      var t30=half+tau*Math.log(1/0.7),t70=half+tau*Math.log(1/0.3),reach=t70<P;
      if(t30<P){o.push(S.D(p.X(t30*1e9),p.Y(0.3*Vdd),"ink",3.2));}
      if(reach){o.push(S.D(p.X(t70*1e9),p.Y(0.7*Vdd),"ink",3.2));
        o.push(S.T(p.X(t70*1e9)+6,p.Y(0.7*Vdd)+14,"t_r = "+F.time(tr),"start",9.5,okR?"green":"alias",true,false,null,true));}
      else o.push(S.T(p.X(half*1e9)+6,p.Y(0.5*Vdd),"H と読める電圧まで上がらない","start",9.5,"alias",true,false,null,true));
      /* 右: 使える抵抗の範囲 */
      var q=U.plot(540,22,140,170,[10,1000],[100,1e5],{xlog:true,ylog:true});
      o.push(q.axes({xt:[10,100,1000],yt:[100,1e3,1e4,1e5],xfmt:function(v){return String(v);},yfmt:function(v){return v>=1000?(v/1000)+"k":String(v);}}));
      o.push(S.T(q.x+q.w/2,q.y+q.h+31,"C_b [pF]","middle",9.5,"muted"));
      o.push(S.T(q.x-34,q.y+q.h/2,"R_p [Ω]","middle",9.5,"muted",false,false,-90));
      var cs=[];for(var k2=0;k2<=40;k2++){var cc=10*Math.pow(10,k2/20);var rr=m.tr/(K*cc*1e-12);if(rr>=100&&rr<=1e5)cs.push([cc,rr]);}
      o.push(q.line(cs,"signal",1.8));
      if(Rmin>=100)o.push(q.line([[10,Rmin],[1000,Rmin]],"ink",1.2,"5 3"));
      o.push(q.line([[m.cb*1e12,100],[m.cb*1e12,1e5]],"muted",1,"3 3"));
      var px=Math.min(1000,Math.max(10,Cb*1e12)),py=Math.min(1e5,Math.max(100,Rp));
      o.push(S.D(q.X(px),q.Y(py),okR&&okI&&okC?"green":"alias",5));
      o.push(S.T(q.x,14,"使える範囲（"+m.n.replace(/（.*$/,"")+"）","start",9,"signal",true));
      box.set(S.svg(W,236,o));
      var iL=Vdd/Rp,days=0.220/iL/24;
      ro.innerHTML="立ち上がり時間 t_r = ln(7/3) R_p C_b = 0.8473 × "+U.sig(Rp/1000,3)+" kΩ × "+Math.round(Cb*1e12)+" pF = <b>"+F.time(tr)+"</b>（上限 "+F.time(m.tr)+"）→ "+(okR?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"<br>"+
        "使える範囲: (V_DD − 0.4 V) ÷ I_OL = <b>"+U.sig(Rmin,3)+" Ω</b> 以上、t_r の上限 ÷ (0.8473 C_b) = <b>"+(Rmax>=1000?U.sig(Rmax/1000,3)+" kΩ":U.sig(Rmax,3)+" Ω")+"</b> 以下"+(Rmin>Rmax?'（<span class="warn">範囲が無い。容量を減らすか、遅い区分にする</span>）':"")+
        (okI?"":'。<span class="warn">L に引く装置に '+F.cur((Vdd-0.4)/Rp)+' 流れ、I_OL（'+F.cur(m.iol)+'）を超える</span>')+"<br>"+
        "線が L の間の電流 V_DD ÷ R_p = <b>"+F.cur(iL)+"</b>（1 本あたり）。L のまま眠ると、CR2032（220 mAh）は約 "+(days>=2?U.sig(days,3)+" 日":U.sig(days*24,3)+" 時間")+"で尽きる"+
        (okC?"":'<br><span class="warn">バス容量が、この区分の上限 '+Math.round(m.cb*1e12)+' pF を超える</span>')+
        '<div class="wnote">規格の値は I2C バスの規格書（UM10204）による（使うときは最新の版とデータシートで確かめる）。波形は、マスタが半周期だけ L に引き、残りの半周期は離すとして描いた。実際の I2C の回路は、SCL が H になったのを見てから H の時間を数えることが多く、立ち上がりが遅いとクロックが遅くなる。</div>';
    }
    draw();
  };

  /* ---- 6 節: 固まった I2C のバスを戻す ---- */
  REG.w08_recover=function(el,U){
    var S=U.S;
    U.head(el,"BUS RECOVERY","固まった I2C のバスを、クロックと開始・停止条件で戻す");
    var SC=["読み出しの途中: スレーブが値を送っている","アドレスへの ACK を返している途中（読み出し）","書き込みの途中: スレーブが受けている",
            "スレーブが止まり、SCL を L に保っている","SDA が GND に短絡している（故障）"];
    var r1=U.ctrls(el);
    var sc=U.select(r1,"マイコンがリセットされたとき",SC,0,reset);
    var r2=U.ctrls(el);
    var val=U.slider(r2,"スレーブが送る値",{min:0,max:255,step:1,value:0,fmt:function(v){return "0x"+U.fmt.hex(v,2)+"（"+_w08_bin(v)+"）";},onInput:reset});
    var pos=U.slider(r2,"スレーブがいま出しているビット",{min:0,max:7,step:1,value:3,fmt:function(v){return v+" 番（"+((val.get()>>v)&1)+"）";},onInput:reset});
    var br=U.btnrow(el);
    U.button(br,"クロックを 1 回送る",function(){clock1();draw();});
    U.button(br,"開始条件と停止条件を出す",function(){startstop();draw();});
    U.button(br,"センサの電源を入れ直す",function(){repower();draw();});
    U.button(br,"復旧の手順を通す（6 節のコード）",function(){recover();draw();});
    U.button(br,"最初に戻す",function(){reset();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var st,bit,tx,acked,nrx,sSda,sScl,shortc,pw,mScl,mSda,pScl,pSda,hist,nclk,msg,res,starts,stops;
    function lScl(){return pw&&mScl&&sScl;}
    function lSda(){return pw&&mSda&&sSda&&!shortc;}
    function update(){
      var scl=lScl(),sda=lSda();
      if(scl&&pScl&&sda!==pSda){if(!sda)starts++;else stops++;if(st!=="hung"){st="idle";sSda=true;}}
      if(pScl&&!scl){
        if(st==="tx"){if(bit>0){bit--;sSda=!!((tx>>bit)&1);}else{st="txack";sSda=true;}}
        else if(st==="txack"){if(acked){st="tx";bit=7;tx=0;sSda=false;}else st="idle";}
        else if(st==="ackr"){st="tx";bit=7;sSda=!!((tx>>7)&1);}
        else if(st==="ackw"){st="rx";nrx=0;sSda=true;}
        else if(st==="rx"&&nrx===8){st="ackw";sSda=false;}
      }
      if(!pScl&&scl){if(st==="txack")acked=!sda;if(st==="rx")nrx++;}
      pScl=scl;pSda=lSda();
    }
    function who(){if(lSda())return "";if(!pw)return "p";if(shortc)return "x";if(!mSda)return "m";return "s";}
    function push(note,clk){hist.push({scl:lScl(),sda:lSda(),w:who(),note:note||"",clk:clk||0});}
    function reset(){
      var k=sc.get();r2.style.display=k<=1?"":"none";pos.el.style.display=k===0?"":"none";pos.set(pos.get());
      st="idle";bit=7;tx=val.get();acked=false;nrx=3;sSda=true;sScl=true;shortc=false;pw=true;hist=[];nclk=0;msg="";res="";starts=0;stops=0;
      var pre=0;
      if(k===0){pre=Math.min(2,7-pos.get());st="tx";bit=pos.get()+pre;sSda=!!((tx>>bit)&1);}
      else if(k===1){st="ackr";sSda=false;}
      else if(k===2){st="rx";}
      else if(k===3){st="hung";sScl=false;sSda=false;}
      else shortc=true;
      mScl=false;mSda=true;pScl=false;pSda=lSda();
      for(var i=0;i<pre;i++){push(i===0?"読み出しの途中":"");mScl=true;update();push();mScl=false;update();}
      push("リセット");
      mScl=true;update();push();
      starts=0;stops=0;
      draw();
    }
    function sclRelease(){mScl=true;update();push();if(lScl())return true;push("1 ms 待つ");return lScl();}
    function clock1(){
      if(!lScl()&&!mScl){mScl=true;update();push();}
      if(!lScl()){msg="SCL が L に引かれていて、クロックを送れない。";return false;}
      mScl=false;update();nclk++;push("",nclk);
      var ok=sclRelease();
      msg=ok?(lSda()?"SDA が H になった。ここで開始条件と停止条件を出せば、スレーブは待つ状態に戻る。":"SDA はまだ L。スレーブは次のビットを出している。"):"SCL が H に戻らない。";
      return ok;
    }
    function startstop(){
      if(!lScl()){msg="SCL が L なので、開始条件・停止条件にならない。";return false;}
      if(!lSda()){msg="SDA が L に引かれているので、開始条件を作れない（マスタが離しても L のまま）。";return false;}
      mSda=false;update();push("開始");mSda=true;update();push("停止");
      msg=st==="idle"?"開始条件と停止条件を出した。スレーブは次の開始条件を待つ状態で、バスは使える。":"条件を出したが、スレーブは戻っていない。";
      return lSda()&&lScl();
    }
    function repower(){
      pw=false;update();push("電源を切る");push();
      pw=true;st="idle";sSda=true;sScl=true;
      update();push("入れる");
      msg=lSda()&&lScl()?"センサの POR で、スレーブは待つ状態から始まった。設定を最初から書き直す。":"電源を入れ直しても SDA が L のまま。配線の短絡か故障を疑う。";
    }
    function clockOut(){
      for(var k=0;k<9&&!lSda();k++){mScl=false;update();nclk++;push("",nclk);if(!sclRelease())return false;}
      if(!lSda())return false;
      mSda=false;update();push("開始");mSda=true;update();push("停止");
      return lSda()&&lScl();
    }
    function recover(){
      var n0=nclk;
      mSda=true;update();
      var r=lSda()?"BUS_OK":"BUS_CLOCKED";
      if(!sclRelease()||!clockOut()){
        pw=false;update();push("電源を切る");push();pw=true;st="idle";sSda=true;sScl=true;update();push("入れる");
        r=(sclRelease()&&clockOut())?"BUS_REPOWERED":"BUS_DEAD";
      }
      res=r;
      msg="復旧の手順の結果: <b>"+r+"</b>（送ったクロック "+(nclk-n0)+" 回）。"+
        (r==="BUS_DEAD"?'<span class="warn">戻らない。そのセンサを故障として記録し、使わずに動き続ける（15 章 5 節）。</span>':(r==="BUS_REPOWERED"?"電源を入れ直して戻った。起動時間を待ち、設定を書き直す。":'<span class="ok">バスは使える。</span>'));
    }
    function stName(){
      if(!pw)return "電源が切れている";
      if(st==="tx")return "値 0x"+U.fmt.hex(tx,2)+" の "+bit+" 番のビット（"+((tx>>bit)&1)+"）を出して、次のクロックを待っている";
      if(st==="txack")return "1 バイトを送り終え、ACK の位置で SDA を離している";
      if(st==="ackr")return "アドレスへの ACK を返している（SDA を L に引いている）";
      if(st==="ackw")return "受けたバイトへの ACK を返している（SDA を L に引いている）";
      if(st==="rx")return "書き込みのバイトを受けている途中（SDA は離している）";
      if(st==="hung")return "止まって、SCL と SDA を L に引いている";
      return shortc?"次の開始条件を待っているが、SDA が GND に短絡していて、バスは使えない":"次の開始条件を待っている（バスは使える）";
    }
    function draw(){
      var n=hist.length,uw=16,x0=70,W=Math.max(700,x0+n*uw+30),o=[],ys=36,yd=96,hh=22;
      o.push(S.T(12,ys+15,"SCL","start",11,"ink",true));o.push(S.T(12,yd+15,"SDA","start",11,"ink",true));
      var C={s:"purple",m:"signal",x:"alias",p:"muted"};
      hist.forEach(function(h,i){var x=x0+i*uw;if(h.w)o.push(S.RECT(x,yd-5,uw,hh+10,0,U.soft(C[h.w]),"none",0));});
      function wave(key,y){var pts=[];hist.forEach(function(h,i){var x=x0+i*uw,yy=y+(h[key]?0:hh);if(i>0)pts.push([x,pts[pts.length-1][1]]);pts.push([x,yy]);pts.push([x+uw,yy]);});return S.PL(pts,"ink",1.8);}
      o.push(wave("scl",ys));o.push(wave("sda",yd));
      var lastNoteX=-100,row=0;
      hist.forEach(function(h,i){var x=x0+i*uw;
        if(h.clk)o.push(S.T(x+uw/2,ys-6,String(h.clk),"middle",9,"gold",true));
        if(h.note){var c=h.note==="リセット"?"alias":(h.note==="開始"||h.note==="停止"?"signal":"muted");row=(x-lastNoteX<70)?(row+1)%2:0;lastNoteX=x;
          o.push(S.L(x,yd+hh+6,x,yd+hh+12+row*14,c,1));o.push(S.T(x+2,yd+hh+22+row*14,h.note,"start",9,c,true));}});
      var yl=yd+hh+56;
      [["purple","スレーブが SDA を L に引く"],["signal","マスタが SDA を L に引く"],["alias","短絡で L"],["muted","電源が切れて L"]].forEach(function(l,i){var xx=12+i*170;
        o.push(S.RECT(xx,yl-9,10,10,2,U.soft(l[0]),l[0],1));o.push(S.T(xx+15,yl,l[1],"start",9.5,"muted"));});
      box.set(S.svg(W,yl+10,o));
      ro.innerHTML="スレーブ: <b>"+stName()+"</b><br>"+
        "線: SCL "+(lScl()?"H":'<span class="warn">L</span>')+"、SDA "+(lSda()?"H":'<span class="warn">L</span>')+" → "+(lScl()&&lSda()?'<span class="ok">開始条件を出せる</span>':'<span class="warn">開始条件を出せない（固まっている）</span>')+
        " ・ 送ったクロック "+nclk+" 回"+(msg?"<br>"+msg:"")+
        '<div class="wnote">スレーブは、クロックの立ち下がりで次のビットを出し、ACK の位置でマスタが SDA を L に引かなければ（NACK）送るのをやめ、開始条件か停止条件で待つ状態に戻るとした。「1 ms 待つ」は、SCL が H に戻るのを待った所。</div>';
    }
    reset();
  };
