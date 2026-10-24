  /* ============ 11 章 共通 ============ */
  var _w11_T=[["M7","メジャーセブンス","長","長",[0,4,7,11]],["7","セブンス","長","短",[0,4,7,10]],["m7","マイナーセブンス","短","短",[0,3,7,10]],
    ["mM7","マイナーメジャーセブンス","短","長",[0,3,7,11]],["m7(♭5)","マイナーセブンスフラットファイブ","減","短",[0,3,6,10]],["dim7","ディミニッシュセブンス","減","減",[0,3,6,9]]];
  var _w11_C={"長":"blue","短":"purple","減":"gold","増":"alias"};
  var _w11_ROLE=["根音","3 度の音","5 度の音","7 度の音"];
  var _w11_TN={13:"♭9",14:"9",15:"♯9",17:"11",18:"♯11",20:"♭13",21:"13"};
  function _w11_kind(iv){for(var i=0;i<_w11_T.length;i++){var t=_w11_T[i][4];if(t[0]===iv[0]&&t[1]===iv[1]&&t[2]===iv[2]&&t[3]===iv[3])return _w11_T[i];}return null;}
  /* 根音（例 "C4"）と [[度数, 半音数], ...] から、文字を度数どおりに選んで綴る */
  function _w11_spell(root,degs){var p=parse(root);return degs.map(function(d){var dia=p.dia+d[0]-1,li=((dia%7)+7)%7,oc=Math.floor(dia/7),a=p.midi+d[1]-(12*(oc+1)+PCL[li]);
    return LETTERS[li]+({0:"",1:"#","-1":"b",2:"x","-2":"bb"}[a])+oc;});}
  /* 五線。和音の臨時記号は重ならないよう列をずらして自分で描く（♭♭ も描く）。items: {x, notes, fills（低い音から）, label, lcol, ldy} */
  function _w11_staff(o){
    var s=o.s||10,clf=o.clef||"treble",top=o.top||3.4*s,ka=keyAcc(o.key||0),add=[];
    var its=(o.items||[]).map(function(it){var c={};for(var k in it)c[k]=it[k];c.acc=false;return c;});
    var st=staff({s:s,w:o.w,clef:clf,key:o.key||0,items:its,top:top,bottom:o.bottom});
    (o.items||[]).forEach(function(it){
      if(!it.notes||!it.notes.length)return;
      var hw=0.78*s,cx=2+it.x;
      var pl=it.notes.map(function(n){var p=parse(n),kind=clf==="grand"?(p.midi>=60?"treble":"bass"):clf,yt=(clf==="grand"&&kind==="bass")?top+8*s:top;
        return {p:p,yn:yt+4*s-(p.dia-(kind==="bass"?18:30))*s/2};});
      pl.sort(function(a,b){return b.yn-a.yn;});
      pl.forEach(function(q,i){q.col=(it.fills&&it.fills[i])||it.fill||V("ink");});
      var need=pl.filter(function(q){return q.p.acc!==ka[q.p.letter];}).sort(function(a,b){return a.yn-b.yn;});
      var cols=[],wd=[],AW={"1":1.0,"-1":0.82,"0":0.8,"-2":1.66,"2":0.9};
      need.forEach(function(q){var c=0;while(c<cols.length&&cols[c].some(function(y){return Math.abs(y-q.yn)<3*s;}))c++;
        if(c===cols.length){cols.push([]);wd.push(0);}cols[c].push(q.yn);wd[c]=Math.max(wd[c],AW[String(q.p.acc)]*s);q.c=c;});
      var rx=[],xr=cx-hw-0.32*s;for(var c=0;c<cols.length;c++){rx.push(xr);xr-=wd[c]+0.3*s;}
      need.forEach(function(q){var x=rx[q.c],a=q.p.acc;
        if(a===-2)add.push(accGlyph(-1,x,q.yn,s,q.col)+accGlyph(-1,x-0.84*s,q.yn,s,q.col));
        else if(a===2){var r=0.32*s;add.push(ln(x-2*r,q.yn-r,x,q.yn+r,q.col,0.3*s)+ln(x-2*r,q.yn+r,x,q.yn-r,q.col,0.3*s));}
        else add.push(accGlyph(a,x,q.yn,s,q.col));});
    });
    return {svg:st.svg+add.join(""),w:st.w,h:st.h,top:top};
  }
  function _w11_yn(n,top,s,clf){var p=parse(n),bass=clf==="bass"||(clf==="grand"&&p.midi<60);return (bass&&clf==="grand"?top+8*s:top)+4*s-(p.dia-(bass?18:30))*s/2;}
  function _w11_kbd(ms,labs,cols){var lo=Math.floor(Math.min.apply(null,ms)/12)*12,hi=Math.floor(Math.max.apply(null,ms)/12)*12+11,hl={},ww=hi-lo>35?12:hi-lo>23?15:19;
    ms.forEach(function(m,i){hl[m]={c:cols[i],label:labs[i],strong:true};});return kbd(lo,hi,{ww:ww,wh:ww*3.7,hl:hl,names:"c"});}
  /* 押すと鳴り、もう一度押すと止まるボタン */
  function _w11_btn(row,label,fn,timbre){var b=button(row,label);
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();b.setAttribute("aria-pressed","false");return;}
      var ev=fn();if(!ev||!ev.length)return;
      document.querySelectorAll(".widget .btn[aria-pressed=true]").forEach(function(x){x.setAttribute("aria-pressed","false");});
      playEvents(ev,{timbre:timbre||"piano",onEnd:function(){b.setAttribute("aria-pressed","false");}});
      b.setAttribute("aria-pressed","true");});
    return b;}
  function _w11_row(a,b){return '<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+a+b+'</div>';}

  /* ============ 11. w11_seventh — セブンスコードの 6 種類 ============ */
  REG.w11_seventh=function(el){
    head(el,"Seventh","根音と種類を選ぶと、構成音とスペクトルが表示される");
    var R=[["C","C4"],["D","D4"],["E♭","Eb4"],["E","E4"],["F","F4"],["F♯","F#4"],["G","G3"],["A","A3"],["B♭","Bb3"],["B","B3"]];
    var row=ctrls(el),sr=select(row,"根音",R.map(function(r){return r[0];})),sk=select(row,"種類",_w11_T.map(function(t){return t[0]+"（"+t[1]+"）";}));
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function cur(){var t=_w11_T[+sk.value],ns=_w11_spell(R[+sr.value][1],[[1,0],[3,t[4][1]],[5,t[4][2]],[7,t[4][3]]]);
      return {t:t,ns:ns,ms:ns.map(function(n){return parse(n).midi;}),cl:["signal",_w11_C[t[2]],_w11_C[t[2]],_w11_C[t[3]]]};}
    function draw(){
      var c=cur(),s=10,x1=staffStart(s,0)+3.6*s;
      var st=_w11_staff({s:s,w:x1+44,items:[{x:x1,notes:c.ns,fills:c.cl.map(function(k,i){return V(i?k:"ink");})}]});
      var k=_w11_kbd(c.ms,c.ns.map(function(n){return nname(n,false);}),c.cl);
      var sv=spec(c.ms.map(function(m,i){return {f:mfreq(m),label:nname(c.ns[i]),c:SPEC_COLS[i]};}),{H:8,w:620,lane:28});
      view.innerHTML=_w11_row(svgWrap(st.w,st.h,st.svg),svgWrap(k.w,k.h,k.svg))+svgWrap(sv.w,sv.h,sv.svg,"spec");
      var steps=[];for(var i=1;i<4;i++){var d=c.ms[i]-c.ms[i-1];steps.push((d===4?"長 3 度":"短 3 度")+"（"+d+"）");}
      ro.innerHTML='<b>'+esc(nname(c.ns[0],false)+c.t[0])+'</b>（'+c.t[1]+'）= <b style="color:'+V(_w11_C[c.t[2]])+'">'+c.t[2]+'三和音</b> + <b style="color:'+V(_w11_C[c.t[3]])+'">'+c.t[3]+' 7 度</b>（根音から半音 '+(c.ms[3]-c.ms[0])+'）<br>'+
        c.ns.map(function(n,i){return _w11_ROLE[i]+' <b>'+nname(n,false)+'</b>';}).join('・')+' ／ 下から '+steps.join(' + ')+'<br>'+specStats(sv);
    }
    _w11_btn(bar,"▶ 同時に",function(){return [{t:0,d:2.4,m:cur().ms}];});
    _w11_btn(bar,"▶ 1 音ずつ",function(){return cur().ms.map(function(m,i){return {t:i*0.45,d:i===3?1.4:0.44,m:[m]};});});
    [sr,sk].forEach(function(x){x.addEventListener("change",draw);});
    draw();
  };

  /* ============ 11. w11_diatonic — ダイアトニックセブンスコード ============ */
  REG.w11_diatonic=function(el){
    head(el,"Diatonic","調を選ぶと、ダイアトニックセブンスコードが並ぶ");
    var K=[["ハ長調","C4",MAJOR,"C"],["ト長調","G3",MAJOR,"G"],["ニ長調","D4",MAJOR,"D"],["変ロ長調","Bb3",MAJOR,"Bb"],["変ホ長調","Eb4",MAJOR,"Eb"],
      ["イ短調（和声的短音階）","A3",HARM_MINOR,"Am"],["ホ短調（和声的短音階）","E4",HARM_MINOR,"Em"],["ニ短調（和声的短音階）","D4",HARM_MINOR,"Dm"]];
    var row=ctrls(el),sk=select(row,"調",K.map(function(k){return k[0];}));
    var cb=mk("div","pbtns");el.appendChild(cb);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el),sel=0,list=[];
    function build(){
      var k=K[+sk.value],sc=spellScale(k[1],k[2],15);list=[];
      for(var i=0;i<7;i++){
        var ns=[sc[i],sc[i+2],sc[i+4],sc[i+6]],ms=ns.map(function(n){return parse(n).midi;}),t=_w11_kind(ms.map(function(m){return m-ms[0];})),tt=[];
        for(var a=0;a<4;a++)for(var b=a+1;b<4;b++)if((ms[b]-ms[a])%12===6)tt.push([a,b]);
        var rs=ns[0].replace(/-?\d+$/,"");
        list.push({ns:ns,ms:ms,t:t,tt:tt,nm:t?nname(ns[0],false)+t[0]:ns.map(function(n){return nname(n,false);}).join("・"),rn:t?roman(rs+t[0].replace("♭","b"),k[3]):"（扱わない）"});
      }
      cb.innerHTML="";
      list.forEach(function(c,i){_w11_btn(cb,c.t?c.nm:"増三和音 + 長 7 度",function(){sel=i;draw();return [{t:0,d:2.2,m:c.ms}];});});
      sel=Math.min(sel,6);draw();
    }
    function draw(){
      var k=K[+sk.value],s=9,x0=staffStart(s,k[3])+3.0*s,dx=76,items=[];
      list.forEach(function(c,i){
        var cl=c.t?[V("ink"),V(_w11_C[c.t[2]]),V(_w11_C[c.t[2]]),V(_w11_C[c.t[3]])]:[V("muted"),V("muted"),V("muted"),V("muted")];
        c.tt.forEach(function(p){cl[p[0]]=V("alias");cl[p[1]]=V("alias");});
        items.push({x:x0+i*dx,notes:c.ns,fills:cl,label:c.t?c.nm:"—",lcol:V(i===sel?"signal":"ink"),ldy:5.6*s});
      });
      var st=_w11_staff({s:s,w:x0+6*dx+34,key:k[3],items:items,bottom:8.4*s});
      var hb='<rect x="'+(2+x0+sel*dx-dx/2+4)+'" y="2" width="'+(dx-8)+'" height="'+(st.h-4)+'" rx="8" fill="'+V("signal-soft")+'"/>',ex=[];
      list.forEach(function(c,i){ex.push(tx(2+x0+i*dx,st.top+4*s+5.6*s+17,c.rn,"middle",11,V(i===sel?"signal":"muted"),i===sel));});
      var c=list[sel],kb=_w11_kbd(c.ms,c.ns.map(function(n){return nname(n,false);}),c.ms.map(function(m,i){return c.tt.some(function(p){return p[0]===i||p[1]===i;})?"alias":c.t?(i===0?"signal":_w11_C[i===3?c.t[3]:c.t[2]]):"muted";}));
      view.innerHTML=svgWrap(st.w,st.h,hb+st.svg+ex.join(""))+'<div style="margin-top:.5rem">'+svgWrap(kb.w,kb.h,kb.svg)+'</div>';
      var tts=c.tt.map(function(p){return nname(c.ns[p[0]],false)+'–'+nname(c.ns[p[1]],false)+'（'+_w11_ROLE[p[0]]+'と'+_w11_ROLE[p[1]]+'）';});
      ro.innerHTML='<b>'+esc(c.nm)+'</b>（'+esc(c.rn)+'）: '+c.ns.map(function(n){return nname(n,false);}).join('・')+
        (c.t?' ／ <b style="color:'+V(_w11_C[c.t[2]])+'">'+c.t[2]+'三和音</b> + <b style="color:'+V(_w11_C[c.t[3]])+'">'+c.t[3]+' 7 度</b>':' ／ 増三和音 + 長 7 度')+
        '<br>三全音: '+(tts.length?'<b style="color:var(--alias)">'+tts.join('、')+'</b>':'なし');
    }
    var ball=button(bar,"▶ 7 つを順に");
    ball.addEventListener("click",function(){
      if(ball.getAttribute("aria-pressed")==="true"){stopAll();ball.setAttribute("aria-pressed","false");return;}
      document.querySelectorAll(".widget .btn[aria-pressed=true]").forEach(function(x){x.setAttribute("aria-pressed","false");});
      playEvents(list.map(function(c,i){return {t:i*1.15,d:1.1,m:c.ms};}),{timbre:"piano",onStep:function(i){sel=i;draw();},onEnd:function(){ball.setAttribute("aria-pressed","false");}});
      ball.setAttribute("aria-pressed","true");
    });
    sk.addEventListener("change",build);
    build();
  };

  /* ============ 11. w11_tension — テンションと相手の構成音（アボイドノート） ============ */
  REG.w11_tension=function(el){
    head(el,"Avoid","和音とテンションを選ぶと、相手の構成音との関係とスペクトルが表示される");
    var sc=spellScale("C4",MAJOR,22),CH=[];
    for(var i=0;i<7;i++){
      var ns=[sc[i],sc[i+2],sc[i+4],sc[i+6]],ms=ns.map(function(n){return parse(n).midi;}),t=_w11_kind(ms.map(function(m){return m-ms[0];}));
      var tens=[{n:sc[i+8],pi:0},{n:sc[i+10],pi:1},{n:sc[i+12],pi:2}];
      if(t[0]==="7"){var p9=parse(sc[i+8]);tens.push({n:p9.letter+"b"+p9.oct,pi:0,out:true});}
      tens.forEach(function(x){x.tn=_w11_TN[parse(x.n).midi-ms[0]];x.lab=nname(x.n,false)+"（"+x.tn+(x.out?"、音階の外":"")+"）";});
      CH.push({ns:ns,ms:ms,t:t,nm:nname(ns[0],false)+t[0],tens:tens});
    }
    var row=ctrls(el),sch=select(row,"和音（ハ長調）",CH.map(function(c){return c.nm;})),stn=select(row,"テンション",["-"]);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function fillT(){stn.innerHTML=CH[+sch.value].tens.map(function(x,j){return '<option value="'+j+'">'+esc(x.lab)+'</option>';}).join("");stn.value="0";}
    function cur(){var c=CH[+sch.value],x=c.tens[+stn.value]||c.tens[0],tm=parse(x.n).midi,pm=c.ms[x.pi];return {c:c,x:x,tm:tm,pm:pm,sm:tm-pm,bad:tm-pm===13};}
    function draw(){
      var q=cur(),c=q.c,x=q.x,s=10,x1=staffStart(s,0)+3.6*s,tc=q.bad?"alias":"green";
      var fills=c.ns.map(function(n,i){return V(i===x.pi?"signal":"ink");}).concat([V(tc)]);
      var st=_w11_staff({s:s,w:x1+150,items:[{x:x1,notes:c.ns.concat([x.n]),fills:fills}]});
      var ya=_w11_yn(c.ns[x.pi],st.top,s,"treble"),yb=_w11_yn(x.n,st.top,s,"treble"),bx=2+x1+15;
      var br='<polyline points="'+bx+','+yb+' '+(bx+8)+','+yb+' '+(bx+8)+','+ya+' '+bx+','+ya+'" fill="none" stroke="'+V(tc)+'" stroke-width="1.4"/>'+
        tx(bx+14,(ya+yb)/2,(q.bad?"短 9 度":"長 9 度"),"start",12,V(tc),true)+tx(bx+14,(ya+yb)/2+15,"半音 "+q.sm,"start",10.5,V(tc));
      var k=_w11_kbd(c.ms.concat([q.tm]),c.ns.concat([x.n]).map(function(n){return nname(n,false);}),c.ms.map(function(m,i){return i===x.pi?"signal":"blue";}).concat([tc]));
      var sv=spec([{f:mfreq(q.pm),label:nname(c.ns[x.pi]),c:"signal"},{f:mfreq(q.tm),label:nname(x.n),c:tc}],{H:8,w:620,lane:36});
      view.innerHTML=_w11_row(svgWrap(st.w,st.h,st.svg+br),svgWrap(k.w,k.h,k.svg))+svgWrap(sv.w,sv.h,sv.svg,"spec");
      var verdict=x.out?'<b style="color:var(--alias)">音階の外の ♭9</b>（V7 では例外として使われる）':q.bad?'<b style="color:var(--alias)">アボイドノート</b>':'<b style="color:var(--green)">使えるテンション</b>';
      var note=(c.nm==="Dm7"&&x.tn==="13")?'<br>B は 3 度の音 F と三全音を作るので、書物によってはこれも避ける音に数える':'';
      ro.innerHTML='<b>'+esc(x.lab)+'</b> の相手は '+_w11_ROLE[x.pi]+' <b>'+nname(c.ns[x.pi],false)+'</b>。'+nname(c.ns[x.pi])+' から '+nname(x.n)+' まで半音 <b>'+q.sm+'</b> = '+
        (q.bad?'短 9 度':'長 9 度')+' → '+verdict+note+'<br>相手との 2 音: '+specStats(sv)+'（使えるテンションの組は 12〜25、短 9 度の組は 28〜36）';
    }
    _w11_btn(bar,"▶ 和音とテンション",function(){var q=cur();return [{t:0,d:2.6,m:q.c.ms.concat([q.tm])}];},"organ");
    _w11_btn(bar,"▶ 相手との 2 音",function(){var q=cur();return [{t:0,d:2.2,m:[q.pm,q.tm]}];},"organ");
    sch.addEventListener("change",function(){fillT();draw();});stn.addEventListener("change",draw);
    fillT();stn.value="1";draw();
  };

  /* ============ 11. w11_voicing — ボイシングと粗さ ============ */
  REG.w11_voicing=function(el){
    head(el,"Voicing","和音と並べ方を選ぶと、配置と粗さが表示される");
    var CH=[["CM7(9)","C",[4,7,11],14],["Dm7(9)","D",[3,7,10],14],["G7(13)","G",[4,7,10],21],["Am7(11)","A",[3,7,10],17],["FM7(♯11)","F",[4,7,11],18]];
    var AR=["全部を根音のすぐ上に詰める","根音だけ低く、残りを詰める","5 度を省く: 根音・3・7・テンション","5 度を省く: 根音・7・3・テンション"];
    var row=ctrls(el),sc=select(row,"和音",CH.map(function(c){return c[0];})),sa=select(row,"並べ方",AR),sb=select(row,"根音の高さ",["オクターブ 2","オクターブ 3"]);
    sa.value="2";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function nx(prev,p){var m=prev+1;while(m%12!==p)m++;return m;}
    function cur(){
      var c=CH[+sc.value],a=+sa.value,rpc=parse(c[1]+"4").midi%12,R=12*((+sb.value?3:2)+1)+rpc,pc=function(v){return (rpc+v)%12;};
      var t3=pc(c[2][0]),t5=pc(c[2][1]),t7=pc(c[2][2]),tt=pc(c[3]),v;
      if(a===0){var a3=nx(R,t3),a5=nx(a3,t5),a7=nx(a5,t7);v=[[R,0],[a3,1],[a5,2],[a7,3],[nx(a7,tt),4]];}
      else if(a===1){var b3=nx(R+12,t3),b5=nx(b3,t5),b7=nx(b5,t7);v=[[R,0],[b3,1],[b5,2],[b7,3],[nx(b7,tt),4]];}
      else if(a===2){var c3=nx(R+12,t3),c7=nx(c3,t7);v=[[R,0],[c3,1],[c7,3],[nx(c7,tt),4]];}
      else{var d7=nx(R,t7),d3=nx(d7,t3);v=[[R,0],[d7,3],[d3,1],[nx(d3,tt),4]];}
      return {c:c,v:v,ms:v.map(function(q){return q[0];}),ns:v.map(function(q){return NS[q[0]%12]+(Math.floor(q[0]/12)-1);})};
    }
    var RC=["ink","signal","muted","signal","green"],RN=["根音","3 度の音","5 度の音","7 度の音","テンション"];
    function draw(){
      var q=cur(),s=8,x1=staffStart(s,0)+2.4*s;
      var st=_w11_staff({s:s,w:x1+40,clef:"grand",items:[{x:x1,notes:q.ns,fills:q.v.map(function(p){return V(RC[p[1]]);})}],bottom:5*s});
      var k=_w11_kbd(q.ms,q.ns.map(function(n){return "";}),q.v.map(function(p){return p[1]?RC[p[1]]:"blue";}));
      view.innerHTML=_w11_row(svgWrap(st.w,st.h,st.svg),svgWrap(k.w,k.h,k.svg));
      var gaps=[];for(var i=1;i<q.ms.length;i++)gaps.push(q.ns[i-1]+'–'+q.ns[i]+' <b>'+(q.ms[i]-q.ms[i-1])+'</b>');
      var a=specAnalyze(q.ms.map(mfreq),8);a.rel=100*a.R/roughRef(8);
      ro.innerHTML='<b>'+esc(q.c[0])+'</b>: '+q.v.map(function(p,i){return '<span style="color:'+V(RC[p[1]]==="ink"?"ink":RC[p[1]])+'">'+RN[p[1]]+' '+q.ns[i]+'</span>';}).join('・')+
        '<br>隣どうしの半音の数（下から）: '+gaps.join(' ／ ')+'<br>'+specStats(a)+
        '<div style="margin-top:.45rem;height:10px;border-radius:5px;background:var(--line);overflow:hidden"><div style="height:100%;width:'+Math.min(100,a.rel/10)+'%;background:var(--alias)"></div></div>';
    }
    _w11_btn(bar,"▶ 鳴らす",function(){return [{t:0,d:2.8,m:cur().ms}];},"organ");
    [sc,sa,sb].forEach(function(x){x.addEventListener("change",draw);});
    draw();
  };
