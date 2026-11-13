/* ===== 21 章 ノイズ対策の設計 — 源・経路・受け側 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w21_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w21_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
function _w21_pm(v,d){if(!isFinite(v))return v>0?"+∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))return (0).toFixed(d);return (v>0?"+":"−")+Math.abs(v).toFixed(d);}
/* 例の受信機（9 章 1 節。f21.py と同じ値） */
var _W21_C=299792458,_W21_L1=1575.42e6,_W21_TC=1/1.023e6,_W21_BW=2.046e6,
    _W21_N0=10*Math.log10(1.380649e-23*183.5)+30,_W21_CN0=-128.5-(10*Math.log10(1.380649e-23*183.5)+30);
function _w21_db(x){return 10*Math.log10(x);}
function _w21_drop(r){return 10*Math.log10(1+r);}
function _w21_sinc(x){if(Math.abs(x)<1e-12)return 1;var p=Math.PI*x;return Math.sin(p)/p;}
/* 平均の S~（2 章 4 節の形）と、その台形の積分（f21.py の _f21_sint と同じ 4000 区間） */
function _w21_sbar(f){var s=_w21_sinc(f*_W21_TC);return _W21_TC*s*s;}
function _w21_sint(a,b){var n=4000,h=(b-a)/n,s=0.5*(_w21_sbar(a)+_w21_sbar(b));for(var i=1;i<n;i++)s+=_w21_sbar(a+i*h);return s*h;}
function _w21_mhz(v){return v>=10?_w21_f(v,2)+" MHz":(v>=1?_w21_f(v,3)+" MHz":_w21_f(v*1000,1)+" kHz");}

/* ---- 2 節: 拡散スペクトラムクロック（平らに広がる近似。f21.py の _f21_ssc_calc と同じ） ---- */
var _W21_FM=31.25e3;   /* 変調の周波数（例の値）。周期 32 µs */
function _w21_ssc(fc,delta,kind){var span=Math.max(40e6,1.2*delta*_W21_L1+5e6),nlo=Math.max(1,Math.floor((_W21_L1-span)/fc)),nhi=Math.ceil((_W21_L1+span)/fc);
  var r={pin0:0,nj0:0,pin:0,nj:0,hs:[]};
  for(var n=nlo;n<=nhi;n++){var f0=n*fc-_W21_L1;if(Math.abs(f0)<=_W21_BW/2)r.pin0+=1;r.nj0+=_w21_sbar(f0);
    var W=n*fc*delta;if(delta<=0){r.hs.push([n,f0,f0,f0,0]);continue;}
    var a=kind==="down"?f0-W:f0-W/2,b=kind==="down"?f0:f0+W/2,lo=Math.max(a,-_W21_BW/2),hi=Math.min(b,_W21_BW/2);
    if(hi>lo)r.pin+=(hi-lo)/W;
    var aa=Math.max(a,-30e6),bb=Math.min(b,30e6);if(bb>aa)r.nj+=_w21_sint(aa,bb)/W;
    r.hs.push([n,f0,a,b,W]);}
  if(delta<=0){r.pin=r.pin0;r.nj=r.nj0;}
  return r;}
