  /* ===== 15 章 異常に備える ===== */
  function _w15_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w15_ohm(r){return r==null?"なし":(r>=1e6?_w15_sig(r/1e6,3)+" MΩ":(r>=1e3?_w15_sig(r/1e3,3)+" kΩ":_w15_sig(r,3)+" Ω"));}

  /* ---- 1 節: リセットの間の負荷の入力の電圧 ---- */
  /* 入力の種類: しきい値（入る電圧の最小）、入力の容量、負荷の電源から入る容量、中のプルダウン */
  var _w15_IN=[
    {t:"ロジックレベル MOSFET のゲート（しきい値の最小 0.8 V）",vth:0.8,cin:1.1e-9,cc:0.1e-9,rint:null},
    {t:"普通の MOSFET のゲート（しきい値の最小 2.0 V）",vth:2.0,cin:1.1e-9,cc:0.1e-9,rint:null},
    {t:"モータドライバ IC の入力（L と読む上限 0.8 V、中に 100 kΩ のプルダウン）",vth:0.8,cin:10e-12,cc:0,rint:100e3}];

  REG.w15_reset=function(el,U){
    var S=U.S,F=U.fmt,VDD=3.3,MG=0.3;
    U.head(el,"RESET PIN","リセットの間の負荷の入力の電圧 — 抵抗・漏れ電流・内蔵のプル・電源の立ち上がり");
    var r1=U.ctrls(el);
    var kind=U.select(r1,"負荷の入力",_w15_IN.map(function(x){return x.t;}),0,draw);
    var rr=U.slider(r1,"外付けの抵抗 R（GND へ）",{values:[0,1e3,4.7e3,10e3,47e3,100e3,470e3,1e6],value:100e3,fmt:function(v){return v?_w15_ohm(v):"なし（浮く）";},onInput:draw});
    var r2=U.ctrls(el);
    var lk=U.slider(r2,"漏れ電流（入力へ流れ込む）",{min:0.01,max:10,log:true,value:1,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var pu=U.select(r2,"リセットの間の内蔵のプルアップ",["なし","30 kΩ（小さい側の例）","50 kΩ"],0,draw);
    var r3=U.ctrls(el);
    var tr=U.slider(r3,"負荷の電源の立ち上がり時間",{min:1e-6,max:10e-3,log:true,value:1e-3,fmt:function(v){return F.time(v);},onInput:draw});
    var vl=U.slider(r3,"負荷の電源の電圧",{values:[5,12,24],value:12,fmt:function(v){return v+" V";},onInput:draw});
    var tb=U.slider(r3,"リセットと起動の処理の長さ",{min:1e-3,max:300e-3,log:true,value:20e-3,fmt:function(v){return F.time(v);},onInput:draw});
    var br=U.btnrow(el);
    function pre(k,R,l,p,t){kind.set(k);rr.set(R);lk.set(l);pu.set(p);tr.set(t);vl.set(12);tb.set(20e-3);draw();}
    U.button(br,"本文の例（100 kΩ）",function(){pre(0,100e3,1,0,1e-3);});
    U.button(br,"抵抗なし（浮く）",function(){pre(0,0,1,0,1e-3);});
    U.button(br,"内蔵のプルアップ 30 kΩ が入るピン",function(){pre(0,100e3,1,1,1e-3);});
    U.button(br,"電源が 10 µs で立ち上がる",function(){pre(0,100e3,1,0,10e-6);});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* 入力が一定の区間ごとに、閉じた式で解く: C dV/dt = I − G V（G = 0 なら直線）。電圧は VDD + 0.3 V で頭打ち（ピンの保護ダイオード） */
    function seg(V0,I,G,C,t){var v;if(G>0){var vi=I/G;v=vi+(V0-vi)*Math.exp(-t*G/C);}else v=V0+I*t/C;return Math.min(v,VDD+0.3);}
    function draw(){
      var K=_w15_IN[kind.get()],R=rr.get()||null,Ilk=lk.get()*1e-6,Rpu=[null,30e3,50e3][pu.get()],t_r=tr.get(),dV=vl.get(),Tb=tb.get();
      var G=(R?1/R:0)+(Rpu?1/Rpu:0)+(K.rint?1/K.rint:0),C=K.cin,I0=Ilk+(Rpu?VDD/Rpu:0),Ic=K.cc*dV/t_r;
      /* 点を作る。立ち上がりの終わりと、プログラムが L を出す時刻を区切りに入れ、区切りの間は入力が一定なので閉じた式で進める */
      var T=1.25*Tb,N=600,times=[],pts=[],V=0,vmax=0,tp=0,prev=0;
      for(var i=0;i<=N;i++)times.push(T*i/N);
      if(t_r<Tb)times.push(t_r);
      times.push(Tb);times.sort(function(a,b){return a-b;});
      times.forEach(function(t){
        if(t<=Tb){V=seg(V,I0+(t<=t_r?Ic:0),G,C,t-prev);if(V>vmax){vmax=V;tp=t;}}
        else V=0;                 /* プログラムが L を出す */
        pts.push([t,V]);prev=t;
      });
      var vss=G>0?Math.min(I0/G,VDD+0.3):VDD+0.3;   /* 立ち上がりが終わった後の落ち着いた値（浮いていれば頭打ちへ） */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?420:700,o=[];
      var ymax=Math.max(1,Math.min(VDD+0.5,Math.ceil((Math.max(vmax,K.vth)+0.3)*2)/2));
      var p=U.plot(nar?56:70,40,nar?340:560,170,[0,T*1e3],[0,ymax]);
      o.push(p.axes({xl:"時間 [ms]（0 でリセットが始まり、負荷の電源も立ち上がり始める）",yl:"入力の電圧 [V]",nx:nar?4:6,xfmt:function(v){return _w15_sig(v,3);}}));
      o.push(S.RECT(p.X(0),p.y-22,p.X(Tb*1e3)-p.X(0),14,2,U.soft("green"),"green",0.8));
      o.push(S.T((p.X(0)+p.X(Tb*1e3))/2,p.y-11,"リセット・起動の処理（外付けの回路が決める）","middle",9,"green",true));
      o.push(S.RECT(p.X(Tb*1e3),p.y-22,p.X(T*1e3)-p.X(Tb*1e3),14,2,U.soft("signal"),"signal",0.8));
      o.push(S.T((p.X(Tb*1e3)+p.X(T*1e3))/2,p.y-11,"L を出す","middle",9,"signal",true));
      o.push(p.line([[0,K.vth],[T*1e3,K.vth]],"alias",1.3,"5 3"));
      o.push(S.T(p.x+p.w-4,p.Y(K.vth)-4,"しきい値 "+K.vth+" V","end",9.5,"alias",true,false,null,true));
      if(K.vth-MG>0){o.push(p.line([[0,K.vth-MG],[T*1e3,K.vth-MG]],"green",1.1,"2 3"));
        o.push(S.T(p.x+4,p.Y(K.vth-MG)+12,"余裕 0.3 V をとった上限","start",9,"green",false,false,null,true));}
      o.push(p.line(pts.map(function(q){return [q[0]*1e3,q[1]];}),vmax>=K.vth?"alias":(vmax>=K.vth-MG?"gold":"signal"),2.2));
      o.push(S.D(p.X(tp*1e3),p.Y(vmax),vmax>=K.vth?"alias":"signal",4));
      box.set(S.svg(W,262,o));
      var verdict=vmax>=K.vth?'<span class="warn">しきい値を超える。負荷が入りうる</span>':(vmax>=K.vth-MG?'<b style="color:var(--gold)">しきい値より低いが、余裕 0.3 V が足りない</b>':'<span class="ok">負荷は切れたまま</span>');
      ro.innerHTML="リセットの間の入力の電圧の最大 <b>"+_w15_sig(vmax,3)+" V</b>（"+F.time(tp)+" の時点）→ "+verdict+"<br>"+
        "立ち上がりの後に落ち着く値: "+(G>0?_w15_sig(vss,3)+" V（入る電流 "+F.cur(I0)+" ÷ コンダクタンス）":'<span class="warn">決まらない。漏れ電流で上がり続ける（ピンの保護ダイオードで頭打ち）</span>')+"<br>"+
        (K.cc>0?"負荷の電源から容量で入る電流 "+F.cur(Ic)+"（"+dV+" V ÷ "+F.time(t_r)+" × "+_w15_sig(K.cc*1e12,3)+" pF）"+(R?"、時定数 τ = R C = "+F.time(R*C):"")+"<br>":"")+
        (R?"ピンが H を出している間に抵抗に流れる電流: "+F.cur(VDD/R)+"（3.3 V ÷ "+_w15_ohm(R)+"）":"外付けの抵抗が無い")+
        '<div class="wnote">漏れ電流は、入力の電圧を上げる向きに流れるとした（最も悪い向き）。内蔵のプルアップは、リセットの間にも入っているピンの場合。ゲートの電圧は、ピンの保護ダイオードで VDD + 0.3 V に抑えられるとした。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 3 節: モータの起動で電源が下がり、リセットを繰り返すか ---- */
  /* 平均化した PWM の模型（13 章の例のモータ。R 2 Ω・L 1 mH・k 0.02・J 1e-5・T_L 0.01）。dt = 10 µs で解く */
  function _w15_dipsim(o){
    var Rm=2,L=1e-3,k=0.02,J=1e-5,TL=0.01,Vdo=0.3,VD=0.3,Im=10e-3,Ir=1e-3,tpor=3e-3,tboot=50e-3,Vhys=0.1,dt=10e-6;
    var E=o.E,Rin=o.Rin,C=o.C,Cm=o.Cm,split=o.split,V=E,Vm=split?E-VD:E,I=0,w=0,st=0,tst=0,started=-1,nxt=tboot,streak=0,gave=false;
    var T=o.T,n=Math.round(T/dt),q=0,res=[],vmin=E,vmmin=9,bk=o.bucket,buf=[],cur={t:0,vlo:9,vhi:-9,mlo:9,mhi:-9,ihi:0,ilo:9};
    for(var s=0;s<n;s++){
      var t=s*dt,vm=Math.min(3.3,Math.max(0,(split?Vm:V)-Vdo));
      if(st===0&&vm<o.Vbor){st=1;tst=t;res.push(t);started=-1;streak++;}
      else if(st===1&&vm>o.Vbor+Vhys){st=2;tst=t;}
      else if(st===2&&t-tst>=tpor){st=0;
        if(o.policy===0||streak===0)nxt=t+tboot;
        else if(streak>=3){gave=true;nxt=1e9;}
        else nxt=t+tboot+0.25*Math.pow(2,streak-1);}
      if(st===0&&started<0&&t>=nxt)started=t;
      var D=0;
      if(st===0&&started>=0){var ta=(o.policy===1&&streak>0)?Math.max(o.tacc,0.5):o.tacc;D=ta<=0?1:Math.min(1,(t-started)/ta);}
      I=Math.max(0,I+(D*V-Rm*I-k*w)/L*dt);
      var tq=k*I-TL;w=(w<=0&&tq<0)?0:Math.max(0,w+tq/J*dt);
      var im=st===0?Im:Ir,isup=(E-V)/Rin;
      if(split){var idd=Math.max(0,(V-VD-Vm)/0.05);Vm+=(idd-im)/Cm*dt;V+=(isup-D*I-idd)/C*dt;}
      else V+=(isup-D*I-im)/C*dt;
      q+=isup*dt;if(V<vmin)vmin=V;if(vm<vmmin)vmmin=vm;
      if(t<o.Tshow){var bi=Math.floor(t/bk);
        if(bi!==cur.i){if(cur.i!=null)buf.push(cur);cur={i:bi,t:bi*bk,vlo:V,vhi:V,mlo:vm,mhi:vm,ihi:D*I,ilo:D*I};}
        else{cur.vlo=Math.min(cur.vlo,V);cur.vhi=Math.max(cur.vhi,V);cur.mlo=Math.min(cur.mlo,vm);cur.mhi=Math.max(cur.mhi,vm);cur.ihi=Math.max(cur.ihi,D*I);cur.ilo=Math.min(cur.ilo,D*I);}}
    }
    if(cur.i!=null)buf.push(cur);
    return {res:res,vmin:vmin,vmmin:vmmin,Iavg:q/T,w:w,gave:gave,buf:buf};
  }

  REG.w15_dip=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"SUPPLY DIP","モータの起動で電源が下がり、リセットを繰り返すか");
    var r1=U.ctrls(el);
    var ee=U.slider(r1,"電池の起電力 E",{min:3.6,max:6.4,step:0.1,value:4.8,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var ri=U.slider(r1,"内部抵抗 R_in（配線を含む）",{min:0.2,max:3,step:0.1,value:1.6,fmt:function(v){return v.toFixed(1)+" Ω";},onInput:draw});
    var cc=U.slider(r1,"電源の線のコンデンサ",{values:[100,220,470,1000,2200,4700,10000],value:1000,fmt:function(v){return v+" µF";},onInput:draw});
    var r2=U.ctrls(el);
    var ta=U.slider(r2,"加速の時間（0 は一気に）",{values:[0,0.02,0.05,0.08,0.12,0.2,0.5],value:0,fmt:function(v){return v?v+" s":"一気に";},onInput:draw});
    var sp=U.select(r2,"マイコンの電源",["電源の線から直接（同じ線）","ダイオードとコンデンサで分ける"],0,draw);
    var cm=U.slider(r2,"マイコンの側のコンデンサ",{values:[100,220,470,1000,2200],value:1000,fmt:function(v){return v+" µF";},onInput:draw});
    var r3=U.ctrls(el);
    var vb=U.slider(r3,"BOR のしきい値",{values:[1.8,2.0,2.2,2.5,2.7,2.9],value:2.7,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var po=U.select(r3,"BOR から起動したとき",["すぐ同じように回し直す","待つ時間を延ばし、ゆっくり回す。3 回続いたらやめる"],0,draw);
    var tw_=U.select(r3,"表示する時間",["0.3 s","2 s"],0,draw);
    var br=U.btnrow(el);
    function pre(E,R,C,t,s,c,b,p){ee.set(E);ri.set(R);cc.set(C);ta.set(t);sp.set(s);cm.set(c);vb.set(b);po.set(p);draw();}
    U.button(br,"新しい電池（6.2 V・0.6 Ω）",function(){pre(6.2,0.6,1000,0,0,1000,2.7,0);});
    U.button(br,"使い終わりで寒い（4.8 V・1.6 Ω）",function(){pre(4.8,1.6,1000,0,0,1000,2.7,0);});
    U.button(br,"本文の (b) 0.12 s かけて加速",function(){pre(4.8,1.6,1000,0.12,0,1000,2.7,0);});
    U.button(br,"本文の (c) マイコンの側を分ける",function(){pre(4.8,1.6,1000,0,1,1000,2.7,0);});
    U.button(br,"BOR から起動したら待つ",function(){pre(4.8,1.6,1000,0,0,1000,2.7,1);tw_.set(1);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Tshow=tw_.get()?2.0:0.3,E=ee.get(),Rin=ri.get(),Vbor=vb.get(),split=sp.get()===1;
      var r=_w15_dipsim({E:E,Rin:Rin,C:cc.get()*1e-6,Cm:cm.get()*1e-6,split:split,tacc:ta.get(),Vbor:Vbor,policy:po.get(),T:2.0,Tshow:Tshow,bucket:Tshow/700});
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?420:700,o=[],ms=1e3;
      var p=U.plot(nar?50:64,20,nar?350:590,160,[0,Tshow*ms],[Math.max(0,Math.min(2,Vbor-0.4)),Math.max(5,Math.ceil(E+0.3))]);
      var xt=U.nice(0,Tshow*ms,nar?4:6);
      o.push(p.axes({yl:"電圧 [V]",xt:xt,xfmt:function(){return "";},ylOff:nar?36:42}));
      o.push(p.line([[0,Vbor],[Tshow*ms,Vbor]],"alias",1.1,"5 3"));
      o.push(S.T(p.x+p.w-4,p.Y(Vbor)+12,"BOR "+Vbor.toFixed(1)+" V","end",9,"alias",false,false,null,true));
      function env(lo,hi){var a=[];r.buf.forEach(function(b){a.push([b.t*ms,b[lo]]);a.push([b.t*ms,b[hi]]);});return a;}
      o.push(p.line(env("vlo","vhi"),"gold",1.5));
      o.push(p.line(env("mlo","mhi"),"signal",1.5));
      r.res.forEach(function(t){if(t<Tshow)o.push(S.L(p.X(t*ms),p.y,p.X(t*ms),p.y+8,"alias",1.6));});
      var q=U.plot(p.x,p.y+p.h+14,p.w,40,[0,Tshow*ms],[0,2.5]);
      o.push(S.L(q.x,q.y+q.h,q.x+q.w,q.y+q.h,"muted",1));
      o.push(q.line(env("ilo","ihi"),"purple",1.2));
      o.push(S.T(q.x-6,q.y+24,"電流","end",9,"purple"));
      var ya=q.y+q.h;
      xt.forEach(function(v){o.push(S.L(q.X(v),ya,q.X(v),ya+4,"muted",1));o.push(S.T(q.X(v),ya+15,_w15_sig(v,3),"middle",9,"muted"));});
      o.push(S.T(q.x+q.w,ya+28,"時間 [ms]（起動して 50 ms でモータを回し始める）","end",9.5,"muted"));
      var lg=[["gold","電源の線"],["signal","マイコンの電源"],["purple","モータの電流（0〜2.5 A）"],["alias","赤の印: リセット"]],lx=p.x,ly=ya+40;
      lg.forEach(function(l){var wl=U.tw(l[1],9.5)+34;if(lx+wl>W-4){lx=p.x;ly+=16;}o.push(S.RECT(lx,ly,10,10,2,U.soft(l[0]),l[0],1.1));o.push(S.T(lx+14,ly+9,l[1],"start",9.5,"muted"));lx+=wl;});
      box.set(S.svg(W,ly+18,o));
      var Vreq=Vbor+0.3,lim=2*(E/Vreq-1),n=r.res.length;
      ro.innerHTML="2 s の間のリセット: <b>"+(n?'<span class="warn">'+n+" 回</span>":'<span class="ok">0 回</span>')+"</b>"+(n?"（最初は回し始めて "+_w15_sig((r.res[0]-0.05)*1e3,3)+" ms 後）":"")+
        "、電源の線の最低 <b>"+r.vmin.toFixed(2)+" V</b>、マイコンの電源の最低 <b>"+r.vmmin.toFixed(2)+" V</b><br>"+
        "電池の平均の電流 "+F.cur(r.Iavg)+"、2 s 後のモータの速さ "+Math.round(r.w)+" rad/s"+(r.gave?'（<span class="warn">3 回続いたので回すのをやめた。電池が少ないと知らせる</span>）':"")+"<br>"+
        "一気に回すときに BOR を割らない内部抵抗の上限 R(E/V_req − 1) = 2 × ("+E.toFixed(1)+" ÷ "+Vreq.toFixed(1)+" − 1) = <b>"+(lim>0?lim.toFixed(2)+" Ω":"なし")+"</b>（V_req = BOR + LDO のドロップアウト 0.3 V）"+
        '<div class="wnote">PWM は平均にならした模型で、モータは 13 章の例の値。マイコンは 10 mA（リセットの間 1 mA）、リセットが解けて 3 ms 後に起動し、50 ms 後にモータを回し始める（すぐ回し直す設定のとき）。「待つ」設定では、BOR からの起動のたびに 0.25 s・0.5 s と待つ時間を延ばし、0.5 s 以上かけて加速する。ダイオードの電圧 0.3 V。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 4 節: ウォッチドッグ（窓付き）と、止まってから安全な状態まで ---- */
  /* o: {mode 0 監視のタスク / 1 タイマ割り込みで無条件, win, To, Tw, Ts, J, clk（発振器の速さの比 1+e）, fault 0〜3, tf, Tend, seed}
     戻り値: 合図・チェックイン・リセットの記録。時刻は ms */
  function _w15_wdsim(o,U){
    var R=U.rng(o.seed),t=0,lastSig=0,openR=o.To/o.clk,closeR=o.Tw/o.clk,rst=null,kind="";
    var alive=0,tempT=0,taskN=0,nextTask=50,nextSup=o.Ts,sig=[],chk=[],early=[];
    function speed(tt){if(tt<o.tf)return 1;return o.fault===2?4:(o.fault===3?0.5:1);}
    function signal(tt){if(o.win&&tt-lastSig<openR){rst=tt;kind="early";early.push(tt);return;}sig.push(tt);lastSig=tt;}
    while(t<o.Tend&&rst===null){
      var tn=Math.min(nextTask,nextSup);
      if(lastSig+closeR<tn){rst=lastSig+closeR;kind="late";break;}
      t=tn;
      if(t===nextTask){
        taskN++;var sp=speed(t),stop=(o.fault===1&&t>=o.tf);
        if(!stop){if(taskN%10===0)tempT=t;alive|=1;chk.push([t,0]);}
        if(t-tempT<=2000){alive|=2;chk.push([t,1]);}
        alive|=4;chk.push([t,2]);
        nextTask=t+(50+R.range(-5,5))/sp;
      } else {
        var sp2=speed(t);
        if(o.mode===1){signal(t);nextSup=t+o.Ts/sp2;}
        else{var a=alive;alive=0;if((a&7)===7)signal(t);nextSup=t+(o.Ts+R.range(-o.J,o.J))/sp2;}
      }
    }
    return {sig:sig,chk:chk,rst:rst,kind:kind,early:early,openR:openR,closeR:closeR};
  }

  REG.w15_wdt=function(el,U){
    var S=U.S,F=U.fmt,seed=7;
    U.head(el,"WATCHDOG","ウォッチドッグの合図・窓・故障から安全な状態まで");
    var r1=U.ctrls(el);
    var md=U.select(r1,"合図の送り方",["各タスクの生存を確かめて（監視のタスク）","タイマの割り込みで無条件に"],0,draw);
    var wn=U.checkbox(r1,"窓付き（ウィンドウウォッチドッグ）",true,draw);
    var fl=U.select(r1,"起こす故障（1 s の時点）",["なし","温度のタスクが止まる","CPU の時計が 4 倍速くなる（ループも合図も速く回る）","CPU の時計が半分の速さになる"],1,draw);
    var r2=U.ctrls(el);
    var to=U.slider(r2,"窓の開始 T_open",{min:0,max:140,step:5,value:75,fmt:function(v){return v+" ms";},onInput:draw});
    var twd=U.slider(r2,"ウォッチドッグの時間 T_W",{min:60,max:400,step:10,value:150,fmt:function(v){return v+" ms";},onInput:draw});
    var ts=U.slider(r2,"監視の周期 T_s",{values:[50,100,200],value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var r3=U.ctrls(el);
    var jj=U.slider(r3,"合図の間隔のばらつき ±T_j",{min:0,max:40,step:1,value:10,fmt:function(v){return "±"+v+" ms";},onInput:draw});
    var ep=U.slider(r3,"発振器のずれ ε",{min:0,max:50,step:1,value:10,fmt:function(v){return v+" %";},onInput:draw});
    var ed=U.select(r3,"ずれの向き",["遅い側（窓が遅く開き、遅く閉じる）","速い側（早く開き、早く閉じる）","範囲の中の乱数"],0,draw);
    var ac=U.select(r3,"アクチュエータ",["SSR のヒータ（次のゼロクロスまで最大 10 ms）","モータ（惰性で止まるまで 550 ms）"],0,draw);
    var br=U.btnrow(el);
    function pre(m,w,f,To,Tw){md.set(m);wn.set(w);fl.set(f);to.set(To);twd.set(Tw);ts.set(100);jj.set(10);ep.set(10);ed.set(0);draw();}
    U.button(br,"本文の例（75〜150 ms）",function(){pre(0,true,1,75,150);});
    U.button(br,"割り込みで無条件に合図",function(){pre(1,true,1,75,150);});
    U.button(br,"時計が速くなる・窓なし",function(){pre(0,false,2,75,150);});
    U.button(br,"窓が狭すぎる（90〜115 ms）",function(){pre(0,true,0,90,115);ed.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function clkOf(R){var e=ep.get()/100,d=ed.get();return d===0?1-e:(d===1?1+e:1+R.range(-e,e));}
    function draw(){
      var mode=md.get(),win=wn.get(),fault=fl.get(),To=to.get(),Tw=twd.get(),Ts=ts.get(),J=jj.get(),e=ep.get()/100,tact=ac.get()===0?10:550;
      var R0=U.rng(seed*7919),clk=clkOf(R0);
      if(win&&To>=Tw){To=Tw-10;}
      var r=_w15_wdsim({mode:mode,win:win,To:win?To:0,Tw:Tw,Ts:Ts,J:J,clk:clk,fault:fault,tf:1000,Tend:3000,seed:seed},U);
      /* 正常なまま長く動かして、誤ったリセットが起きるかを見る（600 s。同じずれ） */
      var Rn=U.rng(seed*31+1),falseN=0;
      for(var k=0;k<5;k++){var rn=_w15_wdsim({mode:mode,win:win,To:win?To:0,Tw:Tw,Ts:Ts,J:J,clk:(ed.get()===2?1+Rn.range(-e,e):clk),fault:0,tf:1e12,Tend:120000,seed:seed*13+k},U);if(rn.rst!==null)falseN++;}
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?420:700,o=[];
      var x0=nar?92:120,x1=W-10,t0=600,t1=2000,X=function(t){return x0+(t-t0)/(t1-t0)*(x1-x0);};
      function inR(t){return t>=t0&&t<=t1;}
      var y=24,lab=function(yy,s,c){o.push(S.T(x0-8,yy,s,"end",9.5,c||"ink",true));};
      /* チェックイン */
      var names=["温度","ヒータ","ファン"],cols=["teal","purple","green"];
      for(var q=0;q<3;q++){lab(y+q*11+8,names[q]+"のタスク",cols[q]);}
      r.chk.forEach(function(c){if(inR(c[0])&&(r.rst===null||c[0]<=r.rst))o.push(S.L(X(c[0]),y+c[1]*11+1,X(c[0]),y+c[1]*11+9,cols[c[1]],1.4));});
      y+=44;
      /* 合図 */
      lab(y+12,"合図","signal");
      o.push(S.L(x0,y+16,x1,y+16,"line",1));
      r.sig.forEach(function(t){if(inR(t))o.push(S.L(X(t),y+2,X(t),y+26,"signal",2));});
      r.early.forEach(function(t){if(inR(t))o.push(S.L(X(t),y+2,X(t),y+26,"alias",2.4));});
      y+=40;
      /* カウンタ（前の合図からの時間） */
      var hc=70,cmax=Math.max(r.closeR*1.15,160),Yc=function(v){return y+hc-v/cmax*hc;};
      lab(y+hc/2+4,"前の合図から","gold");
      o.push(S.T(x0-8,y+hc/2+17,"の時間","end",9.5,"gold",true));
      o.push(S.L(x0,Yc(0),x1,Yc(0),"muted",1));
      if(win){o.push(S.L(x0,Yc(r.openR),x1,Yc(r.openR),"gold",1,"4 3"));o.push(S.T(x1,Yc(r.openR)-3,"窓が開く "+Math.round(r.openR)+" ms","end",9,"gold",false,false,null,true));}
      o.push(S.L(x0,Yc(r.closeR),x1,Yc(r.closeR),"alias",1,"4 3"));o.push(S.T(x1,Yc(r.closeR)-3,"窓が閉じる "+Math.round(r.closeR)+" ms","end",9,"alias",false,false,null,true));
      var ss=[0].concat(r.sig),pts=[];
      for(var i=0;i<ss.length;i++){var a=ss[i],b=i+1<ss.length?ss[i+1]:(r.rst!==null?r.rst:3000);
        var aa=Math.max(a,t0),bb=Math.min(b,t1);if(bb>aa){pts.push([X(aa),Yc(aa-a)]);pts.push([X(bb),Yc(bb-a)]);pts.push([X(bb),Yc(0)]);}}
      if(pts.length)o.push(S.PL(pts,"gold",1.6));
      y+=hc+18;
      /* アクチュエータ */
      lab(y+14,"アクチュエータ","purple");
      var tOff=r.rst!==null?r.rst+tact:null;
      o.push(S.RECT(X(t0),y,X(Math.min(t1,tOff!==null?tOff:t1))-X(t0),20,2,U.soft("purple"),"purple",1));
      o.push(S.T((X(t0)+X(Math.min(t1,tOff!==null?tOff:t1)))/2,y+14,"制御中（入ることがある）","middle",9,"purple",true));
      if(tOff!==null&&tOff<t1){o.push(S.RECT(X(tOff),y,X(t1)-X(tOff),20,2,U.soft("green"),"green",1));if(X(t1)-X(tOff)>60)o.push(S.T((X(tOff)+X(t1))/2,y+14,"安全な状態","middle",9,"green",true));}
      y+=34;
      /* 故障とリセットの線 */
      if(fault){o.push(S.L(X(1000),14,X(1000),y-8,"alias",1.2,"3 3"));o.push(S.T(X(1000)+3,12,"故障","start",9,"alias",true));}
      if(r.rst!==null&&inR(r.rst)){o.push(S.L(X(r.rst),14,X(r.rst),y-8,"alias",2));o.push(S.T(X(r.rst)+3,y+4,"リセット（"+(r.kind==="early"?"早すぎる合図":"合図が来ない")+"）","start",9.5,"alias",true));}
      [600,800,1000,1200,1400,1600,1800,2000].forEach(function(t){o.push(S.T(X(t),y+20,String(t),"middle",9,"muted"));});
      o.push(S.T(x1,y+34,"時間 [ms]","end",9,"muted"));
      box.set(S.svg(W,y+40,o));
      var condO=(Ts-J)*(1-e),condW=(Ts+J)*(1+e),ok1=!win||To<=condO+1e-9,ok2=Tw>=condW-1e-9;
      var out="";
      if(fault===0)out=r.rst===null?'故障なし: <span class="ok">3 s の間リセットされない</span>':'故障なし: <span class="warn">誤ってリセットされた（'+(r.kind==="early"?"早すぎる合図":"合図が来ない")+"）</span>";
      else if(r.rst===null)out='<span class="warn">故障から 2 s たってもリセットされない（この送り方・設定では見つからない）</span>';
      else if(r.rst<1000)out='<span class="warn">故障の前に誤ってリセットされた</span>';
      else out="故障からリセットまで <b>"+Math.round(r.rst-1000)+" ms</b>、アクチュエータが安全な状態になるまで <b>"+Math.round(r.rst-1000+tact)+" ms</b>（式の上限 T_s + T_j + T_W/(1 − ε) + t_act = "+Math.round(Ts+J+Tw/(1-e)+tact)+" ms）";
      ro.innerHTML=out+"<br>発振器の速さは名目の "+(clk*100).toFixed(1)+" %。窓は実際には "+(win?Math.round(r.openR)+"〜":"0〜")+Math.round(r.closeR)+" ms<br>"+
        "誤ってリセットしない条件: "+(win?"T_open ≤ (T_s − T_j)(1 − ε) = "+_w15_sig(condO,3)+" ms "+(ok1?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"、":"")+
        "T_W ≥ (T_s + T_j)(1 + ε) = "+_w15_sig(condW,3)+" ms "+(ok2?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"<br>"+
        "故障なしで 120 s ずつ 5 回動かした（同じ設定、別の乱数）: "+(falseN?'<span class="warn">'+falseN+" 回で誤ってリセット</span>":'<span class="ok">誤ったリセットなし</span>')+
        '<div class="wnote">温度・ヒータ・ファンのタスクは 50 ms（±5 ms）ごとに動き、ヒータのタスクは 2 s より新しい温度があるときだけチェックインする。監視のタスクは、合図の間隔が T_s ± T_j の乱数になるように動く。「タイマの割り込みで無条件に」では、T_s ごとに必ず合図を送る。</div>';
    }
    draw();
  };

  /* ---- 5 節: 故障とリセットの繰り返しによる縮退（本文の rlog_boot・deg_allowed と同じ規則） ---- */
  var _w15_FN=[["AUTO","室温に合わせる暖房"],["WEAK","弱い決まった出力の暖房"],["FAN","ファン（送風）"],["REMOTE","無線（遠くからの操作と知らせ）"]];
  var _w15_FAULT=[["室温のセンサ",1,false],["過熱を見張るセンサ",3,true],["ファンが回らない",7,true],["切ったのにヒータに電流",15,true],["無線",8,false]];
  REG.w15_mode=function(el,U){
    var S=U.S,streak=0,latched=0,log=[],nbor=0,nwdt=0;
    U.head(el,"DEGRADE","故障とリセットの繰り返しで、縮退の段階と使える機能がどう変わるか");
    var r1=U.ctrls(el),fc=[];
    _w15_FAULT.forEach(function(f){fc.push(U.checkbox(r1,f[0]+"が壊れている",false,function(v){add(f[0]+(v?"が壊れた":"が直った"));draw();}));});
    var br=U.btnrow(el);
    function boot(c){if(c==="POR"){streak=0;nbor=0;nwdt=0;}if(c==="BOR"){streak++;nbor++;}if(c==="WDT"){streak++;nwdt++;}
      add(c==="POR"?"電源を入れ直した（POR）: 回数を 0 に":(c==="BOR"?"BOR でリセット":"ウォッチドッグでリセット")+"（続けて "+streak+" 回目）");draw();}
    U.button(br,"BOR でリセット",function(){boot("BOR");});
    U.button(br,"ウォッチドッグでリセット",function(){boot("WDT");});
    U.button(br,"10 分続けて正常",function(){streak=0;add("10 分続けて正常に動いた: 回数を 0 に");draw();});
    U.button(br,"利用者が入れ直す",function(){streak=0;latched=0;add("利用者が入れ直した: 止めたままの機能と回数を 0 に");draw();});
    U.button(br,"電源を入れ直す（POR）",function(){boot("POR");});
    U.button(br,"はじめに戻す",function(){streak=0;latched=0;nbor=0;nwdt=0;log=[];fc.forEach(function(c){c.set(false);});draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function add(t){log.unshift(t);if(log.length>5)log.pop();}
    function draw(){
      var mode=streak>=6?2:(streak>=3?1:0),stop=0,why=[[],[],[],[]];
      _w15_FAULT.forEach(function(f,i){if(fc[i].get()){stop|=f[1];if(f[2])latched|=f[1];for(var b=0;b<4;b++)if(f[1]&(1<<b))why[b].push(f[0]);}});
      for(var b=0;b<4;b++)if((latched&(1<<b))&&!(stop&(1<<b)))why[b].push("利用者が戻すまで");
      stop|=latched;
      if(mode===1){stop|=7;for(var b2=0;b2<3;b2++)why[b2].push("縮退の段階");}
      if(mode===2){stop|=15;for(var b3=0;b3<4;b3++)why[b3].push("安全な停止の段階");}
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?420:700,o=[];
      var st=[["通常","green"],["縮退","gold"],["安全な停止","alias"]],sw=nar?120:180,gap=(W-20-3*sw)/2;
      st.forEach(function(s,i){var x=10+i*(sw+gap),on=i===mode;
        o.push(S.RECT(x,14,sw,40,16,on?U.soft(s[1]):"panel",s[1],on?3:1.2));
        o.push(S.T(x+sw/2,39,s[0],"middle",12,s[1],true));
        if(i<2)o.push(S.ARR(x+sw+4,34,x+sw+gap-4,34,"alias",1.3,6));});
      o.push(S.T(10,74,"続けて起きた異常なリセット: "+streak+" 回（3 回で縮退、6 回で安全な停止）","start",10,"ink",true));
      var y0=92,rh=26;
      _w15_FN.forEach(function(f,i){var ok=!(stop&(1<<i)),y=y0+i*rh;
        o.push(S.RECT(10,y,W-20,rh-4,4,U.soft(ok?"green":"alias"),ok?"green":"alias",1));
        o.push(S.T(20,y+16,f[1],"start",10.5,ok?"green":"alias",true));
        o.push(S.T(W-20,y+16,ok?"使ってよい":"止める（"+why[i].join("・")+"）","end",nar?9:10,ok?"green":"alias",false));});
      box.set(S.svg(W,y0+4*rh+4,o));
      ro.innerHTML="原因ごとの累計: BOR "+nbor+" 回、ウォッチドッグ "+nwdt+" 回<br>"+(log.length?"できごと（新しい順）: "+log.map(U.esc).join(" ／ "):"故障のチェックとボタンで、できごとを起こす")+
        '<div class="wnote">5 節のファンヒータの例の決め方。表示（LED など）で知らせることは、どの段階でも続ける。利用者が戻すまで止めたままにする故障（過熱を見張るセンサ・ファン・ヒータの電流）は、直っても、利用者が入れ直すまで止めたままにする。</div>';
    }
    draw();
  };
