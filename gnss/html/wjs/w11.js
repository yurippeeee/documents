/* ===== 11 章 RF の基板設計 — 50 Ω の配線と部品の置き方 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w11_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w11_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
var _W11_C=299792458,_W11_F1=1575.42e6,_W11_ER=4.4,_W11_H=0.2,_W11_T=0.035;
/* ---- 線路の式（本文 2 節と同じ） ---- */
/* マイクロストリップ線路の近似式（IPC-2141 の形。基板アートワークシリーズ 10 章 3 節と同じ式）。単位 mm */
function _w11_zipc(w,h,t,er){return 87/Math.sqrt(er+1.41)*Math.log(5.98*h/(0.8*w+t));}
function _w11_eesimple(w,h,er){return (er+1)/2+(er-1)/2/Math.sqrt(1+12*h/w);}
/* Hammerstad と Jensen の式（銅の厚さの補正つき。数値の計算と例の範囲で 1 % 以内で一致する）。返り値 [Z0, 実効比誘電率] */
function _w11_hj(w,h,t,er){var ETA=376.730313668,u=w/h,du1=0,dur=0;
  function z01(u){var f=6+(2*Math.PI-6)*Math.exp(-Math.pow(30.666/u,0.7528));return ETA/(2*Math.PI)*Math.log(f/u+Math.sqrt(1+4/(u*u)));}
  function ee(u){var a=1+Math.log((Math.pow(u,4)+Math.pow(u/52,2))/(Math.pow(u,4)+0.432))/49+Math.log(1+Math.pow(u/18.1,3))/18.7,b=0.564*Math.pow((er-0.9)/(er+3),0.053);return (er+1)/2+(er-1)/2*Math.pow(1+10/u,-a*b);}
  if(t>0){var th=t/h,ct=1/Math.tanh(Math.sqrt(6.517*u));du1=th/Math.PI*Math.log(1+4*Math.E/(th*ct*ct));dur=0.5*(1+1/Math.cosh(Math.sqrt(er-1)))*du1;}
  var u1=u+du1,ur=u+dur;return [z01(ur)/Math.sqrt(ee(ur)),ee(ur)*Math.pow(z01(u1)/z01(ur),2)];}
/* 第 1 種の完全楕円積分 K(k)（算術幾何平均） */
function _w11_K(k){var a=1,b=Math.sqrt(1-k*k);for(var i=0;i<40;i++){var a2=(a+b)/2;b=Math.sqrt(a*b);a=a2;if(Math.abs(a-b)<1e-15)break;}return Math.PI/(2*a);}
function _w11_kk(k){return _w11_K(k)/_w11_K(Math.sqrt(1-k*k));}
/* コプレーナ線路（グラウンド付き）の、上の銅の厚さを 0 とした等角写像の近似式。返り値 [Z0, 実効比誘電率] */
function _w11_gcpw(w,s,h,er){var k1=w/(w+2*s),k2=Math.tanh(Math.PI*w/(4*h))/Math.tanh(Math.PI*(w+2*s)/(4*h)),a=_w11_kk(k1),b=_w11_kk(k2);
  var ee=(1+er*b/a)/(1+b/a);return [60*Math.PI/Math.sqrt(ee)/(a+b),ee];}
/* 例の基板（h）で特性インピーダンス z になるマイクロストリップ線路の幅（Hammerstad と Jensen の式を二分法で解く） */
function _w11_wfor(z,h){var lo=0.005,hi=20;for(var i=0;i<60;i++){var m=Math.sqrt(lo*hi);if(_w11_hj(m,h,_W11_T,_W11_ER)[0]>z)lo=m;else hi=m;}return Math.sqrt(lo*hi);}

/* ---- 断面の 2 次元の静電界（有限体積法。図の計算（f11.py）と同じ考え方で、対称な右半分だけを解く） ---- */
function _w11_grid(keys,lo,hi,fine,grow,cap){keys=keys.filter(function(k){return k>=lo&&k<=hi;}).concat([lo,hi]).sort(function(a,b){return a-b;});
  var pts=[lo];while(pts[pts.length-1]<hi-1e-12){var x=pts[pts.length-1],d=Infinity,nxt=hi;
    keys.forEach(function(k){d=Math.min(d,Math.abs(x-k));if(k>x+1e-12&&k<nxt)nxt=k;});
    var st=Math.min(cap,fine+(grow-1)*d);st=Math.min(st,fine+(grow-1)*Math.max(0,nxt-x-st));st=Math.max(st,fine*0.5);
    if(x+st>nxt-0.3*fine)st=nxt-x;pts.push(x+st);}
  return pts;}
/* 線（幅 w、厚さ t、誘電体の厚さ h、比誘電率 er、隙間 s（null ならマイクロストリップ））の電位を、格子の細かさ fine で解く。
   返り値 {W: 誘電体ありのエネルギー（容量に比例）, Wa: 空気だけ, xs, ys, phi}（右半分） */
