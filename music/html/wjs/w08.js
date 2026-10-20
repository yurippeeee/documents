  /* ============ 08. 三和音（共通） ============ */
  /* 種類: n 名前, s コードネームの記号, t 根音から 3 度の音までの半音, f 根音から 5 度の音までの半音, c 色, r 読み */
  var _w08_T=[{n:"長三和音",s:"",t:4,f:7,c:"blue",r:"メジャー"},{n:"短三和音",s:"m",t:3,f:7,c:"purple",r:"マイナー"},
    {n:"減三和音",s:"dim",t:3,f:6,c:"gold",r:"ディミニッシュ"},{n:"増三和音",s:"aug",t:4,f:8,c:"alias",r:"オーギュメント"}];
  var _w08_ROOTS=["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];
  var _w08_QC={0:"signal",3:"purple",4:"blue",5:"green",6:"gold",7:"green",8:"alias",9:"blue"};
  var _w08_QN={3:"短 3 度",4:"長 3 度",5:"完全 4 度",6:"減 5 度",7:"完全 5 度",8:"増 5 度",9:"長 6 度"};
  var _w08_RD={C:"シー",D:"ディー",E:"イー",F:"エフ",G:"ジー",A:"エー",B:"ビー"};
  function _w08_disp(r){return r.replace("#","♯").replace("b","♭");}
  function _w08_read(r){return _w08_RD[r[0]]+(r[1]==="#"?"・シャープ":r[1]==="b"?"・フラット":"");}
  /* 根音（例 "F#"）・オクターブ番号・種類 → 根音から 1 つおきの文字で綴った 3 つの音名（例 ["F#4","A4","C#5"]）。
     3 度の音か 5 度の音に ♯ か ♭ を 2 つ付ける必要があるときは null */
  function _w08_spell(r,oc,ty){
    var p=parse(r+oc), out=[r+oc];
    for(var k=1;k<=2;k++){var dia=p.dia+2*k, li=((dia%7)+7)%7, o2=Math.floor(dia/7), a=p.midi+(k===1?ty.t:ty.f)-(12*(o2+1)+PCL[li]);
      if(a<-1||a>1)return null; out.push(LETTERS[li]+(a===1?"#":a===-1?"b":"")+o2);}
    return out;
  }
  function _w08_cols(ns){var r=parse(ns[0]).midi;return ns.map(function(n,i){return i?_w08_QC[parse(n).midi-r]:"signal";});}
  function _w08_names(ns){return ns.map(function(n){return nname(n,false);}).join("・");}
  /* 押すと鳴らし、鳴っている間にもう一度押すと止める */
  function _w08_play(btn,evs){
    if(btn.getAttribute("aria-pressed")==="true"){stopAll();return;}
    playEvents(evs,{timbre:"piano",onEnd:function(){btn.setAttribute("aria-pressed","false");}});
    btn.setAttribute("aria-pressed","true"); hold(function(){btn.setAttribute("aria-pressed","false");});
  }
  /* 同時に鳴らす（arp なら下から 1 音ずつ鳴らしてから同時に） */
  function _w08_evs(ms,arp){
    if(!arp)return [{t:0,d:2.2,m:ms}];
    var e=ms.map(function(m,i){return {t:i*0.55,d:0.52,m:[m]};}); e.push({t:ms.length*0.55+0.2,d:2,m:ms}); return e;
  }
  function _w08_row(svgs){return '<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgs.join("")+'</div>';}

  /* ============ 08. w08_quiz — 4 種類の三和音の聞き分け ============ */
  REG.w08_quiz=function(el){
    head(el,"Ear","鳴った三和音の種類を聞き分ける");
    var row=ctrls(el), sr=select(row,"出題の範囲",["長三和音・短三和音","4 種類すべて"]), sm=select(row,"鳴らし方",["同時に","1 音ずつ（下から）のあと同時に"]);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bQ=button(bar,"▶ 出題"), bR=button(bar,"▶ もう一度");
    var abar=mk("div","pbtns"); el.appendChild(abar);
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), q=null, done=false, ok=0, total=0;
    function pool(){return sr.value==="0"?[0,1]:[0,1,2,3];}
    function msg(t){view.innerHTML='<div style="padding:.8rem;color:var(--muted);text-align:center">'+t+'</div>';}
    function score(){return '正解 '+ok+' / '+total;}
    function buttons(){abar.innerHTML=""; pool().forEach(function(i){var b=button(abar,_w08_T[i].n); b.style.borderColor=V(_w08_T[i].c); b.addEventListener("click",function(){answer(i);});});}
    function newQ(){
      var p=pool(), ti=p[Math.floor(Math.random()*p.length)], ty=_w08_T[ti];
      var rs=_w08_ROOTS.filter(function(r){return _w08_spell(r,4,ty);}), r=rs[Math.floor(Math.random()*rs.length)];
      var ns=_w08_spell(r,parse(r+"4").midi>=67?3:4,ty);   /* 根音が G4 以上なら 1 オクターブ下げる */
      q={ti:ti,ns:ns,ms:ns.map(function(n){return parse(n).midi;})}; done=false;
      msg("聞いて、下のボタンから種類を選ぶ"); ro.innerHTML=score();
      playEvents(_w08_evs(q.ms,sm.value==="1"),{timbre:"piano"});
    }
    function answer(i){
      if(!q||done)return; done=true; total++; var good=i===q.ti; if(good)ok++;
      var ty=_w08_T[q.ti], cols=_w08_cols(q.ns), hl={};
      q.ms.forEach(function(m,k){hl[m]={c:cols[k],label:nname(q.ns[k],false),strong:true};});
      var lo=Math.floor(q.ms[0]/12)*12, kb=kbd(lo,lo+23,{ww:16,wh:62,hl:hl,names:"c"});
      var st=staff({s:9,w:140,clef:"treble",items:[{x:86,notes:q.ns,fills:cols.map(V)}]});
      view.innerHTML=_w08_row([svgWrap(st.w,st.h,st.svg),svgWrap(kb.w,kb.h,kb.svg)]);
      ro.innerHTML=(good?'<span class="ok">正解</span>':'<span class="warn">ちがう</span>（選んだのは '+_w08_T[i].n+'）')+
        ' — 答えは <b style="color:'+V(ty.c)+'">'+ty.n+'</b>: '+_w08_names(q.ns)+'（半音 '+ty.t+' + '+(ty.f-ty.t)+'。根音 → 5 度の音は'+_w08_QN[ty.f]+'） ／ '+score();
    }
    bQ.addEventListener("click",newQ);
    bR.addEventListener("click",function(){if(q)_w08_play(bR,_w08_evs(q.ms,sm.value==="1"));});
    sr.addEventListener("change",function(){buttons();q=null;msg("「▶ 出題」を押すと三和音が鳴る");ro.innerHTML=score();});
    buttons(); msg("「▶ 出題」を押すと三和音が鳴る"); ro.innerHTML=score();
  };

  /* ============ 08. w08_triad — 種類と根音からコードネームと構成音を求める ============ */
  REG.w08_triad=function(el){
    head(el,"Triad","種類と根音を選ぶと、コードネームと構成音が求まる");
    var row=ctrls(el), st=select(row,"種類",_w08_T.map(function(t){return t.n+"（"+(t.s||"記号なし")+"）";})), sr=select(row,"根音",_w08_ROOTS.map(_w08_disp));
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var b1=button(bar,"▶ 同時に"), b2=button(bar,"▶ 1 音ずつ"), b3=button(bar,"▶ この根音で 4 種類");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el);
    var ALT={"C#":"Db","Db":"C#","D#":"Eb","Eb":"D#","F#":"Gb","Gb":"F#","G#":"Ab","Ab":"G#","A#":"Bb","Bb":"A#"};
    function sync(){   /* この種類で ♯・♭ を 2 つ付けないと書けない根音は選べなくし、選んでいたら異名同音の根音へ移す */
      var ty=_w08_T[+st.value], bad=[];
      _w08_ROOTS.forEach(function(r,i){var okk=!!_w08_spell(r,4,ty), o=sr.options[i]; o.disabled=!okk; o.textContent=_w08_disp(r)+(okk?"":"（選べない）"); if(!okk)bad.push(_w08_disp(r));});
      if(sr.options[+sr.value].disabled){var a=ALT[_w08_ROOTS[+sr.value]], j=a?_w08_ROOTS.indexOf(a):-1; sr.value=String(j>=0&&!sr.options[j].disabled?j:0);}
      return bad;
    }
    function cur(){var ty=_w08_T[+st.value], r=_w08_ROOTS[+sr.value], ns=_w08_spell(r,4,ty); return {ty:ty,r:r,ns:ns,ms:ns.map(function(n){return parse(n).midi;})};}
    function draw(){
      var bad=sync(), c=cur(), ty=c.ty, cols=_w08_cols(c.ns), rn=_w08_disp(c.r), p=parse(c.ns[0]);
      var hl={}; c.ms.forEach(function(m,k){hl[m]={c:cols[k],label:nname(c.ns[k],false),strong:true};});
      var kb=kbd(60,83,{ww:15,wh:60,hl:hl,names:"c"}), x0=staffStart(10,0,null);
      var stf=staff({s:10,w:x0+180,clef:"treble",items:[{x:x0+8,notes:[c.ns[0]],fill:V(cols[0])},{x:x0+46,notes:[c.ns[1]],fill:V(cols[1])},{x:x0+84,notes:[c.ns[2]],fill:V(cols[2])},
        {x:x0+146,notes:c.ns,fills:cols.map(V),label:"同時に",lcol:V("muted"),lbold:false}]});
      var sv=spec(c.ns.map(function(n,i){return {f:mfreq(c.ms[i]),label:nname(n),c:cols[i]};}),{H:8,w:640,lane:30});
      var rd=_w08_read(c.r)+(ty.s?"・"+ty.r:"（"+_w08_read(c.r)+"・メジャーとも）");
      view.innerHTML='<div style="text-align:center;margin:.1rem 0 .4rem"><span style="font-size:1.55rem;font-weight:700;color:'+V(ty.c)+'">'+esc(rn+ty.s)+'</span>'+
        ' <span style="color:var(--muted);font-size:.85rem">'+esc(rd)+'</span></div>'+_w08_row([svgWrap(stf.w,stf.h,stf.svg),svgWrap(kb.w,kb.h,kb.svg)])+
        '<div style="margin-top:.5rem">'+svgWrap(sv.w,sv.h,sv.svg,"spec")+'</div>';
      var L=[], how=[];
      for(var k=1;k<=2;k++){var dia=p.dia+2*k, li=((dia%7)+7)%7, o2=Math.floor(dia/7), nat=LETTERS[li], got=12*(o2+1)+PCL[li]-p.midi, want=k===1?ty.t:ty.f;
        L.push(nat); how.push((k===1?"3 度の音":"5 度の音")+": "+rn+" から "+nat+" は半音 "+got+" → "+(got===want?want+" なのでそのまま "+nat:want+" にするため <b>"+nname(c.ns[k],false)+"</b>"));}
      ro.innerHTML='① 文字: '+rn[0]+'・'+L[0]+'・'+L[1]+'（根音から 1 つおき）<br>② '+how.join(" ／ ")+
        '<br>→ <b style="color:'+V(ty.c)+'">'+esc(rn+ty.s)+'</b> = '+_w08_names(c.ns)+'（半音 '+ty.t+' + '+(ty.f-ty.t)+'。根音 → 5 度の音は'+_w08_QN[ty.f]+'）'+
        '<br>'+specStats(sv)+(bad.length?'<br>選べない根音: '+bad.join("・")+'（3 度の音か 5 度の音に ♯ か ♭ を 2 つ付ける必要があるため）':'');
    }
    st.addEventListener("change",draw); sr.addEventListener("change",draw);
    b1.addEventListener("click",function(){_w08_play(b1,_w08_evs(cur().ms,false));});
    b2.addEventListener("click",function(){_w08_play(b2,_w08_evs(cur().ms,true));});
    b3.addEventListener("click",function(){var r=cur().ms[0];_w08_play(b3,_w08_T.map(function(t,i){return {t:i*1.7,d:1.55,m:[r,r+t.t,r+t.f]};}));});
    draw();
  };

  /* ============ 08. w08_voicing — 転回形と配置 ============ */
  REG.w08_voicing=function(el){
    head(el,"Voicing","ベース（転回形）と配置を変えて、響きを比べる");
    var CH=[["C","C",0],["Cm","C",1],["F","F",0],["G","G",0],["Am","A",1],["Dm","D",1]];
    var row=ctrls(el), sc=select(row,"和音",CH.map(function(x){return x[0];})), sb=select(row,"ベース",["根音（基本形）","3 度の音（第 1 転回形）","5 度の音（第 2 転回形）"]),
        sp=select(row,"配置",["密集配置","開離配置"]), sh=select(row,"ベースの高さ",["低い（C3〜B3）","真ん中（C4〜B4）"]);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var b1=button(bar,"▶ 同時に"), b2=button(bar,"▶ 下から 1 音ずつ");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el);
    function cur(){
      var ch=CH[+sc.value], ty=_w08_T[ch[2]], pcs=_w08_spell(ch[1],4,ty).map(function(n){return n.replace(/-?\d+$/,"");});
      var bi=+sb.value, oc=sh.value==="0"?3:4, bass=pcs[bi]+oc, m0=parse(bass).midi, list=[];
      for(var o=oc;o<=oc+3;o++)for(var r=0;r<3;r++){var n=pcs[r]+o, m=parse(n).midi; if(m>m0)list.push({m:m,n:n,r:r});}
      list.sort(function(a,b){return a.m-b.m;});
      var open=sp.value==="1", up=open?[list[1],list[3]]:[list[0],list[1]];
      return {ch:ch,ty:ty,pcs:pcs,bi:bi,open:open,ns:[bass,up[0].n,up[1].n],roles:[bi,up[0].r,up[1].r],gap:open?list[2].n:null};
    }
    function draw(){
      var c=cur(), ty=c.ty, rc=[ "signal",_w08_QC[ty.t],_w08_QC[ty.f]], cols=c.roles.map(function(r){return rc[r];}), ms=c.ns.map(function(n){return parse(n).midi;});
      var hl={}; ms.forEach(function(m,k){hl[m]={c:cols[k],label:nname(c.ns[k],false),strong:true};});
      var kb=kbd(48,88,{ww:11,wh:50,hl:hl,names:"c"});   /* 最高音は D6（例 G/B の開離配置）まで */
      var stf=staff({s:8,w:150,clef:"grand",items:[{x:96,notes:c.ns,fills:cols.map(V)}]});
      var sv=spec(c.ns.map(function(n,i){return {f:mfreq(ms[i]),label:nname(n),c:cols[i]};}),{H:8,w:640,lane:28});
      var sym=c.ch[0]+(c.bi?"/"+_w08_disp(c.pcs[c.bi]):""), RN=["根音","3 度の音","5 度の音"], FN=["基本形","第 1 転回形","第 2 転回形"];
      view.innerHTML=_w08_row([svgWrap(stf.w,stf.h,stf.svg),svgWrap(kb.w,kb.h,kb.svg)])+'<div style="margin-top:.5rem">'+svgWrap(sv.w,sv.h,sv.svg,"spec")+'</div>';
      ro.innerHTML='ベース: <b>'+nname(c.ns[0])+'</b>（'+RN[c.bi]+'）→ <b>'+FN[c.bi]+'</b> ／ コードネーム: <b style="color:'+V(ty.c)+'">'+esc(sym)+'</b>'+
        '<br>配置: <b>'+(c.open?'開離配置':'密集配置')+'</b>（ベースより上の '+nname(c.ns[1])+'・'+nname(c.ns[2])+' の間に'+(c.open?' '+nname(c.gap)+' が入る':'、構成音は入らない')+'）'+
        '<br>'+specStats(sv);
    }
    [sc,sb,sp,sh].forEach(function(s){s.addEventListener("change",draw);});
    b1.addEventListener("click",function(){_w08_play(b1,_w08_evs(cur().ns.map(function(n){return parse(n).midi;}),false));});
    b2.addEventListener("click",function(){_w08_play(b2,_w08_evs(cur().ns.map(function(n){return parse(n).midi;}),true));});
    draw();
  };
