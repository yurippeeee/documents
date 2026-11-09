  /* ===== 02 章 設計書の書き方 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w02_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w02_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";return v.toFixed(d).replace("-","−");}
  /* 有効数字を見て桁を決める（µA の小さな値を読めるように） */
  function _w02_ua(v){if(v>=1)return _w02_f(v,2);if(v>=0.01)return _w02_f(v,3);return _w02_f(v,4);}
  /* 3 桁ごとに空白を入れた整数（66 800 など） */
  function _w02_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}

  /* ---- 4 節: 中の状態遷移表 ---- */
  var _W02_ST=["停止中","待ち","測定中","書き込み中"],_W02_EV=["長押し","記録の時刻","測定の完了","応答なし","書き込みの完了"];
  /* マスの処理。t は表に書く短い文字（1 行 7 文字まで）、d は読み出しに書く説明、x は起きない理由（起きないマス）、no は決めていないマス */
  var _W02_CELL={
    "0,0":[{t:["記録を始め、","すぐ測る","→ 測定中"],d:"記録を始める（RTC を設定し、開始の応答をする）。すぐに 1 件目の測定の命令を送り、5 ms のタイマを掛ける → 測定中（記録が容量に達していて止める設定のときは、停止の応答だけをする）"}],
    "1,0":[{t:["記録を止める","→ 停止中"],d:"記録を止める（RTC を止め、停止の応答をする）→ 停止中"}],
    "1,1":[{t:["測定の命令","→ 測定中"],d:"測定の命令を送り、5 ms のタイマを掛ける → 測定中"}],
    "2,0":[{t:["止める印を","立てる"],d:"止める印を立てる（測定と書き込みを終えてから止める）"},
           {t:["すぐ","→ 停止中"],d:"すぐ停止中へ（RTC を止め、停止の応答をする。測定のタイマはそのまま）"},
           {t:["（空き）"],d:"（決めていない）",no:true}],
    "2,2":[{t:["結果から 1 件","→ 書き込み中"],d:"結果を読み、1 件を書き始める → 書き込み中"}],
    "2,3":[{t:["測定異常の","1 件","→ 書き込み中"],d:"測定異常の印を付けた 1 件を書き始める → 書き込み中"},
           {t:["何も書かず","→ 待ち"],d:"何も書かずに → 待ち"},
           {t:["（空き）"],d:"（決めていない）",no:true}],
    "3,0":[{t:["止める印を","立てる"],d:"止める印を立てる（書き込みを終えてから止める）"},
           {t:["すぐ","→ 停止中"],d:"すぐ停止中へ（RTC を止め、停止の応答をする。書き込みの完了は待たない）"},
           {t:["（空き）"],d:"（決めていない）",no:true}],
    "3,4":[{t:["眠らせる","印なし → 待ち","印 → 停止中"],d:"フラッシュを眠らせる。止める印があれば停止の応答をして → 停止中、無ければ → 待ち"},
           {t:["眠らせずに","→ 待ち"],d:"フラッシュを眠らせずに → 待ち（止める印も見ない）"}]
  };
  var _W02_WHY={"0,1":"RTC を止めてある","0,2":"タイマを掛けていない","0,3":"タイマを掛けていない","0,4":"書いていない","1,2":"タイマを掛けていない","1,3":"タイマを掛けていない","1,4":"書いていない",
    "2,1":"記録の間隔は 1 分以上","2,4":"書いていない","3,1":"記録の間隔は 1 分以上","3,2":"タイマを掛けていない","3,3":"タイマを掛けていない"};
  var _W02_EDIT=[["2,0","測定中 × 長押し"],["3,0","書き込み中 × 長押し"],["2,3","測定中 × 応答なし"],["3,4","書き込み中 × 書き込みの完了"]];
  var _W02_SEQ=[
    {n:"普通の記録（2 回測って止める）",e:[0,2,4,1,2,4,0]},
    {n:"書き込み中に長押し",e:[0,2,4,1,2,0,4,1]},
    {n:"測定中に長押し",e:[0,2,4,1,0,2,4,1]},
    {n:"センサが応答しない",e:[0,3,4,1,2,4]}];
  REG.w02_fsm=function(el,U){
    var S=U.S;
    U.head(el,"STATE TABLE","中の状態遷移表 — マスの処理と出来事の列で、状態の動きを 1 つずつ確かめる");
    var r1=U.ctrls(el);
    var seqSel=U.select(r1,"出来事の列",_W02_SEQ.map(function(q){return q.n;}),0,function(){reset();draw();});
    var cellSel=U.select(r1,"処理を変えるマス",_W02_EDIT.map(function(q){return q[1];}),0,function(){fillOpts();});
    var optSel=U.select(r1,"そのマスの処理",["—"],0,function(){choice[_W02_EDIT[cellSel.get()][0]]=+optSel.input.value;reset();draw();});
    var br=U.btnrow(el);
    U.button(br,"1 つ進める",function(){step();draw();});
    U.button(br,"最後まで",function(){while(pos<seq().length)step();draw();});
    U.button(br,"最初から",function(){reset();draw();});
    U.button(br,"本文の例",function(){choice={};seqSel.set(0);cellSel.set(0);fillOpts();reset();draw();});
    var box=U.svgbox(el),ro=U.readout(el),choice={},sim,pos,log,lastT=null,lastCell=null,geo=[];
    function seq(){return _W02_SEQ[seqSel.get()].e;}
    function opt(key){var a=_W02_CELL[key];if(!a)return null;return a[choice[key]||0];}
    function fillOpts(){var key=_W02_EDIT[cellSel.get()][0],s=optSel.input;while(s.firstChild)s.removeChild(s.firstChild);
      _W02_CELL[key].forEach(function(o,i){var op=document.createElement("option");op.value=i;op.textContent=o.d;s.appendChild(op);});s.value=choice[key]||0;}
    function reset(){sim={st:0,rtc:false,timer:false,writing:false,stop:false,awake:false,warned:false,recs:0,miss:0,led:"—"};pos=0;log=[];lastT=null;lastCell=null;}
    /* 出来事が今の状況で起こりうるか */
    function can(e){if(e===0)return true;if(e===1)return sim.rtc;if(e===2||e===3)return sim.timer;if(e===4)return sim.writing;return false;}
    function why(e){return e===1?"RTC が止まっている":(e===4?"書き込みをしていない":"測定のタイマが掛かっていない");}
    function step(){
      var sq=seq();if(pos>=sq.length)return;var e=sq[pos++],s0=sim.st,key=s0+","+e,line={i:pos,s:_W02_ST[s0],e:_W02_EV[e],d:"",w:[]};
      if(!can(e)){line.d="（"+why(e)+"ので、この出来事は起きない）";line.skip=true;log.push(line);lastT=null;lastCell=null;return;}
      lastCell=key;
      if(e===2||e===3)sim.timer=false;
      if(e===4){sim.writing=false;sim.recs++;}
      var o=opt(key);
      if(!o){line.d="起きないとしたマス（"+(_W02_WHY[key]||"")+"）に、イベントが届いた";
        line.w.push(s0===0?"表の前提が崩れた。タイマや書き込みを止めないまま停止中に移ったので、その完了が後から届いた":"表の前提が崩れた。前の測定が終わらないまま、次の記録の時刻が来た（この記録は取られない）");
        log.push(line);lastT=null;check(line);return;}
      if(o.no){line.d="マスが空いている（決めていない）ので、イベントは捨てられた";
        if(e===0)line.w.push("長押しが無視された。利用者は止めたつもりでも、記録は続く（SR-F06・SR-U07 を満たさない）");
        if(e===3)line.w.push("応答なしの後の動きが無く、測定中のまま止まる。次の記録の時刻からも動けない");
        log.push(line);lastT=null;check(line);return;}
      line.d=o.d;var to=s0;
      if(key==="0,0"){sim.rtc=true;sim.timer=true;sim.led="開始の応答（緑 3 回）";to=2;}
      else if(key==="1,0"){sim.rtc=false;sim.led="停止の応答（赤 3 回）";to=0;}
      else if(key==="1,1"){sim.timer=true;to=2;}
      else if(key==="2,0"||key==="3,0"){var c=choice[key]||0;if(c===0)sim.stop=true;else{sim.rtc=false;sim.led="停止の応答（赤 3 回）";to=0;
          if(key==="2,0")line.w.push("測定のタイマが掛かったまま停止中に移った。5 ms 後に、停止中で「測定の完了」が届く");
          else{line.w.push("書き込みの途中で停止中に移った。書き込みの完了を待たないので、フラッシュを眠らせる処理が行われない");}}}
      else if(key==="2,2"){sim.writing=true;sim.awake=true;to=3;}
      else if(key==="2,3"){var c3=choice[key]||0;if(c3===0){sim.writing=true;sim.awake=true;sim.miss++;to=3;}else{to=1;line.w.push("記録が 1 件抜けた。アプリからは、測らなかったのか測れなかったのかが分からない（SR-F03）");}}
      else if(key==="3,4"){var c4=choice[key]||0;if(c4===0){sim.awake=false;if(sim.stop){sim.stop=false;sim.rtc=false;sim.led="停止の応答（赤 3 回）";to=0;}else to=1;}
        else{to=1;if(sim.stop)line.w.push("止める印を見ないので、長押しで止めたはずの記録が続く");sim.stop=false;}}
      sim.st=to;line.to=_W02_ST[to];lastT=[s0,to,key];log.push(line);check(line);}
    function check(line){if(sim.awake&&(sim.st===0||sim.st===1)&&!sim.writing&&!sim.warned){sim.warned=true;line.w.push("フラッシュが眠っていない（スタンバイ 25 µA）。5 節の予算で、寿命が 4.9 年から 0.72 年になる");}}
    /* ---- 描く ---- */
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],sq=seq();
      /* 出来事の列 */
      o.push(S.T(8,16,"出来事の列","start",10,"ink",true));
      var xx=nar?8:76,yy=nar?24:8;
      sq.forEach(function(e,i){var t=(i+1)+" "+_W02_EV[e],w=U.tw(t,9.5)+10;if(xx+w>Wd-6){xx=nar?8:76;yy+=22;}
        var cur=i===pos-1,done=i<pos-1;o.push(S.RECT(xx,yy,w,18,4,cur?U.soft("gold"):(done?"var(--screen)":"panel"),cur?"gold":"line",cur?1.6:1));
        o.push(S.T(xx+w/2,yy+13,t,"middle",9.5,cur?"gold":(done?"muted":"ink"),cur));xx+=w+4;});
      /* 表 */
      var tx=8,ty=yy+30,c0=nar?60:96,cw=nar?66:118,rh=46,hh=26;geo=[];
      o.push(S.RECT(tx,ty,c0,hh,0,"var(--screen)","line",1));o.push(S.T(tx+c0/2,ty+17,"状態＼イベント","middle",nar?8.5:9.5,"muted",true));
      _W02_EV.forEach(function(e,j){var x=tx+c0+j*cw;o.push(S.RECT(x,ty,cw,hh,0,"var(--screen)","line",1));o.push(S.T(x+cw/2,ty+17,e,"middle",nar?8.5:9.5,"ink",true));});
      _W02_ST.forEach(function(s,i){var y=ty+hh+i*rh,cur=sim.st===i;
        o.push(S.RECT(tx,y,c0,rh,0,cur?U.soft("purple"):"panel","line",1));o.push(S.T(tx+c0/2,y+rh/2+4,s,"middle",10,"purple",true));
        _W02_EV.forEach(function(e,j){var x=tx+c0+j*cw,key=i+","+j,op=opt(key),lines,col="ink",fill="none";
          if(!op){lines=["起きない"];col="faint";}
          else if(op.no){lines=op.t;col="alias";fill=U.soft("alias");}
          else{lines=op.t;if(choice[key])col="gold";}
          var ed=_W02_EDIT.some(function(q){return q[0]===key;});
          if(ed&&!op.no&&!choice[key])fill=U.soft("green");
          o.push(S.RECT(x,y,cw,rh,0,fill,"line",1));
          var lh=12,y0=y+rh/2-(lines.length-1)*lh/2+3.5;lines.forEach(function(l,k){o.push(S.T(x+cw/2,y0+k*lh,l,"middle",nar?8.5:9.5,col,col!=="faint"&&col!=="ink"));});
          if(ed)geo.push({x:x,y:y,w:cw,h:rh,key:key});});});
      if(lastCell){var p=lastCell.split(",");o.push(S.RECT(tx+c0+(+p[1])*cw+1.5,ty+hh+(+p[0])*rh+1.5,cw-3,rh-3,2,"none","gold",2.6));}
      var tb=ty+hh+4*rh;
      o.push(S.T(tx,tb+15,"緑: 処理を変えられるマス（本文の表のとおり）　金: 変えたマス　赤: 空いたマス","start",9.5,"muted"));
      /* 状態遷移図（表から描く）と、仕様から見た様子 */
      var dy=tb+28,dx=nar?8:8,dw=nar?384:430,P={0:[dx+50,dy+70],1:[dx+165,dy+110],2:[dx+265,dy+44],3:[dx+350,dy+110]};
      o.push(S.RECT(dx,dy,dw,160,6,"var(--screen)","line",1));
      o.push(S.T(dx+8,dy+16,"表から描いた状態遷移図","start",10,"ink",true));
      var arrows=[];function add(a,b,lab,key){arrows.push([a,b,lab,key]);}
      add(0,2,"長押し","0,0");add(1,0,"長押し","1,0");add(1,2,"記録の時刻","1,1");
      if(!opt("2,0").no&&(choice["2,0"]||0)===1)add(2,0,"長押し","2,0");
      add(2,3,"測定の完了","2,2");var c23=choice["2,3"]||0;if(c23===0)add(2,3,"","2,3");if(c23===1)add(2,1,"応答なし","2,3");
      if((choice["3,0"]||0)===1)add(3,0,"長押し","3,0");
      add(3,1,"書き込みの完了","3,4");if((choice["3,4"]||0)===0)add(3,0,"完了（印）","3,4");
      arrows.forEach(function(a){var A=P[a[0]],B=P[a[1]],hl=lastT&&lastT[2]===a[3]&&lastT[0]===a[0]&&lastT[1]===a[1],c=hl?"gold":"purple",lw=hl?2.6:1.3;
        if(a[0]===3&&a[1]===0){var low=a[3]==="3,4",ym=dy+(low?180:165),x0p=A[0]-6,y0p=A[1]+13,x1p=B[0]+(low?-8:8),y1p=B[1]+13,cx=(x0p+x1p)/2;
          o.push(S.PATH("M"+x0p+","+y0p+" Q"+cx+","+ym+" "+x1p+","+y1p,c,lw));o.push(S.head(cx,ym,x1p,y1p,c,6));
          o.push(S.T(low?dx+175:dx+290,low?dy+150:dy+129,a[2],"middle",9,c,hl,false,null,true));return;}
        if(a[0]===2&&a[1]===0){var pth="M"+(A[0]-34)+","+(A[1]-4)+" Q"+(A[0]-130)+","+(A[1]-30)+" "+(B[0]+10)+","+(B[1]-13);o.push(S.PATH(pth,c,lw));o.push(S.head(A[0]-130,A[1]-30,B[0]+10,B[1]-13,c,6));
          o.push(S.T(A[0]-110,A[1]-24,"長押し","middle",9,c,hl,false,null,true));return;}
        var fw=a[0]<a[1],Pp=fw?A:B,Qq=fw?B:A,L=Math.hypot(Qq[0]-Pp[0],Qq[1]-Pp[1])||1,cx_=(Qq[0]-Pp[0])/L,cy_=(Qq[1]-Pp[1])/L,off=fw?-7:7,nx=-cy_*off,ny=cx_*off;
        var ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L,x1=A[0]+ux*34+nx,y1=A[1]+uy*14+ny,x2=B[0]-ux*34+nx,y2=B[1]-uy*14+ny;
        o.push(S.ARR(x1,y1,x2,y2,c,lw,6));
        if(a[2]){var up=(a[0]===3&&a[1]===1),mx=(x1+x2)/2+(up?0:nx*1.9),my=up?(y1+y2)/2-6:(y1+y2)/2+ny*1.9+3;o.push(S.T(mx,my,a[2],"middle",9,c,hl,false,null,true));}});
      _W02_ST.forEach(function(s,i){var q=P[i],cur=sim.st===i;o.push(S.RECT(q[0]-34,q[1]-13,68,26,10,cur?U.soft("gold"):U.soft("purple"),cur?"gold":"purple",cur?2.4:1.3));o.push(S.T(q[0],q[1]+4,s,"middle",10,cur?"gold":"purple",true));});
      /* 仕様から見た様子 */
      var sx=nar?8:448,sy=nar?dy+170:dy,sw=nar?384:244;
      o.push(S.RECT(sx,sy,sw,160,6,"var(--screen)","signal",1.1));
      o.push(S.T(sx+8,sy+16,"仕様から見た様子","start",10,"signal",true));
      var mode=sim.st===0?"停止中":"記録中";
      o.push(S.T(sx+8,sy+38,"主のモード","start",9.5,"muted"));o.push(S.T(sx+86,sy+38,mode,"start",11,"signal",true));
      o.push(S.T(sx+8,sy+60,"LED（最後）","start",9.5,"muted"));o.push(S.T(sx+86,sy+60,sim.led,"start",10,sim.led.indexOf("赤")>=0?"alias":(sim.led.indexOf("緑")>=0?"green":"ink"),true));
      o.push(S.T(sx+8,sy+82,"記録の件数","start",9.5,"muted"));o.push(S.T(sx+86,sy+82,sim.recs+" 件"+(sim.miss?"（うち測定異常 "+sim.miss+" 件）":""),"start",10,"ink",true));
      o.push(S.T(sx+8,sy+104,"フラッシュ","start",9.5,"muted"));o.push(S.T(sx+86,sy+104,sim.writing?"書き込み中":(sim.awake?"起きたまま（25 µA）":"眠っている（0.5 µA）"),"start",10,sim.awake&&!sim.writing?"alias":"ink",true));
      o.push(S.T(sx+8,sy+126,"止める印","start",9.5,"muted"));o.push(S.T(sx+86,sy+126,sim.stop?"あり":"なし","start",10,"ink",true));
      o.push(S.T(sx+8,sy+150,"進んだ数 "+pos+" / "+sq.length,"start",9.5,"muted"));
      box.set(S.svg(Wd,nar?sy+168:dy+168,o));
      /* 読み出し */
      var h="";if(!log.length)h="「1 つ進める」で、出来事の列を 1 つずつ起こす。<br>";
      log.forEach(function(l){h+=l.i+". "+l.s+" で <b>"+l.e+"</b>: "+l.d+(l.to?"　⇒ <b>"+l.to+"</b>":"")+"<br>";l.w.forEach(function(w){h+='　<span class="warn">'+w+"</span><br>";});});
      if(pos>=sq.length){var bad=log.some(function(l){return l.w.length;});h+=bad?'<span class="warn">この列では、仕様どおりに動かない所がある</span>':'<span class="ok">この列では、仕様どおりに動いた</span>';}
      ro.innerHTML=h+'<div class="wnote">表のマスは本文の中の状態遷移表と同じ。「処理を変えるマス」で選んだマスの処理を変えると、表と状態遷移図の矢印が変わる（図のマスを押しても選べる）。出来事が、今の状況では起こりえないとき（RTC を止めた後の記録の時刻など）は、飛ばして読み出しに書く。</div>';
    }
    U.ctl.drag(box,function(type,x,y){if(type!=="down")return false;for(var i=0;i<geo.length;i++){var g=geo[i];if(x>=g.x&&x<=g.x+g.w&&y>=g.y&&y<=g.y+g.h){
      var k=-1;_W02_EDIT.forEach(function(q,j){if(q[0]===g.key)k=j;});if(k>=0){cellSel.set(k);fillOpts();}}}return false;});
    fillOpts();reset();draw();
  };

  /* ---- 5 節: 電力の予算 ---- */
  var _W02_DAY=86400;
  /* s02/power2.py の budget と同じ計算。LED は表 3-5 の表示（30 秒ごとの表示・通信中の表示・状態の応答）で点く */
  function _w02_budget(p){
    var nM=1440/p.iv,act=p.act*1e-3*nM,adv=p.press*1200*2e-3,conn=p.read/7*60*0.2;
    var sen=5e-3*nM,wr=0.7e-3*nM,er=45e-3*nM/512,on=p.on*1e-3;
    var l30=_W02_DAY/30*(p.alarm?2:1)*on,lcom=(p.press*120+p.read/7*60)/2*on,lst=p.press*on;
    var it=[
      ["マイコン","眠り",p.sl*1e-3,1-(act+adv+conn)/_W02_DAY],["マイコン","動作",3.0,act/_W02_DAY],["マイコン","送信（受付）",5.0,adv/_W02_DAY],["マイコン","送信（接続）",5.0,conn/_W02_DAY],
      ["センサ","待機",0.05e-3,1-sen/_W02_DAY],["センサ","測定",0.3,sen/_W02_DAY],
      ["フラッシュ","眠り",p.fl?25e-3:0.5e-3,1-(wr+er)/_W02_DAY],["フラッシュ","書き込み",5.0,wr/_W02_DAY],["フラッシュ","消去",10.0,er/_W02_DAY],
      ["LED",p.alarm?"警報の表示":"記録中の表示",2.0,l30/_W02_DAY],["LED","通信中の表示",2.0,lcom/_W02_DAY],["LED","状態の応答",2.0,lst/_W02_DAY]];
    var tot=0;it.forEach(function(r){r.push(r[2]*r[3]*1000);tot+=r[4];});
    return {it:it,tot:tot,life:p.Q/(tot/1000)/8760,lim:p.Q/8760*1000};}
  /* 有効数字 3 桁に丸めた時間（43 200 など） */
  function _w02_h(v){if(!(v>0))return "0";var e=Math.pow(10,Math.max(0,Math.floor(Math.log10(v))-2));return _w02_g(Math.round(v/e)*e);}
  var _W02_P0={iv:10,sl:2.0,fl:0,act:1.1,on:20,press:1,read:1,alarm:0,Q:180};
  REG.w02_power=function(el,U){
    var S=U.S;
    U.head(el,"POWER BUDGET","電力の予算 — 部品の状態ごとの電流と時間の割合から、平均電流と電池寿命を求める");
    var r1=U.ctrls(el);
    var iv=U.slider(r1,"記録の間隔",{values:[1,2,5,10,15,20,30,60],value:10,fmt:function(v){return v+" 分";},onInput:draw});
    var sl=U.slider(r1,"マイコンの眠りの電流",{min:0.5,max:10,step:0.1,value:2.0,fmt:function(v){return _w02_f(v,1)+" µA";},onInput:draw});
    var act=U.slider(r1,"測定 1 回のマイコンの動作",{values:[0.5,1.1,2,5,10,20],value:1.1,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var fl=U.select(r2,"測定の後のフラッシュ",["ディープパワーダウンにする（0.5 µA）","眠らせ忘れる（スタンバイ 25 µA）"],0,draw);
    var on=U.slider(r2,"LED の 1 回の点灯",{values:[5,10,20,50,100,150,200],value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var alarm=U.select(r2,"警報の表示",["無い（SR-W02 の条件）","続く（30 秒ごとに赤を 2 回）"],0,draw);
    var r3=U.ctrls(el);
    var press=U.slider(r3,"短押しの回数",{values:[0,1,2,5,10],value:1,fmt:function(v){return "1 日に "+v+" 回";},onInput:draw});
    var read=U.slider(r3,"読み出しの回数",{values:[0,1,2,7],value:1,fmt:function(v){return "1 週間に "+v+" 回";},onInput:draw});
    var Q=U.slider(r3,"設計で使う容量 Q",{min:100,max:220,step:5,value:180,fmt:function(v){return v+" mAh";},onInput:draw});
    var br=U.btnrow(el);
    function setp(p){iv.set(p.iv);sl.set(p.sl);act.set(p.act);fl.set(p.fl);on.set(p.on);alarm.set(p.alarm);press.set(p.press);read.set(p.read);Q.set(p.Q);}
    U.button(br,"本文の例",function(){setp(_W02_P0);draw();});
    U.button(br,"フラッシュを眠らせ忘れる",function(){setp(_W02_P0);fl.set(1);draw();});
    U.button(br,"点灯を 150 ms にする",function(){setp(_W02_P0);on.set(150);draw();});
    U.button(br,"警報の表示が続く",function(){setp(_W02_P0);alarm.set(1);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var p={iv:iv.get(),sl:sl.get(),fl:fl.get(),act:act.get(),on:on.get(),alarm:alarm.get(),press:press.get(),read:read.get(),Q:Q.get()},b=_w02_budget(p);
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],n=b.it.length+1;
      var xb0=nar?150:196,xb1=nar?330:430,X=function(v){return xb0+(Math.log10(Math.max(v,1e-5))+4)/6*(xb1-xb0);},y0=30,rh=nar?19:21;
      o.push(S.T(8,16,"平均電流の内訳","start",10,"ink",true));
      [[1e-4,"0.0001"],[1e-2,"0.01"],[1,"1"],[100,"100"]].forEach(function(t){o.push(S.L(X(t[0]),y0-2,X(t[0]),y0+rh*n+2,"grid",1));o.push(S.T(X(t[0]),y0+rh*n+15,t[1],"middle",9.5,"muted"));});
      o.push(S.T((xb0+xb1)/2,y0+rh*n+30,"平均電流 [µA]（対数の目盛）","middle",9.5,"muted"));
      var mx=0,mk=0;b.it.forEach(function(r,k){if(r[4]>mx){mx=r[4];mk=k;}});
      b.it.concat([["合計","",0,0,b.tot]]).forEach(function(r,k){var y=y0+k*rh,last=k===n-1,c=last?"purple":(k===mk?"gold":"teal");
        o.push(S.T(xb0-6,y+14,r[1]?r[0]+" "+r[1]:r[0],"end",9.5,"ink",last||k===mk));
        o.push(S.RECT(xb0,y+3,Math.max(1,X(r[4])-xb0),rh-6,2,U.soft(c),c,1.1));
        o.push(S.T(X(r[4])+4,y+14,_w02_ua(r[4])+" µA","start",9.5,c,true,false,null,true));});
      var xl=X(b.lim);o.push(S.L(xl,y0-2,xl,y0+rh*n,"signal",1.6));o.push(S.T(xl-2,y0-6,"上限 "+_w02_f(b.lim,1)+" µA（1 年）","end",9.5,"signal",true,false,null,true));
      /* 電池寿命 */
      var lx=nar?20:470,ly=nar?y0+rh*n+64:46,lw=nar?340:200,Lmax=Math.max(6,Math.ceil(b.life/2)*2),XL=function(v){return lx+Math.min(v,Lmax)/Lmax*lw;},ok=b.life>=1;
      o.push(S.T(nar?8:460,ly-22,"電池寿命（Q = "+p.Q+" mAh）","start",10,"ink",true));
      o.push(S.RECT(lx,ly,Math.max(1,XL(b.life)-lx),24,3,U.soft(ok?"green":"alias"),ok?"green":"alias",1.3));
      var lt=(b.life>=1?_w02_f(b.life,1):_w02_f(b.life,2))+" 年",inside=XL(b.life)-lx>U.tw(lt,12)+12;
      o.push(S.L(XL(1),ly-8,XL(1),ly+30,"signal",1.6));o.push(S.L(XL(2),ly-8,XL(2),ly+30,"purple",1.3,"5 3"));
      o.push(S.T(inside?XL(b.life)-6:XL(b.life)+6,ly+17,lt,inside?"end":"start",12,ok?"green":"alias",true,false,null,!inside));
      o.push(S.L(lx,ly+30,lx+lw,ly+30,"muted",1));
      for(var v=0;v<=Lmax;v+=Lmax>10?4:2){o.push(S.L(XL(v),ly+30,XL(v),ly+34,"muted",1));o.push(S.T(XL(v),ly+46,String(v),"middle",9.5,"muted"));}
      o.push(S.T(lx+lw/2,ly+62,"電池寿命 [年]","middle",9.5,"muted"));
      o.push(S.LEGL(lx,ly+84,[["signal",null,"要求 1 年"],["purple","5 3","目標 2 年"]],9.5,12));
      o.push(S.T(lx,ly+106,"余裕（上限 ÷ 平均電流）"+_w02_f(b.lim/b.tot,1)+" 倍","start",10,ok?"ink":"alias",true));
      box.set(S.svg(Wd,nar?ly+116:Math.max(y0+rh*n+40,ly+116),o));
      var cond=(p.iv===10&&p.press===1&&p.read===1&&p.alarm===0);
      var h="平均電流 Ī = Σ I·d = <b>"+_w02_ua(b.tot)+" µA</b>、電池寿命 L = Q ÷ Ī = "+p.Q+" mAh ÷ "+_w02_ua(b.tot)+" µA = <b>"+_w02_h(b.tot>0?p.Q/(b.tot/1000):0)+" h = "+(b.life>=1?_w02_f(b.life,1):_w02_f(b.life,2))+" 年</b><br>";
      h+="上限 "+_w02_f(b.lim,1)+" µA（= Q ÷ 8760 h）に対する余裕 <b>"+_w02_f(b.lim/b.tot,1)+" 倍</b>。";
      if(cond)h+=(ok?(b.lim/b.tot>=2?'<span class="ok">SR-W02（1 年以上）を満たし、目標（余裕 2 倍）にも届く</span>':'<span class="ok">SR-W02 は満たす</span>が、目標の余裕 2 倍に届かない'):'<span class="warn">SR-W02（1 年以上）を満たさない</span>')+"<br>";
      else h+=(ok?"1 年以上もつ":'<span class="warn">1 年もたない</span>')+"。ただし、記録の間隔・短押し・読み出し・警報の表示のどれかが SR-W02 の使い方の条件と違うので、この寿命では SR-W02 の合否は決められない<br>";
      var slp=b.it[0][4]+b.it[4][4]+b.it[6][4],led=b.it[9][4]+b.it[10][4]+b.it[11][4];
      h+="最も大きい項目: <b>"+b.it[mk][0]+" "+b.it[mk][1]+"</b>（"+_w02_f(b.it[mk][4]/b.tot*100,1)+" %）。眠りの 3 つの合計 "+_w02_f(slp/b.tot*100,1)+" %、LED の表示の合計 "+_w02_f(led/b.tot*100,1)+" %<br>";
      ro.innerHTML=h+'<div class="wnote">本文の表と同じ計算。1 日のうち各状態にいる時間の割合 d に電流 I を掛けて足す。アドバタイズ 1 回は 5 mA で 2 ms（短押しのたびに 100 ms ごとを 2 分）、接続の間は時間の 20 % だけ無線が動く（平均 1 mA）、セクタの消去は 512 件ごとに 45 ms・10 mA とした。LED は 1 回 2 mA で、30 秒ごとの表示（記録中の表示は緑 1 回、続く警報の表示はそれに代わって赤 2 回）、受付中と接続中に 2 秒ごとの通信中の表示、短押しのたびの状態の応答で点く（どれも例の値）。眠りの割合は、1 日から動いている時間を引いて求めた。</div>';
    }
    draw();
  };

  /* ---- 5 節: 処理時間の予算 ---- */
  /* 優先度の固定した、割り込んで動く時間割（全部の処理が時刻 0 に起きる場合）。f02.py の _f02_sched と同じ計算 */
  function _w02_sched(tasks,tmax){var n=tasks.length,q=[],nxt=[],t=0,runs=[],jobs=[],i;for(i=0;i<n;i++){q.push([]);nxt.push(0);}
    var guard=0;
    while(t<tmax-1e-9&&guard++<100000){for(i=0;i<n;i++){while(nxt[i]<=t+1e-9){q[i].push([nxt[i],tasks[i].C]);nxt[i]+=tasks[i].T;}}
      var k=-1;for(i=0;i<n;i++)if(q[i].length){k=i;break;}
      var tn=Math.min(Math.min.apply(null,nxt),tmax);if(k<0){t=tn;continue;}
      var te=Math.min(t+q[k][0][1],tn),L=runs[runs.length-1],rl=q[k][0][0];
      if(L&&L[0]===k&&L[3]===rl&&Math.abs(L[2]-t)<1e-9)L[2]=te;else runs.push([k,t,te,rl]);
      q[k][0][1]-=te-t;if(q[k][0][1]<=1e-9){jobs.push([k,q[k][0][0],te]);q[k].shift();}t=te;}
    for(i=0;i<n;i++)q[i].forEach(function(j){jobs.push([i,j[0],null]);});
    return {runs:runs,jobs:jobs};}
  /* 最悪応答時間（応答時間解析）。上限を超えたら Infinity */
  function _w02_rta(tasks){return tasks.map(function(tk,i){var R=tk.C;for(var j=0;j<i;j++)R+=tasks[j].C;
    for(var it=0;it<10000;it++){var Rn=tk.C;for(var j2=0;j2<i;j2++)Rn+=Math.ceil(R/tasks[j2].T-1e-12)*tasks[j2].C;if(Math.abs(Rn-R)<1e-9)return Rn;R=Rn;if(R>1e7)return Infinity;}return Infinity;});}
  REG.w02_cpu=function(el,U){
    var S=U.S;
    U.head(el,"CPU BUDGET","処理時間の予算 — 周期と最悪実行時間から、時間割・利用率・締め切りを確かめる");
    var r1=U.ctrls(el);
    var ci=U.slider(r1,"接続の間隔",{values:[7.5,10,15,30,50],value:15,fmt:function(v){return v+" ms";},onInput:draw});
    var cR=U.slider(r1,"無線の処理の最悪実行時間",{min:0.5,max:5,step:0.1,value:2.0,fmt:function(v){return _w02_f(v,1)+" ms";},onInput:draw});
    var cD=U.slider(r1,"読み出しの用意の最悪実行時間",{min:1,max:15,step:0.5,value:6,fmt:function(v){return _w02_f(v,1)+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var tB=U.slider(r2,"ボタンを読む周期",{values:[1,2,5,10,20],value:5,fmt:function(v){return v+" ms";},onInput:draw});
    var cB=U.slider(r2,"ボタンを読む最悪実行時間",{min:0.05,max:1,step:0.05,value:0.1,fmt:function(v){return _w02_f(v,2)+" ms";},onInput:draw});
    var r3=U.ctrls(el);
    var wait=U.select(r3,"センサとフラッシュの待ち方",["眠って待つ（測定の CPU は 1.1 ms）","ビジーウェイトで待つ（CPU は 51.8 ms）"],0,draw);
    var ord=U.select(r3,"優先度の順",["周期の短い順（測定がいちばん低い）","測定を読み出しの用意より高くする"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){ci.set(15);cR.set(2.0);cD.set(6);tB.set(5);cB.set(0.1);wait.set(0);ord.set(0);draw();});
    U.button(br,"ビジーウェイトで、測定を高くする",function(){wait.set(1);ord.set(1);draw();});
    var box=U.svgbox(el),ro=U.readout(el),cols=["signal","gold","purple","teal"];
    function draw(){
      var Tc=ci.get(),tk=[{n:"無線の処理",T:Tc,C:cR.get(),D:Tc,why:"次の接続イベント"},{n:"ボタンを読む",T:tB.get(),C:cB.get(),D:tB.get(),why:"次の読み取り"},
        {n:"読み出しの用意",T:Tc,C:cD.get(),D:Tc,why:"次の接続イベント"},{n:"測定と記録",T:60000,C:wait.get()?51.8:1.1,D:2000,why:"SR-P03 の 2 秒"}];
      if(ord.get()===1){var m=tk[3];tk[3]=tk[2];tk[2]=m;}
      var ci0=tk.map(function(t){return ["無線の処理","ボタンを読む","読み出しの用意","測定と記録"].indexOf(t.n);});
      var R=_w02_rta(tk),U_=0;tk.forEach(function(t){U_+=t.C/t.T;});
      var Wn=75,sch=_w02_sched(tk,Wn),nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?92:132,x1=Wd-12,X=function(t){return x0+t/Wn*(x1-x0);},y0=24,rh=nar?28:30;
      o.push(S.T(8,15,"全部が時刻 0 に同時に起きた場合の時間割（上の行ほど優先度が高い）","start",nar?9:10,"ink",true));
      tk.forEach(function(t,i){var y=y0+i*rh,c=cols[ci0[i]];
        o.push(S.T(x0-6,y+15,t.n,"end",9.5,"ink",true));o.push(S.RECT(x0,y,x1-x0,22,0,"none","line",0.6));
        for(var r=0;r<=Wn+1e-9&&t.T<1000;r+=t.T)o.push(S.ARR(X(r),y+29,X(r),y+22,"muted",1,4));
        if(t.T>=1000)o.push(S.ARR(X(0),y+29,X(0),y+22,"muted",1,4));});
      var late={};sch.jobs.forEach(function(j){var t=tk[j[0]];if(j[2]===null?(j[1]+t.D<Wn):(j[2]>j[1]+t.D+1e-9))late[j[0]+":"+j[1]]=1;});
      sch.runs.forEach(function(r){var y=y0+r[0]*rh,bad=!!late[r[0]+":"+r[3]];
        var c=bad?"alias":cols[ci0[r[0]]];o.push(S.RECT(X(r[1]),y+2,Math.max(1.2,X(r[2])-X(r[1])),18,1,U.soft(c),c,1));});
      var ya=y0+4*rh+4;
      for(var v=0;v<=Wn;v+=nar?15:5){o.push(S.L(X(v),ya,X(v),ya+4,"muted",1));o.push(S.T(X(v),ya+15,String(v),"middle",9.5,"muted"));}
      o.push(S.T((x0+x1)/2,ya+30,"時間 [ms]（小さな矢印は、処理が起きる時刻。赤は締め切りに遅れた仕事）","middle",9.5,"muted"));
      /* 利用率 */
      var uy=ya+46,ux0=x0,ux1=x1,UX=function(u){return ux0+Math.min(u,1.2)/1.2*(ux1-ux0);};
      o.push(S.T(x0-6,uy+13,"利用率","end",9.5,"ink",true));
      o.push(S.RECT(ux0,uy,UX(U_)-ux0,18,2,U.soft(U_>1?"alias":(U_>0.7?"gold":"green")),U_>1?"alias":(U_>0.7?"gold":"green"),1.2));
      o.push(S.L(UX(0.7),uy-4,UX(0.7),uy+22,"purple",1.3,"5 3"));o.push(S.L(UX(1),uy-4,UX(1),uy+22,"alias",1.6));
      o.push(S.T(UX(0.7)-3,uy+34,"目標 70 %","end",9.5,"purple",true));o.push(S.T(UX(1)+3,uy+34,"100 %","start",9.5,"alias",true));
      o.push(S.T(Math.min(UX(U_)+4,UX(0.7)-80),uy+13,_w02_f(U_*100,1)+" %","start",10,"ink",true,false,null,true));
      box.set(S.svg(Wd,uy+42,o));
      var h="利用率 U = Σ C<sub>i</sub>/T<sub>i</sub> = "+tk.map(function(t){return _w02_f(t.C,t.C<1?2:1)+"/"+(t.T>=1000?"60000":t.T);}).join(" + ")+" = <b>"+_w02_f(U_,3)+"（"+_w02_f(U_*100,1)+" %）</b>"+(U_>1?'　<span class="warn">100 % を超えた。どう優先度を付けても間に合わない</span>':(U_>0.7?"　目標の 70 % を超えた":""))+"<br>";
      var anyLate=false;
      tk.forEach(function(t,i){var ok=R[i]<=t.D+1e-9;if(!ok)anyLate=true;
        h+=t.n+": 最悪応答時間 <b>"+(isFinite(R[i])?_w02_f(R[i],1)+" ms":"終わらない")+"</b>、締め切り "+(t.D>=1000?(t.D/1000)+" s":t.D+" ms")+"（"+t.why+"） → "+(ok?'<span class="ok">間に合う</span>':'<span class="warn">遅れる</span>')+"<br>";});
      if(anyLate&&R[ci0.indexOf(2)]>Tc)h+='<span class="warn">読み出しの用意が接続イベントに間に合わない回は、送るデータが無く、読み出しが遅れる（SR-P05）</span><br>';
      ro.innerHTML=h+'<div class="wnote">最悪応答時間は、優先度の高い処理に割り込まれる分を足す計算（応答時間解析）で求めた。測定の締め切りは、記録の時刻のずれ（SR-P03 の ±2 秒）から 2 秒とした。ビジーウェイトでは、センサの 5 ms・書き込みの 0.7 ms・消去の 45 ms の待ちも CPU を使い続ける。</div>';
    }
    draw();
  };

  /* ---- 6 節: 代案の比較 ---- */
  var _W02_TRC=["費用","ソフトウェアの手間","電池が抜けたときの強さ","手に入れやすさ","電力"],_W02_TRW=[35,20,20,15,10],
    _W02_TRA=[{n:"A 外付けの NOR フラッシュ",sh:"A NOR フラッシュ",s:[5,2,2,5,4],ok:true},{n:"B 外付けの FRAM",sh:"B FRAM",s:[1,5,4,3,5],ok:true},{n:"C マイコンの内蔵のフラッシュの空き",sh:"C 内蔵のフラッシュ",s:[5,3,2,5,5],ok:false}];
  REG.w02_trade=function(el,U){
    var S=U.S,cols=["signal","purple","teal","gold","muted"];
    U.head(el,"TRADE-OFF","代案の比較 — 重みを変えると、点数と選ぶ案が変わる");
    var r1=U.ctrls(el),sl=[];
    _W02_TRC.forEach(function(c,i){sl.push(U.slider(r1,"重み: "+c,{min:0,max:50,step:1,value:_W02_TRW[i],fmt:function(v){return String(v);},onInput:draw}));});
    var r2=U.ctrls(el);
    var must=U.checkbox(r2,"必須の条件（記録の記憶 410.6 KiB 以上）を満たさない案を外す",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){sl.forEach(function(s,i){s.set(_W02_TRW[i]);});must.set(true);draw();});
    U.button(br,"重みをそろえる（20 ずつ）",function(){sl.forEach(function(s){s.set(20);});draw();});
    U.button(br,"手間と強さを重くする",function(){[10,35,35,10,10].forEach(function(v,i){sl[i].set(v);});draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var w=sl.map(function(s){return s.get();}),sw=w.reduce(function(a,b){return a+b;},0),nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var sc=_W02_TRA.map(function(a){return sw>0?a.s.reduce(function(acc,v,i){return acc+w[i]*v;},0)/sw*100:0;});
      var cand=_W02_TRA.map(function(a,i){return i;}).filter(function(i){return !must.get()||_W02_TRA[i].ok;});
      cand.sort(function(a,b){return sc[b]-sc[a];});var win=cand[0],sec=cand[1];
      /* 重みの割合 */
      var x0=nar?8:180,x1=Wd-14,y=24;
      o.push(S.T(8,16,"重みの割合","start",10,"ink",true));
      var xx=x0;w.forEach(function(v,i){var ww=sw>0?(x1-x0)*v/sw:0;o.push(S.RECT(xx,y,ww,16,0,U.soft(cols[i]),cols[i],1));if(ww>U.tw(String(v),9.5)+6)o.push(S.T(xx+ww/2,y+12,String(Math.round(v/sw*100)),"middle",9.5,cols[i],true));xx+=ww;});
      var lx=nar?8:180,ly=y+34;_W02_TRC.forEach(function(c,i){var t=c,tw_=U.tw(t,9.5)+22;if(lx+tw_>Wd-8){lx=nar?8:180;ly+=16;}o.push(S.RECT(lx,ly-9,10,10,2,U.soft(cols[i]),cols[i],1));o.push(S.T(lx+14,ly,t,"start",9.5,"muted"));lx+=tw_+6;});
      /* 案ごとの点数（観点ごとの寄与を積んだ棒） */
      var by=ly+22,bh=nar?40:34,bx0=nar?8:180,bx1=Wd-60,BX=function(v){return bx0+v/500*(bx1-bx0);};
      _W02_TRA.forEach(function(a,k){var yy=by+k*(bh+(nar?18:10)),out=must.get()&&!a.ok,isW=k===win;
        if(nar)o.push(S.T(8,yy-3,a.n,"start",9.5,isW?"green":(out?"muted":"ink"),true));else o.push(S.T(172,yy+bh/2-2,a.sh,"end",9.5,isW?"green":(out?"muted":"ink"),true));
        var xx2=bx0;a.s.forEach(function(s,i){var v=sw>0?w[i]*s/sw*100:0,ww=BX(v)-bx0;o.push(S.RECT(xx2,yy,ww,bh-12,0,U.soft(cols[i]),cols[i],1));xx2+=ww;});
        if(out)o.push(S.RECT(bx0-2,yy-3,bx1-bx0+4,bh-6,3,"var(--muted-soft)","none",0,null,' fill-opacity="0.85"'));
        o.push(S.T(xx2+4,yy+bh/2-2,_w02_f(sc[k],0)+" 点","start",10,isW?"green":(out?"muted":"ink"),true));
        if(out)o.push(S.T(bx0+6,yy+bh/2-2,"外した（記録の記憶が 280 KB しかない）","start",9.5,"alias",true));
        if(isW)o.push(S.RECT(bx0-3,yy-3,Math.max(BX(sc[k]),bx0+20)-bx0+6,bh-6,3,"none","green",2.2));});
      var yb=by+3*(bh+(nar?18:10));
      [0,100,200,300,400,500].forEach(function(v){o.push(S.L(BX(v),yb,BX(v),yb+4,"muted",1));o.push(S.T(BX(v),yb+15,String(v),"middle",9.5,"muted"));});
      o.push(S.T((bx0+bx1)/2,yb+29,"点数（重み × 評点の和。重みの合計を 100 にそろえる）","middle",9.5,"muted"));
      box.set(S.svg(Wd,yb+36,o));
      /* 読み出し */
      var h="点数: "+_W02_TRA.map(function(a,k){return a.n.charAt(0)+" <b>"+_w02_f(sc[k],0)+"</b>"+(must.get()&&!a.ok?"（外した）":"");}).join("・")+"<br>";
      h+='選ぶ案: <span class="ok">'+_W02_TRA[win].n+"</span>"+(sec!=null?"（次の "+_W02_TRA[sec].n.charAt(0)+" との差 "+_w02_f(sc[win]-sc[sec],0)+" 点）":"")+"<br>";
      if(!must.get()&&!_W02_TRA[win].ok)h+='<span class="warn">点数で選んだ '+_W02_TRA[win].n.charAt(0)+" は、必須の条件（SR-F04 の 410.6 KiB）を満たさない</span><br>";
      if(sec!=null){var A=_W02_TRA[win].s,B=_W02_TRA[sec].s,msg=[];
        _W02_TRC.forEach(function(c,i){var d=A[i]-B[i];if(d===0)return;var rest=0;for(var j=0;j<5;j++)if(j!==i)rest+=w[j]*(A[j]-B[j]);var ws=-rest/d;
          if(ws>0&&ws<50){msg.push(c+"の重みが "+_w02_f(ws,0)+(d>0?" を下回る":" を上回る"));}});
        h+=msg.length?"ほかの重みをそのままにすると、"+msg.join("か、")+"と、"+_W02_TRA[sec].n.charAt(0)+" が "+_W02_TRA[win].n.charAt(0)+" を上回る<br>":"どれか 1 つの重みを 0〜50 の中で変えても、選ぶ案は入れ替わらない<br>";}
      ro.innerHTML=h+'<div class="wnote">評点（1〜5）と事実は本文の図と同じ。点数 = Σ（重み × 評点）÷ 重みの合計 × 100 で、どの観点も 5 なら 500 点。</div>';
    }
    draw();
  };
