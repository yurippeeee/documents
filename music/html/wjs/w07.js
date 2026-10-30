  /* ============ 07. 調と五度圏（共通） ============ */
  var _w07_JP={C:"ハ",D:"ニ",E:"ホ",F:"ヘ",G:"ト",A:"イ",B:"ロ"};
  var _w07_MAJ={"-7":"Cb","-6":"Gb","-5":"Db","-4":"Ab","-3":"Eb","-2":"Bb","-1":"F","0":"C","1":"G","2":"D","3":"A","4":"E","5":"B","6":"F#","7":"C#"};
  var _w07_MIN={"-7":"Ab","-6":"Eb","-5":"Bb","-4":"F","-3":"C","-2":"G","-1":"D","0":"A","1":"E","2":"B","3":"F#","4":"C#","5":"G#","6":"D#","7":"A#"};
  function _w07_pt(t){return t[0]+t.slice(1).replace("#","♯").replace("b","♭");}
  /* 調号の数 n（♯ を正、♭ を負）と長調・短調から、調の名前などを作る */
  function _w07_key(n,minor){var t=(minor?_w07_MIN:_w07_MAJ)[n],a=t.slice(1);
    return {n:n,minor:!!minor,t:t,jp:(a==="#"?"嬰":a==="b"?"変":"")+_w07_JP[t[0]]+(minor?"短調":"長調"),en:_w07_pt(t)+(minor?" マイナー":" メジャー")};}
  function _w07_sig(n){return n===0?"なし":(n>0?"♯ ":"♭ ")+Math.abs(n)+" つ";}
  function _w07_sigList(n){var o=n>0?"FCGDAEB":"BEADGCF",r=[];for(var i=0;i<Math.abs(n);i++)r.push(o[i]+(n>0?"♯":"♭"));return r.join(" ");}
  function _w07_nstr(n){return "n = "+(n>0?"+":n<0?"−":"")+Math.abs(n);}
  function _w07_scale(k,oct){return spellScale(k.t+oct,k.minor?NAT_MINOR:MAJOR,8);}
  function _w07_wrap(n){return n>7?n-12:n<-7?n+12:n;}
  /* ボタンで鳴らす（もう一度押すと止まる） */
  function _w07_play(btn,evs,o){
    o=o||{};
    if(btn.getAttribute("aria-pressed")==="true"){stopAll();return;}
    playEvents(evs,{timbre:"piano",onStep:o.onStep,onEnd:function(){btn.setAttribute("aria-pressed","false");if(o.onEnd)o.onEnd();}});
    btn.setAttribute("aria-pressed","true");
    hold(function(){btn.setAttribute("aria-pressed","false");if(o.onEnd)o.onEnd();});
  }
  function _w07_scaleEv(ms,t0){return ms.map(function(m,i){return {t:(t0||0)+i*0.32,d:i===ms.length-1?0.9:0.3,m:[m]};});}

  /* ============ 07. w07_fifths — 5 度上・5 度下の調へ移る ============ */
  REG.w07_fifths=function(el){
    head(el,"Fifths","5 度上・5 度下の調へ 1 つずつ移り、変わる音を見る");
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bDn=button(bar,"◀ 5 度下の調へ"),bUp=button(bar,"5 度上の調へ ▶"),bPl=button(bar,"▶ 音階を鳴らす");
    var row=ctrls(el),sc=select(row,"五線",["ト音記号","ヘ音記号"]);
    var strip=mk("div","");strip.style.cssText="display:flex;flex-wrap:wrap;gap:4px;margin-top:.75rem";el.appendChild(strip);
    var view=mk("div","wscreen");view.style.padding=".6rem";view.style.marginTop=".6rem";el.appendChild(view);
    var ro=readout(el),n=0,prev=null,act=-1;
    function clef(){return sc.value==="1"?"bass":"treble";}
    function oct(K){return clef()==="treble"?4:("CDEF".indexOf(K.t[0])>=0?3:2);}
    function cells(){
      var h=[];
      for(var k=-7;k<=7;k++){var K=_w07_key(k,false),on=k===n;
        h.push('<button type="button" data-n="'+k+'" style="flex:1 0 3.9rem;display:flex;flex-direction:column;align-items:center;padding:.25rem .1rem;border:1px solid '+(on?'var(--signal)':'var(--line)')+
          ';border-radius:8px;background:'+(on?'var(--signal-soft)':'var(--screen)')+';color:var(--ink);cursor:pointer;font-family:var(--sans);font-size:.78rem;line-height:1.3">'+
          '<b style="font-weight:'+(on?800:600)+'">'+K.jp+'</b><span style="font-family:var(--mono);font-size:.66rem;color:var(--muted)">'+_w07_nstr(k)+'</span></button>');}
      strip.innerHTML=h.join("");
    }
    function changes(){
      if(prev==null||prev===n)return [];
      var K=_w07_key(n,false),P=_w07_key(prev,false),a=_w07_scale(P,4).slice(0,7),b=_w07_scale(K,4).slice(0,7),pa={},out=[];
      a.forEach(function(x,i){var p=parse(x);pa[p.letter]={nm:nname(x,false),i:i};});
      b.forEach(function(x,i){var p=parse(x),q=pa[p.letter];if(q.nm!==nname(x,false))out.push({L:p.letter,from:q.nm,fi:q.i,to:nname(x,false),ti:i});});
      return out;
    }
    function draw(){
      cells();
      var K=_w07_key(n,false),cl=clef(),notes=_w07_scale(K,oct(K)),ch=changes(),chL={};
      ch.forEach(function(c){chL[c.L]=1;});
      var s=9,st=staffStart(s,n)+8,top=3.4*s,x0=2;
      var items=notes.map(function(x,i){var p=parse(x);return {x:st+i*27,notes:[x],fill:(act===i||chL[p.letter])?V("signal"):V("ink")};});
      var S=staff({s:s,w:st+8*27+4,clef:cl,key:n,items:items}),extra="";
      /* 新しく増えた調号の記号を赤で重ねる */
      if(prev!=null&&n!==0){var same=prev===0||(prev>0)===(n>0),from=same?Math.min(Math.abs(prev),Math.abs(n)):0,sg=n>0?1:-1;
        for(var i=from;i<Math.abs(n);i++)extra+=accGlyph(sg,x0+4.0*s+i*1.05*s+0.9*s,top+4*s-KS_POS[cl+sg][i]*s/2,s,V("signal"));}
      var ms=notes.map(function(x){return parse(x).midi;}),klo=ms[0]-((ms[0]%12)+12)%12,khi=ms[7]+(11-((ms[7]%12)+12)%12),hl={};
      notes.forEach(function(x,i){var p=parse(x),on=act===i||!!chL[p.letter];
        hl[p.midi]={c:on?"signal":"blue",label:nname(x,false),strong:on||i===0||i===7};});
      var kb=kbd(klo,khi,{ww:17,wh:70,hl:hl,names:null});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(S.w,S.h,S.svg+extra)+svgWrap(kb.w,kb.h,kb.svg)+'</div>';
      var h='<b>'+K.jp+'</b>（'+K.en+'） ／ 調号 <b>'+_w07_sig(n)+'</b>'+(n?'（'+_w07_sigList(n)+'）':'')+' ／ 調号の数 <b>'+_w07_nstr(n)+'</b>';
      if(ch.length){var P=_w07_key(prev,false),d=n-prev;
        h+='<br>'+P.jp+' → '+K.jp+'（5 度'+(d>0?'上':'下')+(Math.abs(d)>1?'へ '+Math.abs(d)+' 回':'')+'）: ';
        if(Math.abs(d)===1){var c=ch[0];
          h+=d>0?P.jp+'の第 '+(c.fi+1)+' 音 '+c.from+' が半音上がって <b style="color:var(--signal)">'+c.to+'</b> になった。'+c.to+' は'+K.jp+'の第 '+(c.ti+1)+' 音（導音）'
                :P.jp+'の第 '+(c.fi+1)+' 音 '+c.from+' が半音下がって <b style="color:var(--signal)">'+c.to+'</b> になった。'+c.to+' は'+K.jp+'の第 '+(c.ti+1)+' 音（下属音）';}
        else h+='変わった音は '+ch.map(function(c){return c.from+' → <b style="color:var(--signal)">'+c.to+'</b>';}).join('、')+'（'+ch.length+' つ）';}
      if(n===7)h+='<br>これより 5 度上の調は ♯ が 8 つ以上要るので、同じ高さの別の名前で書く（4 節）';
      if(n===-7)h+='<br>これより 5 度下の調は ♭ が 8 つ以上要るので、同じ高さの別の名前で書く（4 節）';
      ro.innerHTML=h;
      bUp.disabled=n>=7;bDn.disabled=n<=-7;
    }
    function play(){var K=_w07_key(n,false),ms=_w07_scale(K,oct(K)).map(function(x){return parse(x).midi;});
      _w07_play(bPl,_w07_scaleEv(ms),{onStep:function(i){act=i;draw();},onEnd:function(){act=-1;draw();}});}
    function go(k){if(k<-7||k>7||k===n)return;stopAll();prev=n;n=k;act=-1;draw();play();}
    bUp.addEventListener("click",function(){go(n+1);});
    bDn.addEventListener("click",function(){go(n-1);});
    bPl.addEventListener("click",play);
    sc.addEventListener("change",function(){stopAll();act=-1;draw();});
    strip.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-n]");if(t)go(+t.getAttribute("data-n"));});
    draw();
  };

  /* ============ 07. w07_circle — 五度圏から調を選ぶ ============ */
  REG.w07_circle=function(el){
    head(el,"Circle","五度圏の調を押すと、調号と音階が表示されて鳴る");
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bPl=button(bar,"▶ 音階を鳴らす");
    var info=mk("div","wscreen");info.style.padding=".6rem";info.style.marginTop=".6rem";el.appendChild(info);
    var ro=readout(el),cur={n:0,minor:false},act=-1;
    var W=420,cx=210,cy=210,R4=206,R3=156,R2=124,R1=62;
    function ang(k){return (-90+30*k)*Math.PI/180;}
    function namesAt(k){var r=[];for(var n=7;n>=-7;n--)if(((n%12)+12)%12===k)r.push(n);return r;}
    function circle(){
      var b=[],up=_w07_wrap(cur.n+1),dn=_w07_wrap(cur.n-1);
      [5,6,7].forEach(function(k){var a1=ang(k)-Math.PI/12,a2=ang(k)+Math.PI/12,P=function(r,a){return (cx+r*Math.cos(a)).toFixed(1)+","+(cy+r*Math.sin(a)).toFixed(1);};
        b.push('<path d="M'+P(R4,a1)+' A'+R4+','+R4+' 0 0 1 '+P(R4,a2)+' L'+P(R1,a2)+' A'+R1+','+R1+' 0 0 0 '+P(R1,a1)+' Z" fill="'+V("gold-soft")+'"/>');});
      [R4,R3,R2,R1].forEach(function(r){b.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+V("line")+'" stroke-width="1.1"/>');});
      for(var k=0;k<12;k++){var a=ang(k)+Math.PI/12;b.push(ln((cx+R1*Math.cos(a)).toFixed(1),(cy+R1*Math.sin(a)).toFixed(1),(cx+R4*Math.cos(a)).toFixed(1),(cy+R4*Math.sin(a)).toFixed(1),V("line"),1));}
      for(k=0;k<12;k++){
        var ns=namesAt(k),dbl=ns.length>1;
        [[false,(R4+R3)/2,dbl?11:12.5],[true,(R2+R1)/2,dbl?9.5:11]].forEach(function(q){
          var minor=q[0],rad=q[1],sz=q[2],gap=sz+4,px=cx+rad*Math.cos(ang(k)),py=cy+rad*Math.sin(ang(k));
          ns.forEach(function(n,j){
            var K=_w07_key(n,minor),y=py-(ns.length-1)*gap/2+j*gap,w=K.jp.length*sz+8,h=sz+5;
            var sel=cur.n===n&&cur.minor===minor,nb=cur.minor===minor&&(n===up||n===dn),pt=cur.minor!==minor&&cur.n===n;
            if(sel||nb||pt)b.push('<rect x="'+(px-w/2).toFixed(1)+'" y="'+(y-h/2).toFixed(1)+'" width="'+w+'" height="'+h+'" rx="5" fill="'+V(sel?"signal-soft":nb?"blue-soft":"purple-soft")+'" stroke="'+V(sel?"signal":nb?"blue":"purple")+'" stroke-width="'+(sel?1.6:1)+'"/>');
            b.push(tx(px.toFixed(1),(y+sz*0.36).toFixed(1),K.jp,"middle",sz,sel?V("signal"):minor?V("purple"):V("blue"),true).replace("<text","<text pointer-events=\"none\""));
            b.push('<rect data-k="'+n+','+(minor?1:0)+'" x="'+(px-w/2).toFixed(1)+'" y="'+(y-h/2).toFixed(1)+'" width="'+w+'" height="'+h+'" fill="transparent" style="cursor:pointer"/>');
          });
        });
        var gs=dbl?13:0,px2=cx+(R3+R2)/2*Math.cos(ang(k)),py2=cy+(R3+R2)/2*Math.sin(ang(k));
        ns.forEach(function(n,j){b.push(tx(px2.toFixed(1),(py2-(ns.length-1)*gs/2+j*gs+3.5).toFixed(1),n?(n>0?"♯":"♭")+Math.abs(n):"0","middle",dbl?9.5:10.5,V("muted"),false));});
      }
      b.push(tx(cx,cy-6,"外側: 長調","middle",10.5,V("blue"),true));
      b.push(tx(cx,cy+12,"内側: 短調","middle",10.5,V("purple"),true));
      return svgWrap(W,W,b.join(""));
    }
    function draw(){
      var K=_w07_key(cur.n,cur.minor),notes=_w07_scale(K,4),s=8;
      view.innerHTML='<div style="display:flex;justify-content:center">'+circle()+'</div>';
      var st=staffStart(s,cur.n)+6,items=notes.map(function(x,i){return {x:st+i*24,notes:[x],fill:act===i?V("signal"):V("ink")};});
      var T1=staff({s:s,w:st+8*24+4,clef:"treble",key:cur.n,items:items}),T2=staff({s:s,w:staffStart(s,cur.n)+6,clef:"bass",key:cur.n,items:[]});
      var ms=notes.map(function(x){return parse(x).midi;}),hl={};
      notes.forEach(function(x,i){hl[ms[i]]={c:act===i?"signal":(i===0||i===7)?"signal":cur.minor?"purple":"blue",label:nname(x,false),strong:act===i||i===0||i===7};});
      var kb=kbd(60,83,{ww:15,wh:62,hl:hl,names:null});
      info.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;align-items:center">'+svgWrap(T1.w,T1.h,T1.svg)+svgWrap(T2.w,T2.h,T2.svg)+svgWrap(kb.w,kb.h,kb.svg)+'</div>';
      var up=_w07_key(_w07_wrap(cur.n+1),cur.minor),dn=_w07_key(_w07_wrap(cur.n-1),cur.minor),pt=_w07_key(cur.n,!cur.minor);
      var h='<b>'+K.jp+'</b>（'+K.en+'） ／ 調号 <b>'+_w07_sig(cur.n)+'</b>'+(cur.n?'（'+_w07_sigList(cur.n)+'）':'')+' ／ '+_w07_nstr(cur.n)+
        '<br>5 度上の調: <b style="color:var(--blue)">'+up.jp+'</b>（調号 '+_w07_sig(up.n)+'） ／ 5 度下の調: <b style="color:var(--blue)">'+dn.jp+'</b>（調号 '+_w07_sig(dn.n)+'）'+
        '<br>同じ調号の'+(cur.minor?'長調':'短調')+': <b style="color:var(--purple)">'+pt.jp+'</b>';
      var en=namesAt(((cur.n%12)+12)%12).filter(function(n){return n!==cur.n;});
      if(en.length)h+=' ／ 同じ位置の異名同音調: <b>'+_w07_key(en[0],cur.minor).jp+'</b>（調号 '+_w07_sig(en[0])+'）';
      if(Math.abs(cur.n+1)>7||Math.abs(cur.n-1)>7)h+='<br>（'+(cur.n>0?'5 度上':'5 度下')+'の調は、調号の数が 7 を超えるので異名同音調の名前で示した）';
      if(cur.minor){var p7=parse(notes[6]),r7=p7.letter+accs(p7.acc+1);h+='<br>短調の音階は自然短音階で示した。和声的短音階では、第 7 音を半音上げた '+r7+' を臨時記号で書く';}
      ro.innerHTML=h;
    }
    function play(){var ms=_w07_scale(_w07_key(cur.n,cur.minor),4).map(function(x){return parse(x).midi;});
      _w07_play(bPl,_w07_scaleEv(ms),{onStep:function(i){act=i;draw();},onEnd:function(){act=-1;draw();}});}
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-k]");if(!t)return;var p=t.getAttribute("data-k").split(",");
      stopAll();cur={n:+p[0],minor:p[1]==="1"};act=-1;draw();play();});
    bPl.addEventListener("click",play);
    draw();
  };

  /* ============ 07. w07_common — 2 つの調の共通音 ============ */
  REG.w07_common=function(el){
    head(el,"Common","2 つの調を選ぶと、共通音の数と、五度圏の上の距離が表示される");
    var LIST=[];
    [false,true].forEach(function(mi){[0,1,2,3,4,5,6,7,-1,-2,-3,-4,-5,-6,-7].forEach(function(n){LIST.push(_w07_key(n,mi));});});
    function lab(K){return K.jp+'（'+K.en+'・'+(K.n?(K.n>0?'♯':'♭')+Math.abs(K.n):'調号なし')+'）';}
    var row=ctrls(el),sa=select(row,"調 A",LIST.map(lab)),sb=select(row,"調 B",LIST.map(lab));
    sa.value="0";sb.value="1";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bA=button(bar,"▶ A の音階"),bB=button(bar,"▶ B の音階"),bAB=button(bar,"▶ A → B");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el),actA=-1,actB=-1;
    var FN=["C","G","D","A","E","B","F♯","D♭","A♭","E♭","B♭","F"];   /* 五度圏の位置（C を 0、時計回り）の音名 */
    function pcs(K){var r={};_w07_scale(K,4).slice(0,7).forEach(function(x){r[((parse(x).midi%12)+12)%12]=nname(x,false);});return r;}
    function rel(A,B){
      var dn=(((B.n-A.n)%12)+12)%12,tA=((parse(A.t+"4").midi%12)+12)%12,tB=((parse(B.t+"4").midi%12)+12)%12;
      if(A.minor===B.minor){
        if(dn===0)return A.n===B.n?'A と B は同じ調':'A と B は<b>異名同音調</b>（同じ高さで名前が違う）';
        if(dn===1)return 'B は A の<b>属調</b>（近親調）';
        if(dn===11)return 'B は A の<b>下属調</b>（近親調）';
        return 'A と B は近親調ではない';
      }
      if(dn===0)return 'A と B は<b>平行調</b>（近親調）';
      if(tA===tB)return 'A と B は<b>同主調</b>（近親調）';
      if(dn===1)return 'B は A の属調の平行調（近親調に含めることもある）';
      if(dn===11)return 'B は A の下属調の平行調（近親調に含めることもある）';
      return 'A と B は近親調ではない';
    }
    function draw(){
      var A=LIST[+sa.value],B=LIST[+sb.value],pa=pcs(A),pb=pcs(B),b=[];
      var r=78,cx=130,cy=124,ang=function(p){return (-90+30*p)*Math.PI/180;};
      var arc=function(n,rad,col){var a1=ang(n-1)-0.2,a2=ang(n+5)+0.2,P=function(a){return (cx+rad*Math.cos(a)).toFixed(1)+","+(cy+rad*Math.sin(a)).toFixed(1);};
        return '<path d="M'+P(a1)+' A'+rad+','+rad+' 0 1 1 '+P(a2)+'" fill="none" stroke="'+V(col)+'" stroke-width="5" stroke-linecap="round" stroke-opacity="0.85"/>';};
      b.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+V("line")+'" stroke-width="1.1"/>');
      b.push(arc(A.n,r+13,"blue"));b.push(arc(B.n,r+23,"purple"));
      var com=[],onlyA=[],onlyB=[];
      for(var p=0;p<12;p++){var pc=(7*p)%12,a=ang(p),x=cx+r*Math.cos(a),y=cy+r*Math.sin(a),inA=pa[pc]!=null,inB=pb[pc]!=null;
        var col=inA&&inB?"green":inA?"blue":inB?"purple":"muted",rr=inA&&inB?6.5:(inA||inB)?4:2.6;
        b.push('<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+rr+'" fill="'+V(col)+'"/>');
        b.push(tx((cx+(r-17)*Math.cos(a)).toFixed(1),(cy+(r-17)*Math.sin(a)+3.5).toFixed(1),FN[p],"middle",9.5,inA||inB?V("ink"):V("muted"),inA&&inB));}
      for(var q=0;q<12;q++){if(pa[q]!=null&&pb[q]!=null)com.push(q);else if(pa[q]!=null)onlyA.push(q);else if(pb[q]!=null)onlyB.push(q);}
      b.push(tx(cx,cy-4,"共通音","middle",10.5,V("green"),true));b.push(tx(cx,cy+16,String(com.length),"middle",18,V("green"),true));
      var circ=svgWrap(260,252,b.join(""));
      var hl={};
      com.forEach(function(pc){hl[60+pc]={c:"green",label:pa[pc],strong:true};});
      onlyA.forEach(function(pc){hl[60+pc]={c:"blue",label:pa[pc],strong:actA>=0};});
      onlyB.forEach(function(pc){hl[60+pc]={c:"purple",label:pb[pc],strong:actB>=0};});
      var kb=kbd(60,71,{ww:24,wh:84,hl:hl,names:null});
      var s=7,mk2=function(K,act,col){var st=staffStart(s,K.n)+6,ns=_w07_scale(K,4);
        return staff({s:s,w:st+8*21+4,clef:"treble",key:K.n,items:ns.map(function(x,i){return {x:st+i*21,notes:[x],fill:act===i?V("signal"):V(col)};})});};
      var SA=mk2(A,actA,"blue"),SB=mk2(B,actB,"purple");
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;align-items:center">'+circ+
        '<div style="display:flex;flex-direction:column;gap:.3rem;align-items:center">'+svgWrap(kb.w,kb.h,kb.svg)+
        '<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted)"><span style="color:var(--green)">■</span> 共通音 <span style="color:var(--blue)">■</span> A だけ <span style="color:var(--purple)">■</span> B だけ</div></div>'+
        '<div style="display:flex;flex-direction:column;gap:.1rem;align-items:flex-start"><div style="font-size:.75rem;color:var(--blue);font-weight:700">A: '+A.jp+'</div>'+svgWrap(SA.w,SA.h,SA.svg)+
        '<div style="font-size:.75rem;color:var(--purple);font-weight:700">B: '+B.jp+'</div>'+svgWrap(SB.w,SB.h,SB.svg)+'</div></div>';
      var pA=((A.n%12)+12)%12,pB=((B.n%12)+12)%12,df=Math.abs(pA-pB),d=Math.min(df,12-df);
      var nm=function(list,src){return list.length?list.map(function(pc){return src[pc];}).join(" "):"なし";};
      var cm=com.map(function(pc){return pa[pc]===pb[pc]?pa[pc]:pa[pc]+"（"+pb[pc]+"）";}).join(" ");
      ro.innerHTML='五度圏の上の距離 <b>d = '+d+'</b> ／ 共通音 <b style="color:var(--green)">'+com.length+'</b> つ: '+(cm||"なし")+
        '<br>A だけの音: <span style="color:var(--blue)">'+nm(onlyA,pa)+'</span> ／ B だけの音: <span style="color:var(--purple)">'+nm(onlyB,pb)+'</span>'+
        '<br>'+(d<=5?'d ≤ 5 なので 7 − d = '+(7-d):'d = 6 なので、両端で重なって 2')+'（共通音の数と一致） ／ '+rel(A,B);
    }
    function ms(K){return _w07_scale(K,4).map(function(x){return parse(x).midi;});}
    function reset(){actA=-1;actB=-1;draw();}
    bA.addEventListener("click",function(){_w07_play(bA,_w07_scaleEv(ms(LIST[+sa.value])),{onStep:function(i){actA=i;actB=-1;draw();},onEnd:reset});});
    bB.addEventListener("click",function(){_w07_play(bB,_w07_scaleEv(ms(LIST[+sb.value])),{onStep:function(i){actB=i;actA=-1;draw();},onEnd:reset});});
    bAB.addEventListener("click",function(){var a=ms(LIST[+sa.value]),bb=ms(LIST[+sb.value]),ev=_w07_scaleEv(a).concat(_w07_scaleEv(bb,a.length*0.32+0.9));
      _w07_play(bAB,ev,{onStep:function(i){if(i<8){actA=i;actB=-1;}else{actB=i-8;actA=-1;}draw();},onEnd:reset});});
    [sa,sb].forEach(function(s){s.addEventListener("change",function(){stopAll();reset();});});
    draw();
  };
