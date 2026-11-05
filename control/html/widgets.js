/* 動かして理解する制御工学 — 章内インタラクティブ部品
   共通部品（この前半）と、各章の部品（wjs/wNN.js を build_site.py が CHAPTER WIDGETS 区間へ流し込む）でできている。
   各章の部品は REG.wNN_名前 = function(el){ ... } の形で登録し、本文の <!-- widget:wNN_名前 --> の位置に表示される。 */
(function(){
  "use strict";
  var root=document.documentElement;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  /* ---- 色: SVG の属性にはそのまま "var(--x)" を書く（テーマの切り替えに自動で追従する） ---- */
  var COL={ink:"var(--ink)",muted:"var(--muted)",faint:"var(--faint)",line:"var(--line)",panel:"var(--panel)",screen:"var(--screen)",grid:"var(--grid)",
    signal:"var(--signal)",alias:"var(--alias)",green:"var(--green)",gold:"var(--gold)",purple:"var(--purple)",teal:"var(--teal)"};
  var SOFTC={"var(--signal)":"var(--signal-soft)","var(--alias)":"var(--alias-soft)","var(--green)":"var(--green-soft)","var(--gold)":"var(--gold-soft)",
    "var(--purple)":"var(--purple-soft)","var(--teal)":"var(--teal-soft)"};
  function col(c){return COL[c]||c;}
  function soft(c){c=col(c);return SOFTC[c]||"var(--muted-soft)";}

  /* ---- DOM ---- */
  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+esc(k)+'</span><span class="t">'+t+'</span>'));}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function btnrow(el){var d=mk("div","btns");el.appendChild(d);return d;}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function note(el,h){var r=mk("div","wnote",h);el.appendChild(r);return r;}
  /* スライダー: o = {min, max, step, value, fmt(v)→文字列, onInput(v)}
     log:true で対数目盛（値は有効数字 3 桁に丸める。int:true なら整数に、o.snap(v) なら独自に丸める）。右端・左端はちょうど max・min を返す。
     values:[…] で決まった値の列から選ぶ（例 [64,128,256,512,1024]。このとき min・max・step・log は使わない）。
     set(v) で決めた値は、利用者が動かすまでそのまま get() が返す。返り値 {get(), set(v), input}。 */
  function slider(row,label,o){
    var c=mk("div","ctrl"); var lg=!!o.log, vals=o.values||null, exact=null;
    var mn=vals?0:(lg?Math.log10(o.min):o.min), mx=vals?vals.length-1:(lg?Math.log10(o.max):o.max),
        st=vals?1:(lg?(o.step||0.001):(o.step||1));
    c.innerHTML='<label><span>'+label+'</span><b class="val"></b></label><input type="range">';
    var inp=c.querySelector("input"), val=c.querySelector(".val");
    inp.min=mn; inp.max=mx; inp.step=st;
    function raw2v(r){
      if(vals)return vals[Math.max(0,Math.min(vals.length-1,Math.round(+r)))];
      if(exact!==null)return exact;
      if(lg&&+r>mx-st)return o.max;
      if(lg&&+r<=mn)return o.min;
      var v=lg?Math.pow(10,+r):+r;
      if(lg)v=o.snap?o.snap(v):(o.int?Math.round(v):+v.toPrecision(3));
      return v;}
    function show(){val.textContent=o.fmt?o.fmt(api.get()):String(api.get());}
    var api={input:inp,el:c,
      get:function(){return raw2v(inp.value);},
      set:function(v){
        if(vals){var k=0;vals.forEach(function(x,i){if(Math.abs(x-v)<Math.abs(vals[k]-v))k=i;});inp.value=k;exact=null;}
        else{inp.value=lg?Math.log10(v):v;exact=v;}
        show();}};
    inp.addEventListener("input",function(){exact=null;show();if(o.onInput)o.onInput(api.get());});
    api.set(o.value); row.appendChild(c); return api;
  }
  /* 選択: opts は文字列の配列、または [{v:値, t:表示}] 。get() は値（文字列の配列なら番号）を返す。 */
  function select(row,label,opts,value,onChange){
    var c=mk("div","ctrl"); c.innerHTML='<label><span>'+label+'</span></label><select></select>';
    var s=c.querySelector("select");
    opts.forEach(function(o,i){var op=mk("option");if(typeof o==="string"){op.value=i;op.textContent=o;}else{op.value=o.v;op.textContent=o.t;}s.appendChild(op);});
    if(value!=null)s.value=value;
    var isStr=typeof opts[0]==="string";
    var api={el:c,input:s,get:function(){return isStr?+s.value:s.value;},set:function(v){s.value=v;}};
    if(onChange)s.addEventListener("change",function(){onChange(api.get());});
    row.appendChild(c); return api;
  }
  function checkbox(row,label,on,onChange){
    var c=mk("label","chk",'<input type="checkbox"'+(on?" checked":"")+'><span>'+label+'</span>');
    var i=c.querySelector("input"); if(onChange)i.addEventListener("change",function(){onChange(i.checked);});
    row.appendChild(c); return {el:c,input:i,get:function(){return i.checked;},set:function(v){i.checked=!!v;}};
  }
  function textin(row,label,val,onChange,o){
    o=o||{}; var c=mk("div","ctrl"); c.innerHTML='<label><span>'+label+'</span></label><input type="text">';
    var i=c.querySelector("input"); i.value=val; if(o.width)c.style.flex="1 1 "+o.width;
    i.setAttribute("spellcheck","false");
    if(onChange)i.addEventListener("input",function(){onChange(i.value);});
    row.appendChild(c); return {el:c,input:i,get:function(){return i.value;},set:function(v){i.value=v;}};
  }
  function button(row,t,onClick){var b=mk("button","btn",t);b.type="button";if(onClick)b.addEventListener("click",onClick);row.appendChild(b);return b;}
  /* 押した 1 つだけが選ばれるボタンの組。opts は表示文字列の配列。返り値 {get(), set(i)} */
  function seg(row,opts,value,onChange){
    var d=mk("div","btns");d.style.marginTop="0";var bs=[],cur=value||0;
    opts.forEach(function(t,i){var b=button(d,t,function(){api.set(i);if(onChange)onChange(i);});bs.push(b);});
    var api={el:d,get:function(){return cur;},set:function(i){cur=i;bs.forEach(function(b,j){b.setAttribute("aria-pressed",j===i?"true":"false");});}};
    api.set(cur); row.appendChild(d); return api;
  }
  /* SVG の表示枠。set(svg文字列) で中身を差し替える。opts.scroll=true なら横に広い図をスクロールで見せる */
  function svgbox(el,opts){opts=opts||{};var d=mk("div","wsvg"+(opts.scroll?" scroll":""));if(opts.minH)d.style.minHeight=opts.minH+"px";el.appendChild(d);
    return {el:d,set:function(s){d.innerHTML=s;}};}
  /* 表: align[i] は "left"・"right"・"center"、または "wrap"（左寄せで、長い文を折り返す列） */
  function tbl(headers,rows,align){
    function at(i){var a=(align&&align[i])||"left";return a==="wrap"?' class="wrap" style="text-align:left"':' style="text-align:'+a+'"';}
    var h='<div class="wtable"><table><thead><tr>'+headers.map(function(t,i){return '<th'+at(i)+'>'+t+'</th>';}).join("")+'</tr></thead><tbody>';
    rows.forEach(function(r){h+='<tr>'+r.map(function(v,i){return '<td'+at(i)+'>'+v+'</td>';}).join("")+'</tr>';});
    return h+'</tbody></table></div>';
  }

  /* ---- 数値の書式 ---- */
  function sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  var fmt={
    num:function(v,d){return sig(v,d);},
    fix:function(v,d){return (+v).toFixed(d).replace("-","−");},
    int:function(v){return Math.round(v).toLocaleString("en-US");},
    time:function(s,d){var a=Math.abs(s);if(a===0)return "0 s";if(a<1e-6)return sig(s*1e9,d)+" ns";if(a<1e-3)return sig(s*1e6,d)+" µs";if(a<1)return sig(s*1e3,d)+" ms";
      if(a<120)return sig(s,d)+" s";if(a<7200)return sig(s/60,d)+" 分";if(a<172800)return sig(s/3600,d)+" 時間";if(a<3*365*86400/12)return sig(s/86400,d)+" 日";return sig(s/(365*86400),d)+" 年";},
    rate:function(b,d){var a=Math.abs(b);if(a>=1e6)return sig(b/1e6,d)+" Mbps";if(a>=1e3)return sig(b/1e3,d)+" kbps";return sig(b,d)+" bps";},
    bytes:function(n,d){var a=Math.abs(n);if(a>=1048576)return sig(n/1048576,d)+" MB";if(a>=1024)return sig(n/1024,d)+" KB";return Math.round(n)+" B";},
    cur:function(A,d){var a=Math.abs(A);if(a>=1)return sig(A,d)+" A";if(a>=1e-3)return sig(A*1e3,d)+" mA";if(a>=1e-6)return sig(A*1e6,d)+" µA";return sig(A*1e9,d)+" nA";},
    pct:function(x,d){return sig(x*100,d||3)+" %";},
    hex:function(v,n){var s=(v>>>0).toString(16).toUpperCase();while(s.length<(n||2))s="0"+s;return s;}
  };

  /* ---- SVG の部品（figures.py と同じ見た目） ---- */
  function tw(s,sz,mono){var w=0;s=String(s);for(var i=0;i<s.length;i++){var o=s.charCodeAt(i);w+=o<128?sz*(mono?0.6:0.56):(o>=0xFF61&&o<=0xFF9F?sz*0.55:((o===0xB2||o===0xB3||o===0xB9||(o>=0x2070&&o<=0x209F))?sz*0.4:((o>=0x300&&o<=0x36F)?0:((o>=0x370&&o<=0x3FF)?sz*0.6:sz))));}return w;}   /* 結合文字は幅 0、ギリシャ文字は半角ほど */
  var S={
    svg:function(w,h,body,cls){return '<svg viewBox="0 0 '+w+' '+h+'" width="'+w+'" role="img"'+(cls?' class="'+cls+'"':'')+'>'+(Array.isArray(body)?body.join(""):body)+'</svg>';},
    T:function(x,y,s,a,sz,c,b,mono,rot,halo){return '<text x="'+r2(x)+'" y="'+r2(y)+'" text-anchor="'+(a||"middle")+'" font-size="'+(sz||11)+'" fill="'+col(c||"muted")+
      '" font-family="var('+(mono?"--mono":"--sans")+')" font-weight="'+(b?700:400)+'"'+(rot!=null?' transform="rotate('+rot+' '+r2(x)+' '+r2(y)+')"':'')+
      (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>'+esc(s)+'</text>';},   /* halo: 地の色の縁取りで下の線を隠す */
    W:function(pts,c,lw,dash){return '<polyline points="'+pts.map(function(p,i){return (i%2?"":" ")+r2(p);}).join(",").replace(/, /g," ").trim()+'" fill="none" stroke="'+col(c||"muted")+'" stroke-width="'+(lw||1.5)+'" stroke-linecap="round" stroke-linejoin="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';},
    L:function(x1,y1,x2,y2,c,lw,dash){return '<line x1="'+r2(x1)+'" y1="'+r2(y1)+'" x2="'+r2(x2)+'" y2="'+r2(y2)+'" stroke="'+col(c||"muted")+'" stroke-width="'+(lw||1.5)+'" stroke-linecap="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';},
    PL:function(pts,c,lw,fill,dash,op){var tag=fill&&fill!=="none"?"polygon":"polyline";return '<'+tag+' points="'+pts.map(function(p){return r2(p[0])+","+r2(p[1]);}).join(" ")+'" fill="'+(fill?col(fill):"none")+'" stroke="'+col(c||"muted")+'" stroke-width="'+(lw||1.6)+'" stroke-linejoin="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+(op!=null?' fill-opacity="'+op+'"':'')+'/>';},
    PATH:function(d,c,lw,fill,dash){return '<path d="'+d+'" fill="'+(fill?col(fill):"none")+'" stroke="'+col(c||"muted")+'" stroke-width="'+(lw||1.6)+'" stroke-linecap="round" stroke-linejoin="round"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';},
    RECT:function(x,y,w,h,r,fill,c,lw,dash,extra){return '<rect x="'+r2(x)+'" y="'+r2(y)+'" width="'+r2(Math.max(0,w))+'" height="'+r2(Math.max(0,h))+'" rx="'+(r==null?6:r)+'" fill="'+col(fill||"panel")+'" stroke="'+col(c||"line")+'" stroke-width="'+(lw==null?1.3:lw)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+(extra||"")+'/>';},
    CIRC:function(x,y,r,c,lw,fill,dash){return '<circle cx="'+r2(x)+'" cy="'+r2(y)+'" r="'+r+'" fill="'+(fill?col(fill):"none")+'" stroke="'+col(c||"line")+'" stroke-width="'+(lw||1.4)+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';},
    D:function(x,y,c,r){return '<circle cx="'+r2(x)+'" cy="'+r2(y)+'" r="'+(r||3.4)+'" fill="'+col(c||"muted")+'"/>';},
    head:function(x1,y1,x2,y2,c,hd){hd=hd||7;var a=Math.atan2(y2-y1,x2-x1);return '<polygon points="'+r2(x2)+','+r2(y2)+' '+r2(x2-hd*Math.cos(a-0.42))+','+r2(y2-hd*Math.sin(a-0.42))+' '+r2(x2-hd*Math.cos(a+0.42))+','+r2(y2-hd*Math.sin(a+0.42))+'" fill="'+col(c||"muted")+'"/>';},
    ARR:function(x1,y1,x2,y2,c,lw,hd,dash){hd=hd||7;var a=Math.atan2(y2-y1,x2-x1);return S.L(x1,y1,x2-hd*0.6*Math.cos(a),y2-hd*0.6*Math.sin(a),c,lw||1.6,dash)+S.head(x1,y1,x2,y2,c,hd);},
    DARR:function(x1,y1,x2,y2,c,lw,hd){hd=hd||6;var a=Math.atan2(y2-y1,x2-x1);return S.L(x1+hd*0.6*Math.cos(a),y1+hd*0.6*Math.sin(a),x2-hd*0.6*Math.cos(a),y2-hd*0.6*Math.sin(a),c,lw||1.3)+S.head(x1,y1,x2,y2,c,hd)+S.head(x2,y2,x1,y1,c,hd);},
    BOX:function(x,y,w,h,title,sub,c,fill,sz){sz=sz||12;var o=[S.RECT(x,y,w,h,8,fill||"panel",c||"line",1.4)];
      if(sub){o.push(S.T(x+w/2,y+h/2-3,title,"middle",sz,"ink",true));o.push(S.T(x+w/2,y+h/2+sz,sub,"middle",sz-2,"muted"));}
      else o.push(S.T(x+w/2,y+h/2+sz*0.38,title,"middle",sz,"ink",true));return o.join("");},
    CHIP:function(x,y,t,c,sz){sz=sz||10;var w=tw(t,sz)+10;return S.RECT(x-w/2,y-sz-2,w,sz+7,4,soft(c),col(c),1)+S.T(x,y+1,t,"middle",sz,c,true);},
    X:function(x,y,r,c,lw){r=r||5;return S.L(x-r,y-r,x+r,y+r,c||"alias",lw||2)+S.L(x-r,y+r,x+r,y-r,c||"alias",lw||2);},
    /* 添字・上付き・上の点を含む文字（figures.py の TX と同じ書き方）:
       "K_P" "u_0" "ω_gc"・"t_{2%}"・"e^{−Ls}" "x^2"・"\\dot{θ}_m" "\\ddot{p}"（点は小さな円で描く）。rot は回転の角度 */
    TX:function(x,y,s,a,sz,c,b,halo,rot){sz=sz||10;s=String(s);var segs=[],re=/\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-\u024F])_\{([^}]*)\}|([A-Za-zα-ωΑ-Ω])_([A-Za-z0-9∞%]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)/g,m,pos=0;
      while((m=re.exec(s))){if(m.index>pos)segs.push(["n",s.slice(pos,m.index)]);
        if(m[1]){segs.push([m[1]==="ddot"?"dot2":"dot1",m[2]]);var rest=s.slice(re.lastIndex),m2=/^_\{([^}]*)\}|^_([A-Za-z0-9∞%]+)/.exec(rest);if(m2){segs.push(["sub",m2[1]!=null?m2[1]:m2[2]]);re.lastIndex+=m2[0].length;}}
        else if(m[3]!=null){segs.push(["n",m[3]]);segs.push(["sub",m[4]]);}
        else if(m[5]!=null){segs.push(["n",m[5]]);segs.push(["sub",m[6]]);}
        else segs.push(["sup",m[7]!=null?m[7]:m[8]]);
        pos=re.lastIndex;}
      if(pos<s.length)segs.push(["n",s.slice(pos)]);
      var ss=sz*0.72,ws=function(g){return (g[0]==="sub"||g[0]==="sup")?tw(g[1],ss):tw(g[1],sz);},w=0;segs.forEach(function(g){w+=ws(g);});
      var x0=x-(a==="middle"?w/2:(a==="end"?w:0)),cur=0,xx=x0,dots=[];
      var h='<text x="'+r2(x0)+'" y="'+r2(y)+'" text-anchor="start" font-size="'+sz+'" fill="'+col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
        (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>';
      segs.forEach(function(g){var want=g[0]==="sub"?3:(g[0]==="sup"?-sz*0.38:0),dy=want-cur;cur=want;
        h+='<tspan'+(Math.abs(dy)>1e-9?' dy="'+r2(dy)+'"':'')+((g[0]==="sub"||g[0]==="sup")?' font-size="'+r2(ss)+'"':'')+'>'+esc(g[1])+'</tspan>';
        var gw=ws(g),nsp=(g[1].match(/ /g)||[]).length;if(nsp)gw-=nsp*((g[0]==="sub"||g[0]==="sup")?ss:sz)*0.28;if(g[0]==="dot1"||g[0]==="dot2"){var cx=xx+gw/2,cy=y-sz*0.86,rr=Math.max(1.1,sz*0.11);if(g[0]==="dot1")dots.push([cx,cy,rr]);else{dots.push([cx-sz*0.13,cy,rr]);dots.push([cx+sz*0.13,cy,rr]);}}xx+=gw;});
      h+='</text>';dots.forEach(function(d){h+='<circle cx="'+r2(d[0])+'" cy="'+r2(d[1])+'" r="'+r2(d[2])+'" fill="'+col(c||"ink")+'"/>';});
      return rot!=null?'<g transform="rotate('+rot+' '+r2(x)+' '+r2(y)+')">'+h+'</g>':h;},
    /* ブロック線図の加え合わせ点。signs = {l:"+", b:"−"}（矢印が入る側と符号） */
    SUMJ:function(x,y,signs,c,R){R=R||15;var k=R*0.7071,f=R/15,o=[S.CIRC(x,y,R,c||"ink",1.5,"screen"),S.L(x-k,y-k,x+k,y+k,"muted",0.9),S.L(x-k,y+k,x+k,y-k,"muted",0.9)];
      var pos={l:[-8.2,3.9],r:[8.2,3.9],t:[0,-4.6],b:[0,12.4]};
      Object.keys(signs).forEach(function(sd){var q=pos[sd];o.push(S.T(x+q[0]*f,(sd==="l"||sd==="r")?y+(q[1]-3.9)*f+3.9:y+q[1]*f,signs[sd],"middle",10.5*f,c||"ink",true));});
      return o.join("");},
    /* 線の見本つきの凡例（横に並べる）。items = [[色, 破線 or null, 文字], …] */
    LEGL:function(x,y,items,sz,gap){sz=sz||10;gap=gap||18;var o=[],xx=x;
      items.forEach(function(it){o.push(S.L(xx,y-4,xx+24,y-4,it[0],2.2,it[1]));o.push(S.TX(xx+30,y,it[2],"start",sz,"muted"));xx+=30+tw(String(it[2]).replace(/_/g,""),sz)+gap;});
      return o.join("");},
    /* 左端を (x, y) にそろえた CHIP */
    CHIPL:function(x,y,t,c,sz){sz=sz||10;var w=tw(t,sz)+10;return S.CHIP(x+w/2,y,t,c,sz);},
    /* ---- ブロック線図の部品（07 章で作ったものを共通にした。figures.py の TXW・FRAC・TFBW・TFBOX・CHAIN・FBPATH・FFPATH・TOPIN と同じ見た目） ---- */
    /* TX で書いた文字の幅（添字・上付きは 0.72 倍の大きさで数える） */
    TXW:function(s,sz){sz=sz||10;s=String(s);var re=/\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-ɏ])_\{([^}]*)\}|([A-Za-zα-ωΑ-Ω])_([A-Za-z0-9∞%]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)/g,m,pos=0,w=0,ss=sz*0.72;
      while((m=re.exec(s))){if(m.index>pos)w+=tw(s.slice(pos,m.index),sz);
        if(m[1])w+=tw(m[2],sz);else if(m[3]!=null)w+=tw(m[3],sz)+tw(m[4],ss);else if(m[5]!=null)w+=tw(m[5],sz)+tw(m[6],ss);else w+=tw(m[7]!=null?m[7]:m[8],ss);
        pos=re.lastIndex;}
      if(pos<s.length)w+=tw(s.slice(pos),sz);return w;},
    /* 分数（xc は中心、yc は横線の高さ）。num・den は TX の書き方の文字 */
    FRAC:function(xc,yc,num,den,sz,c,b){sz=sz||10.5;c=c||"ink";var w=Math.max(S.TXW(num,sz),S.TXW(den,sz))+6;
      return S.TX(xc,yc-4,num,"middle",sz,c,b)+S.L(xc-w/2,yc,xc+w/2,yc,c,1)+S.TX(xc,yc+sz+1.5,den,"middle",sz,c,b);},
    /* 伝達関数の箱の幅。s が [分子, 分母] なら分数 */
    TFBW:function(s){if(Array.isArray(s))return Math.max(40,Math.max(S.TXW(s[0],10.5),S.TXW(s[1],10.5))+18);return Math.max(40,S.TXW(s,11.5)+18);},
    /* 箱（左端 x、中心の高さ yc）。s が [分子, 分母] なら分数、文字なら 1 行。hl なら信号の色で強調。返り値 {svg, w} */
    TFBOX:function(x,yc,s,w,hl,h){w=w||S.TFBW(s);var c=hl?"signal":"line",f=hl?soft("signal"):"panel";
      if(Array.isArray(s)){h=h||44;return {svg:S.RECT(x,yc-h/2,w,h,6,f,c,1.4)+S.FRAC(x+w/2,yc-1,s[0],s[1],10.5),w:w};}
      h=h||34;return {svg:S.RECT(x,yc-h/2,w,h,6,f,c,1.4)+S.TX(x+w/2,yc+4.1,s,"middle",11.5,"ink"),w:w};},
    /* 横一列のブロック線図: ["a",長さ,文字,色] 矢印、["b",中身,名前,強調] 箱、["s",符号,名前] 加え合わせ点、
       ["t",名前,色] 引き出し点（幅 0）、["w",長さ,色] 矢じりの無い線。返り値 {svg, pos（箱は [左,右]、点は中心の x）, x（右端）} */
    CHAIN:function(x,yc,items){var R=15,o=[],pos={};
      items.forEach(function(it){var k=it[0];
        if(k==="a"){o.push(S.ARR(x,yc,x+it[1],yc,it[3],1.6));if(it[2])o.push(S.TX(x+it[1]/2,yc-8,it[2],"middle",10,it[3],true,true));x+=it[1];}
        else if(k==="b"){var b=S.TFBOX(x,yc,it[1],null,!!it[3]);o.push(b.svg);if(it[2])pos[it[2]]=[x,x+b.w];x+=b.w;}
        else if(k==="s"){o.push(S.SUMJ(x+R,yc,it[1]));pos[it[2]]=x+R;x+=2*R;}
        else if(k==="t"){o.push(S.D(x,yc,it[2]||"ink",3.6));pos[it[1]]=x;}
        else if(k==="w"){o.push(S.L(x,yc,x+it[1],yc,it[2],1.6));x+=it[1];}});
      return {svg:o.join(""),pos:pos,x:x};},
    /* 戻る線: 引き出し点 xf から depth 下がって左へ、加え合わせ点（中心 xt）の下から入る。box があれば途中に箱 */
    FBPATH:function(xf,xt,yc,depth,c,box,hl,lab){c=c||"signal";var R=15,yb=yc+depth,o=[S.L(xf,yc,xf,yb,c,1.5)];
      if(box!=null){var w=S.TFBW(box),xm=(xf+xt)/2;o.push(S.ARR(xf,yb,xm+w/2,yb,c,1.5,6));o.push(S.TFBOX(xm-w/2,yb,box,w,hl,Array.isArray(box)?40:26).svg);o.push(S.L(xm-w/2,yb,xt,yb,c,1.5));}
      else o.push(S.L(xf,yb,xt,yb,c,1.5));
      o.push(S.ARR(xt,yb,xt,yc+R,c,1.5,6));
      if(lab)o.push(S.TX((xf+xt)/2,yb-6,lab,"middle",9.5,c,true,true));
      return o.join("");},
    /* 上を通る道: 引き出し点 xf から h 上がって右へ、加え合わせ点（中心 xt）の上から入る（フィードフォワードの道など） */
    FFPATH:function(xf,xt,yc,h,c,box,hl,lab){c=c||"signal";var R=15,yt=yc-h,o=[S.L(xf,yc,xf,yt,c,1.5)];
      if(box!=null){var w=S.TFBW(box),xm=(xf+xt)/2;o.push(S.ARR(xf,yt,xm-w/2,yt,c,1.5,6));o.push(S.TFBOX(xm-w/2,yt,box,w,hl,Array.isArray(box)?40:26).svg);o.push(S.L(xm+w/2,yt,xt,yt,c,1.5));}
      else o.push(S.L(xf,yt,xt,yt,c,1.5));
      o.push(S.ARR(xt,yt,xt,yc-R,c,1.5,6));
      if(lab)o.push(S.TX((xf+xt)/2,yt-6,lab,"middle",9.5,c,true,true));
      return o.join("");},
    /* 上から加え合わせ点（中心 x）に入る矢印（外乱・観測ノイズなど）。hl なら太く */
    TOPIN:function(x,yc,h,lab,c,hl){c=c||"purple";var R=15;return S.ARR(x,yc-h,x,yc-R,c,hl?2.4:1.6)+(lab?S.TX(x+8,yc-h+10,lab,"start",10,c,true,true):"");}
  };
  function r2(v){return Math.round(v*100)/100;}
  /* 読み出し（HTML）の文字で、K_P・K_{P}・ω_n を <sub>、x^2・e^{−Ls} を <sup> にする（S.TX と同じ書き方） */
  function htx(s){return String(s).replace(/([A-Za-zΑ-Ωα-ω])_\{([^}]*)\}/g,"$1<sub>$2</sub>").replace(/([A-Za-zΑ-Ωα-ω])_([A-Za-z0-9]+)/g,"$1<sub>$2</sub>")
    .replace(/\^\{([^}]*)\}/g,"<sup>$1</sup>").replace(/\^([A-Za-z0-9]+)/g,"<sup>$1</sup>");}

  /* ---- グラフの座標系（figures.py の Plot と同じ） ----
     var p=plot(x,y,w,h,[x0,x1],[y0,y1],{xlog:false,ylog:false}); p.X(v), p.Y(v), p.axes({xl,yl,xt,yt,xfmt,yfmt})、逆向きは p.ux(px), p.uy(py) */
  function nice(lo,hi,n){n=n||5;var span=hi-lo;if(span<=0)return [lo];var raw=span/n,p=Math.pow(10,Math.floor(Math.log10(raw)));
    var st=[1,2,2.5,5,10].map(function(s){return s*p;}).reduce(function(a,b){return Math.abs(b-raw)<Math.abs(a-raw)?b:a;});
    var out=[];for(var v=Math.ceil(lo/st-1e-9)*st;v<=hi+1e-9*Math.abs(st);v+=st)out.push(+v.toPrecision(12));return out;}
  function plot(x,y,w,h,xr,yr,o){o=o||{};
    function t(v,r,lg){return lg?(Math.log10(v)-Math.log10(r[0]))/(Math.log10(r[1])-Math.log10(r[0])):(v-r[0])/(r[1]-r[0]);}
    function lt(r){var out=[];for(var k=Math.floor(Math.log10(r[0])+1e-9);k<=Math.ceil(Math.log10(r[1])-1e-9);k++){var v=Math.pow(10,k);if(v>=r[0]*(1-1e-9)&&v<=r[1]*(1+1e-9))out.push(v);}return out;}
    var P={x:x,y:y,w:w,h:h,xr:xr,yr:yr,
      X:function(v){return x+t(v,xr,o.xlog)*w;},
      ux:function(px){var q=(px-x)/w;return o.xlog?Math.pow(10,Math.log10(xr[0])+q*(Math.log10(xr[1])-Math.log10(xr[0]))):xr[0]+q*(xr[1]-xr[0]);},   /* 画面の座標 → 値（ドラッグ用） */
      uy:function(py){var q=(y+h-py)/h;return o.ylog?Math.pow(10,Math.log10(yr[0])+q*(Math.log10(yr[1])-Math.log10(yr[0]))):yr[0]+q*(yr[1]-yr[0]);},
      Y:function(v){return y+h-t(v,yr,o.ylog)*h;},
      axes:function(a){a=a||{};var s=[],sz=a.sz||9.5,xt=a.xt||(o.xlog?lt(xr):nice(xr[0],xr[1],a.nx||6)),yt=a.yt||(o.ylog?lt(yr):nice(yr[0],yr[1],a.ny||5));
        xt.forEach(function(v){var xx=P.X(v);if(a.grid!==false)s.push(S.L(xx,y,xx,y+h,"grid",1));s.push(S.L(xx,y+h,xx,y+h+4,"muted",1));s.push(S.T(xx,y+h+15,(a.xfmt||sig)(v),"middle",sz,"muted"));});
        yt.forEach(function(v){var yy=P.Y(v);if(a.grid!==false)s.push(S.L(x,yy,x+w,yy,"grid",1));s.push(S.L(x-4,yy,x,yy,"muted",1));s.push(S.T(x-7,yy+sz*0.35,(a.yfmt||sig)(v),"end",sz,"muted"));});
        s.push(S.W([x,y,x,y+h,x+w,y+h],"muted",1.2));
        if(a.xl)s.push(S.TX(x+w/2,y+h+31,a.xl,"middle",sz+0.5,"muted"));
        if(a.yl)s.push(S.TX(x-(a.ylOff||40),y+h/2,a.yl,"middle",sz+0.5,"muted",false,false,-90));
        return s.join("");},
      line:function(pts,c,lw,dash){return S.PL(pts.map(function(p){return [P.X(p[0]),P.Y(p[1])];}),c||"signal",lw||2,null,dash);},
      /* 枠の外に出る部分を切った折れ線（発散する応答などに）。枠の境目で線を止める */
      clip:function(pts,c,lw,dash){var X0=Math.min(xr[0],xr[1]),X1=Math.max(xr[0],xr[1]),Y0=Math.min(yr[0],yr[1]),Y1=Math.max(yr[0],yr[1]),runs=[],cur=[];
        for(var i=1;i<pts.length;i++){var ax=pts[i-1][0],ay=pts[i-1][1],dx=pts[i][0]-ax,dy=pts[i][1]-ay,t0=0,t1=1,ok=true;
          [[-dx,ax-X0],[dx,X1-ax],[-dy,ay-Y0],[dy,Y1-ay]].forEach(function(pq){if(!ok)return;if(pq[0]===0){if(pq[1]<0)ok=false;}else{var r=pq[1]/pq[0];if(pq[0]<0)t0=Math.max(t0,r);else t1=Math.min(t1,r);}});
          if(!ok||t0>t1||!isFinite(ay)||!isFinite(dy)){if(cur.length)runs.push(cur);cur=[];continue;}
          var pa=[ax+t0*dx,ay+t0*dy],pb=[ax+t1*dx,ay+t1*dy];
          if(cur.length&&(Math.abs(cur[cur.length-1][0]-pa[0])>1e-12*(1+Math.abs(pa[0]))||Math.abs(cur[cur.length-1][1]-pa[1])>1e-12*(1+Math.abs(pa[1])))){runs.push(cur);cur=[];}
          if(!cur.length)cur=[pa];cur.push(pb);if(t1<1){runs.push(cur);cur=[];}}
        if(cur.length)runs.push(cur);
        return runs.filter(function(r){return r.length>=2;}).map(function(r){return P.line(r,c,lw,dash);}).join("");},
      steps:function(pts,c,lw){var q=[];pts.forEach(function(p,i){q.push([P.X(p[0]),P.Y(p[1])]);if(i+1<pts.length)q.push([P.X(pts[i+1][0]),P.Y(p[1])]);});return S.PL(q,c||"signal",lw||2);}
    };
    return P;
  }

  /* ---- シーケンス図（figures.py の seq と同じ書き方） ----
     lanes: [[名前, 色], ...]  msgs: [frm, to, ラベル, {c, dash, lost, at, sub, dy, slant, b, mono}] / ["note", lane, 文字, {c}] / ["gap", 文字, {lane}] / ["span", lane, 行数, 文字, {c, side}] / ["space", 高さ]
     返り値 {svg: 中身, h: 高さ}。全体は S.svg(w, h, svg) で包む。 */
  function seq(lanes,msgs,o){o=o||{};var x=o.x||10,y=o.y||10,w=o.w||620,hh=o.headH||30,dy=o.dy||34,lsz=o.labelSz||10.5;
    var n=lanes.length,lw=w/n,xs=lanes.map(function(_,i){return x+lw*(i+0.5);}),out=[],body=[],rows=[],yy=y+hh+16;
    lanes.forEach(function(L,i){var bw=Math.min(lw-10,Math.max(64,tw(L[0],11.5)+18));out.push(S.RECT(xs[i]-bw/2,y,bw,hh,7,soft(L[1]),col(L[1]),1.3));out.push(S.T(xs[i],y+hh/2+4.2,L[0],"middle",11.5,L[1],true));});
    msgs.forEach(function(m){
      if(m[0]==="note"){var op=m[3]||{},c=op.c||"muted",lines=String(m[2]).split("\n"),bw=Math.max.apply(null,lines.map(function(l){return tw(l,10);}))+14,bh=lines.length*13.5+8;
        body.push(S.RECT(xs[m[1]]-bw/2,yy-6,bw,bh,5,"var(--screen)","none",0));body.push(S.RECT(xs[m[1]]-bw/2,yy-6,bw,bh,5,soft(c),col(c),1));lines.forEach(function(l,k){body.push(S.T(xs[m[1]],yy+6+k*13.5,l,"middle",10,c));});rows.push(yy);yy+=bh+10;return;}
      if(m[0]==="gap"){xs.forEach(function(xx){body.push(S.L(xx-6,yy-3,xx+6,yy+3,"faint",1.2));body.push(S.L(xx-6,yy+3,xx+6,yy+9,"faint",1.2));});
        if(m[1]){var gk=(m[2]||{}).lane,gw=tw(String(m[1]),10);if(gk==null&&n>=2&&x+w-2-gw<xs[n-1]+12)gk=n-2;
          if(gk==null)body.push(S.T(x+w-2,yy+7,m[1],"end",10,"faint",false,false,null,true));else body.push(S.T((xs[gk]+xs[gk+1])/2,yy+7,m[1],"middle",10,"faint",false,false,null,true));}
        rows.push(yy);yy+=22;return;}
      if(m[0]==="space"){yy+=m[1];return;}
      if(m[0]==="span"){var op2=m[4]||{},c2=op2.c||"teal",side=op2.side||1,y0=rows[Math.max(0,rows.length-m[2])],y1=rows[rows.length-1],xb=xs[m[1]]+side*10;
        body.push(S.W([xb,y0,xb+side*5,y0,xb+side*5,y1,xb,y1],c2,1.3));String(m[3]).split("\n").forEach(function(l,q,arr){body.push(S.T(xb+side*9,(y0+y1)/2+4+(q-(arr.length-1)/2)*12.5,l,side>0?"start":"end",9.5,c2));});return;}
      var op3=m[3]||{},c3=op3.c||"ink",h3=op3.dy||dy,sl=op3.slant||0,x1=xs[m[0]],x2=xs[m[1]],y1b=yy+8,y2b=yy+8+sl;
      if(m[0]===m[1]){var sd=(x1+32+tw(String(m[2]),lsz)>x+w-2)?-1:1;body.push(S.PATH("M"+x1+","+y1b+" h"+(26*sd)+" v12 h"+(-20*sd),c3,1.5));body.push(S.head(x1+26*sd,y1b+12,x1+4*sd,y1b+12,c3,6));body.push(S.T(x1+32*sd,y1b+10,m[2],sd>0?"start":"end",lsz,c3,false,false,null,true));rows.push(y1b);yy+=h3+6;return;}
      if(op3.lost){var at=op3.at||0.62,fx=x1+(x2-x1)*at,fy=y1b+(y2b-y1b)*at;body.push(S.L(x1,y1b,fx,fy,"alias",1.6,"5 3"));body.push(S.X(fx,fy,5,"alias",2));c3="alias";}
      else body.push(S.ARR(x1,y1b,x2,y2b,c3,1.6,7,op3.dash?"5 3":null));
      var lw3=tw(String(m[2]),lsz,op3.mono)+6;body.push(S.RECT((x1+x2)/2-lw3/2,Math.min(y1b,y2b)-5-lsz*0.85,lw3,lsz*1.1,2,"var(--screen)","none",0));body.push(S.T((x1+x2)/2,Math.min(y1b,y2b)-5,m[2],"middle",lsz,c3,op3.b,op3.mono,null,true));
      if(op3.sub){var sw3=tw(String(op3.sub),lsz-1,op3.mono)+6;body.push(S.RECT((x1+x2)/2-sw3/2,Math.max(y1b,y2b)+13-(lsz-1)*0.85,sw3,(lsz-1)*1.1,2,"var(--screen)","none",0));body.push(S.T((x1+x2)/2,Math.max(y1b,y2b)+13,op3.sub,"middle",lsz-1,"muted",false,op3.mono,null,true));}
      rows.push(Math.max(y1b,y2b));yy+=h3+sl+(op3.sub?10:0);
    });
    var yend=yy+(o.tail||18)-10;
    lanes.forEach(function(L,i){out.push(S.L(xs[i],y+hh,xs[i],yend,L[1],1.2,"3 4"));});
    return {svg:out.concat(body).join(""),h:yend-y+6,xs:xs};
  }

  /* ---- バイト列の表示 ---- */
  /* bytes: 数値の配列, colorOf(i) → 色名 または null。title(i) → ツールチップ */
  function hexView(bytes,colorOf,title){return '<div class="hex">'+bytes.map(function(b,i){var c=colorOf?colorOf(i):null;
    return '<span'+(c?' style="background:'+soft(c)+';border-color:'+col(c)+';color:var(--ink)"':'')+(title?' title="'+esc(title(i))+'"':'')+'>'+fmt.hex(b)+'</span>';}).join("")+'</div>';}
  /* 横に並ぶ欄の図: fields=[[名前, バイト数, 色, 値の文字列?]], unit=1 バイトの幅。返り値 {svg, w, h} */
  function fieldsSvg(fields,o){o=o||{};var unit=o.unit||22,h=o.h||34,sz=o.sz||10,x=o.x||4,y=o.y||4,maxw=o.maxw||1e9,xx=x,yy=y,rowH=h+26,body=[],wmax=0;
    fields.forEach(function(f){var wd=f[1]*unit;if(xx+wd>x+maxw+0.5&&xx>x){xx=x;yy+=rowH;}
      body.push(S.RECT(xx,yy,wd,h,4,soft(f[2]),col(f[2]),1.3));
      if(f[3]!=null){body.push(S.T(xx+wd/2,yy+h/2-2,f[0],"middle",sz,f[2],true));body.push(S.T(xx+wd/2,yy+h/2+sz+1,f[3],"middle",sz-0.5,"ink",false,true));}
      else body.push(S.T(xx+wd/2,yy+h/2+sz*0.38,f[0],"middle",sz,f[2],true));
      if(o.sizeLabel!==false)body.push(S.T(xx+wd/2,yy+h+13,typeof o.sizeLabel==="function"?o.sizeLabel(f):f[1]+" B","middle",9,"muted"));xx+=wd;wmax=Math.max(wmax,xx);});
    return {svg:body.join(""),w:wmax+x,h:yy-y+rowH+y};}

  /* ---- 乱数（同じ種なら同じ列。シミュレーションを再現できるようにする） ---- */
  function rng(seed){var a=(seed>>>0)||1;function nx(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
    return {next:nx,int:function(n){return Math.floor(nx()*n);},range:function(a,b){return a+(b-a)*nx();},chance:function(p){return nx()<p;},
      normal:function(){var u=1-nx(),v=nx();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);},
      exp:function(mean){return -Math.log(1-nx())*mean;},pick:function(arr){return arr[Math.floor(nx()*arr.length)];}};}

  /* ---- 一定間隔の繰り返し（アニメーション）。画面外や停止中は動かさない ---- */
  function ticker(fn,ms){var id=null;return {start:function(){if(id==null)id=setInterval(fn,ms||100);},stop:function(){if(id!=null){clearInterval(id);id=null;}},running:function(){return id!=null;}};}

  /* ===== 制御の計算部品（U.ctl） =====
     複素数は {re,im}。多項式は降べきの係数の配列（[1,3,2] は s²+3s+2）。
     伝達関数は {num,den,delay}（delay はむだ時間 [s]、無ければ 0）。tf(num,den,delay) で作る。
     行列は行の配列（[[a,b],[c,d]]）。列ベクトルは n×1 の行列（[[x1],[x2]]）で表す。 */
  var ctl=(function(){
    /* ---- 複素数 ---- */
    function c(re,im){return {re:re,im:im||0};}
    var cx={c:c,
      add:function(a,b){return c(a.re+b.re,a.im+b.im);},
      sub:function(a,b){return c(a.re-b.re,a.im-b.im);},
      mul:function(a,b){return c(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);},
      div:function(a,b){var d=b.re*b.re+b.im*b.im;return c((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);},
      scale:function(a,k){return c(a.re*k,a.im*k);},
      neg:function(a){return c(-a.re,-a.im);},
      conj:function(a){return c(a.re,-a.im);},
      abs:function(a){return Math.hypot(a.re,a.im);},
      arg:function(a){return Math.atan2(a.im,a.re);},
      exp:function(a){var e=Math.exp(a.re);return c(e*Math.cos(a.im),e*Math.sin(a.im));},
      polar:function(r,th){return c(r*Math.cos(th),r*Math.sin(th));},
      sqrt:function(a){var r=Math.sqrt(cx.abs(a)),th=cx.arg(a)/2;return c(r*Math.cos(th),r*Math.sin(th));},
      inv:function(a){return cx.div(c(1,0),a);}
    };
    /* ---- 多項式（降べき） ---- */
    function trim(p){var i=0;while(i<p.length-1&&p[i]===0)i++;return p.slice(i);}
    var poly={
      trim:trim,
      val:function(p,x){var v=0;for(var i=0;i<p.length;i++)v=v*x+p[i];return v;},
      valc:function(p,z){var re=0,im=0;for(var i=0;i<p.length;i++){var t=re*z.re-im*z.im+p[i];im=re*z.im+im*z.re;re=t;}return c(re,im);},
      add:function(a,b){var n=Math.max(a.length,b.length),o=[];for(var i=0;i<n;i++){var ia=i-(n-a.length),ib=i-(n-b.length);o.push((ia>=0?a[ia]:0)+(ib>=0?b[ib]:0));}return trim(o);},
      sub:function(a,b){return poly.add(a,b.map(function(x){return -x;}));},
      mul:function(a,b){var o=[];for(var i=0;i<a.length+b.length-1;i++)o.push(0);for(var i2=0;i2<a.length;i2++)for(var j=0;j<b.length;j++)o[i2+j]+=a[i2]*b[j];return o;},
      scale:function(a,k){return a.map(function(x){return x*k;});},
      deriv:function(a){var n=a.length-1,o=[];for(var i=0;i<n;i++)o.push(a[i]*(n-i));return o.length?o:[0];},
      /* 根（複素数の配列）。アバース法で全部を同時に求め、ニュートン法で磨く。共役の組は re が同じになるようにそろえる */
      roots:function(p){p=trim(p.slice());var out=[];
        while(p.length>1&&p[p.length-1]===0){out.push(c(0,0));p.pop();}
        var n=p.length-1;if(n<1)return out;
        var a0=p[0];p=p.map(function(x){return x/a0;});
        if(n===1){out.push(c(-p[1],0));return out;}
        if(n===2){var b=p[1],cc=p[2],d=b*b-4*cc;
          if(d>=0){var q=-0.5*(b+(b>=0?1:-1)*Math.sqrt(d));out.push(c(q,0));out.push(c(q!==0?cc/q:0,0));}
          else{out.push(c(-b/2,Math.sqrt(-d)/2));out.push(c(-b/2,-Math.sqrt(-d)/2));}
          return out;}
        var R=0;for(var i=1;i<=n;i++)R=Math.max(R,Math.pow(Math.abs(p[i]),1/i));R=Math.max(R,1e-6);
        var z=[];for(var k=0;k<n;k++)z.push(cx.polar(R*(0.5+0.5*((k*0.37)%1)),2*Math.PI*k/n+0.4));
        var dp=poly.deriv(p);
        for(var it=0;it<500;it++){var mx=0;
          for(var k2=0;k2<n;k2++){var pv=poly.valc(p,z[k2]),dv=poly.valc(dp,z[k2]);
            if(cx.abs(pv)===0)continue;var ratio=cx.div(pv,dv),s=c(0,0);
            for(var j=0;j<n;j++)if(j!==k2){var df=cx.sub(z[k2],z[j]);if(cx.abs(df)>0)s=cx.add(s,cx.inv(df));}
            var w=cx.div(ratio,cx.sub(c(1,0),cx.mul(ratio,s)));
            if(!isFinite(w.re)||!isFinite(w.im))w=ratio;
            z[k2]=cx.sub(z[k2],w);mx=Math.max(mx,cx.abs(w)/(1+cx.abs(z[k2])));}
          if(mx<1e-15)break;}
        for(var k3=0;k3<n;k3++){for(var t=0;t<3;t++){var pv2=poly.valc(p,z[k3]),dv2=poly.valc(dp,z[k3]);if(cx.abs(dv2)>0){var nz=cx.sub(z[k3],cx.div(pv2,dv2));if(isFinite(nz.re)&&isFinite(nz.im)&&cx.abs(poly.valc(p,nz))<=cx.abs(pv2))z[k3]=nz;}}}
        z.forEach(function(r){var tol=1e-7*(1+Math.abs(r.re));if(Math.abs(r.im)<tol)r.im=0;out.push(r);});
        /* 共役の組をそろえる */
        out.forEach(function(r){if(r.im>0){var best=null,bd=1e9;out.forEach(function(q){if(q.im<0){var d2=Math.abs(q.re-r.re)+Math.abs(q.im+r.im);if(d2<bd){bd=d2;best=q;}}});
          if(best&&bd<1e-6*(1+cx.abs(r))){var mre=(r.re+best.re)/2,mim=(r.im-best.im)/2;r.re=mre;r.im=mim;best.re=mre;best.im=-mim;}}});
        out.sort(function(a,b){return a.re-b.re||b.im-a.im;});
        return out;},
      /* 根から実係数の多項式（最高次の係数 1）。複素の根は共役の組で与える */
      fromRoots:function(rs){var re=[1],im=[0];
        rs.forEach(function(r){var nre=[],nim=[];for(var i=0;i<=re.length;i++){nre.push(0);nim.push(0);}
          for(var i2=0;i2<re.length;i2++){nre[i2]+=re[i2];nim[i2]+=im[i2];nre[i2+1]-=re[i2]*r.re-im[i2]*r.im;nim[i2+1]-=re[i2]*r.im+im[i2]*r.re;}
          re=nre;im=nim;});
        return re;}
    };
    /* ---- 伝達関数 ---- */
    function tf(num,den,delay){var d=trim(den.slice()),n=trim(num.slice());return {num:n,den:d,delay:delay||0};}
    function freq(G,w){var s=c(0,w),v=cx.div(poly.valc(G.num,s),poly.valc(G.den,s));
      if(G.delay)v=cx.mul(v,cx.polar(1,-w*G.delay));return v;}
    function bode(G,ws){var mag=[],db=[],ph=[],prev=null;
      ws.forEach(function(w){var v=freq(G,w),m=cx.abs(v),p=cx.arg(v)*180/Math.PI;
        if(prev!==null){while(p-prev>180)p-=360;while(p-prev<-180)p+=360;}prev=p;
        mag.push(m);db.push(20*Math.log10(Math.max(m,1e-300)));ph.push(p);});
      /* 位相の始まりを、因数ごとの位相の和（零点の (jω−z) の偏角の和 − 極の (jω−p) の偏角の和）にそろえる。
         こうすると積分 1 つなら −90° から、右半平面の極があればその分だけずれた所から描かれる */
      if(ws.length){var w0=ws[0],ref=0;
        zeros(G).forEach(function(z){ref+=Math.atan2(w0-z.im,-z.re);});poles(G).forEach(function(p){ref-=Math.atan2(w0-p.im,-p.re);});
        ref=ref*180/Math.PI-(G.delay||0)*w0*180/Math.PI;if(G.num[0]/G.den[0]<0)ref+=180;
        var sh=Math.round((ref-ph[0])/360)*360;if(sh)ph=ph.map(function(p){return p+sh;});}
      return {w:ws,mag:mag,db:db,ph:ph};}
    function series(a,b){return tf(poly.mul(a.num,b.num),poly.mul(a.den,b.den),(a.delay||0)+(b.delay||0));}
    function parallel(a,b){if((a.delay||0)!==(b.delay||0))throw new Error("parallel: むだ時間の違う伝達関数は足せない");
      return tf(poly.add(poly.mul(a.num,b.den),poly.mul(b.num,a.den)),poly.mul(a.den,b.den),a.delay||0);}
    /* G を H で負帰還（sign=+1 なら正帰還）: G/(1 ± G H)。むだ時間を含むときは有理式にならないので使えない */
    function feedback(G,H,sign){H=H||tf([1],[1]);if(G.delay||H.delay)throw new Error("feedback: むだ時間を含む閉ループは時間領域の計算（lsim など）で求める");
      var s=sign===1?-1:1;
      return tf(poly.mul(G.num,H.den),poly.add(poly.mul(G.den,H.den),poly.scale(poly.mul(G.num,H.num),s)));}
    /* フィードバック系（制御器 C、制御対象 P、負帰還、センサの伝達関数 1）の伝達関数をまとめて返す（07 章の記号）。
       L = P C（一巡伝達関数）、Gyr = PC/(1+PC)、Gyd = P/(1+PC)（操作量に入る外乱から制御量）、S = 1/(1+PC)（感度関数）、
       Gur = C/(1+PC)（目標値から操作量）。分母はどれも約分しない a_P a_C + b_P b_C。むだ時間を含むときは有理式にならないので使えない
       （周波数応答なら freq(L, ω) から 1/(1 + L) を計算する） */
    function loop(P,C){if(P.delay||C.delay)throw new Error("loop: むだ時間を含む閉ループは有理式にならない（freq で 1/(1+L) を計算する）");
      var den=poly.add(poly.mul(P.den,C.den),poly.mul(P.num,C.num));
      return {L:series(P,C),Gyr:tf(poly.mul(P.num,C.num),den),Gyd:tf(poly.mul(P.num,C.den),den),S:tf(poly.mul(P.den,C.den),den),Gur:tf(poly.mul(C.num,P.den),den)};}
    function poles(G){return poly.roots(G.den);}
    function zeros(G){return G.num.length>1?poly.roots(G.num):[];}
    function dcgain(G){return poly.val(G.num,0)/poly.val(G.den,0);}
    /* 可制御正準形の状態空間（むだ時間は含まない）。分子の次数は分母以下 */
    function ss(G){var den=trim(G.den.slice()),n=den.length-1,a0=den[0];den=den.map(function(x){return x/a0;});
      var num=trim(G.num.slice()).map(function(x){return x/a0;});
      if(num.length>den.length)throw new Error("ss: 分子の次数が分母より高い");
      while(num.length<den.length)num.unshift(0);
      var D=num[0],r=[];for(var i=1;i<=n;i++)r.push(num[i]-D*den[i]);
      var A=[],B=[],C=[[]];for(var i2=0;i2<n;i2++){var row=[];for(var j=0;j<n;j++)row.push(0);A.push(row);B.push([0]);}
      for(var k=0;k<n-1;k++)A[k][k+1]=1;
      for(var j2=0;j2<n;j2++)A[n-1][j2]=-den[n-j2];
      if(n>0)B[n-1][0]=1;
      for(var j3=0;j3<n;j3++)C[0].push(r[n-1-j3]);
      return {A:A,B:B,C:C,D:[[D]]};}
    /* 入力 u(t)（関数、または刻みごとの値の配列）への応答。零次ホールドで厳密に離散化して計算する。
       返り値 {t:[…], y:[…], x:[…]}。むだ時間は出力を遅らせて扱う */
    function lsim(G,u,tEnd,n,x0){n=n||400;var h=tEnd/n,S=ss(G),N=S.A.length,t=[],y=[],xs=[];
      var uf=typeof u==="function"?u:function(tt,k){return u[Math.min(k,u.length-1)];};
      var dl=G.delay||0,ud=function(tt,k){return tt<dl-1e-12?0:uf(tt-dl,Math.round((tt-dl)/h));};
      if(N===0){for(var k=0;k<=n;k++){t.push(k*h);y.push(S.D[0][0]*ud(k*h,k));}return {t:t,y:y,x:[]};}
      var dd=mat.c2d(S.A,S.B,h),Ad=dd.A,Bd=dd.B,x=x0?mat.clone(x0):mat.zeros(N,1);
      for(var k2=0;k2<=n;k2++){var tt=k2*h,uu=ud(tt,k2);t.push(tt);
        var yy=S.D[0][0]*uu;for(var i=0;i<N;i++)yy+=S.C[0][i]*x[i][0];y.push(yy);xs.push(x.map(function(r){return r[0];}));
        var nx=mat.add(mat.mul(Ad,x),mat.scale(Bd,uu));x=nx;}
      return {t:t,y:y,x:xs};}
    function step(G,tEnd,n){return lsim(G,function(){return 1;},tEnd,n);}
    /* インパルス応答（D の項のインパルスは除く）: y(t) = C e^{At} B */
    function impulse(G,tEnd,n){n=n||400;var h=tEnd/n,S=ss(G),N=S.A.length,t=[],vals=[],y=[];
      var Ad=mat.expm(mat.scale(S.A,h)),x=mat.clone(S.B),sh=Math.round((G.delay||0)/h);
      for(var k=0;k<=n;k++){var v=0;for(var i=0;i<N;i++)v+=S.C[0][i]*x[i][0];vals.push(v);x=mat.mul(Ad,x);}
      for(var k2=0;k2<=n;k2++){t.push(k2*h);y.push(k2-sh>=0?vals[k2-sh]:0);}
      return {t:t,y:y};}
    function linspace(a,b,n){var o=[];for(var i=0;i<n;i++)o.push(a+(b-a)*i/(n-1));return o;}
    function logspace(a,b,n){return linspace(a,b,n).map(function(e){return Math.pow(10,e);});}
    /* 安定余裕。L は一巡伝達関数。返り値 {gm (倍), gmDb, wpc, pm (度), wgc}。見つからないものは null */
    function margins(L,wlo,whi){wlo=wlo||1e-4;whi=whi||1e5;var ws=logspace(Math.log10(wlo),Math.log10(whi),3000),B=bode(L,ws),r={gm:null,gmDb:null,wpc:null,pm:null,wgc:null};
      function refine(f,a,b){var fa=f(a);for(var i=0;i<60;i++){var m=Math.sqrt(a*b),fm=f(m);if((fa<0)===(fm<0)){a=m;fa=fm;}else b=m;}return Math.sqrt(a*b);}
      function phNear(x,near){var p=cx.arg(freq(L,x))*180/Math.PI;while(p-near>180)p-=360;while(p-near<-180)p+=360;return p;}
      for(var i=1;i<ws.length;i++){
        if(r.wgc===null&&(B.mag[i-1]-1)*(B.mag[i]-1)<=0&&B.mag[i-1]!==B.mag[i]){var w=refine(function(x){return cx.abs(freq(L,x))-1;},ws[i-1],ws[i]);r.wgc=w;
          r.pm=180+phNear(w,B.ph[i-1]);while(r.pm>180)r.pm-=360;while(r.pm<=-180)r.pm+=360;}
        var k0=Math.floor((B.ph[i-1]+180)/360),k1=Math.floor((B.ph[i]+180)/360);
        if(r.wpc===null&&k0!==k1){var lev=-180+360*Math.max(k0,k1),a0=B.ph[i-1];
          var w2=refine(function(x){return phNear(x,a0)-lev;},ws[i-1],ws[i]);
          var m2=cx.abs(freq(L,w2));r.wpc=w2;r.gm=1/m2;r.gmDb=-20*Math.log10(m2);}
      }
      return r;}
    /* ---- 行列 ---- */
    var mat={
      zeros:function(n,m){var o=[];for(var i=0;i<n;i++){var r=[];for(var j=0;j<m;j++)r.push(0);o.push(r);}return o;},
      eye:function(n){var o=mat.zeros(n,n);for(var i=0;i<n;i++)o[i][i]=1;return o;},
      clone:function(A){return A.map(function(r){return r.slice();});},
      col:function(v){return v.map(function(x){return [x];});},
      T:function(A){var o=[];for(var j=0;j<A[0].length;j++){var r=[];for(var i=0;i<A.length;i++)r.push(A[i][j]);o.push(r);}return o;},
      add:function(A,B){return A.map(function(r,i){return r.map(function(x,j){return x+B[i][j];});});},
      sub:function(A,B){return A.map(function(r,i){return r.map(function(x,j){return x-B[i][j];});});},
      scale:function(A,k){return A.map(function(r){return r.map(function(x){return x*k;});});},
      mul:function(A,B){var n=A.length,m=B[0].length,p=B.length,o=mat.zeros(n,m);
        for(var i=0;i<n;i++)for(var k=0;k<p;k++){var a=A[i][k];if(a!==0)for(var j=0;j<m;j++)o[i][j]+=a*B[k][j];}return o;},
      /* A X = B を解く（部分ピボットのガウスの消去法）。B は行列 */
      solve:function(A,B){var n=A.length,m=B[0].length,M=A.map(function(r,i){return r.concat(B[i]);});
        for(var k=0;k<n;k++){var p=k,mx=Math.abs(M[k][k]);for(var i=k+1;i<n;i++)if(Math.abs(M[i][k])>mx){mx=Math.abs(M[i][k]);p=i;}
          if(mx===0)throw new Error("solve: 特異な行列");var tmp=M[k];M[k]=M[p];M[p]=tmp;
          for(var i2=k+1;i2<n;i2++){var f=M[i2][k]/M[k][k];if(f!==0)for(var j=k;j<n+m;j++)M[i2][j]-=f*M[k][j];}}
        var X=mat.zeros(n,m);
        for(var c2=0;c2<m;c2++)for(var i3=n-1;i3>=0;i3--){var s=M[i3][n+c2];for(var j2=i3+1;j2<n;j2++)s-=M[i3][j2]*X[j2][c2];X[i3][c2]=s/M[i3][i3];}
        return X;},
      inv:function(A){return mat.solve(A,mat.eye(A.length));},
      det:function(A){var n=A.length,M=mat.clone(A),d=1;
        for(var k=0;k<n;k++){var p=k,mx=Math.abs(M[k][k]);for(var i=k+1;i<n;i++)if(Math.abs(M[i][k])>mx){mx=Math.abs(M[i][k]);p=i;}
          if(mx===0)return 0;if(p!==k){var t=M[k];M[k]=M[p];M[p]=t;d=-d;}d*=M[k][k];
          for(var i2=k+1;i2<n;i2++){var f=M[i2][k]/M[k][k];for(var j=k;j<n;j++)M[i2][j]-=f*M[k][j];}}
        return d;},
      rank:function(A,tol){var M=mat.clone(A),n=M.length,m=M[0].length,r=0,sc=0;
        A.forEach(function(row){row.forEach(function(x){sc=Math.max(sc,Math.abs(x));});});tol=tol||1e-9*Math.max(sc,1e-300)*Math.max(n,m);
        for(var j=0;j<m&&r<n;j++){var p=r,mx=Math.abs(M[r][j]);for(var i=r+1;i<n;i++)if(Math.abs(M[i][j])>mx){mx=Math.abs(M[i][j]);p=i;}
          if(mx<=tol)continue;var t=M[r];M[r]=M[p];M[p]=t;
          for(var i2=r+1;i2<n;i2++){var f=M[i2][j]/M[r][j];for(var k=j;k<m;k++)M[i2][k]-=f*M[r][k];}r++;}
        return r;},
      /* 特性多項式 det(sI − A) の係数（ファデーエフ・ルベリエの方法）。[1, c1, …, cn] */
      charpoly:function(A){var n=A.length,M=mat.zeros(n,n),co=[1],I=mat.eye(n);
        for(var k=1;k<=n;k++){M=mat.add(mat.mul(A,M),mat.scale(I,co[k-1]));var AM=mat.mul(A,M),tr=0;for(var i=0;i<n;i++)tr+=AM[i][i];co.push(-tr/k);}
        return co;},
      eig:function(A){return poly.roots(mat.charpoly(A));},
      /* 行列指数関数 e^A（スケーリングと 2 乗、パデ近似 6 次） */
      expm:function(A){var n=A.length,nm=0;A.forEach(function(r){var s=0;r.forEach(function(x){s+=Math.abs(x);});nm=Math.max(nm,s);});
        var sq=Math.max(0,Math.ceil(Math.log2(nm||1))+1),As=mat.scale(A,Math.pow(2,-sq)),q=6,cc=1,X=mat.eye(n),N=mat.eye(n),D=mat.eye(n);
        for(var k=1;k<=q;k++){cc=cc*(q-k+1)/(k*(2*q-k+1));X=mat.mul(As,X);N=mat.add(N,mat.scale(X,cc));D=mat.add(D,mat.scale(X,(k%2?-1:1)*cc));}
        var E=mat.solve(D,N);for(var i=0;i<sq;i++)E=mat.mul(E,E);return E;},
      /* 零次ホールドの離散化: x[k+1] = Ad x[k] + Bd u[k] */
      c2d:function(A,B,h){var n=A.length,m=B[0].length,M=mat.zeros(n+m,n+m);
        for(var i=0;i<n;i++){for(var j=0;j<n;j++)M[i][j]=A[i][j]*h;for(var j2=0;j2<m;j2++)M[i][n+j2]=B[i][j2]*h;}
        var E=mat.expm(M),Ad=[],Bd=[];for(var i2=0;i2<n;i2++){Ad.push(E[i2].slice(0,n));Bd.push(E[i2].slice(n,n+m));}return {A:Ad,B:Bd};},
      ctrb:function(A,B){var n=A.length,blocks=[B],P=B;for(var k=1;k<n;k++){P=mat.mul(A,P);blocks.push(P);}
        return A.map(function(_,i){var r=[];blocks.forEach(function(b){r=r.concat(b[i]);});return r;});},
      obsv:function(A,C){return mat.T(mat.ctrb(mat.T(A),mat.T(C)));},
      /* 入力 1 つの極配置（アッカーマンの式）。poles は複素数の配列（共役の組で）。返り値 F（1×n、u = −F x） */
      acker:function(A,B,poles){var n=A.length,ph=poly.fromRoots(poles),P=mat.zeros(n,n),Ak=mat.eye(n);
        for(var k=n;k>=0;k--){P=mat.add(P,mat.scale(Ak,ph[k]));Ak=mat.mul(A,Ak);}
        var Wc=mat.ctrb(A,B),e=[[]];for(var i=0;i<n;i++)e[0].push(i===n-1?1:0);
        return mat.mul(mat.mul(e,mat.inv(Wc)),P);},
      /* 連続時間のリッカチ方程式 AᵀX + XA − XBR⁻¹BᵀX + Q = 0 の安定化解（ハミルトン行列の符号関数の方法） */
      care:function(A,B,Q,R){var n=A.length,Ri=mat.inv(R),G=mat.mul(mat.mul(B,Ri),mat.T(B)),H=mat.zeros(2*n,2*n);
        for(var i=0;i<n;i++)for(var j=0;j<n;j++){H[i][j]=A[i][j];H[i][n+j]=-G[i][j];H[n+i][j]=-Q[i][j];H[n+i][n+j]=-A[j][i];}
        var Z=H;for(var it=0;it<100;it++){var Zi=mat.inv(Z),dt=Math.abs(mat.det(Z)),g=dt>0?Math.pow(dt,-1/(2*n)):1;
          var Zn=mat.scale(mat.add(mat.scale(Z,g),mat.scale(Zi,1/g)),0.5),df=0,nz=0;
          for(var a=0;a<2*n;a++)for(var b=0;b<2*n;b++){df=Math.max(df,Math.abs(Zn[a][b]-Z[a][b]));nz=Math.max(nz,Math.abs(Zn[a][b]));}
          Z=Zn;if(df<1e-13*nz)break;}
        /* [W12; W22+I] X = −[W11+I; W21] を最小二乗で解く */
        var M1=mat.zeros(2*n,n),M2=mat.zeros(2*n,n);
        for(var i2=0;i2<n;i2++)for(var j2=0;j2<n;j2++){M1[i2][j2]=Z[i2][n+j2];M1[n+i2][j2]=Z[n+i2][n+j2]+(i2===j2?1:0);M2[i2][j2]=-(Z[i2][j2]+(i2===j2?1:0));M2[n+i2][j2]=-Z[n+i2][j2];}
        var Mt=mat.T(M1),X=mat.solve(mat.mul(Mt,M1),mat.mul(Mt,M2));
        return mat.scale(mat.add(X,mat.T(X)),0.5);},
      /* 最適レギュレータのゲイン F = R⁻¹BᵀX（u = −F x）と X を返す */
      lqr:function(A,B,Q,R){var X=mat.care(A,B,Q,R);return {F:mat.mul(mat.mul(mat.inv(R),mat.T(B)),X),X:X};},
      /* 離散時間のリッカチ方程式の解（反復）。カルマンフィルタの定常ゲインに使う（双対: A→Aᵀ, B→Cᵀ） */
      dare:function(A,B,Q,R){var X=mat.clone(Q),At=mat.T(A),Bt=mat.T(B);
        for(var it=0;it<5000;it++){var BXB=mat.add(R,mat.mul(mat.mul(Bt,X),B)),K=mat.solve(BXB,mat.mul(mat.mul(Bt,X),A));
          var Xn=mat.add(Q,mat.sub(mat.mul(mat.mul(At,X),A),mat.mul(mat.mul(mat.mul(At,X),B),K))),df=0,nz=0;
          for(var i=0;i<X.length;i++)for(var j=0;j<X.length;j++){df=Math.max(df,Math.abs(Xn[i][j]-X[i][j]));nz=Math.max(nz,Math.abs(Xn[i][j]));}
          X=Xn;if(df<1e-12*Math.max(nz,1e-300))break;}
        return X;}
    };
    /* ---- 常微分方程式（ルンゲ・クッタ 4 次）。f(t, x) は x と同じ長さの配列を返す ---- */
    function rk4(f,t,x,h){var k1=f(t,x),x2=x.map(function(v,i){return v+h/2*k1[i];}),k2=f(t+h/2,x2),
      x3=x.map(function(v,i){return v+h/2*k2[i];}),k3=f(t+h/2,x3),x4=x.map(function(v,i){return v+h*k3[i];}),k4=f(t+h,x4);
      return x.map(function(v,i){return v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]);});}
    /* ---- グラフの補助 ---- */
    /* s 平面の地: 右半平面を薄い赤、虚軸を濃く。P は U.plot の座標系 */
    function splane(P,o){o=o||{};var s=[];var x0=Math.max(P.x,Math.min(P.x+P.w,P.X(0)));
      if(o.rhp!==false&&x0<P.x+P.w)s.push(S.RECT(x0,P.y,P.x+P.w-x0,P.h,0,soft("alias"),"none",0));
      if(o.zeta)o.zeta.forEach(function(z){var th=Math.acos(z),R=Math.max(Math.abs(P.xr[0]),Math.abs(P.yr[0]),Math.abs(P.yr[1]))*2;
        s.push(S.L(P.X(0),P.Y(0),P.X(-R*Math.cos(th)),P.Y(R*Math.sin(th)),"faint",1,"4 3"));s.push(S.L(P.X(0),P.Y(0),P.X(-R*Math.cos(th)),P.Y(-R*Math.sin(th)),"faint",1,"4 3"));});
      if(P.yr[0]<0&&P.yr[1]>0)s.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
      if(P.xr[0]<0&&P.xr[1]>0)s.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"muted",1.4));
      return s.join("");}
    /* 極（×）と零点（○）。点が枠の外なら端に小さな三角で示す */
    function pz(P,poles,zs,cl,sz){cl=cl||"signal";sz=sz||5.5;var s=[];
      function inside(p){return p.re>=P.xr[0]&&p.re<=P.xr[1]&&p.im>=P.yr[0]&&p.im<=P.yr[1];}
      function edge(p){var x=Math.max(P.xr[0],Math.min(P.xr[1],p.re)),y=Math.max(P.yr[0],Math.min(P.yr[1],p.im));return S.D(P.X(x),P.Y(y),cl,2.6);}
      (poles||[]).forEach(function(p){s.push(inside(p)?S.X(P.X(p.re),P.Y(p.im),sz,cl,2.2):edge(p));});
      (zs||[]).forEach(function(p){s.push(inside(p)?S.CIRC(P.X(p.re),P.Y(p.im),sz,cl,2,"var(--screen)"):edge(p));});
      return s.join("");}
    /* ボード線図（ゲイン [dB] と位相 [°] の 2 段）。curves: [{w:[…], db:[…], ph:[…], c, dash, lw}]。
       返り値 {svg: 中身（S.svg で包む）, Pm, Pp, h}。o: {x, y, w, hm, hp, wr:[ω0,ω1], dbr, phr, xl} */
    function bodeSvg(curves,o){o=o||{};var x=o.x||64,y=o.y||10,w=o.w||600,hm=o.hm||150,hp=o.hp||120,gap=o.gap||34;
      var wr=o.wr||[curves[0].w[0],curves[0].w[curves[0].w.length-1]],all=[],allp=[];
      curves.forEach(function(cv){cv.db.forEach(function(v,i){if(cv.w[i]>=wr[0]&&cv.w[i]<=wr[1])all.push(v);});cv.ph.forEach(function(v,i){if(cv.w[i]>=wr[0]&&cv.w[i]<=wr[1])allp.push(v);});});
      var dbr=o.dbr||[Math.floor(Math.max(-120,Math.min.apply(null,all))/20)*20,Math.ceil(Math.min(120,Math.max.apply(null,all))/20)*20];if(dbr[0]===dbr[1])dbr[1]+=20;
      var phr=o.phr||[Math.floor(Math.min.apply(null,allp)/45)*45,Math.ceil(Math.max.apply(null,allp)/45)*45];if(phr[0]===phr[1])phr[1]+=45;
      var Pm=plot(x,y,w,hm,wr,dbr,{xlog:true}),Pp=plot(x,y+hm+gap,w,hp,wr,phr,{xlog:true}),s=[];
      var dbt=nice(dbr[0],dbr[1],5),pht=[];for(var v=phr[0];v<=phr[1]+1e-9;v+=(phr[1]-phr[0])>360?90:45)pht.push(v);
      s.push(Pm.axes({yl:"ゲイン [dB]",yt:dbt,xfmt:function(){return "";}}));s.push(Pp.axes({yl:"位相 [°]",yt:pht,xl:o.xl||"角周波数 ω [rad/s]"}));
      if(dbr[0]<0&&dbr[1]>0)s.push(S.L(x,Pm.Y(0),x+w,Pm.Y(0),"muted",1.1));
      if(phr[0]<-180&&phr[1]>-180)s.push(S.L(x,Pp.Y(-180),x+w,Pp.Y(-180),"muted",1.1,"5 3"));
      curves.forEach(function(cv){var a=[],b=[];cv.w.forEach(function(ww,i){if(ww>=wr[0]*(1-1e-9)&&ww<=wr[1]*(1+1e-9)){a.push([ww,Math.max(dbr[0],Math.min(dbr[1],cv.db[i]))]);b.push([ww,Math.max(phr[0],Math.min(phr[1],cv.ph[i]))]);}});
        s.push(Pm.line(a,cv.c||"signal",cv.lw||2,cv.dash));s.push(Pp.line(b,cv.c||"signal",cv.lw||2,cv.dash));});
      return {svg:s.join(""),Pm:Pm,Pp:Pp,h:y+hm+gap+hp+40};}
    /* 図の上でのドラッグ。box は U.svgbox の返り値。cb(type, x, y) の x, y は SVG の座標（viewBox の単位）。
       type は "down"・"move"・"up"。ドラッグ中だけ画面のスクロールを止める */
    function drag(box,cb){var el=box.el,on=false;el.style.touchAction="none";
      function pt(e){var sv=el.querySelector("svg");if(!sv)return null;var m=sv.getScreenCTM();if(!m)return null;var p=sv.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var q=p.matrixTransform(m.inverse());return [q.x,q.y];}
      el.addEventListener("pointerdown",function(e){var q=pt(e);if(!q)return;if(cb("down",q[0],q[1])===false)return;on=true;try{el.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();});
      el.addEventListener("pointermove",function(e){if(!on)return;var q=pt(e);if(q)cb("move",q[0],q[1]);e.preventDefault();});
      function end(e){if(!on)return;on=false;var q=pt(e);cb("up",q?q[0]:null,q?q[1]:null);}
      el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);}
    return {cx:cx,c:c,poly:poly,tf:tf,freq:freq,bode:bode,series:series,parallel:parallel,feedback:feedback,loop:loop,poles:poles,zeros:zeros,dcgain:dcgain,
      ss:ss,lsim:lsim,step:step,impulse:impulse,margins:margins,mat:mat,rk4:rk4,linspace:linspace,logspace:logspace,splane:splane,pz:pz,bodeSvg:bodeSvg,drag:drag};
  })();
  /* ===== END 制御の計算部品 ===== */

  var REG={};
  var U={C:C,col:col,soft:soft,mk:mk,esc:esc,head:head,ctrls:ctrls,btnrow:btnrow,readout:readout,note:note,slider:slider,select:select,checkbox:checkbox,textin:textin,
    htx:htx,button:button,seg:seg,svgbox:svgbox,tbl:tbl,fmt:fmt,sig:sig,tw:tw,S:S,plot:plot,nice:nice,seq:seq,hexView:hexView,fieldsSvg:fieldsSvg,rng:rng,ticker:ticker,ctl:ctl};

  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */
  /* ===== 01 章 制御とは何か ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w01_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w01_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _w01_C=2,_w01_G=9.81,_w01_R=1;
  function _w01_dslope(m,deg){return m*_w01_G*Math.sin(deg*Math.PI/180);}
  /* 添字付きの文字（"K_P" → K の右下に小さな P） */
  function _w01_tx(U,x,y,s,a,sz,c,b,halo){
    sz=sz||10;var segs=[],re=/([A-Za-z])_([A-Za-z0-9∞]+)/g,m,pos=0;
    while((m=re.exec(s))){if(m.index>pos)segs.push([s.slice(pos,m.index),null]);segs.push([m[1],m[2]]);pos=re.lastIndex;}
    if(pos<s.length)segs.push([s.slice(pos),null]);
    var ss=sz*0.72,w=0;segs.forEach(function(g){w+=U.tw(g[0],sz)+(g[1]?U.tw(g[1],ss):0);});
    var x0=x-(a==="middle"?w/2:(a==="end"?w:0));
    var h='<text x="'+x0.toFixed(2)+'" y="'+(+y).toFixed(2)+'" text-anchor="start" font-size="'+sz+'" fill="'+U.col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
      (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>',pend=0;
    segs.forEach(function(g){h+='<tspan'+(pend?' dy="'+pend+'"':'')+'>'+U.esc(g[0])+'</tspan>';pend=0;if(g[1]){h+='<tspan dy="3" font-size="'+ss.toFixed(2)+'">'+U.esc(g[1])+'</tspan>';pend=-3;}});
    return h+'</text>';
  }
  /* 台車の速度の比例制御（本文と同じ計算: 刻み h の間は力を一定として、速度の式を厳密に解く）。
     o = {Kp, L, m, tEnd, h, uff, noise, seed, hold, dFn(t, 位置), rec, stopAt}。返り値 {t, y, ym, u, d, p}（rec ごと） */
  function _w01_sim(U,o){
    var h=o.h||1e-3,n=Math.round(o.tEnd/h),nd=Math.round((o.L||0)/h),kr=Math.max(1,Math.round((o.rec||0.01)/h)),kh=Math.max(1,Math.round((o.hold||0.01)/h));
    var m=o.m||1,a=Math.exp(-_w01_C*h/m),u0=o.uff===false?0:_w01_C*_w01_R,rg=o.noise?U.rng(o.seed||1):null;
    var hist=new Float64Array(n+1),y=0,p=0,nz=0,out={t:[],y:[],ym:[],u:[],d:[],p:[]};
    for(var k=0;k<=n;k++){
      var t=k*h;hist[k]=y;
      var ym=k>=nd?hist[k-nd]:0;
      if(rg&&k%kh===0)nz=o.noise*rg.normal();
      var ymn=ym+(rg?nz:0),u=u0+o.Kp*(_w01_R-ymn),d=o.dFn?o.dFn(t,p):0;
      var last=(o.stopAt!=null&&p>=o.stopAt)||Math.abs(y)>1e4;
      if(k%kr===0||last){out.t.push(t);out.y.push(y);out.ym.push(ymn);out.u.push(u);out.d.push(d);out.p.push(p);}
      if(last)break;
      var yi=(u-d)/_w01_C;
      p+=yi*h+(y-yi)*(m/_w01_C)*(1-a);
      y=yi+(y-yi)*a;
    }
    return out;
  }
  /* 観測ノイズ（0.01 s ごとに変わる、標準偏差 sig の値）による力と速度の揺れの標準偏差（長い時間で見た値。図 e01_noise と同じ式） */
  function _w01_noiseSd(Kp,sig,m){var h=1e-3,nh=10,lam=(_w01_C+Kp)/m,a=Math.exp(-lam*h),A=Math.pow(a,nh),g=Kp/(_w01_C+Kp),M1=0,M2=0;
    for(var j=0;j<nh;j++){M1+=Math.pow(a,j)/nh;M2+=Math.pow(a,2*j)/nh;}
    var Vk=(1-A)*g*g*sig*sig/(1+A),Vy=Vk*M2+g*g*sig*sig*(1-2*M1+M2),Vu=Kp*Kp*(Vy+sig*sig-2*(1-M1)*g*sig*sig);
    return {su:Math.sqrt(Math.max(0,Vu)),sy:Math.sqrt(Math.max(0,Vy))};}
  /* 範囲の外に出たところで止める折れ線 */
  function _w01_clip(P,ts,vs,c,lw,dash,S){var q=[],lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]);
    for(var i=0;i<ts.length;i++){if(ts[i]<P.xr[0]-1e-9||ts[i]>P.xr[1]+1e-9)continue;var v=vs[i];
      if(!(v>=lo&&v<=hi)){q.push([P.X(ts[i]),P.Y(v>hi?hi:lo)]);break;}q.push([P.X(ts[i]),P.Y(v)]);}
    return q.length>1?S.PL(q,c,lw,null,dash):"";}
  /* 加え合わせ点（丸を斜めの線で 4 つに区切り、矢印が入る側に符号） */
  function _w01_sum(S,x,y,signs){var R=15,k=R*0.7071,o=[S.CIRC(x,y,R,"ink",1.5,"screen"),S.L(x-k,y-k,x+k,y+k,"muted",0.9),S.L(x-k,y+k,x+k,y-k,"muted",0.9)];
    var pos={l:[-8.2,3.9],r:[8.2,3.9],t:[0,-4.6],b:[0,12.4]};
    Object.keys(signs).forEach(function(sd){var q=pos[sd];o.push(S.T(x+q[0],y+q[1],signs[sd],"middle",10.5,"ink",true));});
    return o.join("");}
  function _w01_chipL(U,S,x,y,t,c){var w=U.tw(t,9.5)+10;return S.CHIP(x+w/2,y,t,c,9.5);}

  /* ---- 4 節: ブロック線図の上の値を時刻で追う ---- */
  REG.w01_signals=function(el,U){
    var S=U.S;
    U.head(el,"SIGNALS","ブロック線図の各矢印の値（台車の速度の比例制御）");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:sim});
    var tt=U.slider(r1,"時刻 t",{min:0,max:8,step:0.01,value:6,fmt:function(v){return _w01_f(v,2)+" s";},onInput:draw});
    var r2=U.ctrls(el);
    var sl=U.checkbox(r2,"4 s に上り坂 3° に入る",true,sim);
    var ld=U.checkbox(r2,"荷物 1 kg（質量 2 kg）",false,sim);
    var nz=U.checkbox(r2,"観測ノイズ（標準偏差 0.02 m/s）",false,sim);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.05;if(v>=8){v=8;tick.stop();}tt.set(v);draw();},50);
    U.button(br,"本文の例（K<sub>P</sub> = 8、坂、t = 6 s）",function(){tick.stop();kp.set(8);sl.set(true);ld.set(false);nz.set(false);tt.set(6);sim();});
    U.button(br,"再生（0 s から）",function(){tt.set(0);sim();tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var seedBtn=U.button(br,"もう一度（別の乱数で）",function(){seed++;sim();});
    var bd=U.svgbox(el,{scroll:true}),box=U.svgbox(el),ro=U.readout(el);
    var R=null,seed=1,m=1,NS=null;
    function sim(){
      m=ld.get()?2:1;var slope=sl.get();
      NS=nz.get()?_w01_noiseSd(kp.get(),0.02,m):null;
      R=_w01_sim(U,{Kp:kp.get(),L:0,m:m,tEnd:8,rec:0.01,noise:nz.get()?0.02:0,seed:seed,dFn:function(t){return slope&&t>=4-1e-9?_w01_dslope(m,3):0;}});
      draw();
    }
    function at(arr,t){var i=Math.max(0,Math.min(arr.length-1,Math.round(t/0.01)));return arr[i];}
    function draw(){
      if(!R)return;
      seedBtn.style.display=nz.get()?"":"none";
      var t=tt.get(),K=kp.get(),y=at(R.y,t),ym=at(R.ym,t),u=at(R.u,t),d=at(R.d,t),e=_w01_R-ym,u0=_w01_C*_w01_R,o=[];
      /* ブロック線図（図 e01_fb_bd と同じ並び） */
      var B={r0:18,br:70,s1:108,kp0:176,kp1:250,s2:300,sd:380,c0:428,c1:524,bp:592,end:690},Rr=15,yy=100,cy=yy+33,yu=yy-62,yf=yy+70;
      o.push(S.ARR(B.r0,yy,B.s1-Rr,yy,"muted",1.8));o.push(S.T(B.r0+2,yy-9,"目標値 r","start",10,"muted",true));
      o.push(S.CHIP((B.r0+B.br)/2+4,cy,"1.000 m/s","muted",9.5));
      o.push(_w01_sum(S,B.s1,yy,{l:"+",b:"−"}));
      o.push(S.ARR(B.s1+Rr,yy,B.kp0,yy,"alias",1.8));o.push(S.T((B.s1+Rr+B.kp0)/2,yy-9,"偏差 e","middle",10,"alias",true));
      o.push(S.CHIP((B.s1+Rr+B.kp0)/2,cy,_w01_f(e,3)+" m/s","alias",9.5));
      o.push(S.RECT(B.kp0,yy-20,B.kp1-B.kp0,40,6,"panel","signal",1.4));o.push(_w01_tx(U,(B.kp0+B.kp1)/2,yy+5,"× "+K,"middle",12,"ink",true));
      o.push(S.ARR(B.kp1,yy,B.s2-Rr,yy,"gold",1.8));o.push(_w01_tx(U,(B.kp1+B.s2-Rr)/2,yy-9,"K_P e","middle",10,"gold",true));
      o.push(S.CHIP((B.kp1+B.s2-Rr)/2,cy,_w01_f(K*e,2)+" N","gold",9.5));
      o.push(S.D(B.br,yy,"muted",3.6));o.push(S.L(B.br,yy,B.br,yu,"muted",1.6));o.push(S.ARR(B.br,yu,B.kp0,yu,"muted",1.6));
      o.push(S.RECT(B.kp0,yu-19,B.kp1-B.kp0,38,6,"panel","line",1.4));o.push(S.T((B.kp0+B.kp1)/2,yu-3,"決めた力","middle",10.5,"ink",true));
      o.push(_w01_tx(U,(B.kp0+B.kp1)/2,yu+12,"u_0 = c r","middle",9.5,"muted"));
      o.push(S.W([B.kp1,yu,B.s2,yu],"gold",1.8));o.push(S.ARR(B.s2,yu,B.s2,yy-Rr,"gold",1.8));
      o.push(_w01_tx(U,B.s2+8,yu+16,"u_0","start",10,"gold",true));o.push(_w01_chipL(U,S,B.s2+8,yu+36,"2.00 N","gold"));
      o.push(_w01_sum(S,B.s2,yy,{l:"+",t:"+"}));
      o.push(S.ARR(B.s2+Rr,yy,B.sd-Rr,yy,"gold",1.8));o.push(S.T((B.s2+B.sd)/2,yy-9,"操作量 u","middle",10,"gold",true));
      o.push(S.CHIP((B.s2+B.sd)/2,cy,_w01_f(u,2)+" N","gold",9.5));
      o.push(_w01_sum(S,B.sd,yy,{l:"+",t:"−"}));o.push(S.ARR(B.sd,yy-46,B.sd,yy-Rr,"purple",1.8));
      o.push(S.T(B.sd+8,yy-34,"外乱 d（坂の力）","start",10,"purple",true));o.push(_w01_chipL(U,S,B.sd+8,yy-54,_w01_f(d,2)+" N","purple"));
      o.push(S.ARR(B.sd+Rr,yy,B.c0,yy,"ink",1.8));
      o.push(S.RECT(B.c0,yy-20,B.c1-B.c0,40,6,"panel","signal",1.4));o.push(S.T((B.c0+B.c1)/2,yy-3,"台車","middle",11,"ink",true));
      o.push(S.T((B.c0+B.c1)/2,yy+12,"質量 "+m+" kg","middle",9.5,"muted"));
      o.push(S.ARR(B.c1,yy,B.end,yy,"signal",1.8));o.push(S.T((B.c1+B.end)/2+26,yy-9,"制御量 y（速度）","middle",10,"signal",true));
      o.push(S.CHIP(B.end-6-(U.tw(_w01_f(y,3)+" m/s",9.5)+10)/2,cy,_w01_f(y,3)+" m/s","signal",9.5));
      o.push(S.D(B.bp,yy,"signal",4));o.push(S.L(B.bp,yy,B.bp,yf,"signal",1.8));o.push(S.ARR(B.bp,yf,B.c1,yf,"signal",1.8));
      o.push(S.RECT(B.c0,yf-18,B.c1-B.c0,36,6,"panel","teal",1.4));o.push(S.T((B.c0+B.c1)/2,yf+4,"センサ","middle",10.5,"ink",true));
      o.push(S.L(B.c0,yf,B.s2+Rr,yf,"teal",1.8));o.push(_w01_sum(S,B.s2,yf,{r:"+",b:"+"}));
      o.push(S.ARR(B.s2,yf+44,B.s2,yf+Rr,"teal",1.6,null,"4 3"));o.push(S.T(B.s2+8,yf+40,"観測ノイズ n"+(nz.get()?" = "+_w01_f(ym-y,3)+" m/s":"（なし）"),"start",10,"teal",true));
      o.push(S.L(B.s2-Rr,yf,B.s1,yf,"teal",1.8));o.push(S.ARR(B.s1,yf,B.s1,yy+Rr,"teal",1.8));
      o.push(S.T((B.s1+B.s2)/2,yf-8,"測った値 y + n","middle",10,"teal",true));o.push(S.CHIP((B.s1+B.s2)/2,yf+26,_w01_f(ym,3)+" m/s","teal",9.5));
      if(K===0)o.push(S.T(B.kp0-4,yy+52,"K_P = 0: 測った値を使わない（開ループと同じ）","start",9.5,"alias",true));
      bd.set(S.svg(700,yf+52,o));
      /* 時間の図 */
      var nar=_w01_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?332:610,q=[];
      var P1=U.plot(x0,14,pw,130,[0,8],[0,1.4]);
      if(sl.get())q.push(S.RECT(P1.X(4),P1.y,P1.X(8)-P1.X(4),P1.h,0,U.soft("purple"),"none",0));
      q.push(P1.axes({yl:"速度 [m/s]",xt:[0,1,2,3,4,5,6,7,8],yt:[0,0.2,0.4,0.6,0.8,1.0,1.2,1.4],xfmt:function(){return "";},yfmt:function(v){return v.toFixed(1);},ylOff:nar?36:40}));
      q.push(P1.line([[0,1],[8,1]],"muted",1.3,"5 3"));
      if(nz.get())q.push(P1.line(R.t.map(function(tq,i){return [tq,R.ym[i]];}),"teal",0.9));
      q.push(P1.line(R.t.map(function(tq,i){return [tq,R.y[i]];}),"signal",2.2));
      var P2=U.plot(x0,166,pw,80,[0,8],[-2,6]);
      if(sl.get())q.push(S.RECT(P2.X(4),P2.y,P2.X(8)-P2.X(4),P2.h,0,U.soft("purple"),"none",0));
      q.push(P2.axes({xl:"時間 t [s]",yl:"力 [N]",xt:[0,1,2,3,4,5,6,7,8],yt:[-2,0,2,4,6],ylOff:nar?36:40}));
      q.push(_w01_clip(P2,R.t,R.u.map(function(v){return Math.max(-2,Math.min(6,v));}),"gold",1.8,null,S));
      q.push(P2.line(R.t.map(function(tq,i){return [tq,R.d[i]];}),"purple",1.8));
      q.push(S.L(P1.X(t),P1.y,P1.X(t),P2.y+P2.h,"ink",1.2,"3 3"));
      q.push(S.D(P1.X(t),P1.Y(Math.max(0,Math.min(1.4,y))),"signal",4));q.push(S.D(P2.X(t),P2.Y(Math.max(-2,Math.min(6,u))),"gold",4));
      q.push(S.T(P1.X(t)+(t>6.5?-6:6),P1.y+12,"t = "+_w01_f(t,2)+" s",t>6.5?"end":"start",9.5,"ink",true,false,null,true));
      if(Math.max.apply(null,R.u)>6)q.push(S.T(P2.X(0.15),P2.y+11,"動き始めの力は枠の外（最大 "+_w01_f(Math.max.apply(null,R.u),1)+" N）","start",9,"gold",false,false,null,true));
      q.push(S.T(x0,P2.y+P2.h+48,"青: 速度 y　"+(nz.get()?"青緑: 測った値　":"")+"金: 押す力 u　紫: 坂の力 d","start",9.5,"muted"));
      box.set(S.svg(Wd,P2.y+P2.h+56,q));
      /* 読み出し */
      var acc=(u-_w01_C*y-d)/m,ess=(_w01_C*_w01_R-u0+(sl.get()?_w01_dslope(m,3):0))/(_w01_C+K),h="";
      h+="t = "+_w01_f(t,2)+" s: 目標値 r = 1.000 m/s、速度 y = <b>"+_w01_f(y,3)+" m/s</b>、測った値 = "+_w01_f(ym,3)+" m/s、偏差 = r − 測った値 = "+_w01_f(e,3)+" m/s<br>";
      h+="押す力 u = u<sub>0</sub> + K<sub>P</sub> × 偏差 = 2.00 + "+K+" × "+_w01_f(e,3)+" = <b>"+_w01_f(u,2)+" N</b><br>";
      h+="後ろ向きの力: 抵抗 c y = 2 × "+_w01_f(y,3)+" = "+_w01_f(_w01_C*y,2)+" N、坂の力 d = "+_w01_f(d,2)+" N → 力の合計 "+_w01_f(u-_w01_C*y-d,2)+" N、加速度 "+_w01_f(acc,2)+" m/s²"+(Math.abs(acc)<0.02?'（<span class="ok">釣り合っている</span>）':"")+"<br>";
      h+="4 節の定常偏差の式: (c r − u<sub>0</sub> + d) ÷ (c + K<sub>P</sub>) = "+_w01_f(ess,3)+" m/s（"+(sl.get()?"坂の上":"平らな道")+"で落ち着いた後の値）";
      if(nz.get()&&NS)h+="<br>観測ノイズによる揺れ（長い時間で見た標準偏差）: 力 <b>"+_w01_f(NS.su,2)+" N</b>、速度 <b>"+_w01_f(NS.sy,4)+" m/s</b>";
      ro.innerHTML=h+'<div class="wnote">台車は質量 '+m+' kg、抵抗の係数 c = 2 N·s/m、決めた力 u<sub>0</sub> = c r = 2 N。1 ms 刻みで計算した。観測ノイズは 0.01 s ごとに変わる値。</div>';
    }
    sim();
  };

  /* ---- 4 節: 開ループと比例制御の台車が同じ坂道を走る ---- */
  REG.w01_openclosed=function(el,U){
    var S=U.S;
    U.head(el,"OPEN / CLOSED","開ループと比例制御の台車で、同じ坂道を走る");
    var r1=U.ctrls(el);
    var dg=U.slider(r1,"坂の角度",{min:0,max:5,step:0.5,value:3,fmt:function(v){return v+"°";},onInput:sim});
    var ms=U.slider(r1,"荷物",{values:[0,0.5,1,1.5,2],value:0,fmt:function(v){return v+" kg";},onInput:sim});
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0,1,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:sim});
    var r2=U.ctrls(el);
    var nz=U.checkbox(r2,"観測ノイズ（標準偏差 0.02 m/s）",false,sim);
    var br=U.btnrow(el);
    var at=0,tick=U.ticker(function(){at+=0.08;if(at>=tmax){at=tmax;tick.stop();}draw();},40);
    U.button(br,"走らせる",function(){if(at>=tmax)at=0;tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"最初から",function(){tick.stop();at=0;draw();});
    U.button(br,"本文の例（3°・荷物なし・K<sub>P</sub> = 8）",function(){tick.stop();dg.set(3);ms.set(0);kp.set(8);nz.set(false);at=0;sim();});
    var seedBtn=U.button(br,"もう一度（別の乱数で）",function(){seed++;sim();});
    var box=U.svgbox(el),ro=U.readout(el);
    var A=null,B=null,tmax=1,seed=1;
    var X0=3,X1=8,X2=13,XE=16;
    function sgn(p){return (p>=X0&&p<X1)?1:((p>=X1&&p<X2)?-1:0);}
    function sim(){
      var m=1+ms.get(),d0=_w01_dslope(m,dg.get()),f=function(t,p){return sgn(p)*d0;},noise=nz.get()?0.02:0;
      A=_w01_sim(U,{Kp:0,m:m,tEnd:60,rec:0.01,dFn:f,stopAt:XE,noise:0});
      B=_w01_sim(U,{Kp:kp.get(),m:m,tEnd:60,rec:0.01,dFn:f,stopAt:XE,noise:noise,seed:seed});
      tmax=Math.max(A.t[A.t.length-1],B.t[B.t.length-1]);if(at>tmax)at=tmax;
      draw();
    }
    function posAt(R,t){var i=Math.min(R.t.length-1,Math.max(0,Math.round(t/0.01)));return {p:R.p[i],y:R.y[i]};}
    /* 位置 x に着く時刻（前後の記録の間で補間）と、その直前の速度（坂の向きが変わる前の値） */
    function cross(R,x){for(var i=1;i<R.p.length;i++)if(R.p[i]>=x&&R.p[i-1]<x){var f=(x-R.p[i-1])/(R.p[i]-R.p[i-1]);return {t:R.t[i-1]+f*(R.t[i]-R.t[i-1]),y:R.y[i-1]};}return null;}
    function draw(){
      if(!A)return;
      seedBtn.style.display=nz.get()?"":"none";
      var nar=_w01_nar(box),Wd=nar?400:700,x0=nar?50:62,pw=nar?336:612,o=[],deg=dg.get();
      var X=function(p){return x0+p/XE*pw;},sn=Math.sin(deg*Math.PI/180),ex=sn>0?Math.min(30/(5*sn),400):0;
      function z(p){var zz=p<X0?0:(p<X1?(p-X0):(p<X2?(X2-p):0));return zz*sn*ex;}
      /* 2 本の道と台車 */
      [[A,"開ループ（決めた力 2 N のまま）","alias",70],[B,"比例制御（K_P = "+kp.get()+"）","signal",150]].forEach(function(L){
        var R=L[0],base=L[3],pts=[];
        for(var k=0;k<=160;k++){var p=k/10;pts.push([X(p),base-z(p)]);}
        o.push(S.PL(pts.concat([[X(XE),base+8],[X(0),base+8]]),"muted",1.2,"panel"));
        o.push(_w01_tx(U,x0,base-48,L[1],"start",10,L[2],true));
        var s=posAt(R,at),p=Math.max(0,Math.min(XE,s.p)),gx=X(p),gy=base-z(p);
        var ang=-Math.atan2(z(Math.min(XE,p+0.05))-z(Math.max(0,p-0.05)),X(Math.min(XE,p+0.05))-X(Math.max(0,p-0.05)))*180/Math.PI;
        o.push('<g transform="rotate('+ang.toFixed(2)+' '+gx.toFixed(2)+' '+gy.toFixed(2)+')">'+S.RECT(gx-14,gy-20,28,13,3,U.soft(L[2]),L[2],1.5)+S.CIRC(gx-8,gy-4,4,"ink",1.3,"panel")+S.CIRC(gx+8,gy-4,4,"ink",1.3,"panel")+'</g>');
        o.push(S.T(gx,gy-26,_w01_f(s.y,2)+" m/s","middle",9.5,L[2],true,false,null,true));
      });
      o.push(S.T(X((X0+X1)/2),186,"上り坂 "+deg+"°","middle",9.5,"purple",true));o.push(S.T(X((X1+X2)/2),186,"下り坂 "+deg+"°","middle",9.5,"purple",true));
      if(deg>0)o.push(S.T(x0+pw,nar?199:186,"（高さは大きく描いた）","end",9,"muted"));
      o.push(S.T(x0+pw,30,"t = "+_w01_f(at,1)+" s","end",10,"ink",true));
      /* 位置ごとの速度 */
      var ymax=Math.max(1.4,Math.ceil((Math.max(Math.max.apply(null,A.y),Math.max.apply(null,B.y))+0.1)*5)/5),P=U.plot(x0,nar?214:206,pw,170,[0,XE],[0,ymax]);
      o.push(S.RECT(P.X(X0),P.y,P.X(X1)-P.X(X0),P.h,0,U.soft("purple"),"none",0));o.push(S.RECT(P.X(X1),P.y,P.X(X2)-P.X(X1),P.h,0,U.soft("teal"),"none",0));
      o.push(P.axes({xl:"位置 [m]",yl:"速度 [m/s]",xt:[0,2,4,6,8,10,12,14,16],yt:U.nice(0,ymax,5),ylOff:nar?36:40}));
      o.push(P.line([[0,1],[XE,1]],"muted",1.3,"5 3"));
      [[A,"alias"],[B,"signal"]].forEach(function(L){var R=L[0];o.push(P.line(R.p.map(function(p,i){return [Math.min(XE,p),R.y[i]];}),L[1],2));
        var s=posAt(R,at);o.push(S.D(P.X(Math.max(0,Math.min(XE,s.p))),P.Y(Math.max(0,Math.min(ymax,s.y))),L[1],4.2));});
      o.push(S.T(P.X(X0+0.1),P.y+12,"上り坂","start",9.5,"purple",true,false,null,true));o.push(S.T(P.X(X1+0.1),P.y+12,"下り坂","start",9.5,"teal",true,false,null,true));
      o.push(S.T(x0,P.y+P.h+48,"赤: 開ループ　青: 比例制御　破線: 目標値 1 m/s","start",9.5,"muted"));
      box.set(S.svg(Wd,P.y+P.h+56,o));
      /* 読み出し */
      var m=1+ms.get(),d0=_w01_dslope(m,deg),K=kp.get(),h="";
      var a8=cross(A,X1),b8=cross(B,X1),a13=cross(A,X2),b13=cross(B,X2),aE=cross(A,XE),bE=cross(B,XE);
      h+="坂の力 d = "+(1+ms.get())+" kg × 9.81 × sin "+deg+"° = "+_w01_f(d0,2)+" N<br>";
      h+="上り坂の終わる直前（8 m）の速度: 開ループ <b>"+(a8?_w01_f(a8.y,3):"—")+" m/s</b>（式 r − d/c = "+_w01_f(1-d0/_w01_C,3)+"）、比例制御 <b>"+(b8?_w01_f(b8.y,3):"—")+" m/s</b>（式 r − d/(c + K<sub>P</sub>) = "+_w01_f(1-d0/(_w01_C+K),3)+"）<br>";
      h+="下り坂の終わる直前（13 m）の速度: 開ループ "+(a13?_w01_f(a13.y,3):"—")+" m/s、比例制御 "+(b13?_w01_f(b13.y,3):"—")+" m/s<br>";
      h+="16 m に着く時刻: 開ループ "+(aE?_w01_f(aE.t,1)+" s":"60 s で着かない")+"、比例制御 "+(bE?_w01_f(bE.t,1)+" s":"60 s で着かない")+(aE&&bE?"（差 "+_w01_f(aE.t-bE.t,1)+" s）":"");
      ro.innerHTML=h+'<div class="wnote">台車は質量 1 kg（＋荷物）、抵抗の係数 2 N·s/m。どちらも決めた力 2 N を出し、比例制御はそれに K<sub>P</sub> × 偏差を足す。坂の上の式の値は、坂が十分に長く、速度が落ち着いたときの値。「走らせる」は実際の 2 倍の速さで動く。</div>';
    }
    sim();
  };

  /* ---- 5 節: 比例ゲインとむだ時間の地図 ↔ 速度の動き ---- */
  function _w01_bounds(L,T,K){
    if(L<=0)return [Infinity,Infinity];
    var lo=1e-9,hi=Math.PI/L;for(var i=0;i<100;i++){var mid=(lo+hi)/2;if(Math.atan(mid*T)+mid*L>Math.PI)hi=mid;else lo=mid;}
    var w=(lo+hi)/2;return [(T/L)*Math.exp(-(1+L/T))/K,Math.sqrt(1+(w*T)*(w*T))/K];
  }
  REG.w01_gain=function(el,U){
    var S=U.S;
    U.head(el,"GAIN × DELAY","比例ゲインとむだ時間の組と、台車の速度の動き");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{min:0.5,max:60,log:true,value:8,fmt:function(v){return U.sig(v,3)+" N/(m/s)";},onInput:draw});
    var ld=U.slider(r1,"むだ時間 L",{min:0,max:0.3,step:0.005,value:0.1,fmt:function(v){return _w01_f(v,3)+" s";},onInput:draw});
    var r2=U.ctrls(el);
    var lo=U.checkbox(r2,"荷物 1 kg（質量 2 kg）",false,draw);
    var ff=U.checkbox(r2,"決めた力 u<sub>0</sub> = 2 N を足す",true,draw);
    var br=U.btnrow(el);
    [8,2,14,20].forEach(function(k){U.button(br,(k===8?"本文の例: ":"")+"K<sub>P</sub> = "+k+"（L = 0.1 s）",function(){kp.set(k);ld.set(0.1);lo.set(false);ff.set(true);draw();});});
    U.button(br,"遅れなし（K<sub>P</sub> = 20）",function(){kp.set(20);ld.set(0);lo.set(false);ff.set(true);draw();});
    var box=U.svgbox(el),ro=U.readout(el),MP=null;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!MP)return;
      if(type==="down"&&!(x>=MP.x-6&&x<=MP.x+MP.w+6&&y>=MP.y-6&&y<=MP.y+MP.h+6))return false;
      var L=Math.max(0,Math.min(0.3,MP.ux(x))),K=Math.max(0.5,Math.min(60,MP.uy(y)));
      ld.set(Math.round(L/0.005)*0.005);kp.set(+K.toPrecision(3));draw();
    });
    function draw(){
      var K=kp.get(),L=ld.get(),m=lo.get()?2:1,T=m/_w01_C,Kg=1/_w01_C,uff=ff.get(),bb=_w01_bounds(L,T,Kg);
      var nar=_w01_nar(box),Wd=nar?400:700,o=[];
      /* 地図 */
      var mx=nar?56:56,mw=nar?320:230,mh=nar?190:236,P=U.plot(mx,16,mw,mh,[0,0.3],[0.5,60],{ylog:true});MP=P;
      var lo1=[],hi1=[];for(var i=1;i<=100;i++){var Lq=0.003*i,b=_w01_bounds(Lq,T,Kg);lo1.push([P.X(Lq),P.Y(Math.max(0.5,Math.min(60,b[0])))]);hi1.push([P.X(Lq),P.Y(Math.max(0.5,Math.min(60,b[1])))]);}
      o.push(S.PL([[P.X(0),P.Y(0.5)],[P.X(0),P.Y(60)]].concat(lo1).concat([[P.X(0.3),P.Y(0.5)]]),"none",0,"green",null,0.13));
      o.push(S.PL(lo1.concat(hi1.slice().reverse()),"none",0,"gold",null,0.15));
      o.push(S.PL(hi1.concat([[P.X(0.3),P.Y(60)]]),"none",0,"alias",null,0.13));
      o.push(P.axes({xl:"むだ時間 L [s]",yl:"比例ゲイン [N/(m/s)]",xt:[0,0.1,0.2,0.3],yt:[0.5,1,2,5,10,20,50],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:40}));
      o.push(S.PL(lo1,"green",1.8));o.push(S.PL(hi1,"alias",1.8));
      o.push(S.T(P.X(0.2),P.Y(0.75),"振動しない","middle",9.5,"green",true,false,null,true));
      o.push(S.T(P.X(0.21),P.Y(3.2),"振動して収まる","middle",9.5,"gold",true,false,null,true));
      o.push(S.T(P.X(0.19),P.Y(35),"大きくなり続ける","middle",9.5,"alias",true,false,null,true));
      o.push(S.CIRC(P.X(L),P.Y(K),7,"ink",2,"screen"));o.push(S.D(P.X(L),P.Y(K),"signal",4));
      o.push(S.T(P.x+P.w,P.y+P.h+44,"点をドラッグして変えられる","end",9,"muted"));
      /* 速度と力 */
      var rx=nar?56:340,rw=nar?320:340,ry=nar?mh+76:16;
      var R=_w01_sim(U,{Kp:K,L:L,m:m,tEnd:6,rec:0.004,uff:uff,dFn:function(t){return t>=3-1e-9?_w01_dslope(m,3):0;}});
      var P1=U.plot(rx,ry,rw,150,[0,6],[0,2]);
      o.push(S.RECT(P1.X(3),P1.y,P1.X(6)-P1.X(3),P1.h,0,U.soft("purple"),"none",0));
      o.push(P1.axes({yl:"速度 [m/s]",xt:[0,1,2,3,4,5,6],yt:[0,0.5,1,1.5,2],xfmt:function(){return "";},yfmt:function(v){return v.toFixed(1);},ylOff:40}));
      o.push(P1.line([[0,1],[6,1]],"muted",1.3,"5 3"));
      o.push(_w01_clip(P1,R.t,R.ym,"teal",1.2,"5 3",S));
      o.push(_w01_clip(P1,R.t,R.y,"signal",2.2,null,S));
      o.push(S.T(P1.X(4.5),P1.y+12,"上り坂 3°","middle",9.5,"purple",true,false,null,true));
      var P2=U.plot(rx,ry+168,rw,72,[0,6],[-15,25]);
      o.push(P2.axes({xl:"時間 t [s]",yl:"力 [N]",xt:[0,1,2,3,4,5,6],yt:[-10,0,10,20],ylOff:40}));
      o.push(P2.line([[0,0],[6,0]],"faint",1));
      o.push(_w01_clip(P2,R.t,R.u,"gold",1.6,null,S));
      o.push(S.T(rx,P2.y+P2.h+48,"青: 速度　青緑の破線: 届く値　金: 力","start",9.5,"muted"));
      box.set(S.svg(Wd,P2.y+P2.h+56,o));
      /* 読み出し */
      var i3=Math.round(3/0.004),pk=-Infinity,peaks=[],i95=-1,grow=false;
      for(var i2=0;i2<i3&&i2<R.y.length;i2++){if(R.y[i2]>pk)pk=R.y[i2];if(i95<0&&R.y[i2]>=0.95)i95=i2;
        if(i2>0&&i2<R.y.length-1&&R.y[i2]>R.y[i2-1]&&R.y[i2]>=R.y[i2+1]&&R.y[i2]>1.0005)peaks.push(R.y[i2]-1);}
      var n=R.y.length,last=R.y[n-1],tail=R.y.slice(Math.max(0,n-250)),amp=Math.max.apply(null,tail)-Math.min.apply(null,tail);
      if(R.t[n-1]<5.99||Math.abs(last)>50)grow=true;
      var cls=K<bb[0]?'<span class="ok">振動しない</span>':(K<bb[1]?"振動して収まる":'<span class="warn">振れが大きくなり続ける（不安定）</span>');
      var d3=_w01_dslope(m,3),ess=(_w01_C*_w01_R-(uff?_w01_C*_w01_R:0)+d3)/(_w01_C+K),h="";
      h+="この組は "+cls+"。このむだ時間での境目: 振動し始める "+(isFinite(bb[0])?_w01_f(bb[0],1):"なし")+"、大きくなり始める "+(isFinite(bb[1])?_w01_f(bb[1],1):"なし")+" N/(m/s)<br>";
      h+="坂に入るまで（0〜3 s）: 最大の速度 "+(pk>50?"枠の外":_w01_f(pk,2)+" m/s")+(i95>=0?"、1 m/s の 95 % に初めて届く時刻 "+_w01_f(i95*0.004,2)+" s":"")+"<br>";
      if(peaks.length>=2&&!grow)h+="目標値を越えた分の比（次の山 ÷ 前の山）: "+_w01_f(peaks[1]/peaks[0],2)+" 倍<br>";
      h+="坂の上の速度（6 s）: "+(grow?'<span class="warn">落ち着かない</span>':"<b>"+_w01_f(last,3)+" m/s</b>"+(amp>0.01?"（まだ振れている）":""))+"、4 節の式 r − (c r − u<sub>0</sub> + d) ÷ (c + K<sub>P</sub>) = "+_w01_f(1-ess,3)+" m/s<br>";
      h+="動き始めの力: "+_w01_f(R.u[0],1)+" N";
      ro.innerHTML=h+'<div class="wnote">台車（質量 '+m+' kg、抵抗の係数 2 N·s/m）を止まった状態から 1 m/s で走らせ、3 s に上り坂 3° に入る。測った速度は L だけ遅れて制御器に届く。1 ms 刻みで計算した。地図の境目は、同じ台車で求めた値（9 章 6 節）。</div>';
    }
    draw();
  };

  /* ---- 5 節: シャワーの湯温を手で合わせる ---- */
  REG.w01_hand=function(el,U){
    var S=U.S,TC=15,TH0=60,TGT=40,DT=0.01,TEND=40,TAU=0.5;
    U.head(el,"SHOWER","シャワーの湯温を 39〜41 °C に合わせる（あなたが制御器）");
    var br=U.btnrow(el);br.style.marginTop="0";
    U.button(br,"始める",function(){reset();running=true;tick.start();});
    U.button(br,"止める",function(){running=false;tick.stop();draw();});
    U.button(br,"最初から",function(){reset();});
    U.button(br,"本文の例（遅れ 2 s・手で回す）",function(){md.set(0);dl.set(2);kp.set(2);dist.set(false);knob.set(20);reset();});
    var sbox=U.svgbox(el);
    var r0=U.ctrls(el);
    var knob=U.slider(r0,"つまみ（お湯の割合）。湯温を見ながら動かす",{min:0,max:100,step:1,value:20,fmt:function(v){return Math.round(v)+" %";},onInput:function(){if(!running)draw();}});
    knob.el.style.flex="1 1 100%";
    var box=U.svgbox(el);
    var r1=U.ctrls(el);
    var md=U.select(r1,"回す人",["手で回す（つまみを動かす）","自動（比例制御）"],0,function(){draw();});
    var dl=U.slider(r1,"ホースの遅れ",{values:[0,1,2,3],value:2,fmt:function(v){return v+" s";},onInput:function(){reset();}});
    var kp=U.slider(r1,"自動の比例ゲイン",{values:[0.5,1,1.5,2,2.5,3,4],value:2,fmt:function(v){return v+" %/°C";},onInput:draw});
    var r2=U.ctrls(el);
    var dist=U.checkbox(r2,"20 s に給湯の温度が 50 °C に下がる",false,draw);
    var ro=U.readout(el);
    var t,th,hmix,histT,histM,running=false,inStart,doneAt,reached,leaves,inside,tmaxAfter,tminAfter;
    var tick=U.ticker(function(){for(var i=0;i<5;i++)step();if(t>=TEND-1e-9){running=false;tick.stop();}draw();},50);
    function thot(tt){return (dist.get()&&tt>=20)?50:TH0;}
    function mixT(k,tt){return TC+k/100*(thot(tt)-TC);}
    function reset(){tick.stop();running=false;t=0;knob.set(20);var k=20;th=mixT(k,0);hmix=[];var nd=Math.round(dl.get()/DT);for(var i=0;i<=nd;i++)hmix.push(th);
      histT=[[0,th]];histM=[[0,th]];inStart=null;doneAt=null;reached=null;leaves=0;inside=false;tmaxAfter=-Infinity;tminAfter=Infinity;draw();}
    function step(){
      if(t>=TEND-1e-9)return;
      var k=knob.get();
      if(md.get()===1){var k0=(TGT-TC)/(TH0-TC)*100;k=Math.max(0,Math.min(100,k0+kp.get()*(TGT-th)));knob.set(Math.round(k*10)/10);}
      var mx=mixT(k,t);hmix.push(mx);var dIn=hmix.shift();
      th+=(dIn-th)*(1-Math.exp(-DT/TAU));t+=DT;
      var ok=th>=39&&th<=41;
      if(ok&&!inside){inside=true;inStart=t;if(reached===null)reached=t;}
      if(!ok&&inside){inside=false;inStart=null;leaves++;}
      if(reached!==null){tmaxAfter=Math.max(tmaxAfter,th);tminAfter=Math.min(tminAfter,th);}
      if(inside&&doneAt===null&&t-inStart>=5-1e-9)doneAt=t;
      if(Math.round(t/DT)%5===0){histT.push([t,th]);histM.push([t,mx]);}
    }
    function wcol(v){return v<37?"signal":(v<39?"teal":(v<=41?"green":(v<=43?"gold":"alias")));}
    function draw(){
      kp.el.style.display=md.get()===1?"":"none";
      var nar=_w01_nar(box),Wd=nar?400:700,o=[],k=knob.get(),mxNow=mixT(k,t);
      /* 絵: つまみ・ホース・シャワーの口・温度計 */
      var vx=nar?42:70,vy=130,hx=nar?236:300,hy=30;
      o.push(S.RECT(vx-30,vy-26,60,52,8,"panel","line",1.4));
      o.push(S.CIRC(vx,vy,20,"ink",1.6,"screen"));
      var ang=(-135+270*k/100)*Math.PI/180;o.push(S.L(vx,vy,vx+17*Math.sin(ang),vy-17*Math.cos(ang),"gold",3));
      o.push(S.T(vx-24,vy+40,"水","middle",9.5,"signal",true));o.push(S.T(vx+24,vy+40,"湯","middle",9.5,"alias",true));
      o.push(S.T(vx-26,vy-34,"つまみ "+Math.round(k)+" %","start",10,"gold",true));
      /* ホース: 弁からシャワーの口まで。位置 f のところには、f × 遅れ だけ前に混ぜたお湯がある */
      var path=[[vx+30,vy],[hx-90,vy],[hx-50,vy-24],[hx-28,vy-70],[hx-8,hy+4]],tot=0,i;
      for(i=1;i<path.length;i++)tot+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
      var N=24,nd=hmix.length-1;
      function ptAt(s2){var acc=0;for(var j=1;j<path.length;j++){var L=Math.hypot(path[j][0]-path[j-1][0],path[j][1]-path[j-1][1]);if(acc+L>=s2||j===path.length-1){var f=L>0?(s2-acc)/L:0;f=Math.max(0,Math.min(1,f));return [path[j-1][0]+f*(path[j][0]-path[j-1][0]),path[j-1][1]+f*(path[j][1]-path[j-1][1])];}acc+=L;}}
      o.push(S.PL(path,"line",9));
      for(i=0;i<N;i++){var fm=(i+0.5)/N,idx=Math.max(0,Math.min(nd,Math.round(nd*(1-fm)))),v=nd>0?hmix[idx]:mxNow;
        var a=ptAt(i/N*tot),b=ptAt((i+1)/N*tot);o.push(S.L(a[0],a[1],b[0],b[1],wcol(v),6));}
      o.push(S.RECT(hx-26,hy-8,40,14,5,"panel","ink",1.4));
      for(i=0;i<5;i++){var dx=hx-20+i*7;o.push(S.L(dx,hy+12,dx-4+i*2,hy+64,wcol(th),2,"3 5"));}
      o.push(S.T(hx-26,hy+84,"出てくる湯 "+_w01_f(th,1)+" °C","start",10,wcol(th),true,false,null,true));
      if(dl.get()>0)o.push(S.T(vx+34,vy+20,"ホースの中: "+dl.get()+" s 前までに混ぜたお湯","start",9,"muted"));
      /* 温度計 */
      var gx=nar?346:420,gt=22,gb=150,G=function(v){return gb-(Math.max(10,Math.min(60,v))-10)/50*(gb-gt);};
      o.push(S.RECT(gx-7,gt-4,14,gb-gt+8,7,"screen","line",1.2));
      o.push(S.RECT(gx-9,G(41),18,G(39)-G(41),2,U.soft("green"),"green",1));
      o.push(S.RECT(gx-4,G(th),8,gb-G(th),3,wcol(th),"none",0));
      [10,20,30,40,50,60].forEach(function(v){o.push(S.L(gx+9,G(v),gx+14,G(v),"muted",1));o.push(S.T(gx+17,G(v)+3.5,String(v),"start",9,"muted"));});
      o.push(S.T(gx,gb+18,"°C","middle",9,"muted"));
      if(!nar){o.push(S.T(476,46,_w01_f(th,1)+" °C","start",24,wcol(th),true));
        o.push(S.T(476,70,th>41?"熱い":(th<39?"ぬるい・冷たい":"ちょうどよい（39〜41 °C）"),"start",11,wcol(th),true));
        o.push(S.T(476,96,"弁で混ぜたお湯: "+_w01_f(mxNow,1)+" °C","start",10,"gold",true));
        o.push(S.T(476,116,"時刻 "+_w01_f(t,1)+" s / "+TEND+" s","start",10,"ink"));
        if(doneAt!==null)o.push(S.T(476,140,"合わせられた（"+_w01_f(doneAt,1)+" s）","start",11,"green",true));}
      else{o.push(S.T(8,16,_w01_f(th,1)+" °C","start",16,wcol(th),true));o.push(S.T(8,32,"時刻 "+_w01_f(t,1)+" s","start",9.5,"ink"));}
      sbox.set(S.svg(Wd,182,o));
      /* 時間の図 */
      var q=[],x0=nar?44:62,pw=nar?342:612,P=U.plot(x0,12,pw,150,[0,TEND],[10,60]);
      q.push(S.RECT(P.x,P.Y(41),P.w,P.Y(39)-P.Y(41),0,U.soft("green"),"none",0));
      q.push(P.axes({xl:"時間 [s]",yl:"温度 [°C]",xt:[0,5,10,15,20,25,30,35,40],yt:[10,20,30,40,50,60],ylOff:nar?32:40}));
      if(dist.get())q.push(S.L(P.X(20),P.y,P.X(20),P.y+P.h,"purple",1,"3 3"));
      if(histM.length>1)q.push(P.line(histM,"gold",1.4,"5 3"));
      if(histT.length>1)q.push(P.line(histT,"signal",2.2));
      q.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"ink",1,"3 3"));
      q.push(S.T(x0,P.y+P.h+48,"青: 出てくる湯の温度　金の破線: 弁で混ぜたお湯の温度　緑の帯: 39〜41 °C","start",9.5,"muted"));
      box.set(S.svg(Wd,P.y+P.h+56,q));
      var h="";
      if(nar)h+="湯温 <b>"+_w01_f(th,1)+" °C</b>、弁で混ぜたお湯 "+_w01_f(mxNow,1)+" °C、時刻 "+_w01_f(t,1)+" s<br>";
      if(doneAt!==null)h+='<span class="ok">39〜41 °C に入って 5 s 保てた: '+_w01_f(doneAt,1)+" s</span><br>";
      else if(t>=TEND-1e-9)h+='<span class="warn">40 s の間に、39〜41 °C で 5 s 保てなかった</span><br>';
      else h+=(running?"動いている。":"「始める」を押す。")+"39〜41 °C に入れて 5 s 保つ<br>";
      if(reached!==null)h+="はじめて 39 °C 以上 41 °C 以下に入った時刻 "+_w01_f(reached,1)+" s。その後の最高 "+_w01_f(tmaxAfter,1)+" °C・最低 "+_w01_f(tminAfter,1)+" °C、帯から出た回数 "+leaves+" 回<br>";
      if(md.get()===1){var k0=(TGT-TC)/(TH0-TC)*100;h+="自動: つまみ = "+_w01_f(k0,1)+" % + "+kp.get()+" %/°C × (40 °C − 湯温)（0〜100 % に収める）<br>";}
      ro.innerHTML=h+'<div class="wnote">水 15 °C・湯 60 °C を、つまみの割合で混ぜる。混ぜたお湯は、ホースの遅れだけ後にシャワーの口から出て、さらに 0.5 s ほどかけて温度がなじむとした。値はどれも例の値。</div>';
    }
    reset();
  };

  /* ===== 02 章 動きを式にする ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w02_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w02_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w02_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s;
    if(a>=1e6||a<1e-4)s=(+v).toExponential(1).replace("e+","×10^").replace("e-","×10^−");
    else s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace(/^-/,"−");}
  /* 斜体と添字を含む文字。parts=[[文字, 添字, 斜体か, 色], ...] */
  function _w02_m(U,x,y,parts,a,sz,c,b,halo){
    var o='<text x="'+(Math.round(x*100)/100)+'" y="'+(Math.round(y*100)/100)+'" text-anchor="'+(a||"start")+'" font-size="'+sz+'" fill="'+U.col(c||"ink")+
      '" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+(halo?' stroke="var(--screen)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"':'')+'>',pend=0;
    parts.forEach(function(p){var cc=p[3]?' fill="'+U.col(p[3])+'"':'';
      o+='<tspan font-style="'+(p[2]?"italic":"normal")+'"'+cc+(pend?' dy="'+pend+'"':'')+'>'+U.esc(p[0])+'</tspan>';pend=0;
      if(p[1]){o+='<tspan dy="3" font-size="'+(sz*0.72)+'"'+cc+'>'+U.esc(p[1])+'</tspan>';pend=-3;}});
    return o+'</text>';
  }
  /* グラフの範囲の外に出る所で切った折れ線（点は値の組 [x, y]） */
  function _w02_cl(P,pts,c,lw,dash){
    var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),segs=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1],ins=isFinite(b)&&b>=lo&&b<=hi;
      if(prev){var pa=prev[0],pb=prev[1],pin=isFinite(pb)&&pb>=lo&&pb<=hi;
        if(ins&&!pin&&isFinite(pb)){var l1=pb>hi?hi:lo;cur=[[pa+(a-pa)*(l1-pb)/(b-pb),l1]];}
        else if(pin&&!ins){if(isFinite(b)){var l2=b>hi?hi:lo;cur.push([pa+(a-pa)*(l2-pb)/(b-pb),l2]);}segs.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=q;});
    if(cur.length)segs.push(cur);
    return segs.filter(function(s){return s.length>=2;}).map(function(s){return P.line(s,c,lw,dash);}).join("");
  }
  /* 目盛: 範囲 [lo, hi] に収まるきりのよい値 */
  function _w02_ticks(U,lo,hi,n){return U.nice(lo,hi,n||5).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;});}
  function _w02_range(lo,hi,pad){var d=(hi-lo)||Math.abs(hi)||1;return [lo-d*(pad||0.08),hi+d*(pad||0.08)];}
  /* 横向きのばね（ジグザグ） */
  function _w02_spring(S,x1,x2,y,n,amp,c,lw){var lead=Math.min(10,(x2-x1)*0.15),xs=x1+lead,xe=x2-lead,pts=[[x1,y],[xs,y]];
    for(var i=0;i<2*n;i++)pts.push([xs+(xe-xs)*(i+0.5)/(2*n),y+(i%2===0?amp:-amp)]);pts.push([xe,y]);pts.push([x2,y]);return S.PL(pts,c,lw);}
  /* 横向きのダンパ（筒は壁の側に固定、ピストンは台車の側） */
  function _w02_damper(S,x1,x2,y,c,lw){var cy0=x1+12,cyl=Math.max(30,Math.min(46,(x2-x1)*0.5)),px=Math.max(cy0+6,Math.min(cy0+cyl-4,x2-14));
    return S.L(x1,y,cy0,y,c,lw)+S.L(cy0,y-8,cy0+cyl,y-8,c,lw)+S.L(cy0,y+8,cy0+cyl,y+8,c,lw)+S.L(cy0,y-8,cy0,y+8,c,lw)+
      S.L(px,y-6,px,y+6,c,lw+0.8)+S.L(px,y,x2,y,c,lw);}
  function _w02_wall(S,x,y0,y1){var o=S.L(x,y0,x,y1,"muted",1.8);for(var yy=y0+4;yy<y1;yy+=9)o+=S.L(x,yy,x-7,yy+7,"muted",1);return o;}
  function _w02_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  /* 台車（箱と車輪）。(x, y) は箱の左上、車輪の下端は y + h + 8 */
  function _w02_cart(S,U,x,y,w,h,c,dash){var o=S.RECT(x,y,w,h,4,dash?"none":U.soft(c),c,1.5,dash);
    o+=S.CIRC(x+w*0.25,y+h+4,4,c,1.4,"var(--screen)",dash)+S.CIRC(x+w*0.75,y+h+4,4,c,1.4,"var(--screen)",dash);return o;}

  /* ---- 2 節: 台車とばね・ダンパ ---- */
  REG.w02_msd=function(el,U){
    var S=U.S;
    U.head(el,"CART","台車とばね・ダンパ — 動く絵・位置の波形・働く力");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"力の入れ方",["一定の力で押し続ける","短く強く押す（0.1 s だけ）","正弦波の力で揺らす","引いて離す（力は加えない）"],0,function(){run();});
    var fF=U.slider(r1,"押す力 <i>u</i>",{values:[0.5,1,2,4],value:1,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var fP=U.slider(r1,"押す力 <i>u</i>（0.1 s）",{values:[5,10,20],value:10,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var fA=U.slider(r1,"力の振幅",{values:[0.5,1,2],value:1,fmt:function(v){return v+" N";},onInput:function(){run();}});
    var fW=U.slider(r1,"力の角周波数",{values:[1,2,3,4,5,6,8,10,15],value:2,fmt:function(v){return v+" rad/s";},onInput:function(){run();}});
    var fX=U.slider(r1,"初めの位置",{values:[2,4,5,6,8],value:5,fmt:function(v){return v+" cm";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var sm=U.slider(r2,"質量 <i>m</i>",{values:[0.25,0.5,1,2,4],value:1,fmt:function(v){return v+" kg";},onInput:function(){run();}});
    var sc=U.slider(r2,"減衰係数 <i>c</i>",{values:[0,0.5,1,2,4,6,10,15,20],value:2,fmt:function(v){return v+" N·s/m";},onInput:function(){run();}});
    var sk=U.slider(r2,"ばね定数 <i>k</i>",{values:[0,5,10,25,50,100],value:25,fmt:function(v){return v+" N/m";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var st=U.slider(r3,"時刻 <i>t</i>（絵と力の矢印）",{min:0,max:6,step:0.01,value:0.64,fmt:function(v){return v.toFixed(2)+" s";},onInput:function(){tk.stop();drawFrame();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.04;if(t>=6){t=6;tk.stop();}st.set(t);drawFrame();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=5.99)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function base(m,c,k){tk.stop();mode.set(0);fF.set(1);sm.set(m);sc.set(c);sk.set(k);st.set(0.64);run();}
    U.button(br,"本文の例（1 N・1 kg・2 N·s/m・25 N/m）",function(){base(1,2,25);});
    U.button(br,"ダンパを外す（c = 0）",function(){base(1,0,25);});
    U.button(br,"ダンパを強く（c = 10）",function(){base(1,10,25);});
    U.button(br,"ばねを外す（k = 0）",function(){base(1,2,0);});
    var box=U.svgbox(el),ro=U.readout(el),sim=null,DT=0.0005,EV=2;
    function run(){
      var M=+mode.get();
      fF.el.style.display=M===0?"":"none";fP.el.style.display=M===1?"":"none";
      fA.el.style.display=M===2?"":"none";fW.el.style.display=M===2?"":"none";fX.el.style.display=M===3?"":"none";
      var m=sm.get(),c=sc.get(),k=sk.get(),uf;
      if(M===0){var F=fF.get();uf=function(){return F;};}
      else if(M===1){var Fp=fP.get();uf=function(t){return t<0.1-1e-9?Fp:0;};}
      else if(M===2){var A=fA.get(),w=fW.get();uf=function(t){return A*Math.sin(w*t);};}
      else uf=function(){return 0;};
      var f=function(t,x){return [x[1],(uf(t)-c*x[1]-k*x[0])/m];};
      var x=[M===3?fX.get()/100:0,0],n=Math.round(6/DT),Tt=[],P=[],V=[],Uu=[];
      for(var i=0;i<=n;i++){var t=i*DT;if(i%EV===0){Tt.push(t);P.push(x[0]);V.push(x[1]);Uu.push(uf(t));}x=U.ctl.rk4(f,t,x,DT);}
      sim={T:Tt,P:P,V:V,U:Uu,m:m,c:c,k:k,M:M,uf:uf};
      /* 指標 */
      var mx=-1e9,imx=0,mn=1e9,imn=0;P.forEach(function(v,i){if(v>mx){mx=v;imx=i;}if(v<mn){mn=v;imn=i;}});
      sim.mx=mx;sim.tmx=Tt[imx];sim.mn=mn;sim.tmn=Tt[imn];
      var fin=(M===0&&k>0)?fF.get()/k:(M===1||M===3)&&k>0?0:null;sim.fin=fin;
      if(M===0&&k>0){var ups=[];for(var j=1;j<P.length;j++)if(P[j-1]<fin&&P[j]>=fin)ups.push(Tt[j-1]+(Tt[j]-Tt[j-1])*(fin-P[j-1])/(P[j]-P[j-1]));
        sim.per=ups.length>=3?(ups[ups.length-1]-ups[1])/(ups.length-2):(ups.length===2?ups[1]-ups[0]:null);
        var last=-1;P.forEach(function(v,i){if(Math.abs(v-fin)>0.02*fin)last=i;});sim.settle=last<P.length-1?Tt[last+1]:null;}
      drawFrame();
    }
    function drawFrame(){
      if(!sim)return;var s=sim,nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var t=st.get(),idx=Math.max(0,Math.min(s.T.length-1,Math.round(t/(DT*EV))));
      var p=s.P[idx],v=s.V[idx],u=s.U[idx],fk=-s.k*p,fc=-s.c*v,fs=u+fk+fc;
      /* 絵 */
      var gy=nar?150:142,sx0=nar?16:30,sw=nar?370:650,cw=nar?56:72,ch=nar?34:40,x0=sx0+(nar?104:190);
      var pmax=0,pmin=0;s.P.forEach(function(q){pmax=Math.max(pmax,q);pmin=Math.min(pmin,q);});
      var right=sx0+sw-cw-x0-8,left=x0-sx0-56,sc=2500;
      if(pmax>1e-9)sc=Math.min(sc,right/pmax);if(pmin<-1e-9)sc=Math.min(sc,left/(-pmin));
      var cx=x0+p*sc,cy=gy-8-ch;
      o.push(_w02_ground(S,sx0-4,sx0+sw,gy));o.push(_w02_wall(S,sx0,gy-ch-46,gy));
      o.push(S.L(x0,gy-ch-50,x0,gy+18,"muted",1,"3 3"));o.push(S.T(x0,gy+30,"p = 0","middle",9.5,"muted"));
      if(s.k>0)o.push(_w02_spring(S,sx0,cx,cy+11,nar?6:8,6,"teal",1.6));
      if(s.c>0)o.push(_w02_damper(S,sx0,cx,cy+ch-10,"purple",1.6));
      o.push(_w02_cart(S,U,cx,cy,cw,ch,"signal"));
      o.push(_w02_m(U,cx+cw/2,cy+ch/2+4,[["m",null,true]],"middle",11,"signal",true));
      /* 力の矢印（台車の中心から） */
      var fm=1e-9;s.T.forEach(function(_,i){var pp=s.P[i],vv=s.V[i],uu=s.U[i];fm=Math.max(fm,Math.abs(uu),Math.abs(s.k*pp),Math.abs(s.c*vv),Math.abs(uu-s.k*pp-s.c*vv));});
      var fsc=(nar?62:120)/fm,ax=cx+cw/2;
      var rows=[[u,"gold","押す力 u"],[fk,"teal","ばね −kp"],[fc,"purple","ダンパ −cṗ"],[fs,"signal","和 mp̈"]];
      rows.forEach(function(r,i){var y=cy-10-i*13,L=r[0]*fsc;
        if(Math.abs(L)>2)o.push(S.ARR(ax,y,ax+L,y,r[1],2,6));else o.push(S.D(ax,y,r[1],2));
        var lab=r[2]+" "+_w02_f(r[0],2)+" N",right2=r[0]>=0,lw2=U.tw(lab,9);
        var xr2=right2?ax+Math.max(L,0)+6:ax+Math.min(L,0)-6;
        if(right2&&xr2+lw2>Wd-4){right2=false;xr2=ax-6;}else if(!right2&&xr2-lw2<4){right2=true;xr2=ax+6;}
        o.push(S.T(xr2,y+3.5,lab,right2?"start":"end",9,r[1],i===3,false,null,true));});
      if(Math.abs(cx-x0)>14){o.push(S.DARR(x0,gy+14,cx,gy+14,"signal",1.1,5));}
      /* 波形 */
      var big=Math.max(Math.abs(pmax),Math.abs(pmin))>0.5,unit=big?1:100,un=big?"m":"cm";
      var lo=Math.min(0,pmin*unit),hi=Math.max(pmax*unit,s.fin!=null?s.fin*unit:0);var rr=_w02_range(lo,hi,0.1);
      var py0=gy+44,P=U.plot(nar?48:62,py0,nar?336:610,nar?120:130,[0,6],rr);
      o.push(P.axes({xl:null,yl:"位置 p ["+un+"]",xt:[0,1,2,3,4,5,6],yt:_w02_ticks(U,rr[0],rr[1],4),xfmt:function(q){return String(q);},yfmt:function(q){return _w02_sig(q,3);},ylOff:nar?34:40}));
      if(s.fin!=null&&s.M===0)o.push(P.line([[0,s.fin*unit],[6,s.fin*unit]],"muted",1.1,"4 3"));
      o.push(_w02_cl(P,s.T.map(function(q,i){return [q,s.P[i]*unit];}),"signal",2));
      o.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"gold",1.2,"3 3"));o.push(S.D(P.X(t),P.Y(p*unit),"signal",4));
      /* 入力の帯 */
      var uy=P.y+P.h+22,um=1e-9;s.U.forEach(function(q){um=Math.max(um,Math.abs(q));});
      var Q=U.plot(P.x,uy,P.w,22,[0,6],[-um*1.1,um*1.1]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,2,"var(--screen)","line",0.8));o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"faint",0.8));
      o.push(Q.line(s.T.filter(function(_,i){return i%4===0;}).map(function(q,i){return [q,s.U[i*4]];}),"gold",1.4));
      o.push(S.T(Q.x-6,Q.y+15,"u","end",10,"gold",true));
      o.push(S.T(Q.x+Q.w,Q.y+Q.h+15,"時間 t [s]","end",9.5,"muted"));
      box.set(S.svg(Wd,Q.y+Q.h+22,o));
      /* 読み出し */
      var h="",cm=function(q){return _w02_f(q*100,2)+" cm";};
      h+="時刻 "+_w02_f(t,2)+" s: 位置 <b>"+cm(p)+"</b>、速度 "+_w02_f(v,3)+" m/s。力: 押す力 "+_w02_f(u,2)+" N、ばね −<i>kp</i> = "+_w02_f(fk,2)+" N、ダンパ −<i>c</i>ṗ = "+_w02_f(fc,2)+" N → 和 <i>m</i>p̈ = <b>"+_w02_f(fs,2)+" N</b><br>";
      if(s.M===0){
        if(s.k>0){h+="落ち着く位置 <i>u</i>/<i>k</i> = <b>"+cm(s.fin)+"</b>、最大 <b>"+cm(s.mx)+"</b>（"+_w02_f(s.tmx,2)+" s）";
          if(s.mx>s.fin*1.0005)h+="、行き過ぎ "+cm(s.mx-s.fin);
          h+="<br>";
          h+=(s.per?"揺れの周期（落ち着く位置を上向きに横切る間隔）: <b>"+_w02_f(s.per,2)+" s</b>、":"揺れずに近づく、")+
            (s.settle!=null?"落ち着く位置の ±2 % に入ったまま: <b>"+_w02_f(s.settle,2)+" s</b> 以降":'<span class="warn">6 s までに ±2 % に収まらない</span>')+"<br>";}
        else h+='<span class="warn">ばねが無いので戻す力が無く、止まらない</span>（'+(s.c>0?"速度は <i>u</i>/<i>c</i> = "+_w02_f(fF.get()/s.c,2)+" m/s に近づく":"ダンパも無いので、速度は増え続ける")+"）<br>";
      }else if(s.M===1){h+="最大 "+cm(s.mx)+"（"+_w02_f(s.tmx,2)+" s）"+(s.k>0?"、その後は 0 へ戻る":"。ばねが無いので元の位置に戻らない（"+cm(s.P[s.P.length-1])+" で止まる）")+"<br>";}
      else if(s.M===2){var tail=s.P.slice(Math.floor(s.P.length*0.6)),a=0;tail.forEach(function(q){a=Math.max(a,Math.abs(q));});h+="4〜6 s の位置の振れ幅: 約 "+cm(a)+"（力の振幅 "+fA.get()+" N、角周波数 "+fW.get()+" rad/s）<br>";}
      else{h+="最小 "+cm(s.mn)+"（"+_w02_f(s.tmn,2)+" s）"+(s.k>0?"":"。ばねが無いので動かない")+"<br>";}
      ro.innerHTML=h+'<div class="wnote">式 mp̈ + cṗ + kp = u を 4 次のルンゲ・クッタ法（刻み 0.5 ms）で解いた。台車の上の矢印は、その時刻に台車に働く力（右向きが正）で、長さは力に比例する。位置の目盛は大きさに合わせて変わる。</div>';
    }
    run();
  };

  /* ---- 3 節: DC モータ ---- */
  REG.w02_motor=function(el,U){
    var S=U.S,MM=U.ctl.mat;
    U.head(el,"DC MOTOR","DC モータに電圧を加える — <i>L</i><sub>a</sub> を含む式と、無視した一次の式");
    var r1=U.ctrls(el);
    var sv=U.slider(r1,"電圧 <i>v</i>",{values:[3,6,9,12],value:12,fmt:function(v){return v+" V";},onInput:draw});
    var sl=U.slider(r1,"インダクタンス L<sub>a</sub>",{values:[0.1,0.2,0.5,1,2,5,10,20,50],value:1,fmt:function(v){return v+" mH";},onInput:draw});
    var sr=U.slider(r1,"抵抗 R<sub>a</sub>",{values:[0.5,1,2,4,8],value:2,fmt:function(v){return v+" Ω";},onInput:draw});
    var r2=U.ctrls(el);
    var sj=U.slider(r2,"慣性モーメント <i>J</i>",{values:[0.25,0.5,1,2,4],value:1,fmt:function(v){return v+" × 10⁻⁵ kg·m²";},onInput:draw});
    var sk=U.slider(r2,"トルク定数 K<sub>t</sub>",{values:[0.01,0.015,0.02,0.03,0.04],value:0.02,fmt:function(v){return v+" N·m/A";},onInput:draw});
    var st=U.slider(r2,"途中で加える負荷トルク τ<sub>L</sub>",{values:[0,0.005,0.01,0.02],value:0.01,fmt:function(v){return v+" N·m";},onInput:draw});
    var r3=U.ctrls(el);
    var vw=U.select(r3,"表示する時間",["全体（負荷を加える前後）","始めの数 ms を拡大"],0,draw);
    var ap=U.checkbox(r3,"L<sub>a</sub> を無視した一次の式を重ねる（破線）",true,draw);
    var br=U.btnrow(el);
    function set(La){sv.set(12);sl.set(La);sr.set(2);sj.set(1);sk.set(0.02);st.set(0.01);vw.set(0);ap.set(true);draw();}
    U.button(br,"本文の例（L<sub>a</sub> 1 mH）",function(){set(1);});
    U.button(br,"L<sub>a</sub> を 10 倍（10 mH）",function(){set(10);});
    U.button(br,"L<sub>a</sub> を 50 倍（50 mH）",function(){set(50);});
    var box=U.svgbox(el),ro=U.readout(el);
    function sim(p,tEnd,n,tL0){
      var A=[[-p.Ra/p.La,-p.Kt/p.La],[p.Kt/p.J,0]],B=[[1/p.La,0],[0,-1/p.J]],h=tEnd/n,d=MM.c2d(A,B,h);
      var x=[[0],[0]],T=[],I=[],Wf=[],Wa=[],Ia=[],Tm=p.J*p.Ra/(p.Kt*p.Kt),ea=Math.exp(-h/Tm),wa=0,kL=Math.round(tL0/h);
      for(var k=0;k<=n;k++){var tau=k>=kL?p.tl:0;
        T.push(k*h);I.push(x[0][0]);Wf.push(x[1][0]);Wa.push(wa);Ia.push((p.v-p.Kt*wa)/p.Ra);
        x=MM.add(MM.mul(d.A,x),MM.mul(d.B,[[p.v],[tau]]));
        var wss=p.v/p.Kt-p.Ra/(p.Kt*p.Kt)*tau;wa=wss+(wa-wss)*ea;}
      return {T:T,I:I,W:Wf,Wa:Wa,Ia:Ia};
    }
    function niceUp(v){var e=Math.pow(10,Math.floor(Math.log10(v)+1e-9)),m=v/e*(1-1e-9);return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=3?3:m<=5?5:10)*e;}
    function draw(){
      var p={v:sv.get(),La:sl.get()*1e-3,Ra:sr.get(),J:sj.get()*1e-5,Kt:sk.get(),tl:st.get()};
      var Tm=p.J*p.Ra/(p.Kt*p.Kt),K=1/p.Kt,KL=p.Ra/(p.Kt*p.Kt),te=p.La/p.Ra;
      var tEnd=Math.max(0.3,niceUp(6*Tm)),tL0=tEnd/2,R=sim(p,tEnd,6000,tL0);
      var tz=Math.max(0.01,niceUp(8*te)),Z=sim(p,tz,4000,1e9);
      var zoom=vw.get()===1,D=zoom?Z:R,te2=zoom?tz:tEnd,sx=zoom?1e3:1,tu=zoom?"ms":"s";
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],x0=nar?50:66,w=nar?334:604;
      var wmax=0;R.W.concat(R.Wa).forEach(function(q){wmax=Math.max(wmax,q);});
      var imin=0,imax=0;D.I.concat(ap.get()?D.Ia:[]).forEach(function(q){imin=Math.min(imin,q);imax=Math.max(imax,q);});
      var Pw=U.plot(x0,22,w,nar?120:130,[0,te2*sx],[0,wmax*1.12]);
      o.push(_w02_m(U,nar?8:14,14,[["角速度 ",null,false],["ω","m",true]],"start",10.5,"ink",true));
      o.push(Pw.axes({xl:null,yl:"[rad/s]",xt:_w02_ticks(U,0,te2*sx,5),yt:_w02_ticks(U,0,wmax*1.12,4),xfmt:function(q){return _w02_sig(q,3);},ylOff:nar?36:44}));
      if(!zoom&&p.tl>0){o.push(S.L(Pw.X(tL0),Pw.y,Pw.X(tL0),Pw.y+Pw.h,"purple",1,"3 3"));o.push(S.T(Pw.X(tL0)+4,Pw.y+Pw.h-6,"負荷 "+p.tl+" N·m","start",9,"purple",true,false,null,true));}
      o.push(Pw.line(D.T.map(function(q,i){return [q*sx,D.W[i]];}),"signal",2.2));
      if(ap.get())o.push(Pw.line(D.T.map(function(q,i){return [q*sx,D.Wa[i]];}),"muted",1.6,"6 4"));
      var Pi=U.plot(x0,Pw.y+Pw.h+40,w,nar?110:120,[0,te2*sx],[Math.min(0,imin*1.1),imax*1.12+1e-9]);
      o.push(S.T(nar?8:14,Pi.y-8,"電流 i","start",10.5,"ink",true));
      o.push(Pi.axes({xl:"時間 t ["+tu+"]",yl:"[A]",xt:_w02_ticks(U,0,te2*sx,5),yt:_w02_ticks(U,Pi.yr[0],Pi.yr[1],4),xfmt:function(q){return _w02_sig(q,3);},ylOff:nar?36:44}));
      o.push(Pi.line(D.T.map(function(q,i){return [q*sx,D.I[i]];}),"teal",2.2));
      if(ap.get())o.push(Pi.line(D.T.map(function(q,i){return [q*sx,D.Ia[i]];}),"muted",1.6,"6 4"));
      o.push(_w02_m(U,Pi.x,Pi.y+Pi.h+46,[["実線: ",null,false],["L","a",true],[" を含む式　破線: ",null,false],["L","a",true],[" を無視した一次の式",null,false]],"start",9.5,"muted"));
      box.set(S.svg(Wd,Pi.y+Pi.h+54,o));
      /* 読み出し */
      var k1=0;Z.I.forEach(function(q,i){if(q>Z.I[k1])k1=i;});
      var dw=0;R.T.forEach(function(q,i){dw=Math.max(dw,Math.abs(R.W[i]-R.Wa[i]));});
      var iT=Math.round(Tm/tEnd*6000),wT=R.W[Math.min(iT,6000)],waT=R.Wa[Math.min(iT,6000)];
      var wss0=K*p.v,wss1=K*p.v-KL*p.tl,ov=0;R.W.forEach(function(q,i){if(R.T[i]<tL0)ov=Math.max(ov,q-wss0);});
      var h="";
      h+="<i>T</i> = <i>JR</i><sub>a</sub>/<i>K</i><sub>t</sub>² = <b>"+_w02_sig(Tm,3)+" s</b>、<i>K</i> = 1/<i>K</i><sub>t</sub> = <b>"+_w02_sig(K,3)+" (rad/s)/V</b>、電流の変わる時間 <i>L</i><sub>a</sub>/<i>R</i><sub>a</sub> = "+_w02_sig(te*1e3,3)+" ms（<i>T</i> の 1/"+_w02_sig(Tm/te,3)+"）<br>";
      h+="落ち着く角速度（一次の式 <i>Kv</i> − (<i>R</i><sub>a</sub>/<i>K</i><sub>t</sub>²)τ<sub>L</sub>）: 負荷なし <b>"+_w02_sig(wss0,4)+" rad/s</b>"+(p.tl>0?"、負荷 "+p.tl+" N·m で <b>"+_w02_sig(wss1,4)+" rad/s</b>（"+_w02_sig(tL0,3)+" s に加える。電流は τ<sub>L</sub>/<i>K</i><sub>t</sub> = "+_w02_sig(p.tl/p.Kt,3)+" A）":"")+"<br>";
      h+="時刻 <i>T</i>（"+_w02_sig(Tm,3)+" s）の角速度: <i>L</i><sub>a</sub> を含む式 "+_w02_sig(wT,4)+" rad/s、一次の式 "+_w02_sig(waT,4)+" rad/s。2 つの式の差は最大 <b>"+_w02_sig(dw,3)+" rad/s</b>（"+_w02_sig(dw/wss0*100,2)+" %）<br>";
      h+="電流の最大: <i>L</i><sub>a</sub> を含む式 <b>"+_w02_sig(Z.I[k1],3)+" A</b>（"+_w02_sig(Z.T[k1]*1e3,3)+" ms）、一次の式 "+_w02_sig(p.v/p.Ra,3)+" A（0 s。<i>v</i>/<i>R</i><sub>a</sub>）<br>";
      if(te>Tm/10)h+='<span class="warn">電流の変わる時間 <i>L</i><sub>a</sub>/<i>R</i><sub>a</sub> が <i>T</i> の 1/10 を超え、一次の式は合わなくなる</span><br>';
      if(ov>wss0*0.002)h+='<span class="warn">角速度が、落ち着く値を一度 '+_w02_sig(ov,3)+' rad/s 超えてから戻る（<i>L</i><sub>a</sub> が大きく、2 階の式の揺れが現れる）</span><br>';
      ro.innerHTML=h+'<div class="wnote"><i>L</i><sub>a</sub> を含む式は 2 つの 1 階の式（電気と機械）、一次の式は <i>L</i><sub>a</sub> d<i>i</i>/d<i>t</i> を 0 とみなした式。どちらも、入力が一定の間を厳密に進める方法で計算した。負荷トルクは、表示する時間の中ほどで加える。</div>';
    }
    draw();
  };

  /* ---- 5 節: 線形化 ---- */
  REG.w02_linear=function(el,U){
    var S=U.S,g=9.81;
    U.head(el,"LINEARIZE","元の式と線形化した式 — 振れ幅を変えて比べる");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",["水槽（動作点 25 cm・0.2 L/s から流入を変える）","振子（真下のまわりで静かに放す）","台車に立てた振子（真上から力を加えずに放す）"],0,function(){tk.stop();st.set(0.5);run();});
    var aT=U.slider(r1,"流入の変化 δ<i>u</i>",{values:[-100,-50,-20,-10,10,20,50,100],value:10,fmt:function(v){return (v>0?"+":"−")+Math.abs(v)+" %（"+(v>0?"+":"−")+_w02_f(Math.abs(v)*0.002,3)+" L/s）";},onInput:function(){run();}});
    var aP=U.slider(r1,"振れ幅",{values:[5,10,20,30,45,60,90,120,150,170],value:10,fmt:function(v){return v+"°";},onInput:function(){run();}});
    var aI=U.slider(r1,"初めの傾き",{values:[0.5,1,2,5,10,20,30],value:1,fmt:function(v){return v+"°";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var st=U.slider(r2,"時刻（絵）",{min:0,max:1,step:0.002,value:0.5,fmt:function(v){return R?_w02_sig(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();drawFrame();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+(R&&R.kind===0?0.0025:0.004);if(v>=1){v=1;tk.stop();}st.set(v);drawFrame();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pick(o2,a,v){tk.stop();ob.set(o2);a.set(v);st.set(o2===0?0.5:0.5);run();}
    U.button(br,"本文の例（水槽 +10 %）",function(){pick(0,aT,10);});
    U.button(br,"水槽 +50 %",function(){pick(0,aT,50);});
    U.button(br,"ポンプを止める（−100 %）",function(){pick(0,aT,-100);});
    U.button(br,"振子 10°",function(){pick(1,aP,10);});
    U.button(br,"振子 90°",function(){pick(1,aP,90);});
    U.button(br,"台車の振子 1°",function(){pick(2,aI,1);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var K=+ob.get();aT.el.style.display=K===0?"":"none";aP.el.style.display=K===1?"":"none";aI.el.style.display=K===2?"":"none";
      var T=[],N=[],L=[],PN=[],PL=[],i,t;
      if(K===0){var At=0.02,a=4e-4,h0=0.25,u0=2e-4,du=u0*aT.get()/100,u=u0+du,Tl=2*At*Math.sqrt(h0)/a,Kl=2*Math.sqrt(h0)/a,dt=0.02,tEnd=200,h=h0;
        var f=function(tt,x){var hh=Math.max(x[0],0);return [(hh<=0&&u<=0)?0:(u-a*Math.sqrt(hh))/At];};
        for(i=0;i<=tEnd/dt;i++){t=i*dt;if(i%10===0){T.push(t);N.push(h*100);L.push((h0+Kl*du*(1-Math.exp(-t/Tl)))*100);}h=Math.max(0,U.ctl.rk4(f,t,[h],dt)[0]);}
        R={kind:0,tEnd:tEnd,T:T,N:N,L:L,du:du,fn:Math.pow(u/a,2)*100,fl:(h0+Kl*du)*100,Tl:Tl};
        var te=null;for(i=1;i<N.length;i++)if(N[i]<=1e-6&&te===null)te=T[i];R.empty=te;
        var tz=null;for(i=1;i<L.length;i++)if(L[i]<0&&tz===null)tz=T[i-1]+(T[i]-T[i-1])*L[i-1]/(L[i-1]-L[i]);R.neg=tz;}
      else if(K===1){var l=0.3,w0=Math.sqrt(g/l),A=aP.get()*Math.PI/180,dt1=0.0005,tE=4,x=[Math.PI+A,0];
        var f1=function(tt,xx){return [xx[1],g/l*Math.sin(xx[0])];};
        for(i=0;i<=tE/dt1;i++){t=i*dt1;if(i%8===0){T.push(t);N.push((x[0]-Math.PI)*180/Math.PI);L.push(A*Math.cos(w0*t)*180/Math.PI);}x=U.ctl.rk4(f1,t,x,dt1);}
        var cr=[];for(i=1;i<N.length;i++)if(N[i-1]>0&&N[i]<=0)cr.push(T[i-1]+(T[i]-T[i-1])*N[i-1]/(N[i-1]-N[i]));
        var per=cr.length>=2?(cr[cr.length-1]-cr[0])/(cr.length-1):null,md=0;N.forEach(function(q,j){md=Math.max(md,Math.abs(q-L[j]));});
        R={kind:1,tEnd:tE,T:T,N:N,L:L,A:aP.get(),per:per,per0:2*Math.PI/w0,md:md};}
      else{var M=0.5,m=0.2,l2=0.3,ph0=aI.get()*Math.PI/180,dt2=0.0005,tE2=1.0,xn=[0,0,ph0,0],xl=[0,0,ph0,0];
        var fn=function(tt,q){var s=Math.sin(q[2]),c=Math.cos(q[2]),a11=M+m,a12=m*l2*c,a21=c,a22=l2,b1=m*l2*s*q[3]*q[3],b2=g*s,det=a11*a22-a12*a21;
          return [q[1],(b1*a22-a12*b2)/det,q[3],(a11*b2-a21*b1)/det];};
        var fl=function(tt,q){return [q[1],-3.924*q[2],q[3],45.78*q[2]];};
        for(i=0;i<=tE2/dt2;i++){t=i*dt2;if(i%4===0){T.push(t);N.push(xn[2]*180/Math.PI);L.push(xl[2]*180/Math.PI);PN.push(xn[0]);PL.push(xl[0]);}
          if(Math.abs(xn[2])<2)xn=U.ctl.rk4(fn,t,xn,dt2);if(Math.abs(xl[2])<3)xl=U.ctl.rk4(fl,t,xl,dt2);}
        function cross(arr,deg){for(var j=0;j<arr.length;j++)if(Math.abs(arr[j])>=deg)return T[j];return null;}
        var k5=null;for(i=0;i<N.length;i++)if(Math.abs(N[i]-L[i])>0.05*Math.abs(L[i])){k5=i;break;}
        R={kind:2,tEnd:tE2,T:T,N:N,L:L,PN:PN,PL:PL,A:aI.get(),t10n:cross(N,10),t10l:cross(L,10),t30n:cross(N,30),t30l:cross(L,30),k5:k5};}
      drawFrame();
    }
    function drawFrame(){
      if(!R)return;var nar=_w02_nar(box),Wd=nar?400:700,o=[],k=Math.min(R.T.length-1,Math.round(st.get()*(R.T.length-1))),tc=R.T[k];
      /* 絵 */
      var pw=nar?380:250,px0=nar?10:10,py0=10,ph=nar?170:200;
      if(R.kind===0){var tx0=px0+(nar?120:70),tw2=120,tb=py0+ph-14,tt2=py0+20,sc=(tb-tt2)/110;
        var hn=R.N[k],hl=R.L[k];
        o.push(S.RECT(tx0,tb-Math.max(0,hn)*sc,tw2,Math.max(0,hn)*sc,0,U.soft("signal"),"none",0));
        o.push(S.W([tx0,tt2,tx0,tb,tx0+tw2,tb,tx0+tw2,tt2],"ink",2));
        o.push(S.L(tx0,tb-hn*sc,tx0+tw2,tb-hn*sc,"signal",1.6));
        var yl=tb-hl*sc;if(hl>=0)o.push(S.L(tx0-10,yl,tx0+tw2+10,yl,"muted",1.6,"6 4"));
        else{o.push(S.L(tx0-10,tb+6,tx0+tw2+10,tb+6,"alias",1.6,"6 4"));o.push(S.T(tx0+tw2/2,tb-8,"線形化: "+_w02_f(hl,1)+" cm","middle",9.5,"alias",true,false,null,true));}
        o.push(S.T(tx0+tw2+14,tb-hn*sc+4,"元 "+_w02_f(hn,1)+" cm","start",9.5,"signal",true,false,null,true));
        if(hl>=0)o.push(S.T(tx0-14,yl+4,"線形化 "+_w02_f(hl,1),"end",9.5,"muted",true,false,null,true));
        o.push(S.L(tx0+2,tb-25*sc,tx0+tw2-2,tb-25*sc,"gold",1.2,"2 3"));o.push(S.T(tx0+tw2/2,tt2-6,"金色の点線: 動作点 25 cm","middle",9,"gold"));}
      else if(R.kind===1){var cx=px0+pw/2,cy=py0+26,Lr=nar?110:120;
        o.push(S.L(cx-34,cy,cx+34,cy,"muted",2));o.push(S.L(cx,cy,cx,cy+Lr+14,"faint",1,"4 3"));
        [[R.L[k],"muted",true],[R.N[k],"signal",false]].forEach(function(q){var a=q[0]*Math.PI/180,bx=cx+Lr*Math.sin(a),by=cy+Lr*Math.cos(a);
          o.push(S.L(cx,cy,bx,by,q[1],q[2]?1.6:2.4,q[2]?"6 4":null));o.push(S.CIRC(bx,by,9,q[1],1.6,q[2]?"none":U.soft("signal"),q[2]?"4 3":null));});
        o.push(S.D(cx,cy,"ink",3.4));}
      else{var gx=px0,gy=py0+ph-8,sc2=nar?220:200,cx2=px0+pw/2,cw=60,Lr2=nar?100:110;
        o.push(_w02_ground(S,gx,gx+pw,gy));
        [[R.PL[k],R.L[k],"muted",true],[R.PN[k],R.N[k],"signal",false]].forEach(function(q){var x=cx2+q[0]*sc2,a=Math.min(Math.abs(q[1]),90)*Math.sign(q[1])*Math.PI/180;
          o.push(_w02_cart(S,U,x-cw/2,gy-32,cw,24,q[2],q[3]?"4 3":null));
          var bx=x+Lr2*Math.sin(a),by=gy-32-Lr2*Math.cos(a);o.push(S.L(x,gy-32,bx,by,q[2],q[3]?1.6:2.4,q[3]?"6 4":null));
          o.push(S.CIRC(bx,by,8,q[2],1.6,q[3]?"none":U.soft("signal"),q[3]?"4 3":null));});
        o.push(S.L(cx2,gy-32,cx2,gy-32-Lr2-14,"faint",1,"4 3"));}
      o.push(S.T(px0+6,py0+ph+8,"実線: 元の式　破線: 線形化した式","start",9.5,"muted"));
      /* 波形 */
      var qx=nar?50:330,qy=nar?py0+ph+34:22,qw=nar?334:350,qh=nar?140:170;
      var lo,hi,ylab,xt;
      if(R.kind===0){lo=Math.min(0,Math.min.apply(null,R.L.concat(R.N)));hi=Math.max.apply(null,R.L.concat(R.N));var r=_w02_range(lo,hi,0.1);lo=r[0];hi=r[1];ylab="水位 h [cm]";xt=[0,50,100,150,200];}
      else if(R.kind===1){hi=R.A*1.15;lo=-hi;ylab="振れの角 [°]";xt=[0,1,2,3,4];}
      else{lo=0;hi=90;ylab="傾き φ [°]";xt=[0,0.2,0.4,0.6,0.8,1.0];}
      var P=U.plot(qx,qy,qw,qh,[0,R.tEnd],[lo,hi]);
      if(R.kind===0&&lo<0)o.push(S.RECT(P.x,P.Y(0),P.w,P.Y(lo)-P.Y(0),0,U.soft("alias"),"none",0));
      o.push(P.axes({xl:"時間 t [s]",yl:ylab,xt:xt,yt:_w02_ticks(U,lo,hi,4),xfmt:function(q){return _w02_sig(q,3);},yfmt:function(q){return _w02_sig(q,3);},ylOff:nar?34:40}));
      o.push(_w02_cl(P,R.T.map(function(q,i){return [q,R.N[i]];}),"signal",2.2));
      o.push(_w02_cl(P,R.T.map(function(q,i){return [q,R.L[i]];}),"muted",1.7,"6 4"));
      if(R.kind===2&&R.k5!=null)o.push(S.D(P.X(R.T[R.k5]),P.Y(Math.min(90,Math.abs(R.N[R.k5]))),"alias",3.6));
      o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"gold",1.2,"3 3"));
      box.set(S.svg(Wd,nar?P.y+P.h+40:Math.max(py0+ph+16,P.y+P.h+40),o));
      /* 読み出し */
      var h="時刻 "+_w02_sig(tc,3)+" s: 元の式 "+_w02_f(R.N[k],2)+(R.kind===0?" cm":"°")+"、線形化した式 "+_w02_f(R.L[k],2)+(R.kind===0?" cm":"°")+"<br>";
      if(R.kind===0){var dn=R.fn-25,dl=R.fl-25;
        h+="落ち着く水位: 元の式 <b>"+_w02_f(R.fn,2)+" cm</b>（"+(dn>=0?"+":"")+_w02_f(dn,2)+" cm）、線形化した式 <b>"+_w02_f(R.fl,2)+" cm</b>（"+(dl>=0?"+":"")+_w02_f(dl,2)+" cm）";
        if(Math.abs(dn)>1e-9)h+="、変化の差 "+_w02_sig(Math.abs(dl-dn)/Math.abs(dn)*100,2)+" %";h+="<br>";
        if(R.empty!=null)h+='元の式では <b>'+_w02_sig(R.empty,3)+' s</b> で空になる。';
        if(R.neg!=null)h+='<span class="warn">線形化した式は '+_w02_sig(R.neg,3)+' s で水位が 0 を下回る（あり得ない）</span>';
        if(R.empty!=null||R.neg!=null)h+="<br>";
        h+="線形化した式: <i>T</i> = 2<i>A</i><sub>t</sub>√<i>h</i><sub>0</sub>/<i>a</i> = "+_w02_sig(R.Tl,3)+" s、<i>K</i> = 2√<i>h</i><sub>0</sub>/<i>a</i> = 2500 s/m²（0.01 L/s で 2.5 cm）<br>";}
      else if(R.kind===1){h+="周期: 元の式 <b>"+(R.per?_w02_sig(R.per,4)+" s":"—")+"</b>、線形化した式 <b>"+_w02_sig(R.per0,4)+" s</b>"+(R.per?"（差 "+_w02_sig((R.per/R.per0-1)*100,2)+" %）":"")+"<br>";
        h+="0〜4 s での 2 つの式の角度の差: 最大 <b>"+_w02_sig(R.md,3)+"°</b>"+(R.md>R.A*0.2?' <span class="warn">線形化した式は合わない</span>':"")+"<br>";}
      else{h+="10° に達する時刻: 元の式 "+(R.t10n!=null?_w02_sig(R.t10n,3)+" s":"—")+"、線形化した式 "+(R.t10l!=null?_w02_sig(R.t10l,3)+" s":"—")+"<br>";
        h+="30° に達する時刻: 元の式 <b>"+(R.t30n!=null?_w02_sig(R.t30n,3)+" s":"—")+"</b>、線形化した式 <b>"+(R.t30l!=null?_w02_sig(R.t30l,3)+" s":"—")+"</b><br>";
        if(R.k5!=null)h+="2 つの式の角度の差が 5 % を超えるのは "+_w02_sig(R.T[R.k5],3)+" s（線形化した式 "+_w02_sig(R.L[R.k5],3)+"°、元の式 "+_w02_sig(R.N[R.k5],3)+"°。赤い点）<br>";}
      ro.innerHTML=h+'<div class="wnote">元の式（水槽 <i>A</i><sub>t</sub>ḣ = <i>u</i> − <i>a</i>√<i>h</i>、振子 <i>l</i> d²φ/d<i>t</i>² = <i>g</i> sin φ、台車の振子は 17 章で導く元の式）を 4 次のルンゲ・クッタ法で解いた。線形化した式は 5 節の式。振子の長さは 0.3 m。</div>';
    }
    run();
  };

  /* ---- 6 節: オイラー法とルンゲ・クッタ法 ---- */
  REG.w02_euler=function(el,U){
    var S=U.S,MM=U.ctl.mat;
    U.head(el,"EULER","オイラー法とルンゲ・クッタ法 — 刻み幅を変える");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",["モータの一次の式（T = 0.05 s、12 V）","温度の板（T = 500 s、80 W）","台車とばね・ダンパ（1 N で押す）","La を含むモータ（電流）"],0,draw);
    var me=U.select(r1,"計算の方法",["オイラー法","ルンゲ・クッタ法（4 次）","両方を重ねる"],0,draw);
    var r2=U.ctrls(el);
    var d1=U.slider(r2,"刻み幅 Δ<i>t</i>",{values:[1,2,5,10,20,25,40,50,60,75,90,100,105,110,125,140],value:10,fmt:function(v){return v+" ms（"+_w02_sig(v/50,3)+"T）";},onInput:draw});
    var d4=U.slider(r2,"刻み幅 Δ<i>t</i>",{values:[10,25,50,100,200,250,400,500,600,750,900,1000,1050,1100,1250],value:100,fmt:function(v){return v+" s（"+_w02_sig(v/500,3)+"T）";},onInput:draw});
    var d2=U.slider(r2,"刻み幅 Δ<i>t</i>",{values:[0.005,0.01,0.02,0.04,0.05,0.07,0.08,0.09,0.1,0.15,0.2,0.3,0.4,0.5,0.6],value:0.05,fmt:function(v){return v+" s";},onInput:draw});
    var d3=U.slider(r2,"刻み幅 Δ<i>t</i>",{values:[0.05,0.1,0.2,0.5,0.8,0.9,1.0,1.01,1.02,1.05,1.2,1.4,1.45,1.6],value:0.5,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.btnrow(el);
    function pick(o2,m2,sl,v){ob.set(o2);me.set(m2);sl.set(v);draw();}
    U.button(br,"本文の例（10 ms）",function(){pick(0,0,d1,10);});
    U.button(br,"75 ms（1.5T）",function(){pick(0,0,d1,75);});
    U.button(br,"100 ms（2T）",function(){pick(0,0,d1,100);});
    U.button(br,"110 ms（2.2T）",function(){pick(0,0,d1,110);});
    U.button(br,"温度の板を 100 s で",function(){pick(1,0,d4,100);});
    U.button(br,"台車を 0.09 s で",function(){pick(2,2,d2,0.09);});
    U.button(br,"L<sub>a</sub> を含むモータを 1.02 ms で",function(){pick(3,0,d3,1.02);});
    var box=U.svgbox(el),ro=U.readout(el);
    function rk4f(f,t,x,h){return U.ctl.rk4(f,t,x,h);}
    function euler(f,t,x,h){var d=f(t,x);return x.map(function(v,i){return v+h*d[i];});}
    function steps(f,x0,h,tEnd,step,out){var x=x0.slice(),pts=[[0,out(x)]],n=Math.round(tEnd/h+1e-9);
      for(var k=0;k<n;k++){x=step(f,k*h,x,h);if(!isFinite(x[0])||Math.abs(x[0])>1e12)break;pts.push([(k+1)*h,out(x)]);}return pts;}
    function rkR(z){return 1+z+z*z/2+z*z*z/6+z*z*z*z/24;}
    function rkLimit(lams){/* すべての固有値で |R(λΔt)| ≤ 1 となる最大の Δt（二分法） */
      function ok(h){return lams.every(function(l){var z={re:l.re*h,im:l.im*h},C=U.ctl.cx,s=C.c(1,0),zz=C.c(1,0),f=1;
        for(var k=1;k<=4;k++){zz=C.mul(zz,z);f*=k;s=C.add(s,C.scale(zz,1/f));}return C.abs(s)<=1+1e-12;});}
      var lo=0,hi=10;while(ok(hi)&&hi<1e3)hi*=2;for(var i=0;i<60;i++){var m=(lo+hi)/2;if(ok(m))lo=m;else hi=m;}return lo;}
    function draw(){
      var K=+ob.get(),M=+me.get();d1.el.style.display=K===0?"":"none";d4.el.style.display=K===1?"":"none";d2.el.style.display=K===2?"":"none";d3.el.style.display=K===3?"":"none";
      var f,x0,tEnd,out,ex,h,yl,lams,unit,T1=null,y0=0,yf=0,ts=1000,tsu=" ms";
      if(K===0){T1=0.05;y0=0;yf=600;tEnd=0.5;h=d1.get()/1000;yl="角速度 [rad/s]";unit=" rad/s";}
      if(K===1){T1=500;y0=25;yf=125;tEnd=5000;h=d4.get();yl="板の温度 [°C]";unit=" K";ts=1;tsu=" s";}
      if(T1!==null){(function(Tq,a0,af){f=function(t,x){return [(af-x[0])/Tq];};x0=[a0];out=function(x){return x[0];};
        ex=[];for(var i=0;i<=500;i++){var t=i*tEnd/500;ex.push([t,af+(a0-af)*Math.exp(-t/Tq)]);}lams=[{re:-1/Tq,im:0}];})(T1,y0,yf);}
      else if(K===2){var m=1,c=2,k=25;f=function(t,x){return [x[1],(1-c*x[1]-k*x[0])/m];};x0=[0,0];tEnd=5;out=function(x){return x[0]*100;};h=d2.get();yl="位置 p [cm]";unit=" cm";
        ex=[];var xe=[0,0],dte=0.0005;for(var j=0;j<=tEnd/dte;j++){if(j%10===0)ex.push([j*dte,xe[0]*100]);xe=rk4f(f,j*dte,xe,dte);}
        lams=MM.eig([[0,1],[-k/m,-c/m]]);}
      else{var Ra=2,La=1e-3,Kt=0.02,J=1e-5;f=function(t,x){return [(12-Ra*x[0]-Kt*x[1])/La,Kt*x[0]/J];};x0=[0,0];tEnd=0.3;out=function(x){return x[0];};h=d3.get()/1000;yl="電流 i [A]";unit=" A";
        var A=[[-Ra/La,-Kt/La],[Kt/J,0]],B=[[1/La],[0]],dd=MM.c2d(A,B,tEnd/30000),xx=[[0],[0]];ex=[];
        for(var q=0;q<=30000;q++){ex.push([q*tEnd/30000,xx[0][0]]);var a0=xx[0][0],a1=xx[1][0];xx=[[dd.A[0][0]*a0+dd.A[0][1]*a1+dd.B[0][0]*12],[dd.A[1][0]*a0+dd.A[1][1]*a1+dd.B[1][0]*12]];}
        lams=MM.eig(A);}
      var eu=(M!==1)?steps(f,x0,h,tEnd,euler,out):null,rk=(M!==0)?steps(f,x0,h,tEnd,rk4f,out):null;
      /* 範囲 */
      var lo=Infinity,hi=-Infinity;ex.forEach(function(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);});
      var span=hi-lo,cap=[lo-1.5*span,hi+1.5*span];
      [eu,rk].forEach(function(a){if(a)a.forEach(function(p){lo=Math.min(lo,Math.max(cap[0],p[1]));hi=Math.max(hi,Math.min(cap[1],p[1]));});});
      var rr=_w02_range(lo,hi,0.06),nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:66,18,nar?332:604,nar?190:230,[0,tEnd],rr);
      o.push(P.axes({xl:"時間 t [s]",yl:yl,xt:_w02_ticks(U,0,tEnd,5),yt:_w02_ticks(U,rr[0],rr[1],5),xfmt:function(v){return _w02_sig(v,3);},yfmt:function(v){return _w02_sig(v,3);},ylOff:nar?36:44}));
      var exd=ex.length>1200?ex.filter(function(_,i){return i%Math.ceil(ex.length/1200)===0||i===ex.length-1;}):ex;
      o.push(P.line(exd,"signal",2.4));
      [[eu,"alias"],[rk,"green"]].forEach(function(a){if(!a[0])return;var pts=a[0];o.push(_w02_cl(P,pts,a[1],1.5));
        if(pts.length<=160)pts.forEach(function(p){if(p[1]>=rr[0]&&p[1]<=rr[1])o.push(S.D(P.X(p[0]),P.Y(p[1]),a[1],pts.length>60?2.2:3.2));});});
      o.push(S.T(P.x,P.y+P.h+46,"青: 本当の解"+(eu?"　赤: オイラー法":"")+(rk?"　緑: ルンゲ・クッタ法":""),"start",9.5,"muted"));
      box.set(S.svg(Wd,P.y+P.h+54,o));
      /* 読み出し */
      var hdr="",lim=lams.map(function(l){return -2*l.re/(l.re*l.re+l.im*l.im);}).reduce(function(a,b){return Math.min(a,b);}),limR=rkLimit(lams);
      function maxErr(pts){var e=0;pts.forEach(function(p){var i2=Math.round(p[0]/tEnd*(ex.length-1));var ref=ex[Math.min(i2,ex.length-1)][1];
        var t2=ex[Math.min(i2,ex.length-1)][0];if(Math.abs(t2-p[0])<1e-9*tEnd+tEnd/(ex.length-1)/2)e=Math.max(e,Math.abs(p[1]-ref));});return e;}
      var sc2=(K===2?1:(K===1?1:1000)),su2=(K===0||K===3)?" ms":" s";
      hdr+="刻み幅 Δt = "+_w02_sig(h*sc2,3)+su2+"、"+Math.round(tEnd/h+1e-9)+" 刻みで "+tEnd+" s まで<br>";
      if(T1!==null){var r=h/T1,fe=1-r,fr=rkR(-r),cls,dY=yf-y0;
        if(fe>0)cls='<span class="ok">ずれは符号を変えずに減る（0 &lt; Δt &lt; T）</span>';else if(fe===0)cls="1 刻みで落ち着く値に着く（Δt = T）";
        else if(fe>-1)cls='<span class="warn">刻みごとに符号を変えながら減る＝振動する（T &lt; Δt &lt; 2T）</span>';else if(Math.abs(fe+1)<1e-12)cls='<span class="warn">同じ大きさで振れ続ける（Δt = 2T）</span>';else cls='<span class="warn">刻みごとに大きくなる＝発散する（Δt &gt; 2T）</span>';
        hdr+="Δt/T = "+_w02_sig(r,3)+"。落ち着く値からのずれは 1 刻みごとに、オイラー法で <b>1 − Δt/T = "+_w02_f(fe,3)+"</b> 倍 → "+cls+"<br>";
        hdr+="ルンゲ・クッタ法の 1 刻みの倍率: 1 − r + r²/2 − r³/6 + r⁴/24 = "+_w02_f(fr,4)+"（r = Δt/T。発散しない上限は Δt = 2.79T）<br>";
        if(eu)hdr+="オイラー法の値: "+eu.slice(0,5).map(function(p){return _w02_sig(p[1],4);}).join(", ")+(eu.length>5?", …":"")+"（時刻 0, Δt, 2Δt, …）<br>";
        var nT=T1/h;if(Math.abs(nT-Math.round(nT))<1e-9&&nT>=1){var dex=dY*Math.exp(-1);
          if(eu){var de=yf-eu[Math.round(nT)][1];hdr+="t = T（"+_w02_sig(T1,3)+" s）での、落ち着く値からのずれ: オイラー法 "+_w02_sig(de,4)+unit+"、本当 "+_w02_sig(dex,4)+unit+"（誤差 "+_w02_sig((de/dex-1)*100,3)+" %）<br>";}
          if(rk){var dr=yf-rk[Math.round(nT)][1];hdr+="t = T でのずれ: ルンゲ・クッタ法 "+_w02_sig(dr,6)+unit+"（誤差 "+_w02_sig((dr/dex-1)*100,2)+" %）<br>";}}
      }else{
        hdr+=(K===2?"揺れながら落ち着く対象":"速い動き（約 "+_w02_sig(-1/lams.reduce(function(a,b){return a.re<b.re?a:b;}).re*1e3,3)+" ms）と遅い動き（約 "+_w02_sig(-1/lams.reduce(function(a,b){return a.re>b.re?a:b;}).re*1e3,3)+" ms）")+
          "。発散しない刻み幅の上限: オイラー法 <b>"+_w02_sig(lim*sc2,3)+su2+"</b>、ルンゲ・クッタ法 <b>"+_w02_sig(limR*sc2,3)+su2+"</b><br>";
        if(eu)hdr+="オイラー法: "+(h>lim*(1+1e-9)?'<span class="warn">発散する</span>':(Math.abs(h-lim)<lim*0.02?'<span class="warn">上限の近く（ゆっくりしか減らない）</span>':"最大の誤差 "+_w02_sig(maxErr(eu),3)+unit))+"<br>";
        if(rk)hdr+="ルンゲ・クッタ法: "+(h>limR*(1+1e-9)?'<span class="warn">発散する</span>':"最大の誤差 "+_w02_sig(maxErr(rk),3)+unit)+"<br>";
      }
      ro.innerHTML=hdr+'<div class="wnote">本当の解は、一次の式は式の形の解、ほかは十分に細かい刻みで求めた。発散して範囲の外に出た所は描かない。'+(K===2?"揺れながら落ち着く対象では、オイラー法は、ずれを少しずつ大きくする向きに誤るので、刻み幅の上限がとくに厳しい。":"")+'</div>';
    }
    draw();
  };

  /* ===== 03 章 一次遅れの応答 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w03_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w03_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w03_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=String(+v.toPrecision(d));return s.replace("-","−");}
  /* 範囲の外に出る所で線を切る折れ線（範囲に戻ればまた描く） */
  function _w03_cut(P,pts,c,lw,dash,S){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),out=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1];if(a<P.xr[0]-1e-12||a>P.xr[1]+1e-12){prev=null;if(cur.length>1)out.push(cur);cur=[];return;}
      var ins=b>=lo&&b<=hi;
      if(prev){var pin=prev[1]>=lo&&prev[1]<=hi;
        if(ins&&!pin){var lim=prev[1]>hi?hi:lo,fr=(lim-prev[1])/(b-prev[1]);cur=[[prev[0]+(a-prev[0])*fr,lim]];}
        else if(pin&&!ins){var lim2=b>hi?hi:lo,fr2=(lim2-prev[1])/(b-prev[1]);cur.push([prev[0]+(a-prev[0])*fr2,lim2]);out.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=[a,b];});
    if(cur.length>1)out.push(cur);
    return out.map(function(sg){return S.PL(sg.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),c,lw,null,dash);}).join("");}
  /* 範囲の外に出たところで線を止める（大きくなり続ける応答の描き方） */
  function _w03_stop(P,pts,c,lw,dash,S){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),q=[];
    for(var i=0;i<pts.length;i++){var a=pts[i][0],b=pts[i][1];if(a<P.xr[0]-1e-9||a>P.xr[1]+1e-9)continue;
      if(!(b>=lo&&b<=hi)){q.push([P.X(a),P.Y(b>hi?hi:lo)]);break;}q.push([P.X(a),P.Y(b)]);}
    return q.length>1?S.PL(q,c,lw,null,dash):"";}

  /* ---- 2 節: ステップ応答（対象の動く絵 ↔ 波形） ---- */
  var _W03_OBJ=[
    {nm:"DC モータ（電圧 → 角速度）",K:50,T:0.05,du:12,ysc:1,usc:1,yu:"rad/s",uu:"V",ku:"(rad/s)/V",off:0,yl:"角速度 [rad/s]",d:1,kind:"motor",ru:"rad/s²"},
    {nm:"台車（押す力 → 速度）",K:0.5,T:0.5,du:2,ysc:1,usc:1,yu:"m/s",uu:"N",ku:"(m/s)/N",off:0,yl:"速度 [m/s]",d:3,kind:"cart",ru:"m/s²"},
    {nm:"RC 回路（電圧 → コンデンサの電圧）",K:1,T:0.1,du:5,ysc:1,usc:1,yu:"V",uu:"V",ku:"",off:0,yl:"電圧 [V]",d:3,kind:"rc",ru:"V/s"},
    {nm:"温度の板（ヒータの電力 → 温度）",K:1.25,T:500,du:40,ysc:1,usc:1,yu:"°C",dyu:"K",uu:"W",ku:"K/W",off:25,yl:"温度 [°C]",d:2,kind:"plate",ru:"K/s"},
    {nm:"水槽（流入のずれ → 水位のずれ、線形化）",K:2500,T:50,du:0.02e-3,ysc:100,usc:1000,yu:"cm",uu:"L/s",ku:"s/m²",off:0,yl:"水位のずれ [cm]",d:2,kind:"tank",ru:"cm/s"}
  ];
  REG.w03_step=function(el,U){
    var S=U.S;
    U.head(el,"STEP RESPONSE","一次遅れのステップ応答 — 時定数と定常ゲイン");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W03_OBJ.map(function(o){return o.nm;}),0,function(){kept=[];tm.set(tm.get());km.set(km.get());tt.set(1);draw();});
    var r2=U.ctrls(el);
    var tm=U.slider(r2,"時定数 T",{values:[0.25,0.5,0.75,1,1.5,2,3,4],value:1,fmt:function(v){var o=_W03_OBJ[ob.get()];return _w03_sig(o.T*v,3)+" s（例の "+v+" 倍）";},onInput:draw});
    var km=U.slider(r2,"定常ゲイン K",{values:[0.25,0.5,0.75,1,1.25,1.5,2],value:1,fmt:function(v){var o=_W03_OBJ[ob.get()];return _w03_sig(o.K*v,3)+(o.ku?" "+o.ku:"")+"（例の "+v+" 倍）";},onInput:draw});
    var r3=U.ctrls(el);
    var tt=U.slider(r3,"時刻 t（例の T の何倍か）",{min:0,max:6,step:0.01,value:1,fmt:function(v){var o=_W03_OBJ[ob.get()];return _w03_sig(v*o.T,3)+" s";},onInput:draw});
    tt.el.style.flex="1 1 100%";
    var r4=U.ctrls(el);
    var mk=U.checkbox(r4,"接線・63.2 %・95 % の印",true,draw);
    var tg=U.checkbox(r4,"時刻 t の接線",true,draw);
    var nm=U.checkbox(r4,"横軸 t/T・縦軸 y/(KΔu) で描く",false,draw);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.04;if(v>=6){v=6;tick.stop();}tt.set(v);draw();},40);
    U.button(br,"本文の例（モータに 12 V）",function(){tick.stop();ob.set(0);tm.set(1);km.set(1);tt.set(1);mk.set(true);tg.set(true);nm.set(false);kept=[];draw();});
    U.button(br,"再生（0 から）",function(){tt.set(0);draw();tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"いまの曲線を残す",function(){if(kept.length>=4)kept.shift();kept.push({T:tm.get(),K:km.get()});draw();});
    U.button(br,"残した曲線を消す",function(){kept=[];draw();});
    var pic=U.svgbox(el),box=U.svgbox(el),ro=U.readout(el),kept=[];
    var KC=["muted","teal","purple","gold"];
    /* 時刻 t までに出力を積み上げた量（台車の位置・モータの回転角）: ∫y dt = KΔu (t − T(1 − e^{−t/T})) */
    function integ(Kd,T,t){return Kd*(t-T*(1-Math.exp(-t/T)));}
    function draw(){
      var o=_W03_OBJ[ob.get()],T=o.T*tm.get(),Kv=o.K*km.get(),Kd=Kv*o.du,fin=Kd*o.ysc,fin0=o.K*o.du*o.ysc,t=tt.get()*o.T,N=nm.get();
      var y=fin*(1-Math.exp(-t/T)),sl=(fin-y)/T,nar=_w03_nar(box),Wd=nar?400:700;
      /* ---- 動く絵（左の舞台）と、出力の大きさの棒（右） ---- */
      var q=[],gx2=nar?250:430,cy=78,scx=(14+gx2-20)/2;
      q.push(S.T(nar?10:14,18,"時刻 t = "+_w03_sig(t,3)+" s（"+_w03_f(t/T,2)+" T）","start",11,"ink",true));
      if(o.kind==="motor"){
        var ang=integ(Kd,T,t)*Math.PI/(o.K*o.du*o.T)*0.5;
        q.push(S.RECT(scx-92,cy-22,64,44,6,U.soft("signal"),"signal",1.5));q.push(S.T(scx-60,cy+5,"M","middle",13,"signal",true));
        q.push(S.L(scx-28,cy,scx-6,cy,"ink",3));q.push(S.CIRC(scx+28,cy,34,"muted",1.6,"var(--muted-soft)"));
        for(var k=0;k<3;k++){var a=ang+k*2*Math.PI/3;q.push(S.L(scx+28,cy,scx+28+30*Math.cos(a),cy-30*Math.sin(a),k?"muted":"signal",k?1.4:3));}
        q.push(S.D(scx+28,cy,"ink",3.5));
        q.push(S.T(scx-60,cy+40,"電圧 "+_w03_sig(o.du,3)+" V","middle",9.5,"gold",true));
        q.push(S.T(scx+28,cy+50,"回転は遅くして描いた","middle",9,"muted"));
      }else if(o.kind==="cart"){
        var x0=24,trk=gx2-60,pos=integ(Kd,T,t),gx=x0+22+((pos*120)%(trk-44)+(trk-44))%(trk-44);
        q.push(S.L(x0,cy+22,x0+trk,cy+22,"muted",1.6));
        for(var m=0;m<=trk;m+=30)q.push(S.L(x0+m,cy+22,x0+m-6,cy+30,"faint",1.2));
        q.push(S.RECT(gx-22,cy-8,44,22,4,U.soft("signal"),"signal",1.5));
        var wa=pos*120/6;[gx-12,gx+12].forEach(function(wx){q.push(S.CIRC(wx,cy+16,6,"ink",1.3,"panel"));q.push(S.L(wx,cy+16,wx+5*Math.cos(wa),cy+16-5*Math.sin(wa),"ink",1.2));});
        q.push(S.ARR(gx-46,cy+3,gx-24,cy+3,"gold",2,6));
        q.push(S.T(x0,cy+46,"押す力 "+_w03_sig(o.du,3)+" N で走る（右端に着くと左端から出直す）","start",9,"muted"));
      }else if(o.kind==="rc"){
        var xa=scx-80,xb=scx+50;
        q.push(S.W([xa,cy+22,xa,cy-22,xa+30,cy-22],"ink",1.4));
        var zz=[[xa+30,cy-22]];for(var j=0;j<8;j++)zz.push([xa+34+j*6,cy-22+(j%2?6:-6)]);zz.push([xa+84,cy-22]);q.push(S.PL(zz,"ink",1.4));
        q.push(S.W([xa+84,cy-22,xb,cy-22,xb,cy-6],"ink",1.4));
        q.push(S.L(xb-18,cy-6,xb+18,cy-6,"signal",2.6));q.push(S.L(xb-18,cy+6,xb+18,cy+6,"signal",2.6));
        q.push(S.W([xb,cy+6,xb,cy+22,xa,cy+22],"ink",1.4));
        q.push(S.CIRC(xa,cy,12,"gold",1.6,"screen"));q.push(S.T(xa,cy+4,"+","middle",11,"gold",true));
        var nch=Math.round(10*Math.max(0,Math.min(1,y/(2*fin0))));for(var c2=0;c2<nch;c2++){q.push(S.T(xb-15+c2*3.3,cy-10,"+","middle",8,"alias",true));q.push(S.T(xb-15+c2*3.3,cy+17,"−","middle",8,"signal",true));}
        q.push(S.T(xa-16,cy+4,_w03_sig(o.du,3)+" V","end",9.5,"gold",true));
        q.push(S.TX(scx,cy+44,"コンデンサにたまった電荷（印の数）","middle",9,"muted"));
      }else if(o.kind==="plate"){
        var hf=Math.max(0,Math.min(1,y/(2*fin0)));
        q.push(S.RECT(scx-95,cy-6,190,16,3,"var(--muted-soft)","muted",1.4));
        q.push(S.RECT(scx-95,cy-6,190,16,3,"alias","none",0,null,' fill-opacity="'+(0.9*hf).toFixed(3)+'"'));
        q.push(S.RECT(scx-81,cy+10,162,7,2,U.soft("gold"),"gold",1.1));
        for(var w=0;w<4;w++){var wx2=scx-70+w*44;q.push(S.PATH("M"+wx2+","+(cy-10)+" c-5,-6 5,-10 0,-16 c-5,-6 5,-10 0,-14","muted",1.2));}
        q.push(S.T(scx,cy+36,"ヒータ "+_w03_sig(o.du,3)+" W（板の色が濃いほど熱い）","middle",9,"gold",true));
      }else{
        var lv=Math.max(0,Math.min(1,0.45+y/(fin0*2.2)*0.5)),tx0=scx-55,tw2=110,th=64,ty0=cy-30;
        q.push(S.RECT(tx0,ty0+th*(1-lv),tw2,th*lv,0,U.soft("signal"),"none",0));
        q.push(S.W([tx0,ty0,tx0,ty0+th,tx0+tw2,ty0+th,tx0+tw2,ty0],"ink",1.6));
        q.push(S.L(tx0-6,ty0+th*(1-0.45),tx0+tw2+6,ty0+th*(1-0.45),"muted",1,"4 3"));
        q.push(S.T(tx0+tw2/2,ty0+th+16,"破線: 動作点の水位","middle",9,"muted"));
        q.push(S.ARR(tx0-34,ty0-8,tx0+10,ty0-8,"gold",2,6));q.push(S.T(tx0-34,ty0-14,"流入","start",9,"gold"));
      }
      /* 目盛つきの棒（出力の大きさ） */
      var gw=nar?140:240,gy=58,gh=16;
      q.push(S.T(gx2,gy-10,o.yl.replace(/ \[.*\]/,"")+" "+_w03_f(o.off+y,o.d)+" "+o.yu,"start",11,"signal",true));
      q.push(S.RECT(gx2,gy,gw,gh,3,"screen","line",1));
      var GX=function(v){return gx2+v/(2*fin0)*gw;};
      q.push(S.RECT(gx2,gy,Math.max(0,Math.min(gw,GX(y)-gx2)),gh,3,U.soft("signal"),"signal",1));
      q.push(S.L(GX(fin),gy-4,GX(fin),gy+gh+4,"ink",1.6));
      [[0.632,"63.2 %"],[0.95,"95 %"]].forEach(function(pq,i){var xx=GX(fin*pq[0]);q.push(S.L(xx,gy+gh,xx,gy+gh+6,"signal",1.2));if(!nar||i===0)q.push(S.T(xx,gy+gh+17,pq[1],"middle",9,"signal"));});
      q.push(S.T(GX(fin),gy+gh+30,"落ち着く値 "+_w03_sig(o.off+fin,4),"middle",9,"ink"));
      if(nar){q.push(S.T(gx2,gy+gh+46,"残り "+_w03_f(100*Math.exp(-t/T),1)+" %","start",9.5,"purple",true));q.push(S.T(gx2,gy+gh+60,"変わる速さ "+_w03_sig(sl,3)+" "+o.ru,"start",9.5,"purple",true));}
      else q.push(S.T(gx2,gy+gh+46,"残り "+_w03_f(100*Math.exp(-t/T),1)+" %、変わる速さ "+_w03_sig(sl,3)+" "+o.ru,"start",9.5,"purple",true));
      pic.set(S.svg(Wd,140,q));
      /* ---- 波形 ---- */
      var p,xo=nar?52:66,pw=nar?330:600,ph=nar?190:220,g=[],fmax=Math.max(fin,fin0);kept.forEach(function(kc){fmax=Math.max(fmax,o.K*kc.K*o.du*o.ysc);});var yhi=N?1.1:1.15*fmax;
      var X0=N?6:6*o.T,TT=function(v){return N?v/T:v;},YY=function(v){return N?v/fin:v;};
      p=U.plot(xo,16,pw,ph,[0,N?6:6*o.T],[N?0:o.off,N?1.1:o.off+yhi]);
      var yt=N?[0,0.2,0.4,0.632,1.0]:U.nice(o.off,o.off+yhi,5).filter(function(v){return v>=o.off-1e-9&&v<=o.off+yhi+1e-9;});
      g.push(p.axes({xl:N?"t/T（時間 ÷ 時定数）":"時間 t [s]",yl:N?"y/(KΔu)":o.yl,xt:U.nice(0,X0,6).filter(function(v){return v<=X0+1e-9;}),yt:yt,xfmt:function(v){return _w03_sig(v,3);},yfmt:function(v){return N?(v===0.632?"0.632":_w03_sig(v,3)):_w03_sig(v,4);},ylOff:nar?38:44}));
      var off=N?0:o.off;
      function curve(Tc,Kc){var pts=[],fc=Kc*o.du*o.ysc;for(var i=0;i<=240;i++){var tq=X0*i/240*(N?Tc:1),v=fc*(1-Math.exp(-tq/Tc));pts.push([N?tq/Tc:tq,N?v/fc:off+v]);}return pts;}
      kept.forEach(function(kc,i){g.push(_w03_cut(p,curve(o.T*kc.T,o.K*kc.K),KC[i%4],1.6,"6 3",S));});
      g.push(p.line([[0,N?1:off+fin],[X0,N?1:off+fin]],"muted",1.1,"5 3"));
      if(!N&&Math.abs(km.get()-1)>1e-9){g.push(p.line([[0,off+fin0],[X0,off+fin0]],"faint",1,"2 3"));g.push(S.T(p.X(X0)-4,p.Y(off+fin0)-5,"例の K の落ち着く値","end",9,"muted",false,false,null,true));}
      g.push(_w03_cut(p,curve(T,Kv),"signal",2.6,null,S));
      if(mk.get()){
        var xT=N?1:T;g.push(S.L(p.X(0),p.Y(N?0:off),p.X(xT),p.Y(N?1:off+fin),"gold",1.5,"6 3"));
        g.push(S.D(p.X(xT),p.Y(N?1:off+fin),"gold",4));
        var y63=N?0.632:off+fin*0.632,y95=N?0.95:off+fin*0.95;
        if(xT<=X0){g.push(S.L(p.X(xT),p.Y(y63),p.X(xT),p.y+p.h,"signal",1,"3 3"));g.push(S.D(p.X(xT),p.Y(y63),"signal",4.4));
          g.push(S.T(p.X(xT)+7,p.Y(y63)+16,"63.2 %（t = "+(N?"T":_w03_sig(T,3)+" s")+"）","start",9.5,"signal",true,false,null,true));}
        if(3*xT<=X0){g.push(S.D(p.X(3*xT),p.Y(y95),"signal",4));g.push(S.T(p.X(3*xT)+6,p.Y(y95)+16,"95 %（3T）","start",9.5,"signal",true,false,null,true));}
      }
      /* 時刻 t の点と接線 */
      var xt0=N?t/T:t,yv=N?y/fin:off+y;
      if(xt0<=X0){
        g.push(S.L(p.X(xt0),p.y,p.X(xt0),p.y+p.h,"ink",1.1,"3 3"));
        if(tg.get()){var xe=N?xt0+1:t+T,ye=N?1:off+fin;var xe2=Math.min(xe,X0),ye2=yv+(ye-yv)*(xe2-xt0)/(xe-xt0||1);
          g.push(S.L(p.X(xt0),p.Y(yv),p.X(xe2),p.Y(ye2),"purple",1.6,"5 3"));if(xe<=X0)g.push(S.D(p.X(xe),p.Y(ye),"purple",3.8));}
        g.push(S.D(p.X(xt0),p.Y(yv),"signal",5));
      }
      var leg=[["signal",null,"いまの曲線"]];if(kept.length)leg.push(["muted","6 3","残した曲線"]);if(mk.get())leg.push(["gold","6 3","t = 0 の接線"]);if(tg.get())leg.push(["purple","5 3","時刻 t の接線"]);
      var ly=p.y+p.h+50;
      if(nar&&leg.length>2){g.push(S.LEGL(xo,ly,leg.slice(0,2),9.5,14));g.push(S.LEGL(xo,ly+16,leg.slice(2),9.5,14));ly+=16;}
      else g.push(S.LEGL(xo,ly,leg,9.5,14));
      box.set(S.svg(Wd,ly+8,g));
      /* ---- 読み出し ---- */
      var h="",du2=o.dyu||o.yu;
      h+="T = "+_w03_sig(T,3)+" s、K = "+_w03_sig(Kv,3)+(o.ku?" "+o.ku:"")+"、入力 Δu = "+_w03_sig(o.du*o.usc,3)+" "+o.uu+" → 出力の変化 KΔu = <b>"+_w03_sig(fin,4)+" "+du2+"</b>"+(o.off?"（"+_w03_sig(o.off,3)+" "+o.yu+" から "+_w03_sig(o.off+fin,4)+" "+o.yu+" へ）":"")+"<br>";
      h+="63.2 % に届く時刻 T = <b>"+_w03_sig(T,3)+" s</b>（"+_w03_sig(o.off+fin*0.6321,4)+" "+o.yu+"）、95 % に届く時刻 3T = "+_w03_sig(3*T,3)+" s（"+_w03_sig(o.off+fin*0.9502,4)+" "+o.yu+"）<br>";
      h+="t = 0 の傾き KΔu/T = "+_w03_sig(fin/T,4)+" "+o.ru+"（この傾きのままなら t = T で落ち着く値に届く）<br>";
      h+="時刻 t = "+_w03_sig(t,3)+" s: 出力 <b>"+_w03_f(o.off+y,o.d)+" "+o.yu+"</b>（落ち着く値の "+_w03_f(100*(1-Math.exp(-t/T)),1)+" %）、残り "+_w03_sig(fin-y,3)+" "+du2+"、その時刻の傾き "+_w03_sig(sl,3)+" "+o.ru+" → この傾きの接線は t + T = "+_w03_sig(t+T,3)+" s に落ち着く値に届く";
      if(kept.length)h+="<br>残した曲線: "+kept.map(function(kc,i){return '<span style="color:'+U.col(KC[i%4])+'">T × '+kc.T+"・K × "+kc.K+"</span>";}).join("、");
      ro.innerHTML=h+'<div class="wnote">式 y = KΔu (1 − e<sup>−t/T</sup>) の値。動く絵の速さは実際とは違い、「再生」では 1 s で例の T だけ進む。回転や移動の量も、見やすいように縮めて描いた。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 3 節: 入力をステップに分けて、応答を足し合わせる ---- */
  var _W03_IOBJ=[
    {nm:"台車（押す力 → 速度）",K:0.5,T:0.5,du:2,uu:"N",yu:"m/s",un:"押す力",yn:"速度",d:3},
    {nm:"DC モータ（電圧 → 角速度）",K:50,T:0.05,du:12,uu:"V",yu:"rad/s",un:"電圧",yn:"角速度",d:1},
    {nm:"RC 回路（電圧 → コンデンサの電圧）",K:1,T:0.1,du:1,uu:"V",yu:"V",un:"電圧",yn:"コンデンサの電圧",d:3}
  ];
  REG.w03_inputs=function(el,U){
    var S=U.S;
    U.head(el,"SUPERPOSITION","入力をステップに分けて、応答を足し合わせる");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W03_IOBJ.map(function(o){return o.nm;}),0,function(){tm.set(tm.get());tw.set(tw.get());tr.set(tr.get());draw();});
    var ip=U.select(r1,"入力",["ステップ","パルス（一定の幅だけ加える）","インパルスに近づける（面積を保って幅を狭める）","ランプ（一定の速さで上げる）","方形波（入れ切りを繰り返す）"],1,draw);
    var r2=U.ctrls(el);
    function o_(){return _W03_IOBJ[ob.get()];}
    var tm=U.slider(r2,"時定数 T",{values:[0.5,0.75,1,1.5,2],value:1,fmt:function(v){return _w03_sig(o_().T*v,3)+" s（例の "+v+" 倍）";},onInput:draw});
    var tw=U.slider(r2,"幅 t<sub>w</sub>（方形波では半周期）",{values:[0.05,0.1,0.2,0.4,1,2,4],value:2,fmt:function(v){return _w03_sig(o_().T*v,3)+" s（例の T の "+v+" 倍）";},onInput:draw});
    var tr=U.slider(r2,"ランプで上げる時間 t<sub>r</sub>",{values:[1,2,5,10,20],value:10,fmt:function(v){return _w03_sig(o_().T*v,3)+" s";},onInput:draw});
    var ns=U.slider(r2,"ランプを分ける段の数",{values:[4,8,16,32,64],value:8,fmt:function(v){return v+" 段";},onInput:draw});
    var br=U.btnrow(el);
    function set(a,b,c,d){ob.set(a);ip.set(b);tm.set(1);tw.set(c!=null?c:tw.get());tr.set(d!=null?d:tr.get());draw();}
    U.button(br,"本文の例: パルス（台車、2 N を 1 s）",function(){set(0,1,2,null);});
    U.button(br,"インパルス（台車、0.2 N·s を 0.1 s で）",function(){set(0,2,0.2,null);});
    U.button(br,"ランプ（モータ、0.5 s で 12 V）",function(){set(1,3,null,10);});
    U.button(br,"方形波（RC 回路、t<sub>w</sub> = T）",function(){set(2,4,1,null);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var o=o_(),M=ip.get(),Tb=o.T,T=o.T*tm.get(),K=o.K,du=o.du,w=tw.get()*Tb,trr=tr.get()*Tb,N=ns.get();
      tw.el.style.display=(M===1||M===2||M===4)?"":"none";tr.el.style.display=M===3?"":"none";ns.el.style.display=M===3?"":"none";
      var area=du*0.2*Tb,hImp=area/w;
      /* 成分のステップ [時刻, 高さ] と、入力の関数 */
      var comp=[],uf,win;
      if(M===0){comp=[[0,du]];uf=function(t){return t>=0?du:0;};win=6*Tb;}
      else if(M===1){comp=[[0,du],[w,-du]];uf=function(t){return t<w?du:0;};win=w+5*Tb;}
      else if(M===2){comp=[[0,hImp],[w,-hImp]];uf=function(t){return t<w?hImp:0;};win=w+4*Tb;}
      else if(M===3){for(var j=1;j<=N;j++)comp.push([(j-0.5)*trr/N,du/N]);uf=function(t){return du*Math.min(t,trr)/trr;};win=trr+4*Tb;}
      else{win=Math.max(8*Tb,8*w);for(var k=0;k*w<win&&k<160;k++)comp.push([k*w,k%2?-du:du]);uf=function(t){return Math.floor(t/w)%2?0:du;};}
      /* 応答（成分ごと）と和 */
      var n=400,ts=[],i;for(i=0;i<=n;i++)ts.push(win*i/n);
      function sresp(t,c){return t>=c[0]?c[1]*K*(1-Math.exp(-(t-c[0])/T)):0;}
      var sum=ts.map(function(t){var s0=0;comp.forEach(function(c){s0+=sresp(t,c);});return s0;});
      /* 微分方程式を細かい刻みで解く（4 次のルンゲ・クッタ法） */
      var hh=Math.min(T,(M===1||M===2||M===4)?w:T)/60,nn=Math.ceil(win/hh),yv=[0],ex=[[0,0]],stepEvery=Math.max(1,Math.round(nn/400));
      hh=win/nn;
      for(i=0;i<nn;i++){var tt0=i*hh;yv=U.ctl.rk4(function(tq,x){return [(K*uf(tq)-x[0])/T];},tt0,yv,hh);if((i+1)%stepEvery===0||i===nn-1)ex.push([(i+1)*hh,yv[0]]);}
      /* 図 */
      var nar=_w03_nar(box),Wd=nar?400:700,xo=nar?54:70,pw=nar?330:600,o2=[];
      var umax=M===2?hImp:du,umin=(M===1||M===2||M===4)?-umax:0;
      var P1=U.plot(xo,22,pw,84,[0,win],[umin*1.15,umax*1.2]);
      o2.push(S.T(xo-2,14,"入力 = ステップの和（緑: 増えるステップ、赤: 減るステップ）","start",10,"ink",true));
      o2.push(P1.axes({yl:o.un+" ["+o.uu+"]",xt:U.nice(0,win,6).filter(function(v){return v<=win+1e-9;}),yt:[umin,0,umax].filter(function(v,ix,a){return a.indexOf(v)===ix;}),xfmt:function(){return "";},yfmt:function(v){return _w03_sig(v,3);},ylOff:nar?40:46}));
      o2.push(P1.line([[0,0],[win,0]],"muted",1));
      var up=[];for(i=0;i<=600;i++){var tq=win*i/600;up.push([tq,uf(tq)]);}
      o2.push(P1.line(up,"gold",2));
      if(M===3){var st=[[0,0]],acc=0;comp.forEach(function(c){st.push([c[0],acc]);acc+=c[1];st.push([c[0],acc]);});st.push([win,acc]);o2.push(P1.line(st,"green",1.2));}
      comp.forEach(function(c){if(c[0]>win)return;var x=P1.X(c[0])+(M===3?0:3),y0=P1.Y(0),y1=P1.Y(c[1]*0.92);
        if(Math.abs(y1-y0)>=4)o2.push(S.ARR(x,y0,x,y1,c[1]>0?"green":"alias",1.4,Math.min(6,Math.abs(y1-y0)*0.6)));});
      var r2y=P1.y+P1.h+30,cmax=0,neg=false;comp.forEach(function(c){cmax=Math.max(cmax,Math.abs(c[1])*K);if(c[1]<0)neg=true;});
      var P2=U.plot(xo,r2y,pw,84,[0,win],[neg?-cmax*1.1:-cmax*0.1,cmax*1.1]);
      o2.push(S.T(xo-2,r2y-8,"それぞれのステップの応答（同じ色）","start",10,"ink",true));
      o2.push(P2.axes({yl:o.yn+" ["+o.yu+"]",xt:U.nice(0,win,6).filter(function(v){return v<=win+1e-9;}),yt:neg?[-cmax,0,cmax]:[0,cmax],xfmt:function(){return "";},yfmt:function(v){return _w03_sig(v,3);},ylOff:nar?40:46}));
      o2.push(P2.line([[0,0],[win,0]],"muted",1));
      comp.forEach(function(c){if(c[0]>win)return;var pts=[[c[0],0]];for(var q=0;q<=80;q++){var tq2=c[0]+(win-c[0])*q/80;pts.push([tq2,sresp(tq2,c)]);}o2.push(P2.line(pts,c[1]>0?"green":"alias",comp.length>20?0.9:1.6));});
      var r3y=P2.y+P2.h+30,smax=0,smin=0;sum.forEach(function(v){smax=Math.max(smax,v);smin=Math.min(smin,v);});ex.forEach(function(q){smax=Math.max(smax,q[1]);});
      var lim=M===2?Math.max(smax,K*area/T):smax;
      var P3=U.plot(xo,r3y,pw,nar?120:140,[0,win],[Math.min(0,smin)*1.1,lim*1.15||1]);
      o2.push(S.T(xo-2,r3y-8,"足し合わせた応答（青）と、微分方程式を細かい刻みで解いた応答（破線）","start",10,"ink",true));
      o2.push(P3.axes({xl:"時間 t [s]",yl:o.yn+" ["+o.yu+"]",xt:U.nice(0,win,6).filter(function(v){return v<=win+1e-9;}),xfmt:function(v){return _w03_sig(v,3);},yfmt:function(v){return _w03_sig(v,3);},ylOff:nar?40:46}));
      if(M===3)o2.push(P3.line(up.map(function(q){return [q[0],K*q[1]];}),"gold",1.2,"4 3"));
      if(M===2){var lp=[];for(i=0;i<=200;i++){var tl=win*i/200;lp.push([tl,K*area/T*Math.exp(-tl/T)]);}o2.push(P3.line(lp,"purple",1.6,"6 3"));}
      o2.push(P3.line(ts.map(function(t,ix){return [t,sum[ix]];}),"signal",2.6));
      o2.push(P3.line(ex,"ink",1.3,"4 4"));
      box.set(S.svg(Wd,P3.y+P3.h+42,o2));
      /* 読み出し */
      var h="",yu=o.yu;
      var maxd=0;ex.forEach(function(q){var s0=0;comp.forEach(function(c){s0+=sresp(q[0],c);});maxd=Math.max(maxd,Math.abs(s0-q[1]));});
      if(M===0)h+="ステップ "+_w03_sig(du,3)+" "+o.uu+": 落ち着く値 KΔu = <b>"+_w03_sig(K*du,4)+" "+yu+"</b>、時刻 T = "+_w03_sig(T,3)+" s で 63.2 %<br>";
      if(M===1){var pk=K*du*(1-Math.exp(-w/T));h+="パルス "+_w03_sig(du,3)+" "+o.uu+" を "+_w03_sig(w,3)+" s: 2 つのステップ（時刻 0 に +"+_w03_sig(du,3)+"、時刻 "+_w03_sig(w,3)+" s に −"+_w03_sig(du,3)+"）。最大 <b>"+_w03_f(pk,o.d)+" "+yu+"</b>（時刻 t<sub>w</sub>）、その後は時定数 "+_w03_sig(T,3)+" s で減る<br>";}
      if(M===2){var pk2=K*hImp*(1-Math.exp(-w/T));h+="面積 "+_w03_sig(area,3)+" "+o.uu+"·s を幅 "+_w03_sig(w,3)+" s（高さ "+_w03_sig(hImp,3)+" "+o.uu+"）で: 最大 <b>"+_w03_f(pk2,o.d)+" "+yu+"</b>。幅を 0 に近づけた極限（インパルス応答 × 面積）の最大 K × 面積 ÷ T = "+_w03_f(K*area/T,o.d)+" "+yu+"（紫の破線）の "+_w03_f(100*pk2/(K*area/T),1)+" %<br>";}
      if(M===3){var a=du/trr,vr=K*a*(trr-T+T*Math.exp(-trr/T));h+="ランプ: 傾き α = "+_w03_sig(a,3)+" "+o.uu+"/s を "+_w03_sig(trr,3)+" s。t<sub>r</sub> での値 <b>"+_w03_sig(vr,4)+" "+yu+"</b>（入力 × K の "+_w03_sig(K*du,4)+" より KαT = "+_w03_sig(K*a*T,3)+" "+yu+" 下。時間では T = "+_w03_sig(T,3)+" s 遅れ）<br>";
        var md=0;ex.forEach(function(q){var s0=0;comp.forEach(function(c){s0+=sresp(q[0],c);});md=Math.max(md,Math.abs(s0-q[1]));});
        h+=N+" 段の階段の応答とランプ応答の差: 最大 "+_w03_sig(md,3)+" "+yu+"（段を細かくするほど小さくなる）<br>";}
      if(M===4){var e=Math.exp(-w/T),ymx=K*du/(1+e),ymn=K*du*e/(1+e),lo=Infinity,hi=-Infinity;
        ex.forEach(function(q){if(q[0]>=win-2*w-1e-9){lo=Math.min(lo,q[1]);hi=Math.max(hi,q[1]);}});
        h+="方形波（半周期 "+_w03_sig(w,3)+" s）: 往復の範囲の式 "+_w03_f(ymn,o.d)+"〜"+_w03_f(ymx,o.d)+" "+yu+"、数値で解いた最後の 1 周期 "+_w03_f(lo,o.d)+"〜"+_w03_f(hi,o.d)+" "+yu+"<br>";}
      if(M!==3)h+="足し合わせた応答と、微分方程式を細かい刻みで解いた応答の差: 最大 "+_w03_sig(maxd,2)+" "+yu+"<br>";
      ro.innerHTML=h+'<div class="wnote">K = '+_w03_sig(K,3)+(o.uu==="N"?" (m/s)/N":(o.uu==="V"&&o.yu==="rad/s"?" (rad/s)/V":""))+'、T = '+_w03_sig(T,3)+' s。i 番目のステップ（時刻 t<sub>i</sub>、高さ Δu<sub>i</sub>）の応答は 2 節の式 K Δu<sub>i</sub> (1 − e<sup>−(t − t<sub>i</sub>)/T</sup>)。破線は 4 次のルンゲ・クッタ法（刻み幅は T と t<sub>w</sub> の小さい方の 1/60 以下）。</div>';
    }
    draw();
  };

  /* ---- 5 節: ステップ応答から K・T・L を求める ---- */
  /* 手順 3〜5 で読む（本文の図と同じ手順）。ノイズがあるときは平均・ならし・直線の当てはめを使う */
  function _w03_read(t,y,sig,dq){
    var n=t.length,y0=0,c0=0,i;for(i=0;i<n;i++)if(t[i]<0){y0+=y[i];c0++;}y0=c0?y0/c0:y[0];
    var tend=t[n-1],wa=sig>0?Math.min(500,0.2*tend):0,yi=0,ci=0;for(i=0;i<n;i++)if(t[i]>=tend-wa-1e-9){yi+=y[i];ci++;}yi/=ci;
    var hs=sig>0?4:0,ys=[];for(i=0;i<n;i++){var s=0,c=0;for(var j=Math.max(0,i-hs);j<=Math.min(n-1,i+hs);j++){s+=y[j];c++;}ys.push(s/c);}
    var lev=y0+0.632121*(yi-y0),t63=null;for(i=1;i<n;i++)if(t[i]>=0&&ys[i-1]<lev&&ys[i]>=lev){t63=t[i-1]+(lev-ys[i-1])/(ys[i]-ys[i-1])*(t[i]-t[i-1]);break;}
    var dt=t[1]-t[0],m=Math.round((sig>0?100:10)/dt)+1,best=null;
    for(i=0;i+m<=n;i++){if(t[i]<0||t[i]>0.5*tend)continue;var sx=0,sy=0,sxx=0,sxy=0;for(var k=i;k<i+m;k++){sx+=t[k];sy+=y[k];sxx+=t[k]*t[k];sxy+=t[k]*y[k];}
      var sl=(m*sxy-sx*sy)/(m*sxx-sx*sx),ic=(sy-sl*sx)/m;if(!best||sl>best[0])best=[sl,ic];}
    var L=(y0-best[1])/best[0],ttan=(yi-best[1])/best[0];
    return {y0:y0,yi:yi,K:(yi-y0)/dq,L:L,T63:t63!=null?t63-L:NaN,Ttan:ttan-L,t63:t63,lev:lev,sl:best[0],ic:best[1],ys:ys,wa:wa,win:(m-1)*dt};
  }
  function _w03_model(t,y0,K,T,L,dq){return t<L?y0:y0+K*dq*(1-Math.exp(-(t-L)/T));}
  REG.w03_ident=function(el,U){
    var S=U.S,DQ=40;
    U.head(el,"IDENTIFICATION","ノイズのある記録に、一次遅れ＋むだ時間の曲線を合わせる（温度の板）");
    var r0=U.ctrls(el);
    var tru=U.select(r0,"本当の対象",["一次遅れ＋むだ時間（1.25 K/W・500 s・20 s）","一次遅れが 2 つ重なる（400 s と 100 s、むだ時間なし）"],0,gen);
    tru.el.style.flex="1 1 100%";
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"観測ノイズ（標準偏差）",{values:[0,0.1,0.3,0.5,1],value:0.3,fmt:function(v){return v+" K";},onInput:gen});
    var rl=U.slider(r1,"記録の長さ",{values:[600,1000,1500,2000,2500,3000,4000],value:4000,fmt:function(v){return v+" s";},onInput:gen});
    var r2=U.ctrls(el);
    var kk=U.slider(r2,"定常ゲイン K",{min:0.5,max:2,step:0.005,value:1,fmt:function(v){return _w03_f(v,3)+" K/W";},onInput:draw});
    var tt=U.slider(r2,"時定数 T",{min:50,max:1200,step:1,value:300,fmt:function(v){return Math.round(v)+" s";},onInput:draw});
    var ll=U.slider(r2,"むだ時間 L",{min:0,max:150,step:1,value:0,fmt:function(v){return Math.round(v)+" s";},onInput:draw});
    var r3=U.ctrls(el);
    var sh=U.checkbox(r3,"読み方の線（最後の平均・63.2 %・接線）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例に戻す",function(){tru.set(0);sg.set(0.3);rl.set(4000);seed=1;kk.set(1);tt.set(300);ll.set(0);sh.set(false);last="";gen();});
    U.button(br,"図で読む（手順 3〜5）",function(){var r=_w03_read(D.t,D.y,sg.get(),DQ);kk.set(Math.max(0.5,Math.min(2,r.K)));tt.set(Math.max(50,Math.min(1200,r.T63)));ll.set(Math.max(0,Math.min(150,r.L)));sh.set(true);
      last="図で読んだ値: K = "+_w03_f(r.K,3)+" K/W、L = "+_w03_f(r.L,1)+" s、T = "+_w03_f(r.T63,1)+" s（63.2 % から）、接線から読んだ T = "+_w03_f(r.Ttan,1)+" s";draw();});
    U.button(br,"自動で合わせる（最小二乗法）",function(){var f=fit();kk.set(f.K);tt.set(f.T);ll.set(f.L);last="最小二乗法で合わせた値: K = "+_w03_f(f.K,3)+" K/W、L = "+_w03_f(f.L,1)+" s、T = "+_w03_f(f.T,1)+" s";draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();});
    var box=U.svgbox(el),ro=U.readout(el),seed=1,D=null,last="";
    function gen(){
      var rg=U.rng(seed*7919+11),two=tru.get()===1,s=sg.get(),te=rl.get(),t=[],y=[];
      for(var tq=-300;tq<=te+1e-9;tq+=5){var v;
        if(two){var a=Math.max(tq,0);v=25+1.25*DQ*(1-(400*Math.exp(-a/400)-100*Math.exp(-a/100))/300);}
        else v=_w03_model(tq,25,1.25,500,20,DQ);
        t.push(tq);y.push(v+s*rg.normal());}
      D={t:t,y:y};last="";draw();
    }
    /* 最小二乗法: L を 0.5 s ごと、T を対数の格子で探し、K は式で決める。最後に細かく探し直す */
    function fit(){
      var t=D.t,y=D.y,n=t.length,y0=0,c0=0,i;for(i=0;i<n;i++)if(t[i]<0){y0+=y[i];c0++;}y0/=c0;
      function bestK(T,L){var sfy=0,sff=0;for(var k=0;k<n;k++){if(t[k]<L)continue;var f=DQ*(1-Math.exp(-(t[k]-L)/T));sfy+=f*(y[k]-y0);sff+=f*f;}var K=sff>0?sfy/sff:1,e=0;
        for(var k2=0;k2<n;k2++){var r=y[k2]-_w03_model(t[k2],y0,K,T,L,DQ);e+=r*r;}return [e,K];}
      var best=[Infinity,1,300,0];
      for(var L=0;L<=150;L+=2)for(var j=0;j<=36;j++){var T=50*Math.pow(24,j/36),r=bestK(T,L);if(r[0]<best[0])best=[r[0],r[1],T,L];}
      for(var it=0;it<3;it++){var b0=best.slice();
        for(var dL=-2;dL<=2;dL+=0.25)for(var j2=-8;j2<=8;j2++){var L2=Math.max(0,b0[3]+dL*(it?0.25:1)),T2=b0[2]*Math.pow(1.02,j2*(it?0.25:1)),r2=bestK(T2,L2);if(r2[0]<best[0])best=[r2[0],r2[1],T2,L2];}}
      return {K:Math.max(0.5,Math.min(2,best[1])),T:Math.max(50,Math.min(1200,best[2])),L:Math.max(0,Math.min(150,best[3]))};
    }
    function draw(){
      if(!D)return;
      var K=kk.get(),T=tt.get(),L=ll.get(),te=rl.get(),t=D.t,y=D.y,n=t.length,i;
      var y0=0,c0=0;for(i=0;i<n;i++)if(t[i]<0){y0+=y[i];c0++;}y0/=c0;
      var nar=_w03_nar(box),Wd=nar?400:700,xo=nar?52:62,pw=nar?336:610,o=[];
      var P=U.plot(xo,16,pw,nar?190:230,[-300,4000],[20,80]);
      o.push(P.axes({xl:"ヒータを 0 W → 40 W にしてからの時間 [s]",yl:"温度 [°C]",xt:[0,1000,2000,3000,4000],yt:[20,30,40,50,60,70,80],xfmt:function(v){return String(v);},ylOff:nar?36:42}));
      if(te<4000)o.push(S.RECT(P.X(te),P.y,P.X(4000)-P.X(te),P.h,0,"var(--muted-soft)","none",0));
      var dots=[];for(i=0;i<n;i++)dots.push(S.D(P.X(t[i]),P.Y(Math.max(20,Math.min(80,y[i]))),"teal",1.3));o.push(dots.join(""));
      var mp=[];for(i=0;i<=430;i++){var tq=-300+4300*i/430;mp.push([tq,_w03_model(tq,y0,K,T,L,DQ)]);}
      if(L>0)mp.push([L,y0]);mp.sort(function(a,b){return a[0]-b[0];});
      o.push(P.line(mp,"signal",2.4));
      if(sh.get()){var r=_w03_read(t,y,sg.get(),DQ);
        o.push(P.line([[te-r.wa,r.yi],[te,r.yi]],"green",2.6));
        o.push(P.line([[-300,r.lev],[r.t63||0,r.lev]],"signal",1,"3 3"));
        if(r.t63!=null)o.push(S.D(P.X(r.t63),P.Y(r.lev),"signal",4));
        var xb=(r.yi-r.ic)/r.sl;o.push(P.line([[r.L,r.y0],[Math.min(4000,xb),r.y0+r.sl*(Math.min(4000,xb)-r.L)]],"gold",1.6,"6 3"));
        o.push(S.D(P.X(r.L),P.Y(r.y0),"gold",3.8));
        if(sg.get()>0)o.push(P.line(t.map(function(tq,ix){return [tq,r.ys[ix]];}).filter(function(q){return q[0]>=0;}),"ink",1,null));}
      if(te<4000)o.push(S.T(P.X(Math.min(3990,te+30)),P.y+14,"記録の外","start",9.5,"muted",true,false,null,true));
      /* 残差 */
      var se=0,cnt=0,res=[];for(i=0;i<n;i++){var e=y[i]-_w03_model(t[i],y0,K,T,L,DQ);res.push([t[i],e]);se+=e*e;cnt++;}var rms=Math.sqrt(se/cnt);
      var rq=Math.max(1,6*sg.get()),Q=U.plot(xo,P.y+P.h+46,pw,60,[-300,4000],[-rq,rq]);
      o.push(Q.axes({yl:"差 [K]",xt:[0,1000,2000,3000,4000],yt:[-rq,0,rq].map(function(v){return +v.toFixed(2);}),xfmt:function(v){return String(v);},ylOff:nar?36:42}));
      o.push(S.T(xo,Q.y-6,"測った点 − 曲線（差。枠の外は端に寄せた）","start",9.5,"ink",true));
      o.push(res.map(function(q){return S.D(Q.X(q[0]),Q.Y(Math.max(-rq,Math.min(rq,q[1]))),"purple",1.1);}).join(""));
      o.push(S.LEGL(xo,Q.y+Q.h+44,[["teal",null,"測った温度（5 s ごと）"],["signal",null,"モデルの曲線"]].concat(sh.get()?[["gold","6 3","接線"]]:[]),9.5,14));
      box.set(S.svg(Wd,Q.y+Q.h+52,o));
      var h="モデルの曲線: K = "+_w03_f(K,3)+" K/W、T = "+Math.round(T)+" s、L = "+Math.round(L)+" s → 差の 2 乗の平均の平方根 <b>"+_w03_f(rms,3)+" K</b>"+(sg.get()>0?"（ノイズの標準偏差 "+sg.get()+" K に近いほど、よく合っている）":"")+"<br>";
      if(last)h+=last+"<br>";
      h+=tru.get()===0?"本当の値: K = 1.25 K/W、T = 500 s、L = 20 s":"本当の対象は一次遅れ 2 つ（時定数 400 s と 100 s、むだ時間なし）で、一次遅れ＋むだ時間の形ではない。合わせた曲線は近似である";
      if(rl.get()<2500)h+='<br><span class="warn">記録が時定数の 5 倍より短い。落ち着く前の値を落ち着いた値と見誤りやすい</span>';
      ro.innerHTML=h+'<div class="wnote">温度の板（周り 25 °C）で、時刻 0 にヒータを 0 W から 40 W にした記録。記録は −300 s から 5 s ごと。「図で読む」は本文 5 節の手順 3〜5（ノイズがあるときは、最後の 500 s（記録の 2 割まで）の平均、前後 9 点の平均でならした曲線、最も急な 100 s の点に当てはめた直線を使う）。「自動で合わせる」は、始めの値を記録の t &lt; 0 の平均に固定し、差の 2 乗の和が最も小さい K・T・L を探す。</div>';
    }
    gen();
  };

  /* ---- 6 節: 一次遅れ（台車の速度）の比例制御 ---- */
  /* 1 章と同じ計算: 刻み h の間は力を一定として、速度の式を厳密に解く。測った速度は L だけ遅れて届く */
  function _w03_psim(Kp,L,m,uff,slope){var c=2,r=1,h=1e-3,n=6000,nd=Math.round(L/h),a=Math.exp(-c*h/m),u0=uff?c*r:0,d3=m*9.81*Math.sin(3*Math.PI/180),hist=new Float64Array(n+1),y=0,T=[],Y=[],Uu=[];
    for(var k=0;k<=n;k++){var t=k*h;hist[k]=y;var ym=k>=nd?hist[k-nd]:0,u=u0+Kp*(r-ym),d=(slope&&t>=3-1e-9)?d3:0;
      if(k%4===0){T.push(t);Y.push(y);Uu.push(u);}if(Math.abs(y)>1e4)break;var yi=(u-d)/c;y=yi+(y-yi)*a;}
    return {t:T,y:Y,u:Uu};}
  REG.w03_pctrl=function(el,U){
    var S=U.S;
    U.head(el,"P CONTROL","一次遅れ（台車の速度）の比例制御 — 6 節の式と数値計算");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{min:0,max:30,step:0.5,value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var ld=U.slider(r1,"測った速度の遅れ（むだ時間）L",{values:[0,0.02,0.05,0.08,0.1,0.12,0.15,0.2],value:0,fmt:function(v){return v+" s";},onInput:draw});
    var r2=U.ctrls(el);
    var uf=U.checkbox(r2,"決めた力 u<sub>0</sub> = c r を足す",true,draw);
    var sl=U.checkbox(r2,"3 s に上り坂 3°",true,draw);
    var lo=U.checkbox(r2,"荷物 1 kg（質量 2 kg）",false,draw);
    var br=U.btnrow(el);
    function set(k,l,u,s,m){kp.set(k);ld.set(l);uf.set(u);sl.set(s);lo.set(m);draw();}
    U.button(br,"本文の例（K<sub>P</sub> = 8・遅れなし）",function(){set(8,0,true,true,false);});
    U.button(br,"遅れ 0.1 s（K<sub>P</sub> = 8）",function(){set(8,0.1,true,true,false);});
    U.button(br,"遅れ 0.1 s（K<sub>P</sub> = 20）",function(){set(20,0.1,true,true,false);});
    U.button(br,"決めた力なし（K<sub>P</sub> = 8）",function(){set(8,0,false,false,false);});
    var box=U.svgbox(el),ro=U.readout(el),MP=null;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!MP)return;
      var inA=x>=MP[0].x-6&&x<=MP[0].x+MP[0].w+6&&y>=MP[0].y-6&&y<=MP[1].y+MP[1].h+6;
      if(type==="down"&&!inA)return false;
      kp.set(Math.round(Math.max(0,Math.min(30,MP[0].ux(x)))*2)/2);draw();
    });
    function draw(){
      var K=0.5,m=lo.get()?2:1,T=m/2,Kp=kp.get(),L=ld.get(),u0=uf.get(),sp=sl.get(),g=1+K*Kp,Tcl=T/g,d3=m*9.81*Math.sin(3*Math.PI/180);
      var finR=u0?1:K*Kp/g,eSl=K*d3/g;
      function form(t){var v=finR*(1-Math.exp(-t/Tcl));if(sp&&t>=3)v-=eSl*(1-Math.exp(-(t-3)/Tcl));return v;}
      function eInf(k){var gg=1+K*k;return (u0?0:1/gg)+(sp?K*d3/gg:0);}
      var R=_w03_psim(Kp,L,m,u0,sp);
      var nar=_w03_nar(box),Wd=nar?400:700,o=[];
      /* 左（狭い画面では上）: 比例ゲインの地図 */
      var mx=nar?52:58,mw=nar?140:200,A,B;
      if(nar){A=U.plot(mx,22,mw,80,[0,30],[0,T*1.05]);B=U.plot(mx+190,22,mw,80,[0,30],[0,Math.max(0.05,eInf(0)*1.05)]);}
      else{A=U.plot(mx,22,mw,100,[0,30],[0,T*1.05]);B=U.plot(mx,170,mw,100,[0,30],[0,Math.max(0.05,eInf(0)*1.05)]);}
      MP=[A,B];
      o.push(S.TX(A.x-30,A.y-8,"時定数 T_cl [s]","start",9.5,"signal",true));
      o.push(A.axes({xt:[0,10,20,30],yt:U.nice(0,T,2).filter(function(v){return v<=T*1.05;}),xfmt:nar?String:function(){return "";},yfmt:function(v){return _w03_sig(v,3);},ylOff:36}));
      o.push(S.TX(B.x-30,B.y-8,(sp?"坂の上の":"平らな道の")+"定常偏差 e_∞ [m/s]","start",9.5,"purple",true));
      o.push(B.axes({xt:[0,10,20,30],yt:U.nice(0,eInf(0),2).filter(function(v){return v<=eInf(0)*1.05;}),xfmt:String,yfmt:function(v){return _w03_sig(v,3);},ylOff:36}));
      if(!nar)o.push(S.TX(B.x+B.w/2,B.y+B.h+31,"比例ゲイン K_P [N/(m/s)]","middle",10,"muted"));
      var ca=[],cb=[];for(var k=0;k<=60;k++){var kk2=k/2;ca.push([kk2,T/(1+K*kk2)]);cb.push([kk2,eInf(kk2)]);}
      o.push(A.line(ca,"signal",2));o.push(B.line(cb,"purple",2));
      o.push(S.L(A.X(Kp),A.y,A.X(Kp),A.y+A.h,"ink",1,"3 3"));o.push(S.L(B.X(Kp),B.y,B.X(Kp),B.y+B.h,"ink",1,"3 3"));
      o.push(S.CIRC(A.X(Kp),A.Y(Tcl),7,"ink",2,"screen"));o.push(S.D(A.X(Kp),A.Y(Tcl),"signal",4));
      o.push(S.CIRC(B.X(Kp),B.Y(eInf(Kp)),7,"ink",2,"screen"));o.push(S.D(B.X(Kp),B.Y(eInf(Kp)),"purple",4));
      if(!nar)o.push(S.T(B.x+B.w,B.y+B.h+46,"点を左右にドラッグして変えられる","end",9,"muted"));
      /* 右（狭い画面では下）: 速度と力 */
      var rx=nar?52:330,rw=nar?336:350,ry=nar?(B.y+B.h+50):22,ymax=Math.max(1.4,Math.min(2.0,Math.ceil((Math.max.apply(null,R.y.filter(function(v){return isFinite(v);}))+0.1)*5)/5));
      var P1=U.plot(rx,ry,rw,nar?160:180,[0,6],[0,ymax]);
      if(sp)o.push(S.RECT(P1.X(3),P1.y,P1.X(6)-P1.X(3),P1.h,0,U.soft("purple"),"none",0));
      o.push(P1.axes({yl:"速度 y [m/s]",xt:[0,1,2,3,4,5,6],yt:U.nice(0,ymax,5).filter(function(v){return v<=ymax+1e-9;}),xfmt:function(){return "";},ylOff:38}));
      o.push(P1.line([[0,1],[6,1]],"muted",1.2,"5 3"));
      var fp=[];for(var i=0;i<=600;i++){var tq=6*i/600;fp.push([tq,form(tq)]);}
      o.push(P1.line(fp,"signal",1.6,"6 4"));
      o.push(_w03_stop(P1,R.t.map(function(tq,ix){return [tq,R.y[ix]];}),"signal",2.4,null,S));
      if(finR>0&&Tcl<6){o.push(S.CIRC(P1.X(Tcl),P1.Y(finR*0.632),4.5,"gold",2,"screen"));}
      if(sp)o.push(S.T(P1.X(4.5),P1.y+12,"上り坂 3°","middle",9.5,"purple",true,false,null,true));
      var P2=U.plot(rx,P1.y+P1.h+16,rw,62,[0,6],[-10,25]);
      o.push(P2.axes({xl:"時間 t [s]",yl:"力 [N]",xt:[0,1,2,3,4,5,6],yt:[-10,0,10,20],ylOff:38}));
      o.push(P2.line([[0,0],[6,0]],"faint",1));
      o.push(_w03_cut(P2,R.t.map(function(tq,ix){return [tq,R.u[ix]];}),"gold",1.6,null,S));
      o.push(S.LEGL(rx,P2.y+P2.h+46,[["signal",null,"数値計算"],["signal","6 4","6 節の式"],["gold",null,"押す力 u"]],9.5,12));
      box.set(S.svg(Wd,P2.y+P2.h+54,o));
      /* 読み出し */
      function first(th){for(var j=0;j<R.y.length&&R.t[j]<3;j++)if(R.y[j]>=th)return R.t[j];return null;}
      var t63=finR>0?first(0.632*finR):null,t95=finR>0?first(0.95*finR):null,y3=R.y[Math.min(R.y.length-1,749)],y6=R.y[R.y.length-1],grow=R.t[R.t.length-1]<5.99||Math.abs(y6)>50;
      var pk=-Infinity;for(var j2=0;j2<R.y.length&&R.t[j2]<3;j2++)pk=Math.max(pk,R.y[j2]);
      var hh="1 + K K<sub>P</sub> = 1 + 0.5 × "+Kp+" = <b>"+_w03_sig(g,4)+"</b>（K = 1/c = 0.5 (m/s)/N、T = m/c = "+T+" s）<br>";
      hh+="時定数 T<sub>cl</sub> = T ÷ (1 + K K<sub>P</sub>) = <b>"+_w03_sig(Tcl,3)+" s</b>"+(t63!=null?"（数値計算で 63.2 % に届く時刻 "+_w03_f(t63,3)+" s）":"")+"、95 % に届く時間 3T<sub>cl</sub> = "+_w03_sig(3*Tcl,3)+" s"+(t95!=null?"（数値計算 "+_w03_f(t95,3)+" s）":"")+"<br>";
      hh+=(u0?"平らな道で落ち着く速度（式）1.000 m/s":"平らな道で落ち着く速度（式）K K<sub>P</sub> ÷ (1 + K K<sub>P</sub>) = "+_w03_f(finR,3)+" m/s（定常偏差 "+_w03_f(1-finR,3)+" m/s）")+"、数値計算（3 s）"+(grow?"—":_w03_f(y3,3)+" m/s")+"<br>";
      if(sp)hh+="坂の上で落ち着く速度（式）"+(u0?"r − K d ÷ (1 + K K<sub>P</sub>)":"")+" = <b>"+_w03_f(finR-eSl,3)+" m/s</b>、数値計算（6 s）"+(grow?'<span class="warn">落ち着かない</span>':_w03_f(y6,3)+" m/s")+"<br>";
      if(L>0)hh+=(grow?'<span class="warn">振れが大きくなり続ける。</span>':"最大の速度 "+_w03_f(pk,2)+" m/s。")+'むだ時間があるので、制御器は '+L+' s 前の速度を使う。6 節の式（破線）は、この動きを表せない'+(grow?"":"（落ち着く値だけは式と一致する）");
      else hh+='<span class="ok">遅れが無いので、閉ループも一次遅れになり、数値計算と式が重なる（目標値を越えない）</span>';
      ro.innerHTML=hh+'<div class="wnote">1 章の台車（質量 '+m+' kg、c = 2 N·s/m、目標 1 m/s、坂の力 d = '+_w03_f(d3,3)+' N）。1 ms 刻みで計算した。○ は式の 63.2 % の点（時刻 T<sub>cl</sub>）。</div>';
    }
    draw();
  };

  /* ===== 04 章 二次遅れの応答 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w04_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w04_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w04_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace(/^-/,"−");}
  /* 有効数字 d 桁（末尾の 0 を残す。例 4.90、0.300） */
  function _w04_p3(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace(/^-/,"−");}
  /* 文字の幅（結合文字は 0、ギリシャ文字と記号は半角程度） */
  function _w04_tw(s,sz){var w=0;s=String(s);for(var i=0;i<s.length;i++){var o=s.charCodeAt(i);
    if(o>=0x300&&o<=0x36F)continue;if(o<128)w+=sz*0.56;else if(o>=0x370&&o<=0x3FF)w+=sz*0.6;
    else if(o===0xB2||o===0xB3||o===0xB9||(o>=0x2070&&o<=0x209F))w+=sz*0.4;
    else if(o===0x2212||o===0xB1||o===0xD7||o===0x221A||o===0x2248||o===0x2264||o===0x2265||o===0xB7||o===0xB0)w+=sz*0.62;
    else if(o>=0x1E00&&o<=0x1EFF)w+=sz*0.56;else w+=sz;}return w;}
  /* 式の文字。parts=[[文字, 添字, 斜体か, 色, 上付き, 上の点の数], ...] */
  function _w04_m(U,x,y,parts,a,sz,c,b,halo){
    var w=0;parts.forEach(function(p){w+=_w04_tw(p[0],sz)+(p[1]?_w04_tw(p[1],sz*0.72):0)+(p[4]?_w04_tw(p[4],sz*0.72):0);});
    var x0=x-(a==="middle"?w/2:(a==="end"?w:0)),ss=Math.round(sz*72)/100,cur=0,xx=x0,dots=[];
    var o='<text x="'+(Math.round(x0*100)/100)+'" y="'+(Math.round(y*100)/100)+'" text-anchor="start" font-size="'+sz+'" fill="'+U.col(c||"ink")+
      '" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+(halo?' stroke="var(--screen)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"':'')+'>';
    parts.forEach(function(p){var cc=p[3]?' fill="'+U.col(p[3])+'"':'',wb=_w04_tw(p[0],sz);
      o+='<tspan font-style="'+(p[2]?"italic":"normal")+'"'+cc+(cur?' dy="'+(-cur)+'"':'')+'>'+U.esc(p[0])+'</tspan>';cur=0;
      if(p[5]){for(var k=0;k<p[5];k++)dots.push([xx+wb/2+(k-(p[5]-1)/2)*sz*0.26,y-sz*0.86,p[3]||c||"ink"]);}
      xx+=wb;
      if(p[1]){o+='<tspan dy="3" font-size="'+ss+'"'+cc+'>'+U.esc(p[1])+'</tspan>';cur=3;xx+=_w04_tw(p[1],sz*0.72);}
      if(p[4]){o+='<tspan dy="'+(-5-cur)+'" font-size="'+ss+'"'+cc+'>'+U.esc(p[4])+'</tspan>';cur=-5;xx+=_w04_tw(p[4],sz*0.72);}});
    o+='</text>';
    dots.forEach(function(d){o+='<circle cx="'+(Math.round(d[0]*100)/100)+'" cy="'+(Math.round(d[1]*100)/100)+'" r="'+Math.max(1,sz*0.085).toFixed(2)+'" fill="'+U.col(d[2])+'"/>';});
    return o;
  }
  /* グラフの範囲の外に出る所で切った折れ線（点は値の組 [x, y]） */
  function _w04_cl(P,pts,c,lw,dash){
    var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),segs=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1],ins=isFinite(b)&&b>=lo&&b<=hi;
      if(prev){var pa=prev[0],pb=prev[1],pin=isFinite(pb)&&pb>=lo&&pb<=hi;
        if(ins&&!pin&&isFinite(pb)){var l1=pb>hi?hi:lo;cur=[[pa+(a-pa)*(l1-pb)/(b-pb),l1]];}
        else if(pin&&!ins){if(isFinite(b)){var l2=b>hi?hi:lo;cur.push([pa+(a-pa)*(l2-pb)/(b-pb),l2]);}segs.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=q;});
    if(cur.length)segs.push(cur);
    return segs.filter(function(s){return s.length>=2;}).map(function(s){return P.line(s,c,lw,dash);}).join("");
  }
  /* x と y の両方を範囲で切る折れ線（位相平面用。範囲の外の点で線を切る） */
  function _w04_cl2(S,P,xs,ys,c,lw,dash){var segs=[],cur=[],x0=Math.min(P.xr[0],P.xr[1]),x1=Math.max(P.xr[0],P.xr[1]),y0=Math.min(P.yr[0],P.yr[1]),y1=Math.max(P.yr[0],P.yr[1]);
    for(var i=0;i<xs.length;i++){var a=xs[i],b=ys[i];if(a>=x0&&a<=x1&&b>=y0&&b<=y1)cur.push([P.X(a),P.Y(b)]);else if(cur.length){segs.push(cur);cur=[];}}
    if(cur.length)segs.push(cur);return segs.filter(function(s){return s.length>=2;}).map(function(s){return S.PL(s,c,lw,null,dash);}).join("");}
  function _w04_ticks(U,lo,hi,n){return U.nice(lo,hi,n||5).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;});}

  /* ---- 二次遅れの解（本文 2・3 節の式） ---- */
  /* 入力の無い標準形の解 [y, ẏ]（初期値 y0・v0） */
  function _w04_free(z,wn,t,y0,v0){
    if(z<1-1e-12){var s=z*wn,wd=wn*Math.sqrt(1-z*z),C=(v0+s*y0)/wd,e=Math.exp(-s*t),cs=Math.cos(wd*t),sn=Math.sin(wd*t);
      return [e*(y0*cs+C*sn),e*((-s*y0+wd*C)*cs+(-s*C-wd*y0)*sn)];}
    if(Math.abs(z-1)<=1e-12){var B=v0+wn*y0,e1=Math.exp(-wn*t);return [(y0+B*t)*e1,(B-wn*(y0+B*t))*e1];}
    var r=Math.sqrt(z*z-1),l1=-wn*(z-r),l2=-wn*(z+r),A=(v0-l2*y0)/(l1-l2),B2=(l1*y0-v0)/(l1-l2);
    return [A*Math.exp(l1*t)+B2*Math.exp(l2*t),A*l1*Math.exp(l1*t)+B2*l2*Math.exp(l2*t)];
  }
  /* 単位ステップ応答（最終値 K）: 最終値からのずれは、自由な動き（初期値 −K）と同じ */
  function _w04_stepf(z,wn,t,K){var f=_w04_free(z,wn,t,-K,0);return [K+f[0],f[1]];}
  function _w04_bis(f,a,b,n){var fa=f(a);for(var i=0;i<(n||60);i++){var m=0.5*(a+b),fm=f(m);if((fa<0)===(fm<0)){a=m;fa=fm;}else b=m;}return 0.5*(a+b);}
  /* 正規化した（ω_n = 1、最終値 1）ステップ応答の指標。式と二分法で求める。{tr, tp, Mp（割合）, t2} */
  function _w04_index(z){
    var yv=function(t){return _w04_stepf(z,1,t,1)[0];};
    if(z<1){var wd=Math.sqrt(1-z*z),tp=Math.PI/wd,Mp=Math.exp(-Math.PI*z/wd);
      var tr=_w04_bis(function(t){return yv(t)-0.9;},0,tp)-_w04_bis(function(t){return yv(t)-0.1;},0,tp),t2;
      if(z<=0)return {tr:tr,tp:tp,Mp:1,t2:Infinity};
      if(Mp>0.02){var n=Math.ceil(Math.log(0.02)/Math.log(Mp))-1,ta=n*Math.PI/wd,sg=(n%2===1)?1:-1,tz=_w04_bis(function(t){return yv(t)-1;},ta,ta+Math.PI/wd);
        t2=_w04_bis(function(t){return sg*(yv(t)-1)-0.02;},ta,tz);}
      else t2=_w04_bis(function(t){return yv(t)-0.98;},0,tp);
      return {tr:tr,tp:tp,Mp:Mp,t2:t2};}
    var hi=60*z;
    return {tr:_w04_bis(function(t){return yv(t)-0.9;},0,hi)-_w04_bis(function(t){return yv(t)-0.1;},0,hi),tp:null,Mp:0,t2:_w04_bis(function(t){return yv(t)-0.98;},0,hi)};
  }
  /* 特性根（複素数の組） */
  function _w04_roots(z,wn){if(z<1){var wd=wn*Math.sqrt(1-z*z);return [{re:-z*wn,im:wd},{re:-z*wn,im:-wd}];}
    var r=Math.sqrt(z*z-1);return [{re:-wn*(z-r),im:0},{re:-wn*(z+r),im:0}];}
  function _w04_rootTxt(z,wn){if(z<=0)return "±<i>j</i>"+_w04_p3(wn);
    if(z<1)return _w04_p3(-z*wn)+" ± <i>j</i>"+_w04_p3(wn*Math.sqrt(1-z*z));
    if(Math.abs(z-1)<1e-12)return _w04_p3(-wn)+"（重根）";
    var r=Math.sqrt(z*z-1);return _w04_p3(-wn*(z-r))+" と "+_w04_p3(-wn*(z+r));}
  /* 刻み dt ごとの応答 Yf（最終値 K）から指標を読む。10 %・90 %・±2 % の横切りは線形補間、山は放物線で補間する */
  function _w04_stats(Yf,dt,K){
    var n=Yf.length-1,t10=null,t90=null,im=0,lastOut=-1;
    for(var i=0;i<=n;i++){var y=Yf[i];
      if(t10===null&&y>=0.1*K)t10=i?(i-1+(0.1*K-Yf[i-1])/(y-Yf[i-1]))*dt:0;
      if(t90===null&&y>=0.9*K)t90=(i-1+(0.9*K-Yf[i-1])/(y-Yf[i-1]))*dt;
      if(y>Yf[im])im=i;
      if(Math.abs(y-K)>0.02*Math.abs(K))lastOut=i;}
    var tp=im*dt,ym=Yf[im];
    if(im>0&&im<n){var a=Yf[im-1],b=Yf[im],c=Yf[im+1],den=a-2*b+c;if(den<0){var d=0.5*(a-c)/den;tp=(im+d)*dt;ym=b-0.25*(a-c)*d;}}
    var t2;if(lastOut<0)t2=0;else if(lastOut>=n)t2=Infinity;
    else{var y0=Yf[lastOut]-K,y1=Yf[lastOut+1]-K,lev=y0>0?0.02*K:-0.02*K;t2=(lastOut+(lev-y0)/(y1-y0))*dt;}
    return {tr:(t10!==null&&t90!==null)?t90-t10:null,tp:tp,Mp:(ym-K)/K,t2:t2,ymax:ym};
  }
  /* 刻み dt の RK4 で単位ステップ応答（最終値 K）を求め、指標を読む。返り値 {T, Y, V（ev ごと）, tr, tp, Mp, t2, ymax} */
  function _w04_simStep(U,z,wn,K,tEnd,dt,ev){
    var f=function(t,x){return [x[1],wn*wn*K-2*z*wn*x[1]-wn*wn*x[0]];},n=Math.round(tEnd/dt),x=[0,0],T=[],Y=[],V=[],Yf=new Float64Array(n+1);
    for(var i=0;i<=n;i++){var t=i*dt;Yf[i]=x[0];
      if(i%ev===0){T.push(t);Y.push(x[0]);V.push(x[1]);}
      x=U.ctl.rk4(f,t,x,dt);}
    var st=_w04_stats(Yf,dt,K);st.T=T;st.Y=Y;st.V=V;return st;
  }
  /* 横向きのばね・ダンパ・壁・床・台車（2 章と同じ見た目） */
  function _w04_spring(S,x1,x2,y,n,amp,c,lw){var lead=Math.min(10,(x2-x1)*0.15),xs=x1+lead,xe=x2-lead,pts=[[x1,y],[xs,y]];
    for(var i=0;i<2*n;i++)pts.push([xs+(xe-xs)*(i+0.5)/(2*n),y+(i%2===0?amp:-amp)]);pts.push([xe,y]);pts.push([x2,y]);return S.PL(pts,c,lw);}
  function _w04_damper(S,x1,x2,y,c,lw){var cy0=x1+12,cyl=Math.max(30,Math.min(46,(x2-x1)*0.5)),px=Math.max(cy0+6,Math.min(cy0+cyl-4,x2-14));
    return S.L(x1,y,cy0,y,c,lw)+S.L(cy0,y-8,cy0+cyl,y-8,c,lw)+S.L(cy0,y+8,cy0+cyl,y+8,c,lw)+S.L(cy0,y-8,cy0,y+8,c,lw)+
      S.L(px,y-6,px,y+6,c,lw+0.8)+S.L(px,y,x2,y,c,lw);}
  function _w04_wall(S,x,y0,y1){var o=S.L(x,y0,x,y1,"muted",1.8);for(var yy=y0+4;yy<y1;yy+=9)o+=S.L(x,yy,x-7,yy+7,"muted",1);return o;}
  function _w04_ground(S,x0,x1,y){var o=S.L(x0,y,x1,y,"muted",1.6);for(var xx=x0+4;xx<x1;xx+=10)o+=S.L(xx,y,xx-7,y+7,"muted",1);return o;}
  function _w04_cart(S,U,x,y,w,h,c){return S.RECT(x,y,w,h,4,U.soft(c),c,1.5)+S.CIRC(x+w*0.25,y+h+4,4,c,1.4,"var(--screen)")+S.CIRC(x+w*0.75,y+h+4,4,c,1.4,"var(--screen)");}
  /* 根の平面（実部・虚部の目盛つき）。P は U.plot */
  function _w04_rplane(U,S,P,xt,yt){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+P.axes({xl:"実部",yl:"虚部",xt:xt,yt:yt,xfmt:function(v){return _w04_sig(v,3);},yfmt:function(v){return _w04_sig(v,3);},ylOff:34})+U.ctl.splane(P);}
  /* 根の平面の上のドラッグ（上の根の位置 → ζ・ω_n）。zr=[ζ の下限, 上限]、wr=[ω_n の下限, 上限] */
  function _w04_dragRoot(U,box,getP,zr,wr,set){
    U.ctl.drag(box,function(type,x,y){var P=getP();if(type==="up"||x==null||!P)return;
      if(type==="down"&&!(x>=P.x-8&&x<=P.x+P.w+8&&y>=P.y-8&&y<=P.y+P.h+8))return false;
      var re=Math.min(0,P.ux(x)),im=Math.abs(P.uy(y)),wn=Math.sqrt(re*re+im*im);
      wn=Math.max(wr[0],Math.min(wr[1],wn));var z=wn>0?Math.max(zr[0],Math.min(zr[1],-re/Math.max(1e-9,Math.sqrt(re*re+im*im)))):zr[0];
      set(Math.round(z*100)/100,+wn.toPrecision(3));});
  }

  /* ---- 3 節: 減衰比と固有角周波数 — 特性根・台車の絵・ステップ応答 ---- */
  REG.w04_zeta=function(el,U){
    var S=U.S;
    U.head(el,"DAMPING RATIO","減衰比と固有角周波数 — 特性根・台車の動く絵・ステップ応答");
    var r1=U.ctrls(el);
    var sz=U.slider(r1,"減衰比 ζ",{min:0,max:3,step:0.01,value:0.2,fmt:function(v){return _w04_f(v,2);},onInput:function(){run();}});
    var sw=U.slider(r1,"固有角周波数 ω<sub>n</sub>",{min:1,max:20,log:true,value:5,fmt:function(v){return _w04_sig(v,3)+" rad/s";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var st=U.slider(r2,"時刻 <i>t</i>（台車の絵）",{min:0,max:6,step:0.01,value:0.64,fmt:function(v){return _w04_f(v,2)+" s";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var t=st.get()+0.04;if(t>=6){t=6;tk.stop();}st.set(t);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=5.99)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(z,w){tk.stop();sz.set(z);sw.set(w);st.set(0.64);run();}
    U.button(br,"本文の例（ζ 0.2・ω<sub>n</sub> 5 rad/s）",function(){pre(0.2,5);});
    U.button(br,"ダンパを外す（ζ = 0）",function(){pre(0,5);});
    U.button(br,"ζ = 0.7",function(){pre(0.7,5);});
    U.button(br,"臨界減衰（ζ = 1）",function(){pre(1,5);});
    U.button(br,"過減衰（ζ = 2）",function(){pre(2,5);});
    var br2=U.btnrow(el);
    U.button(br2,"この曲線を残して比べる",function(){if(R){refs.push({T:R.T,P:R.P,z:R.z,wn:R.wn});if(refs.length>4)refs.shift();draw();}});
    U.button(br2,"残した曲線を消す",function(){refs=[];draw();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,refs=[],RP=null;
    _w04_dragRoot(U,box,function(){return RP;},[0,1],[1,20],function(z,w){tk.stop();sz.set(z);sw.set(w);run();});
    var REFC=["teal","purple","gold","green"];
    function run(){
      var z=sz.get(),wn=sw.get(),k=wn*wn,c=2*z*wn,u=k*0.04;
      var lf=z>1?wn*(z+Math.sqrt(z*z-1)):wn,dt=Math.min(0.001,1/(20*lf)),ev=Math.max(1,Math.round(0.005/dt));
      var sim=_w04_simStep(U,z,wn,0.04,6,dt,ev),dmax=0;
      sim.T.forEach(function(t,i){dmax=Math.max(dmax,Math.abs(_w04_stepf(z,wn,t,0.04)[0]-sim.Y[i]));});
      R={z:z,wn:wn,k:k,c:c,u:u,T:sim.T,P:sim.Y,V:sim.V,ymax:sim.ymax,tp:sim.tp,dmax:dmax,dt:dt};
      draw();
    }
    function draw(){
      if(!R)return;var s=R,nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var t=st.get(),idx=Math.max(0,Math.min(s.T.length-1,Math.round(t/(s.T[1]-s.T[0])))),p=s.P[idx]*100,v=s.V[idx]*100;
      /* 台車の絵 */
      var gy=nar?100:96,sx0=nar?18:24,x0=sx0+(nar?70:96),sc=nar?24:30,cw=nar?52:64,ch=nar?30:36,cx=x0+p*sc,cy=gy-8-ch;
      o.push(_w04_ground(S,sx0-4,nar?392:446,gy));o.push(_w04_wall(S,sx0,gy-ch-38,gy));
      o.push(S.L(x0,gy-ch-36,x0,gy+16,"muted",1,"3 3"));o.push(S.T(x0,gy+28,"p = 0","middle",9.5,"muted"));
      o.push(S.L(x0+4*sc,gy-ch-36,x0+4*sc,gy+16,"green",1,"3 3"));o.push(S.T(x0+4*sc,gy+28,"4 cm（最終値）","middle",9.5,"green"));
      o.push(_w04_spring(S,sx0,cx,cy+10,nar?6:8,6,"teal",1.6));
      if(s.c>0)o.push(_w04_damper(S,sx0,cx,cy+ch-9,"purple",1.6));
      o.push(_w04_cart(S,U,cx,cy,cw,ch,"signal"));
      o.push(_w04_m(U,cx+cw/2,cy+ch/2+4,[["m",null,true]],"middle",11,"signal",true));
      o.push(S.ARR(cx+cw,cy+ch/2,cx+cw+30,cy+ch/2,"gold",2.2,7));
      o.push(_w04_m(U,cx+cw+34,cy+ch/2+4,[["u",null,true],[" = "+_w04_sig(s.u,3)+" N",null,false]],"start",9.5,"gold",true,true));
      o.push(S.T(sx0+4,14,"台車（m = 1 kg、k = "+_w04_sig(s.k,3)+" N/m、c = "+_w04_sig(s.c,3)+" N·s/m）","start",10,"ink",true));
      /* 根の平面 */
      var rx=nar?70:496,ry=nar?gy+48:24,P=U.plot(rx,ry,168,252,[-24,4],[-21,21]);RP=P;
      o.push(_w04_rplane(U,S,P,[-20,-10,0],[-20,-10,0,10,20]));
      if(s.z<1)o.push(S.CIRC(P.X(0),P.Y(0),P.X(s.wn)-P.X(0),"faint",1,null,"3 3"));
      o.push(U.ctl.pz(P,_w04_roots(s.z,s.wn),[],"signal",6));
      o.push(S.T(P.x+P.w,P.y-6,"× をドラッグ","end",9,"muted"));
      /* ステップ応答 */
      var py=nar?ry+P.h+56:150,Q=U.plot(nar?50:62,py,nar?334:380,nar?130:136,[0,6],[0,8.4]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"位置 p [cm]",xt:[0,1,2,3,4,5,6],yt:[0,2,4,6,8],xfmt:function(q){return String(q);},yfmt:function(q){return String(q);},ylOff:nar?34:40}));
      o.push(Q.line([[0,4],[6,4]],"muted",1.1,"4 3"));
      if(s.z>0&&s.z<1){var env=[],env2=[],a0=4/Math.sqrt(1-s.z*s.z);for(var i=0;i<=240;i++){var tt=i*0.025,e=a0*Math.exp(-s.z*s.wn*tt);env.push([tt,4+e]);env2.push([tt,4-e]);}
        o.push(_w04_cl(Q,env,"gold",1.2,"5 3"));o.push(_w04_cl(Q,env2,"gold",1.2,"5 3"));}
      refs.forEach(function(rf,j){o.push(_w04_cl(Q,rf.T.map(function(q,i){return [q,rf.P[i]*100];}),REFC[j%4],1.5,"6 3"));});
      o.push(_w04_cl(Q,s.T.map(function(q,i){return [q,s.P[i]*100];}),"signal",2.2));
      o.push(S.L(Q.X(t),Q.y,Q.X(t),Q.y+Q.h,"gold",1.1,"3 3"));o.push(S.D(Q.X(t),Q.Y(Math.min(8.4,p)),"signal",4));
      var ly=Q.y+Q.h+48,lg=[["signal",null,"今の応答"]];if(s.z>0&&s.z<1)lg.push(["gold","5 3","包絡線"]);
      o.push(S.LEGL(Q.x,ly,lg,9.5,14));
      var lx=Q.x+(s.z>0&&s.z<1?190:100);refs.forEach(function(rf,j){if(!nar||j<2){o.push(S.L(lx,ly-4,lx+20,ly-4,REFC[j%4],2,"6 3"));o.push(_w04_m(U,lx+24,ly,[["ζ",null,false],[" "+_w04_f(rf.z,2),null,false]],"start",9,"muted"));lx+=70;}});
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      var z=s.z,wn=s.wn,h="",kind=z<=0?'<span class="warn">減衰なし。揺れが減らない</span>':(z<1?"不足減衰":(Math.abs(z-1)<1e-9?'<span class="ok">臨界減衰</span>':"過減衰"));
      h+="台車（質量 1 kg）では <i>k</i> = ω<sub>n</sub>² = <b>"+_w04_sig(s.k,3)+" N/m</b>、<i>c</i> = 2ζω<sub>n</sub> = <b>"+_w04_sig(s.c,3)+" N·s/m</b>。押す力 <i>u</i> = <i>k</i> × 4 cm = "+_w04_sig(s.u,3)+" N（最終値 <i>Ku</i> = 4 cm）<br>";
      h+="特性根: <b>"+_w04_rootTxt(z,wn)+"</b>（"+kind+"）";
      if(z<1){var wd=wn*Math.sqrt(1-z*z);h+="。ω<sub>d</sub> = "+_w04_p3(wd)+" rad/s、揺れの周期 2π/ω<sub>d</sub> = <b>"+_w04_p3(2*Math.PI/wd)+" s</b>"+(z>0?"、包絡線の時定数 1/(ζω<sub>n</sub>) = "+_w04_p3(1/(z*wn))+" s":"");}
      else if(z>1){var r=Math.sqrt(z*z-1);h+="。遅い根の時定数 "+_w04_p3(1/(wn*(z-r)))+" s、速い根の時定数 "+_w04_p3(1/(wn*(z+r)))+" s";}
      h+="<br>";
      h+="時刻 "+_w04_f(t,2)+" s: 位置 <b>"+_w04_f(p,2)+" cm</b>、速度 "+_w04_f(v,1)+" cm/s。6 s までの最大の位置 <b>"+_w04_f(s.ymax*100,2)+" cm</b>（"+_w04_f(s.tp,2)+" s）<br>";
      h+="3 節の式と数値計算の差: 最大 "+(s.dmax*100<1e-6?"10<sup>−6</sup> cm 未満（表示の桁で一致）":_w04_sig(s.dmax*100,2)+" cm");
      ro.innerHTML=h+'<div class="wnote">式 <i>m</i>p̈ + <i>c</i>ṗ + <i>kp</i> = <i>u</i> を 4 次のルンゲ・クッタ法（刻み '+_w04_sig(s.dt*1e3,2)+' ms）で解いた。根の平面の × をドラッグすると、原点からの距離が ω<sub>n</sub>、負の実軸となす角 ψ が cos ψ = ζ になるように、つまみが変わる（ζ は 0〜1 の範囲）。破線の円は半径 ω<sub>n</sub>。</div>';
    }
    run();
  };

  /* ---- 4 節: 仕様を根の平面に描く ---- */
  REG.w04_spec=function(el,U){
    var S=U.S;
    U.head(el,"SPECIFICATION","仕様を満たす根の領域 — 行き過ぎ量と 2 % 整定時間");
    var r1=U.ctrls(el);
    var smp=U.slider(r1,"行き過ぎ量の上限",{values:[1,2,5,10,15,20,30,50],value:5,fmt:function(v){return v+" %";},onInput:function(){draw();}});
    var sts=U.slider(r1,"2 % 整定時間の上限",{values:[0.25,0.5,0.75,1,1.5,2,3,4,6],value:1,fmt:function(v){return v+" s";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var sz=U.slider(r2,"減衰比 ζ",{min:0.05,max:1,step:0.01,value:0.75,fmt:function(v){return _w04_f(v,2);},onInput:function(){draw();}});
    var sw=U.slider(r2,"固有角周波数 ω<sub>n</sub>",{min:1,max:20,log:true,value:8,fmt:function(v){return _w04_sig(v,3)+" rad/s";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var ex=U.checkbox(r3,"実際の整定時間の境目を描く（式から数値で求めた）",true,function(){draw();});
    var br=U.btnrow(el);
    function pre(z,w,keep){if(!keep){smp.set(5);sts.set(1);}sz.set(z);sw.set(w);draw();}
    U.button(br,"本文の例（5 %・1 s、C: ζ 0.75・ω<sub>n</sub> 8）",function(){pre(0.75,8);});
    U.button(br,"A: 例の台車（0.2・5）",function(){pre(0.2,5,true);});
    U.button(br,"B（0.7・5）",function(){pre(0.7,5,true);});
    U.button(br,"D（0.5・10）",function(){pre(0.5,10,true);});
    var box=U.svgbox(el),ro=U.readout(el),RP=null;
    _w04_dragRoot(U,box,function(){return RP;},[0.05,1],[1,20],function(z,w){sz.set(z);sw.set(w);draw();});
    /* 実際の 2 % 整定時間 × ω_n（ζ の表）。境目の線に使う */
    var ZT=[];for(var zz=0.05;zz<=1.0001;zz+=0.0025)ZT.push([Math.min(zz,1),_w04_index(Math.min(zz,1)).t2]);
    function draw(){
      var Mpm=smp.get()/100,Ts=sts.get(),z=sz.get(),wn=sw.get(),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var L=Math.log(Mpm),zmin=-L/Math.sqrt(Math.PI*Math.PI+L*L),slope=Math.sqrt(1-zmin*zmin)/zmin,xv=-4/Ts;
      /* 根の平面 */
      var P=U.plot(nar?56:56,24,168,252,[-24,4],[-21,21]);RP=P;
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));
      /* 目安の領域（扇形 ∩ 実部 ≤ −4/Ts） */
      var x0=P.xr[0];if(xv>x0){var ytop=Math.min(21,slope*(-xv)),pts=[[xv,-ytop],[xv,ytop]];
        if(slope*(-x0)>21){pts.push([-21/slope,21]);pts.push([x0,21]);pts.push([x0,-21]);pts.push([-21/slope,-21]);}
        else{pts.push([x0,slope*(-x0)]);pts.push([x0,-slope*(-x0)]);}
        if(-xv*slope>21){pts=[[xv,-21],[xv,21],[x0,21],[x0,-21]];}
        o.push(S.PL(pts.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"none",0,"green",null,0.16));}
      o.push(P.axes({xl:"実部",yl:"虚部",xt:[-20,-10,0],yt:[-20,-10,0,10,20],xfmt:function(v){return _w04_sig(v,3);},yfmt:function(v){return _w04_sig(v,3);},ylOff:34}));
      o.push(U.ctl.splane(P));
      var xe=Math.max(P.xr[0],-21/slope);o.push(S.L(P.X(0),P.Y(0),P.X(xe),P.Y(-xe*slope),"green",1.5,"5 3"));o.push(S.L(P.X(0),P.Y(0),P.X(xe),P.Y(xe*slope),"green",1.5,"5 3"));
      if(xv>P.xr[0])o.push(S.L(P.X(xv),P.y,P.X(xv),P.y+P.h,"green",1.5,"5 3"));
      if(ex.get()){var segs=[],cur=[],prev=null;ZT.forEach(function(q){if(q[0]<zmin-1e-9)return;var w=q[1]/Ts,re=-q[0]*w,im=w*Math.sqrt(Math.max(0,1-q[0]*q[0]));
          if(prev!==null&&Math.abs(w-prev)>0.15*Math.max(w,prev)){segs.push(cur);cur=[];}prev=w;cur.push([re,im]);});segs.push(cur);
        segs.forEach(function(sg){[1,-1].forEach(function(sn){o.push(_w04_cl2(S,P,sg.map(function(q){return q[0];}),sg.map(function(q){return sn*q[1];}),"teal",2.2,null));});});}
      var rts=_w04_roots(z,wn);
      var idx=_w04_index(z),Mp=idx.Mp,t2e=idx.t2/wn,ok1=Mp<=Mpm+1e-9,ok2=t2e<=Ts+1e-9,okA=z*wn>=4/Ts-1e-9;
      o.push(U.ctl.pz(P,rts,[],ok1&&ok2?"green":"alias",6));
      o.push(S.T(P.x+P.w,P.y-8,"× をドラッグ","end",9,"muted"));
      o.push(_w04_m(U,P.x+4,P.y+13,[["ζ",null,false],[" ≥ "+_w04_f(zmin,3),null,false]],"start",9.5,"green",true,true));
      /* ステップ応答 */
      var tEnd=Math.max(2*Ts,Math.min(6*Ts,isFinite(t2e)?1.4*t2e:6*Ts)),lf=wn,dt=Math.min(0.001,1/(20*lf)),ev=Math.max(1,Math.round(tEnd/500/dt));
      var sim=_w04_simStep(U,z,wn,1,tEnd,dt,ev),ymx=Math.max(1.25,1+Mp+0.1);
      var Q=U.plot(nar?50:300,nar?P.y+P.h+60:24,nar?334:380,nar?140:180,[0,tEnd],[0,ymx]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"y ÷ 最終値",xt:_w04_ticks(U,0,tEnd,5),yt:_w04_ticks(U,0,ymx,4),xfmt:function(q){return _w04_sig(q,3);},yfmt:function(q){return _w04_sig(q,3);},ylOff:nar?34:40}));
      o.push(S.RECT(Q.X(Math.min(Ts,tEnd)),Q.Y(1.02),Q.X(tEnd)-Q.X(Math.min(Ts,tEnd)),Q.Y(0.98)-Q.Y(1.02),0,"green","green",0.8,null,' fill-opacity="0.25"'));
      o.push(S.L(Q.X(Ts),Q.y,Q.X(Ts),Q.y+Q.h,"green",1.2,"4 3"));
      o.push(S.L(Q.x,Q.Y(1+Mpm),Q.x+Q.w,Q.Y(1+Mpm),"alias",1,"3 3"));
      o.push(Q.line([[0,1],[tEnd,1]],"muted",1,"4 3"));
      o.push(_w04_cl(Q,sim.T.map(function(q,i){return [q,sim.Y[i]];}),ok1&&ok2?"green":"alias",2.2));
      o.push(S.T(Q.x+Q.w-2,Q.Y(1+Mpm)-4,"行き過ぎ量 "+smp.get()+" %","end",9,"alias",false,false,null,true));
      o.push(_w04_m(U,Q.X(Ts)+4,Q.y+12,[["t","2%",true],[" = "+Ts+" s",null,false]],"start",9,"green",true,true));
      box.set(S.svg(Wd,(nar?Q.y+Q.h+44:Math.max(P.y+P.h+46,Q.y+Q.h+44)),o));
      /* 読み出し */
      function mark(ok){return ok?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>';}
      var h="仕様: 行き過ぎ量 "+smp.get()+" % 以下 → ζ ≥ <b>"+_w04_f(zmin,3)+"</b>（根が負の実軸となす角 "+_w04_f(Math.acos(zmin)*180/Math.PI,1)+"° 以下）。2 % 整定時間 "+Ts+" s 以下 → 目安の式で ζω<sub>n</sub> ≥ "+_w04_sig(4/Ts,3)+"（実部 "+_w04_sig(-4/Ts,3)+" 以下）<br>";
      h+="選んだ根: <b>"+_w04_rootTxt(z,wn)+"</b>（ζ "+_w04_f(z,2)+"、ω<sub>n</sub> "+_w04_sig(wn,3)+" rad/s）<br>";
      h+="式の値: 行き過ぎ量 "+(z<1?_w04_p3(Mp*100)+" %、ピーク時間 π/ω<sub>d</sub> = "+_w04_p3(Math.PI/(wn*Math.sqrt(1-z*z)))+" s":"0 %")+"、2 % 整定時間の目安 4/(ζω<sub>n</sub>) = "+_w04_p3(4/(z*wn))+" s<br>";
      h+="数値計算の値: 行き過ぎ量 <b>"+(sim.Mp>1e-6?_w04_p3(sim.Mp*100):"0")+" %</b>、立ち上がり時間 "+(sim.tr!==null?_w04_p3(sim.tr)+" s":"—")+"、2 % 整定時間 <b>"+(isFinite(sim.t2)?_w04_p3(sim.t2)+" s":"表示の範囲で収まらない")+"</b><br>";
      h+="判定: 行き過ぎ量 "+mark(ok1)+"、2 % 整定時間 "+mark(ok2)+(ok1&&ok2?'（<span class="ok">両方を満たす</span>）':"")+"<br>";
      if(okA!==ok2)h+='<span class="warn">目安の式（縦の線）では'+(okA?"満たす":"満たさない")+'が、実際の整定時間では'+(ok2?"満たす":"満たさない")+'。目安は包絡線から求めた値なので、境目の近くでは外れる</span><br>';
      ro.innerHTML=h+'<div class="wnote">緑に塗った領域は、行き過ぎ量の条件（2 本の破線の間）と、目安の式の整定時間の条件（縦の破線の左）を両方満たす所。青緑の実線は、扇形の中で、実際の 2 % 整定時間がちょうど上限になる根の位置で、ζ によって段になる（その線より原点から遠い根が、実際に満たす）。応答は 4 次のルンゲ・クッタ法（刻み '+_w04_sig(dt*1e3,2)+' ms）で計算した。</div>';
    }
    draw();
  };

  /* ---- 5 節: 位相平面 ---- */
  REG.w04_phase=function(el,U){
    var S=U.S;
    U.head(el,"PHASE PLANE","位相平面 — 初めの位置と速度をドラッグして、軌跡と波形を見る");
    var r1=U.ctrls(el);
    var sz=U.slider(r1,"減衰比 ζ",{min:0,max:3,step:0.01,value:0.2,fmt:function(v){return _w04_f(v,2);},onInput:function(){run();}});
    var sw=U.slider(r1,"固有角周波数 ω<sub>n</sub>",{min:1,max:20,log:true,value:5,fmt:function(v){return _w04_sig(v,3)+" rad/s";},onInput:function(){run();}});
    var md=U.select(r1,"力",["加えない（自由な動き）","押し続ける（最終値 4 cm のステップ）"],0,function(){run();});
    var r2=U.ctrls(el);
    var st=U.slider(r2,"時刻",{min:0,max:1,step:0.002,value:0.3,fmt:function(v){return R?_w04_f(v*R.tEnd,2)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.004;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(z,m,p0,v0){tk.stop();sz.set(z);sw.set(5);md.set(m);cur=[p0,v0];olds=[];st.set(0.3);run();}
    U.button(br,"本文の例（ζ 0.2・4 cm から離す）",function(){pre(0.2,0,4,0);});
    U.button(br,"ζ = 0（楕円）",function(){pre(0,0,4,0);});
    U.button(br,"ζ = 2（結節）",function(){pre(2,0,4,0);});
    U.button(br,"ステップ応答（原点から押し続ける）",function(){pre(0.2,1,0,0);});
    U.button(br,"前の軌跡を消す",function(){olds=[];run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null,PP=null,cur=[4,0],olds=[];
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!PP)return;
      if(type==="down"){if(!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
        olds.push(cur.slice());if(olds.length>6)olds.shift();}
      var p=Math.max(-6,Math.min(6,PP.ux(x))),v=Math.max(PP.yr[0],Math.min(PP.yr[1],PP.uy(y)));
      cur=[Math.round(p*10)/10,Math.round(v*2)/2];tk.stop();st.set(0.3);run();});
    function traj(z,wn,mode,p0,v0,tEnd){
      var k=wn*wn,c=2*z*wn,u=mode===1?k*4:0,lf=z>1?wn*(z+Math.sqrt(z*z-1)):wn,dt=Math.min(0.002,1/(20*lf)),n=Math.round(tEnd/dt),ev=Math.max(1,Math.round(n/1500));
      var f=function(t,x){return [x[1],u-c*x[1]-k*x[0]];},x=[p0,v0],T=[],P=[],V=[];
      for(var i=0;i<=n;i++){if(i%ev===0){T.push(i*dt);P.push(x[0]);V.push(x[1]);}x=U.ctl.rk4(f,i*dt,x,dt);}
      return {T:T,P:P,V:V,dt:dt};
    }
    function run(){
      var z=sz.get(),wn=sw.get(),mode=md.get(),tEnd=Math.min(30,Math.max(6,30/wn));
      var main=traj(z,wn,mode,cur[0],cur[1],tEnd),others=olds.map(function(q){return traj(z,wn,mode,q[0],q[1],tEnd);});
      R={z:z,wn:wn,mode:mode,tEnd:tEnd,main:main,others:others,p0:cur[0],v0:cur[1]};
      st.set(st.get());draw();
    }
    function draw(){
      if(!R)return;var s=R,nar=_w04_nar(box),Wd=nar?400:700,o=[],vm=6*s.wn,pe=s.mode===1?4:0;
      var P=U.plot(nar?60:60,22,nar?300:280,nar?300:280,[-6,6],[-vm,vm]);PP=P;
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));
      o.push(P.axes({xl:"位置 p [cm]",yl:"速度 ṗ [cm/s]",xt:[-6,-4,-2,0,2,4,6],yt:_w04_ticks(U,-vm,vm,4),xfmt:function(v){return _w04_sig(v,3);},yfmt:function(v){return _w04_sig(v,3);},ylOff:44}));
      o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"muted",1));
      /* 向きの場 */
      var k=s.wn*s.wn,c=2*s.z*s.wn,u=s.mode===1?k*4:0;
      for(var i=1;i<=11;i++)for(var j=1;j<=11;j++){var a=-6+12*i/12,b=-vm+2*vm*j/12,da=b,db=u-c*b-k*a,dx=P.X(a+da*1e-4)-P.X(a),dy=P.Y(b+db*1e-4)-P.Y(b),Ln=Math.hypot(dx,dy);
        if(Ln<1e-12)continue;var ux=dx/Ln*5,uy=dy/Ln*5,xx=P.X(a),yy=P.Y(b);o.push(S.L(xx-ux,yy-uy,xx+ux,yy+uy,"faint",1));o.push(S.head(xx-ux,yy-uy,xx+ux*1.35,yy+uy*1.35,"faint",4));}
      /* 過減衰の直線 */
      if(s.z>1){var r=Math.sqrt(s.z*s.z-1),l1=-s.wn*(s.z-r),l2=-s.wn*(s.z+r);
        [[l1,"gold","遅い根"],[l2,"purple","速い根"]].forEach(function(q){var xa=Math.min(6,vm/Math.abs(q[0]));
          o.push(S.L(P.X(pe-xa),P.Y(-q[0]*xa),P.X(pe+xa),P.Y(q[0]*xa),q[1],1.5,"6 3"));});}
      if(s.mode===1){o.push(S.CIRC(P.X(4),P.Y(0),5,"green",2,"screen"));}
      else o.push(S.CIRC(P.X(0),P.Y(0),5,"green",2,"screen"));
      s.others.forEach(function(tr){o.push(_w04_cl2(S,P,tr.P,tr.V,"muted",1.4,null));o.push(S.D(P.X(tr.P[0]),P.Y(tr.V[0]),"muted",3));});
      o.push(_w04_cl2(S,P,s.main.P,s.main.V,"signal",2.2,null));
      o.push(S.CIRC(P.X(s.p0),P.Y(s.v0),6,"signal",1.6,"screen"));
      var t=st.get()*s.tEnd,ix=Math.max(0,Math.min(s.main.T.length-1,Math.round(t/(s.main.T[1]-s.main.T[0])))),pn=s.main.P[ix],vn=s.main.V[ix];
      if(pn>=-6&&pn<=6&&vn>=-vm&&vn<=vm)o.push(S.D(P.X(pn),P.Y(vn),"gold",5));
      o.push(S.T(P.x+P.w,P.y-7,"ドラッグで初めの位置と速度","end",9,"muted"));
      /* 時間の波形 */
      var qx=nar?60:420,qw=nar?320:260,qy=nar?P.y+P.h+56:22;
      var Q1=U.plot(qx,qy,qw,nar?100:118,[0,s.tEnd],[-6.5,8.5]),Q2=U.plot(qx,qy+(nar?140:160),qw,nar?100:118,[0,s.tEnd],[-vm,vm]);
      o.push(Q1.axes({xl:null,yl:"p [cm]",xt:_w04_ticks(U,0,s.tEnd,5),yt:[-4,0,4,8],xfmt:function(){return "";},ylOff:34}));
      o.push(Q1.line([[0,0],[s.tEnd,0]],"faint",1));if(s.mode===1)o.push(Q1.line([[0,4],[s.tEnd,4]],"green",1,"4 3"));
      o.push(_w04_cl(Q1,s.main.T.map(function(q,i){return [q,s.main.P[i]];}),"signal",2));
      o.push(Q2.axes({xl:"時間 t [s]",yl:"ṗ [cm/s]",xt:_w04_ticks(U,0,s.tEnd,5),yt:_w04_ticks(U,-vm,vm,4),xfmt:function(q){return _w04_sig(q,3);},yfmt:function(q){return _w04_sig(q,3);},ylOff:34}));
      o.push(Q2.line([[0,0],[s.tEnd,0]],"faint",1));
      o.push(_w04_cl(Q2,s.main.T.map(function(q,i){return [q,s.main.V[i]];}),"purple",2));
      [Q1,Q2].forEach(function(Q){o.push(S.L(Q.X(t),Q.y,Q.X(t),Q.y+Q.h,"gold",1.1,"3 3"));});
      if(pn>=-6.5&&pn<=8.5)o.push(S.D(Q1.X(t),Q1.Y(pn),"gold",4));if(vn>=-vm&&vn<=vm)o.push(S.D(Q2.X(t),Q2.Y(vn),"gold",4));
      box.set(S.svg(Wd,(nar?Q2.y+Q2.h+42:Math.max(P.y+P.h+44,Q2.y+Q2.h+42)),o));
      /* 読み出し */
      var z=s.z,wn=s.wn,shape=z<=0?"楕円（閉じた曲線を回り続ける）":(z<1?"渦巻き（回りながら平衡点へ）":"結節（回らずに平衡点へ）");
      var ext=[];for(var q=1;q<s.main.V.length&&ext.length<4;q++){if((s.main.V[q-1]>0&&s.main.V[q]<=0)||(s.main.V[q-1]<0&&s.main.V[q]>=0))ext.push(_w04_f(s.main.P[q],2)+" cm（"+_w04_f(s.main.T[q],2)+" s）");}
      var vmax=-1,tv=0;s.main.V.forEach(function(v,i){if(Math.abs(v)>vmax){vmax=Math.abs(v);tv=s.main.T[i];}});
      var h="初めの位置 <b>"+_w04_f(s.p0,1)+" cm</b>、速度 <b>"+_w04_f(s.v0,1)+" cm/s</b>。特性根 "+_w04_rootTxt(z,wn)+" → 軌跡の形: <b>"+shape+"</b><br>";
      h+="時刻 "+_w04_f(t,2)+" s: 位置 "+_w04_f(pn,2)+" cm、速度 "+_w04_f(vn,2)+" cm/s";
      if(s.mode===0){var E0=0.5*Math.pow(s.v0/100,2)+0.5*wn*wn*Math.pow(s.p0/100,2),Et=0.5*Math.pow(vn/100,2)+0.5*wn*wn*Math.pow(pn/100,2);
        h+="、エネルギー <i>E</i> = "+_w04_sig(Et*1e3,3)+" mJ（初め "+_w04_sig(E0*1e3,3)+" mJ）";}
      h+="<br>横軸を横切る点（速度が 0。波形の山と谷）: "+(ext.length?ext.join("、"):"なし")+"<br>";
      h+="速さ（速度の大きさ）の最大: "+_w04_f(vmax,2)+" cm/s（"+_w04_f(tv,2)+" s）";
      ro.innerHTML=h+'<div class="wnote">台車（質量 1 kg、<i>k</i> = ω<sub>n</sub>²、<i>c</i> = 2ζω<sub>n</sub>）の式を 4 次のルンゲ・クッタ法で解いた。速度の目盛は位置の目盛の ω<sub>n</sub> 倍にとってあるので、減衰が無いと円になる。灰色は前に選んだ初めの点からの軌跡（今の ζ・ω<sub>n</sub> で計算し直す）、金の点は今の時刻の位置と速度。過減衰では、遅い根（金）と速い根（紫）の直線を破線で描く。<i>E</i> は運動のエネルギーとばねのエネルギーの和。</div>';
    }
    run();
  };

  /* ---- 6 節: モータの位置の P 制御 ---- */
  REG.w04_motorpos=function(el,U){
    var S=U.S,Tm=0.05,Km=50,Ra=2,La=1e-3,Kt=0.02,J=1e-5;
    U.head(el,"POSITION CONTROL","モータの角度の比例制御 — 軸の動く絵・角度と電圧・特性根");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{min:0.01,max:50,log:true,value:0.21,fmt:function(v){return _w04_sig(v,3)+" V/rad";},onInput:function(){run();}});
    var rr=U.slider(r1,"目標の角度 <i>r</i>",{values:[0.5,1,2,3.14],value:1,fmt:function(v){return v+" rad";},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var la=U.checkbox(r2,"<i>L</i><sub>a</sub> を含めた 3 階の式も重ねる（破線）",false,function(){run();});
    var st=U.slider(r2,"時刻",{min:0,max:1,step:0.002,value:0.3,fmt:function(v){return R?_w04_f(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.004;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function pre(k,l){tk.stop();kp.set(k);rr.set(1);la.set(!!l);st.set(0.3);run();}
    U.button(br,"本文の例（K<sub>P</sub> 0.21 V/rad）",function(){pre(0.21);});
    U.button(br,"臨界減衰（0.1）",function(){pre(0.1);});
    U.button(br,"0.05（過減衰）",function(){pre(0.05);});
    U.button(br,"1 V/rad",function(){pre(1);});
    U.button(br,"10 V/rad（L<sub>a</sub> あり）",function(){pre(10,true);});
    U.button(br,"45 V/rad（L<sub>a</sub> あり）",function(){pre(45,true);});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var K=kp.get(),r=rr.get(),wn=Math.sqrt(Km*K/Tm),z=1/(2*Math.sqrt(Km*K*Tm)),rts=_w04_roots(z,wn);
      var slow=Math.min(Math.abs(rts[0].re),Math.abs(rts[1].re)),tEnd=Math.max(1,Math.min(10,6/slow));
      /* 二次遅れ（L_a を無視） */
      var dt=Math.min(1e-4,1/(20*wn*(z>1?z+Math.sqrt(z*z-1):1))),n=Math.round(tEnd/dt),ev=Math.max(1,Math.round(n/1500)),x=[0,0],T=[],TH=[],V=[],Yf=new Float64Array(n+1);
      var f2=function(t,q){return [q[1],(Km*K*(r-q[0])-q[1])/Tm];},vmax=0;
      for(var i=0;i<=n;i++){var v=K*(r-x[0]);vmax=Math.max(vmax,Math.abs(v));Yf[i]=x[0];
        if(i%ev===0){T.push(i*dt);TH.push(x[0]);V.push(v);}x=U.ctl.rk4(f2,i*dt,x,dt);}
      var stt=_w04_stats(Yf,dt,r);
      var res={K:K,r:r,wn:wn,z:z,rts:rts,tEnd:tEnd,T:T,TH:TH,V:V,Mp:stt.Mp,tp:stt.tp,t2:stt.t2,vmax:vmax,dt:dt};
      /* L_a を含む 3 階の式 */
      if(la.get()){var d3=2e-5,n3=Math.round(tEnd/d3),e3=Math.max(1,Math.round(n3/1500)),y=[0,0,0],T3=[],TH3=[],V3=[],ym3=-1e9,blow=false,dmax=0;
        var f3=function(t,q){var vv=K*(r-q[0]);return [q[1],Kt*q[2]/J,(vv-Ra*q[2]-Kt*q[1])/La];};
        for(var i2=0;i2<=n3;i2++){if(i2%e3===0){T3.push(i2*d3);TH3.push(y[0]);V3.push(K*(r-y[0]));var w2=_w04_stepf(z,wn,i2*d3,r)[0];dmax=Math.max(dmax,Math.abs(y[0]-w2));}
          if(y[0]>ym3)ym3=y[0];if(Math.abs(y[0])>60*r){blow=true;break;}y=U.ctl.rk4(f3,i2*d3,y,d3);}
        var cp=U.ctl.poly.roots([La*J,Ra*J,Kt*Kt,Kt*K]);
        res.L3={T:T3,TH:TH3,V:V3,Mp:(ym3-r)/r,blow:blow,dmax:dmax,roots:cp};}
      R=res;st.set(st.get());draw();
    }
    function draw(){
      if(!R)return;var s=R,nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var t=st.get()*s.tEnd,ix=Math.max(0,Math.min(s.T.length-1,Math.round(t/(s.T[1]-s.T[0])))),th=s.TH[ix],vnow=s.V[ix];
      /* 軸の絵 */
      var cx=nar?96:120,cy=nar?100:104,Rd=nar?64:74;
      o.push(S.T(nar?10:14,16,"軸の角度（上から見た絵）","start",10,"ink",true));
      o.push(S.CIRC(cx,cy,Rd,"muted",1.6,"panel"));
      o.push(S.L(cx,cy,cx+Rd+10,cy,"faint",1,"3 3"));
      o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(s.r),cy-(Rd-4)*Math.sin(s.r),"muted",1.8,"5 3"));
      var arc=[];for(var a=0;a<=60;a++){var an=th*a/60;arc.push([cx+28*Math.cos(an),cy-28*Math.sin(an)]);}
      if(Math.abs(th)>0.02)o.push(S.PL(arc,"signal",1.4));
      if(s.L3){var i3=Math.max(0,Math.min(s.L3.T.length-1,Math.round(t/(s.L3.T[1]-s.L3.T[0])))),th3=s.L3.TH[i3];
        if(isFinite(th3))o.push(S.L(cx,cy,cx+(Rd-10)*Math.cos(th3),cy-(Rd-10)*Math.sin(th3),"teal",2.2,"4 3"));}
      o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(th),cy-(Rd-4)*Math.sin(th),"signal",3.5));
      o.push(S.D(cx,cy,"ink",3.6));
      o.push(_w04_m(U,cx+(Rd+8)*Math.cos(s.r),cy-(Rd+8)*Math.sin(s.r)-2,[["目標 ",null,false],["r",null,true]],Math.cos(s.r)<-0.2?"end":"start",9.5,"muted",true,true));
      o.push(_w04_m(U,cx-Rd+4,cy+Rd+18,[["θ","m",false],[" = "+_w04_f(th,3)+" rad",null,false]],"start",10,"signal",true,true));
      o.push(_w04_m(U,cx-Rd+4,cy+Rd+34,[["v",null,true],[" = "+_w04_f(vnow,2)+" V",null,false]],"start",10,"gold",true,true));
      /* 根の平面 */
      var sp=Math.max(28,2.3*Math.max(Math.abs(s.rts[0].im),Math.abs(s.rts[0].re),Math.abs(s.rts[1].re))),P=U.plot(nar?256:56,nar?24:250,nar?120:150,nar?120:150,[-0.88*sp,0.12*sp],[-sp/2,sp/2]);
      o.push(_w04_rplane(U,S,P,_w04_ticks(U,P.xr[0],P.xr[1],3),_w04_ticks(U,P.yr[0],P.yr[1],3)));
      o.push(S.L(P.X(-20),P.Y(0),P.X(0),P.Y(0),"gold",2.4));
      o.push(S.L(P.X(-10),P.y,P.X(-10),P.y+P.h,"gold",2.4));
      o.push(U.ctl.pz(P,s.rts,[],"signal",5.5));
      if(s.L3)o.push(U.ctl.pz(P,s.L3.roots,[],"teal",4.5));
      o.push(S.TX(P.x,P.y-7,nar?"特性根":"特性根（金の線: K_P を変えたときの道）","start",9,"muted"));
      /* 角度と電圧 */
      var qx=nar?50:300,qw=nar?334:380,qy=nar?Math.max(cy+Rd+48,P.y+P.h+44):24;
      var ymx=Math.max(1.2*s.r,(1+Math.max(0,s.Mp))*s.r*1.08);if(s.L3&&!s.L3.blow)ymx=Math.max(ymx,(1+Math.max(0,s.L3.Mp))*s.r*1.08);
      var Q1=U.plot(qx,qy,qw,nar?120:140,[0,s.tEnd],[0,ymx]);
      o.push(Q1.axes({xl:null,yl:"角度 [rad]",xt:_w04_ticks(U,0,s.tEnd,5),yt:_w04_ticks(U,0,ymx,4),xfmt:function(){return "";},yfmt:function(q){return _w04_sig(q,3);},ylOff:40}));
      o.push(Q1.line([[0,s.r],[s.tEnd,s.r]],"muted",1.1,"4 3"));o.push(Q1.line([[0,1.05*s.r],[s.tEnd,1.05*s.r]],"alias",0.9,"2 3"));
      if(s.L3)o.push(_w04_cl(Q1,s.L3.T.map(function(q,i){return [q,s.L3.TH[i]];}),"teal",1.6,"5 3"));
      o.push(_w04_cl(Q1,s.T.map(function(q,i){return [q,s.TH[i]];}),"signal",2.2));
      var vm=Math.max(0.1,s.K*s.r)*1.15,Q2=U.plot(qx,Q1.y+Q1.h+22,qw,nar?90:110,[0,s.tEnd],[-vm,vm]);
      o.push(Q2.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:_w04_ticks(U,0,s.tEnd,5),yt:_w04_ticks(U,-vm,vm,4),xfmt:function(q){return _w04_sig(q,3);},yfmt:function(q){return _w04_sig(q,3);},ylOff:40}));
      o.push(Q2.line([[0,0],[s.tEnd,0]],"faint",1));
      if(s.L3)o.push(_w04_cl(Q2,s.L3.T.map(function(q,i){return [q,s.L3.V[i]];}),"teal",1.4,"5 3"));
      o.push(_w04_cl(Q2,s.T.map(function(q,i){return [q,s.V[i]];}),"gold",2));
      [Q1,Q2].forEach(function(Q){o.push(S.L(Q.X(t),Q.y,Q.X(t),Q.y+Q.h,"gold",1.1,"3 3"));});
      o.push(S.T(Q1.x+Q1.w,Q1.Y(1.05*s.r)-4,"行き過ぎ量 5 %","end",9,"alias",false,false,null,true));
      box.set(S.svg(Wd,Math.max(Q2.y+Q2.h+44,P.y+P.h+44),o));
      /* 読み出し */
      var z=s.z,wn=s.wn,h="";
      h+="閉ループ（<i>L</i><sub>a</sub> を無視した二次遅れ）: ω<sub>n</sub> = √(<i>KK</i><sub>P</sub>/<i>T</i>) = <b>"+_w04_p3(wn)+" rad/s</b>、ζ = 1/(2√(<i>KK</i><sub>P</sub><i>T</i>)) = <b>"+_w04_p3(z)+"</b>、特性根 <b>"+_w04_rootTxt(z,wn)+"</b><br>";
      if(z<1)h+="式の値: 行き過ぎ量 "+_w04_p3(Math.exp(-Math.PI*z/Math.sqrt(1-z*z))*100)+" %、ピーク時間 "+_w04_p3(Math.PI/(wn*Math.sqrt(1-z*z)))+" s、2 % 整定時間の目安 4/(ζω<sub>n</sub>) = "+_w04_p3(4/(z*wn))+" s<br>";
      else h+="ζ ≥ 1 なので行き過ぎない（<i>K</i><sub>P</sub> ≤ 1/(4<i>KT</i>) = 0.1 V/rad）<br>";
      h+="数値計算: 行き過ぎ量 <b>"+(s.Mp>1e-6?_w04_p3(s.Mp*100):"0")+" %</b>"+(s.Mp>1e-4?"（"+_w04_p3(s.tp)+" s）":"")+"、2 % 整定時間 <b>"+(isFinite(s.t2)?_w04_p3(s.t2)+" s":"表示の範囲で収まらない")+"</b>、電圧の最大 "+_w04_p3(s.vmax)+" V<br>";
      if(s.vmax>12)h+='<span class="warn">電圧が電源の 12 V を超える。この計算は電圧の上限を考えていないので、実際にはこの通りには動かない（11 章 4 節）</span><br>';
      if(s.L3){var rs=s.L3.roots.map(function(q){return Math.abs(q.im)>1e-6?_w04_sig(q.re,3)+(q.im>0?" + ":" − ")+"<i>j</i>"+_w04_sig(Math.abs(q.im),3):_w04_sig(q.re,4);}).join("、"),un=s.L3.roots.some(function(q){return q.re>0;});
        h+="<i>L</i><sub>a</sub> を含む 3 階の式: 特性根 "+rs+"。"+(un||s.L3.blow?'<span class="warn">実部が正の根があり、揺れが大きくなり続ける（K<sub>P</sub> が 40 V/rad を超えると起きる）</span>':"行き過ぎ量 "+(s.L3.Mp>1e-6?_w04_p3(s.L3.Mp*100):"0")+" %、二次遅れの式との角度の差は最大 "+_w04_sig(s.L3.dmax,2)+" rad")+"<br>";}
      ro.innerHTML=h+'<div class="wnote">モータの一次の式 <i>T</i>ω̇<sub>m</sub> + ω<sub>m</sub> = <i>Kv</i>（<i>T</i> = 0.05 s、<i>K</i> = 50 (rad/s)/V）に <i>v</i> = <i>K</i><sub>P</sub>(<i>r</i> − θ<sub>m</sub>) を入れた式を、4 次のルンゲ・クッタ法（刻み '+_w04_sig(s.dt*1e3,2)+' ms）で解いた。3 階の式は、2 章 3 節の電気の式と機械の式（<i>R</i><sub>a</sub> 2 Ω、<i>L</i><sub>a</sub> 1 mH、<i>K</i><sub>t</sub> 0.02 N·m/A、<i>J</i> 1 × 10⁻⁵ kg·m²）を刻み 0.02 ms で解いた。根の平面の 3 つ目の根（約 −1980）は枠の外にあるので、端の点で示す。</div>';
    }
    run();
  };

  /* ===== 05 章 ラプラス変換 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w05_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w05_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w05_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=String(+v.toPrecision(d));return s.replace("-","−");}
  /* 複素数を "−1 + j4.9" の形に */
  function _w05_cs(re,im,d){d=d||3;if(Math.abs(im)<1e-9*(1+Math.abs(re)))return _w05_sig(re,d);var a=Math.abs(re)<1e-12?"":_w05_sig(re,d)+(im<0?" − ":" + ");
    return a+(a?"":(im<0?"−":""))+"j"+_w05_sig(Math.abs(im),d);}
  /* 範囲の外に出る所で線を切る折れ線（範囲に戻ればまた描く） */
  function _w05_cut(P,pts,c,lw,dash,S){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),out=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1];if(!isFinite(b)||a<P.xr[0]-1e-12||a>P.xr[1]+1e-12){prev=null;if(cur.length>1)out.push(cur);cur=[];return;}
      var ins=b>=lo&&b<=hi;
      if(prev){var pin=prev[1]>=lo&&prev[1]<=hi;
        if(ins&&!pin){var lim=prev[1]>hi?hi:lo,fr=(lim-prev[1])/(b-prev[1]);cur=[[prev[0]+(a-prev[0])*fr,lim]];}
        else if(pin&&!ins){var lim2=b>hi?hi:lo,fr2=(lim2-prev[1])/(b-prev[1]);cur.push([prev[0]+(a-prev[0])*fr2,lim2]);out.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=[a,b];});
    if(cur.length>1)out.push(cur);
    return out.map(function(sg){return S.PL(sg.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),c,lw,null,dash);}).join("");}
  /* 曲線と y = 0 の間を薄く塗る（範囲で切る） */
  function _w05_fill(P,pts,c,U,op){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),q=[[P.X(pts[0][0]),P.Y(0)]];
    pts.forEach(function(p){q.push([P.X(p[0]),P.Y(Math.max(lo,Math.min(hi,p[1])))]);});q.push([P.X(pts[pts.length-1][0]),P.Y(0)]);
    return '<polygon points="'+q.map(function(p){return (Math.round(p[0]*100)/100)+","+(Math.round(p[1]*100)/100);}).join(" ")+'" fill="'+U.soft(c)+'" stroke="none"'+(op!=null?' fill-opacity="'+op+'"':'')+'/>';}
  /* 添字（_x、_{xy}）と上付き（^x、^{xy}、上付きの中の _x）を書ける文字。図の _f05_tx と同じ */
  function _w05_parse(s){var out=[],buf="",i=0;s=String(s);
    while(i<s.length){var ch=s[i];
      if((ch==="_"||ch==="^")&&i+1<s.length){if(buf){out.push([buf,0]);buf="";}var kind=ch==="_"?-1:1,grp;
        if(s[i+1]==="{"){var j=s.indexOf("}",i+2);grp=s.slice(i+2,j);i=j+1;}else{grp=s[i+1];i+=2;}
        if(kind===1&&grp.indexOf("_")>=0){var b2="",k=0;while(k<grp.length){if(grp[k]==="_"&&k+1<grp.length){if(b2){out.push([b2,1]);b2="";}out.push([grp[k+1],2]);k+=2;}else{b2+=grp[k];k++;}}if(b2)out.push([b2,1]);}
        else out.push([grp,kind]);continue;}
      buf+=ch;i++;}
    if(buf)out.push([buf,0]);return out;}
  function _w05_tw(U,s,sz){return _w05_parse(s).reduce(function(w,g){return w+U.tw(g[0],sz*({"0":1,"-1":0.72,"1":0.72,"2":0.58})[g[1]]);},0);}
  function _w05_tx(U,x,y,s,a,sz,c,b,halo){sz=sz||10;var segs=_w05_parse(s),fs={"0":sz,"-1":sz*0.72,"1":sz*0.72,"2":sz*0.58},off={"0":0,"-1":sz*0.28,"1":-sz*0.42,"2":-sz*0.28};
    var w=segs.reduce(function(q,g){return q+U.tw(g[0],fs[g[1]]);},0),x0=x-(a==="middle"?w/2:(a==="end"?w:0)),cur=0;
    var h='<text x="'+x0.toFixed(2)+'" y="'+(+y).toFixed(2)+'" text-anchor="start" font-size="'+sz+'" fill="'+U.col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
      (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>';
    segs.forEach(function(g){var dy=off[g[1]]-cur;h+='<tspan'+(Math.abs(dy)>1e-9?' dy="'+dy.toFixed(2)+'"':'')+(g[1]?' font-size="'+fs[g[1]].toFixed(2)+'"':'')+'>'+U.esc(g[0])+'</tspan>';cur=off[g[1]];});
    return h+'</text>';}
  /* 根の印（×）と、重なりの数 */
  function _w05_root(S,P,z,c,m,r){var o=[],inside=z.re>=P.xr[0]&&z.re<=P.xr[1]&&z.im>=P.yr[0]&&z.im<=P.yr[1];r=r||6;
    if(inside){o.push(S.X(P.X(z.re),P.Y(z.im),r,c,2.4));if(m>1)o.push(S.T(P.X(z.re)-7,P.Y(z.im)+15,"×"+m,"end",9,c,true,false,null,true));}
    else{var xx=Math.max(P.xr[0],Math.min(P.xr[1],z.re)),yy=Math.max(P.yr[0],Math.min(P.yr[1],z.im)),X=P.X(xx),Y=P.Y(yy);
      if(z.re<P.xr[0]){o.push(S.ARR(X+16,Y,X+2,Y,c,1.6,5));o.push(S.T(X+18,Y+3.5,_w05_sig(z.re,4),"start",9,c,true,false,null,true));}
      else o.push(S.D(X,Y,c,3));}
    return o.join("");}
  /* s 平面の地（枠・右半分の薄い赤・軸と目盛） */
  function _w05_plane(U,S,P,xt,yt){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+P.axes({xl:"実部 σ [1/s]",yl:"虚部 ω [rad/s]",xt:xt,yt:yt,xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,3);},ylOff:34,sz:9})+U.ctl.splane(P);}

  /* ---- 複素数の多項式（昇べき）と、部分分数分解 ---- */
  function _w05_pmulc(cx,a,b){var o=[];for(var i=0;i<a.length+b.length-1;i++)o.push(cx.c(0,0));
    for(var i2=0;i2<a.length;i2++)for(var j=0;j<b.length;j++)o[i2+j]=cx.add(o[i2+j],cx.mul(a[i2],b[j]));return o;}
  /* 複素数の連立 1 次方程式（部分ピボットのガウスの消去法） */
  function _w05_solvec(cx,M,b){var n=M.length,A=M.map(function(r,i){return r.concat([b[i]]);});
    for(var k=0;k<n;k++){var p=k,mx=cx.abs(A[k][k]);for(var i=k+1;i<n;i++)if(cx.abs(A[i][k])>mx){mx=cx.abs(A[i][k]);p=i;}
      var t=A[k];A[k]=A[p];A[p]=t;
      for(var i2=k+1;i2<n;i2++){var f=cx.div(A[i2][k],A[k][k]);for(var j=k;j<=n;j++)A[i2][j]=cx.sub(A[i2][j],cx.mul(f,A[k][j]));}}
    var x=[];for(var i3=n-1;i3>=0;i3--){var s=A[i3][n];for(var j2=i3+1;j2<n;j2++)s=cx.sub(s,cx.mul(A[i3][j2],x[j2]));x[i3]=cx.div(s,A[i3][i3]);}
    return x;}
  /* Y(s) = N(s) / Π(s − λ_i)^{m_i} を部分分数に分ける。N は降べきの実数の係数。groups = [{lam:{re,im}, m}]。
     返り値: groups に A（[A_1, …, A_m]、A_k は 1/(s − λ)^k の係数）を足したもの */
  function _w05_pfrac(U,N,groups){var cx=U.ctl.cx,n=0;groups.forEach(function(g){n+=g.m;});
    var lin=function(l){return [cx.neg(l),cx.c(1,0)];},cols=[],keys=[];
    groups.forEach(function(g,i){for(var k=1;k<=g.m;k++){var p=[cx.c(1,0)];
      for(var e=0;e<g.m-k;e++)p=_w05_pmulc(cx,p,lin(g.lam));
      groups.forEach(function(h,j){if(j!==i)for(var e2=0;e2<h.m;e2++)p=_w05_pmulc(cx,p,lin(h.lam));});
      while(p.length<n)p.push(cx.c(0,0));cols.push(p);keys.push([i,k]);}});
    var na=N.slice().reverse(),rhs=[];for(var r=0;r<n;r++)rhs.push(cx.c(r<na.length?na[r]:0,0));
    var M=[];for(var r2=0;r2<n;r2++){var row=[];for(var c2=0;c2<n;c2++)row.push(cols[c2][r2]);M.push(row);}
    var x=_w05_solvec(cx,M,rhs),out=groups.map(function(g){return {lam:g.lam,m:g.m,A:[],c:g.c,src:g.src};});
    keys.forEach(function(kk,q){out[kk[0]].A[kk[1]-1]=x[q];});
    return out;}
  /* 部分分数の 1 つの組の時間の項（共役な組は 2 倍の実部。虚部が負の根は、組の相手に含めるので 0） */
  function _w05_term(g,t){if(g.lam.im<-1e-9)return 0;var e=Math.exp(g.lam.re*t),cs=Math.cos(g.lam.im*t),sn=Math.sin(g.lam.im*t),v=0,fac=1;
    for(var k=0;k<g.m;k++){if(k>0)fac*=k;var A=g.A[k],tk=Math.pow(t,k)/fac;v+=tk*e*(A.re*cs-A.im*sn);}
    return g.lam.im>1e-9?2*v:v;}
  /* 4 次のルンゲ・クッタ法で a_n y^(n) + … + a_0 y = b u(t) を解く（a は降べき）。返り値 [[t, y], …] */
  function _w05_ode(U,a,b,uf,ic,tEnd,n,rec){var N=a.length-1,an=a[0],x=ic.slice(),out=[[0,x[0]]],h=tEnd/n,ev=Math.max(1,Math.round(n/(rec||600)));
    function f(t,xx){var d=[];for(var i=0;i<N-1;i++)d.push(xx[i+1]);var s=b*uf(t);for(var j=0;j<N;j++)s-=a[N-j]*xx[j];d.push(s/an);return d;}
    for(var k=0;k<n;k++){x=U.ctl.rk4(f,k*h,x,h);if((k+1)%ev===0||k===n-1)out.push([(k+1)*h,x[0]]);}
    return out;}

  /* ---- 2 節: s 平面の点 λ と e^{λt} ---- */
  REG.w05_splane=function(el,U){
    var S=U.S;
    U.head(el,"S-PLANE","s 平面の点 λ と、e<sup>λt</sup> の形・変換 1/(s − λ)");
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"実部 σ<sub>0</sub>",{min:-6,max:2,step:0.05,value:-1,fmt:function(v){return _w05_f(v,2)+" 1/s";},onInput:draw});
    var om=U.slider(r1,"虚部 ω<sub>0</sub>",{min:0,max:15,step:0.05,value:4.9,fmt:function(v){return _w05_f(v,2)+" rad/s";},onInput:draw});
    var r2=U.ctrls(el);
    var tr=U.select(r2,"時間の範囲",["0〜2 s","0〜4 s","0〜10 s"],1,function(){tt.set(tt.get());draw();});
    var tt=U.slider(r2,"時刻 t",{min:0,max:1,step:0.002,value:0.25,fmt:function(v){return _w05_f(v*rng(),2)+" s";},onInput:function(){tick.stop();draw();}});
    var r3=U.ctrls(el);
    var cj=U.checkbox(r3,"共役な点 λ̄ も描く（2 つの和の半分が実部）",true,draw);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.004;if(v>=1){v=1;tick.stop();}tt.set(v);draw();},40);
    function pre(a,b){tick.stop();sg.set(a);om.set(b);tt.set(0.25);draw();}
    U.button(br,"本文の例（台車の根 −1 ± j4.90）",function(){tr.set(1);pre(-1,4.899);});
    U.button(br,"−2（台車の速度の一次遅れ）",function(){pre(-2,0);});
    U.button(br,"0（ステップ）",function(){pre(0,0);});
    U.button(br,"±j5（揺れ続ける）",function(){pre(0,5);});
    U.button(br,"+0.5（増え続ける）",function(){pre(0.5,0);});
    U.button(br,"0.3 ± j3（増えながら揺れる）",function(){pre(0.3,3);});
    var br2=U.btnrow(el);
    U.button(br2,"▶ 再生",function(){if(tt.get()>=0.999)tt.set(0);tick.start();});
    U.button(br2,"■ 止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),SP=null;
    function rng(){return [2,4,10][tr.get()];}
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!SP)return;
      var inA=x>=SP.x-4&&x<=SP.x+SP.w+4&&y>=SP.y-4&&y<=SP.y+SP.h+4;
      if(type==="down"&&!inA)return false;
      var a=Math.max(-6,Math.min(2,SP.ux(x))),b=Math.abs(SP.uy(y));b=Math.max(0,Math.min(15,b));
      if(b<0.25)b=0;if(Math.abs(a)<0.1)a=0;
      tick.stop();sg.set(Math.round(a*20)/20);om.set(Math.round(b*20)/20);draw();});
    function draw(){
      var s0=sg.get(),w0=om.get(),T=rng(),t=tt.get()*T,nar=_w05_nar(box),Wd=nar?400:700,o=[];
      /* s 平面 */
      var P=nar?U.plot(48,24,150,170,[-6.5,2.5],[-16,16]):U.plot(56,24,190,200,[-6.5,2.5],[-16,16]);SP=P;
      o.push(_w05_plane(U,S,P,[-6,-4,-2,0,2],[-15,-10,-5,0,5,10,15]));
      o.push(S.T(P.x,P.y-8,"s 平面（点をドラッグ）","start",10,"ink",true));
      if(cj.get()&&w0>0)o.push(_w05_root(S,P,{re:s0,im:-w0},"muted",1,5));
      o.push(S.CIRC(P.X(s0),P.Y(w0),10,"signal",1.2,null,"2 2"));
      o.push(_w05_root(S,P,{re:s0,im:w0},s0>0?"alias":"signal",1,6));
      o.push(_w05_tx(U,P.X(s0)+(s0>0?-12:12),P.Y(w0)-10,"λ",s0>0?"end":"start",11,s0>0?"alias":"signal",true,true));
      if(cj.get()&&w0>0)o.push(_w05_tx(U,P.X(s0)+(s0>0?-12:12),P.Y(-w0)+16,"λ̄",s0>0?"end":"start",11,"muted",true,true));
      /* 複素平面の上で回る e^{λt} */
      var cx0=nar?232:300,Q=nar?U.plot(cx0,24,150,150,[-1.8,1.8],[-1.8,1.8]):U.plot(cx0,24,180,180,[-1.8,1.8],[-1.8,1.8]);
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,0,"screen","line",0.8));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",1));o.push(S.L(Q.X(0),Q.y,Q.X(0),Q.y+Q.h,"muted",1));
      o.push(S.CIRC(Q.X(0),Q.Y(0),Q.X(1)-Q.X(0),"faint",1,null,"3 3"));
      o.push(_w05_tx(U,Q.x,Q.y-8,"e^{λt} の動き（複素平面）","start",10,"ink",true));
      o.push(S.T(Q.x+Q.w-3,Q.Y(0)-4,"実部","end",9,"muted"));o.push(S.T(Q.X(0)+4,Q.y+11,"虚部","start",9,"muted"));
      var tr1=[],tr2=[],n=400;for(var i=0;i<=n;i++){var tq=t*i/n,r=Math.exp(s0*tq);tr1.push([tq,r*Math.cos(w0*tq),r*Math.sin(w0*tq)]);}
      function cl(v){return Math.max(-1.8,Math.min(1.8,v));}
      var path1=[],path2=[];tr1.forEach(function(q){if(Math.abs(q[1])<=1.8&&Math.abs(q[2])<=1.8){path1.push([Q.X(q[1]),Q.Y(q[2])]);path2.push([Q.X(q[1]),Q.Y(-q[2])]);}});
      if(cj.get()&&w0>0&&path2.length>1)o.push(S.PL(path2,"muted",1.2,null,"4 3"));
      if(path1.length>1)o.push(S.PL(path1,"signal",1.6));
      var re=Math.exp(s0*t)*Math.cos(w0*t),im=Math.exp(s0*t)*Math.sin(w0*t),out=Math.abs(re)>1.8||Math.abs(im)>1.8;
      if(!out){o.push(S.L(Q.X(0),Q.Y(0),Q.X(re),Q.Y(im),"signal",1.4));o.push(S.D(Q.X(re),Q.Y(im),"signal",4.5));
        if(cj.get()&&w0>0){o.push(S.D(Q.X(re),Q.Y(-im),"muted",3.6));o.push(S.L(Q.X(re),Q.Y(im),Q.X(re),Q.Y(-im),"gold",1,"2 2"));}
        o.push(S.D(Q.X(re),Q.Y(0),"gold",4));}
      else o.push(S.T(Q.x+Q.w/2,Q.y+Q.h-8,"枠の外（大きさ "+_w05_sig(Math.exp(s0*t),3)+"）","middle",9,"alias",true,false,null,true));
      if(!nar){o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+40,"青: e^{λt}","start",9.5,"signal",true));
        if(cj.get()&&w0>0)o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+56,"灰: e^{λ̄t}（逆に回る）","start",9.5,"muted",true));
        o.push(S.T(Q.x+Q.w+12,Q.y+72,"金: 実部","start",9.5,"gold",true));
        o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+96,"回る速さ: ω_0","start",9.5,"muted"));
        o.push(_w05_tx(U,Q.x+Q.w+12,Q.y+112,"半径: e^{σ_0 t}","start",9.5,"muted"));}
      /* 波形 */
      var yb=(nar?P.y+P.h+60:Math.max(P.y+P.h,Q.y+Q.h)+60),pw=nar?330:610,R=U.plot(nar?52:62,yb,pw,nar?130:150,[0,T],[-2.2,2.2]);
      o.push(R.axes({xl:"時間 t [s]",yl:"e^λt の実部",xt:U.nice(0,T,5).filter(function(v){return v<=T+1e-9;}),yt:[-2,-1,0,1,2],xfmt:function(v){return _w05_sig(v,3);},ylOff:nar?36:40}));
      o.push(_w05_tx(U,R.x,R.y-8,"e^{λt} の実部 = e^{σ_0 t} cos ω_0 t（青）と包絡線 ±e^{σ_0 t}（破線）","start",10,"ink",true));
      var wv=[],env1=[],env2=[];for(var k=0;k<=800;k++){var tq2=T*k/800,e=Math.exp(s0*tq2);wv.push([tq2,e*Math.cos(w0*tq2)]);env1.push([tq2,e]);env2.push([tq2,-e]);}
      if(w0>0){o.push(_w05_cut(R,env1,"faint",1.1,"4 3",S));o.push(_w05_cut(R,env2,"faint",1.1,"4 3",S));}
      o.push(R.line([[0,0],[T,0]],"muted",1));
      o.push(_w05_cut(R,wv,s0>0?"alias":"signal",2.2,null,S));
      o.push(S.L(R.X(t),R.y,R.X(t),R.y+R.h,"gold",1.1,"3 3"));
      if(Math.abs(re)<=2.2)o.push(S.D(R.X(t),R.Y(re),"gold",4.5));
      box.set(S.svg(Wd,R.y+R.h+44,o));
      /* 読み出し */
      var h="λ = σ<sub>0</sub> + jω<sub>0</sub> = <b>"+_w05_cs(s0,w0,3)+"</b> [1/s]"+(cj.get()&&w0>0?"、共役な点 λ̄ = "+_w05_cs(s0,-w0,3):"")+"<br>";
      var shape=s0<0?'<span class="ok">減る</span>（時定数 1/|σ<sub>0</sub>| = '+_w05_sig(1/Math.abs(s0),3)+" s ごとに 0.368 倍）":(s0>0?'<span class="warn">増え続ける</span>（'+_w05_sig(Math.log(2)/s0,3)+" s ごとに 2 倍）":"振れ幅は変わらない（虚軸の上）");
      h+="e<sup>λt</sup> の実部 e<sup>σ<sub>0</sub>t</sup> cos ω<sub>0</sub>t: "+shape+"、"+(w0>0?"揺れの周期 2π/ω<sub>0</sub> = <b>"+_w05_sig(2*Math.PI/w0,3)+" s</b>":"揺れない（実軸の上）")+"<br>";
      var sp=function(v){return v===0?"s":(v<0?"s + "+_w05_sig(-v,3):"s − "+_w05_sig(v,3));},pr=function(v){return v===0?"s":"("+sp(v)+")";};
      var den1=sp(s0)+(w0>0?" − j"+_w05_sig(w0,3):"");
      h+="変換: 𝓛[e<sup>λt</sup>] = 1/(s − λ) = "+(s0===0&&w0===0?"1/s":"1/("+den1+")");
      if(w0>0)h+="。共役な組の実部: 𝓛[e<sup>σ<sub>0</sub>t</sup> cos ω<sub>0</sub>t] = "+pr(s0)+"/("+pr(s0)+"² + "+_w05_sig(w0*w0,3)+")";
      h+="<br>時刻 t = "+_w05_f(t,2)+" s: e<sup>λt</sup> = "+_w05_cs(re,im,3)+"、実部 <b>"+_w05_sig(re,3)+"</b>";
      ro.innerHTML=h+'<div class="wnote">s 平面の × をドラッグすると、横の位置 σ<sub>0</sub>（増え方・減り方）と縦の位置 ω<sub>0</sub>（揺れの速さ）が変わる。下半分に置いても、共役な点と同じ実部になるので、ω<sub>0</sub> は 0 以上として扱う。複素平面の点は、時刻 0 の 1 から出発し、角速度 ω<sub>0</sub> で回りながら、半径が e<sup>σ<sub>0</sub>t</sup> で変わる。</div>';
    }
    draw();
  };

  /* ---- 4 節: 部分分数分解 ---- */
  /* 例: N（降べき）、groups（根と重なりの数。src は "in"（入力から来た根）か "ch"（特性根））、ODE（a 降べき、b、u(t)、初期値）、表示の倍率と単位 */
  var _W05_PF=[
    {nm:"モータのステップ応答（3 章 2 節）",Ys:"Y(s) = 12000/(s(s + 20))",N:[12000],g:[[0,0,1,"in"],[-20,0,1,"ch"]],a:[0.05,1],b:50,u:function(){return 12;},ic:[0],tEnd:0.25,sc:1,un:"rad/s",chk:[[0.05,379.3],[0.1,518.8],[0.15,570.1]],ref:"3 章 2 節の表"},
    {nm:"1 節の例: 12e^{−10t} V を加える",Ys:"Y(s) = 12000/((s + 10)(s + 20))",N:[12000],g:[[-10,0,1,"in"],[-20,0,1,"ch"]],a:[0.05,1],b:50,u:function(t){return 12*Math.exp(-10*t);},ic:[0],tEnd:0.4,sc:1,un:"rad/s",chk:[[0.0693,300]],ref:"1 節の最大 300 rad/s"},
    {nm:"モータのランプ応答（3 章 3 節）",Ys:"Y(s) = 24000/(s^2(s + 20))",N:[24000],g:[[0,0,2,"in"],[-20,0,1,"ch"]],a:[0.05,1],b:50,u:function(t){return 24*t;},ic:[0],tEnd:0.5,sc:1,un:"rad/s",chk:[[0.5,540]],ref:"3 章 3 節の 0.5 s で 540"},
    {nm:"台車のステップ応答（4 章 3 節）",Ys:"Y(s) = 1/(s(s^2 + 2s + 25))",N:[1],g:[[0,0,1,"in"],[-1,Math.sqrt(24),1,"ch"],[-1,-Math.sqrt(24),1,"ch"]],a:[1,2,25],b:1,u:function(){return 1;},ic:[0,0],tEnd:5,sc:100,un:"cm",chk:[[0.6413,6.106]],ref:"4 章の 0.64 s で 6.11 cm"},
    {nm:"台車を 4 cm 引いて離す（4 章 2 節）",Ys:"Y(s) = 0.04(s + 2)/(s^2 + 2s + 25)",N:[0.04,0.08],g:[[-1,Math.sqrt(24),1,"ch"],[-1,-Math.sqrt(24),1,"ch"]],a:[1,2,25],b:0,u:function(){return 0;},ic:[0.04,0],tEnd:5,sc:100,un:"cm",chk:[[0.6413,-2.106]],ref:"4 章の 0.64 s で −2.11 cm"},
    {nm:"臨界減衰の台車（c = 10 N·s/m、4 章 3 節）",Ys:"Y(s) = 1/(s(s + 5)^2)",N:[1],g:[[0,0,1,"in"],[-5,0,2,"ch"]],a:[1,10,25],b:1,u:function(){return 1;},ic:[0,0],tEnd:3,sc:100,un:"cm",chk:[],ref:""},
    {nm:"巻線のインダクタンスを含むモータ（過減衰、4 章 3 節）",Ys:"Y(s) = 2.4×10^7/(s(s^2 + 2000s + 40000))",N:[2.4e7],g:[[0,0,1,"in"],[-1000+Math.sqrt(960000),0,1,"ch"],[-1000-Math.sqrt(960000),0,1,"ch"]],a:[1,2000,40000],b:1,u:function(){return 2.4e7;},ic:[0,0],tEnd:0.25,sc:1,un:"rad/s",chk:[[0.05,379.3]],ref:"一次の式の 0.05 s で 379.3（参考）"},
    {nm:"自分で根を置く（ステップ応答、最終値 1）",custom:true}
  ];
  REG.w05_pf=function(el,U){
    var S=U.S,cx=U.ctl.cx;
    U.head(el,"PARTIAL FRACTIONS","部分分数分解 — 分母の根ごとの項と、その和");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",_W05_PF.map(function(e){return e.nm.replace("^{−10t}","⁻¹⁰ᵗ");}),0,function(){draw();});
    ex.el.style.flex="1 1 100%";
    var rC=U.ctrls(el);
    var md=U.select(rC,"対象の根",["共役な組（揺れる）","実数 2 つ"],0,draw);
    var ca=U.slider(rC,"根の実部 σ<sub>0</sub>",{min:-6,max:1,step:0.05,value:-1,fmt:function(v){return _w05_f(v,2)+" 1/s";},onInput:draw});
    var cb=U.slider(rC,"根の虚部 ω<sub>0</sub>",{min:0.2,max:10,step:0.05,value:4.9,fmt:function(v){return _w05_f(v,2)+" rad/s";},onInput:draw});
    var la=U.slider(rC,"根 λ<sub>a</sub>",{min:-8,max:1,step:0.05,value:-1,fmt:function(v){return _w05_f(v,2);},onInput:draw});
    var lb=U.slider(rC,"根 λ<sub>b</sub>",{min:-8,max:1,step:0.05,value:-4,fmt:function(v){return _w05_f(v,2);},onInput:draw});
    var r2=U.ctrls(el);
    var nu=U.checkbox(r2,"微分方程式を数値で解いた応答を重ねる",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（モータのステップ応答）",function(){ex.set(0);draw();});
    U.button(br,"重根にする（λ<sub>a</sub> = λ<sub>b</sub>）",function(){ex.set(_W05_PF.length-1);md.set(1);lb.set(la.get());draw();});
    var box=U.svgbox(el),ro=U.readout(el),SP=null,DR=null;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){DR=null;return;}if(x==null||!SP||!_W05_PF[ex.get()].custom)return;
      var inA=x>=SP.x-4&&x<=SP.x+SP.w+4&&y>=SP.y-4&&y<=SP.y+SP.h+4;
      if(type==="down"){if(!inA)return false;
        if(md.get()===1){var da=Math.abs(SP.X(la.get())-x),db=Math.abs(SP.X(lb.get())-x);DR=da<=db?"a":"b";}else DR="c";}
      var sx=Math.round(SP.ux(x)*20)/20,sy=Math.round(Math.abs(SP.uy(y))*20)/20;
      if(DR==="c"){ca.set(Math.max(-6,Math.min(1,sx)));cb.set(Math.max(0.2,Math.min(10,sy)));}
      else if(DR==="a")la.set(Math.max(-8,Math.min(1,sx)));else if(DR==="b")lb.set(Math.max(-8,Math.min(1,sx)));
      draw();});
    var CH=["purple","teal"];
    function setup(){
      var e=_W05_PF[ex.get()];
      if(!e.custom)return e;
      var gs,a,b,Nn,Ys,lam;
      if(md.get()===0){var s0=ca.get(),w0=cb.get();gs=[[0,0,1,"in"],[s0,w0,1,"ch"],[s0,-w0,1,"ch"]];a=[1,-2*s0,s0*s0+w0*w0];b=s0*s0+w0*w0;
        Ys="Y(s) = "+_w05_sig(b,4)+"/(s((s"+(s0<=0?" + "+_w05_sig(-s0,3):" − "+_w05_sig(s0,3))+")^2 + "+_w05_sig(w0*w0,4)+"))";}
      else{var A=la.get(),B=lb.get();if(Math.abs(A-B)<0.051)B=A;
        gs=A===B?[[0,0,1,"in"],[A,0,2,"ch"]]:[[0,0,1,"in"],[A,0,1,"ch"],[B,0,1,"ch"]];a=[1,-(A+B),A*B];b=A*B;
        var fs=function(v){return v===0?"s":(v<0?"(s + "+_w05_sig(-v,3)+")":"(s − "+_w05_sig(v,3)+")");};
        Ys="Y(s) = "+_w05_sig(b,4)+"/(s"+(A===B?fs(A)+"^2":fs(A)+fs(B))+")";}
      var unst=gs.some(function(g){return g[0]>1e-9;}),slow=Math.min.apply(null,gs.filter(function(g){return g[3]==="ch";}).map(function(g){return Math.abs(g[0])||1e-3;}));
      var tEnd=Math.max(1.5,Math.min(10,unst?4:6/slow));
      return {nm:"自分で根を置く",Ys:Ys,N:[b],g:gs,a:a,b:b,u:function(){return 1;},ic:[0,0],tEnd:tEnd,sc:1,un:"",chk:[],ref:"",custom:true};
    }
    function draw(){
      var e=setup(),isC=!!_W05_PF[ex.get()].custom;
      rC.style.display=isC?"":"none";ca.el.style.display=isC&&md.get()===0?"":"none";cb.el.style.display=isC&&md.get()===0?"":"none";
      la.el.style.display=isC&&md.get()===1?"":"none";lb.el.style.display=isC&&md.get()===1?"":"none";
      var groups=e.g.map(function(q,i){return {lam:cx.c(q[0],q[1]),m:q[2],src:q[3]};}),ci=0;
      groups.forEach(function(g){if(g.src==="in")g.c="gold";else if(g.lam.im<-1e-9)g.c=null;else{g.c=CH[ci%2];ci++;}});
      groups.forEach(function(g){if(!g.c){var mate=groups.filter(function(h){return h.c&&Math.abs(h.lam.re-g.lam.re)<1e-9&&Math.abs(h.lam.im+g.lam.im)<1e-9;})[0];g.c=mate?mate.c:"purple";}});
      var pf;try{pf=_w05_pfrac(U,e.N,groups);}catch(err){pf=null;}
      var nar=_w05_nar(box),Wd=nar?400:700,o=[];
      /* s 平面: 範囲は根に合わせる */
      var res=groups.map(function(g){return g.lam.re;}),ims=groups.map(function(g){return Math.abs(g.lam.im);});
      var xr0=Math.min.apply(null,res),xr1=Math.max.apply(null,res),big=xr0<-500;
      var span=Math.max(1,xr1-Math.min(xr0,0)),lo=big?-30:Math.min(-1,xr0)-0.22*span-0.3,hi=Math.max(xr1,0)+(big?6:0.14*span+0.3),ym=Math.max(1.2,Math.max.apply(null,ims)*1.3);
      if(isC){lo=-8.5;hi=1.5;ym=11;}
      var P=nar?U.plot(48,30,140,130,[lo,hi],[-ym,ym]):U.plot(58,30,190,190,[lo,hi],[-ym,ym]);SP=P;
      o.push(_w05_plane(U,S,P,U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),U.nice(-ym,ym,4).filter(function(v){return v>=-ym&&v<=ym;})));
      o.push(S.T(P.x,P.y-10,isC?"s 平面（× をドラッグ）":"s 平面（Y(s) の分母の根）","start",10,"ink",true));
      groups.forEach(function(g){o.push(_w05_root(S,P,g.lam,g.c,g.m,6));});
      /* 時間の波形 */
      var T=e.tEnd,sc=e.sc,ts=[],k;for(k=0;k<=500;k++)ts.push(T*k/500);
      var terms=pf?pf.filter(function(g){return g.lam.im>=-1e-9;}).map(function(g){return {g:g,pts:ts.map(function(t){return [t,sc*_w05_term(g,t)];})};}):[];
      var sum=ts.map(function(t){var v=0;if(pf)pf.forEach(function(g){v+=_w05_term(g,t);});return [t,sc*v];});
      var num=nu.get()?_w05_ode(U,e.a,e.b,e.u,e.ic,T,Math.max(2000,Math.round(T*Math.max(20,20*Math.max.apply(null,groups.map(function(g){return Math.hypot(g.lam.re,g.lam.im);}))))),300).map(function(q){return [q[0],sc*q[1]];}):[];
      var all=[];sum.forEach(function(q){all.push(q[1]);});terms.forEach(function(tm){tm.pts.forEach(function(q){all.push(q[1]);});});
      var vmax=Math.max.apply(null,all),vmin=Math.min.apply(null,all);
      if(isC){vmax=Math.min(vmax,3);vmin=Math.max(vmin,-3);}
      var pad=(vmax-vmin)*0.08||1,yl0=vmin-pad,yl1=vmax+pad;
      var px=nar?52:310,py=nar?P.y+P.h+56:30,pw=nar?330:370,ph=nar?170:190;
      var Q=U.plot(px,py,pw,ph,[0,T],[yl0,yl1]);
      o.push(Q.axes({xl:"時間 t [s]",yl:e.un?"y(t) ["+e.un+"]":"y(t)",xt:U.nice(0,T,5).filter(function(v){return v<=T+1e-9;}),yt:U.nice(yl0,yl1,5).filter(function(v){return v>=yl0&&v<=yl1;}),xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,4);},ylOff:nar?40:46}));
      if(yl0<0&&yl1>0)o.push(Q.line([[0,0],[T,0]],"muted",1));
      o.push(S.T(Q.x,Q.y-10,"各項（破線、根と同じ色）と和（青）","start",10,"ink",true));
      terms.forEach(function(tm){o.push(_w05_cut(Q,tm.pts,tm.g.c,1.6,"6 3",S));});
      if(num.length)o.push(_w05_cut(Q,num,"ink",1.2,"2 3",S));
      o.push(_w05_cut(Q,sum,"signal",2.6,null,S));
      (e.chk||[]).forEach(function(c){if(c[0]<=T)o.push(S.CIRC(Q.X(c[0]),Q.Y(c[1]),4.2,"ink",1.4,"screen"));});
      var ly=Q.y+Q.h+46,lg=[["gold","6 3","入力から来た根の項"],["purple","6 3","特性根の項"],["signal",null,"和"]];if(num.length)lg.push(["ink","2 3","数値で解いた応答"]);
      if(nar){o.push(S.LEGL(18,ly,lg.slice(0,2),9.5,12));o.push(S.LEGL(18,ly+16,lg.slice(2),9.5,12));ly+=16;}else o.push(S.LEGL(18,ly,lg,9.5,14));
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      var h="<b>"+e.Ys.replace(/\^2/g,"²").replace(/\^\{?7\}?/,"⁷")+"</b>"+(e.un?"（"+(sc===100?"m。図は cm":e.un)+"）":"")+"<br>";
      if(!pf){ro.innerHTML=h+'<span class="warn">部分分数分解を計算できない</span>';return;}
      var rows=[];
      pf.forEach(function(g){
        var lam=_w05_cs(g.lam.re,g.lam.im,4),Ast=g.A.map(function(A,k){return (g.m>1?"1/(s − λ)"+(k+1>1?"<sup>"+(k+1)+"</sup>":"")+": ":"")+_w05_cs(A.re,A.im,4);}).join("、");
        var tm,ex=function(v){return Math.abs(v)<1e-12?"":"e<sup>"+(Math.abs(v+1)<1e-12?"−":(Math.abs(v-1)<1e-12?"":_w05_sig(v,4)))+"t</sup>";};
        if(g.lam.im<-1e-9)tm="（上の組の共役）";
        else if(g.lam.im>1e-9){var A=g.A[0],B=2*A.re*sc,C=-2*A.im*sc,w=_w05_sig(g.lam.im,4);
          var c1=function(v){return Math.abs(Math.abs(v)-1)<1e-9?(v<0?"−":""):_w05_sig(v,4)+" ";};
          tm=ex(g.lam.re)+"("+c1(B)+"cos "+w+"t "+(C>=0?"+ ":"− ")+(Math.abs(Math.abs(C)-1)<1e-9?"":_w05_sig(Math.abs(C),4)+" ")+"sin "+w+"t)";}
        else{tm="";g.A.forEach(function(A,k){var v=A.re*sc/(k===2?2:1),tp=k===0?"":(k===1?"t":"t²"),e1=ex(g.lam.re),body=(tp?tp:"")+(tp&&e1?"·":"")+e1;
          var mag=_w05_sig(Math.abs(v),4),piece=(body?(Math.abs(Math.abs(v)-1)<1e-12?"":mag+"·")+body:mag);
          tm+=(tm?(v<0?" − ":" + "):(v<0?"−":""))+piece;});}
        rows.push(['<span style="color:'+U.col(g.c||"purple")+'">●</span> '+lam+(g.m>1?"（"+g.m+" つ重なる）":""),g.src==="in"?"入力":"特性根",Ast,tm]);});
      h+=U.tbl(["根 λ","どこから","留数（係数）","時間の項"+(sc===100?"（cm）":"")],rows,["left","left","left","wrap"]);
      var dmax=0;if(num.length)num.forEach(function(q){var v=0;pf.forEach(function(g){v+=_w05_term(g,q[0]);});dmax=Math.max(dmax,Math.abs(sc*v-q[1]));});
      if(num.length)h+="部分分数から求めた和と、微分方程式を 4 次のルンゲ・クッタ法で解いた応答の差: 最大 "+_w05_sig(dmax,2)+(e.un?" "+e.un:"")+"<br>";
      if(e.chk&&e.chk.length)h+="○: "+e.ref+"<br>";
      var unst=groups.some(function(g){return g.src==="ch"&&g.lam.re>1e-9;});
      if(unst)h+='<span class="warn">特性根の実部が正なので、その項は増え続ける</span>';
      else if(groups.some(function(g){return g.src==="ch"&&Math.abs(g.lam.re)<1e-9;}))h+="特性根が虚軸の上にあるので、その項は消えずに残る";
      else h+='<span class="ok">特性根の実部がすべて負なので、自由な動きの項は時間とともに消える</span>';
      ro.innerHTML=h+'<div class="wnote">留数は、部分分数の形の両辺の分母を払い、s の各次の係数を比べる連立方程式で求めた（重根も同じ方法）。共役な根の組は、2 つの項を足して実数の関数にした。「自分で根を置く」は、ステップ入力（根 0）と対象の 2 つの根 λ<sub>a</sub>・λ<sub>b</sub> で、最終値が 1 になる Y(s) = λ<sub>a</sub>λ<sub>b</sub>/{s(s − λ<sub>a</sub>)(s − λ<sub>b</sub>)}。</div>';
    }
    draw();
  };

  /* ---- 5 節: 最終値の定理 ---- */
  var _W05_LA={La:1e-3,Ra:2,Kt:0.02,J:1e-5};
  var _W05_FV=[
    {nm:"モータのステップ応答（3 章）",sYn:[12000],sYd:[1,20],un:"rad/s",sc:1,tEnd:0.25,y:function(t){return 600*(1-Math.exp(-20*t));},fs:"sY(s) = 12000/(s + 20)"},
    {nm:"台車のステップ応答（4 章）",sYn:[1],sYd:[1,2,25],un:"cm",sc:100,tEnd:5,y:function(t){var w=Math.sqrt(24);return 0.04*(1-Math.exp(-t)*(Math.cos(w*t)+Math.sin(w*t)/w));},fs:"sY(s) = 1/(s² + 2s + 25)"},
    {nm:"sin 5t",sYn:[5,0],sYd:[1,0,25],un:"",sc:1,tEnd:5,y:function(t){return Math.sin(5*t);},fs:"sY(s) = 5s/(s² + 25)"},
    {nm:"e^{0.5t}（増え続ける）",sYn:[1,0],sYd:[1,-0.5],un:"",sc:1,tEnd:5,y:function(t){return Math.exp(0.5*t);},fs:"sY(s) = s/(s − 0.5)",conv:0.5},
    {nm:"モータの位置の比例制御（目標値 1 rad、4 章 6 節）",motor:true,un:"rad",sc:1}
  ];
  REG.w05_fvt=function(el,U){
    var S=U.S;
    U.head(el,"FINAL VALUE","最終値の定理が使える場合と使えない場合");
    var r1=U.ctrls(el);
    var cs=U.select(r1,"例",_W05_FV.map(function(e){return e.nm.replace("^{0.5t}","⁰·⁵ᵗ");}),4,draw);
    cs.el.style.flex="1 1 100%";
    var rM=U.ctrls(el);
    var kp=U.slider(rM,"比例ゲイン K<sub>P</sub>",{values:[0.21,0.5,1,2,5,10,20,30,35,38,40,42,45,50,60],value:50,fmt:function(v){return v+" V/rad";},onInput:draw});
    var la=U.checkbox(rM,"巻線のインダクタンス L<sub>a</sub> を含める（3 階の式）",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（K<sub>P</sub> = 50 V/rad、L<sub>a</sub> あり）",function(){cs.set(4);kp.set(50);la.set(true);draw();});
    U.button(br,"4 章 6 節の設計（K<sub>P</sub> = 0.21 V/rad）",function(){cs.set(4);kp.set(0.21);la.set(true);draw();});
    U.button(br,"境目（K<sub>P</sub> = 40 V/rad）",function(){cs.set(4);kp.set(40);la.set(true);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function model(){
      var e=_W05_FV[cs.get()];if(!e.motor)return e;
      var c=_W05_LA,K=kp.get(),useLa=la.get(),num=[c.Kt*K],den=useLa?[c.La*c.J,c.Ra*c.J,c.Kt*c.Kt,c.Kt*K]:[c.Ra*c.J,c.Kt*c.Kt,c.Kt*K];
      var a0=den[0];num=num.map(function(v){return v/a0;});den=den.map(function(v){return v/a0;});
      var rts=U.ctl.poly.roots(den),slowest=Infinity,fast=0,unst=false;rts.forEach(function(r){var m=Math.hypot(r.re,r.im);fast=Math.max(fast,m);if(r.re<-1e-9)slowest=Math.min(slowest,-r.re);else unst=true;});
      var osc=rts.filter(function(r){return Math.abs(r.im)>1e-6;}).map(function(r){return Math.abs(r.im);});
      var tEnd=unst?Math.min(1.0,Math.max(0.2,(osc.length?12*2*Math.PI/Math.max.apply(null,osc):0.5))):Math.min(2,Math.max(0.1,5/slowest));
      /* 3 階（または 2 階）の式を 4 次のルンゲ・クッタ法で解く */
      var n=Math.min(60000,Math.max(2000,Math.ceil(tEnd*fast*25))),pts=_w05_ode(U,den,num[0],function(){return 1;},den.length===4?[0,0,0]:[0,0],tEnd,n,600);
      return {nm:e.nm,sYn:num,sYd:den,un:"rad",sc:1,tEnd:tEnd,pts:pts,fs:"sY(s) = K_t K_P/("+(useLa?"L_a J s³ + ":"")+"R_a J s² + K_t² s + K_t K_P)",motor:true,useLa:useLa,K:K};
    }
    function draw(){
      var e=model(),isM=!!e.motor;rM.style.display=isM?"":"none";
      var rts=U.ctl.poly.roots(e.sYd),ok=rts.every(function(r){return r.re<-1e-9;});
      var fv=U.ctl.poly.val(e.sYn,0)/U.ctl.poly.val(e.sYd,0),iv=e.sYn.length===e.sYd.length?e.sYn[0]/e.sYd[0]:0;
      var nar=_w05_nar(box),Wd=nar?400:700,o=[],sc=e.sc;
      /* s 平面 */
      var re=rts.map(function(r){return r.re;}),im=rts.map(function(r){return Math.abs(r.im);});
      var lo,hi,ym;if(isM){lo=-30;hi=12;ym=Math.max(30,Math.max.apply(null,im)*1.25);if(!e.useLa||Math.min.apply(null,re)>-30){lo=Math.min(-12,Math.min.apply(null,re)*1.3);}}
      else{lo=Math.min(-3,Math.min.apply(null,re)*1.3);hi=Math.max(1,Math.max.apply(null,re)+0.8);ym=Math.max(3,Math.max.apply(null,im)*1.3);}
      var P=nar?U.plot(48,30,140,130,[lo,hi],[-ym,ym]):U.plot(58,30,170,170,[lo,hi],[-ym,ym]);
      o.push(_w05_plane(U,S,P,U.nice(lo,hi,3).filter(function(v){return v>=lo&&v<=hi;}),U.nice(-ym,ym,4).filter(function(v){return v>=-ym&&v<=ym;})));
      o.push(S.T(P.x,P.y-10,"sY(s) の分母の根","start",10,"ink",true));
      rts.forEach(function(r){o.push(_w05_root(S,P,r,r.re<-1e-9?"green":"alias",1,6));});
      /* 時間の応答 */
      var T=e.tEnd,pts=e.pts||(function(){var q=[];for(var k=0;k<=600;k++){var t=T*k/600;q.push([t,e.y(t)]);}return q;})();
      pts=pts.map(function(q){return [q[0],q[1]*sc];});
      var ys=pts.map(function(q){return q[1];}),ymax=Math.max(Math.max.apply(null,ys),fv*sc),ymin=Math.min(Math.min.apply(null,ys),fv*sc,0);
      var lim=isM?4.5:(cs.get()===3?6:Infinity);ymax=Math.min(ymax,lim);ymin=Math.max(ymin,-lim+(isM?2:0));
      var pad=(ymax-ymin)*0.1||1,y0=ymin-pad,y1=ymax+pad;
      var px=nar?52:290,py=nar?P.y+P.h+56:30,pw=nar?330:390,ph=nar?150:170;
      var Q=U.plot(px,py,pw,ph,[0,T],[y0,y1]);
      o.push(Q.axes({xl:"時間 t [s]",yl:e.un?"y(t) ["+e.un+"]":"y(t)",xt:U.nice(0,T,5).filter(function(v){return v<=T+1e-9;}),yt:U.nice(y0,y1,5).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,3);},ylOff:nar?38:42}));
      if(y0<0&&y1>0)o.push(Q.line([[0,0],[T,0]],"muted",1));
      o.push(Q.line([[0,fv*sc],[T,fv*sc]],ok?"green":"alias",1.8,"6 3"));
      o.push(_w05_cut(Q,pts,"signal",pts.length>800?1.4:2.2,null,S));
      o.push(S.T(Q.x+Q.w,Q.y-10,"定理の値 "+_w05_sig(fv*sc,4)+(e.un?" "+e.un:"")+(ok?"（正しい）":"（誤り）"),"end",10,ok?"green":"alias",true));
      /* sY(s) を実数の s に対して */
      var sy0=nar?Q.y+Q.h+64:Math.max(P.y+P.h,Q.y+Q.h)+64,R=U.plot(nar?52:290,sy0,nar?330:390,nar?110:120,[0.01,1000],[0,1],{xlog:true});
      var sv=[],k2;for(k2=0;k2<=300;k2++){var s=Math.pow(10,-2+5*k2/300),v=U.ctl.poly.val(e.sYn,s)/U.ctl.poly.val(e.sYd,s);sv.push([s,v*sc]);}
      var sv2=sv.filter(function(q){return !e.conv||q[0]>e.conv*1.02;}),vv=sv2.map(function(q){return q[1];});
      var r0=Math.min(0,Math.min.apply(null,vv)),r1=Math.max(Math.max.apply(null,vv),fv*sc);if(e.conv){r1=Math.min(r1,6);}var pd=(r1-r0)*0.1||0.5;
      R=U.plot(R.x,R.y,R.w,R.h,[0.01,1000],[r0-pd,r1+pd],{xlog:true});
      if(e.conv)o.push(S.RECT(R.x,R.y,R.X(e.conv)-R.x,R.h,0,U.soft("alias"),"none",0));
      o.push(R.axes({xl:"s [1/s]（実数）",yl:"sY(s)",xt:[0.01,0.1,1,10,100,1000],yt:U.nice(r0-pd,r1+pd,3).filter(function(v){return v>=r0-pd&&v<=r1+pd;}),xfmt:function(v){return _w05_sig(v,3);},yfmt:function(v){return _w05_sig(v,3);},ylOff:nar?38:42}));
      o.push(R.line([[0.01,fv*sc],[1000,fv*sc]],ok?"green":"alias",1.4,"6 3"));
      o.push(_w05_cut(R,sv2,"gold",2.2,null,S));
      o.push(S.T(R.x,R.y-8,"実数の s に対する sY(s)（左端 s → 0 が定理の値）","start",10,"ink",true));
      if(e.conv)o.push(S.T(R.x+4,R.y+R.h-6,"積分が有限にならない範囲","start",9,"alias",true,false,null,true));
      if(!nar){o.push(S.T(P.x,P.y+P.h+46,ok?"実部がすべて負: 使える":"実部が 0 以上の根がある:","start",10,ok?"green":"alias",true));if(!ok)o.push(S.T(P.x,P.y+P.h+62,"使えない","start",10,"alias",true));}
      box.set(S.svg(Wd,R.y+R.h+44,o));
      /* 読み出し */
      var h="<b>"+e.fs.replace(/K_t/g,"K<sub>t</sub>").replace(/K_P/g,"K<sub>P</sub>").replace(/L_a/g,"L<sub>a</sub>").replace(/R_a/g,"R<sub>a</sub>")+"</b>"+(sc===100?"（m。図は cm）":"")+"<br>";
      h+="分母の根: "+rts.map(function(r){return '<span style="color:'+U.col(r.re<-1e-9?"green":"alias")+'">'+_w05_cs(r.re,r.im,4)+"</span>";}).join("、")+"<br>";
      h+="最終値の定理: lim<sub>s→0</sub> sY(s) = <b>"+_w05_sig(fv*sc,4)+(e.un?" "+e.un:"")+"</b> → "+(ok?'<span class="ok">根の実部がすべて負なので使える</span>':'<span class="warn">実部が 0 以上の根があるので使えない</span>')+"<br>";
      var tail=pts.filter(function(q){return q[0]>=T*0.8;}).map(function(q){return q[1];}),tmx=Math.max.apply(null,tail),tmn=Math.min.apply(null,tail);
      var beh=ok?"最後の 2 割の範囲 "+_w05_sig(tmn,4)+"〜"+_w05_sig(tmx,4)+"（落ち着いていく）":(rts.some(function(r){return r.re>1e-9;})?"振れ幅が増え続ける":"揺れ続け、落ち着かない");
      h+="y(t) の様子（"+_w05_sig(T,3)+" s まで）: "+beh+"<br>";
      h+="初期値の定理: lim<sub>s→∞</sub> sY(s) = "+_w05_sig(iv*sc,3)+" = y(0⁺)";
      if(isM){var c=_W05_LA;h+="<br>K<sub>P</sub> = "+e.K+" V/rad: "+(e.useLa?(e.K<40?"40 V/rad より小さいので、3 つの根の実部はすべて負":(e.K===40?"ちょうど境目。根 ±j200 が虚軸の上にあり、揺れ続ける":"40 V/rad を超えたので、共役な組の実部が正")):"L<sub>a</sub> を無視した二次遅れの式では、どの K<sub>P</sub> でも根の実部は −10 で負");}
      ro.innerHTML=h+'<div class="wnote">y(t) は、'+(isM?'閉ループの微分方程式を 4 次のルンゲ・クッタ法で解いた。':'4 節の方法で時間の関数に戻した式。')+'下の段は、実数の s に対する sY(s) で、2 節の「重みを付けた面積」から見ると、時刻 1/s のあたりの y(t) の重み付きの平均である。'+(e.conv?'e<sup>0.5t</sup> の変換は s > 0.5 でしか積分が有限にならない（赤い範囲では sY(s) の式に意味が無い）。':'')+'</div>';
    }
    draw();
  };

  /* ---- 6 節: 畳み込み ---- */
  var _W05_SYS=[
    {nm:"台車の速度（一次遅れ、T = 0.5 s）",g:function(t){return t<0?0:Math.exp(-2*t);},un:"m/s",sc:1,gu:"(m/s)/(N·s)",ode:"fo",L:0,Gs:"G(s) = 0.5/(0.5s + 1) = 1/(s + 2)"},
    {nm:"台車とばね・ダンパ（二次遅れ、位置）",g:function(t){var w=Math.sqrt(24);return t<0?0:Math.exp(-t)*Math.sin(w*t)/w;},un:"cm",sc:100,gu:"m/(N·s)",ode:"so",L:0,Gs:"G(s) = 1/(s² + 2s + 25)"},
    {nm:"台車の速度＋むだ時間 0.5 s",g:function(t){return t<0.5?0:Math.exp(-2*(t-0.5));},un:"m/s",sc:1,gu:"(m/s)/(N·s)",ode:"fo",L:0.5,Gs:"G(s) = e^{−0.5s}/(s + 2)"}
  ];
  var _W05_IN=[
    {nm:"三角（0 → 2 N → 0、本文の例）",u:function(t){return t<0||t>=2?0:(t<1?2*t:2*(2-t));},br:[0,1,2],Us:"U(s) = 2(1 − e^{−s})²/s²"},
    {nm:"ステップ 1 N",u:function(t){return t<0?0:1;},br:[0],Us:"U(s) = 1/s"},
    {nm:"パルス 2 N を 1 s（3 章 3 節）",u:function(t){return t<0||t>=1?0:2;},br:[0,1],Us:"U(s) = 2(1 − e^{−s})/s"},
    {nm:"方形波（1 N と 0 を 1 s ごと）",u:function(t){return t<0?0:(Math.floor(t)%2===0?1:0);},br:[0,1,2,3,4,5,6],Us:"U(s) = 1/(s(1 + e^{−s}))"},
    {nm:"ランプ 0.5 N/s",u:function(t){return t<0?0:0.5*t;},br:[0],Us:"U(s) = 0.5/s²"}
  ];
  REG.w05_conv=function(el,U){
    var S=U.S,TE=6;
    U.head(el,"CONVOLUTION","畳み込み — 入力を裏返してずらし、インパルス応答と掛けて面積をとる");
    var r1=U.ctrls(el);
    var sy=U.select(r1,"対象",_W05_SYS.map(function(e){return e.nm;}),0,function(){sim();});
    var ip=U.select(r1,"入力（押す力）",_W05_IN.map(function(e){return e.nm;}),0,function(){sim();});
    var r2=U.ctrls(el);
    var tt=U.slider(r2,"時刻 t",{min:0,max:TE,step:0.01,value:1.5,fmt:function(v){return _w05_f(v,2)+" s";},onInput:function(){tick.stop();draw();}});
    tt.el.style.flex="1 1 100%";
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.03;if(v>=TE){v=TE;tick.stop();}tt.set(v);draw();},40);
    U.button(br,"本文の例（台車の速度・三角、t = 1.5 s）",function(){tick.stop();sy.set(0);ip.set(0);tt.set(1.5);sim();});
    U.button(br,"▶ 再生（0 から）",function(){tt.set(0);draw();tick.start();});
    U.button(br,"■ 止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),Y=null;
    /* 微分方程式を 4 次のルンゲ・クッタ法で解く（畳み込みの値と比べるため） */
    function sim(){
      var s=_W05_SYS[sy.get()],u0=_W05_IN[ip.get()].u,h=0.0005,n=Math.round(TE/h),out=[[0,0]],x=[0,0],t0=0;
      /* 入力の段が刻みの境目に来ても、刻みの中の値を使うように、始めと終わりの点では内側から読む */
      var u=function(tt){var te=tt;if(Math.abs(tt-t0)<1e-12)te=tt+1e-9;else if(Math.abs(tt-t0-h)<1e-12)te=tt-1e-9;return u0(te-s.L);};
      var f=s.ode==="fo"?function(t,q){return [(0.5*u(t)-q[0])/0.5,0];}:function(t,q){return [q[1],u(t)-2*q[1]-25*q[0]];};
      for(var k=0;k<n;k++){t0=k*h;x=U.ctl.rk4(f,t0,x,h);if((k+1)%20===0)out.push([(k+1)*h,x[0]*s.sc]);}
      Y=out;draw();
    }
    /* 畳み込みの積分: 入力の段・折れ目と、g の始まりの時刻で区切り、区間ごとにシンプソンの公式で積分する */
    function conv(s,inp,t){if(t<=0)return 0;var bp=[0,t];if(s.L>0&&s.L<t)bp.push(s.L);
      (inp.br||[]).forEach(function(d){var a=t-d;if(a>0&&a<t)bp.push(a);});
      bp.sort(function(a,b){return a-b;});var v=0;
      for(var i=0;i+1<bp.length;i++){var a=bp[i],b=bp[i+1];if(b-a<1e-12)continue;var m=64,h=(b-a)/m,acc=0;
        for(var k=0;k<=m;k++){var x=a+k*h;if(k===0)x+=1e-12;if(k===m)x-=1e-12;var w=(k===0||k===m)?1:(k%2?4:2);acc+=w*s.g(x)*inp.u(t-x);}
        v+=acc*h/3;}
      return v*s.sc;}
    function draw(){
      if(!Y)return;
      var s=_W05_SYS[sy.get()],inp=_W05_IN[ip.get()],u=inp.u,t=tt.get(),nar=_w05_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?52:62,pw=nar?330:610,taus=[],k;for(k=0;k<=600;k++)taus.push(TE*k/600);
      /* 上: g(τ) と u(t − τ)（高さをそろえて描く） */
      var gmax=0,umax=0;taus.forEach(function(a){gmax=Math.max(gmax,Math.abs(s.g(a)));});for(k=0;k<=600;k++)umax=Math.max(umax,Math.abs(u(TE*k/600)));umax=umax||1;
      var A=U.plot(x0,26,pw,nar?80:90,[0,TE],[-0.15,1.15]);
      o.push(A.axes({yl:null,xt:[0,1,2,3,4,5,6],yt:[0,1],xfmt:function(){return "";},yfmt:function(){return "";}}));
      o.push(_w05_tx(U,A.x,A.y-10,nar?"g(τ)（紫）と、裏返してずらした入力 u(t − τ)（金）":"g(τ)（紫、インパルス応答）と u(t − τ)（金、入力を裏返して t ずらしたもの）。高さはそろえた","start",nar?9:10,"ink",true));
      o.push(A.line(taus.map(function(a){return [a,s.g(a)/gmax];}),"purple",2));
      var us=[];taus.forEach(function(a){us.push([a,u(t-a)/umax]);});
      o.push(_w05_cut(A,us,"gold",2,"5 3",S));
      o.push(S.L(A.X(t),A.y,A.X(t),A.y+A.h,"gold",1,"3 3"));o.push(S.T(A.X(t)+3,A.y+10,"τ = t（入力の始まり）","start",9,"gold",false,false,null,true));
      /* 中: 積 */
      var pr=taus.filter(function(a){return a<=t;}).map(function(a){return [a,s.g(a)*u(t-a)*s.sc];});pr.push([t,s.g(t)*u(0)*s.sc]);
      var pv=pr.map(function(q){return q[1];}),pmax=Math.max(0.05,Math.max.apply(null,pv.concat([0]))),pmin=Math.min(0,Math.min.apply(null,pv.concat([0])));
      var B=U.plot(x0,A.y+A.h+36,pw,nar?80:90,[0,TE],[pmin*1.15,pmax*1.15]);
      o.push(B.axes({xl:"τ [s]（何秒前か）",yl:null,xt:[0,1,2,3,4,5,6],yt:U.nice(pmin,pmax,2).filter(function(v){return v>=pmin*1.15&&v<=pmax*1.15;}),xfmt:function(v){return String(v);},yfmt:function(v){return _w05_sig(v,2);}}));
      if(pr.length>1){o.push(_w05_fill(B,pr,"signal",U,0.9));o.push(B.line(pr,"signal",2));}
      var yc=conv(s,inp,t);
      o.push(S.T(B.x+B.w,B.y-6,"積 g(τ)u(t − τ) の面積 = "+_w05_f(yc,3)+" "+s.un,"end",10,"signal",true));
      /* 下: y(t) */
      var yv=Y.map(function(q){return q[1];}),ymx=Math.max.apply(null,yv),ymn=Math.min(0,Math.min.apply(null,yv)),pd=(ymx-ymn)*0.1||0.1;
      var C=U.plot(x0,B.y+B.h+58,pw,nar?110:120,[0,TE],[ymn-pd,ymx+pd]);
      o.push(C.axes({xl:"時間 t [s]",yl:"y ["+s.un+"]",xt:[0,1,2,3,4,5,6],yt:U.nice(ymn-pd,ymx+pd,4).filter(function(v){return v>=ymn-pd&&v<=ymx+pd;}),xfmt:function(v){return String(v);},yfmt:function(v){return _w05_sig(v,3);},ylOff:nar?36:40}));
      o.push(S.T(C.x,C.y-10,nar?"出力 y(t)（青: 畳み込み、点線: 微分方程式の解）":"出力 y(t)（青: 時刻 t まで描いた畳み込み、点線: 微分方程式の解）","start",nar?9:10,"ink",true));
      o.push(C.line(Y,"faint",1.4,"2 3"));
      o.push(C.line(Y.filter(function(q){return q[0]<=t+1e-9;}),"signal",2.4));
      o.push(S.D(C.X(t),C.Y(yc),"signal",5));
      box.set(S.svg(Wd,C.y+C.h+40,o));
      var yo=Y[Math.min(Y.length-1,Math.round(t/0.01))][1];
      var h="時刻 t = "+_w05_f(t,2)+" s: 畳み込み ∫ g(τ)u(t − τ)dτ = <b>"+_w05_f(yc,3)+" "+s.un+"</b>、微分方程式を数値で解いた値 "+_w05_f(yo,3)+" "+s.un+"<br>";
      h+="変換すると掛け算: Y(s) = G(s)U(s)。"+s.Gs.replace("e^{−0.5s}","e<sup>−0.5s</sup>")+"、"+inp.Us.replace(/e\^\{(.*?)\}/g,"e<sup>$1</sup>")+"<br>";
      h+="インパルス応答 g(t) の単位は "+s.gu+(s.L?"。むだ時間の分だけ g(τ) が遅れて始まる（τ < "+s.L+" s では 0）ので、直前の "+s.L+" s の間に加えた入力は、まだ出力に効かない":"");
      ro.innerHTML=h+'<div class="wnote">τ は「何秒前か」を表す。τ 秒前の入力 u(t − τ) に、対象がそれを覚えている重み g(τ) を掛けて足し合わせたもの（積の面積）が、時刻 t の出力になる。初期値は 0。面積は、入力の段や折れ目で区切ったシンプソンの公式で、微分方程式は 4 次のルンゲ・クッタ法（刻み幅 0.5 ms）で求めた。</div>';
    }
    sim();
  };

  /* ===== 06 章 伝達関数と極・零点 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w06_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w06_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w06_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=v.toExponential(1);return s.replace(/^-/,"−");}
  /* 複素数（{re, im}） */
  function _w06_c(re,im){return {re:re,im:im||0};}
  function _w06_add(a,b){return {re:a.re+b.re,im:a.im+b.im};}
  function _w06_sub(a,b){return {re:a.re-b.re,im:a.im-b.im};}
  function _w06_mul(a,b){return {re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re};}
  function _w06_div(a,b){var d=b.re*b.re+b.im*b.im;return {re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};}
  function _w06_sc(a,k){return {re:a.re*k,im:a.im*k};}
  function _w06_exp(a){var e=Math.exp(a.re);return {re:e*Math.cos(a.im),im:e*Math.sin(a.im)};}
  function _w06_abs(a){return Math.hypot(a.re,a.im);}
  /* 有効数字 d 桁（末尾の 0 を残す。例 4.90） */
  function _w06_p3(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace(/^-/,"−");}
  /* 極の文字（例 −1 ± j4.90、−2、±j5） */
  function _w06_ptxt(re,im,d,trim){d=d||3;var F=trim?_w06_sig:_w06_p3,r=Math.abs(re)<1e-9?"":F(re,d);
    if(Math.abs(im)<1e-9)return Math.abs(re)<1e-9?"0":r;
    return (r?r+" ± ":"±")+"<i>j</i>"+F(Math.abs(im),d);}
  /* 原点から点 (a, b) の向きへ引いた半直線を、グラフの枠で切った線分の端（値の座標） */
  function _w06_ray(P,a,b){var x0=Math.min(P.xr[0],P.xr[1]),y0=Math.min(P.yr[0],P.yr[1]),y1=Math.max(P.yr[0],P.yr[1]),k=1e9;
    if(a<0)k=Math.min(k,x0/a);if(b>0)k=Math.min(k,y1/b);if(b<0)k=Math.min(k,y0/b);return [a*k,b*k];}
  /* 同じ値の極をまとめる（重根）。返り値 [{p, m}] */
  function _w06_groups(ps){var gs=[];ps.forEach(function(p){var g=null;gs.forEach(function(q){if(Math.abs(q.p.re-p.re)<1e-9&&Math.abs(q.p.im-p.im)<1e-9)g=q;});if(g)g.m++;else gs.push({p:_w06_c(p.re,p.im),m:1});});return gs;}
  /* h の多項式（昇べき、複素係数）に (a + h) を掛ける */
  function _w06_pm1(P,a){var o=[],i;for(i=0;i<=P.length;i++)o.push(_w06_c(0,0));for(i=0;i<P.length;i++){o[i]=_w06_add(o[i],_w06_mul(P[i],a));o[i+1]=_w06_add(o[i+1],P[i]);}return o;}
  /* 級数の割り算 N/D（昇べき）の始めの K 項 */
  function _w06_sdiv(N,D,K){var q=[];for(var k=0;k<K;k++){var s=k<N.length?N[k]:_w06_c(0,0);for(var j=1;j<=k;j++)if(j<D.length)s=_w06_sub(s,_w06_mul(D[j],q[k-j]));q.push(_w06_div(s,D[0]));}return q;}
  /* G(s) = k Π(s − z)/Π(s − p)（厳密にプロパー）の部分分数。各まとまり g に、1/(s − p)^j の係数 g.c[j−1] を付ける */
  function _w06_pf(k,ps,zs){var gs=_w06_groups(ps);
    gs.forEach(function(g){var N=[_w06_c(k,0)];zs.forEach(function(z){N=_w06_pm1(N,_w06_sub(g.p,z));});
      var D=[_w06_c(1,0)];gs.forEach(function(o){if(o===g)return;for(var r=0;r<o.m;r++)D=_w06_pm1(D,_w06_sub(g.p,o.p));});
      var a=_w06_sdiv(N,D,g.m);g.c=[];for(var j=1;j<=g.m;j++)g.c.push(a[g.m-j]);});
    return gs;}
  /* まとまり g の項の値（複素数）: Σ c_j t^{j−1}/(j−1)! e^{pt} */
  function _w06_term(g,t){var e=_w06_exp(_w06_c(g.p.re*t,g.p.im*t)),s=_w06_c(0,0),f=1;for(var j=1;j<=g.m;j++){if(j>2)f*=(j-1);s=_w06_add(s,_w06_sc(g.c[j-1],Math.pow(t,j-1)/f));}return _w06_mul(s,e);}
  /* 根の並び（複素数）から実係数の多項式 */
  function _w06_poly(U,rs){return rs.length?U.ctl.poly.fromRoots(rs.map(function(r){return {re:r.re,im:r.im};})):[1];}
  /* 最終値 1 の極の組のステップ応答（本文 3 節）。w = 0 なら実の極 1 つ（sg = 0 なら積分） */
  function _w06_pstep(sg,w,t){if(w>1e-9)return 1-Math.exp(sg*t)*(Math.cos(w*t)-(sg/w)*Math.sin(w*t));if(Math.abs(sg)<1e-12)return t;return 1-Math.exp(sg*t);}
  /* 刻み dt の列 Y（最終値 1）から指標を読む */
  function _w06_stats(T,Y,yf){var n=Y.length,im=0,last=-1,t10=null,t90=null,ymin=0,imin=0;
    for(var i=0;i<n;i++){if(Y[i]>Y[im])im=i;if(Y[i]<ymin){ymin=Y[i];imin=i;}if(Math.abs(Y[i]-yf)>0.02*Math.abs(yf))last=i;
      if(t10===null&&Y[i]>=0.1*yf)t10=T[i];if(t90===null&&Y[i]>=0.9*yf)t90=T[i];}
    return {ymax:Y[im],tp:T[im],Mp:(Y[im]-yf)/yf,ymin:ymin,tmin:T[imin],t2:last<0?0:(last>=n-1?Infinity:T[last+1]),tr:(t10!==null&&t90!==null)?t90-t10:null};}
  /* グラフの範囲で切った線（Plot の clip） */
  function _w06_cl(P,T,Y,c,lw,dash){var pts=[];for(var i=0;i<T.length;i++)pts.push([T[i],Y[i]]);return P.clip(pts,c,lw,dash);}
  /* s 平面の地 */
  function _w06_sp(U,S,P,xt,yt,lab){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+U.ctl.splane(P)+P.axes({xl:lab===false?null:"実部 σ [1/s]",yl:lab===false?null:"虚部 ω [rad/s]",xt:xt,yt:yt,xfmt:function(v){return _w06_sig(v,3);},yfmt:function(v){return _w06_sig(v,3);},ylOff:34})+U.ctl.splane(P,{rhp:false});}

  /* ---- 3 節: 極の組の位置と応答（s 平面の格子） ---- */
  REG.w06_grid=function(el,U){
    var S=U.S;
    U.head(el,"POLE MAP","極の組の位置と応答 — s 平面の格子");
    var r1=U.ctrls(el);
    var ssg=U.slider(r1,"実部 σ<sub>0</sub>",{min:-4,max:1,step:0.05,value:-1,fmt:function(v){return _w06_f(v,2)+" /s";},onInput:function(){draw();}});
    var sw=U.slider(r1,"虚部 ω<sub>0</sub>",{min:0,max:10,step:0.05,value:4.899,fmt:function(v){return _w06_f(v,2)+" rad/s";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var snap=U.checkbox(r2,"格子の点に吸い付ける（0.5 /s・1 rad/s ごと）",true);
    var tw=U.select(r2,"時間の範囲",["0〜4 s","0〜8 s","0〜16 s"],1,function(){draw();});
    var br=U.btnrow(el);
    function pre(a,b){ssg.set(a);sw.set(b);draw();}
    U.button(br,"本文の例（台車 −1 ± j4.90）",function(){pre(-1,4.899);});
    U.button(br,"実の極 −2",function(){pre(-2,0);});
    U.button(br,"−2.5 ± j4.33（ζ 0.5）",function(){pre(-2.5,4.330);});
    U.button(br,"虚軸の上 ±j5",function(){pre(0,5);});
    U.button(br,"原点（積分）",function(){pre(0,0);});
    U.button(br,"実部が正 0.3 ± j4",function(){pre(0.3,4);});
    var br2=U.btnrow(el);
    U.button(br2,"この応答を残して比べる",function(){if(cur){refs.push(cur);if(refs.length>4)refs.shift();draw();}});
    U.button(br2,"残した応答を消す",function(){refs=[];draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,cur=null,refs=[],RC=["teal","purple","gold","green"];
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
      var a=Math.max(-4,Math.min(1,PP.ux(x))),b=Math.min(10,Math.abs(PP.uy(y)));
      if(snap.get()){a=Math.round(a*2)/2;b=Math.round(b);}
      ssg.set(+a.toFixed(3));sw.set(+b.toFixed(3));draw();});
    function draw(){
      var sg=ssg.get(),w=sw.get();if(w<0.025)w=0;if(Math.abs(sg)<0.0005)sg=0;
      var tend=[4,8,16][tw.get()],N=1200,T=[],Y=[],H=[],E=[];
      for(var i=0;i<=N;i++){var t=tend*i/N;T.push(t);Y.push(_w06_pstep(sg,w,t));H.push(Math.exp(sg*t)*Math.cos(w*t));E.push(Math.exp(sg*t));}
      cur={sg:sg,w:w,T:T,Y:Y,H:H,tend:tend};
      var nar=_w06_nar(box),Wd=nar?400:700,o=[];
      /* s 平面 */
      var px=nar?52:56,py=nar?20:20,P=U.plot(px,py,nar?330:224,nar?190:268,[-4.3,1.3],[-10.6,10.6]);PP=P;
      o.push(_w06_sp(U,S,P,[-4,-3,-2,-1,0,1],[-10,-5,0,5,10]));
      for(var gs=-4;gs<=1.001;gs+=0.5)for(var gw=0;gw<=10;gw+=1)o.push(S.D(P.X(gs),P.Y(gw),"faint",1.1));
      if(w>0){o.push(S.L(P.X(sg),P.y,P.X(sg),P.y+P.h,"gold",1,"4 3"));o.push(S.L(P.x,P.Y(w),P.x+P.w,P.Y(w),"gold",1,"4 3"));
        if(sg<0){var e2=_w06_ray(P,sg,w);o.push(S.L(P.X(0),P.Y(0),P.X(e2[0]),P.Y(e2[1]),"faint",1,"2 3"));}}
      refs.forEach(function(rf,j){var ps=rf.w>0?[{re:rf.sg,im:rf.w},{re:rf.sg,im:-rf.w}]:[{re:rf.sg,im:0}];o.push(U.ctl.pz(P,ps,[],RC[j%4],4));});
      var c=sg<0?"signal":(sg===0?"gold":"alias");
      o.push(U.ctl.pz(P,w>0?[{re:sg,im:w},{re:sg,im:-w}]:[{re:sg,im:0}],[],c,6.5));
      o.push(S.T(P.x+P.w,P.y-6,"× をドラッグ（下半分は鏡像）","end",9,"muted"));
      /* 項の形と、ステップ応答 */
      var qx=nar?52:356,qw=nar?330:324,qy=nar?py+P.h+58:24;
      var Q=U.plot(qx,qy,qw,nar?100:104,[0,tend],[-1.6,1.6]);
      o.push(Q.axes({xl:null,yl:null,xt:U.nice(0,tend,4),yt:[-1,0,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));
      o.push(S.TX(Q.x,Q.y-6,w>0?"極の組の項の形 e^{σ₀t} cos ω₀t（破線は包絡線 ±e^{σ₀t}）":"極の項の形 e^{σ₀t}","start",9.5,"ink",true));
      refs.forEach(function(rf,j){if(rf.tend===tend)o.push(_w06_cl(Q,rf.T,rf.H,RC[j%4],1.2,"5 3"));});
      if(w>0){o.push(_w06_cl(Q,T,E,c,1,"4 3"));o.push(_w06_cl(Q,T,E.map(function(v){return -v;}),c,1,"4 3"));}
      o.push(_w06_cl(Q,T,H,c,2));
      var Q2=U.plot(qx,qy+(nar?140:150),qw,nar?110:114,[0,tend],[-0.4,2.2]);
      o.push(Q2.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,4),yt:[0,0.5,1,1.5,2],xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.RECT(Q2.x,Q2.Y(1.02),Q2.w,Q2.Y(0.98)-Q2.Y(1.02),0,"var(--green-soft)","none",0));
      o.push(Q2.line([[0,1],[tend,1]],"muted",1,"4 3"));
      o.push(S.T(Q2.x,Q2.y-6,"G(0) = 1 のステップ応答（緑の帯は 1 ± 2 %）","start",9.5,"ink",true));
      refs.forEach(function(rf,j){if(rf.tend===tend)o.push(_w06_cl(Q2,rf.T,rf.Y,RC[j%4],1.2,"5 3"));});
      o.push(_w06_cl(Q2,T,Y,c,2.2));
      var st=_w06_stats(T,Y,1);
      if(sg<0&&w>0&&st.tp<tend*0.98){o.push(S.D(Q2.X(st.tp),Q2.Y(Math.min(2.2,st.ymax)),c,3.5));}
      box.set(S.svg(Wd,qy+(nar?140:150)+(nar?110:114)+40,o));
      /* 読み出し */
      var h="",wn=Math.hypot(sg,w);
      h+="極: <b>"+_w06_ptxt(sg,w,3)+"</b>";
      if(w>0&&sg<0)h+="。原点からの距離 ω<sub>n</sub> = "+_w06_sig(wn,3)+" rad/s、減衰比 ζ = cos ψ = "+_w06_f(-sg/wn,3);
      h+="<br>";
      if(sg<0){h+="包絡線の時定数 1/|σ<sub>0</sub>| = "+_w06_sig(-1/sg,3)+" s、2 % 整定時間の目安 4/|σ<sub>0</sub>| = <b>"+_w06_sig(-4/sg,3)+" s</b>（数値 "+(isFinite(st.t2)?_w06_sig(st.t2,3)+" s":"この範囲では落ち着かない")+"）<br>";}
      if(w>0){h+="揺れの周期 2π/ω<sub>0</sub> = "+_w06_sig(2*Math.PI/w,3)+" s";
        if(sg<0){var mp=Math.exp(Math.PI*sg/w);h+="、ピーク時間 π/ω<sub>0</sub> = "+_w06_sig(Math.PI/w,3)+" s、行き過ぎ量 e<sup>πσ₀/ω₀</sup> = <b>"+_w06_sig(mp*100,3)+" %</b>（数値 "+_w06_sig(st.Mp*100,3)+" %）";}
        h+="<br>";}
      if(sg<0)h+='<span class="ok">実部が負: 項は減り、応答は最終値に落ち着く</span>';
      else if(sg===0)h+=w>0?'<span class="warn">虚軸の上: 項は同じ振幅で揺れ続ける（ステップ応答は 0 と 2 の間を往復）</span>':'<span class="warn">原点: 項は減らず、ステップ応答は一定の速さで増え続ける（積分）</span>';
      else h+='<span class="warn">実部が正: 項は '+_w06_sig(Math.LN2/sg,3)+' s ごとに 2 倍になり、応答は 1 から離れていく</span>';
      ro.innerHTML=h+'<div class="wnote">極の組 σ<sub>0</sub> ± jω<sub>0</sub> をもち、G(0) = 1 の二次遅れ ω<sub>n</sub>²/(s² − 2σ<sub>0</sub>s + ω<sub>n</sub>²)（ω<sub>n</sub>² = σ<sub>0</sub>² + ω<sub>0</sub>²）の応答。虚部が 0 のときは、実の極 1 つの一次遅れ（原点では積分 1/s）として描く。応答は本文 3 節の式で計算した。</div>';
    }
    draw();
  };

  /* ---- 4 節: 極と零点を足す・動かす — 極ごとの項と安定 ---- */
  /* グラフの縦の範囲: 始めの 1/4 の大きさの 4 倍までに抑える（増え続ける応答も形が見えるように） */
  function _w06_yr(T,Y){var tq=T[T.length-1]*0.25,A=0,B=0,mn=0,i;
    for(i=0;i<T.length;i++){var a=Math.abs(Y[i]);if(isFinite(a)){if(T[i]<=tq)A=Math.max(A,a);B=Math.max(B,a);mn=Math.min(mn,Y[i]);}}
    var M=Math.min(B,4*Math.max(A,1e-9));if(!(M>0))M=1;
    return mn>-0.05*M?[-0.1*M,1.15*M]:[-1.15*M,1.15*M];}
  REG.w06_poles=function(el,U){
    var S=U.S,RC=["teal","purple","gold","green","alias","signal"];
    U.head(el,"POLES & ZEROS","極と零点を足す・動かす — 極ごとの項と安定");
    var r1=U.ctrls(el);
    var inp=U.select(r1,"有界な入力",["単位ステップ","正弦波（振幅 1）"],0,function(){draw();});
    var swu=U.slider(r1,"正弦波の角周波数 ω<sub>u</sub>",{min:0.2,max:8,step:0.1,value:2,fmt:function(v){return _w06_f(v,1)+" rad/s";},onInput:function(){draw();}});
    var tw=U.select(r1,"時間の範囲",["0〜5 s","0〜10 s","0〜20 s"],1,function(){draw();});
    var br=U.btnrow(el);
    var items=[],sel=-1,msg="";
    function npo(){var n=0;items.forEach(function(it){if(it.k==="p")n+=it.pair?2:1;});return n;}
    function nze(){var n=0;items.forEach(function(it){if(it.k==="z")n+=it.pair?2:1;});return n;}
    function add(k,pair,re,im){var np=npo(),nz=nze(),d=pair?2:1;msg="";
      if(k==="p"&&np+d>6){msg="極は 6 個までにしている";draw();return;}
      if(k==="z"&&nz+d>np-1){msg="厳密にプロパーに保つため、零点は極より少なくしている（極を先に足す）";draw();return;}
      items.push({k:k,pair:pair,re:re,im:pair?im:0});sel=items.length-1;draw();}
    U.button(br,"実の極を足す",function(){add("p",false,-1.5,0);});
    U.button(br,"極の組を足す",function(){add("p",true,-0.8,2.5);});
    U.button(br,"実の零点を足す",function(){add("z",false,-4,0);});
    U.button(br,"零点の組を足す",function(){add("z",true,-2,1.5);});
    U.button(br,"選んだものを消す",function(){msg="";if(sel>=0){items.splice(sel,1);sel=-1;while(nze()>Math.max(0,npo()-1)){for(var i=items.length-1;i>=0;i--)if(items[i].k==="z"){items.splice(i,1);break;}msg="極より少なくなるよう、零点も消した";}}draw();});
    var br2=U.btnrow(el);
    function preset(a){items=a.map(function(x){return {k:x[0],pair:x[1],re:x[2],im:x[3]||0};});sel=-1;items.forEach(function(it,i){if(sel<0&&it.k==="p"&&it.pair)sel=i;});msg="";draw();}
    U.button(br2,"本文の例（2 節の例）",function(){preset([["p",false,-3],["p",true,-1,2],["z",false,-2]]);});
    U.button(br2,"安定限界（±j3 と −1）",function(){preset([["p",true,0,3],["p",false,-1]]);inp.set(1);swu.set(3);draw();});
    U.button(br2,"右半平面の極 +0.3 を足す",function(){preset([["p",false,-3],["p",true,-1,2],["z",false,-2],["p",false,0.3]]);});
    U.button(br2,"虚軸の上に重なった極",function(){preset([["p",true,0,2],["p",true,0,2],["p",false,-2]]);});
    U.button(br2,"零点を右半平面へ",function(){preset([["p",false,-3],["p",true,-1,2],["z",false,1.5]]);});
    var r2=U.ctrls(el);
    var sre=U.slider(r2,"選んだ極・零点の実部 σ",{min:-6,max:3,step:0.05,value:-1,fmt:function(v){return _w06_f(v,2)+" /s";},onInput:function(v){if(sel<0||sel>=items.length)return;items[sel].re=v;draw();}});
    var sim=U.slider(r2,"選んだ組の虚部 ω",{min:0,max:6,step:0.05,value:2,fmt:function(v){return _w06_f(v,2)+" rad/s";},onInput:function(v){if(sel<0||sel>=items.length||!items[sel].pair)return;items[sel].im=v;draw();}});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,drag=-1;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){drag=-1;return;}
      if(x==null||!PP)return;
      if(type==="down"){var best=-1,bd=16;
        items.forEach(function(it,i){var xs=PP.X(it.re),ys=[PP.Y(it.im)];if(it.pair)ys.push(PP.Y(-it.im));ys.forEach(function(yy){var d=Math.hypot(x-xs,y-yy);if(d<bd){bd=d;best=i;}});});
        if(best<0){if(x>=PP.x&&x<=PP.x+PP.w&&y>=PP.y&&y<=PP.y+PP.h){sel=-1;draw();}return false;}
        sel=best;drag=best;draw();return;}
      if(drag<0)return;
      var it=items[drag],re=Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x)));
      if(Math.abs(re)<0.12)re=0;
      if(it.pair){var im=Math.min(PP.yr[1],Math.abs(PP.uy(y)));if(im<0.15)im=0;it.im=im;}
      else{items.forEach(function(o2,j){if(j!==drag&&o2.k===it.k&&(!o2.pair||o2.im===0)&&Math.abs(o2.re-re)<0.12)re=o2.re;});}
      it.re=+re.toFixed(4);if(it.pair)it.im=+it.im.toFixed(4);draw();});
    function draw(){
      swu.el.style.display=inp.get()===1?"":"none";
      var has=sel>=0&&sel<items.length;sre.input.disabled=!has;sim.input.disabled=!(has&&items[sel].pair);
      if(has){sre.set(items[sel].re);if(items[sel].pair)sim.set(items[sel].im);}
      var ps=[],zs=[],owner=[];
      items.forEach(function(it,i){var arr=it.k==="p"?ps:zs;arr.push(_w06_c(it.re,it.im));if(it.k==="p")owner.push(i);if(it.pair){arr.push(_w06_c(it.re,-it.im));if(it.k==="p")owner.push(i);}});
      var nar=_w06_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:236,nar?200:262,[-6,3],[-6,6]);PP=P;
      o.push(_w06_sp(U,S,P,[-6,-4,-2,0,2],[-6,-4,-2,0,2,4,6]));
      var tend=[5,10,20][tw.get()],N=800,T=[],i;
      for(i=0;i<=N;i++)T.push(tend*i/N);
      var gs=[],k=1,G=null,ok=ps.length>0;
      if(ok){var kp=_w06_c(1,0),kz=_w06_c(1,0);ps.forEach(function(p){if(_w06_abs(p)>1e-12)kp=_w06_mul(kp,_w06_sc(p,-1));});zs.forEach(function(z){if(_w06_abs(z)>1e-12)kz=_w06_mul(kz,_w06_sc(z,-1));});
        k=_w06_div(kp,kz).re;gs=_w06_pf(k,ps,zs);
        var num=U.ctl.poly.scale(_w06_poly(U,zs),k),den=_w06_poly(U,ps);G=U.ctl.tf(num,den);}
      /* 極ごとの項（共役な組はまとめて実数にする） */
      var terms=[],tot=T.map(function(){return 0;});
      gs.forEach(function(g){if(g.p.im<-1e-12)return;var f=g.p.im>1e-12?2:1,Y=T.map(function(t){return f*_w06_term(g,t).re;});terms.push({g:g,Y:Y});Y.forEach(function(v,j){tot[j]+=v;});});
      /* 極の色: まとまりの順 */
      var colOf=function(p){for(var q=0;q<terms.length;q++){var g=terms[q].g;if(Math.abs(g.p.re-p.re)<1e-9&&Math.abs(Math.abs(g.p.im)-Math.abs(p.im))<1e-9)return RC[q%4];}return "signal";};
      items.forEach(function(it,i){var c=it.k==="z"?"muted":colOf(it),pts=[_w06_c(it.re,it.im)];if(it.pair)pts.push(_w06_c(it.re,-it.im));
        o.push(it.k==="p"?U.ctl.pz(P,pts,[],c,6):U.ctl.pz(P,[],pts,c,5.5));
        if(i===sel)pts.forEach(function(q){o.push(S.CIRC(P.X(q.re),P.Y(q.im),11,"ink",1.2,null,"3 2"));});});
      gs.forEach(function(g){if(g.m>1&&g.p.im>=0)o.push(S.T(P.X(g.p.re)+9,P.Y(g.p.im)-8,"×"+g.m,"start",9.5,"ink",true,false,null,true));});
      o.push(S.T(P.x+P.w,P.y-6,"押して選び、ドラッグかつまみで動かす","end",9,"muted"));
      /* インパルス応答 */
      var qx=nar?52:350,qw=nar?330:330,qy=nar?20+P.h+58:24;
      var yr=ok?_w06_yr(T,tot):[-1,1];terms.forEach(function(tm){var r=_w06_yr(T,tm.Y);yr=[Math.min(yr[0],Math.max(r[0],-3*(yr[1]-yr[0]))),Math.max(yr[1],Math.min(r[1],3*(yr[1]-yr[0])))];});
      var Q=U.plot(qx,qy,qw,nar?110:112,[0,tend],yr);
      o.push(Q.axes({xl:null,yl:null,xt:U.nice(0,tend,5),yt:U.nice(yr[0],yr[1],4),xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));
      o.push(S.T(Q.x,Q.y-6,"インパルス応答（色は極ごとの項、青は和）","start",9.5,"ink",true));
      terms.forEach(function(tm,q){o.push(_w06_cl(Q,T,tm.Y,RC[q%4],1.4,"5 3"));});
      if(ok)o.push(_w06_cl(Q,T,tot,"signal",2.2));
      /* 有界な入力への応答 */
      var Y2=[],U2=[],wu=swu.get(),isS=inp.get()===1;
      if(ok){var r=U.ctl.lsim(G,function(t){return isS?Math.sin(wu*t):1;},tend,N);Y2=r.y;U2=T.map(function(t){return isS?Math.sin(wu*t):1;});}
      var yr2=ok?_w06_yr(T,Y2):[-1,1];yr2=isS?[Math.min(yr2[0],-1.1),Math.max(yr2[1],1.1)]:[Math.min(yr2[0],-0.1),Math.max(yr2[1],1.15)];
      var Q2=U.plot(qx,qy+(nar?150:154),qw,nar?110:112,[0,tend],yr2);
      o.push(Q2.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,5),yt:U.nice(yr2[0],yr2[1],4),xfmt:function(v){return String(v);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q2.x,Q2.Y(0),Q2.x+Q2.w,Q2.Y(0),"muted",0.9));
      o.push(S.T(Q2.x,Q2.y-6,(isS?"正弦波":"単位ステップ")+"（破線）への応答","start",9.5,"ink",true));
      if(ok){o.push(_w06_cl(Q2,T,U2,"muted",1.1,"4 3"));o.push(_w06_cl(Q2,T,Y2,"signal",2));}
      box.set(S.svg(Wd,qy+(nar?150:154)+(nar?110:112)+40,o));
      /* 読み出し */
      var h="";
      if(!ok){ro.innerHTML='<span class="warn">極がない。「実の極を足す」か「極の組を足す」で極を置く</span>'+(msg?"<br>"+msg:"");return;}
      var rhp=false,ax=0,axr=false;gs.forEach(function(g){if(g.p.re>1e-9)rhp=true;else if(Math.abs(g.p.re)<=1e-9){ax++;if(g.m>1)axr=true;}});
      var pl=[],zl=[];items.forEach(function(it){(it.k==="p"?pl:zl).push(_w06_ptxt(it.re,it.im,3,true));});
      h+="極: "+pl.join("、")+(zl.length?"　零点: "+zl.join("、"):"　零点: なし")+"（"+ps.length+" 次。G(0) が 1 になるよう定数を選んだ）<br>";
      var area=0;for(i=1;i<T.length;i++)area+=0.5*(Math.abs(tot[i])+Math.abs(tot[i-1]))*(T[i]-T[i-1]);
      var ymax=0;Y2.forEach(function(v){ymax=Math.max(ymax,Math.abs(v));});
      if(rhp)h+='<span class="warn">不安定: 右半平面に極がある。その項が限りなく大きくなる</span>';
      else if(axr)h+='<span class="warn">不安定: 虚軸の上に重なった極がある（t に比例して増える項）</span>';
      else if(ax)h+='<span class="warn">安定限界: 虚軸の上に極がある。インパルス応答は減らず、同じ角周波数の正弦波で応答が増え続ける</span>';
      else h+='<span class="ok">安定: すべての極が左半平面にある</span>';
      h+="<br>この範囲の ∫|g| dt = "+_w06_sig(area,3)+(rhp||ax?"（範囲を延ばすと増え続ける）":"（範囲を延ばしても有限の値に近づく）")+"、"+(isS?"正弦波":"ステップ")+"への応答の |y| の最大 = "+_w06_sig(ymax,3);
      ro.innerHTML=h+(msg?'<br><span class="warn">'+msg+'</span>':"")+'<div class="wnote">極ごとの項は、部分分数分解（重なった極は te<sup>pt</sup> などの項も）で求めた式の値。有界な入力への応答は、伝達関数を零次ホールドで離散化して求めた。実軸の近く・虚軸の近く・ほかの実の極の近くに動かすと、その上に吸い付く。零点をどこに置いても、安定かどうかの判定は変わらない。</div>';
    }
    preset([["p",false,-3],["p",true,-1,2],["z",false,-2]]);
  };

  /* ---- 5 節: 零点の位置と、行き過ぎ・逆応答 ---- */
  REG.w06_zero=function(el,U){
    var S=U.S;
    var BASES=[{name:"モータの位置の比例制御",sg:-10,w:Math.sqrt(110),tend:0.6,xr:[-40,40],yr:[-16,16],xt:[-40,-20,0,20,40],yt:[-10,0,10]},
               {name:"台車とばね・ダンパ",sg:-1,w:Math.sqrt(24),tend:4,xr:[-15,15],yr:[-7,7],xt:[-15,-10,-5,0,5,10,15],yt:[-5,0,5]}];
    U.head(el,"ZERO","零点の位置と、行き過ぎ・逆応答");
    var r1=U.ctrls(el);
    var bs=U.select(r1,"もとの二次遅れ",["モータの位置の比例制御（極 −10 ± j10.49）","台車とばね・ダンパ（極 −1 ± j4.90）"],0,function(){draw();});
    var sq=U.slider(r1,"零点の位置（ω<sub>n</sub>/z<sub>1</sub>。0 で零点なし）",{min:-3,max:3,step:0.01,value:-14.491/10,fmt:function(v){var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w);return Math.abs(v)<0.005?"零点なし":"z₁ = "+_w06_sig(wn/v,3);},onInput:function(){draw();}});
    var br=U.btnrow(el);
    function setZ(z){var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w);sq.set(z===null?0:wn/z);draw();}
    U.button(br,"零点なし",function(){setZ(null);});
    U.button(br,"本文の例 −10",function(){bs.set(0);setZ(-10);});
    U.button(br,"本文の例 +10",function(){bs.set(0);setZ(10);});
    U.button(br,"−5",function(){bs.set(0);setZ(-5);});
    U.button(br,"+5",function(){bs.set(0);setZ(5);});
    U.button(br,"台車に零点 −12.5（付け根を動かす）",function(){bs.set(1);setZ(-12.5);});
    var box=U.svgbox(el),ro=U.readout(el),PP=null;
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
      var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w),z=Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),lim=0.05*(PP.xr[1]-PP.xr[0]);
      if(Math.abs(z)<lim)z=z<0?-lim:lim;sq.set(wn/z);draw();});
    function draw(){
      var B=BASES[bs.get()],wn=Math.hypot(B.sg,B.w),q=sq.get(),has=Math.abs(q)>=0.005,z1=has?wn/q:Infinity;
      var N=1500,tend=B.tend,T=[],Y0=[],YD=[],TM=[],Y=[];
      for(var i=0;i<=N;i++){var t=tend*i/N,e=Math.exp(B.sg*t),y0=1-e*(Math.cos(B.w*t)-(B.sg/B.w)*Math.sin(B.w*t)),yd=(wn*wn/B.w)*e*Math.sin(B.w*t),tm=has?-yd/z1:0;
        T.push(t);Y0.push(y0);YD.push(yd);TM.push(tm);Y.push(y0+tm);}
      var nar=_w06_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:236,nar?150:200,B.xr,B.yr);PP=P;
      o.push(_w06_sp(U,S,P,B.xt,B.yt));
      o.push(U.ctl.pz(P,[{re:B.sg,im:B.w},{re:B.sg,im:-B.w}],[],"signal",6));
      if(has&&z1>=B.xr[0]&&z1<=B.xr[1])o.push(U.ctl.pz(P,[],[{re:z1,im:0}],"gold",6));
      o.push(S.CIRC(P.X(0),P.Y(0),Math.abs(P.X(wn)-P.X(0)),"faint",1,null,"3 3"));
      o.push(S.T(P.x+P.w,P.y-6,"○ を実軸の上でドラッグ","end",9,"muted"));
      o.push(S.TX(P.x+4,P.y+P.h-6,"破線の円: 原点から ω_n = "+_w06_sig(wn,3),"start",9,"muted",false,true));
      var qx=nar?52:350,qw=nar?330:330,qy=nar?20+P.h+58:24;
      var lo=Math.min(-0.15,Math.min.apply(null,Y)-0.1,Math.min.apply(null,TM)-0.05),hi=Math.max(1.3,Math.max.apply(null,Y)+0.1,Math.max.apply(null,TM)+0.05);lo=Math.max(lo,-2.5);hi=Math.min(hi,3.5);
      var Q=U.plot(qx,qy,qw,nar?180:210,[0,tend],[lo,hi]);
      o.push(Q.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,5),yt:U.nice(lo,hi,5),xfmt:function(v){return _w06_sig(v,3);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));o.push(Q.line([[0,1],[tend,1]],"faint",1,"3 3"));
      o.push(_w06_cl(Q,T,Y0,"muted",1.5,"5 3"));
      if(has)o.push(_w06_cl(Q,T,TM,"gold",1.6));
      o.push(_w06_cl(Q,T,Y,"signal",2.3));
      var ly=qy+(nar?180:210)+48;
      o.push(S.LEGL(qx,ly,[["muted","5 3","y_0（零点なし）"],["gold",null,"−\\dot{y}_0/z_1"],["signal",null,"y（和）"]],9.5,12));
      box.set(S.svg(Wd,ly+10,o));
      var st=_w06_stats(T,Y,1),st0=_w06_stats(T,Y0,1),slope=(Y[1]-Y[0])/(T[1]-T[0]);
      var h="";
      if(!has)h+="零点なし: 行き過ぎ量 <b>"+_w06_p3(st0.Mp*100,3)+" %</b>、ピーク時間 "+_w06_p3(st0.tp,3)+" s。動き始めの傾きは 0（水平に動き始める）<br>";
      else{
        h+="零点 z<sub>1</sub> = <b>"+_w06_sig(z1,3)+"</b>（"+(z1<0?"左半平面":"右半平面")+"。原点からの距離は極の "+_w06_sig(Math.abs(z1)/wn,2)+" 倍）<br>";
        h+="行き過ぎ量 <b>"+_w06_p3(Math.max(0,st.Mp)*100,3)+" %</b>（零点なしでは "+_w06_p3(st0.Mp*100,3)+" %）";
        if(st.ymin<-1e-4)h+="、初めに逆へ動く量 <b>"+_w06_sig(-st.ymin*100,3)+" %</b>（"+_w06_sig(st.tmin,3)+" s）";
        h+="<br>動き始めの傾き: 初期値の定理の式 −ω<sub>n</sub>²/z<sub>1</sub> = <b>"+_w06_sig(-wn*wn/z1,3)+" /s</b>、数値 "+_w06_sig(slope,3)+" /s<br>";
        h+=z1>0?'<span class="warn">右半平面の零点: 逆応答。この伝達関数は非最小位相</span>':'<span class="ok">左半平面の零点: 最小位相。近いほど行き過ぎが増える</span>';}
      ro.innerHTML=h+'<div class="wnote">もとの二次遅れ G<sub>0</sub>(s)（最終値 1）に、最終値を変えない零点の因数 (1 − s/z<sub>1</sub>) を掛けた。ステップ応答は本文 5 節の式 y = y<sub>0</sub> − ẏ<sub>0</sub>/z<sub>1</sub> で求めた。傾きの数値は、始めの 1 刻みの差から求めた。</div>';
    }
    draw();
  };

  /* ---- 6 節: 支配極と近似 ---- */
  REG.w06_dominant=function(el,U){
    var S=U.S,CT=U.ctl;
    U.head(el,"DOMINANT POLES","支配極だけの近似と、捨てた極・零点の影響");
    var r0=U.ctrls(el);
    var md=U.select(r0,"例",["遠い極（台車 ＋ 力の遅れ）","ループの中の遅れ（モータの位置の比例制御）","極零相殺（遅い極 −1 の近くの零点）","右半平面の極 +1 を零点で消そうとする"],0,function(){sel(true);});
    var rA=U.ctrls(el);
    var sa=U.slider(rA,"遠い極 −ω<sub>a</sub> の ω<sub>a</sub>",{min:1,max:100,log:true,value:10,fmt:function(v){return _w06_sig(v,3)+" rad/s";},onInput:function(){draw();}});
    var rB=U.ctrls(el);
    var sk=U.slider(rB,"比例ゲイン K<sub>P</sub>",{min:0.05,max:60,log:true,value:0.21,fmt:function(v){return _w06_sig(v,3)+" V/rad";},onInput:function(){draw();}});
    var rC=U.ctrls(el);
    var sz=U.slider(rC,"零点 z",{min:-3,max:-0.5,step:0.01,value:-1.1,fmt:function(v){return _w06_f(v,2);},onInput:function(){draw();}});
    var rD=U.ctrls(el);
    var sr=U.slider(rD,"零点 z（右半平面）",{min:0.8,max:1.2,step:0.001,value:0.99,fmt:function(v){return _w06_f(v,3);},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var bA=[],bB=[],bC=[],bD=[];
    function bt(arr,t,f){arr.push(U.button(br,t,f));}
    var pair={sg:-1,w:4.899};
    bt(bA,"本文の例（ω<sub>a</sub> = 10）",function(){pair={sg:-1,w:4.899};sa.set(10);draw();});
    bt(bA,"ω<sub>a</sub> = 3",function(){sa.set(3);draw();});bt(bA,"ω<sub>a</sub> = 50",function(){sa.set(50);draw();});
    bt(bA,"減衰比 0.7 の極の組",function(){pair={sg:-3.5,w:3.571};draw();});
    bt(bB,"0.21 V/rad",function(){sk.set(0.21);draw();});bt(bB,"10 V/rad",function(){sk.set(10);draw();});bt(bB,"40 V/rad",function(){sk.set(40);draw();});
    bt(bC,"z = −1（相殺）",function(){sz.set(-1);draw();});bt(bC,"z = −1.1",function(){sz.set(-1.1);draw();});bt(bC,"z = −2",function(){sz.set(-2);draw();});
    bt(bD,"z = 1（ぴったり）",function(){sr.set(1);draw();});bt(bD,"z = 0.99（1 % ずれ）",function(){sr.set(0.99);draw();});bt(bD,"z = 0.9",function(){sr.set(0.9);draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,dragK=null;
    function sel(re){var m=md.get();rA.style.display=m===0?"":"none";rB.style.display=m===1?"":"none";rC.style.display=m===2?"":"none";rD.style.display=m===3?"":"none";
      [bA,bB,bC,bD].forEach(function(a,i){a.forEach(function(b){b.style.display=i===m?"":"none";});});if(re)draw();}
    CT.drag(box,function(type,x,y){if(type==="up"){dragK=null;return;}if(x==null||!PP)return;var m=md.get();
      if(type==="down"){if(!(x>=PP.x-6&&x<=PP.x+PP.w+6&&y>=PP.y-6&&y<=PP.y+PP.h+6))return false;
        if(m===0){var dp=Math.min(Math.hypot(x-PP.X(pair.sg),y-PP.Y(pair.w)),Math.hypot(x-PP.X(pair.sg),y-PP.Y(-pair.w))),da=Math.hypot(x-PP.X(Math.max(PP.xr[0],-sa.get())),y-PP.Y(0));dragK=dp<da?"p":"a";}
        else if(m===2||m===3)dragK="z";else return false;}
      if(!dragK)return;var re=PP.ux(x);
      if(dragK==="p"){pair={sg:Math.max(-12,Math.min(-0.2,re)),w:Math.max(0.3,Math.min(PP.yr[1],Math.abs(PP.uy(y))))};}
      else if(dragK==="a"){sa.set(Math.max(1,Math.min(100,-re)));}
      else if(m===2){sz.set(Math.max(-3,Math.min(-0.5,Math.round(re*100)/100)));}
      else{sr.set(Math.max(0.8,Math.min(1.2,Math.round(re*1000)/1000)));}
      draw();});
    function stepOf(num,den,tend,n){return CT.step(CT.tf(num,den),tend,n);}
    function draw(){
      var m=md.get(),nar=_w06_nar(box),Wd=nar?400:700,o=[],N=900,h="",i;
      var full,appr,term=null,P,tend,xt,yt,poles=[],zeros=[],apoles=[],note="",yl=[-0.1,1.7];
      if(m===0){var a=sa.get(),sg=pair.sg,w=pair.w,wn2=sg*sg+w*w,den2=[1,-2*sg,wn2];
        tend=Math.min(12,Math.max(2,6/Math.abs(sg)));
        full=stepOf([a*wn2],CT.poly.mul([1,a],den2),tend,N);appr=stepOf([wn2],den2,tend,N);
        var G0a=wn2/(a*a+2*sg*a+wn2);term={t:full.t,y:full.t.map(function(t){return -G0a*Math.exp(-a*t);})};
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-60,5],[-8,8]);xt=[-60,-40,-20,0];yt=[-5,0,5];
        poles=[{re:sg,im:w},{re:sg,im:-w},{re:-a,im:0}];apoles=[];yl=[-1.0,1.8];
        var p={re:sg,im:w},f=_w06_div(_w06_c(a,0),_w06_add(p,_w06_c(a,0))),pm=Math.hypot(sg,w);
        note="極の組 "+_w06_ptxt(sg,w,3)+"（原点から "+_w06_sig(pm,3)+" rad/s）、遠い極 −ω<sub>a</sub> = −"+_w06_sig(a,3)+"（原点からの距離の比 "+_w06_sig(a/pm,3)+" 倍）<br>"+
          "遠い極の項の大きさ −ω<sub>n</sub>²/(ω<sub>a</sub>² − 2ζω<sub>n</sub>ω<sub>a</sub> + ω<sub>n</sub>²) = <b>"+_w06_sig(-G0a*100,3)+" %</b>（最終値に対する割合）、極の組の留数に掛かる ω<sub>a</sub>/(p + ω<sub>a</sub>) = "+_w06_sig(_w06_abs(f),3)+" ∠ "+_w06_sig(Math.atan2(f.im,f.re)*180/Math.PI,3)+"°";}
      else if(m===1){var kp=sk.get(),d3=[1,2000,40000,2e6*kp],d2=[1,20,1000*kp];
        var r3=CT.poly.roots(d3),r2=CT.poly.roots(d2),dom=r3.filter(function(z){return z.re>-1000;}),far=r3.filter(function(z){return z.re<=-1000;})[0];
        var sgd=dom.length?Math.max.apply(null,dom.map(function(z){return z.re;})):-10;
        tend=Math.min(1.0,Math.max(0.25,5/Math.max(1,Math.abs(sgd))));
        full=stepOf([2e6*kp],d3,tend,2000);appr=stepOf([1000*kp],d2,tend,2000);
        var wy=Math.max(20,1.3*Math.max.apply(null,r3.concat(r2).map(function(z){return Math.abs(z.im);})));
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-25,10],[-wy,wy]);xt=[-20,-10,0,10];yt=U.nice(-wy,wy,4);
        poles=dom;apoles=r2;yl=[-0.2,2.2];
        var md3=Math.hypot(dom[0].re,dom[0].im);
        note="3 次の式の支配極 <b>"+_w06_ptxt(dom[0].re,Math.abs(dom[0].im),4)+"</b>、二次遅れ（L<sub>a</sub> を無視）の極 "+_w06_ptxt(r2[0].re,Math.abs(r2[0].im),4)+"<br>捨てた極 "+_w06_sig(far.re,4)+"（支配極より原点から "+_w06_sig(Math.abs(far.re)/md3,3)+" 倍遠い）";}
      else if(m===2){var z=sz.get();tend=4;
        full=stepOf([-10/z,10],[1,11,10],tend,N);appr=stepOf([10],[1,10],tend,N);
        var A=10*(-1-z)/(9*z);term={t:full.t,y:full.t.map(function(t){return A*Math.exp(-t);})};
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-12,2],[-3,3]);xt=[-10,-5,0];yt=[-2,0,2];
        poles=[{re:-1,im:0},{re:-10,im:0}];zeros=[{re:z,im:0}];yl=[-0.15,1.15];
        note="零点 "+_w06_f(z,2)+"、遅い極 −1 の項の大きさ <b>"+_w06_sig(A*100,3)+" %</b>（最終値に対する割合。時定数 1 s で消える）";}
      else{var z2=sr.get();tend=8;
        full=stepOf([1,-z2],[1,1,-2],tend,N);appr=stepOf([1],[1,2],tend,N);
        var A2=(1-z2)/3;term={t:full.t,y:full.t.map(function(t){return A2*Math.exp(t);})};
        P=U.plot(nar?52:56,20,nar?330:236,nar?150:190,[-3,2],[-2,2]);xt=[-3,-2,-1,0,1,2];yt=[-2,0,2];
        poles=[{re:1,im:0},{re:-2,im:0}];zeros=[{re:z2,im:0}];yl=[-1.5,4];
        note="零点 "+_w06_f(z2,3)+"、e<sup>t</sup> の項の大きさ (1 − z)/3 = <b>"+_w06_sig(A2,3)+"</b>"+(A2>0?"。この項は "+_w06_sig(Math.log(1/A2),3)+" s で 1 を越える":(A2<0?"。この項は "+_w06_sig(Math.log(1/(-A2)),3)+" s で −1 を越える":"。ぴったり打ち消して、項は 0"));}
      PP=P;
      o.push(_w06_sp(U,S,P,xt,yt));
      if(apoles.length)o.push(CT.pz(P,apoles,[],"muted",5));
      o.push(CT.pz(P,poles,zeros,m===3?"alias":"signal",6));
      if(m===0&&sa.get()>60)o.push(S.TX(P.x+4,P.Y(0)-8,"← −ω_a は左の外","start",9,"muted",false,true));
      if(m===1)o.push(S.T(P.x+4,P.y+P.h-6,"捨てた極（約 −2000）は図の外","start",9,"muted",false,false,null,true));
      o.push(S.T(P.x+P.w,P.y-6,m===1?"青: 3 次の式　灰: 二次遅れ":(m===0?"× をドラッグ":"○ をドラッグ"),"end",9,"muted"));
      var qx=nar?52:350,qw=nar?330:330,qy=nar?20+P.h+58:24;
      var all=full.y.concat(appr.y),lo=Math.max(yl[0],Math.min.apply(null,all)-0.05),hi=Math.min(yl[1],Math.max.apply(null,all)+0.05);lo=Math.min(lo,-0.05);hi=Math.max(hi,1.1);
      if(term){term.y.forEach(function(v){if(v<lo&&v>yl[0])lo=v-0.03;});}
      var Q=U.plot(qx,qy,qw,nar?170:200,[0,tend],[lo,hi]);
      o.push(Q.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tend,5),yt:U.nice(lo,hi,5),xfmt:function(v){return _w06_sig(v,3);},yfmt:function(v){return _w06_sig(v,2);}}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",0.9));o.push(Q.line([[0,1],[tend,1]],"faint",1,"3 3"));
      if(m!==3)o.push(S.RECT(Q.x,Q.Y(1.02),Q.w,Q.Y(0.98)-Q.Y(1.02),0,"var(--green-soft)","none",0));
      if(term)o.push(_w06_cl(Q,term.t,term.y,"gold",1.3,"3 3"));
      o.push(_w06_cl(Q,appr.t,appr.y,"muted",1.7,"6 3"));
      o.push(_w06_cl(Q,full.t,full.y,"signal",2.2));
      var ly=qy+(nar?170:200)+48,lg=[["signal",null,m===1?"3 次の式":"元の伝達関数"],["muted","6 3",m===3?"ぴったり打ち消した 1/(s + 2)":(m===2?"相殺した 10/(s + 10)":"支配極だけの近似")]];
      if(term)lg.push(["gold","3 3",m===0?"遠い極の項":(m===2?"極 −1 の項":"e^t の項")]);
      o.push(S.LEGL(qx,ly,lg,9.5,12));
      box.set(S.svg(Wd,ly+10,o));
      /* 読み出し */
      var dmax=0;for(i=0;i<full.y.length;i++)dmax=Math.max(dmax,Math.abs(full.y[i]-appr.y[i]));
      var sf=_w06_stats(full.t,full.y,1),sa2=_w06_stats(appr.t,appr.y,1);
      h+=note+"<br>";
      if(m===3){h+="この範囲の差の最大 <b>"+_w06_sig(dmax,3)+"</b>（"+(Math.abs(sr.get()-1)<1e-12?"ぴったり打ち消すと差は 0。ただし、対象の中の自由な動きには e<sup>t</sup> の項が残る":'<span class="warn">わずかなずれでも、e<sup>t</sup> の項が育って差は限りなく大きくなる</span>')+"）";}
      else{var unst=m===1&&poles.some(function(z){return z.re>1e-6;}),lim=m===1&&poles.some(function(z){return Math.abs(z.re)<=1e-6;});
        var mpf=function(v){return v<1e-6?"0":_w06_p3(v*100,3);};
        h+="差の最大 <b>"+_w06_sig(dmax*100,3)+" %</b>（最終値に対する割合）。行き過ぎ量 "+mpf(sf.Mp)+" %（近似 "+mpf(sa2.Mp)+" %）、2 % 整定時間 "+(isFinite(sf.t2)?_w06_sig(sf.t2,3)+" s":"この範囲では落ち着かない")+"（近似 "+(isFinite(sa2.t2)?_w06_sig(sa2.t2,3)+" s":"—")+"）";
        if(unst)h+='<br><span class="warn">3 次の式は不安定（支配極が右半平面）。二次遅れの近似は安定と答える</span>';
        else if(lim)h+='<br><span class="warn">3 次の式は安定限界（支配極が虚軸の上）</span>';}
      ro.innerHTML=h+'<div class="wnote">ステップ応答は、伝達関数を零次ホールドで離散化して求めた。支配極だけの近似は、捨てる因数を 1 に置き換え、最終値（定常ゲイン）をそろえたもの。緑の帯は最終値の ±2 %。</div>';
    }
    sel(false);draw();
  };

  /* ===== 07 章 フィードバック系の式 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w07_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w07_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w07_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s;
    if(a>=Math.pow(10,d))s=String(Math.round(v));else if(a<1e-4)s=v.toExponential(d-1);else s=(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* 極の文字（共役の組は ± でまとめる） */
  function _w07_stab(ps){var mx=-Infinity;ps.forEach(function(p){mx=Math.max(mx,p.re/(1+Math.hypot(p.re,p.im)));});
    return mx<-1e-7?'（<span class="ok">すべて左半平面: 安定</span>）':(mx>1e-7?'（<span class="warn">右半平面に極がある: 不安定</span>）':'（<span class="warn">虚軸の上に極がある: 安定限界</span>）');}
  /* 読み出し（HTML）で、K_P・K_{P}・Ω_m のような添字を <sub> にする */
  function _w07_h(s){return String(s).replace(/([A-Za-zΑ-Ωα-ω])_\{([^}]*)\}/g,"$1<sub>$2</sub>").replace(/([A-Za-zΑ-Ωα-ω])_([A-Za-z0-9]+)/g,"$1<sub>$2</sub>");}
  function _w07_poles(ps){var out=[],used=[];ps=ps.map(function(p){return {re:Math.abs(p.re)<1e-7*(1+Math.abs(p.im))?0:p.re,im:p.im};});ps.forEach(function(p,i){if(used[i])return;
      if(Math.abs(p.im)>1e-9){for(var j=i+1;j<ps.length;j++)if(!used[j]&&Math.abs(ps[j].re-p.re)<1e-6*(1+Math.abs(p.re))&&Math.abs(ps[j].im+p.im)<1e-6*(1+Math.abs(p.im))){used[j]=true;break;}
        out.push(_w07_g(p.re,3)+" ± j"+_w07_g(Math.abs(p.im),3));}
      else out.push(_w07_g(p.re,3));used[i]=true;});
    return out.join("、");}
  /* TX で書いた文字の幅（S.TX と同じ分け方） */
  function _w07_txw(U,s,sz){s=String(s);var re=/\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-ɏ])_\{([^}]*)\}|([A-Za-zα-ωΑ-Ω])_([A-Za-z0-9∞%]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)/g,m,pos=0,w=0,ss=sz*0.72;
    while((m=re.exec(s))){if(m.index>pos)w+=U.tw(s.slice(pos,m.index),sz);
      if(m[1])w+=U.tw(m[2],sz);else if(m[3]!=null)w+=U.tw(m[3],sz)+U.tw(m[4],ss);else if(m[5]!=null)w+=U.tw(m[5],sz)+U.tw(m[6],ss);else w+=U.tw(m[7]!=null?m[7]:m[8],ss);
      pos=re.lastIndex;}
    if(pos<s.length)w+=U.tw(s.slice(pos),sz);return w;}
  /* ---- ブロック線図の部品（図 e07_* と同じ見た目） ---- */
  function _w07_frac(U,xc,yc,num,den,sz,c){var S=U.S,w=Math.max(_w07_txw(U,num,sz),_w07_txw(U,den,sz))+6;
    return S.TX(xc,yc-4,num,"middle",sz,c||"ink")+S.L(xc-w/2,yc,xc+w/2,yc,c||"ink",1)+S.TX(xc,yc+sz+1.5,den,"middle",sz,c||"ink");}
  function _w07_bw(U,s){if(Array.isArray(s))return Math.max(40,Math.max(_w07_txw(U,s[0],10.5),_w07_txw(U,s[1],10.5))+18);return Math.max(40,_w07_txw(U,s,11.5)+18);}
  function _w07_box(U,x,yc,s,w,hl,h){var S=U.S;w=w||_w07_bw(U,s);var c=hl?"signal":"line",f=hl?U.soft("signal"):"panel";
    if(Array.isArray(s)){h=h||44;return {svg:S.RECT(x,yc-h/2,w,h,6,f,c,1.4)+_w07_frac(U,x+w/2,yc-1,s[0],s[1],10.5),w:w};}
    h=h||34;return {svg:S.RECT(x,yc-h/2,w,h,6,f,c,1.4)+S.TX(x+w/2,yc+4.1,s,"middle",11.5,"ink"),w:w};}
  /* 横一列: ["a",長さ,文字,色] 矢印、["b",中身,名前,強調] 箱、["s",符号,名前] 加え合わせ点、["t",名前,色] 引き出し点 */
  function _w07_chain(U,x,yc,items){var S=U.S,R=15,o=[],pos={};
    items.forEach(function(it){var k=it[0];
      if(k==="a"){o.push(S.ARR(x,yc,x+it[1],yc,it[3],1.6));if(it[2])o.push(S.TX(x+it[1]/2,yc-8,it[2],"middle",10,it[3],true,true));x+=it[1];}
      else if(k==="b"){var b=_w07_box(U,x,yc,it[1],null,!!it[3]);o.push(b.svg);if(it[2])pos[it[2]]=[x,x+b.w];x+=b.w;}
      else if(k==="s"){o.push(S.SUMJ(x+R,yc,it[1]));pos[it[2]]=x+R;x+=2*R;}
      else if(k==="t"){o.push(S.D(x,yc,it[2]||"ink",3.6));pos[it[1]]=x;}});
    return {svg:o.join(""),pos:pos,x:x};}
  /* 戻る線: 引き出し点 xf から depth 下がって左へ、加え合わせ点 xt の下から入る。box があれば途中に箱 */
  function _w07_fb(U,xf,xt,yc,depth,c,box,hl,lab){var S=U.S,R=15,yb=yc+depth,o=[S.L(xf,yc,xf,yb,c,1.5)];
    if(box!=null){var w=_w07_bw(U,box),xm=(xf+xt)/2;o.push(S.ARR(xf,yb,xm+w/2,yb,c,1.5,6));o.push(_w07_box(U,xm-w/2,yb,box,w,hl,Array.isArray(box)?40:26).svg);o.push(S.L(xm-w/2,yb,xt,yb,c,1.5));}
    else o.push(S.L(xf,yb,xt,yb,c,1.5));
    o.push(S.ARR(xt,yb,xt,yc+R,c,1.5,6));
    if(lab)o.push(S.TX((xf+xt)/2,yb-6,lab,"middle",9.5,c,true,true));
    return o.join("");}
  /* 上から加え合わせ点に入る矢印（外乱など） */
  function _w07_top(U,x,yc,h,lab,c,hl){var S=U.S,R=15;return S.ARR(x,yc-h,x,yc-R,c,hl?2.4:1.6)+(lab?S.TX(x+8,yc-h+10,lab,"start",10,c,true,true):"");}
  /* 上を通る道: 引き出し点 xf から上がって右へ、加え合わせ点 xt の上から入る */
  function _w07_ff(U,xf,xt,yc,h,c,box,hl){var S=U.S,R=15,yt=yc-h,o=[S.L(xf,yc,xf,yt,c,1.5)];
    if(box!=null){var w=_w07_bw(U,box),xm=(xf+xt)/2;o.push(S.ARR(xf,yt,xm-w/2,yt,c,1.5,6));o.push(_w07_box(U,xm-w/2,yt,box,w,hl,Array.isArray(box)?40:26).svg);o.push(S.L(xm+w/2,yt,xt,yt,c,1.5));}
    else o.push(S.L(xf,yt,xt,yt,c,1.5));
    o.push(S.ARR(xt,yt,xt,yc-R,c,1.5,6));return o.join("");}
  /* s 平面の小さな図。poles・zeros・olp（開ループの極）は {re,im} の配列 */
  function _w07_splane(U,P,poles,olp,olz){var S=U.S,o=[S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)];
    o.push(U.ctl.splane(P));
    o.push(P.axes({xl:"実部 σ [1/s]",yl:"虚部 ω [rad/s]",xt:U.nice(P.xr[0],P.xr[1],4),yt:U.nice(P.yr[0],P.yr[1],4),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:36,sz:9}));
    o.push(U.ctl.splane(P,{rhp:false}));
    if(olp)o.push(U.ctl.pz(P,olp,olz||[],"muted",5));
    o.push(U.ctl.pz(P,poles,[],"signal",5.5));
    return o.join("");}
  /* 4 次のルンゲ・クッタ法で x' = f(t, x) を tEnd まで h 刻みで解き、rec 刻みごとに [t, x] を記録 */
  function _w07_ode(U,f,x0,tEnd,h,every){var n=Math.round(tEnd/h),x=x0.slice(),out=[[0,x.slice()]];
    for(var k=0;k<n;k++){x=U.ctl.rk4(f,k*h,x,h);if((k+1)%every===0)out.push([(k+1)*h,x.slice()]);}
    return out;}

  /* ---- 1 節: 線図を 1 段ずつまとめる ---- */
  function _w07_reduceEx(){
    var ex=[];
    /* ① 台車とばね・ダンパ */
    var U0=["a",34,"U(s)","gold"],YO=["a",56,"位置 Y(s)","signal"];
    ex.push({name:"① 台車とばね・ダンパ（積分の箱で描いた線図）",tEnd:6,yl:"位置 [m]",inLab:"1 N のステップ",
      steps:[
        {rule:"元の線図（2 章 2 節の m p̈ = u − c ṗ − k p を、積分の箱で描いたもの）",next:"青い 2 つの箱を直列でまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",20,null,"ink"],["s",{l:"+",b:"−"},"sb"],["a",20,null,"ink"],["b",["1","m"],"m",1],["a",40,"加速度","ink"],["b",["1","s"],"i1",1],["a",34,"速度","ink"],["t","tv","ink"],["a",26,null,"ink"],["b",["1","s"],"i2"],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tv","sb",48,"c","ink"],["tp","sa",84,"k","signal"]]},
        {rule:"直列結合: (1/m)(1/s) = 1/(ms)",next:"青い輪（ダンパの力 c ṗ を戻す負帰還）をまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",20,null,"ink"],["s",{l:"+",b:"−"},"sb"],["a",20,null,"ink"],["b",["1","ms"],"m",1],["a",34,"速度","ink"],["t","tv","ink"],["a",26,null,"ink"],["b",["1","s"],"i2"],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tv","sb",48,"c","signal",1],["tp","sa",84,"k","signal"]]},
        {rule:"フィードバック結合（負帰還、H = c）: (1/(ms)) ÷ (1 + c/(ms)) = 1/(ms + c)",next:"青い 2 つの箱を直列でまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",24,null,"ink"],["b",["1","ms + c"],"m",1],["a",34,"速度","ink"],["b",["1","s"],"i2",1],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tp","sa",50,"k","signal"]]},
        {rule:"直列結合: (1/(ms + c))(1/s) = 1/{s(ms + c)}",next:"青い輪（ばねの力 k p を戻す負帰還）をまとめる",
          items:[U0,["s",{l:"+",b:"−"},"sa"],["a",24,null,"ink"],["b",["1","s(ms + c)"],"m"],["a",30,null,"signal"],["t","tp","signal"],YO],
          fb:[["tp","sa",50,"k","signal",1]]},
        {rule:"フィードバック結合（負帰還、H = k）: 1/(ms² + cs + k)",next:null,
          items:[U0,["b",["1","ms^2 + cs + k"],"m",1],YO],fb:[]}],
      tf:function(){return {num:[1],den:[1,2,25]};},
      eq:function(){return "Y(s)/U(s) = 1/(ms² + cs + k)。例の値（m = 1 kg、c = 2 N·s/m、k = 25 N/m）で 1/(s² + 2s + 25) m/N（6 章 1 節の表と同じ）";},
      sim:function(U){return _w07_ode(U,function(t,x){return [x[1],1-2*x[1]-25*x[0]];},[0,0],6,0.002,30).map(function(r){return [r[0],r[1][0]];});}});
    /* ② DC モータ */
    var V0=["a",30,"V(s)","gold"],WO=["a",50,"Ω_m(s)","signal"];
    ex.push({name:"② DC モータ（巻線のインダクタンスを含む。2 章 3 節）",tEnd:0.25,yl:"角速度 [rad/s]",inLab:"1 V のステップ",
      steps:[
        {rule:"元の線図（電圧 v と負荷トルク τ_L の 2 つの入力）",next:"重ね合わせ: τ_L = 0 として、電圧からの伝達関数を求める",
          items:[V0,["s",{l:"+",b:"−"},"sa"],["a",22,null,"ink"],["b",["1","L_a s + R_a"],"e"],["a",30,"I","teal"],["b","K_t","kt"],["a",30,null,"ink"],["s",{l:"+",t:"−"},"sb"],["a",22,null,"ink"],["b",["1","Js"],"j"],["a",40,null,"signal"],["t","tw","signal"],WO],
          fb:[["tw","sa",52,"K_t","signal"]],top:[["sb",44,"τ_L（負荷トルク）","purple",1]]},
        {rule:"重ね合わせ: τ_L = 0 とすると、τ_L の加え合わせ点は信号をそのまま通す",next:"青い 3 つの箱を直列でまとめる",
          items:[V0,["s",{l:"+",b:"−"},"sa"],["a",22,null,"ink"],["b",["1","L_a s + R_a"],"e",1],["a",30,"I","teal"],["b","K_t","kt",1],["a",30,null,"ink"],["b",["1","Js"],"j",1],["a",40,null,"signal"],["t","tw","signal"],WO],
          fb:[["tw","sa",52,"K_t","signal"]]},
        {rule:"直列結合: (1/(L_{a}s + R_{a}))K_{t}(1/(Js)) = K_{t}/{Js(L_{a}s + R_{a})}",next:"青い輪（逆起電力を戻す負帰還、H = K_t）をまとめる",
          items:[V0,["s",{l:"+",b:"−"},"sa"],["a",26,null,"ink"],["b",["K_t","Js(L_a s + R_a)"],"g"],["a",40,null,"signal"],["t","tw","signal"],WO],
          fb:[["tw","sa",50,"K_t","signal",1]]},
        {rule:"フィードバック結合（負帰還、H = K_t）",next:null,items:[V0,["b",["K_t","L_a Js^2 + R_a Js + K_t^2"],"g",1],WO],fb:[]}],
      tf:function(){return {num:[2e6],den:[1,2000,40000]};},
      eq:function(){return "Ω_m(s)/V(s) = K_{t}/(L_{a}Js² + R_{a}Js + K_{t}²) = 2×10⁶/(s² + 2000s + 40000)（例の値。6 章 1 節）。v = 0 として同じ手順で、Ω_m/T_L = −(L_{a}s + R_{a})/(L_{a}Js² + R_{a}Js + K_{t}²)（s = 0 で −5000 (rad/s)/(N·m)）";},
      sim:function(U){return _w07_ode(U,function(t,x){return [(1-2*x[0]-0.02*x[1])/1e-3,0.02*x[0]/1e-5];},[0,0],0.25,2.5e-5,200).map(function(r){return [r[0],r[1][1]];});}});
    /* ③ モータの位置の比例制御 */
    var R0=["a",30,"R(s)","muted"],TO=["a",40,"Θ_m(s)","signal"];
    ex.push({name:"③ モータの位置の比例制御（インダクタンスを含む。6 章 4 節）",tEnd:0.6,yl:"角度 [rad]",inLab:"目標値 1 rad のステップ",kp:true,
      steps:[
        {rule:"元の線図（内側に逆起電力の輪、外側に角度を戻す輪）",next:"青い 3 つの箱を直列でまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",18,null,"alias"],["b","K_P","kp"],["a",22,"V","gold"],["s",{l:"+",b:"−"},"sa"],["a",14,null,"ink"],["b",["1","L_a s + R_a"],"e",1],["a",14,null,"teal"],["b","K_t","kt",1],["a",14,null,"ink"],["b",["1","Js"],"j",1],["a",26,null,"signal"],["t","tw","signal"],["a",16,null,"signal"],["b",["1","s"],"i"],["a",22,null,"signal"],["t","tt","signal"],TO],
          fb:[["tw","sa",50,"K_t","ink"],["tt","s0",86,null,"signal"]]},
        {rule:"直列結合: K_{t}/{Js(L_{a}s + R_{a})}",next:"青い内側の輪（逆起電力、H = K_t）をまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",18,null,"alias"],["b","K_P","kp"],["a",22,"V","gold"],["s",{l:"+",b:"−"},"sa"],["a",18,null,"ink"],["b",["K_t","Js(L_a s + R_a)"],"g"],["a",26,null,"signal"],["t","tw","signal"],["a",16,null,"signal"],["b",["1","s"],"i"],["a",22,null,"signal"],["t","tt","signal"],TO],
          fb:[["tw","sa",50,"K_t","signal",1],["tt","s0",86,null,"signal"]]},
        {rule:"フィードバック結合（負帰還、H = K_t）: K_{t}/(L_{a}Js² + R_{a}Js + K_{t}²)",next:"青い 3 つの箱（K_P、モータ、積分）を直列でまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",18,null,"alias"],["b","K_P","kp",1],["a",22,"V","gold"],["b",["K_t","L_a Js^2 + R_a Js + K_t^2"],"g",1],["a",22,"Ω_m","signal"],["b",["1","s"],"i",1],["a",22,null,"signal"],["t","tt","signal"],TO],
          fb:[["tt","s0",56,null,"signal"]]},
        {rule:"直列結合: K_{P}K_{t}/{s(L_{a}Js² + R_{a}Js + K_{t}²)}（輪を一周する伝達関数）",next:"青い外側の輪（角度を戻す負帰還、H = 1）をまとめる",
          items:[R0,["s",{l:"+",b:"−"},"s0"],["a",22,null,"alias"],["b",["K_P K_t","s(L_a Js^2 + R_a Js + K_t^2)"],"g"],["a",26,null,"signal"],["t","tt","signal"],TO],
          fb:[["tt","s0",56,null,"signal",1]]},
        {rule:"フィードバック結合（負帰還、H = 1）",next:null,items:[R0,["b",["K_P K_t","L_a Js^3 + R_a Js^2 + K_t^2 s + K_P K_t"],"g",1],TO],fb:[]}],
      tf:function(kp){return {num:[2e6*kp],den:[1,2000,40000,2e6*kp]};},
      eq:function(kp){return "Θ_m(s)/R(s) = K_{P}K_{t}/(L_{a}Js³ + R_{a}Js² + K_{t}²s + K_{P}K_{t})。L_{a}J で割ると 2×10⁶K_{P}/(s³ + 2000s² + 40000s + 2×10⁶K_{P})。K_P = "+kp+" V/rad で分母の定数項は "+_w07_g(2e6*kp,3);},
      sim:function(U,kp,tEnd){var h=2.5e-5,every=Math.max(1,Math.round(tEnd/240/h));return _w07_ode(U,function(t,x){var v=kp*(1-x[2]);return [(v-2*x[0]-0.02*x[1])/1e-3,0.02*x[0]/1e-5,x[1]];},[0,0,0],tEnd,h,every).map(function(r){return [r[0],r[1][2]];});}});
    /* ④ 1 章の台車（決めた力の道） */
    var Rr=["a",22,"R(s)","muted"],YY=["a",40,"Y(s)","signal"],PB=["b",["0.5","0.5s + 1"],"p"],Dt=["s3",40,"D(s)","purple"];
    ex.push({name:"④ 1 章の台車の速度（決めた力の道と坂）",tEnd:2,yl:"速度 [m/s]",inLab:"目標値 1 m/s、1 s に坂",kp2:true,
      steps:[
        {rule:"元の線図（1 章 4 節。u = cr + K_{P}(r − y)、坂の力 D）",next:"加え合わせ点を K_P の出力側へ移す（等価変換 ①）",
          items:[Rr,["t","tr","muted"],["a",40,null,"muted"],["s",{l:"+",b:"−"},"s1"],["a",22,null,"alias"],["b","K_P","kp",1],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s2"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],PB,["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,null,"signal"]],ff:[["tr","s2",60,"c","muted"]],top:[Dt]},
        {rule:"等価変換: 加え合わせ点を K_P の出力側へ移すと、戻る信号にも K_P が掛かる",next:"続けて並んだ 2 つの加え合わせ点の順を入れ替える",
          items:[Rr,["t","tr","muted"],["a",40,null,"muted"],["b","K_P","kp"],["a",22,null,"gold"],["s",{l:"+",b:"−"},"s1"],["a",22,null,"gold"],["s",{l:"+",t:"+"},"s2"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],PB,["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,"K_P","signal"]],ff:[["tr","s2",60,"c","muted"]],top:[Dt]},
        {rule:"加え合わせ点の入れ替え（足し引きの順は入れ替えてよい）",next:"R から出る 2 つの道（青い K_P と c）を並列でまとめる",
          items:[Rr,["t","tr","muted"],["a",40,null,"muted"],["b","K_P","kp",1],["a",22,null,"gold"],["s",{l:"+",t:"+"},"s2"],["a",22,null,"gold"],["s",{l:"+",b:"−"},"s1"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],PB,["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,"K_P","signal"]],ff:[["tr","s2",60,"c","muted",1]],top:[Dt]},
        {rule:"並列結合: K_P + c",next:"加え合わせ点を入れ替えて、青い輪（P を K_P で戻す負帰還）をまとめる",
          items:[Rr,["a",30,null,"muted"],["b","c + K_P","kp"],["a",30,null,"gold"],["s",{l:"+",b:"−"},"s1"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],["b",["0.5","0.5s + 1"],"p",1],["a",40,null,"signal"],["t","ty","signal"],YY],
          fb:[["ty","s1",50,"K_P","signal",1]],top:[Dt]},
        {rule:"加え合わせ点の入れ替えと、フィードバック結合: P/(1 + K_{P}P)",next:null,
          items:[Rr,["a",30,null,"muted"],["b","c + K_P","kp"],["a",30,null,"gold"],["s",{l:"+",t:"+"},"s3"],["a",22,null,"ink"],["b",["P(s)","1 + K_P P(s)"],"p",1],["a",40,null,"signal"],YY],
          fb:[],top:[Dt]}],
      tf:function(kp){var g=0.5*kp+1;return {num:[0.5*(2+kp)],den:[0.5,g],dnum:[0.5],dden:[0.5,g]};},
      eq:function(kp){var g=1+0.5*kp;return "Y = (c + K_{P})P/(1 + K_{P}P)·R + P/(1 + K_{P}P)·D。K_P = "+kp+" N/(m/s) では s = 0 で R の係数 "+_w07_g(0.5*(2+kp)/g,4)+"、D の係数 "+_w07_g(0.5/g,3)+" (m/s)/N、坂（D = −0.513 N）の上で "+_w07_f(0.5*(2+kp)/g-0.5134*0.5/g,3)+" m/s";},
      sim:function(U,kp){return _w07_ode(U,function(t,x){var u=2+kp*(1-x[0]),d=t>=1?-0.51342:0;return [(0.5*(u+d)-x[0])/0.5];},[0],2,0.001,8).map(function(r){return [r[0],r[1][0]];});}});
    return ex;
  }
  REG.w07_reduce=function(el,U){
    var S=U.S,EX=_w07_reduceEx();
    U.head(el,"REDUCE","ブロック線図を 1 段ずつまとめる");
    var r1=U.ctrls(el);
    var sel=U.select(r1,"例",EX.map(function(e){return e.name;}),0,function(){st=0;draw();});
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>（③）",{values:[0.05,0.1,0.21,0.5,1,2,5,10,20,30,40,50],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var kp2=U.slider(r1,"比例ゲイン K<sub>P</sub>（④）",{values:[0,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var br=U.btnrow(el),st=0;
    U.button(br,"最初から",function(){st=0;draw();});
    U.button(br,"1 段戻る",function(){st=Math.max(0,st-1);draw();});
    U.button(br,"次へ",function(){st=Math.min(EX[sel.get()].steps.length-1,st+1);draw();});
    U.button(br,"最後まで",function(){st=EX[sel.get()].steps.length-1;draw();});
    U.button(br,"本文の例",function(){kp.set(0.21);kp2.set(8);st=0;draw();});
    var bd=U.svgbox(el,{scroll:true}),ro=U.readout(el),box=U.svgbox(el);
    function draw(){
      var e=EX[sel.get()],n=e.steps.length,sp=e.steps[st],o=[],yc=100;
      kp.el.style.display=e.kp?"":"none";kp2.el.style.display=e.kp2?"":"none";
      o.push(S.T(14,18,"段 "+(st+1)+" / "+n+"（青い部分を、次の段でまとめる）","start",11,"ink",true));
      var ch=_w07_chain(U,16,yc,sp.items);o.push(ch.svg);
      (sp.fb||[]).forEach(function(f){o.push(_w07_fb(U,ch.pos[f[0]],ch.pos[f[1]],yc,f[2],f[4],f[3],!!f[5]));});
      (sp.ff||[]).forEach(function(f){o.push(_w07_ff(U,ch.pos[f[0]],ch.pos[f[1]],yc,f[2],f[4],f[3],!!f[5]));});
      (sp.top||[]).forEach(function(f){o.push(_w07_top(U,ch.pos[f[0]],yc,f[1],f[2],f[3],!!f[4]));});
      var hgt=yc+Math.max(40,Math.max.apply(null,[30].concat((sp.fb||[]).map(function(f){return f[2]+24;}))));
      bd.set(S.svg(Math.max(700,ch.x+20),hgt,o));
      var K=e.kp?kp.get():kp2.get(),h="<b>段 "+(st+1)+"</b>: "+_w07_h(sp.rule)+"<br>";
      if(sp.next)h+='次の段: '+_w07_h(sp.next)+'（「次へ」を押す）';
      else h+='<span class="ok">まとまった。</span> '+_w07_h(e.eq(K));
      ro.innerHTML=h;
      /* 最後の段: 極と応答 */
      if(sp.next){box.set("");box.el.style.display="none";return;}
      box.el.style.display="";
      var tf=e.tf(K),G=U.ctl.tf(tf.num,tf.den),ps=U.ctl.poles(G),stable=ps.every(function(p){return p.re<0;});
      var tEnd=e.tEnd;if(e.kp&&K>=10)tEnd=0.2;
      var nar=_w07_nar(box),Wd=nar?400:700,q=[];
      /* s 平面: 支配的な極が見える範囲 */
      var near=ps.filter(function(p){return Math.abs(p.re)<200;}),far=ps.filter(function(p){return Math.abs(p.re)>=200;});
      var src=near.length?near:ps,mr=Math.max.apply(null,src.map(function(p){return Math.abs(p.re);}).concat([1])),mi=Math.max.apply(null,src.map(function(p){return Math.abs(p.im);}).concat([1]));
      var xr=[-Math.ceil(mr*1.3/5)*5,Math.max(5,Math.ceil(mr*0.3/5)*5)],yr=Math.max(5,Math.ceil(mi*1.3/5)*5);
      var A=nar?U.plot(56,22,300,150,xr,[-yr,yr]):U.plot(56,22,230,190,xr,[-yr,yr]);
      q.push(S.T(A.x,A.y-8,"まとめた伝達関数の極","start",10,"signal",true));
      q.push(_w07_splane(U,A,ps));
      if(far.length)q.push(S.T(A.x+4,A.y+A.h-6,"枠の外: "+_w07_poles(far),"start",9,"muted",false,false,null,true));
      var bx=nar?56:350,by=nar?A.y+A.h+60:22,bw=nar?320:330,bh=nar?150:190;
      var t0=[],y0=[];var R=U.ctl.lsim(G,function(){return 1;},tEnd,400);t0=R.t;y0=R.y;
      if(tf.dnum){var Gd=U.ctl.tf(tf.dnum,tf.dden),Rd=U.ctl.lsim(Gd,function(t){return t>=1?-0.51342:0;},tEnd,400);y0=y0.map(function(v,i){return v+Rd.y[i];});}
      var sim=e.sim(U,K,tEnd),all=y0.concat(sim.map(function(r){return r[1];})).filter(function(v){return isFinite(v);});
      var ymax=Math.max.apply(null,all),ymin=Math.min.apply(null,all.concat([0]));
      var lim=Math.max(Math.abs(ymax),1e-9),top=U.nice(0,lim*1.15,4),yt=top[top.length-1]<lim*1.1?lim*1.2:top[top.length-1];
      var B=U.plot(bx,by,bw,bh,[0,tEnd],[Math.min(0,ymin*1.1),yt]);
      q.push(S.T(B.x,B.y-8,"ステップ応答（"+e.inLab+"）","start",10,"signal",true));
      q.push(B.axes({xl:"時間 t [s]",yl:e.yl,xt:U.nice(0,tEnd,5),yt:U.nice(Math.min(0,ymin*1.1),yt,4),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
      q.push(B.clip(t0.map(function(t,i){return [t,y0[i]];}),"signal",2));
      sim.forEach(function(r,i){if(i%Math.max(1,Math.round(sim.length/24))===0&&r[1]>=B.yr[0]&&r[1]<=B.yr[1])q.push(S.CIRC(B.X(r[0]),B.Y(r[1]),2.8,"signal",1.3,"screen"));});
      q.push(S.LEGL(bx,B.y+B.h+48,[["signal",null,"線: まとめた伝達関数"]],9.5));
      q.push(S.CIRC(bx+(nar?150:170),B.y+B.h+44,2.8,"signal",1.3,"screen"));q.push(S.T(bx+(nar?158:178),B.y+B.h+48,"点: 元の線図のまま数値計算","start",9.5,"muted"));
      box.set(S.svg(Wd,B.y+B.h+58,q));
      ro.innerHTML=h+"<br>極: "+_w07_poles(ps)+_w07_stab(ps);
    }
    draw();
  };

  /* ---- 3 節: 型と定常偏差 ---- */
  var _w07_LOOPS=[
    {name:"型 0: 台車の速度・比例",P:[[0.5],[0.5,1]],I:false,kp:{values:[1,2,4,8,14,20,30,40],value:8,u:"N/(m/s)"},tEnd:1.5,yu:"m/s"},
    {name:"型 1: モータの位置・比例",P:[[50],[0.05,1,0]],I:false,kp:{values:[0.02,0.05,0.1,0.21,0.5,1,2],value:0.21,u:"V/rad"},tEnd:1.5,yu:"rad"},
    {name:"型 1: 台車の速度・比例 + 積分",P:[[0.5],[0.5,1]],I:true,kp:{values:[1,2,4,8,14,20,30,40],value:8,u:"N/(m/s)"},ki:{values:[2,5,10,16,25,40,60,100],value:25,u:"N/m"},tEnd:2,yu:"m/s"},
    {name:"型 2: モータの位置・比例 + 積分",P:[[50],[0.05,1,0]],I:true,kp:{values:[0.1,0.21,0.3,0.5,1],value:0.21,u:"V/rad"},ki:{values:[0.1,0.2,0.5,1,2,4,5],value:0.5,u:"V/(rad·s)"},tEnd:3,yu:"rad"}];
  REG.w07_type=function(el,U){
    var S=U.S,PO=U.ctl.poly;
    U.head(el,"TYPE","制御系の型と定常偏差 — 原点の極の数と、ステップ・ランプへの偏差");
    var r1=U.ctrls(el);
    var lp=U.select(r1,"ループ",_w07_LOOPS.map(function(l){return l.name;}),0,function(){setG();draw();});
    var inp=U.select(r1,"目標値",["単位ステップ（r = 1）","単位ランプ（r = t）","2 乗で増える（r = t²/2）"],0,draw);
    var r2=U.ctrls(el),kp=null,ki=null;
    function setG(){r2.innerHTML="";var L=_w07_LOOPS[lp.get()];
      kp=U.slider(r2,"比例ゲイン K<sub>P</sub>",{values:L.kp.values,value:L.kp.value,fmt:function(v){return v+" "+L.kp.u;},onInput:draw});
      ki=L.I?U.slider(r2,"積分の係数 K<sub>I</sub>",{values:L.ki.values,value:L.ki.value,fmt:function(v){return v+" "+L.ki.u;},onInput:draw}):null;}
    var br=U.btnrow(el);
    U.button(br,"本文の例（表の値）",function(){setG();draw();});
    U.button(br,"型 0 にランプ",function(){lp.set(0);inp.set(1);setG();draw();});
    U.button(br,"型 1 のモータにランプ",function(){lp.set(1);inp.set(1);setG();draw();});
    U.button(br,"型 2 を不安定にする（K<sub>I</sub> = 5）",function(){lp.set(3);inp.set(0);setG();ki.set(5);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    setG();
    function draw(){
      var L=_w07_LOOPS[lp.get()],K=kp.get(),KI=ki?ki.get():0,m=+inp.get();
      var Cn=L.I?[K,KI]:[K],Cd=L.I?[1,0]:[1],Ln=PO.mul(L.P[0],Cn),Ld=PO.mul(L.P[1],Cd);
      var olp=PO.roots(Ld),olz=Ln.length>1?PO.roots(Ln):[],den=PO.add(Ld,Ln),clp=PO.roots(den),stable=clp.every(function(p){return p.re<-1e-9;});
      var N=olp.filter(function(p){return Math.abs(p.re)<1e-9&&Math.abs(p.im)<1e-9;}).length;
      /* 偏差 e = r/(1 + PC): 単位ステップの応答を、入力の変換に合わせて 1/s を掛けた伝達関数で計算する（ランプ・2 乗でも厳密） */
      var en=Ld.slice(),ed=den.slice();for(var k=0;k<m;k++)ed=PO.mul(ed,[1,0]);
      var slow=Math.min.apply(null,clp.map(function(p){return Math.abs(p.re);}).filter(function(v){return v>1e-9;}).concat([50]));
      var tEnd=stable?Math.min(Math.max(L.tEnd,6/slow),20):L.tEnd;
      var R=U.ctl.step(U.ctl.tf(en,ed),tEnd,600),rf=function(t){return m===0?1:(m===1?t:t*t/2);};
      var ts=R.t,es=R.y,ys=ts.map(function(t,i){return rf(t)-es[i];});
      /* 式の値 */
      var lim0=PO.val(Ln,0)/PO.val(Ld,0);   /* N = 0 のとき */
      var Gz=function(k){var dn=Ld.slice();for(var j=0;j<k;j++){if(Math.abs(dn[dn.length-1])>1e-12)return Infinity;dn=dn.slice(0,dn.length-1);}return PO.val(Ln,0)/PO.val(dn,0);};
      var pred;
      if(N<m)pred=Infinity;else if(N===m){var g=Gz(m);pred=m===0?1/(1+g):1/g;}else pred=0;
      /* 描く */
      var nar=_w07_nar(box),Wd=nar?400:700,o=[];
      var mr=Math.max.apply(null,olp.concat(clp).concat(olz).map(function(p){return Math.abs(p.re);}).concat([2])),mi=Math.max.apply(null,clp.concat(olp).map(function(p){return Math.abs(p.im);}).concat([2]));
      var xr=[-Math.ceil(mr*1.15/5)*5,Math.max(5,Math.ceil(mr*0.25/5)*5)],yy=Math.ceil(mi*1.3/5)*5;
      var A=nar?U.plot(56,26,300,140,xr,[-yy,yy]):U.plot(56,26,220,200,xr,[-yy,yy]);
      o.push(S.T(A.x,A.y-10,"灰: 一巡伝達関数の極・零点、青: 閉ループの極","start",9.5,"ink",true));
      o.push(_w07_splane(U,A,clp,olp,olz));
      o.push(S.T(A.X(0)-6,A.y+12,"原点に "+N+" 個 → 型 "+N,"end",9.5,"signal",true,false,null,true));
      var bx=nar?56:340,by=nar?A.y+A.h+60:26,bw=nar?320:340;
      var yv=ys.concat(ts.map(rf)).filter(function(v){return isFinite(v);}),ymx=Math.max.apply(null,yv),ymn=Math.min.apply(null,yv.concat([0]));
      ymx=Math.min(ymx,rf(tEnd)*1.8+0.2);ymn=Math.max(ymn,-ymx);
      var B=U.plot(bx,by,bw,nar?110:120,[0,tEnd],[ymn,ymx*1.08]);
      o.push(B.axes({yl:"制御量 ["+L.yu+"]",xt:U.nice(0,tEnd,5),yt:U.nice(ymn,ymx*1.08,3),xfmt:function(){return "";},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
      o.push(B.line(ts.map(function(t){return [t,rf(t)];}),"muted",1.3,"5 3"));
      o.push(B.clip(ts.map(function(t,i){return [t,ys[i]];}),"signal",2));
      var ev=es.filter(function(v){return isFinite(v);}),emx=Math.max.apply(null,ev.concat([0])),emn=Math.min.apply(null,ev.concat([0]));
      if(isFinite(pred)){emx=Math.max(emx,pred);emn=Math.min(emn,pred);}
      var span=Math.max(emx-emn,1e-3),C=U.plot(bx,B.y+B.h+16,bw,nar?80:84,[0,tEnd],[emn-span*0.1,emx+span*0.15]);
      o.push(C.axes({xl:"時間 t [s]",yl:"偏差 e",xt:U.nice(0,tEnd,5),yt:U.nice(emn-span*0.1,emx+span*0.15,3),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
      if(isFinite(pred)&&stable)o.push(C.line([[0,pred],[tEnd,pred]],"green",1.3,"5 3"));
      o.push(C.clip(ts.map(function(t,i){return [t,es[i]];}),"alias",2));
      o.push(S.T(bx,C.y+C.h+46,"破線: 目標値（上）、表の式の定常偏差（下）","start",9.5,"muted"));
      box.set(S.svg(Wd,C.y+C.h+54,o));
      /* 読み出し */
      var nm=["定常位置偏差","定常速度偏差","2 乗で増える目標値への定常偏差"][m],h="";
      h+="一巡伝達関数 P(s)C(s) の原点の極: <b>"+N+" 個</b> → <b>型 "+N+"</b>。閉ループの極: "+_w07_poles(clp)+_w07_stab(clp)+"<br>";
      if(!stable)h+='<span class="warn">閉ループが安定でないので、最終値の定理は使えない（偏差は落ち着かない）。</span>';
      else{
        var lab=m===0?"1/(1 + lim<sub>s→0</sub> P(s)C(s))":(m===1?"1/lim<sub>s→0</sub> sP(s)C(s)":"1/lim<sub>s→0</sub> s²P(s)C(s)");
        if(!isFinite(pred))h+=nm+": 型 "+N+" では<b>増え続ける</b>（sE(s) の分母に s = 0 の根が残る）。"+_w07_f(tEnd,2)+" s で偏差 "+_w07_g(es[es.length-1],3)+" "+L.yu;
        else h+=nm+": 式 "+(N>m?"0（型が "+m+" より大きい）":lab+" = <b>"+_w07_g(pred,3)+" "+L.yu+"</b>")+"、数値計算（"+_w07_f(tEnd,2)+" s）"+_w07_g(es[es.length-1],3)+" "+L.yu;
      }
      if(m===0&&stable){var mx=Math.max.apply(null,ys);if(mx>1.001)h+="<br>行き過ぎ量 "+_w07_f((mx-1)*100,1)+" %";}
      ro.innerHTML=h+'<div class="wnote">偏差 e(t) は、1/(1 + P(s)C(s)) に目標値の変換（1/s・1/s²・1/s³）を掛けたものを逆変換して求めた（入力を区切らない厳密な計算）。例の値: 台車 P = 0.5/(0.5s + 1)、モータ P = 50/{s(0.05s + 1)}。</div>';
    }
    draw();
  };

  /* ---- 4 節: 外乱の入る場所と積分 ---- */
  REG.w07_dist=function(el,U){
    var S=U.S,PO=U.ctl.poly;
    U.head(el,"DISTURBANCE","外乱の入る場所と、制御器の積分");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["台車の速度（型 0）","モータの位置（型 1、積分は対象の中）"],0,draw);
    var pc=U.select(r1,"外乱の入る場所",["操作量に入る（坂の力・負荷トルク）","制御量に入る（動く歩道・継ぎ手の滑り）"],0,draw);
    var ig=U.checkbox(r1,"制御器に積分を足す",false,draw);
    var r2=U.ctrls(el);
    var sz=U.slider(r2,"外乱の大きさ",{values:[0.25,0.5,1,1.5,2],value:1,fmt:function(v){return "本文の例の "+v+" 倍";},onInput:draw});
    var kpc=U.slider(r2,"K<sub>P</sub>（台車）",{values:[1,2,4,8,14,20,30],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var kpm=U.slider(r2,"K<sub>P</sub>（モータ）",{values:[0.05,0.1,0.21,0.5,1],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var kic=U.slider(r2,"K<sub>I</sub>（台車）",{values:[5,10,16,25,40,60],value:25,fmt:function(v){return v+" N/m";},onInput:draw});
    var kim=U.slider(r2,"K<sub>I</sub>（モータ）",{values:[0.1,0.2,0.5,1,2],value:0.5,fmt:function(v){return v+" V/(rad·s)";},onInput:draw});
    var br=U.btnrow(el);
    function set(p,c,i){pl.set(p);pc.set(c);ig.set(i);sz.set(1);kpc.set(8);kpm.set(0.21);kic.set(25);kim.set(0.5);draw();}
    U.button(br,"本文の例（台車と坂）",function(){set(0,0,false);});
    U.button(br,"モータに負荷トルク",function(){set(1,0,false);});
    U.button(br,"モータの継ぎ手が滑る",function(){set(1,1,false);});
    U.button(br,"負荷トルクに積分",function(){set(1,0,true);});
    var bd=U.svgbox(el,{scroll:true}),box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var cart=pl.get()===0,inU=pc.get()===0,I=ig.get(),k=sz.get();
      kpc.el.style.display=cart?"":"none";kpm.el.style.display=cart?"none":"";kic.el.style.display=cart&&I?"":"none";kim.el.style.display=!cart&&I?"":"none";
      var Pn=cart?[0.5]:[50],Pd=cart?[0.5,1]:[0.05,1,0],K=cart?kpc.get():kpm.get(),KI=cart?kic.get():kim.get();
      var Cn=I?[K,KI]:[K],Cd=I?[1,0]:[1];
      var d=cart?(inU?-0.51342*k:0.2*k):(inU?-1*k:0.5*k);
      var den=PO.add(PO.mul(Pd,Cd),PO.mul(Pn,Cn)),num=inU?PO.mul(Pn,Cd):PO.mul(Pd,Cd),clp=PO.roots(den),stable=clp.every(function(p){return p.re<-1e-9;});
      /* 線図 */
      var o=[],yc=96,signs={l:"+",t:"+"};
      var ch=_w07_chain(U,16,yc,[["a",56,"目標値 R","muted"],["s",{l:"+",b:"−"},"s1"],["a",40,null,"alias"],["b",I?(cart?["K_P s + K_I","s"]:["K_P s + K_I","s"]):"K_P","c",I],["a",54,"U","gold"],["s",signs,"s2"],["a",30,null,"ink"],["b",cart?["0.5","0.5s + 1"]:["50","s(0.05s + 1)"],"p"],["a",50,null,"ink"],["s",signs,"s3"],["a",56,null,"signal"],["t","bp","signal"],["a",50,"Y","signal"]]);
      o.push(ch.svg);
      o.push(_w07_top(U,ch.pos.s2,yc,52,inU?(cart?"坂の力":"負荷トルク（電圧に換算）"):null,inU?"purple":"faint",inU));
      o.push(_w07_top(U,ch.pos.s3,yc,52,!inU?(cart?"動く歩道の速さ":"継ぎ手の滑り"):null,!inU?"purple":"faint",!inU));
      o.push(_w07_fb(U,ch.pos.bp,ch.pos.s1,yc,46,"signal"));
      o.push(S.T(14,18,"外乱の入る点（紫）と、制御器（"+(I?"比例 + 積分":"比例だけ")+"）","start",10.5,"ink",true));
      bd.set(S.svg(700,yc+60,o));
      /* 応答（目標値 0、時刻 0.2 s に外乱のステップ） */
      var t0=0.2,tEnd=cart?1.6:2.5;if(stable){var sl=Math.min.apply(null,clp.map(function(p){return Math.abs(p.re);}));tEnd=Math.min(Math.max(tEnd,t0+8/sl),12);}
      var G=U.ctl.tf(num,den),Rr=U.ctl.lsim(G,function(t){return t>=t0?1:0;},tEnd,800),ts=Rr.t,ys=Rr.y.map(function(v){return v*d;});
      var hh=ts[1]-ts[0],ip=[0],pp=[];for(var i=0;i<ts.length;i++){pp.push(-K*ys[i]);if(i>0)ip.push(ip[i-1]-KI*(ys[i]+ys[i-1])/2*hh);}
      if(!I)ip=ip.map(function(){return 0;});
      var us=pp.map(function(v,i){return v+ip[i];});
      var nar=_w07_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,q=[];
      var yl=ys.filter(function(v){return isFinite(v);}),ymx=Math.max.apply(null,yl.concat([0])),ymn=Math.min.apply(null,yl.concat([0])),spn=Math.max(ymx-ymn,1e-3);
      var A=U.plot(x0,16,pw,130,[0,tEnd],[ymn-spn*0.1,ymx+spn*0.15]);
      q.push(S.RECT(A.X(t0),A.y,A.X(tEnd)-A.X(t0),A.h,0,U.soft("purple"),"none",0));
      q.push(A.axes({yl:"制御量のずれ ["+(cart?"m/s":"rad")+"]",xt:U.nice(0,tEnd,6),yt:U.nice(ymn-spn*0.1,ymx+spn*0.15,4),xfmt:function(){return "";},yfmt:function(v){return _w07_g(v,3);},ylOff:nar?38:42,sz:9}));
      q.push(A.line([[0,0],[tEnd,0]],"muted",1,"4 3"));
      q.push(A.clip(ts.map(function(t,i){return [t,ys[i]];}),"signal",2.2));
      /* 式の値: s → 0 の G(0)·d */
      var pred=null;if(stable){var nz=num.slice(),dz=den.slice();while(nz.length&&dz.length&&Math.abs(nz[nz.length-1])<1e-12&&Math.abs(dz[dz.length-1])<1e-12){nz.pop();dz.pop();}pred=(Math.abs(PO.val(dz,0))<1e-12?Infinity:PO.val(nz,0)/PO.val(dz,0))*d;}
      if(pred!=null&&isFinite(pred))q.push(A.line([[t0,pred],[tEnd,pred]],"green",1.3,"5 3"));
      var ul=us.concat(pp).concat(ip).concat(inU?[-d]:[]).filter(function(v){return isFinite(v);}),umx=Math.max.apply(null,ul.concat([0])),umn=Math.min.apply(null,ul.concat([0])),usp=Math.max(umx-umn,1e-3);
      var B=U.plot(x0,A.y+A.h+18,pw,110,[0,tEnd],[umn-usp*0.1,umx+usp*0.15]);
      q.push(S.RECT(B.X(t0),B.y,B.X(tEnd)-B.X(t0),B.h,0,U.soft("purple"),"none",0));
      q.push(B.axes({xl:"時間 t [s]",yl:"操作量の変化 ["+(cart?"N":"V")+"]",xt:U.nice(0,tEnd,6),yt:U.nice(umn-usp*0.1,umx+usp*0.15,4),xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:nar?38:42,sz:9}));
      q.push(B.line([[0,0],[tEnd,0]],"muted",1,"4 3"));
      if(inU)q.push(B.clip([[t0,-d],[tEnd,-d]],"purple",1.2,"3 3"));
      if(I){q.push(B.clip(ts.map(function(t,i){return [t,pp[i]];}),"gold",1.6));q.push(B.clip(ts.map(function(t,i){return [t,ip[i]];}),"green",1.8));}
      q.push(B.clip(ts.map(function(t,i){return [t,us[i]];}),"ink",1.6));
      var leg=[["signal",null,"制御量のずれ"],["green","5 3","式の値"],["ink",null,"操作量"]];if(I){leg.push(["gold",null,"比例の分"]);leg.push(["green",null,"積分の分"]);}if(inU)leg.push(["purple","3 3","外乱を打ち消す値"]);
      if(nar){q.push(S.LEGL(x0,B.y+B.h+46,leg.slice(0,3),9,10));q.push(S.LEGL(x0,B.y+B.h+62,leg.slice(3),9,10));}
      else q.push(S.LEGL(x0,B.y+B.h+48,leg,9.5,12));
      box.set(S.svg(Wd,B.y+B.h+(nar?70:58),q));
      /* 読み出し */
      var uu=cart?"m/s":"rad",dl=cart?(inU?"坂の力 "+_w07_f(d,3)+" N（"+_w07_f(3*k,2)+"° の上り坂）":"歩道の速さ +"+_w07_f(d,2)+" m/s"):(inU?"負荷トルク "+_w07_f(0.01*k,3)+" N·m（電圧に換算して "+_w07_f(d,2)+" V）":"継ぎ手の滑り +"+_w07_f(d,2)+" rad");
      var hs="外乱: "+dl+"。外乱から制御量までの伝達関数: "+(inU?"P/(1 + PC)":"1/(1 + PC)")+"<br>";
      hs+="閉ループの極: "+_w07_poles(clp)+_w07_stab(clp)+"<br>";
      if(stable){var fe=ys[ys.length-1];
        hs+="落ち着いたずれ: 式 lim<sub>s→0</sub>（伝達関数）× 外乱 = <b>"+_w07_g(pred,3)+" "+uu+"</b>、数値計算（"+_w07_f(tEnd,2)+" s）"+_w07_g(fe,3)+" "+uu;
        if(Math.abs(pred)<1e-9)hs+=' <span class="ok">（ずれは消える）</span>';
        if(inU&&I)hs+="<br>積分の分が、外乱を打ち消す値 "+_w07_g(-d,3)+" "+(cart?"N":"V")+" に近づき（"+_w07_f(tEnd,2)+" s で "+_w07_g(ip[ip.length-1],3)+"）、偏差 0 のまま外乱を支える";
        else if(inU&&cart)hs+="<br>力の釣り合い: 押す力の増え K<sub>P</sub>e と、遅くなった分の抵抗の減り ce の和が、坂の力と釣り合う。(K<sub>P</sub> + c)e = "+_w07_g(-d,3)+" N なので e = "+_w07_g(-d/(K+2),3)+" m/s（1 章 4 節）";
        else if(inU)hs+="<br>止まった軸で負荷を支えるには電圧が "+_w07_g(-d,3)+" V 要り、それを比例の分 K<sub>P</sub>e で作るので、偏差 e = "+_w07_g(-d,3)+" ÷ "+K+" = "+_w07_g(-d/K,3)+" rad が残る（4 章 6 節）";
      } else hs+='<span class="warn">閉ループが不安定なので、ずれは落ち着かない（最終値の定理は使えない）。</span>';
      ro.innerHTML=hs+'<div class="wnote">目標値は 0 のまま、0.2 s（紫の帯の始まり）にステップの外乱を入れた。縦軸は、外乱が無いときからのずれ。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 5・6 節: ばらつく対象・坂・観測ノイズ ---- */
  /* 台車の一次遅れ T y' + y = K(u + d) を h 刻みで厳密に進める（刻みの間は u 一定）。u = cr + K_P(r − 測った値) + 積分（r = 1 m/s） */
  function _w07_cart(o){var h=o.h||2e-4,n=Math.round(o.tEnd/h),y=0,ii=0,nzv=0,a=Math.exp(-h/o.T),hold=Math.max(1,Math.round(0.01/h)),ev=o.every||10,out={t:[],y:[],u:[]};
    for(var k=0;k<=n;k++){var t=k*h;
      if(o.rnd&&k%hold===0)nzv=0.02*o.rnd.normal();
      var ym=y+(o.rnd?nzv:0),e=1-ym,u=2+(o.closed?o.Kp*e+ii:0),d=(o.slope!=null&&t>=o.slope)?-0.51342:0;
      if(k%ev===0){out.t.push(t);out.y.push(y);out.u.push(u);}
      if(o.closed&&o.I)ii+=25*e*h;
      var yi=o.K*(u+d);y=yi+(y-yi)*a;}
    return out;}
  function _w07_sd(v){var m=v.reduce(function(s,x){return s+x;},0)/v.length;return Math.sqrt(v.reduce(function(s,x){return s+(x-m)*(x-m);},0)/v.length);}
  REG.w07_sens=function(el,U){
    var S=U.S;
    U.head(el,"SENSITIVITY","ばらつく対象の応答の束（開ループと閉ループ）と、坂・観測ノイズ");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0,1,2,4,8,14,20,30,40],value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var rg=U.slider(r1,"ばらつきの幅（K と T）",{values:[0,10,20,30,40,50,60],value:50,fmt:function(v){return "± "+v+" %";},onInput:draw});
    var r2=U.ctrls(el);
    var ig=U.checkbox(r2,"積分を足す（K<sub>I</sub> = 25 N/m）",false,draw);
    var sl=U.checkbox(r2,"2 s から上り坂 3°",false,draw);
    var nz=U.checkbox(r2,"観測ノイズ（0.01 s ごとに変わる、標準偏差 0.02 m/s）",false,draw);
    var br=U.btnrow(el),seed=1;
    function set(k,r,i,s,n){kp.set(k);rg.set(r);ig.set(i);sl.set(s);nz.set(n);draw();}
    U.button(br,"本文の例（K<sub>P</sub> = 8、±50 %）",function(){set(8,50,false,false,false);});
    U.button(br,"坂とノイズ（K<sub>P</sub> = 8）",function(){set(8,50,false,true,true);});
    U.button(br,"坂とノイズ（K<sub>P</sub> = 30）",function(){set(30,50,false,true,true);});
    U.button(br,"積分を足す",function(){set(8,50,true,true,false);});
    var sb=U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var Kp=kp.get(),r=rg.get()/100,I=ig.get(),slope=sl.get()?2:null,noise=nz.get(),tEnd=4;
      sb.style.display=noise?"":"none";
      var fs=[1-r,1,1+r],nar=_w07_nar(box),Wd=nar?400:700,o=[],cols=["teal","signal","gold"],dashes=["2 3",null,"7 3"],fin=[[],[]];
      for(var j=0;j<2;j++){
        var x=nar?52:62+j*330,y0=nar?24+j*200:24,P=U.plot(x,y0,nar?330:270,nar?150:190,[0,tEnd],[0,1.8]);
        o.push(S.TX(x-40,y0-8,j===0?"(a) 開ループ（u = cr = 2 N で押すだけ）":"(b) 閉ループ（u = cr + K_P(r − y)"+(I?" + 積分":"")+"）","start",10,"ink",true));
        if(slope!=null)o.push(S.RECT(P.X(slope),P.y,P.X(tEnd)-P.X(slope),P.h,0,U.soft("purple"),"none",0));
        o.push(P.axes({xl:(nar&&j===0)?null:"時間 t [s]",yl:(nar||j===0)?"速度 y [m/s]":null,xt:[0,1,2,3,4],yt:[0,0.5,1,1.5],xfmt:function(v){return _w07_g(v,3);},yfmt:function(v){return _w07_g(v,3);},ylOff:38,sz:9}));
        o.push(P.line([[0,1],[tEnd,1]],"muted",1.1,"4 3"));
        for(var a=0;a<3;a++)for(var b=0;b<3;b++){
          var K=0.5*fs[a],T=0.5*fs[b],nom=a===1&&b===1;
          var R=_w07_cart({K:K,T:T,Kp:Kp,I:I,slope:slope,closed:j===1,tEnd:tEnd,rnd:(noise&&j===1)?U.rng(seed+3*a+b):null});
          o.push(P.clip(R.t.map(function(t,i){return [t,R.y[i]];}),cols[a],nom?2.3:1.3,dashes[b]));
          fin[j].push(j===0?2*K:(I?1:K*(2+Kp)/(1+K*Kp)));}
        /* 坂が無いときに落ち着く値の幅（最終値の定理） */
        var lo=Math.min.apply(null,fin[j]),hi=Math.max.apply(null,fin[j]),bx=P.x+P.w+8;
        o.push(S.RECT(bx,P.Y(hi),8,Math.max(1,P.Y(lo)-P.Y(hi)),2,U.soft(j===0?"alias":"green"),j===0?"alias":"green",1.2));}
      if(!nar){o.push(S.LEGL(62,256,[["teal",null,"K × "+_w07_g(fs[0],2)],["signal",null,"× 1（例の値）"],["gold",null,"× "+_w07_g(fs[2],2)]],9.5,12));
        o.push(S.LEGL(392,256,[["muted","2 3","T × "+_w07_g(fs[0],2)],["muted",null,"× 1"],["muted","7 3","× "+_w07_g(fs[2],2)]],9.5,12));}
      else{o.push(S.LEGL(52,446,[["teal",null,"K × "+_w07_g(fs[0],2)],["signal",null,"× 1"],["gold",null,"× "+_w07_g(fs[2],2)]],9.5,10));
        o.push(S.LEGL(52,462,[["muted","2 3","T × "+_w07_g(fs[0],2)],["muted",null,"× 1"],["muted","7 3","× "+_w07_g(fs[2],2)]],9.5,10));}
      box.set(S.svg(Wd,nar?472:266,o));
      /* 読み出し */
      var g=1+0.5*Kp,h="",lo0=Math.min.apply(null,fin[0]),hi0=Math.max.apply(null,fin[0]),lo1=Math.min.apply(null,fin[1]),hi1=Math.max.apply(null,fin[1]);
      h+="坂が無いときに落ち着く速度の幅（最終値の定理）: 開ループ <b>"+_w07_f(lo0,3)+"〜"+_w07_f(hi0,3)+" m/s</b>、閉ループ <b>"+_w07_f(lo1,3)+"〜"+_w07_f(hi1,3)+" m/s</b><br>";
      if(!I){var Kl=0.5*(1-r),Kh=0.5*(1+r);
        h+="5 節の式 δS'(0) = δ ÷ (1 + K'K<sub>P</sub>): 定常ゲインが −"+_w07_f(r*100,0)+" % なら "+_w07_f(-r/(1+Kl*Kp)*100,1)+" %、+"+_w07_f(r*100,0)+" % なら +"+_w07_f(r/(1+Kh*Kp)*100,1)+" %（例の値の対象の S(0) = 1/(1 + KK<sub>P</sub>) = "+_w07_g(1/g,3)+"）<br>";}
      else h+='<span class="ok">積分を足すと型 1 になり、S(0) = 0 なので、どの対象でも 1 m/s に落ち着く</span><br>';
      if(slope!=null){var Rc=_w07_cart({K:0.5,T:0.5,Kp:Kp,I:I,slope:slope,closed:true,tEnd:tEnd});
        h+="坂の上で落ち着く速度（例の値の対象）: 開ループ（式）1 − 0.5 × 0.513 = 0.743 m/s、閉ループ "+(I?"<b>1.000 m/s</b>（積分で戻る。数値計算 "+_w07_f(Rc.y[Rc.y.length-1],3)+" m/s）":"（式）1 − 0.513 × 0.5/(1 + 0.5K<sub>P</sub>) = <b>"+_w07_f(1-0.51342*0.5/g,3)+" m/s</b>（ノイズ無しの数値計算 "+_w07_f(Rc.y[Rc.y.length-1],3)+" m/s）")+"<br>";}
      if(noise){if(Kp>0){var Rn=_w07_cart({K:0.5,T:0.5,Kp:Kp,I:I,closed:true,tEnd:60,h:1e-3,every:1,rnd:U.rng(seed+100)}),i0=Math.round(2/1e-3);
          h+="観測ノイズによる揺れ（例の値の対象、平らな道で 58 s の標準偏差）: 速度 <b>"+_w07_g(_w07_sd(Rn.y.slice(i0)),2)+" m/s</b>、押す力 <b>"+_w07_g(_w07_sd(Rn.u.slice(i0)),2)+" N</b>（1 章 4 節: K<sub>P</sub> = 8 で 0.0035 m/s・0.16 N、30 で 0.0071 m/s・0.56 N）<br>";}
        else h+="K<sub>P</sub> = 0 では、測った値を使わないので、観測ノイズは速度に出ない<br>";}
      h+=(Kp>0?"比例ゲインを上げると、束は細くなり、坂によるずれも減る。その代わり、観測ノイズが速度と力に大きく出る（6 節）。":"K<sub>P</sub> = 0 では、閉ループも開ループと同じになる。");
      ro.innerHTML=h+'<div class="wnote">台車の速度（例の値 K = 0.5 (m/s)/N、T = 0.5 s）の K と T を、それぞれ 3 通りに変えた 9 通り（右の帯は、坂が無いときに落ち着く速度の幅）。決めた力 u<sub>0</sub> = cr = 2 N（c は例の値）はどちらにも足す。観測ノイズは閉ループだけに入る（開ループは測らない）。束は 0.2 ms 刻み、ノイズの揺れは 1 章と同じ 1 ms 刻みで計算した。</div>';
    }
    draw();
  };

  /* ===== END CHAPTER WIDGETS ===== */

  window.CONTROL=U;
  function boot(){
    document.querySelectorAll("[data-widget]").forEach(function(el){
      if(el.getAttribute("data-ready"))return; el.setAttribute("data-ready","1");
      var fn=REG[el.getAttribute("data-widget")];
      if(!fn){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: 部品 '+esc(el.getAttribute("data-widget"))+' が見つからない</div>';return;}
      try{fn(el,U);}catch(e){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: '+esc(e.message)+'</div>';if(window.console)console.error(e);}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