function _w11_fd(w,h,t,er,s,fine){
  var X=Math.max(25*h,1.5*w+12*h,(s!=null?w/2+s:0)+12*h),Y=Math.max(25*h,12*h+w),cap=h;
  var xs=_w11_grid([0,w/2].concat(s!=null?[w/2+s]:[]),0,X,fine,1.25,cap),ys=_w11_grid([0,h,h+t],0,Y,fine,1.25,cap);
  var nx=xs.length,ny=ys.length,i,j,k;
  var V=new Float64Array(nx*ny),fix=new Uint8Array(nx*ny);
  for(i=0;i<nx;i++)for(j=0;j<ny;j++){var x=xs[i],y=ys[j],q=i*ny+j,inC=(y>=h-1e-12&&y<=h+t+1e-12);
    if(x<=w/2+1e-12&&inC){fix[q]=1;V[q]=1;}
    else if(y<=1e-12||x>=X-1e-12||y>=Y-1e-12||(s!=null&&x>=w/2+s-1e-12&&inC)){fix[q]=1;V[q]=0;}}
  /* 並べ方: 帯の幅が小さくなる向き */
  var byX=nx<ny,bw=byX?nx:ny,n=nx*ny,B1=bw+1;
  var ID=new Int32Array(nx*ny);for(i=0;i<nx;i++)for(j=0;j<ny;j++)ID[i*ny+j]=byX?j*nx+i:i*ny+j;
  function run(e){
    var GE=new Float64Array(nx*ny),GN=new Float64Array(nx*ny);   /* (i,j)-(i+1,j) と (i,j)-(i,j+1) のコンダクタンス */
    for(i=0;i<nx-1;i++)for(j=0;j<ny;j++){var dx=xs[i+1]-xs[i],lo=0,up=0;
      if(j>0)lo=((ys[j-1]+ys[j]<2*h)?e:1)*(ys[j]-ys[j-1])/2;if(j<ny-1)up=((ys[j]+ys[j+1]<2*h)?e:1)*(ys[j+1]-ys[j])/2;GE[i*ny+j]=(lo+up)/dx;}
    for(i=0;i<nx;i++)for(j=0;j<ny-1;j++){var dy=ys[j+1]-ys[j],em=(ys[j]+ys[j+1]<2*h)?e:1,le=i>0?em*(xs[i]-xs[i-1])/2:0,ri=i<nx-1?em*(xs[i+1]-xs[i])/2:0;GN[i*ny+j]=(le+ri)/dy;}
    var A=new Float64Array(n*B1),b=new Float64Array(n);
    function add(p1,p2,g){var a=ID[p1],c=ID[p2],fa=fix[p1],fc=fix[p2];
      if(!fa){A[a*B1]+=g;if(fc)b[a]+=g*V[p2];}
      if(!fc){A[c*B1]+=g;if(fa)b[c]+=g*V[p1];}
      if(!fa&&!fc){var hi=a>c?a:c,lo2=a>c?c:a;A[hi*B1+(hi-lo2)]-=g;}}
    for(i=0;i<nx-1;i++)for(j=0;j<ny;j++)add(i*ny+j,(i+1)*ny+j,GE[i*ny+j]);
    for(i=0;i<nx;i++)for(j=0;j<ny-1;j++)add(i*ny+j,i*ny+j+1,GN[i*ny+j]);
    for(k=0;k<nx*ny;k++)if(fix[k]){var q2=ID[k];A[q2*B1]=1;b[q2]=V[k];}
    /* 帯の Cholesky 分解 L L^T（L(r, c) を A[r*B1 + (r − c)] に上書きする） */
    var r,c,kk,sm,pr,pc;
    for(r=0;r<n;r++){var r0=r-bw>0?r-bw:0;pr=r*B1+r;
      for(c=r0;c<=r;c++){pc=c*B1+c;sm=A[pr-c];var k0=c-bw>r0?c-bw:r0;
        for(kk=k0;kk<c;kk++)sm-=A[pr-kk]*A[pc-kk];
        if(c===r)A[r*B1]=Math.sqrt(sm>1e-300?sm:1e-300);else A[pr-c]=sm/A[c*B1];}}
    var yv=new Float64Array(n);
    for(r=0;r<n;r++){sm=b[r];pr=r*B1+r;for(kk=(r-bw>0?r-bw:0);kk<r;kk++)sm-=A[pr-kk]*yv[kk];yv[r]=sm/A[r*B1];}
    var xv=new Float64Array(n),nm=n-1;
    for(r=nm;r>=0;r--){sm=yv[r];var ke=r+bw<nm?r+bw:nm;for(kk=r+1;kk<=ke;kk++)sm-=A[kk*B1+(kk-r)]*xv[kk];xv[r]=sm/A[r*B1];}
    var phi=new Float64Array(nx*ny);for(k=0;k<nx*ny;k++)phi[k]=xv[ID[k]];
    var Wd=0,d;
    for(i=0;i<nx-1;i++)for(j=0;j<ny;j++){d=phi[i*ny+j]-phi[(i+1)*ny+j];Wd+=GE[i*ny+j]*d*d;}
    for(i=0;i<nx;i++)for(j=0;j<ny-1;j++){d=phi[i*ny+j]-phi[i*ny+j+1];Wd+=GN[i*ny+j]*d*d;}
    return {W:Wd,phi:phi};}
  var rd=run(er),ra=run(1);
  return {W:rd.W,Wa:ra.W,xs:xs,ys:ys,phi:rd.phi,nx:nx,ny:ny};}
/* 2 つの細かさで解いて外挿した特性インピーダンスと実効比誘電率（誤差は格子の細かさにほぼ比例するので、2 Z(f) − Z(2f)） */
function _w11_line(w,h,t,er,s){var m=Math.min(h,w/2,s!=null?s:9),f=m/16;
  var a=_w11_fd(w,h,t,er,s,f),b=_w11_fd(w,h,t,er,s,2*f),EPS0=8.8541878128e-12;
  function z(r){return 1/(_W11_C*EPS0*2*Math.sqrt(r.W*r.Wa));}   /* 右半分のエネルギーの 2 倍が全体 */
  return {Z0:2*z(a)-z(b),ee:2*(a.W/a.Wa)-(b.W/b.Wa),fd:a};}

