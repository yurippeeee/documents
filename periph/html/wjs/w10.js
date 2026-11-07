  /* ===== 10 章 測り方を設計する ===== */

  /* ---- 2 節: センサの FIFO にためて、まとめて読む ---- */
  REG.w10_fifo=function(el,U){
    var S=U.S,F=U.fmt;
    var IF=[{n:"I2C 100 kHz",f:100e3,cpb:9,rp:4700},{n:"I2C 400 kHz",f:400e3,cpb:9,rp:2200},{n:"I2C 1 MHz",f:1e6,cpb:9,rp:1000},{n:"SPI 8 MHz",f:8e6,cpb:8,rp:0}];
    U.head(el,"FIFO","センサの FIFO にためて、M 個ずつまとめて読む");
    var r1=U.ctrls(el);
    var Tp=U.slider(r1,"測る周期 T",{values:[0.005,0.01,0.02,0.04,0.1,0.25,1],value:0.04,fmt:function(v){return F.time(v)+"（"+U.sig(1/v,3)+" Hz）";},onInput:draw});
    var nb=U.slider(r1,"値 1 つのバイト数",{values:[2,4,6,12],value:6,fmt:function(v){return v+" バイト";},onInput:draw});
    var itf=U.select(r1,"読み方",IF.map(function(x){return x.n;}),1,draw);
    var r2=U.ctrls(el);
    var Ms=U.slider(r2,"1 回に読む数 M",{min:1,max:256,value:8,log:true,int:true,fmt:function(v){return v+" 個";},onInput:draw});
    var dep=U.slider(r2,"FIFO の深さ M_max",{values:[16,32,64,128,256],value:32,fmt:function(v){return v+" 個";},onInput:draw});
    var r3=U.ctrls(el);
    var Qe=U.slider(r3,"起きるたびの決まった電荷 Q_e",{values:[0.3,0.5,1,1.5,3,6],value:1.5,fmt:function(v){return v+" µC";},onInput:draw});
    var td=U.slider(r3,"応えられない時間の最大 t_d",{values:[0,0.05,0.1,0.2,0.5,1,2],value:0.2,fmt:function(v){return F.time(v);},onInput:draw});
    var br=U.btnrow(el);
    function preset(i,m){Tp.set(0.04);nb.set(6);itf.set(i);Ms.set(m);dep.set(32);Qe.set(1.5);td.set(0.2);draw();}
    function upper(){return Math.floor(dep.get()-td.get()/Tp.get()+1e-9);}
    U.button(br,"2 節の例（I2C 400 kHz・M = 27）",function(){preset(1,27);});
    U.button(br,"2 節の例（SPI 8 MHz・M = 27）",function(){preset(3,27);});
    U.button(br,"1 つずつ読む（M = 1）",function(){Ms.set(1);draw();});
    U.button(br,"M を上限にする",function(){Ms.set(Math.max(1,upper()));draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function qr(){var I=IF[itf.get()],t=nb.get()*I.cpb/I.f,q=3e-3*t;if(I.rp)q+=3.0/I.rp*t;return q*1e6;}   /* µC。プルアップは 2 本が半分ずつ L とみなす */
    function draw(){
      var T=Tp.get(),M=Ms.get(),D=dep.get(),qe=Qe.get(),q=qr(),TD=td.get(),dl=TD/T;
      var Ia=function(m){return qe/(m*T)+q/T;};
      var Mstar=qe/q,up=upper(),over=M+dl>D+1e-9;
      var W=700,o=[];
      /* 上: たまった数の時間変化（T を単位にした時刻。2 回目の読み出しだけ t_d 遅れる） */
      var lvl=0,lost=0,pts=[[0,0]],reads=[],lostAt=[],k=0,cyc=0,pend=-1,t=0,maxL=0;
      while(cyc<3&&k<5000){
        var ts=k+0.5;
        if(pend>=0&&pend<=ts){pts.push([pend,lvl]);lvl=0;pts.push([pend,0]);reads.push(pend);pend=-1;cyc++;if(cyc>=3)break;}
        pts.push([ts,lvl]);
        if(lvl<D){lvl++;}else{lost++;lostAt.push(ts);}
        pts.push([ts,lvl]);maxL=Math.max(maxL,lvl);
        if(lvl>=M&&pend<0)pend=ts+(cyc===1?Math.max(dl,0.1):0.1);
        k++;
      }
      var tend=(reads.length?reads[reads.length-1]:k)+Math.max(1,M*0.15);
      pts.push([tend,lvl]);
      var x0=110,wd=440,yt=26,ht=110,ymax=Math.max(D,M)*1.08;
      var X=function(v){return x0+v/tend*wd;},Y=function(v){return yt+ht-v/ymax*ht;};
      o.push(S.T(14,14,"FIFO にたまった数（2 回目だけ、マイコンが t_d 遅れて読む）","start",10.5,"ink",true));
      o.push(S.W([x0,yt,x0,yt+ht,x0+wd,yt+ht],"muted",1.1));
      o.push(S.L(x0,Y(M),x0+wd,Y(M),"gold",1.2,"5 3"));o.push(S.L(x0,Y(D),x0+wd,Y(D),"alias",1.2,"5 3"));
      o.push(S.T(x0+wd+6,Y(M)+4,"M = "+M,"start",9.5,"gold",true));o.push(S.T(x0+wd+6,Y(D)+(Math.abs(Y(D)-Y(M))<14?-8:4),"M_max = "+D,"start",9.5,"alias",true));
      o.push(S.PL(pts.map(function(p){return [X(p[0]),Y(p[1])];}),over?"alias":"signal",1.7));
      if(dl>0&&reads.length>1){var a0=reads[0]+0.0;var r1t=reads[1],r0t=r1t-Math.max(dl,0.1);o.push(S.RECT(X(r0t),yt+2,X(r1t)-X(r0t),ht-2,2,"var(--muted-soft)","none",0));
        o.push(S.T((X(r0t)+X(r1t))/2,yt+ht-6,"t_d","middle",9,"muted",true,false,null,true));}
      lostAt.forEach(function(ts){o.push(S.X(X(ts),Y(D),3.5,"alias",1.6));});
      reads.forEach(function(r){o.push(S.L(X(r),yt+ht+6,X(r),yt+ht+16,"signal",2));});
      o.push(S.T(x0-8,yt+ht+15,"読む","end",9,"signal",true));
      o.push(S.T(x0-8,Y(0)+3,"0","end",9,"muted"));
      o.push(S.T(x0+wd,yt+ht+30,"時間（"+F.time(T)+" ごとに 1 つ測る。全体で "+F.time(tend*T)+"）","end",9.5,"muted"));
      /* 下: M と平均電流 */
      var lo=Math.pow(10,Math.floor(Math.log10(q/T*0.5))),hi=Math.pow(10,Math.ceil(Math.log10(Ia(1)*1.2)));
      var p=U.plot(110,200,440,170,[1,256],[lo,hi],{xlog:true,ylog:true});
      var yts=[];for(var e=Math.log10(lo);e<=Math.log10(hi)+1e-9;e++)yts.push(Math.pow(10,e));
      o.push(p.axes({xl:"1 回に読む数 M",yl:"読むための平均電流 [µA]",xt:[1,2,4,8,16,32,64,128,256],yt:yts,xfmt:function(v){return String(v);},yfmt:function(v){return v>=1?String(v):String(+v.toPrecision(1));},ylOff:46}));
      if(up<256){var xu=Math.max(1,up+1);o.push(S.RECT(p.X(Math.min(256,xu)),p.y,p.X(256)-p.X(Math.min(256,xu)),p.h,0,"var(--alias-soft)","none",0,null,' fill-opacity="0.6"'));
        o.push(S.T((p.X(Math.min(256,xu))+p.X(256))/2,p.y+14,"あふれる","middle",9.5,"alias",true,false,null,true));}
      var cur=[];for(var i=0;i<=120;i++){var m=Math.pow(256,i/120);cur.push([m,Ia(m)]);}
      o.push(p.line(cur,"signal",2.2));o.push(p.line([[1,q/T],[256,q/T]],"signal",1.1,"5 4"));
      o.push(S.T(p.X(1.3),p.Y(q/T)-6,"下限 Q_r/T = "+F.cur(q/T*1e-6),"start",9.5,"signal",false,false,null,true));
      if(Mstar>=1&&Mstar<=256){o.push(S.D(p.X(Mstar),p.Y(Ia(Mstar)),"gold",4));o.push(S.T(p.X(Mstar)+6,p.Y(Ia(Mstar))-8,"M* = "+U.sig(Mstar,3),"start",9.5,"gold",true,false,null,true));}
      o.push(S.D(p.X(M),p.Y(Ia(M)),over?"alias":"signal",5.5));
      o.push(S.T(p.x+p.w+10,p.y+20,"いまの M","start",9.5,over?"alias":"signal",true));o.push(S.T(p.x+p.w+10,p.y+36,F.cur(Ia(M)*1e-6),"start",9.5,over?"alias":"signal",true));
      box.set(S.svg(W,410,o));
      var wak=86400/(M*T),wak1=86400/T;
      ro.innerHTML="値 1 つを読む電荷 Q_r = "+nb.get()+" バイト × "+IF[itf.get()].cpb+" クロック ÷ "+U.sig(IF[itf.get()].f/1e3,3)+" kHz × 3 mA"+(IF[itf.get()].rp?" + プルアップの分":"")+" = <b>"+U.sig(q,3)+" µC</b><br>"+
        "読むための平均電流 = Q_e/(M T) + Q_r/T = "+U.sig(qe/(M*T),3)+" + "+U.sig(q/T,3)+" = <b>"+U.sig(Ia(M),3)+" µA</b>（1 つずつ読むと "+U.sig(Ia(1),3)+" µA）<br>"+
        "起きる回数: 1 日に <b>"+F.int(wak)+" 回</b>（1 つずつなら "+F.int(wak1)+" 回） ・ M* = Q_e/Q_r = <b>"+U.sig(Mstar,3)+"</b>"+(M>Mstar*3?"（M はこれよりずっと大きく、さらに増やしても電流はほとんど減らない）":"")+"<br>"+
        "あふれない上限: M ≤ M_max − t_d/T = "+D+" − "+U.sig(dl,3)+" → <b>"+(up>=1?up:"0（t_d の間に深さを超える）")+"</b> ・ いまの M は "+(over?'<span class="warn">あふれる（'+lost+" 個を失った）</span>":'<span class="ok">あふれない</span>（最大 '+maxL+" 個）")+"<br>"+
        "遅れ: 最も古い値は、測ってから最大 M T + t_d = <b>"+F.time(M*T+TD)+"</b> 後に読まれる"+
        '<div class="wnote">マイコンが動く間の電流は 3 mA、電源は 3.0 V、I2C のプルアップは 100 kHz で 4.7 kΩ、400 kHz で 2.2 kΩ、1 MHz で 1 kΩ とした（例の値）。読み出しの始めと終わりの分は Q_e に含めた。</div>';
    }
    draw();
  };

  /* ---- 5 節: 3 つのフィルタを比べる ---- */
  function _w10_ma(x,N){var o=[],s=0,b=[];for(var i=0;i<x.length;i++){b.push(x[i]);s+=x[i];if(b.length>N)s-=b.shift();o.push(s/b.length);}return o;}
  function _w10_med(x,N){var o=[],b=[];for(var i=0;i<x.length;i++){b.push(x[i]);if(b.length>N)b.shift();if(b.length<N){o.push(x[i]);continue;}var c=b.slice().sort(function(p,q){return p-q;});o.push(c[(N-1)>>1]);}return o;}
  function _w10_ema(x,a){var o=[],y=x.length?x[0]:0;for(var i=0;i<x.length;i++){y+=a*(x[i]-y);o.push(y);}return o;}
  function _w10_sd(a,i0){var n=0,s=0,s2=0;for(var i=i0;i<a.length;i++){n++;s+=a[i];s2+=a[i]*a[i];}var m=s/n;return Math.sqrt(Math.max(0,s2/n-m*m));}

  REG.w10_filter=function(el,U){
    var S=U.S,seed=1,NS=150,N0=75;
    U.head(el,"FILTER","移動平均・中央値・一次 IIR を比べる");
    var r1=U.ctrls(el);
    var sd=U.slider(r1,"ノイズの大きさ σ",{min:0,max:2,step:0.1,value:0.5,fmt:function(v){return v.toFixed(1);},onInput:draw});
    var pr=U.slider(r1,"とび値の割合",{values:[0,1,2,5,10,20],value:5,fmt:function(v){return v+" %";},onInput:draw});
    var amp=U.slider(r1,"とび値の大きさ",{min:0,max:10,step:0.5,value:5,fmt:function(v){return v.toFixed(1);},onInput:draw});
    var stp=U.slider(r1,"段差の大きさ",{min:0,max:10,step:0.5,value:4,fmt:function(v){return v.toFixed(1);},onInput:draw});
    var r2=U.ctrls(el);
    var Nm=U.slider(r2,"移動平均の数 N",{values:[2,3,4,6,8,12,15,16,24,32],value:8,fmt:function(v){return v+" 個";},onInput:draw});
    var Nd=U.slider(r2,"中央値の数",{values:[3,5,7,9],value:3,fmt:function(v){return v+" 個";},onInput:draw});
    var kk=U.slider(r2,"一次 IIR の k",{min:1,max:6,step:1,value:3,fmt:function(v){return v+"（α = 1/"+Math.pow(2,v)+"）";},onInput:draw});
    var r3=U.ctrls(el);
    var cMa=U.checkbox(r3,"移動平均",true,draw),cMd=U.checkbox(r3,"中央値",true,draw),cEm=U.checkbox(r3,"一次 IIR",true,draw),cCo=U.checkbox(r3,"中央値 3 個 → 一次 IIR",false,draw);
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"5 節の例（N = 8・3 個・α = 1/8）",function(){sd.set(0.5);pr.set(5);amp.set(5);stp.set(4);Nm.set(8);Nd.set(3);kk.set(3);cMa.set(true);cMd.set(true);cEm.set(true);cCo.set(false);draw();});
    U.button(br,"同じノイズの移動平均と IIR（N = 15・α = 1/8）",function(){Nm.set(15);kk.set(3);cMa.set(true);cMd.set(false);cEm.set(true);cCo.set(false);draw();});
    U.button(br,"とび値を除いてからならす",function(){cMa.set(false);cMd.set(false);cEm.set(true);cCo.set(true);pr.set(10);draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function series(noise,out,step){
      var Rn=U.rng(seed*7919+1),Ro=U.rng(seed*104729+7),x=[],s=sd.get(),p=pr.get()/100,A=amp.get(),St=stp.get();
      for(var i=0;i<NS;i++){var e=Rn.normal(),u=Ro.next(),v=(step&&i>=N0?St:0);if(noise)v+=s*e;if(out&&i>=5&&u<p)v+=A;x.push(v);}
      return x;}
    function draw(){
      var a=1/Math.pow(2,kk.get()),N=Nm.get(),Md=Nd.get();
      var FL=[{n:"移動平均（N = "+N+"）",c:"purple",on:cMa.get(),f:function(x){return _w10_ma(x,N);},th:function(){return 1/Math.sqrt(N);}},
              {n:"中央値（"+Md+" 個）",c:"gold",on:cMd.get(),f:function(x){return _w10_med(x,Md);},th:null},
              {n:"一次 IIR（α = 1/"+Math.pow(2,kk.get())+"）",c:"signal",on:cEm.get(),f:function(x){return _w10_ema(x,a);},th:function(){return Math.sqrt(a/(2-a));}},
              {n:"中央値 3 個 → 一次 IIR",c:"green",on:cCo.get(),f:function(x){return _w10_ema(_w10_med(x,3),a);},th:null}];
      var x=series(true,true,true),xn=series(true,false,false),xo=series(false,true,false),xs=series(false,false,true),St=stp.get();
      var W=700,o=[],ys=[];x.forEach(function(v){ys.push(v);});
      var lo=Math.min.apply(null,ys),hi=Math.max.apply(null,ys);lo=Math.min(lo,-0.5)-0.3;hi=Math.max(hi,St+0.5)+0.3;
      var p=U.plot(70,40,560,250,[0,NS-1],[lo,hi]);
      o.push(p.axes({xl:"測った回 n（T ごとに 1 つ）",yl:"値",xt:[0,25,50,75,100,125,149],yfmt:function(v){return U.sig(v,2);},ylOff:44}));
      o.push(p.line([[0,0],[N0,0],[N0,St],[NS-1,St]],"faint",1.3,"5 4"));
      x.forEach(function(v,i){o.push(S.D(p.X(i),p.Y(v),"teal",1.8));});
      var rows=[],lx=70;
      FL.forEach(function(f){if(!f.on)return;var y=f.f(x);o.push(p.line(y.map(function(v,i){return [i,v];}),f.c,2));
        o.push(S.RECT(lx,16,12,4,1,f.c,f.c,1));o.push(S.T(lx+16,21,f.n,"start",9.5,f.c,true));lx+=U.tw(f.n,9.5)+34;
        var yn=f.f(xn),yo=f.f(xo),yst=f.f(xs);
        var sdr=sd.get()>0?_w10_sd(yn,30)/_w10_sd(xn,30):null;
        var om=0;for(var i=10;i<NS;i++)om=Math.max(om,Math.abs(yo[i]));
        var k90="—";if(St>0){for(var j=N0;j<NS;j++){if(yst[j]>=0.9*St-1e-9){k90=(j-N0+1)+" 回目";break;}}}
        rows.push(['<b style="color:var(--'+f.c+')">'+f.n+'</b>',sdr===null?"—":U.sig(sdr,2)+" σ"+(f.th?"（式 "+U.sig(f.th(),2)+" σ）":""),pr.get()>0&&amp.get()>0?U.sig(om,2):"—",k90]);});
      o.push(S.T(p.x+p.w+6,p.Y(St)+4,"段差","start",9,"muted"));
      o.push(S.T(70,322,"点: 入力（測った値）。破線: 本当の値。","start",9.5,"muted"));
      box.set(S.svg(W,330,o));
      ro.innerHTML=(rows.length?U.tbl(["フィルタ","残ったノイズ","とび値の影響","段差の 9 割まで"],rows,["left","right","right","right"]):"表示する出力を選ぶ。")+
        '<div class="wnote">表の値は、同じ乱数でノイズだけ・とび値だけ・段差だけの列を別々に作ってフィルタに通し、求めた（重なると見分けにくいため）。残ったノイズは出力の標準偏差を入力の σ で割った値、とび値の影響は出力の最大のずれ、段差は 9 割に届くのが段差から何回目か。とび値は正の向きに決めた割合で入れ、始めの 5 回には入れない。2 回以上続くとび値は、中央値（3 個）でも残る。</div>';
    }
    draw();
  };

  /* ---- 6 節: 故障を起こして、検査が気づくまでを見る ---- */
  REG.w10_fault=function(el,U){
    var S=U.S,seed=1,NS=300,NF=150;
    var KINDS=["なし（正しいまま）","断線（4095 になる）","短絡（0 になる）","張り付き（値が動かなくなる）","接触不良（1 回おきに急変する）","接触不良（ときどき 4095 になる）","ゆっくりずれる（1 回に 2 ずつ）"];
    U.head(el,"FAULT","故障を起こして、妥当性の検査が気づくまでを見る");
    var r1=U.ctrls(el);
    var kind=U.select(r1,"故障の種類（150 回目から）",KINDS,1,draw);
    var nz=U.slider(r1,"ノイズの大きさ（標準偏差）",{values:[0.2,0.5,1,2,4,8],value:1,fmt:function(v){return v+" LSB";},onInput:draw});
    var r2=U.ctrls(el);
    var jm=U.slider(r2,"急変のしきい値 JUMP_MAX",{values:[10,20,40,80,160],value:40,fmt:String,onInput:draw});
    var sn=U.slider(r2,"張り付きの回数 STUCK_N",{values:[5,10,20,30,60],value:30,fmt:function(v){return v+" 回";},onInput:draw});
    var kc=U.slider(r2,"続けて外れる回数 K",{values:[1,2,3,5,8],value:3,fmt:function(v){return v+" 回";},onInput:draw});
    var r3=U.ctrls(el);
    var cross=U.checkbox(r3,"ほかのセンサと比べる（差が 40（約 1 °C）を超えたら外れ）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"6 節の例の値に戻す",function(){nz.set(1);jm.set(40);sn.set(30);kc.set(3);cross.set(false);draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var WHY=["","通信の失敗","範囲の外","急変が続く","張り付き","ほかのセンサとの差"];
    function gen(){
      var K=kind.get(),Ra=U.rng(seed*31+5),Rb=U.rng(seed*57+9),Rc=U.rng(seed*91+3),raw=[],oth=[],fr=0;
      for(var i=0;i<NS;i++){
        var base=2048.3+3*Math.sin(2*Math.PI*i/600),v=Math.round(base+nz.get()*Ra.normal()),w=Math.round(base+nz.get()*Rb.normal()),u=Rc.next();
        if(i===NF)fr=v;
        if(i>=NF){if(K===1)v=4095;else if(K===2)v=0;else if(K===3)v=fr;else if(K===4)v+=(i%2===0?300:0);else if(K===5){if(u<0.3)v=4095;}else if(K===6)v+=2*(i-NF);}
        raw.push(Math.max(0,Math.min(4095,v)));oth.push(Math.max(0,Math.min(4095,w)));}
      return {raw:raw,oth:oth};}
    /* 本文の sens_check と同じ規則（ほかのセンサとの比較を足せる） */
    function check(raw,oth,i0,i1){
      var c={prev:0,hp:false,same:0,bad:0,fault:0,at:-1},use=[],rej=0,jumps=0,J=jm.get(),SN=sn.get(),K=kc.get(),X=cross.get();
      for(var i=i0;i<i1;i++){var r=raw[i],why=0;
        if(r<215||r>3937)why=2;
        else{if(c.hp&&Math.abs(r-c.prev)>J)why=3;c.same=(c.hp&&r===c.prev)?Math.min(255,c.same+1):0;if(c.same>=SN)why=4;c.prev=r;c.hp=true;
          if(why===0&&X&&Math.abs(r-oth[i])>40)why=5;}
        if(why===3)jumps++;
        c.bad=why===0?0:Math.min(255,c.bad+1);
        if(c.fault===0&&(c.bad>=K||why===4)){c.fault=why;c.at=i;}
        var ok=c.fault===0&&(why===0||why===3);if(!ok&&c.fault===0)rej++;use.push(ok);}
      return {fault:c.fault,at:c.at,use:use,rej:rej,jumps:jumps};}
    function draw(){
      var g=gen(),raw=g.raw,oth=g.oth,K=kind.get();
      var A=check(raw,oth,0,NF),B=check(raw,oth,NF-40,NS);   /* A: 正しい間の誤った確定、B: 故障に気づくまで（40 回前から始める） */
      /* フィルタ（中央値 3 個 → 一次 IIR 1/8）は、使ってよい値だけで進める（故障に気づくまでの B の判定を使う） */
      var filt=[],m=[],y=null,useAll=[];for(var i=0;i<NS;i++)useAll.push(i<NF-40?true:B.use[i-(NF-40)]);
      for(var j=0;j<NS;j++){if(useAll[j]){m.push(raw[j]);if(m.length>3)m.shift();var md=m.length<3?raw[j]:m.slice().sort(function(p,q){return p-q;})[1];y=y===null?md:y+(md-y)/8;}filt.push(y);}
      var W=700,o=[];
      /* 上: ADC の値の全体 */
      var p=U.plot(80,30,520,120,[0,NS-1],[0,4095]);
      o.push(S.T(14,18,"ADC の値の全体","start",10.5,"ink",true));
      o.push(S.RECT(p.x,p.Y(215),p.w,p.Y(0)-p.Y(215),0,"var(--alias-soft)","none",0));o.push(S.RECT(p.x,p.Y(4095),p.w,p.Y(3937)-p.Y(4095),0,"var(--alias-soft)","none",0));
      o.push(p.axes({yt:[0,2048,4095],xt:[0,50,100,150,200,250,299],grid:false,yfmt:String}));
      o.push(S.T(p.x+p.w+8,p.Y(4095)+9,"断線を疑う","start",9,"alias",true));o.push(S.T(p.x+p.w+8,p.Y(0),"短絡を疑う","start",9,"alias",true));
      o.push(p.line(raw.map(function(v,i){return [i,v];}),"teal",1.2));
      /* 下: 2048 の近くを拡大 */
      var q=U.plot(80,190,520,170,[0,NS-1],[1848,2248]);
      o.push(S.T(14,180,"2048 の近くを拡大（25 °C 付近。外の値は端に描く）","start",10.5,"ink",true));
      o.push(q.axes({xl:"測った回 n（T = 1 s として秒）",yl:"ADC の値",xt:[0,50,100,150,200,250,299],yt:[1848,1948,2048,2148,2248],yfmt:String,ylOff:52}));
      var cl=function(v){return Math.max(1848,Math.min(2248,v));};
      if(cross.get())o.push(q.line(oth.map(function(v,i){return [i,cl(v)];}),"purple",1.1));
      raw.forEach(function(v,i){o.push(S.D(q.X(i),q.Y(cl(v)),useAll[i]?"teal":"alias",useAll[i]?1.6:2.2));});
      var fp=[];filt.forEach(function(v,i){if(v!==null)fp.push([i,cl(v)]);});o.push(q.line(fp,"signal",2));
      [p,q].forEach(function(pp){if(K>0){o.push(S.L(pp.X(NF),pp.y,pp.X(NF),pp.y+pp.h,"alias",1.2,"4 3"));}});
      if(K>0)o.push(S.T(p.X(NF)+4,p.y+12,"故障","start",9.5,"alias",true,false,null,true));
      function mark(R,lab){if(R.at<0)return;[p,q].forEach(function(pp){o.push(S.L(pp.X(R.at),pp.y,pp.X(R.at),pp.y+pp.h,"signal",1.6));});
        o.push(S.T(p.X(R.at)+4,p.y+26,lab,"start",9.5,"signal",true,false,null,true));}
      mark(A,"確定（誤り）");if(K>0)mark(B,"確定");
      o.push(S.T(p.x+p.w+8,q.y+20,"点: 測った値","start",9,"teal"));o.push(S.T(p.x+p.w+8,q.y+34,"赤い点: 使わない","start",9,"alias"));
      o.push(S.T(p.x+p.w+8,q.y+48,"線: フィルタの後","start",9,"signal"));if(cross.get())o.push(S.T(p.x+p.w+8,q.y+62,"紫: ほかのセンサ","start",9,"purple"));
      box.set(S.svg(W,400,o));
      var h="";
      if(A.at>=0)h+='<span class="warn">正しい間に、誤って故障と確定した</span>（'+A.at+" 回目、理由: "+WHY[A.fault]+"）。しきい値か回数を見直す。<br>";
      else h+='正しい間（0〜149 回目）: <span class="ok">誤った確定なし</span>（使わなかった値 '+A.rej+" 個、急変と数えた回数 "+A.jumps+" 回）<br>";
      if(K===0)h+="故障なし。ノイズを小さくすると張り付き、急変のしきい値を小さくすると急変で、誤って確定することがある。";
      else if(B.at>=NF)h+="故障に気づいた: <b>"+B.at+" 回目</b>（故障から <b>"+(B.at-NF+1)+" 回目</b>、T = 1 s なら "+(B.at-NF+1)+" s）・理由: <b>"+WHY[B.fault]+"</b>";
      else if(B.at>=0)h+='<span class="warn">故障の前に確定した</span>（'+B.at+" 回目、理由: "+WHY[B.fault]+"）";
      else h+='<span class="warn">故障に気づかなかった</span>'+(K===6?"（範囲の中のゆっくりしたずれは、範囲・急変・張り付きの規則では見つからない。ほかのセンサと比べる）":K===5?"（外れが続かないので確定しない。外れた値は使わないので、出力はほぼ正しい。外れた回数を記録して接触不良を知らせる）":"");
      if(K>0)h+="<br>故障の後に使わなかった値: "+B.use.slice(40).filter(function(u){return !u;}).length+" 個 / "+(NS-NF)+" 個";
      ro.innerHTML=h+'<div class="wnote">本文の sens_check と同じ規則（範囲 215〜3937、急変・張り付き・続けて外れる回数）で調べた。誤った確定は 0〜149 回目、故障に気づくまでは 110 回目から始めた検査で求めた。フィルタは中央値 3 個 → 一次 IIR（α = 1/8）で、使ってよい値だけを通した。</div>';
    }
    draw();
  };
