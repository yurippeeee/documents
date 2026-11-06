  /* ===== 21 章 総合演習 — 倒立振子を立てる ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w21_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w21_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w21_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);if(a>=Math.pow(10,d))return String(Math.round(v)).replace("-","−");
    var s=(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace("-","−");}
  function _w21_cs(z,d){d=d||3;if(Math.abs(z.im)<1e-6*(1+Math.abs(z.re)))return _w21_g(z.re,d);return _w21_g(z.re,d)+" ± j"+_w21_g(Math.abs(z.im),d);}
  function _w21_poles(rs,d){var out=[];rs.forEach(function(z){if(z.im<-1e-6*(1+Math.abs(z.re)))return;out.push(_w21_cs(z,d||3));});return out.join("、");}
  function _w21_minmax(a,i0){var lo=Infinity,hi=-Infinity;for(var i=i0||0;i<a.length;i++){var v=a[i];if(v<lo)lo=v;if(v>hi)hi=v;}return [lo,hi];}
  function _w21_maxabs(a,i0){var m=0;for(var i=i0||0;i<a.length;i++){var v=Math.abs(a[i]);if(v>m)m=v;}return m;}
  function _w21_range(arrs,pad,minspan){var lo=Infinity,hi=-Infinity;arrs.forEach(function(a){var r=_w21_minmax(a);lo=Math.min(lo,r[0]);hi=Math.max(hi,r[1]);});
    if(!isFinite(lo)){lo=-1;hi=1;}if(hi-lo<minspan){var c=(hi+lo)/2;lo=c-minspan/2;hi=c+minspan/2;}var p=(hi-lo)*pad;return [lo-p,hi+p];}
  /* |y| が tol を最後に超えた後、tol に戻った時刻（間は直線で補う）。最後まで超えていれば Infinity */
  function _w21_settle(t,y,tol){var last=-1;for(var i=0;i<y.length;i++)if(Math.abs(y[i])>tol)last=i;if(last<0)return 0;if(last+1>=y.length)return Infinity;
    var a=Math.abs(y[last]),b=Math.abs(y[last+1]);return t[last]+(t[last+1]-t[last])*(a-tol)/(a-b);}
  /* 力と、その前後 50 個ずつ（101 個）の移動平均との差の標準偏差（仕様 6。本文 5 節） */
  function _w21_hpstd(u,i0){var half=50,n=u.length-i0,c=new Float64Array(n+1),s=0,s2=0,k,cnt=0;for(k=0;k<n;k++)c[k+1]=c[k]+u[i0+k];
    for(k=half;k<n-half;k++){var d=u[i0+k]-(c[k+half+1]-c[k-half])/(2*half+1);s+=d;s2+=d*d;cnt++;}if(cnt<2)return 0;var mu=s/cnt;return Math.sqrt(Math.max(0,s2/cnt-mu*mu));}

  /* ---- 例の値（本文と同じ。17〜20 章の倒立振子） ---- */
  var _W21={M:0.5,m:0.2,l:0.3,g:9.81,D:Math.PI/180,TS:0.001,SP:0.001,SPH:0.1*Math.PI/180,UMAX:5,FC:0.3,VC:0.01,
    KP:30.19,KD:3.741,KI:30.19,KPO:0.15,KDO:0.16},_W21_CACHE={kf:{}};
  function _w21_AB(M,m,l){var g=_W21.g;return {A:[[0,1,0,0],[0,0,-m*g/M,0],[0,0,0,1],[0,0,(M+m)*g/(M*l),0]],B:[[0],[1/M],[0],[-1/(M*l)]]};}
  /* 19 章の F（最適レギュレータ）と 18 章の F（極配置 −4 × 4）。u = −F x */
  function _w21_base(U){if(_W21_CACHE.F)return _W21_CACHE;var M=U.ctl.mat,s=_w21_AB(_W21.M,_W21.m,_W21.l);
    _W21_CACHE.A=s.A;_W21_CACHE.B=s.B;
    _W21_CACHE.F=M.lqr(s.A,s.B,[[4,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],[[0.04]]).F[0].slice();
    _W21_CACHE.FPP=M.acker(s.A,s.B,[U.ctl.c(-4,0),U.ctl.c(-4,0),U.ctl.c(-4,0),U.ctl.c(-4,0)])[0].slice();
    return _W21_CACHE;}
  /* 20 章の方法のカルマンフィルタ（ゲインが一定になった後）。sa・sal: 台車の加速度と振子の角加速度の乱れの標準偏差（T_s ごとに新しい値） */
  function _w21_kf(U,Ts,sa,sal){var key=Ts+"|"+sa+"|"+sal;if(_W21_CACHE.kf[key])return _W21_CACHE.kf[key];var M=U.ctl.mat,b=_w21_base(U),C=[[1,0,0,0],[0,0,1,0]];
    var d=M.c2d(b.A,b.B,Ts),gd=M.c2d(b.A,[[0,0],[1,0],[0,0],[0,1]],Ts),W=M.mul(M.mul(gd.B,[[sa*sa,0],[0,sal*sal]]),M.T(gd.B)),V=[[_W21.SP*_W21.SP,0],[0,_W21.SPH*_W21.SPH]];
    var P=M.dare(M.T(d.A),M.T(C),W,V),H=M.mul(M.mul(P,M.T(C)),M.inv(M.add(M.mul(M.mul(C,P),M.T(C)),V)));
    var r={H:H,Ad:d.A,Bd:d.B.map(function(q){return q[0];}),Ts:Ts};_W21_CACHE.kf[key]=r;return r;}
  /* 20 章の 1 ms の乱れ（0.3 m/s²・3 rad/s²）を 1 s あたりで同じにして T_s に直し、その分散を mul 倍に見込む（4 節の図・5 節の W の倍率） */
  function _w21_kfmul(U,Ts,mul){var k=Math.sqrt(mul*0.001/Ts);return _w21_kf(U,Ts,0.3*k,3*k);}

  /* ---- 対象（線形でない式 + クーロン摩擦）と、T_s ごとに測って推定し、次の周期の頭で力を出す制御器（図の _f21_run と同じ計算） ----
     o = {T, Ts, x0, F（u = −F x̂）, est:"kf"|"true", kf:{H,Ad,Bd}, M, m, l, Fc, ffc（摩擦の補償）, umax（null で上限なし）, noise, seed,
          Ls（測る値の遅れ [s]）, push:[開始, 長さ, 力], every, stop（倒れたとみなす角度 [°]）, safe（推定した角度 30°・位置 0.45 m で力を 0 にする）, sgn:[位置, 角度, 力] } */
  function _w21_run(U,o){var P=_W21,Ts=o.Ts||P.TS,h=Ts,nd=Math.round((o.Ls||0)/h),n=Math.round(o.T/Ts),g=P.g;
    var M=o.M||P.M,m=o.m||P.m,l=o.l||P.l,Fc=o.Fc||0,ffc=o.ffc||0,umax=o.umax===undefined?P.UMAX:o.umax,every=o.every||1,stop=(o.stop||60)*P.D;
    var F=o.F,est=o.est||"kf",kf=o.kf,sg=o.sgn||[1,1,1],push=o.push||null,rg=U.rng(o.seed||1),noise=!!o.noise;
    var x=o.x0.slice(),stuck=false,k1=[0,0,0,0],k2=[0,0,0,0],k3=[0,0,0,0],k4=[0,0,0,0],tt=[0,0,0,0];
    function acc(z,Fx,fd,out){var s=Math.sin(z[2]),c=Math.cos(z[2]),pdd=(Fx+fd-m*g*s*c-fd*c*c+m*l*z[3]*z[3]*s)/(M+m*s*s);out[0]=z[1];out[1]=pdd;out[2]=z[3];out[3]=(g*s-pdd*c+fd/m*c)/l;}
    function accS(z,fd,out){out[0]=0;out[1]=0;out[2]=z[3];out[3]=(g*Math.sin(z[2])+fd/m*Math.cos(z[2]))/l;}
    function f(z,mode,Fx,fd,out){if(mode)accS(z,fd,out);else acc(z,Fx,fd,out);}
    function rk(z,hh,mode,Fx,fd){var i;f(z,mode,Fx,fd,k1);for(i=0;i<4;i++)tt[i]=z[i]+hh/2*k1[i];f(tt,mode,Fx,fd,k2);for(i=0;i<4;i++)tt[i]=z[i]+hh/2*k2[i];f(tt,mode,Fx,fd,k3);
      for(i=0;i<4;i++)tt[i]=z[i]+hh*k3[i];f(tt,mode,Fx,fd,k4);var r=[0,0,0,0];for(i=0;i<4;i++)r[i]=z[i]+hh/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);return r;}
    function freq(z,u,fd){var s=Math.sin(z[2]),c=Math.cos(z[2]);return m*g*s*c+fd*c*c-m*l*z[3]*z[3]*s-u-fd;}
    function step(u,fd){if(Fc<=0){x=rk(x,h,0,u,fd);return;}var sgv,fr;
      if(stuck||x[1]===0){fr=freq(x,u,fd);if(Math.abs(fr)<=Fc){stuck=true;var xs=rk(x,h,1,0,fd);xs[1]=0;x=xs;return;}stuck=false;sgv=-fr>0?1:-1;}
      else sgv=x[1]>0?1:-1;
      var xn=rk(x,h,0,u-Fc*sgv,fd);
      if(((xn[1]>0)!==(sgv>0))&&xn[1]!==0){var lo=0,hi=h;for(var it=0;it<40;it++){var mid=(lo+hi)/2,xm2=rk(x,mid,0,u-Fc*sgv,fd);if((xm2[1]>0)===(sgv>0))lo=mid;else hi=mid;}
        var xc=rk(x,lo,0,u-Fc*sgv,fd);xc[1]=0;var rem=h-lo;fr=freq(xc,u,fd);
        if(Math.abs(fr)<=Fc){stuck=true;xn=rk(xc,rem,1,0,fd);xn[1]=0;}else{var s2=-fr>0?1:-1;xn=rk(xc,rem,0,u-Fc*s2,fd);}}
      x=xn;}
    var hist=[],i;for(i=0;i<=nd;i++)hist.push(x.slice());
    var H=kf?kf.H:null,Ad=kf?kf.Ad:null,Bd=kf?kf.Bd:null,xm=null,u_next=0,fault=null,xh=[0,0,0,0];
    var R={t:[],x:[[],[],[],[]],xh:[[],[],[],[]],u:[],st:[],fell:null,fault:null,Ts:Ts};
    for(var k=0;k<=n;k++){var t=k*Ts,xs0=hist[0],e1=0,e2=0;if(noise){e1=rg.normal();e2=rg.normal();}
      var y0=sg[0]*xs0[0]+P.SP*e1,y1=sg[1]*xs0[2]+P.SPH*e2,u_k=u_next;
      if(est==="true")xh=xs0.slice();
      else{if(!xm)xm=[y0,0,y1,0];var q0=y0-xm[0],q1=y1-xm[2];for(i=0;i<4;i++)xh[i]=xm[i]+H[i][0]*q0+H[i][1]*q1;}
      if(o.safe&&fault===null&&(Math.abs(xh[2])>0.52||Math.abs(xh[0])>0.45))fault=t;
      var uc=0;if(fault===null){uc=-(F[0]*xh[0]+F[1]*xh[1]+F[2]*xh[2]+F[3]*xh[3]);if(ffc)uc+=ffc*Math.max(-1,Math.min(1,xh[1]/P.VC));if(umax!=null)uc=Math.max(-umax,Math.min(umax,uc));}
      u_next=uc;
      if(est==="kf"){var xn2=[0,0,0,0];for(i=0;i<4;i++){var sm=Bd[i]*u_k;for(var j=0;j<4;j++)sm+=Ad[i][j]*xh[j];xn2[i]=sm;}xm=xn2;}
      if(k%every===0){R.t.push(t);for(i=0;i<4;i++){R.x[i].push(x[i]);R.xh[i].push(xh[i]);}R.u.push(u_k);R.st.push(stuck?1:0);}
      if(k===n)break;
      var fd=(push&&t>=push[0]-1e-9&&t<push[0]+push[1]-1e-9)?push[2]:0;
      step(sg[2]*u_k,fd);
      if(nd){hist.push(x.slice());hist.shift();}else hist[0]=x.slice();
      if(Math.abs(x[2])>stop||!isFinite(x[2])){R.fell=t+Ts;R.t.push(t+Ts);for(i=0;i<4;i++){R.x[i].push(x[i]);R.xh[i].push(xh[i]);}R.u.push(u_k);R.st.push(stuck?1:0);break;}}
    R.fault=fault;return R;}

  /* ---- 実の行列の固有値（平衡化 → ヘッセンベルグ形 → シフト付き QR 法）。1 ms の閉ループの極は z = 1 のすぐ近くに集まるので、特性多項式を経ずに求める ---- */
  function _w21_eig(A0){var n=A0.length,a=[],i,j,k,m,l,its,nn,mmin;for(i=0;i<=n;i++){a.push(new Float64Array(n+1));}
    for(i=0;i<n;i++)for(j=0;j<n;j++)a[i+1][j+1]=A0[i][j];
    var last=0,c,f,g,r,s,RADIX=2,sq=4;
    while(last===0){last=1;for(i=1;i<=n;i++){r=0;c=0;for(j=1;j<=n;j++)if(j!==i){c+=Math.abs(a[j][i]);r+=Math.abs(a[i][j]);}
      if(c!==0&&r!==0){g=r/RADIX;f=1;s=c+r;while(c<g){f*=RADIX;c*=sq;}g=r*RADIX;while(c>g){f/=RADIX;c/=sq;}
        if((c+r)/f<0.95*s){last=0;g=1/f;for(j=1;j<=n;j++)a[i][j]*=g;for(j=1;j<=n;j++)a[j][i]*=f;}}}}
    for(m=2;m<n;m++){var xx=0;i=m;for(j=m;j<=n;j++){if(Math.abs(a[j][m-1])>Math.abs(xx)){xx=a[j][m-1];i=j;}}
      if(i!==m){for(j=m-1;j<=n;j++){var tq=a[i][j];a[i][j]=a[m][j];a[m][j]=tq;}for(j=1;j<=n;j++){var tq2=a[j][i];a[j][i]=a[j][m];a[j][m]=tq2;}}
      if(xx!==0){for(i=m+1;i<=n;i++){var yy=a[i][m-1];if(yy!==0){yy/=xx;a[i][m-1]=yy;for(j=m;j<=n;j++)a[i][j]-=yy*a[m][j];for(j=1;j<=n;j++)a[j][m]+=yy*a[j][i];}}}}
    var wr=new Float64Array(n+1),wi=new Float64Array(n+1),anorm=0,z,y,x,w,v,u,t,p,q;
    for(i=1;i<=n;i++)for(j=Math.max(i-1,1);j<=n;j++)anorm+=Math.abs(a[i][j]);
    nn=n;t=0;
    while(nn>=1){its=0;
      do{for(l=nn;l>=2;l--){s=Math.abs(a[l-1][l-1])+Math.abs(a[l][l]);if(s===0)s=anorm;if(Math.abs(a[l][l-1])+s===s){a[l][l-1]=0;break;}}
        x=a[nn][nn];
        if(l===nn){wr[nn]=x+t;wi[nn]=0;nn--;}
        else{y=a[nn-1][nn-1];w=a[nn][nn-1]*a[nn-1][nn];
          if(l===nn-1){p=0.5*(y-x);q=p*p+w;z=Math.sqrt(Math.abs(q));x+=t;
            if(q>=0){z=p+(p>=0?Math.abs(z):-Math.abs(z));wr[nn-1]=wr[nn]=x+z;if(z)wr[nn]=x-w/z;wi[nn-1]=wi[nn]=0;}
            else{wr[nn-1]=wr[nn]=x+p;wi[nn]=z;wi[nn-1]=-z;}
            nn-=2;}
          else{if(its===60)break;
            if(its===10||its===20){t+=x;for(i=1;i<=nn;i++)a[i][i]-=x;s=Math.abs(a[nn][nn-1])+Math.abs(a[nn-1][nn-2]);y=x=0.75*s;w=-0.4375*s*s;}
            ++its;
            for(m=nn-2;m>=l;m--){z=a[m][m];r=x-z;s=y-z;p=(r*s-w)/a[m+1][m]+a[m][m+1];q=a[m+1][m+1]-z-r-s;r=a[m+2][m+1];s=Math.abs(p)+Math.abs(q)+Math.abs(r);p/=s;q/=s;r/=s;
              if(m===l)break;u=Math.abs(a[m][m-1])*(Math.abs(q)+Math.abs(r));v=Math.abs(p)*(Math.abs(a[m-1][m-1])+Math.abs(z)+Math.abs(a[m+1][m+1]));if(u+v===v)break;}
            for(i=m+2;i<=nn;i++){a[i][i-2]=0;if(i!==m+2)a[i][i-3]=0;}
            for(k=m;k<=nn-1;k++){if(k!==m){p=a[k][k-1];q=a[k+1][k-1];r=0;if(k!==nn-1)r=a[k+2][k-1];if((x=Math.abs(p)+Math.abs(q)+Math.abs(r))!==0){p/=x;q/=x;r/=x;}}
              s=Math.sqrt(p*p+q*q+r*r);if(p<0)s=-s;
              if(s!==0){if(k===m){if(l!==m)a[k][k-1]=-a[k][k-1];}else a[k][k-1]=-s*x;
                p+=s;x=p/s;y=q/s;z=r/s;q/=p;r/=p;
                for(j=k;j<=nn;j++){p=a[k][j]+q*a[k+1][j];if(k!==nn-1){p+=r*a[k+2][j];a[k+2][j]-=p*z;}a[k+1][j]-=p*y;a[k][j]-=p*x;}
                mmin=nn<k+3?nn:k+3;
                for(i=l;i<=mmin;i++){p=x*a[i][k]+y*a[i][k+1];if(k!==nn-1){p+=z*a[i][k+2];a[i][k+2]-=p*r;}a[i][k+1]-=p*q;a[i][k]-=p;}}}}}
      }while(l<nn-1);
      if(its===60)break;}
    var out=[];for(i=1;i<=n;i++)out.push({re:wr[i],im:wi[i]});return out;}

  /* ---- 入力の点で切った一巡伝達関数（カルマンフィルタと (B) の出し方。図の _f21_loop_tf と同じ） ---- */
  /* (zI − A) X = B を複素数のまま解く（A は実、B は実、z = zr + j zi） */
  function _w21_csolve(A,zr,zi,B){var n=A.length,k=B[0].length,ar=[],ai=[],br=[],bi=[],i,j,c;
    for(i=0;i<n;i++){ar.push([]);ai.push([]);br.push(B[i].slice());bi.push(new Array(k).fill(0));for(j=0;j<n;j++){ar[i].push((i===j?zr:0)-A[i][j]);ai[i].push(i===j?zi:0);}}
    for(c=0;c<n;c++){var p=c,mx=-1;for(i=c;i<n;i++){var mg=Math.hypot(ar[i][c],ai[i][c]);if(mg>mx){mx=mg;p=i;}}
      if(p!==c){var t1=ar[c];ar[c]=ar[p];ar[p]=t1;t1=ai[c];ai[c]=ai[p];ai[p]=t1;t1=br[c];br[c]=br[p];br[p]=t1;t1=bi[c];bi[c]=bi[p];bi[p]=t1;}
      var dr=ar[c][c],di=ai[c][c],dd=dr*dr+di*di;
      for(i=c+1;i<n;i++){var nr=ar[i][c],ni=ai[i][c];if(nr===0&&ni===0)continue;var fr=(nr*dr+ni*di)/dd,fi=(ni*dr-nr*di)/dd;
        for(j=c;j<n;j++){var xr=ar[c][j],xi=ai[c][j];ar[i][j]-=fr*xr-fi*xi;ai[i][j]-=fr*xi+fi*xr;}
        for(j=0;j<k;j++){var yr=br[c][j],yi=bi[c][j];br[i][j]-=fr*yr-fi*yi;bi[i][j]-=fr*yi+fi*yr;}}}
    var Xr=[],Xi=[];for(i=0;i<n;i++){Xr.push(new Array(k).fill(0));Xi.push(new Array(k).fill(0));}
    for(j=0;j<k;j++)for(i=n-1;i>=0;i--){var sr=br[i][j],si=bi[i][j];for(c=i+1;c<n;c++){sr-=ar[i][c]*Xr[c][j]-ai[i][c]*Xi[c][j];si-=ar[i][c]*Xi[c][j]+ai[i][c]*Xr[c][j];}
      var er=ar[i][i],ei=ai[i][i],ed=er*er+ei*ei;Xr[i][j]=(sr*er+si*ei)/ed;Xi[i][j]=(si*er-sr*ei)/ed;}
    return {re:Xr,im:Xi};}
  /* 推定のゲイン H・A_d・B_d と F から、制御器の状態方程式（状態は測る前の推定 4 つと、次の周期に出す力 1 つ）を作る */
  function _w21_ctrlss(F,kf){var H=kf.H,Ad=kf.Ad,Bd=kf.Bd,i,j,k,IHC=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
    for(i=0;i<4;i++){IHC[i][0]-=H[i][0];IHC[i][2]-=H[i][1];}
    var Ac=[],Bc=[];for(i=0;i<5;i++){Ac.push([0,0,0,0,0]);Bc.push([0,0]);}
    for(i=0;i<4;i++){for(j=0;j<4;j++){var s=0;for(k=0;k<4;k++)s+=Ad[i][k]*IHC[k][j];Ac[i][j]=s;}Ac[i][4]=Bd[i];
      for(j=0;j<2;j++){var s2=0;for(k=0;k<4;k++)s2+=Ad[i][k]*H[k][j];Bc[i][j]=s2;}}
    for(j=0;j<4;j++){var s3=0;for(k=0;k<4;k++)s3+=F[k]*IHC[k][j];Ac[4][j]=-s3;}
    for(j=0;j<2;j++){var s4=0;for(k=0;k<4;k++)s4+=F[k]*H[k][j];Bc[4][j]=-s4;}
    return {Ac:Ac,Bc:Bc};}
  function _w21_loop(F,kf){var c=_w21_ctrlss(F,kf),Ts=kf.Ts,Bd=kf.Bd.map(function(v){return [v];});
    return function(w){var zr=Math.cos(w*Ts),zi=Math.sin(w*Ts),G=_w21_csolve(kf.Ad,zr,zi,Bd),K=_w21_csolve(c.Ac,zr,zi,c.Bc);
      var p0r=G.re[0][0],p0i=G.im[0][0],p1r=G.re[2][0],p1i=G.im[2][0],k0r=K.re[4][0],k0i=K.im[4][0],k1r=K.re[4][1],k1i=K.im[4][1];
      return {re:-(k0r*p0r-k0i*p0i+k1r*p1r-k1i*p1i),im:-(k0r*p0i+k0i*p0r+k1r*p1i+k1i*p1r)};};}
  /* 位相余裕・ゲイン交差角周波数・許されるむだ時間・安定な力の倍率の範囲・−1 からの最短距離（図の _f21_margins と同じ読み方） */
  function _w21_margins(L,Ts){var N=3000,lw0=Math.log10(0.1),lw1=Math.log10(Math.PI/Ts*0.999),ws=[],vs=[],i,pm=null,wgc=null,lo=0,hi=Infinity,dmin=Infinity;
    for(i=0;i<N;i++){var w=Math.pow(10,lw0+(lw1-lw0)*i/(N-1));ws.push(w);var v=L(w);vs.push(v);dmin=Math.min(dmin,Math.hypot(1+v.re,v.im));}
    for(i=1;i<N&&pm===null;i++){var m0=Math.hypot(vs[i-1].re,vs[i-1].im)-1,m1=Math.hypot(vs[i].re,vs[i].im)-1;
      if(m0*m1<0){var a=Math.log(ws[i-1]),b=Math.log(ws[i]),fa=m0;for(var it=0;it<50;it++){var mm=(a+b)/2,vm=L(Math.exp(mm)),fm=Math.hypot(vm.re,vm.im)-1;if((fa<0)===(fm<0)){a=mm;fa=fm;}else b=mm;}
        wgc=Math.exp((a+b)/2);var vg=L(wgc),ph=Math.atan2(vg.im,vg.re)*180/Math.PI;pm=((ph+180)%360+360)%360;if(pm>180)pm-=360;}}
    for(i=1;i<N;i++){if(vs[i-1].im*vs[i].im<0){var x=vs[i-1].re+(vs[i].re-vs[i-1].re)*(-vs[i-1].im)/(vs[i].im-vs[i-1].im);if(x<-1)lo=Math.max(lo,-1/x);else if(x>-1&&x<0)hi=Math.min(hi,-1/x);}}
    return {pm:pm,wgc:wgc,delay:pm!=null?pm*Math.PI/180/wgc:null,lo:lo,hi:hi,dmin:dmin};}
  /* 本当の対象の長さ・質量が lr・Mr 倍のときの、1 ms ごとの閉ループ（対象 4 + 推定 4 + 次の力 1）の固有値 z と、最も小さい減衰比 */
  function _w21_cleig(U,lr,Mr,F,kf){var M=U.ctl.mat,s=_w21_AB(_W21.M*Mr,_W21.m,_W21.l*lr),d=M.c2d(s.A,s.B,kf.Ts),c=_w21_ctrlss(F,kf),Phi=[],i,j;
    for(i=0;i<9;i++)Phi.push([0,0,0,0,0,0,0,0,0]);
    for(i=0;i<4;i++){for(j=0;j<4;j++)Phi[i][j]=d.A[i][j];Phi[i][8]=d.B[i][0];}
    for(i=0;i<5;i++){Phi[4+i][0]=c.Bc[i][0];Phi[4+i][2]=c.Bc[i][1];for(j=0;j<5;j++)Phi[4+i][4+j]=c.Ac[i][j];}
    var ev=_w21_eig(Phi),rho=0,zmin=Infinity;ev.forEach(function(z){var r=Math.hypot(z.re,z.im);rho=Math.max(rho,r);
      var sr=Math.log(r)/kf.Ts,si=Math.atan2(z.im,z.re)/kf.Ts,sa=Math.hypot(sr,si);if(sa>1e-9)zmin=Math.min(zmin,-sr/sa);});
    return {ev:ev,rho:rho,zmin:zmin,cls:rho>=1?0:(zmin<0.1?1:2)};}

  /* ---- 描画の補助 ---- */
  /* 小さな時間の波形の枠。series = [[t[], y[], 色, 破線, 太さ]]。返り値 {svg, P} */
  function _w21_wave(S,U,x,y,w,h,t0,T,lo,hi,title,series,tc,xl){if(hi-lo<1e-9){hi=lo+1;}var P=U.plot(x,y,w,h,[t0,T],[lo,hi]),o=[];
    o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.6));
    var yt=U.nice(lo,hi,3).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;}).map(function(v){return Math.abs(v)<1e-9*(hi-lo)?0:v;});
    o.push(P.axes({xl:xl?"時間 t [s]":null,yt:yt,xt:U.nice(t0,T,4).filter(function(v){return v<=T+1e-9&&v>=t0-1e-9;}),xfmt:function(v){return String(+v.toFixed(3));},yfmt:function(v){return _w21_g(v,2);},sz:8.5}));
    if(lo<0&&hi>0)o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"faint",1));
    o.push(S.TX(P.x,P.y-5,title,"start",9.5,"ink",true));
    series.forEach(function(s){var pts=[];for(var i=0;i<s[0].length;i++)pts.push([s[0][i],s[1][i]]);o.push(P.clip(pts,s[2],s[4]||1.8,s[3]));});
    if(tc!=null)o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"alias",1,"3 3"));
    return {svg:o.join(""),P:P};}
  /* 床と台車と振子。cx は台車の中心の x、gy は床の y、ph は角度 [rad]。dash なら推定した状態（破線） */
  function _w21_pend(S,U,cx,gy,ph,c,Lr,dash){var cw=52,chh=20,yy=gy-chh-10,o=[];
    if(!dash){o.push(S.RECT(cx-cw/2,yy,cw,chh,4,U.soft(c),c,1.5));o.push(S.CIRC(cx-cw*0.25,yy+chh+5,5,c,1.4,"var(--screen)"));o.push(S.CIRC(cx+cw*0.25,yy+chh+5,5,c,1.4,"var(--screen)"));}
    var a=Math.max(-Math.PI/2,Math.min(Math.PI/2,ph)),bx=cx+Lr*Math.sin(a),by=yy-Lr*Math.cos(a);
    o.push(S.L(cx,yy,bx,by,c,dash?1.6:2.4,dash?"5 4":null));o.push(S.CIRC(bx,by,dash?6:7,c,1.6,dash?"none":U.soft(c),dash?"3 2":null));if(!dash)o.push(S.D(cx,yy,c,2.6));return o.join("");}
  function _w21_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  /* 動く絵（レール ±0.5 m を幅 aw に描く）。r は走らせた結果、k はその番号 */
  function _w21_scene(S,U,ax,aw,gy,r,k,o2){o2=o2||{};var o=[],sc=(aw-60)/1.0,cx0=ax+aw/2,Lr=o2.Lr||90;
    o.push(_w21_ground(S,ax,ax+aw,gy));
    [-0.5,0.5].forEach(function(v){var xx=cx0+v*sc;o.push(S.RECT(xx+(v<0?-8:0),gy-36,8,36,1,"var(--alias-soft)","alias",1));});
    o.push(S.L(cx0,gy+2,cx0,gy+10,"faint",1));o.push(S.T(cx0,gy+22,"p = 0","middle",9,"muted"));
    o.push(S.T(cx0-0.5*sc,gy+22,"−0.5 m","middle",9,"alias"));o.push(S.T(cx0+0.5*sc,gy+22,"0.5 m","middle",9,"alias"));
    function cxp(p){return cx0+Math.max(-0.62,Math.min(0.62,p))*sc;}
    var px=cxp(r.x[0][k]);
    if(o2.est)o.push(_w21_pend(S,U,cxp(r.xh[0][k]),gy,r.xh[2][k],"green",Lr,true));
    o.push(_w21_pend(S,U,px,gy,r.x[2][k],"signal",Lr,false));
    var uu=r.u[k];if(Math.abs(uu)>0.02){var dir=uu>0?1:-1,xa=px-dir*64,len=Math.min(34,8+6*Math.abs(uu));o.push(S.ARR(xa,gy-20,xa+dir*len,gy-20,"gold",2.4));o.push(S.T(xa+dir*len/2,gy-26,"u","middle",11,"gold",true));}
    if(o2.push&&r.t[k]>=o2.push[0]-1e-9&&r.t[k]<o2.push[0]+o2.push[1]-1e-9){var ph=Math.max(-Math.PI/2,Math.min(Math.PI/2,r.x[2][k])),bx=px+Lr*Math.sin(ph),by=gy-30-Lr*Math.cos(ph);o.push(S.ARR(bx-40,by,bx-10,by,"purple",2.2));o.push(S.T(bx-42,by-6,"押す","end",9.5,"purple",true));}
    if(r.st&&r.st[k])o.push(S.T(px,gy-38,"止まっている","middle",9,"gold",true,false,null,true));
    return o.join("");}
