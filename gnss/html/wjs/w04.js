  /* ===== 04 章 受信機の中 — RF フロントエンドから相関器まで ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w04_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w04_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w04_g(v,d){var s=_w04_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  function _w04_sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
  function _w04_db(x){return 10*Math.log10(Math.max(x,1e-300));}
  var _W04_FL1=1575.42,_W04_RC=1.023,_W04_KB=1.380649e-23;
  function _w04_dbmhz(T){return 10*Math.log10(_W04_KB*T)+30;}   /* 温度 T [K] の熱雑音の密度 [dBm/Hz] */

  /* ---- 2 節: RF フロントエンドの各段（周波数の見方 ↔ 時間の見方） ---- */
  /* 例の値: アンテナの雑音温度 100 K、最初の増幅器（LNA）18 dB・1 dB、混合器の段 20 dB・3 dB、中間周波数の段 68.5 dB・10 dB */
  var _W04_ST=[{k:"A",nm:"アンテナ",lab:"アンテナの出力"},{k:"B",nm:"LNA",lab:"LNA の後"},{k:"C",nm:"フィルタ",lab:"混合器の前のフィルタの後"},
    {k:"D",nm:"混合器",lab:"混合器の後"},{k:"E",nm:"IF フィルタ・増幅",lab:"中間周波数のフィルタと増幅の後"}];
  /* 混合器の前のフィルタの減衰 [dB]（例の形: 通す範囲 ±W MHz、外で最大 45 dB） */
  function _w04_rfatt(f,mode){if(mode===0)return 0;var W=mode===1?10:2,Ws=mode===1?15:4,d=Math.max(0,Math.abs(f-_W04_FL1)-W)/Ws;return 1.5+45*(1-Math.exp(-d*d));}
  /* 中間周波数のフィルタの減衰 [dB]（通す範囲 3.069〜5.115 MHz、例の形） */
  function _w04_ifatt(f){var d=Math.max(0,Math.abs(f-4.092)-1.023)/0.8;return 50*(1-Math.exp(-d*d));}
  REG.w04_chain=function(el,U){
    var S=U.S;
    U.head(el,"RF FRONT END","RF フロントエンドの各段 — 周波数の見方と時間の見方");
    var r1=U.ctrls(el);
    var st=U.select(r1,"見る段",_W04_ST.map(function(s,i){return String.fromCharCode(65+i)+": "+s.lab;}),3,function(){draw();});
    var r2=U.ctrls(el);
    var lo=U.slider(r2,"局部発振器の周波数 f<sub>LO</sub>",{min:1561,max:1590,step:0.004,value:1571.328,fmt:function(v){return _w04_f(v,3)+" MHz";},onInput:function(){draw();}});
    lo.el.style.flex="1 1 100%";
    var r3=U.ctrls(el);
    var flt=U.select(r3,"混合器の前のフィルタ",["なし","広い（±10 MHz、例）","狭い（±2 MHz、例）"],1,function(){draw();});
    var irm=U.checkbox(r3,"cos と sin の 2 つの混合器（イメージを 25 dB 弱める、例）",true,function(){draw();});
    var r4=U.ctrls(el);
    var jim=U.checkbox(r4,"イメージ周波数に妨害の電波（アンテナで −100 dBm）",false,function(){draw();});
    var jfar=U.checkbox(r4,"帯域の外の強い電波（1710 MHz・−30 dBm、例）",false,function(){draw();});
    var nz=U.checkbox(r4,"波形に雑音を足す",true,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（1571.328 MHz）",function(){lo.set(1571.328);flt.set(1);irm.set(true);jim.set(false);jfar.set(false);nz.set(true);st.set(3);draw();});
    U.button(br,"局部発振器を高い側に（1579.512 MHz）",function(){lo.set(1579.512);draw();});
    U.button(br,"イメージを除かない（フィルタ広い・混合器 1 つ）",function(){flt.set(1);irm.set(false);jim.set(true);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var dg=U.svgbox(el),box=U.svgbox(el),wv=U.svgbox(el),ro=U.readout(el),HB=[];
    U.ctl.drag(dg,function(type,x,y){if(type!=="down"||x==null)return false;for(var i=0;i<HB.length;i++){var b=HB[i];if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3]){st.set(i);draw();return false;}}return false;});
    /* 各段の値（dBm と dBm/Hz）。f は MHz */
    function model(){
      var fLO=lo.get(),fm=flt.get(),ir=irm.get(),fIF=Math.abs(_W04_FL1-fLO),side=_W04_FL1>=fLO?1:-1,fim=2*fLO-_W04_FL1;
      var N0a=_w04_dbmhz(100),Te1=(Math.pow(10,0.1)-1)*290,Te3=(Math.pow(10,0.3)-1)*290,Te4=(Math.pow(10,1.0)-1)*290;
      var G1=18,G3=20,G4=68.5,IRR=25;
      /* 点 B（LNA の後）の雑音の密度（周波数によらない） */
      var NB=_w04_dbmhz(100+Te1)+G1;
      function nC(f){var a=_w04_rfatt(f,fm);var lin=Math.pow(10,(NB-a)/10)+(a>0?(1-Math.pow(10,-a/10))*Math.pow(10,_w04_dbmhz(290)/10):0);return 10*Math.log10(lin);}
      function sA(f){var s=_w04_sinc((f-_W04_FL1)/_W04_RC);return -128.5+10*Math.log10(1/1.023e6)+10*Math.log10(Math.max(s*s,1e-12));}
      /* 混合器の出力の周波数 f'（≥ 0）に来る、入力の 2 つの周波数（求めたい側と反対側） */
      function inputs(fp){var up=fLO+fp,dn=fLO-fp;return side>0?{want:up,other:dn}:{want:dn,other:up};}
      var otherG=ir?-IRR:0;
      function nD(fp){var q=inputs(fp),a=Math.pow(10,(nC(q.want)+G3)/10),b=Math.pow(10,(nC(q.other)+G3+otherG)/10),m=Math.pow(10,(_w04_dbmhz(Te3)+G3)/10);return 10*Math.log10(a+b+m);}
      function sD(fp){var q=inputs(fp);var a=Math.pow(10,(sA(q.want)+G1-_w04_rfatt(q.want,fm)+G3)/10),b=Math.pow(10,(sA(q.other)+G1-_w04_rfatt(q.other,fm)+G3+otherG)/10);return 10*Math.log10(a+b);}
      function nE(fp){var ai=_w04_ifatt(fp);return 10*Math.log10(Math.pow(10,(nD(fp)-ai+G4)/10)+Math.pow(10,(_w04_dbmhz(Te4)+G4)/10));}
      function sE(fp){return sD(fp)-_w04_ifatt(fp)+G4;}
      /* 妨害（連続波）: [周波数, 電力] の列 */
      function jams(stage){var o=[];
        [[jim.get(),fim,-100],[jfar.get(),1710,-30]].forEach(function(j){if(!j[0])return;var f=j[1],p=j[2];
          if(stage===0){o.push([f,p]);return;}p+=G1;if(stage===1){o.push([f,p]);return;}p-=_w04_rfatt(f,fm);if(stage===2){o.push([f,p]);return;}
          var fp=Math.abs(f-fLO),want=(side>0)===(f>=fLO),pd=p+G3+(want?0:otherG);if(stage===3){o.push([fp,pd]);return;}o.push([fp,pd-_w04_ifatt(fp)+G4]);});
        return o;}
      /* 各段の信号の電力・帯域の中の雑音・C/N0（信号のある所の密度で） */
      var C=[-128.5,-110.5,-110.5-_w04_rfatt(_W04_FL1,fm),0,0],N0=[N0a,NB,nC(_W04_FL1),nD(fIF),nE(fIF)];
      C[3]=C[2]+G3;C[4]=C[3]-_w04_ifatt(fIF)+G4;
      return {fLO:fLO,fIF:fIF,fim:fim,side:side,nC:nC,sA:sA,nD:nD,sD:sD,nE:nE,sE:sE,jams:jams,C:C,N0:N0,NB:NB,G1:G1,fm:fm};
    }
    function draw(){
      var M=model(),k=st.get(),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* 構成図 */
      var g=[],bw=nar?62:104,gap=nar?12:30,x0=nar?6:14,y0=22,bh=40;HB=[];
      g.push(S.T(nar?4:10,14,"段の箱を押すと、その後の点の信号を表示する","start",9.5,"muted"));
      for(var i=0;i<5;i++){var xx=x0+i*(bw+gap),sel=i===k,c=i<3?"gold":(i===3?"purple":"signal");
        if(i===0){g.push(S.RECT(xx,y0,bw,bh,7,sel?U.soft("gold"):"panel",sel?"alias":"gold",sel?2.4:1.3));}
        else g.push(S.RECT(xx,y0,bw,bh,7,sel?U.soft(c):"panel",sel?"alias":c,sel?2.4:1.3));
        g.push(S.T(xx+bw/2,y0+bh/2+4,_W04_ST[i].nm,"middle",nar?9:10.5,"ink",true));
        HB.push([xx,y0,bw,bh]);
        var px=xx+bw+gap/2;g.push(S.CIRC(px,y0+bh/2,8,sel?"alias":"muted",1.4,sel?U.soft("alias"):"screen"));g.push(S.T(px,y0+bh/2+3.5,String.fromCharCode(65+i),"middle",9,sel?"alias":"muted",true));
        if(i<4)g.push(S.ARR(xx+bw,y0+bh/2,xx+bw+gap,y0+bh/2,"signal",1.4,5));}
      var mx=x0+3*(bw+gap)+bw/2;g.push(S.L(mx,y0+bh,mx,y0+bh+14,"gold",1.4));g.push(S.T(mx,y0+bh+26,"局部発振器 "+_w04_f(M.fLO,3)+" MHz","middle",nar?8.5:9.5,"gold",true));
      dg.set(S.svg(Wd,y0+bh+34,g));
      /* 周波数の見方 */
      var rf=k<3,fr=rf?[1540,1720]:[0,30],zr=rf?[_W04_FL1-14,_W04_FL1+14]:null;
      var pw=nar?332:(rf?300:600),lv={0:-200,1:-185,2:-185,3:-170,4:-100}[k],P2=null;
      var P=U.plot(nar?52:66,24,pw,170,fr,[lv,lv+110]);
      o.push(S.T(nar?6:14,14,"(a) 電力スペクトル密度（点 "+String.fromCharCode(65+k)+"）"+(rf?"":"　混合器の出力の周波数"),"start",10.5,"ink",true));
      o.push(P.axes({xl:"周波数 [MHz]",yl:"密度 [dBm/Hz]",xt:rf?[1540,1580,1620,1660,1700]:[0,5,10,15,20,25,30],yt:[lv,lv+20,lv+40,lv+60,lv+80,lv+100],yfmt:function(v){return _w04_f(v,0);},ylOff:44}));
      function curves(PP,lo_,hi_,n){var a=[],b=[],i;for(i=0;i<=n;i++){var f=lo_+(hi_-lo_)*i/n,nv,sv;
          if(k===0){nv=M.N0[0];sv=M.sA(f);}else if(k===1){nv=M.NB;sv=M.sA(f)+M.G1;}else if(k===2){nv=M.nC(f);sv=M.sA(f)+M.G1-_w04_rfatt(f,M.fm);}
          else if(k===3){nv=M.nD(f);sv=M.sD(f);}else{nv=M.nE(f);sv=M.sE(f);}
          a.push([f,nv]);b.push([f,sv]);}
        return {n:a,s:b};}
      var cv=curves(P,fr[0],fr[1],rf?720:600);
      if(!rf){o.push(S.RECT(P.X(3.069),P.y,P.X(5.115)-P.X(3.069),P.h,0,"var(--muted-soft)","none",0));}
      o.push(P.clip(cv.n,"teal",2));o.push(P.clip(cv.s,"signal",1.8));
      M.jams(k).forEach(function(j){if(j[0]<fr[0]||j[0]>fr[1])return;var rt=j[0]>(fr[0]+fr[1])/2;o.push(S.ARR(P.X(j[0]),P.y+P.h,P.X(j[0]),P.y+4,"alias",2,6));
        o.push(S.T(P.X(j[0])+(rt?-5:5),P.y+14,"妨害 "+_w04_f(j[1],1)+" dBm",rt?"end":"start",9,"alias",true,false,null,true));});
      if(rf&&!nar){
        /* 右: L1 のまわりの拡大 */
        P2=U.plot(430,24,250,170,zr,[lv,lv+110]);
        o.push(S.T(420,14,"L1 のまわり","start",10,"muted",true));
        o.push(P2.axes({xl:"周波数 [MHz]",xt:[1562,1568,1574,1580,1586],yt:[lv,lv+20,lv+40,lv+60,lv+80,lv+100],yfmt:function(){return "";}}));
        var c2=curves(P2,zr[0],zr[1],400);o.push(P2.clip(c2.n,"teal",2));o.push(P2.clip(c2.s,"signal",1.8));
        o.push(S.L(P2.X(M.fLO),P2.y,P2.X(M.fLO),P2.y+P2.h,"gold",1.6,"5 3"));o.push(S.T(P2.X(M.fLO),P2.y+10,"f_LO","middle",9,"gold",true,false,null,true));
        if(M.fim>zr[0]&&M.fim<zr[1]){o.push(S.L(P2.X(M.fim),P2.y,P2.X(M.fim),P2.y+P2.h,"teal",1.2,"2 3"));o.push(S.T(P2.X(M.fim),P2.y+22,"イメージ","middle",9,"teal",true,false,null,true));}
        M.jams(k).forEach(function(j){if(j[0]<zr[0]||j[0]>zr[1])return;o.push(S.ARR(P2.X(j[0]),P2.y+P2.h,P2.X(j[0]),P2.y+4,"alias",2,6));});
        o.push(S.RECT(P.X(zr[0]),P.y,P.X(zr[1])-P.X(zr[0]),P.h,0,"none","muted",1,"3 3"));
      }
      if(!rf){var fi=M.fIF;if(fi<=30){o.push(S.L(P.X(fi),P.y,P.X(fi),P.y+P.h,"signal",1,"3 3"));o.push(S.T(P.X(fi)+4,P.y+24,"中間周波数 "+_w04_f(fi,3),"start",9,"signal",true,false,null,true));}
        o.push(S.T(P.X(5.115)+4,P.y+40,"← IF フィルタの範囲","start",9,"muted",false,false,null,true));
        o.push(S.T(P.x+P.w,P.y-4,"和の成分は "+_w04_f(_W04_FL1+M.fLO,1)+" MHz（図の外。IF フィルタで除く）","end",9,"purple",true));}
      var ly=P.y+P.h+46;o.push(S.LEGL(nar?52:66,ly,[["teal",null,"雑音"],["signal",null,"信号"],["alias",null,"妨害（連続波。矢印と電力の値）"]],9,12));
      box.set(S.svg(Wd,ly+10,o));
      /* 時間の見方（周波数は縮めて描く: L1 を 1 チップに 16 周期、中間周波数は実際の比） */
      var q=[],NS=2*400,chips=[1,-1],rg=U.rng(seed*7919+5),RFs=16,IFs=M.fIF/_W04_RC,LOs=RFs-M.side*IFs,IMs=2*LOs-RFs;
      var snr=Math.pow(10,(M.C[Math.min(k,2)]-(M.N0[Math.min(k,2)]+63.1))/10);   /* 2.046 MHz の中の SN 比（真数） */
      if(k>=3)snr=Math.pow(10,(M.C[k]-(M.N0[k]+63.1))/10);
      var aI=new Float64Array(NS),aQ=new Float64Array(NS),bI=0,bQ=0,sm=0.06;   /* 狭い帯域の雑音（2 チップの幅の平均で滑らかにする） */
      for(var j=0;j<NS;j++){bI=bI*(1-sm)+sm*rg.normal();bQ=bQ*(1-sm)+sm*rg.normal();aI[j]=bI;aQ[j]=bQ;}
      var vI=0;for(j=0;j<NS;j++)vI+=aI[j]*aI[j]+aQ[j]*aQ[j];vI=Math.sqrt(vI/NS/2);
      var nsc=nz.get()?1/Math.sqrt(snr):0,jamA=0;
      if(jim.get()){var jp=k===0?-100:(-100+M.G1-(k>=2?_w04_rfatt(M.fim,M.fm):0));var cp=k===0?M.C[0]:(k===1?M.C[1]:M.C[2]);jamA=Math.sqrt(Math.pow(10,(jp-cp)/10));
        if(k>=3&&irm.get())jamA*=Math.pow(10,-25/20);}
      var sig=[],tot=[],tt=[];
      for(j=0;j<NS;j++){var t=j/400,a=chips[Math.min(1,Math.floor(t))],ph=0.6,s,n,x;
        var nI=aI[j]/vI*nsc,nQ=aQ[j]/vI*nsc;
        if(k<3){s=a*Math.cos(2*Math.PI*RFs*t+ph);n=nI*Math.cos(2*Math.PI*RFs*t)-nQ*Math.sin(2*Math.PI*RFs*t);x=s+n+jamA*Math.cos(2*Math.PI*IMs*t);}
        else if(k===3){var l=2*Math.cos(2*Math.PI*LOs*t);s=a*Math.cos(2*Math.PI*RFs*t+ph)*l;n=(nI*Math.cos(2*Math.PI*RFs*t)-nQ*Math.sin(2*Math.PI*RFs*t))*l;x=s+n+jamA*Math.cos(2*Math.PI*IMs*t)*l;}
        else{var inb=Math.abs(M.fIF-4.092)<1.023;s=inb?a*Math.cos(2*Math.PI*IFs*t+M.side*ph):0;n=nI*Math.cos(2*Math.PI*IFs*t)-nQ*Math.sin(2*Math.PI*IFs*t);x=s+n+(Math.abs(M.fIF-4.092)<1.023?jamA*Math.cos(2*Math.PI*IFs*t):0);}
        tt.push(t);sig.push(s);tot.push(x);}
      var am=0;tot.forEach(function(v){am=Math.max(am,Math.abs(v));});sig.forEach(function(v){am=Math.max(am,Math.abs(v)*5);});am=am*1.05||1;
      var Pw=U.plot(nar?20:30,22,nar?360:640,120,[0,2],[-am,am]);
      q.push(S.T(nar?6:14,14,"(b) 波形（点 "+String.fromCharCode(65+k)+"。周波数は縮めて描いた: L1 を 1 チップに 16 周期）","start",10.5,"ink",true));
      q.push(S.RECT(Pw.x,Pw.y,Pw.w,Pw.h,2,"screen","line",0.8));q.push(S.L(Pw.X(1),Pw.y,Pw.X(1),Pw.y+Pw.h,"faint",1,"3 3"));
      if(nz.get()||jim.get())q.push(Pw.line(tt.map(function(t,i){return [t,tot[i]];}),"teal",1.0));
      q.push(Pw.line(tt.map(function(t,i){return [t,sig[i]*5];}),"signal",1.6));
      q.push(S.T(Pw.X(0.5),Pw.y+Pw.h+14,"チップ +1","middle",9,"muted"));q.push(S.T(Pw.X(1.5),Pw.y+Pw.h+14,"チップ −1（位相が反転）","middle",9,"muted"));
      q.push(S.LEGL(nar?20:30,Pw.y+Pw.h+34,[["signal",null,"信号だけ（5 倍に拡大）"],["teal",null,"信号 + 雑音"+(jim.get()?" + 妨害":"")]],9,12));
      wv.set(S.svg(Wd,Pw.y+Pw.h+42,q));
      /* 読み出し */
      var Ck=M.C[k],N0k=M.N0[k],cn0=Ck-N0k,base=M.C[0]-_w04_dbmhz(100+(Math.pow(10,0.1)-1)*290);
      var h="点 "+String.fromCharCode(65+k)+"（"+_W04_ST[k].lab+"）: 信号の電力 <b>"+_w04_f(Ck,1)+" dBm</b>、雑音の密度 "+_w04_f(N0k,1)+" dBm/Hz（2.046 MHz の中で "+_w04_f(N0k+63.1,1)+" dBm）、帯域の中の SN 比 "+_w04_f(Ck-N0k-63.1,1)+" dB、C/N0 <b>"+_w04_f(cn0,1)+" dB-Hz</b>";
      if(k>=1)h+="（LNA の後の 47.7 dB-Hz との差 "+_w04_f(cn0-base,2)+" dB）";
      h+="<br>中間周波数 |f<sub>L1</sub> − f<sub>LO</sub>| = <b>"+_w04_f(M.fIF,3)+" MHz</b>、イメージ周波数 2f<sub>LO</sub> − f<sub>L1</sub> = "+_w04_f(M.fim,3)+" MHz（混合器の前のフィルタで "+_w04_f(_w04_rfatt(M.fim,M.fm)-(M.fm?1.5:0),1)+" dB 弱まる"+(irm.get()?"、2 つの混合器でさらに 25 dB":"")+"）";
      if(M.side<0)h+="。局部発振器が L1 より高いので、周波数の並びが裏返る（ドップラーの符号が逆になる）";
      if(Math.abs(M.fIF-4.092)>=1.023)h+='<br><span class="warn">中間周波数が IF フィルタの通す範囲（3.069〜5.115 MHz）から外れ、点 E では信号が通らない</span>';
      if(jim.get()&&k>=3){var jj=M.jams(k).filter(function(j){return Math.abs(j[0]-M.fIF)<0.01;});if(jj.length)h+='<br>イメージの妨害は中間周波数に来て、電力 '+_w04_f(jj[0][1],1)+' dBm（信号より '+_w04_f(jj[0][1]-Ck,1)+' dB '+(jj[0][1]>Ck?'強い':'弱い')+'）'+(jj[0][1]-Ck>-10?'。<span class="warn">フィルタか 2 つの混合器で、混合器より前に除く必要がある</span>':'');}
      if(jfar.get()){var pj=k===0?-30:(k===1?-30+M.G1:-30+M.G1-_w04_rfatt(1710,M.fm));h+="<br>1710 MHz の電波: 点 "+String.fromCharCode(65+Math.min(k,2))+" で "+_w04_f(pj,1)+" dBm"+(k===1||(k>=2&&M.fm===0)?'。<span class="warn">強いまま後の段に入ると、増幅器が飽和しうる（9 章 4 節）</span>':'。混合器の前のフィルタで弱まる');}
      ro.innerHTML=h+'<div class="wnote">値はどれも例の値（アンテナの雑音温度 100 K、LNA 18 dB・雑音指数 1 dB、混合器の段 20 dB・3 dB、中間周波数の段 68.5 dB・10 dB、フィルタは例の形）。信号の電力は L1 C/A の受信電力の最小値 −128.5 dBm。和の成分と、中間周波数のフィルタの外の雑音は、波形には描いていない。波形の周波数は描きやすい値に縮めた。</div>';
    }
    draw();
  };
