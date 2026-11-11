  /* ===== 17 章 搬送波位相と RTK — センチメートル級の仕組み ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w17_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w17_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w17_s(v,d){var s=_w17_f(v,d);return (v>=0&&Math.abs(v)>=0.5*Math.pow(10,-d)?"+":"")+s;}
  /* 3 桁ごとに空白を入れた数（小数 d 桁） */
  function _w17_g(v,d){var neg=v<0,a=Math.abs(v),ip=Math.floor(a+(d?0:0.5)),fr=d?(a-Math.floor(a)).toFixed(d).slice(1):"";
    if(d&&+((a-Math.floor(a)).toFixed(d))>=1){ip+=1;fr="."+new Array(d+1).join("0");}
    return (neg?"−":"")+String(ip).replace(/\B(?=(\d{3})+(?!\d))/g," ")+fr;}
  var _W17_C=299792458,_W17_F1=1575.42e6,_W17_LAM=_W17_C/_W17_F1,_W17_D=Math.PI/180;
  /* 4 節の線路の上の例（図の f17.py と同じ衛星・同じ式） */
  var _W17_TOY={G9:[74.9,186.6],G6:[51.5,45.1],G22:[45.6,234.9]};
  function _w17_lE(ea){return Math.cos(ea[0]*_W17_D)*Math.sin(ea[1]*_W17_D);}
  function _w17_toyg(){var l9=_w17_lE(_W17_TOY.G9);return [-(_w17_lE(_W17_TOY.G6)-l9),-(_w17_lE(_W17_TOY.G22)-l9)];}

  /* ---- 整数の最小二乗（LAMBDA の変換と探索。RTKLIB の lambda.c と同じ手順。図の f17.py の _f17_ils と同じ） ---- */
  function _w17_zeros(n,m){var o=[];for(var i=0;i<n;i++){var r=[];for(var j=0;j<m;j++)r.push(0);o.push(r);}return o;}
  function _w17_LD(Q){var n=Q.length,A=Q.map(function(r){return r.slice();}),L=_w17_zeros(n,n),D=[],i,j,k;
    for(i=n-1;i>=0;i--){D[i]=A[i][i];var a=Math.sqrt(D[i]);for(j=0;j<=i;j++)L[i][j]=A[i][j]/a;
      for(j=0;j<i;j++)for(k=0;k<=j;k++)A[j][k]-=L[i][k]*L[i][j];
      var lii=L[i][i];for(j=0;j<=i;j++)L[i][j]/=lii;}
    return {L:L,D:D};}
  function _w17_reduction(L,D){var n=L.length,Z=_w17_zeros(n,n),i,j,k,q;for(i=0;i<n;i++)Z[i][i]=1;j=n-2;k=n-2;
    while(j>=0){
      if(j<=k)for(i=j+1;i<n;i++){var mu=Math.round(L[i][j]);if(mu!==0){for(q=i;q<n;q++)L[q][j]-=mu*L[q][i];for(q=0;q<n;q++)Z[q][j]-=mu*Z[q][i];}}
      var dl=D[j]+L[j+1][j]*L[j+1][j]*D[j+1];
      if(dl+1e-6<D[j+1]){var eta=D[j]/dl,lam=D[j+1]*L[j+1][j]/dl;D[j]=eta*D[j+1];D[j+1]=dl;
        for(q=0;q<j;q++){var a0=L[j][q],a1=L[j+1][q];L[j][q]=-L[j+1][j]*a0+a1;L[j+1][q]=eta*a0+lam*a1;}
        L[j+1][j]=lam;for(q=j+2;q<n;q++){var t=L[q][j];L[q][j]=L[q][j+1];L[q][j+1]=t;}
        for(q=0;q<n;q++){var t2=Z[q][j];Z[q][j]=Z[q][j+1];Z[q][j+1]=t2;}
        k=j;j=n-2;}
      else j--;}
    return Z;}
  function _w17_search(L,D,zs,m){var n=L.length,S=_w17_zeros(n,n),dist=[],zb=[],z=[],step=[],zn=[],s=[],nn=0,imax=0,maxdist=1e99,i,k,y,c;
    for(i=0;i<n;i++){dist.push(0);zb.push(0);z.push(0);step.push(0);}
    function sg(v){return v>=0?1:-1;}
    k=n-1;zb[k]=zs[k];z[k]=Math.round(zb[k]);y=zb[k]-z[k];step[k]=sg(y);
    for(c=0;c<100000;c++){var nd=dist[k]+y*y/D[k];
      if(nd<maxdist){
        if(k!==0){k--;dist[k]=nd;for(i=0;i<=k;i++)S[k][i]=S[k+1][i]+(z[k+1]-zb[k+1])*L[k+1][i];
          zb[k]=zs[k]+S[k][k];z[k]=Math.round(zb[k]);y=zb[k]-z[k];step[k]=sg(y);}
        else{
          if(nn<m){if(nn===0||nd>s[imax])imax=nn;zn.push(z.slice());s.push(nd);nn++;}
          else{if(nd<s[imax]){zn[imax]=z.slice();s[imax]=nd;imax=0;for(i=0;i<m;i++)if(s[imax]<s[i])imax=i;}maxdist=s[imax];}
          z[0]+=step[0];y=zb[0]-z[0];step[0]=-step[0]-sg(step[0]);}}
      else{if(k===n-1)break;k++;z[k]+=step[k];y=zb[k]-z[k];step[k]=-step[k]-sg(step[k]);}}
    var ord=s.map(function(_,i){return i;}).sort(function(a,b){return s[a]-s[b];});
    return {zn:ord.map(function(i){return zn[i];}),s:ord.map(function(i){return s[i];})};}
  /* 浮動の解 a と共分散 Q から、整数の最小二乗の候補を良い順に m 個と、その J。Z の行列（z = Zᵀa）も返す */
  function _w17_ils(U,a,Q,m,pre){var M=U.ctl.mat,P=pre||_w17_prep(U,Q);
    var zs=[];for(var i=0;i<a.length;i++){var v=0;for(var j=0;j<a.length;j++)v+=P.Z[j][i]*a[j];zs.push(v);}
    var r=_w17_search(P.L,P.D,zs,m||2);
    var F=r.zn.map(function(z){return M.mul(P.ZTi,M.col(z)).map(function(row){return Math.round(row[0]);});});
    return {F:F,s:r.s};}
  function _w17_prep(U,Q){var ld=_w17_LD(Q),L=ld.L.map(function(r){return r.slice();}),D=ld.D.slice(),Z=_w17_reduction(L,D);
    return {L:L,D:D,Z:Z,ZTi:U.ctl.mat.inv(U.ctl.mat.T(Z))};}

  /* ---- 線路の上の例: (e, N6, N22) の共分散。K エポック、雑音はエポックごとに独立（図の _f17_toyQ と同じ） ---- */
  function _w17_toyQ(U,sr,sp,K){var M=U.ctl.mat,g=_w17_toyg(),Qs=[[4,2],[2,4]];
    var Wc=M.inv(M.scale(Qs,sr*sr)),Wp=M.inv(M.scale(Qs,sp*sp));
    var Hc=[[g[0],0,0],[g[1],0,0]],Hp=[[g[0],_W17_LAM,0],[g[1],0,_W17_LAM]];
    var Nm=M.add(M.mul(M.mul(M.T(Hc),Wc),Hc),M.mul(M.mul(M.T(Hp),Wp),Hp));
    return M.inv(M.scale(Nm,K));}
  function _w17_chol(A){var n=A.length,L=_w17_zeros(n,n);for(var i=0;i<n;i++)for(var j=0;j<=i;j++){var s=A[i][j];for(var k=0;k<j;k++)s-=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(s,1e-300)):s/L[j][j];}return L;}
  /* 凸多角形を半平面 n·p ≤ c で切る */
  function _w17_clip(P,n,c){var o=[];for(var i=0;i<P.length;i++){var A=P[i],B=P[(i+1)%P.length],da=n[0]*A[0]+n[1]*A[1]-c,db=n[0]*B[0]+n[1]*B[1]-c;
    if(da<=0)o.push(A);if((da<0&&db>0)||(db<0&&da>0)){var t=da/(da-db);o.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]);}}return o;}
  /* 原点を含む凸多角形の中に、2 次元の標準正規分布の点が入る確率（原点から見た角度で積分。図の _f17_pin と同じ） */
  function _w17_pin(P,ns){ns=ns||3000;var tot=0;for(var i=0;i<P.length;i++){var A=P[i],B=P[(i+1)%P.length],t1=Math.atan2(A[1],A[0]),dt=Math.atan2(B[1],B[0])-t1;
      while(dt<=-Math.PI)dt+=2*Math.PI;while(dt>Math.PI)dt-=2*Math.PI;
      var ex=B[0]-A[0],ey=B[1]-A[1],el=Math.hypot(ex,ey),nx=ey/el,ny=-ex/el,p=nx*A[0]+ny*A[1];if(p<0){nx=-nx;ny=-ny;p=-p;}
      var th0=Math.atan2(ny,nx),s=0;for(var k=0;k<ns;k++){var t=t1+dt*(k+0.5)/ns,r=p/Math.cos(t-th0);s+=1-Math.exp(-r*r/2);}tot+=s*dt/ns;}
    return tot/(2*Math.PI);}
  /* 2 つの整数値バイアスの、丸めの正方形と整数の最小二乗の領域（M があれば z = M a の座標で）と、それぞれの確率 */
  function _w17_regions(U,Qa,Mz){var M=U.ctl.mat,Q=Mz?M.mul(M.mul(Mz,Qa),M.T(Mz)):Qa,R=_w17_chol(Q),Ri=M.inv(R),pre=_w17_prep(U,Q);
    var big=1e4,P=[[-big,-big],[big,-big],[big,big],[-big,big]];
    for(var i=-3;i<=3;i++)for(var j=-3;j<=3;j++){if(!i&&!j)continue;var zv=M.mul(pre.ZTi,[[i],[j]]),v=M.mul(Ri,[[Math.round(zv[0][0])],[Math.round(zv[1][0])]]);
      v=[v[0][0],v[1][0]];P=_w17_clip(P,v,(v[0]*v[0]+v[1]*v[1])/2);}
    var sq=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]].map(function(q){var w=M.mul(Ri,[[q[0]],[q[1]]]);return [w[0][0],w[1][0]];});
    var hexa=P.map(function(q){var w=M.mul(R,[[q[0]],[q[1]]]);return [w[0][0],w[1][0]];});
    return {hexa:hexa,pr:_w17_pin(sq),pi:_w17_pin(P),Q:Q};}

  /* ---- 2 節の後: 波長のものさしで距離を測る ---- */
  REG.w17_phase=function(el,U){
    var S=U.S,LAM=_W17_LAM;
    U.head(el,"CARRIER PHASE","波長 19 cm のものさしで距離を測る: 端数は測れるが、周期の数は分からない");
    var r1=U.ctrls(el);
    var sv=U.slider(r1,"移動局の速さ（衛星から遠ざかる向きが正）",{min:-2,max:2,step:0.1,value:1,fmt:function(v){return _w17_s(v,1)+" m/s";},onInput:function(){draw();}});
    var ss=U.slider(r1,"擬似距離の誤差 σ（代表値 0.3 m）",{min:0.1,max:1.0,step:0.05,value:0.3,fmt:function(v){return _w17_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    /* 本当の距離: 受信機の所で、衛星から数えた周期の数が 113 650 652.37 になる距離から始める（図の e17_ambig と同じ） */
    var NT=113650652,R0=LAM*(NT+0.37),st;
    function reset(){st={t:0,s:0,k0:NT-4,hist:[],rng:U.rng(17)};push();}
    function ctrue(){return (R0+st.s)/LAM;}
    function phi(){return ctrue()-st.k0;}                         /* 受信機の搬送波位相 [周期]（数えた周期 + 端数） */
    function push(){var r=R0+st.s,rho=r+ss.get()*st.rng.normal(),ph=LAM*phi()+0.003*st.rng.normal();st.hist.push([st.t,r,rho,ph]);if(st.hist.length>400)st.hist.shift();}
    var bp=U.button(br,"再生",function(){if(tk.running()){tk.stop();bp.textContent="再生";}else{tk.start();bp.textContent="止める";}});
    U.button(br,"追尾を始め直す",function(){st.k0=Math.floor(ctrue());st.hist=[];push();draw();});
    U.button(br,"本文の例",function(){tk.stop();bp.textContent="再生";sv.set(1);ss.set(0.3);reset();draw();});
    var tk=U.ticker(function(){var dt=0.05;st.t+=dt;st.s+=sv.get()*dt;push();draw();},50);
    var box=U.svgbox(el),ro=U.readout(el);
    reset();
    function draw(){
      var nar=_w17_nar(box),W=nar?400:700,o=[],ph=phi(),k=Math.floor(ph),fr=ph-k,ct=ctrue();
      /* (a) ものさし */
      o.push(S.T(10,16,"(a) 受信機のまわりの目盛（受信機を真ん中に置いて描く）","start",nar?9.5:10.5,"ink",true));
      var cx=nar?250:380,sc=nar?34:52,ytk=64,half=nar?4.2:5.6,base=Math.floor(ct);
      o.push(S.L(cx-half*sc,ytk,cx+half*sc,ytk,"muted",1.2));
      for(var q=-6;q<=7;q++){var cn=base+q,x=cx+(cn-ct)*sc;if(x<cx-half*sc-1||x>cx+half*sc+1)continue;
        o.push(S.L(x,ytk-6,x,ytk+6,"ink",1.2));
        o.push(S.T(x,ytk+19,"…"+String(cn%1000).padStart(3,"0"),"middle",nar?8.5:9,"muted",false,true));
        o.push(S.T(x,ytk+34,String(cn-st.k0).replace("-","−"),"middle",nar?9:10,"purple",true));}
      o.push(S.L(cx,ytk-26,cx,ytk-4,"green",1.6));o.push(S.D(cx,ytk-27,"green",3.6));
      o.push(S.T(cx+7,ytk-24,"受信機","start",9.5,"green",true,false,null,true));
      if(!nar){o.push(S.T(10,ytk+19,"衛星から数えた番号","start",9,"muted"));o.push(S.T(10,ytk+34,"受信機が数えた番号","start",9.5,"purple",true));}
      o.push(S.ARR(cx-half*sc+40,ytk-38,cx-half*sc,ytk-38,"signal",1.2,6));o.push(S.T(cx-half*sc+46,ytk-34,"衛星の向き","start",9,"signal",true));
      /* (b) NCO の端数と数えた周期 */
      var yb=nar?132:126,dx=nar?60:70,dy=yb+58,R=36;
      o.push(S.T(10,yb,"(b) PLL が測るもの","start",nar?9.5:10.5,"ink",true));
      o.push(S.CIRC(dx,dy,R,"muted",1.3,"var(--screen)"));
      var a=2*Math.PI*fr;o.push(S.ARR(dx,dy,dx+(R-6)*Math.sin(a),dy-(R-6)*Math.cos(a),"gold",2.2,7));
      o.push(S.T(dx,dy-R-4,"0","middle",9,"muted"));o.push(S.T(dx,dy+R+14,"端数 "+_w17_f(fr,2),"middle",9.5,"gold",true));
      o.push(S.T(dx+R+16,dy-14,"数えた周期 "+String(k).replace("-","−"),"start",10,"purple",true));
      o.push(S.TX(dx+R+16,dy+4,"φ = "+_w17_f(ph,2)+" 周期","start",10,"ink",true));
      o.push(S.TX(dx+R+16,dy+22,"Φ = λφ = "+_w17_f(LAM*ph,3)+" m","start",10,"ink",true));
      /* (c) 距離の変化（最近の 10 s） */
      var h=st.hist,t1=Math.max(10,st.t),t0=t1-10,pts=h.filter(function(p){return p[0]>=t0-1e-9;});
      var p0=pts.length?pts[0]:h[h.length-1];
      var dv=pts.map(function(p){return [p[0],p[1]-p0[1],p[2]-p0[2],p[3]-p0[3]];}),lo=0,hi=0;
      dv.forEach(function(p){lo=Math.min(lo,p[1],p[2]);hi=Math.max(hi,p[1],p[2]);});lo-=0.6;hi+=0.6;
      var px=nar?60:330,py=nar?yb+130:yb+24,pw=nar?320:350,ph2=nar?120:120;
      o.push(S.T(nar?10:px-40,nar?yb+116:yb,"(c) 追尾の間の、距離の変化（最近の 10 s）","start",nar?9.5:10.5,"ink",true));
      var P=U.plot(px,py,pw,ph2,[t0,t1],[lo,hi]);
      o.push(P.axes({xl:"時間 t [s]",yl:"変化 [m]",sz:9}));
      o.push(P.line(dv.map(function(p){return [p[0],p[2]];}),"signal",1.1));
      o.push(P.line(dv.map(function(p){return [p[0],p[1]];}),"ink",3.4));
      o.push(P.line(dv.map(function(p){return [p[0],p[3]];}),"green",1.6));
      o.push(S.LEGL(nar?10:px-40,py+ph2+46,[["ink",null,"本当の距離"],["green",null,"Φ（重なる）"],["signal",null,"擬似距離"]],9,10));
      /* (d) 候補 */
      var yd=nar?py+ph2+80:yb+190,rho=h[h.length-1][2],r=R0+st.s,Phi=LAM*ph,sg=ss.get();
      o.push(S.T(10,yd,"(d) 擬似距離 ± 3σ の中に入る、19.03 cm ごとの候補（本当の距離からの差）","start",nar?9.5:10.5,"ink",true));
      var Q=U.plot(nar?30:60,yd+16,nar?340:600,40,[-3.2,3.2],[0,1]);
      o.push(S.RECT(Q.X(Math.max(-3.2,rho-r-3*sg)),Q.y,Q.X(Math.min(3.2,rho-r+3*sg))-Q.X(Math.max(-3.2,rho-r-3*sg)),Q.h,2,U.soft("signal"),"none",0));
      o.push(S.L(Q.X(rho-r),Q.y-2,Q.X(rho-r),Q.y+Q.h,"signal",1.6));
      var nin=0,Ntrue=Math.round(ph-ct);
      for(var n=-40;n<=40;n++){var v=n*LAM;if(v<-3.2||v>3.2)continue;var inn=Math.abs(v-(rho-r))<=3*sg;nin+=inn?1:0;
        var c=n===0?"green":(inn?"gold":"faint");o.push(S.L(Q.X(v),Q.y+Q.h-(n===0?24:16),Q.X(v),Q.y+Q.h,c,n===0?2.4:1.5));}
      o.push(S.L(Q.x,Q.y+Q.h,Q.x+Q.w,Q.y+Q.h,"muted",1.2));
      [-3,-2,-1,0,1,2,3].forEach(function(v){o.push(S.T(Q.X(v),Q.y+Q.h+13,String(v).replace("-","−")+" m","middle",9,"muted"));});
      box.set(S.svg(W,yd+80,o));
      ro.innerHTML="本当の距離 r = <b>"+_w17_g(r,3)+" m</b>（衛星から数えて "+_w17_g(ct,2)+" 周期。受信機は知らない）<br>"+
        "受信機の搬送波位相 φ = "+_w17_f(ph,2)+" 周期（数えた周期 "+k+" + 端数 "+_w17_f(fr,2)+"）、Φ = "+_w17_f(Phi,3)+" m<br>"+
        "整数値バイアス N = φ − r/λ = <b>"+_w17_g(Ntrue,0)+"</b> 周期（追尾を始め直すまで一定。受信機には分からない）<br>"+
        "擬似距離 ρ = "+_w17_g(rho,3)+" m。±3σ（±"+_w17_f(3*sg,2)+" m）の中の候補 <b>"+nin+" 個</b>";
    }
    draw();
  };

  /* ---- 3 節の後: 2 つの受信機と 2 つの衛星の、一重差と二重差 ---- */
  REG.w17_dd=function(el,U){
    var S=U.S,G=U.gnss,LAM=_W17_LAM,C=_W17_C;
    U.head(el,"DOUBLE DIFFERENCE","2 つの受信機と 2 つの衛星で差をとると、どの項が消えるか");
    var rx=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),con=G.constellation().filter(function(s){return s.sys==="GPS";});
    var B=G.TOKYO[0]*_W17_D,Lg=G.TOKYO[1]*_W17_D,east=[-Math.sin(Lg),Math.cos(Lg),0];
    function vis(t){var o=[];con.forEach(function(s){var ea=G.elaz(rx,G.ecef(s,t));if(ea[0]>5)o.push({nm:s.nm,s:s,el:ea[0],az:ea[1]});});o.sort(function(a,b){return b.el-a.el;});return o;}
    var r1=U.ctrls(el),tmin=0,vs=vis(0);
    var selI=U.select(r1,"基準の衛星 i",vs.map(function(v){return v.nm;}),0,function(){draw();});
    var selJ=U.select(r1,"衛星 j",vs.map(function(v){return v.nm;}),2,function(){draw();});
    var sT=U.slider(r1,"時刻（衛星が動く）",{min:0,max:60,step:1,value:0,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var sD=U.slider(r1,"基線長 d（移動局は東へ）",{min:0,max:30,step:0.1,value:1,fmt:function(v){return _w17_f(v,1)+" km";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var sBr=U.slider(r2,"基準局の時計のずれ",{min:-1,max:1,step:0.05,value:0.4,fmt:function(v){return _w17_s(v,2)+" ms";},onInput:function(){draw();}});
    var sBv=U.slider(r2,"移動局の時計のずれ",{min:-1,max:1,step:0.05,value:-0.25,fmt:function(v){return _w17_s(v,2)+" ms";},onInput:function(){draw();}});
    var sSi=U.slider(r2,"衛星 i の時計のずれ",{min:-100,max:100,step:5,value:25,fmt:function(v){return _w17_s(v,0)+" μs";},onInput:function(){draw();}});
    var sSj=U.slider(r2,"衛星 j の時計のずれ",{min:-100,max:100,step:5,value:-60,fmt:function(v){return _w17_s(v,0)+" μs";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var sI=U.slider(r3,"電離層の天頂の遅れ（基準局）",{min:0,max:15,step:0.5,value:4.06,fmt:function(v){return _w17_f(v,2)+" m";},onInput:function(){draw();}});
    var sG=U.slider(r3,"電離層の場所による増え方（東へ 1 km あたり）",{min:0,max:4,step:0.1,value:1,fmt:function(v){return _w17_f(v,1)+" mm";},onInput:function(){draw();}});
    var Ns={ri:31,vi:5,rj:-12,vj:44},seed=3;
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){selI.set(0);selJ.set(2);sT.set(0);sD.set(1);sBr.set(0.4);sBv.set(-0.25);sSi.set(25);sSj.set(-60);sI.set(4.06);sG.set(1);Ns={ri:31,vi:5,rj:-12,vj:44};draw();});
    U.button(br,"整数値バイアスを変える（乱数）",function(){var r=U.rng(++seed);Ns={ri:r.int(80)-40,vi:r.int(80)-40,rj:r.int(80)-40,vj:r.int(80)-40};draw();});
    var box=U.svgbox(el),ro=U.readout(el),geo=null,drag=false;
    U.ctl.drag(box,function(type,x,y){if(!geo)return false;
      if(type==="down"){if(Math.hypot(x-geo.xr,y-geo.yr)>22)return false;drag=true;return true;}
      if(type==="move"&&drag){var d=Math.max(0,Math.min(30,(x-geo.x0)/geo.sc));sD.set(Math.round(d*10)/10);draw();}
      if(type==="up")drag=false;});
    function mI(e){var s=6371*Math.cos(e*_W17_D)/(6371+350);return 1/Math.sqrt(1-s*s);}
    function mT(e){return 1.001/Math.sqrt(0.002001+Math.pow(Math.sin(e*_W17_D),2));}
    function terms(t){var sats=vis(t),ni=selI.get(),nj=selJ.get();
      /* 時刻 0 の並びの番号で選んだ衛星を、名前で探す（時刻を進めると並びが変わるので） */
      var nmI=vs[ni]?vs[ni].nm:vs[0].nm,nmJ=vs[nj]?vs[nj].nm:vs[1].nm,si=null,sj=null;
      con.forEach(function(s){if(s.nm===nmI)si=s;if(s.nm===nmJ)sj=s;});
      var d=sD.get()*1000,prov=[rx.r0[0]+d*east[0],rx.r0[1]+d*east[1],rx.r0[2]+d*east[2]],out={};
      [["i",si,sSi.get()*1e-6],["j",sj,sSj.get()*1e-6]].forEach(function(q){var ps=G.ecef(q[1],t),ea=G.elaz(rx,ps);
        [["ref",rx.r0,sBr.get()*1e-3,0],["rov",prov,sBv.get()*1e-3,d]].forEach(function(w){var rr=Math.hypot(ps[0]-w[1][0],ps[1]-w[1][1],ps[2]-w[1][2]);
          var I=(sI.get()+sG.get()*1e-3*w[3]/1000)*mI(ea[0]),Tt=2.41*mT(ea[0]),N=Ns[(w[0]==="ref"?"r":"v")+q[0]];
          out[w[0]+q[0]]={r:rr,b:C*w[2],s:-C*q[2],I:-I,T:Tt,N:LAM*N,n:N,el:ea[0],az:ea[1]};});});
      out.nmI=nmI;out.nmJ=nmJ;return out;}
    function draw(){
      var t=sT.get()*60,X=terms(t),nar=_w17_nar(box),W=nar?400:700,o=[];
      if(X.nmI===X.nmJ){ro.innerHTML='<span class="warn">衛星 i と j に違う衛星を選ぶ</span>';box.set(S.svg(W,40,[S.T(10,24,"衛星 i と j に違う衛星を選ぶ","start",11,"alias",true)]));return;}
      /* (a) 空と、地面の 2 つの受信機 */
      o.push(S.T(10,16,"(a) 東京の空の衛星 i・j と、2 つの受信機","start",nar?9.5:10.5,"ink",true));
      var cx=nar?80:84,cy=96,R=58,sats=vis(t).map(function(v){var hl=v.nm===X.nmI||v.nm===X.nmJ;return {el:v.el,az:v.az,name:hl?(v.nm===X.nmI?"i "+v.nm:"j "+v.nm):null,col:hl?"signal":"faint",hl:hl};});
      o.push(G.sky(U,cx,cy,R,sats,{sz:9,dot:3.4}));
      var x0=nar?200:200,x1=nar?380:400,gy=150,sc=(x1-x0-20)/30;
      o.push(S.L(x0-10,gy+6,x1,gy+6,"muted",1.2));
      [0,10,20,30].forEach(function(v){o.push(S.L(x0+v*sc,gy+6,x0+v*sc,gy+10,"muted",1));o.push(S.T(x0+v*sc,gy+22,v+" km","middle",9,"muted"));});
      var xr=x0+sD.get()*sc;geo={x0:x0,sc:sc,xr:xr,yr:gy-6};
      /* 東西と上下の面に映した視線の向き（移動局は東にいるので、この向きの成分が距離の差を決める） */
      [["i",X.refi],["j",X.refj]].forEach(function(q){var e=q[1].el*_W17_D,a=q[1].az*_W17_D,le=Math.cos(e)*Math.sin(a),lu=Math.sin(e),ln=Math.hypot(le,lu),dx=le/ln,dy=-lu/ln,Lx=80;
        [x0,xr].forEach(function(xx){o.push(S.L(xx,gy-8,xx+dx*Lx,gy-8+dy*Lx,"signal",1,"3 3"));});
        o.push(S.T(xr+dx*Lx+(dx<0?-4:4),gy-8+dy*Lx-2,q[0],(dx<0?"end":"start"),10,"signal",true,false,null,true));});
      o.push(S.CIRC(x0,gy-6,5,"purple",2,"var(--screen)"));o.push(S.T(x0,gy+36,"基準局","middle",9.5,"purple",true));
      o.push(S.D(xr,gy-6,"green",5.5));o.push(S.T(xr,gy-18,"移動局（ドラッグ）","middle",9.5,"green",true,false,null,true));
      /* (b) 表 */
      var keys=["r","b","s","I","T","N"],names=["距離 r","受信機の時計 b","衛星の時計 −cδt^s","電離層 −I","対流圏 T","整数値バイアス λN"];
      var sd={i:{},j:{}},dd={};keys.forEach(function(k){sd.i[k]=X.rovi[k]-X.refi[k];sd.j[k]=X.rovj[k]-X.refj[k];dd[k]=sd.j[k]-sd.i[k];});
      var yt=nar?236:200,cols,xs,vals;
      if(nar){cols=["一重差 i","一重差 j","二重差"];xs=[230,312,394];vals=function(k){return [sd.i[k],sd.j[k],dd[k]];};}
      else{cols=["基準局・i","移動局・i","基準局・j","移動局・j","一重差 i","一重差 j","二重差"];xs=[208,288,368,448,532,612,692];vals=function(k){return [X.refi[k],X.rovi[k],X.refj[k],X.rovj[k],sd.i[k],sd.j[k],dd[k]];};}
      o.push(S.T(10,yt-8,nar?"(b) 差をとった後の各項 [m]":"(b) 4 つの観測と、差をとった後の各項 [m]","start",nar?9.5:10.5,"ink",true));
      cols.forEach(function(c,k){o.push(S.T(xs[k],yt+10,c,"end",nar?8.5:9,(nar||k>=4)?"teal":"ink",true));});
      if(!nar)o.push(S.L(470,yt,470,yt+16+7*20,"line",1));
      function num(v){var a=Math.abs(v);return a>=1e4?_w17_g(v,3):_w17_f(v,3);}
      keys.forEach(function(k,r){var yy=yt+18+r*20;if(r%2===0)o.push(S.RECT(6,yy,W-12,20,0,U.soft("muted"),"none",0,null,' fill-opacity="0.5"'));
        o.push(S.TX(10,yy+14,names[r],"start",nar?8.5:9,"ink",true));
        vals(k).forEach(function(v,c){var isD=nar||c>=4,gone=isD&&Math.abs(v)<5e-4,small=isD&&!gone&&Math.abs(v)<0.01;
          var txt=gone?((k==="b"||k==="s")?"0（消える）":"0.000"):num(v);
          o.push(S.T(xs[c],yy+14,txt,"end",nar?8.5:9,gone?"green":(small?"teal":"ink"),gone||small,true));});});
      var yy=yt+18+6*20;o.push(S.L(6,yy+2,W-6,yy+2,"muted",1));
      o.push(S.T(10,yy+16,"合計（測った値）","start",nar?8.5:9,"ink",true));
      vals("r").forEach(function(_,c){var tot=0;keys.forEach(function(k){tot+=vals(k)[c];});o.push(S.T(xs[c],yy+16,num(tot),"end",nar?8.5:9,"ink",true,true));});
      box.set(S.svg(W,yy+28,o));
      var nN=Math.round(dd.N/LAM);
      ro.innerHTML="二重差 ∇ΔΦ<sub>ij</sub> = 距離の差 <b>"+_w17_f(dd.r,3)+" m</b> + 整数値バイアス <b>"+nN+" 周期</b>（"+_w17_f(dd.N,3)+" m） + 電離層の差 <b>"+_w17_f(dd.I*1000,1)+" mm</b>"+
        "（対流圏の差 "+_w17_f(dd.T*1000,1)+" mm）<br>時計の項は、一重差で衛星の分（"+_w17_f(X.refi.s/1000,3)+" km など）が、二重差で受信機の分（一重差に残った "+_w17_f(sd.i.b/1000,3)+" km）が、どの値でも <span class=\"ok\">0</span> になる。"+
        "<br>衛星 i = "+X.nmI+"（仰角 "+_w17_f(X.refi.el,1)+"°）、j = "+X.nmJ+"（仰角 "+_w17_f(X.refj.el,1)+"°）、基線長 "+_w17_f(sD.get(),1)+" km";
    }
    draw();
  };

  /* ---- 4 節の後: フロート解の散らばりと整数の格子、整数の最小二乗と比の検定 ---- */
  REG.w17_fix=function(el,U){
    var S=U.S,M=U.ctl.mat,LAM=_W17_LAM;
    U.head(el,"AMBIGUITY RESOLUTION","実数の解の散らばりと整数の格子（線路の上の例）: 雑音とエポックの数で、正しい整数に決まる割合が変わる");
    var r1=U.ctrls(el);
    var sR=U.slider(r1,"擬似距離の誤差 σ_ρ（1 つの観測）",{min:0.1,max:1.0,step:0.05,value:0.3,fmt:function(v){return _w17_f(v,2)+" m";},onInput:function(){run();}});
    var sP=U.slider(r1,"搬送波位相の誤差 σ_Φ",{min:1,max:10,step:0.5,value:3,fmt:function(v){return _w17_f(v,1)+" mm";},onInput:function(){run();}});
    var sK=U.slider(r1,"平均するエポックの数",{values:[1,2,3,5,10,20,30],value:1,fmt:function(v){return v+" エポック";},onInput:function(){run();}});
    var sTh=U.slider(r1,"比の検定のしきい値",{min:1,max:6,step:0.5,value:3,fmt:function(v){return _w17_f(v,1);},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var view=U.seg(r2,["元の整数値バイアス","組み替えた後（LAMBDA の考え方）"],0,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例",function(){sR.set(0.3);sP.set(3);sK.set(1);sTh.set(3);view.set(0);seed=1;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el),res=null;
    var ZM=[[1,1],[7,6]];
    function run(){
      var Qt=_w17_toyQ(U,sR.get(),sP.get()/1000,sK.get()),Qa=[[Qt[1][1],Qt[1][2]],[Qt[2][1],Qt[2][2]]],Lc=_w17_chol(Qt),pre=_w17_prep(U,Qa);
      var Qai=M.inv(Qa),qxa=[Qt[0][1],Qt[0][2]],gN=M.mul([qxa],Qai)[0];
      var rg=U.rng(seed),n=2000,smp=[];
      for(var k=0;k<n;k++){var w=[rg.normal(),rg.normal(),rg.normal()],v=[0,0,0];for(var i=0;i<3;i++)for(var j=0;j<=i;j++)v[i]+=Lc[i][j]*w[j];
        var a=[v[1],v[2]],r=_w17_ils(U,a,Qa,2,pre),z=r.F[0],ok=z[0]===0&&z[1]===0,ratio=r.s[0]>0?r.s[1]/r.s[0]:1e9;
        var efix=v[0]-(gN[0]*(a[0]-z[0])+gN[1]*(a[1]-z[1]));
        smp.push({e:v[0],a:a,z:z,ok:ok,ratio:ratio,efix:efix,rnd:Math.round(a[0])===0&&Math.round(a[1])===0});}
      res={Qt:Qt,Qa:Qa,smp:smp,R1:_w17_regions(U,Qa,null),R2:_w17_regions(U,Qa,ZM)};
      draw();}
    function draw(){
      if(!res)return;
      var nar=_w17_nar(box),W=nar?400:700,o=[],th=sTh.get(),z=view.get()===1,R=z?res.R2:res.R1,Qa=res.Qa;
      var nOK=0,nW=0,nN=0,nR=0;res.smp.forEach(function(s){var acc=s.ratio>=th;if(acc&&s.ok)nOK++;else if(acc)nW++;else nN++;if(s.rnd)nR++;});
      var n=res.smp.length;
      /* (a) 整数の格子と、実数の値 */
      var lim=2.5,ps=nar?300:290,P=U.plot(nar?56:56,30,ps,ps,[-lim,lim],[-lim,lim]);
      o.push(S.TX(10,16,z?"(a) 組み替えた後: z_1 = N_6 + N_{22}、z_2 = 7N_6 + 6N_{22}":"(a) 2 つの整数値バイアスの実数の値（誤差）","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","muted",1));
      o.push(P.axes({xl:z?"ẑ_1 − z_1 [周期]":"N̂_6 − N_6 [周期]",yl:z?"ẑ_2 − z_2 [周期]":"N̂_{22} − N_{22} [周期]",xt:[-2,-1,0,1,2],yt:[-2,-1,0,1,2],grid:false,sz:9}));
      var H=R.hexa.slice();[[[1,0],lim],[[-1,0],lim],[[0,1],lim],[[0,-1],lim]].forEach(function(q){H=_w17_clip(H,q[0],q[1]);});
      if(H.length>=3)o.push(S.PL(H.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"green",1.3,U.soft("green")));
      var sq=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5],[-0.5,-0.5]];o.push(S.PL(sq.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"signal",1.5,null,"5 3"));
      for(var i=-2;i<=2;i++)for(var j=-2;j<=2;j++)o.push(S.D(P.X(i),P.Y(j),(i||j)?"muted":"ink",(i||j)?1.8:2.4));
      res.smp.slice(0,300).forEach(function(s){var w=z?[ZM[0][0]*s.a[0]+ZM[0][1]*s.a[1],ZM[1][0]*s.a[0]+ZM[1][1]*s.a[1]]:s.a;
        if(Math.abs(w[0])>lim||Math.abs(w[1])>lim)return;var acc=s.ratio>=th;
        if(!acc)o.push(S.CIRC(P.X(w[0]),P.Y(w[1]),2.2,"muted",0.9));else o.push(S.D(P.X(w[0]),P.Y(w[1]),s.ok?"green":"alias",2.2));});
      /* (b) 位置 */
      var qx=nar?56:420,qy=nar?P.y+P.h+70:44,qw=nar?310:260;
      o.push(S.T(nar?10:qx-50,qy-14,"(b) 位置 e の誤差（フロート解とフィックス解）","start",nar?9.5:10.5,"ink",true));
      var Q=U.plot(qx,qy,qw,70,[-1.5,1.5],[0,3]);
      o.push(Q.axes({xl:"誤差 [m]",xt:[-1.5,-1,-0.5,0,0.5,1,1.5],yt:[],grid:false,sz:9}));
      o.push(S.T(Q.x-6,Q.Y(2.2)+4,"フロート","end",9,"gold",true));o.push(S.T(Q.x-6,Q.Y(0.9)+4,"フィックス","end",9,"ink",true));
      res.smp.slice(0,300).forEach(function(s,k){var yj=(k%9)/9*0.5;if(Math.abs(s.e)<1.5)o.push(S.D(Q.X(s.e),Q.Y(1.95+yj),"gold",1.6));
        var acc=s.ratio>=th;if(acc&&Math.abs(s.efix)<1.5)o.push(S.D(Q.X(s.efix),Q.Y(0.65+yj),s.ok?"green":"alias",1.8));});
      /* (c) 割合 */
      var cy=nar?qy+130:qy+128,cw=nar?300:240,cx=nar?70:430;
      o.push(S.T(nar?10:qx-50,cy-16,"(c) 正しい整数に決まる割合","start",nar?9.5:10.5,"ink",true));
      [["丸め（式）",R.pr,"signal"],["整数の最小二乗（式）",R.pi,"green"]].forEach(function(q,k){var yy=cy+k*26;
        o.push(S.T(cx-6,yy+12,q[0],"end",9,"ink",true));o.push(S.RECT(cx,yy,cw,16,2,"var(--screen)","line",1));
        o.push(S.RECT(cx,yy,cw*q[1],16,2,U.soft(q[2]),q[2],1));o.push(S.T(cx+cw*q[1]+4>cx+cw-40?cx+cw-4:cx+cw*q[1]+4,yy+12,_w17_f(100*q[1],1)+" %",cx+cw*q[1]+4>cx+cw-40?"end":"start",9.5,q[2],true));});
      var yy=cy+56,xg=cx;
      o.push(S.T(cx-6,yy+12,"比の検定（シミュレーション）","end",9,"ink",true));
      [[nOK/n,"green"],[nW/n,"alias"],[nN/n,"muted"]].forEach(function(q){if(q[0]>0)o.push(S.RECT(xg,yy,cw*q[0],16,0,U.soft(q[1]),q[1],1));xg+=cw*q[0];});
      o.push(S.T(cx,yy+30,"正 "+_w17_f(100*nOK/n,1)+" %・誤 "+_w17_f(100*nW/n,1)+" %・決めない "+_w17_f(100*nN/n,1)+" %","start",9,"ink"));
      if(!nar)o.push(S.LEGL(56,P.y+P.h+50,[["green",null,"正しい整数に決めた"],["alias",null,"誤った整数に決めた"],["muted",null,"比の検定で決めない（○）"]],9,10));
      box.set(S.svg(W,nar?cy+96:Math.max(P.y+P.h+60,yy+40),o));
      var Qz=res.R2.Q,sx=Math.sqrt(res.Qt[0][0]);
      ro.innerHTML="実数の値の標準偏差: N̂<sub>6</sub> "+_w17_f(Math.sqrt(Qa[0][0]),2)+" 周期・N̂<sub>22</sub> "+_w17_f(Math.sqrt(Qa[1][1]),2)+" 周期（相関係数 "+_w17_f(Qa[0][1]/Math.sqrt(Qa[0][0]*Qa[1][1]),4)+"）。"+
        "組み替えた後 "+_w17_f(Math.sqrt(Qz[0][0]),2)+"・"+_w17_f(Math.sqrt(Qz[1][1]),2)+" 周期<br>"+
        "正しい整数に決まる割合（範囲の中の確率の積分）: 丸め <b>"+_w17_f(100*res.R1.pr,1)+" %</b>、整数の最小二乗 <b>"+_w17_f(100*res.R1.pi,1)+" %</b>（組み替えた後の丸め "+_w17_f(100*res.R2.pr,1)+" %）。"+
        "シミュレーション "+n+" 回: 丸め "+_w17_f(100*nR/n,1)+" %<br>"+
        "比の検定（しきい値 "+_w17_f(th,1)+"）: <span class=\"ok\">正しく決めた "+_w17_f(100*nOK/n,1)+" %</span>・<span class=\"warn\">誤って決めた "+_w17_f(100*nW/n,1)+" %</span>・決めない "+_w17_f(100*nN/n,1)+" %"+
        "（決めた解の "+(nOK+nW?_w17_f(100*nW/(nOK+nW),1):"0")+" % が誤り）<br>位置 e の誤差の標準偏差: フロート解 "+_w17_f(sx,3)+" m";
    }
    run();
  };
