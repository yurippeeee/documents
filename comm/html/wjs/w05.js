  /* ===== 05 章 状態機械とタイムアウト ===== */
  /* 曲がった矢印（figures.py の CARR と同じ形） */
  function _w05_carr(S,x1,y1,x2,y2,bend,c,lw,op){
    var mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,cx=mx+bend*dy,cy=my-bend*dx,a=Math.atan2(y2-cy,x2-cx),hd=7;
    var xe=x2-hd*0.6*Math.cos(a),ye=y2-hd*0.6*Math.sin(a);
    return '<g opacity="'+(op==null?1:op)+'">'+S.PATH("M"+x1+","+y1+" Q"+cx+","+cy+" "+xe+","+ye,c,lw)+S.head(cx,cy,x2,y2,c,hd)+'</g>';
  }

  /* ---- デモ 1: 状態機械のステップ実行 ---- */
  REG.w05_fsm=function(el,U){
    var S=U.S;
    U.head(el,"FSM","センサを読む手順の状態機械を、イベントで 1 回ずつ動かす");
    var br=U.btnrow(el);
    var EVN=["依頼","応答（正常）","応答（エラー）","時間切れ"];
    EVN.forEach(function(n,i){U.button(br,n,function(){step(i);});});
    U.button(br,"最初に戻す",function(){st=0;tries=0;last=null;log=[];draw();});
    var box=U.svgbox(el); var tb=U.mk("div","readout"); el.appendChild(tb); var ro=U.readout(el);
    var st=0,tries=0,last=null,log=[];
    var SN=["待機","応答待ち","リセット待ち"];
    /* 1 回の遷移: 戻り値 {act, next, edge, cell} */
    function trans(s,e){
      if(s===0){
        if(e===0)return {act:"送る、回数 = 1、タイマ 100 ms",next:1,edge:"start",tr:1};
        if(e===3)return {act:"起きない（待機中はタイマが止まっている）",next:0,edge:null,none:true};
        return {act:"捨てる（遅れて届いた応答など）",next:0,edge:null};
      }
      if(s===1){
        if(e===0)return {act:"「使用中」と答える",next:1,edge:null};
        if(e===1)return {act:"結果を渡す",next:0,edge:"resp"};
        if(e===2)return {act:"エラーを渡す",next:0,edge:"resp"};
        if(tries<3)return {act:"送り直す、回数 = "+(tries+1)+"、タイマ 100 ms",next:1,edge:"retry",cond:"回数 "+tries+" < 3",tr:tries+1};
        return {act:"子機をリセット、タイマ 500 ms",next:2,edge:"reset",cond:"回数 3 = 3"};
      }
      if(e===0)return {act:"「使用中」と答える",next:2,edge:null};
      if(e===3)return {act:"失敗を渡す",next:0,edge:"fail"};
      return {act:"捨てる",next:2,edge:null};
    }
    function step(e){
      var r=trans(st,e);
      last={from:st,ev:e,r:r};
      if(r.tr!=null)tries=r.tr;
      log.unshift(SN[st]+" で「"+EVN[e]+"」"+(r.cond?" ["+r.cond+"]":"")+" → "+r.act+(r.next!==st?" → "+SN[r.next]:""));
      if(log.length>6)log.pop();
      st=r.next; draw();
    }
    function draw(){
      var o=[],y=124,h=40,P=[[110,96],[360,112],[600,124]],E=last&&last.r.edge;
      function op(id){return E===id?1:0.42;} function lw(id){return E===id?3:1.6;}
      o.push(_w05_carr(S,158,y-8,304,y-8,0.28,"green",lw("start"),op("start")));
      o.push(S.T(239,y-52,"依頼 / 送る、タイマ開始","middle",10,"green",true));
      o.push(_w05_carr(S,304,y+8,158,y+8,0.28,"green",lw("resp"),op("resp")));
      o.push(S.T(239,y+60,"応答 / 結果を渡す","middle",10,"green",true));
      var sx=360,sy=y-h/2;
      o.push('<g opacity="'+op("retry")+'">'+S.PATH("M"+(sx-10)+","+sy+" C"+(sx-22)+","+(sy-43)+" "+(sx+22)+","+(sy-43)+" "+(sx+10)+","+(sy-1),"gold",lw("retry"))+S.head(sx+16,sy-12,sx+10,sy-1,"gold",6)+'</g>');
      o.push(S.T(sx,y-78,"時間切れ [回数 < 3] /","middle",10,"gold",true));
      o.push(S.T(sx,y-64,"送り直す、タイマ開始","middle",10,"gold",true));
      o.push('<g opacity="'+op("reset")+'">'+S.ARR(418,y,536,y,"alias",lw("reset"))+'</g>');
      o.push(S.T(477,y-24,"時間切れ [回数 = 3]","middle",10,"alias",true));
      o.push(S.T(477,y-10,"/ 子機をリセット","middle",10,"alias",true));
      var yb=y+118;
      o.push('<g opacity="'+op("fail")+'">'+S.PATH("M600,"+(y+h/2)+" C600,"+yb+" 110,"+yb+" 112,"+(y+h/2+8),"alias",lw("fail"))+S.PL([[112,y+h/2+1],[107,y+h/2+10],[117,y+h/2+10]],"alias",1,"alias")+'</g>');
      o.push(S.T(355,y+108,"時間切れ / 失敗を渡す","middle",10,"alias",true));
      P.forEach(function(p,i){var cur=i===st,x=p[0];
        o.push(S.RECT(x-p[1]/2,y-h/2,p[1],h,h/2.6,cur?"signal":U.soft("signal"),"signal",cur?3:1.6));
        o.push(S.T(x,y+4,SN[i],"middle",11.5,cur?"panel":"signal",true));});
      o.push(S.D(42,y,"ink",5));o.push(S.ARR(48,y,60,y,"ink",1.4,6));
      if(last&&!last.r.edge){var x0=P[last.from][0];o.push(S.T(x0,y+38,last.r.none?"（何も起きない）":"（同じ状態のまま）","middle",9.5,"muted"));}
      o.push(S.T(640,y+52,"回数 = "+tries,"middle",11,"ink",true,true));
      box.set(S.svg(700,y+124,o));
      /* 状態遷移表（使った欄を強調） */
      var cells=[["送る → 応答待ち","捨てる","捨てる","（起きない）"],
                 ["使用中と答える","結果 → 待機","エラー → 待機","回数 &lt; 3: 送り直す<br>回数 = 3: → リセット待ち"],
                 ["使用中と答える","捨てる","捨てる","失敗 → 待機"]];
      var rows=cells.map(function(r,i){return ['<b>'+SN[i]+'</b>'].concat(r.map(function(c,j){
        var hl=last&&last.from===i&&last.ev===j;
        return hl?'<span style="background:var(--signal-soft);border:1px solid var(--signal);border-radius:4px;padding:0 .3em;color:var(--ink)">'+c+'</span>':c;}));});
      tb.innerHTML='状態遷移表（今の遷移の欄を囲む）'+U.tbl(["状態 ＼ イベント"].concat(EVN),rows);
      ro.innerHTML=(last?"直前の遷移: <b>"+U.esc(log[0])+"</b>":"イベントのボタンを押すと、今の状態（塗りつぶした箱）から遷移する。")+
        (log.length>1?'<div class="wnote">'+log.slice(1).map(U.esc).join("<br>")+'</div>':"");
    }
    draw();
  };

  /* ---- デモ 2: ストップアンドウェイトの模擬 ---- */
  /* 送り始めから To で再送。データは送り終えて RTT/2 後に届き、ACK はその RTT/2 後に届く（05 章 4 節のモデル） */
  function _w05_saw(U,N,Tf,RTT,To,pd,pa,useSeq,seed){
    var r=U.rng(seed),ev=[],cnt=0,log=[];
    function push(t,k,a,b,c){ev.push({t:t,n:cnt++,k:k,a:a,b:b,c:c});}
    function pop(){var bi=0;for(var i=1;i<ev.length;i++){if(ev[i].t<ev[bi].t||(ev[i].t===ev[bi].t&&ev[i].n<ev[bi].n))bi=i;}return ev.splice(bi,1)[0];}
    var st={next:0,busy:false,seq:0,cur:-1,line:0,deadline:null,tx:0,resend:0},rx={expect:0,got:{},ndeliv:0};
    var s={dupDrop:0,dupDeliv:0,staleAck:0,wrongAck:0,end:0};
    function send(t,re){var start=Math.max(t,st.line);st.line=start+Tf;st.tx++;if(re)st.resend++;
      st.deadline=start+To;push(st.deadline,"timer",st.cur,st.tx);
      var lost=r.next()<pd,at=start+Tf+RTT/2;
      log.push({k:"data",m:st.cur,seq:st.seq,t0:start,t1:at,lost:lost,re:re});
      if(!lost)push(at,"data",st.cur,st.seq,log.length-1);}
    function startNext(t){if(st.next>=N)return;st.cur=st.next++;st.busy=true;send(t,false);}
    startNext(0);var guard=0;
    while(ev.length&&guard++<200000){
      var e=pop(),t=e.t;
      if(e.k==="data"){var m=e.a,sq=e.b,res;
        if(useSeq){if(sq===rx.expect){rx.got[m]=1;rx.ndeliv++;rx.expect^=1;res="new";}else{s.dupDrop++;res="drop";}}
        else{if(rx.got[m]){s.dupDeliv++;res="dupdeliv";}else{rx.got[m]=1;res="new";}rx.ndeliv++;}
        log[e.c].res=res;
        var al=r.next()<pa;log.push({k:"ack",m:m,seq:sq,t0:t,t1:t+RTT/2,lost:al});
        if(!al)push(t+RTT/2,"ack",m,sq,log.length-1);}
      else if(e.k==="ack"){var ok=st.busy&&(!useSeq||e.b===st.seq);
        if(ok){if(e.a!==st.cur){s.wrongAck++;log[e.c].res="wrong";}else log[e.c].res="ok";
          st.busy=false;st.seq^=1;st.deadline=null;s.end=t;startNext(t);}
        else{s.staleAck++;log[e.c].res="stale";}}
      else if(e.k==="timer"){if(st.busy&&st.cur===e.a&&st.deadline===t){log.push({k:"to",m:st.cur,t0:t});send(t,true);}}
    }
    var uniq=0;for(var q=0;q<N;q++)if(rx.got[q])uniq++;
    return {log:log,tx:st.tx,resend:st.resend,uniq:uniq,lost:N-uniq,dupDrop:s.dupDrop,dupDeliv:s.dupDeliv,staleAck:s.staleAck,wrongAck:s.wrongAck,end:s.end};
  }
  function _w05_p4(v){return +v.toPrecision(4);}   /* 対数目盛のスライダーを有効数字 4 桁に丸める */
  REG.w05_saw=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ARQ","ストップアンドウェイトで 20 個のメッセージを送る");
    var row=U.ctrls(el);
    var pd=U.slider(row,"データが失われる確率 p_d",{min:0,max:50,step:1,value:10,fmt:function(v){return v+" %";},onInput:draw});
    var pa=U.slider(row,"ACK が失われる確率 p_a",{min:0,max:50,step:1,value:10,fmt:function(v){return v+" %";},onInput:draw});
    var row2=U.ctrls(el);
    var tf=U.slider(row2,"送る時間 T_f",{min:0.5,max:50,value:5.556,log:true,snap:_w05_p4,fmt:function(v){return F.time(v/1000,4);},onInput:draw});
    var rt=U.slider(row2,"往復時間 RTT",{min:0.5,max:500,value:1.694,log:true,snap:_w05_p4,fmt:function(v){return F.time(v/1000,4);},onInput:draw});
    var to=U.slider(row2,"タイムアウト T_o",{min:1,max:1000,value:20,log:true,snap:_w05_p4,fmt:function(v){return F.time(v/1000);},onInput:draw});
    var row3=U.ctrls(el);
    var sq=U.select(row3,"シーケンス番号",["使う（データと ACK に 1 ビット）","使わない"],0,draw);
    var br=U.btnrow(el);
    var seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例 1: UART",function(){tf.set(5.556);rt.set(1.694);to.set(20);draw();});
    U.button(br,"例 2: 遠くのサーバ",function(){tf.set(0.8);rt.set(100);to.set(300);draw();});
    U.button(br,"T_o を短すぎる値に",function(){to.set(Math.max(1,+((tf.get()+rt.get())*0.6).toPrecision(3)));draw();});
    var play=U.button(br,"▶ 再生",function(){if(tk.running()){tk.stop();play.textContent="▶ 再生";cursor=null;render();}else{cursor=0;tk.start();play.textContent="■ 止める";}});
    var box=U.svgbox(el); var ro=U.readout(el);
    var res=null,cursor=null,win=1,SHOW=8;
    var tk=U.ticker(function(){cursor+=win/90;if(cursor>=win){cursor=null;tk.stop();play.textContent="▶ 再生";}render();},50);
    function draw(){
      var Tf=tf.get(),R=rt.get(),To=to.get();
      res=_w05_saw(U,20,Tf,R,To,pd.get()/100,pa.get()/100,sq.get()===0,seed);
      /* 図に描く範囲: 最初の SHOW 個のメッセージが終わるまで */
      win=0;res.log.forEach(function(g){if(g.m<SHOW)win=Math.max(win,g.t1!=null?g.t1:g.t0);});
      if(!(win>0))win=Tf+R;
      render();
      var s=(1-pd.get()/100)*(1-pa.get()/100),eta0=Tf/(Tf+R),ET=(1/s-1)*To+Tf+R,etaSim=20*Tf/res.end;
      var big=_w05_saw(U,1000,Tf,R,To,pd.get()/100,pa.get()/100,sq.get()===0,seed+1000);
      var etaBig=1000*Tf/big.end;
      var warn=To<=Tf+R?'<span class="warn">T_o が T_f + RTT（'+F.time((Tf+R)/1000)+'）より短いので、失われていなくても再送する。</span><br>':"";
      ro.innerHTML=warn+"送ったデータ <b>"+res.tx+"</b>（うち再送 "+res.resend+"）・ 受け手が受け取ったメッセージ <b>"+res.uniq+" / 20</b>"+
        (sq.get()===0?" ・ 重複として捨てた <b>"+res.dupDrop+"</b> ・ 古い ACK を捨てた "+res.staleAck:
          " ・ <span class=\"warn\">重複して渡した "+res.dupDeliv+"</span> ・ <span class=\"warn\">ACK を取り違えた "+res.wrongAck+"</span>"+(res.lost?' ・ <span class="warn">気づかれずに失われた '+res.lost+"</span>":""))+"<br>"+
        "全部の ACK が届くまで "+F.time(res.end/1000)+" ・ 効率（この 20 個）"+U.sig(etaSim*100,3)+" % ・ 1000 個で測ると "+U.sig(etaBig*100,3)+" %"+
        (sq.get()===1&&big.wrongAck>0?'（取り違えた ACK で先へ進むので、見かけだけの値）':"")+"<br>"+
        "式: 喪失なし T_f / (T_f + RTT) = "+U.sig(eta0*100,3)+" %"+(To>Tf+R?" ・ 喪失あり T_f / E[T] = "+U.sig(Tf/ET*100,3)+" %（s = "+U.sig(s,4)+"、E[T] = "+F.time(ET/1000)+"）":" ・ 喪失ありの式は T_o > T_f + RTT のときだけ使える");
    }
    function render(){
      var o=[],xs=150,xr=520,y0=44,H=470,sc=H/win,Y=function(t){return y0+Math.min(t,win)*sc;};
      o.push(S.RECT(xs-42,8,84,26,7,U.soft("signal"),"signal",1.3));o.push(S.T(xs,25,"送り手","middle",11,"signal",true));
      o.push(S.RECT(xr-42,8,84,26,7,U.soft("green"),"green",1.3));o.push(S.T(xr,25,"受け手","middle",11,"green",true));
      o.push(S.L(xs,34,xs,y0+H+6,"signal",1.2,"3 4"));o.push(S.L(xr,34,xr,y0+H+6,"green",1.2,"3 4"));
      var lim=cursor==null?win:cursor;
      res.log.forEach(function(g){
        if(g.m>=SHOW||g.t0>lim)return;
        var tEnd=Math.min(g.t1!=null?g.t1:g.t0,lim),frac=g.t1!=null&&g.t1>g.t0?(tEnd-g.t0)/(g.t1-g.t0):1;
        if(g.k==="to"){o.push(S.L(xs-26,Y(g.t0),xs,Y(g.t0),"teal",1.6));o.push(S.T(xs-30,Y(g.t0)+4,"時間切れ","end",9,"teal",true));return;}
        var data=g.k==="data",x1=data?xs:xr,x2=data?xr:xs,c=data?(g.re?"purple":"signal"):"green";
        var xe=x1+(x2-x1)*frac,ye=Y(g.t0)+(Y(g.t1)-Y(g.t0))*frac;
        var lab=data?((g.re?"再送 ":"")+"#"+(g.m+1)+(sq.get()===0?"（"+g.seq+"）":"")):("ACK"+(sq.get()===0?" "+g.seq:""));
        if(g.lost){var fx=x1+(x2-x1)*0.55,fy=Y(g.t0)+(Y(g.t1)-Y(g.t0))*0.55;if(frac>=0.55){o.push(S.L(x1,Y(g.t0),fx,fy,"alias",1.5,"5 3"));o.push(S.X(fx,fy,5,"alias",2));}else o.push(S.L(x1,Y(g.t0),xe,ye,"alias",1.5,"5 3"));}
        else if(frac>=1)o.push(S.ARR(x1,Y(g.t0),x2,Y(g.t1),c,1.5,6));else o.push(S.L(x1,Y(g.t0),xe,ye,c,1.5));
        if(frac>=0.5){var lx=(x1+x2)/2,ly=(Y(g.t0)+Y(g.t1))/2;o.push(S.T(lx+(data?0:0),ly-4,lab,"middle",9,g.lost?"alias":c,data));}
        if(frac>=1&&!g.lost){
          if(data){var t2=g.res==="new"?"受け取る":g.res==="drop"?"重複 → 捨てる":g.res==="dupdeliv"?"重複を渡す ×":"";
            if(t2)o.push(S.T(xr+8,Y(g.t1)+3,t2,"start",9,g.res==="new"?"green":(g.res==="drop"?"gold":"alias"),g.res!=="new"));}
          else{var t3=g.res==="stale"?"古い ACK → 捨てる":g.res==="wrong"?"ACK を取り違え ×":"";
            if(t3)o.push(S.T(xs-8,Y(g.t1)+3,t3,"end",9,g.res==="stale"?"muted":"alias",g.res==="wrong"));}
        }
      });
      if(cursor!=null)o.push(S.L(60,Y(cursor),660,Y(cursor),"faint",1,"2 3"));
      o.push(S.T(350,y0+H+24,"時間は下へ進む（0 から "+U.fmt.time(win/1000)+" まで。最初の "+SHOW+" 個のメッセージ）","middle",9.5,"muted"));
      box.set(S.svg(700,y0+H+32,o));
    }
    draw();
  };

  /* ---- デモ 3: 一斉の再接続 ---- */
  function _w05_heap(){var a=[];return {size:function(){return a.length;},
    push:function(x){a.push(x);var i=a.length-1;while(i>0){var p=(i-1)>>1;if(a[p][0]<a[i][0]||(a[p][0]===a[i][0]&&a[p][1]<=a[i][1]))break;var t=a[p];a[p]=a[i];a[i]=t;i=p;}},
    pop:function(){var top=a[0],last=a.pop();if(a.length){a[0]=last;var i=0;for(;;){var l=2*i+1,r=l+1,m=i;
      if(l<a.length&&(a[l][0]<a[m][0]||(a[l][0]===a[m][0]&&a[l][1]<a[m][1])))m=l;if(r<a.length&&(a[r][0]<a[m][0]||(a[r][0]===a[m][0]&&a[r][1]<a[m][1])))m=r;
      if(m===i)break;var t=a[m];a[m]=a[i];a[i]=t;i=m;}}return top;}};}
  function _w05_storm(U,N,C,Td,b,cap,pol,seed,horizon){
    var r=U.rng(seed),h=_w05_heap();
    function wait(k){var w=pol===0?b:Math.min(cap,b*Math.pow(2,k));return pol===2?r.next()*w:w;}
    for(var i=0;i<N;i++)h.push([wait(0),i,0]);
    var att={},ok={},used={},last=0,total=0,maxAfter=0,done=0;
    while(h.size()){var e=h.pop(),t=e[0];if(t>horizon){h.push(e);break;}
      var bk=Math.floor(t);att[bk]=(att[bk]||0)+1;total++;
      if(t>=Td&&(used[bk]||0)<C){used[bk]=(used[bk]||0)+1;ok[bk]=(ok[bk]||0)+1;last=t;done++;continue;}
      h.push([t+wait(e[2]+1),e[1],e[2]+1]);}
    for(var k in att)if(+k>=Td&&att[k]>maxAfter)maxAfter=att[k];
    return {att:att,ok:ok,last:last,total:total,done:done,left:N-done,maxAfter:maxAfter};
  }
  REG.w05_storm=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BACKOFF","止まったサーバに、多くの機器が一斉につながり直す");
    var row=U.ctrls(el);
    var nn=U.slider(row,"台数 N",{min:10,max:2000,value:1000,log:true,snap:function(v){return Math.round(v);},fmt:function(v){return Math.round(v)+" 台";},onInput:draw});
    var td=U.slider(row,"サーバが止まる時間",{min:0,max:120,step:5,value:30,fmt:function(v){return v+" s";},onInput:draw});
    var cc=U.slider(row,"受け付けられる数 C",{min:5,max:500,value:50,log:true,snap:function(v){return Math.round(v);},fmt:function(v){return Math.round(v)+" 件/s";},onInput:draw});
    var rp=U.ctrls(el),cp0=U.mk("div","ctrl",'<label><span>方式</span></label>');cp0.style.flex="1 1 100%";rp.appendChild(cp0);
    var pol=U.seg(cp0,["固定の間隔","指数バックオフ","指数バックオフ + 全部をランダムに"],2,draw);
    var row2=U.ctrls(el);
    var bb=U.slider(row2,"最初の待ち時間 b",{min:0.5,max:10,step:0.5,value:1,fmt:function(v){return v+" s";},onInput:draw});
    var cp=U.slider(row2,"上限 c",{min:2,max:300,value:64,log:true,snap:function(v){return Math.round(v);},fmt:function(v){return Math.round(v)+" s";},onInput:draw});
    var ys=U.select(row2,"縦軸",["自動","200 件/s で切る（拡大）"],0,draw);
    var br=U.btnrow(el); var seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var N=Math.round(nn.get()),C=Math.round(cc.get()),Td=td.get(),b=bb.get(),cap=Math.max(cp.get(),b),P=pol.get(),HZ=3600;
      var r=_w05_storm(U,N,C,Td,b,cap,P,seed,HZ);
      var tEnd=r.left?HZ:Math.max(r.last,Td+5);
      var span=Math.max(10,Math.ceil(tEnd*1.05/10)*10),bw=Math.max(1,Math.ceil(span/240));
      var bars=[],ymax=1;
      for(var t0=0;t0<span;t0+=bw){var a=0,g=0;for(var k=t0;k<t0+bw;k++){a=Math.max(a,r.att[k]||0);g=Math.max(g,r.ok[k]||0);}bars.push([t0,a,g]);if(a>ymax)ymax=a;}
      var clip=ys.get()===1,yTop=clip?200:Math.max(10,U.nice(0,ymax*1.08,4).slice(-1)[0]);
      if(yTop<ymax*1.0001&&!clip)yTop=ymax*1.1;
      var o=[],p=U.plot(70,20,600,220,[0,span],[0,yTop]);
      o.push(S.RECT(p.X(0),p.y,p.X(Math.min(Td,span))-p.X(0),p.h,0,"var(--muted-soft)","none",0));
      o.push(p.axes({xl:"時刻 [s]（灰色: サーバが止まっている間）",yl:"1 秒あたりの試み"+(bw>1?"（"+bw+" 秒ごとの最大）":""),xfmt:function(v){return String(v);},yfmt:function(v){return String(Math.round(v));}}));
      bars.forEach(function(q){var x=p.X(q[0]),w=Math.max(0.6,p.X(q[0]+bw)-x-0.6),a=Math.min(q[1],yTop),g=Math.min(q[2],yTop);
        if(q[1]>0)o.push(S.RECT(x+0.3,p.Y(a),w,p.Y(0)-p.Y(a),0,U.soft("alias"),"alias",0.6));
        if(q[2]>0)o.push(S.RECT(x+0.3,p.Y(g),w,p.Y(0)-p.Y(g),0,U.soft("green"),"green",0.6));});
      if(C<=yTop)o.push(S.L(p.x,p.Y(C),p.x+p.w,p.Y(C),"green",1.1,"4 3"));
      var lx=70;[["green","つながった試み"],["alias","断られた試み"]].forEach(function(q){o.push(S.RECT(lx,281,10,10,2,U.soft(q[0]),q[0],1.2));o.push(S.T(lx+15,290,q[1],"start",9.5,"muted"));lx+=15+U.tw(q[1],9.5)+18;});
      o.push(S.L(lx,286,lx+22,286,"green",1.2,"4 3"));o.push(S.T(lx+28,290,"サーバが 1 秒に受け付けられる数 C = "+C+" 件","start",9.5,"muted"));
      if(!r.left){var xl=p.X(r.last),rt=xl>560;o.push(S.L(xl,p.y,xl,p.y+p.h,"signal",1.4,"5 3"));o.push(S.T(xl+(rt?-4:4),p.y+12,"全台がつながった",rt?"end":"start",9.5,"signal",true));}
      if(clip&&ymax>200)o.push(S.T(p.x+4,p.y+12,"200 件を超える所は切っている","start",9.5,"alias"));
      box.set(S.svg(700,300,o));
      var per=r.total/N;
      ro.innerHTML=(r.left?'<span class="warn">1 時間たっても '+r.left+' 台がつながっていない。</span>':"全台がつながった時刻 <b>"+U.sig(r.last,4)+" s</b>（サーバが戻ってから "+U.sig(r.last-Td,3)+" s）")+"<br>"+
        "サーバに届いた試みの合計 <b>"+U.fmt.int(r.total)+" 件</b>（1 台あたり "+U.sig(per,3)+" 回）・ サーバが戻った後の 1 秒あたりの最大 "+r.maxAfter+" 件"+
        '<div class="wnote">モデル: 全台が 0 s に切断に気づき、最初の待ち時間の後に 1 回目を試みる（固定の方式では b を間隔に使う）。サーバは戻った後、1 秒ごとの区切りに '+C+' 件まで受け付け、それを超える試みと止まっている間の試みは断る（断られた機器はすぐ次の待ちに入る）。</div>';
    }
    draw();
  };

  /* ---- デモ 4: ウォッチドッグをどこでキックするか ---- */
  REG.w05_wdt=function(el,U){
    var S=U.S;
    U.head(el,"WATCHDOG","キックする場所と、起こした故障で、リセットされるかを見る");
    function segRow(label,opts,v){var r=U.ctrls(el),c=U.mk("div","ctrl",'<label><span>'+label+'</span></label>');c.style.flex="1 1 100%";r.appendChild(c);return U.seg(c,opts,v,draw);}
    var place=segRow("キックする場所",["タイマ割り込み","アイドルタスク","監視（チェックイン）","監視 + 手順の進み具合"],3);
    var fail=segRow("3 s に起こす故障",["なし","CPU ごと止まる","通信タスクの無限ループ","通信タスクが永久に待つ","手順が進まない"],2);
    var box=U.svgbox(el); var ro=U.readout(el);
    var TF=3,TW=1,PS=0.25,MB=1,TEND=8,DT=0.05;
    function draw(){
      var pl=place.get(),f=fail.get();
      var X=function(t){return 150+(684-150)*t/TEND;};
      var o=[],rows=[["タイマ割り込み",30,"gold"],["通信タスク（優先度 高）",58,"signal"],["センサのタスク（中）",86,"purple"],["監視タスク（低）",114,"green"],["アイドルタスク（最低）",142,"muted"],["キック",170,"teal"]];
      rows.forEach(function(q){o.push(S.T(142,q[1]+4,q[0],"end",10,q[2],true));o.push(S.L(150,q[1],684,q[1],"grid",1));});
      var left=TW,resetAt=null,alive={c:0,s:0},stuck=null,kicks=[],pts=[[0,TW]],lastK=0;
      var commSince=null;
      for(var i=0;i<Math.round(TEND/DT);i++){
        var t=i*DT,tn=+(t+DT).toFixed(6);if(resetAt!=null)break;
        var failed=f!==0&&t>=TF-1e-9,cpuHalt=failed&&f===1,loop=failed&&f===2,block=failed&&f===3,noProg=failed&&f===4;
        var tick=Math.abs(t*10-Math.round(t*10))<1e-6;
        /* タイマ割り込み */
        if(!cpuHalt&&tick){o.push(S.L(X(t),25,X(t),35,"gold",1.2));if(pl===0)kicks.push(t);}
        /* 通信タスク: 0.1 s ごとに動く（無限ループなら CPU を使い続ける） */
        var commRuns=!cpuHalt&&!block&&(loop||tick);
        if(loop&&!cpuHalt)o.push(S.RECT(X(t),52,X(tn)-X(t),12,0,U.soft("alias"),"alias",0.5));
        else if(commRuns&&tick){o.push(S.RECT(X(t),52,3,12,0,U.soft("signal"),"signal",1));
          var inWait=noProg?true:((t%1)>=0.3&&(t%1)<0.36);   /* 正常時は毎秒 0.3 s から短い間だけ応答待ち */
          if(inWait){if(commSince==null)commSince=t;}else commSince=null;
          var progOK=!(pl===3&&commSince!=null&&t-commSince>=MB-1e-9);
          if(progOK)alive.c=1;}
        /* センサのタスク: 0.2 s ごと（無限ループの間は CPU がもらえない） */
        var other=!cpuHalt&&!loop;
        if(other&&Math.abs(t*5-Math.round(t*5))<1e-6){o.push(S.RECT(X(t),80,3,12,0,U.soft("purple"),"purple",1));alive.s=1;}
        /* 監視タスク: 0.25 s ごと */
        if(other&&Math.abs(t*4-Math.round(t*4))<1e-6){
          o.push(S.RECT(X(t),108,3,12,0,U.soft("green"),"green",1));
          if(pl>=2){if(alive.c&&alive.s)kicks.push(t);alive.c=0;alive.s=0;}}
        /* アイドル: ほかのタスクが動いていない間 */
        if(other){o.push(S.RECT(X(t)+3,137,X(tn)-X(t)-3,10,0,"var(--muted-soft)","muted",0.5));if(pl===1&&tick)kicks.push(t);}
        /* ウォッチドッグの残り */
        var k=kicks.length&&Math.abs(kicks[kicks.length-1]-t)<1e-9;
        if(k){pts.push([t,left]);left=TW;pts.push([t,TW]);lastK=t;o.push(S.D(X(t),170,"teal",3));}
        left-=DT;
        if(left<=1e-9){resetAt=tn;pts.push([tn,0]);}
      }
      if(resetAt==null)pts.push([TEND,Math.max(0,left)]);
      if(f===3&&TF<TEND)o.push(S.T(X(TF)+6,62,"眠ったまま（来ない合図を待つ）","start",9,"muted"));
      if(f===4)o.push(S.T(X(TF)+30,48,"ループは回るが、状態機械は応答待ちのまま","start",9,"alias"));
      if(f!==0){o.push(S.L(X(TF),20,X(TF),268,"alias",1.2,"4 3"));o.push(S.T(X(TF)+3,16,"故障","start",9.5,"alias",true));}
      var p=U.plot(150,190,534,70,[0,TEND],[0,1.1]);
      o.push(p.axes({xt:[0,1,2,3,4,5,6,7,8],yt:[0,0.5,1],xfmt:function(v){return v+" s";},yfmt:function(v){return String(v);},sz:9}));
      o.push(S.T(126,220,"ウォッチドッグ","end",10,"gold",true));o.push(S.T(126,234,"の残り時間 [s]","end",10,"gold",true));
      o.push(p.line(pts,"gold",2));
      if(resetAt!=null){var rr=resetAt>6.5;o.push(S.D(p.X(resetAt),p.Y(0),"alias",5));o.push(S.T(p.X(resetAt)+(rr?-8:8),p.Y(0)-8,"リセット",rr?"end":"start",10.5,"alias",true));}
      box.set(S.svg(700,284,o));
      var PL=["タイマ割り込み","アイドルタスク","監視タスク（チェックイン）","監視タスク（手順の進み具合も確かめる）"];
      var why=["",
        "CPU ごと止まると、割り込みもタスクも動かないので、どこでキックしていても止まる。",
        pl===0?"タイマ割り込みは、通信タスクが CPU を使い続けても動くので、キックし続けてしまう。":"通信タスクが CPU を使い続けると、優先度の低いタスクとアイドルタスクが動けず、キックが止まる。",
        pl<=1?"通信タスクは眠ったまま待っているので、CPU は空いており、"+(pl===0?"タイマ割り込み":"アイドルタスク")+"はキックし続ける。":"通信タスクがチェックインしなくなるので、監視タスクはキックしない。",
        pl<=2?"通信タスクのループは回り、チェックインもするので、手順が止まっていることに気づかない。":"状態機械が応答待ちに 1 s を超えていると、通信タスクがチェックインしなくなる。"];
      ro.innerHTML="キックする場所: <b>"+PL[pl]+"</b> ・ "+(f===0?"故障なし: ":"")+(resetAt!=null?'<span class="warn">'+(f===0?"誤ってリセットされた":"検出した")+"</span>: 故障から "+U.sig(resetAt-TF,3)+" s 後にリセット（最後のキックから 1 s）":(f===0?'<span class="ok">リセットされない（正常）</span>':'<span class="warn">検出しない</span>: 8 s までキックが続き、機器は止まったまま'))+
        (why[f]?"<br>"+why[f]:"")+'<div class="wnote">ウォッチドッグの時間 1 s、監視の周期 0.25 s。通信タスクは 0.1 s ごと、センサのタスクは 0.2 s ごとに仕事をする。「手順の進み具合」では、通信タスクは待機以外の状態に 1 s を超えているとチェックインしない。</div>';
    }
    draw();
  };
