  /* ===== 08 章 周波数応答とボード線図 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w08_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w08_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w08_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=(+v).toExponential(1);return s.replace(/^-/,"−");}
  /* 有効数字 d 桁（末尾の 0 を残す。例 4.80） */
  function _w08_p3(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace(/^-/,"−");}
  /* 低い角周波数の漸近形 K0/(jω)^N の位相 [°]（K0 が負なら −180°）。本文 5 節の図と同じ約束で位相をつなぐ */
  function _w08_ph0(num,den){var n=num.slice(),d=den.slice(),N=0;while(d.length>1&&d[d.length-1]===0){d.pop();N++;}while(n.length>1&&n[n.length-1]===0){n.pop();N--;}return (n[n.length-1]/d[d.length-1]<0?-180:0)-90*N;}
  /* U.ctl.bode の結果の位相を、上の約束の始まりにそろえ直す（360° の整数倍だけずらす） */
  function _w08_bode(U,G,ws){var b=U.ctl.bode(G,ws),ref=_w08_ph0(G.num,G.den)-(G.delay||0)*ws[0]*180/Math.PI,sh=Math.round((ref-b.ph[0])/360)*360;
    if(sh)b.ph=b.ph.map(function(p){return p+sh;});return b;}
  /* 1 つの角周波数の位相を、近い値 near に合うように 360° の整数倍を選んで返す */
  function _w08_phAt(U,G,w,near){var v=U.ctl.freq(G,w),p=Math.atan2(v.im,v.re)*180/Math.PI;return p+Math.round((near-p)/360)*360;}
  /* 曲線 (xs, ys) の x での値（対数の x で直線補間） */
  function _w08_interp(xs,ys,x){if(x<=xs[0])return ys[0];for(var i=1;i<xs.length;i++)if(xs[i]>=x){var a=Math.log(xs[i-1]),b=Math.log(xs[i]),f=(Math.log(x)-a)/(b-a);return ys[i-1]+f*(ys[i]-ys[i-1]);}return ys[ys.length-1];}
  /* ばねのジグザグ（x1 から x2 へ、高さ y） */
  function _w08_spring(S,x1,x2,y,c){var n=8,pts=[[x1,y],[x1+6,y]],L=x2-x1-12;for(var i=0;i<n;i++)pts.push([x1+6+L*(i+0.5)/n,y+(i%2?6:-6)]);pts.push([x2-6,y]);pts.push([x2,y]);return S.PL(pts,c,1.5);}
  function _w08_damper(S,x1,x2,y,c){var m=(x1+x2)/2;return S.L(x1,y,m-4,y,c,1.5)+S.PL([[m-10,y-7],[m+6,y-7],[m+6,y+7],[m-10,y+7]],c,1.5)+S.L(m-4,y-5,m-4,y+5,c,2)+S.L(m-4,y,x2,y,c,1.5);}

  /* ---- 3 節: 正弦波の入出力・G(jω) の矢印・ボード線図の上の点 ---- */
  var _W08_OBJ=[
    {nm:"台車の速度（一次遅れ）",num:[0.5],den:[0.5,1],L:0,wc:2,lo:-2,hi:2,ex:2,uN:"力 u [N]",yN:"速度 y [m/s]",gu:"(m/s)/N",uu:"N",yu:"m/s",ys:1,pic:"cart",slow:0.5},
    {nm:"台車とばね・ダンパ（二次遅れ）",num:[1],den:[1,2,25],L:0,wc:5,lo:-1.5,hi:1.5,ex:4.796,uN:"力 u [N]",yN:"位置 y [cm]",gu:"m/N",uu:"N",yu:"cm",ys:100,pic:"spring",slow:1},
    {nm:"付け根を動かす台車（零点あり）",num:[2,25],den:[1,2,25],L:0,wc:5,lo:-1.5,hi:1.5,ex:5,uN:"付け根 u [cm]",yN:"台車 y [cm]",gu:"倍",uu:"cm",yu:"cm",ys:1,pic:"base",slow:1},
    {nm:"温度の板（一次遅れ＋むだ時間）",num:[1.25],den:[500,1],L:20,wc:0.0063246,lo:-1.5,hi:1.5,ex:0.05,uN:"電力 u [W]",yN:"温度 y [K]",gu:"K/W",uu:"W",yu:"K",ys:1,pic:"plate",slow:500}
  ];
  REG.w08_sine=function(el,U){
    var S=U.S;
    U.head(el,"SINE WAVE","正弦波を入れる — 波形・G(jω) の矢印・ボード線図の上の点");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W08_OBJ.map(function(o){return o.nm;}),0,function(){var o=_W08_OBJ[ob.get()];wx.set(Math.log10(o.ex/o.wc));tk.stop();draw();});
    var vw=U.select(r1,"右上の図",["G(jω) の矢印（複素平面）","極・零点から jω への矢印（s 平面）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var wx=U.slider(r2,"角周波数 ω",{min:-2,max:2,step:0.005,value:0,fmt:function(v){return _w08_p3(cur().wc*Math.pow(10,v),3)+" rad/s";},onInput:function(){draw();}});
    wx.el.style.flex="1 1 100%";
    var br=U.btnrow(el);
    function pre(k,w){ob.set(k);var o=_W08_OBJ[k];wx.set(Math.log10(w/o.wc));draw();}
    U.button(br,"本文の例（台車の速度・2 rad/s）",function(){pre(0,2);});
    U.button(br,"0.5 rad/s",function(){pre(0,0.5);});
    U.button(br,"8 rad/s",function(){pre(0,8);});
    U.button(br,"台車とばね: 共振 4.80 rad/s",function(){pre(1,4.796);});
    U.button(br,"温度の板 0.05 rad/s",function(){pre(3,0.05);});
    var br2=U.btnrow(el);
    var th=0,tk=U.ticker(function(){th+=2*Math.PI*0.02;drawAnim();},40);
    U.button(br2,"▶ 再生",function(){tk.start();});
    U.button(br2,"■ 止める",function(){tk.stop();});
    var box=U.svgbox(el),ro=U.readout(el),st=null;
    function cur(){return _W08_OBJ[ob.get()];}
    /* 対象ごとの、角周波数の範囲での最大のゲイン（右の目盛に使う） */
    _W08_OBJ.forEach(function(o){if(o.gmax)return;var G=U.ctl.tf(o.num,o.den,o.L),m=0;for(var i=0;i<=300;i++){var w=o.wc*Math.pow(10,o.lo+(o.hi-o.lo)*i/300);m=Math.max(m,U.ctl.cx.abs(U.ctl.freq(G,w)));}o.gmax=m;});
    /* 止まった状態から正弦波を入れて数値計算し、最後の 2 周期から振幅と位相を測る */
    function sim(o,w){var G=U.ctl.tf(o.num,o.den,o.L),P=2*Math.PI/w,ts=Math.max(6*o.slow+o.L,3*P),np=Math.ceil(ts/P)+2,M=64,n=np*M,tEnd=np*P,h=tEnd/n;
      var r=U.ctl.lsim(G,function(t){return Math.sin(w*(t+h/2));},tEnd,n),ss=0,sc=0;
      for(var k=n-2*M;k<n;k++){ss+=r.y[k]*Math.sin(w*r.t[k]);sc+=r.y[k]*Math.cos(w*r.t[k]);}
      var re=ss/M,im=sc/M;return {amp:Math.hypot(re,im),ph:Math.atan2(im,re)*180/Math.PI,r:r,n:n,M:M,P:P,t0:tEnd-2*P};}
    function draw(){
      var o=cur(),w=o.wc*Math.pow(10,wx.get()),G=U.ctl.tf(o.num,o.den,o.L),wlo=o.wc*Math.pow(10,o.lo),whi=o.wc*Math.pow(10,o.hi);
      var ws=U.ctl.logspace(Math.log10(wlo),Math.log10(whi),400),B=_w08_bode(U,G,ws),gv=U.ctl.freq(G,w),gain=U.ctl.cx.abs(gv);
      var ph=_w08_phAt(U,G,w,_w08_interp(ws,B.ph,w)),sm=sim(o,w);
      var phs=sm.ph+Math.round((ph-sm.ph)/360)*360;
      st={o:o,w:w,G:G,ws:ws,B:B,gv:gv,gain:gain,ph:ph,sm:sm};
      drawAnim();
      var dt=-ph*Math.PI/180/w;
      var h="ω = <b>"+_w08_p3(w,3)+" rad/s</b>（周期 "+_w08_p3(2*Math.PI/w,3)+" s）: G(jω) = "+_w08_p3(gv.re,3)+(gv.im<0?" − ":" + ")+"<i>j</i>"+_w08_p3(Math.abs(gv.im),3)+"<br>";
      h+="ゲイン |G(jω)| = <b>"+_w08_p3(gain,3)+" "+o.gu+"</b>（"+_w08_f(20*Math.log10(gain),2)+" dB）、位相 ∠G(jω) = <b>"+_w08_f(ph,1)+"°</b>（出力の山は入力の山より "+_w08_p3(dt,3)+" s 遅れる）<br>";
      h+="数値計算の定常状態（最後の 2 周期）から測った値: ゲイン "+_w08_p3(sm.amp,3)+"、位相 "+_w08_f(phs,1)+"°";
      if(o.L)h+="<br>むだ時間 "+o.L+" s の分の位相 −ωL = "+_w08_f(-w*o.L*180/Math.PI,1)+"°（むだ時間を除いた部分 "+_w08_f(ph+w*o.L*180/Math.PI,1)+"°）";
      ro.innerHTML=h+'<div class="wnote">入力の振幅は 1（'+o.uu+'）。数値計算は、止まった状態から正弦波を入れ、極の項が消えるまで（最も遅い時定数の 6 倍以上）進めた。上の波形は、その最後の 2 周期（定常状態）である。</div>';
    }
    function drawAnim(){
      if(!st)return;
      var o=st.o,w=st.w,P=2*Math.PI/w,nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var tc=((th/w)%(2*P)+2*P)%(2*P);
      /* (a) 定常状態の波形（左の目盛は入力、右の目盛は出力） */
      var ax=nar?52:60,aw=nar?300:340,ay=28,ah=118;
      var pa=U.plot(ax,ay,aw,ah,[0,2*P],[-1.25,1.25]);
      O.push(S.T(ax-2,ay-12,"(a) 定常状態の 2 周期","start",10.5,"ink",true));
      O.push(pa.axes({xl:"時間 t [s]（2 周期）",yl:o.uN,xt:[0,P,2*P],yt:[-1,0,1],xfmt:function(v){return _w08_sig(v,3);},yfmt:function(v){return _w08_sig(v,2);},ylOff:nar?34:40}));
      /* 右の目盛（出力）: 範囲の中の最大の振幅を、左の目盛の 1 と同じ高さにする */
      var ymx=o.gmax*o.ys,Yo=function(v){return pa.Y(v/ymx);};
      O.push(S.L(ax+aw,ay,ax+aw,ay+ah,"signal",1));
      [-1,0,1].forEach(function(k){var v=k*ymx,yy=Yo(v);O.push(S.L(ax+aw,yy,ax+aw+4,yy,"signal",1));O.push(S.T(ax+aw+7,yy+3.3,_w08_sig(v,2),"start",9,"signal"));});
      O.push(S.TX(ax+aw+(nar?34:44),ay+ah/2,o.yN,"middle",10,"signal",false,false,90));
      var su=[],sy=[],r=st.sm.r,t0=st.sm.t0;
      for(var k=0;k<=200;k++){var t=2*P*k/200;su.push([pa.X(t),pa.Y(Math.sin(w*(t0+t)))]);}
      for(var k2=st.sm.n-2*st.sm.M;k2<=st.sm.n;k2++){sy.push([pa.X(r.t[k2]-t0),Yo(r.y[k2]*o.ys)]);}
      O.push(S.PL(su,"gold",1.6));O.push(S.PL(sy,"signal",2.2));
      /* 山と遅れ */
      var th0=w*t0,tu=(Math.PI/2+2*Math.PI*Math.ceil((th0-Math.PI/2)/(2*Math.PI)))/w-t0,lag=-st.ph*Math.PI/180/w;
      if(tu+lag>2*P)tu-=P;if(tu<0)tu+=P;
      if(tu>=0&&tu+lag<=2*P+1e-9){var yA=st.gain*o.ys;
        O.push(S.D(pa.X(tu),pa.Y(1),"gold",3.4));O.push(S.D(pa.X(tu+lag),Yo(yA),"signal",3.4));
        O.push(S.L(pa.X(tu),pa.Y(1),pa.X(tu),ay+ah,"gold",1,"2 2"));O.push(S.L(pa.X(tu+lag),Yo(yA),pa.X(tu+lag),ay+ah,"signal",1,"2 2"));
        if(pa.X(tu+lag)-pa.X(tu)>10)O.push(S.ARR(pa.X(tu),ay+ah-8,pa.X(tu+lag),ay+ah-8,"muted",1.2,6));}
      O.push(S.L(pa.X(tc),ay,pa.X(tc),ay+ah,"faint",1.2));
      /* (b) 右上: 複素平面か s 平面 */
      var bx=nar?60:452,by=nar?ay+ah+62:28,bw=nar?280:238,bh=nar?190:176;
      if(vw.get()===0)O.push(drawVec(bx,by,bw,bh));else O.push(drawS(bx,by,bw,bh));
      /* (c) 動く絵 */
      var cy=nar?by+bh+46:ay+ah+58,cx0=nar?40:60,cw=nar?320:340;
      O.push(drawPic(cx0,cy,cw,tc));
      /* (d) ボード線図 */
      var dy=cy+104,bs=U.ctl.bodeSvg([{w:st.ws,db:st.B.db,ph:st.B.ph,c:"signal",lw:2.2}],{x:nar?56:64,y:dy,w:nar?310:600,hm:nar?100:110,hp:nar?90:100,gap:30,wr:[st.ws[0],st.ws[st.ws.length-1]]});
      O.push(S.T(nar?14:20,dy-8,"(d) ボード線図（点は今の角周波数）","start",10.5,"ink",true));
      O.push(bs.svg);
      var gdb=20*Math.log10(st.gain);
      O.push(S.L(bs.Pm.X(w),bs.Pm.y,bs.Pm.X(w),bs.Pp.y+bs.Pp.h,"faint",1,"3 3"));
      O.push(S.D(bs.Pm.X(w),bs.Pm.Y(Math.max(bs.Pm.yr[0],Math.min(bs.Pm.yr[1],gdb))),"gold",4.2));
      O.push(S.D(bs.Pp.X(w),bs.Pp.Y(Math.max(bs.Pp.yr[0],Math.min(bs.Pp.yr[1],st.ph))),"gold",4.2));
      O.push(S.T(bs.Pm.X(w)+7,bs.Pm.Y(gdb)-6,_w08_f(gdb,2)+" dB","start",9.5,"gold",true,false,null,true));
      O.push(S.T(bs.Pp.X(w)+7,bs.Pp.Y(st.ph)+14,_w08_f(st.ph,1)+"°","start",9.5,"gold",true,false,null,true));
      box.set(S.svg(Wd,bs.h+6,O));
    }
    function drawVec(x,y,w,h){
      var o=[],G=st.G,pts=[],ext=[0,0,0,0];
      for(var i=0;i<st.ws.length;i++){var v=U.ctl.freq(G,st.ws[i]);pts.push([v.re,v.im]);ext[0]=Math.min(ext[0],v.re);ext[1]=Math.max(ext[1],v.re);ext[2]=Math.min(ext[2],v.im);ext[3]=Math.max(ext[3],v.im);}
      var dx=(ext[1]-ext[0])*1.2||1,dy=(ext[3]-ext[2])*1.2||1,sc=Math.min(w/dx,(h-26)/dy),cxv=(ext[0]+ext[1])/2,cyv=(ext[2]+ext[3])/2;
      var X=function(v){return x+w/2+(v-cxv)*sc;},Y=function(v){return y+16+(h-26)/2-(v-cyv)*sc;};
      o.push(S.T(x,y-0,"(b) G(jω) の矢印（複素平面）","start",10.5,"ink",true));
      o.push(S.L(X(ext[0]-0.1*dx),Y(0),X(ext[1]+0.1*dx),Y(0),"muted",1));o.push(S.L(X(0),Y(ext[2]-0.1*dy),X(0),Y(ext[3]+0.1*dy),"muted",1));
      o.push(S.T(X(ext[1]+0.1*dx),Y(0)-5,"実部","end",9,"muted"));
      o.push(S.PL(pts.map(function(p){return [X(p[0]),Y(p[1])];}),"muted",1.2,null,"4 3"));
      o.push(S.ARR(X(0),Y(0),X(st.gv.re),Y(st.gv.im),"signal",2.4,8));
      var g0=pts[0];o.push(S.D(X(g0[0]),Y(g0[1]),"ink",2.8));
      o.push(S.T(x,y+h+4,"|G| = "+_w08_p3(st.gain,3)+"、∠G = "+_w08_f(st.ph,1)+"°","start",9.5,"signal",true));
      o.push(S.T(x,y+h+18,"破線: ω を動かしたときの先端の道筋","start",9,"muted"));
      return o.join("");
    }
    function drawS(x,y,w,h){
      var o=[],ps=U.ctl.poles(st.G),zs=U.ctl.zeros(st.G),pts=ps.concat(zs),x0=0,x1=0,y0=0,y1=st.w;
      pts.forEach(function(p){x0=Math.min(x0,p.re);x1=Math.max(x1,p.re);y0=Math.min(y0,p.im);y1=Math.max(y1,p.im);});
      var xs=(x1-x0)||st.w,ys=(y1-y0)||st.w;x0-=0.15*xs;x1+=0.25*xs;y0-=0.12*ys;y1+=0.18*ys;
      /* 縦と横の目盛の大きさをそろえ（角度が正しく見えるように）、すべての点を枠に入れる */
      var pw=w-34,ph=h-30,sc=Math.min(pw/(x1-x0),ph/(y1-y0)),xm=(x0+x1)/2,ymd=(y0+y1)/2;
      var P=U.plot(x+26,y+14,pw,ph,[xm-pw/sc/2,xm+pw/sc/2],[ymd-ph/sc/2,ymd+ph/sc/2]);
      o.push(S.T(x,y-0,"(b) 極・零点から jω への矢印","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));o.push(U.ctl.splane(P));
      var jw={re:0,im:st.w};
      zs.forEach(function(z){o.push(S.ARR(P.X(z.re),P.Y(z.im),P.X(0),P.Y(st.w),"teal",1.6,7));});
      ps.forEach(function(p){o.push(S.ARR(P.X(p.re),P.Y(p.im),P.X(0),P.Y(st.w),"purple",1.6,7));});
      o.push(U.ctl.pz(P,ps,zs,"signal",5));o.push(S.D(P.X(0),P.Y(st.w),"gold",4.2));
      o.push(S.T(P.X(0)-6,P.Y(st.w)-6,"jω","end",10,"gold",true,false,null,true));
      var tx="";zs.forEach(function(z){tx+="零点 "+_w08_sig(z.re,3)+" から "+_w08_sig(Math.hypot(st.w-z.im,z.re),3)+"・";});
      ps.forEach(function(p){tx+="極 "+_w08_sig(p.re,3)+(Math.abs(p.im)>1e-9?(p.im>0?"+":"−")+"j"+_w08_sig(Math.abs(p.im),3):"")+" から "+_w08_sig(Math.hypot(st.w-p.im,p.re),3)+"・";});
      o.push(S.T(x,y+h+8,"距離: "+tx.replace(/・$/,"")+(st.o.L?"（むだ時間は s 平面に現れない）":""),"start",8.5,"muted"));
      return o.join("");
    }
    function drawPic(x,y,w,tc){
      var o=st.o,wv=st.w,o2=[],t=st.sm.t0+tc,u=Math.sin(wv*t),yv=st.gain*Math.sin(wv*t+st.ph*Math.PI/180),gm=o.gmax;
      o2.push(S.T(x-2,y-6,"(c) 今の時刻の様子（縦線の時刻）","start",10.5,"ink",true));
      var gy=y+44;
      if(o.pic==="cart"){var amp=st.gain/wv,p=-amp*Math.cos(wv*t+st.ph*Math.PI/180),pm=Math.max(amp,1e-9),cx=x+w/2+60*p/pm;
        o2.push(S.L(x,gy+12,x+w,gy+12,"muted",1.2));
        o2.push(S.RECT(cx-24,gy-14,48,22,4,"var(--signal-soft)","signal",1.4));o2.push(S.CIRC(cx-12,gy+7,5,"signal",1.4,"screen"));o2.push(S.CIRC(cx+12,gy+7,5,"signal",1.4,"screen"));
        if(Math.abs(u)>0.03)o2.push(S.ARR(cx,gy-3,cx+40*u,gy-3,"gold",2.4,8));
        o2.push(S.T(x+w,y+70,"位置の振れ ±"+_w08_sig(amp,3)+" m（絵は ±60 px）","end",9,"muted"));}
      else if(o.pic==="spring"||o.pic==="base"){var sc=60/(gm*(o.pic==="spring"?o.ys:1.0)),xw=x+18;
        var ub=o.pic==="base"?u:0,yy=yv*o.ys;
        var bx=o.pic==="base"?xw+sc*ub:xw;
        o2.push(S.L(x,gy+12,x+w,gy+12,"muted",1.2));
        if(o.pic==="base"){o2.push(S.RECT(bx-12,gy-22,12,40,2,"var(--gold-soft)","gold",1.4));o2.push(S.T(bx-6,gy+26,"付け根","middle",9,"gold"));}
        else{o2.push(S.L(xw,gy-24,xw,gy+12,"muted",2));o2.push(S.T(xw,gy+26,"壁","middle",9,"muted"));}
        var cx=x+w/2+sc*yy;
        o2.push(_w08_spring(S,bx,cx-24,gy-10,"teal"));o2.push(_w08_damper(S,bx,cx-24,gy+2,"purple"));
        o2.push(S.RECT(cx-24,gy-16,48,24,4,"var(--signal-soft)","signal",1.4));o2.push(S.CIRC(cx-12,gy+8,4,"signal",1.4,"screen"));o2.push(S.CIRC(cx+12,gy+8,4,"signal",1.4,"screen"));
        if(o.pic==="spring"&&Math.abs(u)>0.03)o2.push(S.ARR(cx+24,gy-4,cx+24+36*u,gy-4,"gold",2.4,8));
        o2.push(S.T(x+w,y+70,"台車の振れ ±"+_w08_sig(st.gain*(o.pic==="spring"?100:1),3)+" cm","end",9,"muted"));}
      else{var hu=(u+1)/2,hy=0.5+0.5*yv/(gm||1);
        o2.push(S.RECT(x+20,gy-24,26,40,2,"screen","line",1));o2.push(S.RECT(x+20,gy+16-40*hu,26,40*hu,2,"var(--gold-soft)","gold",1.2));
        o2.push(S.T(x+33,gy+27,"ヒータ","middle",9,"gold"));
        o2.push(S.RECT(x+90,gy-24,16,40,8,"screen","line",1));o2.push(S.RECT(x+92,gy+14-36*Math.max(0,Math.min(1,hy)),12,36*Math.max(0,Math.min(1,hy)),6,"var(--signal-soft)","signal",1.2));
        o2.push(S.T(x+98,gy+27,"温度","middle",9,"signal"));
        o2.push(S.T(x+130,gy-4,"電力の揺れ: "+(u>=0?"+":"−")+_w08_f(Math.abs(u),2)+" W","start",9.5,"gold"));
        o2.push(S.T(x+130,gy+12,"温度の揺れ: "+(yv>=0?"+":"−")+_w08_f(Math.abs(yv),3)+" K（振幅 "+_w08_sig(st.gain,3)+" K）","start",9.5,"signal"));}
      return o2.join("");
    }
    draw();
  };

  /* ---- 5 節: 要素を組み合わせてボード線図を作る ---- */
  REG.w08_build=function(el,U){
    var S=U.S,P=U.ctl.poly;
    U.head(el,"BUILD","要素を掛け合わせてボード線図を組み立てる — 漸近線と本当の線");
    var lg=function(v){return _w08_sig(v,3);};
    var r1=U.ctrls(el);
    var kk=U.slider(r1,"定数 K",{min:0.01,max:1000,log:true,value:10.5,fmt:function(v){return lg(v)+"（"+_w08_f(20*Math.log10(v),2)+" dB）";},onInput:function(){draw();}});
    var org=U.select(r1,"原点の極・零点",["なし","積分 1/s","積分 2 つ 1/s²","微分 s"],1,function(){draw();});
    var r2=U.ctrls(el);
    var c1=U.checkbox(r2,"一次遅れ 1",true,function(){draw();});
    var w1=U.slider(r2,"折れ点 1",{min:0.001,max:1000,log:true,value:20,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var c2=U.checkbox(r2,"一次遅れ 2",false,function(){draw();});
    var w2=U.slider(r2,"折れ点 2",{min:0.001,max:1000,log:true,value:200,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cz=U.checkbox(r3,"零点（一次進み）",false,function(){draw();});
    var wz=U.slider(r3,"零点の折れ点",{min:0.001,max:1000,log:true,value:12.5,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var rz=U.checkbox(r3,"零点を右半平面に置く",false,function(){draw();});
    var r4=U.ctrls(el);
    var c4=U.checkbox(r4,"二次遅れ",false,function(){draw();});
    var wn=U.slider(r4,"固有角周波数 ω<sub>n</sub>",{min:0.001,max:1000,log:true,value:5,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var ze=U.slider(r4,"減衰比 ζ",{min:0.05,max:1,step:0.01,value:0.2,fmt:function(v){return _w08_f(v,2);},onInput:function(){draw();}});
    var r5=U.ctrls(el);
    var cL=U.checkbox(r5,"むだ時間",false,function(){draw();});
    var lL=U.slider(r5,"むだ時間 L",{min:0.001,max:100,log:true,value:0.1,fmt:function(v){return lg(v)+" s";},onInput:function(){draw();}});
    var r6=U.ctrls(el);
    var ce=U.checkbox(r6,"要素ごとの線を描く",true,function(){draw();});
    var cm=U.checkbox(r6,"最小位相のもの（同じゲイン）の位相を重ねる",true,function(){draw();});
    var br=U.btnrow(el);
    function setAll(K,N,a,b,z,s,L){kk.set(K);org.set(N);c1.set(!!a);if(a)w1.set(a);c2.set(!!b);if(b)w2.set(b);cz.set(!!z);if(z){wz.set(Math.abs(z));rz.set(z<0);}else rz.set(false);c4.set(!!s);if(s){wn.set(s[0]);ze.set(s[1]);}cL.set(!!L);if(L)lL.set(L);draw();}
    U.button(br,"本文の例（モータの位置の一巡伝達関数）",function(){setAll(10.5,1,20,0,0,null,0);});
    U.button(br,"付け根を動かす台車",function(){setAll(1,0,0,0,12.5,[5,0.2],0);});
    U.button(br,"ボイラ（右半平面の零点）",function(){setAll(0.5,1,0.1,0,-1/30,null,0);});
    U.button(br,"温度の板（むだ時間）",function(){setAll(1.25,0,0.002,0,0,null,20);});
    U.button(br,"一次遅れだけ（台車の速度）",function(){setAll(0.5,0,2,0,0,null,0);});
    var box=U.svgbox(el),ro=U.readout(el);
    function model(minph){
      var K=kk.get(),N=[0,1,2,-1][org.get()],num=[K],den=[1],cor=[],el=[],L=0;
      if(N>0)for(var i=0;i<N;i++)den=P.mul(den,[1,0]);if(N<0)num=P.mul(num,[1,0]);
      el.push({nm:"定数 "+lg(K),c:"purple",f:function(w){return {db:20*Math.log10(K),ph:0};}});
      if(N!==0)el.push({nm:N>0?(N===1?"積分 1/s":"積分 1/s²"):"微分 s",c:"teal",f:function(w){return {db:-20*N*Math.log10(w),ph:-90*N};}});
      if(c1.get()){var a=w1.get();den=P.mul(den,[1/a,1]);cor.push({w:a,d:-20,nm:"一次遅れ"});el.push({nm:"一次遅れ（"+lg(a)+"）",c:"green",f:function(w){return {db:-10*Math.log10(1+w*w/(a*a)),ph:-Math.atan(w/a)*180/Math.PI};}});}
      if(c2.get()){var b=w2.get();den=P.mul(den,[1/b,1]);cor.push({w:b,d:-20,nm:"一次遅れ"});el.push({nm:"一次遅れ（"+lg(b)+"）",c:"green",dash:"2 3",f:function(w){return {db:-10*Math.log10(1+w*w/(b*b)),ph:-Math.atan(w/b)*180/Math.PI};}});}
      if(cz.get()){var z=wz.get(),rh=rz.get()&&!minph;num=P.mul(num,[rh?-1/z:1/z,1]);cor.push({w:z,d:20,nm:rh?"右半平面の零点":"零点"});
        el.push({nm:(rh?"右半平面の零点（":"零点（")+lg(z)+"）",c:"alias",f:function(w){return {db:10*Math.log10(1+w*w/(z*z)),ph:(rh?-1:1)*Math.atan(w/z)*180/Math.PI};}});}
      if(c4.get()){var n=wn.get(),zt=ze.get();den=P.mul(den,[1/(n*n),2*zt/n,1]);cor.push({w:n,d:-40,nm:"二次遅れ"});
        el.push({nm:"二次遅れ（"+lg(n)+"、ζ "+_w08_f(zt,2)+"）",c:"purple",dash:"2 3",f:function(w){var x=w/n,re=1-x*x,im=2*zt*x;return {db:-10*Math.log10(re*re+im*im),ph:-Math.atan2(im,re)*180/Math.PI};}});}
      if(cL.get()&&!minph){L=lL.get();el.push({nm:"むだ時間 "+lg(L)+" s",c:"teal",dash:"2 3",f:function(w){return {db:0,ph:-w*L*180/Math.PI};}});}
      cor.sort(function(p,q){return p.w-q.w;});
      return {G:U.ctl.tf(num,den,L),K:K,N:N,cor:cor,el:el,L:L};
    }
    function asym(m,w){var v=20*Math.log10(m.K)-20*m.N*Math.log10(w);m.cor.forEach(function(c){if(w>c.w)v+=c.d*Math.log10(w/c.w);});return v;}
    function draw(){
      var m=model(false),nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var cs=m.cor.map(function(c){return c.w;});if(m.L)cs.push(1/m.L);if(!cs.length)cs=[1];
      var lo=Math.pow(10,Math.floor(Math.log10(Math.min.apply(null,cs)/30))),hi=Math.pow(10,Math.ceil(Math.log10(Math.max.apply(null,cs)*30)));
      if(m.L){var hm=0;m.cor.forEach(function(c){hm+=c.d<0?-c.d*4.5:0;});var wmax=Math.max(0.5/m.L,(540-hm)/(m.L*57.3));hi=Math.min(hi,Math.pow(10,Math.floor(Math.log10(wmax)*2)/2));}
      if(hi/lo>1e7)lo=hi/1e7;
      var ws=U.ctl.logspace(Math.log10(lo),Math.log10(hi),500),B=_w08_bode(U,m.G,ws);
      var as=ws.map(function(w){return asym(m,w);});
      var dmin=Math.min(Math.min.apply(null,B.db),Math.min.apply(null,as)),dmax=Math.max(Math.max.apply(null,B.db),Math.max.apply(null,as));
      var dbr=[Math.max(-140,Math.floor((dmin-5)/20)*20),Math.min(140,Math.ceil((dmax+5)/20)*20)];
      var pmin=Math.min.apply(null,B.ph),pmax=Math.max.apply(null,B.ph),mp=null;
      if(cm.get()&&((cz.get()&&rz.get())||cL.get())){var mm=model(true);mp=_w08_bode(U,mm.G,ws);pmin=Math.min(pmin,Math.min.apply(null,mp.ph));pmax=Math.max(pmax,Math.max.apply(null,mp.ph));}
      var phr=[Math.max(-720,Math.floor((pmin-1)/90)*90),Math.ceil((pmax+1)/90)*90];if(phr[1]-phr[0]<180)phr[1]=phr[0]+180;
      var bs=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.6}],{x:nar?56:64,y:16,w:nar?310:600,hm:nar?150:170,hp:nar?130:140,gap:34,wr:[lo,hi],dbr:dbr,phr:phr});
      if(ce.get())m.el.forEach(function(e){var g=ws.map(function(w){return [w,e.f(w).db];}),p=ws.map(function(w){return [w,e.f(w).ph];});O.push(bs.Pm.clip(g,e.c,1.1,e.dash));O.push(bs.Pp.clip(p,e.c,1.1,e.dash));});
      O.push(bs.svg);
      O.push(bs.Pm.clip(ws.map(function(w,i){return [w,as[i]];}),"gold",2,"7 4"));
      if(mp)O.push(bs.Pp.clip(ws.map(function(w,i){return [w,mp.ph[i]];}),"green",2,"6 3"));
      m.cor.forEach(function(c){if(c.w>=lo&&c.w<=hi){O.push(S.D(bs.Pm.X(c.w),bs.Pm.Y(Math.max(dbr[0],Math.min(dbr[1],asym(m,c.w)))),"gold",3.4));}});
      var yl=bs.h+4;
      O.push(S.LEGL(nar?20:64,yl,[["signal",null,"本当の線"],["gold","7 4","漸近線（折れ線）"]].concat(mp?[["green","6 3","最小位相の位相"]]:[]),9.5,14));
      if(ce.get()){var per=nar?2:3;for(var e2=0;e2<m.el.length;e2+=per){yl+=16;O.push(S.LEGL(nar?20:64,yl,m.el.slice(e2,e2+per).map(function(e){return [e.c,e.dash||null,e.nm];}),9,12));}}
      box.set(S.svg(Wd,yl+10,O));
      /* 読み出し */
      var txt="G(s) = "+lg(m.K);m.el.slice(1).forEach(function(e){txt+=" × "+e.nm;});
      var h=txt+"<br>";
      var sg=function(v){return (v>0?"+":"")+String(v).replace("-","−");};
      var sl=-20*m.N,seg="低い角周波数の傾き "+sg(sl)+" dB/dec（ω = 1 で "+_w08_f(20*Math.log10(m.K),2)+" dB）";
      m.cor.forEach(function(c){sl+=c.d;seg+=" → "+lg(c.w)+" rad/s（"+c.nm+"）で "+sg(sl)+" dB/dec";});
      h+="漸近線: "+seg+"<br>";
      /* 0 dB を横切る所 */
      var wc=null,wa=null;for(var i=1;i<ws.length;i++){if(wc===null&&(B.db[i-1]>=0)!==(B.db[i]>=0))wc=ws[i-1]*Math.pow(ws[i]/ws[i-1],B.db[i-1]/(B.db[i-1]-B.db[i]));if(wa===null&&(as[i-1]>=0)!==(as[i]>=0))wa=ws[i-1]*Math.pow(ws[i]/ws[i-1],as[i-1]/(as[i-1]-as[i]));}
      if(wc!==null){var pc=_w08_phAt(U,m.G,wc,_w08_interp(ws,B.ph,wc));h+="ゲインが 0 dB を横切る角周波数: 本当の線 <b>"+lg(wc)+" rad/s</b>（位相 "+_w08_f(pc,1)+"°）"+(wa!==null?"、漸近線 "+lg(wa)+" rad/s":"")+"<br>";}
      else h+="この範囲では、ゲインは 0 dB を横切らない<br>";
      var em=0,ew=0;for(var k=0;k<ws.length;k++){var d=B.db[k]-as[k];if(Math.abs(d)>Math.abs(em)){em=d;ew=ws[k];}}
      h+="漸近線との差の最大: "+_w08_f(em,2)+" dB（"+lg(ew)+" rad/s）";
      if(mp){var dmx=0,dw=0;for(var k2=0;k2<ws.length;k2++){var dd=B.ph[k2]-mp.ph[k2];if(dd<dmx){dmx=dd;dw=ws[k2];}}h+="<br>最小位相のもの（零点を左半平面に・むだ時間なし）との位相の差: 最大 "+_w08_f(dmx,1)+"°（"+lg(dw)+" rad/s）。ゲインは同じ";}
      ro.innerHTML=h+'<div class="wnote">本当の線は U.ctl.bode で計算した。漸近線は、低い角周波数の直線から、折れ点ごとに傾きを −20（極）・+20（零点）・−40（二次遅れ）dB/dec 変えた折れ線（二次遅れの山や、右半平面の零点・むだ時間の位相は漸近線に入らない）。</div>';
    }
    draw();
  };

  /* ---- 6 節: 二次遅れの共振ピークとステップ応答の行き過ぎ ---- */
  REG.w08_second=function(el,U){
    var S=U.S;
    U.head(el,"RESONANCE","二次遅れの共振ピーク・バンド幅と、ステップ応答の行き過ぎ量・立ち上がり時間");
    var r1=U.ctrls(el);
    var ze=U.slider(r1,"減衰比 ζ",{min:0.05,max:1.5,step:0.005,value:0.2,fmt:function(v){return _w08_f(v,3);},onInput:function(){draw();}});
    var wn=U.slider(r1,"固有角周波数 ω<sub>n</sub>",{min:0.5,max:200,log:true,value:5,fmt:function(v){return _w08_sig(v,3)+" rad/s";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    function pre(z,w){ze.set(z);wn.set(w);draw();}
    U.button(br,"本文の例（台車とばね ζ 0.2・5 rad/s）",function(){pre(0.2,5);});
    U.button(br,U.htx("モータ K_P = 0.21（ζ 0.690）"),function(){pre(0.69,14.49);});
    U.button(br,U.htx("モータ K_P = 1（ζ 0.316）"),function(){pre(0.3162,31.62);});
    U.button(br,U.htx("モータ K_P = 10（ζ 0.1）"),function(){pre(0.1,100);});
    U.button(br,"ζ = 0.707",function(){pre(0.7072,5);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var z=ze.get(),w=wn.get(),G=U.ctl.tf([w*w],[1,2*z*w,w*w]),nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var ws=U.ctl.logspace(Math.log10(w/30),Math.log10(w*30),500),B=U.ctl.bode(G,ws);
      var bs=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4}],{x:nar?56:60,y:24,w:nar?310:330,hm:120,hp:90,gap:30,wr:[w/30,w*30],dbr:[-60,25],phr:[-180,0]});
      O.push(S.T(nar?14:16,14,"(a) ボード線図","start",10.5,"ink",true));
      O.push(bs.svg);
      O.push(bs.Pm.clip([[w/30,0],[w,0],[w*30,-40*Math.log10(30)]],"muted",1.2,"5 3"));
      O.push(S.L(bs.Pm.x,bs.Pm.Y(-3.01),bs.Pm.x+bs.Pm.w,bs.Pm.Y(-3.01),"faint",1,"3 3"));
      var Mr=1,wr=null;if(z<1/Math.SQRT2){Mr=1/(2*z*Math.sqrt(1-z*z));wr=w*Math.sqrt(1-2*z*z);}
      var q=1-2*z*z,wb=w*Math.sqrt(q+Math.sqrt(q*q+1));
      /* 数値（細かい格子で）の山とバンド幅 */
      var gm=-1e9,gw=0;B.db.forEach(function(v,i){if(v>gm){gm=v;gw=ws[i];}});
      var wbn=null;for(var i=1;i<ws.length;i++)if(B.db[i-1]>=-3.0103&&B.db[i]<-3.0103){wbn=ws[i-1]*Math.pow(ws[i]/ws[i-1],(B.db[i-1]+3.0103)/(B.db[i-1]-B.db[i]));break;}
      if(wr){O.push(S.D(bs.Pm.X(wr),bs.Pm.Y(20*Math.log10(Mr)),"alias",4));O.push(S.TX(bs.Pm.X(wr)-6,bs.Pm.Y(20*Math.log10(Mr))-6,"M_r "+_w08_f(20*Math.log10(Mr),2)+" dB","end",9.5,"alias",true,true));}
      O.push(S.D(bs.Pm.X(wb),bs.Pm.Y(-3.01),"green",4));O.push(S.TX(bs.Pm.X(wb)+6,bs.Pm.Y(-3.01)-6,"ω_b "+_w08_p3(wb,3),"start",9.5,"green",true,true));
      O.push(S.D(bs.Pp.X(w),bs.Pp.Y(-90),"ink",3.4));O.push(S.TX(bs.Pp.X(w)+6,bs.Pp.Y(-90)-5,"ω_n で −90°","start",9.5,"ink",false,true));
      /* ステップ応答 */
      var tE=Math.min(Math.max(10/w,5/(z*w)),40/w),R=U.ctl.step(G,tE,800),T=R.t,Y=R.y;
      var ym=0,tp=0,t10=null,t90=null;for(var k=0;k<Y.length;k++){if(Y[k]>ym){ym=Y[k];tp=T[k];}
        if(t10===null&&Y[k]>=0.1)t10=k>0?T[k-1]+(0.1-Y[k-1])/(Y[k]-Y[k-1])*(T[k]-T[k-1]):0;
        if(t90===null&&Y[k]>=0.9)t90=T[k-1]+(0.9-Y[k-1])/(Y[k]-Y[k-1])*(T[k]-T[k-1]);}
      var Mp=Math.max(0,ym-1),tr=(t10!==null&&t90!==null)?t90-t10:null;
      var qx=nar?56:450,qy=nar?bs.h+30:24,qw=nar?310:230;
      var Q=U.plot(qx,qy,qw,110,[0,tE],[0,2]);
      O.push(S.T(qx-40,qy-10,"(b) ステップ応答","start",10.5,"ink",true));
      O.push(Q.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tE,4),yt:[0,0.5,1,1.5,2],xfmt:function(v){return _w08_sig(v,3);},yfmt:function(v){return _w08_sig(v,2);}}));
      O.push(Q.line([[0,1],[tE,1]],"muted",1,"4 3"));
      O.push(Q.clip(T.map(function(t,i){return [t,Y[i]];}),"signal",2.2));
      if(Mp>0.001){O.push(S.D(Q.X(tp),Q.Y(Math.min(2,ym)),"alias",3.6));O.push(S.TX(Q.X(tp)+6,Q.Y(Math.min(2,ym))-4,"M_p "+_w08_f(Mp*100,1)+" %","start",9.5,"alias",true,true));}
      if(tr!==null){O.push(S.L(Q.X(t10),Q.Y(0.5),Q.X(t90),Q.Y(0.5),"green",3.2));O.push(S.TX(Q.X(t90)+5,Q.Y(0.5)+12,"t_r "+_w08_sig(tr,3)+" s","start",9.5,"green",true,true));}
      /* 共振ピークと行き過ぎ量の曲線 */
      var cx=qx,cy=qy+110+66,C=U.plot(cx,cy,qw,nar?100:96,[0,20],[0,100]);
      O.push(S.T(cx-40,cy-10,"(c) 共振ピークと行き過ぎ量","start",10.5,"ink",true));
      O.push(C.axes({xl:"M_r [dB]",yl:null,xt:[0,5,10,15,20],yt:[0,50,100],xfmt:function(v){return String(v);},yfmt:function(v){return v+" %";}}));
      var cv=[];for(var j=0;j<=200;j++){var zz=0.05+(1/Math.SQRT2-0.05)*j/200;cv.push([20*Math.log10(1/(2*zz*Math.sqrt(1-zz*zz))),100*Math.exp(-Math.PI*zz/Math.sqrt(1-zz*zz))]);}
      O.push(C.line(cv,"signal",1.8));O.push(C.line([[0,4.32],[0,0]],"signal",1.8,"4 3"));
      var mpF=z<1?100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z)):0;
      O.push(S.D(C.X(Math.min(20,20*Math.log10(Mr))),C.Y(mpF),"alias",4.5));
      var Hh=Math.max(bs.h,cy+(nar?100:96)+40);
      box.set(S.svg(Wd,nar?cy+100+44:Hh,O));
      /* 読み出し */
      var h="ζ = "+_w08_f(z,3)+"、ω<sub>n</sub> = "+_w08_sig(w,3)+" rad/s<br>";
      h+="共振ピーク: "+(wr?"式 1/(2ζ√(1 − ζ²)) = <b>"+_w08_sig(Mr,3)+"（"+_w08_f(20*Math.log10(Mr),2)+" dB）</b>、共振角周波数 ω<sub>n</sub>√(1 − 2ζ²) = "+_w08_p3(wr,3)+" rad/s（格子で探した値 "+_w08_f(gm,2)+" dB・"+_w08_p3(gw,3)+" rad/s）":"ζ ≥ 0.707 なので山は無い（0 dB）")+"<br>";
      h+="バンド幅: 式 <b>"+_w08_p3(wb,3)+" rad/s</b>（数値 "+(wbn?_w08_p3(wbn,3):"—")+" rad/s）、ω<sub>b</sub>/ω<sub>n</sub> = "+_w08_f(wb/w,3)+"<br>";
      h+="行き過ぎ量: 式 e^(−πζ/√(1 − ζ²)) = <b>"+(z<1?_w08_f(mpF,1)+" %":"0 %")+"</b>（数値 "+_w08_f(Mp*100,1)+" %）、立ち上がり時間 "+(tr!==null?"<b>"+_w08_p3(tr,3)+" s</b>、ω<sub>b</sub> × t<sub>r</sub> = "+_w08_f(wb*tr,2):"—");
      ro.innerHTML=h+'<div class="wnote">G(s) = ω<sub>n</sub><sup>2</sup>/(s<sup>2</sup> + 2ζω<sub>n</sub>s + ω<sub>n</sub><sup>2</sup>)。ボード線図の横軸は ω<sub>n</sub>/30 から 30ω<sub>n</sub> なので、ω<sub>n</sub> を変えても線の形は変わらず、目盛の数字だけが変わる（時間の目盛も同じ）。</div>';
    }
    draw();
  };

  /* ---- 6 節: 周波数掃引のシミュレーション ---- */
  var _W08_SW=[
    {nm:"温度の板（一次遅れ＋むだ時間）",kind:"fo",K:1.25,T:500,L:20,amp:40,sd:0.3,wlo:0.001,whi:0.2,slow:500,uu:"W",yu:"K",gu:"K/W",wr:[0.0005,0.22],dbr:[-45,5],phr:[-360,0],tg:[1,4]},
    {nm:"台車とばね・ダンパ（二次遅れ）",kind:"so",K:4,wn:5,z:0.2,L:0,amp:1,sd:0.2,wlo:0.5,whi:50,slow:1,uu:"N",yu:"cm",gu:"cm/N",wr:[0.2,100],dbr:[-40,30],phr:[-180,0]},
    {nm:"モータの角速度（一次遅れ）",kind:"fo",K:50,T:0.05,L:0,amp:1,sd:5,wlo:1,whi:1000,slow:0.05,uu:"V",yu:"rad/s",gu:"(rad/s)/V",wr:[0.5,2000],dbr:[-10,40],phr:[-180,0],tg:[-3,0]}
  ];
  REG.w08_sweep=function(el,U){
    var S=U.S;
    U.head(el,"FREQUENCY SWEEP","周波数掃引 — 正弦波を順に入れて、ゲインと位相を測る");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W08_SW.map(function(o){return o.nm;}),0,function(){nz.set(nz.get());sel.set(sel.get());draw();});
    var nz=U.slider(r1,"観測ノイズ（本文の値の何倍か）",{values:[0,0.5,1,2,4],value:1,fmt:function(v){var o=_W08_SW[ob.get()];return v+" 倍（"+_w08_sig(o.sd*v,2)+" "+o.yu+"）";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var np=U.slider(r2,"平均する周期の数",{values:[1,2,3,5,10,20],value:3,fmt:function(v){return v+" 周期";},onInput:function(){draw();}});
    var pd=U.slider(r2,"1 ディケードの点の数",{values:[2,3,5,10],value:3,fmt:function(v){return v+" 点";},onInput:function(){draw();}});
    var wt=U.checkbox(r2,"極の項が消えるまで待つ（最も遅い時定数の 5 倍、少なくとも 1 周期）",true,function(){draw();});
    var r3=U.ctrls(el);
    var sel=U.slider(r3,"記録を見る点（低い方から）",{min:0,max:1,step:0.001,value:3/7,fmt:function(v){var n=npts();return (Math.round(v*(n-1))+1)+" 番目";},onInput:function(){draw();}});
    sel.el.style.flex="1 1 100%";
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（温度の板・3 周期・1 ディケードに 3 点）",function(){ob.set(0);nz.set(1);np.set(3);pd.set(3);wt.set(true);seed=1;sel.set(3/7);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function npts(){var o=_W08_SW[ob.get()];return Math.round(Math.log10(o.whi/o.wlo)*pd.get())+1;}
    /* 1 刻みの式（中点の入力で零次ホールドの遅れを消す）。一次遅れは厳密、二次遅れは行列指数関数で離散化 */
    function run(o){
      var rg=U.rng(seed),n=npts(),nper=np.get(),sd=o.sd*nz.get(),out=[],ttot=0,M=100;
      for(var k=0;k<n;k++){
        var w=o.wlo*Math.pow(o.whi/o.wlo,k/(n-1)),Pd=2*Math.PI/w,dt=Pd/M,Wp=wt.get()?Math.max(1,Math.ceil(5*o.slow/Pd)):0,ss=0,sc=0,rec=[];
        var step;
        if(o.kind==="fo"){var a=Math.exp(-dt/o.T),x=0;step=function(u){var y=x;x=a*x+(1-a)*o.K*u;return y;};}
        else{var A=[[0,1],[-o.wn*o.wn,-2*o.z*o.wn]],Bm=[[0],[o.K*o.wn*o.wn]],dd=U.ctl.mat.c2d(A,Bm,dt),X=[0,0];
          step=function(u){var y=X[0],x0=dd.A[0][0]*X[0]+dd.A[0][1]*X[1]+dd.B[0][0]*u,x1=dd.A[1][0]*X[0]+dd.A[1][1]*X[1]+dd.B[1][0]*u;X=[x0,x1];return y;};}
        for(var i=0;i<(Wp+nper)*M;i++){var t=i*dt,tm=t+dt/2-o.L,u=tm>=0?o.amp*Math.sin(w*tm):0;
          var yv=step(u);
          if(i>=Wp*M){var ym=yv+sd*rg.normal();ss+=ym*Math.sin(w*t);sc+=ym*Math.cos(w*t);rec.push([t-Wp*Pd,ym]);}}
        var re=2*ss/(nper*M)/o.amp,im=2*sc/(nper*M)/o.amp;
        out.push({w:w,gain:Math.hypot(re,im),ph:Math.atan2(im,re)*180/Math.PI,rec:rec,P:Pd,re:re,im:im});
        ttot+=(Wp+nper)*Pd;}
      var prev=null;out.forEach(function(r){if(prev===null){while(r.ph>90)r.ph-=360;}else{while(r.ph-prev>180)r.ph-=360;while(r.ph-prev<-180)r.ph+=360;}prev=r.ph;});
      return {out:out,ttot:ttot};
    }
    function fitFO(out,tg){var best=null;for(var i=0;i<=800;i++){var Tf=Math.pow(10,tg[0]+(tg[1]-tg[0])*i/800),rr=out.map(function(q){return 20*Math.log10(q.gain)+10*Math.log10(1+Math.pow(q.w*Tf,2));}),kd=rr.reduce(function(s,v){return s+v;},0)/rr.length,e=rr.reduce(function(s,v){return s+(v-kd)*(v-kd);},0);if(best===null||e<best[0])best=[e,Tf,Math.pow(10,kd/20)];}
      var Tf2=best[1],nu=0,de=0;out.forEach(function(q){var res=-q.ph*Math.PI/180-Math.atan(q.w*Tf2);nu+=q.w*res;de+=q.w*q.w;});return {K:best[2],T:Tf2,L:nu/de};}
    function fitSO(out){var best=null;for(var i=0;i<=160;i++){var w0=Math.pow(10,Math.log10(1)+Math.log10(25)*i/160);for(var j=0;j<=120;j++){var zz=0.02+0.98*j/120,rr=out.map(function(q){var x=q.w/w0;return 20*Math.log10(q.gain)+10*Math.log10(Math.pow(1-x*x,2)+Math.pow(2*zz*x,2));}),kd=rr.reduce(function(s,v){return s+v;},0)/rr.length,e=rr.reduce(function(s,v){return s+(v-kd)*(v-kd);},0);if(best===null||e<best[0])best=[e,w0,zz,Math.pow(10,kd/20)];}}
      return {K:best[3],wn:best[1],z:best[2]};}
    function trueG(o,w){if(o.kind==="fo"){var re=1,im=w*o.T,g=o.K/Math.hypot(re,im);return {db:20*Math.log10(g),ph:-Math.atan(w*o.T)*180/Math.PI-w*o.L*180/Math.PI};}
      var x=w/o.wn,a=1-x*x,b=2*o.z*x;return {db:20*Math.log10(o.K/Math.hypot(a,b)),ph:-Math.atan2(b,a)*180/Math.PI};}
    function draw(){
      var o=_W08_SW[ob.get()],R=run(o),out=R.out,nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var fit=o.kind==="fo"?fitFO(out,o.tg):fitSO(out);
      var fG=function(w){if(o.kind==="fo")return {db:20*Math.log10(fit.K/Math.hypot(1,w*fit.T)),ph:-Math.atan(w*fit.T)*180/Math.PI-w*fit.L*180/Math.PI};var x=w/fit.wn,a=1-x*x,b=2*fit.z*x;return {db:20*Math.log10(fit.K/Math.hypot(a,b)),ph:-Math.atan2(b,a)*180/Math.PI};};
      /* (a) 選んだ点の記録 */
      var idx=Math.max(0,Math.min(out.length-1,Math.round(sel.get()*(out.length-1)))),r=out[idx],P=r.P,nper=np.get();
      var gA=r.gain*o.amp,ymx=0;r.rec.forEach(function(p){ymx=Math.max(ymx,Math.abs(p[1]));});var lim=Math.max(ymx,gA)*1.15||1;
      var ax=nar?52:64,aw=nar?320:600;
      O.push(S.T(nar?14:20,14,"(a) "+(idx+1)+" 番目の点 ω = "+_w08_sig(r.w,3)+" rad/s（周期 "+_w08_sig(P,3)+" s）の記録: 振幅 "+_w08_sig(gA,3)+" "+o.yu,"start",10,"ink",true));
      O.push(S.RECT(ax,22,aw,16,2,"screen","line",0.8));
      var su=[];for(var k=0;k<=300;k++){var tt=nper*P*k/300;su.push([ax+aw*k/300,30-6*Math.sin(r.w*(tt-o.L+(wt.get()?Math.max(1,Math.ceil(5*o.slow/P))*P:0)))]);}
      O.push(S.PL(su,"gold",1.3));O.push(S.T(ax-4,34,"入力","end",9,"gold"));
      var A=U.plot(ax,44,aw,96,[0,nper*P],[-lim,lim]);
      O.push(A.axes({xl:"平均に使った記録の時間 [s]",yl:null,xt:U.nice(0,nper*P,6),yt:[-_w08_sig(lim*0.8,2)*1,0,+_w08_sig(lim*0.8,2)],xfmt:function(v){return _w08_sig(v,3);},yfmt:function(v){return _w08_sig(v,2);}}));
      var stp=Math.max(1,Math.floor(r.rec.length/400));for(var q=0;q<r.rec.length;q+=stp)O.push(S.D(A.X(r.rec[q][0]),A.Y(r.rec[q][1]),"teal",1.3));
      var fs=[];for(var k2=0;k2<=300;k2++){var t2=nper*P*k2/300,tabs=t2+(wt.get()?Math.max(1,Math.ceil(5*o.slow/P))*P:0);fs.push([t2,gA*Math.sin(r.w*tabs+r.ph*Math.PI/180)]);}
      O.push(A.line(fs,"signal",2));
      /* (b) ボード線図 */
      var ws=U.ctl.logspace(Math.log10(o.wr[0]),Math.log10(o.wr[1]),400),T0=ws.map(function(w){return trueG(o,w);}),F0=ws.map(function(w){return fG(w);});
      var by=200,bs=U.ctl.bodeSvg([{w:ws,db:T0.map(function(v){return v.db;}),ph:T0.map(function(v){return v.ph;}),c:"signal",lw:2.2}],{x:nar?56:64,y:by,w:nar?310:430,hm:120,hp:120,gap:30,wr:o.wr,dbr:o.dbr,phr:o.phr});
      O.push(S.T(nar?14:20,by-10,"(b) 測った点・合わせたモデル（金の破線）・本当の線（青）","start",10,"ink",true));
      O.push(bs.svg);
      if(o.L)O.push(bs.Pp.clip(ws.map(function(w){return [w,-Math.atan(w*o.T)*180/Math.PI];}),"muted",1.2,"4 3"));
      O.push(bs.Pm.clip(ws.map(function(w,i){return [w,F0[i].db];}),"gold",1.6,"5 3"));O.push(bs.Pp.clip(ws.map(function(w,i){return [w,F0[i].ph];}),"gold",1.6,"5 3"));
      out.forEach(function(q,i){var gd=20*Math.log10(q.gain);var c=i===idx?"alias":"teal";
        if(gd>=o.dbr[0]&&gd<=o.dbr[1])O.push(S.CIRC(bs.Pm.X(q.w),bs.Pm.Y(gd),3.8,c,2,"screen"));
        if(q.ph>=o.phr[0]&&q.ph<=o.phr[1])O.push(S.CIRC(bs.Pp.X(q.w),bs.Pp.Y(q.ph),3.8,c,2,"screen"));});
      var lx=nar?56:520,ly=nar?bs.h+10:by+10,L=[];
      L.push(["合わせた値（本当の値）","ink",true]);
      if(o.kind==="fo"){L.push(["K = "+_w08_f(fit.K,3)+" "+o.gu+"（"+o.K+"）","gold",true]);L.push(["T = "+_w08_sig(fit.T,3)+" s（"+o.T+"）","gold",true]);L.push(["L = "+_w08_f(fit.L,o.L?1:3)+" s（"+o.L+"）","gold",true]);}
      else{L.push(["K = "+_w08_f(fit.K,3)+" "+o.gu+"（"+o.K+"）","gold",true]);L.push(["ω_n = "+_w08_f(fit.wn,3)+" rad/s（"+o.wn+"）","gold",true]);L.push(["ζ = "+_w08_f(fit.z,3)+"（"+o.z+"）","gold",true]);}
      L.push(["","ink",false]);
      var tt2=R.ttot;L.push(["かかった時間 "+(tt2>=3600?_w08_f(tt2/3600,1)+" 時間":(tt2>=60?_w08_f(tt2/60,1)+" 分":_w08_sig(tt2,3)+" s")),"ink",true]);
      L.forEach(function(l,i){if(l[0])O.push(S.TX(lx,ly+i*17,l[0],"start",10,l[1],l[2]));});
      O.push(S.LEGL(lx,ly+L.length*17+14,[["signal",null,"本当の線"]],9.5));O.push(S.LEGL(lx,ly+L.length*17+31,[["gold","5 3","合わせたモデル"]],9.5));
      O.push(S.CIRC(lx+12,ly+L.length*17+45,3.6,"teal",2,"screen"));O.push(S.T(lx+30,ly+L.length*17+49,"測った点（赤は (a) の点）","start",9.5,"muted"));
      var H=nar?ly+L.length*17+60:Math.max(bs.h,ly+L.length*17+60);
      box.set(S.svg(Wd,H+4,O));
      /* 読み出し */
      var eg=0,ep=0;out.forEach(function(q){var tg=trueG(o,q.w);eg=Math.max(eg,Math.abs(20*Math.log10(q.gain)-tg.db));ep=Math.max(ep,Math.abs(q.ph-tg.ph));});
      var h="測った点 "+out.length+" 個（"+_w08_sig(o.wlo,3)+"〜"+_w08_sig(o.whi,3)+" rad/s）。本当の線との差の最大: ゲイン "+_w08_f(eg,2)+" dB、位相 "+_w08_f(ep,1)+"°<br>";
      h+="選んだ点: 測ったゲイン "+_w08_sig(r.gain,3)+" "+o.gu+"（本当 "+_w08_sig(Math.pow(10,trueG(o,r.w).db/20),3)+"）、位相 "+_w08_f(r.ph,1)+"°（本当 "+_w08_f(trueG(o,r.w).ph,1)+"°）";
      ro.innerHTML=h+'<div class="wnote">各点で、動作点のまわりに振幅 '+o.amp+' '+o.uu+' の正弦波を入れ、待ち時間の後の記録（1 周期に 100 回測る）に sin と cos を掛けて平均し、G(jω) の実部と虚部を求めた。位相は低い角周波数から順に 360° を足し引きしてつないだ。モデルは、ゲインの点に'+(o.kind==="fo"?' K・T を、位相の残りに L を':' K・ω<sub>n</sub>・ζ を')+'最小二乗法で合わせた。</div>';
    }
    draw();
  };
