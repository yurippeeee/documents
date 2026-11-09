  /* ===== 01 章 システム仕様書の書き方 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w01_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w01_f(v,d){v=+v;if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 読み出しの HTML の中の ID（SR-F02・ST-036・LG-ICD-001 など）を、狭い画面でも途中で折り返さないようにする（タグの中は変えない） */
  function _w01_nw(h){return h.replace(/(<[^>]*>)|((?:SR|ST|DS|CR)-[A-Z]?\d{2,3}|LG-[A-Z]{3}-\d{3})/g,function(m,tag,id){return tag?tag:'<span style="white-space:nowrap">'+id+'</span>';});}
  /* 箱（中心 cx, cy、幅 w、高さ h）の縁の点のうち、(tx, ty) の向きにあるもの */
  function _w01_edge(cx,cy,w,h,tx,ty){var dx=tx-cx,dy=ty-cy;if(dx===0&&dy===0)return [cx,cy];var t=Math.min(dx?Math.abs(w/2/dx):1e9,dy?Math.abs(h/2/dy):1e9);return [cx+dx*t,cy+dy*t];}

  /* ---- 3 節: 状態遷移表のマスを書き換える ↔ 状態遷移図と、抜けと矛盾 ---- */
  /* マスの中身: {k:"go", to:次の状態, a:すること} 遷移 / {k:"stay", a} とどまる / {k:"rec"} 測定して記録（とどまる）/
     {k:"cond"} 設定による（上書き: とどまる・止める: → 停止中）/ {k:"none"} 起きない / {k:"undef"} 未定 */
  function _w01_go(to,a){return {k:"go",to:to,a:a||""};}
  var _W01_FSM={
    main:{name:"主のモード",st:["停止中","記録中","電池切れ"],ev:["長押し","アプリから開始","アプリから停止","記録の時刻","容量に達した","電池が尽きる","電池を入れ直す"],
      extra:{3:[{k:"rec"}],4:[{k:"cond"}]},
      act:function(i,j,to){if(j===0&&i===0&&to===1)return "緑を 3 回点滅";if(j===0&&i===1&&to===0)return "赤を 3 回点滅";return "";},
      init:function(){return [
        [_w01_go(1,"緑を 3 回点滅"),_w01_go(1),{k:"stay",a:"何もしない"},{k:"none"},{k:"none"},_w01_go(2),{k:"undef"}],
        [_w01_go(0,"赤を 3 回点滅"),{k:"stay",a:"何もしない"},_w01_go(0),{k:"rec"},{k:"cond"},_w01_go(2),{k:"undef"}],
        [{k:"undef"},{k:"none"},{k:"none"},{k:"none"},{k:"none"},{k:"none"},{k:"undef"}]];},
      rule:function(i,j){
        if(i===0&&j===0)return {ok:function(c){return c.k==="go"&&c.to===1;},msg:"長押しで記録を始め、緑を 3 回点滅させる（SR-F06・SR-U04）"};
        if(i===1&&j===0)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"長押しで記録を止め、赤を 3 回点滅させる（SR-F06・SR-U07）"};
        if(i===0&&j===1)return {ok:function(c){return c.k==="go"&&c.to===1;},msg:"アプリから記録を始められる（SR-F14）"};
        if(i===1&&j===2)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"アプリから記録を止められる（SR-F14）"};
        if(i===1&&j===3)return {ok:function(c){return c.k==="rec";},msg:"記録中は、記録の間隔ごとに測定して記録する（SR-F01・SR-F03）"};
        if(i!==1&&j===3)return {ok:function(c){return c.k!=="rec"&&!(c.k==="go"&&c.to===1);},msg:"記録中でなければ記録しない（SR-F01・SR-F18）"};
        if(i===1&&j===4)return {ok:function(c){return c.k==="cond";},msg:"容量に達したときに上書きするか止めるかは、設定で選ぶ（SR-F05）"};
        if(i<2&&j===5)return {ok:function(c){return c.k==="go"&&c.to===2;},msg:"電池が尽きたら電池切れへ移る（SR-F18）"};
        if(i===2&&(j===1||j===2))return {ok:function(c){return c.k==="none";},msg:"電池切れでは通信しないので、アプリからの出来事は起きない（SR-F18）"};
        if(i===2&&j<6)return {ok:function(c){return !(c.k==="go"&&c.to===1)&&c.k!=="rec";},msg:"電池切れのまま記録はできない（SR-F18）"};
        return null;}},
    com:{name:"通信の状態",st:["通信なし","受付中","接続中"],ev:["短押し","アプリが接続","接続が切れる","2 分たつ","電池が尽きる","電池を入れ直す"],extra:{},
      act:function(i,j,to){if(i===0&&j===0&&to===1)return "LED で状態を示し、受付を始める";if(i===1&&j===1&&to===2)return "接続を受ける";if(j>=4&&to===0)return "通信を止める";return "";},
      init:function(){return [
        [_w01_go(1,"LED で状態を示し、受付を始める"),{k:"none"},{k:"none"},{k:"none"},{k:"stay",a:"何もしない"},{k:"stay",a:"何もしない"}],
        [{k:"undef"},_w01_go(2,"接続を受ける"),{k:"none"},_w01_go(0),_w01_go(0,"通信を止める"),_w01_go(0,"通信を止める")],
        [{k:"undef"},{k:"none"},_w01_go(0),{k:"none"},_w01_go(0,"通信を止める"),_w01_go(0,"通信を止める")]];},
      rule:function(i,j){
        if(i===0&&j===0)return {ok:function(c){return c.k==="go"&&c.to===1;},msg:"短押しで接続の受付を始める（SR-U06）"};
        if(i===0&&j===1)return {ok:function(c){return c.k==="none";},msg:"受付中でなければ接続されない（SR-U06）"};
        if(i===1&&j===1)return {ok:function(c){return c.k==="go"&&c.to===2;},msg:"受付中は接続を受ける（SR-U06）"};
        if(i===1&&j===3)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"受け付けるのは短押しから 2 分間（SR-U06）"};
        if(i===2&&j===2)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"接続が切れたら通信なしに戻る（SR-F18）"};
        if(i>0&&j>=4)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"電池が尽きたとき・入れ直したときは通信しない（SR-F18）"};
        if(i===0&&j>=4)return {ok:function(c){return c.k==="stay"||c.k==="none";},msg:"電池が尽きたとき・入れ直したときは通信しない（SR-F18）"};
        return null;}}
  };
  function _w01_cellTxt(M,c,short){
    if(c.k==="go")return (c.a?(short?c.a.replace("を 3 回点滅"," 3 回").replace("LED で状態を示し、",""):c.a)+" ":"")+"→ "+M.st[c.to];
    if(c.k==="stay")return c.a||"何もしない";
    if(c.k==="rec")return "測定して記録";
    if(c.k==="cond")return short?"上書き／止める → 停止中":"設定による（上書き: とどまる／止める: → 停止中）";
    if(c.k==="none")return "起きない";
    return "未定";}
  /* マスに選べる中身 */
  function _w01_opts(M,i,j){var o=[];M.st.forEach(function(s,t){if(t!==i)o.push(_w01_go(t,M.act(i,j,t)));});
    o.push({k:"stay",a:"何もしない"});(M.extra[j]||[]).forEach(function(e){o.push({k:e.k});});o.push({k:"none"});o.push({k:"undef"});return o;}
  function _w01_same(a,b){return a.k===b.k&&(a.k!=="go"||a.to===b.to);}
  REG.w01_modes=function(el,U){
    var S=U.S;
    U.head(el,"STATE TABLE","状態遷移表のマスを書き換えて、状態遷移図と、抜けと矛盾を確かめる");
    var r1=U.ctrls(el);
    var mSel=U.seg(r1,["主のモード","通信の状態"],0,function(){key=mSel.get()?"com":"main";si=0;sj=0;cur=0;last=null;log=[];build();sync();draw();});
    var r2=U.ctrls(el);
    var sSel=U.select(r2,"マスの状態（行）",["停止中","記録中","電池切れ"],0,function(){si=sSel.get();sync();draw();});
    var eSel=U.select(r2,"マスの出来事（列）",["長押し"],0,function(){sj=eSel.get();sync();draw();});
    var cSel=U.select(r2,"マスの中身",["—"],0,function(){var o=_w01_opts(M(),si,sj)[cSel.get()];T()[si][sj]=o;draw();});
    var r3=U.ctrls(el);
    var cStop=U.checkbox(r3,"容量に達したときの設定を「記録を止める」にする（SR-F05。初期値は上書き）",false,function(){draw();});
    var ebr=U.btnrow(el);
    var br=U.btnrow(el);
    U.button(br,"最初の状態に戻す",function(){cur=0;last=null;log=[];draw();});
    U.button(br,"本文の例の表に戻す",function(){tabs[key]=M().init();cur=0;last=null;log=[];sync();draw();});
    var box=U.svgbox(el),tdiv=U.mk("div","readout");el.appendChild(tdiv);var ro=U.readout(el);
    var key="main",tabs={main:_W01_FSM.main.init(),com:_W01_FSM.com.init()},si=0,sj=0,cur=0,last=null,log=[];
    function M(){return _W01_FSM[key];}
    function T(){return tabs[key];}
    /* 出来事のボタンと選択肢を、表に合わせて作り直す */
    function build(){var m=M();
      [sSel,eSel].forEach(function(s,q){var arr=q?m.ev:m.st;s.input.innerHTML="";arr.forEach(function(t,i){var op=U.mk("option");op.value=i;op.textContent=t;s.input.appendChild(op);});});
      ebr.innerHTML="";var lab=U.mk("span",null,"出来事を起こす:");lab.style.cssText="font-family:var(--mono);font-size:.74rem;color:var(--muted)";ebr.appendChild(lab);
      m.ev.forEach(function(e,j){U.button(ebr,e,function(){fire(j);});});
      cStop.el.style.display=key==="main"?"":"none";}
    function sync(){var m=M();sSel.set(si);eSel.set(sj);var ops=_w01_opts(m,si,sj),c=T()[si][sj];cSel.input.innerHTML="";
      ops.forEach(function(o,k){var op=U.mk("option");op.value=k;op.textContent=_w01_cellTxt(m,o);cSel.input.appendChild(op);if(_w01_same(o,c))cSel.input.value=k;});}
    function fire(j){var m=M(),c=T()[cur][j],from=cur,res;
      if(c.k==="go"){cur=c.to;res=(c.a?c.a+"、":"")+m.st[cur]+"へ";}
      else if(c.k==="cond"){if(cStop.get()){cur=0;res="止める設定なので記録を止め、停止中へ";}else res="上書きの設定なので、最も古い記録に上書きして記録中のまま";}
      else if(c.k==="rec")res="測定して記録する（記録中のまま）";
      else if(c.k==="stay")res=(c.a||"何もしない")+"（"+m.st[cur]+"のまま）";
      else if(c.k==="none")res="この組み合わせは起きないと決めてある（何も変わらない）";
      else res='<span class="warn">未定のマス</span>: 決めていないので、作る人ごとに違う動きになり、試験の合否も決まらない';
      last={from:from,ev:j,to:cur,k:c.k};si=from;sj=j;sync();
      log.unshift(m.st[from]+" で「"+m.ev[j]+"」→ "+res);if(log.length>5)log.pop();draw();}
    /* 抜けと矛盾 */
    function audit(){var m=M(),t=T(),gaps=[],bad=[];
      t.forEach(function(row,i){row.forEach(function(c,j){if(c.k==="undef"){gaps.push([i,j]);return;}var r=m.rule(i,j);if(r&&!r.ok(c))bad.push([i,j,r.msg]);});});
      return {gaps:gaps,bad:bad};}
    function draw(){
      var m=M(),t=T(),A=audit(),nar=_w01_nar(box),Wd=nar?400:700,o=[],sz=nar?9:9.5;
      var isBad={},isGap={};A.bad.forEach(function(b){isBad[b[0]+","+b[1]]=b[2];});A.gaps.forEach(function(g){isGap[g[0]+","+g[1]]=1;});
      var P=nar?[[78,80],[322,80],[200,250]]:[[120,122],[400,122],[610,122]],bw=nar?92:100,bh=34,GX=(P[0][0]+P[1][0]+P[2][0])/3,GY=(P[0][1]+P[1][1]+P[2][1])/3;
      /* 遷移を（始まり, 終わり）ごとにまとめる */
      var E={},loops=[[],[],[]],ymax=0;   /* ymax: いちばん下の文字の位置（図の高さを決める） */
      t.forEach(function(row,i){row.forEach(function(c,j){
        if(c.k==="go"){var k=i+">"+c.to;(E[k]=E[k]||[]).push({j:j,txt:m.ev[j]});}
        if(c.k==="cond"){(E[i+">0"]=E[i+">0"]||[]).push({j:j,txt:m.ev[j]+" [止める]"});loops[i].push({j:j,txt:m.ev[j]+" [上書き]"});}
        if(c.k==="rec")loops[i].push({j:j,txt:m.ev[j]+" / 測定して記録"});
        if(c.k==="stay"&&c.a&&c.a!=="何もしない")loops[i].push({j:j,txt:m.ev[j]+" / "+c.a});});});
      o.push(S.T(nar?8:14,16,m.name+"の状態遷移図（下の表から描く）","start",10,"ink",true));
      /* 矢印 */
      Object.keys(E).forEach(function(k){var a=+k.split(">")[0],b=+k.split(">")[1],evs=E[k];
        var both=!!E[b+">"+a],far=!nar&&Math.abs(a-b)===2;
        var x1=P[a][0],y1=P[a][1],x2=P[b][0],y2=P[b][1],dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=dy/L,ny=-dx/L;
        var bend=far?((both&&a>b)?-0.3*(ny>0?1:-1):0.38*(ny>0?1:-1)):(both?0.2:(nar?0.12:0.08));
        if(nar&&!both){var out=nx*((x1+x2)/2-GX)+ny*((y1+y2)/2-GY);bend=out>=0?0.12:-0.12;}
        var cx=(x1+x2)/2+bend*L*nx,cy=(y1+y2)/2+bend*L*ny;
        var p1=_w01_edge(x1,y1,bw,bh,cx,cy),p2=_w01_edge(x2,y2,bw,bh,cx,cy);
        var hot=last&&last.from===a&&last.to===b&&evs.some(function(e){return e.j===last.ev;});
        var sel=si===a&&evs.some(function(e){return e.j===sj;});
        var col=hot?"signal":(sel?"gold":"muted"),lw=hot?3:(sel?2.4:1.5);
        var ang=Math.atan2(p2[1]-cy,p2[0]-cx),hd=7,ex=p2[0]-hd*0.6*Math.cos(ang),ey=p2[1]-hd*0.6*Math.sin(ang);
        o.push(S.PATH("M"+p1[0].toFixed(1)+","+p1[1].toFixed(1)+" Q"+cx.toFixed(1)+","+cy.toFixed(1)+" "+ex.toFixed(1)+","+ey.toFixed(1),col,lw));
        o.push(S.head(cx,cy,p2[0],p2[1],col,hd));
        var mx=0.25*p1[0]+0.5*cx+0.25*p2[0],my=0.25*p1[1]+0.5*cy+0.25*p2[1],side=(bend*ny<0||(bend===0&&false))?-1:1;
        if(Math.abs(bend*ny)<1e-6)side=-1;
        var bx=bend*nx,by=bend*ny,horiz=Math.abs(bx)>Math.abs(by)*1.2;
        evs.forEach(function(e,q){var yy=horiz?my+(q-(evs.length-1)/2)*(sz+3)+3:my+(side<0?-8-(evs.length-1-q)*(sz+3):14+q*(sz+3));
          var xx=horiz?mx+(bx<0?-6:6):mx,an=horiz?(bx<0?"end":"start"):"middle";ymax=Math.max(ymax,yy+5);
          o.push(S.T(xx,yy,e.txt+((m.act(a,e.j,b)&&!nar)?" / "+m.act(a,e.j,b):""),an,sz,e.j===sj&&si===a?"gold":(hot&&e.j===last.ev?"signal":"ink"),true,false,null,true));});});
      /* 自分への遷移 */
      loops.forEach(function(ls,i){if(!ls.length)return;var x=P[i][0],y=P[i][1]-bh/2;
        var hot=last&&last.from===i&&last.to===i&&ls.some(function(e){return e.j===last.ev;});
        o.push(S.PATH("M"+(x-10)+","+y+" C"+(x-24)+","+(y-40)+" "+(x+24)+","+(y-40)+" "+(x+10)+","+(y-2),hot?"signal":"muted",hot?2.6:1.4));
        o.push(S.head(x+16,y-12,x+10,y-1,hot?"signal":"muted",6));
        ls.forEach(function(e,q){o.push(S.T(x+(nar?-30:22),y-30+q*(sz+3)-(ls.length-1)*(sz+3)+(nar?-6:0),e.txt,nar?"middle":"start",sz,e.j===sj&&si===i?"gold":"signal",true,false,null,true));});});
      /* 状態の箱と、抜け・矛盾の札 */
      P.forEach(function(p,i){var on=i===cur;
        o.push(S.RECT(p[0]-bw/2,p[1]-bh/2,bw,bh,bh/2.6,on?"signal":U.soft("signal"),"signal",on?2.6:1.6));
        o.push(S.T(p[0],p[1]+4,m.st[i],"middle",11,on?"panel":"signal",true));
        var ng=0,nb=0;t[i].forEach(function(c,j){if(isGap[i+","+j])ng++;if(isBad[i+","+j])nb++;});
        var tags=[];if(ng)tags.push(["未定 "+ng,"alias"]);if(nb)tags.push(["矛盾 "+nb,"alias"]);
        tags.forEach(function(tg,q){o.push(S.CHIP(p[0]-bw/2+U.tw(tg[0],9)/2+5+q*(U.tw(tags[0][0],9)+16),p[1]+bh/2+15,tg[0],tg[1],9));});});
      if(!nar){o.push(S.D(P[0][0]-bw/2-30,P[0][1],"ink",4.5));o.push(S.ARR(P[0][0]-bw/2-25,P[0][1],P[0][0]-bw/2-2,P[0][1],"ink",1.4,6));}
      box.set(S.svg(Wd,Math.max(nar?306:262,Math.ceil(ymax)+8),o));
      /* 状態遷移表（HTML。マスを押すと選べる） */
      var h='<div style="margin:.2rem 0 .3rem">状態遷移表（マスを押して選び、上の「マスの中身」で書き換える）</div><div class="wtable"><table><thead><tr><th>状態 ＼ 出来事</th>'+
        m.ev.map(function(e){return '<th style="text-align:center">'+U.esc(e)+'</th>';}).join("")+'</tr></thead><tbody>';
      t.forEach(function(row,i){h+='<tr><th style="text-align:left;color:var(--signal)">'+m.st[i]+'</th>';
        row.forEach(function(c,j){var kk=i+","+j,bg=isGap[kk]||isBad[kk]?"var(--alias-soft)":(c.k==="none"?"var(--muted-soft)":"transparent");
          if(last&&last.from===i&&last.ev===j)bg="var(--signal-soft)";
          var st="cursor:pointer;text-align:center;white-space:normal;min-width:6.5em;background:"+bg+";"+(si===i&&sj===j?"outline:2px solid var(--gold);outline-offset:-2px;":"");
          var tx=U.esc(_w01_cellTxt(m,c,true));if(isGap[kk]||isBad[kk])tx='<b style="color:var(--alias)">'+tx+(isBad[kk]?"（矛盾）":"")+'</b>';
          h+='<td data-c="'+kk+'" style="'+st+'">'+tx+'</td>';});h+='</tr>';});
      tdiv.innerHTML=h+'</tbody></table></div>';
      /* 読み出し */
      var r="今の状態: <b>"+m.st[cur]+"</b>"+(log.length?"　直前: "+log[0]:"（上の出来事のボタンで、今の状態から遷移させる）")+"<br>";
      r+=(A.gaps.length?'<span class="warn">抜け（未定） '+A.gaps.length+' マス</span>: '+A.gaps.map(function(g){return m.st[g[0]]+" × "+m.ev[g[1]];}).join("、"):'<span class="ok">抜けは無い</span>')+"<br>";
      r+=(A.bad.length?'<span class="warn">矛盾 '+A.bad.length+' マス</span>: '+A.bad.map(function(b){return m.st[b[0]]+" × "+m.ev[b[1]]+"（"+b[2]+"）";}).join("、"):'<span class="ok">要求と矛盾するマスは無い</span>');
      ro.innerHTML=_w01_nw(r+(log.length>1?'<div class="wnote">'+log.slice(1).join("<br>")+'</div>':"")+'<div class="wnote">矛盾は、ロガーの要求（SR-F01・SR-F05・SR-F06・SR-F14・SR-F18・SR-U04・SR-U06・SR-U07。03 章の最終の要求）に照らして判定する。未定のマスは、どれを選んでも要求とは矛盾しない（どれにするかを仕様書で決める。03 章の表 3-3・3-4 が決めた答え）。</div>');
    }
    tdiv.addEventListener("click",function(e){var td=e.target.closest?e.target.closest("[data-c]"):null;if(!td)return;var q=td.getAttribute("data-c").split(",");si=+q[0];sj=+q[1];sync();draw();});
    build();sync();draw();
  };

  /* ---- 4 節: 要求文の点検（曖昧な言葉・数値と単位・1 文に 1 つ・条件・否定・文末） ---- */
  var _W01_RQ=[
    {t:"ボタンを押したら、速やかにアプリとつながること",fix:[["SR-P06","短押しから 10 秒以内に、アプリが接続を始められること"]],why:"「速やかに」を、起点（短押し）と時間の上限（10 秒以内）に直した。"},
    {t:"電池は十分に長くもつこと",fix:[["SR-W02","次の使い方の条件で、新しい電池で 1 年以上記録を続けられること: 記録の間隔 10 分、周囲 25 °C、読み出しは 1 週間に 1 回（接続 1 分）、短押しは 1 日に 1 回、警報の表示は無い（警報の印が付かない上限と下限に設定する）、電池少の表示は電池少と判定してから電池切れまでの間だけ（SR-F13）"]],why:"「十分に長く」を 1 年以上という数値にし、使い方の条件（5 節）を添えた。LED の表示も電池を使うので、条件に入れた。"},
    {t:"温度の誤差は ±0.5 °C 以内であること",fix:[["SR-P01","温度の誤差は、0 °C 以上 40 °C 以下で ±0.5 °C 以内、−20 °C 以上 0 °C 未満と 40 °C より高く 60 °C 以下で ±1.0 °C 以内であること（分解能 0.1 °C）"]],why:"誤差を満たす温度の範囲（条件）を書き、範囲ごとに許容差を決めた。境目（0 °C と 40 °C）がどちらの範囲に入るかも書いた。"},
    {t:"温度と湿度を 10 分ごとに測定して記録し、また上限を超えたら LED で知らせること",fix:[["SR-F01","記録中は、記録の間隔ごとに温度と相対湿度を測定すること"],["SR-F03","測定ごとに、時刻・温度・湿度・状態の印（警報・時刻未設定・電池少・測定異常）を 1 件の記録として保存すること"],["SR-F15","警報の印を付けた記録を保存したときは、LED で知らせること（警報の表示。表 3-5）"]],why:"別々に合否が決まる 3 つの要求に分け、ID を 1 つずつ付けた（警報の印を付けることは SR-F10）。それぞれに試験を結べる。"},
    {t:"誤った時刻で記録しないこと",fix:[["SR-F09","電池を入れてから最初に時刻を合わせるまでの記録には、時刻未設定の印を付けること"]],why:"否定だけの文を、条件（時刻を合わせるまで）と、そのときにすること（印を付ける）に直した。"},
    {t:"電池の残りが少なくなったら、すぐに知らせること",fix:[["SR-F13","電池の残りが少ないことを、電池切れになる 14 日以上前（SR-W02 の使い方の条件で）に、LED とアプリで知らせること"]],why:"「すぐに」を、いつまでに（電池切れになる 14 日以上前。数えるときの使い方の条件も書く）と、何で（LED とアプリ）知らせるかに直した。"},
    {t:"LED の表示は分かりやすくする",fix:[["SR-U03","LED の表示は、表 3-5 の表示と表 3-6 の決まり（重なるときの優先順位を含む）のとおりにすること"]],why:"「分かりやすく」を、表示の表と決まり（03 章の表 3-5・3-6）に従うことに直し、文末を「〜すること」にした。"},
    {t:"記録の読み出しは、なるべく速いことが望ましい",fix:[["SR-P05","接続してから、記録 52 560 件の読み出しを 60 秒以内に終えること（例のスマートフォンで、見通し 2 m）"]],why:"「なるべく速い」を、件数・時間の上限・試す条件のそろった必須の要求に直した。"}
  ];
  var _W01_VAGUE=["可能な限り","できるだけ","なるべく","ある程度","問題なく","効率よく","効率的","適切","十分","速やか","迅速","直ちに","すぐに","高速","素早く","正確","正しく","確実に","使いやす","分かりやす","わかりやす","見やす","簡単","容易","柔軟","最適","適宜","極力","など","長く","短く","早く","遅く","多く","少なく"];
  var _W01_QWORD=["速","時間","誤差","精度","寿命","もつ","距離","重さ","大きさ","費用","電流","遅れ"];
  var _W01_UNIT="%RH|°C|℃|ms|µs|秒|分|時間|日|週間|週|か月|年|mm|cm|kg|g|件|回|個|台|面|円|mAh|µA|mA|KiB|KB\\/s|KB|dBm|dB|kHz|MHz|GHz|Hz|%|桁|ppm|m|A|V|B";
  var _W01_NUMRE=new RegExp("(?:\\d+(?:[.]\\d+)?\\s?×\\s?)*[−\\-+±]?(?:\\d{1,3}(?: \\d{3})+|\\d+)(?:[.]\\d+)?(?:\\s?[〜~]\\s?[−\\-+]?\\d+(?:[.]\\d+)?)?\\s?(?:"+_W01_UNIT+")(?![A-Za-z])","g");
  function _w01_check(s){
    var t=String(s).trim(),R=[],rng=[];  /* rng: [start, end, 種類] 文字に色を付ける範囲 */
    function add(a,b,k){rng.push([a,b,k]);}
    /* 曖昧な言葉 */
    var vg=[];_W01_VAGUE.forEach(function(w){var i=t.indexOf(w);while(i>=0){var dup=rng.some(function(r){return r[2]==="vague"&&i>=r[0]&&i<r[1];});if(!dup){vg.push(w);add(i,i+w.length,"vague");}i=t.indexOf(w,i+w.length);}});
    /* 数値と単位（ID・型番を除く） */
    var body=t.replace(/(SR|DS|ST|LG)-[A-Z0-9-]+|CR\d+|IP\d+|Bluetooth \d+(?:\.\d+)?|表 \d+(?:-\d+)?/g,function(m){return new Array(m.length+1).join("#");});
    var nums=[],m;_W01_NUMRE.lastIndex=0;while((m=_W01_NUMRE.exec(body))){nums.push(m[0]);add(m.index,m.index+m[0].length,"num");}
    var bare=body.replace(_W01_NUMRE,function(x){return new Array(x.length+1).join("#");}).match(/\d+/g)||[];
    var needNum=vg.length>0||_W01_QWORD.some(function(w){return t.indexOf(w)>=0;});
    /* 1 文に 1 つ */
    var core=t.replace(/（[^（）]*）/g,""),sents=core.split(/[。．]/).filter(function(x){return x.trim().length>0;});
    var joinX=[],joinC=[];
    [/また(?!は)/g].forEach(function(re){var q;while((q=re.exec(t))){joinX.push(q[0]);add(q.index,q.index+q[0].length,"join");}});
    [/および|ならびに|並びに|かつ/g,/[しりきけせめべびみ]、/g].forEach(function(re){var q;while((q=re.exec(t))){joinC.push(q[0]);add(q.index,q.index+q[0].length,"join");}});
    /* 文末 */
    var last=(sents.length?sents[sents.length-1]:core).trim().replace(/こと[:：].*$/,"こと").trim(),endOK=/こと$/.test(last)&&!/ことが望ましい$/.test(last),endWant=/ことが望ましい$/.test(last);
    var neg=/(ない|ず)こと$/.test(last);
    var ei=t.lastIndexOf(last.slice(-6)),em=last.match(/(ことが望ましい|ないこと|こと|する|します|できる|したい|ほしい|である|にする)$/);
    if(em&&ei>=0){var ee=ei+Math.min(6,last.length);add(ee-em[0].length,ee,endOK&&!neg?"endok":"endbad");}
    /* 条件 */
    var condBad=[];
    if(/誤差|精度/.test(t)&&!/\d+\s?〜\s?[−\-+]?\d+\s?°C\s?で|の範囲で|(°C|%RH|以下|以上|未満)\s?で/.test(t))condBad.push("どの範囲（温度など）での誤差かが無い");
    if(/電池/.test(t)&&/寿命|もつ|動く|続けられる|動き続け/.test(t)&&!/条件|間隔/.test(t))condBad.push("使い方の条件（記録の間隔・読み出しの回数・温度）が無い");
    if(/\d+\s?(秒|分|時間|日|ms)\s?以内/.test(t)&&!/から|まで|のうちに|とき|たら|ごとに/.test(t))condBad.push("いつから測るか（起点）が無い");
    var condMark=/とき|たら|れば|ならば|ごとに|たびに|から|までの|の間|で、|の条件|(°C|%RH|以下|以上|未満)\s?で|の範囲で|前に|前（|までに|中は/.test(t);
    /* 判定（ok / chk / bad / na） */
    R.push(["曖昧な言葉",vg.length?"bad":"ok",vg.length?"「"+vg.join("」「")+"」は、読む人ごとに意味が変わる":"無い"]);
    R.push(["数値と単位",nums.length?(bare.length?"chk":"ok"):(needNum?"bad":"na"),nums.length?(nums.join("・")+(bare.length?"。単位の無い数 "+bare.join("・")+" がある":"")):(needNum?"量を決める要求なのに、数値と単位が無い":"数値の要らない要求")]);
    R.push(["1 文に 1 つの要求",(joinX.length||sents.length>1)?"bad":(joinC.length?"chk":"ok"),sents.length>1?"文が "+sents.length+" つある。ID を分ける":(joinX.length?"「"+joinX.join("」「")+"」で別の要求をつないでいる":(joinC.length?"「"+joinC.join("」「")+"」でつないだ所がある。別々に合否が決まるなら分ける":"1 つ"))]);
    R.push(["条件",condBad.length?"bad":(condMark?"ok":"na"),condBad.length?condBad.join("。"):(condMark?"条件がある":"条件の無い型（常に）")]);
    R.push(["否定だけでない",neg?((joinC.length||joinX.length)?"chk":"bad"):"ok",neg?((joinC.length||joinX.length)?"否定で終わっている。どの条件で何をするかで書けないか":"否定だけの要求。条件と、そのときにすることで書く"):"肯定の形"]);
    R.push(["文末",endOK?"ok":(endWant?"chk":"bad"),endOK?"「〜こと」":(endWant?"「望ましい」は要求ではない。必須なら「〜すること」、望ましいなら理由を書く":"「〜すること」「〜できること」になっていない")]);
    return {t:t,rows:R,rng:rng};}
  function _w01_mark(U,t,rng){
    var cls={vague:"background:var(--alias-soft);color:var(--alias);font-weight:700",num:"background:var(--signal-soft);color:var(--signal);font-weight:700",
      join:"background:var(--gold-soft);color:var(--gold);font-weight:700",endok:"background:var(--green-soft);color:var(--green);font-weight:700",endbad:"background:var(--alias-soft);color:var(--alias);font-weight:700;text-decoration:underline"};
    var pri={vague:5,endbad:4,join:3,endok:2,num:1},kind=[];for(var i=0;i<t.length;i++)kind.push(null);
    rng.forEach(function(r){for(var i=r[0];i<r[1]&&i<t.length;i++)if(!kind[i]||pri[r[2]]>pri[kind[i]])kind[i]=r[2];});
    var h="",cur=null,buf="";
    function flush(){if(!buf)return;h+=cur?'<span style="'+cls[cur]+';border-radius:3px;padding:0 .1em">'+U.esc(buf)+'</span>':U.esc(buf);buf="";}
    for(var j=0;j<t.length;j++){if(kind[j]!==cur){flush();cur=kind[j];}buf+=t[j];}flush();return h;}
  REG.w01_reqcheck=function(el,U){
    U.head(el,"REQUIREMENT CHECK","要求文を点検する — 曖昧な言葉・数値と単位・1 文に 1 つ・条件・否定・文末");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例文（ロガーの悪い例）",_W01_RQ.map(function(q,i){return (i+1)+". "+q.t;}),0,function(){cur=ex.get();tin.set(_W01_RQ[cur].t);draw();});
    ex.el.style.flex="1 1 100%";
    var r2=U.ctrls(el);
    var tin=U.textin(r2,"要求文（書き換えてよい）",_W01_RQ[0].t,function(){cur=-1;draw();},{width:"100%"});
    var br=U.btnrow(el);
    U.button(br,"直した例を点検する",function(){var q=_W01_RQ[cur>=0?cur:ex.get()];tin.set(q.fix[0][1]);cur=-2;draw();});
    U.button(br,"本文の例（1 番の例文）",function(){ex.set(0);cur=0;tin.set(_W01_RQ[0].t);draw();});
    var out=U.mk("div");out.style.cssText="margin-top:.75rem;padding:.7rem .8rem;background:var(--screen);border:1px solid var(--line);border-radius:10px;font-size:1rem;line-height:1.9";el.appendChild(out);
    var tb=U.mk("div");el.appendChild(tb);var ro=U.readout(el);
    var cur=0;
    function draw(){
      var c=_w01_check(tin.get()),st={ok:'<span class="ok">◯ よい</span>',chk:'<span style="color:var(--gold);font-weight:700">△ 確かめる</span>',bad:'<span class="warn">× 直す</span>',na:'<span style="color:var(--muted)">— 該当なし</span>'};
      out.innerHTML=c.t?_w01_mark(U,c.t,c.rng):'<span style="color:var(--muted)">（要求文を入れる）</span>';
      tb.innerHTML=U.tbl(["点検の項目","結果","内容"],c.rows.map(function(r){return [r[0],st[r[1]],U.esc(r[2])];}),["left","left","wrap"]);
      var nb=c.rows.filter(function(r){return r[1]==="bad";}).length,nc=c.rows.filter(function(r){return r[1]==="chk";}).length;
      var h=(nb?'<span class="warn">直す所 '+nb+' つ</span>':'<span class="ok">直す所は無い</span>')+(nc?'、<span style="color:var(--gold);font-weight:700">確かめる所 '+nc+' つ</span>':"")+"<br>";
      var q=cur>=0?_W01_RQ[cur]:(cur===-2?_W01_RQ[ex.get()]:null);
      if(q&&cur>=0){h+="直した例: "+q.fix.map(function(f){return "<b>"+f[0]+"</b> "+U.esc(f[1]);}).join("<br>")+'<br><span style="color:var(--muted)">'+U.esc(q.why)+"</span>";}
      else if(cur===-2)h+="直した例（"+q.fix[0][0]+"）を点検した結果を表示している。";
      else h+="直し方の目安: 曖昧な言葉は数値と条件に、つないだ文は ID を分けて、否定だけの文は「どの条件で何をするか」に、文末は「〜すること」に直す。";
      ro.innerHTML=_w01_nw(h+'<div class="wnote">色: <span style="color:var(--alias);font-weight:700">赤</span> 曖昧な言葉・直す文末、<span style="color:var(--signal);font-weight:700">青</span> 数値と単位、<span style="color:var(--gold);font-weight:700">金</span> 要求をつなぐ言葉、<span style="color:var(--green);font-weight:700">緑</span> よい文末。言葉の並びだけを見る簡単な点検なので、最後は人が読んで判断する。</div>');
    }
    draw();
  };

  /* ---- 5 節: 使い方の条件と電池寿命（この章の簡単な模型。f01.py の _f01_life と同じ計算） ---- */
  var _W01_Q=180,_W01_ISL=2.55,_W01_QREC=3.0*8+0.3*5+5*0.7+10*45/512,_W01_QADV=10,_W01_WIN=120,_W01_ICON=1.0,_W01_TCON=5,_W01_QLED=2.0*20;
  /* al: 警報の表示が続く（30 秒ごとの表示が、記録中の表示の緑 1 回から、警報の表示の赤 2 回に代わる） */
  function _w01_life(iv,press,reads,conn,temp,al){
    var k=temp>25?Math.pow(1.5,(temp-25)/10):1,isl=_W01_ISL*k,irec=_W01_QREC/(iv*60),iadv=press*(_W01_QADV/0.1*_W01_WIN)/86400,
      ird=reads*(_W01_QADV/0.1*_W01_TCON+_W01_ICON*1000*conn*60)/(7*86400),iled=(al?2:1)*_W01_QLED/30,tot=isl+irec+iadv+ird+iled;
    return {parts:[isl,irec,iadv,ird,iled],tot:tot,h:_W01_Q*1000/tot,y:_W01_Q*1000/tot/8760};}
  var _W01_RD=[0,1,2,4,7,14,28,70];
  function _w01_rdname(v){return v===0?"しない":(v<7?"週 "+v+" 回":(v===7?"毎日 1 回":"1 日 "+(v/7)+" 回"));}
  REG.w01_profile=function(el,U){
    var S=U.S;
    U.head(el,"USE PROFILE","使い方の条件を変えると、同じロガーの電池寿命はどれだけ変わるか");
    var r0=U.ctrls(el);
    var mode=U.seg(r0,["条件を書かない「電池で 1 年以上」","条件を書いた SR-W02"],0,function(){draw();});
    var r1=U.ctrls(el);
    var iv=U.slider(r1,"記録の間隔",{min:1,max:60,step:1,value:10,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var pr=U.slider(r1,"短押し（1 日あたり）",{min:0,max:20,step:1,value:1,fmt:function(v){return v+" 回";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var rd=U.slider(r2,"読み出し",{values:_W01_RD,value:1,fmt:function(v){return _w01_rdname(v);},onInput:function(){draw();}});
    var cn=U.slider(r2,"1 回の接続の長さ",{values:[0.5,1,2,3,5],value:1,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var tp=U.slider(r2,"周囲の温度",{min:-20,max:60,step:5,value:25,fmt:function(v){return _w01_f(v,0)+" °C";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var al=U.checkbox(r3,"警報の表示が続く（30 秒ごとの表示が、緑 1 回から赤 2 回に代わる）",false,function(){draw();});
    var br=U.btnrow(el);
    function setU(a,b,c,d,e,f){iv.set(a);pr.set(b);rd.set(c);cn.set(d);tp.set(e);al.set(f);draw();}
    U.button(br,"本文の例（SR-W02 の条件）",function(){setU(10,1,1,1,25,false);});
    U.button(br,"使い方が最も軽い",function(){setU(60,0,0,0.5,25,false);});
    U.button(br,"全部が重い",function(){setU(1,20,70,5,60,true);});
    var box=U.svgbox(el),ro=U.readout(el);
    var W2=_w01_life(10,1,1,1,25,false),LO=_w01_life(1,20,70,5,60,true),HI=_w01_life(60,0,0,0.5,25,false),YM=6;
    var NM=["眠り","記録","受付（アドバタイズ）","読み出し（接続）","LED の表示"],CL=["muted","green","gold","purple","teal"];
    function draw(){
      var L=_w01_life(iv.get(),pr.get(),rd.get(),cn.get(),tp.get(),al.get()),m=mode.get(),nar=_w01_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?14:120,x1=nar?386:680;
      /* (a) 電流の内訳 */
      o.push(S.T(nar?8:14,16,"(a) 電流の内訳（1 週間にならした値）","start",10,"ink",true));
      var xm=Math.max(5,Math.ceil(L.tot/5)*5),P=U.plot(x0,28,x1-x0,22,[0,xm],[0,1]);
      var xx=x0;L.parts.forEach(function(v,i){var w=v/xm*(x1-x0);o.push(S.RECT(xx,28,Math.max(w,0.5),22,0,U.soft(CL[i]),CL[i],1));xx+=w;});
      U.nice(0,xm,5).forEach(function(v){o.push(S.L(P.X(v),50,P.X(v),54,"muted",1));o.push(S.T(P.X(v),66,v+"","middle",9.5,"muted"));});
      o.push(S.T(x1,80,"電流 [µA]","end",9.5,"muted"));
      if(!nar)o.push(S.T(x0-8,44,"合計 "+_w01_f(L.tot,2)+" µA","end",10,"ink",true));
      var lx=nar?8:14,ly=96;
      L.parts.forEach(function(v,i){var t=NM[i]+" "+_w01_f(v,v<0.1?3:2);var w=U.tw(t+" µA",9.5)+26;if(lx+w>Wd-6){lx=nar?8:14;ly+=16;}
        o.push(S.RECT(lx,ly-9,11,11,2,U.soft(CL[i]),CL[i],1.1));o.push(S.T(lx+16,ly,t+" µA","start",9.5,"muted"));lx+=w;});
      /* (b) 電池寿命の軸 */
      var yb=ly+34;
      o.push(S.T(nar?8:14,yb,"(b) 電池寿命（電池の容量 180 mAh ÷ 電流の合計）","start",10,"ink",true));
      var Q=U.plot(x0,yb+20,x1-x0,40,[0,YM],[0,1]),ya=yb+70;
      o.push(S.L(x0,ya,x1,ya,"muted",1.2));
      for(var v=0;v<=YM;v++){o.push(S.L(Q.X(v),ya,Q.X(v),ya+4,"muted",1));o.push(S.T(Q.X(v),ya+16,v+"","middle",9.5,"muted"));}
      o.push(S.T(x1,ya+30,"電池寿命 [年]","end",9.5,"muted"));
      if(m===0){o.push(S.RECT(Q.X(LO.y),yb+24,Q.X(HI.y)-Q.X(LO.y),11,3,"var(--gold-soft)","gold",1));
        o.push(S.T((Q.X(LO.y)+Q.X(HI.y))/2+20,yb+19,"使い方しだいで "+_w01_f(LO.y,1)+"〜"+_w01_f(HI.y,1)+" 年","middle",9.5,"gold",true,false,null,true));}
      o.push(S.L(Q.X(1),yb+8,Q.X(1),ya,"alias",1.6,"5 3"));o.push(S.T(Q.X(1)-4,yb+12,"要求の 1 年","end",9.5,"alias",true,false,null,true));
      var xw=Q.X(W2.y);o.push(S.PL([[xw,ya-12],[xw+6,ya-6],[xw,ya],[xw-6,ya-6]],"signal",1.4,m===1?"signal":"var(--signal-soft)"));
      var xc=Q.X(Math.min(YM,L.y)),cc=L.y>=1?"green":"alias",near=Math.abs(xc-xw)<90;
      if(m===1)o.push(S.T(Math.min(x1-50,xw),ya-(near?32:16),"SR-W02 の条件 "+_w01_f(W2.y,1)+" 年","middle",9.5,"signal",true,false,null,true));
      o.push(S.CIRC(xc,ya,6,cc,2.2,"var(--screen)"));o.push(S.D(xc,ya,cc,3));
      o.push(S.T(Math.max(x0+40,Math.min(x1-40,xc)),ya-16,"この使い方 "+_w01_f(L.y,1)+" 年","middle",9.5,cc,true,false,null,true));
      box.set(S.svg(Wd,ya+40,o));
      /* 読み出しと判定 */
      var h="電流の合計 <b>"+_w01_f(L.tot,2)+" µA</b>（眠り "+_w01_f(L.parts[0],2)+"・記録 "+_w01_f(L.parts[1],3)+"・受付 "+_w01_f(L.parts[2],3)+"・読み出し "+_w01_f(L.parts[3],3)+"・LED の表示 "+_w01_f(L.parts[4],2)+" µA）→ 電池寿命 = 180 mAh ÷ "+_w01_f(L.tot,2)+" µA = "+Math.round(L.h).toLocaleString("en-US").replace(/,/g," ")+" 時間 = <b>"+_w01_f(L.y,2)+" 年</b><br>";
      if(m===0)h+="要求「電池で 1 年以上動くこと」: この使い方なら "+(L.y>=1?'<span class="ok">合格</span>':'<span class="warn">不合格</span>')+"。しかし要求に使い方が書いていないので、試す使い方しだいで "+_w01_f(LO.y,2)+"〜"+_w01_f(HI.y,2)+' 年になり、<span class="warn">合否が決まらない</span><br>';
      else h+="SR-W02: 要求の条件（記録の間隔 10 分・25 °C・読み出し 週 1 回 1 分・短押し 1 日 1 回・警報の表示なし・電池少の表示は電池切れの前だけ）で "+_w01_f(W2.y,2)+' 年 → <span class="ok">合格</span>。'+(Math.abs(L.y-W2.y)>1e-9?"今の使い方（"+_w01_f(L.y,2)+" 年）は要求の条件と違うので、合否の判定には使わない（取扱説明書で知らせる）":"今の使い方は、要求の条件そのもの")+"<br>";
      ro.innerHTML=_w01_nw(h+'<div class="wnote">この章の簡単な模型（どれも例の値）: 電池の容量 180 mAh（低温とパルスの負荷と自己放電を見込んだ値）。眠りの電流 2.55 µA（25 °C。マイコン 2.0・センサの待機 0.05・フラッシュの待機 0.5 µA の和。25 °C より 10 °C 高いごとに 1.5 倍とした）。記録 1 回 30 µC（大まかに置いた値）。短押し 1 回で、100 ms ごとのアドバタイズ（1 回 10 µC）を 2 分。読み出し 1 回は、接続までのアドバタイズ 5 秒と、接続中の平均 1.0 mA。LED は 1 回の点灯を 2 mA × 20 ms = 40 µC とし、記録中の表示（30 秒ごとに緑 1 回）で 1.33 µA、警報の表示が続く間は、それに代わる赤 2 回で 2.67 µA。押したときと通信の間だけの表示（状態の応答・通信中の表示など）と、電池切れの前の短い間だけの電池少の表示は、寿命への影響が小さいので省いた。部品ごとに積み上げる詳しい見積もり（02 章 5 節）でも、SR-W02 の条件で 4.9 年になる（記録を大きめに置いた分と、省いた表示の分が、ほぼ打ち消し合う）。ロガーの見積もりは 04 章 5 節で扱う。</div>');
    }
    draw();
  };

  /* ---- 6 節: トレーサビリティの網とマトリクス（f01.py の _F01_T* と同じデータ。ID はこの節の例） ---- */
  var _W01_TU=["1 温湿度を後で確かめる","2 逸脱にすぐ気づく","3 電池の交換は年 1 回","4 5 年使い 10 年残す"];
  var _W01_TS=[["SR-F01","測定"],["SR-F02","記録の間隔"],["SR-F04","記録の容量"],["SR-F10","警報の印"],["SR-P01","温度の誤差"],["SR-W02","電池寿命"],["SR-R01","記録の保持"],["SR-R04","5 年の使用"]];
  var _W01_TD=[["DS-H01","マイコン"],["DS-H02","温湿度センサ"],["DS-H03","記録用フラッシュ"],["DS-S01","測定と記録の処理"],["DS-S02","警報と LED の処理"],["DS-D01","記録 1 件の形式"],["DS-B01","電力の予算"],["DS-S09","デバッグ用の命令"]];
  /* 試験の番号は 03 章の表 6-1 と同じ。最後の ST-043（SR-R01 の試験）は、抜けの例として初めは外してある */
  var _W01_TT=[["ST-001","測定"],["ST-002","記録の間隔"],["ST-004","記録の容量"],["ST-010","警報の印"],["ST-029","温度の誤差"],["ST-036","電池寿命（解析）"],["ST-046","書き換え回数（解析）"],["ST-043","記録の保持（解析）"]];
  var _W01_TUS=[[0,1,2,4],[3],[5],[6,7]];
  function _w01_stCmp(a,b){return _W01_TT[a][0]<_W01_TT[b][0]?-1:(_W01_TT[a][0]>_W01_TT[b][0]?1:0);}   /* 試験は番号の順に並べて示す */
  function _w01_trInit(){return {sd:[[1,3],[3,6],[2,5],[4],[1],[0,6],[2],[2,3]],st:[[0],[1],[2],[3],[4],[5],[],[6]],nT:7,ds9:true};}
  REG.w01_trace=function(el,U){
    var S=U.S;
    U.head(el,"TRACEABILITY","要求・設計・試験の網とマトリクス — 変更の影響と、試験の無い要求・要求の無い設計");
    var r1=U.ctrls(el);
    var sSel=U.select(r1,"変える要求を選ぶ",_W01_TS.map(function(s){return s[0]+" "+s[1];}),1,function(){sel=sSel.get();draw();});
    var tSel=U.select(r1,"つなぐ相手（設計の要素・試験）",["—"],0,null);
    var br=U.btnrow(el);
    U.button(br,"選んだ要求と相手をつなぐ／外す",function(){toggle(sel,tSel.get());});
    U.button(br,"抜けを直した例",function(){D.nT=8;if(D.st[6].indexOf(7)<0)D.st[6].push(7);D.ds9=false;fill();draw();});
    U.button(br,"本文の例に戻す",function(){D=_w01_trInit();sel=1;sSel.set(1);fill();draw();});
    var box=U.svgbox(el),mdiv=U.mk("div","readout");el.appendChild(mdiv);var ro=U.readout(el);
    var D=_w01_trInit(),sel=1,hits=[];
    function targets(){var a=[];_W01_TD.forEach(function(d,j){if(j<7||D.ds9)a.push({k:"d",j:j,t:d[0]+" "+d[1]});});for(var k=0;k<D.nT;k++)a.push({k:"t",j:k,t:_W01_TT[k][0]+" "+_W01_TT[k][1]});return a;}
    function fill(){var a=targets(),v=tSel.input.value;tSel.input.innerHTML="";a.forEach(function(x,i){var op=U.mk("option");op.value=i;op.textContent=x.t;tSel.input.appendChild(op);});if(+v<a.length)tSel.input.value=v;}
    function toggle(i,ti){var x=targets()[ti];if(!x)return;var arr=x.k==="d"?D.sd[i]:D.st[i],p=arr.indexOf(x.j);if(p>=0)arr.splice(p,1);else arr.push(x.j);draw();}
    function analyze(){
      var dsd=D.sd[sel].slice(),ind=[];D.sd.forEach(function(js,i){if(i!==sel&&js.some(function(j){return dsd.indexOf(j)>=0;}))ind.push(i);});
      var st=D.st[sel].slice();ind.forEach(function(i){D.st[i].forEach(function(k){if(st.indexOf(k)<0)st.push(k);});});st.sort(_w01_stCmp);
      var noT=[],noR=[],noRT=[];D.st.forEach(function(ks,i){if(!ks.length)noT.push(i);});
      _W01_TD.forEach(function(d,j){if(j===7&&!D.ds9)return;if(!D.sd.some(function(js){return js.indexOf(j)>=0;}))noR.push(j);});
      for(var k=0;k<D.nT;k++)if(!D.st.some(function(ks){return ks.indexOf(k)>=0;}))noRT.push(k);
      return {dsd:dsd,ind:ind,st:st,noT:noT,noR:noR,noRT:noRT};}
    function draw(){
      var A=analyze(),nar=_w01_nar(box),Wd=nar?400:700,o=[],sz=nar?9:9.5;hits=[];
      var xu=14,wu=132,xs=nar?6:184,ws=nar?132:140,xr=nar?204:406,wr=nar?190:178,nh=20;
      var ys=[],yd=[],yt=[],i,j,k;for(i=0;i<8;i++)ys.push(48+i*40);for(j=0;j<8;j++)yd.push(44+j*24);for(k=0;k<D.nT;k++)yt.push(yd[7]+46+k*24);
      var yu=[ys[0]+30,ys[3],ys[5],ys[6]+20];
      function link(x1,y1,x2,y2,c,lw,dash){return S.PATH("M"+x1+","+y1+" C"+((x1+x2)/2)+","+y1+" "+((x1+x2)/2)+","+y2+" "+x2+","+y2,c,lw,null,dash);}
      if(!nar)_W01_TUS.forEach(function(js,u){js.forEach(function(j2){o.push(link(xu+wu,yu[u]+nh/2,xs,ys[j2]+nh/2,j2===sel?"gold":"faint",j2===sel?1.6:1));});});
      D.sd.forEach(function(js,a){js.forEach(function(b){if(b===7&&!D.ds9)return;var hot=a===sel,sh=A.ind.indexOf(a)>=0&&A.dsd.indexOf(b)>=0;
        o.push(link(xs+ws,ys[a]+nh/2,xr,yd[b]+nh/2,hot?"signal":(sh?"gold":"faint"),hot?2.4:(sh?1.6:1),sh?"4 3":null));});});
      D.st.forEach(function(ks,a){ks.forEach(function(b){var hot=a===sel,sh=A.ind.indexOf(a)>=0;
        o.push(link(xs+ws,ys[a]+nh/2,xr,yt[b]+nh/2,hot?"signal":(sh?"gold":"faint"),hot?2.4:(sh?1.6:1),sh&&!hot?"4 3":null));});});
      if(!nar){_W01_TU.forEach(function(t,u){o.push(S.RECT(xu,yu[u],wu,nh,4,"var(--gold-soft)","gold",1));o.push(S.T(xu+6,yu[u]+14,t,"start",sz,"ink"));});
        o.push(S.T(xu,ys[0]-8,"要求仕様書の項目","start",sz,"gold",true));}
      o.push(S.T(xs,ys[0]-8,"システムの要求（押すと選ぶ）","start",sz,"signal",true));
      o.push(S.T(xr,yd[0]-8,"設計の要素","start",sz,"purple",true));o.push(S.T(xr,yt[0]-8,"システム試験","start",sz,"green",true));
      _W01_TS.forEach(function(s,a){var on=a===sel,ind=A.ind.indexOf(a)>=0,bad=A.noT.indexOf(a)>=0,c=on?"signal":(ind?"gold":(bad?"alias":"signal"));
        o.push(S.RECT(xs,ys[a],ws,nh,4,on?"signal":(bad?"var(--alias-soft)":"var(--signal-soft)"),c,on||ind?2:1.1,ind?"4 2":null));
        o.push(S.T(xs+5,ys[a]+14,s[0],"start",sz,on?"panel":c,true,true));o.push(S.T(xs+(nar?48:52),ys[a]+14,s[1],"start",sz,on?"panel":"ink"));
        if(bad)o.push(S.T(xs+ws,ys[a]-3,"試験が無い","end",sz,"alias",true,false,null,true));
        hits.push({x:xs,y:ys[a],w:ws,h:nh,k:"s",j:a});});
      _W01_TD.forEach(function(d,b){if(b===7&&!D.ds9){o.push(S.RECT(xr,yd[b],wr,nh,4,"none","faint",1,"3 3"));o.push(S.T(xr+6,yd[b]+14,d[0]+"（外した）","start",sz,"faint"));return;}
        var bad=A.noR.indexOf(b)>=0,hot=A.dsd.indexOf(b)>=0;
        o.push(S.RECT(xr,yd[b],wr,nh,4,bad?"var(--alias-soft)":"var(--purple-soft)",hot?"signal":(bad?"alias":"purple"),hot?2:1));
        o.push(S.T(xr+5,yd[b]+14,d[0],"start",sz,bad?"alias":"purple",true,true));o.push(S.T(xr+(nar?50:54),yd[b]+14,d[1],"start",sz,"ink"));
        if(bad&&!nar)o.push(S.T(xr+wr+8,yd[b]+14,"← 要求が無い","start",sz,"alias",true));
        hits.push({x:xr,y:yd[b],w:wr,h:nh,k:"d",j:b});});
      for(k=0;k<D.nT;k++){var hot=A.st.indexOf(k)>=0,dir=D.st[sel].indexOf(k)>=0,nr=A.noRT.indexOf(k)>=0;
        o.push(S.RECT(xr,yt[k],wr,nh,4,nr?"var(--alias-soft)":"var(--green-soft)",hot?(dir?"signal":"gold"):(nr?"alias":"green"),hot?2:1));
        o.push(S.T(xr+5,yt[k]+14,_W01_TT[k][0],"start",sz,"green",true,true));o.push(S.T(xr+(nar?50:54),yt[k]+14,_W01_TT[k][1],"start",sz,"ink"));
        if(hot&&!nar)o.push(S.T(xr+wr+8,yt[k]+14,"← 確かめ直す","start",sz,dir?"signal":"gold",true));
        hits.push({x:xr,y:yt[k],w:wr,h:nh,k:"t",j:k});}
      var yl=yt[D.nT-1]+44;
      o.push(S.LEGL(nar?6:14,yl,[["signal",null,"選んだ要求に直接つながる"],["gold","4 3","同じ設計の要素を通して広がる"]],sz,14));
      box.set(S.svg(Wd,yl+10,o));
      /* マトリクス（HTML。マスを押すと、つなぐ・外す） */
      var cols=[];_W01_TD.forEach(function(d,b){if(b<7||D.ds9)cols.push({k:"d",j:b,id:d[0]});});for(k=0;k<D.nT;k++)cols.push({k:"t",j:k,id:_W01_TT[k][0]});
      var h='<div style="margin:.2rem 0 .3rem">トレーサビリティマトリクス（マスを押すと、つなぐ・外す）</div><div class="wtable"><table><thead><tr><th></th>'+
        cols.map(function(c){var bad=c.k==="d"?A.noR.indexOf(c.j)>=0:A.noRT.indexOf(c.j)>=0;return '<th style="text-align:center;line-height:1.25;color:'+(bad?"var(--alias)":(c.k==="d"?"var(--purple)":"var(--green)"))+'">'+c.id.slice(0,3)+'<br>'+c.id.slice(3)+'</th>';}).join("")+'</tr></thead><tbody>';
      _W01_TS.forEach(function(s,a){h+='<tr><th style="text-align:left;'+(a===sel?"color:var(--signal)":"")+'">'+s[0]+'</th>';
        cols.forEach(function(c){var on=(c.k==="d"?D.sd[a]:D.st[a]).indexOf(c.j)>=0,bad=(c.k==="t"&&A.noT.indexOf(a)>=0)||(c.k==="d"?A.noR.indexOf(c.j)>=0:A.noRT.indexOf(c.j)>=0);
          var bg=bad?"var(--alias-soft)":(a===sel?"var(--signal-soft)":"transparent");
          h+='<td data-m="'+a+','+c.k+','+c.j+'" style="cursor:pointer;text-align:center;background:'+bg+'">'+(on?'<b style="color:'+(a===sel?"var(--signal)":"var(--ink)")+'">●</b>':"")+'</td>';});h+='</tr>';});
      mdiv.innerHTML=h+'</tbody></table></div>';
      /* 読み出し */
      var nm=function(arr,L){return arr.length?arr.map(function(x){return L[x][0];}).join("・"):"なし";};
      var up=[];_W01_TUS.forEach(function(js,u){if(js.indexOf(sel)>=0)up.push(_W01_TU[u]);});
      var r="<b>"+_W01_TS[sel][0]+"</b>（"+_W01_TS[sel][1]+"）の出典: 要求仕様書の項目「"+(up.join("」「")||"なし")+"」<br>";
      r+="変えると、直接: 設計の要素 "+nm(A.dsd,_W01_TD)+"、試験 "+nm(D.st[sel].slice().sort(_w01_stCmp),_W01_TT)+"<br>";
      r+="同じ設計の要素を使う要求 "+(A.ind.length?'<span style="color:var(--gold);font-weight:700">'+nm(A.ind,_W01_TS)+"</span>":"なし")+" にも広がる → 確かめ直す試験は全部で <b>"+nm(A.st,_W01_TT)+"</b><br>";
      r+=(A.noT.length?'<span class="warn">試験の無い要求: '+nm(A.noT,_W01_TS)+"</span>":'<span class="ok">試験の無い要求は無い</span>')+"、"+
        (A.noR.length?'<span class="warn">要求の無い設計の要素: '+nm(A.noR,_W01_TD)+"</span>":'<span class="ok">要求の無い設計の要素は無い</span>')+
        (A.noRT.length?'、<span class="warn">要求の無い試験: '+nm(A.noRT,_W01_TT)+"</span>":"");
      ro.innerHTML=_w01_nw(r+'<div class="wnote">要求と ST の番号は 03 章の表 6-1 と同じ（SR-R01 の試験 ST-043 は、抜けの例として初めは外してある）。要求仕様書の項目、DS の ID と対応は、この節の説明のための例（ロガーの設計の要素は 04 章 6 節）。網の要求の箱を押すと、その要求を選ぶ。網の設計の要素・試験の箱を押すと、つなぐ相手に選ぶ。</div>');
    }
    U.ctl.drag(box,function(type,x,y){if(type!=="down")return false;var hit=null;hits.forEach(function(q){if(x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h)hit=q;});if(!hit)return false;
      if(hit.k==="s"){sel=hit.j;sSel.set(sel);draw();return false;}
      var a=targets();for(var i=0;i<a.length;i++)if(a[i].k===hit.k&&a[i].j===hit.j){tSel.set(i);break;}return false;});
    mdiv.addEventListener("click",function(e){var td=e.target.closest?e.target.closest("[data-m]"):null;if(!td)return;var q=td.getAttribute("data-m").split(",");
      var a=+q[0],k=q[1],j=+q[2],arr=k==="d"?D.sd[a]:D.st[a],p=arr.indexOf(j);if(p>=0)arr.splice(p,1);else arr.push(j);draw();});
    fill();draw();
  };
