  /* ===== 07 章 フィードバック系の式 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w07_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w07_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w07_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s;
    if(a>=Math.pow(10,d))s=String(Math.round(v));else if(a<1e-4)s=v.toExponential(d-1);else s=(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* 極の文字（共役の組は ± でまとめる） */
  function _w07_poles(ps){var out=[],used=[];ps.forEach(function(p,i){if(used[i])return;
      if(Math.abs(p.im)>1e-9){for(var j=i+1;j<ps.length;j++)if(!used[j]&&Math.abs(ps[j].re-p.re)<1e-6*(1+Math.abs(p.re))&&Math.abs(ps[j].im+p.im)<1e-6*(1+Math.abs(p.im))){used[j]=true;break;}
        out.push(_w07_g(p.re,3)+" ± j"+_w07_g(Math.abs(p.im),3));}
      else out.push(_w07_g(p.re,3));used[i]=true;});
    return out.join("、");}
  /* TX で書いた文字の幅（S.TX と同じ分け方） */
  function _w07_txw(U,s,sz){s=String(s);var re=/\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-ɏ])_\{([^}]*)\}|([A-Za-zα-ωΑ-Ω])_([A-Za-z0-9∞%]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)/g,m,pos=0,w=0,ss=sz*0.72;
    while((m=re.exec(s))){if(m.index>pos)w+=U.tw(s.slice(pos,m.index),sz);
      if(m[1])w+=U.tw(m[2],sz);else if(m[3]!=null)w+=U.tw(m[3],sz)+U.tw(m[4],ss);else if(m[5]!=null)w+=U.tw(m[5],sz)+U.tw(m[6],ss);else w+=U.tw(m[7]!=null?m[7]:m[8],ss);
      pos=re.lastIndex;}
    if(pos<s.length)w+=U.tw(s.slice(pos),sz);return w;}
  /* ---- ブロック線図の部品（図 e07_* と同じ見た目） ---- */
  function _w07_frac(U,xc,yc,num,den,sz,c){var S=U.S,w=Math.max(_w07_txw(U,num,sz),_w07_txw(U,den,sz))+6;
    return S.TX(xc,yc-4,num,"middle",sz,c||"ink")+S.L(xc-w/2,yc,xc+w/2,yc,c||"ink",1)+S.TX(xc,yc+sz+1.5,den,"middle",sz,c||"ink");}
  function _w07_bw(U,s){if(Array.isArray(s))return Math.max(40,Math.max(_w07_txw(U,s[0],10.5),_w07_txw(U,s[1],10.5))+18);return Math.max(40,_w07_txw(U,s,11.5)+18);}
  function _w07_box(U,x,yc,s,w,hl,h){var S=U.S;w=w||_w07_bw(U,s);var c=hl?"signal":"line",f=hl?U.soft("signal"):"panel";
    if(Array.isArray(s)){h=h||44;return {svg:S.RECT(x,yc-h/2,w,h,6,f,c,1.4)+_w07_frac(U,x+w/2,yc-1,s[0],s[1],10.5),w:w};}
    h=h||34;return {svg:S.RECT(x,yc-h/2,w,h,6,f,c,1.4)+S.TX(x+w/2,yc+4.1,s,"middle",11.5,"ink"),w:w};}
  /* 横一列: ["a",長さ,文字,色] 矢印、["b",中身,名前,強調] 箱、["s",符号,名前] 加え合わせ点、["t",名前,色] 引き出し点 */
  function _w07_chain(U,x,yc,items){var S=U.S,R=15,o=[],pos={};
    items.forEach(function(it){var k=it[0];
      if(k==="a"){o.push(S.ARR(x,yc,x+it[1],yc,it[3],1.6));if(it[2])o.push(S.TX(x+it[1]/2,yc-8,it[2],"middle",10,it[3],true,true));x+=it[1];}
      else if(k==="b"){var b=_w07_box(U,x,yc,it[1],null,!!it[3]);o.push(b.svg);if(it[2])pos[it[2]]=[x,x+b.w];x+=b.w;}
      else if(k==="s"){o.push(S.SUMJ(x+R,yc,it[1]));pos[it[2]]=x+R;x+=2*R;}
      else if(k==="t"){o.push(S.D(x,yc,it[2]||"ink",3.6));pos[it[1]]=x;}});
    return {svg:o.join(""),pos:pos,x:x};}
  /* 戻る線: 引き出し点 xf から depth 下がって左へ、加え合わせ点 xt の下から入る。box があれば途中に箱 */
  function _w07_fb(U,xf,xt,yc,depth,c,box,hl,lab){var S=U.S,R=15,yb=yc+depth,o=[S.L(xf,yc,xf,yb,c,1.5)];
    if(box!=null){var w=_w07_bw(U,box),xm=(xf+xt)/2;o.push(S.ARR(xf,yb,xm+w/2,yb,c,1.5,6));o.push(_w07_box(U,xm-w/2,yb,box,w,hl,Array.isArray(box)?40:26).svg);o.push(S.L(xm-w/2,yb,xt,yb,c,1.5));}
    else o.push(S.L(xf,yb,xt,yb,c,1.5));
    o.push(S.ARR(xt,yb,xt,yc+R,c,1.5,6));
    if(lab)o.push(S.TX((xf+xt)/2,yb-6,lab,"middle",9.5,c,true,true));
    return o.join("");}
  /* 上から加え合わせ点に入る矢印（外乱など） */
  function _w07_top(U,x,yc,h,lab,c,hl){var S=U.S,R=15;return S.ARR(x,yc-h,x,yc-R,c,hl?2.4:1.6)+(lab?S.TX(x+8,yc-h+10,lab,"start",10,c,true,true):"");}
  /* 上を通る道: 引き出し点 xf から上がって右へ、加え合わせ点 xt の上から入る */
  function _w07_ff(U,xf,xt,yc,h,c,box,hl){var S=U.S,R=15,yt=yc-h,o=[S.L(xf,yc,xf,yt,c,1.5)];
    if(box!=null){var w=_w07_bw(U,box),xm=(xf+xt)/2;o.push(S.ARR(xf,yt,xm-w/2,yt,c,1.5,6));o.push(_w07_box(U,xm-w/2,yt,box,w,hl,Array.isArray(box)?40:26).svg);o.push(S.L(xm+w/2,yt,xt,yt,c,1.5));}
    else o.push(S.L(xf,yt,xt,yt,c,1.5));
    o.push(S.ARR(xt,yt,xt,yc-R,c,1.5,6));return o.join("");}
  /* s 平面の小さな図。poles・zeros・olp（開ループの極）は {re,im} の配列 */
  function _w07_splane(U,P,poles,olp,olz){var S=U.S,o=[S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)];
    o.push(U.ctl.splane(P));
    o.push(P.axes({xl:"実部 σ [1/s]",yl:"虚部 ω [rad/s]",xt:U.nice(P.xr[0],P.xr[1],4),yt:U.nice(P.yr[0],P.yr[1],4),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:36,sz:9}));
    o.push(U.ctl.splane(P,{rhp:false}));
    if(olp)o.push(U.ctl.pz(P,olp,olz||[],"muted",5));
    o.push(U.ctl.pz(P,poles,[],"signal",5.5));
    return o.join("");}
  /* 4 次のルンゲ・クッタ法で x' = f(t, x) を tEnd まで h 刻みで解き、rec 刻みごとに [t, x] を記録 */
  function _w07_ode(U,f,x0,tEnd,h,every){var n=Math.round(tEnd/h),x=x0.slice(),out=[[0,x.slice()]];
    for(var k=0;k<n;k++){x=U.ctl.rk4(f,k*h,x,h);if((k+1)%every===0)out.push([(k+1)*h,x.slice()]);}
    return out;}

  /* ---- 1 節: 線図を 1 段ずつまとめる ---- */
  function _w07_reduceEx(){
    var ex=[];
    /* ① 台車とばね・ダンパ */
    var U0=["a",34,"U(s)","gold"],YO=["a",56,"位置 Y(s)","signal"];
    ex.push({name:"① 台車とばね・ダンパ（積分の箱で描いた線図）",tEnd:6,yl:"位置 [m]",inLab:"1 N のステップ",
      steps:[
        {rule:"元の線図（2 章 2 節の m p̈ = u − c ṗ − k p を、積分の箱で描いたもの）",next:"青い 2 つの箱を直列でまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",20,null,"ink"],["s",{l:"+",b:"−"},"sb"],["a",20,null,"ink"],["b",["1","m"],"m",1],["a",40,"加速度","ink"],["b",["1","s"],"i1",1],["a",34,"速度","ink"],["t","tv","ink"],["a",26,null,"ink"],["b",["1","s"],"i2"],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tv","sb",48,"c","ink"],["tp","sa",84,"k","signal"]]},
        {rule:"直列結合: (1/m)(1/s) = 1/(ms)",next:"青い輪（ダンパの力 c ṗ を戻す負帰還）をまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",20,null,"ink"],["s",{l:"+",b:"−"},"sb"],["a",20,null,"ink"],["b",["1","ms"],"m",1],["a",34,"速度","ink"],["t","tv","ink"],["a",26,null,"ink"],["b",["1","s"],"i2"],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tv","sb",48,"c","signal",1],["tp","sa",84,"k","signal"]]},
        {rule:"フィードバック結合（負帰還、H = c）: (1/(ms)) ÷ (1 + c/(ms)) = 1/(ms + c)",next:"青い 2 つの箱を直列でまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",24,null,"ink"],["b",["1","ms + c"],"m",1],["a",34,"速度","ink"],["b",["1","s"],"i2",1],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tp","sa",50,"k","signal"]]},
        {rule:"直列結合: (1/(ms + c))(1/s) = 1/{s(ms + c)}",next:"青い輪（ばねの力 k p を戻す負帰還）をまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",24,null,"ink"],["b",["1","s(ms + c)"],"m"],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tp","sa",50,"k","signal",1]]},
        {rule:"フィードバック結合（負帰還、H = k）: 1/(ms² + cs + k)",next:null,
          items:[U0,["b",["1","ms^2 + cs + k"],"m",1],YO],fb:[]}],
      tf:function(){return {num:[1],den:[1,2,25]};},
      eq:function(){return "Y(s)/U(s) = 1/(ms² + cs + k)。例の値（m = 1 kg、c = 2 N·s/m、k = 25 N/m）で 1/(s² + 2s + 25) m/N（6 章 1 節の表と同じ）";},
      sim:function(U){return _w07_ode(U,function(t,x){return [x[1],1-2*x[1]-25*x[0]];},[0,0],6,0.002,30).map(function(r){return [r[0],r[1][0]];});}});
    /* ② DC モータ */
    var V0=["a",30,"V(s)","gold"],WO=["a",50,"Ω_m(s)","signal"];
    ex.push({name:"② DC モータ（L_a を含む。2 章 3 節）",tEnd:0.25,yl:"角速度 [rad/s]",inLab:"1 V のステップ",
      steps:[
        {rule:"元の線図（電圧 v と負荷トルク τ_L の 2 つの入力）",next:"重ね合わせ: τ_L = 0 として、電圧からの伝達関数を求める",
          items:[V0,["s",{l:"+",b:"−"},"sa"],["a",22,null,"ink"],["b",["1","L_a s + R_a"],"e"],["a",30,"I","teal"],["b","K_t","kt"],["a",30,null,"ink"],["s",{l:"+",t:"−"},"sb"],["a",22,null,"ink"],["b",["1","Js"],"j"],["a",40,null,"signal"],["t","tw","signal"],WO],
          fb:[["tw","sa",52,"K_t","signal"]],top:[["sb",44,"τ_L（負荷トルク）","purple",1]]},
        {rule:"重ね合わせ: τ_L = 0 とすると、τ_L の加え合わせ点は信号をそのまま通す",next:"青い 3 つの箱を直列でまとめる",
          items:[V0,["s",{l:"+",b:"−"},"sa"],["a",22,null,"ink"],["b",["1","L_a s + R_a"],"e",1],["a",30,"I","teal"],["b","K_t","kt",1],["a",30,null,"ink"],["b",["1","Js"],"j",1],["a",40,null,"signal"],["t","tw","signal"],WO],
          fb:[["tw","sa",52,"K_t","signal"]]},
        {rule:"直列結合: (1/(L_a s + R_a)) K_t (1/(Js)) = K_t/{Js(L_a s + R_a)}",next:"青い輪（逆起電力を戻す負帰還、H = K_t）をまとめる",
          items:[V0,["s",{l:"+",b:"−"},"sa"],["a",26,null,"ink"],["b",["K_t","Js(L_a s + R_a)"],"g"],["a",40,null,"signal"],["t","tw","signal"],WO],
          fb:[["tw","sa",50,"K_t","signal",1]]},
        {rule:"フィードバック結合（負帰還、H = K_t）",next:null,items:[V0,["b",["K_t","L_a Js^2 + R_a Js + K_t^2"],"g",1],WO],fb:[]}],
      tf:function(){return {num:[2e6],den:[1,2000,40000]};},
      eq:function(){return "Ω_m(s)/V(s) = K_t/(L_aJs² + R_aJs + K_t²) = 2×10⁶/(s² + 2000s + 40000)（例の値。6 章 1 節）。v = 0 として同じ手順で、Ω_m/T_L = −(L_as + R_a)/(L_aJs² + R_aJs + K_t²)（s = 0 で −5000 (rad/s)/(N·m)）";},
      sim:function(U){return _w07_ode(U,function(t,x){return [(1-2*x[0]-0.02*x[1])/1e-3,0.02*x[0]/1e-5];},[0,0],0.25,2.5e-5,200).map(function(r){return [r[0],r[1][1]];});}});
    /* ③ モータの位置の比例制御 */
    var R0=["a",30,"R(s)","muted"],TO=["a",40,"Θ_m(s)","signal"];
    ex.push({name:"③ モータの位置の比例制御（L_a を含む。6 章 4 節）",tEnd:0.6,yl:"角度 [rad]",inLab:"目標値 1 rad のステップ",kp:true,
      steps:[
        {rule:"元の線図（内側に逆起電力の輪、外側に角度を戻す輪）",next:"青い 3 つの箱を直列でまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",18,null,"alias"],["b","K_P","kp"],["a",22,"V","gold"],["s",{l:"+",b:"−"},"sa"],["a",14,null,"ink"],["b",["1","L_a s + R_a"],"e",1],["a",14,null,"teal"],["b","K_t","kt",1],["a",14,null,"ink"],["b",["1","Js"],"j",1],["a",26,null,"signal"],["t","tw","signal"],["a",16,null,"signal"],["b",["1","s"],"i"],["a",22,null,"signal"],["t","tt","signal"],TO],
          fb:[["tw","sa",50,"K_t","ink"],["tt","s0",86,null,"signal"]]},
        {rule:"直列結合: K_t/{Js(L_a s + R_a)}",next:"青い内側の輪（逆起電力、H = K_t）をまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",18,null,"alias"],["b","K_P","kp"],["a",22,"V","gold"],["s",{l:"+",b:"−"},"sa"],["a",18,null,"ink"],["b",["K_t","Js(L_a s + R_a)"],"g"],["a",26,null,"signal"],["t","tw","signal"],["a",16,null,"signal"],["b",["1","s"],"i"],["a",22,null,"signal"],["t","tt","signal"],TO],
          fb:[["tw","sa",50,"K_t","signal",1],["tt","s0",86,null,"signal"]]},
        {rule:"フィードバック結合（負帰還、H = K_t）: K_t/(L_aJs² + R_aJs + K_t²)",next:"青い 3 つの箱（K_P、モータ、積分）を直列でまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",18,null,"alias"],["b","K_P","kp",1],["a",22,"V","gold"],["b",["K_t","L_a Js^2 + R_a Js + K_t^2"],"g",1],["a",22,"Ω_m","signal"],["b",["1","s"],"i",1],["a",22,null,"signal"],["t","tt","signal"],TO],
          fb:[["tt","s0",56,null,"signal"]]},
        {rule:"直列結合: K_PK_t/{s(L_aJs² + R_aJs + K_t²)}（一巡伝達関数）",next:"青い外側の輪（角度を戻す負帰還、H = 1）をまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",22,null,"alias"],["b",["K_P K_t","s(L_a Js^2 + R_a Js + K_t^2)"],"g"],["a",26,null,"signal"],["t","tt","signal"],TO],
          fb:[["tt","s0",56,null,"signal",1]]},
        {rule:"フィードバック結合（負帰還、H = 1）",next:null,items:[R0,["b",["K_P K_t","L_a Js^3 + R_a Js^2 + K_t^2 s + K_P K_t"],"g",1],TO],fb:[]}],
      tf:function(kp){return {num:[2e6*kp],den:[1,2000,40000,2e6*kp]};},
      eq:function(kp){return "Θ_m(s)/R(s) = K_PK_t/(L_aJs³ + R_aJs² + K_t²s + K_PK_t)。L_aJ で割ると 2×10⁶K_P/(s³ + 2000s² + 40000s + 2×10⁶K_P)、K_P = "+kp+" V/rad で分母の定数項は "+_w07_g(2e6*kp,3);},
      sim:function(U,kp,tEnd){var h=2.5e-5,every=Math.max(1,Math.round(tEnd/240/h));return _w07_ode(U,function(t,x){var v=kp*(1-x[2]);return [(v-2*x[0]-0.02*x[1])/1e-3,0.02*x[0]/1e-5,x[1]];},[0,0,0],tEnd,h,every).map(function(r){return [r[0],r[1][2]];});}});
    /* ④ 1 章の台車（決めた力の道） */
    var Rr=["a",22,"R(s)","muted"],YY=["a",40,"Y(s)","signal"],PB=["b",["0.5","0.5s + 1"],"p"],Dt=["s3",40,"D(s)","purple"];
    ex.push({name:"④ 1 章の台車の速度（決めた力 u_0 = cr の道と坂）",tEnd:2,yl:"速度 [m/s]",inLab:"目標値 1 m/s、1 s に坂",kp2:true,
      steps:[
        {rule:"元の線図（1 章 4 節。u = cr + K_P(r − y)、坂の力 D）",next:"加え合わせ点を K_P の出力側へ移す（等価変換 ①）",
          items:[Rr,["t","tr","muted"],["a",40,null,"muted"],["s",{l:"+",b:"−"},"s1"],["a",22,null,"alias"],["b","K_P","kp",1],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s2"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],PB,["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,null,"signal"]],ff:[["tr","s2",60,"c","muted"]],top:[Dt]},
        {rule:"等価変換: 加え合わせ点を K_P の出力側へ移すと、戻る信号にも K_P が掛かる",next:"続けて並んだ 2 つの加え合わせ点の順を入れ替える",
          items:[Rr,["t","tr","muted"],["a",40,null,"muted"],["b","K_P","kp"],["a",22,null,"gold"],["s",{l:"+",b:"−"},"s1"],["a",22,null,"gold"],["s",{l:"+",t:"+"},"s2"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],PB,["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,"K_P","signal"]],ff:[["tr","s2",60,"c","muted"]],top:[Dt]},
        {rule:"加え合わせ点の入れ替え（足し引きの順は入れ替えてよい）",next:"R から出る 2 つの道（青い K_P と c）を並列でまとめる",
          items:[Rr,["t","tr","muted"],["a",40,null,"muted"],["b","K_P","kp",1],["a",22,null,"gold"],["s",{l:"+",t:"+"},"s2"],["a",22,null,"gold"],["s",{l:"+",b:"−"},"s1"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],PB,["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,"K_P","signal"]],ff:[["tr","s2",60,"c","muted",1]],top:[Dt]},
        {rule:"並列結合: K_P + c",next:"加え合わせ点を入れ替えて、青い輪（P を K_P で戻す負帰還）をまとめる",
          items:[Rr,["a",30,null,"muted"],["b","c + K_P","kp"],["a",30,null,"gold"],["s",{l:"+",b:"−"},"s1"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],["b",["0.5","0.5s + 1"],"p",1],["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,"K_P","signal",1]],top:[Dt]},
        {rule:"加え合わせ点の入れ替えと、フィードバック結合: P/(1 + K_P P)",next:null,
          items:[Rr,["a",30,null,"muted"],["b","c + K_P","kp"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],["b",["P(s)","1 + K_P P(s)"],"p",1],["a",40,null,"signal"],YY],
          fb:[],top:[Dt]}],
      tf:function(kp){var g=0.5*kp+1;return {num:[0.5*(2+kp)],den:[0.5,g],dnum:[0.5],dden:[0.5,g]};},
      eq:function(kp){var g=1+0.5*kp;return "Y = (c + K_P)P/(1 + K_PP)·R + P/(1 + K_PP)·D。K_P = "+kp+" N/(m/s) では s = 0 で R の係数 "+_w07_g(0.5*(2+kp)/g,4)+"、D の係数 "+_w07_g(0.5/g,3)+" (m/s)/N、坂（D = −0.513 N）の上で "+_w07_f(0.5*(2+kp)/g-0.5134*0.5/g,3)+" m/s";},
      sim:function(U,kp){return _w07_ode(U,function(t,x){var u=2+kp*(1-x[0]),d=t>=1?-0.51342:0;return [(0.5*(u+d)-x[0])/0.5];},[0],2,0.001,8).map(function(r){return [r[0],r[1][0]];});}});
    return ex;
  }
  REG.w07_reduce=function(el,U){
    var S=U.S,EX=_w07_reduceEx();
    U.head(el,"REDUCE","ブロック線図を 1 段ずつまとめる");
    var r1=U.ctrls(el);
    var sel=U.select(r1,"例",EX.map(function(e){return e.name;}),0,function(){st=0;draw();});
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>（③）",{values:[0.05,0.1,0.21,0.5,1,2,5,10,20,30,40,50],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var kp2=U.slider(r1,"比例ゲイン K<sub>P</sub>（④）",{values:[0,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var br=U.btnrow(el),st=0;
    U.button(br,"最初から",function(){st=0;draw();});
    U.button(br,"1 段戻る",function(){st=Math.max(0,st-1);draw();});
    U.button(br,"次へ",function(){st=Math.min(EX[sel.get()].steps.length-1,st+1);draw();});
    U.button(br,"最後まで",function(){st=EX[sel.get()].steps.length-1;draw();});
    U.button(br,"本文の例",function(){kp.set(0.21);kp2.set(8);st=0;draw();});
    var bd=U.svgbox(el,{scroll:true}),ro=U.readout(el),box=U.svgbox(el);
    function draw(){
      var e=EX[sel.get()],n=e.steps.length,sp=e.steps[st],o=[],yc=100;
      kp.el.style.display=e.kp?"":"none";kp2.el.style.display=e.kp2?"":"none";
      o.push(S.T(14,18,"段 "+(st+1)+" / "+n+"（青い部分を、次の段でまとめる）","start",11,"ink",true));
      var ch=_w07_chain(U,16,yc,sp.items);o.push(ch.svg);
      (sp.fb||[]).forEach(function(f){o.push(_w07_fb(U,ch.pos[f[0]],ch.pos[f[1]],yc,f[2],f[4],f[3],!!f[5]));});
      (sp.ff||[]).forEach(function(f){o.push(_w07_ff(U,ch.pos[f[0]],ch.pos[f[1]],yc,f[2],f[4],f[3],!!f[5]));});
      (sp.top||[]).forEach(function(f){o.push(_w07_top(U,ch.pos[f[0]],yc,f[1],f[2],f[3],!!f[4]));});
      var hgt=yc+Math.max(40,Math.max.apply(null,[30].concat((sp.fb||[]).map(function(f){return f[2]+24;}))));
      bd.set(S.svg(Math.max(700,ch.x+20),hgt,o));
      var K=e.kp?kp.get():kp2.get(),h="<b>段 "+(st+1)+"</b>: "+sp.rule+"<br>";
      if(sp.next)h+='次の段: '+sp.next+'（「次へ」を押す）';
      else h+='<span class="ok">まとまった。</span> '+e.eq(K);
      ro.innerHTML=h;
      /* 最後の段: 極と応答 */
      if(sp.next){box.set("");box.el.style.display="none";return;}
      box.el.style.display="";
      var tf=e.tf(K),G=U.ctl.tf(tf.num,tf.den),ps=U.ctl.poles(G),stable=ps.every(function(p){return p.re<0;});
      var tEnd=e.tEnd;if(e.kp&&K>=10)tEnd=0.2;
      var nar=_w07_nar(box),Wd=nar?400:700,q=[];
      /* s 平面: 支配的な極が見える範囲 */
      var near=ps.filter(function(p){return Math.abs(p.re)<200;}),far=ps.filter(function(p){return Math.abs(p.re)>=200;});
      var src=near.length?near:ps,mr=Math.max.apply(null,src.map(function(p){return Math.abs(p.re);}).concat([1])),mi=Math.max.apply(null,src.map(function(p){return Math.abs(p.im);}).concat([1]));
      var xr=[-Math.ceil(mr*1.3/5)*5,Math.max(5,Math.ceil(mr*0.3/5)*5)],yr=Math.max(5,Math.ceil(mi*1.3/5)*5);
      var A=nar?U.plot(56,22,300,150,xr,[-yr,yr]):U.plot(56,22,230,190,xr,[-yr,yr]);
      q.push(S.T(A.x,A.y-8,"まとめた伝達関数の極","start",10,"signal",true));
      q.push(_w07_splane(U,A,ps));
      if(far.length)q.push(S.T(A.x+4,A.y+A.h-6,"枠の外: "+_w07_poles(far),"start",9,"muted",false,false,null,true));
      var bx=nar?56:350,by=nar?A.y+A.h+60:22,bw=nar?320:330,bh=nar?150:190;
      var t0=[],y0=[];var R=U.ctl.lsim(G,function(){return 1;},tEnd,400);t0=R.t;y0=R.y;
      if(tf.dnum){var Gd=U.ctl.tf(tf.dnum,tf.dden),Rd=U.ctl.lsim(Gd,function(t){return t>=1?-0.51342:0;},tEnd,400);y0=y0.map(function(v,i){return v+Rd.y[i];});}
      var sim=e.sim(U,K,tEnd),all=y0.concat(sim.map(function(r){return r[1];})).filter(function(v){return isFinite(v);});
      var ymax=Math.max.apply(null,all),ymin=Math.min.apply(null,all.concat([0]));
      var lim=Math.max(Math.abs(ymax),1e-9),top=U.nice(0,lim*1.15,4),yt=top[top.length-1]<lim*1.1?lim*1.2:top[top.length-1];
      var B=U.plot(bx,by,bw,bh,[0,tEnd],[Math.min(0,ymin*1.1),yt]);
      q.push(S.T(B.x,B.y-8,"ステップ応答（"+e.inLab+"）","start",10,"signal",true));
      q.push(B.axes({xl:"時間 t [s]",yl:e.yl,xt:U.nice(0,tEnd,5),yt:U.nice(Math.min(0,ymin*1.1),yt,4),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
      q.push(B.clip(t0.map(function(t,i){return [t,y0[i]];}),"signal",2));
      sim.forEach(function(r,i){if(i%Math.max(1,Math.round(sim.length/24))===0&&r[1]>=B.yr[0]&&r[1]<=B.yr[1])q.push(S.CIRC(B.X(r[0]),B.Y(r[1]),2.8,"signal",1.3,"screen"));});
      q.push(S.LEGL(bx,B.y+B.h+48,[["signal",null,"線: まとめた伝達関数"]],9.5));
      q.push(S.CIRC(bx+(nar?150:170),B.y+B.h+44,2.8,"signal",1.3,"screen"));q.push(S.T(bx+(nar?158:178),B.y+B.h+48,"点: 元の線図のまま数値計算","start",9.5,"muted"));
      box.set(S.svg(Wd,B.y+B.h+58,q));
      ro.innerHTML=h+"<br>極: "+_w07_poles(ps)+(stable?'（<span class="ok">すべて左半平面</span>）':'（<span class="warn">左半平面に無い極がある: 不安定</span>）');
    }
    draw();
  };

  /* ---- 3 節: 型と定常偏差 ---- */
  var _w07_LOOPS=[
    {name:"型 0: 台車の速度・比例",P:[[0.5],[0.5,1]],I:false,kp:{values:[1,2,4,8,14,20,30,40],value:8,u:"N/(m/s)"},tEnd:1.5,yu:"m/s"},
    {name:"型 1: モータの位置・比例",P:[[50],[0.05,1,0]],I:false,kp:{values:[0.02,0.05,0.1,0.21,0.5,1,2],value:0.21,u:"V/rad"},tEnd:1.5,yu:"rad"},
    {name:"型 1: 台車の速度・比例 + 積分",P:[[0.5],[0.5,1]],I:true,kp:{values:[1,2,4,8,14,20,30,40],value:8,u:"N/(m/s)"},ki:{values:[2,5,10,16,25,40,60,100],value:25,u:"N/m"},tEnd:2,yu:"m/s"},
    {name:"型 2: モータの位置・比例 + 積分",P:[[50],[0.05,1,0]],I:true,kp:{values:[0.1,0.21,0.3,0.5,1],value:0.21,u:"V/rad"},ki:{values:[0.1,0.2,0.5,1,2,4,5],value:0.5,u:"V/(rad·s)"},tEnd:3,yu:"rad"}];
  REG.w07_type=function(el,U){
    var S=U.S,PO=U.ctl.poly;
    U.head(el,"TYPE","制御系の型と定常偏差 — 原点の極の数と、ステップ・ランプへの偏差");
    var r1=U.ctrls(el);
    var lp=U.select(r1,"ループ",_w07_LOOPS.map(function(l){return l.name;}),0,function(){setG();draw();});
    var inp=U.select(r1,"目標値",["単位ステップ（r = 1）","単位ランプ（r = t）","2 乗で増える（r = t²/2）"],0,draw);
    var r2=U.ctrls(el),kp=null,ki=null;
    function setG(){r2.innerHTML="";var L=_w07_LOOPS[lp.get()];
      kp=U.slider(r2,"比例ゲイン K<sub>P</sub>",{values:L.kp.values,value:L.kp.value,fmt:function(v){return v+" "+L.kp.u;},onInput:draw});
      ki=L.I?U.slider(r2,"積分の係数 K<sub>I</sub>",{values:L.ki.values,value:L.ki.value,fmt:function(v){return v+" "+L.ki.u;},onInput:draw}):null;}
    var br=U.btnrow(el);
    U.button(br,"本文の例（表の値）",function(){setG();draw();});
    U.button(br,"型 0 にランプ",function(){lp.set(0);inp.set(1);setG();draw();});
    U.button(br,"型 1 のモータにランプ",function(){lp.set(1);inp.set(1);setG();draw();});
    U.button(br,"型 2 を不安定にする（K<sub>I</sub> = 5）",function(){lp.set(3);inp.set(0);setG();ki.set(5);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    setG();
    function draw(){
      var L=_w07_LOOPS[lp.get()],K=kp.get(),KI=ki?ki.get():0,m=+inp.get();
      var Cn=L.I?[K,KI]:[K],Cd=L.I?[1,0]:[1],Ln=PO.mul(L.P[0],Cn),Ld=PO.mul(L.P[1],Cd);
      var olp=PO.roots(Ld),olz=Ln.length>1?PO.roots(Ln):[],den=PO.add(Ld,Ln),clp=PO.roots(den),stable=clp.every(function(p){return p.re<-1e-9;});
      var N=olp.filter(function(p){return Math.abs(p.re)<1e-9&&Math.abs(p.im)<1e-9;}).length;
      /* 偏差 e = r/(1 + PC): 単位ステップの応答を、入力の変換に合わせて 1/s を掛けた伝達関数で計算する（ランプ・2 乗でも厳密） */
      var en=Ld.slice(),ed=den.slice();for(var k=0;k<m;k++)ed=PO.mul(ed,[1,0]);
      var slow=Math.min.apply(null,clp.map(function(p){return Math.abs(p.re);}).filter(function(v){return v>1e-9;}).concat([50]));
      var tEnd=stable?Math.min(Math.max(L.tEnd,6/slow),20):L.tEnd;
      var R=U.ctl.step(U.ctl.tf(en,ed),tEnd,600),rf=function(t){return m===0?1:(m===1?t:t*t/2);};
      var ts=R.t,es=R.y,ys=ts.map(function(t,i){return rf(t)-es[i];});
      /* 式の値 */
      var lim0=PO.val(Ln,0)/PO.val(Ld,0);   /* N = 0 のとき */
      var Gz=function(k){var dn=Ld.slice();for(var j=0;j<k;j++){if(Math.abs(dn[dn.length-1])>1e-12)return Infinity;dn=dn.slice(0,dn.length-1);}return PO.val(Ln,0)/PO.val(dn,0);};
      var pred;
      if(N<m)pred=Infinity;else if(N===m){var g=Gz(m);pred=m===0?1/(1+g):1/g;}else pred=0;
      /* 描く */
      var nar=_w07_nar(box),Wd=nar?400:700,o=[];
      var mr=Math.max.apply(null,olp.concat(clp).concat(olz).map(function(p){return Math.abs(p.re);}).concat([2])),mi=Math.max.apply(null,clp.concat(olp).map(function(p){return Math.abs(p.im);}).concat([2]));
      var xr=[-Math.ceil(mr*1.15/5)*5,Math.max(5,Math.ceil(mr*0.25/5)*5)],yy=Math.ceil(mi*1.3/5)*5;
      var A=nar?U.plot(56,26,300,140,xr,[-yy,yy]):U.plot(56,26,220,200,xr,[-yy,yy]);
      o.push(S.T(A.x,A.y-10,"灰: 一巡伝達関数の極・零点、青: 閉ループの極","start",9.5,"ink",true));
      o.push(_w07_splane(U,A,clp,olp,olz));
      o.push(S.T(A.X(0)-6,A.y+12,"原点に "+N+" 個 → 型 "+N,"end",9.5,"signal",true,false,null,true));
      var bx=nar?56:340,by=nar?A.y+A.h+60:26,bw=nar?320:340;
      var yv=ys.concat(ts.map(rf)).filter(function(v){return isFinite(v);}),ymx=Math.max.apply(null,yv),ymn=Math.min.apply(null,yv.concat([0]));
      ymx=Math.min(ymx,rf(tEnd)*1.8+0.2);ymn=Math.max(ymn,-ymx);
      var B=U.plot(bx,by,bw,nar?110:120,[0,tEnd],[ymn,ymx*1.08]);
      o.push(B.axes({yl:"制御量 ["+L.yu+"]",xt:U.nice(0,tEnd,5),yt:U.nice(ymn,ymx*1.08,3),xfmt:function(){return "";},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
      o.push(B.line(ts.map(function(t){return [t,rf(t)];}),"muted",1.3,"5 3"));
      o.push(B.clip(ts.map(function(t,i){return [t,ys[i]];}),"signal",2));
      var ev=es.filter(function(v){return isFinite(v);}),emx=Math.max.apply(null,ev.concat([0])),emn=Math.min.apply(null,ev.concat([0]));
      if(isFinite(pred)){emx=Math.max(emx,pred);emn=Math.min(emn,pred);}
      var span=Math.max(emx-emn,1e-3),C=U.plot(bx,B.y+B.h+16,bw,nar?80:84,[0,tEnd],[emn-span*0.1,emx+span*0.15]);
      o.push(C.axes({xl:"時間 t [s]",yl:"偏差 e",xt:U.nice(0,tEnd,5),yt:U.nice(emn-span*0.1,emx+span*0.15,3),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
      if(isFinite(pred)&&stable)o.push(C.line([[0,pred],[tEnd,pred]],"green",1.3,"5 3"));
      o.push(C.clip(ts.map(function(t,i){return [t,es[i]];}),"alias",2));
      o.push(S.T(bx,C.y+C.h+46,"破線: 目標値（上）、表の式の定常偏差（下）","start",9.5,"muted"));
      box.set(S.svg(Wd,C.y+C.h+54,o));
      /* 読み出し */
      var nm=["定常位置偏差","定常速度偏差","2 乗で増える目標値への定常偏差"][m],h="";
      h+="一巡伝達関数 P(s)C(s) の原点の極: <b>"+N+" 個</b> → <b>型 "+N+"</b>。閉ループの極: "+_w07_poles(clp)+(stable?'（<span class="ok">安定</span>）':'（<span class="warn">不安定</span>）')+"<br>";
      if(!stable)h+='<span class="warn">閉ループが不安定なので、最終値の定理は使えない（偏差は落ち着かない）。</span>';
      else{
        var lab=m===0?"1/(1 + lim<sub>s→0</sub> P(s)C(s))":(m===1?"1/lim<sub>s→0</sub> sP(s)C(s)":"1/lim<sub>s→0</sub> s²P(s)C(s)");
        if(!isFinite(pred))h+=nm+": 型 "+N+" では<b>増え続ける</b>（sE(s) の分母に s = 0 の根が残る）。"+_w07_f(tEnd,2)+" s で偏差 "+_w07_g(es[es.length-1],3)+" "+L.yu;
        else h+=nm+": 式 "+(N>m?"0（型が "+m+" より大きい）":lab+" = <b>"+_w07_g(pred,3)+" "+L.yu+"</b>")+"、数値計算（"+_w07_f(tEnd,2)+" s）"+_w07_g(es[es.length-1],3)+" "+L.yu;
      }
      if(m===0&&stable){var mx=Math.max.apply(null,ys);if(mx>1.001)h+="<br>行き過ぎ量 "+_w07_f((mx-1)*100,1)+" %";}
      ro.innerHTML=h+'<div class="wnote">偏差 e(t) は、1/(1 + P(s)C(s)) に目標値の変換（1/s・1/s²・1/s³）を掛けたものを逆変換して求めた（入力を区切らない厳密な計算）。例の値: 台車 P = 0.5/(0.5s + 1)、モータ P = 50/{s(0.05s + 1)}。</div>';
    }
    draw();
  };

  /* ---- 4 節: 外乱の入る場所と積分 ---- */
  REG.w07_dist=function(el,U){
    var S=U.S,PO=U.ctl.poly;
    U.head(el,"DISTURBANCE","外乱の入る場所と、制御器の積分");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["台車の速度（型 0）","モータの位置（型 1、積分は対象の中）"],0,draw);
    var pc=U.select(r1,"外乱の入る場所",["操作量に入る（坂の力・負荷トルク）","制御量に入る（動く歩道・継ぎ手の滑り）"],0,draw);
    var ig=U.checkbox(r1,"制御器に積分を足す",false,draw);
    var r2=U.ctrls(el);
    var sz=U.slider(r2,"外乱の大きさ",{values:[0.25,0.5,1,1.5,2],value:1,fmt:function(v){return "本文の例の "+v+" 倍";},onInput:draw});
    var kpc=U.slider(r2,"K<sub>P</sub>（台車）",{values:[1,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var kpm=U.slider(r2,"K<sub>P</sub>（モータ）",{values:[0.05,0.1,0.21,0.5,1],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var kic=U.slider(r2,"K<sub>I</sub>（台車）",{values:[5,10,16,25,40,60],value:25,fmt:function(v){return v+" N/m";},onInput:draw});
    var kim=U.slider(r2,"K<sub>I</sub>（モータ）",{values:[0.1,0.2,0.5,1,2],value:0.5,fmt:function(v){return v+" V/(rad·s)";},onInput:draw});
    var br=U.btnrow(el);
    function set(p,c,i){pl.set(p);pc.set(c);ig.set(i);sz.set(1);kpc.set(8);kpm.set(0.21);kic.set(25);kim.set(0.5);draw();}
    U.button(br,"本文の例（台車と坂）",function(){set(0,0,false);});
    U.button(br,"モータに負荷トルク",function(){set(1,0,false);});
    U.button(br,"モータの継ぎ手が滑る",function(){set(1,1,false);});
    U.button(br,"負荷トルクに積分",function(){set(1,0,true);});
    var bd=U.svgbox(el,{scroll:true}),box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var cart=pl.get()===0,inU=pc.get()===0,I=ig.get(),k=sz.get();
      kpc.el.style.display=cart?"":"none";kpm.el.style.display=cart?"none":"";kic.el.style.display=cart&&I?"":"none";kim.el.style.display=!cart&&I?"":"none";
      var Pn=cart?[0.5]:[50],Pd=cart?[0.5,1]:[0.05,1,0],K=cart?kpc.get():kpm.get(),KI=cart?kic.get():kim.get();
      var Cn=I?[K,KI]:[K],Cd=I?[1,0]:[1];
      var d=cart?(inU?-0.51342*k:0.2*k):(inU?-1*k:0.5*k);
      var den=PO.add(PO.mul(Pd,Cd),PO.mul(Pn,Cn)),num=inU?PO.mul(Pn,Cd):PO.mul(Pd,Cd),clp=PO.roots(den),stable=clp.every(function(p){return p.re<-1e-9;});
      /* 線図 */
      var o=[],yc=96,signs={l:"+",t:"+"};
      var ch=_w07_chain(U,16,yc,[["a",56,"目標値 R","muted"],["s",{l:"+",b:"−"},"s1"],["a",40,null,"alias"],["b",I?(cart?["K_P s + K_I","s"]:["K_P s + K_I","s"]):"K_P","c",I],["a",54,"U","gold"],["s",signs,"s2"],["a",30,null,"ink"],["b",cart?["0.5","0.5s + 1"]:["50","s(0.05s + 1)"],"p"],["a",50,null,"ink"],["s",signs,"s3"],["a",56,null,"signal"],["t","bp","signal"],["a",50,"Y","signal"]]);
      o.push(ch.svg);
      o.push(_w07_top(U,ch.pos.s2,yc,52,inU?(cart?"坂の力":"負荷トルク（電圧に換算）"):null,inU?"purple":"faint",inU));
      o.push(_w07_top(U,ch.pos.s3,yc,52,!inU?(cart?"動く歩道の速さ":"継ぎ手の滑り"):null,!inU?"purple":"faint",!inU));
      o.push(_w07_fb(U,ch.pos.bp,ch.pos.s1,yc,46,"signal"));
      o.push(S.T(14,18,"外乱の入る点（紫）と、制御器（"+(I?"比例 + 積分":"比例だけ")+"）","start",10.5,"ink",true));
      bd.set(S.svg(700,yc+60,o));
      /* 応答（目標値 0、時刻 0.2 s に外乱のステップ） */
      var t0=0.2,tEnd=cart?1.6:2.5;if(stable){var sl=Math.min.apply(null,clp.map(function(p){return Math.abs(p.re);}));tEnd=Math.min(Math.max(tEnd,t0+6/sl),12);}
      var G=U.ctl.tf(num,den),Rr=U.ctl.lsim(G,function(t){return t>=t0?1:0;},tEnd,800),ts=Rr.t,ys=Rr.y.map(function(v){return v*d;});
      var hh=ts[1]-ts[0],ip=[0],pp=[];for(var i=0;i<ts.length;i++){pp.push(-K*ys[i]);if(i>0)ip.push(ip[i-1]-KI*(ys[i]+ys[i-1])/2*hh);}
      if(!I)ip=ip.map(function(){return 0;});
      var us=pp.map(function(v,i){return v+ip[i];});
      var nar=_w07_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,q=[];
      var yl=ys.filter(function(v){return isFinite(v);}),ymx=Math.max.apply(null,yl.concat([0])),ymn=Math.min.apply(null,yl.concat([0])),spn=Math.max(ymx-ymn,1e-3);
      var A=U.plot(x0,16,pw,130,[0,tEnd],[ymn-spn*0.1,ymx+spn*0.15]);
      q.push(S.RECT(A.X(t0),A.y,A.X(tEnd)-A.X(t0),A.h,0,U.soft("purple"),"none",0));
      q.push(A.axes({yl:"制御量のずれ ["+(cart?"m/s":"rad")+"]",xt:U.nice(0,tEnd,6),yt:U.nice(ymn-spn*0.1,ymx+spn*0.15,4),xfmt:function(){return "";},yfmt:function(v){return _w07_g(v,3);},ylOff:nar?38:42,sz:9}));
      q.push(A.line([[0,0],[tEnd,0]],"muted",1,"4 3"));
      q.push(A.clip(ts.map(function(t,i){return [t,ys[i]];}),"signal",2.2));
      /* 式の値: s → 0 の G(0)·d */
      var pred=null;if(stable){var nz=num.slice(),dz=den.slice();while(nz.length&&dz.length&&Math.abs(nz[nz.length-1])<1e-12&&Math.abs(dz[dz.length-1])<1e-12){nz.pop();dz.pop();}pred=(Math.abs(PO.val(dz,0))<1e-12?Infinity:PO.val(nz,0)/PO.val(dz,0))*d;}
      if(pred!=null&&isFinite(pred))q.push(A.line([[t0,pred],[tEnd,pred]],"green",1.3,"5 3"));
      var ul=us.concat(pp).concat(ip).concat(inU?[-d]:[]).filter(function(v){return isFinite(v);}),umx=Math.max.apply(null,ul.concat([0])),umn=Math.min.apply(null,ul.concat([0])),usp=Math.max(umx-umn,1e-3);
      var B=U.plot(x0,A.y+A.h+18,pw,110,[0,tEnd],[umn-usp*0.1,umx+usp*0.15]);
      q.push(S.RECT(B.X(t0),B.y,B.X(tEnd)-B.X(t0),B.h,0,U.soft("purple"),"none",0));
      q.push(B.axes({xl:"時間 t [s]",yl:"操作量の変化 ["+(cart?"N":"V")+"]",xt:U.nice(0,tEnd,6),yt:U.nice(umn-usp*0.1,umx+usp*0.15,4),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:nar?38:42,sz:9}));
      q.push(B.line([[0,0],[tEnd,0]],"muted",1,"4 3"));
      if(inU)q.push(B.clip([[t0,-d],[tEnd,-d]],"purple",1.2,"3 3"));
      if(I){q.push(B.clip(ts.map(function(t,i){return [t,pp[i]];}),"gold",1.6));q.push(B.clip(ts.map(function(t,i){return [t,ip[i]];}),"green",1.8));}
      q.push(B.clip(ts.map(function(t,i){return [t,us[i]];}),"ink",1.6));
      var leg=[["signal",null,"制御量のずれ"],["green","5 3","式の値"],["ink",null,"操作量"]];if(I){leg.push(["gold",null,"比例の分"]);leg.push(["green",null,"積分の分"]);}if(inU)leg.push(["purple","3 3","外乱を打ち消す値"]);
      if(nar){q.push(S.LEGL(x0,B.y+B.h+46,leg.slice(0,3),9,10));q.push(S.LEGL(x0,B.y+B.h+62,leg.slice(3),9,10));}
      else q.push(S.LEGL(x0,B.y+B.h+48,leg,9.5,12));
      box.set(S.svg(Wd,B.y+B.h+(nar?70:58),q));
      /* 読み出し */
      var uu=cart?"m/s":"rad",dl=cart?(inU?"坂の力 "+_w07_f(d,3)+" N（"+_w07_f(3*k,2)+"° の上り坂）":"歩道の速さ +"+_w07_f(d,2)+" m/s"):(inU?"負荷トルク "+_w07_f(0.01*k,3)+" N·m（電圧に換算して "+_w07_f(d,2)+" V）":"継ぎ手の滑り +"+_w07_f(d,2)+" rad");
      var hs="外乱: "+dl+"。外乱から制御量までの伝達関数: "+(inU?"P/(1 + PC)":"1/(1 + PC)")+"<br>";
      hs+="閉ループの極: "+_w07_poles(clp)+(stable?'（<span class="ok">安定</span>）':'（<span class="warn">不安定</span>）')+"<br>";
      if(stable){var fe=ys[ys.length-1];
        hs+="落ち着いたずれ: 式 lim<sub>s→0</sub>（伝達関数）× 外乱 = <b>"+_w07_g(pred,3)+" "+uu+"</b>、数値計算（"+_w07_f(tEnd,2)+" s）"+_w07_g(fe,3)+" "+uu;
        if(Math.abs(pred)<1e-9)hs+=' <span class="ok">（ずれは消える）</span>';
        if(inU&&I)hs+="<br>積分の分が、外乱を打ち消す値 "+_w07_g(-d,3)+" "+(cart?"N":"V")+" に近づき（"+_w07_f(tEnd,2)+" s で "+_w07_g(ip[ip.length-1],3)+"）、偏差 0 のまま外乱を支える";
        else if(inU&&cart)hs+="<br>力の釣り合い: 押す力の増え K<sub>P</sub>e と、遅くなった分の抵抗の減り ce の和が、坂の力と釣り合う。(K<sub>P</sub> + c)e = "+_w07_g(-d,3)+" N なので e = "+_w07_g(-d/(K+2),3)+" m/s（1 章 4 節）";
        else if(inU)hs+="<br>止まった軸で負荷を支えるには電圧が "+_w07_g(-d,3)+" V 要り、それを比例の分 K<sub>P</sub>e で作るので、偏差 e = "+_w07_g(-d,3)+" ÷ "+K+" = "+_w07_g(-d/K,3)+" rad が残る（4 章 6 節）";
      } else hs+='<span class="warn">閉ループが不安定なので、ずれは落ち着かない（最終値の定理は使えない）。</span>';
      ro.innerHTML=hs+'<div class="wnote">目標値は 0 のまま、0.2 s（紫の帯の始まり）にステップの外乱を入れた。縦軸は、外乱が無いときからのずれ。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 5・6 節: ばらつく対象・坂・観測ノイズ ---- */
  REG.w07_sens=function(el,U){
    var S=U.S;
    U.head(el,"SENSITIVITY","ばらつく対象の応答の束（開ループと閉ループ）と、坂・観測ノイズ");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0,1,2,4,8,14,20,30,40],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var rg=U.slider(r1,"ばらつきの幅（K と T）",{values:[0,10,20,30,40,50,60],value:50,fmt:function(v){return "± "+v+" %";},onInput:draw});
    var r2=U.ctrls(el);
    var ig=U.checkbox(r2,"積分を足す（K<sub>I</sub> = 25 N/m）",false,draw);
    var sl=U.checkbox(r2,"1.5 s から上り坂 3°",false,draw);
    var nz=U.checkbox(r2,"観測ノイズ（標準偏差 0.02 m/s）",false,draw);
    var br=U.btnrow(el),seed=1;
    function set(k,r,i,s,n){kp.set(k);rg.set(r);ig.set(i);sl.set(s);nz.set(n);draw();}
    U.button(br,"本文の例（K<sub>P</sub> = 8、±50 %）",function(){set(8,50,false,false,false);});
    U.button(br,"坂とノイズ（K<sub>P</sub> = 8）",function(){set(8,50,false,true,true);});
    U.button(br,"坂とノイズ（K<sub>P</sub> = 30）",function(){set(30,50,false,true,true);});
    U.button(br,"積分を足す",function(){set(8,50,true,true,false);});
    var sb=U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 台車の一次遅れ T y' + y = K(u + d) を h 刻みで厳密に進める（刻みの間は u 一定）。u = c r + K_P(r − 測った値) + 積分 */
    function sim(K,T,Kp,I,slope,noise,closed,rnd){
      var h=2e-4,tEnd=3,n=Math.round(tEnd/h),y=0,ii=0,nzv=0,a=Math.exp(-h/T),out={t:[],y:[],u:[]};
      for(var k=0;k<=n;k++){var t=k*h;
        if(noise&&closed&&k%50===0)nzv=0.02*rnd.normal();
        var ym=y+(noise&&closed?nzv:0),e=1-ym,u=2+(closed?Kp*e+ii:0),d=slope&&t>=1.5?-0.51342:0;
        if(k%10===0){out.t.push(t);out.y.push(y);out.u.push(u);}
        if(closed&&I)ii+=25*e*h;
        var yi=K*(u+d);y=yi+(y-yi)*a;}
      return out;}
    function draw(){
      var Kp=kp.get(),r=rg.get()/100,I=ig.get(),slope=sl.get(),noise=nz.get();
      sb.style.display=noise?"":"none";
      var fs=[1-r,1,1+r],nar=_w07_nar(box),Wd=nar?400:700,o=[],res=[[],[]];
      var cols=["teal","signal","gold"],dashes=["2 3",null,"7 3"];
      for(var j=0;j<2;j++){
        var x=nar?52:62+j*330,y0=nar?24+j*200:24,P=U.plot(x,y0,nar?330:270,nar?150:190,[0,3],[0,1.8]);
        o.push(S.TX(x-40,y0-8,j===0?"(a) 開ループ（u = cr = 2 N で押すだけ）":"(b) 閉ループ（u = cr + K_P(r − y)"+(I?" + 積分":"")+"）","start",10,"ink",true));
        if(slope)o.push(S.RECT(P.X(1.5),P.y,P.X(3)-P.X(1.5),P.h,0,U.soft("purple"),"none",0));
        o.push(P.axes({xl:(nar&&j===0)?null:"時間 t [s]",yl:(nar||j===0)?"速度 y [m/s]":null,xt:[0,0.5,1,1.5,2,2.5,3],yt:[0,0.5,1,1.5],xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
        o.push(P.line([[0,1],[3,1]],"muted",1.1,"4 3"));
        for(var a=0;a<3;a++)for(var b=0;b<3;b++){
          var rnd=U.rng(seed),R=sim(0.5*fs[a],0.5*fs[b],Kp,I,slope,noise,j===1,rnd);
          res[j].push({K:0.5*fs[a],T:0.5*fs[b],R:R});
          var nom=a===1&&b===1;
          if(!nom||!noise||j===0)o.push(P.clip(R.t.map(function(t,i){return [t,R.y[i]];}),cols[a],nom?2.3:1.4,dashes[b]));}
        if(noise&&j===1){var Rn=res[1][4].R;o.push(P.clip(Rn.t.map(function(t,i){return [t,Rn.y[i]];}),"signal",1.4));}
        /* 坂が無いときに落ち着く値（最終値の定理: 開ループ 2K、閉ループ K(2 + K_P)/(1 + KK_P)、積分ありは 1） */
        var fin=res[j].map(function(q){return j===0?2*q.K:(I?1:q.K*(2+Kp)/(1+q.K*Kp));}),lo=Math.min.apply(null,fin),hi=Math.max.apply(null,fin);
        var bx=P.x+P.w+8;o.push(S.RECT(bx,P.Y(hi),8,Math.max(1,P.Y(lo)-P.Y(hi)),2,U.soft(j===0?"alias":"green"),j===0?"alias":"green",1.2));
        res[j].lo=lo;res[j].hi=hi;}
      if(!nar){o.push(S.LEGL(62,256,[["teal",null,"K × "+_w07_g(fs[0],2)],["signal",null,"× 1（例の値）"],["gold",null,"× "+_w07_g(fs[2],2)]],9.5,12));
        o.push(S.LEGL(392,256,[["muted","2 3","T × "+_w07_g(fs[0],2)],["muted",null,"× 1"],["muted","7 3","× "+_w07_g(fs[2],2)]],9.5,12));}
      else{o.push(S.LEGL(52,446,[["teal",null,"K × "+_w07_g(fs[0],2)],["signal",null,"× 1"],["gold",null,"× "+_w07_g(fs[2],2)]],9.5,10));
        o.push(S.LEGL(52,462,[["muted","2 3","T × "+_w07_g(fs[0],2)],["muted",null,"× 1"],["muted","7 3","× "+_w07_g(fs[2],2)]],9.5,10));}
      box.set(S.svg(Wd,nar?472:266,o));
      /* 読み出し */
      var g=1+0.5*Kp,h="";
      h+="坂が無いときに落ち着く速度の幅（最終値の定理）: 開ループ <b>"+_w07_f(res[0].lo,3)+"〜"+_w07_f(res[0].hi,3)+" m/s</b>、閉ループ <b>"+_w07_f(res[1].lo,3)+"〜"+_w07_f(res[1].hi,3)+" m/s</b><br>";
      if(!I){var Kl=0.5*(1-r),Kh=0.5*(1+r);
        h+="5 節の式 δS'(0) = δ ÷ (1 + K'K<sub>P</sub>): 定常ゲインが "+_w07_f(-r*100,0)+" % なら "+_w07_f(-r/(1+Kl*Kp)*100,1)+" %、+"+_w07_f(r*100,0)+" % なら +"+_w07_f(r/(1+Kh*Kp)*100,1)+" %（例の値の対象の S(0) = 1/(1 + KK<sub>P</sub>) = "+_w07_g(1/g,3)+"）<br>";}
      else h+='<span class="ok">積分を足すと型 1 になり、S(0) = 0 なので、どの対象でも 1 m/s に落ち着く</span><br>';
      if(slope){var nomc=res[1][4].R,nomo=res[0][4].R,ye=nomc.y[nomc.y.length-1],yo=nomo.y[nomo.y.length-1];
        h+="坂の上（3 s、例の値の対象）: 開ループ "+_w07_f(yo,3)+" m/s、閉ループ <b>"+_w07_f(ye,3)+" m/s</b>"+(I?"（積分で 1 に戻る）":"（式: 1 − 0.513 × 0.5/(1 + 0.5K<sub>P</sub>) = "+_w07_f(1-0.51342*0.5/g,3)+" m/s）")+"<br>";}
      if(noise){var Rn=res[1][4].R,i0=Math.round(1.0/2e-3),i1=Math.round(1.45/2e-3),ys=Rn.y.slice(i0,i1),us=Rn.u.slice(i0,i1);
        function sd(v){var m=v.reduce(function(s,x){return s+x;},0)/v.length;return Math.sqrt(v.reduce(function(s,x){return s+(x-m)*(x-m);},0)/v.length);}
        h+="観測ノイズによる揺れ（例の値の対象、1.0〜1.45 s の標準偏差）: 速度 <b>"+_w07_g(sd(ys),2)+" m/s</b>、力 <b>"+_w07_g(sd(us),2)+" N</b>（短い区間の値なので、乱数で変わる。1 章 4 節の長い時間の値は K<sub>P</sub> = 8 で 0.0035 m/s・0.16 N、30 で 0.0071 m/s・0.56 N）<br>";}
      h+=(Kp>0?"比例ゲインを上げると、束は細くなり、坂によるずれも減る。その代わり、観測ノイズが速度と力に大きく出る（6 節）。":"K<sub>P</sub> = 0 では、閉ループも開ループと同じになる。");
      ro.innerHTML=h+'<div class="wnote">台車の速度（例の値 K = 0.5 (m/s)/N、T = 0.5 s）の K と T を、それぞれ 3 通りに変えた 9 通り。決めた力 u<sub>0</sub> = cr = 2 N（c は例の値）はどちらにも足す。観測ノイズは閉ループだけに入る（開ループは測らない）。0.2 ms 刻みで計算した。</div>';
    }
    draw();
  };
