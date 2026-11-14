  /* ============ 05. 長音階（この章の小道具） ============ */
  var _w05_MAJ=[2,2,1,2,2,2,1];
  /* 隣どうしの間隔（半音の数）→ [表示, 色名]。全 = 青（長 2 度）、半 = 紫（短 2 度） */
  function _w05_lab(k){return k===2?["全","blue"]:k===1?["半","purple"]:["半音 "+k,"muted"];}
  function _w05_arc(x1,x2,y,h,col){var xm=(x1+x2)/2;return '<path d="M'+x1.toFixed(1)+','+y+' Q'+xm.toFixed(1)+','+(y-2*h)+' '+x2.toFixed(1)+','+y+'" fill="none" stroke="'+col+'" stroke-width="1.6" stroke-linecap="round"/>';}
  /* 鍵盤の上で、隣どうしの音を弧で結び「全」「半」を書く。ms は MIDI の列、top は鍵盤の上端 */
  function _w05_kbdArcs(lo,hi,ms,hl,ww,wh,top){
    top=top||34; var k=kbd(lo,hi,{ww:ww,wh:wh,hl:hl,names:"none",x:1,y:top}), b=[k.svg];
    for(var i=0;i+1<ms.length;i++){var L=_w05_lab(ms[i+1]-ms[i]), x1=k.pos[ms[i]][0], x2=k.pos[ms[i+1]][0];
      b.push(_w05_arc(x1+2,x2-2,top-4,8,V(L[1]))); b.push(tx((x1+x2)/2,top-15,L[0],"middle",11,V(L[1]),true));}
    return {svg:b.join(""),w:k.w,h:k.h+top,pos:k.pos};
  }
  /* ボタンで鳴らす。鳴っている間にもう一度押すと止まる */
  function _w05_go(btn,evs,onStep,onEnd){
    if(btn.getAttribute("aria-pressed")==="true"){stopAll();return;}
    var done=function(){btn.setAttribute("aria-pressed","false");if(onEnd)onEnd();};
    playEvents(evs,{timbre:"piano",onStep:onStep,onEnd:done});
    btn.setAttribute("aria-pressed","true"); hold(done);
  }
  function _w05_evs(ms,gap){return ms.map(function(m,i){return {t:i*gap,d:i===ms.length-1?1.3:gap*0.95,m:[m]};});}
  /* 2 つの音名の音程 → {d: 度数, q: 種類} */
  function _w05_iv(a,b){var p=parse(a),q=parse(b),d=q.dia-p.dia+1,s=q.midi-p.midi,ref={1:0,2:2,3:4,4:5,5:7,6:9,7:11,8:12}[d],df=s-ref;
    var nm=(d===1||d===4||d===5||d===8)?{0:"完全",1:"増","-1":"減"}[df]:{0:"長","-1":"短",1:"増","-2":"減"}[df];return {d:d,q:nm||"?"};}
  /* 同じ文字の音が続くとき、後の ♮ の音に本位記号を付ける（staff は小節の中の臨時記号を覚えないため） */
  function _w05_nat(ns,x0,dx,s,fills){var b=[],top=3.4*s;
    for(var i=1;i<ns.length;i++){var p=parse(ns[i]),q=parse(ns[i-1]);
      if(p.letter===q.letter&&p.oct===q.oct&&p.acc===0&&q.acc!==0)b.push(accGlyph(0,2+x0+i*dx-0.78*s-0.35*s,top+4*s-(p.dia-30)*s/2,s,fills[i]));}
    return b.join("");}

  /* ============ 05. w05_steps — 7 つの間隔の「全」「半」を切り替える ============ */
  REG.w05_steps=function(el){
    head(el,"Steps","7 つの間隔の「全」「半」を切り替えて、C から並べる");
    var st=_w05_MAJ.slice(), on=-1, WK="CDEFGAB";
    var row=mk("div","pbtns"); el.appendChild(row);
    var tb=[];
    for(var i=0;i<7;i++)(function(i){var b=button(row,""); b.addEventListener("click",function(){st[i]=st[i]===2?1:2; stopAll(); on=-1; draw();}); tb.push(b);})(i);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ この並び"), bm=button(bar,"▶ 長音階"), br=button(bar,"長音階に戻す");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el);
    function midis(s){var c=[60];s.forEach(function(k){c.push(c[c.length-1]+k);});return c;}
    function rot(s){for(var r=0;r<7;r++){var ok=true;for(var i=0;i<7;i++)if(s[i]!==_w05_MAJ[(i+r)%7]){ok=false;break;}if(ok)return r;}return -1;}
    function boxes(y,s,title,ref){var b=[tx(66,y+15.5,title,"end",10.5,V("muted"),true)];
      s.forEach(function(k,i){var L=_w05_lab(k),bad=ref&&k!==ref[i],x=74+i*36,c=bad?"alias":L[1];
        b.push('<rect x="'+x+'" y="'+y+'" width="32" height="22" rx="5" fill="'+V(c+"-soft")+'" stroke="'+V(c)+'" stroke-width="'+(bad?2:1.2)+'"/>');
        b.push(tx(x+16,y+15.5,L[0],"middle",11.5,V(c),true));});
      return b.join("");}
    function draw(){
      tb.forEach(function(b,i){var L=_w05_lab(st[i]); b.textContent=(i+1)+"→"+(i+2)+" "+L[0]; b.style.color=V(L[1]); b.style.borderColor=V(L[1]);});
      var m=midis(st), hl={};
      m.forEach(function(x,i){hl[x]={c:(i===7&&x!==72)?"alias":"signal",label:String(i+1),strong:i===on};});
      var k=_w05_kbdArcs(60,74,m,hl,30,96);
      var cmp=svgWrap(330,64,boxes(4,st,"この並び",_w05_MAJ)+boxes(36,_w05_MAJ,"長音階",null));
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(k.w,k.h,k.svg)+cmp+'</div>';
      var nw=st.filter(function(x){return x===2;}).length, sum=m[7]-60, r=rot(st), v;
      if(sum===12)v=r===0?'<span class="ok">長音階の並び</span>（全・全・半・全・全・全・半）':r>0?'白鍵だけを <b>'+WK[r]+'</b> から並べたときと同じ並び（長音階ではない）':'白鍵の並びには無い並び（長音階ではない）';
      else v='<span class="warn">1 オクターブにならない</span>: 8 番目の音が 1 オクターブ上の C より半音 '+Math.abs(sum-12)+' 個'+(sum>12?'高い':'低い')+'。全 5 つ・半 2 つのときだけ 12 になる';
      ro.innerHTML='全 <b>'+nw+'</b> 個・半 <b>'+(7-nw)+'</b> 個 → 半音の合計 2 × '+nw+' + '+(7-nw)+' = <b>'+sum+'</b><br>'+v;
    }
    bp.addEventListener("click",function(){_w05_go(bp,_w05_evs(midis(st),0.36),function(i){on=i;draw();},function(){on=-1;draw();});});
    bm.addEventListener("click",function(){_w05_go(bm,_w05_evs(midis(_w05_MAJ),0.36));});
    br.addEventListener("click",function(){stopAll();st=_w05_MAJ.slice();on=-1;draw();});
    draw();
  };

  /* ============ 05. w05_major — 主音を選んで長音階を作る（綴り方の比較つき） ============ */
  REG.w05_major=function(el){
    head(el,"Major scale","主音を選ぶと、その長音階を鍵盤と五線に表示して鳴らす");
    var TON=[["C4","C"],["Db4","D♭"],["D4","D"],["Eb4","E♭"],["E4","E"],["F4","F"],["F#4","F♯"],["Gb4","G♭"],["G4","G"],["Ab4","A♭"],["A4","A"],["Bb4","B♭"],["B4","B"]];
    var row=ctrls(el), sT=select(row,"主音",TON.map(function(x){return x[1];})),
        sS=select(row,"綴り方",["7 つの文字を 1 回ずつ（きまりどおり）","黒鍵をすべて ♯ で書く","黒鍵をすべて ♭ で書く"]);
    sT.value="8";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bu=button(bar,"▶ 上がる"), bd=button(bar,"▶ 下がる");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), on=-1, LI=[0,0,1,1,2,3,3,4,4,5,5,6];
    function names(){
      var sc=spellScale(TON[+sT.value][0],MAJOR,8), mode=+sS.value;
      if(mode===0)return sc;
      return sc.map(function(n){var m=parse(n).midi,pc=((m%12)+12)%12,o=Math.floor(m/12)-1;
        return (BLACK[pc]?(mode===1?NS[pc]:NF[pc]):LETTERS[LI[pc]])+o;});
    }
    function draw(){
      var ns=names(), m=ns.map(function(n){return parse(n).midi;}), hl={};
      m.forEach(function(x,i){hl[x]={c:"signal",label:nname(ns[i],false),strong:i===on};});
      var k=_w05_kbdArcs(60,83,m,hl,20,80);
      var letters=ns.map(function(n){return parse(n).letter;}), cnt={};
      letters.slice(0,7).forEach(function(L){cnt[L]=(cnt[L]||0)+1;});
      var dup=LETTERS.split("").filter(function(L){return (cnt[L]||0)>1;}), miss=LETTERS.split("").filter(function(L){return !cnt[L];});
      var s=10, x0=62, dx=46, items=[], fills=[];
      ns.forEach(function(n,i){var bad=dup.indexOf(letters[i])>=0&&i<7, col=i===on?V("signal"):bad?V("alias"):V("ink");
        fills.push(col); items.push({x:x0+i*dx,notes:[n],fill:col,label:nname(n,false),lcol:col,lsz:11});});
      var stf=staff({s:s,w:x0+7*dx+30,clef:"treble",items:items,bottom:7*s}), extra=[_w05_nat(ns,x0,dx,s,fills)];
      for(var i=0;i<7;i++){var r=_w05_iv(ns[i],ns[i+1]), good=r.d===2;
        extra.push(tx(2+x0+(i+0.5)*dx,3.4*s+4*s+5.4*s,r.q+" "+r.d+" 度","middle",10,good?V("muted"):V("alias"),!good));}
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(k.w,k.h,k.svg)+svgWrap(stf.w,stf.h,stf.svg+extra.join(""))+'</div>';
      var acc=ns.slice(0,7).filter(function(n){return parse(n).acc!==0;}).map(function(n){return nname(n,false);});
      ro.innerHTML='音名 <b>'+ns.map(function(n){return nname(n,false);}).join(" ")+'</b> ／ ♯・♭ の付いた音: '+(acc.length?'<b>'+acc.join("・")+'</b>':'なし')+
        '<br>使った文字 '+letters.slice(0,7).join(" ")+' → '+(dup.length?'<span class="warn">'+dup.join("・")+' が 2 回、'+miss.join("・")+' が無い</span>（隣どうしが 2 度でない所ができる）':'<span class="ok">7 つの文字を 1 回ずつ</span>（隣どうしはすべて 2 度）');
    }
    function evs(down){var m=names().map(function(n){return parse(n).midi;});return _w05_evs(down?m.reverse():m,0.38);}
    bu.addEventListener("click",function(){_w05_go(bu,evs(false),function(i){on=i;draw();},function(){on=-1;draw();});});
    bd.addEventListener("click",function(){_w05_go(bd,evs(true),function(i){on=7-i;draw();},function(){on=-1;draw();});});
    [sT,sS].forEach(function(x){x.addEventListener("change",function(){stopAll();on=-1;draw();});});
    draw();
  };

  /* ============ 05. w05_fifths — 完全 5 度の連なりを 1 オクターブに並べ直す ============ */
  REG.w05_fifths=function(el){
    head(el,"Fifths","完全 5 度の連なりの始まりを選び、1 オクターブの中に並べ直す");
    var ST=[["Gb","G♭"],["Db","D♭"],["Ab","A♭"],["Eb","E♭"],["Bb","B♭"],["F","F"],["C","C"],["G","G"],["D","D"],["A","A"],["E","E"],["B","B"]];
    var row=ctrls(el), sS=select(row,"連なりの始まりの音",ST.map(function(x){return x[1];})); sS.value="5";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bc=button(bar,"▶ 5 度ずつ積む"), bf=button(bar,"▶ 並べ直した長音階");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), onC=-1, onF=-1;
    /* 完全 5 度上の音名（文字は 4 つ進み、高さは半音 7 つ上がる） */
    function up5(n){var p=parse(n+"4"),li=(p.li+4)%7,pc=(p.midi+7)%12,a=((pc-PCL[li]+18)%12)-6;return LETTERS[li]+{0:"",1:"#","-1":"b",2:"x","-2":"bb"}[a];}
    function chain(){var c=[ST[+sS.value][0]];for(var i=1;i<7;i++)c.push(up5(c[i-1]));return c;}
    function draw(){
      var c=chain(), sc=spellScale(c[1]+"4",MAJOR,8), role={0:"下属音",1:"主音",2:"属音"}, b=[];
      /* 連なり */
      c.forEach(function(n,i){var x=8+i*76, ch=parse(n+"4").acc!==0, act=i===onC;
        b.push('<rect x="'+x+'" y="26" width="56" height="34" rx="6" fill="'+V(act?"signal":ch?"signal-soft":"panel")+'" stroke="'+V(i===1||ch||act?"signal":"line")+'" stroke-width="'+(i===1?2.4:1.3)+'"/>');
        b.push(tx(x+28,48,nname(n+"4",false),"middle",14,act?V("panel"):V("ink"),true));
        b.push(tx(x+28,18,(i+1)+(role[i]?"・"+role[i]:""),"middle",10.5,i===1?V("signal"):V("muted"),i===1));
        if(i)b.push(ln(x-18,43,x-4,43,V("muted"),1.3)+'<path d="M'+(x-3)+',43 l-6,-3.5 v7z" fill="'+V("muted")+'"/>');});
      var strip=svgWrap(8+7*76-12,66,b.join(""));
      /* 並べ直した長音階: 鍵盤（丸の数は連なりの番号） */
      var m=sc.map(function(n){return parse(n).midi;}), hl={};
      m.forEach(function(x,i){hl[x]={c:"signal",label:nname(sc[i],false),strong:i===onF};});
      var k=_w05_kbdArcs(60,83,m,hl,22,84);
      var s=10, x0=62, dx=40, items=sc.map(function(n,i){var col=i===onF?V("signal"):parse(n).acc?V("signal"):V("ink");return {x:x0+i*dx,notes:[n],fill:col};});
      var stf=staff({s:s,w:x0+7*dx+26,clef:"treble",items:items});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+strip+svgWrap(k.w,k.h,k.svg)+svgWrap(stf.w,stf.h,stf.svg)+'</div>';
      var chg=c.filter(function(n){return parse(n+"4").acc!==0;});
      ro.innerHTML='連なり <b>'+c.map(function(n){return nname(n+"4",false);}).join(" ")+'</b>（完全 5 度ずつ）→ 2 番目の '+nname(c[1]+"4",false)+' を主音にして並べ直すと <b>'+sc.map(function(n){return nname(n,false);}).join(" ")+'</b>（'+nname(c[1]+"4",false)+' 長音階）'+
        '<br>C 長音階（連なり F C G D A E B）と比べて変わった音: '+(chg.length?'<b>'+chg.map(function(n){return n[0]+' → '+nname(n+"4",false);}).join("、")+'</b>（'+chg.length+' つ）':'なし');
    }
    bc.addEventListener("click",function(){var m0=parse(chain()[0]+"2").midi,ev=[];for(var i=0;i<7;i++)ev.push({t:i*0.5,d:i===6?1.4:0.48,m:[m0+7*i]});
      _w05_go(bc,ev,function(i){onC=i;draw();},function(){onC=-1;draw();});});
    bf.addEventListener("click",function(){var c=chain(),m=spellScale(c[1]+"4",MAJOR,8).map(function(n){return parse(n).midi;});
      _w05_go(bf,_w05_evs(m,0.38),function(i){onF=i;draw();},function(){onF=-1;draw();});});
    sS.addEventListener("change",function(){stopAll();onC=onF=-1;draw();});
    draw();
  };
