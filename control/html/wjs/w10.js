  /* ===== 10 章 PID 制御 ===== */
  function _w10_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w10_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w10_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w10_h(s){return String(s).replace(/([A-Za-zΑ-Ωα-ω])_\{([^}]*)\}/g,"$1<sub>$2</sub>").replace(/([A-Za-zΑ-Ωα-ω])_([A-Za-z0-9]+)/g,"$1<sub>$2</sub>");}

  /* 制御対象（状態空間と伝達関数。値はどれも本文の例の値）。plate は周りとの温度の差で計算し、表示では 25 °C を足す */
  var _W10_PL={
    mpos:{name:"モータの角度",A:[[0,1],[0,-20]],B:[0,1000],C:[1,0],L:0,num:[1000],den:[1,20,0],yu:"rad",uu:"V",ylab:"角度",ulab:"電圧",ulo:-12,uhi:12},
    cart:{name:"台車の速度",A:[[-2]],B:[1],C:[1],L:0,num:[0.5],den:[0.5,1],yu:"m/s",uu:"N",ylab:"速度",ulab:"力",ulo:-1e9,uhi:1e9},
    mspd:{name:"モータの角速度",A:[[-20]],B:[1000],C:[1],L:0,num:[50],den:[0.05,1],yu:"rad/s",uu:"V",ylab:"角速度",ulab:"電圧",ulo:-12,uhi:12},
    plate:{name:"温度の板",A:[[-0.002]],B:[0.0025],C:[1],L:20,num:[1.25],den:[500,1],yu:"K",uu:"W",ylab:"温度",ulab:"電力",ulo:0,uhi:80}
  };

  /* PID の閉ループを刻み h で計算する（10 章の図の _f10_sim と同じ計算。制御器は刻みごとに計算して次の刻みまで保ち、対象は厳密に離散化）。
     o: {KP, KI, KD, N（null で理想の微分）, dmode（"y" 測った値の微分 / "e" 偏差の微分）, b（目標値の重み）, deriv（"diff" 1 刻み前との差 /
     "model" 模型から求めた理想の微分。測った値の微分だけ）, r(t), d(t)（操作量に入る外乱）, x0, I0, noise(k), h, tEnd, every}。
     返り値 {t, y, ym, u, uP, uI, uD}（every 刻みごと） */
  function _w10_sim(U,pl,o){
    var A=pl.A,n=A.length,Bc=pl.B.map(function(v){return [v];}),dd=U.ctl.mat.c2d(A,Bc,o.h),Ad=dd.A,Bd=dd.B.map(function(r){return r[0];});
    var C=pl.C,CB=0,i,j;for(i=0;i<n;i++)CB+=C[i]*pl.B[i];
    var steps=Math.round(o.tEnd/o.h),nd=Math.round((o.L!=null?o.L:pl.L)/o.h),x=(o.x0||[]).slice();while(x.length<n)x.push(0);
    var Yh=new Float64Array(steps+1),DYh=new Float64Array(steps+1),KP=o.KP,KI=o.KI||0,KD=o.KD||0,b=o.b==null?1:o.b,I=o.I0||0,Df=0,prev=null,ev=o.every||1;
    var out={t:[],y:[],ym:[],u:[],uP:[],uI:[],uD:[]},rf=o.r||function(){return 1;},df=o.d||function(){return 0;};
    for(var k=0;k<=steps;k++){
      var t=k*o.h,y=0;for(i=0;i<n;i++)y+=C[i]*x[i];Yh[k]=y;
      var ym=k-nd>=0?Yh[k-nd]:Yh[0];if(o.noise)ym+=o.noise(k);
      var rr=rf(t),e=rr-ym,uP=KP*(b*rr-ym),dv=df(t),u,uD;
      if(o.deriv==="model"){
        var CAx=0;for(i=0;i<n;i++){var s=0;for(j=0;j<n;j++)s+=A[i][j]*x[j];CAx+=C[i]*s;}
        if(nd>0){var dym=k-nd>=0?DYh[k-nd]:0;uD=-KD*dym;u=uP+I+uD;}
        else{u=(uP+I-KD*(CAx+CB*dv))/(1+KD*CB);uD=u-uP-I;}
        DYh[k]=CAx+CB*(u+dv);
      }else{
        var sg=o.dmode==="e"?e:-ym;if(prev===null)prev=sg;
        if(KD){if(o.N==null)Df=KD*(sg-prev)/o.h;else{var Tf=KD/KP/o.N;Df=Tf/(Tf+o.h)*Df+KD/(Tf+o.h)*(sg-prev);}}
        prev=sg;uD=Df;u=uP+I+uD;
      }
      if(k%ev===0){out.t.push(t);out.y.push(y);out.ym.push(ym);out.u.push(u);out.uP.push(uP);out.uI.push(I);out.uD.push(uD);}
      I+=KI*o.h*e;
      var nx=[];for(i=0;i<n;i++){var s2=Bd[i]*(u+dv);for(j=0;j<n;j++)s2+=Ad[i][j]*x[j];nx.push(s2);}x=nx;
      if(!isFinite(y)||Math.abs(y)>1e7)break;
    }
    return out;
  }
  /* 行き過ぎ量 [%] と ±band の整定時間（t0 から）。落ち着かなければ ts = NaN */
  function _w10_met(t,y,yf,t0,t1,band){band=band||0.02;var mx=-Infinity,last=-1,cnt=0;
    for(var k=0;k<t.length;k++){if(t[k]<t0-1e-12||(t1!=null&&t[k]>=t1))continue;cnt++;if(y[k]>mx)mx=y[k];if(Math.abs(y[k]-yf)>band*Math.abs(yf))last=k;}
    var ts=last<0?0:(last+1<t.length&&(t1==null||t[last+1]<t1)?t[last+1]-t0:NaN);return {mp:(mx-yf)/Math.abs(yf)*100,ts:ts};}
  function _w10_poles(ps){var o=[];ps.forEach(function(p){if(p.im<-1e-9)return;o.push(Math.abs(p.im)>1e-6*(1+Math.abs(p.re))?_w10_g(p.re,3)+" ± j"+_w10_g(p.im,3):_w10_g(p.re,3));});return o.join("、");}
  /* PID の伝達関数（並列形）。KI・KD が 0 の項は入れない（原点の極と零点の打ち消しを作らない） */
  function _w10_C(U,KP,KI,KD,N){var P=U.ctl.poly;
    var num,den;if(KI){num=[KP,KI];den=[1,0];}else{num=[KP];den=[1];}
    if(KD){if(N==null){num=P.add(num,P.mul([KD,0],den));}else{var Tf=KD/KP/N;num=P.add(P.mul(num,[Tf,1]),P.mul([KD,0],den));den=P.mul(den,[Tf,1]);}}
    return U.ctl.tf(num,den);}
  function _w10_rhp(ps){return ps.some(function(p){return p.re>1e-7*(1+Math.abs(p.im));});}

  /* ---- 4 節: PID のボード線図 ---- */
  var _W10_BD={
    mpos:{kp:[0.1,0.21,0.42,0.84,1.5,3,6,10],ti:[0,0.05,0.1,0.168,0.3,0.5,1,2],td:[0,0.005,0.01,0.0238,0.04,0.06,0.1,0.2],def:[3,3,3],wr:[0.1,1000],kpu:"V/rad",tEnd:1.2},
    cart:{kp:[1,2,4,8,14,20,30,50],ti:[0,0.02,0.04,0.08,0.16,0.32,0.64,1.28],td:[0,0.005,0.01,0.02,0.05,0.1,0.2,0.5],def:[3,5,0],wr:[0.1,1000],kpu:"N/(m/s)",tEnd:2.5},
    mspd:{kp:[0.02,0.05,0.1,0.2,0.5,1,2,5],ti:[0,0.005,0.01,0.025,0.05,0.1,0.2,0.5],td:[0,0.0005,0.001,0.002,0.005,0.01,0.02,0.05],def:[2,4,0],wr:[1,10000],kpu:"V/(rad/s)",tEnd:0.15},
    plate:{kp:[3,6,12,18,24,30,36,48],ti:[0,20,40,60,80,160,320,640],td:[0,2.5,5,10,15,20,40,80],def:[4,2,3],wr:[0.0001,1],kpu:"W/K",tEnd:1500}
  };
  REG.w10_bode=function(el,U){
    var S=U.S,ctl=U.ctl,keys=["mpos","cart","mspd","plate"];
    U.head(el,"PID BODE","PID のボード線図 — 制御器・一巡伝達関数・ステップ応答");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度 1000/(s(s + 20))","台車の速度 0.5/(0.5s + 1)","モータの角速度 50/(0.05s + 1)","温度の板 1.25e^(−20s)/(500s + 1)"],0,function(){def();draw();});
    function cur(){return _W10_BD[keys[pl.get()]];}
    var r2=U.ctrls(el);
    var kp=U.slider(r2,"K<sub>P</sub>",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return _w10_g(cur().kp[i],3)+" "+cur().kpu;},onInput:draw});
    var ti=U.slider(r2,"T<sub>I</sub>",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return i===0?"なし":_w10_g(cur().ti[i],3)+" s";},onInput:draw});
    var td=U.slider(r2,"T<sub>D</sub>",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return i===0?"なし":_w10_g(cur().td[i],3)+" s";},onInput:draw});
    var r3=U.ctrls(el);
    var wv=U.slider(r3,"見る角周波数 ω（ボード線図の上をドラッグしてもよい）",{min:0,max:1,step:0.002,value:0.5,fmt:function(v){return _w10_g(wOf(v),3)+" rad/s";},onInput:draw});
    function wOf(v){var c=cur();return Math.pow(10,Math.log10(c.wr[0])+v*(Math.log10(c.wr[1])-Math.log10(c.wr[0])));}
    var br=U.btnrow(el);
    function def(){var d=cur().def;kp.set(d[0]);ti.set(d[1]);td.set(d[2]);}
    U.button(br,"本文の例",function(){def();draw();});
    U.button(br,"比例だけ",function(){ti.set(0);td.set(0);draw();});
    U.button(br,"I を外す",function(){ti.set(0);draw();});
    U.button(br,"D を外す",function(){td.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el),last=null;
    ctl.drag(box,function(type,x,y){if(!last||type==="up")return;var B=last.B1,B2=last.B2,hit=null;
      [B,B2].forEach(function(b){if(b&&x>=b.Pm.x-4&&x<=b.Pm.x+b.Pm.w+4&&y>=b.Pm.y-4&&y<=b.Pp.y+b.Pp.h+4)hit=b;});
      if(!hit)return type==="down"?false:undefined;var w=hit.Pm.ux(Math.max(hit.Pm.x,Math.min(hit.Pm.x+hit.Pm.w,x))),c=cur();
      wv.set((Math.log10(w)-Math.log10(c.wr[0]))/(Math.log10(c.wr[1])-Math.log10(c.wr[0])));draw();});
    function draw(){
      var key=keys[pl.get()],c=_W10_BD[key],P=_W10_PL[key],KP=c.kp[kp.get()],TI=c.ti[ti.get()],TD=c.td[td.get()];
      var KI=TI?KP/TI:0,KD=TD?KP*TD:0,Cs=_w10_C(U,KP,KI,KD,null),Pt=ctl.tf(P.num,P.den,P.L),Lt=ctl.series(Pt,Cs);
      var ws=ctl.logspace(Math.log10(c.wr[0]),Math.log10(c.wr[1]),500),bc=ctl.bode(Cs,ws),bl=ctl.bode(Lt,ws),w0=wOf(wv.get());
      var mg=ctl.margins(Lt,c.wr[0]/10,c.wr[1]*10);
      var nar=_w10_nar(box),Wd=nar?400:700,o=[];
      /* 制御器のボード線図（P・I・D の漸近線つき） */
      var x1=nar?58:62,w1=nar?320:270;
      var cdb=bc.db.slice(),lo=Math.min.apply(null,cdb),hi=Math.max.apply(null,cdb);
      var dbr=[Math.floor((lo-6)/20)*20,Math.ceil((hi+6)/20)*20];if(dbr[1]-dbr[0]>120)dbr[1]=dbr[0]+120;
      var B1=ctl.bodeSvg([{w:ws,db:bc.db,ph:bc.ph,c:"ink",lw:2.2}],{x:x1,y:24,w:w1,hm:120,hp:90,gap:30,wr:c.wr,dbr:dbr,phr:[-90,90]});
      o.push(S.TX(x1-50,14,"(a) 制御器 C(jω)","start",10.5,"ink",true));
      o.push(B1.svg);
      var asy=[];if(KI)asy.push([function(w){return 20*Math.log10(KI/w);},"green"]);asy.push([function(){return 20*Math.log10(KP);},"gold"]);if(KD)asy.push([function(w){return 20*Math.log10(KD*w);},"teal"]);
      asy.forEach(function(a){o.push(B1.Pm.clip(ws.map(function(w){return [w,a[0](w)];}),a[1],1.3,"4 3"));});
      var cw=ctl.freq(Cs,w0),cg=ctl.cx.abs(cw),cp=ctl.cx.arg(cw)*180/Math.PI;
      o.push(S.L(B1.Pm.X(w0),B1.Pm.y,B1.Pm.X(w0),B1.Pp.y+B1.Pp.h,"gold",1,"3 3"));
      o.push(S.D(B1.Pm.X(w0),B1.Pm.Y(Math.max(dbr[0],Math.min(dbr[1],20*Math.log10(cg)))),"gold",4));o.push(S.D(B1.Pp.X(w0),B1.Pp.Y(Math.max(-90,Math.min(90,cp))),"gold",4));
      var lg=[["ink",null,"C(jω)"]];if(KI)lg.push(["green","4 3","I: K_I/ω"]);lg.push(["gold","4 3","P: K_P"]);if(KD)lg.push(["teal","4 3","D: K_D ω"]);
      var yL=B1.h+4;o.push(S.LEGL(x1-40,yL,lg,9,10));
      /* 一巡伝達関数のボード線図 */
      var x2=nar?58:410,y2=nar?yL+34:24,w2=nar?320:270;
      var ldb=bl.db.filter(function(v){return isFinite(v);}),l1=Math.max(-80,Math.min.apply(null,ldb)),h1=Math.min(80,Math.max.apply(null,ldb));
      var dbr2=[Math.floor(l1/20)*20,Math.ceil(h1/20)*20];if(dbr2[0]===dbr2[1])dbr2[1]+=20;
      var phmin=Math.min.apply(null,bl.ph),phr2=[Math.max(-360,Math.floor(Math.min(phmin,-180)/90)*90-0),0];if(Math.max.apply(null,bl.ph)>0)phr2[1]=90;
      var B2=ctl.bodeSvg([{w:ws,db:bl.db,ph:bl.ph,c:"signal",lw:2.2}],{x:x2,y:y2,w:w2,hm:120,hp:90,gap:30,wr:c.wr,dbr:dbr2,phr:phr2});
      o.push(S.TX(x2-50,y2-10,"(b) 一巡伝達関数 P(jω)C(jω)","start",10.5,"ink",true));
      o.push(B2.svg);
      o.push(S.L(B2.Pm.X(w0),B2.Pm.y,B2.Pm.X(w0),B2.Pp.y+B2.Pp.h,"gold",1,"3 3"));
      if(mg.wgc){var phg=-180+mg.pm;o.push(S.D(B2.Pm.X(mg.wgc),B2.Pm.Y(0),"signal",4));o.push(S.D(B2.Pp.X(mg.wgc),B2.Pp.Y(Math.max(phr2[0],Math.min(phr2[1],phg))),"signal",4));
        if(phg>=phr2[0]&&phg<=phr2[1]){o.push(S.L(B2.Pp.X(mg.wgc),B2.Pp.Y(-180),B2.Pp.X(mg.wgc),B2.Pp.Y(phg),mg.pm>0?"green":"alias",2.2));
          o.push(S.TX(B2.Pp.X(mg.wgc)+6,B2.Pp.Y((phg-180)/2)+4,"位相余裕 "+_w10_f(mg.pm,1)+"°","start",9.5,mg.pm>0?"green":"alias",true,true));}}
      /* ステップ応答（目標値を 1 だけ変える。D 動作は測った値に掛ける） */
      var y3=nar?B2.h+30:Math.max(B1.h,B2.h)+30,x3=nar?58:62,w3=nar?320:610;
      var tE=c.tEnd;if(mg.wgc&&mg.pm>0)tE=Math.max(c.tEnd*0.25,Math.min(c.tEnd*4,14/mg.wgc));
      var h=tE/4000,R=_w10_sim(U,P,{KP:KP,KI:KI,KD:KD,deriv:"model",r:function(){return 1;},h:h,tEnd:tE,every:4});
      var ys=R.y,ymax=1.6;ys.forEach(function(v){if(isFinite(v))ymax=Math.max(ymax,Math.min(3,v*1.08));});
      var Q=U.plot(x3,y3+16,w3,110,[0,tE],[0,ymax]);
      o.push(S.T(x3-50,y3+4,"(c) 目標値を 1 だけ変えたときの制御量（D 動作は測った値に掛ける）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",yl:"制御量",xt:U.nice(0,tE,6),yt:U.nice(0,ymax,4),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,2);},ylOff:40,sz:9}));
      o.push(Q.line([[0,1],[tE,1]],"muted",1.2,"5 3"));
      o.push(Q.clip(R.t.map(function(t,i){return [t,R.y[i]];}),"signal",2));
      var met=_w10_met(R.t,R.y,1,0);
      box.set(S.svg(Wd,y3+16+110+44,o));
      last={B1:B1,B2:B2};
      /* 読み出し */
      var hs="制御器: C(jω) = K<sub>P</sub> + j(K<sub>D</sub>ω − K<sub>I</sub>/ω)。ω = "+_w10_g(w0,3)+" rad/s で、実部 "+_w10_g(KP,3)+"、虚部 "+_w10_g(KD*w0-KI/w0,3)+" → ゲイン "+_w10_g(cg,3)+"（"+_w10_f(20*Math.log10(cg),1)+" dB）、位相 "+_w10_f(cp,1)+"°<br>";
      if(KI&&KD)hs+="ゲインが最小になる ω<sub>0</sub> = 1/√(T<sub>I</sub>T<sub>D</sub>) = "+_w10_g(1/Math.sqrt(TI*TD),3)+" rad/s（そこでゲインは K<sub>P</sub>、位相は 0°）<br>";
      hs+="一巡伝達関数: "+(mg.wgc?"ゲイン交差角周波数 "+_w10_g(mg.wgc,3)+" rad/s、位相余裕 <b>"+_w10_f(mg.pm,1)+"°</b>":"ゲインが 1 を横切らない")+(mg.wpc?"、ゲイン余裕 "+_w10_f(mg.gmDb,1)+" dB":"")+"<br>";
      var stable=true;
      if(!P.L){var Pn=P.num,Pd=P.den,PO=ctl.poly,den=PO.add(PO.mul(Pd,Cs.den),PO.mul(Pn,Cs.num)),ps=PO.roots(den);stable=!_w10_rhp(ps);hs+="閉ループの極: "+_w10_poles(ps)+(stable?"":' <span class="warn">右半平面の極がある（不安定）</span>')+"<br>";}
      else if(mg.pm!=null&&mg.pm<0){stable=false;hs+='<span class="warn">位相余裕が負: 閉ループは不安定（9 章 6 節）</span><br>';}
      if(stable&&isFinite(met.ts))hs+="ステップ応答: 行き過ぎ量 <b>"+_w10_f(Math.max(0,met.mp),1)+" %</b>、2 % 整定時間 <b>"+_w10_g(met.ts,3)+" s</b>";
      else hs+='ステップ応答: <span class="warn">表示した時間の中で落ち着かない</span>';
      ro.innerHTML=hs+'<div class="wnote">D 動作は理想の微分（不完全微分は 6 節）。ステップ応答は、目標値の段差を微分しない形（3 節）で、刻み '+_w10_g(h,2)+' s の数値計算。操作量の上限は考えていない。値はどれも例の値。</div>';
    }
    def();draw();
  };

  /* ---- 5 節: 対象ごとの効き方（P・I・D の分に分けて見る） ---- */
  var _W10_PD={
    mpos:{kp:[0.1,0.21,0.42,0.84,1.5,3],kpu:"V/rad",ti:[0.05,0.1,0.168,0.3,0.42,1],td:[0.005,0.01,0.0238,0.04,0.06,0.1],
      pre:[["比例だけ（0.21 V/rad）",0,1,2,2],["PD（本文の例）",2,3,2,2],["PID（本文の例）",3,3,2,2],["PID で I を強く（T_I = 0.05 s）",3,3,0,2]],
      def:2,tf:0.53,tEnd:2.0,h:1e-4,ev:10,td0:1.0,dist:"1.0 s から負荷トルク 0.01 N·m（−1 V）",dv:-1,r:1,band:0.02},
    mspd:{kp:[0.02,0.05,0.1,0.2,0.5,1],kpu:"V/(rad/s)",ti:[0.01,0.025,0.05,0.1,0.2,0.5],td:[0.0005,0.001,0.002,0.005,0.01,0.02],
      pre:[["比例だけ（0.1）",0,2,2,2],["PI（本文の例）",1,2,2,2],["比例だけ（0.5）",0,4,2,2],["PI に D を足す",3,2,2,2]],
      def:1,tf:0.52,tEnd:0.6,h:5e-5,ev:6,td0:0.3,dist:"0.3 s から負荷トルク 0.01 N·m（−1 V）",dv:-1,r:100,band:0.02},
    plate:{kp:[6,12,18,24,30,36],kpu:"W/K",ti:[20,40,60,80,160,320],td:[2.5,5,10,15,20,40],
      pre:[["比例だけ（24 W/K）",0,3,1,2],["PI（12 W/K・80 s）",1,1,3,2],["PI（24 W/K・40 s）",1,3,1,2],["PID（24・40・10）",3,3,1,2]],
      def:3,tf:0.13,tEnd:1100,h:0.1,ev:5,td0:100,dist:"100 s に周りの温度が 25 °C から 15 °C に（−8 W）",dv:-8,r:35,band:0}
  };
  REG.w10_pid=function(el,U){
    var S=U.S,ctl=U.ctl,keys=["mpos","mspd","plate"];
    U.head(el,"PID","P・I・D の分に分けて見る — モータの角速度・角度、温度の板");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度 1000/(s(s + 20))","モータの角速度 50/(0.05s + 1)","温度の板（むだ時間 20 s）"],0,function(){relabel();preset(cur().pre[cur().def]);});
    var md=U.select(r1,"制御器",["比例だけ","PI","PD","PID"],3,function(){run();});
    function cur(){return _W10_PD[keys[pl.get()]];}
    var r2=U.ctrls(el);
    var kp=U.slider(r2,"K<sub>P</sub>",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return _w10_g(cur().kp[i],3)+" "+cur().kpu;},onInput:function(){run();}});
    var ti=U.slider(r2,"T<sub>I</sub>",{values:[0,1,2,3,4,5],value:2,fmt:function(i){return _w10_g(cur().ti[i],3)+" s";},onInput:function(){run();}});
    var td=U.slider(r2,"T<sub>D</sub>",{values:[0,1,2,3,4,5],value:2,fmt:function(i){return _w10_g(cur().td[i],3)+" s";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var ds=U.checkbox(r3,"外乱を入れる",true,function(){run();});
    var st=U.slider(r3,"時刻",{min:0,max:1,step:0.002,value:0.25,fmt:function(v){return R?_w10_g(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.004;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    var pbs=[0,1,2,3].map(function(k){return U.button(br,"",function(){preset(cur().pre[k]);});});
    function relabel(){pbs.forEach(function(b,k){b.innerHTML=_w10_h(cur().pre[k][0]);});}
    function preset(p){tk.stop();md.set(p[1]);kp.set(p[2]);ti.set(p[3]);td.set(p[4]);ds.set(true);st.set(cur().tf);run();}
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var key=keys[pl.get()],c=cur(),P=_W10_PL[key],M=+md.get(),KP=c.kp[kp.get()],TI=c.ti[ti.get()],TD=c.td[td.get()];
      ti.el.style.display=(M===1||M===3)?"":"none";td.el.style.display=(M>=2)?"":"none";
      var KI=(M===1||M===3)?KP/TI:0,KD=M>=2?KP*TD:0,D=ds.get(),t0=c.td0,dv=c.dv;
      var o={KP:KP,KI:KI,KD:KD,deriv:"model",h:c.h,tEnd:c.tEnd,every:c.ev,r:function(){return c.r;},d:function(t){return D&&t>=t0?dv:0;}};
      if(key==="plate"){if(KI){o.x0=[35];o.I0=28;}else{o.x0=[35*1.25*KP/(1+1.25*KP)];o.I0=0;}}
      var res=_w10_sim(U,P,o);res.tEnd=c.tEnd;res.key=key;res.KP=KP;res.KI=KI;res.KD=KD;res.M=M;res.TI=TI;res.TD=TD;res.D=D;
      /* 指標 */
      var t=res.t,y=res.y.map(function(v){return key==="plate"?v+25:v;});res.yy=y;
      var bad=y.length<t.length||y.some(function(v){return !isFinite(v)||Math.abs(v)>1e6;});res.bad=bad;
      if(key==="plate"){var ptf=ctl.series(ctl.tf(P.num,P.den,P.L),_w10_C(U,KP,KI,KD,null));res.mg=ctl.margins(ptf,1e-4,10);}
      else{var Cs=_w10_C(U,KP,KI,KD,null),PO=ctl.poly;res.ps=PO.roots(PO.add(PO.mul(P.den,Cs.den),PO.mul(P.num,Cs.num)));}
      R=res;st.set(st.get());draw();
    }
    function draw(){
      if(!R)return;var key=R.key,c=cur(),P=_W10_PL[key],t=R.t,y=R.yy,n=t.length,nar=_w10_nar(box),Wd=nar?400:700,o=[];
      var tc=st.get()*R.tEnd,ix=Math.max(0,Math.min(n-1,Math.round(tc/(t[1]-t[0]))));
      /* 対象の絵 */
      var px=nar?8:10,py=26,pw=nar?180:200,ph=150;
      o.push(S.T(px,16,"その時刻の様子","start",10,"ink",true));
      if(key==="mpos"){var cx=px+pw/2,cy=py+ph/2,Rd=60,th=y[ix];
        o.push(S.CIRC(cx,cy,Rd,"muted",1.6,"panel"));o.push(S.L(cx,cy,cx+Rd+8,cy,"faint",1,"3 3"));
        o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(1),cy-(Rd-4)*Math.sin(1),"muted",1.8,"5 3"));
        var arc=[];for(var a=0;a<=40;a++){var an=th*a/40;arc.push([cx+24*Math.cos(an),cy-24*Math.sin(an)]);}if(Math.abs(th)>0.02)o.push(S.PL(arc,"signal",1.4));
        o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(th),cy-(Rd-4)*Math.sin(th),"signal",3.5));o.push(S.D(cx,cy,"ink",3.6));
        o.push(S.T(cx+(Rd+6)*Math.cos(1),cy-(Rd+6)*Math.sin(1)-2,"目標 1 rad","start",9,"muted",false,false,null,true));
        o.push(S.TX(px+8,py+ph+12,"θ_m = "+_w10_f(th,3)+" rad","start",10,"signal",true,true));}
      else if(key==="mspd"){var gx=px+pw/2,gy=py+ph-30,Rg=72,w=y[ix],wmax=120,ang=function(v){return Math.PI*(1-Math.max(0,Math.min(wmax,v))/wmax);};
        var ga=[];for(var q=0;q<=40;q++){var aa=Math.PI*q/40;ga.push([gx+Rg*Math.cos(aa),gy-Rg*Math.sin(aa)]);}o.push(S.PL(ga,"muted",1.6));
        [0,40,80,120].forEach(function(v){var aa=ang(v);o.push(S.L(gx+(Rg-6)*Math.cos(aa),gy-(Rg-6)*Math.sin(aa),gx+Rg*Math.cos(aa),gy-Rg*Math.sin(aa),"muted",1.2));o.push(S.T(gx+(Rg+12)*Math.cos(aa),gy-(Rg+12)*Math.sin(aa)+3,String(v),"middle",9,"muted"));});
        var ta=ang(c.r);o.push(S.L(gx,gy,gx+(Rg-2)*Math.cos(ta),gy-(Rg-2)*Math.sin(ta),"muted",1.6,"5 3"));
        var na=ang(w);o.push(S.L(gx,gy,gx+(Rg-8)*Math.cos(na),gy-(Rg-8)*Math.sin(na),"signal",3.2));o.push(S.D(gx,gy,"ink",3.6));
        o.push(S.TX(px+8,py+ph+12,"ω_m = "+_w10_f(w,1)+" rad/s（目標 100）","start",10,"signal",true,true));}
      else{var tp=y[ix],q2=R.u[ix],op=Math.max(0.08,Math.min(0.95,(tp-57.5)/3.5));
        o.push(S.RECT(px+20,py+40,pw-40,26,4,"alias","muted",1.2,null,' fill-opacity="'+_w10_f(op,2)+'"'));
        o.push(S.T(px+pw/2,py+34,"板（色が濃いほど熱い）","middle",9,"muted"));
        var hb=Math.max(0,Math.min(1,q2/80));o.push(S.RECT(px+20,py+74,pw-40,10,2,"panel","line",1));o.push(S.RECT(px+20,py+74,(pw-40)*hb,10,2,U.soft("gold"),"gold",1));
        o.push(S.T(px+20,py+98,"ヒータ "+_w10_f(q2,1)+" W（0〜80 W）","start",9.5,"gold",true));
        o.push(S.T(px+20,py+114,"周り "+(R.D&&t[ix]>=c.td0?"15":"25")+" °C","start",9.5,"purple",true));
        o.push(S.TX(px+8,py+ph+12,"θ = "+_w10_f(tp,2)+" °C（目標 60）","start",10,"signal",true,true));}
      /* P・I・D の棒 */
      var by=py+ph+44,bx0=px+40,bw=pw-50,vals=[[R.uP[ix],"P","gold"],[R.uI[ix],"I","green"],[R.uD[ix],"D","teal"],[R.u[ix],"計","ink"]];
      var um=0;for(var k=0;k<n;k++){um=Math.max(um,Math.abs(R.uP[k]),Math.abs(R.uI[k]),Math.abs(R.uD[k]),Math.abs(R.u[k]));}um=Math.min(um,1e6)||1;
      var z=bx0+bw/2;o.push(S.T(px,by-6,"操作量の内訳 ["+P.uu+"]","start",10,"ink",true));
      vals.forEach(function(v,k){var yy=by+6+k*20,len=v[0]/um*bw/2;o.push(S.T(bx0-8,yy+11,v[1],"end",10,v[2],true));
        o.push(S.RECT(Math.min(z,z+len),yy+2,Math.abs(len),12,2,U.soft(v[2]),v[2],1));o.push(S.T(z+(len>=0?len+4:len-4),yy+12,_w10_g(v[0],3),len>=0?"start":"end",9,v[2],false,false,null,true));});
      o.push(S.L(z,by+4,z,by+86,"muted",1));
      /* 波形 */
      var gx0=nar?52:268,gw=nar?330:412,gy0=nar?by+100:20,gh=nar?110:130;
      var ys=y.filter(function(v){return isFinite(v);}),ylo=Math.min.apply(null,ys),yhi=Math.max.apply(null,ys);
      if(key==="mpos"){ylo=Math.max(ylo,-1);yhi=Math.min(Math.max(yhi,1.1),2);ylo=Math.min(ylo,0);}
      if(key==="mspd"){ylo=0;yhi=Math.min(Math.max(yhi,105),160);}
      if(key==="plate"){ylo=Math.max(Math.min(ylo,59.5),56);yhi=Math.min(Math.max(yhi,60.3),64);}
      var sp=yhi-ylo||1;ylo-=sp*0.05;yhi+=sp*0.08;
      var Q=U.plot(gx0,gy0,gw,gh,[0,R.tEnd],[ylo,yhi]);
      if(R.D)o.push(S.RECT(Q.X(c.td0),Q.y,Q.X(R.tEnd)-Q.X(c.td0),Q.h,0,U.soft("purple"),"none",0));
      o.push(Q.axes({xl:null,yl:P.ylab+" ["+(key==="plate"?"°C":P.yu)+"]",xt:U.nice(0,R.tEnd,6),yt:U.nice(ylo,yhi,4),xfmt:function(){return "";},yfmt:function(v){return _w10_g(v,4);},ylOff:nar?36:42,sz:9}));
      var tgt=key==="plate"?60:c.r;o.push(Q.line([[0,tgt],[R.tEnd,tgt]],"muted",1.2,"5 3"));
      o.push(Q.clip(t.map(function(tt,i){return [tt,y[i]];}),"signal",2));
      var ul=[];R.u.forEach(function(v,i){ul.push(v,R.uP[i],R.uI[i],R.uD[i]);});ul=ul.filter(function(v){return isFinite(v);});
      var ulo=Math.min.apply(null,ul),uhi=Math.max.apply(null,ul);if(key==="plate"){ulo=Math.max(Math.min(ulo,0),-40);uhi=Math.min(Math.max(uhi,80),120);}else{ulo=Math.max(ulo,-15);uhi=Math.min(uhi,15);}
      var su=uhi-ulo||1;ulo-=su*0.06;uhi+=su*0.06;
      var Q2=U.plot(gx0,gy0+gh+18,gw,gh,[0,R.tEnd],[ulo,uhi]);
      if(R.D)o.push(S.RECT(Q2.X(c.td0),Q2.y,Q2.X(R.tEnd)-Q2.X(c.td0),Q2.h,0,U.soft("purple"),"none",0));
      o.push(Q2.axes({xl:"時間 t [s]",yl:P.ulab+" ["+P.uu+"]",xt:U.nice(0,R.tEnd,6),yt:U.nice(ulo,uhi,4),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,3);},ylOff:nar?36:42,sz:9}));
      if(P.ulo>-1e8){[P.ulo,P.uhi].forEach(function(v){if(v>ulo&&v<uhi)o.push(Q2.line([[0,v],[R.tEnd,v]],"alias",1,"2 3"));});}
      o.push(Q2.line([[0,0],[R.tEnd,0]],"faint",1));
      if(R.M===1||R.M===3)o.push(Q2.clip(t.map(function(tt,i){return [tt,R.uI[i]];}),"green",1.6));
      if(R.M>=2)o.push(Q2.clip(t.map(function(tt,i){return [tt,R.uD[i]];}),"teal",1.6));
      o.push(Q2.clip(t.map(function(tt,i){return [tt,R.uP[i]];}),"gold",1.6));
      o.push(Q2.clip(t.map(function(tt,i){return [tt,R.u[i]];}),"ink",1.4));
      [Q,Q2].forEach(function(G){o.push(S.L(G.X(tc),G.y,G.X(tc),G.y+G.h,"gold",1.2,"3 3"));});
      var lgy=Q2.y+Q2.h+46,lg=[["ink",null,"合計"],["gold",null,"P の分"]];if(R.M===1||R.M===3)lg.push(["green",null,"I の分"]);if(R.M>=2)lg.push(["teal",null,"D の分"]);lg.push(["signal",null,"制御量"]);
      o.push(S.LEGL(gx0-30,lgy,lg,9,10));
      box.set(S.svg(Wd,Math.max(lgy+8,by+100),o));
      /* 読み出し */
      var hs="",uu=P.uu,yu=key==="plate"?"K":P.yu,t0=c.td0;
      if(R.bad){ro.innerHTML='<span class="warn">閉ループが不安定で、制御量が大きくなり続ける。</span>'+(R.mg&&R.mg.pm!=null?" 位相余裕 "+_w10_f(R.mg.pm,1)+"°":"");return;}
      function at(tt){var k=Math.min(n-1,Math.round(tt/(t[1]-t[0])));return y[k];}
      if(key==="plate"){var y0=y[0],m1=-Infinity,mn=Infinity,lastOut=-1;for(var k2=0;k2<n;k2++){if(t[k2]<t0)continue;mn=Math.min(mn,y[k2]);if(Math.abs(y[k2]-y[n-1])>0.1)lastOut=k2;}
        hs+="始めの温度 "+_w10_f(y0,2)+" °C（偏差 "+_w10_f(60-y0,2)+" K）";
        if(R.D)hs+="。周りの温度が下がった後: 最も低い "+_w10_f(mn,2)+" °C（"+_w10_f(mn-y0,2)+" K）、"+(R.KI?(Math.abs(y[n-1]-60)<0.02&&lastOut>=0&&lastOut+1<n?"±0.1 K に戻るまで <b>"+_w10_g(t[lastOut+1]-t0,3)+" s</b>":'<span class="warn">表示の時間の中で ±0.1 K に戻らない</span>'):"落ち着く温度 "+_w10_f(y[n-1],2)+" °C（偏差 "+_w10_f(60-y[n-1],2)+" K）");
        hs+="<br>";if(R.mg)hs+="一巡伝達関数: ゲイン交差角周波数 "+(R.mg.wgc?_w10_g(R.mg.wgc,3)+" rad/s、位相余裕 <b>"+_w10_f(R.mg.pm,1)+"°</b>":"なし")+(R.mg.pm!=null&&R.mg.pm<0?' <span class="warn">位相余裕が負: 閉ループは不安定で、振れが大きくなり続ける（9 章 6 節）</span>':"")+"<br>";}
      else{/* 落ち着く値は式で求める（I 動作があるか、角度（対象が積分を含む）なら目標値。速度の比例だけなら KK_P/(1 + KK_P) 倍） */
        var KK=50*R.KP,yf=(R.KI||key==="mpos")?c.r:c.r*KK/(1+KK),bandv=key==="mpos"?0.02:2,unst=R.ps&&_w10_rhp(R.ps);
        var me=_w10_met(t,y,yf,0,R.D?t0:null,0.02),tw=R.D?t0:R.tEnd;
        if(unst)hs+='<span class="warn">閉ループが不安定</span><br>';
        else{hs+="目標値の変化: "+(Math.abs(yf-c.r)>1e-9?"落ち着く値 "+_w10_g(yf,3)+" "+yu+"（偏差 <b>"+_w10_g(c.r-yf,3)+" "+yu+"</b>）、":"偏差なし、")+"行き過ぎ量 <b>"+_w10_f(Math.max(0,me.mp),1)+" %</b>、2 % 整定時間 <b>"+(isFinite(me.ts)?_w10_g(me.ts,3)+" s":"—</b>（"+_w10_g(tw,3)+" s までに落ち着かない）<b>")+"</b><br>";
        if(R.D){if(R.KI){var mn2=Infinity,tmn=0,last2=-1;for(var k3=0;k3<n;k3++){if(t[k3]<t0)continue;if(y[k3]<mn2){mn2=y[k3];tmn=t[k3];}if(Math.abs(y[k3]-c.r)>bandv)last2=k3;}
            hs+="負荷の後: 最も下がって "+_w10_g(mn2,3)+" "+yu+"（目標からのずれ "+_w10_g(c.r-mn2,3)+" "+yu+"、"+_w10_g(tmn-t0,3)+" s 後）、"+(last2>=0&&last2+1<n?"±"+bandv+" "+yu+" に戻るまで <b>"+_w10_g(t[last2+1]-t0,3)+" s</b>":'<span class="warn">表示の時間の中では ±'+bandv+" "+yu+" に戻りきらない</span>")+"<br>";}
          else{var yd=key==="mpos"?c.r+c.dv/R.KP:yf+50*c.dv/(1+KK);hs+="負荷の後: 落ち着く値 "+_w10_g(yd,3)+" "+yu+"（目標からのずれ <b>"+_w10_g(c.r-yd,3)+" "+yu+"</b>）。I 動作が無いので、ずれが残る<br>";}}}
        if(R.ps)hs+="閉ループの極: "+_w10_poles(R.ps)+(_w10_rhp(R.ps)?' <span class="warn">不安定</span>':"")+"<br>";}
      var umax=Math.max.apply(null,R.u),umin=Math.min.apply(null,R.u);hs+=P.ulab+"の範囲: "+_w10_g(umin,3)+"〜"+_w10_g(umax,3)+" "+uu;
      if(umax>P.uhi+1e-9||umin<P.ulo-1e-9)hs+=' <span class="warn">出せる範囲（'+_w10_g(P.ulo,3)+"〜"+_w10_g(P.uhi,3)+" "+uu+"）を超える。実際にはこのとおりには動かない（11 章 4 節）</span>";
      if(R.M>=2&&key==="mspd")hs+="<br>一次遅れの対象に D 動作を足すと、閉ループの時定数が (T + KK<sub>D</sub>)/(1 + KK<sub>P</sub>) = "+_w10_g((0.05+50*R.KD)/(1+50*R.KP),3)+" s に延びる";
      ro.innerHTML=hs+'<div class="wnote">D 動作は測った制御量の変わる速さに掛け（3 節）、理想の微分として計算した。刻み '+_w10_g(c.h,2)+' s の数値計算。操作量の上限・下限は考えていない。値はどれも例の値。</div>';
    }
    relabel();preset(_W10_PD.mpos.pre[_W10_PD.mpos.def]);
  };

  function _w10_mix(a,b){var o={},k;for(k in a)o[k]=a[k];for(k in b)o[k]=b[k];return o;}
  function _w10_sd(v){var m=0;v.forEach(function(x){m+=x;});m/=v.length;var s=0;v.forEach(function(x){s+=(x-m)*(x-m);});return Math.sqrt(s/v.length);}

  /* ---- 6 節: 不完全微分の N と操作量のばたつき ---- */
  REG.w10_noise=function(el,U){
    var S=U.S,ctl=U.ctl,seed=1,Ns=[null,50,20,10,5,3,2,1],SG=[[0,0.0005,0.001,0.002,0.005,0.01],[0,0.01,0.02,0.05,0.1,0.2]];
    U.head(el,"NOISE","不完全微分の N と、操作量のばたつき");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度（PD、1 ms ごとに測る）","温度の板（PID、1 s ごとに読む）"],0,function(){def();run();});
    var r2=U.ctrls(el);
    var nn=U.slider(r2,"N",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return i===0?"なし（理想の微分）":String(Ns[i]);},onInput:function(){run();}});
    var sg=U.slider(r2,"観測ノイズの標準偏差 σ",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return SG[pl.get()][i]+(pl.get()===0?" rad":" K");},onInput:function(){run();}});
    var br=U.btnrow(el);
    function def(){nn.set(3);sg.set(3);}
    U.button(br,"本文の例（N = 10）",function(){def();run();});
    U.button(br,"N なし",function(){nn.set(0);run();});
    U.button(br,"N = 2",function(){nn.set(6);run();});
    U.button(br,"N = 1",function(){nn.set(7);run();});
    U.button(br,"もう一度（別の乱数）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      var p=pl.get(),N=Ns[nn.get()],sig=SG[p][sg.get()],key=p===0?"mpos":"plate",P=_W10_PL[key];
      var KP=p===0?0.84:24,KI=p===0?0:0.6,KD=p===0?0.02:240,TD=KD/KP,dt=p===0?0.001:1,tEnd=p===0?1.0:1100,tw=p===0?0.6:300;
      var rnd=U.rng(1000+seed),nz=[];for(var k=0;k<=Math.round(tEnd/dt)+2;k++)nz.push(sig*rnd.normal());
      var base={KP:KP,KI:KI,KD:KD,N:N,dmode:"y",deriv:"diff",tEnd:tEnd};
      if(p===0)base.r=function(){return 1;};else{base.r=function(){return 35;};base.d=function(t){return t>=100?-8:0;};base.x0=[35];base.I0=28;}
      var Rn=_w10_sim(U,P,_w10_mix(base,{h:dt,noise:function(k){return nz[k]||0;}}));
      var Rc=_w10_sim(U,P,_w10_mix(base,{h:p===0?1e-4:0.05,every:p===0?10:20}));
      var nar=_w10_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,o=[],off=p===1?25:0;
      /* (a) 操作量 */
      var ul=Rn.u.filter(function(v){return isFinite(v);}),ulo=Math.min.apply(null,ul),uhi=Math.max.apply(null,ul);
      if(p===1){ulo=Math.max(Math.min(ulo,-5),-60);uhi=Math.min(Math.max(uhi,85),140);}else{var mm=Math.max(Math.abs(ulo),Math.abs(uhi),0.2);ulo=Math.max(-mm,-3);uhi=Math.min(mm,3);}
      var A=U.plot(x0,22,pw,110,[0,tEnd],[ulo,uhi]);
      o.push(S.T(x0-50,12,"(a) "+(p===0?"電圧":"ヒータの電力")+"（"+(p===0?"1 ms":"1 s")+" ごとに測った値から計算）","start",10.5,"ink",true));
      if(p===1)o.push(S.RECT(A.x,A.Y(80),A.w,A.Y(0)-A.Y(80),0,U.soft("green"),"none",0));
      o.push(A.axes({xl:null,yl:p===0?"電圧 [V]":"電力 [W]",xt:U.nice(0,tEnd,6),yt:U.nice(ulo,uhi,4),xfmt:function(){return "";},yfmt:function(v){return _w10_g(v,3);},ylOff:nar?36:42,sz:9}));
      o.push(A.steps(Rn.t.map(function(t,i){return [t,Math.max(ulo,Math.min(uhi,Rn.u[i]))];}),N==null?"alias":"teal",1));
      if(p===1)o.push(S.T(A.x+A.w-4,A.Y(80)+12,"緑の帯: ヒータが出せる 0〜80 W","end",9,"green",false,false,null,true));
      /* (b) 制御量 */
      var yl=Rn.y.concat(Rc.y).map(function(v){return v+off;}).filter(function(v){return isFinite(v);}),ylo=Math.min.apply(null,yl),yhi=Math.max.apply(null,yl);
      if(p===1){ylo=Math.max(ylo,59);yhi=Math.min(Math.max(yhi,60.2),61);}else{ylo=0;yhi=Math.min(Math.max(yhi,1.15),1.6);}
      var B=U.plot(x0,A.y+A.h+30,pw,100,[0,tEnd],[ylo,yhi]);
      o.push(S.T(x0-50,B.y-8,"(b) "+(p===0?"角度（目標 1 rad）":"板の温度（100 s に周りの温度が下がる）"),"start",10.5,"ink",true));
      o.push(B.axes({xl:"時間 t [s]",yl:p===0?"角度 [rad]":"温度 [°C]",xt:U.nice(0,tEnd,6),yt:U.nice(ylo,yhi,4),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,4);},ylOff:nar?36:42,sz:9}));
      o.push(B.line([[0,p===0?1:60],[tEnd,p===0?1:60]],"muted",1.2,"5 3"));
      o.push(B.clip(Rc.t.map(function(t,i){return [t,Rc.y[i]+off];}),"muted",1.6,"5 3"));
      o.push(B.clip(Rn.t.map(function(t,i){return [t,Rn.y[i]+off];}),"signal",1.6));
      o.push(S.LEGL(x0,B.y+B.h+46,[["signal",null,"ノイズあり"],["muted","5 3","ノイズなし"]],9,12));
      /* (c) D の分のゲイン */
      var wr=p===0?[1,1e4]:[1e-3,10],ws=ctl.logspace(Math.log10(wr[0]),Math.log10(wr[1]),300);
      var Cy=B.y+B.h+70,G=U.plot(x0,Cy+16,nar?pw:300,110,wr,[KP*TD*wr[0]*0.5,KP*TD*wr[1]*2],{xlog:true,ylog:true});
      o.push(S.T(x0-50,Cy+4,"(c) D の分のゲイン（正弦波の振幅の比）","start",10.5,"ink",true));
      o.push(G.axes({xl:"角周波数 ω [rad/s]",yl:"ゲイン",xfmt:function(v){return _w10_g(v,2);},yfmt:function(v){return _w10_g(v,2);},ylOff:nar?36:42,sz:9}));
      o.push(G.clip(ws.map(function(w){return [w,KP*TD*w];}),"muted",1.6,"5 3"));
      if(N!=null){o.push(G.clip(ws.map(function(w){return [w,KP*TD*w/Math.sqrt(1+Math.pow(TD*w/N,2))];}),"teal",2.2));
        o.push(S.L(G.X(N/TD),G.y,G.X(N/TD),G.y+G.h,"teal",1,"2 3"));}
      o.push(G.clip([[wr[0],KP],[wr[1],KP]],"gold",1.4,"4 3"));
      var lx=nar?x0:G.x+G.w+20,ly=nar?G.y+G.h+44:G.y+14;
      o.push(S.LEGL(lx,ly,[["muted","5 3","理想の微分 K_P T_D ω"]],9,10));
      if(N!=null)o.push(S.LEGL(lx,ly+16,[["teal",null,"不完全微分（上限 K_P N = "+_w10_g(KP*N,3)+"）"]],9,10));
      o.push(S.LEGL(lx,ly+32,[["gold","4 3","P の分 K_P"]],9,10));
      box.set(S.svg(Wd,Math.max(ly+44,G.y+G.h+46),o));
      /* 読み出し */
      var win=Rn.u.filter(function(v,i){return Rn.t[i]>=tw;}),sdu=_w10_sd(win),hs="";
      hs+="落ち着いた後（"+tw+" s から）の"+(p===0?"電圧":"電力")+"の揺れ（標準偏差）: <b>"+_w10_g(sdu,3)+" "+P.uu+"</b>";
      hs+="（P の分だけなら K<sub>P</sub>σ = "+_w10_g(KP*sig,3)+" "+P.uu+"。理想の微分の D の分は √2 K<sub>D</sub>σ/Δt = "+_w10_g(Math.SQRT2*KD*sig/dt,3)+" "+P.uu+"）<br>";
      if(N!=null)hs+="不完全微分: 微分として働くのは N/T<sub>D</sub> = "+_w10_g(N/TD,3)+" rad/s まで、速い揺れの上限は K<sub>P</sub>N = "+_w10_g(KP*N,3)+" "+P.uu+"/"+(p===0?"rad":"K")+"<br>";
      var Cs=_w10_C(U,KP,KI,KD,N),mg=ctl.margins(ctl.series(ctl.tf(P.num,P.den,P.L),Cs),wr[0]/10,wr[1]*10);
      hs+="位相余裕 <b>"+(mg.pm!=null?_w10_f(mg.pm,1)+"°":"—")+"</b>（ゲイン交差角周波数 "+(mg.wgc?_w10_g(mg.wgc,3):"—")+" rad/s）<br>";
      if(p===0){var me=_w10_met(Rc.t,Rc.y,1,0);hs+="ノイズの無いとき: 行き過ぎ量 "+_w10_f(Math.max(0,me.mp),1)+" %、2 % 整定時間 "+(isFinite(me.ts)?_w10_g(me.ts,3)+" s":"—");}
      else{var mn=Infinity,last=-1,n=Rc.t.length;for(var k2=0;k2<n;k2++){if(Rc.t[k2]<100)continue;mn=Math.min(mn,Rc.y[k2]+25);if(Math.abs(Rc.y[k2]-35)>0.1)last=k2;}
        hs+="ノイズの無いとき: 最も下がって "+_w10_f(mn,2)+" °C、"+(last>=0&&last+1<n?"±0.1 K に戻るまで <b>"+_w10_g(Rc.t[last+1]-100,3)+" s</b>":'<span class="warn">表示の時間の中で ±0.1 K に戻らない（揺れが続く）</span>');}
      if(p===1&&(Math.max.apply(null,Rn.u)>80||Math.min.apply(null,Rn.u)<0))hs+='<br><span class="warn">ヒータが出せない電力（0 W 未満か 80 W 超）を求めている</span>';
      ro.innerHTML=hs+'<div class="wnote">ノイズは回ごとに独立な正規分布の乱数（'+(p===0?"1 ms":"1 s")+' ごとに変わる）。D 動作は測った値に掛け、1 回前との差で計算した（6 節の C のコードと同じ式）。モータは PD（0.84 V/rad・0.02 V·s/rad）、温度の板は PID（24 W/K・40 s・10 s）。値はどれも例の値。</div>';
    }
    run();
  };

  /* ---- 6 節: 微分キック・測定値の微分・目標値の重み ---- */
  REG.w10_kick=function(el,U){
    var S=U.S,Ns=[null,50,20,10,5,2],Bs=[0,0.2,0.3,0.5,0.7,1];
    U.head(el,"DERIVATIVE KICK","微分キック — 偏差の微分・測定値の微分・目標値の重み");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度（PID: 0.84 V/rad・5 V/(rad·s)・0.02 V·s/rad）","温度の板（PID: 24 W/K・40 s・10 s）"],0,function(){run();});
    var r2=U.ctrls(el);
    var nn=U.slider(r2,"N",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return i===0?"なし（理想の微分）":String(Ns[i]);},onInput:function(){run();}});
    var bb=U.slider(r2,"目標値の重み b（緑の線）",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return String(Bs[i]);},onInput:function(){run();}});
    var ds=U.checkbox(r2,"外乱も入れる",false,function(){run();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（N = 10、b = 0.5）",function(){nn.set(3);bb.set(3);ds.set(false);run();});
    U.button(br,"N なし（理想の微分）",function(){nn.set(0);run();});
    U.button(br,"b = 1",function(){bb.set(5);run();});
    U.button(br,"b = 0",function(){bb.set(0);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      var p=pl.get(),N=Ns[nn.get()],b=Bs[bb.get()],D=ds.get(),key=p===0?"mpos":"plate",P=_W10_PL[key];
      var KP=p===0?0.84:24,KI=p===0?5:0.6,KD=p===0?0.02:240,ts=p===0?0.1:100,dz=p===0?1.1:900,tEnd=p===0?(D?2.1:1.2):(D?1500:900),h=p===0?1e-5:0.05;
      var off=p===0?0:25,r0=p===0?0:35,r1v=p===0?1:37,dv=p===0?-1:-8;
      var cases=[["偏差の微分（b = 1）","e",1,"alias"],["測定値の微分（b = 1）","y",1,"signal"],["測定値の微分（b = "+b+"）","y",b,"green"]];
      var res=cases.map(function(cs){var o={KP:KP,KI:KI,KD:KD,N:N,dmode:cs[1],b:cs[2],deriv:"diff",h:h,tEnd:tEnd,every:p===0?10:1,
        r:function(t){return t>=ts-1e-12?r1v:r0;},d:function(t){return D&&t>=dz?dv:0;}};
        if(p===1){o.x0=[35];o.I0=28+KP*(1-cs[2])*35;}return _w10_sim(U,P,o);});
      var nar=_w10_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,o=[],stp=Math.max(1,Math.round(res[0].t.length/2500));
      function thin(r,arr){var q=[];for(var i=0;i<r.t.length;i+=stp)q.push([r.t[i],arr(i)]);
        var im=0;for(var i2=0;i2<r.t.length;i2++)if(Math.abs(r.u[i2])>Math.abs(r.u[im]))im=i2;return q;}
      /* (a) 制御量 */
      var yl=[];res.forEach(function(r){r.y.forEach(function(v){if(isFinite(v))yl.push(v+off);});});
      var ylo=Math.min.apply(null,yl),yhi=Math.max.apply(null,yl);if(p===0){ylo=Math.min(ylo,0);yhi=Math.min(Math.max(yhi,1.1),1.6);}else{ylo=Math.max(Math.min(ylo,59.8),57);yhi=Math.min(Math.max(yhi,62.3),66);}
      var A=U.plot(x0,22,pw,120,[0,tEnd],[ylo,yhi+(yhi-ylo)*0.05]);
      o.push(S.T(x0-50,12,"(a) "+(p===0?"角度（"+ts+" s に目標を 1 rad 変える）":"板の温度（"+ts+" s に目標を 60 °C から 62 °C に）"),"start",10.5,"ink",true));
      o.push(A.axes({xl:null,yl:p===0?"角度 [rad]":"温度 [°C]",xt:U.nice(0,tEnd,6),yt:U.nice(A.yr[0],A.yr[1],4),xfmt:function(){return "";},yfmt:function(v){return _w10_g(v,4);},ylOff:nar?36:42,sz:9}));
      o.push(A.line([[0,r0+off],[ts,r0+off],[ts,r1v+off],[tEnd,r1v+off]],"muted",1.2,"5 3"));
      if(D)o.push(S.RECT(A.X(dz),A.y,A.X(tEnd)-A.X(dz),A.h,0,U.soft("purple"),"none",0));
      res.forEach(function(r,k){o.push(A.clip(thin(r,function(i){return r.y[i]+off;}),cases[k][3],k===0?1.6:2));});
      /* (b) 操作量 */
      var umax=res.map(function(r){return Math.max.apply(null,r.u);}),umin=res.map(function(r){return Math.min.apply(null,r.u);});
      var ulo=p===0?Math.max(-2,Math.min.apply(null,umin)):Math.max(-100,Math.min(0,Math.min.apply(null,umin))),uhi=p===0?Math.min(12,Math.max(1.2,Math.max.apply(null,umax))):Math.min(600,Math.max(90,Math.max.apply(null,umax)));
      var Bp=U.plot(x0,A.y+A.h+30,pw,130,[0,tEnd],[ulo-(uhi-ulo)*0.04,uhi*1.04]);
      o.push(S.T(x0-50,Bp.y-8,"(b) "+(p===0?"電圧":"ヒータの電力")+"（枠を超える山は枠で切ってある）","start",10.5,"ink",true));
      o.push(Bp.axes({xl:"時間 t [s]",yl:p===0?"電圧 [V]":"電力 [W]",xt:U.nice(0,tEnd,6),yt:U.nice(Bp.yr[0],Bp.yr[1],5),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,3);},ylOff:nar?36:42,sz:9}));
      if(p===1){[0,80].forEach(function(v){o.push(Bp.line([[0,v],[tEnd,v]],"green",1,"2 3"));});}
      if(D)o.push(S.RECT(Bp.X(dz),Bp.y,Bp.X(tEnd)-Bp.X(dz),Bp.h,0,U.soft("purple"),"none",0));
      res.forEach(function(r,k){var q=thin(r,function(i){return r.u[i];});var im=0;for(var i3=0;i3<r.t.length;i3++)if(r.u[i3]>r.u[im])im=i3;q.push([r.t[im],r.u[im]]);q.sort(function(a,b2){return a[0]-b2[0];});
        o.push(Bp.clip(q,cases[k][3],k===0?1.4:1.8));});
      o.push(S.LEGL(x0-30,Bp.y+Bp.h+46,cases.map(function(cs){return [cs[3],null,cs[0]];}),9,10));
      box.set(S.svg(Wd,Bp.y+Bp.h+54,o));
      /* 読み出し */
      var rows=res.map(function(r,k){var yy=r.y.map(function(v){return v+off;}),yf=r1v+off,mx=-Infinity,last=-1,band=p===0?0.02:0.1;
        for(var i=0;i<r.t.length;i++){if(r.t[i]<ts||(D&&r.t[i]>=dz))continue;mx=Math.max(mx,yy[i]);if(Math.abs(yy[i]-yf)>(p===0?band*1:band))last=i;}
        var tsv=last>=0&&last+1<r.t.length?r.t[last+1]-ts:NaN,ovs=p===0?_w10_f(Math.max(0,(mx-yf)*100),1)+" %":_w10_f(Math.max(0,mx-yf),2)+" K";
        var dd="";if(D){var mn=Infinity;for(var j=0;j<r.t.length;j++)if(r.t[j]>=dz)mn=Math.min(mn,yy[j]);dd=_w10_g(mn-yf,3)+(p===0?" rad":" K");}
        var row=['<span style="color:'+U.col(cases[k][3])+'">■</span> '+cases[k][0],_w10_g(Math.max.apply(null,r.u),3)+" "+P.uu+(p===1?"（最小 "+_w10_g(Math.min.apply(null,r.u),3)+"）":""),ovs,isFinite(tsv)?_w10_g(tsv,3)+" s":"—"];if(D)row.push(dd);return row;});
      var hd=["微分の掛け方",(p===0?"電圧":"電力")+"の最大","行き過ぎ",p===0?"2 % 整定時間":"±0.1 K に入る時間"];if(D)hd.push("外乱で最も下がる量");
      var hs=U.tbl(hd,rows,["left","right","right","right","right"]);
      if(N==null)hs+='<span class="warn">理想の微分では、偏差の微分の山の高さは、計算の刻み '+_w10_g(h,2)+' s に反比例する（刻みを細かくするほど高い）。</span><br>';
      if(p===1)hs+="ヒータが出せるのは 0〜80 W。山がこれを超えると、実際にはそのとおりには出せない。<br>";
      ro.innerHTML=hs+'<div class="wnote">3 つとも同じ PID（極も同じ）で、違うのは目標値の通り道だけである。外乱を入れると、3 つの外乱への応答が同じことを確かめられる。刻み '+_w10_g(h,2)+' s の数値計算。値はどれも例の値。</div>';
    }
    run();
  };
