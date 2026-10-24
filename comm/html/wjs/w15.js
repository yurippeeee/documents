  /* ===== 15 章 クラウドとつなぎ続ける ===== */
  function _w15_s(v){return (v>0?"+":v<0?"−":"")+Math.abs(v).toFixed(3)+" s";}

  /* ---- 1 節: 4 つの時刻からずれと往復の遅延を求める ---- */
  REG.w15_sntp=function(el,U){
    var S=U.S;
    U.head(el,"SNTP","4 つの時刻から、ずれ θ と往復の遅延 δ を求める");
    var r1=U.ctrls(el);
    var th=U.slider(r1,"本当のずれ θ（サーバ − 機器）",{min:-3,max:3,step:0.01,value:1.5,fmt:function(v){return (v>0?"+":v<0?"−":"")+Math.abs(v).toFixed(2)+" s";},onInput:draw});
    var pr=U.slider(r1,"サーバの処理時間",{min:0,max:50,step:1,value:2,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var d1=U.slider(r2,"往きの遅延 d1",{min:1,max:500,log:true,int:true,value:30,fmt:function(v){return v+" ms";},onInput:draw});
    var d2=U.slider(r2,"帰りの遅延 d2",{min:1,max:500,log:true,int:true,value:10,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"例の値（1.5 s・30 ms・10 ms・2 ms）",function(){th.set(1.5);d1.set(30);d2.set(10);pr.set(2);draw();});
    U.button(br,"往きと帰りを等しくする",function(){var m=Math.round((d1.get()+d2.get())/2);d1.set(m);d2.set(m);draw();});
    U.button(br,"帰りだけ遅い（往き 1 ms・帰り 200 ms）",function(){d1.set(1);d2.set(200);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var TH=th.get(),D1=d1.get()/1000,D2=d2.get()/1000,P=pr.get()/1000;
      var T1=10,T2=T1+D1+TH,T3=T2+P,T4=T3-TH+D2;
      var est=((T2-T1)+(T3-T4))/2,del=(T4-T1)-(T3-T2),err=est-TH;
      var W=700,o=[],yd=58,ys=158,x0=150,x1=470,tot=D1+P+D2,sc=(x1-x0)/tot;
      var X=function(t){return x0+t*sc;};
      var a1=X(0),a2=X(D1),a3=X(D1+P),a4=X(tot);
      o.push(S.T(16,yd-8,"機器の時計","start",11,"signal",true));
      o.push(S.T(16,ys-8,"サーバの時計","start",11,"green",true));
      o.push(S.ARR(16,yd,x1+40,yd,"signal",1.5,6));o.push(S.ARR(16,ys,x1+40,ys,"green",1.5,6));
      o.push(S.ARR(a1,yd,a2,ys,"signal",1.8));o.push(S.ARR(a3,ys,a4,yd,"green",1.8));
      [[a1,yd],[a4,yd],[a2,ys],[a3,ys]].forEach(function(p){o.push(S.D(p[0],p[1],"ink",3.6));});
      o.push(S.T(a1,yd-10,"T1 = "+T1.toFixed(3),"middle",10.5,"signal",true,true));
      o.push(S.T(Math.max(a4,a1+100),yd-10,"T4 = "+T4.toFixed(3),"middle",10.5,"signal",true,true));
      var close=(a3-a2)<100;
      o.push(S.T(a2-(close?4:0),ys+17,"T2 = "+T2.toFixed(3),close?"end":"middle",10.5,"green",true,true));
      o.push(S.T(a3+(close?4:0),ys+(close?17:31),"T3 = "+T3.toFixed(3),close?"start":"middle",10.5,"green",true,true));
      o.push(S.T((a1+a2)/2-6,(yd+ys)/2-4,"d1 = "+Math.round(D1*1000)+" ms","end",10,"signal"));
      o.push(S.T((a3+a4)/2+6,(yd+ys)/2-4,"d2 = "+Math.round(D2*1000)+" ms","start",10,"green"));
      /* 右: 計算 */
      var xr=530,yr=58,lh=19;
      var L=[["T2 − T1 = θ + d1",_w15_s(T2-T1),"ink"],["T3 − T4 = θ − d2",_w15_s(T3-T4),"ink"],["θ̂ = 2 つの和 ÷ 2",_w15_s(est),"signal"],
             ["δ = (T4 − T1) − (T3 − T2)",(del*1000).toFixed(0)+" ms","teal"],["誤差 θ̂ − θ = (d1 − d2)/2",_w15_s(err),Math.abs(err)>1e-9?"alias":"green"]];
      L.forEach(function(r,i){o.push(S.T(xr,yr+i*2*lh,r[0],"start",9.5,"muted"));o.push(S.T(xr+8,yr+i*2*lh+15,r[1],"start",11,r[2],true,true));});
      /* 下: ずれの数直線 */
      var yl=232,lx0=120,lx1=640,R=Math.max(0.6*del,Math.abs(err)*1.4,0.004),c0=TH;
      var XN=function(v){return lx0+(v-(c0-R))/(2*R)*(lx1-lx0);};
      o.push(S.L(lx0,yl,lx1,yl,"muted",1.2));
      [-R,0,R].forEach(function(k){var xx=XN(c0+k);o.push(S.L(xx,yl-4,xx,yl+4,"muted",1));o.push(S.T(xx,yl+17,(c0+k>=0?"+":"−")+Math.abs(c0+k).toFixed(3)+" s","middle",9.5,"muted",false,true));});
      var lo=XN(est-del/2),hi=XN(est+del/2);
      o.push(S.RECT(Math.max(lx0,lo),yl-9,Math.max(2,Math.min(lx1,hi)-Math.max(lx0,lo)),18,3,U.soft("signal"),"signal",1.2));
      o.push(S.D(XN(TH),yl,"green",5.5));o.push(S.D(XN(est),yl,"signal",4));
      o.push(S.T(XN(TH),yl-14,"本当の θ","middle",10,"green",true));
      o.push(S.T(Math.min(lx1-40,Math.max(lx0+40,XN(est))),yl+34,"θ̂ ± δ/2（機器に分かる範囲）","middle",10,"signal",true));
      o.push(S.T(16,yl+4,"ずれ","start",10.5,"ink",true));
      box.set(S.svg(W,280,o));
      var inside=Math.abs(err)<=del/2+1e-9;
      ro.innerHTML="θ̂ = ((T2 − T1) + (T3 − T4)) / 2 = ("+_w15_s(T2-T1)+" + "+_w15_s(T3-T4)+") / 2 = <b>"+_w15_s(est)+"</b>"+
        " ・ δ = "+((T4-T1)*1000).toFixed(0)+" ms − "+((T3-T2)*1000).toFixed(0)+" ms = <b>"+(del*1000).toFixed(0)+" ms</b><br>"+
        "誤差 θ̂ − θ = (d1 − d2) / 2 = <b>"+_w15_s(err)+"</b>（大きさの上限 δ/2 = "+(del*500).toFixed(1)+" ms）"+
        (inside?' <span class="ok">本当のずれは θ̂ ± δ/2 の中にある</span>':' <span class="warn">範囲の外</span>')+
        (Math.abs(err)>=del/2-1e-9&&del>0?' ・ 遅延が片方の向きだけにあるので、誤差がちょうど上限になる':'')+
        '<div class="wnote">機器の時計を基準に、T1 = 10.000 s とした。サーバの処理時間は T3 − T2 として除かれるので、ずれにも遅延にも入らない。</div>';
    }
    draw();
  };

  /* ---- 2 節: 再接続の方針のシミュレーション ---- */
  var _w15_L=["Wi-Fi","DHCP","DNS","SNTP","TCP","TLS","MQTT"];
  var _w15_LC=["signal","gold","purple","purple","green","teal","purple"];
  var _w15_OK=[2.0,0.5,0.1,0.1,0.1,1.0,0.2];   /* 成功したときにかかる時間 [s]（代表値） */
  var _w15_SC=[
    {t:"ブローカが 20 分止まる（接続を断られる）",start:4,clear:1200,hz:2400},
    {t:"AP の電源が 15 分切れる",start:0,clear:900,hz:1800},
    {t:"DNS サーバが 10 分答えない",start:2,clear:600,hz:1200},
    {t:"サーバのアドレスが変わった（古いアドレスを使い続ける）",start:4,clear:0,hz:240},
    {t:"RTC が戻っていた（機器は時刻が正しいと思っている）",start:4,clear:0,hz:60},
    {t:"ブローカがクライアント ID を拒む（設定の誤り）",start:4,clear:Infinity,hz:8000}];
  function _w15_sim(sc,b,cap,esc,jit,seed){
    var R=U_rng(seed),st={fresh:false,timeok:false},ev=[],wt=[],t=0,cur=sc.start,fails=0,up=null,notify=false,count=[0,0,0,0,0,0,0];
    var si=_w15_SC.indexOf(sc);
    function attempt(L){
      if(si===0&&L===4&&t<sc.clear)return {ok:false,c:"temp",d:0.1};
      if(si===1&&L===0&&t<sc.clear)return {ok:false,c:"temp",d:5};
      if(si===2&&L===2&&t<sc.clear)return {ok:false,c:"temp",d:8};
      if(si===3){if(L===2)st.fresh=true;if(L===4&&!st.fresh)return {ok:false,c:"temp",d:10};}
      if(si===4){if(L===3)st.timeok=true;if(L===5&&!st.timeok)return {ok:false,c:"time",d:1};}
      if(si===5&&L===6)return {ok:false,c:"config",d:0.3};
      return {ok:true,d:_w15_OK[L]};
    }
    var guard=0;
    while(t<sc.hz&&up===null&&guard++<5000){
      var L=cur,r=attempt(L);count[L]++;
      ev.push([L,t,t+r.d,r.ok?"ok":r.c]);t+=r.d;
      if(r.ok){
        if(L===6){up=t;break;}
        cur=(L===2)?(si===4&&st.timeok?3:4):(L===3?4:L+1);
        if(L===2&&si===4&&!st.timeok)cur=4;      /* 時刻は正しいと思っているので SNTP を飛ばす */
        continue;
      }
      var base=L>=4?4:L,w;fails++;
      if(r.c==="time"){cur=3;}
      else if(r.c==="config"){cur=base;notify=true;}
      else if(esc&&fails>=6){cur=0;}
      else if(esc&&fails>=3&&base>2){cur=2;}
      else cur=base;
      if(r.c==="config")w=3600;
      else{w=Math.min(cap,b*Math.pow(2,fails-1));if(jit)w=R.next()*w;}
      wt.push([t,t+w,r.c==="config"?"config":"temp",fails]);t+=w;
    }
    return {ev:ev,wt:wt,up:up,count:count,fails:fails,notify:notify};
  }
  var U_rng=null;
  REG.w15_reconn=function(el,U){
    var S=U.S,F=U.fmt;U_rng=U.rng;
    U.head(el,"RECONNECT","故障を起こして、どの層からやり直すかを見る");
    var r1=U.ctrls(el);
    var sc=U.select(r1,"故障",_w15_SC.map(function(s){return s.t;}),0,draw);
    var r2=U.ctrls(el);
    var bb=U.slider(r2,"最初の待ち時間",{values:[0.5,1,2,5,10],value:1,fmt:function(v){return v+" s";},onInput:draw});
    var cp=U.slider(r2,"上限",{values:[30,60,120,300,600,1800],value:300,fmt:function(v){return F.time(v);},onInput:draw});
    var r3=U.ctrls(el);
    var es=U.checkbox(r3,"続けて失敗したら下の層から（3 回目から DNS、6 回目から Wi-Fi）",true,draw);
    var ji=U.checkbox(r3,"ジッタ（全部をランダムに）",true,draw);
    var seed=1,br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var s=_w15_SC[sc.get()],res=_w15_sim(s,bb.get(),cp.get(),es.get(),ji.get(),seed*7919+3);
      var W=700,x0=110,x1=688,hz=s.hz,rh=24,y0=26,o=[];
      var X=function(t){return x0+(x1-x0)*Math.min(t,hz)/hz;};
      var rows=_w15_L.concat(["待つ"]);
      rows.forEach(function(nm,i){var y=y0+i*rh;o.push(S.RECT(x0,y,x1-x0,rh-6,2,"screen","line",0.8));
        o.push(S.T(x0-8,y+13,nm,"end",10.5,i<7?_w15_LC[i]:"gold",true));});
      res.wt.forEach(function(w){var y=y0+7*rh;o.push(S.RECT(X(w[0]),y+2,Math.max(1.5,X(w[1])-X(w[0])),rh-10,1,U.soft(w[2]==="config"?"alias":"gold"),w[2]==="config"?"alias":"gold",0.8));});
      res.ev.forEach(function(e){var y=y0+e[0]*rh,c=e[3]==="ok"?"green":"alias";
        o.push(S.RECT(X(e[1]),y+1,Math.max(2.2,X(e[2])-X(e[1])),rh-8,1,U.soft(c),c,1));});
      var yb=y0+8*rh;
      o.push(S.L(x0,yb,x1,yb,"muted",1));
      var tk=U.nice(0,hz/60,6);
      tk.forEach(function(m){var xx=X(m*60);o.push(S.L(xx,yb,xx,yb+4,"muted",1));o.push(S.T(xx,yb+16,U.sig(m,3)+" 分","middle",9.5,"muted"));});
      if(s.clear>0&&isFinite(s.clear)){var xc=X(s.clear);o.push(S.L(xc,y0-6,xc,yb,"muted",1.3,"4 3"));o.push(S.T(xc,y0-10,"故障が直る","middle",9.5,"muted",true));}
      if(res.up!==null){var xu=X(res.up);o.push(S.L(xu,y0-6,xu,yb,"green",1.6));o.push(S.T(Math.min(xu+4,x1-60),y0-10,"つながった","start",9.5,"green",true));}
      box.set(S.svg(W,yb+26,o));
      var tot=res.count.reduce(function(a,c){return a+c;},0);
      var tbl=U.tbl(_w15_L,[res.count.map(String)],_w15_L.map(function(){return "center";}));
      var msg;
      if(res.up!==null){
        msg="つながった時刻 <b>"+F.time(res.up)+"</b>"+(s.clear>0&&isFinite(s.clear)?"（故障が直ってから <b>"+F.time(Math.max(0,res.up-s.clear))+"</b> 後）":"");
      } else msg='<span class="warn">'+F.time(hz)+" の間につながらなかった</span>";
      ro.innerHTML=msg+" ・ 試みの合計 <b>"+tot+" 回</b>・ 待った回数 "+res.wt.length+"<br>"+tbl+
        (res.notify?'<div class="wnote"><span class="warn">設定の誤り</span>: 繰り返しても直らないので、1 時間待ってから同じ層で試し、利用者に知らせる（デモでは 1 時間ごとに試みる様子を見る）。</div>':"")+
        '<div class="wnote">緑は成功した試み、赤は失敗した試み、金は待っている時間（赤枠は設定の誤りの長い待ち）。各段にかかる時間は代表値（Wi-Fi 2 s、DHCP 0.5 s、TLS 1 s など。失敗に気づくまで: Wi-Fi 5 s、DNS 8 s、TCP のタイムアウト 10 s）。</div>';
    }
    draw();
  };

  /* ---- 3 節: つながらない間の蓄積 ---- */
  REG.w15_store=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"STORE","つながらない間にためる: 何が残り、何を失うか");
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"測る間隔",{values:[60,300,600,1800,3600],value:600,fmt:function(v){return F.time(v);},onInput:draw});
    var sz=U.slider(r1,"1 件の大きさ",{values:[16,32,64,128],value:32,fmt:function(v){return v+" バイト";},onInput:draw});
    var r2=U.ctrls(el);
    var kb=U.slider(r2,"列の大きさ（4 KB のまとまり）",{values:[8,16,24,36,64,128,256],value:36,fmt:function(v){return v+" KB（"+(v/4)+" つ）";},onInput:draw});
    var ou=U.slider(r2,"切れている時間",{values:[3600,6*3600,86400,3*86400,7*86400,10*86400,14*86400,30*86400],value:10*86400,fmt:function(v){return F.time(v);},onInput:draw});
    var r3=U.ctrls(el);
    var po=U.seg(r3,["古いものを捨てる","新しいものを捨てる","間引く"],0,draw);
    var li=U.select(r3,"書き込み回数の上限",["1 万回","10 万回"],0,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Tm=tm.get(),s=sz.get(),nb=kb.get()/4,per=Math.floor(4096/s),slots=nb*per,nd=86400/Tm,N=Math.round(ou.get()/Tm),pol=po.get();
      var keep=[],fill=[],k,i;
      for(i=0;i<N;i++){
        if(keep.length>=slots){
          if(pol===0)keep=keep.slice(per);                         /* 最も古いまとまりを消す */
          else if(pol===1){fill.push(keep.length);continue;}       /* 新しいものを書かない */
          else keep=keep.filter(function(_,j){return j%2===0;});   /* 1 件おきに減らす */
        }
        keep.push(i);fill.push(keep.length);
      }
      var K=keep.length,Lost=N-K;
      /* 図 */
      var W=700,x0=150,x1=680,o=[],X=function(n){return x0+(x1-x0)*n/Math.max(1,N);};
      o.push(S.T(x0-10,40,"作ったデータ","end",10.5,"ink",true));
      o.push(S.RECT(x0,26,x1-x0,22,3,U.soft("signal"),"signal",1.2));
      o.push(S.T((x0+x1)/2,41,N+" 件（"+F.time(Tm)+"おき）","middle",10,"signal",true));
      o.push(S.T(x0-10,82,"残ったもの","end",10.5,"ink",true));
      o.push(S.RECT(x0,68,x1-x0,22,3,U.soft("alias"),"alias",1,"4 3"));
      /* 同じ間隔の続きごとに塗る */
      i=0;
      while(i<K){var g=(i+1<K)?keep[i+1]-keep[i]:1,j=i;while(j+1<K&&keep[j+1]-keep[j]===g)j++;
        var a=X(keep[i]),bx=X(keep[j]+g),c=g===1?"green":"teal";
        o.push(S.RECT(a,68,Math.max(1.5,bx-a),22,2,U.soft(c),c,1.2,g===1?null:"2 2"));
        if(bx-a>90)o.push(S.T((a+bx)/2,83,(g===1?"":"")+(j-i+1)+" 件（"+F.time(g*Tm)+"おき）","middle",9.5,c,true));
        i=j+1;}
      if(Lost>0)o.push(S.T(x1,104,"赤い破線: 失った部分","end",9.5,"alias"));
      /* 列の量の変化 */
      var p=U.plot(x0,124,x1-x0,90,[0,Math.max(1,N)],[0,slots*1.1]);
      o.push(p.axes({yl:"列の件数",xt:[0,N/2,N].map(Math.round),yt:[0,slots],xfmt:function(v){return F.time(v*Tm);},yfmt:function(v){return String(Math.round(v));},ylOff:48}));
      var pts=[[0,0]];var step=Math.max(1,Math.floor(N/400));for(k=0;k<fill.length;k+=step)pts.push([k+1,fill[k]]);pts.push([N,fill[N-1]||0]);
      o.push(p.line(pts,"signal",1.8));
      o.push(p.line([[0,slots],[N,slots]],"alias",1.2,"5 4"));
      o.push(S.T(x0+6,p.Y(slots)-5,"列の大きさ "+slots+" 件","start",9.5,"alias"));
      box.set(S.svg(W,250,o));
      var limit=li.get()===0?1e4:1e5,cyc=slots/nd,years=limit*cyc/365.25,inplace=limit/nd;
      ro.innerHTML="1 日に <b>"+U.sig(nd,4)+" 件・"+F.bytes(nd*s)+"</b> ・ 列に入るのは <b>"+slots+" 件</b>（"+U.sig(slots/nd,3)+" 日分。消すまとまりの分を除いて必ず残るのは "+((nb-1)*per)+" 件 = "+U.sig((nb-1)*per/nd,3)+" 日分）<br>"+
        "切れていた "+F.time(ou.get())+" に作った "+N+" 件のうち、残ったのは <b>"+K+" 件</b>、失ったのは <b>"+Lost+" 件</b>"+(Lost?"（"+U.sig(Lost/nd,3)+" 日分）":' <span class="ok">（すべて残った）</span>')+"<br>"+
        "書き込み回数の上限まで: 順に書けば <b>"+(years>=1000?"1000 年以上":U.sig(years,3)+" 年")+"</b>（一巡 "+U.sig(cyc,3)+" 日ごとに 1 回消す）・ 同じまとまりを書き直せば <b>"+U.sig(inplace,3)+" 日</b>（1 日 "+U.sig(nd,4)+" 回消す）"+
        '<div class="wnote">古いものを捨てるときは、消すまとまり 1 つ分（'+per+' 件）をまとめて捨てる。間引くときは、満杯になるたびに 1 件おきに減らす（フラッシュでは書き写しが要る）。</div>';
    }
    draw();
  };

  /* ---- 7 節: まとめて送る ---- */
  REG.w15_batch=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BATCH","まとめて送る件数と、平均電流・遅れ");
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"測る間隔 T_m",{values:[60,120,300,600,1200,1800,3600],value:600,fmt:function(v){return F.time(v);},onInput:draw});
    var bb=U.slider(r1,"まとめる件数 B",{values:[1,2,3,4,6,12,24,36,72,144],value:6,fmt:function(v){return v+" 件";},onInput:draw});
    var r2=U.ctrls(el);
    var qc=U.slider(r2,"接続 1 回の電荷 Q_c",{min:10,max:1000,log:true,int:true,value:150,fmt:function(v){return v+" mC";},onInput:draw});
    var qm=U.slider(r2,"メッセージ 1 つの電荷 Q_m",{min:0.1,max:20,log:true,value:2.4,fmt:function(v){return v+" mC";},onInput:draw});
    var r3=U.ctrls(el);
    var is=U.slider(r3,"眠っている間の電流 I_s",{min:1,max:200,log:true,value:5,fmt:function(v){return v+" µA";},onInput:draw});
    var cap=U.slider(r3,"電池の容量",{values:[220,1000,2000,3000,6000],value:2000,fmt:function(v){return v+" mAh";},onInput:draw});
    var ne=U.slider(r3,"すぐ送る出来事（1 日あたり）",{values:[0,1,2,5,10,24,48],value:0,fmt:function(v){return v+" 回";},onInput:draw});
    var r4=U.ctrls(el);
    var pk=U.checkbox(r4,"B 件を 1 つのメッセージにまとめる",false,draw);
    var br=U.btnrow(el);
    U.button(br,"例の値に戻す",function(){tm.set(600);bb.set(6);qc.set(150);qm.set(2.4);is.set(5);cap.set(2000);ne.set(0);pk.set(false);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var QR=0.05e-3;   /* 1 件分のバイトを足して送る電荷（代表値） */
    function cur(B,Tm,Qc,Qm,Is,Ne,pack){
      var Nc=86400/(B*Tm),Nm=pack?Nc:86400/Tm,qmsg=pack?Qm+(B-1)*QR:Qm;
      var qday=Nc*Qc+Nm*qmsg+Ne*(Qc+Qm);return {Nc:Nc,Nm:Nm,qmsg:qmsg,qday:qday,I:Is+qday/86400};}
    function draw(){
      var Tm=tm.get(),B=bb.get(),Qc=qc.get()*1e-3,Qm=qm.get()*1e-3,Is=is.get()*1e-6,C=cap.get()*3.6,Ne=ne.get(),pack=pk.get();
      var r=cur(B,Tm,Qc,Qm,Is,Ne,pack);
      var W=700,o=[];
      /* 上: 時間の帯（B を 2 回分、ただし 2〜48 時間） */
      var win=Math.min(48*3600,Math.max(2*3600,2*B*Tm)),x0=110,x1=680,X=function(t){return x0+(x1-x0)*t/win;};
      var n=Math.floor(win/Tm),y=40;
      o.push(S.T(x0-10,y+4,"測る・送る","end",10.5,"ink",true));
      o.push(S.L(x0,y,x1,y,"line",1.2));
      var dot=n>150?1.6:3.2;
      for(var k=0;k<n;k++){o.push(S.D(X(k*Tm),y,"signal",dot));if(k%B===B-1)o.push(S.RECT(X(k*Tm)+1,y-13,6,26,2,U.soft("green"),"green",1.2));}
      var R=U.rng(5),ev=Ne*win/86400;for(var e=0;e<Math.round(ev);e++){var te=R.next()*win;o.push(S.RECT(X(te)-3,y-13,6,26,2,U.soft("alias"),"alias",1.2));}
      if(B>1){o.push(S.DARR(X(0),y+22,X((B-1)*Tm)+1,y+22,"gold",1.2,5));o.push(S.T(X(0),y+38,"最大の遅れ "+F.time((B-1)*Tm),"start",9.5,"gold",true));}
      o.push(S.L(x0,y+46,x1,y+46,"muted",1));
      [0,0.25,0.5,0.75,1].forEach(function(f){o.push(S.L(X(f*win),y+46,X(f*win),y+50,"muted",1));o.push(S.T(X(f*win),y+62,F.time(f*win),"middle",9,"muted"));});
      /* 下: B と平均電流 */
      var p=U.plot(110,140,560,180,[Tm,Tm*1000],[1e-6,1e-3],{xlog:true,ylog:true});
      o.push(p.axes({xl:"報告の間隔 B × T_m",yl:"平均電流",xt:[Tm,10*Tm,100*Tm,1000*Tm],yt:[1e-6,1e-5,1e-4,1e-3],xfmt:function(v){return F.time(v);},yfmt:function(v){return F.cur(v,1);},ylOff:52}));
      var pts=[];for(var q=0;q<=90;q++){var Bq=Math.pow(10,q/30);var I=cur(Bq,Tm,Qc,Qm,Is,Ne,pack).I;if(I>=1e-6&&I<=1e-3)pts.push([Bq*Tm,I]);}
      o.push(p.line(pts,"signal",2.2));
      var IA=290e-6;o.push(p.line([[Tm,IA],[1000*Tm,IA]],"teal",1.2,"6 4"));o.push(S.T(p.X(1000*Tm)-4,p.Y(IA)-5,"つなぎ続ける（09 章 4 節の例）約 290 µA","end",9.5,"teal",true));
      var fl=Is+(pack?0:Qm/Tm)+Ne*(Qc+Qm)/86400;
      if(fl>=1e-6&&fl<=1e-3){o.push(p.line([[Tm,fl],[1000*Tm,fl]],"green",1.2,"6 4"));o.push(S.T(p.X(1000*Tm)-4,p.Y(fl)+13,"B を大きくしても下がらない分 "+F.cur(fl),"end",9.5,"green",true,false,null,true));}
      var Iy=Math.min(1e-3,Math.max(1e-6,r.I));o.push(S.D(p.X(B*Tm),p.Y(Iy),"alias",5));
      o.push(S.T(p.X(B*Tm)+8,p.Y(Iy)-8,"B = "+B+": "+F.cur(r.I),"start",10,"alias",true,false,null,true));
      box.set(S.svg(W,358,o));
      var life=C/r.I/86400;
      ro.innerHTML="1 日の電荷 = 接続 "+U.sig(r.Nc,3)+" 回 × "+U.sig(Qc*1e3,3)+" mC + メッセージ "+U.sig(r.Nm,3)+" 個 × "+U.sig(r.qmsg*1e3,3)+" mC"+(Ne?" + すぐ送る "+Ne+" 回 × "+U.sig((Qc+Qm)*1e3,3)+" mC":"")+" = <b>"+U.sig(r.qday,3)+" C</b><br>"+
        "平均電流 = "+F.cur(Is)+" + "+U.sig(r.qday,3)+" C ÷ 86400 s = <b>"+F.cur(r.I)+"</b> ・ 電池寿命 <b>"+(life>=365?U.sig(life/365.25,3)+" 年":U.sig(life,3)+" 日")+"</b><br>"+
        "最大の遅れ（上り）<b>"+F.time((B-1)*Tm)+"</b>（平均 "+F.time((B-1)*Tm/2)+"）＋接続の時間 ・ 下りの設定が届くまで最大 <b>"+F.time(B*Tm)+"</b>"+
        '<div class="wnote">電荷と電流は代表値。電池が使わなくても減る分は含めていない。1 つのメッセージにまとめるときは、1 件増えるごとに '+(QR*1e3)+' mC を足した。</div>';
    }
    draw();
  };