/* 三角波（0 → 1 → 0）。t は周期の何周目か */
function _w21_tri(ph){ph=ph-Math.floor(ph);return ph<0.5?2*ph:2-2*ph;}
REG.w21_ssc=function(el,U){
  var S=U.S;
  U.head(el,"SSC","拡散スペクトラムクロック — 高調波の周波数の時間の動きと、L1 のまわりのスペクトラム・C/N<sub>0</sub>");
  var r1=U.ctrls(el);
  var fsl=U.slider(r1,"源の周波数 f",{min:1,max:50,log:true,value:25,fmt:function(v){return _w21_mhz(v);},onInput:function(){draw();}});
  var dsl=U.slider(r1,"広げる幅 δ<sub>s</sub>",{min:0,max:3,step:0.1,value:1,fmt:function(v){return _w21_f(v,1)+" %";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var kind=U.select(r2,"広げ方",[{v:"center",t:"上下に（センター）"},{v:"down",t:"下へだけ（ダウン）"}],"center",function(){draw();});
  var psl=U.slider(r2,"受信機の入力での高調波の電力 P",{min:-130,max:-90,step:1,value:-105,fmt:function(v){return _w21_f(v,0)+" dBm";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function setv(f,d,k,p){fsl.set(f);dsl.set(d);kind.set(k);psl.set(p);draw();}
  U.button(br,"本文の例: 25 MHz・1 %（良くなる）",function(){setv(25,1,"center",-105);});
  U.button(br,"32 MHz（悪くなる）",function(){setv(32,1,"center",-105);});
  U.button(br,"2 MHz の DC-DC（良くならない）",function(){setv(2,1,"center",-105);});
  var br2=U.btnrow(el),tt=0;
  var tk=U.ticker(function(){tt=(tt+1)%64;draw();},60);
  U.button(br2,"再生",function(){tk.start();});
  U.button(br2,"止める",function(){tk.stop();});
  var box=U.svgbox(el),ro=U.readout(el);
  function draw(){
    var fc=fsl.get()*1e6,d=dsl.get()/100,k=kind.get(),P=psl.get(),res=_w21_ssc(fc,d,k),nar=_w21_nar(box),Wd=nar?400:700,o=[];
    var pw=nar?320:280,lx=nar?58:70;
    /* (a) 時間の動き */
    var A=U.plot(lx,30,pw,150,[0,64],[-20,20]);
    o.push(S.T(nar?6:14,16,"(a) 高調波の周波数の時間の動き","start",11,"ink",true));
    o.push(S.RECT(A.x,A.Y(1.023),A.w,A.Y(-1.023)-A.Y(1.023),0,U.soft("signal"),"none",0));
    o.push(A.axes({xl:"時間 [µs]（f_m = 31.25 kHz）",yl:"L1 からの差 [MHz]",xt:[0,16,32,48,64],yt:[-20,-10,0,10,20],sz:9,ylOff:42}));
    var inb=null;
    res.hs.forEach(function(h){var f0=h[1]/1e6,W=h[4]/1e6;if(h[3]/1e6<-20||h[2]/1e6>20)return;
      var pts=[];for(var i=0;i<=64;i+=2){var tri=_w21_tri(i/32),fr=k==="down"?f0-W*tri:f0-W/2+W*tri;pts.push([i,fr]);}
      o.push(A.clip(pts,"alias",1.6));
      if(h[2]<=-_W21_BW/2&&h[3]>=_W21_BW/2&&h[4]>0)inb=h;});
    var tcur=tt,curf=[];
    res.hs.forEach(function(h){var f0=h[1]/1e6,W=h[4]/1e6,tri=_w21_tri(tcur/32),fr=k==="down"?f0-W*tri:f0-W/2+W*tri;if(fr>=-20&&fr<=20)curf.push(fr);});
    o.push(S.L(A.X(tcur),A.y,A.X(tcur),A.y+A.h,"gold",1.4,"4 3"));
    curf.forEach(function(fr){var on=Math.abs(fr)<=1.023;o.push(S.D(A.X(tcur),A.Y(fr),on?"alias":"muted",on?5:3.4));});
    if(inb)o.push(S.T(A.x+A.w-4,A.y+12,"帯域にいる時間の割合 "+_w21_f(100*_W21_BW/inb[4],1)+" %","end",9,"alias",true,false,null,true));
    /* (b) スペクトラム */
    var bx=nar?lx:420,by=nar?246:30,B=U.plot(bx,by,pw-(nar?0:20),150,[-20,20],[-140,-90]);
    o.push(S.T(nar?6:376,by-14,"(b) L1 のまわりのスペクトラム","start",11,"ink",true));
    o.push(S.RECT(B.X(-1.023),B.y,B.X(1.023)-B.X(-1.023),B.h,0,U.soft("signal"),"none",0));
    o.push(B.axes({xl:"L1 からの差 [MHz]",yl:"1 MHz あたり [dBm]",xt:[-20,-10,0,10,20],yt:[-140,-120,-100],sz:9,ylOff:42}));
    if(d>0){var poly=[[B.X(-20),B.y+B.h]];
      for(var i=0;i<=400;i++){var x=-20+40*i/400,xx=x*1e6,dens=0;res.hs.forEach(function(h){if(h[4]>0&&xx>=h[2]&&xx<=h[3])dens+=1e6/h[4];});
        var lv=dens>0?P+10*Math.log10(dens):-200;poly.push([B.X(x),B.Y(Math.max(-140,Math.min(-90,lv)))]);}
      poly.push([B.X(20),B.y+B.h]);o.push(S.PL(poly,"alias",1.3,U.soft("alias")));}
    res.hs.forEach(function(h){var f0=h[1]/1e6;if(f0<-20||f0>20)return;o.push(S.L(B.X(f0),B.y+B.h,B.X(f0),B.Y(Math.max(-140,Math.min(-90,P))),"muted",1.5));});
    curf.forEach(function(fr){o.push(S.D(B.X(fr),B.Y(Math.max(-140,Math.min(-90,P)))-0,"gold",3));});
    o.push(S.LEGL(B.x,B.y+B.h+(nar?44:40),[["muted",null,"広げる前の線"],["alias",null,"広げた後（平均の密度）"]],9,12));
    box.set(S.svg(Wd,B.y+B.h+(nar?52:48),o));
    /* 読み出し */
    var a0=Math.pow(10,(P-_W21_N0)/10),c0=_W21_CN0-_w21_drop(a0*res.nj0),c1=_W21_CN0-_w21_drop(a0*res.nj);
    var nn=Math.round(_W21_L1/fc),Wn=nn*fc*d;
    var dmax=0;res.hs.forEach(function(h){if(h[4]>0){var dens=0;res.hs.forEach(function(g){if(g[4]>0&&h[1]>=g[2]&&h[1]<=g[3])dens+=1/g[4];});dmax=Math.max(dmax,dens);}});
    var pk1=d>0?P+10*Math.log10(Math.min(1,dmax*100e3)):P;
    function pdb(x){return x>0?_w21_f(_w21_db(x),1)+" dB":"−∞";}
    var h="広がりの幅 W<sub>n</sub> = nδ<sub>s</sub>f = <b>"+_w21_f(Wn/1e6,2)+" MHz</b>（L1 に最も近い n = "+nn+"。帯域の幅 2.046 MHz の "+_w21_f(Wn/_W21_BW,1)+" 倍）<br>";
    h+="帯域に入る電力（P に対して）: <b>"+pdb(res.pin0)+" → "+pdb(res.pin)+"</b>、N<sub>J</sub>/N<sub>0</sub>: <b>"+_w21_pm(_w21_db(a0*res.nj0),1)+" → "+_w21_pm(_w21_db(a0*res.nj),1)+" dB</b><br>";
    var better=c1-c0;
    h+="C/N<sub>0</sub>: <b>"+_w21_f(c0,1)+" → "+_w21_f(c1,1)+" dB-Hz</b>（"+(better>0.05?'<span class="ok">'+_w21_f(better,1)+" dB 良くなる</span>":(better<-0.05?'<span class="warn">'+_w21_f(-better,1)+" dB 悪くなる</span>":"ほとんど変わらない"))+"）<br>";
    h+="分解能帯域幅 100 kHz で見た山の高さ: "+_w21_f(P,0)+" → "+_w21_f(pk1,1)+" dBm（"+_w21_f(P-pk1,1)+" dB 低く見える）";
    ro.innerHTML=h+'<div class="wnote">9 章 1 節の例の受信機（C/N<sub>0</sub> 47.5 dB-Hz）。S̃ は 2 章 4 節の形の平均、広げた電力は幅の中に平らに広がるとした（三角波で周波数を動かす場合の近似）。電力 P は、どの高調波も同じとした例の値。</div>';
  }
  draw();
};

/* ---- 3 節: 電源のフィルタ（傾向のモデル。f21.py の _f21_zind・_f21_zbead・_f21_zcap・_f21_hfilt と同じ） ---- */
function _w21_cdiv(a,b){var d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];}
function _w21_cinv(a){return _w21_cdiv([1,0],a);}
function _w21_zind(f,L){var w=2*Math.PI*f,y=_w21_cinv([0.1,w*L]);y=[y[0]+1/4e3,y[1]+w*3.2e-12];return _w21_cinv(y);}
function _w21_zbead(f){var w=2*Math.PI*f,zf=_w21_cdiv([0,w*1.5e-6],[1,f/60e6]),y=_w21_cinv(zf);y=[y[0],y[1]+w*0.25e-12];var z=_w21_cinv(y);return [z[0]+0.1,z[1]];}
function _w21_zcap(f,C){var w=2*Math.PI*f;return [0.005,w*0.5e-9-1/(w*C)];}
function _w21_h(f,kind,L,C,rd){var zs=[rd,0];if(kind==="lc"||kind==="both"){var a=_w21_zind(f,L);zs=[zs[0]+a[0],zs[1]+a[1]];}
  if(kind==="bead"||kind==="both"){var b=_w21_zbead(f);zs=[zs[0]+b[0],zs[1]+b[1]];}
  if(kind==="none")return [1,0];var zc=_w21_zcap(f,C);return _w21_cdiv(zc,[zs[0]+zc[0],zs[1]+zc[1]]);}
function _w21_att(f,kind,L,C,rd){var h=_w21_h(f,kind,L,C,rd);return -20*Math.log10(Math.hypot(h[0],h[1]));}
/* 10 章 2 節の例のモデル（f10.py と同じ）: PSRR = 20 log10 |1 + A0/(1 + j f/fp)|、1 mVpp で N_p = N0、基準 47.5 dB-Hz */
function _w21_psrr(f,a0db,fp){var a0=Math.pow(10,a0db/20),x=f/fp,d=1+x*x;return 20*Math.log10(Math.hypot(1+a0/d,-a0*x/d));}
function _w21_hz(v){if(v>=1e9)return _w21_f(v/1e9,2)+" GHz";if(v>=1e6)return _w21_f(v/1e6,v<1e7?2:1).replace(/\.?0+$/,"")+" MHz";if(v>=1e3)return _w21_f(v/1e3,v<1e4?1:0)+" kHz";return _w21_f(v,0)+" Hz";}
REG.w21_filter=function(el,U){
  var S=U.S;
  U.head(el,"POWER FILTER","電源のフィルタ — 周波数特性と、DC-DC の揺れ・L1 の高さの成分・C/N<sub>0</sub>");
  var r1=U.ctrls(el);
  var kind=U.select(r1,"直列の部品",[{v:"none",t:"なし（10 章の例）"},{v:"lc",t:"コイル"},{v:"bead",t:"フェライトビーズ"},{v:"both",t:"コイル + フェライトビーズ"}],"lc",function(){draw();});
  var lsl=U.slider(r1,"コイル L<sub>p</sub>",{min:0.1,max:22,log:true,value:2.2,fmt:function(v){return _w21_f(v,v<1?2:1)+" µH";},onInput:function(){draw();}});
  var csl=U.slider(r1,"コンデンサ C<sub>p</sub>",{min:0.1,max:47,log:true,value:10,fmt:function(v){return _w21_f(v,v<1?2:1)+" µF";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var rsl=U.slider(r2,"ダンピングの抵抗",{min:0,max:2,step:0.05,value:0.4,fmt:function(v){return _w21_f(v,2)+" Ω";},onInput:function(){draw();}});
  var fsl=U.slider(r2,"DC-DC の周波数",{min:0.3,max:4,log:true,value:2,fmt:function(v){return _w21_f(v,v<1?2:1)+" MHz";},onInput:function(){draw();}});
  var vsl=U.slider(r2,"DC-DC の出力の揺れ",{min:1,max:100,log:true,value:20,fmt:function(v){return _w21_f(v,v<10?1:0)+" mVpp";},onInput:function(){draw();}});
  var r3=U.ctrls(el);
  var ldo=U.checkbox(r3,"外付けの LDO",true,function(){draw();});
  var br=U.btnrow(el);
  function setv(k,L,C,R,f,v,l){kind.set(k);lsl.set(L);csl.set(C);rsl.set(R);fsl.set(f);vsl.set(v);ldo.set(l);draw();}
  U.button(br,"本文の例: 2.2 µH・10 µF・0.4 Ω",function(){setv("lc",2.2,10,0.4,2,20,true);});
  U.button(br,"ダンピングなし",function(){setv("lc",2.2,10,0,2,20,true);});
  U.button(br,"ビーズだけ",function(){setv("bead",2.2,10,0.4,2,20,true);});
  U.button(br,"フィルタなし（10 章の例）",function(){setv("none",2.2,10,0.4,2,20,true);});
  var box=U.svgbox(el),ro=U.readout(el);
  function draw(){
    var k=kind.get(),L=lsl.get()*1e-6,C=csl.get()*1e-6,rd=rsl.get(),fsw=fsl.get()*1e6,vr=vsl.get(),lo=ldo.get(),nar=_w21_nar(box),Wd=nar?400:700,o=[];
    lsl.input.disabled=!(k==="lc"||k==="both");csl.input.disabled=rsl.input.disabled=(k==="none");
    /* (a) 回路 */
    o.push(S.T(nar?6:14,16,"(a) 回路","start",11,"ink",true));
    var y=58,x=nar?8:14;
    o.push(S.BOX(x,y-16,54,32,"DC-DC",null,"alias"));x+=54;
    function wire(n){o.push(S.L(x,y,x+n,y,"ink",1.4));x+=n;}
    if(k!=="none"){wire(10);o.push(S.RECT(x,y-6,20,12,2,"panel","ink",1.3));o.push(S.T(x+10,y-10,_w21_f(rd,2)+" Ω","middle",8.5,"muted"));x+=20;
      if(k==="lc"||k==="both"){wire(6);for(var i=0;i<4;i++)o.push(S.PATH("M "+(x+i*8)+" "+y+" a 4 4 0 0 1 8 0","ink",1.4));o.push(S.TX(x+16,y-10,"L_p","middle",9,"ink"));x+=32;}
      if(k==="bead"||k==="both"){wire(6);o.push(S.RECT(x,y-7,24,14,4,U.soft("purple"),"purple",1.4));o.push(S.T(x+12,y-11,"ビーズ","middle",8.5,"purple",true));x+=24;}
      wire(18);var cx=x-9;o.push(S.D(cx,y,"ink",2.4));o.push(S.L(cx,y,cx,y+12,"ink",1.4));o.push(S.L(cx-8,y+12,cx+8,y+12,"ink",2));o.push(S.L(cx-8,y+17,cx+8,y+17,"ink",2));
      o.push(S.L(cx,y+17,cx,y+26,"ink",1.4));o.push(S.L(cx-6,y+26,cx+6,y+26,"muted",1.4));o.push(S.TX(cx+10,y+18,"C_p","start",9,"ink"));wire(8);}
    else{wire(40);o.push(S.T(x-20,y-6,"フィルタなし","middle",8.5,"muted"));}
    if(lo){o.push(S.BOX(x,y-16,46,32,"LDO",null,"purple"));x+=46;}else{o.push(S.T(x+23,y+4,"LDO なし","middle",8.5,"muted"));x+=46;}
    o.push(S.ARR(x,y,x+12,y,"ink",1.4,5));o.push(S.T(x+15,y+4,"モジュール","start",9,"signal",true));
    /* (b) 減衰の周波数特性 */
    var bx=nar?58:420,by=nar?118:30,B=U.plot(bx,by,nar?320:262,nar?160:170,[1e4,3e9],[-20,100],{xlog:true});
    o.push(S.T(nar?6:376,by-14,"(b) フィルタの減衰","start",11,"ink",true));
    o.push(B.axes({xl:"周波数 f [Hz]",yl:"減衰 [dB]",xt:[1e4,1e5,1e6,1e7,1e8,1e9],yt:[-20,0,20,40,60,80,100],sz:9,ylOff:40,
      xfmt:function(v){return {10000:"10 k",100000:"100 k",1000000:"1 M",10000000:"10 M",100000000:"100 M",1000000000:"1 G"}[v];}}));
    o.push(S.L(B.x,B.Y(0),B.x+B.w,B.Y(0),"muted",1));
    var fs=U.ctl.logspace(4,Math.log10(3e9),260),pts=fs.map(function(f){return [f,_w21_att(f,k,L,C,rd)];});
    o.push(B.clip(pts,"green",2.2));
    var aSW=_w21_att(fsw,k,L,C,rd),aL1=_w21_att(1576e6,k,L,C,rd);
    [[fsw,"DC-DC",aSW],[_W21_L1,"L1",aL1]].forEach(function(q){o.push(S.L(B.X(q[0]),B.y,B.X(q[0]),B.y+B.h,"faint",1,"3 3"));o.push(S.T(B.X(q[0]),B.y-3,q[1],"middle",8.5,"muted",true));
      var vy=Math.max(-20,Math.min(100,q[2]));o.push(S.D(B.X(q[0]),B.Y(vy),"green",3.6));o.push(S.T(B.X(q[0])-5,B.Y(vy)-6,_w21_f(q[2],1),"end",9,"green",true,false,null,true));});
    var mi=0;pts.forEach(function(p,i){if(p[1]<pts[mi][1])mi=i;});
    if(k!=="none"&&pts[mi][1]<-0.5){o.push(S.D(B.X(pts[mi][0]),B.Y(Math.max(-20,pts[mi][1])),"alias",3.6));o.push(S.T(B.X(pts[mi][0])+5,B.Y(Math.max(-20,pts[mi][1]))+12,"山 "+_w21_pm(-pts[mi][1],1)+" dB","start",9,"alias",true,false,null,true));}
    /* (c) 揺れの鎖（10 章 2 節の例のモデル） */
    var pin=_w21_psrr(fsw,40,20e3),pex=lo?_w21_psrr(fsw,60,10e3):0,v1=vr*Math.pow(10,-aSW/20),v2=v1*Math.pow(10,-(pex+pin)/20),q=v2*v2,cn=47.5-_w21_drop(q);
    var q0=Math.pow(vr*Math.pow(10,-(pex+pin)/20),2),need=10*Math.log10(q0)-10*Math.log10(Math.pow(10,0.05)-1);
    var cy=nar?332:236;o.push(S.T(nar?6:14,cy-12,"(c) DC-DC の揺れが RF の段に届くまで（10 章 2 節の例のモデル）","start",11,"ink",true));
    var items=[["DC-DC の出力",_w21_f(vr,vr<10?1:0)+" mVpp","alias"],["フィルタの後",_w21_vstr(v1),"green"],["LDO と中の回路の後",_w21_vstr(v2),"purple"],["N_p/N_0",_w21_f(q,q<0.01?4:2),"teal"],["C/N_0",_w21_f(cn,1)+" dB-Hz",cn>47?"green":(cn>40?"gold":"alias")]];
    var bw=nar?74:126,gap=nar?4:8;items.forEach(function(it,i){var xx=(nar?6:14)+i*(bw+gap);o.push(S.RECT(xx,cy,bw,40,6,U.soft(it[2]),it[2],1.2));
      o.push(S.TX(xx+bw/2,cy+15,it[0],"middle",nar?8:9,"muted"));o.push(S.T(xx+bw/2,cy+32,it[1],"middle",nar?9:10.5,it[2],true));
      if(i<items.length-1)o.push(S.ARR(xx+bw+1,cy+20,xx+bw+gap-1,cy+20,"muted",1.2,4));});
    box.set(S.svg(Wd,cy+48,o));
    /* 読み出し */
    var Lt=((k==="lc"||k==="both")?L:0)+((k==="bead"||k==="both")?1.5e-6:0),Rt=((k==="lc"||k==="both")?0.1:0)+((k==="bead"||k==="both")?0.1:0)+rd+0.005;
    var h="";
    if(k!=="none"){var fLC=1/(2*Math.PI*Math.sqrt(Lt*C)),Q=Math.sqrt(Lt/C)/Rt;
      h+="共振の周波数 f<sub>LC</sub> = 1/(2π√(L C)) = <b>"+_w21_hz(fLC)+"</b>、Q = √(L/C)/R = <b>"+_w21_f(Q,2)+"</b>（直列の L "+_w21_f(Lt*1e6,2)+" µH・R "+_w21_f(Rt,3)+" Ω）。";
      h+="いちばん持ち上がる所: "+_w21_hz(pts[mi][0])+" で "+_w21_pm(-pts[mi][1],1)+" dB<br>";}
    h+="減衰: DC-DC の周波数 "+_w21_hz(fsw)+" で <b>"+_w21_f(aSW,1)+" dB</b>（C/N<sub>0</sub> の下がりを 0.5 dB 以内にするには "+_w21_f(Math.max(0,need),1)+" dB 要る）、L1 の高さ（2 MHz の 788 次 1576 MHz）で <b>"+_w21_f(aL1,1)+" dB</b><br>";
    h+="C/N<sub>0</sub> = 47.5 − 10 log<sub>10</sub>(1 + N<sub>p</sub>/N<sub>0</sub>) = <b>"+_w21_f(cn,1)+" dB-Hz</b>"+(cn>=47?'（<span class="ok">ほぼ元に戻る</span>）':(cn<40?'（<span class="warn">大きく下がる</span>）':""));
    ro.innerHTML=h+'<div class="wnote">部品の寄生成分は例の値（コイルは 2.2 µH で 60 MHz で自己共振する巻線の間の容量、ビーズは 1.5 µH・60 MHz で抵抗に変わる傾向のモデル、コンデンサは ESR 5 mΩ・ESL 0.5 nH）。基板の上の結合は入れていないので、高い周波数の減衰は実際より大きく出る。揺れの鎖は 10 章 2 節の例のモデル（1 mVpp で N<sub>p</sub> = N<sub>0</sub>）。</div>';
  }
  draw();
};
function _w21_vstr(v){return v>=1?_w21_f(v,2)+" mVpp":(v>=0.001?_w21_f(v*1000,v>=0.01?0:1)+" µVpp":v.toExponential(1).replace("-","−")+" mVpp");}

/* ---- 4 節: シールドケースの隙間（目安の式 SE ≈ 20 log10(λ/(2ℓ))。f21.py の _f21_se と同じ） ---- */
function _w21_se(l,f){var v=_W21_C/f/(2*l);return v>1?20*Math.log10(v):0;}
REG.w21_shield=function(el,U){
  var S=U.S;
  U.head(el,"SHIELD SLOT","シールドケースの隙間 — 隙間の長さと、漏れやすい周波数・L1 での SE・C/N<sub>0</sub>");
  var r1=U.ctrls(el);
  var lsl=U.slider(r1,"隙間の長さ ℓ",{min:1,max:200,log:true,value:10,fmt:function(v){return _w21_f(v,v<10?1:0)+" mm";},onInput:function(){draw();}});
  var jsl=U.slider(r1,"シールドが無いときの N<sub>J</sub>/N<sub>0</sub>",{min:-10,max:20,step:0.5,value:6,fmt:function(v){return _w21_pm(v,1)+" dB";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function setv(l){lsl.set(l);draw();}
  U.button(br,"本文の例: 10 mm",function(){setv(10);});
  U.button(br,"3 mm",function(){setv(3);});
  U.button(br,"24 mm",function(){setv(24);});
  U.button(br,"95 mm（L1 の半波長）",function(){setv(95.1);});
  U.button(br,"127 mm（L5 の半波長）",function(){setv(127.4);});
  var box=U.svgbox(el),ro=U.readout(el);
  function draw(){
    var l=lsl.get()/1000,nj=jsl.get(),nar=_w21_nar(box),Wd=nar?400:700,o=[],fr=_W21_C/(2*l);
    /* (a) 隙間と半波長の目盛 */
    o.push(S.T(nar?6:14,16,"(a) 隙間の長さと、L1・L5 の半波長","start",11,"ink",true));
    var sx=nar?1.6:3.0,x0=nar?14:24,y0=54,lmax=nar?200:200;
    o.push(S.RECT(x0,y0,lmax*sx,14,2,U.soft("muted"),"muted",1.2));
    var lp=Math.min(l*1000,lmax);o.push(S.RECT(x0+4,y0+4,lp*sx,6,1,"var(--screen)","alias",1.6));
    var ah=Math.min(22,6+lp*0.15),apts=[];for(var i=0;i<=40;i++){var u=i/40;apts.push([x0+4+u*lp*sx,y0-2-ah*Math.sin(Math.PI*u)]);}
    o.push(S.PL(apts,"alias",1.6,null,"4 2"));
    o.push(S.T(x0+4+lp*sx/2,y0-ah-6,"隙間 "+_w21_f(l*1000,l<0.01?1:0)+" mm（共振 "+_w21_hz(fr)+"）","middle",9,"alias",true,false,null,true));
    [[_W21_C/_W21_L1/2,"L1 の λ/2","signal"],[_W21_C/1176.45e6/2,"L5 の λ/2","teal"],[_W21_C/_W21_L1/20,"L1 の λ/20","green"]].forEach(function(m,i){var xx=x0+4+m[0]*1000*sx;if(m[0]*1000>lmax)return;
      o.push(S.L(xx,y0+16,xx,y0+30+i*0,m[2],1.6));o.push(S.T(xx,y0+42+(i===1?12:0),m[1]+" "+_w21_f(m[0]*1000,m[0]<0.02?1:0)+" mm","middle",8.5,m[2],true,false,null,true));});
    /* (b) SE と周波数 */
    var bx=nar?58:420,by=nar?140:30,B=U.plot(bx,by,nar?320:262,150,[0.3,6],[0,50],{xlog:true});
    o.push(S.T(nar?6:376,by-14,"(b) SE と周波数（目安の式）","start",11,"ink",true));
    o.push(S.RECT(B.X(1.164),B.y,B.X(1.610)-B.X(1.164),B.h,0,U.soft("signal"),"none",0));
    o.push(B.axes({xl:"周波数 f [GHz]",yl:"SE [dB]",xt:[0.3,0.5,1,2,3,6],yt:[0,10,20,30,40,50],sz:9,ylOff:38,xfmt:function(v){return String(v);}}));
    var fs=U.ctl.logspace(Math.log10(0.3),Math.log10(6),240);
    o.push(B.clip(fs.map(function(f){return [f,_w21_se(l,f*1e9)];}),"alias",2.4));
    [[1.57542,"L1","signal"],[1.17645,"L5","teal"]].forEach(function(q,i){var v=_w21_se(l,q[0]*1e9);o.push(S.D(B.X(q[0]),B.Y(v),q[2],4));
      o.push(S.T(B.X(q[0])+(i?-6:6),B.Y(v)-6,q[1]+" "+_w21_f(v,1),i?"end":"start",9,q[2],true,false,null,true));});
    if(fr/1e9<6&&fr/1e9>0.3){o.push(S.L(B.X(fr/1e9),B.y,B.X(fr/1e9),B.y+B.h,"alias",1,"3 3"));o.push(S.T(B.X(fr/1e9),B.y+12,"c/(2ℓ)","middle",8.5,"alias",true,false,null,true));}
    box.set(S.svg(Wd,B.y+B.h+(nar?44:40),o));
    var se=_w21_se(l,_W21_L1),se5=_w21_se(l,1176.45e6),r0=Math.pow(10,nj/10),r1=Math.pow(10,(nj-se)/10),c0=_W21_CN0-_w21_drop(r0),c1=_W21_CN0-_w21_drop(r1);
    var h="漏れやすい周波数 c/(2ℓ) = <b>"+_w21_hz(fr)+"</b>。SE（目安）: L1 で <b>"+_w21_f(se,1)+" dB</b>、L5 で "+_w21_f(se5,1)+" dB"+(se<=0?'（<span class="warn">L1 で共振より上: ほとんど遮らない</span>）':"")+"<br>";
    h+="N<sub>J</sub>/N<sub>0</sub>: "+_w21_pm(nj,1)+" → <b>"+_w21_pm(nj-se,1)+" dB</b>、C/N<sub>0</sub>: "+_w21_f(c0,1)+" → <b>"+_w21_f(c1,1)+" dB-Hz</b>（L1 の妨害が、この隙間を通る経路だけで届くとき）";
    ro.innerHTML=h+'<div class="wnote">隙間 1 つの目安の式（筐体設計シリーズ 14 章 4 節）。隙間の幅・奥行き・数・源との位置、箱の中の共振で変わるので、桁を見るためのもの。9 章 1 節の例の受信機（C/N<sub>0</sub> 47.5 dB-Hz）。</div>';
  }
  draw();
};
