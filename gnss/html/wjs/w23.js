  /* ===== 23 章 評価と試験 — C/N0・TTFF・精度の測り方 =====
     図（fig/f23.py）と同じモデル・同じ乱数の列で計算する（同じ種なら同じ値になる）。 */
  function _w23_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w23_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w23_sorted(a){return Array.prototype.slice.call(a).sort(function(x,y){return x-y;});}
  /* 中央値（偶数個なら真ん中の 2 つの平均）と、割合 p の回がそれ以下になる値（小さい順に ceil(p n) 番目） */
  function _w23_med(a){var s=_w23_sorted(a),n=s.length;return n%2?s[(n-1)/2]:0.5*(s[n/2-1]+s[n/2]);}
  function _w23_q(a,p){var s=_w23_sorted(a),k=Math.max(1,Math.ceil(p*s.length-1e-9));return s[k-1];}
  function _w23_medS(s){var n=s.length;return n%2?s[(n-1)/2]:0.5*(s[n/2-1]+s[n/2]);}
  function _w23_qS(s,p){return s[Math.max(1,Math.ceil(p*s.length-1e-9))-1];}
  var _W23_KB=1.380649e-23,_W23_TE=290*(Math.pow(10,0.1)-1);
  function _w23_n0(Tin){return 10*Math.log10(_W23_KB*(Tin+_W23_TE))+30;}
  var _W23_N0SIM=_w23_n0(290),_W23_N0SKY=_w23_n0(100);
  /* 二項分布: n 回のうち k 回以下の確率 */
  function _w23_bcdf(k,n,p){if(p<=0)return 1;if(p>=1)return k>=n?1:0;var lt=n*Math.log(1-p),s=0,t=lt;for(var j=0;j<=k;j++){if(j>0)t+=Math.log((n-j+1)/j)+Math.log(p/(1-p));s+=Math.exp(t);}return Math.min(1,s);}
  /* n 回のうち k 回超えたときの、超える割合の上側 95 % の限界（クロッパー・ピアソン） */
  function _w23_pu(k,n){if(k>=n)return 1;var lo=0,hi=1;for(var i=0;i<60;i++){var m=(lo+hi)/2;if(_w23_bcdf(k,n,m)>0.05)lo=m;else hi=m;}return (lo+hi)/2;}
  function _w23_wilson(k,n){var z=1.96,p=k/n,c=(p+z*z/(2*n))/(1+z*z/n),h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/(1+z*z/n);return [Math.max(0,c-h),Math.min(1,c+h)];}

  /* ---- 2 節: 感度の試験（f23.py の _f23_track・_f23_acq と同じ） ---- */
  function _w23_track(U,seed,ctrk,step,dwell){var g=U.rng(seed),h0=Math.log(2)/60,trk=[1,1,1,1,1,1,1,1],P=-130,rows=[],cnt=[],last=null;
    while(P>=-170-1e-9){var ok=true,c=P-_W23_N0SIM,h=Math.min(1,h0*Math.exp(-(c-ctrk)/0.4));
      for(var s=0;s<dwell;s++){var n=0;for(var i=0;i<8;i++){var u=g.next();if(trk[i]&&u<h)trk[i]=0;if(trk[i])n++;}cnt.push(n);if(n<4)ok=false;}
      var m=trk.reduce(function(a,b){return a+b;},0);rows.push([P,m,ok]);if(ok)last=P;if(m<4)break;P=Math.round((P-step)*1e6)/1e6;}
    return {last:last,rows:rows,cnt:cnt};}
  function _w23_pfix(c,cacq){var p=1/(1+Math.exp(-(c-cacq)/0.7)),s=0,cb=[1,8,28,56,70,56,28,8,1];for(var j=4;j<=8;j++)s+=cb[j]*Math.pow(p,j)*Math.pow(1-p,8-j);return s;}
  function _w23_acq(U,seed,cacq,step,K){var g=U.rng(seed),rows=[],last=null,stop=false,P=-134;
    while(P>=-148-1e-9){var c=P-_W23_N0SIM,p=1/(1+Math.exp(-(c-cacq)/0.7)),ok=0;
      for(var r=0;r<K;r++){var m=0;for(var i=0;i<8;i++)if(g.next()<p)m++;if(m>=4)ok++;}
      rows.push([P,ok]);if(!stop&&ok>=Math.ceil(0.9*K-1e-9))last=P;else if(!stop)stop=true;P=Math.round((P-step)*1e6)/1e6;}
    return {last:last,rows:rows};}
  /* モデルのしきい値: 追尾は c_trk + N0、捕捉は位置が出る割合が 90 % になる電力 */
  function _w23_acq90(cacq){var lo=cacq-5,hi=cacq+5;for(var i=0;i<60;i++){var m=(lo+hi)/2;if(_w23_pfix(m,cacq)<0.9)lo=m;else hi=m;}return (lo+hi)/2+_W23_N0SIM;}

  REG.w23_sens=function(el,U){
    var S=U.S;
    U.head(el,"SENSITIVITY TEST","GNSS シミュレータで電力を下げて、追尾感度と捕捉感度を読む");
    var r1=U.ctrls(el);
    var st=U.slider(r1,"下げる刻み",{values:[0.5,1,2],value:1,fmt:function(v){return v+" dB";},onInput:run});
    var dw=U.slider(r1,"追尾: 1 段の時間",{values:[10,30,60,120],value:60,fmt:function(v){return v+" s";},onInput:run});
    var kk=U.slider(r1,"捕捉: 1 段の回数",{values:[5,10,20,40],value:10,fmt:function(v){return v+" 回";},onInput:run});
    var r2=U.ctrls(el);
    var ct=U.slider(r2,"受信機の追尾のしきい値",{min:10,max:25,step:1,value:17,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var ca=U.slider(r2,"受信機の捕捉のしきい値",{min:26,max:40,step:1,value:32,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var br=U.btnrow(el),seed=1,TR=null,AQ=null;
    U.button(br,"本文の例（1 dB・60 s・10 回）",function(){st.set(1);dw.set(60);kk.set(10);ct.set(17);ca.set(32);seed=1;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){TR=_w23_track(U,seed,ct.get(),st.get(),dw.get());AQ=_w23_acq(U,seed,ca.get(),st.get(),kk.get());draw();}
    function draw(){
      var nar=_w23_nar(box),Wd=nar?400:700,o=[],cnt=TR.cnt,n=cnt.length,rows=TR.rows,dwell=dw.get();
      /* (a) 追尾感度 */
      var ax=nar?60:64,aw=nar?280:290;
      o.push(S.T(nar?6:10,16,"(a) 追尾感度（電力を段ごとに下げる）","start",11,"ink",true));
      var P=U.plot(ax,30,aw,140,[0,Math.max(1,n/60)],[-170,-128]);
      o.push(P.axes({yl:"入力の電力 [dBm]",yt:[-170,-160,-150,-140,-130],xfmt:function(){return "";},nx:5}));
      var pts=[];rows.forEach(function(r,i){pts.push([i*dwell/60,r[0]]);pts.push([(i+1)*dwell/60,r[0]]);});
      o.push(P.line(pts,"purple",2));
      [10,20,30,40].forEach(function(v){var pp=v+_W23_N0SIM;if(pp>=-170&&pp<=-128)o.push(S.T(ax+aw+6,P.Y(pp)+3.5,String(v),"start",9,"purple"));});
      o.push(S.TX(ax+aw+30,30+70,"C/N_0 [dB-Hz]","middle",9.5,"purple",false,false,90));
      var thr=ct.get()+_W23_N0SIM;
      o.push(S.L(ax,P.Y(thr),ax+aw,P.Y(thr),"gold",1.1,"4 3"));
      o.push(S.T(ax+6,P.Y(thr)+13,"モデルのしきい値 "+_w23_f(thr,1)+" dBm","start",9.5,"gold",true,false,null,true));
      if(TR.last!==null){var li=-1;rows.forEach(function(r,i){if(r[0]===TR.last)li=i;});var lx=P.X((li+1)*dwell/60);
        o.push(S.D(lx,P.Y(TR.last),"green",4.2));o.push(S.T(lx-8,P.Y(TR.last)-6,"読んだ値 "+_w23_f(TR.last,1)+" dBm","end",9.5,"green",true,false,null,true));}
      var Q=U.plot(ax,186,aw,50,[0,Math.max(1,n/60)],[0,8]);
      o.push(Q.axes({xl:"時間 [分]",yl:"追う機数",yt:[0,4,8],nx:5}));
      var sp=[];for(var k=0;k<n;k+=Math.max(1,Math.floor(n/600)))sp.push([k/60,cnt[k]]);sp.push([n/60,cnt[n-1]]);
      o.push(Q.steps(sp,"signal",1.5));o.push(S.L(ax,Q.Y(4),ax+aw,Q.Y(4),"alias",1,"3 3"));
      /* (b) 捕捉感度 */
      var bx=nar?60:476,by=nar?316:30,bw=nar?310:206;
      o.push(S.T(nar?6:420,by-14,"(b) 捕捉感度（段ごとに "+kk.get()+" 回）","start",11,"ink",true));
      var R=U.plot(bx,by,bw,190,[-148,-134],[0,1]);
      o.push(R.axes({xl:"入力の電力 [dBm]",yl:"位置が出た割合",xt:[-148,-144,-140,-136],yt:[0,0.5,0.9,1],yfmt:function(v){return Math.round(v*100)+" %";},ylOff:44}));
      var cv=[];for(var pp=-148;pp<=-134+1e-9;pp+=0.2)cv.push([pp,_w23_pfix(pp-_W23_N0SIM,ca.get())]);
      o.push(R.line(cv,"muted",1.4,"5 3"));
      AQ.rows.forEach(function(r){var wl=_w23_wilson(r[1],kk.get());o.push(S.L(R.X(r[0]),R.Y(wl[0]),R.X(r[0]),R.Y(wl[1]),"signal",1,"2 2"));o.push(S.D(R.X(r[0]),R.Y(r[1]/kk.get()),"signal",3.3));});
      o.push(S.L(bx,R.Y(0.9),bx+bw,R.Y(0.9),"alias",1,"3 3"));
      var a90=_w23_acq90(ca.get());o.push(S.L(R.X(a90),R.y,R.X(a90),R.y+R.h,"gold",1.1,"4 3"));
      if(AQ.last!==null){o.push(S.D(R.X(AQ.last),R.Y(1),"green",4.5));o.push(S.T(R.X(AQ.last)+6,R.Y(1)+16,"読んだ値 "+_w23_f(AQ.last,1),"start",9.5,"green",true,false,null,true));}
      var Hh=nar?by+190+52:286;
      o.push(S.LEGL(nar?8:330,Hh,[["muted","5 3","モデル（4 機以上）"],["gold","4 3","モデルの 90 %"],["signal","2 2","95 % の信頼区間"]],9,8));
      box.set(S.svg(Wd,Hh+8,o));
      var t1=TR.last,a1=AQ.last,thrA=a90;
      var rows2=[["追尾感度",t1===null?"−":_w23_f(t1,1)+" dBm",_w23_f(thr,1)+" dBm",t1===null?"−":_w23_f(t1-thr,1)+" dB"],
        ["捕捉感度（9 割）",a1===null?"−（最も強い段でも 9 割に届かない）":_w23_f(a1,1)+" dBm",_w23_f(thrA,1)+" dBm",a1===null?"−":_w23_f(a1-thrA,1)+" dB"]];
      var h="入力の電力と C/N<sub>0</sub>: C/N<sub>0</sub> = C − N<sub>0</sub>、シミュレータの入力（290 K）で N<sub>0</sub> = "+_w23_f(_W23_N0SIM,1)+" dBm/Hz（空のアンテナ 100 K なら "+_w23_f(_W23_N0SKY,1)+" dBm/Hz）";
      h+=U.tbl(["","読んだ値","モデルの値","差"],rows2,["left","right","right","right"]);
      ro.innerHTML=h+'<div class="wnote">どれも例の値のモデル。衛星 8 機が同じ電力。追尾: 追尾中の衛星は 1 秒ごとに確率 (ln 2/60) e<sup>−(C/N<sub>0</sub> − しきい値)/0.4</sup> で見失う（しきい値では 60 s で半分の衛星を見失う）。1 段の間ずっと 4 機以上を追った最も弱い段を読む。捕捉: 1 回ごとに、各衛星が制限時間（300 s）の中に見つかる確率 1/(1 + e<sup>−(C/N<sub>0</sub> − しきい値)/0.7</sup>) で、4 機以上なら位置が出る。強い段から、9 割以上の回で位置が出た最も弱い段を読む。</div>';
    }
    run();
  };

  /* ---- 3 節: TTFF（f23.py の _f23_ttff1 と同じ。5 章 5 節の手順と時間） ---- */
  var _W23_TS={cold:1.6368,warm:0.09207,hot:0.055242},_W23_SKY={open:[9,0],blocked:[5,0.1]};
  function _w23_ttff1(mode,sky,g){var ton=g.next()*30,ns=_W23_SKY[sky][0],pm=_W23_SKY[sky][1];
    if(mode==="hot"){var ta0=_W23_TS.hot+0.3,tt=ton+ta0;return ta0+(Math.ceil(tt-1e-9)-tt);}
    var ta=_W23_TS[mode]+0.3+1.0,t0=(ton+ta)%30,ends=[];
    for(var k=0;k<ns;k++){var e=0;for(var i=1;i<=3;i++){var s0=6*(i-1);while(s0<t0-1e-9)s0+=30;var n=0;while(true){var ok=g.next()<1-pm;n++;if(ok||n>=12)break;s0+=30;}e=Math.max(e,s0+6);}ends.push(e);}
    ends.sort(function(a,b){return a-b;});return ta+ends[3]-t0;}
  function _w23_ttffs(U,mode,sky,n,seed){var g=U.rng(seed),v=[];for(var i=0;i<n;i++)v.push(_w23_ttff1(mode,sky,g));return v;}
  var _W23_TRUE={};

  REG.w23_ttff=function(el,U){
    var S=U.S,MODES=[["cold","コールドスタート"],["warm","ウォームスタート"],["hot","ホットスタート"]],SKYS=[["open","開けた空（9 機）"],["blocked","一部が遮られた空（5 機・読み誤り 10 %）"]];
    U.head(el,"TTFF STATISTICS","TTFF を何回も測って、中央値と 95 % の値で判定する");
    var r1=U.ctrls(el);
    var sk=U.select(r1,"空の条件",SKYS.map(function(q){return q[1];}),0,function(){rep=null;run();});
    var md=U.select(r1,"スタートの種類",MODES.map(function(q){return q[1];}),0,function(){sp.set(md.get()===2?2:40);rep=null;run();});
    var r2=U.ctrls(el);
    var nn=U.slider(r2,"回数 N<sub>t</sub>",{values:[10,20,30,59,100,300],value:100,fmt:function(v){return v+" 回";},onInput:function(){rep=null;run();}});
    var sp=U.slider(r2,"仕様: 95 % の回で、この時間以内",{values:[1,1.5,2,3,5,10,20,30,40,50,60,80,100],value:40,fmt:function(v){return v+" s";},onInput:function(){rep=null;draw();}});
    var br=U.btnrow(el),seed=1,V=null,rep=null;
    U.button(br,"本文の例（開けた空・コールド・100 回）",function(){sk.set(0);md.set(0);nn.set(100);sp.set(40);seed=1;rep=null;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rep=null;run();});
    U.button(br,"この試験を 1000 回くり返す",function(){doRep();});
    var box=U.svgbox(el),ro=U.readout(el);
    function cur(){return {mode:MODES[md.get()][0],sky:SKYS[sk.get()][0]};}
    function truth(){var c=cur(),key=c.mode+c.sky;if(!_W23_TRUE[key]){var v=_w23_ttffs(U,c.mode,c.sky,20000,99),s=_w23_sorted(v);_W23_TRUE[key]={med:_w23_medS(s),q95:_w23_qS(s,0.95),s:s};}return _W23_TRUE[key];}
    function run(){var c=cur();V=_w23_ttffs(U,c.mode,c.sky,nn.get(),seed);draw();}
    function doRep(){var c=cur(),g=U.rng(seed*31+5),N=nn.get(),spec=sp.get(),meds=[],q95s=[],pass=0;
      for(var r=0;r<1000;r++){var v=[],over=0;for(var i=0;i<N;i++){var x=_w23_ttff1(c.mode,c.sky,g);v.push(x);if(x>spec)over++;}
        meds.push(_w23_med(v));q95s.push(_w23_q(v,0.95));if(_w23_pu(over,N)<=0.05)pass++;}
      rep={meds:meds,q95s:q95s,pass:pass,N:N,spec:spec};draw();}
    function hist(o,P,v,bw,c,lo){var cnt={},mx=0;v.forEach(function(x){var b=Math.floor((x-lo)/bw);cnt[b]=(cnt[b]||0)+1;});
      Object.keys(cnt).forEach(function(b){var a=lo+(+b)*bw,k=cnt[b];mx=Math.max(mx,k);o.push(S.RECT(P.X(a)+0.4,P.Y(k),Math.max(1,P.X(a+bw)-P.X(a)-0.8),P.Y(0)-P.Y(k),0,U.soft(c),c,0.8));});return mx;}
    function maxBin(v,bw,lo){var cnt={},mx=0;v.forEach(function(x){var b=Math.floor((x-lo)/bw);cnt[b]=(cnt[b]||0)+1;mx=Math.max(mx,cnt[b]);});return mx;}
    function vline(o,P,x,c,lab,dy,a,dash){if(x<P.xr[0]||x>P.xr[1])return;o.push(S.L(P.X(x),P.y,P.X(x),P.y+P.h,c,1.5,dash||"4 3"));o.push(S.T(P.X(x)+(a==="end"?-4:4),P.y+dy,lab,a||"start",9.5,c,true,false,null,true));}
    function draw(){
      var nar=_w23_nar(box),Wd=nar?400:700,o=[],c=cur(),spec=sp.get(),N=V.length,hot=c.mode==="hot",tr=truth();
      var lo=hot?0:15,hi=hot?Math.max(2.5,spec+0.5):Math.max(c.sky==="open"?50:110,spec+5),bw=hot?0.05:1,xt=U.nice(lo,hi,nar?5:8).filter(function(v){return v>=lo&&v<=hi;});
      var m=_w23_med(V),q95=_w23_q(V,0.95),mu=V.reduce(function(a,b){return a+b;},0)/N,sd=Math.sqrt(V.reduce(function(a,b){return a+(b-mu)*(b-mu);},0)/(N-1)),over=V.filter(function(x){return x>spec;}).length;
      var ax=nar?52:56,aw=nar?330:620;
      o.push(S.T(nar?6:10,16,"(a) "+N+" 回の TTFF","start",11,"ink",true));
      var ym=Math.max(4,maxBin(V,bw,lo)*1.15),P=U.plot(ax,28,aw,120,[lo,hi],[0,ym]);
      o.push(P.axes({xl:"TTFF [s]",yl:"回数",xt:xt,yt:U.nice(0,ym,3).filter(function(v){return v<=ym&&v===Math.round(v);}),ylOff:34}));
      hist(o,P,V,bw,"signal",lo);
      vline(o,P,spec,"purple","仕様 "+spec+" s",12,"start","2 2");
      vline(o,P,m,"gold","中央値 "+_w23_f(m,hot?2:1),26,"end");
      vline(o,P,q95,"alias","95 % "+_w23_f(q95,hot?2:1),40,q95>(lo+hi)/2?"end":"start");
      var y=196;
      if(rep&&rep.N===N){
        o.push(S.L(nar?6:10,y-14,Wd-(nar?6:10),y-14,"line",0.8));
        o.push(S.T(nar?6:10,y,"(b) 同じ "+N+" 回の試験を 1000 回くり返したときの推定","start",11,"ink",true));
        var all=rep.meds.concat(rep.q95s,[tr.med,tr.q95]),l2=Math.min.apply(null,all),h2=Math.max.apply(null,all),pad=Math.max(0.5,(h2-l2)*0.08);l2-=pad;h2+=pad;
        var bw2=(h2-l2)/60;
        [[rep.meds,"gold","中央値の推定",tr.med],[rep.q95s,"alias","95 % の値の推定",tr.q95]].forEach(function(row,j){
          var yy=y+16+j*78,ym2=Math.max(4,maxBin(row[0],bw2,l2)*1.15),Q=U.plot(ax,yy,aw,52,[l2,h2],[0,ym2]);
          o.push(Q.axes({xl:j===1?"推定した値 [s]":null,yt:[0],xfmt:j===1?null:function(){return "";},nx:nar?4:7}));
          hist(o,Q,row[0],bw2,row[1],l2);
          o.push(S.L(Q.X(row[3]),Q.y,Q.X(row[3]),Q.y+Q.h,"ink",1.2,"3 3"));
          var a5=_w23_q(row[0],0.05),a95=_w23_q(row[0],0.95);
          o.push(S.T(ax+4,yy+11,row[2]+"（5〜95 %: "+_w23_f(a5,hot?2:1)+"〜"+_w23_f(a95,hot?2:1)+" s）","start",9.5,row[1],true,false,null,true));});
        o.push(S.T(nar?6:10,y+16+2*78+22,"点線は 20 000 回の値（中央値 "+_w23_f(tr.med,hot?2:1)+" s・95 % "+_w23_f(tr.q95,hot?2:1)+" s）","start",9,"muted"));
        y=y+16+2*78+34;}
      else{o.push(S.T(nar?6:10,y,"(b) 「この試験を 1000 回くり返す」を押すと、推定のばらつきを描く","start",10,"muted"));y+=12;}
      box.set(S.svg(Wd,y,o));
      var pu=_w23_pu(over,N),okj=pu<=0.05;
      var h="中央値 <b>"+_w23_f(m,2)+" s</b>、95 % の値 <b>"+_w23_f(q95,2)+" s</b>（"+N+" 回の "+Math.max(1,Math.ceil(0.95*N-1e-9))+" 番目）、平均 "+_w23_f(mu,2)+" s・標準偏差 "+_w23_f(sd,2)+" s（平均 + 1.645σ は "+_w23_f(mu+1.645*sd,2)+" s）";
      h+="<br>仕様（"+spec+" s）を超えた回: <b>"+over+" / "+N+"</b> → 超える割合の 95 % の上限 "+_w23_f(100*pu,2)+" %："+(okj?'<span class="ok">5 % より小さいと言える（合格）</span>':'<span class="warn">5 % より小さいとは言えない</span>');
      h+="<br>20 000 回で求めた本当の値: 中央値 "+_w23_f(tr.med,2)+" s・95 % "+_w23_f(tr.q95,2)+" s・仕様を超える割合 "+_w23_f(100*(1-tr.s.filter(function(x){return x<=spec;}).length/tr.s.length),2)+" %";
      if(rep&&rep.N===N)h+="<br>1000 回の試験のうち、合格と判定した回: <b>"+rep.pass+"</b>（仕様 "+rep.spec+" s）";
      ro.innerHTML=h+'<div class="wnote">5 章 5 節のモデル（C/N<sub>0</sub> 45 dB-Hz、探す回路は同時に 4000 ビン）。コールドは探す 1.64 s・合わせる 0.3 s・ビット同期 1 s の後、サブフレーム 1〜3 を受ける。電源を入れる時刻は 30 s のフレームの中で一様。遮られた空は、見えている衛星が 5 機で、各サブフレームを 10 % の確率で読み誤る（30 s 後に受け直す）。4 機目のエフェメリスがそろったら位置を出す。ホットは、探して合わせた後の次の 1 秒の区切り。</div>';
    }
    run();
  };

  /* ---- 4 節: 静止の記録（f23.py の _f23_record・_f23_outliers と同じ） ---- */
  var _W23_SSLOW=Math.sqrt(1.5*1.5+3.5*3.5+0.4*0.4),_W23_SFAST=Math.sqrt(1.0*1.0+0.5*0.5),_W23_TAU=1800;
  /* 7 章 5・6 節の式で求めた値（f23.py と同じ計算）: 24 時間の中央値の見積もりと、1 日の並びを全部まぜた値 */
  var _W23_CH7={cep:3.85,r95:8.21,v95:15.29},_W23_MIX={cep:3.76,r95:8.42,v95:15.80,d2:9.43};
  var _W23_GEO=null;
  function _w23_geo(U){if(_W23_GEO)return _W23_GEO;var G=U.gnss,con=G.constellation().filter(function(s){return s.sys==="GPS";}),rx=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),D=Math.PI/180;
    var L=new Float64Array(1440*6),hd=new Float64Array(1440);
    for(var k=0;k<1440;k++){var rows=[];con.forEach(function(s){var q=G.elaz(rx,G.ecef(s,k*60));if(q[0]>10){var e=q[0]*D,a=q[1]*D;rows.push([-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e),1]);}});
      var A=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];rows.forEach(function(r){for(var i=0;i<4;i++)for(var j=0;j<4;j++)A[i][j]+=r[i]*r[j];});
      var H=U.ctl.mat.inv(A),l00=Math.sqrt(H[0][0]),l10=H[1][0]/l00,l11=Math.sqrt(H[1][1]-l10*l10),l20=H[2][0]/l00,l21=(H[2][1]-l20*l10)/l11,l22=Math.sqrt(H[2][2]-l20*l20-l21*l21);
      L.set([l00,l10,l11,l20,l21,l22],k*6);hd[k]=Math.sqrt(H[0][0]+H[1][1]);}
    _W23_GEO={L:L,hdop:hd};return _W23_GEO;}
  function _w23_record(U,seed,n,t0,dt){var g=U.rng(seed),geo=_w23_geo(U),L=geo.L,phi=Math.exp(-dt/_W23_TAU),s=Math.sqrt(1-phi*phi),d=new Float64Array(n*3),a0=0,a1=0,a2=0;
    for(var k=0;k<n;k++){var x0=g.normal(),x1=g.normal(),x2=g.normal(),w0=g.normal(),w1=g.normal(),w2=g.normal();
      if(k===0){a0=x0;a1=x1;a2=x2;}else{a0=s*x0+phi*a0;a1=s*x1+phi*a1;a2=s*x2+phi*a2;}
      var v0=_W23_SSLOW*a0+_W23_SFAST*w0,v1=_W23_SSLOW*a1+_W23_SFAST*w1,v2=_W23_SSLOW*a2+_W23_SFAST*w2,m=(Math.floor((t0+k*dt)/60)%1440)*6;
      d[3*k]=L[m]*v0;d[3*k+1]=L[m+1]*v0+L[m+2]*v1;d[3*k+2]=L[m+3]*v0+L[m+4]*v1+L[m+5]*v2;}
    return d;}
  function _w23_outliers(U,seed,n,dt){var g=U.rng(seed),add=new Float64Array(n*3),T=n*dt;
    for(var b=0;b<T;b+=600){if(g.next()<0.1){var st=b+g.next()*600,du=20+80*g.next(),mag=20+40*g.next(),ang=2*Math.PI*g.next(),up=(10+30*g.next())*(g.next()<0.5?1:-1);
      var i0=Math.ceil(st/dt-1e-9),i1=Math.min(n,Math.ceil((st+du)/dt-1e-9));for(var i=i0;i<i1;i++){add[3*i]+=mag*Math.sin(ang);add[3*i+1]+=mag*Math.cos(ang);add[3*i+2]+=up;}}}
    return add;}
  function _w23_stats(d,i0,n){var dh=new Float64Array(n),du=new Float64Array(n),se=0,sn=0,s2=0;
    for(var i=0;i<n;i++){var e=d[3*(i0+i)],nn=d[3*(i0+i)+1];dh[i]=Math.hypot(e,nn);du[i]=Math.abs(d[3*(i0+i)+2]);se+=e;sn+=nn;s2+=dh[i]*dh[i];}
    dh.sort();du.sort();var me=se/n,mn=sn/n,sp=new Float64Array(n);for(var j=0;j<n;j++)sp[j]=Math.hypot(d[3*(i0+j)]-me,d[3*(i0+j)+1]-mn);sp.sort();
    return {cep:_w23_medS(dh),r95:_w23_qS(dh,0.95),d2:2*Math.sqrt(s2/n),v95:_w23_qS(du,0.95),me:me,mn:mn,sp:_w23_medS(sp)};}
  /* 長さ L [s] の記録を 100 本（始める時刻と乱数を変えて）とったときの CEP・R95（f23.py の _f23_mc と同じ。6 時間以上は 10 s ごと） */
  function _w23_mc(U,L,day,outl){var g=U.rng(2300+L+1000*(day-1)),dt=L>=21600?10:1,n=Math.round(L/dt),out=[];
    for(var r=0;r<100;r++){var t0=Math.floor(g.next()*1440)*60,sd=100000+7919*r+L+1000*(day-1),d=_w23_record(U,sd,n,t0,dt);
      if(outl){var ad=_w23_outliers(U,sd+7777,n,dt);for(var i=0;i<d.length;i++)d[i]+=ad[i];}
      var st=_w23_stats(d,0,n);out.push([st.cep,st.r95]);}
    return out;}

  REG.w23_accuracy=function(el,U){
    var S=U.S,LENS=[60,600,3600,21600,86400],LN={60:"1 分",600:"10 分",3600:"1 時間",21600:"6 時間",86400:"24 時間"};
    U.head(el,"STATIC ACCURACY","静止の記録から CEP・R95・2DRMS を計算する（記録の長さ・始める時刻・外れ値）");
    var r1=U.ctrls(el);
    var ln=U.slider(r1,"記録の長さ",{values:LENS,value:86400,fmt:function(v){return LN[v];},onInput:function(){mc=null;draw();}});
    var t0=U.slider(r1,"始める時刻",{min:0,max:24,step:1/12,value:0,fmt:function(v){var h=Math.floor(v+1e-9),m=Math.round((v-h)*60);if(m===60){h++;m=0;}return (h<10?"0":"")+h+":"+(m<10?"0":"")+m;},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var cO=U.checkbox(r2,"外れ値（NLOS）を足す",false,function(){mc=null;draw();});
    var c7=U.checkbox(r2,"7 章の見積もりの円",true,function(){draw();});
    var br=U.btnrow(el),day=1,D=null,AD=null,mc=null;
    U.button(br,"本文の例（24 時間・0:00 から）",function(){ln.set(86400);t0.set(0);cO.set(false);day=1;D=null;mc=null;draw();});
    U.button(br,"例の 10 分（12:10 から）",function(){ln.set(600);t0.set(12+10/60);day=1;D=null;mc=null;draw();});
    U.button(br,"別の日（乱数）",function(){day++;D=null;mc=null;draw();});
    U.button(br,"同じ長さの記録 100 本で比べる",function(){mc=_w23_mc(U,ln.get(),day,cO.get());draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function data(){if(!D){D=_w23_record(U,day,172800,0,1);AD=_w23_outliers(U,day+7777,172800,1);}return D;}
    function circ(P,r,c,dash){var p=[];for(var i=0;i<=96;i++){var a=2*Math.PI*i/96;p.push([r*Math.cos(a),r*Math.sin(a)]);}return P.clip(p,c,1.6,dash);}
    function draw(){
      var d0=data(),L=ln.get(),i0=Math.round(t0.get()*3600),nar=_w23_nar(box),Wd=nar?400:700,o=[],geo=_w23_geo(U),outl=cO.get(),d=d0;
      if(outl){d=new Float64Array(d0.length);for(var i=0;i<d0.length;i++)d[i]=d0[i]+AD[i];}
      var st=_w23_stats(d,i0,L);
      /* (a) 時間の変化（その日の 0:00 から 48 時間のうち、始めの 24 時間＋記録の範囲） */
      var ax=nar?44:56,aw=nar?344:630,hEnd=Math.max(24,Math.ceil((i0+L)/3600/6)*6);
      o.push(S.T(nar?6:10,16,"(a) 東・北の誤差（1 分ごと）と、選んだ記録","start",11,"ink",true));
      var P=U.plot(ax,26,aw,96,[0,hEnd],[-20,20]),xt=[];for(var h=0;h<=hEnd;h+=hEnd>24?12:(nar?6:3))xt.push(h);
      o.push(P.axes({yl:"誤差 [m]",xt:xt,yt:[-10,0,10],xfmt:function(){return "";},ylOff:34}));
      var pe=[],pn=[];for(var k=0;k<hEnd*3600;k+=60){pe.push([k/3600,d[3*k]]);pn.push([k/3600,d[3*k+1]]);}
      o.push(P.clip(pe,"signal",0.9));o.push(P.clip(pn,"gold",0.9));
      var wx=P.X(i0/3600),ww=Math.max(3,P.X((i0+L)/3600)-wx);o.push(S.RECT(wx-1,P.y,ww+2,P.h,0,U.soft("purple"),"purple",1.2));
      var Q=U.plot(ax,132,aw,26,[0,hEnd],[0.8,1.6]);o.push(Q.axes({xl:"時刻 [時間]（24 時より後は次の日）",yl:"HDOP",xt:xt,yt:[0.8,1.6],yfmt:function(v){return v.toFixed(1);},ylOff:34}));
      var hp=[];for(var m=0;m<hEnd*60;m++)hp.push([m/60,geo.hdop[m%1440]]);o.push(Q.steps(hp,"teal",1.1));
      /* (b) 水平の散らばり */
      var by=212,lim=Math.max(10,Math.min(60,Math.ceil(Math.max(st.r95,st.d2)*1.25/5)*5)),sx=nar?52:62,sw=nar?220:230;
      o.push(S.T(nar?6:10,by-10,"(b) 水平の散らばり（"+LN[L]+"）","start",11,"ink",true));
      var R=U.plot(sx,by,sw,sw,[-lim,lim],[-lim,lim]);o.push(S.RECT(sx,by,sw,sw,3,"var(--screen)","line",1));
      o.push(R.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9,ylOff:30}));
      var stp=Math.max(1,Math.floor(L/2500));for(var j=0;j<L;j+=stp){var e=d[3*(i0+j)],nn=d[3*(i0+j)+1];if(Math.abs(e)<lim&&Math.abs(nn)<lim)o.push(S.D(R.X(e),R.Y(nn),"gold",1.0));}
      o.push(circ(R,st.cep,"signal"));o.push(circ(R,st.r95,"alias"));o.push(circ(R,st.d2,"ink","5 3"));
      if(c7.get()){o.push(circ(R,_W23_CH7.cep,"signal","2 3"));o.push(circ(R,_W23_CH7.r95,"alias","2 3"));}
      o.push(S.L(R.X(0)-5,R.Y(0),R.X(0)+5,R.Y(0),"green",2.2));o.push(S.L(R.X(0),R.Y(0)-5,R.X(0),R.Y(0)+5,"green",2.2));
      o.push(S.ARR(R.X(0),R.Y(0),R.X(st.me),R.Y(st.mn),"purple",1.5,6));
      o.push(S.T(sx+sw/2,by+sw+28,"東（横）・北（縦）[m]","middle",9.5,"muted"));
      /* 上下 */
      var vx=sx+sw+(nar?20:24),vl=Math.max(15,Math.min(80,Math.ceil(st.v95*1.3/5)*5)),V=U.plot(vx,by,34,sw,[0,1],[-vl,vl]),jr=U.rng(7);
      o.push(S.RECT(vx,by,34,sw,3,"var(--screen)","line",1));o.push(S.T(vx+17,by-10,"上下","middle",10,"ink",true));
      [-vl,0,vl].forEach(function(v){o.push(S.T(vx+38,V.Y(v)+3,String(v),"start",8.5,"muted"));});
      var stv=Math.max(1,Math.floor(L/1200));for(var q=0;q<L;q+=stv){var u=d[3*(i0+q)+2];if(Math.abs(u)<vl)o.push(S.D(vx+5+24*jr.next(),V.Y(u),"gold",0.9));}
      [1,-1].forEach(function(sg){o.push(S.L(vx,V.Y(sg*st.v95),vx+34,V.Y(sg*st.v95),"alias",1.6,"4 2"));});
      var Hh=by+sw+44;
      o.push(S.LEGL(nar?8:sx-40,Hh,[["signal",null,"CEP"],["alias",null,"R95"],["ink","5 3","2DRMS"],["signal","2 3","7 章"]],9,8));
      /* (c) 100 本 */
      if(mc){var cx=nar?52:440,cy=nar?Hh+40:by,cw=nar?330:246,ceps=mc.map(function(q){return q[0];}),r95s=mc.map(function(q){return q[1];}),all=ceps.concat(r95s,[_W23_MIX.cep,_W23_MIX.r95]);
        var hi2=Math.ceil(Math.max.apply(null,all)*1.1),C=U.plot(cx,cy,cw,120,[0,hi2],[0.4,2.6]);
        o.push(S.T(nar?6:cx-40,cy-10,"(c) "+LN[L]+" の記録 100 本の値","start",11,"ink",true));
        o.push(C.axes({xl:"値 [m]",yt:[1,2],yfmt:function(v){return v===2?"CEP":"R95";},nx:5,ylOff:30}));
        var jj=U.rng(11);[[ceps,"signal",2],[r95s,"alias",1]].forEach(function(row){row[0].forEach(function(v){o.push(S.D(C.X(v),C.Y(row[2]+0.36*(jj.next()-0.5)),row[1],1.6));});
          var a5=_w23_q(row[0],0.05),a95=_w23_q(row[0],0.95);o.push(S.L(C.X(a5),C.Y(row[2]-0.32),C.X(a95),C.Y(row[2]-0.32),row[1],3));});
        [[_W23_MIX.cep,"signal"],[_W23_MIX.r95,"alias"]].forEach(function(z){o.push(S.L(C.X(z[0]),C.y,C.X(z[0]),C.y+C.h,z[1],1.1,"5 3"));});
        o.push(S.T(cx,cy+160,"太い線は 5〜95 %、破線は多くの日の値","start",9,"muted"));
        Hh=Math.max(Hh,cy+176);}
      box.set(S.svg(Wd,Hh+8,o));
      /* 読み出し */
      var rows=[["CEP（基準点のまわり）",_w23_f(st.cep,2),_w23_f(_W23_CH7.cep,2),_w23_f(_W23_MIX.cep,2)],["R95",_w23_f(st.r95,2),_w23_f(_W23_CH7.r95,2),_w23_f(_W23_MIX.r95,2)],
        ["2DRMS",_w23_f(st.d2,2),"−",_w23_f(_W23_MIX.d2,2)],["上下の 95 %",_w23_f(st.v95,1),_w23_f(_W23_CH7.v95,1),_w23_f(_W23_MIX.v95,1)],
        ["記録の中心のずれ",_w23_f(Math.hypot(st.me,st.mn),2),"0","0"],["中心のまわりの 50 %",_w23_f(st.sp,2),"−","−"]];
      var h=U.tbl(["量 [m]","この記録（"+LN[L]+"）","7 章の見積もり（24 時間の中央値）","多くの日の値"],rows,["left","right","right","right"]);
      if(mc){var ce=mc.map(function(q){return q[0];}),re=mc.map(function(q){return q[1];});h+=LN[L]+" の記録 100 本: CEP "+_w23_f(_w23_q(ce,0.05),2)+"〜"+_w23_f(_w23_q(ce,0.95),2)+" m、R95 "+_w23_f(_w23_q(re,0.05),2)+"〜"+_w23_f(_w23_q(re,0.95),2)+" m（5〜95 %）";}
      ro.innerHTML=h+'<div class="wnote">モデル: 東・北・上の誤差は、その時刻の衛星の並び（1 章の近似の配置、GPS・東京・仰角マスク 10°、1 分ごと）の σ<sub>UERE</sub><sup>2</sup>(G<sup>T</sup>G)<sup>−1</sup> の形で、大きさは、ゆっくり変わる部分（3.83 m、相関の時間 30 分の 1 次の自己回帰）と速く変わる部分（1.12 m、毎秒独立）の和。記録は 1 秒ごとに 48 時間（「別の日」で乱数を変える）。外れ値は、10 分ごとに確率 0.1 で 20〜100 s 続く、水平 20〜60 m・上下 10〜40 m のずれ。7 章の見積もりと多くの日の値は、7 章 5・6 節の式で求めた。</div>';
    }
    draw();
  };
