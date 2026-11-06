  /* ===== 02 章 衛星の信号 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w02_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w02_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた数 */
  function _w02_g(v,d){var s=_w02_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");
    var fr=p.length>1?p[1].replace(/(\d{3})(?=\d)/g,"$1 "):"";return (neg?"−":"")+i+(fr?"."+fr:"");}
  var _W02_C=299792458,_W02_TC=1/1.023e6;
  /* PRN 番号ごとの G2 の 2 つの段（IS-GPS-200 の表）と、最初の 10 チップの 8 進（同じ表） */
  var _W02_TAPS=[null,[2,6],[3,7],[4,8],[5,9],[1,9],[2,10],[1,8],[2,9],[3,10],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[9,10],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[1,3],[4,6],[5,7],[6,8],[7,9],[8,10],[1,6],[2,7],[3,8],[4,9]];
  var _W02_OCT=[null,"1440","1620","1710","1744","1133","1455","1131","1454","1626","1504","1642","1750","1764","1772","1775","1776","1156","1467","1633","1715","1746","1763","1063","1706","1743","1761","1770","1774","1127","1453","1625","1712"];
  /* C/A 符号（0/1 の配列、長さ 1023）。G1・G2 を全部 1 から始め、出力 = G1[10] xor G2[a] xor G2[b] */
  var _W02_CODES={};
  function _w02_ca(prn){if(_W02_CODES[prn])return _W02_CODES[prn];var g1=[1,1,1,1,1,1,1,1,1,1],g2=[1,1,1,1,1,1,1,1,1,1],t=_W02_TAPS[prn],o=new Int8Array(1023);
    for(var n=0;n<1023;n++){o[n]=g1[9]^g2[t[0]-1]^g2[t[1]-1];var f1=g1[2]^g1[9],f2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];g1.unshift(f1);g1.pop();g2.unshift(f2);g2.pop();}
    _W02_CODES[prn]=o;return o;}
  /* 0 → +1、1 → −1 */
  function _w02_pm(prn){var c=_w02_ca(prn),o=new Float64Array(1023);for(var i=0;i<1023;i++)o[i]=1-2*c[i];return o;}
  /* ±1 の階段の波形（画面の座標。x0 から 1 つの値を cw ずつ、+1 が上） */
  function _w02_wave(S,x0,ym,amp,vals,cw,c,lw){var p=[],prev=null;for(var i=0;i<vals.length;i++){var v=vals[i],x=x0+i*cw;if(prev!==null&&prev!==v)p.push([x,ym-amp*prev]);p.push([x,ym-amp*v]);prev=v;}
    p.push([x0+vals.length*cw,ym-amp*prev]);return S.PL(p,c,lw||1.6);}
  function _w02_xor(S,x,y,c,r){r=r||8;return S.CIRC(x,y,r,c,1.4,"screen")+S.L(x-r,y,x+r,y,c,1.2)+S.L(x,y-r,x,y+r,c,1.2);}

  /* ---- 2 節: G1・G2 のシフトレジスタを 1 クロックずつ動かす ---- */
  REG.w02_gold=function(el,U){
    var S=U.S;
    U.head(el,"GOLD CODE","C/A 符号を作る — G1・G2 のシフトレジスタを 1 クロックずつ進める");
    var r1=U.ctrls(el),prns=[];for(var p=1;p<=32;p++)prns.push("PRN "+p+"（G2 の "+_W02_TAPS[p][0]+"・"+_W02_TAPS[p][1]+" 段目）");
    var sel=U.select(r1,"衛星の番号（PRN 番号）",prns,0,function(){reset();draw();});
    var br=U.btnrow(el);
    U.button(br,"1 クロック進める",function(){step(1);draw();});
    U.button(br,"10 クロック進める",function(){step(10);draw();});
    U.button(br,"1 周期（1023 クロック）進める",function(){step(1023);draw();});
    U.button(br,"はじめに戻す",function(){reset();draw();});
    U.button(br,"本文の例（PRN 1）",function(){sel.set(0);reset();step(10);draw();});
    var box=U.svgbox(el),ro=U.readout(el),g1,g2,out,n,last;
    /* G2 の 2 つの段の排他的論理和が、G2 の出力（10 段目）を何チップ遅らせた列か（全部のずれを調べる） */
    var DL={};
    function delayOf(prn){if(DL[prn]!=null)return DL[prn];var a=[1,1,1,1,1,1,1,1,1,1],t=_W02_TAPS[prn],ps=new Int8Array(1023),g10=new Int8Array(1023);
      for(var i=0;i<1023;i++){ps[i]=a[t[0]-1]^a[t[1]-1];g10[i]=a[9];var f=a[1]^a[2]^a[5]^a[7]^a[8]^a[9];a.unshift(f);a.pop();}
      for(var d=0;d<1023;d++){var ok=true;for(var j=0;j<1023&&ok;j++)if(ps[j]!==g10[(j-d+1023)%1023])ok=false;if(ok){DL[prn]=d;return d;}}DL[prn]=-1;return -1;}
    function prn(){return sel.get()+1;}
    function reset(){g1=[1,1,1,1,1,1,1,1,1,1];g2=[1,1,1,1,1,1,1,1,1,1];out=[];n=0;last=null;}
    function step(k){var t=_W02_TAPS[prn()];for(var i=0;i<k;i++){var o1=g1[9],ps=g2[t[0]-1]^g2[t[1]-1],ch=o1^ps,f1=g1[2]^g1[9],f2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];
      last={g1:g1.slice(),g2:g2.slice(),o1:o1,ps:ps,ch:ch,f1:f1,f2:f2};out.push(ch);g1.unshift(f1);g1.pop();g2.unshift(f2);g2.pop();n++;}}
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],t=_W02_TAPS[prn()],cw=nar?24:30,x0=nar?58:150,yA=44,yB=nar?158:150;
      var cx=function(j){return x0+(j-0.5)*cw;};
      o.push(S.T(nar?8:14,16,"クロック n = "+n+"（次に出すのは "+n+" 番目のチップ）","start",11,"ink",true));
      function reg(y,vals,taps,c,nm){
        for(var j=0;j<10;j++){var on=taps.indexOf(j+1)>=0;o.push(S.RECT(x0+j*cw,y,cw,24,2,on?U.soft(c):"panel",on?c:"line",on?1.6:1.1));
          o.push(S.T(x0+j*cw+cw/2,y+17,String(vals[j]),"middle",12,"ink",true,true));o.push(S.T(x0+j*cw+cw/2,y-4,String(j+1),"middle",9,"muted"));}
        o.push(S.T(x0-(nar?44:110),y+17,nm,"start",12,c,true));}
      /* G1 */
      reg(yA,g1,[3,10],"signal","G1");
      var fb1=g1[2]^g1[9];
      [3,10].forEach(function(j){o.push(S.L(cx(j),yA+24,cx(j),yA+40,"signal",1.4));o.push(S.D(cx(j),yA+40,"signal",2.6));});
      o.push(S.L(cx(10),yA+40,x0-22,yA+40,"signal",1.4));o.push(_w02_xor(S,x0-14,yA+40,"signal"));o.push(S.L(x0-14,yA+32,x0-14,yA+12,"signal",1.4));o.push(S.ARR(x0-14,yA+12,x0,yA+12,"signal",1.4,6));
      o.push(S.T(cx(6),yA+53,"帰還: "+g1[2]+" ⊕ "+g1[9]+" = "+fb1+"（次に 1 段目へ）","middle",9.5,"signal",false,false,null,true));
      /* G2 */
      reg(yB,g2,[2,3,6,8,9,10],"green","G2");
      var fb2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];
      [2,3,6,8,9,10].forEach(function(j){o.push(S.L(cx(j),yB+24,cx(j),yB+40,"green",1.4));o.push(S.D(cx(j),yB+40,"green",2.6));});
      o.push(S.L(cx(10),yB+40,x0-22,yB+40,"green",1.4));o.push(_w02_xor(S,x0-14,yB+40,"green"));o.push(S.L(x0-14,yB+32,x0-14,yB+12,"green",1.4));o.push(S.ARR(x0-14,yB+12,x0,yB+12,"green",1.4,6));
      o.push(S.T(cx(6),yB+53,"帰還: "+[g2[1],g2[2],g2[5],g2[7],g2[8],g2[9]].join(" ⊕ ")+" = "+fb2,"middle",9.5,"green",false,false,null,true));
      /* 位相を選ぶ 2 つの段 */
      var ys=yB-22,ps=g2[t[0]-1]^g2[t[1]-1],xs=x0+10*cw+(nar?30:50),xf=xs+(nar?40:60),yf=(yA+12+ys)/2;
      t.forEach(function(j){o.push(S.L(cx(j),yB,cx(j),ys,"gold",1.6));o.push(S.D(cx(j),ys,"gold",2.8));o.push(S.RECT(x0+(j-1)*cw,yB,cw,24,2,"none","gold",2.2));});
      o.push(S.L(cx(Math.min(t[0],t[1])),ys,xs-8,ys,"gold",1.6));o.push(_w02_xor(S,xs,ys,"gold"));
      o.push(S.T(cx((t[0]+t[1])/2),ys-6,"PRN "+prn()+" の段 "+t[0]+"・"+t[1]+": "+g2[t[0]-1]+" ⊕ "+g2[t[1]-1]+" = "+ps,"middle",9.5,"gold",true,false,null,true));
      o.push(S.L(x0+10*cw,yA+12,xf,yA+12,"signal",1.6));o.push(S.ARR(xf,yA+12,xf,yf-8,"signal",1.6,6));
      o.push(S.L(xs+8,ys,xf,ys,"gold",1.6));o.push(S.ARR(xf,ys,xf,yf+8,"gold",1.6,6));
      var ch=g1[9]^ps;
      o.push(_w02_xor(S,xf,yf,"ink"));
      if(!nar){o.push(S.ARR(xf+8,yf,xf+36,yf,"ink",1.8));o.push(S.CIRC(xf+52,yf,14,"ink",1.8,ch?"var(--muted-soft)":U.soft("signal")));o.push(S.T(xf+52,yf+5,String(ch),"middle",13,"ink",true,true));
        o.push(S.T(xf+52,yf+30,"出すチップ","middle",9.5,"ink",true));o.push(S.T(xf+52,yf+43,ch?"（−1）":"（+1）","middle",9.5,"muted"));}
      else{o.push(S.T(xf,yf+26,"→ "+ch,"middle",12,"ink",true,true));}
      /* 出したチップの列 */
      var yo=yB+80,show=nar?28:44,st=Math.max(0,out.length-show),seg=out.slice(st),cw2=(Wd-(nar?52:80)-12)/show,xo=nar?52:80;
      o.push(S.T(nar?8:14,yo,"出したチップ（最後の "+show+" 個まで。0 → +1、1 → −1）","start",10.5,"ink",true));
      o.push(S.RECT(xo,yo+10,show*cw2,44,3,"screen","line",0.8));
      if(seg.length){o.push(_w02_wave(S,xo,yo+38,11,seg.map(function(b){return 1-2*b;}),cw2,"signal",1.8));
        seg.forEach(function(b,i){if(cw2>=8)o.push(S.T(xo+(i+0.5)*cw2,yo+22,String(b),"middle",8.5,(st+i)<10?"signal":"muted",(st+i)<10,true));});
        o.push(S.T(xo-4,yo+42,st>0?String(st):"0","end",9,"muted"));o.push(S.T(xo+seg.length*cw2,yo+66,String(out.length-1),"middle",9,"muted"));}
      var oct=out.length>=10?(parseInt(out.slice(0,10).join(""),2).toString(8)):"",mt=oct===_W02_OCT[prn()];
      var ones=0;out.forEach(function(b){ones+=b;});
      var back=n>0&&g1.join("")==="1111111111"&&g2.join("")==="1111111111";
      var hy=yo+86;
      o.push(S.T(nar?8:14,hy,"最初の 10 チップ: "+(out.length>=10?out.slice(0,10).join("")+" → 8 進 "+oct:"（10 クロック進めると表示）"),"start",10.5,out.length>=10?(mt?"green":"alias"):"muted",true));
      if(out.length>=10)o.push(S.T(nar?8:14,hy+17,"規格の表の値 "+_W02_OCT[prn()]+(mt?"（一致）":"（不一致）"),"start",10,mt?"green":"alias",true));
      box.set(S.svg(Wd,hy+28,o));
      var d=delayOf(prn()),h="";
      h+="クロック n = <b>"+n+"</b>。出したチップ "+out.length+" 個のうち 1 が "+ones+" 個、0 が "+(out.length-ones)+" 個"+(out.length===1023?"（1 周期分。1 が 512、0 が 511）":"")+"<br>";
      if(last)h+="直前のクロック: 出力 = G1 の 10 段目 "+last.o1+" ⊕ （G2 の "+t[0]+"・"+t[1]+" 段目の排他的論理和 "+last.ps+"） = <b>"+last.ch+"</b>（"+(last.ch?"−1":"+1")+"）。帰還 G1 → "+last.f1+"、G2 → "+last.f2+" を 1 段目に入れた<br>";
      if(back)h+='<span class="ok">G1・G2 の全部の段が初めの 1 に戻った</span>（'+n+" クロック。C/A 符号は 1023 チップごとに繰り返す）<br>";
      h+="G2 の "+t[0]+"・"+t[1]+" 段目の排他的論理和の列は、G2 の 10 段目の出力を <b>"+d+" チップ</b>遅らせた列に等しい（全部のずれを調べて求めた値。規格の表の「G2 の遅れ」）";
      ro.innerHTML=h+'<div class="wnote">⊕ は排他的論理和（同じなら 0、違えば 1）。各クロックで、まず今の段の値から出力のチップと帰還の値を計算し、全体を 1 段ずつ右へ送って、帰還の値を 1 段目に入れる。8 進は、最初の 10 チップを左から 1 桁と 3 桁ずつに区切って読む。</div>';
    }
    reset();draw();
  };

  /* ---- 3 節: 相関 — 手元の符号をずらしながら、掛けて足す ---- */
  var _W02_DLY=[0,120.25,487.60,801.90];
  REG.w02_corr=function(el,U){
    var S=U.S,K=8,NS=1023*K;
    U.head(el,"CORRELATION","相関 — 手元の符号をずらしながら、受けた信号と掛けて足す");
    var r1=U.ctrls(el);
    var sig=U.select(r1,"受けた信号",["PRN 1 の 1 機だけ","PRN 1・2・3 の 3 機（本文の図）"],1,function(){gen();});
    var loc=U.select(r1,"手元で作る符号",["PRN 1","PRN 2","PRN 3","PRN 4（受けた信号に無い）"],0,function(){corr();draw();});
    var r2=U.ctrls(el);
    var amp=U.slider(r2,"PRN 2・3 の強さ（PRN 1 の振幅に対する倍率）",{values:[1,3,10,20],value:1,fmt:function(v){return v+" 倍";},onInput:function(){gen();}});
    var sg=U.slider(r2,"雑音の大きさ σ（1 チップの平均の標準偏差）",{values:[0,1,2,4,8,16,32],value:0,fmt:function(v){return String(v);},onInput:function(){gen();}});
    var mm=U.slider(r2,"足す周期の数（1 周期 = 1 ms）",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" 周期（"+v+" ms）";},onInput:function(){gen();}});
    var r3=U.ctrls(el);
    var tau=U.slider(r3,"手元の符号のずれ τ",{min:0,max:1022.875,step:0.125,value:120.25,fmt:function(v){return _w02_f(v,3)+" チップ（"+_w02_f(v*_W02_TC*1e6,3)+" μs）";},onInput:function(){scanTo=-1;draw();}});
    tau.el.style.flex="1 1 100%";
    var br=U.btnrow(el),seed=1,scanTo=-1;
    var tick=U.ticker(function(){scanTo+=6;if(scanTo>=1023){scanTo=-1;tick.stop();}tau.set(Math.min(1022.875,Math.max(0,scanTo<0?1022.875:scanTo)));draw();},40);
    U.button(br,"本文の例（3 機・雑音なし）",function(){tick.stop();scanTo=-1;sig.set(1);loc.set(0);amp.set(1);sg.set(0);mm.set(1);tau.set(120.25);seed=1;gen();});
    U.button(br,"走査（ずれを 0 から動かす）",function(){scanTo=0;tau.set(0);tick.start();draw();});
    U.button(br,"止める",function(){tick.stop();scanTo=-1;draw();});
    U.button(br,"いちばん高い山へ",function(){tick.stop();scanTo=-1;tau.set(peak().t);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();});
    var box=U.svgbox(el),ro=U.readout(el);
    var rbar=new Float64Array(NS),one=new Float64Array(NS),P=new Float64Array(2*NS+1),C=new Float64Array(NS);
    /* 受けた信号: 衛星ごとの符号を遅らせて足し、1 標本ごとに雑音を足す（M 周期の平均） */
    function gen(){
      var nsat=sig.get()?3:1,A=[0,1,amp.get(),amp.get()],cs=[null,_w02_pm(1),_w02_pm(2),_w02_pm(3)],s,i;
      for(s=0;s<NS;s++){var v=0,t=(s+0.5)/K;for(i=1;i<=nsat;i++){var k=Math.floor(t-_W02_DLY[i]);v+=A[i]*cs[i][((k%1023)+1023)%1023];}one[s]=v;rbar[s]=v;}
      var sd=sg.get(),M=mm.get();
      if(sd>0){var g=U.rng(seed*7919+13),sc=sd*Math.sqrt(K);for(var m=0;m<M;m++)for(s=0;s<NS;s++)rbar[s]+=sc*g.normal()/M;}
      corr();draw();}
    /* 全部のずれ（1/8 チップごと）の相関。R(j) = (1/K) Σ_n c[n] (P[Kn+j+K] − P[Kn+j])（P は 2 周期分の和の表） */
    function corr(){var c=_w02_pm(loc.get()+1),s,j,n;P[0]=0;for(s=0;s<2*NS;s++)P[s+1]=P[s]+rbar[s%NS];
      for(j=0;j<NS;j++){var a=0;for(n=0;n<1023;n++){var b=K*n+j;a+=c[n]*(P[b+K]-P[b]);}C[j]=a/K;}}
    function peak(){var bi=0;for(var j=1;j<NS;j++)if(C[j]>C[bi])bi=j;return {t:bi/K,v:C[bi]};}
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],xo=nar?44:70,pw=Wd-xo-(nar?10:16),t0=tau.get(),jt=Math.round(t0*K)%NS,lp=loc.get()+1,c=_w02_pm(lp);
      /* 上: 時間の見方（手元の符号の最初の 24 チップの所） */
      var nwin=nar?16:24,cwp=pw/nwin,ya=34;
      o.push(S.T(nar?6:14,16,"時間の見方: 手元の符号の 0〜"+(nwin-1)+" 番のチップの所（τ から "+nwin+" チップ分）","start",10.5,"ink",true));
      var lo=-1,hi=1;for(var s=0;s<nwin*K;s++){var v=rbar[(jt+s)%NS];lo=Math.min(lo,v);hi=Math.max(hi,v);}
      var sc=Math.max(Math.abs(lo),Math.abs(hi));
      var Pa=U.plot(xo,ya,pw,60,[0,nwin],[-sc*1.05,sc*1.05]);
      o.push(S.RECT(xo,ya,pw,60,3,"screen","line",0.8));o.push(S.L(xo,Pa.Y(0),xo+pw,Pa.Y(0),"grid",1));
      var pts=[];for(s=0;s<nwin*K;s++){var tt=s/K;pts.push([tt,rbar[(jt+s)%NS]]);pts.push([tt+1/K,rbar[(jt+s)%NS]]);}
      o.push(Pa.line(pts,"teal",1.1));
      o.push(S.T(xo-4,ya+12,"受けた","end",9,"teal",true));o.push(S.T(xo-4,ya+24,"信号","end",9,"teal",true));
      var yl=ya+76;o.push(S.T(xo-4,yl+4,"手元","end",9,"signal",true));
      var lv=[];for(var q=0;q<nwin;q++)lv.push(c[q]);o.push(_w02_wave(S,xo,yl,8,lv,cwp,"signal",1.6));
      var yp=yl+24,pr=[];for(q=0;q<nwin;q++){var sm=0;for(s=0;s<K;s++)sm+=rbar[(jt+q*K+s)%NS];pr.push(sm/K*c[q]);}
      var pm=0;pr.forEach(function(v){pm=Math.max(pm,Math.abs(v));});pm=Math.max(pm,1);
      o.push(S.T(xo-4,yp+10,"積","end",9,"ink",true));o.push(S.L(xo,yp+10,xo+pw,yp+10,"grid",1));
      pr.forEach(function(v,i){var hh=12*v/pm;o.push(S.RECT(xo+i*cwp+cwp*0.15,v>=0?yp+10-hh:yp+10,cwp*0.7,Math.abs(hh),1,v>=0?"green":"alias","none",0));});
      /* 中: 相関の曲線（1 ピクセルごとに最小と最大を結ぶ） */
      var yc=yp+44,ch=nar?110:130,mx=-1e9,mn=1e9,j;for(j=0;j<NS;j++){mx=Math.max(mx,C[j]);mn=Math.min(mn,C[j]);}
      var top=Math.max(1150,mx*1.08),bot=Math.min(-200,mn*1.1);
      var Pc=U.plot(xo,yc,pw,ch,[0,1023],[bot,top]);
      o.push(S.T(nar?6:14,yc-8,"相関の見方: 全部のずれ τ の相関 R(τ)"+(scanTo>=0?"（走査中）":""),"start",10.5,"ink",true));
      o.push(Pc.axes({xt:[0,256,512,768,1023],yt:U.nice(bot,top,4).filter(function(v){return v>=bot&&v<=top;}),xfmt:function(v){return String(v);},yfmt:function(v){return String(Math.round(v)).replace("-","−");},ylOff:nar?34:44}));
      var lim=scanTo>=0?Math.round(scanTo*K):NS,d="";
      for(var px=0;px<Math.round(pw);px++){var j0=Math.floor(px/pw*NS),j1=Math.min(NS,Math.floor((px+1)/pw*NS));if(j0>=lim)break;var a=1e9,b=-1e9;for(j=j0;j<Math.min(j1,lim);j++){a=Math.min(a,C[j]);b=Math.max(b,C[j]);}
        if(b>=a)d+="M"+(xo+px+0.5).toFixed(1)+","+Pc.Y(b).toFixed(1)+"V"+(Pc.Y(a)+0.6).toFixed(1);}
      o.push(S.PATH(d,"signal",1.1));
      o.push(S.L(Pc.X(t0),yc,Pc.X(t0),yc+ch,"ink",1.2,"3 3"));o.push(S.D(Pc.X(t0),Pc.Y(C[jt]),"gold",4.5));
      var pk=peak();if(scanTo<0){o.push(S.T(Pc.X(pk.t)+(pk.t>900?-6:6),Pc.Y(pk.v)+4,"山 "+_w02_f(pk.t,3),pk.t>900?"end":"start",9.5,"signal",true,false,null,true));}
      o.push(S.T(xo+pw/2,yc+ch+30,"手元の符号のずれ τ [チップ]（1023 チップ = 1 ms）","middle",10,"muted"));
      /* 下: τ のまわりを拡大 */
      var yz=yc+ch+52,zh=nar?90:100,Z=U.plot(xo,yz,pw,zh,[t0-4,t0+4],[bot,top]);
      o.push(S.T(nar?6:14,yz-8,"τ のまわり ±4 チップを拡大（1 チップ = 293 m）","start",10.5,"ink",true));
      o.push(Z.axes({xt:[-4,-2,0,2,4].map(function(v){return t0+v;}),yt:U.nice(bot,top,3).filter(function(v){return v>=bot&&v<=top;}),xfmt:function(v){return _w02_f(v,2);},yfmt:function(v){return String(Math.round(v)).replace("-","−");},ylOff:nar?34:44}));
      var zp=[];for(var m=-32;m<=32;m++){var jj=((jt+m)%NS+NS)%NS;zp.push([t0+m/K,C[jj]]);}
      o.push(Z.line(zp,"signal",2));o.push(S.D(Z.X(t0),Z.Y(C[jt]),"gold",4.5));
      o.push(S.T(xo+pw/2,yz+zh+30,"手元の符号のずれ τ [チップ]","middle",10,"muted"));
      box.set(S.svg(Wd,yz+zh+40,o));
      /* 読み出し */
      var nsat=sig.get()?3:1,inSig=lp<=nsat,M=mm.get(),sd=sg.get(),ns=sd*Math.sqrt(1023/M),h="";
      h+="手元の符号 PRN "+lp+"、ずれ τ = "+_w02_f(t0,3)+" チップ: 相関 R(τ) = <b>"+_w02_f(C[jt],1)+"</b>"+(scanTo>=0?"":"")+"<br>";
      h+="いちばん高い山: τ = <b>"+_w02_f(pk.t,3)+" チップ</b>（R = "+_w02_f(pk.v,1)+"）→ 届いた時間の 1 ms に満たない端数 "+_w02_f(pk.t*_W02_TC*1e6,3)+" μs、距離にして "+_w02_g(pk.t*_W02_TC*_W02_C/1e3,3)+" km（1 ms = 299.79 km ごとに同じ）<br>";
      if(inSig){var e=pk.t-_W02_DLY[lp];if(Math.abs(e)<1)h+='<span class="ok">本当の遅れ '+_w02_f(_W02_DLY[lp],2)+" チップの所に山がある</span>（読みとの差 "+_w02_f(e,3)+" チップ = "+_w02_f(e*_W02_TC*_W02_C,1)+" m。1/8 チップごとに計算した）<br>";
        else h+='<span class="warn">いちばん高い山が、本当の遅れ '+_w02_f(_W02_DLY[lp],2)+" チップの所に無い</span>（雑音、または強いほかの衛星の相互相関のため）<br>";}
      else h+="受けた信号に PRN "+lp+" の符号は無いので、どのずれでも相互相関の値（と雑音）しか出ない<br>";
      if(sd>0)h+="雑音による相関の揺れ（標準偏差）σ√(1023/M) = "+sd+" × √(1023/"+M+") = <b>"+_w02_f(ns,1)+"</b>。山の高さ 1023 の "+_w02_f(1023/ns,1)+" 倍"+(1023/ns<4?'（<span class="warn">山が雑音に埋もれやすい</span>）':"")+"<br>";
      if(nsat===3&&amp.get()>1)h+="PRN 2・3 は PRN 1 の "+amp.get()+" 倍の振幅で、その相互相関は最大 65 × "+amp.get()+" = "+(65*amp.get())+"（PRN 1 の山は 1023）<br>";
      ro.innerHTML=h+'<div class="wnote">受けた信号は、衛星ごとの C/A 符号（振幅 1。PRN 2・3 は倍率を掛ける）を、本文の図と同じ 120.25・487.60・801.90 チップだけ遅らせて足し、1 チップを 8 標本にして、標本ごとに雑音を足したもの（σ は 1 チップの 8 標本の平均の標準偏差）。足す周期の数 M は、同じ信号の M 周期分を平均してから相関をとる。搬送波とドップラーは取り除いてあるとした（4・5 章）。相関は、山の高さが 1023 になるように 8 で割った。</div>';
    }
    gen();
  };
