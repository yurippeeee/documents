/* 音楽理論 — 章内インタラクティブ部品（音は Web Audio でその場で合成する） */
(function(){
  "use strict";
  var root=document.documentElement, TAU=Math.PI*2;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var draws=[];
  function redrawAll(){draws.forEach(function(f){try{f();}catch(e){}});}
  window.addEventListener("themechange",function(){requestAnimationFrame(redrawAll);});
  window.addEventListener("resize",function(){requestAnimationFrame(redrawAll);});
  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+k+'</span><span class="t">'+t+'</span>'));}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function slider(row,label,min,max,val,step){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+' <b class="val"></b></label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+step+'">';
    row.appendChild(c);return {input:c.querySelector("input"),val:c.querySelector(".val")};}
  function textin(row,label,val,w){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><input type="text" value="'+val+'" style="font-family:var(--mono);font-size:.85rem;padding:.35rem .5rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:'+(w||"100%")+'">';
    row.appendChild(c);return c.querySelector("input");}
  function button(row,t){var b=mk("button","btn",t);b.setAttribute("aria-pressed","false");row.appendChild(b);return b;}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function panel(el,h){var d=mk("div","wscreen");d.style.padding=".8rem";d.style.overflowX="auto";
    d.style.fontFamily="var(--mono)";d.style.fontSize=".8rem";d.style.lineHeight="1.6";
    if(h)d.style.minHeight=h+"px";el.appendChild(d);return d;}
  function screen(el,h){var s=mk("div","wscreen");s.style.height=h+"px";var c=mk("canvas");s.appendChild(c);el.appendChild(s);return c;}
  function cctx(cv){var ctx=cv.getContext("2d");function fit(){var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));
    cv.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height};}
    return {ctx:ctx,fit:fit};}
  function reg(cv,draw){draws.push(draw);if(cv)new ResizeObserver(draw).observe(cv);}
  function lab(ctx,t,x,y,c,a){ctx.fillStyle=c;ctx.font="11px "+C("--mono");ctx.textAlign=a||"left";ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  /* ---- 追加ヘルパー（グラフ・表） ---- */
  function select(row,label,opts){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:100%">'+
      opts.map(function(o,i){return '<option value="'+i+'">'+o+'</option>';}).join("")+'</select>';
    row.appendChild(c);return c.querySelector("select");}
  function checkbox(row,label,on){var c=mk("div","ctrl");
    c.innerHTML='<label style="cursor:pointer;justify-content:flex-start;align-items:center;gap:.45rem;'+
      'line-height:1.4"><input type="checkbox"'+(on?" checked":"")+
      ' style="flex:none;margin:0;accent-color:var(--signal)"><span>'+label+'</span></label>';
    row.appendChild(c);return c.querySelector("input");}
  function tbl(headers,rows,align){
    var h='<table style="border-collapse:collapse;width:100%"><tr>'+headers.map(function(t,i){
      return '<th style="padding:.25rem .7rem;text-align:'+((align&&align[i])||"left")+
        ';color:var(--muted);font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap">'+t+'</th>';}).join("")+'</tr>';
    rows.forEach(function(r){
      h+='<tr>'+r.map(function(v,i){return '<td style="padding:.22rem .7rem;text-align:'+
        ((align&&align[i])||"left")+';vertical-align:top">'+v+'</td>';}).join("")+'</tr>';});
    return h+'</table>';
  }
  function chart(cc,x0,x1,y0,y1,pad){
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
    var p={l:44,r:14,t:16,b:28};
    if(pad)for(var k in pad)p[k]=pad[k];
    ctx.clearRect(0,0,w,h);
    return {ctx:ctx,w:w,h:h,p:p,
      X:function(x){return p.l+(x-x0)/(x1-x0)*(w-p.l-p.r);},
      Y:function(y){return h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);},x0:x0,x1:x1,y0:y0,y1:y1};
  }
  function grid(c,ny){var ctx=c.ctx;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
    for(var i=0;i<=ny;i++){var yy=c.p.t+i/ny*(c.h-c.p.t-c.p.b);
      ctx.beginPath();ctx.moveTo(c.p.l,yy);ctx.lineTo(c.w-c.p.r,yy);ctx.stroke();}}
  function axis(c){var ctx=c.ctx;ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(c.p.l,c.h-c.p.b);ctx.lineTo(c.w-c.p.r,c.h-c.p.b);ctx.stroke();}
  function dot(c,x,y,r,col,st){var ctx=c.ctx;ctx.beginPath();ctx.arc(c.X(x),c.Y(y),r,0,TAU);
    if(st){ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}
  function rrect(ctx,x,y,w,h,r){ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  function f(x,d){return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);}
  function pline(c,pts,col,lw,dash){var ctx=c.ctx;ctx.strokeStyle=col;ctx.lineWidth=lw||2.2;
    if(dash)ctx.setLineDash(dash);ctx.beginPath();
    pts.forEach(function(q,i){i?ctx.lineTo(c.X(q[0]),c.Y(q[1])):ctx.moveTo(c.X(q[0]),c.Y(q[1]));});
    ctx.stroke();ctx.setLineDash([]);}
  var GLYPH={"gclef":{"d":"M434 2Q464 -103 464 -170Q464 -223 427 -257Q390 -291 337 -291Q287 -291 250 -261.5Q213 -232 213 -190Q213 -160 233.5 -133.5Q254 -107 283.5 -107Q313 -107 331.5 -128.5Q350 -150 350 -178Q350 -240 280 -240Q298 -268 338 -268Q353 -268 368.5 -263.5Q384 -259 401 -248Q418 -237 428.5 -213.5Q439 -190 439 -157Q439 -136 411 -6Q389 -12 356 -12Q259 -12 189.5 60Q120 132 120 232Q120 267 131.5 303Q143 339 157.5 366.5Q172 394 200.5 428.5Q229 463 248.5 483.5Q268 504 303 539Q280 621 280 689Q280 779 313 839.5Q346 900 379 900Q389 900 401.5 887Q414 874 426 851Q438 828 446.5 790.5Q455 753 455 710Q455 551 342 447L368 329Q384 332 397 332Q458 332 500 282.5Q542 233 542 162Q542 44 434 2ZM426 746Q426 801 394 801Q358 801 333 748Q308 695 308 630Q308 588 321 557Q359 580 392.5 639.5Q426 699 426 746ZM498 128Q498 183 466 216Q434 249 383 249L428 23Q498 52 498 128ZM407 17 361 247Q334 241 311.5 214Q289 187 289 158Q289 143 295 128.5Q301 114 309.5 104Q318 94 327 86Q336 78 342 74.5Q348 71 348 71L340 66Q307 75 277.5 106Q248 137 248 184Q248 231 277.5 270.5Q307 310 343 323L325 430Q168 299 168 177Q168 104 223 55Q278 6 348 6Q365 6 407 17Z","bbox":[120,-291,542,900],"adv":591},"fclef":{"d":"M564 704Q582 704 594.5 691Q607 678 607 661Q607 644 593 631Q579 618 563 618Q521 618 521 663Q521 681 534 692.5Q547 704 564 704ZM607 469Q607 450 594 437Q581 424 564 424Q521 424 521 469Q521 485 533.5 498Q546 511 564 511Q582 511 594.5 497Q607 483 607 469ZM285 757Q366 757 421 701.5Q476 646 476 569Q476 531 465.5 495Q455 459 432 426.5Q409 394 386 367Q363 340 326 313Q289 286 264 267.5Q239 249 196.5 226Q154 203 135.5 193.5Q117 184 80 166L75 182Q76 183 102 200Q128 217 144 227.5Q160 238 191.5 263Q223 288 244 309.5Q265 331 291.5 363.5Q318 396 334 427Q350 458 361.5 498Q373 538 373 578Q373 735 262 735Q225 735 199 725.5Q173 716 161.5 702Q150 688 145 677.5Q140 667 140 659Q140 644 160 644Q168 644 179 647.5Q190 651 194 651Q221 651 239 634Q257 617 257 592Q257 563 235 544Q213 525 183 525Q144 525 119 548Q94 571 94 607Q94 673 150.5 715Q207 757 285 757Z","bbox":[75,166,607.0,757],"adv":643},"sharp":{"d":"M365 24 319 6V-193L275 -209V-10L138 -63V-262L94 -279V-80L50 -96V0L94 17V262L50 245V341L94 358V589L138 606V376L275 429V659L319 675V446L365 464V366L319 348V104L365 122ZM275 88V332L138 279V34Z","bbox":[50,-279,365,675],"adv":402},"flat":{"d":"M222 441Q275 441 302 408Q329 375 329 317Q329 273 299.5 234Q270 195 192.5 117Q115 39 56 -34V783L99 802V402Q148 441 222 441ZM232 308Q232 373 183 373Q159 373 134.5 358.5Q110 344 99 319V87Q159 155 195.5 214.5Q232 274 232 308Z","bbox":[56,-34,329,802],"adv":371},"natural":{"d":"M324 -273 280 -290V3L56 -87V656L99 675V344L324 433ZM280 93V328L99 254V19Z","bbox":[56,-290,324,675],"adv":377},"qrest":{"d":"M55 208Q55 242 77.5 260Q100 278 130 278Q150 278 178 267L65 415Q145 487 145 544Q145 589 91 658H136L264 502Q181 404 181 356Q181 310 259 217L243 194Q203 217 176 217Q140 217 140 173Q140 129 179 84L165 62Q55 144 55 208Z","bbox":[55,62,264,658],"adv":306},"erest":{"d":"M136 443Q152 443 175 466.5Q198 490 213 511H234L138 166H101L173 426Q126 402 97 402Q68 402 43.5 422.5Q19 443 19 473Q19 495 35 513.5Q51 532 79 532Q106 532 122 513.5Q138 495 138 473Q138 458 131 445Q135 443 136 443Z","bbox":[19,166,234,532],"adv":266}};

  /* ================= 音名と高さ ================= */
  var LETTERS="CDEFGAB", PCL=[0,2,4,5,7,9,11];
  var NS=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
  var NF=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
  var DOREMI={C:"ド",D:"レ",E:"ミ",F:"ファ",G:"ソ",A:"ラ",B:"シ"};
  var BLACK=[0,1,0,1,0,0,1,0,1,0,1,0];
  function parse(n){
    if(typeof n==="number"){var pc=n%12, oc=Math.floor(n/12)-1, li=[0,0,1,1,2,3,3,4,4,5,5,6][pc];
      return {letter:LETTERS[li],li:li,acc:BLACK[pc]?1:0,oct:oc,midi:n,dia:li+7*oc};}
    var m=/^([A-Ga-g])([#♯b♭x]*)(-?\d+)$/.exec(String(n).trim()); if(!m)throw new Error("bad note "+n);
    var L=m[1].toUpperCase(), a=0, s=m[2]||"";
    for(var i=0;i<s.length;i++){var c=s[i]; if(c==="#"||c==="♯")a++; else if(c==="b"||c==="♭")a--; else if(c==="x")a+=2;}
    var li=LETTERS.indexOf(L), oc=+m[3];
    return {letter:L,li:li,acc:a,oct:oc,midi:12*(oc+1)+PCL[li]+a,dia:li+7*oc};
  }
  function accs(a){return a===1?"♯":a===-1?"♭":a===2?"𝄪":a===-2?"♭♭":"";}
  function nname(n,oct){var p=parse(n);return p.letter+accs(p.acc)+(oct===false?"":p.oct);}
  function mfreq(m){return 440*Math.pow(2,(m-69)/12);}
  /* ---------- 調・音階・和音の名前 ---------- */
  var KEY_SIGS={"C":0,"G":1,"D":2,"A":3,"E":4,"B":5,"F#":6,"C#":7,"F":-1,"Bb":-2,"Eb":-3,"Ab":-4,"Db":-5,"Gb":-6,"Cb":-7,
    "Am":0,"Em":1,"Bm":2,"F#m":3,"C#m":4,"G#m":5,"D#m":6,"A#m":7,"Dm":-1,"Gm":-2,"Cm":-3,"Fm":-4,"Bbm":-5,"Ebm":-6,"Abm":-7};
  var MAJOR=[2,2,1,2,2,2,1], NAT_MINOR=[2,1,2,2,1,2,2], HARM_MINOR=[2,1,2,2,1,3,1], MEL_MINOR=[2,1,2,2,2,2,1], MAJ_CUM=[0,2,4,5,7,9,11];
  function nacc(s){return String(s).replace(/♯/g,"#").replace(/♭/g,"b");}
  function keyCount(k){return typeof k==="number"?k:KEY_SIGS[nacc(k)];}
  function keyAcc(k){var n=keyCount(k)||0, a={C:0,D:0,E:0,F:0,G:0,A:0,B:0}, ord=n>0?"FCGDAEB":"BEADGCF";
    for(var i=0;i<Math.abs(n);i++)a[ord[i]]=n>0?1:-1; return a;}
  /* 主音（例 "D4"）から全音・半音の並び steps で音階を作る。7 つの文字を 1 回ずつ使って綴る */
  function spellScale(tonic,steps,n){
    steps=steps||MAJOR; var p=parse(tonic), out=[tonic], pc=p.midi; n=n||steps.length+1;
    for(var i=1;i<n;i++){pc+=steps[(i-1)%steps.length]; var dia=p.dia+i, li=((dia%7)+7)%7, oc=Math.floor(dia/7), a=pc-(12*(oc+1)+PCL[li]);
      out.push(LETTERS[li]+({0:"",1:"#","-1":"b",2:"x","-2":"bb"}[a])+oc);}
    return out;
  }
  /* コードネーム → {root, rootPc, ivs:[根音からの半音数], bass, bassPc, suffix} */
  function chordParse(sym){
    var m=/^([A-G])([#♯b♭]?)(.*)$/.exec(String(sym).trim()); if(!m)throw new Error("bad chord "+sym);
    var L=m[1], a=nacc(m[2]), rest=m[3], bass=null, mb=/^(.*)\/([A-G][#♯b♭]?)$/.exec(rest);
    if(mb){rest=mb[1]; bass=nacc(mb[2]);}
    var suffix=rest, r=nacc(rest).replace(/△/g,"M").replace(/Δ/g,"M").replace(/maj/g,"M").replace(/ø/g,"m7(b5)").replace(/°7/g,"dim7").replace(/°/g,"dim").replace(/-5/g,"b5").replace(/m7b5/g,"m7(b5)");
    if(r[0]==="+")r="aug"+r.slice(1);
    var iv;
    if(/^mM7/.test(r)){iv=[0,3,7,11];r=r.slice(3);} else if(/^m\(M7\)/.test(r)){iv=[0,3,7,11];r=r.slice(5);}
    else if(/^m7\(b5\)/.test(r)){iv=[0,3,6,10];r=r.slice(6);} else if(/^dim7/.test(r)){iv=[0,3,6,9];r=r.slice(4);}
    else if(/^dim/.test(r)){iv=[0,3,6];r=r.slice(3);} else if(/^aug/.test(r)){iv=[0,4,8];r=r.slice(3);}
    else if(/^m/.test(r)){iv=[0,3,7];r=r.slice(1);} else iv=[0,4,7];
    (r.match(/M13|M9|M7|13|11|9|7|6|sus4|sus2|add9|add2|\([^)]*\)/g)||[]).forEach(function(t){
      if(t==="M7"||t==="M9"||t==="M13"){iv.push(11);if(t!=="M7")iv.push(14);if(t==="M13")iv.push(21);}
      else if(t==="7")iv.push(10); else if(t==="9")iv.push(10,14); else if(t==="11")iv.push(10,14,17); else if(t==="13")iv.push(10,14,21);
      else if(t==="6")iv.push(9); else if(t==="add9"||t==="add2")iv.push(14);
      else if(t==="sus4")iv=iv.map(function(v){return v===3||v===4?5:v;}); else if(t==="sus2")iv=iv.map(function(v){return v===3||v===4?2:v;});
      else if(t[0]==="("){t.slice(1,-1).split(",").forEach(function(x){x=x.trim();
        var tab={"9":14,"b9":13,"#9":15,"11":17,"#11":18,"13":21,"b13":20};
        if(tab[x]!=null)iv.push(tab[x]); else if(x==="b5")iv=iv.map(function(v){return v===7?6:v;}); else if(x==="#5")iv=iv.map(function(v){return v===7?8:v;});});}
    });
    var u=[]; iv.forEach(function(v){if(u.indexOf(v)<0)u.push(v);}); u.sort(function(p,q){return p-q;});
    var rp=((PCL[LETTERS.indexOf(L)]+({"":0,"#":1,"b":-1}[a]))%12+12)%12, bp=null;
    if(bass)bp=((PCL[LETTERS.indexOf(bass[0])]+({"":0,"#":1,"b":-1}[bass.slice(1)]))%12+12)%12;
    var sh=function(s){return s.replace(/#/g,"♯").replace(/b/g,"♭");};
    return {root:L+sh(a),rootLetter:L,rootPc:rp,ivs:u,bass:bass?sh(bass):null,bassPc:bp,suffix:sh(suffix)};
  }
  /* 密集配置: 根音を lo（MIDI）以上の最も低い位置に置いて上へ積む */
  function chordMidis(sym,lo){lo=lo==null?48:lo; var c=chordParse(sym), r=lo+((c.rootPc-lo)%12+12)%12, ms=c.ivs.map(function(v){return r+v;});
    if(c.bassPc!=null&&c.bassPc!==c.rootPc)ms.unshift(r-12+((c.bassPc-r)%12+12)%12); return ms;}
  /* コードネームを、調の主音から見たローマ数字（ディグリーネーム）にする。例 roman("Am7","C") → "VIm7" */
  function roman(sym,key){
    var k=nacc(key), minor=/m$/.test(k), tk=minor?k.slice(0,-1):k, tl=tk[0], tpc=((PCL[LETTERS.indexOf(tl)]+({"":0,"#":1,"b":-1}[tk.slice(1)]))%12+12)%12, c=chordParse(sym);
    function num(letter,pc){var d=((LETTERS.indexOf(letter)-LETTERS.indexOf(tl))%7+7)%7, e=(tpc+MAJ_CUM[d])%12, df=((pc-e+6)%12+12)%12-6;
      var ac_={0:"","-1":"♭",1:"♯","-2":"♭♭",2:"𝄪"}[df]; return (ac_==null?"?":ac_)+["I","II","III","IV","V","VI","VII"][d];}
    return num(c.rootLetter,c.rootPc)+c.suffix+(c.bass?"/"+num(c.bass[0],c.bassPc):"");
  }
  /* 前の和音から各声部ができるだけ動かない配置を選ぶ（最低音は lo〜hi の範囲） */
  function voiceLead(sym,prev,lo,hi){
    lo=lo==null?52:lo; hi=hi==null?67:hi; var c=chordParse(sym), pcs=c.ivs.map(function(v){return (c.rootPc+v)%12;});
    if(pcs.length>4)pcs=pcs.filter(function(p,i){return i!==2||pcs.length<=4;});   /* 5 音以上なら 5 度を省く */
    var best=null, bestCost=1e9;
    for(var inv=0;inv<pcs.length;inv++){
      var order=pcs.slice(inv).concat(pcs.slice(0,inv));
      for(var base=lo;base<=hi;base++){
        if(base%12!==order[0])continue;
        var v=[base]; for(var i=1;i<order.length;i++){var x=v[i-1]+((order[i]-v[i-1])%12+12)%12; if(x===v[i-1])x+=12; v.push(x);}
        var cost=prev?costOf(prev,v):Math.abs(base-(lo+hi)/2)+(inv?3:0);
        if(cost<bestCost){bestCost=cost;best=v;}
      }
    }
    return best;
    function costOf(p,v){var s=0; v.forEach(function(x){var d=1e9; p.forEach(function(y){d=Math.min(d,Math.abs(x-y));}); s+=d;});
      p.forEach(function(y){var d=1e9; v.forEach(function(x){d=Math.min(d,Math.abs(x-y));}); s+=d;}); return s;}
  }

  /* ================= オーディオエンジン =================
     ・piano: 倍音ごとに減衰の速さを変えて足し合わせた音（音高ごとに 1 回だけ計算して使い回す）
     ・sine: 純音（倍音なし）  ・organ: 減衰しない数本の倍音
     すべての音は 1 つのマスター音量とコンプレッサーを通して出す。 */
  var AC=null, OUT=null, ACTIVE=[], TIMERS=[], PBUF={}, OWAVE=null;
  function ac(){
    if(!AC){
      AC=new (window.AudioContext||window.webkitAudioContext)();
      var comp=AC.createDynamicsCompressor();
      comp.threshold.value=-16; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.25;
      OUT=AC.createGain(); OUT.gain.value=0.9; OUT.connect(comp); comp.connect(AC.destination);
    }
    if(AC.state==="suspended")AC.resume();
    return AC;
  }
  function pianoData(m,sr){
    var f0=mfreq(m), dur=Math.max(1.4,Math.min(4.2,3.0-(m-60)*0.03));
    var N=Math.round(sr*dur), d=new Float32Array(N);
    var B=0.00025*Math.pow(2,(m-60)/20);                         // 弦の硬さによる倍音のずれ
    var t1=Math.max(0.3,Math.min(3.2,1.6*Math.pow(2,-(m-60)/16))); // 基音の減衰の時定数 [s]
    for(var h=1;h<=28;h++){
      var fh=h*f0*Math.sqrt(1+B*h*h); if(fh>Math.min(9000,sr*0.45))break;
      var amp=Math.pow(h,-1.2)*Math.exp(-fh/4200)*(h===2?1.1:1), tau=t1/(1+0.5*(h-1));
      for(var k=0;k<2;k++){                                        // わずかにずらした 2 本の弦
        var w=2*Math.PI*fh*(k?1.0006:0.9995)/sr, c=Math.cos(w), s=Math.sin(w);
        var ph=Math.random()*6.283, re=Math.cos(ph), im=Math.sin(ph), a=0.5*amp, dec=Math.exp(-1/(tau*sr));
        for(var n=0;n<N&&a>2e-5;n++){d[n]+=a*im; var r2=re*c-im*s; im=re*s+im*c; re=r2; a*=dec;}
      }
    }
    var nl=Math.round(sr*0.01), lp=0;                              // 打鍵のごく短い雑音
    for(var n2=0;n2<nl;n2++){lp+=0.3*((Math.random()*2-1)-lp); d[n2]+=lp*0.06*(1-n2/nl);}
    var at=Math.round(sr*0.003); for(n2=0;n2<at;n2++)d[n2]*=n2/at;
    var mx=0; for(n2=0;n2<N;n2++){var v=d[n2]<0?-d[n2]:d[n2]; if(v>mx)mx=v;}
    var g=0.33/(mx||1); for(n2=0;n2<N;n2++)d[n2]*=g;
    var rl=Math.round(sr*0.25); for(n2=0;n2<rl;n2++)d[N-1-n2]*=n2/rl;  // 終わりを滑らかに
    return d;
  }
  function pianoBuf(m){
    var ctx=ac(), key=m+"@"+ctx.sampleRate;
    if(!PBUF[key]){var d=pianoData(m,ctx.sampleRate), b=ctx.createBuffer(1,d.length,ctx.sampleRate); b.getChannelData(0).set(d); PBUF[key]=b;}
    return PBUF[key];
  }
  function track(v){ACTIVE.push(v); v.src.onended=function(){var i=ACTIVE.indexOf(v); if(i>=0)ACTIVE.splice(i,1);}; return v;}
  function playBuf(buf,t,dur,vel){
    var ctx=ac(), src=ctx.createBufferSource(), g=ctx.createGain();
    src.buffer=buf; src.connect(g); g.connect(OUT);
    var end=t+Math.min(dur,buf.duration);
    g.gain.setValueAtTime(vel,t); g.gain.setValueAtTime(vel,end); g.gain.linearRampToValueAtTime(0.0001,end+0.15);
    src.start(t); src.stop(end+0.2);
    return track({src:src,g:g});
  }
  function organWave(ctx){
    if(!OWAVE){var re=new Float32Array([0,0,0,0,0,0,0,0,0]), im=new Float32Array([0,1,0.55,0.32,0.22,0.12,0.08,0.05,0.03]);
      OWAVE=ctx.createPeriodicWave(re,im);}
    return OWAVE;
  }
  function tone(fr,t,dur,o){
    o=o||{}; var ctx=ac(), osc=ctx.createOscillator(), g=ctx.createGain();
    if(o.organ)osc.setPeriodicWave(organWave(ctx)); else osc.type=o.type||"sine";
    osc.frequency.setValueAtTime(fr,t); osc.connect(g); g.connect(OUT);
    var a=o.gain==null?0.22:o.gain, at=o.attack||0.025, rl=o.release||0.09;
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(a,t+at);
    g.gain.setValueAtTime(a,t+dur); g.gain.linearRampToValueAtTime(0.0001,t+dur+rl);
    osc.start(t); osc.stop(t+dur+rl+0.03);
    return track({src:osc,g:g});
  }
  /* 1 音を鳴らす。m は MIDI 番号、t は AudioContext の時刻 */
  function note(m,t,dur,timbre,vel,fr){
    vel=vel==null?1:vel; if(m<0)return drum(m,t,vel); var F=fr||mfreq(m);
    if(timbre==="sine")return tone(F,t,dur,{gain:0.2*vel});
    if(timbre==="organ")return tone(F,t,dur,{organ:true,gain:0.14*vel});
    var v=playBuf(pianoBuf(m),t,dur,0.95*vel); if(fr)v.src.playbackRate.value=fr/mfreq(m); return v;
  }
  var HOLDS=[];   /* 鳴らし続けるデモの「止める」関数（ほかの音を鳴らすときに止める） */
  function hold(fn){HOLDS.push(fn);}
  function stopAll(){
    TIMERS.forEach(clearTimeout); TIMERS.length=0;
    HOLDS.splice(0).forEach(function(fn){try{fn();}catch(e){}});
    if(!AC)return;
    ACTIVE.slice().forEach(function(v){try{v.g.gain.cancelScheduledValues(AC.currentTime);
      v.g.gain.setTargetAtTime(0.0001,AC.currentTime,0.015); v.src.stop(AC.currentTime+0.08);}catch(e){}});
    ACTIVE.length=0;
    document.querySelectorAll(".pb[aria-pressed=true]").forEach(function(b){b.setAttribute("aria-pressed","false");});
  }
  /* 音の列を鳴らす。evs = [{t: 開始[s], d: 長さ[s], m: [MIDI...]}]。onStep(i) で見た目を合わせる */
  function playEvents(evs,o){
    o=o||{}; stopAll(); var ctx=ac(), t0=ctx.currentTime+0.08, end=0;
    evs.forEach(function(e,i){
      var vel=(o.vel||1)*(e.v==null?1:e.v)/Math.sqrt(Math.max(1,e.m.length));
      e.m.forEach(function(m,k){note(m,t0+e.t,e.d,o.timbre,vel,e.f&&e.f[k]);});
      end=Math.max(end,e.t+e.d);
      if(o.onStep)TIMERS.push(setTimeout(function(){o.onStep(i);},Math.max(0,(t0+e.t-ctx.currentTime)*1000)));
    });
    if(o.onEnd)TIMERS.push(setTimeout(o.onEnd,(t0+end-ctx.currentTime)*1000+120));
    return end;
  }
  /* "C4 E4:2 [C4 E4 G4]:4 r:1" を拍単位の列にする（: の後ろは拍数、省略時 1） */
  function num(s){var p=s.split("/");return p.length>1?(+p[0])/(+p[1]):+s;}
  function isHz(x){return /Hz$/i.test(x);}
  function tokFreq(x){return isHz(x)?parseFloat(x):mfreq(parse(x).midi);}
  function tokMidi(x){if(x[0]==="%")return PERC[x.slice(1)]||-4; return isHz(x)?Math.round(69+12*Math.log(parseFloat(x)/440)/Math.LN2):parse(x).midi;}
  function parseSeq(s){
    var out=[], i=0, t=0; s=String(s);
    while(i<s.length){
      var c=s[i]; if(/\s/.test(c)){i++;continue;}
      var ns, j, rest;
      if(c==="["){j=s.indexOf("]",i); ns=s.slice(i+1,j).trim().split(/\s+/); i=j+1;}
      else{j=i; while(j<s.length&&!/[\s:]/.test(s[j]))j++; ns=[s.slice(i,j)]; i=j;}
      rest=/^:([\d.\/]+)/.exec(s.slice(i)); var d=rest?num(rest[1]):1; if(rest)i+=rest[0].length;
      var vv=/^@([\d.]+)/.exec(s.slice(i)), vel=vv?+vv[1]:1; if(vv)i+=vv[0].length;
      var rs=(ns.length===1&&(ns[0]==="r"||ns[0]==="-"));
      var ev={b:t,beats:d,v:vel,notes:rs?[]:ns,m:rs?[]:ns.map(tokMidi)}; if(!rs&&ns.some(isHz))ev.f=ns.map(tokFreq);
      out.push(ev);
      t+=d;
    }
    return out;
  }

  /* ================= SVG 部品（鍵盤・五線・12 音の円） ================= */
  var V=function(n){return "var(--"+n+")";};
  function svgWrap(w,h,body,cls){return '<svg class="mus'+(cls?" "+cls:"")+'" viewBox="0 0 '+w+' '+h+'" width="'+w+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>';}
  function tx(x,y,s,a,sz,col,b){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(a||"middle")+'" font-size="'+(sz||11)+'" fill="'+(col||V("muted"))+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'">'+esc(s)+'</text>';}
  function ln(x1,y1,x2,y2,col,lw,dash){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="'+(lw||1)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';}
  function whites(lo,hi){var r=[];for(var m=lo;m<=hi;m++)if(!BLACK[m%12])r.push(m);return r;}
  /* 鍵盤。hl = {midi: {c: 色名, label: 文字, strong: true/false}}。返り値 {svg, w, h, pos} */
  function kbd(lo,hi,o){
    o=o||{}; var ww=o.ww||22, wh=o.wh||86, hl=o.hl||{}, names=o.names==null?"c":o.names, x0=o.x||1, y0=o.y||1;
    var ws=whites(lo,hi), pos={}, b=[], fs=Math.max(8.5,Math.min(11.5,ww*0.46));
    ws.forEach(function(m,i){
      var kx=x0+i*ww, h=hl[m];
      b.push('<rect class="kbd-key" data-m="'+m+'" x="'+kx+'" y="'+y0+'" width="'+ww+'" height="'+wh+'" rx="3" fill="'+V("key-white")+'" stroke="'+V("key-line")+'" stroke-width="1.1"/>');
      if(h)b.push('<rect pointer-events="none" x="'+(kx+0.9)+'" y="'+(y0+0.9)+'" width="'+(ww-1.8)+'" height="'+(wh-1.8)+'" rx="3" fill="'+V(h.c||"signal")+'" fill-opacity="'+(h.strong?0.9:0.3)+'" stroke="'+V(h.c||"signal")+'" stroke-width="1.8"/>');
      pos[m]=[kx+ww/2,y0+wh];
    });
    var bw=ww*0.62, bh=wh*0.62;
    for(var m=lo;m<=hi;m++){
      if(!BLACK[m%12]||!pos[m-1])continue;
      var sh={1:-0.12,3:0.12,6:-0.14,8:0,10:0.14}[m%12]*bw, cx=pos[m-1][0]+ww/2+sh, h2=hl[m];
      b.push('<rect class="kbd-key" data-m="'+m+'" x="'+(cx-bw/2)+'" y="'+y0+'" width="'+bw+'" height="'+bh+'" rx="2.5" fill="'+(h2?V(h2.c||"signal"):V("key-black"))+'" stroke="'+V("key-black")+'" stroke-width="1"/>');
      pos[m]=[cx,y0+bh];
    }
    for(m=lo;m<=hi;m++){
      var hh=hl[m]||{}, bl=BLACK[m%12], lab=hh.label;
      if(lab==null&&!bl){ if(names==="c"&&m%12===0)lab="C"+(Math.floor(m/12)-1); else if(names==="white")lab=NS[m%12]; else if(names==="doremi")lab=DOREMI[NS[m%12]]; }
      if(lab)b.push(tx(pos[m][0],pos[m][1]-(bl?6:7),lab,"middle",bl?fs*0.82:fs,(bl||hh.strong)?"#fff":V("key-ink"),!!hl[m]).replace("<text","<text pointer-events=\"none\""));
    }
    return {svg:b.join(""),w:ws.length*ww+2,h:wh+2,pos:pos};
  }
  function glyph(name,gx,gy,k,fill){return '<path d="'+GLYPH[name].d+'" fill="'+fill+'" transform="translate('+gx+','+gy+') scale('+k+','+(-k)+')"/>';}
  function clef(kind,x,yt,s,fill){
    if(kind==="treble"){var k=s/170;return glyph("gclef",x-120*k,yt+3*s+156*k,k,fill);}
    var k2=s/194;return glyph("fclef",x-75*k2,yt+s+564*k2,k2,fill);
  }
  function accGlyph(a,x,yn,s,fill){
    if(a===1){var k=2.8*s/954;return glyph("sharp",x-365*k,yn+198*k,k,fill);}
    if(a===-1){var k2=2.45*s/836;return glyph("flat",x-329*k2,yn+205*k2,k2,fill);}
    if(a===0){var k3=2.7*s/965;return glyph("natural",x-324*k3,yn+192.5*k3,k3,fill);}
    if(a===-2)return accGlyph(-1,x,yn,s,fill)+accGlyph(-1,x-0.84*s,yn,s,fill);   /* ダブルフラット = フラット 2 つ */
    if(a===2){var r=0.32*s;return ln(x-2*r,yn-r,x,yn+r,fill,0.3*s)+ln(x-2*r,yn+r,x,yn-r,fill,0.3*s);}   /* ダブルシャープ = × */
    return "";
  }
  function ell(cx,cy,rx,ry,rot){var a=rot*Math.PI/180,dx=rx*Math.cos(a),dy=rx*Math.sin(a);
    return "M"+(cx-dx)+","+(cy-dy)+" A"+rx+","+ry+" "+rot+" 1 0 "+(cx+dx)+","+(cy+dy)+" A"+rx+","+ry+" "+rot+" 1 0 "+(cx-dx)+","+(cy-dy)+"Z";}
  function nhead(cx,cy,s,dur,fill){
    var d=dur==="whole"?ell(cx,cy,0.78*s,0.52*s,0)+ell(cx,cy,0.36*s,0.22*s,65):
          dur==="half"?ell(cx,cy,0.64*s,0.44*s,-22)+ell(cx,cy,0.5*s,0.2*s,-32):ell(cx,cy,0.64*s,0.44*s,-22);
    return '<path d="'+d+'" fill="'+fill+'" fill-rule="evenodd"/>';
  }
  /* 拍の長さ（4 分音符 = 1）→ 音符の種類と付点 */
  function durOf(beats){return beats>=4?"whole":beats>=2?"half":beats>=1?"quarter":beats>=0.5?"eighth":"16th";}
  function durDot(beats){var t=[[6,"whole",1],[4,"whole",0],[3,"half",1],[2,"half",0],[1.5,"quarter",1],[1,"quarter",0],[0.75,"eighth",1],[0.5,"eighth",0],[0.375,"16th",1],[0.25,"16th",0]];
    for(var i=0;i<t.length;i++)if(Math.abs(beats-t[i][0])<1e-6)return {dur:t[i][1],dot:!!t[i][2]};
    return {dur:durOf(beats),dot:false};}
  function staffStart(s,key,time){s=s||10; return 4.0*s+Math.abs(keyCount(key||0)||0)*1.05*s+(time?2.6*s:0)+1.7*s;}
  var KS_POS={"treble1":[8,5,9,6,3,7,4],"treble-1":[4,7,3,6,2,5,1],"bass1":[6,3,7,4,1,5,2],"bass-1":[2,5,1,4,0,3,-1]};
  function keySig(x,yt,s,kind,key,fill){var n=keyCount(key||0)||0; if(!n||(kind!=="treble"&&kind!=="bass"))return ""; var sg=n>0?1:-1, b=[];
    KS_POS[kind+sg].slice(0,Math.abs(n)).forEach(function(pp,i){b.push(accGlyph(sg,x+4.0*s+i*1.05*s+0.9*s,yt+4*s-pp*s/2,s,fill));}); return b.join("");}
  function timeSig(cx,yt,s,time,fill){var p=String(time).split("/"), st=' text-anchor="middle" font-size="'+(2.75*s)+'" fill="'+fill+'" font-family="Georgia, \'Times New Roman\', serif" font-weight="700"';
    return '<text x="'+cx+'" y="'+(yt+1.97*s)+'"'+st+'>'+p[0]+'</text><text x="'+cx+'" y="'+(yt+3.97*s)+'"'+st+'>'+p[1]+'</text>';}
  function restGlyph(cx,yt,s,dur,fill,dot){
    var b=[];
    if(dur==="whole")b.push('<rect x="'+(cx-0.6*s)+'" y="'+(yt+s)+'" width="'+(1.2*s)+'" height="'+(0.5*s)+'" fill="'+fill+'"/>');
    else if(dur==="half")b.push('<rect x="'+(cx-0.6*s)+'" y="'+(yt+1.5*s)+'" width="'+(1.2*s)+'" height="'+(0.5*s)+'" fill="'+fill+'"/>');
    else if(dur==="quarter"){var k=2.9*s/596;b.push(glyph("qrest",cx-159.5*k,yt+0.55*s+658*k,k,fill));}
    else if(dur==="eighth"){var k2=1.9*s/366;b.push(glyph("erest",cx-126.5*k2,yt+1.1*s+532*k2,k2,fill));}
    else{var k3=1.9*s/366;b.push(glyph("erest",cx-126.5*k3+0.22*s,yt+0.6*s+532*k3,k3,fill));b.push(glyph("erest",cx-126.5*k3-0.1*s,yt+1.6*s+532*k3,k3,fill));}
    if(dot)b.push('<circle cx="'+(cx+1.0*s)+'" cy="'+(yt+1.5*s)+'" r="'+(0.17*s)+'" fill="'+fill+'"/>');
    return b.join("");
  }
  function flagPath(xs,y1,s,up,fill,n){var b=[];for(var j=0;j<n;j++){var d=up?1:-1, yy=y1+d*j*0.85*s;
    b.push('<path d="M'+xs+','+yy+' c'+(0.2*s)+','+(d*1.2*s)+' '+(1.6*s)+','+(d*1.4*s)+' '+(1.1*s)+','+(d*2.8*s)+' c'+(0.1*s)+','+(-d*1.0*s)+' '+(-0.6*s)+','+(-d*1.6*s)+' '+(-1.1*s)+','+(-d*1.9*s)+'Z" fill="'+fill+'"/>');}
    return b.join("");}
  /* 五線。o = {w, s, clef: "treble"|"bass"|"grand"|"perc", key（調号: ♯ の数を正・♭ の数を負、または "G" などの調名）, time（"3/4" など）, items: [...]}
     items の各要素: {x, notes:[...], dur, dot, rest, bar(true|"double"|"end"), fill, fills（低い音から順の色の配列）, acc:false,
       stem:"up"|"down", staff:"treble"|"bass", tie, beam（同じ値の 8 分・16 分を連桁でつなぐ）, label, lcol, lsz, lbold, ldy, sym（五線の上の文字）, symcol, head:"x"}
     最初の音符を置ける x は staffStart(s, key, time)。返り値 {svg, w, h} */
  function staff(o){
    var s=o.s||10, w=o.w||300, clf=o.clef||"treble", top=o.top||(3.4*s), x0=o.x||2, lc=V("muted"), b=[], ka=keyAcc(o.key||0), kn=keyCount(o.key||0)||0;
    var st=clf==="grand"?[["treble",top],["bass",top+8*s]]:[[clf,top]];
    st.forEach(function(q){
      if(q[0]==="perc"||q[0]==="rhythm"){
        if(q[0]==="rhythm")b.push(ln(x0,q[1]+2*s,x0+w,q[1]+2*s,lc,1)); else for(var i0=0;i0<5;i0++)b.push(ln(x0,q[1]+i0*s,x0+w,q[1]+i0*s,lc,1));
        b.push('<rect x="'+(x0+1.3*s)+'" y="'+(q[1]+s)+'" width="'+(0.38*s)+'" height="'+(2*s)+'" fill="'+V("ink")+'"/><rect x="'+(x0+2.1*s)+'" y="'+(q[1]+s)+'" width="'+(0.38*s)+'" height="'+(2*s)+'" fill="'+V("ink")+'"/>');}
      else{for(var i=0;i<5;i++)b.push(ln(x0,q[1]+i*s,x0+w,q[1]+i*s,lc,1)); b.push(clef(q[0],x0+0.8*s,q[1],s,V("ink"))); b.push(keySig(x0,q[1],s,q[0],kn,V("ink")));}
      if(o.time)b.push(timeSig(x0+4.0*s+Math.abs(kn)*1.05*s+1.3*s,q[1],s,o.time,V("ink")));
    });
    if(clf==="grand")b.push(ln(x0,top,x0,top+12*s,lc,1.2));
    var ybot=st[st.length-1][1]+4*s, heads=[];
    (o.items||[]).forEach(function(it){
      var cx=x0+it.x, fill=it.fill||V("ink"), dur=it.dur||"whole", pl=[];
      if(it.bar){var y0=clf==="rhythm"?top+s:top, y1=clf==="rhythm"?top+3*s:ybot;
        if(it.bar==="double"){b.push(ln(cx-0.45*s,y0,cx-0.45*s,y1,lc,1.1));b.push(ln(cx,y0,cx,y1,lc,1.1));}
        else if(it.bar==="end"){b.push(ln(cx-0.75*s,y0,cx-0.75*s,y1,lc,1.1));b.push('<rect x="'+(cx-0.4*s)+'" y="'+y0+'" width="'+(0.45*s)+'" height="'+(y1-y0)+'" fill="'+V("ink")+'"/>');}
        else b.push(ln(cx,y0,cx,y1,lc,1.1));
        heads.push(null); return;}
      if(it.rest){var yt0=clf==="grand"&&it.staff==="bass"?top+8*s:top; b.push(restGlyph(cx,yt0,s,dur,fill,it.dot)); heads.push(null);
        if(it.label)b.push(tx(cx,top+(clf==="grand"?12*s:4*s)+(it.ldy||2.7*s),it.label,"middle",it.lsz||11,it.lcol||fill,it.lbold!==false)); return;}
      (it.notes||[]).forEach(function(n){
        if(clf==="rhythm"){if(!pl.length)pl.push({p:{acc:0,letter:"B",midi:-4},kind:"rhythm",yt:top,pp:4,yn:top+2*s}); return;}
        if(n[0]==="%"){var pq=PERC_PP[n]!=null?PERC_PP[n]:4; pl.push({p:{acc:0,letter:"B",midi:PERC[n.slice(1)]||-4},kind:"perc",yt:top,pp:pq,yn:top+4*s-pq*s/2,xh:n==="%hat"}); return;}
        var p=parse(n), kind=clf==="grand"?(it.staff||(p.midi>=60?"treble":"bass")):(clf==="perc"?"treble":clf), yt=clf==="grand"&&kind==="bass"?top+8*s:top, pp=p.dia-(kind==="bass"?18:30);
        pl.push({p:p,kind:kind,yt:yt,pp:pp,yn:yt+4*s-pp*s/2});
      });
      pl.sort(function(a,c){return c.yn-a.yn;});
      var hw=dur==="whole"?0.78*s:0.64*s, sh={}, hd=[];
      for(var i=1;i<pl.length;i++)if(pl[i].kind===pl[i-1].kind&&pl[i].pp-pl[i-1].pp===1&&!sh[i-1])sh[i]=1;
      pl.forEach(function(q,i){
        var nx=cx+(sh[i]?2*hw-0.1*s:0), lw=hw*1.55, col=(it.fills&&it.fills[i])||fill;
        if(q.kind!=="rhythm"){
          if(q.pp<=-2)for(var k=-2;k>=q.pp;k-=2){var yy=q.yt+4*s-k*s/2;b.push(ln(nx-lw,yy,nx+lw,yy,lc,1.1));}
          if(q.pp>=10)for(var k2=10;k2<=q.pp;k2+=2){var y2=q.yt+4*s-k2*s/2;b.push(ln(nx-lw,y2,nx+lw,y2,lc,1.1));}
        }
        if(it.head==="x"||q.xh){var r_=0.5*s;b.push(ln(nx-r_,q.yn-r_,nx+r_,q.yn+r_,col,1.6));b.push(ln(nx-r_,q.yn+r_,nx+r_,q.yn-r_,col,1.6));}
        else b.push(nhead(nx,q.yn,s,(dur==="eighth"||dur==="16th")?"quarter":dur,col));
        if(it.dot)b.push('<circle cx="'+(nx+hw+0.5*s)+'" cy="'+(q.yn-(q.pp%2===0?0.5*s:0))+'" r="'+(0.17*s)+'" fill="'+col+'"/>');
        if(q.kind!=="perc"&&q.kind!=="rhythm"&&q.p.acc!==ka[q.p.letter]&&it.acc!==false){var off=(i%2&&pl.length>1&&pl.slice(0,i).some(function(z){return z.p.acc!==0;}))?0.9*s:0;
          b.push(accGlyph(q.p.acc,cx-hw-0.35*s-off,q.yn,s,col));}
        hd.push({m:q.p.midi,kind:q.kind,x:nx,y:q.yn});
      });
      heads.push({it:it,cx:cx,hw:hw,pl:pl,hd:hd,fill:fill,dur:dur});
      if(it.sym){var ys=Math.min.apply(null,[top-1.0*s].concat(pl.map(function(q){return q.yn-1.7*s;})));b.push(tx(cx,ys,it.sym,"middle",it.symsz||1.3*s,it.symcol||V("ink"),true));}
      if(it.label)b.push(tx(cx,top+(clf==="grand"?12*s:4*s)+(it.ldy||2.7*s),it.label,"middle",it.lsz||11,it.lcol||fill,it.lbold!==false));
    });
    var groups={}, beamed={};
    heads.forEach(function(h,k){if(h&&(h.dur==="eighth"||h.dur==="16th")&&h.it.beam!=null){(groups[h.it.beam]=groups[h.it.beam]||[]).push(k);}});
    Object.keys(groups).forEach(function(g){if(groups[g].length>1)groups[g].forEach(function(k){beamed[k]=1;});});
    heads.forEach(function(h,k){
      if(!h||beamed[k]||!h.pl.length||!(h.dur==="half"||h.dur==="quarter"||h.dur==="eighth"||h.dur==="16th"))return;
      var parts=clf==="grand"?[h.pl.filter(function(q){return q.kind==="bass";}),h.pl.filter(function(q){return q.kind==="treble";})].filter(function(a){return a.length;}):[h.pl];
      parts.forEach(function(pl){
        var up=h.it.stem?h.it.stem==="up":pl[pl.length-1].pp<4, xs,y0,y1;
        if(up){xs=h.cx+h.hw-0.06*s;y0=pl[0].yn-0.1*s;y1=pl[pl.length-1].yn-3.4*s;} else{xs=h.cx-h.hw+0.06*s;y0=pl[pl.length-1].yn+0.1*s;y1=pl[0].yn+3.4*s;}
        b.push(ln(xs,y0,xs,y1,h.fill,1.2));
        if(h.dur==="eighth"||h.dur==="16th")b.push(flagPath(xs,y1,s,up,h.fill,h.dur==="eighth"?1:2));
      });
    });
    Object.keys(groups).forEach(function(g){
      var ks=groups[g]; if(ks.length<2)return; var hs=ks.map(function(k){return heads[k];});
      var all=[]; hs.forEach(function(h){h.pl.forEach(function(q){all.push(q.pp);});});
      var up=hs[0].it.stem?hs[0].it.stem==="up":(all.reduce(function(a,c){return a+c;},0)/all.length)<4;
      var xs=hs.map(function(h){return up?h.cx+h.hw-0.06*s:h.cx-h.hw+0.06*s;});
      var ext=hs.map(function(h){var ys=h.pl.map(function(q){return q.yn;});return up?Math.min.apply(null,ys)-3.3*s:Math.max.apply(null,ys)+3.3*s;});
      var sl=xs[xs.length-1]!==xs[0]?(ext[ext.length-1]-ext[0])/(xs[xs.length-1]-xs[0]):0; sl=Math.max(-0.12,Math.min(0.12,sl*0.5));
      var b0=ext[0]; xs.forEach(function(xi,i){var yb=b0+sl*(xi-xs[0]); if(up&&yb>ext[i])b0-=yb-ext[i]; if(!up&&yb<ext[i])b0+=ext[i]-yb;});
      var by=function(xx){return b0+sl*(xx-xs[0]);}, bt=0.48*s;
      hs.forEach(function(h,i){var ys=h.pl.map(function(q){return q.yn;}), far=up?Math.max.apply(null,ys):Math.min.apply(null,ys);
        b.push(ln(xs[i],far+(up?-0.1*s:0.1*s),xs[i],by(xs[i]),h.fill,1.2));});
      function beam(xa,xb,off){var d=up?off:-off, ya=by(xa)+d, yb=by(xb)+d, t=up?bt:-bt;
        return '<path d="M'+xa+','+ya+' L'+xb+','+yb+' L'+xb+','+(yb+t)+' L'+xa+','+(ya+t)+'Z" fill="'+hs[0].fill+'"/>';}
      b.push(beam(xs[0],xs[xs.length-1],0));
      hs.forEach(function(h,j){if(h.dur!=="16th")return; var nb=j+1<hs.length&&hs[j+1].dur==="16th", pb=j>0&&hs[j-1].dur==="16th";
        if(nb)b.push(beam(xs[j],xs[j+1],0.8*s)); else if(!pb)b.push(j+1<hs.length?beam(xs[j],xs[j]+1.1*s,0.8*s):beam(xs[j]-1.1*s,xs[j],0.8*s));});
    });
    heads.forEach(function(h,k){
      if(!h||!h.it.tie)return; var nx=null; for(var j=k+1;j<heads.length;j++)if(heads[j]){nx=heads[j];break;} if(!nx)return;
      var up=h.it.stem?h.it.stem==="up":(h.pl.length&&h.pl[h.pl.length-1].pp<4), nh=h.hd.length;
      h.hd.forEach(function(a,ti){var d=nh===1?(up?1:-1):(ti>=Math.floor((nh+1)/2)?-1:1); nx.hd.forEach(function(c){if(a.m===c.m&&a.kind===c.kind){
        var xa=a.x+0.55*h.hw, xb=c.x-0.55*nx.hw, ya=a.y+d*0.55*s, xm=(xa+xb)/2;
        b.push('<path d="M'+xa+','+ya+' Q'+xm+','+(ya+d*1.1*s)+' '+xb+','+ya+' Q'+xm+','+(ya+d*0.8*s)+' '+xa+','+ya+'Z" fill="'+h.fill+'"/>');}});});
    });
    var hgt=top+(clf==="grand"?12*s:4*s)+(o.bottom||4*s);
    return {svg:b.join(""),w:x0+w+2,h:hgt};
  }
  function clock(cx,cy,r,o){
    /* o.order="fifths" なら完全 5 度ずつ並べる（五度圏）。labels は音（0〜11）ごとの文字 */
    o=o||{}; var act=(o.active||[]).map(function(k){return ((k%12)+12)%12;}), fills=o.fills||{}, labels=o.labels||NS, pc=o.pcol||V("signal"), b=[], pts=[];
    var pos=o.order==="fifths"?function(k){return (7*k)%12;}:function(k){return k;};
    b.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+V("line")+'" stroke-width="1.2"/>');
    for(var k=0;k<12;k++){var a=(-90+30*pos(k))*Math.PI/180;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
    if(o.poly!==false&&act.length>1){var st=pos(((o.start||0)%12+12)%12), seq=act.slice().sort(function(a,c){return ((pos(a)-st+12)%12)-((pos(c)-st+12)%12);});
      b.push('<polygon points="'+seq.map(function(k){return pts[k].join(",");}).join(" ")+'" fill="'+(o.pfill||"none")+'" stroke="'+pc+'" stroke-width="1.8"/>');}
    for(k=0;k<12;k++){var on=act.indexOf(k)>=0, a2=(-90+30*pos(k))*Math.PI/180, f2=fills[k]||pc;
      b.push('<circle cx="'+pts[k][0]+'" cy="'+pts[k][1]+'" r="'+(on?7:3.2)+'" fill="'+(on?f2:V("panel"))+'" stroke="'+(on?f2:V("muted"))+'" stroke-width="1.4"/>');
      b.push(tx(cx+(r+16)*Math.cos(a2),cy+(r+16)*Math.sin(a2)+4,labels[k],"middle",o.sz||11,on?V("ink"):V("muted"),on));}
    return b.join("");
  }
  /* ---------- 倍音のスペクトル（音の組み合わせの相性） ----------
     各音の第 1〜H 倍音（振幅 1/h）を段ごとに描き、周波数が一致する倍音を緑の線、
     近いのに一致せずぶつかる倍音（粗さが一定以上）を赤い波線で結ぶ。粗さは Plomp–Levelt の曲線（Sethares の式）。 */
  function roughG(u){return Math.exp(-3.51*u)-Math.exp(-5.75*u);}
  function roughPair(fa,aa,fb,ab){var lo=Math.min(fa,fb),s=0.24/(0.0207*lo+18.96);return Math.min(aa,ab)*roughG(s*Math.abs(fb-fa));}
  function specAnalyze(fs,H,tol,thr){
    tol=tol==null?16:tol; thr=thr==null?0.015:thr; var co=[],cl=[],R=0;
    for(var i=0;i<fs.length;i++)for(var j=i+1;j<fs.length;j++)for(var h=1;h<=H;h++)for(var k=1;k<=H;k++){
      var fa=fs[i]*h,fb=fs[j]*k,r=roughPair(fa,1/h,fb,1/k),c=Math.abs(1200*Math.log(fb/fa)/Math.LN2); R+=r;
      if(c<=tol)co.push([i,h,j,k,Math.abs(fb-fa)]); else if(r>=thr)cl.push([i,h,j,k,r]);
    }
    return {co:co,cl:cl,R:R};
  }
  var RREF={};
  function roughRef(H){if(RREF[H]==null)RREF[H]=specAnalyze([261.6256,261.6256*Math.pow(2,1/12)],H).R;return RREF[H];}
  /* (x1,y1) から (x2,y2) へ向かう波線（path の d）。半波長ごとに 2 次ベジェで左右に振る */
  function wavy(x1,y1,x2,y2,wl,amp){wl=wl||8;amp=amp||2.2;var dx=x2-x1,dy=y2-y1,L=Math.sqrt(dx*dx+dy*dy)||1,nx=-dy/L,ny=dx/L,n=Math.max(2,Math.round(L/(wl/2))),d=["M"+x1.toFixed(1)+","+y1.toFixed(1)];
    for(var t=0;t<n;t++){var um=(t+0.5)/n,u1=(t+1)/n,sg=t%2?-1:1;d.push("Q"+(x1+dx*um+nx*2*amp*sg).toFixed(1)+","+(y1+dy*um+ny*2*amp*sg).toFixed(1)+" "+(x1+dx*u1).toFixed(1)+","+(y1+dy*u1).toFixed(1));}
    return d.join(" ");}
  var SPEC_COLS=["signal","blue","green","gold","purple"];
  /* notes: [{f: 周波数, label: 表示名, c: 色名}]。返り値 {svg, w, h, co, cl, rel} */
  function spec(notes,o){
    o=o||{}; var H=o.H||8, W=o.w||640, lh=o.lane||36, fs=notes.map(function(n){return n.f;});
    var lw=o.lw||Math.max(58,16+7*Math.max.apply(null,notes.map(function(n){return String(n.label).length;})));
    var fmin=o.fmin||Math.min.apply(null,fs)*0.82, fmax=o.fmax||Math.max.apply(null,fs)*H*1.12;
    var X=function(f){return lw+(W-lw-8)*Math.log(f/fmin)/Math.log(fmax/fmin);};
    var order=fs.map(function(f,i){return i;}).sort(function(a,b){return fs[b]-fs[a];}), base={}, top={}, b=[], y0=o.top||8;
    order.forEach(function(i,r){base[i]=y0+(r+1)*lh-5;});
    order.forEach(function(i){var n=notes[i],col=V(n.c||SPEC_COLS[i%5]);
      b.push(ln(lw,base[i],W-6,base[i],V("line"),1));
      b.push(tx(lw-8,base[i]-6,n.label,"end",11,col,true));
      for(var h=1;h<=H;h++){var x=X(fs[i]*h),hh=(lh-10)/h;b.push('<rect x="'+(x-2).toFixed(1)+'" y="'+(base[i]-hh).toFixed(1)+'" width="4" height="'+hh.toFixed(1)+'" rx="1" fill="'+col+'"/>');top[i+":"+h]=[x,base[i]-hh];}
    });
    var a=specAnalyze(fs,H,o.tol,o.thr);
    a.cl.forEach(function(q){var p1=top[q[0]+":"+q[1]],p2=top[q[2]+":"+q[3]],op=Math.min(1,0.25+q[4]*8);
      b.push('<path d="'+wavy(p1[0],p1[1],p2[0],p2[1])+'" fill="none" stroke="'+V("alias")+'" stroke-width="1.4" stroke-opacity="'+op.toFixed(2)+'"/>');});
    var segs=a.co.map(function(q){var p1=top[q[0]+":"+q[1]],p2=top[q[2]+":"+q[3]];return [p1,p2];});
    segs.forEach(function(s){
      b.push(ln(s[0][0],s[0][1],s[1][0],s[1][1],V("green"),2.4));
      b.push('<circle cx="'+s[0][0].toFixed(1)+'" cy="'+s[0][1].toFixed(1)+'" r="3.6" fill="'+V("green")+'"/><circle cx="'+s[1][0].toFixed(1)+'" cy="'+s[1][1].toFixed(1)+'" r="3.6" fill="'+V("green")+'"/>');});
    /* うなりの速さのラベル: 他のラベル・緑の線と重ならない位置を、右上 → 左上 → 右の中ほど → 左の中ほど の順に探す */
    if(o.beats!==false){
      var boxes=[], gl=segs.map(function(s){return [Math.min(s[0][0],s[1][0])-4,Math.max(s[0][0],s[1][0])+4,Math.min(s[0][1],s[1][1])-4,Math.max(s[0][1],s[1][1])+4];});
      var hit=function(r){return boxes.concat(gl).some(function(q){return r[0]<q[1]&&q[0]<r[1]&&r[2]<q[3]&&q[2]<r[3];})||r[0]<lw||r[1]>W-2||r[2]<0;};
      a.co.forEach(function(q,qi){
        if(q[4]<0.3)return;
        var s=segs[qi],xr=Math.max(s[0][0],s[1][0]),xl=Math.min(s[0][0],s[1][0]),yt=Math.min(s[0][1],s[1][1]),ym=(s[0][1]+s[1][1])/2,t=q[4].toFixed(1)+" Hz",tw=t.length*5.9;
        var own=gl[qi]; gl[qi]=[0,0,0,0];
        var cand=[[xr+6,yt+3,"start"],[xl-6,yt+3,"end"],[xr+6,ym+3,"start"],[xl-6,ym+3,"end"],[xr+6,yt-9,"start"]], pick=cand[0];
        for(var c=0;c<cand.length;c++){var k=cand[c],x0=k[2]==="start"?k[0]:k[0]-tw;if(!hit([x0,x0+tw,k[1]-9,k[1]+2])){pick=k;break;}}
        var px0=pick[2]==="start"?pick[0]:pick[0]-tw; boxes.push([px0-1,px0+tw+1,pick[1]-9,pick[1]+2]); gl[qi]=own;
        b.push(tx(pick[0],pick[1],t,pick[2],9.5,V("green"),true));});
    }
    var yb=y0+order.length*lh+2;
    b.push(ln(lw,yb,W-6,yb,V("muted"),1));
    for(var m=24;m<=120;m+=12){var f0=mfreq(m);if(f0>=fmin&&f0<=fmax){var xx=X(f0);b.push(ln(xx,yb,xx,yb+5,V("muted"),1));b.push(tx(xx,yb+17,"C"+(m/12-1),"middle",9.5,V("muted")));}}
    return {svg:b.join(""),w:W,h:yb+24,co:a.co,cl:a.cl,rel:100*a.R/roughRef(H)};
  }
  function specStats(a){return '一致 <b style="color:var(--green)">'+a.co.length+'</b> 組 ・ ぶつかり <b style="color:var(--alias)">'+a.cl.length+'</b> 組 ・ 粗さ <b>'+Math.round(a.rel)+'</b>（短 2 度 C4–C♯4 を 100）';}

  var REG={};

  /* ---------- 打楽器の音（リズムの章）。トークン %kick %snare %hat %click %accent ---------- */
  var PERC_PP={"%kick":1,"%snare":5,"%hat":9,"%click":4,"%accent":4};   /* 打楽器の五線での位置（第 1 線 = 0） */
  var PERC={"kick":-1,"snare":-2,"hat":-3,"click":-4,"accent":-5}, PERC_NAME={"-1":"バスドラム","-2":"スネア","-3":"ハイハット","-4":"クリック","-5":"強いクリック"}, NOISE=null;
  function noiseBuf(){var ctx=ac(); if(!NOISE){var n=ctx.sampleRate, bf=ctx.createBuffer(1,n,n), d=bf.getChannelData(0); for(var i=0;i<n;i++)d[i]=Math.random()*2-1; NOISE=bf;} return NOISE;}
  function drum(m,t,vel){
    var ctx=ac(); vel=vel==null?1:vel;
    function env(g,peak,dec){g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak*vel,t+0.002); g.gain.exponentialRampToValueAtTime(0.0008,t+dec);}
    if(m===-1){var o=ctx.createOscillator(), g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.13);
      env(g,0.95,0.42); o.connect(g); g.connect(OUT); o.start(t); o.stop(t+0.45); return track({src:o,g:g});}
    if(m===-2||m===-3){var src=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), g2=ctx.createGain(); src.buffer=noiseBuf(); hp.type="highpass"; hp.frequency.value=m===-2?1200:7000;
      env(g2,m===-2?0.5:0.3,m===-2?0.2:0.06); src.connect(hp); hp.connect(g2); g2.connect(OUT); src.start(t,Math.random()*0.5); src.stop(t+(m===-2?0.22:0.08));
      if(m===-2){var o2=ctx.createOscillator(), g3=ctx.createGain(); o2.type="triangle"; o2.frequency.setValueAtTime(190,t); env(g3,0.35,0.1); o2.connect(g3); g3.connect(OUT); o2.start(t); o2.stop(t+0.12); track({src:o2,g:g3});}
      return track({src:src,g:g2});}
    var o5=ctx.createOscillator(), g5=ctx.createGain(); o5.type="square"; o5.frequency.setValueAtTime(m===-5?2000:1300,t);
    env(g5,m===-5?0.22:0.13,0.04); o5.connect(g5); g5.connect(OUT); o5.start(t); o5.stop(t+0.05); return track({src:o5,g:g5});
  }
  /* コードの構成音を、コードネームの文字に合わせて綴る（例 E♭ を D♯ と書かない） */
  /* コード名を表示用に: Db → D♭、F#m7(b5) → F♯m7(♭5)、C/Bb → C/B♭ */
  function symTxt(x){return String(x).replace(/^([A-G])b/,"$1♭").replace(/^([A-G])#/,"$1♯").replace(/\/([A-G])b/,"/$1♭").replace(/\/([A-G])#/,"/$1♯").replace(/\(([^)]*)\)/g,function(m){return m.replace(/b/g,"♭").replace(/#/g,"♯");});}
  function chordSpell(sym,ms){
    var c=chordParse(sym), rl=LETTERS.indexOf(c.rootLetter), aug=c.ivs.indexOf(8)>=0&&c.ivs.indexOf(7)<0, d7=c.ivs.indexOf(9)>=0&&c.ivs.indexOf(6)>=0&&c.ivs.indexOf(10)<0&&c.ivs.indexOf(3)>=0;
    var LOF={0:0,1:1,2:1,3:2,4:2,5:3,6:4,7:4,8:aug?4:5,9:d7?6:5,10:6,11:6};
    return ms.map(function(m){
      var pc=((m-c.rootPc)%12+12)%12, lo=LOF[pc];
      if(c.bassPc!=null&&((m%12)+12)%12===c.bassPc&&c.ivs.map(function(v){return (c.rootPc+v)%12;}).indexOf(c.bassPc)<0){var bl=LETTERS.indexOf(c.bass[0]); lo=((bl-rl)%7+7)%7;}
      if(c.ivs.indexOf(18)>=0&&pc===6)lo=3; if(c.ivs.indexOf(15)>=0&&pc===3&&c.ivs.indexOf(4)>=0)lo=1;
      var li=(rl+lo)%7, best=null;
      for(var oc=-1;oc<=9;oc++){var a=m-(12*(oc+1)+PCL[li]); if(a>=-2&&a<=2){best=LETTERS[li]+({0:"",1:"#","-1":"b",2:"x","-2":"bb"}[a])+oc;break;}}
      return best||nname(m);
    });
  }
  /* 複数の声部・コード進行・メトロノームを鳴らす再生カード（mode: multi、または v1〜v4・chords・time・click があるとき） */
  function playMulti(el,sp){
    var timbre=sp.timbre||"piano", spb=60/(+(sp.tempo||96)), show=String(sp.show||"staff").split(/[\s,+]+/), time=sp.time||null, key=sp.key||null;
    var tp=time?String(time).split("/").map(Number):null, barB=tp?tp[0]*4/tp[1]:4, comp=tp&&tp[1]===8&&tp[0]%3===0&&tp[0]>3, grp=comp?1.5:1;
    var VC=["signal","blue","green","gold","purple"];
    var voices=[];   /* {steps, col, kind:"mel"|"chord"|"bass"|"click", name} */
    var vs=[sp.v1||(sp.notes&&!sp.chords?sp.notes:null),sp.v2,sp.v3,sp.v4];
    if(sp.v1&&sp.notes)vs[0]=sp.v1;
    vs.forEach(function(s){if(s)voices.push({steps:parseSeq(s),kind:"mel"});});
    var chordSteps=null;
    if(sp.chords){
      var t=0, prev=null; chordSteps=[];
      String(sp.chords).trim().split(/\s+/).forEach(function(tok){
        var mm=/^(.+?)(?::([\d.\/]+))?$/.exec(tok), sym=mm[1], d=mm[2]?num(mm[2]):barB;
        if(sym==="r"||sym==="-"){chordSteps.push({b:t,beats:d,v:1,notes:[],m:[],sym:null});t+=d;return;}
        var v=voiceLead(sym,prev,sp.low?parse(sp.low).midi:52,sp.high?parse(sp.high).midi:67); prev=v;
        chordSteps.push({b:t,beats:d,v:1,notes:chordSpell(sym,v),m:v,sym:sym}); t+=d;
      });
      voices.push({steps:chordSteps,kind:"chord"});
      if(sp.bass==="on")voices.push({kind:"bass",steps:chordSteps.map(function(e){if(!e.sym)return {b:e.b,beats:e.beats,v:1,notes:[],m:[]};
        var c=chordParse(e.sym), pc=c.bassPc!=null?c.bassPc:c.rootPc, m=40+((pc-40)%12+12)%12; return {b:e.b,beats:e.beats,v:1,notes:chordSpell(e.sym,[m]),m:[m]};})});
    }
    var total=0; voices.forEach(function(v){v.steps.forEach(function(e){total=Math.max(total,e.b+e.beats);});});
    if(sp.click==="on"){var cu=tp?4/tp[1]:1, cs=[]; for(var bt=0;bt<total-1e-9;bt+=cu){var inb=((bt%barB)+barB)%barB, acc=Math.abs(inb)<1e-6, mid=comp&&Math.abs(inb%1.5)<1e-6;
        cs.push({b:bt,beats:cu,v:acc?1:mid?0.85:0.6,notes:[acc?"%accent":"%click"],m:[acc?-5:-4]});} voices.push({steps:cs,kind:"click"});}
    voices.forEach(function(v,i){v.col=v.kind==="click"?"muted":v.kind==="bass"?"gold":v.kind==="chord"?(voices.length>1?"purple":"signal"):VC[i%5];});
    var hd=mk("div","ph"); el.appendChild(hd); hd.appendChild(mk("span","pl",esc(sp.label||"")));
    var view=mk("div","pv"); el.appendChild(view);
    if(sp.note)el.appendChild(mk("div","pn2",esc(sp.note)));
    var mel=[]; voices.forEach(function(v){if(v.kind!=="click")v.steps.forEach(function(e){e.m.forEach(function(m){if(m>=0)mel.push(m);});});});
    var lo=mel.length?Math.min.apply(null,mel):60, hi=mel.length?Math.max.apply(null,mel):72, klo=lo-(lo%12), khi=hi+(11-hi%12);
    if(sp.range){var rg=String(sp.range).split(/\s+/); klo=parse(rg[0]).midi; khi=parse(rg[1]).midi;}
    var labOf={}, colOf={};
    voices.forEach(function(v){v.steps.forEach(function(e){e.m.forEach(function(m,i){if(m>=0&&labOf[m]==null){labOf[m]=nname(e.notes[i],false);colOf[m]=v.col;}});});});
    var perc=voices.every(function(v){return v.kind==="click"||v.steps.every(function(e){return e.m.every(function(m){return m<0;});});});
    var staffV=voices.filter(function(v){return v.kind!=="click"&&!(v.kind==="chord"&&voices.some(function(w){return w.kind==="mel";})&&show.indexOf("voicing")<0);});
    var smel=[]; staffV.forEach(function(v){v.steps.forEach(function(e){e.m.forEach(function(m){if(m>=0)smel.push(m);});});});
    var slo=smel.length?Math.min.apply(null,smel):60, shi=smel.length?Math.max.apply(null,smel):72;
    var hasB=staffV.some(function(v){return v.kind==="bass";})&&staffV.length>1;   /* 低音を足したときは大譜表にし、旋律を高音部、低音を低音部に置く（和音は音の高さで振り分ける） */
    var clf=sp.clef||(perc?"perc":hasB?"grand":slo>=55?"treble":shi<=64?"bass":"grand");
    if(perc&&!sp.clef){var kinds={}; voices.forEach(function(v){if(v.kind!=="click")v.steps.forEach(function(e){e.notes.forEach(function(n){kinds[n]=1;});});}); clf=Object.keys(kinds).length>1?"perc":"rhythm";}
    /* 拍 b0 から beats 拍の音を、小節線と書ける音価（付点を含む）で区切る（区切った音はタイでつなぐ） */
    function pieces(b0,beats){var VALS=[4,3,2,1.5,1,0.75,0.5,0.375,0.25], out=[], bq=b0, end=b0+beats;
      while(bq<end-1e-9){var be=time?(Math.floor(bq/barB+1e-9)+1)*barB:Infinity, len=Math.min(end,be)-bq;
        while(len>1e-9){var v=null; for(var i=0;i<VALS.length;i++)if(VALS[i]<=len+1e-9){v=VALS[i];break;} if(v==null)v=len; out.push({b:bq,beats:v}); bq+=v; len-=v;}}
      return out;}
    var on={}, act=[];   /* on[voice:step] = true */
    function draw(){
      var h=[];
      if(show.indexOf("chords")>=0&&chordSteps){
        var tot=0; chordSteps.forEach(function(e){tot+=e.beats;});
        h.push('<div class="cs">'+chordSteps.map(function(e,i){var vi=voices.findIndex(function(v){return v.kind==="chord";}), o=on[vi+":"+i];
          return '<span class="'+(o?"on":"")+'" style="flex:'+e.beats+' 1 0">'+(e.sym?'<b>'+esc(symTxt(e.sym))+'</b>'+(key?'<i>'+esc(roman(e.sym,key))+'</i>':''):'<b>–</b>')+'</span>';}).join("")+'</div>');
      }
      if(show.indexOf("kbd")>=0&&mel.length){
        var ww=khi-klo>30?16:khi-klo>23?19:22, hl={};
        Object.keys(labOf).forEach(function(m){hl[m]={c:colOf[m],label:sp.keys==="none"?"":labOf[m],strong:act.indexOf(+m)>=0};});
        var k=kbd(klo,khi,{ww:ww,wh:ww*3.9,hl:hl}); h.push(svgWrap(k.w,k.h,k.svg,"kbd"));
      }
      if(show.indexOf("staff")>=0){
        var s=8, minB=1; staffV.forEach(function(v){v.steps.forEach(function(e){minB=Math.min(minB,e.beats);});});
        var u=minB>=1?24:minB>=0.5?34:46, G=2.2*s, x0=staffStart(s,key?keyCount(key):0,time), two=staffV.length>1&&clf!=="grand";
        var X=function(b){return u*b+(time?Math.floor(b/barB+1e-9)*G:0);};
        var items=[];
        staffV.forEach(function(v,vk){var vi=voices.indexOf(v);
          v.steps.forEach(function(e,si){
            var fill=on[vi+":"+si]?V("signal"):(v.kind==="mel"&&vi===0?V("ink"):V(v.col)), ps=pieces(e.b,e.beats);
            ps.forEach(function(pc,pj){
              var dd=durDot(pc.beats), it={b:pc.b,x:X(pc.b),dur:dd.dur,dot:dd.dot,fill:fill};
              if(!e.m.length){it.rest=true; if(clf==="grand")it.staff=v.kind==="bass"||(!hasB&&vk>0)?"bass":"treble";}
              else{it.notes=e.notes.filter(function(n,j){return e.m[j]>=0||n[0]==="%";});
                if(dd.dur==="eighth"||dd.dur==="16th")it.beam=vi+":"+Math.floor(pc.b/grp+1e-9);
                if(pj<ps.length-1)it.tie=true;
                if(clf==="grand"&&hasB&&v.kind!=="chord")it.staff=v.kind==="bass"?"bass":"treble";
                if(two)it.stem=vk===0?"up":"down";}
              if(pj===0&&chordSteps&&v.kind==="chord")it.sym=symTxt(e.sym);
              items.push(it);});});});
        if(chordSteps&&!staffV.some(function(v){return v.kind==="chord";}))chordSteps.forEach(function(e){if(e.sym)items.push({b:e.b,x:X(e.b),notes:[],sym:symTxt(e.sym),symcol:V("purple")});});
        var lines=[], maxW=Math.max(260,Math.min(640,(el.clientWidth||640)-30)), nb=Math.ceil(total/barB-1e-9), perLine=time?Math.max(1,Math.floor((maxW-x0-10)/(barB*u+G))):0;
        if(!time||X(total)+x0+12<=maxW||perLine>=nb)lines.push([0,total]);
        else for(var bb=0;bb<nb;bb+=perLine)lines.push([bb*barB,Math.min(total,(bb+perLine)*barB)]);
        var sv=[];
        lines.forEach(function(L,li){
          var xs=(li===0?x0:staffStart(s,key?keyCount(key):0,null)), off=X(L[0]);
          var its=items.filter(function(it){return it.b>=L[0]-1e-9&&it.b<L[1]-1e-9;}).map(function(it){var c={}; for(var k in it)c[k]=it[k]; c.x=xs+it.x-off; return c;});
          if(time){for(var k2=Math.floor(L[0]/barB)+1;k2*barB<L[1]-1e-9;k2++)its.push({bar:true,x:xs+X(k2*barB)-off-0.6*G});
            its.push({bar:L[1]>=total-1e-9?"end":true,x:xs+X(L[1])-off-0.6*G+(L[1]>=total-1e-9?0.5*s:0)});}
          its.sort(function(p,q){return p.x-q.x;});
          var wd=(time?xs+X(L[1])-off-0.6*G+0.6*s:xs+X(L[1])-off+10);
          var stf=staff({s:s,w:wd,clef:clf,key:key?keyCount(key):0,time:li===0?time:null,items:its,top:chordSteps?4.6*s:3.4*s});
          sv.push(svgWrap(stf.w,stf.h,stf.svg,"stf"));
        });
        h.push('<div class="stfs">'+sv.join("")+'</div>');
      }
      view.innerHTML=h.join("");
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".kbd-key"); if(t){note(+t.getAttribute("data-m"),ac().currentTime+0.01,1.2,timbre,0.9);}});
    var evs=[]; voices.forEach(function(v,vi){v.steps.forEach(function(e,si){if(e.m.length)evs.push({t:e.b*spb,d:Math.max(0.08,e.beats*spb*(v.kind==="chord"||v.kind==="bass"?0.98:0.94)),m:e.m,f:e.f,v:(e.v==null?1:e.v)*(v.kind==="chord"?0.75:v.kind==="bass"?0.8:1),vi:vi,si:si,b:e.b,beats:e.beats});});});
    evs.sort(function(a,c){return a.t-c.t;});
    function refresh(T){on={};act=[];evs.forEach(function(e){if(e.t<=T+1e-6&&T<e.t+e.d-1e-6){on[e.vi+":"+e.si]=true;e.m.forEach(function(m){if(m>=0)act.push(m);});}});draw();}
    var b=mk("button","pb","▶ 再生"); b.type="button"; b.setAttribute("aria-pressed","false"); hd.appendChild(b);
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll(); on={}; act=[]; draw(); return;}
      playEvents(evs,{timbre:timbre,onStep:function(i){refresh(evs[i].t); var e=evs[i]; TIMERS.push(setTimeout(function(){refresh(e.t+e.d);},e.d*1000));},
        onEnd:function(){b.setAttribute("aria-pressed","false"); on={}; act=[]; draw();}});
      b.setAttribute("aria-pressed","true");
    });
    draw();
  }

  /* ---------- 再生カード（Markdown の ```play から作る） ----------
     spec: notes（音名の列）, mode（chord / arp / both / seq）, label, show（kbd staff）,
           timbre（piano / sine / organ）, tempo（seq の速さ、1 分あたりの拍数）, colors, keys（鍵盤に書く文字）, note（下に添える説明） */
  REG.play=function(el){
    var sp={}; try{sp=JSON.parse(el.getAttribute("data-spec")||"{}");}catch(e){}
    el.innerHTML="";
    if(sp.mode==="multi"||sp.v1||sp.v2||sp.v3||sp.v4||sp.chords||sp.time||sp.click){playMulti(el,sp);return;}
    var mode=sp.mode||"chord", timbre=sp.timbre||"piano", spb=60/(+(sp.tempo||96));
    var show=String(sp.show||"kbd").split(/[\s,+]+/);
    var steps=mode==="seq"?parseSeq(sp.notes):[{b:0,beats:4,notes:String(sp.notes).trim().split(/\s+/)}];
    if(mode!=="seq"){steps[0].m=steps[0].notes.map(tokMidi); if(steps[0].notes.some(isHz))steps[0].f=steps[0].notes.map(tokFreq);}
    var hz=steps.some(function(e){return !!e.f;});
    var all=[]; steps.forEach(function(e){all=all.concat(e.m);});
    var lo=Math.min.apply(null,all), hi=Math.max.apply(null,all);
    var klo=lo-(lo%12), khi=hi+(11-hi%12);
    if(sp.range){var rg=String(sp.range).split(/\s+/); klo=parse(rg[0]).midi; khi=parse(rg[1]).midi;}
    var cols=String(sp.colors||"").split(/\s+/).filter(Boolean), keys=String(sp.keys||"").split(/\s+/).filter(Boolean);
    var colOf={}, labOf={};
    var nolab=String(sp.keys||"")==="none"; if(nolab)keys=[];
    function lab0(n){return nolab?"":isHz(n)?n.replace(/Hz$/i," Hz"):nname(n,false);}
    if(mode!=="seq")steps[0].m.forEach(function(m,i){colOf[m]=cols[i]||cols[0]||"signal"; labOf[m]=nolab?"":(keys[i]||lab0(steps[0].notes[i]));});
    else steps.forEach(function(e){e.m.forEach(function(m,i){if(!colOf[m]){colOf[m]=cols[0]||"signal"; labOf[m]=lab0(e.notes[i]);}});});
    var hd=mk("div","ph"); el.appendChild(hd); hd.appendChild(mk("span","pl",esc(sp.label||"")));
    var view=mk("div","pv"); el.appendChild(view);
    if(sp.note)el.appendChild(mk("div","pn2",esc(sp.note)));
    var clf=lo>=55?"treble":hi<=64?"bass":"grand";
    function draw(act){
      act=act||[]; var h=[];
      if(show.indexOf("kbd")>=0){
        var ww=khi-klo>30?16:khi-klo>23?19:22, hl={};
        all.forEach(function(m){hl[m]={c:colOf[m],label:labOf[m],strong:act.indexOf(m)>=0};});
        var k=kbd(klo,khi,{ww:ww,wh:ww*3.9,hl:hl});
        h.push(svgWrap(k.w,k.h,k.svg,"kbd"));
      }
      if(show.indexOf("staff")>=0){
        var s=8, items=[], x=4.2*s+16;
        if(mode==="seq"){steps.forEach(function(e,i){if(e.m.length)items.push({x:x,notes:e.notes,dur:durOf(e.beats),fill:e._on?V("signal"):V("ink")}); x+=Math.max(30,22+e.beats*9);});}
        else if(mode==="arp"){steps[0].notes.forEach(function(n,i){items.push({x:x,notes:[n],fill:act.indexOf(steps[0].m[i])>=0?V("signal"):V(colOf[steps[0].m[i]]==="signal"?"ink":colOf[steps[0].m[i]])}); x+=34;});}
        else{items.push({x:x+8,notes:steps[0].notes,fills:steps[0].m.map(function(m){return act.indexOf(m)>=0?V("signal"):V(colOf[m]==="signal"?"ink":colOf[m]);})}); x+=46;}
        var st=staff({s:s,w:x+10,clef:clf,items:items});
        h.push(svgWrap(st.w,st.h,st.svg,"stf"));
      }
      if(show.indexOf("spec")>=0&&mode!=="seq"){
        var fsS=(steps[0].f||steps[0].m.map(mfreq)), Hs=+(sp.harmonics||8);
        var sv=spec(fsS.map(function(fq,i){return {f:fq,label:keys[i]||lab0(steps[0].notes[i])||steps[0].notes[i],c:SPEC_COLS[i%5]};}),{H:Hs,w:620,lane:fsS.length>2?30:36});
        h.push('<div style="width:100%">'+svgWrap(sv.w,sv.h,sv.svg,"spec")+'<div class="pn2">'+specStats(sv)+'</div></div>');
      }
      if(show.indexOf("wave")>=0){
        var fs0=(steps[0].f||steps[0].m.map(mfreq)), W=Math.min(560,Math.max(300,(el.clientWidth||600)-40)), H=96, ms=+(sp.window||10);
        var sel=act.length?fs0.filter(function(fq,i){return act.indexOf(steps[0].m[i])>=0;}):fs0, pts=[], N=400;
        for(var i=0;i<=N;i++){var tt=i/N*ms/1000, v=0; sel.forEach(function(fq){v+=Math.sin(2*Math.PI*fq*tt);}); pts.push([4+i/N*(W-8), H/2-v/Math.max(1,fs0.length)*(H/2-8)]);}
        var g=ln(4,H/2,W-4,H/2,V("line"),1)+'<polyline points="'+pts.map(function(q){return q[0].toFixed(1)+","+q[1].toFixed(1);}).join(" ")+'" fill="none" stroke="'+V("signal")+'" stroke-width="1.8"/>'+tx(W-6,H-6,ms+" ms","end",10,V("muted"));
        h.push(svgWrap(W,H,g,"wave"));
      }
      view.innerHTML=h.join("");
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".kbd-key"); if(t){note(+t.getAttribute("data-m"),ac().currentTime+0.01,1.2,timbre,0.9);}});
    function bt(label,evs){
      var b=mk("button","pb",label); b.type="button"; b.setAttribute("aria-pressed","false"); hd.appendChild(b);
      b.addEventListener("click",function(){
        if(b.getAttribute("aria-pressed")==="true"){stopAll(); draw([]); return;}
        var ev=evs(); playEvents(ev,{timbre:timbre,
          onStep:function(i){steps.forEach(function(e){e._on=false;}); if(mode==="seq")steps[i]._on=true; draw(ev[i].m);},
          onEnd:function(){b.setAttribute("aria-pressed","false"); steps.forEach(function(e){e._on=false;}); draw([]);}});
        b.setAttribute("aria-pressed","true");
      });
    }
    var ms=steps[0].m;
    var fz=steps[0].f, gap=+(sp.gap||0.5), hold=+(sp.hold||2.4);
    if(mode==="seq")bt("▶ 再生",function(){return steps.map(function(e){return {t:e.b*spb,d:Math.max(0.12,e.beats*spb*0.96),m:e.m,f:e.f,v:e.v};});});
    if(mode==="arp"||mode==="both")bt("▶ 1 音ずつ",function(){return ms.map(function(m,i){return {t:i*gap,d:i===ms.length-1?Math.max(1.2,gap):gap*0.96,m:[m],f:fz?[fz[i]]:null};});});
    if(mode==="chord"||mode==="both")bt(ms.length>1?"▶ 同時に":"▶ 鳴らす",function(){return [{t:0,d:hold,m:ms,f:fz}];});
    draw([]);
  };

  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */
  /* ============ 01. tone — 周波数と振幅 ============ */
  REG.tone=function(el){
    head(el,"Tone","周波数と振幅を変えて、波形と音を比べる");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ 鳴らす");
    var row=ctrls(el);
    var sf=slider(row,"周波数（55〜1760 Hz）",0,1000,600,1), sa=slider(row,"振幅",0,100,50,1);
    var cv=screen(el,170), cc=cctx(cv), ro=readout(el);
    var osc=null, g=null;
    function fval(){return 55*Math.pow(2,(+sf.input.value)/1000*5);}
    function aval(){return (+sa.input.value)/100;}
    function stop(){if(osc){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.02);osc.stop(t+0.2);osc=null;}
      bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function apply(){if(osc){var t=AC.currentTime;osc.frequency.setTargetAtTime(fval(),t,0.015);g.gain.setTargetAtTime(0.3*aval(),t,0.02);}}
    function draw(){
      var f0=fval(),a=aval();sf.val.textContent=f(f0,f0<100?1:0)+" Hz";sa.val.textContent=f(a,2);
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=14,x1=w-14,cy=h/2-6,H=h/2-22;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x0,cy-H);ctx.lineTo(x1,cy-H);ctx.moveTo(x0,cy+H);ctx.lineTo(x1,cy+H);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      for(var i=0;i<=800;i++){var t=i/800*0.01,x=x0+(x1-x0)*i/800,y=cy-a*H*Math.sin(2*Math.PI*f0*t);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      ctx.stroke();
      lab(ctx,"0",x0,h-6,C("--muted"),"left");lab(ctx,"10 ms",x1,h-6,C("--muted"),"right");lab(ctx,"振幅 1",x0+2,cy-H-4,C("--faint"),"left");
      var db=a>0?20*Math.log(a/0.5)/Math.LN10:null;
      ro.innerHTML='周波数 <b>'+f(f0,1)+' Hz</b> ／ 周期 T = 1/f = <b>'+f(1000/f0,2)+' ms</b> ／ 10 ms の間に <b>'+f(f0*0.01,1)+'</b> 回<br>'+
        '振幅 <b>'+f(a,2)+'</b> ／ 振幅 0.5 を基準にすると <b>'+(db===null?'無音':(db>=0?'+':'')+f(db,1)+' dB')+'</b>';
    }
    bp.addEventListener("click",function(){
      if(osc){stop();return;}
      stopAll();var ctx=ac();osc=ctx.createOscillator();g=ctx.createGain();osc.frequency.value=fval();g.gain.value=0;
      osc.connect(g);g.connect(OUT);osc.start();g.gain.setTargetAtTime(0.3*aval(),ctx.currentTime,0.02);
      bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    sf.input.addEventListener("input",function(){draw();apply();});
    sa.input.addEventListener("input",function(){draw();apply();});
    reg(cv,draw);
  };

  /* ============ 01. harmix — 倍音を混ぜて音色を作る ============ */
  REG.harmix=function(el){
    head(el,"Harmonics","倍音の混ぜ方を変えて、波形・スペクトル・音色を比べる");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ 鳴らす");
    var row0=ctrls(el), pre=select(row0,"例",["純音","オルガン風","のこぎり波","奇数の倍音だけ","高い倍音だけ強い"]);
    var row=ctrls(el), sl=[];
    for(var k=1;k<=8;k++)sl.push(slider(row,"第 "+k+" 倍音",0,100,k===1?100:0,1));
    var cv=screen(el,268), cc=cctx(cv), ro=readout(el);
    var PRE=[[1,0,0,0,0,0,0,0],[1,.55,.32,.22,.12,.08,0,0],[1,1/2,1/3,1/4,1/5,1/6,1/7,1/8],[1,0,1/3,0,1/5,0,1/7,0],[.25,.15,.1,.4,.55,.6,.45,.3]];
    var osc=null,g=null,F0=220;
    function amps(){return sl.map(function(q){return (+q.input.value)/100;});}
    function wave(ctx,a){var re=new Float32Array(9),im=new Float32Array(9);for(var k=0;k<8;k++)im[k+1]=a[k];return ctx.createPeriodicWave(re,im,{disableNormalization:true});}
    function level(a){var s=0;a.forEach(function(v){s+=v;});return 0.22/Math.max(0.6,s*0.55);}
    function stop(){if(osc){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.02);osc.stop(t+0.2);osc=null;}bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function apply(){if(osc){var a=amps();if(a.some(function(v){return v>0;}))osc.setPeriodicWave(wave(AC,a));g.gain.setTargetAtTime(level(a),AC.currentTime,0.03);}}
    function draw(){
      var a=amps();sl.forEach(function(q,i){q.val.textContent=f(a[i],2);});
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=14,x1=w-14,cy=64,H=44,sum=0;a.forEach(function(v){sum+=v;});
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      var pts=[],mx=1e-9;for(var i=0;i<=600;i++){var t=i/600*2,v=0;for(var k=0;k<8;k++)v+=a[k]*Math.sin(2*Math.PI*(k+1)*t);pts.push(v);mx=Math.max(mx,Math.abs(v));}
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();
      pts.forEach(function(v,i){var x=x0+(x1-x0)*i/600,y=cy-v/mx*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      lab(ctx,"波形（2 周期分）",x0,14,C("--muted"),"left");
      var yb=h-30,hm=78,bw=(x1-x0)/8;
      ctx.strokeStyle=C("--muted");ctx.beginPath();ctx.moveTo(x0,yb);ctx.lineTo(x1,yb);ctx.stroke();
      for(k=0;k<8;k++){var bh=a[k]*hm;ctx.fillStyle=C(k===0?"--signal":"--blue");ctx.fillRect(x0+k*bw+bw*0.25,yb-bh,bw*0.5,bh);
        lab(ctx,(k+1)+"",x0+k*bw+bw/2,yb+14,C("--muted"),"center");lab(ctx,Math.round(F0*(k+1))+" Hz",x0+k*bw+bw/2,yb+26,C("--faint"),"center");}
      lab(ctx,"スペクトル（第 n 倍音の振幅）",x0,yb-hm-10,C("--muted"),"left");
      ro.innerHTML='基音 <b>'+F0+' Hz</b>（高さはこの周波数のまま） ／ 含まれる倍音: <b>'+a.map(function(v,i){return v>0?(i+1):null;}).filter(function(v){return v;}).join(", ")+'</b>';
    }
    pre.addEventListener("change",function(){var p=PRE[+pre.value];sl.forEach(function(q,i){q.input.value=Math.round(p[i]*100);});draw();apply();});
    sl.forEach(function(q){q.input.addEventListener("input",function(){pre.value=pre.value;draw();apply();});});
    bp.addEventListener("click",function(){
      if(osc){stop();return;}
      var a=amps();if(!a.some(function(v){return v>0;}))return;
      stopAll();var ctx=ac();osc=ctx.createOscillator();g=ctx.createGain();osc.setPeriodicWave(wave(ctx,a));osc.frequency.value=F0;
      g.gain.value=0;osc.connect(g);g.connect(OUT);osc.start();g.gain.setTargetAtTime(level(a),ctx.currentTime,0.03);
      bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    reg(cv,draw);
  };

  /* ============ 01. hseries — 倍音列を 1 つずつ聴く ============ */
  REG.hseries=function(el){
    head(el,"Series","倍音列を 1 つずつ鳴らし、重ねていく");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bOne=button(bar,"▶ 基音だけ"), bAdd=button(bar,"▶ 1 から順に重ねる"), bAll=button(bar,"▶ 8 つを同時に");
    var view=mk("div","wscreen"); view.style.padding=".5rem"; el.appendChild(view);
    var ro=readout(el), F0=110, on={};
    function draw(){
      var W=640,H=168,x0=40,w=570,y=96,L=function(fq){return x0+w*Math.log(fq/F0)/Math.log(8);},b=[];
      b.push(ln(x0,y,x0+w,y,V("muted"),1.2));
      for(var n=1;n<=8;n++){var x=L(n*F0),act=!!on[n],c=act?V("signal"):V("blue");
        b.push('<rect class="hs" data-n="'+n+'" x="'+(x-11)+'" y="'+(y-62)+'" width="22" height="62" fill="transparent" style="cursor:pointer"/>');
        b.push(ln(x,y-(act?58:40),x,y,c,act?5:3).replace("<line",'<line pointer-events="none"'));
        b.push(tx(x,y-(act?64:46),n+"",'middle',11,c,true));
        b.push(tx(x,y+16,(n*F0)+"",'middle',9.5,V("muted")));}
      for(n=1;n<8;n++){var xa=L(n*F0),xb=L((n+1)*F0);b.push(tx((xa+xb)/2,y+34,(n+1)+":"+n,'middle',9.5,V("faint"),true));}
      b.push(tx(x0+w,H-6,"比の目盛（対数）。数字を押すとその倍音だけ鳴る","end",10,V("muted")));
      view.innerHTML=svgWrap(W,H,b.join(""));
    }
    function setOn(list){on={};list.forEach(function(n){on[n]=1;});draw();
      ro.innerHTML=list.length?'鳴っている倍音: <b>'+list.join(", ")+'</b>（'+list.map(function(n){return n*F0+" Hz";}).join(", ")+'）':'基音 '+F0+' Hz の倍音列。どの成分も基音の整数倍の周波数を持つ';}
    function go(btn,plan,total){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();setOn([]);return;}
      stopAll();var ctx=ac(),t0=ctx.currentTime+0.05;btn.setAttribute("aria-pressed","true");
      plan.forEach(function(p){tone(p.n*F0,t0+p.t,p.d,{gain:0.2/Math.sqrt(p.k||1)*(p.amp||1)});});
      var steps={};plan.forEach(function(p){steps[p.t]=1;});
      Object.keys(steps).forEach(function(ts){var t=+ts;TIMERS.push(setTimeout(function(){setOn(plan.filter(function(p){return p.t<=t+1e-6;}).map(function(p){return p.n;}));},t*1000+50));});
      TIMERS.push(setTimeout(function(){btn.setAttribute("aria-pressed","false");setOn([]);},(total+0.2)*1000));
    }
    bOne.addEventListener("click",function(){go(bOne,[{n:1,t:0,d:2}],2);});
    bAdd.addEventListener("click",function(){var p=[];for(var n=1;n<=8;n++)p.push({n:n,t:(n-1)*0.8,d:(8-n)*0.8+1.6,amp:1/n,k:1});go(bAdd,p,7*0.8+1.6);});
    bAll.addEventListener("click",function(){var p=[];for(var n=1;n<=8;n++)p.push({n:n,t:0,d:2.4,amp:1/n,k:1});go(bAll,p,2.4);});
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".hs");if(!t)return;var n=+t.getAttribute("data-n");
      stopAll();tone(n*F0,ac().currentTime+0.02,1.2,{gain:0.2});setOn([n]);TIMERS.push(setTimeout(function(){setOn([]);},1300));});
    setOn([]);
  };

  /* ============ 02. keyinfo — 鍵を押して、名前・番号・周波数を見る ============ */
  REG.keyinfo=function(el){
    head(el,"Keys","鍵を押すと、音名・オクターブ番号・MIDI 番号・周波数が表示される");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), cur=69;
    function names(m){var pc=m%12,o=Math.floor(m/12)-1;return BLACK[pc]?[NS[pc]+o,NF[pc]+o]:[NS[pc]+o];}
    function draw(){
      var hl={}; hl[cur]={c:"signal",label:BLACK[cur%12]?"":NS[cur%12],strong:true};
      var k=kbd(48,72,{ww:26,wh:104,hl:hl,names:"c"});
      var nm=names(cur), items=[{x:64,notes:[nm[0].replace("♯","#")],fill:V("signal")}];
      if(nm[1])items.push({x:128,notes:[nm[1].replace("♭","b")],fill:V("purple")});
      var st=staff({s:10,w:nm[1]?170:110,clef:cur>=60?"treble":"bass",items:items});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(k.w,k.h,k.svg)+svgWrap(st.w,st.h,st.svg)+'</div>';
      var n=cur-69, fq=mfreq(cur);
      ro.innerHTML='音名 <b>'+nm.join(' ／ ')+'</b>'+(BLACK[cur%12]?'（同じ鍵の 2 つの名前）':'（'+DOREMI[NS[cur%12]]+'）')+
        ' ／ MIDI 番号 <b>'+cur+'</b><br>A4（69）から <b>'+(n>=0?'+':'')+n+'</b> 半音 ／ 周波数 = 440 × 2<sup>('+cur+' − 69)/12</sup> = <b>'+f(fq,2)+' Hz</b>';
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".kbd-key");if(!t)return;cur=+t.getAttribute("data-m");
      stopAll();note(cur,ac().currentTime+0.01,1.4,"piano",0.9);draw();});
    draw();
  };

  /* ============ 02. staffkbd — 五線の位置と鍵盤の対応 ============ */
  REG.staffkbd=function(el){
    head(el,"Staff","五線の上で音を動かすと、鍵盤のどこに当たるかが分かる");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bUp=button(bar,"▲ 1 段上へ"), bDn=button(bar,"▼ 1 段下へ"), bPlay=button(bar,"▶ 鳴らす");
    var row=ctrls(el), sc=select(row,"音部記号",["ト音記号","ヘ音記号"]), sa=select(row,"臨時記号",["なし","♯（半音上げる）","♭（半音下げる）"]);
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), pos=2;   // 第 1 線からの位置（線・間を 1 つずつ数える）
    function cur(){var tr=sc.value==="0",dia=pos+(tr?30:18),li=((dia%7)+7)%7,oc=Math.floor(dia/7),a=[0,1,-1][+sa.value];
      return {name:LETTERS[li]+(a===1?"#":a===-1?"b":"")+oc,disp:LETTERS[li]+accs(a)+oc,midi:12*(oc+1)+PCL[li]+a,tr:tr};}
    function draw(){
      var c=cur(),hl={};hl[c.midi]={c:"signal",label:BLACK[c.midi%12]?"":NS[c.midi%12],strong:true};
      var st=staff({s:11,w:140,clef:c.tr?"treble":"bass",items:[{x:84,notes:[c.name],fill:V("signal")}]});
      var lo=c.tr?55:36,hi=c.tr?88:69,k=kbd(lo,hi,{ww:19,wh:80,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
      var where=pos<0||pos>8?'加線の'+(pos%2===0?'上':'間')+'（五線の'+(pos<0?'下':'上')+'）':(pos%2===0?'第 '+(pos/2+1)+' 線':'第 '+((pos+1)/2)+' 間');
      ro.innerHTML='位置: <b>'+where+'</b> ／ 音名 <b>'+c.disp+'</b> ／ MIDI '+c.midi+' ／ '+f(mfreq(c.midi),2)+' Hz';
      bUp.disabled=pos>=12;bDn.disabled=pos<=-4;
    }
    function play(){stopAll();note(cur().midi,ac().currentTime+0.01,1.2,"piano",0.9);}
    bUp.addEventListener("click",function(){if(pos<12){pos++;draw();play();}});
    bDn.addEventListener("click",function(){if(pos>-4){pos--;draw();play();}});
    bPlay.addEventListener("click",play);
    sc.addEventListener("change",function(){draw();play();});sa.addEventListener("change",function(){draw();play();});
    draw();
  };

  /* ============ 02. readquiz — 五線の音を読む練習 ============ */
  REG.readquiz=function(el){
    head(el,"Quiz","五線の音符を読んで、音名を選ぶ");
    var row=ctrls(el), sc=select(row,"音部記号",["ト音記号","ヘ音記号","両方"]);
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bs=LETTERS.split("").map(function(L){var b=button(bar,L+"（"+DOREMI[L]+"）");b.addEventListener("click",function(){answer(L);});return b;});
    var bNext=button(bar,"次の問題 →");
    var ro=readout(el), q=null, done=false, ok=0, total=0;
    function newQ(){
      var mode=+sc.value, tr=mode===0?true:mode===1?false:Math.random()<0.5, prev=q;
      do{var pos=Math.floor(Math.random()*15)-3, dia=pos+(tr?30:18);q={tr:tr,dia:dia,L:LETTERS[((dia%7)+7)%7],oc:Math.floor(dia/7)};}
      while(prev&&prev.dia===q.dia&&prev.tr===q.tr);
      done=false;draw(null);ro.innerHTML='正解 '+ok+' / '+total+'　音符の音名を、下のボタンから選ぶ';
    }
    function draw(res){
      var name=q.L+q.oc, col=res==null?V("ink"):res?V("green"):V("alias");
      var st=staff({s:12,w:150,clef:q.tr?"treble":"bass",items:[{x:96,notes:[name],fill:col,label:res==null?"":q.L+q.oc+"（"+DOREMI[q.L]+"）",lcol:col}],bottom:5.2*12});
      var mid=12*(q.oc+1)+PCL[LETTERS.indexOf(q.L)], hl={}; if(res!=null)hl[mid]={c:res?"green":"alias",label:q.L,strong:true};
      var k=kbd(q.tr?57:36,q.tr?84:64,{ww:16,wh:66,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
    }
    function answer(L){
      if(done)return; done=true; total++; var good=L===q.L; if(good)ok++;
      stopAll(); note(12*(q.oc+1)+PCL[LETTERS.indexOf(q.L)],ac().currentTime+0.01,1.2,"piano",0.9);
      draw(good);
      ro.innerHTML=(good?'<span class="ok">正解</span>':'<span class="warn">ちがう</span>（選んだのは '+L+'）')+' — この音符は <b>'+q.L+q.oc+'</b>（'+DOREMI[q.L]+'） ／ 正解 '+ok+' / '+total;
    }
    bNext.addEventListener("click",newQ); sc.addEventListener("change",newQ);
    newQ();
  };

  /* ---------- 03: 音程の名前（共通） ---------- */
  var QREF_P={1:0,4:5,5:7}, QREF_M={2:2,3:4,6:9,7:11};
  function ivName(lo,hi){
    var a=parse(lo),b=parse(hi),d=b.dia-a.dia+1,s=b.midi-a.midi;
    if(d<1)return null;
    var d0=(d-1)%7+1,k=Math.floor((d-1)/7),s0=s-12*k,q=null,df;
    if(QREF_P[d0]!=null){df=s0-QREF_P[d0];q={0:"完全",1:"増","-1":"減",2:"重増","-2":"重減"}[df];}
    else{df=s0-QREF_M[d0];q={0:"長","-1":"短",1:"増","-2":"減",2:"重増","-3":"重減"}[df];}
    return {d:d,s:s,q:q||"?",d0:d0,k:k,s0:s0};
  }
  var QC={"完全":"green","長":"blue","短":"purple","増":"alias","減":"gold","重増":"alias","重減":"gold"};
  function noteSel(row,label,L,a,o){
    var c=mk("div","ctrl");c.innerHTML='<label>'+label+'</label><div style="display:flex;gap:.35rem"></div>';row.appendChild(c);var box=c.querySelector("div");
    function sel(opts,v){var s=mk("select");s.style.cssText="font-family:var(--mono);font-size:.82rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);flex:1";
      opts.forEach(function(x){var op=mk("option");op.value=x[0];op.textContent=x[1];s.appendChild(op);});s.value=v;box.appendChild(s);return s;}
    var sL=sel(LETTERS.split("").map(function(x){return [x,x+"（"+DOREMI[x]+"）"];}),L),
        sA=sel([["","♮"],["#","♯"],["b","♭"]],a),
        sO=sel([["3","3"],["4","4"],["5","5"]],o);
    return {get:function(){return sL.value+sA.value+sO.value;},els:[sL,sA,sO]};
  }

  /* ============ 03. intname — 2 つの音から音程の名前を求める ============ */
  REG.intname=function(el){
    head(el,"Interval","2 つの音を選ぶと、手順どおりに音程の名前が求まる");
    var row=ctrls(el), lo=noteSel(row,"下の音","C","","4"), hi=noteSel(row,"上の音","E","","4");
    var bar=mk("div","pbtns");el.appendChild(bar);
    var b1=button(bar,"▶ 順に"),b2=button(bar,"▶ 同時に");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function draw(){
      var A=lo.get(),B=hi.get(),pa=parse(A),pb=parse(B),r=ivName(A,B);
      if(!r||pb.midi<pa.midi){view.innerHTML='<div style="padding:1rem;color:var(--alias)">上の音を、下の音以上の高さにしてください</div>';ro.innerHTML="";return null;}
      var col=V(QC[r.q]||"signal"),hl={};hl[pa.midi]={c:"signal",label:nname(A,false),strong:true};hl[pb.midi]={c:QC[r.q]||"signal",label:nname(B,false),strong:true};
      var clf=pa.midi>=55?"treble":pb.midi<=64?"bass":"grand";
      var st=staff({s:10,w:250,clef:clf,items:[{x:62,notes:[A],fill:V("signal")},{x:112,notes:[B],fill:col},{x:190,notes:[A,B],fills:[V("signal"),col],label:"同時に",lcol:V("muted"),lbold:false}]});
      var klo=Math.floor(pa.midi/12)*12,khi=Math.max(klo+11,Math.floor(pb.midi/12)*12+11),k=kbd(klo,khi,{ww:khi-klo>23?13:19,wh:72,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
      var letters=[];for(var i=0;i<r.d;i++)letters.push(LETTERS[(pa.li+i)%7]);
      var nm=r.q+" "+r.d+" 度",extra=r.k>0&&r.d!==8?'（= '+r.q+' '+r.d0+' 度 + '+r.k+' オクターブ）':'';
      ro.innerHTML='① 文字を数える: '+letters.join(" ")+' → <b>'+r.d+' 度</b><br>② 半音を数える: '+nname(A)+' から '+nname(B)+' まで <b>'+r.s+'</b> 個'+
        '<br>③ '+r.d0+' 度で半音 '+r.s0+' 個 → <b style="color:'+col+'">'+nm+'</b>'+extra;
      return {a:pa.midi,b:pb.midi};
    }
    function go(sim){var r=draw();if(!r)return;playEvents(sim?[{t:0,d:1.8,m:[r.a,r.b]}]:[{t:0,d:0.6,m:[r.a]},{t:0.62,d:1.1,m:[r.b]}],{timbre:"piano"});}
    lo.els.concat(hi.els).forEach(function(s){s.addEventListener("change",draw);});
    b1.addEventListener("click",function(){go(false);});b2.addEventListener("click",function(){go(true);});
    draw();
  };

  /* ============ 03. invert — 音程の転回 ============ */
  REG.invert=function(el){
    head(el,"Inversion","下の音を 1 オクターブ上げて、上下を入れ替える");
    var LIST=[["D4","長 2 度"],["Eb4","短 3 度"],["E4","長 3 度"],["F4","完全 4 度"],["F#4","増 4 度"],["G4","完全 5 度"],["A4","長 6 度"],["Bb4","短 7 度"],["B4","長 7 度"]];
    var row=ctrls(el),sel=select(row,"元の音程（下の音は C4）",LIST.map(function(x){return x[1]+"（C–"+nname(x[0],false)+"）";}));sel.value="2";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var b1=button(bar,"▶ 元の音程"),b2=button(bar,"▶ 転回した音程");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function cur(){var u=LIST[+sel.value][0];return {u:u,a:ivName("C4",u),b:ivName(u,"C5")};}
    function draw(){
      var c=cur(),ca=V(QC[c.a.q]),cb=V(QC[c.b.q]);
      var st=staff({s:10,w:280,clef:"treble",items:[{x:70,notes:["C4",c.u],fill:ca,label:c.a.q+" "+c.a.d+" 度",lcol:ca},{x:200,notes:[c.u,"C5"],fill:cb,label:c.b.q+" "+c.b.d+" 度",lcol:cb}]});
      var hl={};hl[60]={c:QC[c.a.q],label:"C"};hl[parse(c.u).midi]={c:"signal",label:nname(c.u,false),strong:true};hl[72]={c:QC[c.b.q],label:"C"};
      var k=kbd(60,72,{ww:22,wh:76,hl:hl,names:null});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
      ro.innerHTML='元: <b style="color:'+ca+'">'+c.a.q+' '+c.a.d+' 度</b>（半音 '+c.a.s+'） → 転回: <b style="color:'+cb+'">'+c.b.q+' '+c.b.d+' 度</b>（半音 '+c.b.s+'）'+
        '<br>度数の和 '+c.a.d+' + '+c.b.d+' = <b>'+(c.a.d+c.b.d)+'</b> ／ 半音の和 '+c.a.s+' + '+c.b.s+' = <b>'+(c.a.s+c.b.s)+'</b>';
    }
    sel.addEventListener("change",draw);
    b1.addEventListener("click",function(){var c=cur();playEvents([{t:0,d:1.8,m:[60,parse(c.u).midi]}],{timbre:"piano"});});
    b2.addEventListener("click",function(){var c=cur();playEvents([{t:0,d:1.8,m:[parse(c.u).midi,72]}],{timbre:"piano"});});
    draw();
  };

  /* ============ 03. intquiz — 音程の聞き分け ============ */
  REG.intquiz=function(el){
    head(el,"Ear","鳴った 2 つの音の音程を聞き分ける");
    var row=ctrls(el),sm=select(row,"聞き方",["順に（旋律的）","同時に（和声的）"]),sr=select(row,"出題の範囲",["短 3 度・長 3 度・完全 5 度・完全 8 度","1 オクターブ内のすべて"]);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bQ=button(bar,"▶ 出題"),bR=button(bar,"もう一度");
    var abar=mk("div","pbtns");el.appendChild(abar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    var ALL=[[1,"短 2 度"],[2,"長 2 度"],[3,"短 3 度"],[4,"長 3 度"],[5,"完全 4 度"],[6,"増 4 度"],[7,"完全 5 度"],[8,"短 6 度"],[9,"長 6 度"],[10,"短 7 度"],[11,"長 7 度"],[12,"完全 8 度"]];
    var q=null,done=false,ok=0,total=0;
    function pool(){return sr.value==="0"?ALL.filter(function(x){return [3,4,7,12].indexOf(x[0])>=0;}):ALL;}
    function buttons(){abar.innerHTML="";pool().forEach(function(x){var b=button(abar,x[1]);b.addEventListener("click",function(){answer(x);});});}
    function play(){if(!q)return;var sim=sm.value==="1";playEvents(sim?[{t:0,d:1.8,m:[q.r,q.r+q.iv[0]]}]:[{t:0,d:0.6,m:[q.r]},{t:0.65,d:1.1,m:[q.r+q.iv[0]]}],{timbre:"piano"});}
    function newQ(){var p=pool(),iv=p[Math.floor(Math.random()*p.length)],r=48+Math.floor(Math.random()*20);q={r:r,iv:iv};done=false;view.innerHTML='<div style="padding:.8rem;color:var(--muted);text-align:center">聞いて、下のボタンから音程を選ぶ</div>';
      ro.innerHTML='正解 '+ok+' / '+total;play();}
    function answer(x){
      if(!q||done)return;done=true;total++;var good=x[0]===q.iv[0];if(good)ok++;
      var hl={};hl[q.r]={c:"signal",label:NS[q.r%12],strong:true};hl[q.r+q.iv[0]]={c:good?"green":"alias",label:NS[(q.r+q.iv[0])%12],strong:true};
      var lo=Math.floor(q.r/12)*12,k=kbd(lo,lo+23,{ww:15,wh:62,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;justify-content:center">'+svgWrap(k.w,k.h,k.svg)+'</div>';
      ro.innerHTML=(good?'<span class="ok">正解</span>':'<span class="warn">ちがう</span>（選んだのは '+x[1]+'）')+' — 答えは <b>'+q.iv[1]+'</b>（半音 '+q.iv[0]+'） ／ 正解 '+ok+' / '+total;
    }
    bQ.addEventListener("click",newQ);bR.addEventListener("click",play);sr.addEventListener("change",function(){buttons();q=null;view.innerHTML="";ro.innerHTML='正解 '+ok+' / '+total;});
    buttons();view.innerHTML='<div style="padding:.8rem;color:var(--muted);text-align:center">「▶ 出題」を押すと 2 つの音が鳴る</div>';ro.innerHTML='正解 0 / 0';
  };

  /* ============ 04. beats — うなり ============ */
  REG.beats=function(el){
    head(el,"Beats","440 Hz に、少しずつ高い音を重ねる");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 2 つの音を鳴らす");
    var row=ctrls(el),sf=slider(row,"上の音の周波数",440,560,444,0.5);
    var cv=screen(el,170),cc=cctx(cv),ro=readout(el);
    var o1=null,o2=null,g=null;
    function f2(){return +sf.input.value;}
    function stop(){if(g){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.02);o1.stop(t+0.2);o2.stop(t+0.2);o1=o2=g=null;}bp.textContent="▶ 2 つの音を鳴らす";bp.setAttribute("aria-pressed","false");}
    function draw(){
      var d=f2()-440;sf.val.textContent=f(f2(),1)+" Hz";
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=12,x1=w-12,cy=h/2-8,A=h/2-26,T1=1.0,N=Math.round((x1-x0)*3);
      ctx.strokeStyle=C("--signal");ctx.lineWidth=0.7;ctx.beginPath();
      for(var i=0;i<=N;i++){var t=T1*i/N,v=0.5*(Math.sin(2*Math.PI*440*t)+Math.sin(2*Math.PI*f2()*t)),x=x0+(x1-x0)*i/N;i?ctx.lineTo(x,cy-A*v):ctx.moveTo(x,cy-A*v);}ctx.stroke();
      if(d>0){ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.setLineDash([5,4]);
        [1,-1].forEach(function(sg){ctx.beginPath();for(var i=0;i<=400;i++){var t=T1*i/400,x=x0+(x1-x0)*i/400,y=cy-sg*A*Math.abs(Math.cos(Math.PI*d*t));i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();});ctx.setLineDash([]);}
      lab(ctx,"0 s",x0,h-6,C("--muted"),"left");lab(ctx,"1 s",x1,h-6,C("--muted"),"right");
      var zone=d===0?"同じ高さ（うなりなし）":d<12?"うなり（大きさがゆっくり波打つ）":d<60?"ざらざらした粗い響き":"2 つの別の音に分かれて聞こえる";
      ro.innerHTML='周波数の差 <b>'+f(d,1)+' Hz</b> → 1 秒に <b>'+f(d,1)+'</b> 回ふくらむ ／ 聞こえ方の目安: <b>'+zone+'</b><br>半音上（466.2 Hz）なら差は約 26 Hz';
    }
    sf.input.addEventListener("input",function(){draw();if(o2)o2.frequency.setTargetAtTime(f2(),AC.currentTime,0.01);});
    bp.addEventListener("click",function(){
      if(g){stop();return;}stopAll();var ctx=ac();g=ctx.createGain();g.gain.value=0;g.connect(OUT);
      o1=ctx.createOscillator();o2=ctx.createOscillator();o1.frequency.value=440;o2.frequency.value=f2();o1.connect(g);o2.connect(g);o1.start();o2.start();
      g.gain.setTargetAtTime(0.16,ctx.currentTime,0.03);bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    reg(cv,draw);
  };

  /* ============ 04. specmix — スペクトルで見る相性 ============ */
  REG.specmix=function(el){
    head(el,"Spectrum","音の組み合わせを選ぶと、倍音の一致とぶつかりが表示される");
    var P=[["完全 8 度",[0,12],[1,2]],["完全 5 度",[0,7],[1,3/2]],["完全 4 度",[0,5],[1,4/3]],["長 3 度",[0,4],[1,5/4]],["短 3 度",[0,3],[1,6/5]],["長 6 度",[0,9],[1,5/3]],["短 6 度",[0,8],[1,8/5]],
           ["長 2 度",[0,2],[1,9/8]],["短 2 度",[0,1],[1,16/15]],["増 4 度",[0,6],[1,45/32]],["短 7 度",[0,10],[1,16/9]],["長 7 度",[0,11],[1,15/8]],
           ["3 音: C・E・G",[0,4,7],[1,5/4,3/2]],["3 音: C・E♭・G",[0,3,7],[1,6/5,3/2]],["3 音: C・E・G♯",[0,4,8],[1,5/4,25/16]],["3 音: C・E♭・G♭",[0,3,6],[1,6/5,36/25]],["3 音: C・C♯・D",[0,1,2],[1,16/15,9/8]]];
    var row=ctrls(el),sp=select(row,"組み合わせ（下の音は C）",P.map(function(x){return x[0];})),st=select(row,"調律",["平均律（鍵盤の音）","純正な比"]),sr=select(row,"下の音の高さ",["C3","C4","C5"]);
    sp.value="1";sr.value="1";
    var row2=ctrls(el),sh=slider(row2,"倍音の数",1,12,8,1);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el),oscs=[],g=null;
    function cur(){var p=P[+sp.value],root=[48,60,72][+sr.value],f0=mfreq(root),just=st.value==="1";
      var fs=p[1].map(function(sm,i){return just?f0*p[2][i]:mfreq(root+sm);}),names=p[1].map(function(sm){return NS[(root+sm)%12].replace("♯","♯")+(Math.floor((root+sm)/12)-1);});
      if(p[0].indexOf("♭")>=0||p[0]==="短 2 度"||p[0]==="短 3 度"||p[0]==="短 6 度"||p[0]==="短 7 度")names=p[1].map(function(sm){return NF[(root+sm)%12]+(Math.floor((root+sm)/12)-1);});
      return {p:p,fs:fs,names:names,H:+sh.input.value};}
    function stop(){if(g){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.03);oscs.forEach(function(o){o.stop(t+0.25);});oscs=[];g=null;}bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function wave(ctx,H){var re=new Float32Array(H+1),im=new Float32Array(H+1);for(var k=1;k<=H;k++)im[k]=1/k;return ctx.createPeriodicWave(re,im);}
    function start(){stopAll();var c=cur(),ctx=ac();g=ctx.createGain();g.gain.value=0;g.connect(OUT);
      c.fs.forEach(function(fq){var o=ctx.createOscillator();o.setPeriodicWave(wave(ctx,c.H));o.frequency.value=fq;o.connect(g);o.start();oscs.push(o);});
      g.gain.setTargetAtTime(0.12/Math.sqrt(c.fs.length),ctx.currentTime,0.04);bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);}
    function draw(){
      var c=cur();sh.val.textContent=c.H;
      var sv=spec(c.fs.map(function(fq,i){return {f:fq,label:c.names[i],c:SPEC_COLS[i]};}),{H:c.H,w:660,lane:c.fs.length>2?34:42});
      view.innerHTML=svgWrap(sv.w,sv.h,sv.svg,"spec");
      var bw=Math.min(100,sv.rel/2);
      ro.innerHTML=specStats(sv)+'<div style="margin-top:.45rem;height:10px;border-radius:5px;background:var(--line);overflow:hidden"><div style="height:100%;width:'+bw+'%;background:var(--alias)"></div></div>'+
        '<div style="margin-top:.35rem">'+(st.value==="1"?'純正な比: 一致する倍音の周波数は完全に同じ':'平均律: 一致する倍音にも少し差があり、緑の数字の速さでうなる')+'</div>';
      if(g){var c2=cur();if(oscs.length!==c2.fs.length){start();}else{oscs.forEach(function(o,i){o.setPeriodicWave(wave(AC,c2.H));o.frequency.setTargetAtTime(c2.fs[i],AC.currentTime,0.02);});g.gain.setTargetAtTime(0.12/Math.sqrt(c2.fs.length),AC.currentTime,0.04);}}
    }
    [sp,st,sr].forEach(function(s){s.addEventListener("change",draw);});sh.input.addEventListener("input",draw);
    bp.addEventListener("click",function(){if(g){stop();return;}start();});
    draw();
  };

  /* ============ 04. dcurve — 上の音を連続して動かす（不協和度の曲線） ============ */
  REG.dcurve=function(el){
    head(el,"Curve","上の音を連続して動かし、粗さの谷を探す");
    var row=ctrls(el),sc=slider(row,"上の音（C4 からのセント）",0,1200,386,1),sm=select(row,"音の種類",["倍音を 8 つ含む音","純音（倍音なし）"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var cv=screen(el,230),cc=cctx(cv),ro=readout(el);
    var F0=261.6256,curve={},o1=null,o2=null,g=null;
    function Hn(){return sm.value==="0"?8:1;}
    function val(c,H){var f2=F0*Math.pow(2,c/1200),R=0;for(var h=1;h<=H;h++)for(var k=1;k<=H;k++)R+=roughPair(F0*h,1/h,f2*k,1/k);return 100*R/roughRef(8);}
    function getCurve(H){if(!curve[H]){var a=[];for(var c=0;c<=1200;c+=3)a.push(val(c,H));curve[H]=a;}return curve[H];}
    var NAMES=[[0,"完全 1 度"],[100,"短 2 度"],[200,"長 2 度"],[300,"短 3 度"],[400,"長 3 度"],[500,"完全 4 度"],[600,"増 4 度"],[700,"完全 5 度"],[800,"短 6 度"],[900,"長 6 度"],[1000,"短 7 度"],[1100,"長 7 度"],[1200,"完全 8 度"]];
    var RAT=[[1,1],[16,15],[9,8],[6,5],[5,4],[4,3],[7,5],[3,2],[8,5],[5,3],[7,4],[9,5],[15,8],[2,1]];
    function wave(ctx,H){var re=new Float32Array(H+1),im=new Float32Array(H+1);for(var k=1;k<=H;k++)im[k]=1/k;return ctx.createPeriodicWave(re,im);}
    function stop(){if(g){var t=AC.currentTime;g.gain.setTargetAtTime(0,t,0.03);o1.stop(t+0.25);o2.stop(t+0.25);o1=o2=g=null;}bp.textContent="▶ 鳴らす";bp.setAttribute("aria-pressed","false");}
    function draw(){
      var c=+sc.input.value,H=Hn(),a=getCurve(H);sc.val.textContent=c+" セント";
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=30,x1=w-12,y0=h-30,y1=16,X=function(cc_){return x0+(x1-x0)*cc_/1200;},Y=function(v){return y0-(y0-y1)*Math.min(v,110)/110;};
      var step=w<520?2:1;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;for(var k=0;k<=12;k++){ctx.beginPath();ctx.moveTo(X(k*100),y1);ctx.lineTo(X(k*100),y0);ctx.stroke();if(k%step===0)lab(ctx,String(k*100),X(k*100),h-14,C("--muted"),"center");}
      ctx.strokeStyle=C("--muted");ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y0);ctx.stroke();
      ctx.strokeStyle=C(H>1?"--signal":"--muted");ctx.lineWidth=2;ctx.beginPath();a.forEach(function(v,i){var x=X(i*3),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
      var v=val(c,H);ctx.fillStyle=C("--alias");ctx.beginPath();ctx.arc(X(c),Y(v),6,0,TAU);ctx.fill();
      lab(ctx,"粗さ",x0+2,y1+8,C("--muted"),"left");
      var near=NAMES.reduce(function(b,x){return Math.abs(x[0]-c)<Math.abs(b[0]-c)?x:b;}),rat=RAT.reduce(function(b,x){var cx=1200*Math.log(x[0]/x[1])/Math.LN2,cb=1200*Math.log(b[0]/b[1])/Math.LN2;return Math.abs(cx-c)<Math.abs(cb-c)?x:b;});
      var rc=1200*Math.log(rat[0]/rat[1])/Math.LN2;
      ro.innerHTML='上の音 <b>'+f(F0*Math.pow(2,c/1200),1)+' Hz</b>（C4 から '+c+' セント） ／ いちばん近い平均律の音程: <b>'+near[1]+'</b>（'+near[0]+' セント）<br>'+
        'いちばん近い単純な比: <b>'+rat[0]+':'+rat[1]+'</b>（'+f(rc,1)+' セント） ／ 粗さ <b>'+Math.round(v)+'</b>';
    }
    sc.input.addEventListener("input",function(){draw();if(o2)o2.frequency.setTargetAtTime(F0*Math.pow(2,(+sc.input.value)/1200),AC.currentTime,0.01);});
    sm.addEventListener("change",function(){draw();if(g){var H=Hn();o1.setPeriodicWave(wave(AC,H));o2.setPeriodicWave(wave(AC,H));}});
    bp.addEventListener("click",function(){
      if(g){stop();return;}stopAll();var ctx=ac(),H=Hn();g=ctx.createGain();g.gain.value=0;g.connect(OUT);
      o1=ctx.createOscillator();o2=ctx.createOscillator();[o1,o2].forEach(function(o){o.setPeriodicWave(wave(ctx,H));o.connect(g);});
      o1.frequency.value=F0;o2.frequency.value=F0*Math.pow(2,(+sc.input.value)/1200);o1.start();o2.start();
      g.gain.setTargetAtTime(0.1,ctx.currentTime,0.04);bp.textContent="■ 止める";bp.setAttribute("aria-pressed","true");hold(stop);
    });
    reg(cv,draw);
  };

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
        (aug.length?' ／ <b style="color:var(--alias)">増 2 度</b>: '+aug.join("、"):' ／ 増 2 度なし')+
        '<br><span style="color:var(--purple)">紫</span>: 同じ主音の長音階より半音低い音';
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
      return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:.3rem 1rem;justify-content:center"><div style="min-width:10.5rem"><b style="color:var(--'+R.col+')">'+R.nm+'</b><br><span style="font-size:.86rem">'+
        R.sc.slice(0,7).map(function(n,i){var d=r===2&&parse(n).midi%12!==parse(base[i]).midi%12;return d?'<b style="color:var(--signal)">'+nname(n,false)+'</b>':nname(n,false);}).join(" ")+'</span>'+
        '<br><span style="font-size:.74rem;color:var(--muted)">濃い色の鍵: 主音'+(r===2?'・違う音':'')+'</span></div>'+svgWrap(k.w,k.h,k.svg)+'</div>';
    }
    function rel(t,c){return '<div style="text-align:center;font-size:.8rem;margin:.35rem 0;color:var(--'+c+');font-weight:700">↕ '+t+'</div>';}
    function draw(){
      var c=cur();
      view.innerHTML=rowHtml(c,0)+rel("同じ 7 つの音を使う（主音が違う）","green")+rowHtml(c,1)+rel("主音が同じ（3 つの音が違う）","signal")+rowHtml(c,2);
      var R=c.rows, base=R[1].sc, par=R[2].sc, ch=[];
      [2,5,6].forEach(function(i){ch.push("第 "+(i+1)+" 音 "+nname(base[i],false)+" → "+nname(par[i],false));});
      ro.innerHTML='<b>同じ 7 つの音</b>: '+R[1].nm+' と '+R[0].nm+'（'+base.slice(0,7).map(function(n){return nname(n,false);}).join(" ")+'）。'+
        nname(R[0].sc[0],false)+' は '+nname(base[0],false)+' の短 3 度下にあり、'+R[0].nm+'の第 3 音が '+nname(base[0],false)+' である'+
        '<br><b>同じ主音</b>: '+R[1].nm+' と '+R[2].nm+'。違う音は '+ch.join("、");
      btns.forEach(function(b){b.relabel();});
    }
    var btns=[0,1,2].map(function(r){
      return _w06_btn(bar,function(){return "▶ "+cur().rows[r].nm;},function(){return _w06_run(cur().rows[r].sc.map(function(n){return parse(n).midi;}),0.32);},
        function(e,i){hot={r:r,i:e[i].k};draw();},function(){hot={r:-1,i:-1};draw();});
    });
    sT.addEventListener("change",function(){hot={r:-1,i:-1};draw();});
    draw();
  };

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
    if(x==="IV"&&y==="I")return ["変終止","導音も三全音も含まず、主音を残したまま進むので、全終止より穏やかに終わる"];
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

  /* ---------- 13: ノンダイアトニックコード（共通） ---------- */
  var _w13_CMAJ=[0,2,4,5,7,9,11];
  function _w13_out(m){return _w13_CMAJ.indexOf(((m%12)+12)%12)<0;}
  function _w13_pc(m){return ((m%12)+12)%12;}
  /* ベース（根音）を E2〜D♯3 に置く（再生カードの bass: on と同じ高さ） */
  function _w13_bass(sym){var c=chordParse(sym),pc=c.bassPc!=null?c.bassPc:c.rootPc;return 40+((pc-40)%12+12)%12;}
  /* 押すと鳴らし、もう一度押すと止めるボタン。steps() は playEvents の列、show(i) は i 番目が鳴り始めたとき（-1 は終わり） */
  function _w13_btn(bar,label,steps,show){
    var b=button(bar,label);
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var ev=steps();
      playEvents(ev,{timbre:"piano",onStep:function(i){show(i,b);},onEnd:function(){b.setAttribute("aria-pressed","false");show(-1,b);}});
      b.setAttribute("aria-pressed","true");
      hold(function(){b.setAttribute("aria-pressed","false");show(-1,b);});
    });
    return b;
  }
  /* 和音の列を、ベース付きで順に鳴らす形にする（各和音の長さ d[i] 秒） */
  function _w13_seq(list,d){var t=0;return list.map(function(c,i){var e={t:t,d:d[i]*0.98,m:[c.b].concat(c.m)};t+=d[i];return e;});}
  function _w13_names(ns){return ns.map(function(n){return nname(n,false);});}
  /* 半音の数を +2 / −7 / 0 の形にする */
  function _w13_sg(d){return d>0?"+"+d:d<0?"−"+(-d):"0";}
  /* 和音の構成音の名前を、根音・3 度・5 度・7 度の順に並べる */
  function _w13_order(sym,ms,ns){var r=chordParse(sym).rootPc,ix=ms.map(function(m,i){return i;});
    ix.sort(function(a,b){return ((ms[a]-r)%12+12)%12-((ms[b]-r)%12+12)%12;});return ix.map(function(i){return nname(ns[i],false);});}

  /* ============ 13. w13_secdom — 目標の和音とセカンダリードミナント ============ */
  REG.w13_secdom=function(el){
    head(el,"Secondary","目標の和音 X を選ぶと、X へ向かうセカンダリードミナント V7/X が表示される");
    var T=[
      {x:"Dm",xd:"IIm",v:"A7",k:"ニ短調",same:"Am",vm:[69,73,76,79],xm:[69,74,77],sm:[69,72,76]},
      {x:"Em",xd:"IIIm",v:"B7",k:"ホ短調",same:"Bdim",vm:[59,63,66,69],xm:[59,64,67],sm:[59,62,65]},
      {x:"F",xd:"IV",v:"C7",k:"ヘ長調",same:"C",vm:[60,64,67,70],xm:[60,65,69],sm:[60,64,67]},
      {x:"G",xd:"V",v:"D7",k:"ト長調",same:"Dm",vm:[62,66,69,72],xm:[62,67,71],sm:[62,65,69]},
      {x:"Am",xd:"VIm",v:"E7",k:"イ短調",same:"Em",vm:[64,68,71,74],xm:[64,69,72],sm:[64,67,71]}];
    var row=ctrls(el), sel=select(row,"目標の和音 X（ハ長調）",T.map(function(t){return t.x+"（"+t.xd+"）";})); sel.value="3";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var view=mk("div","wscreen"); view.style.padding=".6rem";
    var ro=readout(el), act=null;   /* act = {seq:"v"|"s", i:0..2} */
    var I={b:_w13_bass("C"),m:[60,64,67]};
    function cur(){return T[+sel.value];}
    function events(kind){var t=cur(),mid=kind==="v"?{b:_w13_bass(t.v),m:t.vm}:{b:_w13_bass(t.same),m:t.sm};
      return _w13_seq([I,mid,{b:_w13_bass(t.x),m:t.xm}],[1.2,1.5,2.2]);}
    function show(kind){return function(i){act=i<0?null:{seq:kind,i:i};draw();};}
    _w13_btn(bar,"▶ I → V7/X → X",function(){return events("v");},show("v"));
    _w13_btn(bar,"▶ I → 同じ根音のダイアトニックコード → X",function(){return events("s");},show("s"));
    el.appendChild(view); el.appendChild(ro);
    function draw(){
      var t=cur(), vn=chordSpell(t.v,t.vm), xn=chordSpell(t.x,t.xm), sn=chordSpell(t.same,t.sm);
      var lt=t.vm[1], root=lt+1;
      /* 鍵盤: 鳴っている和音（鳴っていないときは V7/X）。調の外の音は赤、X の根音は緑 */
      var showM=t.vm, showN=vn, title="V7/X = "+t.v;
      if(act&&act.i===0){showM=I.m;showN=chordSpell("C",I.m);title="I = C";}
      else if(act&&act.i===1){if(act.seq==="s"){showM=t.sm;showN=sn;title=t.same+"（同じ根音のダイアトニックコード）";}}
      else if(act&&act.i===2){showM=t.xm;showN=xn;title="X = "+t.x;}
      var hl={};
      if(!act){hl[root]={c:"green",label:nname(xn[t.xm.indexOf(root)],false),strong:false};}
      showM.forEach(function(m,i){hl[m]={c:_w13_out(m)?"signal":"muted",label:nname(showN[i],false),strong:true};});
      var k=kbd(59,79,{ww:22,wh:84,hl:hl,names:null});
      var kb='<div style="text-align:center"><div style="font-size:.8rem;font-weight:700;margin-bottom:.3rem">'+esc(title)+'</div>'+svgWrap(k.w,k.h,k.svg)+'</div>';
      /* 五線: V7/X → X ‖ 同じ根音のダイアトニックコード → X */
      function lc(seq,i){return act&&act.seq===seq&&act.i===i?V("signal"):V("ink");}
      function fills(ms){return ms.slice().sort(function(a,b){return a-b;}).map(function(m){return _w13_out(m)?V("signal"):V("ink");});}
      var sv=staff({s:9,w:430,clef:"treble",items:[
        {x:70,notes:vn,fills:fills(t.vm),label:t.v,lcol:lc("v",1)},
        {x:150,notes:xn,label:t.x,lcol:lc("v",2)},
        {x:205,bar:"double"},
        {x:270,notes:sn,label:t.same,lcol:lc("s",1)},
        {x:350,notes:xn,label:t.x,lcol:lc("s",2)}]});
      var cap='<div style="display:flex;justify-content:space-around;font-size:.72rem;color:var(--muted);max-width:430px;margin:0 auto">'+
        '<span>V7/X → X</span><span>同じ根音のダイアトニックコード → X</span></div>';
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:flex-end">'+kb+
        '<div>'+svgWrap(sv.w,sv.h,sv.svg)+cap+'</div></div>';
      /* 読み取り */
      var names=_w13_names(vn), outs=[];
      t.vm.forEach(function(m,i){if(_w13_out(m))outs.push(names[i]+"（"+["根音","導音","5 度の音","7 度の音"][i]+"）");});
      var xPc=chordParse(t.x).rootPc, minor=chordParse(t.x).ivs.indexOf(3)>=0, x3=(xPc+(minor?3:4))%12;
      var x3n=nname(xn[t.xm.map(_w13_pc).indexOf(x3)],false), drop=(_w13_pc(t.vm[3])-x3+12)%12;
      var snames=_w13_names(sn), ch=[];
      for(var i=0;i<3;i++)if(snames[i]!==names[i])ch.push(snames[i]+" を "+names[i]+" に");
      var vfun="V7/"+t.xd;
      ro.innerHTML='X = <b>'+t.x+'（'+t.xd+'）</b> を主和音とみなす調: '+t.k+' ／ <b style="color:var(--signal)">'+vfun+' = '+t.v+'</b>（ディグリーネーム '+roman(t.v,"C")+'）<br>'+
        '構成音 <b>'+names.join(" ")+'</b> ／ ハ長調の外の音: <b style="color:var(--signal)">'+outs.join("・")+'</b>'+(t.x==="F"?'（導音 E はハ長調の音）':'')+'<br>'+
        '解決: '+names[1]+' → '+nname(xn[t.xm.indexOf(root)],false)+'（半音上） ／ 7 度の音 '+names[3]+' → '+x3n+'（'+(drop===1?'半音下':'全音下')+'）<br>'+
        '同じ根音のダイアトニックコード '+t.same+'（'+snames.join(" ")+'）'+(ch.length?'の '+ch.join("、")+'上げ、':'に ')+'7 度の音 '+names[3]+' を足した形';
    }
    sel.addEventListener("change",function(){stopAll();act=null;draw();});
    draw();
  };

  /* ============ 13. w13_borrow — ハ長調の和音と、ハ短調から借りた和音 ============ */
  REG.w13_borrow=function(el){
    head(el,"Borrow","同じ番号の和音を、ハ長調のものとハ短調から借りたものとで比べる");
    var DG=["I","II","III","IV","V","VI","VII"];
    var MAJ=[["C","CM7"],["Dm","Dm7"],["Em","Em7"],["F","FM7"],["G","G7"],["Am","Am7"],["Bdim","Bm7(b5)"]];
    var MIN=[["Cm","Cm7"],["Ddim","Dm7(b5)"],["Eb","EbM7"],["Fm","Fm7"],["Gm","Gm7"],["Ab","AbM7"],["Bb","Bb7"]];
    var SMAJ=spellScale("C4",MAJOR,14), SMIN=spellScale("C4",NAT_MINOR,14);
    var row=ctrls(el), sd=select(row,"番号",DG), sf=select(row,"和音の形",["三和音","セブンスコード"]); sd.value="3";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var view=mk("div","wscreen"); view.style.padding=".6rem";
    var ro=readout(el), act=null;
    var I={b:_w13_bass("C"),m:[60,64,67]};
    function cur(){var j=+sd.value,n=sf.value==="1"?4:3,mj=[],mn=[];
      for(var k=0;k<n;k++){mj.push(SMAJ[j+2*k]);mn.push(SMIN[j+2*k]);}
      var a=MAJ[j][n-3],b=MIN[j][n-3];
      return {a:a,b:b,an:mj,bn:mn,am:mj.map(function(q){return parse(q).midi;}),bm:mn.map(function(q){return parse(q).midi;})};}
    function events(which){var c=cur();var mid=which==="a"?{b:_w13_bass(c.a),m:c.am}:{b:_w13_bass(c.b),m:c.bm};
      return _w13_seq([I,mid,I],[1.2,1.6,2.2]);}
    function show(which){return function(i){act=i<0?null:{w:which,i:i};draw();};}
    _w13_btn(bar,"▶ I → ハ長調の和音 → I",function(){return events("a");},show("a"));
    _w13_btn(bar,"▶ I → 借りた和音 → I",function(){return events("b");},show("b"));
    el.appendChild(view); el.appendChild(ro);
    function disp(s){return s.replace(/b5/g,"♭5").replace(/^([A-G])b/,"$1♭");}
    function draw(){
      var c=cur(), an=_w13_names(c.an), bn=_w13_names(c.bn), ch=[];
      for(var i=0;i<an.length;i++)if(an[i]!==bn[i])ch.push(i);
      function board(ms,ns,isB,title,on){
        var hl={};ms.forEach(function(m,i){var changed=ch.indexOf(i)>=0;hl[m]={c:changed?(isB?"signal":"blue"):"muted",label:nname(ns[i],false),strong:true};});
        var k=kbd(60,83,{ww:16,wh:66,hl:hl,names:null});
        return '<div style="text-align:center"><div style="font-size:.8rem;font-weight:700;margin-bottom:.3rem;color:'+(on?V("signal"):V("ink"))+'">'+esc(title)+'</div>'+svgWrap(k.w,k.h,k.svg)+'</div>';}
      var onA=act&&act.w==="a"&&act.i===1, onB=act&&act.w==="b"&&act.i===1;
      var ra=roman(c.a,"C"), rb=roman(c.b,"C");
      var fa=c.am.map(function(m,i){return ch.indexOf(i)>=0?V("blue"):V("ink");}), fb=c.bm.map(function(m,i){return ch.indexOf(i)>=0?V("signal"):V("ink");});
      var sv=staff({s:9,w:260,clef:"treble",items:[{x:90,notes:c.an,fills:fa,label:disp(c.a)+"（"+ra+"）",lcol:onA?V("signal"):V("ink")},
                                                    {x:200,notes:c.bn,fills:fb,label:disp(c.b)+"（"+rb+"）",lcol:onB?V("signal"):V("ink")}]});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:flex-end">'+
        board(c.am,c.an,false,"ハ長調の和音: "+disp(c.a)+"（"+ra+"）",onA)+board(c.bm,c.bn,true,"ハ短調から借りた和音: "+disp(c.b)+"（"+rb+"）",onB)+
        svgWrap(sv.w,sv.h,sv.svg)+'</div>';
      var hasAb=c.bm.some(function(m){return _w13_pc(m)===8;});
      ro.innerHTML='<b>'+disp(c.a)+'（'+ra+'）</b> '+an.join(" ")+' → <b style="color:var(--signal)">'+disp(c.b)+'（'+rb+'）</b> '+bn.join(" ")+'<br>'+
        '変わる音: '+ch.map(function(i){return an[i]+' → <b style="color:var(--signal)">'+bn[i]+'</b>';}).join("、")+'（どれも半音下がる。'+ch.map(function(i){return bn[i];}).join("・")+' はハ長調の外の音）<br>'+
        (hasAb?'<b style="color:var(--purple)">A♭ を含む</b>: I の 5 度の音であり V の根音でもある G の半音上にあり、I や V へ進むとき G へ半音で下がれる'
              :'A♭ は含まない');
    }
    [sd,sf].forEach(function(s){s.addEventListener("change",function(){stopAll();act=null;draw();});});
    draw();
  };

  /* ============ 13. w13_tritone — ドミナントと裏コード ============ */
  REG.w13_tritone=function(el){
    head(el,"Tritone","ドミナントと裏コードが共有する三全音と、ベースの動き");
    var T=[{x:"C",xd:"I",d:"G7",f:"V7",s:"Db7"},{x:"Dm",xd:"IIm",d:"A7",f:"V7/IIm",s:"Eb7"},{x:"Em",xd:"IIIm",d:"B7",f:"V7/IIIm",s:"F7"},
           {x:"F",xd:"IV",d:"C7",f:"V7/IV",s:"Gb7"},{x:"G",xd:"V",d:"D7",f:"V7/V",s:"Ab7"},{x:"Am",xd:"VIm",d:"E7",f:"V7/VIm",s:"Bb7"}];
    var row=ctrls(el), sel=select(row,"目標の和音（ハ長調）",T.map(function(t){return t.x+"（"+t.xd+"）";}));
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var view=mk("div","wscreen"); view.style.padding=".6rem";
    var ro=readout(el), act=null;
    function inOct(pc,lo){return lo+((pc-lo)%12+12)%12;}
    /* 三全音の 2 音は、ドミナントと裏コードで同じ鍵に置く */
    function cur(){
      var t=T[+sel.value], r=chordParse(t.x).rootPc, minor=chordParse(t.x).ivs.indexOf(3)>=0;
      var lt=inOct(r-1,60), sev=inOct(r+5,60);
      var dm=[lt,sev,inOct(r+2,60)].sort(function(a,b){return a-b;}), sm=[lt,sev,inOct(r+8,60)].sort(function(a,b){return a-b;});
      var x3=sev-(minor?2:1), xr=lt+1, x5=inOct(r+7,55);
      return {t:t,r:r,lt:lt,sev:sev,d:{b:inOct(r+7,48),m:dm},s:{b:inOct(r+1,48),m:sm},x:{b:inOct(r,48),m:[x5,x3,xr].sort(function(a,b){return a-b;})}};}
    function events(which){var c=cur();return _w13_seq([c[which],c.x],[1.6,2.4]);}
    function show(which){return function(i){act=i<0?null:{w:which,i:i};draw();};}
    _w13_btn(bar,"▶ ドミナント → 目標",function(){return events("d");},show("d"));
    _w13_btn(bar,"▶ 裏コード → 目標",function(){return events("s");},show("s"));
    el.appendChild(view); el.appendChild(ro);
    function draw(){
      var c=cur(), t=c.t;
      var dAll=[c.d.b].concat(c.d.m), sAll=[c.s.b].concat(c.s.m);
      var dn=chordSpell(t.d,dAll), sn=chordSpell(t.s,sAll);
      var dPcs=dAll.map(_w13_pc), sPcs=sAll.map(_w13_pc), tri=[_w13_pc(c.lt),_w13_pc(c.sev)];
      var lab={}; dAll.forEach(function(m,i){lab[_w13_pc(m)]=nname(dn[i],false);});
      sAll.forEach(function(m,i){var p=_w13_pc(m),nm=nname(sn[i],false);lab[p]=lab[p]&&lab[p]!==nm?lab[p]+"（"+nm+"）":nm;});
      /* 12 の音の円（半音ずつ、C が上） */
      var W=250,H=250,cx=125,cy=125,R=84,b=[];
      function P(k){var a=(-90+30*k)*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];}
      function poly(pcs,col,fill){var q=pcs.slice().sort(function(a,b){return a-b;});return '<polygon points="'+q.map(function(k){return P(k).join(",");}).join(" ")+'" fill="'+fill+'" stroke="'+col+'" stroke-width="1.8"/>';}
      b.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="'+V("line")+'" stroke-width="1.2"/>');
      b.push(poly(dPcs,V("blue"),V("blue-soft")));b.push(poly(sPcs,V("gold"),V("gold-soft")));
      var p1=P(tri[0]),p2=P(tri[1]);b.push(ln(p1[0],p1[1],p2[0],p2[1],V("signal"),3.4));
      var q1=P(dPcs[0]),q2=P(sPcs[0]);b.push(ln(q1[0],q1[1],q2[0],q2[1],V("muted"),1.2,"4,4"));
      for(var k=0;k<12;k++){var p=P(k),inD=dPcs.indexOf(k)>=0,inS=sPcs.indexOf(k)>=0,sh=tri.indexOf(k)>=0;
        var col=sh?V("signal"):inD?V("blue"):inS?V("gold"):V("muted"),on=inD||inS;
        b.push('<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(on?6.5:3)+'" fill="'+(on?col:V("panel"))+'" stroke="'+col+'" stroke-width="1.4"/>');
        var a=(-90+30*k)*Math.PI/180, txt=lab[k]||(BLACK[k]?NF[k]:NS[k]);
        b.push(tx(cx+(R+20)*Math.cos(a),cy+(R+20)*Math.sin(a)+4,txt,"middle",10.5,on?V("ink"):V("muted"),on));}
      var clk=svgWrap(W,H,b.join(""));
      function board(all,ns,own,title,on){var hl={};all.forEach(function(m,i){hl[m]={c:tri.indexOf(_w13_pc(m))>=0?"signal":own,label:nname(ns[i],false),strong:true};});
        var kk=kbd(48,71,{ww:14,wh:58,hl:hl,names:null});
        return '<div style="text-align:center"><div style="font-size:.8rem;font-weight:700;margin-bottom:.25rem;color:'+(on?V("signal"):V(own))+'">'+esc(title)+'</div>'+svgWrap(kk.w,kk.h,kk.svg)+'</div>';}
      var dd=t.d.replace("b","♭"), ss=t.s.replace("b","♭");
      var boards='<div style="display:flex;flex-direction:column;gap:.5rem">'+board(dAll,dn,"blue","ドミナント "+t.f+" = "+dd,act&&act.w==="d"&&act.i===0)+
        board(sAll,sn,"gold","裏コード "+roman(t.s,"C")+" = "+ss,act&&act.w==="s"&&act.i===0)+'</div>';
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+clk+boards+'</div>';
      var bx=c.x.b, sx=_w13_names(chordSpell(t.x,[bx]))[0];
      var dsteps=bx-c.d.b, ssteps=bx-c.s.b;
      ro.innerHTML='<b style="color:var(--blue)">'+dd+'</b>（'+_w13_order(t.d,dAll,dn).join(" ")+'） と <b style="color:var(--gold)">'+ss+'</b>（'+_w13_order(t.s,sAll,sn).join(" ")+'）<br>'+
        '共有する三全音: <b style="color:var(--signal)">'+lab[tri[0]]+' と '+lab[tri[1]]+'</b>（半音 6 つ） ／ 根音 '+_w13_names(dn)[0]+' と '+_w13_names(sn)[0]+' も半音 6 つ離れている<br>'+
        '目標 '+t.x+' へのベース: '+_w13_names(dn)[0]+' → '+sx+'（'+_w13_sg(dsteps)+'） ／ '+_w13_names(sn)[0]+' → '+sx+'（'+_w13_sg(ssteps)+'、半音下）';
    }
    sel.addEventListener("change",function(){stopAll();act=null;draw();});
    draw();
  };

  /* ============ 13. w13_reharm — ダイアトニックな進行を置き換える ============ */
  REG.w13_reharm=function(el){
    head(el,"Reharmonize","ダイアトニックコードだけの進行の一部を、この章の和音に置き換える");
    var row=ctrls(el);
    var sA=select(row,"I と IIm7 の間",["なし","V7/IIm（A7）をはさむ","経過的なディミニッシュ（C♯dim7）をはさむ"]),
        sB=select(row,"IIm7 の次のドミナント",["V7（G7）","裏コード ♭II7（D♭7）"]),
        sC=select(row,"IV と I の間",["なし","IVm（Fm）をはさむ"]);
    var band=mk("div",""); band.style.cssText="display:flex;flex-wrap:wrap;gap:4px;margin-top:.8rem"; el.appendChild(band);
    var card=mk("div","play"); el.appendChild(card);
    var ro=readout(el);
    var ROLE={"C":["I","T","blue"],"A7":["V7/IIm","D","signal"],"C♯dim7":["経過的なディミニッシュ","","gold"],"Dm7":["IIm7","SD","green"],
              "G7":["V7","D","signal"],"D♭7":["裏コード","D","signal"],"F":["IV","SD","green"],"Fm":["IVm","SDm","purple"]};
    function list(){var L=["C"];if(sA.value==="1")L.push("A7");if(sA.value==="2")L.push("C♯dim7");L.push("Dm7");L.push(sB.value==="1"?"D♭7":"G7");L.push("C","F");if(sC.value==="1")L.push("Fm");L.push("C");return L;}
    function draw(){
      stopAll();
      var L=list();
      band.innerHTML=L.map(function(s){var r=ROLE[s];
        var ms=chordMidis(s,60),sp=chordSpell(s,ms),outN=[];ms.forEach(function(m,i){if(_w13_out(m))outN.push(nname(sp[i],false));});
        return '<div style="flex:1 1 4.2rem;min-width:4.2rem;border:1px solid var(--line);border-radius:8px;padding:.3rem .25rem;text-align:center;background:var(--screen);font-size:.74rem;line-height:1.35">'+
          '<b style="font-size:.9rem">'+esc(s)+'</b><br><span style="color:var(--'+r[2]+');font-weight:700">'+esc(r[0])+(r[1]?'（'+r[1]+'）':'')+'</span><br>'+
          '<span style="color:var(--signal)">'+(outN.length?esc(outN.join("・")):'&nbsp;')+'</span></div>';}).join("");
      card.innerHTML="";
      playMulti(card,{chords:L.join(" "),key:"C",show:"chords kbd staff",bass:"on",tempo:"120",label:"置き換えた進行（ハ長調）"});
      var bs=L.map(_w13_bass), steps=[];
      for(var i=1;i<bs.length;i++)steps.push(bs[i]-bs[i-1]);
      var bn=L.map(function(s){return nname(chordSpell(s,[_w13_bass(s)])[0],false);});
      var nOut=L.filter(function(s){var c=chordParse(s);return c.ivs.some(function(v){return _w13_CMAJ.indexOf((c.rootPc+v)%12)<0;});}).length;
      ro.innerHTML='ベースの動き（半音の数）: '+bn.map(function(n,i){return i?'<span style="color:var(--muted)">('+_w13_sg(steps[i-1])+')</span> '+n:n;}).join(" → ")+'<br>'+
        '調の外の音を含む和音: <b>'+nOut+'</b> 個（各和音の下の赤い音名が調の外の音）';
    }
    [sA,sB,sC].forEach(function(s){s.addEventListener("change",draw);});
    draw();
  };

  /* ============ 14. 転調 — 共通の部品 ============ */
  var _w14_KJ={C:"ハ",D:"ニ",E:"ホ",F:"ヘ",G:"ト",A:"イ",B:"ロ"};
  var _w14_KEYS=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B","Cm","C#m","Dm","Ebm","Em","Fm","F#m","Gm","G#m","Am","Bbm","Bm"];
  function _w14_kname(k){var m=/^([A-G])([#b]?)(m?)$/.exec(k);return (m[2]==="#"?"嬰":m[2]==="b"?"変":"")+_w14_KJ[m[1]]+(m[3]?"短調":"長調");}
  function _w14_cn(s){return String(s).replace(/#/g,"♯").replace(/([A-G])b/g,"$1♭");}
  function _w14_strip(n){return String(n).replace(/-?\d+$/,"");}
  function _w14_tones(sym){return chordSpell(sym,chordMidis(sym,48)).map(_w14_strip);}
  function _w14_scale(k){var mi=/m$/.test(k),t=mi?k.slice(0,-1):k;return spellScale(t+"4",mi?NAT_MINOR:MAJOR,7).map(_w14_strip);}
  function _w14_pc(n){return ((parse(n+"4").midi%12)+12)%12;}
  /* 調の 7 つのダイアトニックコード（短調は自然短音階） */
  function _w14_triads(k){var sc=_w14_scale(k),out=[];
    for(var j=0;j<7;j++){var r=sc[j],a=sc[(j+2)%7],c=sc[(j+4)%7],pr=_w14_pc(r),i3=(_w14_pc(a)-pr+12)%12,i5=(_w14_pc(c)-pr+12)%12;
      var q=i3===4&&i5===7?"":i3===3&&i5===7?"m":i3===3&&i5===6?"dim":"aug",sym=r+q;
      out.push({sym:sym,deg:roman(sym,k),key:[pr,_w14_pc(a),_w14_pc(c)].sort(function(x,y){return x-y;}).join(",")});}
    return out;}
  function _w14_v7(k){return _w14_scale(k)[4]+"7";}
  /* 和音の列 → 鳴らす音（なるべく動かない配置 + 根音の低音） */
  function _w14_events(seq,spb){var prev=null,evs=[],t=0;
    seq.forEach(function(e){var v=voiceLead(e.sym,prev,52,67),c=chordParse(e.sym),bm=40+((c.rootPc-40)%12+12)%12;prev=v;
      evs.push({t:t*spb,d:e.b*spb*0.97,m:v.concat([bm]),v:0.9});t+=e.b;});
    return evs;}
  /* 押すと鳴り、もう一度押すと止まるボタン */
  function _w14_player(btn,getEvs,onStep,onReset){
    var label=btn.textContent;
    function reset(){btn.setAttribute("aria-pressed","false");btn.textContent=label;if(onReset)onReset();}
    btn.addEventListener("click",function(){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();reset();return;}
      playEvents(getEvs(),{timbre:"piano",onStep:onStep,onEnd:reset});
      btn.setAttribute("aria-pressed","true");btn.textContent="■ 止める";hold(reset);
    });
  }
  /* 和音の札（HTML）。st = {c: 枠の色, bg: 背景, tc: 下の文字の色, dash: 破線, hot: 再生中} */
  function _w14_chip(name,lines,st){st=st||{};
    return '<span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-start;min-width:2.9rem;padding:.22rem .3rem;border:1.6px '+(st.dash?'dashed':'solid')+' '+(st.c||'var(--line)')+
      ';border-radius:8px;background:'+(st.bg||'var(--screen)')+';font-family:var(--mono);font-size:.7rem;line-height:1.3'+(st.hot?';box-shadow:0 0 0 2.5px var(--signal)':'')+'">'+
      '<b style="font-family:var(--sans);font-size:.88rem;color:var(--ink)">'+esc(name)+'</b>'+
      lines.map(function(l){return '<span style="color:'+(l[1]||st.tc||'var(--muted)')+';white-space:nowrap">'+esc(l[0])+'</span>';}).join("")+'</span>';}

  /* ============ 14. w14_keyset — 和音を含む長調を、完全 5 度の連なりの上で数える ============ */
  REG.w14_keyset=function(el){
    head(el,"Keys","和音を選ぶと、その和音を含む長調が 5 度の連なりの上に表示される");
    var TYPES=[["長三和音","",["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"],"blue"],
               ["短三和音","m",["C","C#","D","Eb","E","F","F#","G","G#","A","Bb","B"],"purple"],
               ["減三和音","dim",["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],"gold"],
               ["属七の和音","7",["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"],"signal"]];
    var row=ctrls(el),st=select(row,"和音の種類",TYPES.map(function(t){return t[0];})),sr=select(row,"根音",TYPES[0][2].map(_w14_cn));
    function fillRoots(){var t=TYPES[+st.value],v=sr.value;sr.innerHTML=t[2].map(function(r,i){return '<option value="'+i+'">'+_w14_cn(r)+'</option>';}).join("");sr.value=v||"0";}
    st.value="1";fillRoots();sr.value="9";
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el);
    function sym(){var t=TYPES[+st.value];return t[2][+sr.value]+t[1];}
    function P(n){var a=0;for(var i=1;i<n.length;i++)a+=n[i]==="#"?1:n[i]==="b"?-1:0;return "FCGDAEB".indexOf(n[0])-1+7*a;}
    function nameAt(p){var li=((p+1)%7+7)%7,acc=Math.floor((p+1)/7);return "FCGDAEB"[li]+(acc>0?"#":acc<0?"b":"");}
    function num(p){return p<0?"−"+(-p):String(p);}
    function draw(){
      var s=sym(),t=TYPES[+st.value],col=V(t[3]),soft=V(t[3]+"-soft"),tones=_w14_tones(s),ps=tones.map(P);
      var a=Math.min.apply(null,ps),b=Math.max.apply(null,ps),Ws=[];
      for(var w=b-7;w<=a+1;w++){if(w+1<-7||w+1>7)continue;Ws.push({w:w,ok:w>=b-6&&w<=a});}
      var lo=Ws[0].w,hi=Ws[Ws.length-1].w+6,cw=38,x0=8,X=function(p){return x0+(p-lo)*cw+cw/2;},Wd=x0*2+(hi-lo+1)*cw,g=[];
      g.push(ln(X(a),22,X(b),22,col,1.6),ln(X(a),16,X(a),28,col,1.6),ln(X(b),16,X(b),28,col,1.6));
      g.push(tx((X(a)+X(b))/2,15,"幅 "+(b-a),"middle",12,col,true));
      for(var p=lo;p<=hi;p++){var on=ps.indexOf(p)>=0;
        g.push('<circle cx="'+X(p)+'" cy="50" r="14" fill="'+(on?soft:V("panel"))+'" stroke="'+(on?col:V("line"))+'" stroke-width="'+(on?2:1.2)+'"/>');
        g.push(tx(X(p),54.5,_w14_cn(nameAt(p)),"middle",12,on?col:V("ink"),true));
        g.push(tx(X(p),77,num(p),"middle",9.5,V("muted")));}
      Ws.forEach(function(q,k){var y=88+k*20,xa=X(q.w)-16,xb=X(q.w+6)+16,tk=nameAt(q.w+1),kn=_w14_kname(tk);
        g.push('<rect x="'+xa+'" y="'+y+'" width="'+(xb-xa)+'" height="16" rx="8" fill="'+(q.ok?V("green-soft"):"none")+'" stroke="'+(q.ok?V("green"):V("muted"))+'" stroke-width="'+(q.ok?1.4:1)+'"'+(q.ok?'':' stroke-dasharray="3,3"')+'/>');
        g.push(tx((xa+xb)/2,y+12,kn+(q.ok?"（"+roman(s,tk)+"）":"（含まない）"),"middle",10.5,q.ok?V("green"):V("muted"),q.ok));});
      view.innerHTML=svgWrap(Wd,88+Ws.length*20+4,g.join(""));
      var ok=Ws.filter(function(q){return q.ok;});
      ro.innerHTML='<b style="color:'+col+'">'+esc(_w14_cn(s))+'</b>（'+esc(tones.map(_w14_cn).join("・"))+'）の位置 '+ps.map(num).join("・")+
        ' → 幅 s = <b>'+(b-a)+'</b> → 含む長調は 7 − '+(b-a)+' = <b>'+ok.length+'</b> つ<br>'+
        ok.map(function(q){var tk=nameAt(q.w+1);return '<b style="color:var(--green)">'+_w14_kname(tk)+'</b>（'+esc(roman(s,tk))+'）';}).join("・");
    }
    st.addEventListener("change",function(){fillRoots();draw();});sr.addEventListener("change",draw);
    _w14_player(bp,function(){return [{t:0,d:1.8,m:chordMidis(sym(),55)}];});
    draw();
  };

  /* ============ 14. w14_pivot — 2 つの調の共通和音と、転調の作り方 ============ */
  REG.w14_pivot=function(el){
    head(el,"Pivot","2 つの調を選び、共通和音を通る転調と直接転調を作って鳴らす");
    var names=_w14_KEYS.map(function(k){return _w14_kname(k)+"（"+_w14_cn(k.replace(/m$/," マイナー").replace(/^([A-G][#b]?)$/,"$1 メジャー"))+"）";});
    var row=ctrls(el),s1=select(row,"元の調",names),s2=select(row,"転調先の調",names);s1.value="0";s2.value="7";
    var row2=ctrls(el),sm=select(row2,"つなぎ方",["—"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var keysV=mk("div","wscreen");keysV.style.padding=".55rem .6rem";el.appendChild(keysV);
    var bandV=mk("div","wscreen");bandV.style.padding=".55rem .6rem";bandV.style.marginTop=".5rem";el.appendChild(bandV);
    var ro=readout(el),A=null,Q=[],hot=-1;
    function analyze(){var k1=_w14_KEYS[+s1.value],k2=_w14_KEYS[+s2.value],t1=_w14_triads(k1),t2=_w14_triads(k2),com=[];
      t1.forEach(function(a){t2.forEach(function(b){if(a.key===b.key)com.push({a:a,b:b});});});
      var p1=_w14_scale(k1).map(_w14_pc),p2=_w14_scale(k2).map(_w14_pc),cn=p1.filter(function(x){return p2.indexOf(x)>=0;}).length;
      var d=Math.abs(keyCount(k1)-keyCount(k2));if(d>6)d=12-d;
      return {k1:k1,k2:k2,t1:t1,t2:t2,com:com,cn:cn,d:d};}
    function opts(){A=analyze();var o=A.com.map(function(c,i){return ["p"+i,"ピボットコード "+_w14_cn(c.a.sym)+"（"+c.a.deg+" / "+c.b.deg+"）"];});
      o.push(["dI","直接転調（新しい調の I から）"],["dV","直接転調（新しい調の V7 から）"]);
      sm.innerHTML=o.map(function(x){return '<option value="'+x[0]+'">'+esc(x[1])+'</option>';}).join("");
      var sd=-1;[/^(IIm|IVm)$/,/^(IV|IIdim)$/].forEach(function(re){A.com.forEach(function(c,i){if(sd<0&&re.test(c.b.deg))sd=i;});});
      sm.value=A.com.length?"p"+(sd>=0?sd:0):"dI";}
    function build(){var mi2=/m$/.test(A.k2),I1=A.t1[0],IV1=A.t1[3],V1=_w14_v7(A.k1),I2=A.t2[0],IV2=A.t2[3],SD2=mi2?A.t2[3]:A.t2[1],V2=_w14_v7(A.k2),q=[],m=sm.value;
      function add(s,b,z,d1,d2){q.push({sym:s,b:b,z:z,d1:d1,d2:d2});}
      add(I1.sym,2,"o",I1.deg);add(IV1.sym,2,"o",IV1.deg);add(V1,2,"o",roman(V1,A.k1));add(I1.sym,2,"o",I1.deg);
      if(m[0]==="p"){var c=A.com[+m.slice(1)];add(c.a.sym,2,"b",c.a.deg,c.b.deg);add(V2,2,"n",0,"V7");add(I2.sym,2,"n",0,I2.deg);add(SD2.sym,2,"n",0,SD2.deg);add(V2,2,"n",0,"V7");add(I2.sym,4,"n",0,I2.deg);}
      else if(m==="dI"){add(I2.sym,2,"n",0,I2.deg);add(IV2.sym,2,"n",0,IV2.deg);add(V2,2,"n",0,"V7");add(I2.sym,4,"n",0,I2.deg);}
      else{add(V2,2,"n",0,"V7");add(I2.sym,2,"n",0,I2.deg);add(IV2.sym,2,"n",0,IV2.deg);add(V2,2,"n",0,"V7");add(I2.sym,4,"n",0,I2.deg);}
      return q;}
    function drawBand(){
      var st={o:{c:"var(--muted)"},b:{c:"var(--ink)",dash:1,bg:"var(--green-soft)"},n:{c:"var(--signal)",bg:"var(--signal-soft)"}};
      bandV.innerHTML='<div style="font-size:.8rem;font-weight:700;margin-bottom:.35rem">'+_w14_kname(A.k1)+' → '+_w14_kname(A.k2)+'</div><div style="display:flex;flex-wrap:wrap;gap:4px">'+
        Q.map(function(e,i){var s0=st[e.z],s2={c:s0.c,dash:s0.dash,bg:s0.bg,hot:i===hot};
          return _w14_chip(_w14_cn(e.sym),[[e.z==="o"?e.d1:e.z==="n"?e.d2:e.d1+" / "+e.d2]],s2);}).join("")+'</div>'+
        '<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:.4rem">灰色の枠: 元の調 ／ 黒い破線: ピボットコード ／ 色の枠: 転調先の調</div>';}
    function draw(){
      A=analyze();Q=build();
      function rowK(t,k,isNew){return '<div style="font-size:.78rem;font-weight:700;margin:.1rem 0 .3rem;color:'+(isNew?'var(--signal)':'var(--muted)')+'">'+_w14_kname(k)+'のダイアトニックコード</div><div style="display:flex;flex-wrap:wrap;gap:4px">'+
        t.map(function(c){var isC=A.com.some(function(x){return (isNew?x.b:x.a)===c;});return _w14_chip(_w14_cn(c.sym),[[c.deg]],isC?{c:"var(--green)",bg:"var(--green-soft)",tc:"var(--green)"}:{});}).join("")+'</div>';}
      keysV.innerHTML=rowK(A.t1,A.k1,false)+'<div style="height:.5rem"></div>'+rowK(A.t2,A.k2,true)+
        '<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:.4rem">緑の枠: 共通和音（ピボットコードの候補）</div>';
      drawBand();
      ro.innerHTML='五度圏での距離 d = <b>'+A.d+'</b> ／ 共通音 <b>'+A.cn+'</b> ／ 共通和音 <b>'+A.com.length+'</b>'+
        (A.k1===A.k2?'<br><span class="warn">元の調と転調先の調が同じ（転調にならない）</span>':A.com.length?'':'<br>共通和音が無いので、直接転調だけを選べる');
    }
    function changeKeys(){stopAll();opts();draw();}
    s1.addEventListener("change",changeKeys);s2.addEventListener("change",changeKeys);sm.addEventListener("change",function(){stopAll();draw();});
    _w14_player(bp,function(){return _w14_events(Q,0.6);},function(i){hot=i;drawBand();},function(){hot=-1;if(A)drawBand();});
    opts();draw();
  };

  /* ============ 14. w14_compare — 転調を見分ける手がかり ============ */
  REG.w14_compare=function(el){
    head(el,"Clues","例を選んで鳴らし、転調したかどうかを手がかりで確かめる");
    var PRE=[
      {n:"(a) 一時的なドミナント",c:"C F G7 C Am D7 G G7 C:4",z:"ooooooooo",d:"I IV V7 I VIm V7/V V V7 I",cad:{3:"ハ長調",6:"G へ（一時的）",8:"ハ長調"},
       r:"転調していない（ハ長調のまま）。F♯ は D7 の 1 回だけで、すぐ G7 で F に戻る。D7 はセカンダリードミナント（V7/V）。"},
      {n:"(b) 属調（ト長調）へ — ピボットコード Am",c:"C F G7 C Am D7 G Em Am D7 G:4",z:"oooobnnnnnn",d:"I IV V7 I VIm/IIm V7 I VIm IIm V7 I",cad:{3:"ハ長調",6:"ト長調",10:"ト長調"},
       r:"ハ長調 → ト長調。F♯ がくり返し現れて F に戻らず、ト長調の終止（D7 → G）が 2 回ある。"},
      {n:"下属調（ヘ長調）へ — ピボットコード C",c:"C F G7 C C7 F Bb C7 F:4",z:"ooobnnnnn",d:"I IV V7 I/V V7 I IV V7 I",cad:{3:"ハ長調",5:"ヘ長調",8:"ヘ長調"},
       r:"ハ長調 → ヘ長調。ハ長調の I（C）をヘ長調の V と読み替え、7 度の音 B♭ を加えた C7（ヘ長調の V7）から F へ進む。B♭ が続く。"},
      {n:"平行調（イ短調）へ — ピボットコード Dm",c:"C F G7 C Dm E7 Am Dm E7 Am:4",z:"oooobnnnnn",d:"I IV V7 I IIm/IVm V7 Im IVm V7 Im",cad:{3:"ハ長調",6:"イ短調",9:"イ短調"},
       r:"ハ長調 → イ短調。調号は変わらないが、イ短調の導音 G♯ がくり返し現れ、イ短調の終止（E7 → Am）が 2 回ある。"},
      {n:"全音上（ニ長調）へ — ピボットコード Em",c:"C F G7 C Em A7 D G A7 D:4",z:"oooobnnnnn",d:"I IV V7 I IIIm/IIm V7 I IV V7 I",cad:{3:"ハ長調",6:"ニ長調",9:"ニ長調"},
       r:"ハ長調 → ニ長調。ニ長調の導音 C♯ と F♯ が続き、ニ長調の終止（A7 → D）が 2 回ある。"},
      {n:"全音上（ニ長調）へ — 直接転調",c:"C F G7 C D G A7 D:4",z:"oooonnnn",d:"I IV V7 I I IV V7 I",cad:{3:"ハ長調",7:"ニ長調"},
       r:"ハ長調 → ニ長調。共通和音を通らず、C の直後から F♯・C♯ が現れる。"},
      {n:"半音上（変ニ長調）へ — 直接転調",c:"C F G7 C Db Gb Ab7 Db:4",z:"oooonnnn",d:"I IV V7 I I IV V7 I",cad:{3:"ハ長調",7:"変ニ長調"},
       r:"ハ長調 → 変ニ長調。共通和音が無く、C の直後から、ハ長調に無い 5 つの音（D♭・E♭・G♭・A♭・B♭）が続けて現れる。"},
      {n:"半音上（変ニ長調）へ — 新しい調の V7 を先に置く",c:"C F G7 C Ab7 Db Gb Ab7 Db:4",z:"oooonnnnn",d:"I IV V7 I V7 I IV V7 I",cad:{3:"ハ長調",5:"変ニ長調",8:"変ニ長調"},
       r:"ハ長調 → 変ニ長調。A♭7 → D♭（V7 → I）で新しい主音を示してから、変ニ長調の進行が始まる。"}];
    var row=ctrls(el),sp=select(row,"例",PRE.map(function(p){return p.n;}));sp.value="1";
    var row2=ctrls(el),cb=checkbox(row2,"手がかりを表示",true);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var view=mk("div","wscreen");view.style.padding=".55rem .6rem";el.appendChild(view);
    var ro=readout(el),hot=-1;
    var CMAJ=_w14_scale("C");
    function seq(){var p=PRE[+sp.value],ds=p.d.split(" ");return p.c.split(" ").map(function(tok,i){var m=tok.split(":");return {sym:m[0],b:m[1]?+m[1]:2,z:p.z[i],d:ds[i].replace("/"," / ")};});}
    function fixDeg(d){return d==="V7 / V"?"V7/V":d;}
    function draw(){
      var p=PRE[+sp.value],q=seq(),show=cb.checked,cnt={};
      var st={o:{c:"var(--muted)"},b:{c:"var(--ink)",dash:1,bg:"var(--green-soft)"},n:{c:"var(--signal)",bg:"var(--signal-soft)"}};
      var chips=q.map(function(e,i){var nn=_w14_tones(e.sym).filter(function(n){return CMAJ.indexOf(n)<0;});
        nn.forEach(function(n){cnt[n]=(cnt[n]||0)+1;});
        if(!show)return _w14_chip(_w14_cn(e.sym),[],{hot:i===hot});
        var lines=[[fixDeg(e.d)],[nn.length?nn.map(_w14_cn).join(" "):"·",nn.length?"var(--signal)":"var(--faint)"],[p.cad[i]?"終止":"·",p.cad[i]?"var(--green)":"var(--faint)"]];
        var s0=st[e.z];return _w14_chip(_w14_cn(e.sym),lines,{c:s0.c,dash:s0.dash,bg:s0.bg,hot:i===hot});});
      view.innerHTML=(show?'<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-bottom:.35rem">各札: コードネーム ／ ディグリーネーム ／ ハ長調に無い音（①） ／ 終止（②）</div>':'')+
        '<div style="display:flex;flex-wrap:wrap;gap:4px">'+chips.join("")+'</div>'+
        (show?'<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:.4rem">灰色の枠: ハ長調 ／ 黒い破線: ピボットコード ／ 色の枠: 転調先の調</div>':'');
      var ks=Object.keys(cnt);
      ro.innerHTML=show?'<b>'+esc(p.r)+'</b><br>① ハ長調に無い音: '+(ks.length?ks.map(function(n){return _w14_cn(n)+" × "+cnt[n];}).join("、"):"なし")+
        ' ／ ② 終止: '+Object.keys(p.cad).map(function(i){return p.cad[i];}).join(" → "):'和音の名前だけを表示している。聞いて判断してから「手がかりを表示」で確かめる。';
    }
    sp.addEventListener("change",function(){stopAll();draw();});cb.addEventListener("change",draw);
    _w14_player(bp,function(){return _w14_events(seq(),0.6);},function(i){hot=i;draw();},function(){hot=-1;draw();});
    draw();
  };

  /* ============ 15. モード（共通） ============ */
  var _w15_MAJ=[2,2,1,2,2,2,1], _w15_NM=["イオニアン","ドリアン","フリジアン","リディアン","ミクソリディアン","エオリアン","ロクリアン"],
      _w15_ORD=[3,0,4,1,5,2,6], _w15_DEG=["1","♭2","2","♭3","3","4","♯4/♭5","5","♭6","6","♭7","7"], _w15_REF=[0,2,4,5,7,9,11], _w15_L="CDEFGAB";
  function _w15_rot(r){return _w15_MAJ.slice(r).concat(_w15_MAJ.slice(0,r));}
  function _w15_cum(r){var s=_w15_rot(r),c=[0];for(var i=0;i<6;i++)c.push(c[i]+s[i]);return c;}
  function _w15_col(r){var c=_w15_cum(r);return c[2]===4?"blue":c[4]===6?"gold":"purple";}
  function _w15_sc(t,r,n){return spellScale(t,_w15_rot(r),n||8);}
  function _w15_nm(a){return a.map(function(n){return nname(n,false);});}
  var _w15_JL={C:"ハ",D:"ニ",E:"ホ",F:"ヘ",G:"ト",A:"イ",B:"ロ"};
  function _w15_jkey(n){var p=parse(n);return (p.acc>0?"嬰":p.acc<0?"変":"")+_w15_JL[p.letter]+"長調";}
  function _w15_dl(c,i){var d=c-_w15_REF[i];return (d>0?"♯":d<0?"♭":"")+(i+1);}
  function _w15_ivn(i,s){var d=i+1,P={1:0,4:5,5:7},M={2:2,3:4,6:9,7:11},q=P[d]!=null?{0:"完全",1:"増","-1":"減"}[s-P[d]]:{0:"長","-1":"短",1:"増","-2":"減"}[s-M[d]];return q+" "+d+" 度";}
  /* 押すと鳴り、もう一度押すと止まるボタン。run(fin) の中で音を出し、終わったら fin() を呼ぶ */
  function _w15_btn(b,run,reset){
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var fin=function(){b.setAttribute("aria-pressed","false");if(reset)reset();};
      run(fin); b.setAttribute("aria-pressed","true"); hold(fin);
    });
  }
  /* 旋律・和音は playEvents（前の音は止まる）、ドローンは organ で重ねる */
  function _w15_play(evs,drone,o){
    var end=playEvents(evs,o);
    if(drone&&drone.length){var t=ac().currentTime+0.08;drone.forEach(function(m){note(m,t,end+0.4,"organ",0.75);});}
    return end;
  }
  function _w15_arr(x1,y,x2,col){var d=x2>x1?1:-1;return ln(x1,y,x2-d*5,y,col,1.4)+'<polygon points="'+x2+','+y+' '+(x2-d*6)+','+(y-3.5)+' '+(x2-d*6)+','+(y+3.5)+'" fill="'+col+'"/>';}
  /* 主音からの半音の数（12 列）の上に音を点で並べる図
     rows: [{lab, lcol, cum, names, col, hot:{半音:1}, ghost:[[旧,新]], ring, right, rcol, band, small}] */
  function _w15_grid(rows,o){
    o=o||{}; var x0=o.x0||136, cw=34, rh=o.rh||32, y0=60, W=x0+12*cw+(o.rw||92), H=y0+(rows.length-1)*rh+22, b=[];
    for(var k=0;k<12;k++){var cx=x0+k*cw+cw/2;
      b.push(tx(cx,20,String(k),"middle",9.5,V("muted")));
      b.push(tx(cx,40,_w15_DEG[k],"middle",k===6?8.5:10.5,V("ink"),true));
      b.push(ln(cx,48,cx,H-8,V("line"),0.8,"2,4"));}
    b.push(tx(x0-8,20,"主音からの半音の数","end",9.5,V("muted")));
    b.push(tx(x0-8,40,"長音階を基準にした書き方","end",9.5,V("muted")));
    rows.forEach(function(R,i){
      var y=y0+i*rh, rr=R.small?5:11;
      if(R.band)b.push('<rect x="2" y="'+(y-rh/2+1)+'" width="'+(W-4)+'" height="'+(rh-2)+'" rx="7" fill="'+V("signal-soft")+'"/>');
      b.push(tx(x0-8,y+4,R.lab,"end",R.small?10.5:11.5,V(R.lcol||"ink"),true));
      (R.ghost||[]).forEach(function(g){var gx=x0+g[0]*cw+cw/2,nx=x0+g[1]*cw+cw/2,d=g[1]>g[0]?1:-1;
        b.push('<circle cx="'+gx+'" cy="'+y+'" r="11" fill="none" stroke="'+V("muted")+'" stroke-width="1.1" stroke-dasharray="3,3"/>');
        b.push(_w15_arr(gx+d*12,y,nx-d*13,V("signal")));});
      R.cum.forEach(function(c,j){var cx=x0+c*cw+cw/2, hot=R.hot&&R.hot[c], col=hot?"signal":(R.col||"muted");
        if(R.ring===c)b.push('<circle cx="'+cx+'" cy="'+y+'" r="'+(rr+4)+'" fill="none" stroke="'+V("signal")+'" stroke-width="2.2"/>');
        b.push('<circle cx="'+cx+'" cy="'+y+'" r="'+rr+'" fill="'+V(col+"-soft")+'" stroke="'+V(col)+'" stroke-width="'+(hot?2:1.3)+'"/>');
        if(!R.small&&R.names)b.push(tx(cx,y+3.8,R.names[j],"middle",10,V(hot?"signal":"ink"),true));});
      if(R.right)b.push(tx(x0+12*cw+8,y+4,R.right,"start",10.5,V(R.rcol||"muted"),true));
    });
    return {svg:b.join(""),w:W,h:H};
  }
  function _w15_row(){var d=mk("div");d.style.cssText="display:flex;flex-wrap:wrap;gap:.6rem 1rem;justify-content:center;align-items:center";return d;}

  /* ============ 15. w15_white — 白鍵のどれを主音にするか ============ */
  REG.w15_white=function(el){
    head(el,"Modes","白鍵のうち、どの音を主音にするかを選ぶ");
    var L=_w15_L, row=ctrls(el);
    var sel=select(row,"主音にする白鍵",L.split("").map(function(x,i){return x+"（"+_w15_NM[i]+"）";})); sel.value="1";
    var dr=checkbox(row,"ドローン（主音を低く鳴らし続ける）",true);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ 上がって下がる");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), act=null;
    function cur(){var r=+sel.value, sc=_w15_sc(L[r]+"4",r,8); return {r:r,sc:sc,ms:sc.map(function(n){return parse(n).midi;})};}
    function draw(){
      var c=cur(), st=_w15_rot(c.r), hl={};
      c.ms.forEach(function(m,i){var t=(i===0||i===7); hl[m]={c:t?"signal":"blue",label:c.sc[i][0],strong:t||m===act};});
      var k=kbd(60,83,{ww:24,wh:80,hl:hl,names:null}), body=k.svg;
      for(var i=0;i<7;i++){var xa=k.pos[c.ms[i]][0],xb=k.pos[c.ms[i+1]][0],y=k.h+5,h=st[i]===1,cl=V(h?"gold":"muted");
        body+='<polyline points="'+(xa+2)+','+y+' '+((xa+xb)/2)+','+(y+10)+' '+(xb-2)+','+y+'" fill="none" stroke="'+cl+'" stroke-width="'+(h?2.2:1.3)+'"/>'+tx((xa+xb)/2,y+25,h?"半":"全","middle",12,cl,h);}
      var s=9, x0=staffStart(s), items=c.sc.map(function(n,i){return {x:x0+i*25,notes:[n],fill:(c.ms[i]===act||i===0||i===7)?V("signal"):V("ink")};});
      var stf=staff({s:s,w:x0+7*25+16,clef:"treble",items:items});
      var rw=_w15_row(); rw.innerHTML=svgWrap(k.w,k.h+32,body)+svgWrap(stf.w,stf.h,stf.svg); view.innerHTML=""; view.appendChild(rw);
      var cum=_w15_cum(c.r), hs=[]; st.forEach(function(v,i){if(v===1)hs.push(i+1);});
      var tag=c.r===0?"（= 長音階）":c.r===5?"（= 自然短音階）":"";
      ro.innerHTML='<b>'+L[c.r]+' '+_w15_NM[c.r]+'</b>'+tag+': '+_w15_nm(c.sc).join(" ")+
        '<br>全・半の並び: '+st.map(function(v){return v===1?'<b style="color:var(--gold)">半</b>':"全";}).join("・")+'（半音は '+hs[0]+' 番目と '+hs[1]+' 番目の間隔）'+
        '<br>主音の上の 3 度: '+nname(c.sc[0],false)+'–'+nname(c.sc[2],false)+' は <b>'+(cum[2]===4?"長 3 度":"短 3 度")+'</b>（半音 '+cum[2]+'）';
    }
    sel.addEventListener("change",function(){if(bp.getAttribute("aria-pressed")==="true")stopAll();act=null;draw();});
    _w15_btn(bp,function(fin){
      var c=cur(), seq=c.ms.concat(c.ms.slice(0,7).reverse()), g=0.3, evs=seq.map(function(m,i){return {t:i*g,d:i===seq.length-1?1.1:g*0.95,m:[m]};});
      _w15_play(evs,dr.checked?[c.ms[0]-12]:[],{timbre:"piano",onStep:function(i){act=seq[i];draw();},onEnd:fin});
    },function(){act=null;draw();});
    draw();
  };

  /* ============ 15. w15_ladder — 明るさの順のはしご ============ */
  REG.w15_ladder=function(el){
    head(el,"Ladder","主音を決めて、明るい順に 1 音ずつ半音下げる");
    var L=_w15_L, row=ctrls(el), sT=select(row,"主音",L.split("")), sR=slider(row,"明るさの段",1,7,4,1), dr=checkbox(row,"ドローン",true);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var b1=button(bar,"▶ この段の音階"), b2=button(bar,"▶ 上の段から順に 7 つ");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), act=null, pr=null;
    function tonic(){return L[+sT.value]+"4";}
    function idx(){return pr!=null?pr:(+sR.input.value)-1;}
    function draw(){
      var t=tonic(), i0=idx(), r=_w15_ORD[i0], rows=[], prev=null, moved=null, old=null;
      sR.val.textContent=(+sR.input.value)+"（"+_w15_NM[_w15_ORD[(+sR.input.value)-1]]+"）";
      _w15_ORD.forEach(function(rr,i){
        var cum=_w15_cum(rr), nms=_w15_nm(_w15_sc(t,rr,7)), hot={}, mv=null, gh=null;
        if(prev){mv=cum.filter(function(c){return prev.indexOf(c)<0;})[0]; gh=prev.filter(function(c){return cum.indexOf(c)<0;})[0]; hot[mv]=1;}
        var alts=cum.filter(function(c,j){return c!==_w15_REF[j];}).length, up=cum[3]===6;
        rows.push({lab:_w15_NM[rr],lcol:_w15_col(rr),cum:cum,names:nms,col:_w15_col(rr),hot:hot,small:i!==i0,band:i===i0,
          ghost:(i===i0&&gh!=null)?[[gh,mv]]:null,ring:(i===i0&&act!=null)?act:null,right:up?"♯ 1 つ":alts?"♭ "+alts+" つ":"なし",rcol:i===i0?"signal":"muted"});
        if(i===i0&&gh!=null){moved=mv;old=gh;}
        prev=cum;
      });
      var g=_w15_grid(rows,{rh:28,rw:70}), sc=_w15_sc(t,r,8), ms=sc.map(function(n){return parse(n).midi;}), lo=12*Math.floor(ms[0]/12), hl={};
      ms.forEach(function(m,j){var c=(m-ms[0])%12, on=(act!=null&&c===act);hl[m]={c:(c===moved)?"signal":(j===0||j===7)?"signal":_w15_col(r),label:nname(sc[j],false),strong:on||j===0||j===7||c===moved};});
      var k=kbd(lo,lo+23,{ww:20,wh:72,hl:hl,names:null}), s=8, x0=staffStart(s);
      var stf=staff({s:s,w:x0+7*24+14,clef:"treble",items:sc.map(function(n,j){var c=(parse(n).midi-ms[0])%12;return {x:x0+j*24,notes:[n],fill:(c===moved||(act!=null&&c===act))?V("signal"):V("ink")};})});
      var rw=_w15_row(); rw.innerHTML='<div style="width:100%">'+svgWrap(g.w,g.h,g.svg)+'</div>'+svgWrap(k.w,k.h,k.svg)+svgWrap(stf.w,stf.h,stf.svg); view.innerHTML=""; view.appendChild(rw);
      var cum=_w15_cum(r), par=sc[(7-r)%7], pn=nname(par,false), kc=keyCount(nacc(pn)), tn=nname(t,false), prevNm=i0>0?_w15_NM[_w15_ORD[i0-1]]:null;
      var nms=_w15_nm(sc.slice(0,7)), oldNm=null, newNm=null;
      if(moved!=null){newNm=nms[cum.indexOf(moved)]; oldNm=_w15_nm(_w15_sc(t,_w15_ORD[i0-1],7))[_w15_cum(_w15_ORD[i0-1]).indexOf(old)];}
      ro.innerHTML='<b>'+tn+' '+_w15_NM[r]+'</b>（'+(i0+1)+' 段目）: '+nms.join(" ")+
        '<br>'+(i0>0?'1 つ上の段（'+tn+' '+prevNm+'）から <b style="color:var(--signal)">'+oldNm+' → '+newNm+'</b> と半音下げた':'いちばん上の段（これより明るい段は無い）')+
        '<br>主音の上の 3 度: <b>'+(cum[2]===4?"長 3 度":"短 3 度")+'</b> ／ 同じ 7 音を使う長調: <b>'+_w15_jkey(par)+'</b>（'+pn+' メジャー、調号 '+(kc===0?"なし":(kc>0?"♯ ":"♭ ")+Math.abs(kc)+" 個")+'）';
    }
    function stopIf(){if(b1.getAttribute("aria-pressed")==="true"||b2.getAttribute("aria-pressed")==="true")stopAll();}
    sT.addEventListener("change",function(){stopIf();act=null;draw();});
    sR.input.addEventListener("input",function(){stopIf();act=null;draw();});
    function reset(){act=null;pr=null;draw();}
    _w15_btn(b1,function(fin){
      var t=tonic(), sc=_w15_sc(t,_w15_ORD[idx()],8), ms=sc.map(function(n){return parse(n).midi;}), seq=ms.concat(ms.slice(0,7).reverse()), g=0.3;
      _w15_play(seq.map(function(m,i){return {t:i*g,d:i===seq.length-1?1.1:g*0.95,m:[m]};}),dr.checked?[ms[0]-12]:[],
        {timbre:"piano",onStep:function(i){act=(seq[i]-ms[0])%12;draw();},onEnd:fin});
    },reset);
    _w15_btn(b2,function(fin){
      var t=tonic(), evs=[], info=[], g=0.2, T=0;
      _w15_ORD.forEach(function(r,i){var ms=_w15_sc(t,r,8).map(function(n){return parse(n).midi;});
        ms.forEach(function(m,j){evs.push({t:T,d:j===7?0.5:g*0.95,m:[m]});info.push([i,(m-ms[0])%12]);T+=g;}); T+=0.35;});
      _w15_play(evs,dr.checked?[parse(t).midi-12]:[],{timbre:"piano",onStep:function(i){pr=info[i][0];act=info[i][1];draw();},onEnd:fin});
    },reset);
    draw();
  };

  /* ============ 15. w15_color — 特性音とモードらしい和音 ============ */
  /* 旋律: [音階の何番目（0〜7）, 長さ]。和音の進行: [音階の何番目, コードネームの後ろ]。c は特性音を比べる音階の音に替えた進行 */
  var _w15_MOT={3:[[0,1],[1,1],[2,1],[3,2],[4,1],[3,1],[2,1],[1,1],[0,2]],0:[[0,1],[1,1],[2,1],[3,1],[4,2],[3,1],[2,1],[1,1],[0,2]],
    4:[[0,1],[2,1],[4,1],[5,1],[6,2],[5,1],[4,1],[2,1],[0,2]],1:[[0,1],[2,1],[3,1],[4,1],[5,2],[4,1],[3,1],[2,1],[0,2]],
    5:[[0,1],[1,1],[2,1],[3,1],[4,2],[3,1],[2,1],[1,1],[0,2]],2:[[0,1],[1,2],[0,1],[2,1],[3,1],[2,1],[1,2],[0,2]],
    6:[[0,1],[2,1],[3,1],[4,2],[3,1],[2,1],[1,2],[0,2]]};
  var _w15_PRG={3:{m:[[0,""],[1,""]],c:[[0,""],[1,"m"]]},0:{m:[[0,""],[3,""],[4,"7"],[0,""]],c:null},4:{m:[[0,""],[6,""]],c:[[0,""],[6,"dim"]]},
    1:{m:[[0,"m7"],[3,"7"]],c:[[0,"m7"],[3,"m7"]]},5:{m:[[0,"m"],[5,""],[6,""],[0,"m"]],c:null},2:{m:[[0,"m"],[1,""]],c:[[0,"m"],[1,"dim"]]},
    6:{m:[[0,"dim"],[1,""]],c:[[0,"m"],[1,"dim"]]}};
  REG.w15_color=function(el){
    head(el,"Color","特性音と、特性音を含む和音を聞く");
    var L=_w15_L, row=ctrls(el), sM=select(row,"モード（明るさの順）",_w15_ORD.map(function(r){return _w15_NM[r];})), sT=select(row,"主音",L.split("")), dr=checkbox(row,"ドローン",true);
    sM.value="3";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var b1=button(bar,"▶ 特性音を含む旋律"), b2=button(bar,"▶ 比べる音階で同じ旋律"), b3=button(bar,"▶ 和音の進行"), b4=button(bar,"▶ 特性音を替えた進行");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), ring=null, ringRow=0, ach=null;   /* ach = [進行 0/1, 和音の番号] */
    function cur(){
      var r=_w15_ORD[+sM.value], t=L[+sT.value]+"4", ref=_w15_cum(r)[2]===4?0:5, cum=_w15_cum(r), rc=_w15_cum(ref);
      var sc=_w15_sc(t,r,8), rs=_w15_sc(t,ref,8), ch=cum.filter(function(c){return rc.indexOf(c)<0;});
      function prog(p,scl){if(!p)return null; return p.map(function(q){var sym=nname(scl[q[0]],false)+q[1], ms=chordMidis(sym,57);return {sym:sym,rom:roman(sym,L[+sT.value]),ms:ms,ns:chordSpell(sym,ms)};});}
      return {r:r,t:t,ref:ref,cum:cum,rc:rc,sc:sc,rs:rs,ch:ch,pm:prog(_w15_PRG[r].m,sc),pc:prog(_w15_PRG[r].c,rs)};
    }
    function stf(p,k,c,title){
      var s=8, x0=staffStart(s), dx=58, pcs=c.ch.map(function(v){return (parse(c.t).midi+v)%12;}), rpcs=c.rc.filter(function(v){return c.cum.indexOf(v)<0;}).map(function(v){return (parse(c.t).midi+v)%12;});
      var items=p.map(function(q,j){var on=ach&&ach[0]===k&&ach[1]===j;return {x:x0+14+j*dx,notes:q.ns,sym:q.sym,symcol:on?V("signal"):V("ink"),label:q.rom,lcol:V("muted"),ldy:4.6*s,
        fills:q.ms.map(function(m){var pc=m%12;return (k===0&&pcs.indexOf(pc)>=0)?V("signal"):(k===1&&rpcs.indexOf(pc)>=0)?V(c.ref===0?"blue":"purple"):on?V("signal"):V("ink");})};});
      var st=staff({s:s,w:x0+14+(p.length-1)*dx+30,clef:"treble",items:items,bottom:5.6*s});
      return '<div style="text-align:center"><div style="font-size:.78rem;color:var(--muted);font-family:var(--mono)">'+title+'</div>'+svgWrap(st.w,st.h,st.svg)+'</div>';
    }
    function draw(){
      var c=cur(), tn=nname(c.t,false), hot={}, gh=[];
      c.ch.forEach(function(v){hot[v]=1; gh.push([c.rc.filter(function(q){return c.cum.indexOf(q)<0&&Math.abs(q-v)===1;})[0],v]);});
      var chn=c.ch.map(function(v){return nname(c.sc[c.cum.indexOf(v)],false);});
      var rows=[{lab:tn+" "+_w15_NM[c.r],lcol:_w15_col(c.r),cum:c.cum,names:_w15_nm(c.sc.slice(0,7)),col:_w15_col(c.r),hot:hot,ghost:gh,ring:ringRow===0?ring:null,
        right:chn.length?"特性音 "+chn.join("・"):"特性音なし",rcol:chn.length?"signal":"muted"}];
      if(c.ch.length)rows.push({lab:"比べる: "+(c.ref===0?"長音階":"自然短音階"),lcol:"muted",cum:c.rc,names:_w15_nm(c.rs.slice(0,7)),col:"muted",ring:ringRow===1?ring:null,
        right:tn+" "+_w15_NM[c.ref],rcol:"muted"});
      var g=_w15_grid(rows,{rh:34});
      var rw=_w15_row(); rw.innerHTML='<div style="width:100%">'+svgWrap(g.w,g.h,g.svg)+'</div>'+stf(c.pm,0,c,"このモードの進行")+(c.pc?stf(c.pc,1,c,"特性音を替えた進行"):"");
      view.innerHTML=""; view.appendChild(rw);
      [b2,b4].forEach(function(b){b.disabled=!c.ch.length;b.style.opacity=c.ch.length?"":".45";});
      var desc=c.ch.map(function(v){var i=c.cum.indexOf(v);return '<b style="color:var(--signal)">'+nname(c.sc[i],false)+'</b>（'+_w15_dl(v,i)+'、主音から'+_w15_ivn(i,v)+'）';}).join("・");
      var pj=function(p){return p.map(function(q){return q.sym;}).join(" → ")+'（'+p.map(function(q){return q.rom;}).join(" → ")+'）';};
      ro.innerHTML='<b>'+tn+' '+_w15_NM[c.r]+'</b>: '+_w15_nm(c.sc.slice(0,7)).join(" ")+'<br>'+
        (c.ch.length?'主音の上の 3 度が'+(c.ref===0?"長 3 度":"短 3 度")+'なので、'+(c.ref===0?"長音階":"自然短音階")+'（'+_w15_nm(c.rs.slice(0,7)).join(" ")+'）と比べる ／ 特性音: '+desc
          :'このモードは'+(c.ref===0?"長音階":"自然短音階")+'そのもので、特性音は無い')+
        '<br>和音の進行: '+pj(c.pm)+(c.pc?' ／ 特性音を替えた進行: '+pj(c.pc):'');
    }
    function reset(){ring=null;ach=null;draw();}
    function stopIf(){if([b1,b2,b3,b4].some(function(b){return b.getAttribute("aria-pressed")==="true";}))stopAll();}
    [sM,sT].forEach(function(s){s.addEventListener("change",function(){stopIf();reset();});});
    function mel(k){return function(fin){
      var c=cur(), scl=k===0?c.sc:c.rs, cm=k===0?c.cum:c.rc, u=0.34, T=0, evs=[], cols=[];
      _w15_MOT[c.r].forEach(function(q){evs.push({t:T,d:q[1]*u*0.95,m:[parse(scl[q[0]]).midi]});cols.push(q[0]===7?0:cm[q[0]]);T+=q[1]*u;});
      _w15_play(evs,dr.checked?[parse(c.t).midi-12]:[],{timbre:"piano",onStep:function(i){ring=cols[i];ringRow=k;draw();},onEnd:fin});
    };}
    function chd(k){return function(fin){
      var c=cur(), p=k===0?c.pm:c.pc, seq=p.length===2?[0,1,0,1,0]:[0,1,2,3], d=1.25, evs=seq.map(function(j,i){return {t:i*d,d:i===seq.length-1?1.9:d*0.97,m:p[j].ms};});
      _w15_play(evs,dr.checked?[parse(c.t).midi-24]:[],{timbre:"piano",onStep:function(i){ach=[k,seq[i]];draw();},onEnd:fin});
    };}
    _w15_btn(b1,mel(0),reset); _w15_btn(b2,mel(1),reset); _w15_btn(b3,chd(0),reset); _w15_btn(b4,chd(1),reset);
    draw();
  };

  /* ---------- 16: リズムと拍子（共通の小さな部品） ---------- */
  /* 繰り返し鳴らす: step(i, t) で i 番目を時刻 t に予約し、dur(i) 秒進める。見た目は onVis(i) で合わせる */
  function _w16_loop(o){
    var run=false, tid=null, raf=null, nextT=0, k=0, q=[], cur=-1;
    function sched(){
      if(!run)return; var ctx=ac();
      while(nextT<ctx.currentTime+0.12){o.step(k,nextT); q.push([nextT,k]); nextT+=o.dur(k); k++;}
      tid=setTimeout(sched,25);
    }
    function frame(){
      if(!run)return; var t=AC.currentTime;
      while(q.length>1&&q[1][0]<=t)q.shift();
      if(q.length&&q[0][0]<=t&&q[0][1]!==cur){cur=q[0][1]; o.onVis(cur);}
      raf=requestAnimationFrame(frame);
    }
    function stop(){if(!run)return; run=false; clearTimeout(tid); cancelAnimationFrame(raf); q=[]; cur=-1; o.onStop();}
    return {
      start:function(){stopAll(); run=true; k=0; q=[]; cur=-1; nextT=ac().currentTime+0.1; hold(stop); sched(); frame();},
      stop:function(){if(run)stopAll();},
      restart:function(){if(run){stopAll(); this.start();}},
      running:function(){return run;}
    };
  }
  function _w16_btn(b,on){b.textContent=on?"■ 止める":"▶ 鳴らす"; b.setAttribute("aria-pressed",on?"true":"false");}
  /* 図の幅: 部品の幅に合わせる（スマホでは狭く） */
  function _w16_W(el,mx){return Math.max(300,Math.min(mx||640,(el.clientWidth||640)-34));}
  /* 3 連符のかっこ */
  function _w16_tup(x1,x2,y,col){var xm=(x1+x2)/2;
    return ln(x1,y+5,x1,y,col,1.1)+ln(x1,y,xm-7,y,col,1.1)+ln(xm+7,y,x2,y,col,1.1)+ln(x2,y,x2,y+5,col,1.1)+tx(xm,y+4,"3","middle",10,col,true);}
  /* 再生カードと同じ区切り方: 小節線で分け、書ける音価（付点を含む）に分けてタイでつなぐ */
  var _w16_VALS=[4,3,2,1.5,1,0.75,0.5,0.375,0.25];
  function _w16_pieces(b0,beats,barB){var out=[],bq=b0,end=b0+beats;
    while(bq<end-1e-9){var be=(Math.floor(bq/barB+1e-9)+1)*barB,len=Math.min(end,be)-bq;
      while(len>1e-9){var v=null;for(var i=0;i<_w16_VALS.length;i++)if(_w16_VALS[i]<=len+1e-9){v=_w16_VALS[i];break;}if(v==null)v=len;out.push([bq,v]);bq+=v;len-=v;}}
    return out;}

  /* ============ 16. w16_metro — メトロノーム（拍子と強拍） ============ */
  REG.w16_metro=function(el){
    head(el,"Metronome","テンポと拍子を選ぶと、強拍を強めて拍を刻む");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var row=ctrls(el),sT=slider(row,"テンポ（1 分あたりの拍の数）",40,208,96,1),sM=select(row,"拍子",["2/4","3/4","4/4","6/8"]);sM.value="2";
    var row2=ctrls(el),sD=select(row2,"1 拍を分ける",["分けない"]);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el);
    var MET=[{n:2,str:["強","弱"],time:"2/4",comp:false},{n:3,str:["強","弱","弱"],time:"3/4",comp:false},
             {n:4,str:["強","弱","中強","弱"],time:"4/4",comp:false},{n:2,str:["強","中強"],time:"6/8",comp:true}];
    var SUBS={simple:[[1,"分けない"],[2,"2 つ（8 分音符）"],[3,"3 つ（3 連符）"],[4,"4 つ（16 分音符）"]],comp:[[1,"分けない"],[3,"3 つ（8 分音符）"]]};
    var SC={"強":"signal","中強":"blue","弱":"muted"}, cur=-1;
    function met(){return MET[+sM.value];}
    function subs(){return met().comp?SUBS.comp:SUBS.simple;}
    function sub(){var s=subs();return s[Math.min(+sD.value,s.length-1)][0];}
    function fillSubs(keep){var s=subs(),old=keep?sub():1;sD.innerHTML=s.map(function(x,i){return '<option value="'+i+'">'+x[1]+'</option>';}).join("");
      var idx=0;s.forEach(function(x,i){if(x[0]===old)idx=i;});sD.value=String(idx);}
    function spb(){return 60/(+sT.input.value);}
    var lp=_w16_loop({
      step:function(k,t){var m=met(),n=sub(),N=m.n*n,i=k%N,bi=Math.floor(i/n),kd=m.str[bi];
        if(i%n===0){if(kd==="強")note(-5,t,0.1,"piano",1);else note(-4,t,0.1,"piano",kd==="中強"?1:0.5);}
        else note(-3,t,0.05,"piano",0.32);},
      dur:function(){return spb()/sub();},
      onVis:function(k){var m=met(),n=sub();cur=k%(m.n*n);draw();},
      onStop:function(){cur=-1;_w16_btn(bp,false);draw();}
    });
    function draw(){
      var m=met(),n=sub(),N=m.n*n,W=_w16_W(el,640),s=8,x0=staffStart(s,0,m.time)+10,wb=(W-x0-26)/m.n,its=[],b=[];
      for(var i=0;i<N;i++){
        var on=i===cur,col=on?V("signal"):V("ink"),dur,dot=false;
        if(m.comp)dur=n===1?"quarter":"eighth",dot=n===1;
        else dur=n===1?"quarter":n===4?"16th":"eighth";
        var it={x:x0+i*wb/n,notes:["A4"],dur:dur,dot:dot,fill:col,stem:"up"};
        if(dur==="eighth"||dur==="16th")it.beam=Math.floor(i/n);
        its.push(it);
      }
      its.push({x:x0+m.n*wb-6,bar:"end"});
      var top=4.4*s,stf=staff({s:s,w:x0+m.n*wb-4,clef:"treble",time:m.time,items:its,top:top,bottom:1.5*s});
      b.push(stf.svg);
      if(n===3&&!m.comp)for(var bi=0;bi<m.n;bi++){var xa=2+x0+bi*wb+0.58*s,xb=2+x0+(bi+2/3)*wb+0.58*s;b.push(_w16_tup(xa,xb,top+2.5*s-3.4*s-16,V("ink")));}
      var y=stf.h+20;
      b.push(ln(2+x0-12,y,2+x0+m.n*wb-6,y,V("line"),1.2));
      for(i=0;i<N;i++){var x=2+x0+i*wb/n,bi2=Math.floor(i/n);
        if(i%n===0){var kd=m.str[bi2],R={"強":11,"中強":8.5,"弱":5.5}[kd],c=V(SC[kd]);
          if(i===cur)b.push('<circle cx="'+x+'" cy="'+y+'" r="'+(R+5)+'" fill="none" stroke="'+V("signal")+'" stroke-width="2.4"/>');
          b.push('<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+c+'"/>');
          b.push(tx(x,y+28,kd,"middle",10.5,c,true));b.push(tx(x,y-17,String(bi2+1),"middle",10.5,V("muted"),true));}
        else{b.push('<circle cx="'+x+'" cy="'+y+'" r="'+(i===cur?4.5:3)+'" fill="'+(i===cur?V("signal"):V("muted"))+'"/>');}}
      view.innerHTML=svgWrap(W,y+38,b.join(""));
      var T1=spb(),bn=m.comp?"1 拍（付点 4 分音符）":"1 拍（4 分音符）";
      ro.innerHTML=bn+' = 60 ÷ '+sT.input.value+' = <b>'+f(T1,3)+' 秒</b> ／ 1 小節 = '+m.n+' 拍 = <b>'+f(T1*m.n,2)+' 秒</b>'+
        (n>1?'<br>1 拍を '+n+' つに分けた 1 つ（'+(m.comp?'8 分音符':n===2?'8 分音符':n===3?'3 連符の 1 つ':'16 分音符')+'）= <b>'+f(T1/n,3)+' 秒</b>':'')+
        '<br>音: 強拍は高いクリック、中強・弱は低いクリック（中強のほうが大きい）'+(n>1?'、分けた音は短い雑音':'');
    }
    sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;draw();});
    sM.addEventListener("change",function(){fillSubs(true);cur=-1;draw();lp.restart();});
    sD.addEventListener("change",function(){cur=-1;draw();lp.restart();});
    bp.addEventListener("click",function(){if(lp.running()){lp.stop();return;}lp.start();_w16_btn(bp,true);});
    fillSubs(false);sT.val.textContent=sT.input.value;draw();reg(null,draw);
  };

  /* ============ 16. w16_sync — シンコペーション（強拍の音をずらす） ============ */
  REG.w16_sync=function(el){
    head(el,"Syncopation","強拍の音を半拍ずらすと、楽譜と聞こえ方がどう変わるか");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var BASE=[["C5",0,1],["E5",1,1],["G5",2,1],["E5",3,1],["F5",4,1],["D5",5,1],["C5",6,2]];
    var row=ctrls(el),c1=checkbox(row,"1 小節目 3 拍目の G5",true),c2=checkbox(row,"2 小節目 1 拍目の F5",false),c3=checkbox(row,"2 小節目 3 拍目の C5",false);
    var row2=ctrls(el),sm=select(row2,"ずらし方",["半拍早く鳴らし、強拍の上へ伸ばす","強拍を休み、半拍遅れて鳴らす"]),sT=slider(row2,"テンポ",60,150,96,1);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),onI=-1;
    function seq(){
      var a=BASE.map(function(x){return [x[0],x[1],x[2]];}),sel=[c1.checked?2:-1,c2.checked?4:-1,c3.checked?6:-1],late=sm.value==="1",out=[];
      sel.forEach(function(i){if(i<0)return;
        if(late){a[i][1]+=0.5;a[i][2]-=0.5;}
        else{a[i][1]-=0.5;a[i][2]+=0.5;a[i-1][2]-=0.5;}});
      var t=0;a.forEach(function(x){if(x[1]>t+1e-9)out.push(["r",t,x[1]-t]);out.push(x);t=x[1]+x[2];});
      return out;
    }
    function draw(){
      var sq=seq(),W=_w16_W(el,640),s=8,x0=staffStart(s,0,"4/4")+6,G=16,u=(W-x0-G-30)/8,its=[];
      var X=function(q){return x0+q*u+Math.floor(q/4+1e-9)*G;};
      sq.forEach(function(e,i){
        var ps=_w16_pieces(e[1],e[2],4),off=e[0]!=="r"&&Math.abs(e[1]*2-Math.round(e[1]*2))<1e-9&&Math.round(e[1]*2)%2===1;
        var col=i===onI?V("signal"):off?V("alias"):V("ink");
        ps.forEach(function(p,j){var dd=durDot(p[1]),it={x:X(p[0]),dur:dd.dur,dot:dd.dot,fill:col};
          if(e[0]==="r")it.rest=true;else{it.notes=[e[0]];if(dd.dur==="eighth"||dd.dur==="16th")it.beam="b"+Math.floor(p[0]+1e-9);if(j<ps.length-1)it.tie=true;}
          its.push(it);});
      });
      its.push({x:X(4)-G/2-4,bar:true});its.push({x:X(8)-G+4,bar:"end"});
      its.sort(function(p,q){return p.x-q.x;});
      var stf=staff({s:s,w:X(8)-G+6,clef:"treble",time:"4/4",items:its,top:3.6*s,bottom:2*s}),b=[stf.svg];
      /* 時間の格子 */
      var y=stf.h+16,ons={};sq.forEach(function(e){if(e[0]!=="r")ons[Math.round(e[1]*2)]=1;});
      b.push(ln(2+X(0)-8,y,2+X(7.5)+16,y,V("line"),1.2));b.push(tx(2+X(0)-14,y+4,"時間","end",10,V("muted")));
      var sOn=0,offOn=0;
      for(var k=0;k<16;k++){var x=2+X(k/2);
        if(k%2===0)b.push(ln(x,y-6,x,y+6,V("muted"),1));
        if(k%4===0){b.push('<circle cx="'+x+'" cy="'+y+'" r="9" fill="none" stroke="'+V("ink")+'" stroke-width="1.6"/>');if(ons[k])sOn++;}
        if(ons[k]){var off2=k%2===1;if(off2)offOn++;b.push('<circle cx="'+x+'" cy="'+y+'" r="4.5" fill="'+(off2?V("alias"):V("ink"))+'"/>');}}
      view.innerHTML=svgWrap(W,y+16,b.join(""));
      ro.innerHTML='強拍（1・3 拍目）4 つのうち、新しい音が鳴り始めるのは <b>'+sOn+'</b> つ ／ 裏拍で鳴り始める音（赤）は <b>'+offOn+'</b> つ'+
        '<br>再生では、最初の 1 小節はクリックだけ鳴る（拍を数え始めるため）';
    }
    function play(){
      var sq=seq(),spb=60/(+sT.input.value),evs=[],idx=[];
      for(var b=0;b<12;b++){var inb=b%4;evs.push({t:b*spb,d:0.1,m:[inb===0?-5:-4],v:inb===0?1:inb===2?0.8:0.5});idx.push(-1);}
      sq.forEach(function(e,i){if(e[0]==="r")return;evs.push({t:(4+e[1])*spb,d:e[2]*spb*0.95,m:[parse(e[0]).midi],v:1});idx.push(i);});
      var ord=evs.map(function(e,i){return i;}).sort(function(a,c){return evs[a].t-evs[c].t;});
      var E=ord.map(function(i){return evs[i];}),I=ord.map(function(i){return idx[i];});
      playEvents(E,{timbre:"piano",onStep:function(i){if(I[i]>=0){onI=I[i];draw();}},onEnd:function(){onI=-1;draw();_w16_btn(bp,false);}});
      _w16_btn(bp,true);
    }
    [c1,c2,c3].forEach(function(c){c.addEventListener("change",draw);});sm.addEventListener("change",draw);
    sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;});
    bp.addEventListener("click",function(){if(bp.getAttribute("aria-pressed")==="true"){stopAll();onI=-1;draw();_w16_btn(bp,false);return;}play();});
    sT.val.textContent=sT.input.value;draw();reg(null,draw);
  };

  /* ---------- 16: ドラムの 16 ステップ ---------- */
  var _w16_KIT=[["%hat","ハイハット","gold",-3],["%snare","スネア","signal",-2],["%kick","バスドラム","blue",-1]];
  /* 16 ステップのパターン（楽器ごとの真偽の配列）を、1 声部（符幹は上向き）の五線の要素にする */
  function _w16_drumItems(P,X,hi){
    var its=[];
    for(var k=0;k<4;k++){
      var on=[];for(var j=0;j<4;j++)if(P.some(function(r){return r[4*k+j];}))on.push(j);
      if(!on.length){its.push({x:X(4*k),rest:true,dur:"quarter"});continue;}
      if(on[0]>0){var dr=durDot(on[0]/4);its.push({x:X(4*k),rest:true,dur:dr.dur,dot:dr.dot});}
      on.forEach(function(j,i){var nx=i+1<on.length?on[i+1]:4,dd=durDot((nx-j)/4),ns=[];
        _w16_KIT.forEach(function(q,r){if(P[r][4*k+j])ns.push(q[0]);});
        var it={x:X(4*k+j),notes:ns,dur:dd.dur,dot:dd.dot,stem:"up",fill:(4*k+j)===hi?V("signal"):V("ink")};
        if(dd.dur==="eighth"||dd.dur==="16th")it.beam=k;
        its.push(it);});
    }
    return its;
  }

  /* ============ 16. w16_grid — 16 ステップのリズム格子 ============ */
  REG.w16_grid=function(el){
    head(el,"Drum grid","格子のます目を押して、ドラムのリズムを組み立てる");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var row=ctrls(el),sp=select(row,"例",["8 ビート","8 ビート（スネアを 1・3 拍目に）","16 ビート","16 ビート（バスドラムに 16 分音符を足す）","空（自分で作る）"]),sT=slider(row,"テンポ",60,160,100,1);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),cur=-1;
    function st(a){var r=[];for(var i=0;i<16;i++)r.push(a.indexOf(i)>=0);return r;}
    var EV=[0,2,4,6,8,10,12,14],ALL=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    var PRE=[[EV,[4,12],[0,8,10]],[EV,[0,8],[0,8,10]],[ALL,[4,12],[0,8,10]],[ALL,[4,12],[0,7,8]],[[],[],[]]];
    var P=PRE[0].map(st);
    var lp=_w16_loop({
      step:function(k,t){var i=k%16;_w16_KIT.forEach(function(q,r){if(P[r][i])note(q[3],t,0.1,"piano",r===0?(i%2===0?0.6:0.42):r===1?0.95:1);});},
      dur:function(){return 60/(+sT.input.value)/4;},
      onVis:function(k){cur=k%16;draw();},
      onStop:function(){cur=-1;_w16_btn(bp,false);draw();}
    });
    function draw(){
      var W=_w16_W(el,640),lw=W<420?62:84,cw=Math.min(30,(W-lw-12)/16),ch=Math.max(18,Math.min(24,cw)),gx=lw,gy=22,b=[];
      if(cur>=0)b.push('<rect x="'+(gx+cur*cw)+'" y="'+(gy-2)+'" width="'+cw+'" height="'+(3*ch+4)+'" rx="4" fill="'+V("signal-soft")+'"/>');
      for(var j=0;j<16;j++){var lab=j%4===0?String(j/4+1):j%4===2?"と":"";if(lab)b.push(tx(gx+j*cw+cw/2,gy-7,lab,"middle",10.5,j%4===0?V("ink"):V("muted"),j%4===0));}
      _w16_KIT.forEach(function(q,r){
        b.push(tx(gx-6,gy+r*ch+ch/2+4,q[1],"end",W<420?10:11,V(q[2]),true));
        for(var j2=0;j2<16;j2++){var on=P[r][j2];
          b.push('<rect class="w16c" data-r="'+r+'" data-j="'+j2+'" x="'+(gx+j2*cw+1.5)+'" y="'+(gy+r*ch+1.5)+'" width="'+(cw-3)+'" height="'+(ch-3)+'" rx="3" fill="'+(on?V(q[2]):V("panel"))+'" stroke="'+(on?V(q[2]):V("line"))+'" stroke-width="1.2" style="cursor:pointer"/>');}
      });
      for(var k=0;k<5;k++)b.push(ln(gx+4*k*cw,gy-2,gx+4*k*cw,gy+3*ch+2,V("muted"),1.2));
      var s=7,top=gy+3*ch+30,st0=staffStart(s,0,"4/4"),xL=gx+cw/2-st0-2;
      var its=_w16_drumItems(P,function(j){return st0+2+j*cw;},cur);its.push({x:st0+2+16*cw-cw/2+2,bar:"end"});
      var stf=staff({s:s,x:xL,w:st0+16*cw-cw/2+6,clef:"perc",time:"4/4",items:its,top:top,bottom:1.5*s});
      b.push(stf.svg);
      view.innerHTML=svgWrap(W,stf.h,b.join(""));
      var cnt=function(r){return P[r].filter(Boolean).length;},hat=P[0],sn=P[1];
      var h8=hat.every(function(v,i){return v===(i%2===0);}),h16=hat.every(Boolean);
      var back=sn[4]&&sn[12]&&!sn[0]&&!sn[8];
      ro.innerHTML='ハイハット <b>'+cnt(0)+'</b> 回'+(h16?'（16 分音符で刻む → 16 ビート）':h8?'（8 分音符で刻む → 8 ビート）':'')+
        ' ／ スネア <b>'+cnt(1)+'</b> 回'+(back?'（2・4 拍目 = バックビート）':'')+' ／ バスドラム <b>'+cnt(2)+'</b> 回'+
        '<br>1 ます = 16 分音符 = 60 ÷ '+sT.input.value+' ÷ 4 = <b>'+f(60/(+sT.input.value)/4,3)+' 秒</b>';
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".w16c");if(!t)return;var r=+t.getAttribute("data-r"),j=+t.getAttribute("data-j");
      P[r][j]=!P[r][j];draw();if(!lp.running()&&P[r][j])note(_w16_KIT[r][3],ac().currentTime+0.01,0.1,"piano",0.9);});
    sp.addEventListener("change",function(){P=PRE[+sp.value].map(st);draw();});
    sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;draw();});
    bp.addEventListener("click",function(){if(lp.running()){lp.stop();return;}lp.start();_w16_btn(bp,true);});
    sT.val.textContent=sT.input.value;draw();reg(null,draw);
  };

  /* ============ 16. w16_swing — スウィングの比率 ============ */
  REG.w16_swing=function(el){
    head(el,"Swing","1 拍の中の 2 つの 8 分音符の長さの比を変える");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす"),b1=button(bar,"1:1"),b2=button(bar,"2:1"),b3=button(bar,"3:1");
    var row=ctrls(el),sR=slider(row,"前の音 : 後ろの音",100,300,200,5),sT=slider(row,"テンポ",60,200,120,1);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),cur=-1;
    function r(){return (+sR.input.value)/100;}
    function pos(){return r()/(r()+1);}
    function spb(){return 60/(+sT.input.value);}
    var lp=_w16_loop({
      step:function(k,t){var i=k%8,bt=Math.floor(i/2);
        if(i%2===0){note(-3,t,0.05,"piano",0.6);if(bt===0||bt===2)note(-1,t,0.1,"piano",1);else note(-2,t,0.1,"piano",0.9);}
        else note(-3,t,0.05,"piano",0.5);},
      dur:function(k){return spb()*(k%2===0?pos():1-pos());},
      onVis:function(k){cur=k%8;draw();},
      onStop:function(){cur=-1;_w16_btn(bp,false);draw();}
    });
    function draw(){
      var W=_w16_W(el,640),x0=W<420?20:36,u=(W-x0-20)/2,y=56,b=[],p=pos(),R=r();
      for(var k=0;k<=2;k++)b.push(ln(x0+k*u,20,x0+k*u,y+46,V("muted"),1.2));
      for(k=0;k<2;k++){b.push(tx(x0+k*u+u/2,14,"拍 "+(k+1),"middle",10.5,V("muted"),true));
        [1/3,2/3].forEach(function(q){b.push(ln(x0+(k+q)*u,26,x0+(k+q)*u,y+46,V("signal"),0.9,"2,3"));});
        b.push(ln(x0+(k+0.5)*u,26,x0+(k+0.5)*u,y+46,V("muted"),1,"1,3"));
        var a=x0+k*u,L1=p*u,on0=cur>=0&&cur%2===0&&Math.floor(cur/2)%2===k,on1=cur>=0&&cur%2===1&&Math.floor(cur/2)%2===k;
        b.push('<rect x="'+(a+2)+'" y="'+y+'" width="'+(L1-4)+'" height="18" rx="3" fill="'+(on0?V("signal"):V("signal-soft"))+'" stroke="'+V("signal")+'" stroke-width="1.3"/>');
        b.push('<rect x="'+(a+L1+2)+'" y="'+y+'" width="'+Math.max(2,u-L1-4)+'" height="18" rx="3" fill="'+(on1?V("signal"):V("signal-soft"))+'" stroke="'+V("signal")+'" stroke-width="1.3"/>');
        [0,p].forEach(function(q){b.push('<path d="M'+(a+q*u)+','+(y-3)+' l-5,-8 l10,0Z" fill="'+V("signal")+'"/>');});}
      b.push(tx(x0+u/3,34,"1/3","middle",9.5,V("signal")));b.push(tx(x0+2*u/3,34,"2/3","middle",9.5,V("signal")));b.push(tx(x0+u/2,y+60,"1/2","middle",9.5,V("muted")));
      /* いちばん近い書き方 */
      var near=Math.abs(R-1)<0.03?1:Math.abs(R-2)<0.03?2:Math.abs(R-3)<0.03?3:0,s=8,stf="",txt="";
      if(near){var its=near===1?[{x:58,notes:["A4"],dur:"eighth",beam:0,stem:"up"},{x:88,notes:["A4"],dur:"eighth",beam:0,stem:"up"}]:
                near===2?[{x:58,notes:["A4"],dur:"quarter",stem:"up"},{x:94,notes:["A4"],dur:"eighth",stem:"up"}]:
                [{x:58,notes:["A4"],dur:"eighth",dot:true,beam:0,stem:"up"},{x:98,notes:["A4"],dur:"16th",beam:0,stem:"up"}];
        var st=staff({s:s,w:120,clef:"treble",items:its,top:4.2*s,bottom:s});stf=st.svg;
        if(near===2)stf+=_w16_tup(2+58+0.58*s,2+94+0.58*s,4.2*s+2.5*s-3.4*s-16,V("ink"));
        txt=near===1?"8 分音符 2 つ（ストレート）":near===2?"3 連符の 4 分音符 + 8 分音符（シャッフル）":"付点 8 分音符 + 16 分音符";}
      view.innerHTML=svgWrap(W,y+70,b.join(""))+(near?'<div style="display:flex;align-items:center;justify-content:center;gap:.6rem;flex-wrap:wrap;padding:.2rem 0 .3rem">'+svgWrap(124,8*s,stf)+'<span style="font-size:.8rem;color:var(--muted)">楽譜では: '+txt+'</span></div>':
        '<div style="text-align:center;font-size:.8rem;color:var(--muted);padding:.3rem 0">この比には、ちょうど当てはまる音符の書き方が無い（1:1・2:1・3:1 のときに表示）</div>');
      var d=(p-0.5)*spb();
      sR.val.textContent=f(R,2)+" : 1";sT.val.textContent=sT.input.value;
      ro.innerHTML='後ろの 8 分音符の位置: 拍の頭から <b>'+f(R,2)+' / ('+f(R,2)+' + 1) = '+f(p,3)+' 拍</b>'+
        '<br>ストレート（0.5 拍）より <b>'+f(p-0.5,3)+' 拍</b> 遅い = テンポ '+sT.input.value+' では <b>'+Math.round(d*1000)+' ミリ秒</b>（1 拍 = '+f(spb(),3)+' 秒）';
    }
    function setR(v){sR.input.value=v;draw();}
    b1.addEventListener("click",function(){setR(100);});b2.addEventListener("click",function(){setR(200);});b3.addEventListener("click",function(){setR(300);});
    sR.input.addEventListener("input",draw);sT.input.addEventListener("input",draw);
    bp.addEventListener("click",function(){if(lp.running()){lp.stop();return;}lp.start();_w16_btn(bp,true);});
    draw();reg(null,draw);
  };

  /* ============ 18. 共通: 3 曲の旋律と和音付けの一例（fig/f18.py と同じデータ） ============ */
  var _w18_SONGS={
    tw:{name:"きらきら星",tempo:100,
      mel:"C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2",
      ch:"C | F C | F C | G C | C F | C G | C F | C G | C | F C | F C | G C",
      cad:{4:"全終止",8:"半終止",12:"全終止"},form:[[1,4,"a"],[5,8,"b"],[9,12,"a"]]},
    ode:{name:"よろこびの歌",tempo:104,
      mel:"E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2 | D4 D4 E4 C4 | D4 E4:0.5 F4:0.5 E4 C4 | D4 E4:0.5 F4:0.5 E4 D4 | C4 D4 G3 E4~ | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2",
      ch:"C | G7 | C | C G | C | G7 | C | G7 C | G C | G7 C | G7 C | D7 G | C | G7 | C | G7 C",
      deg:{"D7@44":"V7/V"},cad:{4:"半終止",8:"全終止",12:"半終止",16:"全終止"},form:[[1,4,"a"],[5,8,"a'"],[9,12,"b"],[13,16,"a'"]]},
    ex3:{name:"例 3（作例）",tempo:96,
      mel:"C4 D4 E4 G4 | A4 G4 E4 C#4 | D4 E4 F4 D4 | E4 D4 C4:2 | C4 D4 E4 G4 | A4 G4 E4 C4 | D4 E4 F#4 D4 | B3 A3 G3:2 | G4 F#4 G4 D4 | C4 E4 D4 F#4 | G4:4 | G4 F4 D4 B3 | C4 D4 E4 G4 | A4:2 Ab4:2 | G4:2 F4 D4 | E4 D4 C4:2",
      ch:"C | A7 | Dm G7 | C | C | Am7 | D7 | G | G | Am D7 | G | G7 | C | F Fm | C G7 | C",
      key:{6:"G",7:"G",8:"G",9:"G",10:"G",11:"G"},deg:{"A7@4":"V7/IIm","Am7@20":["VIm7","IIm7"],"G@40":["I","V"]},dkey:{"Am7@20":["C","G"],"G@40":["G","C"]},
      cad:{4:"全終止",8:"全終止（ト長調）",11:"全終止（ト長調）",12:"半終止",16:"全終止"},
      band:[[1,5,"ハ長調","C"],[6,6,"ピボット","P"],[7,10,"ト長調","G"],[11,11,"ピボット","P"],[12,16,"ハ長調","C"]],form:[[1,4,"a"],[5,8,"a'"],[9,12,"b"],[13,16,"a''"]]}
  };
  (function(){var o=_w18_SONGS.ode,s={};for(var k in o)s[k]=o[k];
    s.mel=o.mel.replace("C4 D4 G3 E4~ | E4 E4 F4 G4","C4 D4 G3:2 | E4 E4 F4 G4");s.name="よろこびの歌（先取りを省いた形）";_w18_SONGS.odes=s;})();
  var _w18_FNC={T:"blue",SD:"green",D:"signal",SDm:"purple"};
  function _w18_mel(s){var out=[],t=0;s.split("|").forEach(function(b,bi){b.trim().split(/\s+/).forEach(function(tok){if(!tok)return;
    var tie=/~$/.test(tok),p=tok.replace(/~$/,"").split(":"),d=p[1]?parseFloat(p[1]):1;out.push({t:t,d:d,n:p[0],tie:tie,bar:bi+1});t+=d;});});return out;}
  function _w18_ch(s){var out=[],t=0;s.split("|").forEach(function(b,bi){var tk=b.trim().split(/\s+/).filter(Boolean);
    tk.forEach(function(tok){var p=tok.split(":"),d=p[1]?parseFloat(p[1]):4/tk.length;out.push({t:t,d:d,sym:p[0],bar:bi+1});t+=d;});});return out;}
  /* ディグリーネーム → 機能。V7/IIm のようなセカンダリードミナントは D */
  function _w18_fn(deg){if(deg.indexOf("/")>=0)return "D";var m=/^[♭♯]?(VII|VI|V|IV|III|II|I)(.*)$/.exec(deg);if(!m)return "T";
    var n=m[1],q=m[2];if(n==="I"||n==="III"||n==="VI")return "T";if(n==="IV")return /^m/.test(q)?"SDm":"SD";if(n==="II")return "SD";return "D";}
  function _w18_pcs(sym){var c=chordParse(sym);return c.ivs.map(function(v){return (c.rootPc+v)%12;});}
  function _w18_sym(s){return s.replace(/#/g,"♯").replace(/b/g,"♭");}
  /* 旋律と和音を読み、和音にディグリーネーム・機能を、音にコードトーンか非和声音かを付ける（f18.py と同じ規則） */
  function _w18_ana(S){
    var notes=_w18_mel(S.mel),chords=_w18_ch(S.ch);
    chords.forEach(function(c){var k=c.sym+"@"+Math.round(c.t);c.key=(S.key&&S.key[c.bar])||"C";var dg=S.deg&&S.deg[k];if(dg==null)dg=roman(c.sym,c.key);
      c.deg=Array.isArray(dg)?dg:[dg];c.dkey=(S.dkey&&S.dkey[k])||c.deg.map(function(){return c.key;});c.fn=c.deg.map(_w18_fn);c.sec=c.deg[0].indexOf("/")>=0;});
    function at(t){for(var i=0;i<chords.length;i++){var c=chords[i];if(c.t-1e-9<=t&&t<c.t+c.d-1e-9)return c;}return chords[chords.length-1];}
    notes.forEach(function(n,i){var p=parse(n.n),c=at(n.t);n.midi=p.midi;n.dia=p.dia;n.chord=c;n.ct=_w18_pcs(c.sym).indexOf(p.midi%12)>=0;n.cont=i>0&&notes[i-1].tie;n.nct=null;
      if(!n.ct&&i>0&&i<notes.length-1){var a=parse(notes[i-1].n),b=parse(notes[i+1].n),dp=p.dia-a.dia,dn=b.dia-p.dia,cn=at(notes[i+1].t);
        if(Math.abs(dp)===1&&dp===dn)n.nct="経過";else if(Math.abs(dp)===1&&dn===-dp)n.nct="刺繍";
        else if(b.midi===p.midi&&cn!==c&&_w18_pcs(cn.sym).indexOf(p.midi%12)>=0)n.nct="先取";}});
    return {S:S,notes:notes,chords:chords};
  }
  /* 旋律（タイはつないで 1 音に）と和音（低音付き）の再生用の列。拍 t0〜t1 の範囲だけ */
  function _w18_evs(A,spb,t0,t1,withCh){
    var evs=[],prev=null;
    A.notes.forEach(function(n,i){if(n.cont||n.t<t0-1e-9||n.t>=t1-1e-9)return;var d=n.d,j=i;while(A.notes[j].tie&&j+1<A.notes.length){j++;d+=A.notes[j].d;}
      evs.push({t:(n.t-t0)*spb,d:Math.max(0.1,d*spb*0.94),m:[n.midi],v:1,ni:i});});
    if(withCh)A.chords.forEach(function(c,ci){if(c.t<t0-1e-9||c.t>=t1-1e-9)return;var v=voiceLead(c.sym,prev,45,52);prev=v;var cp=chordParse(c.sym),bp=cp.bassPc!=null?cp.bassPc:cp.rootPc;
      evs.push({t:(c.t-t0)*spb,d:c.d*spb*0.98,m:[40+((bp-40)%12+12)%12].concat(v),v:0.8,ci:ci});});
    evs.sort(function(a,b){return a.t-b.t;});return evs;
  }
  /* 押すと鳴り、もう一度押すと止まるボタン。ほかの音が鳴り始めたら表示を戻す */
  function _w18_toggle(b,label,start,onEnd){
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var r=start(); if(!r)return; b.setAttribute("aria-pressed","true"); b.textContent="■ 止める";
      hold(function(){b.setAttribute("aria-pressed","false");b.textContent=label;if(onEnd)onEnd();});
    });
  }
  function _w18_play(evs,timbre,onStep,onEnd,btn,label){
    playEvents(evs,{timbre:timbre||"piano",onStep:onStep,onEnd:function(){if(btn){btn.setAttribute("aria-pressed","false");btn.textContent=label;}if(onEnd)onEnd();}});
  }

  /* ============ 18. w18_phrase — 2 つのまとまりの旋律を重ねて比べる ============ */
  REG.w18_phrase=function(el){
    head(el,"Phrase","2 つのまとまりの旋律を重ねて、同じ所と違う所を見る");
    var row=ctrls(el),sSong=select(row,"曲",["きらきら星","よろこびの歌"]),sLen=select(row,"まとまりの長さ",["4 小節（フレーズ）","2 小節"]);
    var row2=ctrls(el),sX=select(row2,"X（青い太線）",["-"]),sY=select(row2,"Y（紫の細線）",["-"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bX=button(bar,"▶ X を鳴らす"),bY=button(bar,"▶ Y を鳴らす"),bXY=button(bar,"▶ X → Y");
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),A=null,hot=null;
    function units(){var nb=+sLen.value===0?4:2,tot=A.notes[A.notes.length-1].bar,us=[];for(var b=1;b<=tot;b+=nb)us.push({b0:b,nb:nb,label:"第 "+b+"〜"+(b+nb-1)+" 小節"});return us;}
    function opts(sel,us,v){sel.innerHTML="";us.forEach(function(u,i){var o=mk("option");o.value=String(i);o.textContent=u.label;sel.appendChild(o);});sel.value=String(v);}
    function load(vx,vy){A=_w18_ana(_w18_SONGS[["tw","ode"][+sSong.value]]);var us=units();opts(sX,us,vx);opts(sY,us,vy);draw();}
    function grid(u){var a=[],on=[];for(var k=0;k<u.nb*8;k++){var t=4*(u.b0-1)+k/2,n=null;A.notes.forEach(function(q){if(q.t-1e-9<=t&&t<q.t+q.d-1e-9)n=q;});
      a.push(n);on.push(!!(n&&Math.abs(n.t-t)<1e-9&&!n.cont));}return {n:a,on:on};}
    function draw(){
      var us=units(),ux=us[+sX.value]||us[0],uy=us[+sY.value]||us[0],gx=grid(ux),gy=grid(uy),N=gx.n.length;
      var ds=[];gx.n.concat(gy.n).forEach(function(n){if(n)ds.push(n.dia);});
      var lo=Math.min.apply(null,ds)-1,hi=Math.max.apply(null,ds)+1,W=640,rh=15,H=34+(hi-lo)*rh+40,ml=44,mr=10,px=(W-ml-mr)/N,Y=function(d){return 16+(hi-d)*rh;};
      var diff=[],rhy=[],dk=null,shift=true;
      for(var k=0;k<N;k++){var a=gx.n[k],c=gy.n[k];if(!a||!c)continue;if(a.midi!==c.midi)diff.push(k);var d=c.dia-a.dia;if(dk==null)dk=d;else if(d!==dk)shift=false;if(gx.on[k]!==gy.on[k])rhy.push(k);}
      var b=[];
      diff.forEach(function(k){b.push('<rect x="'+(ml+k*px)+'" y="8" width="'+px+'" height="'+((hi-lo)*rh+16)+'" fill="'+V("alias-soft")+'"/>');});
      for(var d=lo;d<=hi;d++){var y=Y(d);b.push(ln(ml,y,W-mr,y,V("line"),0.8));b.push(tx(ml-6,y+4,LETTERS[((d%7)+7)%7]+Math.floor(d/7),"end",10,V("muted")));}
      var yb=Y(lo)+14;
      for(var q=0;q<=ux.nb*4;q++){var x=ml+q*2*px;b.push(ln(x,8,x,yb-8,q%4===0?V("muted"):V("grid"),q%4===0?1.2:1));if(q<ux.nb*4)b.push(tx(x+px,yb+4,String(q%4+1),"middle",10,V("muted")));}
      for(q=0;q<ux.nb;q++)b.push(tx(ml+(q*8+4)*px,yb+20,"X: "+(ux.b0+q)+" / Y: "+(uy.b0+q)+" 小節","middle",10,V("muted")));
      /* 1 つの音を、鳴っている長さの 1 本の線で描く（8 分音符ずつに切らない） */
      function seg(g,col,w,op,off,dash){var k=0;while(k<N){var n=g.n[k];if(!n){k++;continue;}var j=k;while(j+1<N&&g.n[j+1]===n)j++;
        var x1=ml+k*px+3,x2=ml+(j+1)*px-4,y=Y(n.dia-off);
        b.push('<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" opacity="'+op+'"'+(dash?' stroke-dasharray="4,4"':'')+'/>');
        if(g.on[k])b.push('<circle cx="'+x1+'" cy="'+y+'" r="'+(w>4?5:3)+'" fill="'+col+'" opacity="'+op+'"/>');k=j+1;}}
      seg(gx,V("blue"),8,0.42,0);
      if(shift&&dk!==0&&dk!=null)seg(gy,V("purple"),2.2,0.9,dk,true);
      seg(gy,V("purple"),2.4,1,0);
      if(hot){var g=hot.u===0?gx:gy;for(var kk=0;kk<N;kk++)if(g.n[kk]===A.notes[hot.ni]&&(kk===0||g.n[kk-1]!==g.n[kk]))b.push('<circle cx="'+(ml+kk*px+3)+'" cy="'+Y(A.notes[hot.ni].dia)+'" r="7" fill="none" stroke="'+V("signal")+'" stroke-width="2.2"/>');}
      view.innerHTML=svgWrap(W,yb+28,b.join(""));
      var bars=[];diff.forEach(function(k){var bb=uy.b0+Math.floor(k/8);if(bars.indexOf(bb)<0)bars.push(bb);});
      var msg;
      if(!diff.length&&!rhy.length)msg='<b>同じ旋律</b>（同じ文字を付ける）';
      else if(!diff.length)msg='<b>高さは同じ</b>で、発音の位置だけが違う所がある（第 '+(uy.b0+Math.floor(rhy[0]/8))+' 小節の頭。タイで前からつながっている）';
      else if(shift&&!rhy.length)msg='<b>Y は X の各音を、文字 '+Math.abs(dk)+' 個分'+(dk>0?'上':'下')+'へずらした形</b>（リズムも同じ。紫の破線が元の高さに戻したもの）';
      else if(bars.length===1&&bars[0]===uy.b0+uy.nb-1)msg='<b>最後の小節だけが違う</b>（\' を付ける形）';
      else if(diff.length>N/2)msg='<b>大部分が違う</b>（新しい文字を付ける形）';
      else msg='<b>一部が違う</b>（違う小節: Y の第 '+bars.join("・")+' 小節）';
      ro.innerHTML='8 分音符ごとに比べた '+N+' か所のうち、同じ高さ <b>'+(N-diff.length)+'</b> か所・違う高さ <b>'+diff.length+'</b> か所（赤い背景）<br>→ '+msg;
    }
    /* which: 鳴らすまとまり（0 = X、1 = Y）の列 */
    function play(which,btn,label){var us=units(),spb=60/A.S.tempo,evs=[],off=0;which.forEach(function(w){var u=us[+(w?sY:sX).value],t0=4*(u.b0-1);
        _w18_evs(A,spb,t0,t0+4*u.nb,false).forEach(function(e){e.t+=off;e.u=w;evs.push(e);});off+=4*u.nb*spb+0.5;});
      _w18_play(evs,"piano",function(i){hot={u:evs[i].u,ni:evs[i].ni};draw();},function(){hot=null;draw();},btn,label);return true;}
    _w18_toggle(bX,"▶ X を鳴らす",function(){return play([0],bX,"▶ X を鳴らす");},function(){hot=null;draw();});
    _w18_toggle(bY,"▶ Y を鳴らす",function(){return play([1],bY,"▶ Y を鳴らす");},function(){hot=null;draw();});
    _w18_toggle(bXY,"▶ X → Y",function(){return play([0,1],bXY,"▶ X → Y");},function(){hot=null;draw();});
    sSong.addEventListener("change",function(){stopAll();load(0,1);});sLen.addEventListener("change",function(){stopAll();load(0,1);});
    [sX,sY].forEach(function(s){s.addEventListener("change",function(){stopAll();hot=null;draw();});});
    sSong.value="1";load(0,1);
  };

  /* ============ 18. 分析譜の 1 段を SVG で描く（w18_viewer） ============ */
  function _w18_row(A,b0,nb,first,last,L,cur){
    var s=8,U=26,G=14,xs=staffStart(s,0,"4/4"),x0=2,S=A.S;
    function Xr(r){return xs+U*r+G*Math.floor(r/4+1e-9);}
    function X(r){return x0+Xr(r);}
    function BXr(k){return Xr(4*k)-G*0.5-6;}
    var t0=4*(b0-1),t1=t0+4*nb,top=L.sym?42:28,items=[],extra=[];
    var rn=[],rc=[];A.notes.forEach(function(n,i){if(n.t>=t0-1e-9&&n.t<t1-1e-9)rn.push(i);});A.chords.forEach(function(c,i){if(c.t>=t0-1e-9&&c.t<t1-1e-9)rc.push(i);});
    rn.forEach(function(i){var n=A.notes[i],dd=durDot(n.d),col=i===cur.n?V("signal"):(L.nct&&n.nct&&!n.cont?V("gold"):V("ink"));
      var it={x:Xr(n.t-t0),notes:[n.n],dur:dd.dur,dot:dd.dot,fill:col};if(n.tie)it.tie=true;if(dd.dur==="eighth")it.beam="b"+Math.floor(n.t+1e-9);items.push(it);});
    for(var k=1;k<=nb;k++){var end=last&&k===nb;items.push({x:BXr(k)+(end?0.5*s:0),bar:end?"end":true});}
    var wr=BXr(nb)+(last?0.6*s:1),st=staff({s:s,w:wr,clef:"treble",time:first?"4/4":null,items:items,top:top}),b=[st.svg];
    function yn(nm){return top+4*s-(parse(nm).dia-30)*s/2;}
    var xend=x0+wr;
    if(rn.length){var ln_=A.notes[rn[rn.length-1]],fn_=A.notes[rn[0]];
      function half(x1,x2,y){var ya=y-0.55*s,xm=(x1+x2)/2;b.push('<path d="M'+x1+','+ya+' Q'+xm+','+(ya-1.1*s)+' '+x2+','+ya+' Q'+xm+','+(ya-0.8*s)+' '+x1+','+ya+'Z" fill="'+V("ink")+'"/>');}
      if(ln_.tie)half(X(ln_.t-t0)+4,xend-1,yn(ln_.n));if(fn_.cont)half(x0+xs-16,X(0)-4,yn(fn_.n));}
    b.push(tx(x0+2,top-8,String(b0),"start",9,V("muted")));for(k=1;k<nb;k++)b.push(tx(x0+BXr(k)-3,top-8,String(b0+k),"end",9,V("muted")));
    if(L.form)(S.form||[]).forEach(function(f){if(f[0]>=b0&&f[0]<b0+nb){var xf=f[0]===b0?x0+2:x0+BXr(f[0]-b0)+4;b.push(tx(xf+(f[0]===b0?14:0),14,f[2],"start",14,V("signal"),true));}});
    if(L.sym)rc.forEach(function(ci){var c=A.chords[ci];b.push(tx(X(c.t-t0)-5,top-18,_w18_sym(c.sym),"start",12.5,ci===cur.c?V("signal"):V("ink"),true));});
    var ppm=0;rn.forEach(function(i){ppm=Math.min(ppm,parse(A.notes[i].n).dia-30);});
    var yb=top+4*s+12+Math.max(0,-ppm*s/2-2);
    if(L.nct){rn.forEach(function(i){var n=A.notes[i];if(n.nct&&!n.cont)b.push(tx(X(n.t-t0),yb+10,n.nct,"middle",10,V("gold"),true));});yb+=15;}
    if(L.deg){var two=rc.some(function(ci){return A.chords[ci].deg.length>1;});
      rc.forEach(function(ci){var c=A.chords[ci],x=X(c.t-t0)-5;if(c.deg.length===1)b.push(tx(x,yb+11,c.deg[0],"start",11.5,V("ink"),true));
        else c.deg.forEach(function(d,j){b.push(tx(x,yb+11+14*j,d+"（"+(c.dkey[j]==="C"?"ハ":"ト")+"）","start",10,j?V("muted"):V("ink"),true));});});yb+=two?33:19;}
    if(L.fn){rc.forEach(function(ci){var c=A.chords[ci],x1=X(c.t-t0)-9,x2=(c.t+c.d-t0<4*nb-1e-9)?X(c.t+c.d-t0)-12:xend-4,parts=c.fn.length;
        for(var j=0;j<parts;j++){var a=x1+(x2-x1)*j/parts+(j?1.5:0),z=x1+(x2-x1)*(j+1)/parts-(j<parts-1?1.5:0),f=c.fn[j],col=V(_w18_FNC[f]);
          b.push('<rect x="'+a+'" y="'+yb+'" width="'+(z-a)+'" height="16" rx="4" fill="'+V(_w18_FNC[f]+"-soft")+'" stroke="'+col+'" stroke-width="'+(ci===cur.c?2.6:1.2)+'"'+(c.sec?' stroke-dasharray="4,3"':'')+'/>');
          b.push(tx((a+z)/2,yb+12,f,"middle",10.5,col,true));}});yb+=22;}
    if(L.cad){Object.keys(S.cad||{}).forEach(function(k2){var bar=+k2,lab=S.cad[k2];if(bar>=b0&&bar<b0+nb){var xr=x0+BXr(bar-b0+1)-2,tw=12*lab.length+12;
        b.push('<rect x="'+(xr-tw)+'" y="'+(yb+1)+'" width="'+tw+'" height="18" rx="9" fill="'+V("panel")+'" stroke="'+V("ink")+'" stroke-width="1"/>');b.push(tx(xr-tw/2,yb+14,lab,"middle",11,V("ink"),true));}});yb+=24;}
    if(L.key&&S.band){S.band.forEach(function(q){var a=Math.max(q[0],b0),z=Math.min(q[1],b0+nb-1);if(a>z)return;
        var xa=x0+(a>b0?BXr(a-b0):xs-12)+3,xz=x0+BXr(z-b0+1)-3,c=q[3]==="C"?"blue":q[3]==="G"?"gold":"muted";
        b.push('<rect x="'+xa+'" y="'+yb+'" width="'+(xz-xa)+'" height="17" rx="4" fill="'+(q[3]==="P"?V("panel"):V(c+"-soft"))+'" stroke="'+V(c)+'" stroke-width="1.1"'+(q[3]==="P"?' stroke-dasharray="4,3"':'')+'/>');
        b.push(tx((xa+xz)/2,yb+12.5,q[2],"middle",10.5,V(c),true));});yb+=22;}
    return svgWrap(xend+6,yb+4,b.join(""));
  }

  /* ============ 18. w18_viewer — 分析譜を層ごとに切り替えて鳴らす ============ */
  REG.w18_viewer=function(el){
    head(el,"Analysis","曲と層を選び、分析譜を見ながら鳴らす");
    var ids=["tw","ode","ex3"],row=ctrls(el),sSong=select(row,"曲",["きらきら星","よろこびの歌","例 3（作例）"]),sT=slider(row,"テンポ（1 分あたりの拍数）",60,140,100,2);
    var row2=ctrls(el),LAY=[["sym","コードネーム"],["deg","ディグリーネーム"],["fn","機能"],["nct","非和声音"],["cad","終止"],["form","楽式"],["key","調の帯"]],cb={};
    row2.style.gap=".3rem 1rem";LAY.forEach(function(q){cb[q[0]]=checkbox(row2,q[1],true);cb[q[0]].parentNode.parentNode.style.flex="0 1 auto";cb[q[0]].parentNode.parentNode.style.minWidth="0";});
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 全体を鳴らす");
    var hint=mk("span","",'段を押すと、その 4 小節（狭い画面では 2 小節）だけが鳴る');hint.style.cssText="font-family:var(--mono);font-size:.72rem;color:var(--muted);align-self:center";bar.appendChild(hint);
    var view=mk("div","wscreen");view.style.padding=".5rem .3rem";view.style.overflowX="auto";el.appendChild(view);
    var ro=readout(el),A=null,cur={n:-1,c:-1};
    function lay(){var L={};LAY.forEach(function(q){L[q[0]]=cb[q[0]].checked;});return L;}
    function draw(){
      if(!A)return;var L=lay(),W=view.clientWidth||640,bpr=W<560?2:4,tot=A.notes[A.notes.length-1].bar,h=[];sT.val.textContent=sT.input.value;
      for(var b0=1;b0<=tot;b0+=bpr)h.push('<div class="_w18r" data-b0="'+b0+'" data-nb="'+bpr+'" style="cursor:pointer;margin:.1rem 0">'+_w18_row(A,b0,bpr,b0===1,b0+bpr-1>=tot,L,cur)+'</div>');
      view.innerHTML=h.join("");
      var S=A.S,cads=Object.keys(S.cad).map(function(k){return "第 "+k+" 小節: "+S.cad[k];}).join("、");
      ro.innerHTML=S.name+'（'+tot+' 小節）　楽式: <b>'+S.form.map(function(f){return f[2];}).join(" ")+'</b><br>終止: '+cads+(cur.c>=0?'<br>鳴っている和音: <b>'+_w18_sym(A.chords[cur.c].sym)+'</b>（'+A.chords[cur.c].deg.join(" / ")+'、'+A.chords[cur.c].fn.join(" / ")+'）':'');
    }
    function load(){stopAll();A=_w18_ana(_w18_SONGS[ids[+sSong.value]]);sT.input.value=A.S.tempo;cur={n:-1,c:-1};draw();}
    function play(t0,t1,btn,label){var spb=60/(+sT.input.value),evs=_w18_evs(A,spb,t0,t1,true);
      _w18_play(evs,"piano",function(i){var e=evs[i];if(e.ni!=null)cur.n=e.ni;if(e.ci!=null)cur.c=e.ci;draw();},function(){cur={n:-1,c:-1};draw();},btn,label);return true;}
    _w18_toggle(bp,"▶ 全体を鳴らす",function(){return play(0,4*A.notes[A.notes.length-1].bar,bp,"▶ 全体を鳴らす");},function(){cur={n:-1,c:-1};draw();});
    view.addEventListener("click",function(e){var r=e.target.closest&&e.target.closest("._w18r");if(!r)return;var b0=+r.getAttribute("data-b0"),nb=+r.getAttribute("data-nb");
      stopAll();play(4*(b0-1),4*(b0-1+nb),null,null);});
    sSong.addEventListener("change",load);sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;});
    LAY.forEach(function(q){cb[q[0]].addEventListener("change",draw);});
    reg(null,draw);load();
  };

  /* ============ 18. w18_reharm — 2 拍ごとの和音を選び直して聞き比べる ============ */
  REG.w18_reharm=function(el){
    head(el,"Reharmonize","2 拍ごとの和音を選び直し、旋律との重なりと終止を確かめる");
    var ids=["tw","odes"],row=ctrls(el),sSong=select(row,"曲",["きらきら星","よろこびの歌（先取りを省いた形）"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bEx=button(bar,"この章の例"),bAlt=button(bar,"別の例"),bI=button(bar,"すべて I"),bp=button(bar,"▶ 鳴らす");
    var CANDS=["C","Dm","Em","F","G","G7","Am","Bdim","D7","E7","A7","Fm"],SEC={D7:"V7/V",E7:"V7/VIm",A7:"V7/IIm"},TGT={D7:["G","G7"],E7:["Am"],A7:["Dm"]};
    var ALT={tw:"C C|F C|Dm C|G7 C|Em Dm|C G|Em Dm|Am G|C C|F C|Dm C|G7 C",odes:"C C|G7 G7|Am Am|Em G|C C|G7 G7|Am Am|G7 C|G Em|G7 Am|G7 C|D7 G|C C|G7 G7|Am Am|G7 C"};
    var grid=mk("div","");grid.style.cssText="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.7rem";el.appendChild(grid);
    var ro=readout(el),A=null,slots=[],hot=-1;
    function deg(sym){return SEC[sym]||roman(sym,"C");}
    function fnOf(sym){return _w18_fn(deg(sym));}
    function preset(kind){var S=A.S,nb=A.notes[A.notes.length-1].bar,out=[];
      if(kind==="ex"){A.chords.forEach(function(c){for(var k=0;k<Math.round(c.d/2);k++)out.push(c.sym);});}
      else if(kind==="alt"){ALT[S.id].split("|").forEach(function(b){b.trim().split(/\s+/).forEach(function(x){out.push(x);});});}
      else for(var i=0;i<2*nb;i++)out.push("C");
      slots.forEach(function(s,i){s.sel.value=out[i];});update();}
    function build(){var S=_w18_SONGS[ids[+sSong.value]];S.id=ids[+sSong.value];A=_w18_ana(S);grid.innerHTML="";slots=[];var nb=A.notes[A.notes.length-1].bar;
      for(var b=1;b<=nb;b++){var box=mk("div","");box.style.cssText="flex:1 1 9.4rem;min-width:9.4rem;border:1px solid var(--line);border-radius:8px;padding:.3rem .35rem;background:var(--screen)";
        box.appendChild(mk("div","",'<span style="font-family:var(--mono);font-size:.7rem;color:var(--muted)">第 '+b+' 小節</span>'));
        var two=mk("div","");two.style.cssText="display:flex;gap:.3rem";box.appendChild(two);
        for(var h=0;h<2;h++){var c=mk("div","");c.style.cssText="flex:1;min-width:0";var nt=mk("div","");nt.style.cssText="font-family:var(--mono);font-size:.8rem;min-height:1.3rem;white-space:nowrap";
          var sel=mk("select");sel.style.cssText="width:100%;font-family:var(--mono);font-size:.78rem;padding:.2rem;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink)";
          CANDS.forEach(function(x){var o=mk("option");o.value=x;o.textContent=_w18_sym(x);sel.appendChild(o);});
          var dg=mk("div","");dg.style.cssText="font-family:var(--mono);font-size:.72rem;margin-top:.15rem;min-height:1.1rem";
          c.appendChild(nt);c.appendChild(sel);c.appendChild(dg);two.appendChild(c);
          var t0=4*(b-1)+2*h;slots.push({t0:t0,sel:sel,nt:nt,dg:dg,box:c});sel.addEventListener("change",update);}
        grid.appendChild(box);}
      preset("ex");}
    function update(){
      var strong=[0,0],flows=[],cads=[],nb=A.notes[A.notes.length-1].bar;
      slots.forEach(function(s,i){var sym=s.sel.value,pc=_w18_pcs(sym),h=[];
        A.notes.forEach(function(n){if(n.cont||n.t<s.t0-1e-9||n.t>=s.t0+2-1e-9)return;var ok=pc.indexOf(n.midi%12)>=0,stg=Math.abs(n.t-s.t0)<1e-9;if(!ok&&stg)strong[i%2]++;
          h.push('<span style="color:'+(ok?'var(--green)':stg?'var(--alias)':'var(--gold)')+';font-weight:'+(ok?400:700)+(stg?';text-decoration:underline':'')+'">'+nname(n.n,false)+'</span>');});
        s.nt.innerHTML=h.join(" ")||"&nbsp;";var f=fnOf(sym);
        s.dg.innerHTML='<b>'+deg(sym)+'</b> <span style="color:var(--'+_w18_FNC[f]+')">'+f+'</span>';
        s.box.style.outline=i===hot?"2px solid var(--signal)":"none";});
      var seq=[];slots.forEach(function(s,i){var sym=s.sel.value;if(!seq.length||seq[seq.length-1].sym!==sym)seq.push({sym:sym,i:i});});
      for(var k=1;k<seq.length;k++){var a=seq[k-1].sym,c=seq[k].sym,fa=fnOf(a),fc=fnOf(c),bb=Math.floor(seq[k].i/2)+1;
        if(SEC[a]){if(TGT[a].indexOf(c)<0)flows.push("第 "+bb+" 小節: "+_w18_sym(a)+"（"+SEC[a]+"）の次が "+TGT[a].join("・")+" でない");}
        else if(fa==="D"&&(fc==="SD"||fc==="SDm"))flows.push("第 "+bb+" 小節: D → "+fc+"（"+_w18_sym(a)+" → "+_w18_sym(c)+"）");}
      for(var e=4;e<=nb;e+=4){var last=slots[2*e-1].sel.value,prev=null;for(var j=2*e-2;j>=0;j--){if(slots[j].sel.value!==last){prev=slots[j].sel.value;break;}}
        var l=fnOf(last),p=prev?fnOf(prev):null,kind;
        if(last==="C"&&p==="D"&&!SEC[prev])kind="全終止";else if(last==="C"&&(p==="SD"||p==="SDm"))kind="変終止";else if(l==="D"&&!SEC[last])kind="半終止";
        else if(last==="Am"&&p==="D")kind="偽終止";else kind="終止の形になっていない";
        cads.push("第 "+e+" 小節: "+(prev?_w18_sym(prev)+" → ":"")+_w18_sym(last)+" <b>"+kind+"</b>");}
      ro.innerHTML='和音に含まれない音（下線付きの赤）: 1 拍目（強拍） <b'+(strong[0]?' class="warn"':'')+'>'+strong[0]+'</b> か所、3 拍目（中強拍） <b>'+strong[1]+'</b> か所<br>'+
        '機能の流れに合わない動き: '+(flows.length?'<span class="warn">'+flows.join("、")+'</span>':'<b>なし</b>')+'<br>フレーズの終わり: '+cads.join("、")+
        '<br><span style="color:var(--green)">緑</span> = 和音の音、<span style="color:var(--gold)">金</span> = 弱拍の非和声音';
    }
    function play(){var spb=60/A.S.tempo,evs=[],prev=null;
      A.notes.forEach(function(n,i){if(n.cont)return;var d=n.d,j=i;while(A.notes[j].tie&&j+1<A.notes.length){j++;d+=A.notes[j].d;}evs.push({t:n.t*spb,d:d*spb*0.94,m:[n.midi],v:1});});
      var k=0;while(k<slots.length){var sym=slots[k].sel.value,j=k;while(j+1<slots.length&&slots[j+1].sel.value===sym)j++;var v=voiceLead(sym,prev,45,52);prev=v;var cp=chordParse(sym);
        evs.push({t:slots[k].t0*spb,d:(j-k+1)*2*spb*0.98,m:[40+((cp.rootPc-40)%12+12)%12].concat(v),v:0.8,si:k});k=j+1;}
      evs.sort(function(a,b){return a.t-b.t;});
      _w18_play(evs,"piano",function(i){if(evs[i].si!=null){hot=evs[i].si;update();}},function(){hot=-1;update();},bp,"▶ 鳴らす");return true;}
    _w18_toggle(bp,"▶ 鳴らす",play,function(){hot=-1;update();});
    bEx.addEventListener("click",function(){preset("ex");});bAlt.addEventListener("click",function(){preset("alt");});bI.addEventListener("click",function(){preset("I");});
    sSong.addEventListener("change",function(){stopAll();build();});
    build();
  };

  /* ===== END CHAPTER WIDGETS ===== */

  function init(){
    document.querySelectorAll("[data-widget]").forEach(function(el){
      if(el.dataset.done)return; el.dataset.done="1";
      var fn=REG[el.getAttribute("data-widget")];
      if(fn){try{fn(el);}catch(e){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: '+e.message+'</div>';}}
    });
    requestAnimationFrame(redrawAll);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.MUSIC={parse:parse,mfreq:mfreq,pianoData:pianoData,playEvents:playEvents,stopAll:stopAll,parseSeq:parseSeq,chordParse:chordParse,chordMidis:chordMidis,chordSpell:chordSpell,roman:roman,voiceLead:voiceLead,spellScale:spellScale,keyAcc:keyAcc,keyCount:keyCount,staff:staff,staffStart:staffStart};
})();
