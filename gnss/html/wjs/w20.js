/* ===== 20 章 妨害とノイズの源 — どこから来て、どう効くか ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w20_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w20_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 例の受信機（9 章 1 節。f20.py と同じ値） */
var _W20_L1=1575.42,_W20_TC=1/1.023e6,_W20_N0=10*Math.log10(1.380649e-23*183.5)+30,_W20_C=-128.5,_W20_CN0=-128.5-(10*Math.log10(1.380649e-23*183.5)+30),
    _W20_BW=2.046e6,_W20_ACQ=35,_W20_TRK=25,_W20_DLL=20;
var _W20_NB=_W20_N0+10*Math.log10(_W20_BW),_W20_TCDB=10*Math.log10(_W20_TC);
/* GNSS の帯域（2 章 1 節の値）: [名前, 下の端, 上の端] [MHz] */
var _W20_BANDS=[["L1 C/A",1575.42-1.023,1575.42+1.023],["E1・B1C",1575.42-2.046,1575.42+2.046],["B1I",1561.098-2.046,1561.098+2.046],
  ["G1",1598.0625-0.511,1605.375+0.511],["L2",1227.60-1.023,1227.60+1.023],["L5",1176.45-10.23,1176.45+10.23]];
function _w20_db(x){return 10*Math.log10(x);}
function _w20_drop(r){return 10*Math.log10(1+r);}
function _w20_sinc(x){if(Math.abs(x)<1e-12)return 1;var p=Math.PI*x;return Math.sin(p)/p;}
function _w20_mhz(v){return v>=100?_w20_f(v,1)+" MHz":(v>=10?_w20_f(v,2)+" MHz":(v>=1?_w20_f(v,3)+" MHz":_w20_f(v*1000,v>=0.1?0:1)+" kHz"));}
/* 台形の波の n 次の成分の振幅 [V] と包絡線（f20.py の _f20_trap・_f20_trenv と同じ） */
function _w20_trap(A,f,tau,tr,n){var T=1/f;return 2*A*(tau/T)*Math.abs(_w20_sinc(n*tau/T))*Math.abs(_w20_sinc(n*tr/T));}
function _w20_dbuv(v){return 20*Math.log10(Math.max(v,1e-12)/1e-6);}
/* C/A 符号（±1）と、相関器から見た符号のスペクトラム S~(f) = M T_p |A1(f)|² D_M(f T_p)²（f20.py の _f20_st と同じ） */
var _W20_PMC={};
function _w20_pm(U,prn){if(!_W20_PMC[prn])_W20_PMC[prn]=U.gnss.pm(prn);return _W20_PMC[prn];}
function _w20_st(U,prn,f,M){var a=_w20_pm(U,prn),th=2*Math.PI*f*_W20_TC,c=Math.cos(th),s=Math.sin(th),re=0,im=0,pr=1,pi=0,n,t;
  for(n=0;n<1023;n++){re+=a[n]*pr;im+=a[n]*pi;t=pr*c-pi*s;pi=pr*s+pi*c;pr=t;}
  var sc=_w20_sinc(f*_W20_TC),A2=(re*re+im*im)/(1023*1023)*sc*sc,x=f*1e-3,sx=Math.sin(Math.PI*x),D=Math.abs(sx)<1e-9?1:Math.sin(Math.PI*M*x)/(M*sx);
  return M*1e-3*A2*D*D;}
/* 符号のスペクトラムの線（k kHz）の電力の割合 |c_k|²。|DFT|²/N² を表にし、チップの形の sinc² を掛ける */
var _W20_DFT={};
function _w20_line(U,prn,k){var N=1023;if(!_W20_DFT[prn]){var a=_w20_pm(U,prn),out=new Float64Array(N),ct=new Float64Array(N),st=new Float64Array(N),i,kk,nn;
    for(i=0;i<N;i++){ct[i]=Math.cos(2*Math.PI*i/N);st[i]=Math.sin(2*Math.PI*i/N);}
    for(kk=0;kk<N;kk++){var r=0,q=0,idx=0;for(nn=0;nn<N;nn++){if(a[nn]>0){r+=ct[idx];q-=st[idx];}else{r-=ct[idx];q+=st[idx];}idx+=kk;if(idx>=N)idx-=N;}out[kk]=(r*r+q*q)/(N*N);}
    _W20_DFT[prn]=out;}
  var m=((k%N)+N)%N,s=_w20_sinc(k/N);return _W20_DFT[prn][m]*s*s;}
/* 狭い帯域の雑音（中心 df [Hz]・幅 bj [Hz]・電力 1）の S~ との重なり ∫ S_J S~ df（線の和で近似: 線の幅 1/(M ms) の箱が帯域に入る割合） */
function _w20_ovl(U,prn,df,bj,M){var a=df-bj/2,b=df+bj/2,h=500/M,k0=Math.floor((a-h)/1000),k1=Math.ceil((b+h)/1000),s=0;
  if(bj<2*h)return _w20_st(U,prn,df,M);
  for(var k=k0;k<=k1;k++){var fk=k*1000,w=(Math.min(b,fk+h)-Math.max(a,fk-h))/(2*h);if(w>0)s+=Math.min(1,w)*_w20_line(U,prn,k);}
  return s/bj;}

