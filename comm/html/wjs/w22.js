  /* ===== 22 章 大きなデータを運ぶ ===== */
  /* ---- 2 節: 続きから運ぶ・最初からやり直す ---- */
  REG.w22_resume=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"RESUME","切れても続きから運ぶ場合と、最初からやり直す場合");
    var row=U.ctrls(el);
    var sz=U.slider(row,"イメージの大きさ",{values:[64,128,256,500,1024,2048,4096],value:500,fmt:function(v){return v+" KB";},onInput:draw});
    var ck=U.slider(row,"チャンクの大きさ",{values:[1,2,4,8,16,32],value:4,fmt:function(v){return v+" KB";},onInput:draw});
    var rt=U.slider(row,"回線の速さ",{min:5,max:2000,log:true,value:20.3,fmt:function(v){return F.rate(v*1e3);},onInput:draw});
    var row2=U.ctrls(el);
    var mt=U.slider(row2,"平均の切断の間隔 M",{min:10,max:7200,log:true,value:160,fmt:function(v){return F.time(v);},onInput:draw});
    var rc=U.slider(row2,"つなぎ直す時間 R",{min:1,max:120,log:true,value:10,fmt:function(v){return F.time(v);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例: q ≈ 1 %（M = 160 s）",function(){sz.set(500);ck.set(4);rt.set(20.3);mt.set(160);rc.set(10);draw();});
    U.button(br,"例: q ≈ 5 %（M = 31.5 s）",function(){sz.set(500);ck.set(4);rt.set(20.3);mt.set(31.5);rc.set(10);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var CAP=7*86400;
    function geo(r,p){var u=1-r.next();if(p<=0)return 0;if(p>=1)return 1e12;return Math.floor(Math.log(u)/Math.log(p));}
    function draw(){
      var size=sz.get()*1024,c=ck.get()*1024,v=rt.get()*1e3/8,M=mt.get(),R=rc.get();
      var n=Math.ceil(size/c),tc=c/v,q=1-Math.exp(-tc/M),s=1-q,sn=Math.pow(s,n);
      var Er=n*(tc/s+(1/s-1)*R), En=tc*(1-sn)/((1-s)*sn)+(1/sn-1)*R;
      var r=U.rng(seed*7919+11),N=400,res=[],rst=[];
      for(var k=0;k<N;k++){var t=n*tc;for(var j=0;j<n;j++){var f=geo(r,q);t+=f*(tc+R);if(t>CAP)break;}res.push(Math.min(t,CAP*1.01));}
      var est=Math.min(1/sn,CAP/(tc+R)),NR=Math.max(20,Math.min(N,Math.floor(4e6/Math.max(1,est)))),cut=0;
      for(var k2=0;k2<NR;k2++){var t2=0,done=false;while(t2<=CAP){var i=geo(r,s);if(i>=n){t2+=n*tc;done=true;break;}t2+=(i+1)*tc+R;}
        if(!done){cut++;t2=CAP*1.01;}rst.push(t2);}
      function mean(a){var x=0;a.forEach(function(y){x+=y;});return x/a.length;}
      function frac(a,lim){var m=0;a.forEach(function(y){if(y<=lim)m++;});return m/a.length;}
      var W=700,o=[],lo=10,hi=CAP*1.2;
      var panels=[["続きから運ぶ",res,"green",Er],["最初からやり直す",rst,"alias",En]];
      var p0=U.plot(120,16,560,70,[lo,hi],[0,1],{xlog:true});
      panels.forEach(function(P,pi){
        var y0=16+pi*96,p=U.plot(120,y0,560,70,[lo,hi],[0,1],{xlog:true}),nb=48,cnt=[],mx=0;
        for(var b=0;b<nb;b++)cnt.push(0);
        P[1].forEach(function(t){var b=Math.floor((Math.log10(Math.max(lo,t))-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*nb);b=Math.max(0,Math.min(nb-1,b));cnt[b]++;});
        cnt.forEach(function(x){mx=Math.max(mx,x);});
        o.push(S.RECT(120,y0,560,70,2,"screen","line",1));
        o.push(S.T(110,y0+30,P[0],"end",10.5,P[2],true));
        o.push(S.T(110,y0+46,P[1].length+" 回","end",9.5,"muted"));
        for(var b2=0;b2<nb;b2++){if(!cnt[b2])continue;var xa=120+560*b2/nb,h=66*cnt[b2]/mx;o.push(S.RECT(xa+0.5,y0+70-h,560/nb-1,h,1,U.soft(P[2]),P[2],1));}
        if(P[3]<hi){var xm=p.X(Math.max(lo,P[3]));o.push(S.L(xm,y0-2,xm,y0+72,P[2],1.6,"5 3"));o.push(S.T(xm+4,y0+10,"期待値 "+F.time(P[3]),"start",9.5,P[2],true,false,null,true));}
      });
      var ya=16+2*96-22;
      [[60,"1 分"],[3600,"1 時間"],[86400,"1 日"],[CAP,"7 日"]].forEach(function(m){var xx=p0.X(m[0]);o.push(S.L(xx,16,xx,ya,"faint",1,"3 3"));o.push(S.T(xx,ya+28,m[1],"middle",9,"muted"));});
      [[10,"10 s"],[100,"100 s"],[1000,"1000 s"],[1e4,"1 万 s"],[1e5,"10 万 s"]].forEach(function(t){var xx=p0.X(t[0]);o.push(S.L(xx,ya,xx,ya+4,"muted",1));o.push(S.T(xx,ya+14,t[1],"middle",9,"muted"));});
      o.push(S.T(120,ya+44,"横軸: 終わるまでの時間（対数目盛）。点線は 1 分・1 時間・1 日・7 日。","start",9,"muted"));
      box.set(S.svg(W,ya+52,o));
      var warn=(n*tc>CAP)?'<span class="warn">切れなくても 7 日を超える。</span><br>':'';
      ro.innerHTML=warn+"チャンク "+n+" 個、1 チャンクの時間 t_c = "+F.time(tc)+"、1 チャンクの間に切れる確率 q = "+U.sig(q*100,3)+" %（≈ t_c/M）、一度も切れずに最後まで届く確率 s<sup>n</sup> = "+U.sig(sn*100,3)+" %<br>"+
        U.tbl(["","式の期待値","乱数で試した平均","1 日のうちに終わる割合"],
          [['<span class="ok">続きから</span>  n E<sub>1</sub>',F.time(Er),F.time(mean(res)),U.sig(frac(res,86400)*100,3)+" %"],
           ['<span class="warn">最初から</span>  E<sub>n</sub>',F.time(En),cut?("7 日で打ち切った回あり（"+cut+" 回）"):F.time(mean(rst)),U.sig(frac(rst,86400)*100,3)+" %"]],["left","right","right","right"])+
        '<div class="wnote">切断はでたらめな時刻に平均 M ごとに起きるとし、切れたら送っていたチャンクの時間をまるごと失うとした。「最初から」は、試す回数が多すぎる設定では回数を減らしている。</div>';
    }
    draw();
  };

  /* ---- 4 節: 受信と書き込みのパイプライン ---- */
  REG.w22_pipe=function(el,U){
    var S=U.S,F=U.fmt,seed=3;
    U.head(el,"PIPELINE","受信と書き込みを重ねる（バッファの数と速さ）");
    var row=U.ctrls(el);
    var rt=U.slider(row,"回線の速さ",{min:50,max:5000,log:true,value:865.4,fmt:function(v){return F.rate(v*1e3);},onInput:draw});
    var ck=U.slider(row,"チャンク（= 消去単位）",{values:[1,2,4,8,16],value:4,fmt:function(v){return v+" KB";},onInput:draw});
    var nb=U.slider(row,"バッファの数",{values:[1,2,3,4],value:2,fmt:function(v){return v+" 個";},onInput:draw});
    var row2=U.ctrls(el);
    var er=U.slider(row2,"消去時間（1 単位）",{min:1,max:200,log:true,value:30,fmt:function(v){return F.time(v/1e3);},onInput:draw});
    var wt=U.slider(row2,"8 バイトの書き込み時間",{min:5,max:200,log:true,value:40,fmt:function(v){return F.time(v/1e6);},onInput:draw});
    var row3=U.ctrls(el);
    var jt=U.checkbox(row3,"消去がときどき長くかかる（4 回に 1 回、4 倍）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例の値（BLE 865.4 kbps）",function(){rt.set(865.4);ck.set(4);nb.set(2);er.set(30);wt.set(40);jt.set(false);draw();});
    U.button(br,"回線が遅い（BLE 20.3 kbps）",function(){rt.set(50);draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var c=ck.get()*1024,v=rt.get()*1e3/8,NB=nb.get(),size=512000,n=Math.ceil(size/c),r=U.rng(seed*31+5);
      var A=[0],B=[0],ws=[],rs=[],tw=[],stall=0;
      for(var k=1;k<=n;k++){
        var len=(k<n)?c:size-(n-1)*c,tr=len/v,e=er.get()/1e3*((jt.get()&&r.chance(0.25))?4:1),w=e+Math.ceil(len/8)*wt.get()/1e6;
        var bfree=(k-NB>=1)?B[k-NB]:0,st=Math.max(A[k-1],bfree);
        stall+=st-A[k-1];
        A[k]=st+tr; rs.push([st,A[k]]);
        var wst=Math.max(A[k],B[k-1]); B[k]=wst+w; ws.push([wst,B[k]]); tw.push(w);
      }
      var T=B[n],twm=0;tw.forEach(function(x){twm+=x;});twm/=n;
      var vw=c/twm,single=1/(1/v+1/vw);
      var show=Math.min(n,16),tmax=B[show]*1.02,W=700,x0=90,x1=690,X=function(t){return x0+(x1-x0)*t/tmax;},o=[];
      o.push(S.T(x0-8,34,"受信","end",10.5,"signal",true));o.push(S.T(x0-8,64,"書き込み","end",10.5,"gold",true));
      o.push(S.RECT(x0,20,x1-x0,22,3,"screen","line",1));o.push(S.RECT(x0,50,x1-x0,22,3,"screen","line",1));
      for(var i=0;i<show;i++){
        var prev=(i===0)?0:rs[i-1][1];
        if(rs[i][0]>prev+1e-9)o.push(S.RECT(X(prev),20,X(rs[i][0])-X(prev),22,0,U.soft("alias"),"none",0));
        o.push(S.RECT(X(rs[i][0]),20,Math.max(1,X(rs[i][1])-X(rs[i][0])),22,2,U.soft("signal"),"signal",1));
        o.push(S.RECT(X(ws[i][0]),50,Math.max(1,X(ws[i][1])-X(ws[i][0])),22,2,U.soft("gold"),"gold",1));
        if(X(rs[i][1])-X(rs[i][0])>14)o.push(S.T((X(rs[i][0])+X(rs[i][1]))/2,35,String(i+1),"middle",9.5,"signal",true));
        if(X(ws[i][1])-X(ws[i][0])>14)o.push(S.T((X(ws[i][0])+X(ws[i][1]))/2,65,String(i+1),"middle",9.5,"gold",true));
      }
      var ticks=U.nice(0,tmax,6);ticks.forEach(function(t){if(t>tmax)return;o.push(S.L(X(t),74,X(t),78,"muted",1));o.push(S.T(X(t),90,F.time(t),"middle",9,"muted"));});
      o.push(S.T(x0,108,"最初の "+show+" チャンク（数字はチャンクの番号）。薄い赤は、空いたバッファが無くて受信を止めている時間。","start",9.5,"muted"));
      box.set(S.svg(W,116,o));
      var eff=size/T,lim=Math.min(v,vw);
      ro.innerHTML="1 チャンクの受信 t_r = "+F.time(c/v)+"、書き込み（消去を含む）t_w = "+F.time(twm)+"（平均）。回線 "+F.rate(v*8)+"、書く速さ "+F.rate(vw*8)+"<br>"+
        "500 KB（"+n+" チャンク）を書き終える時刻 <b>"+F.time(T)+"</b>、実効の速さ <b>"+F.rate(eff*8)+"</b>（min(v_r, v_w) = "+F.rate(lim*8)+"、バッファ 1 つの式 "+F.rate(single*8)+"）<br>"+
        "受信を止めていた時間 "+F.time(stall)+"（全体の "+U.sig(stall/T*100,3)+" %） ・ 速さを決めているのは <b>"+(v<vw?"回線":"書き込み")+"</b>"+
        (NB===1?' ・ <span class="warn">バッファ 1 つでは、受信と書き込みが交互になる</span>':'');
    }
    draw();
  };

  /* ---- 6 節: 試しの起動と確定 ---- */
  REG.w22_boot=function(el,U){
    var S=U.S;
    U.head(el,"BOOT","試しの起動・確定・ロールバックを 1 段ずつ進める");
    var st,log;
    function reset(){st={slot:[{ver:1,img:"完全",f:[0xFF,0xFF,0x00]},{ver:0,img:"空",f:[0xFF,0xFF,0xFF]}],run:0,trial:false,arm:false,msg:"版 1 が動いている（確定済み）。"};log=["工場で版 1 をスロット A に書き、OK を書いた。"];}
    reset();
    var row=U.ctrls(el);
    var arm=U.checkbox(row,"次に印を書く途中で電源が切れる",false,function(v){st.arm=v;});
    var br=U.btnrow(el);
    U.button(br,"① 新しい版を取り込み、確かめて PENDING を書く",function(){act("dl");});
    U.button(br,"取り込みの途中で電源断",function(){act("dlcut");});
    U.button(br,"② 再起動する",function(){act("boot");});
    var br2=U.btnrow(el);
    U.button(br2,"③ 自己診断に通る（OK を書く）",function(){act("ok");});
    U.button(br2,"固まる（ウォッチドッグで再起動）",function(){act("hang");});
    U.button(br2,"最初に戻す",function(){reset();arm.set(false);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var NM=["PENDING","TRIED","OK"];
    function isSet(s,f){return st.slot[s].f[f]===0x00;} function isClr(s,f){return st.slot[s].f[f]===0xFF;}
    function valid(s){return st.slot[s].img==="完全";}
    function setf(s,f){if(st.arm){st.slot[s].f[f]=0x5A;st.arm=false;arm.set(false);log.push("スロット "+"AB"[s]+" に "+NM[f]+" を書く途中で電源が切れた（書きかけ 0x5A が残る）。");return false;}st.slot[s].f[f]=0x00;return true;}
    function bootSel(){
      for(var s=0;s<2;s++)if(isSet(s,0)&&isClr(s,1)&&isClr(s,2)&&valid(s)){
        log.push("ブートローダ: スロット "+"AB"[s]+" は PENDING だけ → TRIED を書いてから試しに起動する。");
        if(!setf(s,1)){return bootSel();}
        return {s:s,trial:true};}
      var best=-1;for(var s2=0;s2<2;s2++)if(isSet(s2,2)&&valid(s2)&&(best<0||st.slot[s2].ver>st.slot[best].ver))best=s2;
      return {s:best,trial:false};
    }
    function act(a){
      var o=1-st.run;
      if(a==="dl"||a==="dlcut"){
        if(st.trial){log.push("試しの起動中は取り込まない（先に確定するか、戻す）。");draw();return;}
        var nv=Math.max(st.slot[0].ver,st.slot[1].ver)+1;
        st.slot[o]={ver:nv,img:"書きかけ",f:[0xFF,0xFF,0xFF]};
        if(a==="dlcut"){log.push("スロット "+"AB"[o]+" を消して版 "+nv+" を書いている途中で電源が切れた。");act("boot");return;}
        st.slot[o].img="完全";
        log.push("スロット "+"AB"[o]+" を消して版 "+nv+" を書き、ハッシュと署名を確かめた。");
        if(setf(o,0))log.push("スロット "+"AB"[o]+" に PENDING を書いた。再起動すれば試しに起動する。");
        else {act("boot");return;}
      }else if(a==="boot"||a==="hang"){
        if(a==="hang")log.push(st.trial?"試しの起動中に固まった → ウォッチドッグがリセットした。":"固まった → ウォッチドッグがリセットした。");
        else log.push("再起動した。");
        var r=bootSel();
        if(r.s<0){st.msg="起動できるイメージが無い。";log.push(st.msg);draw();return;}
        st.run=r.s;st.trial=r.trial;
        if(r.trial)st.msg="版 "+st.slot[r.s].ver+"（スロット "+"AB"[r.s]+"）を試しに起動した。自己診断を待つ。";
        else{var other=1-r.s,rb=isSet(other,1)&&!isSet(other,2)&&st.slot[other].ver>st.slot[r.s].ver;
          st.msg="版 "+st.slot[r.s].ver+"（スロット "+"AB"[r.s]+"、確定済み）を起動した。"+(rb?"確定されなかった版 "+st.slot[other].ver+" からのロールバックである。":"");
          if(rb)log.push("ブートローダ: スロット "+"AB"[other]+" は TRIED があるのに OK が無い → 確定済みのスロット "+"AB"[r.s]+" を起動（ロールバック）。");}
        log.push(st.msg);
      }else if(a==="ok"){
        if(!st.trial){log.push("いまは試しの起動中ではないので、何もしない。");draw();return;}
        if(setf(st.run,2)){st.trial=false;st.msg="版 "+st.slot[st.run].ver+" を確定した。以後はこの版を起動する。";log.push("自己診断に通り、OK を書いた（確定）。");}
        else{act("boot");return;}
      }
      draw();
    }
    function fv(v){return v===0xFF?"FF":v===0x00?"00":"書きかけ";}
    function draw(){
      var W=700,o=[];
      o.push(S.T(350,18,"ブートローダは、PENDING だけのスロットを試し、それ以外は OK のうち版の新しいほうを起動する","middle",10,"muted"));
      for(var s=0;s<2;s++){
        var x=30+s*340,sl=st.slot[s],run=(st.run===s),c=run?(st.trial?"gold":"signal"):"muted";
        o.push(S.RECT(x,30,300,150,8,U.soft(c),c,run?2.4:1.2));
        o.push(S.T(x+14,54,"スロット "+"AB"[s],"start",12,c,true));
        o.push(S.T(x+286,54,run?(st.trial?"試しの起動中":"動作中"):"","end",11,c,true));
        o.push(S.T(x+14,78,sl.img==="空"?"イメージ: 空":"イメージ: 版 "+sl.ver+"（"+sl.img+"）","start",11,sl.img==="完全"?"ink":"alias"));
        for(var f=0;f<3;f++){
          var y=96+f*26,v=sl.f[f],cc=v===0x00?"green":(v===0xFF?"muted":"alias");
          o.push(S.T(x+14,y+16,NM[f],"start",10.5,"ink",false,true));
          o.push(S.RECT(x+120,y,100,22,4,U.soft(cc),cc,1.2));
          o.push(S.T(x+170,y+15,fv(v),"middle",10.5,cc,true,true));
        }
      }
      box.set(S.svg(W,190,o));
      ro.innerHTML="<b>"+st.msg+"</b>"+'<div class="wnote">'+log.slice(-7).map(function(l){return "・"+l;}).join("<br>")+"</div>";
    }
    draw();
  };

  /* ---- 7 節: 転送時間の見積もり ---- */
  REG.w22_time=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"TIME","イメージを取り込む時間と、それを決めている段");
    var row=U.ctrls(el);
    var path=U.select(row,"経路",["BLE（実効の速さを入れる）","TCP（Wi-Fi・LTE-M）","1 往復に 1 ブロック（CoAP など）","LoRaWAN"],1,draw);
    var sz=U.slider(row,"イメージの大きさ",{values:[64,128,256,500,1024,2048,4096],value:500,fmt:function(v){return v+" KB";},onInput:draw});
    var sw=U.select(row,"切り替え",["A/B（再起動だけ）","スワップ（書く時間の 3 倍）","上書き（書く時間と同じ）"],0,draw);
    var row2=U.ctrls(el);
    var lk=U.slider(row2,"回線の実効の速さ",{min:1,max:50000,log:true,value:20000,fmt:function(v){return F.rate(v*1e3);},onInput:draw});
    var rtt=U.slider(row2,"RTT",{min:5,max:2000,log:true,value:100,fmt:function(v){return F.time(v/1e3);},onInput:draw});
    var wn=U.slider(row2,"受信ウィンドウ",{values:[2144,5840,11680,23360,65535],value:5840,fmt:function(v){return v+" バイト";},onInput:draw});
    var bl=U.slider(row2,"ブロックの大きさ",{values:[256,512,1024],value:1024,fmt:function(v){return v+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var vw=U.slider(row3,"フラッシュに書く速さ",{min:50,max:5000,log:true,value:649.1,fmt:function(v){return F.rate(v*1e3);},onInput:draw});
    var sf=U.select(row3,"拡散率",["SF7","SF8","SF9","SF10","SF11","SF12"],0,draw);
    var ap=U.slider(row3,"LoRaWAN の 1 回のデータ",{min:10,max:240,step:1,value:200,fmt:function(v){return v+" バイト";},onInput:draw});
    var dc=U.select(row3,"デューティサイクル",["1 %","0.1 %","10 %"],0,draw);
    var br=U.btnrow(el);
    function pre(p,l,r,w,b,f,s,a){path.set(String(p));if(l)lk.set(l);if(r)rtt.set(r);if(w)wn.set(w);if(b)bl.set(b);if(f!=null)sf.set(String(f));if(a)ap.set(a);vw.set(649.1);sz.set(500);draw();}
    U.button(br,"BLE (a) 865.4 kbps",function(){pre(0,865.4);});
    U.button(br,"BLE (b) 20.3 kbps",function(){pre(0,20.3);});
    U.button(br,"Wi-Fi・クラウド",function(){pre(1,20000,100,5840);});
    U.button(br,"Wi-Fi・LAN",function(){pre(1,20000,20,5840);});
    U.button(br,"LTE-M・TCP",function(){pre(1,300,200,5840);});
    U.button(br,"LTE-M・CoAP",function(){pre(2,300,200,null,1024);});
    U.button(br,"LoRaWAN SF7",function(){pre(3,null,null,null,null,0,null,200);dc.set("0");draw();});
    U.button(br,"LoRaWAN SF12",function(){pre(3,null,null,null,null,5,null,50);dc.set("0");draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function toa(SF,pl){var ts=Math.pow(2,SF)/125e3,de=SF>=11?1:0,num=8*pl-4*SF+28+16;return (8+4.25)*ts+(8+Math.max(Math.ceil(num/(4*(SF-2*de)))*5,0))*ts;}
    function vis(c,on){c.el.style.display=on?"":"none";}
    function draw(){
      var P=path.get(),size=sz.get()*1024,link=lk.get()*1e3/8,R=rtt.get()/1e3,Wn=wn.get(),b=bl.get(),w=vw.get()*1e3/8;
      vis(lk,P!==3);vis(rtt,P===1||P===2);vis(wn,P===1);vis(bl,P===2);vis(sf,P===3);vis(ap,P===3);vis(dc,P===3);
      var L=[];   // [名前, 速さ B/s, 色]
      var setup=0;
      if(P===0){L.push(["回線（BLE の実効値）",link,"signal"]);setup=1;}
      if(P===1){L.push(["回線",link,"signal"]);L.push(["受信ウィンドウ ÷ RTT",Wn/R,"green"]);setup=3*R+0.5;}
      if(P===2){L.push(["1 往復に 1 ブロック",b/(b/link+R),"teal"]);setup=R+0.5;}
      if(P===3){var SF=7+sf.get(),a=ap.get(),t=toa(SF,a+13),d=[0.01,0.001,0.1][dc.get()];
        L.push(["送っている間の速さ",a/t,"signal"]);L.push(["デューティサイクル",a/(t/d),"alias"]);setup=0;}
      L.push(["フラッシュに書く速さ",w,"gold"]);
      var v=Infinity,mi=0;L.forEach(function(x,i){if(x[1]<v){v=x[1];mi=i;}});
      var tx=size/v,tver=size/1e6,tswp=[1,3*size/w+1,size/w+1][sw.get()],tot=setup+tx+tver+tswp;
      var W=700,o=[],p=U.plot(210,14,450,L.length*26,[10,1e8],[0,L.length],{xlog:true});
      [10,1e3,1e5,1e7].forEach(function(q){var xx=p.X(q);o.push(S.L(xx,14,xx,14+L.length*26,"grid",1));o.push(S.T(xx,26+L.length*26,F.rate(q),"middle",9,"muted"));});
      L.forEach(function(x,i){var y=14+i*26,bpsv=x[1]*8,mn=(i===mi);
        o.push(S.T(200,y+16,x[0],"end",10,mn?"ink":"muted",mn));
        o.push(S.RECT(p.X(10),y+4,Math.max(1,p.X(Math.max(10,bpsv))-p.X(10)),16,2,U.soft(x[2]),x[2],mn?2.2:1));
        var lab=F.rate(bpsv)+(mn?"（これで決まる）":""),xt=p.X(Math.max(10,bpsv))+6;
        if(xt+U.tw(lab,9.5)>696)o.push(S.T(p.X(Math.max(10,bpsv))-6,y+16,lab,"end",9.5,x[2],true,false,null,true));else o.push(S.T(xt,y+16,lab,"start",9.5,x[2],true));});
      var yb=40+L.length*26,parts=[["接続",setup,"purple"],["取り込み",tx,"signal"],["確認",tver,"green"],["切り替え",tswp,"gold"]];
      o.push(S.T(14,yb+14,"合計 "+F.time(tot)+" の内訳","start",10.5,"ink",true));
      var xx0=210,ww=470,acc=0;
      parts.forEach(function(pp){var x1=xx0+ww*acc/tot,x2=xx0+ww*(acc+pp[1])/tot;acc+=pp[1];
        if(x2-x1>0.3)o.push(S.RECT(x1,yb+2,x2-x1,18,2,U.soft(pp[2]),pp[2],1));
        if(x2-x1>U.tw(pp[0],9.5)+6)o.push(S.T((x1+x2)/2,yb+15,pp[0],"middle",9.5,pp[2],true));});
      box.set(S.svg(W,yb+30,o));
      var lora=(P===3)?"<br>LoRaWAN: 空中時間 "+F.time(toa(7+sf.get(),ap.get()+13))+"（"+(ap.get()+13)+" バイト）、送信 "+Math.ceil(size/ap.get())+" 回。下りはゲートウェイが送り、その時間をほかの機器と分け合う。":"";
      ro.innerHTML="取り込みの速さ <b>"+F.rate(v*8)+"</b>（"+L[mi][0]+"で決まる）→ 取り込み <b>"+F.time(tx)+"</b><br>"+
        "合計 <b>"+F.time(tot)+"</b> = 接続 "+F.time(setup)+" + 取り込み "+F.time(tx)+" + 確認（1 MB/s で読み直す）"+F.time(tver)+" + 切り替え "+F.time(tswp)+lora+
        '<div class="wnote">接続の時間は大まかな仮定（TCP は 3 往復 + 0.5 s、BLE は 1 s）。切り替えには再起動の 1 s を含めた。値はすべて代表値で、実際は機器と場所で測る。</div>';
    }
    draw();
  };
