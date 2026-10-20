  /* ============ 06. 短音階 — 共通の小さな関数（名前は _w06_ で始める） ============ */
  var _w06_TYPES=[["長音階",MAJOR],["自然短音階",NAT_MINOR],["和声的短音階",HARM_MINOR],["旋律的短音階",MEL_MINOR]];
  var _w06_QC={"完全":"green","長":"blue","短":"purple","増":"alias","減":"gold"};
  /* 2 つの音名（下・上）→ {d: 度数, s: 半音の数, q: 種類} */
  function _w06_iv(lo,hi){
    var a=parse(lo),b=parse(hi),d=b.dia-a.dia+1,s=b.midi-a.midi,d0=(d-1)%7+1,s0=s-12*Math.floor((d-1)/7),q;
    if(d0===1||d0===4||d0===5)q={0:"完全",1:"増","-1":"減"}[s0-{1:0,4:5,5:7}[d0]];
    else q={0:"長","-1":"短",1:"増","-2":"減"}[s0-{2:2,3:4,6:9,7:11}[d0]];
    return {d:d,s:s,q:q||"?"};
  }
  function _w06_stepName(n){return n===1?"半":n===2?"全":n===3?"増 2 度":"?";}
  function _w06_stepCol(n){return n===1?"signal":n===3?"alias":"ink";}
  /* 音名の列 → 隣どうしの半音の数 */
  function _w06_gaps(sc){var r=[];for(var i=1;i<sc.length;i++)r.push(Math.abs(parse(sc[i]).midi-parse(sc[i-1]).midi));return r;}
  /* 全・半の並びを、幅を半音の数に比例させた帯で描く（12 半音 = 全体の幅） */
  function _w06_strip(gaps,title){
    var W=336,u=(W-4)/12,x=2,b=[],top=title?18:2;
    if(title)b.push(tx(2,12,title,"start",11,V("muted"),true));
    gaps.forEach(function(n){var col=V(_w06_stepCol(n)),wd=n*u;
      b.push('<rect x="'+(x+1).toFixed(1)+'" y="'+top+'" width="'+(wd-2).toFixed(1)+'" height="24" rx="5" fill="'+(n===2?V("panel"):n===1?V("signal-soft"):V("alias-soft"))+'" stroke="'+(n===2?V("line"):col)+'" stroke-width="1.2"/>');
      b.push(tx((x+wd/2).toFixed(1),top+17,_w06_stepName(n),"middle",n===3?10.5:12,col,n!==2));x+=wd;});
    return svgWrap(W,top+26,b.join(""));
  }
  /* 押すと鳴り、もう一度押すと止まるボタン。evs() が鳴らす列、onStep(evs, i) が見た目の更新、clear() が後片付け */
  function _w06_btn(bar,label,evs,onStep,clear){
    var b=button(bar,typeof label==="function"?label():label);
    function lab(){return typeof label==="function"?label():label;}
    function reset(){b.setAttribute("aria-pressed","false");b.textContent=lab();clear();}
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var e=evs();
      playEvents(e,{timbre:"piano",onStep:function(i){onStep(e,i);},onEnd:reset});
      hold(reset);
      b.setAttribute("aria-pressed","true");b.textContent="■ 止める";
    });
    b.relabel=function(){if(b.getAttribute("aria-pressed")!=="true")b.textContent=lab();};
    return b;
  }
  /* 音の列を 1 音ずつ鳴らすイベント（最後の音は長め） */
  function _w06_run(ms,dt){return ms.map(function(m,i){return {t:i*dt,d:i===ms.length-1?1.2:dt*0.95,m:[m],k:i};});}

  /* ============ 06. w06_degrees — 主音から見た 3 度・6 度・7 度を、長と短で切り替える ============ */
  REG.w06_degrees=function(el){
    head(el,"Degrees","主音から見た 3 度・6 度・7 度を、長と短で切り替える");
    var row=ctrls(el), sT=select(row,"主音",["C","D","E","F","G","A","B"]),
        s3=select(row,"主音 → 第 3 音",["長 3 度","短 3 度"]), s6=select(row,"主音 → 第 6 音",["長 6 度","短 6 度"]), s7=select(row,"主音 → 第 7 音",["長 7 度","短 7 度"]);
    var pre=mk("div","pbtns");el.appendChild(pre);
    [["長音階",[0,0,0]],["自然短音階",[1,1,1]],["第 3 音だけ短",[1,0,0]],["第 6・7 音だけ短",[0,1,1]]].forEach(function(p){
      var b=button(pre,p[0]);b.addEventListener("click",function(){s3.value=String(p[1][0]);s6.value=String(p[1][1]);s7.value=String(p[1][2]);hot=[];draw();});});
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el), hot=[];
    function cur(){
      var L=LETTERS[+sT.value], t=L+((L==="A"||L==="B")?3:4);
      var cum=[0,2,s3.value==="1"?3:4,5,7,s6.value==="1"?8:9,s7.value==="1"?10:11,12], st=[];
      for(var i=1;i<8;i++)st.push(cum[i]-cum[i-1]);
      var sc=spellScale(t,st,8), maj=spellScale(t,MAJOR,8);
      return {sc:sc,st:st,ms:sc.map(function(n){return parse(n).midi;}),low:sc.map(function(n,i){return parse(n).midi!==parse(maj[i]).midi;})};
    }
    function nameOf(){
      var k=s3.value+s6.value+s7.value, ds=[];
      if(k==="000")return "長音階"; if(k==="111")return "自然短音階";
      if(s3.value==="1")ds.push("第 3 音"); if(s6.value==="1")ds.push("第 6 音"); if(s7.value==="1")ds.push("第 7 音");
      return "長音階の"+ds.join("・")+"を半音下げた並び"+(k==="110"?"（3 節で扱う）":k==="100"?"（4 節で扱う）":"");
    }
    function draw(){
      var c=cur(), s=8, x0=staffStart(s)+6, items=[], hl={};
      c.sc.forEach(function(n,i){
        var on=hot.indexOf(i)>=0;
        items.push({x:x0+i*34,notes:[n],fill:on?V("signal"):c.low[i]?V("purple"):V("ink")});
        hl[c.ms[i]]={c:on?"signal":c.low[i]?"purple":"blue",label:nname(n,false),strong:on||c.low[i]};
      });
      var st=staff({s:s,w:x0+7*34+22,clef:"treble",items:items}), k=kbd(c.ms[0],c.ms[0]+12,{ww:22,wh:78,hl:hl,names:null});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.6rem 1.2rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>'+
        '<div style="margin-top:.55rem">'+_w06_strip(c.st,"隣どうしの間")+'</div>';
      ro.innerHTML='<b>'+nameOf()+'</b>: '+c.sc.map(function(n){return nname(n,false);}).join(" ")+
        '<br>主音から: '+c.sc.slice(1,7).map(function(n){var r=_w06_iv(c.sc[0],n);return '<span style="color:'+V(_w06_QC[r.q]||"ink")+'">'+r.q+' '+r.d+' 度</span>';}).join(" ・ ");
    }
    _w06_btn(bar,"▶ 上がって下がる",function(){var m=cur().ms,seq=m.concat(m.slice(0,7).reverse());var e=_w06_run(seq,0.32);e.forEach(function(x,i){x.k=i<8?i:14-i;});return e;},
      function(e,i){hot=[e[i].k];draw();},function(){hot=[];draw();});
    _w06_btn(bar,"▶ 主音と第 3 音を同時に",function(){var m=cur().ms;return [{t:0,d:2.2,m:[m[0],m[2]]}];},function(){hot=[0,2];draw();},function(){hot=[];draw();});
    [sT,s3,s6,s7].forEach(function(x){x.addEventListener("change",function(){hot=[];draw();});});
    draw();
  };

  /* ============ 06. w06_scales — 主音と種類を選んで、上行・下行を表示して鳴らす ============ */
  REG.w06_scales=function(el){
    head(el,"Scales","主音と種類を選ぶと、上行と下行の音階が表示され、鳴る");
    var TON=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
    var row=ctrls(el), sT=select(row,"主音",TON.map(function(t){return nname(t+"4",false);})), sK=select(row,"種類",_w06_TYPES.map(function(x){return x[0];}));
    sT.value="9"; sK.value="2";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el), dir="up", hot=-1;
    function cur(){
      var t=TON[+sT.value], oc=(t[0]==="A"||t[0]==="B")?3:4, tonic=t+oc, k=+sK.value;
      var up=spellScale(tonic,_w06_TYPES[k][1],8), maj=spellScale(tonic,MAJOR,8);
      var dn=(k===3?spellScale(tonic,NAT_MINOR,8):up).slice().reverse();
      return {k:k,up:up,dn:dn,maj:maj,ms:{up:up.map(function(n){return parse(n).midi;}),dn:dn.map(function(n){return parse(n).midi;})}};
    }
    /* 同じ主音の長音階の、同じ文字の音より半音低いか */
    function lowOf(c,n){var p=parse(n),q=null;c.maj.forEach(function(x){if(parse(x).letter===p.letter)q=parse(x);});return ((q.midi-p.midi)%12+12)%12===1;}
    function stf(c,which,title){
      var s=8, x0=staffStart(s)+6, sc=c[which], items=[];
      sc.forEach(function(n,i){
        var on=dir===which&&hot===i, deg=which==="up"?(i%7)+1:(i===0?1:8-i);
        items.push({x:x0+i*32,notes:[n],fill:on?V("signal"):lowOf(c,n)?V("purple"):V("ink"),label:String(deg),lcol:V("muted"),lsz:10,lbold:false,ldy:3.8*s});
      });
      var st=staff({s:s,w:x0+7*32+20,clef:"treble",items:items});
      return '<div><div style="font-size:.8rem;font-weight:700;margin:0 0 .1rem .2rem">'+title+'</div>'+svgWrap(st.w,st.h,st.svg)+'</div>';
    }
    function draw(){
      var c=cur(), ms=c.ms[dir], sc=c[dir], hl={};
      sc.forEach(function(n,i){hl[ms[i]]={c:(hot===i)?"signal":lowOf(c,n)?"purple":"blue",label:nname(n,false),strong:hot===i||lowOf(c,n)};});
      var lo=Math.min.apply(null,ms), klo=lo-(lo%12), k=kbd(klo,klo+23,{ww:17,wh:66,hl:hl,names:null});
      var gu=_w06_gaps(c.up), gd=_w06_gaps(c.dn);
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;justify-content:center">'+stf(c,"up","上行")+stf(c,"dn","下行")+'</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;justify-content:center;align-items:flex-end;margin-top:.4rem">'+
        '<div>'+_w06_strip(gu,"上行の隣どうしの間（主音から）")+_w06_strip(gd,"下行の隣どうしの間（上の主音から）")+'</div>'+
        '<div><div style="font-size:.74rem;color:var(--muted);text-align:center">鍵盤: '+(dir==="up"?"上行":"下行")+'の音</div>'+svgWrap(k.w,k.h,k.svg)+'</div></div>';
      var nm=nname(c.up[0],false)+" "+_w06_TYPES[c.k][0], u7=c.up[6], d7=c.dn[1];
      var lead=function(n){return (parse(c.up[7]).midi-parse(n).midi)===1;};
      var aug=[];gu.forEach(function(g,i){if(g===3)aug.push(nname(c.up[i],false)+" → "+nname(c.up[i+1],false));});
      ro.innerHTML='<b>'+nm+'</b> ／ 上行: '+c.up.map(function(n){return nname(n,false);}).join(" ")+' ／ 下行: '+c.dn.map(function(n){return nname(n,false);}).join(" ")+
        '<br>主音から（上行）: '+c.up.slice(1,7).map(function(n){var r=_w06_iv(c.up[0],n);return '<span style="color:'+V(_w06_QC[r.q]||"ink")+'">'+r.q+' '+r.d+' 度</span>';}).join(" ・ ")+
        '<br>上行の第 7 音 '+nname(u7,false)+' は主音の'+(lead(u7)?'半音下 → <b style="color:var(--signal)">導音</b>':'全音下 → 導音ではない')+
        (c.k===3?' ／ 下行の第 7 音 '+nname(d7,false)+' は主音の全音下':'')+
        (aug.length?' ／ <b style="color:var(--alias)">増 2 度</b>: '+aug.join("、"):' ／ 増 2 度なし');
    }
    function evs(w){return function(){dir=w;var e=_w06_run(cur().ms[w],0.34);return e;};}
    function step(w){return function(e,i){dir=w;hot=e[i].k;draw();};}
    _w06_btn(bar,"▶ 上行",evs("up"),step("up"),function(){hot=-1;draw();});
    _w06_btn(bar,"▶ 下行",evs("dn"),step("dn"),function(){hot=-1;draw();});
    [sT,sK].forEach(function(x){x.addEventListener("change",function(){hot=-1;dir="up";draw();});});
    draw();
  };

  /* ============ 06. w06_pairs — 同じ 7 音を使う組と、同じ主音の組 ============ */
  REG.w06_pairs=function(el){
    head(el,"Pairs","長音階の主音を選ぶと、同じ 7 音の自然短音階と、同じ主音の自然短音階が並ぶ");
    var MT=["C","G","D","A","E","B","F#","C#","F","Bb","Eb","Ab"], OCT={C:4,G:3,D:4,A:3,E:4,B:3,"F#":4,"C#":4,F:4,Bb:3,Eb:4,Ab:3};
    var row=ctrls(el), sT=select(row,"長音階の主音",MT.map(function(t){return nname(t+"4",false);}));
    var bar=mk("div","pbtns");el.appendChild(bar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el), hot={r:-1,i:-1};
    function cur(){
      var t=MT[+sT.value], X=t+OCT[t], maj=spellScale(X,MAJOR,8), xm=parse(X).midi;
      var rp=parse(maj[5]), relT=rp.letter+({0:"","1":"#","-1":"b"}[rp.acc])+(rp.oct-1);   /* 第 6 音の 1 オクターブ下 = 短 3 度下 */
      var rel=spellScale(relT,NAT_MINOR,8), par=spellScale(X,NAT_MINOR,8);
      return {X:X,rows:[{nm:nname(relT,false)+" 自然短音階",sc:rel,col:"purple"},{nm:nname(X,false)+" 長音階",sc:maj,col:"blue"},{nm:nname(X,false)+" 自然短音階",sc:par,col:"purple"}],xm:xm};
    }
    function rowHtml(c,r){
      var R=c.rows[r], base=c.rows[1].sc, hl={};
      R.sc.slice(0,7).forEach(function(n,i){
        var pc=parse(n).midi%12, diff=r===2&&pc!==parse(base[i]).midi%12, on=hot.r===r&&(hot.i%7)===i;
        hl[60+pc]={c:on?"signal":diff?"signal":R.col,label:nname(n,false),strong:on||i===0||diff};
      });
      var k=kbd(60,71,{ww:26,wh:70,hl:hl,names:null});
      return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:.3rem 1rem;justify-content:center"><div style="min-width:10.5rem"><b style="color:var(--'+R.col+')">'+R.nm+'</b><br><span style="font-family:var(--mono);font-size:.82rem">'+
        R.sc.slice(0,7).map(function(n,i){var d=r===2&&parse(n).midi%12!==parse(base[i]).midi%12;return d?'<b style="color:var(--signal)">'+nname(n,false)+'</b>':nname(n,false);}).join(" ")+'</span>'+
        '<br><span style="font-size:.74rem;color:var(--muted)">濃い色の鍵: 主音'+(r===2?'・違う音':'')+'</span></div>'+svgWrap(k.w,k.h,k.svg)+'</div>';
    }
    function rel(t,c){return '<div style="text-align:center;font-size:.8rem;margin:.35rem 0;color:var(--'+c+');font-weight:700">↕ '+t+'</div>';}
    function draw(){
      var c=cur();
      view.innerHTML=rowHtml(c,0)+rel("同じ 7 つの音を使う（主音が違う）","green")+rowHtml(c,1)+rel("主音が同じ（3 つの音が違う）","signal")+rowHtml(c,2);
      var R=c.rows, base=R[1].sc, par=R[2].sc, ch=[];
      [2,5,6].forEach(function(i){ch.push("第 "+(i+1)+" 音 "+nname(base[i],false)+" → "+nname(par[i],false));});
      ro.innerHTML='<b>同じ 7 つの音</b>: '+R[1].nm+'と'+R[0].nm+'（'+base.slice(0,7).map(function(n){return nname(n,false);}).join(" ")+'）。'+
        nname(R[0].sc[0],false)+' は '+nname(base[0],false)+' の短 3 度下にあり、'+R[0].nm+'の第 3 音が '+nname(base[0],false)+' である'+
        '<br><b>同じ主音</b>: '+R[1].nm+'と'+R[2].nm+'。違う音は '+ch.join("、");
      btns.forEach(function(b){b.relabel();});
    }
    var btns=[0,1,2].map(function(r){
      return _w06_btn(bar,function(){return "▶ "+cur().rows[r].nm;},function(){return _w06_run(cur().rows[r].sc.map(function(n){return parse(n).midi;}),0.32);},
        function(e,i){hot={r:r,i:e[i].k};draw();},function(){hot={r:-1,i:-1};draw();});
    });
    sT.addEventListener("change",function(){hot={r:-1,i:-1};draw();});
    draw();
  };