/* ---- 3 節: 高調波が GNSS の帯域に落ちるか ---- */
var _W20_PRE=[["自由に（下のつまみ）",0,1,50,3.3],["DC-DC 500 kHz",0.5,2,66,5],["DC-DC 2 MHz",2,2,66,5],["DC-DC 2.7 MHz",2.7,2,66,5],["8 MHz",8,1,50,3.3],["10 MHz",10,1,50,3.3],
  ["19.2 MHz",19.2,1,50,3.3],["24 MHz",24,1,50,3.3],["25 MHz",25,1,50,3.3],["26 MHz（本文の例）",26,1,50,3.3],["27 MHz",27,1,50,3.3],["32 MHz",32,1,50,3.3],["40 MHz",40,1,50,3.3],["100 MHz",100,1,50,3.3]];
REG.w20_harmonic=function(el,U){
  var S=U.S;
  U.head(el,"HARMONICS","高調波が GNSS の帯域に落ちるか — 源の周波数と波形を変える");
  var r1=U.ctrls(el);
  var sel=U.select(r1,"源の例",_W20_PRE.map(function(p,i){return {v:String(i),t:p[0]};}),"9",function(v){var q=_W20_PRE[+v];if(q[1]>0){fr.set(q[1]);trs.set(q[2]);duty.set(q[3]);amp.set(q[4]);}draw();});
  var fr=U.slider(r1,"源の周波数 f",{min:0.1,max:200,log:true,step:0.0001,value:26,snap:function(v){return +v.toPrecision(5);},fmt:_w20_mhz,onInput:function(){sel.set("0");draw();}});
  var r2=U.ctrls(el);
  var trs=U.slider(r2,"立ち上がりの時間 t<sub>r</sub>",{min:0.2,max:20,log:true,value:1,fmt:function(v){return _w20_f(v,v<1?2:1)+" ns";},onInput:function(){draw();}});
  var duty=U.slider(r2,"時間の割合",{min:10,max:90,step:1,value:50,fmt:function(v){return v+" %";},onInput:function(){draw();}});
  var amp=U.slider(r2,"振幅",{min:0.5,max:12,step:0.1,value:3.3,fmt:function(v){return _w20_f(v,1)+" V";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function preset(i){var q=_W20_PRE[i];sel.set(String(i));fr.set(q[1]);trs.set(q[2]);duty.set(q[3]);amp.set(q[4]);draw();}
  U.button(br,"本文の例: 26 MHz",function(){preset(9);});
  U.button(br,"25 MHz（L1 に落ちる）",function(){preset(8);});
  U.button(br,"DC-DC 2 MHz",function(){preset(2);});
  var box=U.svgbox(el),ro=U.readout(el);
  function draw(){
    var f=fr.get(),tr=trs.get()*1e-9,D=duty.get()/100,A=amp.get(),fh=f*1e6,tau=D/fh,nar=_w20_nar(box),Wd=nar?400:700,o=[],res=[];
    /* (a) 波形 */
    var px=nar?44:60,pw=nar?150:220,P=U.plot(px,30,pw,64,[0,2],[-0.15*A,1.25*A]);
    o.push(S.T(nar?6:14,16,"(a) 2 周期の波形","start",11,"ink",true));
    var Tn=1,trn=Math.min(tr*fh,0.45),dn=Math.min(Math.max(D,trn+0.02),1-trn-0.02),pts=[];
    for(var k=0;k<2;k++){pts.push([k,0]);pts.push([k+trn,A]);pts.push([k+dn,A]);pts.push([k+dn+trn,0]);}pts.push([2,0]);
    o.push(S.RECT(P.x,P.y,P.w,P.h,4,"var(--screen)","line",0.8));
    o.push(P.line(pts,"alias",2));
    o.push(S.T(P.x+P.w/2,P.y+P.h+14,"時間（2 周期 = "+_w20_f(2e9/fh>=1000?2e6/fh:2e9/fh,2e9/fh>=1000?2:1)+(2e9/fh>=1000?" µs）":" ns）"),"middle",9,"muted"));
    var tx=nar?px+pw+10:px+pw+24;
    o.push(S.T(tx,44,"f = "+_w20_mhz(f),"start",nar?11:10,"ink",true));
    o.push(S.TX(tx,61,"t_r = "+_w20_f(tr*1e9,tr<1e-9?2:1)+" ns",nar?"start":"start",nar?10.5:9.5,"muted"));
    o.push(S.T(tx,77,"時間の割合 "+Math.round(D*100)+" %","start",nar?10.5:9.5,"muted"));
    if(!nar)o.push(S.T(tx,93,"線の高さ: 台形の波の各次の成分","start",9.5,"muted"));
    /* (b) 帯域ごとの帯 */
    var y0=142,sh=nar?52:48,xa=nar?92:150,xb=Wd-10;
    o.push(S.T(nar?6:14,y0-6,"(b) 各帯域のまわりの高調波（赤: 帯域に入る）","start",11,"ink",true));
    _W20_BANDS.forEach(function(bd,i){var lo=bd[1],hi=bd[2],c=(lo+hi)/2,hw=(hi-lo)/2,R=Math.max(3*hw,Math.min(2.2*f,40)),yy=y0+i*sh+8;
      var Q=U.plot(xa,yy,xb-xa,sh-22,[c-R,c+R],[20,150]);
      o.push(S.RECT(Q.X(lo),Q.y,Q.X(hi)-Q.X(lo),Q.h,0,U.soft("signal"),"none",0));
      o.push(S.L(Q.x,Q.y+Q.h,Q.x+Q.w,Q.y+Q.h,"muted",1));
      var n0=Math.ceil((c-R)/f),n1=Math.floor((c+R)/f),nin=[];
      for(var n=Math.ceil(lo/f-1e-12);n<=Math.floor(hi/f+1e-12);n++)nin.push(n);
      if(n1-n0>160){o.push(S.RECT(Q.x,Q.y+6,Q.w,Q.h-6,0,U.soft("muted"),"muted",0.6));
        o.push(S.T(Q.x+Q.w/2,Q.y+Q.h-4,"高調波が "+_w20_mhz(f)+" おきに密に並ぶ","middle",9,"alias",true,false,null,true));}
      else for(var m=n0;m<=n1;m++){var fq=m*f,inb=fq>=lo-1e-9&&fq<=hi+1e-9,am=_w20_trap(A,fh,tau,tr,m),lv=_w20_dbuv(am);
        if(am<1e-6*A){if(inb)o.push(S.L(Q.X(fq),Q.y+Q.h,Q.X(fq),Q.y+Q.h-12,"alias",1.4,"2 2"));continue;}
        o.push(S.L(Q.X(fq),Q.y+Q.h,Q.X(fq),Q.Y(Math.max(20,Math.min(150,lv))),inb?"alias":"muted",inb?2.2:1.2));}
      o.push(S.T(nar?6:14,yy+12,bd[0],"start",10,"signal",true));
      o.push(S.T(nar?6:14,yy+26,nin.length?(nin.length>3?nin.length+" 本":"n = "+nin.join("・")):"入らない","start",9.5,nin.length?"alias":"green",true));
      [-R,0,R].forEach(function(d){var x=Q.X(c+d);o.push(S.T(x,Q.y+Q.h+11,d===0?_w20_f(c,c%1?2:0):(d>0?"+":"−")+_w20_f(Math.abs(d),R<10?2:1),d===0?"middle":(d<0?"start":"end"),8.5,"muted"));});
      var lev=nin.length?nin.map(function(n){var am=_w20_trap(A,fh,tau,tr,n);return am<1e-6*A?null:_w20_dbuv(am);}):[];
      res.push({b:bd,n:nin,lev:lev,c:c});});
    var yend=y0+_W20_BANDS.length*sh+10;
    o.push(S.T(xb,yend,"横軸: 周波数 [MHz]（中央が帯域の中心）、縦軸: 線の高さ 20〜150 dBμV","end",9,"muted"));
    box.set(S.svg(Wd,yend+6,o));
    /* 表と読み出し */
    var rows=res.map(function(r){var ns=r.n;if(!ns.length)return [r.b[0],"—","—","—","—"];
      var show=ns.length>3?[ns[0],ns[ns.length-1]]:ns;
      return [r.b[0],ns.length>3?ns.length+" 本（"+ns[0]+"〜"+ns[ns.length-1]+"）":ns.join("・"),show.map(function(n){return _w20_f(n*f,3);}).join("・"),
        show.map(function(n){return (n*f-r.c>=0?"+":"−")+_w20_f(Math.abs(n*f-r.c),3);}).join("・"),
        (function(){var v=r.lev.filter(function(x){return x!==null;});return v.length?_w20_f(Math.max.apply(null,v),1):"0（出ない）";})()];});
    var h=U.tbl(["帯域","入る次数 n","周波数 nf [MHz]","中心からの差 [MHz]","線の高さ（最大） [dBμV]"],rows,["left","right","right","right","right"]);
    var l1=res[0],note=[];
    _W20_BANDS.forEach(function(bd){var w=bd[2]-bd[1];if(f<=w+1e-9)note.push(bd[0]+"（幅 "+_w20_f(w,3)+" MHz）");});
    h+="L1 C/A の帯域に入る高調波: <b>"+(l1.n.length?(l1.n.length>3?l1.n.length+" 本":l1.n.map(function(n){return "n = "+n+"（"+_w20_f(n*f,3)+" MHz）";}).join("・")):"無い")+"</b>";
    if(note.length)h+="。f が帯域の幅以下なので、必ず入る帯域: "+note.join("・");
    var zero=res.some(function(r){return r.lev.some(function(x){return x===null;});});
    if(zero)h+="<br>点線の次数は、この波形では高さが 0 になる（時間の割合 "+Math.round(D*100)+" % と次数の積が整数のとき。ちょうど 50 % の方形波では偶数次が出ない）。実際のクロックは時間の割合がわずかにずれるので、小さく出る（時間の割合を動かして確かめられる）";
    var near=Math.round(_W20_L1/f);h+="<br>L1 に最も近い高調波: n = "+near+"（"+_w20_f(near*f,3)+" MHz、中心から "+((near*f-_W20_L1)>=0?"+":"−")+_w20_f(Math.abs(near*f-_W20_L1),3)+" MHz）";
    ro.innerHTML=h+'<div class="wnote">帯域の端は 2 章 1 節の値から、L1 C/A・L2 は ±1.023 MHz、E1・B1C・B1I は ±2.046 MHz、L5 は ±10.23 MHz、G1 は 1597.55〜1605.89 MHz とした。線の高さは、振幅・時間の割合・立ち上がり t<sub>r</sub> の台形の波の式（源の所の電圧。どれだけ受信機に届くかは道で決まる）。</div>';
  }
  draw();
};

/* ---- 4 節: 妨害の形・電力・周波数と等価な C/N0 ---- */
REG.w20_cn0drop=function(el,U){
  var S=U.S;
  U.head(el,"C/N0 DROP","妨害が C/N<sub>0</sub> を下げる仕組み — 逆拡散の前と後、等価な C/N<sub>0</sub>");
  var r1=U.ctrls(el);
  var kind=U.select(r1,"妨害の形",[{v:"cw",t:"連続波"},{v:"nb",t:"狭い帯域の雑音"},{v:"bb",t:"帯域に平らな雑音"}],"cw",function(){draw();});
  var pj=U.slider(r1,"妨害の電力 P<sub>J</sub>",{min:-150,max:-80,step:0.5,value:-106,fmt:function(v){return _w20_f(v,1)+" dBm";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var dfc=U.slider(r2,"搬送波との差 Δf<sub>J</sub>（粗く）",{min:-1500,max:1500,step:1,value:7,fmt:function(v){return _w20_f(v,0)+" kHz";},onInput:function(){draw();}});
  var dff=U.slider(r2,"（細かく）",{min:-500,max:500,step:10,value:0,fmt:function(v){return (v>=0?"+":"−")+Math.abs(v)+" Hz";},onInput:function(){draw();}});
  var bj=U.slider(r2,"狭い帯域の幅",{min:1,max:1000,log:true,value:100,fmt:function(v){return _w20_f(v,v<10?1:0)+" kHz";},onInput:function(){draw();}});
  var r3=U.ctrls(el);
  var tsel=U.select(r3,"積分の時間 T<sub>coh</sub>",[{v:"1",t:"1 ms"},{v:"20",t:"20 ms"}],"1",function(){draw();});
  var prn=U.select(r3,"衛星（PRN）",(function(){var a=[];for(var i=1;i<=32;i++)a.push({v:String(i),t:"PRN "+i});return a;})(),"1",function(){draw();});
  var br=U.btnrow(el);
  function setv(k,p,c,fi,b,t){kind.set(k);pj.set(p);dfc.set(c);dff.set(fi);bj.set(b);tsel.set(String(t));prn.set("1");draw();}
  U.button(br,"本文の例: −106 dBm・7 kHz（線に重なる）",function(){setv("cw",-106,7,0,100,1);});
  U.button(br,"線の間: 7.5 kHz・20 ms",function(){setv("cw",-106,7,500,100,20);});
  U.button(br,"相互変調の積 −120 dBm（20 ms）",function(){setv("cw",-120,7,0,100,20);});
  U.button(br,"平らな雑音 −100.6 dBm",function(){setv("bb",-100.6,0,0,100,1);});
  var box=U.svgbox(el),ro=U.readout(el);
  function model(p,k,df,b,M,pr){var pjw=Math.pow(10,(p-_W20_N0)/10),s;
    if(k==="bb")s=1/_W20_BW;else if(k==="cw")s=_w20_st(U,pr,df,M);else s=_w20_ovl(U,pr,df,b*1e3,M);
    var r=pjw*s;return {s:s,r:r,nj:p+_w20_db(s),cn0:_W20_CN0-_w20_drop(r),agc:-_w20_drop(Math.pow(10,(p-_W20_NB)/10))};}
  function draw(){
    var k=kind.get(),p=pj.get(),df=dfc.get()*1e3+dff.get(),b=bj.get(),M=+tsel.get(),pr=+prn.get(),m=model(p,k,df,b,M,pr),nar=_w20_nar(box),Wd=nar?400:700,o=[];
    /* (a) 逆拡散の前 */
    var pw=nar?320:260,P=U.plot(nar?58:70,30,pw,140,[-2.5,2.5],[-200,-140]);
    o.push(S.T(nar?6:14,16,"(a) 逆拡散の前","start",11,"ink",true));
    o.push(S.RECT(P.X(-1.023),P.y,P.X(1.023)-P.X(-1.023),P.h,0,U.soft("signal"),"none",0));
    o.push(P.axes({xl:"搬送波からの差 [MHz]",yl:"[dBm/Hz]",xt:[-2,-1,0,1,2],yt:[-200,-180,-160,-140],sz:9,ylOff:44}));
    var xs=U.ctl.linspace(-2.5,2.5,201);
    o.push(P.clip(xs.map(function(x){var s=_w20_sinc(x/1.023);return [x,_W20_C+_W20_TCDB+_w20_db(Math.max(s*s,1e-12))];}),"signal",1.8));
    var fl=_W20_N0;
    if(k==="bb"){var tot=_w20_db(Math.pow(10,fl/10)+Math.pow(10,(p-_w20_db(_W20_BW))/10));o.push(P.line([[-1.023,tot],[1.023,tot]],"alias",2,"6 3"));}
    o.push(P.line([[-2.5,fl],[2.5,fl]],"teal",2));
    if(k==="cw"){var x=df/1e6;if(x>-2.5&&x<2.5){o.push(S.L(P.X(x),P.Y(fl),P.X(x),P.Y(-143),"alias",2.4));o.push(S.head(P.X(x),P.Y(-147),P.X(x),P.Y(-141),"alias",7));}
      o.push(S.T(P.X(-2.4),P.y+12,"連続波 "+_w20_f(p,1)+" dBm","start",9.5,"alias",true,false,null,true));}
    if(k==="nb"){var dens=p-_w20_db(b*1e3),x0=Math.max(-2.5,df/1e6-b/2e3),x1=Math.min(2.5,df/1e6+b/2e3);
      if(x1>x0)o.push(S.RECT(P.X(x0),P.Y(Math.min(-140,Math.max(dens,fl))),Math.max(1.5,P.X(x1)-P.X(x0)),P.Y(fl)-P.Y(Math.min(-140,Math.max(dens,fl))),0,U.soft("alias"),"alias",1.2));
      o.push(S.T(P.X(-2.4),P.y+12,"狭い帯域 "+_w20_f(dens,1)+" dBm/Hz","start",9.5,"alias",true,false,null,true));}
    /* (b) 窓のまわり（連続波）か、密度の比べ */
    var bx=nar?58:420,by=nar?244:30,bw=nar?320:260,Q=U.plot(bx,by,bw,140,[-5,5],[-170,-110]);
    o.push(S.T(nar?6:376,by-14,k==="cw"?"(b) 逆拡散の後: 窓のまわりの線":"(b) 雑音の床と、妨害を直した密度","start",11,"ink",true));
    if(k==="cw"){
      o.push(Q.axes({xl:"搬送波からの差 [kHz]",yl:"線の電力 [dBm]",xt:[-4,-2,0,2,4],yt:[-170,-150,-130,-110],sz:9,ylOff:44}));
      var hw=0.5/M;o.push(S.RECT(Q.X(-hw),Q.y,Math.max(2,Q.X(hw)-Q.X(-hw)),Q.h,0,U.soft("gold"),"gold",0.8));
      var dk=df/1000,kk0=Math.ceil(-5-dk),kk1=Math.floor(5-dk);
      for(var kk=kk0;kk<=kk1;kk++){var fx=dk+kk,lv=p+_w20_db(Math.max(_w20_line(U,pr,-kk),1e-30));
        o.push(S.L(Q.X(fx),Q.y+Q.h,Q.X(fx),Q.Y(Math.max(-170,Math.min(-110,lv))),"alias",2));o.push(S.D(Q.X(fx),Q.Y(Math.max(-170,Math.min(-110,lv))),"alias",2.4));}
      var nz=_W20_N0+_w20_db(1000/M);o.push(S.L(Q.x,Q.Y(nz),Q.x+Q.w,Q.Y(nz),"teal",1.4,"5 3"));
      o.push(S.T(Q.x+Q.w-3,Q.Y(nz)-4,"窓に入る雑音 "+_w20_f(nz,1)+" dBm","end",9,"teal",true,false,null,true));
      o.push(S.T(Q.X(0),Q.y+12,"窓（幅 "+(M===1?"1 kHz":"50 Hz")+"）","middle",9,"gold",true,false,null,true));
    }else{
      var bars=[["雑音の床 N_0",_W20_N0,"teal"],["妨害 N_J",m.nj,"alias"],["和",_w20_db(Math.pow(10,_W20_N0/10)+Math.pow(10,m.nj/10)),"ink"]];
      var B=U.plot(bx,by,bw,140,[0,3],[-200,-140]);
      o.push(B.axes({yl:"[dBm/Hz]",xt:[],yt:[-200,-180,-160,-140],sz:9,ylOff:44}));
      bars.forEach(function(q,i){var v=Math.max(-200,Math.min(-140,q[1]));o.push(S.RECT(B.X(i+0.2),B.Y(v),B.X(i+0.8)-B.X(i+0.2),B.Y(-200)-B.Y(v),3,U.soft(q[2]),q[2],1.2));
        o.push(S.T(B.X(i+0.5),B.Y(v)-5,_w20_f(q[1],1),"middle",9.5,q[2],true,false,null,true));o.push(S.TX(B.X(i+0.5),B.y+B.h+14,q[0],"middle",9,"muted"));});
    }
    /* (c) 妨害の電力と C/N0 */
    var cy=nar?452:226,R=U.plot(nar?58:70,cy,nar?320:610,150,[-150,-80],[10,50]);
    o.push(S.TX(nar?6:14,cy-12,nar?"(c) 妨害の電力と等価な C/N_0":"(c) 妨害の電力と等価な C/N_0（いまの形・周波数・T_{coh}・PRN）","start",11,"ink",true));
    o.push(R.axes({xl:"妨害の電力 P_J [dBm]",yl:"等価な C/N_0",xt:[-150,-140,-130,-120,-110,-100,-90,-80],yt:[10,20,25,30,35,40,50],sz:9,ylOff:42}));
    [[_W20_ACQ,"捕捉 35"],[_W20_TRK,"搬送波の追尾 25"],[_W20_DLL,"符号の追尾 20"]].forEach(function(q){o.push(S.L(R.x,R.Y(q[0]),R.x+R.w,R.Y(q[0]),"muted",1,"4 3"));
      o.push(S.T(R.x+R.w-3,R.Y(q[0])-3,q[1],"end",8.5,"muted",false,false,null,true));});
    var ps=U.ctl.linspace(-150,-80,141);
    o.push(R.clip(ps.map(function(x){return [x,_W20_CN0-_w20_drop(Math.pow(10,(x-_W20_N0)/10)*m.s)];}),"alias",2.2));
    o.push(R.clip(ps.map(function(x){return [x,_W20_CN0-_w20_drop(Math.pow(10,(x-_W20_N0)/10)/_W20_BW)];}),"teal",1.2,"5 3"));
    o.push(S.D(R.X(p),R.Y(Math.max(10,Math.min(50,m.cn0))),"alias",5));
    o.push(S.T(R.X(p)+(R.X(p)>R.x+R.w-80?-7:7),R.Y(Math.max(10,Math.min(50,m.cn0)))-6,_w20_f(m.cn0,1),R.X(p)>R.x+R.w-80?"end":"start",10,"alias",true,false,null,true));
    o.push(S.LEGL(R.x,R.y+R.h+(nar?44:40),[["alias",null,"いまの妨害"],["teal","5 3","同じ電力の平らな雑音"]],9,12));
    box.set(S.svg(Wd,R.y+R.h+(nar?52:48),o));
    /* 読み出し */
    var j=function(v,t){return v>=t?'<span class="ok">できる</span>':'<span class="warn">難しい</span>';};
    var h="S̃ の値: <b>"+_w20_f(_w20_db(m.s),1)+" dB/Hz</b>"+(k==="cw"?"（平均 T<sub>c</sub> = −60.1 dB/Hz）":"")+"、N<sub>J</sub> = P<sub>J</sub> × S̃ = <b>"+_w20_f(m.nj,1)+" dBm/Hz</b>（雑音の床 "+_w20_f(_W20_N0,1)+" dBm/Hz に対して "+_w20_f(m.nj-_W20_N0,1)+" dB）<br>";
    h+="等価な C/N<sub>0</sub> = 47.5 − 10 log<sub>10</sub>(1 + N<sub>J</sub>/N<sub>0</sub>) = <b>"+_w20_f(m.cn0,1)+" dB-Hz</b>（"+_w20_f(_W20_CN0-m.cn0,1)+" dB 下がる）、AGC の利得の変化 <b>"+_w20_f(m.agc,2)+" dB</b><br>";
    h+="捕捉（35 dB-Hz 以上）: "+j(m.cn0,_W20_ACQ)+"・搬送波の位相の追尾（25 以上）: "+j(m.cn0,_W20_TRK)+"・符号の追尾（20 以上）: "+j(m.cn0,_W20_DLL);
    ro.innerHTML=h+'<div class="wnote">9 章 1 節の例の受信機（C = −128.5 dBm、N<sub>0</sub> = −176.0 dBm/Hz）。S̃ は選んだ PRN の C/A 符号から計算した値。狭い帯域の雑音は、帯域の中の符号の線の和で近似した。目安の C/N<sub>0</sub> は 3 章 6 節の代表値。</div>';
  }
  draw();
};

/* ---- 6 節: ノイズ探しの演習（例の機器・例の値） ---- */
/* 衛星: [名前, PRN, 仰角, 妨害が無いときの C/N0, ドップラー [Hz]]（f20.py の _F20_HSATS と同じ） */
var _W20_SATS=[["G05",5,72,48.5,-420],["G13",13,61,47.8,1210],["G20",20,48,46.5,-2380],["G15",15,40,45.2,2950],["G24",24,33,44.0,-3130],["G18",18,25,42.3,3720],["G29",29,17,40.1,-1650],["G02",2,11,38.0,4180]];
/* 機能: {name, kind: "bb"（N_J/N0 [dB]: v）か "cw"（df [Hz]・pj [dBm]）か "none", 基板の上の位置 [mm], 近傍界プローブで見た強さ [dB]} */
function _w20_funcs0(){return [{name:"DC-DC",kind:"cw",df:580e3,pj:-118,x:137,y:78,lv:-60},{name:"カメラ",kind:"bb",v:2,x:15,y:85,lv:-52},
  {name:"USB",kind:"bb",v:6,x:149,y:25,lv:-40},{name:"ディスプレイ",kind:"cw",df:-420e3,pj:-112,x:90,y:93,lv:-46}];}
REG.w20_hunt=function(el,U){
  var S=U.S,F=_w20_funcs0(),on=[true,true,true,true],log=[],seed=7,rnd=U.rng(seed),last=null,probe=[100,60],show=false,geo={bx:0,by:0,sc:1};
  U.head(el,"NOISE HUNT","ノイズ探しの演習 — 機能を止めて C/N<sub>0</sub> を比べ、プローブで探す（例の機器）");
  var r1=U.ctrls(el),cb=[];
  F.forEach(function(fn,i){cb.push(U.checkbox(r1,fn.name+" を動かす",true,function(v){on[i]=v;}));});
  var r2=U.ctrls(el);
  var tav=U.slider(r2,"平均する時間",{values:[1,2,5,10,20,30,60,120],value:60,fmt:function(v){return v+" s";}});
  var sky=U.checkbox(r2,"時刻帯をそろえない（測るたびに空が変わる）",false,null);
  var br=U.btnrow(el);
  U.button(br,"測る",function(){measure();draw();});
  U.button(br,"記録を消す",function(){log=[];draw();});
  U.button(br,"問題を変える（別の機器）",function(){seed++;newProblem();draw();});
  U.button(br,"本文の例に戻す",function(){seed=7;F=_w20_funcs0();reset();draw();});
  U.button(br,"答えを見る",function(){show=!show;draw();});
  var r3=U.ctrls(el);
  var sx=U.slider(r3,"プローブの位置 x",{min:0,max:160,step:1,value:100,fmt:function(v){return v+" mm";},onInput:function(v){probe[0]=v;draw();}});
  var sy=U.slider(r3,"プローブの位置 y",{min:0,max:100,step:1,value:60,fmt:function(v){return v+" mm";},onInput:function(v){probe[1]=v;draw();}});
  var box=U.svgbox(el),ro=U.readout(el);
  function reset(){on=[true,true,true,true];cb.forEach(function(c){c.set(true);});log=[];last=null;show=false;rnd=U.rng(seed);measure();}
  function newProblem(){var r=U.rng(seed*7919+13),pos=[[137,78],[15,85],[149,25],[90,93]];
    F=["DC-DC","カメラ","USB","ディスプレイ"].map(function(nm,i){var u=r.next(),fn={name:nm,x:pos[i][0],y:pos[i][1]};
      if(u<0.25){fn.kind="none";fn.lv=-75+r.range(-3,3);}
      else if(u<0.65){fn.kind="bb";fn.v=Math.round(r.range(-4,8)*2)/2;fn.lv=-58+2.2*fn.v+r.range(-3,3);}
      else{fn.kind="cw";fn.df=Math.round(r.range(-900,900))*1000+Math.round(r.range(-500,500));fn.pj=Math.round(r.range(-124,-108));fn.lv=-60+1.2*(fn.pj+118)+r.range(-3,3);}
      return fn;});
    reset();}
  /* 衛星ごとの C/N0（雑音なし）と AGC の利得の変化 */
  function truth(onv){var out=_W20_SATS.map(function(s){var r=0;F.forEach(function(fn,i){if(!onv[i]||fn.kind==="none")return;
      if(fn.kind==="bb")r+=Math.pow(10,fn.v/10);else r+=Math.pow(10,(fn.pj-_W20_N0)/10)*_w20_st(U,s[1],fn.df-s[4],1);});
      return s[3]-_w20_drop(r);});
    var p=0;F.forEach(function(fn,i){if(!onv[i]||fn.kind==="none")return;p+=fn.kind==="bb"?Math.pow(10,(_W20_N0+fn.v)/10)*_W20_BW:Math.pow(10,fn.pj/10);});
    return {c:out,agc:-_w20_drop(p/Math.pow(10,_W20_NB/10))};}
  function measure(){var t=truth(on),T=tav.get(),sg=1.5/Math.sqrt(T),off=sky.get()?rnd.normal()*1.5:0;
    var c=t.c.map(function(v){return v+off+sg*rnd.normal()+(sky.get()?rnd.normal()*1.0:0);}),avg=c.reduce(function(a,b){return a+b;},0)/c.length;
    last={c:c,avg:avg,agc:t.agc+0.1*rnd.normal(),on:on.slice(),T:T,sky:sky.get()};log.push(last);if(log.length>12)log.shift();}
  function probeLevel(x,y,idx){var t=0;F.forEach(function(fn,i){if(idx!=null&&i!==idx)return;var d2=(x-fn.x)*(x-fn.x)+(y-fn.y)*(y-fn.y);
      t+=(on[i]?Math.pow(10,fn.lv/10):0)/Math.pow(1+d2/64,2);});t+=Math.pow(10,-82/10);return 10*Math.log10(t);}
  function draw(){
    var nar=_w20_nar(box),Wd=nar?400:700,o=[];
    /* (a) 最後に測った C/N0 */
    var P=U.plot(nar?46:60,30,nar?340:330,150,[0,8],[25,50]);
    o.push(S.TX(nar?6:14,16,"(a) 最後に測った衛星ごとの C/N_0","start",11,"ink",true));
    o.push(P.axes({yl:"C/N_0 [dB-Hz]",xt:[],yt:[25,30,35,40,45,50],sz:9,ylOff:36}));
    if(last){last.c.forEach(function(v,i){var vv=Math.max(25,Math.min(50,v));o.push(S.RECT(P.X(i+0.15),P.Y(vv),P.X(i+0.85)-P.X(i+0.15),P.Y(25)-P.Y(vv),2,U.soft("signal"),"signal",1));
        o.push(S.T(P.X(i+0.5),P.Y(vv)-4,_w20_f(v,1),"middle",8.5,"signal",true));o.push(S.T(P.X(i+0.5),P.y+P.h+12,_W20_SATS[i][0],"middle",8.5,"muted"));});
      o.push(S.L(P.x,P.Y(last.avg),P.x+P.w,P.Y(last.avg),"alias",1.4,"5 3"));
      o.push(S.T(P.x+P.w-3,P.Y(last.avg)-4,"平均 "+_w20_f(last.avg,2),"end",9.5,"alias",true,false,null,true));}
    /* (b) 基板とプローブ、(c) プローブの位置のスペクトラム */
    var bx=nar?16:420,by=nar?222:30,sc=nar?2.3:1.6;geo={bx:bx,by:by,sc:sc};
    o.push(S.T(bx-(nar?10:6),by-14,"(b) 例の機器の基板（ドラッグでプローブを動かす）","start",11,"ink",true));
    o.push(S.RECT(bx,by,160*sc,100*sc,4,U.soft("green"),"green",1.2));
    var comps=[["アンテナ",4,4,26,24,"signal"],["GNSS モジュール",38,8,30,22,"signal"],["マイコン",80,40,22,20,"muted"],["DC-DC",126,66,24,24,"muted"],["カメラ",4,74,24,22,"muted"],["ディスプレイ",66,86,46,12,"muted"],["USB",140,14,18,22,"muted"]];
    if(show){for(var i=0;i<32;i++)for(var j=0;j<20;j++){var v=probeLevel(i*5+2.5,j*5+2.5),a=Math.max(0,Math.min(1,(v+80)/38));
      if(a>0.03)o.push(S.RECT(bx+i*5*sc,by+j*5*sc,5*sc,5*sc,0,"alias","none",0,null,' fill-opacity="'+(0.8*a).toFixed(2)+'"'));}}
    comps.forEach(function(c){o.push(S.RECT(bx+c[1]*sc,by+c[2]*sc,c[3]*sc,c[4]*sc,2,"none",c[5],1.2));o.push(S.T(bx+(c[1]+c[3]/2)*sc,by+(c[2]+c[4]/2)*sc+4,c[0],"middle",8.5,c[5]==="signal"?"signal":"ink",true,false,null,true));});
    var qx=bx+probe[0]*sc,qy=by+probe[1]*sc;
    o.push(S.CIRC(qx,qy,7,"ink",2.2,"none"));o.push(S.L(qx+5,qy+5,qx+20,qy+22,"ink",3));
    var cy=by+100*sc+(nar?34:30),Q=U.plot(bx+(nar?40:44),cy,nar?300:210,70,[-5,5],[-90,-35]);
    o.push(S.T(bx-(nar?10:6),cy-12,"(c) プローブの位置のスペクトラム（相対値）","start",11,"ink",true));
    o.push(S.RECT(Q.X(-1.023),Q.y,Q.X(1.023)-Q.X(-1.023),Q.h,0,U.soft("signal"),"none",0));
    o.push(Q.axes({xt:[-5,0,5],yt:[-90,-60,-35],sz:8.5,ylOff:34,xfmt:function(v){return v===0?"L1":_w20_f(v,0);}}));
    var base=-86,bbsum=Math.pow(10,base/10);F.forEach(function(fn,i){if(fn.kind!=="cw")bbsum+=Math.pow(10,probeLevel(probe[0],probe[1],i)/10);});
    var bbl=10*Math.log10(bbsum);o.push(Q.line([[-5,bbl],[5,bbl]],"alias",2));
    F.forEach(function(fn,i){if(fn.kind!=="cw")return;var lv=probeLevel(probe[0],probe[1],i),x=fn.df/1e6;if(lv>bbl+0.5&&x>-5&&x<5){o.push(S.L(Q.X(x),Q.Y(bbl),Q.X(x),Q.Y(Math.min(-35,lv)),"alias",2));o.push(S.D(Q.X(x),Q.Y(Math.min(-35,lv)),"alias",2.6));}});
    var Hh=Math.max(P.y+P.h+40,Q.y+Q.h+22);
    box.set(S.svg(Wd,Hh,o));
    /* 読み出し */
    var h="";
    if(last){var nm=F.map(function(fn,i){return last.on[i]?"":fn.name;}).filter(function(x){return x;});
      h+="最後の測定（"+(nm.length?nm.join("・")+"を止めて":"全部を動かして")+"、"+last.T+" s の平均"+(last.sky?"、空は別の時刻":"")+"）: 8 機の平均 <b>"+_w20_f(last.avg,2)+" dB-Hz</b>、AGC の利得の変化 <b>"+_w20_f(last.agc,1)+" dB</b><br>";}
    var tb=log.map(function(r,k){var nm=F.map(function(fn,i){return r.on[i]?"○":"—";});return [String(k+1)].concat(nm).concat([_w20_f(r.avg,2),_w20_f(r.avg-log[0].avg,2),_w20_f(r.agc,1),r.T+" s"+(r.sky?"・空が違う":"")]);});
    if(tb.length)h+=U.tbl(["回"].concat(F.map(function(fn){return fn.name;})).concat(["平均 C/N<sub>0</sub>","1 回目との差","AGC [dB]","条件"]),tb,["right","center","center","center","center","right","right","right","left"]);
    if(show){h+="<b>答え（例の値）</b>: "+F.map(function(fn){return fn.name+" = "+(fn.kind==="none"?"ほとんど出さない":(fn.kind==="bb"?"帯域に平らな妨害 N<sub>J</sub>/N<sub>0</sub> = "+_w20_f(fn.v,1)+" dB":"連続波 "+_w20_f(fn.pj,0)+" dBm（L1 "+(fn.df>=0?"+":"−")+_w20_f(Math.abs(fn.df)/1e6,3)+" MHz）"));}).join("、")+"。基板の上の赤い濃さは、近傍界プローブで見た強さ。<br>";}
    ro.innerHTML=h+'<div class="wnote">「測る」で、いま動かしている機能のまま C/N<sub>0</sub> を測り、記録に足す。各衛星の C/N<sub>0</sub> は 1 s ごとに 1.5 dB ほど揺れるとし、平均する時間の平方根に反比例して揺れが小さくなる。「時刻帯をそろえない」では、測るたびに空が変わったとして、全部の衛星に共通の揺れ（1.5 dB）と衛星ごとの揺れ（1 dB）を足す。源の強さと位置は例の値（「問題を変える」で乱数で決め直す）。</div>';
  }
  U.ctl.drag(box,function(t,x,y){if(t==="up"||x==null)return;var X=(x-geo.bx)/geo.sc,Y=(y-geo.by)/geo.sc;if(t==="down"&&(X<-5||X>165||Y<-5||Y>105))return false;
    probe=[Math.max(0,Math.min(160,Math.round(X))),Math.max(0,Math.min(100,Math.round(Y)))];sx.set(probe[0]);sy.set(probe[1]);draw();});
  measure();draw();
};
