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
    reset();step(10);draw();
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

  /* ---- 4 節: BPSK と BOC — 1 チップの形・スペクトラム・相関 ---- */
  /* その場で計算する FFT（基数 2。re と im を書き換える） */
  function _w02_fft(re,im){var n=re.length,i,j=0,k,len;for(i=1;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){var t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
    for(len=2;len<=n;len<<=1){var ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang),h=len>>1;for(i=0;i<n;i+=len){var cr=1,ci=0;for(k=0;k<h;k++){var a=i+k,b=a+h,br=re[b]*cr-im[b]*ci,bi=re[b]*ci+im[b]*cr;re[b]=re[a]-br;im[b]=im[a]-bi;re[a]+=br;im[a]+=bi;var t2=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t2;}}}}
  /* 1 チップの形の周波数の成分の大きさの 2 乗 |P(f)|²（f は MHz、Tc は μs。k は 1 チップの中の副搬送波の半周期の数、0 なら BPSK） */
  function _w02_P2(f,Tc,k){function sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
    if(k===0){var s=sinc(f*Tc);return Tc*Tc*s*s;}
    var th=2*Math.PI*f*Tc/k,re=0,im=0;for(var j=0;j<k;j++){var sg=j%2?-1:1;re+=sg*Math.cos(th*(j+0.5));im-=sg*Math.sin(th*(j+0.5));}
    var s2=sinc(f*Tc/k);return (Tc/k)*(Tc/k)*s2*s2*(re*re+im*im);}
  REG.w02_spectrum=function(el,U){
    var S=U.S,TCA=1/1.023;
    U.head(el,"SPECTRUM","BPSK と BOC — 1 チップの形と、スペクトラム・相関の形");
    var PRE=[{t:"BPSK(1)（GPS L1 の C/A 符号）",n:1,m:0},{t:"BPSK(10)（GPS L5）",n:10,m:0},{t:"BOC(1,1)（L1C・Galileo E1 の主な形）",n:1,m:1},{t:"BOC(6,1)",n:1,m:6},{t:"自分で選ぶ（下のつまみ）",n:null,m:null}];
    var r1=U.ctrls(el);
    var md=U.select(r1,"変調の形",PRE.map(function(p){return p.t;}),2,function(){var p=PRE[md.get()];if(p.n!=null){nr.set(p.n);sc.set(p.m);}draw();});
    var r2=U.ctrls(el);
    var nr=U.slider(r2,"チップレート（1.023 M チップ/s の何倍か）",{values:[0.5,1,2,5,10],value:1,fmt:function(v){return v+" 倍（"+_w02_f(v*1.023,4).replace(/0+$/,"").replace(/\.$/,"")+" M チップ/s）";},onInput:function(){md.set(4);draw();}});
    var sc=U.slider(r2,"副搬送波の周波数（1.023 MHz の何倍か。0 は BPSK）",{values:[0,0.5,1,1.5,2,2.5,3,5,6,10,15],value:1,fmt:function(v){return v?v+" 倍":"0（BPSK）";},onInput:function(){md.set(4);draw();}});
    var r3=U.ctrls(el);
    var bw=U.slider(r3,"受信機が受ける周波数の幅（中心のまわり）",{values:[1,2,4,8,16,24,40],value:4,fmt:function(v){return v+" MHz（±"+(v/2)+" MHz）";},onInput:function(){draw();}});
    var r4=U.ctrls(el);
    var ov=U.checkbox(r4,"C/A 符号（BPSK(1)）を重ねる",true,function(){draw();});
    var lg=U.checkbox(r4,"縦を対数の目盛にする",false,function(){draw();});
    var ff=U.checkbox(r4,"でたらめな符号を FFT したスペクトラムを重ねる",false,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（BOC(1,1) と C/A）",function(){md.set(2);nr.set(1);sc.set(1);bw.set(4);ov.set(true);lg.set(false);ff.set(false);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function cfg(){var n=nr.get(),m=sc.get(),k=m>0?Math.max(1,Math.round(2*m/n)):0;return {n:n,k:k,m:k?k*n/2:0,Tc:TCA/n};}
    function S_rel(f,c){return _w02_P2(f,c.Tc,c.k)/(c.Tc*TCA);}   /* C/A の中心を 1 とした比 */
    function inband(c,B){var N=4000,s=0,h=B/N;for(var i=0;i<=N;i++){var f=-B/2+i*h,w=(i===0||i===N)?0.5:1;s+=w*_w02_P2(f,c.Tc,c.k)/c.Tc*h;}return s;}
    function w90(c){var lo=0,hi=200;for(var it=0;it<40;it++){var mid=(lo+hi)/2;if(inband(c,2*mid)<0.9)lo=mid;else hi=mid;}return hi;}
    function acf(c){var N=240,p=[],i;for(i=0;i<N;i++){var j=c.k?Math.floor(i*c.k/N):0;p.push(c.k?(j%2?-1:1):1);}
      var out=[];for(var l=-N;l<=N;l++){var s=0;for(i=0;i<N;i++){var q=i-l;if(q>=0&&q<N)s+=p[i]*p[q];}out.push([l/N*c.Tc,s/N]);}return out;}
    function fftpsd(c){var Q=c.k?c.k*Math.ceil(Math.max(8,4*c.k)/c.k):8,L=4096,nseg=24,fs=Q/c.Tc,g=U.rng(seed*104729+7),acc=new Float64Array(L);
      for(var sg=0;sg<nseg;sg++){var re=new Float64Array(L),im=new Float64Array(L),v=0,i;for(i=0;i<L;i++){if(i%Q===0)v=g.next()<0.5?1:-1;var j=c.k?Math.floor((i%Q)*c.k/Q):0;re[i]=v*(c.k?(j%2?-1:1):1);}
        _w02_fft(re,im);for(i=0;i<L;i++)acc[i]+=(re[i]*re[i]+im[i]*im[i])/(L*fs)/nseg;}
      var pts=[];for(var i2=0;i2<L;i2++){var f=(i2<L/2?i2:i2-L)*fs/L,a=0,cnt=0;for(var d=-3;d<=3;d++){var q=(i2+d+L)%L;a+=acc[q];cnt++;}pts.push([f,a/cnt/TCA]);}
      pts.sort(function(a,b){return a[0]-b[0];});return pts;}
    function draw(){
      var c=cfg(),ca={n:1,k:0,m:0,Tc:TCA},B=bw.get(),nar=_w02_nar(box),Wd=nar?400:700,o=[],xo=nar?50:66,pw=Wd-xo-(nar?12:20);
      var name=c.k?"BOC("+(+c.m.toFixed(2))+","+c.n+")":"BPSK("+c.n+")";
      /* (a) 時間の見方: 6 チップの波形 */
      var g=U.rng(seed*31+5),vals=[];for(var i=0;i<6;i++)vals.push(g.next()<0.5?1:-1);
      vals[0]=1;
      o.push(S.T(nar?6:14,16,"(a) 時間の見方: "+name+" の 6 チップ（1 チップ "+_w02_f(c.Tc*1000,1)+" ns）","start",10.5,"ink",true));
      var cw=pw/6,ya=50,seq=[];vals.forEach(function(v){if(!c.k)seq.push(v);else for(var j=0;j<c.k;j++)seq.push(v*(j%2?-1:1));});
      for(i=0;i<=6;i++)o.push(S.L(xo+i*cw,ya-22,xo+i*cw,ya+22,"line",0.8,"2 3"));
      o.push(S.L(xo,ya,xo+pw,ya,"grid",1));
      o.push(_w02_wave(S,xo,ya,16,seq,cw/(c.k||1),"green",1.8));
      o.push(S.T(xo-6,ya-12,"+1","end",9,"muted"));o.push(S.T(xo-6,ya+20,"−1","end",9,"muted"));
      /* (b) 周波数の見方: スペクトラム */
      var F=Math.max(3,(c.m+3*c.n)*1.023,B/2*1.15);F=U.nice(0,F,4).filter(function(v){return v>=F;})[0]||F;
      var yb=ya+60,bh=nar?150:170,lgy=lg.get();
      var peakv=0,fs=[];for(i=0;i<=800;i++){var f=-F+2*F*i/800;fs.push(f);peakv=Math.max(peakv,S_rel(f,c));}
      var ytop=lgy?3:Math.max(1.1,peakv*1.12);
      var P=U.plot(xo,yb,pw,bh,[-F,F],lgy?[1e-4,ytop]:[0,ytop],{ylog:lgy});
      o.push(S.T(nar?6:14,yb-8,"(b) 周波数の見方: スペクトラム（C/A 符号の中心を 1 とした比）","start",10.5,"ink",true));
      o.push(S.RECT(P.X(-B/2),yb,P.X(B/2)-P.X(-B/2),bh,0,"var(--muted-soft)","none",0,null,' fill-opacity="0.7"'));
      o.push(P.axes({xl:"周波数 f − 中心の周波数 [MHz]",xt:U.nice(-F,F,nar?4:8).filter(function(v){return v>=-F&&v<=F;}),yt:lgy?[1e-4,1e-3,0.01,0.1,1]:U.nice(0,ytop,4).filter(function(v){return v<=ytop;}),
        xfmt:function(v){return _w02_f(v,Math.abs(v)<1&&v!==0?1:0);},yfmt:function(v){return lgy?(v>=0.01?String(v):(v===1e-3?"10⁻³":"10⁻⁴")):_w02_f(v,v<1&&v>0?1:0);},ylOff:nar?34:42}));
      function curve(cc){return fs.map(function(f){var v=S_rel(f,cc);return [f,lgy?Math.max(v,1e-4):v];});}
      if(ff.get()){var fp=fftpsd(c).filter(function(q){return q[0]>=-F&&q[0]<=F;}).map(function(q){return [q[0],lgy?Math.max(q[1],1e-4):q[1]];});o.push(P.clip(fp,"teal",1,null));}
      if(ov.get()&&(c.k||c.n!==1))o.push(P.clip(curve(ca),"signal",1.6,"5 3"));
      o.push(P.clip(curve(c),"green",2.2));
      /* (c) 相関の形 */
      var yc=yb+bh+58,chh=nar?100:110,R=acf(c),Ra=acf(ca),tm=Math.max(1.5,1.3*c.Tc);
      var Q=U.plot(xo,yc,pw,chh,[-tm,tm],[-0.65,1.1]);
      o.push(S.T(nar?6:14,yc-8,"(c) 相関の山の形（山の高さを 1 とした比）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"ずれ τ [μs]（1 μs で 300 m）",xt:U.nice(-tm,tm,6).filter(function(v){return v>=-tm&&v<=tm;}),yt:[-0.5,0,0.5,1],xfmt:function(v){return _w02_f(v,Math.abs(v)<1&&v!==0?2:1);},yfmt:function(v){return _w02_f(v,1);},ylOff:nar?34:42}));
      o.push(S.L(xo,Q.Y(0),xo+pw,Q.Y(0),"muted",1));
      function ext(r,T){var a=r.slice();a.unshift([-tm,0]);a.unshift([-tm,0]);a.push([tm,0]);return a.filter(function(q){return q[0]>=-tm&&q[0]<=tm;}).sort(function(p,q){return p[0]-q[0];});}
      if(ov.get()&&(c.k||c.n!==1))o.push(Q.line(ext(Ra),"signal",1.6,"5 3"));
      o.push(Q.line(ext(R),"green",2.2));
      var leg=[["green",null,name]];if(ov.get()&&(c.k||c.n!==1))leg.push(["signal","5 3","C/A 符号（BPSK(1)）"]);if(ff.get())leg.push(["teal",null,"でたらめな符号の FFT"]);
      o.push(S.LEGL(xo,yc+chh+46,leg,9.5,14));
      box.set(S.svg(Wd,yc+chh+56,o));
      /* 読み出し */
      var pk=0,pf=0;for(i=0;i<=4000;i++){var f2=F*i/4000,v2=S_rel(f2,c);if(v2>pk){pk=v2;pf=f2;}}
      var z0=null;for(i=241;i<R.length;i++){if(R[i][1]<=1e-9){z0=R[i][0];break;}}
      var eb=inband(c,B),ec=inband(ca,B),w9=w90(c),h="";
      h+="<b>"+name+"</b>: チップレート "+_w02_f(c.n*1.023,3)+" M チップ/s（1 チップ "+_w02_f(c.Tc*1000,1)+" ns）"+(c.k?"、副搬送波 "+_w02_f(c.m*1.023,3)+" MHz（1 チップに半周期が "+c.k+" 個）":"、副搬送波なし")+"<br>";
      if(c.k&&Math.abs(sc.get()-c.m)>1e-9)h+='副搬送波は、1 チップに半周期がちょうど整数個入るように '+_w02_f(c.m*1.023,3)+" MHz に合わせた<br>";
      h+="電力のいちばん高い所: "+(pf<1e-3?"中心":"中心から ±"+_w02_f(pf,2)+" MHz")+"（C/A 符号の中心の "+_w02_f(pk,3)+" 倍）。電力の 90 % が入る幅 ±"+_w02_f(w9,2)+" MHz<br>";
      h+="受ける幅 ±"+(B/2)+" MHz に入る電力: <b>"+_w02_f(100*eb,1)+" %</b>（C/A 符号は "+_w02_f(100*ec,1)+" %）<br>";
      h+="相関の山が初めて 0 になるずれ: <b>"+(z0!=null?_w02_f(z0*1000,1)+" ns（"+_w02_f(z0*1e-6*_W02_C,1)+" m）":"—")+"</b>（C/A 符号は 977.5 ns・293 m）";
      ro.innerHTML=h+'<div class="wnote">+1 と −1 がでたらめに並んだ符号の、平均のスペクトラム |P(f)|²/T<sub>c</sub>（本文の導出の式。P(f) は 1 チップの形の周波数の成分）を、C/A 符号の中心の値で割って描いた。BOC は、各チップの中で、副搬送波の半周期ごとに符号を反転させる形（正弦の向きの BOC）。FFT は、でたらめな符号 4096 標本 × 24 区間の平均。実際の L1C・E1 の信号は、BOC(1,1) に BOC(6,1) を少し混ぜた形である。</div>';
    }
    draw();
  };

  /* ---- 6 節: 時間の入れ子 — ページからチップまで ---- */
  REG.w02_frame=function(el,U){
    var S=U.S;
    U.head(el,"TIME STRUCTURE","時間の入れ子 — ページからチップまでの位置と、送った時刻");
    var LV=[{nm:"ページ（フレームの番号）",n:25,dur:30,c:"muted"},{nm:"サブフレーム",n:5,dur:6,c:"purple"},{nm:"ワード",n:10,dur:0.6,c:"purple"},{nm:"ビット",n:30,dur:0.02,c:"gold"},{nm:"符号の周期",n:20,dur:0.001,c:"signal"},{nm:"チップ",n:1023,dur:_W02_TC,c:"signal"}];
    var idx=[0,0,3,17,6,412],frac=0.30,sl=[];
    var r1=U.ctrls(el),r2=U.ctrls(el);
    LV.forEach(function(L,i){var row=i<3?r1:r2;var base=i===5?0:1;
      sl.push(U.slider(row,L.nm+(i===5?"（0 から）":""),{min:base,max:L.n-1+base,step:1,value:idx[i]+base,fmt:function(v){return String(v);},onInput:function(v){idx[i]=v-base;draw();}}));});
    var r3=U.ctrls(el);
    var fr=U.slider(r3,"チップの端数（相関の頂点から読む）",{min:0,max:0.99,step:0.01,value:0.30,fmt:function(v){return _w02_f(v,2);},onInput:function(v){frac=v;draw();}});
    var lvsel=U.select(r3,"「再生」で進める段",LV.map(function(L){return L.nm;}),2,null);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){adv(lvsel.get());sync();draw();},350);
    U.button(br,"再生",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"1 つ進める",function(){adv(lvsel.get());sync();draw();});
    U.button(br,"本文の例（6 節の筆算）",function(){tick.stop();idx=[0,0,3,17,6,412];frac=0.30;fr.set(0.30);sync();draw();});
    U.button(br,"一巡の始まりに戻す",function(){tick.stop();idx=[0,0,0,0,0,0];frac=0;fr.set(0);sync();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function adv(L){var i=L;idx[i]++;while(i>0&&idx[i]>=LV[i].n){idx[i]=0;i--;idx[i]++;}if(idx[0]>=LV[0].n)idx[0]=0;}
    function sync(){sl.forEach(function(s,i){s.set(idx[i]+(i===5?0:1));});}
    function cont(sf,pg){if(sf===1)return ["時計の補正の値・週番号・健康状態など","purple"];if(sf===2||sf===3)return ["その衛星の精密な軌道（エフェメリス）","signal"];
      if(sf===5)return pg<=24?["衛星 "+pg+" の大まかな軌道（アルマナック）","green"]:["衛星 1〜24 の健康状態など","gold"];
      var al={2:25,3:26,4:27,5:28,7:29,8:30,9:31,10:32};if(al[pg])return ["衛星 "+al[pg]+" の大まかな軌道（アルマナック）","green"];
      if(pg===18)return ["電離層の係数・UTC との差","teal"];if(pg===25)return ["衛星 25〜32 の健康状態など","gold"];return ["予備など","muted"];}
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],X0=nar?110:196,X1=Wd-(nar?8:12),bh=18,gap=nar?28:32,y=34;
      o.push(S.T(nar?6:14,16,"上の段の色の付いた 1 つを、下の段で拡大する","start",10.5,"ink",true));
      var labs=[null,["1","2","3","4","5"].map(function(s){return nar?s:"サブフレーム "+s;}),["TLM","HOW","3","4","5","6","7","8","9","10"],null,null,null];
      var nms=["25 フレーム","フレーム 1 つ","サブフレーム 1 つ","ワード 1 つ","ビット 1 つ","符号の周期 1 つ"];
      var sub=["全部のページ・12.5 分","5 サブフレーム・30 s","10 ワード・6 s","30 bit・0.6 s","符号 20 周期・20 ms","1023 チップ・1 ms"];
      var hx0=0,hx1=0,i,k;
      for(i=0;i<6;i++){var L=LV[i],n=L.n,w=(X1-X0)/n;
        o.push(S.T(nar?6:14,y+8,nms[i],"start",nar?9:10,L.c==="muted"?"ink":L.c,true));
        o.push(S.T(nar?6:14,y+21,sub[i],"start",9,"muted"));
        if(i<5){for(k=0;k<n;k++){var on=k===idx[i],par=i===3&&k>=24;
            var fc=on?U.soft(L.c):(par?U.soft("teal"):"panel"),cc=on?L.c:(par?"teal":"line");
            if(i===1&&!on)fc=U.soft(cont(k+1,idx[0]+1)[1]);
            o.push(S.RECT(X0+k*w,y,w-(n<40?1.2:0.6),bh,1.5,fc,cc,on?1.8:0.8));
            if(labs[i]&&w>=14)o.push(S.T(X0+k*w+w/2,y+13,labs[i][k],"middle",nar?8:9,on?L.c:"muted",on));}
          if(i===0&&!nar)for(k=0;k<n;k+=4)o.push(S.T(X0+k*w+w/2,y-3,String(k+1),"middle",8,"muted"));
          if(i===3)o.push(S.T(X0+27*w,y-3,"パリティ","middle",8.5,"teal",false,false,null,true));
          var nx0=X0+idx[i]*w,nx1=X0+(idx[i]+1)*w;}
        else{var v=_w02_pm(1);o.push(S.RECT(X0,y,X1-X0,bh,1.5,"panel","line",0.8));o.push(_w02_wave(S,X0,y+bh/2,6.5,Array.prototype.slice.call(v),w,"signal",0.7));
          nx0=X0+idx[5]*w-1.5;nx1=X0+(idx[5]+1)*w+1.5;o.push(S.RECT(nx0,y-2,nx1-nx0,bh+4,1,U.soft("signal"),"signal",1.6));}
        if(i>0){o.push(S.L(hx0,y-gap,X0,y,"faint",1,"3 3"));o.push(S.L(hx1,y-gap,X1,y,"faint",1,"3 3"));}
        hx0=nx0;hx1=nx1;y+=bh+gap;}
      /* チップの中: 搬送波（間引いて 40 周期）と端数の位置 */
      o.push(S.T(nar?6:14,y+8,"チップ 1 つ","start",nar?9:10,"signal",true));
      o.push(S.T(nar?6:14,y+21,"搬送波 1540 周期・977.5 ns","start",9,"muted"));
      o.push(S.L(hx0,y-gap,X0,y,"faint",1,"3 3"));o.push(S.L(hx1,y-gap,X1,y,"faint",1,"3 3"));
      var ch=_w02_ca(1)[idx[5]],sgn=ch?-1:1,pts=[];for(k=0;k<=640;k++){pts.push([X0+(X1-X0)*k/640,y+bh/2-7*sgn*Math.sin(2*Math.PI*40*k/640)]);}
      o.push(S.RECT(X0,y,X1-X0,bh,1.5,U.soft("signal"),"signal",1));o.push(S.PL(pts,"muted",0.9));
      var xf=X0+(X1-X0)*frac;o.push(S.L(xf,y-4,xf,y+bh+4,"gold",2.4));o.push(S.T(xf,y+bh+14,"端数 "+_w02_f(frac,2),"middle",9,"gold",true,false,null,true));
      o.push(S.T(X1,y-3,"図は 40 周期に間引いた","end",8.5,"muted",false,false,null,true));
      box.set(S.svg(Wd,y+bh+22,o));
      /* 読み出し */
      var tsf=idx[2]*0.6+idx[3]*0.02+idx[4]*0.001+(idx[5]+frac)*_W02_TC,tcy=idx[0]*30+idx[1]*6+tsf,ct=cont(idx[1]+1,idx[0]+1),h="";
      h+="12.5 分の一巡の始まりからの時刻: "+idx[0]+" × 30 s + "+idx[1]+" × 6 s + "+idx[2]+" × 0.6 s + "+idx[3]+" × 20 ms + "+idx[4]+" × 1 ms + "+_w02_f(idx[5]+frac,2)+" × 977.517 ns = <b>"+_w02_g(tcy,9)+" s</b><br>";
      h+="サブフレームの始まりからの時刻（6 節の筆算の 2〜5 行目の和）: <b>"+_w02_g(tsf,9)+" s</b>。サブフレームが 345 600 s に始まったとすると、送った時刻は "+_w02_g(345600+tsf,9)+" s<br>";
      h+="いま送っている所: ページ "+(idx[0]+1)+" のサブフレーム "+(idx[1]+1)+"（"+ct[0]+"）、ワード "+(idx[2]+1)+(idx[2]<2?"（"+["TLM","HOW"][idx[2]]+"）":"")+"、ビット "+(idx[3]+1)+(idx[3]>=24?"（パリティ）":"")+"、符号の周期 "+(idx[4]+1)+"、チップ "+idx[5]+"（"+(ch?"1 → −1":"0 → +1")+"。PRN 1）<br>";
      h+="光の速さで、1 チップは 293 m、1 周期は 300 km、1 bit は 6000 km、1 ワードは 18 万 km にあたる";
      ro.innerHTML=h+'<div class="wnote">スライダーの番号は 1 から数える（チップだけは 0 から）。式の掛ける数は、その段の番号から 1 を引いた「始まりから数え終えた数」。「再生」は、選んだ段を 1 つずつ進め、いちばん大きい番号を超えると 0 に戻して上の段を 1 つ進める（桁の繰り上がりと同じ）。ページとサブフレームの内容は、IS-GPS-200 の割り当て（6 節の図）による。</div>';
    }
    draw();
  };
