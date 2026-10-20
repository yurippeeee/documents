  /* ---------- 10: 和音の機能（共通） ---------- */
  var _w10_FC={T:"blue",SD:"green",D:"signal"};
  var _w10_FN={"I":"T","IIm":"SD","IIIm":"T","IV":"SD","V":"D","V7":"D","VIm":"T","VIIdim":"D"};
  var _w10_DEG=["I","IIm","IIIm","IV","V","V7","VIm","VIIdim"];
  /* 長調の主音（"C" "Bb" など）とディグリーネームから、コードネームを作る */
  function _w10_sym(key,deg){
    var sc=spellScale(key+"4",MAJOR,7), i={"I":0,"IIm":1,"IIIm":2,"IV":3,"V":4,"V7":4,"VIm":5,"VIIdim":6}[deg], p=parse(sc[i]);
    return p.letter+(p.acc===1?"#":p.acc===-1?"b":"")+{"I":"","IIm":"m","IIIm":"m","IV":"","V":"","V7":"7","VIm":"m","VIIdim":"dim"}[deg];
  }
  function _w10_disp(sym){var m=/^([A-G])([#b]?)(.*)$/.exec(sym);return m[1]+(m[2]==="#"?"♯":m[2]==="b"?"♭":"")+m[3];}
  /* 再生カードと同じ配置: 前の和音からなるべく動かない上の声部と、ベースの根音 */
  function _w10_voice(syms){var prev=null;return syms.map(function(s){var v=voiceLead(s,prev,52,67),c=chordParse(s);prev=v;
    return {sym:s,up:v,bass:40+((c.rootPc-40)%12+12)%12};});}
  function _w10_evs(vs,spb,last){return vs.map(function(v,i){return {t:i*spb,d:(i===vs.length-1?last:1)*spb*0.98,m:[v.bass].concat(v.up)};});}
  /* 大譜表に進行を書く */
  function _w10_prog(vs,key,o){
    o=o||{}; var s=8, kc=keyCount(key)||0, x0=staffStart(s,kc)+8, dx=o.dx||42, items=[];
    vs.forEach(function(v,i){var col=V(o.cols?o.cols[i]:"ink"), x=x0+i*dx;
      items.push({x:x,notes:chordSpell(v.sym,v.up),staff:"treble",fill:col,sym:_w10_disp(v.sym),symcol:col});
      items.push({x:x,notes:chordSpell(v.sym,[v.bass]),staff:"bass",fill:col});});
    var st=staff({s:s,w:x0+vs.length*dx,clef:"grand",key:kc,items:items,top:4.6*s});
    return svgWrap(st.w,st.h,st.svg,"stf");
  }
  /* 和音の帯（機能の色）。warn のある和音の前の矢印を赤くする */
  function _w10_band(items,o){
    o=o||{};
    return '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center">'+items.map(function(it,i){
      var c=_w10_FC[it.fn];
      var box='<span data-i="'+i+'" style="display:inline-flex;flex-direction:column;align-items:center;min-width:3.5rem;padding:.28rem .4rem;border-radius:8px;border:'+
        (it.hl?'2.5px solid var(--signal)':'1.5px solid var(--'+c+')')+';background:var(--'+c+'-soft);font-family:var(--mono);font-size:.72rem;line-height:1.3;'+(o.click?'cursor:pointer;':'')+'">'+
        '<b style="font-family:var(--sans);font-size:.95rem;color:var(--ink)">'+esc(_w10_disp(it.sym))+'</b><span style="color:var(--'+c+');font-weight:700">'+esc(it.deg)+' · '+it.fn+'</span></span>';
      var nx=items[i+1], arr=nx?'<span style="color:var(--'+(nx.warn?'alias':'muted')+');font-weight:'+(nx.warn?800:400)+';font-size:'+(nx.warn?'1.15rem':'.9rem')+'">→</span>':'';
      return box+arr;}).join("")+'</div>';
  }
  /* 最後の 2 つの和音（ディグリーネーム）から終止の名前と説明 */
  function _w10_cad(x,y){
    var D=x==="V"||x==="V7", fx=_w10_FN[x], fy=_w10_FN[y];
    if(D&&y==="I")return ["全終止","導音が半音上の主音へ進み、V7 なら三全音も 3 度・6 度へ解決して、はっきり終わる"];
    if(D&&y==="VIm")return ["偽終止","上の声部は全終止と同じように解決するが、ベースが主音へ進まないので、終わりきらずに続く"];
    if(x==="IV"&&y==="I")return ["変終止","導音も三全音も含まず、C を残したまま進むので、全終止より穏やかに終わる"];
    if(y==="V"||y==="V7")return ["半終止","D で止まって解決していないので、続きを求める区切りになる"];
    if(fy==="T")return [null,"4 つの終止の形ではないが、最後は T（"+fx+" → "+fy+"）"+(x==="VIIdim"?"。VIIdim も導音と三全音を含み、I へ解決する":x==="IIm"?"。IV と同じ SD から T への動き":"")];
    return [null,"4 つの終止の形ではない。最後が "+fy+" なので、終わった感じにはならない（"+fx+" → "+fy+"）"];
  }
  /* ボタン: 押すと鳴らし、鳴っている間にもう一度押すと止める */
  function _w10_pbtn(btn,getEvs,o){
    o=o||{};
    btn.addEventListener("click",function(){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var evs=getEvs(); if(!evs||!evs.length)return;
      playEvents(evs,{timbre:o.timbre||"piano",onStep:o.onStep,onEnd:function(){btn.setAttribute("aria-pressed","false");if(o.onEnd)o.onEnd();}});
      btn.setAttribute("aria-pressed","true");
      hold(function(){btn.setAttribute("aria-pressed","false");if(o.onEnd)o.onEnd();});
    });
  }
  function _w10_arr(x1,y1,x2,y2,col,lw){var a=Math.atan2(y2-y1,x2-x1),h=6,hx=x2-h*Math.cos(a),hy=y2-h*Math.sin(a);
    return ln(x1,y1,hx,hy,col,lw||1.5)+'<polygon points="'+x2+','+y2+' '+(hx-h*0.45*Math.sin(a))+','+(hy+h*0.45*Math.cos(a))+' '+(hx+h*0.45*Math.sin(a))+','+(hy-h*0.45*Math.cos(a))+'" fill="'+col+'"/>';}
  /* 2 つの音（音名）の音程の名前 */
  function _w10_ivn(lo,hi){var a=parse(lo),b=parse(hi),d=b.dia-a.dia+1,s=b.midi-a.midi,d0=(d-1)%7+1,s0=s-12*Math.floor((d-1)/7),q;
    if(d0===1||d0===4||d0===5)q={0:"完全",1:"増","-1":"減"}[s0-{1:0,4:5,5:7}[d0]];else q={0:"長","-1":"短",1:"増","-2":"減"}[s0-{2:2,3:4,6:9,7:11}[d0]];
    return (q||"?")+" "+d+" 度、半音 "+s;}
  function _w10_sg(d){return d===0?"0":d>0?"+"+d:"−"+(-d);}

  /* ============ 10. w10_resolve — ドミナントの和音から主和音へ ============ */
  REG.w10_resolve=function(el){
    head(el,"Resolution","ドミナントの和音から主和音へ — それぞれの音の動きと三全音");
    var KEYS=[["C","ハ長調"],["G","ト長調"],["F","ヘ長調"],["D","ニ長調"],["Bb","変ロ長調"],["A","イ長調"],["Eb","変ホ長調"],["Am","イ短調"],["Em","ホ短調"],["Dm","ニ短調"],["Cm","ハ短調"]];
    var MAJ=[["V7","V7（属七の和音）"],["V","V（三和音）"]], MIN=[["V7","V7（和声的短音階）"],["V","V（和声的短音階）"],["Vm","Vm（自然短音階）"]];
    /* ハ長調・イ短調での配置（MIDI。先頭がベース）。ほかの調は移調する */
    var VO={maj:{V7:[[43,59,65,74],[48,60,64,72]],V7b:[[43,65,71,74],[48,64,72,76]],V:[[43,59,62,67],[48,60,64,67]]},
            min:{V7:[[40,56,62,71],[45,57,60,69]],V7b:[[40,62,68,71],[45,60,69,72]],V:[[40,56,59,64],[45,57,60,64]],Vm:[[40,55,59,64],[45,57,60,64]]}};
    var ROLE={majV7:["根音","導音","7 度の音","5 度の音"],majV7b:["根音","7 度の音","導音","5 度の音"],majV:["根音","導音","5 度の音","根音"],
              minV7:["根音","導音","7 度の音","5 度の音"],minV7b:["根音","7 度の音","導音","5 度の音"],minV:["根音","導音","5 度の音","根音"],minVm:["根音","3 度の音","5 度の音","根音"]};
    var row=ctrls(el), sk=select(row,"調",KEYS.map(function(k){return k[1];})), sc=select(row,"ドミナントの和音",[""]), sv=select(row,"三全音の上下（V7 のとき）",["導音が下（減 5 度）","7 度の音が下（増 4 度）"]);
    var bar=mk("div","pbtns"); el.appendChild(bar); var b1=button(bar,"▶ 2 つの和音"), b2=button(bar,"▶ 注目する音だけ");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view); var ro=readout(el);
    var mode=null;
    function setOpts(){var mn=/m$/.test(KEYS[+sk.value][0]); if(mode!==mn){mode=mn; sc.innerHTML=(mn?MIN:MAJ).map(function(o,i){return '<option value="'+i+'">'+o[1]+'</option>';}).join("");}}
    function cur(){
      var k=KEYS[+sk.value][0], mn=/m$/.test(k), list=mn?MIN:MAJ, ch=list[+sc.value]||list[0], tk=mn?k.slice(0,-1):k;
      var p=((PCL[LETTERS.indexOf(tk[0])]+(tk[1]==="#"?1:tk[1]==="b"?-1:0))%12+12)%12, t=mn?((p-4)%12+12)%12-5:((p+5)%12+12)%12-5;
      var tri=ch[0]==="V7", vk=tri&&sv.value==="1"?"V7b":ch[0], v=VO[mn?"min":"maj"][vk];
      var dp=parse(spellScale(tk+"4",mn?HARM_MINOR:MAJOR,5)[4]), dsym=dp.letter+(dp.acc===1?"#":dp.acc===-1?"b":"")+(ch[0]==="V7"?"7":ch[0]==="Vm"?"m":"");
      var A=v[0].map(function(m){return m+t;}), B=v[1].map(function(m){return m+t;});
      return {k:k,mn:mn,ch:ch,tri:tri,dsym:dsym,tsym:k,A:A,B:B,an:chordSpell(dsym,A),bn:chordSpell(k,B),role:ROLE[(mn?"min":"maj")+vk]};
    }
    function draw(){
      setOpts(); var c=cur(); sv.disabled=!c.tri; sv.parentNode.style.opacity=c.tri?"1":"0.45";
      var s=12, top=3.6*s, kc=keyCount(c.k)||0, xa=staffStart(s,kc)+22, xb=xa+150;
      var cols=c.role.map(function(r){return r==="導音"||r==="7 度の音"?"signal":r==="3 度の音"?"alias":"ink";});
      var items=[{x:xa,notes:c.an.slice(1),staff:"treble",fill:V("ink"),fills:cols.slice(1).map(V),sym:_w10_disp(c.dsym)+"（"+c.ch[0]+"）",symcol:V("signal")},
                 {x:xa,notes:[c.an[0]],staff:"bass",fill:V("ink")},
                 {x:xb,notes:c.bn.slice(1),staff:"treble",fill:V("blue"),sym:_w10_disp(c.tsym)+"（"+(c.mn?"Im":"I")+"）",symcol:V("blue")},
                 {x:xb,notes:[c.bn[0]],staff:"bass",fill:V("blue")}];
      var st=staff({s:s,w:xb+48,clef:"grand",key:kc,items:items,top:top});
      var Y=function(n,bass){var q=parse(n),yt=bass?top+8*s:top,pp=q.dia-(bass?18:30);return yt+4*s-pp*s/2;};
      var g=[], x0=2;
      c.an.forEach(function(n,i){var y1=Y(n,i===0),y2=Y(c.bn[i],i===0),d=c.B[i]-c.A[i],col=V(cols[i]==="ink"?"muted":cols[i]);
        if(d===0)g.push(ln(x0+xa+11,y1,x0+xb-11,y2,V("muted"),1.3,"3,3")); else g.push(_w10_arr(x0+xa+11,y1,x0+xb-12,y2,col,1.6));
        g.push(tx(x0+xb+14,y2+4,_w10_sg(d),"start",11,cols[i]==="ink"?V("ink"):col,true));});
      var html='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w+20,st.h,st.svg+g.join(""));
      var lines=['<b>'+_w10_disp(c.dsym)+'（'+c.ch[0]+'）→ '+_w10_disp(c.tsym)+'（'+(c.mn?"Im":"I")+'）</b>'];
      c.role.forEach(function(r,i){if(r==="導音"||r==="7 度の音"||r==="3 度の音"){var d=c.B[i]-c.A[i];
        lines.push((r==="3 度の音"?"3 度の音（音階の第 7 音）":r)+' '+nname(c.an[i])+' → '+nname(c.bn[i])+': 半音 <b>'+_w10_sg(d)+'</b>'+
          (r==="導音"?'（半音上の主音へ）':r==="3 度の音"?'（全音。主音の半音下ではないので導音ではない）':(d===-1?'（半音下へ）':'（全音下へ）')));}});
      if(c.tri){
        var i1=c.role.indexOf("導音"), i2=c.role.indexOf("7 度の音"), lo=c.A[i1]<c.A[i2]?i1:i2, hi=lo===i1?i2:i1;
        var fs=[c.A[lo],c.A[hi],c.B[lo],c.B[hi]].map(mfreq), fmin=Math.min.apply(null,fs)*0.85, fmax=Math.max.apply(null,fs)*8*1.1;
        var s1=spec([{f:fs[0],label:nname(c.an[lo]),c:"signal"},{f:fs[1],label:nname(c.an[hi]),c:"blue"}],{H:8,w:300,lane:30,fmin:fmin,fmax:fmax});
        var s2=spec([{f:fs[2],label:nname(c.bn[lo]),c:"signal"},{f:fs[3],label:nname(c.bn[hi]),c:"blue"}],{H:8,w:300,lane:30,fmin:fmin,fmax:fmax});
        html+='<div style="flex:1 1 300px;max-width:320px"><div style="font-size:.78rem;font-weight:700;text-align:center">三全音（解決の前）</div>'+svgWrap(s1.w,s1.h,s1.svg,"spec")+'<div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);text-align:center">'+specStats(s1)+'</div>'+
              '<div style="font-size:.78rem;font-weight:700;text-align:center;margin-top:.4rem">解決のあと</div>'+svgWrap(s2.w,s2.h,s2.svg,"spec")+'<div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);text-align:center">'+specStats(s2)+'</div></div>';
        lines.push('三全音 '+nname(c.an[lo])+'–'+nname(c.an[hi])+'（'+_w10_ivn(c.an[lo],c.an[hi])+'）→ '+nname(c.bn[lo])+'–'+nname(c.bn[hi])+'（<b>'+_w10_ivn(c.bn[lo],c.bn[hi])+'</b>）');
      } else lines.push('この和音は三全音を含まない（7 度の音が無い）');
      view.innerHTML=html+'</div>'; ro.innerHTML=lines.join('<br>');
    }
    _w10_pbtn(b1,function(){var c=cur();return [{t:0,d:1.6,m:c.A},{t:1.65,d:2.4,m:c.B}];});
    _w10_pbtn(b2,function(){var c=cur(),ix=[];c.role.forEach(function(r,i){if(r==="導音"||r==="7 度の音"||r==="3 度の音")ix.push(i);});
      return [{t:0,d:1.6,m:ix.map(function(i){return c.A[i];})},{t:1.65,d:2.4,m:ix.map(function(i){return c.B[i];})}];},{timbre:"organ"});
    [sk,sc,sv].forEach(function(q){q.addEventListener("change",draw);});
    draw();
  };

  /* ============ 10. w10_cadence — 終止の聞き比べ ============ */
  REG.w10_cadence=function(el){
    head(el,"Cadence","フレーズの最後の 2 つの和音を選んで、区切り方を聞き比べる");
    var KEYS=[["C","ハ長調"],["G","ト長調"],["F","ヘ長調"],["D","ニ長調"],["Bb","変ロ長調"]];
    var PEN=["IV","IIm","V","V7","VIIdim","I","VIm","IIIm"], LAST=["I","VIm","V","IV","IIm","IIIm","V7","VIIdim"];
    var row=ctrls(el), sk=select(row,"調",KEYS.map(function(k){return k[1];})), sp=select(row,"最後から 2 番目の和音",PEN), sl=select(row,"最後の和音",LAST);
    sp.value="3";
    var pre=mk("div","pbtns"); el.appendChild(pre);
    [["全終止","V7","I"],["偽終止","V7","VIm"],["変終止","IV","I"],["半終止","IV","V"]].forEach(function(q){var b=button(pre,q[0]);
      b.addEventListener("click",function(){sp.value=String(PEN.indexOf(q[1]));sl.value=String(LAST.indexOf(q[2]));on=-1;draw();});});
    var bar=mk("div","pbtns"); el.appendChild(bar); var bp=button(bar,"▶ フレーズを鳴らす"), b2=button(bar,"▶ 最後の 2 つだけ");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view); var ro=readout(el);
    var on=-1;
    function cur(){var k=KEYS[+sk.value][0], degs=["I","VIm",PEN[+sp.value],LAST[+sl.value]], syms=degs.map(function(d){return _w10_sym(k,d);});
      return {k:k,degs:degs,syms:syms,vs:_w10_voice(syms)};}
    function draw(){
      var c=cur(), items=c.degs.map(function(d,i){return {sym:c.syms[i],deg:d,fn:_w10_FN[d],hl:i===on};});
      view.innerHTML=_w10_band(items)+'<div style="margin-top:.5rem">'+_w10_prog(c.vs,c.k,{cols:c.degs.map(function(d){return _w10_FC[_w10_FN[d]];})})+'</div>';
      var r=_w10_cad(c.degs[2],c.degs[3]);
      ro.innerHTML='最後の 2 つ: <b>'+c.degs[2]+' → '+c.degs[3]+'</b>（'+_w10_FN[c.degs[2]]+' → '+_w10_FN[c.degs[3]]+'）<br>'+(r[0]?'<b style="color:var(--signal)">'+r[0]+'</b>。':'')+r[1];
    }
    var st={onStep:function(i){on=i;draw();},onEnd:function(){on=-1;draw();}};
    _w10_pbtn(bp,function(){return _w10_evs(cur().vs,1.5,2);},st);
    _w10_pbtn(b2,function(){return _w10_evs(cur().vs.slice(2),1.5,2);},{onStep:function(i){on=i+2;draw();},onEnd:st.onEnd});
    [sk,sp,sl].forEach(function(q){q.addEventListener("change",draw);});
    draw();
  };

  /* ============ 10. w10_palette — 機能で進行を組み立てる ============ */
  REG.w10_palette=function(el){
    head(el,"Progression","機能の色の付いた和音を並べて、進行を組み立てる");
    var KEYS=[["C","ハ長調"],["G","ト長調"],["F","ヘ長調"]];
    var EX=[["（例を選ぶ）",null],["I → IV → V7 → I",["I","IV","V7","I"]],["I → VIm → IIm → V7 → I",["I","VIm","IIm","V7","I"]],["I → IIIm → IV → V → I",["I","IIIm","IV","V","I"]],
            ["I → V → VIm → IV → I",["I","V","VIm","IV","I"]],["I → V → IV → I",["I","V","IV","I"]]];
    var GRP={T:["I","VIm","IIIm"],SD:["IV","IIm"],D:["V","V7","VIIdim"]};
    var row=ctrls(el), sk=select(row,"調",KEYS.map(function(k){return k[1];})), se=select(row,"例を読み込む",EX.map(function(e){return e[0];}));
    var pal=mk("div","pbtns"); el.appendChild(pal);
    var seq=["I","IV","V7","I"], on=-1, pb=[];
    _w10_DEG.forEach(function(d){var fn=_w10_FN[d], b=button(pal,d); b.style.borderColor="var(--"+_w10_FC[fn]+")"; b.style.background="var(--"+_w10_FC[fn]+"-soft)"; pb.push(b);
      b.addEventListener("click",function(){if(seq.length>=8)return; seq.push(d); on=-1; draw();});});
    var bar=mk("div","pbtns"); el.appendChild(bar); var bp=button(bar,"▶ 再生"), bu=button(bar,"← 1 つ消す"), bc=button(bar,"すべて消す");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view); var ro=readout(el);
    function syms(){var k=KEYS[+sk.value][0]; return seq.map(function(d){return _w10_sym(k,d);});}
    function draw(){
      var k=KEYS[+sk.value][0];
      pb.forEach(function(b,i){var d=_w10_DEG[i], fn=_w10_FN[d]; b.innerHTML='<b>'+d+'</b> '+esc(_w10_disp(_w10_sym(k,d)))+' <span style="color:var(--'+_w10_FC[fn]+');font-weight:700">'+fn+'</span>';});
      if(!seq.length){view.innerHTML='<div style="padding:.8rem;color:var(--muted);text-align:center">上の和音を押して、進行を並べる（8 つまで）</div>'; ro.innerHTML='帯の和音を押すと、同じ機能の和音に置き換わる（代理）'; return;}
      var sy=syms(), vs=_w10_voice(sy), items=seq.map(function(d,i){return {sym:sy[i],deg:d,fn:_w10_FN[d],hl:i===on,warn:i>0&&_w10_FN[seq[i-1]]==="D"&&_w10_FN[d]==="SD"};});
      view.innerHTML=_w10_band(items,{click:true})+'<div style="margin-top:.5rem">'+_w10_prog(vs,k,{cols:seq.map(function(d){return _w10_FC[_w10_FN[d]];}),dx:38})+'</div>';
      var lines=['機能の並び: <b>'+seq.map(function(d){return _w10_FN[d];}).join(" → ")+'</b>'];
      if(items.some(function(it){return it.warn;}))lines.push('<span class="warn">D → SD</span> を含む（赤い矢印）。クラシックの和声では避けるのが基本とされるが、ポピュラー音楽ではよく使われる');
      if(seq.length>=2){var x=seq[seq.length-2], y=seq[seq.length-1], r=_w10_cad(x,y); lines.push('最後の 2 つ（'+x+' → '+y+'）: '+(r[0]?'<b style="color:var(--signal)">'+r[0]+'</b>':r[1]));}
      lines.push('帯の和音を押すと、同じ機能の和音に置き換わる（代理）');
      ro.innerHTML=lines.join('<br>');
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-i]"); if(!t)return;
      var i=+t.getAttribute("data-i"), g=GRP[_w10_FN[seq[i]]]; seq[i]=g[(g.indexOf(seq[i])+1)%g.length]; on=-1; draw();});
    _w10_pbtn(bp,function(){return seq.length?_w10_evs(_w10_voice(syms()),1.2,2):null;},{onStep:function(i){on=i;draw();},onEnd:function(){on=-1;draw();}});
    bu.addEventListener("click",function(){seq.pop(); on=-1; draw();});
    bc.addEventListener("click",function(){seq=[]; on=-1; draw();});
    se.addEventListener("change",function(){var e=EX[+se.value]; if(e[1]){seq=e[1].slice(); on=-1; draw();}});
    sk.addEventListener("change",draw);
    draw();
  };