/* ---- 共通: スミスチャートの地（50 Ω で正規化） ---- */
function _w11_smith(S,o,cx,cy,R){
  function g2(G){return [cx+R*G[0],cy-R*G[1]];}
  function zg(r,x){var d=(r+1)*(r+1)+x*x;return [((r*r-1)+x*x)/d,2*x/d];}
  o.push(S.CIRC(cx,cy,R,"ink",1.3,"screen"));o.push(S.L(cx-R,cy,cx+R,cy,"muted",1));
  var lg=[],i;for(i=-30;i<=30;i++)lg.push(Math.pow(10,i/10));
  [0.2,0.5,1,2].forEach(function(r){var q=[];lg.forEach(function(x){q.push(g2(zg(r,-x)));});q.reverse();q.push(g2(zg(r,0)));lg.forEach(function(x){q.push(g2(zg(r,x)));});o.push(S.PL(q,r===1?"muted":"faint",r===1?1:0.8,null,r===1?null:"3 3"));});
  [0.5,1,2].forEach(function(x){[1,-1].forEach(function(sg){var q=[g2(zg(0,sg*x))];lg.forEach(function(r){q.push(g2(zg(r,sg*x)));});o.push(S.PL(q,"faint",0.8,null,"3 3"));});});
  o.push(S.T(cx-R-4,cy-5,"短絡","end",9,"ink",true));o.push(S.T(cx+R+4,cy-5,"開放","start",9,"ink",true));
  return g2;}
/* 複素数の小さな計算 */
function _w11_cdiv(a,b){var d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];}
function _w11_cmul(a,b){return [a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];}
function _w11_gam(z,zr){return _w11_cdiv([z[0]-zr,z[1]],[z[0]+zr,z[1]]);}
/* ---- 1 節の後: 線の特性インピーダンス・長さ・負荷・周波数と、反射 ---- */
REG.w11_reflect=function(el,U){
  var S=U.S;
  U.head(el,"WHY 50 Ω","50 Ω の部品の間の線 — 線の上の電圧の振幅とスミスチャート、手前から見た反射");
  var r1=U.ctrls(el);
  var brd=U.select(r1,"基板",["例の 4 層の基板（h = 0.2 mm）","2 層の基板（h = 1.6 mm）"],0,function(){zz.refresh();draw();});
  var zz=U.slider(r1,"線の Z<sub>0</sub>",{min:25,max:130,step:1,value:75,fmt:function(v){var w=_w11_wfor(v,hh());return v+" Ω（幅 "+(w<0.03?"0.03 mm 未満で作れない":_w11_f(w,w<1?2:1)+" mm")+"）";},onInput:function(){draw();}});
  var ll=U.slider(r1,"線の長さ ℓ",{min:0,max:60,step:0.1,value:27.8,fmt:function(v){return _w11_f(v,1)+" mm";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var LOADS=[{t:"モジュールの入力（50 Ω）",z:[50,0]},{t:"25 Ω",z:[25,0]},{t:"100 Ω",z:[100,0]},{t:"30 − j20 Ω（6 節の例のアンテナ）",z:[30,-20]},{t:"開放",z:[Infinity,0]},{t:"短絡",z:[0,0]}];
  var ld=U.select(r2,"負荷",LOADS.map(function(L){return L.t;}),0,function(){draw();});
  var FR=[["L1（1575.42 MHz）",1575.42e6],["L5（1176.45 MHz）",1176.45e6],["10 MHz",10e6]];
  var fq=U.select(r2,"周波数",FR.map(function(f){return f[0];}),0,function(){draw();});
  var br=U.btnrow(el);
  function setv(b,z,l,L,f){brd.set(b);zz.set(z);ll.set(l);ld.set(L);fq.set(f);zz.refresh();draw();}
  U.button(br,"本文の例（75 Ω・1/4 波長 27.8 mm）",function(){setv(0,75,27.8,0,0);});
  U.button(br,"50 Ω の線",function(){setv(0,50,27.8,0,0);});
  U.button(br,"75 Ω で 1/10 波長（10 mm）",function(){setv(0,75,10,0,0);});
  U.button(br,"2 層の基板の幅 0.3 mm（126 Ω）",function(){setv(1,126,27.8,0,0);});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"線の寸法と実効比誘電率は、選んだ基板（比誘電率 4.4・銅 35 µm）で Hammerstad と Jensen の式（2 節の数値の計算と 1 % 以内）から求めた。線の損失は無いとした。手前は 50 Ω の部品（アンテナや LNA の出力）で、手前から見た反射は 50 Ω を基準にした値。");
  function hh(){return brd.get()===0?0.2:1.6;}
  function draw(){
    var nar=_w11_nar(box),Wd=nar?400:700,o=[],z0=zz.get(),L=ll.get(),f=FR[fq.get()][1],zl=LOADS[ld.get()].z;
    var w=_w11_wfor(z0,hh()),ee=_w11_hj(w,hh(),_W11_T,_W11_ER)[1],lg=_W11_C/f*1e3/Math.sqrt(ee),beta=2*Math.PI/lg;
    /* 負荷の反射係数（線の Z0 を基準） */
    var gL=isFinite(zl[0])?_w11_gam(zl,z0):[1,0];
    function zinAt(d){var e=[Math.cos(2*beta*d),-Math.sin(2*beta*d)],g=_w11_cmul(gL,e);var den=[1-g[0],-g[1]];if(Math.hypot(den[0],den[1])<1e-12)return [1e12,0];return _w11_cdiv([z0*(1+g[0]),z0*g[1]],den);}
    /* (a) 線と電圧の振幅 */
    var ax=nar?40:44,aw=nar?320:340,ay=36,ah=110;
    o.push(S.T(10,18,"(a) 線の上の電圧の振幅（入ってくる波 = 1）","start",10.5,"ink",true));
    var P=U.plot(ax,ay,aw,ah,[0,60],[0,2.1]);
    o.push(P.axes({xt:[0,10,20,30,40,50,60],yt:[0,1,2],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);}}));
    o.push(S.T(ax+aw/2,ay+ah+31,"信号源からの距離 [mm]","middle",10,"muted"));
    var pts=[],k;for(k=0;k<=240;k++){var x=L*k/240,d=L-x;pts.push([x,Math.hypot(1+gL[0]*Math.cos(2*beta*d)+gL[1]*Math.sin(2*beta*d),-gL[0]*Math.sin(2*beta*d)+gL[1]*Math.cos(2*beta*d))]);}
    if(L>0)o.push(P.line(pts,"purple",2.2));
    /* 線（基板の上） */
    var ly=ay+ah+64;o.push(S.RECT(P.X(0),ly-6,Math.max(P.X(L)-P.X(0),1),12,2,U.soft("gold"),"gold",1));
    o.push(S.L(P.X(0),ly,P.X(L),ly,"signal",3));
    o.push(S.RECT(P.X(0)-26,ly-10,22,20,3,"panel","ink",1.2));o.push(S.T(P.X(0)-15,ly+28,"信号源","middle",9,"ink",true));
    o.push(S.RECT(P.X(L)+4,ly-10,22,20,3,U.soft("alias"),"alias",1.2));o.push(S.T(P.X(L)+15,ly+28,"負荷","middle",9,"alias",true));
    o.push(S.T(P.X(L/2),ly-12,"線 "+z0+" Ω・"+_w11_f(L,1)+" mm","middle",9.5,"signal",true,false,null,true));
    /* (b) スミスチャート */
    var cx=nar?200:560,cy=nar?ly+194:150,R=nar?120:118;
    o.push(S.T(nar?10:430,nar?ly+56:18,"(b) 手前から見たインピーダンス（50 Ω を基準）","start",10.5,"ink",true));
    var g2=_w11_smith(S,o,cx,cy,R);
    var full=[],part=[];for(k=0;k<=200;k++){var d1=lg/2*k/200;full.push(g2(_w11_gam(zinAt(d1),50)));}
    for(k=0;k<=200;k++){var d2=L*k/200;part.push(g2(_w11_gam(zinAt(d2),50)));}
    o.push(S.PL(full,"faint",1.2,null,"4 3"));o.push(S.PL(part,"signal",2.2));
    var zin=zinAt(L),gin=_w11_gam(zin,50),mg=Math.min(1,Math.hypot(gin[0],gin[1]));
    var pL=g2(isFinite(zl[0])?_w11_gam(zl,50):[1,0]),pI=g2(gin);
    o.push(S.D(pL[0],pL[1],"alias",5));o.push(S.D(pI[0],pI[1],"signal",5.5));
    o.push(S.T(pL[0]+7,pL[1]+15,"負荷","start",9.5,"alias",true,false,null,true));
    o.push(S.T(pI[0]+(gin[0]>0.25?-7:7),pI[1]-8,"手前から見た点",gin[0]>0.25?"end":"start",9.5,"signal",true,false,null,true));
    var H=nar?cy+R+20:Math.max(cy+R+24,ly+40);
    box.set(S.svg(Wd,H,o));
    var rl=-20*Math.log10(Math.max(mg,1e-12)),vs=mg>=0.9999?Infinity:(1+mg)/(1-mg),ml=mg>=0.9999?Infinity:-10*Math.log10(1-mg*mg);
    var zt=Math.abs(zin[0])>1e9?"∞（開放）":_w11_f(zin[0],1)+(zin[1]<0?" − j":" + j")+_w11_f(Math.abs(zin[1]),1)+" Ω";
    ro.innerHTML="線の上の波長 λ<sub>g</sub> = "+_w11_f(lg,1)+" mm（実効比誘電率 "+_w11_f(ee,2)+"）、ℓ = "+_w11_f(L/lg,3)+" λ<sub>g</sub>（Γ の回る角 2βℓ = "+_w11_f(720*L/lg%360,0)+"°）<br>"+
      "手前から見たインピーダンス Z<sub>in</sub> = <b>"+zt+"</b>、|Γ| = <b>"+_w11_f(mg,3)+"</b><br>"+
      "リターンロス <b>"+(rl>99?"∞":_w11_f(rl,1)+" dB")+"</b>、VSWR <b>"+(isFinite(vs)?_w11_f(vs,2):"∞")+"</b>、不整合損失 <b>"+(isFinite(ml)?_w11_f(ml,2)+" dB":"∞")+"</b>（負荷に渡る電力 "+_w11_f(100*(1-mg*mg),1)+" %）"+
      (Math.abs(z0-50)<0.5&&ld.get()===0?' <span class="ok">50 Ω の線なので、どの長さでも反射は無い</span>':"");
  }
  draw();
};

