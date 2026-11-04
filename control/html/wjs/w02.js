  /* ===== 02 章 動きを式にする ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w02_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w02_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w02_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s;
    if(a>=1e6||a<1e-4)s=(+v).toExponential(1).replace("e+","×10^").replace("e-","×10^−");
    else s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace(/^-/,"−");}
  /* 斜体と添字を含む文字。parts=[[文字, 添字, 斜体か, 色], ...] */
  function _w02_m(U,x,y,parts,a,sz,c,b,halo){
    var o='<text x="'+(Math.round(x*100)/100)+'" y="'+(Math.round(y*100)/100)+'" text-anchor="'+(a||"start")+'" font-size="'+sz+'" fill="'+U.col(c||"ink")+
      '" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+(halo?' stroke="var(--screen)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"':'')+'>',pend=0;
    parts.forEach(function(p){var cc=p[3]?' fill="'+U.col(p[3])+'"':'';
      o+='<tspan font-style="'+(p[2]?"italic":"normal")+'"'+cc+(pend?' dy="'+pend+'"':'')+'>'+U.esc(p[0])+'</tspan>';pend=0;
      if(p[1]){o+='<tspan dy="3" font-size="'+(sz*0.72)+'"'+cc+'>'+U.esc(p[1])+'</tspan>';pend=-3;}});
    return o+'</text>';
  }
  /* グラフの範囲の外に出る所で切った折れ線（点は値の組 [x, y]） */
  function _w02_cl(P,pts,c,lw,dash){
    var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),segs=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1],ins=isFinite(b)&&b>=lo&&b<=hi;
      if(prev){var pa=prev[0],pb=prev[1],pin=isFinite(pb)&&pb>=lo&&pb<=hi;
        if(ins&&!pin&&isFinite(pb)){var l1=pb>hi?hi:lo;cur=[[pa+(a-pa)*(l1-pb)/(b-pb),l1]];}
        else if(pin&&!ins){if(isFinite(b)){var l2=b>hi?hi:lo;cur.push([pa+(a-pa)*(l2-pb)/(b-pb),l2]);}segs.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=q;});
    if(cur.length)segs.push(cur);
    return segs.filter(function(s){return s.length>=2;}).map(function(s){return P.line(s,c,lw,dash);}).join("");
  }
  /* 目盛: 範囲 [lo, hi] に収まるきりのよい値 */
  function _w02_ticks(U,lo,hi,n){return U.nice(lo,hi,n||5).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;});}
  function _w02_range(lo,hi,pad){var d=(hi-lo)||Math.abs(hi)||1;return [lo-d*(pad||0.08),hi+d*(pad||0.08)];}
  /* 横向きのばね（ジグザグ） */
  function _w02_spring(S,x1,x2,y,n,amp,c,lw){var lead=Math.min(10,(x2-x1)*0.15),xs=x1+lead,xe=x2-lead,pts=[[x1,y],[xs,y]];
    for(var i=0;i<2*n;i++)pts.push([xs+(xe-xs)*(i+0.5)/(2*n),y+(i%2===0?amp:-amp)]);pts.push([xe,y]);pts.push([x2,y]);return S.PL(pts,c,lw);}
  /* 横向きのダンパ（筒は壁の側に固定、ピストンは台車の側） */
  function _w02_damper(S,x1,x2,y,c,lw){var cy0=x1+12,cyl=Math.max(30,Math.min(46,(x2-x1)*0.5)),px=Math.max(cy0+6,Math.min(cy0+cyl-4,x2-14));
    return S.L(x1,y,cy0,y,c,lw)+S.L(cy0,y-8,cy0+cyl,y-8,c,lw)+S.L(cy0,y+8,cy0+cyl,y+8,c,lw)+S.L(cy0,y-8,cy0,y+8,c,lw)+
      S.L(px,y-6,px,y+6,c,lw+0.8)+S.L(px,y,x2,y,c,lw);}
  function _w02_wall(S,x,y0,y1){var o=S.L(x,y0,x,y1,"muted",1.8);for(var yy=y0+4;yy<y1;yy+=9)o+=S.L(x,yy,x-7,yy+7,"muted",1);return o;}
  function _w02_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  /* 台車（箱と車輪）。(x, y) は箱の左上、車輪の下端は y + h + 8 */
  function _w02_cart(S,U,x,y,w,h,c,dash){var o=S.RECT(x,y,w,h,4,dash?"none":U.soft(c),c,1.5,dash);
    o+=S.CIRC(x+w*0.25,y+h+4,4,c,1.4,"var(--screen)",dash)+S.CIRC(x+w*0.75,y+h+4,4,c,1.4,"var(--screen)",dash);return o;}

  /* ---- 2 節: 台車とばね・ダンパ ---- */
  REG.w02_msd=function(el,U){
    var S=U.S;
    U.head(el,"CART","台車とばね・ダンパ — 動く絵・位置の波形・働く力");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"力の入れ方",["一定の力で押し続ける","短く強く押す（0.1 s だけ）","正弦波の力で揺らす","引いて離す（力は加えない）"],0,function(){run();});
    var fF=U.slider(r1,"押す力 u",{values:[0.5,1,2,4],value:1,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var fP=U.slider(r1,"押す力 u（0.1 s）",{values:[5,10,20],value:10,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var fA=U.slider(r1,"力の振幅",{values:[0.5,1,2],value:1,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var fW=U.slider(r1,"力の角周波数",{values:[1,2,3,4,5,6,8,10,15],value:2,fmt:function(v){return v+" rad/s";},onInput:function(){run();}});
    var fX=U.slider(r1,"初めの位置",{values:[2,4,5,6,8],value:5,fmt:function(v){return v+" cm";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var sm=U.slider(r2,"質量 m",{values:[0.25,0.5,1,2,4],value:1,fmt:function(v){return v+" kg";},onInput:function(){run();}});
    var sc=U.slider(r2,"減衰係数 c",{values:[0,0.5,1,2,4,6,10,15,20],value:2,fmt:function(v){return v+" N·s/m";},onInput:function(){run();}});
    var sk=U.slider(r2,"ばね定数 k",{values:[0,5,10,25,50,100],value:25,fmt:function(v){return v+" N/m";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 t（絵と力の矢印）",{min:0,max:6,step:0.01,value:0.64,fmt:function(v){return v.toFixed(2)+" s";},onInput:function(){tk.stop();drawFrame();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.04;if(t>=6){t=6;tk.stop();}st.set(t);drawFrame();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=5.99)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function base(m,c,k){tk.stop();mode.set(0);fF.set(1);sm.set(m);sc.set(c);sk.set(k);st.set(0.64);run();}
    U.button(br,"本文の例（1 N・1 kg・2 N·s/m・25 N/m）",function(){base(1,2,25);});
    U.button(br,"ダンパを外す（c = 0）",function(){base(1,0,25);});
    U.button(br,"ダンパを強く（c = 10）",function(){base(1,10,25);});
    U.button(br,"ばねを外す（k = 0）",function(){base(1,2,0);});
    var box=U.svgbox(el),ro=U.readout(el),sim=null,DT=0.0005,EV=2;
    function run(){
      var M=+mode.get();
      fF.el.style.display=M===0?"":"none";fP.el.style.display=M===1?"":"none";
      fA.el.style.display=M===2?"":"none";fW.el.style.display=M===2?"":"none";fX.el.style.display=M===3?"":"none";
      var m=sm.get(),c=sc.get(),k=sk.get(),uf;
      if(M===0){var F=fF.get();uf=function(){return F;};}
      else if(M===1){var Fp=fP.get();uf=function(t){return t<0.1-1e-9?Fp:0;};}
      else if(M===2){var A=fA.get(),w=fW.get();uf=function(t){return A*Math.sin(w*t);};}
      else uf=function(){return 0;};
      var f=function(t,x){return [x[1],(uf(t)-c*x[1]-k*x[0])/m];};
      var x=[M===3?fX.get()/100:0,0],n=Math.round(6/DT),Tt=[],P=[],V=[],Uu=[];
      for(var i=0;i<=n;i++){var t=i*DT;if(i%EV===0){Tt.push(t);P.push(x[0]);V.push(x[1]);Uu.push(uf(t));}x=U.ctl.rk4(f,t,x,DT);}
      sim={T:Tt,P:P,V:V,U:Uu,m:m,c:c,k:k,M:M,uf:uf};
      /* 指標 */
      var mx=-1e9,imx=0,mn=1e9,imn=0;P.forEach(function(v,i){if(v>mx){mx=v;imx=i;}if(v<mn){mn=v;imn=i;}});
      sim.mx=mx;sim.tmx=Tt[imx];sim.mn=mn;sim.tmn=Tt[imn];
      var fin=(M===0&&k>0)?fF.get()/k:(M===1||M===3)&&k>0?0:null;sim.fin=fin;
      if(M===0&&k>0){var ups=[];for(var j=1;j<P.length;j++)if(P[j-1]<fin&&P[j]>=fin)ups.push(Tt[j-1]+(Tt[j]-Tt[j-1])*(fin-P[j-1])/(P[j]-P[j-1]));
        sim.per=ups.length>=3?(ups[ups.length-1]-ups[1])/(ups.length-2):(ups.length===2?ups[1]-ups[0]:null);
        var last=-1;P.forEach(function(v,i){if(Math.abs(v-fin)>0.02*fin)last=i;});sim.settle=last<P.length-1?Tt[last+1]:null;}
      drawFrame();
    }
    function drawFrame(){
      if(!sim)return;var s=sim,nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var t=st.get(),idx=Math.max(0,Math.min(s.T.length-1,Math.round(t/(DT*EV))));
      var p=s.P[idx],v=s.V[idx],u=s.U[idx],fk=-s.k*p,fc=-s.c*v,fs=u+fk+fc;
      /* 絵 */
      var gy=nar?150:142,sx0=nar?16:30,sw=nar?370:650,cw=nar?56:72,ch=nar?34:40,x0=sx0+(nar?104:190);
      var pmax=0,pmin=0;s.P.forEach(function(q){pmax=Math.max(pmax,q);pmin=Math.min(pmin,q);});
      var right=sx0+sw-cw-x0-8,left=x0-sx0-56,sc=2500;
      if(pmax>1e-9)sc=Math.min(sc,right/pmax);if(pmin<-1e-9)sc=Math.min(sc,left/(-pmin));
      var cx=x0+p*sc,cy=gy-8-ch;
      o.push(_w02_ground(S,sx0-4,sx0+sw,gy));o.push(_w02_wall(S,sx0,gy-ch-46,gy));
      o.push(S.L(x0,gy-ch-50,x0,gy+18,"muted",1,"3 3"));o.push(S.T(x0,gy+30,"p = 0","middle",9.5,"muted"));
      if(s.k>0)o.push(_w02_spring(S,sx0,cx,cy+11,nar?6:8,6,"teal",1.6));
      if(s.c>0)o.push(_w02_damper(S,sx0,cx,cy+ch-10,"purple",1.6));
      o.push(_w02_cart(S,U,cx,cy,cw,ch,"signal"));
      o.push(_w02_m(U,cx+cw/2,cy+ch/2+4,[["m",null,true]],"middle",11,"signal",true));
      /* 力の矢印（台車の中心から） */
      var fm=1e-9;s.T.forEach(function(_,i){var pp=s.P[i],vv=s.V[i],uu=s.U[i];fm=Math.max(fm,Math.abs(uu),Math.abs(s.k*pp),Math.abs(s.c*vv),Math.abs(uu-s.k*pp-s.c*vv));});
      var fsc=(nar?62:120)/fm,ax=cx+cw/2;
      var rows=[[u,"gold","押す力 u"],[fk,"teal","ばね −kp"],[fc,"purple","ダンパ −cṗ"],[fs,"signal","和 mp̈"]];
      rows.forEach(function(r,i){var y=cy-10-i*13,L=r[0]*fsc;
        if(Math.abs(L)>2)o.push(S.ARR(ax,y,ax+L,y,r[1],2,6));else o.push(S.D(ax,y,r[1],2));
        var lab=r[2]+" "+_w02_f(r[0],2)+" N",right2=r[0]>=0,lw2=U.tw(lab,9);
        var xr2=right2?ax+Math.max(L,0)+6:ax+Math.min(L,0)-6;
        if(right2&&xr2+lw2>Wd-4){right2=false;xr2=ax-6;}else if(!right2&&xr2-lw2<4){right2=true;xr2=ax+6;}
        o.push(S.T(xr2,y+3.5,lab,right2?"start":"end",9,r[1],i===3,false,null,true));});
      if(Math.abs(cx-x0)>14){o.push(S.DARR(x0,gy+14,cx,gy+14,"signal",1.1,5));}
      /* 波形 */
      var big=Math.max(Math.abs(pmax),Math.abs(pmin))>0.5,unit=big?1:100,un=big?"m":"cm";
      var lo=Math.min(0,pmin*unit),hi=Math.max(pmax*unit,s.fin!=null?s.fin*unit:0);var rr=_w02_range(lo,hi,0.1);
      var py0=gy+44,P=U.plot(nar?48:62,py0,nar?336:610,nar?120:130,[0,6],rr);
      o.push(P.axes({xl:null,yl:"位置 p ["+un+"]",xt:[0,1,2,3,4,5,6],yt:_w02_ticks(U,rr[0],rr[1],4),xfmt:function(q){return String(q);},yfmt:function(q){return _w02_sig(q,3);},ylOff:nar?34:40}));
      if(s.fin!=null&&s.M===0)o.push(P.line([[0,s.fin*unit],[6,s.fin*unit]],"muted",1.1,"4 3"));
      o.push(_w02_cl(P,s.T.map(function(q,i){return [q,s.P[i]*unit];}),"signal",2));
      o.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"gold",1.2,"3 3"));o.push(S.D(P.X(t),P.Y(p*unit),"signal",4));
      /* 入力の帯 */
      var uy=P.y+P.h+22,um=1e-9;s.U.forEach(function(q){um=Math.max(um,Math.abs(q));});
      var Q=U.plot(P.x,uy,P.w,22,[0,6],[-um*1.1,um*1.1]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,2,"var(--screen)","line",0.8));o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"faint",0.8));
      o.push(Q.line(s.T.filter(function(_,i){return i%4===0;}).map(function(q,i){return [q,s.U[i*4]];}),"gold",1.4));
      o.push(S.T(Q.x-6,Q.y+15,"u","end",10,"gold",true));
      o.push(S.T(Q.x+Q.w,Q.y+Q.h+15,"時間 t [s]","end",9.5,"muted"));
      box.set(S.svg(Wd,Q.y+Q.h+22,o));
      /* 読み出し */
      var h="",cm=function(q){return _w02_f(q*100,2)+" cm";};
      h+="時刻 "+_w02_f(t,2)+" s: 位置 <b>"+cm(p)+"</b>、速度 "+_w02_f(v,3)+" m/s。力: 押す力 "+_w02_f(u,2)+" N、ばね −<i>kp</i> = "+_w02_f(fk,2)+" N、ダンパ −<i>c</i>ṗ = "+_w02_f(fc,2)+" N → 和 <i>m</i>p̈ = <b>"+_w02_f(fs,2)+" N</b><br>";
      if(s.M===0){
        if(s.k>0){h+="落ち着く位置 <i>u</i>/<i>k</i> = <b>"+cm(s.fin)+"</b>、最大 <b>"+cm(s.mx)+"</b>（"+_w02_f(s.tmx,2)+" s）";
          if(s.mx>s.fin*1.0005)h+="、行き過ぎ "+cm(s.mx-s.fin);
          h+="<br>";
          h+=(s.per?"揺れの周期（落ち着く位置を上向きに横切る間隔）: <b>"+_w02_f(s.per,2)+" s</b>、":"揺れずに近づく、")+
            (s.settle!=null?"落ち着く位置の ±2 % に入ったまま: <b>"+_w02_f(s.settle,2)+" s</b> 以降":'<span class="warn">6 s までに ±2 % に収まらない</span>')+"<br>";}
        else h+='<span class="warn">ばねが無いので戻す力が無く、止まらない</span>（'+(s.c>0?"速度は <i>u</i>/<i>c</i> = "+_w02_f(fF.get()/s.c,2)+" m/s に近づく":"ダンパも無いので、速度は増え続ける")+"）<br>";
      }else if(s.M===1){h+="最大 "+cm(s.mx)+"（"+_w02_f(s.tmx,2)+" s）"+(s.k>0?"、その後は 0 へ戻る":"。ばねが無いので元の位置に戻らない（"+cm(s.P[s.P.length-1])+" で止まる）")+"<br>";}
      else if(s.M===2){var tail=s.P.slice(Math.floor(s.P.length*0.6)),a=0;tail.forEach(function(q){a=Math.max(a,Math.abs(q));});h+="4〜6 s の位置の振れ幅: 約 "+cm(a)+"（力の振幅 "+fA.get()+" N、角周波数 "+fW.get()+" rad/s）<br>";}
      else{h+="最小 "+cm(s.mn)+"（"+_w02_f(s.tmn,2)+" s）"+(s.k>0?"":"。ばねが無いので動かない")+"<br>";}
      ro.innerHTML=h+'<div class="wnote">式 mp̈ + cṗ + kp = u を 4 次のルンゲ・クッタ法（刻み 0.5 ms）で解いた。台車の上の矢印は、その時刻に台車に働く力（右向きが正）で、長さは力に比例する。位置の目盛は大きさに合わせて変わる。</div>';
    }
    run();
  };

  /* ---- 3 節: DC モータ ---- */
  REG.w02_motor=function(el,U){
    var S=U.S,MM=U.ctl.mat;
    U.head(el,"DC MOTOR","DC モータに電圧を加える — <i>L</i><sub>a</sub> を含む式と、無視した一次の式");
    var r1=U.ctrls(el);
    var sv=U.slider(r1,"電圧 v",{values:[3,6,9,12],value:12,fmt:function(v){return v+" V";},onInput:draw});
    var sl=U.slider(r1,"インダクタンス L<sub>a</sub>",{values:[0.1,0.2,0.5,1,2,5,10,20,50],value:1,fmt:function(v){return v+" mH";},onInput:draw});
    var sr=U.slider(r1,"抵抗 R<sub>a</sub>",{values:[0.5,1,2,4,8],value:2,fmt:function(v){return v+" Ω";},onInput:draw});
    var r2=U.ctrls(el);
    var sj=U.slider(r2,"慣性モーメント J",{values:[0.25,0.5,1,2,4],value:1,fmt:function(v){return v+" × 10⁻⁵ kg·m²";},onInput:draw});
    var sk=U.slider(r2,"トルク定数 K<sub>t</sub>",{values:[0.01,0.015,0.02,0.03,0.04],value:0.02,fmt:function(v){return v+" N·m/A";},onInput:draw});
    var st=U.slider(r2,"途中で加える負荷トルク τ<sub>L</sub>",{values:[0,0.005,0.01,0.02],value:0.01,fmt:function(v){return v+" N·m";},onInput:draw});
    var r3=U.ctrls(el);
    var vw=U.select(r3,"表示する時間",["全体（負荷を加える前後）","始めの数 ms を拡大"],0,draw);
    var ap=U.checkbox(r3,"L<sub>a</sub> を無視した一次の式を重ねる（破線）",true,draw);
    var br=U.btnrow(el);
    function set(La){sv.set(12);sl.set(La);sr.set(2);sj.set(1);sk.set(0.02);st.set(0.01);vw.set(0);ap.set(true);draw();}
    U.button(br,"本文の例（L<sub>a</sub> 1 mH）",function(){set(1);});
    U.button(br,"L<sub>a</sub> を 10 倍（10 mH）",function(){set(10);});
    U.button(br,"L<sub>a</sub> を 50 倍（50 mH）",function(){set(50);});
    var box=U.svgbox(el),ro=U.readout(el);
    function sim(p,tEnd,n,tL0){
      var A=[[-p.Ra/p.La,-p.Kt/p.La],[p.Kt/p.J,0]],B=[[1/p.La,0],[0,-1/p.J]],h=tEnd/n,d=MM.c2d(A,B,h);
      var x=[[0],[0]],T=[],I=[],Wf=[],Wa=[],Ia=[],Tm=p.J*p.Ra/(p.Kt*p.Kt),ea=Math.exp(-h/Tm),wa=0,kL=Math.round(tL0/h);
      for(var k=0;k<=n;k++){var tau=k>=kL?p.tl:0;
        T.push(k*h);I.push(x[0][0]);Wf.push(x[1][0]);Wa.push(wa);Ia.push((p.v-p.Kt*wa)/p.Ra);
        x=MM.add(MM.mul(d.A,x),MM.mul(d.B,[[p.v],[tau]]));
        var wss=p.v/p.Kt-p.Ra/(p.Kt*p.Kt)*tau;wa=wss+(wa-wss)*ea;}
      return {T:T,I:I,W:Wf,Wa:Wa,Ia:Ia};
    }
    function niceUp(v){var e=Math.pow(10,Math.floor(Math.log10(v)+1e-9)),m=v/e*(1-1e-9);return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=3?3:m<=5?5:10)*e;}
    function draw(){
      var p={v:sv.get(),La:sl.get()*1e-3,Ra:sr.get(),J:sj.get()*1e-5,Kt:sk.get(),tl:st.get()};
      var Tm=p.J*p.Ra/(p.Kt*p.Kt),K=1/p.Kt,KL=p.Ra/(p.Kt*p.Kt),te=p.La/p.Ra;
      var tEnd=Math.max(0.3,niceUp(6*Tm)),tL0=tEnd/2,R=sim(p,tEnd,6000,tL0);
      var tz=Math.max(0.01,niceUp(8*te)),Z=sim(p,tz,4000,1e9);
      var zoom=vw.get()===1,D=zoom?Z:R,te2=zoom?tz:tEnd,sx=zoom?1e3:1,tu=zoom?"ms":"s";
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],x0=nar?50:66,w=nar?334:604;
      var wmax=0;R.W.concat(R.Wa).forEach(function(q){wmax=Math.max(wmax,q);});
      var imin=0,imax=0;D.I.concat(ap.get()?D.Ia:[]).forEach(function(q){imin=Math.min(imin,q);imax=Math.max(imax,q);});
      var Pw=U.plot(x0,22,w,nar?120:130,[0,te2*sx],[0,wmax*1.12]);
      o.push(_w02_m(U,nar?8:14,14,[["角速度 ",null,false],["ω","m",true]],"start",10.5,"ink",true));
      o.push(Pw.axes({xl:null,yl:"[rad/s]",xt:_w02_ticks(U,0,te2*sx,5),yt:_w02_ticks(U,0,wmax*1.12,4),xfmt:function(q){return _w02_sig(q,3);},ylOff:nar?36:44}));
      if(!zoom&&p.tl>0){o.push(S.L(Pw.X(tL0),Pw.y,Pw.X(tL0),Pw.y+Pw.h,"purple",1,"3 3"));o.push(S.T(Pw.X(tL0)+4,Pw.y+Pw.h-6,"負荷 "+p.tl+" N·m","start",9,"purple",true,false,null,true));}
      o.push(Pw.line(D.T.map(function(q,i){return [q*sx,D.W[i]];}),"signal",2.2));
      if(ap.get())o.push(Pw.line(D.T.map(function(q,i){return [q*sx,D.Wa[i]];}),"muted",1.6,"6 4"));
      var Pi=U.plot(x0,Pw.y+Pw.h+40,w,nar?110:120,[0,te2*sx],[Math.min(0,imin*1.1),imax*1.12+1e-9]);
      o.push(S.T(nar?8:14,Pi.y-8,"電流 i","start",10.5,"ink",true));
      o.push(Pi.axes({xl:"時間 t ["+tu+"]",yl:"[A]",xt:_w02_ticks(U,0,te2*sx,5),yt:_w02_ticks(U,Pi.yr[0],Pi.yr[1],4),xfmt:function(q){return _w02_sig(q,3);},ylOff:nar?36:44}));
      o.push(Pi.line(D.T.map(function(q,i){return [q*sx,D.I[i]];}),"teal",2.2));
      if(ap.get())o.push(Pi.line(D.T.map(function(q,i){return [q*sx,D.Ia[i]];}),"muted",1.6,"6 4"));
      o.push(_w02_m(U,Pi.x,Pi.y+Pi.h+46,[["実線: ",null,false],["L","a",true],[" を含む式　破線: ",null,false],["L","a",true],[" を無視した一次の式",null,false]],"start",9.5,"muted"));
      box.set(S.svg(Wd,Pi.y+Pi.h+54,o));
      /* 読み出し */
      var k1=0;Z.I.forEach(function(q,i){if(q>Z.I[k1])k1=i;});
      var dw=0;R.T.forEach(function(q,i){dw=Math.max(dw,Math.abs(R.W[i]-R.Wa[i]));});
      var iT=Math.round(Tm/tEnd*6000),wT=R.W[Math.min(iT,6000)],waT=R.Wa[Math.min(iT,6000)];
      var wss0=K*p.v,wss1=K*p.v-KL*p.tl,ov=0;R.W.forEach(function(q,i){if(R.T[i]<tL0)ov=Math.max(ov,q-wss0);});
      var h="";
      h+="<i>T</i> = <i>JR</i><sub>a</sub>/<i>K</i><sub>t</sub>² = <b>"+_w02_sig(Tm,3)+" s</b>、<i>K</i> = 1/<i>K</i><sub>t</sub> = <b>"+_w02_sig(K,3)+" (rad/s)/V</b>、電流の変わる時間 <i>L</i><sub>a</sub>/<i>R</i><sub>a</sub> = "+_w02_sig(te*1e3,3)+" ms（<i>T</i> の 1/"+_w02_sig(Tm/te,3)+"）<br>";
      h+="落ち着く角速度（一次の式 <i>Kv</i> − (<i>R</i><sub>a</sub>/<i>K</i><sub>t</sub>²)τ<sub>L</sub>）: 負荷なし <b>"+_w02_sig(wss0,4)+" rad/s</b>"+(p.tl>0?"、負荷 "+p.tl+" N·m で <b>"+_w02_sig(wss1,4)+" rad/s</b>（"+_w02_sig(tL0,3)+" s に加える。電流は τ<sub>L</sub>/<i>K</i><sub>t</sub> = "+_w02_sig(p.tl/p.Kt,3)+" A）":"")+"<br>";
      h+="時刻 <i>T</i>（"+_w02_sig(Tm,3)+" s）の角速度: <i>L</i><sub>a</sub> を含む式 "+_w02_sig(wT,4)+" rad/s、一次の式 "+_w02_sig(waT,4)+" rad/s。2 つの式の差は最大 <b>"+_w02_sig(dw,3)+" rad/s</b>（"+_w02_sig(dw/wss0*100,2)+" %）<br>";
      h+="電流の最大: <i>L</i><sub>a</sub> を含む式 <b>"+_w02_sig(Z.I[k1],3)+" A</b>（"+_w02_sig(Z.T[k1]*1e3,3)+" ms）、一次の式 "+_w02_sig(p.v/p.Ra,3)+" A（0 s。<i>v</i>/<i>R</i><sub>a</sub>）<br>";
      if(te>Tm/10)h+='<span class="warn">電流の変わる時間 <i>L</i><sub>a</sub>/<i>R</i><sub>a</sub> が <i>T</i> の 1/10 を超え、一次の式は合わなくなる</span><br>';
      if(ov>wss0*0.002)h+='<span class="warn">角速度が、落ち着く値を一度 '+_w02_sig(ov,3)+' rad/s 超えてから戻る（<i>L</i><sub>a</sub> が大きく、2 階の式の揺れが現れる）</span><br>';
      ro.innerHTML=h+'<div class="wnote"><i>L</i><sub>a</sub> を含む式は 2 つの 1 階の式（電気と機械）、一次の式は <i>L</i><sub>a</sub> d<i>i</i>/d<i>t</i> を 0 とみなした式。どちらも、入力が一定の間を厳密に進める方法で計算した。負荷トルクは、表示する時間の中ほどで加える。</div>';
    }
    draw();
  };

  /* ---- 5 節: 線形化 ---- */
  REG.w02_linear=function(el,U){
    var S=U.S,g=9.81;
    U.head(el,"LINEARIZE","元の式と線形化した式 — 振れ幅を変えて比べる");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",["水槽（動作点 25 cm・0.2 L/s から流入を変える）","振子（真下のまわりで静かに放す）","台車に立てた振子（真上から力を加えずに放す）"],0,function(){tk.stop();st.set(0.5);run();});
    var aT=U.slider(r1,"流入の変化 δu",{values:[-100,-50,-20,-10,10,20,50,100],value:10,fmt:function(v){return (v>0?"+":"−")+Math.abs(v)+" %（"+(v>0?"+":"−")+_w02_f(Math.abs(v)*0.002,3)+" L/s）";},onInput:function(){run();}});
    var aP=U.slider(r1,"振れ幅",{values:[5,10,20,30,45,60,90,120,150,170],value:10,fmt:function(v){return v+"°";},onInput:function(){run();}});
    var aI=U.slider(r1,"初めの傾き",{values:[0.5,1,2,5,10,20,30],value:1,fmt:function(v){return v+"°";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var st=U.slider(r2,"時刻（絵）",{min:0,max:1,step:0.002,value:0.5,fmt:function(v){return R?_w02_sig(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();drawFrame();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+(R&&R.kind===0?0.0025:0.004);if(v>=1){v=1;tk.stop();}st.set(v);drawFrame();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pick(o2,a,v){tk.stop();ob.set(o2);a.set(v);st.set(o2===0?0.5:0.5);run();}
    U.button(br,"本文の例（水槽 +10 %）",function(){pick(0,aT,10);});
    U.button(br,"水槽 +50 %",function(){pick(0,aT,50);});
    U.button(br,"ポンプを止める（−100 %）",function(){pick(0,aT,-100);});
    U.button(br,"振子 10°",function(){pick(1,aP,10);});
    U.button(br,"振子 90°",function(){pick(1,aP,90);});
    U.button(br,"台車の振子 1°",function(){pick(2,aI,1);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var K=+ob.get();aT.el.style.display=K===0?"":"none";aP.el.style.display=K===1?"":"none";aI.el.style.display=K===2?"":"none";
      var T=[],N=[],L=[],PN=[],PL=[],i,t;
      if(K===0){var At=0.02,a=4e-4,h0=0.25,u0=2e-4,du=u0*aT.get()/100,u=u0+du,Tl=2*At*Math.sqrt(h0)/a,Kl=2*Math.sqrt(h0)/a,dt=0.02,tEnd=200,h=h0;
        var f=function(tt,x){var hh=Math.max(x[0],0);return [(hh<=0&&u<=0)?0:(u-a*Math.sqrt(hh))/At];};
        for(i=0;i<=tEnd/dt;i++){t=i*dt;if(i%10===0){T.push(t);N.push(h*100);L.push((h0+Kl*du*(1-Math.exp(-t/Tl)))*100);}h=Math.max(0,U.ctl.rk4(f,t,[h],dt)[0]);}
        R={kind:0,tEnd:tEnd,T:T,N:N,L:L,du:du,fn:Math.pow(u/a,2)*100,fl:(h0+Kl*du)*100,Tl:Tl};
        var te=null;for(i=1;i<N.length;i++)if(N[i]<=1e-6&&te===null)te=T[i];R.empty=te;
        var tz=null;for(i=1;i<L.length;i++)if(L[i]<0&&tz===null)tz=T[i-1]+(T[i]-T[i-1])*L[i-1]/(L[i-1]-L[i]);R.neg=tz;}
      else if(K===1){var l=0.3,w0=Math.sqrt(g/l),A=aP.get()*Math.PI/180,dt1=0.0005,tE=4,x=[Math.PI+A,0];
        var f1=function(tt,xx){return [xx[1],g/l*Math.sin(xx[0])];};
        for(i=0;i<=tE/dt1;i++){t=i*dt1;if(i%8===0){T.push(t);N.push((x[0]-Math.PI)*180/Math.PI);L.push(A*Math.cos(w0*t)*180/Math.PI);}x=U.ctl.rk4(f1,t,x,dt1);}
        var cr=[];for(i=1;i<N.length;i++)if(N[i-1]>0&&N[i]<=0)cr.push(T[i-1]+(T[i]-T[i-1])*N[i-1]/(N[i-1]-N[i]));
        var per=cr.length>=2?(cr[cr.length-1]-cr[0])/(cr.length-1):null,md=0;N.forEach(function(q,j){md=Math.max(md,Math.abs(q-L[j]));});
        R={kind:1,tEnd:tE,T:T,N:N,L:L,A:aP.get(),per:per,per0:2*Math.PI/w0,md:md};}
      else{var M=0.5,m=0.2,l2=0.3,ph0=aI.get()*Math.PI/180,dt2=0.0005,tE2=1.0,xn=[0,0,ph0,0],xl=[0,0,ph0,0];
        var fn=function(tt,q){var s=Math.sin(q[2]),c=Math.cos(q[2]),a11=M+m,a12=m*l2*c,a21=c,a22=l2,b1=m*l2*s*q[3]*q[3],b2=g*s,det=a11*a22-a12*a21;
          return [q[1],(b1*a22-a12*b2)/det,q[3],(a11*b2-a21*b1)/det];};
        var fl=function(tt,q){return [q[1],-3.924*q[2],q[3],45.78*q[2]];};
        for(i=0;i<=tE2/dt2;i++){t=i*dt2;if(i%4===0){T.push(t);N.push(xn[2]*180/Math.PI);L.push(xl[2]*180/Math.PI);PN.push(xn[0]);PL.push(xl[0]);}
          if(Math.abs(xn[2])<2)xn=U.ctl.rk4(fn,t,xn,dt2);if(Math.abs(xl[2])<3)xl=U.ctl.rk4(fl,t,xl,dt2);}
        function cross(arr,deg){for(var j=0;j<arr.length;j++)if(Math.abs(arr[j])>=deg)return T[j];return null;}
        var k5=null;for(i=0;i<N.length;i++)if(Math.abs(N[i]-L[i])>0.05*Math.abs(L[i])){k5=i;break;}
        R={kind:2,tEnd:tE2,T:T,N:N,L:L,PN:PN,PL:PL,A:aI.get(),t10n:cross(N,10),t10l:cross(L,10),t30n:cross(N,30),t30l:cross(L,30),k5:k5};}
      drawFrame();
    }
    function drawFrame(){
      if(!R)return;var nar=_w02_nar(box),Wd=nar?400:700,o=[],k=Math.min(R.T.length-1,Math.round(st.get()*(R.T.length-1))),tc=R.T[k];
      /* 絵 */
      var pw=nar?380:250,px0=nar?10:10,py0=10,ph=nar?170:200;
      if(R.kind===0){var tx0=px0+(nar?120:70),tw2=120,tb=py0+ph-14,tt2=py0+20,sc=(tb-tt2)/110;
        var hn=R.N[k],hl=R.L[k];
        o.push(S.RECT(tx0,tb-Math.max(0,hn)*sc,tw2,Math.max(0,hn)*sc,0,U.soft("signal"),"none",0));
        o.push(S.W([tx0,tt2,tx0,tb,tx0+tw2,tb,tx0+tw2,tt2],"ink",2));
        o.push(S.L(tx0,tb-hn*sc,tx0+tw2,tb-hn*sc,"signal",1.6));
        var yl=tb-hl*sc;if(hl>=0)o.push(S.L(tx0-10,yl,tx0+tw2+10,yl,"muted",1.6,"6 4"));
        else{o.push(S.L(tx0-10,tb+6,tx0+tw2+10,tb+6,"alias",1.6,"6 4"));o.push(S.T(tx0+tw2/2,tb-8,"線形化: "+_w02_f(hl,1)+" cm","middle",9.5,"alias",true,false,null,true));}
        o.push(S.T(tx0+tw2+14,tb-hn*sc+4,"元 "+_w02_f(hn,1)+" cm","start",9.5,"signal",true,false,null,true));
        if(hl>=0)o.push(S.T(tx0-14,yl+4,"線形化 "+_w02_f(hl,1),"end",9.5,"muted",true,false,null,true));
        o.push(S.L(tx0+2,tb-25*sc,tx0+tw2-2,tb-25*sc,"gold",1.2,"2 3"));o.push(S.T(tx0+tw2/2,tt2-6,"金色の点線: 動作点 25 cm","middle",9,"gold"));}
      else if(R.kind===1){var cx=px0+pw/2,cy=py0+26,Lr=nar?110:120;
        o.push(S.L(cx-34,cy,cx+34,cy,"muted",2));o.push(S.L(cx,cy,cx,cy+Lr+14,"faint",1,"4 3"));
        [[R.L[k],"muted",true],[R.N[k],"signal",false]].forEach(function(q){var a=q[0]*Math.PI/180,bx=cx+Lr*Math.sin(a),by=cy+Lr*Math.cos(a);
          o.push(S.L(cx,cy,bx,by,q[1],q[2]?1.6:2.4,q[2]?"6 4":null));o.push(S.CIRC(bx,by,9,q[1],1.6,q[2]?"none":U.soft("signal"),q[2]?"4 3":null));});
        o.push(S.D(cx,cy,"ink",3.4));}
      else{var gx=px0,gy=py0+ph-8,sc2=nar?220:200,cx2=px0+pw/2,cw=60,Lr2=nar?100:110;
        o.push(_w02_ground(S,gx,gx+pw,gy));
        [[R.PL[k],R.L[k],"muted",true],[R.PN[k],R.N[k],"signal",false]].forEach(function(q){var x=cx2+q[0]*sc2,a=Math.min(Math.abs(q[1]),90)*Math.sign(q[1])*Math.PI/180;
          o.push(_w02_cart(S,U,x-cw/2,gy-32,cw,24,q[2],q[3]?"4 3":null));
          var bx=x+Lr2*Math.sin(a),by=gy-32-Lr2*Math.cos(a);o.push(S.L(x,gy-32,bx,by,q[2],q[3]?1.6:2.4,q[3]?"6 4":null));
          o.push(S.CIRC(bx,by,8,q[2],1.6,q[3]?"none":U.soft("signal"),q[3]?"4 3":null));});
        o.push(S.L(cx2,gy-32,cx2,gy-32-Lr2-14,"faint",1,"4 3"));}
      o.push(S.T(px0+6,py0+ph+8,"実線: 元の式　破線: 線形化した式","start",9.5,"muted"));
      /* 波形 */
      var qx=nar?50:330,qy=nar?py0+ph+34:22,qw=nar?334:350,qh=nar?140:170;
      var lo,hi,ylab,xt;
      if(R.kind===0){lo=Math.min(0,Math.min.apply(null,R.L.concat(R.N)));hi=Math.max.apply(null,R.L.concat(R.N));var r=_w02_range(lo,hi,0.1);lo=r[0];hi=r[1];ylab="水位 h [cm]";xt=[0,50,100,150,200];}
      else if(R.kind===1){hi=R.A*1.15;lo=-hi;ylab="振れの角 [°]";xt=[0,1,2,3,4];}
      else{lo=0;hi=90;ylab="傾き φ [°]";xt=[0,0.2,0.4,0.6,0.8,1.0];}
      var P=U.plot(qx,qy,qw,qh,[0,R.tEnd],[lo,hi]);
      if(R.kind===0&&lo<0)o.push(S.RECT(P.x,P.Y(0),P.w,P.Y(lo)-P.Y(0),0,U.soft("alias"),"none",0));
      o.push(P.axes({xl:"時間 t [s]",yl:ylab,xt:xt,yt:_w02_ticks(U,lo,hi,4),xfmt:function(q){return _w02_sig(q,3);},yfmt:function(q){return _w02_sig(q,3);},ylOff:nar?34:40}));
      o.push(_w02_cl(P,R.T.map(function(q,i){return [q,R.N[i]];}),"signal",2.2));
      o.push(_w02_cl(P,R.T.map(function(q,i){return [q,R.L[i]];}),"muted",1.7,"6 4"));
      if(R.kind===2&&R.k5!=null)o.push(S.D(P.X(R.T[R.k5]),P.Y(Math.min(90,Math.abs(R.N[R.k5]))),"alias",3.6));
      o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"gold",1.2,"3 3"));
      box.set(S.svg(Wd,nar?P.y+P.h+40:Math.max(py0+ph+16,P.y+P.h+40),o));
      /* 読み出し */
      var h="時刻 "+_w02_sig(tc,3)+" s: 元の式 "+_w02_f(R.N[k],2)+(R.kind===0?" cm":"°")+"、線形化した式 "+_w02_f(R.L[k],2)+(R.kind===0?" cm":"°")+"<br>";
      if(R.kind===0){var dn=R.fn-25,dl=R.fl-25;
        h+="落ち着く水位: 元の式 <b>"+_w02_f(R.fn,2)+" cm</b>（"+(dn>=0?"+":"")+_w02_f(dn,2)+" cm）、線形化した式 <b>"+_w02_f(R.fl,2)+" cm</b>（"+(dl>=0?"+":"")+_w02_f(dl,2)+" cm）";
        if(Math.abs(dn)>1e-9)h+="、変化の差 "+_w02_sig(Math.abs(dl-dn)/Math.abs(dn)*100,2)+" %";h+="<br>";
        if(R.empty!=null)h+='元の式では <b>'+_w02_sig(R.empty,3)+' s</b> で空になる。';
        if(R.neg!=null)h+='<span class="warn">線形化した式は '+_w02_sig(R.neg,3)+' s で水位が 0 を下回る（あり得ない）</span>';
        if(R.empty!=null||R.neg!=null)h+="<br>";
        h+="線形化した式: <i>T</i> = 2<i>A</i><sub>t</sub>√<i>h</i><sub>0</sub>/<i>a</i> = "+_w02_sig(R.Tl,3)+" s、<i>K</i> = 2√<i>h</i><sub>0</sub>/<i>a</i> = 2500 s/m²（0.01 L/s で 2.5 cm）<br>";}
      else if(R.kind===1){h+="周期: 元の式 <b>"+(R.per?_w02_sig(R.per,4)+" s":"—")+"</b>、線形化した式 <b>"+_w02_sig(R.per0,4)+" s</b>"+(R.per?"（差 "+_w02_sig((R.per/R.per0-1)*100,2)+" %）":"")+"<br>";
        h+="0〜4 s での 2 つの式の角度の差: 最大 <b>"+_w02_sig(R.md,3)+"°</b>"+(R.md>R.A*0.2?' <span class="warn">線形化した式は合わない</span>':"")+"<br>";}
      else{h+="10° に達する時刻: 元の式 "+(R.t10n!=null?_w02_sig(R.t10n,3)+" s":"—")+"、線形化した式 "+(R.t10l!=null?_w02_sig(R.t10l,3)+" s":"—")+"<br>";
        h+="30° に達する時刻: 元の式 <b>"+(R.t30n!=null?_w02_sig(R.t30n,3)+" s":"—")+"</b>、線形化した式 <b>"+(R.t30l!=null?_w02_sig(R.t30l,3)+" s":"—")+"</b><br>";
        if(R.k5!=null)h+="2 つの式の角度の差が 5 % を超えるのは "+_w02_sig(R.T[R.k5],3)+" s（線形化した式 "+_w02_sig(R.L[R.k5],3)+"°、元の式 "+_w02_sig(R.N[R.k5],3)+"°。赤い点）<br>";}
      ro.innerHTML=h+'<div class="wnote">元の式（水槽 <i>A</i><sub>t</sub>ḣ = <i>u</i> − <i>a</i>√<i>h</i>、振子 <i>l</i> d²φ/d<i>t</i>² = <i>g</i> sin φ、台車の振子は 17 章で導く元の式）を 4 次のルンゲ・クッタ法で解いた。線形化した式は 5 節の式。振子の長さは 0.3 m。</div>';
    }
    run();
  };

  /* ---- 6 節: オイラー法とルンゲ・クッタ法 ---- */
  REG.w02_euler=function(el,U){
    var S=U.S,MM=U.ctl.mat;
    U.head(el,"EULER","オイラー法とルンゲ・クッタ法 — 刻み幅を変える");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",["モータの一次の式（T = 0.05 s、12 V）","温度の板（T = 500 s、80 W）","台車とばね・ダンパ（1 N で押す）","La を含むモータ（電流）"],0,draw);
    var me=U.select(r1,"計算の方法",["オイラー法","ルンゲ・クッタ法（4 次）","両方を重ねる"],0,draw);
    var r2=U.ctrls(el);
    var d1=U.slider(r2,"刻み幅 Δt",{values:[1,2,5,10,20,25,40,50,60,75,90,100,105,110,125,140],value:10,fmt:function(v){return v+" ms（"+_w02_sig(v/50,3)+"T）";},onInput:draw});
    var d4=U.slider(r2,"刻み幅 Δt",{values:[10,25,50,100,200,250,400,500,600,750,900,1000,1050,1100,1250],value:100,fmt:function(v){return v+" s（"+_w02_sig(v/500,3)+"T）";},onInput:draw});
    var d2=U.slider(r2,"刻み幅 Δt",{values:[0.005,0.01,0.02,0.04,0.05,0.07,0.08,0.09,0.1,0.15,0.2,0.3,0.4,0.5,0.6],value:0.05,fmt:function(v){return v+" s";},onInput:draw});
    var d3=U.slider(r2,"刻み幅 Δt",{values:[0.05,0.1,0.2,0.5,0.8,0.9,1.0,1.01,1.02,1.05,1.2,1.4,1.45,1.6],value:0.5,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.btnrow(el);
    function pick(o2,m2,sl,v){ob.set(o2);me.set(m2);sl.set(v);draw();}
    U.button(br,"本文の例（10 ms）",function(){pick(0,0,d1,10);});
    U.button(br,"75 ms（1.5T）",function(){pick(0,0,d1,75);});
    U.button(br,"100 ms（2T）",function(){pick(0,0,d1,100);});
    U.button(br,"110 ms（2.2T）",function(){pick(0,0,d1,110);});
    U.button(br,"温度の板を 100 s で",function(){pick(1,0,d4,100);});
    U.button(br,"台車を 0.09 s で",function(){pick(2,2,d2,0.09);});
    U.button(br,"L<sub>a</sub> を含むモータを 1.02 ms で",function(){pick(3,0,d3,1.02);});
    var box=U.svgbox(el),ro=U.readout(el);
    function rk4f(f,t,x,h){return U.ctl.rk4(f,t,x,h);}
    function euler(f,t,x,h){var d=f(t,x);return x.map(function(v,i){return v+h*d[i];});}
    function steps(f,x0,h,tEnd,step,out){var x=x0.slice(),pts=[[0,out(x)]],n=Math.round(tEnd/h+1e-9);
      for(var k=0;k<n;k++){x=step(f,k*h,x,h);if(!isFinite(x[0])||Math.abs(x[0])>1e12)break;pts.push([(k+1)*h,out(x)]);}return pts;}
    function rkR(z){return 1+z+z*z/2+z*z*z/6+z*z*z*z/24;}
    function rkLimit(lams){/* すべての固有値で |R(λΔt)| ≤ 1 となる最大の Δt（二分法） */
      function ok(h){return lams.every(function(l){var z={re:l.re*h,im:l.im*h},C=U.ctl.cx,s=C.c(1,0),zz=C.c(1,0),f=1;
        for(var k=1;k<=4;k++){zz=C.mul(zz,z);f*=k;s=C.add(s,C.scale(zz,1/f));}return C.abs(s)<=1+1e-12;});}
      var lo=0,hi=10;while(ok(hi)&&hi<1e3)hi*=2;for(var i=0;i<60;i++){var m=(lo+hi)/2;if(ok(m))lo=m;else hi=m;}return lo;}
    function draw(){
      var K=+ob.get(),M=+me.get();d1.el.style.display=K===0?"":"none";d4.el.style.display=K===1?"":"none";d2.el.style.display=K===2?"":"none";d3.el.style.display=K===3?"":"none";
      var f,x0,tEnd,out,ex,h,yl,lams,unit,T1=null,y0=0,yf=0,ts=1000,tsu=" ms";
      if(K===0){T1=0.05;y0=0;yf=600;tEnd=0.5;h=d1.get()/1000;yl="角速度 [rad/s]";unit=" rad/s";}
      if(K===1){T1=500;y0=25;yf=125;tEnd=5000;h=d4.get();yl="板の温度 [°C]";unit=" K";ts=1;tsu=" s";}
      if(T1!==null){(function(Tq,a0,af){f=function(t,x){return [(af-x[0])/Tq];};x0=[a0];out=function(x){return x[0];};
        ex=[];for(var i=0;i<=500;i++){var t=i*tEnd/500;ex.push([t,af+(a0-af)*Math.exp(-t/Tq)]);}lams=[{re:-1/Tq,im:0}];})(T1,y0,yf);}
      else if(K===2){var m=1,c=2,k=25;f=function(t,x){return [x[1],(1-c*x[1]-k*x[0])/m];};x0=[0,0];tEnd=5;out=function(x){return x[0]*100;};h=d2.get();yl="位置 p [cm]";unit=" cm";
        ex=[];var xe=[0,0],dte=0.0005;for(var j=0;j<=tEnd/dte;j++){if(j%10===0)ex.push([j*dte,xe[0]*100]);xe=rk4f(f,j*dte,xe,dte);}
        lams=MM.eig([[0,1],[-k/m,-c/m]]);}
      else{var Ra=2,La=1e-3,Kt=0.02,J=1e-5;f=function(t,x){return [(12-Ra*x[0]-Kt*x[1])/La,Kt*x[0]/J];};x0=[0,0];tEnd=0.3;out=function(x){return x[0];};h=d3.get()/1000;yl="電流 i [A]";unit=" A";
        var A=[[-Ra/La,-Kt/La],[Kt/J,0]],B=[[1/La],[0]],dd=MM.c2d(A,B,tEnd/30000),xx=[[0],[0]];ex=[];
        for(var q=0;q<=30000;q++){ex.push([q*tEnd/30000,xx[0][0]]);var a0=xx[0][0],a1=xx[1][0];xx=[[dd.A[0][0]*a0+dd.A[0][1]*a1+dd.B[0][0]*12],[dd.A[1][0]*a0+dd.A[1][1]*a1+dd.B[1][0]*12]];}
        lams=MM.eig(A);}
      var eu=(M!==1)?steps(f,x0,h,tEnd,euler,out):null,rk=(M!==0)?steps(f,x0,h,tEnd,rk4f,out):null;
      /* 範囲 */
      var lo=Infinity,hi=-Infinity;ex.forEach(function(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);});
      var span=hi-lo,cap=[lo-1.5*span,hi+1.5*span];
      [eu,rk].forEach(function(a){if(a)a.forEach(function(p){lo=Math.min(lo,Math.max(cap[0],p[1]));hi=Math.max(hi,Math.min(cap[1],p[1]));});});
      var rr=_w02_range(lo,hi,0.06),nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:66,18,nar?332:604,nar?190:230,[0,tEnd],rr);
      o.push(P.axes({xl:"時間 t [s]",yl:yl,xt:_w02_ticks(U,0,tEnd,5),yt:_w02_ticks(U,rr[0],rr[1],5),xfmt:function(v){return _w02_sig(v,3);},yfmt:function(v){return _w02_sig(v,3);},ylOff:nar?36:44}));
      var exd=ex.length>1200?ex.filter(function(_,i){return i%Math.ceil(ex.length/1200)===0||i===ex.length-1;}):ex;
      o.push(P.line(exd,"signal",2.4));
      [[eu,"alias"],[rk,"green"]].forEach(function(a){if(!a[0])return;var pts=a[0];o.push(_w02_cl(P,pts,a[1],1.5));
        if(pts.length<=160)pts.forEach(function(p){if(p[1]>=rr[0]&&p[1]<=rr[1])o.push(S.D(P.X(p[0]),P.Y(p[1]),a[1],pts.length>60?2.2:3.2));});});
      o.push(S.T(P.x,P.y+P.h+46,"青: 本当の解"+(eu?"　赤: オイラー法":"")+(rk?"　緑: ルンゲ・クッタ法":""),"start",9.5,"muted"));
      box.set(S.svg(Wd,P.y+P.h+54,o));
      /* 読み出し */
      var hdr="",lim=lams.map(function(l){return -2*l.re/(l.re*l.re+l.im*l.im);}).reduce(function(a,b){return Math.min(a,b);}),limR=rkLimit(lams);
      function maxErr(pts){var e=0;pts.forEach(function(p){var i2=Math.round(p[0]/tEnd*(ex.length-1));var ref=ex[Math.min(i2,ex.length-1)][1];
        var t2=ex[Math.min(i2,ex.length-1)][0];if(Math.abs(t2-p[0])<1e-9*tEnd+tEnd/(ex.length-1)/2)e=Math.max(e,Math.abs(p[1]-ref));});return e;}
      var sc2=(K===2?1:(K===1?1:1000)),su2=(K===0||K===3)?" ms":" s";
      hdr+="刻み幅 Δt = "+_w02_sig(h*sc2,3)+su2+"、"+Math.round(tEnd/h+1e-9)+" 刻みで "+tEnd+" s まで<br>";
      if(T1!==null){var r=h/T1,fe=1-r,fr=rkR(-r),cls,dY=yf-y0;
        if(fe>0)cls='<span class="ok">ずれは符号を変えずに減る（0 &lt; Δt &lt; T）</span>';else if(fe===0)cls="1 刻みで落ち着く値に着く（Δt = T）";
        else if(fe>-1)cls='<span class="warn">刻みごとに符号を変えながら減る＝振動する（T &lt; Δt &lt; 2T）</span>';else if(Math.abs(fe+1)<1e-12)cls='<span class="warn">同じ大きさで振れ続ける（Δt = 2T）</span>';else cls='<span class="warn">刻みごとに大きくなる＝発散する（Δt &gt; 2T）</span>';
        hdr+="Δt/T = "+_w02_sig(r,3)+"。落ち着く値からのずれは 1 刻みごとに、オイラー法で <b>1 − Δt/T = "+_w02_f(fe,3)+"</b> 倍 → "+cls+"<br>";
        hdr+="ルンゲ・クッタ法の 1 刻みの倍率: 1 − r + r²/2 − r³/6 + r⁴/24 = "+_w02_f(fr,4)+"（r = Δt/T。発散しない上限は Δt = 2.79T）<br>";
        if(eu)hdr+="オイラー法の値: "+eu.slice(0,5).map(function(p){return _w02_sig(p[1],4);}).join(", ")+(eu.length>5?", …":"")+"（時刻 0, Δt, 2Δt, …）<br>";
        var nT=T1/h;if(Math.abs(nT-Math.round(nT))<1e-9&&nT>=1){var dex=dY*Math.exp(-1);
          if(eu){var de=yf-eu[Math.round(nT)][1];hdr+="t = T（"+_w02_sig(T1,3)+" s）での、落ち着く値からのずれ: オイラー法 "+_w02_sig(de,4)+unit+"、本当 "+_w02_sig(dex,4)+unit+"（誤差 "+_w02_sig((de/dex-1)*100,3)+" %）<br>";}
          if(rk){var dr=yf-rk[Math.round(nT)][1];hdr+="t = T でのずれ: ルンゲ・クッタ法 "+_w02_sig(dr,6)+unit+"（誤差 "+_w02_sig((dr/dex-1)*100,2)+" %）<br>";}}
      }else{
        hdr+=(K===2?"揺れながら落ち着く対象":"速い動き（約 "+_w02_sig(-1/lams.reduce(function(a,b){return a.re<b.re?a:b;}).re*1e3,3)+" ms）と遅い動き（約 "+_w02_sig(-1/lams.reduce(function(a,b){return a.re>b.re?a:b;}).re*1e3,3)+" ms）")+
          "。発散しない刻み幅の上限: オイラー法 <b>"+_w02_sig(lim*sc2,3)+su2+"</b>、ルンゲ・クッタ法 <b>"+_w02_sig(limR*sc2,3)+su2+"</b><br>";
        if(eu)hdr+="オイラー法: "+(h>lim*(1+1e-9)?'<span class="warn">発散する</span>':(Math.abs(h-lim)<lim*0.02?'<span class="warn">上限の近く（ゆっくりしか減らない）</span>':"最大の誤差 "+_w02_sig(maxErr(eu),3)+unit))+"<br>";
        if(rk)hdr+="ルンゲ・クッタ法: "+(h>limR*(1+1e-9)?'<span class="warn">発散する</span>':"最大の誤差 "+_w02_sig(maxErr(rk),3)+unit)+"<br>";
      }
      ro.innerHTML=hdr+'<div class="wnote">本当の解は、一次の式は式の形の解、ほかは十分に細かい刻みで求めた。発散して範囲の外に出た所は描かない。'+(K===2?"揺れながら落ち着く対象では、オイラー法は、ずれを少しずつ大きくする向きに誤るので、刻み幅の上限がとくに厳しい。":"")+'</div>';
    }
    draw();
  };
