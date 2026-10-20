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
    var clf=sp.clef||(perc?"perc":slo>=55?"treble":shi<=64?"bass":"grand");
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
          return '<span class="'+(o?"on":"")+'" style="flex:'+e.beats+' 1 0">'+(e.sym?'<b>'+esc(e.sym)+'</b>'+(key?'<i>'+esc(roman(e.sym,key))+'</i>':''):'<b>–</b>')+'</span>';}).join("")+'</div>');
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
              if(!e.m.length){it.rest=true; if(clf==="grand")it.staff=v.kind==="bass"||vk>0?"bass":"treble";}
              else{it.notes=e.notes.filter(function(n,j){return e.m[j]>=0||n[0]==="%";});
                if(dd.dur==="eighth"||dd.dur==="16th")it.beam=vi+":"+Math.floor(pc.b/grp+1e-9);
                if(pj<ps.length-1)it.tie=true;
                if(clf==="grand"&&v.kind==="bass")it.staff="bass";
                if(two)it.stem=vk===0?"up":"down";}
              if(pj===0&&chordSteps&&v.kind==="chord")it.sym=e.sym;
              items.push(it);});});});
        if(chordSteps&&!staffV.some(function(v){return v.kind==="chord";}))chordSteps.forEach(function(e){if(e.sym)items.push({b:e.b,x:X(e.b),notes:[],sym:e.sym,symcol:V("purple")});});
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