/* ---- 2 節の後: 断面の寸法を変えて、数値で解いた電位と特性インピーダンスを近似式と比べる ---- */
REG.w11_line=function(el,U){
  var S=U.S;
  U.head(el,"CROSS SECTION","線の断面 — 数値で解いた電位と特性インピーダンス、近似式との比較");
  var r1=U.ctrls(el);
  var kind=U.seg(r1,["マイクロストリップ線路","コプレーナ線路（グラウンド付き）"],0,function(){upd();});
  var r2=U.ctrls(el);
  var ww=U.slider(r2,"線の幅 w",{min:0.05,max:4,log:true,value:0.351,snap:function(v){return v<1?Math.round(v*1000)/1000:Math.round(v*100)/100;},fmt:function(v){return _w11_f(v,v<1?3:2)+" mm";},onInput:function(){upd();}});
  var ss=U.slider(r2,"隙間 s（コプレーナ）",{min:0.1,max:1.0,step:0.01,value:0.2,fmt:function(v){return _w11_f(v,2)+" mm";},onInput:function(){if(kind.get()===0)kind.set(1);upd();}});
  var r3=U.ctrls(el);
  var hh=U.slider(r3,"誘電体の厚さ h",{values:[0.1,0.15,0.2,0.3,0.4,0.6,0.8,1.0,1.2,1.6],value:0.2,fmt:function(v){return _w11_f(v,2)+" mm";},onInput:function(){upd();}});
  var er=U.slider(r3,"比誘電率 ε<sub>r</sub>",{min:2.2,max:10,step:0.1,value:4.4,fmt:function(v){return _w11_f(v,1);},onInput:function(){upd();}});
  var tt=U.slider(r3,"銅の厚さ t<sub>Cu</sub>",{values:[0,0.018,0.035,0.07],value:0.035,fmt:function(v){return v===0?"0（式と同じ）":_w11_f(v*1000,0)+" µm";},onInput:function(){upd();}});
  var br=U.btnrow(el);
  function setv(k,w,s,h,e,t){kind.set(k);ww.set(w);ss.set(s);hh.set(h);er.set(e);tt.set(t);upd();}
  U.button(br,"本文の例（0.35 mm）",function(){setv(0,0.351,0.2,0.2,4.4,0.035);});
  U.button(br,"近似式の幅（0.33 mm）",function(){setv(0,0.330,0.2,0.2,4.4,0.035);});
  U.button(br,"コプレーナ（0.31 mm・隙間 0.2 mm）",function(){setv(1,0.308,0.2,0.2,4.4,0.035);});
  U.button(br,"コプレーナ（厚さ 0 の式の幅 0.36 mm）",function(){setv(1,0.360,0.2,0.2,4.4,0.035);});
  U.button(br,"2 層の基板（1.6 mm・幅 3.0 mm）",function(){setv(0,3.0,0.2,1.6,4.4,0.035);});
  var b50=U.button(br,"50 Ω の幅を数値の計算で探す",function(){find50();});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"断面の静電界を、細かさの違う 2 つの格子で解いて外挿した（右半分だけを解き、外側の箱は 0 V）。近似式は本文 2 節の式（マイクロストリップ線路は IPC-2141 の形、コプレーナ線路は銅の厚さを 0 とした等角写像の式）。誘電体の損失は、誘電正接 0.02（FR-4 の例の値）として実効比誘電率から求めた（銅の損失は含まない）。");
  var pend=null;
  function upd(){if(pend)return;pend=setTimeout(function(){pend=null;draw();},16);}
  function cur(){return {g:kind.get()===1,w:ww.get(),s:ss.get(),h:hh.get(),e:er.get(),t:tt.get()};}
  function calc(c){return _w11_line(c.w,c.h,c.t,c.e,c.g?c.s:null);}
  function approx(c){if(c.g)return _w11_gcpw(c.w,c.s,c.h,c.e);return [_w11_zipc(c.w,c.h,c.t,c.e),_w11_eesimple(c.w,c.h,c.e)];}
  function find50(){var c=cur(),w0=c.w,f=function(w){var q=cur();q.w=w;return calc(q).Z0-50;};
    /* 近似式の幅から始めて、割線法で数値の計算の 50 Ω の幅を探す */
    var lo=0.02,hi=10;for(var i=0;i<60;i++){var m=Math.sqrt(lo*hi),q=cur();q.w=m;if(approx(q)[0]>50)lo=m;else hi=m;}
    var a=Math.sqrt(lo*hi),b=a*1.06,fa=f(a),fb=f(b);
    for(var it=0;it<6&&Math.abs(fb)>0.005;it++){var nw=b-fb*(b-a)/(fb-fa);if(!(nw>0.02))break;a=b;fa=fb;b=nw;fb=f(b);}
    if(isFinite(b)&&b>0.02&&b<10)ww.set(Math.round(b*1000)/1000);else ww.set(w0);draw();}
  function contours(r,lev){var xs=r.xs,ys=r.ys,ny=r.ny,ph=r.phi,out=[],i,j;
    for(i=0;i<r.nx-1;i++)for(j=0;j<ny-1;j++){var v=[ph[i*ny+j],ph[(i+1)*ny+j],ph[(i+1)*ny+j+1],ph[i*ny+j+1]],p=[[xs[i],ys[j]],[xs[i+1],ys[j]],[xs[i+1],ys[j+1]],[xs[i],ys[j+1]]],q=[];
      for(var k=0;k<4;k++){var a=v[k],b=v[(k+1)%4];if((a-lev)*(b-lev)<0){var tt2=(lev-a)/(b-a),pa=p[k],pb=p[(k+1)%4];q.push([pa[0]+tt2*(pb[0]-pa[0]),pa[1]+tt2*(pb[1]-pa[1])]);}}
      if(q.length===2)out.push(q);else if(q.length===4){out.push([q[0],q[1]]);out.push([q[2],q[3]]);}}
    return out;}
  function draw(){
    var c=cur(),nar=_w11_nar(box),Wd=nar?400:700,o=[];
    ss.el.style.opacity=c.g?"1":"0.55";
    var r=calc(c),ap=approx(c),lg=_W11_C/_W11_F1*1e3/Math.sqrt(r.ee);
    /* 断面（線の周りを拡大） */
    var xr=Math.max(c.w/2+(c.g?c.s:0)+2.2*c.h,c.w/2+3*c.h),top=Math.max(3*c.h,c.w*0.9),pw=nar?370:420,phh=nar?190:230;
    var sc=Math.min(pw/(2*xr),(phh-30)/(top+0.35*c.h)),x0=nar?15:14,y0=46+top*sc;
    function X(v){return x0+pw/2+v*sc;}function Y(v){return y0-v*sc;}
    o.push(S.T(10,18,"(a) 断面と等電位の線（線 1 V・グラウンド 0 V、0.1 V おき）","start",10.5,"ink",true));
    var id="w11cl"+Math.round(Math.random()*1e9),clip='<clipPath id="'+id+'"><rect x="'+X(-xr)+'" y="'+Y(top)+'" width="'+(2*xr*sc)+'" height="'+(top*sc)+'"/></clipPath>';
    var body=[S.RECT(X(-xr),Y(c.h),2*xr*sc,c.h*sc,0,U.soft("gold"),"none",0)];
    for(var lev=0.1;lev<0.95;lev+=0.1){contours(r.fd,lev).forEach(function(sg){var a=sg[0],b=sg[1];if(Math.max(a[0],b[0])>xr+0.5||Math.min(a[1],b[1])>top+0.5)return;
      body.push(S.L(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),"purple",1));body.push(S.L(X(-a[0]),Y(a[1]),X(-b[0]),Y(b[1]),"purple",1));});}
    o.push(clip+'<g clip-path="url(#'+id+')">'+body.join("")+'</g>');
    o.push(S.L(X(-xr),Y(c.h),X(xr),Y(c.h),"gold",0.8));
    o.push(S.RECT(X(-xr),y0,2*xr*sc,7,0,"var(--muted-soft)","muted",1));
    var tp=Math.max(c.t*sc,2);
    o.push(S.RECT(X(-c.w/2),Y(c.h)-tp,c.w*sc,tp,0,"signal","signal",0.6));
    if(c.g){o.push(S.RECT(X(-xr),Y(c.h)-tp,(xr-c.w/2-c.s)*sc,tp,0,"var(--muted-soft)","muted",0.8));o.push(S.RECT(X(c.w/2+c.s),Y(c.h)-tp,(xr-c.w/2-c.s)*sc,tp,0,"var(--muted-soft)","muted",0.8));}
    o.push(S.T(X(0),Y(c.h)-tp-6,"w = "+_w11_f(c.w,c.w<1?3:2)+" mm","middle",9.5,"signal",true,false,null,true));
    o.push(S.T(X(-xr)+4,Y(c.h/2)+4,"h = "+_w11_f(c.h,2)+" mm","start",9.5,"gold",true,false,null,true));
    if(c.g)o.push(S.T(X(c.w/2+c.s/2),Y(c.h)+14,"s","middle",9.5,"ink",true,false,null,true));
    /* (b) 数値（右、狭い画面では下） */
    var bx=nar?20:458,by=nar?y0+40:40,lines=[
      ["数値の計算",null,"ink"],
      ["Z_0 = "+_w11_f(r.Z0,1)+" Ω","Z",Math.abs(r.Z0-50)<=1?"green":"signal"],
      ["ε_{eff} = "+_w11_f(r.ee,2),"e","signal"],
      ["線の上の波長 "+_w11_f(lg,1)+" mm",null,"muted"],
      ["1/10 波長 "+_w11_f(lg/10,1)+" mm",null,"muted"],
      ["近似式（"+(c.g?"厚さ 0 の等角写像":"IPC-2141 の形")+"）",null,"ink"],
      ["Z_0 = "+_w11_f(ap[0],1)+" Ω（差 "+(ap[0]-r.Z0>=0?"+":"")+_w11_f(ap[0]-r.Z0,1)+" Ω）",null,"gold"],
      ["ε_{eff} = "+_w11_f(ap[1],2),null,"gold"]];
    var gap=nar?17:22;
    lines.forEach(function(L,k){var y=by+k*gap+(k>=5?8:0);o.push(S.TX(bx,y,L[0],"start",k===0||k===5?10.5:(L[1]?12:10),L[2],k<3||k===5||k===6));});
    var H=nar?by+lines.length*gap+18:Math.max(y0+28,by+lines.length*gap+20);
    box.set(S.svg(Wd,H,o));
    var ad=27.3*c.e*(r.ee-1)*0.02/(Math.sqrt(r.ee)*(c.e-1)*(_W11_C/_W11_F1));   /* dB/m */
    ro.innerHTML="特性インピーダンス（数値の計算） <b>"+_w11_f(r.Z0,1)+" Ω</b>"+(Math.abs(r.Z0-50)<=0.5?' <span class="ok">50 Ω</span>':(r.Z0>50?"（50 Ω より高い: 幅を広げるか、h を薄く）":"（50 Ω より低い: 幅を狭めるか、h を厚く）"))+
      "、実効比誘電率 <b>"+_w11_f(r.ee,2)+"</b>、L1 の線の上の波長 <b>"+_w11_f(lg,1)+" mm</b><br>"+
      "近似式: "+_w11_f(ap[0],1)+" Ω（数値の計算との差 "+_w11_f(ap[0]-r.Z0,1)+" Ω）。誘電体の損失（誘電正接 0.02）: <b>"+_w11_f(ad/100,3)+" dB/cm</b>";
  }
  draw();
};

