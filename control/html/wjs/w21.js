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
  function _w21_run(U,o){var P=_W21,Ts=o.Ts||P.TS,h=Math.min(Ts,0.001),nsub=Math.round(Ts/h),nd=Math.round((o.Ls||0)/h),n=Math.round(o.T/Ts),g=P.g;
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
      for(var js=0;js<nsub;js++){var tj=t+js*h,fd=(push&&tj>=push[0]-1e-9&&tj<push[0]+push[1]-1e-9)?push[2]:0;
        step(sg[2]*u_k,fd);
        if(nd){hist.push(x.slice());hist.shift();}else hist[0]=x.slice();}
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

  /* ---- 3 節: 角度だけの PD・PID、カスケード、19 章の F（連続の制御器、すべての状態を誤差なく測る、力の上限・摩擦なし） ----
     図の _f21_cont と同じ計算: 刻み 2 ms の 4 次のルンゲ・クッタ法、押す力は刻みの境目で切り替える。状態は [p, ṗ, φ, φ̇, w]（w は測った角度の積分）。
     g = {kind: 0 角度の PD・1 角度の PID・2 カスケード・3 19 章の F, KP, KD, KI, KPO, KDO, F} */
  function _w21_cont(g,o){var P=_W21,M=P.M,m=P.m,l=P.l,gg=P.g,h=0.002,n=Math.round(o.T/h),ev=5,off=o.off||0,push=o.push||null,fd=0;
    function uf(z){if(g.kind===0)return g.KP*(z[2]+off)+g.KD*z[3];if(g.kind===1)return g.KP*(z[2]+off)+g.KD*z[3]+g.KI*z[4];
      if(g.kind===2)return g.KP*(z[2]+off+g.KPO*z[0]+g.KDO*z[1])+g.KD*z[3];return -(g.F[0]*z[0]+g.F[1]*z[1]+g.F[2]*(z[2]+off)+g.F[3]*z[3]);}
    function f(z){var u=uf(z),s=Math.sin(z[2]),c=Math.cos(z[2]),pdd=(u+fd-m*gg*s*c-fd*c*c+m*l*z[3]*z[3]*s)/(M+m*s*s);return [z[1],pdd,z[3],(gg*s-pdd*c+fd/m*c)/l,z[2]+off];}
    var z=o.x0.concat([0]),R={t:[0],x:[[z[0]],[z[1]],[z[2]],[z[3]]],xh:[[z[0]],[z[1]],[z[2]],[z[3]]],u:[uf(z)],fell:null},i;
    for(var k=0;k<n;k++){var tk=k*h;fd=(push&&tk>=push[0]-1e-9&&tk<push[0]+push[1]-1e-9)?push[2]:0;
      var k1=f(z),z2=[],z3=[],z4=[];for(i=0;i<5;i++)z2.push(z[i]+h/2*k1[i]);var k2=f(z2);for(i=0;i<5;i++)z3.push(z[i]+h/2*k2[i]);var k3=f(z3);for(i=0;i<5;i++)z4.push(z[i]+h*k3[i]);var k4=f(z4);
      for(i=0;i<5;i++)z[i]+=h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);
      if((k+1)%ev===0){R.t.push((k+1)*h);for(i=0;i<4;i++){R.x[i].push(z[i]);R.xh[i].push(z[i]);}R.u.push(uf(z));}
      if(Math.abs(z[2])>Math.PI/2||!isFinite(z[2])){R.fell=(k+1)*h;if((k+1)%ev!==0){R.t.push((k+1)*h);for(i=0;i<4;i++){R.x[i].push(z[i]);R.xh[i].push(z[i]);}R.u.push(uf(z));}break;}}
    return R;}
  /* 閉ループの極（線形化した式）。u = a p + b ṗ + c φ + d φ̇（+ K_I w） */
  function _w21_contpoles(U,g){var b=_w21_base(U),A=b.A,B=b.B,row;
    if(g.kind===3)row=[-g.F[0],-g.F[1],-g.F[2],-g.F[3]];else if(g.kind===2)row=[g.KP*g.KPO,g.KP*g.KDO,g.KP,g.KD];else row=[0,0,g.KP,g.KD];
    var n=g.kind===1?5:4,Ac=[],i,j;for(i=0;i<n;i++){Ac.push([]);for(j=0;j<n;j++)Ac[i].push(i<4&&j<4?A[i][j]+B[i][0]*row[j]:0);}
    if(g.kind===1){for(i=0;i<4;i++)Ac[i][4]=B[i][0]*g.KI;Ac[4][2]=1;}
    return {poles:_w21_eig(Ac),row:row};}

  REG.w21_pid=function(el,U){
    var S=U.S,D=_W21.D;
    U.head(el,"PID OR STATE FEEDBACK","振子の角度だけを戻す PID と、台車も戻すカスケード・状態フィードバック");
    var r1=U.ctrls(el);
    var sk=U.select(r1,"制御器",["角度の PD","角度の PID","カスケード（位置 → 目標の角度 → 力）","19 章の F（最適レギュレータ）"],0,function(){fix();run();});
    var sts=U.select(r1,"試験",["10° から放す","真上で放す（0 点のずれだけ）","おもりを右へ 1 N で 0.1 s 押す"],0,function(){run();});
    var soff=U.slider(r1,"角度のセンサの 0 点のずれ",{values:[-1,-0.5,0,0.5,1],value:0,fmt:function(v){return _w21_f(v,1)+"°";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var skp=U.slider(r2,U.htx("K_P")+"（角度）",{min:5,max:60,step:0.01,value:30.19,fmt:function(v){return _w21_f(v,2)+" N/rad";},onInput:function(){run();}});
    var skd=U.slider(r2,U.htx("K_D")+"（角速度）",{min:0.5,max:10,step:0.001,value:3.741,fmt:function(v){return _w21_f(v,3)+" N/(rad/s)";},onInput:function(){run();}});
    var ski=U.slider(r2,U.htx("K_I")+"（角度の積分）",{min:0,max:100,step:0.01,value:30.19,fmt:function(v){return _w21_f(v,2)+" N/(rad·s)";},onInput:function(){run();}});
    var skpo=U.slider(r2,U.htx("K_{Po}")+"（外側の位置）",{min:0,max:0.6,step:0.001,value:0.15,fmt:function(v){return _w21_f(v,3)+" rad/m";},onInput:function(){run();}});
    var skdo=U.slider(r2,U.htx("K_{Do}")+"（外側の速度）",{min:0,max:0.6,step:0.001,value:0.16,fmt:function(v){return _w21_f(v,3)+" rad/(m/s)";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 t",{min:0,max:6,step:0.01,value:0.5,fmt:function(v){return _w21_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.03;if(t>=6){t=6;tk.stop();}st.set(t);draw();},30);
    U.button(br,"▶ 再生",function(){if(st.get()>=5.99)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(kind,kp,kd,ki,kpo,kdo,ts,off){tk.stop();sk.set(kind);skp.set(kp);skd.set(kd);ski.set(ki);skpo.set(kpo);skdo.set(kdo);sts.set(ts);soff.set(off);st.set(0.5);fix();run();}
    U.button(br,"本文の例（角度の PD・10°）",function(){pre(0,30.19,3.741,30.19,0.15,0.16,0,0);});
    U.button(br,"角度の PID",function(){pre(1,30.19,3.741,30.19,0.15,0.16,0,0);});
    U.button(br,"PID・0 点が 0.5° ずれる",function(){pre(1,30.19,3.741,30.19,0.15,0.16,1,0.5);});
    U.button(br,"カスケード（内側から決めた）",function(){pre(2,30.19,3.741,30.19,0.15,0.16,0,0);});
    U.button(br,"19 章の F をカスケードに直した値",function(){pre(2,30.19,4.925,30.19,0.331,0.228,0,0);});
    var box=U.svgbox(el),ro=U.readout(el),R=null,G=null,PL=null;
    function fix(){var k=sk.get();[skp,skd].forEach(function(s){s.el.style.display=k===3?"none":"";});ski.el.style.display=k===1?"":"none";
      skpo.el.style.display=k===2?"":"none";skdo.el.style.display=k===2?"":"none";}
    function run(){var ts=sts.get(),b=_w21_base(U);
      G={kind:sk.get(),KP:skp.get(),KD:skd.get(),KI:ski.get(),KPO:skpo.get(),KDO:skdo.get(),F:b.F};
      R=_w21_cont(G,{T:6,x0:ts===0?[0,0,10*D,0]:[0,0,0,0],off:soff.get()*D,push:ts===2?[0.5,0.1,1.0]:null});PL=_w21_contpoles(U,G);draw();}
    function col(a,s){var o=[];for(var i=0;i<a.length;i++)o.push(a[i]*s);return o;}
    function draw(){if(!R)return;var nar=_w21_nar(box),Wd=nar?400:700,o=[],n=R.t.length,k=Math.min(n-1,Math.round(st.get()/0.01)),tc=R.t[k];
      var ax=nar?6:6,aw=nar?388:340,gy=nar?168:168;
      o.push(S.T(ax,14,"動く絵（振子の長さは拡大して描いた）","start",9.5,"muted"));
      o.push(_w21_scene(S,U,ax,aw,gy,R,k,{Lr:nar?92:96,push:sts.get()===2?[0.5,0.1]:null}));
      o.push(S.T(ax+aw,gy+40,"t = "+_w21_f(tc,2)+" s","end",10,"ink",true));
      if(R.fell!=null&&tc>=R.fell-1e-9)o.push(S.T(ax+aw-4,30,"倒れた","end",10,"alias",true,false,null,true));
      /* s 平面 */
      var sx=nar?60:404,sy=nar?gy+64:28,sw=nar?320:280,sh=nar?130:136,Ps=U.plot(sx,sy,sw,sh,[-30,8],[-15,15]);
      o.push(S.RECT(Ps.x,Ps.y,Ps.w,Ps.h,0,"var(--screen)","line",0.6));o.push(U.ctl.splane(Ps,{zeta:[0.6]}));
      o.push(Ps.axes({xt:[-30,-20,-10,0],yt:[-10,0,10],grid:false,sz:8.5,xfmt:function(v){return _w21_g(v,2);},yfmt:function(v){return _w21_g(v,2);}}));
      o.push(U.ctl.pz(Ps,PL.poles,[],"signal",5));
      o.push(S.T(Ps.x,Ps.y-6,"閉ループの極（線形化した式。点線: 減衰比 0.6）","start",9.5,"ink",true));
      o.push(S.T(Ps.x+Ps.w-3,Ps.Y(0)-5,"実部","end",9,"muted",false,false,null,true));o.push(S.T(Ps.X(0)+4,Ps.y+11,"虚部","start",9,"muted",false,false,null,true));
      /* 波形 */
      var t=R.t,ph=col(R.x[2],1/D),pp=R.x[0],pv=R.x[1],gx,gw,gh=nar?66:72,gy0=nar?sy+sh+52:gy+70,dx,dy;
      if(nar){gx=[52,52,52];gw=330;dy=gh+30;}else{gx=[46,280,514];gw=180;dy=0;}
      var rph=_w21_range([ph],0.08,4),rp=_w21_range([pp,[0.5,-0.5].filter(function(v){return _w21_maxabs(pp)>0.3&&Math.sign(v)===Math.sign(pp[pp.length-1]);})],0.08,0.3),rv=_w21_range([pv],0.1,0.3);
      var w1=_w21_wave(S,U,gx[0],gy0,gw,gh,0,6,rph[0],rph[1],"角度 φ [°]（塗り: 面積）",[[t,ph,"signal"]],tc,true);
      var area=[];for(var i=0;i<t.length;i++)area.push([t[i],Math.max(rph[0],Math.min(rph[1],ph[i]))]);
      var poly=[[w1.P.X(0),w1.P.Y(Math.max(rph[0],Math.min(rph[1],0)))]].concat(area.map(function(q){return [w1.P.X(q[0]),w1.P.Y(q[1])];})).concat([[w1.P.X(t[t.length-1]),w1.P.Y(Math.max(rph[0],Math.min(rph[1],0)))]]);
      o.push(S.PL(poly,"none",0,"var(--signal-soft)",null,0.8));o.push(w1.svg);
      var w2=_w21_wave(S,U,gx[1],gy0+dy,gw,gh,0,6,rp[0],rp[1],"台車の位置 p [m]",[[t,pp,"signal"]],tc,true);o.push(w2.svg);
      [0.5,-0.5].forEach(function(v){if(v>rp[0]&&v<rp[1])o.push(S.L(w2.P.x,w2.P.Y(v),w2.P.x+w2.P.w,w2.P.Y(v),"alias",1,"4 3"));});
      o.push(_w21_wave(S,U,gx[2],gy0+2*dy,gw,gh,0,6,rv[0],rv[1],U.htx?"台車の速さ \\dot{p} [m/s]":"台車の速さ [m/s]",[[t,pv,"signal"]],tc,true).svg);
      box.set(S.svg(Wd,nar?gy0+2*dy+gh+42:gy0+gh+42,o));
      /* 読み出し */
      var ar=0;for(var j=1;j<t.length;j++)ar+=(t[j]-t[j-1])*(R.x[2][j]+R.x[2][j-1])/2;
      var h="閉ループの極: <b>"+_w21_poles(PL.poles,3)+"</b>";
      if(PL.poles.some(function(z){return z.re>1e-6;}))h+=' <span class="warn">右半平面に極がある（不安定）</span>';
      h+="<br>状態フィードバックとして書くと F = [<b>"+PL.row.map(function(v){return _w21_g(-v,4);}).join(", ")+"</b>]"+(G.kind===1?"（ほかに角度の積分に "+_w21_g(G.KI,4)+"）":"");
      var nT=t.length-1;
      h+="<br>角度の面積 ∫φ dt（0〜"+_w21_f(t[nT],1)+" s）: <b>"+_w21_f(ar,4)+" rad·s</b>、g × 面積 = "+_w21_f(_W21.g*ar,3)+" m/s、最後の台車の速さ "+_w21_f(pv[nT],3)+" m/s";
      var mm=_w21_minmax(ph),last=-1;for(var q=0;q<ph.length;q++)if(Math.abs(ph[q])>0.5)last=q;
      var tset=last<0?0:(last+1<t.length?t[last+1]:Infinity),rail=null;for(var q2=1;q2<t.length;q2++){if(Math.abs(pp[q2-1])<0.5&&Math.abs(pp[q2])>=0.5){rail=t[q2];break;}}
      h+="<br>角度 "+_w21_f(mm[0],2)+"〜"+_w21_f(mm[1],2)+"°、±0.5° に収まる時刻 <b>"+(isFinite(tset)?_w21_f(tset,2)+" s":"収まらない")+"</b>、台車が動く最大の距離 <b>"+_w21_g(_w21_maxabs(pp)*100,3)+" cm</b>、"+_w21_f(t[nT],0)+" s の台車の位置 "+_w21_f(pp[nT],3)+" m、最大の力 "+_w21_g(_w21_maxabs(R.u),3)+" N";
      if(rail!=null)h+=' <span class="warn">'+_w21_f(rail,2)+" s にレールの端（0.5 m）に届く</span>";
      if(R.fell!=null)h+=' <span class="warn">'+_w21_f(R.fell,2)+" s に倒れた</span>";
      ro.innerHTML=h+'<div class="wnote">線形でない式（17 章 2 節）を、すべての状態を誤差なく測る連続の制御器で、4 次のルンゲ・クッタ法（刻み 2 ms）で解いた。力の上限と摩擦は無い。レールの端は描いてあるが、台車はそこで止めずに計算を続ける。</div>';}
    fix();run();
  };

  /* ---- 5 節: 全部の問題を入れた模型で立てる ---- */
  /* 制御器: 0 直した制御器（19 章の F、W 4 倍）・1 4 節の制御器（W 1 倍）・2 角度の PD・3 カスケード（内側から決めた）。2・3 も推定は W 4 倍 */
  function _w21_ctrlF(U,k){var b=_w21_base(U),P=_W21;if(k<=1)return b.F;if(k===2)return [0,0,-P.KP,-P.KD];return [-P.KP*P.KPO,-P.KP*P.KDO,-P.KP,-P.KD];}
  var _W21_TESTS=[{t:"10° から放す",x0:10,T:6},{t:"20° から放す",x0:20,T:6},{t:"25° から放す",x0:25,T:6},{t:"おもりを右へ 1 N で 0.1 s 押す",x0:0,T:6.5,push:[0.5,0.1,1.0]},{t:"2° から放して立てておく（22 s）",x0:2,T:22,stand:true}];
  REG.w21_sim=function(el,U){
    var S=U.S,D=_W21.D;
    U.head(el,"STAND IT UP","力の上限・摩擦・観測ノイズ・遅れ・モデルの誤差を入れて、倒立振子を立てる");
    var r1=U.ctrls(el);
    var sct=U.select(r1,"制御器",["直した制御器（19 章の F・W 4 倍）","4 節の制御器（19 章の F・20 章の W）","角度の PD（3 節）","カスケード（3 節・内側から決めた）"],0,function(){prep();});
    var scp=U.select(r1,"摩擦の補償",["足さない","0.3 N を足す","0.45 N を足す（多すぎ）"],1,function(){run();});
    var sts=U.slider(r1,"サンプリング周期",{values:[1,2,5,10],value:1,fmt:function(v){return v+" ms";},onInput:function(){prep();}});
    var r2=U.ctrls(el);
    var sum=U.select(r2,"力の上限",["5 N","3 N","なし"],0,function(){run();});
    var sfc=U.select(r2,"台車の摩擦（クーロン摩擦）",["なし","0.3 N","0.6 N"],1,function(){run();});
    var sls=U.slider(r2,"測る値の遅れ",{values:[0,10,20,30,40],value:0,fmt:function(v){return v+" ms";},onInput:function(){run();}});
    var cno=U.checkbox(r2,"観測ノイズ（1 mm・0.1°）",true,function(){run();});
    var r3=U.ctrls(el);
    var slr=U.slider(r3,"振子の長さ（モデルの何倍）",{values:[0.5,0.6,0.7,0.8,0.9,1,1.1,1.2,1.3,1.4,1.5,1.6,1.8],value:1,fmt:function(v){return _w21_f(v,1)+" 倍";},onInput:function(){run();}});
    var smr=U.slider(r3,"台車の質量（モデルの何倍）",{values:[0.5,0.6,0.8,1,1.2,1.5,2,2.5],value:1,fmt:function(v){return _w21_f(v,1)+" 倍";},onInput:function(){run();}});
    var stt=U.select(r3,"試験",_W21_TESTS.map(function(q){return q.t;}),0,function(){run();});
    var r4=U.ctrls(el);
    var st=U.slider(r4,"時刻 t",{min:0,max:6,step:0.01,value:0.5,fmt:function(v){return _w21_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el),seedOff=0;
    var tk=U.ticker(function(){var T=R?R.T:6,t=st.get()+(T>10?0.1:0.03);if(t>=T){t=T;tk.stop();}st.set(t);draw();},30);
    U.button(br,"▶ 再生",function(){if(R&&st.get()>=R.T-0.001)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(c,cp,ts,um,fc,ls,no,lr,mr,test){tk.stop();sct.set(c);scp.set(cp);sts.set(ts);sum.set(um);sfc.set(fc);sls.set(ls);cno.set(no);slr.set(lr);smr.set(mr);stt.set(test);st.set(0.5);seedOff=0;prep();}
    U.button(br,"本文の例（直した制御器・10° から放す）",function(){pre(0,1,1,0,1,0,true,1,1,0);});
    U.button(br,"4 節の制御器で立てておく",function(){pre(1,0,1,0,1,0,true,1,1,4);});
    U.button(br,"直した制御器で立てておく",function(){pre(0,1,1,0,1,0,true,1,1,4);});
    U.button(br,"25° から放す（安全のための停止）",function(){pre(0,1,1,0,1,0,true,1,1,2);});
    U.button(br,"角度の PD で立てる",function(){pre(2,0,1,0,1,0,true,1,1,0);});
    U.button(br,"もう一度（別の乱数で）",function(){seedOff++;run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,DS=null;
    /* 制御器とサンプリング周期が変わったときだけ: 推定のゲインと、入力の点で切ったループの余裕（モデルどおりの対象） */
    function prep(){var c=sct.get(),Ts=sts.get()/1000,kf=_w21_kfmul(U,Ts,c===1?1:4),F=_w21_ctrlF(U,c);DS={c:c,Ts:Ts,kf:kf,F:F,mg:_w21_margins(_w21_loop(F,kf),Ts)};run();}
    function run(){if(!DS)return;var q=_W21_TESTS[stt.get()],um=[5,3,null][sum.get()];
      var r=_w21_run(U,{T:q.T,Ts:DS.Ts,x0:[0,0,q.x0*D,0],F:DS.F,kf:DS.kf,l:_W21.l*slr.get(),M:_W21.M*smr.get(),Fc:[0,0.3,0.6][sfc.get()],ffc:[0,0.3,0.45][scp.get()],
        umax:um,noise:cno.get(),seed:(q.stand?5:7)+seedOff,Ls:sls.get()/1000,push:q.push||null,every:1,stop:89,safe:true});
      R={r:r,T:q.T,q:q,um:um};st.input.max=q.T;if(st.get()>q.T)st.set(q.T);draw();}
    function col(a,s,ev){var o=[];for(var i=0;i<a.length;i+=ev)o.push(a[i]*s);return o;}
    function draw(){if(!R)return;var nar=_w21_nar(box),Wd=nar?400:700,o=[],r=R.r,n=r.t.length,k=Math.min(n-1,Math.round(st.get()/DS.Ts)),tc=r.t[k];
      var ax=6,aw=nar?388:340,gy=168;
      o.push(S.T(ax,14,"動く絵（振子の長さは拡大して描いた）","start",9.5,"muted"));
      o.push(_w21_scene(S,U,ax,aw,gy,r,k,{Lr:92,est:true,push:R.q.push}));
      if(r.fault!=null&&tc>=r.fault-1e-9)o.push(S.T(ax+4,30,"安全のための停止（力 0）","start",10,"alias",true,false,null,true));
      if(r.fell!=null&&tc>=r.fell-1e-9)o.push(S.T(ax+aw-4,30,"倒れた","end",10,"alias",true,false,null,true));
      o.push(S.T(ax+aw,gy+40,"t = "+_w21_f(tc,2)+" s","end",10,"ink",true));o.push(S.T(ax,gy+40,"破線: 推定した状態","start",9.5,"green"));
      var ev=Math.max(1,Math.round((R.T>10?0.02:0.005)/DS.Ts)),t=col(r.t,1,ev),ph=col(r.x[2],1/D,ev),pp=col(r.x[0],100,ev),u=col(r.u,1,ev),T=Math.min(R.T,r.t[n-1]+1e-9);
      var gx=nar?52:404,gw=nar?330:280,gh=nar?72:70,gy0=nar?gy+64:22,dy=gh+30;
      var rph=_w21_range([ph],0.08,2),rp=_w21_range([pp],0.08,2),ru=_w21_range([u],0.08,1);
      o.push(_w21_wave(S,U,gx,gy0,gw,gh,0,T,rph[0],rph[1],"角度 φ [°]",[[t,ph,"signal"]],tc,false).svg);
      var w2=_w21_wave(S,U,gx,gy0+dy,gw,gh,0,T,rp[0],rp[1],"台車の位置 p [cm]",[[t,pp,"signal"]],tc,false);o.push(w2.svg);
      if(R.um!=null){ru=[Math.min(ru[0],-R.um*1.1),Math.max(ru[1],R.um*1.1)];}
      var wu=_w21_wave(S,U,gx,gy0+2*dy,gw,gh,0,T,ru[0],ru[1],"力 u [N]",[[t,u,"gold",null,1.3]],tc,true);o.push(wu.svg);
      if(R.um!=null)[R.um,-R.um].forEach(function(v){o.push(S.L(wu.P.x,wu.P.Y(v),wu.P.x+wu.P.w,wu.P.Y(v),"alias",1,"3 3"));});
      box.set(S.svg(Wd,nar?gy0+3*dy+16:Math.max(gy+50,gy0+3*dy+16),o));
      /* 読み出し */
      var h="",g=DS.mg,P=_W21,Ts=DS.Ts,i0;
      h+="入力の点で切ったループ（モデルどおりの対象、"+(Ts*1000)+" ms、(B) の出し方）: 位相余裕 <b>"+(g.pm!=null?_w21_f(g.pm,1)+"°":"−")+"</b>、許されるむだ時間 <b>"+(g.delay!=null&&g.pm>0?_w21_g(g.delay*1000,3)+" ms":"−")+"</b>、安定な力の倍率 "+_w21_g(g.lo,3)+"〜"+(isFinite(g.hi)?_w21_g(g.hi,3):"∞")+" 倍";
      if(g.pm!=null&&g.pm<40)h+=' <span class="warn">仕様 8（40°）に届かない</span>';
      var tt=r.t,rx=r.x;
      if(R.q.stand){i0=Math.round(2/Ts);var mp=_w21_minmax(rx[0],i0),mq=_w21_minmax(rx[2],i0),sc=0;for(var a=i0;a<r.st.length;a++)sc+=r.st[a];
        h+="<br>2 s 以後: 台車 <b>"+_w21_f(mp[0]*1000,1)+"〜"+_w21_f(mp[1]*1000,1)+" mm</b>、振子 <b>"+_w21_f(mq[0]/D,2)+"〜"+_w21_f(mq[1]/D,2)+"°</b>、台車が止まっている時間 "+_w21_f(100*sc/Math.max(1,r.st.length-i0),0)+" %";
        var okp=Math.max(Math.abs(mp[0]),Math.abs(mp[1]))<=0.02&&Math.max(Math.abs(mq[0]),Math.abs(mq[1]))<=1*D;
        h+=okp?' <span class="ok">仕様 7 を満たす</span>':' <span class="warn">仕様 7（±2 cm・±1°）を満たさない</span>';
        var hs=_w21_hpstd(r.u,i0);h+="<br>力の速い揺れ（0.1 s の移動平均との差）の標準偏差 <b>"+_w21_g(hs,3)+" N</b>"+(hs<=0.2?' <span class="ok">仕様 6 を満たす</span>':' <span class="warn">仕様 6（0.2 N）を超える</span>');}
      else{var tm=R.q.push?3.5:2.5,j0=Math.round(tm/Ts),pmx=_w21_maxabs(rx[0]),sat=0;for(var b=0;b<r.u.length;b++)if(R.um!=null&&Math.abs(r.u[b])>=R.um-1e-9)sat++;
        var mph=_w21_minmax(rx[2]);
        h+="<br>角度 "+_w21_f(mph[0]/D,2)+"〜"+_w21_f(mph[1]/D,2)+"°";
        if(r.fell==null&&r.fault==null&&j0<rx[2].length){var mlt=_w21_maxabs(rx[2],j0)/D;h+="、"+_w21_f(tm,1)+" s 以後の角度の最大 <b>"+_w21_f(mlt,2)+"°</b>"+(mlt<=2?' <span class="ok">±2° の内側</span>':' <span class="warn">±2° を超える</span>');}
        h+="<br>台車が動く最大の距離 <b>"+_w21_g(pmx*100,3)+" cm</b>"+(pmx<=0.35?"":' <span class="warn">±0.35 m を超える</span>')+"、力が上限に張り付いた時間 <b>"+_w21_f(sat*Ts,3)+" s</b>";}
      if(r.fault!=null)h+='<br><span class="warn">'+_w21_f(r.fault,3)+" s に安全のための停止が働いた（推定した角度が 30° か、台車の位置が 0.45 m を超えた）</span>";
      if(r.fell!=null)h+=' <span class="warn">'+_w21_f(r.fell,2)+" s に倒れた</span>";
      ro.innerHTML=h+'<div class="wnote">線形でない式（17 章 2 節）とクーロン摩擦（5 節の、止まっている状態を別に扱う方法）を 4 次のルンゲ・クッタ法で解き、サンプリング周期ごとに測って推定し、次の周期の頭で力を出した（4 節のコードと同じ順番、推定した角度 30°・位置 0.45 m で止める）。推定のゲインは、20 章の 1 ms の乱れを 1 s あたりで同じにして、周期ごとに設計し直した。乱数の種 '+((R.q.stand?5:7)+seedOff)+'（本文の表と同じ種は '+(R.q.stand?5:7)+'）。</div>';}
    prep();
  };

  /* ---- 5 節: モデルの誤差の地図（振子の長さと台車の質量の倍率） ---- */
  var _W21_LR=[0.4,2.6],_W21_MR=[0.3,3.1],_W21_NG=29;
  REG.w21_robust=function(el,U){
    var S=U.S,D=_W21.D;
    U.head(el,"MODEL ERROR MAP","振子の長さと台車の質量がモデルからずれたとき、立ち続けられるか");
    var r1=U.ctrls(el);
    var sw=U.select(r1,"推定の W（乱れの見積もり）",["20 章の W（1 倍）","4 倍（直した制御器）","10 倍"],1,function(){mapc();});
    var stt=U.select(r1,"試験",["おもりを右へ 1 N で 0.1 s 押す","10° から放す"],0,function(){sim();});
    var r2=U.ctrls(el);
    function lv(){var a=[];for(var i=0;i<=44;i++)a.push(+(0.4+0.05*i).toFixed(2));return a;}
    function mv(){var a=[];for(var i=0;i<=56;i++)a.push(+(0.3+0.05*i).toFixed(2));return a;}
    var slr=U.slider(r2,"振子の長さ（モデルの何倍）",{values:lv(),value:1.2,fmt:function(v){return _w21_f(v,2)+" 倍";},onInput:function(){sim();}});
    var smr=U.slider(r2,"台車の質量（モデルの何倍）",{values:mv(),value:1.2,fmt:function(v){return _w21_f(v,2)+" 倍";},onInput:function(){sim();}});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 t",{min:0,max:5,step:0.01,value:0.6,fmt:function(v){return _w21_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.03;if(t>=5){t=5;tk.stop();}st.set(t);draw();},30);
    U.button(br,"▶ 再生",function(){if(st.get()>=4.99)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(w,lr,mr,ts){tk.stop();sw.set(w);slr.set(lr);smr.set(mr);stt.set(ts);st.set(0.6);mapc();}
    U.button(br,"本文の例（4 倍・長さと質量 1.2 倍で押す）",function(){pre(1,1.2,1.2,0);});
    U.button(br,"モデルどおり",function(){pre(1,1,1,0);});
    U.button(br,"台車の質量 2.2 倍（揺れが長く残る）",function(){pre(1,1,2.2,0);});
    U.button(br,"20 章の W・台車の質量 2.4 倍",function(){pre(0,1,2.4,0);});
    U.button(br,"振子の長さ 0.35 倍",function(){pre(1,0.35,1,0);});
    var box=U.svgbox(el),ro=U.readout(el),MAP=null,R=null,CL=null,PM=null;
    function kfw(){return _w21_kfmul(U,0.001,[1,4,10][sw.get()]);}
    /* 地図: 格子の各点で閉ループの固有値を求めて、立つ（緑）・揺れが長く残る（金）・不安定（赤）に分ける */
    function mapc(){var kf=kfw(),F=_w21_base(U).F,g=[];for(var a=0;a<_W21_NG;a++){var row=[];for(var b=0;b<_W21_NG;b++){
        var lr=_W21_LR[0]+(_W21_LR[1]-_W21_LR[0])*a/(_W21_NG-1),mr=_W21_MR[0]+(_W21_MR[1]-_W21_MR[0])*b/(_W21_NG-1);row.push(_w21_cleig(U,lr,mr,F,kf).cls);}g.push(row);}
      MAP={g:g,w:sw.get()};sim();}
    function sim(){if(!MAP)return;var kf=kfw(),F=_w21_base(U).F,lr=slr.get(),mr=smr.get(),ts=stt.get();
      CL=_w21_cleig(U,lr,mr,F,kf);
      R=_w21_run(U,{T:5,x0:ts===1?[0,0,10*D,0]:[0,0,0,0],F:F,kf:kf,l:_W21.l*lr,M:_W21.M*mr,push:ts===0?[0.5,0.1,1.0]:null,stop:60});draw();}
    function draw(){if(!R)return;var nar=_w21_nar(box),Wd=nar?400:700,o=[],n=R.t.length,k=Math.min(n-1,Math.round(st.get()/0.001)),tc=R.t[k];
      /* 地図 */
      var mx=nar?60:56,my=26,mw=nar?320:250,mh=nar?230:220,Pm=U.plot(mx,my,mw,mh,_W21_MR,_W21_LR),cols=["alias","gold","green"];PM=Pm;
      o.push(S.T(mx-46,14,"地図（押すと、その組で試す）","start",9.5,"ink",true));
      var dl=(_W21_LR[1]-_W21_LR[0])/(_W21_NG-1),dm=(_W21_MR[1]-_W21_MR[0])/(_W21_NG-1);
      for(var a=0;a<_W21_NG;a++)for(var b=0;b<_W21_NG;b++){var lr=_W21_LR[0]+dl*a,mr=_W21_MR[0]+dm*b,x0=Pm.X(Math.max(_W21_MR[0],mr-dm/2)),x1=Pm.X(Math.min(_W21_MR[1],mr+dm/2)),y0=Pm.Y(Math.min(_W21_LR[1],lr+dl/2)),y1=Pm.Y(Math.max(_W21_LR[0],lr-dl/2));
        o.push('<rect x="'+x0.toFixed(1)+'" y="'+y0.toFixed(1)+'" width="'+(x1-x0+0.6).toFixed(1)+'" height="'+(y1-y0+0.6).toFixed(1)+'" fill="var(--'+cols[MAP.g[a][b]]+'-soft)" stroke="none"/>');}
      o.push(Pm.axes({xl:"台車の質量の倍率",yl:"振子の長さの倍率",xt:[0.5,1,1.5,2,2.5,3],yt:[0.5,1,1.5,2,2.5],grid:false,sz:8.5,xfmt:function(v){return String(v);},yfmt:function(v){return String(v);}}));
      o.push(S.RECT(Pm.X(0.8),Pm.Y(1.2),Pm.X(1.2)-Pm.X(0.8),Pm.Y(0.8)-Pm.Y(1.2),0,"none","ink",1.3));o.push(S.D(Pm.X(1),Pm.Y(1),"ink",2.6));
      var cx=Pm.X(Math.max(_W21_MR[0],Math.min(_W21_MR[1],smr.get()))),cy=Pm.Y(Math.max(_W21_LR[0],Math.min(_W21_LR[1],slr.get())));
      o.push(S.CIRC(cx,cy,7,"signal",2.4,"none"));o.push(S.L(cx-11,cy,cx-5,cy,"signal",2));o.push(S.L(cx+5,cy,cx+11,cy,"signal",2));
      var ly=my+mh+44;o.push(S.RECT(mx-40,ly-9,10,10,2,"var(--green-soft)","green",1));o.push(S.T(mx-26,ly,"立つ","start",9,"muted"));
      o.push(S.RECT(mx+8,ly-9,10,10,2,"var(--gold-soft)","gold",1));o.push(S.T(mx+22,ly,"揺れが長く残る（減衰比 < 0.1）","start",9,"muted"));
      o.push(S.RECT(mx+186,ly-9,10,10,2,"var(--alias-soft)","alias",1));o.push(S.T(mx+200,ly,"不安定","start",9,"muted"));
      o.push(S.T(mx-40,ly+16,"枠: 仕様 9 の ±20 %、点: モデルどおり、○: 選んだ組","start",9,"muted"));
      /* 動く絵と波形 */
      var ax=nar?6:340,aw=nar?388:354,gy=nar?ly+190:170,ay=nar?ly+40:0;
      o.push(S.T(ax,ay+14,"動く絵（振子の長さは拡大して描いた）","start",9.5,"muted"));
      o.push(_w21_scene(S,U,ax,aw,ay+gy-(nar?ly+40:0),R,k,{Lr:Math.max(40,Math.min(130,90*slr.get())),est:true,push:stt.get()===0?[0.5,0.1]:null}));
      o.push(S.T(ax+aw,ay+gy-(nar?ly+40:0)+40,"t = "+_w21_f(tc,2)+" s","end",10,"ink",true));
      if(R.fell!=null&&tc>=R.fell-1e-9)o.push(S.T(ax+aw-4,ay+30,"倒れた","end",10,"alias",true,false,null,true));
      var ev=5,t=[],ph=[],pp=[];for(var i=0;i<n;i+=ev){t.push(R.t[i]);ph.push(R.x[2][i]/D);pp.push(R.x[0][i]*100);}
      var gx=nar?52:392,gw=nar?330:290,gh=58,gy0=nar?ay+gy-(ly+40)+64:gy+66,rph=_w21_range([ph],0.08,4),rp=_w21_range([pp],0.08,4);
      o.push(_w21_wave(S,U,gx,gy0,gw,gh,0,5,rph[0],rph[1],"角度 φ [°]",[[t,ph,"signal"]],tc,false).svg);
      o.push(_w21_wave(S,U,gx,gy0+gh+28,gw,gh,0,5,rp[0],rp[1],"台車の位置 p [cm]",[[t,pp,"signal"]],tc,true).svg);
      var Ht=Math.max(ly+30,gy0+2*gh+28+40);box.set(S.svg(Wd,Ht,o));
      /* 読み出し */
      var nm=["不安定","揺れが長く残る","立つ"],cc=["warn","warn","ok"],h="長さ "+_w21_f(slr.get(),2)+" 倍・質量 "+_w21_f(smr.get(),2)+" 倍: <span class=\""+cc[CL.cls]+"\">"+nm[CL.cls]+"</span>（閉ループの 9 つの極のうち、z 平面の原点から最も遠い極の距離 "+_w21_f(CL.rho,5)+"、最も小さい減衰比 "+(CL.rho<1?_w21_f(CL.zmin,3):"−")+"）";
      var mm=_w21_minmax(R.x[2]),j0=Math.round((stt.get()===0?3.5:2.5)/0.001);
      h+="<br>角度 "+_w21_f(mm[0]/D,2)+"〜"+_w21_f(mm[1]/D,2)+"°、台車が動く最大の距離 <b>"+_w21_g(_w21_maxabs(R.x[0])*100,3)+" cm</b>";
      if(R.fell==null&&j0<R.x[2].length){var ml=_w21_maxabs(R.x[2],j0)/D;h+="、"+(stt.get()===0?"押してから 3 s 後":"2.5 s")+"以後の角度の最大 <b>"+_w21_f(ml,2)+"°</b>"+(ml<=2?' <span class="ok">±2° の内側</span>':' <span class="warn">±2° を超える</span>');}
      if(R.fell!=null)h+=' <span class="warn">'+_w21_f(R.fell,2)+" s に倒れた（60°）</span>";
      ro.innerHTML=h+'<div class="wnote">地図は、線形化した式に 1 ms ごとの計算とカルマンフィルタ（モデルどおりの値で推定する）を入れた閉ループの固有値で塗った（29 × 29 の格子）。動く絵と波形は、線形でない式（力の上限 5 N、摩擦と観測ノイズは無し）。</div>';}
    U.ctl.drag(box,function(ev,px,py){if(!PM||px==null)return false;if(px<PM.x||px>PM.x+PM.w||py<PM.y||py>PM.y+PM.h)return false;
      var mr=PM.ux(px),lr=PM.uy(py);smr.set(Math.round(mr/0.05)*0.05);slr.set(Math.round(lr/0.05)*0.05);if(ev!=="move"||!tk.running())sim();});
    mapc();
  };

  /* ---- 6 節: 仕様の表を模型の試験で判定する（本文 5 節の表と同じ手順・同じ乱数の種） ---- */
  var _W21_SPEC=["2.5 s 以後 ±2°","20° から立て直す","台車 ±0.35 m","押して 3 s 後から ±2°","上限に張り付く時間 0.1 s 以内","力の速い揺れ 0.2 N 以下","台車 ±2 cm・振子 ±1°","位相余裕 40° 以上、20 ms 遅れて 1","±20 % で 1・4"];
  function _w21_suite(U,o){var D=_W21.D,F=_w21_base(U).F,kf=_w21_kfmul(U,0.001,o.mul),kw={F:F,kf:kf,Fc:o.Fc,ffc:o.ffc,noise:o.noise},res=[],i;
    function run(extra){var q={};for(var a in kw)q[a]=kw[a];for(var b in extra)q[b]=extra[b];return _w21_run(U,q);}
    function after(r,t0){var j=Math.round(t0/0.001);return r.fell==null&&j<r.x[2].length?_w21_maxabs(r.x[2],j)/D:Infinity;}
    var r1=run({T:6,x0:[0,0,10*D,0],seed:7}),r2=run({T:6,x0:[0,0,20*D,0],seed:7,stop:89}),r4=run({T:6.5,x0:[0,0,0,0],push:[0.5,0.1,1.0],seed:7}),r7=run({T:22,x0:[0,0,2*D,0],seed:5});
    var a1=after(r1,2.5),a4=after(r4,3.5),p3=Math.max(_w21_maxabs(r1.x[0]),_w21_maxabs(r4.x[0])),sat=0;for(i=0;i<r1.u.length;i++)if(Math.abs(r1.u[i])>=5-1e-9)sat++;sat*=0.001;
    var p2=_w21_maxabs(r2.x[0]),ok2=r2.fell==null&&p2<0.45&&Math.abs(r2.x[2][r2.x[2].length-1])<2*D;
    var i0=2000,hs=_w21_hpstd(r7.u,i0),p7=_w21_maxabs(r7.x[0],i0),f7=_w21_maxabs(r7.x[2],i0)/D;
    var mg=_w21_margins(_w21_loop(F,kf),0.001),r8=run({T:6,x0:[0,0,10*D,0],seed:7,Ls:0.02}),a8=after(r8,2.5);
    var w1=0,w4=0,c9=[];[[0.8,0.8],[0.8,1.2],[1.2,0.8],[1.2,1.2]].forEach(function(c){var ra=run({T:6,x0:[0,0,10*D,0],seed:7,l:_W21.l*c[0],M:_W21.M*c[1]}),rb=run({T:6.5,x0:[0,0,0,0],push:[0.5,0.1,1.0],seed:7,l:_W21.l*c[0],M:_W21.M*c[1]});
      w1=Math.max(w1,after(ra,2.5));w4=Math.max(w4,after(rb,3.5));c9.push({c:c,ra:ra,rb:rb});});
    res.push({ok:a1<=2,v:_w21_f(a1,2)+"°"});
    res.push({ok:ok2,v:ok2?"台車 "+_w21_f(p2,3)+" m":(r2.fell!=null?"倒れる":"台車 "+_w21_f(p2,3)+" m")});
    res.push({ok:p3<=0.35,v:_w21_f(p3,3)+" m"});
    res.push({ok:a4<=2,v:_w21_f(a4,2)+"°"});
    res.push({ok:sat<=0.1,v:_w21_f(sat,3)+" s"});
    res.push({ok:hs<=0.2,v:_w21_f(hs,3)+" N"});
    res.push({ok:p7<=0.02&&f7<=1,v:_w21_f(p7*100,2)+" cm・"+_w21_f(f7,2)+"°"});
    res.push({ok:mg.pm!=null&&mg.pm>=40&&a8<=2,v:(mg.pm!=null?_w21_f(mg.pm,1)+"°":"−")+"（1 は "+(isFinite(a8)?_w21_f(a8,2)+"°":"倒れる")+"）"});
    res.push({ok:w1<=2&&w4<=2,v:(isFinite(w1)?_w21_f(w1,2)+"°":"倒れる")+"・"+(isFinite(w4)?_w21_f(w4,2)+"°":"倒れる")});
    return {res:res,r1:r1,r2:r2,r4:r4,r7:r7,r8:r8,c9:c9,mg:mg,loop:_w21_loop(F,kf)};}
  REG.w21_check=function(el,U){
    var S=U.S,D=_W21.D;
    U.head(el,"SPEC CHECK","仕様の表の 9 行を、全部の問題を入れた模型の試験で判定する");
    var r1=U.ctrls(el);
    var sw=U.select(r1,"推定の W（乱れの見積もり）",["20 章の W（1 倍）","4 倍","10 倍"],1,function(){go();});
    var scp=U.select(r1,"摩擦の補償",["足さない","0.3 N を足す","0.45 N を足す"],1,function(){go();});
    var r2=U.ctrls(el);
    var sfc=U.select(r2,"模型の摩擦",["なし","0.3 N","0.6 N"],1,function(){go();});
    var cno=U.checkbox(r2,"観測ノイズ（1 mm・0.1°）",true,function(){go();});
    var srow=U.select(r2,"波形を見る行",_W21_SPEC.map(function(t,i){return (i+1)+": "+t;}),6,function(){draw();});
    var br=U.btnrow(el);
    function pre(w,cp,fc,no,row){sw.set(w);scp.set(cp);sfc.set(fc);cno.set(no);srow.set(row);go();}
    U.button(br,"本文の例（直した制御器）",function(){pre(1,1,1,true,6);});
    U.button(br,"4 節の制御器",function(){pre(0,0,1,true,6);});
    U.button(br,"補償 0.3 N で摩擦が無い",function(){pre(1,1,0,true,0);});
    var tb=U.readout(el),box=U.svgbox(el),ro=U.readout(el),R=null;
    function go(){R=_w21_suite(U,{mul:[1,4,10][sw.get()],ffc:[0,0.3,0.45][scp.get()],Fc:[0,0.3,0.6][sfc.get()],noise:cno.get()});table();draw();}
    function table(){var rows=R.res.map(function(q,i){return [String(i+1),_W21_SPEC[i],q.v,q.ok?'<span class="ok">○</span>':'<span class="warn">×</span>'];});
      var nok=R.res.filter(function(q){return q.ok;}).length;
      tb.innerHTML=U.tbl(["","仕様","模型の試験の値","判定"],rows,["right","left","left","center"])+"<div>"+nok+" / 9 行を満たす"+(nok===9?' <span class="ok">すべて満たす</span>':"")+"</div>";
      var trs=tb.querySelectorAll("tbody tr");for(var i=0;i<trs.length;i++){(function(k){trs[k].style.cursor="pointer";if(k===srow.get())trs[k].style.background="var(--signal-soft)";
        trs[k].addEventListener("click",function(){srow.set(k);table();draw();});})(i);}}
    function band(P,t0,t1,lo,hi){var o=[];if(hi<P.yr[1])o.push(S.RECT(P.X(t0),P.Y(P.yr[1]),P.X(t1)-P.X(t0),P.Y(hi)-P.Y(P.yr[1]),0,"var(--alias-soft)","none",0));
      if(lo>P.yr[0])o.push(S.RECT(P.X(t0),P.Y(lo),P.X(t1)-P.X(t0),P.Y(P.yr[0])-P.Y(lo),0,"var(--alias-soft)","none",0));return o.join("");}
    function ser(r,i,s,ev,t0){var t=[],y=[];ev=ev||5;for(var k=0;k<r.t.length;k+=ev){if(t0!=null&&r.t[k]<t0)continue;t.push(r.t[k]);y.push(i==="u"?r.u[k]*s:r.x[i][k]*s);}return [t,y];}
    function draw(){if(!R)return;table();var nar=_w21_nar(box),Wd=nar?400:700,o=[],row=srow.get(),gx=nar?52:56,gw=nar?330:280,gh=74,gx2=nar?52:400,dy=gh+34,yy=22,h="";
      var yb=0;function wave(x,y,T0,T,lo,hi,title,list,xl){yb=Math.max(yb,y+gh+(xl?40:24));return _w21_wave(S,U,x,y,gw,gh,T0,T,lo,hi,title,list,null,xl);}
      if(row===0||row===2||row===4){var a=ser(R.r1,2,1/D),p=ser(R.r1,0,1),u=ser(R.r1,"u",1),ra=_w21_range([a[1]],0.1,6);
        var w1=wave(gx,yy,0,6,ra[0],ra[1],"10° から放す: 角度 φ [°]",[[a[0],a[1],"signal"]],false);o.push(band(w1.P,2.5,6,-2,2));o.push(w1.svg);
        var rp=_w21_range([p[1],[0.4,-0.1]],0.05,0.2),w2=wave(gx2,yy+(nar?dy:0),0,6,rp[0],rp[1],"台車の位置 p [m]",[[p[0],p[1],"signal"]],nar);o.push(band(w2.P,0,6,-0.35,0.35));o.push(w2.svg);
        var w3=wave(gx,yy+dy*(nar?2:1),0,6,-6,6,"力 u [N]",[[u[0],u[1],"gold",null,1.3]],true);o.push(w3.svg);[5,-5].forEach(function(v){o.push(S.L(w3.P.x,w3.P.Y(v),w3.P.x+w3.P.w,w3.P.Y(v),"alias",1,"3 3"));});
        h="薄い赤: 仕様 1・3 で入ってはいけない範囲。赤の破線: 力の上限 5 N（仕様 5 は、ここに張り付く時間）。";}
      else if(row===1){var a2=ser(R.r2,2,1/D),p2=ser(R.r2,0,1),ra2=_w21_range([a2[1]],0.1,10),rp2=_w21_range([p2[1],[0.5]],0.05,0.3);
        o.push(wave(gx,yy,0,6,ra2[0],ra2[1],"20° から放す: 角度 φ [°]",[[a2[0],a2[1],"signal"]],true).svg);
        var w22=wave(gx2,yy+(nar?dy:0),0,6,rp2[0],rp2[1],"台車の位置 p [m]",[[p2[0],p2[1],"signal"]],true);o.push(band(w22.P,0,6,-0.45,0.45));o.push(w22.svg);
        h="薄い赤: 安全のための停止が働く台車の位置（0.45 m）より外。";}
      else if(row===3){var a4=ser(R.r4,2,1/D),p4=ser(R.r4,0,1),ra4=_w21_range([a4[1]],0.1,6),rp4=_w21_range([p4[1],[0.4,-0.1]],0.05,0.2);
        var w41=wave(gx,yy,0,6.5,ra4[0],ra4[1],"押す（0.5 s から）: 角度 φ [°]",[[a4[0],a4[1],"signal"]],true);o.push(band(w41.P,3.5,6.5,-2,2));o.push(w41.svg);
        var w42=wave(gx2,yy+(nar?dy:0),0,6.5,rp4[0],rp4[1],"台車の位置 p [m]",[[p4[0],p4[1],"signal"]],true);o.push(band(w42.P,0,6.5,-0.35,0.35));o.push(w42.svg);
        h="薄い赤: 仕様 4・3 で入ってはいけない範囲。";}
      else if(row===5||row===6){var p7=ser(R.r7,0,100,10,2),a7=ser(R.r7,2,1/D,10,2),u7=ser(R.r7,"u",1,2,2);
        var w71=wave(gx,yy,2,22,-4,4,"立てておく: 台車の位置 p [cm]",[[p7[0],p7[1],"signal",null,1.4]],false);o.push(band(w71.P,2,22,-2,2));o.push(w71.svg);
        var w72=wave(gx2,yy+(nar?dy:0),2,22,-1.6,1.6,"角度 φ [°]",[[a7[0],a7[1],"signal",null,1.4]],false);o.push(band(w72.P,2,22,-1,1));o.push(w72.svg);
        var ma=[],uu=R.r7.u,c=[0];for(var k=0;k<uu.length;k++)c.push(c[k]+uu[k]);for(var k2=0;k2<u7[0].length;k2++){var j=Math.round(u7[0][k2]/0.001),lo=Math.max(0,j-50),hi=Math.min(uu.length-1,j+50);ma.push((c[hi+1]-c[lo])/(hi-lo+1));}
        var ru7=_w21_range([u7[1]],0.05,1);o.push(wave(gx,yy+dy*(nar?2:1),2,22,ru7[0],ru7[1],"力 u [N]（濃い線: 0.1 s の移動平均）",[[u7[0],u7[1],"gold",null,0.8],[u7[0],ma,"ink",null,1.4]],true).svg);
        h="薄い赤: 仕様 7 で入ってはいけない範囲。仕様 6 は、力と、その 0.1 s の移動平均との差の標準偏差（摩擦によるゆっくりした揺れを除く）。";}
      else if(row===7){var cp=U.plot(gx,yy+10,nar?300:250,nar?200:180,[-3.2,1],[-1.6,1.6]),ws=[],v,pts=[];o.push(S.RECT(cp.x,cp.y,cp.w,cp.h,0,"var(--screen)","line",0.6));
        o.push(cp.axes({xt:[-3,-2,-1,0,1],yt:[-1,0,1],grid:true,sz:8.5,xfmt:function(q){return _w21_g(q,2);},yfmt:function(q){return _w21_g(q,2);}}));
        var cc=[];for(var q=0;q<=120;q++){var th=2*Math.PI*q/120;cc.push([-1+Math.cos(th),Math.sin(th)]);}o.push(cp.clip(cc,"green",1.2,"3 3"));
        for(var q2=0;q2<700;q2++){var w=Math.pow(10,-0.3+(Math.log10(Math.PI/0.001*0.99)+0.3)*q2/699);v=R.loop(w);pts.push([v.re,v.im]);}
        o.push(cp.clip(pts,"signal",1.8));o.push(S.X(cp.X(-1),cp.Y(0),5,"alias",2));yb=Math.max(yb,cp.y+cp.h+40);
        o.push(S.T(cp.x,cp.y-8,"入力の点で切ったループのナイキスト線図","start",9.5,"ink",true));o.push(S.T(cp.x+cp.w/2,cp.y+cp.h+28,"実部","middle",9,"muted"));
        var a8=ser(R.r8,2,1/D),ra8=_w21_range([a8[1]],0.1,6),w81=wave(gx2,yy+(nar?cp.h+60:10),0,6,ra8[0],ra8[1],"測る値が 20 ms 遅れて 10° から放す: φ [°]",[[a8[0],a8[1],"signal"]],true);o.push(band(w81.P,2.5,6,-2,2));o.push(w81.svg);
        h="緑の点線: −1 を中心とする半径 1 の円（19 章 6 節）。位相余裕 "+(R.mg.pm!=null?_w21_f(R.mg.pm,1)+"°":"−")+"、ゲイン交差角周波数 "+(R.mg.wgc?_w21_g(R.mg.wgc,3)+" rad/s":"−")+"、許されるむだ時間 "+(R.mg.delay?_w21_g(R.mg.delay*1000,3)+" ms":"−")+"。";}
      else{var cl=["teal","purple","gold","alias"],sa=[],sb=[];R.c9.forEach(function(z,i){var a9=ser(z.ra,2,1/D),b9=ser(z.rb,2,1/D);sa.push([a9[0],a9[1],cl[i],null,1.4]);sb.push([b9[0],b9[1],cl[i],null,1.4]);});
        var w91=wave(gx,yy,0,6,-8,11,"±20 % の 4 つの角: 10° から放す φ [°]",sa,true);o.push(band(w91.P,2.5,6,-2,2));o.push(w91.svg);
        var w92=wave(gx2,yy+(nar?dy:0),0,6.5,-17,6,"押す φ [°]",sb,true);o.push(band(w92.P,3.5,6.5,-2,2));o.push(w92.svg);
        var ly=yb+4;R.c9.forEach(function(z,i){var lx=gx-40+(i%2)*170+(nar?0:(i>1?340:0)),lyy=ly+(nar?Math.floor(i/2)*16:0)-(nar?0:(i%2?0:0));o.push(S.L(lx,lyy-4,lx+20,lyy-4,cl[i],2.2));o.push(S.T(lx+24,lyy,"長さ "+z.c[0]+" 倍・質量 "+z.c[1]+" 倍","start",9,"muted"));});yb=ly+(nar?28:12);
        h="4 つの角（振子の長さの倍率・台車の質量の倍率）。薄い赤: 仕様 1・4 で入ってはいけない範囲。";}
      box.set(S.svg(Wd,yb+4,o));
      ro.innerHTML=h+'<div class="wnote">本文 5 節の表と同じ試験（線形でない式とクーロン摩擦、力の上限 5 N、1 ms ごと・(B) の出し方、推定した角度 30°・位置 0.45 m で止めない）。観測ノイズの乱数の種は、6・7 が 5、ほかは 7。行を押すと、その行の試験の波形を表示する。</div>';}
    go();
  };
