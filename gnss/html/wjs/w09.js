/* ===== 09 章 LNA とフィルタ — 雑音指数は最初の段で決まる ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w09_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w09_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
var _W09_KB=1.380649e-23,_W09_T0=290,_W09_C=-128.5,_W09_L1=1575.42,_W09_HB=1.023;
function _w09_u(d){return Math.pow(10,d/10);}
function _w09_db(x){return 10*Math.log10(x);}
/* 段の列 [{n:名前, g:利得 dB, nf:雑音指数 dB}] をフリスの式で計算する。返り値: 各段の寄与と、その段までの Tsys・C/N0 */
function _w09_chain(st,tant){var g=1,tot=0,rows=[];
  st.forEach(function(s){var te=(_w09_u(s.nf)-1)*_W09_T0,c=te/g;tot+=c;var ts=tant+tot;
    rows.push({n:s.n,te:te,gb:g,c:c,tsys:ts,cn0:_W09_C-(_w09_db(_W09_KB*ts)+30)});g*=_w09_u(s.g);});
  return rows;}

/* ---- 5 節の後: 段の並びと各段の値を変えて、フリスの式で全体の雑音と C/N0 を見る ---- */
REG.w09_friis=function(el,U){
  var S=U.S;
  U.head(el,"FRIIS CASCADE","段の並びと雑音 — フリスの式で、全体の雑音指数と C/N0 を計算する");
  var r1=U.ctrls(el);
  var ta=U.slider(r1,"アンテナの雑音温度 T<sub>ant</sub>",{min:30,max:300,step:5,value:100,fmt:function(v){return v+" K";},onInput:function(){draw();}});
  var lnf=U.slider(r1,"LNA の雑音指数",{min:0.3,max:4,step:0.1,value:1.0,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  var lg=U.slider(r1,"LNA の利得",{min:0,max:30,step:0.5,value:18,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var sl=U.slider(r2,"SAW フィルタの挿入損失",{min:0,max:4,step:0.1,value:1.5,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  var cm=U.slider(r2,"ケーブルの長さ",{min:0,max:30,step:0.5,value:0,fmt:function(v){return _w09_f(v,1)+" m（"+_w09_f(0.5*v,2)+" dB）";},onInput:function(){draw();}});
  var cnf=U.slider(r2,"チップの増幅器の雑音指数",{min:1,max:10,step:0.5,value:3,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  /* 並び: 0 = LNA、1 = SAW、2 = ケーブル の順番 */
  var order=[0,1,2];
  var br=U.btnrow(el);
  function setAll(o,a,b,c,d,e,f){order=o.slice();ta.set(a);lnf.set(b);lg.set(c);sl.set(d);cm.set(e);cnf.set(f);draw();}
  U.button(br,"本文の例（1 節: 47.5 dB-Hz）",function(){setAll([0,1,2],100,1.0,18,1.5,0,3);});
  U.button(br,"SAW を LNA の前に（3 節 (b)）",function(){setAll([1,0,2],100,1.0,18,1.5,0,3);});
  U.button(br,"パッシブ + ケーブル 3 m（5 節）",function(){setAll([2,0,1],100,1.0,18,1.5,3,3);});
  U.button(br,"LNA の後にケーブル 3 m",function(){setAll([0,1,2],100,1.0,18,1.5,3,3);});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"上の段の箱（LNA・SAW・ケーブル）を左右にドラッグすると、並びが入れ替わる。アンテナは左端、受信用のチップ（20 dB と 68.5 dB の増幅）は右端に固定。ケーブルの損失は 1 m あたり 0.5 dB（例の値）。");
  var NAME=["LNA","SAW","ケーブル"],COLS=["signal","gold","teal"];
  var geo={x0:0,w:0,y:0,h:0,xs:[]},dragI=-1,dragX=0,dragOff=0;
  function stages(){var st=[];order.forEach(function(k){
      if(k===0)st.push({n:"LNA",g:lg.get(),nf:lnf.get(),k:0});
      else if(k===1)st.push({n:"SAW",g:-sl.get(),nf:sl.get(),k:1});
      else st.push({n:"ケーブル",g:-0.5*cm.get(),nf:0.5*cm.get(),k:2});});
    st.push({n:"増幅 1",g:20,nf:cnf.get(),k:3});st.push({n:"増幅 2",g:68.5,nf:cnf.get(),k:4});return st;}
  function draw(){
    var nar=_w09_nar(box),Wd=nar?400:700,o=[],st=stages(),tant=ta.get(),rows=_w09_chain(st,tant);
    var ideal=_W09_C-(_w09_db(_W09_KB*tant)+30),fin=rows[rows.length-1],teAll=fin.tsys-tant,F=1+teAll/_W09_T0;
    /* (a) 段の並び */
    o.push(S.T(nar?6:14,16,"(a) 段の並び（箱をドラッグで入れ替え）","start",11,"ink",true));
    var bw=nar?62:96,gap=nar?14:26,x=nar?50:94,y=30,h=40;
    o.push(S.CIRC(nar?22:40,y+h/2,10,"muted",1.4));o.push(S.T(nar?22:40,y+h+14,"アンテナ","middle",9.5,"muted"));
    geo.xs=[];geo.y=y;geo.h=h;geo.w=bw;
    for(var i=0;i<3;i++){var k=order[i],xx=x+i*(bw+gap);geo.xs.push(xx);
      if(dragI===i)xx=dragX;
      var s=st[i],lab=k===0?_w09_f(s.g,1)+" dB・NF "+_w09_f(s.nf,1):(k===1?(sl.get()>0?"−":"")+_w09_f(sl.get(),1)+" dB":(cm.get()>0?"−":"")+_w09_f(0.5*cm.get(),2)+" dB");
      o.push(S.ARR(xx-gap+2,y+h/2,xx-1,y+h/2,"muted",1.3));
      o.push(S.RECT(xx,y,bw,h,7,U.soft(COLS[k]),COLS[k],dragI===i?2.6:1.4));
      if(nar&&k===0){o.push(S.T(xx+bw/2,y+13,NAME[k],"middle",10,COLS[k],true));
        o.push(S.T(xx+bw/2,y+25,_w09_f(s.g,1)+" dB","middle",8.5,"muted"));o.push(S.T(xx+bw/2,y+36,"NF "+_w09_f(s.nf,1),"middle",8.5,"muted"));}
      else{o.push(S.T(xx+bw/2,y+17,NAME[k],"middle",nar?10:11,COLS[k],true));
        o.push(S.T(xx+bw/2,y+32,lab,"middle",nar?8.5:9.5,"muted"));}}
    var xc=x+3*(bw+gap);
    o.push(S.ARR(xc-gap+2,y+h/2,xc-1,y+h/2,"muted",1.3));
    o.push(S.RECT(xc,y,nar?(Wd-xc-6):(Wd-xc-14),h,7,"panel","line",1.4));
    o.push(S.T(xc+(nar?(Wd-xc-6):(Wd-xc-14))/2,y+17,"チップ","middle",nar?10:11,"ink",true));
    o.push(S.T(xc+(nar?(Wd-xc-6):(Wd-xc-14))/2,y+32,"NF "+_w09_f(cnf.get(),1)+" dB","middle",nar?8.5:9.5,"muted"));
    /* (b) Tsys の内訳 */
    var yb=y+h+44;
    o.push(S.TX(nar?6:14,yb,"(b) システム雑音温度 T_{sys} の内訳（入力に換算）","start",11,"ink",true));
    var tmax=Math.max(200,Math.ceil(fin.tsys/100)*100),P=U.plot(nar?20:60,yb+10,nar?360:600,26,[0,tmax],[0,1]);
    o.push(P.axes({xt:U.nice(0,tmax,nar?4:6),yt:[],grid:false,xfmt:function(v){return v+" K";}}));
    var segs=[{n:"アンテナ",v:tant,c:"teal"}];rows.forEach(function(r,i){segs.push({n:r.n,v:r.c,c:st[i].k<3?COLS[st[i].k]:(st[i].k===3?"alias":"purple")});});
    var acc=0;segs.forEach(function(s){var x1=P.X(acc),x2=P.X(Math.min(tmax,acc+s.v));o.push(S.RECT(x1,P.y+2,Math.max(0.8,x2-x1),22,2,U.soft(s.c),s.c,1.1));
      if(x2-x1>(nar?54:70))o.push(S.T((x1+x2)/2,P.y+17,s.n+" "+_w09_f(s.v,1),"middle",9.5,s.c,true,false,null,true));acc+=s.v;});
    /* (c) 各段の後の C/N0 */
    var yc=yb+76;
    o.push(S.TX(nar?6:14,yc,"(c) 各段を通った後の C/N_0","start",11,"ink",true));
    var lo=Math.floor(Math.min(fin.cn0,ideal)-1),hi=Math.ceil(ideal+0.5);if(hi-lo<4)lo=hi-4;
    var Q=U.plot(nar?54:90,yc+12,nar?330:560,nar?120:130,[-0.5,rows.length+0.5],[lo,hi]);
    o.push(Q.axes({xt:[],yt:U.nice(lo,hi,4),yl:"[dB-Hz]",yfmt:function(v){return _w09_f(v,0);}}));
    var pts=[[0,ideal]];rows.forEach(function(r,i){pts.push([i+1,r.cn0]);});
    o.push(Q.line(pts,"signal",2.2));
    var nm=["アンテナ"].concat(rows.map(function(r){return r.n;}));
    pts.forEach(function(p,i){o.push(S.D(Q.X(p[0]),Q.Y(p[1]),"signal",3.8));
      o.push(S.T(Q.X(p[0]),Q.Y(p[1])-8,_w09_f(p[1],1),"middle",nar?8.5:9.5,"signal",true,false,null,true));
      o.push(S.T(Q.X(p[0]),Q.y+Q.h+14,nm[i],"middle",nar?8:9.5,"muted"));});
    box.set(S.svg(Wd,yc+12+(nar?120:130)+26,o));
    var warn=fin.cn0<ideal-3?' <span class="warn">（LNA が雑音を足さない場合より '+_w09_f(ideal-fin.cn0,1)+' dB 低い）</span>':' <span class="ok">（LNA が雑音を足さない場合より '+_w09_f(ideal-fin.cn0,1)+' dB 低い）</span>';
    ro.innerHTML="全体の雑音温度 T<sub>e</sub> = <b>"+_w09_f(teAll,1)+" K</b>、全体の雑音指数 = <b>"+_w09_f(_w09_db(F),2)+" dB</b>、T<sub>sys</sub> = "+_w09_f(fin.tsys,1)+" K<br>"+
      "C/N0 = <b>"+_w09_f(fin.cn0,1)+" dB-Hz</b>"+warn+"（受信電力 −128.5 dBm）";
  }
  U.ctl.drag(box,function(ev,px,py){
    if(ev==="down"){for(var i=0;i<3;i++){var xx=geo.xs[i];if(px>=xx&&px<=xx+geo.w&&py>=geo.y&&py<=geo.y+geo.h){dragI=i;dragOff=px-xx;dragX=xx;draw();return true;}}return false;}
    if(ev==="move"&&dragI>=0){dragX=px-dragOff;
      /* 中心の位置で並びを決め直す */
      var cx=dragX+geo.w/2,best=0,bd=1e9;for(var j=0;j<3;j++){var d=Math.abs(geo.xs[j]+geo.w/2-cx);if(d<bd){bd=d;best=j;}}
      if(best!==dragI){var k=order.splice(dragI,1)[0];order.splice(best,0,k);dragI=best;}
      draw();return;}
    if(ev==="up"){dragI=-1;draw();}
  });
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 4 節の後: 2 つの強い電波の 3 次の相互変調の積がどこに落ちるか ---- */
REG.w09_imd=function(el,U){
  var S=U.S;
  U.head(el,"INTERMODULATION","相互変調 — 2 つの強い電波から L1 に落ちる成分");
  var r1=U.ctrls(el);
  var f1=U.slider(r1,"電波 1 の周波数 f<sub>1</sub>",{min:1500,max:2100,step:0.01,value:1712.71,fmt:function(v){return _w09_f(v,2)+" MHz";},onInput:function(){draw();}});
  var f2=U.slider(r1,"電波 2 の周波数 f<sub>2</sub>",{min:1500,max:2100,step:0.01,value:1850.00,fmt:function(v){return _w09_f(v,2)+" MHz";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var p1=U.slider(r2,"f<sub>1</sub> の入力の電力",{min:-70,max:0,step:1,value:-40,fmt:function(v){return _w09_f(v,0)+" dBm";},onInput:function(){draw();}});
  var p2=U.slider(r2,"f<sub>2</sub> の入力の電力",{min:-70,max:0,step:1,value:-40,fmt:function(v){return _w09_f(v,0)+" dBm";},onInput:function(){draw();}});
  var ip=U.slider(r2,"LNA の IIP3",{min:-20,max:15,step:0.5,value:0,fmt:function(v){return _w09_f(v,1)+" dBm";},onInput:function(){draw();}});
  var r3=U.ctrls(el);
  var pre=U.checkbox(r3,"LNA の前に SAW フィルタを置く（3 節 (b)。例の通過特性）",false,function(){draw();});
  var br=U.btnrow(el);
  U.button(br,"本文の例（1712.71 MHz・1850.00 MHz・−40 dBm）",function(){f1.set(1712.71);f2.set(1850.00);p1.set(-40);p2.set(-40);ip.set(0);pre.set(false);draw();});
  U.button(br,"2f₁ − f₂ が L1 に落ちる f₂ にする",function(){var v=2*f1.get()-_W09_L1;if(v>=1500&&v<=2100){f2.set(+v.toFixed(2));}draw();});
  U.button(br,"電力を 10 dB 下げる",function(){p1.set(Math.max(-70,p1.get()-10));p2.set(Math.max(-70,p2.get()-10));draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  /* SAW の通過特性の例（f09.py と同じ形） */
  function saw(f){return -1.5-45*(1-Math.exp(-Math.pow((f-_W09_L1)/28,4)));}
  var NFL=_w09_db(_W09_KB*183.5*2.046e6)+30;   /* 1 節の例の T_sys で、2.046 MHz の帯域の雑音の電力 */
  function draw(){
    var nar=_w09_nar(box),Wd=nar?400:700,o=[];
    var a1=f1.get(),a2=f2.get(),att1=pre.get()?saw(a1):0,att2=pre.get()?saw(a2):0;
    var q1=p1.get()+att1,q2=p2.get()+att2,iip=ip.get();
    var im=[{f:2*a1-a2,p:2*q1+q2-2*iip,n:"2f_1 − f_2"},{f:2*a2-a1,p:2*q2+q1-2*iip,n:"2f_2 − f_1"}];
    var P=U.plot(nar?56:80,30,nar?330:590,nar?200:220,[1400,2200],[-170,0]);
    o.push(S.T(nar?6:14,16,"LNA の入力に換算した電力のスペクトラム","start",11,"ink",true));
    o.push(S.RECT(P.X(_W09_L1-_W09_HB),P.y,Math.max(3,P.X(_W09_L1+_W09_HB)-P.X(_W09_L1-_W09_HB)),P.h,0,U.soft("green"),"green",0.8));
    o.push(P.axes({xl:"周波数 f [MHz]",yl:"電力 [dBm]",xt:nar?[1400,1600,1800,2000,2200]:[1400,1500,1600,1700,1800,1900,2000,2100,2200],yt:[-160,-120,-80,-40,0],yfmt:function(v){return _w09_f(v,0);}}));
    o.push(S.T(P.X(_W09_L1),P.y-4,"L1","middle",10,"green",true));
    /* 参考の線: 衛星の信号と、L1 の帯域の雑音 */
    o.push(S.L(P.X(1400),P.Y(_W09_C),P.X(2200),P.Y(_W09_C),"signal",1,"4 3"));
    o.push(S.T(P.X(2200)-4,P.Y(_W09_C)+13,"衛星の信号 −128.5","end",9,"signal",false,false,null,true));
    o.push(S.L(P.X(1400),P.Y(NFL),P.X(2200),P.Y(NFL),"teal",1,"4 3"));
    o.push(S.T(P.X(2200)-4,P.Y(NFL)-5,"L1 の帯域の雑音 "+_w09_f(NFL,1),"end",9,"teal",false,false,null,true));
    if(pre.get()){var sp=[];for(var f=1400;f<=2200;f+=2)sp.push([f,saw(f)]);o.push(P.clip(sp,"gold",1.2,"2 3"));
      o.push(S.T(P.X(1640),P.Y(-6),"SAW の通過 [dB]","start",9,"gold",false,false,null,true));}
    [[a1,q1,"f_1"],[a2,q2,"f_2"]].forEach(function(t){if(t[0]<1400||t[0]>2200)return;o.push(S.L(P.X(t[0]),P.Y(-170),P.X(t[0]),P.Y(Math.max(-170,t[1])),"alias",2.6));
      o.push(S.TX(P.X(t[0]),P.Y(Math.max(-170,t[1]))-6,t[2],"middle",10,"alias",true,true));});
    var hit=false;
    im.forEach(function(m){var inb=Math.abs(m.f-_W09_L1)<=_W09_HB;if(inb)hit=true;if(m.f<1400||m.f>2200)return;
      var c=inb?(m.p>NFL-20?"alias":"green"):"gold";o.push(S.L(P.X(m.f),P.Y(-170),P.X(m.f),P.Y(Math.max(-170,m.p)),c,2.2));
      o.push(S.TX(P.X(m.f)+4,P.Y(Math.max(-170,m.p))-6,m.n,"start",10,c,true,true));});
    box.set(S.svg(Wd,30+(nar?200:220)+44,o));
    var p1db=iip-9.6,comp=Math.max(q1,q2)>p1db;
    var h="";
    im.forEach(function(m){var inb=Math.abs(m.f-_W09_L1)<=_W09_HB;
      var dd=m.p-_W09_C,rel=(dd>=0?"衛星の信号より "+_w09_f(dd,1)+" dB 強い":"衛星の信号より "+_w09_f(-dd,1)+" dB 弱い"),big=m.p>NFL-20;
      h+=U.htx(m.n.replace("f_1","f_{1}").replace("f_2","f_{2}"))+" = "+_w09_f(m.f,2)+" MHz、"+_w09_f(m.p,1)+" dBm"+(inb?(big?' <span class="warn">L1 の帯域に落ちる（'+rel+'）</span>':' L1 の帯域に落ちるが、帯域の雑音より '+_w09_f(NFL-m.p,1)+' dB 弱い <span class="ok">（影響は小さい）</span>'):"（L1 から "+_w09_f(Math.abs(m.f-_W09_L1),1)+" MHz 離れている）")+"<br>";});
    h+="LNA の入力: 電波 1 "+_w09_f(q1,1)+" dBm、電波 2 "+_w09_f(q2,1)+" dBm"+(pre.get()?"（SAW で "+_w09_f(-att1,1)+" dB・"+_w09_f(-att2,1)+" dB 弱めた後）":"")+"。P1dB ≈ IIP3 − 9.6 = "+_w09_f(p1db,1)+" dBm"+(comp?' <span class="warn">LNA が圧縮する</span>':' <span class="ok">圧縮しない</span>');
    ro.innerHTML=h;
  }
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 6 節の後: アクティブアンテナの給電と監視の回路 ---- */
REG.w09_bias=function(el,U){
  var S=U.S;
  U.head(el,"ANTENNA SUPERVISOR","アンテナの給電と監視 — 電流から正常・開放・短絡を見分ける");
  var r0=U.ctrls(el);
  var stt=U.seg(r0,["正常","開放（外れた）","短絡（芯線と外側）","パッシブ（直流で地板に短絡）"],0,function(){draw();});
  var r1=U.ctrls(el);
  var vs=U.slider(r1,"給電の電圧 V<sub>s</sub>",{min:2.5,max:5.5,step:0.1,value:3.3,fmt:function(v){return _w09_f(v,1)+" V";},onInput:function(){draw();}});
  var rs=U.slider(r1,"電流制限の抵抗 R<sub>s</sub>",{min:1,max:100,step:1,value:22,fmt:function(v){return _w09_f(v,0)+" Ω";},onInput:function(){draw();}});
  var rc=U.slider(r1,"ケーブルの往復の抵抗 R<sub>c</sub>",{min:0,max:5,step:0.1,value:0.5,fmt:function(v){return _w09_f(v,1)+" Ω";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var ia=U.slider(r2,"アンテナの電流",{min:1,max:40,step:0.5,value:15,fmt:function(v){return _w09_f(v,1)+" mA";},onInput:function(){draw();}});
  var vm=U.slider(r2,"アンテナが動く最低の電圧",{min:1.8,max:4.5,step:0.1,value:2.7,fmt:function(v){return _w09_f(v,1)+" V";},onInput:function(){draw();}});
  var to=U.slider(r2,"開放のしきい値",{min:0.5,max:10,step:0.5,value:3,fmt:function(v){return _w09_f(v,1)+" mA";},onInput:function(){draw();}});
  var ts=U.slider(r2,"短絡のしきい値",{min:20,max:200,step:5,value:50,fmt:function(v){return _w09_f(v,0)+" mA";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  U.button(br,"本文の例（3.3 V・22 Ω・15 mA）",function(){vs.set(3.3);rs.set(22);rc.set(0.5);ia.set(15);vm.set(2.7);to.set(3);ts.set(50);stt.set(0);draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function solve(){var V=vs.get(),R=rs.get(),Rc=rc.get(),I=ia.get()/1000,s=stt.get(),cur,van;
    if(s===1){cur=0;van=V;}                       /* 開放: 電流は流れない（アンテナの端子には V_s がそのまま出る） */
    else if(s===2||s===3){cur=V/(R+Rc);van=0;}     /* 短絡: 抵抗だけで電流が決まる（パッシブの直流の短絡も同じ） */
    else{cur=I;van=V-I*(R+Rc);if(van<0){van=0;cur=V/(R+Rc);}}
    return {V:V,R:R,Rc:Rc,I:cur,van:van,vrs:cur*R,pr:cur*cur*R};}
  function draw(){
    var nar=_w09_nar(box),Wd=nar?400:700,o=[],r=solve(),s=stt.get();
    var Ima=r.I*1000,judge=Ima<to.get()?1:(Ima>ts.get()?2:0);
    var JN=["正常","開放","短絡"],JC=["green","gold","alias"];
    /* 回路 */
    var y=46,x0=nar?10:20,k=nar?0.56:1;
    function X(v){return x0+v*k;}
    o.push(S.T(nar?6:14,18,"給電の回路（値は計算した結果）","start",11,"ink",true));
    o.push(S.RECT(X(0),y-16,70*k,32,6,U.soft("purple"),"purple",1.3));o.push(S.T(X(35),y+4,_w09_f(r.V,1)+" V","middle",nar?9:10.5,"purple",true));
    o.push(S.L(X(70),y,X(110),y,"ink",1.4));
    /* 抵抗 */
    var zz=[];for(var i=0;i<=6;i++)zz.push([X(110+i*10),y+(i===0||i===6?0:(i%2?-6:6))]);o.push(S.PL(zz,"ink",1.6));
    o.push(S.TX(X(140),y-12,"R_s "+_w09_f(r.R,0)+" Ω","middle",nar?9:10,"ink",true,true));
    o.push(S.TX(X(140),y+22,"V_{Rs} = "+_w09_f(r.vrs,3)+" V","middle",nar?9:10,JC[judge],true,true));
    o.push(S.L(X(170),y,X(250),y,"ink",1.4));
    o.push(S.RECT(X(250),y-14,80*k,28,6,"panel","purple",1.2));o.push(S.T(X(290),y+4,"バイアス T","middle",nar?9:10,"purple",true));
    o.push(S.L(X(330),y,X(470),y,"teal",3));
    o.push(S.TX(X(400),y-10,"ケーブル R_c "+_w09_f(r.Rc,1)+" Ω","middle",nar?9:10,"teal",true,true));
    var ac=s===0?"signal":(s===1?"gold":"alias");
    o.push(S.RECT(X(470),y-18,(nar?(Wd-X(470)-6):(Wd-X(470)-14)),36,6,U.soft(ac),ac,1.4));
    var an=["アクティブアンテナ","外れている","短絡","パッシブ（直流で短絡）"][s];
    o.push(S.T((X(470)+(nar?Wd-6:Wd-14))/2,y-1,an,"middle",nar?9:10.5,ac,true));
    o.push(S.T((X(470)+(nar?Wd-6:Wd-14))/2,y+13,"端子 "+_w09_f(r.van,2)+" V","middle",nar?8.5:9.5,"muted"));
    if(s===1){o.push(S.X(X(468),y,6,"gold",2));}
    o.push(S.ARR(X(180),y+38,X(240),y+38,"purple",1.5));o.push(S.T(X(250),y+42,"I = "+_w09_f(Ima,1)+" mA","start",nar?9.5:10.5,"purple",true));
    /* 電流の軸と判定の範囲 */
    var yb=y+80;
    o.push(S.T(nar?6:14,yb,"給電の電流と判定の範囲","start",11,"ink",true));
    var imax=Math.max(200,Math.ceil(Ima/50)*50),P=U.plot(nar?20:40,yb+24,nar?360:620,30,[0,imax],[0,1]);
    o.push(S.RECT(P.X(0),P.y,P.X(to.get())-P.X(0),30,0,U.soft("gold"),"gold",0.8));
    o.push(S.RECT(P.X(to.get()),P.y,P.X(Math.min(imax,ts.get()))-P.X(to.get()),30,0,U.soft("green"),"green",0.8));
    o.push(S.RECT(P.X(Math.min(imax,ts.get())),P.y,P.X(imax)-P.X(Math.min(imax,ts.get())),30,0,U.soft("alias"),"alias",0.8));
    o.push(P.axes({xl:"電流 I [mA]",xt:U.nice(0,imax,nar?4:8),yt:[],grid:false}));
    o.push(S.T(P.X((to.get()+Math.min(imax,ts.get()))/2),P.y+19,"正常","middle",10,"green",true,false,null,true));
    o.push(S.T(P.X((Math.min(imax,ts.get())+imax)/2),P.y+19,"短絡","middle",10,"alias",true,false,null,true));
    o.push(S.L(P.X(Math.min(imax,Ima)),P.y-6,P.X(Math.min(imax,Ima)),P.y+36,JC[judge],2.4));
    o.push(S.D(P.X(Math.min(imax,Ima)),P.y-6,JC[judge],4.5));
    box.set(S.svg(Wd,yb+24+30+44,o));
    var h="判定: <b>"+JN[judge]+"</b>"+(judge===0?' <span class="ok">（給電を続ける）</span>':(judge===2?' <span class="warn">（給電のスイッチを切る）</span>':' <span class="warn">（アンテナがつながっていない、と知らせる）</span>'));
    h+="<br>電流 "+_w09_f(Ima,1)+" mA、V<sub>Rs</sub> = "+_w09_f(r.vrs,3)+" V（開放のしきい値 "+_w09_f(to.get()*r.R/1000,3)+" V、短絡のしきい値 "+_w09_f(ts.get()*r.R/1000,3)+" V）、R<sub>s</sub> の電力 "+_w09_f(r.pr*1000,0)+" mW";
    if(s===0){var ok=r.van>=vm.get();h+="<br>アンテナの電圧 "+_w09_f(r.van,2)+" V"+(ok?' <span class="ok">（最低 '+_w09_f(vm.get(),1)+' V 以上。余裕 '+_w09_f(r.van-vm.get(),2)+' V）</span>':' <span class="warn">（最低 '+_w09_f(vm.get(),1)+' V に足りない。R<sub>s</sub> を小さくする）</span>');
      h+="。R<sub>s</sub> の上限 (V<sub>s</sub> − V<sub>min</sub>)/I − R<sub>c</sub> = "+_w09_f((r.V-vm.get())/(ia.get()/1000)-r.Rc,1)+" Ω";}
    if(s===3)h+='<br>パッシブアンテナは素子が直流で地板につながっている物があり、給電すると短絡と判定される。パッシブアンテナをつなぐ機器では給電を切る。';
    ro.innerHTML=h;
  }
  draw();
  window.addEventListener("resize",function(){draw();});
};