/* ---- 5 節の後: 雑音の源を動かして、RF の線との距離・平行な長さ・結合の目安（例のモデル）を見る ---- */
/* 例のモデル: 雑音の源の線の小片 ds と RF の線の小片 dl の結合を cosθ・ds・dl・(h²/2)/(h² + r²)^{3/2} とし、全部を足す。
   無限に長い平行な 2 本では、平行な 1 mm あたり 1/{1 + (d/h)²} になる（本文 5 節の目安と同じ形）。h は 1 層目と 2 層目の間 */
var _W11_RF=[[6,6],[6,20],[44,20]];
function _w11_segpts(a,b,step){var L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/step)),o=[];for(var i=0;i<n;i++){var t=(i+0.5)/n;o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,(b[0]-a[0])/L,(b[1]-a[1])/L,L/n]);}return o;}
function _w11_couple(src,h){var a=[src.x-src.L/2*Math.cos(src.a),src.y-src.L/2*Math.sin(src.a)],b=[src.x+src.L/2*Math.cos(src.a),src.y+src.L/2*Math.sin(src.a)];
  var P=_w11_segpts(a,b,0.25),Q=[],i,j,sum=0,h2=h*h;for(i=0;i<_W11_RF.length-1;i++)Q=Q.concat(_w11_segpts(_W11_RF[i],_W11_RF[i+1],0.25));
  for(i=0;i<P.length;i++)for(j=0;j<Q.length;j++){var dx=P[i][0]-Q[j][0],dy=P[i][1]-Q[j][1],r2=dx*dx+dy*dy,cs=P[i][2]*Q[j][2]+P[i][3]*Q[j][3];
    sum+=cs*P[i][4]*Q[j][4]*(h2/2)/Math.pow(h2+r2,1.5);}
  return {c:Math.abs(sum),a:a,b:b};}
