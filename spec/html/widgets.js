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

  /* ===== 02 章 設計書の書き方 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w02_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w02_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";return v.toFixed(d).replace("-","−");}
  /* 有効数字を見て桁を決める（µA の小さな値を読めるように） */
  function _w02_ua(v){if(v>=1)return _w02_f(v,2);if(v>=0.01)return _w02_f(v,3);return _w02_f(v,4);}
  /* 3 桁ごとに空白を入れた整数（66 800 など） */
  function _w02_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}

  /* ---- 4 節: 中の状態遷移表 ---- */
  var _W02_ST=["停止中","待ち","測定中","書き込み中"],_W02_EV=["長押し","記録の時刻","測定の完了","応答なし","書き込みの完了"];
  /* マスの処理。t は表に書く短い文字（1 行 7 文字まで）、d は読み出しに書く説明、x は起きない理由（起きないマス）、no は決めていないマス */
  var _W02_CELL={
    "0,0":[{t:["記録を始め、","すぐ測る","→ 測定中"],d:"記録を始める（RTC を設定し、開始の応答をする）。すぐに 1 件目の測定の命令を送り、5 ms のタイマを掛ける → 測定中（容量に達していて止める設定なら、停止の応答だけ）"}],
    "1,0":[{t:["記録を止める","→ 停止中"],d:"記録を止める（RTC を止め、停止の応答をする）→ 停止中"}],
    "1,1":[{t:["測定の命令","→ 測定中"],d:"測定の命令を送り、5 ms のタイマを掛ける → 測定中"}],
    "2,0":[{t:["止める印を","立てる"],d:"止める印を立てる（測定と書き込みを終えてから止める）"},
           {t:["すぐ","→ 停止中"],d:"すぐ停止中へ（RTC を止め、停止の応答をする。測定のタイマはそのまま）"},
           {t:["（空き）"],d:"（決めていない）",no:true}],
    "2,2":[{t:["結果から 1 件","→ 書き込み中"],d:"結果を読み、1 件を書き始める → 書き込み中"}],
    "2,3":[{t:["測定異常の","1 件","→ 書き込み中"],d:"測定異常の印を付けた 1 件を書き始める → 書き込み中"},
           {t:["何も書かず","→ 待ち"],d:"何も書かずに → 待ち"},
           {t:["（空き）"],d:"（決めていない）",no:true}],
    "3,0":[{t:["止める印を","立てる"],d:"止める印を立てる（書き込みを終えてから止める）"},
           {t:["すぐ","→ 停止中"],d:"すぐ停止中へ（RTC を止め、停止の応答をする。書き込みの完了は待たない）"},
           {t:["（空き）"],d:"（決めていない）",no:true}],
    "3,4":[{t:["眠らせる","印なし → 待ち","印 → 停止中"],d:"フラッシュを眠らせる。止める印があれば停止の応答をして → 停止中、無ければ → 待ち"},
           {t:["眠らせずに","→ 待ち"],d:"フラッシュを眠らせずに → 待ち（止める印も見ない）"}]
  };
  var _W02_WHY={"0,1":"RTC を止めてある","0,2":"タイマを掛けていない","0,3":"タイマを掛けていない","0,4":"書いていない","1,2":"タイマを掛けていない","1,3":"タイマを掛けていない","1,4":"書いていない",
    "2,1":"記録の間隔は 1 分以上","2,4":"書いていない","3,1":"記録の間隔は 1 分以上","3,2":"タイマを掛けていない","3,3":"タイマを掛けていない"};
  var _W02_EDIT=[["2,0","測定中 × 長押し"],["3,0","書き込み中 × 長押し"],["2,3","測定中 × 応答なし"],["3,4","書き込み中 × 書き込みの完了"]];
  var _W02_SEQ=[
    {n:"普通の記録（2 回測って止める）",e:[0,2,4,1,2,4,0]},
    {n:"書き込み中に長押し",e:[0,2,4,1,2,0,4,1]},
    {n:"測定中に長押し",e:[0,2,4,1,0,2,4,1]},
    {n:"センサが応答しない",e:[0,3,4,1,2,4]}];
  REG.w02_fsm=function(el,U){
    var S=U.S;
    U.head(el,"STATE TABLE","中の状態遷移表 — マスの処理と出来事の列で、状態の動きを 1 つずつ確かめる");
    var r1=U.ctrls(el);
    var seqSel=U.select(r1,"出来事の列",_W02_SEQ.map(function(q){return q.n;}),0,function(){reset();draw();});
    var cellSel=U.select(r1,"処理を変えるマス",_W02_EDIT.map(function(q){return q[1];}),0,function(){fillOpts();});
    var optSel=U.select(r1,"そのマスの処理",["—"],0,function(){choice[_W02_EDIT[cellSel.get()][0]]=+optSel.input.value;reset();draw();});
    var br=U.btnrow(el);
    U.button(br,"1 つ進める",function(){step();draw();});
    U.button(br,"最後まで",function(){while(pos<seq().length)step();draw();});
    U.button(br,"最初から",function(){reset();draw();});
    U.button(br,"本文の例",function(){choice={};seqSel.set(0);cellSel.set(0);fillOpts();reset();draw();});
    var box=U.svgbox(el),ro=U.readout(el),choice={},sim,pos,log,lastT=null,lastCell=null,geo=[];
    function seq(){return _W02_SEQ[seqSel.get()].e;}
    function opt(key){var a=_W02_CELL[key];if(!a)return null;return a[choice[key]||0];}
    function fillOpts(){var key=_W02_EDIT[cellSel.get()][0],s=optSel.input;while(s.firstChild)s.removeChild(s.firstChild);
      _W02_CELL[key].forEach(function(o,i){var op=document.createElement("option");op.value=i;op.textContent=o.d;s.appendChild(op);});s.value=choice[key]||0;}
    function reset(){sim={st:0,rtc:false,timer:false,writing:false,stop:false,awake:false,warned:false,recs:0,miss:0,led:"—"};pos=0;log=[];lastT=null;lastCell=null;}
    /* 出来事が今の状況で起こりうるか */
    function can(e){if(e===0)return true;if(e===1)return sim.rtc;if(e===2||e===3)return sim.timer;if(e===4)return sim.writing;return false;}
    function why(e){return e===1?"RTC が止まっている":(e===4?"書き込みをしていない":"測定のタイマが掛かっていない");}
    function step(){
      var sq=seq();if(pos>=sq.length)return;var e=sq[pos++],s0=sim.st,key=s0+","+e,line={i:pos,s:_W02_ST[s0],e:_W02_EV[e],d:"",w:[]};
      if(!can(e)){line.d="（"+why(e)+"ので、この出来事は起きない）";line.skip=true;log.push(line);lastT=null;lastCell=null;return;}
      lastCell=key;
      if(e===2||e===3)sim.timer=false;
      if(e===4){sim.writing=false;sim.recs++;}
      var o=opt(key);
      if(!o){line.d="起きないとしたマス（"+(_W02_WHY[key]||"")+"）に、イベントが届いた";
        line.w.push(s0===0?"表の前提が崩れた。タイマや書き込みを止めないまま停止中に移ったので、その完了が後から届いた":"表の前提が崩れた。前の測定が終わらないまま、次の記録の時刻が来た（この記録は取られない）");
        log.push(line);lastT=null;check(line);return;}
      if(o.no){line.d="マスが空いている（決めていない）ので、イベントは捨てられた";
        if(e===0)line.w.push("長押しが無視された。利用者は止めたつもりでも、記録は続く（SR-F06・SR-U07 を満たさない）");
        if(e===3)line.w.push("応答なしの後の動きが無く、測定中のまま止まる。次の記録の時刻からも動けない");
        log.push(line);lastT=null;check(line);return;}
      line.d=o.d;var to=s0;
      if(key==="0,0"){sim.rtc=true;sim.timer=true;sim.led="開始の応答（緑 3 回）";to=2;}
      else if(key==="1,0"){sim.rtc=false;sim.led="停止の応答（赤 3 回）";to=0;}
      else if(key==="1,1"){sim.timer=true;to=2;}
      else if(key==="2,0"||key==="3,0"){var c=choice[key]||0;if(c===0)sim.stop=true;else{sim.rtc=false;sim.led="停止の応答（赤 3 回）";to=0;
          if(key==="2,0")line.w.push("測定のタイマが掛かったまま停止中に移った。5 ms 後に、停止中で「測定の完了」が届く");
          else{line.w.push("書き込みの途中で停止中に移った。書き込みの完了を待たないので、フラッシュを眠らせる処理が行われない");}}}
      else if(key==="2,2"){sim.writing=true;sim.awake=true;to=3;}
      else if(key==="2,3"){var c3=choice[key]||0;if(c3===0){sim.writing=true;sim.awake=true;sim.miss++;to=3;}else{to=1;line.w.push("記録が 1 件抜けた。アプリからは、測らなかったのか測れなかったのかが分からない（SR-F03）");}}
      else if(key==="3,4"){var c4=choice[key]||0;if(c4===0){sim.awake=false;if(sim.stop){sim.stop=false;sim.rtc=false;sim.led="停止の応答（赤 3 回）";to=0;}else to=1;}
        else{to=1;if(sim.stop)line.w.push("止める印を見ないので、長押しで止めたはずの記録が続く");sim.stop=false;}}
      sim.st=to;line.to=_W02_ST[to];lastT=[s0,to,key];log.push(line);check(line);}
    function check(line){if(sim.awake&&(sim.st===0||sim.st===1)&&!sim.writing&&!sim.warned){sim.warned=true;line.w.push("フラッシュが眠っていない（スタンバイ 25 µA）。5 節の予算で、寿命が 4.9 年から 0.72 年になる");}}
    /* ---- 描く ---- */
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],sq=seq();
      /* 出来事の列 */
      o.push(S.T(8,16,"出来事の列","start",10,"ink",true));
      var xx=nar?8:76,yy=nar?24:8;
      sq.forEach(function(e,i){var t=(i+1)+" "+_W02_EV[e],w=U.tw(t,9.5)+10;if(xx+w>Wd-6){xx=nar?8:76;yy+=22;}
        var cur=i===pos-1,done=i<pos-1;o.push(S.RECT(xx,yy,w,18,4,cur?U.soft("gold"):(done?"var(--screen)":"panel"),cur?"gold":"line",cur?1.6:1));
        o.push(S.T(xx+w/2,yy+13,t,"middle",9.5,cur?"gold":(done?"muted":"ink"),cur));xx+=w+4;});
      /* 表 */
      var tx=8,ty=yy+30,c0=nar?60:96,cw=nar?66:118,rh=46,hh=26;geo=[];
      o.push(S.RECT(tx,ty,c0,hh,0,"var(--screen)","line",1));o.push(S.T(tx+c0/2,ty+17,"状態＼イベント","middle",nar?8.5:9.5,"muted",true));
      _W02_EV.forEach(function(e,j){var x=tx+c0+j*cw;o.push(S.RECT(x,ty,cw,hh,0,"var(--screen)","line",1));o.push(S.T(x+cw/2,ty+17,e,"middle",nar?8.5:9.5,"ink",true));});
      _W02_ST.forEach(function(s,i){var y=ty+hh+i*rh,cur=sim.st===i;
        o.push(S.RECT(tx,y,c0,rh,0,cur?U.soft("purple"):"panel","line",1));o.push(S.T(tx+c0/2,y+rh/2+4,s,"middle",10,"purple",true));
        _W02_EV.forEach(function(e,j){var x=tx+c0+j*cw,key=i+","+j,op=opt(key),lines,col="ink",fill="none";
          if(!op){lines=["起きない"];col="faint";}
          else if(op.no){lines=op.t;col="alias";fill=U.soft("alias");}
          else{lines=op.t;if(choice[key])col="gold";}
          var ed=_W02_EDIT.some(function(q){return q[0]===key;});
          if(ed&&!op.no&&!choice[key])fill=U.soft("green");
          o.push(S.RECT(x,y,cw,rh,0,fill,"line",1));
          var lh=12,y0=y+rh/2-(lines.length-1)*lh/2+3.5;lines.forEach(function(l,k){o.push(S.T(x+cw/2,y0+k*lh,l,"middle",nar?8.5:9.5,col,col!=="faint"&&col!=="ink"));});
          if(ed)geo.push({x:x,y:y,w:cw,h:rh,key:key});});});
      if(lastCell){var p=lastCell.split(",");o.push(S.RECT(tx+c0+(+p[1])*cw+1.5,ty+hh+(+p[0])*rh+1.5,cw-3,rh-3,2,"none","gold",2.6));}
      var tb=ty+hh+4*rh;
      o.push(S.T(tx,tb+15,"緑: 処理を変えられるマス（本文の表のとおり）　金: 変えたマス　赤: 空いたマス","start",9.5,"muted"));
      /* 状態遷移図（表から描く）と、仕様から見た様子 */
      var dy=tb+28,dx=nar?8:8,dw=nar?384:430,P={0:[dx+50,dy+70],1:[dx+165,dy+110],2:[dx+265,dy+44],3:[dx+350,dy+110]};
      o.push(S.RECT(dx,dy,dw,160,6,"var(--screen)","line",1));
      o.push(S.T(dx+8,dy+16,"表から描いた状態遷移図","start",10,"ink",true));
      var arrows=[];function add(a,b,lab,key){arrows.push([a,b,lab,key]);}
      add(0,2,"長押し","0,0");add(1,0,"長押し","1,0");add(1,2,"記録の時刻","1,1");
      if(!opt("2,0").no&&(choice["2,0"]||0)===1)add(2,0,"長押し","2,0");
      add(2,3,"測定の完了","2,2");var c23=choice["2,3"]||0;if(c23===0)add(2,3,"","2,3");if(c23===1)add(2,1,"応答なし","2,3");
      if((choice["3,0"]||0)===1)add(3,0,"長押し","3,0");
      add(3,1,"書き込みの完了","3,4");if((choice["3,4"]||0)===0)add(3,0,"完了（印）","3,4");
      arrows.forEach(function(a){var A=P[a[0]],B=P[a[1]],hl=lastT&&lastT[2]===a[3]&&lastT[0]===a[0]&&lastT[1]===a[1],c=hl?"gold":"purple",lw=hl?2.6:1.3;
        if(a[0]===3&&a[1]===0){var low=a[3]==="3,4",ym=dy+(low?180:165),x0p=A[0]-6,y0p=A[1]+13,x1p=B[0]+(low?-8:8),y1p=B[1]+13,cx=(x0p+x1p)/2;
          o.push(S.PATH("M"+x0p+","+y0p+" Q"+cx+","+ym+" "+x1p+","+y1p,c,lw));o.push(S.head(cx,ym,x1p,y1p,c,6));
          o.push(S.T(low?dx+175:dx+290,low?dy+150:dy+129,a[2],"middle",9,c,hl,false,null,true));return;}
        if(a[0]===2&&a[1]===0){var pth="M"+(A[0]-34)+","+(A[1]-4)+" Q"+(A[0]-130)+","+(A[1]-30)+" "+(B[0]+10)+","+(B[1]-13);o.push(S.PATH(pth,c,lw));o.push(S.head(A[0]-130,A[1]-30,B[0]+10,B[1]-13,c,6));
          o.push(S.T(A[0]-110,A[1]-24,"長押し","middle",9,c,hl,false,null,true));return;}
        var fw=a[0]<a[1],Pp=fw?A:B,Qq=fw?B:A,L=Math.hypot(Qq[0]-Pp[0],Qq[1]-Pp[1])||1,cx_=(Qq[0]-Pp[0])/L,cy_=(Qq[1]-Pp[1])/L,off=fw?-7:7,nx=-cy_*off,ny=cx_*off;
        var ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L,x1=A[0]+ux*34+nx,y1=A[1]+uy*14+ny,x2=B[0]-ux*34+nx,y2=B[1]-uy*14+ny;
        o.push(S.ARR(x1,y1,x2,y2,c,lw,6));
        if(a[2]){var up=(a[0]===3&&a[1]===1),mx=(x1+x2)/2+(up?0:nx*1.9),my=up?(y1+y2)/2-6:(y1+y2)/2+ny*1.9+3;o.push(S.T(mx,my,a[2],"middle",9,c,hl,false,null,true));}});
      _W02_ST.forEach(function(s,i){var q=P[i],cur=sim.st===i;o.push(S.RECT(q[0]-34,q[1]-13,68,26,10,cur?U.soft("gold"):U.soft("purple"),cur?"gold":"purple",cur?2.4:1.3));o.push(S.T(q[0],q[1]+4,s,"middle",10,cur?"gold":"purple",true));});
      /* 仕様から見た様子 */
      var sx=nar?8:448,sy=nar?dy+170:dy,sw=nar?384:244;
      o.push(S.RECT(sx,sy,sw,160,6,"var(--screen)","signal",1.1));
      o.push(S.T(sx+8,sy+16,"仕様から見た様子","start",10,"signal",true));
      var mode=sim.st===0?"停止中":"記録中";
      o.push(S.T(sx+8,sy+38,"主のモード","start",9.5,"muted"));o.push(S.T(sx+86,sy+38,mode,"start",11,"signal",true));
      o.push(S.T(sx+8,sy+60,"LED（最後）","start",9.5,"muted"));o.push(S.T(sx+86,sy+60,sim.led,"start",10,sim.led.indexOf("赤")>=0?"alias":(sim.led.indexOf("緑")>=0?"green":"ink"),true));
      o.push(S.T(sx+8,sy+82,"記録の件数","start",9.5,"muted"));o.push(S.T(sx+86,sy+82,sim.recs+" 件"+(sim.miss?"（うち測定異常 "+sim.miss+" 件）":""),"start",10,"ink",true));
      o.push(S.T(sx+8,sy+104,"フラッシュ","start",9.5,"muted"));o.push(S.T(sx+86,sy+104,sim.writing?"書き込み中":(sim.awake?"起きたまま（25 µA）":"眠っている（0.5 µA）"),"start",10,sim.awake&&!sim.writing?"alias":"ink",true));
      o.push(S.T(sx+8,sy+126,"止める印","start",9.5,"muted"));o.push(S.T(sx+86,sy+126,sim.stop?"あり":"なし","start",10,"ink",true));
      o.push(S.T(sx+8,sy+150,"進んだ数 "+pos+" / "+sq.length,"start",9.5,"muted"));
      box.set(S.svg(Wd,nar?sy+168:dy+168,o));
      /* 読み出し */
      var h="";if(!log.length)h="「1 つ進める」で、出来事の列を 1 つずつ起こす。<br>";
      log.forEach(function(l){h+=l.i+". "+l.s+" で <b>"+l.e+"</b>: "+l.d+(l.to?"　⇒ <b>"+l.to+"</b>":"")+"<br>";l.w.forEach(function(w){h+='　<span class="warn">'+w+"</span><br>";});});
      if(pos>=sq.length){var bad=log.some(function(l){return l.w.length;});h+=bad?'<span class="warn">この列では、仕様どおりに動かない所がある</span>':'<span class="ok">この列では、仕様どおりに動いた</span>';}
      ro.innerHTML=h+'<div class="wnote">表のマスは本文の中の状態遷移表と同じ。「処理を変えるマス」で選んだマスの処理を変えると、表と状態遷移図の矢印が変わる（図のマスを押しても選べる）。出来事が、今の状況では起こりえないとき（RTC を止めた後の記録の時刻など）は、飛ばして読み出しに書く。</div>';
    }
    U.ctl.drag(box,function(type,x,y){if(type!=="down")return false;for(var i=0;i<geo.length;i++){var g=geo[i];if(x>=g.x&&x<=g.x+g.w&&y>=g.y&&y<=g.y+g.h){
      var k=-1;_W02_EDIT.forEach(function(q,j){if(q[0]===g.key)k=j;});if(k>=0){cellSel.set(k);fillOpts();}}}return false;});
    fillOpts();reset();draw();
  };

  /* ---- 5 節: 電力の予算 ---- */
  var _W02_DAY=86400;
  /* s02/power2.py の budget と同じ計算。LED は表 3-5 の表示（30 秒ごとの表示・通信中の表示・状態の応答）で点く */
  function _w02_budget(p){
    var nM=1440/p.iv,act=p.act*1e-3*nM,adv=p.press*1200*2e-3,conn=p.read/7*60*0.2;
    var sen=5e-3*nM,wr=0.7e-3*nM,er=45e-3*nM/510,on=p.on*1e-3;
    var l30=_W02_DAY/30*(p.alarm?2:1)*on,lcom=(p.press*120+p.read/7*60)/2*on,lst=p.press*on;
    var it=[
      ["マイコン","眠り",p.sl*1e-3,1-(act+adv+conn)/_W02_DAY],["マイコン","動作",3.0,act/_W02_DAY],["マイコン","送信（受付）",5.0,adv/_W02_DAY],["マイコン","送信（接続）",5.0,conn/_W02_DAY],
      ["センサ","待機",0.05e-3,1-sen/_W02_DAY],["センサ","測定",0.3,sen/_W02_DAY],
      ["フラッシュ","眠り",p.fl?25e-3:0.5e-3,1-(wr+er)/_W02_DAY],["フラッシュ","書き込み",5.0,wr/_W02_DAY],["フラッシュ","消去",10.0,er/_W02_DAY],
      ["LED",p.alarm?"警報の表示":"記録中の表示",2.0,l30/_W02_DAY],["LED","通信中の表示",2.0,lcom/_W02_DAY],["LED","状態の応答",2.0,lst/_W02_DAY]];
    var tot=0;it.forEach(function(r){r.push(r[2]*r[3]*1000);tot+=r[4];});
    return {it:it,tot:tot,life:p.Q/(tot/1000)/8760,lim:p.Q/8760*1000};}
  /* 有効数字 3 桁に丸めた時間（43 200 など） */
  function _w02_h(v){if(!(v>0))return "0";var e=Math.pow(10,Math.max(0,Math.floor(Math.log10(v))-2));return _w02_g(Math.round(v/e)*e);}
  var _W02_P0={iv:10,sl:2.0,fl:0,act:1.1,on:20,press:1,read:1,alarm:0,Q:180};
  REG.w02_power=function(el,U){
    var S=U.S;
    U.head(el,"POWER BUDGET","電力の予算 — 部品の状態ごとの電流と時間の割合から、平均電流と電池寿命を求める");
    var r1=U.ctrls(el);
    var iv=U.slider(r1,"記録の間隔",{values:[1,2,5,10,15,20,30,60],value:10,fmt:function(v){return v+" 分";},onInput:draw});
    var sl=U.slider(r1,"マイコンの眠りの電流",{min:0.5,max:10,step:0.1,value:2.0,fmt:function(v){return _w02_f(v,1)+" µA";},onInput:draw});
    var act=U.slider(r1,"測定 1 回のマイコンの動作",{values:[0.5,1.1,2,5,10,20],value:1.1,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var fl=U.select(r2,"測定の後のフラッシュ",["ディープパワーダウンにする（0.5 µA）","眠らせ忘れる（スタンバイ 25 µA）"],0,draw);
    var on=U.slider(r2,"LED の 1 回の点灯",{values:[5,10,20,50,100,150,200],value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var alarm=U.select(r2,"警報の表示",["無い（SR-W02 の条件）","続く（30 秒ごとに赤を 2 回）"],0,draw);
    var r3=U.ctrls(el);
    var press=U.slider(r3,"短押しの回数",{values:[0,1,2,5,10],value:1,fmt:function(v){return "1 日に "+v+" 回";},onInput:draw});
    var read=U.slider(r3,"読み出しの回数",{values:[0,1,2,7],value:1,fmt:function(v){return "1 週間に "+v+" 回";},onInput:draw});
    var Q=U.slider(r3,"設計で使う容量 Q",{min:100,max:220,step:5,value:180,fmt:function(v){return v+" mAh";},onInput:draw});
    var br=U.btnrow(el);
    function setp(p){iv.set(p.iv);sl.set(p.sl);act.set(p.act);fl.set(p.fl);on.set(p.on);alarm.set(p.alarm);press.set(p.press);read.set(p.read);Q.set(p.Q);}
    U.button(br,"本文の例",function(){setp(_W02_P0);draw();});
    U.button(br,"フラッシュを眠らせ忘れる",function(){setp(_W02_P0);fl.set(1);draw();});
    U.button(br,"点灯を 150 ms にする",function(){setp(_W02_P0);on.set(150);draw();});
    U.button(br,"警報の表示が続く",function(){setp(_W02_P0);alarm.set(1);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var p={iv:iv.get(),sl:sl.get(),fl:fl.get(),act:act.get(),on:on.get(),alarm:alarm.get(),press:press.get(),read:read.get(),Q:Q.get()},b=_w02_budget(p);
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],n=b.it.length+1;
      var xb0=nar?150:196,xb1=nar?330:430,X=function(v){return xb0+(Math.log10(Math.max(v,1e-5))+4)/6*(xb1-xb0);},y0=30,rh=nar?19:21;
      o.push(S.T(8,16,"平均電流の内訳","start",10,"ink",true));
      [[1e-4,"0.0001"],[1e-2,"0.01"],[1,"1"],[100,"100"]].forEach(function(t){o.push(S.L(X(t[0]),y0-2,X(t[0]),y0+rh*n+2,"grid",1));o.push(S.T(X(t[0]),y0+rh*n+15,t[1],"middle",9.5,"muted"));});
      o.push(S.T((xb0+xb1)/2,y0+rh*n+30,"平均電流 [µA]（対数の目盛）","middle",9.5,"muted"));
      var mx=0,mk=0;b.it.forEach(function(r,k){if(r[4]>mx){mx=r[4];mk=k;}});
      b.it.concat([["合計","",0,0,b.tot]]).forEach(function(r,k){var y=y0+k*rh,last=k===n-1,c=last?"purple":(k===mk?"gold":"teal");
        o.push(S.T(xb0-6,y+14,r[1]?r[0]+" "+r[1]:r[0],"end",9.5,"ink",last||k===mk));
        o.push(S.RECT(xb0,y+3,Math.max(1,X(r[4])-xb0),rh-6,2,U.soft(c),c,1.1));
        o.push(S.T(X(r[4])+4,y+14,_w02_ua(r[4])+" µA","start",9.5,c,true,false,null,true));});
      var xl=X(b.lim);o.push(S.L(xl,y0-2,xl,y0+rh*n,"signal",1.6));o.push(S.T(xl-2,y0-6,"上限 "+_w02_f(b.lim,1)+" µA（1 年）","end",9.5,"signal",true,false,null,true));
      /* 電池寿命 */
      var lx=nar?20:470,ly=nar?y0+rh*n+64:46,lw=nar?340:200,Lmax=Math.max(6,Math.ceil(b.life/2)*2),XL=function(v){return lx+Math.min(v,Lmax)/Lmax*lw;},ok=b.life>=1;
      o.push(S.T(nar?8:460,ly-22,"電池寿命（Q = "+p.Q+" mAh）","start",10,"ink",true));
      o.push(S.RECT(lx,ly,Math.max(1,XL(b.life)-lx),24,3,U.soft(ok?"green":"alias"),ok?"green":"alias",1.3));
      var lt=(b.life>=1?_w02_f(b.life,1):_w02_f(b.life,2))+" 年",inside=XL(b.life)-lx>U.tw(lt,12)+12;
      o.push(S.L(XL(1),ly-8,XL(1),ly+30,"signal",1.6));o.push(S.L(XL(2),ly-8,XL(2),ly+30,"purple",1.3,"5 3"));
      o.push(S.T(inside?XL(b.life)-6:XL(b.life)+6,ly+17,lt,inside?"end":"start",12,ok?"green":"alias",true,false,null,!inside));
      o.push(S.L(lx,ly+30,lx+lw,ly+30,"muted",1));
      for(var v=0;v<=Lmax;v+=Lmax>10?4:2){o.push(S.L(XL(v),ly+30,XL(v),ly+34,"muted",1));o.push(S.T(XL(v),ly+46,String(v),"middle",9.5,"muted"));}
      o.push(S.T(lx+lw/2,ly+62,"電池寿命 [年]","middle",9.5,"muted"));
      o.push(S.LEGL(lx,ly+84,[["signal",null,"要求 1 年"],["purple","5 3","目標 2 年"]],9.5,12));
      o.push(S.T(lx,ly+106,"余裕（上限 ÷ 平均電流）"+_w02_f(b.lim/b.tot,1)+" 倍","start",10,ok?"ink":"alias",true));
      box.set(S.svg(Wd,nar?ly+116:Math.max(y0+rh*n+40,ly+116),o));
      var cond=(p.iv===10&&p.press===1&&p.read===1&&p.alarm===0);
      var h="平均電流 Ī = Σ I·d = <b>"+_w02_ua(b.tot)+" µA</b>、電池寿命 L = Q ÷ Ī = "+p.Q+" mAh ÷ "+_w02_ua(b.tot)+" µA = <b>"+_w02_h(b.tot>0?p.Q/(b.tot/1000):0)+" h = "+(b.life>=1?_w02_f(b.life,1):_w02_f(b.life,2))+" 年</b><br>";
      h+="上限 "+_w02_f(b.lim,1)+" µA（= Q ÷ 8760 h）に対する余裕 <b>"+_w02_f(b.lim/b.tot,1)+" 倍</b>。";
      if(cond)h+=(ok?(b.lim/b.tot>=2?'<span class="ok">SR-W02（1 年以上）を満たし、目標（余裕 2 倍）にも届く</span>':'<span class="ok">SR-W02 は満たす</span>が、目標の余裕 2 倍に届かない'):'<span class="warn">SR-W02（1 年以上）を満たさない</span>')+"<br>";
      else h+=(ok?"1 年以上もつ":'<span class="warn">1 年もたない</span>')+"。ただし、記録の間隔・短押し・読み出し・警報の表示のどれかが SR-W02 の使い方の条件と違うので、この寿命では SR-W02 の合否は決められない<br>";
      var slp=b.it[0][4]+b.it[4][4]+b.it[6][4],led=b.it[9][4]+b.it[10][4]+b.it[11][4];
      h+="最も大きい項目: <b>"+b.it[mk][0]+" "+b.it[mk][1]+"</b>（"+_w02_f(b.it[mk][4]/b.tot*100,1)+" %）。眠りの 3 つの合計 "+_w02_f(slp/b.tot*100,1)+" %、LED の表示の合計 "+_w02_f(led/b.tot*100,1)+" %<br>";
      ro.innerHTML=h+'<div class="wnote">本文の表と同じ計算。1 日のうち各状態にいる時間の割合 d に電流 I を掛けて足す。アドバタイズ 1 回は 5 mA で 2 ms（短押しのたびに 100 ms ごとを 2 分）、接続の間は時間の 20 % だけ無線が動く（平均 1 mA）、セクタの消去は 510 件ごとに 45 ms・10 mA とした。LED は 1 回 2 mA で、30 秒ごとの表示（記録中の表示は緑 1 回、続く警報の表示はそれに代わって赤 2 回）、受付中と接続中に 2 秒ごとの通信中の表示、短押しのたびの状態の応答で点く（どれも例の値）。眠りの割合は、1 日から動いている時間を引いて求めた。</div>';
    }
    draw();
  };

  /* ---- 5 節: 処理時間の予算 ---- */
  /* 優先度の固定した、割り込んで動く時間割（全部の処理が時刻 0 に起きる場合）。f02.py の _f02_sched と同じ計算 */
  function _w02_sched(tasks,tmax){var n=tasks.length,q=[],nxt=[],t=0,runs=[],jobs=[],i;for(i=0;i<n;i++){q.push([]);nxt.push(0);}
    var guard=0;
    while(t<tmax-1e-9&&guard++<100000){for(i=0;i<n;i++){while(nxt[i]<=t+1e-9){q[i].push([nxt[i],tasks[i].C]);nxt[i]+=tasks[i].T;}}
      var k=-1;for(i=0;i<n;i++)if(q[i].length){k=i;break;}
      var tn=Math.min(Math.min.apply(null,nxt),tmax);if(k<0){t=tn;continue;}
      var te=Math.min(t+q[k][0][1],tn),L=runs[runs.length-1],rl=q[k][0][0];
      if(L&&L[0]===k&&L[3]===rl&&Math.abs(L[2]-t)<1e-9)L[2]=te;else runs.push([k,t,te,rl]);
      q[k][0][1]-=te-t;if(q[k][0][1]<=1e-9){jobs.push([k,q[k][0][0],te]);q[k].shift();}t=te;}
    for(i=0;i<n;i++)q[i].forEach(function(j){jobs.push([i,j[0],null]);});
    return {runs:runs,jobs:jobs};}
  /* 最悪応答時間（応答時間解析）。上限を超えたら Infinity */
  function _w02_rta(tasks){return tasks.map(function(tk,i){var R=tk.C;for(var j=0;j<i;j++)R+=tasks[j].C;
    for(var it=0;it<10000;it++){var Rn=tk.C;for(var j2=0;j2<i;j2++)Rn+=Math.ceil(R/tasks[j2].T-1e-12)*tasks[j2].C;if(Math.abs(Rn-R)<1e-9)return Rn;R=Rn;if(R>1e7)return Infinity;}return Infinity;});}
  REG.w02_cpu=function(el,U){
    var S=U.S;
    U.head(el,"CPU BUDGET","処理時間の予算 — 周期と最悪実行時間から、時間割・利用率・締め切りを確かめる");
    var r1=U.ctrls(el);
    var ci=U.slider(r1,"接続の間隔",{values:[7.5,10,15,30,50],value:15,fmt:function(v){return v+" ms";},onInput:draw});
    var cR=U.slider(r1,"無線の処理の最悪実行時間",{min:0.5,max:5,step:0.1,value:2.0,fmt:function(v){return _w02_f(v,1)+" ms";},onInput:draw});
    var cD=U.slider(r1,"読み出しの用意の最悪実行時間",{min:1,max:15,step:0.5,value:6,fmt:function(v){return _w02_f(v,1)+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var tB=U.slider(r2,"ボタンを読む周期",{values:[1,2,5,10,20],value:5,fmt:function(v){return v+" ms";},onInput:draw});
    var cB=U.slider(r2,"ボタンを読む最悪実行時間",{min:0.05,max:1,step:0.05,value:0.1,fmt:function(v){return _w02_f(v,2)+" ms";},onInput:draw});
    var r3=U.ctrls(el);
    var wait=U.select(r3,"センサとフラッシュの待ち方",["眠って待つ（測定の CPU は 1.1 ms）","ビジーウェイトで待つ（CPU は 51.8 ms）"],0,draw);
    var ord=U.select(r3,"優先度の順",["周期の短い順（測定がいちばん低い）","測定を読み出しの用意より高くする"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){ci.set(15);cR.set(2.0);cD.set(6);tB.set(5);cB.set(0.1);wait.set(0);ord.set(0);draw();});
    U.button(br,"ビジーウェイトで、測定を高くする",function(){wait.set(1);ord.set(1);draw();});
    var box=U.svgbox(el),ro=U.readout(el),cols=["signal","gold","purple","teal"];
    function draw(){
      var Tc=ci.get(),tk=[{n:"無線の処理",T:Tc,C:cR.get(),D:Tc,why:"次の接続イベント"},{n:"ボタンを読む",T:tB.get(),C:cB.get(),D:tB.get(),why:"次の読み取り"},
        {n:"読み出しの用意",T:Tc,C:cD.get(),D:Tc,why:"次の接続イベント"},{n:"測定と記録",T:60000,C:wait.get()?51.8:1.1,D:2000,why:"SR-P03 の 2 秒"}];
      if(ord.get()===1){var m=tk[3];tk[3]=tk[2];tk[2]=m;}
      var ci0=tk.map(function(t){return ["無線の処理","ボタンを読む","読み出しの用意","測定と記録"].indexOf(t.n);});
      var R=_w02_rta(tk),U_=0;tk.forEach(function(t){U_+=t.C/t.T;});
      var Wn=75,sch=_w02_sched(tk,Wn),nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?92:132,x1=Wd-12,X=function(t){return x0+t/Wn*(x1-x0);},y0=24,rh=nar?28:30;
      o.push(S.T(8,15,"全部が時刻 0 に同時に起きた場合の時間割（上の行ほど優先度が高い）","start",nar?9:10,"ink",true));
      tk.forEach(function(t,i){var y=y0+i*rh,c=cols[ci0[i]];
        o.push(S.T(x0-6,y+15,t.n,"end",9.5,"ink",true));o.push(S.RECT(x0,y,x1-x0,22,0,"none","line",0.6));
        for(var r=0;r<=Wn+1e-9&&t.T<1000;r+=t.T)o.push(S.ARR(X(r),y+29,X(r),y+22,"muted",1,4));
        if(t.T>=1000)o.push(S.ARR(X(0),y+29,X(0),y+22,"muted",1,4));});
      var late={};sch.jobs.forEach(function(j){var t=tk[j[0]];if(j[2]===null?(j[1]+t.D<Wn):(j[2]>j[1]+t.D+1e-9))late[j[0]+":"+j[1]]=1;});
      sch.runs.forEach(function(r){var y=y0+r[0]*rh,bad=!!late[r[0]+":"+r[3]];
        var c=bad?"alias":cols[ci0[r[0]]];o.push(S.RECT(X(r[1]),y+2,Math.max(1.2,X(r[2])-X(r[1])),18,1,U.soft(c),c,1));});
      var ya=y0+4*rh+4;
      for(var v=0;v<=Wn;v+=nar?15:5){o.push(S.L(X(v),ya,X(v),ya+4,"muted",1));o.push(S.T(X(v),ya+15,String(v),"middle",9.5,"muted"));}
      o.push(S.T((x0+x1)/2,ya+30,"時間 [ms]（小さな矢印は、処理が起きる時刻。赤は締め切りに遅れた仕事）","middle",9.5,"muted"));
      /* 利用率 */
      var uy=ya+46,ux0=x0,ux1=x1,UX=function(u){return ux0+Math.min(u,1.2)/1.2*(ux1-ux0);};
      o.push(S.T(x0-6,uy+13,"利用率","end",9.5,"ink",true));
      o.push(S.RECT(ux0,uy,UX(U_)-ux0,18,2,U.soft(U_>1?"alias":(U_>0.7?"gold":"green")),U_>1?"alias":(U_>0.7?"gold":"green"),1.2));
      o.push(S.L(UX(0.7),uy-4,UX(0.7),uy+22,"purple",1.3,"5 3"));o.push(S.L(UX(1),uy-4,UX(1),uy+22,"alias",1.6));
      o.push(S.T(UX(0.7)-3,uy+34,"目標 70 %","end",9.5,"purple",true));o.push(S.T(UX(1)+3,uy+34,"100 %","start",9.5,"alias",true));
      o.push(S.T(Math.min(UX(U_)+4,UX(0.7)-80),uy+13,_w02_f(U_*100,1)+" %","start",10,"ink",true,false,null,true));
      box.set(S.svg(Wd,uy+42,o));
      var h="利用率 U = Σ C<sub>i</sub>/T<sub>i</sub> = "+tk.map(function(t){return _w02_f(t.C,t.C<1?2:1)+"/"+(t.T>=1000?"60000":t.T);}).join(" + ")+" = <b>"+_w02_f(U_,3)+"（"+_w02_f(U_*100,1)+" %）</b>"+(U_>1?'　<span class="warn">100 % を超えた。どう優先度を付けても間に合わない</span>':(U_>0.7?"　目標の 70 % を超えた":""))+"<br>";
      var anyLate=false;
      tk.forEach(function(t,i){var ok=R[i]<=t.D+1e-9;if(!ok)anyLate=true;
        h+=t.n+": 最悪応答時間 <b>"+(isFinite(R[i])?_w02_f(R[i],1)+" ms":"終わらない")+"</b>、締め切り "+(t.D>=1000?(t.D/1000)+" s":t.D+" ms")+"（"+t.why+"） → "+(ok?'<span class="ok">間に合う</span>':'<span class="warn">遅れる</span>')+"<br>";});
      if(anyLate&&R[ci0.indexOf(2)]>Tc)h+='<span class="warn">読み出しの用意が接続イベントに間に合わない回は、送るデータが無く、読み出しが遅れる（SR-P05）</span><br>';
      ro.innerHTML=h+'<div class="wnote">最悪応答時間は、優先度の高い処理に割り込まれる分を足す計算（応答時間解析）で求めた。測定の締め切りは、記録の時刻のずれ（SR-P03 の ±2 秒）から 2 秒とした。ビジーウェイトでは、センサの 5 ms・書き込みの 0.7 ms・消去の 45 ms の待ちも CPU を使い続ける。</div>';
    }
    draw();
  };

  /* ---- 6 節: 代案の比較 ---- */
  var _W02_TRC=["費用","ソフトウェアの手間","電池が抜けたときの強さ","手に入れやすさ","電力"],_W02_TRW=[35,20,20,15,10],
    _W02_TRA=[{n:"A 外付けの NOR フラッシュ",sh:"A NOR フラッシュ",s:[5,2,2,5,4],ok:true},{n:"B 外付けの FRAM",sh:"B FRAM",s:[1,5,4,3,5],ok:true},{n:"C マイコンの内蔵のフラッシュの空き",sh:"C 内蔵のフラッシュ",s:[5,3,2,5,5],ok:false}];
  REG.w02_trade=function(el,U){
    var S=U.S,cols=["signal","purple","teal","gold","muted"];
    U.head(el,"TRADE-OFF","代案の比較 — 重みを変えると、点数と選ぶ案が変わる");
    var r1=U.ctrls(el),sl=[];
    _W02_TRC.forEach(function(c,i){sl.push(U.slider(r1,"重み: "+c,{min:0,max:50,step:1,value:_W02_TRW[i],fmt:function(v){return String(v);},onInput:draw}));});
    var r2=U.ctrls(el);
    var must=U.checkbox(r2,"必須の条件（記録の記憶 410.6 KiB 以上）を満たさない案を外す",true,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){sl.forEach(function(s,i){s.set(_W02_TRW[i]);});must.set(true);draw();});
    U.button(br,"重みをそろえる（20 ずつ）",function(){sl.forEach(function(s){s.set(20);});draw();});
    U.button(br,"手間と強さを重くする",function(){[10,35,35,10,10].forEach(function(v,i){sl[i].set(v);});draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var w=sl.map(function(s){return s.get();}),sw=w.reduce(function(a,b){return a+b;},0),nar=_w02_nar(box),Wd=nar?400:700,o=[];
      var sc=_W02_TRA.map(function(a){return sw>0?a.s.reduce(function(acc,v,i){return acc+w[i]*v;},0)/sw*100:0;});
      var cand=_W02_TRA.map(function(a,i){return i;}).filter(function(i){return !must.get()||_W02_TRA[i].ok;});
      cand.sort(function(a,b){return sc[b]-sc[a];});var win=cand[0],sec=cand[1];
      /* 重みの割合 */
      var x0=nar?8:180,x1=Wd-14,y=24;
      o.push(S.T(8,16,"重みの割合","start",10,"ink",true));
      var xx=x0;w.forEach(function(v,i){var ww=sw>0?(x1-x0)*v/sw:0;o.push(S.RECT(xx,y,ww,16,0,U.soft(cols[i]),cols[i],1));if(ww>U.tw(String(v),9.5)+6)o.push(S.T(xx+ww/2,y+12,String(Math.round(v/sw*100)),"middle",9.5,cols[i],true));xx+=ww;});
      var lx=nar?8:180,ly=y+34;_W02_TRC.forEach(function(c,i){var t=c,tw_=U.tw(t,9.5)+22;if(lx+tw_>Wd-8){lx=nar?8:180;ly+=16;}o.push(S.RECT(lx,ly-9,10,10,2,U.soft(cols[i]),cols[i],1));o.push(S.T(lx+14,ly,t,"start",9.5,"muted"));lx+=tw_+6;});
      /* 案ごとの点数（観点ごとの寄与を積んだ棒） */
      var by=ly+22,bh=nar?40:34,bx0=nar?8:180,bx1=Wd-60,BX=function(v){return bx0+v/500*(bx1-bx0);};
      _W02_TRA.forEach(function(a,k){var yy=by+k*(bh+(nar?18:10)),out=must.get()&&!a.ok,isW=k===win;
        if(nar)o.push(S.T(8,yy-3,a.n,"start",9.5,isW?"green":(out?"muted":"ink"),true));else o.push(S.T(172,yy+bh/2-2,a.sh,"end",9.5,isW?"green":(out?"muted":"ink"),true));
        var xx2=bx0;a.s.forEach(function(s,i){var v=sw>0?w[i]*s/sw*100:0,ww=BX(v)-bx0;o.push(S.RECT(xx2,yy,ww,bh-12,0,U.soft(cols[i]),cols[i],1));xx2+=ww;});
        if(out)o.push(S.RECT(bx0-2,yy-3,bx1-bx0+4,bh-6,3,"var(--muted-soft)","none",0,null,' fill-opacity="0.85"'));
        o.push(S.T(xx2+4,yy+bh/2-2,_w02_f(sc[k],0)+" 点","start",10,isW?"green":(out?"muted":"ink"),true));
        if(out)o.push(S.T(bx0+6,yy+bh/2-2,"外した（記録の記憶が 280 KB しかない）","start",9.5,"alias",true));
        if(isW)o.push(S.RECT(bx0-3,yy-3,Math.max(BX(sc[k]),bx0+20)-bx0+6,bh-6,3,"none","green",2.2));});
      var yb=by+3*(bh+(nar?18:10));
      [0,100,200,300,400,500].forEach(function(v){o.push(S.L(BX(v),yb,BX(v),yb+4,"muted",1));o.push(S.T(BX(v),yb+15,String(v),"middle",9.5,"muted"));});
      o.push(S.T((bx0+bx1)/2,yb+29,"点数（重み × 評点の和。重みの合計を 100 にそろえる）","middle",9.5,"muted"));
      box.set(S.svg(Wd,yb+36,o));
      /* 読み出し */
      var h="点数: "+_W02_TRA.map(function(a,k){return a.n.charAt(0)+" <b>"+_w02_f(sc[k],0)+"</b>"+(must.get()&&!a.ok?"（外した）":"");}).join("・")+"<br>";
      h+='選ぶ案: <span class="ok">'+_W02_TRA[win].n+"</span>"+(sec!=null?"（次の "+_W02_TRA[sec].n.charAt(0)+" との差 "+_w02_f(sc[win]-sc[sec],0)+" 点）":"")+"<br>";
      if(!must.get()&&!_W02_TRA[win].ok)h+='<span class="warn">点数で選んだ '+_W02_TRA[win].n.charAt(0)+" は、必須の条件（SR-F04 の 410.6 KiB）を満たさない</span><br>";
      if(sec!=null){var A=_W02_TRA[win].s,B=_W02_TRA[sec].s,msg=[];
        _W02_TRC.forEach(function(c,i){var d=A[i]-B[i];if(d===0)return;var rest=0;for(var j=0;j<5;j++)if(j!==i)rest+=w[j]*(A[j]-B[j]);var ws=-rest/d;
          if(ws>0&&ws<50){msg.push(c+"の重みが "+_w02_f(ws,0)+(d>0?" を下回る":" を上回る"));}});
        h+=msg.length?"ほかの重みをそのままにすると、"+msg.join("か、")+"と、"+_W02_TRA[sec].n.charAt(0)+" が "+_W02_TRA[win].n.charAt(0)+" を上回る<br>":"どれか 1 つの重みを 0〜50 の中で変えても、選ぶ案は入れ替わらない<br>";}
      ro.innerHTML=h+'<div class="wnote">評点（1〜5）と事実は本文の図と同じ。点数 = Σ（重み × 評点）÷ 重みの合計 × 100 で、どの観点も 5 なら 500 点。</div>';
    }
    draw();
  };

  /* ===== 03 章 実例 システム仕様書（温湿度ロガー LG-SYS-001 版 1.0） ===== */
  /* 要求の表（4・5 節）と対応表（6 節）のデータ。$SP/s03/gen.py が本文の表と同じデータから書き出す */
  var _W03_REQ=[{"id":"SR-F01","c":"F","g":"表 4-1","t":"記録中は、記録の間隔ごとに温度と相対湿度を測定すること","why":"保管と輸送の間の温度と湿度の履歴を、後で確かめるため","src":"要求仕様書","m":"T","st":"ST-001","pt":"記録の間隔 10 分で 24 時間記録し、144 件の記録が 10 分ごとにあり、どの記録にも温度と湿度があること"},{"id":"SR-F02","c":"F","g":"表 4-1","t":"記録の間隔を 1〜60 分の範囲で 1 分きざみに設定できること（初期値は 10 分）","why":"品目と期間に合わせて間隔を選ぶため。初期値の 10 分は、ふつうの使い方の間隔","src":"要求仕様書","m":"T","st":"ST-002","pt":"1 分と 60 分を設定でき、0 分と 61 分は受け付けないこと。初期値が 10 分であること"},{"id":"SR-F03","c":"F","g":"表 4-1","t":"測定ごとに、時刻・温度・湿度・状態の印（警報・時刻未設定・電池少・測定異常）を 1 件の記録として保存すること","why":"1 件の記録だけで、いつ・何度で・何が起きていたかが分かるようにするため","src":"要求仕様書","m":"T","st":"ST-003","pt":"読み出した記録に時刻・温度・湿度と 4 つの印があること。センサの応答を止めたときの記録に測定異常の印が付くこと"},{"id":"SR-F04","c":"F","g":"表 4-1","t":"52 560 件（記録の間隔 10 分で 365 日分）以上の記録を保存できること","why":"1 年の保管の記録を、途中で読み出さずに残すため","src":"要求仕様書","m":"T","st":"ST-004","pt":"記録の間隔 1 分で 52 560 件（36.5 日）記録し、全部を読み出せること"},{"id":"SR-F05","c":"F","g":"表 4-1","t":"記録が記録の容量に達したときの動作を、「上書き」と「記録を止める」から設定できること（初期値は上書き）","why":"新しい記録を残したい使い方と、始めからの記録を残したい使い方があるため","src":"管理者への聞き取り","m":"T","st":"ST-005","pt":"容量に達した後、「上書き」では最も古い記録から置き換わって記録が続き、「記録を止める」では停止中になること。初期値が上書きであること"},{"id":"SR-F06","c":"F","g":"表 4-2","t":"ボタンの長押しで、記録を開始・停止できること","why":"アプリの無い場所でも、その場で開始・停止できるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-006","pt":"停止中に長押しすると記録中に、記録中に長押しすると停止中になること"},{"id":"SR-F07","c":"F","g":"表 4-2","t":"アプリから、記録を全部、または前回の読み出しより後に保存した分だけ読み出せること","why":"毎回全部を読むと時間がかかるので、新しい分だけを読めるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-007","pt":"全部の読み出しで全件を、差分の読み出しで前回の読み出しの後の記録だけを受け取ること。差分の読み出しを途中で切った後の差分の読み出しで、切れた読み出しの分も受け取ること"},{"id":"SR-F08","c":"F","g":"表 4-2","t":"接続されるたびに、ロガーの時計を、アプリから受け取った時刻に 1 秒以内の差で合わせること","why":"時計のずれ（SR-P04）が、使うたびに戻るようにするため","src":"要求仕様書","m":"T","st":"ST-008","pt":"ロガーの時計を 1 時間ずらしておき、接続した後のロガーの時計とアプリの時刻の差が 1 秒以内であること"},{"id":"SR-F09","c":"F","g":"表 4-2","t":"電池を入れてから最初に時刻を合わせるまでの記録には、時刻未設定の印を付けること","why":"時刻の正しくない記録を、正しい記録と取り違えないため","src":"要求仕様書","m":"T","st":"ST-009","pt":"電池を入れてから接続するまでの記録に時刻未設定の印があり、接続の後の記録には無いこと"},{"id":"SR-F10","c":"F","g":"表 4-3","t":"記録の温度が警報の上限より高いか、警報の下限より低いときは、その記録に警報の印を付けること（初期値は上限 8.0 °C・下限 2.0 °C）","why":"範囲を外れた記録を、後で見分けられるようにするため。初期値は冷蔵の医薬品の範囲","src":"要求仕様書","m":"T","st":"ST-010","pt":"上限と下限の前後の温度（上限 8.0 °C ちょうどは印なし、8.1 °C は印あり。下限も同じ）の記録で、警報の印が要求どおりに付くこと。初期値が 8.0 °C と 2.0 °C であること"},{"id":"SR-F11","c":"F","g":"表 4-3","t":"警報の表示は、アプリで記録を読み出した利用者が確認の操作をするまで続けること","why":"温度が一時だけ外れて戻ったときも、受け取った人が見逃さないため","src":"要求仕様書","m":"T","st":"ST-011","pt":"温度を上限の外へ出して戻した後も、確認の操作まで警報の表示が続き、確認の後に止まること"},{"id":"SR-F12","c":"F","g":"表 4-4","t":"アプリから、記録の間隔・容量に達したときの動作・警報の上限と下限を設定できること","why":"品目ごとに設定を変えるため","src":"管理者への聞き取り","m":"T","st":"ST-012","pt":"3 つの設定を、アプリからそれぞれ変えられること"},{"id":"SR-F13","c":"F","g":"表 4-4","t":"電池の残りが少ないことを、電池切れになる 14 日以上前（SR-W02 の使い方の条件で）に、LED とアプリで知らせること","why":"記録が途切れる前に電池を手配して替えるため（手配に 14 日）","src":"要求仕様書","m":"A","st":"ST-013","pt":"電池の残りを模擬して、電池少と判定する残りと電池切れになる残りを試験で求め、その差が SR-W02 の使い方の条件で 14 日以上に当たることを計算で示す"},{"id":"SR-F14","c":"F","g":"表 4-2","t":"アプリから、記録を開始・停止できること","why":"ロガーに触れずに（箱に入れたまま）開始・停止できるようにするため","src":"管理者への聞き取り","m":"T","st":"ST-014","pt":"接続中にアプリから開始と停止を指示し、主のモードがそのとおりに変わること"},{"id":"SR-F15","c":"F","g":"表 4-3","t":"警報の印を付けた記録を保存したときは、LED で知らせること（警報の表示。表 3-5）","why":"受け取った場所で、アプリが無くても範囲を外れたことが分かるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-015","pt":"警報の印の付く記録を保存した後、表 3-5 の警報の表示が始まること"},{"id":"SR-F16","c":"F","g":"表 4-3","t":"警報の上限と下限を、−20.0〜+60.0 °C の範囲で 0.1 °C きざみに設定できること","why":"品目ごとの保管の温度に合わせるため","src":"要求仕様書","m":"T","st":"ST-016","pt":"−20.0 °C と +60.0 °C を設定でき、−20.1 °C と +60.1 °C は受け付けないこと。0.1 °C きざみで設定できること"},{"id":"SR-F17","c":"F","g":"表 4-4","t":"アプリで設定した値を、電池を外した後も保持すること","why":"電池の交換で初期値に戻ると、気付かずに違う設定で記録するため","src":"管理者への聞き取り","m":"T","st":"ST-017","pt":"3 つの設定を変えてから電池を外して入れ直し、変えた値のままであること"},{"id":"SR-F18","c":"F","g":"表 4-2","t":"主のモードと通信の状態を、表 3-3 と表 3-4 のとおりに変えること","why":"状態と出来事のどの組み合わせでも、ロガーのすることを 1 つに決めておくため","src":"要求仕様書","m":"T","st":"ST-018","pt":"表 3-3 と表 3-4 の「—」以外のすべてのマスについて、その状態でその出来事を起こし、次の状態とそのときの動作が表のとおりであること"},{"id":"SR-U01","c":"U","g":"表 4-5","t":"ボタンは 1 個とし、短押し（1 秒未満）と長押し（3 秒以上）を区別すること","why":"部品と穴を減らし（SR-E03）、1 つのボタンで 2 つの操作をするため","src":"作業者への聞き取り","m":"T","st":"ST-019","pt":"ボタンが 1 個であること。0.5 秒押して離すと短押しとして、3.5 秒押すと 3 秒の時点で長押しとして扱うこと"},{"id":"SR-U02","c":"U","g":"表 4-5","t":"短押しで、今の状態を LED で示すこと（状態の応答。表 3-5）","why":"アプリが無くても、記録しているかをその場で確かめられるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-020","pt":"停止中と記録中のそれぞれで短押しし、表 3-5 の状態の応答が出ること"},{"id":"SR-U03","c":"U","g":"表 4-5","t":"LED の表示は、表 3-5 の表示と表 3-6 の決まり（重なるときの優先順位を含む）のとおりにすること","why":"説明書と試験で、表示の意味を同じにするため","src":"作業者への聞き取り","m":"T","st":"ST-021","pt":"表 3-5 の各行の表示と、表 3-6 の決まり（30 秒ごとの表示の選び方・重なったときに省く表示）が表のとおりであること"},{"id":"SR-U04","c":"U","g":"表 4-5","t":"長押しで記録を開始したら、緑を 3 回点滅させること","why":"開始を受け付けたことを、その場で確かめられるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-022","pt":"長押しで記録を開始したときに、緑を 3 回点滅すること"},{"id":"SR-U05","c":"U","g":"表 4-5","t":"1 秒以上 3 秒未満押して離したときは、押す前の主のモード・通信の状態・LED の表示のまま動作を続けること","why":"押し間違いで、記録の開始・停止や接続の受付をしないようにするため","src":"作業者への聞き取り","m":"T","st":"ST-023","pt":"1.5 秒押して離したとき、主のモード・通信の状態・LED の表示が変わらないこと"},{"id":"SR-U06","c":"U","g":"表 4-5","t":"短押しから 2 分間、アプリからの接続を受け付けること","why":"受け付ける時間を限り、電池を節約して、知らない相手から接続される機会を減らすため","src":"要求仕様書","m":"T","st":"ST-024","pt":"短押しから 1 分 50 秒後には接続でき、2 分 10 秒後には接続できないこと"},{"id":"SR-U07","c":"U","g":"表 4-5","t":"長押しで記録を停止したら、赤を 3 回点滅させること","why":"停止を受け付けたことを、その場で確かめられるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-025","pt":"長押しで記録を停止したときに、赤を 3 回点滅すること"},{"id":"SR-I01","c":"I","g":"表 4-6","t":"アプリとの通信は BLE（Bluetooth 4.2 以上の機能）で行うこと","why":"アプリを動かすスマートフォン（要求仕様書で決めた機種）が使える方式にするため","src":"要求仕様書","m":"I","st":"ST-026","pt":"無線の部分の資料と Bluetooth の認定の記録で、Bluetooth 4.2 以上の機能に対応していることを確かめる"},{"id":"SR-I02","c":"I","g":"表 4-6","t":"見通し 10 m の距離から、例のスマートフォンで接続し、記録を読み出せること","why":"倉庫の棚の上のロガーに、通路から接続できるようにするため","src":"要求仕様書","m":"T","st":"ST-027","pt":"見通し 10 m で、例のスマートフォンから接続し、記録を読み出せること"},{"id":"SR-I03","c":"I","g":"表 4-6","t":"アプリとやり取りするデータの形式は、LG-ICD-001 に従うこと","why":"ロガーとアプリを別の担当者が作っても、つながるようにするため","src":"要求仕様書","m":"T","st":"ST-028","pt":"試験用のアプリで LG-ICD-001 のすべてのやり取りを行い、データの形式が文書どおりであること"},{"id":"SR-P01","c":"P","g":"表 5-1","t":"温度の誤差は、0 °C 以上 40 °C 以下で ±0.5 °C 以内、−20 °C 以上 0 °C 未満と 40 °C より高く 60 °C 以下で ±1.0 °C 以内であること（分解能 0.1 °C）","why":"冷蔵（2〜8 °C）を含む範囲を厳しくして、保管の温度の判定に使えるようにするため","src":"要求仕様書","m":"T","st":"ST-029","pt":"恒温槽の −20・0・25・40・60 °C で基準の温度計と比べ、誤差がその温度の許容差以内であること。分解能が 0.1 °C であること"},{"id":"SR-P02","c":"P","g":"表 5-1","t":"25 °C・20〜80 %RH での湿度の誤差は、±3 %RH 以内であること（分解能 1 %RH）","why":"湿度は目安として記録するので、条件を 1 つに絞った","src":"要求仕様書","m":"T","st":"ST-030","pt":"25 °C の 20・50・80 %RH で基準の湿度計と比べ、誤差が ±3 %RH 以内であること"},{"id":"SR-P03","c":"P","g":"表 5-1","t":"各記録の時刻は、ロガーの時計で予定した測定の時刻から ±2 秒以内であること","why":"記録を、記録の間隔どおりに並んだ値として扱えるようにするため","src":"要求仕様書","m":"T","st":"ST-031","pt":"24 時間の記録で、各記録の時刻が予定の時刻から ±2 秒以内であること"},{"id":"SR-P04","c":"P","g":"表 5-1","t":"時刻を合わせてから 30 日後の時刻のずれは、25 °C で ±60 秒以内であること","why":"読み出しの間が最も長い使い方（30 日）でも、ほかの記録と時刻を比べられるようにするため","src":"要求仕様書","m":"T","st":"ST-032","pt":"時刻を合わせて 25 °C に 30 日置き、ロガーの時計と基準の時計の差が ±60 秒以内であること"},{"id":"SR-P05","c":"P","g":"表 5-1","t":"接続してから、記録 52 560 件の読み出しを 60 秒以内に終えること（例のスマートフォンで、見通し 2 m）","why":"受け取りの現場で、読み出しの待ち時間を 1 分以内にするため","src":"要求仕様書","m":"T","st":"ST-033","pt":"見通し 2 m で、例のスマートフォンが 52 560 件を、接続から 60 秒以内に読み出すこと"},{"id":"SR-P06","c":"P","g":"表 5-1","t":"短押しから 10 秒以内に、アプリが接続を始められること","why":"作業者が、待たずに読み出しを始められるようにするため","src":"作業者への聞き取り","m":"T","st":"ST-034","pt":"短押しから例のスマートフォンが接続を始めるまでの時間が、くり返したどの回も 10 秒以内であること"},{"id":"SR-W01","c":"W","g":"表 5-2","t":"電源はコイン形リチウム電池 CR2032 1 個とすること","why":"手に入りやすく、利用者が自分で替えられる電池にするため","src":"発注者","m":"I","st":"ST-035","pt":"電池の入れ物と部品表で、CR2032 1 個で動くことを確かめる"},{"id":"SR-W02","c":"W","g":"表 5-2","t":"次の使い方の条件で、新しい電池で 1 年以上記録を続けられること: 記録の間隔 10 分、周囲 25 °C、読み出しは 1 週間に 1 回（接続 1 分）、短押しは 1 日に 1 回、警報の表示は無い（警報の印が付かない上限と下限に設定する）、電池少の表示は電池少と判定してから電池切れまでの間だけ（SR-F13）","why":"1 年の間、電池を替えずに済むようにするため。条件が無いと電池寿命が決まらない。警報の表示と電池少の表示は、続く間の電流で電池寿命を縮める（どれだけかは LG-DES-001 で見積もる）","src":"要求仕様書","m":"A","st":"ST-036","pt":"状態ごとの電流を測り、使い方の条件の平均電流と電池の使える容量（LG-TST-001 で決める）から、1 年以上もつことを計算で示す"},{"id":"SR-W03","c":"W","g":"表 5-2","t":"利用者が工具を使わずに電池を交換できること","why":"現場で、利用者が自分で電池を替えられるようにするため","src":"作業者への聞き取り","m":"D","st":"ST-037","pt":"利用者が工具を使わずに電池を外し、新しい電池を入れられることを見せる"},{"id":"SR-W04","c":"W","g":"表 5-2","t":"電池を交換した後も、交換の前に保存した記録と設定を保持していること","why":"現場で電池を替えても、それまでの記録と設定を失わないため","src":"要求仕様書","m":"T","st":"ST-038","pt":"記録と設定のある状態で電池を外して入れ直し、記録と設定が変わっていないことをアプリで確かめる"},{"id":"SR-E01","c":"E","g":"表 5-3","t":"−20〜+60 °C・0〜95 %RH（結露しないこと）で、すべての要求を満たすこと","why":"冷凍の輸送から夏の車の中までの使われ方を見込むため","src":"要求仕様書","m":"T","st":"ST-039","pt":"−20 °C・+60 °C・95 %RH（結露なし）の中で、選んだ機能と性能の試験（選び方は LG-TST-001）に合格すること"},{"id":"SR-E02","c":"E","g":"表 5-3","t":"電池を外して −30〜+70 °C で保存した後に、すべての要求を満たすこと","why":"電池を外して倉庫に置く間と、運ぶ間の温度を見込むため","src":"要求仕様書","m":"T","st":"ST-040","pt":"電池を外して −30 °C と +70 °C に置いた後、選んだ機能と性能の試験に合格すること"},{"id":"SR-E03","c":"E","g":"表 5-3","t":"防塵・防水は IP54 相当とすること","why":"荷さばきの場所で、ほこりと水しぶきにさらされるため","src":"要求仕様書","m":"T","st":"ST-041","pt":"IP コード（IEC 60529）の IP54 の試験に合格すること"},{"id":"SR-E04","c":"E","g":"表 5-3","t":"高さ 1.0 m からコンクリートの床へ、6 面をそれぞれ 1 回落としても、記録を失わずに動き続けること","why":"荷の積み下ろしで落とすことがあるため","src":"要求仕様書","m":"T","st":"ST-042","pt":"1.0 m からコンクリートの床へ 6 面を 1 回ずつ落とした後、記録が残り、記録を続けていること"},{"id":"SR-R01","c":"R","g":"表 5-4","t":"電池を外しても、保存した記録を 10 年以上保持すること","why":"記録を保管する期間の決まりに合わせるため","src":"要求仕様書","m":"A","st":"ST-043","pt":"記録を保存する部品の資料にある保持の期間と、保存の温度から、10 年以上保持できることを示す"},{"id":"SR-R02","c":"R","g":"表 5-4","t":"読み出した記録に誤りがあれば、アプリがそれを検出できること（検出に使う情報の形式は LG-ICD-001）","why":"品質の証拠に使う記録なので、壊れた記録を正しい記録として使わないため","src":"要求仕様書","m":"T","st":"ST-044","pt":"読み出しの途中のデータの一部を試験用の装置で書き換え、アプリが誤りを検出すること"},{"id":"SR-R03","c":"R","g":"表 5-4","t":"ソフトウェアが止まったときは、10 秒以内に自動で、止まる前の主のモードの動作に戻ること","why":"止まったまま記録が途切れることを防ぐため","src":"要求仕様書","m":"T","st":"ST-045","pt":"試験用の手段でソフトウェアを止め、10 秒以内に、短押しに止まる前と同じ状態の応答を返すようになること"},{"id":"SR-R04","c":"R","g":"表 5-4","t":"記録の間隔 1 分で 5 年間使っても（電池は途中で交換してよい）、すべての要求を満たすこと","why":"最も短い記録の間隔でも、製品の寿命（5 年）の間使えるようにするため","src":"要求仕様書","m":"A","st":"ST-046","pt":"記録の間隔 1 分で 5 年分（2 628 000 件）を書いても、記録を保存する部品の書き換えの回数の上限に達しないことを計算で示す"},{"id":"SR-R05","c":"R","g":"表 5-4","t":"ソフトウェアが止まって戻った後も、止まる前に保存した記録と設定を保持していること","why":"止まるたびに記録や設定を失うと、品質の証拠が欠け、違う設定で記録するため","src":"要求仕様書","m":"T","st":"ST-047","pt":"SR-R03 の試験でソフトウェアを止めて戻した後、記録と設定が止まる前と同じであること"},{"id":"SR-S01","c":"S","g":"表 5-5","t":"設定の変更と記録の消去は、ロガーごとの 6 桁の PIN を知っているアプリからだけ受け付けること","why":"知らない人に設定を変えられたり、記録を消されたりしないため","src":"管理者への聞き取り","m":"T","st":"ST-048","pt":"PIN が無いときと違うときは設定の変更と記録の消去を受け付けず、正しいときだけ受け付けること"},{"id":"SR-S02","c":"S","g":"表 5-5","t":"日本の電波法の技術基準に適合すること","why":"日本で無線の機器として使うため","src":"電波法","m":"I","st":"ST-049","pt":"電波法の技術基準適合証明または工事設計認証の記録を確かめる"},{"id":"SR-C01","c":"C","g":"表 5-5","t":"大きさは 60 × 40 × 15 mm 以内、重さは電池を含めて 30 g 以下であること","why":"輸送の箱の隙間に入れるため","src":"発注者","m":"I","st":"ST-050","pt":"大きさが 60 × 40 × 15 mm 以内、電池を含めた重さが 30 g 以下であることを測って確かめる"},{"id":"SR-C02","c":"C","g":"表 5-5","t":"部品の費用は 1 台 1 500 円以下であること（月 1 000 台の生産で）","why":"販売の価格の目標から決めた","src":"発注者","m":"A","st":"ST-051","pt":"部品表と月 1 000 台の見積もりから、1 台の部品の費用が 1 500 円以下であることを示す"}];
  var _W03_CATN={"F":"機能","U":"操作と表示","I":"外部インタフェース","P":"性能","W":"電源","E":"環境","R":"信頼性","S":"安全とセキュリティ","C":"制約"};
  var _W03_CAP=52560;
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w03_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w03_f(v,d){v=+v;if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた整数（52 560 など） */
  function _w03_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
  /* ボタンの並びの頭に置く小さな見出し */
  function _w03_lab(row,t){var s=document.createElement("span");s.className="wnote";s.style.margin="0 .2rem 0 0";s.style.minWidth="4.5em";s.textContent=t;row.appendChild(s);}

  /* ---- 4 節: 記録の容量と、容量に達したときの動作（SR-F02・SR-F04・SR-F05） ---- */
  REG.w03_capacity=function(el,U){
    var S=U.S;
    U.head(el,"CAPACITY","記録の容量 — 記録の間隔と、容量に達したときの動作（SR-F02・SR-F04・SR-F05）");
    var r1=U.ctrls(el);
    var iv=U.slider(r1,"記録の間隔（SR-F02）",{min:1,max:60,step:1,value:10,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var rd=U.slider(r1,"読み出す日（記録を始めてから）",{min:0,max:1100,step:1,value:400,fmt:function(v){return v+" 日目";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var pol=U.seg(r2,["容量に達したら上書き（初期値）","容量に達したら記録を止める"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（10 分・上書き・400 日目）",function(){iv.set(10);rd.set(400);pol.set(0);draw();});
    U.button(br,"記録の間隔 1 分",function(){iv.set(1);draw();});
    U.button(br,"記録の間隔 60 分",function(){iv.set(60);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var v=iv.get(),per=1440/v,full=_W03_CAP/per,day=rd.get(),stop=pol.get()===1,nar=_w03_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?92:132,x1=Wd-16,Dm=Math.max(30,Math.max(day,full,365)*1.08),X=function(d){return x0+(x1-x0)*d/Dm;};
      var rows=[["記録した期間",42],["残っている記録",84]],kept0,kept1,lost0=null,lost1=null,gap0=null,gap1=null,recEnd;
      rows.forEach(function(r){o.push(S.T(nar?8:14,r[1]+5,r[0],"start",nar?9.5:10,"ink",true));});
      recEnd=stop?Math.min(day,full):day;
      if(stop){kept0=0;kept1=Math.min(day,full);if(day>full){gap0=full;gap1=day;}}
      else{kept0=Math.max(0,day-full);kept1=day;if(day>full){lost0=0;lost1=day-full;}}
      /* 1 段目: 記録した期間 */
      if(recEnd>0)o.push(S.RECT(X(0),33,X(recEnd)-X(0),16,3,U.soft("signal"),"signal",1.2));
      if(gap0!=null){o.push(S.RECT(X(gap0),33,X(gap1)-X(gap0),16,3,U.soft("alias"),"alias",1.2,"4 3"));
        if(X(gap1)-X(gap0)>70)o.push(S.T((X(gap0)+X(gap1))/2,45,"停止中","middle",9.5,"alias",true));}
      /* 2 段目: 読み出す日に残っている記録 */
      if(lost0!=null){o.push(S.RECT(X(lost0),75,X(lost1)-X(lost0),16,3,"var(--muted-soft)","muted",1,"3 3"));
        if(X(lost1)-X(lost0)>60)o.push(S.T((X(lost0)+X(lost1))/2,87,"上書きで消えた","middle",9.5,"muted",true));}
      if(kept1>kept0){o.push(S.RECT(X(kept0),75,X(kept1)-X(kept0),16,3,U.soft("green"),"green",1.3));
        if(X(kept1)-X(kept0)>90)o.push(S.T((X(kept0)+X(kept1))/2,87,"読み出せる記録","middle",9.5,"green",true));}
      if(gap0!=null){o.push(S.RECT(X(gap0),75,X(gap1)-X(gap0),16,3,U.soft("alias"),"alias",1,"4 3"));
        if(X(gap1)-X(gap0)>70)o.push(S.T((X(gap0)+X(gap1))/2,87,"記録が無い","middle",9.5,"alias",true));}
      /* 印: 容量に達する日・1 年・読み出す日 */
      var ya=110;
      o.push(S.L(X(full),24,X(full),ya,"gold",1.6,"5 3"));
      function cx(x,s){var w=U.tw(s,9.5);return Math.max(x0+w/2,Math.min(x1-w/2,x));}
      var lf="容量に達する "+_w03_f(full,1)+" 日目",ld="読み出す日 "+day+" 日目";
      o.push(S.T(cx(X(full),lf),ya+46,lf,"middle",9.5,"gold",true,false,null,true));
      if(Math.abs(X(365)-X(full))>4){o.push(S.L(X(365),24,X(365),ya,"faint",1.2,"2 3"));o.push(S.T(X(365),20,"1 年","middle",9.5,"muted",false,false,null,true));}
      o.push(S.L(X(day),24,X(day),ya,"ink",1.8));
      o.push(S.T(cx(X(day),ld),ya+30,ld,"middle",9.5,"ink",true,false,null,true));
      o.push(S.L(x0,ya,x1,ya,"muted",1));
      U.nice(0,Dm,nar?4:6).forEach(function(d){if(d>Dm)return;o.push(S.L(X(d),ya,X(d),ya+4,"muted",1));o.push(S.T(X(d),ya+15,String(d),"middle",9.5,"muted"));});
      o.push(S.T(x1,ya+62,"記録を始めてからの日数 [日]","end",9.5,"muted"));
      box.set(S.svg(Wd,ya+70,o));
      /* 読み出し */
      var n=Math.min(_W03_CAP,Math.round(day*per)),h="";
      h+="1 日の記録 = 1 440 分 ÷ 記録の間隔 "+v+" 分 = "+_w03_f(per,per%1?2:0)+" 件<br>";
      h+="容量に達するまで = 記録の容量 52 560 件 × "+v+" 分 = <b>"+_w03_f(full,1)+" 日</b>（記録 1 件が "+v+" 分を受け持つとして数えた）<br>";
      if(day<=full)h+=day+" 日目に読み出すと: 0〜"+day+" 日目の記録 <b>"+_w03_g(n)+" 件</b>が残っている（まだ容量に達していない）<br>";
      else if(stop)h+=day+" 日目に読み出すと: 0〜"+_w03_f(full,1)+" 日目の記録 <b>52 560 件</b>が残っている。<span class=\"warn\">"+_w03_f(full,1)+" 日目から停止中になり、"+_w03_f(day-full,1)+" 日分の記録が無い</span>（SR-F05 の「記録を止める」）<br>";
      else h+=day+" 日目に読み出すと: "+_w03_f(day-full,1)+"〜"+day+" 日目の記録 <b>52 560 件</b>が残っている。<span class=\"warn\">最初の "+_w03_f(day-full,1)+" 日分は上書きで消えた</span>（SR-F05 の「上書き」）<br>";
      h+="保存できる記録の長さ "+_w03_f(full,1)+" 日は 1 年（365 日）"+(full>=365-1e-9?'<span class="ok">以上</span>':'<span class="warn">より短い</span>')+"。1 年分を残せるのは、記録の間隔が 10 分以上のとき（SR-F04 の件数の決め方）";
      ro.innerHTML=h+'<div class="wnote">記録の容量は SR-F04 の下限の 52 560 件とした（実際の容量はこれ以上ならよい）。記録は開始の時刻に 1 件目を保存し、以後は記録の間隔ごとに保存する（表 3-3）。</div>';
    }
    draw();
  };

  /* ---- 4 節: 仕様書どおりに動くロガーの模型（表 3-3〜3-6） ---- */
  var _W03_MAINCOL=["長押し","アプリから開始","アプリから停止","記録の時刻","容量に達した","電池が尽きる","電池を入れ直す"];
  var _W03_MAINROW={stop:"停止中",rec:"記録中",dead:"電池切れ"};
  var _W03_MAINTXT={stop:["記録中へ ※","記録中へ ※","無視","—","—","電池切れへ","停止中のまま"],rec:["停止中へ","無視","停止中へ","1 件保存","上書き／停止中へ","電池切れへ","停止中へ"],dead:["無視","—","—","—","—","—","停止中へ"]};
  var _W03_COMMCOL=["短押し","アプリが接続","接続が切れる","2 分たつ","電池が尽きる","電池を入れ直す"];
  var _W03_COMMROW={none:"通信なし",adv:"接続の受付中",conn:"接続中"};
  var _W03_COMMTXT={none:["受付中へ（電池切れなら無視）","—","—","—","そのまま","そのまま"],adv:["2 分を数え直す","接続中へ・時刻合わせ","—","通信なしへ","通信なしへ","通信なしへ"],conn:["接続中のまま","—","通信なしへ","—","通信なしへ","通信なしへ"]};
  var _W03_PAT={start:"GGG",stop:"RRR",stR:"G",stS:"R",alarm:"RR",low:"RG",rec:"G",comm:"G"};
  var _W03_PRI={start:1,stop:1,stR:2,stS:2,alarm:3,low:4,rec:5,comm:6};
  var _W03_SHN={start:"開始",stop:"停止",stR:"状態",stS:"状態",alarm:"警報",low:"電池少",rec:"記録中",comm:""};
  REG.w03_device=function(el,U){
    var S=U.S,M=null;
    U.head(el,"LOGGER MODEL","仕様書どおりに動くロガーの模型 — 操作と、表 3-3〜3-6 のマス");
    var bA=U.btnrow(el);_w03_lab(bA,"ボタン");
    U.button(bA,"短押し（0.5 秒）",function(){act("short");});
    U.button(bA,"1.5 秒押す",function(){act("mid");});
    U.button(bA,"長押し（3 秒）",function(){act("long");});
    var bB=U.btnrow(el);_w03_lab(bB,"アプリ");
    U.button(bB,"接続する",function(){act("conn");});
    U.button(bB,"記録を開始",function(){act("astart");});
    U.button(bB,"記録を停止",function(){act("astop");});
    U.button(bB,"読み出して確認の操作",function(){act("read");});
    U.button(bB,"切断",function(){act("disc");});
    var bC=U.btnrow(el);_w03_lab(bC,"時間");
    var tick=U.ticker(function(){advance(0.1*spd.get(),false);draw();},100);
    U.button(bC,"再生",function(){tick.start();});
    U.button(bC,"止める",function(){tick.stop();});
    U.button(bC,"+10 秒",function(){advance(10,true);draw();});
    U.button(bC,"+2 分",function(){advance(120,true);draw();});
    U.button(bC,"+10 分",function(){advance(600,true);draw();});
    U.button(bC,"+1 日",function(){advance(86400,true);draw();});
    U.button(bC,"+30 日",function(){advance(30*86400,true);draw();});
    var bD=U.btnrow(el);_w03_lab(bD,"電池");
    U.button(bD,"電池の残りが少なくなる",function(){act("low");});
    U.button(bD,"電池が尽きる",function(){act("dead");});
    U.button(bD,"電池を入れ直す（替える）",function(){act("batt");});
    var r1=U.ctrls(el);
    var tmp=U.slider(r1,"周囲の温度",{min:-20,max:60,step:0.1,value:5,fmt:function(v){return _w03_f(v,1)+" °C";},onInput:function(){draw();}});
    var spd=U.select(r1,"再生の速さ",["実時間","10 倍","60 倍"],0,function(){});
    var spdv=[1,10,60];spd.get0=spd.get;spd.get=function(){return spdv[spd.get0()];};
    var r2=U.ctrls(el);
    var ivs=U.select(r2,"記録の間隔（設定）",["1 分","10 分（初期値）","60 分"],1,function(){var iv=ivv();if(M.mode==="rec"){M.next=(M.lastMeas!=null?M.lastMeas:M.t)+iv*60;if(M.next<=M.t)M.next=M.t+iv*60;}draw();});
    var pol=U.select(r2,"容量に達したときの動作（設定）",["上書き（初期値）","記録を止める"],0,function(){draw();});
    var r3=U.ctrls(el);
    var sens=U.checkbox(r3,"センサが応答しない（測定異常）",false,function(){draw();});
    var bE=U.btnrow(el);
    U.button(bE,"本文の例（電池を入れた直後）に戻す",function(){tick.stop();tmp.set(5);ivs.set(1);pol.set(0);sens.set(false);spd.input.value=0;reset();draw();});
    U.button(bE,"記録を容量の手前まで進める",function(){if(M.mode!=="rec"){note("記録中のときに使う（容量の手前 3 件まで記録を進める）");draw();return;}var need=_W03_CAP-3-M.count;if(need>0&&M.next!=null){advance(M.next+(need-1)*ivv()*60-M.t,true);}draw();});
    var box=U.svgbox(el),ro=U.readout(el),tb=U.mk("div");el.appendChild(tb);
    function ivv(){return [1,10,60][ivs.get()];}
    function reset(){M={t:0,ins:0,mode:"stop",comm:"none",advEnd:0,clock:false,next:null,lastMeas:null,count:0,total:0,over:0,lastRead:0,recent:[],unack:false,low:false,lowT:null,
      fl:[],shows:[],sid:0,alt:0,pm:null,pc:null,cm:null,cc:null,ev:"電池を入れた",lines:["主のモードは停止中、通信の状態は通信なし、時計は未設定から始まる（表 3-2）"],judge:null};}
    function note(s){M.ev="—";M.lines=[s];M.cm=null;M.cc=null;M.pm=null;M.pc=null;M.judge=null;}
    /* 表示（表 3-5・3-6）: 重なったら、優先順位の高い表示をし、低い表示はその回は省く */
    function show(nm,t){var pat=_W03_PAT[nm],pri=_W03_PRI[nm],dur=0.3*(pat.length-1)+0.02,i;
      for(i=0;i<M.shows.length;i++){var s=M.shows[i];if(s.t1<t-1e-6||s.t0>t+dur+1e-6)continue;if(s.pri<=pri)return false;}
      for(i=0;i<M.shows.length;i++){var s2=M.shows[i];if(s2.t1<t-1e-6||s2.t0>t+dur+1e-6)continue;M.fl=M.fl.filter(function(f){return !(f.s===s2.id&&f.t>=t-1e-9);});s2.cut=true;}
      var id=++M.sid;M.shows.push({id:id,t0:t,t1:t+dur,pri:pri,nm:nm});
      for(i=0;i<pat.length;i++)M.fl.push({t:t+0.3*i,c:pat.charAt(i)==="G"?"green":"alias",s:id});
      return true;}
    function prune(){var lim=M.t-60;M.fl=M.fl.filter(function(f){return f.t>=lim;});M.shows=M.shows.filter(function(s){return s.t1>=lim;});}
    function tick30(t){if(M.mode==="dead")return;if(M.unack&&M.low){show(M.alt%2===0?"alarm":"low",t);M.alt++;}else if(M.unack)show("alarm",t);else if(M.low)show("low",t);else if(M.mode==="rec")show("rec",t);}
    function tick2(t){if(M.mode!=="dead"&&M.comm!=="none")show("comm",t);}
    /* 記録を 1 件保存する（表 3-3: 記録中 × 記録の時刻） */
    function record(t){var T=tmp.get(),err=sens.get(),mk=[];
      if(!err&&(T>8.0+1e-9||T<2.0-1e-9))mk.push("警報");
      if(!M.clock)mk.push("時刻未設定");if(M.low)mk.push("電池少");if(err)mk.push("測定異常");
      M.total++;if(M.count<_W03_CAP)M.count++;else M.over++;
      if(mk.indexOf("警報")>=0)M.unack=true;
      M.recent.unshift({n:M.total,t:t,clk:M.clock,ins:M.ins,T:err?null:T,mk:mk});if(M.recent.length>6)M.recent.pop();
      M.lastMeas=t;
      if(M.count>=_W03_CAP&&M.over===0&&pol.get()===1){M.mode="stop";M.next=null;return "full";}
      return M.count>=_W03_CAP&&M.over===0?"fullover":"";}
    /* 時間を進める。表示は最後の 40 秒の分だけを作る */
    function advance(dt,user){var tEnd=M.t+dt,tFrom=tEnd-40,guard=0,nrec=0,nal=0,evd=false;
      while(guard++<200000){var best=null,bt=Infinity;
        if(M.mode==="rec"&&M.next!=null&&M.next<bt){bt=M.next;best="meas";}
        if(M.comm==="adv"&&M.advEnd<bt){bt=M.advEnd;best="adv";}
        if(M.mode!=="dead"&&(M.unack||M.low||M.mode==="rec")){var k=(Math.floor(M.t/30+1e-9)+1)*30;if(k<tFrom)k=Math.ceil(tFrom/30)*30;if(k<bt){bt=k;best="t30";}}
        if(M.mode!=="dead"&&M.comm!=="none"){var k2=(Math.floor(M.t/2+1e-9)+1)*2;if(k2<tFrom)k2=Math.ceil(tFrom/2)*2;if(k2<bt-1e-9){bt=k2;best="t2";}}
        if(best===null||bt>tEnd+1e-9)break;
        M.t=bt;
        if(best==="meas"){var r=record(bt);M.next=M.mode==="rec"?bt+ivv()*60:null;nrec++;if(M.recent[0].mk.indexOf("警報")>=0)nal++;if(r)evd=true;
          if(r==="full"){M.ev="容量に達した";M.pm="rec";M.cm=["rec",4];M.cc=null;M.lines=["表 3-3: 記録中 × 容量に達した → 「記録を止める」なので停止中へ（SR-F05）"];M.judge=null;}
          else if(r==="fullover"){M.ev="容量に達した";M.pm=null;M.cm=["rec",4];M.cc=null;M.lines=["表 3-3: 記録中 × 容量に達した → 「上書き」なので記録中のまま。次からは最も古い記録に上書きする（SR-F05）"];M.judge=null;}
          }
        else if(best==="adv"){evd=true;M.comm="none";M.ev="2 分たつ";M.pc="adv";M.cc=["adv",3];M.cm=null;M.pm=null;M.lines=["表 3-4: 接続の受付中 × 2 分たつ → 通信なしへ（SR-U06）"];M.judge=null;}
        else if(best==="t30"){tick30(bt);if(Math.abs(bt/2-Math.round(bt/2))<1e-9&&M.comm!=="none")tick2(bt);}
        else if(best==="t2")tick2(bt);
        
      }
      M.t=tEnd;prune();
      if(!evd&&(user||nrec>0)){var dl=dt>=86400?_w03_f(dt/86400,dt%86400?1:0)+" 日":(dt>=60?_w03_f(dt/60,dt%60?1:0)+" 分":_w03_f(dt,0)+" 秒");
        setEv(user?"時間を進めた（+"+dl+"）":"記録の時刻",nrec?["表 3-3: 記録中 × 記録の時刻 → 記録を 1 件保存する（SR-F01・SR-F03）。この間に "+_w03_g(nrec)+" 件"+(M.over?"（容量に達しているので、最も古い記録に上書き）":"")+(nal?"。うち "+_w03_g(nal)+" 件に警報の印（SR-F10）。警報の表示を続ける（SR-F15・SR-F11）":"")]:["この間に、表のマスに当たる出来事は無かった"],nrec?["rec",3]:null,null,null,null);}}
    function setEv(ev,lines,cm,cc,pm,pc){M.ev=ev;M.lines=lines;M.cm=cm;M.cc=cc;M.pm=pm;M.pc=pc;M.judge=null;}
    function act(a){var t=M.t,md=M.mode,cs=M.comm;
      if(a==="short"){
        if(md==="dead"){setEv("短押し（0.5 秒）",["表 3-4: 通信なし × 短押し → 主のモードが電池切れなので無視（SR-F18）。LED も点けない（表 3-5 の電池切れ）"],null,["none",0],null,null);return draw();}
        show(md==="rec"?"stR":"stS",t);
        var l=["LED: 状態の応答（"+(md==="rec"?"記録中なので緑を 1 回":"停止中なので赤を 1 回")+"。SR-U02・表 3-5）"];
        if(cs==="none"){M.comm="adv";M.advEnd=t+120;l.unshift("表 3-4: 通信なし × 短押し → 接続の受付中へ。2 分を数え始める（SR-U06）");}
        else if(cs==="adv"){M.advEnd=t+120;l.unshift("表 3-4: 接続の受付中 × 短押し → 2 分を数え直す（SR-U06）");}
        else l.unshift("表 3-4: 接続中 × 短押し → 接続中のまま（SR-F18）");
        setEv("短押し（0.5 秒）",l,null,[cs,0],null,cs);return draw();}
      if(a==="mid"){setEv("1.5 秒押して離す",["1 秒以上 3 秒未満の押し方では、押す前の主のモード・通信の状態・LED の表示のまま続ける（SR-U05）"],null,null,null,null);return draw();}
      if(a==="long"||a==="astart"||a==="astop"){
        var app=a!=="long",nm=a==="long"?"長押し（3 秒）":(a==="astart"?"アプリから開始":"アプリから停止"),col=a==="long"?0:(a==="astart"?1:2);
        if(app&&cs!=="conn"){note("アプリの操作は、接続中でないと送れない（まず短押しして、アプリから接続する）");return draw();}
        if(md==="dead"){setEv(nm,["表 3-3: 電池切れ × "+_W03_MAINCOL[col]+" → "+(app?"—（通信しないので起こらない）":"無視（SR-F18）")],["dead",col],null,null,null);return draw();}
        if(md==="stop"&&a!=="astop"){
          if(M.count>=_W03_CAP&&pol.get()===1){if(!app)show("stop",t);setEv(nm,["表 3-3: 停止中 × "+_W03_MAINCOL[col]+" ※ → 記録が容量に達していて「記録を止める」なので、開始しない（SR-F18）"+(app?"":"。停止の応答（赤を 3 回。SR-U07）")],["stop",col],null,null,null);return draw();}
          M.mode="rec";if(!app)show("start",t);var r=record(t);M.next=M.mode==="rec"?t+ivv()*60:null;
          setEv(nm,["表 3-3: 停止中 × "+_W03_MAINCOL[col]+" → 記録中へ。すぐに 1 件目を記録する（"+(app?"SR-F14":"SR-F06")+"）",app?"アプリの操作では LED の応答はしない":"LED: 開始の応答（緑を 3 回。SR-U04）"],["stop",col],null,"stop",null);return draw();}
        if(md==="stop"&&a==="astop"){setEv(nm,["表 3-3: 停止中 × アプリから停止 → 無視（SR-F18）"],["stop",2],null,null,null);return draw();}
        if(md==="rec"&&a==="astart"){setEv(nm,["表 3-3: 記録中 × アプリから開始 → 無視（SR-F18）"],["rec",1],null,null,null);return draw();}
        M.mode="stop";M.next=null;if(!app)show("stop",t);
        setEv(nm,["表 3-3: 記録中 × "+_W03_MAINCOL[col]+" → 停止中へ（"+(app?"SR-F14":"SR-F06")+"）",app?"アプリの操作では LED の応答はしない":"LED: 停止の応答（赤を 3 回。SR-U07）"],["rec",col],null,"rec",null);return draw();}
      if(a==="conn"){
        if(cs==="none"){setEv("アプリが接続しようとする",["表 3-4: 通信なし × アプリが接続 → —（受け付けていないので、アプリからは見えない）。まず短押しする"],null,["none",1],null,null);return draw();}
        if(cs==="conn"){note("すでに接続中");return draw();}
        M.comm="conn";M.clock=true;
        setEv("アプリが接続",["表 3-4: 接続の受付中 × アプリが接続 → 接続中へ。時刻を合わせる（SR-F08）。これより後の記録には時刻未設定の印を付けない（SR-F09）"],null,["adv",1],null,"adv");return draw();}
      if(a==="read"){
        if(cs!=="conn"){note("読み出しは接続中にだけできる（まず短押しして、アプリから接続する）");return draw();}
        var n=Math.min(M.total-M.lastRead,M.count),had=M.unack;M.lastRead=M.total;M.unack=false;
        setEv("読み出して確認の操作",["差分の読み出し: 前回の読み出しの後に保存した記録 "+_w03_g(n)+" 件（SR-F07）",had?"確認の操作で、警報の表示を止めた（SR-F11）。次に警報の印の付いた記録を保存すると、また表示する":"確認していない警報の印は無かった"],null,null,null,null);return draw();}
      if(a==="disc"){
        if(cs!=="conn"){note("接続していない");return draw();}
        M.comm="none";setEv("接続が切れる",["表 3-4: 接続中 × 接続が切れる → 通信なしへ（SR-F18）"],null,["conn",2],null,"conn");return draw();}
      if(a==="low"){
        if(md==="dead"){note("電池切れになっている");return draw();}
        if(M.low){note("すでに電池少と判定している");return draw();}
        M.low=true;M.lowT=t;setEv("電池の残りが少なくなる",["これより後の記録に電池少の印を付け、電池少の表示（赤と緑を 1 回ずつ、30 秒ごと）を始める（SR-F13・表 3-5）"],null,null,null,null);return draw();}
      if(a==="dead"){
        if(md==="dead"){note("すでに電池切れ");return draw();}
        M.mode="dead";M.next=null;M.comm="none";
        setEv("電池が尽きる",["表 3-3: "+_W03_MAINROW[md]+" × 電池が尽きる → 電池切れへ（SR-F18）","表 3-4: "+_W03_COMMROW[cs]+" × 電池が尽きる → "+(cs==="none"?"そのまま":"通信なしへ")+"（SR-F18）"],[md,5],[cs,4],md,cs==="none"?null:cs);
        if(!M.low)M.judge='<span class="warn">電池少を知らせずに記録が止まった。SR-F13 を満たさない</span>';
        else{var d=(t-M.lowT)/86400;M.judge=d>=14-1e-9?'<span class="ok">電池少を '+_w03_f(d,1)+' 日前に知らせた。SR-F13（14 日以上前）を満たす</span>':'<span class="warn">電池少から '+_w03_f(d,1)+' 日で記録が止まった。SR-F13（14 日以上前）を満たさない</span>';}
        return draw();}
      if(a==="batt"){
        M.mode="stop";M.next=null;M.comm="none";M.clock=false;M.low=false;M.lowT=null;M.ins=t;
        setEv("電池を入れ直す",["表 3-3: "+_W03_MAINROW[md]+" × 電池を入れ直す → 停止中"+(md==="stop"?"のまま":"へ")+"。時刻未設定にする（SR-F18）","記録 "+_w03_g(M.count)+" 件と設定"+(M.unack?"と、確認していない警報の印":"")+"は残る（SR-W04・SR-F17）"],[md,6],[cs,5],md==="stop"?null:md,cs==="none"?null:cs);return draw();}
    }
    function hms(s){s=Math.max(0,Math.floor(s+1e-6));var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),c=s%60;return (d?d+" 日 ":"")+h+":"+(m<10?"0":"")+m+":"+(c<10?"0":"")+c;}
    function clk(t,set,ins){if(!set)return "未設定（電池を入れてから "+hms(t-ins)+"）";var b=Date.UTC(2026,10,2,8,0,0)+t*1000,D=new Date(b);function z(v){return (v<10?"0":"")+v;}
      return D.getUTCFullYear()+"-"+z(D.getUTCMonth()+1)+"-"+z(D.getUTCDate())+" "+z(D.getUTCHours())+":"+z(D.getUTCMinutes())+":"+z(D.getUTCSeconds());}
    function stateBoxes(o,x,y,w,keys,names,cur,prev,nar){var n=keys.length,gap=nar?10:16,bw=(w-gap*(n-1))/n,pos={};
      keys.forEach(function(k,i){var bx=x+i*(bw+gap),on=k===cur,c=k==="dead"?"alias":"signal";pos[k]=bx+bw/2;
        o.push(S.RECT(bx,y,bw,26,12,on?c:U.soft(c),c,on?2:1.2));o.push(S.T(bx+bw/2,y+17,names[k],"middle",nar?9.5:10.5,on?"panel":c,true));});
      if(prev&&prev!==cur&&pos[prev]!=null){var a=pos[prev],b=pos[cur],yy=y+36;o.push(S.L(a,y+26,a,yy,"gold",1.6));o.push(S.L(a,yy,b,yy,"gold",1.6));o.push(S.ARR(b,yy,b,y+28,"gold",1.6,6));}}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],t=M.t;
      /* ロガーの絵 */
      var lx=nar?10:16,ly=14,lw=nar?110:150,lh=nar?80:96,since=Math.max(0.12,0.1*spd.get()),lit=null;
      M.fl.forEach(function(f){if(f.t<=t+1e-9&&f.t>t-since)lit=f.c;});
      o.push(S.RECT(lx,ly,lw,lh,14,U.soft("signal"),"signal",1.8));
      o.push(S.T(lx+12,ly+20,"ロガー","start",10.5,"signal",true));
      var ledx=lx+lw-28,ledy=ly+26;
      if(lit)o.push(S.CIRC(ledx,ledy,17,lit,0,U.soft(lit)));
      o.push(S.CIRC(ledx,ledy,10,lit||"muted",1.4,lit||"var(--screen)"));
      o.push(S.T(ledx,ledy+26,"LED","middle",9.5,"muted"));
      o.push(S.CIRC(lx+34,ly+lh-26,14,"signal",1.4,"var(--panel)"));o.push(S.T(lx+34,ly+lh-22,"ボタン","middle",8.5,"muted"));
      /* 状態の文字 */
      var sx=nar?132:184,sz=nar?9.5:10.5,lh2=nar?16:19,ys=ly+14;
      var cn=M.comm==="adv"?"接続の受付中（残り "+hms(M.advEnd-t).replace(/^0:/,"")+"）":_W03_COMMROW[M.comm];
      var st=[["主のモード",_W03_MAINROW[M.mode],M.mode==="dead"?"alias":"signal"],["通信の状態",cn,"signal"],["時計",clk(t,M.clock,M.ins),M.clock?"ink":"gold"],
        ["記録",_w03_g(M.count)+" 件（容量 52 560 件"+(M.over?"・上書き "+_w03_g(M.over)+" 件":"")+"）","ink"],["印・表示",(M.unack?"確認していない警報あり":"警報なし")+"・"+(M.low?"電池少":"電池は足りる"),M.unack||M.low?"alias":"green"]];
      st.forEach(function(r,i){o.push(S.T(sx,ys+i*lh2,r[0],"start",sz-1,"muted"));o.push(S.T(sx+(nar?62:72),ys+i*lh2,r[1],"start",sz,r[2],true));});
      /* LED の帯（最近の 30 秒） */
      var bx0=16,bx1=Wd-16,by=nar?132:140,X=function(tt){return bx1-(bx1-bx0)*(t-tt)/30;};
      o.push(S.T(bx0,by-6,"LED（最近の 30 秒。右端が今）","start",9.5,"ink",true));
      o.push(S.RECT(bx0,by,bx1-bx0,26,3,"var(--screen)","line",1));
      var labs=[];M.shows.slice().reverse().forEach(function(s){if(s.t0<t-30||s.t0>t+1e-9||!_W03_SHN[s.nm])return;if(!M.fl.some(function(f){return f.s===s.id;}))return;var x=X(s.t0);if(labs.some(function(q){return Math.abs(q-x)<32;}))return;labs.push(x);o.push(S.T(x,by+40,_W03_SHN[s.nm],"middle",9,"muted"));});
      M.fl.forEach(function(f){if(f.t<t-30||f.t>t+1e-9)return;var cm=M.shows.filter(function(s){return s.id===f.s;})[0],thin=cm&&cm.nm==="comm";o.push(S.RECT(X(f.t)-(thin?0.8:1.6),by+(thin?7:3),thin?1.6:3.2,thin?12:20,0.5,f.c,f.c,0));});
      [30,20,10,0].forEach(function(v){o.push(S.T(X(t-v),by+(labs.length?52:40),v?"−"+v+" 秒":"今",v===30?"start":(v===0?"end":"middle"),9,"muted"));});
      /* 2 つの状態（表 3-2） */
      var yb=by+(labs.length?66:56),hw=(Wd-32-(nar?0:24))/(nar?1:2);
      o.push(S.T(16,yb,"主のモード","start",9.5,"ink",true));
      stateBoxes(o,16,yb+6,hw,["stop","rec","dead"],_W03_MAINROW,M.mode,M.pm,nar);
      var xb=nar?16:16+hw+24,yb2=nar?yb+58:yb;
      o.push(S.T(xb,yb2,"通信の状態","start",9.5,"ink",true));
      stateBoxes(o,xb,yb2+6,hw,["none","adv","conn"],{none:"通信なし",adv:"受付中",conn:"接続中"},M.comm,M.pc,nar);
      box.set(S.svg(Wd,yb2+50,o));
      /* 読み出し */
      var h="<b>直前の出来事: "+M.ev+"</b><br>"+M.lines.join("<br>")+(M.judge?"<br>"+M.judge:"");
      ro.innerHTML=h+'<div class="wnote">1 回の点灯は短いので、帯では太く描いた。「+1 日」などで時間を大きく進めたときは、最後の 40 秒の表示だけを作る。設定は、アプリから PIN を入れて変えたとする（SR-S01）。時計は、接続のときにアプリの時刻（ここでは 2026-11-02 08:00 に電池を入れたとした時刻）に合わせる。</div>';
      /* 状態遷移表（使ったマスを色で示す） */
      function table(title,rows,cols,txt,cur,cell){var hd=['主のモード ＼ 出来事'];
        var hh='<div class="wnote" style="margin-top:.6rem"><b>'+title+'</b></div><div class="wtable"><table><thead><tr><th>'+(rows===_W03_MAINROW?"主のモード":"通信の状態")+'</th>'+cols.map(function(c){return '<th class="wrap" style="min-width:5.5em">'+c+'</th>';}).join("")+'</tr></thead><tbody>';
        Object.keys(rows).forEach(function(k){hh+='<tr><td style="'+(k===cur?'font-weight:700;color:var(--signal)':'')+'">'+(k===cur?"▶ ":"")+rows[k]+'</td>';
          txt[k].forEach(function(v,j){var on=cell&&cell[0]===k&&cell[1]===j;hh+='<td class="wrap" style="min-width:5.5em;'+(on?'background:var(--gold-soft);outline:2px solid var(--gold);font-weight:700':'')+'">'+v+'</td>';});hh+='</tr>';});
        return hh+'</tbody></table></div>';}
      var rec='<div class="wnote" style="margin-top:.6rem"><b>最近の記録（新しい順。SR-F03）</b></div>'+U.tbl(["番号","時刻","温度","湿度","状態の印"],M.recent.map(function(r){return [String(r.n),clk(r.t,r.clk,r.ins).replace("未設定（電池を入れてから ","未設定 +").replace("）",""),r.T==null?"—":_w03_f(r.T,1)+" °C",r.T==null?"—":"50 %RH",r.mk.length?r.mk.map(function(m){return '<span class="'+(m==="時刻未設定"?"":"warn")+'">'+m+'</span>';}).join("・"):"—"];}),["right","left","right","right","left"]);
      tb.innerHTML=table("表 3-3 主のモードの状態遷移表（※ は容量に達していて「記録を止める」なら開始しない）",_W03_MAINROW,_W03_MAINCOL,_W03_MAINTXT,M.mode,M.cm)+table("表 3-4 通信の状態の状態遷移表",_W03_COMMROW,_W03_COMMCOL,_W03_COMMTXT,M.comm,M.cc)+(M.recent.length?rec:"");
    }
    reset();draw();
  };

  /* ---- 6 節: 要求と試験の対応表（表 6-1） ---- */
  REG.w03_vtable=function(el,U){
    var S=U.S,MN={T:"試験",A:"解析",I:"検査",D:"実演"},cats=["F","U","I","P","W","E","R","S","C"];
    U.head(el,"VERIFICATION","要求と試験の対応 — 51 件の要求の検証の方法（表 6-1）");
    var r1=U.ctrls(el);
    var cs=U.select(r1,"区分",["全部"].concat(cats.map(function(c){return "SR-"+c+"（"+_W03_CATN[c]+"）";})),0,function(){draw();});
    var r2=U.ctrls(el);
    var ms=U.seg(r2,["全部の方法","T 試験","A 解析","I 検査","D 実演"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（SR-F10）",function(){cs.set(0);ms.set(0);sel="SR-F10";draw();});
    var box=U.svgbox(el),ro=U.readout(el),sel="SR-F10",HIT=[];
    U.ctl.drag(box,function(type,x,y){if(type!=="down")return false;var h=null;HIT.forEach(function(q){if(x>=q[0]&&x<=q[0]+q[2]&&y>=q[1]&&y<=q[1]+q[3])h=q[4];});if(h){sel=h;draw();}return false;});
    function match(r){var c=cs.get(),m=ms.get();return (c===0||r.c===cats[c-1])&&(m===0||r.m==="TAID".charAt(m-1));}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],lx=nar?8:14,cx0=nar?36:52,cw=nar?18.5:32,ch=nar?24:26,gap=nar?1.2:3,y0=30,cnt={T:0,A:0,I:0,D:0},n=0;
      HIT=[];
      o.push(S.T(lx,16,"要求の地図（行は区分、札の文字は検証の方法。札を押すと下に示す）","start",nar?9:10,"ink",true));
      if(!_W03_REQ.some(function(r){return r.id===sel&&match(r);})){var f=_W03_REQ.filter(match)[0];if(f)sel=f.id;}
      cats.forEach(function(c,i){var y=y0+i*(ch+gap+2),rs=_W03_REQ.filter(function(r){return r.c===c;});
        o.push(S.T(lx,y+ch*0.66,"SR-"+c,"start",nar?9.5:10.5,"signal",true));

        rs.forEach(function(r,j){var x=cx0+j*(cw+gap),on=match(r),me=r.id===sel;if(on){n++;cnt[r.m]++;}
          var col=on?"green":"faint",fill=on?(r.m==="T"?U.soft("green"):"var(--panel)"):"var(--screen)";
          o.push(S.RECT(x,y,cw,ch,4,fill,me?"gold":col,me?2.6:1.2,on&&r.m!=="T"?"3 2":null));
          o.push(S.T(x+cw/2,y+(nar?ch*0.62:11),nar?r.id.slice(4):r.id.slice(3),"middle",nar?8:9.5,on?"ink":"faint",true));
          if(!nar)o.push(S.T(x+cw/2,y+22,r.m,"middle",9,on?"green":"faint",true));
          HIT.push([x,y,cw,ch,r.id]);});});
      var yb=y0+9*(ch+gap+2)+8;
      o.push(S.RECT(lx,yb,14,12,3,U.soft("green"),"green",1.2));o.push(S.T(lx+20,yb+10,"試験（T）","start",9.5,"muted"));
      o.push(S.RECT(lx+(nar?86:100),yb,14,12,3,"var(--panel)","green",1.2,"3 2"));o.push(S.T(lx+(nar?106:120),yb+10,"解析・検査・実演（A・I・D）","start",9.5,"muted"));
      if(!nar)o.push(S.T(Wd-14,yb+10,"薄い札は、絞り込みの外","end",9.5,"muted"));
      box.set(S.svg(Wd,yb+20,o));
      var cur=_W03_REQ.filter(function(r){return r.id===sel;})[0],h="絞り込んだ要求 <b>"+n+" 件</b>（試験 "+cnt.T+"・解析 "+cnt.A+"・検査 "+cnt.I+"・実演 "+cnt.D+"）<br>";
      if(cur&&match(cur))h+="<b>"+cur.id+"</b>（"+_W03_CATN[cur.c]+"。"+cur.g+"）／ 検証の方法 <b>"+cur.m+" "+MN[cur.m]+"</b> ／ <b>"+cur.st+"</b><br>要求: "+cur.t+"<br>理由: "+cur.why+"（出典: "+cur.src+"）<br>確かめること（合格の基準）: "+cur.pt;
      else h+='<span class="warn">この区分には、この方法の要求が無い</span>';
      ro.innerHTML=h+'<div class="wnote">行の頭の文字は区分（F 機能・U 操作と表示・I 外部インタフェース・P 性能・W 電源・E 環境・R 信頼性・S 安全とセキュリティ・C 制約）。ST の番号は要求の ID の順に 1 件に 1 つ振った。どの札にも方法と ST があるので、試験の無い要求は無い。</div>';
    }
    draw();
  };

  /* ===== 04 章 実例 設計書（温湿度ロガー LG-DES-001） ===== */
  function _w04_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w04_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた整数（63 240 など） */
  function _w04_g(v){var s=String(Math.round(v)),neg=s.charAt(0)==="-";if(neg)s=s.slice(1);return (neg?"−":"")+s.replace(/\B(?=(\d{3})+(?!\d))/g," ");}
  function _w04_ua(v){if(v>=1)return _w04_f(v,2);if(v>=0.01)return _w04_f(v,3);return _w04_f(v,4);}
  function _w04_yr(L){return L>=1?_w04_f(L,1):_w04_f(L,2);}

  /* ---- 3 節: 記録用フラッシュのリングバッファと起動時の走査 ---- */
  var _W04_SPR=510,_W04_NS=126,_W04_CAPREQ=52560;
  REG.w04_flash=function(el,U){
    var S=U.S;
    U.head(el,"FLASH RING","記録用フラッシュ — リングバッファ・空きのセクタ・書きかけの記録と起動時の走査");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"容量に達したときの動作",["上書き（初期値）","記録を止める"],0,function(){if(mode.get()===0&&stopped){stopped=false;scanlog=[];msg='上書きの設定にしたので、記録を開始すれば、最も古いセクタを消して書き続ける';}draw();});
    var iv=U.slider(r1,"記録の間隔",{values:[1,10,60],value:10,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var b1=U.btnrow(el);
    U.button(b1,"+1 件",function(){add(1);});
    U.button(b1,"+1 日",function(){add(1440/iv.get());});
    U.button(b1,"+1 セクタ分（510 件）",function(){add(_W04_SPR);});
    U.button(b1,"+30 日",function(){add(30*1440/iv.get());});
    U.button(b1,"本文の例（空から）",function(){mode.set(0);iv.set(10);reset();draw();});
    var b2=U.btnrow(el);
    var pulls=[["記録の書き込み中に電池を抜く","rec"],["書き終わりの印の書き込み中に抜く","commit"],["空きのセクタの消去中に抜く","erase"],["セクタの頭の書き込み中に抜く","head"]];
    var pb=pulls.map(function(p){return U.button(b2,p[0],function(){pull(p[1]);});});
    var bin=U.button(b2,"電池を入れる（起動時の走査）",function(){boot();});
    var box=U.svgbox(el),ro=U.readout(el);
    var sec,cur,seq,stopped,off,msg,scanlog,erases,total,lastTorn;
    function reset(){sec=[];for(var k=0;k<_W04_NS;k++)sec.push({st:"erased",seq:-1,n:0,torn:{}});
      cur=0;seq=0;sec[0].st="open";sec[0].seq=0;stopped=false;off=false;msg="";scanlog=[];erases=[];for(var j=0;j<_W04_NS;j++)erases.push(0);total=0;lastTorn=null;}
    function held(){var n=0;sec.forEach(function(s){if(s.st==="open"||s.st==="full"){n+=s.n;for(var t in s.torn)if(s.torn.hasOwnProperty(t))n--;}});return n;}
    function nfull(){var n=0;sec.forEach(function(s){if(s.st==="full")n++;});return n;}
    /* 書いているセクタが満ちたときに、次のセクタへ移る。返り値 false なら止めた */
    function advance(interrupt){
      if(mode.get()===1&&nfull()+1>=_W04_NS-1){sec[cur].st="full";stopped=true;return false;}
      sec[cur].st="full";var nx=(cur+1)%_W04_NS;
      if(interrupt==="head"){sec[nx].st="bad";sec[nx].seq=-1;sec[nx].n=0;sec[nx].torn={};return "off";}
      cur=nx;seq++;sec[cur]={st:"open",seq:seq,n:0,torn:{}};
      var sp=(cur+1)%_W04_NS;
      if(sec[sp].st==="full"||sec[sp].st==="bad"){   /* 最も古いセクタを消して、空きのセクタにする */
        if(interrupt==="erase"){sec[sp].st="bad";sec[sp].n=0;sec[sp].torn={};return "off";}
        sec[sp]={st:"erased",seq:-1,n:0,torn:{}};erases[sp]++;}
      return true;}
    function add(n){if(off){msg='電池が抜けている。「電池を入れる」で起動する';draw();return;}
      n=Math.round(n);msg="";scanlog=[];
      for(var i=0;i<n;i++){if(stopped)break;
        if(sec[cur].n>=_W04_SPR){if(advance()===false)break;}
        sec[cur].n++;total++;}
      draw();}
    function pull(kind){if(off){msg='電池はもう抜けている';draw();return;}
      scanlog=[];
      if(stopped){msg='止める設定で容量に達して停止中なので、記録の書き込みも消去も頭の書き込みも起きない';draw();return;}
      if(kind==="rec"||kind==="commit"){
        if(sec[cur].n>=_W04_SPR){var a=advance();if(a===false){draw();return;}}
        sec[cur].torn[sec[cur].n]=kind;sec[cur].n++;total++;lastTorn=kind;
        msg=kind==="rec"?'記録 8 B を書いている途中で電池が抜けた。書き終わりの印（ビット 7）は 1 のまま':'書き終わりの印を書いている途中で電池が抜けた。記録の値はそろっているが、印は 1 のままかもしれない（悪いほうを描いた）';}
      else if(kind==="erase"){ /* 回り込むまで書き進め、最も古いセクタを消している所で抜く */
        if(mode.get()===1){msg='止める設定では、記録の領域の消去は起きない（125 セクタが満ちたら止める）';draw();return;}
        for(var g=0;g<300;g++){var need=_W04_SPR-sec[cur].n;sec[cur].n=_W04_SPR;total+=need;
          var sp2=(cur+2)%_W04_NS;
          if(sec[sp2].st==="full"||sec[sp2].st==="bad"){advance("erase");break;}
          if(advance()===false){draw();return;}}
        msg='回り込むまで書き進め、次のセクタへ移ってから最も古いセクタを消している途中で電池が抜けた（そのセクタは消し残しのまま）';}
      else{ /* 頭: 書いているセクタを満たし、次のセクタを開く所で抜く */
        var need2=_W04_SPR-sec[cur].n;sec[cur].n=_W04_SPR;total+=need2;
        if(advance("head")===false){draw();return;}
        msg='書いているセクタが満ち、次のセクタの頭（通し番号と CRC）を書いている途中で電池が抜けた';}
      off=true;draw();}
    function boot(){if(!off){msg='電池は入っている（走査はリセットのたびに行う。ここでは抜いた後に試す）';draw();return;}
      off=false;scanlog=[];
      /* ① 頭を読む */
      var best=-1,bi=-1;sec.forEach(function(s,k){if((s.st==="open"||s.st==="full")&&s.seq>best){best=s.seq;bi=k;}});
      scanlog.push("① 126 の頭を読み、通し番号の最も大きいセクタ "+bi+"（通し番号 "+best+"）を書いているセクタとした"+(sec.some(function(s){return s.st==="bad";})?"。頭の CRC が合わないセクタは数えない":""));
      cur=bi;seq=best;
      /* ② 書いているセクタを頭から読む */
      var s=sec[cur],nt=0;for(var t in s.torn)if(s.torn.hasOwnProperty(t))nt++;
      if(s.st==="full"){scanlog.push("② セクタ "+cur+" は満ちている。次のセクタを開く");}
      else scanlog.push("② セクタ "+cur+" を頭から読み、"+s.n+" 番目の場所から書く"+(nt?"（書き終わりの印が 1 の記録 "+nt+" 件は書きかけとして使わない）":""));
      /* ③ 空きのセクタ */
      var nx=(cur+1)%_W04_NS;
      if(s.st==="full"){
        if(sec[nx].st==="bad"){sec[nx]={st:"erased",seq:-1,n:0,torn:{}};erases[nx]++;scanlog.push("③ 次のセクタ "+nx+" は頭が壊れている（全部が FF でない）ので、消し直した");}
        s.st="full";var a=advance();scanlog.push("　 セクタ "+cur+" を通し番号 "+seq+" で開いた");}
      else{if(sec[nx].st==="bad"){sec[nx]={st:"erased",seq:-1,n:0,torn:{}};erases[nx]++;scanlog.push("③ 空きのセクタ "+nx+" に消し残しがあったので、消し直した");}
        else scanlog.push("③ 空きのセクタ "+nx+" は全部が FF");}
      scanlog.push("④ 設定の 2 面を読み、CRC の合う新しいほうを使う");
      msg='起動時の走査を終えた。電池を抜いた時点までに書き終えた記録は、すべて残っている（SR-W04）';
      draw();}
    function draw(){
      pb.forEach(function(b){b.disabled=off;});bin.disabled=!off;
      var nar=_w04_nar(box),Wd=nar?400:700,o=[],cols=nar?14:21,cw=nar?26:30,ch=nar?22:24,x0=nar?14:20,y0=26;
      o.push(S.T(x0,16,"記録の 126 セクタ（数字はセクタの番号。1 マス = 510 件）"+(off?"　電池が抜けている":""),"start",10,off?"alias":"ink",true));
      var oldest=-1,os=1e9;sec.forEach(function(s,k){if((s.st==="full"||s.st==="open")&&s.seq>=0&&s.seq<os&&s.n>0){os=s.seq;oldest=k;}});
      var spare=(cur+1)%_W04_NS;
      sec.forEach(function(s,k){var cx=x0+(k%cols)*cw,cy=y0+Math.floor(k/cols)*(ch+4),fill="panel",c="line",lw=1,col="muted";
        if(s.st==="full"){fill="var(--purple-soft)";c="purple";col="purple";}
        else if(s.st==="open"){fill="var(--screen)";c="purple";lw=2;col="purple";}
        else if(s.st==="bad"){fill="var(--alias-soft)";c="alias";col="alias";}
        else if(k===spare&&!stopped){fill="var(--green-soft)";c="green";col="green";}
        o.push(S.RECT(cx,cy,cw-3,ch,3,fill,c,lw));
        if(s.st==="open"&&s.n>0){var f=s.n/_W04_SPR;o.push(S.RECT(cx,cy+ch*(1-f),cw-3,ch*f,0,"purple","none",0));}
        var nt=0;for(var t in s.torn)if(s.torn.hasOwnProperty(t))nt++;
        if(nt)o.push(S.X(cx+(cw-3)/2,cy+ch/2,4,"alias",2));
        else o.push(S.T(cx+(cw-3)/2,cy+ch/2+3.5,String(k),"middle",8.5,s.st==="open"&&s.n/_W04_SPR>0.5?"screen":col,s.st==="open"));
        if(k===oldest&&s.st!=="open")o.push(S.RECT(cx,cy,cw-3,ch,3,"none","ink",2));});
      var yb=y0+Math.ceil(_W04_NS/cols)*(ch+4)+6;
      /* 凡例 */
      var lg=[["none","ink","最も古い"],["var(--purple-soft)","purple","満ちた"],["var(--screen)","purple","書いている"],["var(--green-soft)","green","空きのセクタ"],["var(--alias-soft)","alias","消し残し・頭が壊れた"],["panel","line","まだ使っていない"]],lx=x0;
      lg.push(["x","alias","書きかけの記録がある"]);
      lg.forEach(function(g){var wi=15+U.tw(g[2],9);if(lx>x0&&lx+wi>Wd-8){lx=x0;yb+=16;}
        if(g[0]==="x")o.push(S.X(lx+5.5,yb+5.5,4,"alias",2));else o.push(S.RECT(lx,yb,11,11,2,g[0],g[1],1));
        o.push(S.T(lx+15,yb+9.5,g[2],"start",9,"muted"));lx+=wi+14;});
      yb+=24;
      /* 書いているセクタの終わりの拡大 */
      var s=sec[cur],m=Math.max(0,Math.min(s.n-5,_W04_SPR-8));
      o.push(S.T(x0,yb+10,"書いているセクタ "+cur+" の "+m+"〜"+(m+7)+" 番目の場所","start",9.5,"ink",true));
      for(var j=0;j<8;j++){var idx=m+j,x=x0+j*(nar?46:62),st=idx<s.n?(s.torn[idx]?"書きかけ":"記録"):"FF",c2=st==="記録"?"purple":(st==="FF"?"muted":"alias");
        o.push(S.RECT(x,yb+16,(nar?42:58),20,3,st==="FF"?"panel":U.soft(c2),c2,1));o.push(S.T(x+(nar?21:29),yb+30,st,"middle",9,c2,true));
        if(idx===s.n&&!off&&!stopped)o.push(S.ARR(x+(nar?21:29),yb+52,x+(nar?21:29),yb+38,"green",1.4,6));}
      var H=yb+60;
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var n=held(),days=n*iv.get()/1440,mx=Math.max.apply(null,erases),tot=0;erases.forEach(function(e){tot+=e;});
      var h="保存している記録: <b>"+_w04_g(n)+" 件</b>（記録の間隔 "+iv.get()+" 分で "+_w04_f(days,1)+" 日分）。書いた記録の合計 "+_w04_g(total)+" 件<br>";
      h+="SR-F04（52 560 件）: "+(n>=_W04_CAPREQ?'<span class="ok">保存している件数が 52 560 件以上</span>':(total>=63750?'<span class="warn">52 560 件より少ない</span>':"まだ容量に達していない（上書きのとき、満ちた後は 63 240〜63 750 件を保つ）"))+"<br>";
      h+="セクタの消去: 合計 "+_w04_g(tot)+" 回、1 セクタで最も多いのは "+mx+" 回（書き換えの上限 10 万回）<br>";
      if(stopped)h+='<span class="warn">止める設定で 125 セクタ（63 750 件）が満ちたので、REC_FULL を返して停止中になった（SR-F05）</span>。記録を続けるには、読み出してから記録を消す<br>';
      if(msg)h+=(off?'<span class="warn">'+msg+'</span>':msg)+"<br>";
      if(scanlog.length)h+=scanlog.join("<br>")+"<br>";
      ro.innerHTML=h+'<div class="wnote">1 マスは記録用フラッシュの 1 セクタ（4 KiB）で、頭の 16 B と記録 510 件が入る。書いているセクタの次は、いつも消しておく（空きのセクタ）。「+30 日」は記録の間隔で件数が変わる（10 分なら 4 320 件、1 分なら 43 200 件）。電池を抜いた後は、「電池を入れる」で起動時の走査（図 3-3 の ①〜④）を行う。</div>';
    }
    reset();draw();
  };

  /* ---- 4 節: 測定 1 回の時間割と電流 ---- */
  REG.w04_seq=function(el,U){
    var S=U.S;
    U.head(el,"ONE MEASUREMENT","測定 1 回の時間割と電流 — 1 回に電池から流れ出る電荷");
    var r1=U.ctrls(el);
    var ts=U.slider(r1,"センサの測定の時間",{values:[1.6,5,12.5],value:5,fmt:function(v){return v+" ms";},onInput:function(){draw();}});
    var wait=U.select(r1,"測る間のマイコン",["眠って待つ（2 µA）","起きたまま待つ（3 mA）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var wr=U.select(r2,"記録の書き方",["1 件ずつ書く（本文の設計）","32 件をまとめて書く"],0,function(){draw();});
    var cm=U.select(r2,"書き終わりの印",["書く（本文の設計）","書かない"],0,function(){draw();});
    var ov=U.select(r2,"この回に重なる処理",["なし","セクタの消去（510 回に 1 回）","電池の電圧の測定（1 時間に 1 回）"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){ts.set(5);wait.set(0);wr.set(0);cm.set(0);ov.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 区間: [始め, 終わり, 部品, 状態, 電流 mA] */
    function segs(p){var t=p.ts,o=[],w0=0.3,rd=0.4,tx=0.3,pw=0.7,fin=0.1;
      o.push([0,w0,"mcu","動作",3.0]);
      o.push([w0,w0+t,"mcu",p.awake?"待つ":"眠り",p.awake?3.0:0.002]);
      o.push([w0,w0+t,"sen","測る",0.3]);
      var a=w0+t;o.push([a,a+rd,"mcu","動作",3.0]);a+=rd;
      if(p.write){o.push([a,a+tx,"mcu","動作",3.0]);o.push([a,a+tx,"fla","受ける",0.025]);a+=tx;
        o.push([a,a+pw,"mcu","眠り",0.002]);o.push([a,a+pw,"fla","書く",5.0]);a+=pw;
        o.push([a,a+fin,"mcu","動作",3.0]);
        if(p.commit){o.push([a+0.02,a+0.07,"fla","印",5.0]);o.push([a,a+0.02,"fla","受ける",0.025]);o.push([a+0.07,a+fin,"fla","受ける",0.025]);}
        else o.push([a,a+fin,"fla","受ける",0.025]);
        a+=fin;}
      else{o.push([a,a+0.1,"mcu","動作",3.0]);a+=0.1;}
      if(p.ov===1){o.push([a,a+45,"fla","消去",10.0]);o.push([a,a+45,"mcu","眠り",0.002]);a+=45;}
      if(p.ov===2){o.push([a,a+1,"mcu","動作",3.0]);o.push([a,a+1,"bat","試しの負荷",8.0]);a+=1;}
      return {s:o,end:a};}
    /* 動作の電荷（眠りと待機を除く）[µC] */
    function charge(sg){var q=0;sg.forEach(function(g){if(g[4]>=0.1)q+=g[4]*(g[1]-g[0]);});return q;}
    function draw(){
      var p={ts:ts.get(),awake:wait.get()===1,write:wr.get()===0,commit:cm.get()===0,ov:ov.get()};
      var R=segs(p),q=charge(R.s);
      /* 平均（1 回あたり）: まとめて書くなら書き込みは 32 回に 1 回、消去は 510 回に 1 回、電池の測定は 6 回に 1 回 */
      var pn={ts:p.ts,awake:p.awake,write:true,commit:p.commit,ov:0},qw=charge(segs(pn).s);
      var pnw={ts:p.ts,awake:p.awake,write:false,commit:p.commit,ov:0},qn=charge(segs(pnw).s);
      var batch=wr.get()===1,qavg=(batch?(qn*31+qw)/32:qw)+450/_W04_SPR,save=batch?31*(qw-qn)/32:0;
      var q0=3.3+1.5+3.5+0.25+450/_W04_SPR;     /* 本文の設計の 1 回あたり 9.43 µC */
      var base=4.1714,dI=(qavg-q0)*144/86400,Itot=base+dI,L=180/(Itot/1000)/8760;
      var nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* 時間の軸: 長い区間（5 ms を超える）は縮めて描く */
      var cap=5.5,pts=[],tl=[];R.s.forEach(function(g){pts.push(g[0]);pts.push(g[1]);});pts.push(-0.4);pts=pts.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
      var map=[[pts[0],0]];for(var i=1;i<pts.length;i++){var d=pts[i]-pts[i-1],dd=d>cap?cap:d;map.push([pts[i],map[i-1][1]+dd]);if(d>cap)tl.push([pts[i-1],pts[i]]);}
      var tot=map[map.length-1][1]+0.6,x0=nar?78:100,x1=Wd-14;
      function X(t){if(t<=map[0][0])return x0;for(var i=1;i<map.length;i++){if(t<=map[i][0]){var a=map[i-1],b=map[i],f=(t-a[0])/(b[0]-a[0]||1);return x0+(a[1]+f*(b[1]-a[1]))/tot*(x1-x0);}}return x0+(map[map.length-1][1]+(t-map[map.length-1][0]))/tot*(x1-x0);}
      var rows=[["mcu","マイコン","purple",34],["sen","センサ","teal",62],["fla","フラッシュ","teal",90],["bat","電圧を測る","gold",118]];
      o.push(S.T(8,16,"時間割（記録の時刻を 0 とする。≈ の区間は縮めて描いた）","start",10,"ink",true));
      rows.forEach(function(r){o.push(S.T(x0-6,r[3]+13,r[1],"end",9.5,"ink",true));o.push(S.RECT(x0,r[3],x1-x0,18,2,"panel","line",0.6));});
      R.s.forEach(function(g){var r=rows.filter(function(q){return q[0]===g[2];})[0],on=g[4]>=0.02,c=r[2];
        o.push(S.RECT(X(g[0]),r[3],Math.max(1,X(g[1])-X(g[0])),18,2,on?U.soft(c):"panel",on?c:"line",1));
        if(on&&X(g[1])-X(g[0])>U.tw(g[3],9)+4)o.push(S.T((X(g[0])+X(g[1]))/2,r[3]+13,g[3],"middle",9,c,true));});
      tl.forEach(function(b){var xm=(X(b[0])+X(b[1]))/2;o.push(S.T(xm,30,"≈ "+_w04_f(b[1]-b[0],b[1]-b[0]>=10?0:1)+" ms","middle",9,"muted",true,false,null,true));});
      /* 電流（対数の目盛） */
      var yp=172,hp=nar?96:110,P=U.plot(x0,yp,x1-x0,hp,[0,1],[0.001,20],{ylog:true});
      [0.001,0.01,0.1,1,10].forEach(function(v){o.push(S.L(x0,P.Y(v),x1,P.Y(v),"grid",1));o.push(S.T(x0-6,P.Y(v)+3,v>=1?v+" mA":(v*1000)+" µA","end",9,"muted"));});
      var ev=[];R.s.forEach(function(g){ev.push(g[0]);ev.push(g[1]);});ev.push(-0.4);ev.push(R.end+0.5);ev=ev.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
      var sp=[];for(var k=0;k<ev.length-1;k++){var tm=(ev[k]+ev[k+1])/2,I=0.0025;R.s.forEach(function(g){if(tm>=g[0]&&tm<g[1]&&g[4]>=0.02)I+=g[4];});
sp.push([X(ev[k]),P.Y(I)]);sp.push([X(ev[k+1]),P.Y(I)]);}
      o.push(S.PL(sp,"signal",2));
      o.push(S.L(x0,yp+hp,x1,yp+hp,"muted",1.2));
      o.push(S.T(8,yp-14,"電流の合計（対数の目盛）","start",10,"ink",true));
      var H=yp+hp+18;
      box.set(S.svg(Wd,H,o));
      var h="この回の動作の電荷: <b>"+_w04_f(q,2)+" µC</b>"+(batch?"（まとめて書くとき、32 回のうち書かない 31 回の 1 回）":"（0.1 mA 以上の動作。本文の設計のふつうの回は 8.55 µC）")+"<br>";
      h+="1 回あたりの平均: <b>"+_w04_f(qavg,2)+" µC</b>（消去 450 µC を 510 回に割り振った "+_w04_f(450/_W04_SPR,2)+" µC を含む"+(batch?"。書き込みは 32 回に 1 回":"")+"。本文の設計は 9.43 µC）<br>";
      h+="1 日（144 回）: "+_w04_g(qavg*144)+" µC。平均電流は"+(Math.abs(dI)<0.00005?"本文と同じ "+_w04_ua(Itot)+" µA":"本文の 4.17 µA から "+(dI>=0?"+":"−")+_w04_ua(Math.abs(dI))+" µA で "+_w04_ua(Itot)+" µA")+"、電池寿命 "+_w04_yr(L)+" 年<br>";
      if(p.ov===1)h+="消去の回は、消去だけで 450 µC（ふつうの回の "+_w04_f(450/8.55,0)+" 倍）。それでも 510 回に 1 回なので、1 回あたりでは 0.88 µC<br>";
      if(p.ov===2)h+="電池の電圧の測定は、試しの負荷 8 mA とマイコン 3 mA を 1 ms（11 µC）。1 時間に 1 回なので平均電流では 0.003 µA<br>";
      if(p.awake)h+='<span class="warn">測る間も起きていると、1 回に '+_w04_f(3*p.ts,1)+' µC 増える</span>（センサの測定の時間 × 3 mA）<br>';
      if(batch)h+='<span class="warn">まとめて書くと、1 回あたり '+_w04_f(save,2)+' µC 減るが、平均電流では '+_w04_ua(save*144/86400)+' µA（'+_w04_f(save*144/86400/base*100,1)+' %）にすぎない。電池を抜くと、まだ書いていない最大 31 件を失う（SR-W04・SR-R05 を満たさない）</span><br>';
      if(!p.commit)h+='<span class="warn">書き終わりの印を書かないと、書いている途中で電池が抜けた記録を、起動時の走査で見分けられない</span>（減る電荷は 1 回 0.25 µC）<br>';
      ro.innerHTML=h+'<div class="wnote">電流は例の値: マイコン 動作 3 mA・眠り 2 µA、センサ 測定 0.3 mA、フラッシュ 書き込み 5 mA・受ける 25 µA・消去 10 mA、試しの負荷 8 mA。眠りの電流（合わせて 2.55 µA）は、1 回の電荷に入れずに 5.1 の予算の眠りの行で数える。</div>';
    }
    draw();
  };

  /* ---- 5 節: 電力の予算（s04/check.py の budget と同じ計算） ---- */
  var _W04_DAY=86400;
  function _w04_budget(p){
    var nM=1440/p.iv,tAct=p.act*1e-3*nM,tAdv=p.adv===0?p.press*(p.win/0.1)*2e-3:(p.adv===1?_W04_DAY/1*2e-3:_W04_DAY/0.1*2e-3),tConn=p.read/7*60*0.2;
    var tSen=5e-3*nM,tWr=0.7e-3*nM,tCm=0.05e-3*nM,tEr=45e-3*nM/510,ton=p.on*1e-3;
    var n30=_W04_DAY/30*((p.alarm||p.low)?2:1),ncom=(p.press*p.win+p.read/7*60)/2,nst=p.press,tDisp=(n30+ncom+nst)*0.01e-3,tBat=24e-3;
    var it=[["マイコン","眠り",p.sl*1e-3,_W04_DAY-(tAct+tAdv+tConn+tDisp+tBat)],["マイコン","動作（測定と記録）",3.0,tAct],["マイコン","動作（表示を始める）＊",3.0,tDisp],
      ["マイコン","動作（電池の電圧を測る）＊",3.0,tBat],["マイコン","送信（受付）",5.0,tAdv],["マイコン","送信（接続）",5.0,tConn],
      ["センサ","待機",0.05e-3,_W04_DAY-tSen],["センサ","測定",0.3,tSen],["フラッシュ","眠り",0.5e-3,_W04_DAY-(tWr+tCm+tEr)],["フラッシュ","書き込み（記録）",5.0,tWr],
      ["フラッシュ","書き込み（印）＊",5.0,tCm],["フラッシュ","消去",10.0,tEr],["電圧を測る回路","試しの負荷＊",8.0,tBat],
      ["LED",p.alarm?"警報の表示":(p.low?"電池少の表示":"記録中の表示"),2.0,n30*ton],["LED","通信中の表示",2.0,ncom*ton],["LED","状態の応答",2.0,nst*ton]];
    var tot=0;it.forEach(function(r){r.push(r[2]*r[3]/_W04_DAY*1000);tot+=r[4];});
    return {it:it,tot:tot,lim:180/8760*1000};}
  var _W04_P0={iv:10,sl:2.0,act:1.1,on:20,adv:0,win:120,press:1,read:1,alarm:false,low:false,temp:0};
  var _W04_QT=[180,178.2,120.9],_W04_DQ=5.4;
  REG.w04_power=function(el,U){
    var S=U.S;
    U.head(el,"POWER BUDGET","ロガーの電力の予算 — 設計のパラメータと使い方を変えて、平均電流と電池寿命を比べる");
    var r1=U.ctrls(el);
    var sl=U.slider(r1,"マイコンの眠りの電流",{min:0.5,max:10,step:0.1,value:2.0,fmt:function(v){return _w04_f(v,1)+" µA";},onInput:draw});
    var act=U.slider(r1,"測定 1 回のマイコンの動作",{values:[0.5,1.1,2,5,10,20],value:1.1,fmt:function(v){return v+" ms";},onInput:draw});
    var on=U.slider(r1,"表示の 1 回の点灯",{values:[5,10,20,50,100,150,200],value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var adv=U.select(r2,"アドバタイズの仕方",["A: 受付の窓の間だけ 100 ms ごと","B: 常に 1 秒ごと（SR-U06 の変更が要る）","C: 常に 100 ms ごと（SR-U06 の変更が要る）"],0,draw);
    var win=U.slider(r2,"受付の窓の長さ",{values:[30,60,120,300,600],value:120,fmt:function(v){return v>=60?(v/60)+" 分":v+" 秒";},onInput:draw});
    var tmp=U.select(r2,"使う温度と使える電荷",["25 °C（設計で使う容量 180 mAh）","0 °C で使い続ける（178 mAh）","−20 °C で使い続ける（121 mAh）"],0,draw);
    var r3=U.ctrls(el);
    var iv=U.slider(r3,"記録の間隔",{values:[1,2,5,10,15,20,30,60],value:10,fmt:function(v){return v+" 分";},onInput:draw});
    var press=U.slider(r3,"短押しの回数",{values:[0,1,2,5,10],value:1,fmt:function(v){return "1 日に "+v+" 回";},onInput:draw});
    var read=U.slider(r3,"読み出しの回数",{values:[0,1,2,7],value:1,fmt:function(v){return "1 週間に "+v+" 回";},onInput:draw});
    var r4=U.ctrls(el);
    var alarm=U.checkbox(r4,"警報の表示が続く（30 秒ごとに赤 2 回）",false,draw);
    var low=U.checkbox(r4,"電池少の期間（ΔQ = 5.4 mAh）を入れる",false,draw);
    var br=U.btnrow(el);
    function setp(p){sl.set(p.sl);act.set(p.act);on.set(p.on);adv.set(p.adv);win.set(p.win);iv.set(p.iv);press.set(p.press);read.set(p.read);alarm.set(p.alarm);low.set(p.low);tmp.set(p.temp);}
    U.button(br,"本文の例",function(){setp(_W04_P0);draw();});
    U.button(br,"電池少の期間を入れる",function(){setp(_W04_P0);low.set(true);draw();});
    U.button(br,"警報の表示が続く",function(){setp(_W04_P0);alarm.set(true);draw();});
    U.button(br,"−20 °C で使い続ける",function(){setp(_W04_P0);tmp.set(2);draw();});
    U.button(br,"代案 B（常に 1 秒ごと）",function(){setp(_W04_P0);adv.set(1);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var p={sl:sl.get(),act:act.get(),on:on.get(),adv:+adv.get(),win:win.get(),iv:iv.get(),press:press.get(),read:read.get(),alarm:alarm.get(),low:false},b=_w04_budget(p);
      var Q=_W04_QT[+tmp.get()],L,days=null;
      b.lim=Q/8760*1000;   /* 上限は、使える電荷を 1 年で使い切る平均電流 */
      if(low.get()){var bl=_w04_budget({sl:p.sl,act:p.act,on:p.on,adv:p.adv,win:p.win,iv:p.iv,press:p.press,read:p.read,alarm:p.alarm,low:true});
        var Il=p.alarm?b.tot:bl.tot;L=((Q-_W04_DQ)/(b.tot/1000)+_W04_DQ/(Il/1000))/8760;days=_W04_DQ/(Il/1000)/24;}
      else L=Q/(b.tot/1000)/8760;
      var nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var xb0=nar?168:196,xb1=nar?330:430,X=function(v){return xb0+(Math.log10(Math.max(v,1e-4))+4)/6*(xb1-xb0);},y0=30,rh=nar?16:17,n=b.it.length+1;
      o.push(S.T(8,16,"平均電流の内訳（＊はこの設計で足した項目）","start",10,"ink",true));
      [[1e-4,"0.0001"],[1e-2,"0.01"],[1,"1"],[100,"100"]].forEach(function(t){o.push(S.L(X(t[0]),y0-2,X(t[0]),y0+rh*n+2,"grid",1));o.push(S.T(X(t[0]),y0+rh*n+15,t[1],"middle",9.5,"muted"));});
      o.push(S.T((xb0+xb1)/2,y0+rh*n+30,"平均電流 [µA]（対数の目盛）","middle",9.5,"muted"));
      var mx=0,mk=0;b.it.forEach(function(r,k){if(r[4]>mx){mx=r[4];mk=k;}});
      var xl=X(b.lim);o.push(S.L(xl,y0-2,xl,y0+rh*n,"signal",1.6));
      b.it.concat([["合計","",0,0,b.tot]]).forEach(function(r,k){var y=y0+k*rh,last=k===n-1,add=/＊/.test(r[1]),c=last?"purple":(add?"gold":(k===mk?"alias":"teal"));
        o.push(S.T(xb0-6,y+12.5,r[1]?r[0]+" "+r[1]:r[0],"end",nar?8.5:9.5,"ink",last||r[4]>=0.4));
        o.push(S.RECT(xb0,y+3,Math.max(1,X(r[4])-xb0),rh-6,2,U.soft(c),c,1));
        o.push(S.T(X(r[4])+4,y+12.5,_w04_ua(r[4])+" µA","start",9,c,true,false,null,true));});
      o.push(S.T(xl-2,y0-5,"上限 "+_w04_f(b.lim,1)+" µA","end",9.5,"signal",true,false,null,true));
      /* 電池寿命 */
      var lx=nar?20:470,ly=nar?y0+rh*n+64:52,lw=nar?340:200,Lmax=Math.max(6,Math.ceil(L/2)*2),XL=function(v){return lx+Math.min(v,Lmax)/Lmax*lw;},ok=L>=1,good=L>=2;
      o.push(S.T(nar?8:460,ly-24,"電池寿命（Q = "+_w04_f(Q,Q%1?1:0)+" mAh）","start",10,"ink",true));
      var cL=good?"green":(ok?"gold":"alias");
      o.push(S.RECT(lx,ly,Math.max(1,XL(L)-lx),24,3,U.soft(cL),cL,1.3));
      var lt=_w04_yr(L)+" 年",inside=XL(L)-lx>U.tw(lt,12)+12;
      o.push(S.L(XL(1),ly-8,XL(1),ly+30,"signal",1.6));o.push(S.L(XL(2),ly-8,XL(2),ly+30,"purple",1.3,"5 3"));
      o.push(S.T(inside?XL(L)-6:XL(L)+6,ly+17,lt,inside?"end":"start",12,cL,true,false,null,!inside));
      o.push(S.L(lx,ly+30,lx+lw,ly+30,"muted",1));
      for(var v=0;v<=Lmax;v+=Lmax>10?4:2){o.push(S.L(XL(v),ly+30,XL(v),ly+34,"muted",1));o.push(S.T(XL(v),ly+46,String(v),"middle",9.5,"muted"));}
      o.push(S.T(lx+lw/2,ly+62,"電池寿命 [年]","middle",9.5,"muted"));
      o.push(S.LEGL(lx,ly+84,[["signal",null,"要求 1 年"],["purple","5 3","目標 2 年"]],9.5,12));
      o.push(S.T(lx,ly+106,"余裕（上限 ÷ 平均電流）"+_w04_f(b.lim/b.tot,1)+" 倍","start",10,ok?"ink":"alias",true));
      box.set(S.svg(Wd,nar?ly+118:Math.max(y0+rh*n+40,ly+118),o));
      var cond=(p.iv===10&&p.press===1&&p.read===1&&!p.alarm&&p.win===120&&+tmp.get()===0);
      var h="平均電流 Ī = Σ I·d = <b>"+_w04_ua(b.tot)+" µA</b>、上限 "+_w04_f(b.lim,1)+" µA（"+_w04_f(Q,Q%1?1:0)+" mAh ÷ 1 年）に対する余裕 <b>"+_w04_f(b.lim/b.tot,1)+" 倍</b><br>";
      if(days!==null)h+="電池寿命 L = (Q − ΔQ) ÷ Ī + ΔQ ÷ Ī<sub>low</sub> = <b>"+_w04_g(L*8760)+" h = "+_w04_yr(L)+" 年</b>（電池少から電池切れまで "+_w04_f(days,0)+" 日）<br>";
      else h+="電池寿命 L = Q ÷ Ī = "+_w04_f(Q,Q%1?1:0)+" mAh ÷ "+_w04_ua(b.tot)+" µA = <b>"+_w04_g(L*8760)+" h = "+_w04_yr(L)+" 年</b><br>";
      if(cond)h+=(ok?(good?'<span class="ok">要求の 1 年を満たし、目標の余裕 2 倍にも届く</span>':'<span class="ok">要求の 1 年は満たす</span>が、目標の余裕 2 倍（2 年）に届かない'):'<span class="warn">要求の 1 年を満たさない</span>')+"<br>";
      else h+=(ok?'寿命は 1 年より長い':'<span class="warn">寿命は 1 年より短い</span>')+'（SR-W02 の使い方の条件と違う所があるので、SR-W02 の合否ではない）<br>';
      if(+adv.get()>0)h+='<span class="warn">常にアドバタイズする代案は、受付を短押しから 2 分に限る SR-U06 に反し、仕様書の変更（変更要求）が要る</span><br>';
      if(p.win!==120)h+='受付の窓を 2 分以外にすると、SR-U06（2 分間受け付ける）と食い違う<br>';
      h+="最も大きい項目: <b>"+b.it[mk][0]+" "+b.it[mk][1]+"</b>（"+_w04_f(b.it[mk][4]/b.tot*100,1)+" %）<br>";
      ro.innerHTML=h+'<div class="wnote">表 5-1 と同じ計算（02 章 5 節と同じ置き方に、＊の 4 項目を足した）。アドバタイズ 1 回は 5 mA で 2 ms、接続の間は時間の 20 % だけ無線が動く。使える電荷は、電池の例の模型で電池切れの判定（2.50 V）までに取り出せる電荷で、25 °C は設計で使う容量 180 mAh を使う。電池少の期間は、25 °C の模型の ΔQ = 5.4 mAh を、電池少の表示の電流で使う。</div>';
    }
    draw();
  };

  /* ---- 6 節: 要求・設計の要素・試験のトレーサビリティマトリクス ---- */
  var _W04_DS=["H01","H02","H03","H04","H05","H06","H07","H08","S01","S02","S03","S04","S05","S06","S07","D01","D02","D03","B01","B02","B03","B04"];
  var _W04_DSN={H01:"マイコン",H02:"温湿度センサ",H03:"記録用フラッシュ",H04:"時計の水晶",H05:"ボタンと LED",H06:"電池ホルダと電圧を測る回路",H07:"アンテナ",H08:"筐体",
    S01:"測定",S02:"記録",S03:"通信",S04:"操作と表示",S05:"時刻と監視",S06:"設定",S07:"基盤",D01:"記録の形式",D02:"フラッシュの配置",D03:"設定の形式",
    B01:"電力の予算",B02:"メモリの予算",B03:"処理時間の予算",B04:"費用の予算"};
  var _W04_REQ=[["F01","温度と湿度を測る","H02 H04 S01 S05"],["F02","記録の間隔 1〜60 分","S01 S03 S06 D03"],["F03","1 件の記録を保存","S01 S02 D01"],["F04","52 560 件以上","H03 S02 D02 B02"],
    ["F05","容量に達したとき","S02 S06 D03"],["F06","長押しで開始・停止","H05 S01 S04"],["F07","全部・差分の読み出し","S02 S03 S06"],["F08","接続のたびに時刻","S03 S05"],
    ["F09","時刻未設定の印","S05 D01"],["F10","警報の印","S01 D01"],["F11","確認まで警報の表示","S03 S04 S06"],["F12","アプリから設定","S03 S06 D03"],
    ["F13","電池少を 14 日前に","H06 S03 S04 S05"],["F14","アプリから開始・停止","S01 S03"],["F15","警報を LED で","H05 S01 S04"],["F16","上限と下限の範囲","S03 D03"],
    ["F17","設定を保持","H03 S06 D03"],["F18","状態遷移表のとおり","S01 S03 S04"],["U01","ボタン 1 個・短押し・長押し","H05 S04"],["U02","状態の応答","S04"],
    ["U03","LED の表示の表","H05 S04"],["U04","開始で緑 3 回","S04"],["U05","1〜3 秒は何もしない","S04"],["U06","2 分間受け付ける","S03"],["U07","停止で赤 3 回","S04"],
    ["I01","BLE 4.2 以上","H01 S07"],["I02","見通し 10 m","H01 H07"],["I03","LG-ICD-001 に従う","S03 D01"],["P01","温度の誤差","H02 S01"],["P02","湿度の誤差","H02 S01"],
    ["P03","記録の時刻 ±2 秒","S05 B03"],["P04","30 日で ±60 秒","H04 S05"],["P05","読み出し 60 秒以内","H01 S02 S03 B03"],["P06","10 秒以内に接続","H01 S03 S04"],
    ["W01","CR2032 1 個","H06 H08"],["W02","電池寿命 1 年","H01 H02 H03 H05 B01"],["W03","工具なしで交換","H08"],["W04","交換しても保持","H03 S02 S06 D02 D03"],
    ["E01","−20〜+60 °C で動く","H01 H02 H03 H08"],["E02","−30〜+70 °C で保存","H03 H08"],["E03","IP54 相当","H08"],["E04","1.0 m の落下","H06 H08"],
    ["R01","10 年保持","H03 D02"],["R02","誤りを検出できる","S03 D02"],["R03","10 秒以内に戻る","H01 S05 S06"],["R04","1 分間隔で 5 年","H03 S02 B02"],
    ["R05","止まっても保持","S02 S06 D03"],["S01","PIN","S03 S06"],["S02","電波法","H01 H07"],["C01","大きさと重さ","H08"],["C02","部品の費用","B04"]];
  var _W04_CAT={F:"機能",U:"操作と表示",I:"外部インタフェース",P:"性能",W:"電源",E:"環境",R:"信頼性",S:"安全とセキュリティ",C:"制約"};
  function _w04_dscol(d){return d.charAt(0)==="H"?"teal":(d.charAt(0)==="B"?"gold":"purple");}
  REG.w04_trace=function(el,U){
    var S=U.S;
    U.head(el,"TRACEABILITY","トレーサビリティマトリクス — 要求を選ぶと設計の要素と試験が、設計の要素を選ぶと使う要求と確かめ直す試験が光る");
    var r1=U.ctrls(el);
    var cats=["すべて"].concat(Object.keys(_W04_CAT).map(function(k){return k+" "+_W04_CAT[k];}));
    var cat=U.select(r1,"区分",cats,0,function(){draw();});
    var rq=U.select(r1,"要求",[{v:"",t:"（選ばない）"}].concat(_W04_REQ.map(function(r){return {v:r[0],t:"SR-"+r[0]+" "+r[1]};})),"F04",function(v){selR=v;selD="";ds.set("");draw();});
    var ds=U.select(r1,"設計の要素",[{v:"",t:"（選ばない）"}].concat(_W04_DS.map(function(d){return {v:d,t:"DS-"+d+" "+_W04_DSN[d]};})),"",function(v){selD=v;selR="";rq.set("");draw();});
    var r2=U.ctrls(el);
    var imp=U.checkbox(r2,"要求を変えたときの影響（同じ要素を使うほかの要求と試験）も光らせる",false,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（SR-F04）",function(){cat.set(0);selR="F04";selD="";rq.set("F04");ds.set("");imp.set(false);draw();});
    U.button(br,"設定（DS-S06）を変えると",function(){cat.set(0);selD="S06";selR="";ds.set("S06");rq.set("");draw();});
    var box=U.svgbox(el),ro=U.readout(el),selR="F04",selD="",MP=null;
    function rowsOf(){var c=cat.get();if(c===0)return _W04_REQ;var k=Object.keys(_W04_CAT)[c-1];return _W04_REQ.filter(function(r){return r[0].charAt(0)===k;});}
    U.ctl.drag(box,function(type,x,y){if(type!=="down"||!MP)return false;
      var hit=MP.hit(x,y);if(!hit)return false;
      if(hit.r){selR=hit.r;selD="";rq.set(hit.r);ds.set("");}else if(hit.d){selD=hit.d;selR="";ds.set(hit.d);rq.set("");}
      draw();return false;});
    function draw(){
      var rows=rowsOf(),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      var two=!nar&&rows.length>26,half=two?Math.ceil(rows.length/2):rows.length,cw=nar?11.2:11.6,rh=nar?13:13.2,lw=46,stw=44,y0=58;
      var hiR={},hiD={},hiS={},impR={};
      if(selR){var rr=_W04_REQ.filter(function(r){return r[0]===selR;})[0];hiR[selR]=1;rr[2].split(" ").forEach(function(d){hiD[d]=1;});hiS[selR]=1;
        if(imp.get())_W04_REQ.forEach(function(r){if(r[0]!==selR&&r[2].split(" ").some(function(d){return hiD[d];})){impR[r[0]]=1;hiS[r[0]]=1;}});}
      if(selD){hiD[selD]=1;_W04_REQ.forEach(function(r){if(r[2].split(" ").indexOf(selD)>=0){hiR[r[0]]=1;hiS[r[0]]=1;}});}
      var blocks=two?[rows.slice(0,half),rows.slice(half)]:[rows],hits=[];
      blocks.forEach(function(bl,bi){var x0=(nar?6:14)+bi*346,xm=x0+lw;
        _W04_DS.forEach(function(d,j){var c=_w04_dscol(d),xx=xm+j*cw;
          if(hiD[d])o.push(S.RECT(xx,y0-50,cw,50+bl.length*rh,0,U.soft(c),"none",0));
          o.push(S.T(xx+cw/2+3,y0-6,d,"start",8.5,hiD[d]?c:"muted",!!hiD[d],true,-90));
          hits.push({x:xx,y:y0-50,w:cw,h:50,d:d});});
        o.push(S.T(xm+_W04_DS.length*cw+6,y0-6,"試験","start",9,"green",true));
        bl.forEach(function(r,k){var y=y0+k*rh,on=!!hiR[r[0]],im=!!impR[r[0]];
          if(on||im)o.push(S.RECT(x0,y,lw+_W04_DS.length*cw+stw,rh,0,on?"var(--signal-soft)":"var(--gold-soft)","none",0));
          o.push(S.T(x0+2,y+rh-3.5,"SR-"+r[0],"start",8.5,on?"signal":(im?"gold":"muted"),on||im,true));
          var got=r[2].split(" ");
          _W04_DS.forEach(function(d,j){if(got.indexOf(d)>=0){var c=_w04_dscol(d),big=(on&&hiD[d])||(selD===d&&on);o.push(S.D(xm+j*cw+cw/2,y+rh/2,c,big?4:2.8));}});
          var st=_W04_REQ.indexOf(r)+1,stt="ST-"+(st<10?"00":"0")+st;
          o.push(S.T(xm+_W04_DS.length*cw+6,y+rh-3.5,stt,"start",8.5,hiS[r[0]]?"green":"muted",!!hiS[r[0]],true));
          hits.push({x:x0,y:y,w:lw+_W04_DS.length*cw+stw,h:rh,r:r[0]});});
        for(var j=0;j<=_W04_DS.length;j++)o.push(S.L(xm+j*cw,y0,xm+j*cw,y0+bl.length*rh,"line",0.4));
        o.push(S.RECT(x0,y0,lw+_W04_DS.length*cw+stw,bl.length*rh,0,"none","line",0.8));});
      var H=y0+half*rh+10;
      MP={hit:function(x,y){for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)return h;}return null;}};
      box.set(S.svg(Wd,H,o));
      /* 読み出し */
      var h="";
      if(selR){var r0=_W04_REQ.filter(function(r){return r[0]===selR;})[0],st0=_W04_REQ.indexOf(r0)+1;
        h+="<b>SR-"+r0[0]+"</b> "+r0[1]+" → 設計の要素: "+r0[2].split(" ").map(function(d){return "DS-"+d+" "+_W04_DSN[d];}).join("・")+" → 試験: <b>ST-"+(st0<10?"00":"0")+st0+"</b><br>";
        if(imp.get()){var ks=Object.keys(impR);h+="同じ要素を使うほかの要求 "+ks.length+" 件: "+ks.map(function(k){return "SR-"+k;}).join("・")+"<br>確かめ直す試験 "+(ks.length+1)+" 件: "+Object.keys(hiS).map(function(k){var i=_W04_REQ.map(function(r){return r[0];}).indexOf(k)+1;return "ST-"+(i<10?"00":"0")+i;}).sort().join("・")+"<br>";}}
      if(selD){var ks2=Object.keys(hiR);h+="<b>DS-"+selD+"</b> "+_W04_DSN[selD]+" を使う要求 "+ks2.length+" 件: "+ks2.map(function(k){return "SR-"+k;}).join("・")+"<br>この要素を変えたら確かめ直す試験: "+ks2.map(function(k){var i=_W04_REQ.map(function(r){return r[0];}).indexOf(k)+1;return "ST-"+(i<10?"00":"0")+i;}).join("・")+"<br>";}
      var noDS=_W04_REQ.filter(function(r){return !r[2];}).length,noReq=_W04_DS.filter(function(d){return !_W04_REQ.some(function(r){return r[2].split(" ").indexOf(d)>=0;});}).length;
      h+=(noDS===0&&noReq===0?'<span class="ok">設計の要素の無い要求 0 件・要求の無い設計の要素 0 個・試験の無い要求 0 件</span>':'<span class="warn">空の行か列がある</span>')+"<br>";
      ro.innerHTML=h+'<div class="wnote">行は仕様書の要求 51 件、列は設計の要素 22 個（H: ハードウェア、S: ソフトウェア、D: データの形式、B: 予算）、右端は仕様書の表 6-1 の試験の番号。行か列の見出しを押すか、上の選択で選ぶ。</div>';
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
