/* 組み込みの仕様書と設計書 — 章内インタラクティブ部品（制御工学編・GNSS 編の共通部品を引き継いだ）
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
  function tw(s,sz,mono){var w=0;s=String(s);for(var i=0;i<s.length;i++){var o=s.charCodeAt(i);w+=(o<128||(o>=0x1E00&&o<=0x1EFF))?sz*(mono?0.6:0.56):(o>=0xFF61&&o<=0xFF9F?sz*0.55:((o===0xB2||o===0xB3||o===0xB9||(o>=0x2070&&o<=0x209F))?sz*0.4:((o>=0x300&&o<=0x36F)?0:((o>=0x370&&o<=0x3FF)?sz*0.6:sz))));}return w;}   /* 結合文字は幅 0、ギリシャ文字は半角ほど */
  /* TX の文字列を [種類, 文字] の並びに分ける（figures.py の _tx_tokens と同じ）。種類は n・sub・sup・supsub（上付きの中の添字）・dot1・dot2。
     添字の前の文字には結合文字（波線 ̃・山形 ̂ など）が付いていてよく（"P̃_0"）、括弧なしの添字にはギリシャ文字も書ける（"C_θ"）。 */
  var TXS={sub:0.72,sup:0.72,supsub:0.72*0.8};
  /* 点を付ける文字の位置を決めるための送り幅の見積もり（figures.py の _tx_adv と同じ。配置と重なりの検査は tw のまま） */
  var TXADV={};[[" .,:;'|!ilIj`",0.28],["()[]{}ftr-\"",0.36],["mwMW@%",0.82],["ABCDEFGHJKLNOPQRSTUVXYZ&",0.66],["=+<>~^*#$_/\\",0.58],["0123456789",0.56]].forEach(function(e){for(var i=0;i<e[0].length;i++)TXADV[e[0][i]]=e[1];});
  var TXADVG={"ω":0.8,"φ":0.72,"ψ":0.75,"θ":0.62,"π":0.62};   /* 幅の広いギリシャ文字 */
  function txAdv(t,size){var w=0;for(var i=0;i<t.length;i++){var ch=t[i];w+=ch.charCodeAt(0)<128?size*(TXADV[ch]!=null?TXADV[ch]:0.53):(TXADVG[ch]!=null?size*TXADVG[ch]:tw(ch,size));}return w;}
  function txTok(s){s=String(s);var segs=[],re=/\\(d?dot)\{(.)\}|([A-Za-zα-ωΑ-Ω\u0080-ɏḀ-ỿ][̀-ͯ]*)_\{([^}]*)\}|([A-Za-zα-ωΑ-ΩḀ-ỿ][̀-ͯ]*)_([A-Za-z0-9∞%α-ωΑ-Ω]+)|\^\{([^}]*)\}|\^([A-Za-z0-9∞]+)/g,m,pos=0;
    function sup(c){var r2_=/([A-Za-zα-ωΑ-Ω\u0080-ɏḀ-ỿ][̀-ͯ]*)_(?:\{([^}]*)\}|([A-Za-z0-9∞%α-ωΑ-Ω]+))/g,q,p=0;
      while((q=r2_.exec(c))){segs.push(["sup",c.slice(p,q.index)+q[1]]);segs.push(["supsub",q[2]!=null?q[2]:q[3]]);p=r2_.lastIndex;}
      if(p<c.length||p===0)segs.push(["sup",c.slice(p)]);}
    while((m=re.exec(s))){if(m.index>pos)segs.push(["n",s.slice(pos,m.index)]);
      if(m[1]){segs.push([m[1]==="ddot"?"dot2":"dot1",m[2]]);var rest=s.slice(re.lastIndex),m2=/^_\{([^}]*)\}|^_([A-Za-z0-9∞%α-ωΑ-Ω]+)/.exec(rest);if(m2){segs.push(["sub",m2[1]!=null?m2[1]:m2[2]]);re.lastIndex+=m2[0].length;}}
      else if(m[3]!=null){segs.push(["n",m[3]]);segs.push(["sub",m[4]]);}
      else if(m[5]!=null){segs.push(["n",m[5]]);segs.push(["sub",m[6]]);}
      else if(m[7]!=null)sup(m[7]);
      else segs.push(["sup",m[8]]);
      pos=re.lastIndex;}
    if(pos<s.length)segs.push(["n",s.slice(pos)]);
    return segs;}
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
       "K_P" "u_0" "ω_gc"・"t_{2%}"・"e^{−Ls}" "x^2"・"\\dot{θ}_m" "\\ddot{p}"（点は小さな円で描く）・"P̃_0" "ỹ_0"（結合文字や付加記号の付いた文字の添字）・
       "C_θ"（ギリシャ文字の添字）・"e^{−sT_s}"（上付きの中の添字）。rot は回転の角度 */
    TX:function(x,y,s,a,sz,c,b,halo,rot){sz=sz||10;s=String(s);var segs=txTok(s);
      var ws=function(g){return TXS[g[0]]?tw(g[1],sz*TXS[g[0]]):tw(g[1],sz);},w=0;segs.forEach(function(g){w+=ws(g);});
      var x0=x-(a==="middle"?w/2:(a==="end"?w:0)),cur=0,xx=x0,dots=[];
      var h='<text x="'+r2(x0)+'" y="'+r2(y)+'" text-anchor="start" font-size="'+sz+'" fill="'+col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
        (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>';
      /* 点を付ける文字より前の部分は、見積もった幅ちょうどに描かせる（textLength）。フォントによる幅の違いで、点が文字からずれないように */
      var lastDot=-1;segs.forEach(function(g,i){if(g[0]==="dot1"||g[0]==="dot2")lastDot=i;});
      segs.forEach(function(g,i){var want=g[0]==="sub"?3:(g[0]==="sup"?-sz*0.38:(g[0]==="supsub"?-sz*0.18:0)),dy=want-cur;cur=want;
        var gw=txAdv(g[1],TXS[g[0]]?sz*TXS[g[0]]:sz),fit=i<lastDot&&g[0]!=="dot1"&&g[0]!=="dot2"&&/\S/.test(g[1]);
        h+='<tspan'+(Math.abs(dy)>1e-9?' dy="'+r2(dy)+'"':'')+(TXS[g[0]]?' font-size="'+r2(sz*TXS[g[0]])+'"':'')+(fit?' textLength="'+r2(gw)+'" lengthAdjust="spacingAndGlyphs"':'')+'>'+esc(g[1])+'</tspan>';if(g[0]==="dot1"||g[0]==="dot2"){var cx=xx+gw/2,cy=y-sz*0.86,rr=Math.max(1.1,sz*0.11);if(g[0]==="dot1")dots.push([cx,cy,rr]);else{dots.push([cx-sz*0.13,cy,rr]);dots.push([cx+sz*0.13,cy,rr]);}}xx+=gw;});
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
    TXW:function(s,sz){sz=sz||10;var w=0;txTok(s).forEach(function(g){w+=TXS[g[0]]?tw(g[1],sz*TXS[g[0]]):tw(g[1],sz);});return w;},
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
  function htx(s){return String(s).replace(/\\(d?dot)\{(.)\}/g,function(_,d,c){return '<span class="'+(d==="ddot"?"ovd2":"ovd")+'">'+c+'</span>';})
    .replace(/(<\/span>)_\{([^}]*)\}/g,"$1<sub>$2</sub>").replace(/(<\/span>)_([A-Za-z0-9]+)/g,"$1<sub>$2</sub>")
    .replace(/([A-Za-zΑ-Ωα-ω])_\{([^}]*)\}/g,"$1<sub>$2</sub>").replace(/([A-Za-zΑ-Ωα-ω])_([A-Za-z0-9]+)/g,"$1<sub>$2</sub>")
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
  /* ===== 01 章 システム仕様書の書き方 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w01_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w01_f(v,d){v=+v;if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 読み出しの HTML の中の ID（SR-F02・ST-036・LG-ICD-001 など）を、狭い画面でも途中で折り返さないようにする（タグの中は変えない） */
  function _w01_nw(h){return h.replace(/(<[^>]*>)|((?:SR|ST|DS|CR)-[A-Z]?\d{2,3}|LG-[A-Z]{3}-\d{3})/g,function(m,tag,id){return tag?tag:'<span style="white-space:nowrap">'+id+'</span>';});}
  /* 箱（中心 cx, cy、幅 w、高さ h）の縁の点のうち、(tx, ty) の向きにあるもの */
  function _w01_edge(cx,cy,w,h,tx,ty){var dx=tx-cx,dy=ty-cy;if(dx===0&&dy===0)return [cx,cy];var t=Math.min(dx?Math.abs(w/2/dx):1e9,dy?Math.abs(h/2/dy):1e9);return [cx+dx*t,cy+dy*t];}

  /* ---- 3 節: 状態遷移表のマスを書き換える ↔ 状態遷移図と、抜けと矛盾 ---- */
  /* マスの中身: {k:"go", to:次の状態, a:すること} 遷移 / {k:"stay", a} とどまる / {k:"rec"} 測定して記録（とどまる）/
     {k:"cond"} 設定による（上書き: とどまる・止める: → 停止中）/ {k:"none"} 起きない / {k:"undef"} 未定 */
  function _w01_go(to,a){return {k:"go",to:to,a:a||""};}
  var _W01_FSM={
    main:{name:"主のモード",st:["停止中","記録中","電池切れ"],ev:["長押し","アプリから開始","アプリから停止","記録の時刻","容量に達した","電池が尽きる","電池を入れ直す"],
      extra:{3:[{k:"rec"}],4:[{k:"cond"}]},
      act:function(i,j,to){if(j===0&&i===0&&to===1)return "緑を 3 回点滅";if(j===0&&i===1&&to===0)return "赤を 3 回点滅";return "";},
      init:function(){return [
        [_w01_go(1,"緑を 3 回点滅"),_w01_go(1),{k:"stay",a:"何もしない"},{k:"none"},{k:"none"},_w01_go(2),{k:"undef"}],
        [_w01_go(0,"赤を 3 回点滅"),{k:"stay",a:"何もしない"},_w01_go(0),{k:"rec"},{k:"cond"},_w01_go(2),{k:"undef"}],
        [{k:"undef"},{k:"none"},{k:"none"},{k:"none"},{k:"none"},{k:"none"},{k:"undef"}]];},
      rule:function(i,j){
        if(i===0&&j===0)return {ok:function(c){return c.k==="go"&&c.to===1;},msg:"長押しで記録を始め、緑を 3 回点滅させる（SR-F06・SR-U04）"};
        if(i===1&&j===0)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"長押しで記録を止め、赤を 3 回点滅させる（SR-F06・SR-U07）"};
        if(i===0&&j===1)return {ok:function(c){return c.k==="go"&&c.to===1;},msg:"アプリから記録を始められる（SR-F14）"};
        if(i===1&&j===2)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"アプリから記録を止められる（SR-F14）"};
        if(i===1&&j===3)return {ok:function(c){return c.k==="rec";},msg:"記録中は、記録の間隔ごとに測定して記録する（SR-F01・SR-F03）"};
        if(i!==1&&j===3)return {ok:function(c){return c.k!=="rec"&&!(c.k==="go"&&c.to===1);},msg:"記録中でなければ記録しない（SR-F01・SR-F18）"};
        if(i===1&&j===4)return {ok:function(c){return c.k==="cond";},msg:"容量に達したときに上書きするか止めるかは、設定で選ぶ（SR-F05）"};
        if(i<2&&j===5)return {ok:function(c){return c.k==="go"&&c.to===2;},msg:"電池が尽きたら電池切れへ移る（SR-F18）"};
        if(i===2&&(j===1||j===2))return {ok:function(c){return c.k==="none";},msg:"電池切れでは通信しないので、アプリからの出来事は起きない（SR-F18）"};
        if(i===2&&j<6)return {ok:function(c){return !(c.k==="go"&&c.to===1)&&c.k!=="rec";},msg:"電池切れのまま記録はできない（SR-F18）"};
        return null;}},
    com:{name:"通信の状態",st:["通信なし","受付中","接続中"],ev:["短押し","アプリが接続","接続が切れる","2 分たつ","電池が尽きる","電池を入れ直す"],extra:{},
      act:function(i,j,to){if(i===0&&j===0&&to===1)return "LED で状態を示し、受付を始める";if(i===1&&j===1&&to===2)return "接続を受ける";if(j>=4&&to===0)return "通信を止める";return "";},
      init:function(){return [
        [_w01_go(1,"LED で状態を示し、受付を始める"),{k:"none"},{k:"none"},{k:"none"},{k:"stay",a:"何もしない"},{k:"stay",a:"何もしない"}],
        [{k:"undef"},_w01_go(2,"接続を受ける"),{k:"none"},_w01_go(0),_w01_go(0,"通信を止める"),_w01_go(0,"通信を止める")],
        [{k:"undef"},{k:"none"},_w01_go(0),{k:"none"},_w01_go(0,"通信を止める"),_w01_go(0,"通信を止める")]];},
      rule:function(i,j){
        if(i===0&&j===0)return {ok:function(c){return c.k==="go"&&c.to===1;},msg:"短押しで接続の受付を始める（SR-U06）"};
        if(i===0&&j===1)return {ok:function(c){return c.k==="none";},msg:"受付中でなければ接続されない（SR-U06）"};
        if(i===1&&j===1)return {ok:function(c){return c.k==="go"&&c.to===2;},msg:"受付中は接続を受ける（SR-U06）"};
        if(i===1&&j===3)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"受け付けるのは短押しから 2 分間（SR-U06）"};
        if(i===2&&j===2)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"接続が切れたら通信なしに戻る（SR-F18）"};
        if(i>0&&j>=4)return {ok:function(c){return c.k==="go"&&c.to===0;},msg:"電池が尽きたとき・入れ直したときは通信しない（SR-F18）"};
        if(i===0&&j>=4)return {ok:function(c){return c.k==="stay"||c.k==="none";},msg:"電池が尽きたとき・入れ直したときは通信しない（SR-F18）"};
        return null;}}
  };
  function _w01_cellTxt(M,c,short){
    if(c.k==="go")return (c.a?(short?c.a.replace("を 3 回点滅"," 3 回").replace("LED で状態を示し、",""):c.a)+" ":"")+"→ "+M.st[c.to];
    if(c.k==="stay")return c.a||"何もしない";
    if(c.k==="rec")return "測定して記録";
    if(c.k==="cond")return short?"上書き／止める → 停止中":"設定による（上書き: とどまる／止める: → 停止中）";
    if(c.k==="none")return "起きない";
    return "未定";}
  /* マスに選べる中身 */
  function _w01_opts(M,i,j){var o=[];M.st.forEach(function(s,t){if(t!==i)o.push(_w01_go(t,M.act(i,j,t)));});
    o.push({k:"stay",a:"何もしない"});(M.extra[j]||[]).forEach(function(e){o.push({k:e.k});});o.push({k:"none"});o.push({k:"undef"});return o;}
  function _w01_same(a,b){return a.k===b.k&&(a.k!=="go"||a.to===b.to);}
  REG.w01_modes=function(el,U){
    var S=U.S;
    U.head(el,"STATE TABLE","状態遷移表のマスを書き換えて、状態遷移図と、抜けと矛盾を確かめる");
    var r1=U.ctrls(el);
    var mSel=U.seg(r1,["主のモード","通信の状態"],0,function(){key=mSel.get()?"com":"main";si=0;sj=0;cur=0;last=null;log=[];build();sync();draw();});
    var r2=U.ctrls(el);
    var sSel=U.select(r2,"マスの状態（行）",["停止中","記録中","電池切れ"],0,function(){si=sSel.get();sync();draw();});
    var eSel=U.select(r2,"マスの出来事（列）",["長押し"],0,function(){sj=eSel.get();sync();draw();});
    var cSel=U.select(r2,"マスの中身",["—"],0,function(){var o=_w01_opts(M(),si,sj)[cSel.get()];T()[si][sj]=o;draw();});
    var r3=U.ctrls(el);
    var cStop=U.checkbox(r3,"容量に達したときの設定を「記録を止める」にする（SR-F05。初期値は上書き）",false,function(){draw();});
    var ebr=U.btnrow(el);
    var br=U.btnrow(el);
    U.button(br,"最初の状態に戻す",function(){cur=0;last=null;log=[];draw();});
    U.button(br,"本文の例の表に戻す",function(){tabs[key]=M().init();cur=0;last=null;log=[];sync();draw();});
    var box=U.svgbox(el),tdiv=U.mk("div","readout");el.appendChild(tdiv);var ro=U.readout(el);
    var key="main",tabs={main:_W01_FSM.main.init(),com:_W01_FSM.com.init()},si=0,sj=0,cur=0,last=null,log=[];
    function M(){return _W01_FSM[key];}
    function T(){return tabs[key];}
    /* 出来事のボタンと選択肢を、表に合わせて作り直す */
    function build(){var m=M();
      [sSel,eSel].forEach(function(s,q){var arr=q?m.ev:m.st;s.input.innerHTML="";arr.forEach(function(t,i){var op=U.mk("option");op.value=i;op.textContent=t;s.input.appendChild(op);});});
      ebr.innerHTML="";var lab=U.mk("span",null,"出来事を起こす:");lab.style.cssText="font-family:var(--mono);font-size:.74rem;color:var(--muted)";ebr.appendChild(lab);
      m.ev.forEach(function(e,j){U.button(ebr,e,function(){fire(j);});});
      cStop.el.style.display=key==="main"?"":"none";}
    function sync(){var m=M();sSel.set(si);eSel.set(sj);var ops=_w01_opts(m,si,sj),c=T()[si][sj];cSel.input.innerHTML="";
      ops.forEach(function(o,k){var op=U.mk("option");op.value=k;op.textContent=_w01_cellTxt(m,o);cSel.input.appendChild(op);if(_w01_same(o,c))cSel.input.value=k;});}
    function fire(j){var m=M(),c=T()[cur][j],from=cur,res;
      if(c.k==="go"){cur=c.to;res=(c.a?c.a+"、":"")+m.st[cur]+"へ";}
      else if(c.k==="cond"){if(cStop.get()){cur=0;res="止める設定なので記録を止め、停止中へ";}else res="上書きの設定なので、最も古い記録に上書きして記録中のまま";}
      else if(c.k==="rec")res="測定して記録する（記録中のまま）";
      else if(c.k==="stay")res=(c.a||"何もしない")+"（"+m.st[cur]+"のまま）";
      else if(c.k==="none")res="この組み合わせは起きないと決めてある（何も変わらない）";
      else res='<span class="warn">未定のマス</span>: 決めていないので、作る人ごとに違う動きになり、試験の合否も決まらない';
      last={from:from,ev:j,to:cur,k:c.k};si=from;sj=j;sync();
      log.unshift(m.st[from]+" で「"+m.ev[j]+"」→ "+res);if(log.length>5)log.pop();draw();}
    /* 抜けと矛盾 */
    function audit(){var m=M(),t=T(),gaps=[],bad=[];
      t.forEach(function(row,i){row.forEach(function(c,j){if(c.k==="undef"){gaps.push([i,j]);return;}var r=m.rule(i,j);if(r&&!r.ok(c))bad.push([i,j,r.msg]);});});
      return {gaps:gaps,bad:bad};}
    function draw(){
      var m=M(),t=T(),A=audit(),nar=_w01_nar(box),Wd=nar?400:700,o=[],sz=nar?9:9.5;
      var isBad={},isGap={};A.bad.forEach(function(b){isBad[b[0]+","+b[1]]=b[2];});A.gaps.forEach(function(g){isGap[g[0]+","+g[1]]=1;});
      var P=nar?[[78,80],[322,80],[200,250]]:[[120,122],[400,122],[610,122]],bw=nar?92:100,bh=34,GX=(P[0][0]+P[1][0]+P[2][0])/3,GY=(P[0][1]+P[1][1]+P[2][1])/3;
      /* 遷移を（始まり, 終わり）ごとにまとめる */
      var E={},loops=[[],[],[]],ymax=0;   /* ymax: いちばん下の文字の位置（図の高さを決める） */
      t.forEach(function(row,i){row.forEach(function(c,j){
        if(c.k==="go"){var k=i+">"+c.to;(E[k]=E[k]||[]).push({j:j,txt:m.ev[j]});}
        if(c.k==="cond"){(E[i+">0"]=E[i+">0"]||[]).push({j:j,txt:m.ev[j]+" [止める]"});loops[i].push({j:j,txt:m.ev[j]+" [上書き]"});}
        if(c.k==="rec")loops[i].push({j:j,txt:m.ev[j]+" / 測定して記録"});
        if(c.k==="stay"&&c.a&&c.a!=="何もしない")loops[i].push({j:j,txt:m.ev[j]+" / "+c.a});});});
      o.push(S.T(nar?8:14,16,m.name+"の状態遷移図（下の表から描く）","start",10,"ink",true));
      /* 矢印 */
      Object.keys(E).forEach(function(k){var a=+k.split(">")[0],b=+k.split(">")[1],evs=E[k];
        var both=!!E[b+">"+a],far=!nar&&Math.abs(a-b)===2;
        var x1=P[a][0],y1=P[a][1],x2=P[b][0],y2=P[b][1],dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=dy/L,ny=-dx/L;
        var bend=far?((both&&a>b)?-0.3*(ny>0?1:-1):0.38*(ny>0?1:-1)):(both?0.2:(nar?0.12:0.08));
        if(nar&&!both){var out=nx*((x1+x2)/2-GX)+ny*((y1+y2)/2-GY);bend=out>=0?0.12:-0.12;}
        var cx=(x1+x2)/2+bend*L*nx,cy=(y1+y2)/2+bend*L*ny;
        var p1=_w01_edge(x1,y1,bw,bh,cx,cy),p2=_w01_edge(x2,y2,bw,bh,cx,cy);
        var hot=last&&last.from===a&&last.to===b&&evs.some(function(e){return e.j===last.ev;});
        var sel=si===a&&evs.some(function(e){return e.j===sj;});
        var col=hot?"signal":(sel?"gold":"muted"),lw=hot?3:(sel?2.4:1.5);
        var ang=Math.atan2(p2[1]-cy,p2[0]-cx),hd=7,ex=p2[0]-hd*0.6*Math.cos(ang),ey=p2[1]-hd*0.6*Math.sin(ang);
        o.push(S.PATH("M"+p1[0].toFixed(1)+","+p1[1].toFixed(1)+" Q"+cx.toFixed(1)+","+cy.toFixed(1)+" "+ex.toFixed(1)+","+ey.toFixed(1),col,lw));
        o.push(S.head(cx,cy,p2[0],p2[1],col,hd));
        var mx=0.25*p1[0]+0.5*cx+0.25*p2[0],my=0.25*p1[1]+0.5*cy+0.25*p2[1],side=(bend*ny<0||(bend===0&&false))?-1:1;
        if(Math.abs(bend*ny)<1e-6)side=-1;
        var bx=bend*nx,by=bend*ny,horiz=Math.abs(bx)>Math.abs(by)*1.2;
        evs.forEach(function(e,q){var yy=horiz?my+(q-(evs.length-1)/2)*(sz+3)+3:my+(side<0?-8-(evs.length-1-q)*(sz+3):14+q*(sz+3));
          var xx=horiz?mx+(bx<0?-6:6):mx,an=horiz?(bx<0?"end":"start"):"middle";ymax=Math.max(ymax,yy+5);
          o.push(S.T(xx,yy,e.txt+((m.act(a,e.j,b)&&!nar)?" / "+m.act(a,e.j,b):""),an,sz,e.j===sj&&si===a?"gold":(hot&&e.j===last.ev?"signal":"ink"),true,false,null,true));});});
      /* 自分への遷移 */
      loops.forEach(function(ls,i){if(!ls.length)return;var x=P[i][0],y=P[i][1]-bh/2;
        var hot=last&&last.from===i&&last.to===i&&ls.some(function(e){return e.j===last.ev;});
        o.push(S.PATH("M"+(x-10)+","+y+" C"+(x-24)+","+(y-40)+" "+(x+24)+","+(y-40)+" "+(x+10)+","+(y-2),hot?"signal":"muted",hot?2.6:1.4));
        o.push(S.head(x+16,y-12,x+10,y-1,hot?"signal":"muted",6));
        ls.forEach(function(e,q){o.push(S.T(x+(nar?-30:22),y-30+q*(sz+3)-(ls.length-1)*(sz+3)+(nar?-6:0),e.txt,nar?"middle":"start",sz,e.j===sj&&si===i?"gold":"signal",true,false,null,true));});});
      /* 状態の箱と、抜け・矛盾の札 */
      P.forEach(function(p,i){var on=i===cur;
        o.push(S.RECT(p[0]-bw/2,p[1]-bh/2,bw,bh,bh/2.6,on?"signal":U.soft("signal"),"signal",on?2.6:1.6));
        o.push(S.T(p[0],p[1]+4,m.st[i],"middle",11,on?"panel":"signal",true));
        var ng=0,nb=0;t[i].forEach(function(c,j){if(isGap[i+","+j])ng++;if(isBad[i+","+j])nb++;});
        var tags=[];if(ng)tags.push(["未定 "+ng,"alias"]);if(nb)tags.push(["矛盾 "+nb,"alias"]);
        tags.forEach(function(tg,q){o.push(S.CHIP(p[0]-bw/2+U.tw(tg[0],9)/2+5+q*(U.tw(tags[0][0],9)+16),p[1]+bh/2+15,tg[0],tg[1],9));});});
      if(!nar){o.push(S.D(P[0][0]-bw/2-30,P[0][1],"ink",4.5));o.push(S.ARR(P[0][0]-bw/2-25,P[0][1],P[0][0]-bw/2-2,P[0][1],"ink",1.4,6));}
      box.set(S.svg(Wd,Math.max(nar?306:262,Math.ceil(ymax)+8),o));
      /* 状態遷移表（HTML。マスを押すと選べる） */
      var h='<div style="margin:.2rem 0 .3rem">状態遷移表（マスを押して選び、上の「マスの中身」で書き換える）</div><div class="wtable"><table><thead><tr><th>状態 ＼ 出来事</th>'+
        m.ev.map(function(e){return '<th style="text-align:center">'+U.esc(e)+'</th>';}).join("")+'</tr></thead><tbody>';
      t.forEach(function(row,i){h+='<tr><th style="text-align:left;color:var(--signal)">'+m.st[i]+'</th>';
        row.forEach(function(c,j){var kk=i+","+j,bg=isGap[kk]||isBad[kk]?"var(--alias-soft)":(c.k==="none"?"var(--muted-soft)":"transparent");
          if(last&&last.from===i&&last.ev===j)bg="var(--signal-soft)";
          var st="cursor:pointer;text-align:center;white-space:normal;min-width:6.5em;background:"+bg+";"+(si===i&&sj===j?"outline:2px solid var(--gold);outline-offset:-2px;":"");
          var tx=U.esc(_w01_cellTxt(m,c,true));if(isGap[kk]||isBad[kk])tx='<b style="color:var(--alias)">'+tx+(isBad[kk]?"（矛盾）":"")+'</b>';
          h+='<td data-c="'+kk+'" style="'+st+'">'+tx+'</td>';});h+='</tr>';});
      tdiv.innerHTML=h+'</tbody></table></div>';
      /* 読み出し */
      var r="今の状態: <b>"+m.st[cur]+"</b>"+(log.length?"　直前: "+log[0]:"（上の出来事のボタンで、今の状態から遷移させる）")+"<br>";
      r+=(A.gaps.length?'<span class="warn">抜け（未定） '+A.gaps.length+' マス</span>: '+A.gaps.map(function(g){return m.st[g[0]]+" × "+m.ev[g[1]];}).join("、"):'<span class="ok">抜けは無い</span>')+"<br>";
      r+=(A.bad.length?'<span class="warn">矛盾 '+A.bad.length+' マス</span>: '+A.bad.map(function(b){return m.st[b[0]]+" × "+m.ev[b[1]]+"（"+b[2]+"）";}).join("、"):'<span class="ok">要求と矛盾するマスは無い</span>');
      ro.innerHTML=_w01_nw(r+(log.length>1?'<div class="wnote">'+log.slice(1).join("<br>")+'</div>':"")+'<div class="wnote">矛盾は、ロガーの要求（SR-F01・SR-F05・SR-F06・SR-F14・SR-F18・SR-U04・SR-U06・SR-U07。03 章の最終の要求）に照らして判定する。未定のマスは、どれを選んでも要求とは矛盾しない（どれにするかを仕様書で決める。03 章の表 3-3・3-4 が決めた答え）。</div>');
    }
    tdiv.addEventListener("click",function(e){var td=e.target.closest?e.target.closest("[data-c]"):null;if(!td)return;var q=td.getAttribute("data-c").split(",");si=+q[0];sj=+q[1];sync();draw();});
    build();sync();draw();
  };

  /* ---- 4 節: 要求文の点検（曖昧な言葉・数値と単位・1 文に 1 つ・条件・否定・文末） ---- */
  var _W01_RQ=[
    {t:"ボタンを押したら、速やかにアプリとつながること",fix:[["SR-P06","短押しから 10 秒以内に、アプリが接続を始められること"]],why:"「速やかに」を、起点（短押し）と時間の上限（10 秒以内）に直した。"},
    {t:"電池は十分に長くもつこと",fix:[["SR-W02","次の使い方の条件で、新しい電池で 1 年以上記録を続けられること: 記録の間隔 10 分、周囲 25 °C、読み出しは 1 週間に 1 回（接続 1 分）、短押しは 1 日に 1 回、警報の表示は無い（警報の印が付かない上限と下限に設定する）、電池少の表示は電池少と判定してから電池切れまでの間だけ（SR-F13）"]],why:"「十分に長く」を 1 年以上という数値にし、使い方の条件（5 節）を添えた。LED の表示も電池を使うので、条件に入れた。"},
    {t:"温度の誤差は ±0.5 °C 以内であること",fix:[["SR-P01","温度の誤差は、0 °C 以上 40 °C 以下で ±0.5 °C 以内、−20 °C 以上 0 °C 未満と 40 °C より高く 60 °C 以下で ±1.0 °C 以内であること（分解能 0.1 °C）"]],why:"誤差を満たす温度の範囲（条件）を書き、範囲ごとに許容差を決めた。境目（0 °C と 40 °C）がどちらの範囲に入るかも書いた。"},
    {t:"温度と湿度を 10 分ごとに測定して記録し、また上限を超えたら LED で知らせること",fix:[["SR-F01","記録中は、記録の間隔ごとに温度と相対湿度を測定すること"],["SR-F03","測定ごとに、時刻・温度・湿度・状態の印（警報・時刻未設定・電池少・測定異常）を 1 件の記録として保存すること"],["SR-F15","警報の印を付けた記録を保存したときは、LED で知らせること（警報の表示。表 3-5）"]],why:"別々に合否が決まる 3 つの要求に分け、ID を 1 つずつ付けた（警報の印を付けることは SR-F10）。それぞれに試験を結べる。"},
    {t:"誤った時刻で記録しないこと",fix:[["SR-F09","電池を入れてから最初に時刻を合わせるまでの記録には、時刻未設定の印を付けること"]],why:"否定だけの文を、条件（時刻を合わせるまで）と、そのときにすること（印を付ける）に直した。"},
    {t:"電池の残りが少なくなったら、すぐに知らせること",fix:[["SR-F13","電池の残りが少ないことを、電池切れになる 14 日以上前（SR-W02 の使い方の条件で）に、LED とアプリで知らせること"]],why:"「すぐに」を、いつまでに（電池切れになる 14 日以上前。数えるときの使い方の条件も書く）と、何で（LED とアプリ）知らせるかに直した。"},
    {t:"LED の表示は分かりやすくする",fix:[["SR-U03","LED の表示は、表 3-5 の表示と表 3-6 の決まり（重なるときの優先順位を含む）のとおりにすること"]],why:"「分かりやすく」を、表示の表と決まり（03 章の表 3-5・3-6）に従うことに直し、文末を「〜すること」にした。"},
    {t:"記録の読み出しは、なるべく速いことが望ましい",fix:[["SR-P05","接続してから、記録 52 560 件の読み出しを 60 秒以内に終えること（例のスマートフォンで、見通し 2 m）"]],why:"「なるべく速い」を、件数・時間の上限・試す条件のそろった必須の要求に直した。"}
  ];
  var _W01_VAGUE=["可能な限り","できるだけ","なるべく","ある程度","問題なく","効率よく","効率的","適切","十分","速やか","迅速","直ちに","すぐに","高速","素早く","正確","正しく","確実に","使いやす","分かりやす","わかりやす","見やす","簡単","容易","柔軟","最適","適宜","極力","など","長く","短く","早く","遅く","多く","少なく"];
  var _W01_QWORD=["速","時間","誤差","精度","寿命","もつ","距離","重さ","大きさ","費用","電流","遅れ"];
  var _W01_UNIT="%RH|°C|℃|ms|µs|秒|分|時間|日|週間|週|か月|年|mm|cm|kg|g|件|回|個|台|面|円|mAh|µA|mA|KiB|KB\\/s|KB|dBm|dB|kHz|MHz|GHz|Hz|%|桁|ppm|m|A|V|B";
  var _W01_NUMRE=new RegExp("(?:\\d+(?:[.]\\d+)?\\s?×\\s?)*[−\\-+±]?(?:\\d{1,3}(?: \\d{3})+|\\d+)(?:[.]\\d+)?(?:\\s?[〜~]\\s?[−\\-+]?\\d+(?:[.]\\d+)?)?\\s?(?:"+_W01_UNIT+")(?![A-Za-z])","g");
  function _w01_check(s){
    var t=String(s).trim(),R=[],rng=[];  /* rng: [start, end, 種類] 文字に色を付ける範囲 */
    function add(a,b,k){rng.push([a,b,k]);}
    /* 曖昧な言葉 */
    var vg=[];_W01_VAGUE.forEach(function(w){var i=t.indexOf(w);while(i>=0){var dup=rng.some(function(r){return r[2]==="vague"&&i>=r[0]&&i<r[1];});if(!dup){vg.push(w);add(i,i+w.length,"vague");}i=t.indexOf(w,i+w.length);}});
    /* 数値と単位（ID・型番を除く） */
    var body=t.replace(/(SR|DS|ST|LG)-[A-Z0-9-]+|CR\d+|IP\d+|Bluetooth \d+(?:\.\d+)?|表 \d+(?:-\d+)?/g,function(m){return new Array(m.length+1).join("#");});
    var nums=[],m;_W01_NUMRE.lastIndex=0;while((m=_W01_NUMRE.exec(body))){nums.push(m[0]);add(m.index,m.index+m[0].length,"num");}
    var bare=body.replace(_W01_NUMRE,function(x){return new Array(x.length+1).join("#");}).match(/\d+/g)||[];
    var needNum=vg.length>0||_W01_QWORD.some(function(w){return t.indexOf(w)>=0;});
    /* 1 文に 1 つ */
    var core=t.replace(/（[^（）]*）/g,""),sents=core.split(/[。．]/).filter(function(x){return x.trim().length>0;});
    var joinX=[],joinC=[];
    [/また(?!は)/g].forEach(function(re){var q;while((q=re.exec(t))){joinX.push(q[0]);add(q.index,q.index+q[0].length,"join");}});
    [/および|ならびに|並びに|かつ/g,/[しりきけせめべびみ]、/g].forEach(function(re){var q;while((q=re.exec(t))){joinC.push(q[0]);add(q.index,q.index+q[0].length,"join");}});
    /* 文末 */
    var last=(sents.length?sents[sents.length-1]:core).trim().replace(/こと[:：].*$/,"こと").trim(),endOK=/こと$/.test(last)&&!/ことが望ましい$/.test(last),endWant=/ことが望ましい$/.test(last);
    var neg=/(ない|ず)こと$/.test(last);
    var ei=t.lastIndexOf(last.slice(-6)),em=last.match(/(ことが望ましい|ないこと|こと|する|します|できる|したい|ほしい|である|にする)$/);
    if(em&&ei>=0){var ee=ei+Math.min(6,last.length);add(ee-em[0].length,ee,endOK&&!neg?"endok":"endbad");}
    /* 条件 */
    var condBad=[];
    if(/誤差|精度/.test(t)&&!/\d+\s?〜\s?[−\-+]?\d+\s?°C\s?で|の範囲で|(°C|%RH|以下|以上|未満)\s?で/.test(t))condBad.push("どの範囲（温度など）での誤差かが無い");
    if(/電池/.test(t)&&/寿命|もつ|動く|続けられる|動き続け/.test(t)&&!/条件|間隔/.test(t))condBad.push("使い方の条件（記録の間隔・読み出しの回数・温度）が無い");
    if(/\d+\s?(秒|分|時間|日|ms)\s?以内/.test(t)&&!/から|まで|のうちに|とき|たら|ごとに/.test(t))condBad.push("いつから測るか（起点）が無い");
    var condMark=/とき|たら|れば|ならば|ごとに|たびに|から|までの|の間|で、|の条件|(°C|%RH|以下|以上|未満)\s?で|の範囲で|前に|前（|までに|中は/.test(t);
    /* 判定（ok / chk / bad / na） */
    R.push(["曖昧な言葉",vg.length?"bad":"ok",vg.length?"「"+vg.join("」「")+"」は、読む人ごとに意味が変わる":"無い"]);
    R.push(["数値と単位",nums.length?(bare.length?"chk":"ok"):(needNum?"bad":"na"),nums.length?(nums.join("・")+(bare.length?"。単位の無い数 "+bare.join("・")+" がある":"")):(needNum?"量を決める要求なのに、数値と単位が無い":"数値の要らない要求")]);
    R.push(["1 文に 1 つの要求",(joinX.length||sents.length>1)?"bad":(joinC.length?"chk":"ok"),sents.length>1?"文が "+sents.length+" つある。ID を分ける":(joinX.length?"「"+joinX.join("」「")+"」で別の要求をつないでいる":(joinC.length?"「"+joinC.join("」「")+"」でつないだ所がある。別々に合否が決まるなら分ける":"1 つ"))]);
    R.push(["条件",condBad.length?"bad":(condMark?"ok":"na"),condBad.length?condBad.join("。"):(condMark?"条件がある":"条件の無い型（常に）")]);
    R.push(["否定だけでない",neg?((joinC.length||joinX.length)?"chk":"bad"):"ok",neg?((joinC.length||joinX.length)?"否定で終わっている。どの条件で何をするかで書けないか":"否定だけの要求。条件と、そのときにすることで書く"):"肯定の形"]);
    R.push(["文末",endOK?"ok":(endWant?"chk":"bad"),endOK?"「〜こと」":(endWant?"「望ましい」は要求ではない。必須なら「〜すること」、望ましいなら理由を書く":"「〜すること」「〜できること」になっていない")]);
    return {t:t,rows:R,rng:rng};}
  function _w01_mark(U,t,rng){
    var cls={vague:"background:var(--alias-soft);color:var(--alias);font-weight:700",num:"background:var(--signal-soft);color:var(--signal);font-weight:700",
      join:"background:var(--gold-soft);color:var(--gold);font-weight:700",endok:"background:var(--green-soft);color:var(--green);font-weight:700",endbad:"background:var(--alias-soft);color:var(--alias);font-weight:700;text-decoration:underline"};
    var pri={vague:5,endbad:4,join:3,endok:2,num:1},kind=[];for(var i=0;i<t.length;i++)kind.push(null);
    rng.forEach(function(r){for(var i=r[0];i<r[1]&&i<t.length;i++)if(!kind[i]||pri[r[2]]>pri[kind[i]])kind[i]=r[2];});
    var h="",cur=null,buf="";
    function flush(){if(!buf)return;h+=cur?'<span style="'+cls[cur]+';border-radius:3px;padding:0 .1em">'+U.esc(buf)+'</span>':U.esc(buf);buf="";}
    for(var j=0;j<t.length;j++){if(kind[j]!==cur){flush();cur=kind[j];}buf+=t[j];}flush();return h;}
  REG.w01_reqcheck=function(el,U){
    U.head(el,"REQUIREMENT CHECK","要求文を点検する — 曖昧な言葉・数値と単位・1 文に 1 つ・条件・否定・文末");
    var r1=U.ctrls(el);
    var ex=U.select(r1,"例文（ロガーの悪い例）",_W01_RQ.map(function(q,i){return (i+1)+". "+q.t;}),0,function(){cur=ex.get();tin.set(_W01_RQ[cur].t);draw();});
    ex.el.style.flex="1 1 100%";
    var r2=U.ctrls(el);
    var tin=U.textin(r2,"要求文（書き換えてよい）",_W01_RQ[0].t,function(){cur=-1;draw();},{width:"100%"});
    var br=U.btnrow(el);
    U.button(br,"直した例を点検する",function(){var q=_W01_RQ[cur>=0?cur:ex.get()];tin.set(q.fix[0][1]);cur=-2;draw();});
    U.button(br,"本文の例（1 番の例文）",function(){ex.set(0);cur=0;tin.set(_W01_RQ[0].t);draw();});
    var out=U.mk("div");out.style.cssText="margin-top:.75rem;padding:.7rem .8rem;background:var(--screen);border:1px solid var(--line);border-radius:10px;font-size:1rem;line-height:1.9";el.appendChild(out);
    var tb=U.mk("div");el.appendChild(tb);var ro=U.readout(el);
    var cur=0;
    function draw(){
      var c=_w01_check(tin.get()),st={ok:'<span class="ok">◯ よい</span>',chk:'<span style="color:var(--gold);font-weight:700">△ 確かめる</span>',bad:'<span class="warn">× 直す</span>',na:'<span style="color:var(--muted)">— 該当なし</span>'};
      out.innerHTML=c.t?_w01_mark(U,c.t,c.rng):'<span style="color:var(--muted)">（要求文を入れる）</span>';
      tb.innerHTML=U.tbl(["点検の項目","結果","内容"],c.rows.map(function(r){return [r[0],st[r[1]],U.esc(r[2])];}),["left","left","wrap"]);
      var nb=c.rows.filter(function(r){return r[1]==="bad";}).length,nc=c.rows.filter(function(r){return r[1]==="chk";}).length;
      var h=(nb?'<span class="warn">直す所 '+nb+' つ</span>':'<span class="ok">直す所は無い</span>')+(nc?'、<span style="color:var(--gold);font-weight:700">確かめる所 '+nc+' つ</span>':"")+"<br>";
      var q=cur>=0?_W01_RQ[cur]:(cur===-2?_W01_RQ[ex.get()]:null);
      if(q&&cur>=0){h+="直した例: "+q.fix.map(function(f){return "<b>"+f[0]+"</b> "+U.esc(f[1]);}).join("<br>")+'<br><span style="color:var(--muted)">'+U.esc(q.why)+"</span>";}
      else if(cur===-2)h+="直した例（"+q.fix[0][0]+"）を点検した結果を表示している。";
      else h+="直し方の目安: 曖昧な言葉は数値と条件に、つないだ文は ID を分けて、否定だけの文は「どの条件で何をするか」に、文末は「〜すること」に直す。";
      ro.innerHTML=_w01_nw(h+'<div class="wnote">色: <span style="color:var(--alias);font-weight:700">赤</span> 曖昧な言葉・直す文末、<span style="color:var(--signal);font-weight:700">青</span> 数値と単位、<span style="color:var(--gold);font-weight:700">金</span> 要求をつなぐ言葉、<span style="color:var(--green);font-weight:700">緑</span> よい文末。言葉の並びだけを見る簡単な点検なので、最後は人が読んで判断する。</div>');
    }
    draw();
  };

  /* ---- 5 節: 使い方の条件と電池寿命（この章の簡単な模型。f01.py の _f01_life と同じ計算） ---- */
  var _W01_Q=180,_W01_ISL=2.55,_W01_QREC=3.0*8+0.3*5+5*0.7+10*45/512,_W01_QADV=10,_W01_WIN=120,_W01_ICON=1.0,_W01_TCON=5,_W01_QLED=2.0*20;
  /* al: 警報の表示が続く（30 秒ごとの表示が、記録中の表示の緑 1 回から、警報の表示の赤 2 回に代わる） */
  function _w01_life(iv,press,reads,conn,temp,al){
    var k=temp>25?Math.pow(1.5,(temp-25)/10):1,isl=_W01_ISL*k,irec=_W01_QREC/(iv*60),iadv=press*(_W01_QADV/0.1*_W01_WIN)/86400,
      ird=reads*(_W01_QADV/0.1*_W01_TCON+_W01_ICON*1000*conn*60)/(7*86400),iled=(al?2:1)*_W01_QLED/30,tot=isl+irec+iadv+ird+iled;
    return {parts:[isl,irec,iadv,ird,iled],tot:tot,h:_W01_Q*1000/tot,y:_W01_Q*1000/tot/8760};}
  var _W01_RD=[0,1,2,4,7,14,28,70];
  function _w01_rdname(v){return v===0?"しない":(v<7?"週 "+v+" 回":(v===7?"毎日 1 回":"1 日 "+(v/7)+" 回"));}
  REG.w01_profile=function(el,U){
    var S=U.S;
    U.head(el,"USE PROFILE","使い方の条件を変えると、同じロガーの電池寿命はどれだけ変わるか");
    var r0=U.ctrls(el);
    var mode=U.seg(r0,["条件を書かない「電池で 1 年以上」","条件を書いた SR-W02"],0,function(){draw();});
    var r1=U.ctrls(el);
    var iv=U.slider(r1,"記録の間隔",{min:1,max:60,step:1,value:10,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var pr=U.slider(r1,"短押し（1 日あたり）",{min:0,max:20,step:1,value:1,fmt:function(v){return v+" 回";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var rd=U.slider(r2,"読み出し",{values:_W01_RD,value:1,fmt:function(v){return _w01_rdname(v);},onInput:function(){draw();}});
    var cn=U.slider(r2,"1 回の接続の長さ",{values:[0.5,1,2,3,5],value:1,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var tp=U.slider(r2,"周囲の温度",{min:-20,max:60,step:5,value:25,fmt:function(v){return _w01_f(v,0)+" °C";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var al=U.checkbox(r3,"警報の表示が続く（30 秒ごとの表示が、緑 1 回から赤 2 回に代わる）",false,function(){draw();});
    var br=U.btnrow(el);
    function setU(a,b,c,d,e,f){iv.set(a);pr.set(b);rd.set(c);cn.set(d);tp.set(e);al.set(f);draw();}
    U.button(br,"本文の例（SR-W02 の条件）",function(){setU(10,1,1,1,25,false);});
    U.button(br,"使い方が最も軽い",function(){setU(60,0,0,0.5,25,false);});
    U.button(br,"全部が重い",function(){setU(1,20,70,5,60,true);});
    var box=U.svgbox(el),ro=U.readout(el);
    var W2=_w01_life(10,1,1,1,25,false),LO=_w01_life(1,20,70,5,60,true),HI=_w01_life(60,0,0,0.5,25,false),YM=6;
    var NM=["眠り","記録","受付（アドバタイズ）","読み出し（接続）","LED の表示"],CL=["muted","green","gold","purple","teal"];
    function draw(){
      var L=_w01_life(iv.get(),pr.get(),rd.get(),cn.get(),tp.get(),al.get()),m=mode.get(),nar=_w01_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?14:120,x1=nar?386:680;
      /* (a) 電流の内訳 */
      o.push(S.T(nar?8:14,16,"(a) 電流の内訳（1 週間にならした値）","start",10,"ink",true));
      var xm=Math.max(5,Math.ceil(L.tot/5)*5),P=U.plot(x0,28,x1-x0,22,[0,xm],[0,1]);
      var xx=x0;L.parts.forEach(function(v,i){var w=v/xm*(x1-x0);o.push(S.RECT(xx,28,Math.max(w,0.5),22,0,U.soft(CL[i]),CL[i],1));xx+=w;});
      U.nice(0,xm,5).forEach(function(v){o.push(S.L(P.X(v),50,P.X(v),54,"muted",1));o.push(S.T(P.X(v),66,v+"","middle",9.5,"muted"));});
      o.push(S.T(x1,80,"電流 [µA]","end",9.5,"muted"));
      if(!nar)o.push(S.T(x0-8,44,"合計 "+_w01_f(L.tot,2)+" µA","end",10,"ink",true));
      var lx=nar?8:14,ly=96;
      L.parts.forEach(function(v,i){var t=NM[i]+" "+_w01_f(v,v<0.1?3:2);var w=U.tw(t+" µA",9.5)+26;if(lx+w>Wd-6){lx=nar?8:14;ly+=16;}
        o.push(S.RECT(lx,ly-9,11,11,2,U.soft(CL[i]),CL[i],1.1));o.push(S.T(lx+16,ly,t+" µA","start",9.5,"muted"));lx+=w;});
      /* (b) 電池寿命の軸 */
      var yb=ly+34;
      o.push(S.T(nar?8:14,yb,"(b) 電池寿命（電池の容量 180 mAh ÷ 電流の合計）","start",10,"ink",true));
      var Q=U.plot(x0,yb+20,x1-x0,40,[0,YM],[0,1]),ya=yb+70;
      o.push(S.L(x0,ya,x1,ya,"muted",1.2));
      for(var v=0;v<=YM;v++){o.push(S.L(Q.X(v),ya,Q.X(v),ya+4,"muted",1));o.push(S.T(Q.X(v),ya+16,v+"","middle",9.5,"muted"));}
      o.push(S.T(x1,ya+30,"電池寿命 [年]","end",9.5,"muted"));
      if(m===0){o.push(S.RECT(Q.X(LO.y),yb+24,Q.X(HI.y)-Q.X(LO.y),11,3,"var(--gold-soft)","gold",1));
        o.push(S.T((Q.X(LO.y)+Q.X(HI.y))/2+20,yb+19,"使い方しだいで "+_w01_f(LO.y,1)+"〜"+_w01_f(HI.y,1)+" 年","middle",9.5,"gold",true,false,null,true));}
      o.push(S.L(Q.X(1),yb+8,Q.X(1),ya,"alias",1.6,"5 3"));o.push(S.T(Q.X(1)-4,yb+12,"要求の 1 年","end",9.5,"alias",true,false,null,true));
      var xw=Q.X(W2.y);o.push(S.PL([[xw,ya-12],[xw+6,ya-6],[xw,ya],[xw-6,ya-6]],"signal",1.4,m===1?"signal":"var(--signal-soft)"));
      var xc=Q.X(Math.min(YM,L.y)),cc=L.y>=1?"green":"alias",near=Math.abs(xc-xw)<90;
      if(m===1)o.push(S.T(Math.min(x1-50,xw),ya-(near?32:16),"SR-W02 の条件 "+_w01_f(W2.y,1)+" 年","middle",9.5,"signal",true,false,null,true));
      o.push(S.CIRC(xc,ya,6,cc,2.2,"var(--screen)"));o.push(S.D(xc,ya,cc,3));
      o.push(S.T(Math.max(x0+40,Math.min(x1-40,xc)),ya-16,"この使い方 "+_w01_f(L.y,1)+" 年","middle",9.5,cc,true,false,null,true));
      box.set(S.svg(Wd,ya+40,o));
      /* 読み出しと判定 */
      var h="電流の合計 <b>"+_w01_f(L.tot,2)+" µA</b>（眠り "+_w01_f(L.parts[0],2)+"・記録 "+_w01_f(L.parts[1],3)+"・受付 "+_w01_f(L.parts[2],3)+"・読み出し "+_w01_f(L.parts[3],3)+"・LED の表示 "+_w01_f(L.parts[4],2)+" µA）→ 電池寿命 = 180 mAh ÷ "+_w01_f(L.tot,2)+" µA = "+Math.round(L.h).toLocaleString("en-US").replace(/,/g," ")+" 時間 = <b>"+_w01_f(L.y,2)+" 年</b><br>";
      if(m===0)h+="要求「電池で 1 年以上動くこと」: この使い方なら "+(L.y>=1?'<span class="ok">合格</span>':'<span class="warn">不合格</span>')+"。しかし要求に使い方が書いていないので、試す使い方しだいで "+_w01_f(LO.y,2)+"〜"+_w01_f(HI.y,2)+' 年になり、<span class="warn">合否が決まらない</span><br>';
      else h+="SR-W02: 要求の条件（記録の間隔 10 分・25 °C・読み出し 週 1 回 1 分・短押し 1 日 1 回・警報の表示なし・電池少の表示は電池切れの前だけ）で "+_w01_f(W2.y,2)+' 年 → <span class="ok">合格</span>。'+(Math.abs(L.y-W2.y)>1e-9?"今の使い方（"+_w01_f(L.y,2)+" 年）は要求の条件と違うので、合否の判定には使わない（取扱説明書で知らせる）":"今の使い方は、要求の条件そのもの")+"<br>";
      ro.innerHTML=_w01_nw(h+'<div class="wnote">この章の簡単な模型（どれも例の値）: 電池の容量 180 mAh（低温とパルスの負荷と自己放電を見込んだ値）。眠りの電流 2.55 µA（25 °C。マイコン 2.0・センサの待機 0.05・フラッシュの待機 0.5 µA の和。25 °C より 10 °C 高いごとに 1.5 倍とした）。記録 1 回 30 µC（大まかに置いた値）。短押し 1 回で、100 ms ごとのアドバタイズ（1 回 10 µC）を 2 分。読み出し 1 回は、接続までのアドバタイズ 5 秒と、接続中の平均 1.0 mA。LED は 1 回の点灯を 2 mA × 20 ms = 40 µC とし、記録中の表示（30 秒ごとに緑 1 回）で 1.33 µA、警報の表示が続く間は、それに代わる赤 2 回で 2.67 µA。押したときと通信の間だけの表示（状態の応答・通信中の表示など）と、電池切れの前の短い間だけの電池少の表示は、寿命への影響が小さいので省いた。部品ごとに積み上げる詳しい見積もり（02 章 5 節）でも、SR-W02 の条件で 4.9 年になる（記録を大きめに置いた分と、省いた表示の分が、ほぼ打ち消し合う）。ロガーの見積もりは 04 章 5 節で扱う。</div>');
    }
    draw();
  };

  /* ---- 6 節: トレーサビリティの網とマトリクス（f01.py の _F01_T* と同じデータ。ID はこの節の例） ---- */
  var _W01_TU=["1 温湿度を後で確かめる","2 逸脱にすぐ気づく","3 電池の交換は年 1 回","4 5 年使い 10 年残す"];
  var _W01_TS=[["SR-F01","測定"],["SR-F02","記録の間隔"],["SR-F04","記録の容量"],["SR-F10","警報の印"],["SR-P01","温度の誤差"],["SR-W02","電池寿命"],["SR-R01","記録の保持"],["SR-R04","5 年の使用"]];
  var _W01_TD=[["DS-H01","マイコン"],["DS-H02","温湿度センサ"],["DS-H03","記録用フラッシュ"],["DS-S01","測定と記録の処理"],["DS-S02","警報と LED の処理"],["DS-D01","記録 1 件の形式"],["DS-B01","電力の予算"],["DS-S09","デバッグ用の命令"]];
  /* 試験の番号は 03 章の表 6-1 と同じ。最後の ST-043（SR-R01 の試験）は、抜けの例として初めは外してある */
  var _W01_TT=[["ST-001","測定"],["ST-002","記録の間隔"],["ST-004","記録の容量"],["ST-010","警報の印"],["ST-029","温度の誤差"],["ST-036","電池寿命（解析）"],["ST-046","書き換え回数（解析）"],["ST-043","記録の保持（解析）"]];
  var _W01_TUS=[[0,1,2,4],[3],[5],[6,7]];
  function _w01_stCmp(a,b){return _W01_TT[a][0]<_W01_TT[b][0]?-1:(_W01_TT[a][0]>_W01_TT[b][0]?1:0);}   /* 試験は番号の順に並べて示す */
  function _w01_trInit(){return {sd:[[1,3],[3,6],[2,5],[4],[1],[0,6],[2],[2,3]],st:[[0],[1],[2],[3],[4],[5],[],[6]],nT:7,ds9:true};}
  REG.w01_trace=function(el,U){
    var S=U.S;
    U.head(el,"TRACEABILITY","要求・設計・試験の網とマトリクス — 変更の影響と、試験の無い要求・要求の無い設計");
    var r1=U.ctrls(el);
    var sSel=U.select(r1,"変える要求を選ぶ",_W01_TS.map(function(s){return s[0]+" "+s[1];}),1,function(){sel=sSel.get();draw();});
    var tSel=U.select(r1,"つなぐ相手（設計の要素・試験）",["—"],0,null);
    var br=U.btnrow(el);
    U.button(br,"選んだ要求と相手をつなぐ／外す",function(){toggle(sel,tSel.get());});
    U.button(br,"抜けを直した例",function(){D.nT=8;if(D.st[6].indexOf(7)<0)D.st[6].push(7);D.ds9=false;fill();draw();});
    U.button(br,"本文の例に戻す",function(){D=_w01_trInit();sel=1;sSel.set(1);fill();draw();});
    var box=U.svgbox(el),mdiv=U.mk("div","readout");el.appendChild(mdiv);var ro=U.readout(el);
    var D=_w01_trInit(),sel=1,hits=[];
    function targets(){var a=[];_W01_TD.forEach(function(d,j){if(j<7||D.ds9)a.push({k:"d",j:j,t:d[0]+" "+d[1]});});for(var k=0;k<D.nT;k++)a.push({k:"t",j:k,t:_W01_TT[k][0]+" "+_W01_TT[k][1]});return a;}
    function fill(){var a=targets(),v=tSel.input.value;tSel.input.innerHTML="";a.forEach(function(x,i){var op=U.mk("option");op.value=i;op.textContent=x.t;tSel.input.appendChild(op);});if(+v<a.length)tSel.input.value=v;}
    function toggle(i,ti){var x=targets()[ti];if(!x)return;var arr=x.k==="d"?D.sd[i]:D.st[i],p=arr.indexOf(x.j);if(p>=0)arr.splice(p,1);else arr.push(x.j);draw();}
    function analyze(){
      var dsd=D.sd[sel].slice(),ind=[];D.sd.forEach(function(js,i){if(i!==sel&&js.some(function(j){return dsd.indexOf(j)>=0;}))ind.push(i);});
      var st=D.st[sel].slice();ind.forEach(function(i){D.st[i].forEach(function(k){if(st.indexOf(k)<0)st.push(k);});});st.sort(_w01_stCmp);
      var noT=[],noR=[],noRT=[];D.st.forEach(function(ks,i){if(!ks.length)noT.push(i);});
      _W01_TD.forEach(function(d,j){if(j===7&&!D.ds9)return;if(!D.sd.some(function(js){return js.indexOf(j)>=0;}))noR.push(j);});
      for(var k=0;k<D.nT;k++)if(!D.st.some(function(ks){return ks.indexOf(k)>=0;}))noRT.push(k);
      return {dsd:dsd,ind:ind,st:st,noT:noT,noR:noR,noRT:noRT};}
    function draw(){
      var A=analyze(),nar=_w01_nar(box),Wd=nar?400:700,o=[],sz=nar?9:9.5;hits=[];
      var xu=14,wu=132,xs=nar?6:184,ws=nar?132:140,xr=nar?204:406,wr=nar?190:178,nh=20;
      var ys=[],yd=[],yt=[],i,j,k;for(i=0;i<8;i++)ys.push(48+i*40);for(j=0;j<8;j++)yd.push(44+j*24);for(k=0;k<D.nT;k++)yt.push(yd[7]+46+k*24);
      var yu=[ys[0]+30,ys[3],ys[5],ys[6]+20];
      function link(x1,y1,x2,y2,c,lw,dash){return S.PATH("M"+x1+","+y1+" C"+((x1+x2)/2)+","+y1+" "+((x1+x2)/2)+","+y2+" "+x2+","+y2,c,lw,null,dash);}
      if(!nar)_W01_TUS.forEach(function(js,u){js.forEach(function(j2){o.push(link(xu+wu,yu[u]+nh/2,xs,ys[j2]+nh/2,j2===sel?"gold":"faint",j2===sel?1.6:1));});});
      D.sd.forEach(function(js,a){js.forEach(function(b){if(b===7&&!D.ds9)return;var hot=a===sel,sh=A.ind.indexOf(a)>=0&&A.dsd.indexOf(b)>=0;
        o.push(link(xs+ws,ys[a]+nh/2,xr,yd[b]+nh/2,hot?"signal":(sh?"gold":"faint"),hot?2.4:(sh?1.6:1),sh?"4 3":null));});});
      D.st.forEach(function(ks,a){ks.forEach(function(b){var hot=a===sel,sh=A.ind.indexOf(a)>=0;
        o.push(link(xs+ws,ys[a]+nh/2,xr,yt[b]+nh/2,hot?"signal":(sh?"gold":"faint"),hot?2.4:(sh?1.6:1),sh&&!hot?"4 3":null));});});
      if(!nar){_W01_TU.forEach(function(t,u){o.push(S.RECT(xu,yu[u],wu,nh,4,"var(--gold-soft)","gold",1));o.push(S.T(xu+6,yu[u]+14,t,"start",sz,"ink"));});
        o.push(S.T(xu,ys[0]-8,"要求仕様書の項目","start",sz,"gold",true));}
      o.push(S.T(xs,ys[0]-8,"システムの要求（押すと選ぶ）","start",sz,"signal",true));
      o.push(S.T(xr,yd[0]-8,"設計の要素","start",sz,"purple",true));o.push(S.T(xr,yt[0]-8,"システム試験","start",sz,"green",true));
      _W01_TS.forEach(function(s,a){var on=a===sel,ind=A.ind.indexOf(a)>=0,bad=A.noT.indexOf(a)>=0,c=on?"signal":(ind?"gold":(bad?"alias":"signal"));
        o.push(S.RECT(xs,ys[a],ws,nh,4,on?"signal":(bad?"var(--alias-soft)":"var(--signal-soft)"),c,on||ind?2:1.1,ind?"4 2":null));
        o.push(S.T(xs+5,ys[a]+14,s[0],"start",sz,on?"panel":c,true,true));o.push(S.T(xs+(nar?48:52),ys[a]+14,s[1],"start",sz,on?"panel":"ink"));
        if(bad)o.push(S.T(xs+ws,ys[a]-3,"試験が無い","end",sz,"alias",true,false,null,true));
        hits.push({x:xs,y:ys[a],w:ws,h:nh,k:"s",j:a});});
      _W01_TD.forEach(function(d,b){if(b===7&&!D.ds9){o.push(S.RECT(xr,yd[b],wr,nh,4,"none","faint",1,"3 3"));o.push(S.T(xr+6,yd[b]+14,d[0]+"（外した）","start",sz,"faint"));return;}
        var bad=A.noR.indexOf(b)>=0,hot=A.dsd.indexOf(b)>=0;
        o.push(S.RECT(xr,yd[b],wr,nh,4,bad?"var(--alias-soft)":"var(--purple-soft)",hot?"signal":(bad?"alias":"purple"),hot?2:1));
        o.push(S.T(xr+5,yd[b]+14,d[0],"start",sz,bad?"alias":"purple",true,true));o.push(S.T(xr+(nar?50:54),yd[b]+14,d[1],"start",sz,"ink"));
        if(bad&&!nar)o.push(S.T(xr+wr+8,yd[b]+14,"← 要求が無い","start",sz,"alias",true));
        hits.push({x:xr,y:yd[b],w:wr,h:nh,k:"d",j:b});});
      for(k=0;k<D.nT;k++){var hot=A.st.indexOf(k)>=0,dir=D.st[sel].indexOf(k)>=0,nr=A.noRT.indexOf(k)>=0;
        o.push(S.RECT(xr,yt[k],wr,nh,4,nr?"var(--alias-soft)":"var(--green-soft)",hot?(dir?"signal":"gold"):(nr?"alias":"green"),hot?2:1));
        o.push(S.T(xr+5,yt[k]+14,_W01_TT[k][0],"start",sz,"green",true,true));o.push(S.T(xr+(nar?50:54),yt[k]+14,_W01_TT[k][1],"start",sz,"ink"));
        if(hot&&!nar)o.push(S.T(xr+wr+8,yt[k]+14,"← 確かめ直す","start",sz,dir?"signal":"gold",true));
        hits.push({x:xr,y:yt[k],w:wr,h:nh,k:"t",j:k});}
      var yl=yt[D.nT-1]+44;
      o.push(S.LEGL(nar?6:14,yl,[["signal",null,"選んだ要求に直接つながる"],["gold","4 3","同じ設計の要素を通して広がる"]],sz,14));
      box.set(S.svg(Wd,yl+10,o));
      /* マトリクス（HTML。マスを押すと、つなぐ・外す） */
      var cols=[];_W01_TD.forEach(function(d,b){if(b<7||D.ds9)cols.push({k:"d",j:b,id:d[0]});});for(k=0;k<D.nT;k++)cols.push({k:"t",j:k,id:_W01_TT[k][0]});
      var h='<div style="margin:.2rem 0 .3rem">トレーサビリティマトリクス（マスを押すと、つなぐ・外す）</div><div class="wtable"><table><thead><tr><th></th>'+
        cols.map(function(c){var bad=c.k==="d"?A.noR.indexOf(c.j)>=0:A.noRT.indexOf(c.j)>=0;return '<th style="text-align:center;line-height:1.25;color:'+(bad?"var(--alias)":(c.k==="d"?"var(--purple)":"var(--green)"))+'">'+c.id.slice(0,3)+'<br>'+c.id.slice(3)+'</th>';}).join("")+'</tr></thead><tbody>';
      _W01_TS.forEach(function(s,a){h+='<tr><th style="text-align:left;'+(a===sel?"color:var(--signal)":"")+'">'+s[0]+'</th>';
        cols.forEach(function(c){var on=(c.k==="d"?D.sd[a]:D.st[a]).indexOf(c.j)>=0,bad=(c.k==="t"&&A.noT.indexOf(a)>=0)||(c.k==="d"?A.noR.indexOf(c.j)>=0:A.noRT.indexOf(c.j)>=0);
          var bg=bad?"var(--alias-soft)":(a===sel?"var(--signal-soft)":"transparent");
          h+='<td data-m="'+a+','+c.k+','+c.j+'" style="cursor:pointer;text-align:center;background:'+bg+'">'+(on?'<b style="color:'+(a===sel?"var(--signal)":"var(--ink)")+'">●</b>':"")+'</td>';});h+='</tr>';});
      mdiv.innerHTML=h+'</tbody></table></div>';
      /* 読み出し */
      var nm=function(arr,L){return arr.length?arr.map(function(x){return L[x][0];}).join("・"):"なし";};
      var up=[];_W01_TUS.forEach(function(js,u){if(js.indexOf(sel)>=0)up.push(_W01_TU[u]);});
      var r="<b>"+_W01_TS[sel][0]+"</b>（"+_W01_TS[sel][1]+"）の出典: 要求仕様書の項目「"+(up.join("」「")||"なし")+"」<br>";
      r+="変えると、直接: 設計の要素 "+nm(A.dsd,_W01_TD)+"、試験 "+nm(D.st[sel].slice().sort(_w01_stCmp),_W01_TT)+"<br>";
      r+="同じ設計の要素を使う要求 "+(A.ind.length?'<span style="color:var(--gold);font-weight:700">'+nm(A.ind,_W01_TS)+"</span>":"なし")+" にも広がる → 確かめ直す試験は全部で <b>"+nm(A.st,_W01_TT)+"</b><br>";
      r+=(A.noT.length?'<span class="warn">試験の無い要求: '+nm(A.noT,_W01_TS)+"</span>":'<span class="ok">試験の無い要求は無い</span>')+"、"+
        (A.noR.length?'<span class="warn">要求の無い設計の要素: '+nm(A.noR,_W01_TD)+"</span>":'<span class="ok">要求の無い設計の要素は無い</span>')+
        (A.noRT.length?'、<span class="warn">要求の無い試験: '+nm(A.noRT,_W01_TT)+"</span>":"");
      ro.innerHTML=_w01_nw(r+'<div class="wnote">要求と ST の番号は 03 章の表 6-1 と同じ（SR-R01 の試験 ST-043 は、抜けの例として初めは外してある）。要求仕様書の項目、DS の ID と対応は、この節の説明のための例（ロガーの設計の要素は 04 章 6 節）。網の要求の箱を押すと、その要求を選ぶ。網の設計の要素・試験の箱を押すと、つなぐ相手に選ぶ。</div>');
    }
    U.ctl.drag(box,function(type,x,y){if(type!=="down")return false;var hit=null;hits.forEach(function(q){if(x>=q.x&&x<=q.x+q.w&&y>=q.y&&y<=q.y+q.h)hit=q;});if(!hit)return false;
      if(hit.k==="s"){sel=hit.j;sSel.set(sel);draw();return false;}
      var a=targets();for(var i=0;i<a.length;i++)if(a[i].k===hit.k&&a[i].j===hit.j){tSel.set(i);break;}return false;});
    mdiv.addEventListener("click",function(e){var td=e.target.closest?e.target.closest("[data-m]"):null;if(!td)return;var q=td.getAttribute("data-m").split(",");
      var a=+q[0],k=q[1],j=+q[2],arr=k==="d"?D.sd[a]:D.st[a],p=arr.indexOf(j);if(p>=0)arr.splice(p,1);else arr.push(j);draw();});
    fill();draw();
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
