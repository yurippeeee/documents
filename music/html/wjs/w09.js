  /* ---------- 09: ダイアトニックコード（共通） ---------- */
  var _w09_TC={"長":"blue","短":"purple","減":"gold","増":"alias"}, _w09_TN={"長":"長三和音","短":"短三和音","減":"減三和音","増":"増三和音"},
      _w09_SUF={"長":"","短":"m","減":"dim","増":"aug"}, _w09_ROM=["I","II","III","IV","V","VI","VII"];
  /* "Bb" → "B♭"、"F#" → "F♯" */
  function _w09_disp(s){return String(s).replace(/#/g,"♯").replace(/^([A-G])b/,"$1♭");}
  /* 音階（主音 tonic、並び steps）の第 1〜第 7 音の上の三和音 */
  function _w09_tri(tonic,steps){
    var sc=spellScale(tonic,steps||MAJOR,15), out=[];
    for(var k=0;k<7;k++){
      var ns=[sc[k],sc[k+2],sc[k+4]], ms=ns.map(function(n){return parse(n).midi;}), lo=ms[1]-ms[0], hi=ms[2]-ms[1];
      var t=lo===4&&hi===3?"長":lo===3&&hi===4?"短":lo===3&&hi===3?"減":"増", p=parse(ns[0]);
      var sym=p.letter+({0:"",1:"#","-1":"b"}[p.acc])+_w09_SUF[t];
      out.push({notes:ns,ms:ms,lo:lo,hi:hi,t:t,sym:sym,name:nname(ns[0],false)+_w09_SUF[t]});
    }
    return out;
  }
  /* 押すと鳴り、もう一度押すと止まるボタン（ほかの音が鳴り始めたときも元に戻す） */
  function _w09_play(btn,evs,o){
    o=o||{};
    if(btn.getAttribute("aria-pressed")==="true"){stopAll();return;}
    var lab=btn.getAttribute("data-lab")||btn.innerHTML; btn.setAttribute("data-lab",lab);
    var done=false;
    function reset(){if(done)return;done=true;btn.setAttribute("aria-pressed","false");btn.innerHTML=btn.getAttribute("data-lab");if(o.onReset)o.onReset();}
    playEvents(evs,{timbre:o.timbre||"piano",onStep:o.onStep,onEnd:reset});
    btn.setAttribute("aria-pressed","true");btn.innerHTML="■ 止める";hold(reset);
  }
  function _w09_setLab(btn,html){btn.setAttribute("data-lab",html);if(btn.getAttribute("aria-pressed")!=="true")btn.innerHTML=html;}
  /* 根音から密集配置で積んだ MIDI（音階から取った 3 音そのまま） */
  function _w09_kbdRange(ms){var lo=Math.floor(Math.min.apply(null,ms)/12)*12, hi=Math.max.apply(null,ms); hi=hi+(11-hi%12); if(hi-lo<23)hi=lo+23; return [lo,hi];}

  /* ============ 09. w09_stack — 根音を選ぶと、2 つの 3 度と和音の種類が分かる ============ */
  REG.w09_stack=function(el){
    head(el,"Stack","根音を選ぶと、2 つの 3 度に入る全・半と、和音の種類が分かる");
    var KEYS=[["C4","ハ長調（C メジャー）"],["G3","ト長調（G メジャー）"],["D4","ニ長調（D メジャー）"],["F3","ヘ長調（F メジャー）"],["Bb3","変ロ長調（B♭ メジャー）"],["E4","ホ長調（E メジャー）"]];
    var row=ctrls(el), sk=select(row,"調",KEYS.map(function(x){return x[1];})), sr=select(row,"根音",["","","","","","",""]);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bp=button(bar,"▶ 鳴らす"), ba=button(bar,"▶ 7 つを順に");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el), on=null;
    function cur(){var K=KEYS[+sk.value];return {sc:spellScale(K[0],MAJOR,11),tri:_w09_tri(K[0],MAJOR)};}
    function labels(){var c=cur();for(var k=0;k<7;k++)sr.options[k].textContent="第 "+(k+1)+" 音（"+nname(c.sc[k],false)+"）の上";}
    function stp(i){return MAJOR[i%7]===2?"全":"半";}
    function draw(){
      var c=cur(), k=+sr.value, ch=c.tri[k], tc=_w09_TC[ch.t], b=[];
      var X0=26, DX=50, Y=56, W=X0*2+10*DX;
      for(var i=0;i<10;i++){var half=MAJOR[i%7]===1, xm=X0+(i+0.5)*DX, inC=i>=k&&i<k+4;
        if(half)b.push('<rect x="'+(xm-13)+'" y="'+(Y-41)+'" width="26" height="21" rx="5" fill="'+V("signal-soft")+'" stroke="'+V("signal")+'" stroke-width="1"/>');
        b.push(tx(xm,Y-25,stp(i),"middle",13,half?V("signal"):(inC?V("ink"):V("muted")),half||inC));}
      b.push(ln(X0,Y,X0+10*DX,Y,V("line"),1.4));
      for(i=0;i<11;i++){var x=X0+i*DX, j=[k,k+2,k+4].indexOf(i), isC=j>=0;
        b.push('<circle cx="'+x+'" cy="'+Y+'" r="15" fill="'+(isC?V(tc+"-soft"):V("panel"))+'" stroke="'+(isC?(j===0?V("signal"):V(tc)):V("muted"))+'" stroke-width="'+(isC?2.4:1.1)+'"/>');
        b.push(tx(x,Y+4.5,nname(c.sc[i],false),"middle",12.5,isC?V("ink"):V("muted"),isC));
        b.push(tx(x,Y+33,"第 "+(i%7+1)+" 音","middle",9.5,V("muted")));}
      function br(a,yb,s,lab){var xa=X0+a*DX+3, xb=X0+(a+2)*DX-3, q=s===4?"blue":"purple";
        b.push('<polyline points="'+xa+','+(yb-8)+' '+xa+','+yb+' '+xb+','+yb+' '+xb+','+(yb-8)+'" fill="none" stroke="'+V(q)+'" stroke-width="2.2"/>');
        b.push(tx((xa+xb)/2,yb+16,lab+": "+stp(a)+"＋"+stp(a+1),"middle",11.5,V("ink")));
        b.push(tx((xa+xb)/2,yb+32,"半音 "+s+"（"+(s===4?"長":"短")+" 3 度）","middle",11.5,V(q),true));}
      br(k,Y+56,ch.lo,"下の 3 度"); br(k+2,Y+104,ch.hi,"上の 3 度");
      var xc=X0+(k+2)*DX;
      b.push(tx(Math.max(150,Math.min(W-150,xc)),Y+170,ch.lo+" + "+ch.hi+" → "+_w09_TN[ch.t]+"（"+_w09_disp(ch.sym)+"）","middle",14,V(tc),true));
      var svg=svgWrap(W,Y+182,b.join(""));
      var rg=_w09_kbdRange(c.sc.slice(0,11).map(function(n){return parse(n).midi;})), hl={};
      ch.ms.forEach(function(m,i){hl[m]={c:tc,label:nname(ch.notes[i],false),strong:on==null||on===i||on===3};});
      var nw=0;for(var mm=rg[0];mm<=rg[1];mm++)if(!BLACK[mm%12])nw++;
      var kb=kbd(rg[0],rg[1],{ww:Math.min(22,Math.floor(520/nw)),wh:70,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-direction:column;gap:.5rem;align-items:center">'+svg+svgWrap(kb.w,kb.h,kb.svg)+'</div>';
      ro.innerHTML='第 '+(k+1)+' 音（'+nname(ch.notes[0],false)+'）の上: <b>'+ch.notes.map(function(n){return nname(n,false);}).join("・")+'</b><br>'+
        '下の 3 度 '+nname(ch.notes[0],false)+'→'+nname(ch.notes[1],false)+' = '+stp(k)+'＋'+stp(k+1)+' = 半音 '+ch.lo+'（'+(ch.lo===4?"長":"短")+' 3 度） ／ '+
        '上の 3 度 '+nname(ch.notes[1],false)+'→'+nname(ch.notes[2],false)+' = '+stp(k+2)+'＋'+stp(k+3)+' = 半音 '+ch.hi+'（'+(ch.hi===4?"長":"短")+' 3 度）<br>→ <b style="color:'+V(tc)+'">'+_w09_TN[ch.t]+' '+_w09_disp(ch.sym)+'</b>';
    }
    function evsOf(ch){return [{t:0,d:0.5,m:[ch.ms[0]]},{t:0.5,d:0.5,m:[ch.ms[1]]},{t:1.0,d:0.5,m:[ch.ms[2]]},{t:1.55,d:1.6,m:ch.ms}];}
    sk.addEventListener("change",function(){labels();draw();});
    sr.addEventListener("change",draw);
    bp.addEventListener("click",function(){var ch=cur().tri[+sr.value];
      _w09_play(bp,evsOf(ch),{onStep:function(i){on=i;draw();},onReset:function(){on=null;draw();}});});
    ba.addEventListener("click",function(){var tri=cur().tri, evs=[];
      tri.forEach(function(ch,k){evs.push({t:k*1.25,d:1.15,m:ch.ms,k:k});});
      _w09_play(ba,evs,{onStep:function(i){sr.value=String(evs[i].k);on=null;draw();},onReset:function(){on=null;draw();}});});
    labels();draw();
  };

  /* ============ 09. w09_keys — 調を選ぶと、7 つの和音をコードネームとディグリーネームで表示 ============ */
  REG.w09_keys=function(el){
    head(el,"Keys","調を選ぶと、7 つのダイアトニックコードがコードネームとディグリーネームで表示される");
    var KEYS=[["C4","C","ハ長調"],["G4","G","ト長調"],["D4","D","ニ長調"],["A3","A","イ長調"],["E4","E","ホ長調"],["B3","B","ロ長調"],
              ["F#4","F#","嬰ヘ長調"],["F4","F","ヘ長調"],["Bb3","Bb","変ロ長調"],["Eb4","Eb","変ホ長調"],["Ab3","Ab","変イ長調"],["Db4","Db","変ニ長調"]];
    var SEQ=[["7 つを順に（I から VIIdim まで、最後に I）",[0,1,2,3,4,5,6,0]],["I → IV → V → I",[0,3,4,0]],["I → VIm → IIm → V → I",[0,5,1,4,0]],["VIm → IV → V → I",[5,3,4,0]]];
    var row=ctrls(el), sk=select(row,"調（長調）",KEYS.map(function(x){return x[2]+"（"+_w09_disp(x[1])+" メジャー）";})), sq=select(row,"鳴らす並び",SEQ.map(function(x){return x[0];}));
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 並びを鳴らす");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var cb=mk("div","pbtns");el.appendChild(cb);
    var ro=readout(el), on=-1, last=0, cbs=[];
    function cur(){var K=KEYS[+sk.value];return {K:K,tri:_w09_tri(K[0],MAJOR),kc:keyCount(K[1])};}
    function rom(k,ch){return _w09_ROM[k]+_w09_SUF[ch.t];}
    function buttons(){
      var c=cur(); cb.innerHTML=""; cbs=[];
      c.tri.forEach(function(ch,k){var b=button(cb,'<b>'+_w09_disp(ch.sym)+'</b> '+rom(k,ch));b.style.minWidth="5.4rem";
        b.addEventListener("click",function(){var t=cur().tri[k];last=k;
          _w09_play(b,[{t:0,d:1.8,m:[t.ms[0]-12].concat(t.ms)}],{onStep:function(){on=k;draw();},onReset:function(){on=-1;draw();}});});
        cbs.push(b);});
    }
    function draw(){
      var c=cur(), s=9, x0=staffStart(s,c.kc)+12, DXc=56, items=[], names=[];
      c.tri.forEach(function(ch,k){var col=k===on?V("signal"):V(_w09_TC[ch.t]);
        items.push({x:x0+k*DXc,notes:ch.notes,fill:col,label:rom(k,ch),lcol:col,lsz:12,ldy:3.9*s});
        names.push(tx(2+x0+k*DXc,1.75*s,_w09_disp(ch.sym),"middle",12.5,col,true));});
      var st=staff({s:s,w:x0+6*DXc+28,clef:"treble",key:c.kc,items:items,top:5.4*s,bottom:5.0*s});
      var k=on>=0?on:last, ch=c.tri[k], hl={}, ms=[ch.ms[0]-12].concat(ch.ms);
      ms.forEach(function(m,i){hl[m]={c:_w09_TC[ch.t],label:i===0?"":nname(ch.notes[i-1],false),strong:on>=0};});
      var lo=Math.floor((ch.ms[0]-12)/12)*12, kb=kbd(lo,lo+35,{ww:14,wh:58,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-direction:column;gap:.4rem;align-items:center">'+svgWrap(st.w,st.h,names.join("")+st.svg)+svgWrap(kb.w,kb.h,kb.svg)+'</div>';
      var sq_=SEQ[+sq.value][1];
      ro.innerHTML=c.K[2]+'（'+_w09_disp(c.K[1])+' メジャー）: '+c.tri.map(function(t,j){return '<b style="color:'+V(_w09_TC[t.t])+'">'+_w09_disp(t.sym)+'</b>';}).join(" ")+
        '<br>並び: '+sq_.map(function(j){return '<b>'+_w09_disp(c.tri[j].sym)+'</b>';}).join(" → ")+' ／ '+sq_.map(function(j){return rom(j,c.tri[j]);}).join(" → ")+
        '<br>鍵盤: '+_w09_disp(ch.sym)+'（'+rom(k,ch)+'）の音。左端の音は、低い音で足した根音';
    }
    sk.addEventListener("change",function(){stopAll();on=-1;buttons();draw();});
    sq.addEventListener("change",draw);
    bp.addEventListener("click",function(){
      var c=cur(), seq=SEQ[+sq.value][1], prev=null, evs=[];
      seq.forEach(function(j,i){var ch=c.tri[j], v=voiceLead(ch.sym,prev,52,67); prev=v;
        var r=36+((ch.ms[0]%12)-36%12+12)%12; evs.push({t:i*1.1,d:i===seq.length-1?2.0:1.04,m:[r].concat(v),k:j});});
      _w09_play(bp,evs,{onStep:function(i){on=evs[i].k;last=on;draw();},onReset:function(){on=-1;draw();}});
    });
    buttons();draw();
  };

  /* ============ 09. w09_minor — 短調のダイアトニックコードを、同じ主音の長調と並べる ============ */
  REG.w09_minor=function(el){
    head(el,"Minor","主音と音階を選ぶと、短調のダイアトニックコードが、同じ主音の長調と並んで表示される");
    var TON=[["A3","A","イ短調","イ長調"],["E4","E","ホ短調","ホ長調"],["B3","B","ロ短調","ロ長調"],["D4","D","ニ短調","ニ長調"],["G3","G","ト短調","ト長調"],["C4","C","ハ短調","ハ長調"],["F3","F","ヘ短調","ヘ長調"]];
    var row=ctrls(el), st=select(row,"主音",TON.map(function(x){return x[2]+"（"+x[1]+" マイナー）";})), ss=select(row,"短調の音階",["自然短音階","和声的短音階（第 7 音を半音上げる）"]);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var b1=button(bar,"▶ 長調の 7 つ"), b2=button(bar,"▶ 短調の 7 つ"), b3=button(bar,"▶ Im → Vm → Im");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el), on=null, last={r:1,k:0};
    function cur(){var T_=TON[+st.value], h=ss.value==="1";
      return {T:T_,h:h,maj:_w09_tri(T_[0],MAJOR),nat:_w09_tri(T_[0],NAT_MINOR),min:_w09_tri(T_[0],h?HARM_MINOR:NAT_MINOR)};}
    function deg(sym,c,minor){return roman(sym,c.T[1]+(minor?"m":""));}
    function draw(){
      var c=cur(), b=[], C0=14, C1=96, C2=258, W=440, H0=46, RH=36;
      b.push(tx(C0,26,"根音","start",11.5,V("muted"),true));
      b.push(tx(C1+70,20,c.T[3]+"（同じ主音の長調）","middle",11.5,V("ink"),true));
      b.push(tx(C2+82,20,c.T[2]+"（"+(c.h?"和声的短音階":"自然短音階")+"）","middle",11.5,V("ink"),true));
      b.push(tx(C1+70,36,"ダイアトニックコード","middle",10,V("muted")));
      b.push(tx(C2+82,36,"ダイアトニックコード","middle",10,V("muted")));
      for(var k=0;k<7;k++){
        var y=H0+k*RH, A=c.maj[k], B=c.min[k], dA=deg(A.sym,c,false), dB=deg(B.sym,c,true), fl=/^♭/.test(dB), chg=c.h&&B.sym!==c.nat[k].sym;
        b.push(tx(C0,y+22,"第 "+(k+1)+" 音","start",11,V("muted")));
        [[0,C1,140,A,dA,false,false],[1,C2,164,B,dB,fl,chg]].forEach(function(q){
          var r=q[0], x=q[1], w=q[2], ch=q[3], d=q[4], isOn=on&&on.r===r&&on.k===k, col=V(_w09_TC[ch.t]);
          b.push('<rect data-c="'+r+':'+k+'" x="'+x+'" y="'+(y+3)+'" width="'+w+'" height="'+(RH-6)+'" rx="7" fill="'+(isOn?V("signal-soft"):q[5]?V("signal-soft"):V("panel"))+'" stroke="'+(isOn?V("signal"):q[6]?V("signal"):V("line"))+'" stroke-width="'+(isOn||q[6]?2.2:1)+'" style="cursor:pointer"/>');
          b.push(tx(x+12,y+23,_w09_disp(ch.sym),"start",13,col,true).replace("<text","<text pointer-events=\"none\""));
          var dc=/^♭/.test(d)?V("signal"):col;
          b.push(tx(x+(r?92:84),y+23,d,"middle",12.5,dc,true).replace("<text","<text pointer-events=\"none\""));
          if(q[6])b.push(tx(x+w-8,y+22,"変化","end",10,V("signal"),true).replace("<text","<text pointer-events=\"none\""));
        });
      }
      var yl=H0+7*RH+18;
      b.push('<rect x="'+C1+'" y="'+(yl-11)+'" width="14" height="14" rx="3" fill="'+V("signal-soft")+'" stroke="'+V("line")+'"/>');
      b.push(tx(C1+20,yl,"♭ が付く（根音が長調より半音低い）","start",10.5,V("muted")));
      if(c.h){b.push('<rect x="'+C1+'" y="'+(yl+9)+'" width="14" height="14" rx="3" fill="'+V("panel")+'" stroke="'+V("signal")+'" stroke-width="2"/>');
        b.push(tx(C1+20,yl+20,"和声的短音階で変わった和音","start",10.5,V("muted")));}
      var svg=svgWrap(W,yl+(c.h?30:12),b.join(""));
      var L=on||last, ch=(L.r===0?c.maj:c.min)[L.k], hl={};
      ch.ms.forEach(function(m,i){hl[m]={c:_w09_TC[ch.t],label:nname(ch.notes[i],false),strong:!!on};});
      var lo=Math.floor(Math.min.apply(null,c.maj[0].ms)/12)*12, kb=kbd(lo,lo+23,{ww:18,wh:62,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-direction:column;gap:.5rem;align-items:center">'+svg+svgWrap(kb.w,kb.h,kb.svg)+'</div>';
      var fls=[], chs=[];
      c.min.forEach(function(B,k){var dB=deg(B.sym,c,true); if(/^♭/.test(dB))fls.push(dB+'（'+_w09_disp(B.sym)+'）'); if(c.h&&B.sym!==c.nat[k].sym)chs.push(deg(c.nat[k].sym,c,true)+' → <b>'+dB+'</b>（'+_w09_disp(B.sym)+'）');});
      var majsc=spellScale(c.T[0],MAJOR,7), minsc=spellScale(c.T[0],c.h?HARM_MINOR:NAT_MINOR,7), low=[];
      for(var i=0;i<7;i++)if(parse(minsc[i]).midi<parse(majsc[i]).midi)low.push(nname(minsc[i],false)+'（'+c.T[3]+'では '+nname(majsc[i],false)+'）');
      ro.innerHTML='長調の音階より半音低い音: '+low.join("、")+'<br>♭ が付く和音: '+(fls.length?fls.join("、"):"なし")+
        (c.h?'<br>和声的短音階で変わった和音: '+chs.join("、"):'')+'<br>鍵盤: '+_w09_disp(ch.sym)+'（'+deg(ch.sym,c,L.r===1)+'）の音';
      _w09_setLab(b3,c.h?"▶ Im → V → Im":"▶ Im → Vm → Im");
    }
    function playRow(btn,r){var c=cur(), tri=r===0?c.maj:c.min, evs=[];
      tri.forEach(function(ch,k){evs.push({t:k*1.1,d:1.0,m:ch.ms,r:r,k:k});}); evs.push({t:7.7,d:1.8,m:tri[0].ms.map(function(m){return m+12;}),r:r,k:0});
      _w09_play(btn,evs,{onStep:function(i){on={r:r,k:evs[i].k};last=on;draw();},onReset:function(){on=null;draw();}});}
    b1.addEventListener("click",function(){playRow(b1,0);});
    b2.addEventListener("click",function(){playRow(b2,1);});
    b3.addEventListener("click",function(){var c=cur(), I=c.min[0], Vc=c.min[4], v1=voiceLead(I.sym,null,52,67), v2=voiceLead(Vc.sym,v1,52,67), v3=voiceLead(I.sym,v2,52,67);
      var r0=36+((I.ms[0]%12)-0+12)%12, r5=36+((Vc.ms[0]%12)+12)%12;
      var evs=[{t:0,d:1.2,m:[r0].concat(v1),k:0},{t:1.3,d:1.2,m:[r5].concat(v2),k:4},{t:2.6,d:2.0,m:[r0].concat(v3),k:0}];
      _w09_play(b3,evs,{onStep:function(i){on={r:1,k:evs[i].k};last=on;draw();},onReset:function(){on=null;draw();}});});
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-c]"); if(!t)return;
      var p=t.getAttribute("data-c").split(":"), r=+p[0], k=+p[1], c=cur(), ch=(r===0?c.maj:c.min)[k];
      last={r:r,k:k}; playEvents([{t:0,d:1.6,m:ch.ms}],{timbre:"piano",onStep:function(){on={r:r,k:k};draw();},onEnd:function(){on=null;draw();}});});
    [st,ss].forEach(function(s){s.addEventListener("change",function(){stopAll();on=null;draw();});});
    draw();
  };

  /* ============ 09. w09_common — 2 つの和音の共通音と、3 度の連なりの上の位置 ============ */
  REG.w09_common=function(el){
    head(el,"Common","2 つの和音を選ぶと、共通音と、3 度の連なりの上の位置が表示される");
    var KEYS=[["C4","C","ハ長調"],["G3","G","ト長調"],["F3","F","ヘ長調"],["D4","D","ニ長調"],["Bb3","Bb","変ロ長調"]];
    var row=ctrls(el), sk=select(row,"調（長調）",KEYS.map(function(x){return x[2]+"（"+_w09_disp(x[1])+" メジャー）";})), s1=select(row,"和音 1",["","","","","","",""]), s2=select(row,"和音 2",["","","","","","",""]);
    s2.value="5";
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 和音 1 → 和音 2");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el), on=-1;
    var CH=[0,2,4,6,1,3,5,0,2,4];   /* 3 度の連なり（音階の第何音か、0 始まり） */
    function cur(){var K=KEYS[+sk.value];return {K:K,sc:spellScale(K[0],MAJOR,15),tri:_w09_tri(K[0],MAJOR)};}
    function rom(k,ch){return _w09_ROM[k]+_w09_SUF[ch.t];}
    function labels(){var c=cur();[s1,s2].forEach(function(s){for(var k=0;k<7;k++)s.options[k].textContent=rom(k,c.tri[k])+"（"+_w09_disp(c.tri[k].sym)+"）";});}
    function cpos(k){return (k*4)%7;}   /* 第 k+1 音が、連なりの何番目か */
    function draw(){
      var c=cur(), k1=+s1.value, k2=+s2.value, A=c.tri[k1], B=c.tri[k2], b=[];
      var X0=46, DX=44, Y=64, W=X0+24+9*DX;
      var best=null;[cpos(k1),cpos(k1)+7].forEach(function(a){[cpos(k2),cpos(k2)+7].forEach(function(q){if(a<=7&&q<=7&&(!best||Math.abs(a-q)<Math.abs(best[0]-best[1])))best=[a,q];});});
      var p1=best[0], p2=best[1];
      var shift=((cpos(k2)-p1)%7+7)%7, dist=Math.min(shift,7-shift);
      var pcA=A.ms.map(function(m){return m%12;}), pcB=B.ms.map(function(m){return m%12;});
      function bar_(p,y,ch,lab){var xa=X0+p*DX-17, xb=X0+(p+2)*DX+17, col=V(_w09_TC[ch.t]);
        b.push('<rect x="'+xa+'" y="'+(y-10)+'" width="'+(xb-xa)+'" height="20" rx="10" fill="'+V(_w09_TC[ch.t]+"-soft")+'" stroke="'+col+'" stroke-width="1.6"/>');
        b.push(tx(xa-6,y+4.5,lab,"end",12,col,true));}
      b.push(ln(X0,Y,X0+9*DX,Y,V("line"),1.4));
      bar_(p1,Y-34,A,"1");
      bar_(p2,Y+34,B,"2");
      for(var i=0;i<10;i++){var x=X0+i*DX, n=c.sc[CH[i]], pc=parse(n).midi%12, inA=i>=p1&&i<p1+3, inB=i>=p2&&i<p2+3, both=inA&&inB;
        b.push('<circle cx="'+x+'" cy="'+Y+'" r="15" fill="'+(both?V("green"):V("panel"))+'" stroke="'+(both?V("green"):inA||inB?V("ink"):V("muted"))+'" stroke-width="'+(both?2:1.2)+'"/>');
        b.push(tx(x,Y+4.5,nname(n,false),"middle",12.5,both?V("panel"):(inA||inB?V("ink"):V("muted")),true));
        if(inA)b.push('<circle cx="'+x+'" cy="'+(Y-34)+'" r="3.4" fill="'+V(_w09_TC[A.t])+'"/>');
        if(inB)b.push('<circle cx="'+x+'" cy="'+(Y+34)+'" r="3.4" fill="'+V(_w09_TC[B.t])+'"/>');}
      var svg=svgWrap(W,Y+56,b.join(""));
      var com=A.notes.filter(function(n){return pcB.indexOf(parse(n).midi%12)>=0;}).map(function(n){return nname(n,false);});
      function kb(ch,k,act){var hl={};ch.ms.forEach(function(m,i){var cm=pcA.indexOf(m%12)>=0&&pcB.indexOf(m%12)>=0;hl[60+((m%12)-0+12)%12]={c:cm?"green":_w09_TC[ch.t],label:nname(ch.notes[i],false),strong:true};});
        var r=kbd(60,71,{ww:22,wh:60,hl:hl,names:null});
        return '<div style="text-align:center;font-family:var(--mono);font-size:.78rem;color:var(--muted)'+(act?';outline:2px solid var(--signal);outline-offset:3px;border-radius:6px':'')+'"><b style="color:'+V(_w09_TC[ch.t])+'">'+rom(k,ch)+'（'+_w09_disp(ch.sym)+'）</b>'+svgWrap(r.w,r.h,r.svg)+'</div>';}
      view.innerHTML='<div style="display:flex;flex-direction:column;gap:.6rem;align-items:center">'+svg+
        '<div style="display:flex;flex-wrap:wrap;gap:.8rem 1.4rem;justify-content:center">'+kb(A,k1,on===0)+kb(B,k2,on===1)+'</div></div>';
      var up=((k2-k1)%7+7)%7, deg=up+1, mv=up===0?"同じ和音":deg+" 度上（= "+(9-deg)+" 度下）";
      ro.innerHTML='根音: '+nname(A.notes[0],false)+' → '+nname(B.notes[0],false)+'（'+mv+'） ／ 3 度の連なりの上のずれ: <b>'+dist+'</b>'+
        '<br>→ 共通音 <b style="color:'+V(com.length?"green":"muted")+'">'+com.length+' つ</b>'+(com.length?'（'+com.join("・")+'）':'');
    }
    sk.addEventListener("change",function(){stopAll();labels();draw();});
    [s1,s2].forEach(function(s){s.addEventListener("change",draw);});
    bp.addEventListener("click",function(){var c=cur(), A=c.tri[+s1.value], B=c.tri[+s2.value], v1=voiceLead(A.sym,null,52,67), v2=voiceLead(B.sym,v1,52,67);
      _w09_play(bp,[{t:0,d:1.6,m:v1},{t:1.7,d:2.2,m:v2}],{onStep:function(i){on=i;draw();},onReset:function(){on=-1;draw();}});});
    labels();draw();
  };
