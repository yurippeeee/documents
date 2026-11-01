  /* ===== 06 章 AC 電源で動かす ===== */
  /* 整流・平滑コンデンサ・一定の電力の負荷の模型（3 節の例: ダイオード 2 個で 1.8 V、配線などの抵抗 5 Ω）。
     o = {Vrms, f, C [F], P [W], Pcut [W]（null なら減らさない）, V2, tOut [s], dur [s], method "ac"|"dc"|"self", Th [s], Vdet, tEnd, dt, rec:[t0,t1], every}
     交流の検出の信号は |v| < 20 V で H。戻り値 {pts:[[t, v, high]], det, falseDet, col} */
  function _w06_sim(o){
    var Vp=Math.SQRT2*o.Vrms,v=Vp-1.8,P=o.P,hs=null,det=null,col=null,fd=false,pts=[],dt=o.dt||5e-6,n=Math.ceil(o.tEnd/dt),r0=o.rec?o.rec[0]:0,r1=o.rec?o.rec[1]:o.tEnd,ev=o.every||10,w=2*Math.PI*o.f;
    for(var k=0;k<n;k++){
      var t=k*dt,on=!(t>=o.tOut&&t<o.tOut+o.dur),vac=on?Vp*Math.sin(w*t):0,high=Math.abs(vac)<20;
      if(high){if(hs===null)hs=t;}else hs=null;
      if(det===null&&t>0.03){
        var hit=o.method==="ac"?(hs!==null&&t-hs>o.Th):(o.method==="dc"?v<o.Vdet:v<=o.V2);
        if(hit){det=t;if(t<o.tOut)fd=true;if(o.Pcut!=null)P=o.Pcut;}
      }
      var ich=Math.abs(vac)-1.8-v;ich=ich>0?ich/5:0;
      if(v<=o.V2&&col===null&&t>=o.tOut)col=t;
      v+=(ich-(v>o.V2?P/v:0))/o.C*dt;
      if(k%ev===0&&t>=r0&&t<=r1)pts.push([t,v,high]);
      if(col!==null&&t>col+0.012&&!(t<o.tOut+o.dur&&o.keepRunning))break;
    }
    return {pts:pts,det:det,falseDet:fd,col:col};
  }
  /* 停電の前の谷と山 */
  function _w06_ripple(Vrms,f,C,P){var r=_w06_sim({Vrms:Vrms,f:f,C:C,P:P,V2:0,tOut:1,dur:0,method:"none",tEnd:0.06+1/(2*f),dt:5e-6,rec:[0.06,1],every:2}),lo=1e9,hi=0;
    r.pts.forEach(function(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);});return [lo,hi];}
  function _w06_wide(box){var w=box.el.clientWidth;return !(w>0&&w<520);}
  function _w06_ms(s){return (Math.abs(s)>=10e-3?U_sig(s*1e3,3):U_sig(s*1e3,2))+" ms";}
  function U_sig(v,d){if(v===0)return "0";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  /* ---- 3 節: 停電の検出と後始末の時間 ---- */
  REG.w06_holdup=function(el,U){
    var S=U.S;
    U.head(el,"HOLD-UP","停電から電源が保てなくなるまでと、後始末の時間");
    var r1=U.ctrls(el);
    var cC=U.slider(r1,"平滑コンデンサ C",{values:[4.7,10,15,22,33,47,68,100,150,220],value:22,fmt:function(v){return v+" µF";},onInput:draw});
    var cP=U.slider(r1,"入力の電力 P",{min:1,max:30,value:5,log:true,fmt:function(v){return U.sig(v,3)+" W";},onInput:draw});
    var cV=U.slider(r1,"コンセントの電圧",{min:85,max:110,step:1,value:90,fmt:function(v){return v+" V";},onInput:draw});
    var cF=U.select(r1,"周波数",["50 Hz","60 Hz"],0,draw);
    var r2=U.ctrls(el);
    var cV2=U.slider(r2,"絶縁電源が保てる最低の電圧 V₂",{min:40,max:110,step:5,value:70,fmt:function(v){return v+" V";},onInput:draw});
    var cM=U.select(r2,"停電の検出",["AC 側（H が続く時間）","DC 側（平滑コンデンサの電圧）","マイコンの電源電圧だけで見る"],0,draw);
    var cTh=U.slider(r2,"H が続いたら停電とみなす時間",{min:0.5,max:12,step:0.5,value:3,fmt:function(v){return v+" ms";},onInput:draw});
    var cVd=U.slider(r2,"DC 側のしきい値 V_det",{min:60,max:150,step:1,value:100,fmt:function(v){return v+" V";},onInput:draw});
    var r3=U.ctrls(el);
    var cCut=U.checkbox(r3,"気づいたら電力を減らす",true,draw);
    var cPc=U.slider(r3,"減らした後の電力",{min:0.2,max:5,step:0.1,value:1,fmt:function(v){return U.sig(v,2)+" W";},onInput:draw});
    var r4=U.ctrls(el);
    var cN=U.slider(r4,"書く量",{values:[2,4,8,16,32,64,128,256,512,1024],value:8,fmt:function(v){return v+" 語（"+v*4+" バイト）";},onInput:draw});
    var cTw=U.slider(r4,"1 語を書く時間",{min:10,max:200,step:5,value:60,fmt:function(v){return v+" µs";},onInput:draw});
    var cEr=U.checkbox(r4,"書く前にページを消去する（20 ms）",false,draw);
    var r5=U.ctrls(el);
    var cPh=U.slider(r5,"停電が始まる位相（ゼロクロスから）",{min:0,max:175,step:5,value:60,fmt:function(v){return v+"°";},onInput:draw});
    var br=U.btnrow(el);
    function preset(m,V,cut){cC.set(22);cP.set(5);cV.set(V);cF.set(0);cV2.set(70);cM.set(m);cTh.set(3);cVd.set(100);cCut.set(cut);cPc.set(1);cN.set(8);cTw.set(60);cEr.set(false);cPh.set(60);draw();}
    U.button(br,"3 節の例（90 V・AC 側・1 W に減らす）",function(){preset(0,90,true);});
    U.button(br,"減らさない",function(){preset(0,90,false);});
    U.button(br,"DC 側で見る",function(){preset(1,90,false);});
    U.button(br,"マイコンの電源電圧だけで見る",function(){preset(2,90,false);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function run(ph,dt,rec,every){
      var f=cF.get()?60:50,set=0.04,tOut=set+ph/360/f;
      return {tOut:tOut,r:_w06_sim({Vrms:cV.get(),f:f,C:cC.get()*1e-6,P:cP.get(),Pcut:cCut.get()?cPc.get():null,V2:cV2.get(),tOut:tOut,dur:30,method:["ac","dc","self"][cM.get()],
        Th:cTh.get()*1e-3,Vdet:cVd.get(),tEnd:tOut+3.0,dt:dt,rec:rec,every:every})};
    }
    function draw(){
      var m=cM.get();cTh.el.style.display=m===0?"":"none";cVd.el.style.display=m===1?"":"none";cPc.el.style.display=cCut.get()?"":"none";
      var f=cF.get()?60:50,C=cC.get()*1e-6,P=cP.get(),V2=cV2.get(),Pc=cCut.get()?cPc.get():P;
      var rp=_w06_ripple(cV.get(),f,C,P),Vv=rp[0],Vpk=rp[1];
      var clean=0.2e-3+cN.get()*cTw.get()*1e-6+(cEr.get()?20e-3:0);
      var x=run(cPh.get(),5e-6,null,1e9),R=x.r,tOut=x.tOut;
      var t0=tOut-0.02,tHorizon=(R.col!==null?R.col:tOut+3)-tOut;
      var span=Math.min(3,Math.max(0.04,tHorizon*1.15+0.004)),every=Math.max(1,Math.round(span/700/5e-6));
      R=run(cPh.get(),5e-6,[t0,tOut+span],every).r;
      var selfDet=m===2,avail=R.det===null?0:(selfDet?1e-3:(R.col-R.det)),margin=avail-clean;
      /* 位相を変えた中で最も悪い場合（粗い刻みで） */
      var worst=Infinity,wph=0;
      for(var ph=0;ph<180;ph+=7.5){var q=run(ph,20e-6,[0,0],1e9).r;if(q.det===null||q.falseDet)continue;var a=(selfDet?1e-3:(q.col-q.det))-clean;if(a<worst){worst=a;wph=ph;}}
      /* ---- 図 ---- */
      var wide=_w06_wide(box),W=wide?700:400,x0=wide?70:52,wd=W-x0-(wide?60:40),o=[];
      var X=function(t){return x0+(t-tOut+0.02)/(span+0.02)*wd;};
      var vmax=Math.ceil((Vpk+12)/20)*20,vmin=Math.max(0,Math.floor((Math.min(V2,m===1?cVd.get():V2)-20)/20)*20);
      var y0=18,h=wide?170:150,Y=function(v){return y0+h-(v-vmin)/(vmax-vmin)*h;};
      o.push(S.W([x0,y0,x0,y0+h,x0+wd,y0+h],"muted",1.1));
      U.nice(vmin,vmax,5).forEach(function(v){if(v>=vmin&&v<=vmax){o.push(S.L(x0,Y(v),x0+wd,Y(v),"grid",1));o.push(S.T(x0-6,Y(v)+3.5,String(v),"end",9,"muted"));}});
      o.push(S.T(x0-(wide?40:34),y0+h/2,"平滑コンデンサ [V]","middle",9.5,"muted",false,false,-90));
      o.push(S.L(x0,Y(V2),x0+wd,Y(V2),"alias",1.1,"4 3"));o.push(S.T(x0+wd+4,Y(V2)+4,"V₂","start",9,"alias",true));
      if(m===1){o.push(S.L(x0,Y(cVd.get()),x0+wd,Y(cVd.get()),"teal",1.1,"4 3"));o.push(S.T(x0+wd+4,Y(cVd.get())+4,"V_det","start",9,"teal",true));}
      o.push(S.PL(R.pts.map(function(p){return [X(p[0]),Y(Math.max(vmin,p[1]))];}),"gold",2.2));
      o.push(S.L(X(tOut),y0,X(tOut),y0+h,"alias",1.2,"3 3"));o.push(S.T(X(tOut)+3,y0+10,"停電","start",9.5,"alias",true,false,null,true));
      if(R.det!==null){o.push(S.L(X(R.det),y0+16,X(R.det),y0+h,"teal",1.2,"3 3"));o.push(S.T(X(R.det)+3,y0+26,R.falseDet?"誤って気づく":"気づく","start",9.5,"teal",true,false,null,true));}
      if(R.col!==null){o.push(S.D(X(R.col),Y(V2),"alias",4));}
      /* 下の帯: 交流の検出の信号と、マイコンの状態 */
      var yb=y0+h+12,pts=[];
      R.pts.forEach(function(p){var xx=X(p[0]),yy=yb+(p[2]?0:14);if(pts.length&&pts[pts.length-1][1]!==yy)pts.push([xx,pts[pts.length-1][1]]);pts.push([xx,yy]);});
      o.push(S.PL(pts,"teal",1.6));o.push(S.T(x0-6,yb+10,"信号","end",9,"teal",true));
      var ys=yb+24,segs=[];
      var tdet=R.det===null?null:R.det,tcl=tdet===null?null:tdet+clean,tend=tOut+span;
      if(tdet===null||tdet>tOut+span)segs.push([tOut-0.02,R.col!==null?R.col:tend,"運転","signal"]);
      else{segs.push([tOut-0.02,tdet,"運転","signal"]);segs.push([tdet,Math.min(tcl,tend),"後始末","alias"]);
        if(R.col!==null&&tcl<R.col)segs.push([tcl,R.col,"待つ","muted"]);}
      if(R.col!==null)segs.push([R.col,tend,"保てない","muted"]);
      segs.forEach(function(s){var a=X(Math.max(s[0],tOut-0.02)),b=X(Math.min(s[1],tend));if(b<=a)return;o.push(S.RECT(a,ys,Math.max(b-a,1),16,2,U.soft(s[3]),s[3],1));
        if(b-a>U.tw(s[2],9)+6)o.push(S.T((a+b)/2,ys+12,s[2],"middle",9,s[3],true));});
      o.push(S.T(x0-6,ys+12,"マイコン","end",9,"ink",true));
      var ya=ys+30;U.nice(-20,span*1e3,wide?7:4).forEach(function(v){var t=tOut+v*1e-3;if(t>=tOut-0.02-1e-9&&t<=tend+1e-9){o.push(S.L(X(t),ya-4,X(t),ya,"muted",1));o.push(S.T(X(t),ya+11,U.sig(v,4),"middle",9,"muted"));}});
      o.push(S.T(x0+wd,ya+25,"停電からの時間 [ms]","end",9.5,"muted"));
      box.set(S.svg(W,ya+30,o));
      /* ---- 読み出し ---- */
      var F=U.fmt,warn="",th=C*(Vv*Vv-V2*V2)/(2*P);
      if(Vv<=V2)warn+='<span class="warn">ふだんの谷 '+Vv.toFixed(0)+' V が V₂ より低く、停電の前から電源が保てない。</span><br>';
      if(R.falseDet)warn+='<span class="warn">停電の前に気づいてしまう（'+(m===0?'H の時間がふだんの幅より短い':'しきい値がふだんの谷 '+Vv.toFixed(0)+' V より高い')+'）。</span><br>';
      var res=R.det===null?"—":(margin>=0?'<span class="ok">間に合う（余裕 '+F.time(margin)+'）</span>':'<span class="warn">間に合わない（'+F.time(-margin)+' 足りない）</span>');
      ro.innerHTML=warn+"停電の前: 谷 <b>"+Vv.toFixed(0)+" V</b>・山 "+Vpk.toFixed(0)+" V ・ 保持時間（谷から、式）t_h = C(V₁² − V₂²)/(2P) = <b>"+(th>0?F.time(th):"—")+"</b>"+
        (R.col!==null&&!cCut.get()?"（この位相で数値で解くと "+F.time(R.col-tOut)+"）":"")+"<br>"+
        "停電から気づくまで <b>"+(R.det===null?"—":F.time(R.det-tOut))+"</b> ・ 気づいてから保てなくなるまで <b>"+(R.det===null?"—":F.time(avail))+"</b>"+
        (selfDet?"（マイコンの電源電圧が下がり始めてからは、二次側のコンデンサの分しか残らない。ここでは 1 ms とした）":"")+
        (m===1&&!cCut.get()?"（式: C(V_det² − V₂²)/(2P) = "+F.time(C*(cVd.get()*cVd.get()-V2*V2)/(2*P))+"）":"")+"<br>"+
        "後始末 = 負荷を切る 0.2 ms + "+cN.get()+" 語 × "+cTw.get()+" µs"+(cEr.get()?" + 消去 20 ms":"")+" = <b>"+F.time(clean)+"</b> → "+res+"<br>"+
        "停電が始まる位相を変えたときの最も悪い場合: "+(isFinite(worst)?(worst>=0?'<span class="ok">余裕 '+F.time(worst)+'</span>':'<span class="warn">'+F.time(-worst)+' 足りない</span>')+"（"+wph+"° のあたり）":"—")+
        '<div class="wnote">一定の電力 '+U.sig(P,3)+' W'+(cCut.get()?'（気づいた後は '+U.sig(Pc,2)+' W）':'')+'で平滑コンデンサのエネルギーを使い、V₂ を下回ると絶縁電源が止まるとした。交流の検出の信号は、電圧の大きさが 20 V より小さい間 H。値はどれも例の値で、二次側のコンデンサの分は数えない（安全側）。</div>';
    }
    draw();
  };

  /* ---- 4 節: 停電の長さと、電源が戻ったとき ---- */
  REG.w06_restore=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"RESTORE","停電の長さと、電源が戻ったときに戻すもの");
    var r1=U.ctrls(el);
    var cL=U.slider(r1,"停電の長さ",{min:0.5e-3,max:600,value:0.04,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var cV=U.select(r1,"コンセントの電圧",["90 V","100 V"],0,draw);
    var cCut=U.checkbox(r1,"気づいたら 1 W に減らす",true,draw);
    var r2=U.ctrls(el);
    var cRtc=U.checkbox(r2,"RTC（予備の電池で時刻を数え続ける）",false,draw);
    var cPol=U.select(r2,"ヒータを戻す決め方",["リセットされない短い停電だけ戻す","RTC で分かった長さが 10 s 以内なら戻す","いつも利用者の操作を待つ"],0,draw);
    var br=U.btnrow(el);
    [["(a) 1 ms",1e-3],["(b) 40 ms",0.04],["(c) 2 s",2],["10 分",600]].forEach(function(b){U.button(br,b[0],function(){cL.set(b[1]);draw();});});
    var box=U.svgbox(el); var ro=U.readout(el);
    var cache={};
    function times(Vr,cut){var k=Vr+"_"+cut;if(cache[k])return cache[k];
      /* 谷で始まる長い停電で、気づく時刻と保てなくなる時刻を求める（位相 60°） */
      var tOut=0.04+60/360/50,r=_w06_sim({Vrms:Vr,f:50,C:22e-6,P:5,Pcut:cut?1:null,V2:70,tOut:tOut,dur:30,method:"ac",Th:3e-3,tEnd:tOut+1,dt:5e-6,rec:[0,0],every:1e9});
      return cache[k]={det:r.det-tOut,col:r.col-tOut};}
    function draw(){
      var L=cL.get(),Vr=cV.get()?100:90,cut=cCut.get(),T=times(Vr,cut),pol=cPol.get(),rtc=cRtc.get();
      var det=L>T.det?T.det:null,reset=L>=T.col,known=!reset||rtc;
      var cat=det===null?"a":(reset?"c":"b");
      var tChk=0.1,tBoot=reset?0.02:0,tDec=L+tBoot+tChk;
      var heater=false,why="";
      if(cat==="a"){heater=true;why="気づかないので、ヒータは途切れた間だけ止まり、そのまま入る";}
      else if(pol===2){why="決め方により、利用者の操作を待つ";}
      else if(cat==="b"){heater=true;why="リセットされない短い停電（"+F.time(L)+"）で、停電の前に運転していた。温度センサが正しく読めることを確かめて戻す";}
      else if(pol===1&&rtc&&L<=10){heater=true;why="RTC で停電の長さ "+F.time(L)+" が分かり、10 s 以内なので戻す";}
      else why=(reset&&!rtc?"リセットされ、停電の長さが分からないので、長い停電として扱い":"長い停電なので")+"、利用者の操作を待つ";
      var fanHeat=cat==="c"&&(!known||L<300);
      /* ---- 時間の軸: 長い停電は途中を省く ---- */
      var wide=box.el.clientWidth===0||box.el.clientWidth>=520,W=wide?700:400,x0=wide?96:70,wd=W-x0-14,o=[];
      var brk=L>0.22,a1=brk?0.13:L+0.32,X;
      if(!brk)X=function(t){return x0+(t+0.01)/(a1+0.01)*wd;};
      else{var wl=wd*0.45,wr=wd*0.5,g=wd*0.05,b0=L-0.03,b1=L+0.3;X=function(t){return t<=a1?x0+(t+0.01)/(a1+0.01)*wl:x0+wl+g+(Math.max(t,b0)-b0)/(b1-b0)*wr;};}
      var tEnd=brk?L+0.3:a1;
      var rows=[["商用電源"],["マイコン"],["ヒータ"],["ファン"]],y0=14;
      function seg(r,a,b,lab,c){var y=y0+r*22,xa=X(Math.max(a,-0.01)),xb=X(Math.min(b,tEnd));if(xb<=xa)return;o.push(S.RECT(xa,y,Math.max(xb-xa,1.2),16,2,U.soft(c),c,1));
        if(xb-xa>U.tw(lab,9)+6)o.push(S.T((xa+xb)/2,y+12,lab,"middle",9,c,true));}
      rows.forEach(function(r,i){o.push(S.T(x0-8,y0+i*22+12,r[0],"end",9.5,"ink",true));o.push(S.RECT(x0,y0+i*22,wd,16,2,"screen","line",0.8));});
      seg(0,-0.01,0,"","gold");seg(0,0,L,"停電","alias");seg(0,L,tEnd,"あり","gold");
      if(cat==="a"){seg(1,-0.01,tEnd,"運転（気づかない）","signal");seg(2,-0.01,0,"","purple");seg(2,L,tEnd,"入","purple");seg(3,-0.01,tEnd,"回る","teal");}
      else{
        seg(1,-0.01,det,"運転","signal");seg(1,det,det+0.0007,"","alias");
        if(reset){seg(1,det+0.0007,T.col,"待つ","muted");seg(1,T.col,L,"電源なし（リセット）","muted");seg(1,L,L+tBoot+tChk,"確かめる","teal");}
        else{seg(1,det+0.0007,L,"待つ","muted");seg(1,L,L+tChk,"確かめる","teal");}
        seg(1,tDec,tEnd,heater?"運転":"利用者を待つ",heater?"signal":"green");
        seg(2,-0.01,0,"","purple");if(heater)seg(2,tDec,tEnd,"戻す","purple");
        seg(3,-0.01,det,"","teal");if(cat==="b")seg(3,tDec,tEnd,"回る","teal");else if(fanHeat)seg(3,tDec,tEnd,"余熱を逃がす","teal");
      }
      var ya=y0+4*22+2;
      function tick(t,lab){var xx=X(t);o.push(S.L(xx,ya,xx,ya+4,"muted",1));o.push(S.T(xx,ya+15,lab,"middle",9,"muted"));}
      if(!brk){U.nice(0,a1*1e3,wide?6:4).forEach(function(v){if(v*1e-3<=a1)tick(v*1e-3,U.sig(v,4)+(v===0?" ms":""));});}
      else{[0,0.05,0.1].forEach(function(t){tick(t,U.sig(t*1e3,3)+(t===0?" ms":""));});tick(L,F.time(L));tick(L+0.2,"+0.2 s");
        var xg=X(a1)+wd*0.025;o.push(S.T(xg,ya-38,"≈","middle",14,"muted",true));o.push(S.L(xg-6,y0-4,xg-6,ya,"line",1,"2 3"));o.push(S.L(xg+6,y0-4,xg+6,ya,"line",1,"2 3"));}
      o.push(S.T(x0+wd,ya+30,"停電の始まりからの時間","end",9.5,"muted"));
      box.set(S.svg(W,ya+36,o));
      var catTxt={a:"(a) 気づくより短い（"+F.time(T.det)+" より短い）",b:"(b) 気づいたが、電源が保てているうちに戻った（リセットされない）",c:"(c) 電源が保てなくなる長さ（"+F.time(T.col)+" 以上）で、リセットされた"}[cat];
      ro.innerHTML="停電 "+F.time(L)+" → <b>"+catTxt+"</b><br>"+
        (det!==null?"気づく: 停電から "+F.time(det)+" ・ 保てなくなる: "+F.time(T.col)+(cut?"（気づいた後 1 W に減らす）":"（5 W のまま）")+"<br>":"")+
        "ヒータ: <b>"+(heater?'<span class="ok">入れる</span>':'<span class="warn">入れない</span>')+"</b> — "+why+"<br>"+
        "ファン: "+(cat==="a"?"そのまま":cat==="b"?"戻す":(fanHeat?"ヒータがまだ熱いかもしれないので、30 秒回して余熱を逃がす":"回さない"))+" ・ 時計: "+(cat==="c"&&!rtc?'<span class="warn">時刻が失われた（表示で知らせる）</span>':"そのまま")+
        '<div class="wnote">3 節の例の機器（22 µF・5 W・V₂ = 70 V、50 Hz、AC 側の検出は H が 3 ms 続いたら）。停電は位相 60° で始まるとした。復電の後は、交流の検出の信号が 10 回（100 ms）続けて正しい間隔で来たら落ち着いたとみなす。リセットからの起動には 20 ms かかるとした。決め方は例で、製品の安全規格で確かめる。</div>';
    }
    draw();
  };

  /* ---- 6 節: ゼロクロス検出・入れる瞬間・位相制御 ---- */
  REG.w06_zc=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ZERO CROSS","ゼロクロス検出・入れる瞬間・位相制御");
    var r0=U.ctrls(el);
    var view=U.seg(r0,["ゼロクロス検出","入れる瞬間","位相制御"],0,draw);
    var rA=U.ctrls(el);
    var cVon=U.slider(rA,"V_on（LED が光り始める電圧）",{min:5,max:60,step:1,value:20,fmt:function(v){return v+" V";},onInput:draw});
    var cV=U.slider(rA,"コンセントの電圧",{min:85,max:110,step:1,value:100,fmt:function(v){return v+" V";},onInput:draw});
    var cF=U.select(rA,"周波数",["50 Hz","60 Hz"],0,draw);
    var rB=U.ctrls(el);
    var cLoad=U.select(rB,"負荷",["抵抗の負荷（ヒータ 1 kW・10 Ω）","整流して平滑する負荷（47 µF・5 Ω）"],0,draw);
    var cPh=U.slider(rB,"入れる瞬間（ゼロクロスからの角度）",{min:0,max:180,step:5,value:90,fmt:function(v){return v+"°";},onInput:draw});
    var rC=U.ctrls(el);
    var cA=U.slider(rC,"α（遅らせる角度）",{min:0,max:180,step:1,value:90,fmt:function(v){return v+"°";},onInput:draw});
    var cMode=U.select(rC,"遅らせる時間の決め方",["測った半周期に対する割合","50 Hz で計算した ms のまま"],0,draw);
    var cJ=U.slider(rC,"タイミングの揺れ",{min:0,max:500,step:10,value:100,fmt:function(v){return "± "+v+" µs";},onInput:draw});
    var box=U.svgbox(el); var ro=U.readout(el);
    function ratio(a){return 1-a/Math.PI+Math.sin(2*a)/(2*Math.PI);}
    function axesT(o,x0,y0,wd,h,t0,t1,lab){o.push(S.W([x0,y0,x0,y0+h,x0+wd,y0+h],"muted",1.1));U.nice(t0,t1,6).forEach(function(v){if(v>=t0-1e-9&&v<=t1+1e-9){var xx=x0+(v-t0)/(t1-t0)*wd;o.push(S.L(xx,y0+h,xx,y0+h+4,"muted",1));o.push(S.T(xx,y0+h+15,U.sig(v,3),"middle",9,"muted"));}});o.push(S.T(x0+wd,y0+h+29,lab,"end",9.5,"muted"));}
    function draw(){
      var v=view.get();rA.style.display=v===0?"":"none";rB.style.display=v===1?"":"none";rC.style.display=v===2?"":"none";
      if(v!==0)cF.el.style.display="";
      if(v===2){rA.style.display="";cVon.el.style.display="none";cV.el.style.display="none";}else{cVon.el.style.display="";cV.el.style.display="";}
      if(v===1){rA.style.display="";cVon.el.style.display="none";}
      var f=cF.get()?60:50,Vp=Math.SQRT2*cV.get(),w=2*Math.PI*f,wide=_w06_wide(box),W=wide?700:400,x0=wide?70:52,wd=W-x0-(wide?40:20),o=[];
      if(v===0){
        var Von=cVon.get(),te=Math.asin(Math.min(1,Von/Vp))/w,te0=Math.asin(20/141.42)/(2*Math.PI*50),span=3e-3;
        var y0=16,h=wide?150:130,X=function(t){return x0+(t+span)/(2*span)*wd;},Y=function(u){return y0+h/2-u/(Vp*Math.sin(w*span))*h/2;};
        o.push(S.RECT(x0,Y(Von),wd,Y(-Von)-Y(Von),0,U.soft("teal"),"none",0));
        o.push(S.L(x0,Y(0),x0+wd,Y(0),"muted",1));
        var pts=[];for(var k=0;k<=200;k++){var t=-span+k/200*2*span;pts.push([X(t),Y(Vp*Math.sin(w*t))]);}
        o.push(S.PL(pts,"gold",2));o.push(S.T(x0+wd-2,Y(Von)-4,"± V_on","end",9,"teal",true));
        o.push(S.T(x0+4,y0+12,"電圧（"+cV.get()+" V・"+f+" Hz、ゼロクロスの前後）","start",9.5,"gold",true,false,null,true));
        var yd=y0+h+14;
        o.push(S.PL([[x0,yd+16],[X(-te),yd+16],[X(-te),yd],[X(te),yd],[X(te),yd+16],[x0+wd,yd+16]],"teal",1.8));
        o.push(S.T(x0-6,yd+12,"信号","end",9,"teal",true));
        o.push(S.L(X(0),y0,X(0),yd+40,"green",1.3,"3 3"));
        var eEdge=te0-te;          /* 始まり + 決めた 0.45 ms をゼロクロスとしたときのずれ */
        o.push(S.D(X(-te+te0),yd+34,"alias",4));o.push(S.T(X(-te+te0)+(eEdge>0?-6:6),yd+38,"始まり + "+U.sig(te0*1e3,2)+" ms",eEdge>0?"end":"start",9,"alias",true,false,null,true));
        o.push(S.D(X(0),yd+52,"green",4));o.push(S.T(X(0)+6,yd+56,"中央","start",9,"green",true));
        axesT(o,x0,yd+64-14,wd,0,-span*1e3,span*1e3,"ゼロクロスからの時間 [ms]");
        box.set(S.svg(W,yd+64+20,o));
        var Wd=2*te,warn=Wd>3e-3?'<span class="warn">H の幅が 3 節の 3 ms を超え、停電と見分けられない。</span><br>':(Wd>2.1e-3?'<span class="warn">H の幅が 3 節の 3 ms に近く、余裕が少ない。</span><br>':"");
        ro.innerHTML=warn+"H の幅 W = arcsin(V_on/V_p)/(πf) = arcsin("+Von+"/"+Vp.toFixed(1)+")/(π × "+f+") = <b>"+F.time(Wd)+"</b><br>"+
          "H の始まりはゼロクロスの <b>"+F.time(te)+"</b> 前 ・ 始まりに決めた 0.45 ms（100 V・50 Hz・V_on 20 V のときの値）を足してゼロクロスとすると、ずれは <b>"+F.time(Math.abs(eEdge))+"</b> ・ 中央をとれば <b>0</b>"+
          '<div class="wnote">V_on は、LED を光らせる電流と抵抗で決まり、フォトカプラの光が弱くなると上がる。フォトカプラの応答の遅れは入れていない。</div>';
      }else if(v===1){
        var load=cLoad.get(),phi=cPh.get(),tsw=phi/360/f+1/f,T1=1/f+0.025;
        var ts=[],is=[],vs=[],dt=2e-6,vc=0,imax=0,didt=0,prev=0;
        for(var t=0;t<=T1;t+=dt){var vac=Vp*Math.sin(w*t),i=0;
          if(t>=tsw){if(load===0)i=vac/10;else{var d=Math.abs(vac)-1.8-vc;i=d>0?d/5:0;vc+=i/47e-6*dt;if(vac<0)i=-i;}}
          if(Math.abs(i)>imax)imax=Math.abs(i);
          if(t>tsw+dt){var dd=Math.abs(i-prev)/dt;if(dd>didt)didt=dd;}prev=i;
          if(Math.round(t/dt)%10===0){ts.push(t);is.push(i);vs.push(vac);}}
        var y0=16,h=wide?170:140,ym=load===0?Math.max(16,Vp/10*1.1):Math.max(5,imax*1.15),X=function(t){return x0+(t/T1)*wd;},Y=function(u){return y0+h/2-u/ym*h/2;};
        o.push(S.L(x0,Y(0),x0+wd,Y(0),"muted",1));o.push(S.W([x0,y0,x0,y0+h],"muted",1.1));
        [ym,ym/2,0,-ym/2,-ym].forEach(function(u){o.push(S.T(x0-6,Y(u)+3.5,U.sig(u,2),"end",9,"muted"));});
        o.push(S.T(x0-(wide?40:34),y0+h/2,"電流 [A]","middle",9.5,"muted",false,false,-90));
        o.push(S.PL(ts.map(function(t,k){return [X(t),Y(vs[k]/Vp*ym*0.9)];}),"muted",1,null,"3 3"));
        o.push(S.PL(ts.map(function(t,k){return [X(t),Y(is[k])];}),"purple",2));
        o.push(S.L(X(tsw),y0,X(tsw),y0+h,phi===0||phi===180?"green":"alias",1.2,"4 3"));
        o.push(S.T(X(tsw)+4,y0+12,"入れる（"+phi+"°）","start",9.5,phi===0||phi===180?"green":"alias",true,false,null,true));
        axesT(o,x0,y0,wd,h,0,T1*1e3,"時間 [ms]（破線は電圧の形）");
        box.set(S.svg(W,y0+h+36,o));
        ro.innerHTML="入れた瞬間の電圧 "+(Vp*Math.sin(phi*Math.PI/180)).toFixed(0)+" V ・ 電流の山 <b>"+U.sig(imax,3)+" A</b> ・ 電流の変化の最も速いところ <b>"+U.sig(didt/1e3,3)+" A/ms</b>"+
          (load===0?"（ゼロクロスで入れれば "+U.sig(Vp/10*w/1e3,2)+" A/ms）":"")+'<div class="wnote">'+(load===0?"抵抗の負荷: 電流 = 電圧 ÷ 10 Ω。山で入れると、電流は 0 から一瞬で跳ぶ（数値の刻み 2 µs の中で変わるので、A/ms の値は刻みで決まる大きな値になる）。":"整流して平滑する負荷: 空の 47 µF に、配線などの抵抗 5 Ω を通して流れ込む（ダイオード 2 個で 1.8 V）。")+"変圧器のような負荷は、逆に電圧が 0 の瞬間に入れると大きな電流が流れることがある（ここでは扱わない）。</div>";
      }else{
        var fixedMs=cMode.get()===1,al=cA.get()*Math.PI/180,delay=fixedMs?al/(2*Math.PI*50):al/w,aEff=Math.min(Math.PI,delay*w),jit=cJ.get()*1e-6;
        var aLo=Math.max(0,aEff-jit*w),aHi=Math.min(Math.PI,aEff+jit*w);
        var T2=2/f,y0=16,h=wide?130:110,X=function(t){return x0+(t/T2)*wd;},Y=function(u){return y0+h/2-u/150*h/2;};
        o.push(S.L(x0,Y(0),x0+wd,Y(0),"muted",1));
        var pts=[];for(var k=0;k<=300;k++){var t=k/300*T2;pts.push([X(t),Y(141.4*Math.sin(w*t))]);}
        o.push(S.PL(pts,"muted",1,null,"3 3"));
        for(var hc=0;hc<4;hc++){var st=hc/(2*f)+aEff/w,en=(hc+1)/(2*f);if(st>=en)continue;var ar=[[X(st),Y(0)]];for(var j=0;j<=30;j++){var tt=st+(en-st)*j/30;ar.push([X(tt),Y(141.4*Math.sin(w*tt))]);}ar.push([X(en),Y(0)]);
          o.push(S.PL(ar,"purple",1.6,"purple-soft"));o.push(S.L(X(st),y0+h+2,X(st),y0+h+10,"teal",2));}
        axesT(o,x0,y0,wd,h,0,T2*1e3,"時間 [ms]（縦の短い線: トライアックを入れる時刻）");
        /* 右下に電力の割合の曲線（狭いときは省く） */
        box.set(S.svg(W,y0+h+36,o));
        var pr=ratio(aEff),plo=ratio(aHi),phi2=ratio(aLo);
        ro.innerHTML=(fixedMs&&f===60?'<span class="warn">50 Hz で計算した '+F.time(delay)+' を 60 Hz で使ったので、α が '+(aEff*180/Math.PI).toFixed(0)+'° になった。</span><br>':"")+
          "遅らせる時間 <b>"+F.time(delay)+"</b>（α = "+(aEff*180/Math.PI).toFixed(0)+"°） ・ 電力の割合 1 − α/π + sin 2α/(2π) = <b>"+(pr*100).toFixed(1)+" %</b><br>"+
          "タイミングが ± "+cJ.get()+" µs 揺れると、電力は <b>"+(plo*100).toFixed(1)+"〜"+(phi2*100).toFixed(1)+" %</b> の間で揺れる"+
          '<div class="wnote">抵抗の負荷で、トライアックは入れた後、電流が 0 を通ると切れるとした。位相制御は半周期の途中で電流を急に流し始めるので、ノイズと高調波を出す。</div>';
      }
    }
    draw();
  };

  /* ---- 7 節: 待機電力の内訳 ---- */
  REG.w06_standby=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"STANDBY","待機電力の内訳と 1 年の電力量");
    var r1=U.ctrls(el);
    var cSup=U.select(r1,"電源",["絶縁電源（待機の機能なし、損失 60 mW）","絶縁電源（待機の機能あり、損失 30 mW）","コンデンサドロップ（いつも約 100 mW）"],0,draw);
    var cR=U.slider(r1,"交流の検出の抵抗",{min:47,max:470,value:94,log:true,fmt:function(v){return Math.round(v)+" kΩ";},onInput:draw});
    var cZc=U.checkbox(r1,"交流の検出を待機中も使う",true,draw);
    var r2=U.ctrls(el),ck={};
    [["disp","表示を点けたまま（300 mW）",true],["mcu","マイコンは眠らず動いたまま（47 mW）",true],["com","通信をつないだまま（80 mW。外すと間欠で 15 mW）",true],["relay","リレーを入れたまま（400 mW）",false]].forEach(function(a){ck[a[0]]=U.checkbox(r2,a[1],a[2],draw);});
    var br=U.btnrow(el);
    U.button(br,"7 節の対策の前",function(){cSup.set(0);cR.set(94);cZc.set(true);ck.disp.set(true);ck.mcu.set(true);ck.com.set(true);ck.relay.set(false);draw();});
    U.button(br,"7 節の対策の後",function(){cSup.set(1);cR.set(188);cZc.set(true);ck.disp.set(false);ck.mcu.set(false);ck.com.set(false);ck.relay.set(false);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var sup=cSup.get(),R=cR.get()*1e3,dropper=sup===2;
      var Pzc=cZc.get()?100*100/R*1e3:0,Von=0.2e-3*R+1.1,Wd=Math.asin(Math.min(1,Von/141.42))/(Math.PI*50);
      var loads=[["表示",ck.disp.get()?300:0,"purple"],["マイコン",ck.mcu.get()?47:0.1,"signal"],["通信",ck.com.get()?80:15,"green"],["リレー",ck.relay.get()?400:0,"alias"]];
      var Pload=0;loads.forEach(function(l){Pload+=l[1];});
      var items=[["電源自身の損失",dropper?100:(sup===0?60:30),"gold"],["交流の検出",Pzc,"teal"]].concat(dropper?[]:loads);
      var tot=0;items.forEach(function(i){tot+=i[1];});
      var wide=_w06_wide(box),W=wide?700:400,x0=10,wd=W-20-(wide?150:0),o=[],vmax=Math.max(1200,tot),y0=26;
      var x=x0;o.push(S.T(x0,16,"待機電力の内訳 [mW]","start",10.5,"ink",true));
      items.forEach(function(it){var w=wd*it[1]/vmax;if(w<0.3)return;o.push(S.RECT(x,y0,w,26,2,U.soft(it[2]),it[2],1.1));if(w>U.tw(U.sig(it[1],3),9)+6)o.push(S.T(x+w/2,y0+17,U.sig(it[1],3),"middle",9,it[2],true));x+=w;});
      if(wide){o.push(S.T(x+8,y0+12,U.sig(tot,3)+" mW","start",10.5,"ink",true));o.push(S.T(x+8,y0+26,"1 年に "+U.sig(tot*8.76e-3,3)+" kWh","start",9.5,"muted"));}
      var ly=y0+46,lx=x0;items.forEach(function(it){var t=it[0]+" "+U.sig(it[1],3);if(lx+U.tw(t,9.5)+24>W){lx=x0;ly+=16;}o.push(S.RECT(lx,ly-9,10,10,2,U.soft(it[2]),it[2],1));o.push(S.T(lx+14,ly,t,"start",9.5,"ink"));lx+=U.tw(t,9.5)+30;});
      box.set(S.svg(W,ly+10,o));
      var big=items.slice().sort(function(a,b){return b[1]-a[1];})[0];
      var warn="";
      if(dropper&&Pload>60)warn='<span class="warn">コンデンサドロップから取り出せる電力（例 60 mW）を、待機中の負荷 '+U.sig(Pload,3)+' mW が超える。</span><br>';
      if(cZc.get()&&Wd>2.1e-3)warn+='<span class="warn">交流の検出の H の幅 '+F.time(Wd)+' が、3 節の 3 ms に近い（停電と見分ける余裕が少ない）。</span><br>';
      ro.innerHTML=warn+"待機電力 <b>"+U.sig(tot,3)+" mW</b> ・ 1 年（8760 時間）に <b>"+U.sig(tot*8.76e-3,3)+" kWh</b> ・ いちばん大きいのは <b>"+big[0]+"</b>（"+U.sig(big[1]/tot*100,3)+" %）<br>"+
        "交流の検出: 抵抗の電力 ≈ 100² ÷ "+Math.round(R/1e3)+" kΩ = "+U.sig(100*100/R*1e3,3)+" mW ・ V_on ≈ "+U.sig(Von,3)+" V ・ H の幅 "+F.time(Wd)+"（100 V・50 Hz）"+
        (dropper?"<br>コンデンサドロップは、負荷が使わない電流をツェナーダイオードが熱にするので、待機中の負荷を減らしても入力の電力は変わらない（負荷はその中でまかなう）。":"")+
        '<div class="wnote">値はどれも例の値（代表値の幅の中の 1 つ）。マイコンと周辺の電力は、二次側の電力を、軽い負荷での電源の効率で割った入力の電力として書いた。LED を光らせ始める電流を 0.2 mA、LED の電圧を 1.1 V とした。</div>';
    }
    draw();
  };
