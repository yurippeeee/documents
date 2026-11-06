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
        if(nar&&i===4){g.push(S.T(xx+bw/2,y0+bh/2-2,"IF フィルタ","middle",9,"ink",true));g.push(S.T(xx+bw/2,y0+bh/2+10,"と増幅","middle",9,"ink",true));}
        else g.push(S.T(xx+bw/2,y0+bh/2+4,_W04_ST[i].nm,"middle",nar?9:10.5,"ink",true));
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
        o.push(S.L(P2.X(M.fLO),P2.y,P2.X(M.fLO),P2.y+P2.h,"gold",1.6,"5 3"));o.push(S.TX(P2.X(M.fLO),P2.y+10,"f_LO","middle",9,"gold",true,true));
        if(M.fim>zr[0]&&M.fim<zr[1]){o.push(S.L(P2.X(M.fim),P2.y,P2.X(M.fim),P2.y+P2.h,"teal",1.2,"2 3"));o.push(S.T(P2.X(M.fim),P2.y+22,"イメージ","middle",9,"teal",true,false,null,true));}
        M.jams(k).forEach(function(j){if(j[0]<zr[0]||j[0]>zr[1])return;o.push(S.ARR(P2.X(j[0]),P2.y+P2.h,P2.X(j[0]),P2.y+4,"alias",2,6));});
        o.push(S.RECT(P.X(zr[0]),P.y,P.X(zr[1])-P.X(zr[0]),P.h,0,"none","muted",1,"3 3"));
      }
      if(!rf){var fi=M.fIF;if(fi<=30){o.push(S.L(P.X(fi),P.y,P.X(fi),P.y+P.h,"signal",1,"3 3"));o.push(S.T(P.X(fi)+4,P.y+24,"中間周波数 "+_w04_f(fi,3),"start",9,"signal",true,false,null,true));}
        o.push(S.T(P.X(5.115)+4,P.y+40,"← IF フィルタの範囲","start",9,"muted",false,false,null,true));
        }
      var ly=P.y+P.h+46;o.push(S.LEGL(nar?52:66,ly,[["teal",null,"雑音"],["signal",null,"信号"],["alias",null,"妨害（連続波。矢印と電力の値）"]],9,12));
      if(!rf){var sumT="和の成分は "+_w04_f(_W04_FL1+M.fLO,1)+" MHz（図の外。IF フィルタで除く）";if(nar){ly+=18;o.push(S.T(6,ly,sumT,"start",9,"purple",true));}else o.push(S.T(P.x+P.w,P.y-4,sumT,"end",9,"purple",true));}
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

  /* ---- 3 節: サンプリングと量子化（標本にした後のスペクトラム ↔ 値の分布 ↔ 相関の後の SN 比の損失） ---- */
  var _W04_FSL=[32.736,16.368,10.912,10.23,8.184,5.456,4.092],_W04_HT={},_W04_SH={};
  /* H(t) = ∫0^t B sinc(Bu) du（理想の低域フィルタのステップ応答の半分）を 1/256 チップごとの表にする */
  function _w04_Htab(B){var key=String(B);if(_W04_HT[key])return _W04_HT[key];
    var res=256,span=26,n=span*res,dt=1/1.023e6/res,H=new Float64Array(n+1),prev=B;
    for(var i=1;i<=n;i++){var x=B*i*dt,h=B*Math.sin(Math.PI*x)/(Math.PI*x);H[i]=H[i-1]+(prev+h)/2*dt;prev=h;}
    return (_W04_HT[key]={H:H,n:n,dt:dt});}
  function _w04_Hv(T,t){var a=Math.abs(t)/T.dt;if(a>=T.n)return (t<0?-1:1)*T.H[T.n];var i=Math.floor(a),f=a-i,v=T.H[i]*(1-f)+T.H[i+1]*f;return t<0?-v:v;}
  /* 量子化器: mode 0 = 1 bit、1 = 2 bit（±1・±3、しきい値 γσ）、2 = 3 bit（±1〜±7、段の幅 γσ）、3 = しない */
  function _w04_quantizer(mode,beta){
    if(mode===3)return {g:1,Eq2:1,Rq:function(r){return r;},q:function(x){return x;}};
    if(mode===0)return {g:Math.sqrt(2/Math.PI),Eq2:1,Rq:function(r){return 2/Math.PI*Math.asin(Math.max(-1,Math.min(1,r)));},q:function(x){return x>=0?1:-1;}};
    var th=mode===1?[beta]:[beta,2*beta,3*beta],lv=mode===1?[1,3]:[1,3,5,7],phi=function(x){return Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);};
    var Phi=function(x){var z=Math.abs(x)/Math.SQRT2,t=1/(1+0.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?1-r/2:r/2;};
    var jumps=[[0,2*lv[0]]];th.forEach(function(t,j){jumps.push([t,2*(lv[j+1]-lv[j])]);});
    var NT=41,cs=new Float64Array(NT),fac=new Float64Array(NT);fac[0]=1;for(var n=1;n<NT;n++)fac[n]=fac[n-1]*n;
    for(n=1;n<NT;n+=2){var v=0;jumps.forEach(function(jh){var x=jh[0],h0=1,h1=x,he;if(n-1===0)he=1;else{for(var m=1;m<n-1;m++){var h2=x*h1-m*h0;h0=h1;h1=h2;}he=h1;}v+=jh[1]*phi(x)*he;});cs[n]=v;}
    var edges=[0].concat(th),Eq2=0;for(var j=0;j<lv.length;j++){var a=edges[j],b=j+1<edges.length?edges[j+1]:Infinity;Eq2+=2*((b===Infinity?1:Phi(b))-Phi(a))*lv[j]*lv[j];}
    return {g:cs[1],Eq2:Eq2,Rq:function(r){var s=0,p=r,r2=r*r;for(var n=1;n<NT;n+=2){s+=cs[n]*cs[n]/fac[n]*p;p*=r2;}return s;},
      q:function(x){var a=Math.abs(x),k=0;while(k<th.length&&a>=th[k])k++;return (x>=0?1:-1)*lv[k];}};
  }
  /* 帯域 [fL, fH] が、f_s/2 ごとの区間の境目をまたぐか。返り値 {ok, fa（見かけの中間周波数）, inv, deg（位相が失われる）} */
  function _w04_fold(fif,B,fs){var h=fs/2,fL=fif-B/2,fH=fif+B/2,zl=Math.floor((fL+1e-9)/h),zh=Math.floor((fH-1e-9)/h),fa=fif%fs,inv=false;if(fa>h){fa=fs-fa;inv=true;}
    var deg=Math.abs(fa)<1e3||Math.abs(fa-h)<1e3;return {ok:zl===zh,fa:fa,inv:inv,deg:deg,fL:fL,fH:fH};}
  /* 共通の部分（フィルタを通した信号の標本・局部の参照・参照の自己相関）を計算して残す */
  function _w04_shared(U,B,fs){var key=B+"_"+fs;if(_W04_SH[key])return _W04_SH[key];
    var J=Math.round(fs*1e-3),RC=1.023e6,TC=1/RC,fif=4.092e6,PM=U.gnss.pm(1),Ht=_w04_Htab(B),F=_w04_fold(fif,B,fs),fa=F.fa;
    var s=new Float64Array(J),rI=new Float64Array(J),rQ=new Float64Array(J),sI=0,sQ=0;
    for(var k=0;k<J;k++){var t=k/fs,n0=Math.floor(t*RC),a=0;
      for(var d=-24;d<=24;d++){var n=n0+d,c=PM[((n%1023)+1023)%1023],tt=t-n*TC;a+=c*(_w04_Hv(Ht,tt)-_w04_Hv(Ht,tt-TC));}
      s[k]=a*Math.cos(2*Math.PI*fif*t+0.3);var lc=PM[n0%1023];rI[k]=lc*2*Math.cos(2*Math.PI*fa*t);rQ[k]=lc*2*Math.sin(2*Math.PI*fa*t);sI+=s[k]*rI[k];sQ+=s[k]*rQ[k];}
    var ML=Math.ceil(1.5*fs*TC),CI=new Float64Array(ML+1),CQ=new Float64Array(ML+1),rho=new Float64Array(ML+1);
    for(var m=0;m<=ML;m++){var ci=0,cq=0;for(k=0;k<J;k++){var k2=k+m;if(k2>=J)k2-=J;ci+=rI[k]*rI[k2];cq+=rQ[k]*rQ[k2];}CI[m]=ci;CQ[m]=cq;var x=B*m/fs;rho[m]=(m===0?1:Math.sin(Math.PI*x)/(Math.PI*x))*Math.cos(2*Math.PI*fif*m/fs);}
    return (_W04_SH[key]={J:J,s:s,rI:rI,rQ:rQ,sI:sI,sQ:sQ,CI:CI,CQ:CQ,rho:rho,ML:ML,F:F});}
  /* 弱い信号の近似の損失 [dB]（(C/N0) T_coh に対する値。N0 = 1、C = 1/2、T_coh = 1 ms） */
  function _w04_semi(U,B,fs,mode,beta){var Z=_w04_shared(U,B,fs),Qz=_w04_quantizer(mode,beta),VI=Qz.Eq2*Z.CI[0],VQ=Qz.Eq2*Z.CQ[0];
    for(var m=1;m<=Z.ML;m++){var r=Qz.Rq(Z.rho[m]);VI+=2*r*Z.CI[m];VQ+=2*r*Z.CQ[m];}
    VI/=Z.J*Z.J;VQ/=Z.J*Z.J;var sg=Math.sqrt(B),EI=Qz.g/sg*Z.sI/Z.J,EQ=Qz.g/sg*Z.sQ/Z.J;
    return 10*Math.log10((EI*EI+EQ*EQ)/(VI+VQ)/(0.5*1e-3));}
  REG.w04_quant=function(el,U){
    var S=U.S;
    U.head(el,"SAMPLING & QUANTIZATION","サンプリングと量子化 — 相関の後の SN 比の損失");
    var r1=U.ctrls(el);
    var fsS=U.select(r1,"サンプリング周波数 f<sub>s</sub>",["32.736 MHz","16.368 MHz（本文の例）","10.912 MHz","10.23 MHz（n = 1 の下限）","8.184 MHz（半分が中間周波数）","5.456 MHz（帯域通過サンプリング）","4.092 MHz（中間周波数と同じ）"],1,function(){mc=null;draw();});
    var bS=U.select(r1,"前段のフィルタの幅 B<sub>IF</sub>",["2.046 MHz（本文の例）","4.092 MHz"],0,function(){mc=null;draw();});
    var r2=U.ctrls(el);
    var qs=U.seg(r2,["1 bit","2 bit","3 bit","量子化しない"],1,function(i){bt.set(i===2?0.6:1.0);mc=null;draw();});
    var bt=U.slider(r2,"しきい値（2 bit）・段の幅（3 bit）",{min:0.2,max:2.5,step:0.05,value:1.0,fmt:function(v){return _w04_f(v,2)+" σ";},onInput:function(){mc=null;draw();}});
    var br=U.btnrow(el),seed=1,mc=null,busy=false;
    U.button(br,"本文の例（16.368 MHz・2 bit・1.0σ）",function(){fsS.set(1);bS.set(0);qs.set(1);bt.set(1.0);mc=null;draw();});
    U.button(br,"シミュレーションで確かめる（乱数で 48 回）",function(){runMC();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;mc=null;draw();});
    var box=U.svgbox(el),hb=U.svgbox(el),ro=U.readout(el);
    function cfg(){return {fs:_W04_FSL[fsS.get()]*1e6,B:bS.get()?4.092e6:2.046e6,mode:qs.get(),beta:bt.get()};}
    /* 乱数のシミュレーション: 同じ雑音で、量子化したものとしないものを比べる */
    function runMC(){if(busy)return;var c=cfg(),F=_w04_fold(4.092e6,c.B,c.fs);if(F.deg){mc={msg:"この f_s では中間周波数が 0 か f_s/2 に重なり、位相が失われるので比べない"};draw();return;}
      busy=true;var Z=_w04_shared(U,c.B,c.fs),J=Z.J,L=1;while(L<J)L*=2;var rg=U.rng(seed*104729+7),Qz=_w04_quantizer(c.mode,c.beta),Q0=_w04_quantizer(3,1);
      var cnt=new Float64Array(L),fL=F.fL,fH=F.fH,mean=0;
      for(var i=0;i<L;i++){var f=i*c.fs/L,n=0;for(var m=-Math.ceil(fH/c.fs)-1;m<=Math.ceil(fH/c.fs)+1;m++){var g=Math.abs(f+m*c.fs);if(g>=fL&&g<=fH)n++;}cnt[i]=Math.sqrt(n);mean+=n;}
      mean/=L;var sc=Math.sqrt(c.B/mean),M=24,PM=U.gnss.pm(1),pr=[],AMP=Math.sqrt(2*Math.pow(10,4.5)),IDEAL=Math.pow(10,4.5)*1e-3;   /* C/N0 = 45 dB-Hz（N0 = 1） */
      for(var p=0;p<M;p++){var code=new Int8Array(1023);for(var j=0;j<1023;j++)code[j]=rg.next()<0.5?1:-1;var aI=new Float64Array(J),aQ=new Float64Array(J);
        for(var k=0;k<J;k++){var ch=code[Math.floor(k/c.fs*1.023e6)%1023];aI[k]=ch*Z.rI[k]/PM[Math.floor(k/c.fs*1.023e6)%1023];aQ[k]=ch*Z.rQ[k]/PM[Math.floor(k/c.fs*1.023e6)%1023];}pr.push([aI,aQ]);}
      var K=48,done=0,acc=[{sI:0,sQ:0,n:[]},{sI:0,sQ:0,n:[]}],re=new Float64Array(L),im=new Float64Array(L),sg=Math.sqrt(c.B);
      for(var a=0;a<2;a++)for(p=0;p<M;p++)acc[a].n.push([0,0,0,0]);
      function step(){for(var it=0;it<4&&done<K;it++,done++){
          for(var i2=0;i2<L;i2++){re[i2]=rg.normal();im[i2]=0;}U.gnss.fft(re,im);for(i2=0;i2<L;i2++){re[i2]*=cnt[i2];im[i2]=-im[i2]*cnt[i2];}U.gnss.fft(re,im);
          for(var a2=0;a2<2;a2++){var QQ=a2?Q0:Qz,yI=0,yQ=0,pI=new Float64Array(M),pQ=new Float64Array(M);
            for(var k2=0;k2<J;k2++){var w=re[k2]/L*sc,qp=QQ.q((AMP*Z.s[k2]+w)/sg),qm=QQ.q((-AMP*Z.s[k2]+w)/sg),dq=(qp-qm)/2;yI+=dq*Z.rI[k2];yQ+=dq*Z.rQ[k2];
              for(var p2=0;p2<M;p2++){pI[p2]+=qp*pr[p2][0][k2];pQ[p2]+=qp*pr[p2][1][k2];}}
            acc[a2].sI+=yI/J;acc[a2].sQ+=yQ/J;for(p2=0;p2<M;p2++){var e=acc[a2].n[p2],vi=pI[p2]/J,vq=pQ[p2]/J;e[0]+=vi;e[1]+=vi*vi;e[2]+=vq;e[3]+=vq*vq;}}}
        if(done<K){mc={msg:"計算中… "+done+" / "+K+" 回"};draw();setTimeout(step,0);return;}
        var res=[];for(var a3=0;a3<2;a3++){var A=acc[a3],mI=A.sI/K,mQ=A.sQ/K,V=0;A.n.forEach(function(e){V+=(e[1]/K-Math.pow(e[0]/K,2))+(e[3]/K-Math.pow(e[2]/K,2));});V/=M;V*=K/(K-1);res.push(10*Math.log10((mI*mI+mQ*mQ)/V/IDEAL));}
        busy=false;mc={q:res[0],n:res[1],se:4.34*Math.sqrt(2/(K*M)),K:K,M:M};draw();}
      mc={msg:"計算中…"};draw();setTimeout(step,0);}
    function draw(){
      var c=cfg(),F=_w04_fold(4.092e6,c.B,c.fs),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* (a) 標本にした後のスペクトラム */
      var x0=nar?20:30,pw=nar?370:640,P=U.plot(x0,nar?46:30,pw,40,[0,17],[0,1]);
      o.push(S.T(nar?6:14,14,"(a) 帯域（"+_w04_f(F.fL/1e6,3)+"〜"+_w04_f(F.fH/1e6,3)+" MHz）が、標本の列でどこに見えるか","start",10.5,"ink",true));
      var h=c.fs/2e6;o.push(S.RECT(P.X(0),P.y,P.X(Math.min(17,h))-P.X(0),P.h,0,"var(--muted-soft)","none",0));
      o.push(P.axes({xl:"周波数 [MHz]（灰色: 0〜f_s/2、破線: f_s/2 の整数倍）",xt:[0,2,4,6,8,10,12,14,16],yt:[],grid:false}));
      for(var k=1;k*h<=17;k++)o.push(S.L(P.X(k*h),P.y-2,P.X(k*h),P.y+P.h,"muted",1,"3 3"));
      var fl=F.fL/1e6,fh=F.fH/1e6,fm=4.092;
      o.push(S.RECT(P.X(fl),P.y+3,P.X(fm)-P.X(fl),P.h-6,1,"none","signal",1,"3 2"));o.push(S.RECT(P.X(fm),P.y+3,P.X(fh)-P.X(fm),P.h-6,1,"none","signal",1,"3 2"));
      function fd(f){var r=f%(2*h);return r<=h?r:2*h-r;}
      if(F.ok){var a1=fd(fl),a2=fd(fm),b2=fd(fh);var lo1=Math.min(a1,a2),hi1=Math.max(a1,a2),lo2=Math.min(a2,b2),hi2=Math.max(a2,b2);
        o.push(S.RECT(P.X(lo1),P.y+7,P.X(hi1)-P.X(lo1),P.h-14,1,U.soft("signal"),"signal",1.2));o.push(S.RECT(P.X(lo2),P.y+7,P.X(hi2)-P.X(lo2),P.h-14,1,"signal","signal",1.2));}
      else{/* 重なる所を赤で */var segs=[];for(var j=0;j<=200;j++){var f=fl+(fh-fl)*j/200;segs.push(fd(f));}var mn=Math.min.apply(null,segs),mx=Math.max.apply(null,segs);
        o.push(S.RECT(P.X(mn),P.y+7,P.X(mx)-P.X(mn),P.h-14,1,U.soft("alias"),"alias",1.4));o.push(S.T(P.X((mn+mx)/2),P.y+P.h/2+4,"重なる","middle",9,"alias",true));}
      o.push(S.TX(nar?6:P.x+P.w,nar?30:P.y-6,"f_s = "+_w04_f(c.fs/1e6,3)+" MHz、見かけの中間周波数 "+_w04_f(F.fa/1e6,3)+" MHz"+(F.inv?"（裏返る）":""),nar?"start":"end",9.5,F.ok?"green":"alias",true));
      /* (b) 損失の棒 */
      var deg=F.deg,L0=deg?null:_w04_semi(U,c.B,c.fs,3,1),Lq=deg?null:_w04_semi(U,c.B,c.fs,c.mode,c.beta);
      var yb=nar?142:126,Q=U.plot(nar?150:220,yb+18,nar?220:300,74,[-3,0],[0,3]);
      o.push(S.TX(nar?6:14,yb,"(b) 相関の後の SN 比の損失（(C/N_0) T_{coh} に対して。弱い信号の近似の計算）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"損失 [dB]",xt:[-3,-2.5,-2,-1.5,-1,-0.5,0],yt:[],xfmt:function(v){return _w04_f(v,1);}}));
      var bars=deg?[]:[["フィルタと標本の間隔",L0,"muted"],["量子化の分",Lq-L0,"purple"],["合わせた損失",Lq,"alias"]];
      bars.forEach(function(b,i){var yy=Q.y+4+i*24,v=Math.max(-3,b[1]);o.push(S.RECT(Q.X(v),yy,Q.X(0)-Q.X(v),16,2,U.soft(b[2]),b[2],1.1));
        o.push(S.T(Q.x-8,yy+12,b[0],"end",9.5,b[2],true));o.push(S.T(Q.X(v)-5,yy+12,_w04_f(b[1],2)+" dB","end",9.5,b[2],true,false,null,true));});
      if(deg)o.push(S.TX(Q.x+Q.w/2,Q.y+40,"中間周波数が 0 か f_s/2 に来て、位相が失われる（使えない）","middle",10,"alias",true));
      box.set(S.svg(Wd,Q.y+Q.h+44,o));
      /* (c) A/D 変換の入力の値の分布と量子化の段 */
      var g=[],rg=U.rng(seed*31+3),nb=40,hist=new Float64Array(nb),NSm=4000;for(var i=0;i<NSm;i++){var x=rg.normal(),bi=Math.floor((x+4)/8*nb);if(bi>=0&&bi<nb)hist[bi]++;}
      var hx=nar?44:64,H=U.plot(hx,26,nar?340:600,110,[-4,4],[0,1.15]),hmax=0;for(i=0;i<nb;i++)hmax=Math.max(hmax,hist[i]);
      g.push(S.T(nar?6:14,14,nar?"(c) A/D 変換の入力の値（σ: 雑音の標準偏差）と量子化の段":"(c) A/D 変換の入力の値（雑音でほぼ決まる。σ = 雑音の標準偏差）と、量子化の段","start",10.5,"ink",true));
      g.push(H.axes({xl:"入力 x/σ",xt:[-4,-3,-2,-1,0,1,2,3,4],yt:[],xfmt:function(v){return _w04_f(v,0);}}));
      for(i=0;i<nb;i++){var xa=-4+8*i/nb,xb2=xa+8/nb;g.push(S.RECT(H.X(xa)+0.5,H.Y(hist[i]/hmax),H.X(xb2)-H.X(xa)-1,H.Y(0)-H.Y(hist[i]/hmax),0,"var(--teal-soft)","teal",0.6));}
      var md=c.mode,Qz=_w04_quantizer(md,c.beta),lvmax=md===0?1:(md===1?3:7);
      if(md!==3){var pts=[];for(i=0;i<=400;i++){var xx=-4+8*i/400;pts.push([xx,0.55+0.5*Qz.q(xx)/lvmax]);}g.push(H.steps(pts,"signal",2));
        var ths=md===0?[0]:(md===1?[0,c.beta,-c.beta]:[0,c.beta,2*c.beta,3*c.beta,-c.beta,-2*c.beta,-3*c.beta]);
        ths.forEach(function(t){if(Math.abs(t)<=4)g.push(S.L(H.X(t),H.y,H.X(t),H.y+H.h,"signal",1,"3 3"));});
        g.push(S.T(H.X(3.9),H.Y(1.08),"出力（右の目盛 ±"+lvmax+"）","end",9,"signal",true,false,null,true));}
      else g.push(S.T(H.X(3.9),H.Y(1.08),"量子化しない（値をそのまま使う）","end",9,"signal",true,false,null,true));
      hb.set(S.svg(Wd,H.y+H.h+40,g));
      /* 読み出し */
      var t="",names=["1 bit","2 bit","3 bit","量子化しない"];
      if(!F.ok&&!deg)t+='<span class="warn">帯域の一部が f_s/2 の整数倍をまたいで、折り返した雑音が重なる</span><br>';
      if(deg)t+='<span class="warn">この f_s では、中間周波数が 0 か f_s/2 に折り返り、標本の列から搬送波の位相が分からなくなる（位相によっては信号が消える）</span><br>';
      else{
        t+="選んだ量子化（"+names[md]+(md===1||md===2?"、"+_w04_f(c.beta,2)+"σ":"")+"）: 合わせた損失 <b>"+_w04_f(Lq,2)+" dB</b>（量子化の分 "+_w04_f(Lq-L0,2)+" dB）→ 1 節の例（47.5 dB-Hz）なら、相関をとった後に見える C/N0 は "+_w04_f(47.45+Lq,1)+" dB-Hz、1 ms の後の SN 比は "+_w04_f(47.45+Lq-30,1)+" dB<br>";
        var row=[0,1,2,3].map(function(m){var b=m===1?1.0:(m===2?0.586:1);return names[m]+" "+_w04_f(_w04_semi(U,c.B,c.fs,m,b),2)+" dB";});
        t+="この f_s と B_IF での比較（2 bit は 1.0σ、3 bit は 0.59σ）: "+row.join("、")+"<br>";
        t+="掛けて足す計算（4・5 節）: 衛星 1 つあたり 1 秒に "+_w04_f(6*c.fs/1e4,0)+" 万回（f_s に比例）<br>";}
      if(mc){if(mc.msg)t+=mc.msg;else t+="シミュレーション（"+mc.K+" 回、雑音の探り "+mc.M+" 本）: 量子化しない "+_w04_f(mc.n,2)+" dB、"+names[md]+" "+_w04_f(mc.q,2)+" dB、量子化の分 <b>"+_w04_f(mc.q-mc.n,2)+" dB</b>（近似の計算 "+_w04_f(Lq-L0,2)+" dB。ばらつきの目安 ±"+_w04_f(mc.se,2)+" dB）";}
      ro.innerHTML=U.htx(t)+'<div class="wnote">中間周波数 4.092 MHz、PRN 1、積分の時間 1 ms。前段は幅 B<sub>IF</sub> の理想のフィルタ。損失は、信号が雑音より十分弱いとして、標本どうしの雑音の相関を含めて計算した値（本文の図の線と同じ計算）。シミュレーションは、同じ雑音で量子化したものとしないものを比べ、信号の分は ± の信号の差、雑音の分は乱数の符号との相関で測る。</div>';
    }
    draw();
  };

  /* ---- 4 節: 相関器（局部の符号・搬送波のずれ ↔ I・Q の点 ↔ 三角形の上の E・P・L ↔ 足していく和） ---- */
  function _w04_gauss(rg){var u=0,v=0,s=0;do{u=2*rg.next()-1;v=2*rg.next()-1;s=u*u+v*v;}while(s>=1||s===0);var m=Math.sqrt(-2*Math.log(s)/s);return [u*m,v*m];}
  REG.w04_correlator=function(el,U){
    var S=U.S,FS=16.368e6,FIF=4.092e6,RC=1.023e6,PM=U.gnss.pm(1);
    U.head(el,"CORRELATOR","相関器 — 局部の符号と搬送波を合わせる・ずらす");
    var r1=U.ctrls(el);
    var dt=U.slider(r1,"局部の符号のずれ Δτ（+ は局部が遅れ）",{min:-1.5,max:1.5,step:0.05,value:0.25,fmt:function(v){return _w04_f(v,2)+" チップ";},onInput:function(){draw();}});
    var dp=U.slider(r1,"搬送波の位相のずれ Δψ",{min:-180,max:180,step:5,value:30,fmt:function(v){return _w04_f(v,0)+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var dfS=U.slider(r2,"周波数のずれ Δf",{min:-1000,max:1000,step:25,value:0,fmt:function(v){return _w04_f(v,0)+" Hz";},onInput:function(){draw();}});
    var del=U.slider(r2,"E と L の間隔 Δ<sub>EL</sub>",{values:[0.1,0.2,0.5,1.0],value:1.0,fmt:function(v){return v+" チップ";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cn=U.slider(r3,"C/N0",{values:[30,35,40,45,50,99],value:45,fmt:function(v){return v>90?"雑音なし":v+" dB-Hz";},onInput:function(){draw();}});
    var tc=U.slider(r3,"積分の時間 T<sub>coh</sub>",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" ms";},onInput:function(){draw();}});
    var bit=U.checkbox(r3,"データのビットを −1 にする",false,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（0.25 チップ・30°・45 dB-Hz）",function(){dt.set(0.25);dp.set(30);dfS.set(0);del.set(1.0);cn.set(45);tc.set(1);bit.set(false);draw();});
    U.button(br,"合わせる（ずれを 0 に）",function(){dt.set(0);dp.set(0);dfS.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),tb=U.svgbox(el),ro=U.readout(el);
    function lam(x){return Math.max(0,1-Math.abs(x));}
    function sinc(x){return _w04_sinc(x);}
    function draw(){
      var Dt=dt.get(),Dp=dp.get()*Math.PI/180,Df=dfS.get(),De=del.get(),C0=cn.get(),T=tc.get()*1e-3,d=bit.get()?-1:1;
      var J=Math.round(FS*T),tau=100.3/RC,psi=0.7,rg=U.rng(seed*7919+17),sd=C0>90?0:Math.sqrt(0.5/Math.pow(10,C0/10)*FS/2);
      var R=T<=2e-3?24:(T<=5e-3?12:(T<=10e-3?8:6));
      /* 受けた信号（√(2C) = 1）と、局部の搬送波・符号（E・P・L）を作る */
      var sig=new Float64Array(J),c2=new Float64Array(J),s2=new Float64Array(J),cE=new Int8Array(J),cP=new Int8Array(J),cL=new Int8Array(J);
      for(var k=0;k<J;k++){var t=k/FS,ch=Math.floor((t-tau)*RC);sig[k]=d*PM[((ch%1023)+1023)%1023]*Math.cos(2*Math.PI*(FIF+Df)*t+psi);
        var th=2*Math.PI*FIF*t+psi-Dp;c2[k]=2*Math.cos(th);s2[k]=2*Math.sin(th);
        var b=t-tau-Dt/RC;cE[k]=PM[((Math.floor((b+De/2/RC)*RC)%1023)+1023)%1023];cP[k]=PM[((Math.floor(b*RC)%1023)+1023)%1023];cL[k]=PM[((Math.floor((b-De/2/RC)*RC)%1023)+1023)%1023];}
      var reps=[],run=null,stepRun=Math.max(1,Math.floor(J/300));
      for(var r=0;r<R;r++){var a=[0,0,0,0,0,0],pr=r===0?[]:null,acI=0,acQ=0,g=[0,0];
        for(k=0;k<J;k++){var w=0;if(sd>0){if(k%2===0)g=_w04_gauss(rg);w=sd*g[k%2];}var y=sig[k]+w,yc=y*c2[k],ys=y*s2[k];
          a[0]+=yc*cE[k];a[1]+=ys*cE[k];a[2]+=yc*cP[k];a[3]+=ys*cP[k];a[4]+=yc*cL[k];a[5]+=ys*cL[k];
          if(pr){acI+=yc*cP[k];acQ+=ys*cP[k];if(k%stepRun===0||k===J-1)pr.push([(k+1)/FS*1e3,acI/J,acQ/J]);}}
        for(var q=0;q<6;q++)a[q]/=J;reps.push(a);if(pr)run=pr;}
      /* 式の値: (I, Q) = d Λ(Δτ) sinc(Δf T)(cos Δψ̄, −sin Δψ̄)、Δψ̄ = Δψ + πΔf T（平均の位相のずれ） */
      var ph=Dp+Math.PI*Df*T,sc=sinc(Df*T),offs=[-De/2,0,De/2],fm=offs.map(function(o){var v=d*lam(Dt+o)*sc;return [v*Math.cos(ph),-v*Math.sin(ph)];});
      var nar=_w04_nar(box),Wd=nar?400:700,o=[],cols=["green","signal","gold"],nm=["E","P","L"];
      /* (a) I・Q 平面 */
      var pw=nar?170:230,P=U.plot(nar?36:60,28,pw,pw,[-1.3,1.3],[-1.3,1.3]);
      o.push(S.T(nar?6:14,16,"(a) I・Q の平面（√(2C) = 1）","start",10.5,"ink",true));
      o.push(P.axes({xl:"I",yl:"Q",xt:[-1,0,1],yt:[-1,0,1],xfmt:function(v){return _w04_f(v,0);},yfmt:function(v){return _w04_f(v,0);},ylOff:nar?24:30}));
      o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"muted",1));o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
      var cir=[];for(var i=0;i<=120;i++){var an=2*Math.PI*i/120;cir.push([Math.cos(an),Math.sin(an)]);}o.push(P.line(cir,"faint",1.1,"4 3"));
      for(r=1;r<R;r++)for(q=0;q<3;q++)o.push(S.D(P.X(Math.max(-1.3,Math.min(1.3,reps[r][2*q]))),P.Y(Math.max(-1.3,Math.min(1.3,reps[r][2*q+1]))),cols[q],1.8));
      for(q=0;q<3;q++){o.push(S.CIRC(P.X(fm[q][0]),P.Y(fm[q][1]),5,"ink",1.4,"screen"));}
      for(q=0;q<3;q++){var xI=Math.max(-1.3,Math.min(1.3,reps[0][2*q])),xQ=Math.max(-1.3,Math.min(1.3,reps[0][2*q+1]));o.push(S.D(P.X(xI),P.Y(xQ),cols[q],4.2));
        o.push(S.T(P.X(xI)+6,P.Y(xQ)-5,nm[q],"start",9.5,cols[q],true,false,null,true));}
      /* (b) 三角形の上の 3 点 */
      var bx=nar?230:370,Q=U.plot(bx,28,nar?160:300,nar?110:150,[-1.6,1.6],[0,1.15]);
      o.push(S.T(bx-(nar?20:30),16,nar?"(b) 大きさ √(I² + Q²)":"(b) 大きさ √(I² + Q²) と局部の符号のずれ","start",10.5,"ink",true));
      o.push(Q.axes({xl:"局部の符号のずれ [チップ]",xt:[-1.5,-1,-0.5,0,0.5,1,1.5],yt:[0,0.5,1],xfmt:function(v){return _w04_f(v,1);},yfmt:function(v){return _w04_f(v,1);}}));
      var tri=[];for(i=0;i<=160;i++){var x=-1.6+3.2*i/160;tri.push([x,lam(x)*Math.abs(sc)]);}o.push(Q.line(tri,"faint",1.8));
      for(q=0;q<3;q++){var xo=Dt+offs[q],mag=Math.hypot(reps[0][2*q],reps[0][2*q+1]);if(xo<-1.6||xo>1.6)continue;
        o.push(S.L(Q.X(xo),Q.Y(0),Q.X(xo),Q.Y(Math.min(1.15,mag)),cols[q],1.2,"3 2"));o.push(S.D(Q.X(xo),Q.Y(Math.min(1.15,mag)),cols[q],4.4));
        o.push(S.CIRC(Q.X(xo),Q.Y(lam(xo)*Math.abs(sc)),4.5,"ink",1.2,"none"));
        o.push(S.T(Q.X(xo)+(q===0?-6:(q===2?6:0)),Q.Y(Math.min(1.15,mag))-(q===1?11:5),nm[q],q===0?"end":(q===2?"start":"middle"),9.5,cols[q],true,false,null,true));}
      var hb=Math.max(P.y+P.h,Q.y+Q.h)+46;o.push(S.LEGL(nar?6:14,hb,[["green",null,"E"],["signal",null,"P"],["gold",null,"L"],["ink",null,"○: 式の値"]],9,12));
      box.set(S.svg(Wd,hb+10,o));
      /* (c) 足していく和（P、1 回目の積分） */
      var g2=[],Z=U.plot(nar?44:60,24,nar?340:620,120,[0,T*1e3],[-1.2,1.2]);
      g2.push(S.TX(nar?6:14,14,"(c) P の和の増え方（和 ÷ J。最後の値が I_P・Q_P）","start",10.5,"ink",true));
      g2.push(Z.axes({xl:"積分の中の時間 [ms]",yl:"和 ÷ J",xt:U.nice(0,T*1e3,5),yt:[-1,-0.5,0,0.5,1],xfmt:function(v){return _w04_f(v,1);},yfmt:function(v){return _w04_f(v,1);},ylOff:34}));
      g2.push(S.L(Z.x,Z.Y(0),Z.x+Z.w,Z.Y(0),"muted",1));
      g2.push(Z.line([[0,0],[T*1e3,fm[1][0]]],"signal",1,"5 3"));g2.push(Z.line([[0,0],[T*1e3,fm[1][1]]],"purple",1,"5 3"));
      g2.push(Z.clip(run.map(function(v){return [v[0],v[1]];}),"signal",1.8));g2.push(Z.clip(run.map(function(v){return [v[0],v[2]];}),"purple",1.8));
      g2.push(S.LEGL(nar?44:60,Z.y+Z.h+40,[["signal",null,"I_P の和"],["purple",null,"Q_P の和"],["muted","5 3","雑音が無いときの増え方（式）"]],9,12));
      tb.set(S.svg(Wd,Z.y+Z.h+48,g2));
      /* 読み出し */
      var rows=[0,1,2].map(function(q2){var a0=reps[0];return [nm[q2],_w04_f(a0[2*q2],3),_w04_f(a0[2*q2+1],3),_w04_f(Math.hypot(a0[2*q2],a0[2*q2+1]),3),_w04_f(fm[q2][0],3),_w04_f(fm[q2][1],3),_w04_f(Math.hypot(fm[q2][0],fm[q2][1]),3)];});
      var h=U.tbl(["","I（計算）","Q（計算）","大きさ","I（式）","Q（式）","大きさ（式）"],rows,["left","right","right","right","right","right","right"]);
      var mE=Math.hypot(reps[0][0],reps[0][1]),mL=Math.hypot(reps[0][4],reps[0][5]),pp=Math.atan2(-reps[0][3],reps[0][2])*180/Math.PI;
      h+="E と L の大きさの差 = <b>"+_w04_f(mE-mL,3)+"</b>（式 "+_w04_f(Math.abs(sc)*(lam(Dt-De/2)-lam(Dt+De/2)),3)+"）"+(De===1&&Math.abs(Dt)<=0.5?" → 頂点は局部の符号より "+_w04_f((mE-mL)/2,2)+" チップずれた所（本当は "+_w04_f(Dt,2)+"）":"")+"<br>";
      h+="P の点の角度から読んだ位相のずれ "+_w04_f(pp,1)+"°（式の平均の位相のずれ <span style=\"text-decoration:overline\">Δψ</span> = Δψ + πΔf T_coh = "+_w04_f(ph*180/Math.PI+(d<0?180:0),1)+"°"+(d<0?"。データが −1 なので 180° 足した値":"")+"）、周波数のずれによる倍率 sinc(Δf T_coh) = "+_w04_f(sc,3)+"<br>";
      if(C0<90){var snr=Math.pow(10,C0/10)*T*Math.pow(lam(Dt)*sc,2);h+="P の相関の後の SN 比（式）(C/N0) T_coh Λ² sinc² = <b>"+_w04_f(10*Math.log10(Math.max(snr,1e-12)),1)+" dB</b>、I と Q のそれぞれの雑音の標準偏差 √(N0/T_coh) = "+_w04_f(Math.sqrt(1/(2*Math.pow(10,C0/10)*T)),3)+"<br>";}
      if(Math.abs(Df)*T>=1)h+='<span class="warn">周波数のずれが 1/T_coh 以上で、和がほとんど 0 になる（3 章 4 節）</span><br>';
      ro.innerHTML=U.htx(h)+'<div class="wnote">中間周波数 4.092 MHz・16.368 MHz の標本（PRN 1、√(2C) = 1）に、白色雑音を足して計算した。(a) の大きな点は 1 回目の積分、小さな点は別の雑音で '+(R-1)+' 回繰り返した値。○ は式の値。</div>';
    }
    draw();
  };

  /* ---- 5 節: チャネル（空の衛星の並び ↔ 各チャネルの符号の位相とドップラー） ---- */
  var _W04_MU=3.986004418e14,_W04_WE=7.2921151467e-5,_W04_AW=6378137,_W04_FW=1/298.257223563,_W04_E2=_W04_FW*(2-_W04_FW),_W04_D=Math.PI/180,_W04_CL=299792458;
  function _w04_geod(B,L,h){B*=_W04_D;L*=_W04_D;var N=_W04_AW/Math.sqrt(1-_W04_E2*Math.sin(B)*Math.sin(B));return [(N+h)*Math.cos(B)*Math.cos(L),(N+h)*Math.cos(B)*Math.sin(L),(N*(1-_W04_E2)+h)*Math.sin(B)];}
  var _W04_RX={B:35.681,L:139.767,r0:_w04_geod(35.681,139.767,40)};
  var _W04_SATS=(function(){var o=[];for(var p=0;p<6;p++)for(var s=0;s<4;s++)o.push({nm:"G"+(p*4+s+1),a:26560e3,i:55,Om:60*p,M:90*s+15*p});return o;})();
  /* 円軌道の衛星の ECEF の位置（1 章と同じ近似の配置） */
  function _w04_satpos(s,t){var n=Math.sqrt(_W04_MU/Math.pow(s.a,3))/_W04_D,u=(s.M+n*t)*_W04_D,O=s.Om*_W04_D,inc=s.i*_W04_D,a=s.a;
    var q=[a*(Math.cos(O)*Math.cos(u)-Math.sin(O)*Math.sin(u)*Math.cos(inc)),a*(Math.sin(O)*Math.cos(u)+Math.cos(O)*Math.sin(u)*Math.cos(inc)),a*Math.sin(u)*Math.sin(inc)];
    var th=_W04_WE*t,c=Math.cos(th),sn=Math.sin(th);return [q[0]*c+q[1]*sn,-q[0]*sn+q[1]*c,q[2]];}
  function _w04_elaz(p){var r0=_W04_RX.r0,d=[p[0]-r0[0],p[1]-r0[1],p[2]-r0[2]],b=_W04_RX.B*_W04_D,l=_W04_RX.L*_W04_D;
    var e=-Math.sin(l)*d[0]+Math.cos(l)*d[1],n=-Math.sin(b)*Math.cos(l)*d[0]-Math.sin(b)*Math.sin(l)*d[1]+Math.cos(b)*d[2],u=Math.cos(b)*Math.cos(l)*d[0]+Math.cos(b)*Math.sin(l)*d[1]+Math.sin(b)*d[2];
    return [Math.atan2(u,Math.hypot(e,n))/_W04_D,(Math.atan2(e,n)/_W04_D+360)%360,Math.hypot(d[0],d[1],d[2])];}
  function _w04_skyxy(cx,cy,R,el,az){var r=R*(90-el)/90;return [cx+r*Math.sin(az*_W04_D),cy-r*Math.cos(az*_W04_D)];}
  REG.w04_channels=function(el,U){
    var S=U.S,LAM=_W04_CL/1575.42e6;
    U.head(el,"CHANNELS","チャネル — 衛星ごとに符号の位相とドップラーに合わせる");
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"時刻（例の配置の始めから）",{min:0,max:43200,step:60,value:3600,fmt:function(v){var h=Math.floor(v/3600),m=Math.round((v-3600*h)/60);return h+" 時間 "+(m<10?"0":"")+m+" 分";},onInput:function(){draw();}});
    tm.el.style.flex="1 1 100%";
    var r2=U.ctrls(el);
    var pp=U.slider(r2,"基準の発振器（TCXO）の周波数の誤差",{min:-2,max:2,step:0.1,value:0,fmt:function(v){return _w04_f(v,1)+" ppm";},onInput:function(){draw();}});
    var ck=U.slider(r2,"受信機の時計のずれ δt<sub>r</sub>",{min:0,max:1000,step:1,value:0,fmt:function(v){return v+" μs";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var nch=U.slider(r3,"チャネルの数",{values:[4,6,8,12],value:12,fmt:function(v){return v+" チャネル";},onInput:function(){draw();}});
    var msk=U.slider(r3,"使う衛星の仰角の下限",{values:[0,5,10,15],value:5,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tm.get()+120;if(v>43200)v=0;tm.set(v);draw();},60);
    U.button(br,"本文の例（1 時間後・誤差なし）",function(){tick.stop();tm.set(3600);pp.set(0);ck.set(0);nch.set(12);msk.set(5);draw();});
    U.button(br,"再生（2 分ずつ進める）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"TCXO を +0.5 ppm に",function(){pp.set(0.5);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    var EIRP=-128.5-30+20*Math.log10(4*Math.PI*(Math.sqrt(26560e3*26560e3-Math.pow(6371e3*Math.cos(5*_W04_D),2))-6371e3*Math.sin(5*_W04_D))/LAM)+0.5;   /* 3 章の例の EIRP（26.4 dBW） */
    function cn0(el_,r){var ga=3-8*Math.pow((90-el_)/85,2),lfs=20*Math.log10(4*Math.PI*r/LAM);return EIRP+30+ga-lfs-0.5-_w04_dbmhz(175.1);}
    function draw(){
      var t=tm.get(),ppm=pp.get(),dtr=ck.get()*1e-6,N=nch.get(),mask=msk.get(),vis=[];
      _W04_SATS.forEach(function(s){var p=_w04_satpos(s,t),ea=_w04_elaz(p);if(ea[0]<mask)return;
        var rr=_w04_elaz(_w04_satpos(s,t+0.5))[2]-_w04_elaz(_w04_satpos(s,t-0.5))[2],fd=-rr/LAM,fda=fd-ppm*1e-6*1575.42e6;
        var cp=((ea[2]/_W04_CL+dtr)*1e3%1)*1023,tr=[];for(var k=1;k<=15;k++){var e2=_w04_elaz(_w04_satpos(s,t-k*120));tr.push([e2[0],e2[1]]);}
        vis.push({nm:s.nm,el:ea[0],az:ea[1],r:ea[2],fd:fd,fda:fda,cp:cp,tr:tr,cn:cn0(ea[0],ea[2])-0.74});});
      vis.sort(function(a,b){return b.el-a.el;});vis.forEach(function(v,i){v.ch=i<N?i+1:0;});
      var nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* (a) スカイプロット */
      var cx=nar?110:150,cy=nar?130:150,R=nar?92:112;
      o.push(S.T(nar?6:14,16,"(a) 東京の空（GPS、例の配置）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,R,"muted",1.3,"screen"));for(var az=0;az<360;az+=30){var e0=_w04_skyxy(cx,cy,R,0,az);o.push(S.L(cx,cy,e0[0],e0[1],"grid",1));}
      [30,60].forEach(function(e){o.push(S.CIRC(cx,cy,R*(90-e)/90,"faint",0.9,null,"3 3"));});
      [0,30,60].forEach(function(e){o.push(S.T(cx+3,cy-R*(90-e)/90+11,e+"°","start",9,"muted",false,false,null,true));});
      [[0,"北"],[90,"東"],[180,"南"],[270,"西"]].forEach(function(d){var q=_w04_skyxy(cx,cy,R+11,0,d[0]);o.push(S.T(q[0],q[1]+4,d[1],"middle",10,"ink",true));});
      if(mask>0)o.push(S.CIRC(cx,cy,R*(90-mask)/90,"alias",1,null,"2 3"));
      vis.forEach(function(v){var seg=v.tr.filter(function(q){return q[0]>=0;}).map(function(q){return _w04_skyxy(cx,cy,R,q[0],q[1]);});if(seg.length>1)o.push(S.PL(seg,"faint",1.1,null,"2 2"));});
      vis.forEach(function(v){var q=_w04_skyxy(cx,cy,R,v.el,v.az);if(v.ch){o.push(S.D(q[0],q[1],"signal",4.4));}else{o.push(S.CIRC(q[0],q[1],4.4,"alias",1.6,"screen"));}
        o.push(S.T(q[0]+6,q[1]+3.5,v.nm,"start",9,v.ch?"signal":"alias",true,false,null,true));});
      /* (b) 符号の位相とドップラーの平面 */
      var bx=nar?40:370,by=nar?262:30,P=U.plot(bx,by,nar?346:310,nar?160:220,[0,1023],[-5000,5000]);
      o.push(S.T(nar?6:bx-30,by-14,"(b) 各衛星の符号の位相と見かけのドップラー","start",10.5,"ink",true));
      o.push(P.axes({xl:"符号の位相 [チップ]",yl:"見かけのドップラー [Hz]",xt:[0,200,400,600,800,1000],yt:[-5000,-2500,0,2500,5000],xfmt:function(v){return String(v);},yfmt:function(v){return _w04_f(v,0);},ylOff:nar?34:44}));
      o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
      if(Math.abs(ppm)>1e-9)o.push(S.L(P.x,P.Y(-ppm*1e-6*1575.42e6),P.x+P.w,P.Y(-ppm*1e-6*1575.42e6),"gold",1.2,"5 3"));
      vis.forEach(function(v){var y=Math.max(-5000,Math.min(5000,v.fda));if(v.ch)o.push(S.D(P.X(v.cp),P.Y(y),"signal",4.2));else o.push(S.CIRC(P.X(v.cp),P.Y(y),4.2,"alias",1.6,"screen"));
        o.push(S.T(P.X(v.cp)+6,P.Y(y)+4,v.nm,"start",9,v.ch?"signal":"alias",true,false,null,true));});
      if(Math.abs(ppm)>1e-9)o.push(S.T(P.x+P.w-4,P.Y(-ppm*1e-6*1575.42e6)-5,"全部が "+_w04_f(-ppm*1e-6*1575.42e6,0)+" Hz ずれる","end",9,"gold",true,false,null,true));
      var hh=P.y+P.h+44;o.push(S.T(nar?6:14,hh,"青: チャネルで追う衛星、赤の ○: 見えているがチャネルが足りない衛星","start",9,"muted"));
      box.set(S.svg(Wd,hh+8,o));
      /* チャネルの表と読み出し */
      var rows=vis.filter(function(v){return v.ch;}).map(function(v){return [v.ch+"（"+v.nm+"）",_w04_f(v.el,1)+"°",_w04_f(v.cp,2),_w04_f(v.fda,0),_w04_g(4.092e6+v.fda,0),_w04_g(1.023e6*(1+v.fd/1575.42e6),2),_w04_f(v.cn,1)];});
      for(var i=rows.length;i<N;i++)rows.push([(i+1)+"（空き）","","","","","",""]);
      var h=U.tbl(["CH（衛星）","仰角","符号の位相","ドップラー","搬送波の NCO","符号の NCO","C/N0"],rows,["left","right","right","right","right","right","right"]);
      var nv=vis.length,nt=Math.min(nv,N);
      h+="見える衛星 "+nv+" 機（仰角 "+mask+"° 以上）、追う衛星 <b>"+nt+" 機</b>"+(nv>N?'。<span class="warn">チャネルが '+(nv-N)+' 機分足りない</span>':"")+"<br>";
      h+="基準の発振器の誤差 "+_w04_f(ppm,1)+" ppm → 全部の衛星に共通の見かけのドップラー "+_w04_f(-ppm*1e-6*1575.42e6,1)+" Hz。受信機の時計のずれ "+ck.get()+" μs → 全部の符号の位相が "+_w04_f((dtr*1e3%1)*1023,2)+" チップ（1 ms で割った余り）ずれる<br>";
      h+="相関器の計算: "+N+" チャネル × 6 × 1636.8 万 = 1 秒に "+_w04_g(N*6*16.368,1)+" M 回。プログラムに渡す数: 1 秒に "+_w04_g(N*6000,0)+" 個";
      ro.innerHTML=U.htx(h)+'<div class="wnote">表の単位: 符号の位相はチップ、ドップラー（基準の発振器の誤差を含む見かけの値）と搬送波の NCO の周波数は Hz、符号の NCO はチップ/s、C/N0 は dB-Hz。1 章と同じ近似の GPS の配置（6 つの軌道面に 4 機、半径 26 560 km の円軌道）と東京の受信機。搬送波の NCO は中間周波数 4.092 MHz に見かけのドップラーを加えた周波数、符号の NCO は 1.023 M チップ/s をドップラーと同じ割合で速めた値。C/N0 は 3 章の例（EIRP 26.4 dBW、例のアンテナの利得、システム雑音温度 175 K）から、2 bit・16.368 MHz の量子化などの損失 0.74 dB を引いた値。</div>';
    }
    draw();
  };