function _w11_dseg(p,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy);t=Math.max(0,Math.min(1,t));var q=[a[0]+t*dx,a[1]+t*dy];return [Math.hypot(p[0]-q[0],p[1]-q[1]),q];}
/* 雑音の源の線と RF の線の最短距離と、その 2 点 */
function _w11_near(a,b){var best=[1e9,null,null],i,k;
  for(i=0;i<_W11_RF.length-1;i++){var A=_W11_RF[i],B=_W11_RF[i+1];
    for(k=0;k<=40;k++){var p=[a[0]+(b[0]-a[0])*k/40,a[1]+(b[1]-a[1])*k/40],d=_w11_dseg(p,A,B);if(d[0]<best[0])best=[d[0],p,d[1]];}
    [A,B].forEach(function(q){var d2=_w11_dseg(q,a,b);if(d2[0]<best[0])best=[d2[0],d2[1],q];});}
  return best;}
/* 平行な長さ: RF の線の各区間と平行（向きの差 10° 以内）で、距離 10 mm 以内の部分の、射影が重なる長さ */
function _w11_par(a,b){var L=0,i,ux=b[0]-a[0],uy=b[1]-a[1],ul=Math.hypot(ux,uy);ux/=ul;uy/=ul;
  for(i=0;i<_W11_RF.length-1;i++){var A=_W11_RF[i],B=_W11_RF[i+1],vx=B[0]-A[0],vy=B[1]-A[1],vl=Math.hypot(vx,vy);vx/=vl;vy/=vl;
    if(Math.abs(ux*vx+uy*vy)<Math.cos(10*Math.PI/180))continue;
    var pa=(a[0]-A[0])*vx+(a[1]-A[1])*vy,pb=(b[0]-A[0])*vx+(b[1]-A[1])*vy,lo=Math.max(0,Math.min(pa,pb)),hi=Math.min(vl,Math.max(pa,pb));
    var dist=Math.abs(((a[0]+b[0])/2-A[0])*(-vy)+((a[1]+b[1])/2-A[1])*vx);
    if(hi>lo&&dist<=10)L+=hi-lo;}
  return L;}
