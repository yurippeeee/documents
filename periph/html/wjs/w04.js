  /* ===== 04 章 電池で動かす制御 ===== */
  /* 電池（E, R_in）＋コンデンサ（C, ESR）に、区分的に一定の電流 1 A を時刻 0 から流したときの端子電圧の低下 [V] */
  function _w04_r(t,Rin,C,Re){if(t<0)return 0;if(!(C>0))return Rin;var Rp=Rin*Re/(Rin+Re),tau=C*(Rin+Re);return Rin-(Rin-Rp)*Math.exp(-t/tau);}
  /* pulses = [[始まり s, 長さ s, 電流 A], ...] のときの端子電圧（重ね合わせ） */
  function _w04_v(t,E,Rin,C,Re,ps){var d=0;ps.forEach(function(p){d+=p[2]*(_w04_r(t-p[0],Rin,C,Re)-_w04_r(t-p[0]-p[1],Rin,C,Re));});return E-d;}
  /* 3 節の例の模型（コイン形に似せた例。実際の電池の値ではない）: 使った割合 s、温度 T [°C] */
  function _w04_ocv(s){var x=Math.max(0,(s-0.75)/0.25);return 3.05-0.15*s-0.75*Math.pow(x,2.5);}
  function _w04_rin(s,T){var d=Math.max(0,s-0.85);return (15*(1+1.2*s*s)+400*d*d)*Math.exp(0.035*(25-T));}
  function _w04_vop(s,T){var R=_w04_rin(s,T);return _w04_ocv(s)-15e-3*_w04_r(3e-3,R,100e-6,0.5);}
  var _w04_LIFE_D=0.220*3600/3e-6/86400;            /* 平均 3 µA で 220 mAh を使い切る日数 */
  /* 例のリチウムイオン電池の起電力の表（残量 % → V） */
  var _w04_LI=[[0,3.30],[5,3.45],[10,3.55],[20,3.62],[30,3.67],[40,3.71],[50,3.76],[60,3.82],[70,3.89],[80,3.96],[90,4.05],[100,4.18]];
  function _w04_tab(tab,p){for(var i=0;i+1<tab.length;i++){var a=tab[i],b=tab[i+1];if(p>=a[0]&&p<=b[0])return a[1]+(b[1]-a[1])*(p-a[0])/(b[0]-a[0]);}return p>tab[tab.length-1][0]?tab[tab.length-1][1]:tab[0][1];}
  function _w04_inv(tab,v){for(var i=0;i+1<tab.length;i++){var a=tab[i],b=tab[i+1];if(v>=a[1]&&v<=b[1])return a[0]+(b[0]-a[0])*(v-a[1])/(b[1]-a[1]);}return v>tab[tab.length-1][1]?tab[tab.length-1][0]:tab[0][0];}
  /* コイン形の模型の、休んでいるときの電圧の表（残量 % は 220 mAh に対して） */
  var _w04_COIN=(function(){var t=[];for(var r=0;r<=100;r+=1)t.push([r,_w04_ocv(1-r/100)]);return t;})();
  function _w04_wide(box){var w=box.el.clientWidth;return !(w>0&&w<520);}

  /* ---- 1・2 節: 大容量コンデンサと動作の並べ方 ---- */
  REG.w04_bulk=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BULK CAPACITOR","電池と大容量コンデンサ、2 つの動作の並べ方と端子電圧");
    var r1=U.ctrls(el);
    var cE=U.slider(r1,"電池の起電力 E",{min:2.0,max:3.3,step:0.05,value:2.8,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var cR=U.slider(r1,"内部抵抗 R_in",{min:1,max:1000,value:100,log:true,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var cVm=U.slider(r1,"最低の電圧 V_min",{min:1.6,max:3.0,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var r2=U.ctrls(el);
    var cC=U.slider(r2,"コンデンサの容量 C",{values:[0,10,22,47,100,220,470,1000,2200,4700,10000,47000,100000],value:100,
      fmt:function(v){return v===0?"なし":(v>=1000?U.sig(v/1000,3)+" mF":v+" µF");},onInput:draw});
    var cRe=U.slider(r2,"ESR",{min:0.005,max:100,value:0.5,log:true,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var r3=U.ctrls(el);
    var cIa=U.slider(r3,"送信の電流",{min:1,max:100,value:15,log:true,fmt:function(v){return U.sig(v,3)+" mA";},onInput:draw});
    var cTa=U.slider(r3,"送信の長さ",{min:0.1,max:100,value:3,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var r4=U.ctrls(el);
    var cIb=U.slider(r4,"LED の電流",{min:0,max:50,step:0.5,value:5,fmt:function(v){return v===0?"0（LED なし）":v+" mA";},onInput:draw});
    var cTb=U.slider(r4,"LED の長さ",{min:1,max:500,value:20,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var r5=U.ctrls(el);
    var cM=U.select(r5,"並べ方",["送信だけ","LED の途中（点けてから 85 % の時点）で送信","LED と送信を同時に始める","LED を消した直後に送信","LED を消してから間を空けて送信"],4,draw);
    var cG=U.slider(r5,"間隔 t_gap",{min:0,max:100,step:1,value:25,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.btnrow(el);
    function preset(m,g){cE.set(2.8);cR.set(100);cVm.set(2.2);cC.set(100);cRe.set(0.5);cIa.set(15);cTa.set(3);cIb.set(5);cTb.set(20);cM.set(m);cG.set(g);draw();}
    U.button(br,"2 節の例 (a) LED の途中で送信",function(){preset(1,25);});
    U.button(br,"(b) 直後に送信",function(){preset(3,25);});
    U.button(br,"(c) 25 ms 空ける",function(){preset(4,25);});
    U.button(br,"コンデンサなし",function(){cC.set(0);draw();});
    U.button(br,"ESR の大きい小形の電気二重層（47 mF・30 Ω）",function(){cC.set(47000);cRe.set(30);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var E=cE.get(),R=cR.get(),Vm=cVm.get(),C=cC.get()*1e-6,Re=cRe.get(),Ia=cIa.get()*1e-3,ta=cTa.get()*1e-3,Ib=cIb.get()*1e-3,tb=cTb.get()*1e-3,m=cM.get(),g=cG.get()*1e-3;
      cG.el.style.display=m===4?"":"none";
      var led=Ib>0&&m>0,ps=[],t0=2e-3,txs;
      if(!led)txs=t0;else if(m===1)txs=t0+0.85*tb;else if(m===2)txs=t0;else if(m===3)txs=t0+tb;else txs=t0+tb+g;
      if(led)ps.push([t0,tb,Ib]);
      ps.push([txs,ta,Ia]);
      var tau=C>0?C*(R+Re):0,tend=0;ps.forEach(function(p){tend=Math.max(tend,p[0]+p[1]);});
      var span=Math.min(1.0,Math.max(tend+5*tau,tend+0.01,0.02)),cut=tend+5*tau>span;
      /* 標本: 細かい格子と、各パルスの端の前後 */
      var ts=[],NS=600;for(var k=0;k<=NS;k++)ts.push(k/NS*span);
      ps.forEach(function(p){[p[0],p[0]+p[1]].forEach(function(e){ts.push(Math.max(0,e-1e-9));ts.push(e+1e-9);});});
      ts.sort(function(a,b){return a-b;});
      var Iload=function(t){var s=0;ps.forEach(function(p){if(t>=p[0]&&t<p[0]+p[1])s+=p[2];});return s;};
      var V=ts.map(function(t){return _w04_v(t,E,R,C,Re,ps);}),ib=V.map(function(v){return (E-v)/R;}),il=ts.map(Iload),ic=il.map(function(x,i){return x-ib[i];});
      var vmin=Infinity,tmin=0;V.forEach(function(v,i){if(v<vmin){vmin=v;tmin=ts[i];}});
      var ibmax=Math.max.apply(null,ib),ilmax=Math.max.apply(null,il),icmin=Math.min(0,Math.min.apply(null,ic));
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?70:56,wd=W-x0-24,o=[];
      var X=function(t){return x0+t/span*wd;};
      var yI=24,hI=wide?100:90,Imax=Math.max(ilmax,ibmax)*1.15*1e3,Imin=icmin*1.15*1e3;
      var YI=function(i){return yI+hI-(i*1e3-Imin)/(Imax-Imin)*hI;};
      o.push(S.T(10,14,"電流","start",10.5,"ink",true));
      o.push(S.W([x0,yI,x0,yI+hI,x0+wd,yI+hI],"muted",1.1));
      U.nice(Imin,Imax,4).forEach(function(v){if(v>=Imin-1e-9&&v<=Imax+1e-9){var yy=YI(v*1e-3);o.push(S.L(x0,yy,x0+wd,yy,"grid",1));o.push(S.T(x0-6,yy+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-36,yI+hI/2,"mA","middle",9.5,"muted",false,false,-90));
      if(Imin<0)o.push(S.L(x0,YI(0),x0+wd,YI(0),"muted",1));
      function pl(arr,c,lw,dash){return S.PL(ts.map(function(t,i){return [X(t),YI(arr[i])];}),c,lw,null,dash);}
      o.push(pl(il,"purple",1.4,"5 3"));o.push(pl(ic,"signal",1.6));o.push(pl(ib,"gold",2.2));
      var lg=[["purple","負荷の電流"],["gold","電池の電流"],["signal","コンデンサの電流"]],lx=x0+wd;
      lg.slice().reverse().forEach(function(q){var w=U.tw(q[1],9.5)+18;lx-=w;o.push(S.RECT(lx,8,10,10,2,U.soft(q[0]),q[0],1.1));o.push(S.T(lx+14,17,q[1],"start",9.5,q[0],true));});
      /* 端子電圧 */
      var yV=yI+hI+40,hV=wide?120:110,vlo=Math.min(Vm,vmin)-0.15,vhi=E+0.1;vlo=Math.max(0,Math.floor(vlo*10)/10);
      var YV=function(v){return yV+hV-(v-vlo)/(vhi-vlo)*hV;};
      o.push(S.T(10,yV-8,"端子電圧","start",10.5,"ink",true));
      o.push(S.W([x0,yV,x0,yV+hV,x0+wd,yV+hV],"muted",1.1));
      U.nice(vlo,vhi,4).forEach(function(v){if(v>=vlo-1e-9&&v<=vhi+1e-9){o.push(S.L(x0,YV(v),x0+wd,YV(v),"grid",1));o.push(S.T(x0-6,YV(v)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-34,yV+hV/2+4,"V","middle",9.5,"muted"));
      o.push(S.L(x0,YV(Vm),x0+wd,YV(Vm),"alias",1.2,"5 3"));
      o.push(S.T(x0+wd-2,YV(Vm)+12,"V_min "+Vm.toFixed(2)+" V","end",9,"alias",false,false,null,true));
      o.push(S.PL(ts.map(function(t,i){return [X(t),YV(Math.max(vlo,V[i]))];}),"gold",2.2));
      var bad=vmin<Vm;
      o.push(S.D(X(tmin),YV(Math.max(vlo,vmin)),bad?"alias":"green",4.5));
      var lab="最低 "+vmin.toFixed(3)+" V",rt=X(tmin)>x0+wd*0.6;
      o.push(S.T(X(tmin)+(rt?-8:8),YV(Math.max(vlo,vmin))+(YV(Math.max(vlo,vmin))>yV+hV-20?-8:16),lab,rt?"end":"start",9.5,bad?"alias":"green",true,false,null,true));
      /* 時間軸と動作の帯 */
      var ya=yV+hV;U.nice(0,span*1e3,wide?8:5).forEach(function(v){if(v*1e-3<=span+1e-12){o.push(S.L(X(v*1e-3),ya,X(v*1e-3),ya+4,"muted",1));o.push(S.T(X(v*1e-3),ya+15,U.sig(v,4),"middle",9,"muted"));}});
      o.push(S.T(x0+wd,ya+28,"時間 [ms]"+(cut?"（回復はこの範囲の外まで続く）":""),"end",9,"muted"));
      var yb=ya+38;
      ps.forEach(function(p,i){var isTx=(i===ps.length-1),c=isTx?"gold":"purple",xa=X(p[0]),xb=Math.max(X(p[0]+p[1]),xa+2);
        o.push(S.RECT(xa,yb+(isTx?14:0),xb-xa,11,2,U.soft(c),c,1));
        var nm=(isTx?"送信 ":"LED ")+U.sig(p[2]*1e3,3)+" mA";
        o.push(S.T(xb+4,yb+(isTx?14:0)+9,nm,"start",9,c,true));});
      box.set(S.svg(W,yb+34,o));
      /* ---- 読み出し ---- */
      var dva=Ia*R,dvb=C>0?Math.min(Ia*ta/C+Ia*Re,Ia*R):Ia*R,allow=E-(Vm+0.1),need=allow>Ia*Re&&allow>0?Ia*ta/(allow-Ia*Re):NaN;
      var s="最低の電圧 <b>"+vmin.toFixed(3)+" V</b>（"+F.time(tmin)+"）→ "+(bad?'<span class="warn">V_min を下回る。この時点でマイコンはリセットする</span>':(vmin<Vm+0.1?'<b style="color:var(--gold)">V_min は上回るが、余裕 0.1 V を割る</b>':'<span class="ok">V_min + 0.1 V を保つ</span>'))+"<br>";
      s+="電池の電流の最大 <b>"+F.cur(ibmax)+"</b>（コンデンサが無ければ "+F.cur(ilmax)+"）・ 再充電の時定数 τ = (R_in + ESR) C = <b>"+(C>0?F.time(tau):"—")+"</b>"+(C>0?"（5τ = "+F.time(5*tau)+"）":"")+"<br>";
      s+="送信の低下の上限 min(I t/C + I·ESR, I·R_in) = <b>"+dvb.toFixed(3)+" V</b>（電池だけなら I·R_in = "+dva.toFixed(3)+" V）<br>";
      s+="V_min + 0.1 V を守る容量 C ≥ I t / (ΔV_allow − I·ESR)、ΔV_allow = E − (V_min + 0.1 V) = "+allow.toFixed(2)+" V → "+
        (allow<=0?'<span class="warn">電池の起電力が低すぎる</span>':(!isFinite(need)?'<b style="color:var(--gold)">I·ESR = '+(Ia*Re).toFixed(3)+' V で、この式では決められない（ESR が内部抵抗に近く、電池も電流を出す。波形の最低の電圧で確かめる）</b>':"<b>"+(need>=1e-3?U.sig(need*1e3,3)+" mF":U.sig(need*1e6,3)+" µF")+"</b> 以上"));
      if(C>0)s+="<br>パルスの始まりにコンデンサが受け持つ割合 R_in/(R_in + ESR) = <b>"+U.sig(R/(R+Re)*100,3)+" %</b>"+(Re>0.1*R?'（<b style="color:var(--gold)">ESR が内部抵抗に比べて大きい</b>）':"");
      if(led){var d1=C>0?Math.min(Ib*tb/C+Ib*Re,Ib*R):Ib*R,den=allow-dvb;
        s+="<br>LED の後に送信するときの間隔 t_gap ≥ τ ln(ΔV₁/(ΔV_allow − ΔV₂)) = "+(C<=0?"—（コンデンサなし）":(den<=0?'<span class="warn">送信だけで ΔV_allow を超えるので、間を空けても足りない</span>':"<b>"+(d1<=den?"0（空けなくてよい）":F.time(tau*Math.log(d1/den)))+"</b>（安全側の見積もり。ΔV₁ = "+d1.toFixed(3)+" V）"));}
      ro.innerHTML=s+'<div class="wnote">電池は起電力と内部抵抗、コンデンサは理想の容量と ESR で表した。マイコンが V_min を割ってリセットした後の動きは計算していない。値はすべて例の値。</div>';
    }
    draw();
  };

  /* ---- 3 節: 低電池の判定 ---- */
  REG.w04_lowbat=function(el,U){
    var S=U.S,seed=1;
    U.head(el,"LOW BATTERY","低電池の判定 — 測るとき・ヒステリシス・連続回数");
    var r1=U.ctrls(el);
    var cMs=U.select(r1,"測るとき",["送信の直後（電圧が最も下がるとき）","休んでいるとき（電流 0）"],0,draw);
    var cTh=U.select(r1,"しきい値",["ヒステリシス（2.45 V で入り、2.60 V を超えて戻る）","1 つ（2.45 V）"],0,draw);
    var cN=U.slider(r1,"続けて越える回数 N",{values:[1,2,3,4,5],value:3,fmt:function(v){return v+" 回";},onInput:draw});
    var r2=U.ctrls(el);
    var cTm=U.slider(r2,"気温の平均",{min:-10,max:25,step:1,value:5,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var cDT=U.slider(r2,"1 日の気温の差",{min:0,max:20,step:1,value:14,fmt:function(v){return v+" °C";},onInput:draw});
    var r3=U.ctrls(el);
    var cSg=U.slider(r3,"測る誤差（標準偏差）",{min:0,max:40,step:1,value:10,fmt:function(v){return v+" mV";},onInput:draw});
    var cPo=U.slider(r3,"0.25 V 低く外れる測定の割合",{values:[0,0.1,0.3,1,3],value:1,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);
    function preset(ms,th,n){cMs.set(ms);cTh.set(th);cN.set(n);cTm.set(5);cDT.set(14);cSg.set(10);cPo.set(1);draw();}
    U.button(br,"3 節の例（送信の直後・ヒステリシス・3 回）",function(){preset(0,0,3);});
    U.button(br,"しきい値 1 つ・1 回",function(){preset(0,1,1);});
    U.button(br,"ヒステリシス・1 回",function(){preset(0,0,1);});
    U.button(br,"休んでいるときに測る",function(){preset(1,0,3);});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var rest=cMs.get()===1,single=cTh.get()===1,N=cN.get(),Tm=cTm.get(),dT=cDT.get(),sg=cSg.get()*1e-3,po=cPo.get()/100;
      var R=U.rng(seed),lifeH=_w04_LIFE_D*24,H=Math.floor(lifeH*1.02),exitV=single?2.45:2.60;
      var st=0,nc=0,nl=0,no=0,changes=0,tLow=-1,tCrit=-1,firstBad=-1,resets=0,sCrit=-1;
      var D0=2500,days={},seg=[],cur=0,seg0=0;
      for(var h=0;h<H;h++){
        var s=h/lifeH,T=Tm+dT/2*Math.sin(2*Math.PI*((h%24)-9)/24),vt=_w04_vop(s,T),v=(rest?_w04_ocv(s):vt)+sg*R.normal(),out=false;
        if(po>0&&R.chance(po)){v-=0.25;out=true;}
        nc=v<2.35?nc+1:0; nl=v<2.45?nl+1:0; no=(single?v>=exitV:v>exitV)?no+1:0;
        var prev=st;
        if(st===0){if(nc>=N)st=2;else if(nl>=N)st=1;}
        else if(st===1){if(nc>=N)st=2;else if(no>=N)st=0;}
        if(st!==prev){changes++;if(st===1&&tLow<0)tLow=h/24;if(st===2){tCrit=h/24;sCrit=s;}}
        if(vt<2.2&&firstBad<0)firstBad=h/24;
        if(vt<2.2&&st!==2)resets++;
        if(st!==cur){seg.push([seg0,h/24,cur]);seg0=h/24;cur=st;}
        var d=Math.floor(h/24);
        if(d>=D0){var a=days[d]||(days[d]=[9,0,9,st,0,[]]);if(out)a[5].push(v);else{a[0]=Math.min(a[0],v);a[1]=Math.max(a[1],v);}a[2]=Math.min(a[2],vt);a[3]=Math.max(a[3],st);if(vt<2.2&&st!==2)a[4]++;}
      }
      seg.push([seg0,H/24,cur]);
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?70:56,wd=W-x0-20,o=[],SC=["green","gold","alias"];
      /* 上: 電池の一生の判定の帯 */
      var Xl=function(d){return x0+d/(H/24)*wd;};
      o.push(S.T(10,16,"電池の一生（約 "+U.sig(_w04_LIFE_D/365,2)+" 年）の判定","start",10.5,"ink",true));
      seg.forEach(function(q){o.push(S.RECT(Xl(q[0]),24,Math.max(0.6,Xl(q[1])-Xl(q[0])),14,0,U.soft(SC[q[2]]),SC[q[2]],0.5));});
      for(var y=0;y<=8;y++){var xx=Xl(y*365);o.push(S.L(xx,38,xx,42,"muted",1));o.push(S.T(xx,53,y+(y===0?" 年":""),"middle",9,"muted"));}
      o.push(S.RECT(Xl(D0),22,Xl(H/24)-Xl(D0),18,2,"none","ink",1,"3 2"));
      /* 下: 最後の 520 日 */
      var y0=78,hh=wide?170:150,vlo=2.0,vhi=2.9,d1=H/24;
      var X=function(d){return x0+(d-D0)/(d1-D0)*wd;},Y=function(v){return y0+hh-(Math.max(vlo,Math.min(vhi,v))-vlo)/(vhi-vlo)*hh;};
      o.push(S.T(10,y0-8,"点線の枠の拡大: 測った電圧と判定","start",10.5,"ink",true));
      o.push(S.W([x0,y0,x0,y0+hh,x0+wd,y0+hh],"muted",1.1));
      [2.0,2.2,2.4,2.6,2.8].forEach(function(v){o.push(S.L(x0,Y(v),x0+wd,Y(v),"grid",1));o.push(S.T(x0-6,Y(v)+3.5,v.toFixed(1),"end",9,"muted"));});
      o.push(S.T(x0-34,y0+hh/2+4,"V","middle",9.5,"muted"));
      var ks=Object.keys(days).map(Number).sort(function(a,b){return a-b;}),top=[],bot=[],tl=[];
      ks.forEach(function(d){if(days[d][1]>0){top.push([X(d+0.5),Y(days[d][1])]);bot.unshift([X(d+0.5),Y(days[d][0])]);}tl.push([X(d+0.5),Y(days[d][2])]);});
      if(top.length)o.push(S.PL(top.concat(bot),"signal",0.8,"var(--signal-soft)"));
      ks.forEach(function(d){days[d][5].forEach(function(v){o.push(S.D(X(d+0.5),Y(v),"alias",1.6));});});
      o.push(S.PL(tl,"teal",1.2,null,"4 2"));
      [[2.60,"green","2.60"],[2.45,"gold","2.45"],[2.35,"alias","2.35"],[2.2,"alias","2.2（最低）"]].forEach(function(q){if(single&&q[0]===2.60)return;
        o.push(S.L(x0,Y(q[0]),x0+wd,Y(q[0]),q[1],1.1,q[0]===2.2?"6 3":"4 3"));o.push(S.T(x0+wd-2,Y(q[0])-3,q[2]+" V","end",8.5,q[1],true,false,null,true));});
      var yb=y0+hh+10;
      ks.forEach(function(d){var c=SC[days[d][3]];o.push(S.RECT(X(d),yb,Math.max(0.8,X(d+1)-X(d)),10,0,U.soft(c),"none",0));if(days[d][4]>0)o.push(S.L(X(d+0.5),yb+12,X(d+0.5),yb+20,"alias",1.4));});
      [0,100,200,300,400,500,600].forEach(function(k){var d=D0+k;if(d>d1)return;o.push(S.L(X(d),y0+hh,X(d),y0+hh+4,"muted",1));o.push(S.T(X(d),yb+33,String(d),"middle",9,"muted"));});
      o.push(S.T(x0+wd,yb+46,"電池を入れてからの日数","end",9,"muted"));
      var lx=x0,ly=yb+60;
      [["green","OK"],["gold","LOW"],["alias","CRIT"],["signal","測った電圧（1 日の最小〜最大）"],["teal","本当の電圧（1 日の最小。点線）"]].forEach(function(q,i){var w=U.tw(q[1],9)+26;if(lx+w>x0+wd){lx=x0;ly+=15;}o.push(S.RECT(lx,ly-9,10,10,2,U.soft(q[0]),q[0],1));o.push(S.T(lx+14,ly,q[1],"start",9,q[0],true));lx+=w;});
      if(lx+190>x0+wd){lx=x0;ly+=15;}o.push(S.D(lx+5,ly-4,"alias",2));o.push(S.T(lx+12,ly,"外れた値",'start',9,"alias",true));lx+=62;o.push(S.L(lx+4,ly-8,lx+4,ly,"alias",1.4));o.push(S.T(lx+10,ly,"リセットした日",'start',9,"alias",true));
      box.set(S.svg(W,ly+10,o));
      /* ---- 読み出し ---- */
      var fd=function(d){return d<0?"—":Math.round(d)+" 日（"+U.sig(d/365,3)+" 年）";};
      var sEnd=firstBad>0?firstBad*24/lifeH:1;
      var txt="状態の変化 <b>"+changes+" 回</b>"+(changes>3?'（<span class="warn">ばたついている</span>）':'（<span class="ok">ばたつかない</span>）')+"<br>";
      txt+="LOW に入った: "+fd(tLow)+" ・ CRIT に入った: "+fd(tCrit)+" ・ 送信の直後の電圧が初めて 2.2 V を割った: "+fd(firstBad)+"<br>";
      if(resets>0)txt+='<span class="warn">CRIT に入る前に、送信の直後の電圧が 2.2 V を割った時間が '+resets+' 回ある（その送信でリセットする）</span>';
      else if(tCrit>=0&&firstBad>=0)txt+='<span class="ok">CRIT に入ってから、本当に 2.2 V を割るまで '+Math.round(firstBad-tCrit)+' 日の余裕がある</span>';
      else txt+="（この範囲では CRIT に入らなかった）";
      if(tCrit>=0&&firstBad>=0&&sCrit<sEnd-0.1)txt+='<br><span class="warn">CRIT に入るのが早すぎる: 使える電荷の '+Math.round((1-sCrit/sEnd)*100)+' % を残して止まった</span>';
      ro.innerHTML=txt+'<div class="wnote">3 節の例の模型（実際の電池の値ではない）で、1 時間ごとに測って判定した。CRIT からは戻らない。外れた値は、測定の一部が 0.25 V 低くなるとした。休んでいるときに測る場合も、送信は毎回するので、そのときの電圧でリセットするかどうかを数えた。</div>';
    }
    draw();
  };

  /* ---- 4 節: 残量の推定 ---- */
  REG.w04_soc=function(el,U){
    var S=U.S,seed=1;
    U.head(el,"STATE OF CHARGE","残量の推定 — 電圧から・電荷を数えて・組み合わせて");
    var r1=U.ctrls(el);
    var cB=U.select(r1,"電池",["リチウムイオン電池（放電曲線が傾いている。例の表）","コイン形（放電曲線が平ら。3 節の例の模型）"],0,draw);
    var cMs=U.select(r1,"電圧を測るとき",["休ませて（電流 0）","電流を流しながら（リチウムイオン 1 A・コイン形 送信の直後）"],0,draw);
    var r2=U.ctrls(el);
    var cT=U.slider(r2,"温度",{min:-10,max:40,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var cSg=U.slider(r2,"電圧の誤差（標準偏差）",{min:0,max:30,step:1,value:15,fmt:function(v){return v+" mV";},onInput:draw});
    var r3=U.ctrls(el);
    var cK=U.slider(r3,"数えた電荷の誤差",{min:-20,max:20,step:1,value:-10,fmt:function(v){return (v>0?"+":"")+String(v).replace("-","−")+" %";},onInput:draw});
    var cQ=U.slider(r3,"実際の容量 ÷ 見積もった容量",{min:60,max:110,step:1,value:90,fmt:function(v){return v+" %";},onInput:draw});
    var r4=U.ctrls(el);
    var cFx=U.checkbox(r4,"組み合わせる（電圧で合わせ直す）",true,draw);
    var br=U.btnrow(el);
    U.button(br,"誤差なし",function(){cK.set(0);cQ.set(100);cSg.set(0);draw();});
    U.button(br,"例に戻す",function(){cB.set(0);cMs.set(0);cT.set(25);cSg.set(15);cK.set(-10);cQ.set(90);cFx.set(true);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var coin=cB.get()===1,load=cMs.get()===1,T=cT.get(),sg=cSg.get()*1e-3,k=cK.get()/100,qr=cQ.get()/100,fix=cFx.get();
      var R=U.rng(seed),pts=[],NP=200;
      /* p: 本当の残量 [%]（実際に使える電荷に対して）。u: 使った電荷 / 見積もった容量 */
      var rinLi=0.10*Math.exp(0.03*(25-T)),sEnd=1;
      if(coin){var lo=0.5,hi=1.1;for(var it=0;it<50;it++){var mm=(lo+hi)/2;if(_w04_vop(mm,T)>2.2)lo=mm;else hi=mm;}sEnd=lo;}
      var anchor=null,cAdj=0,lowSeen=false;
      for(var i=0;i<=NP;i++){
        var p=100-100*i/NP,used=(1-p/100)*qr;            /* 見積もった容量に対する、使った割合 */
        var v,pv;
        if(coin){var s=(1-p/100)*sEnd;v=(load?_w04_vop(s,T):_w04_ocv(s))+sg*R.normal();
          /* 220 mAh に対する残量の表で引き、使える電荷に対する割合に直す */
          pv=Math.max(0,Math.min(100,(1-(1-_w04_inv(_w04_COIN,v)/100)/sEnd)*100));}
        else{v=_w04_tab(_w04_LI,p)-(load?1.0*rinLi:0)+sg*R.normal();pv=_w04_inv(_w04_LI,v);}
        var pc=100*(1-(1+k)*used);
        /* 組み合わせ: リチウムイオンは残量 50 % で 1 回休んだとして電圧の値に合わせ直し、使い終わりの近く（電圧の表で 10 % 以下）でも合わせ直す。
           コイン形は、送信の直後の電圧が 2.45 V を下回ったら（3 節の LOW）10 % 以下にし、2.35 V で 0 % にする */
        var pf;
        if(!coin){
          if(anchor===null&&p<=50){anchor=pv-pc;}
          if(pv<=10&&!lowSeen){lowSeen=true;cAdj=pv-(pc+(anchor||0));}
          pf=pc+(anchor||0)+(lowSeen?cAdj:0);
          if(lowSeen)pf=Math.min(pf,pv);
        }else{
          var vl=_w04_vop((1-p/100)*sEnd,T);
          pf=pc;
          if(vl<2.45)pf=Math.min(pc,Math.max(0,10*(vl-2.35)/0.10));
        }
        pts.push([p,pv,Math.max(0,Math.min(100,pc)),Math.max(0,Math.min(100,pf))]);
      }
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?70:56,sz=wide?300:260,o=[];
      var pw=wide?360:W-x0-20,ph=sz-60;
      var X=function(p){return x0+(100-p)/100*pw;},Y=function(q){return 24+ph-q/100*ph;};
      o.push(S.T(10,14,"推定した残量（縦）と本当の残量（横。右へ使っていく）","start",10.5,"ink",true));
      o.push(S.W([x0,24,x0,24+ph,x0+pw,24+ph],"muted",1.1));
      [0,20,40,60,80,100].forEach(function(q){o.push(S.L(x0,Y(q),x0+pw,Y(q),"grid",1));o.push(S.T(x0-6,Y(q)+3.5,String(q),"end",9,"muted"));
        o.push(S.L(X(q),24+ph,X(q),28+ph,"muted",1));o.push(S.T(X(q),40+ph,String(q),"middle",9,"muted"));});
      o.push(S.T(x0+pw,54+ph,"本当の残量 [%]","end",9.5,"muted"));
      o.push(S.T(x0-38,24+ph/2,"推定 [%]","middle",9.5,"muted",false,false,-90));
      o.push(S.L(X(100),Y(100),X(0),Y(0),"ink",1.2));
      pts.forEach(function(q,i){if(i%2===0)o.push(S.D(X(q[0]),Y(Math.max(0,Math.min(100,q[1]))),"teal",1.8));});
      o.push(S.PL(pts.map(function(q){return [X(q[0]),Y(q[2])];}),"gold",1.8,null,"5 3"));
      if(fix)o.push(S.PL(pts.map(function(q){return [X(q[0]),Y(q[3])];}),"signal",2.2));
      var lx=wide?x0+pw+24:x0,ly=wide?40:24+ph+70,L=[["ink","本当の残量（対角線）"],["teal","電圧から（点）"],["gold","電荷を数えて（破線）"]];
      if(fix)L.push(["signal","組み合わせ（実線）"]);
      L.forEach(function(q,i){o.push(S.RECT(lx,ly+i*18-9,10,10,2,U.soft(q[0]),q[0],1));o.push(S.T(lx+14,ly+i*18,q[1],"start",9.5,q[0],true));});
      var errs=[["電圧から",1],["電荷を数えて",2]];if(fix)errs.push(["組み合わせ",3]);
      var ey=ly+L.length*18+14;
      if(wide){o.push(S.T(lx,ey,"誤差の最大（本当 − 推定の絶対値）","start",9.5,"ink",true));
        errs.forEach(function(e,i){var m=0;pts.forEach(function(q){m=Math.max(m,Math.abs(q[e[1]]-q[0]));});o.push(S.T(lx,ey+17+i*16,e[0]+": "+m.toFixed(0)+" %","start",9.5,"muted"));});}
      box.set(S.svg(W,wide?Math.max(24+ph+62,ey+70):ly+L.length*18+6,o));
      /* ---- 読み出し ---- */
      function at(p,idx){var b=pts[0];pts.forEach(function(q){if(Math.abs(q[0]-p)<Math.abs(b[0]-p))b=q;});return b[idx];}
      var s="本当の残量が 50 % のとき: 電圧から "+at(50,1).toFixed(0)+" %・電荷を数えて "+at(50,2).toFixed(0)+" %"+(fix?"・組み合わせ "+at(50,3).toFixed(0)+" %":"")+"<br>";
      var e0=at(0,2),f0=at(0,3);
      s+="本当の残量が 0 % のとき（使い切ったとき）: 電荷を数えて <b>"+e0.toFixed(0)+" %</b>"+(e0>2?'（<span class="warn">残っていると示したまま止まる</span>）':"")+(fix?"・組み合わせ <b>"+f0.toFixed(0)+" %</b>"+(f0>2?'（<span class="warn">まだ残っていると示す</span>）':'（<span class="ok">0 % に近い</span>）'):"");
      s+="<br>電圧からの推定は、"+(coin?"平らな所では誤差が大きい（傾き 1.5 mV/% なので、電圧の誤差 "+Math.round(sg*1000)+" mV は約 "+Math.round(sg*1000/1.5)+" %）":"傾きのある所では誤差が小さい（残量 50 % の近くで 5.5 mV/%）")+(load?'。<span class="warn">電流を流しながら測ると、内部抵抗の分だけ少なく読める</span>':"");
      ro.innerHTML=s+'<div class="wnote">本当の残量は、実際に使える電荷に対する割合。「数えた電荷の誤差」は、動作 1 回の電荷や電流の測定の誤差をまとめたもの（負なら本当より少なく数える）。組み合わせは、リチウムイオン電池では残量 50 % の時点で 1 回休み、電圧の表に合わせ直したとし、使い終わりの近く（電圧の表で 10 % 以下）でも合わせ直す。コイン形では、送信の直後の電圧が 2.45 V（3 節の LOW）を下回ったら 10 % 以下に下げ、2.35 V で 0 % とした。値はすべて例の値。</div>';
    }
    draw();
  };
