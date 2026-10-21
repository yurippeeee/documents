  /* ---------- 17: 共通（加わる粗さ・非和声音の種類の判定） ---------- */
  function _w17_pcs(sym){var c=chordParse(sym),o={};c.ivs.forEach(function(v){o[(c.rootPc+v)%12]=1;});return o;}
  function _w17_isCT(m,sym){return !!_w17_pcs(sym)[((m%12)+12)%12];}
  /* 加わる粗さ（f17.py の _f17_added と同じ式）: メロディの第 1〜8 倍音のうち和音の倍音と一致しないものと、和音の全倍音との粗さの和 */
  function _w17_added(chord,mel){
    var fm0=mfreq(mel),fmax=fm0*8*1.03,cp=[],R=0,co=[],cl=[],nw=[];
    chord.forEach(function(m,i){var f=mfreq(m);for(var h=1;f*h<=fmax;h++)cp.push([f*h,1/h,i,h]);});
    for(var k=1;k<=8;k++){
      var fk=fm0*k,ak=1/k,hit=null;
      for(var j=0;j<cp.length;j++)if(Math.abs(1200*Math.log(fk/cp[j][0])/Math.LN2)<=16){hit=cp[j];break;}
      if(hit){co.push([k,hit[2],hit[3]]);continue;}
      nw.push(k);
      cp.forEach(function(q){var r=roughPair(fk,ak,q[0],q[1]);R+=r;if(r>=0.015)cl.push([k,q[2],q[3],r]);});
    }
    return {R:100*R/roughRef(8),co:co,cl:cl,nw:nw,cp:cp};
  }
  /* メロディ [{n:"E5",d:拍数,tie:次へタイ}] と小節ごとの和音から、各音の役割を判定する（2 節の定義）。
     同じ小節の中でタイでつながる同じ高さの断片は 1 つの音として判定し、断片ごとに結果を返す（first: その音の最初の断片か） */
  function _w17_roles(mel,chs){
    var b=0,ps=mel.map(function(q){var p=parse(q.n),o={n:q.n,m:p.midi,dia:p.dia,b:b,d:q.d,tie:!!q.tie};b+=q.d;return o;});
    function bar(x){return Math.floor(x.b/4+1e-9);}
    var ns=[],map=[];
    ps.forEach(function(x,i){var pv=ps[i-1];
      if(pv&&pv.tie&&pv.m===x.m&&bar(pv)===bar(x)){ns[ns.length-1].d+=x.d;map.push(ns.length-1);return;}
      ns.push({n:x.n,m:x.m,dia:x.dia,b:x.b,d:x.d});map.push(ns.length-1);});
    function chAt(x){return chs[Math.min(chs.length-1,bar(x))];}
    function ct(x){return _w17_isCT(x.m,chAt(x));}
    function mv(a,c){if(!a||!c)return null;if(a.m===c.m)return {k:"same",dir:0};var dd=c.dia-a.dia;return {k:Math.abs(dd)===1?"step":"leap",dir:dd>0?1:-1};}
    var DW={"-1":"下へ","1":"上へ","0":""};
    function mtxt(x){return !x?"なし":x.k==="same"?"同じ高さ":(x.k==="step"?"2 度":"跳躍")+"（"+DW[x.dir]+"）";}
    var res=ns.map(function(N,i){
      var P=ns[i-1],Q=ns[i+1],r={note:N,ch:chAt(N),ct:ct(N)};
      if(r.ct){r.type="コードトーン";return r;}
      var inn=mv(P,N),out=mv(N,Q),pCT=P&&ct(P),qCT=Q&&ct(Q),chIn=P&&chAt(P)!==chAt(N),chOut=Q&&chAt(Q)!==chAt(N);
      r.inn=mtxt(inn);r.out=mtxt(out);
      if(inn&&inn.k==="same"&&chIn&&pCT&&out&&out.k==="step"&&qCT)r.type="掛留音";
      else if(out&&out.k==="same"&&chOut&&qCT)r.type="先取音";
      else if(inn&&out&&inn.k==="step"&&out.k==="step"&&pCT&&qCT)r.type=inn.dir===out.dir?"経過音":"刺繍音";
      else if(inn&&out&&inn.k==="leap"&&out.k==="step"&&qCT)r.type="倚音";
      else if(inn&&out&&inn.k==="step"&&out.k==="leap"&&inn.dir!==out.dir&&pCT&&qCT)r.type="逸音";
      else r.type=!P?"その他（前の音が無い）":!Q?"その他（解決しないまま終わる）":"その他";
      return r;
    });
    return ps.map(function(x,i){var r=res[map[i]];return {piece:x,note:r.note,ch:r.ch,ct:r.ct,type:r.type,inn:r.inn,out:r.out,idx:map[i],first:i===0||map[i-1]!==map[i]};});
  }
  /* 非和声音を抜いた骨組み: 先取音・逸音・その他は前の音を延ばし、経過音・刺繍音・倚音・掛留音は次の音（解決先）を早める */
  function _w17_skeleton(mel,chs){
    var rs=_w17_roles(mel,chs),out=[],carry=0;
    mel.forEach(function(q,i){var r=rs[i];
      if(r.ct){var o={n:q.n,d:q.d+carry,tie:q.tie};carry=0;out.push(o);return;}
      var back=/先取|逸音|その他/.test(r.type)||i===mel.length-1;
      if(back&&out.length){out[out.length-1].d+=q.d;}else carry+=q.d;});
    if(carry){if(out.length)out[out.length-1].d+=carry;}
    out.forEach(function(q,i){if(q.tie&&(!out[i+1]||out[i+1].n!==q.n))q.tie=false;});
    return out;
  }
  /* 4/4 の譜表（色付きの音・下の文字・上のコードネーム）。notes=[{n,d,tie,col,lab,lcol}]、chs=小節ごとの和音 */
  function _w17_staff(notes,chs,s,u){
    s=s||9;u=u||30;var x0=staffStart(s,0,"4/4"),G=1.4*s,items=[],b=0;
    function X(bb){return x0+u*bb+Math.floor(bb/4+1e-9)*G;}
    notes.forEach(function(q){
      var dd=durDot(q.d),it={x:X(b),notes:[q.n],dur:dd.dur,dot:dd.dot,fill:q.col||V("ink")};
      if(q.tie)it.tie=true;
      if(Math.abs(b%4)<1e-9&&chs[Math.round(b/4)]){it.sym=chs[Math.round(b/4)];it.symcol=V("ink");}
      if(q.lab){it.label=q.lab;it.lcol=q.lcol||q.col;it.lsz=10.5;it.ldy=2.3*s;}
      items.push(it);b+=q.d;
    });
    var nb=Math.round(b/4);
    for(var k=1;k<nb;k++)items.push({x:X(4*k)-0.7*G,bar:true});
    items.push({x:X(4*nb)-0.7*G+0.5*s,bar:"end"});
    return staff({s:s,w:X(4*nb)-0.7*G+0.6*s,clef:"treble",time:"4/4",items:items,bottom:4.4*s});
  }
  /* メロディと和音を鳴らす事象の列（和音は小節ごとに前の和音から近い配置）。返り値 {evs, mel:[事象の番号→音の番号]} */
  function _w17_events(mel,chs,spb){
    var evs=[],prev=null;
    chs.forEach(function(c,k){var v=voiceLead(c,prev,52,67);prev=v;evs.push({t:4*k*spb,d:4*spb*0.98,m:v,v:0.7,mi:-1});});
    var b=0;mel.forEach(function(q,i){if(q.rest){b+=q.d;return;}
      if(i>0&&mel[i-1].tie&&mel[i-1].n===q.n){b+=q.d;return;}
      var d=q.d;for(var j=i;j<mel.length-1&&mel[j].tie&&mel[j+1].n===q.n;j++)d+=mel[j+1].d;
      evs.push({t:b*spb,d:d*spb*0.95,m:[parse(q.n).midi],v:1,mi:i});b+=q.d;});
    evs.sort(function(a,c){return a.t-c.t;});
    return evs;
  }
  var _W17_EX=[
    ["(a) 経過音",[["E5",1],["D5",1],["C5",2],["B4",4]],["C","G"]],
    ["(b) 刺繍音",[["E5",1],["D5",1],["E5",2],["D5",4]],["C","G"]],
    ["(c) 倚音",[["E5",2],["G4",2],["C5",2],["B4",2]],["C","G"]],
    ["(d) 掛留音",[["E5",2],["C5",2,1],["C5",2],["B4",2]],["C","G"]],
    ["(e) 先取音",[["E5",2],["C5",1],["B4",1],["B4",4]],["C","G"]],
    ["(f) 逸音",[["C5",2],["E5",1],["F5",1],["D5",4]],["C","G"]],
    ["1 節の例（4 小節）",[["E5",1],["D5",1],["C5",2],["F5",1],["E5",1],["F5",2],["D5",1],["C5",1],["B4",2],["C5",4]],["C","F","G","C"]]];
  var _W17_CHS=["C","Dm","Em","F","G","Am","G7"];

  /* ============ 17. w17_roles — 和音を変えると、メロディの音の役割が変わる ============ */
  REG.w17_roles=function(el){
    head(el,"Roles","例を選び、各小節の和音を変えて、メロディの各音の役割を見る");
    var row=ctrls(el),sx=select(row,"例",_W17_EX.map(function(e){return e[0];}));
    var row2=ctrls(el),sels=[];
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bP=button(bar,"▶ 再生"),bS=button(bar,"▶ 非和声音を抜いて再生"),bR=button(bar,"例の和音に戻す");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el),cur=-1;
    function ex(){return _W17_EX[+sx.value];}
    function mel(){return ex()[1].map(function(q){return {n:q[0],d:q[1],tie:!!q[2]};});}
    function chs(){return sels.map(function(s){return _W17_CHS[+s.value];});}
    function build(){
      row2.innerHTML="";sels=[];
      ex()[2].forEach(function(c,k){var s=select(row2,(k+1)+" 小節目の和音",_W17_CHS);s.value=String(_W17_CHS.indexOf(c));s.addEventListener("change",function(){stopAll();cur=-1;draw();});sels.push(s);});
    }
    function draw(){
      var ms=mel(),cs=chs(),rs=_w17_roles(ms,cs),vo=[],prev=null;
      cs.forEach(function(c){prev=voiceLead(c,prev,52,67);vo.push(prev);});
      var notes=ms.map(function(q,i){var r=rs[i],col=(cur>=0&&r.idx===rs[cur].idx)?V("signal"):r.ct?V("green"):V("alias");
        var lab=(r.ct||!r.first)?"":r.type.replace(/（.*）/,"");return {n:q.n,d:q.d,tie:q.tie,col:col,lab:lab,lcol:V("alias")};});
      var st=_w17_staff(notes,cs,9,ms.length>6?27:32);
      view.innerHTML='<div style="display:flex;justify-content:center">'+svgWrap(st.w,st.h,st.svg)+'</div>'+
        '<div class="legend" style="justify-content:center"><span><i style="background:var(--green)"></i>コードトーン</span><span><i style="background:var(--alias)"></i>非和声音（下に種類）</span></div>';
      var lines=[];
      rs.forEach(function(r,i){if(r.ct||!r.first)return;var N=r.note,bar=Math.floor(N.b/4+1e-9)+1,beat=N.b-4*(bar-1)+1;
        var v=_w17_added(vo[bar-1],N.m).R;
        lines.push((bar)+' 小節目 '+(Number.isInteger(beat)?beat:beat.toFixed(1))+' 拍目の <b>'+nname(N.n)+'</b>（'+r.ch+' の上）: <b style="color:var(--alias)">'+r.type+'</b> — 入り方 '+r.inn+'、出方 '+r.out+'、加わる粗さ '+v.toFixed(1));});
      ro.innerHTML=lines.length?lines.join('<br>'):'非和声音はない（すべてコードトーン）';
    }
    function play(btn,skel){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();cur=-1;draw();return;}
      var ms=mel(),cs=chs(),spb=60/88;
      if(skel)ms=_w17_skeleton(ms,cs);
      var evs=_w17_events(ms,cs,spb);
      playEvents(evs,{timbre:"piano",onStep:function(i){if(!skel&&evs[i].mi>=0){cur=evs[i].mi;draw();}},onEnd:function(){btn.setAttribute("aria-pressed","false");cur=-1;draw();}});
      btn.setAttribute("aria-pressed","true");
    }
    sx.addEventListener("change",function(){stopAll();cur=-1;build();draw();});
    bP.addEventListener("click",function(){play(bP,false);});
    bS.addEventListener("click",function(){play(bS,true);});
    bR.addEventListener("click",function(){stopAll();cur=-1;build();draw();});
    build();draw();
  };

  /* ============ 17. w17_beat — 非和声音を置く拍と長さ ============ */
  REG.w17_beat=function(el){
    head(el,"Beat","非和声音 C5 を置く拍と長さを変え、加わる粗さの帯と音を比べる");
    var row=ctrls(el),sE=select(row,"1 小節目の 3・4 拍目の音",["C5（C の和音のコードトーン）","G4（ここから跳ぶ）"]),
        sS=select(row,"2 小節目で C5 を鳴らし始める拍",["1 拍目（強拍）","2 拍目（弱拍）","3 拍目（中強拍）","4 拍目（弱拍）"]),
        sL=select(row,"C5 の長さ",["半拍","1 拍","2 拍","3 拍"]);
    sL.value="3";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bP=button(bar,"▶ 再生"),bN=button(bar,"▶ 非和声音なし（B4 のまま）");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el),cur=-1,CHS=["C","G"],VO=[voiceLead("C",null,52,67)];VO.push(voiceLead("G",VO[0],52,67));
    function split(len){var out=[],V2=[2,1.5,1,0.5];while(len>1e-9){for(var i=0;i<V2.length;i++)if(V2[i]<=len+1e-9){out.push(V2[i]);len-=V2[i];break;}}return out;}
    function seg(n,len,tieLast){var p=split(len);return p.map(function(d,i){return {n:n,d:d,tie:i<p.length-1||(tieLast&&i===p.length-1)};});}
    function melody(){
      var st=+sS.value,L=[0.5,1,2,3][+sL.value],end=Math.min(4,st+L),e1=sE.value==="0"?"C5":"G4",m=[{n:"E5",d:2}];
      var hold=(st===0&&e1==="C5");
      m.push({n:e1,d:2,tie:hold});
      if(st>0)m=m.concat(seg("B4",st,false));
      m=m.concat(seg("C5",end-st,false));
      if(end<4)m=m.concat(seg("B4",4-end,false));
      return {m:m,st:st,L:end-st};
    }
    function draw(){
      var M=melody(),ms=M.m,rs=_w17_roles(ms,CHS),R=_w17_added(VO[1],72).R;
      /* 同じ高さがタイで続く断片は 1 つの音として種類を判定する（最初の断片の判定を使う） */
      var typ=null;rs.forEach(function(r){if(!r.ct&&r.note.n==="C5"&&r.note.b>=4-1e-9&&!typ)typ=r;});
      var notes=ms.map(function(q,i){var r=rs[i],col=(cur>=0&&r.idx===rs[cur].idx)?V("signal"):r.ct?V("green"):V("alias");
        return {n:q.n,d:q.d,tie:q.tie,col:col,lab:(!r.ct&&r.first)?r.type.replace(/（.*）/,""):"",lcol:V("alias")};});
      var st=_w17_staff(notes,CHS,9,34);
      /* 帯: 半拍ごとの加わる粗さ */
      var W=640,u=(W-90)/16,x0=84,b=[],H=150,yb=128;
      for(var k=0;k<16;k++){var beat=Math.floor(k/2)%4,x=x0+k*u;
        b.push('<rect x="'+x.toFixed(1)+'" y="18" width="'+u.toFixed(1)+'" height="'+(yb-18)+'" fill="'+(beat===0?V("signal-soft"):beat===2?V("gold-soft"):"none")+'"/>');
        if(k%2===0)b.push(tx(x+u,14,(beat+1)+"","middle",10,beat===0?V("signal"):beat===2?V("gold"):V("muted"),beat===0||beat===2));}
      b.push(ln(x0+8*u,10,x0+8*u,yb+4,V("ink"),1.6));
      b.push(tx(x0+4,H-4,"C の和音","start",10.5,V("ink"),true));b.push(tx(x0+8*u+4,H-4,"G の和音","start",10.5,V("ink"),true));
      var t=0;ms.forEach(function(q,i){var ch=t<4-1e-9?0:1,r=rs[i].ct?0:_w17_added(VO[ch],parse(q.n).midi).R,h=Math.max(1.5,r*0.75),x=x0+t*2*u;
        b.push('<rect x="'+(x+1).toFixed(1)+'" y="'+(yb-h).toFixed(1)+'" width="'+(q.d*2*u-2).toFixed(1)+'" height="'+h.toFixed(1)+'" rx="2" fill="'+(r>0?V("alias-soft"):V("green-soft"))+'" stroke="'+(r>0?V("alias"):V("green"))+'"/>');
        if(r>0&&rs[i].first)b.push(tx(x+3,yb-h-5,r.toFixed(1),"start",10,V("alias"),true));
        t+=q.d;});
      b.push(ln(x0,yb,x0+16*u,yb,V("muted"),1));
      b.push(tx(x0-8,yb-4,"加わる粗さ","end",10,V("muted")));
      b.push(tx(x0-8,30,"拍","end",10,V("muted")));
      view.innerHTML='<div style="display:flex;justify-content:center">'+svgWrap(st.w,st.h,st.svg)+'</div>'+svgWrap(W,H,b.join(""));
      var strong=M.st===0||M.st===2||(M.st<2&&M.st+M.L>2);
      ro.innerHTML='2 小節目の C5: <b style="color:var(--alias)">'+(typ?typ.type:"—")+'</b>（入り方 '+(typ?typ.inn:"—")+'、出方 '+(typ?typ.out:"—")+'）<br>'+
        '加わる粗さ <b>'+R.toFixed(1)+'</b>（G の和音 B3・D4・G4 の上） ／ 強拍・中強拍に重なる: <b>'+(strong?"はい":"いいえ")+'</b> ／ 続く長さ <b>'+M.L+'</b> 拍 ／ 加わる粗さ × 長さ <b>'+(R*M.L).toFixed(1)+'</b>';
    }
    function play(btn,none){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();cur=-1;draw();return;}
      var ms=none?[{n:"E5",d:2},{n:sE.value==="0"?"C5":"G4",d:2},{n:"B4",d:4}]:melody().m,evs=_w17_events(ms,CHS,60/84);
      playEvents(evs,{timbre:"piano",onStep:function(i){if(!none&&evs[i].mi>=0){cur=evs[i].mi;draw();}},onEnd:function(){btn.setAttribute("aria-pressed","false");cur=-1;draw();}});
      btn.setAttribute("aria-pressed","true");
    }
    [sE,sS,sL].forEach(function(s){s.addEventListener("change",function(){stopAll();cur=-1;draw();});});
    bP.addEventListener("click",function(){play(bP,false);});
    bN.addEventListener("click",function(){play(bN,true);});
    draw();
  };

  /* ============ 17. w17_clash — 和音の上の音のぶつかり ============ */
  REG.w17_clash=function(el){
    head(el,"Clash","和音とメロディの音を選び、倍音の重なりと加わる粗さを見る");
    var CH=["C","Dm","Em","F","G","Am","CM7","Dm7","Em7","FM7","G7","Am7","Bm7(b5)"],LT="CDEFGAB",PC=[0,2,4,5,7,9,11];
    var row=ctrls(el),sC=select(row,"和音",CH.map(function(c){return c.replace("b5","♭5");})),sN=select(row,"メロディの音",LT.split("")),sO=select(row,"高さ",["C5〜B5","C6〜B6（1 オクターブ上）"]);
    sC.value="6";sN.value="3";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bC=button(bar,"▶ 和音だけ"),bM=button(bar,"▶ 和音 + メロディの音");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el);
    function cat(sym,pc){
      var c=chordParse(sym),pcs=_w17_pcs(sym),iv=((pc-c.rootPc)%12+12)%12;
      if(pcs[pc])return {k:"ct",t:"構成音（コードトーン）",col:"green"};
      var tri=c.ivs.length===3;
      if(tri&&(iv===10||iv===11))return {k:"7th",t:"7 度の音（足すとセブンスコード）",col:"gold"};
      var deg=iv<=3?"9":iv<=6?"11":"13",acc=({1:"♭",3:"♯",6:"♯",8:"♭"})[iv]||"";
      for(var p in pcs)if(((pc-(+p))%12+12)%12===1)return {k:"av",t:"アボイドノート（"+acc+deg+" 度の音。"+NS[+p].replace("♯","♯")+" の半音上）",col:"alias"};
      return {k:"t",t:"テンション（"+acc+deg+" 度の音）",col:"blue"};
    }
    function comb(chord,mel){
      var a=_w17_added(chord,mel),W=660,lw=88,fmin=230,fmax=7400,X=function(f){return lw+(W-lw-6)*Math.log(f/fmin)/Math.log(fmax/fmin);};
      var ym=56,yc=116,hm=30,b=[],COL=["blue","purple","gold","muted"];
      b.push(ln(lw,ym,W-4,ym,V("line"),1));b.push(ln(lw,yc,W-4,yc,V("line"),1));
      b.push(tx(lw-8,ym-4,nname(mel),"end",12,V("signal"),true));
      var xx=lw-8;for(var i=chord.length-1;i>=0;i--){var nm=nname(chord[i]);b.push(tx(xx,yc-4,nm,"end",10.5,V(COL[i]),true));xx-=7*nm.length+5;}
      var topC={};a.cp.forEach(function(q){if(q[0]<fmin||q[0]>fmax)return;var hh=Math.max(2.5,hm*q[1]),px=X(q[0])+(q[2]-(chord.length-1)/2)*0.9;
        b.push('<rect x="'+(px-1.3).toFixed(1)+'" y="'+(yc-hh).toFixed(1)+'" width="2.6" height="'+hh.toFixed(1)+'" fill="'+V(COL[q[2]])+'"/>');topC[q[2]+":"+q[3]]=[px,yc-hh];});
      var topM={};for(var k=1;k<=8;k++){var fk=mfreq(mel)*k,hh=hm/k,px=X(fk);
        b.push('<rect x="'+(px-2).toFixed(1)+'" y="'+(ym-hh).toFixed(1)+'" width="4" height="'+hh.toFixed(1)+'" rx="1" fill="'+V("signal")+'"/>');b.push(tx(px,ym-hh-4,String(k),"middle",9,V("muted")));topM[k]=[px,ym];}
      a.cl.forEach(function(q){var p1=topM[q[0]],p2=topC[q[1]+":"+q[2]];if(!p2)return;b.push('<path d="'+wavy(p1[0],p1[1],p2[0],p2[1],7,2)+'" fill="none" stroke="'+V("alias")+'" stroke-width="1.5" stroke-opacity="'+Math.min(1,0.3+q[3]*9).toFixed(2)+'"/>');});
      a.co.forEach(function(q){var p1=topM[q[0]],p2=topC[q[1]+":"+q[2]];if(!p2)return;b.push(ln(p1[0],p1[1],p2[0],p2[1],V("green"),2.2));b.push('<circle cx="'+p2[0].toFixed(1)+'" cy="'+p2[1].toFixed(1)+'" r="2.6" fill="'+V("green")+'"/>');});
      [60,72,84,96,108].forEach(function(m){var f=mfreq(m);if(f>=fmin&&f<=fmax){b.push(ln(X(f),yc+2,X(f),yc+6,V("muted"),1));b.push(tx(X(f),yc+17,"C"+(m/12-1),"middle",9.5,V("muted")));}});
      b.push(tx(W-4,16,"一致 "+a.co.length+" 本 ・ 一致しない "+a.nw.length+" 本 ・ 加わる粗さ "+a.R.toFixed(1),"end",11,a.R>0.05?V("alias"):V("green"),true));
      return {svg:svgWrap(W,140,b.join("")),a:a};
    }
    function cur(){var sym=CH[+sC.value],ch=voiceLead(sym,null,52,67),pc=PC[+sN.value],base=sO.value==="0"?72:84;return {sym:sym,ch:ch,pc:pc,mel:base+pc,base:base};}
    function draw(){
      var c=cur(),cb=comb(c.ch,c.mel),ca=cat(c.sym,c.pc);
      /* 7 つの音の棒 */
      var W=660,H=150,yb=112,bw=60,b=[],mx=0,vals=PC.map(function(p){var v=_w17_added(c.ch,c.base+p).R;mx=Math.max(mx,v);return v;}),sc=80/Math.max(60,mx);
      PC.forEach(function(p,i){var v=vals[i],k=cat(c.sym,p),x=70+i*(bw+18),h=Math.max(1.5,v*sc),sel=i===+sN.value;
        b.push('<rect x="'+x+'" y="'+(yb-h).toFixed(1)+'" width="'+bw+'" height="'+h.toFixed(1)+'" rx="3" fill="'+V(k.col+"-soft")+'" stroke="'+V(k.col)+'" stroke-width="'+(sel?3:1.2)+'"/>');
        b.push(tx(x+bw/2,yb-h-6,v.toFixed(1),"middle",10.5,V(k.col),true));
        b.push(tx(x+bw/2,yb+16,nname(c.base+p),"middle",11,sel?V("signal"):V("ink"),true));
        b.push(tx(x+bw/2,yb+31,k.k==="ct"?"構成音":k.k==="av"?"アボイド":k.k==="7th"?"7 度の音":"テンション","middle",9.5,V(k.col)));});
      b.push(ln(60,yb,W-10,yb,V("muted"),1));
      view.innerHTML=cb.svg+svgWrap(W,H,b.join(""));
      var top=cb.a.cl.slice().sort(function(p,q){return q[3]-p[3];})[0],msg="";
      if(top){var fm=mfreq(c.mel)*top[0],fc=mfreq(c.ch[top[1]])*top[2],df=Math.abs(fm-fc),semi=1200*Math.abs(Math.log(fm/fc)/Math.LN2)/100;
        msg='<br>いちばん粗い組: メロディの第 '+top[0]+' 倍音（'+fm.toFixed(1)+' Hz）と '+nname(c.ch[top[1]])+' の第 '+top[2]+' 倍音（'+fc.toFixed(1)+' Hz）、差 '+df.toFixed(1)+' Hz（約 '+semi.toFixed(1)+' 半音）、粗さ '+(100*top[3]/roughRef(8)).toFixed(1);}
      else if(ca.k!=="ct")msg='<br>8 つの倍音がすべて和音の倍音と一致する（和音のある音の周波数のほぼ 3 倍などの高さにある）';
      ro.innerHTML=c.sym.replace("b5","♭5")+'（'+c.ch.map(function(m){return nname(m);}).join('・')+'）の上の <b>'+nname(c.mel)+'</b>: <b style="color:var(--'+ca.col+')">'+ca.t+'</b> ／ 加わる粗さ <b>'+cb.a.R.toFixed(1)+'</b>'+msg;
    }
    function play(btn,withMel){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var c=cur();playEvents([{t:0,d:2.6,m:withMel?c.ch.concat([c.mel]):c.ch}],{timbre:"organ",onEnd:function(){btn.setAttribute("aria-pressed","false");}});
      btn.setAttribute("aria-pressed","true");
    }
    [sC,sN,sO].forEach(function(s){s.addEventListener("change",function(){stopAll();draw();});});
    bC.addEventListener("click",function(){play(bC,false);});
    bM.addEventListener("click",function(){play(bM,true);});
    draw();
  };