REG.w11_layout=function(el,U){
  var S=U.S;
  U.head(el,"LAYOUT","雑音の源を動かす — RF の線との距離・平行な長さと、結合の目安（例のモデル）");
  var SRC=[{n:"スイッチング電源",c:"alias",L:5},{n:"クロックの線",c:"purple",L:12},{n:"USB の線",c:"gold",L:30}];
  var GOOD=[[84,48,0],[78,12,0],[70,54,0]],BAD=[[18,12,0],[26,24.5,0],[26,22.5,0]];
  function place(P){SRC.forEach(function(s,i){s.x=P[i][0];s.y=P[i][1];s.a=P[i][2];});}
  place(GOOD);
  var r1=U.ctrls(el);
  var sel=U.select(r1,"動かすもの",SRC.map(function(s){return s.n;}),0,function(){sx.set(SRC[sel.get()].x);sy.set(SRC[sel.get()].y);draw();});
  var sx=U.slider(r1,"横の位置",{min:0,max:100,step:0.5,value:SRC[0].x,fmt:function(v){return _w11_f(v,1)+" mm";},onInput:function(v){SRC[sel.get()].x=v;draw();}});
  var sy=U.slider(r1,"縦の位置",{min:0,max:60,step:0.5,value:SRC[0].y,fmt:function(v){return _w11_f(v,1)+" mm";},onInput:function(v){SRC[sel.get()].y=v;draw();}});
  var br=U.btnrow(el);
  U.button(br,"向きを変える（縦・横）",function(){var s=SRC[sel.get()];s.a=s.a?0:Math.PI/2;draw();});
  U.button(br,"本文の例（区分けした配置）",function(){place(GOOD);sx.set(SRC[sel.get()].x);sy.set(SRC[sel.get()].y);draw();});
  U.button(br,"悪い例（RF の線のそば）",function(){place(BAD);sx.set(SRC[sel.get()].x);sy.set(SRC[sel.get()].y);draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"基板は 100 × 60 mm、RF の区画は左上の 50 × 32 mm（どれも例）。雑音の源をドラッグして動かせる。結合の目安は、平行に走る 1 mm を距離 0 で重ねたときを 0 dB とした例のモデル（距離 d で 1/{1 + (d/h)²}、h = 0.2 mm。平行な長さに比例し、直角の向きでは結合しない）。グラウンドの面を挟んだ別の層の線や、源ごとの雑音の強さは入れていない。");
  var geo={sc:5,ox:10,oy:30};
  function draw(){
    var nar=_w11_nar(box),Wd=nar?400:700,sc=nar?3.75:5.2,ox=nar?12:10,oy=30,o=[];geo={sc:sc,ox:ox,oy:oy};
    function X(v){return ox+v*sc;}function Y(v){return oy+v*sc;}
    o.push(S.T(ox,18,"上から見た基板（例: 100 × 60 mm）","start",10.5,"ink",true));
    o.push(S.RECT(X(0),Y(0),100*sc,60*sc,4,"var(--muted-soft)","muted",1.2));
    o.push(S.RECT(X(1),Y(1),49*sc,31*sc,4,U.soft("signal"),"signal",1.2,"5 3"));
    o.push(S.T(X(48),Y(30),"RF の区画","end",9.5,"signal",true,false,null,true));
    /* RF の部品と線 */
    o.push(S.PL(_W11_RF.map(function(p){return [X(p[0]),Y(p[1])];}),"signal",2.6));
    o.push(S.RECT(X(4.4),Y(3.8),3.2*sc,1.6*sc,1,U.soft("alias"),"alias",1.1));o.push(S.T(X(9),Y(5.6),"アンテナ","start",9,"alias",true,false,null,true));
    [[16,"LNA",2.2],[28,"SAW",1.6]].forEach(function(q){o.push(S.RECT(X(q[0])-q[2]*sc/2,Y(20)-q[2]*sc/2,q[2]*sc,q[2]*sc,1,"panel","ink",1.1));o.push(S.T(X(q[0]),Y(20)+q[2]*sc/2+11,q[1],"middle",9,"ink",true,false,null,true));});
    o.push(S.RECT(X(44),Y(12),16*sc,16*sc,3,"panel","ink",1.3));o.push(S.T(X(52),Y(20)+4,"モジュール","middle",9,"ink",true));
    /* 雑音の源 */
    var res=[];
    SRC.forEach(function(s,i){var r=_w11_couple(s,_W11_H),nr=_w11_near(r.a,r.b),par=_w11_par(r.a,r.b),db=20*Math.log10(Math.max(r.c,1e-9));
      var inRF=[r.a,r.b].some(function(p){return p[0]>=1&&p[0]<=50&&p[1]>=1&&p[1]<=32;});
      res.push({s:s,db:db,d:nr[0],par:par,inRF:inRF});
      o.push(S.L(X(nr[1][0]),Y(nr[1][1]),X(nr[2][0]),Y(nr[2][1]),s.c,1,"3 3"));
      o.push(S.L(X(r.a[0]),Y(r.a[1]),X(r.b[0]),Y(r.b[1]),s.c,4.2));
      if(i===sel.get())o.push(S.CIRC(X(s.x),Y(s.y),Math.max(9,s.L*sc/2+4),s.c,1.2,null,"2 3"));
      var lx=X(s.x),ly=Y(s.y)+(s.a?0:-9);if(s.a)lx+=8;
      o.push(S.T(lx,ly,s.n,s.a?"start":"middle",9,s.c,true,false,null,true));
      o.push(S.T((X(nr[1][0])+X(nr[2][0]))/2+4,(Y(nr[1][1])+Y(nr[2][1]))/2+4,_w11_f(nr[0],1)+" mm","start",8.5,s.c,false,false,null,true));});
    /* 結合の目安の棒（右、狭い画面では下） */
    var bx=nar?60:560,by=nar?Y(60)+44:56,bw2=nar?300:120,bh=nar?20:26;
    o.push(S.T(nar?ox:bx-10,by-18,"結合の目安 [dB]（例のモデル）","start",10,"ink",true));
    var P=U.plot(bx,by,bw2,res.length*(bh+12),[-100,0],[0,1]);
    [-100,-75,-50,-25,0].forEach(function(v){o.push(S.L(P.X(v),by-4,P.X(v),by+res.length*(bh+12),"grid",1));o.push(S.T(P.X(v),by+res.length*(bh+12)+12,String(v).replace("-","−"),"middle",9,"muted"));});
    res.forEach(function(q,k){var yy=by+k*(bh+12),v=Math.max(-100,Math.min(0,q.db));
      o.push(S.RECT(P.X(-100),yy,Math.max(P.X(v)-P.X(-100),1),bh,3,U.soft(q.s.c),q.s.c,1.1));
      o.push(S.T(P.X(-100)+4,yy+bh/2+4,_w11_f(q.db,0)+" dB","start",9.5,q.s.c,true,false,null,true));});
    var H=nar?by+res.length*(bh+12)+24:Math.max(Y(60)+12,by+res.length*(bh+12)+24);
    box.set(S.svg(Wd,H,o));
    var rows=res.map(function(q){return [q.s.n,_w11_f(q.d,1)+" mm",_w11_f(q.par,1)+" mm","<b>"+_w11_f(q.db,0)+" dB</b>",q.inRF?'<span class="warn">RF の区画の中</span>':(q.d<0.6?'<span class="warn">RF の線に近すぎる</span>':'<span class="ok">区画の外</span>')];});
    ro.innerHTML=U.tbl(["雑音の源","RF の線までの距離","平行な長さ","結合の目安","区画"],rows,["left","right","right","right","left"])+
      "結合の目安が 20 dB 下がると、RF の線に入る雑音の電圧は 1/10 になる（電力は 1/100）。";
  }
  /* ドラッグ（近い源をつかむ） */
  var dragI=-1;
  U.ctl.drag(box,function(type,px,py){var g=geo,mx=(px-g.ox)/g.sc,my=(py-g.oy)/g.sc;
    if(type==="down"){var best=-1,bd=6;SRC.forEach(function(s,i){var a=[s.x-s.L/2*Math.cos(s.a),s.y-s.L/2*Math.sin(s.a)],b=[s.x+s.L/2*Math.cos(s.a),s.y+s.L/2*Math.sin(s.a)],d=_w11_dseg([mx,my],a,b)[0];if(d<bd){bd=d;best=i;}});
      if(best<0)return false;dragI=best;sel.set(best);return true;}
    if(type==="move"&&dragI>=0){var s=SRC[dragI];s.x=Math.max(0,Math.min(100,Math.round(mx*2)/2));s.y=Math.max(0,Math.min(60,Math.round(my*2)/2));sx.set(s.x);sy.set(s.y);draw();}
    if(type==="up")dragI=-1;});
  draw();
};
