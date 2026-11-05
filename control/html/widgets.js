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
     set(v) で決めた値は、利用者が動かすまでそのまま get() が返す。返り値 {get(), set(v), refresh(), input}。
     refresh() は値を変えずに表示だけを書き直す（fmt が他の部品の状態に依存するとき、その状態が変わった後に呼ぶ）。 */
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
    var api={input:inp,el:c,refresh:function(){show();},
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
    TOPIN:function(x,yc,h,lab,c,hl){c=c||"purple";var R=15;return S.ARR(x,yc-h,x,yc-R,c,hl?2.4:1.6)+(lab?S.TX(x+8,yc-h+10,lab,"start",10,c,true,true):"");},
    /* ---- 複素平面（ナイキスト線図の地。09 章で作ったものを共通にした。figures.py の CPLANE・M1・CURVEHEAD と同じ見た目） ----
       返り値 {svg, P}（P は plot）。o = {unit（単位円の破線。既定 true）, m1（−1 の点。既定 true）}。縦横の目盛をそろえるには w/(xr の幅) = h/(yr の幅) */
    CPLANE:function(x,y,w,h,xr,yr,o){o=o||{};var P=plot(x,y,w,h,xr,yr),s=[S.RECT(x,y,w,h,0,"var(--screen)","line",0.8)];
      s.push(P.axes({xt:nice(xr[0],xr[1],5).filter(function(v){return v>=xr[0]&&v<=xr[1];}),yt:nice(yr[0],yr[1],5).filter(function(v){return v>=yr[0]&&v<=yr[1];}),sz:9}));
      if(yr[0]<0&&yr[1]>0)s.push(S.L(x,P.Y(0),x+w,P.Y(0),"muted",1));
      if(xr[0]<0&&xr[1]>0)s.push(S.L(P.X(0),y,P.X(0),y+h,"muted",1));
      if(o.unit!==false){var c=[];for(var i=0;i<=120;i++){var a=2*Math.PI*i/120;c.push([Math.cos(a),Math.sin(a)]);}s.push(P.clip(c,"faint",1.1,"4 3"));}
      if(o.m1!==false&&xr[0]<-1){s.push(S.X(P.X(-1),P.Y(0),5,"alias",2.2));s.push(S.T(P.X(-1),P.Y(0)-9,"−1","middle",10,"alias",true,false,null,true));}
      return {svg:s.join(""),P:P};},
    /* 曲線（[[re,im],…]、plot P の座標）の k 番目に、進む向き（番号が増える向き）の矢じりを置く。枠の外なら描かない */
    CURVEHEAD:function(P,pts,k,c,hd){var a=pts[Math.max(0,k-2)],b=pts[Math.min(pts.length-1,k+2)];
      function inn(q){return q[0]>=P.xr[0]&&q[0]<=P.xr[1]&&q[1]>=P.yr[0]&&q[1]<=P.yr[1];}
      if(!inn(a)||!inn(b)||Math.hypot(P.X(b[0])-P.X(a[0]),P.Y(b[1])-P.Y(a[1]))<2)return "";
      return S.head(P.X(a[0]),P.Y(a[1]),P.X(b[0]),P.Y(b[1]),c,hd||7);}
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
      /* 位相の始まりを、因数ごとの位相の和にそろえる（360° の整数倍だけずらす）。積分 1 つなら −90° から、
         負の定数なら −180° から、右半平面の零点・むだ時間は位相を遅らせる側に描かれる */
      if(ws.length){var w0=ws[0],nn=G.num.slice(),dd=G.den.slice(),N=0,jw=c(0,w0),one=c(1,0);
        /* 原点の極（積分）と零点（微分）を数え、低い角周波数の形 K0/(jω)^N の位相（K0 が負なら −180°）から始める */
        while(dd.length>1&&dd[dd.length-1]===0){dd.pop();N++;}
        while(nn.length>1&&nn[nn.length-1]===0){nn.pop();N--;}
        var ref=(nn[nn.length-1]/dd[dd.length-1]<0?-Math.PI:0)-N*Math.PI/2;
        /* 原点以外の零点 z と極 p は (1 − jω/z)・(1 − jω/p) の形の因数の偏角を足し引きする（右半平面の零点は位相を遅らせる側になる） */
        (nn.length>1?poly.roots(nn):[]).forEach(function(z){ref+=cx.arg(cx.sub(one,cx.div(jw,z)));});
        (dd.length>1?poly.roots(dd):[]).forEach(function(p){ref-=cx.arg(cx.sub(one,cx.div(jw,p)));});
        ref=ref*180/Math.PI-(G.delay||0)*w0*180/Math.PI;
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
    /* フィードバック系（07 章の基本の形: 偏差 → 制御器 C → 操作量 → 制御対象 P → 制御量、センサは 1）を時間の刻みで数値計算する。
       P はむだ時間 P.delay を含んでよい（C はプロパーで、むだ時間を含まない）。
       o = {tEnd（必須）, n（刻みの数。既定 20000）, r（目標値: 数か t の関数。既定 1）, d（操作量に入る外乱: t の関数）,
            dy（制御量に入る外乱: t の関数）, noise（観測ノイズ: (t, k) の関数）, umin・umax（操作量の飽和。積分は止めないので
            ワインドアップはそのまま起きる）, every（記録の間引き。既定は約 1000 点になる数）}。
       P と C は零次ホールドで離散化し、むだ時間は操作量を刻みの数だけ遅らせる（操作量を刻みの間保つので平均 h/2 の遅れが加わる。
       h = tEnd/n を対象の時定数とむだ時間より十分小さくする）。返り値 {t, y（制御量）, u（制御器の出力。飽和の後）, e（偏差）, blow（発散したか）} */
    function simLoop(P,C,o){o=o||{};var n=o.n||20000,tEnd=o.tEnd,h=tEnd/n,ev=o.every||Math.max(1,Math.round(n/1000));
      var rf=typeof o.r==="function"?o.r:(function(v){return function(){return v;};})(o.r==null?1:o.r);
      var Sp=ss(tf(P.num,P.den)),Sc=ss(tf(C.num,C.den)),np=Sp.A.length,nc=Sc.A.length,Dp=Sp.D[0][0],Dc=Sc.D[0][0];
      var nd=Math.round((P.delay||0)/h);if(Dp!==0&&nd===0)throw new Error("simLoop: むだ時間の無い対象は厳密にプロパーにする");
      var dp=np?mat.c2d(Sp.A,Sp.B,h):null,dc=nc?mat.c2d(Sc.A,Sc.B,h):null,xp=new Float64Array(np),xc=new Float64Array(nc),buf=new Float64Array(Math.max(1,nd)),bi=0;
      var out={t:[],y:[],u:[],e:[],blow:false},i,j;
      function upd(x,d,v){var nx=new Float64Array(x.length);for(i=0;i<x.length;i++){var sm=d.B[i][0]*v;for(j=0;j<x.length;j++)sm+=d.A[i][j]*x[j];nx[i]=sm;}return nx;}
      for(var k=0;k<=n;k++){var t=k*h,ua=nd?buf[bi]:0,y=0,uc=0;
        for(i=0;i<np;i++)y+=Sp.C[0][i]*xp[i];if(nd)y+=Dp*ua;if(o.dy)y+=o.dy(t);
        var e=rf(t)-(y+(o.noise?o.noise(t,k):0));
        for(i=0;i<nc;i++)uc+=Sc.C[0][i]*xc[i];uc+=Dc*e;
        if(o.umax!=null&&uc>o.umax)uc=o.umax;if(o.umin!=null&&uc<o.umin)uc=o.umin;
        var uin=uc+(o.d?o.d(t):0);if(nd){buf[bi]=uin;bi=(bi+1)%nd;}else ua=uin;
        if(k%ev===0){out.t.push(t);out.y.push(y);out.u.push(uc);out.e.push(e);}
        if(!isFinite(y)||Math.abs(y)>1e9){out.blow=true;break;}
        if(nc)xc=upd(xc,dc,e);if(np)xp=upd(xp,dp,ua);}
      return out;}
    /* 感度関数のゲインの最大値 Ms = max |1/(1 + L(jω))| と、その角周波数。1/Ms は、ナイキスト線図の −1 から L(jω) までの最短距離。
       L はむだ時間を含んでよい。L(jω) が −1 を通るときは Ms = ∞ */
    function smax(L,wlo,whi){wlo=wlo||1e-4;whi=whi||1e5;var ws=logspace(Math.log10(wlo),Math.log10(whi),4000),best=-1,bw=wlo,i;
      function f(w){var v=freq(L,w);return 1/cx.abs(cx.add(c(1,0),v));}
      for(i=0;i<ws.length;i++){var m=f(ws[i]);if(m>best){best=m;bw=ws[i];}}
      var a=Math.log(bw)-0.01,b=Math.log(bw)+0.01,g=0.381966;for(i=0;i<80;i++){var x1=a+g*(b-a),x2=b-g*(b-a);if(f(Math.exp(x1))>f(Math.exp(x2)))b=x2;else a=x1;}
      var wm=Math.exp((a+b)/2),Ms=Math.max(best,f(wm));return {Ms:Ms,w:Ms>best?wm:bw,dist:1/Ms};}
    /* 根軌跡: a(s) + K b(s) = 0 の根を Ks の各 K で求め、枝ごとに並べる（12 章で作ったものを共通にした）。
       1 つ前の K の根に近い根から順に同じ枝につなぐので、根の順番の入れ替わりで線が飛ばない。返り値 R[枝][K の番号]（{re,im}）。
       枝の描き方の例: R.forEach(function(br){svg+=P.clip(br.map(function(z){return [z.re,z.im];}),"signal",2);}) */
    function rlocus(a,b,Ks){var R=null,prev=null;
      Ks.forEach(function(K){var r=poly.roots(poly.add(a,poly.scale(b,K)));
        if(!R){R=r.map(function(z){return [z];});prev=r;return;}
        if(r.length!==prev.length)return;
        var n=r.length,pairs=[],ui={},uj={},asg=[],cnt=0,i,j;
        for(i=0;i<n;i++)for(j=0;j<n;j++)pairs.push([Math.hypot(prev[i].re-r[j].re,prev[i].im-r[j].im),i,j]);
        pairs.sort(function(x,y){return x[0]-y[0];});
        for(var k=0;k<pairs.length&&cnt<n;k++){var q=pairs[k];if(ui[q[1]]||uj[q[2]])continue;ui[q[1]]=1;uj[q[2]]=1;asg[q[1]]=r[q[2]];cnt++;}
        for(i=0;i<n;i++)R[i].push(asg[i]);prev=asg;});
      return R||[];}
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
        /* 枠の外へは伸ばさない（枠の境目で切る） */s.push(P.clip([[0,0],[-R*Math.cos(th),R*Math.sin(th)]],"faint",1,"4 3"));s.push(P.clip([[0,0],[-R*Math.cos(th),-R*Math.sin(th)]],"faint",1,"4 3"));});
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
      /* 目盛の範囲の外に出る部分は、枠の端に張り付けず、切り落とす */
      curves.forEach(function(cv){var a=[],b=[];cv.w.forEach(function(ww,i){if(ww>=wr[0]*(1-1e-9)&&ww<=wr[1]*(1+1e-9)){a.push([ww,cv.db[i]]);b.push([ww,cv.ph[i]]);}});
        s.push(Pm.clip(a,cv.c||"signal",cv.lw||2,cv.dash));s.push(Pp.clip(b,cv.c||"signal",cv.lw||2,cv.dash));});
      return {svg:s.join(""),Pm:Pm,Pp:Pp,h:y+hm+gap+hp+40};}
    /* 図の上でのドラッグ。box は U.svgbox の返り値。cb(type, x, y) の x, y は SVG の座標（viewBox の単位）。
       type は "down"・"move"・"up"。ドラッグ中だけ画面のスクロールを止める */
    function drag(box,cb){var el=box.el,on=false;el.style.touchAction="none";
      function pt(e){var sv=el.querySelector("svg");if(!sv)return null;var m=sv.getScreenCTM();if(!m)return null;var p=sv.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var q=p.matrixTransform(m.inverse());return [q.x,q.y];}
      el.addEventListener("pointerdown",function(e){var q=pt(e);if(!q)return;if(cb("down",q[0],q[1])===false)return;on=true;try{el.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();});
      el.addEventListener("pointermove",function(e){if(!on)return;var q=pt(e);if(q)cb("move",q[0],q[1]);e.preventDefault();});
      function end(e){if(!on)return;on=false;var q=pt(e);cb("up",q?q[0]:null,q?q[1]:null);}
      el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);}
    return {cx:cx,c:c,poly:poly,tf:tf,freq:freq,bode:bode,series:series,parallel:parallel,feedback:feedback,loop:loop,simLoop:simLoop,smax:smax,rlocus:rlocus,poles:poles,zeros:zeros,dcgain:dcgain,
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

  /* ===== 08 章 周波数応答とボード線図 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w08_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w08_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w08_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=(+v).toExponential(1);return s.replace(/^-/,"−");}
  /* 有効数字 d 桁（末尾の 0 を残す。例 4.80） */
  function _w08_p3(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v).toPrecision(d);if(s.indexOf("e")>=0)s=String(+(+v).toPrecision(d));return s.replace(/^-/,"−");}
  /* 低い角周波数の漸近形 K0/(jω)^N の位相 [°]（K0 が負なら −180°）。本文 5 節の図と同じ約束で位相をつなぐ */
  function _w08_ph0(num,den){var n=num.slice(),d=den.slice(),N=0;while(d.length>1&&d[d.length-1]===0){d.pop();N++;}while(n.length>1&&n[n.length-1]===0){n.pop();N--;}return (n[n.length-1]/d[d.length-1]<0?-180:0)-90*N;}
  /* U.ctl.bode の結果の位相を、上の約束の始まりにそろえ直す（360° の整数倍だけずらす） */
  function _w08_bode(U,G,ws){var b=U.ctl.bode(G,ws),ref=_w08_ph0(G.num,G.den)-(G.delay||0)*ws[0]*180/Math.PI,sh=Math.round((ref-b.ph[0])/360)*360;
    if(sh)b.ph=b.ph.map(function(p){return p+sh;});return b;}
  /* 1 つの角周波数の位相を、近い値 near に合うように 360° の整数倍を選んで返す */
  function _w08_phAt(U,G,w,near){var v=U.ctl.freq(G,w),p=Math.atan2(v.im,v.re)*180/Math.PI;return p+Math.round((near-p)/360)*360;}
  /* 曲線 (xs, ys) の x での値（対数の x で直線補間） */
  function _w08_interp(xs,ys,x){if(x<=xs[0])return ys[0];for(var i=1;i<xs.length;i++)if(xs[i]>=x){var a=Math.log(xs[i-1]),b=Math.log(xs[i]),f=(Math.log(x)-a)/(b-a);return ys[i-1]+f*(ys[i]-ys[i-1]);}return ys[ys.length-1];}
  /* ばねのジグザグ（x1 から x2 へ、高さ y） */
  function _w08_spring(S,x1,x2,y,c){var n=8,pts=[[x1,y],[x1+6,y]],L=x2-x1-12;for(var i=0;i<n;i++)pts.push([x1+6+L*(i+0.5)/n,y+(i%2?6:-6)]);pts.push([x2-6,y]);pts.push([x2,y]);return S.PL(pts,c,1.5);}
  function _w08_damper(S,x1,x2,y,c){var m=(x1+x2)/2;return S.L(x1,y,m-4,y,c,1.5)+S.PL([[m-10,y-7],[m+6,y-7],[m+6,y+7],[m-10,y+7]],c,1.5)+S.L(m-4,y-5,m-4,y+5,c,2)+S.L(m-4,y,x2,y,c,1.5);}

  /* ---- 3 節: 正弦波の入出力・G(jω) の矢印・ボード線図の上の点 ---- */
  var _W08_OBJ=[
    {nm:"台車の速度（一次遅れ）",num:[0.5],den:[0.5,1],L:0,wc:2,lo:-2,hi:2,ex:2,uN:"力 u [N]",yN:"速度 y [m/s]",gu:"(m/s)/N",uu:"N",yu:"m/s",ys:1,pic:"cart",slow:0.5},
    {nm:"台車とばね・ダンパ（二次遅れ）",num:[1],den:[1,2,25],L:0,wc:5,lo:-1.5,hi:1.5,ex:4.796,uN:"力 u [N]",yN:"位置 y [cm]",gu:"m/N",uu:"N",yu:"cm",ys:100,pic:"spring",slow:1},
    {nm:"付け根を動かす台車（零点あり）",num:[2,25],den:[1,2,25],L:0,wc:5,lo:-1.5,hi:1.5,ex:5,uN:"付け根 u [cm]",yN:"台車 y [cm]",gu:"倍",uu:"cm",yu:"cm",ys:1,pic:"base",slow:1},
    {nm:"温度の板（一次遅れ＋むだ時間）",num:[1.25],den:[500,1],L:20,wc:0.0063246,lo:-1.5,hi:1.5,ex:0.05,uN:"電力 u [W]",yN:"温度 y [K]",gu:"K/W",uu:"W",yu:"K",ys:1,pic:"plate",slow:500}
  ];
  REG.w08_sine=function(el,U){
    var S=U.S;
    U.head(el,"SINE WAVE","正弦波を入れる — 波形・G(jω) の矢印・ボード線図の上の点");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W08_OBJ.map(function(o){return o.nm;}),0,function(){var o=_W08_OBJ[ob.get()];wx.set(Math.log10(o.ex/o.wc));tk.stop();draw();});
    var vw=U.select(r1,"右上の図",["G(jω) の矢印（複素平面）","極・零点から jω への矢印（s 平面）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var wx=U.slider(r2,"角周波数 ω",{min:-2,max:2,step:0.005,value:0,fmt:function(v){return _w08_p3(cur().wc*Math.pow(10,v),3)+" rad/s";},onInput:function(){draw();}});
    wx.el.style.flex="1 1 100%";
    var br=U.btnrow(el);
    function pre(k,w){ob.set(k);var o=_W08_OBJ[k];wx.set(Math.log10(w/o.wc));draw();}
    U.button(br,"本文の例（台車の速度・2 rad/s）",function(){pre(0,2);});
    U.button(br,"0.5 rad/s",function(){pre(0,0.5);});
    U.button(br,"8 rad/s",function(){pre(0,8);});
    U.button(br,"台車とばね: ゲインの山 4.80 rad/s",function(){pre(1,4.796);});
    U.button(br,"温度の板 0.05 rad/s",function(){pre(3,0.05);});
    var br2=U.btnrow(el);
    var th=0,tk=U.ticker(function(){th+=2*Math.PI*0.02;drawAnim();},40);
    U.button(br2,"▶ 再生",function(){tk.start();});
    U.button(br2,"■ 止める",function(){tk.stop();});
    var box=U.svgbox(el),ro=U.readout(el),st=null;
    function cur(){return _W08_OBJ[ob.get()];}
    /* 対象ごとの、角周波数の範囲での最大のゲイン（右の目盛に使う） */
    _W08_OBJ.forEach(function(o){if(o.gmax)return;var G=U.ctl.tf(o.num,o.den,o.L),m=0;for(var i=0;i<=300;i++){var w=o.wc*Math.pow(10,o.lo+(o.hi-o.lo)*i/300);m=Math.max(m,U.ctl.cx.abs(U.ctl.freq(G,w)));}o.gmax=m;});
    /* 止まった状態から正弦波を入れて数値計算し、最後の 2 周期から振幅と位相を測る */
    function sim(o,w){var G=U.ctl.tf(o.num,o.den,o.L),P=2*Math.PI/w,ts=Math.max(6*o.slow+o.L,3*P),np=Math.ceil(ts/P)+2,M=64,n=np*M,tEnd=np*P,h=tEnd/n;
      var r=U.ctl.lsim(G,function(t){return Math.sin(w*(t+h/2));},tEnd,n),ss=0,sc=0;
      for(var k=n-2*M;k<n;k++){ss+=r.y[k]*Math.sin(w*r.t[k]);sc+=r.y[k]*Math.cos(w*r.t[k]);}
      var re=ss/M,im=sc/M;return {amp:Math.hypot(re,im),ph:Math.atan2(im,re)*180/Math.PI,r:r,n:n,M:M,P:P,t0:tEnd-2*P};}
    function draw(){
      var o=cur(),w=o.wc*Math.pow(10,wx.get()),G=U.ctl.tf(o.num,o.den,o.L),wlo=o.wc*Math.pow(10,o.lo),whi=o.wc*Math.pow(10,o.hi);
      var ws=U.ctl.logspace(Math.log10(wlo),Math.log10(whi),400),B=_w08_bode(U,G,ws),gv=U.ctl.freq(G,w),gain=U.ctl.cx.abs(gv);
      var ph=_w08_phAt(U,G,w,_w08_interp(ws,B.ph,w)),sm=sim(o,w);
      var phs=sm.ph+Math.round((ph-sm.ph)/360)*360;
      st={o:o,w:w,G:G,ws:ws,B:B,gv:gv,gain:gain,ph:ph,sm:sm};
      drawAnim();
      var dt=-ph*Math.PI/180/w;
      var h="ω = <b>"+_w08_p3(w,3)+" rad/s</b>（周期 "+_w08_p3(2*Math.PI/w,3)+" s）: G(jω) = "+_w08_p3(gv.re,3)+(gv.im<0?" − ":" + ")+"<i>j</i>"+_w08_p3(Math.abs(gv.im),3)+"<br>";
      h+="ゲイン |G(jω)| = <b>"+_w08_p3(gain,3)+" "+o.gu+"</b>（"+_w08_f(20*Math.log10(gain),2)+" dB）、位相 ∠G(jω) = <b>"+_w08_f(ph,1)+"°</b>（出力の山は入力の山より "+_w08_p3(dt,3)+" s 遅れる）<br>";
      h+="数値計算の定常状態（最後の 2 周期）から測った値: ゲイン "+_w08_p3(sm.amp,3)+"、位相 "+_w08_f(phs,1)+"°";
      if(o.L)h+="<br>むだ時間 "+o.L+" s の分の位相 −ωL = "+_w08_f(-w*o.L*180/Math.PI,1)+"°（むだ時間を除いた部分 "+_w08_f(ph+w*o.L*180/Math.PI,1)+"°）";
      ro.innerHTML=h+'<div class="wnote">入力の振幅は 1（'+o.uu+'）。数値計算は、止まった状態から正弦波を入れ、極の項が消えるまで（最も遅い時定数の 6 倍以上）進めた。上の波形は、その最後の 2 周期（定常状態）である。</div>';
    }
    function drawAnim(){
      if(!st)return;
      var o=st.o,w=st.w,P=2*Math.PI/w,nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var tc=((th/w)%(2*P)+2*P)%(2*P);
      /* (a) 定常状態の波形（左の目盛は入力、右の目盛は出力） */
      var ax=nar?52:60,aw=nar?300:340,ay=28,ah=118;
      var pa=U.plot(ax,ay,aw,ah,[0,2*P],[-1.25,1.25]);
      O.push(S.T(ax-2,ay-12,"(a) 定常状態の 2 周期","start",10.5,"ink",true));
      O.push(pa.axes({xl:"時間 t [s]（2 周期）",yl:o.uN,xt:[0,P,2*P],yt:[-1,0,1],xfmt:function(v){return _w08_sig(v,3);},yfmt:function(v){return _w08_sig(v,2);},ylOff:nar?34:40}));
      /* 右の目盛（出力）: 範囲の中の最大の振幅を、左の目盛の 1 と同じ高さにする */
      var ymx=o.gmax*o.ys,Yo=function(v){return pa.Y(v/ymx);};
      O.push(S.L(ax+aw,ay,ax+aw,ay+ah,"signal",1));
      [-1,0,1].forEach(function(k){var v=k*ymx,yy=Yo(v);O.push(S.L(ax+aw,yy,ax+aw+4,yy,"signal",1));O.push(S.T(ax+aw+7,yy+3.3,_w08_sig(v,2),"start",9,"signal"));});
      O.push(S.TX(ax+aw+(nar?34:44),ay+ah/2,o.yN,"middle",10,"signal",false,false,90));
      var su=[],sy=[],r=st.sm.r,t0=st.sm.t0;
      for(var k=0;k<=200;k++){var t=2*P*k/200;su.push([pa.X(t),pa.Y(Math.sin(w*(t0+t)))]);}
      for(var k2=st.sm.n-2*st.sm.M;k2<=st.sm.n;k2++){sy.push([pa.X(r.t[k2]-t0),Yo(r.y[k2]*o.ys)]);}
      O.push(S.PL(su,"gold",1.6));O.push(S.PL(sy,"signal",2.2));
      /* 山と遅れ */
      var th0=w*t0,tu=(Math.PI/2+2*Math.PI*Math.ceil((th0-Math.PI/2)/(2*Math.PI)))/w-t0,lag=-st.ph*Math.PI/180/w;
      if(tu+lag>2*P)tu-=P;if(tu<0)tu+=P;
      if(tu>=0&&tu+lag<=2*P+1e-9){var yA=st.gain*o.ys;
        O.push(S.D(pa.X(tu),pa.Y(1),"gold",3.4));O.push(S.D(pa.X(tu+lag),Yo(yA),"signal",3.4));
        O.push(S.L(pa.X(tu),pa.Y(1),pa.X(tu),ay+ah,"gold",1,"2 2"));O.push(S.L(pa.X(tu+lag),Yo(yA),pa.X(tu+lag),ay+ah,"signal",1,"2 2"));
        if(pa.X(tu+lag)-pa.X(tu)>10)O.push(S.ARR(pa.X(tu),ay+ah-8,pa.X(tu+lag),ay+ah-8,"muted",1.2,6));}
      O.push(S.L(pa.X(tc),ay,pa.X(tc),ay+ah,"faint",1.2));
      /* (b) 右上: 複素平面か s 平面 */
      var bx=nar?60:452,by=nar?ay+ah+62:28,bw=nar?280:238,bh=nar?190:176;
      if(vw.get()===0)O.push(drawVec(bx,by,bw,bh));else O.push(drawS(bx,by,bw,bh));
      /* (c) 動く絵 */
      var cy=nar?by+bh+46:ay+ah+58,cx0=nar?40:60,cw=nar?320:340;
      O.push(drawPic(cx0,cy,cw,tc));
      /* (d) ボード線図 */
      var dy=cy+104,bs=U.ctl.bodeSvg([{w:st.ws,db:st.B.db,ph:st.B.ph,c:"signal",lw:2.2}],{x:nar?56:64,y:dy,w:nar?310:600,hm:nar?100:110,hp:nar?90:100,gap:30,wr:[st.ws[0],st.ws[st.ws.length-1]]});
      O.push(S.T(nar?14:20,dy-8,"(d) ボード線図（点は今の角周波数）","start",10.5,"ink",true));
      O.push(bs.svg);
      var gdb=20*Math.log10(st.gain);
      O.push(S.L(bs.Pm.X(w),bs.Pm.y,bs.Pm.X(w),bs.Pp.y+bs.Pp.h,"faint",1,"3 3"));
      O.push(S.D(bs.Pm.X(w),bs.Pm.Y(Math.max(bs.Pm.yr[0],Math.min(bs.Pm.yr[1],gdb))),"gold",4.2));
      O.push(S.D(bs.Pp.X(w),bs.Pp.Y(Math.max(bs.Pp.yr[0],Math.min(bs.Pp.yr[1],st.ph))),"gold",4.2));
      O.push(S.T(bs.Pm.X(w)+7,bs.Pm.Y(gdb)-6,_w08_f(gdb,2)+" dB","start",9.5,"gold",true,false,null,true));
      O.push(S.T(bs.Pp.X(w)+7,bs.Pp.Y(st.ph)+14,_w08_f(st.ph,1)+"°","start",9.5,"gold",true,false,null,true));
      box.set(S.svg(Wd,bs.h+6,O));
    }
    function drawVec(x,y,w,h){
      var o=[],G=st.G,pts=[],ext=[0,0,0,0];
      for(var i=0;i<st.ws.length;i++){var v=U.ctl.freq(G,st.ws[i]);pts.push([v.re,v.im]);ext[0]=Math.min(ext[0],v.re);ext[1]=Math.max(ext[1],v.re);ext[2]=Math.min(ext[2],v.im);ext[3]=Math.max(ext[3],v.im);}
      var dx=(ext[1]-ext[0])*1.2||1,dy=(ext[3]-ext[2])*1.2||1,sc=Math.min(w/dx,(h-26)/dy),cxv=(ext[0]+ext[1])/2,cyv=(ext[2]+ext[3])/2;
      var X=function(v){return x+w/2+(v-cxv)*sc;},Y=function(v){return y+16+(h-26)/2-(v-cyv)*sc;};
      o.push(S.T(x,y-0,"(b) G(jω) の矢印（複素平面）","start",10.5,"ink",true));
      o.push(S.L(X(ext[0]-0.1*dx),Y(0),X(ext[1]+0.1*dx),Y(0),"muted",1));o.push(S.L(X(0),Y(ext[2]-0.1*dy),X(0),Y(ext[3]+0.1*dy),"muted",1));
      o.push(S.T(X(ext[1]+0.1*dx),Y(0)-5,"実部","end",9,"muted"));
      o.push(S.PL(pts.map(function(p){return [X(p[0]),Y(p[1])];}),"muted",1.2,null,"4 3"));
      o.push(S.ARR(X(0),Y(0),X(st.gv.re),Y(st.gv.im),"signal",2.4,8));
      var g0=pts[0];o.push(S.D(X(g0[0]),Y(g0[1]),"ink",2.8));
      o.push(S.T(x,y+h+4,"|G| = "+_w08_p3(st.gain,3)+"、∠G = "+_w08_f(st.ph,1)+"°","start",9.5,"signal",true));
      o.push(S.T(x,y+h+18,"破線: ω を動かしたときの先端の道筋","start",9,"muted"));
      return o.join("");
    }
    function drawS(x,y,w,h){
      var o=[],ps=U.ctl.poles(st.G),zs=U.ctl.zeros(st.G),pts=ps.concat(zs),x0=0,x1=0,y0=0,y1=st.w;
      pts.forEach(function(p){x0=Math.min(x0,p.re);x1=Math.max(x1,p.re);y0=Math.min(y0,p.im);y1=Math.max(y1,p.im);});
      var xs=(x1-x0)||st.w,ys=(y1-y0)||st.w;x0-=0.15*xs;x1+=0.25*xs;y0-=0.12*ys;y1+=0.18*ys;
      /* 縦と横の目盛の大きさをそろえ（角度が正しく見えるように）、すべての点を枠に入れる */
      var pw=w-34,ph=h-30,sc=Math.min(pw/(x1-x0),ph/(y1-y0)),xm=(x0+x1)/2,ymd=(y0+y1)/2;
      var P=U.plot(x+26,y+14,pw,ph,[xm-pw/sc/2,xm+pw/sc/2],[ymd-ph/sc/2,ymd+ph/sc/2]);
      o.push(S.T(x,y-0,"(b) 極・零点から jω への矢印","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));o.push(U.ctl.splane(P));
      var jw={re:0,im:st.w};
      zs.forEach(function(z){o.push(S.ARR(P.X(z.re),P.Y(z.im),P.X(0),P.Y(st.w),"teal",1.6,7));});
      ps.forEach(function(p){o.push(S.ARR(P.X(p.re),P.Y(p.im),P.X(0),P.Y(st.w),"purple",1.6,7));});
      o.push(U.ctl.pz(P,ps,zs,"signal",5));o.push(S.D(P.X(0),P.Y(st.w),"gold",4.2));
      o.push(S.T(P.X(0)-6,P.Y(st.w)-6,"jω","end",10,"gold",true,false,null,true));
      var tx="";zs.forEach(function(z){tx+="零点 "+_w08_sig(z.re,3)+" から "+_w08_sig(Math.hypot(st.w-z.im,z.re),3)+"・";});
      ps.forEach(function(p){tx+="極 "+_w08_sig(p.re,3)+(Math.abs(p.im)>1e-9?(p.im>0?"+":"−")+"j"+_w08_sig(Math.abs(p.im),3):"")+" から "+_w08_sig(Math.hypot(st.w-p.im,p.re),3)+"・";});
      o.push(S.T(x,y+h+8,"距離: "+tx.replace(/・$/,"")+(st.o.L?"（むだ時間は s 平面に現れない）":""),"start",8.5,"muted"));
      return o.join("");
    }
    function drawPic(x,y,w,tc){
      var o=st.o,wv=st.w,o2=[],t=st.sm.t0+tc,u=Math.sin(wv*t),yv=st.gain*Math.sin(wv*t+st.ph*Math.PI/180),gm=o.gmax;
      o2.push(S.T(x-2,y-6,"(c) 今の時刻の様子（縦線の時刻）","start",10.5,"ink",true));
      var gy=y+44;
      if(o.pic==="cart"){var amp=st.gain/wv,p=-amp*Math.cos(wv*t+st.ph*Math.PI/180),pm=Math.max(amp,1e-9),cx=x+w/2+60*p/pm;
        o2.push(S.L(x,gy+12,x+w,gy+12,"muted",1.2));
        o2.push(S.RECT(cx-24,gy-14,48,22,4,"var(--signal-soft)","signal",1.4));o2.push(S.CIRC(cx-12,gy+7,5,"signal",1.4,"screen"));o2.push(S.CIRC(cx+12,gy+7,5,"signal",1.4,"screen"));
        if(Math.abs(u)>0.03)o2.push(S.ARR(cx,gy-3,cx+40*u,gy-3,"gold",2.4,8));
        o2.push(S.T(x+w,y+70,"位置の振れ ±"+_w08_sig(amp,3)+" m（絵は ±60 px）","end",9,"muted"));}
      else if(o.pic==="spring"||o.pic==="base"){var sc=60/(gm*(o.pic==="spring"?o.ys:1.0)),xw=x+18;
        var ub=o.pic==="base"?u:0,yy=yv*o.ys;
        var bx=o.pic==="base"?xw+sc*ub:xw;
        o2.push(S.L(x,gy+12,x+w,gy+12,"muted",1.2));
        if(o.pic==="base"){o2.push(S.RECT(bx-12,gy-22,12,40,2,"var(--gold-soft)","gold",1.4));o2.push(S.T(bx-6,gy+26,"付け根","middle",9,"gold"));}
        else{o2.push(S.L(xw,gy-24,xw,gy+12,"muted",2));o2.push(S.T(xw,gy+26,"壁","middle",9,"muted"));}
        var cx=x+w/2+sc*yy;
        o2.push(_w08_spring(S,bx,cx-24,gy-10,"teal"));o2.push(_w08_damper(S,bx,cx-24,gy+2,"purple"));
        o2.push(S.RECT(cx-24,gy-16,48,24,4,"var(--signal-soft)","signal",1.4));o2.push(S.CIRC(cx-12,gy+8,4,"signal",1.4,"screen"));o2.push(S.CIRC(cx+12,gy+8,4,"signal",1.4,"screen"));
        if(o.pic==="spring"&&Math.abs(u)>0.03)o2.push(S.ARR(cx+24,gy-4,cx+24+36*u,gy-4,"gold",2.4,8));
        o2.push(S.T(x+w,y+70,"台車の振れ ±"+_w08_sig(st.gain*(o.pic==="spring"?100:1),3)+" cm","end",9,"muted"));}
      else{var hu=(u+1)/2,hy=0.5+0.5*yv/(gm||1);
        o2.push(S.RECT(x+20,gy-24,26,40,2,"screen","line",1));o2.push(S.RECT(x+20,gy+16-40*hu,26,40*hu,2,"var(--gold-soft)","gold",1.2));
        o2.push(S.T(x+33,gy+27,"ヒータ","middle",9,"gold"));
        o2.push(S.RECT(x+90,gy-24,16,40,8,"screen","line",1));o2.push(S.RECT(x+92,gy+14-36*Math.max(0,Math.min(1,hy)),12,36*Math.max(0,Math.min(1,hy)),6,"var(--signal-soft)","signal",1.2));
        o2.push(S.T(x+98,gy+27,"温度","middle",9,"signal"));
        o2.push(S.T(x+130,gy-4,"電力の揺れ: "+(u>=0?"+":"−")+_w08_f(Math.abs(u),2)+" W","start",9.5,"gold"));
        o2.push(S.T(x+130,gy+12,"温度の揺れ: "+(yv>=0?"+":"−")+_w08_f(Math.abs(yv),3)+" K（振幅 "+_w08_sig(st.gain,3)+" K）","start",9.5,"signal"));}
      return o2.join("");
    }
    draw();
  };

  /* ---- 5 節: 要素を組み合わせてボード線図を作る ---- */
  REG.w08_build=function(el,U){
    var S=U.S,P=U.ctl.poly;
    U.head(el,"BUILD","要素を掛け合わせてボード線図を組み立てる — 漸近線と本当の線");
    var lg=function(v){return _w08_sig(v,3);};
    var r1=U.ctrls(el);
    var kk=U.slider(r1,"定数 K",{min:0.01,max:1000,log:true,value:10.5,fmt:function(v){return lg(v)+"（"+_w08_f(20*Math.log10(v),2)+" dB）";},onInput:function(){draw();}});
    var org=U.select(r1,"原点の極・零点",["なし","積分 1/s","積分 2 つ 1/s²","微分 s"],1,function(){draw();});
    var r2=U.ctrls(el);
    var c1=U.checkbox(r2,"一次遅れ 1",true,function(){draw();});
    var w1=U.slider(r2,"折れ点 1",{min:0.001,max:1000,log:true,value:20,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var c2=U.checkbox(r2,"一次遅れ 2",false,function(){draw();});
    var w2=U.slider(r2,"折れ点 2",{min:0.001,max:1000,log:true,value:200,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cz=U.checkbox(r3,"零点（一次進み）",false,function(){draw();});
    var wz=U.slider(r3,"零点の折れ点",{min:0.001,max:1000,log:true,value:12.5,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var rz=U.checkbox(r3,"零点を右半平面に置く",false,function(){draw();});
    var r4=U.ctrls(el);
    var c4=U.checkbox(r4,"二次遅れ",false,function(){draw();});
    var wn=U.slider(r4,"固有角周波数 ω<sub>n</sub>",{min:0.001,max:1000,log:true,value:5,fmt:function(v){return lg(v)+" rad/s";},onInput:function(){draw();}});
    var ze=U.slider(r4,"減衰比 ζ",{min:0.05,max:1,step:0.01,value:0.2,fmt:function(v){return _w08_f(v,2);},onInput:function(){draw();}});
    var r5=U.ctrls(el);
    var cL=U.checkbox(r5,"むだ時間",false,function(){draw();});
    var lL=U.slider(r5,"むだ時間 L",{min:0.001,max:100,log:true,value:0.1,fmt:function(v){return lg(v)+" s";},onInput:function(){draw();}});
    var r6=U.ctrls(el);
    var ce=U.checkbox(r6,"要素ごとの線を描く",true,function(){draw();});
    var cm=U.checkbox(r6,"最小位相のもの（同じゲイン）の位相を重ねる",true,function(){draw();});
    var br=U.btnrow(el);
    function setAll(K,N,a,b,z,s,L){kk.set(K);org.set(N);c1.set(!!a);if(a)w1.set(a);c2.set(!!b);if(b)w2.set(b);cz.set(!!z);if(z){wz.set(Math.abs(z));rz.set(z<0);}else rz.set(false);c4.set(!!s);if(s){wn.set(s[0]);ze.set(s[1]);}cL.set(!!L);if(L)lL.set(L);draw();}
    U.button(br,"本文の例（モータの位置の一巡伝達関数）",function(){setAll(10.5,1,20,0,0,null,0);});
    U.button(br,"付け根を動かす台車",function(){setAll(1,0,0,0,12.5,[5,0.2],0);});
    U.button(br,"ボイラ（右半平面の零点）",function(){setAll(0.5,1,0.1,0,-1/30,null,0);});
    U.button(br,"温度の板（むだ時間）",function(){setAll(1.25,0,0.002,0,0,null,20);});
    U.button(br,"一次遅れだけ（台車の速度）",function(){setAll(0.5,0,2,0,0,null,0);});
    var box=U.svgbox(el),ro=U.readout(el);
    function model(minph){
      var K=kk.get(),N=[0,1,2,-1][org.get()],num=[K],den=[1],cor=[],el=[],L=0;
      if(N>0)for(var i=0;i<N;i++)den=P.mul(den,[1,0]);if(N<0)num=P.mul(num,[1,0]);
      el.push({nm:"定数 "+lg(K),c:"purple",f:function(w){return {db:20*Math.log10(K),ph:0};}});
      if(N!==0)el.push({nm:N>0?(N===1?"積分 1/s":"積分 1/s²"):"微分 s",c:"teal",f:function(w){return {db:-20*N*Math.log10(w),ph:-90*N};}});
      if(c1.get()){var a=w1.get();den=P.mul(den,[1/a,1]);cor.push({w:a,d:-20,nm:"一次遅れ"});el.push({nm:"一次遅れ（"+lg(a)+"）",c:"green",f:function(w){return {db:-10*Math.log10(1+w*w/(a*a)),ph:-Math.atan(w/a)*180/Math.PI};}});}
      if(c2.get()){var b=w2.get();den=P.mul(den,[1/b,1]);cor.push({w:b,d:-20,nm:"一次遅れ"});el.push({nm:"一次遅れ（"+lg(b)+"）",c:"green",dash:"2 3",f:function(w){return {db:-10*Math.log10(1+w*w/(b*b)),ph:-Math.atan(w/b)*180/Math.PI};}});}
      if(cz.get()){var z=wz.get(),rh=rz.get()&&!minph;num=P.mul(num,[rh?-1/z:1/z,1]);cor.push({w:z,d:20,nm:rh?"右半平面の零点":"零点"});
        el.push({nm:(rh?"右半平面の零点（":"零点（")+lg(z)+"）",c:"alias",f:function(w){return {db:10*Math.log10(1+w*w/(z*z)),ph:(rh?-1:1)*Math.atan(w/z)*180/Math.PI};}});}
      if(c4.get()){var n=wn.get(),zt=ze.get();den=P.mul(den,[1/(n*n),2*zt/n,1]);cor.push({w:n,d:-40,nm:"二次遅れ"});
        el.push({nm:"二次遅れ（"+lg(n)+"、ζ "+_w08_f(zt,2)+"）",c:"purple",dash:"2 3",f:function(w){var x=w/n,re=1-x*x,im=2*zt*x;return {db:-10*Math.log10(re*re+im*im),ph:-Math.atan2(im,re)*180/Math.PI};}});}
      if(cL.get()&&!minph){L=lL.get();el.push({nm:"むだ時間 "+lg(L)+" s",c:"teal",dash:"2 3",f:function(w){return {db:0,ph:-w*L*180/Math.PI};}});}
      cor.sort(function(p,q){return p.w-q.w;});
      return {G:U.ctl.tf(num,den,L),K:K,N:N,cor:cor,el:el,L:L};
    }
    function asym(m,w){var v=20*Math.log10(m.K)-20*m.N*Math.log10(w);m.cor.forEach(function(c){if(w>c.w)v+=c.d*Math.log10(w/c.w);});return v;}
    function draw(){
      var m=model(false),nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var cs=m.cor.map(function(c){return c.w;});if(m.L)cs.push(1/m.L);if(!cs.length)cs=[1];
      var lo=Math.pow(10,Math.floor(Math.log10(Math.min.apply(null,cs)/30))),hi=Math.pow(10,Math.ceil(Math.log10(Math.max.apply(null,cs)*30)));
      if(m.L){var hm=0;m.cor.forEach(function(c){hm+=c.d<0?-c.d*4.5:0;});var wmax=Math.max(0.5/m.L,(540-hm)/(m.L*57.3));hi=Math.min(hi,Math.pow(10,Math.floor(Math.log10(wmax)*2)/2));}
      if(hi/lo>1e7)lo=hi/1e7;
      var ws=U.ctl.logspace(Math.log10(lo),Math.log10(hi),500),B=_w08_bode(U,m.G,ws);
      var as=ws.map(function(w){return asym(m,w);});
      var dmin=Math.min(Math.min.apply(null,B.db),Math.min.apply(null,as)),dmax=Math.max(Math.max.apply(null,B.db),Math.max.apply(null,as));
      var dbr=[Math.max(-140,Math.floor((dmin-5)/20)*20),Math.min(140,Math.ceil((dmax+5)/20)*20)];
      var pmin=Math.min.apply(null,B.ph),pmax=Math.max.apply(null,B.ph),mp=null;
      if(cm.get()&&((cz.get()&&rz.get())||cL.get())){var mm=model(true);mp=_w08_bode(U,mm.G,ws);pmin=Math.min(pmin,Math.min.apply(null,mp.ph));pmax=Math.max(pmax,Math.max.apply(null,mp.ph));}
      var phr=[Math.max(-720,Math.floor((pmin-1)/90)*90),Math.ceil((pmax+1)/90)*90];if(phr[1]-phr[0]<180)phr[1]=phr[0]+180;
      var bs=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.6}],{x:nar?56:64,y:16,w:nar?310:600,hm:nar?150:170,hp:nar?130:140,gap:34,wr:[lo,hi],dbr:dbr,phr:phr});
      if(ce.get())m.el.forEach(function(e){var g=ws.map(function(w){return [w,e.f(w).db];}),p=ws.map(function(w){return [w,e.f(w).ph];});O.push(bs.Pm.clip(g,e.c,1.1,e.dash));O.push(bs.Pp.clip(p,e.c,1.1,e.dash));});
      O.push(bs.svg);
      O.push(bs.Pm.clip(ws.map(function(w,i){return [w,as[i]];}),"gold",2,"7 4"));
      if(mp)O.push(bs.Pp.clip(ws.map(function(w,i){return [w,mp.ph[i]];}),"green",2,"6 3"));
      m.cor.forEach(function(c){if(c.w>=lo&&c.w<=hi){O.push(S.D(bs.Pm.X(c.w),bs.Pm.Y(Math.max(dbr[0],Math.min(dbr[1],asym(m,c.w)))),"gold",3.4));}});
      var yl=bs.h+4;
      O.push(S.LEGL(nar?20:64,yl,[["signal",null,"本当の線"],["gold","7 4","漸近線（折れ線）"]].concat(mp?[["green","6 3","最小位相の位相"]]:[]),9.5,14));
      if(ce.get()){var per=nar?2:3;for(var e2=0;e2<m.el.length;e2+=per){yl+=16;O.push(S.LEGL(nar?20:64,yl,m.el.slice(e2,e2+per).map(function(e){return [e.c,e.dash||null,e.nm];}),9,12));}}
      box.set(S.svg(Wd,yl+10,O));
      /* 読み出し */
      var txt="G(s) = "+lg(m.K);m.el.slice(1).forEach(function(e){txt+=" × "+e.nm;});
      var h=txt+"<br>";
      var sg=function(v){return (v>0?"+":"")+String(v).replace("-","−");};
      var sl=-20*m.N,seg="低い角周波数の傾き "+sg(sl)+" dB/dec（ω = 1 で "+_w08_f(20*Math.log10(m.K),2)+" dB）";
      m.cor.forEach(function(c){sl+=c.d;seg+=" → "+lg(c.w)+" rad/s（"+c.nm+"）で "+sg(sl)+" dB/dec";});
      h+="漸近線: "+seg+"<br>";
      /* 0 dB を横切る所 */
      var wc=null,wa=null;for(var i=1;i<ws.length;i++){if(wc===null&&(B.db[i-1]>=0)!==(B.db[i]>=0))wc=ws[i-1]*Math.pow(ws[i]/ws[i-1],B.db[i-1]/(B.db[i-1]-B.db[i]));if(wa===null&&(as[i-1]>=0)!==(as[i]>=0))wa=ws[i-1]*Math.pow(ws[i]/ws[i-1],as[i-1]/(as[i-1]-as[i]));}
      if(wc!==null){var pc=_w08_phAt(U,m.G,wc,_w08_interp(ws,B.ph,wc));h+="ゲインが 0 dB を横切る角周波数: 本当の線 <b>"+lg(wc)+" rad/s</b>（位相 "+_w08_f(pc,1)+"°）"+(wa!==null?"、漸近線 "+lg(wa)+" rad/s":"")+"<br>";}
      else h+="この範囲では、ゲインは 0 dB を横切らない<br>";
      var em=0,ew=0;for(var k=0;k<ws.length;k++){var d=B.db[k]-as[k];if(Math.abs(d)>Math.abs(em)){em=d;ew=ws[k];}}
      h+="漸近線との差の最大: "+_w08_f(em,2)+" dB（"+lg(ew)+" rad/s）";
      if(mp){var dmx=0,dw=0;for(var k2=0;k2<ws.length;k2++){var dd=B.ph[k2]-mp.ph[k2];if(dd<dmx){dmx=dd;dw=ws[k2];}}h+="<br>最小位相のもの（零点を左半平面に・むだ時間なし）との位相の差: 最大 "+_w08_f(dmx,1)+"°（"+lg(dw)+" rad/s）。ゲインは同じ";}
      ro.innerHTML=h+'<div class="wnote">本当の線は U.ctl.bode で計算した。漸近線は、低い角周波数の直線から、折れ点ごとに傾きを −20（極）・+20（零点）・−40（二次遅れ）dB/dec 変えた折れ線（二次遅れの山や、右半平面の零点・むだ時間の位相は漸近線に入らない）。</div>';
    }
    draw();
  };

  /* ---- 6 節: 二次遅れの共振ピークとステップ応答の行き過ぎ ---- */
  REG.w08_second=function(el,U){
    var S=U.S;
    U.head(el,"RESONANCE","二次遅れの共振ピーク・バンド幅と、ステップ応答の行き過ぎ量・立ち上がり時間");
    var r1=U.ctrls(el);
    var ze=U.slider(r1,"減衰比 ζ",{min:0.05,max:1.5,step:0.005,value:0.2,fmt:function(v){return _w08_f(v,3);},onInput:function(){draw();}});
    var wn=U.slider(r1,"固有角周波数 ω<sub>n</sub>",{min:0.5,max:200,log:true,value:5,fmt:function(v){return _w08_sig(v,3)+" rad/s";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    function pre(z,w){ze.set(z);wn.set(w);draw();}
    U.button(br,"本文の例（台車とばね ζ 0.2・5 rad/s）",function(){pre(0.2,5);});
    U.button(br,U.htx("モータ K_P = 0.21（ζ 0.690）"),function(){pre(0.69,14.49);});
    U.button(br,U.htx("モータ K_P = 1（ζ 0.316）"),function(){pre(0.3162,31.62);});
    U.button(br,U.htx("モータ K_P = 10（ζ 0.1）"),function(){pre(0.1,100);});
    U.button(br,"ζ = 0.707",function(){pre(0.7072,5);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var z=ze.get(),w=wn.get(),G=U.ctl.tf([w*w],[1,2*z*w,w*w]),nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var ws=U.ctl.logspace(Math.log10(w/30),Math.log10(w*30),500),B=U.ctl.bode(G,ws);
      var bs=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4}],{x:nar?56:60,y:24,w:nar?310:330,hm:120,hp:90,gap:30,wr:[w/30,w*30],dbr:[-60,25],phr:[-180,0]});
      O.push(S.T(nar?14:16,14,"(a) ボード線図","start",10.5,"ink",true));
      O.push(bs.svg);
      O.push(bs.Pm.clip([[w/30,0],[w,0],[w*30,-40*Math.log10(30)]],"muted",1.2,"5 3"));
      O.push(S.L(bs.Pm.x,bs.Pm.Y(-3.01),bs.Pm.x+bs.Pm.w,bs.Pm.Y(-3.01),"faint",1,"3 3"));
      var Mr=1,wr=null;if(z<1/Math.SQRT2){Mr=1/(2*z*Math.sqrt(1-z*z));wr=w*Math.sqrt(1-2*z*z);}
      var q=1-2*z*z,wb=w*Math.sqrt(q+Math.sqrt(q*q+1));
      /* 数値（細かい格子で）の山とバンド幅 */
      var gi=0;B.db.forEach(function(v,i){if(v>B.db[gi])gi=i;});
      var mag=function(x){var v=U.ctl.freq(G,x);return Math.sqrt(v.re*v.re+v.im*v.im);},glo=ws[Math.max(0,gi-1)],ghi=ws[Math.min(ws.length-1,gi+1)];
      for(var it=0;it<80;it++){var m1=glo+(ghi-glo)/3,m2=ghi-(ghi-glo)/3;if(mag(m1)<mag(m2))glo=m1;else ghi=m2;}
      var gw=(glo+ghi)/2,gm=20*Math.log10(mag(gw));
      var wbn=null;for(var i=1;i<ws.length;i++)if(B.db[i-1]>=-3.0103&&B.db[i]<-3.0103){wbn=ws[i-1]*Math.pow(ws[i]/ws[i-1],(B.db[i-1]+3.0103)/(B.db[i-1]-B.db[i]));break;}
      if(wr){O.push(S.D(bs.Pm.X(wr),bs.Pm.Y(20*Math.log10(Mr)),"alias",4));O.push(S.TX(bs.Pm.X(wr)-6,bs.Pm.Y(20*Math.log10(Mr))-6,"M_r "+_w08_f(20*Math.log10(Mr),2)+" dB","end",9.5,"alias",true,true));}
      O.push(S.D(bs.Pm.X(wb),bs.Pm.Y(-3.01),"green",4));O.push(S.TX(bs.Pm.X(wb)+6,bs.Pm.Y(-3.01)-6,"ω_b "+_w08_p3(wb,3),"start",9.5,"green",true,true));
      O.push(S.D(bs.Pp.X(w),bs.Pp.Y(-90),"ink",3.4));O.push(S.TX(bs.Pp.X(w)+6,bs.Pp.Y(-90)-5,"ω_n で −90°","start",9.5,"ink",false,true));
      /* ステップ応答 */
      var tE=Math.min(Math.max(10/w,5/(z*w)),40/w),R=U.ctl.step(G,tE,800),T=R.t,Y=R.y;
      var ym=0,tp=0,t10=null,t90=null;for(var k=0;k<Y.length;k++){if(Y[k]>ym){ym=Y[k];tp=T[k];}
        if(t10===null&&Y[k]>=0.1)t10=k>0?T[k-1]+(0.1-Y[k-1])/(Y[k]-Y[k-1])*(T[k]-T[k-1]):0;
        if(t90===null&&Y[k]>=0.9)t90=T[k-1]+(0.9-Y[k-1])/(Y[k]-Y[k-1])*(T[k]-T[k-1]);}
      var Mp=Math.max(0,ym-1),tr=(t10!==null&&t90!==null)?t90-t10:null;
      var qx=nar?56:450,qy=nar?bs.h+30:24,qw=nar?310:230;
      var Q=U.plot(qx,qy,qw,110,[0,tE],[0,2]);
      O.push(S.T(qx-40,qy-10,"(b) ステップ応答","start",10.5,"ink",true));
      O.push(Q.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,tE,4),yt:[0,0.5,1,1.5,2],xfmt:function(v){return _w08_sig(v,3);},yfmt:function(v){return _w08_sig(v,2);}}));
      O.push(Q.line([[0,1],[tE,1]],"muted",1,"4 3"));
      O.push(Q.clip(T.map(function(t,i){return [t,Y[i]];}),"signal",2.2));
      if(Mp>0.001){O.push(S.D(Q.X(tp),Q.Y(Math.min(2,ym)),"alias",3.6));O.push(S.TX(Q.X(tp)+6,Q.Y(Math.min(2,ym))-4,"M_p "+_w08_f(Mp*100,1)+" %","start",9.5,"alias",true,true));}
      if(tr!==null){O.push(S.L(Q.X(t10),Q.Y(0.5),Q.X(t90),Q.Y(0.5),"green",3.2));O.push(S.TX(Q.X(t90)+5,Q.Y(0.5)+12,"t_r "+_w08_sig(tr,3)+" s","start",9.5,"green",true,true));}
      /* 共振ピークと行き過ぎ量の曲線 */
      var cx=qx,cy=qy+110+66,C=U.plot(cx,cy,qw,nar?100:96,[0,20],[0,100]);
      O.push(S.T(cx-40,cy-10,"(c) 共振ピークと行き過ぎ量","start",10.5,"ink",true));
      O.push(C.axes({xl:"M_r [dB]",yl:null,xt:[0,5,10,15,20],yt:[0,50,100],xfmt:function(v){return String(v);},yfmt:function(v){return v+" %";}}));
      var cv=[];for(var j=0;j<=200;j++){var zz=0.05+(1/Math.SQRT2-0.05)*j/200;cv.push([20*Math.log10(1/(2*zz*Math.sqrt(1-zz*zz))),100*Math.exp(-Math.PI*zz/Math.sqrt(1-zz*zz))]);}
      O.push(C.line(cv,"signal",1.8));O.push(C.line([[0,4.32],[0,0]],"signal",1.8,"4 3"));
      var mpF=z<1?100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z)):0;
      O.push(S.D(C.X(Math.min(20,20*Math.log10(Mr))),C.Y(mpF),"alias",4.5));
      var Hh=Math.max(bs.h,cy+(nar?100:96)+40);
      box.set(S.svg(Wd,nar?cy+100+44:Hh,O));
      /* 読み出し */
      var h="ζ = "+_w08_f(z,3)+"、ω<sub>n</sub> = "+_w08_sig(w,3)+" rad/s<br>";
      h+="共振ピーク: "+(wr?"式 1/(2ζ√(1 − ζ²)) = <b>"+_w08_p3(Mr,3)+"（"+_w08_f(20*Math.log10(Mr),2)+" dB）</b>、共振角周波数 ω<sub>n</sub>√(1 − 2ζ²) = "+_w08_p3(wr,3)+" rad/s（数値で探した値 "+_w08_f(gm,2)+" dB・"+_w08_p3(gw,3)+" rad/s）":"ζ ≥ 0.707 なので山は無い（0 dB）")+"<br>";
      h+="バンド幅: 式 <b>"+_w08_p3(wb,3)+" rad/s</b>（数値 "+(wbn?_w08_p3(wbn,3):"—")+" rad/s）、ω<sub>b</sub>/ω<sub>n</sub> = "+_w08_f(wb/w,3)+"<br>";
      h+="行き過ぎ量: 式 e^(−πζ/√(1 − ζ²)) = <b>"+(z<1?_w08_f(mpF,1)+" %":"0 %")+"</b>（数値 "+_w08_f(Mp*100,1)+" %）、立ち上がり時間 "+(tr!==null?"<b>"+_w08_p3(tr,3)+" s</b>、ω<sub>b</sub> × t<sub>r</sub> = "+_w08_f(wb*tr,2):"—");
      ro.innerHTML=h+'<div class="wnote">G(s) = ω<sub>n</sub><sup>2</sup>/(s<sup>2</sup> + 2ζω<sub>n</sub>s + ω<sub>n</sub><sup>2</sup>)。ボード線図の横軸は ω<sub>n</sub>/30 から 30ω<sub>n</sub> なので、ω<sub>n</sub> を変えても線の形は変わらず、目盛の数字だけが変わる（時間の目盛も同じ）。</div>';
    }
    draw();
  };

  /* ---- 6 節: 周波数掃引のシミュレーション ---- */
  var _W08_SW=[
    {nm:"温度の板（一次遅れ＋むだ時間）",kind:"fo",K:1.25,T:500,L:20,amp:40,sd:0.3,wlo:0.001,whi:0.2,slow:500,uu:"W",yu:"K",gu:"K/W",wr:[0.0005,0.22],dbr:[-45,5],phr:[-360,0],tg:[1,4]},
    {nm:"台車とばね・ダンパ（二次遅れ）",kind:"so",K:4,wn:5,z:0.2,L:0,amp:1,sd:0.2,wlo:0.5,whi:50,slow:1,uu:"N",yu:"cm",gu:"cm/N",wr:[0.2,100],dbr:[-40,30],phr:[-180,0]},
    {nm:"モータの角速度（一次遅れ）",kind:"fo",K:50,T:0.05,L:0,amp:1,sd:5,wlo:1,whi:1000,slow:0.05,uu:"V",yu:"rad/s",gu:"(rad/s)/V",wr:[0.5,2000],dbr:[-10,40],phr:[-180,0],tg:[-3,0]}
  ];
  REG.w08_sweep=function(el,U){
    var S=U.S;
    U.head(el,"FREQUENCY SWEEP","周波数掃引 — 正弦波を順に入れて、ゲインと位相を測る");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W08_SW.map(function(o){return o.nm;}),0,function(){nz.set(nz.get());sel.set(sel.get());draw();});
    var nz=U.slider(r1,"観測ノイズ（本文の値の何倍か）",{values:[0,0.5,1,2,4],value:1,fmt:function(v){var o=_W08_SW[ob.get()];return v+" 倍（"+_w08_sig(o.sd*v,2)+" "+o.yu+"）";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var np=U.slider(r2,"平均する周期の数",{values:[1,2,3,5,10,20],value:3,fmt:function(v){return v+" 周期";},onInput:function(){draw();}});
    var pd=U.slider(r2,"1 ディケードの点の数",{values:[2,3,5,10],value:3,fmt:function(v){return v+" 点";},onInput:function(){draw();}});
    var wt=U.checkbox(r2,"極の項が消えるまで待つ（最も遅い時定数の 5 倍、少なくとも 1 周期）",true,function(){draw();});
    var r3=U.ctrls(el);
    var sel=U.slider(r3,"記録を見る点（低い方から）",{min:0,max:1,step:0.001,value:3/7,fmt:function(v){var n=npts();return (Math.round(v*(n-1))+1)+" 番目";},onInput:function(){draw();}});
    sel.el.style.flex="1 1 100%";
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（温度の板・3 周期・1 ディケードに 3 点）",function(){ob.set(0);nz.set(1);np.set(3);pd.set(3);wt.set(true);seed=1;sel.set(3/7);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function npts(){var o=_W08_SW[ob.get()];return Math.round(Math.log10(o.whi/o.wlo)*pd.get())+1;}
    /* 1 刻みの式（中点の入力で零次ホールドの遅れを消す）。一次遅れは厳密、二次遅れは行列指数関数で離散化 */
    function run(o){
      var rg=U.rng(seed),n=npts(),nper=np.get(),sd=o.sd*nz.get(),out=[],ttot=0,M=100;
      for(var k=0;k<n;k++){
        var w=o.wlo*Math.pow(o.whi/o.wlo,k/(n-1)),Pd=2*Math.PI/w,dt=Pd/M,Wp=wt.get()?Math.max(1,Math.ceil(5*o.slow/Pd)):0,ss=0,sc=0,rec=[];
        var step;
        if(o.kind==="fo"){var a=Math.exp(-dt/o.T),x=0;step=function(u){var y=x;x=a*x+(1-a)*o.K*u;return y;};}
        else{var A=[[0,1],[-o.wn*o.wn,-2*o.z*o.wn]],Bm=[[0],[o.K*o.wn*o.wn]],dd=U.ctl.mat.c2d(A,Bm,dt),X=[0,0];
          step=function(u){var y=X[0],x0=dd.A[0][0]*X[0]+dd.A[0][1]*X[1]+dd.B[0][0]*u,x1=dd.A[1][0]*X[0]+dd.A[1][1]*X[1]+dd.B[1][0]*u;X=[x0,x1];return y;};}
        for(var i=0;i<(Wp+nper)*M;i++){var t=i*dt,tm=t+dt/2-o.L,u=tm>=0?o.amp*Math.sin(w*tm):0;
          var yv=step(u);
          if(i>=Wp*M){var ym=yv+sd*rg.normal();ss+=ym*Math.sin(w*t);sc+=ym*Math.cos(w*t);rec.push([t-Wp*Pd,ym]);}}
        var re=2*ss/(nper*M)/o.amp,im=2*sc/(nper*M)/o.amp;
        out.push({w:w,gain:Math.hypot(re,im),ph:Math.atan2(im,re)*180/Math.PI,rec:rec,P:Pd,re:re,im:im});
        ttot+=(Wp+nper)*Pd;}
      var prev=null;out.forEach(function(r){if(prev===null){while(r.ph>90)r.ph-=360;}else{while(r.ph-prev>180)r.ph-=360;while(r.ph-prev<-180)r.ph+=360;}prev=r.ph;});
      return {out:out,ttot:ttot};
    }
    function fitFO(out,tg){var best=null;for(var i=0;i<=800;i++){var Tf=Math.pow(10,tg[0]+(tg[1]-tg[0])*i/800),rr=out.map(function(q){return 20*Math.log10(q.gain)+10*Math.log10(1+Math.pow(q.w*Tf,2));}),kd=rr.reduce(function(s,v){return s+v;},0)/rr.length,e=rr.reduce(function(s,v){return s+(v-kd)*(v-kd);},0);if(best===null||e<best[0])best=[e,Tf,Math.pow(10,kd/20)];}
      var Tf2=best[1],nu=0,de=0;out.forEach(function(q){var res=-q.ph*Math.PI/180-Math.atan(q.w*Tf2);nu+=q.w*res;de+=q.w*q.w;});return {K:best[2],T:Tf2,L:nu/de};}
    function fitSO(out){var best=null;for(var i=0;i<=160;i++){var w0=Math.pow(10,Math.log10(1)+Math.log10(25)*i/160);for(var j=0;j<=120;j++){var zz=0.02+0.98*j/120,rr=out.map(function(q){var x=q.w/w0;return 20*Math.log10(q.gain)+10*Math.log10(Math.pow(1-x*x,2)+Math.pow(2*zz*x,2));}),kd=rr.reduce(function(s,v){return s+v;},0)/rr.length,e=rr.reduce(function(s,v){return s+(v-kd)*(v-kd);},0);if(best===null||e<best[0])best=[e,w0,zz,Math.pow(10,kd/20)];}}
      return {K:best[3],wn:best[1],z:best[2]};}
    function trueG(o,w){if(o.kind==="fo"){var re=1,im=w*o.T,g=o.K/Math.hypot(re,im);return {db:20*Math.log10(g),ph:-Math.atan(w*o.T)*180/Math.PI-w*o.L*180/Math.PI};}
      var x=w/o.wn,a=1-x*x,b=2*o.z*x;return {db:20*Math.log10(o.K/Math.hypot(a,b)),ph:-Math.atan2(b,a)*180/Math.PI};}
    function draw(){
      var o=_W08_SW[ob.get()],R=run(o),out=R.out,nar=_w08_nar(box),Wd=nar?400:700,O=[];
      var fit=o.kind==="fo"?fitFO(out,o.tg):fitSO(out);
      var fG=function(w){if(o.kind==="fo")return {db:20*Math.log10(fit.K/Math.hypot(1,w*fit.T)),ph:-Math.atan(w*fit.T)*180/Math.PI-w*fit.L*180/Math.PI};var x=w/fit.wn,a=1-x*x,b=2*fit.z*x;return {db:20*Math.log10(fit.K/Math.hypot(a,b)),ph:-Math.atan2(b,a)*180/Math.PI};};
      /* (a) 選んだ点の記録 */
      var idx=Math.max(0,Math.min(out.length-1,Math.round(sel.get()*(out.length-1)))),r=out[idx],P=r.P,nper=np.get();
      var gA=r.gain*o.amp,ymx=0;r.rec.forEach(function(p){ymx=Math.max(ymx,Math.abs(p[1]));});var lim=Math.max(ymx,gA)*1.15||1;
      var ax=nar?52:64,aw=nar?320:600;
      O.push(S.T(nar?14:20,14,"(a) "+(idx+1)+" 番目の点 ω = "+_w08_sig(r.w,3)+" rad/s（周期 "+_w08_sig(P,3)+" s）の記録: 振幅 "+_w08_sig(gA,3)+" "+o.yu,"start",10,"ink",true));
      O.push(S.RECT(ax,22,aw,16,2,"screen","line",0.8));
      var su=[];for(var k=0;k<=300;k++){var tt=nper*P*k/300;su.push([ax+aw*k/300,30-6*Math.sin(r.w*(tt-o.L+(wt.get()?Math.max(1,Math.ceil(5*o.slow/P))*P:0)))]);}
      O.push(S.PL(su,"gold",1.3));O.push(S.T(ax-4,34,"入力","end",9,"gold"));
      var A=U.plot(ax,44,aw,96,[0,nper*P],[-lim,lim]);
      O.push(A.axes({xl:"平均に使った記録の時間 [s]",yl:null,xt:U.nice(0,nper*P,6),yt:[-_w08_sig(lim*0.8,2)*1,0,+_w08_sig(lim*0.8,2)],xfmt:function(v){return _w08_sig(v,3);},yfmt:function(v){return _w08_sig(v,2);}}));
      var stp=Math.max(1,Math.floor(r.rec.length/400));for(var q=0;q<r.rec.length;q+=stp)O.push(S.D(A.X(r.rec[q][0]),A.Y(r.rec[q][1]),"teal",1.3));
      var fs=[];for(var k2=0;k2<=300;k2++){var t2=nper*P*k2/300,tabs=t2+(wt.get()?Math.max(1,Math.ceil(5*o.slow/P))*P:0);fs.push([t2,gA*Math.sin(r.w*tabs+r.ph*Math.PI/180)]);}
      O.push(A.line(fs,"signal",2));
      /* (b) ボード線図 */
      var ws=U.ctl.logspace(Math.log10(o.wr[0]),Math.log10(o.wr[1]),400),T0=ws.map(function(w){return trueG(o,w);}),F0=ws.map(function(w){return fG(w);});
      var by=200,bs=U.ctl.bodeSvg([{w:ws,db:T0.map(function(v){return v.db;}),ph:T0.map(function(v){return v.ph;}),c:"signal",lw:2.2}],{x:nar?56:64,y:by,w:nar?310:430,hm:120,hp:120,gap:30,wr:o.wr,dbr:o.dbr,phr:o.phr});
      O.push(S.T(nar?14:20,by-10,"(b) 測った点・合わせたモデル（金の破線）・本当の線（青）","start",10,"ink",true));
      O.push(bs.svg);
      if(o.L)O.push(bs.Pp.clip(ws.map(function(w){return [w,-Math.atan(w*o.T)*180/Math.PI];}),"muted",1.2,"4 3"));
      O.push(bs.Pm.clip(ws.map(function(w,i){return [w,F0[i].db];}),"gold",1.6,"5 3"));O.push(bs.Pp.clip(ws.map(function(w,i){return [w,F0[i].ph];}),"gold",1.6,"5 3"));
      out.forEach(function(q,i){var gd=20*Math.log10(q.gain);var c=i===idx?"alias":"teal";
        if(gd>=o.dbr[0]&&gd<=o.dbr[1])O.push(S.CIRC(bs.Pm.X(q.w),bs.Pm.Y(gd),3.8,c,2,"screen"));
        if(q.ph>=o.phr[0]&&q.ph<=o.phr[1])O.push(S.CIRC(bs.Pp.X(q.w),bs.Pp.Y(q.ph),3.8,c,2,"screen"));});
      var lx=nar?56:520,ly=nar?bs.h+10:by+10,L=[];
      L.push(["合わせた値（本当の値）","ink",true]);
      if(o.kind==="fo"){L.push(["K = "+_w08_f(fit.K,3)+" "+o.gu+"（"+o.K+"）","gold",true]);L.push(["T = "+_w08_sig(fit.T,3)+" s（"+o.T+"）","gold",true]);L.push(["L = "+_w08_f(fit.L,o.L?1:3)+" s（"+o.L+"）","gold",true]);}
      else{L.push(["K = "+_w08_f(fit.K,3)+" "+o.gu+"（"+o.K+"）","gold",true]);L.push(["ω_n = "+_w08_f(fit.wn,3)+" rad/s（"+o.wn+"）","gold",true]);L.push(["ζ = "+_w08_f(fit.z,3)+"（"+o.z+"）","gold",true]);}
      L.push(["","ink",false]);
      var tt2=R.ttot;L.push(["かかった時間 "+(tt2>=3600?_w08_f(tt2/3600,1)+" 時間":(tt2>=60?_w08_f(tt2/60,1)+" 分":_w08_sig(tt2,3)+" s")),"ink",true]);
      L.forEach(function(l,i){if(l[0])O.push(S.TX(lx,ly+i*17,l[0],"start",10,l[1],l[2]));});
      O.push(S.LEGL(lx,ly+L.length*17+14,[["signal",null,"本当の線"]],9.5));O.push(S.LEGL(lx,ly+L.length*17+31,[["gold","5 3","合わせたモデル"]],9.5));
      O.push(S.CIRC(lx+12,ly+L.length*17+45,3.6,"teal",2,"screen"));O.push(S.T(lx+30,ly+L.length*17+49,"測った点（赤は (a) の点）","start",9.5,"muted"));
      var H=nar?ly+L.length*17+60:Math.max(bs.h,ly+L.length*17+60);
      box.set(S.svg(Wd,H+4,O));
      /* 読み出し */
      var eg=0,ep=0;out.forEach(function(q){var tg=trueG(o,q.w);eg=Math.max(eg,Math.abs(20*Math.log10(q.gain)-tg.db));ep=Math.max(ep,Math.abs(q.ph-tg.ph));});
      var h="測った点 "+out.length+" 個（"+_w08_sig(o.wlo,3)+"〜"+_w08_sig(o.whi,3)+" rad/s）。本当の線との差の最大: ゲイン "+_w08_f(eg,2)+" dB、位相 "+_w08_f(ep,1)+"°<br>";
      h+="選んだ点: 測ったゲイン "+_w08_sig(r.gain,3)+" "+o.gu+"（本当 "+_w08_sig(Math.pow(10,trueG(o,r.w).db/20),3)+"）、位相 "+_w08_f(r.ph,1)+"°（本当 "+_w08_f(trueG(o,r.w).ph,1)+"°）";
      ro.innerHTML=h+'<div class="wnote">各点で、動作点のまわりに振幅 '+o.amp+' '+o.uu+' の正弦波を入れ、待ち時間の後の記録（1 周期に 100 回測る）に sin と cos を掛けて平均し、G(jω) の実部と虚部を求めた。位相は低い角周波数から順に 360° を足し引きしてつないだ。モデルは、ゲインの点に'+(o.kind==="fo"?' K・T を、位相の残りに L を':' K・ω<sub>n</sub>・ζ を')+'最小二乗法で合わせた。</div>';
    }
    draw();
  };

  /* ===== 09 章 安定性と安定余裕 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w09_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w09_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w09_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* 有効数字 d 桁（末尾の 0 も残す） */
  function _w09_p(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);if(a>=Math.pow(10,d))return String(Math.round(v)).replace("-","−");
    var s=v.toPrecision(d);if(s.indexOf("e")>=0)s=String(+s);return s.replace("-","−");}
  /* 一巡伝達関数の位相 [°]（低い角周波数から連続につないだ値） */
  function _w09_ph(U,pl,K,L,w){var ws=U.ctl.logspace(Math.log10(Math.min(pl.wr[0],w/2)),Math.log10(w),800);var B=U.ctl.bode(_w09_tf(U,pl,K,L),ws);return B.ph[B.ph.length-1];}
  /* 大きい数・小さい数は a×10^{n}（S.TX の書き方）で */
  function _w09_e(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    if(a>=1e5||a<1e-3){var ex=Math.floor(Math.log10(a)+1e-12),mt=+(v/Math.pow(10,ex)).toPrecision(d);if(Math.abs(mt)>=10){mt=+(mt/10).toPrecision(d);ex++;}
      var ms=mt.toString().replace("-","−");return (ms==="1"?"":(ms==="−1"?"−":ms+"×"))+"10^{"+ex+"}";}
    return _w09_g(v,d+1);}

  /* ---- 例の対象（P(s) = num/den、測った値の遅れ L） ---- */
  var _W09_PL={
    cart:{nm:"台車の速度（測った値が遅れて届く）",num:[1],den:[1,2],ff:2,Ku:"N/(m/s)",Kr:[0.5,60],K0:14,Lv:[0,0.02,0.05,0.1,0.15,0.2,0.3],L0:0.1,Lu:"s",tEnd:3,wr:[0.3,300],bw:[0.5,100],yu:"m/s"},
    motor:{nm:"モータの位置（巻線のインダクタンスを含む）",num:[2e6],den:[1,2000,40000,0],ff:0,Ku:"V/rad",Kr:[0.05,100],K0:10,Lv:[0,0.0002,0.0005,0.001,0.002,0.005],L0:0,Lu:"s",tEnd:null,wr:[0.5,1e5],bw:[1,3000],yu:"rad"},
    motor2:{nm:"モータの位置（インダクタンスを無視。二次遅れの形）",num:[1000],den:[1,20,0],ff:0,Ku:"V/rad",Kr:[0.05,100],K0:0.21,Lv:[0,0.0002,0.0005,0.001,0.002,0.005],L0:0,Lu:"s",tEnd:null,wr:[0.05,1e5],bw:[1,3000],yu:"rad"},
    plate:{nm:"温度の板（むだ時間 20 s）",num:[1.25],den:[500,1],ff:0,Ku:"W/K",Kr:[1,80],K0:12,Lv:[0,5,10,20,30,40,60],L0:20,Lu:"s",tEnd:1500,wr:[1e-6,20],bw:[0.001,1],yu:"K"},
    unst:{nm:"不安定な一次の対象 1/(s − 1)",num:[1],den:[1,-1],ff:0,Ku:"",Kr:[0.1,10],K0:2,Lv:[0],L0:0,Lu:"s",tEnd:8,wr:[1e-4,1e4],bw:[0.01,100],yu:""}
  };
  /* 一巡伝達関数 P(s)C(s)（C = K）の値。s は U.ctl.c の複素数 */
  function _w09_L(U,pl,K,L,s){var cx=U.ctl.cx,v=cx.div(U.ctl.poly.valc(pl.num,s),U.ctl.poly.valc(pl.den,s));v=cx.scale(v,K);if(L)v=cx.mul(v,cx.exp(U.ctl.c(-L*s.re,-L*s.im)));return v;}
  function _w09_jw(U,pl,K,L,w){return _w09_L(U,pl,K,L,U.ctl.c(0,w));}
  function _w09_tf(U,pl,K,L){return U.ctl.tf(pl.num.map(function(x){return x*K;}),pl.den,L||0);}
  /* 開ループの右半平面の極の数と、原点の極の数 */
  function _w09_olp(U,pl){var n0=0,d=pl.den.slice();while(d.length>1&&d[d.length-1]===0){d.pop();n0++;}
    var r=d.length>1?U.ctl.poly.roots(d):[],np=r.filter(function(z){return z.re>1e-9;}).length;return {rhp:np,origin:n0};}
  /* ナイキストの経路に沿って 1 + P(s)C(s) の偏角の変化を数える。返り値 {cw: 時計回りに −1 を回る回数, minD: −1 との最短距離} */
  function _w09_wind(U,pl,K,L){var o=_w09_olp(U,pl),wlo=pl.wr[0],whi=pl.wr[1],N=5000,pts=[],i;
    for(i=0;i<=N;i++)pts.push(U.ctl.c(0,-whi*Math.pow(wlo/whi,i/N)));
    if(o.origin>0){for(i=1;i<300;i++){var th=-Math.PI/2+Math.PI*i/300;pts.push(U.ctl.c(wlo*Math.cos(th),wlo*Math.sin(th)));}}
    else for(i=1;i<100;i++)pts.push(U.ctl.c(0,-wlo+2*wlo*i/100));
    for(i=0;i<=N;i++)pts.push(U.ctl.c(0,wlo*Math.pow(whi/wlo,i/N)));
    var tot=0,prev=null,minD=Infinity;
    pts.forEach(function(s){var v=_w09_L(U,pl,K,L,s),fr=1+v.re,fi=v.im,a=Math.atan2(fi,fr);if(s.re===0)minD=Math.min(minD,Math.hypot(fr,fi));
      if(prev!==null){var d=a-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;tot+=d;}prev=a;});
    return {cw:Math.round(-tot/(2*Math.PI)),raw:-tot/(2*Math.PI),minD:minD,olrhp:o.rhp};}
  /* 閉ループ（u = ff·r + K(r − 測った値)、測った値は L 遅れる）の目標値のステップ（r = 1）への応答。零次ホールドで厳密に離散化 */
  function _w09_sim(U,pl,K,L,tEnd,nstep){nstep=nstep||15000;var t=[],y=[],st=Math.max(1,Math.round(nstep/700)),blow=false,peak=-Infinity,k;
    if(!L){/* むだ時間が無ければ、閉ループの伝達関数 (ff + K)P/(1 + KP) のステップ応答を厳密に求める */
      var Gc=U.ctl.tf(U.ctl.poly.scale(pl.num,pl.ff+K),U.ctl.poly.add(pl.den,U.ctl.poly.scale(pl.num,K))),r=U.ctl.step(Gc,tEnd,nstep);
      for(k=0;k<r.y.length;k++){var v=r.y[k];if(!isFinite(v)||Math.abs(v)>1e6){blow=true;break;}if(v>peak)peak=v;if(k%st===0){t.push(r.t[k]);y.push(v);}}
      return {t:t,y:y,blow:blow,peak:peak};}
    var h=tEnd/nstep,G=U.ctl.tf(pl.num,pl.den),S=U.ctl.ss(G),n=S.A.length,
      dd=U.ctl.mat.c2d(S.A,S.B,h),Ad=dd.A,Bd=dd.B,C=S.C[0],nd=Math.max(1,Math.round(L/h)),x=new Float64Array(n),buf=new Float64Array(nstep+1);
    for(k=0;k<=nstep;k++){var yy=0;for(var i=0;i<n;i++)yy+=C[i]*x[i];buf[k]=yy;if(yy>peak)peak=yy;
      if(k%st===0){t.push(k*h);y.push(yy);}
      if(!isFinite(yy)||Math.abs(yy)>1e6){blow=true;break;}
      /* 操作量は刻みの間一定なので、平均で h/2 遅れる。L − h/2 前の値（隣り合う 2 つの平均）を使って打ち消す */
      var ym=k>=nd?0.5*(buf[k-nd]+buf[k-nd+1]):(k===nd-1?0.5*buf[0]:0),u=pl.ff+K*(1-ym),nx=new Float64Array(n);
      for(var i2=0;i2<n;i2++){var sm=Bd[i2][0]*u;for(var j=0;j<n;j++)sm+=Ad[i2][j]*x[j];nx[i2]=sm;}x=nx;}
    return {t:t,y:y,blow:blow,peak:peak};}
  /* 応答の最終値（安定なとき）: 型 0 なら ff 込みの比、型 1 以上なら 1 */
  function _w09_final(U,pl,K){var d0=pl.den[pl.den.length-1],n0=pl.num[pl.num.length-1];if(d0===0)return 1;var P0=n0/d0;return (pl.ff+K)*P0/(1+K*P0);}
  /* 揺れが収まるか: 後ろ 1/4 と、その前の 1/4 の |y − 最終値| の最大を比べる */
  function _w09_trend(sim,yf){var n=sim.y.length;if(sim.blow)return 2;if(n<8)return 0;
    function mx(a,b){var m=0;for(var i=a;i<b;i++)m=Math.max(m,Math.abs(sim.y[i]-yf));return m;}
    var m1=mx(Math.floor(n/2),Math.floor(3*n/4)),m2=mx(Math.floor(3*n/4),n);if(m1<1e-6*Math.max(1,Math.abs(yf)))return 0;
    var r=m2/m1;return r>1.08?2:(r>0.92?1:0);}
  /* 複素平面（ナイキスト線図の地）。返り値 {svg, P} */
  function _w09_cplane(U,x,y,w,h,xr,yr,o){o=o||{};var S=U.S,P=U.plot(x,y,w,h,xr,yr),s=[S.RECT(x,y,w,h,0,"var(--screen)","line",0.8)];
    var st=o.step||(xr[1]-xr[0]>12?5:(xr[1]-xr[0]>5?1:0.5));
    s.push(P.axes({xt:U.nice(xr[0],xr[1],5).filter(function(v){return v>=xr[0]&&v<=xr[1];}),yt:U.nice(yr[0],yr[1],5).filter(function(v){return v>=yr[0]&&v<=yr[1];}),sz:9}));
    if(yr[0]<0&&yr[1]>0)s.push(S.L(x,P.Y(0),x+w,P.Y(0),"muted",1));
    if(xr[0]<0&&xr[1]>0)s.push(S.L(P.X(0),y,P.X(0),y+h,"muted",1));
    if(o.unit!==false){var c=[];for(var i=0;i<=120;i++){var a=2*Math.PI*i/120;c.push([Math.cos(a),Math.sin(a)]);}s.push(P.clip(c,"faint",1.1,"4 3"));}
    if(o.m1!==false&&xr[0]<-1){s.push(S.X(P.X(-1),P.Y(0),5,"alias",2.2));s.push(S.T(P.X(-1),P.Y(0)-9,"−1","middle",10,"alias",true,false,null,true));}
    return {svg:s.join(""),P:P};}
  /* 曲線（[[re,im],…]）の k 番目に進む向きの矢じり */
  function _w09_head(U,P,pts,k,c){var a=pts[Math.max(0,k-2)],b=pts[Math.min(pts.length-1,k+2)];
    if(!(a[0]>=P.xr[0]&&a[0]<=P.xr[1]&&a[1]>=P.yr[0]&&a[1]<=P.yr[1]&&b[0]>=P.xr[0]&&b[0]<=P.xr[1]&&b[1]>=P.yr[0]&&b[1]<=P.yr[1]))return "";
    if(Math.hypot(P.X(b[0])-P.X(a[0]),P.Y(b[1])-P.Y(a[1]))<2)return "";
    return U.S.head(P.X(a[0]),P.Y(a[1]),P.X(b[0]),P.Y(b[1]),c,7);}
  /* 時間の応答の図 */
  function _w09_tplot(U,x,y,w,h,sim,tEnd,yf,o){o=o||{};var S=U.S,lo=0,hi=1;
    sim.y.forEach(function(v){if(isFinite(v)){lo=Math.min(lo,v);hi=Math.max(hi,v);}});
    var cap=o.cap||3;lo=Math.max(lo,-cap+1);hi=Math.min(hi,cap);var pad=(hi-lo)*0.08;lo-=pad;hi+=pad;
    var P=U.plot(x,y,w,h,[0,tEnd],[lo,hi]),s=[];
    s.push(P.axes({xl:"時間 t [s]",yl:o.yl||"制御量",yt:U.nice(lo,hi,4).filter(function(v){return v>=lo&&v<=hi;}),xt:U.nice(0,tEnd,5),sz:9,ylOff:34}));
    s.push(S.L(x,P.Y(1),x+w,P.Y(1),"muted",1,"5 3"));
    if(o.yf&&isFinite(yf)&&Math.abs(yf-1)>1e-3)s.push(S.L(x,P.Y(yf),x+w,P.Y(yf),"green",1,"2 3"));
    s.push(P.clip(sim.t.map(function(t,i){return [t,sim.y[i]];}),o.c||"signal",2));
    return {svg:s.join(""),P:P};}

  /* ---- 1 節: ループを一周する正弦波 ---- */
  REG.w09_loop=function(el,U){
    var S=U.S,cx=U.ctl.cx;
    U.head(el,"LOOP","ループを一周する正弦波 — 戻る波は入れた波と重なるか");
    var r1=U.ctrls(el);
    var pls=["cart","motor"];
    var obj=U.select(r1,"対象",["台車の速度（測った値が遅れて届く）","モータの位置（巻線のインダクタンスを含む）"],0,function(){var pl=_W09_PL[pls[obj.get()]];
      if(obj.get()===0){kp.set(17.0048);ld.set(0.1);om.set(16.887);}else{kp.set(40);om.set(200);}draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.5,max:100,log:true,value:17.0048,fmt:function(v){return _w09_p(v,3)+" "+_W09_PL[pls[obj.get()]].Ku;},onInput:draw});
    var r2=U.ctrls(el);
    var ld=U.slider(r2,"測った値の遅れ L",{values:[0,0.02,0.05,0.1,0.15,0.2,0.3],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var om=U.slider(r2,"入れる正弦波の角周波数 ω",{min:0.5,max:2000,log:true,value:16.887,fmt:function(v){return _w09_p(v,3)+" rad/s";},onInput:draw});
    var br=U.btnrow(el);
    function wpc(){var pl=_W09_PL[pls[obj.get()]],L=obj.get()===0?ld.get():0;var m=U.ctl.margins(_w09_tf(U,pl,1,L),0.05,1e4);return m.wpc;}
    U.button(br,"本文の例",function(){obj.set(0);kp.set(17.0048);ld.set(0.1);om.set(16.887);draw();});
    U.button(br,"位相が −180° になる ω に合わせる",function(){var w=wpc();if(w)om.set(w);draw();});
    U.button(br,"境目の比例ゲインにする",function(){var w=wpc();if(w){var pl=_W09_PL[pls[obj.get()]],L=obj.get()===0?ld.get():0;kp.set(1/cx.abs(_w09_jw(U,pl,1,L,w)));om.set(w);}draw();});
    U.button(br,"比例ゲインを 0.8 倍",function(){kp.set(kp.get()*0.8);draw();});
    U.button(br,"比例ゲインを 1.2 倍",function(){kp.set(kp.get()*1.2);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var mot=obj.get()===1,pl=_W09_PL[pls[obj.get()]],K=kp.get(),L=mot?0:ld.get(),w=om.get();
      ld.el.style.display=mot?"none":"";
      var g=_w09_jw(U,pl,K,L,w),gm=cx.abs(g),gph=_w09_ph(U,pl,K,L,w),B=cx.scale(g,-1),bph=cx.arg(B)*180/Math.PI;
      var nar=_w09_nar(box),Wd=nar?400:700,o=[];
      /* (a) 切ったループ */
      var yc=46,xs=nar?52:72,R=15,xcut=nar?120:178;
      o.push(S.ARR(nar?8:16,yc,xs-R,yc,"muted",1.6));o.push(S.TX(nar?8:16,yc-8,"r = 0","start",9.5,"muted",true));
      o.push(S.SUMJ(xs,yc,{l:"+",b:"−"}));
      o.push(S.ARR(xs+R,yc,xcut-8,yc,"signal",1.8));o.push(S.T((xs+R+xcut-8)/2,yc-8,"B","middle",10,"signal",true,false,null,true));
      o.push(S.L(xcut-5,yc-10,xcut-5,yc+10,"ink",2.2));o.push(S.L(xcut+5,yc-10,xcut+5,yc+10,"ink",2.2));
      var pbox=mot?["2×10^{6}","s(s^2 + 2000s + 40000)"]:["e^{−"+L+"s}","s + 2"];
      var ch=S.CHAIN(xcut+8,yc,[["a",nar?32:56,"A","gold"],["b","K_P","c",true],["a",nar?22:40,null,"gold"],["b",pbox,"p",true],["a",nar?16:36,null,"signal"],["t","bp","signal"],["a",nar?18:40,"y","signal"]]);
      o.push(ch.svg);o.push(S.FBPATH(ch.pos.bp,xs,yc,36,"signal"));
      if(!nar){o.push(S.TX(ch.x+10,yc-4,"B = −P(jω)C(jω) A","start",10,"ink",true));o.push(S.T(ch.x+10,yc+12,"（A を入れ続けた後）","start",9,"muted"));}
      /* (b) 波形 */
      var wx=nar?44:56,wy=nar?112:110,ww=nar?340:330,wh=nar?110:130,amp=Math.max(1,gm),yl=Math.min(4,Math.ceil(amp*1.15*2)/2);
      var P=U.plot(wx,wy,ww,wh,[0,720],[-yl,yl]);
      o.push(P.axes({xt:[0,180,360,540,720],yt:U.nice(-yl,yl,4).filter(function(v){return Math.abs(v)<=yl;}),xl:"ωt [°]",sz:9}));
      var pa=[],pb=[];for(var i=0;i<=240;i++){var a=720*i/240;pa.push([a,Math.sin(a*Math.PI/180)]);pb.push([a,gm*Math.sin((a+bph)*Math.PI/180)]);}
      o.push(P.clip(pb,"signal",2.6));o.push(P.line(pa,"gold",1.6,"6 4"));
      o.push(S.LEGL(wx,wy-6,[["gold",null,"入れた A = sin ωt"],["signal",null,"戻る B"]],9.5,14));
      /* (c) 矢印 */
      var cxp=nar?200:530,cyp=nar?wy+wh+120:wy+70,rad=nar?62:66,sc=rad/Math.max(1.25,Math.min(3.5,gm*1.1));
      o.push(S.CIRC(cxp,cyp,sc,"faint",1.1,null,"4 3"));
      o.push(S.L(cxp-rad-8,cyp,cxp+rad+8,cyp,"muted",1));o.push(S.L(cxp,cyp-rad-8,cxp,cyp+rad+8,"muted",1));
      var bx=cxp+sc*B.re,by=cyp-sc*B.im;
      if(Math.hypot(bx-cxp,by-cyp)>3)o.push(S.ARR(cxp,cyp,bx,by,"signal",3.4,9));
      o.push(S.ARR(cxp,cyp,cxp+sc,cyp,"gold",1.6,7));
      o.push(S.T(cxp+sc-4,cyp+15,"A","middle",10,"gold",true,false,null,true));
      o.push(S.T(bx+(B.re>=0?8:-8),by+(B.im>=0?-7:16)-(Math.abs(B.im)<0.05?14:0),"B","middle",10,"signal",true,false,null,true));
      o.push(S.T(cxp,cyp+rad+22,"A と B を回る矢印で表した図（点線は半径 1）","middle",9,"muted"));
      /* (d) 閉ループの応答 */
      var tEnd=mot?Math.max(0.05,Math.min(2,12*2*Math.PI/Math.max(w,1)/2)):3,tw0=nar?44:56,ty=nar?wy+wh+240:wy+wh+70,tww=nar?340:620;
      if(mot){var mm=U.ctl.margins(_w09_tf(U,pl,K,0),0.05,1e4);tEnd=mm.wgc?Math.max(0.08,Math.min(3,25/mm.wgc)):0.5;}
      var sim=_w09_sim(U,pl,K,L,tEnd,mot?30000:60000),yf=_w09_final(U,pl,K),tr=_w09_trend(sim,yf);
      var tp=_w09_tplot(U,tw0,ty,tww,100,sim,tEnd,yf,{yl:mot?"角度 [rad]":"速度 [m/s]",cap:3,c:tr===2?"alias":(tr===1?"signal":"green")});
      o.push(S.T(tw0,ty-8,"ループを閉じたときの制御量（目標値 1 へのステップ）","start",10,"ink",true));
      o.push(tp.svg);
      box.set(S.svg(Wd,ty+100+44,o));
      /* 読み出し */
      var h="",dph=bph;while(dph>180)dph-=360;while(dph<=-180)dph+=360;
      h+="ω = "+_w09_p(w,3)+" rad/s（周期 "+_w09_p(2*Math.PI/w,3)+" s）で: |P(jω)C(jω)| = <b>"+_w09_p(gm,3)+"</b>、∠P(jω)C(jω) = <b>"+_w09_f(gph,1)+"°</b><br>";
      h+="→ B は A の "+_w09_p(gm,3)+" 倍で、位相の差は "+_w09_f(dph,1)+"°"+(Math.abs(dph)<1?'（<span class="ok">同じ向き</span>）':"（向きがずれている）")+"<br>";
      var wp=wpc();
      if(wp){var gp=cx.abs(_w09_jw(U,pl,1,L,wp));h+="位相が −180° になる角周波数: "+_w09_p(wp,3)+" rad/s（周期 "+_w09_p(2*Math.PI/wp,3)+" s）。そこでのゲインは "+_w09_p(gp*K,3)+" 倍 → 境目の比例ゲイン <b>"+_w09_p(1/gp,3)+" "+pl.Ku+"</b><br>";}
      else h+='位相は −180° まで遅れない（むだ時間が無い台車は −90° まで）: B が A と同じ向きに戻る角周波数は無い<br>';
      h+="ループを閉じると: "+(tr===2?'<span class="warn">揺れが大きくなり続ける（不安定）</span>':(tr===1?"同じ振れ幅の揺れが続く（安定限界の近く）":'<span class="ok">揺れは収まる</span>'));
      ro.innerHTML=h+'<div class="wnote">B は、A を十分に長く入れ続けた後の定常状態の波（8 章 1 節）。台車は 1 章と同じく、目標値 1 m/s から決めた力 2 N を足し、測った速度が L 遅れて制御器に届く。応答は零次ホールドで細かい刻みに離散化して計算した。</div>';
    }
    draw();
  };

  /* ---- 2 節: ラウス表 ---- */
  /* ラウス表を作る。1 列目に 0 が出たら小さな正の数 ε に、行がすべて 0 なら 1 つ上の行の式を微分した係数に置き換える */
  function _w09_routh(c){var n=c.length-1,m=Math.floor(n/2)+1,rows=[],scale=0;c.forEach(function(x){scale=Math.max(scale,Math.abs(x));});
    var tol=1e-10*scale,eps=1e-6*scale;
    function row(off){var r=[];for(var i=0;i<m;i++){var k=off+2*i;r.push(k<=n?c[k]:0);}return r;}
    function fix(v,p,prev){var R={v:v,p:p,aux:false,eps:false,auxOf:null};
      if(v.every(function(x){return Math.abs(x)<=tol;})&&prev){R.aux=true;R.auxOf=prev.v.slice();R.v=prev.v.map(function(x,i){var pw=prev.p-2*i;return pw>0?x*pw:0;});}
      if(Math.abs(R.v[0])<=tol&&p>0){R.eps=true;R.v[0]=eps;}
      return R;}
    rows.push(fix(row(0),n,null));if(n>=1)rows.push(fix(row(1),n-1,rows[0]));
    for(var k=2;k<=n;k++){var a=rows[k-2].v,b=rows[k-1].v,nv=[];
      for(var i=0;i<m-1;i++)nv.push((b[0]*a[i+1]-a[0]*b[i+1])/b[0]);nv.push(0);
      rows.push(fix(nv,n-k,rows[k-1]));}
    var ch=0;for(var j=1;j<rows.length;j++)if((rows[j].v[0]>0)!==(rows[j-1].v[0]>0))ch++;
    return {rows:rows,changes:ch,m:m};}
  REG.w09_routh=function(el,U){
    var S=U.S;
    U.head(el,"ROUTH","ラウス表 — 1 列目の符号の変化と、右半平面の根");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",["モータの位置の比例制御（インダクタンスを含む）","モータの位置の PI 制御（インダクタンスを含む）","2 節の例 s³ + 2s² + 4s + 12","係数を入れる"],0,function(){draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.1,max:100,log:true,value:10,fmt:function(v){return _w09_p(v,3)+" V/rad";},onInput:draw});
    var ki=U.slider(r1,"積分のゲイン",{min:0,max:400,step:5,value:100,fmt:function(v){return v+" V/(rad·s)";},onInput:draw});
    var r2=U.ctrls(el);
    var tx=U.textin(r2,"係数（高い次から、カンマで区切る）","1, 2, 4, 12",function(){draw();},{width:"300px"});
    var br=U.btnrow(el);
    function setP(e,k,i){ex.set(e);kp.set(k);if(i!=null)ki.set(i);draw();}
    U.button(br,U.htx("K_P = 10"),function(){setP(0,10);});
    U.button(br,U.htx("K_P = 40（安定限界）"),function(){setP(0,40);});
    U.button(br,U.htx("K_P = 50"),function(){setP(0,50);});
    U.button(br,U.htx("PI: K_P = 10・K_I = 100"),function(){setP(1,10,100);});
    U.button(br,U.htx("PI: K_P = 10・K_I = 200"),function(){setP(1,10,200);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function coeffs(){var e=ex.get(),K=kp.get(),I=ki.get();
      if(e===0)return [1,2000,40000,2e6*K];
      if(e===1)return [1,2000,40000,2e6*K,2e6*I];
      if(e===2)return [1,2,4,12];
      var v=tx.get().split(/[,\s]+/).filter(function(x){return x!=="";}).map(Number);
      while(v.length&&v[0]===0)v.shift();
      if(v.length<2||v.some(function(x){return !isFinite(x);}))return null;
      if(v.length>9)v=v.slice(0,9);
      if(v[0]<0)v=v.map(function(x){return -x;});
      return v;}
    function draw(){
      var e=ex.get();kp.el.style.display=e<=1?"":"none";ki.el.style.display=e===1?"":"none";tx.el.style.display=e===3?"":"none";
      var c=coeffs();
      if(!c){box.set(S.svg(400,40,[S.T(10,24,"係数を 2 つ以上、数で入れる（例 1, 2, 4, 12）","start",11,"alias",true)]));ro.innerHTML="";return;}
      var R=_w09_routh(c),n=c.length-1,nar=_w09_nar(box),Wd=nar?400:700,o=[];
      /* 表 */
      var x0=nar?14:14,y0=26,rh=24,colw=nar?Math.min(96,(330)/R.m):Math.min(108,330/R.m),c1=x0+44;
      o.push(S.T(x0,14,"ラウス表（1 列目が青の帯）","start",10.5,"ink",true));
      o.push(S.RECT(c1-4,y0-4,colw,R.rows.length*rh+4,4,U.soft("signal"),"none",0));
      o.push(S.L(c1-10,y0-4,c1-10,y0+R.rows.length*rh,"muted",1.2));
      R.rows.forEach(function(r,i){var yy=y0+i*rh+16;
        o.push(S.TX(x0+4,yy,r.p===0?"s^0":(r.p===1?"s^1":"s^"+r.p),"start",10,"muted"));
        r.v.forEach(function(v,j){if(j>0&&Math.abs(v)<1e-300&&j>=1)return;var txt=(j===0&&r.eps)?"ε":_w09_e(v,3);
          o.push(S.TX(c1+j*colw,yy,txt,"start",10.5,j===0?(v<0?"alias":"ink"):"ink",j===0));});
        var sg=r.v[0]>0?"+":"−";o.push(S.CHIPL(c1+colw*R.m+4,yy,sg,r.v[0]>0?"green":"alias",9.5));
        if(r.aux)o.push(S.T(c1+colw*R.m+26,yy,"（微分で置き換えた行）","start",9,"gold"));
        if(r.eps&&!r.aux)o.push(S.T(c1+colw*R.m+26,yy,"（0 を ε に）","start",9,"gold"));});
      for(var i=1;i<R.rows.length;i++)if((R.rows[i].v[0]>0)!==(R.rows[i-1].v[0]>0)){var ya=y0+(i-1)*rh+12,yb=y0+i*rh+12,xa=c1-16;
        o.push(S.PATH("M"+xa+","+ya+" Q"+(xa-14)+","+((ya+yb)/2)+" "+(xa-2)+","+(yb-2),"alias",1.4));o.push(S.head(xa-6,yb-6,xa-1,yb-1,"alias",5));}
      var tH=y0+R.rows.length*rh;
      o.push(S.T(x0,tH+16,"1 列目の符号の変化: "+R.changes+" 回","start",10.5,R.changes?"alias":"green",true));
      /* s 平面 */
      var rts=U.ctl.poly.roots(c),mags=rts.map(function(z){return Math.hypot(z.re,z.im);}).sort(function(a,b){return a-b;});
      var keep=mags.slice();while(keep.length>1&&keep[keep.length-1]>6*keep[keep.length-2])keep.pop();
      var Rw=Math.max(1,keep.length?keep[keep.length-1]*1.3:1),px=nar?60:450,py=nar?tH+48:30,ps=nar?260:220;
      var P=U.plot(px,py,ps,ps,[-Rw,Rw],[-Rw,Rw]);
      o.push(S.RECT(px,py,ps,ps,0,"var(--screen)","line",0.8));o.push(U.ctl.splane(P));
      o.push(P.axes({xl:"実部",yl:"虚部",xt:U.nice(-Rw,Rw,4).filter(function(v){return Math.abs(v)<=Rw;}),yt:U.nice(-Rw,Rw,4).filter(function(v){return Math.abs(v)<=Rw;}),sz:9,ylOff:34}));
      o.push(U.ctl.splane(P,{rhp:false}));
      var tl=1e-7,nr=0,ni=0;rts.forEach(function(z){var t=tl*Math.max(1,Math.hypot(z.re,z.im));if(z.re>t)nr++;else if(Math.abs(z.re)<=t*10)ni++;});
      o.push(U.ctl.pz(P,rts,[],"signal",6));
      var far=rts.filter(function(z){return Math.hypot(z.re,z.im)>Rw*1.05;});
      if(far.length)o.push(S.T(px+4,py+ps-6,"枠の外: "+far.map(function(z){return _w09_p(z.re,4);}).join(", "),"start",9,"muted",false,false,null,true));
      o.push(S.T(px,py-8,"根を数値で求めて描いた s 平面","start",10,"ink",true));
      var Hh=nar?py+ps+44:Math.max(tH+30,py+ps+44);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var h="1 列目: "+R.rows.map(function(r){return r.eps&&!r.aux?"ε":U.htx(_w09_e(r.v[0],3));}).join(", ")+" → 符号の変化 <b>"+R.changes+" 回</b><br>";
      var parts=[];rts.forEach(function(z){var mg2=Math.hypot(z.re,z.im),re=Math.abs(z.re)<1e-7*Math.max(1,mg2)?0:z.re;if(z.im>1e-9*Math.max(1,Math.abs(z.re)))parts.push((re===0?"":_w09_p(re,3)+" ")+"± j"+_w09_p(z.im,4));else if(Math.abs(z.im)<=1e-9*Math.max(1,Math.abs(z.re)))parts.push(_w09_p(re,4));});
      h+="根（数値で求めた値）: "+parts.join("、")+" → 右半平面 <b>"+nr+" 個</b>"+(ni?"・虚軸の上 "+ni+" 個":"")+"<br>";
      var aux=R.rows.filter(function(r){return r.aux;});
      if(aux.length)h+='<span class="warn">行がすべて 0 になった</span>: 1 つ上の行の式 = 0 の根（虚軸の上か、原点に対称な組）が Δ(s) の根に含まれる。その式を微分した係数で置き換えて表を続けた<br>';
      else if(R.rows.some(function(r){return r.eps;}))h+='1 列目に 0 が出たので、小さな正の数 ε に置き換えて続けた<br>';
      h+=(nr===0&&ni===0)?'<span class="ok">根はすべて左半平面にある（安定）</span>':(nr>0?'<span class="warn">右半平面に根がある（不安定）</span>':'虚軸の上に根がある（安定限界）');
      if(e===0)h+="<br>安定な範囲: 0 < "+U.htx("K_P")+" < 40 V/rad（s"+"<sup>1</sup> の行 40000 − 1000"+U.htx("K_P")+" > 0）";
      if(e===1){var K=kp.get();h+="<br>"+(K<40?U.htx("K_I")+" の上限 "+U.htx("K_P")+"(40 − "+U.htx("K_P")+")/2 = "+_w09_p(K*(40-K)/2,3)+" V/(rad·s)":U.htx("K_P")+" ≥ 40 では、どの "+U.htx("K_I")+" でも不安定");}
      ro.innerHTML=h+'<div class="wnote">'+(e<=1?'モータの式は 6 章 4 節と同じ Δ(s) = s³ + 2000s² + 40000s + 2×10⁶K<sub>P</sub>（PI 制御では 4 次）。':'')+'根は数値的に求めた（共通部品 U.ctl.poly.roots）。1 列目に 0 が出たときは小さな正の数 ε に、行がすべて 0 になったときは 1 つ上の行の式を微分した係数に置き換えて表を続ける。</div>';
    }
    draw();
  };

  /* ---- 4 節: ナイキスト線図と閉ループの応答 ---- */
  /* ナイキスト線図の点の並び（ω > 0）。型 0 なら ω = 0 の点を先頭に足す */
  function _w09_npts(U,pl,K,L,n){var o=_w09_olp(U,pl),ws=U.ctl.logspace(Math.log10(pl.wr[0]),Math.log10(pl.wr[1]),n||1600),pts=[];
    if(o.origin===0){var v0=_w09_L(U,pl,K,L,U.ctl.c(0,0));pts.push([v0.re,v0.im,0]);}
    ws.forEach(function(w){var v=_w09_jw(U,pl,K,L,w);pts.push([v.re,v.im,w]);});return pts;}
  /* 曲線の上の矢じりを置く位置: |P(jω)C(jω)| が a を下回る最初の点 */
  function _w09_pick(pts,a){for(var i=2;i<pts.length-2;i++)if(Math.hypot(pts[i][0],pts[i][1])<a)return i;return -1;}
  /* 境目の比例ゲイン（位相が −180° になる最初の角周波数で |P C| = 1 になる K） */
  function _w09_kb(U,pl,L){if(pl===_W09_PL.unst)return {K:1,w:0};var m=U.ctl.margins(_w09_tf(U,pl,1,L),pl.wr[0],pl.wr[1]);return m.wpc?{K:m.gm,w:m.wpc}:null;}
  function _w09_tend(U,pl,K,L){if(pl.tEnd)return pl.tEnd;var m=U.ctl.margins(_w09_tf(U,pl,K,L),pl.wr[0],pl.wr[1]);return m.wgc?Math.max(0.06,Math.min(4,25/m.wgc)):0.5;}
  REG.w09_nyquist=function(el,U){
    var S=U.S,cx=U.ctl.cx,keys=["cart","motor","plate","unst"];
    U.head(el,"NYQUIST","ナイキスト線図と −1 の点 — 回る回数と閉ループの応答");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["台車の速度（測った値が遅れて届く）","モータの位置（巻線のインダクタンスを含む）","温度の板（むだ時間 20 s）","不安定な一次の対象 1/(s − 1)"],0,function(){var pl=_W09_PL[keys[obj.get()]];kp.set(obj.get()===0?14:pl.K0);draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.05,max:100,log:true,value:14,fmt:function(v){return _w09_p(v,3)+" "+_W09_PL[keys[obj.get()]].Ku;},onInput:draw});
    var r2=U.ctrls(el);
    var ld=U.slider(r2,"測った値の遅れ L",{values:[0,0.02,0.05,0.1,0.15,0.2,0.3],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var zm=U.select(r2,"表示の範囲",["−1 のまわり","広く"],0,draw);
    var mir=U.checkbox(r2,"ω < 0 の鏡像も描く",true,draw);
    var br=U.btnrow(el);
    function kbound(){var pl=_W09_PL[keys[obj.get()]],L=obj.get()===0?ld.get():(pl===_W09_PL.plate?20:0);return _w09_kb(U,pl,L);}
    U.button(br,"本文の例",function(){var i=obj.get(),pl=_W09_PL[keys[i]];kp.set(i===0?14:pl.K0);if(i===0)ld.set(0.1);draw();});
    U.button(br,"境目の比例ゲイン",function(){var b=kbound();if(b)kp.set(b.K);draw();});
    U.button(br,"境目の 0.8 倍",function(){var b=kbound();if(b)kp.set(b.K*0.8);draw();});
    U.button(br,"境目の 1.2 倍",function(){var b=kbound();if(b)kp.set(b.K*1.2);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var i=obj.get(),pl=_W09_PL[keys[i]],K=kp.get(),L=i===0?ld.get():(i===2?20:0);
      ld.el.style.display=i===0?"":"none";
      var nar=_w09_nar(box),Wd=nar?400:700,o=[];
      var pts=_w09_npts(U,pl,K,L,1600);
      /* 表示の範囲 */
      var xr,yr;
      if(zm.get()===0){xr=[-2.6,1.4];yr=[-2,2];}
      else{var R=1.5;pts.forEach(function(p){var r=Math.hypot(p[0],p[1]);if(r<40)R=Math.max(R,r);});R=Math.min(R*1.1,40);xr=[-R,R];yr=[-R,R];}
      var ns=nar?300:320,nx=nar?60:50,ny=24;
      var cp=_w09_cplane(U,nx,ny,ns,ns*(yr[1]-yr[0])/(xr[1]-xr[0]),xr,yr);o.push(cp.svg);var P=cp.P;
      var main=pts.map(function(p){return [p[0],p[1]];}),mirr=pts.map(function(p){return [p[0],-p[1]];});
      if(mir.get())o.push(P.clip(mirr,"signal",1.4,"5 3"));
      o.push(P.clip(main,"signal",2.4));
      [1.6,0.9,0.45].forEach(function(a){var k=_w09_pick(pts,a);if(k>0)o.push(_w09_head(U,P,main,k,"signal"));});
      if(mir.get()){[0.45,0.9,1.6].forEach(function(a){var k=_w09_pick(pts,a);if(k>0){var rv=mirr.slice().reverse(),kk=rv.length-1-k;o.push(_w09_head(U,P,rv,kk,"signal"));}});}
      o.push(S.T(nx,ny-8,"ナイキスト線図（実線 ω > 0、破線は鏡像）","start",10,"ink",true));
      /* 回る回数 */
      var wd=_w09_wind(U,pl,K,L),zcl=wd.cw+wd.olrhp,b=kbound(),mg=U.ctl.margins(_w09_tf(U,pl,K,L),pl.wr[0],pl.wr[1]);
      var cross=null;if(mg.wpc){cross=-1/mg.gm;o.push(S.D(P.X(cross),P.Y(0),zcl>0?"alias":"green",4.2));}
      if(i===3){cross=-K;}
      /* 閉ループの応答 */
      var tEnd=_w09_tend(U,pl,K,L),sim=_w09_sim(U,pl,K,L,tEnd,[60000,30000,15000,20000][i]),yf=_w09_final(U,pl,K),tr=_w09_trend(sim,yf);
      var tx0=nar?60:430,ty0=nar?ny+ns+56:44,tw=nar?320:250,th=nar?130:170;
      var tp=_w09_tplot(U,tx0,ty0,tw,th,sim,tEnd,yf,{yl:"制御量",cap:3,c:zcl>0?"alias":"green",yf:true});
      o.push(tp.svg);o.push(S.T(tx0,ty0-10,"閉ループのステップ応答（目標値 1）","start",10,"ink",true));
      var H=nar?ty0+th+50:Math.max(ny+ns+20,ty0+th+50);
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var h="";
      if(cross!==null)h+="負の実軸を横切る点: <b>"+_w09_p(cross,3)+"</b>"+(mg.wpc?"（ω = "+_w09_p(mg.wpc,3)+" rad/s）":"（ω = 0）")+"<br>";
      else h+="線図は負の実軸を横切らない<br>";
      if(wd.minD<0.01)h+='<span class="warn">線図が −1 の点のすぐ近くを通る（安定限界）</span><br>';
      h+="−1 を時計回りに回る回数（鏡像を含む）: <b>"+String(wd.cw).replace("-","−")+"</b>　＋　開ループの右半平面の極: <b>"+wd.olrhp+"</b>　＝　閉ループの右半平面の極: <b>"+zcl+"</b> → "+(zcl===0?'<span class="ok">安定</span>':'<span class="warn">不安定</span>')+"<br>";
      if(!L){var den=pl.den.slice(),num=pl.num.map(function(x){return x*K;});var cl=U.ctl.poly.add(den,num),rr=U.ctl.poly.roots(cl),nr=rr.filter(function(z){return z.re>1e-9*Math.max(1,Math.hypot(z.re,z.im));}).length;
        h+="確かめ: 特性方程式の根を数値で求めると、右半平面に "+nr+" 個（";
        var ps=[];rr.forEach(function(z){var re=Math.abs(z.re)<1e-7*Math.max(1,Math.hypot(z.re,z.im))?0:z.re;if(z.im>1e-9)ps.push((re===0?"":_w09_p(re,3)+" ")+"± j"+_w09_p(z.im,3));else if(Math.abs(z.im)<=1e-9)ps.push(_w09_p(re,4));});h+=ps.join("、")+"）<br>";}
      else h+="確かめ: 数値計算の応答は"+(tr===2?'<span class="warn">大きくなり続ける</span>':(tr===1?"同じ振れ幅で続く":'<span class="ok">収まる</span>'))+"<br>";
      if(b)h+="この対象の境目の比例ゲイン: "+_w09_p(b.K,3)+" "+pl.Ku+(i===3?"（これより大きいと安定）":"（これより大きいと不安定）");
      ro.innerHTML=h+'<div class="wnote">回る回数は、虚軸に沿って 1 + P(jω)C(jω) の偏角の変化を足し合わせて数えた（原点の極は右側の小さな半円で迂回）。台車は 1 章と同じく決めた力 2 N を足す。応答は零次ホールドで細かい刻みに離散化して計算した。</div>';
    }
    draw();
  };

  /* ---- 6 節: ゲイン余裕と位相余裕・むだ時間 ---- */
  function _w09_pmz(z){var x=Math.sqrt(Math.sqrt(1+4*Math.pow(z,4))-2*z*z);return Math.atan(2*z/x)*180/Math.PI;}
  /* 位相余裕から、二次遅れの形のときの行き過ぎ量 [%]（目安） */
  function _w09_mp_from_pm(pm){if(pm<=0)return null;if(pm>=_w09_pmz(0.999))return 0;var a=1e-4,b=0.999;for(var i=0;i<60;i++){var m=(a+b)/2;if(_w09_pmz(m)<pm)a=m;else b=m;}var z=(a+b)/2;return 100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z));}
  REG.w09_margin=function(el,U){
    var S=U.S,cx=U.ctl.cx,keys=["cart","motor","motor2","plate"];
    var BR={cart:{wr:[0.5,100],dbr:[-30,30],phr:[-360,0]},motor:{wr:[1,3000],dbr:[-60,60],phr:[-360,-90]},motor2:{wr:[1,3000],dbr:[-60,60],phr:[-360,-90]},plate:{wr:[0.001,1],dbr:[-40,30],phr:[-360,0]}};
    U.head(el,"MARGINS","ゲイン余裕と位相余裕 — ボード線図とナイキスト線図で同じ余裕を読む");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["台車の速度（測った値が遅れて届く）","モータの位置（巻線のインダクタンスを含む）","モータの位置（インダクタンスを無視。二次遅れの形）","温度の板"],0,function(){var pl=_W09_PL[keys[obj.get()]];kp.set(obj.get()===0?8:pl.K0);draw();});
    var kp=U.slider(r1,"比例ゲイン",{min:0.05,max:100,log:true,value:8,fmt:function(v){return _w09_p(v,3)+" "+_W09_PL[keys[obj.get()]].Ku;},onInput:draw});
    var r2=U.ctrls(el);
    var lc=U.slider(r2,"むだ時間 L",{values:[0,0.02,0.05,0.1,0.15,0.2,0.25,0.3],value:0.1,fmt:function(v){return v+" s";},onInput:draw});
    var lm=U.slider(r2,"むだ時間 L（計算の遅れなど）",{values:[0,0.0002,0.0005,0.001,0.002,0.005],value:0,fmt:function(v){return (v*1000)+" ms";},onInput:draw});
    var lp=U.slider(r2,"むだ時間 L",{values:[0,5,10,20,30,40,60],value:20,fmt:function(v){return v+" s";},onInput:draw});
    var br=U.btnrow(el);
    function setc(i,K,L){obj.set(i);kp.set(K);if(i===0)lc.set(L);else if(i===3)lp.set(L);else lm.set(L);draw();}
    U.button(br,"本文の例（台車）",function(){setc(0,8,0.1);});
    U.button(br,"台車、遅れ 0.2 s",function(){setc(0,8,0.2);});
    U.button(br,"モータ 10 V/rad",function(){setc(1,10,0);});
    U.button(br,"モータ 0.21 V/rad",function(){setc(1,0.21,0);});
    U.button(br,"温度の板 12 W/K",function(){setc(3,12,20);});
    U.button(br,"温度の板 24 W/K",function(){setc(3,24,20);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var i=obj.get(),key=keys[i],pl=_W09_PL[key],K=kp.get(),L=i===0?lc.get():(i===3?lp.get():lm.get());
      lc.el.style.display=i===0?"":"none";lp.el.style.display=i===3?"":"none";lm.el.style.display=(i===1||i===2)?"":"none";
      var G=_w09_tf(U,pl,K,L),mg=U.ctl.margins(G,pl.wr[0],pl.wr[1]),b=BR[key];
      var nar=_w09_nar(box),Wd=nar?400:700,o=[];
      /* ボード線図 */
      var ws=U.ctl.logspace(Math.log10(b.wr[0]),Math.log10(b.wr[1]),900),B=U.ctl.bode(G,ws);
      var bx=nar?56:58,bw=nar?320:330;
      var bd=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal"}],{x:bx,y:22,w:bw,hm:nar?100:110,hp:nar?100:110,gap:26,wr:b.wr,dbr:b.dbr,phr:b.phr});
      o.push(bd.svg);o.push(S.T(bx,12,"ボード線図","start",10,"ink",true));
      var Pm=bd.Pm,Pp=bd.Pp,inR=function(w){return w&&w>=b.wr[0]&&w<=b.wr[1];};
      if(inR(mg.wgc)){o.push(S.L(Pm.X(mg.wgc),Pm.y,Pm.X(mg.wgc),Pp.y+Pp.h,"green",1.1,"3 3"));
        if(mg.pm>0)o.push(S.ARR(Pp.X(mg.wgc),Pp.Y(-180),Pp.X(mg.wgc),Pp.Y(-180+mg.pm),"green",2,6));
        o.push(S.TX(Pp.X(mg.wgc)-4,Pp.Y(-180+mg.pm/2)+4,"φ_m","end",10,"green",true,true));}
      if(inR(mg.wpc)){o.push(S.L(Pm.X(mg.wpc),Pm.y,Pm.X(mg.wpc),Pp.y+Pp.h,"alias",1.1,"3 3"));
        if(mg.gmDb>0)o.push(S.ARR(Pm.X(mg.wpc),Pm.Y(-mg.gmDb),Pm.X(mg.wpc),Pm.Y(0),"alias",2,6));
        o.push(S.TX(Pm.X(mg.wpc)+4,Pm.Y(-mg.gmDb/2)+4,"g_m","start",10,"alias",true,true));}
      /* ナイキスト線図 */
      var ns=nar?260:250,nx=nar?80:430,ny=nar?bd.h+30:30;
      var cp=_w09_cplane(U,nx,ny,ns,ns,[-2.2,1.2],[-2.2,1.2]);o.push(cp.svg);var P=cp.P;
      o.push(S.T(nx,ny-8,"ナイキスト線図（ω > 0）","start",10,"ink",true));
      var pts=_w09_npts(U,pl,K,L,1600),main=pts.map(function(p){return [p[0],p[1]];});
      o.push(P.clip(main,"signal",2.4));
      [1.6,0.9,0.45].forEach(function(a){var k=_w09_pick(pts,a);if(k>0)o.push(_w09_head(U,P,main,k,"signal"));});
      if(mg.wgc){var g1=_w09_jw(U,pl,K,L,mg.wgc),a1=Math.atan2(g1.im,g1.re),arc=[],a0=-Math.PI;var a2=a1;while(a2>0)a2-=2*Math.PI;
        if(mg.pm>0){for(var q=0;q<=30;q++){var aa=a0+(a2-a0)*q/30;arc.push([0.55*Math.cos(aa),0.55*Math.sin(aa)]);}o.push(P.line(arc,"green",2));}
        o.push(S.L(P.X(0),P.Y(0),P.X(g1.re),P.Y(g1.im),"green",1.2));o.push(S.D(P.X(g1.re),P.Y(g1.im),"green",4));}
      if(mg.wpc){var xc=-1/mg.gm;if(xc>-2.2)o.push(S.D(P.X(xc),P.Y(0),"alias",4.2));}
      /* 閉ループの応答 */
      var tEnd=pl.tEnd||(mg.wgc?Math.max(0.06,Math.min(4,25/mg.wgc)):0.5),sim=_w09_sim(U,pl,K,L,tEnd,[60000,30000,30000,30000][i]),yf=_w09_final(U,pl,K),tr=_w09_trend(sim,yf);
      var ty=nar?ny+ns+56:Math.max(bd.h,ny+ns+30)+24,tp=_w09_tplot(U,bx,ty,nar?320:620,110,sim,tEnd,yf,{yl:"制御量",cap:3,c:(mg.pm!=null&&mg.pm<=0)?"alias":"green",yf:true});
      o.push(tp.svg);o.push(S.T(bx,ty-10,"閉ループのステップ応答（目標値 1）","start",10,"ink",true));
      box.set(S.svg(Wd,ty+110+44,o));
      /* 読み出し */
      var h="",unst=(mg.pm!=null&&mg.pm<=0)||(mg.gmDb!=null&&mg.gmDb<=0);
      if(mg.wgc)h+="ゲイン交差角周波数 "+U.htx("ω_gc")+" = "+_w09_p(mg.wgc,3)+" rad/s、位相余裕 "+U.htx("φ_m")+" = <b>"+_w09_f(mg.pm,1)+"°</b><br>";
      else h+="ゲインが 0 dB を横切らない（どの角周波数でも 1 より小さい）<br>";
      if(mg.wpc)h+="位相交差角周波数 "+U.htx("ω_pc")+" = "+_w09_p(mg.wpc,3)+" rad/s、ゲイン余裕 "+U.htx("g_m")+" = <b>"+_w09_f(mg.gmDb,2)+" dB</b>（"+_w09_p(mg.gm,3)+" 倍。比例ゲインを "+_w09_p(K*mg.gm,3)+" "+pl.Ku+" にすると安定限界）<br>";
      else h+="位相が −180° まで遅れない: ゲイン余裕は無限大<br>";
      if(mg.wgc&&mg.pm>0){var add=mg.pm*Math.PI/180/mg.wgc;h+="許されるむだ時間: いまの "+_w09_p(L,3)+" s に、あと "+U.fmt.time(add,3)+" 足せる（"+U.htx("φ_m/ω_gc")+"。合計 "+U.fmt.time(L+add,3)+"）<br>";}
      if(unst)h+='<span class="warn">余裕が負: 閉ループは不安定</span><br>';
      else{var mx=sim.peak;var mp=Math.max(0,(mx-yf)/Math.abs(yf)*100),pr=mg.pm?_w09_mp_from_pm(mg.pm):null;
        h+="行き過ぎ量（数値計算）: <b>"+_w09_f(mp,1)+" %</b>"+(pr!=null?"、二次遅れの形の表から読む目安: "+_w09_f(pr,1)+" %":"")+"<br>";}
      var md=Infinity;ws.forEach(function(w){var v=_w09_jw(U,pl,K,L,w);md=Math.min(md,Math.hypot(1+v.re,v.im));});
      h+="−1 の点との最も近い距離: "+_w09_p(md,3)+"（感度関数の大きさの最大値 "+_w09_p(1/md,3)+" の逆数）";
      ro.innerHTML=h+'<div class="wnote">余裕は共通部品 U.ctl.margins で求めた（ゲインが 1 を、位相が −180° を最初に横切る角周波数）。台車は 1 章と同じく決めた力 2 N を足し、測った値が L 遅れる。モータと温度の板のむだ時間は、測った値の遅れとして入れた。応答は零次ホールドで細かい刻みに離散化して計算した。</div>';
    }
    draw();
  };

  /* ===== 10 章 PID 制御 ===== */
  function _w10_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w10_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w10_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w10_h(s){return String(s).replace(/([A-Za-zΑ-Ωα-ω])_\{([^}]*)\}/g,"$1<sub>$2</sub>").replace(/([A-Za-zΑ-Ωα-ω])_([A-Za-z0-9]+)/g,"$1<sub>$2</sub>");}

  /* 制御対象（状態空間と伝達関数。値はどれも本文の例の値）。plate は周りとの温度の差で計算し、表示では 25 °C を足す */
  var _W10_PL={
    mpos:{name:"モータの角度",A:[[0,1],[0,-20]],B:[0,1000],C:[1,0],L:0,num:[1000],den:[1,20,0],yu:"rad",uu:"V",ylab:"角度",ulab:"電圧",ulo:-12,uhi:12},
    cart:{name:"台車の速度",A:[[-2]],B:[1],C:[1],L:0,num:[0.5],den:[0.5,1],yu:"m/s",uu:"N",ylab:"速度",ulab:"力",ulo:-1e9,uhi:1e9},
    mspd:{name:"モータの角速度",A:[[-20]],B:[1000],C:[1],L:0,num:[50],den:[0.05,1],yu:"rad/s",uu:"V",ylab:"角速度",ulab:"電圧",ulo:-12,uhi:12},
    plate:{name:"温度の板",A:[[-0.002]],B:[0.0025],C:[1],L:20,num:[1.25],den:[500,1],yu:"K",uu:"W",ylab:"温度",ulab:"電力",ulo:0,uhi:80}
  };

  /* PID の閉ループを刻み h で計算する（10 章の図の _f10_sim と同じ計算。制御器は刻みごとに計算して次の刻みまで保ち、対象は厳密に離散化）。
     o: {KP, KI, KD, N（null で理想の微分）, dmode（"y" 測った値の微分 / "e" 偏差の微分）, b（目標値の重み）, deriv（"diff" 1 刻み前との差 /
     "model" 模型から求めた理想の微分。測った値の微分だけ）, r(t), d(t)（操作量に入る外乱）, x0, I0, noise(k), h, tEnd, every}。
     返り値 {t, y, ym, u, uP, uI, uD}（every 刻みごと） */
  function _w10_sim(U,pl,o){
    var A=pl.A,n=A.length,Bc=pl.B.map(function(v){return [v];}),dd=U.ctl.mat.c2d(A,Bc,o.h),Ad=dd.A,Bd=dd.B.map(function(r){return r[0];});
    var C=pl.C,CB=0,i,j;for(i=0;i<n;i++)CB+=C[i]*pl.B[i];
    var steps=Math.round(o.tEnd/o.h),nd=Math.round((o.L!=null?o.L:pl.L)/o.h),x=(o.x0||[]).slice();while(x.length<n)x.push(0);
    var Yh=new Float64Array(steps+1),DYh=new Float64Array(steps+1),KP=o.KP,KI=o.KI||0,KD=o.KD||0,b=o.b==null?1:o.b,I=o.I0||0,Df=0,prev=null,ev=o.every||1;
    var out={t:[],y:[],ym:[],u:[],uP:[],uI:[],uD:[]},rf=o.r||function(){return 1;},df=o.d||function(){return 0;};
    for(var k=0;k<=steps;k++){
      var t=k*o.h,y=0;for(i=0;i<n;i++)y+=C[i]*x[i];Yh[k]=y;
      var ym=k-nd>=0?Yh[k-nd]:Yh[0];if(o.noise)ym+=o.noise(k);
      var rr=rf(t),e=rr-ym,uP=KP*(b*rr-ym),dv=df(t),u,uD;
      if(o.deriv==="model"){
        var CAx=0;for(i=0;i<n;i++){var s=0;for(j=0;j<n;j++)s+=A[i][j]*x[j];CAx+=C[i]*s;}
        if(nd>0){var dym=k-nd>=0?DYh[k-nd]:0;uD=-KD*dym;u=uP+I+uD;}
        else{u=(uP+I-KD*(CAx+CB*dv))/(1+KD*CB);uD=u-uP-I;}
        DYh[k]=CAx+CB*(u+dv);
      }else{
        var sg=o.dmode==="e"?e:-ym;if(prev===null)prev=sg;
        if(KD){if(o.N==null)Df=KD*(sg-prev)/o.h;else{var Tf=KD/KP/o.N;Df=Tf/(Tf+o.h)*Df+KD/(Tf+o.h)*(sg-prev);}}
        prev=sg;uD=Df;u=uP+I+uD;
      }
      if(k%ev===0){out.t.push(t);out.y.push(y);out.ym.push(ym);out.u.push(u);out.uP.push(uP);out.uI.push(I);out.uD.push(uD);}
      I+=KI*o.h*e;
      var nx=[];for(i=0;i<n;i++){var s2=Bd[i]*(u+dv);for(j=0;j<n;j++)s2+=Ad[i][j]*x[j];nx.push(s2);}x=nx;
      if(!isFinite(y)||Math.abs(y)>1e7)break;
    }
    return out;
  }
  /* 行き過ぎ量 [%] と ±band の整定時間（t0 から）。落ち着かなければ ts = NaN */
  function _w10_met(t,y,yf,t0,t1,band){band=band||0.02;var mx=-Infinity,last=-1,cnt=0;
    for(var k=0;k<t.length;k++){if(t[k]<t0-1e-12||(t1!=null&&t[k]>=t1))continue;cnt++;if(y[k]>mx)mx=y[k];if(Math.abs(y[k]-yf)>band*Math.abs(yf))last=k;}
    var ts=last<0?0:(last+1<t.length&&(t1==null||t[last+1]<t1)?t[last+1]-t0:NaN);return {mp:(mx-yf)/Math.abs(yf)*100,ts:ts};}
  function _w10_poles(ps){var o=[];ps.forEach(function(p){if(p.im<-1e-9)return;o.push(Math.abs(p.im)>1e-6*(1+Math.abs(p.re))?_w10_g(p.re,3)+" ± j"+_w10_g(p.im,3):_w10_g(p.re,3));});return o.join("、");}
  /* PID の伝達関数（並列形）。KI・KD が 0 の項は入れない（原点の極と零点の打ち消しを作らない） */
  function _w10_C(U,KP,KI,KD,N){var P=U.ctl.poly;
    var num,den;if(KI){num=[KP,KI];den=[1,0];}else{num=[KP];den=[1];}
    if(KD){if(N==null){num=P.add(num,P.mul([KD,0],den));}else{var Tf=KD/KP/N;num=P.add(P.mul(num,[Tf,1]),P.mul([KD,0],den));den=P.mul(den,[Tf,1]);}}
    return U.ctl.tf(num,den);}
  function _w10_rhp(ps){return ps.some(function(p){return p.re>1e-7*(1+Math.abs(p.im));});}

  /* ---- 4 節: PID のボード線図 ---- */
  var _W10_BD={
    mpos:{kp:[0.1,0.21,0.42,0.84,1.5,3,6,10],ti:[0,0.05,0.1,0.168,0.3,0.5,1,2],td:[0,0.005,0.01,0.0238,0.04,0.06,0.1,0.2],def:[3,3,3],wr:[0.1,1000],kpu:"V/rad",tEnd:1.2},
    cart:{kp:[1,2,4,8,14,20,30,50],ti:[0,0.02,0.04,0.08,0.16,0.32,0.64,1.28],td:[0,0.005,0.01,0.02,0.05,0.1,0.2,0.5],def:[3,5,0],wr:[0.1,1000],kpu:"N/(m/s)",tEnd:2.5},
    mspd:{kp:[0.02,0.05,0.1,0.2,0.5,1,2,5],ti:[0,0.005,0.01,0.025,0.05,0.1,0.2,0.5],td:[0,0.0005,0.001,0.002,0.005,0.01,0.02,0.05],def:[2,4,0],wr:[1,10000],kpu:"V/(rad/s)",tEnd:0.15},
    plate:{kp:[3,6,12,18,24,30,36,48],ti:[0,20,40,60,80,160,320,640],td:[0,2.5,5,10,15,20,40,80],def:[4,2,3],wr:[0.0001,1],kpu:"W/K",tEnd:1500}
  };
  REG.w10_bode=function(el,U){
    var S=U.S,ctl=U.ctl,keys=["mpos","cart","mspd","plate"];
    U.head(el,"PID BODE","PID のボード線図 — 制御器・一巡伝達関数・ステップ応答");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度 1000/(s(s + 20))","台車の速度 0.5/(0.5s + 1)","モータの角速度 50/(0.05s + 1)","温度の板 1.25e^(−20s)/(500s + 1)"],0,function(){def();draw();});
    function cur(){return _W10_BD[keys[pl.get()]];}
    var r2=U.ctrls(el);
    var kp=U.slider(r2,"K<sub>P</sub>",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return _w10_g(cur().kp[i],3)+" "+cur().kpu;},onInput:draw});
    var ti=U.slider(r2,"T<sub>I</sub>",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return i===0?"なし":_w10_g(cur().ti[i],3)+" s";},onInput:draw});
    var td=U.slider(r2,"T<sub>D</sub>",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return i===0?"なし":_w10_g(cur().td[i],3)+" s";},onInput:draw});
    var r3=U.ctrls(el);
    var wv=U.slider(r3,"見る角周波数 ω（ボード線図の上をドラッグしてもよい）",{min:0,max:1,step:0.002,value:0.5,fmt:function(v){return _w10_g(wOf(v),3)+" rad/s";},onInput:draw});
    function wOf(v){var c=cur();return Math.pow(10,Math.log10(c.wr[0])+v*(Math.log10(c.wr[1])-Math.log10(c.wr[0])));}
    var br=U.btnrow(el);
    function def(){var d=cur().def;kp.set(d[0]);ti.set(d[1]);td.set(d[2]);}
    U.button(br,"本文の例",function(){def();draw();});
    U.button(br,"比例だけ",function(){ti.set(0);td.set(0);draw();});
    U.button(br,"I を外す",function(){ti.set(0);draw();});
    U.button(br,"D を外す",function(){td.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el),last=null;
    ctl.drag(box,function(type,x,y){if(!last||type==="up")return;var B=last.B1,B2=last.B2,hit=null;
      [B,B2].forEach(function(b){if(b&&x>=b.Pm.x-4&&x<=b.Pm.x+b.Pm.w+4&&y>=b.Pm.y-4&&y<=b.Pp.y+b.Pp.h+4)hit=b;});
      if(!hit)return type==="down"?false:undefined;var w=hit.Pm.ux(Math.max(hit.Pm.x,Math.min(hit.Pm.x+hit.Pm.w,x))),c=cur();
      wv.set((Math.log10(w)-Math.log10(c.wr[0]))/(Math.log10(c.wr[1])-Math.log10(c.wr[0])));draw();});
    function draw(){
      var key=keys[pl.get()],c=_W10_BD[key],P=_W10_PL[key],KP=c.kp[kp.get()],TI=c.ti[ti.get()],TD=c.td[td.get()];
      var KI=TI?KP/TI:0,KD=TD?KP*TD:0,Cs=_w10_C(U,KP,KI,KD,null),Pt=ctl.tf(P.num,P.den,P.L),Lt=ctl.series(Pt,Cs);
      var ws=ctl.logspace(Math.log10(c.wr[0]),Math.log10(c.wr[1]),500),bc=ctl.bode(Cs,ws),bl=ctl.bode(Lt,ws),w0=wOf(wv.get());
      var mg=ctl.margins(Lt,c.wr[0]/10,c.wr[1]*10);
      var nar=_w10_nar(box),Wd=nar?400:700,o=[];
      /* 制御器のボード線図（P・I・D の漸近線つき） */
      var x1=nar?58:62,w1=nar?320:270;
      var cdb=bc.db.slice(),lo=Math.min.apply(null,cdb),hi=Math.max.apply(null,cdb);
      var dbr=[Math.floor((lo-6)/20)*20,Math.ceil((hi+6)/20)*20];if(dbr[1]-dbr[0]>120)dbr[1]=dbr[0]+120;
      var B1=ctl.bodeSvg([{w:ws,db:bc.db,ph:bc.ph,c:"ink",lw:2.2}],{x:x1,y:24,w:w1,hm:120,hp:90,gap:30,wr:c.wr,dbr:dbr,phr:[-90,90]});
      o.push(S.TX(x1-50,14,"(a) 制御器 C(jω)","start",10.5,"ink",true));
      o.push(B1.svg);
      var asy=[];if(KI)asy.push([function(w){return 20*Math.log10(KI/w);},"green"]);asy.push([function(){return 20*Math.log10(KP);},"gold"]);if(KD)asy.push([function(w){return 20*Math.log10(KD*w);},"teal"]);
      asy.forEach(function(a){o.push(B1.Pm.clip(ws.map(function(w){return [w,a[0](w)];}),a[1],1.3,"4 3"));});
      var cw=ctl.freq(Cs,w0),cg=ctl.cx.abs(cw),cp=ctl.cx.arg(cw)*180/Math.PI;
      o.push(S.L(B1.Pm.X(w0),B1.Pm.y,B1.Pm.X(w0),B1.Pp.y+B1.Pp.h,"gold",1,"3 3"));
      o.push(S.D(B1.Pm.X(w0),B1.Pm.Y(Math.max(dbr[0],Math.min(dbr[1],20*Math.log10(cg)))),"gold",4));o.push(S.D(B1.Pp.X(w0),B1.Pp.Y(Math.max(-90,Math.min(90,cp))),"gold",4));
      var lg=[["ink",null,"C(jω)"]];if(KI)lg.push(["green","4 3","I: K_I/ω"]);lg.push(["gold","4 3","P: K_P"]);if(KD)lg.push(["teal","4 3","D: K_D ω"]);
      var yL=B1.h+4;o.push(S.LEGL(x1-40,yL,lg,9,10));
      /* 一巡伝達関数のボード線図 */
      var x2=nar?58:410,y2=nar?yL+34:24,w2=nar?320:270;
      var ldb=bl.db.filter(function(v){return isFinite(v);}),l1=Math.max(-80,Math.min.apply(null,ldb)),h1=Math.min(80,Math.max.apply(null,ldb));
      var dbr2=[Math.floor(l1/20)*20,Math.ceil(h1/20)*20];if(dbr2[0]===dbr2[1])dbr2[1]+=20;
      var phmin=Math.min.apply(null,bl.ph),phr2=[Math.max(-360,Math.floor(Math.min(phmin,-180)/90)*90-0),0];if(Math.max.apply(null,bl.ph)>0)phr2[1]=90;
      var B2=ctl.bodeSvg([{w:ws,db:bl.db,ph:bl.ph,c:"signal",lw:2.2}],{x:x2,y:y2,w:w2,hm:120,hp:90,gap:30,wr:c.wr,dbr:dbr2,phr:phr2});
      o.push(S.TX(x2-50,y2-10,"(b) 一巡伝達関数 P(jω)C(jω)","start",10.5,"ink",true));
      o.push(B2.svg);
      o.push(S.L(B2.Pm.X(w0),B2.Pm.y,B2.Pm.X(w0),B2.Pp.y+B2.Pp.h,"gold",1,"3 3"));
      if(mg.wgc){var phg=-180+mg.pm;o.push(S.D(B2.Pm.X(mg.wgc),B2.Pm.Y(0),"signal",4));o.push(S.D(B2.Pp.X(mg.wgc),B2.Pp.Y(Math.max(phr2[0],Math.min(phr2[1],phg))),"signal",4));
        if(phg>=phr2[0]&&phg<=phr2[1]){o.push(S.L(B2.Pp.X(mg.wgc),B2.Pp.Y(-180),B2.Pp.X(mg.wgc),B2.Pp.Y(phg),mg.pm>0?"green":"alias",2.2));
          o.push(S.TX(B2.Pp.X(mg.wgc)+6,B2.Pp.Y((phg-180)/2)+4,"位相余裕 "+_w10_f(mg.pm,1)+"°","start",9.5,mg.pm>0?"green":"alias",true,true));}}
      /* ステップ応答（目標値を 1 だけ変える。D 動作は測った値に掛ける） */
      var y3=nar?B2.h+30:Math.max(B1.h,B2.h)+30,x3=nar?58:62,w3=nar?320:610;
      var tE=c.tEnd;if(mg.wgc&&mg.pm>0)tE=Math.max(c.tEnd*0.25,Math.min(c.tEnd*4,14/mg.wgc));
      var h=tE/4000,R=_w10_sim(U,P,{KP:KP,KI:KI,KD:KD,deriv:"model",r:function(){return 1;},h:h,tEnd:tE,every:4});
      var ys=R.y,ymax=1.6;ys.forEach(function(v){if(isFinite(v))ymax=Math.max(ymax,Math.min(3,v*1.08));});
      var Q=U.plot(x3,y3+16,w3,110,[0,tE],[0,ymax]);
      o.push(S.T(x3-50,y3+4,"(c) 目標値を 1 だけ変えたときの制御量（D 動作は測った値に掛ける）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",yl:"制御量",xt:U.nice(0,tE,6),yt:U.nice(0,ymax,4),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,2);},ylOff:40,sz:9}));
      o.push(Q.line([[0,1],[tE,1]],"muted",1.2,"5 3"));
      o.push(Q.clip(R.t.map(function(t,i){return [t,R.y[i]];}),"signal",2));
      var met=_w10_met(R.t,R.y,1,0);
      box.set(S.svg(Wd,y3+16+110+44,o));
      last={B1:B1,B2:B2};
      /* 読み出し */
      var hs="制御器: C(jω) = K<sub>P</sub> + j(K<sub>D</sub>ω − K<sub>I</sub>/ω)。ω = "+_w10_g(w0,3)+" rad/s で、実部 "+_w10_g(KP,3)+"、虚部 "+_w10_g(KD*w0-KI/w0,3)+" → ゲイン "+_w10_g(cg,3)+"（"+_w10_f(20*Math.log10(cg),1)+" dB）、位相 "+_w10_f(cp,1)+"°<br>";
      if(KI&&KD)hs+="ゲインが最小になる ω<sub>0</sub> = 1/√(T<sub>I</sub>T<sub>D</sub>) = "+_w10_g(1/Math.sqrt(TI*TD),3)+" rad/s（そこでゲインは K<sub>P</sub>、位相は 0°）<br>";
      hs+="一巡伝達関数: "+(mg.wgc?"ゲイン交差角周波数 "+_w10_g(mg.wgc,3)+" rad/s、位相余裕 <b>"+_w10_f(mg.pm,1)+"°</b>":"ゲインが 1 を横切らない")+(mg.wpc?"、ゲイン余裕 "+_w10_f(mg.gmDb,1)+" dB":"")+"<br>";
      var stable=true;
      if(!P.L){var Pn=P.num,Pd=P.den,PO=ctl.poly,den=PO.add(PO.mul(Pd,Cs.den),PO.mul(Pn,Cs.num)),ps=PO.roots(den);stable=!_w10_rhp(ps);hs+="閉ループの極: "+_w10_poles(ps)+(stable?"":' <span class="warn">右半平面の極がある（不安定）</span>')+"<br>";}
      else if(mg.pm!=null&&mg.pm<0){stable=false;hs+='<span class="warn">位相余裕が負: 閉ループは不安定（9 章 6 節）</span><br>';}
      if(stable&&isFinite(met.ts))hs+="ステップ応答: 行き過ぎ量 <b>"+_w10_f(Math.max(0,met.mp),1)+" %</b>、2 % 整定時間 <b>"+_w10_g(met.ts,3)+" s</b>";
      else hs+='ステップ応答: <span class="warn">表示した時間の中で落ち着かない</span>';
      ro.innerHTML=hs+'<div class="wnote">D 動作は理想の微分（不完全微分は 6 節）。ステップ応答は、目標値の段差を微分しない形（3 節）で、刻み '+_w10_g(h,2)+' s の数値計算。操作量の上限は考えていない。値はどれも例の値。</div>';
    }
    def();draw();
  };

  /* ---- 5 節: 対象ごとの効き方（P・I・D の分に分けて見る） ---- */
  var _W10_PD={
    mpos:{kp:[0.1,0.21,0.42,0.84,1.5,3],kpu:"V/rad",ti:[0.05,0.1,0.168,0.3,0.42,1],td:[0.005,0.01,0.0238,0.04,0.06,0.1],
      pre:[["比例だけ（0.21 V/rad）",0,1,2,2],["PD（本文の例）",2,3,2,2],["PID（本文の例）",3,3,2,2],["PID で I を強く（T_I = 0.05 s）",3,3,0,2]],
      def:2,tf:0.53,tEnd:2.0,h:1e-4,ev:10,td0:1.0,dist:"1.0 s から負荷トルク 0.01 N·m（−1 V）",dv:-1,r:1,band:0.02},
    mspd:{kp:[0.02,0.05,0.1,0.2,0.5,1],kpu:"V/(rad/s)",ti:[0.01,0.025,0.05,0.1,0.2,0.5],td:[0.0005,0.001,0.002,0.005,0.01,0.02],
      pre:[["比例だけ（0.1）",0,2,2,2],["PI（本文の例）",1,2,2,2],["比例だけ（0.5）",0,4,2,2],["PI に D を足す",3,2,2,2]],
      def:1,tf:0.52,tEnd:0.6,h:5e-5,ev:6,td0:0.3,dist:"0.3 s から負荷トルク 0.01 N·m（−1 V）",dv:-1,r:100,band:0.02},
    plate:{kp:[6,12,18,24,30,36],kpu:"W/K",ti:[20,40,60,80,160,320],td:[2.5,5,10,15,20,40],
      pre:[["比例だけ（24 W/K）",0,3,1,2],["PI（12 W/K・80 s）",1,1,3,2],["PI（24 W/K・40 s）",1,3,1,2],["PID（24・40・10）",3,3,1,2]],
      def:3,tf:0.13,tEnd:1100,h:0.1,ev:5,td0:100,dist:"100 s に周りの温度が 25 °C から 15 °C に（−8 W）",dv:-8,r:35,band:0}
  };
  REG.w10_pid=function(el,U){
    var S=U.S,ctl=U.ctl,keys=["mpos","mspd","plate"];
    U.head(el,"PID","P・I・D の分に分けて見る — モータの角速度・角度、温度の板");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度 1000/(s(s + 20))","モータの角速度 50/(0.05s + 1)","温度の板（むだ時間 20 s）"],0,function(){relabel();preset(cur().pre[cur().def]);});
    var md=U.select(r1,"制御器",["比例だけ","PI","PD","PID"],3,function(){run();});
    function cur(){return _W10_PD[keys[pl.get()]];}
    var r2=U.ctrls(el);
    var kp=U.slider(r2,"K<sub>P</sub>",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return _w10_g(cur().kp[i],3)+" "+cur().kpu;},onInput:function(){run();}});
    var ti=U.slider(r2,"T<sub>I</sub>",{values:[0,1,2,3,4,5],value:2,fmt:function(i){return _w10_g(cur().ti[i],3)+" s";},onInput:function(){run();}});
    var td=U.slider(r2,"T<sub>D</sub>",{values:[0,1,2,3,4,5],value:2,fmt:function(i){return _w10_g(cur().td[i],3)+" s";},onInput:function(){run();}});
    var r3=U.ctrls(el);
    var ds=U.checkbox(r3,"外乱を入れる",true,function(){run();});
    var st=U.slider(r3,"時刻",{min:0,max:1,step:0.002,value:0.25,fmt:function(v){return R?_w10_g(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.004;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    var pbs=[0,1,2,3].map(function(k){return U.button(br,"",function(){preset(cur().pre[k]);});});
    function relabel(){pbs.forEach(function(b,k){b.innerHTML=_w10_h(cur().pre[k][0]);});}
    function preset(p){tk.stop();md.set(p[1]);kp.set(p[2]);ti.set(p[3]);td.set(p[4]);ds.set(true);st.set(cur().tf);run();}
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var key=keys[pl.get()],c=cur(),P=_W10_PL[key],M=+md.get(),KP=c.kp[kp.get()],TI=c.ti[ti.get()],TD=c.td[td.get()];
      ti.el.style.display=(M===1||M===3)?"":"none";td.el.style.display=(M>=2)?"":"none";
      var KI=(M===1||M===3)?KP/TI:0,KD=M>=2?KP*TD:0,D=ds.get(),t0=c.td0,dv=c.dv;
      var o={KP:KP,KI:KI,KD:KD,deriv:"model",h:c.h,tEnd:c.tEnd,every:c.ev,r:function(){return c.r;},d:function(t){return D&&t>=t0?dv:0;}};
      if(key==="plate"){if(KI){o.x0=[35];o.I0=28;}else{o.x0=[35*1.25*KP/(1+1.25*KP)];o.I0=0;}}
      var res=_w10_sim(U,P,o);res.tEnd=c.tEnd;res.key=key;res.KP=KP;res.KI=KI;res.KD=KD;res.M=M;res.TI=TI;res.TD=TD;res.D=D;
      /* 指標 */
      var t=res.t,y=res.y.map(function(v){return key==="plate"?v+25:v;});res.yy=y;
      var bad=y.length<t.length||y.some(function(v){return !isFinite(v)||Math.abs(v)>1e6;});res.bad=bad;
      if(key==="plate"){var ptf=ctl.series(ctl.tf(P.num,P.den,P.L),_w10_C(U,KP,KI,KD,null));res.mg=ctl.margins(ptf,1e-4,10);}
      else{var Cs=_w10_C(U,KP,KI,KD,null),PO=ctl.poly;res.ps=PO.roots(PO.add(PO.mul(P.den,Cs.den),PO.mul(P.num,Cs.num)));}
      R=res;st.set(st.get());draw();
    }
    function draw(){
      if(!R)return;var key=R.key,c=cur(),P=_W10_PL[key],t=R.t,y=R.yy,n=t.length,nar=_w10_nar(box),Wd=nar?400:700,o=[];
      var tc=st.get()*R.tEnd,ix=Math.max(0,Math.min(n-1,Math.round(tc/(t[1]-t[0]))));
      /* 対象の絵 */
      var px=nar?8:10,py=26,pw=nar?180:200,ph=150;
      o.push(S.T(px,16,"その時刻の様子","start",10,"ink",true));
      if(key==="mpos"){var cx=px+pw/2,cy=py+ph/2,Rd=60,th=y[ix];
        o.push(S.CIRC(cx,cy,Rd,"muted",1.6,"panel"));o.push(S.L(cx,cy,cx+Rd+8,cy,"faint",1,"3 3"));
        o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(1),cy-(Rd-4)*Math.sin(1),"muted",1.8,"5 3"));
        var arc=[];for(var a=0;a<=40;a++){var an=th*a/40;arc.push([cx+24*Math.cos(an),cy-24*Math.sin(an)]);}if(Math.abs(th)>0.02)o.push(S.PL(arc,"signal",1.4));
        o.push(S.L(cx,cy,cx+(Rd-4)*Math.cos(th),cy-(Rd-4)*Math.sin(th),"signal",3.5));o.push(S.D(cx,cy,"ink",3.6));
        o.push(S.T(cx+(Rd+6)*Math.cos(1),cy-(Rd+6)*Math.sin(1)-2,"目標 1 rad","start",9,"muted",false,false,null,true));
        o.push(S.TX(px+8,py+ph+12,"θ_m = "+_w10_f(th,3)+" rad","start",10,"signal",true,true));}
      else if(key==="mspd"){var gx=px+pw/2,gy=py+ph-30,Rg=72,w=y[ix],wmax=120,ang=function(v){return Math.PI*(1-Math.max(0,Math.min(wmax,v))/wmax);};
        var ga=[];for(var q=0;q<=40;q++){var aa=Math.PI*q/40;ga.push([gx+Rg*Math.cos(aa),gy-Rg*Math.sin(aa)]);}o.push(S.PL(ga,"muted",1.6));
        [0,40,80,120].forEach(function(v){var aa=ang(v);o.push(S.L(gx+(Rg-6)*Math.cos(aa),gy-(Rg-6)*Math.sin(aa),gx+Rg*Math.cos(aa),gy-Rg*Math.sin(aa),"muted",1.2));o.push(S.T(gx+(Rg+12)*Math.cos(aa),gy-(Rg+12)*Math.sin(aa)+3,String(v),"middle",9,"muted"));});
        var ta=ang(c.r);o.push(S.L(gx,gy,gx+(Rg-2)*Math.cos(ta),gy-(Rg-2)*Math.sin(ta),"muted",1.6,"5 3"));
        var na=ang(w);o.push(S.L(gx,gy,gx+(Rg-8)*Math.cos(na),gy-(Rg-8)*Math.sin(na),"signal",3.2));o.push(S.D(gx,gy,"ink",3.6));
        o.push(S.TX(px+8,py+ph+12,"ω_m = "+_w10_f(w,1)+" rad/s（目標 100）","start",10,"signal",true,true));}
      else{var tp=y[ix],q2=R.u[ix],op=Math.max(0.08,Math.min(0.95,(tp-57.5)/3.5));
        o.push(S.RECT(px+20,py+40,pw-40,26,4,"alias","muted",1.2,null,' fill-opacity="'+_w10_f(op,2)+'"'));
        o.push(S.T(px+pw/2,py+34,"板（色が濃いほど熱い）","middle",9,"muted"));
        var hb=Math.max(0,Math.min(1,q2/80));o.push(S.RECT(px+20,py+74,pw-40,10,2,"panel","line",1));o.push(S.RECT(px+20,py+74,(pw-40)*hb,10,2,U.soft("gold"),"gold",1));
        o.push(S.T(px+20,py+98,"ヒータ "+_w10_f(q2,1)+" W（0〜80 W）","start",9.5,"gold",true));
        o.push(S.T(px+20,py+114,"周り "+(R.D&&t[ix]>=c.td0?"15":"25")+" °C","start",9.5,"purple",true));
        o.push(S.TX(px+8,py+ph+12,"θ = "+_w10_f(tp,2)+" °C（目標 60）","start",10,"signal",true,true));}
      /* P・I・D の棒 */
      var by=py+ph+44,bx0=px+40,bw=pw-50,vals=[[R.uP[ix],"P","gold"],[R.uI[ix],"I","green"],[R.uD[ix],"D","teal"],[R.u[ix],"計","ink"]];
      var um=0;for(var k=0;k<n;k++){um=Math.max(um,Math.abs(R.uP[k]),Math.abs(R.uI[k]),Math.abs(R.uD[k]),Math.abs(R.u[k]));}um=Math.min(um,1e6)||1;
      var z=bx0+bw/2;o.push(S.T(px,by-6,"操作量の内訳 ["+P.uu+"]","start",10,"ink",true));
      vals.forEach(function(v,k){var yy=by+6+k*20,len=v[0]/um*bw/2;o.push(S.T(bx0-8,yy+11,v[1],"end",10,v[2],true));
        o.push(S.RECT(Math.min(z,z+len),yy+2,Math.abs(len),12,2,U.soft(v[2]),v[2],1));o.push(S.T(z+(len>=0?len+4:len-4),yy+12,_w10_g(v[0],3),len>=0?"start":"end",9,v[2],false,false,null,true));});
      o.push(S.L(z,by+4,z,by+86,"muted",1));
      /* 波形 */
      var gx0=nar?52:268,gw=nar?330:412,gy0=nar?by+100:20,gh=nar?110:130;
      var ys=y.filter(function(v){return isFinite(v);}),ylo=Math.min.apply(null,ys),yhi=Math.max.apply(null,ys);
      if(key==="mpos"){ylo=Math.max(ylo,-1);yhi=Math.min(Math.max(yhi,1.1),2);ylo=Math.min(ylo,0);}
      if(key==="mspd"){ylo=0;yhi=Math.min(Math.max(yhi,105),160);}
      if(key==="plate"){ylo=Math.max(Math.min(ylo,59.5),56);yhi=Math.min(Math.max(yhi,60.3),64);}
      var sp=yhi-ylo||1;ylo-=sp*0.05;yhi+=sp*0.08;
      var Q=U.plot(gx0,gy0,gw,gh,[0,R.tEnd],[ylo,yhi]);
      if(R.D)o.push(S.RECT(Q.X(c.td0),Q.y,Q.X(R.tEnd)-Q.X(c.td0),Q.h,0,U.soft("purple"),"none",0));
      o.push(Q.axes({xl:null,yl:P.ylab+" ["+(key==="plate"?"°C":P.yu)+"]",xt:U.nice(0,R.tEnd,6),yt:U.nice(ylo,yhi,4),xfmt:function(){return "";},yfmt:function(v){return _w10_g(v,4);},ylOff:nar?36:42,sz:9}));
      var tgt=key==="plate"?60:c.r;o.push(Q.line([[0,tgt],[R.tEnd,tgt]],"muted",1.2,"5 3"));
      o.push(Q.clip(t.map(function(tt,i){return [tt,y[i]];}),"signal",2));
      var ul=[];R.u.forEach(function(v,i){ul.push(v,R.uP[i],R.uI[i],R.uD[i]);});ul=ul.filter(function(v){return isFinite(v);});
      var ulo=Math.min.apply(null,ul),uhi=Math.max.apply(null,ul);if(key==="plate"){ulo=Math.max(Math.min(ulo,0),-40);uhi=Math.min(Math.max(uhi,80),120);}else{ulo=Math.max(ulo,-15);uhi=Math.min(uhi,15);}
      var su=uhi-ulo||1;ulo-=su*0.06;uhi+=su*0.06;
      var Q2=U.plot(gx0,gy0+gh+18,gw,gh,[0,R.tEnd],[ulo,uhi]);
      if(R.D)o.push(S.RECT(Q2.X(c.td0),Q2.y,Q2.X(R.tEnd)-Q2.X(c.td0),Q2.h,0,U.soft("purple"),"none",0));
      o.push(Q2.axes({xl:"時間 t [s]",yl:P.ulab+" ["+P.uu+"]",xt:U.nice(0,R.tEnd,6),yt:U.nice(ulo,uhi,4),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,3);},ylOff:nar?36:42,sz:9}));
      if(P.ulo>-1e8){[P.ulo,P.uhi].forEach(function(v){if(v>ulo&&v<uhi)o.push(Q2.line([[0,v],[R.tEnd,v]],"alias",1,"2 3"));});}
      o.push(Q2.line([[0,0],[R.tEnd,0]],"faint",1));
      if(R.M===1||R.M===3)o.push(Q2.clip(t.map(function(tt,i){return [tt,R.uI[i]];}),"green",1.6));
      if(R.M>=2)o.push(Q2.clip(t.map(function(tt,i){return [tt,R.uD[i]];}),"teal",1.6));
      o.push(Q2.clip(t.map(function(tt,i){return [tt,R.uP[i]];}),"gold",1.6));
      o.push(Q2.clip(t.map(function(tt,i){return [tt,R.u[i]];}),"ink",1.4));
      [Q,Q2].forEach(function(G){o.push(S.L(G.X(tc),G.y,G.X(tc),G.y+G.h,"gold",1.2,"3 3"));});
      var lgy=Q2.y+Q2.h+46,lg=[["ink",null,"合計"],["gold",null,"P の分"]];if(R.M===1||R.M===3)lg.push(["green",null,"I の分"]);if(R.M>=2)lg.push(["teal",null,"D の分"]);lg.push(["signal",null,"制御量"]);
      o.push(S.LEGL(gx0-30,lgy,lg,9,10));
      box.set(S.svg(Wd,Math.max(lgy+8,by+100),o));
      /* 読み出し */
      var hs="",uu=P.uu,yu=key==="plate"?"K":P.yu,t0=c.td0;
      if(R.bad){ro.innerHTML='<span class="warn">閉ループが不安定で、制御量が大きくなり続ける。</span>'+(R.mg&&R.mg.pm!=null?" 位相余裕 "+_w10_f(R.mg.pm,1)+"°":"");return;}
      function at(tt){var k=Math.min(n-1,Math.round(tt/(t[1]-t[0])));return y[k];}
      if(key==="plate"){var y0=y[0],m1=-Infinity,mn=Infinity,lastOut=-1;for(var k2=0;k2<n;k2++){if(t[k2]<t0)continue;mn=Math.min(mn,y[k2]);if(Math.abs(y[k2]-y[n-1])>0.1)lastOut=k2;}
        hs+="始めの温度 "+_w10_f(y0,2)+" °C（偏差 "+_w10_f(60-y0,2)+" K）";
        if(R.D)hs+="。周りの温度が下がった後: 最も低い "+_w10_f(mn,2)+" °C（"+_w10_f(mn-y0,2)+" K）、"+(R.KI?(Math.abs(y[n-1]-60)<0.02&&lastOut>=0&&lastOut+1<n?"±0.1 K に戻るまで <b>"+_w10_g(t[lastOut+1]-t0,3)+" s</b>":'<span class="warn">表示の時間の中で ±0.1 K に戻らない</span>'):"落ち着く温度 "+_w10_f(y[n-1],2)+" °C（偏差 "+_w10_f(60-y[n-1],2)+" K）");
        hs+="<br>";if(R.mg)hs+="一巡伝達関数: ゲイン交差角周波数 "+(R.mg.wgc?_w10_g(R.mg.wgc,3)+" rad/s、位相余裕 <b>"+_w10_f(R.mg.pm,1)+"°</b>":"なし")+(R.mg.pm!=null&&R.mg.pm<0?' <span class="warn">位相余裕が負: 閉ループは不安定で、振れが大きくなり続ける（9 章 6 節）</span>':"")+"<br>";}
      else{/* 落ち着く値は式で求める（I 動作があるか、角度（対象が積分を含む）なら目標値。速度の比例だけなら KK_P/(1 + KK_P) 倍） */
        var KK=50*R.KP,yf=(R.KI||key==="mpos")?c.r:c.r*KK/(1+KK),bandv=key==="mpos"?0.02:2,unst=R.ps&&_w10_rhp(R.ps);
        var me=_w10_met(t,y,yf,0,R.D?t0:null,0.02),tw=R.D?t0:R.tEnd;
        if(unst)hs+='<span class="warn">閉ループが不安定</span><br>';
        else{hs+="目標値の変化: "+(Math.abs(yf-c.r)>1e-9?"落ち着く値 "+_w10_g(yf,3)+" "+yu+"（偏差 <b>"+_w10_g(c.r-yf,3)+" "+yu+"</b>）、":"偏差なし、")+"行き過ぎ量 <b>"+_w10_f(Math.max(0,me.mp),1)+" %</b>、2 % 整定時間 <b>"+(isFinite(me.ts)?_w10_g(me.ts,3)+" s":"—</b>（"+_w10_g(tw,3)+" s までに落ち着かない）<b>")+"</b><br>";
        if(R.D){if(R.KI){var mn2=Infinity,tmn=0,last2=-1;for(var k3=0;k3<n;k3++){if(t[k3]<t0)continue;if(y[k3]<mn2){mn2=y[k3];tmn=t[k3];}if(Math.abs(y[k3]-c.r)>bandv)last2=k3;}
            hs+="負荷の後: 最も下がって "+_w10_g(mn2,3)+" "+yu+"（目標からのずれ "+_w10_g(c.r-mn2,3)+" "+yu+"、"+_w10_g(tmn-t0,3)+" s 後）、"+(last2>=0&&last2+1<n?"±"+bandv+" "+yu+" に戻るまで <b>"+_w10_g(t[last2+1]-t0,3)+" s</b>":'<span class="warn">表示の時間の中では ±'+bandv+" "+yu+" に戻りきらない</span>")+"<br>";}
          else{var yd=key==="mpos"?c.r+c.dv/R.KP:yf+50*c.dv/(1+KK);hs+="負荷の後: 落ち着く値 "+_w10_g(yd,3)+" "+yu+"（目標からのずれ <b>"+_w10_g(c.r-yd,3)+" "+yu+"</b>）。I 動作が無いので、ずれが残る<br>";}}}
        if(R.ps)hs+="閉ループの極: "+_w10_poles(R.ps)+(_w10_rhp(R.ps)?' <span class="warn">不安定</span>':"")+"<br>";}
      var umax=Math.max.apply(null,R.u),umin=Math.min.apply(null,R.u);hs+=P.ulab+"の範囲: "+_w10_g(umin,3)+"〜"+_w10_g(umax,3)+" "+uu;
      if(umax>P.uhi+1e-9||umin<P.ulo-1e-9)hs+=' <span class="warn">出せる範囲（'+_w10_g(P.ulo,3)+"〜"+_w10_g(P.uhi,3)+" "+uu+"）を超える。実際にはこのとおりには動かない（11 章 4 節）</span>";
      if(R.M>=2&&key==="mspd")hs+="<br>一次遅れの対象に D 動作を足すと、式の dω<sub>m</sub>/dt の係数が T = 0.05 s から T + KK<sub>D</sub> = "+_w10_g(0.05+50*R.KD,3)+" s に増え、慣性を増やしたのと同じ働きをする"+(R.M===2?"（閉ループの時定数は (T + KK<sub>D</sub>)/(1 + KK<sub>P</sub>) = "+_w10_g((0.05+50*R.KD)/(1+50*R.KP),3)+" s）":"");
      ro.innerHTML=hs+'<div class="wnote">D 動作は測った制御量の変わる速さに掛け（3 節）、理想の微分として計算した。刻み '+_w10_g(c.h,2)+' s の数値計算。操作量の上限・下限は考えていない。値はどれも例の値。</div>';
    }
    relabel();preset(_W10_PD.mpos.pre[_W10_PD.mpos.def]);
  };

  function _w10_mix(a,b){var o={},k;for(k in a)o[k]=a[k];for(k in b)o[k]=b[k];return o;}
  function _w10_sd(v){var m=0;v.forEach(function(x){m+=x;});m/=v.length;var s=0;v.forEach(function(x){s+=(x-m)*(x-m);});return Math.sqrt(s/v.length);}

  /* ---- 6 節: 不完全微分の N と操作量のばたつき ---- */
  REG.w10_noise=function(el,U){
    var S=U.S,ctl=U.ctl,seed=58,Ns=[null,50,20,10,5,3,2,1],SG=[[0,0.0005,0.001,0.002,0.005,0.01],[0,0.01,0.02,0.05,0.1,0.2]];
    U.head(el,"NOISE","不完全微分の N と、操作量のばたつき");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度（PD、1 ms ごとに測る）","温度の板（PID、1 s ごとに読む）"],0,function(){def();run();});
    var r2=U.ctrls(el);
    var nn=U.slider(r2,"N",{values:[0,1,2,3,4,5,6,7],value:3,fmt:function(i){return i===0?"なし（理想の微分）":String(Ns[i]);},onInput:function(){run();}});
    var sg=U.slider(r2,"観測ノイズの標準偏差 σ",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return SG[pl.get()][i]+(pl.get()===0?" rad":" K");},onInput:function(){run();}});
    var br=U.btnrow(el);
    function def(){nn.set(3);sg.set(3);}
    U.button(br,"本文の例（N = 10）",function(){def();run();});
    U.button(br,"N なし",function(){nn.set(0);run();});
    U.button(br,"N = 2",function(){nn.set(6);run();});
    U.button(br,"N = 1",function(){nn.set(7);run();});
    U.button(br,"もう一度（別の乱数）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      var p=pl.get(),N=Ns[nn.get()],sig=SG[p][sg.get()],key=p===0?"mpos":"plate",P=_W10_PL[key];
      var KP=p===0?0.84:24,KI=p===0?0:0.6,KD=p===0?0.02:240,TD=KD/KP,dt=p===0?0.001:1,tEnd=p===0?1.0:1100,tw=p===0?0.6:300;
      var rnd=U.rng(1000+seed),nz=[];for(var k=0;k<=Math.round(tEnd/dt)+2;k++)nz.push(sig*rnd.normal());
      var base={KP:KP,KI:KI,KD:KD,N:N,dmode:"y",deriv:"diff",tEnd:tEnd};
      if(p===0)base.r=function(){return 1;};else{base.r=function(){return 35;};base.d=function(t){return t>=100?-8:0;};base.x0=[35];base.I0=28;}
      var Rn=_w10_sim(U,P,_w10_mix(base,{h:dt,noise:function(k){return nz[k]||0;}}));
      var Rc=_w10_sim(U,P,_w10_mix(base,{h:p===0?1e-4:0.05,every:p===0?10:2}));
      var nar=_w10_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,o=[],off=p===1?25:0;
      /* (a) 操作量 */
      var ul=Rn.u.filter(function(v){return isFinite(v);}),ulo=Math.min.apply(null,ul),uhi=Math.max.apply(null,ul);
      if(p===1){ulo=Math.max(Math.min(ulo,-5),-60);uhi=Math.min(Math.max(uhi,85),140);}else{var mm=Math.max(Math.abs(ulo),Math.abs(uhi),0.2);ulo=Math.max(-mm,-3);uhi=Math.min(mm,3);}
      var A=U.plot(x0,22,pw,110,[0,tEnd],[ulo,uhi]);
      o.push(S.T(x0-50,12,"(a) "+(p===0?"電圧":"ヒータの電力")+"（"+(p===0?"1 ms":"1 s")+" ごとに測った値から計算）","start",10.5,"ink",true));
      if(p===1)o.push(S.RECT(A.x,A.Y(80),A.w,A.Y(0)-A.Y(80),0,U.soft("green"),"none",0));
      o.push(A.axes({xl:null,yl:p===0?"電圧 [V]":"電力 [W]",xt:U.nice(0,tEnd,6),yt:U.nice(ulo,uhi,4),xfmt:function(){return "";},yfmt:function(v){return _w10_g(v,3);},ylOff:nar?36:42,sz:9}));
      o.push(A.steps(Rn.t.map(function(t,i){return [t,Math.max(ulo,Math.min(uhi,Rn.u[i]))];}),N==null?"alias":"teal",1));
      if(p===1)o.push(S.T(A.x+A.w-4,A.Y(80)+12,"緑の帯: ヒータが出せる 0〜80 W","end",9,"green",false,false,null,true));
      /* (b) 制御量 */
      var yl=Rn.y.concat(Rc.y).map(function(v){return v+off;}).filter(function(v){return isFinite(v);}),ylo=Math.min.apply(null,yl),yhi=Math.max.apply(null,yl);
      if(p===1){ylo=Math.max(ylo,59);yhi=Math.min(Math.max(yhi,60.2),61);}else{ylo=0;yhi=Math.min(Math.max(yhi,1.15),1.6);}
      var B=U.plot(x0,A.y+A.h+30,pw,100,[0,tEnd],[ylo,yhi]);
      o.push(S.T(x0-50,B.y-8,"(b) "+(p===0?"角度（目標 1 rad）":"板の温度（100 s に周りの温度が下がる）"),"start",10.5,"ink",true));
      o.push(B.axes({xl:"時間 t [s]",yl:p===0?"角度 [rad]":"温度 [°C]",xt:U.nice(0,tEnd,6),yt:U.nice(ylo,yhi,4),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,4);},ylOff:nar?36:42,sz:9}));
      o.push(B.line([[0,p===0?1:60],[tEnd,p===0?1:60]],"muted",1.2,"5 3"));
      o.push(B.clip(Rc.t.map(function(t,i){return [t,Rc.y[i]+off];}),"muted",1.6,"5 3"));
      o.push(B.clip(Rn.t.map(function(t,i){return [t,Rn.y[i]+off];}),"signal",1.6));
      o.push(S.LEGL(x0,B.y+B.h+46,[["signal",null,"ノイズあり"],["muted","5 3","ノイズなし"]],9,12));
      /* (c) D の分のゲイン */
      var wr=p===0?[1,1e4]:[1e-3,10],ws=ctl.logspace(Math.log10(wr[0]),Math.log10(wr[1]),300);
      var Cy=B.y+B.h+70,G=U.plot(x0,Cy+16,nar?pw:300,110,wr,[KP*TD*wr[0]*0.5,KP*TD*wr[1]*2],{xlog:true,ylog:true});
      o.push(S.T(x0-50,Cy+4,"(c) D の分のゲイン（正弦波の振幅の比）","start",10.5,"ink",true));
      o.push(G.axes({xl:"角周波数 ω [rad/s]",yl:"ゲイン",xfmt:function(v){return _w10_g(v,2);},yfmt:function(v){return _w10_g(v,2);},ylOff:nar?36:42,sz:9}));
      o.push(G.clip(ws.map(function(w){return [w,KP*TD*w];}),"muted",1.6,"5 3"));
      if(N!=null){o.push(G.clip(ws.map(function(w){return [w,KP*TD*w/Math.sqrt(1+Math.pow(TD*w/N,2))];}),"teal",2.2));
        o.push(S.L(G.X(N/TD),G.y,G.X(N/TD),G.y+G.h,"teal",1,"2 3"));}
      o.push(G.clip([[wr[0],KP],[wr[1],KP]],"gold",1.4,"4 3"));
      var lx=nar?x0:G.x+G.w+20,ly=nar?G.y+G.h+44:G.y+14;
      o.push(S.LEGL(lx,ly,[["muted","5 3","理想の微分 K_P T_D ω"]],9,10));
      if(N!=null)o.push(S.LEGL(lx,ly+16,[["teal",null,"不完全微分（上限 K_P N = "+_w10_g(KP*N,3)+"）"]],9,10));
      o.push(S.LEGL(lx,ly+32,[["gold","4 3","P の分 K_P"]],9,10));
      box.set(S.svg(Wd,Math.max(ly+44,G.y+G.h+46),o));
      /* 読み出し */
      var win=Rn.u.filter(function(v,i){return Rn.t[i]>=tw;}),sdu=_w10_sd(win),hs="";
      hs+="落ち着いた後（"+tw+" s から）の"+(p===0?"電圧":"電力")+"の揺れ（標準偏差）: <b>"+_w10_g(sdu,3)+" "+P.uu+"</b>";
      hs+="（P の分だけなら K<sub>P</sub>σ = "+_w10_g(KP*sig,3)+" "+P.uu+"。理想の微分の D の分は √2 K<sub>D</sub>σ/Δt = "+_w10_g(Math.SQRT2*KD*sig/dt,3)+" "+P.uu+"）<br>";
      if(N!=null)hs+="不完全微分: 微分として働くのは N/T<sub>D</sub> = "+_w10_g(N/TD,3)+" rad/s まで、速い揺れの上限は K<sub>P</sub>N = "+_w10_g(KP*N,3)+" "+P.uu+"/"+(p===0?"rad":"K")+"<br>";
      var Cs=_w10_C(U,KP,KI,KD,N),mg=ctl.margins(ctl.series(ctl.tf(P.num,P.den,P.L),Cs),wr[0]/10,wr[1]*10);
      hs+="位相余裕 <b>"+(mg.pm!=null?_w10_f(mg.pm,1)+"°":"—")+"</b>（ゲイン交差角周波数 "+(mg.wgc?_w10_g(mg.wgc,3):"—")+" rad/s）<br>";
      if(p===0){var me=_w10_met(Rc.t,Rc.y,1,0);hs+="ノイズの無いとき: 行き過ぎ量 "+_w10_f(Math.max(0,me.mp),1)+" %、2 % 整定時間 "+(isFinite(me.ts)?_w10_g(me.ts,3)+" s":"—");}
      else{var mn=Infinity,last=-1,n=Rc.t.length;for(var k2=0;k2<n;k2++){if(Rc.t[k2]<100)continue;mn=Math.min(mn,Rc.y[k2]+25);if(Math.abs(Rc.y[k2]-35)>0.1)last=k2;}
        hs+="ノイズの無いとき: 最も下がって "+_w10_f(mn,2)+" °C、"+(last>=0&&last+1<n?"±0.1 K に戻るまで <b>"+_w10_g(Rc.t[last+1]-100,3)+" s</b>":'<span class="warn">表示の時間の中で ±0.1 K に戻らない（揺れが続く）</span>');}
      if(p===1&&(Math.max.apply(null,Rn.u)>80||Math.min.apply(null,Rn.u)<0))hs+='<br><span class="warn">ヒータが出せない電力（0 W 未満か 80 W 超）を求めている</span>';
      ro.innerHTML=hs+'<div class="wnote">ノイズは回ごとに独立な正規分布の乱数（'+(p===0?"1 ms":"1 s")+' ごとに変わる）。D 動作は測った値に掛け、1 回前との差で計算した（6 節の C のコードと同じ式）。モータは PD（0.84 V/rad・0.02 V·s/rad）、温度の板は PID（24 W/K・40 s・10 s）。値はどれも例の値。</div>';
    }
    run();
  };

  /* ---- 6 節: 微分キック・測定値の微分・目標値の重み ---- */
  REG.w10_kick=function(el,U){
    var S=U.S,Ns=[null,50,20,10,5,2],Bs=[0,0.2,0.3,0.5,0.7,1];
    U.head(el,"DERIVATIVE KICK","微分キック — 偏差の微分・測定値の微分・目標値の重み");
    var r1=U.ctrls(el);
    var pl=U.select(r1,"対象",["モータの角度（PID: 0.84 V/rad・5 V/(rad·s)・0.02 V·s/rad）","温度の板（PID: 24 W/K・40 s・10 s）"],0,function(){run();});
    var r2=U.ctrls(el);
    var nn=U.slider(r2,"N",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return i===0?"なし（理想の微分）":String(Ns[i]);},onInput:function(){run();}});
    var bb=U.slider(r2,"目標値の重み b（緑の線）",{values:[0,1,2,3,4,5],value:3,fmt:function(i){return String(Bs[i]);},onInput:function(){run();}});
    var ds=U.checkbox(r2,"外乱も入れる",false,function(){run();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（N = 10、b = 0.5）",function(){nn.set(3);bb.set(3);ds.set(false);run();});
    U.button(br,"N なし（理想の微分）",function(){nn.set(0);run();});
    U.button(br,"b = 1",function(){bb.set(5);run();});
    U.button(br,"b = 0",function(){bb.set(0);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      var p=pl.get(),N=Ns[nn.get()],b=Bs[bb.get()],D=ds.get(),key=p===0?"mpos":"plate",P=_W10_PL[key];
      var KP=p===0?0.84:24,KI=p===0?5:0.6,KD=p===0?0.02:240,ts=p===0?0.1:100,dz=p===0?1.1:900,tEnd=p===0?(D?2.1:1.2):(D?1500:900),h=p===0?1e-5:0.005;
      var off=p===0?0:25,r0=p===0?0:35,r1v=p===0?1:37,dv=p===0?-1:-8;
      var cases=[["偏差の微分（b = 1）","e",1,"alias"],["測定値の微分（b = 1）","y",1,"signal"],["測定値の微分（b = "+b+"）","y",b,"green"]];
      var res=cases.map(function(cs){var o={KP:KP,KI:KI,KD:KD,N:N,dmode:cs[1],b:cs[2],deriv:"diff",h:h,tEnd:tEnd,every:10,
        r:function(t){return t>=ts-1e-12?r1v:r0;},d:function(t){return D&&t>=dz?dv:0;}};
        if(p===1){o.x0=[35];o.I0=28+KP*(1-cs[2])*35;}return _w10_sim(U,P,o);});
      var nar=_w10_nar(box),Wd=nar?400:700,x0=nar?52:62,pw=nar?330:610,o=[],stp=Math.max(1,Math.round(res[0].t.length/2500));
      function thin(r,arr){var q=[];for(var i=0;i<r.t.length;i+=stp)q.push([r.t[i],arr(i)]);
        var im=0;for(var i2=0;i2<r.t.length;i2++)if(Math.abs(r.u[i2])>Math.abs(r.u[im]))im=i2;return q;}
      /* (a) 制御量 */
      var yl=[];res.forEach(function(r){r.y.forEach(function(v){if(isFinite(v))yl.push(v+off);});});
      var ylo=Math.min.apply(null,yl),yhi=Math.max.apply(null,yl);if(p===0){ylo=Math.min(ylo,0);yhi=Math.min(Math.max(yhi,1.1),1.6);}else{ylo=Math.max(Math.min(ylo,59.8),57);yhi=Math.min(Math.max(yhi,62.3),66);}
      var A=U.plot(x0,22,pw,120,[0,tEnd],[ylo,yhi+(yhi-ylo)*0.05]);
      o.push(S.T(x0-50,12,"(a) "+(p===0?"角度（"+ts+" s に目標を 1 rad 変える）":"板の温度（"+ts+" s に目標を 60 °C から 62 °C に）"),"start",10.5,"ink",true));
      o.push(A.axes({xl:null,yl:p===0?"角度 [rad]":"温度 [°C]",xt:U.nice(0,tEnd,6),yt:U.nice(A.yr[0],A.yr[1],4),xfmt:function(){return "";},yfmt:function(v){return _w10_g(v,4);},ylOff:nar?36:42,sz:9}));
      o.push(A.line([[0,r0+off],[ts,r0+off],[ts,r1v+off],[tEnd,r1v+off]],"muted",1.2,"5 3"));
      if(D)o.push(S.RECT(A.X(dz),A.y,A.X(tEnd)-A.X(dz),A.h,0,U.soft("purple"),"none",0));
      res.forEach(function(r,k){o.push(A.clip(thin(r,function(i){return r.y[i]+off;}),cases[k][3],k===0?1.6:2));});
      /* (b) 操作量 */
      var umax=res.map(function(r){return Math.max.apply(null,r.u);}),umin=res.map(function(r){return Math.min.apply(null,r.u);});
      var ulo=p===0?Math.max(-2,Math.min.apply(null,umin)):Math.max(-100,Math.min(0,Math.min.apply(null,umin))),uhi=p===0?Math.min(12,Math.max(1.2,Math.max.apply(null,umax))):Math.min(600,Math.max(90,Math.max.apply(null,umax)));
      var Bp=U.plot(x0,A.y+A.h+30,pw,130,[0,tEnd],[ulo-(uhi-ulo)*0.04,uhi*1.04]);
      o.push(S.T(x0-50,Bp.y-8,"(b) "+(p===0?"電圧":"ヒータの電力")+"（枠を超える山は枠で切ってある）","start",10.5,"ink",true));
      o.push(Bp.axes({xl:"時間 t [s]",yl:p===0?"電圧 [V]":"電力 [W]",xt:U.nice(0,tEnd,6),yt:U.nice(Bp.yr[0],Bp.yr[1],5),xfmt:function(v){return _w10_g(v,3);},yfmt:function(v){return _w10_g(v,3);},ylOff:nar?36:42,sz:9}));
      if(p===1){[0,80].forEach(function(v){o.push(Bp.line([[0,v],[tEnd,v]],"green",1,"2 3"));});}
      if(D)o.push(S.RECT(Bp.X(dz),Bp.y,Bp.X(tEnd)-Bp.X(dz),Bp.h,0,U.soft("purple"),"none",0));
      res.forEach(function(r,k){var q=thin(r,function(i){return r.u[i];});var im=0;for(var i3=0;i3<r.t.length;i3++)if(r.u[i3]>r.u[im])im=i3;q.push([r.t[im],r.u[im]]);q.sort(function(a,b2){return a[0]-b2[0];});
        o.push(Bp.clip(q,cases[k][3],k===0?1.4:1.8));});
      var lgi=cases.map(function(cs){return [cs[3],null,cs[0]];}),lgy=Bp.y+Bp.h+46;
      if(nar){o.push(S.LEGL(x0-30,lgy,lgi.slice(0,2),9,10));o.push(S.LEGL(x0-30,lgy+15,lgi.slice(2),9,10));}else o.push(S.LEGL(x0-30,lgy,lgi,9,10));
      box.set(S.svg(Wd,lgy+(nar?23:8),o));
      /* 読み出し */
      var rows=res.map(function(r,k){var yy=r.y.map(function(v){return v+off;}),yf=r1v+off,mx=-Infinity,last=-1,band=p===0?0.02:0.1;
        for(var i=0;i<r.t.length;i++){if(r.t[i]<ts||(D&&r.t[i]>=dz))continue;mx=Math.max(mx,yy[i]);if(Math.abs(yy[i]-yf)>(p===0?band*1:band))last=i;}
        var tsv=last>=0&&last+1<r.t.length?r.t[last+1]-ts:NaN,ovs=p===0?_w10_f(Math.max(0,(mx-yf)*100),1)+" %":_w10_f(Math.max(0,mx-yf),2)+" K";
        var dd="";if(D){var mn=Infinity;for(var j=0;j<r.t.length;j++)if(r.t[j]>=dz)mn=Math.min(mn,yy[j]);dd=_w10_g(mn-yf,3)+(p===0?" rad":" K");}
        var row=['<span style="color:'+U.col(cases[k][3])+'">■</span> '+cases[k][0],_w10_g(Math.max.apply(null,r.u),3)+" "+P.uu+(p===1?"（最小 "+_w10_g(Math.min.apply(null,r.u),3)+"）":""),ovs,isFinite(tsv)?_w10_g(tsv,3)+" s":"—"];if(D)row.push(dd);return row;});
      var hd=["微分の掛け方",(p===0?"電圧":"電力")+"の最大","行き過ぎ",p===0?"2 % 整定時間":"±0.1 K に入る時間"];if(D)hd.push("外乱で最も下がる量");
      var hs=nar?rows.map(function(r){return r[0]+"<br>　"+hd.slice(1).map(function(h,i){return h+" "+r[i+1];}).join("、");}).join("<br>")+"<br>":U.tbl(hd,rows,["left","right","right","right","right"]);
      if(N==null)hs+='<span class="warn">理想の微分では、偏差の微分の山の高さは、計算の刻み '+_w10_g(h,2)+' s に反比例する（刻みを細かくするほど高い）。</span><br>';
      if(p===1)hs+="ヒータが出せるのは 0〜80 W。山がこれを超えると、実際にはそのとおりには出せない。<br>";
      ro.innerHTML=hs+'<div class="wnote">3 つとも同じ PID（極も同じ）で、違うのは目標値の通り道だけである。外乱を入れると、3 つの外乱への応答が同じことを確かめられる。刻み '+_w10_g(h,2)+' s の数値計算。値はどれも例の値。</div>';
    }
    run();
  };

  /* ===== 11 章 PID の調整と現場の問題 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w11_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w11_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w11_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* 1 区切り（dt 秒）ごとに新しい値になる観測ノイズ（標準偏差 sig）。U.rng の列なので、図（f11.py）と同じ値になる */
  function _w11_noise(U,seed,sig,tmax,dt){dt=dt||1;var nm=U.rng(seed),v=[],n=Math.floor(tmax/dt)+2;for(var i=0;i<n;i++)v.push(sig*nm.normal());
    return function(t){return v[Math.floor(t/dt+1e-9)];};}
  /* 標準形の PID（不完全微分）の伝達関数 [分子, 分母] */
  function _w11_pidtf(KP,TI,TD,N){N=N||10;if(!TI&&!TD)return [[KP],[1]];if(!TD)return [[KP*TI,KP],[TI,0]];var Tf=TD/N;
    if(!TI)return [[KP*(Tf+TD),KP],[Tf,1]];return [[KP*(TI*Tf+TI*TD),KP*(TI+Tf),KP],[TI*Tf,TI,0]];}
  /* 一巡伝達関数 P C（むだ時間つき）の tf */
  function _w11_loop(U,P,KP,TI,TD,N){var c=_w11_pidtf(KP,TI,TD,N);return U.ctl.tf(U.ctl.poly.mul(P.num,c[0]),U.ctl.poly.mul(P.den,c[1]),P.L||0);}

  /* 配列の最大・最小（Math.max.apply は要素が数十万あると呼び出しの上限を越えるので、ループで求める） */
  function _w11_amax(a){var m=-Infinity;for(var i=0;i<a.length;i++)if(a[i]>m)m=a[i];return m;}
  function _w11_amin(a){var m=Infinity;for(var i=0;i<a.length;i++)if(a[i]<m)m=a[i];return m;}
  /* 温度の板の刻みは、図（_f11_sim の 8 分割）と同じ細かさにした（h = 0.1 s では零次ホールドの遅れ h/2 で、行き過ぎ量や面積の最後の桁がずれる）。
     フィードバック系を刻み h = tEnd/n で計算する（図の _f11_sim と同じ計算。共通部品 simLoop と同じ約束で、
     対象は零次ホールドで離散化し、むだ時間は操作量（外乱を足したもの）を刻みの数だけ遅らせる）。simLoop に無い次のものを扱う:
     標準形の PID（P の分 K_P(b r − y)、I の分は積分の中にゲインを入れて足す、D の分は測った値の不完全微分を後退差分で）、
     飽和（umin・umax）、アンチワインドアップ（aw: "clamp"・"back"、時定数 Tt）、リレー（relay: [Δu, ε, u_0]）、
     始めに操作量 u0 で落ち着いた状態。返り値 {t, y, u（実際）, uc（計算した値）, I, e} */
  function _w11_sim(U,P,o){
    var n=o.n||20000,h=o.tEnd/n,ev=o.every||Math.max(1,Math.round(n/1000)),S=U.ctl.ss(U.ctl.tf(P.num,P.den)),N=S.A.length,dd=U.ctl.mat.c2d(S.A,S.B,h),i,j;
    var Ad=dd.A,Bd=dd.B.map(function(r){return r[0];}),Cp=S.C[0],nd=Math.round((P.L||0)/h),u0=o.u0||0,xp=new Float64Array(N),xn=new Float64Array(N);
    if(u0){var IA=[],rhs=[];for(i=0;i<N;i++){IA.push([]);for(j=0;j<N;j++)IA[i].push((i===j?1:0)-Ad[i][j]);rhs.push([Bd[i]*u0]);}
      var xs=U.ctl.mat.solve(IA,rhs);for(i=0;i<N;i++)xp[i]=xs[i][0];}
    var buf=new Float64Array(Math.max(1,nd));buf.fill(u0);var bi=0,ua=u0;
    var rf=typeof o.r==="function"?o.r:(function(v){return function(){return v;};})(o.r||0);
    var kp=o.KP||0,ti=o.TI||0,td=o.TD||0,Nf=o.N||10,b=o.b==null?1:o.b,I=o.I0!=null?o.I0:(ti?u0:0),Df=0,sp=null,rs=1;
    var out={t:[],y:[],u:[],uc:[],I:[],e:[],blow:false};
    for(var k=0;k<=n;k++){
      var t=k*h;if(nd)ua=buf[bi];
      var y=0;for(i=0;i<N;i++)y+=Cp[i]*xp[i];
      var ym=y+(o.noise?o.noise(t,k):0),rr=rf(t),e=rr-ym,uc,u;
      if(o.relay){var eR=Math.max(o.relay[1],1e-9);if(e>eR)rs=1;else if(e<-eR)rs=-1;uc=o.relay[2]+rs*o.relay[0];u=uc;}
      else{var Pp=kp*(b*rr-ym);
        if(td){var Tf=td/Nf,sig=-ym;if(sp===null)sp=sig;Df=Tf/(Tf+h)*Df+kp*td/(Tf+h)*(sig-sp);sp=sig;}else Df=0;
        uc=Pp+I+Df;u=uc;if(o.umax!=null&&u>o.umax)u=o.umax;if(o.umin!=null&&u<o.umin)u=o.umin;}
      if(k%ev===0){out.t.push(t);out.y.push(y);out.u.push(u);out.uc.push(uc);out.I.push(I);out.e.push(e);}
      if(!o.relay&&ti){var inc=kp*h/ti*e;
        if(o.aw==="clamp"&&((o.umax!=null&&uc>o.umax&&e>0)||(o.umin!=null&&uc<o.umin&&e<0)))inc=0;
        if(o.aw==="back"&&o.Tt)inc+=h/o.Tt*(u-uc);
        I+=inc;}
      var uin=u+(o.d?o.d(t):0);if(nd){buf[bi]=uin;bi=(bi+1)%nd;}else ua=uin;
      if(!isFinite(y)||Math.abs(y)>1e9){out.blow=true;break;}
      for(i=0;i<N;i++){var s=Bd[i]*ua;for(j=0;j<N;j++)s+=Ad[i][j]*xp[j];xn[i]=s;}var tmp=xp;xp=xn;xn=tmp;}
    return out;}
  /* y が lev を下から上へ横切る時刻（線形補間） */
  function _w11_upx(t,y,lev){var o=[];for(var i=1;i<y.length;i++)if(y[i-1]<lev&&y[i]>=lev)o.push(t[i-1]+(lev-y[i-1])/(y[i]-y[i-1])*(t[i]-t[i-1]));return o;}
  /* lev より上の山の番号 */
  function _w11_peaks(y,lev){var o=[];for(var i=1;i<y.length-1;i++)if(y[i]>y[i-1]&&y[i]>=y[i+1]&&y[i]>lev)o.push(i);return o;}
  /* ±band の外に最後にいた次の時刻（入った後は出ない時刻） */
  /* 2 % 整定時間など: 最後に帯の外にいた記録の点と次の点の間で、帯の端を横切る時刻を線形補間で求める（記録の間隔に丸めない） */
  function _w11_settle(t,y,yf,band){var last=-1;for(var i=0;i<y.length;i++)if(Math.abs(y[i]-yf)>band)last=i;if(last<0)return 0;if(last+1>=t.length)return null;
    var y0=y[last],y1=y[last+1],lv=y0>yf?yf+band:yf-band;return y1===y0?t[last+1]:t[last]+(lv-y0)/(y1-y0)*(t[last+1]-t[last]);}
  function _w11_trapz(t,f){var s=0;for(var i=1;i<t.length;i++)s+=0.5*(f[i]+f[i-1])*(t[i]-t[i-1]);return s;}
  /* 複素平面の枠（目盛つき）。返り値 {svg, P} */
  function _w11_cplane(U,x,y,w,h,xr,yr,xt,yt){var S=U.S,P=U.plot(x,y,w,h,xr,yr),s=[S.RECT(x,y,w,h,0,"var(--screen)","line",0.8)];
    xt.forEach(function(v){s.push(S.L(P.X(v),y,P.X(v),y+h,"grid",1));s.push(S.T(P.X(v),y+h+13,_w11_g(v,3),"middle",9,"muted"));});
    yt.forEach(function(v){s.push(S.L(x,P.Y(v),x+w,P.Y(v),"grid",1));s.push(S.T(x-5,P.Y(v)+3,_w11_g(v,3),"end",9,"muted"));});
    if(xr[0]<0&&xr[1]>0)s.push(S.L(P.X(0),y,P.X(0),y+h,"muted",1));if(yr[0]<0&&yr[1]>0)s.push(S.L(x,P.Y(0),x+w,P.Y(0),"muted",1));
    return {svg:s.join(""),P:P};}
  function _w11_m1(U,P){var S=U.S,xx=P.X(-1),yy=P.Y(0);return S.X(xx,yy,5,"alias",2.2)+S.T(xx,yy-9,"−1","middle",10,"alias",true,false,null,true);}
  /* 塗った面積（偏差の正・負）: 制御量 y と目標値 ref の間 */
  function _w11_area(U,P,t,y,ref,sgn,c){var S=U.S,o=[],run=[];
    function flush(){if(run.length>1){var q=[[P.X(run[0][0]),P.Y(ref)]];run.forEach(function(p){q.push([P.X(p[0]),P.Y(p[1])]);});q.push([P.X(run[run.length-1][0]),P.Y(ref)]);o.push(S.PL(q,"none",0,U.soft(c)));}run=[];}
    for(var i=0;i<t.length;i++){if(sgn*(ref-y[i])>0)run.push([t[i],y[i]]);else flush();}flush();return o.join("");}

  /* ---- 2 節: 限界感度法 — 持続振動を起こして表を当てる ---- */
  var _W11_ZN={
    plate:{nm:"温度の板",P:{num:[1.25],den:[500,1],L:20},Ku:31.93,Tu:78.74,ku:"W/K",kr:[5,60],tT:900,nT:576000,tC:800,nC:64000,d:-10,du:"W",yu:"K",xr:[-2.4,0.6],yr:[-1.8,0.6],wr:[1e-4,3],wd:[1e-4,0.25]},
    cart:{nm:"台車（遅れ 0.1 s）",P:{num:[1],den:[1,2],L:0.1},Ku:17.0,Tu:0.3721,ku:"N/(m/s)",kr:[2,30],tT:4,nT:20000,tC:3,nC:15000,d:-1,du:"N",yu:"m/s",xr:[-2.4,0.6],yr:[-1.8,0.6],wr:[0.1,1000],wd:[0.1,50]},
    mpos:{nm:"モータの位置",P:{num:[2e6],den:[1,2000,40000,0],L:0},Ku:40,Tu:0.0314159,ku:"V/rad",kr:[2,80],tT:0.3,nT:30000,tC:0.3,nC:30000,d:-1,du:"V",yu:"rad",xr:[-2.4,0.6],yr:[-1.8,0.6],wr:[0.5,1e5],wd:[0.5,1e4]}
  };
  function _w11_znset(Ku,Tu,k){return k===0?[0.5*Ku,0,0]:(k===1?[0.45*Ku,Tu/1.2,0]:[0.6*Ku,0.5*Tu,0.125*Tu]);}
  REG.w11_zn=function(el,U){
    var S=U.S,keys=["plate","cart","mpos"];
    U.head(el,"ZIEGLER–NICHOLS","限界感度法 — 比例制御だけで持続振動を起こし、限界ゲインと限界周期を読んで表を当てる");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板","台車（遅れ 0.1 s）","モータの位置（巻線のインダクタンスを含む）"],0,function(){var z=_W11_ZN[keys[obj.get()]];kp.set(z.Ku);draw();});
    var kp=U.slider(r1,"試験の比例ゲイン",{min:2,max:80,log:true,value:31.93,fmt:function(v){return _w11_g(v,3)+" "+_W11_ZN[keys[obj.get()]].ku;},onInput:draw});
    var tb=U.select(r1,"当てる表",["P","PI","PID"],2,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（温度の板・限界ゲイン 31.9 W/K）",function(){obj.set(0);kp.set(31.93);tb.set(2);draw();});
    U.button(br,"手前（0.8 倍）で読む",function(){var z=_W11_ZN[keys[obj.get()]];kp.set(0.8*z.Ku);draw();});
    U.button(br,"越えて（1.1 倍）読む",function(){var z=_W11_ZN[keys[obj.get()]];kp.set(1.1*z.Ku);draw();});
    U.button(br,"持続振動の比例ゲインを探す",function(){var z=_W11_ZN[keys[obj.get()]],lo=z.kr[0],hi=z.kr[1];
      for(var it=0;it<16;it++){var m=Math.sqrt(lo*hi),a=test(z,m);if(a.ratio==null||a.ratio<1)lo=m;else hi=m;}kp.set(Math.sqrt(lo*hi));draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* P だけの試験（共通部品 simLoop）。振れの比と周期を読む */
    function test(z,K){var G=U.ctl.tf(z.P.num,z.P.den,z.P.L),r=U.ctl.simLoop(G,U.ctl.tf([K],[1]),{tEnd:z.tT,n:z.nT,r:1,every:1});
      var P0=z.P.den[z.P.den.length-1]===0?null:z.P.num[z.P.num.length-1]/z.P.den[z.P.den.length-1],yf=P0==null?1:K*P0/(1+K*P0);
      var pk=_w11_peaks(r.y,yf),ux=_w11_upx(r.t,r.y,yf),ratio=null,per=null;
      if(r.blow){ratio=Infinity;}
      else if(pk.length>=4){var rs=[];for(var i=1;i<Math.min(pk.length-1,4);i++)rs.push((r.y[pk[i+1]]-yf)/(r.y[pk[i]]-yf));ratio=rs.reduce(function(a,b){return a+b;},0)/rs.length;}
      else if(pk.length>=2)ratio=(r.y[pk[1]]-yf)/(r.y[pk[0]]-yf);
      if(ux.length>=5)per=(ux[4]-ux[1])/3;else if(ux.length>=3)per=(ux[ux.length-1]-ux[1])/(ux.length-2);
      return {r:r,yf:yf,ratio:ratio,per:per};}
    function draw(){
      var z=_W11_ZN[keys[obj.get()]],K=kp.get(),kind=tb.get(),nar=_w11_nar(box),Wd=nar?400:700,o=[];
      var A=test(z,K);
      /* (a) 試験の応答 */
      var x0=nar?52:60,w1=nar?330:390,p=U.plot(x0,26,w1,110,[0,z.tT],[-1,3.2]);
      o.push(S.T(nar?10:14,14,"(a) 比例制御だけの試験（目標値を 1 上げる）","start",10.5,"ink",true));
      o.push(p.axes({xl:null,yl:"制御量",xt:U.nice(0,z.tT,4),yt:[0,1,2,3],xfmt:function(v){return _w11_g(v,3);},ylOff:34}));
      o.push(p.line([[0,1],[z.tT,1]],"muted",1,"5 3"));
      var st=Math.max(1,Math.round(A.r.t.length/700)),pts=[];for(var i=0;i<A.r.t.length;i+=st)pts.push([A.r.t[i],A.r.y[i]]);
      var cA=A.ratio==null?"green":(A.ratio>1.02?"alias":(A.ratio>0.98?"signal":"green"));
      o.push(p.clip(pts,cA,1.7));
      o.push(S.T(p.X(z.tT)-2,p.y+12,"時間 t [s]（0〜"+_w11_g(z.tT,3)+" s）","end",9,"muted",false,false,null,true));
      /* 読んだ値 → 表 */
      var Kr=K,Tr=A.per,g=Tr?_w11_znset(Kr,Tr,kind):null,gT=_w11_znset(z.Ku,z.Tu,kind);
      /* (b) ナイキスト線図 */
      var nx=nar?70:500,ny=nar?178:26,ns=nar?250:180,cp=_w11_cplane(U,nx,ny,ns,ns*(z.yr[1]-z.yr[0])/(z.xr[1]-z.xr[0]),z.xr,z.yr,[-2,-1,0],[-1,0]);
      o.push(S.T(nx,ny-12,"(b) 一巡伝達関数のナイキスト線図","start",10.5,"ink",true));o.push(cp.svg);var Pn=cp.P;
      var ws=U.ctl.logspace(Math.log10(z.wd[0]),Math.log10(z.wd[1]),1500),Gp=U.ctl.tf(z.P.num,z.P.den,z.P.L);
      var tpts=ws.map(function(w){var v=U.ctl.freq(Gp,w);return [K*v.re,K*v.im];});o.push(Pn.clip(tpts,"muted",1.3,"4 3"));
      if(g){var Lg=_w11_loop(U,z.P,g[0],g[1],g[2],10);o.push(Pn.clip(ws.map(function(w){var v=U.ctl.freq(Lg,w);return [v.re,v.im];}),"green",2));
        var wu=2*Math.PI/Tr,vv=U.ctl.freq(Lg,wu);if(vv.re>z.xr[0]&&vv.re<z.xr[1]&&vv.im>z.yr[0]&&vv.im<z.yr[1])o.push(S.D(Pn.X(vv.re),Pn.Y(vv.im),"green",4.2));}
      o.push(_w11_m1(U,Pn));
      var ly=ny+ns*(z.yr[1]-z.yr[0])/(z.xr[1]-z.xr[0])+30;
      o.push(S.LEGL(nx,ly,[["muted","4 3","試験の K_P P(jω)"]],9));o.push(S.LEGL(nx,ly+15,[["green",null,"表の値の P(jω)C(jω)"]],9));
      /* (c) 表の値で制御 */
      var cy=nar?ly+40:Math.max(ly+20,190),q=U.plot(x0,cy+14,nar?330:620,110,[0,z.tC],[-0.4,2.2]),cres=null;
      o.push(S.T(nar?10:14,cy,"(c) 読んだ値で表の "+["P","PI","PID"][kind]+" を当てる（目標値 +1、途中で外乱 "+_w11_g(z.d,3)+" "+z.du+"）","start",10.5,"ink",true));
      o.push(q.axes({xl:"時間 t [s]",yl:"制御量",xt:U.nice(0,z.tC,4),yt:[0,1,2],xfmt:function(v){return _w11_g(v,3);},ylOff:34}));
      o.push(q.line([[0,1],[z.tC,1]],"muted",1,"5 3"));
      if(g){cres=_w11_sim(U,z.P,{KP:g[0],TI:g[1],TD:g[2],N:10,tEnd:z.tC,n:z.nC,r:1,d:function(t){return t>=z.tC/2?z.d:0;},every:Math.max(1,Math.round(z.nC/800))});
        var bad=cres.blow||_w11_amax(cres.y.map(Math.abs))>4;
        o.push(q.clip(cres.t.map(function(t,i){return [t,cres.y[i]];}),bad?"alias":"green",1.9));}
      box.set(S.svg(Wd,cy+14+110+44,o));
      /* 読み出し */
      var hh="",ok='<span class="ok">',wr='<span class="warn">';
      if(A.ratio==null)hh+="試験: 振動しない（比例ゲインを上げる）<br>";
      else if(!isFinite(A.ratio))hh+="試験: "+wr+"振れが大きくなり続け、計算が発散した</span><br>";
      else hh+="試験（"+U.htx("K_P")+" = "+_w11_g(K,3)+" "+z.ku+"）: 振れは 1 往復ごとに <b>"+_w11_f(A.ratio,2)+" 倍</b>"+(A.per?"、周期 <b>"+_w11_g(A.per,4)+" s</b>":"")+
        (Math.abs(A.ratio-1)<0.02?" — "+ok+"持続振動</span>":(A.ratio<1?" — まだ減っている（限界はもっと上）":" — "+wr+"増えている（限界を越えた）</span>"))+"<br>";
      if(g){hh+="読んだ値 "+U.htx("K_u")+" = "+_w11_g(Kr,3)+" "+z.ku+"、"+U.htx("T_u")+" = "+_w11_g(Tr,4)+" s → 表の "+["P","PI","PID"][kind]+": "+U.htx("K_P")+" = "+_w11_g(g[0],3)+(g[1]?"、"+U.htx("T_I")+" = "+_w11_g(g[1],3)+" s":"")+(g[2]?"、"+U.htx("T_D")+" = "+_w11_g(g[2],3)+" s":"")+"<br>";
        var Lg2=_w11_loop(U,z.P,g[0],g[1],g[2],10),mg=U.ctl.margins(Lg2,z.wr[0],z.wr[1]),sm=U.ctl.smax(Lg2,z.wr[0],z.wr[1]);
        var unst=cres&&(cres.blow||_w11_amax(cres.y.map(Math.abs))>4);
        if(unst)hh+=wr+"表の値で制御すると不安定になる</span><br>";
        else{var mx=-1e9,nh=Math.floor(cres.t.length/2);for(var k2=0;k2<nh;k2++)mx=Math.max(mx,cres.y[k2]);
          var P0=z.P.den[z.P.den.length-1]===0?null:z.P.num[z.P.num.length-1]/z.P.den[z.P.den.length-1],yf=(g[1]||P0==null)?1:g[0]*P0/(1+g[0]*P0);
          hh+="その値で: 目標値への行き過ぎ量 <b>"+_w11_f(Math.max(0,(mx-yf)/yf*100),1)+" %</b>、位相余裕 "+(mg.pm!=null?_w11_f(mg.pm,1)+"°":"—")+"、ゲイン余裕 "+(mg.gmDb!=null?_w11_f(mg.gmDb,2)+" dB":"∞")+"、−1 の点との最短距離 "+_w11_f(sm.dist,2)+"<br>";}}
      else hh+="周期が読めないので、表を当てられない<br>";
      hh+="本当の限界（9 章）: "+U.htx("K_u")+" = "+_w11_g(z.Ku,3)+" "+z.ku+"、"+U.htx("T_u")+" = "+_w11_g(z.Tu,3)+" s → 表の "+["P","PI","PID"][kind]+": "+U.htx("K_P")+" = "+_w11_g(gT[0],3)+(gT[1]?"、"+U.htx("T_I")+" = "+_w11_g(gT[1],3)+" s":"")+(gT[2]?"、"+U.htx("T_D")+" = "+_w11_g(gT[2],3)+" s":"");
      ro.innerHTML=hh+'<div class="wnote">試験は共通部品 simLoop で計算した。表の値の PID は、N = 10 の不完全微分を測った値に掛けた。(b) の緑の点は、読んだ周期の角周波数での一巡伝達関数の値（表がその点を置く場所）。モータの位置では、限界周期が巻線の速い遅れで決まり、表の前提から外れる。</div>';
    }
    draw();
  };

  /* ---- 2 節: リレーの試験 ---- */
  var _W11_RL={
    plate:{nm:"温度の板",P:{num:[1.25],den:[500,1],L:20},r:35,u0:28,du:[2,28,20],eps:[0,1.5,0],nz:[0,0.1,0.3,0.5],nzDt:1,tEnd:1000,n:80000,tskip:300,Ku:31.93,Tu:78.74,ku:"W/K",uu:"W",yu:"K",off:25,yname:"温度 [°C]",xr:[-0.06,0.01],yr:[-0.035,0.02],ws:[-1.8,-0.5]},
    cart:{nm:"台車（遅れ 0.1 s）",P:{num:[1],den:[1,2],L:0.1},r:1,u0:2,du:[0.2,2,1],eps:[0,0.1,0],nz:[0,0.005,0.01,0.02],nzDt:0.01,tEnd:8,n:80000,tskip:2,Ku:17.0,Tu:0.3721,ku:"N/(m/s)",uu:"N",yu:"m/s",off:0,yname:"速度 [m/s]",xr:[-0.12,0.02],yr:[-0.07,0.04],ws:[0.6,1.8]}
  };
  REG.w11_relay=function(el,U){
    var S=U.S,keys=["plate","cart"],seed=11;
    U.head(el,"RELAY TEST","リレーの試験 — 決まった振れ幅で振動させて、限界周期と限界ゲインを読む");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板","台車（遅れ 0.1 s）"],0,function(){var z=_W11_RL[keys[obj.get()]];du.set(z.du[2]);ep.set(0);nz.set(0);draw();});
    var du=U.slider(r1,"リレーの振れ幅 Δu",{min:0.2,max:28,step:0.1,value:20,fmt:function(v){return _w11_g(v,3)+" "+_W11_RL[keys[obj.get()]].uu;},onInput:draw});
    var r2=U.ctrls(el);
    var ep=U.slider(r2,"しきい値の幅 ε",{min:0,max:1.5,step:0.01,value:0,fmt:function(v){return _w11_g(v,3)+" "+_W11_RL[keys[obj.get()]].yu;},onInput:draw});
    var nz=U.select(r2,"観測ノイズ（標準偏差）",["なし","小（板 0.1 K・台車 0.005 m/s）","中（板 0.3 K・台車 0.01 m/s）","大（板 0.5 K・台車 0.02 m/s）"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（温度の板・Δu = 20 W）",function(){obj.set(0);du.set(20);ep.set(0);nz.set(0);seed=11;draw();});
    U.button(br,"ノイズ 0.3 K・幅なし",function(){obj.set(0);du.set(20);ep.set(0);nz.set(2);seed=11;draw();});
    U.button(br,"ノイズ 0.3 K・Δu = 28 W・ε = 0.6 K（本文）",function(){obj.set(0);du.set(28);ep.set(0.6);nz.set(2);seed=11;draw();});
    U.button(br,"台車（Δu = 1 N）",function(){obj.set(1);du.set(1);ep.set(0);nz.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed=seed*7+3;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var z=_W11_RL[keys[obj.get()]],D=Math.min(Math.max(du.get(),z.du[0]),z.du[1]),E=Math.min(ep.get(),z.eps[1]),sg=z.nz[nz.get()];
      du.input.min=z.du[0];du.input.max=z.du[1];ep.input.max=z.eps[1];ep.input.step=z.eps[1]/150;
      var noise=sg>0?_w11_noise(U,seed,sg,z.tEnd+2,z.nzDt):null;
      var a=_w11_sim(U,z.P,{relay:[D,E,z.u0],tEnd:z.tEnd,n:z.n,r:z.r,u0:z.u0,noise:noise,every:1});
      var t=a.t,y=a.y,u=a.u,up=[],i;
      for(i=1;i<t.length;i++)if(t[i-1]>=z.tskip&&u[i]>z.u0&&u[i-1]<z.u0)up.push(i);
      var nar=_w11_nar(box),Wd=nar?400:700,o=[],res=null;
      if(up.length>=3){var T=(t[up[up.length-1]]-t[up[0]])/(up.length-1),ys=[],ts=[];
        for(i=up[0];i<up[up.length-1];i++){ys.push(y[i]);ts.push(t[i]);}
        var ym=ys.reduce(function(s,v){return s+v;},0)/ys.length,amp=(_w11_amax(ys)-_w11_amin(ys))/2,w=2*Math.PI/T,cs=0,sn=0;
        for(i=1;i<ts.length;i++){var dt=ts[i]-ts[i-1];cs+=0.5*dt*((ys[i]-ym)*Math.cos(w*ts[i])+(ys[i-1]-ym)*Math.cos(w*ts[i-1]));sn+=0.5*dt*((ys[i]-ym)*Math.sin(w*ts[i])+(ys[i-1]-ym)*Math.sin(w*ts[i-1]));}
        cs*=2/(ts[ts.length-1]-ts[0]);sn*=2/(ts[ts.length-1]-ts[0]);var a1=Math.hypot(cs,sn);
        var sw=0;for(i=up[0]+1;i<up[up.length-1];i++)if(u[i]!==u[i-1])sw++;
        res={T:T,a:amp,a1:a1,Ku:4*D/(Math.PI*amp),Ku1:4*D/(Math.PI*a1),ym:ym,cs:cs,sn:sn,w:w,t0:t[up[0]],sw:sw/(up.length-1)};}
      /* (a) 波形 */
      var x0=nar?52:60,w1=nar?330:400,t0=res?res.t0:z.tskip,t1=t0+(res?4*res.T:(z.tEnd-z.tskip)/4);
      if(t1>z.tEnd){t1=z.tEnd;}
      var pu=U.plot(x0,26,w1,70,[t0,t1],[z.u0-1.25*z.du[1],z.u0+1.25*z.du[1]]);
      o.push(S.T(nar?10:14,14,"(a) 操作量と制御量（破線は基本波）","start",10.5,"ink",true));
      o.push(pu.axes({xl:null,yl:"u ["+z.uu+"]",xt:[],yt:[z.u0-D,z.u0,z.u0+D].map(function(v){return +v.toFixed(3);}),xfmt:function(){return "";},ylOff:36}));
      var pts=[],m=[];for(i=0;i<t.length;i++)if(t[i]>=t0&&t[i]<=t1)m.push(i);
      var stp=Math.max(1,Math.round(m.length/900));for(i=0;i<m.length;i+=stp)pts.push([t[m[i]],u[m[i]]]);
      o.push(pu.line(pts,"gold",1.6));
      if(res){var fu=[];for(var k=0;k<=300;k++){var tt=t0+(t1-t0)*k/300;fu.push([tt,z.u0+4*D/Math.PI*Math.sin(res.w*(tt-res.t0))]);}o.push(pu.line(fu,"gold",1.1,"4 3"));}
      var lo=_w11_amin(m.map(function(j){return y[j];})),hi=_w11_amax(m.map(function(j){return y[j];})),pad=Math.max(0.05*(hi-lo),1e-6);
      var py=U.plot(x0,114,w1,90,[t0,t1],[z.off+lo-pad,z.off+hi+pad]);
      o.push(py.axes({xl:"時間 t [s]",yl:z.yname,xt:U.nice(t0,t1,4).filter(function(v){return v>=t0&&v<=t1;}),yt:U.nice(z.off+lo,z.off+hi,3),xfmt:function(v){return _w11_g(v,4);},yfmt:function(v){return _w11_g(v,4);},ylOff:40}));
      o.push(py.line([[t0,z.off+z.r],[t1,z.off+z.r]],"muted",1,"5 3"));
      pts=[];for(i=0;i<m.length;i+=stp)pts.push([t[m[i]],z.off+y[m[i]]]);o.push(py.line(pts,"signal",1.7));
      if(res){var fy=[];for(var k3=0;k3<=300;k3++){var t3=t0+(t1-t0)*k3/300;fy.push([t3,z.off+res.ym+res.sn*Math.sin(res.w*t3)+res.cs*Math.cos(res.w*t3)]);}o.push(py.line(fy,"signal",1.1,"4 3"));}
      /* (b) ナイキスト線図 */
      var nx=nar?70:520,ny=nar?262:26,nw=nar?260:160,nh=nw*(z.yr[1]-z.yr[0])/(z.xr[1]-z.xr[0]);
      var cp=_w11_cplane(U,nx,ny,nw,nh,z.xr,z.yr,[z.xr[0]<-0.1?-0.1:-0.04,z.xr[0]<-0.1?-0.05:-0.02,0],[]);o.push(cp.svg);var Pn=cp.P;
      o.push(S.T(nx,ny-12,"(b) 負の実軸の近く","start",10.5,"ink",true));
      var Gp=U.ctl.tf(z.P.num,z.P.den,z.P.L),ws=U.ctl.logspace(z.ws[0],z.ws[1],600);
      o.push(Pn.clip(ws.map(function(w){var v=U.ctl.freq(Gp,w);return [v.re,v.im];}),"signal",1.8));
      o.push(S.D(Pn.X(-1/z.Ku),Pn.Y(0),"signal",3.6));
      if(res){var xpk=-Math.PI*res.a/(4*D),xf=-Math.PI*res.a1/(4*D);
        if(xpk>z.xr[0])o.push(S.D(Pn.X(xpk),Pn.Y(0),"alias",3.6));if(xf>z.xr[0])o.push(S.D(Pn.X(xf),Pn.Y(0),"green",3));}
      var ly=ny+nh+30;
      o.push(S.D(nx+5,ly-4,"signal",3.6));o.push(S.TX(nx+14,ly,"本当の −1/K_u","start",9.5,"signal",true));o.push(S.D(nx+5,ly+12,"alias",3.6));o.push(S.TX(nx+14,ly+16,"山の高さから −πa/(4Δu)","start",9.5,"alias",true));o.push(S.D(nx+5,ly+28,"green",3));o.push(S.TX(nx+14,ly+32,"基本波から −πa_1/(4Δu)","start",9.5,"green",true));
      box.set(S.svg(Wd,Math.max(250,nar?ly+50:ly+50),o));
      /* 読み出し */
      var hh="";
      if(!res)hh+='<span class="warn">振動の周期が読めない（振れ幅が小さすぎるか、記録が短い）</span><br>';
      else{
        if(res.sw>2.5)hh+='<span class="warn">ノイズで細かく入れ切りしている（1 周期に '+_w11_f(res.sw,1)+" 回）: しきい値の幅 ε を広げる</span><br>";
        hh+="周期 "+U.htx("T_osc")+" = <b>"+_w11_g(res.T,4)+" s</b>（限界周期 "+_w11_g(z.Tu,3)+" s）、振れ幅: 山の高さ a = "+_w11_g(res.a,3)+" "+z.yu+"、基本波 "+U.htx("a_1")+" = "+_w11_g(res.a1,3)+" "+z.yu+"<br>";
        hh+="限界ゲイン: 山の高さから 4Δu/(πa) = <b>"+_w11_g(res.Ku,3)+"</b>、基本波から 4Δu/(π"+U.htx("a_1")+") = <b>"+_w11_g(res.Ku1,3)+"</b> "+z.ku+"（本当は "+_w11_g(z.Ku,3)+"）<br>";
        hh+="基本波から読んだ値で限界感度法の PI: "+U.htx("K_P")+" = "+_w11_g(0.45*res.Ku1,3)+" "+z.ku+"、"+U.htx("T_I")+" = "+_w11_g(res.T/1.2,3)+" s（本当の限界からは "+_w11_g(0.45*z.Ku,3)+"・"+_w11_g(z.Tu/1.2,3)+" s）";}
      ro.innerHTML=hh+'<div class="wnote">リレーは偏差が ε を越えたら u<sub>0</sub> + Δu、−ε を下回ったら u<sub>0</sub> − Δu を出す（u<sub>0</sub> は動作点を保つ操作量: 温度の板 28 W、台車 2 N）。始めの '+_w11_g(z.tskip,3)+' s を捨て、残りの整数の周期で、周期・山の高さと、8 章 6 節の方法（正弦波を掛けて平均）で基本波の振れ幅を求めた。観測ノイズは温度の板で 1 s ごと、台車で 0.01 s ごとに変わる。</div>';
    }
    draw();
  };

  /* ---- 3 節: IMC の λ ---- */
  var _W11_IM={
    plate:{nm:"温度の板",K:1.25,T:500,L:20,lam:[2,200],l0:20,tR:800,nR:64000,tD:5000,nD:400000,tDs:2000,d:-10,ku:"W/K",du:"W",yu:"K",wr:[1e-4,3]},
    cart:{nm:"台車（遅れ 0.1 s）",K:0.5,T:0.5,L:0.1,lam:[0.01,2],l0:0.1,tR:3,nR:15000,tD:8,nD:40000,tDs:4,d:-1,ku:"N/(m/s)",du:"N",yu:"m/s",wr:[0.03,3000]},
    mspd:{nm:"モータの速度",K:50,T:0.05,L:0,lam:[0.001,0.1],l0:0.01,tR:0.15,nR:15000,tD:0.6,nD:30000,tDs:0.3,d:-1,ku:"V/(rad/s)",du:"V",yu:"rad/s",wr:[1,3e4]}
  };
  REG.w11_imc=function(el,U){
    var S=U.S,keys=["plate","cart","mspd"];
    U.head(el,"IMC / λ","内部モデル制御から決める PI — λ で速さと余裕の釣り合いを選ぶ");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板","台車（遅れ 0.1 s）","モータの速度（むだ時間なし）"],0,function(){var z=_W11_IM[keys[obj.get()]];lam.set(z.l0);draw();});
    var lam=U.slider(r1,"λ（閉ループの時定数）",{min:0.001,max:200,log:true,value:20,fmt:function(v){return _w11_g(v,3)+" s";},onInput:draw});
    var tim=U.select(r1,"積分時間",["モデルの時定数 T","T と 4(λ + L) の小さいほう"],0,draw);
    var r2=U.ctrls(el);
    var lm=U.slider(r2,"本当のむだ時間",{values:[0.5,0.75,1,1.25,1.5,2,2.5,3,3.5],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:draw});
    var km=U.slider(r2,"本当の定常ゲイン",{values:[0.5,0.7,0.85,1,1.15,1.3,1.5,2],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:draw});
    var bw=U.slider(r2,"目標値の重み b",{values:[0,0.25,0.5,0.75,1],value:1,fmt:function(v){return String(v);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（温度の板・λ = 20 s・"+U.htx("T_I")+" = T）",function(){obj.set(0);lam.set(20);tim.set(0);lm.set(1);km.set(1);bw.set(1);draw();});
    U.button(br,U.htx("T_I")+" = 4(λ + L)（本文）",function(){obj.set(0);lam.set(20);tim.set(1);lm.set(1);km.set(1);bw.set(1);draw();});
    U.button(br,"さらに b = 0.5",function(){obj.set(0);lam.set(20);tim.set(1);lm.set(1);km.set(1);bw.set(0.5);draw();});
    U.button(br,"本当のむだ時間が 3 倍",function(){obj.set(0);lam.set(20);tim.set(0);lm.set(3);km.set(1);bw.set(1);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var z=_W11_IM[keys[obj.get()]],l=Math.min(Math.max(lam.get(),z.lam[0]),z.lam[1]),TI=tim.get()===1?Math.min(z.T,4*(l+z.L)):z.T,KP=z.T/(z.K*(l+z.L)),b=bw.get();
      lam.input.min=Math.log10(z.lam[0]);lam.input.max=Math.log10(z.lam[1]);
      lm.el.style.display=z.L>0?"":"none";
      var Lt=z.L*(z.L>0?lm.get():1),Kt=z.K*km.get(),Pt={num:[Kt],den:[z.T,1],L:Lt},Pm={num:[z.K],den:[z.T,1],L:z.L};
      var nar=_w11_nar(box),Wd=nar?400:700,o=[];
      /* 目標値 +1（自前の計算: 目標値の重みを扱う）と、外乱（共通部品 simLoop） */
      var a=_w11_sim(U,Pt,{KP:KP,TI:TI,b:b,tEnd:z.tR,n:z.nR,r:1,every:Math.max(1,Math.round(z.nR/800))});
      var Cpi=_w11_pidtf(KP,TI,0),Gt=U.ctl.tf(Pt.num,Pt.den,Pt.L),dr=U.ctl.simLoop(Gt,U.ctl.tf(Cpi[0],Cpi[1]),{tEnd:z.tD,n:z.nD,r:0,d:function(){return z.d;},every:1});
      var x0=nar?54:60,w1=nar?326:300;
      var p=U.plot(x0,26,w1,96,[0,z.tR],[-0.1,1.8]);
      o.push(S.T(nar?10:14,14,"(a) 目標値を 1 上げる","start",10.5,"ink",true));
      o.push(p.axes({xl:null,yl:"制御量",xt:U.nice(0,z.tR,4),yt:[0,1],xfmt:function(){return "";},ylOff:34}));
      o.push(p.line([[0,1],[z.tR,1]],"muted",1,"5 3"));
      var blow=a.blow||_w11_amax(a.y.map(Math.abs))>5;
      o.push(p.clip(a.t.map(function(t,i){return [t,a.y[i]];}),blow?"alias":"signal",1.9));
      var umx=Math.max(KP*b*1.2,KP*0.6,_w11_amax(a.u)*1.1),umn=Math.min(0,_w11_amin(a.u)*1.1);
      var q=U.plot(x0,140,w1,64,[0,z.tR],[umn,umx]);
      o.push(q.axes({xl:"時間 t [s]",yl:"u",xt:U.nice(0,z.tR,4),yt:U.nice(umn,umx,2),xfmt:function(v){return _w11_g(v,3);},yfmt:function(v){return _w11_g(v,3);},ylOff:34}));
      o.push(q.clip(a.t.map(function(t,i){return [t,a.u[i]];}),"gold",1.5));
      /* (b) 外乱 */
      var bx=nar?54:420,by=nar?262:26,bw2=nar?326:260;
      var mn=_w11_amin(dr.y),dmax=Math.max(Math.abs(mn)*1.15,1e-9),bl2=dr.blow||Math.abs(mn)>1e6;
      var pd=U.plot(bx,by,bw2,96,[0,z.tDs],[-dmax,0.35*dmax]);
      o.push(S.T(bx-(nar?44:6),by-12,"(b) 外乱 "+_w11_g(z.d,3)+" "+z.du+" への応答","start",10.5,"ink",true));
      o.push(pd.axes({xl:"時間 t [s]",yl:null,xt:U.nice(0,z.tDs,4),yt:U.nice(-dmax,0,2),xfmt:function(v){return _w11_g(v,3);},yfmt:function(v){return _w11_g(v,2);}}));
      var dsel=[];for(var i=0;i<dr.t.length;i+=Math.max(1,Math.round(dr.t.length/700)))if(dr.t[i]<=z.tDs)dsel.push(i);
      o.push(_w11_area(U,pd,dsel.map(function(j){return dr.t[j];}),dsel.map(function(j){return dr.y[j];}),0,1,"signal"));
      o.push(pd.clip(dsel.map(function(j){return [dr.t[j],dr.y[j]];}),bl2?"alias":"signal",1.8));
      /* (c) ボード線図（本当の対象との一巡伝達関数） */
      var Lt2=U.ctl.tf(U.ctl.poly.mul(Pt.num,Cpi[0]),U.ctl.poly.mul(Pt.den,Cpi[1]),Pt.L),wc=1/(l+z.L),wr=[wc/100,wc*30];
      var ws=U.ctl.logspace(Math.log10(wr[0]),Math.log10(wr[1]),500),B=U.ctl.bode(Lt2,ws),mg=U.ctl.margins(Lt2,z.wr[0],z.wr[1]),sm=U.ctl.smax(Lt2,z.wr[0],z.wr[1]);
      var cy=nar?396:170,bd=U.ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal"}],{x:nar?54:420,y:cy+12,w:nar?326:260,hm:70,hp:70,gap:22,wr:wr,dbr:[-40,40],phr:[-270,0]});
      o.push(S.T(nar?10:414,cy,"(c) 一巡伝達関数のボード線図","start",10.5,"ink",true));o.push(bd.svg);
      if(mg.wgc&&mg.wgc>=wr[0]&&mg.wgc<=wr[1]){o.push(S.L(bd.Pm.X(mg.wgc),bd.Pm.y,bd.Pm.X(mg.wgc),bd.Pp.y+bd.Pp.h,"green",1.1,"3 3"));
        if(mg.pm>0)o.push(S.ARR(bd.Pp.X(mg.wgc),bd.Pp.Y(-180),bd.Pp.X(mg.wgc),bd.Pp.Y(-180+mg.pm),"green",2,5));}
      if(mg.wpc&&mg.wpc>=wr[0]&&mg.wpc<=wr[1]){o.push(S.L(bd.Pm.X(mg.wpc),bd.Pm.y,bd.Pm.X(mg.wpc),bd.Pp.y+bd.Pp.h,"alias",1.1,"3 3"));
        if(mg.gmDb>0)o.push(S.ARR(bd.Pm.X(mg.wpc),bd.Pm.Y(-mg.gmDb),bd.Pm.X(mg.wpc),bd.Pm.Y(0),"alias",2,5));}
      box.set(S.svg(Wd,nar?cy+12+70+22+70+44:Math.max(cy+12+70+22+70+44,250),o));
      /* 読み出し */
      var hh="",unst=(mg.pm!=null&&mg.pm<=0)||blow||bl2;
      hh+="PI: "+U.htx("K_P")+" = T/{K(λ + L)} = <b>"+_w11_g(KP,3)+" "+z.ku+"</b>、"+U.htx("T_I")+" = <b>"+_w11_g(TI,3)+" s</b>（"+U.htx("K_I")+" = "+_w11_g(KP/TI,3)+"）<br>";
      if(z.L>0){var pmf=90-180/Math.PI*z.L/(l+z.L),gmf=Math.PI*(l+z.L)/(2*z.L);hh+="式（モデルどおり、"+U.htx("T_I")+" = T）: 位相余裕 "+_w11_f(pmf,1)+"°、ゲイン余裕 "+_w11_g(gmf,3)+" 倍、安定でいられるむだ時間 "+_w11_g(Math.PI/2*(l+z.L),3)+" s まで<br>";}
      else hh+="式（モデルどおり、"+U.htx("T_I")+" = T）: 一巡伝達関数は 1/(λs)、位相余裕 90°、ゲイン余裕 ∞<br>";
      hh+="本当の対象で: 位相余裕 <b>"+(mg.pm!=null?_w11_f(mg.pm,1)+"°":"—")+"</b>、ゲイン余裕 "+(mg.gmDb!=null?_w11_f(mg.gmDb,2)+" dB（"+_w11_g(mg.gm,3)+" 倍）":"∞")+"、−1 の点との最短距離 "+_w11_f(sm.dist,2)+"<br>";
      if(unst)hh+='<span class="warn">閉ループは不安定</span><br>';
      else{var mx=_w11_amax(a.y),ts=_w11_settle(a.t,a.y,1,0.02);
        hh+="目標値 +1: 行き過ぎ量 <b>"+_w11_f(Math.max(0,mx-1)*100,1)+" %</b>、2 % 整定時間 "+(ts!=null?_w11_g(ts,3)+" s":"記録の中で入らない")+"、始めの操作量 "+U.htx("bK_P")+" = "+_w11_g(b*KP,3)+"<br>";
        var iae=_w11_trapz(dr.t,dr.y.map(Math.abs));
        hh+="外乱 "+_w11_g(z.d,3)+" "+z.du+": 最大のずれ <b>"+_w11_g(-mn,3)+" "+z.yu+"</b>、IAE <b>"+_w11_g(iae,4)+"</b>（振れなければ式の |d|/"+U.htx("K_I")+" = "+_w11_g(Math.abs(z.d)*TI/KP,4)+"）";}
      ro.innerHTML=hh+'<div class="wnote">モデルは例の値（温度の板 1.25 K/W・500 s・20 s、台車 0.5 (m/s)/N・0.5 s・0.1 s、モータの速度 50 (rad/s)/V・0.05 s）。PI はモデルから決め、本当の対象のむだ時間と定常ゲインだけをずらした。外乱への応答は共通部品 simLoop で、目標値への応答は目標値の重みを扱う自前の計算（同じ離散化）で求めた。</div>';
    }
    draw();
  };

  /* ---- 4 節: 飽和とワインドアップ ---- */
  var _W11_WU={
    plate:{nm:"温度の板",P:{num:[1.25],den:[500,1],L:20},KP:10,TI:160,lim:[40,200],l0:80,sym:false,rr:[5,50],r0:35,tEnd:3000,tShow:1000,n:240000,Tt:[5,1000],t0:80,band:0.5,ru:"K",uu:"W",off:25,yname:"温度 [°C]",ku:"W/K"},
    mspd:{nm:"モータの速度",P:{num:[50],den:[0.05,1],L:0},KP:0.1,TI:0.05,lim:[6,24],l0:12,sym:true,rr:[100,600],r0:500,tEnd:0.5,tShow:0.5,n:25000,Tt:[0.002,0.2],t0:0.025,band:null,ru:"rad/s",uu:"V",off:0,yname:"角速度 [rad/s]",ku:"V/(rad/s)"},
    cart:{nm:"台車の速度",P:{num:[1],den:[1,2],L:0.1},KP:5,TI:0.5,lim:[2.5,10],l0:4,sym:true,rr:[0.5,2],r0:1,tEnd:4,tShow:3,n:40000,Tt:[0.02,2],t0:0.25,band:null,ru:"m/s",uu:"N",off:0,yname:"速度 [m/s]",ku:"N/(m/s)"}
  };
  REG.w11_windup=function(el,U){
    var S=U.S,keys=["plate","mspd","cart"];
    U.head(el,"WINDUP","飽和とワインドアップ — 張り付いている間の積分と、2 つの対策");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["温度の板（PI 10 W/K・160 s）","モータの速度（10 章の PI）","台車の速度（PI 5 N/(m/s)・0.5 s）"],0,function(){var z=_W11_WU[keys[obj.get()]];lim.set(z.l0);rr.set(z.r0);tt.set(z.t0);draw();});
    var aw=U.select(r1,"対策",["なし","クランプ（積分を止める）","バックカリキュレーション"],0,draw);
    var r2=U.ctrls(el);
    var lim=U.slider(r2,"操作量の上限",{min:2.5,max:200,log:true,value:80,fmt:function(v){var z=_W11_WU[keys[obj.get()]];return (z.sym?"±":"0〜")+_w11_g(v,3)+" "+z.uu;},onInput:draw});
    var rr=U.slider(r2,"目標値の変化",{min:0.5,max:600,log:true,value:35,fmt:function(v){return _w11_g(v,3)+" "+_W11_WU[keys[obj.get()]].ru;},onInput:draw});
    var tt=U.slider(r2,U.htx("T_t")+"（バックカリキュレーション）",{min:0.002,max:1000,log:true,value:80,fmt:function(v){return _w11_g(v,3)+" s";},onInput:draw});
    var br=U.btnrow(el);
    function setc(i,a){obj.set(i);var z=_W11_WU[keys[i]];lim.set(z.l0);rr.set(z.r0);tt.set(z.t0);aw.set(a);draw();}
    U.button(br,"本文の例（温度の板・対策なし）",function(){setc(0,0);});
    U.button(br,"クランプ",function(){setc(0,1);});
    U.button(br,"バックカリキュレーション（"+U.htx("T_t")+" = 80 s）",function(){setc(0,2);});
    U.button(br,"モータの速度 500 rad/s・対策なし",function(){setc(1,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var z=_W11_WU[keys[obj.get()]],L=Math.min(Math.max(lim.get(),z.lim[0]),z.lim[1]),R=Math.min(Math.max(rr.get(),z.rr[0]),z.rr[1]),Tt=Math.min(Math.max(tt.get(),z.Tt[0]),z.Tt[1]),A=aw.get();
      lim.input.min=Math.log10(z.lim[0]);lim.input.max=Math.log10(z.lim[1]);rr.input.min=Math.log10(z.rr[0]);rr.input.max=Math.log10(z.rr[1]);tt.input.min=Math.log10(z.Tt[0]);tt.input.max=Math.log10(z.Tt[1]);
      tt.el.style.display=A===2?"":"none";
      var umin=z.sym?-L:0,umax=L;
      var a=_w11_sim(U,z.P,{KP:z.KP,TI:z.TI,tEnd:z.tEnd,n:z.n,r:R,umin:umin,umax:umax,aw:["none","clamp","back"][A],Tt:Tt,every:1});
      var t=a.t,y=a.y,u=a.u,uc=a.uc,I=a.I,e=a.e,nar=_w11_nar(box),Wd=nar?400:700,o=[],i;
      var tS=z.tShow,stp=Math.max(1,Math.round(t.length*tS/z.tEnd/700)),sel=[];for(i=0;i<t.length&&t[i]<=tS+1e-9;i+=stp)sel.push(i);
      var x0=nar?56:62,w1=nar?324:610;
      var ymx=Math.max(R*1.05,_w11_amax(y)*1.05),p=U.plot(x0,26,w1,nar?110:120,[0,tS],[z.off,z.off+ymx]);
      o.push(S.T(nar?10:14,14,"(a) 制御量（塗った部分: 正と負の偏差の面積）","start",10.5,"ink",true));
      o.push(p.axes({xl:null,yl:z.yname,xt:U.nice(0,tS,5),yt:U.nice(z.off,z.off+ymx,4),xfmt:function(){return "";},yfmt:function(v){return _w11_g(v,4);},ylOff:40}));
      var ts=sel.map(function(j){return t[j];}),yy=sel.map(function(j){return z.off+y[j];});
      o.push(_w11_area(U,p,ts,yy,z.off+R,1,"signal"));o.push(_w11_area(U,p,ts,yy,z.off+R,-1,"alias"));
      o.push(p.line([[0,z.off+R],[tS,z.off+R]],"muted",1,"5 3"));
      o.push(p.line(sel.map(function(j){return [t[j],z.off+y[j]];}),"signal",2));
      /* (b) 操作量 */
      var ucm=_w11_amax(uc),ucn=_w11_amin(uc),q0=Math.min(umin,ucn,0),q1=Math.max(umax*1.3,Math.min(ucm,umax*5));
      var q=U.plot(x0,nar?168:178,w1,nar?90:100,[0,tS],[q0,q1]);
      o.push(S.T(nar?10:14,nar?158:168,"(b) 計算した操作量（破線）・実際の操作量（実線）・I の分（緑）","start",10.5,"ink",true));
      o.push(q.axes({xl:"時間 t [s]",yl:"["+z.uu+"]",xt:U.nice(0,tS,5),yt:U.nice(q0,q1,4),xfmt:function(v){return _w11_g(v,3);},yfmt:function(v){return _w11_g(v,3);},ylOff:40}));
      o.push(q.line([[0,umax],[tS,umax]],"alias",1,"4 3"));if(z.sym)o.push(q.line([[0,umin],[tS,umin]],"alias",1,"4 3"));
      o.push(q.clip(sel.map(function(j){return [t[j],uc[j]];}),"gold",1.3,"5 3"));
      o.push(q.line(sel.map(function(j){return [t[j],u[j]];}),"gold",2));
      o.push(q.clip(sel.map(function(j){return [t[j],I[j]];}),"green",1.6));
      box.set(S.svg(Wd,(nar?168:178)+(nar?90:100)+44,o));
      /* 読み出し */
      var mx=_w11_amax(y),ep=0,en=0;for(i=1;i<t.length;i++){var h2=t[i]-t[i-1],e0=e[i-1],e1=e[i];ep+=0.5*h2*(Math.max(e0,0)+Math.max(e1,0));en+=0.5*h2*(Math.max(-e0,0)+Math.max(-e1,0));}
      var band=z.band||0.02*R,st=_w11_settle(t,y,R,band),satHi=-1,satLo=-1;for(i=0;i<u.length;i++){if(u[i]>=umax-1e-9)satHi=t[i];if(u[i]<=umin+1e-9&&t[i]>0)satLo=t[i];}
      var KI=z.KP/z.TI,need=I[I.length-1]-I[0],hh="";
      hh+="最高 <b>"+_w11_g(z.off+mx,4)+" "+(z.off?"°C":z.ru)+"</b>"+(mx>R+band?'（<span class="warn">行き過ぎ '+_w11_g(mx-R,3)+" "+z.ru+"</span>）":"（行き過ぎなし）")+"、±"+_w11_g(band,3)+" "+z.ru+" に入るのは <b>"+(st!=null?_w11_g(st,4)+" s":"記録の中で入らない")+"</b><br>";
      hh+="上限に張り付くのは "+(satHi>=0?"<b>"+_w11_g(satHi,4)+" s まで</b>":"なし")+(satLo>=0?"（下限には "+_w11_g(satLo,4)+" s まで）":"")+"、I の分の最大 "+_w11_g(_w11_amax(I),4)+" "+z.uu+"<br>";
      hh+="偏差の面積: 正 "+_w11_g(ep,4)+"、負 "+_w11_g(en,4)+"、差 <b>"+_w11_g(ep-en,4)+"</b> "+z.ru+"·s"+(A===0?"（対策なしでは、I の分の始めと終わりの差 ÷ "+U.htx("K_I")+" = "+_w11_g(need/KI,4)+" と一致する）":"（対策ありでは、張り付いている間の面積は積分されないので一致しない）");
      ro.innerHTML=hh+'<div class="wnote">PI は本文の値（温度の板は 3 節の λ = 20 s、モータの速度は 10 章 5 節、台車は λ = 0.1 s の IMC）。微分は使わない。クランプは、計算した操作量が範囲の外で、積分するとさらに外へ向かう間は積分を止める。バックカリキュレーションは (u − u<sub>c</sub>)/T<sub>t</sub> を積分に足す。どれも始めは止まった状態（I の分 0）から目標値を変える。</div>';
    }
    draw();
  };

  /* ===== 12 章 根軌跡 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w12_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w12_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w12_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=v.toExponential(1);return s.replace(/^-/,"−");}
  /* 有効数字 d 桁（末尾の 0 を残す。例 −3.20） */
  function _w12_p3(v,d){d=d||3;if(Math.abs(v)<1e-9)return "0";var s=(+v).toPrecision(d);if(s.indexOf("e")>=0)return _w12_sig(v,d);return s.replace(/^-/,"−");}
  /* 極の文字。共役な組は「a ± jb」にまとめる（虚部が負のものは省く） */
  function _w12_plist(rs,d){var out=[];rs.forEach(function(z){var tol=1e-6*(1+Math.abs(z.re)+Math.abs(z.im));
    if(Math.abs(z.im)<=tol)out.push(_w12_p3(z.re,d||3));else if(z.im>0)out.push((Math.abs(z.re)<1e-6*(1+Math.abs(z.im))?"":_w12_p3(z.re,d||3)+" ")+"± <i>j</i>"+_w12_p3(z.im,d||3));});return out.join("、");}
  /* K_c の刻み: 0 と 10^lo〜10^hi を対数の目盛で等しく（1 桁を per 等分）。extra の値も入れる */
  function _w12_kgrid(lo,hi,per,extra){var n=Math.max(2,Math.round((hi-lo)*per)),ks=[0];for(var i=0;i<=n;i++)ks.push(Math.pow(10,lo+(hi-lo)*i/n));
    (extra||[]).forEach(function(e){if(e>0)ks.push(e);});ks.sort(function(x,y){return x-y;});return ks;}
  /* a(s) + K b(s) = 0 の根を Ks の各 K で求め、1 つ前の K の根に近い根を同じ枝につなぐ（本文 1 節の方法）。返り値 R[枝][K の番号] = {re, im} */
  function _w12_track(U,a,b,Ks){var P=U.ctl.poly,R=null,prev=null;
    Ks.forEach(function(K){var r=P.roots(P.add(a,P.scale(b,K)));
      if(!R){R=r.map(function(z){return [z];});prev=r;return;}
      if(r.length!==prev.length)return;
      var n=r.length,pairs=[],ui={},uj={},asg=[],cnt=0,i,j;
      for(i=0;i<n;i++)for(j=0;j<n;j++)pairs.push([Math.hypot(prev[i].re-r[j].re,prev[i].im-r[j].im),i,j]);
      pairs.sort(function(x,y){return x[0]-y[0];});
      for(var k=0;k<pairs.length&&cnt<n;k++){var q=pairs[k];if(ui[q[1]]||uj[q[2]])continue;ui[q[1]]=1;uj[q[2]]=1;asg[q[1]]=r[q[2]];cnt++;}
      for(i=0;i<n;i++)R[i].push(asg[i]);prev=asg;});
    return R||[];}
  /* 枝をすべて描く（枠の外は切る） */
  function _w12_br(P,R,c,lw,dash){return R.map(function(br){return P.clip(br.map(function(z){return [z.re,z.im];}),c,lw,dash);}).join("");}
  /* s 平面の地 */
  function _w12_sp(U,S,P,xt,yt,lab,zeta){return S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8)+U.ctl.splane(P,{zeta:zeta})+P.axes({xl:lab===false?null:"実部 σ [1/s]",yl:lab===false?null:"虚部 ω [rad/s]",xt:xt,yt:yt,xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,3);},ylOff:36,sz:9})+U.ctl.splane(P,{rhp:false});}
  function _w12_in(P,z){return z.re>=P.xr[0]&&z.re<=P.xr[1]&&z.im>=P.yr[0]&&z.im<=P.yr[1];}
  /* 開ループの極と零点・漸近線・分岐点（本文 2 節の性質）。a は分母（最も高い次の係数 1）、b は分子 */
  function _w12_props(U,a,b){var P=U.ctl.poly,ps=P.roots(a),zs=P.trim(b.slice()).length>1?P.roots(b):[],n=ps.length,m=zs.length,sp=0,sz=0,q;
    ps.forEach(function(p){sp+=p.re;});zs.forEach(function(z){sz+=z.re;});
    var o={ps:ps,zs:zs,n:n,m:m,sa:n>m?(sp-sz)/(n-m):null,angs:[],sump:sp};
    for(q=0;q<n-m;q++)o.angs.push(180*(2*q+1)/(n-m));
    var d=P.sub(P.mul(P.deriv(a),b),P.mul(a,P.deriv(b))),br=[];
    if(P.trim(d).length>1)P.roots(d).forEach(function(r){if(Math.abs(r.im)<1e-6*(1+Math.abs(r.re))){var K=-P.val(a,r.re)/P.val(b,r.re);if(K>0&&isFinite(K))br.push({s:r.re,K:K});}});
    o.br=br;
    /* 実軸の上の部分: 右にある実数の極と零点の数が奇数の区間 */
    var xs=[];ps.concat(zs).forEach(function(z){if(Math.abs(z.im)<1e-7*(1+Math.abs(z.re)))xs.push(z.re);});xs.sort(function(x,y){return y-x;});
    o.seg=[];for(q=0;q<xs.length;q+=2)o.seg.push([q+1<xs.length?xs[q+1]:-Infinity,xs[q]]);
    return o;}
  /* 性質を描く: 実軸の上の部分（金の太線）・漸近線（金の破線）・分岐点（金の点） */
  function _w12_drawProps(S,P,pr){var o=[],L=10*Math.max(P.xr[1]-P.xr[0],P.yr[1]-P.yr[0]);
    pr.seg.forEach(function(sg){var x0=Math.max(P.xr[0],sg[0]),x1=Math.min(P.xr[1],sg[1]);if(x1>x0)o.push(S.L(P.X(x0),P.Y(0),P.X(x1),P.Y(0),"gold",5));});
    if(pr.sa!==null&&pr.n-pr.m>=2){pr.angs.forEach(function(an){var r=an*Math.PI/180;o.push(P.clip([[pr.sa,0],[pr.sa+L*Math.cos(r),L*Math.sin(r)]],"gold",1.4,"6 4"));});
      if(pr.sa>=P.xr[0]&&pr.sa<=P.xr[1])o.push(S.D(P.X(pr.sa),P.Y(0),"gold",4));}
    pr.br.forEach(function(b){if(b.s>=P.xr[0]&&b.s<=P.xr[1])o.push(S.CIRC(P.X(b.s),P.Y(0),5.5,"gold",2));});
    return o.join("");}
  /* 単位ステップ応答と、行き過ぎ量 [%]・2 % 整定時間 */
  function _w12_resp(U,num,den,tEnd,n){return U.ctl.step(U.ctl.tf(num,den),tEnd,n||600);}
  function _w12_info(t,y,yf){var im=0,last=-1;for(var i=0;i<y.length;i++){if(y[i]>y[im])im=i;if(Math.abs(y[i]-yf)>0.02*Math.abs(yf))last=i;}
    return {Mp:Math.max(0,(y[im]-yf)/yf*100),t2:last<0?0:(last>=y.length-1?Infinity:t[last+1])};}
  /* 根の組の中で虚軸に最も近いもの（支配極）の減衰比と固有角周波数 */
  function _w12_dom(rs){var best=null;rs.forEach(function(z){if(z.im<-1e-9)return;if(!best||z.re>best.re)best=z;});
    if(!best)return null;var wn=Math.hypot(best.re,best.im);return {z:best,wn:wn,zeta:wn>0?-best.re/wn:1};}
  function _w12_unstable(rs){return rs.some(function(z){return z.re>1e-9;});}
  function _w12_axis(rs){return rs.some(function(z){return Math.abs(z.re)<=1e-6*(1+Math.abs(z.im));});}
  /* 円弧（中心 (cx, cy)、半径 r、角度は度で正の実軸から反時計回り） */
  function _w12_arc(S,cx,cy,r,a0,a1,c,lw){var x0=cx+r*Math.cos(a0*Math.PI/180),y0=cy-r*Math.sin(a0*Math.PI/180),x1=cx+r*Math.cos(a1*Math.PI/180),y1=cy-r*Math.sin(a1*Math.PI/180);
    return S.PATH("M"+x0.toFixed(2)+","+y0.toFixed(2)+" A"+r+","+r+" 0 "+(Math.abs(a1-a0)>180?1:0)+" "+(a1>a0?0:1)+" "+x1.toFixed(2)+","+y1.toFixed(2),c,lw||1.3);}
  /* 漸近線の角度の文字（180° はそのまま、ほかは ±） */
  function _w12_angtxt(a){var w=_w12_wrap(a);return (Math.abs(Math.abs(w)-180)<1e-9?"180":(w>0?"+":"")+_w12_f(w,0))+"°";}
  /* 角度を [−180, 180) にそろえる（−180° は負の側で表す） */
  function _w12_wrap(a){while(a>=180)a-=360;while(a<-180)a+=360;return a;}

  /* ---- 2 節: 角度の条件と大きさの条件を、点を動かして確かめる ---- */
  REG.w12_angle=function(el,U){
    var S=U.S,TD=0.02/0.84;
    var EX=[{name:"モータの位置（比例）",a:[1,20,0],b:[1000],xr:[-30,10],yr:[-20,20],xt:[-30,-20,-10,0,10],yt:[-20,-10,0,10,20],pt:{re:-10,im:10.49},unit:"V/rad"},
            {name:"PD のモータの位置（零点 −42）",a:[1,20,0],b:[1000*TD,1000],xr:[-110,10],yr:[-45,45],xt:[-100,-80,-60,-40,-20,0],yt:[-40,-20,0,20,40],pt:{re:-20,im:20.98},unit:"V/rad"},
            {name:"台車とばね・ダンパ＋装置の遅れ（3 次）",a:[1,12,45,250],b:[10],xr:[-16,6],yr:[-11,11],xt:[-15,-10,-5,0,5],yt:[-10,-5,0,5,10],pt:{re:-4,im:4},unit:"N/m"},
            {name:"PI のモータの位置（積分時間 0.42 s）",a:[1,20,0,0],b:[1000,1000/0.42],xr:[-22,4],yr:[-14,14],xt:[-20,-15,-10,-5,0],yt:[-10,-5,0,5,10],pt:{re:-8.4,im:9.26},unit:"V/rad"}];
    var COLS=["teal","purple","gold","green","signal","alias"];
    U.head(el,"ANGLE","角度の条件と大きさの条件 — 点を動かして確かめる");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",EX.map(function(e){return e.name;}),0,function(){reset();});
    var cl=U.checkbox(r1,"根軌跡を重ねる",true,function(){draw();});
    var cp=U.checkbox(r1,"性質を重ねる（実軸の上の部分・漸近線・分岐点）",false,function(){draw();});
    var r2=U.ctrls(el);
    var sre=U.slider(r2,"点の実部 σ",{min:-30,max:10,step:0.01,value:-10,fmt:function(v){return _w12_f(v,2)+" /s";},onInput:function(v){pt.re=v;draw();}});
    var sim=U.slider(r2,"点の虚部 ω",{min:-20,max:20,step:0.01,value:10.49,fmt:function(v){return _w12_f(v,2)+" rad/s";},onInput:function(v){pt.im=v;draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の点",function(){var E=EX[ex.get()];pt={re:E.pt.re,im:E.pt.im};syncS();draw();});
    U.button(br,"根軌跡の上へ寄せる",function(){snap();draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,pt={re:-10,im:10.49},cache={i:-1};
    function locus(){var i=ex.get();if(cache.i!==i){var E=EX[i];cache={i:i,R:_w12_track(U,E.a,E.b,_w12_kgrid(-5,5,60)),pr:_w12_props(U,E.a,E.b)};}return cache;}
    function syncS(){var E=EX[ex.get()];sre.input.min=E.xr[0];sre.input.max=E.xr[1];sim.input.min=E.yr[0];sim.input.max=E.yr[1];
      sre.input.step=(E.xr[1]-E.xr[0])/4000;sim.input.step=(E.yr[1]-E.yr[0])/4000;sre.set(pt.re);sim.set(pt.im);}
    function reset(){var E=EX[ex.get()];pt={re:E.pt.re,im:E.pt.im};syncS();draw();}
    function snap(){var C=locus(),best=null,bd=Infinity;C.R.forEach(function(brn){brn.forEach(function(z){var d=Math.hypot((z.re-pt.re)/(PP?PP.xr[1]-PP.xr[0]:1),(z.im-pt.im)/(PP?PP.yr[1]-PP.yr[0]:1));if(d<bd&&Math.abs(z.im)>1e-9){bd=d;best=z;}});});
      if(best){pt={re:best.re,im:best.im};syncS();}}
    U.ctl.drag(box,function(type,x,y){if(type==="up"||x==null||!PP)return;
      if(type==="down"&&(x<PP.x||x>PP.x+PP.w||y<PP.y||y>PP.y+PP.h))return false;
      pt={re:Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),im:Math.max(PP.yr[0],Math.min(PP.yr[1],PP.uy(y)))};syncS();draw();});
    function draw(){
      var E=EX[ex.get()],C=locus(),pr=C.pr,nar=_w12_nar(box),Wd=nar?400:700,o=[];
      var pw=nar?330:380,ph=Math.max(200,Math.min(320,pw*(E.yr[1]-E.yr[0])/(E.xr[1]-E.xr[0])));
      var P=U.plot(nar?52:56,20,pw,ph,E.xr,E.yr);PP=P;
      o.push(_w12_sp(U,S,P,E.xt,E.yt));
      if(cp.get())o.push(_w12_drawProps(S,P,pr));
      if(cl.get())o.push(_w12_br(P,C.R,"signal",1.6));
      /* 矢印と角度 */
      var els=[],sum=0,lp=1,lz=1;
      pr.zs.forEach(function(z){els.push({z:z,k:"z"});});pr.ps.forEach(function(p){els.push({z:p,k:"p"});});
      els.forEach(function(e,i){var dx=pt.re-e.z.re,dy=pt.im-e.z.im,ang=Math.atan2(dy,dx)*180/Math.PI,len=Math.hypot(dx,dy);e.ang=ang;e.len=len;e.c=COLS[i%COLS.length];
        if(e.k==="z"){sum+=ang;lz*=len;}else{sum-=ang;lp*=len;}
        var x0=P.X(e.z.re),y0=P.Y(e.z.im);
        o.push(S.L(x0,y0,x0+22,y0,e.c,1,"3 2"));
        if(len>1e-9){o.push(_w12_arc(S,x0,y0,13+3*(i%3),0,ang,e.c,1.3));o.push(S.ARR(x0,y0,P.X(pt.re),P.Y(pt.im),e.c,1.5,6));}});
      o.push(U.ctl.pz(P,pr.ps,pr.zs,"muted",5.5));
      var lhs=_w12_wrap(sum),dev=180-Math.abs(lhs),on=Math.abs(dev)<1.0;if(Math.abs(dev)<0.05)lhs=-180;
      var beta=U.ctl.poly.trim(E.b.slice())[0],Kc=lp/(beta*lz);
      o.push(S.CIRC(P.X(pt.re),P.Y(pt.im),7,on?"green":"alias",2.4,"screen"));
      o.push(S.D(P.X(pt.re),P.Y(pt.im),on?"green":"alias",3));
      o.push(S.T(P.x+P.w,P.y-6,"点をドラッグ（つまみでも動く）","end",9,"muted"));
      /* 角度の針 */
      var cx=nar?200:575,cy=nar?20+ph+150:130,R0=70;
      o.push(S.T(cx,cy-R0-22,"角度の条件の左辺","middle",10,"ink",true));
      o.push(S.CIRC(cx,cy,R0,"line",1.2,"screen"));
      o.push(S.L(cx-R0-8,cy,cx+R0+8,cy,"faint",1));o.push(S.L(cx,cy-R0-6,cx,cy+R0+6,"faint",1));
      o.push(S.L(cx,cy,cx-R0,cy,"green",4));
      o.push(S.T(cx-R0-6,cy-8,"±180°","end",9.5,"green",true));
      o.push(S.T(cx+R0+6,cy+4,"0°","start",9.5,"muted"));
      var rad=lhs*Math.PI/180,nc=on?"green":"alias";
      o.push(S.ARR(cx,cy,cx+(R0-6)*Math.cos(rad),cy-(R0-6)*Math.sin(rad),nc,2.6,9));
      o.push(S.D(cx,cy,"ink",3));
      o.push(S.T(cx,cy+R0+22,"左辺 = "+_w12_f(lhs,1)+"°","middle",11,nc,true));
      o.push(S.T(cx,cy+R0+38,on?"真左を向く: 根軌跡の上":"真左を向かない: 根軌跡の上に無い","middle",9.5,nc,true));
      var H=nar?cy+R0+50:Math.max(20+ph+46,cy+R0+50);
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var rows=els.map(function(e){return [(e.k==="p"?"極 ":"零点 ")+_w12_plist([e.z]).replace(" ± ","+"),'<span style="color:'+U.col(e.c)+'">■</span> '+_w12_f(e.ang,1)+"°",_w12_sig(e.len,4)];});
      var h=U.tbl(["開ループの極・零点","矢印の角度","矢印の長さ"],rows,["left","right","right"]);
      h+="点 s = "+_w12_f(pt.re,2)+(pt.im>=0?" + ":" − ")+"j"+_w12_f(Math.abs(pt.im),2)+"　左辺（零点の角度の和 − 極の角度の和）= "+_w12_f(lhs,1)+"°（180° の奇数倍とのずれ "+_w12_f(Math.abs(dev),1)+"°）<br>";
      h+="大きさの条件: K<sub>c</sub> = 極からの長さの積 ÷ (β × 零点からの長さの積) = "+_w12_sig(lp,4)+" ÷ ("+_w12_sig(beta,4)+(pr.m?" × "+_w12_sig(lz,4):"")+") = <b>"+_w12_sig(Kc,4)+" "+E.unit+"</b><br>";
      if(on){var rs=U.ctl.poly.roots(U.ctl.poly.add(E.a,U.ctl.poly.scale(E.b,Kc)));h+='<span class="ok">根軌跡の上にある。</span>この K<sub>c</sub> の閉ループの極: '+_w12_plist(rs)+"（点 s を含む）";}
      else h+='<span class="warn">角度の条件を満たさない。</span>どの K<sub>c</sub>（正）でも、この点は閉ループの極にならない（上の K<sub>c</sub> は、根軌跡の上の点でだけ意味がある）';
      ro.innerHTML=h+'<div class="wnote">角度は正の実軸から反時計回りに測る。根軌跡（青）は、K<sub>c</sub> を 10<sup>−5</sup>〜10<sup>5</sup> の対数の目盛で細かく変えて根を求め、1 つ前の根に近い根をつないだもの。「性質を重ねる」の金の太線は実軸の上の部分、破線は漸近線、金の丸は分岐点（本文 2 節の式で求めた値）。</div>';
    }
    reset();
  };

  /* ---- 3 節: K_c を動かすと閉ループの極が根軌跡の上を動き、応答が変わる ---- */
  REG.w12_locus=function(el,U){
    var S=U.S;
    var EX=[
      {name:"一次遅れ 2 つ（L_a を含むモータの角速度）",a:[1,2000,40000],b:[2e6],views:[{xr:[-2200,200],yr:[-1600,1600],xt:[-2000,-1000,0],yt:[-1000,0,1000]}],
       kr:[0.001,10],k0:0.1,unit:"V/(rad/s)",tEnd:0.04,yl:"角速度 [rad/s]",marks:[[0.48,"分岐点 −1000"]]},
      {name:"積分＋一次遅れ（モータの位置）",a:[1,20,0],b:[1000],views:[{xr:[-30,10],yr:[-40,40],xt:[-30,-20,-10,0,10],yt:[-40,-20,0,20,40]},{xr:[-30,10],yr:[-110,110],xt:[-30,-20,-10,0,10],yt:[-100,-50,0,50,100]}],
       kr:[0.001,10],k0:0.21,unit:"V/rad",tEnd:0.6,yl:"角度 [rad]",marks:[[0.1,"分岐点 −10"],[0.21,"ζ = 0.690"]]},
      {name:"二次遅れ（台車とばね・ダンパの位置）",a:[1,2,25],b:[1],views:[{xr:[-8,4],yr:[-20,20],xt:[-8,-4,0,4],yt:[-20,-10,0,10,20]}],
       kr:[0.1,1000],k0:25,unit:"N/m",tEnd:6,yl:"位置 [m]",marks:[]},
      {name:"3 次（L_a を含むモータの位置）",a:[1,2000,40000,0],b:[2e6],views:[{xr:[-40,20],yr:[-260,260],xt:[-40,-20,0,20],yt:[-200,-100,0,100,200]},{xr:[-2600,600],yr:[-1600,1600],xt:[-2000,-1000,0],yt:[-1000,0,1000]}],
       kr:[0.001,100],k0:0.21,unit:"V/rad",tEnd:0.6,yl:"角度 [rad]",marks:[[0.1005,"分岐点 −10.08"],[0.21,"本文の例"],[10,"10 V/rad"],[40,"虚軸 ±j200"]]},
      {name:"3 次（力を出す装置の遅れのある台車）",a:[1,12,45,250],b:[10],views:[{xr:[-16,6],yr:[-11,11],xt:[-15,-10,-5,0,5],yt:[-10,-5,0,5,10]}],
       kr:[0.1,100],k0:10,unit:"N/m",tEnd:8,yl:"位置 [m]",marks:[[29,"虚軸 ±j6.71"]]}];
    U.head(el,"ROOT LOCUS","根軌跡の上を動く閉ループの極と、目標値のステップ応答");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例",EX.map(function(e){return e.name;}),1,function(){stop();setEx();});
    var vw=U.select(r1,"表示の範囲",["原点の近く","広く"],0,function(){draw();});
    var cp=U.checkbox(r1,"性質を重ねる（実軸の上の部分・漸近線・分岐点）",false,function(){draw();});
    var r2=U.ctrls(el);
    var kc=U.slider(r2,"K<sub>c</sub>",{min:0.001,max:1000,log:true,value:0.21,fmt:function(v){return _w12_sig(v,3)+" "+EX[ex.get()].unit;},onInput:function(){stop();draw();}});
    var br=U.btnrow(el),mb=U.btnrow(el);
    var tk=U.ticker(function(){var E=EX[ex.get()],lk=Math.log10(kc.get())+(Math.log10(E.kr[1])-Math.log10(E.kr[0]))/150;
      if(lk>=Math.log10(E.kr[1])){kc.set(E.kr[1]);stop();}else kc.set(+Math.pow(10,lk).toPrecision(4));draw();},60);
    var bplay=U.button(br,"再生（K<sub>c</sub> を小さい値から上げる）",function(){var E=EX[ex.get()];if(kc.get()>=E.kr[1]*0.999)kc.set(E.kr[0]);tk.start();});
    U.button(br,"停止",function(){stop();});
    U.button(br,"本文の例",function(){stop();kc.set(EX[ex.get()].k0);draw();});
    function stop(){tk.stop();}
    var box=U.svgbox(el),ro=U.readout(el),cache={i:-1};
    function setEx(){var E=EX[ex.get()];kc.set(E.k0);
      mb.innerHTML="";E.marks.forEach(function(m){U.button(mb,m[1]+"（"+_w12_sig(m[0],4)+"）",function(){stop();kc.set(m[0]);draw();});});
      vw.el.style.display=E.views.length>1?"":"none";if(E.views.length<2)vw.set(0);draw();}
    function data(){var i=ex.get();if(cache.i!==i){var E=EX[i],lo=Math.log10(E.kr[0])-3,hi=Math.log10(E.kr[1])+3;
      cache={i:i,Ks:_w12_kgrid(lo,hi,80,E.marks.map(function(m){return m[0];})),pr:_w12_props(U,E.a,E.b)};cache.R=_w12_track(U,E.a,E.b,cache.Ks);}return cache;}
    function draw(){
      var E=EX[ex.get()],C=data(),V=E.views[Math.min(vw.get(),E.views.length-1)],K=kc.get(),nar=_w12_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:300,nar?250:300,V.xr,V.yr);
      o.push(_w12_sp(U,S,P,V.xt,V.yt));
      if(cp.get())o.push(_w12_drawProps(S,P,C.pr));
      o.push(_w12_br(P,C.R,"signal",1.8));
      o.push(U.ctl.pz(P,C.pr.ps,C.pr.zs,"muted",5));
      var num=U.ctl.poly.scale(E.b,K),den=U.ctl.poly.add(E.a,num),rs=U.ctl.poly.roots(den),uns=_w12_unstable(rs),ax=_w12_axis(rs);
      var cpl=uns?"alias":"gold";
      rs.forEach(function(z){if(_w12_in(P,z))o.push(S.X(P.X(z.re),P.Y(z.im),6.5,cpl,2.6));
        else{var xx=Math.max(P.x+4,Math.min(P.x+P.w-4,P.X(Math.max(P.xr[0],Math.min(P.xr[1],z.re))))),yy=Math.max(P.y+4,Math.min(P.y+P.h-4,P.Y(Math.max(P.yr[0],Math.min(P.yr[1],z.im)))));o.push(S.D(xx,yy,cpl,3.6));}});
      o.push(S.TX(P.x,P.y-6,"青: 根軌跡　金の ×: K_c = "+_w12_sig(K,3)+" の閉ループの極","start",9,"muted"));
      /* ステップ応答 */
      var r=_w12_resp(U,num,den,E.tEnd,800),yf=uns?null:U.ctl.dcgain(U.ctl.tf(num,den));
      var ymax=1.2,ymin=0;r.y.forEach(function(v){if(isFinite(v)){ymax=Math.max(ymax,Math.min(v*1.05,2.6));ymin=Math.min(ymin,Math.max(v,-1.5));}});
      var qx=nar?52:420,qy=nar?20+250+62:20,qw=nar?330:266,qh=nar?150:230;
      var Q=U.plot(qx,qy,qw,qh,[0,E.tEnd],[ymin,ymax]);
      o.push(Q.axes({xl:"時間 t [s]",yl:E.yl,xt:U.nice(0,E.tEnd,4),yt:U.nice(ymin,ymax,4),xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,2);},ylOff:40}));
      o.push(Q.line([[0,1],[E.tEnd,1]],"muted",1,"4 3"));
      var pts=[];for(var i=0;i<r.t.length;i++)pts.push([r.t[i],r.y[i]]);
      o.push(Q.clip(pts,uns?"alias":"signal",2));
      o.push(S.T(Q.x,Q.y-6,"目標値の単位ステップに対する応答","start",9,"muted"));
      box.set(S.svg(Wd,nar?qy+qh+42:20+300+44,o));
      /* 読み出し */
      var h="K<sub>c</sub> = "+_w12_sig(K,4)+" "+E.unit+"　閉ループの極: "+_w12_plist(rs)+"<br>";
      var dm=_w12_dom(rs);
      if(uns)h+='<span class="warn">不安定: 右半平面に極がある（揺れが大きくなり続ける）</span>';
      else if(ax)h+='<span class="warn">安定限界: 極が虚軸の上にある（同じ振れ幅で揺れ続ける）</span>';
      else{var inf=_w12_info(r.t,r.y,yf);
        h+='<span class="ok">安定</span>　虚軸に最も近い極 '+_w12_plist([dm.z])+"（減衰比 "+_w12_f(dm.zeta,3)+"、固有角周波数 "+_w12_sig(dm.wn,3)+" rad/s）<br>";
        h+="落ち着く値 "+_w12_sig(yf,3)+"　行き過ぎ量 "+_w12_f(inf.Mp,1)+" %　2 % 整定時間 "+(isFinite(inf.t2)?_w12_sig(inf.t2,3)+" s":"（表示の時間内に落ち着かない）");}
      var sum=0;rs.forEach(function(z){sum+=z.re;});
      h+="<br>閉ループの極の和 "+_w12_sig(sum,4)+"（開ループの極の和 "+_w12_sig(C.pr.sump,4)+"。n − m = "+(C.pr.n-C.pr.m)+(C.pr.n-C.pr.m>=2?" なので一定":"")+"）";
      ro.innerHTML=h+'<div class="wnote">応答は、閉ループ伝達関数 K<sub>c</sub>b(s)/{a(s) + K<sub>c</sub>b(s)} を零次ホールドで厳密に離散化して求めた。行き過ぎ量は落ち着く値に対する割合。極が枠の外にあるときは、枠の縁に点で示す。</div>';
    }
    setEx();
  };

  /* ---- 4 節: 開ループの極と零点を動かすと、根軌跡が描き直される ---- */
  REG.w12_edit=function(el,U){
    var S=U.S,TD=0.02/0.84,TI=0.42,TIp=0.168;
    var zp=(function(){var r=U.ctl.poly.roots([TIp*TD,TIp,1]);return r.map(function(z){return z.re;}).sort(function(x,y){return x-y;});})();
    var PRE=[
      {name:"比例（モータの位置）",ps:[0,-20],zs:[],beta:1000,K:0.21,view:1,unit:"V/rad"},
      {name:"PD（零点 −42）",ps:[0,-20],zs:[-1/TD],beta:1000*TD,K:0.84,view:0,unit:"V/rad"},
      {name:"不完全微分の PD（N = 10）",ps:[0,-20,-10/TD],zs:[-1/(1.1*TD)],beta:11000,K:0.84,view:0,unit:"V/rad"},
      {name:"PI（零点 −2.38）",ps:[0,0,-20],zs:[-1/TI],beta:1000,K:0.21,view:2,unit:"V/rad"},
      {name:"積分だけ",ps:[0,0,-20],zs:[],beta:1000,K:0.5,view:2,unit:"V/(rad·s)"},
      {name:"PID（零点 −7.18 と −34.8）",ps:[0,0,-20],zs:zp,beta:1000*TD,K:0.84,view:1,unit:"V/rad"}];
    var VIEWS=[{name:"広く（−110〜10）",xr:[-110,10],yr:[-60,60],xt:[-100,-80,-60,-40,-20,0],yt:[-60,-30,0,30,60]},
               {name:"中くらい（−50〜10）",xr:[-50,10],yr:[-40,40],xt:[-50,-40,-30,-20,-10,0,10],yt:[-40,-20,0,20,40]},
               {name:"原点の近く（−25〜5）",xr:[-25,5],yr:[-25,25],xt:[-25,-20,-15,-10,-5,0,5],yt:[-20,-10,0,10,20]}];
    U.head(el,"EDIT","極と零点を足す・動かす — 根軌跡がどう曲がるか");
    var r1=U.ctrls(el);
    var pre=U.select(r1,"初めの形",PRE.map(function(p){return p.name;}),0,function(){load(pre.get());});
    var vw=U.select(r1,"表示の範囲",VIEWS.map(function(v){return v.name;}),1,function(){draw();});
    var cref=U.checkbox(r1,"比例だけの根軌跡を重ねる",true,function(){draw();});
    var cpr=U.checkbox(r1,"漸近線・分岐点",true,function(){draw();});
    var br=U.btnrow(el);
    var items=[],sel=-1,msg="",beta=1000,unit="V/rad";
    function np(){return items.filter(function(it){return it.k==="p";}).reduce(function(s,it){return s+(it.pair?2:1);},0);}
    function nz(){return items.filter(function(it){return it.k==="z";}).reduce(function(s,it){return s+(it.pair?2:1);},0);}
    function add(k,pair,re,im){msg="";var d=pair?2:1;
      if(k==="p"&&np()+d>6){msg="極は 6 個までにしている";draw();return;}
      if(k==="z"&&nz()+d>np()-1){msg="一巡伝達関数を厳密にプロパーに保つため、零点は極より少なくしている（先に極を足す）";draw();return;}
      items.push({k:k,pair:pair,re:re,im:pair?im:0});sel=items.length-1;draw();}
    U.button(br,"実の極を足す",function(){add("p",false,-5,0);});
    U.button(br,"極の組を足す",function(){add("p",true,-8,12);});
    U.button(br,"実の零点を足す",function(){add("z",false,-30,0);});
    U.button(br,"零点の組を足す",function(){add("z",true,-30,15);});
    U.button(br,"初めの形に戻す（本文の例）",function(){load(pre.get());});
    U.button(br,"選んだものを消す",function(){msg="";if(sel>=0){items.splice(sel,1);sel=-1;while(nz()>Math.max(0,np()-1)){for(var i=items.length-1;i>=0;i--)if(items[i].k==="z"){items.splice(i,1);break;}msg="零点が極より少なくなるよう、零点も消した";}}draw();});
    var r2=U.ctrls(el);
    var sre=U.slider(r2,"選んだ極・零点の実部 σ",{min:-110,max:10,step:0.1,value:-20,fmt:function(v){return _w12_f(v,1)+" /s";},onInput:function(v){if(sel<0||sel>=items.length)return;items[sel].re=v;draw();}});
    var sim=U.slider(r2,"選んだ組の虚部 ω",{min:0,max:60,step:0.1,value:10,fmt:function(v){return _w12_f(v,1)+" rad/s";},onInput:function(v){if(sel<0||sel>=items.length||!items[sel].pair)return;items[sel].im=v;draw();}});
    var kc=U.slider(r2,"K<sub>c</sub>",{min:0.001,max:1000,log:true,value:0.21,fmt:function(v){return _w12_sig(v,3)+" "+unit;},onInput:function(){draw();}});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,drag=-1;
    function load(i){var p=PRE[i];items=p.ps.map(function(v){return {k:"p",pair:false,re:v,im:0};}).concat(p.zs.map(function(v){return {k:"z",pair:false,re:v,im:0};}));
      beta=p.beta;unit=p.unit;sel=-1;msg="";vw.set(p.view);kc.set(p.K);draw();}
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){drag=-1;return;}
      if(x==null||!PP)return;
      if(type==="down"){var best=-1,bd=16;
        items.forEach(function(it,i){var xs=PP.X(it.re),ys=[PP.Y(it.im)];if(it.pair)ys.push(PP.Y(-it.im));ys.forEach(function(yy){var d=Math.hypot(x-xs,y-yy);if(d<bd){bd=d;best=i;}});});
        if(best<0){if(x>=PP.x&&x<=PP.x+PP.w&&y>=PP.y&&y<=PP.y+PP.h){sel=-1;draw();}return false;}
        sel=best;drag=best;draw();return;}
      if(drag<0)return;
      var it=items[drag],re=Math.max(PP.xr[0],Math.min(PP.xr[1],PP.ux(x))),tol=(PP.xr[1]-PP.xr[0])/200;
      if(Math.abs(re)<tol*2)re=0;
      if(it.pair){var im=Math.min(PP.yr[1],Math.abs(PP.uy(y)));if(im<tol*2)im=0.01;it.im=+im.toFixed(3);}
      it.re=+re.toFixed(3);draw();});
    function polyOf(k){var rs=[];items.forEach(function(it){if(it.k!==k)return;rs.push({re:it.re,im:it.im});if(it.pair)rs.push({re:it.re,im:-it.im});});return rs.length?U.ctl.poly.fromRoots(rs):[1];}
    function draw(){
      var has=sel>=0&&sel<items.length;sre.input.disabled=!has;sim.input.disabled=!(has&&items[sel].pair);
      if(has){sre.set(items[sel].re);if(items[sel].pair)sim.set(items[sel].im);}
      var V=VIEWS[vw.get()],nar=_w12_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?52:56,20,nar?330:330,nar?260:300,V.xr,V.yr);PP=P;
      o.push(_w12_sp(U,S,P,V.xt,V.yt));
      if(cref.get()){o.push(S.L(P.X(-20),P.Y(0),P.X(0),P.Y(0),"muted",3.4));if(-10>=P.xr[0])o.push(S.L(P.X(-10),P.y,P.X(-10),P.y+P.h,"muted",1.4,"5 4"));}
      var a=polyOf("p"),b=U.ctl.poly.scale(polyOf("z"),beta),ok=np()>0&&nz()<np(),K=kc.get(),rs=[],pr=null;
      if(ok){pr=_w12_props(U,a,b);
        var R=_w12_track(U,a,b,_w12_kgrid(-5,6,45,[K]));
        if(cpr.get()){if(pr.sa!==null&&pr.n-pr.m>=2){var L=10*(P.xr[1]-P.xr[0]);pr.angs.forEach(function(an){var r=an*Math.PI/180;o.push(P.clip([[pr.sa,0],[pr.sa+L*Math.cos(r),L*Math.sin(r)]],"gold",1.4,"6 4"));});
            if(pr.sa>=P.xr[0]&&pr.sa<=P.xr[1])o.push(S.D(P.X(pr.sa),P.Y(0),"gold",4));}
          pr.br.forEach(function(q){if(q.s>=P.xr[0]&&q.s<=P.xr[1])o.push(S.CIRC(P.X(q.s),P.Y(0),5.5,"gold",2));});}
        o.push(_w12_br(P,R,"signal",2.2));
        rs=U.ctl.poly.roots(U.ctl.poly.add(a,U.ctl.poly.scale(b,K)));}
      items.forEach(function(it,i){var pts=[{re:it.re,im:it.im}];if(it.pair)pts.push({re:it.re,im:-it.im});
        o.push(it.k==="p"?U.ctl.pz(P,pts,[],"muted",6):U.ctl.pz(P,[],pts,"muted",5.5));
        if(i===sel)pts.forEach(function(q){o.push(S.CIRC(P.X(q.re),P.Y(q.im),11,"ink",1.2,null,"3 2"));});});
      var uns=_w12_unstable(rs),cpl=uns?"alias":"gold";
      rs.forEach(function(z){if(_w12_in(P,z))o.push(S.X(P.X(z.re),P.Y(z.im),6.5,cpl,2.6));});
      o.push(S.T(P.x+P.w,P.y-6,"極（×）・零点（○）を押して選び、ドラッグかつまみで動かす","end",9,"muted"));
      /* ステップ応答 */
      var qx=nar?52:440,qy=nar?20+260+60:20,qw=nar?330:246,qh=nar?140:220,inf=null,tEnd=1;
      if(ok){var sl=Infinity;rs.forEach(function(z){if(z.re<-1e-9)sl=Math.min(sl,-z.re);});tEnd=uns?1:Math.max(0.2,Math.min(10,6/sl));
        var num=U.ctl.poly.scale(b,K),den=U.ctl.poly.add(a,num),r=_w12_resp(U,num,den,tEnd,800),yf=uns?null:U.ctl.dcgain(U.ctl.tf(num,den));
        var ymax=1.2,ymin=0;r.y.forEach(function(v){if(isFinite(v)){ymax=Math.max(ymax,Math.min(v*1.05,2.6));ymin=Math.min(ymin,Math.max(v,-1.5));}});
        var Q=U.plot(qx,qy,qw,qh,[0,tEnd],[ymin,ymax]);
        o.push(Q.axes({xl:"時間 t [s]",yl:"制御量",xt:U.nice(0,tEnd,4),yt:U.nice(ymin,ymax,4),xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,2);},ylOff:36}));
        o.push(Q.line([[0,1],[tEnd,1]],"muted",1,"4 3"));
        var pts=[];for(var i=0;i<r.t.length;i++)pts.push([r.t[i],r.y[i]]);o.push(Q.clip(pts,uns?"alias":"signal",2));
        o.push(S.T(Q.x,Q.y-6,"目標値の単位ステップに対する応答","start",9,"muted"));
        if(!uns&&!_w12_axis(rs))inf=_w12_info(r.t,r.y,yf);}
      box.set(S.svg(Wd,nar?qy+qh+42:20+300+44,o));
      /* 読み出し */
      if(!ok){ro.innerHTML='<span class="warn">極を 1 つ以上置き、零点は極より少なくする</span>'+(msg?"<br>"+msg:"");return;}
      var h="開ループの極: "+_w12_plist(pr.ps)+"　零点: "+(pr.m?_w12_plist(pr.zs):"なし")+"（n = "+pr.n+"、m = "+pr.m+"、β = "+_w12_sig(beta,4)+"）<br>";
      h+=(pr.n-pr.m>=2?"漸近線: "+(pr.n-pr.m)+" 本、σ<sub>a</sub> = "+_w12_sig(pr.sa,4)+"、角度 "+pr.angs.map(_w12_angtxt).join("・"):"漸近線: 1 本（180°。負の実軸に沿って左へ）")+"　分岐点: "+(pr.br.length?pr.br.map(function(q){return _w12_sig(q.s,4)+"（K<sub>c</sub> = "+_w12_sig(q.K,3)+"）";}).join("、"):"なし")+"<br>";
      var sum=0;rs.forEach(function(z){sum+=z.re;});
      h+="閉ループの極の和: "+_w12_sig(sum,4)+"（"+(pr.n-pr.m>=2?"n − m ≥ 2 なので K<sub>c</sub> によらず開ループの極の和 "+_w12_sig(pr.sump,4)+" のまま":"n − m = 1 なので K<sub>c</sub>β ずつ左へずれる")+"）<br>";
      h+="K<sub>c</sub> = "+_w12_sig(K,4)+" の閉ループの極: "+_w12_plist(rs)+"　";
      if(uns)h+='<span class="warn">不安定</span>';else if(_w12_axis(rs))h+='<span class="warn">安定限界</span>';
      else h+='<span class="ok">安定</span>'+(inf?"　行き過ぎ量 "+_w12_f(inf.Mp,1)+" %、2 % 整定時間 "+(isFinite(inf.t2)?_w12_sig(inf.t2,3)+" s":"（表示の時間内に落ち着かない）"):"");
      ro.innerHTML=h+(msg?'<br><span class="warn">'+msg+'</span>':"")+'<div class="wnote">根軌跡は、一巡伝達関数 K<sub>c</sub>β Π(s − z<sub>i</sub>)/Π(s − p<sub>i</sub>)（β は初めの形の値のまま）で求めた。応答は、目標値から制御量までの閉ループ伝達関数（制御器の零点を目標値の通り道にも含む形）の単位ステップ応答。灰の太線と破線は、比例だけのときの根軌跡（−20〜0 と、実部 −10 の縦の線）。</div>';
    }
    load(0);
  };

  /* ---- 5 節: 減衰比の線と仕様の領域から、ゲインと零点を決める（モータの位置） ---- */
  REG.w12_design=function(el,U){
    var S=U.S,MPS=[1.5,5,10,16.3,25],TS=[1,0.5,0.4,0.25,0.15];
    U.head(el,"DESIGN","仕様の領域と減衰比の線 — 交点のゲインと、角度の条件で置く零点");
    var r1=U.ctrls(el);
    var mps=U.select(r1,"行き過ぎ量の上限",MPS.map(function(v){return v+" %";}),1,function(){draw();});
    var tss=U.select(r1,"2 % 整定時間の上限",TS.map(function(v){return v+" s";}),0,function(){draw();});
    var mode=U.select(r1,"制御器",["比例（ゲインだけを選ぶ）","PD（零点を角度の条件で置く）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var kc=U.slider(r2,"比例の K<sub>c</sub>",{min:0.01,max:10,log:true,value:0.21,fmt:function(v){return _w12_sig(v,3)+" V/rad";},onInput:function(){draw();}});
    var sdr=U.slider(r2,"PD の望む極の実部",{min:-60,max:-2,step:0.05,value:-20,fmt:function(v){return _w12_f(v,2)+" /s";},onInput:function(v){sd.re=v;draw();}});
    var sdi=U.slider(r2,"PD の望む極の虚部",{min:0.5,max:33,step:0.05,value:20.98,fmt:function(v){return _w12_f(v,2)+" rad/s";},onInput:function(v){sd.im=v;draw();}});
    var br=U.btnrow(el),sd={re:-20,im:20.98};
    function zmin(){var M=MPS[mps.get()]/100,l=Math.log(M);return -l/Math.sqrt(Math.PI*Math.PI+l*l);}
    function tanpsi(){var z=zmin();return Math.sqrt(1-z*z)/z;}
    U.button(br,"交点の K<sub>c</sub> にする（比例）",function(){mode.set(0);kc.set(+(0.1/(zmin()*zmin())).toPrecision(4));draw();});
    U.button(br,"望む極を減衰比の線の上へ（PD）",function(){mode.set(1);sd.im=Math.min(33,-sd.re*tanpsi());sync();draw();});
    U.button(br,"本文の例 1（5 %・1 s・比例）",function(){mps.set(1);tss.set(0);mode.set(0);kc.set(0.21);draw();});
    U.button(br,"本文の例 2（5 %・0.25 s・PD）",function(){mps.set(1);tss.set(3);mode.set(1);sd={re:-20,im:20.98};sync();draw();});
    function sync(){sdr.set(sd.re);sdi.set(sd.im);}
    var box=U.svgbox(el),ro=U.readout(el),PP=null,dragging=false;
    U.ctl.drag(box,function(type,x,y){if(type==="up"){dragging=false;return;}if(x==null||!PP||mode.get()!==1)return;
      if(type==="down"){if(Math.hypot(x-PP.X(sd.re),y-PP.Y(sd.im))>18)return false;dragging=true;return;}
      if(!dragging)return;sd={re:Math.max(-60,Math.min(-2,PP.ux(x))),im:Math.max(0.5,Math.min(33,PP.uy(y)))};sync();draw();});
    function region(P,sg,tp){var y1=P.yr[1],x0=P.xr[0],pts=[[sg,-sg*tp]],xe=-y1/tp;
      if(xe>x0)pts=pts.concat([[xe,y1],[x0,y1],[x0,-y1],[xe,-y1]]);else pts=pts.concat([[x0,-x0*tp],[x0,x0*tp]]);
      pts.push([sg,sg*tp]);return S.PL(pts.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"none",0,"green",null,0.16);}
    function draw(){
      var M=mode.get(),zt=zmin(),tp=tanpsi(),sg=-4/TS[tss.get()],nar=_w12_nar(box),Wd=nar?400:700,o=[];
      kc.el.style.display=M===0?"":"none";sdr.el.style.display=M===1?"":"none";sdi.el.style.display=M===1?"":"none";
      var P=U.plot(nar?52:56,20,nar?330:330,nar?299:299,[-70,5],[-34,34]);PP=P;
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"screen","line",0.8));
      o.push(region(P,sg,tp));
      o.push(U.ctl.splane(P));
      [1,-1].forEach(function(sgn){o.push(P.clip([[0,0],[-200*zt,sgn*200*Math.sqrt(1-zt*zt)]],"faint",1,"4 3"));});
      o.push(P.axes({xl:"実部 σ [1/s]",yl:"虚部 ω [rad/s]",xt:[-70,-60,-50,-40,-30,-20,-10,0],yt:[-30,-20,-10,0,10,20,30],xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,3);},ylOff:34,sz:9}));
      o.push(U.ctl.splane(P,{rhp:false}));
      o.push(S.L(P.X(sg),P.y,P.X(sg),P.y+P.h,"green",1.2,"5 3"));
      var num,den,numE=null,rs,h="",Kc,ok=true;
      if(M===0){
        Kc=kc.get();var Kint=0.1/(zt*zt),Klo=sg>=-10?-(sg*sg+20*sg)/1000:null;
        o.push(S.L(P.X(-20),P.Y(0),P.X(0),P.Y(0),"signal",2.2));o.push(S.L(P.X(-10),P.y,P.X(-10),P.y+P.h,"signal",2.2));
        if(Klo!==null&&Klo<=Kint){o.push(S.L(P.X(-20-sg),P.Y(0),P.X(sg),P.Y(0),"green",4.4));o.push(S.L(P.X(-10),P.Y(-10*tp),P.X(-10),P.Y(10*tp),"green",4.4));}
        var si={re:-10,im:10*tp};o.push(U.ctl.pz(P,[si,{re:-10,im:-10*tp}],[],"gold",6));
        o.push(S.TX(P.X(-10)-8,P.Y(10*tp)-8,"交点 K_c = "+_w12_sig(Kint,3),"end",9.5,"gold",true,true));
        o.push(U.ctl.pz(P,[{re:0,im:0},{re:-20,im:0}],[],"muted",5));
        num=[1000*Kc];den=[1,20,1000*Kc];rs=U.ctl.poly.roots(den);
        h+="比例: 根軌跡と減衰比 "+_w12_f(zt,3)+" の線の交点は −10 ± <i>j</i>"+_w12_f(10*tp,2)+"、大きさの条件から K<sub>c</sub> = |s||s + 20| ÷ 1000 = "+_w12_sig(Kint,3)+" V/rad。";
        h+=(Klo!==null&&Klo<=Kint)?"領域の中にあるのは K<sub>c</sub> = "+_w12_sig(Klo,3)+"〜"+_w12_sig(Kint,3)+" V/rad（実部 "+_w12_sig(sg,3)+" の線と、減衰比の線の間）。<br>":'<span class="warn">実部 '+_w12_sig(sg,3)+" の線より左に、比例制御の根軌跡は届かない（極の組の実部は −10 のまま）。PD で零点を足す。</span><br>";
      }else{
        var t1=Math.atan2(sd.im,sd.re)*180/Math.PI,t2=Math.atan2(sd.im,sd.re+20)*180/Math.PI,tz=t1+t2-180;
        o.push(U.ctl.pz(P,[{re:0,im:0},{re:-20,im:0}],[],"muted",5));
        if(tz<=0.05||tz>=179.95){ok=false;h+='<span class="warn">この点は、比例だけの根軌跡より右にあり（極からの角度の和 '+_w12_f(t1+t2,1)+'° < 180°）、左半平面の零点では通せない（極を足す必要がある）。</span><br>';
          o.push(S.D(P.X(sd.re),P.Y(sd.im),"alias",5));}
        else{var z=sd.re-sd.im/Math.tan(tz*Math.PI/180);
          if(z>=-0.05){ok=false;h+='<span class="warn">零点が原点より右（'+_w12_sig(z,3)+'）になる。望む極を左へ動かす。</span><br>';o.push(S.D(P.X(sd.re),P.Y(sd.im),"alias",5));}
          else{var TD=-1/z,beta=1000*TD;Kc=Math.hypot(sd.re,sd.im)*Math.hypot(sd.re+20,sd.im)/(beta*Math.hypot(sd.re-z,sd.im));
            var R=_w12_track(U,[1,20,0],[beta,1000],_w12_kgrid(-4,4,60,[Kc]));o.push(_w12_br(P,R,"signal",1.6));
            [[0,"teal"],[-20,"purple"],[z,"gold"]].forEach(function(e,i){var x0=P.X(e[0]),y0=P.Y(0),an=Math.atan2(sd.im,sd.re-e[0])*180/Math.PI;
              o.push(S.L(x0,y0,x0+20,y0,e[1],1,"3 2"));o.push(_w12_arc(S,x0,y0,12+3*i,0,an,e[1],1.3));o.push(S.ARR(x0,y0,P.X(sd.re),P.Y(sd.im),e[1],1.4,6));});
            o.push(U.ctl.pz(P,[],[{re:z,im:0}],"gold",5.5));
            o.push(S.T(P.X(z),P.Y(0)+16,"零点 "+_w12_sig(z,3),"middle",9,"gold",true,false,null,true));
            o.push(S.CIRC(P.X(sd.re),P.Y(sd.im),7,"green",2.4,"screen"));o.push(S.D(P.X(sd.re),P.Y(sd.im),"green",3));
            o.push(S.T(P.X(sd.re)+10,P.Y(sd.im)-8,"望む極（ドラッグ）","start",9,"green",true,false,null,true));
            num=[1000*Kc];den=[1,20+1000*Kc*TD,1000*Kc];numE=[1000*Kc*TD,1000*Kc];rs=U.ctl.poly.roots(den);
            h+="PD: 極 0 と −20 からの角度 "+_w12_f(t1,1)+"° と "+_w12_f(t2,1)+"°、零点からの角度は "+_w12_f(t1,1)+" + "+_w12_f(t2,1)+" − 180 = "+_w12_f(tz,1)+"° → 零点 "+_w12_sig(z,4)+"（T<sub>D</sub> = "+_w12_sig(TD,3)+" s）<br>";
            h+="大きさの条件: K<sub>c</sub> = "+_w12_sig(Kc,4)+" V/rad（= K<sub>P</sub>）、K<sub>D</sub> = K<sub>c</sub>T<sub>D</sub> = "+_w12_sig(Kc*TD,3)+" V·s/rad<br>";}}
      }
      if(ok){rs.forEach(function(q){if(_w12_in(P,q))o.push(S.X(P.X(q.re),P.Y(q.im),6.5,"signal",2.6));});}
      o.push(S.T(P.x+2,P.y-6,"緑: 行き過ぎ量と整定時間の仕様の領域（目安の式）","start",9,"green"));
      /* ステップ応答 */
      var qx=nar?52:440,qy=nar?20+299+60:20,qw=nar?330:246,qh=nar?150:230,tEnd=Math.max(0.6,Math.min(3,2.5*TS[tss.get()]));
      var Q=U.plot(qx,qy,qw,qh,[0,tEnd],[0,1.6]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"角度 [rad]",xt:U.nice(0,tEnd,4),yt:[0,0.5,1,1.5],xfmt:function(v){return _w12_sig(v,3);},yfmt:function(v){return _w12_sig(v,2);},ylOff:36}));
      var ts=TS[tss.get()],mp=MPS[mps.get()];
      o.push(S.RECT(Q.X(Math.min(ts,tEnd)),Q.Y(1.02),Q.X(tEnd)-Q.X(Math.min(ts,tEnd)),Q.Y(0.98)-Q.Y(1.02),0,"green","none",0,null,' fill-opacity="0.2"'));
      o.push(Q.line([[0,1+mp/100],[tEnd,1+mp/100]],"green",1.1,"5 3"));o.push(S.L(Q.X(ts),Q.y,Q.X(ts),Q.y+Q.h,"green",1.1,"5 3"));
      o.push(Q.line([[0,1],[tEnd,1]],"muted",1,"4 3"));
      if(ok){var r=_w12_resp(U,num,den,tEnd,900),inf=_w12_info(r.t,r.y,1),pts=[];for(var i=0;i<r.t.length;i++)pts.push([r.t[i],r.y[i]]);
        if(numE){var r2=_w12_resp(U,numE,den,tEnd,900),pe=[];for(var j=0;j<r2.t.length;j++)pe.push([r2.t[j],r2.y[j]]);o.push(Q.clip(pe,"gold",1.5,"5 3"));var inf2=_w12_info(r2.t,r2.y,1);}
        o.push(Q.clip(pts,"signal",2.2));
        var okM=inf.Mp<=mp+0.05,okT=inf.t2<=ts+0.0005;
        h+="閉ループの極 "+_w12_plist(rs)+"　応答: 行き過ぎ量 "+_w12_f(inf.Mp,1)+" %（上限 "+mp+" %）"+(okM?'<span class="ok"> 満たす</span>':'<span class="warn"> 満たさない</span>')+"、2 % 整定時間 "+(isFinite(inf.t2)?_w12_sig(inf.t2,3)+" s":"—")+"（上限 "+ts+" s）"+(okT?'<span class="ok"> 満たす</span>':'<span class="warn"> 満たさない</span>');
        if(numE)h+="<br>金の破線: D 動作を偏差に掛けた場合（閉ループの零点 "+_w12_sig(-1/(numE[0]/numE[1]),3)+" が加わる）: 行き過ぎ量 "+_w12_f(inf2.Mp,1)+" %、2 % 整定時間 "+_w12_sig(inf2.t2,3)+" s";}
      o.push(S.T(Q.x,Q.y-6,"青: 目標値の単位ステップ"+(M===1?"（D 動作は測った制御量に）":""),"start",9,"muted"));
      box.set(S.svg(Wd,nar?qy+qh+42:20+299+44,o));
      ro.innerHTML=h+'<div class="wnote">仕様の領域は、行き過ぎ量の上限から決まる減衰比の下限 '+_w12_f(zt,3)+'（4 章 4 節の式）と、2 % 整定時間の目安 4/(ζω<sub>n</sub>) から決まる実部の上限 '+_w12_sig(sg,3)+' で描いた。応答の行き過ぎ量と整定時間は、数値計算の値。PD では、望む極の位置から、本文 5 節の手順で零点とゲインを決めている。</div>';
    }
    draw();
  };

  /* ===== 13 章 ループ整形 ===== */
  function _w13_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w13_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w13_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w13_s3(v){var a=Math.abs(v);if(a===0)return "0";var d=a>=100?0:(a>=10?1:(a>=1?2:3));return _w13_f(v,d);}
  /* 行き過ぎ量 [%] と ±2 % の整定時間（最終値 yf）。落ち着かなければ ts = NaN */
  function _w13_met(t,y,yf){var mx=-Infinity,last=-1,bd=0.02*Math.abs(yf);for(var k=0;k<t.length;k++){if(y[k]>mx)mx=y[k];if(Math.abs(y[k]-yf)>bd)last=k;}
    /* 2 % の幅に入る時刻は、最後に外れた点と次の点の間を直線で補って求める */
    var ts=last<0?0:NaN;if(last>=0&&last+1<t.length){var e0=Math.abs(y[last]-yf)-bd,e1=Math.abs(y[last+1]-yf)-bd;ts=t[last]+(t[last+1]-t[last])*e0/Math.max(1e-300,e0-e1);}
    return {mp:(mx-yf)/Math.abs(yf)*100,ts:ts};}
  /* 制御器 K_c・遅れ補償器 (s + z1)/(s + p1)・進み補償器 (1 + s/z2)/(1 + s/p2)。lag・lead が null ならその部分を入れない */
  function _w13_C(U,Kc,lag,lead){var P=U.ctl.poly,num=[Kc],den=[1];
    if(lag){num=P.mul(num,[1,lag[0]]);den=P.mul(den,[1,lag[1]]);}
    if(lead){num=P.mul(num,[1/lead[0],1]);den=P.mul(den,[1/lead[1],1]);}
    return U.ctl.tf(num,den);}
  function _w13_poles(ps){var o=[];ps.forEach(function(p){if(p.im<-1e-9)return;o.push(Math.abs(p.im)>1e-6*(1+Math.abs(p.re))?_w13_g(p.re,3)+" ± j"+_w13_g(p.im,3):_w13_g(p.re,3));});return o.join("、");}
  function _w13_rhp(ps){return ps.some(function(p){return p.re>1e-7*(1+Math.abs(p.im));});}
  /* 対象（本文の例の値） */
  var _W13_MPOS={num:[1000],den:[1,20,0]};                 /* モータの位置（L_a を無視）rad/V */
  var _W13_MPLA={num:[2e6],den:[1,2000,40000,0]};          /* L_a を含む */
  var _W13_CART={num:[0.5],den:[0.5,1]};                   /* 台車の速度 (m/s)/N */
  /* ボード線図の上の点の値（位相は bode と同じつなぎ方の値を補間して使う） */
  function _w13_at(B,w){var ws=B.w,i=0;while(i<ws.length-2&&ws[i+1]<w)i++;var a=(Math.log(w)-Math.log(ws[i]))/(Math.log(ws[i+1])-Math.log(ws[i]));a=Math.max(0,Math.min(1,a));
    return {db:B.db[i]+(B.db[i+1]-B.db[i])*a,ph:B.ph[i]+(B.ph[i+1]-B.ph[i])*a};}

  /* ---- 2 節: 位相遅れ補償 ---- */
  var _W13_LAG=[
    {name:"台車の速度",P:_W13_CART,Kp:8,ku:"N/(m/s)",zs:[0.1,0.2,0.3,0.5,0.8,1,1.5,2.5,4],z0:4,wr:[0.01,1000],dbr:[-40,60],phr:[-120,0],mode:"step",tEnd:4,yu:"m/s",ylab:"速度"},
    {name:"モータの位置",P:_W13_MPOS,Kp:0.21,ku:"V/rad",zs:[0.1,0.2,0.3,0.5,1,1.5,2,3,5],z0:4,wr:[0.01,1000],dbr:[-60,80],phr:[-210,-60],mode:"ramp",tEnd:4,yu:"rad",ylab:"角度"}
  ];
  REG.w13_lag=function(el,U){
    var S=U.S,ctl=U.ctl,rs=[1,2,3,5,10,20,30,50];
    U.head(el,"LAG","位相遅れ補償 — 遅い角周波数のゲインを上げ、交差より上は変えない");
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["台車の速度（比例 8 N/(m/s)。目標値のステップ）","モータの位置（比例 0.21 V/rad。1 rad/s のランプ）"],0,function(){zz.set(_W13_LAG[obj.get()].z0);draw();});
    var r2=U.ctrls(el);
    var rr=U.slider(r2,"遅い角周波数のゲインの倍率 ω<sub>z1</sub>/ω<sub>p1</sub>",{values:rs,value:10,fmt:function(v){return v===1?"1（遅れ補償なし）":v+" 倍";},onInput:draw});
    var zz=U.slider(r2,"零点の位置 ω<sub>z1</sub>",{values:[0,1,2,3,4,5,6,7,8],value:4,fmt:function(i){return _w13_g(_W13_LAG[obj.get()].zs[i],3)+" rad/s";},onInput:draw});
    var r3=U.ctrls(el);
    var cmp=U.checkbox(r3,"比べるために、比例ゲインを同じ倍率で上げた場合を重ねる",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){rr.set(10);zz.set(_W13_LAG[obj.get()].z0);cmp.set(true);draw();});
    U.button(br,"遅れ補償なし",function(){rr.set(1);draw();});
    U.button(br,"零点を交差に近づける",function(){if(rr.get()===1)rr.set(10);zz.set(8);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var c=_W13_LAG[obj.get()],r=rr.get(),z1=c.zs[zz.get()],p1=z1/r;
      var P=ctl.tf(c.P.num,c.P.den),C0=ctl.tf([c.Kp],[1]),C=r===1?C0:_w13_C(U,c.Kp,[z1,p1],null),CK=ctl.tf([c.Kp*r],[1]);
      var L0=ctl.series(P,C0),L=ctl.series(P,C),LK=ctl.series(P,CK);
      var ws=ctl.logspace(Math.log10(c.wr[0]),Math.log10(c.wr[1]),600);
      var B0=ctl.bode(L0,ws),B=ctl.bode(L,ws),BK=ctl.bode(LK,ws);
      var m0=ctl.margins(L0,1e-4,1e5),m=ctl.margins(L,1e-4,1e5),mK=ctl.margins(LK,1e-4,1e5);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[];
      var curves=[{w:ws,db:B0.db,ph:B0.ph,c:"muted",dash:"5 3",lw:1.8}];if(cmp.get()&&r>1)curves.push({w:ws,db:BK.db,ph:BK.ph,c:"alias",dash:"5 3",lw:1.8});curves.push({w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4});
      var bx=nar?58:62,bw=nar?320:300;
      var bd=ctl.bodeSvg(curves,{x:bx,y:24,w:bw,hm:120,hp:96,gap:28,wr:c.wr,dbr:c.dbr,phr:c.phr});
      o.push(S.TX(bx-48,14,"(a) 一巡伝達関数 P(jω)C(jω)","start",10.5,"ink",true));o.push(bd.svg);
      [[m0,"muted"],[m,"signal"]].concat(cmp.get()&&r>1?[[mK,"alias"]]:[]).forEach(function(q){var mm=q[0];if(mm.wgc&&mm.wgc>=c.wr[0]&&mm.wgc<=c.wr[1]){o.push(S.D(bd.Pm.X(mm.wgc),bd.Pm.Y(0),q[1],3.8));var ph=-180+mm.pm;if(ph>=c.phr[0]&&ph<=c.phr[1])o.push(S.D(bd.Pp.X(mm.wgc),bd.Pp.Y(ph),q[1],3.8));}});
      if(r>1){o.push(S.L(bd.Pm.X(z1),bd.Pm.y,bd.Pm.X(z1),bd.Pp.y+bd.Pp.h,"faint",1,"2 3"));o.push(S.TX(bd.Pm.X(z1)+3,bd.Pm.y+11,"ω_z1","start",9,"signal",true,true));}
      var lg=[["muted","5 3","比例 "+_w13_g(c.Kp,3)]];if(cmp.get()&&r>1)lg.push(["alias","5 3","比例 "+_w13_g(c.Kp*r,3)]);lg.push(["signal",null,"遅れ補償"]);
      o.push(S.LEGL(bx-40,bd.h+2,lg,9,10));
      /* 時間の応答 */
      var tx=nar?58:432,ty=nar?bd.h+40:24,tw=nar?320:238,th=nar?150:262;
      var G=ctl.loop(P,C),G0=ctl.loop(P,C0),GK=ctl.loop(P,CK),n=1600;
      var ps=ctl.poles(G.Gyr),slow=Infinity;ps.forEach(function(p){if(Math.abs(p.re)>1e-9)slow=Math.min(slow,Math.abs(p.re));});
      var tE=c.tEnd;if(r>1&&isFinite(slow))tE=Math.min(30,Math.max(c.tEnd,4/slow));
      var sets=[[G0,"muted","5 3"]];if(cmp.get()&&r>1)sets.push([GK,"alias","5 3"]);sets.push([G,"signal",null]);
      var Q,ytop,res=[];
      if(c.mode==="step"){
        sets.forEach(function(q){var R=ctl.step(q[0].Gyr,tE,n);res.push(R);});
        ytop=1.15;Q=U.plot(tx,ty+14,tw,th,[0,tE],[0,ytop]);
        o.push(S.T(tx-48,ty+2,"(b) 目標の速度を 1 m/s にしたときの速度","start",10.5,"ink",true));
        o.push(Q.axes({xl:"時間 t [s]",yl:"速度 [m/s]",xt:U.nice(0,tE,5),yt:[0,0.25,0.5,0.75,1],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
        o.push(Q.line([[0,1],[tE,1]],"muted",1.1,"5 3"));
        var yf=ctl.dcgain(G.Gyr);o.push(S.RECT(Q.x,Q.Y(yf*1.02),Q.w,Q.Y(yf*0.98)-Q.Y(yf*1.02),0,U.soft("green"),"none",0));
        sets.forEach(function(q,i){var R=res[i];o.push(Q.clip(R.t.map(function(t,k){return [t,R.y[k]];}),q[1],q[2]?1.7:2.2,q[2]));});
      }else{
        /* ランプ 1/s² への偏差 E = S/s² は、S/s のステップ応答として求める（ステップは零次ホールドで正確に表せる） */
        sets.forEach(function(q){var R=ctl.step(ctl.tf(q[0].S.num,ctl.poly.mul(q[0].S.den,[1,0])),tE,n);res.push(R);});
        var e0=1/(50*c.Kp),ymax=Math.max(0.03,e0*1.25);ytop=ymax;Q=U.plot(tx,ty+14,tw,th,[0,tE],[0,ymax]);
        o.push(S.T(tx-48,ty+2,"(b) 1 rad/s で回る目標への偏差","start",10.5,"ink",true));
        o.push(Q.axes({xl:"時間 t [s]",yl:"偏差 [rad]",xt:U.nice(0,tE,5),yt:U.nice(0,ymax,4),xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
        sets.forEach(function(q,i){var R=res[i];o.push(Q.clip(R.t.map(function(t,k){return [t,R.y[k]];}),q[1],q[2]?1.7:2.2,q[2]));});
      }
      var Hh=nar?ty+14+th+44:Math.max(bd.h+22,ty+14+th+44);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var h="";
      if(c.mode==="step"){
        /* 読み出しは細かい刻み（0.5 ms ほど）で計算し直す */
        var K=0.5*c.Kp,ef=1/(1+K*r),tL=isFinite(slow)?Math.max(20,15/slow):20,RL=ctl.step(G.Gyr,tL,Math.min(80000,Math.round(tL/0.0005))),met=_w13_met(RL.t,RL.y,ctl.dcgain(G.Gyr)),R0=ctl.step(G0.Gyr,2,4000),met0=_w13_met(R0.t,R0.y,ctl.dcgain(G0.Gyr));
        h+="定常偏差: 式 1/(1 + 4 × "+r+") = <b>"+_w13_g(ef,3)+" m/s</b>（数値計算 t = "+_w13_g(tL,3)+" s で "+_w13_g(1-RL.y[RL.y.length-1],3)+" m/s。比例だけ 0.2 m/s）<br>";
        h+="2 % 整定時間: 遅れ補償 <b>"+(isFinite(met.ts)?_w13_g(met.ts,3)+" s":"範囲の外")+"</b>、比例 "+_w13_g(c.Kp,3)+" は "+_w13_g(met0.ts,3)+" s<br>";
        h+="50 rad/s の観測ノイズが制御量に現れる割合 |G<sub>yr</sub>(j50)|: 遅れ補償 <b>"+_w13_g(ctl.cx.abs(ctl.freq(G.Gyr,50)),3)+"</b>、比例 "+_w13_g(c.Kp*r,3)+" は "+_w13_g(ctl.cx.abs(ctl.freq(GK.Gyr,50)),3)+"<br>";
      }else{
        var Kv=50*c.Kp*r,tL2=isFinite(slow)?Math.max(20,15/slow):20,R2=ctl.step(ctl.tf(G.S.num,ctl.poly.mul(G.S.den,[1,0])),tL2,4000);
        h+="定常速度偏差: 式 1/("+_w13_g(50*c.Kp,3)+" × "+r+") = <b>"+_w13_g(1/Kv,3)+" rad</b>（数値計算 t = "+_w13_g(tL2,3)+" s で "+_w13_g(R2.y[R2.y.length-1],3)+" rad。比例だけ 0.0952 rad）<br>";
        var St=ctl.step(G.Gyr,6,12000),ms=_w13_met(St.t,St.y,1),St0=ctl.step(G0.Gyr,6,12000),ms0=_w13_met(St0.t,St0.y,1);
        h+="目標値のステップ: 行き過ぎ量 <b>"+_w13_f(ms.mp,1)+" %</b>、2 % 整定時間 <b>"+(isFinite(ms.ts)?_w13_g(ms.ts,3)+" s":"6 s より長い")+"</b>（比例だけ "+_w13_f(ms0.mp,1)+" %・"+_w13_g(ms0.ts,3)+" s）<br>";
      }
      h+="交差角周波数・位相余裕: 遅れ補償 <b>"+(m.wgc?_w13_g(m.wgc,3)+" rad/s・"+_w13_f(m.pm,1)+"°":"—")+"</b>、比例 "+_w13_g(c.Kp,3)+" は "+_w13_g(m0.wgc,3)+" rad/s・"+_w13_f(m0.pm,1)+"°"+(cmp.get()&&r>1?"、比例 "+_w13_g(c.Kp*r,3)+" は "+_w13_g(mK.wgc,3)+" rad/s・"+_w13_f(mK.pm,1)+"°":"")+"<br>";
      if(r>1)h+="閉ループの極（遅れ補償）: "+_w13_poles(ps)+"（遅い極が尾を残す）";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 3 節: 位相進み補償 ---- */
  REG.w13_lead=function(el,U){
    var S=U.S,ctl=U.ctl,P=ctl.tf(_W13_MPOS.num,_W13_MPOS.den);
    U.head(el,"LEAD","位相進み補償 — 位相の山を交差に重ねる（モータの位置 1000/(s(s + 20))）");
    var r1=U.ctrls(el);
    var al=U.slider(r1,"α = ω<sub>p2</sub>/ω<sub>z2</sub>",{values:[1,1.5,2,3,4,5,7,10,11,15,20,30],value:3,fmt:function(v){return v===1?"1（進み補償なし）":String(v);},onInput:draw});
    var wc=U.slider(r1,"山の中心 ω<sub>c</sub>",{min:3,max:300,log:true,value:30,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:draw});
    var r2=U.ctrls(el);
    var md=U.select(r2,"全体のゲイン K<sub>c</sub> の決め方",["山の中心で交差させる（手順 4）","全体のゲインを固定する"],0,function(){kc.el.style.display=md.get()===1?"":"none";draw();});
    var kc=U.slider(r2,"K<sub>c</sub>",{min:0.05,max:20,log:true,value:0.625,fmt:function(v){return _w13_g(v,3)+" V/rad";},onInput:draw});
    kc.el.style.display="none";
    var br=U.btnrow(el);
    U.button(br,"本文の例（α = 3、30 rad/s）",function(){al.set(3);wc.set(30);md.set(0);kc.el.style.display="none";draw();});
    U.button(br,"比例だけで 30 rad/s",function(){al.set(1);wc.set(30);md.set(0);kc.el.style.display="none";draw();});
    U.button(br,"10 章の PD（N = 10）",function(){al.set(11);wc.set(126.7);md.set(1);kc.el.style.display="";kc.set(0.84);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var a=al.get(),w0=wc.get(),z2=w0/Math.sqrt(a),p2=w0*Math.sqrt(a),Pm0=ctl.cx.abs(ctl.freq(P,w0));
      var Kc=md.get()===0?1/(Math.sqrt(a)*Pm0):kc.get();
      if(md.get()===0)kc.set(Kc);
      var C=a===1?ctl.tf([Kc],[1]):_w13_C(U,Kc,null,[z2,p2]),L=ctl.series(P,C);
      var mg=ctl.margins(L,1e-3,1e5);
      /* 比べる比例制御: 同じ交差（中心で交差させるとき）か、同じ K_c */
      var Kp=md.get()===0?1/Pm0:Kc,Cp=ctl.tf([Kp],[1]),Lp=ctl.series(P,Cp),mp=ctl.margins(Lp,1e-3,1e5);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[],ws=ctl.logspace(0,3,500);
      /* (a) 進み補償器 */
      var bx=nar?58:62,bw=nar?320:280;
      var Bc=ctl.bode(a===1?ctl.tf([1],[1]):_w13_C(U,1,null,[z2,p2]),ws);
      var b1=ctl.bodeSvg([{w:ws,db:Bc.db,ph:Bc.ph,c:"teal",lw:2.2}],{x:bx,y:24,w:bw,hm:80,hp:70,gap:26,wr:[1,1000],dbr:[0,30],phr:[0,90]});
      o.push(S.TX(bx-48,14,"(a) 進み補償器 (1 + s/ω_{z2})/(1 + s/ω_{p2})","start",10.5,"ink",true));o.push(b1.svg);
      var phm=Math.asin((a-1)/(a+1))*180/Math.PI;
      if(a>1&&w0>=1&&w0<=1000){o.push(S.D(b1.Pp.X(w0),b1.Pp.Y(phm),"teal",4));o.push(S.D(b1.Pm.X(w0),b1.Pm.Y(10*Math.log10(a)),"teal",4));
        o.push(S.TX(b1.Pp.X(w0)+(w0>100?-6:6),b1.Pp.Y(phm)+(phm>60?14:-6),"φ_max = "+_w13_f(phm,1)+"°",w0>100?"end":"start",9.5,"teal",true,true));}
      /* (b) 一巡伝達関数 */
      var y2=nar?b1.h+16:24,bx2=nar?58:410,bw2=nar?320:270;
      var B=ctl.bode(L,ws),Bp=ctl.bode(Lp,ws);
      var b2=ctl.bodeSvg([{w:ws,db:Bp.db,ph:Bp.ph,c:"alias",dash:"5 3",lw:1.8},{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4}],{x:bx2,y:y2+10,w:bw2,hm:80,hp:70,gap:26,wr:[1,1000],dbr:[-40,40],phr:[-180,-90]});
      o.push(S.TX(bx2-48,y2,"(b) 一巡伝達関数と位相余裕","start",10.5,"ink",true));o.push(b2.svg);
      [[mp,"alias"],[mg,"signal"]].forEach(function(q){var m=q[0];if(m.wgc&&m.wgc>=1&&m.wgc<=1000){o.push(S.D(b2.Pm.X(m.wgc),b2.Pm.Y(0),q[1],3.8));var ph=-180+m.pm;
        if(ph>=-180&&ph<=-90)o.push(S.L(b2.Pp.X(m.wgc)+(q[1]==="signal"?2:-2),b2.Pp.Y(-180),b2.Pp.X(m.wgc)+(q[1]==="signal"?2:-2),b2.Pp.Y(ph),q[1],2.2));}});
      if(w0>=1&&w0<=1000)o.push(S.L(b2.Pm.X(w0),b2.Pm.y,b2.Pm.X(w0),b2.Pp.y+b2.Pp.h,"teal",1,"2 3"));
      /* (c) s 平面 */
      var y3=nar?b2.h+16:Math.max(b1.h,b2.h)+14,sx=nar?70:62,sw=nar?140:150,sh=nar?160:170;
      var xr=[-Math.max(60,Math.min(450,p2*1.15)),5],Pz=U.plot(sx,y3+14,sw,sh,xr,[-60,60]);
      o.push(S.T(sx-48,y3+2,"(c) 極と零点","start",10.5,"ink",true));
      o.push(S.RECT(Pz.x,Pz.y,Pz.w,Pz.h,0,"var(--screen)","line",0.8));o.push(ctl.splane(Pz,{}));
      o.push(Pz.axes({xl:"実部",yl:"虚部",xt:U.nice(xr[0],0,3),yt:[-60,-30,0,30,60],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,3);},sz:8.5}));
      var olp=[ctl.c(0,0),ctl.c(-20,0)],olz=[];if(a>1){olp.push(ctl.c(-p2,0));olz.push(ctl.c(-z2,0));}
      o.push(ctl.pz(Pz,olp,olz,"muted",5));
      var Gc=ctl.loop(P,C),Gp=ctl.loop(P,Cp);
      o.push(ctl.pz(Pz,ctl.poles(Gp.Gyr),[],"alias",5));o.push(ctl.pz(Pz,ctl.poles(Gc.Gyr),[],"signal",5.5));
      /* (d) ステップ応答 */
      var tx=nar?58:(sx+sw+64),tw=nar?320:(Wd-tx-20),ty=nar?y3+14+sh+44:y3;
      var tE=0.6,Rc=ctl.step(Gc.Gyr,tE,1500),Rp=ctl.step(Gp.Gyr,tE,1500);
      var Q=U.plot(tx,ty+14,tw,sh,[0,tE],[0,1.8]);
      o.push(S.T(tx-48,ty+2,"(d) 目標の角度を 1 rad 変えたときの角度","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",yl:"角度 [rad]",xt:[0,0.1,0.2,0.3,0.4,0.5,0.6],yt:[0,0.5,1,1.5],xfmt:function(v){return _w13_g(v,2);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(Q.line([[0,1],[tE,1]],"muted",1.1,"5 3"));
      o.push(Q.clip(Rp.t.map(function(t,k){return [t,Rp.y[k]];}),"alias",1.8,"5 3"));
      o.push(Q.clip(Rc.t.map(function(t,k){return [t,Rc.y[k]];}),"signal",2.3));
      var Hh=ty+14+sh+44;o.push(S.LEGL(tx-40,Hh-2,[["alias","5 3",md.get()===0?"比例だけで同じ交差":"比例だけ（同じ K_c）"],["signal",null,"進み補償"]],9,10));
      box.set(S.svg(Wd,Hh+8,o));
      /* 読み出し */
      var mc=_w13_met(Rc.t,Rc.y,1),mpp=_w13_met(Rp.t,Rp.y,1),stc=_w13_rhp(ctl.poles(Gc.Gyr)),stp=_w13_rhp(ctl.poles(Gp.Gyr));
      var h="最大位相進み: sin φ<sub>max</sub> = (α − 1)/(α + 1) から <b>"+_w13_f(phm,1)+"°</b>（ω<sub>c</sub> = √(ω<sub>z2</sub>ω<sub>p2</sub>) = "+_w13_g(w0,3)+" rad/s で、そこでのゲインは √α = "+_w13_g(Math.sqrt(a),3)+" 倍）<br>";
      if(a>1)h+="折れ点: ω<sub>z2</sub> = "+_w13_g(z2,3)+" rad/s、ω<sub>p2</sub> = "+_w13_g(p2,3)+" rad/s。";
      h+="K<sub>c</sub> = <b>"+_w13_g(Kc,3)+" V/rad</b>、高い角周波数のゲイン K<sub>c</sub>α = "+_w13_g(Kc*a,3)+" V/rad（目標を 1 rad 変えた瞬間の電圧）<br>";
      h+="進み補償: "+(mg.wgc?"交差 "+_w13_g(mg.wgc,3)+" rad/s、位相余裕 <b>"+_w13_f(mg.pm,1)+"°</b>":"交差なし")+(stc?' <span class="warn">不安定</span>':"、行き過ぎ量 "+_w13_f(mc.mp,1)+" %、2 % 整定時間 "+(isFinite(mc.ts)?_w13_g(mc.ts,3)+" s":"—"))+"<br>";
      h+=(md.get()===0?"比例だけで同じ交差（K = "+_w13_g(Kp,3)+" V/rad）: ":"比例だけ（K = "+_w13_g(Kp,3)+" V/rad）: ")+(mp.wgc?"交差 "+_w13_g(mp.wgc,3)+" rad/s、位相余裕 "+_w13_f(mp.pm,1)+"°":"")+(stp?"":"、行き過ぎ量 "+_w13_f(mpp.mp,1)+" %")+"<br>";
      h+="閉ループの極（進み補償）: "+_w13_poles(ctl.poles(Gc.Gyr));
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 5 節: 水床効果 ---- */
  /* ∫_0^∞ ln|S(jω)| dω を、0 を横切る所で分けて数値積分する（対数の刻みで 1e-6〜1e6 rad/s、台形の公式を ω について） */
  function _w13_wb(U,L){var ctl=U.ctl,ws=ctl.logspace(-6,6,24000),neg=0,pos=0,prev=null,pw=0;
    ws.forEach(function(w){var v=-Math.log(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))));
      if(prev!==null){var a=(prev+v)/2*(w-pw);if(a<0)neg+=a;else pos+=a;}prev=v;pw=w;});
    return {neg:neg,pos:pos};}
  REG.w13_waterbed=function(el,U){
    var S=U.S,ctl=U.ctl,P=ctl.tf(_W13_MPOS.num,_W13_MPOS.den);
    U.head(el,"WATERBED","水床効果 — 感度関数を下げた分だけ、別の所が上がる（モータの位置 1000/(s(s + 20))）");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>c</sub>",{values:[0.05,0.1,0.21,0.42,0.84,1.5,2.5,4],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var lr=U.slider(r1,"遅れ補償器の倍率（零点 1 rad/s）",{values:[1,3,10,30],value:1,fmt:function(v){return v===1?"なし":v+" 倍";},onInput:draw});
    var r2=U.ctrls(el);
    var wf=U.slider(r2,"速い所を下げるフィルタ 1/(1 + s/ω<sub>f</sub>)<sup>2</sup> の折れ点",{values:[0,1000,300,150,100,60,40],value:0,fmt:function(v){return v===0?"なし":v+" rad/s";},onInput:draw});
    var br=U.btnrow(el);
    function setv(K,r,f){kp.set(K);lr.set(r);wf.set(f);draw();}
    U.button(br,"本文の例（0.21 V/rad）",function(){setv(0.21,1,0);});
    U.button(br,"0.84 V/rad",function(){setv(0.84,1,0);});
    U.button(br,"4 V/rad",function(){setv(4,1,0);});
    U.button(br,"0.21 V/rad + 遅れ補償器 10 倍",function(){setv(0.21,10,0);});
    U.button(br,"0.84 V/rad + フィルタ 100 rad/s",function(){setv(0.84,1,100);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var K=kp.get(),r=lr.get(),f=wf.get(),PO=ctl.poly,num=[K],den=[1];
      if(r>1){num=PO.mul(num,[1,1]);den=PO.mul(den,[1,1/r]);}
      if(f>0){den=PO.mul(den,PO.mul([1/f,1],[1/f,1]));}
      var C=ctl.tf(num,den),L=ctl.series(P,C),G=ctl.loop(P,C),ps=ctl.poles(G.Gyr),uns=_w13_rhp(ps);
      var wb=_w13_wb(U,L),sm=ctl.smax(L,1e-3,1e5),mg=ctl.margins(L,1e-3,1e5);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[];
      /* (a) 対数でない目盛 */
      var x0=nar?58:62,wA=nar?320:360,hA=170,wmax=mg.wgc?Math.min(600,Math.max(60,8*mg.wgc)):200;
      var Pa=U.plot(x0,30,wA,hA,[0,wmax],[-2.5,2]);
      o.push(S.T(x0-48,16,"(a) ln|S(jω)|（対数でない目盛の ω）","start",10.5,"ink",true));
      var xs=ctl.linspace(wmax/2000,wmax,1000),vs=xs.map(function(w){return -Math.log(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))));});
      var negp=[[Pa.X(0),Pa.Y(0)]],posp=[];
      /* 塗り: 0 より下は緑、上は赤（縦の目盛の外は切る） */
      var segN=[],segP=[];xs.forEach(function(w,i){var v=Math.max(-2.5,Math.min(2,vs[i]));if(v<0)segN.push([Pa.X(w),Pa.Y(v)]);else segN.push([Pa.X(w),Pa.Y(0)]);if(v>0)segP.push([Pa.X(w),Pa.Y(v)]);else segP.push([Pa.X(w),Pa.Y(0)]);});
      o.push(S.PL([[Pa.X(xs[0]),Pa.Y(0)]].concat(segN).concat([[Pa.X(wmax),Pa.Y(0)]]),"none",0,"green",null,0.25));
      o.push(S.PL([[Pa.X(xs[0]),Pa.Y(0)]].concat(segP).concat([[Pa.X(wmax),Pa.Y(0)]]),"none",0,"alias",null,0.25));
      o.push(Pa.axes({xl:"角周波数 ω [rad/s]",yl:"ln|S|",xt:U.nice(0,wmax,5),yt:[-2,-1,0,1,2],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.L(Pa.x,Pa.Y(0),Pa.x+Pa.w,Pa.Y(0),"muted",1));
      o.push(Pa.clip(xs.map(function(w,i){return [w,vs[i]];}),"signal",2));
      o.push(S.T(Pa.x+Pa.w-4,Pa.y+14,"緑 "+_w13_f(wb.neg,2)+"・赤 +"+_w13_f(wb.pos,2),"end",10,"ink",true,false,null,true));
      /* (b) ボード線図の |S| と |PC| */
      var y2=nar?30+hA+56:30,x2=nar?58:478,wB=nar?320:202,hB=nar?150:170;
      var Pb=U.plot(x2,y2,wB,hB,[1,3000],[-40,20],{xlog:true});
      o.push(S.T(x2-48+(nar?0:28),y2-14,"(b) |S| と |PC| [dB]","start",10.5,"ink",true));
      o.push(Pb.axes({xl:"ω [rad/s]",yl:nar?"ゲイン [dB]":null,xt:[1,10,100,1000],yt:[-40,-20,0,20],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.L(Pb.x,Pb.Y(0),Pb.x+Pb.w,Pb.Y(0),"muted",1));
      var wl=ctl.logspace(0,Math.log10(3000),400),BL=ctl.bode(L,wl);
      o.push(Pb.clip(wl.map(function(w,i){return [w,BL.db[i]];}),"faint",1.6,"4 3"));
      o.push(Pb.clip(wl.map(function(w){return [w,-20*Math.log10(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))))];}),"signal",2.2));
      if(sm.w>=1&&sm.w<=3000&&isFinite(sm.Ms)){o.push(S.D(Pb.X(sm.w),Pb.Y(Math.min(20,20*Math.log10(sm.Ms))),"alias",4));}
      /* (c) ナイキスト線図（−1 のまわり） */
      var y3=nar?y2+hB+62:y2+hB+62,cs=nar?220:150,x3=nar?90:x2+26;
      var cp=S.CPLANE(x3,y3,cs,cs,[-2.5,1],[-2.5,1],{unit:true,m1:true});o.push(cp.svg);var Pc=cp.P;
      o.push(S.T(x3-(nar?32:0),y3-8,"(c) −1 の点との距離","start",10.5,"ink",true));
      var wn=ctl.logspace(-1,4,1500),pts=wn.map(function(w){var v=ctl.freq(L,w);return [v.re,v.im];});
      o.push(Pc.clip(pts,"signal",2));
      if(isFinite(sm.Ms)&&!uns){var rr=1/sm.Ms,circ=[];for(var i=0;i<=90;i++){var t=2*Math.PI*i/90;circ.push([-1+rr*Math.cos(t),rr*Math.sin(t)]);}o.push(Pc.clip(circ,"alias",1.3,"4 3"));
        var vm=ctl.freq(L,sm.w);o.push(S.L(Pc.X(-1),Pc.Y(0),Pc.X(vm.re),Pc.Y(vm.im),"alias",1.4));}
      var Hh=nar?y3+cs+30:Math.max(30+hA+44,y3+cs+30);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var h="";
      if(uns)h+='<span class="warn">閉ループが不安定</span>（閉ループの極: '+_w13_poles(ps)+'）。積分が 0 になる条件（閉ループが安定）を満たさない<br>';
      h+="∫ ln|S(jω)| dω: 0 より下（緑） <b>"+_w13_f(wb.neg,2)+"</b>、上（赤） <b>+"+_w13_f(wb.pos,2)+"</b>、和 "+_w13_f(wb.neg+wb.pos,3)+"（1e−6〜1e6 rad/s で数値積分。0 に近いことを確かめる）<br>";
      h+="最大感度 M<sub>s</sub> = <b>"+_w13_g(sm.Ms,3)+"</b>（"+_w13_g(sm.w,3)+" rad/s）、−1 の点との最短距離 1/M<sub>s</sub> = "+_w13_g(1/sm.Ms,3)+"<br>";
      h+="交差 "+(mg.wgc?_w13_g(mg.wgc,3)+" rad/s、位相余裕 "+_w13_f(mg.pm,1)+"°":"—")+(mg.gmDb!=null?"、ゲイン余裕 "+_w13_f(mg.gmDb,1)+" dB":"");
      ro.innerHTML=h+'<div class="wnote">(a) の横軸は対数でない目盛で、描いた範囲の外の面積も数値に含めた。縦の目盛の外（−2.5 より下）は描いていない。</div>';
    }
    draw();
  };

  /* ---- 6 節: ループ整形の設計 ---- */
  REG.w13_shape=function(el,U){
    var S=U.S,ctl=U.ctl,P=ctl.tf(_W13_MPLA.num,_W13_MPLA.den);
    var DEF={Kc:1.69706,p1:0.15,z1:1.5,z2:26.8328,p2:134.164,lag:true,lead:true};   /* 6 節の設計（√5 などを丸めない値） */
    U.head(el,"LOOP SHAPING","ループ整形 — 折れ点を動かし、余裕・感度・応答を同時に見る（モータの位置、L<sub>a</sub> を含む）");
    var r1=U.ctrls(el);
    var kc=U.slider(r1,"全体のゲイン K<sub>c</sub>",{min:0.05,max:20,log:true,value:DEF.Kc,fmt:function(v){return _w13_s3(v)+" V/rad";},onInput:draw});
    var ulag=U.checkbox(r1,"遅れ補償器",true,draw),ulead=U.checkbox(r1,"進み補償器",true,draw);
    var r2=U.ctrls(el);
    var sp1=U.slider(r2,"ω<sub>p1</sub>",{min:0.01,max:10,log:true,value:DEF.p1,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("p1");draw();}});
    var sz1=U.slider(r2,"ω<sub>z1</sub>",{min:0.1,max:30,log:true,value:DEF.z1,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("z1");draw();}});
    var sz2=U.slider(r2,"ω<sub>z2</sub>",{min:3,max:300,log:true,value:DEF.z2,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("z2");draw();}});
    var sp2=U.slider(r2,"ω<sub>p2</sub>",{min:10,max:3000,log:true,value:DEF.p2,fmt:function(v){return _w13_g(v,3)+" rad/s";},onInput:function(){fix("p2");draw();}});
    var SL={p1:sp1,z1:sz1,z2:sz2,p2:sp2};
    /* 並び ω_p1 < ω_z1、ω_z2 < ω_p2 を保つ */
    function fix(k){var p1=sp1.get(),z1=sz1.get(),z2=sz2.get(),p2=sp2.get();
      if(k==="p1"&&p1>=z1*0.99)sz1.set(Math.min(30,p1*1.05));if(k==="z1"&&z1<=p1*1.01)sp1.set(Math.max(0.01,z1/1.05));
      if(k==="z2"&&z2>=p2*0.99)sp2.set(Math.min(3000,z2*1.05));if(k==="p2"&&p2<=z2*1.01)sz2.set(Math.max(3,p2/1.05));}
    var br=U.btnrow(el);
    function setd(o){kc.set(o.Kc);sp1.set(o.p1);sz1.set(o.z1);sz2.set(o.z2);sp2.set(o.p2);ulag.set(o.lag);ulead.set(o.lead);draw();}
    U.button(br,"本文の例（進み遅れ）",function(){setd(DEF);});
    U.button(br,"遅れ補償器の零点を 6 rad/s に",function(){setd({Kc:DEF.Kc,p1:0.6,z1:6,z2:DEF.z2,p2:DEF.p2,lag:true,lead:true});});
    U.button(br,"進み補償だけ",function(){setd({Kc:DEF.Kc,p1:0.15,z1:1.5,z2:DEF.z2,p2:DEF.p2,lag:false,lead:true});});
    U.button(br,"比例だけ（1.70 V/rad）",function(){setd({Kc:DEF.Kc,p1:0.15,z1:1.5,z2:DEF.z2,p2:DEF.p2,lag:false,lead:false});});
    U.button(br,"10 章の PD（N = 10）",function(){setd({Kc:0.84,p1:0.15,z1:1.5,z2:38.2,p2:420,lag:false,lead:true});});
    var box=U.svgbox(el),ro=U.readout(el),last=null,grab=null;
    /* ドラッグ: 折れ点の印（ゲインの図の下の並び）を左右に、図のほかの所を上下に動かすと K_c が変わる */
    ctl.drag(box,function(type,x,y){
      if(!last)return type==="down"?false:undefined;var Pm=last.Pm;
      if(type==="down"){grab=null;var best=14;last.marks.forEach(function(m){var d=Math.hypot(x-m.x,y-m.y);if(d<best){best=d;grab={k:m.k};}});
        if(!grab&&x>=Pm.x&&x<=Pm.x+Pm.w&&y>=Pm.y&&y<=Pm.y+Pm.h)grab={k:"K",y0:y,K0:kc.get()};
        if(!grab)return false;return;}
      if(type==="up"){grab=null;return;}
      if(!grab)return;
      if(grab.k==="K"){var ddb=(Pm.uy(y)-Pm.uy(grab.y0));kc.set(Math.max(0.05,Math.min(20,grab.K0*Math.pow(10,ddb/20))));}
      else{var w=Pm.ux(Math.max(Pm.x,Math.min(Pm.x+Pm.w,x))),sl=SL[grab.k],lim={p1:[0.01,10],z1:[0.1,30],z2:[3,300],p2:[10,3000]}[grab.k];sl.set(Math.max(lim[0],Math.min(lim[1],w)));fix(grab.k);}
      draw();});
    function draw(){
      var Kc=kc.get(),lag=ulag.get()?[sz1.get(),sp1.get()]:null,lead=ulead.get()?[sz2.get(),sp2.get()]:null;
      [sp1,sz1].forEach(function(s){s.el.style.opacity=lag?"1":"0.45";});[sz2,sp2].forEach(function(s){s.el.style.opacity=lead?"1":"0.45";});
      var C=_w13_C(U,Kc,lag,lead),L=ctl.series(P,C),G=ctl.loop(P,C),ps=ctl.poles(G.Gyr),uns=_w13_rhp(ps);
      var mg=ctl.margins(L,1e-3,1e5),sm=ctl.smax(L,1e-3,1e5),Kv=50*Kc*(lag?lag[0]/lag[1]:1),hf=Kc*(lead?lead[1]/lead[0]:1);
      var nar=_w13_nar(box),Wd=nar?400:700,o=[];
      /* (a) 一巡伝達関数と仕様 */
      var bx=nar?58:62,bw=nar?320:330,wr=[0.01,3000],ws=ctl.logspace(-2,Math.log10(3000),700),B=ctl.bode(L,ws);
      var bd=ctl.bodeSvg([{w:ws,db:B.db,ph:B.ph,c:"signal",lw:2.4}],{x:bx,y:26,w:bw,hm:150,hp:100,gap:28,wr:wr,dbr:[-60,120],phr:[-270,-90]});
      o.push(S.TX(bx-48,14,"(a) 一巡伝達関数（折れ点の印をドラッグ）","start",10.5,"ink",true));o.push(bd.svg);
      var Pm=bd.Pm,Pp=bd.Pp;
      o.push(Pm.clip([[0.01,20*Math.log10(500/0.01)],[5,20*Math.log10(100)]],"alias",1.5,"5 3"));
      o.push(S.T(Pm.X(5)+4,Pm.Y(40),"500/ω","start",9,"alias",true,false,null,true));
      o.push(S.L(Pm.X(60),Pm.y,Pm.X(60),Pp.y+Pp.h,"faint",1,"2 3"));o.push(S.TX(Pm.X(60)+3,Pm.y+11,"60 rad/s","start",9,"muted",false,true));
      o.push(S.L(Pp.x,Pp.Y(-130),Pp.x+Pp.w,Pp.Y(-130),"green",1,"4 3"));o.push(S.T(Pp.x+4,Pp.Y(-130)-4,"位相余裕 50°","start",9,"green",false,false,null,true));
      if(mg.wgc&&mg.wgc>=wr[0]&&mg.wgc<=wr[1]){o.push(S.D(Pm.X(mg.wgc),Pm.Y(0),"signal",4));var phg=-180+mg.pm;if(phg>=-270&&phg<=-90)o.push(S.L(Pp.X(mg.wgc),Pp.Y(-180),Pp.X(mg.wgc),Pp.Y(phg),mg.pm>0?"green":"alias",2.4));}
      /* 折れ点の印 */
      var marks=[],yb=Pm.y+Pm.h-9;
      function mk(k,w,zero,on){if(!on)return;var xx=Pm.X(w);if(xx<Pm.x||xx>Pm.x+Pm.w)return;marks.push({k:k,x:xx,y:yb});
        if(zero)o.push(S.CIRC(xx,yb,5.5,"gold",2,"var(--screen)"));else o.push(S.X(xx,yb,5.5,"gold",2.2));
        o.push(S.TX(xx,yb-10,{p1:"ω_p1",z1:"ω_z1",z2:"ω_z2",p2:"ω_p2"}[k],"middle",9,"gold",true,true));}
      mk("p1",sp1.get(),false,!!lag);mk("z1",sz1.get(),true,!!lag);mk("z2",sz2.get(),true,!!lead);mk("p2",sp2.get(),false,!!lead);
      /* (b) |S| */
      var x2=nar?58:470,y2=nar?bd.h+30:26,w2=nar?320:210,h2=nar?120:120;
      var Pb=U.plot(x2,y2+14,w2,h2,[0.1,3000],[-40,15],{xlog:true});
      o.push(S.T(x2-48+(nar?0:20),y2+2,"(b) |S(jω)| [dB]","start",10.5,"ink",true));
      o.push(Pb.axes({xl:"ω [rad/s]",yl:nar?"ゲイン [dB]":null,xt:[0.1,1,10,100,1000],yt:[-40,-20,0,10],xfmt:function(v){return _w13_g(v,3);},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.L(Pb.x,Pb.Y(0),Pb.x+Pb.w,Pb.Y(0),"muted",1));
      var wl=ctl.logspace(-1,Math.log10(3000),400);
      o.push(Pb.clip(wl.map(function(w){return [w,-20*Math.log10(ctl.cx.abs(ctl.cx.add(ctl.c(1,0),ctl.freq(L,w))))];}),uns?"alias":"signal",2.2));
      if(!uns&&isFinite(sm.Ms)&&sm.w>=0.1&&sm.w<=3000)o.push(S.D(Pb.X(sm.w),Pb.Y(Math.min(15,20*Math.log10(sm.Ms))),"alias",4));
      /* (c) 角度と (d) 電圧 */
      var y3=nar?y2+h2+60:y2+h2+56,x3=nar?58:470,w3=nar?320:210,tE=0.4;
      var Ry=ctl.step(G.Gyr,tE,800),Ru=ctl.step(G.Gur,tE,800);
      var Pc=U.plot(x3,y3+14,w3,100,[0,tE],[0,1.6]);
      o.push(S.T(x3-48+(nar?0:20),y3+2,"(c) 角度（目標 1 rad）","start",10.5,"ink",true));
      o.push(Pc.axes({xl:null,yl:nar?"角度 [rad]":null,xt:[0,0.1,0.2,0.3,0.4],yt:[0,0.5,1,1.5],xfmt:function(){return "";},yfmt:function(v){return _w13_g(v,2);},sz:9}));
      o.push(S.RECT(Pc.x,Pc.Y(1.02),Pc.w,Pc.Y(0.98)-Pc.Y(1.02),0,U.soft("green"),"none",0));
      o.push(Pc.line([[0,1],[tE,1]],"muted",1.1,"5 3"));
      o.push(Pc.clip(Ry.t.map(function(t,k){return [t,Ry.y[k]];}),uns?"alias":"signal",2.2));
      var y4=y3+14+100+14,umax=0;Ru.y.forEach(function(v){umax=Math.max(umax,Math.abs(v));});
      var ur=Math.max(14,Math.min(200,umax*1.1)),Pd=U.plot(x3,y4+14,w3,80,[0,tE],[-ur,ur]);
      o.push(S.T(x3-48+(nar?0:20),y4+6,"(d) 電圧 [V]","start",10.5,"ink",true));
      o.push(Pd.axes({xl:"時間 t [s]",yl:null,xt:[0,0.1,0.2,0.3,0.4],yt:[-12,0,12],xfmt:function(v){return _w13_g(v,2);},yfmt:function(v){return _w13_g(v,3);},sz:9}));
      [12,-12].forEach(function(v){o.push(S.L(Pd.x,Pd.Y(v),Pd.x+Pd.w,Pd.Y(v),"alias",1,"4 3"));});
      o.push(Pd.clip(Ru.t.map(function(t,k){return [t,Ru.y[k]];}),"gold",2));
      var Hh=nar?y4+14+80+40:Math.max(bd.h+10,y4+14+80+40);
      box.set(S.svg(Wd,Hh,o));
      last={Pm:Pm,marks:marks};
      /* 読み出し（仕様の判定） */
      var LR=ctl.step(G.Gyr,3,6000),met=_w13_met(LR.t,LR.y,1);
      function ok(b,t){return b?'<span class="ok">'+t+'</span>':'<span class="warn">'+t+'</span>';}
      var h="";
      if(uns)h+='<span class="warn">閉ループが不安定</span>（閉ループの極: '+_w13_poles(ps)+'）<br>';
      h+="仕様 1 交差 60 rad/s: "+(mg.wgc?ok(Math.abs(mg.wgc-60)<=6,_w13_g(mg.wgc,3)+" rad/s"):ok(false,"交差なし"))+"　仕様 2 位相余裕 50° 以上: "+(mg.pm!=null?ok(mg.pm>=50,_w13_f(mg.pm,1)+"°"):ok(false,"—"))+"<br>";
      h+="仕様 3 lim sPC ≥ 500 /s: "+ok(Kv>=500,_w13_g(Kv,3)+" /s（定常速度偏差 "+_w13_g(1/Kv,3)+" rad）")+"　仕様 4 高い角周波数のゲイン ≤ 12 V/rad: "+ok(hf<=12,_w13_g(hf,3)+" V/rad")+"<br>";
      h+="ゲイン余裕 "+(mg.gmDb!=null?_w13_f(mg.gmDb,1)+" dB":"—")+"、最大感度 M<sub>s</sub> = "+_w13_g(sm.Ms,3)+"（距離 "+_w13_g(1/sm.Ms,3)+"）<br>";
      if(!uns)h+="目標 1 rad のステップ: 行き過ぎ量 <b>"+_w13_f(met.mp,1)+" %</b>、2 % 整定時間 <b>"+(isFinite(met.ts)?_w13_g(met.ts,3)+" s":"3 s より長い")+"</b>、電圧の最大 "+_w13_g(umax,3)+" V"+(umax>12?' <span class="warn">（12 V を越える）</span>':"")+"<br>";
      h+="制御器: K<sub>c</sub> = "+_w13_s3(Kc)+" V/rad"+(lag?"、遅れ補償器 (s + "+_w13_g(lag[0],3)+")/(s + "+_w13_g(lag[1],3)+")":"")+(lead?"、進み補償器 α = "+_w13_g(lead[1]/lead[0],3)+"（中心 "+_w13_g(Math.sqrt(lead[0]*lead[1]),3)+" rad/s）":"");
      ro.innerHTML=h;
    }
    draw();
  };

  /* ===== 14 章 フィードフォワード・カスケード・むだ時間補償 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w14_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w14_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w14_g(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  /* |y − yf| が band の外に最後にいた後の時刻（線形補間）。入らなければ null */
  function _w14_settle(t,y,yf,band,from){from=from||0;var last=-1;for(var i=0;i<y.length;i++)if(t[i]>=from&&Math.abs(y[i]-yf)>band)last=i;
    if(last<0)return from;if(last+1>=t.length)return null;var a=Math.abs(y[last]-yf)-band,b=Math.abs(y[last+1]-yf)-band;return a!==b?t[last]+(t[last+1]-t[last])*a/(a-b):t[last+1];}
  function _w14_trapz(t,f,t0,t1){var s=0;for(var i=1;i<t.length;i++){if(t[i-1]<t0||t[i]>t1)continue;s+=0.5*(f[i]+f[i-1])*(t[i]-t[i-1]);}return s;}

  /* ---- 温度の板（60 °C・28 W からのずれ）: P = K e^{−Ls}/(Ts + 1)。図の _f14_plate と同じ計算 ----
     o = {KP, TI, b, r(t), d(t), dff(t), tEnd, h, Lt, Kt, Tt（本当の対象）, smith, Lm, Km, Tm（モデル）, ref（前置フィルタの λ）, umin, umax, every}
     smith なら、戻す値は y_p = y + ỹ0 − ỹ0(t − Lm)。ref なら、目標値を e^{−Lm s}/(λs + 1) に通し、Q r を足す。
     飽和するときは、積分をクランプで止める。返り値 {t, y, u, yp, y0, blow} */
  function _w14_plate(o){
    var h=o.h||0.025,n=Math.round(o.tEnd/h),Lt=o.Lt==null?20:o.Lt,Lm=o.Lm==null?20:o.Lm,nd=Math.round(Lt/h),ndm=Math.round(Lm/h);
    var Tt=o.Tt||500,Kt=o.Kt==null?1.25:o.Kt,Tm=o.Tm||500,Km=o.Km||1.25,KP=o.KP||0,TI=o.TI||0,b=o.b==null?1:o.b,ev=o.every||40;
    var a=Math.exp(-h/Tt),bb=Kt*(1-a),am=Math.exp(-h/Tm),bm=Km*(1-am),al=o.ref?Math.exp(-h/o.ref):0,alh=o.ref?Math.exp(-h/(2*o.ref)):0;
    var x=0,I=0,buf=new Float64Array(Math.max(nd,1)),bi=0,xm=0,bufm=new Float64Array(Math.max(ndm,1)),bim=0,z=0,zb=new Float64Array(Math.max(ndm,1)),zi=0;
    var out={t:[],y:[],u:[],yp:[],y0:[],blow:false};
    for(var k=0;k<=n;k++){
      var t=k*h,y=x,rr=o.r?o.r(t):0,rm,uff;
      if(o.ref){rm=ndm?zb[zi]:z;var zh=rr+(z-rr)*alh;uff=(Tm*(rr-zh)/o.ref+zh)/Km;}else{rm=rr;uff=0;}
      var yfb=y;if(o.smith){var yd=ndm?bufm[bim]:xm;yfb=y+xm-yd;}
      var e=rm-yfb,uc=uff+KP*(b*rm-yfb)+I+(o.dff?o.dff(t):0),u=uc;
      if(o.umax!=null&&u>o.umax)u=o.umax;if(o.umin!=null&&u<o.umin)u=o.umin;
      if(k%ev===0){out.t.push(t);out.y.push(y);out.u.push(u);out.yp.push(yfb);out.y0.push(xm);}
      if(TI&&!((o.umax!=null&&uc>o.umax&&e>0)||(o.umin!=null&&uc<o.umin&&e<0)))I+=KP*h/TI*e;
      var uin=u+(o.d?o.d(t):0),ua;if(nd){ua=buf[bi];buf[bi]=uin;bi=(bi+1)%nd;}else ua=uin;
      x=a*x+bb*ua;
      if(o.smith){if(ndm){bufm[bim]=xm;bim=(bim+1)%ndm;}xm=am*xm+bm*u;}
      if(o.ref){if(ndm){zb[zi]=z;zi=(zi+1)%ndm;}z=rr+(z-rr)*al;}
      if(!isFinite(x)||Math.abs(x)>1e6){out.blow=true;break;}
    }
    return out;}

  /* ---- 台形の速度の目標（2 節）。返り値 {f(t) → [r, r', r''], tf, v, a} ---- */
  function _w14_traj(th,v,a){var ta=v/a,da=0.5*a*ta*ta,tc;
    if(2*da>th){ta=Math.sqrt(th/a);v=a*ta;da=th/2;tc=0;}else tc=(th-2*da)/v;
    var tf=2*ta+tc;
    return {tf:tf,v:v,a:a,f:function(t){if(t<=0)return [0,0,0];if(t<ta)return [0.5*a*t*t,a*t,a];if(t<ta+tc)return [da+v*(t-ta),v,0];
      if(t<tf){var s=t-ta-tc;return [da+v*tc+v*s-0.5*a*s*s,v-a*s,-a];}return [th,0,0];}};}

  /* ---- モータの角度（L_a を無視）: T θ'' + θ' = K(v − 100 τ)。図の _f14_mff と同じ計算に、摩擦トルクを足した ----
     ff: 0 なし、1 角速度の分、2 角速度と角加速度の分（モデルの K = 50・T = 0.05 で計算）。fb: 0 なし、1 比例、2 PD（D は偏差に掛ける）。
     Jr: 本当の慣性モーメント ÷ モデル（T が Jr 倍）、kr: 本当の電圧の効き ÷ モデル、fric: 摩擦トルク [N·m]（回る向きと逆）。 */
  function _w14_mff(tr,ff,fb,Jr,kr,fric,tEnd){
    var K=50*kr,T=0.05*Jr,Km=50,Tm=0.05,KP=fb===2?0.84:(fb===1?0.21:0),KD=fb===2?0.02:0,h=1e-4,n=Math.round(tEnd/h),a=Math.exp(-h/T);
    var th=0,w=0,out={t:[],th:[],r:[],e:[],v:[],vff:[],sat:false,vmax:0};
    for(var k=0;k<=n;k++){var t=k*h,R=tr.f(t+0.5*h),R0=tr.f(t);
      var vff=(ff>=1?R[1]/Km:0)+(ff>=2?Tm*R[2]/Km:0),e=R0[0]-th,v=vff+KP*e+KD*(R0[1]-w);
      if(v>12){v=12;out.sat=true;}if(v<-12){v=-12;out.sat=true;}if(Math.abs(v)>out.vmax)out.vmax=Math.abs(v);   /* 最大は刻みごとに見る（記録は 10 刻みごと） */
      if(k%10===0){out.t.push(t);out.th.push(th);out.r.push(R0[0]);out.e.push(e);out.v.push(v);out.vff.push(vff);}
      var tq=fric*Math.tanh(w/2),wi=K*v-100*tq*K/50;           /* 摩擦は電圧 −(R_a/K_t)τ にあたる（K = 50 のとき 100 V/(N·m)） */
      th=th+wi*h+(w-wi)*T*(1-a);w=wi+(w-wi)*a;}
    return out;}

  /* ---- 2 節: 目標値のフィードフォワード（モータの角度。軸の動く絵 ↔ 波形） ---- */
  REG.w14_ff=function(el,U){
    var S=U.S;
    U.head(el,"FEEDFORWARD","目標値のフィードフォワード — モデルの逆で、偏差が生まれる前に電圧を出す");
    var r1=U.ctrls(el);
    var ffs=U.select(r1,"フィードフォワード",["なし（フィードバックだけ）","角速度の分だけ（ṙ/K）","角速度と角加速度の分（ṙ/K + Tr̈/K）"],2,run);
    var fbs=U.select(r1,"フィードバック",["なし（フィードフォワードだけ）","比例（0.21 V/rad）","PD（0.84 V/rad・0.02 V·s/rad）"],2,run);
    var r2=U.ctrls(el);
    var mv=U.slider(r2,"移動量",{values:[2,5,10,20,30],value:10,fmt:function(v){return v+" rad";},onInput:run});
    var vm=U.slider(r2,"最高の角速度",{values:[20,50,100,200,400],value:50,fmt:function(v){return v+" rad/s";},onInput:run});
    var am=U.slider(r2,"角加速度",{values:[200,500,1000,2000,5000,10000],value:500,fmt:function(v){return v+" rad/s²";},onInput:run});
    var r3=U.ctrls(el);
    var jr=U.slider(r3,"本当の慣性モーメント",{values:[0.5,0.75,1,1.25,1.5,2,3],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:run});
    var kr=U.slider(r3,"本当の電圧の効き",{values:[0.6,0.8,0.9,1,1.1,1.2],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:run});
    var fr=U.slider(r3,"摩擦トルク（モデルに無い）",{values:[0,0.001,0.002,0.005],value:0,fmt:function(v){return v+" N·m";},onInput:run});
    var r4=U.ctrls(el);
    var st=U.slider(r4,"時刻",{min:0,max:1,step:0.002,value:0.2,fmt:function(v){return R?_w14_g(v*R.tEnd,3)+" s":"";},onInput:function(){tk.stop();draw();}});
    var br=U.btnrow(el);
    var tk=U.ticker(function(){var v=st.get()+0.006;if(v>=1){v=1;tk.stop();}st.set(v);draw();},40);
    U.button(br,"▶ 再生",function(){if(st.get()>=0.999)st.set(0);tk.start();});
    U.button(br,"■ 止める",function(){tk.stop();});
    function base(){mv.set(10);vm.set(50);am.set(500);jr.set(1);kr.set(1);fr.set(0);ffs.set(2);fbs.set(2);}
    U.button(br,"本文の例",function(){tk.stop();base();st.set(0.2);run();});
    U.button(br,"慣性モーメントが 1.5 倍",function(){tk.stop();base();jr.set(1.5);run();});
    U.button(br,"電圧の効きが 0.8 倍",function(){tk.stop();base();kr.set(0.8);run();});
    U.button(br,"速く動かす（12 V に届く）",function(){tk.stop();base();vm.set(400);am.set(10000);run();});
    var box=U.svgbox(el),ro=U.readout(el),R=null;
    function run(){
      var tr=_w14_traj(mv.get(),vm.get(),am.get()),tEnd=Math.max(0.6,Math.ceil((tr.tf+0.35)*10)/10);
      var ff=+ffs.get(),fb=+fbs.get();
      R=_w14_mff(tr,ff,fb,jr.get(),kr.get(),fr.get(),tEnd);R.tEnd=tEnd;R.tr=tr;R.ff=ff;R.fb=fb;
      /* フィードバックだけの場合も、比べるために計算しておく */
      R.ref=(ff===0&&fb===2)?null:_w14_mff(tr,0,2,jr.get(),kr.get(),fr.get(),tEnd);
      st.set(st.get());                 /* 時刻の表示を、新しい長さで書き直す */
      draw();}
    function draw(){
      if(!R)return;var nar=_w14_nar(box),Wd=nar?400:700,o=[],t=R.t,n=t.length,tc=st.get()*R.tEnd,ix=Math.max(0,Math.min(n-1,Math.round(tc/(t[1]-t[0]))));
      /* 軸の動く絵 */
      var cx=nar?70:84,cy=nar?78:110,Rr=nar?50:62;
      o.push(S.T(nar?10:14,16,"モータの軸（上から見る）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,Rr,"line",1.4,"panel"));
      for(var q=0;q<12;q++){var aq=q*Math.PI/6;o.push(S.L(cx+Math.cos(aq)*(Rr-6),cy-Math.sin(aq)*(Rr-6),cx+Math.cos(aq)*Rr,cy-Math.sin(aq)*Rr,"faint",1));}
      var rt=R.r[ix],tht=R.th[ix],er=R.e[ix];
      o.push(S.L(cx,cy,cx+Math.cos(rt)*(Rr-4),cy-Math.sin(rt)*(Rr-4),"muted",3,"5 3"));
      /* 偏差の弧 */
      var steps=24,arc=[];for(var j=0;j<=steps;j++){var aj=tht+(rt-tht)*j/steps;arc.push([cx+Math.cos(aj)*(Rr*0.45),cy-Math.sin(aj)*(Rr*0.45)]);}
      if(Math.abs(er)>0.01)o.push(S.PL(arc,"alias",2.4));
      o.push(S.L(cx,cy,cx+Math.cos(tht)*(Rr-4),cy-Math.sin(tht)*(Rr-4),"signal",4));
      o.push(S.D(cx,cy,"ink",4));
      o.push(S.T(cx,cy+Rr+16,"t = "+_w14_f(tc,3)+" s","middle",10,"ink",true));
      o.push(S.T(cx,cy+Rr+31,"目標 "+_w14_f(rt,2)+" rad","middle",9.5,"muted"));
      o.push(S.T(cx,cy+Rr+45,"角度 "+_w14_f(tht,2)+" rad","middle",9.5,"signal",true));
      o.push(S.T(cx,cy+Rr+59,"偏差 "+_w14_f(er,3)+" rad","middle",9.5,Math.abs(er)>0.05?"alias":"green",true));
      /* 波形 */
      var px=nar?52:244,pw=nar?332:440,py=nar?250:22,ph=nar?70:80,gap=nar?100:112;
      var P1=U.plot(px,py,pw,ph,[0,R.tEnd],[0,R.tr.f(1e9)[0]*1.15]);
      o.push(S.T(px-(nar?42:44),py-8,"角度 [rad]（灰色の破線が目標値）","start",9.5,"ink",true));
      o.push(P1.axes({xt:U.nice(0,R.tEnd,5),yt:U.nice(0,R.tr.f(1e9)[0]*1.1,3),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,3);}}));
      o.push(P1.line(t.map(function(x,i){return [x,R.r[i]];}),"muted",2,"5 3"));
      o.push(P1.line(t.map(function(x,i){return [x,R.th[i]];}),"signal",2));
      var em=0;R.e.forEach(function(v){em=Math.max(em,Math.abs(v));});if(R.ref)R.ref.e.forEach(function(v){em=Math.max(em,Math.abs(v));});em=Math.max(em*1.15,0.05);
      var P2=U.plot(px,py+gap,pw,ph,[0,R.tEnd],[-em,em]);
      o.push(S.T(px-(nar?42:44),py+gap-8,"偏差 e [rad]"+(R.ref?"（灰色の線はフィードバックだけ）":""),"start",9.5,"ink",true));
      o.push(P2.axes({xt:U.nice(0,R.tEnd,5),yt:U.nice(-em,em,3).filter(function(v){return v>=-em&&v<=em;}),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,2);}}));
      o.push(S.L(P2.x,P2.Y(0),P2.x+P2.w,P2.Y(0),"line",1));
      o.push(S.RECT(P2.X(0),P2.y,P2.X(R.tr.tf)-P2.X(0),P2.h,0,"var(--muted-soft)","none",0,null,' fill-opacity="0.45"'));
      if(R.ref)o.push(P2.line(R.ref.t.map(function(x,i){return [x,R.ref.e[i]];}),"muted",1.4));
      o.push(P2.line(t.map(function(x,i){return [x,R.e[i]];}),"signal",2));
      var vmx=2;R.v.forEach(function(v){vmx=Math.max(vmx,Math.abs(v));});vmx=Math.min(13,vmx*1.15);
      var P3=U.plot(px,py+2*gap,pw,ph,[0,R.tEnd],[-vmx,vmx]);
      o.push(S.T(px-(nar?42:44),py+2*gap-8,"電圧 v [V]（破線はフィードフォワードの分）","start",9.5,"ink",true));
      o.push(P3.axes({xl:"時間 t [s]",xt:U.nice(0,R.tEnd,5),yt:U.nice(-vmx,vmx,3).filter(function(v){return v>=-vmx&&v<=vmx;}),xfmt:function(v){return _w14_g(v,3);},yfmt:function(v){return _w14_g(v,2);}}));
      o.push(S.L(P3.x,P3.Y(0),P3.x+P3.w,P3.Y(0),"line",1));
      if(vmx>=11){[12,-12].forEach(function(lv){o.push(S.L(P3.x,P3.Y(lv),P3.x+P3.w,P3.Y(lv),"alias",1,"4 3"));});}
      if(R.ff)o.push(P3.line(t.map(function(x,i){return [x,R.vff[i]];}),"gold",1.4,"5 3"));
      o.push(P3.line(t.map(function(x,i){return [x,R.v[i]];}),"gold",2));
      [P1,P2,P3].forEach(function(P){o.push(S.L(P.X(tc),P.y,P.X(tc),P.y+P.h,"ink",1,"2 2"));});
      box.set(S.svg(Wd,py+2*gap+ph+40,o));
      /* 読み出し */
      var mx=0,ix0=0;R.e.forEach(function(v,i){if(Math.abs(v)>mx){mx=Math.abs(v);ix0=i;}});
      var ts=_w14_settle(t,R.e,0,0.01,R.tr.tf),eEnd=R.e[R.e.length-1],vm2=R.vmax;
      var hs="目標値: "+_w14_g(mv.get(),3)+" rad を "+_w14_g(R.tr.tf,3)+" s で（最高の角速度 "+_w14_g(R.tr.v,3)+" rad/s、角加速度 "+_w14_g(R.tr.a,3)+" rad/s²）。モデルの逆の電圧は最大 "+_w14_g((R.tr.v+0.05*R.tr.a)/50,3)+" V<br>";
      hs+="偏差の最大 "+(mx<1e-4?"<b>0.0001 rad 未満</b>":"<b>"+_w14_g(mx,3)+" rad</b>（"+_w14_g(t[ix0],3)+" s）")+(R.ref?"、フィードバックだけなら "+_w14_g(Math.max.apply(null,R.ref.e.map(Math.abs)),3)+" rad":"")+"<br>";
      hs+="目標値が止まった後: "+(ts!=null?(ts<=R.tr.tf+1e-9?'<span class="ok">止まった時点で 0.01 rad 以内</span>':"0.01 rad 以内に入るのは止まってから "+_w14_g(ts-R.tr.tf,3)+" s 後"):'<span class="warn">表示した時間の中で 0.01 rad 以内に入らない</span>')+"、最後の偏差 "+_w14_f(eEnd,3)+" rad<br>";
      hs+="電圧の最大 "+_w14_g(vm2,3)+" V"+(R.sat?' <span class="warn">12 V に張り付いた（フィードフォワードどおりの電圧を出せない）</span>':"");
      ro.innerHTML=hs+'<div class="wnote">モータは電圧から角度までの K/{s(Ts + 1)}（巻線のインダクタンスを無視。モデルは K = 50 (rad/s)/V、T = 0.05 s）。フィードフォワードはモデルの値で計算し、本当の対象の慣性モーメント・電圧の効き・摩擦（回る向きと逆の一定のトルク）だけをずらした。目標値に段差が無いので、D 動作は偏差に掛けた。刻み 0.1 ms で厳密に離散化して計算した。</div>';
    }
    run();
  };

  /* ---- 3 節: 外乱のフィードフォワード（台車の坂・温度の板の周りの温度） ---- */
  function _w14_cart(KP,KI,ff,fb,ang,angm,tEnd){var h=1e-3,n=Math.round(tEnd/h),v=1,I=0,a=Math.exp(-2*h),out={t:[],y:[],u:[]};
    for(var k=0;k<=n;k++){var t=k*h,on=t>=1,d=on?-9.81*Math.sin(ang*Math.PI/180):0,uff=(ff&&on)?9.81*Math.sin(angm*Math.PI/180):0,e=1-v,
      u=2+uff+(fb?KP*e+I:0);if(k%5===0){out.t.push(t);out.y.push(v);out.u.push(u);}I+=KI*e*h;var vin=(u+d)/2;v=vin+(v-vin)*a;}
    return out;}
  REG.w14_dff=function(el,U){
    var S=U.S;
    U.head(el,"DISTURBANCE FF","外乱のフィードフォワード — 測った外乱を、制御量に現れる前に打ち消す");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",["台車の坂（1 章）","温度の板の周りの温度（10 章）"],0,function(){def();run();});
    var fbs=U.select(r1,"フィードバック",["比例","PI"],0,run);
    var CART={d:[1,2,3,4,5,6,8],e:[-2,-1,-0.5,0,0.5,1,2]},PLATE={d:[-20,-15,-10,-5,5,10,15],e:[0.5,0.7,0.85,1,1.15,1.3,1.5]};
    var r2=U.ctrls(el);
    var dz=U.slider(r2,"外乱の大きさ",{values:[0,1,2,3,4,5,6],value:4,fmt:function(i){return lab(i);},onInput:run});
    var er=U.slider(r2,"測った値の誤差",{values:[0,1,2,3,4,5,6],value:2,fmt:function(i){return elab(i);},onInput:run});
    function lab(i){return ob.get()===0?"本当の坂 "+CART.d[i]+"°":"周りの温度 "+(PLATE.d[i]>0?"+":"")+PLATE.d[i]+" K";}
    function elab(i){return ob.get()===0?"センサの読み "+(CART.e[i]>0?"+":"")+CART.e[i]+"°（"+_w14_g(CART.d[dz.get()]+CART.e[i],3)+"°と読む）":"熱抵抗のモデル: 本当の "+PLATE.e[i]+" 倍";}
    var br=U.btnrow(el);
    function def(){if(ob.get()===0){dz.set(3);er.set(1);}else{dz.set(2);er.set(5);}fbs.set(ob.get()===0?0:1);}
    U.button(br,"本文の例",function(){def();run();});
    U.button(br,"測った値が正しい",function(){er.set(3);run();});
    U.button(br,"誤差が大きい",function(){er.set(ob.get()===0?0:6);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      dz.set(dz.get());er.set(er.get());
      var cart=ob.get()===0,PI=fbs.get()===1,nar=_w14_nar(box),Wd=nar?400:700,o=[],res=[];
      var cs=[["フィードバックだけ","muted",null,{ff:false,fb:true}],["フィードフォワードだけ","alias","5 3",{ff:true,fb:false}],["両方","green",null,{ff:true,fb:true}]];
      var tEnd,tD,dy,yl,yu,ul;
      if(cart){
        var ang=CART.d[dz.get()],angm=ang+CART.e[er.get()],KP=8,KI=PI?25:0;tEnd=4;tD=1;
        cs.forEach(function(c){var R=_w14_cart(KP,KI,c[3].ff,c[3].fb,ang,angm,tEnd);res.push(R);});
        yl="速度 [m/s]";ul="押す力 u [N]";
      }else{
        var dT=PLATE.d[dz.get()],Re=PLATE.e[er.get()];tEnd=1200;tD=100;
        cs.forEach(function(c){var R=_w14_plate({KP:c[3].fb?10:0,TI:(c[3].fb&&PI)?160:0,d:function(t){return t>=tD?dT/1.25:0;},
          dff:c[3].ff?function(t){return t>=tD?-dT/(1.25*Re):0;}:null,tEnd:tEnd,h:0.025,every:20});
          R.y=R.y.map(function(v){return v;});res.push(R);});
        yl="温度のずれ [K]";ul="電力のずれ [W]";
      }
      var ys=[],us=[];res.forEach(function(R){ys=ys.concat(R.y);us=us.concat(R.u);});
      var y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys),ref=cart?1:0;y0=Math.min(y0,ref);y1=Math.max(y1,ref);var pad=Math.max((y1-y0)*0.12,cart?0.01:0.05);y0-=pad;y1+=pad;
      var u0=Math.min.apply(null,us),u1=Math.max.apply(null,us),pu=Math.max((u1-u0)*0.12,0.2);u0-=pu;u1+=pu;
      var x0=nar?54:62,pw=nar?330:420;
      var P=U.plot(x0,20,pw,150,[0,tEnd],[y0,y1]);
      o.push(P.axes({yl:yl,xt:U.nice(0,tEnd,5),yt:U.nice(y0,y1,4).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,3);},ylOff:nar?40:46}));
      o.push(S.L(P.X(tD),P.y,P.X(tD),P.y+P.h,"purple",1.2,"3 3"));
      o.push(S.T(P.X(tD)+4,P.y+11,cart?"坂に入る":"周りの温度が変わる","start",9.5,"purple",true,false,null,true));
      if(!cart)o.push(S.RECT(P.X(tD),P.y,P.X(tD+20)-P.X(tD),P.h,0,U.soft("purple"),"none",0));
      o.push(S.L(P.x,P.Y(ref),P.x+P.w,P.Y(ref),"muted",1,"5 3"));
      res.forEach(function(R,i){o.push(P.line(R.t.map(function(x,j){return [x,R.y[j]];}),cs[i][1],i===2?2.4:1.8,cs[i][2]));});
      var Q=U.plot(x0,206,pw,90,[0,tEnd],[u0,u1]);
      o.push(Q.axes({xl:"時間 t [s]",yl:ul,xt:U.nice(0,tEnd,5),yt:U.nice(u0,u1,3).filter(function(v){return v>=u0&&v<=u1;}),xfmt:function(v){return _w14_g(v,4);},yfmt:function(v){return _w14_g(v,3);},ylOff:nar?40:46}));
      res.forEach(function(R,i){o.push(Q.line(R.t.map(function(x,j){return [x,R.u[j]];}),cs[i][1],i===2?2:1.5,cs[i][2]));});
      /* 凡例と値 */
      var lx=nar?14:500,ly=nar?344:30;
      o.push(S.T(lx,ly,cart?"坂の上の速度":"温度のずれ","start",10,"ink",true));
      res.forEach(function(R,i){var yy=ly+20+i*(nar?16:42),fin=R.y[R.y.length-1],ext=cart?Math.min.apply(null,R.y.filter(function(v,j){return R.t[j]>=tD;})):(PLATE.d[dz.get()]<0?Math.min.apply(null,R.y):Math.max.apply(null,R.y));
        o.push(S.L(lx,yy-4,lx+22,yy-4,cs[i][1],2.4,cs[i][2]));
        var txt=cart?(cs[i][0]+": 最後 "+_w14_f(fin,3)+" m/s、最低 "+_w14_f(ext,3)+" m/s"):(cs[i][0]+": 最大 "+_w14_f(Math.abs(ext),2)+" K、最後 "+_w14_f(fin,2)+" K");
        if(nar)o.push(S.T(lx+28,yy,txt,"start",9.5,cs[i][1]==="muted"?"ink":cs[i][1],true));
        else{o.push(S.T(lx+28,yy,cs[i][0],"start",10,"ink"));o.push(S.T(lx+28,yy+15,txt.split(": ")[1],"start",9.5,cs[i][1]==="muted"?"ink":cs[i][1],true));}});
      box.set(S.svg(Wd,nar?404:340,o));
      /* 読み出し */
      var hs="";
      if(cart){var ang2=CART.d[dz.get()],angm2=ang2+CART.e[er.get()],dT2=9.81*Math.sin(ang2*Math.PI/180),dM=9.81*Math.sin(angm2*Math.PI/180),rem=dT2-dM;
        hs+="坂の力 "+_w14_g(dT2,3)+" N、測った角度から足す力 "+_w14_g(dM,3)+" N、足りない分 <b>"+_w14_g(rem,3)+" N</b><br>";
        hs+="フィードフォワードだけ: 1 − "+_w14_g(rem,3)+" ÷ 2 = "+_w14_f(1-rem/2,3)+" m/s。両方（比例）: 1 − "+_w14_g(rem,3)+" ÷ (2 + 8) = "+_w14_f(1-rem/10,3)+" m/s（1 章 4 節の式で、足りない分だけを比例制御が受け持つ）"+(PI?"。PI なら、どれも最後は 1 m/s":"")+"<br>";}
      else{var dT3=PLATE.d[dz.get()],Re3=PLATE.e[er.get()],need=-dT3/1.25,give=-dT3/(1.25*Re3);
        hs+="逃げる熱が "+_w14_g(Math.abs(need),3)+" W "+(need>=0?"増える":"減る")+"、フィードフォワードで足す電力 "+_w14_g(give,3)+" W、足りない分 <b>"+_w14_g(need-give,3)+" W</b><br>";
        hs+="フィードフォワードだけ: "+_w14_f((give-need)*1.25,2)+" K の所へ向かう（時定数 500 s）"+(PI?"。PI なら最後は 0":"。比例（10 W/K）だけなら最後は "+_w14_f((give-need)*1.25/(1+12.5),3)+" K")+"<br>";}
      ro.innerHTML=hs+'<div class="wnote">'+(cart?"1 章の台車（1 kg、2 N·s/m、目標 1 m/s）が 1 s に坂に入る。比例は 8 N/(m/s)、PI は 8 N/(m/s)・25 N/m。決めた力 2 N はいつも足す。":"温度の板（1.25 K/W・500 s・むだ時間 20 s）を 60 °C に保っている所で、100 s に周りの温度が変わる。PI は 10 W/K・160 s、比例は 10 W/K。周りの温度のセンサは遅れないとした。")+"</div>";
    }
    def();run();
  };

  /* ---- 4 節: カスケード制御（モータの角度、L_a を含む） ----
     mode: 0 角度の PID だけ（10 章 5 節）、1 角度の比例 → 角速度の PI → 電圧、2 角度の比例 → 角速度の PI → 電流の PI → 電圧。
     o = {tEnd, h, r(t), tau(t), vs(t), Kth, ilim, J, every}。図の _f14_casc と同じ計算 */
  function _w14_casc(U,mode,o){
    var h=o.h,J=o.J||1e-5,A=[[0,1,0],[0,0,0.02/J],[0,-20,-2000]],B=[[0,0],[0,-1/J],[1000,0]],dd=U.ctl.mat.c2d(A,B,h),Ad=dd.A,Bd=dd.B;
    var th=0,w=0,i=0,Ip=0,Dp=0,yp=0,Iw=0,Ii=0,KP=0.84,KI=5,KD=0.02,Tf=KD/KP/10,Kth=o.Kth,ilim=o.ilim;
    var KPw=mode===1?0.1:0.5,TIw=mode===1?0.05:4e-3,KPi=5,TIi=5e-4,n=Math.round(o.tEnd/h),ev=o.every||1;
    var out={t:[],th:[],w:[],i:[],v:[],r:[]};
    for(var k=0;k<=n;k++){var t=k*h,rr=o.r?o.r(t):0,v,vc;
      if(mode===0){Dp=Tf/(Tf+h)*Dp-KD/(Tf+h)*(th-yp);yp=th;var e=rr-th;vc=KP*e+Ip+Dp;v=Math.max(-12,Math.min(12,vc));if(!((vc>12&&e>0)||(vc<-12&&e<0)))Ip+=KI*e*h;}
      else if(mode===1){var ew=Kth*(rr-th)-w;vc=KPw*ew+Iw;v=Math.max(-12,Math.min(12,vc));if(!((vc>12&&ew>0)||(vc<-12&&ew<0)))Iw+=KPw/TIw*ew*h;}
      else{var ew2=Kth*(rr-th)-w,icc=KPw*ew2+Iw,ic=ilim==null?icc:Math.max(-ilim,Math.min(ilim,icc));
        if(!(ilim!=null&&((icc>ilim&&ew2>0)||(icc<-ilim&&ew2<0))))Iw+=KPw/TIw*ew2*h;
        var ei=ic-i;vc=KPi*ei+Ii;v=Math.max(-12,Math.min(12,vc));if(!((vc>12&&ei>0)||(vc<-12&&ei<0)))Ii+=KPi/TIi*ei*h;}
      var va=v*(o.vs?o.vs(t):12)/12,tl=o.tau?o.tau(t):0;
      if(k%ev===0){out.t.push(t);out.th.push(th);out.w.push(w);out.i.push(i);out.v.push(v);out.r.push(rr);}
      var a0=Ad[0][0]*th+Ad[0][1]*w+Ad[0][2]*i+Bd[0][0]*va+Bd[0][1]*tl,a1=Ad[1][0]*th+Ad[1][1]*w+Ad[1][2]*i+Bd[1][0]*va+Bd[1][1]*tl,a2=Ad[2][0]*th+Ad[2][1]*w+Ad[2][2]*i+Bd[2][0]*va+Bd[2][1]*tl;
      th=a0;w=a1;i=a2;}
    return out;}
  REG.w14_cascade=function(el,U){
    var S=U.S;
    U.head(el,"CASCADE","カスケード制御 — 内側のループで、外乱を外側に届く前に止める");
    var r1=U.ctrls(el);
    var md=U.select(r1,"構成",["角度の PID だけ（10 章）","2 段: 角度 → 角速度","3 段: 角度 → 角速度 → 電流"],2,run);
    var ts=U.select(r1,"試すこと",["0.02 s に負荷トルク 0.01 N·m","目標の角度を 1 rad 変える","軸を止められる（目標は 1 rad 先）","1 s に電源が 12 V → 9 V（負荷トルクあり）"],0,run);
    var r2=U.ctrls(el);
    var rt=U.slider(r2,"内側の速さ ÷ 外側の比例ゲイン",{values:[0.5,1,2,4,5,10,20],value:5,fmt:function(v){return v+" 倍";},onInput:run});
    var il=U.slider(r2,"電流の上限（3 段）",{values:[0.5,1,2,3,6],value:3,fmt:function(v){return v+" A";},onInput:run});
    var br=U.btnrow(el);
    U.button(br,"本文の例（3 段・負荷トルク）",function(){md.set(2);ts.set(0);rt.set(5);il.set(3);run();});
    U.button(br,"角度の PID だけ",function(){md.set(0);ts.set(0);rt.set(5);il.set(3);run();});
    U.button(br,"2 段で、内側が外側の 1 倍しか速くない",function(){md.set(1);ts.set(1);rt.set(1);run();});
    U.button(br,"軸を止められる・上限 1 A",function(){md.set(2);ts.set(2);rt.set(5);il.set(1);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){
      var M=+md.get(),T=+ts.get(),ratio=rt.get(),inner=M===1?100:1000,Kth=inner/ratio,ilim=il.get(),nar=_w14_nar(box),Wd=nar?400:700,o=[];
      rt.el.style.display=M>0?"":"none";il.el.style.display=M===2?"":"none";
      var tw0=[0,0,0,0.9][T],tEnd=[0.4,0.4,2.5,1.4][T];
      /* 構成 m の計算条件（比べるため、ほかの構成も同じ条件で計算する） */
      function mk(m){var h=m===2?(T===2?2e-5:1e-5):(T===2?1e-4:2e-5),o2={tEnd:tEnd,h:h,Kth:(m===1?100:1000)/ratio,ilim:m===2?ilim:null,every:Math.max(1,Math.round((tEnd-tw0)/h/800))};
        if(T===0)o2.tau=function(t){return t>=0.02?0.01:0;};
        if(T===1)o2.r=function(){return 1;};
        if(T===2){o2.r=function(){return 1;};o2.J=1e3;}
        if(T===3){o2.tau=function(){return 0.01;};o2.vs=function(t){return t>=1.0?9:12;};}
        return o2;}
      /* 電源が下がる直前（1.0 s）の角度 */
      function thAt(Rx,t0){var k=0;while(k<Rx.t.length-1&&Rx.t[k]<t0-1e-12)k++;return Rx.th[k];}
      var R=_w14_casc(U,M,mk(M)),sel=[];R.t.forEach(function(x,i){if(x>=tw0-1e-12)sel.push(i);});
      /* 線図 */
      var yc=44,items=[["a",nar?12:20,null,"muted"],["s",{l:"+",b:"−"},"s1"],["a",nar?8:14,null,"alias"]];
      if(M===0){items.push(["b","PID","c0",true]);items.push(["a",nar?24:40,"v","gold"]);}
      else{items.push(["b","C_{θ}","c1",true]);items.push(["a",nar?18:30,"ω_r","gold"]);items.push(["s",{l:"+",b:"−"},"s2"]);items.push(["a",nar?8:14,null,"alias"]);
        items.push(["b","C_{ω}","c2",true]);
        if(M===2){items.push(["a",nar?18:30,"i_r","gold"]);items.push(["s",{l:"+",b:"−"},"s3"]);items.push(["a",nar?8:14,null,"alias"]);items.push(["b","C_i","c3",true]);}
        items.push(["a",nar?20:34,"v","gold"]);}
      items.push(["b","モータ","m"]);items.push(["a",nar?24:40,"θ_m","signal"]);
      var ch=S.CHAIN(nar?8:14,yc,items);o.push(ch.svg);
      var m0=ch.pos.m[0],m1=ch.pos.m[1],fb=[];
      if(M===2)fb.push([m0+12,22,"i","s3"]);if(M>=1)fb.push([m0+28,38,"ω_m","s2"]);fb.push([m1-10,54,"θ_m","s1"]);
      fb.forEach(function(f){var xt=ch.pos[f[3]];o.push(S.L(f[0],yc+17,f[0],yc+f[1],"signal",1.5));o.push(S.L(f[0],yc+f[1],xt,yc+f[1],"signal",1.5));o.push(S.ARR(xt,yc+f[1],xt,yc+15,"signal",1.5,6));o.push(S.TX(f[0]+4,yc+f[1]-3,f[2],"start",9,"signal",true,true));});
      if(T===0||T===3){var xm=(m0+m1)/2;o.push(S.ARR(xm,yc-34,xm,yc-18,"purple",1.6));o.push(S.TX(xm+5,yc-24,"τ_L","start",10,"purple",true,true));}
      if(T===3)o.push(S.T(m1+4,yc-24,"電源 12 V → 9 V","start",9.5,"purple",true,false,null,true));
      /* 波形 */
      var x0=nar?54:64,pw=nar?330:290,py=124,ph=110,base=T===3?thAt(R,1.0):0;
      var tt=sel.map(function(i){return R.t[i];}),th=sel.map(function(i){return R.th[i]-((T===1||T===2)?0:base);}),ii=sel.map(function(i){return R.i[i];});
      var a0=Math.min.apply(null,th),a1=Math.max.apply(null,th);
      if(T===1||T===2){a0=Math.min(0,a0);a1=Math.max(1.2,a1*1.08);}
      var span=Math.max(a1-a0,1e-5);a0-=span*0.12;a1+=span*0.12;
      var P=U.plot(x0,py,pw,ph,[tw0,tEnd],[a0,a1]);
      o.push(S.T(x0-(nar?44:50),py-8,(T===1||T===2)?"角度 θ [rad]":(T===3?"1.0 s からの角度の変化 [rad]":"角度のずれ [rad]"),"start",9.5,"ink",true));
      o.push(P.axes({xl:"時間 t [s]",xt:U.nice(tw0,tEnd,4),yt:U.nice(a0,a1,4).filter(function(v){return v>=a0&&v<=a1;}),xfmt:function(v){return _w14_g(v,3);},yfmt:function(v){return _w14_g(v,2);}}));
      if(T===1||T===2)o.push(P.line([[tw0,1],[tEnd,1]],"muted",1,"5 3"));else o.push(P.line([[tw0,0],[tEnd,0]],"line",1));
      if(T===3)o.push(S.L(P.X(1),P.y,P.X(1),P.y+P.h,"purple",1.1,"3 3"));
      o.push(P.line(tt.map(function(x,k){return [x,th[k]];}),"signal",2));
      var bx=nar?54:420,by=nar?290:py,bw=nar?330:250;
      var imx=Math.max(1,Math.max.apply(null,ii.map(Math.abs))*1.15),i0=Math.min(0,Math.min.apply(null,ii)*1.15);
      var Q=U.plot(bx,by,bw,ph,[tw0,tEnd],[i0,imx]);
      o.push(S.T(bx-(nar?44:50),by-8,"電流 i [A]"+(imx>=6?"（点線は拘束電流 6 A）":""),"start",9.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",xt:U.nice(tw0,tEnd,4),yt:U.nice(i0,imx,4).filter(function(v){return v>=i0&&v<=imx;}),xfmt:function(v){return _w14_g(v,3);},yfmt:function(v){return _w14_g(v,2);}}));
      if(M===2&&ilim<=imx)o.push(Q.line([[tw0,ilim],[tEnd,ilim]],"alias",1,"4 3"));
      if(imx>=6)o.push(Q.line([[tw0,6],[tEnd,6]],"muted",1,"2 3"));
      o.push(Q.line(tt.map(function(x,k){return [x,ii[k]];}),"gold",2));
      box.set(S.svg(Wd,(nar?by:py)+ph+40,o));
      /* 読み出し */
      var hs="",dev=0;th.forEach(function(v){dev=Math.max(dev,Math.abs(v));});
      var eEnd=th[th.length-1];
      if(T===0)hs+="負荷トルクによる角度のずれの最大: <b>"+_w14_g(dev,3)+" rad</b>、0.4 s のずれ "+(Math.abs(eEnd)<1e-5?"0.00001 rad 未満":_w14_g(eEnd,3)+" rad")+"<br>";
      if(T===3)hs+="電源が下がった後の角度の変化の最大: <b>"+_w14_g(dev,3)+" rad</b><br>";
      if(T===2){var names2=["角度の PID だけ","2 段","3 段（上限 "+ilim+" A）"],cmp2=[];
        for(var m2=0;m2<3;m2++){var Rm2=m2===M?R:_w14_casc(U,m2,mk(m2)),im2=0;for(var q2=0;q2<Rm2.i.length;q2++)im2=Math.max(im2,Math.abs(Rm2.i[q2]));
          cmp2.push((m2===M?"<b>":"")+names2[m2]+" "+_w14_g(im2,3)+" A"+(m2===M?"</b>":""));}
        hs+="同じ条件で 3 つの構成を比べると（電流の最大）: "+cmp2.join("、")+"<br>";}
      if(T===0||T===3){var names=["角度の PID だけ","2 段","3 段"],cmp=[];
        for(var m=0;m<3;m++){var Rm=m===M?R:_w14_casc(U,m,mk(m)),bm=T===3?thAt(Rm,1.0):0,dm=0;
          for(var q=0;q<Rm.t.length;q++)if(Rm.t[q]>=tw0-1e-12)dm=Math.max(dm,Math.abs(Rm.th[q]-bm));
          cmp.push((m===M?"<b>":"")+names[m]+" "+_w14_g(dm,3)+" rad"+(m===M?"</b>":""));}
        hs+="同じ条件で 3 つの構成を比べると: "+cmp.join("、")+"<br>";}
      if(T===1){var mp=(Math.max.apply(null,th)-1)*100,t2=_w14_settle(tt,th,1,0.02,0);hs+="目標の角度 1 rad: 行き過ぎ量 <b>"+_w14_f(Math.max(0,mp),1)+" %</b>、2 % 整定時間 "+(t2!=null?_w14_g(t2,3)+" s":"表示した時間の中で入らない")+"<br>";}
      var imax=Math.max.apply(null,ii.map(Math.abs));hs+="電流の最大 <b>"+_w14_g(imax,3)+" A</b>"+(imax>5.5?' <span class="warn">拘束電流に近い</span>':"")+(T===2&&M===2?' <span class="ok">電流の指令を '+ilim+' A で切っている</span>':"")+"<br>";
      if(M>0){var z=0.5*Math.sqrt(ratio);hs+="外側の比例ゲイン "+_w14_g(Kth,3)+" /s（内側の速さ 約 "+inner+" /s の 1/"+ratio+"）。内側を一次遅れとみなした外側の減衰比 ζ = (1/2)√"+ratio+" = <b>"+_w14_f(z,2)+"</b>"+(z>=1?"（振動しない）":"（行き過ぎ量の目安 "+_w14_f(100*Math.exp(-Math.PI*z/Math.sqrt(1-z*z)),1)+" %）")+"<br>";}
      ro.innerHTML=hs+'<div class="wnote">モータは巻線のインダクタンスを含む式（2 Ω・1 mH・0.02 N·m/A・1×10⁻⁵ kg·m²、電源 12 V）。PID は 10 章 5 節の値（測定値の不完全微分、N = 10）。2 段の角速度の PI は 0.1 V/(rad/s)・0.05 s（内側の速さ 100 /s）、3 段は角速度の PI 0.5 A/(rad/s)・4 ms と電流の PI 5 V/A・0.5 ms（内側の速さ 約 1000 /s）。積分はどれもクランプで止める。電圧の指令は 12 V で切り、電源が下がるとその割合で実際の電圧が減る。軸を止められる場合は、慣性モーメントを非常に大きくして計算した。</div>';
    }
    run();
  };

  /* ---- 5 節: スミス予測器（温度の板） ---- */
  var _W14_MAP=null;
  /* λ（34 通り、2〜80 s の対数）と本当のむだ時間（0〜70 s）の組で、スミス予測器（P_0 C = 1/(λs)、モデルのむだ時間 20 s）が不安定か */
  function _w14_map(){if(_W14_MAP)return _W14_MAP;var lams=[],Ls=[],M=[],i,j,k;
    for(i=0;i<34;i++)lams.push(Math.exp(Math.log(2)+(Math.log(80)-Math.log(2))*i/33));for(j=0;j<=70;j++)Ls.push(j);
    for(i=0;i<lams.length;i++){var lam=lams[i],row=[],nw=1500,wm=2.5/lam;
      for(j=0;j<Ls.length;j++){var L=Ls[j],tot=0,prev=null;
        for(k=0;k<=nw;k++){var w=1e-6+wm*k/nw,gr=Math.cos(w*L)-Math.cos(w*20),gi=-Math.sin(w*L)+Math.sin(w*20),dr=1,di=w*lam,den=dr*dr+di*di;
          var Gr=(gr*dr+gi*di)/den,Gi=(gi*dr-gr*di)/den,ph=Math.atan2(Gi,1+Gr);if(prev!==null){var dph=ph-prev;while(dph>Math.PI)dph-=2*Math.PI;while(dph<-Math.PI)dph+=2*Math.PI;tot+=dph;}prev=ph;}
        row.push(Math.abs(tot)>Math.PI);}
      M.push(row);}
    _W14_MAP={lams:lams,Ls:Ls,M:M};return _W14_MAP;}
  /* 閉ループが不安定か。PI なら一巡伝達関数の位相余裕、スミス予測器なら特性方程式 1 + G = 0 の G の線図が −1 を回るか
     （G = C(P_0 e^{−Ls} − P̃_0 e^{−20s})/(1 + C P̃_0)、C P̃_0 = 1/(λs)、P_0 = Kr P̃_0 として、G = (Kr e^{−jωL} − e^{−j20ω})/(jωλ + 1)） */
  function _w14_unst(U,C,KP,TI,lam,Lt,Kr){
    if(C!==2){var mg=U.ctl.margins(U.ctl.tf([KP*TI*1.25*Kr,KP*1.25*Kr],[500*TI,TI,0],Lt),1e-5,10);return mg.pm!=null&&mg.pm<=0;}
    var nw=6000,wm=Math.max(2.5,2.5*Kr+1.5)/lam,tot=0,prev=null;
    for(var k=0;k<=nw;k++){var w=1e-6+wm*k/nw,gr=Kr*Math.cos(w*Lt)-Math.cos(w*20),gi=-Kr*Math.sin(w*Lt)+Math.sin(w*20),di=w*lam,den=1+di*di;
      var Gr=(gr+gi*di)/den,Gi=(gi-gr*di)/den,ph=Math.atan2(Gi,1+Gr);if(prev!==null){var d=ph-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;tot+=d;}prev=ph;}
    return Math.abs(tot)>Math.PI;}
  REG.w14_smith=function(el,U){
    var S=U.S;
    U.head(el,"SMITH PREDICTOR","スミス予測器 — むだ時間を輪の外へ出す。目標値・外乱・むだ時間のずれで比べる");
    var r1=U.ctrls(el);
    var cm=U.select(r1,"制御器",["PI 10 W/K・160 s（1 節の (b)）","PI（IMC を近似した T/{K(λ + L)}・T）","スミス予測器（PI は T/(Kλ)・T）"],2,run);
    var lm=U.slider(r1,"λ",{min:2,max:80,log:true,value:10,fmt:function(v){return _w14_g(v,3)+" s";},onInput:run});
    var r2=U.ctrls(el);
    var lt=U.slider(r2,"本当のむだ時間",{min:0,max:70,step:1,value:20,fmt:function(v){return v+" s（モデルは 20 s）";},onInput:run});
    var kt=U.slider(r2,"本当の定常ゲイン",{values:[0.5,0.7,0.85,1,1.15,1.3,1.5,2],value:1,fmt:function(v){return "モデルの "+v+" 倍";},onInput:run});
    var br=U.btnrow(el);
    U.button(br,"本文の例（スミス予測器・λ = 10 s）",function(){cm.set(2);lm.set(10);lt.set(20);kt.set(1);run();});
    U.button(br,"λ = 20 s",function(){cm.set(2);lm.set(20);lt.set(20);kt.set(1);run();});
    U.button(br,"PI（1 節の (b)）",function(){cm.set(0);lt.set(20);kt.set(1);run();});
    U.button(br,"λ = 5 s で、本当のむだ時間が 10 s",function(){cm.set(2);lm.set(5);lt.set(10);kt.set(1);run();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 地図の上をドラッグして λ と本当のむだ時間を選ぶ */
    var MP=null;
    U.ctl.drag(box,function(type,x,y){if(!MP||x==null)return false;if(type==="down"&&(x<MP.x||x>MP.x+MP.w||y<MP.y||y>MP.y+MP.h))return false;
      var L=Math.round(Math.max(0,Math.min(70,MP.ux(x)))),la=Math.max(2,Math.min(80,MP.uy(y)));lt.set(L);lm.set(+la.toPrecision(3));if(cm.get()!==2)cm.set(2);run();});
    function run(){
      var C=+cm.get(),lam=lm.get(),Lt=lt.get(),Kr=kt.get(),K=1.25,T=500,L=20,KP,TI,smith=C===2;
      lm.el.style.display=C===0?"none":"";
      if(C===0){KP=10;TI=160;}else if(C===1){KP=T/(K*(lam+L));TI=T;}else{KP=T/(K*lam);TI=T;}
      var tD=700,tEnd=1400;
      var R=_w14_plate({KP:KP,TI:TI,smith:smith,Lt:Lt,Kt:K*Kr,r:function(){return 1;},d:function(t){return t>=tD?-10:0;},tEnd:tEnd,h:0.025,every:20,umin:-28,umax:52});
      var unstable=R.blow||_w14_unst(U,C,KP,TI,lam,Lt,Kr);
      var nar=_w14_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?54:62,pw=nar?330:380;
      var ys=R.y.concat(smith?R.yp:[]),y0=Math.min(-0.2,Math.min.apply(null,ys)),y1=Math.max(1.4,Math.max.apply(null,ys));y0=Math.max(y0,-3);y1=Math.min(y1,4);
      var P=U.plot(x0,20,pw,150,[0,tEnd],[y0,y1]);
      o.push(P.axes({yl:"温度のずれ [K]",xt:U.nice(0,tEnd,5),yt:U.nice(y0,y1,4).filter(function(v){return v>=y0&&v<=y1;}),xfmt:function(){return "";},yfmt:function(v){return _w14_g(v,2);},ylOff:nar?40:44}));
      o.push(P.line([[0,1],[tEnd,1]],"muted",1,"5 3"));
      o.push(S.L(P.X(tD),P.y,P.X(tD),P.y+P.h,"purple",1.2,"3 3"));o.push(S.T(P.X(tD)+4,P.y+11,"外乱 −10 W","start",9.5,"purple",true,false,null,true));
      if(smith)o.push(P.clip(R.t.map(function(x,i){return [x,R.yp[i]];}),"gold",1.5,"5 3"));
      o.push(P.clip(R.t.map(function(x,i){return [x,R.y[i]];}),unstable?"alias":"signal",2));
      var Q=U.plot(x0,200,pw,80,[0,tEnd],[-30,55]);
      o.push(Q.axes({xl:"時間 t [s]",yl:"電力 [W]",xt:U.nice(0,tEnd,5),yt:[-28,0,26,52],xfmt:function(v){return _w14_g(v,4);},yfmt:function(v){return _w14_g(v,3);},ylOff:nar?40:44}));
      o.push(Q.line([[0,52],[tEnd,52]],"alias",1,"4 3"));o.push(Q.line([[0,-28],[tEnd,-28]],"alias",1,"4 3"));
      o.push(Q.line(R.t.map(function(x,i){return [x,R.u[i]];}),"gold",1.6));
      if(smith)o.push(S.LEGL(x0,P.y+P.h+20,[["signal",null,"y（本当の温度）"],["gold","5 3","y_p（予測器が戻す値）"]],9.5,18));
      /* 地図 */
      var mx0=nar?54:520,my0=nar?332:20,mw=nar?330:166,mh=nar?150:260,G=_w14_map();
      var MPl=U.plot(mx0,my0,mw,mh,[0,70],[2,80],{ylog:true});MP=MPl;
      var rr=Math.sqrt(G.lams[1]/G.lams[0]);
      for(var i=0;i<G.lams.length;i++)for(var j=0;j<G.Ls.length;j++)if(G.M[i][j]){var ya=G.lams[i]/rr,yb2=G.lams[i]*rr;
        o.push(S.RECT(MPl.X(Math.max(0,G.Ls[j]-0.5)),MPl.Y(Math.min(80,yb2)),MPl.X(Math.min(70,G.Ls[j]+0.5))-MPl.X(Math.max(0,G.Ls[j]-0.5)),MPl.Y(Math.max(2,ya))-MPl.Y(Math.min(80,yb2)),0,U.soft("alias"),"none",0));}
      o.push(MPl.axes({xl:"本当のむだ時間 [s]",yl:"λ [s]",xt:[0,20,40,60],yt:[2,5,10,20,40,80],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},sz:9,ylOff:30}));
      var ln1=[],ln2=[];for(var q=0;q<=40;q++){var lq=Math.exp(Math.log(2)+(Math.log(80)-Math.log(2))*q/40);ln1.push([Math.max(0,20-lq),lq]);ln2.push([Math.min(70,20+lq),lq]);}
      o.push(MPl.line(ln1,"green",1.6));o.push(MPl.line(ln2,"green",1.6));
      o.push(S.T(mx0+mw/2,my0-6,"スミス予測器が安定な組（赤は不安定）","middle",9.5,"ink",true));
      var lamPt=C===0?null:lam;
      if(smith){o.push(S.CIRC(MPl.X(Lt),MPl.Y(lam),6,"ink",2,"screen"));o.push(S.D(MPl.X(Lt),MPl.Y(lam),unstable?"alias":"signal",3.4));}
      box.set(S.svg(Wd,nar?my0+mh+40:Math.max(my0+mh+40,322),o));
      /* 読み出し */
      var hs="制御器: "+(smith?"スミス予測器の中の PI ":"PI ")+_w14_g(KP,3)+" W/K・"+_w14_g(TI,3)+" s（"+U.htx("K_I")+" = "+_w14_g(KP/TI,3)+" W/(K·s)）<br>";
      if(unstable)hs+='<span class="warn">閉ループは不安定</span>（電力の上限と下限が無ければ、振れが大きくなり続ける）<br>';
      else{var tg=R.t.filter(function(x){return x<tD;}),yg=R.y.slice(0,tg.length),mp=(Math.max.apply(null,yg)-1)*100,t2=_w14_settle(tg,yg,1,0.02,0);
        hs+="目標値 +1 K: 行き過ぎ量 <b>"+_w14_f(Math.max(0,mp),1)+" %</b>、2 % 整定時間 <b>"+(t2!=null?_w14_g(t2,3)+" s":"700 s までに入らない")+"</b>"+(smith&&Lt===20&&Kr===1?U.htx("（式 e^{−20s}/(λs + 1) なら ")+_w14_g(20+lam*Math.log(50),3)+" s）":"")+"<br>";
        var td=R.t.map(function(x){return x;}),dev=R.y.map(function(v){return v-1;}),iae=_w14_trapz(td,dev.map(Math.abs),tD,tEnd),mn=0;R.y.forEach(function(v,i){if(R.t[i]>=tD)mn=Math.min(mn,v-1);});
        hs+="外乱 −10 W: 最大 <b>"+_w14_f(-mn,2)+" K</b>、700〜1400 s の IAE "+_w14_g(iae,3)+" K·s（十分に長い時間の面積は、式 "+(smith?"d/"+U.htx("K_I")+" + KLd = "+_w14_g(10/(KP/TI)+1.25*20*10,3):"d/"+U.htx("K_I")+" = "+_w14_g(10/(KP/TI),3))+" K·s）<br>";}
      if(smith){var ok=Math.abs(Lt-20)<=lam;hs+="十分な条件 |L − L̃| ≤ λ: |"+Lt+" − 20| = "+Math.abs(Lt-20)+" s "+(ok?"≤":">")+" λ = "+_w14_g(lam,3)+" s"+(ok?' <span class="ok">満たす（必ず安定）</span>':"（満たさないので、地図で確かめる）")+"<br>";}
      if(Kr!==1&&smith)hs+="地図は、定常ゲインがモデルどおりのときの判定である<br>";
      ro.innerHTML=hs+'<div class="wnote">温度の板（モデル 1.25 K/W・500 s・むだ時間 20 s）を 60 °C で保つ所から、0 s に目標値を 1 K 上げ、700 s にヒータの電力に −10 W の外乱を入れる。ヒータの電力は 0〜80 W（28 W からのずれで −28〜+52 W）で切り、積分はクランプで止める。スミス予測器のモデルには、実際に出た電力を入れる。地図の上をドラッグすると、λ と本当のむだ時間を選べる。</div>';
    }
    run();
  };

  /* ===== 15 章 サンプリングと離散化 ===== */
  function _w15_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w15_f(v,d){if(v===null||v===undefined)return "—";v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w15_g(v,d){d=d||3;if(v===null||v===undefined||isNaN(v))return "—";if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v),s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}
  function _w15_ms(T){return _w15_g(T*1000,3)+" ms";}
  /* 対象（本文の例の値） */
  var _W15_POS={num:[1000],den:[1,20,0]};        /* モータの角度（L_a を無視）rad/V */
  var _W15_SPD={num:[50],den:[0.05,1]};          /* モータの速度 (rad/s)/V */
  /* 状態空間を刻み h で零次ホールドの離散化（U.ctl.ss と U.ctl.mat.c2d） */
  function _w15_dss(U,G,h){var S=U.ctl.ss(U.ctl.tf(G.num,G.den)),d=U.ctl.mat.c2d(S.A,S.B,h);
    return {A:d.A,B:d.B.map(function(r){return r[0];}),C:S.C[0],D:S.D[0][0],n:S.A.length};}
  function _w15_out(s,x){var y=s.D*0;for(var i=0;i<s.n;i++)y+=s.C[i]*x[i];return y;}
  function _w15_adv(s,x,u){var nx=[];for(var i=0;i<s.n;i++){var v=s.B[i]*u;for(var j=0;j<s.n;j++)v+=s.A[i][j]*x[j];nx.push(v);}return nx;}
  /* サンプリングした閉ループ: 対象は h = Ts/M で厳密に進める。ctrl(e) を Ts ごとに呼び、lc 刻み後に出して保つ */
  function _w15_simsd(U,G,ctrl,Ts,tEnd,M,lc,r){var h=Ts/M,s=_w15_dss(U,G,h),n=Math.round(tEnd/h),x=[],i,T=[],Y=[],Uo=[],uo=0,pend=null,blow=false;
    for(i=0;i<s.n;i++)x.push(0);
    for(i=0;i<=n;i++){var y=_w15_out(s,x);
      if(i%M===0){var uc=ctrl(r-y);if(!lc)uo=uc;else pend=[i+lc,uc];}
      if(pend&&i===pend[0]){uo=pend[1];pend=null;}
      T.push(i*h);Y.push(y);Uo.push(uo);
      if(!isFinite(y)||Math.abs(y)>1e6){blow=true;break;}
      x=_w15_adv(s,x,uo);}
    return {t:T,y:Y,u:Uo,blow:blow};}
  /* 連続時間の比例制御。測った値を Lm、操作量を Lu 遅らせる（比べる相手） */
  function _w15_simfb(U,G,Kp,tEnd,h,Lm,Lu,r){var s=_w15_dss(U,G,h),n=Math.round(tEnd/h),nm=Math.round(Lm/h),nu=Math.round(Lu/h),bm=[],bu=[],im=0,iu=0,x=[],i,T=[],Y=[],Uo=[];
    for(i=0;i<s.n;i++)x.push(0);for(i=0;i<Math.max(1,nm);i++)bm.push(0);for(i=0;i<Math.max(1,nu);i++)bu.push(0);
    for(i=0;i<=n;i++){var y=_w15_out(s,x),ym=y;if(nm){ym=bm[im];bm[im]=y;im=(im+1)%nm;}
      var u=Kp*(r-ym),ua=u;if(nu){ua=bu[iu];bu[iu]=u;iu=(iu+1)%nu;}
      T.push(i*h);Y.push(y);Uo.push(ua);if(!isFinite(y)||Math.abs(y)>1e6)break;x=_w15_adv(s,x,ua);}
    return {t:T,y:Y,u:Uo};}
  /* 行き過ぎ量 [%] と 2 % 整定時間（落ち着かなければ NaN） */
  function _w15_met(t,y,yf){var mx=-Infinity,last=-1,bd=0.02*Math.abs(yf);for(var k=0;k<y.length;k++){if(y[k]>mx)mx=y[k];if(Math.abs(y[k]-yf)>bd)last=k;}
    return {mp:(mx-yf)/Math.abs(yf)*100,ts:last<0?0:(last+1<t.length?t[last+1]:NaN)};}
  /* 離散時間の状態空間の値 P(z) = C (zI − A)^{-1} B + D（複素数の掃き出し） */
  function _w15_pz(U,s,z){var cx=U.ctl.cx,c=U.ctl.c,n=s.n,M=[],i,j,k;
    for(i=0;i<n;i++){var row=[];for(j=0;j<n;j++)row.push(cx.sub(i===j?z:c(0,0),c(s.A[i][j],0)));row.push(c(s.B[i],0));M.push(row);}
    for(k=0;k<n;k++){var p=k,mx=cx.abs(M[k][k]);for(i=k+1;i<n;i++)if(cx.abs(M[i][k])>mx){mx=cx.abs(M[i][k]);p=i;}
      var tmp=M[k];M[k]=M[p];M[p]=tmp;for(i=k+1;i<n;i++){var f=cx.div(M[i][k],M[k][k]);for(j=k;j<=n;j++)M[i][j]=cx.sub(M[i][j],cx.mul(f,M[k][j]));}}
    var X=[];for(i=n-1;i>=0;i--){var v=M[i][n];for(j=i+1;j<n;j++)v=cx.sub(v,cx.mul(M[i][j],X[j]));X[i]=cx.div(v,M[i][i]);}
    var y=c(s.D,0);for(i=0;i<n;i++)y=cx.add(y,cx.scale(X[i],s.C[i]));return y;}
  /* 離散時間のループ L(e^{jωTs}) = P(z) C(z) z^{-ex} の位相余裕と交差（ω は π/Ts まで） */
  function _w15_dmargin(U,G,Ts,cz,ex){var s=_w15_dss(U,G,Ts),cx=U.ctl.cx,ws=U.ctl.logspace(-2,Math.log10(Math.PI/Ts*0.9999),1500),prev=null,pm=null,wgc=null,ph0=null,i;
    function L(w){var z=cx.polar(1,w*Ts),v=cx.mul(_w15_pz(U,s,z),cz(z));if(ex)v=cx.mul(v,cx.polar(1,-ex*w*Ts));return v;}
    for(i=0;i<ws.length;i++){var v=L(ws[i]),m=cx.abs(v),ph=cx.arg(v)*180/Math.PI;
      if(ph0!==null){while(ph-ph0>180)ph-=360;while(ph-ph0<-180)ph+=360;}ph0=ph;
      if(prev&&(prev.m-1)*(m-1)<=0&&prev.m!==m){var a=(Math.log(prev.m)-0)/(Math.log(prev.m)-Math.log(m));wgc=Math.exp(Math.log(prev.w)+a*(Math.log(ws[i])-Math.log(prev.w)));pm=180+prev.ph+a*(ph-prev.ph);break;}
      prev={m:m,ph:ph,w:ws[i]};}
    return {pm:pm,wgc:wgc};}

  /* ---- 2 節: 零次ホールドとサンプリングの遅れ ---- */
  REG.w15_zoh=function(el,U){
    var S=U.S,ctl=U.ctl;
    U.head(el,"ZERO-ORDER HOLD","T_s ごとに測って比例制御する — 保つことは T_s/2 のむだ時間と同じ".replace(/T_s/g,"T<sub>s</sub>"));
    var r1=U.ctrls(el);
    var obj=U.select(r1,"対象",["モータの角度（比例制御）","モータの速度（比例制御）"],0,function(){kpA.el.style.display=obj.get()===0?"":"none";kpB.el.style.display=obj.get()===1?"":"none";draw();});
    var kpA=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0.05,0.1,0.21,0.3,0.5,0.84],value:0.21,fmt:function(v){return v+" V/rad";},onInput:draw});
    var kpB=U.slider(r1,"比例ゲイン K<sub>P</sub>",{values:[0.02,0.05,0.1,0.2,0.3,0.5],value:0.1,fmt:function(v){return v+" V/(rad/s)";},onInput:draw});
    kpB.el.style.display="none";
    var r2=U.ctrls(el);
    var tsS=U.slider(r2,"サンプリング周期 T<sub>s</sub>",{values:[0.5,1,2,5,10,15,20,30,50,70,100,150],value:50,fmt:function(v){return v+" ms";},onInput:draw});
    var lcS=U.select(r2,"出す時刻",["(A) すぐ出す（測ってから出すまで 0）","(A) 測ってから出すまで Tₛ/4","(A) 測ってから出すまで Tₛ/2","(B) 次の周期に出す（Tₛ 後）"],0,draw);
    var r3=U.ctrls(el);
    var cmp=U.checkbox(r3,"連続時間のループ（測った値を T<sub>s</sub>/2、操作量を L<sub>c</sub> 遅らせる）を重ねる",true,draw);
    var br=U.btnrow(el);
    function base(o,k,t,l){obj.set(o);kpA.el.style.display=o===0?"":"none";kpB.el.style.display=o===1?"":"none";if(o===0)kpA.set(k);else kpB.set(k);tsS.set(t);lcS.set(l);cmp.set(true);draw();}
    U.button(br,"本文の例（モータの角度、50 ms）",function(){base(0,0.21,50,0);});
    U.button(br,"(B) の出し方で 50 ms",function(){base(0,0.21,50,3);});
    U.button(br,"モータの角度、1 ms",function(){base(0,0.21,1,0);});
    U.button(br,"モータの速度、15 ms（式が合わない）",function(){base(1,0.1,15,0);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var o2=obj.get(),G=o2===0?_W15_POS:_W15_SPD,Kp=o2===0?kpA.get():kpB.get(),Ts=tsS.get()/1000,lf=[0,0.25,0.5,1][lcS.get()],Lc=lf*Ts;
      var r=o2===0?1:100,tEnd=o2===0?1.2:0.25,yu=o2===0?"rad":"rad/s",yl=o2===0?"角度":"角速度";
      var M=Math.max(10,Math.ceil(Ts/(o2===0?5e-4:1e-4))),lc=Math.round(lf*M);
      var sd=_w15_simsd(U,G,function(e){return Kp*e;},Ts,tEnd,M,lc,r);
      var hc=o2===0?1e-4:2e-5,ct=_w15_simfb(U,G,Kp,tEnd,hc,0,0,r),dl=_w15_simfb(U,G,Kp,tEnd,hc,Ts/2,Lc,r);
      var yf=r*(o2===0?1:50*Kp/(1+50*Kp));
      /* 余裕 */
      var L0=ctl.tf(G.num.map(function(v){return v*Kp;}),G.den),m0=ctl.margins(L0,1e-2,1e5);
      var wgc=m0.wgc,pm0=m0.pm,pmA=pm0!==null?pm0-wgc*(Lc+Ts/2)*180/Math.PI:null;
      var nar=_w15_nar(box),Wd=nar?400:700,o=[];
      /* (a) 応答 */
      var ax=nar?52:62,aw=nar?330:360,ymax=0;
      [sd,ct].forEach(function(R){R.y.forEach(function(v){if(isFinite(v))ymax=Math.max(ymax,v);});});
      var yt=Math.min(2.2*r,Math.max(1.3*r,ymax*1.08));
      var P=U.plot(ax,26,aw,170,[0,tEnd],[0,yt]);
      o.push(S.T(ax-50,14,"(a) 目標を "+(o2===0?"1 rad":"100 rad/s")+" 変えたときの"+yl,"start",10.5,"ink",true));
      o.push(P.axes({xl:"時間 t [s]",yl:yl+" ["+yu+"]",xt:U.nice(0,tEnd,5),yt:U.nice(0,yt,4).filter(function(v){return v<=yt;}),xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,3);},sz:9}));
      o.push(P.line([[0,yf],[tEnd,yf]],"muted",1,"5 3"));
      function pl(R,c,lw,dash,step){var pts=[];for(var i=0;i<R.t.length;i+=step)pts.push([R.t[i],R.y[i]]);return P.clip(pts,c,lw,dash);}
      o.push(pl(ct,"muted",1.6,"5 3",Math.max(1,Math.round(ct.t.length/600))));
      if(cmp.get())o.push(pl(dl,"teal",1.4,"3 3",Math.max(1,Math.round(dl.t.length/600))));
      o.push(pl(sd,"signal",2.1,null,Math.max(1,Math.round(sd.t.length/800))));
      for(var k=0;k*Ts<=tEnd+1e-12;k++){var ii=k*M;if(ii<sd.y.length&&sd.y[ii]<=yt&&sd.y[ii]>=0)o.push(S.D(P.X(sd.t[ii]),P.Y(sd.y[ii]),"signal",2.3));}
      /* (b) 操作量 */
      var umin=0,umax=0;[sd,ct].forEach(function(R){R.u.forEach(function(v){if(isFinite(v)){umin=Math.min(umin,v);umax=Math.max(umax,v);}});});
      var ur=Math.max(Math.abs(umin),Math.abs(umax))*1.1||1,Q=U.plot(ax,26+170+56,aw,80,[0,tEnd],[Math.max(-ur,umin*1.1-0.02*ur),umax*1.1+0.02*ur]);
      o.push(S.T(ax-50,26+170+44,"(b) 電圧（階段）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:U.nice(0,tEnd,5),yt:U.nice(Q.yr[0],Q.yr[1],3).filter(function(v){return v>=Q.yr[0]&&v<=Q.yr[1];}),xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,2);},sz:9}));
      o.push(Q.line([[0,0],[tEnd,0]],"muted",0.8));
      var cu=[];for(var i2=0;i2<ct.t.length;i2+=Math.max(1,Math.round(ct.t.length/600)))cu.push([ct.t[i2],ct.u[i2]]);o.push(Q.clip(cu,"muted",1.4,"5 3"));
      var su=[];for(var i3=0;i3<sd.t.length;i3+=Math.max(1,Math.round(sd.t.length/1200)))su.push([sd.t[i3],sd.u[i3]]);o.push(Q.clip(su,"gold",2));
      /* (c) 一巡伝達関数の位相（ボード線図） */
      var bx=nar?52:500,by=nar?26+170+56+80+60:26,bw=nar?330:180;
      var wr=o2===0?[1,1000]:[10,10000],ws=ctl.logspace(Math.log10(wr[0]),Math.log10(wr[1]),400);
      var B0=ctl.bode(L0,ws),B1=ctl.bode(ctl.tf(L0.num,L0.den,Lc+Ts/2),ws);
      var phr=[-270,0];
      var bd=ctl.bodeSvg([{w:ws,db:B0.db,ph:B0.ph,c:"muted",dash:"5 3",lw:1.6},{w:ws,db:B1.db,ph:B1.ph,c:"signal",lw:2}],{x:bx,y:by+12,w:bw,hm:80,hp:120,gap:24,wr:wr,dbr:[-40,40],phr:phr});
      o.push(S.T(bx-48,by,"(c) 一巡伝達関数","start",10.5,"ink",true));o.push(bd.svg);
      if(wgc){o.push(S.L(bd.Pm.X(wgc),bd.Pm.y,bd.Pm.X(wgc),bd.Pp.y+bd.Pp.h,"faint",1,"3 3"));
        var p0=-180+pm0,p1=-180+pmA;
        if(p0>=phr[0])o.push(S.D(bd.Pp.X(wgc),bd.Pp.Y(p0),"muted",3.5));
        if(p1>=phr[0])o.push(S.D(bd.Pp.X(wgc),bd.Pp.Y(p1),"signal",3.8));
        o.push(S.TX(bd.Pp.X(wgc)+4,bd.Pp.y+bd.Pp.h-6,"ω_gc","start",9,"muted",true,true));}
      var wn=Math.PI/Ts;if(wn>=wr[0]&&wn<=wr[1]){o.push(S.L(bd.Pm.X(wn),bd.Pm.y,bd.Pm.X(wn),bd.Pp.y+bd.Pp.h,"alias",1,"2 3"));o.push(S.TX(bd.Pm.X(wn)-3,bd.Pm.y+10,"π/T_s","end",9,"alias",true,true));}
      var lgY=nar?by+12+80+24+120+52:26+170+56+80+64;
      o.push(S.LEGL(nar?52:62,lgY,[["muted","5 3","連続時間"],["signal",null,"サンプリング"],["teal","3 3","連続時間＋むだ時間"]],9.5,12));
      if(!nar)o.push(S.LEGL(500,26+12+80+24+120+52,[["muted","5 3","遅れなし"],["signal",null,"−ω(L_c + T_s/2)"]],9,8));
      box.set(S.svg(Wd,lgY+12,o));
      /* 読み出し */
      var ms=_w15_met(sd.t,sd.y,yf),mc=_w15_met(ct.t,ct.y,yf),md=_w15_met(dl.t,dl.y,yf),h="",wT=wgc?wgc*Ts:0;
      if(wgc){h+="連続時間: ω<sub>gc</sub> = "+_w15_g(wgc,3)+" rad/s、位相余裕 φ<sub>m</sub>(0) = "+_w15_f(pm0,1)+"°、行き過ぎ量 "+_w15_f(mc.mp,1)+" %<br>";
        h+="位相余裕の式 φ<sub>m</sub>(0) − 57.3° × ω<sub>gc</sub>(L<sub>c</sub> + T<sub>s</sub>/2) = "+_w15_f(pm0,1)+"° − "+_w15_f(pm0-pmA,1)+"° = <b>"+_w15_f(pmA,1)+"°</b>（L<sub>c</sub> = "+_w15_ms(Lc)+"）<br>";}
      else h+="一巡伝達関数のゲインが 1 を超えないので、ゲイン交差角周波数は無く、位相余裕は決まらない（このループはどの遅れでも不安定にならない）<br>";
      if(sd.blow)h+='<span class="warn">サンプリングした閉ループは発散した</span><br>';
      else h+="行き過ぎ量: サンプリング <b>"+_w15_f(ms.mp,1)+" %</b>、連続時間＋むだ時間 "+_w15_f(md.mp,1)+" %（2 % 整定時間 "+(isFinite(ms.ts)?_w15_g(ms.ts,3)+" s":"範囲の外")+"）<br>";
      if(wgc)h+="ω<sub>gc</sub>T<sub>s</sub> = "+_w15_g(wT,3)+" rad"+(wT>0.5?'：<span class="warn">0.5 rad を超えたので、式の値は合わなくなる（5 節）</span>':"（0.5 rad 以下なので、式はよく合う）");
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 3 節: エイリアシングとアンチエイリアスフィルタ ---- */
  REG.w15_alias=function(el,U){
    var S=U.S;
    U.head(el,"ALIASING","速い揺れが、取り出した点の列で遅い揺れに化ける");
    var r0=U.ctrls(el);
    var mode=U.select(r0,"場面",["波形で見る（周波数を fₛ との比で選ぶ）","温度の板（50 Hz を 1 s ごとに読む）"],0,function(){sync();draw();});
    var r1=U.ctrls(el);
    var fr=U.slider(r1,"揺れの周波数 f / f<sub>s</sub>",{min:0.05,max:3,step:0.01,value:0.9,fmt:function(v){return _w15_f(v,2);},onInput:draw});
    var fon=U.checkbox(r1,"アンチエイリアスフィルタ（RC）",false,draw);
    var fc=U.slider(r1,"フィルタの折れ点 / f<sub>s</sub>",{values:[0.05,0.1,0.2,0.3,0.5],value:0.1,fmt:function(v){return _w15_f(v,2);},onInput:draw});
    var r2=U.ctrls(el);
    var fm=U.slider(r2,"商用電源の周波数",{values:[49.98,49.99,49.995,49.9975,50,50.0025,50.005,50.01,50.02],value:50.0025,fmt:function(v){return _w15_g(v,6)+" Hz";},onInput:draw});
    var am=U.slider(r2,"読みに乗る揺れの振幅",{values:[0,0.1,0.2,0.5,1],value:0.5,fmt:function(v){return v+" K";},onInput:draw});
    var ft=U.select(r2,"フィルタ",["なし","RC（Tf = 0.1 s）を ADC の前に","1 ms ごとに 100 回測って平均"],0,draw);
    var ph=U.slider(r2,"50 Hz の位相（測る瞬間）",{min:0,max:360,step:15,value:90,fmt:function(v){return v+"°";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（0.9f<sub>s</sub>）",function(){mode.set(0);fr.set(0.9);fon.set(false);fc.set(0.1);sync();draw();});
    U.button(br,"1.9f<sub>s</sub>（0.1f<sub>s</sub> に化ける）",function(){mode.set(0);fr.set(1.9);fon.set(false);sync();draw();});
    U.button(br,"ちょうど f<sub>s</sub>（一定のずれ）",function(){mode.set(0);fr.set(1);fon.set(false);sync();draw();});
    U.button(br,"温度の板の例（50.0025 Hz）",function(){mode.set(1);fm.set(50.0025);am.set(0.5);ft.set(0);ph.set(90);sync();draw();});
    U.button(br,"温度の板、ちょうど 50 Hz",function(){mode.set(1);fm.set(50);am.set(0.5);ft.set(0);ph.set(90);sync();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function sync(){var m=mode.get();r1.style.display=m===0?"":"none";r2.style.display=m===1?"":"none";fc.el.style.display=fon.get()?"":"none";}
    function fold(x){return Math.abs(x-Math.round(x));}
    function draw(){
      sync();
      var nar=_w15_nar(box),Wd=nar?400:700,o=[],h="";
      if(mode.get()===0){
        var f=fr.get(),g=1,phi=0;
        if(fon.get()){var x=f/fc.get();g=1/Math.sqrt(1+x*x);phi=-Math.atan(x);}
        var fa=fold(f),ax=nar?44:62,aw=nar?340:610;
        var P=U.plot(ax,26,aw,150,[0,16],[-1.3,1.3]);
        o.push(S.TX(ax-40,14,"(a) 揺れ（振幅 1）を T_s ごとに取り出す（横軸は t/T_s）","start",10.5,"ink",true));
        o.push(P.axes({xl:"時間 t / T_s",yl:"値",xt:U.nice(0,16,8),yt:[-1,0,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w15_g(v,2);},sz:9}));
        var pts=[],ptsF=[],ali=[];for(var i=0;i<=1600;i++){var t=i/100;pts.push([t,Math.sin(2*Math.PI*f*t)]);ptsF.push([t,g*Math.sin(2*Math.PI*f*t+phi)]);}
        /* 点の列が示す遅い揺れ: 周波数 f − m（m は最も近い整数） */
        var mm=Math.round(f);for(var j=0;j<=800;j++){var t2=j/50;ali.push([t2,g*Math.sin(2*Math.PI*(f-mm)*t2+phi)]);}
        o.push(P.line(pts,"teal",fon.get()?0.9:1.3,fon.get()?"3 3":null));
        if(fon.get())o.push(P.line(ptsF,"teal",1.5));
        o.push(P.line(ali,"alias",2,"7 4"));
        for(var k=0;k<=16;k++)o.push(S.D(P.X(k),P.Y(g*Math.sin(2*Math.PI*f*k+phi)),"ink",3.2));
        /* (b) 折り返し */
        var Q=U.plot(ax,26+150+70,aw,120,[0,3],[0,0.6]);
        o.push(S.T(ax-40,26+150+58,"(b) 元の周波数と、点の列に現れる周波数","start",10.5,"ink",true));
        o.push(S.RECT(Q.X(0.5),Q.y,Q.X(3)-Q.X(0.5),Q.h,0,U.soft("alias"),"none",0));
        o.push(Q.axes({xl:"元の周波数 f / f_s",yl:"現れる周波数 / f_s",xt:[0,0.5,1,1.5,2,2.5,3],yt:[0,0.25,0.5],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},sz:9}));
        var tri=[];for(var q=0;q<=600;q++){var xx=q/200;tri.push([xx,fold(xx)]);}
        o.push(Q.line(tri,"signal",2));
        o.push(S.L(Q.X(f),Q.Y(0),Q.X(f),Q.Y(fa),"alias",1.2,"3 3"));o.push(S.L(Q.X(0),Q.Y(fa),Q.X(f),Q.Y(fa),"alias",1.2,"3 3"));
        o.push(S.D(Q.X(f),Q.Y(fa),"alias",4.5));o.push(S.D(Q.X(fa),Q.Y(fa),"green",4));
        box.set(S.svg(Wd,26+150+70+120+44,o));
        h+="元の揺れの周波数 f = "+_w15_f(f,2)+" f<sub>s</sub> → 点の列に現れる周波数 |f − "+mm+"f<sub>s</sub>| = <b>"+_w15_f(fa,2)+" f<sub>s</sub></b>"+(f>0.5?"（ナイキスト周波数 0.5 f<sub>s</sub> より速いので、折り返して現れる）":"（ナイキスト周波数より遅いので、そのまま現れる）")+"<br>";
        if(fa<1e-9)h+='<span class="warn">f<sub>s</sub> の整数倍なので、毎回同じ位相を測り、一定のずれに化ける</span><br>';
        h+="化けた揺れの振幅: <b>"+_w15_f(g,3)+"</b>"+(fon.get()?"（フィルタのゲイン。折れ点 "+_w15_f(fc.get(),2)+" f<sub>s</sub>）":"（フィルタなし）");
      }else{
        /* 温度の板（11 章 3 節の PI: 10 W/K・160 s、1 s ごと、クランプ）。読みに 50 Hz の揺れ */
        var fM=fm.get(),A=am.get(),F=ft.get(),ph0=ph.get()*Math.PI/180,tEnd=1600,hh=0.1,qd=Math.exp(-hh/500),n=Math.round(tEnd/hh),nd=Math.round(20/hh);
        var y=35,I=28,u=28,buf=[],bi=0,out=[];for(var b=0;b<nd;b++)buf.push(28);
        var Hm=1/Math.sqrt(1+Math.pow(2*Math.PI*fM*0.1,2)),Ha=-Math.atan(2*Math.PI*fM*0.1);
        for(var i4=0;i4<=n;i4++){var tt=i4*hh;
          if(i4%10===0){var hum;
            if(F===0)hum=A*Math.sin(2*Math.PI*fM*tt+ph0);
            else if(F===1)hum=A*Hm*Math.sin(2*Math.PI*fM*tt+ph0+Ha);
            else{hum=0;for(var jj=0;jj<100;jj++)hum+=A*Math.sin(2*Math.PI*fM*(tt-0.1+(jj+1)*0.001)+ph0);hum/=100;}
            var rd=y+hum,e=35-rd,uc=10*e+I;u=Math.min(Math.max(uc,0),80);
            if(!((uc>80&&e>0)||(uc<0&&e<0)))I+=10/160*e;
            out.push([tt,y+25,rd+25,u]);}
          var ua=buf[bi];buf[bi]=u;bi=(bi+1)%nd;y=1.25*ua+(y-1.25*ua)*qd;}
        var late=out.filter(function(p){return p[0]>=800;});
        function rng(c){var a=Infinity,b2=-Infinity,s=0;late.forEach(function(p){a=Math.min(a,p[c]);b2=Math.max(b2,p[c]);s+=p[c];});return {lo:a,hi:b2,mean:s/late.length};}
        var Rt=rng(1),Rr=rng(2),Ru=rng(3);
        var ax2=nar?50:70,aw2=nar?330:600,rows=[["(a) 読み [°C]",2,[58.8,61.2],[59,60,61]],["(b) ヒータの電力 [W]",3,[18,38],[20,28,36]],["(c) 本当の板の温度 [°C]",1,[58.8,61.2],[59,60,61]]],y0=20;
        rows.forEach(function(rw,ri){var Pq=U.plot(ax2,y0+12,aw2,82,[0,1600],rw[2]);
          o.push(S.T(ax2,y0+4,rw[0],"start",10,"ink",true));
          o.push(Pq.axes({xl:ri===2?"時間 t [s]":null,xt:[0,400,800,1200,1600],yt:rw[3],xfmt:ri===2?function(v){return String(v);}:function(){return "";},yfmt:function(v){return String(v);},sz:9}));
          if(rw[1]!==3)o.push(Pq.line([[0,60],[1600,60]],"muted",1,"5 3"));
          o.push(Pq.clip(out.map(function(p){return [p[0],p[rw[1]]];}),rw[1]===3?"gold":(rw[1]===2?"teal":"signal"),1.6));
          y0+=ri===2?130:112;});
        box.set(S.svg(Wd,y0+8,o));
        var fa2=Math.abs(fM-50*1);
        h+="読みに現れる揺れの周波数 |"+_w15_g(fM,6)+" − 50 × 1| = <b>"+_w15_g(fa2,3)+" Hz</b>"+(fa2>1e-12?"（周期 "+_w15_g(1/fa2,3)+" s）":"（一定のずれ）")+"<br>";
        h+="800 s より後: 本当の温度 "+_w15_f(Rt.lo,2)+"〜"+_w15_f(Rt.hi,2)+" °C（平均 "+_w15_f(Rt.mean,2)+" °C）、読み "+_w15_f(Rr.lo,2)+"〜"+_w15_f(Rr.hi,2)+" °C、ヒータ "+_w15_f(Ru.lo,1)+"〜"+_w15_f(Ru.hi,1)+" W<br>";
        if(F===0&&A>0&&(Rt.hi-Rt.lo>0.2||Math.abs(Rt.mean-60)>0.1))h+='<span class="warn">50 Hz の揺れが、本当の温度を動かしている</span>';
        else if(A>0)h+='<span class="ok">本当の温度への影響は小さい</span>';
      }
      ro.innerHTML=h;
    }
    sync();draw();
  };

  /* ---- 4 節: 差分で近似する ---- */
  /* 計算式 u[k] = b0 e[k] + b1 e[k−1] + a u[k−1] の係数。kind: 0 進み補償（13 章 3 節）、1 PI（10 章 5 節） */
  function _w15_coef(kind,m,Ts){
    if(kind===0){var Kc=0.624,wz=17.3,wp=52.0,w0=30;
      if(m===0)return {b0:Kc*wp/wz,b1:Kc*(wp*Ts-wp/wz),a:1-wp*Ts};
      if(m===1){var a=1/(1+wp*Ts);return {b0:Kc*(wp/wz)*(1+wz*Ts)*a,b1:-Kc*(wp/wz)*a,a:a};}
      var g=m===2?2/Ts:w0/Math.tan(w0*Ts/2),d=g/wp+1;return {b0:Kc*(g/wz+1)/d,b1:-Kc*(g/wz-1)/d,a:(g/wp-1)/d};}
    var Kp=0.1,Ki=2,w1=100;
    if(m===0)return {b0:Kp,b1:Ki*Ts-Kp,a:1};
    if(m===1)return {b0:Kp+Ki*Ts,b1:-Kp,a:1};
    var g2=m===2?2/Ts:w1/Math.tan(w1*Ts/2);return {b0:Kp+Ki/g2,b1:Ki/g2-Kp,a:1};}
  var _W15_MCOL=["purple","teal","signal","green"],_W15_MNAME=["前進差分","後退差分","双一次変換","双一次変換＋プリワーピング"];
  REG.w15_disc=function(el,U){
    var S=U.S,ctl=U.ctl,cx=ctl.cx;
    U.head(el,"DISCRETIZATION","伝達関数の制御器を、T_s ごとの計算式にする".replace("T_s","T<sub>s</sub>"));
    var r1=U.ctrls(el);
    var kd=U.select(r1,"制御器",["進み補償（13 章 3 節）","PI（10 章 5 節）"],0,draw);
    var mt=U.select(r1,"近似",_W15_MNAME,2,draw);
    var tsS=U.slider(r1,"サンプリング周期 T<sub>s</sub>",{values:[0.5,1,2,5,10,15,20,30,40],value:10,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var oth=U.checkbox(r2,"ほかの近似の応答も細く重ねる",false,draw);
    var br=U.btnrow(el);
    function set(k,m,t){kd.set(k);mt.set(m);tsS.set(t);draw();}
    U.button(br,"本文の例（進み補償・双一次変換・10 ms）",function(){set(0,2,10);});
    U.button(br,"前進差分で 30 ms（倍率が負）",function(){set(0,0,30);});
    U.button(br,"前進差分で 40 ms（発散）",function(){set(0,0,40);});
    U.button(br,"プリワーピング（30 ms）",function(){set(0,3,30);});
    U.button(br,"PI・双一次変換・5 ms",function(){set(1,2,5);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var k=kd.get(),m=mt.get(),Ts=tsS.get()/1000,cf=_w15_coef(k,m,Ts),G=k===0?_W15_POS:_W15_SPD;
      var Cc=k===0?ctl.tf([0.624/17.3,0.624],[1/52,1]):ctl.tf([0.1,2],[1,0]),r=k===0?1:100,tEnd=k===0?0.5:0.15;
      var nar=_w15_nar(box),Wd=nar?400:700,o=[];
      /* (a) 制御器のボード線図（連続時間と計算式） */
      var wN=Math.PI/Ts,wr=k===0?[1,Math.min(1000,wN)]:[1,Math.min(3000,wN)],ws=ctl.logspace(0,Math.log10(wr[1]),400);
      var Bc=ctl.bode(Cc,ws),db=[],ph=[],prev=null;
      ws.forEach(function(w){var z=cx.polar(1,w*Ts),v=cx.div(cx.add(cx.c(cf.b0,0),cx.scale(cx.inv(z),cf.b1)),cx.sub(cx.c(1,0),cx.scale(cx.inv(z),cf.a))),p=cx.arg(v)*180/Math.PI;
        if(prev!==null){while(p-prev>180)p-=360;while(p-prev<-180)p+=360;}else if(k===1){while(p>0)p-=360;}prev=p;db.push(20*Math.log10(cx.abs(v)));ph.push(p);});
      var bx=nar?52:62,bw=nar?330:270;
      var dbr=k===0?[-6,8]:[-30,30],phr=k===0?[-30,60]:[-100,10];
      var bd=ctl.bodeSvg([{w:ws,db:Bc.db,ph:Bc.ph,c:"muted",dash:"5 3",lw:1.6},{w:ws,db:db,ph:ph,c:_W15_MCOL[m],lw:2.2}],{x:bx,y:30,w:bw,hm:100,hp:110,gap:26,wr:[wr[0],wr[1]],dbr:dbr,phr:phr});
      o.push(S.TX(bx-48,16,"(a) 制御器のボード線図（π/T_s まで）","start",10.5,"ink",true));o.push(bd.svg);
      var wg=k===0?30:100;if(wg<=wr[1]){o.push(S.L(bd.Pm.X(wg),bd.Pm.y,bd.Pm.X(wg),bd.Pp.y+bd.Pp.h,"faint",1,"3 3"));o.push(S.TX(bd.Pp.X(wg)+3,bd.Pp.y+10,"ω_gc","start",9,"muted",true,true));}
      /* (b) 閉ループの応答 */
      var rx=nar?52:420,ry=nar?bd.h+30:30,rw=nar?330:260;
      var M=Math.max(10,Math.ceil(Ts/(k===0?2e-4:2e-5)));
      var sims=[],ms=oth.get()?[0,1,2,3]:[m];
      ms.forEach(function(mm){var c=_w15_coef(k,mm,Ts),e1=0,u1=0;var R=_w15_simsd(U,G,function(e){var u=c.b0*e+c.b1*e1+c.a*u1;e1=e;u1=u;return u;},Ts,tEnd,M,0,r);R.m=mm;sims.push(R);});
      var Lp=ctl.loop(ctl.tf(G.num,G.den),Cc),SR=ctl.step(Lp.Gyr,tEnd,1500),SU=ctl.step(Lp.Gur,tEnd,1500);
      var yt=1.6*r,Pq=U.plot(rx,ry+12,rw,140,[0,tEnd],[0,yt]);
      o.push(S.T(rx-48,ry,"(b) 目標を "+(k===0?"1 rad":"100 rad/s")+" 変えたとき","start",10.5,"ink",true));
      o.push(Pq.axes({xl:null,yl:k===0?"角度 [rad]":"角速度 [rad/s]",xt:U.nice(0,tEnd,5),yt:U.nice(0,yt,4).filter(function(v){return v<=yt;}),xfmt:function(){return "";},yfmt:function(v){return _w15_g(v,3);},sz:9}));
      o.push(Pq.line([[0,r],[tEnd,r]],"muted",1,"5 3"));
      o.push(Pq.clip(SR.t.map(function(t,i){return [t,r*SR.y[i]];}),"muted",1.6,"5 3"));
      sims.forEach(function(R){var st=Math.max(1,Math.round(R.t.length/700)),pts=[];for(var i=0;i<R.t.length;i+=st)pts.push([R.t[i],R.y[i]]);o.push(Pq.clip(pts,_W15_MCOL[R.m],R.m===m?2.2:1.1));});
      var main=sims.filter(function(R){return R.m===m;})[0];
      /* (c) 操作量 */
      var ua=[],ub=Infinity,uc_=-Infinity;main.u.forEach(function(v){if(isFinite(v)){ub=Math.min(ub,v);uc_=Math.max(uc_,v);}});SU.y.forEach(function(v){ub=Math.min(ub,v*r);uc_=Math.max(uc_,v*r);});
      var span=Math.max(0.5,uc_-ub),Qq=U.plot(rx,ry+12+140+38,rw,90,[0,tEnd],[ub-0.08*span,uc_+0.08*span]);
      o.push(S.T(rx-48,ry+12+140+28,"(c) 操作量（電圧）","start",10.5,"ink",true));
      o.push(Qq.axes({xl:"時間 t [s]",yl:"電圧 [V]",xt:U.nice(0,tEnd,5),yt:U.nice(Qq.yr[0],Qq.yr[1],3).filter(function(v){return v>=Qq.yr[0]&&v<=Qq.yr[1];}),xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,2);},sz:9}));
      o.push(Qq.line([[0,0],[tEnd,0]],"muted",0.8));
      o.push(Qq.clip(SU.t.map(function(t,i){return [t,r*SU.y[i]];}),"muted",1.4,"5 3"));
      var st2=Math.max(1,Math.round(main.t.length/1200)),pu=[];for(var i5=0;i5<main.t.length;i5+=st2)pu.push([main.t[i5],main.u[i5]]);o.push(Qq.clip(pu,"gold",1.8));
      var lgY=Math.max(bd.h+6,ry+12+140+38+90+40);
      o.push(S.LEGL(nar?52:62,lgY,[["muted","5 3","連続時間"],[_W15_MCOL[m],null,_W15_MNAME[m]]],9.5,14));
      box.set(S.svg(Wd,lgY+12,o));
      /* 読み出し */
      var h="",ex=k===0?Math.exp(-52*Ts):1;
      h+="計算式: u[k] = "+_w15_f(cf.b0,4)+" e[k] "+(cf.b1<0?"− ":"+ ")+_w15_f(Math.abs(cf.b1),4)+" e[k−1] + "+_w15_f(cf.a,4)+" u[k−1]<br>";
      if(k===0){h+="制御器の倍率 a = <b>"+_w15_f(cf.a,4)+"</b>（正しい倍率 e<sup>−52.0T<sub>s</sub></sup> = "+_w15_f(ex,4)+"）: ";
        h+=Math.abs(cf.a)>1?'<span class="warn">大きさが 1 を超え、制御器が発散する</span>':(cf.a<0?'<span class="warn">負なので、操作量が 1 回ごとに符号を変えて揺れる</span>':'<span class="ok">0 と 1 の間で、発散しない</span>');h+="<br>";}
      else h+="積分の極 s = 0 は、どの近似でも倍率 a = 1（z = 1）に写る<br>";
      var zc=cx.polar(1,wg*Ts),Cd=cx.div(cx.add(cx.c(cf.b0,0),cx.scale(cx.inv(zc),cf.b1)),cx.sub(cx.c(1,0),cx.scale(cx.inv(zc),cf.a))),Cw=ctl.freq(Cc,wg);
      var dph=(cx.arg(Cd)-cx.arg(Cw))*180/Math.PI;while(dph>180)dph-=360;while(dph<-180)dph+=360;
      h+="交差 "+wg+" rad/s での制御器の位相のずれ: <b>"+(dph>=0?"+":"")+_w15_f(dph,1)+"°</b>、ゲインの比 "+_w15_f(cx.abs(Cd)/cx.abs(Cw),3)+"（零次ホールドの遅れは別に −"+_w15_f(wg*Ts/2*180/Math.PI,1)+"°）<br>";
      var dm=_w15_dmargin(U,G,Ts,function(z){return cx.div(cx.add(cx.c(cf.b0,0),cx.scale(cx.inv(z),cf.b1)),cx.sub(cx.c(1,0),cx.scale(cx.inv(z),cf.a)));},0);
      var m0=ctl.margins(ctl.series(ctl.tf(G.num,G.den),Cc),1e-2,1e5),mt2=_w15_met(main.t,main.y,r),mc=_w15_met(SR.t,SR.y.map(function(v){return v*r;}),r);
      if(main.blow||Math.abs(cf.a)>1)h+='<span class="warn">閉ループは発散する</span>';
      else h+="位相余裕（5 節の方法）: <b>"+(dm.pm!==null?_w15_f(dm.pm,1)+"°":"—")+"</b>（連続時間 "+_w15_f(m0.pm,1)+"°）、行き過ぎ量 <b>"+_w15_f(mt2.mp,1)+" %</b>（連続時間 "+_w15_f(mc.mp,1)+" %）";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 5 節: z 平面 ---- */
  REG.w15_zplane=function(el,U){
    var S=U.S,ctl=U.ctl,cx=ctl.cx;
    U.head(el,"S-PLANE ↔ Z-PLANE","s 平面の極を動かすと、z 平面の極と、取り出した点の列が変わる");
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"極の実部 σ",{min:-60,max:10,step:1,value:-10,fmt:function(v){return _w15_g(v,3)+" /s";},onInput:function(){draw();}});
    var om=U.slider(r1,"極の虚部 ω",{min:0,max:120,step:1,value:30,fmt:function(v){return _w15_g(v,3)+" rad/s";},onInput:function(){draw();}});
    var tsS=U.slider(r1,"サンプリング周期 T<sub>s</sub>",{values:[1,2,5,10,20,30,50,70,100,150],value:20,fmt:function(v){return v+" ms";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var cF=U.checkbox(r2,"前進差分の倍率",true,draw),cB=U.checkbox(r2,"後退差分の倍率",true,draw),cT=U.checkbox(r2,"双一次変換の倍率",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（−10 ± j30、20 ms）",function(){sg.set(-10);om.set(30);tsS.set(20);draw();});
    U.button(br,"T<sub>s</sub> を延ばす: 150 ms で折り返す",function(){sg.set(-10);om.set(30);tsS.set(150);draw();});
    U.button(br,"速い極で前進差分が発散（−60、50 ms）",function(){sg.set(-60);om.set(0);tsS.set(50);draw();});
    U.button(br,"虚軸の上（0 ± j30）",function(){sg.set(0);om.set(30);tsS.set(20);draw();});
    var box=U.svgbox(el),ro=U.readout(el),PP=null,dragOn=false;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"){dragOn=false;return;}
      if(x==null||!PP)return;
      if(type==="down"){var d1=Math.hypot(x-PP.X(sg.get()),y-PP.Y(om.get())),d2=Math.hypot(x-PP.X(sg.get()),y-PP.Y(-om.get()));
        if(Math.min(d1,d2)>18)return false;dragOn=true;return;}
      if(!dragOn)return;
      var s1=Math.max(-60,Math.min(10,Math.round(PP.ux(x)))),w1=Math.max(0,Math.min(120,Math.round(Math.abs(PP.uy(y)))));
      sg.set(s1);om.set(w1);draw();});
    function draw(){
      var s0=sg.get(),w0=om.get(),Ts=tsS.get()/1000,lam=cx.c(s0,w0),lT=cx.scale(lam,Ts);
      var zE=cx.exp(lT),zF=cx.add(cx.c(1,0),lT),zB=cx.inv(cx.sub(cx.c(1,0),lT)),zT=cx.div(cx.add(cx.c(1,0),cx.scale(lT,0.5)),cx.sub(cx.c(1,0),cx.scale(lT,0.5)));
      var nar=_w15_nar(box),Wd=nar?400:700,o=[];
      /* (a) s 平面 */
      var P=U.plot(nar?52:56,26,nar?150:250,nar?170:210,[-70,15],[-130,130]);PP=P;
      o.push(S.T(nar?10:14,14,"(a) s 平面（ドラッグできる）","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","line",0.8));
      var wn=Math.PI/Ts;if(wn<130)o.push(S.RECT(P.x,P.Y(Math.min(130,wn)),P.w,P.Y(-Math.min(130,wn))-P.Y(Math.min(130,wn)),0,U.soft("muted"),"none",0));
      else o.push(S.RECT(P.x,P.y,P.w,P.h,0,U.soft("muted"),"none",0));
      o.push(ctl.splane(P,{}));
      o.push(P.axes({xt:[-60,-40,-20,0],yt:[-120,-60,0,60,120],xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return _w15_g(v,3);},sz:9}));
      if(wn<130){[wn,-wn].forEach(function(v){o.push(S.L(P.x,P.Y(v),P.x+P.w,P.Y(v),"alias",1.2,"4 3"));});o.push(S.TX(P.x+4,P.Y(wn)-4,"±π/T_s","start",9,"alias",true,true));}
      o.push(ctl.pz(P,[lam,cx.conj(lam)],[],"green",6));
      o.push(S.TX(P.x+P.w,P.y+P.h+28,"灰色の帯: 虚部が ±π/T_s の内側","end",9,"muted"));
      /* (b) z 平面 */
      var zx=nar?236:360,zr=1.6,Z=U.plot(zx,26,nar?150:210,nar?150:210,[-zr,zr],[-zr,zr]);
      o.push(S.T(zx-10,14,"(b) z 平面","start",10.5,"ink",true));
      o.push(S.RECT(Z.x,Z.y,Z.w,Z.h,0,"var(--screen)","line",0.8));
      o.push(Z.axes({xt:[-1,0,1],yt:[-1,0,1],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");},sz:9}));
      o.push(S.L(Z.x,Z.Y(0),Z.x+Z.w,Z.Y(0),"muted",1));o.push(S.L(Z.X(0),Z.y,Z.X(0),Z.y+Z.h,"muted",1));
      var cir=[];for(var i=0;i<=120;i++){var a=2*Math.PI*i/120;cir.push([Math.cos(a),Math.sin(a)]);}o.push(Z.line(cir,"ink",1.3,"4 3"));
      function zmark(z,c,r){var out=[];[z,cx.conj(z)].forEach(function(q){var xx=Math.max(-zr,Math.min(zr,q.re)),yy=Math.max(-zr,Math.min(zr,q.im));out.push(S.X(Z.X(xx),Z.Y(yy),r,c,2.2));});return out.join("");}
      if(cF.get())o.push(zmark(zF,"purple",4.5));
      if(cB.get())o.push(zmark(zB,"teal",4.5));
      if(cT.get())o.push(zmark(zT,"signal",4.5));
      o.push(zmark(zE,"green",6.5));
      /* (c) 時間の応答: e^{σt}cos(ωt) と、取り出した点、近似の列 */
      var cy=nar?26+170+60:26+210+60,cw=nar?330:600,cxp=nar?52:56,tEnd=Math.max(16*Ts,Math.min(1.5,6/Math.max(1,Math.abs(s0)+1)));
      var nK=Math.min(60,Math.floor(tEnd/Ts));tEnd=Math.max(nK,4)*Ts;
      var Q=U.plot(cxp,cy,cw,130,[0,tEnd],[-1.6,1.6]);
      o.push(S.TX(cxp-42,cy-12,"(c) 連続時間の応答 e^{σt} cos ωt と、T_s ごとに取り出した点（緑）・近似の列","start",10.5,"ink",true));
      o.push(Q.axes({xl:"時間 t [s]",xt:U.nice(0,tEnd,6),yt:[-1,0,1],xfmt:function(v){return _w15_g(v,3);},yfmt:function(v){return String(v).replace("-","−");},sz:9}));
      var cp=[];for(var j=0;j<=800;j++){var t=tEnd*j/800;cp.push([t,Math.exp(s0*t)*Math.cos(w0*t)]);}o.push(Q.clip(cp,"muted",1.4));
      /* 折り返した遅い揺れ */
      var wa=Math.abs(((w0*Ts+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI)/Ts,ali=w0*Ts>Math.PI+1e-9;
      if(ali){var ap=[];for(var j2=0;j2<=800;j2++){var t2=tEnd*j2/800;ap.push([t2,Math.exp(s0*t2)*Math.cos(wa*t2)]);}o.push(Q.clip(ap,"alias",1.6,"6 4"));}
      function seq(q,c,r){var out=[],cur=cx.c(1,0);for(var k=0;k<=nK;k++){var v=cur.re;if(Math.abs(v)<=1.6)out.push(S.D(Q.X(k*Ts),Q.Y(v),c,r));cur=cx.mul(cur,q);}return out.join("");}
      if(cF.get())o.push(seq(zF,"purple",2.2));if(cB.get())o.push(seq(zB,"teal",2.2));if(cT.get())o.push(seq(zT,"signal",2.2));
      o.push(seq(zE,"green",3.4));
      box.set(S.svg(Wd,cy+130+40,o));
      /* 読み出し */
      function pol(z){return "|z| = "+_w15_f(cx.abs(z),3)+"、偏角 "+_w15_f(cx.arg(z)*180/Math.PI,1)+"°";}
      function st(z){return cx.abs(z)<1-1e-9?'<span class="ok">内側</span>':(cx.abs(z)>1+1e-9?'<span class="warn">外側（発散）</span>':"単位円の上");}
      var h="極 λ = "+_w15_g(s0,3)+" ± j"+_w15_g(w0,3)+" rad/s、λT<sub>s</sub> = "+_w15_g(s0*Ts,3)+" ± j"+_w15_g(w0*Ts,3)+"<br>";
      h+="正しい写り方 e<sup>λT<sub>s</sub></sup>: "+pol(zE)+"（"+st(zE)+"）<br>";
      h+="前進差分 1 + λT<sub>s</sub>: "+pol(zF)+"（"+st(zF)+"）、後退差分: "+pol(zB)+"（"+st(zB)+"）、双一次変換: "+pol(zT)+"（"+st(zT)+"）<br>";
      h+=ali?'<span class="warn">ωT<sub>s</sub> = '+_w15_g(w0*Ts,3)+' rad が π を超えたので、点の列は '+_w15_g(wa,3)+' rad/s の遅い揺れに見える（赤の破線。エイリアシング）</span>':"ωT<sub>s</sub> = "+_w15_g(w0*Ts,3)+" rad（π より小さいので、点の列は元の揺れの速さを表す）";
      ro.innerHTML=h;
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
