/* 動かして理解する GNSS — 章内インタラクティブ部品（制御工学編の共通部品を引き継いだ）
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

  /* ===== GNSS の計算部品（02 章で作った C/A 符号の生成と FFT を共通にした） =====
     U.gnss.TAPS[prn]: G2 の 2 つのタップ（IS-GPS-200 の表。PRN 1〜32）
     U.gnss.ca(prn): C/A 符号 1023 チップ（0/1 の Int8Array）。G1・G2 は全部 1 から始め、出力 = G1[10] xor G2[a] xor G2[b]
     U.gnss.pm(prn): 0 → +1、1 → −1 に直した列（Int8Array）
     U.gnss.fft(re, im): 長さが 2 のべきの配列を、その場で離散フーリエ変換する（基数 2）
     U.gnss.erfc(x)・U.gnss.Q(x): 相補誤差関数と、標準正規分布の上側確率（正規分布の乱数は U.rng(seed).normal()）
     U.gnss.constellation()・ecef(s, t)・rx(B, L, h)・elaz(r, p)・sky(U, cx, cy, R, sats, o)・SYS・TOKYO: 01 章の近似の衛星の配置とスカイプロット */
  var gnss=(function(){
    var TAPS=[null,[2,6],[3,7],[4,8],[5,9],[1,9],[2,10],[1,8],[2,9],[3,10],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[9,10],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[1,3],[4,6],[5,7],[6,8],[7,9],[8,10],[1,6],[2,7],[3,8],[4,9]];
    var CODES={},PMS={};
    function ca(prn){if(CODES[prn])return CODES[prn];var g1=[1,1,1,1,1,1,1,1,1,1],g2=[1,1,1,1,1,1,1,1,1,1],t=TAPS[prn],o=new Int8Array(1023);
      for(var n=0;n<1023;n++){o[n]=g1[9]^g2[t[0]-1]^g2[t[1]-1];var f1=g1[2]^g1[9],f2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];g1.unshift(f1);g1.pop();g2.unshift(f2);g2.pop();}
      CODES[prn]=o;return o;}
    function pm(prn){if(PMS[prn])return PMS[prn];var c=ca(prn),o=new Int8Array(1023);for(var n=0;n<1023;n++)o[n]=1-2*c[n];PMS[prn]=o;return o;}
    function fft(re,im){var n=re.length,i,j=0,k,len;for(i=1;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){var t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
      for(len=2;len<=n;len<<=1){var ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang),h=len>>1;for(i=0;i<n;i+=len){var cr=1,ci=0;for(k=0;k<h;k++){var a=i+k,b=a+h,br=re[b]*cr-im[b]*ci,bi=re[b]*ci+im[b]*cr;re[b]=re[a]-br;im[b]=im[a]-bi;re[a]+=br;im[a]+=bi;var t2=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t2;}}}}
    /* 相補誤差関数 erfc(x)（相対誤差 1.2e-7 以下。小さい確率でも桁が保たれる）と、標準正規分布の上側確率 Q(x) = erfc(x/√2)/2 */
    function erfc(x){var z=Math.abs(x),t=1/(1+0.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
    function Q(x){return 0.5*erfc(x/Math.SQRT2);}
    /* 空の配置（01 章で作った近似の衛星の配置・座標の変換・スカイプロット。figures.py の gnss_const・sat_ecef・elaz・sky と同じ計算） */
    var D=Math.PI/180,MU=3.986004418e14,WE=7.2921151467e-5,AW=6378137,FW=1/298.257223563,E2=FW*(2-FW);
    var SYS={GPS:["GPS","signal","G"],GLONASS:["GLONASS","purple","R"],Galileo:["Galileo","green","E"],BeiDou:["BeiDou","gold","C"],QZSS:["みちびき","teal","J"]};
    var TOKYO=[35.681,139.767,40.0];
    function geod(B,L,h){B*=D;L*=D;var N=AW/Math.sqrt(1-E2*Math.sin(B)*Math.sin(B));return [(N+h)*Math.cos(B)*Math.cos(L),(N+h)*Math.cos(B)*Math.sin(L),(N*(1-E2)+h)*Math.sin(B)];}
    function kep(a,e,i,w,Om,M){M*=D;var E=M;for(var k=0;k<30;k++)E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
      var nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2)),r=a*(1-e*Math.cos(E)),u=w*D+nu,O=Om*D,inc=i*D;
      return [r*(Math.cos(O)*Math.cos(u)-Math.sin(O)*Math.sin(u)*Math.cos(inc)),r*(Math.sin(O)*Math.cos(u)+Math.cos(O)*Math.sin(u)*Math.cos(inc)),r*Math.sin(u)*Math.sin(inc)];}
    function walker(sys,a,inc,P,S,F,Om0){var o=[];for(var p=0;p<P;p++)for(var s=0;s<S;s++)o.push({sys:sys,a:a,e:0,i:inc,w:0,Om:(Om0||0)+360*p/P,M:360*s/S+360*F*p/(P*S),nm:SYS[sys][2]+(p*S+s+1)});return o;}
    var CON=null;
    function constellation(){if(CON)return CON;var S=[].concat(walker("GPS",26560e3,55,6,4,1,0),walker("GLONASS",25510e3,64.8,3,8,1,15),walker("Galileo",29600e3,56,3,8,1,40),walker("BeiDou",27906e3,55,3,8,1,70));
      for(var k=0;k<3;k++)S.push({sys:"QZSS",a:42164e3,e:0.075,i:41,w:270,Om:166+120*k,M:60-120*k,nm:"J"+(k+1)});
      S.push({sys:"QZSS",a:42164e3,geo:127,nm:"J4"});CON=S;return S;}
    function ecef(s,t){var p;if(s.geo!=null){var g=WE*t+s.geo*D;p=[s.a*Math.cos(g),s.a*Math.sin(g),0];}
      else{var n=Math.sqrt(MU/Math.pow(s.a,3))/D;p=kep(s.a,s.e,s.i,s.w,s.Om,s.M+n*t);}
      var th=WE*t,c=Math.cos(th),sn=Math.sin(th);return [p[0]*c+p[1]*sn,-p[0]*sn+p[1]*c,p[2]];}
    function rx(B,L,h){return {B:B,L:L,h:h,r0:geod(B,L,h)};}
    /* 受信機 r = rx(B, L, h) から見た点 p（ECEF）の [仰角, 方位角（北から東へ） [°], 距離 [m], e, n, u] */
    function elaz(r,p){var d=[p[0]-r.r0[0],p[1]-r.r0[1],p[2]-r.r0[2]],b=r.B*D,l=r.L*D;
      var e=-Math.sin(l)*d[0]+Math.cos(l)*d[1],n=-Math.sin(b)*Math.cos(l)*d[0]-Math.sin(b)*Math.sin(l)*d[1]+Math.cos(b)*d[2],u=Math.cos(b)*Math.cos(l)*d[0]+Math.cos(b)*Math.sin(l)*d[1]+Math.sin(b)*d[2];
      return [Math.atan2(u,Math.hypot(e,n))/D,(Math.atan2(e,n)/D+360)%360,Math.hypot(d[0],d[1],d[2]),e,n,u];}
    function skyxy(cx,cy,R,el,az){var r=R*(90-el)/90;return [cx+r*Math.sin(az*D),cy-r*Math.cos(az*D)];}
    /* スカイプロット（中心が真上、外の円が地平線、上が北・右が東）。sats = [{el, az, name, col, hl}]、o = {trails: [{pts: [[el, az], …], col}], labels, sz, dot} */
    function sky(U,cx,cy,R,sats,o){var S=U.S,s=[];o=o||{};var dot=o.dot||4.2,sz=o.sz||9.5;
      s.push(S.CIRC(cx,cy,R,"muted",1.3,"var(--screen)"));
      for(var az=0;az<360;az+=30){var q=skyxy(cx,cy,R,0,az);s.push(S.L(cx,cy,q[0],q[1],"grid",1));}
      [30,60].forEach(function(e){s.push(S.CIRC(cx,cy,R*(90-e)/90,"faint",0.9,null,"3 3"));});
      s.push(S.L(cx-4,cy,cx+4,cy,"muted",1));s.push(S.L(cx,cy-4,cx,cy+4,"muted",1));
      [0,30,60].forEach(function(e){s.push(S.T(cx+3,cy-R*(90-e)/90+11,e+"°","start",9.5,"muted",false,false,null,true));});
      [[0,"北"],[90,"東"],[180,"南"],[270,"西"]].forEach(function(d){var q=skyxy(cx,cy,R+11,0,d[0]);s.push(S.T(q[0],q[1]+4,d[1],"middle",10,"ink",true));});
      (o.trails||[]).forEach(function(tr){var seg=[];tr.pts.forEach(function(p){if(p[0]>=0)seg.push(skyxy(cx,cy,R,p[0],p[1]));else{if(seg.length>1)s.push(S.PL(seg,tr.col,1.2,null,"2 2"));seg=[];}});if(seg.length>1)s.push(S.PL(seg,tr.col,1.2,null,"2 2"));});
      sats.forEach(function(p){if(p.el<0)return;var q=skyxy(cx,cy,R,p.el,p.az);if(p.hl)s.push(S.CIRC(q[0],q[1],dot+4,p.col,1.8));s.push(S.D(q[0],q[1],p.col,dot));
        if(o.labels!==false&&p.name)s.push(S.T(q[0]+dot+2,q[1]+3.5,p.name,"start",sz,p.col,true,false,null,true));});
      return s.join("");}
    return {TAPS:TAPS,ca:ca,pm:pm,fft:fft,erfc:erfc,Q:Q,SYS:SYS,TOKYO:TOKYO,geod:geod,kep:kep,walker:walker,constellation:constellation,ecef:ecef,rx:rx,elaz:elaz,skyxy:skyxy,sky:sky};
  })();
  /* ===== END GNSS の計算部品 ===== */

  var REG={};
  var U={C:C,col:col,soft:soft,mk:mk,esc:esc,head:head,ctrls:ctrls,btnrow:btnrow,readout:readout,note:note,slider:slider,select:select,checkbox:checkbox,textin:textin,
    htx:htx,button:button,seg:seg,svgbox:svgbox,tbl:tbl,fmt:fmt,sig:sig,tw:tw,S:S,plot:plot,nice:nice,seq:seq,hexView:hexView,fieldsSvg:fieldsSvg,rng:rng,ticker:ticker,ctl:ctl,gnss:gnss};

  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */
  /* ===== 01 章 GNSS とは何か ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w01_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w01_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた数（20 189.3 など） */
  function _w01_g(v,d){var s=_w01_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  var _W01_C=299792458,_W01_D=Math.PI/180,_W01_CID=0;
  /* 枠 (x, y, w, h) の外を切って描く */
  function _w01_clip(x,y,w,h,body){var id="w01cp"+(++_W01_CID);return '<clipPath id="'+id+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/></clipPath><g clip-path="url(#'+id+')">'+body+'</g>';}
  /* 衛星の印（図と同じ見た目）・受信機の印・× 印 */
  function _w01_sat(U,x,y,c,s){var S=U.S;s=s||1;return S.L(x-9*s,y,x+9*s,y,c,1.1)+S.RECT(x-14*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x+7.5*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x-3.6*s,y-3.6*s,7.2*s,7.2*s,1.5,c,c,1);}
  function _w01_rx(U,x,y,c){var S=U.S;c=c||"green";return S.L(x-6,y+6,x+6,y+6,c,1.6)+S.L(x,y+6,x,y,c,1.4)+S.D(x,y-1,c,3.4);}
  /* 2 つの円の交わる点（0 個か 2 個） */
  function _w01_cc(p0,r0,p1,r1){var dx=p1[0]-p0[0],dy=p1[1]-p0[1],d=Math.hypot(dx,dy);if(d<1e-9||r0<0||r1<0)return [];var a=(r0*r0-r1*r1+d*d)/(2*d),h2=r0*r0-a*a;if(h2<0)return [];var h=Math.sqrt(h2),mx=p0[0]+a*dx/d,my=p0[1]+a*dy/d;return [[mx-h*dy/d,my+h*dx/d],[mx+h*dy/d,my-h*dx/d]];}
  /* 平面の座標系の格子（step km ごと） */
  function _w01_grid(U,P,step){var S=U.S,o=[],v;for(v=Math.ceil(P.xr[0]/step)*step;v<=P.xr[1]+1e-9;v+=step)o.push(S.L(P.X(v),P.y,P.X(v),P.y+P.h,"grid",1));for(v=Math.ceil(P.yr[0]/step)*step;v<=P.yr[1]+1e-9;v+=step)o.push(S.L(P.x,P.Y(v),P.x+P.w,P.Y(v),"grid",1));return o.join("");}
  /* |測った距離 − 点までの距離| ≤ sig をすべての点で満たす範囲（格子で調べる）。返り値 {runs, area, diam} */
  function _w01_region(S,rho,sig,xr,yr,step){var runs=[],cnt=0,nd=36,mn=[],mx=[],k,dirs=[];
    for(k=0;k<nd;k++){dirs.push([Math.cos(Math.PI*k/nd),Math.sin(Math.PI*k/nd)]);mn.push(Infinity);mx.push(-Infinity);}
    for(var y=yr[0];y<=yr[1]+1e-9;y+=step){var x0=null,xl=null;
      for(var x=xr[0];x<=xr[1]+1e-9;x+=step){var ok=true;for(var i=0;i<S.length&&ok;i++){if(Math.abs(Math.hypot(x-S[i][0],y-S[i][1])-rho[i])>sig)ok=false;}
        if(ok){cnt++;if(x0===null)x0=x;xl=x;for(k=0;k<nd;k++){var pr=x*dirs[k][0]+y*dirs[k][1];if(pr<mn[k])mn[k]=pr;if(pr>mx[k])mx[k]=pr;}}
        else if(x0!==null){runs.push([y,x0,xl]);x0=null;}}
      if(x0!==null)runs.push([y,x0,xl]);}
    var diam=0;for(k=0;k<nd;k++)if(isFinite(mn[k]))diam=Math.max(diam,mx[k]-mn[k]);
    return {runs:runs,area:cnt*step*step,diam:cnt?diam+step:0};}
  /* 受信機（原点とは限らない）から見た点の向きの広がり（全部の向きを含む最も小さい角）[°] */
  function _w01_spread(S,R){var a=S.map(function(s){return (Math.atan2(s[1]-R[1],s[0]-R[0])/_W01_D+360)%360;}).sort(function(p,q){return p-q;});
    if(a.length<2)return 0;var gap=0;for(var i=0;i<a.length;i++){var g=(i+1<a.length?a[i+1]:a[0]+360)-a[i];gap=Math.max(gap,g);}return 360-gap;}
  /* 選んだ点を、ドラッグの代わりにスライダーで動かす部品（スマートフォン用） */
  function _w01_mover(U,row,names,get,set,lim,redraw){
    var sel=U.select(row,"スライダーで動かす点",names,0,function(){sync();});
    var sx=U.slider(row,"x",{min:lim[0],max:lim[1],step:0.1,value:0,fmt:function(v){return _w01_f(v,1)+" km";},onInput:function(v){var p=get(sel.get());set(sel.get(),[v,p[1]]);redraw();}});
    var sy=U.slider(row,"y",{min:lim[2],max:lim[3],step:0.1,value:0,fmt:function(v){return _w01_f(v,1)+" km";},onInput:function(v){var p=get(sel.get());set(sel.get(),[p[0],v]);redraw();}});
    function sync(){var p=get(sel.get());sx.set(p[0]);sy.set(p[1]);}
    sync();return {sync:sync};}

  /* ---- 1 節: 平面の三辺測量（円の交わり・誤差の三角形・帯の重なり） ---- */
  var _W01_S0=[[-12,9],[5,12],[15,8]],_W01_SB=[[-4,16.5],[0,17],[4,16.5]],_W01_U0=[0.6,-0.4,0.5];
  REG.w01_trilat=function(el,U){
    var S=U.S;
    U.head(el,"TRILATERATION","平面の三辺測量 — 距離の円の交わりと、誤差の広がり");
    var r1=U.ctrls(el);
    var nsat=U.seg(r1,["点 1 つ","点 2 つ","点 3 つ"],2,function(){draw();});
    var sg=U.slider(r1,"距離の誤差の大きさ（最大）",{values:[0,0.25,0.5,1,1.5,2],value:1,fmt:function(v){return "±"+v+" km";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var band=U.checkbox(r2,"誤差の幅の帯と、その重なりを描く",true,function(){draw();});
    var tru=U.checkbox(r2,"本当の距離の円（破線）",false,function(){draw();});
    var br=U.btnrow(el);
    var sats,rx,seed=0;
    function reset(lay){sats=(lay?_W01_SB:_W01_S0).map(function(p){return p.slice();});rx=[0,0];}
    function errs(){if(seed===0)return _W01_U0.slice();var g=U.rng(seed*7919+3);return [0,1,2].map(function(){return 2*g.next()-1;});}
    U.button(br,"本文の例（広がった配置）",function(){reset(0);nsat.set(2);sg.set(1);seed=0;band.set(true);tru.set(false);mv.sync();draw();});
    U.button(br,"偏った配置",function(){reset(1);nsat.set(2);mv.sync();draw();});
    U.button(br,"別の誤差（乱数を変える）",function(){seed++;draw();});
    var r3=U.ctrls(el);
    var box=U.svgbox(el),ro=U.readout(el),MP=null,drag=-1;
    reset(0);
    var mv=_w01_mover(U,r3,["S1","S2","S3","受信機"],function(k){return k<3?sats[k]:rx;},function(k,p){if(k<3)sats[k]=p;else rx=p;},[-20,20,-9,24],draw);
    U.ctl.drag(box,function(type,x,y){
      if(!MP)return false;
      if(type==="down"){var best=-1,bd=16,n=nsat.get()+1;for(var k=0;k<4;k++){if(k<3&&k>=n)continue;var p=k<3?sats[k]:rx,d=Math.hypot(MP.X(p[0])-x,MP.Y(p[1])-y);if(d<bd){bd=d;best=k;}}drag=best;return best>=0?undefined:false;}
      if(type==="up"){drag=-1;mv.sync();return;}
      if(drag<0||x==null)return;var q=[Math.max(-20,Math.min(20,MP.ux(x))),Math.max(-9,Math.min(24,MP.uy(y)))];q=[Math.round(q[0]*10)/10,Math.round(q[1]*10)/10];
      if(drag<3)sats[drag]=q;else rx=q;draw();});
    function draw(){
      var n=nsat.get()+1,sig=sg.get(),u=errs(),Su=sats.slice(0,n),i;
      var r=Su.map(function(s){return Math.hypot(s[0]-rx[0],s[1]-rx[1]);}),e=u.slice(0,n).map(function(v){return v*sig;}),rho=r.map(function(v,k){return v+e[k];});
      var nar=_w01_nar(box),Wd=nar?400:700,o=[];
      var P=nar?U.plot(34,24,350,292,[-21,21],[-10,25]):U.plot(40,24,420,350,[-21,21],[-10,25]);MP=P;var k=P.w/42;
      o.push(S.T(P.x,16,"平面（単位 km）。点と受信機はドラッグで動かせる","start",10,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,4,"var(--screen)","line",1));
      var body=_w01_grid(U,P,5);
      /* 帯と重なり */
      var reg=null,Z=Math.max(2.5,5*Math.max(sig,0.25));
      if(sig>0&&band.get()){
        Su.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),rho[j]*k,"var(--signal-soft)",2*sig*k);});
        var st=Math.max(0.04,sig/30);reg=_w01_region(Su,rho,sig,[rx[0]-Math.max(Z,12*sig),rx[0]+Math.max(Z,12*sig)],[rx[1]-Math.max(Z,12*sig),rx[1]+Math.max(Z,12*sig)],st);
        if(n<3)reg.diam=NaN;
        reg.runs.forEach(function(q){body+=S.RECT(P.X(q[1]-st/2),P.Y(q[0]+st/2),Math.max(1,(q[2]-q[1]+st)*k),st*k+0.5,0,"gold","none",0,null,' fill-opacity="0.55"');});}
      if(tru.get())Su.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),r[j]*k,"green",1,null,"4 3");});
      Su.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),Math.max(0,rho[j])*k,n===1?"gold":"signal",1.6);});
      o.push(_w01_clip(P.x,P.y,P.w,P.h,body));
      /* 交わる点 */
      var tri=[],cand=[];
      if(n===2){cand=_w01_cc(Su[0],rho[0],Su[1],rho[1]);cand.forEach(function(c){if(c[0]>=-21&&c[0]<=21&&c[1]>=-10&&c[1]<=25)o.push(S.D(P.X(c[0]),P.Y(c[1]),"gold",4.6));});}
      if(n===3){[[0,1],[1,2],[0,2]].forEach(function(pq){var cs=_w01_cc(Su[pq[0]],rho[pq[0]],Su[pq[1]],rho[pq[1]]);if(cs.length){cs.sort(function(a,b){return Math.hypot(a[0]-rx[0],a[1]-rx[1])-Math.hypot(b[0]-rx[0],b[1]-rx[1]);});tri.push(cs[0]);}});
        if(tri.length===3)o.push(S.PL(tri.concat([tri[0]]).map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"gold",1.3,"var(--gold-soft)"));
        tri.forEach(function(q){o.push(S.D(P.X(q[0]),P.Y(q[1]),"gold",3.4));});}
      Su.forEach(function(s,j){o.push(_w01_sat(U,P.X(s[0]),P.Y(s[1]),"signal",0.85));o.push(S.T(P.X(s[0]),P.Y(s[1])-9,"S"+(j+1),"middle",10,"signal",true,false,null,true));});
      o.push(_w01_rx(U,P.X(rx[0]),P.Y(rx[1])));
      /* 拡大の枠（受信機のまわり） */
      var Q=nar?U.plot(100,P.y+P.h+40,200,200,[rx[0]-Z,rx[0]+Z],[rx[1]-Z,rx[1]+Z]):U.plot(480,52,206,206,[rx[0]-Z,rx[0]+Z],[rx[1]-Z,rx[1]+Z]),kq=Q.w/(2*Z);
      o.push(S.T(Q.x,Q.y-8,"受信機のまわりを拡大（±"+_w01_f(Z,1)+" km）","start",10,"ink",true));
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,4,"var(--screen)","line",1));
      var zb=_w01_grid(U,Q,Z>6?2:1);
      if(reg){Su.forEach(function(s,j){zb+=S.CIRC(Q.X(s[0]),Q.Y(s[1]),rho[j]*kq,"var(--signal-soft)",2*sig*kq);});
        var st2=Math.max(0.04,sig/30);reg.runs.forEach(function(q){zb+=S.RECT(Q.X(q[1]-st2/2),Q.Y(q[0]+st2/2),Math.max(1,(q[2]-q[1]+st2)*kq),st2*kq+0.5,0,"gold","none",0,null,' fill-opacity="0.55"');});}
      if(tru.get())Su.forEach(function(s,j){zb+=S.CIRC(Q.X(s[0]),Q.Y(s[1]),r[j]*kq,"green",1,null,"4 3");});
      Su.forEach(function(s,j){zb+=S.CIRC(Q.X(s[0]),Q.Y(s[1]),Math.max(0,rho[j])*kq,n===1?"gold":"signal",1.6);});
      if(tri.length===3)zb+=S.PL(tri.concat([tri[0]]).map(function(q){return [Q.X(q[0]),Q.Y(q[1])];}),"gold",1.3,"var(--gold-soft)");
      tri.forEach(function(q){zb+=S.D(Q.X(q[0]),Q.Y(q[1]),"gold",3.4);});
      cand.forEach(function(c){zb+=S.D(Q.X(c[0]),Q.Y(c[1]),"gold",4.6);});
      o.push(_w01_clip(Q.x,Q.y,Q.w,Q.h,zb));
      o.push(_w01_rx(U,Q.X(rx[0]),Q.Y(rx[1])));
      var ly=Q.y+Q.h+22;
      o.push(S.LEGL(Q.x-(nar?60:0),ly,[["signal",null,"測った距離の円"],["green",null,"受信機"]],9.5,12));
      o.push(S.RECT(Q.x-(nar?60:0),ly+10,12,11,2,"gold","none",0,null,' fill-opacity="0.55"'));
      o.push(S.T(Q.x-(nar?60:0)+18,ly+19,"いるかもしれない範囲（帯の重なり）","start",9.5,"muted"));
      box.set(S.svg(Wd,nar?ly+30:Math.max(P.y+P.h+12,ly+30),o));
      /* 読み出し */
      var h="",sp=_w01_spread(Su,rx);
      h+=Su.map(function(s,j){return "S"+(j+1)+": 本当の距離 "+_w01_f(r[j],2)+" km、測った距離 <b>"+_w01_f(rho[j],2)+" km</b>（誤差 "+(e[j]>=0?"+":"")+_w01_f(e[j],2)+" km）";}).join("<br>")+"<br>";
      if(n===1)h+='受信機は、S1 を中心とする半径 '+_w01_f(rho[0],2)+' km の円の上のどこかにいる（1 点に決まらない）<br>';
      if(n===2){if(cand.length===2){var dd=Math.hypot(cand[0][0]-cand[1][0],cand[0][1]-cand[1][1]);h+="候補は 2 つ: ("+_w01_f(cand[0][0],2)+", "+_w01_f(cand[0][1],2)+") と ("+_w01_f(cand[1][0],2)+", "+_w01_f(cand[1][1],2)+")。2 つの間は "+_w01_f(dd,1)+" km（S1 と S2 を結ぶ直線について対称）<br>";}
        else h+='<span class="warn">2 つの円が交わらない</span>（誤差が大きいか、点が近すぎる）<br>';}
      if(n===3){if(tri.length===3){var sd=[0,1,2].map(function(m){return Math.hypot(tri[m][0]-tri[(m+1)%3][0],tri[m][1]-tri[(m+1)%3][1]);}),mxs=Math.max.apply(null,sd);
          h+=(mxs<0.01?'<span class="ok">3 つの円が 1 点で交わる</span>: ('+_w01_f(tri[0][0],2)+", "+_w01_f(tri[0][1],2)+")":"3 つの円は 1 点で交わらず、交わる点が三角形をつくる。三角形の辺 <b>"+_w01_f(Math.min.apply(null,sd),1)+"〜"+_w01_f(mxs,1)+" km</b>")+"<br>";}
        else h+='<span class="warn">交わらない円の組がある</span><br>';}
      if(reg&&n===3)h+="帯の重なり（受信機のいるかもしれない範囲）: 差し渡し <b>"+_w01_f(reg.diam,1)+" km</b>、面積 "+_w01_f(reg.area,1)+" km²<br>";
      if(n===3&&sig>0){var r0=_w01_region(Su,r,sig,[rx[0]-12*sig-2,rx[0]+12*sig+2],[rx[1]-12*sig-2,rx[1]+12*sig+2],Math.max(0.03,sig/40));
        h+="誤差が 0 のときの帯（本当の距離 ± "+sig+" km）の重なりの差し渡し: <b>"+_w01_f(r0.diam,1)+" km</b>（誤差の幅 "+_w01_f(2*sig,1)+" km の "+_w01_f(r0.diam/(2*sig),2)+" 倍）<br>";}
      if(n>=2)h+="受信機から見た点の向きの広がり: "+_w01_f(sp,0)+"°"+(sp<45?'（<span class="warn">偏っている</span>。重なりが細長く大きくなる）':"")+"<br>";
      ro.innerHTML=h+'<div class="wnote">誤差は、点ごとに「大きさ（最大）× −1〜1 の数」で決める。本文の例は ±1 km で +0.6・−0.4・+0.5 km（本文の図と同じ）、「別の誤差」で −1〜1 の数を乱数で選び直す。帯は「測った距離 ± 誤差の大きさ」で、誤差が大きさ以内なら、受信機は必ず帯の重なりの中にいる。</div>';
    }
    draw();
  };

  /* ---- 2 節: 電波の届く時間と、2 つの時計（地球と軌道の大きさの比は実際のとおり） ---- */
  var _W01_RE=6371e3,_W01_AG=26560e3;
  function _w01_distel(el){var t=el*_W01_D;return -_W01_RE*Math.sin(t)+Math.sqrt(_W01_AG*_W01_AG-Math.pow(_W01_RE*Math.cos(t),2));}
  function _w01_tstr(s){var a=Math.abs(s),g=s<0?"−":"+";if(a===0)return "0";function q(v){return String(+v.toPrecision(2));}if(a<1e-6)return g+q(a*1e9)+" ns";if(a<1e-3)return g+q(a*1e6)+" μs";return g+q(a*1e3)+" ms";}
  REG.w01_tof=function(el,U){
    var S=U.S;
    U.head(el,"TIME OF FLIGHT","電波の届く時間と距離 — 衛星の時計と受信機の時計");
    var r1=U.ctrls(el);
    var ang=U.slider(r1,"衛星の見える高さ（地平線からの角度）",{min:0,max:90,step:1,value:90,fmt:function(v){return v+"°";},onInput:function(){tnow=-1;draw();}});
    var dts=[-1e-3,-1e-4,-1e-5,-1e-6,-1e-7,-1e-8,-1e-9,0,1e-9,1e-8,1e-7,1e-6,1e-5,1e-4,1e-3];
    var off=U.slider(r1,"受信機の時計のずれ δt<sub>r</sub>",{values:dts,value:1e-6,fmt:function(v){return _w01_tstr(v)+(v>0?"（進んでいる）":(v<0?"（遅れている）":""));},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var tnow=-1,tick=U.ticker(function(){var T=_w01_distel(ang.get())/_W01_C;tnow+=0.0016;if(tnow>=T){tnow=T;tick.stop();}draw();},40);
    U.button(br,"再生（電波を送る）",function(){tnow=0;tick.start();draw();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"本文の例（真上の衛星・ずれ +1 μs）",function(){tick.stop();ang.set(90);off.set(1e-6);tnow=-1;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var th=ang.get(),d=_w01_distel(th),T=d/_W01_C,dt=off.get(),done=tnow<0||tnow>=T-1e-12,tn=tnow<0?T:tnow;
      var nar=_w01_nar(box),Wd=nar?400:700,o=[];
      /* 左（狭い画面では上）: 地球と軌道 */
      var sc=(nar?250:300)/36000e3,ox=nar?96:112,oy=46+27500e3*sc,X=function(x){return ox+x*sc;},Y=function(y){return oy-y*sc;};
      o.push(S.T(nar?8:14,16,"地球と GPS の軌道（大きさの比は実際のとおり）","start",10,"ink",true));
      var g=S.CIRC(ox,oy,_W01_AG*sc,"signal",1.1,null,"5 4")+S.CIRC(ox,oy,_W01_RE*sc,"green",1.4,"var(--green-soft)");
      var t=th*_W01_D,sx=d*Math.cos(t),sy=_W01_RE+d*Math.sin(t),rxx=X(0),rxy=Y(_W01_RE);
      g+=S.L(rxx,rxy,X(sx),Y(sy),"muted",1,"3 3");
      if(tnow>=0){var f=Math.min(1,tn/T),px=X(sx)+(rxx-X(sx))*f,py=Y(sy)+(rxy-Y(sy))*f;g+=S.L(X(sx),Y(sy),px,py,"signal",2.4);g+=S.CIRC(px,py,6,"signal",2,"var(--signal-soft)");}
      o.push(_w01_clip(4,24,nar?392:340,(nar?278:322),g));
      o.push(_w01_sat(U,X(sx),Y(sy),"signal",0.85));
      o.push(_w01_rx(U,rxx,rxy-4));
      o.push(S.T(X(sx)+(th>60?10:-6),Y(sy)-10,"衛星（原子時計）","middle",9.5,"signal",true,false,null,true));
      o.push(S.T(rxx-8,rxy-6,"受信機","end",9.5,"green",true,false,null,true));
      o.push(S.T(X(0),Y(-1500e3),"地球","middle",9.5,"green",true));
      /* 右（狭い画面では下）: 2 つの時間の軸 */
      var tx=nar?40:368,ty=nar?(oy+_W01_RE*sc+30):48,tw=nar?330:300,P=U.plot(tx,ty,tw,10,[0,90],[0,1]);
      o.push(S.T(tx-(nar?30:0),ty-12,"時間の軸（0〜90 ms）","start",10,"ink",true));
      var a1=ty+22,a2=ty+76;
      o.push(S.ARR(tx,a1,tx+tw+10,a1,"green",1.2,6));o.push(S.T(tx+tw+10,a1-6,"基準の時刻","end",9.5,"green",true));
      o.push(S.ARR(tx,a2,tx+tw+10,a2,"alias",1.2,6));o.push(S.T(tx+tw+10,a2-6,"受信機の時計","end",9.5,"alias",true));
      [0,30,60,90].forEach(function(v){o.push(S.L(P.X(v),a1,P.X(v),a1+4,"muted",1));o.push(S.T(P.X(v),a1+15,v+" ms","middle",9.5,"muted"));});
      o.push(S.L(P.X(0),a1-7,P.X(0),a1+7,"ink",1.6));o.push(S.T(P.X(0)+3,a1-9,"送信","start",9.5,"ink",true));
      var tms=T*1e3;
      o.push(S.L(P.X(tms),a1-7,P.X(tms),a1+7,"ink",1.6));o.push(S.T(P.X(tms),a1-9,"到着 "+_w01_f(tms,2)+" ms","middle",9.5,"ink",true,false,null,true));
      if(tnow>=0&&!done)o.push(S.D(P.X(tn*1e3),a1,"signal",5));
      var rd=(tn+dt)*1e3;
      o.push(S.L(P.X(tms),a1+8,P.X(tms),a2,"faint",1,"3 3"));
      if(done){o.push(S.L(P.X(Math.max(0,Math.min(90,rd))),a2-7,P.X(Math.max(0,Math.min(90,rd))),a2+7,"alias",1.8));o.push(S.T(P.X(Math.max(0,Math.min(90,rd))),a2+17,"読み "+_w01_f(rd,4)+" ms","middle",9.5,"alias",true,false,null,true));}
      /* 到着のまわりの拡大 */
      var zw=Math.max(Math.abs(dt)*2.4,2e-9),zy=a2+48,Z=U.plot(tx,zy,tw,10,[-zw,zw],[0,1]);
      o.push(S.T(tx-(nar?30:0),zy-10,"到着のまわりを拡大（±"+_w01_tstr(zw).replace("+","")+"）","start",10,"ink",true));
      o.push(S.L(tx,zy+8,tx+tw,zy+8,"muted",1.2));
      o.push(S.L(Z.X(0),zy-2,Z.X(0),zy+18,"green",2));o.push(S.T(Z.X(0),zy+32,"本当の到着","middle",9.5,"green",true,false,null,true));
      if(done&&dt!==0){o.push(S.L(Z.X(dt),zy-2,Z.X(dt),zy+18,"alias",2));o.push(S.T(Z.X(dt),zy+46,"受信機の読み","middle",9.5,"alias",true,false,null,true));
        o.push(S.DARR(Z.X(0),zy+3,Z.X(dt),zy+3,"alias",1.2,5));}
      var Hh=nar?zy+58:Math.max(oy+_W01_RE*sc+20,zy+58);
      box.set(S.svg(Wd,Hh,o));
      /* 読み出し */
      var dm=_W01_C*(T+dt);
      var h="衛星までの距離 <b>"+_w01_g(d/1e3,1)+" km</b>、電波の届く時間 <b>"+_w01_f(T*1e3,3)+" ms</b>（距離 ÷ 光の速さ 299 792 458 m/s）<br>";
      if(!done)h+="電波が進んでいる途中: 送ってから "+_w01_f(tn*1e3,2)+" ms、残り "+_w01_g((d-_W01_C*tn)/1e3,0)+" km<br>";
      else{h+="受信機の時計の読み: 送信 0 ms の電波が "+_w01_f((T+dt)*1e3,6)+" ms に届いたと読む（時計のずれ "+_w01_tstr(dt).replace("+","＋")+"）<br>";
        h+="受信機が求める距離 = 光の速さ × "+_w01_f((T+dt)*1e3,6)+" ms = <b>"+_w01_g(dm/1e3,3)+" km</b>、本当の距離との差 <b>"+(dt>=0?"+":"−")+_w01_g(Math.abs(_W01_C*dt),dt===0?0:(Math.abs(_W01_C*dt)<10?2:1))+" m</b>（= 光の速さ × 時計のずれ）";}
      ro.innerHTML=h+'<div class="wnote">地球の半径 6 371 km、GPS の軌道の半径 26 560 km の円で計算した。衛星の時計は正しいとし、受信機の時計だけがずれているとした。「再生」では、電波の進み方を実際の約 25 分の 1 の速さにして描く（67 ms が約 1.7 s）。</div>';
    }
    draw();
  };

  /* ---- 3 節: 受信機の時計のずれ（平面の例。擬似距離の円が一斉に膨らむ） ---- */
  var _W01_S4=[-5,12],_W01_E4=[0.3,-0.2,0.25,-0.3];
  /* 仮に置いたずれ bh のとき、円 |p − S_i| = ρ_i − bh のどれにも近い点 p と、円とのずれ（2 乗の平均の平方根）。ガウス・ニュートン法 */
  function _w01_fitp(S,rho,bh,p0){var p=p0.slice(),it,i;for(it=0;it<30;it++){var a11=0,a12=0,a22=0,g1=0,g2=0;
      for(i=0;i<S.length;i++){var dx=p[0]-S[i][0],dy=p[1]-S[i][1],d=Math.hypot(dx,dy)||1e-9,res=(rho[i]-bh)-d,hx=dx/d,hy=dy/d;a11+=hx*hx;a12+=hx*hy;a22+=hy*hy;g1+=hx*res;g2+=hy*res;}
      var det=a11*a22-a12*a12;if(Math.abs(det)<1e-12)break;var ux=(a22*g1-a12*g2)/det,uy=(a11*g2-a12*g1)/det;p[0]+=ux;p[1]+=uy;if(Math.hypot(ux,uy)<1e-10)break;}
    var ss=0;for(i=0;i<S.length;i++){var r=Math.hypot(p[0]-S[i][0],p[1]-S[i][1])-(rho[i]-bh);ss+=r*r;}return {p:p,m:Math.sqrt(ss/S.length)};}
  /* 位置 (x, y) と b を一緒に求める（衛星が 4 つなら最小二乗。6 章の方法） */
  function _w01_solve3(S,rho,v0){var v=v0.slice(),it,i,j,k;for(it=0;it<40;it++){var A=[[0,0,0],[0,0,0],[0,0,0]],g=[0,0,0];
      for(i=0;i<S.length;i++){var dx=v[0]-S[i][0],dy=v[1]-S[i][1],d=Math.hypot(dx,dy)||1e-9,h=[dx/d,dy/d,1],res=rho[i]-(d+v[2]);for(j=0;j<3;j++){g[j]+=h[j]*res;for(k=0;k<3;k++)A[j][k]+=h[j]*h[k];}}
      var dv=_w01_sol3(A,g);if(!dv)return null;
      v[0]+=dv[0];v[1]+=dv[1];v[2]+=dv[2];if(Math.hypot(dv[0],dv[1],dv[2])<1e-11)break;}
    return v.every(isFinite)?v:null;}
  /* 3 行 3 列の連立 1 次方程式 A x = g（クラメルの公式） */
  function _w01_sol3(A,g){function det(M){return M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);}
    var D=det(A);if(Math.abs(D)<1e-14)return null;return [0,1,2].map(function(c){var M=A.map(function(r,i){return r.map(function(x,j){return j===c?g[i]:x;});});return det(M)/D;});}
  REG.w01_clock=function(el,U){
    var S=U.S;
    U.head(el,"CLOCK BIAS","受信機の時計のずれ — 擬似距離の円は一斉に膨らむ");
    var r1=U.ctrls(el);
    var dts=U.slider(r1,"受信機の時計のずれ δt<sub>r</sub>",{min:-20,max:20,step:0.5,value:10,fmt:function(v){return (v>0?"+":"")+_w01_f(v,1)+" μs（b = "+_w01_f(_W01_C*v*1e-6/1e3,2)+" km）";},onInput:function(){solved=null;draw();}});
    var bh=U.slider(r1,"仮に置くずれ b̂",{min:-6,max:10,step:0.05,value:0,fmt:function(v){return _w01_f(v,2)+" km";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var cTru=U.checkbox(r2,"本当の距離の円（緑の破線）",true,function(){draw();});
    var cHyp=U.checkbox(r2,"双曲線（b̂ を変えたときの、交わる点の道）",false,function(){draw();});
    var c4=U.checkbox(r2,"4 つ目の衛星 S4 も使う",false,function(){solved=null;draw();});
    var cErr=U.checkbox(r2,"擬似距離に誤差を足す（最大 ±0.3 km）",false,function(){solved=null;draw();});
    var br=U.btnrow(el);
    var sats,rx,solved=null;
    function reset(){sats=_W01_S0.map(function(p){return p.slice();}).concat([_W01_S4.slice()]);rx=[0,0];}
    function data(){var n=c4.get()?4:3,b=_W01_C*dts.get()*1e-6/1e3,Su=sats.slice(0,n),r=Su.map(function(s){return Math.hypot(s[0]-rx[0],s[1]-rx[1]);});
      return {n:n,b:b,S:Su,r:r,rho:r.map(function(v,i){return v+b+(cErr.get()?_W01_E4[i]:0);})};}
    function solve(){var D=data(),cx=0,cy=0;D.S.forEach(function(s){cx+=s[0]/D.n;cy+=s[1]/D.n;});return _w01_solve3(D.S,D.rho,[cx,cy-15,0]);}
    U.button(br,"ずれを解く（計算機で）",function(){solved=solve();if(solved)bh.set(Math.max(-6,Math.min(10,solved[2])));draw();});
    U.button(br,"本文の例",function(){reset();dts.set(10);bh.set(0);cTru.set(true);cHyp.set(false);c4.set(false);cErr.set(false);solved=null;mv.sync();draw();});
    U.button(br,"b̂ = 3.0 km にする",function(){bh.set(3.0);draw();});
    var r3=U.ctrls(el);
    var box=U.svgbox(el),ro=U.readout(el),MP=null,drag=-1;
    reset();
    var mv=_w01_mover(U,r3,["S1","S2","S3","S4","受信機"],function(k){return k<4?sats[k]:rx;},function(k,p){if(k<4)sats[k]=p;else rx=p;solved=null;},[-20,20,-9,24],function(){draw();});
    U.ctl.drag(box,function(type,x,y){
      if(!MP)return false;
      if(type==="down"){var best=-1,bd=16,n=c4.get()?4:3;for(var k=0;k<5;k++){if(k<4&&k>=n)continue;var p=k<4?sats[k]:rx,d=Math.hypot(MP.X(p[0])-x,MP.Y(p[1])-y);if(d<bd){bd=d;best=k;}}drag=best;return best>=0?undefined:false;}
      if(type==="up"){drag=-1;mv.sync();return;}
      if(drag<0||x==null)return;var q=[Math.round(Math.max(-20,Math.min(20,MP.ux(x)))*10)/10,Math.round(Math.max(-9,Math.min(24,MP.uy(y)))*10)/10];
      if(drag<4)sats[drag]=q;else rx=q;solved=null;draw();});
    function draw(){
      var D=data(),b=D.b,bv=bh.get(),i,nar=_w01_nar(box),Wd=nar?400:700,o=[];
      var P=nar?U.plot(34,24,350,292,[-21,21],[-10,25]):U.plot(40,24,400,333,[-21,21],[-10,25]),k=P.w/42;MP=P;
      o.push(S.T(P.x,16,"平面（単位 km）。衛星と受信機はドラッグで動かせる","start",10,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,4,"var(--screen)","line",1));
      var body=_w01_grid(U,P,5);
      if(cHyp.get()){[[0,1,"purple"],[1,2,"teal"]].forEach(function(q){var a=q[0],c=q[1],dd=Math.hypot(D.S[c][0]-D.S[a][0],D.S[c][1]-D.S[a][1]),bmax=(D.rho[a]+D.rho[c]-dd)/2-1e-9;
        [0,1].forEach(function(sd){var pts=[];for(var j=0;j<=300;j++){var bb=-40+(bmax+40)*j/300,cs=_w01_cc(D.S[a],D.rho[a]-bb,D.S[c],D.rho[c]-bb);if(cs.length)pts.push(cs[sd]);}body+=P.clip(pts,q[2],1.8);});});}
      if(cTru.get())D.S.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),D.r[j]*k,"green",1.1,null,"4 3");});
      D.S.forEach(function(s,j){body+=S.CIRC(P.X(s[0]),P.Y(s[1]),Math.max(0,D.rho[j]-bv)*k,"signal",1.7);});
      o.push(_w01_clip(P.x,P.y,P.w,P.h,body));
      /* 2 つずつの円の交わる点（受信機に近い方） */
      var prs=D.n===4?[[0,1],[1,2],[0,2],[2,3],[0,3],[1,3]]:[[0,1],[1,2],[0,2]],cross=[];
      prs.forEach(function(q){var cs=_w01_cc(D.S[q[0]],D.rho[q[0]]-bv,D.S[q[1]],D.rho[q[1]]-bv);if(cs.length){cs.sort(function(a,c){return Math.hypot(a[0]-rx[0],a[1]-rx[1])-Math.hypot(c[0]-rx[0],c[1]-rx[1]);});cross.push(cs[0]);}});
      cross.forEach(function(c){o.push(S.D(P.X(c[0]),P.Y(c[1]),"gold",3.4));});
      D.S.forEach(function(s,j){o.push(_w01_sat(U,P.X(s[0]),P.Y(s[1]),"signal",0.85));o.push(S.T(P.X(s[0]),P.Y(s[1])-9,"S"+(j+1),"middle",10,"signal",true,false,null,true));});
      o.push(_w01_rx(U,P.X(rx[0]),P.Y(rx[1])));
      if(solved){o.push(S.CIRC(P.X(solved[0]),P.Y(solved[1]),8,"gold",2));}
      /* 右（狭い画面では下）: 円のずれと b̂ */
      var cx0=0,cy0=0;D.S.forEach(function(s){cx0+=s[0]/D.n;cy0+=s[1]/D.n;});
      function best(bb,pw){var f1=_w01_fitp(D.S,D.rho,bb,pw),f2=_w01_fitp(D.S,D.rho,bb,[cx0,cy0-15]),f3=_w01_fitp(D.S,D.rho,bb,rx);var f=f1.m<=f2.m?f1:f2;return f3.m<f.m?f3:f;}
      var curve=[],pp=[cx0,cy0-15],mmax=0;for(var j=0;j<=160;j++){var bb=-6+16*j/160,f=best(bb,pp);pp=f.p;curve.push([bb,f.m]);mmax=Math.max(mmax,f.m);}
      var cur=best(bv,[cx0,cy0-15]);
      var ymax=Math.max(0.5,Math.min(8,Math.ceil(mmax*1.1*2)/2));
      var G=nar?U.plot(52,P.y+P.h+46,320,150,[-6,10],[0,ymax]):U.plot(492,52,192,230,[-6,10],[0,ymax]);
      o.push(S.T(G.x-(nar?40:44),G.y-12,"円のずれ（1 点で交わると 0）","start",10,"ink",true));
      o.push(G.axes({xl:"仮に置くずれ b̂ [km]",yl:"円のずれ [km]",xt:[-6,-3,0,3,6,9],yt:U.nice(0,ymax,4).filter(function(v){return v<=ymax+1e-9;}),ylOff:34}));
      o.push(G.line([[b,0],[b,ymax]],"green",1.2,"4 3"));o.push(S.T(G.X(b)+4,G.y+12,"b","start",10,"green",true,false,null,true));
      o.push(G.clip(curve,"purple",2));
      o.push(G.line([[bv,0],[bv,ymax]],"ink",1,"2 3"));o.push(S.D(G.X(bv),G.Y(Math.min(ymax,cur.m)),"gold",5));
      box.set(S.svg(Wd,nar?G.y+G.h+44:Math.max(P.y+P.h+14,G.y+G.h+44),o));
      /* 読み出し */
      var h="b = 光の速さ × 時計のずれ = 299 792 458 m/s × "+_w01_f(dts.get(),1)+" μs = <b>"+_w01_f(b,3)+" km</b><br>";
      h+=D.S.map(function(s,j){return "S"+(j+1)+": 本当の距離 "+_w01_f(D.r[j],2)+" km → 擬似距離 <b>"+_w01_f(D.rho[j],2)+" km</b>"+(cErr.get()?"（誤差 "+(_W01_E4[j]>=0?"+":"")+_W01_E4[j]+" km を含む）":"");}).join("<br>")+"<br>";
      h+="仮に置くずれ b̂ = "+_w01_f(bv,2)+" km で描いた円（半径 ρ<sub>i</sub> − b̂）の、1 点からのずれ <b>"+_w01_f(cur.m,3)+" km</b>"+(cur.m<0.005?'（<span class="ok">1 点で交わる</span>）':"")+"<br>";
      if(solved){var pe=Math.hypot(solved[0]-rx[0],solved[1]-rx[1]);h+="計算機で解いた値: 位置 ("+_w01_f(solved[0],3)+", "+_w01_f(solved[1],3)+") km、b = <b>"+_w01_f(solved[2],3)+" km</b>（時計のずれ "+_w01_f(solved[2]*1e3/_W01_C*1e6,2)+" μs）。本当の位置との差 "+_w01_f(pe,3)+" km"+(cErr.get()&&D.n===4?"（式が未知数より多く、誤差があるので、全部の円を 1 点で交わらせる b̂ は無い。ずれが最も小さい解。6 章）":(cErr.get()?"（3 つなら誤差があっても 1 点で交わる b̂ があるが、その点は本当の位置からずれる）":""))+"<br>";}
      ro.innerHTML=h+'<div class="wnote">衛星の時計は正しいとし、受信機の時計だけがずれているとした。「円のずれ」は、b̂ ごとに、どの円にも最も近い点を探し、その点から各円までの距離を 2 乗して平均した値の平方根である。「ずれを解く」は、位置と b を一緒に求める計算（6 章で扱う方法）を使う。紫の曲線は S1・S2 の組、青緑は S2・S3 の組の双曲線。</div>';
    }
    draw();
  };

  /* ---- 5 節: 衛星の軌道と、スカイプロット（円軌道の近似。f01.py の _f01_const と同じ配置） ---- */
  var _W01_MU=3.986004418e14,_W01_WE=7.2921151467e-5,_W01_AW=6378137,_W01_FW=1/298.257223563,_W01_E2=_W01_FW*(2-_W01_FW),_W01_SID=2*Math.PI/_W01_WE;
  var _W01_SYS={GPS:["GPS","signal","G"],GLONASS:["GLONASS","purple","R"],Galileo:["Galileo","green","E"],BeiDou:["BeiDou","gold","C"],QZSS:["みちびき","teal","J"]};
  function _w01_geod(B,L,h){B*=_W01_D;L*=_W01_D;var N=_W01_AW/Math.sqrt(1-_W01_E2*Math.sin(B)*Math.sin(B));return [(N+h)*Math.cos(B)*Math.cos(L),(N+h)*Math.cos(B)*Math.sin(L),(N*(1-_W01_E2)+h)*Math.sin(B)];}
  function _w01_kep(a,e,i,w,Om,M){M*=_W01_D;var E=M;for(var k=0;k<30;k++)E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
    var nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2)),r=a*(1-e*Math.cos(E)),u=w*_W01_D+nu,O=Om*_W01_D,inc=i*_W01_D;
    return [r*(Math.cos(O)*Math.cos(u)-Math.sin(O)*Math.sin(u)*Math.cos(inc)),r*(Math.sin(O)*Math.cos(u)+Math.cos(O)*Math.sin(u)*Math.cos(inc)),r*Math.sin(u)*Math.sin(inc)];}
  function _w01_walker(sys,a,inc,P,S,F,Om0){var o=[];for(var p=0;p<P;p++)for(var s=0;s<S;s++)o.push({sys:sys,a:a,e:0,i:inc,w:0,Om:Om0+360*p/P,M:360*s/S+360*F*p/(P*S),nm:_W01_SYS[sys][2]+(p*S+s+1)});return o;}
  var _W01_CON=null;
  function _w01_const(){if(_W01_CON)return _W01_CON;var S=[].concat(_w01_walker("GPS",26560e3,55,6,4,1,0),_w01_walker("GLONASS",25510e3,64.8,3,8,1,15),_w01_walker("Galileo",29600e3,56,3,8,1,40),_w01_walker("BeiDou",27906e3,55,3,8,1,70));
    for(var k=0;k<3;k++)S.push({sys:"QZSS",a:42164e3,e:0.075,i:41,w:270,Om:166+120*k,M:60-120*k,nm:"J"+(k+1)});
    S.push({sys:"QZSS",a:42164e3,geo:127,nm:"J4"});_W01_CON=S;return S;}
  function _w01_eci(s,t){if(s.geo!=null){var th=_W01_WE*t+s.geo*_W01_D;return [s.a*Math.cos(th),s.a*Math.sin(th),0];}
    var n=Math.sqrt(_W01_MU/Math.pow(s.a,3))/_W01_D;return _w01_kep(s.a,s.e,s.i,s.w,s.Om,s.M+n*t);}
  function _w01_e2f(p,t){var th=_W01_WE*t,c=Math.cos(th),s=Math.sin(th);return [p[0]*c+p[1]*s,-p[0]*s+p[1]*c,p[2]];}
  function _w01_ecef(s,t){return _w01_e2f(_w01_eci(s,t),t);}
  /* 受信機 rx = {B, L, h, r0}（r0 は ECEF）から見た仰角・方位角 [°] と距離 [m] */
  function _w01_elaz(rx,p){var d=[p[0]-rx.r0[0],p[1]-rx.r0[1],p[2]-rx.r0[2]],b=rx.B*_W01_D,l=rx.L*_W01_D;
    var e=-Math.sin(l)*d[0]+Math.cos(l)*d[1],n=-Math.sin(b)*Math.cos(l)*d[0]-Math.sin(b)*Math.sin(l)*d[1]+Math.cos(b)*d[2],u=Math.cos(b)*Math.cos(l)*d[0]+Math.cos(b)*Math.sin(l)*d[1]+Math.sin(b)*d[2];
    return [Math.atan2(u,Math.hypot(e,n))/_W01_D,(Math.atan2(e,n)/_W01_D+360)%360,Math.hypot(d[0],d[1],d[2])];}
  /* スカイプロット（f01.py の _f01_sky と同じ見た目）。中心が真上、外の円が地平線、上が北・右が東。中心からの距離は 90° − 仰角 に比例。
     sats = [{el, az, name, col, hl}]、o = {trails: [{pts: [[el, az], …], col}], labels, sz, dot} */
  function _w01_skyxy(cx,cy,R,el,az){var r=R*(90-el)/90;return [cx+r*Math.sin(az*_W01_D),cy-r*Math.cos(az*_W01_D)];}
  function _w01_sky(U,cx,cy,R,sats,o){var S=U.S,s=[];o=o||{};var dot=o.dot||4.2,sz=o.sz||9.5;
    s.push(S.CIRC(cx,cy,R,"muted",1.3,"var(--screen)"));
    for(var az=0;az<360;az+=30){var q=_w01_skyxy(cx,cy,R,0,az);s.push(S.L(cx,cy,q[0],q[1],"grid",1));}
    [30,60].forEach(function(e){s.push(S.CIRC(cx,cy,R*(90-e)/90,"faint",0.9,null,"3 3"));});
    s.push(S.L(cx-4,cy,cx+4,cy,"muted",1));s.push(S.L(cx,cy-4,cx,cy+4,"muted",1));
    [0,30,60].forEach(function(e){s.push(S.T(cx+3,cy-R*(90-e)/90+11,e+"°","start",9.5,"muted",false,false,null,true));});
    [[0,"北"],[90,"東"],[180,"南"],[270,"西"]].forEach(function(d){var q=_w01_skyxy(cx,cy,R+11,0,d[0]);s.push(S.T(q[0],q[1]+4,d[1],"middle",10,"ink",true));});
    (o.trails||[]).forEach(function(tr){var seg=[];tr.pts.forEach(function(p){if(p[0]>=0)seg.push(_w01_skyxy(cx,cy,R,p[0],p[1]));else{if(seg.length>1)s.push(S.PL(seg,tr.col,1.2,null,"2 2"));seg=[];}});if(seg.length>1)s.push(S.PL(seg,tr.col,1.2,null,"2 2"));});
    sats.forEach(function(p){if(p.el<0)return;var q=_w01_skyxy(cx,cy,R,p.el,p.az);if(p.hl)s.push(S.CIRC(q[0],q[1],dot+4,p.col,1.8));s.push(S.D(q[0],q[1],p.col,dot));
      if(o.labels!==false&&p.name)s.push(S.T(q[0]+dot+2,q[1]+3.5,p.name,"start",sz,p.col,true,false,null,true));});
    return s.join("");}
  var _W01_SITES=[["東京",35.681,139.767,40],["シドニー",-33.87,151.21,60],["ロンドン",51.51,-0.13,60],["シンガポール",1.29,103.85,20],["北極の近く（北緯 85°）",85,0,0]];
  function _w01_hm(h){var H=Math.floor(h+1e-9),M=Math.round((h-H)*60);if(M===60){H++;M=0;}return H+" 時間 "+(M<10?"0":"")+M+" 分";}
  REG.w01_orbit=function(el,U){
    var S=U.S,CON=_w01_const();
    U.head(el,"ORBITS AND SKY","衛星の軌道（宇宙から見た図）と、受信機から見た空（スカイプロット）");
    var r1=U.ctrls(el);
    var sysSel=U.select(r1,"衛星系",["GPS","GLONASS","Galileo","BeiDou","みちびき","全部"],0,function(){pick=null;draw();});
    var siteSel=U.select(r1,"受信機の場所",_W01_SITES.map(function(s){return s[0];}),0,function(){pick=null;draw();});
    var r2=U.ctrls(el);
    var tt=U.slider(r2,"時刻",{min:0,max:24,step:0.05,value:0,fmt:function(v){return _w01_hm(v);},onInput:function(){draw();}});
    tt.el.style.flex="1 1 100%";
    var r3=U.ctrls(el);
    var cTr=U.checkbox(r3,"空を横切った跡（直前の 4 時間）",true,function(){draw();});
    var cRot=U.checkbox(r3,"左の図を地球と一緒に回す",false,function(){draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.05;if(v>24){v=24;tick.stop();}tt.set(v);draw();},40);
    U.button(br,"再生",function(){if(tt.get()>=24)tt.set(0);tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"本文の例（東京・GPS・時刻 0）",function(){tick.stop();sysSel.set(0);siteSel.set(0);tt.set(0);cTr.set(true);cRot.set(false);pick=null;draw();});
    var box=U.svgbox(el),ro=U.readout(el),pick=null,SK=null;
    U.ctl.drag(box,function(type,x,y){
      if(type!=="down"||!SK)return false;
      if(Math.hypot(x-SK.cx,y-SK.cy)>SK.R+8)return false;
      var best=null,bd=14;SK.pts.forEach(function(q){var d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=q.nm;}});
      pick=best;draw();return false;});
    function sel(){var k=sysSel.get(),keys=["GPS","GLONASS","Galileo","BeiDou","QZSS"];return k===5?keys:[keys[k]];}
    function draw(){
      var keys=sel(),site=_W01_SITES[siteSel.get()],rx={B:site[1],L:site[2],h:site[3],r0:_w01_geod(site[1],site[2],site[3])};
      var t=tt.get()*3600,sats=CON.filter(function(s){return keys.indexOf(s.sys)>=0;}),nar=_w01_nar(box),Wd=nar?400:700,o=[];
      /* ---- 左: 宇宙から見た図（正射影。大きさの比は実際のとおり） ---- */
      var rmax=0;sats.forEach(function(s){rmax=Math.max(rmax,s.a*(1+(s.e||0)));});rmax*=1.04;
      var cx=nar?200:178,cy=nar?176:190,half=nar?150:162,sc=half/rmax;
      var vaz=(site[2]-25+(cRot.get()?_W01_WE*t/_W01_D:0))*_W01_D,vel=(site[1]>60?50:22)*_W01_D;
      var vr=[-Math.sin(vaz),Math.cos(vaz),0],vu=[-Math.sin(vel)*Math.cos(vaz),-Math.sin(vel)*Math.sin(vaz),Math.cos(vel)],vd=[Math.cos(vel)*Math.cos(vaz),Math.cos(vel)*Math.sin(vaz),Math.sin(vel)];
      function pr(p){return [cx+sc*(p[0]*vr[0]+p[1]*vr[1]+p[2]*vr[2]),cy-sc*(p[0]*vu[0]+p[1]*vu[1]+p[2]*vu[2]),p[0]*vd[0]+p[1]*vd[1]+p[2]*vd[2]];}
      function hidden(q){return q[2]<0&&Math.hypot(q[0]-cx,q[1]-cy)<_W01_RE*sc;}
      o.push(S.T(nar?8:14,16,"宇宙から見た図（地球と軌道の大きさの比は実際のとおり）","start",10,"ink",true));
      o.push(S.RECT(nar?6:14,24,nar?388:330,nar?306:332,4,"var(--screen)","line",1));
      /* 軌道（面ごとに 1 本）: 奥の半分は破線、地球の陰は描かない */
      var seen={};
      sats.forEach(function(s){var key=s.geo!=null?"geo":(s.sys+":"+s.Om.toFixed(3));if(seen[key])return;seen[key]=1;
        var c=_W01_SYS[s.sys][1],seg=[],front=null;
        for(var j=0;j<=120;j++){var p=s.geo!=null?[s.a*Math.cos(2*Math.PI*j/120),s.a*Math.sin(2*Math.PI*j/120),0]:_w01_kep(s.a,s.e,s.i,s.w,s.Om,360*j/120),q=pr(p),f=q[2]>=0;
          if(hidden(q)){if(seg.length>1)o.push(S.PL(seg,c,front?1.2:0.9,null,front?null:"3 3"));seg=[];front=null;continue;}
          if(front!==null&&f!==front){seg.push([q[0],q[1]]);o.push(S.PL(seg,c,front?1.2:0.9,null,front?null:"3 3"));seg=[];}
          seg.push([q[0],q[1]]);front=f;}
        if(seg.length>1)o.push(S.PL(seg,c,front?1.2:0.9,null,front?null:"3 3"));});
      /* 地球（経線は地球と一緒に回る） */
      o.push(S.CIRC(cx,cy,_W01_RE*sc,"green",1.3,"var(--green-soft)"));
      var th=_W01_WE*t;
      for(var lon=0;lon<360;lon+=30){var seg2=[];for(var la=-90;la<=90;la+=10){var L=lon*_W01_D+th,B=la*_W01_D,q=pr([_W01_RE*Math.cos(B)*Math.cos(L),_W01_RE*Math.cos(B)*Math.sin(L),_W01_RE*Math.sin(B)]);if(q[2]>=0)seg2.push([q[0],q[1]]);else{if(seg2.length>1)o.push(S.PL(seg2,"green",0.6));seg2=[];}}if(seg2.length>1)o.push(S.PL(seg2,"green",0.6));}
      var eqs=[];for(var j2=0;j2<=72;j2++){var a2=2*Math.PI*j2/72,q2=pr([_W01_RE*Math.cos(a2),_W01_RE*Math.sin(a2),0]);if(q2[2]>=0)eqs.push([q2[0],q2[1]]);else{if(eqs.length>1)o.push(S.PL(eqs,"green",1));eqs=[];}}if(eqs.length>1)o.push(S.PL(eqs,"green",1));
      /* 受信機 */
      var rxi=[rx.r0[0]*Math.cos(th)-rx.r0[1]*Math.sin(th),rx.r0[0]*Math.sin(th)+rx.r0[1]*Math.cos(th),rx.r0[2]],rq=pr(rxi),rxFront=rq[2]>=0;
      /* 衛星 */
      var vis=[],cnt={},skyS=[],trails=[];SK={cx:0,cy:0,R:0,pts:[]};
      sats.forEach(function(s){var pe=_w01_ecef(s,t),ea=_w01_elaz(rx,pe),q=pr(_w01_eci(s,t)),c=_W01_SYS[s.sys][1],v=ea[0]>0;
        if(v){cnt[s.sys]=(cnt[s.sys]||0)+1;vis.push({s:s,ea:ea});}
        if(!hidden(q)){if(v&&rxFront&&(keys.length===1||s.nm===pick))o.push('<line x1="'+rq[0].toFixed(2)+'" y1="'+rq[1].toFixed(2)+'" x2="'+q[0].toFixed(2)+'" y2="'+q[1].toFixed(2)+'" stroke="var(--ink)" stroke-opacity="0.45" stroke-width="1.1" stroke-dasharray="5 3"/>');
          if(s.nm===pick)o.push(S.CIRC(q[0],q[1],8,c,1.8));o.push(S.D(q[0],q[1],v?c:"faint",v?3.6:2.4));}
        skyS.push({el:ea[0],az:ea[1],name:s.nm,col:c,hl:s.nm===pick});
        if(cTr.get()){var pts=[];for(var m=48;m>=0;m--){var tq=t-m*300;var eb=_w01_elaz(rx,_w01_ecef(s,tq));pts.push([eb[0],eb[1]]);}trails.push({pts:pts,col:c});}});
      if(rxFront)o.push(_w01_rx(U,rq[0],rq[1]-3));else o.push(S.CIRC(rq[0],rq[1],4,"green",1.2,null,"2 2"));
      var sbx=nar?16:24,sby=nar?320:346,sbl=1e7*sc;o.push(S.L(sbx,sby,sbx+sbl,sby,"ink",1.6));o.push(S.L(sbx,sby-4,sbx,sby+4,"ink",1.2));o.push(S.L(sbx+sbl,sby-4,sbx+sbl,sby+4,"ink",1.2));
      o.push(S.T(sbx+sbl+6,sby+4,"1 万 km"+(rxFront?"":"（受信機は地球の裏側）"),"start",9.5,"muted"));
      /* ---- 右（狭い画面では下）: スカイプロット ---- */
      var scx=nar?200:530,scy=nar?(sby+178):190,sR=nar?140:140;
      o.push(S.T(nar?8:372,nar?sby+22:16,"スカイプロット（"+site[0]+"から見た空）","start",10,"ink",true));
      o.push(_w01_sky(U,scx,scy,sR,skyS,{trails:trails,labels:keys.length===1||sats.length<30,dot:keys.length===1?4.2:3.4,sz:9.5}));
      skyS.forEach(function(p){if(p.el>=0){var q=_w01_skyxy(scx,scy,sR,p.el,p.az);SK.pts.push({x:q[0],y:q[1],nm:p.name});}});SK.cx=scx;SK.cy=scy;SK.R=sR;
      o.push(S.T(scx,scy+sR+(nar?40:44),"点を押すと、その衛星を左の図でも強調する","middle",9.5,"muted"));
      box.set(S.svg(Wd,nar?scy+sR+50:Math.max(sby+16,scy+sR+50),o));
      /* ---- 読み出し ---- */
      var tot=0,parts=keys.map(function(kk){tot+=(cnt[kk]||0);return '<span style="color:'+U.col(_W01_SYS[kk][1])+'"><b>'+_W01_SYS[kk][0]+" "+(cnt[kk]||0)+" 機</b></span>";});
      var h="時刻 "+_w01_hm(tt.get())+"、"+site[0]+"から地平線より上に見える衛星: "+parts.join("・")+(keys.length>1?"（合計 <b>"+tot+" 機</b>）":"")+"<br>";
      if(keys.length===1&&keys[0]!=="QZSS"){var a=sats[0].a,Tp=2*Math.PI*Math.sqrt(Math.pow(a,3)/_W01_MU);h+="軌道の半径 "+_w01_g(a/1e3,0)+" km（高さ 約 "+_w01_g(Math.round((a-_W01_RE)/1e4)*10,0)+" km）、周期 T<sub>orb</sub> = 2π√(a³/μ) = <b>"+_w01_hm(Tp/3600)+"</b>、速さ √(μ/a) = "+_w01_f(Math.sqrt(_W01_MU/a)/1e3,2)+" km/s<br>";}
      if(keys.length===1&&keys[0]==="QZSS")h+="準天頂軌道（J1〜J3）: 周期 1 恒星日（23 時間 56 分）、地球の中心からの距離 39 000〜45 300 km。J4 は東経 127° の静止軌道<br>";
      if(pick){var ps=CON.filter(function(s){return s.nm===pick;})[0];if(ps&&keys.indexOf(ps.sys)>=0){var e2=_w01_elaz(rx,_w01_ecef(ps,t));
        h+="<b>"+pick+"</b>: 仰角 θ = "+_w01_f(e2[0],1)+"°、方位角 α = "+_w01_f(e2[1],1)+"°、距離 "+_w01_g(e2[2]/1e3,0)+" km（電波は "+_w01_f(e2[2]/_W01_C*1e3,1)+" ms で届く）"+(e2[0]<0?'（<span class="warn">地平線より下で見えない</span>）':"")+"<br>";}}
      ro.innerHTML=h+'<div class="wnote">左の図の破線は、受信機から地平線より上に見える衛星への向き。軌道は円（みちびきの準天頂軌道だけは楕円）で近似し、衛星は各面に等間隔に置いた。時刻 0 は、この章の図と同じ配置の時刻で、実際の衛星の位置ではない。BeiDou は中軌道の衛星だけを描いた。名前の最初の文字は衛星系（G: GPS、R: GLONASS、E: Galileo、C: BeiDou、J: みちびき）。</div>';
    }
    draw();
  };

  /* ===== 02 章 衛星の信号 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w02_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w02_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた数 */
  function _w02_g(v,d){var s=_w02_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");
    var fr=p.length>1?p[1].replace(/(\d{3})(?=\d)/g,"$1 "):"";return (neg?"−":"")+i+(fr?"."+fr:"");}
  var _W02_C=299792458,_W02_TC=1/1.023e6;
  /* PRN 番号ごとの G2 の 2 つの段（IS-GPS-200 の表）と、最初の 10 チップの 8 進（同じ表） */
  var _W02_TAPS=[null,[2,6],[3,7],[4,8],[5,9],[1,9],[2,10],[1,8],[2,9],[3,10],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[9,10],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[1,3],[4,6],[5,7],[6,8],[7,9],[8,10],[1,6],[2,7],[3,8],[4,9]];
  var _W02_OCT=[null,"1440","1620","1710","1744","1133","1455","1131","1454","1626","1504","1642","1750","1764","1772","1775","1776","1156","1467","1633","1715","1746","1763","1063","1706","1743","1761","1770","1774","1127","1453","1625","1712"];
  /* C/A 符号（0/1 の配列、長さ 1023）。G1・G2 を全部 1 から始め、出力 = G1[10] xor G2[a] xor G2[b] */
  var _W02_CODES={};
  function _w02_ca(prn){if(_W02_CODES[prn])return _W02_CODES[prn];var g1=[1,1,1,1,1,1,1,1,1,1],g2=[1,1,1,1,1,1,1,1,1,1],t=_W02_TAPS[prn],o=new Int8Array(1023);
    for(var n=0;n<1023;n++){o[n]=g1[9]^g2[t[0]-1]^g2[t[1]-1];var f1=g1[2]^g1[9],f2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];g1.unshift(f1);g1.pop();g2.unshift(f2);g2.pop();}
    _W02_CODES[prn]=o;return o;}
  /* 0 → +1、1 → −1 */
  function _w02_pm(prn){var c=_w02_ca(prn),o=new Float64Array(1023);for(var i=0;i<1023;i++)o[i]=1-2*c[i];return o;}
  /* ±1 の階段の波形（画面の座標。x0 から 1 つの値を cw ずつ、+1 が上） */
  function _w02_wave(S,x0,ym,amp,vals,cw,c,lw){var p=[],prev=null;for(var i=0;i<vals.length;i++){var v=vals[i],x=x0+i*cw;if(prev!==null&&prev!==v)p.push([x,ym-amp*prev]);p.push([x,ym-amp*v]);prev=v;}
    p.push([x0+vals.length*cw,ym-amp*prev]);return S.PL(p,c,lw||1.6);}
  function _w02_xor(S,x,y,c,r){r=r||8;return S.CIRC(x,y,r,c,1.4,"screen")+S.L(x-r,y,x+r,y,c,1.2)+S.L(x,y-r,x,y+r,c,1.2);}

  /* ---- 2 節: G1・G2 のシフトレジスタを 1 クロックずつ動かす ---- */
  REG.w02_gold=function(el,U){
    var S=U.S;
    U.head(el,"GOLD CODE","C/A 符号を作る — G1・G2 のシフトレジスタを 1 クロックずつ進める");
    var r1=U.ctrls(el),prns=[];for(var p=1;p<=32;p++)prns.push("PRN "+p+"（G2 の "+_W02_TAPS[p][0]+"・"+_W02_TAPS[p][1]+" 段目）");
    var sel=U.select(r1,"衛星の番号（PRN 番号）",prns,0,function(){reset();draw();});
    var br=U.btnrow(el);
    U.button(br,"1 クロック進める",function(){step(1);draw();});
    U.button(br,"10 クロック進める",function(){step(10);draw();});
    U.button(br,"1 周期（1023 クロック）進める",function(){step(1023);draw();});
    U.button(br,"はじめに戻す",function(){reset();draw();});
    U.button(br,"本文の例（PRN 1）",function(){sel.set(0);reset();step(10);draw();});
    var box=U.svgbox(el),ro=U.readout(el),g1,g2,out,n,last;
    /* G2 の 2 つの段の排他的論理和が、G2 の出力（10 段目）を何チップ遅らせた列か（全部のずれを調べる） */
    var DL={};
    function delayOf(prn){if(DL[prn]!=null)return DL[prn];var a=[1,1,1,1,1,1,1,1,1,1],t=_W02_TAPS[prn],ps=new Int8Array(1023),g10=new Int8Array(1023);
      for(var i=0;i<1023;i++){ps[i]=a[t[0]-1]^a[t[1]-1];g10[i]=a[9];var f=a[1]^a[2]^a[5]^a[7]^a[8]^a[9];a.unshift(f);a.pop();}
      for(var d=0;d<1023;d++){var ok=true;for(var j=0;j<1023&&ok;j++)if(ps[j]!==g10[(j-d+1023)%1023])ok=false;if(ok){DL[prn]=d;return d;}}DL[prn]=-1;return -1;}
    function prn(){return sel.get()+1;}
    function reset(){g1=[1,1,1,1,1,1,1,1,1,1];g2=[1,1,1,1,1,1,1,1,1,1];out=[];n=0;last=null;}
    function step(k){var t=_W02_TAPS[prn()];for(var i=0;i<k;i++){var o1=g1[9],ps=g2[t[0]-1]^g2[t[1]-1],ch=o1^ps,f1=g1[2]^g1[9],f2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];
      last={g1:g1.slice(),g2:g2.slice(),o1:o1,ps:ps,ch:ch,f1:f1,f2:f2};out.push(ch);g1.unshift(f1);g1.pop();g2.unshift(f2);g2.pop();n++;}}
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],t=_W02_TAPS[prn()],cw=nar?24:30,x0=nar?58:150,yA=44,yB=nar?158:150;
      var cx=function(j){return x0+(j-0.5)*cw;};
      o.push(S.T(nar?8:14,16,"クロック "+n+" 回（次に出すのは "+n+" 番のチップ。番号は 0 から）","start",11,"ink",true));
      function reg(y,vals,taps,c,nm){
        for(var j=0;j<10;j++){var on=taps.indexOf(j+1)>=0;o.push(S.RECT(x0+j*cw,y,cw,24,2,on?U.soft(c):"panel",on?c:"line",on?1.6:1.1));
          o.push(S.T(x0+j*cw+cw/2,y+17,String(vals[j]),"middle",12,"ink",true,true));o.push(S.T(x0+j*cw+cw/2,y-4,String(j+1),"middle",9,"muted"));}
        o.push(S.T(x0-(nar?44:110),y+17,nm,"start",12,c,true));}
      /* G1 */
      reg(yA,g1,[3,10],"signal","G1");
      var fb1=g1[2]^g1[9];
      [3,10].forEach(function(j){o.push(S.L(cx(j),yA+24,cx(j),yA+40,"signal",1.4));o.push(S.D(cx(j),yA+40,"signal",2.6));});
      o.push(S.L(cx(10),yA+40,x0-22,yA+40,"signal",1.4));o.push(_w02_xor(S,x0-14,yA+40,"signal"));o.push(S.L(x0-14,yA+32,x0-14,yA+12,"signal",1.4));o.push(S.ARR(x0-14,yA+12,x0,yA+12,"signal",1.4,6));
      o.push(S.T(cx(6),yA+53,"帰還: "+g1[2]+" ⊕ "+g1[9]+" = "+fb1+"（次に 1 段目へ）","middle",9.5,"signal",false,false,null,true));
      /* G2 */
      reg(yB,g2,[2,3,6,8,9,10],"green","G2");
      var fb2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];
      [2,3,6,8,9,10].forEach(function(j){o.push(S.L(cx(j),yB+24,cx(j),yB+40,"green",1.4));o.push(S.D(cx(j),yB+40,"green",2.6));});
      o.push(S.L(cx(10),yB+40,x0-22,yB+40,"green",1.4));o.push(_w02_xor(S,x0-14,yB+40,"green"));o.push(S.L(x0-14,yB+32,x0-14,yB+12,"green",1.4));o.push(S.ARR(x0-14,yB+12,x0,yB+12,"green",1.4,6));
      o.push(S.T(cx(6),yB+53,"帰還: "+[g2[1],g2[2],g2[5],g2[7],g2[8],g2[9]].join(" ⊕ ")+" = "+fb2,"middle",9.5,"green",false,false,null,true));
      /* 位相を選ぶ 2 つの段 */
      var ys=yB-22,ps=g2[t[0]-1]^g2[t[1]-1],xs=x0+10*cw+(nar?30:50),xf=xs+(nar?40:60),yf=(yA+12+ys)/2;
      t.forEach(function(j){o.push(S.L(cx(j),yB,cx(j),ys,"gold",1.6));o.push(S.D(cx(j),ys,"gold",2.8));o.push(S.RECT(x0+(j-1)*cw,yB,cw,24,2,"none","gold",2.2));});
      o.push(S.L(cx(Math.min(t[0],t[1])),ys,xs-8,ys,"gold",1.6));o.push(_w02_xor(S,xs,ys,"gold"));
      o.push(S.T(cx((t[0]+t[1])/2),ys-6,"PRN "+prn()+" の段 "+t[0]+"・"+t[1]+": "+g2[t[0]-1]+" ⊕ "+g2[t[1]-1]+" = "+ps,"middle",9.5,"gold",true,false,null,true));
      o.push(S.L(x0+10*cw,yA+12,xf,yA+12,"signal",1.6));o.push(S.ARR(xf,yA+12,xf,yf-8,"signal",1.6,6));
      o.push(S.L(xs+8,ys,xf,ys,"gold",1.6));o.push(S.ARR(xf,ys,xf,yf+8,"gold",1.6,6));
      var ch=g1[9]^ps;
      o.push(_w02_xor(S,xf,yf,"ink"));
      if(!nar){o.push(S.ARR(xf+8,yf,xf+36,yf,"ink",1.8));o.push(S.CIRC(xf+52,yf,14,"ink",1.8,ch?"var(--muted-soft)":U.soft("signal")));o.push(S.T(xf+52,yf+5,String(ch),"middle",13,"ink",true,true));
        o.push(S.T(xf+52,yf+30,"出すチップ","middle",9.5,"ink",true));o.push(S.T(xf+52,yf+43,ch?"（−1）":"（+1）","middle",9.5,"muted"));}
      else{o.push(S.T(xf,yf+26,"→ "+ch,"middle",12,"ink",true,true));}
      /* 出したチップの列 */
      var yo=yB+80,show=nar?28:44,st=Math.max(0,out.length-show),seg=out.slice(st),cw2=(Wd-(nar?52:80)-12)/show,xo=nar?52:80;
      o.push(S.T(nar?8:14,yo,"出したチップ（最後の "+show+" 個まで。0 → +1、1 → −1）","start",10.5,"ink",true));
      o.push(S.RECT(xo,yo+10,show*cw2,44,3,"screen","line",0.8));
      if(seg.length){o.push(_w02_wave(S,xo,yo+38,11,seg.map(function(b){return 1-2*b;}),cw2,"signal",1.8));
        seg.forEach(function(b,i){if(cw2>=8)o.push(S.T(xo+(i+0.5)*cw2,yo+22,String(b),"middle",8.5,(st+i)<10?"signal":"muted",(st+i)<10,true));});
        o.push(S.T(xo-4,yo+42,st>0?String(st):"0","end",9,"muted"));o.push(S.T(xo+seg.length*cw2,yo+66,String(out.length-1),"middle",9,"muted"));}
      var oct=out.length>=10?(parseInt(out.slice(0,10).join(""),2).toString(8)):"",mt=oct===_W02_OCT[prn()];
      var ones=0;out.forEach(function(b){ones+=b;});
      var back=n>0&&g1.join("")==="1111111111"&&g2.join("")==="1111111111";
      var hy=yo+86;
      o.push(S.T(nar?8:14,hy,"最初の 10 チップ: "+(out.length>=10?out.slice(0,10).join("")+" → 8 進 "+oct:"（10 クロック進めると表示）"),"start",10.5,out.length>=10?(mt?"green":"alias"):"muted",true));
      if(out.length>=10)o.push(S.T(nar?8:14,hy+17,"規格の表の値 "+_W02_OCT[prn()]+(mt?"（一致）":"（不一致）"),"start",10,mt?"green":"alias",true));
      box.set(S.svg(Wd,hy+28,o));
      var d=delayOf(prn()),h="";
      h+="クロック <b>"+n+"</b> 回。出したチップ "+out.length+" 個のうち 1 が "+ones+" 個、0 が "+(out.length-ones)+" 個"+(out.length===1023?"（1 周期分。1 が 512、0 が 511）":"")+"<br>";
      if(last)h+="直前のクロック: 出力 = G1 の 10 段目 "+last.o1+" ⊕ （G2 の "+t[0]+"・"+t[1]+" 段目の排他的論理和 "+last.ps+"） = <b>"+last.ch+"</b>（"+(last.ch?"−1":"+1")+"）。帰還 G1 → "+last.f1+"、G2 → "+last.f2+" を 1 段目に入れた<br>";
      if(back)h+='<span class="ok">G1・G2 の全部の段が初めの 1 に戻った</span>（'+n+" クロック。C/A 符号は 1023 チップごとに繰り返す）<br>";
      h+="G2 の "+t[0]+"・"+t[1]+" 段目の排他的論理和の列は、G2 の 10 段目の出力を <b>"+d+" チップ</b>遅らせた列に等しい（全部のずれを調べて求めた値。規格の表の「G2 の遅れ」）";
      ro.innerHTML=h+'<div class="wnote">⊕ は排他的論理和（同じなら 0、違えば 1）。各クロックで、まず今の段の値から出力のチップと帰還の値を計算し、全体を 1 段ずつ右へ送って、帰還の値を 1 段目に入れる。8 進は、最初の 10 チップを左から 1 桁と 3 桁ずつに区切って読む。</div>';
    }
    reset();step(10);draw();
  };

  /* ---- 3 節: 相関 — 手元の符号をずらしながら、掛けて足す ---- */
  var _W02_DLY=[0,120.25,487.60,801.90];
  REG.w02_corr=function(el,U){
    var S=U.S,K=8,NS=1023*K;
    U.head(el,"CORRELATION","相関 — 手元の符号をずらしながら、受けた信号と掛けて足す");
    var r1=U.ctrls(el);
    var sig=U.select(r1,"受けた信号",["PRN 1 の 1 機だけ","PRN 1・2・3 の 3 機（本文の図）"],1,function(){gen();});
    var loc=U.select(r1,"手元で作る符号",["PRN 1","PRN 2","PRN 3","PRN 4（受けた信号に無い）"],0,function(){corr();draw();});
    var r2=U.ctrls(el);
    var amp=U.slider(r2,"PRN 2・3 の強さ（PRN 1 の振幅に対する倍率）",{values:[1,3,10,20],value:1,fmt:function(v){return v+" 倍";},onInput:function(){gen();}});
    var sg=U.slider(r2,"雑音の大きさ σ（1 チップの平均の標準偏差）",{values:[0,1,2,4,8,16,32],value:0,fmt:function(v){return String(v);},onInput:function(){gen();}});
    var mm=U.slider(r2,"足す周期の数（1 周期 = 1 ms）",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" 周期（"+v+" ms）";},onInput:function(){gen();}});
    var r3=U.ctrls(el);
    var tau=U.slider(r3,"手元の符号のずれ τ",{min:0,max:1022.875,step:0.125,value:120.25,fmt:function(v){return _w02_f(v,3)+" チップ（"+_w02_f(v*_W02_TC*1e6,3)+" μs）";},onInput:function(){scanTo=-1;draw();}});
    tau.el.style.flex="1 1 100%";
    var br=U.btnrow(el),seed=1,scanTo=-1;
    var tick=U.ticker(function(){scanTo+=6;if(scanTo>=1023){scanTo=-1;tick.stop();}tau.set(Math.min(1022.875,Math.max(0,scanTo<0?1022.875:scanTo)));draw();},40);
    U.button(br,"本文の例（3 機・雑音なし）",function(){tick.stop();scanTo=-1;sig.set(1);loc.set(0);amp.set(1);sg.set(0);mm.set(1);tau.set(120.25);seed=1;gen();});
    U.button(br,"走査（ずれを 0 から動かす）",function(){scanTo=0;tau.set(0);tick.start();draw();});
    U.button(br,"止める",function(){tick.stop();scanTo=-1;draw();});
    U.button(br,"いちばん高い山へ",function(){tick.stop();scanTo=-1;tau.set(peak().t);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();});
    var box=U.svgbox(el),ro=U.readout(el);
    var rbar=new Float64Array(NS),one=new Float64Array(NS),P=new Float64Array(2*NS+1),C=new Float64Array(NS);
    /* 受けた信号: 衛星ごとの符号を遅らせて足し、1 標本ごとに雑音を足す（M 周期の平均） */
    function gen(){
      var nsat=sig.get()?3:1,A=[0,1,amp.get(),amp.get()],cs=[null,_w02_pm(1),_w02_pm(2),_w02_pm(3)],s,i;
      for(s=0;s<NS;s++){var v=0,t=(s+0.5)/K;for(i=1;i<=nsat;i++){var k=Math.floor(t-_W02_DLY[i]);v+=A[i]*cs[i][((k%1023)+1023)%1023];}one[s]=v;rbar[s]=v;}
      var sd=sg.get(),M=mm.get();
      if(sd>0){var g=U.rng(seed*7919+13),sc=sd*Math.sqrt(K);for(var m=0;m<M;m++)for(s=0;s<NS;s++)rbar[s]+=sc*g.normal()/M;}
      corr();draw();}
    /* 全部のずれ（1/8 チップごと）の相関。R(j) = (1/K) Σ_n c[n] (P[Kn+j+K] − P[Kn+j])（P は 2 周期分の和の表） */
    function corr(){var c=_w02_pm(loc.get()+1),s,j,n;P[0]=0;for(s=0;s<2*NS;s++)P[s+1]=P[s]+rbar[s%NS];
      for(j=0;j<NS;j++){var a=0;for(n=0;n<1023;n++){var b=K*n+j;a+=c[n]*(P[b+K]-P[b]);}C[j]=a/K;}}
    function peak(){var bi=0;for(var j=1;j<NS;j++)if(C[j]>C[bi])bi=j;return {t:bi/K,v:C[bi]};}
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],xo=nar?44:70,pw=Wd-xo-(nar?10:16),t0=tau.get(),jt=Math.round(t0*K)%NS,lp=loc.get()+1,c=_w02_pm(lp);
      /* 上: 時間の見方（手元の符号の最初の 24 チップの所） */
      var nwin=nar?16:24,cwp=pw/nwin,ya=34;
      o.push(S.T(nar?6:14,16,"時間の見方: 手元の符号の 0〜"+(nwin-1)+" 番のチップの所（τ から "+nwin+" チップ分）","start",10.5,"ink",true));
      var lo=-1,hi=1;for(var s=0;s<nwin*K;s++){var v=rbar[(jt+s)%NS];lo=Math.min(lo,v);hi=Math.max(hi,v);}
      var sc=Math.max(Math.abs(lo),Math.abs(hi));
      var Pa=U.plot(xo,ya,pw,60,[0,nwin],[-sc*1.05,sc*1.05]);
      o.push(S.RECT(xo,ya,pw,60,3,"screen","line",0.8));o.push(S.L(xo,Pa.Y(0),xo+pw,Pa.Y(0),"grid",1));
      var pts=[];for(s=0;s<nwin*K;s++){var tt=s/K;pts.push([tt,rbar[(jt+s)%NS]]);pts.push([tt+1/K,rbar[(jt+s)%NS]]);}
      o.push(Pa.line(pts,"teal",1.1));
      o.push(S.T(xo-4,ya+12,"受けた","end",9,"teal",true));o.push(S.T(xo-4,ya+24,"信号","end",9,"teal",true));
      var yl=ya+76;o.push(S.T(xo-4,yl+4,"手元","end",9,"signal",true));
      var lv=[];for(var q=0;q<nwin;q++)lv.push(c[q]);o.push(_w02_wave(S,xo,yl,8,lv,cwp,"signal",1.6));
      var yp=yl+24,pr=[];for(q=0;q<nwin;q++){var sm=0;for(s=0;s<K;s++)sm+=rbar[(jt+q*K+s)%NS];pr.push(sm/K*c[q]);}
      var pm=0;pr.forEach(function(v){pm=Math.max(pm,Math.abs(v));});pm=Math.max(pm,1);
      o.push(S.T(xo-4,yp+10,"積","end",9,"ink",true));o.push(S.L(xo,yp+10,xo+pw,yp+10,"grid",1));
      pr.forEach(function(v,i){var hh=12*v/pm;o.push(S.RECT(xo+i*cwp+cwp*0.15,v>=0?yp+10-hh:yp+10,cwp*0.7,Math.abs(hh),1,v>=0?"green":"alias","none",0));});
      /* 中: 相関の曲線（1 ピクセルごとに最小と最大を結ぶ） */
      var yc=yp+44,ch=nar?110:130,mx=-1e9,mn=1e9,j;for(j=0;j<NS;j++){mx=Math.max(mx,C[j]);mn=Math.min(mn,C[j]);}
      var top=Math.max(1150,mx*1.08),bot=Math.min(-200,mn*1.1);
      var Pc=U.plot(xo,yc,pw,ch,[0,1023],[bot,top]);
      o.push(S.T(nar?6:14,yc-8,"相関の見方: 全部のずれ τ の相関 R(τ)"+(scanTo>=0?"（走査中）":""),"start",10.5,"ink",true));
      o.push(Pc.axes({xt:[0,256,512,768,1023],yt:U.nice(bot,top,4).filter(function(v){return v>=bot&&v<=top;}),xfmt:function(v){return String(v);},yfmt:function(v){return String(Math.round(v)).replace("-","−");},ylOff:nar?34:44}));
      var lim=scanTo>=0?Math.round(scanTo*K):NS,d="";
      for(var px=0;px<Math.round(pw);px++){var j0=Math.floor(px/pw*NS),j1=Math.min(NS,Math.floor((px+1)/pw*NS));if(j0>=lim)break;var a=1e9,b=-1e9;for(j=j0;j<Math.min(j1,lim);j++){a=Math.min(a,C[j]);b=Math.max(b,C[j]);}
        if(b>=a)d+="M"+(xo+px+0.5).toFixed(1)+","+Pc.Y(b).toFixed(1)+"V"+(Pc.Y(a)+0.6).toFixed(1);}
      o.push(S.PATH(d,"signal",1.1));
      o.push(S.L(Pc.X(t0),yc,Pc.X(t0),yc+ch,"ink",1.2,"3 3"));o.push(S.D(Pc.X(t0),Pc.Y(C[jt]),"gold",4.5));
      var pk=peak();if(scanTo<0){o.push(S.T(Pc.X(pk.t)+(pk.t>900?-6:6),Pc.Y(pk.v)+4,"山 "+_w02_f(pk.t,3),pk.t>900?"end":"start",9.5,"signal",true,false,null,true));}
      o.push(S.T(xo+pw/2,yc+ch+30,"手元の符号のずれ τ [チップ]（1023 チップ = 1 ms）","middle",10,"muted"));
      /* 下: τ のまわりを拡大 */
      var yz=yc+ch+52,zh=nar?90:100,Z=U.plot(xo,yz,pw,zh,[t0-4,t0+4],[bot,top]);
      o.push(S.T(nar?6:14,yz-8,"τ のまわり ±4 チップを拡大（1 チップ = 293 m）","start",10.5,"ink",true));
      o.push(Z.axes({xt:[-4,-2,0,2,4].map(function(v){return t0+v;}),yt:U.nice(bot,top,3).filter(function(v){return v>=bot&&v<=top;}),xfmt:function(v){return _w02_f(v,2);},yfmt:function(v){return String(Math.round(v)).replace("-","−");},ylOff:nar?34:44}));
      var zp=[];for(var m=-32;m<=32;m++){var jj=((jt+m)%NS+NS)%NS;zp.push([t0+m/K,C[jj]]);}
      o.push(Z.line(zp,"signal",2));o.push(S.D(Z.X(t0),Z.Y(C[jt]),"gold",4.5));
      o.push(S.T(xo+pw/2,yz+zh+30,"手元の符号のずれ τ [チップ]","middle",10,"muted"));
      box.set(S.svg(Wd,yz+zh+40,o));
      /* 読み出し */
      var nsat=sig.get()?3:1,inSig=lp<=nsat,M=mm.get(),sd=sg.get(),ns=sd*Math.sqrt(1023/M),h="";
      h+="手元の符号 PRN "+lp+"、ずれ τ = "+_w02_f(t0,3)+" チップ: 相関 R(τ) = <b>"+_w02_f(C[jt],1)+"</b>"+(scanTo>=0?"":"")+"<br>";
      h+="いちばん高い山: τ = <b>"+_w02_f(pk.t,3)+" チップ</b>（R = "+_w02_f(pk.v,1)+"）→ 届いた時間の 1 ms に満たない端数 "+_w02_f(pk.t*_W02_TC*1e6,3)+" μs、距離にして "+_w02_g(pk.t*_W02_TC*_W02_C/1e3,3)+" km（1 ms = 299.79 km ごとに同じ）<br>";
      if(inSig){var e=pk.t-_W02_DLY[lp];if(Math.abs(e)<1)h+='<span class="ok">本当の遅れ '+_w02_f(_W02_DLY[lp],2)+" チップの所に山がある</span>（読みとの差 "+_w02_f(e,3)+" チップ = "+_w02_f(e*_W02_TC*_W02_C,1)+" m。1/8 チップごとに計算した）<br>";
        else h+='<span class="warn">いちばん高い山が、本当の遅れ '+_w02_f(_W02_DLY[lp],2)+" チップの所に無い</span>（雑音、または強いほかの衛星の相互相関のため）<br>";}
      else h+="受けた信号に PRN "+lp+" の符号は無いので、どのずれでも相互相関の値（と雑音）しか出ない<br>";
      if(sd>0)h+="雑音による相関の揺れ（標準偏差）σ√(1023/M) = "+sd+" × √(1023/"+M+") = <b>"+_w02_f(ns,1)+"</b>。山の高さ 1023 の "+_w02_f(1023/ns,1)+" 倍"+(1023/ns<4?'（<span class="warn">山が雑音に埋もれやすい</span>）':"")+"<br>";
      if(nsat===3&&amp.get()>1)h+="PRN 2・3 は PRN 1 の "+amp.get()+" 倍の振幅で、その相互相関は最大 65 × "+amp.get()+" = "+(65*amp.get())+"（PRN 1 の山は 1023）<br>";
      ro.innerHTML=h+'<div class="wnote">受けた信号は、衛星ごとの C/A 符号（振幅 1。PRN 2・3 は倍率を掛ける）を、本文の図と同じ 120.25・487.60・801.90 チップだけ遅らせて足し、1 チップを 8 標本にして、標本ごとに雑音を足したもの（σ は 1 チップの 8 標本の平均の標準偏差）。足す周期の数 M は、同じ信号の M 周期分を平均してから相関をとる。搬送波とドップラーは取り除いてあるとした（4・5 章）。相関は、山の高さが 1023 になるように 8 で割った。</div>';
    }
    gen();
  };

  /* ---- 4 節: BPSK と BOC — 1 チップの形・スペクトラム・相関 ---- */
  /* その場で計算する FFT（基数 2。re と im を書き換える） */
  function _w02_fft(re,im){var n=re.length,i,j=0,k,len;for(i=1;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){var t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
    for(len=2;len<=n;len<<=1){var ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang),h=len>>1;for(i=0;i<n;i+=len){var cr=1,ci=0;for(k=0;k<h;k++){var a=i+k,b=a+h,br=re[b]*cr-im[b]*ci,bi=re[b]*ci+im[b]*cr;re[b]=re[a]-br;im[b]=im[a]-bi;re[a]+=br;im[a]+=bi;var t2=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t2;}}}}
  /* 1 チップの形の周波数の成分の大きさの 2 乗 |P(f)|²（f は MHz、Tc は μs。k は 1 チップの中の副搬送波の半周期の数、0 なら BPSK） */
  function _w02_P2(f,Tc,k){function sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
    if(k===0){var s=sinc(f*Tc);return Tc*Tc*s*s;}
    var th=2*Math.PI*f*Tc/k,re=0,im=0;for(var j=0;j<k;j++){var sg=j%2?-1:1;re+=sg*Math.cos(th*(j+0.5));im-=sg*Math.sin(th*(j+0.5));}
    var s2=sinc(f*Tc/k);return (Tc/k)*(Tc/k)*s2*s2*(re*re+im*im);}
  REG.w02_spectrum=function(el,U){
    var S=U.S,TCA=1/1.023;
    U.head(el,"SPECTRUM","BPSK と BOC — 1 チップの形と、スペクトラム・相関の形");
    var PRE=[{t:"BPSK(1)（GPS L1 の C/A 符号）",n:1,m:0},{t:"BPSK(10)（GPS L5）",n:10,m:0},{t:"BOC(1,1)（L1C・Galileo E1 の主な形）",n:1,m:1},{t:"BOC(6,1)",n:1,m:6},{t:"自分で選ぶ（下のつまみ）",n:null,m:null}];
    var r1=U.ctrls(el);
    var md=U.select(r1,"変調の形",PRE.map(function(p){return p.t;}),2,function(){var p=PRE[md.get()];if(p.n!=null){nr.set(p.n);sc.set(p.m);}draw();});
    var r2=U.ctrls(el);
    var nr=U.slider(r2,"チップレート（1.023 M チップ/s の何倍か）",{values:[0.5,1,2,5,10],value:1,fmt:function(v){return v+" 倍（"+_w02_f(v*1.023,4).replace(/0+$/,"").replace(/\.$/,"")+" M チップ/s）";},onInput:function(){md.set(4);draw();}});
    var sc=U.slider(r2,"副搬送波の周波数（1.023 MHz の何倍か。0 は BPSK）",{values:[0,0.5,1,1.5,2,2.5,3,5,6,10,15],value:1,fmt:function(v){return v?v+" 倍":"0（BPSK）";},onInput:function(){md.set(4);draw();}});
    var r3=U.ctrls(el);
    var bw=U.slider(r3,"受信機が受ける周波数の幅（中心のまわり）",{values:[1,2,4,8,16,24,40],value:1,fmt:function(v){return v+" MHz（±"+(v/2)+" MHz）";},onInput:function(){draw();}});
    var r4=U.ctrls(el);
    var ov=U.checkbox(r4,"C/A 符号（BPSK(1)）を重ねる",true,function(){draw();});
    var lg=U.checkbox(r4,"縦を対数の目盛にする",false,function(){draw();});
    var ff=U.checkbox(r4,"でたらめな符号を FFT したスペクトラムを重ねる",false,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（BOC(1,1) と C/A）",function(){md.set(2);nr.set(1);sc.set(1);bw.set(1);ov.set(true);lg.set(false);ff.set(false);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function cfg(){var n=nr.get(),m=sc.get(),k=m>0?Math.max(1,Math.round(2*m/n)):0;return {n:n,k:k,m:k?k*n/2:0,Tc:TCA/n};}
    function S_rel(f,c){return _w02_P2(f,c.Tc,c.k)/(c.Tc*TCA);}   /* C/A の中心を 1 とした比 */
    function inband(c,B){var N=4000,s=0,h=B/N;for(var i=0;i<=N;i++){var f=-B/2+i*h,w=(i===0||i===N)?0.5:1;s+=w*_w02_P2(f,c.Tc,c.k)/c.Tc*h;}return s;}
    function w90(c){var lo=0,hi=200;for(var it=0;it<40;it++){var mid=(lo+hi)/2;if(inband(c,2*mid)<0.9)lo=mid;else hi=mid;}return hi;}
    function acf(c){var N=240,p=[],i;for(i=0;i<N;i++){var j=c.k?Math.floor(i*c.k/N):0;p.push(c.k?(j%2?-1:1):1);}
      var out=[];for(var l=-N;l<=N;l++){var s=0;for(i=0;i<N;i++){var q=i-l;if(q>=0&&q<N)s+=p[i]*p[q];}out.push([l/N*c.Tc,s/N]);}return out;}
    function fftpsd(c){var Q=c.k?c.k*Math.ceil(Math.max(8,4*c.k)/c.k):8,L=4096,nseg=24,fs=Q/c.Tc,g=U.rng(seed*104729+7),acc=new Float64Array(L);
      for(var sg=0;sg<nseg;sg++){var re=new Float64Array(L),im=new Float64Array(L),v=0,i;for(i=0;i<L;i++){if(i%Q===0)v=g.next()<0.5?1:-1;var j=c.k?Math.floor((i%Q)*c.k/Q):0;re[i]=v*(c.k?(j%2?-1:1):1);}
        _w02_fft(re,im);for(i=0;i<L;i++)acc[i]+=(re[i]*re[i]+im[i]*im[i])/(L*fs)/nseg;}
      var pts=[];for(var i2=0;i2<L;i2++){var f=(i2<L/2?i2:i2-L)*fs/L,a=0,cnt=0;for(var d=-3;d<=3;d++){var q=(i2+d+L)%L;a+=acc[q];cnt++;}pts.push([f,a/cnt/TCA]);}
      pts.sort(function(a,b){return a[0]-b[0];});return pts;}
    function draw(){
      var c=cfg(),ca={n:1,k:0,m:0,Tc:TCA},B=bw.get(),nar=_w02_nar(box),Wd=nar?400:700,o=[],xo=nar?50:66,pw=Wd-xo-(nar?12:20);
      var name=c.k?"BOC("+(+c.m.toFixed(2))+","+c.n+")":"BPSK("+c.n+")";
      /* (a) 時間の見方: 6 チップの波形 */
      var g=U.rng(seed*31+5),vals=[];for(var i=0;i<6;i++)vals.push(g.next()<0.5?1:-1);
      vals[0]=1;
      o.push(S.T(nar?6:14,16,"(a) 時間の見方: "+name+" の 6 チップ（1 チップ "+_w02_f(c.Tc*1000,1)+" ns）","start",10.5,"ink",true));
      var cw=pw/6,ya=50,seq=[];vals.forEach(function(v){if(!c.k)seq.push(v);else for(var j=0;j<c.k;j++)seq.push(v*(j%2?-1:1));});
      for(i=0;i<=6;i++)o.push(S.L(xo+i*cw,ya-22,xo+i*cw,ya+22,"line",0.8,"2 3"));
      o.push(S.L(xo,ya,xo+pw,ya,"grid",1));
      o.push(_w02_wave(S,xo,ya,16,seq,cw/(c.k||1),"green",1.8));
      o.push(S.T(xo-6,ya-12,"+1","end",9,"muted"));o.push(S.T(xo-6,ya+20,"−1","end",9,"muted"));
      /* (b) 周波数の見方: スペクトラム */
      var F=Math.max(3,(c.m+3*c.n)*1.023,B/2*1.15);F=U.nice(0,F,4).filter(function(v){return v>=F;})[0]||F;
      var yb=ya+60,bh=nar?150:170,lgy=lg.get();
      var peakv=0,fs=[];for(i=0;i<=800;i++){var f=-F+2*F*i/800;fs.push(f);peakv=Math.max(peakv,S_rel(f,c));}
      var ytop=lgy?3:Math.max(1.1,peakv*1.12);
      var P=U.plot(xo,yb,pw,bh,[-F,F],lgy?[1e-4,ytop]:[0,ytop],{ylog:lgy});
      o.push(S.T(nar?6:14,yb-8,"(b) 周波数の見方: スペクトラム（C/A 符号の中心を 1 とした比）","start",10.5,"ink",true));
      o.push(S.RECT(P.X(-B/2),yb,P.X(B/2)-P.X(-B/2),bh,0,"var(--muted-soft)","none",0,null,' fill-opacity="0.7"'));
      o.push(P.axes({xl:"周波数 f − 中心の周波数 [MHz]",xt:U.nice(-F,F,nar?4:8).filter(function(v){return v>=-F&&v<=F;}),yt:lgy?[1e-4,1e-3,0.01,0.1,1]:U.nice(0,ytop,4).filter(function(v){return v<=ytop;}),
        xfmt:function(v){return _w02_f(v,Math.abs(v)<1&&v!==0?1:0);},yfmt:function(v){return lgy?(v>=0.01?String(v):(v===1e-3?"10⁻³":"10⁻⁴")):_w02_f(v,v<1&&v>0?1:0);},ylOff:nar?34:42}));
      function curve(cc){return fs.map(function(f){var v=S_rel(f,cc);return [f,lgy?Math.max(v,1e-4):v];});}
      if(ff.get()){var fp=fftpsd(c).filter(function(q){return q[0]>=-F&&q[0]<=F;}).map(function(q){return [q[0],lgy?Math.max(q[1],1e-4):q[1]];});o.push(P.clip(fp,"teal",1,null));}
      if(ov.get()&&(c.k||c.n!==1))o.push(P.clip(curve(ca),"signal",1.6,"5 3"));
      o.push(P.clip(curve(c),"green",2.2));
      /* (c) 相関の形 */
      var yc=yb+bh+58,chh=nar?100:110,R=acf(c),Ra=acf(ca),tm=Math.max(1.5,1.3*c.Tc);
      var Q=U.plot(xo,yc,pw,chh,[-tm,tm],[-0.65,1.1]);
      o.push(S.T(nar?6:14,yc-8,"(c) 相関の山の形（山の高さを 1 とした比）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"ずれ τ [μs]（1 μs で 300 m）",xt:U.nice(-tm,tm,6).filter(function(v){return v>=-tm&&v<=tm;}),yt:[-0.5,0,0.5,1],xfmt:function(v){return _w02_f(v,Math.abs(v)<1&&v!==0?2:1);},yfmt:function(v){return _w02_f(v,1);},ylOff:nar?34:42}));
      o.push(S.L(xo,Q.Y(0),xo+pw,Q.Y(0),"muted",1));
      function ext(r,T){var a=r.slice();a.unshift([-tm,0]);a.unshift([-tm,0]);a.push([tm,0]);return a.filter(function(q){return q[0]>=-tm&&q[0]<=tm;}).sort(function(p,q){return p[0]-q[0];});}
      if(ov.get()&&(c.k||c.n!==1))o.push(Q.line(ext(Ra),"signal",1.6,"5 3"));
      o.push(Q.line(ext(R),"green",2.2));
      var leg=[["green",null,name]];if(ov.get()&&(c.k||c.n!==1))leg.push(["signal","5 3","C/A 符号（BPSK(1)）"]);if(ff.get())leg.push(["teal",null,"でたらめな符号の FFT"]);
      o.push(S.LEGL(xo,yc+chh+46,leg,9.5,14));
      box.set(S.svg(Wd,yc+chh+56,o));
      /* 読み出し */
      var pk=0,pf=0;for(i=0;i<=4000;i++){var f2=F*i/4000,v2=S_rel(f2,c);if(v2>pk){pk=v2;pf=f2;}}
      var z0=null;for(i=241;i<R.length;i++){if(R[i][1]<=1e-9){z0=R[i][0];break;}}
      var eb=inband(c,B),ec=inband(ca,B),w9=w90(c),h="";
      h+="<b>"+name+"</b>: チップレート "+_w02_f(c.n*1.023,3)+" M チップ/s（1 チップ "+_w02_f(c.Tc*1000,1)+" ns）"+(c.k?"、副搬送波 "+_w02_f(c.m*1.023,3)+" MHz（1 チップに半周期が "+c.k+" 個）":"、副搬送波なし")+"<br>";
      if(c.k&&Math.abs(sc.get()-c.m)>1e-9)h+='副搬送波は、1 チップに半周期がちょうど整数個入るように '+_w02_f(c.m*1.023,3)+" MHz に合わせた<br>";
      h+="電力のいちばん高い所: "+(pf<1e-3?"中心":"中心から ±"+_w02_f(pf,2)+" MHz")+"（C/A 符号の中心の "+_w02_f(pk,3)+" 倍）。電力の 90 % が入る幅 ±"+_w02_f(w9,2)+" MHz<br>";
      h+="受ける幅 ±"+(B/2)+" MHz に入る電力: <b>"+_w02_f(100*eb,1)+" %</b>（C/A 符号は "+_w02_f(100*ec,1)+" %）<br>";
      h+="相関の山が初めて 0 になるずれ: <b>"+(z0!=null?_w02_f(z0*1000,1)+" ns（"+_w02_f(z0*1e-6*_W02_C,1)+" m）":"—")+"</b>（C/A 符号は 977.5 ns・293 m）";
      ro.innerHTML=h+'<div class="wnote">+1 と −1 がでたらめに並んだ符号の、平均のスペクトラム |P(f)|²/T<sub>c</sub>（本文の導出の式。P(f) は 1 チップの形の周波数の成分）を、C/A 符号の中心の値で割って描いた。BOC は、各チップの中で、副搬送波の半周期ごとに符号を反転させる形（正弦の向きの BOC）。FFT は、でたらめな符号 4096 標本 × 24 区間の平均。実際の L1C・E1 の信号は、BOC(1,1) に BOC(6,1) を少し混ぜた形である。</div>';
    }
    draw();
  };

  /* ---- 6 節: 時間の入れ子 — ページからチップまで ---- */
  REG.w02_frame=function(el,U){
    var S=U.S;
    U.head(el,"TIME STRUCTURE","時間の入れ子 — ページからチップまでの位置と、送った時刻");
    var LV=[{nm:"ページ（フレームの番号）",n:25,dur:30,c:"muted"},{nm:"サブフレーム",n:5,dur:6,c:"purple"},{nm:"ワード",n:10,dur:0.6,c:"purple"},{nm:"ビット",n:30,dur:0.02,c:"gold"},{nm:"符号の周期",n:20,dur:0.001,c:"signal"},{nm:"チップ",n:1023,dur:_W02_TC,c:"signal"}];
    var idx=[0,0,3,17,6,412],frac=0.30,sl=[];
    var r1=U.ctrls(el),r2=U.ctrls(el);
    LV.forEach(function(L,i){var row=i<3?r1:r2;var base=i===5?0:1;
      sl.push(U.slider(row,L.nm+(i===5?"（0 から）":""),{min:base,max:L.n-1+base,step:1,value:idx[i]+base,fmt:function(v){return String(v);},onInput:function(v){idx[i]=v-base;draw();}}));});
    var r3=U.ctrls(el);
    var fr=U.slider(r3,"チップの端数（相関の頂点から読む）",{min:0,max:0.99,step:0.01,value:0.30,fmt:function(v){return _w02_f(v,2);},onInput:function(v){frac=v;draw();}});
    var lvsel=U.select(r3,"「再生」で進める段",LV.map(function(L){return L.nm;}),2,null);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){adv(lvsel.get());sync();draw();},350);
    U.button(br,"再生",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"1 つ進める",function(){adv(lvsel.get());sync();draw();});
    U.button(br,"本文の例（6 節の筆算）",function(){tick.stop();idx=[0,0,3,17,6,412];frac=0.30;fr.set(0.30);sync();draw();});
    U.button(br,"一巡の始まりに戻す",function(){tick.stop();idx=[0,0,0,0,0,0];frac=0;fr.set(0);sync();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function adv(L){var i=L;idx[i]++;while(i>0&&idx[i]>=LV[i].n){idx[i]=0;i--;idx[i]++;}if(idx[0]>=LV[0].n)idx[0]=0;}
    function sync(){sl.forEach(function(s,i){s.set(idx[i]+(i===5?0:1));});}
    function cont(sf,pg){if(sf===1)return ["時計の補正の値・週番号・健康状態など","purple"];if(sf===2||sf===3)return ["その衛星の精密な軌道（エフェメリス）","signal"];
      if(sf===5)return pg<=24?["衛星 "+pg+" の大まかな軌道（アルマナック）","green"]:["衛星 1〜24 の健康状態など","gold"];
      var al={2:25,3:26,4:27,5:28,7:29,8:30,9:31,10:32};if(al[pg])return ["衛星 "+al[pg]+" の大まかな軌道（アルマナック）","green"];
      if(pg===18)return ["電離層の係数・UTC との差","teal"];if(pg===25)return ["衛星 25〜32 の健康状態など","gold"];return ["予備など","muted"];}
    function draw(){
      var nar=_w02_nar(box),Wd=nar?400:700,o=[],X0=nar?110:196,X1=Wd-(nar?8:12),bh=18,gap=nar?28:32,y=34;
      o.push(S.T(nar?6:14,16,"上の段の色の付いた 1 つを、下の段で拡大する","start",10.5,"ink",true));
      var labs=[null,["1","2","3","4","5"].map(function(s){return nar?s:"サブフレーム "+s;}),["TLM","HOW","3","4","5","6","7","8","9","10"],null,null,null];
      var nms=["25 フレーム","フレーム 1 つ","サブフレーム 1 つ","ワード 1 つ","ビット 1 つ","符号の周期 1 つ"];
      var sub=["全部のページ・12.5 分","5 サブフレーム・30 s","10 ワード・6 s","30 bit・0.6 s","符号 20 周期・20 ms","1023 チップ・1 ms"];
      var hx0=0,hx1=0,i,k;
      for(i=0;i<6;i++){var L=LV[i],n=L.n,w=(X1-X0)/n;
        o.push(S.T(nar?6:14,y+8,nms[i],"start",nar?9:10,L.c==="muted"?"ink":L.c,true));
        o.push(S.T(nar?6:14,y+21,sub[i],"start",9,"muted"));
        if(i<5){for(k=0;k<n;k++){var on=k===idx[i],par=i===3&&k>=24;
            var fc=on?U.soft(L.c):(par?U.soft("teal"):"panel"),cc=on?L.c:(par?"teal":"line");
            if(i===1&&!on)fc=U.soft(cont(k+1,idx[0]+1)[1]);
            o.push(S.RECT(X0+k*w,y,w-(n<40?1.2:0.6),bh,1.5,fc,cc,on?1.8:0.8));
            if(labs[i]&&w>=14)o.push(S.T(X0+k*w+w/2,y+13,labs[i][k],"middle",nar?8:9,on?L.c:"muted",on));}
          if(i===0&&!nar)for(k=0;k<n;k+=4)o.push(S.T(X0+k*w+w/2,y-3,String(k+1),"middle",8,"muted"));
          if(i===3)o.push(S.T(nar?6:14,y+33,"最後の 6 bit はパリティ","start",nar?8.5:9,"teal"));
          var nx0=X0+idx[i]*w,nx1=X0+(idx[i]+1)*w;}
        else{var v=_w02_pm(1);o.push(S.RECT(X0,y,X1-X0,bh,1.5,"panel","line",0.8));o.push(_w02_wave(S,X0,y+bh/2,6.5,Array.prototype.slice.call(v),w,"signal",0.7));
          nx0=X0+idx[5]*w-1.5;nx1=X0+(idx[5]+1)*w+1.5;o.push(S.RECT(nx0,y-2,nx1-nx0,bh+4,1,U.soft("signal"),"signal",1.6));}
        if(i>0){o.push(S.L(hx0,y-gap,X0,y,"faint",1,"3 3"));o.push(S.L(hx1,y-gap,X1,y,"faint",1,"3 3"));}
        hx0=nx0;hx1=nx1;y+=bh+gap;}
      /* チップの中: 搬送波（間引いて 40 周期）と端数の位置 */
      o.push(S.T(nar?6:14,y+8,"チップ 1 つ","start",nar?9:10,"signal",true));
      o.push(S.T(nar?6:14,y+21,nar?"搬送波 1540 周期":"搬送波 1540 周期・977.5 ns","start",9,"muted"));
      if(nar)o.push(S.T(6,y+33,"977.5 ns","start",9,"muted"));
      o.push(S.T(nar?6:14,y+(nar?45:33),"図は 40 周期に間引いた","start",9,"muted"));
      o.push(S.L(hx0,y-gap,X0,y,"faint",1,"3 3"));o.push(S.L(hx1,y-gap,X1,y,"faint",1,"3 3"));
      var ch=_w02_ca(1)[idx[5]],sgn=ch?-1:1,pts=[];for(k=0;k<=640;k++){pts.push([X0+(X1-X0)*k/640,y+bh/2-7*sgn*Math.sin(2*Math.PI*40*k/640)]);}
      o.push(S.RECT(X0,y,X1-X0,bh,1.5,U.soft("signal"),"signal",1));o.push(S.PL(pts,"muted",0.9));
      var xf=X0+(X1-X0)*frac;o.push(S.L(xf,y-4,xf,y+bh+4,"gold",2.4));o.push(S.T(Math.min(Math.max(xf,X0+24),X1-24),y+bh+14,"端数 "+_w02_f(frac,2),"middle",9,"gold",true,false,null,true));
      box.set(S.svg(Wd,y+(nar?52:42),o));
      /* 読み出し */
      var tsf=idx[2]*0.6+idx[3]*0.02+idx[4]*0.001+(idx[5]+frac)*_W02_TC,tcy=idx[0]*30+idx[1]*6+tsf,ct=cont(idx[1]+1,idx[0]+1),h="";
      h+="12.5 分の一巡の始まりからの時刻: "+idx[0]+" × 30 s + "+idx[1]+" × 6 s + "+idx[2]+" × 0.6 s + "+idx[3]+" × 20 ms + "+idx[4]+" × 1 ms + "+_w02_f(idx[5]+frac,2)+" × 977.517 ns = <b>"+_w02_g(tcy,9)+" s</b><br>";
      h+="サブフレームの始まりからの時刻（6 節の筆算の 2〜5 行目の和）: <b>"+_w02_g(tsf,9)+" s</b>。サブフレームが 345 600 s に始まったとすると、送った時刻は "+_w02_g(345600+tsf,9)+" s<br>";
      h+="いま送っている所: ページ "+(idx[0]+1)+" のサブフレーム "+(idx[1]+1)+"（"+ct[0]+"）、ワード "+(idx[2]+1)+(idx[2]<2?"（"+["TLM","HOW"][idx[2]]+"）":"")+"、ビット "+(idx[3]+1)+(idx[3]>=24?"（パリティ）":"")+"、符号の周期 "+(idx[4]+1)+"、チップ "+idx[5]+"（"+(ch?"1 → −1":"0 → +1")+"。PRN 1）<br>";
      h+="光の速さで、1 チップは 293 m、1 周期は 300 km、1 bit は 6000 km、1 ワードは 18 万 km にあたる";
      ro.innerHTML=h+'<div class="wnote">スライダーの番号は 1 から数える（チップだけは 0 から）。式の掛ける数は、その段の番号から 1 を引いた「始まりから数え終えた数」。「再生」は、選んだ段を 1 つずつ進め、いちばん大きい番号を超えると 0 に戻して上の段を 1 つ進める（桁の繰り上がりと同じ）。ページとサブフレームの内容は、IS-GPS-200 の割り当て（6 節の図）による。</div>';
    }
    draw();
  };

  /* ===== 03 章 雑音より弱い電波を受ける — 信号の強さと C/N0 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w03_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w03_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W03_C=299792458,_W03_RC=1.023e6,_W03_TC=1/1.023e6,_W03_KB=1.380649e-23,_W03_T0=290,_W03_RE=6371e3,_W03_A=26560e3,_W03_LAM=299792458/1575.42e6;
  var _W03_N0=10*Math.log10(1.380649e-23*290)+30;   /* 290 K の熱雑音の密度 −174.0 dBm/Hz */
  function _w03_range(el){var t=el*Math.PI/180;return Math.sqrt(_W03_A*_W03_A-Math.pow(_W03_RE*Math.cos(t),2))-_W03_RE*Math.sin(t);}
  function _w03_lfs(r){return 20*Math.log10(4*Math.PI*r/_W03_LAM);}
  var _W03_EIRP=-128.5-30+_w03_lfs(_w03_range(5))+0.5;   /* 受信電力の最小値から逆算した EIRP（26.4 dBW。例の値） */
  function _w03_ga(el){return 3-8*Math.pow((90-el)/85,2);}   /* 例のアンテナの利得 [dBi] */
  /* 相補誤差関数（どの x でも相対誤差 1.2 × 10⁻⁷ 未満の近似）と Q 関数 */
  function _w03_erfc(x){var z=Math.abs(x),t=1/(1+0.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
  function _w03_Q(x){return 0.5*_w03_erfc(x/Math.SQRT2);}
  function _w03_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
  function _w03_sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
  /* 1.2 × 10⁻⁵ の形の数 */
  function _w03_sci(v,d){if(v<1e-100)return "10⁻¹⁰⁰ より小さい";if(v>=0.01)return _w03_f(v,3);var e=Math.floor(Math.log10(v)),m=v/Math.pow(10,e);if(+m.toFixed(d||1)>=10){m/=10;e++;}
    var sup="⁰¹²³⁴⁵⁶⁷⁸⁹",es=String(Math.abs(e)).split("").map(function(c){return sup[+c];}).join("");return m.toFixed(d||1)+" × 10"+(e<0?"⁻":"")+es;}
  /* 信号の電力のうち、L1 のまわりの幅 B [Hz] に入る割合（C/A 符号の sinc² の積分） */
  function _w03_frac(B){var n=2000,h=(B/2*_W03_TC)/n,s=0;for(var i=0;i<=n;i++){var x=i*h,w=(i===0||i===n)?1:(i%2?4:2),v=_w03_sinc(x);s+=w*v*v;}return Math.min(1,2*s*h/3);}
  /* 逆 FFT（共役をとって順変換し、共役をとって N で割る） */
  function _w03_ifft(U,re,im){var n=re.length,k;for(k=0;k<n;k++)im[k]=-im[k];U.gnss.fft(re,im);for(k=0;k<n;k++){re[k]/=n;im[k]=-im[k]/n;}}

  /* ---- 3 節: 帯域の幅と SN 比（電力スペクトル密度 ↔ 波形） ---- */
  REG.w03_band=function(el,U){
    var S=U.S,NS=8192,FS=64*_W03_RC,FIF=12*_W03_RC,PM=U.gnss.pm(1);
    U.head(el,"NOISE BANDWIDTH","帯域の幅と SN 比 — C/N0 は帯域の選び方によらない");
    var r1=U.ctrls(el);
    var cn=U.slider(r1,"C/N0",{min:25,max:55,step:0.5,value:45.5,fmt:function(v){return _w03_f(v,1)+" dB-Hz（C = "+_w03_f(v+_W03_N0,1)+" dBm）";},onInput:function(){draw();}});
    var bw=U.slider(r1,"受ける帯域の幅 B<sub>n</sub>",{values:[0.5,1,2,4,8,20],value:2,fmt:function(v){return v+" MHz";},onInput:function(){filt();draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（45.5 dB-Hz・2 MHz）",function(){cn.set(45.5);bw.set(2);filt();draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();filt();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    var w0=new Float64Array(NS),s0=new Float64Array(NS),wb=new Float64Array(NS),sb=new Float64Array(NS);
    /* 雑音は、片側の密度 1/(2 MHz) の白色雑音（2 MHz の帯域で分散 1）。信号は電力 1 の BPSK（表示のため搬送波を 12.276 MHz に下げた） */
    function gen(){var g=U.rng(seed*7919+3),sd=Math.sqrt(FS/4e6);
      for(var k=0;k<NS;k++){w0[k]=sd*g.normal();var t=k/FS;s0[k]=Math.SQRT2*PM[Math.floor(t*_W03_RC)%1023]*Math.cos(2*Math.PI*FIF*t);}}
    function bp(x,out,B){var re=new Float64Array(NS),im=new Float64Array(NS),k;for(k=0;k<NS;k++)re[k]=x[k];U.gnss.fft(re,im);
      for(k=0;k<NS;k++){var f=(k<=NS/2?k:NS-k)*FS/NS;if(Math.abs(f-FIF)>=B/2){re[k]=0;im[k]=0;}}
      _w03_ifft(U,re,im);for(k=0;k<NS;k++)out[k]=re[k];}
    function filt(){var B=bw.get()*1e6;bp(w0,wb,B);bp(s0,sb,B);}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],q=Math.pow(10,cn.get()/10),B=bw.get()*1e6,Cd=cn.get()+_W03_N0,fr=_w03_frac(B),Nd=_W03_N0+10*Math.log10(B);
      var amp=Math.sqrt(q/2e6);   /* 表示の単位で √C（N0 = 1/(2 MHz)） */
      /* (a) 電力スペクトル密度 */
      var xm=Math.max(4,B/2e6*1.3),pw=nar?320:300,P=U.plot(64,30,pw,170,[-xm,xm],[-200,-165]);
      o.push(S.T(nar?6:14,16,"(a) 電力スペクトル密度","start",11,"ink",true));
      o.push(S.RECT(P.X(-B/2e6),P.y,P.X(B/2e6)-P.X(-B/2e6),P.h,0,U.soft("gold"),"none",0));
      o.push(P.axes({xl:"周波数 f − f_{L1} [MHz]",yl:"[dBm/Hz]",xt:U.nice(-xm,xm,6).filter(function(v){return Math.abs(v)<=xm+1e-9;}),yt:[-200,-190,-180,-170],xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return String(v).replace("-","−");},ylOff:44}));
      o.push(P.line([[-xm,_W03_N0],[xm,_W03_N0]],"teal",2.2));
      var sp=[];for(var i=0;i<=600;i++){var f=-xm+2*xm*i/600,v=_w03_sinc(f*1e6*_W03_TC);sp.push([f,Cd+10*Math.log10(_W03_TC*Math.max(v*v,1e-14))]);}
      o.push(P.clip(sp,"signal",1.8));
      o.push(S.T(P.X(xm)-4,P.Y(_W03_N0)-5,"雑音の床 −174.0","end",9,"teal",true,false,null,true));
      o.push(S.T(P.X(0),P.y+12,"受ける帯域 "+bw.get()+" MHz","middle",9,"gold",true,false,null,true));
      o.push(S.T(P.X(0)+6,P.Y(Cd+10*Math.log10(_W03_TC))-6,"信号の山 "+_w03_f(Cd+10*Math.log10(_W03_TC),1),"start",9,"signal",true,false,null,true));
      /* (b) 帯域の中の電力 */
      var bx=nar?64:430,by=nar?260:30,Q=U.plot(bx,by,nar?120:110,170,[0,1],[-135,-95]);
      o.push(S.T(nar?6:bx-30,by-14,"(b) 帯域の中の電力","start",11,"ink",true));
      o.push(Q.axes({xt:[],yt:[-135,-125,-115,-105,-95],yfmt:function(v){return String(v).replace("-","−");},yl:"[dBm]",ylOff:40}));
      var cb=Cd+10*Math.log10(fr);
      o.push(S.RECT(Q.X(0.12),Q.Y(Math.min(Nd,-95)),Q.X(0.45)-Q.X(0.12),Q.Y(-135)-Q.Y(Math.min(Nd,-95)),2,U.soft("teal"),"teal",1.2));
      o.push(S.RECT(Q.X(0.55),Q.Y(Math.max(Math.min(cb,-95),-135)),Q.X(0.88)-Q.X(0.55),Q.Y(-135)-Q.Y(Math.max(Math.min(cb,-95),-135)),2,U.soft("signal"),"signal",1.2));
      o.push(S.T(Q.X(0.285),Q.Y(-135)+14,"雑音 N","middle",9.5,"teal",true));o.push(S.T(Q.X(0.715),Q.Y(-135)+14,"信号","middle",9.5,"signal",true));
      o.push(S.T(Q.X(0.285),Q.Y(Math.min(Nd,-95))-4,_w03_f(Nd,1),"middle",9,"teal",true,false,null,true));
      o.push(S.T(Q.X(0.715),Q.Y(Math.max(Math.min(cb,-95),-135))-4,_w03_f(cb,1),"middle",9,"signal",true,false,null,true));
      var tx=nar?200:Q.x+Q.w+12;
      o.push(S.T(tx,by+40,"C/N = "+_w03_f(cb-Nd,1)+" dB","start",11,cb-Nd<0?"alias":"green",true));
      o.push(S.T(tx,by+58,"C/N0 = "+_w03_f(cn.get(),1)+" dB-Hz","start",11,"signal",true));
      o.push(S.T(tx,by+76,"（帯域によらない）","start",9.5,"muted"));
      /* (c) 波形 */
      var cy=nar?500:272,ch0=60,nc=4,R=U.plot(64,cy,nar?320:600,120,[ch0,ch0+nc],[-8,8]),lo=ch0*64,hi=(ch0+nc)*64;
      o.push(S.T(nar?6:14,cy-14,"(c) 帯域を通した波形（縦は、2 MHz の雑音の標準偏差を 1 とした値）","start",11,"ink",true));
      o.push(R.axes({xt:[ch0,ch0+1,ch0+2,ch0+3,ch0+4],yt:[-8,-4,0,4,8],xfmt:function(v){return String(v);},yfmt:function(v){return String(v).replace("-","−");},xl:"時間 [チップ]（表示のため搬送波を 12.276 MHz に下げた）",ylOff:30}));
      var pa=[],pb=[];for(var k=lo;k<=hi;k++){var t=k/64;pa.push([t,wb[k]+amp*sb[k]]);pb.push([t,amp*sb[k]]);}
      o.push(R.clip(pa,"teal",0.9));o.push(R.line(pb,"signal",2));
      o.push(S.LEGL(R.x,R.y+R.h+48,[["teal",null,"信号 + 雑音"],["signal",null,"信号だけ"]],9.5,14));
      box.set(S.svg(Wd,R.y+R.h+58,o));
      /* 読み出し */
      var vn=0,vs=0;for(var j=0;j<NS;j++){vn+=wb[j]*wb[j];vs+=sb[j]*sb[j];}vn/=NS;vs/=NS;
      var h="雑音の密度 N<sub>0</sub> = −174.0 dBm/Hz（290 K）、帯域 B<sub>n</sub> = "+bw.get()+" MHz（+"+_w03_f(10*Math.log10(B),1)+" dB）→ 雑音の電力 N = <b>"+_w03_f(Nd,1)+" dBm</b><br>";
      h+="信号の電力 C = "+_w03_f(Cd,1)+" dBm。帯域に入るのは "+_w03_f(100*fr,1)+" %（"+_w03_f(cb,1)+" dBm）<br>";
      h+="帯域の中の SN 比 C/N = <b>"+_w03_f(cb-Nd,1)+" dB</b>（信号の全部の電力で比べると "+_w03_f(cn.get()-10*Math.log10(B),1)+" dB）。C/N0 = <b>"+_w03_f(cn.get(),1)+" dB-Hz</b> は帯域によらない<br>";
      h+="表示した波形の 8192 標本で測った雑音の電力 "+_w03_f(10*Math.log10(vn*2e6)+_W03_N0,1)+" dBm（式 "+_w03_f(Nd,1)+" dBm）、信号の振幅（搬送波の山）は雑音の標準偏差の "+_w03_f(Math.sqrt(2*q/B),3)+" 倍";
      ro.innerHTML=h+'<div class="wnote">雑音は 290 K の熱雑音（白色雑音）を、信号は PRN 1 の C/A 符号の BPSK を、どちらも同じ理想のフィルタ（帯域の中を全部通し、外を全部止める）に通した。波形は 1 チップ 64 標本で計算し、表示のため搬送波の周波数を 12.276 MHz に下げた（周波数を下げる仕組みは 4 章）。帯域を主ローブ（±1.023 MHz）より狭くすると、信号の電力も一部が切られる。</div>';
    }
    gen();filt();draw();
  };

  /* ---- 4 節: 逆拡散と積分（電力スペクトル密度 ↔ 相関） ---- */
  REG.w03_despread=function(el,U){
    var S=U.S,FS=4.096e6,NB=4096,D0=1638,MMAX=16,PM=U.gnss.pm(1),code=new Float64Array(NB);
    for(var k0=0;k0<NB;k0++)code[k0]=PM[Math.floor(k0*1023/NB)];   /* 1 ms = 4096 標本の手元の符号 */
    U.head(el,"DESPREADING","逆拡散と積分 — 雑音に埋もれた信号が、幅 1/T<sub>coh</sub> の窓で雑音の床の上に出る");
    var r1=U.ctrls(el);
    var cn=U.slider(r1,"C/N0",{min:25,max:50,step:0.5,value:45.5,fmt:function(v){return _w03_f(v,1)+" dB-Hz";},onInput:function(){draw();}});
    var tc=U.slider(r1,"積分の時間 T<sub>coh</sub>",{values:[1,2,4,8,16],value:1,fmt:function(v){return v+" ms（窓の幅 "+(v===1?"1 kHz":_w03_f(1000/v,1)+" Hz")+"）";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var ph=U.slider(r2,"受けた搬送波と手元の搬送波の位相の差",{min:0,max:180,step:5,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（45.5 dB-Hz・1 ms）",function(){cn.set(45.5);tc.set(1);ph.set(30);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    var wI=new Float64Array(NB*MMAX),wQ=new Float64Array(NB*MMAX);
    /* 標準の正規分布の雑音（成分ごと）。C/N0 に合わせて倍率を掛けて使う */
    function gen(){var g=U.rng(seed*104729+7);for(var k=0;k<NB*MMAX;k++){wI[k]=g.normal();wQ[k]=g.normal();}}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],q=Math.pow(10,cn.get()/10),M=tc.get(),N=NB*M,T=M*1e-3,phi=ph.get()*Math.PI/180;
      /* 信号の振幅 1（= √(2C)、C = 1/2）、成分ごとの雑音の分散 σ² = N0 f_s（N0 = C/(C/N0)） */
      var N0s=0.5/q,sg=Math.sqrt(N0s*FS),cph=Math.cos(phi),sph=Math.sin(phi),k;
      var xr=new Float64Array(N),xi=new Float64Array(N),yr=new Float64Array(N),yi=new Float64Array(N),ar=new Float64Array(NB),ai=new Float64Array(NB),nr=new Float64Array(NB),ni=new Float64Array(NB);
      for(k=0;k<N;k++){var c=code[((k-D0)%NB+NB)%NB],a=sg*wI[k],b=sg*wQ[k];xr[k]=c*cph+a;xi[k]=c*sph+b;
        var cl=code[((k-D0)%NB+NB)%NB];yr[k]=xr[k]*cl;yi[k]=xi[k]*cl;ar[k%NB]+=xr[k];ai[k%NB]+=xi[k];nr[k%NB]+=a;ni[k%NB]+=b;}
      /* 電力を dBm（RF の片側の値）に直す: 表示の単位の N0s が −174.0 dBm/Hz にあたる */
      function dbm(pw){return 10*Math.log10(Math.max(pw,1e-30)/N0s)+_W03_N0;}
      /* 逆拡散の前のスペクトル（列ごとに平均） */
      var fr=xr.slice(),fi=xi.slice();U.gnss.fft(fr,fi);
      var ncol=nar?160:300,colw=N/ncol,pre=[];
      for(var cI=0;cI<ncol;cI++){var s=0,cnt=0;for(var b2=Math.floor(cI*colw);b2<Math.floor((cI+1)*colw);b2++){var kk=(b2+N/2)%N;s+=(fr[kk]*fr[kk]+fi[kk]*fi[kk]);cnt++;}
        var f=((cI+0.5)*colw-N/2)*FS/N/1e6;pre.push([f,dbm(s/cnt/(N*FS)/2)]);}
      var P=U.plot(64,30,nar?320:270,150,[-2,2],[-200,-165]);
      o.push(S.T(nar?6:14,16,"(a) 逆拡散の前（シミュレーションの FFT）","start",11,"ink",true));
      o.push(P.axes({xl:"f − f_{L1} [MHz]",yl:"[dBm/Hz]",xt:[-2,-1,0,1,2],yt:[-200,-190,-180,-170],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");},ylOff:44}));
      o.push(P.line(pre,"teal",1.4));
      var th=[];for(var i=0;i<=200;i++){var f2=-2+4*i/200,v=_w03_sinc(f2*1e6*_W03_TC);th.push([f2,cn.get()+_W03_N0+10*Math.log10(_W03_TC*Math.max(v*v,1e-14))]);}
      o.push(P.clip(th,"signal",1.6,"5 3"));
      o.push(S.T(P.X(2)-4,P.Y(_W03_N0)-6,"信号 + 雑音（平均）","end",9,"teal",true,false,null,true));
      o.push(S.T(P.X(0),P.Y(-196),"破線: 信号だけ（式）","middle",9,"signal",true,false,null,true));
      /* 逆拡散の後（DC のまわりの窓） */
      U.gnss.fft(yr,yi);var nb=12,bins=[],nsum=0,ncnt=0;
      for(k=0;k<N;k++){var pk=(yr[k]*yr[k]+yi[k]*yi[k])/(N*N)/2;if(k!==0){nsum+=pk;ncnt++;}}
      for(var d=-nb;d<=nb;d++){var kk2=(d+N)%N,pw2=(yr[kk2]*yr[kk2]+yi[kk2]*yi[kk2])/(N*N)/2;bins.push([d,dbm(pw2)]);}
      var bx=nar?64:410,by=nar?250:30,Q=U.plot(bx,by,nar?320:270,150,[-nb-0.5,nb+0.5],[-170,-115]);
      o.push(S.TX(nar?6:bx-30,by-14,"(b) 逆拡散の後（1 本は幅 1/T_{coh} の窓）","start",11,"ink",true));
      o.push(Q.axes({xl:"f − f_{L1} [kHz]",yl:"窓の電力 [dBm]",xt:[-12,-6,0,6,12],yt:[-170,-160,-150,-140,-130,-120],xfmt:function(v){return U.sig(v/T/1000,3);},yfmt:function(v){return String(v).replace("-","−");},ylOff:44}));
      bins.forEach(function(bq){var x=Q.X(bq[0]),yv=Math.max(bq[1],-170);o.push(S.RECT(x-Q.w/(2*nb+1)*0.38,Q.Y(yv),Q.w/(2*nb+1)*0.76,Q.Y(-170)-Q.Y(yv),1,bq[0]===0?U.soft("signal"):U.soft("teal"),bq[0]===0?"signal":"teal",1));});
      var nmean=dbm(nsum/ncnt),sdc=bins[nb][1];
      o.push(Q.line([[-nb-0.5,nmean],[nb+0.5,nmean]],"teal",1.2,"4 3"));
      o.push(S.T(Q.X(nb+0.5)-4,Q.Y(nmean)-5,"雑音の窓の平均 "+_w03_f(nmean,1),"end",9,"teal",true,false,null,true));
      o.push(S.T(Q.X(0)+10,Q.Y(Math.min(sdc,-116))+12,"信号の窓 "+_w03_f(sdc,1),"start",9,"signal",true,false,null,true));
      /* (c) 相関（M 周期を足してから、全部のずれ） */
      var Ar=ar.slice(),Ai=ai.slice(),Cr=code.slice(),Ci=new Float64Array(NB),Rn=nr.slice(),Rni=ni.slice();
      U.gnss.fft(Ar,Ai);U.gnss.fft(Cr,Ci);U.gnss.fft(Rn,Rni);
      for(k=0;k<NB;k++){var r_=Ar[k]*Cr[k]+Ai[k]*Ci[k],i_=Ai[k]*Cr[k]-Ar[k]*Ci[k];Ar[k]=r_;Ai[k]=i_;var r2_=Rn[k]*Cr[k]+Rni[k]*Ci[k],i2_=Rni[k]*Cr[k]-Rn[k]*Ci[k];Rn[k]=r2_;Rni[k]=i2_;}
      _w03_ifft(U,Ar,Ai);_w03_ifft(U,Rn,Rni);
      var pn=0,pwr=new Float64Array(NB);for(k=0;k<NB;k++){Ar[k]/=N;Ai[k]/=N;Rn[k]/=N;Rni[k]/=N;pwr[k]=Ar[k]*Ar[k]+Ai[k]*Ai[k];pn+=Rn[k]*Rn[k]+Rni[k]*Rni[k];}pn/=NB;
      var pexp=2*N0s/T,top=Math.max(12,1.12/pexp),cy=nar?490:250,R=U.plot(64,cy,nar?320:420,120,[0,1023],[0,top]);
      o.push(S.T(nar?6:14,cy-14,"(c) 全部のずれの相関の電力（雑音の平均の電力 = 1）","start",11,"ink",true));
      o.push(R.axes({xt:[0,256,512,768,1023],yt:U.nice(0,top,4).filter(function(v){return v<=top;}),xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},xl:"手元の符号のずれ [チップ]",ylOff:44}));
      var dpath="";for(var px=0;px<Math.round(R.w);px++){var j0=Math.floor(px/R.w*NB),j1=Math.max(j0+1,Math.floor((px+1)/R.w*NB)),mx=0;for(var j=j0;j<j1;j++)mx=Math.max(mx,pwr[j]/pexp);dpath+="M"+(R.x+px+0.5).toFixed(1)+","+R.Y(0).toFixed(1)+"V"+R.Y(Math.min(mx,top)).toFixed(1);}
      o.push(S.PATH(dpath,"teal",1));
      var pkv=pwr[D0]/pexp;o.push(S.D(R.X(D0*1023/NB),R.Y(Math.min(pkv,top)),"signal",4.5));
      o.push(S.T(R.X(D0*1023/NB)+8,R.Y(Math.min(pkv,top))+4,"山 "+_w03_f(10*Math.log10(pkv),1)+" dB","start",9.5,"signal",true,false,null,true));
      /* (d) Y_I と Y_Q */
      if(!nar){var I=U.plot(560,cy,120,120,[-1.6,1.6],[-1.6,1.6]);
        o.push(S.TX(530,cy-14,"(d) 山の Y_I・Y_Q","start",11,"ink",true));
        o.push(I.axes({xt:[-1,0,1],yt:[-1,0,1],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");},xl:"Y_I",yl:"Y_Q",ylOff:22}));
        var ci=[];for(i=0;i<=72;i++){var a2=2*Math.PI*i/72;ci.push([Math.cos(a2),Math.sin(a2)]);}o.push(I.line(ci,"faint",1,"3 3"));
        var rad=Math.sqrt(N0s/T),cc=[];for(i=0;i<=72;i++){var a3=2*Math.PI*i/72;cc.push([cph+rad*Math.cos(a3),sph+rad*Math.sin(a3)]);}o.push(I.clip(cc,"teal",1.2));
        o.push(S.L(I.X(0),I.Y(0),I.X(cph),I.Y(sph),"ink",1.4));o.push(S.D(I.X(Ar[D0]),I.Y(Ai[D0]),"signal",4.2));}
      box.set(S.svg(Wd,cy+R.h+46,o));
      /* 読み出し */
      var snr=cn.get()+10*Math.log10(T),h="";
      h+="式: SNR = C/N0 + 10 log<sub>10</sub>(T<sub>coh</sub>) = "+_w03_f(cn.get(),1)+" "+(T>=1e-3?"− "+_w03_f(-10*Math.log10(T),1):"")+" = <b>"+_w03_f(snr,1)+" dB</b>（Y<sub>I</sub> だけで見ると "+_w03_f(snr+3.01,1)+" dB）<br>";
      h+="シミュレーション: 逆拡散の後の、信号の窓の電力 "+_w03_f(sdc,1)+" dBm（雑音を含む 1 回の値）、雑音の窓の平均 "+_w03_f(nmean,1)+" dBm → 差 <b>"+_w03_f(sdc-nmean,1)+" dB</b><br>";
      h+="相関: 山の (Y<sub>I</sub>, Y<sub>Q</sub>) = ("+_w03_f(Ar[D0],2)+", "+_w03_f(Ai[D0],2)+")。雑音だけを相関した電力の平均で信号の電力 1 を割ると <b>"+_w03_f(-10*Math.log10(pn),1)+" dB</b>（位相の差を変えても変わらない）<br>";
      h+="処理利得 R<sub>c</sub>T<sub>coh</sub> = "+_w03_f(1023*M,0)+"（"+_w03_f(10*Math.log10(1023*M),1)+" dB）。逆拡散の前は、信号の密度の山 "+_w03_f(cn.get()+_W03_N0+10*Math.log10(_W03_TC),1)+" dBm/Hz が、雑音の床 −174.0 dBm/Hz の "+_w03_f(-(cn.get()+10*Math.log10(_W03_TC)),1)+" dB 下";
      ro.innerHTML=h+'<div class="wnote">受けた信号は、PRN 1 の C/A 符号（1 ms = 4096 標本、標本の周波数 4.096 MHz）に、2 つの成分の白色雑音を足した値（搬送波は取り除いた後の形で、位相の差だけを残した）。窓の電力は、FFT の 1 本（幅 1/T<sub>coh</sub>）に入る電力を、雑音の密度 −174.0 dBm/Hz を基準に dBm に直した。(c) は、T<sub>coh</sub> の間の受けた信号を 1 ms ごとに重ねて足し、4096 通りのずれで相関をとった。周波数のずれとデータのビットの反転は 0 とした。</div>';
    }
    gen();draw();
  };

  /* ---- 5 節: 回線計算（衛星の位置 ↔ 信号と雑音のレベル） ---- */
  REG.w03_budget=function(el,U){
    var S=U.S;
    U.head(el,"LINK BUDGET","回線計算 — 衛星の電力から C/N0 まで");
    var r1=U.ctrls(el);
    var ei=U.slider(r1,"衛星の EIRP",{min:20,max:32,step:0.1,value:_W03_EIRP,fmt:function(v){return _w03_f(v,1)+" dBW（"+U.sig(Math.pow(10,v/10),3)+" W）";},onInput:draw});
    var ev=U.slider(r1,"衛星の仰角 θ",{min:5,max:90,step:1,value:5,fmt:function(v){return v+"°（距離 "+_w03_g(_w03_range(v)/1e3)+" km）";},onInput:draw});
    var r2=U.ctrls(el);
    var an=U.select(r2,"受信アンテナ",["0 dBi（向きによらない）","例のアンテナ（真上 +3、5° で −5 dBi）"],0,draw);
    var ls=U.slider(r2,"そのほかの損失（遮へいなど）",{min:0,max:30,step:0.5,value:0,fmt:function(v){return _w03_f(v,1)+" dB";},onInput:draw});
    var r3=U.ctrls(el);
    var ta=U.slider(r3,"アンテナの雑音温度 T<sub>ant</sub>",{min:20,max:400,step:5,value:100,fmt:function(v){return v+" K";},onInput:draw});
    var nf=U.slider(r3,"LNA の雑音指数 NF",{min:0,max:5,step:0.1,value:1,fmt:function(v){return _w03_f(v,1)+" dB（Tₑ = "+_w03_f((Math.pow(10,v/10)-1)*_W03_T0,1)+" K）";},onInput:draw});
    var r4=U.ctrls(el);
    var only=U.checkbox(r4,"雑音を 290 K の熱雑音だけにする（2・3 節の計算）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例（仰角 5°・0 dBi・100 K・NF 1 dB）",function(){ei.set(_W03_EIRP);ev.set(5);an.set(0);ls.set(0);ta.set(100);nf.set(1);only.set(false);draw();});
    U.button(br,"2・3 節の計算（290 K だけ）",function(){ei.set(_W03_EIRP);ev.set(5);an.set(0);ls.set(0);only.set(true);draw();});
    U.button(br,"真上の衛星",function(){ev.set(90);draw();});
    var box=U.svgbox(el),ro=U.readout(el),G={};
    U.ctl.drag(box,function(type,x,y){if(type==="up"||!G.cx)return;var g=Math.atan2(Math.abs(x-G.cx),G.cy-y);
      /* 中心角 g の衛星の仰角 */var sx=_W03_A*Math.sin(g),sy=_W03_A*Math.cos(g)-_W03_RE,e=Math.atan2(sy,sx)*180/Math.PI;if(type==="down"&&Math.hypot(x-G.sx,y-G.sy)>26)return false;
      ev.set(Math.max(5,Math.min(90,Math.round(e))));draw();});
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],el0=ev.get(),r=_w03_range(el0),L=_w03_lfs(r),ga=an.get()?_w03_ga(el0):0;
      var eirpm=ei.get()+30,c1=eirpm-L,c2=c1-0.5,c3=c2-ls.get(),C=c3+ga;
      var Te=(Math.pow(10,nf.get()/10)-1)*_W03_T0,Ts=only.get()?_W03_T0:ta.get()+Te,N0=10*Math.log10(_W03_KB*Ts)+30,cn0=C-N0;
      /* (a) 衛星と受信機（大きさの比は実際のとおり） */
      var sc=(nar?92:104)/_W03_A,cx=nar?110:130,cy=nar?150:160;G.cx=cx;G.cy=cy;
      o.push(S.T(nar?6:14,16,"(a) 衛星の位置（ドラッグで仰角を変える）","start",11,"ink",true));
      o.push(S.CIRC(cx,cy,_W03_A*sc,"signal",1.1,null,"5 4"));o.push(S.CIRC(cx,cy,_W03_RE*sc,"green",1.4,U.soft("green")));
      var t=el0*Math.PI/180,rxx=cx,rxy=cy-_W03_RE*sc,sx2=rxx+r*sc*Math.cos(t),sy2=rxy-r*sc*Math.sin(t);G.sx=sx2;G.sy=sy2;
      o.push(S.L(rxx,rxy,sx2,sy2,"gold",1.8));
      o.push(S.L(sx2-9,sy2,sx2+9,sy2,"signal",1.1)+S.RECT(sx2-14,sy2-3.2,6.5,6.4,1,U.soft("signal"),"signal",1)+S.RECT(sx2+7.5,sy2-3.2,6.5,6.4,1,U.soft("signal"),"signal",1)+S.RECT(sx2-3.6,sy2-3.6,7.2,7.2,1.5,"signal","signal",1));
      o.push(S.CIRC(sx2,sy2,16,"signal",1,null,"2 3"));
      o.push(S.D(rxx,rxy-2,"green",3.6));
      o.push(S.T((rxx+sx2)/2,(rxy+sy2)/2+(el0<45?16:-6),_w03_g(r/1e3)+" km",el0<45?"middle":"start",9.5,"gold",true,false,null,true));
      o.push(S.T(cx,cy+(nar?118:130),"仰角 "+el0+"°・自由空間損失 "+_w03_f(L,1)+" dB","middle",9.5,"ink",true));
      /* (b) 信号の電力と雑音の密度（数値の差が C/N0） */
      var bx=nar?64:300,by=nar?320:40,P=U.plot(bx+40,by,nar?130:120,230,[0,1],[-185,-110]);
      o.push(S.TX(nar?6:bx-6,by-24,"(b) 信号の電力 C と雑音の密度 N_0","start",11,"ink",true));
      o.push(P.axes({xt:[],yt:[-180,-170,-160,-150,-140,-130,-120,-110],yfmt:function(v){return String(v).replace("-","−");},yl:"dBm（C）・dBm/Hz（N_0）",ylOff:44}));
      function lvl(v,c,lab,lw,left){var vv=Math.max(-185,Math.min(-110,v));o.push(S.L(P.X(0.1),P.Y(vv),P.X(0.9),P.Y(vv),c,lw||2.6));if(left){if(lab)o.push(S.T(P.X(0.12),P.Y(vv)+13,lab,"start",9,c,false,false,null,true));}else o.push(S.TX(P.X(0.92),P.Y(vv)+4,lab,"start",9.5,c,true,true));}
      lvl(C,"signal","C = "+_w03_f(C,1));lvl(N0,"teal","N_0 = "+_w03_f(N0,1));
      if(!only.get()){lvl(_W03_N0,"muted","",1.2,true);o.push(S.T(P.x,P.y+P.h+18,"灰色の線: 290 K の熱雑音だけなら −174.0","start",9,"muted"));}
      var ya=P.Y(Math.max(-185,Math.min(-110,C))),yb=P.Y(Math.max(-185,Math.min(-110,N0)));
      o.push(S.DARR(P.X(0.5),ya+3,P.X(0.5),yb-3,"ink",1.4));o.push(S.T(P.X(0.5)-6,(ya+yb)/2+4,"C/N0 "+_w03_f(cn0,1),"end",10,"ink",true,false,null,true));
      /* (c) システム雑音温度の内訳 */
      if(!nar){var tx=590,ty=60,tw2=110,tmax=Math.max(400,Ts*1.05),TX=function(v){return ty+170-v/tmax*170;};
        o.push(S.T(tx-40,by-24,"(c) 雑音温度","start",11,"ink",true));
        o.push(S.L(tx,ty,tx,ty+170,"muted",1.2));[0,100,200,300,400].filter(function(v){return v<=tmax;}).forEach(function(v){o.push(S.L(tx-4,TX(v),tx,TX(v),"muted",1));o.push(S.T(tx-7,TX(v)+3.5,String(v),"end",9,"muted"));});
        o.push(S.T(tx-34,ty+85,"[K]","middle",9.5,"muted"));
        if(only.get()){o.push(S.RECT(tx+14,TX(_W03_T0),40,TX(0)-TX(_W03_T0),2,U.soft("teal"),"teal",1.2));o.push(S.T(tx+60,TX(_W03_T0/2)+4,"290 K","start",9.5,"teal",true));}
        else{o.push(S.RECT(tx+14,TX(ta.get()),40,TX(0)-TX(ta.get()),2,U.soft("teal"),"teal",1.2));o.push(S.RECT(tx+14,TX(Ts),40,TX(ta.get())-TX(Ts),2,U.soft("alias"),"alias",1.2));
          o.push(S.TX(tx+60,TX(ta.get()/2)+4,"T_{ant} "+ta.get(),"start",9,"teal",true));o.push(S.TX(tx+60,TX(ta.get()+Te/2)+4,"T_e "+_w03_f(Te,0),"start",9,"alias",true));}
        o.push(S.TX(tx+34,TX(Ts)-6,"T_{sys} "+_w03_f(Ts,1),"middle",9.5,"ink",true,true));}
      box.set(S.svg(Wd,nar?by+290:320,o));
      /* 読み出し（回線計算の表） */
      var rows=[["衛星の EIRP",_w03_f(ei.get(),1)+" dBW",_w03_f(eirpm,1)+" dBm"],
        ["自由空間損失（距離 "+_w03_g(r/1e3)+" km）","−"+_w03_f(L,1)+" dB",_w03_f(c1,1)+" dBm"],
        ["大気による損失（例の値）","−0.5 dB",_w03_f(c2,1)+" dBm"],
        ["そのほかの損失",(ls.get()>0?"−":"")+_w03_f(ls.get(),1)+" dB",_w03_f(c3,1)+" dBm"],
        ["受信アンテナの利得",(ga>=0?"+":"")+_w03_f(ga,1)+" dBi","<b>C = "+_w03_f(C,1)+" dBm</b>"],
        ["システム雑音温度",only.get()?"290 K（熱雑音だけ）":ta.get()+" + "+_w03_f(Te,1)+" = "+_w03_f(Ts,1)+" K","<b>N<sub>0</sub> = "+_w03_f(N0,1)+" dBm/Hz</b>"],
        ["C/N0","C − N<sub>0</sub>","<b>"+_w03_f(cn0,1)+" dB-Hz</b>"],
        ["積分の後の SNR（1 ms・20 ms）","C/N0 − 30.0・− 17.0",_w03_f(cn0-30,1)+" dB・"+_w03_f(cn0-16.99,1)+" dB"]];
      ro.innerHTML=(nar?U.tbl(["項目","値 → 累計"],rows.map(function(r){return [r[0],r[1]+"<br>→ "+r[2]];}),["wrap","right"]).split('class="wrap" style="text-align:left"').join('class="wrap" style="text-align:left;min-width:5em"'):U.tbl(["項目","値","累計"],rows,["left","right","right"]))+'<div class="wnote">地球の半径 6 371 km、軌道の半径 26 560 km の円で距離を計算した。EIRP の初めの値 26.4 dBW は、規格の受信電力の最小値（−128.5 dBm）を、仰角 5°・0 dBi・大気 0.5 dB として逆算した例の値で、衛星は向きによらず同じ EIRP で出すとした。例のアンテナの利得とアンテナの雑音温度は例の値（代表値）。LNA は 1 段だけで、後の段の雑音は 9 章で扱う。</div>';
    }
    draw();
  };

  /* ---- 6 節: C/N0 で決まるもの（捕捉・データ・距離） ---- */
  REG.w03_cn0=function(el,U){
    var S=U.S,PM=U.gnss.pm(1),D0=300,PM2=new Float64Array(2046);for(var i0=0;i0<2046;i0++)PM2[i0]=PM[i0%1023];
    U.head(el,"WHAT C/N0 DECIDES","C/N0 で決まるもの — 捕捉・データ・距離の雑音");
    var r1=U.ctrls(el);
    var cn=U.slider(r1,"C/N0",{min:15,max:50,step:0.5,value:45,fmt:function(v){return _w03_f(v,1)+" dB-Hz";},onInput:function(){keep=null;run();}});
    var ta=U.select(r1,"捕捉の積分の時間",["1 ms","10 ms","20 ms"],0,function(){tries=null;run();});
    var br=U.btnrow(el),seed=1,keep=null,tries=null;
    U.button(br,"本文の例（45 dB-Hz・1 ms）",function(){cn.set(45);ta.set(0);keep=null;tries=null;run();});
    U.button(br,"10 dB 下げる",function(){keep={cn:cn.get(),e:ER.slice()};cn.set(Math.max(15,cn.get()-10));tries=null;run(true);});
    U.button(br,"10 dB 上げる",function(){keep={cn:cn.get(),e:ER.slice()};cn.set(Math.min(50,cn.get()+10));tries=null;run(true);});
    U.button(br,"捕捉を 100 回試す",function(){var ok=0;for(var t=0;t<100;t++){seed++;if(acq().im===D0)ok++;}tries={ok:ok,cn:cn.get(),M:mt()};run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;keep=null;run();});
    var box=U.svgbox(el),ro=U.readout(el),A=null,BITS=null,ER=[];
    function mt(){return [1,10,20][ta.get()];}
    /* 捕捉: チップ単位の 2 つの成分（振幅 1）を M 周期足し、1023 通りのずれで相関の電力 */
    function acq(){var q=Math.pow(10,cn.get()/10),M=mt(),sw=Math.sqrt(_W03_RC/(2*q))/Math.sqrt(M),g=U.rng(seed*7907+11),xr=new Float64Array(1023),xi=new Float64Array(1023),k,d;
      for(k=0;k<1023;k++){var c=PM[(k-D0+1023)%1023];xr[k]=c*Math.cos(0.9)+sw*g.normal();xi[k]=c*Math.sin(0.9)+sw*g.normal();}
      var P=new Float64Array(1023),pn=2*sw*sw/1023,im=0;
      for(d=0;d<1023;d++){var sr=0,si=0,o2=1023-d;for(k=0;k<1023;k++){var cc=PM2[k+o2];sr+=xr[k]*cc;si+=xi[k]*cc;}sr/=1023;si/=1023;P[d]=(sr*sr+si*si)/pn;if(P[d]>P[im])im=d;}
      return {P:P,im:im};}
    /* データ: 1 bit（20 ms）の Y_I の雑音を、4 節の分散 N0/T_b の正規分布から作る（信号の部分 ±1） */
    function bits(){var q=Math.pow(10,cn.get()/10),sb=1/Math.sqrt(2*q*0.02),g=U.rng(seed*6151+5),out=[];
      for(var i=0;i<300;i++){var b=g.next()<0.5?1:-1,y=b+sb*g.normal();out.push({b:b,e:(y>=0?1:-1)!==b});}return out;}
    /* 距離: 20 ms ごとの早い所・遅い所の雑音（分散 N0/T）から頂点のずれを求め、50 回（1 s）平均を 60 s 分 */
    function rng(){var q=Math.pow(10,cn.get()/10),sw=1/Math.sqrt(2*q*0.02),g=U.rng(seed*3571+9),cm=_W03_C*_W03_TC,out=[];
      for(var s=0;s<60;s++){var m=0;for(var j=0;j<50;j++){var w1=sw*g.normal(),w2=sw*g.normal();m+=-(w1-w2)/2;}out.push(m/50*cm);}return out;}
    function run(){A=acq();BITS=bits();ER=rng();draw();}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],q=Math.pow(10,cn.get()/10),M=mt(),snr=cn.get()+10*Math.log10(M*1e-3),k;
      /* (a) 捕捉 */
      var top=Math.max(14,1.12*A.P[A.im]),P=U.plot(64,30,nar?320:600,90,[0,1023],[0,top]);
      o.push(S.T(nar?6:14,16,"(a) 捕捉: "+M+" ms の積分の相関の電力（雑音の平均 = 1）","start",11,"ink",true));
      o.push(P.axes({xt:[0,256,512,768,1023],yt:U.nice(0,top,3).filter(function(v){return v<=top;}),xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},ylOff:40}));
      var dp="";for(var px=0;px<Math.round(P.w);px++){var j0=Math.floor(px/P.w*1023),j1=Math.max(j0+1,Math.floor((px+1)/P.w*1023)),mx=0;for(var j=j0;j<j1;j++)mx=Math.max(mx,A.P[j]);dp+="M"+(P.x+px+0.5).toFixed(1)+","+P.Y(0).toFixed(1)+"V"+P.Y(mx).toFixed(1);}
      o.push(S.PATH(dp,"teal",1));o.push(S.L(P.X(D0),P.y,P.X(D0),P.y+P.h,"signal",1,"3 3"));
      var ok=A.im===D0;o.push(S.D(P.X(A.im),P.Y(A.P[A.im]),ok?"green":"alias",4.6));
      o.push(S.T(nar?P.x:P.x+P.w,nar?P.y+P.h+30:P.y-4,ok?"最大 = 本当のずれ（見つかる）":"最大が別のずれ "+A.im+" チップ（見誤る）",nar?"start":"end",10,ok?"green":"alias",true));
      /* (b) データ */
      var dy=nar?186:160,cw=nar?10:16,chh=nar?11:12,x0=nar?64:70,ne=0;
      o.push(S.T(nar?6:14,dy-6,"(b) データ: 1 つのサブフレーム（10 ワード × 30 bit）の読み誤り","start",11,"ink",true));
      for(var w=0;w<10;w++)for(var b=0;b<30;b++){var B=BITS[w*30+b];if(B.e)ne++;o.push(S.RECT(x0+b*cw,dy+4+w*chh,cw-1.5,chh-1.5,1,B.e?U.soft("alias"):U.soft("green"),B.e?"alias":"green",B.e?1.4:0.5));}
      var ex=x0+30*cw+12,pb=_w03_Q(Math.sqrt(2*q*0.02)),pok=Math.pow(1-pb,300);
      if(!nar){o.push(S.T(ex,dy+20,"読み誤り "+ne+" bit / 300 bit","start",10.5,ne?"alias":"green",true));
        o.push(S.TX(ex,dy+38,"P_b = Q(√(2E_b/N_0))","start",9.5,"ink"));o.push(S.T(ex,dy+53,"= "+_w03_sci(pb,1),"start",9.5,"ink"));
        o.push(S.T(ex,dy+70,"全部正しい確率 "+_w03_f(pok,3),"start",9.5,"ink"));
        if(cn.get()<25)o.push(S.T(ex,dy+92,"25 dB-Hz より下では、搬送波の","start",9,"alias",true));
        if(cn.get()<25)o.push(S.T(ex,dy+105,"位相を合わせ続けにくい（代表値）","start",9,"alias",true));}
      /* (c) 距離 */
      var ry=nar?336:316,cm=_W03_C*_W03_TC,sig1=cm/(2*Math.sqrt(q*1.0)),ymax=30,R=U.plot(64,ry,nar?320:600,110,[0,60],[-ymax,ymax]);
      o.push(S.T(nar?6:14,ry-12,"(c) 距離: 1 s ごとの擬似距離の雑音（60 s）","start",11,"ink",true));
      o.push(R.axes({xt:[0,10,20,30,40,50,60],yt:[-30,-15,0,15,30],xfmt:function(v){return String(v);},yfmt:function(v){return String(v).replace("-","−");},xl:"時間 [s]",yl:"[m]",ylOff:30}));
      if(sig1<ymax){o.push(R.line([[0,sig1],[60,sig1]],"signal",1,"4 3"));o.push(R.line([[0,-sig1],[60,-sig1]],"signal",1,"4 3"));}
      if(keep)keep.e.forEach(function(v,i){if(Math.abs(v)<=ymax)o.push(S.D(R.X(i+0.5),R.Y(v),"faint",2.6));});
      ER.forEach(function(v,i){var vv=Math.max(-ymax,Math.min(ymax,v));o.push(S.D(R.X(i+0.5),R.Y(vv),Math.abs(v)>ymax?"alias":"signal",2.8));});
      if(cn.get()<20)o.push(S.T(R.x+R.w/2,R.y+16,"20 dB-Hz より下では、符号の追尾を続けにくい（代表値）","middle",9.5,"alias",true,false,null,true));
      if(keep)o.push(S.LEGL(R.x,R.y+R.h+46,[["signal",null,"いまの C/N0 "+_w03_f(cn.get(),1)],["faint",null,"前の C/N0 "+_w03_f(keep.cn,1)]],9.5,14));
      box.set(S.svg(Wd,R.y+R.h+(keep?56:42),o));
      /* 読み出し */
      var ms=0;ER.forEach(function(v){ms+=v*v;});var sdm=Math.sqrt(ms/ER.length),h="";
      h+="捕捉: SNR = C/N0 + 10 log<sub>10</sub>(T<sub>coh</sub>) = <b>"+_w03_f(snr,1)+" dB</b>"+(ok?'（<span class="ok">見つかる</span>）':'（<span class="warn">見誤る</span>）')+"。最大が本当のずれに来る割合は、SNR 8.4 dB で 50 %、11.1 dB で 90 %（本文のシミュレーション）";
      if(tries)h+="<br>100 回試した結果（"+_w03_f(tries.cn,1)+" dB-Hz・"+tries.M+" ms）: <b>"+tries.ok+" 回</b>見つかった";
      h+="<br>データ: E<sub>b</sub>/N<sub>0</sub> = C/N0 − 17.0 = "+_w03_f(cn.get()-16.99,1)+" dB、ビット誤り率 P<sub>b</sub> = <b>"+_w03_sci(pb,1)+"</b>、このサブフレームの読み誤り "+ne+" bit、300 bit を全部正しく読む確率 "+_w03_f(pok,3);
      h+="<br>距離: σ<sub>ρ</sub> = cT<sub>c</sub>/(2√((C/N0) × 1 s)) = <b>"+_w03_f(sig1,2)+" m</b>（式）、60 s の値の 2 乗平均の平方根 "+_w03_f(sdm,2)+" m（シミュレーション）"+(keep?"。前の C/N0 "+_w03_f(keep.cn,1)+" dB-Hz の式の値 "+_w03_f(cm/(2*Math.sqrt(Math.pow(10,keep.cn/10))),2)+" m の "+_w03_f(sig1/(cm/(2*Math.sqrt(Math.pow(10,keep.cn/10)))),2)+" 倍":"");
      ro.innerHTML=h+'<div class="wnote">捕捉は、PRN 1 の符号（本当のずれ 300 チップ）に 2 つの成分の雑音を足して相関をとるシミュレーション（周波数のずれ 0、1 チップごとのずれ）。データと距離は、搬送波の位相が合っているとして、4 節で導いて確かめた雑音の分布（平均 0・分散 N<sub>0</sub>/T<sub>coh</sub> の正規分布）から乱数で作った。距離は、20 ms ごとに早い所・遅い所（±0.5 チップ）の相関から 2 章の式で頂点を求め、50 回（1 s）平均した。追尾の仕組み（5 章）は含めていない。しきい値の注意は代表値による。</div>';
    }
    run();
  };

  /* ===== 04 章 受信機の中 — RF フロントエンドから相関器まで ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w04_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w04_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w04_g(v,d){var s=_w04_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  function _w04_sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
  function _w04_db(x){return 10*Math.log10(Math.max(x,1e-300));}
  var _W04_FL1=1575.42,_W04_RC=1.023,_W04_KB=1.380649e-23;
  function _w04_dbmhz(T){return 10*Math.log10(_W04_KB*T)+30;}   /* 温度 T [K] の熱雑音の密度 [dBm/Hz] */

  /* ---- 2 節: RF フロントエンドの各段（周波数の見方 ↔ 時間の見方） ---- */
  /* 例の値: アンテナの雑音温度 100 K、最初の増幅器（LNA）18 dB・1 dB、混合器の段 20 dB・3 dB、中間周波数の段 68.5 dB・10 dB */
  var _W04_ST=[{k:"A",nm:"アンテナ",lab:"アンテナの出力"},{k:"B",nm:"LNA",lab:"LNA の後"},{k:"C",nm:"フィルタ",lab:"混合器の前のフィルタの後"},
    {k:"D",nm:"混合器",lab:"混合器の後"},{k:"E",nm:"IF フィルタ・増幅",lab:"中間周波数のフィルタと増幅の後"}];
  /* 混合器の前のフィルタの減衰 [dB]（例の形: 通す範囲 ±W MHz、外で最大 45 dB） */
  function _w04_rfatt(f,mode){if(mode===0)return 0;var W=mode===1?10:2,Ws=mode===1?15:4,d=Math.max(0,Math.abs(f-_W04_FL1)-W)/Ws;return 1.5+45*(1-Math.exp(-d*d));}
  /* 中間周波数のフィルタの減衰 [dB]（通す範囲 3.069〜5.115 MHz、例の形） */
  function _w04_ifatt(f){var d=Math.max(0,Math.abs(f-4.092)-1.023)/0.8;return 50*(1-Math.exp(-d*d));}
  REG.w04_chain=function(el,U){
    var S=U.S;
    U.head(el,"RF FRONT END","RF フロントエンドの各段 — 周波数の見方と時間の見方");
    var r1=U.ctrls(el);
    var st=U.select(r1,"見る段",_W04_ST.map(function(s,i){return String.fromCharCode(65+i)+": "+s.lab;}),3,function(){draw();});
    var r2=U.ctrls(el);
    var lo=U.slider(r2,"局部発振器の周波数 f<sub>LO</sub>",{min:1561,max:1590,step:0.004,value:1571.328,fmt:function(v){return _w04_f(v,3)+" MHz";},onInput:function(){draw();}});
    lo.el.style.flex="1 1 100%";
    var r3=U.ctrls(el);
    var flt=U.select(r3,"混合器の前のフィルタ",["なし","広い（±10 MHz、例）","狭い（±2 MHz、例）"],1,function(){draw();});
    var irm=U.checkbox(r3,"cos と sin の 2 つの混合器（イメージを 25 dB 弱める、例）",true,function(){draw();});
    var r4=U.ctrls(el);
    var jim=U.checkbox(r4,"イメージ周波数に妨害の電波（アンテナで −100 dBm）",false,function(){draw();});
    var jfar=U.checkbox(r4,"帯域の外の強い電波（1710 MHz・−30 dBm、例）",false,function(){draw();});
    var nz=U.checkbox(r4,"波形に雑音を足す",true,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（1571.328 MHz）",function(){lo.set(1571.328);flt.set(1);irm.set(true);jim.set(false);jfar.set(false);nz.set(true);st.set(3);draw();});
    U.button(br,"局部発振器を高い側に（1579.512 MHz）",function(){lo.set(1579.512);draw();});
    U.button(br,"イメージを除かない（フィルタ広い・混合器 1 つ）",function(){flt.set(1);irm.set(false);jim.set(true);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var dg=U.svgbox(el),box=U.svgbox(el),wv=U.svgbox(el),ro=U.readout(el),HB=[];
    U.ctl.drag(dg,function(type,x,y){if(type!=="down"||x==null)return false;for(var i=0;i<HB.length;i++){var b=HB[i];if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3]){st.set(i);draw();return false;}}return false;});
    /* 各段の値（dBm と dBm/Hz）。f は MHz */
    function model(){
      var fLO=lo.get(),fm=flt.get(),ir=irm.get(),fIF=Math.abs(_W04_FL1-fLO),side=_W04_FL1>=fLO?1:-1,fim=2*fLO-_W04_FL1;
      var N0a=_w04_dbmhz(100),Te1=(Math.pow(10,0.1)-1)*290,Te3=(Math.pow(10,0.3)-1)*290,Te4=(Math.pow(10,1.0)-1)*290;
      var G1=18,G3=20,G4=68.5,IRR=25;
      /* 点 B（LNA の後）の雑音の密度（周波数によらない） */
      var NB=_w04_dbmhz(100+Te1)+G1;
      function nC(f){var a=_w04_rfatt(f,fm);var lin=Math.pow(10,(NB-a)/10)+(a>0?(1-Math.pow(10,-a/10))*Math.pow(10,_w04_dbmhz(290)/10):0);return 10*Math.log10(lin);}
      function sA(f){var s=_w04_sinc((f-_W04_FL1)/_W04_RC);return -128.5+10*Math.log10(1/1.023e6)+10*Math.log10(Math.max(s*s,1e-12));}
      /* 混合器の出力の周波数 f'（≥ 0）に来る、入力の 2 つの周波数（求めたい側と反対側） */
      function inputs(fp){var up=fLO+fp,dn=fLO-fp;return side>0?{want:up,other:dn}:{want:dn,other:up};}
      var otherG=ir?-IRR:0;
      function nD(fp){var q=inputs(fp),a=Math.pow(10,(nC(q.want)+G3)/10),b=Math.pow(10,(nC(q.other)+G3+otherG)/10),m=Math.pow(10,(_w04_dbmhz(Te3)+G3)/10);return 10*Math.log10(a+b+m);}
      function sD(fp){var q=inputs(fp);var a=Math.pow(10,(sA(q.want)+G1-_w04_rfatt(q.want,fm)+G3)/10),b=Math.pow(10,(sA(q.other)+G1-_w04_rfatt(q.other,fm)+G3+otherG)/10);return 10*Math.log10(a+b);}
      function nE(fp){var ai=_w04_ifatt(fp);return 10*Math.log10(Math.pow(10,(nD(fp)-ai+G4)/10)+Math.pow(10,(_w04_dbmhz(Te4)+G4)/10));}
      function sE(fp){return sD(fp)-_w04_ifatt(fp)+G4;}
      /* 妨害（連続波）: [周波数, 電力] の列 */
      function jams(stage){var o=[];
        [[jim.get(),fim,-100],[jfar.get(),1710,-30]].forEach(function(j){if(!j[0])return;var f=j[1],p=j[2];
          if(stage===0){o.push([f,p]);return;}p+=G1;if(stage===1){o.push([f,p]);return;}p-=_w04_rfatt(f,fm);if(stage===2){o.push([f,p]);return;}
          var fp=Math.abs(f-fLO),want=(side>0)===(f>=fLO),pd=p+G3+(want?0:otherG);if(stage===3){o.push([fp,pd]);return;}o.push([fp,pd-_w04_ifatt(fp)+G4]);});
        return o;}
      /* 各段の信号の電力・帯域の中の雑音・C/N0（信号のある所の密度で） */
      var C=[-128.5,-110.5,-110.5-_w04_rfatt(_W04_FL1,fm),0,0],N0=[N0a,NB,nC(_W04_FL1),nD(fIF),nE(fIF)];
      C[3]=C[2]+G3;C[4]=C[3]-_w04_ifatt(fIF)+G4;
      return {fLO:fLO,fIF:fIF,fim:fim,side:side,nC:nC,sA:sA,nD:nD,sD:sD,nE:nE,sE:sE,jams:jams,C:C,N0:N0,NB:NB,G1:G1,fm:fm};
    }
    function draw(){
      var M=model(),k=st.get(),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* 構成図 */
      var g=[],bw=nar?62:104,gap=nar?12:30,x0=nar?6:14,y0=22,bh=40;HB=[];
      g.push(S.T(nar?4:10,14,"段の箱を押すと、その後の点の信号を表示する","start",9.5,"muted"));
      for(var i=0;i<5;i++){var xx=x0+i*(bw+gap),sel=i===k,c=i<3?"gold":(i===3?"purple":"signal");
        if(i===0){g.push(S.RECT(xx,y0,bw,bh,7,sel?U.soft("gold"):"panel",sel?"alias":"gold",sel?2.4:1.3));}
        else g.push(S.RECT(xx,y0,bw,bh,7,sel?U.soft(c):"panel",sel?"alias":c,sel?2.4:1.3));
        if(nar&&i===4){g.push(S.T(xx+bw/2,y0+bh/2-2,"IF フィルタ","middle",9,"ink",true));g.push(S.T(xx+bw/2,y0+bh/2+10,"と増幅","middle",9,"ink",true));}
        else g.push(S.T(xx+bw/2,y0+bh/2+4,_W04_ST[i].nm,"middle",nar?9:10.5,"ink",true));
        HB.push([xx,y0,bw,bh]);
        var px=xx+bw+gap/2;g.push(S.CIRC(px,y0+bh/2,8,sel?"alias":"muted",1.4,sel?U.soft("alias"):"screen"));g.push(S.T(px,y0+bh/2+3.5,String.fromCharCode(65+i),"middle",9,sel?"alias":"muted",true));
        if(i<4)g.push(S.ARR(xx+bw,y0+bh/2,xx+bw+gap,y0+bh/2,"signal",1.4,5));}
      var mx=x0+3*(bw+gap)+bw/2;g.push(S.L(mx,y0+bh,mx,y0+bh+14,"gold",1.4));g.push(S.T(mx,y0+bh+26,"局部発振器 "+_w04_f(M.fLO,3)+" MHz","middle",nar?8.5:9.5,"gold",true));
      dg.set(S.svg(Wd,y0+bh+34,g));
      /* 周波数の見方 */
      var rf=k<3,fr=rf?[1540,1720]:[0,30],zr=rf?[_W04_FL1-14,_W04_FL1+14]:null;
      var pw=nar?332:(rf?300:600),lv={0:-200,1:-185,2:-185,3:-170,4:-100}[k],P2=null;
      var P=U.plot(nar?52:66,24,pw,170,fr,[lv,lv+110]);
      o.push(S.T(nar?6:14,14,"(a) 電力スペクトル密度（点 "+String.fromCharCode(65+k)+"）"+(rf?"":"　混合器の出力の周波数"),"start",10.5,"ink",true));
      o.push(P.axes({xl:"周波数 [MHz]",yl:"密度 [dBm/Hz]",xt:rf?[1540,1580,1620,1660,1700]:[0,5,10,15,20,25,30],yt:[lv,lv+20,lv+40,lv+60,lv+80,lv+100],yfmt:function(v){return _w04_f(v,0);},ylOff:44}));
      function curves(PP,lo_,hi_,n){var a=[],b=[],i;for(i=0;i<=n;i++){var f=lo_+(hi_-lo_)*i/n,nv,sv;
          if(k===0){nv=M.N0[0];sv=M.sA(f);}else if(k===1){nv=M.NB;sv=M.sA(f)+M.G1;}else if(k===2){nv=M.nC(f);sv=M.sA(f)+M.G1-_w04_rfatt(f,M.fm);}
          else if(k===3){nv=M.nD(f);sv=M.sD(f);}else{nv=M.nE(f);sv=M.sE(f);}
          a.push([f,nv]);b.push([f,sv]);}
        return {n:a,s:b};}
      var cv=curves(P,fr[0],fr[1],rf?720:600);
      if(!rf){o.push(S.RECT(P.X(3.069),P.y,P.X(5.115)-P.X(3.069),P.h,0,"var(--muted-soft)","none",0));}
      o.push(P.clip(cv.n,"teal",2));o.push(P.clip(cv.s,"signal",1.8));
      M.jams(k).forEach(function(j){if(j[0]<fr[0]||j[0]>fr[1])return;var rt=j[0]>(fr[0]+fr[1])/2;o.push(S.ARR(P.X(j[0]),P.y+P.h,P.X(j[0]),P.y+4,"alias",2,6));
        o.push(S.T(P.X(j[0])+(rt?-5:5),P.y+14,"妨害 "+_w04_f(j[1],1)+" dBm",rt?"end":"start",9,"alias",true,false,null,true));});
      if(rf&&!nar){
        /* 右: L1 のまわりの拡大 */
        P2=U.plot(430,24,250,170,zr,[lv,lv+110]);
        o.push(S.T(420,14,"L1 のまわり","start",10,"muted",true));
        o.push(P2.axes({xl:"周波数 [MHz]",xt:[1562,1568,1574,1580,1586],yt:[lv,lv+20,lv+40,lv+60,lv+80,lv+100],yfmt:function(){return "";}}));
        var c2=curves(P2,zr[0],zr[1],400);o.push(P2.clip(c2.n,"teal",2));o.push(P2.clip(c2.s,"signal",1.8));
        o.push(S.L(P2.X(M.fLO),P2.y,P2.X(M.fLO),P2.y+P2.h,"gold",1.6,"5 3"));o.push(S.TX(P2.X(M.fLO),P2.y+10,"f_LO","middle",9,"gold",true,true));
        if(M.fim>zr[0]&&M.fim<zr[1]){o.push(S.L(P2.X(M.fim),P2.y,P2.X(M.fim),P2.y+P2.h,"teal",1.2,"2 3"));o.push(S.T(P2.X(M.fim),P2.y+22,"イメージ","middle",9,"teal",true,false,null,true));}
        M.jams(k).forEach(function(j){if(j[0]<zr[0]||j[0]>zr[1])return;o.push(S.ARR(P2.X(j[0]),P2.y+P2.h,P2.X(j[0]),P2.y+4,"alias",2,6));});
        o.push(S.RECT(P.X(zr[0]),P.y,P.X(zr[1])-P.X(zr[0]),P.h,0,"none","muted",1,"3 3"));
      }
      if(!rf){var fi=M.fIF;if(fi<=30){o.push(S.L(P.X(fi),P.y,P.X(fi),P.y+P.h,"signal",1,"3 3"));o.push(S.T(P.X(fi)+4,P.y+24,"中間周波数 "+_w04_f(fi,3),"start",9,"signal",true,false,null,true));}
        o.push(S.T(P.X(5.115)+4,P.y+40,"← IF フィルタの範囲","start",9,"muted",false,false,null,true));
        }
      var ly=P.y+P.h+46;o.push(S.LEGL(nar?52:66,ly,[["teal",null,"雑音"],["signal",null,"信号"],["alias",null,"妨害（連続波。矢印と電力の値）"]],9,12));
      if(!rf){var sumT="和の成分は "+_w04_f(_W04_FL1+M.fLO,1)+" MHz（図の外。IF フィルタで除く）";if(nar){ly+=18;o.push(S.T(6,ly,sumT,"start",9,"purple",true));}else o.push(S.T(P.x+P.w,P.y-4,sumT,"end",9,"purple",true));}
      box.set(S.svg(Wd,ly+10,o));
      /* 時間の見方（周波数は縮めて描く: L1 を 1 チップに 16 周期、中間周波数は実際の比） */
      var q=[],NS=2*400,chips=[1,-1],rg=U.rng(seed*7919+5),RFs=16,IFs=M.fIF/_W04_RC,LOs=RFs-M.side*IFs,IMs=2*LOs-RFs;
      var snr=Math.pow(10,(M.C[Math.min(k,2)]-(M.N0[Math.min(k,2)]+63.1))/10);   /* 2.046 MHz の中の SN 比（真数） */
      if(k>=3)snr=Math.pow(10,(M.C[k]-(M.N0[k]+63.1))/10);
      var aI=new Float64Array(NS),aQ=new Float64Array(NS),bI=0,bQ=0,sm=0.06;   /* 狭い帯域の雑音（2 チップの幅の平均で滑らかにする） */
      for(var j=0;j<NS;j++){bI=bI*(1-sm)+sm*rg.normal();bQ=bQ*(1-sm)+sm*rg.normal();aI[j]=bI;aQ[j]=bQ;}
      var vI=0;for(j=0;j<NS;j++)vI+=aI[j]*aI[j]+aQ[j]*aQ[j];vI=Math.sqrt(vI/NS/2);
      var nsc=nz.get()?1/Math.sqrt(snr):0,jamA=0;
      if(jim.get()){var jp=k===0?-100:(-100+M.G1-(k>=2?_w04_rfatt(M.fim,M.fm):0));var cp=k===0?M.C[0]:(k===1?M.C[1]:M.C[2]);jamA=Math.sqrt(Math.pow(10,(jp-cp)/10));
        if(k>=3&&irm.get())jamA*=Math.pow(10,-25/20);}
      var sig=[],tot=[],tt=[];
      for(j=0;j<NS;j++){var t=j/400,a=chips[Math.min(1,Math.floor(t))],ph=0.6,s,n,x;
        var nI=aI[j]/vI*nsc,nQ=aQ[j]/vI*nsc;
        if(k<3){s=a*Math.cos(2*Math.PI*RFs*t+ph);n=nI*Math.cos(2*Math.PI*RFs*t)-nQ*Math.sin(2*Math.PI*RFs*t);x=s+n+jamA*Math.cos(2*Math.PI*IMs*t);}
        else if(k===3){var l=2*Math.cos(2*Math.PI*LOs*t);s=a*Math.cos(2*Math.PI*RFs*t+ph)*l;n=(nI*Math.cos(2*Math.PI*RFs*t)-nQ*Math.sin(2*Math.PI*RFs*t))*l;x=s+n+jamA*Math.cos(2*Math.PI*IMs*t)*l;}
        else{var inb=Math.abs(M.fIF-4.092)<1.023;s=inb?a*Math.cos(2*Math.PI*IFs*t+M.side*ph):0;n=nI*Math.cos(2*Math.PI*IFs*t)-nQ*Math.sin(2*Math.PI*IFs*t);x=s+n+(Math.abs(M.fIF-4.092)<1.023?jamA*Math.cos(2*Math.PI*IFs*t):0);}
        tt.push(t);sig.push(s);tot.push(x);}
      var am=0;tot.forEach(function(v){am=Math.max(am,Math.abs(v));});sig.forEach(function(v){am=Math.max(am,Math.abs(v)*5);});am=am*1.05||1;
      var Pw=U.plot(nar?20:30,22,nar?360:640,120,[0,2],[-am,am]);
      q.push(S.T(nar?6:14,14,"(b) 波形（点 "+String.fromCharCode(65+k)+"。周波数は縮めて描いた: L1 を 1 チップに 16 周期）","start",10.5,"ink",true));
      q.push(S.RECT(Pw.x,Pw.y,Pw.w,Pw.h,2,"screen","line",0.8));q.push(S.L(Pw.X(1),Pw.y,Pw.X(1),Pw.y+Pw.h,"faint",1,"3 3"));
      if(nz.get()||jim.get())q.push(Pw.line(tt.map(function(t,i){return [t,tot[i]];}),"teal",1.0));
      q.push(Pw.line(tt.map(function(t,i){return [t,sig[i]*5];}),"signal",1.6));
      q.push(S.T(Pw.X(0.5),Pw.y+Pw.h+14,"チップ +1","middle",9,"muted"));q.push(S.T(Pw.X(1.5),Pw.y+Pw.h+14,"チップ −1（位相が反転）","middle",9,"muted"));
      q.push(S.LEGL(nar?20:30,Pw.y+Pw.h+34,[["signal",null,"信号だけ（5 倍に拡大）"],["teal",null,"信号 + 雑音"+(jim.get()?" + 妨害":"")]],9,12));
      wv.set(S.svg(Wd,Pw.y+Pw.h+42,q));
      /* 読み出し */
      var Ck=M.C[k],N0k=M.N0[k],cn0=Ck-N0k,base=M.C[0]-_w04_dbmhz(100+(Math.pow(10,0.1)-1)*290);
      var h="点 "+String.fromCharCode(65+k)+"（"+_W04_ST[k].lab+"）: 信号の電力 <b>"+_w04_f(Ck,1)+" dBm</b>、雑音の密度 "+_w04_f(N0k,1)+" dBm/Hz（2.046 MHz の中で "+_w04_f(N0k+63.1,1)+" dBm）、帯域の中の SN 比 "+_w04_f(Ck-N0k-63.1,1)+" dB、C/N0 <b>"+_w04_f(cn0,1)+" dB-Hz</b>";
      if(k>=1)h+="（LNA の後の 47.7 dB-Hz との差 "+_w04_f(cn0-base,2)+" dB）";
      h+="<br>中間周波数 |f<sub>L1</sub> − f<sub>LO</sub>| = <b>"+_w04_f(M.fIF,3)+" MHz</b>、イメージ周波数 2f<sub>LO</sub> − f<sub>L1</sub> = "+_w04_f(M.fim,3)+" MHz（混合器の前のフィルタで "+_w04_f(_w04_rfatt(M.fim,M.fm)-(M.fm?1.5:0),1)+" dB 弱まる"+(irm.get()?"、2 つの混合器でさらに 25 dB":"")+"）";
      if(M.side<0)h+="。局部発振器が L1 より高いので、周波数の並びが裏返る（ドップラーの符号が逆になる）";
      if(Math.abs(M.fIF-4.092)>=1.023)h+='<br><span class="warn">中間周波数が IF フィルタの通す範囲（3.069〜5.115 MHz）から外れ、点 E では信号が通らない</span>';
      if(jim.get()&&k>=3){var jj=M.jams(k).filter(function(j){return Math.abs(j[0]-M.fIF)<0.01;});if(jj.length)h+='<br>イメージの妨害は中間周波数に来て、電力 '+_w04_f(jj[0][1],1)+' dBm（信号より '+_w04_f(jj[0][1]-Ck,1)+' dB '+(jj[0][1]>Ck?'強い':'弱い')+'）'+(jj[0][1]-Ck>-10?'。<span class="warn">フィルタか 2 つの混合器で、混合器より前に除く必要がある</span>':'');}
      if(jfar.get()){var pj=k===0?-30:(k===1?-30+M.G1:-30+M.G1-_w04_rfatt(1710,M.fm));h+="<br>1710 MHz の電波: 点 "+String.fromCharCode(65+Math.min(k,2))+" で "+_w04_f(pj,1)+" dBm"+(k===1||(k>=2&&M.fm===0)?'。<span class="warn">強いまま後の段に入ると、増幅器が飽和しうる（9 章 4 節）</span>':'。混合器の前のフィルタで弱まる');}
      ro.innerHTML=h+'<div class="wnote">値はどれも例の値（アンテナの雑音温度 100 K、LNA 18 dB・雑音指数 1 dB、混合器の段 20 dB・3 dB、中間周波数の段 68.5 dB・10 dB、フィルタは例の形）。信号の電力は L1 C/A の受信電力の最小値 −128.5 dBm。和の成分と、中間周波数のフィルタの外の雑音は、波形には描いていない。波形の周波数は描きやすい値に縮めた。</div>';
    }
    draw();
  };

  /* ---- 3 節: サンプリングと量子化（標本にした後のスペクトラム ↔ 値の分布 ↔ 相関の後の SN 比の損失） ---- */
  var _W04_FSL=[32.736,16.368,10.912,10.23,8.184,5.456,4.092],_W04_HT={},_W04_SH={};
  /* H(t) = ∫0^t B sinc(Bu) du（理想の低域フィルタのステップ応答の半分）を 1/256 チップごとの表にする */
  function _w04_Htab(B){var key=String(B);if(_W04_HT[key])return _W04_HT[key];
    var res=256,span=26,n=span*res,dt=1/1.023e6/res,H=new Float64Array(n+1),prev=B;
    for(var i=1;i<=n;i++){var x=B*i*dt,h=B*Math.sin(Math.PI*x)/(Math.PI*x);H[i]=H[i-1]+(prev+h)/2*dt;prev=h;}
    return (_W04_HT[key]={H:H,n:n,dt:dt});}
  function _w04_Hv(T,t){var a=Math.abs(t)/T.dt;if(a>=T.n)return (t<0?-1:1)*T.H[T.n];var i=Math.floor(a),f=a-i,v=T.H[i]*(1-f)+T.H[i+1]*f;return t<0?-v:v;}
  /* 量子化器: mode 0 = 1 bit、1 = 2 bit（±1・±3、しきい値 γσ）、2 = 3 bit（±1〜±7、段の幅 γσ）、3 = しない */
  function _w04_quantizer(mode,beta){
    if(mode===3)return {g:1,Eq2:1,Rq:function(r){return r;},q:function(x){return x;}};
    if(mode===0)return {g:Math.sqrt(2/Math.PI),Eq2:1,Rq:function(r){return 2/Math.PI*Math.asin(Math.max(-1,Math.min(1,r)));},q:function(x){return x>=0?1:-1;}};
    var th=mode===1?[beta]:[beta,2*beta,3*beta],lv=mode===1?[1,3]:[1,3,5,7],phi=function(x){return Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);};
    var Phi=function(x){var z=Math.abs(x)/Math.SQRT2,t=1/(1+0.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?1-r/2:r/2;};
    var jumps=[[0,2*lv[0]]];th.forEach(function(t,j){jumps.push([t,2*(lv[j+1]-lv[j])]);});
    var NT=41,cs=new Float64Array(NT),fac=new Float64Array(NT);fac[0]=1;for(var n=1;n<NT;n++)fac[n]=fac[n-1]*n;
    for(n=1;n<NT;n+=2){var v=0;jumps.forEach(function(jh){var x=jh[0],h0=1,h1=x,he;if(n-1===0)he=1;else{for(var m=1;m<n-1;m++){var h2=x*h1-m*h0;h0=h1;h1=h2;}he=h1;}v+=jh[1]*phi(x)*he;});cs[n]=v;}
    var edges=[0].concat(th),Eq2=0;for(var j=0;j<lv.length;j++){var a=edges[j],b=j+1<edges.length?edges[j+1]:Infinity;Eq2+=2*((b===Infinity?1:Phi(b))-Phi(a))*lv[j]*lv[j];}
    return {g:cs[1],Eq2:Eq2,Rq:function(r){var s=0,p=r,r2=r*r;for(var n=1;n<NT;n+=2){s+=cs[n]*cs[n]/fac[n]*p;p*=r2;}return s;},
      q:function(x){var a=Math.abs(x),k=0;while(k<th.length&&a>=th[k])k++;return (x>=0?1:-1)*lv[k];}};
  }
  /* 帯域 [fL, fH] が、f_s/2 ごとの区間の境目をまたぐか。返り値 {ok, fa（見かけの中間周波数）, inv, deg（位相が失われる）} */
  function _w04_fold(fif,B,fs){var h=fs/2,fL=fif-B/2,fH=fif+B/2,zl=Math.floor((fL+1e-9)/h),zh=Math.floor((fH-1e-9)/h),fa=fif%fs,inv=false;if(fa>h){fa=fs-fa;inv=true;}
    var deg=Math.abs(fa)<1e3||Math.abs(fa-h)<1e3;return {ok:zl===zh,fa:fa,inv:inv,deg:deg,fL:fL,fH:fH};}
  /* 共通の部分（フィルタを通した信号の標本・局部の参照・参照の自己相関）を計算して残す */
  function _w04_shared(U,B,fs){var key=B+"_"+fs;if(_W04_SH[key])return _W04_SH[key];
    var J=Math.round(fs*1e-3),RC=1.023e6,TC=1/RC,fif=4.092e6,PM=U.gnss.pm(1),Ht=_w04_Htab(B),F=_w04_fold(fif,B,fs),fa=F.fa;
    var s=new Float64Array(J),rI=new Float64Array(J),rQ=new Float64Array(J),sI=0,sQ=0;
    for(var k=0;k<J;k++){var t=k/fs,n0=Math.floor(t*RC),a=0;
      for(var d=-24;d<=24;d++){var n=n0+d,c=PM[((n%1023)+1023)%1023],tt=t-n*TC;a+=c*(_w04_Hv(Ht,tt)-_w04_Hv(Ht,tt-TC));}
      s[k]=a*Math.cos(2*Math.PI*fif*t+0.3);var lc=PM[n0%1023];rI[k]=lc*2*Math.cos(2*Math.PI*fa*t);rQ[k]=lc*2*Math.sin(2*Math.PI*fa*t);sI+=s[k]*rI[k];sQ+=s[k]*rQ[k];}
    var ML=Math.ceil(1.5*fs*TC),CI=new Float64Array(ML+1),CQ=new Float64Array(ML+1),rho=new Float64Array(ML+1);
    for(var m=0;m<=ML;m++){var ci=0,cq=0;for(k=0;k<J;k++){var k2=k+m;if(k2>=J)k2-=J;ci+=rI[k]*rI[k2];cq+=rQ[k]*rQ[k2];}CI[m]=ci;CQ[m]=cq;var x=B*m/fs;rho[m]=(m===0?1:Math.sin(Math.PI*x)/(Math.PI*x))*Math.cos(2*Math.PI*fif*m/fs);}
    return (_W04_SH[key]={J:J,s:s,rI:rI,rQ:rQ,sI:sI,sQ:sQ,CI:CI,CQ:CQ,rho:rho,ML:ML,F:F});}
  /* 弱い信号の近似の損失 [dB]（(C/N0) T_coh に対する値。N0 = 1、C = 1/2、T_coh = 1 ms） */
  function _w04_semi(U,B,fs,mode,beta){var Z=_w04_shared(U,B,fs),Qz=_w04_quantizer(mode,beta),VI=Qz.Eq2*Z.CI[0],VQ=Qz.Eq2*Z.CQ[0];
    for(var m=1;m<=Z.ML;m++){var r=Qz.Rq(Z.rho[m]);VI+=2*r*Z.CI[m];VQ+=2*r*Z.CQ[m];}
    VI/=Z.J*Z.J;VQ/=Z.J*Z.J;var sg=Math.sqrt(B),EI=Qz.g/sg*Z.sI/Z.J,EQ=Qz.g/sg*Z.sQ/Z.J;
    return 10*Math.log10((EI*EI+EQ*EQ)/(VI+VQ)/(0.5*1e-3));}
  REG.w04_quant=function(el,U){
    var S=U.S;
    U.head(el,"SAMPLING & QUANTIZATION","サンプリングと量子化 — 相関の後の SN 比の損失");
    var r1=U.ctrls(el);
    var fsS=U.select(r1,"サンプリング周波数 f<sub>s</sub>",["32.736 MHz","16.368 MHz（本文の例）","10.912 MHz","10.23 MHz（n = 1 の下限）","8.184 MHz（半分が中間周波数）","5.456 MHz（帯域通過サンプリング）","4.092 MHz（中間周波数と同じ）"],1,function(){mc=null;draw();});
    var bS=U.select(r1,"前段のフィルタの幅 B<sub>IF</sub>",["2.046 MHz（本文の例）","4.092 MHz"],0,function(){mc=null;draw();});
    var r2=U.ctrls(el);
    var qs=U.seg(r2,["1 bit","2 bit","3 bit","量子化しない"],1,function(i){bt.set(i===2?0.6:1.0);mc=null;draw();});
    var bt=U.slider(r2,"しきい値（2 bit）・段の幅（3 bit）",{min:0.2,max:2.5,step:0.05,value:1.0,fmt:function(v){return _w04_f(v,2)+" σ";},onInput:function(){mc=null;draw();}});
    var br=U.btnrow(el),seed=1,mc=null,busy=false;
    U.button(br,"本文の例（16.368 MHz・2 bit・1.0σ）",function(){fsS.set(1);bS.set(0);qs.set(1);bt.set(1.0);mc=null;draw();});
    U.button(br,"シミュレーションで確かめる（乱数で 48 回）",function(){runMC();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;mc=null;draw();});
    var box=U.svgbox(el),hb=U.svgbox(el),ro=U.readout(el);
    function cfg(){return {fs:_W04_FSL[fsS.get()]*1e6,B:bS.get()?4.092e6:2.046e6,mode:qs.get(),beta:bt.get()};}
    /* 乱数のシミュレーション: 同じ雑音で、量子化したものとしないものを比べる */
    function runMC(){if(busy)return;var c=cfg(),F=_w04_fold(4.092e6,c.B,c.fs);if(F.deg){mc={msg:"この f_s では中間周波数が 0 か f_s/2 に重なり、位相が失われるので比べない"};draw();return;}
      busy=true;var Z=_w04_shared(U,c.B,c.fs),J=Z.J,L=1;while(L<J)L*=2;var rg=U.rng(seed*104729+7),Qz=_w04_quantizer(c.mode,c.beta),Q0=_w04_quantizer(3,1);
      var cnt=new Float64Array(L),fL=F.fL,fH=F.fH,mean=0;
      for(var i=0;i<L;i++){var f=i*c.fs/L,n=0;for(var m=-Math.ceil(fH/c.fs)-1;m<=Math.ceil(fH/c.fs)+1;m++){var g=Math.abs(f+m*c.fs);if(g>=fL&&g<=fH)n++;}cnt[i]=Math.sqrt(n);mean+=n;}
      mean/=L;var sc=Math.sqrt(c.B/mean),M=24,PM=U.gnss.pm(1),pr=[],AMP=Math.sqrt(2*Math.pow(10,4.5)),IDEAL=Math.pow(10,4.5)*1e-3;   /* C/N0 = 45 dB-Hz（N0 = 1） */
      for(var p=0;p<M;p++){var code=new Int8Array(1023);for(var j=0;j<1023;j++)code[j]=rg.next()<0.5?1:-1;var aI=new Float64Array(J),aQ=new Float64Array(J);
        for(var k=0;k<J;k++){var ch=code[Math.floor(k/c.fs*1.023e6)%1023];aI[k]=ch*Z.rI[k]/PM[Math.floor(k/c.fs*1.023e6)%1023];aQ[k]=ch*Z.rQ[k]/PM[Math.floor(k/c.fs*1.023e6)%1023];}pr.push([aI,aQ]);}
      var K=48,done=0,acc=[{sI:0,sQ:0,n:[]},{sI:0,sQ:0,n:[]}],re=new Float64Array(L),im=new Float64Array(L),sg=Math.sqrt(c.B);
      for(var a=0;a<2;a++)for(p=0;p<M;p++)acc[a].n.push([0,0,0,0]);
      function step(){for(var it=0;it<4&&done<K;it++,done++){
          for(var i2=0;i2<L;i2++){re[i2]=rg.normal();im[i2]=0;}U.gnss.fft(re,im);for(i2=0;i2<L;i2++){re[i2]*=cnt[i2];im[i2]=-im[i2]*cnt[i2];}U.gnss.fft(re,im);
          for(var a2=0;a2<2;a2++){var QQ=a2?Q0:Qz,yI=0,yQ=0,pI=new Float64Array(M),pQ=new Float64Array(M);
            for(var k2=0;k2<J;k2++){var w=re[k2]/L*sc,qp=QQ.q((AMP*Z.s[k2]+w)/sg),qm=QQ.q((-AMP*Z.s[k2]+w)/sg),dq=(qp-qm)/2;yI+=dq*Z.rI[k2];yQ+=dq*Z.rQ[k2];
              for(var p2=0;p2<M;p2++){pI[p2]+=qp*pr[p2][0][k2];pQ[p2]+=qp*pr[p2][1][k2];}}
            acc[a2].sI+=yI/J;acc[a2].sQ+=yQ/J;for(p2=0;p2<M;p2++){var e=acc[a2].n[p2],vi=pI[p2]/J,vq=pQ[p2]/J;e[0]+=vi;e[1]+=vi*vi;e[2]+=vq;e[3]+=vq*vq;}}}
        if(done<K){mc={msg:"計算中… "+done+" / "+K+" 回"};draw();setTimeout(step,0);return;}
        var res=[];for(var a3=0;a3<2;a3++){var A=acc[a3],mI=A.sI/K,mQ=A.sQ/K,V=0;A.n.forEach(function(e){V+=(e[1]/K-Math.pow(e[0]/K,2))+(e[3]/K-Math.pow(e[2]/K,2));});V/=M;V*=K/(K-1);res.push(10*Math.log10((mI*mI+mQ*mQ)/V/IDEAL));}
        busy=false;mc={q:res[0],n:res[1],se:4.34*Math.sqrt(2/(K*M)),K:K,M:M};draw();}
      mc={msg:"計算中…"};draw();setTimeout(step,0);}
    function draw(){
      var c=cfg(),F=_w04_fold(4.092e6,c.B,c.fs),nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* (a) 標本にした後のスペクトラム */
      var x0=nar?20:30,pw=nar?370:640,P=U.plot(x0,nar?46:30,pw,40,[0,17],[0,1]);
      o.push(S.T(nar?6:14,14,"(a) 帯域（"+_w04_f(F.fL/1e6,3)+"〜"+_w04_f(F.fH/1e6,3)+" MHz）が、標本の列でどこに見えるか","start",10.5,"ink",true));
      var h=c.fs/2e6;o.push(S.RECT(P.X(0),P.y,P.X(Math.min(17,h))-P.X(0),P.h,0,"var(--muted-soft)","none",0));
      o.push(P.axes({xl:"周波数 [MHz]（灰色: 0〜f_s/2、破線: f_s/2 の整数倍）",xt:[0,2,4,6,8,10,12,14,16],yt:[],grid:false}));
      for(var k=1;k*h<=17;k++)o.push(S.L(P.X(k*h),P.y-2,P.X(k*h),P.y+P.h,"muted",1,"3 3"));
      var fl=F.fL/1e6,fh=F.fH/1e6,fm=4.092;
      o.push(S.RECT(P.X(fl),P.y+3,P.X(fm)-P.X(fl),P.h-6,1,"none","signal",1,"3 2"));o.push(S.RECT(P.X(fm),P.y+3,P.X(fh)-P.X(fm),P.h-6,1,"none","signal",1,"3 2"));
      function fd(f){var r=f%(2*h);return r<=h?r:2*h-r;}
      if(F.ok){var a1=fd(fl),a2=fd(fm),b2=fd(fh);var lo1=Math.min(a1,a2),hi1=Math.max(a1,a2),lo2=Math.min(a2,b2),hi2=Math.max(a2,b2);
        o.push(S.RECT(P.X(lo1),P.y+7,P.X(hi1)-P.X(lo1),P.h-14,1,U.soft("signal"),"signal",1.2));o.push(S.RECT(P.X(lo2),P.y+7,P.X(hi2)-P.X(lo2),P.h-14,1,"signal","signal",1.2));}
      else{/* 重なる所を赤で */var segs=[];for(var j=0;j<=200;j++){var f=fl+(fh-fl)*j/200;segs.push(fd(f));}var mn=Math.min.apply(null,segs),mx=Math.max.apply(null,segs);
        o.push(S.RECT(P.X(mn),P.y+7,P.X(mx)-P.X(mn),P.h-14,1,U.soft("alias"),"alias",1.4));o.push(S.T(P.X((mn+mx)/2),P.y+P.h/2+4,"重なる","middle",9,"alias",true));}
      o.push(S.TX(nar?6:P.x+P.w,nar?30:P.y-6,"f_s = "+_w04_f(c.fs/1e6,3)+" MHz、見かけの中間周波数 "+_w04_f(F.fa/1e6,3)+" MHz"+(F.inv?"（裏返る）":""),nar?"start":"end",9.5,F.ok?"green":"alias",true));
      /* (b) 損失の棒 */
      var deg=F.deg,L0=deg?null:_w04_semi(U,c.B,c.fs,3,1),Lq=deg?null:_w04_semi(U,c.B,c.fs,c.mode,c.beta);
      var yb=nar?142:126,Q=U.plot(nar?150:220,yb+18,nar?220:300,74,[-3,0],[0,3]);
      o.push(S.TX(nar?6:14,yb,"(b) 相関の後の SN 比の損失（(C/N_0) T_{coh} に対して。弱い信号の近似の計算）","start",10.5,"ink",true));
      o.push(Q.axes({xl:"損失 [dB]",xt:[-3,-2.5,-2,-1.5,-1,-0.5,0],yt:[],xfmt:function(v){return _w04_f(v,1);}}));
      var bars=deg?[]:[["フィルタと標本の間隔",L0,"muted"],["量子化の分",Lq-L0,"purple"],["合わせた損失",Lq,"alias"]];
      bars.forEach(function(b,i){var yy=Q.y+4+i*24,v=Math.max(-3,b[1]);o.push(S.RECT(Q.X(v),yy,Q.X(0)-Q.X(v),16,2,U.soft(b[2]),b[2],1.1));
        o.push(S.T(Q.x-8,yy+12,b[0],"end",9.5,b[2],true));o.push(S.T(Q.X(v)-5,yy+12,_w04_f(b[1],2)+" dB","end",9.5,b[2],true,false,null,true));});
      if(deg)o.push(S.TX(Q.x+Q.w/2,Q.y+40,"中間周波数が 0 か f_s/2 に来て、位相が失われる（使えない）","middle",10,"alias",true));
      box.set(S.svg(Wd,Q.y+Q.h+44,o));
      /* (c) A/D 変換の入力の値の分布と量子化の段 */
      var g=[],rg=U.rng(seed*31+3),nb=40,hist=new Float64Array(nb),NSm=4000;for(var i=0;i<NSm;i++){var x=rg.normal(),bi=Math.floor((x+4)/8*nb);if(bi>=0&&bi<nb)hist[bi]++;}
      var hx=nar?44:64,H=U.plot(hx,26,nar?340:600,110,[-4,4],[0,1.15]),hmax=0;for(i=0;i<nb;i++)hmax=Math.max(hmax,hist[i]);
      g.push(S.T(nar?6:14,14,nar?"(c) A/D 変換の入力の値（σ: 雑音の標準偏差）と量子化の段":"(c) A/D 変換の入力の値（雑音でほぼ決まる。σ = 雑音の標準偏差）と、量子化の段","start",10.5,"ink",true));
      g.push(H.axes({xl:"入力 x/σ",xt:[-4,-3,-2,-1,0,1,2,3,4],yt:[],xfmt:function(v){return _w04_f(v,0);}}));
      for(i=0;i<nb;i++){var xa=-4+8*i/nb,xb2=xa+8/nb;g.push(S.RECT(H.X(xa)+0.5,H.Y(hist[i]/hmax),H.X(xb2)-H.X(xa)-1,H.Y(0)-H.Y(hist[i]/hmax),0,"var(--teal-soft)","teal",0.6));}
      var md=c.mode,Qz=_w04_quantizer(md,c.beta),lvmax=md===0?1:(md===1?3:7);
      if(md!==3){var pts=[];for(i=0;i<=400;i++){var xx=-4+8*i/400;pts.push([xx,0.55+0.5*Qz.q(xx)/lvmax]);}g.push(H.steps(pts,"signal",2));
        var ths=md===0?[0]:(md===1?[0,c.beta,-c.beta]:[0,c.beta,2*c.beta,3*c.beta,-c.beta,-2*c.beta,-3*c.beta]);
        ths.forEach(function(t){if(Math.abs(t)<=4)g.push(S.L(H.X(t),H.y,H.X(t),H.y+H.h,"signal",1,"3 3"));});
        g.push(S.T(H.X(3.9),H.Y(1.08),"出力（右の目盛 ±"+lvmax+"）","end",9,"signal",true,false,null,true));}
      else g.push(S.T(H.X(3.9),H.Y(1.08),"量子化しない（値をそのまま使う）","end",9,"signal",true,false,null,true));
      hb.set(S.svg(Wd,H.y+H.h+40,g));
      /* 読み出し */
      var t="",names=["1 bit","2 bit","3 bit","量子化しない"];
      if(!F.ok&&!deg)t+='<span class="warn">帯域の一部が f_s/2 の整数倍をまたいで、折り返した雑音が重なる</span><br>';
      if(deg)t+='<span class="warn">この f_s では、中間周波数が 0 か f_s/2 に折り返り、標本の列から搬送波の位相が分からなくなる（位相によっては信号が消える）</span><br>';
      else{
        t+="選んだ量子化（"+names[md]+(md===1||md===2?"、"+_w04_f(c.beta,2)+"σ":"")+"）: 合わせた損失 <b>"+_w04_f(Lq,2)+" dB</b>（量子化の分 "+_w04_f(Lq-L0,2)+" dB）→ 1 節の例（47.5 dB-Hz）なら、相関をとった後に見える C/N0 は "+_w04_f(47.45+Lq,1)+" dB-Hz、1 ms の後の SN 比は "+_w04_f(47.45+Lq-30,1)+" dB<br>";
        var row=[0,1,2,3].map(function(m){var b=m===1?1.0:(m===2?0.586:1);return names[m]+" "+_w04_f(_w04_semi(U,c.B,c.fs,m,b),2)+" dB";});
        t+="この f_s と B_IF での比較（2 bit は 1.0σ、3 bit は 0.59σ）: "+row.join("、")+"<br>";
        t+="掛けて足す計算（4・5 節）: 衛星 1 つあたり 1 秒に "+_w04_f(6*c.fs/1e4,0)+" 万回（f_s に比例）<br>";}
      if(mc){if(mc.msg)t+=mc.msg;else t+="シミュレーション（"+mc.K+" 回、雑音の探り "+mc.M+" 本）: 量子化しない "+_w04_f(mc.n,2)+" dB、"+names[md]+" "+_w04_f(mc.q,2)+" dB、量子化の分 <b>"+_w04_f(mc.q-mc.n,2)+" dB</b>（近似の計算 "+_w04_f(Lq-L0,2)+" dB。ばらつきの目安 ±"+_w04_f(mc.se,2)+" dB）";}
      ro.innerHTML=U.htx(t)+'<div class="wnote">中間周波数 4.092 MHz、PRN 1、積分の時間 1 ms。前段は幅 B<sub>IF</sub> の理想のフィルタ。損失は、信号が雑音より十分弱いとして、標本どうしの雑音の相関を含めて計算した値（本文の図の線と同じ計算）。シミュレーションは、同じ雑音で量子化したものとしないものを比べ、信号の分は ± の信号の差、雑音の分は乱数の符号との相関で測る。</div>';
    }
    draw();
  };

  /* ---- 4 節: 相関器（局部の符号・搬送波のずれ ↔ I・Q の点 ↔ 三角形の上の E・P・L ↔ 足していく和） ---- */
  function _w04_gauss(rg){var u=0,v=0,s=0;do{u=2*rg.next()-1;v=2*rg.next()-1;s=u*u+v*v;}while(s>=1||s===0);var m=Math.sqrt(-2*Math.log(s)/s);return [u*m,v*m];}
  REG.w04_correlator=function(el,U){
    var S=U.S,FS=16.368e6,FIF=4.092e6,RC=1.023e6,PM=U.gnss.pm(1);
    U.head(el,"CORRELATOR","相関器 — 局部の符号と搬送波を合わせる・ずらす");
    var r1=U.ctrls(el);
    var dt=U.slider(r1,"局部の符号のずれ Δτ（+ は局部が遅れ）",{min:-1.5,max:1.5,step:0.05,value:0.25,fmt:function(v){return _w04_f(v,2)+" チップ";},onInput:function(){draw();}});
    var dp=U.slider(r1,"搬送波の位相のずれ Δψ",{min:-180,max:180,step:5,value:30,fmt:function(v){return _w04_f(v,0)+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var dfS=U.slider(r2,"周波数のずれ Δf",{min:-1000,max:1000,step:25,value:0,fmt:function(v){return _w04_f(v,0)+" Hz";},onInput:function(){draw();}});
    var del=U.slider(r2,"E と L の間隔 Δ<sub>EL</sub>",{values:[0.1,0.2,0.5,1.0],value:1.0,fmt:function(v){return v+" チップ";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cn=U.slider(r3,"C/N0",{values:[30,35,40,45,50,99],value:45,fmt:function(v){return v>90?"雑音なし":v+" dB-Hz";},onInput:function(){draw();}});
    var tc=U.slider(r3,"積分の時間 T<sub>coh</sub>",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" ms";},onInput:function(){draw();}});
    var bit=U.checkbox(r3,"データのビットを −1 にする",false,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（0.25 チップ・30°・45 dB-Hz）",function(){dt.set(0.25);dp.set(30);dfS.set(0);del.set(1.0);cn.set(45);tc.set(1);bit.set(false);draw();});
    U.button(br,"合わせる（ずれを 0 に）",function(){dt.set(0);dp.set(0);dfS.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),tb=U.svgbox(el),ro=U.readout(el);
    function lam(x){return Math.max(0,1-Math.abs(x));}
    function sinc(x){return _w04_sinc(x);}
    function draw(){
      var Dt=dt.get(),Dp=dp.get()*Math.PI/180,Df=dfS.get(),De=del.get(),C0=cn.get(),T=tc.get()*1e-3,d=bit.get()?-1:1;
      var J=Math.round(FS*T),tau=100.3/RC,psi=0.7,rg=U.rng(seed*7919+17),sd=C0>90?0:Math.sqrt(0.5/Math.pow(10,C0/10)*FS/2);
      var R=T<=2e-3?24:(T<=5e-3?12:(T<=10e-3?8:6));
      /* 受けた信号（√(2C) = 1）と、局部の搬送波・符号（E・P・L）を作る */
      var sig=new Float64Array(J),c2=new Float64Array(J),s2=new Float64Array(J),cE=new Int8Array(J),cP=new Int8Array(J),cL=new Int8Array(J);
      for(var k=0;k<J;k++){var t=k/FS,ch=Math.floor((t-tau)*RC);sig[k]=d*PM[((ch%1023)+1023)%1023]*Math.cos(2*Math.PI*(FIF+Df)*t+psi);
        var th=2*Math.PI*FIF*t+psi-Dp;c2[k]=2*Math.cos(th);s2[k]=2*Math.sin(th);
        var b=t-tau-Dt/RC;cE[k]=PM[((Math.floor((b+De/2/RC)*RC)%1023)+1023)%1023];cP[k]=PM[((Math.floor(b*RC)%1023)+1023)%1023];cL[k]=PM[((Math.floor((b-De/2/RC)*RC)%1023)+1023)%1023];}
      var reps=[],run=null,stepRun=Math.max(1,Math.floor(J/300));
      for(var r=0;r<R;r++){var a=[0,0,0,0,0,0],pr=r===0?[]:null,acI=0,acQ=0,g=[0,0];
        for(k=0;k<J;k++){var w=0;if(sd>0){if(k%2===0)g=_w04_gauss(rg);w=sd*g[k%2];}var y=sig[k]+w,yc=y*c2[k],ys=y*s2[k];
          a[0]+=yc*cE[k];a[1]+=ys*cE[k];a[2]+=yc*cP[k];a[3]+=ys*cP[k];a[4]+=yc*cL[k];a[5]+=ys*cL[k];
          if(pr){acI+=yc*cP[k];acQ+=ys*cP[k];if(k%stepRun===0||k===J-1)pr.push([(k+1)/FS*1e3,acI/J,acQ/J]);}}
        for(var q=0;q<6;q++)a[q]/=J;reps.push(a);if(pr)run=pr;}
      /* 式の値: (I, Q) = d Λ(Δτ) sinc(Δf T)(cos Δψ̄, −sin Δψ̄)、Δψ̄ = Δψ + πΔf T（平均の位相のずれ） */
      var ph=Dp+Math.PI*Df*T,sc=sinc(Df*T),offs=[-De/2,0,De/2],fm=offs.map(function(o){var v=d*lam(Dt+o)*sc;return [v*Math.cos(ph),-v*Math.sin(ph)];});
      var nar=_w04_nar(box),Wd=nar?400:700,o=[],cols=["green","signal","gold"],nm=["E","P","L"];
      /* (a) I・Q 平面 */
      var pw=nar?170:230,P=U.plot(nar?36:60,28,pw,pw,[-1.3,1.3],[-1.3,1.3]);
      o.push(S.T(nar?6:14,16,"(a) I・Q の平面（√(2C) = 1）","start",10.5,"ink",true));
      o.push(P.axes({xl:"I",yl:"Q",xt:[-1,0,1],yt:[-1,0,1],xfmt:function(v){return _w04_f(v,0);},yfmt:function(v){return _w04_f(v,0);},ylOff:nar?24:30}));
      o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"muted",1));o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
      var cir=[];for(var i=0;i<=120;i++){var an=2*Math.PI*i/120;cir.push([Math.cos(an),Math.sin(an)]);}o.push(P.line(cir,"faint",1.1,"4 3"));
      for(r=1;r<R;r++)for(q=0;q<3;q++)o.push(S.D(P.X(Math.max(-1.3,Math.min(1.3,reps[r][2*q]))),P.Y(Math.max(-1.3,Math.min(1.3,reps[r][2*q+1]))),cols[q],1.8));
      for(q=0;q<3;q++){o.push(S.CIRC(P.X(fm[q][0]),P.Y(fm[q][1]),5,"ink",1.4,"screen"));}
      for(q=0;q<3;q++){var xI=Math.max(-1.3,Math.min(1.3,reps[0][2*q])),xQ=Math.max(-1.3,Math.min(1.3,reps[0][2*q+1]));o.push(S.D(P.X(xI),P.Y(xQ),cols[q],4.2));
        o.push(S.T(P.X(xI)+6,P.Y(xQ)-5,nm[q],"start",9.5,cols[q],true,false,null,true));}
      /* (b) 三角形の上の 3 点 */
      var bx=nar?230:370,Q=U.plot(bx,28,nar?160:300,nar?110:150,[-1.6,1.6],[0,1.15]);
      o.push(S.T(bx-(nar?20:30),16,nar?"(b) 大きさ √(I² + Q²)":"(b) 大きさ √(I² + Q²) と局部の符号のずれ","start",10.5,"ink",true));
      o.push(Q.axes({xl:"局部の符号のずれ [チップ]",xt:[-1.5,-1,-0.5,0,0.5,1,1.5],yt:[0,0.5,1],xfmt:function(v){return _w04_f(v,1);},yfmt:function(v){return _w04_f(v,1);}}));
      var tri=[];for(i=0;i<=160;i++){var x=-1.6+3.2*i/160;tri.push([x,lam(x)*Math.abs(sc)]);}o.push(Q.line(tri,"faint",1.8));
      for(q=0;q<3;q++){var xo=Dt+offs[q],mag=Math.hypot(reps[0][2*q],reps[0][2*q+1]);if(xo<-1.6||xo>1.6)continue;
        o.push(S.L(Q.X(xo),Q.Y(0),Q.X(xo),Q.Y(Math.min(1.15,mag)),cols[q],1.2,"3 2"));o.push(S.D(Q.X(xo),Q.Y(Math.min(1.15,mag)),cols[q],4.4));
        o.push(S.CIRC(Q.X(xo),Q.Y(lam(xo)*Math.abs(sc)),4.5,"ink",1.2,"none"));
        o.push(S.T(Q.X(xo)+(q===0?-6:(q===2?6:0)),Q.Y(Math.min(1.15,mag))-(q===1?11:5),nm[q],q===0?"end":(q===2?"start":"middle"),9.5,cols[q],true,false,null,true));}
      var hb=Math.max(P.y+P.h,Q.y+Q.h)+46;o.push(S.LEGL(nar?6:14,hb,[["green",null,"E"],["signal",null,"P"],["gold",null,"L"],["ink",null,"○: 式の値"]],9,12));
      box.set(S.svg(Wd,hb+10,o));
      /* (c) 足していく和（P、1 回目の積分） */
      var g2=[],Z=U.plot(nar?44:60,24,nar?340:620,120,[0,T*1e3],[-1.2,1.2]);
      g2.push(S.TX(nar?6:14,14,"(c) P の和の増え方（和 ÷ J。最後の値が I_P・Q_P）","start",10.5,"ink",true));
      g2.push(Z.axes({xl:"積分の中の時間 [ms]",yl:"和 ÷ J",xt:U.nice(0,T*1e3,5),yt:[-1,-0.5,0,0.5,1],xfmt:function(v){return _w04_f(v,1);},yfmt:function(v){return _w04_f(v,1);},ylOff:34}));
      g2.push(S.L(Z.x,Z.Y(0),Z.x+Z.w,Z.Y(0),"muted",1));
      g2.push(Z.line([[0,0],[T*1e3,fm[1][0]]],"signal",1,"5 3"));g2.push(Z.line([[0,0],[T*1e3,fm[1][1]]],"purple",1,"5 3"));
      g2.push(Z.clip(run.map(function(v){return [v[0],v[1]];}),"signal",1.8));g2.push(Z.clip(run.map(function(v){return [v[0],v[2]];}),"purple",1.8));
      g2.push(S.LEGL(nar?44:60,Z.y+Z.h+40,[["signal",null,"I_P の和"],["purple",null,"Q_P の和"],["muted","5 3","雑音が無いときの増え方（式）"]],9,12));
      tb.set(S.svg(Wd,Z.y+Z.h+48,g2));
      /* 読み出し */
      var rows=[0,1,2].map(function(q2){var a0=reps[0];return [nm[q2],_w04_f(a0[2*q2],3),_w04_f(a0[2*q2+1],3),_w04_f(Math.hypot(a0[2*q2],a0[2*q2+1]),3),_w04_f(fm[q2][0],3),_w04_f(fm[q2][1],3),_w04_f(Math.hypot(fm[q2][0],fm[q2][1]),3)];});
      var h=U.tbl(["","I（計算）","Q（計算）","大きさ","I（式）","Q（式）","大きさ（式）"],rows,["left","right","right","right","right","right","right"]);
      var mE=Math.hypot(reps[0][0],reps[0][1]),mL=Math.hypot(reps[0][4],reps[0][5]),pp=Math.atan2(-reps[0][3],reps[0][2])*180/Math.PI;
      h+="E と L の大きさの差 = <b>"+_w04_f(mE-mL,3)+"</b>（式 "+_w04_f(Math.abs(sc)*(lam(Dt-De/2)-lam(Dt+De/2)),3)+"）"+(De===1&&Math.abs(Dt)<=0.5?" → 頂点は局部の符号より "+_w04_f((mE-mL)/2,2)+" チップずれた所（本当は "+_w04_f(Dt,2)+"）":"")+"<br>";
      h+="P の点の角度から読んだ位相のずれ "+_w04_f(pp,1)+"°（式の平均の位相のずれ <span style=\"text-decoration:overline\">Δψ</span> = Δψ + πΔf T_coh = "+_w04_f(ph*180/Math.PI+(d<0?180:0),1)+"°"+(d<0?"。データが −1 なので 180° 足した値":"")+"）、周波数のずれによる倍率 sinc(Δf T_coh) = "+_w04_f(sc,3)+"<br>";
      if(C0<90){var snr=Math.pow(10,C0/10)*T*Math.pow(lam(Dt)*sc,2);h+="P の相関の後の SN 比（式）(C/N0) T_coh Λ² sinc² = <b>"+_w04_f(10*Math.log10(Math.max(snr,1e-12)),1)+" dB</b>、I と Q のそれぞれの雑音の標準偏差 √(N0/T_coh) = "+_w04_f(Math.sqrt(1/(2*Math.pow(10,C0/10)*T)),3)+"<br>";}
      if(Math.abs(Df)*T>=1)h+='<span class="warn">周波数のずれが 1/T_coh 以上で、和がほとんど 0 になる（3 章 4 節）</span><br>';
      ro.innerHTML=U.htx(h)+'<div class="wnote">中間周波数 4.092 MHz・16.368 MHz の標本（PRN 1、√(2C) = 1）に、白色雑音を足して計算した。(a) の大きな点は 1 回目の積分、小さな点は別の雑音で '+(R-1)+' 回繰り返した値。○ は式の値。</div>';
    }
    draw();
  };

  /* ---- 5 節: チャネル（空の衛星の並び ↔ 各チャネルの符号の位相とドップラー） ---- */
  var _W04_MU=3.986004418e14,_W04_WE=7.2921151467e-5,_W04_AW=6378137,_W04_FW=1/298.257223563,_W04_E2=_W04_FW*(2-_W04_FW),_W04_D=Math.PI/180,_W04_CL=299792458;
  function _w04_geod(B,L,h){B*=_W04_D;L*=_W04_D;var N=_W04_AW/Math.sqrt(1-_W04_E2*Math.sin(B)*Math.sin(B));return [(N+h)*Math.cos(B)*Math.cos(L),(N+h)*Math.cos(B)*Math.sin(L),(N*(1-_W04_E2)+h)*Math.sin(B)];}
  var _W04_RX={B:35.681,L:139.767,r0:_w04_geod(35.681,139.767,40)};
  var _W04_SATS=(function(){var o=[];for(var p=0;p<6;p++)for(var s=0;s<4;s++)o.push({nm:"G"+(p*4+s+1),a:26560e3,i:55,Om:60*p,M:90*s+15*p});return o;})();
  /* 円軌道の衛星の ECEF の位置（1 章と同じ近似の配置） */
  function _w04_satpos(s,t){var n=Math.sqrt(_W04_MU/Math.pow(s.a,3))/_W04_D,u=(s.M+n*t)*_W04_D,O=s.Om*_W04_D,inc=s.i*_W04_D,a=s.a;
    var q=[a*(Math.cos(O)*Math.cos(u)-Math.sin(O)*Math.sin(u)*Math.cos(inc)),a*(Math.sin(O)*Math.cos(u)+Math.cos(O)*Math.sin(u)*Math.cos(inc)),a*Math.sin(u)*Math.sin(inc)];
    var th=_W04_WE*t,c=Math.cos(th),sn=Math.sin(th);return [q[0]*c+q[1]*sn,-q[0]*sn+q[1]*c,q[2]];}
  function _w04_elaz(p){var r0=_W04_RX.r0,d=[p[0]-r0[0],p[1]-r0[1],p[2]-r0[2]],b=_W04_RX.B*_W04_D,l=_W04_RX.L*_W04_D;
    var e=-Math.sin(l)*d[0]+Math.cos(l)*d[1],n=-Math.sin(b)*Math.cos(l)*d[0]-Math.sin(b)*Math.sin(l)*d[1]+Math.cos(b)*d[2],u=Math.cos(b)*Math.cos(l)*d[0]+Math.cos(b)*Math.sin(l)*d[1]+Math.sin(b)*d[2];
    return [Math.atan2(u,Math.hypot(e,n))/_W04_D,(Math.atan2(e,n)/_W04_D+360)%360,Math.hypot(d[0],d[1],d[2])];}
  function _w04_skyxy(cx,cy,R,el,az){var r=R*(90-el)/90;return [cx+r*Math.sin(az*_W04_D),cy-r*Math.cos(az*_W04_D)];}
  REG.w04_channels=function(el,U){
    var S=U.S,LAM=_W04_CL/1575.42e6;
    U.head(el,"CHANNELS","チャネル — 衛星ごとに符号の位相とドップラーに合わせる");
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"時刻（例の配置の始めから）",{min:0,max:43200,step:60,value:3600,fmt:function(v){var h=Math.floor(v/3600),m=Math.round((v-3600*h)/60);return h+" 時間 "+(m<10?"0":"")+m+" 分";},onInput:function(){draw();}});
    tm.el.style.flex="1 1 100%";
    var r2=U.ctrls(el);
    var pp=U.slider(r2,"基準の発振器（TCXO）の周波数の誤差",{min:-2,max:2,step:0.1,value:0,fmt:function(v){return _w04_f(v,1)+" ppm";},onInput:function(){draw();}});
    var ck=U.slider(r2,"受信機の時計のずれ δt<sub>r</sub>",{min:0,max:1000,step:1,value:0,fmt:function(v){return v+" μs";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var nch=U.slider(r3,"チャネルの数",{values:[4,6,8,12],value:12,fmt:function(v){return v+" チャネル";},onInput:function(){draw();}});
    var msk=U.slider(r3,"使う衛星の仰角の下限",{values:[0,5,10,15],value:5,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tm.get()+120;if(v>43200)v=0;tm.set(v);draw();},60);
    U.button(br,"本文の例（1 時間後・誤差なし）",function(){tick.stop();tm.set(3600);pp.set(0);ck.set(0);nch.set(12);msk.set(5);draw();});
    U.button(br,"再生（2 分ずつ進める）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"TCXO を +0.5 ppm に",function(){pp.set(0.5);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    var EIRP=-128.5-30+20*Math.log10(4*Math.PI*(Math.sqrt(26560e3*26560e3-Math.pow(6371e3*Math.cos(5*_W04_D),2))-6371e3*Math.sin(5*_W04_D))/LAM)+0.5;   /* 3 章の例の EIRP（26.4 dBW） */
    function cn0(el_,r){var ga=3-8*Math.pow((90-el_)/85,2),lfs=20*Math.log10(4*Math.PI*r/LAM);return EIRP+30+ga-lfs-0.5-_w04_dbmhz(175.1);}
    function draw(){
      var t=tm.get(),ppm=pp.get(),dtr=ck.get()*1e-6,N=nch.get(),mask=msk.get(),vis=[];
      _W04_SATS.forEach(function(s){var p=_w04_satpos(s,t),ea=_w04_elaz(p);if(ea[0]<mask)return;
        var rr=_w04_elaz(_w04_satpos(s,t+0.5))[2]-_w04_elaz(_w04_satpos(s,t-0.5))[2],fd=-rr/LAM,fda=fd-ppm*1e-6*1575.42e6;
        var cp=((ea[2]/_W04_CL+dtr)*1e3%1)*1023,tr=[];for(var k=1;k<=15;k++){var e2=_w04_elaz(_w04_satpos(s,t-k*120));tr.push([e2[0],e2[1]]);}
        vis.push({nm:s.nm,el:ea[0],az:ea[1],r:ea[2],fd:fd,fda:fda,cp:cp,tr:tr,cn:cn0(ea[0],ea[2])-0.74});});
      vis.sort(function(a,b){return b.el-a.el;});vis.forEach(function(v,i){v.ch=i<N?i+1:0;});
      var nar=_w04_nar(box),Wd=nar?400:700,o=[];
      /* (a) スカイプロット */
      var cx=nar?110:150,cy=nar?130:150,R=nar?92:112;
      o.push(S.T(nar?6:14,16,"(a) 東京の空（GPS、例の配置）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,R,"muted",1.3,"screen"));for(var az=0;az<360;az+=30){var e0=_w04_skyxy(cx,cy,R,0,az);o.push(S.L(cx,cy,e0[0],e0[1],"grid",1));}
      [30,60].forEach(function(e){o.push(S.CIRC(cx,cy,R*(90-e)/90,"faint",0.9,null,"3 3"));});
      [0,30,60].forEach(function(e){o.push(S.T(cx+3,cy-R*(90-e)/90+11,e+"°","start",9,"muted",false,false,null,true));});
      [[0,"北"],[90,"東"],[180,"南"],[270,"西"]].forEach(function(d){var q=_w04_skyxy(cx,cy,R+11,0,d[0]);o.push(S.T(q[0],q[1]+4,d[1],"middle",10,"ink",true));});
      if(mask>0)o.push(S.CIRC(cx,cy,R*(90-mask)/90,"alias",1,null,"2 3"));
      vis.forEach(function(v){var seg=v.tr.filter(function(q){return q[0]>=0;}).map(function(q){return _w04_skyxy(cx,cy,R,q[0],q[1]);});if(seg.length>1)o.push(S.PL(seg,"faint",1.1,null,"2 2"));});
      vis.forEach(function(v){var q=_w04_skyxy(cx,cy,R,v.el,v.az);if(v.ch){o.push(S.D(q[0],q[1],"signal",4.4));}else{o.push(S.CIRC(q[0],q[1],4.4,"alias",1.6,"screen"));}
        o.push(S.T(q[0]+6,q[1]+3.5,v.nm,"start",9,v.ch?"signal":"alias",true,false,null,true));});
      /* (b) 符号の位相とドップラーの平面 */
      var bx=nar?40:370,by=nar?262:30,P=U.plot(bx,by,nar?346:310,nar?160:220,[0,1023],[-5000,5000]);
      o.push(S.T(nar?6:bx-30,by-14,"(b) 各衛星の符号の位相と見かけのドップラー","start",10.5,"ink",true));
      o.push(P.axes({xl:"符号の位相 [チップ]",yl:"見かけのドップラー [Hz]",xt:[0,200,400,600,800,1000],yt:[-5000,-2500,0,2500,5000],xfmt:function(v){return String(v);},yfmt:function(v){return _w04_f(v,0);},ylOff:nar?34:44}));
      o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
      if(Math.abs(ppm)>1e-9)o.push(S.L(P.x,P.Y(-ppm*1e-6*1575.42e6),P.x+P.w,P.Y(-ppm*1e-6*1575.42e6),"gold",1.2,"5 3"));
      vis.forEach(function(v){var y=Math.max(-5000,Math.min(5000,v.fda));if(v.ch)o.push(S.D(P.X(v.cp),P.Y(y),"signal",4.2));else o.push(S.CIRC(P.X(v.cp),P.Y(y),4.2,"alias",1.6,"screen"));
        o.push(S.T(P.X(v.cp)+6,P.Y(y)+4,v.nm,"start",9,v.ch?"signal":"alias",true,false,null,true));});
      if(Math.abs(ppm)>1e-9)o.push(S.T(P.x+P.w-4,P.Y(-ppm*1e-6*1575.42e6)-5,"全部が "+_w04_f(-ppm*1e-6*1575.42e6,0)+" Hz ずれる","end",9,"gold",true,false,null,true));
      var hh=P.y+P.h+44;o.push(S.T(nar?6:14,hh,"青: チャネルで追う衛星、赤の ○: 見えているがチャネルが足りない衛星","start",9,"muted"));
      box.set(S.svg(Wd,hh+8,o));
      /* チャネルの表と読み出し */
      var rows=vis.filter(function(v){return v.ch;}).map(function(v){return [v.ch+"（"+v.nm+"）",_w04_f(v.el,1)+"°",_w04_f(v.cp,2),_w04_f(v.fda,0),_w04_g(4.092e6+v.fda,0),_w04_g(1.023e6*(1+v.fd/1575.42e6),2),_w04_f(v.cn,1)];});
      for(var i=rows.length;i<N;i++)rows.push([(i+1)+"（空き）","","","","","",""]);
      var h=U.tbl(["CH（衛星）","仰角","符号の位相","ドップラー","搬送波の NCO","符号の NCO","C/N0"],rows,["left","right","right","right","right","right","right"]);
      var nv=vis.length,nt=Math.min(nv,N);
      h+="見える衛星 "+nv+" 機（仰角 "+mask+"° 以上）、追う衛星 <b>"+nt+" 機</b>"+(nv>N?'。<span class="warn">チャネルが '+(nv-N)+' 機分足りない</span>':"")+"<br>";
      h+="基準の発振器の誤差 "+_w04_f(ppm,1)+" ppm → 全部の衛星に共通の見かけのドップラー "+_w04_f(-ppm*1e-6*1575.42e6,1)+" Hz。受信機の時計のずれ "+ck.get()+" μs → 全部の符号の位相が "+_w04_f((dtr*1e3%1)*1023,2)+" チップ（1 ms で割った余り）ずれる<br>";
      h+="相関器の計算: "+N+" チャネル × 6 × 1636.8 万 = 1 秒に "+_w04_g(N*6*16.368,1)+" M 回。プログラムに渡す数: 1 秒に "+_w04_g(N*6000,0)+" 個";
      ro.innerHTML=U.htx(h)+'<div class="wnote">表の単位: 符号の位相はチップ、ドップラー（基準の発振器の誤差を含む見かけの値）と搬送波の NCO の周波数は Hz、符号の NCO はチップ/s、C/N0 は dB-Hz。1 章と同じ近似の GPS の配置（6 つの軌道面に 4 機、半径 26 560 km の円軌道）と東京の受信機。搬送波の NCO は中間周波数 4.092 MHz に見かけのドップラーを加えた周波数、符号の NCO は 1.023 M チップ/s をドップラーと同じ割合で速めた値。C/N0 は 3 章の例（EIRP 26.4 dBW、例のアンテナの利得、システム雑音温度 175 K）から、2 bit・16.368 MHz の量子化などの損失 0.74 dB を引いた値。</div>';
    }
    draw();
  };

  /* ===== 05 章 捕捉と追尾 — 信号を見つけて追いかける ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w05_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w05_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 5 桁以上は 3 桁ごとに空白を入れた数（42 966 など。4 桁の 1630 はそのまま） */
  function _w05_g(v,d){var s=_w05_f(v,d||0),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].length>4?p[0].replace(/\B(?=(\d{3})+(?!\d))/g," "):p[0];return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  /* 1.5 × 10⁶ の形（1000 未満はそのまま） */
  function _w05_sci(v,d){if(v===0)return "0";var e=Math.floor(Math.log10(Math.abs(v))),m=v/Math.pow(10,e);if(+Math.abs(m).toFixed(d)>=10){m/=10;e++;}
    if(e>=0&&e<3)return _w05_g(v,0);var sup="⁰¹²³⁴⁵⁶⁷⁸⁹",es=String(Math.abs(e)).split("").map(function(c){return sup.charAt(+c);}).join("");return _w05_f(m,d)+" × 10"+(e<0?"⁻":"")+es;}
  /* 時間の文字（ms・s・分・時間） */
  function _w05_t(s){if(!isFinite(s))return "∞";if(s<0.01)return _w05_f(s*1e3,1)+" ms";if(s<1)return _w05_f(s,2)+" s";if(s<100)return _w05_f(s,1)+" s";if(s<3600)return _w05_f(s/60,1)+" 分";return _w05_f(s/3600,1)+" 時間";}
  function _w05_lam(x){x=Math.abs(x);return x<1?1-x:0;}
  function _w05_sinc(x){return Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);}
  var _W05_FS=2.048e6,_W05_J=2048,_W05_RC=1.023e6,_W05_CTC=299792458/1.023e6,_W05_LAM=299792458/1575.42e6;
  /* 時間の列 v[k]（時刻 k·dt）を、画面の 1 px の列ごとに最初・最小・最大・最後の 4 点を通る折れ線にする（雑音で揺れる長い列を軽く描く）。値は表示の範囲に収める */
  function _w05_band(U,P,v,dt,n,c,lw){var pts=[],col=null,a=0,mn=0,mx=0,z=0,lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]);
    function flush(){if(col===null)return;var x=col+0.5;pts.push([x,P.Y(a)],[x,P.Y(mn)],[x,P.Y(mx)],[x,P.Y(z)]);}
    for(var k=0;k<n;k++){var y=Math.max(lo,Math.min(hi,v[k])),x=Math.floor(P.X(k*dt));if(x!==col){flush();col=x;a=mn=mx=z=y;}else{if(y<mn)mn=y;if(y>mx)mx=y;z=y;}}
    flush();return pts.length>1?U.S.PL(pts,c,lw||1.2):"";}

  /* ---- 2 節: FFT による捕捉（格子の立体の図 ↔ 山の断面） ---- */
  /* 受けた信号に入れる衛星（例の値）: PRN、符号の位相 [チップ]、ドップラー [Hz]、搬送波の位相 [rad] */
  var _W05_SATS=[[1,120.25,1630,0.7],[2,731.6,-2380,2.1]],_W05_SIG=null,_W05_NZ={},_W05_AF={};
  /* 衛星の信号の部分（10 ms 分の複素数の標本。各衛星の振幅 1） */
  function _w05_sig(U){if(_W05_SIG)return _W05_SIG;var n=_W05_J*10,re=new Float64Array(n),im=new Float64Array(n);
    _W05_SATS.forEach(function(s){var pm=U.gnss.pm(s[0]);for(var i=0;i<n;i++){var k=Math.floor(i*_W05_RC/_W05_FS-s[1]);k=((k%1023)+1023)%1023;var ph=2*Math.PI*s[2]*i/_W05_FS+s[3];re[i]+=pm[k]*Math.cos(ph);im[i]+=pm[k]*Math.sin(ph);}});
    return (_W05_SIG={re:re,im:im});}
  /* 雑音（実部・虚部とも標準正規分布。種ごとに作り、C/N0 は掛ける数で変える） */
  function _w05_noise(U,seed){if(_W05_NZ[seed])return _W05_NZ[seed];var n=_W05_J*10,re=new Float64Array(n),im=new Float64Array(n),g=U.rng(seed*7919+3);
    for(var i=0;i<n;i++){re[i]=g.normal();im[i]=g.normal();}var ks=Object.keys(_W05_NZ);if(ks.length>3)delete _W05_NZ[ks[0]];return (_W05_NZ[seed]={re:re,im:im});}
  /* 局部の符号（遅れ 0）の FFT */
  function _w05_cfft(U,prn){if(_W05_AF[prn])return _W05_AF[prn];var J=_W05_J,re=new Float64Array(J),im=new Float64Array(J),pm=U.gnss.pm(prn);
    for(var i=0;i<J;i++)re[i]=pm[Math.floor(i*_W05_RC/_W05_FS)%1023];U.gnss.fft(re,im);return (_W05_AF[prn]={re:re,im:im});}
  /* FFT による捕捉: ドップラーのビンごとに、M 個の 1 ms の Y[m]A*[m] を足して逆 FFT。p = |R[k]|² ÷ 雑音だけのときの平均 */
  function _w05_acq(U,prn,cn0,M,bins,seed){var J=_W05_J,S=_w05_sig(U),N=_w05_noise(U,seed),c=Math.pow(10,cn0/10),sd=Math.sqrt(_W05_FS/c/2),A=_w05_cfft(U,prn);
    var out=new Float32Array(bins.length*J),re=new Float64Array(J),im=new Float64Array(J),ar=new Float64Array(J),ai=new Float64Array(J),nm=J*M*_W05_FS/c,i;
    for(var b=0;b<bins.length;b++){ar.fill(0);ai.fill(0);var w=-2*Math.PI*bins[b]/_W05_FS;
      for(var k=0;k<M;k++){for(i=0;i<J;i++){var m=k*J+i,yr=S.re[m]+sd*N.re[m],yi=S.im[m]+sd*N.im[m],cs=Math.cos(w*m),sn=Math.sin(w*m);re[i]=yr*cs-yi*sn;im[i]=yr*sn+yi*cs;}
        U.gnss.fft(re,im);for(i=0;i<J;i++){ar[i]+=re[i]*A.re[i]+im[i]*A.im[i];ai[i]+=im[i]*A.re[i]-re[i]*A.im[i];}}
      /* 逆 FFT は conj(FFT(conj(x)))/J。大きさの 2 乗だけが要るので、共役の FFT の大きさを J で割る */
      for(i=0;i<J;i++){re[i]=ar[i];im[i]=-ai[i];}U.gnss.fft(re,im);
      for(i=0;i<J;i++)out[b*J+i]=(re[i]*re[i]+im[i]*im[i])/(J*J)/nm;}
    return out;}
  REG.w05_search=function(el,U){
    var S=U.S,J=_W05_J,FOPS=(J/2)*11+J*11;
    U.head(el,"ACQUISITION","捕捉 — 符号の位相とドップラーの格子を探す");
    var r1=U.ctrls(el);
    var prn=U.select(r1,"探す衛星",["PRN 1（信号にある）","PRN 2（信号にある）","PRN 3（信号に無い）"],0,reset);
    var mth=U.select(r1,"計算の順番",["FFT（ドップラーごとに 1 列ずつ）","直列（ビンを 1 つずつ）"],0,reset);
    var r2=U.ctrls(el);
    var cn=U.slider(r2,"C/N0（PRN 1・2 とも）",{min:30,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:reset});
    var tc=U.slider(r2,"積分の時間 T<sub>coh</sub>",{values:[1,2,5,10],value:1,fmt:function(v){return v+" ms";},onInput:reset});
    var r3=U.ctrls(el);
    var stp=U.select(r3,"ドップラーの刻み（T は積分の時間）",["1/(2T)","2/(3T)","1/T"],0,reset);
    var pfa=U.select(r3,"格子全体の誤警報確率",["0.1","0.01","0.001"],1,reset);
    var br=U.btnrow(el),seed=1;
    U.button(br,"探す",function(){start(false);});
    U.button(br,"止める",function(){tk.stop();draw();});
    U.button(br,"全部を一度に",function(){start(true);});
    U.button(br,"本文の例（PRN 1・45 dB-Hz・1 ms）",function(){prn.set(0);mth.set(0);cn.set(45);tc.set(1);stp.set(0);pfa.set(1);start(true);});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;var was=st.rev>0;tk.stop();st.rev=0;if(was)start(true);else draw();});
    var box=U.svgbox(el),ro=U.readout(el),st={P:null,key:"",rev:0,first:-1},tk=U.ticker(step,50);
    function cfg(){var T=tc.get(),fs=[0.5,2/3,1][stp.get()]/(T*1e-3),n=Math.ceil(5000/fs-1e-9),bins=[],i;for(i=-n;i<=n;i++)bins.push(i*fs);
      var nb=bins.length,ord=[n],rk=new Int32Array(nb);for(i=1;i<=n;i++){ord.push(n+i);ord.push(n-i);}ord.forEach(function(b,r){rk[b]=r;});
      var P=[0.1,0.01,0.001][pfa.get()];
      return {prn:prn.get()+1,T:T,fstep:fs,bins:bins,nb:nb,ord:ord,rk:rk,cells:nb*J,pfa:P,thr:Math.log(nb*J/P),ser:mth.get()===1,cn0:cn.get()};}
    function compute(c){var key=[c.prn,c.cn0,c.T,c.fstep,seed].join("|");if(st.key!==key){st.P=_w05_acq(U,c.prn,c.cn0,c.T,c.bins,seed);st.key=key;}
      /* 探す順（ドップラーは 0 Hz から外へ、その中で符号の位相を順に）で、最初にしきい値を超えるビン */
      var P=st.P;st.first=-1;for(var r=0;r<c.nb&&st.first<0;r++){var b=c.ord[r];for(var i=0;i<J;i++)if(P[b*J+i]>c.thr){st.first=r*J+i;break;}}}
    function reset(){tk.stop();st.rev=0;draw();}
    function start(all){tk.stop();var c=cfg();compute(c);st.rev=all?c.cells:0;draw();if(!all)tk.start();}
    function step(){var c=cfg();if(!st.P||st.P.length!==c.cells){tk.stop();return;}
      st.rev=Math.min(c.cells,st.rev+(c.ser?Math.ceil(c.cells/40):J*Math.max(1,Math.round(c.nb/24))));if(st.rev>=c.cells)tk.stop();draw();}
    /* 符号の位相の近さ（1023 チップで一周する） */
    function cd(a,b){var d=((a-b)%1023+1023)%1023;return Math.min(d,1023-d);}
    function draw(){
      var c=cfg(),nar=_w05_nar(box),Wd=nar?400:700,o=[],P=(st.rev>0&&st.P&&st.P.length===c.cells)?st.P:null,full=P&&st.rev>=c.cells;
      var sat=null;_W05_SATS.forEach(function(s){if(s[0]===c.prn)sat=s;});
      var ncol=nar?128:256,cw=J/ncol,gr=Math.ceil(c.nb/41),nr=Math.ceil(c.nb/gr);
      var x0=nar?62:62,y0=nar?268:318,WW=nar?198:410,dxT=nar?88:150,dyT=nar?104:136,hzT=nar?104:128;
      var dx=nr>1?dxT/(nr-1):0,dy=nr>1?dyT/(nr-1):0;
      function seen(b,i){return P&&c.rk[b]*J+i<st.rev;}
      /* 表示する値（立体の図の 1 本の線の 1 点 = 符号の位相 cw 個 × ドップラー gr 個の最大）と、しきい値を超えた所 */
      var mxAll=0,best=-1,hits=[],near=0,far=0;
      if(P){for(var q=0;q<P.length;q++)if(P[q]>mxAll)mxAll=P[q];
        for(var b=0;b<c.nb;b++)for(var i=0;i<J;i++){if(!seen(b,i))continue;var v=P[b*J+i];if(best<0||v>P[best])best=b*J+i;
          if(v>c.thr){var ok=sat&&cd(i*_W05_RC/_W05_FS,sat[1])<1.5&&Math.abs(c.bins[b]-sat[2])<1.5/(c.T*1e-3);hits.push([b,i,ok]);if(ok)near++;else far++;}}}
      var pd=Math.max(1.3*c.thr,1.05*mxAll),hz=hzT/pd;
      o.push(S.T(nar?6:14,18,"(a) PRN "+c.prn+" の格子: ドップラー "+c.nb+" 通り × 符号の位相 2048 通り","start",11,"ink",true));
      o.push(S.T(nar?6:14,34,P?(full?"全部を計算した":"計算中（"+(c.ser?"直列":"FFT")+"）"):"「探す」か「全部を一度に」を押す","start",9.5,P?"muted":"gold",!P));
      for(var r=nr-1;r>=0;r--){var pts=[],any=false,hasBest=false;
        for(var j=0;j<ncol;j++){var v2=-1;for(var bb=r*gr;bb<Math.min(c.nb,(r+1)*gr);bb++)for(var ii=j*cw;ii<(j+1)*cw;ii++)if(seen(bb,ii)){var pv=P[bb*J+ii];if(pv>v2)v2=pv;any=true;if(full&&bb*J+ii===best)hasBest=true;}
          pts.push([x0+(j+0.5)/ncol*WW+r*dx,y0-r*dy-Math.min(Math.max(v2,0),pd)*hz]);}
        var base=[[x0+WW+r*dx,y0-r*dy],[x0+r*dx,y0-r*dy]];
        o.push(S.PL(pts.concat(base),"none",0,"screen"));
        o.push(S.PL(pts,any?(hasBest?"signal":"muted"):"faint",any?(hasBest?1.4:0.9):0.7));}
      hits.forEach(function(h){var rr=Math.floor(h[0]/gr),xx=x0+(h[1]+0.5)/J*WW+rr*dx,yy=y0-rr*dy-Math.min(P[h[0]*J+h[1]],pd)*hz;o.push(S.D(xx,yy-3,h[2]?"green":"alias",3.2));});
      if(P&&!full&&st.rev>0){var cur=st.rev-1,rb=c.ord[Math.floor(cur/J)],ci=c.ser?cur%J:J-1,rr2=Math.floor(rb/gr),xc=x0+(ci+0.5)/J*WW+rr2*dx,yc=y0-rr2*dy;
        o.push(S.PL([[xc,yc+3],[xc-5,yc+12],[xc+5,yc+12]],"gold",1,"gold"));}
      /* 軸 */
      o.push(S.L(x0,y0+4,x0+WW,y0+4,"muted",1.1));
      [0,200,400,600,800,1000].forEach(function(v){var xx=x0+v/1023*WW;o.push(S.L(xx,y0+4,xx,y0+8,"muted",1));o.push(S.T(xx,y0+20,String(v),"middle",9.5,"muted"));});
      o.push(S.T(x0+WW/2,y0+36,"符号の位相 [チップ]","middle",10,"muted"));
      [0,(c.nb-1)/2,c.nb-1].forEach(function(b){var r=Math.floor(b/gr),f=c.bins[b];
        o.push(S.T(x0+WW+r*dx+6,y0-r*dy+4,(f>0.5?"+":"")+_w05_f(f/1000,Math.abs(f%1000)<1e-6?0:2)+" kHz","start",9.5,"muted"));});
      if(gr>1)o.push(S.T(x0+WW+(nr-1)*dx-60,y0-(nr-1)*dy-12,"1 本の線 = "+gr+" ビンの最大","start",9,"muted"));
      o.push(S.L(x0-8,y0,x0-8,y0-pd*hz,"muted",1));
      var yth=y0-c.thr*hz;
      U.nice(0,pd,3).forEach(function(v){if(v>pd)return;var yy=y0-v*hz;o.push(S.L(x0-12,yy,x0-8,yy,"muted",1));if(Math.abs(yy-yth)>11)o.push(S.T(x0-14,yy+3.5,U.sig(v,3),"end",9.5,"muted"));});
      o.push(S.L(x0-14,yth,x0-2,yth,"alias",1.8));o.push(S.T(x0-16,yth+3.5,"しきい値","end",9.5,"alias",true,false,null,true));
      o.push(S.TX(x0-8,y0-pd*hz-8,"p","middle",10,"muted"));
      /* (b)(c) 最大のビンを通る断面 */
      var yb=nar?318:372,h="";
      if(full){var bi=Math.floor(best/J),ki=best%J,tau=ki*_W05_RC/_W05_FS,fb=c.bins[bi],SN=Math.pow(10,c.cn0/10)*c.T*1e-3,onT=sat&&cd(tau,sat[1])<1.5&&Math.abs(fb-sat[2])<1.5/(c.T*1e-3);
        var top=Math.max(1.25*c.thr,1.1*P[best]),Pb=U.plot(nar?52:60,yb+18,nar?320:262,nar?96:110,[tau-3,tau+3],[0,top]);
        var Pc=nar?U.plot(52,yb+204,320,96,[fb-3/(c.T*1e-3),fb+3/(c.T*1e-3)],[0,top]):U.plot(402,yb+18,276,110,[fb-3/(c.T*1e-3),fb+3/(c.T*1e-3)],[0,top]);
        o.push(S.L(nar?6:10,yb-12,Wd-(nar?6:10),yb-12,"line",0.8));
        o.push(S.T(nar?6:14,yb+4,"(b) 符号の位相の断面（"+(fb>0?"+":"")+_w05_g(fb,0)+" Hz の行）","start",11,"ink",true));
        o.push(S.T(nar?6:398,nar?yb+190:yb+4,"(c) ドップラーの断面（"+_w05_f(tau,2)+" チップの列）","start",11,"ink",true));
        var yt=U.nice(0,top,3).filter(function(v){return v<=top;});
        o.push(Pb.axes({xt:U.nice(tau-3,tau+3,6).filter(function(v){return v>=tau-3&&v<=tau+3;}),yt:yt,xfmt:function(v){return _w05_f(v,v%1===0?0:1);},yfmt:function(v){return U.sig(v,3);},xl:"符号の位相 [チップ]",yl:"p",ylOff:34}));
        o.push(Pc.axes({xt:U.nice(Pc.xr[0],Pc.xr[1],5).filter(function(v){return v>=Pc.xr[0]-1e-9&&v<=Pc.xr[1]+1e-9;}),yt:yt,xfmt:function(v){return _w05_g(v,0);},yfmt:function(v){return U.sig(v,3);},xl:"ドップラー [Hz]",yl:"p",ylOff:34}));
        [Pb,Pc].forEach(function(Q){o.push(Q.line([[Q.xr[0],c.thr],[Q.xr[1],c.thr]],"alias",1.2,"5 3"));});
        if(onT){var cb=[],cc=[],k2;for(k2=0;k2<=240;k2++){var x=tau-3+6*k2/240;cb.push([x,1+SN*Math.pow(_w05_lam(x-sat[1]),2)*Math.pow(_w05_sinc((fb-sat[2])*c.T*1e-3),2)]);}
          for(k2=0;k2<=240;k2++){var f2=Pc.xr[0]+(Pc.xr[1]-Pc.xr[0])*k2/240;cc.push([f2,1+SN*Math.pow(_w05_lam(tau-sat[1]),2)*Math.pow(_w05_sinc((f2-sat[2])*c.T*1e-3),2)]);}
          o.push(Pb.clip(cb,"green",1.6,"4 3"));o.push(Pc.clip(cc,"green",1.6,"4 3"));}
        for(var k3=ki-6;k3<=ki+6;k3++){var kk=((k3%J)+J)%J,pv2=P[bi*J+kk],xx2=tau+(k3-ki)*_W05_RC/_W05_FS;o.push(S.L(Pb.X(xx2),Pb.Y(0),Pb.X(xx2),Pb.Y(Math.min(pv2,top)),"faint",1));o.push(S.D(Pb.X(xx2),Pb.Y(Math.min(pv2,top)),pv2>c.thr?"signal":"muted",k3===ki?4:2.8));}
        for(var b3=0;b3<c.nb;b3++){var f3=c.bins[b3];if(f3<Pc.xr[0]-1e-9||f3>Pc.xr[1]+1e-9)continue;var pv3=P[b3*J+ki];o.push(S.L(Pc.X(f3),Pc.Y(0),Pc.X(f3),Pc.Y(Math.min(pv3,top)),"faint",1));o.push(S.D(Pc.X(f3),Pc.Y(Math.min(pv3,top)),pv3>c.thr?"signal":"muted",b3===bi?4:2.8));}
        var lx=nar?14:60,ly=nar?yb+352:yb+176;o.push(S.D(lx+5,ly-4,"signal",3.4));o.push(S.T(lx+13,ly,"ビン（しきい値を超えると青）","start",9.5,"muted"));lx+=13+U.tw("ビン（しきい値を超えると青）",9.5)+14;
        o.push(S.LEGL(lx,ly,onT?[["alias","5 3","しきい値"],["green","4 3","本当の山の式の値"]]:[["alias","5 3","しきい値"]],9.5,14));
        box.set(S.svg(Wd,nar?yb+362:yb+186,o));}
      else box.set(S.svg(Wd,y0+46,o));
      /* 読み出し */
      var Pfa1=c.pfa/c.cells,SNd=c.cn0+10*Math.log10(c.T*1e-3);
      h+="格子: ドップラー <b>"+c.nb+"</b> 通り（刻み "+_w05_g(c.fstep,0)+" Hz、±5 kHz）× 符号の位相 2048 通り（約 1/2 チップごと）= <b>"+_w05_g(c.cells,0)+"</b> ビン（直列で 1/2 チップごとに試すなら 2046 × "+c.nb+" = "+_w05_g(2046*c.nb,0)+" ビン）";
      h+="<br>しきい値: 1 つのビンの誤警報確率 "+_w05_sci(Pfa1,2)+"、p<sub>th</sub> = ln(1/P<sub>fa</sub>) = <b>"+_w05_f(c.thr,1)+"</b>（雑音の平均の "+_w05_f(10*Math.log10(c.thr),1)+" dB 上）";
      if(sat)h+="<br>本当の値: 符号の位相 "+_w05_f(sat[1],2)+" チップ・ドップラー "+(sat[2]>0?"+":"")+_w05_g(sat[2],0)+" Hz。雑音の無い頂点の p は 1 + (C/N0)T<sub>coh</sub> = "+_w05_f(1+Math.pow(10,SNd/10),1)+"（SNR "+_w05_f(SNd,1)+" dB）。ビンが頂点からずれると小さくなる";
      else h+="<br>PRN 3 は、受けた信号に入っていない（PRN 1・2 の信号は、PRN 3 の局部の符号とはほとんど相関しない）";
      if(P){var bi2=Math.floor(best/J),ki2=best%J,fb2=c.bins[bi2];
        h+="<br>"+(full?"最大のビン":"ここまでの最大のビン")+": p = <b>"+_w05_f(P[best],1)+"</b>（"+_w05_f(ki2*_W05_RC/_W05_FS,2)+" チップ・"+(fb2>0?"+":"")+_w05_g(fb2,0)+" Hz）。しきい値を超えたビン "+hits.length+" 個（本当の山の近く "+near+"・ほか "+far+"）";
        if(full){var vd;if(sat)vd=near>0?(far>0?'<span class="warn">見つかったが、誤警報もある</span>':'<span class="ok">見つかった</span>'):(far>0?'<span class="warn">山を見逃し、誤警報だけがある</span>':'<span class="warn">見逃した（しきい値を超えるビンが無い）</span>');
          else vd=far>0?'<span class="warn">誤警報（いない衛星を「いる」と決めた）</span>':'<span class="ok">この衛星はいない、と正しく決めた</span>';h+=" → "+vd;}}
      var ser=c.nb*2046*c.T*1e-3,opS=c.nb*c.T*(J+2046*J),opF=c.nb*(c.T*(J+FOPS+J)+(c.T-1)*J+FOPS);
      h+="<br>1 組の相関器で直列に全部を試す時間: "+_w05_g(2046*c.nb,0)+" × "+c.T+" ms = <b>"+_w05_t(ser)+"</b>";
      if(P&&!full)h+="。ここまで "+_w05_g(Math.round(st.rev*2046/J),0)+" ビン（1 組の相関器なら "+_w05_t(st.rev*c.T*1e-3*2046/J)+"）";
      if(P&&st.first>=0&&st.rev>st.first)h+="。最初にしきい値を超えたビンまで "+_w05_t((st.first+1)*c.T*1e-3*2046/J)+"（直列の受信機は、ここで探すのを止めて確かめる）";
      h+="<br>計算の回数（1 つの衛星）: 直列 "+_w05_sci(opS,2)+" 回、FFT "+_w05_sci(opF,2)+" 回（直列の "+_w05_g(opS/opF,0)+" 分の 1）";
      ro.innerHTML=h+'<div class="wnote">受けた信号は、PRN 1（120.25 チップ・+1630 Hz）と PRN 2（731.6 チップ・−2380 Hz）の C/A 符号の信号（例の値。どちらも同じ C/N0）に雑音を足した、1 ms に 2048 個の複素数の標本。データのビットの反転と、符号のドップラー（1 秒に 1 チップほど）は入れていない。ドップラーは 0 Hz から外へ順に探す。立体の図は、隣り合う '+cw+' 個の符号の位相（行が多いときは、隣り合うドップラーのビンも）の最大を 1 点にした。直列の順に見せるときも、値は FFT で求めた相関を使った（2 節の図で、両者が一致することを確かめた）。計算の回数は、本文の表と同じ数え方。</div>';
    }
    draw();
  };

  /* ---- 3 節: DLL（S 字の上の点 ↔ 局部の符号のずれの時間の変化） ---- */
  /* 雑音の無い判別器の出力（ずれ x、E と L の間隔 d [チップ]。kind 0: 電力の差、1: 大きさの差 ÷ 和、2: I だけの差） */
  function _w05_disc(x,d,kind){var e=_w05_lam(x-d/2),l=_w05_lam(x+d/2);if(kind===0)return (e*e-l*l)/(2*(2-d));if(kind===1)return e+l>1e-12?(1-d/2)*(e-l)/(e+l):0;return (e-l)/2;}
  /* 1 次の DLL を 1 本（振幅を √(2C) で割った E・L の I・Q に、相関 1 − d の雑音を足す） */
  function _w05_dll(U,o){var g=U.rng(o.seed),c=Math.pow(10,o.cn0/10),T=o.T,sd=Math.sqrt(1/(2*c*T)),kap=4*T*o.BL/(1+2*T*o.BL),rho=Math.max(0,1-o.d),rr=Math.sqrt(1-rho*rho);
    var n=Math.round(o.tend/T),E=new Float32Array(n+1),Dk=new Float32Array(n),e=o.e0,lost=-1,vc=o.v/_W05_CTC,lim=1+o.d/2,h=o.d/2;
    for(var k=0;k<n;k++){E[k]=e;var z0=g.normal(),z1=g.normal(),z2=g.normal(),z3=g.normal();
      var EI=_w05_lam(e-h)+sd*z0,LI=_w05_lam(e+h)+sd*(rho*z0+rr*z1),EQ=sd*z2,LQ=sd*(rho*z2+rr*z3),D;
      if(o.kind===0)D=((EI*EI+EQ*EQ)-(LI*LI+LQ*LQ))/(2*(2-o.d));
      else if(o.kind===1){var a=Math.hypot(EI,EQ),b=Math.hypot(LI,LQ);D=(1-h)*(a-b)/(a+b);}
      else D=(EI-LI)/2;
      Dk[k]=D;e=e-kap*D+((!o.aided&&k*T>=3-1e-9)?vc*T:0);if(lost<0&&Math.abs(e)>lim)lost=(k+1)*T;}
    E[n]=e;return {e:E,D:Dk,n:n,lost:lost,kap:kap};}
  /* 揺れの標準偏差: 動き無し・ずれ 0 から nl 本を計算し、落ち着いた後の値をまとめる */
  function _w05_dllsig(U,o){var T=o.T,kap=4*T*o.BL/(1+2*T*o.BL),tc=T/kap,skip=Math.ceil(3*tc/T),m=Math.ceil(Math.max(8,25*tc)/T),s2=0,cnt=0,lost=false;
    for(var j=0;j<8;j++){var r=_w05_dll(U,{cn0:o.cn0,BL:o.BL,d:o.d,T:T,kind:o.kind,v:0,aided:true,e0:0,seed:o.seed*97+j+1,tend:(skip+m)*T});
      if(r.lost>=0)lost=true;for(var k=skip;k<=r.n;k++){s2+=r.e[k]*r.e[k];cnt++;}}
    return {s:Math.sqrt(s2/cnt),lost:lost};}
  /* この節の式: 位相が合っているとき（coh）と、電力の差 */
  function _w05_dllf(cn0,BL,d,T,coh){var c=Math.pow(10,cn0/10),v=BL*d/(2*c);return Math.sqrt(coh?v:v*(1+2/((2-d)*T*c)));}
  REG.w05_dll=function(el,U){
    var S=U.S,KN=["E と L の電力の差","大きさの差 ÷ 和","I だけの差（位相が合っている）"];
    U.head(el,"DELAY LOCK LOOP","DLL — S 字の上の点と、局部の符号のずれの時間の変化");
    var r1=U.ctrls(el);
    var dd=U.slider(r1,"E と L の間隔 Δ<sub>EL</sub>",{values:[1,0.5,0.2,0.1],value:1,fmt:function(v){return v+" チップ";},onInput:run});
    var kd=U.select(r1,"判別器",KN,0,run);
    var r2=U.ctrls(el);
    var bl=U.slider(r2,"ループの帯域 B<sub>L</sub>",{values:[0.1,0.2,0.5,1,2,5,10],value:1,fmt:function(v){return v+" Hz";},onInput:run});
    var cn=U.slider(r2,"C/N0",{min:15,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var tc=U.slider(r2,"積分の時間 T<sub>coh</sub>",{values:[1,2,5,10,20],value:1,fmt:function(v){return v+" ms";},onInput:run});
    var r3=U.ctrls(el);
    var sp=U.slider(r3,"3 s からの受信機の速さ",{values:[0,10,30,100,300],value:0,fmt:function(v){return v+" m/s";},onInput:run});
    var e0=U.slider(r3,"初めのずれ",{values:[0,0.25,0.5,1,1.4],value:0.25,fmt:function(v){return _w05_f(v,2)+" チップ";},onInput:run});
    var ai=U.checkbox(r3,"搬送波による支援",true,run);
    var br=U.btnrow(el),seed=1,cur=10,R=null,SG=null,tk=U.ticker(function(){cur=Math.min(10,cur+0.08);if(cur>=10)tk.stop();draw();},40);
    function set(a){dd.set(a[0]);kd.set(a[1]);bl.set(a[2]);cn.set(a[3]);tc.set(a[4]);sp.set(a[5]);e0.set(a[6]);ai.set(a[7]);run();}
    U.button(br,"本文の例（45 dB-Hz・1 Hz・間隔 1 チップ）",function(){set([1,0,1,45,1,0,0.25,true]);});
    U.button(br,"図の (b) の例（支援なし・100 m/s）",function(){set([1,0,0.5,35,1,100,0.25,false]);});
    U.button(br,"再生",function(){if(cur>=10-1e-9)cur=0;tk.start();});
    U.button(br,"止める",function(){tk.stop();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function par(){return {cn0:cn.get(),BL:bl.get(),d:dd.get(),T:tc.get()*1e-3,kind:kd.get(),v:sp.get(),aided:ai.get(),e0:e0.get(),seed:seed,tend:10};}
    function run(){tk.stop();cur=10;var o=par();R=_w05_dll(U,o);SG=_w05_dllsig(U,o);draw();}
    function draw(){
      var o=par(),nar=_w05_nar(box),Wd=nar?400:700,s=[],d=o.d,kc=Math.min(R.n,Math.round(cur/o.T)),lim=1+d/2;
      /* (a) S 字 */
      var ya=d,A=U.plot(52,34,nar?330:250,nar?150:170,[-2,2],[-ya,ya]);
      s.push(S.T(nar?6:14,18,"(a) 判別器の S 字と、測った値（"+KN[o.kind].replace("（位相が合っている）","")+"）","start",11,"ink",true));
      s.push(S.RECT(A.X(-d/2),A.y,A.X(d/2)-A.X(-d/2),A.h,0,U.soft("green"),"none",0));
      s.push(A.axes({xt:[-2,-1,0,1,2],yt:[-d,-d/2,0,d/2,d],xfmt:function(v){return _w05_f(v,0);},yfmt:function(v){return _w05_f(v,d<0.2?2:(d<1?2:1));},xl:"ずれ Δτ/T_c [チップ]",yl:"判別器の出力 D [チップ]",ylOff:42}));
      [-lim,lim].forEach(function(x){s.push(S.L(A.X(x),A.y,A.X(x),A.y+A.h,"alias",1,"4 3"));});
      var sc=[];for(var i=0;i<=400;i++){var x=-2+4*i/400;sc.push([x,_w05_disc(x,d,o.kind)]);}
      s.push(A.clip(sc,"signal",2));
      var W=Math.max(20,Math.round(0.2/o.T)),dots=[];for(var k=Math.max(0,kc-W);k<kc;k++){var ex=R.e[k],dv=R.D[k];if(ex>=-2&&ex<=2&&dv>=-ya&&dv<=ya)dots.push(S.D(A.X(ex),A.Y(dv),"gold",1.7));}
      s.push(dots.join(""));
      if(kc>0){var ek=R.e[kc-1],dk=R.D[kc-1];if(ek>=-2&&ek<=2)s.push(S.D(A.X(ek),A.Y(Math.max(-ya,Math.min(ya,dk))),"gold",4.6));}
      s.push(S.TX(A.X(-1.95),A.y+A.h-6,"緑の帯: ±Δ_{EL}/2","start",9,"green",false,true));
      s.push(S.TX(A.X(lim)-3,A.y+A.h-6,"1 + Δ_{EL}/2","end",9,"alias",false,true));
      /* (b) ずれの時間の変化 */
      var mx=0;for(k=0;k<=R.n;k++)mx=Math.max(mx,Math.abs(R.e[k]));
      var sf=_w05_dllf(o.cn0,o.BL,d,o.T,o.kind===2),yb=Math.min(2.2,Math.max(1.15*mx,4*sf,0.3)),yt=U.nice(-yb,yb,4).filter(function(v){return Math.abs(v)<=yb+1e-9;});
      var B=nar?U.plot(52,260,330,150,[0,10],[-yb,yb]):U.plot(372,34,310,170,[0,10],[-yb,yb]);
      s.push(S.T(nar?6:330,nar?244:18,"(b) 局部の符号のずれ（1 チップ = 293 m）","start",11,"ink",true));
      s.push(B.axes({xt:[0,2,4,6,8,10],yt:yt,xfmt:function(v){return String(v);},yfmt:function(v){return _w05_f(v,yb<0.6?2:1);},xl:"時間 t [s]",yl:"ずれ [チップ]",ylOff:40}));
      [d/2,-d/2].forEach(function(v){if(Math.abs(v)<yb)s.push(B.line([[0,v],[10,v]],"green",1,"3 3"));});
      [lim,-lim].forEach(function(v){if(Math.abs(v)<yb)s.push(B.line([[0,v],[10,v]],"alias",1,"4 3"));});
      if(o.v>0&&!o.aided){var lag=o.v/_W05_CTC*o.T/R.kap;if(lag<yb)s.push(B.line([[3,lag],[10,lag]],"muted",1.2,"6 3"));s.push(S.L(B.X(3),B.y,B.X(3),B.y+B.h,"purple",1,"2 3"));
        s.push(S.T(B.X(3)+3,B.y+11,"動き始め","start",9,"purple",false,false,null,true));}
      s.push(_w05_band(U,B,R.e,o.T,R.n+1,"gold",1.2));
      if(cur<10-1e-9)s.push(S.L(B.X(cur),B.y,B.X(cur),B.y+B.h,"signal",1.4));
      if(R.lost>=0)s.push(S.T(B.X(Math.min(R.lost,9.9)),B.y+B.h-8,"ロックが外れた","middle",9.5,"alias",true,false,null,true));
      box.set(S.svg(Wd,nar?452:246,s));
      /* 読み出し */
      var tcst=o.T/R.kap,lagc=(o.v>0&&!o.aided)?o.v/_W05_CTC*o.T/R.kap:0,sfc=_w05_dllf(o.cn0,o.BL,d,o.T,true),sfp=_w05_dllf(o.cn0,o.BL,d,o.T,false),sfu=o.kind===2?sfc:sfp,rule=3*sfu+lagc,h="";
      h+="κ = 4B<sub>L</sub>T<sub>coh</sub>/(1 + 2B<sub>L</sub>T<sub>coh</sub>) = "+_w05_f(R.kap,R.kap<0.01?5:4)+"、時定数 T<sub>coh</sub>/κ = "+_w05_t(tcst)+"（約 1/(4B<sub>L</sub>)）";
      h+="<br>落ち着いた後のずれの標準偏差（シミュレーション）: "+(SG.lost?'<span class="warn">ロックが外れる（揺れが引き込める範囲を超える）</span>':"σ<sub>τ</sub> = "+_w05_f(SG.s,4)+" チップ → σ<sub>ρ</sub> = <b>"+_w05_f(SG.s*_W05_CTC,2)+" m</b>");
      h+="<br>この節の式: 位相が合っているとき（I だけの差）"+_w05_f(sfc*_W05_CTC,2)+" m、電力の差 "+_w05_f(sfp*_W05_CTC,2)+" m（倍率 1 + 2/{(2 − Δ<sub>EL</sub>)T<sub>coh</sub>(C/N0)} = "+_w05_f(Math.pow(sfp/sfc,2),2)+"）"+(o.kind===1?"。大きさの差 ÷ 和の式は本文では求めていない（C/N0 が低いと、和で割るために傾きが下がり、揺れは電力の差より小さく出る）":"");
      h+="<br>動きによる遅れ: "+(o.v===0?"受信機は止まっている":(o.aided?"搬送波による支援で打ち消される（残りは無視できる）":"v<sub>c</sub> = "+_w05_f(o.v/_W05_CTC,3)+" チップ/s、v<sub>c</sub>T<sub>coh</sub>/κ = <b>"+_w05_f(lagc,3)+" チップ（"+_w05_f(lagc*_W05_CTC,1)+" m）</b>"));
      h+="<br>追尾の目安（3σ<sub>τ</sub> + 遅れ ≤ Δ<sub>EL</sub>/2 = "+_w05_f(d/2,2)+" チップ。σ<sub>τ</sub> は"+(o.kind===2?"位相が合っているときの":"電力の差の")+"式）: "+_w05_f(rule,3)+" チップ → "+(rule<=d/2?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>');
      h+="<br>上の図の 10 s: "+(R.lost>=0?'<span class="warn">t = '+_w05_f(R.lost,2)+" s でロックが外れた（|ずれ| > 1 + Δ<sub>EL</sub>/2）</span>":"ロックは外れなかった")+(cur<10-1e-9?"。時刻の印 t = "+_w05_f(cur,2)+" s":"");
      ro.innerHTML=h+'<div class="wnote">E・L の相関器の I・Q は、振幅を √(2C) で割った値に、雑音（各成分の分散 1/{2(C/N0)T<sub>coh</sub>}、E と L の雑音の相関 1 − Δ<sub>EL</sub>）を乱数で足して作った。ループは 1 次（測ったずれの κ 倍だけ直す）で、受けた符号は 3 s から一定の速さで動き始める（支援ありでは、搬送波のループのドップラーで打ち消されるとした）。(a) の点は、時刻の印より前の 0.2 s（または 20 回）の、ずれと判別器の出力の組。標準偏差は、別に 8 本のループを、ずれ 0・動き無しから計算した値。</div>';
    }
    run();
  };

  /* ---- 4 節: FLL と PLL（I・Q の平面の点 ↔ 周波数と位相のずれの時間の変化） ---- */
  /* 1 ms ごとの FLL → PLL。mode 0: FLL（0.2 s）から PLL、1: PLL だけ、2: FLL だけ。disc 0: コスタス arctan(−Q/I)、1: 4 象限 */
  function _w05_pll(U,o){var T=1e-3,n=Math.round(o.tend/T),c=Math.pow(10,o.cn0/10),sd=Math.sqrt(1/(2*c*T)),g=U.rng(o.seed*7+10);
    var w0=o.order===3?o.B/0.7845:o.B/0.53,ffl=o.mode===0?0.2:(o.mode===2?1e9:0),kf=4*T*10/(1+2*T*10),ta=0.7,aa=o.acc*9.81/_W05_LAM;
    var nb=Math.ceil(o.tend/0.02)+2,bits=new Int8Array(nb),i;for(i=0;i<nb;i++)bits[i]=o.data?(g.next()<0.5?1:-1):1;
    var psh=0,wh=0,x1=null,x2=0,pI=null,pQ=0,I=new Float32Array(n),Q=new Float32Array(n),dF=new Float32Array(n),dP=new Float64Array(n),sw=-1;
    for(var k=0;k<n;k++){var t0=k*T,tm=t0+T/2,tt=Math.max(0,tm-ta),psi=o.psi0+2*Math.PI*(o.df0*tm+0.5*aa*tt*tt),fd=o.df0+aa*tt;
      var dpb=psi-(psh+wh*T/2),dfr=fd-wh/(2*Math.PI),amp=_w05_sinc(dfr*T),dk=bits[Math.floor(t0/0.02+1e-9)];
      var ii=dk*amp*Math.cos(dpb)+sd*g.normal(),qq=-dk*amp*Math.sin(dpb)+sd*g.normal();
      I[k]=ii;Q[k]=qq;dF[k]=dfr;dP[k]=dpb;
      if(t0<ffl-1e-12){if(pI!==null){var num=ii*pQ-pI*qq,den=pI*ii+pQ*qq,fe=den!==0?Math.atan(num/den)/(2*Math.PI*T):0;wh+=2*Math.PI*kf*fe;}pI=ii;pQ=qq;}
      else{if(x1===null){x1=wh;sw=k;}var e=o.disc===0?(ii!==0?Math.atan(-qq/ii):0):Math.atan2(-qq,ii);
        if(o.order===2){x1+=w0*w0*T*e;wh=x1+1.414*w0*e;}else{x2+=w0*w0*w0*T*e;x1+=(x2+1.1*w0*w0*e)*T;wh=x1+2.4*w0*e;}}
      psh+=wh*T;}
    return {I:I,Q:Q,dF:dF,dP:dP,sw:sw,n:n,T:T,w0:w0};}
  REG.w05_pll=function(el,U){
    var S=U.S,D2R=Math.PI/180;
    U.head(el,"CARRIER TRACKING","FLL と PLL — I・Q の平面の点と、周波数・位相のずれ");
    var r1=U.ctrls(el);
    var md=U.select(r1,"ループの方式",["FLL（0.2 s）から PLL へ","PLL だけ","FLL だけ"],0,run);
    var dc=U.select(r1,"PLL の判別器",["コスタス arctan(−Q/I)","4 象限 arctan2(−Q, I)"],0,run);
    var od=U.select(r1,"PLL の次数",["2 次","3 次"],0,run);
    var r2=U.ctrls(el);
    var f0=U.slider(r2,"初めの周波数のずれ",{min:0,max:300,step:10,value:200,fmt:function(v){return v+" Hz";},onInput:run});
    var bw=U.slider(r2,"PLL の帯域 B<sub>L</sub>",{values:[2,5,10,15,20,30],value:15,fmt:function(v){return v+" Hz";},onInput:run});
    var cn=U.slider(r2,"C/N0",{min:20,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var r3=U.ctrls(el);
    var ac=U.slider(r3,"0.7 s からの加速度（衛星へ向かう向き）",{values:[0,0.5,1,2,4],value:0,fmt:function(v){return v+" g";},onInput:run});
    var db=U.checkbox(r3,"データのビット（20 ms ごとに ±1）",true,run);
    var br=U.btnrow(el),seed=1,TE=1.5,cur=TE,R=null,L=null,tk=U.ticker(function(){cur=Math.min(TE,cur+0.01);if(cur>=TE)tk.stop();draw();},40);
    U.button(br,"本文の例（200 Hz・FLL から PLL・15 Hz）",function(){md.set(0);dc.set(0);od.set(0);f0.set(200);bw.set(15);cn.set(45);ac.set(0);db.set(true);run();});
    U.button(br,"1 g の加速度",function(){ac.set(1);run();});
    U.button(br,"再生",function(){if(cur>=TE-1e-9)cur=0;tk.start();});
    U.button(br,"止める",function(){tk.stop();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function par(){return {mode:md.get(),disc:dc.get(),order:od.get()===1?3:2,df0:f0.get(),B:bw.get(),cn0:cn.get(),acc:ac.get(),data:db.get(),seed:seed,tend:TE,psi0:0.6};}
    function wr(x,q){var p=q?2*Math.PI:Math.PI;return x-p*Math.round(x/p);}
    function run(){tk.stop();cur=TE;var o=par();R=_w05_pll(U,o);
      /* 揺れ: 引き込んだ状態から 3 s（動き無し）。PLL のときだけ */
      L=o.mode===2?null:_w05_pll(U,{mode:1,disc:o.disc,order:o.order,df0:0,B:o.B,cn0:o.cn0,acc:0,data:o.data,seed:seed*131+7,tend:3,psi0:0});draw();}
    function stats(o){var r={},n=R.n,k,j,q=o.disc===1;
      /* 引き込み: 位相のずれ（PLL）か周波数のずれ（FLL だけ）が、50 ms 続けて小さい最初の時刻 */
      r.pull=-1;var run2=0,k0=o.mode===2?0:Math.max(0,R.sw);
      for(k=k0;k<n;k++){var okk=o.mode===2?Math.abs(R.dF[k])<2:Math.abs(wr(R.dP[k],q))<15*D2R;if(okk){run2++;if(run2>=50){r.pull=(k-49)*R.T;break;}}else run2=0;}
      if(L){var s2=0,c2=0;for(k=300;k<L.n;k++){var w=wr(L.dP[k],q);s2+=w*w;c2++;}r.sig=Math.sqrt(s2/c2)/D2R;}
      /* 180° の跳び（4 象限では 360°）: 引き込んだ後、ロックする点が変わった回数 */
      r.slip=0;if(o.mode!==2&&r.pull>=0){var p=q?2*Math.PI:Math.PI,nl=Math.round(R.dP[Math.round(r.pull/R.T)]/p);for(k=Math.round(r.pull/R.T);k<n;k++){if(Math.abs(R.dP[k]-nl*p)>0.75*p){nl=Math.round(R.dP[k]/p);r.slip++;}}}
      if(o.acc>0&&o.mode!==2){var m=0,c3=0;for(k=1200;k<n;k++){m+=wr(R.dP[k],q);c3++;}r.th=m/c3/D2R;}
      r.res=0;for(j=n-100;j<n;j++)r.res+=R.dF[j]/100;
      return r;}
    function draw(){
      var o=par(),nar=_w05_nar(box),Wd=nar?400:700,s=[],kc=Math.max(1,Math.min(R.n,Math.round(cur/R.T))),q=o.disc===1,st=stats(o),i,k;
      /* (a) I・Q の平面 */
      var A=nar?U.plot(110,34,200,200,[-1.6,1.6],[-1.6,1.6]):U.plot(52,34,200,200,[-1.6,1.6],[-1.6,1.6]);
      s.push(S.T(nar?6:14,18,"(a) P の I・Q（t = "+_w05_f(kc*R.T,2)+" s までの 0.1 s）","start",11,"ink",true));
      s.push(S.RECT(A.x,A.y,A.w,A.h,0,"screen","line",0.8));
      s.push(A.axes({xt:[-1,0,1],yt:[-1,0,1],grid:false,xfmt:function(v){return _w05_f(v,0);},yfmt:function(v){return _w05_f(v,0);},xl:"I_P（振幅を √(2C) で割った値）",yl:"Q_P",ylOff:30}));
      s.push(S.L(A.X(-1.6),A.Y(0),A.X(1.6),A.Y(0),"faint",1));s.push(S.L(A.X(0),A.Y(-1.6),A.X(0),A.Y(1.6),"faint",1));
      var cp=[];for(i=0;i<=72;i++)cp.push([Math.cos(i*5*D2R),Math.sin(i*5*D2R)]);s.push(A.line(cp,"faint",1,"3 3"));
      var dts=[];for(k=Math.max(0,kc-100);k<kc;k++){var xi=Math.max(-1.6,Math.min(1.6,R.I[k])),yi=Math.max(-1.6,Math.min(1.6,R.Q[k]));dts.push(S.D(A.X(xi),A.Y(yi),"signal",k===kc-1?4.6:1.8));}
      s.push(dts.join(""));
      /* (b)(c)(d) 時間の変化 */
      var xr=[0,TE],X0=nar?52:330,WP=nar?330:352,HP=nar?74:56,Y0=nar?302:34,GP=nar?118:92;
      var fmax=0;for(k=0;k<R.n;k++)fmax=Math.max(fmax,Math.abs(R.dF[k]));var fr=Math.max(10,1.1*fmax);
      var Pf=U.plot(X0,Y0,WP,HP,xr,[-fr,fr]),Pp=U.plot(X0,Y0+GP,WP,HP,xr,q?[-180,180]:[-90,90]),Pi=U.plot(X0,Y0+2*GP,WP,HP,xr,[-1.6,1.6]);
      s.push(S.T(nar?6:X0-44,nar?Y0-14:Y0-16+0,"(b) 周波数のずれ Δf [Hz]","start",10.5,"ink",true));
      s.push(S.T(nar?6:X0-44,Pp.y-14+(nar?0:4),"(c) 位相のずれ [°]（"+(q?"±180°":"±90°")+" に折り返して表示）","start",10.5,"ink",true));
      s.push(S.T(nar?6:X0-44,Pi.y-14+(nar?0:4),"(d) P の I（データのビット）","start",10.5,"ink",true));
      var ftk=U.nice(-fr,fr,3).filter(function(v){return Math.abs(v)<=fr;});
      [Pf,Pp,Pi].forEach(function(P,j){
        if(o.mode===0)s.push(S.RECT(P.X(0),P.y,P.X(0.2)-P.X(0),P.h,0,U.soft("purple"),"none",0));
        if(o.mode===2)s.push(S.RECT(P.X(0),P.y,P.X(TE)-P.X(0),P.h,0,U.soft("purple"),"none",0));
        s.push(P.axes({xt:[0,0.5,1,1.5],yt:j===0?ftk:(j===1?(q?[-180,0,180]:[-90,0,90]):[-1,0,1]),xfmt:function(v){return j===2?_w05_f(v,1):"";},yfmt:function(v){return _w05_f(v,0);},xl:j===2?"時間 t [s]":null,ylOff:30}));
        if(o.acc>0)s.push(S.L(P.X(0.7),P.y,P.X(0.7),P.y+P.h,"purple",1,"2 3"));
        if(cur<TE-1e-9)s.push(S.L(P.X(cur),P.y,P.X(cur),P.y+P.h,"signal",1.4));});
      var wp=new Float32Array(R.n);for(k=0;k<R.n;k++)wp[k]=wr(R.dP[k],q)/D2R;
      s.push(_w05_band(U,Pf,R.dF,R.T,R.n,"gold",1.3));
      s.push(_w05_band(U,Pp,wp,R.T,R.n,"gold",1.1));
      s.push(_w05_band(U,Pi,R.I,R.T,R.n,"signal",1));
      if(o.mode===0)s.push(S.T(Pf.X(0.1),Pf.y+11,"FLL","middle",9,"purple",true,false,null,true));
      if(o.acc>0)s.push(S.T(Pf.X(0.7)+3,Pf.y+11,o.acc+" g","start",9,"purple",true,false,null,true));
      box.set(S.svg(Wd,nar?Pi.y+Pi.h+44:Pi.y+Pi.h+42,s));
      /* 読み出し */
      var c=Math.pow(10,o.cn0/10),sfm=Math.sqrt(o.B/c*(1+1/(2*1e-3*c)))/D2R,th=o.order===2?(2*Math.PI*o.acc*9.81/_W05_LAM)/(R.w0*R.w0)/D2R:0,h="";
      h+="ループ: "+(o.mode===2?"FLL（帯域 10 Hz）だけ":(o.mode===0?"FLL（帯域 10 Hz）で 0.2 s 周波数を寄せてから、":"")+o.order+" 次の PLL（B<sub>L</sub> = "+o.B+" Hz、ω<sub>n</sub> = B<sub>L</sub>/"+(o.order===2?"0.53":"0.785")+" = "+_w05_f(R.w0,1)+" rad/s）")+"。1 ms ごとに直す";
      if(o.mode===2)h+="<br>周波数のずれ: 最後の 0.1 s の平均 "+_w05_f(st.res,1)+" Hz"+(st.pull>=0?"。2 Hz より小さくなった時刻 "+_w05_f(st.pull,2)+" s":"")+"。FLL は位相を合わせないので、I・Q の点は回り続け、データを I で読めない";
      else{h+="<br>引き込み（位相のずれが ±15° の中に 50 ms 続けて入った最初の時刻）: "+(st.pull>=0?"<b>"+_w05_f(st.pull,2)+" s</b>":'<span class="warn">'+_w05_f(TE,1)+" s までに引き込めない</span>");
        var bad=o.disc===1&&o.data;
        h+="<br>落ち着いた後の位相の揺れ（シミュレーション、動き無しで 3 s）: "+(st.sig>20?'<span class="warn">'+_w05_f(st.sig,0)+"°（ロックを保てない）</span>":"<b>"+_w05_f(st.sig,2)+"°</b>")+"、式 σ<sub>ψ</sub> = √{B<sub>L</sub>/(C/N0) × (1 + 1/(2T<sub>coh</sub>(C/N0)))} = "+_w05_f(sfm,2)+"°"+(bad?"（式はコスタスの判別器のもの）":"");
        var okp=st.pull>=0&&st.pull<1.1;
        if(o.acc>0)h+="<br>加速度 "+o.acc+" g（ドップラーが 1 秒に "+_w05_f(o.acc*9.81/_W05_LAM,1)+" Hz ずつ変わる）による位相のずれ: 式 "+(o.order===2?"ψ<sub>e</sub> = (2π"+U.htx("\\dot{v}")+"/λ)/ω<sub>n</sub><sup>2</sup> = <b>"+_w05_f(th,1)+"°</b>":"3 次の PLL では 0")+"、シミュレーション（1.2〜1.5 s の平均）"+(okp&&st.th!=null&&!bad?_w05_f(st.th,1)+"°":"−（引き込めていない）");
        var rule=3*sfm+Math.abs(th);h+="<br>追尾の目安（3σ<sub>ψ</sub> + 動きによるずれ ≤ 45°。式の値で）: "+_w05_f(rule,1)+"° → "+(rule<=45?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+(st.pull<0?(bad?"。ただし、データのビットのためにロックしていない":(o.mode===1?"。ただし、初めの周波数のずれが PLL の引き込める範囲より大きく、ロックしていない（FLL で寄せてから PLL に渡す）":"。ただし、ロックしていない")):"");
        if(bad)h+='<br><span class="warn">4 象限の判別器は、データのビットがあると使えない</span>（ビットが変わって I・Q の点が反対側へ移るたびに、位相が 180° ずれたと測る。データの無い信号（パイロット）に使う）';
        h+="<br>引き込んだ後、ロックする点が "+(q?"360°":"180°")+" 跳んだ回数: "+(st.pull>=0?(st.slip?'<span class="warn">'+st.slip+" 回</span>":"0 回"):"−")+(o.disc===0?"（コスタスでは 180° 違う点でもロックする。そのときはビットが全部反転して読め、プリアンブルで気づいて直す）":"");}
      ro.innerHTML=h+'<div class="wnote">P の I・Q は、振幅を √(2C) で割った値（周波数のずれによる sinc の倍率を含む）に、各成分の分散 1/{2(C/N0)T<sub>coh</sub>} の雑音を足した。T<sub>coh</sub> = 1 ms。FLL は 4 節の判別器と、1 次のループ（帯域 10 Hz）。2 次の PLL は減衰比 0.707、3 次の PLL は係数 1.1 と 2.4。受信機は 0.7 s から一定の加速度で動く。紫の帯は FLL が動いている時間。</div>';
    }
    run();
  };

  /* ---- 6 節: TTFF（手順の時間の帯 ↔ 受けたサブフレーム、1000 回のばらつき） ---- */
  /* P_d = 0.9・格子全体の誤警報 1 %（1 つの衛星のビンの数 10^L）に要る SNR [dB]。N は非コヒーレントに足す回数。刻みの損失の平均を含む（本文と同じ計算） */
  var _W05_REQ={N:[1,2,4,10,30,100,300,1000],L:[3,4,5,6,7,8],db:[[14.31,14.98,15.55,16.06,16.5,16.91],[11.83,12.46,13.0,13.47,13.89,14.28],[9.48,10.07,10.57,11.01,11.41,11.77],[6.58,7.11,7.57,7.97,8.33,8.66],[3.39,3.87,4.29,4.65,4.98,5.28],[0.2,0.65,1.03,1.37,1.66,1.93],[-2.51,-2.09,-1.72,-1.4,-1.12,-0.87],[-5.34,-4.93,-4.57,-4.27,-4.0,-3.75]]};
  function _w05_req(N,L){var r=_W05_REQ.db[_W05_REQ.N.indexOf(N)],x=Math.max(3,Math.min(8,L)),i=Math.min(4,Math.floor(x-3)),f=x-3-i;return r[i]+(r[i+1]-r[i])*f;}
  /* 1 つのビンの積分の候補: [コヒーレント積分の時間 T [ms], 足す回数 N] */
  var _W05_DW=[[1,1],[1,2],[1,4],[1,10],[10,1],[10,4],[10,10],[20,10],[20,30],[20,100],[20,300],[20,1000]];
  /* 受信機が持っているもの: 探す PRN の数・符号の位相のビンの数・ドップラーの範囲 ±fr [Hz]・データを読むか */
  var _W05_MODES=[{nm:"コールドスタート（何も無い）",prn:32,cp:2046,fr:6000,data:true},{nm:"ウォームスタート（アルマナック・時刻・位置）",prn:9,cp:2046,fr:800,data:true},
    {nm:"ホットスタート（有効なエフェメリスも）",prn:9,cp:2046,fr:500,data:false},{nm:"A-GNSS（時刻は秒の単位）",prn:9,cp:2046,fr:500,data:false},{nm:"A-GNSS（精密な時刻）",prn:9,cp:40,fr:500,data:false}];
  function _w05_nd(fr,T){return 2*Math.ceil(fr*2*T*1e-3-1e-9)+1;}   /* ±fr を 1/(2T) の刻みで覆うドップラーのビンの数（T は ms） */
  /* 要る SNR に 3 dB の余裕を足して届く組み合わせのうち、探す時間の最も短いもの */
  function _w05_dwell(m,cn0,eng){var c=Math.pow(10,cn0/10),best=null;
    _W05_DW.forEach(function(p){var T=p[0],N=p[1],nd=_w05_nd(m.fr,T),cells=m.prn*m.cp*nd,L=Math.log10(m.cp*nd),need=_w05_req(N,L)+3,have=10*Math.log10(c*T*1e-3);
      if(have>=need){var t=cells*T*N*1e-3/eng;if(!best||t<best.t)best={T:T,N:N,nd:nd,cells:cells,need:need,have:have,t:t};}});
    return best;}
  /* 1 回の TTFF（例の値の簡単なモデル）。st = [探す, 合わせる, ビット同期, エフェメリスを待つ, 位置を出す] */
  function _w05_ttff1(U,m,cn0,eng,ton,g){var dw=_w05_dwell(m,cn0,eng),st=[0,0,0,0,0],r={st:st,dw:dw,ton:ton,fail:null};
    if(!dw){r.fail="探しても見つからない（C/N0 が低すぎる）";return r;}
    st[0]=dw.t;st[1]=0.3;var c=Math.pow(10,cn0/10);
    if(!m.data){var tr2=st[0]+st[1],tt=ton+tr2;st[4]=Math.ceil(tt-1e-9)-tt;r.ttff=tr2+st[4];return r;}
    if(cn0<23){r.fail="PLL が追えず、データを読めない（23 dB-Hz より低い）";return r;}
    /* ビット同期: 1 s（50 bit）ごとに、境目の位置で符号が変わった回数（確率 1/2）と、ほかの 19 の位置の回数（雑音で変わる確率 pf）を足す */
    var pe=U.gnss.Q(Math.sqrt(2*c*1e-3)),pf=2*pe*(1-pe),cnt=new Float64Array(20),tb=0,j;
    for(var s=1;s<=60;s++){cnt[0]+=Math.max(0,Math.round(25+Math.sqrt(12.5)*g.normal()));for(j=1;j<20;j++)cnt[j]+=Math.max(0,Math.round(50*pf+Math.sqrt(50*pf*(1-pf))*g.normal()));
      var mx=0;for(j=1;j<20;j++)mx=Math.max(mx,cnt[j]);if(cnt[0]-mx>=5){tb=s;break;}}
    if(!tb){r.fail="60 s でビットの境目が決まらない";return r;}
    st[2]=tb;
    /* エフェメリス: 見えている 9 機のそれぞれで、サブフレーム 1〜3 を頭から受け、読み誤ったら 30 s 後の次を待つ。4 機目がそろった時刻 */
    var tr=st[0]+st[1]+st[2],t0=(ton+tr)%30,pb=U.gnss.Q(Math.sqrt(2*c*0.02)),pok=Math.pow(1-pb,300),sats=[],ends=[];
    for(var k=0;k<9;k++){var E=[],tries=[];for(var i=1;i<=3;i++){var s0=6*(i-1);while(s0<t0-1e-9)s0+=30;var n=0;while(true){var ok=g.next()<pok;tries.push([s0,ok,i]);n++;if(ok||n>=12)break;s0+=30;}E.push(s0+6);}
      var en=Math.max.apply(null,E);sats.push({tr:tries,end:en});ends.push(en);}
    ends.sort(function(a,b){return a-b;});st[3]=ends[3]-t0;r.t0=t0;r.tr=tr;r.sats=sats;r.pb=pb;r.pok=pok;r.ttff=tr+st[3];r.e4=ends[3];
    return r;}
  REG.w05_ttff=function(el,U){
    var S=U.S,SC=[["探す","gold"],["合わせる","purple"],["ビット同期","teal"],["エフェメリスを待つ","signal"],["位置を出す","green"]];
    U.head(el,"TIME TO FIRST FIX","TTFF — 手順ごとの時間と、受けたサブフレーム");
    var r1=U.ctrls(el);
    var md=U.select(r1,"電源を入れたときに受信機が持っているもの",_W05_MODES.map(function(m){return m.nm;}),0,run);
    var r2=U.ctrls(el);
    var cn=U.slider(r2,"C/N0（どの衛星も同じ）",{min:15,max:50,step:1,value:45,fmt:function(v){return v+" dB-Hz";},onInput:run});
    var en=U.slider(r2,"探す回路の大きさ",{values:[1000,4000,16000,64000],value:4000,fmt:function(v){return "同時に "+_w05_g(v,0)+" ビン";},onInput:run});
    var r3=U.ctrls(el);
    var on=U.slider(r3,"電源を入れた時刻（30 s のフレームの頭から）",{min:0,max:29.9,step:0.1,value:15,fmt:function(v){return _w05_f(v,1)+" s";},onInput:run});on.el.style.flex="1 1 100%";
    var br=U.btnrow(el),seed=1,R=null,H=null;
    U.button(br,"本文の例（コールドスタート・45 dB-Hz）",function(){md.set(0);cn.set(45);on.set(15);en.set(4000);run();});
    U.button(br,"1000 回くり返す",function(){rep();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){H=null;R=_w05_ttff1(U,_W05_MODES[md.get()],cn.get(),en.get(),on.get(),U.rng(seed*7+1));draw();}
    function rep(){var g=U.rng(seed*31+5),v=[],fail=0,m=_W05_MODES[md.get()];
      for(var i=0;i<1000;i++){var r=_w05_ttff1(U,m,cn.get(),en.get(),g.next()*30,g);if(r.fail)fail++;else v.push(r.ttff);}
      v.sort(function(a,b){return a-b;});var sm=0;v.forEach(function(x){sm+=x;});
      H={v:v,fail:fail,med:v.length?v[Math.floor(v.length/2)]:NaN,mean:v.length?sm/v.length:NaN,p95:v.length?v[Math.min(v.length-1,Math.floor(0.95*v.length))]:NaN,mode:md.get(),cn:cn.get(),eng:en.get()};draw();}
    function fT(t){return t<100?_w05_f(t,1)+" s":_w05_t(t);}
    function draw(){
      var m=_W05_MODES[md.get()],nar=_w05_nar(box),Wd=nar?400:700,s=[],x0=nar?58:92,w=nar?328:592,st=R.st,i,k;
      var tsum=st[0]+st[1]+st[2]+st[3]+st[4],tmax=R.fail?Math.max(10,(st[0]+st[1])*1.2):Math.max(m.data?40:3,tsum*1.08);
      var nt=U.nice(0,tmax,nar?4:7);tmax=Math.max(tmax,nt[nt.length-1]);
      function X(t){return x0+t/tmax*w;}
      s.push(S.T(nar?6:14,18,"(a) 手順ごとの時間"+(R.fail?"（位置が出ない）":"（TTFF "+fT(R.ttff)+"）"),"start",11,"ink",true));
      var t=0;for(i=0;i<5;i++){var d=st[i];if(d>0){s.push(S.RECT(X(t),32,Math.max(X(t+d)-X(t),1.5),22,2,U.soft(SC[i][1]),SC[i][1],1));if(X(t+d)-X(t)>U.tw(SC[i][0],9.5)+6)s.push(S.T((X(t)+X(t+d))/2,47,SC[i][0],"middle",9.5,SC[i][1],true));}t+=d;}
      if(R.fail)s.push(S.T(X(t)+6,47,R.fail,"start",9.5,"alias",true,false,null,true));
      s.push(S.L(x0,60,x0+w,60,"muted",1.1));
      nt.forEach(function(v){if(v>tmax+1e-9)return;s.push(S.L(X(v),60,X(v),64,"muted",1));s.push(S.T(X(v),76,U.sig(v,3),"middle",9.5,"muted"));});
      s.push(S.T(x0+w/2,92,"電源を入れてからの時間 [s]","middle",10,"muted"));
      var lx=nar?8:x0;SC.forEach(function(q){s.push(S.RECT(lx,101,12,10,2,U.soft(q[1]),q[1],1));s.push(S.T(lx+16,110,q[0],"start",9.5,"muted"));lx+=16+U.tw(q[0],9.5)+(nar?10:16);});
      var y=nar?134:138;
      /* (b) 受けたサブフレーム（データを読み始める少し前から、4 機目がそろった後までを、自分の時間の目盛で描く） */
      s.push(S.L(nar?6:10,y-10,Wd-(nar?6:10),y-10,"line",0.8));
      if(m.data&&R.sats){
        s.push(S.T(nar?6:14,y+6,"(b) 各衛星が受けたサブフレーム 1〜3（緑: 読めた、赤: 読み誤った）","start",11,"ink",true));
        var ta=Math.max(0,R.tr-3),tb=Math.max(ta+40,R.ttff+4),ton=R.ton,yf=y+32,nt2=U.nice(ta,tb,nar?4:7).filter(function(v){return v>=ta-1e-9&&v<=tb+1e-9;});
        var X2=function(u){return x0+(u-ta)/(tb-ta)*w;};
        s.push(S.T(x0-6,yf+9,"フレーム","end",9.5,"muted"));
        for(k=Math.floor((ton+ta)/6)*6;k-ton<tb;k+=6){var a=Math.max(ta,k-ton),b=Math.min(tb,k+6-ton),sn=(Math.round(k/6)%5)+1;if(b<=a)continue;
          s.push(S.RECT(X2(a),yf,X2(b)-X2(a),12,0,sn<=3?U.soft("signal"):"screen","line",0.7));if(X2(b)-X2(a)>10)s.push(S.T((X2(a)+X2(b))/2,yf+9.5,String(sn),"middle",8.5,sn<=3?"signal":"muted"));}
        var yz=yf+18+9*12;
        R.sats.forEach(function(q,j){var yy=yf+18+j*12;s.push(S.T(x0-6,yy+8,"衛星 "+(j+1),"end",9,"muted"));
          q.tr.forEach(function(p){var a2=p[0]-R.t0+R.tr,b2=Math.min(tb,a2+6);if(a2>=tb)return;s.push(S.RECT(X2(a2),yy,X2(b2)-X2(a2),9,1,U.soft(p[1]?"green":"alias"),p[1]?"green":"alias",0.8));});
          var ee=q.end-R.t0+R.tr;if(ee<=tb)s.push(S.L(X2(ee),yy-1,X2(ee),yy+10,"ink",1.6));});
        s.push(S.L(X2(R.tr),yf-4,X2(R.tr),yz,"teal",1.2,"3 2"));s.push(S.T(X2(R.tr)+3,yf-6,"読み始める","start",9,"teal",true,false,null,true));
        s.push(S.L(X2(R.ttff),yf-4,X2(R.ttff),yz,"green",1.6,"5 3"));s.push(S.T(X2(R.ttff)-3,yf-6,"4 機目がそろう","end",9,"green",true,false,null,true));
        s.push(S.L(x0,yz+2,x0+w,yz+2,"muted",1.1));
        nt2.forEach(function(v){s.push(S.L(X2(v),yz+2,X2(v),yz+6,"muted",1));s.push(S.T(X2(v),yz+18,U.sig(v,4),"middle",9.5,"muted"));});
        s.push(S.T(x0+w/2,yz+33,"電源を入れてからの時間 [s]（(a) と目盛が違う）","middle",10,"muted"));
        y=yz+54;}
      else{s.push(S.T(nar?6:14,y+6,"(b) サブフレーム","start",11,"ink",true));
        s.push(S.T(nar?6:14,y+24,R.fail?"位置が出ないので、描かない":"エフェメリスは持っている（A-GNSS なら通信で受け取る）ので、サブフレームを待たない","start",9.5,"muted"));y+=40;}
      /* (c) 1000 回のばらつき */
      s.push(S.L(nar?6:10,y-6,Wd-(nar?6:10),y-6,"line",0.8));
      if(H&&H.v.length){var lo0=H.v[0],hi0=H.v[H.v.length-1],sp=Math.max(1e-3,hi0-lo0),bw=[0.05,0.1,0.25,0.5,1,2,5,10,20,50,100,200,500,1000,2000,5000,10000].filter(function(q){return q>=sp/40;})[0]||20000;
        var lo=Math.floor(lo0/bw)*bw,nb=Math.max(1,Math.ceil((hi0-lo)/bw+1e-9)),hi=lo+nb*bw,cnts=new Array(nb).fill(0),cm=0;
        H.v.forEach(function(v){var b=Math.min(nb-1,Math.floor((v-lo)/bw));cnts[b]++;});cnts.forEach(function(c){cm=Math.max(cm,c);});
        var P=U.plot(x0,y+26,w,96,[lo,hi],[0,cm*1.15]);
        s.push(S.T(nar?6:14,y+10,"(c) 1000 回の TTFF（電源を入れる時刻と雑音を変えた）","start",11,"ink",true));
        s.push(P.axes({xt:U.nice(lo,hi,nar?4:7).filter(function(v){return v>=lo-1e-9&&v<=hi+1e-9;}),yt:U.nice(0,cm*1.15,3).filter(function(v){return v<=cm*1.15;}),xfmt:function(v){return U.sig(v,4);},yfmt:function(v){return String(v);},xl:"TTFF [s]",yl:"回数",ylOff:36}));
        cnts.forEach(function(c,b){if(c>0)s.push(S.RECT(P.X(lo+b*bw)+0.5,P.Y(c),Math.max(1,P.X(lo+(b+1)*bw)-P.X(lo+b*bw)-1),P.Y(0)-P.Y(c),0,U.soft("signal"),"signal",0.8));});
        s.push(S.L(P.X(H.med),P.y,P.X(H.med),P.y+P.h,"gold",1.6,"4 3"));s.push(S.T(P.X(H.med)+3,P.y+10,"中央値","start",9.5,"gold",true,false,null,true));
        y=P.y+P.h+42;}
      else{s.push(S.T(nar?6:14,y+12,"(c) 「1000 回くり返す」を押すと、TTFF のばらつきを描く","start",10,"muted"));y+=20;}
      box.set(S.svg(Wd,y,s));
      /* 読み出し */
      var dw=R.dw,h="",frs=m.fr>=1000?_w05_f(m.fr/1000,0)+" kHz":m.fr+" Hz";
      if(dw){h+="探す格子: "+m.prn+" 機 × "+m.cp+" × "+dw.nd+"（符号の位相"+(m.cp<1000?"は ±10 チップを 1/2 チップごと":"は 1/2 チップごと")+"、ドップラーは ±"+frs+" を 1/(2T<sub>coh</sub>) ごと）= <b>"+_w05_g(dw.cells,0)+"</b> ビン";
        h+="<br>1 つのビン: "+dw.T+" ms のコヒーレント積分"+(dw.N>1?"の電力を "+dw.N+" 回足す（合わせて "+_w05_g(dw.T*dw.N,0)+" ms）":"")+"。要る SNR "+_w05_f(dw.need,1)+" dB（P<sub>d</sub> = 0.9・格子全体の誤警報 1 %・3 dB の余裕）に対し、1 回の SNR "+_w05_f(dw.have,1)+" dB";
        h+="<br>探す時間: "+_w05_g(dw.cells,0)+" × "+_w05_g(dw.T*dw.N,0)+" ms ÷ "+_w05_g(en.get(),0)+" = <b>"+_w05_t(dw.t)+"</b>。合わせる 0.3 s（FLL・PLL）";}
      else h+='<span class="warn">表のどの積分の組み合わせ（最も長いのは 20 ms × 1000 回）でも、要る SNR に届かない</span>';
      if(!R.fail&&m.data){h+="、ビット同期 "+_w05_f(st[2],0)+" s";
        h+="<br>データを読み始めた時刻: フレームの頭から "+_w05_f(R.t0,2)+" s → 4 機目のサブフレーム 1〜3 がそろうまで <b>"+fT(st[3])+"</b>（読み誤りが無ければ "+_w05_f(_w05_teph(R.t0),2)+" s）";
        h+="<br>1 つのサブフレームを全部正しく読む確率 (1 − P<sub>b</sub>)<sup>300</sup> = "+_w05_f(R.pok,3)+"（P<sub>b</sub> = Q(√(2(C/N0) × 20 ms)) "+(R.pb<1e-10?"は 10⁻¹⁰ より小さい":"= "+_w05_sci(R.pb,1))+"）";}
      if(!R.fail&&!m.data)h+="<br>エフェメリスは待たない。HOW も待たずに擬似距離を作り、次の 1 s の区切りで位置を出す（"+_w05_f(st[4],2)+" s 後）";
      if(R.fail&&dw)h+='<br><span class="warn">'+R.fail+"</span>";else if(!R.fail)h+="<br>TTFF = <b>"+fT(R.ttff)+"</b>";
      if(H)h+="<br>1000 回（"+_W05_MODES[H.mode].nm.replace(/（.*）/,"")+"・"+H.cn+" dB-Hz）: "+(H.v.length?"中央値 <b>"+fT(H.med)+"</b>、平均 "+fT(H.mean)+"、95 % が "+fT(H.p95)+" 以内":"")+(H.fail?'（<span class="warn">位置が出なかった '+H.fail+" 回</span>）":"");
      ro.innerHTML=h+'<div class="wnote">どれも例の値の簡単なモデル。見えている衛星は 9 機（どれも同じ C/N0）で、4 機目のエフェメリスがそろったら位置を出す。探す時間は、格子の全部を探す時間とした。1 つのビンの積分は、表の組み合わせ（1 ms × 1〜10 回、10 ms × 1〜10 回、20 ms × 10〜1000 回）のうち、要る SNR に 3 dB を足して届く中で最も速いもの（ビットの境目の損失は入れていない）。ビット同期は、1 s ごとに、境目の位置の回数がほかのどの位置より 5 回以上多いかを調べる。C/N0 が 23 dB-Hz（4 節の目安で、10 ms・10 Hz の PLL）より低いとデータを読めないとした。</div>';
    }
    run();
  };
  /* エフェメリスを待つ時間（読み誤りが無いとき。5 節の導出） */
  function _w05_teph(t0){var e=0;for(var i=1;i<=3;i++){var s=6*(i-1);while(s<t0-1e-9)s+=30;e=Math.max(e,s+6);}return e-t0;}

  /* ===== 06 章 位置を解く ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w06_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w06_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた数（−3 959 694.8 など） */
  function _w06_g(v,d){var s=_w06_f(v,d),neg=s.charAt(0)==="−";if(neg)s=s.slice(1);var p=s.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return (neg?"−":"")+i+(p.length>1?"."+p[1]:"");}
  /* 長さ [m] を読みやすい単位で */
  function _w06_len(m){var a=Math.abs(m);if(!isFinite(a))return "∞";if(a>=1e5)return _w06_g(m/1e3,1)+" km";if(a>=1e3)return _w06_f(m/1e3,2)+" km";if(a>=1)return _w06_f(m,2)+" m";
    if(a>=1e-3)return _w06_f(m*1e3,2)+" mm";if(a>=1e-6)return _w06_f(m*1e6,2)+" μm";return "1 μm 未満";}
  var _W06_C=299792458,_W06_D=Math.PI/180,_W06_WE=7.2921151467e-5,_W06_LAM=299792458/1575.42e6,_W06_GEO=null;
  var _W06_N4=["G9","G6","G2","G3"],_W06_CL4=["G6","G13","G3","G9"];
  /* 東京から時刻 t に見える GPS の衛星（仰角の高い順）。enu は視線の単位ベクトルの東・北・上の成分、l は ECEF の成分 */
  function _w06_sky(U,t){var rx=U.gnss.rx(35.681,139.767,40),out=[];
    U.gnss.constellation().forEach(function(s){if(s.sys!=="GPS")return;var p=U.gnss.ecef(s,t),ea=U.gnss.elaz(rx,p);
      if(ea[0]>0)out.push({nm:s.nm,s:s,p:p,el:ea[0],az:ea[1],d:ea[2],enu:[ea[3]/ea[2],ea[4]/ea[2],ea[5]/ea[2]],l:[(p[0]-rx.r0[0])/ea[2],(p[1]-rx.r0[1])/ea[2],(p[2]-rx.r0[2])/ea[2]]});});
    out.sort(function(a,b){return b.el-a.el;});return {rx:rx,sats:out};}
  function _w06_geo(U){if(!_W06_GEO)_W06_GEO=_w06_sky(U,0);return _W06_GEO;}
  /* 東京の ENU の行列（行が東・北・上） */
  function _w06_renu(B,L){B*=_W06_D;L*=_W06_D;return [[-Math.sin(L),Math.cos(L),0],[-Math.sin(B)*Math.cos(L),-Math.sin(B)*Math.sin(L),Math.cos(B)],[Math.cos(B)*Math.cos(L),Math.cos(B)*Math.sin(L),Math.sin(B)]];}
  /* 重み付き最小二乗の行列 A = (GᵀWG)⁻¹GᵀW（n×m）。G は m 行 n 列、w は重み。解けないとき（並びが悪いとき）は null */
  function _w06_lsA(U,G,w){var m=G.length,n=G[0].length,M=U.ctl.mat,N=M.zeros(n,n),Gt=M.zeros(n,m),i,j,k;
    for(i=0;i<m;i++)for(j=0;j<n;j++)Gt[j][i]=G[i][j]*w[i];
    for(j=0;j<n;j++)for(k=0;k<n;k++){var sm=0;for(i=0;i<m;i++)sm+=Gt[j][i]*G[i][k];N[j][k]=sm;}
    var A;try{A=M.solve(N,Gt);}catch(e){return null;}
    for(j=0;j<n;j++)for(i=0;i<m;i++)if(!isFinite(A[j][i])||Math.abs(A[j][i])>1e6)return null;
    return A;}
  /* A と誤差の標準偏差から、回数を十分に増やしたときの解の誤差の RMS [水平, 上下]（A の行は東・北・上・時計） */
  function _w06_th(A,sig){var q=[0,0,0];for(var r=0;r<3;r++){var sm=0;for(var i=0;i<sig.length;i++)sm+=A[r][i]*A[r][i]*sig[i]*sig[i];q[r]=sm;}return [Math.sqrt(q[0]+q[1]),Math.sqrt(q[2])];}
  /* 衛星の印（図と同じ見た目） */
  function _w06_sat(U,x,y,c,s){var S=U.S;s=s||1;return S.L(x-9*s,y,x+9*s,y,c,1.1)+S.RECT(x-14*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x+7.5*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x-3.6*s,y-3.6*s,7.2*s,7.2*s,1.5,c,c,1);}
  function _w06_rxm(U,x,y,c){var S=U.S;c=c||"green";return S.L(x-6,y+6,x+6,y+6,c,1.6)+S.L(x,y+6,x,y,c,1.4)+S.D(x,y-1,c,3.4);}
  /* 10 のべきの目盛の文字 */
  function _w06_pow(v){var e=Math.round(Math.log10(v));if(e===0)return "1";var sup={"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","-":"⁻"};return "10"+String(e).split("").map(function(c){return sup[c];}).join("");}

  /* ---- 3 節: 衛星の数・並び・重みで変わる解の散らばり（スカイプロット ↔ 散らばり） ---- */
  REG.w06_ls=function(el,U){
    var S=U.S,GE=_w06_geo(U),SATS=GE.sats;
    U.head(el,"LEAST SQUARES","衛星の数・並び・重みで変わる解の散らばり");
    var r1=U.ctrls(el);
    var pre=U.select(r1,"使う衛星",["1 章の 4 つ（G9・G6・G2・G3）","見えている 8 つ","偏った 4 つ（G6・G13・G3・G9）","自分で選ぶ（スカイプロットの点を押す）"],0,function(){setPre();draw();});
    var mdl=U.select(r1,"擬似距離の誤差",["どの衛星も同じ σ","仰角で変える σ₀/sin θ"],0,function(){draw();});
    var r2=U.ctrls(el);
    var sg=U.slider(r2,"σ（仰角で変えるときは真上の値 σ₀）",{values:[0.5,1,2,5],value:1,fmt:function(v){return v+" m";},onInput:function(){draw();}});
    var nt=U.slider(r2,"解く回数",{values:[200,1000,5000],value:1000,fmt:function(v){return v+" 回";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cU=U.checkbox(r3,"重みなしの解（赤）",true,function(){draw();}),cW=U.checkbox(r3,"重み 1/σ² の解（緑）",true,function(){draw();});
    var br=U.btnrow(el),use={},seed=1,SK=null;
    U.button(br,"本文の例（1 章の 4 つ・同じ 1 m）",function(){pre.set(0);mdl.set(0);sg.set(1);nt.set(1000);cU.set(true);cW.set(true);seed=1;setPre();draw();});
    U.button(br,"重みの例（8 つ・仰角で変える）",function(){pre.set(1);mdl.set(1);sg.set(1);nt.set(1000);cU.set(true);cW.set(true);seed=1;setPre();draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function setPre(){var k=pre.get();if(k===3)return;var L=k===0?_W06_N4:(k===2?_W06_CL4:SATS.map(function(q){return q.nm;}));use={};L.forEach(function(n){use[n]=true;});}
    setPre();
    U.ctl.drag(box,function(type,x,y){if(type!=="down"||!SK)return false;var best=null,bd=18;
      SK.forEach(function(q){var d=Math.hypot(q.x-x,q.y-y);if(d<bd){bd=d;best=q.nm;}});
      if(best){use[best]=!use[best];pre.set(3);draw();}return false;});
    function nice(v){var c=[2,5,10,25,50,100,250,500,1000];for(var i=0;i<c.length;i++)if(c[i]>=v)return c[i];return 1000;}
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],act=SATS.filter(function(q){return use[q.nm];}),m=act.length,s0=sg.get(),elm=mdl.get()===1;
      var sig=act.map(function(q){return elm?s0/Math.sin(q.el*_W06_D):s0;});
      var G=act.map(function(q){return [-q.enu[0],-q.enu[1],-q.enu[2],1];});
      var Au=m>=4?_w06_lsA(U,G,act.map(function(){return 1;})):null,Aw=m>=4?_w06_lsA(U,G,sig.map(function(s){return 1/(s*s);})):null;
      /* ---- スカイプロット（押して切り替える） ---- */
      var cx=nar?200:128,cy=nar?140:150,R=nar?100:102;
      o.push(S.T(nar?10:14,18,"空の衛星（押すと使う・使わないが切り替わる）","start",10.5,"ink",true));
      var pts=SATS.map(function(q){return {el:q.el,az:q.az,name:q.nm,col:use[q.nm]?"purple":"faint",hl:!!use[q.nm]};});
      o.push(U.gnss.sky(U,cx,cy,R,pts,{dot:4.6}));
      SK=SATS.map(function(q){var p=U.gnss.skyxy(cx,cy,R,q.el,q.az);return {x:p[0],y:p[1],nm:q.nm};});
      o.push(S.T(cx,cy+R+34,"使う衛星: "+m+" 個","middle",10,m>=4?"purple":"alias",true));
      /* ---- 散らばり ---- */
      var rng=U.rng(seed*7919+17),N=nt.get(),su=[0,0],sw=[0,0],PU=[],PW=[];
      var thU=Au?_w06_th(Au,sig):null,thW=Aw?_w06_th(Aw,sig):null;
      if(Au&&Aw){for(var t=0;t<N;t++){var e=sig.map(function(s){return s*rng.normal();});
        var xu=[0,0,0],xw=[0,0,0];for(var r=0;r<3;r++){var a=0,b=0;for(var i=0;i<m;i++){a+=Au[r][i]*e[i];b+=Aw[r][i]*e[i];}xu[r]=a;xw[r]=b;}
        su[0]+=xu[0]*xu[0]+xu[1]*xu[1];su[1]+=xu[2]*xu[2];sw[0]+=xw[0]*xw[0]+xw[1]*xw[1];sw[1]+=xw[2]*xw[2];
        if(t<400){PU.push(xu);PW.push(xw);}}}
      var rU=[Math.sqrt(su[0]/N),Math.sqrt(su[1]/N)],rW=[Math.sqrt(sw[0]/N),Math.sqrt(sw[1]/N)];
      var px=nar?52:282,py=nar?300:38,pw=nar?230:220;
      var hmax=0,vmax=0;if(thU&&cU.get()){hmax=Math.max(hmax,thU[0]);vmax=Math.max(vmax,thU[1]);}if(thW&&cW.get()){hmax=Math.max(hmax,thW[0]);vmax=Math.max(vmax,thW[1]);}
      var lim=nice(Math.max(2,2.6*hmax)),limv=nice(Math.max(2,2.6*vmax));
      o.push(S.T(px,py-12,"東西と南北の誤差 [m]（点は 400 回分）","start",10,"ink",true));
      var P=U.plot(px,py,pw,pw,[-lim,lim],[-lim,lim]);
      o.push(S.RECT(px,py,pw,pw,3,"var(--screen)","line",1));
      o.push(P.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9}));
      if(Au&&Aw){
        if(cU.get())PU.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"alias",1.4));});
        if(cW.get())PW.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"green",1.4));});
      }else o.push(S.T(px+pw/2,py+pw/2,m<4?"衛星が 4 つより少ないので解けない":"この並びでは解けない（G に逆行列が無い）","middle",10,"alias",true,false,null,true));
      o.push(S.L(P.X(0)-6,P.Y(0),P.X(0)+6,P.Y(0),"ink",2));o.push(S.L(P.X(0),P.Y(0)-6,P.X(0),P.Y(0)+6,"ink",2));
      o.push(S.T(px+pw/2,py+pw+30,"十字: 本当の位置","middle",9,"muted"));
      /* 上下の誤差（縦の帯） */
      var vx=px+pw+(nar?24:38),vw=nar?70:90,Q=U.plot(vx,py,vw,pw,[0,1],[-limv,limv]);
      o.push(S.T(vx+vw/2,py-12,"上下 [m]","middle",10,"ink",true));
      o.push(S.RECT(vx,py,vw,pw,3,"var(--screen)","line",1));
      [-limv,-limv/2,0,limv/2,limv].forEach(function(v){o.push(S.L(vx,Q.Y(v),vx+vw,Q.Y(v),"grid",1));o.push(S.T(vx+vw+4,Q.Y(v)+3,_w06_f(v,v%1?1:0),"start",8.5,"muted"));});
      if(Au&&Aw){var jr=U.rng(seed+99);
        if(cU.get())PU.forEach(function(q){if(Math.abs(q[2])<limv)o.push(S.D(vx+vw*(0.08+0.36*jr.next()),Q.Y(q[2]),"alias",1.3));});
        if(cW.get())PW.forEach(function(q){if(Math.abs(q[2])<limv)o.push(S.D(vx+vw*(0.56+0.36*jr.next()),Q.Y(q[2]),"green",1.3));});}
      o.push(S.L(vx,Q.Y(0),vx+vw,Q.Y(0),"ink",1.4));
      var Hh=nar?py+pw+46:Math.max(cy+R+46,py+pw+40);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し ---- */
      var h="使う衛星: "+(m?act.map(function(q){return q.nm;}).join("・"):"なし")+"（"+m+" 個）<br>";
      if(Au&&Aw){
        var rows=[];
        if(cU.get())rows.push(['<span style="color:'+U.col("alias")+'"><b>重みなし</b></span>',_w06_f(rU[0],2)+" m",_w06_f(rU[1],2)+" m","<b>"+_w06_f(thU[0],2)+" m・"+_w06_f(thU[1],2)+" m</b>"]);
        if(cW.get())rows.push(['<span style="color:'+U.col("green")+'"><b>重み 1/σ²</b></span>',_w06_f(rW[0],2)+" m",_w06_f(rW[1],2)+" m","<b>"+_w06_f(thW[0],2)+" m・"+_w06_f(thW[1],2)+" m</b>"]);
        h+=U.tbl(["解","水平の RMS（"+N+" 回）","上下の RMS（"+N+" 回）","回数を十分に増やしたとき（水平・上下）"],rows,["left","right","right","right"]);
        h+="誤差の標準偏差 σ: "+act.map(function(q,i){return q.nm+" "+_w06_f(sig[i],2)+" m";}).join("、");
        if(m===4)h+='<br>衛星が 4 つのときは、重みを変えても解は同じ（4 つの式をちょうど満たす解が 1 つだけある）。';
      }else h+='<span class="warn">'+(m<4?"衛星を 4 つ以上選ぶと解ける。":"選んだ衛星の並びでは、G に逆行列が無く解けない。")+'</span>';
      ro.innerHTML=h+'<div class="wnote">解は、本当の位置のまわりで線形化した式を最小二乗法で解いたもの（4 節の繰り返しの最後の 1 回と同じ）。誤差は正規分布にしたがい、衛星どうしで独立とした。「回数を十分に増やしたとき」の値は、誤差の分散から計算した値（計算の方法は 7 章）。衛星の配置は 1 章の近似の配置の時刻 0。</div>';
    }
    draw();
  };

  /* ---- 4 節: ガウス・ニュートン法を 1 回ずつ進める（平面の例と東京の例） ---- */
  var _W06_PS=[[-12,9],[5,12],[15,8]],_W06_PB=3.0;
  function _w06_rotz(p,th){return [p[0]*Math.cos(th)+p[1]*Math.sin(th),-p[0]*Math.sin(th)+p[1]*Math.cos(th),p[2]];}
  REG.w06_solve=function(el,U){
    var S=U.S,GE=_w06_geo(U),RX=GE.rx.r0,BT=_W06_C*1e-3,UH=[Math.cos(139.767*_W06_D),Math.sin(139.767*_W06_D),0];
    U.head(el,"GAUSS–NEWTON","仮の値から 1 回ずつ進めるガウス・ニュートン法");
    var r1=U.ctrls(el);
    var md=U.select(r1,"例",["平面の例（1 章の 3 つの点。未知数 x・y・b）","東京の例（3 次元。未知数 x・y・z・b）"],0,function(){showCtl();reset();draw();});
    var ns=U.select(r1,"衛星（東京の例）",["1 章の 4 つ","見えている 8 つ"],0,function(){reset();draw();});
    var rot=U.select(r1,"地球の自転（東京の例）",["考えない（本文の表と同じ）","擬似距離に含め、直す","擬似距離に含め、直さない"],0,function(){reset();draw();});
    var r2=U.ctrls(el);
    var pX=U.slider(r2,"初めの位置 x",{min:-20,max:20,step:0.5,value:-8,fmt:function(v){return _w06_f(v,1)+" km";},onInput:function(){reset();draw();}});
    var pY=U.slider(r2,"初めの位置 y",{min:-10,max:24,step:0.5,value:-6,fmt:function(v){return _w06_f(v,1)+" km";},onInput:function(){reset();draw();}});
    var eS=U.slider(r2,"初めの位置（東京の経度の向き）",{min:-32000,max:32000,step:500,value:0,fmt:function(v){return _w06_g(v,0)+" km";},onInput:function(){reset();draw();}});
    var eZ=U.slider(r2,"初めの位置（z）",{min:-32000,max:32000,step:500,value:0,fmt:function(v){return _w06_g(v,0)+" km";},onInput:function(){reset();draw();}});
    var br=U.btnrow(el);
    U.button(br,"1 回進める",function(){step();draw();});
    U.button(br,"最後まで",function(){for(var i=0;i<40&&st==="run";i++)step();draw();});
    U.button(br,"初めに戻す",function(){reset();draw();});
    U.button(br,"本文の例",function(){if(md.get()===0){pX.set(-8);pY.set(-6);}else{ns.set(0);rot.set(0);eS.set(0);eZ.set(0);}reset();draw();});
    U.button(br,"悪い例（遠くから始める）",function(){if(md.get()===0){pX.set(0);pY.set(20);}else{eS.set(-20000);eZ.set(0);}reset();draw();});
    var box=U.svgbox(el),ro=U.readout(el),hist=[],info=[],st="run",MP=null;
    function showCtl(){var p=md.get()===0;pX.el.style.display=p?"":"none";pY.el.style.display=p?"":"none";eS.el.style.display=p?"none":"";eZ.el.style.display=p?"none":"";ns.el.style.display=p?"none":"";rot.el.style.display=p?"none":"";}
    showCtl();
    /* 東京の例の衛星: 送った時刻の ECEF の位置と、擬似距離 */
    function sats3(){var L=ns.get()===0?_W06_N4:GE.sats.map(function(q){return q.nm;}),R=rot.get(),out=[];
      GE.sats.forEach(function(q){if(L.indexOf(q.nm)<0)return;
        if(R===0){out.push({nm:q.nm,ptx:q.p,rho:Math.hypot(q.p[0]-RX[0],q.p[1]-RX[1],q.p[2]-RX[2])+BT});return;}
        var tau=0.07,ptx,prx;for(var k=0;k<6;k++){ptx=U.gnss.ecef(q.s,-tau);prx=_w06_rotz(ptx,_W06_WE*tau);tau=Math.hypot(prx[0]-RX[0],prx[1]-RX[1],prx[2]-RX[2])/_W06_C;}
        out.push({nm:q.nm,ptx:ptx,rho:tau*_W06_C+BT});});
      return out;}
    var SS=null;
    function reset(){st="run";info=[];if(md.get()===0){hist=[[pX.get(),pY.get(),0]];}else{SS=sats3();var s=eS.get()*1e3,z=eZ.get()*1e3;hist=[[s*UH[0],s*UH[1],z,0]];}}
    function step(){if(st!=="run")return;var x=hist[hist.length-1],dx,G=[],dr=[],i,rr;
      if(md.get()===0){
        _W06_PS.forEach(function(p){var d=[p[0]-x[0],p[1]-x[1]],r=Math.hypot(d[0],d[1]);G.push([-d[0]/r,-d[1]/r,1]);dr.push(Math.hypot(p[0],p[1])+_W06_PB-(r+x[2]));});
        var A=_w06_lsA(U,G,[1,1,1]);if(!A){st="sing";return;}
        dx=[0,0,0];for(var j=0;j<3;j++)for(i=0;i<3;i++)dx[j]+=A[j][i]*dr[i];
        var xn=[x[0]+dx[0],x[1]+dx[1],x[2]+dx[2]];hist.push(xn);
        info.push({dp:Math.hypot(dx[0],dx[1])*1e3,rms:Math.sqrt(dr.reduce(function(a,b){return a+b*b;},0)/3)*1e3});
        if(!isFinite(xn[0])||Math.hypot(xn[0],xn[1])>1e4)st="div";else if(Math.hypot(dx[0],dx[1])<1e-6)st="done";
      }else{
        var R=rot.get();
        SS.forEach(function(q){var p=q.ptx;if(R===1){var tau=Math.hypot(p[0]-x[0],p[1]-x[1],p[2]-x[2])/_W06_C;p=_w06_rotz(p,_W06_WE*tau);}
          var d=[p[0]-x[0],p[1]-x[1],p[2]-x[2]];rr=Math.hypot(d[0],d[1],d[2]);G.push([-d[0]/rr,-d[1]/rr,-d[2]/rr,1]);dr.push(q.rho-(rr+x[3]));});
        var A2=_w06_lsA(U,G,G.map(function(){return 1;}));if(!A2){st="sing";return;}
        dx=[0,0,0,0];for(var j2=0;j2<4;j2++)for(i=0;i<G.length;i++)dx[j2]+=A2[j2][i]*dr[i];
        var xn2=[x[0]+dx[0],x[1]+dx[1],x[2]+dx[2],x[3]+dx[3]];hist.push(xn2);
        info.push({dp:Math.hypot(dx[0],dx[1],dx[2]),rms:Math.sqrt(dr.reduce(function(a,b){return a+b*b;},0)/G.length)});
        if(!isFinite(xn2[0])||Math.hypot(xn2[0],xn2[1],xn2[2])>1e9)st="div";else if(Math.hypot(dx[0],dx[1],dx[2])<1e-3)st="done";
      }
      if(hist.length>40&&st==="run")st="slow";}
    /* 位置の誤差 [m] */
    function perr(x){return md.get()===0?Math.hypot(x[0],x[1])*1e3:Math.hypot(x[0]-RX[0],x[1]-RX[1],x[2]-RX[2]);}
    U.ctl.drag(box,function(type,x,y){if(!MP||x==null)return type==="down"?false:undefined;
      if(x<MP.x||x>MP.x+MP.w||y<MP.y||y>MP.y+MP.h)return type==="down"?false:undefined;
      if(type==="up")return;var u=MP.ux(x),v=MP.uy(y);
      if(md.get()===0){pX.set(Math.max(-20,Math.min(20,Math.round(u*2)/2)));pY.set(Math.max(-10,Math.min(24,Math.round(v*2)/2)));}
      else{eS.set(Math.max(-32000,Math.min(32000,Math.round(u/500)*500)));eZ.set(Math.max(-32000,Math.min(32000,Math.round(v/500)*500)));}
      reset();draw();});
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],P,k,x=hist[hist.length-1],K=hist.length-1;
      if(md.get()===0){
        /* ---- 平面の例: 円・接線・仮の位置の動き ---- */
        var pw=nar?380:380,ph=pw*35/42;P=U.plot(nar?10:14,26,pw,ph,[-21,21],[-10,25]);MP=P;
        o.push(S.T(nar?10:14,16,"平面（単位 km）。図の上を押すと、そこを初めの位置にする","start",10,"ink",true));
        o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));
        for(var g=-20;g<=25;g+=5){if(g>=-21&&g<=21)o.push(S.L(P.X(g),P.y,P.X(g),P.y+P.h,"grid",1));if(g>=-10&&g<=25)o.push(S.L(P.x,P.Y(g),P.x+P.w,P.Y(g),"grid",1));}
        var bh=x[2],clip='<clipPath id="w06cp"><rect x="'+P.x+'" y="'+P.y+'" width="'+P.w+'" height="'+P.h+'"/></clipPath>',body=[];
        _W06_PS.forEach(function(p,i){var R0=Math.hypot(p[0],p[1])+_W06_PB-bh;if(R0>0){var cc=[];for(var a=0;a<=120;a++){var t=2*Math.PI*a/120;cc.push([P.X(p[0]+R0*Math.cos(t)),P.Y(p[1]+R0*Math.sin(t))]);}body.push(S.PL(cc,"signal",1.1));}});
        if(K>0){var xp=hist[K-1];
          _W06_PS.forEach(function(p){var d=[p[0]-xp[0],p[1]-xp[1]],r=Math.hypot(d[0],d[1]),l=[d[0]/r,d[1]/r],R0=Math.hypot(p[0],p[1])+_W06_PB-x[2];
            var q=[p[0]-l[0]*R0,p[1]-l[1]*R0],tt=[-l[1],l[0]];body.push(S.L(P.X(q[0]-tt[0]*60),P.Y(q[1]-tt[1]*60),P.X(q[0]+tt[0]*60),P.Y(q[1]+tt[1]*60),"gold",1.3,"6 3"));
            body.push(S.L(P.X(xp[0]),P.Y(xp[1]),P.X(p[0]),P.Y(p[1]),"faint",0.9,"2 3"));});}
        var path=hist.map(function(h){return [P.X(h[0]),P.Y(h[1])];});
        body.push(S.PL(path,"gold",1.4,null,"3 2"));
        hist.forEach(function(h,i){body.push(S.D(P.X(h[0]),P.Y(h[1]),"gold",i===K?4.6:3));});
        o.push(clip+'<g clip-path="url(#w06cp)">'+body.join("")+'</g>');
        _W06_PS.forEach(function(p,i){o.push(_w06_sat(U,P.X(p[0]),P.Y(p[1]),"purple",0.7));o.push(S.T(P.X(p[0]),P.Y(p[1])-8,"S"+(i+1),"middle",9.5,"purple",true,false,null,true));});
        o.push(_w06_rxm(U,P.X(0),P.Y(0)-2));
        if(Math.abs(hist[0][0])<=21&&hist[0][1]>=-10&&hist[0][1]<=25)o.push(S.T(P.X(hist[0][0])+7,P.Y(hist[0][1])+13,"初め","start",9,"gold",true,false,null,true));
        o.push(S.LEGL(P.x,P.y+P.h+16,[["signal",null,"半径 ρ_i − b̂ の円"],["gold","6 3","接線（1 次の式）"]],9.5,14));
      }else{
        /* ---- 東京の例: 子午線を含む面 ---- */
        var pw2=nar?380:330;P=U.plot(nar?10:14,26,pw2,pw2,[-32000,32000],[-32000,32000]);MP=P;
        o.push(S.T(nar?10:14,16,"子午線を含む面（単位 km）。押すと初めの位置にする","start",10,"ink",true));
        o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));
        o.push(S.CIRC(P.X(0),P.Y(0),P.X(26560)-P.X(0),"purple",1,null,"4 3"));
        o.push(S.CIRC(P.X(0),P.Y(0),P.X(6371)-P.X(0),"green",1.3,"var(--green-soft)"));
        function mer(p){return [(p[0]*UH[0]+p[1]*UH[1])/1e3,p[2]/1e3];}
        SS.forEach(function(q){var m=mer(q.ptx);o.push(_w06_sat(U,P.X(m[0]),P.Y(m[1]),"purple",0.55));});
        var tk=mer(RX);o.push(_w06_rxm(U,P.X(tk[0]),P.Y(tk[1])-2));
        var body2=[],pth=[];hist.forEach(function(h){var m=mer(h);pth.push([P.X(Math.max(-60000,Math.min(60000,m[0]))),P.Y(Math.max(-60000,Math.min(60000,m[1])))]);});
        body2.push(S.PL(pth,"gold",1.4,null,"3 2"));hist.forEach(function(h,i){var m=mer(h);body2.push(S.D(P.X(m[0]),P.Y(m[1]),"gold",i===K?4.6:3));});
        o.push('<clipPath id="w06cp2"><rect x="'+P.x+'" y="'+P.y+'" width="'+P.w+'" height="'+P.h+'"/></clipPath><g clip-path="url(#w06cp2)">'+body2.join("")+'</g>');
        var m0=mer(hist[0]);if(Math.abs(m0[0])<=32000&&Math.abs(m0[1])<=32000)o.push(S.T(P.X(m0[0])+7,P.Y(m0[1])+13,"初め","start",9,"gold",true,false,null,true));
        o.push(S.T(P.x+4,P.y+P.h-6,"緑: 地球、紫の破線: GPS の軌道の半径、紫の印: 衛星（面に投影）","start",8.5,"muted",false,false,null,true));
      }
      /* ---- 誤差の減り方 ---- */
      var qx=nar?60:(md.get()===0?440:400),qy=nar?(P.y+P.h+(md.get()===0?64:36)):40,qw=nar?310:(Wd-qx-20),qh=nar?170:200;
      var Q=U.plot(qx,qy,qw,qh,[0,10],[1e-9,1e8],{ylog:true});
      o.push(S.T(qx-30,qy-14,"位置の誤差 [m]","start",10,"ink",true));
      o.push(Q.axes({xl:"繰り返した回数 k",xt:[0,2,4,6,8,10],yt:[1e-9,1e-6,1e-3,1,1e3,1e6],yfmt:_w06_pow,sz:9}));
      o.push(S.L(qx,Q.Y(1e-3),qx+qw,Q.Y(1e-3),"purple",1,"4 3"));o.push(S.T(qx+qw-3,Q.Y(1e-3)-4,"1 mm","end",9,"purple",false,false,null,true));
      var ep=hist.map(function(h,i){return [i,Math.max(2e-9,Math.min(5e8,perr(h)))];}).filter(function(q){return q[0]<=10;});
      o.push(Q.clip(ep,"gold",2));ep.forEach(function(q){o.push(S.D(Q.X(q[0]),Q.Y(q[1]),"gold",3.2));});
      var Hh=nar?qy+qh+50:Math.max(P.y+P.h+(md.get()===0?30:16),qy+qh+46);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し（表） ---- */
      var rows=[],k0=Math.max(0,hist.length-8);
      for(k=k0;k<hist.length;k++){var h=hist[k],inf=k<info.length?info[k]:null;
        if(md.get()===0)rows.push([String(k),_w06_f(h[0],4)+", "+_w06_f(h[1],4)+" km",_w06_f(h[2],4)+" km",_w06_len(perr(h)),inf?_w06_len(inf.rms):"—",inf?_w06_len(inf.dp):"—"]);
        else rows.push([String(k),_w06_len(perr(h)),_w06_len(h[3]-BT),inf?_w06_len(inf.rms):"—",inf?_w06_len(inf.dp):"—"]);}
      var hd=md.get()===0?["k","仮の位置 (x̂, ŷ)","b̂（本当は 3.0 km）","位置の誤差","その回の残差の RMS","次の |Δp|"]:["k","位置の誤差","b̂ − b","その回の残差の RMS","次の |Δp|"];
      var s1=st==="done"?'<span class="ok">収束した（'+(hist.length-1)+' 回。位置の修正量が 1 mm より小さい）</span>':(st==="div"?'<span class="warn">発散した（修正量が大きくなり続ける）</span>':(st==="sing"?'<span class="warn">G に逆行列が無くなった</span>':(st==="slow"?'<span class="warn">40 回で収束しない</span>':"「1 回進める」で次へ")));
      var tail="";
      if(md.get()===1&&st==="done"){var R=GE.rx,ren=_w06_renu(35.681,139.767),d=[x[0]-RX[0],x[1]-RX[1],x[2]-RX[2]],e3=ren.map(function(r){return r[0]*d[0]+r[1]*d[1]+r[2]*d[2];});
        tail="<br>最後の位置の誤差: 東 "+_w06_f(e3[0],2)+" m、北 "+_w06_f(e3[1],2)+" m、上 "+_w06_f(e3[2],2)+" m"+(rot.get()===2?'（<span class="warn">地球の自転の直しを省いたので、東へずれる</span>）':"");}
      ro.innerHTML=s1+tail+U.tbl(hd,rows,hd.map(function(){return "right";}))+'<div class="wnote">'+(md.get()===0?"平面の例は、1 章 1 節の 3 つの点（本当の位置は原点、受信機の時計のずれ b = 3.0 km、誤差 0）。金の破線は、前の仮の位置で各円を置き換えた直線（1 次の式）で、3 本の交わる点が次の仮の位置になる。":"東京の例は、受信機の時計が 1 ms 進み（b = 299.792 km）、誤差 0。初めの b̂ は 0。仮の位置は、東京を通る子午線を含む面に投影して描いた。")+"表は最後の 8 回分。</div>";
    }
    reset();draw();
  };

  /* ---- 5 節: ドップラーから速度と時計のドリフトを求める（動く空 ↔ ドップラーの内訳 ↔ 速度） ---- */
  REG.w06_vel=function(el,U){
    var S=U.S,ren=_w06_renu(35.681,139.767);
    U.head(el,"VELOCITY FROM DOPPLER","ドップラーから速度と時計のドリフトを求める");
    var r1=U.ctrls(el);
    var sp=U.slider(r1,"受信機の速さ",{min:0,max:40,step:1,value:20,fmt:function(v){return v+" m/s（時速 "+_w06_f(v*3.6,0)+" km）";},onInput:function(){draw();}});
    var hd=U.slider(r1,"進む向き（北から東へ）",{min:0,max:355,step:5,value:90,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var dr=U.slider(r2,"発振器の周波数のずれ",{values:[-2,-1,-0.5,0,0.5,1,2],value:0.5,fmt:function(v){return (v>0?"+":"")+_w06_f(v,1)+" ppm（ḃ = "+_w06_f(v*1e-6*_W06_C,1)+" m/s）";},onInput:function(){draw();}});
    var nz=U.slider(r2,"ドップラーの雑音",{values:[0,0.02,0.05,0.2,1],value:0.05,fmt:function(v){return v+" Hz";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var nsel=U.select(r3,"使う衛星",["見えている全部","仰角の高い 4 つ"],0,function(){draw();});
    var tt=U.slider(r3,"時刻（1 章の配置の時刻 0 から）",{min:0,max:3600,step:30,value:0,fmt:function(v){return Math.floor(v/60)+" 分 "+(v%60)+" 秒";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    var tick=U.ticker(function(){var v=tt.get()+30;if(v>3600){v=3600;tick.stop();}tt.set(v);draw();},80);
    U.button(br,"本文の例（東へ 20 m/s・+0.5 ppm・0.05 Hz）",function(){tick.stop();sp.set(20);hd.set(90);dr.set(0.5);nz.set(0.05);nsel.set(0);tt.set(0);seed=1;draw();});
    U.button(br,"再生（時刻を進める）",function(){if(tt.get()>=3600)tt.set(0);tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],t=tt.get(),geo=_w06_sky(U,t),sats=geo.sats.slice();
      if(nsel.get()===1)sats=sats.slice(0,4);
      var spd=sp.get(),hdg=hd.get()*_W06_D,venu=[spd*Math.sin(hdg),spd*Math.cos(hdg),0];
      var v=[0,1,2].map(function(j){return ren[0][j]*venu[0]+ren[1][j]*venu[1]+ren[2][j]*venu[2];});
      var bdot=dr.get()*1e-6*_W06_C,sd=nz.get(),rng=U.rng(seed*31+7);
      /* 衛星ごとのドップラーの内訳 */
      var parts=sats.map(function(q){var vp=U.gnss.ecef(q.s,t+0.5),vm=U.gnss.ecef(q.s,t-0.5),vs=[vp[0]-vm[0],vp[1]-vm[1],vp[2]-vm[2]];
        var ls=q.l[0]*vs[0]+q.l[1]*vs[1]+q.l[2]*vs[2],lv=q.l[0]*v[0]+q.l[1]*v[1]+q.l[2]*v[2];
        return {q:q,vs:vs,ls:ls,fs:-ls/_W06_LAM,fr:lv/_W06_LAM,fc:-bdot/_W06_LAM};});
      var G=sats.map(function(q){return [-q.l[0],-q.l[1],-q.l[2],1];}),A=sats.length>=4?_w06_lsA(U,G,sats.map(function(){return 1;})):null;
      var est=null,cloud=[],s2=0,NT=300;
      if(A){var meas=parts.map(function(p){return p.fs+p.fr+p.fc+sd*rng.normal();});
        function solve(f){var y=parts.map(function(p,i){return -_W06_LAM*f[i]-p.ls;}),x=[0,0,0,0];for(var j=0;j<4;j++)for(var i=0;i<y.length;i++)x[j]+=A[j][i]*y[i];return x;}
        est=solve(meas);
        for(var k=0;k<NT;k++){var f2=parts.map(function(p){return p.fs+p.fr+p.fc+sd*rng.normal();}),x2=solve(f2),e2=[0,1].map(function(r){return ren[r][0]*x2[0]+ren[r][1]*x2[1]+ren[r][2]*x2[2];});
          cloud.push(e2);s2+=(e2[0]-venu[0])*(e2[0]-venu[0])+(e2[1]-venu[1])*(e2[1]-venu[1]);}}
      /* ---- 左: 空（受信機の進む向きの矢印） ---- */
      var cx=nar?200:120,cy=nar?130:140,R=nar?96:98;
      o.push(S.T(nar?10:14,18,"空の衛星と、受信機の進む向き","start",10.5,"ink",true));
      o.push(U.gnss.sky(U,cx,cy,R,sats.map(function(p){return {el:p.el,az:p.az,name:p.nm,col:"purple"};}),{dot:4.2,labels:true}));
      if(spd>0){var al=Math.min(R*0.8,22+spd*1.6);o.push(S.ARR(cx,cy,cx+al*Math.sin(hdg),cy-al*Math.cos(hdg),"signal",2.4,8));}
      o.push(S.T(cx,cy+R+34,"青の矢印: 受信機の進む向き","middle",9,"signal",true));
      /* ---- 右: ドップラーの内訳（列ごとに目盛が違う） ---- */
      var bx=nar?14:262,by=nar?(cy+R+92):44,rh=nar?20:22,cols=nar?[[96,52,4000,"purple","fs","衛星"],[226,44,150,"signal","fr","受信機"],[336,30,4000,"gold","fc","時計"]]:[[350,70,4000,"purple","fs","衛星の動き"],[506,50,150,"signal","fr","受信機の動き"],[642,30,4000,"gold","fc","時計のドリフト"]];
      o.push(S.T(bx,by-26,"ドップラーの内訳 [Hz]（列ごとに目盛が違う）","start",10.5,"ink",true));
      cols.forEach(function(c){o.push(S.T(c[0],by-8,c[5],"middle",9.5,c[3],true));o.push(S.L(c[0],by-2,c[0],by+rh*parts.length,"muted",1));
        o.push(S.T(c[0]-c[1],by+rh*parts.length+12,"−"+c[2],"middle",8.5,"muted"));o.push(S.T(c[0]+c[1],by+rh*parts.length+12,"+"+c[2],"middle",8.5,"muted"));});
      parts.forEach(function(p,i){var yy=by+i*rh;o.push(S.T(bx,yy+13,p.q.nm,"start",9.5,"purple",true));
        cols.forEach(function(c){var val=p[c[4]],w=Math.max(-c[1],Math.min(c[1],c[1]*val/c[2]));o.push(S.RECT(Math.min(c[0],c[0]+w),yy+3,Math.abs(w),rh-8,2,U.soft(c[3]),c[3],1));
          o.push(S.T(c[0]+(val>0?-4:4),yy+13,(val>0?"+":"")+_w06_f(val,c[4]==="fr"?1:0),val>0?"end":"start",8.5,c[3],true,false,null,true));});});
      /* ---- 下: 求めた速度（東西と南北の平面） ---- */
      var vy0=nar?(by+rh*parts.length+40):Math.max(cy+R+60,by+rh*parts.length+36),vs=nar?170:150,vx0=nar?60:40;
      var V=U.plot(vx0,vy0,vs,vs,[-45,45],[-45,45]);
      o.push(S.T(vx0-20,vy0-10,"速度の東西と南北 [m/s]","start",10,"ink",true));
      o.push(S.RECT(vx0,vy0,vs,vs,3,"var(--screen)","line",1));o.push(V.axes({xt:[-40,-20,0,20,40],yt:[-40,-20,0,20,40],sz:8.5}));
      o.push(S.ARR(V.X(0),V.Y(0),V.X(venu[0]),V.Y(venu[1]),"green",2,7));
      if(est){var ee=[0,1].map(function(r){return ren[r][0]*est[0]+ren[r][1]*est[1]+ren[r][2]*est[2];});o.push(S.D(V.X(ee[0]),V.Y(ee[1]),"gold",3.6));}
      /* 拡大（本当の速度のまわり） */
      var zl=Math.max(0.02,Math.min(5,4*Math.sqrt(s2/Math.max(1,cloud.length))||0.02)),zx=vx0+vs+(nar?30:40),zs=nar?140:150;
      var Z=U.plot(zx,vy0,zs,zs,[venu[0]-zl,venu[0]+zl],[venu[1]-zl,venu[1]+zl]);
      o.push(S.T(zx,vy0-10,"拡大: 本当の速度 ±"+_w06_f(zl*100,zl<0.1?1:0)+" cm/s","start",10,"ink",true));
      o.push(S.RECT(zx,vy0,zs,zs,3,"var(--screen)","line",1));
      o.push(S.L(Z.X(venu[0]),vy0,Z.X(venu[0]),vy0+zs,"grid",1));o.push(S.L(zx,Z.Y(venu[1]),zx+zs,Z.Y(venu[1]),"grid",1));
      cloud.forEach(function(c){if(Math.abs(c[0]-venu[0])<zl&&Math.abs(c[1]-venu[1])<zl)o.push(S.D(Z.X(c[0]),Z.Y(c[1]),"gold",1.4));});
      o.push(S.L(Z.X(venu[0])-6,Z.Y(venu[1]),Z.X(venu[0])+6,Z.Y(venu[1]),"green",2));o.push(S.L(Z.X(venu[0]),Z.Y(venu[1])-6,Z.X(venu[0]),Z.Y(venu[1])+6,"green",2));
      if(!nar)o.push(S.T(zx+zs+12,vy0+16,"金の点: "+NT+" 回解いた","start",9,"gold",true),S.T(zx+zs+12,vy0+30,"速度（雑音の乱数を変えて）","start",9,"gold"),S.T(zx+zs+12,vy0+48,"十字・緑の矢印: 本当の速度","start",9,"green",true));
      var Hh=vy0+Math.max(vs,zs)+(nar?24:20);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し ---- */
      var h="時刻 "+Math.floor(t/60)+" 分 "+(t%60)+" 秒、使う衛星 "+sats.length+" 個。時計のドリフトによるドップラーは、どの衛星も "+_w06_f(-bdot/_W06_LAM,1)+" Hz<br>";
      if(est){var e3=[0,1,2].map(function(r){return ren[r][0]*est[0]+ren[r][1]*est[1]+ren[r][2]*est[2];}),spe=Math.hypot(e3[0],e3[1]),hde=(Math.atan2(e3[0],e3[1])/_W06_D+360)%360;
        h+="求めた速度: 東 <b>"+_w06_f(e3[0],3)+"</b> m/s、北 <b>"+_w06_f(e3[1],3)+"</b> m/s、上 "+_w06_f(e3[2],3)+" m/s（速さ "+_w06_f(spe,3)+" m/s、向き "+_w06_f(hde,1)+"°）、ḃ = <b>"+_w06_f(est[3],2)+" m/s</b>（"+_w06_f(est[3]/_W06_C*1e6,3)+" ppm）<br>";
        var Ae=[0,1,2].map(function(r){return A[0].map(function(_,i){return ren[r][0]*A[0][i]+ren[r][1]*A[1][i]+ren[r][2]*A[2][i];});}),thv=_w06_th(Ae,parts.map(function(){return sd*_W06_LAM;}));
        h+="水平の速度の誤差の RMS: "+NT+" 回で <b>"+_w06_f(Math.sqrt(s2/NT)*100,2)+" cm/s</b>（回数を十分に増やしたとき "+_w06_f(thv[0]*100,2)+" cm/s。擬似距離の変化率の雑音 "+_w06_f(sd*_W06_LAM*100,2)+" cm/s）";}
      else h+='<span class="warn">衛星が 4 つより少ないので解けない</span>';
      ro.innerHTML=h+'<div class="wnote">受信機は東京に置き、速度だけを与えた（位置の変化は、衛星の向きにほとんど効かないので省いた）。衛星の速度は、1 章の近似の配置で 1 s 前後の位置の差から求めた。棒の数は、衛星の動きによる分 −l<sub>i</sub>·v<sub>i</sub>/λ、受信機の動きによる分 l<sub>i</sub>·v/λ、時計のドリフトによる分 −ḃ/λ。</div>';
    }
    draw();
  };

  /* ---- 6 節: ECEF・緯度経度・ENU の変換（世界の格子 ↔ 楕円体の切り口 ↔ 数値） ---- */
  var _W06_A=6378137,_W06_FW=1/298.257223563,_W06_AP=6378137*(1-1/298.257223563);
  function _w06_g2e(B,L,h){B*=_W06_D;L*=_W06_D;var RN=_W06_A*_W06_A/Math.sqrt(_W06_A*_W06_A*Math.cos(B)*Math.cos(B)+_W06_AP*_W06_AP*Math.sin(B)*Math.sin(B));
    return {x:(RN+h)*Math.cos(B)*Math.cos(L),y:(RN+h)*Math.cos(B)*Math.sin(L),z:(_W06_AP*_W06_AP/(_W06_A*_W06_A)*RN+h)*Math.sin(B),RN:RN};}
  /* ECEF → 緯度・楕円体高の繰り返し（0 回目は h = 0 とおいた値） */
  function _w06_inv(x,y,z,n){var s=Math.hypot(x,y),k2=_W06_AP*_W06_AP/(_W06_A*_W06_A),B=Math.atan2(z,s*k2),out=[];
    for(var i=0;i<n;i++){var RN=_W06_A*_W06_A/Math.sqrt(_W06_A*_W06_A*Math.cos(B)*Math.cos(B)+_W06_AP*_W06_AP*Math.sin(B)*Math.sin(B)),h=Math.abs(Math.cos(B))>1e-9?s/Math.cos(B)-RN:Math.abs(z)-k2*RN;
      out.push([B/_W06_D,h]);B=Math.atan2(z*(RN+h),s*(k2*RN+h));}
    return out;}
  REG.w06_coord=function(el,U){
    var S=U.S,GE=_w06_geo(U),G9=GE.sats.filter(function(q){return q.nm==="G9";})[0];
    U.head(el,"COORDINATES","緯度・経度・楕円体高 ↔ ECEF ↔ ENU と標高");
    var r1=U.ctrls(el);
    var la=U.slider(r1,"緯度 B",{min:-89.9,max:89.9,step:0.001,value:35.681,fmt:function(v){return _w06_f(v,3)+"°";},onInput:function(){draw();}});
    var lo=U.slider(r1,"経度 L",{min:-180,max:180,step:0.001,value:139.767,fmt:function(v){return _w06_f(v,3)+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var hh=U.slider(r2,"楕円体高 h",{min:-100,max:9000,step:1,value:40,fmt:function(v){return _w06_g(v,0)+" m";},onInput:function(){draw();}});
    var hg=U.slider(r2,"ジオイド高 h_g（その場所の値を入れる）".replace("h_g","h<sub>g</sub>"),{min:-110,max:90,step:0.5,value:37,fmt:function(v){return _w06_f(v,1)+" m";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var ex=U.checkbox(r3,"切り口の扁平率を 20 倍にして描く",true,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（東京駅のあたり）",function(){la.set(35.681);lo.set(139.767);hh.set(40);hg.set(37);ex.set(true);draw();});
    U.button(br,"赤道・経度 0°",function(){la.set(0);lo.set(0);hh.set(0);draw();});
    U.button(br,"北極の近く",function(){la.set(89.9);lo.set(0);hh.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el),MP=null;
    U.ctl.drag(box,function(type,x,y){if(!MP||x==null)return type==="down"?false:undefined;if(x<MP.x||x>MP.x+MP.w||y<MP.y||y>MP.y+MP.h)return type==="down"?false:undefined;
      if(type==="up")return;la.set(Math.max(-89.9,Math.min(89.9,Math.round(MP.uy(y)*10)/10)));lo.set(Math.max(-180,Math.min(180,Math.round(MP.ux(x)*10)/10)));draw();});
    function draw(){
      var nar=_w06_nar(box),Wd=nar?400:700,o=[],B=la.get(),L=lo.get(),h=hh.get(),E=_w06_g2e(B,L,h);
      /* ---- 世界の格子（経度・緯度） ---- */
      var mw=nar?340:310,mh=mw/2,P=U.plot(nar?44:40,30,mw,mh,[-180,180],[-90,90]);MP=P;
      o.push(S.T(nar?16:14,18,"世界の格子（点を押すかドラッグする）","start",10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,2,"var(--screen)","line",1));
      for(var g=-150;g<=150;g+=30)o.push(S.L(P.X(g),P.y,P.X(g),P.y+P.h,g===0?"muted":"grid",1));
      for(var g2=-60;g2<=60;g2+=30)o.push(S.L(P.x,P.Y(g2),P.x+P.w,P.Y(g2),g2===0?"muted":"grid",1));
      [[-90,"−90°"],[0,"0°"],[90,"90°"]].forEach(function(q){o.push(S.T(P.x-4,P.Y(q[0])+3,q[1],"end",8.5,"muted"));});
      [[-180,"−180°"],[0,"0°"],[180,"180°"]].forEach(function(q){o.push(S.T(P.X(q[0]),P.y+P.h+12,q[1],"middle",8.5,"muted"));});
      o.push(S.D(P.X(139.767),P.Y(35.681),"green",3));o.push(S.T(P.X(139.767)+5,P.Y(35.681)-4,"東京","start",8.5,"green",true,false,null,true));
      o.push(S.CIRC(P.X(L),P.Y(B),6,"signal",2));o.push(S.D(P.X(L),P.Y(B),"signal",2.6));
      /* ---- 子午線を含む面の切り口 ---- */
      var k=ex.get()?20:1,A=nar?150:150,Ap=A*(1-k*_W06_FW),cx=nar?200:(40+mw+40+A),cy=nar?(P.y+P.h+40+Ap+20):(30+Ap+20);
      o.push(S.T(nar?16:cx-A-20,nar?P.y+P.h+30:18,"子午線を含む面の切り口"+(k>1?"（扁平率 20 倍）":""),"start",10.5,"ink",true));
      var pts=[];for(var i=0;i<=120;i++){var t=2*Math.PI*i/120;pts.push([cx+A*Math.cos(t),cy-Ap*Math.sin(t)]);}
      o.push(S.PL(pts,"green",1.6,"var(--green-soft)"));
      o.push(S.L(cx-A-8,cy,cx+A+8,cy,"muted",1));o.push(S.L(cx,cy+Ap+8,cx,cy-Ap-8,"muted",1));
      var Br=B*_W06_D,RNd=A*A/Math.sqrt(A*A*Math.cos(Br)*Math.cos(Br)+Ap*Ap*Math.sin(Br)*Math.sin(Br));
      var ps=RNd*Math.cos(Br),pz=Ap*Ap/(A*A)*RNd*Math.sin(Br),Px=cx+ps,Py=cy-pz,Qy=cy+(1-Ap*Ap/(A*A))*RNd*Math.sin(Br),hd=Math.min(40,Math.max(0,h/9000*40)+8);
      o.push(S.L(cx,Qy,Px+hd*Math.cos(Br),Py-hd*Math.sin(Br),"signal",1.5));o.push(S.L(cx,cy,Px,Py,"muted",1.1,"4 3"));
      o.push(S.D(Px,Py,"signal",3.6));o.push(S.D(cx,Qy,"signal",3.2));o.push(_w06_rxm(U,Px+hd*Math.cos(Br),Py-hd*Math.sin(Br)-3));
      o.push(S.TX((cx+Px)/2-4,(Qy+Py)/2-6,"R_N","end",10,"signal",true,true));
      if(Math.abs(B)>3)o.push(S.T(cx-6,Qy+(B>0?12:-4),"法線が z 軸を横切る点","end",8.5,"signal",false,false,null,true));
      var Hh=nar?cy+Ap+30:Math.max(P.y+P.h+30,cy+Ap+30);
      box.set(S.svg(Wd,Hh,o));
      /* ---- 読み出し ---- */
      var inv=_w06_inv(E.x,E.y,E.z,4),ren=_w06_renu(B,L),rx={B:B,L:L,h:h,r0:[E.x,E.y,E.z]},ea=U.gnss.elaz(rx,G9.p);
      var hs="ECEF: x = <b>"+_w06_g(E.x,1)+"</b> m、y = <b>"+_w06_g(E.y,1)+"</b> m、z = <b>"+_w06_g(E.z,1)+"</b> m（R<sub>N</sub> = "+_w06_g(E.RN/1e3,3)+" km、法線は中心から "+_w06_f((1-_W06_AP*_W06_AP/(_W06_A*_W06_A))*E.RN*Math.sin(B*_W06_D)/1e3,1)+" km 南で z 軸を横切る）<br>";
      hs+="逆の変換: 経度 = atan2(y, x) = "+_w06_f((Math.atan2(E.y,E.x)/_W06_D),6)+"°。緯度と楕円体高の繰り返し:"+U.tbl(["回","緯度 B [°]","緯度の誤差（地上の距離）","h [m]"],inv.map(function(q,i){var em=Math.abs(q[0]-B)*_W06_D*6.37e6;return [String(i),_w06_f(q[0],10),_w06_len(em),_w06_f(q[1],4)];}),["right","right","right","right"]);
      hs+="ENU の軸（ECEF の成分）: 東 ("+ren[0].map(function(v){return _w06_f(v,4);}).join(", ")+")、北 ("+ren[1].map(function(v){return _w06_f(v,4);}).join(", ")+")、上 ("+ren[2].map(function(v){return _w06_f(v,4);}).join(", ")+")<br>";
      hs+="この場所から見た G9（1 章の配置の時刻 0）: (e, n, u) = ("+_w06_g(ea[3]/1e3,1)+", "+_w06_g(ea[4]/1e3,1)+", "+_w06_g(ea[5]/1e3,1)+") km、仰角 "+_w06_f(ea[0],1)+"°、方位角 "+_w06_f(ea[1],1)+"°"+(ea[0]<0?'（<span class="warn">地平線の下</span>）':"")+"<br>";
      hs+="標高 H ≈ h − h<sub>g</sub> = "+_w06_g(h,0)+" − "+_w06_f(hg.get(),1)+" = <b>"+_w06_f(h-hg.get(),1)+" m</b>";
      ro.innerHTML=hs+'<div class="wnote">楕円体は WGS 84（赤道の半径 6 378 137 m、扁平率 1/298.257 223 563）。ジオイド高は場所ごとに違うので、ここでは値を入れる（東京のあたりで約 37 m。代表値）。切り口の図の受信機の高さは、見やすいように大きく描いた。</div>';
    }
    draw();
  };

  /* ===== 07 章 誤差と DOP ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w07_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w07_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W07_C=299792458,_W07_TC=1/1.023e6,_W07_CTC=299792458/1.023e6,_W07_D=Math.PI/180,_W07_RE=6371e3,_W07_HI=350e3;
  var _W07_F={L1:1575.42e6,L2:1227.60e6,L5:1176.45e6};
  var _W07_TOK=[35.681,139.767,40.0];
  var _W07_N4=["G9","G6","G2","G3"],_W07_CL4=["G6","G13","G3","G9"];
  /* クロブッチャー・モデルの 8 つの係数（例の値。図と同じ） */
  var _W07_KA=[0.1118e-7,-0.7451e-8,-0.5961e-7,0.1192e-6],_W07_KP=[0.1167e6,-0.2294e6,-0.1311e6,0.1049e7];
  /* 誤差の源の色（本文と同じ）: 衛星 紫・電離層 金・対流圏 緑・マルチパス 赤・受信機の雑音 青緑 */
  var _W07_SRC=[["衛星の時計と軌道","purple"],["電離層","gold"],["対流圏","green"],["マルチパス","alias"],["受信機の雑音","teal"]];
  /* ---- 2 節: 電離層と対流圏 ---- */
  function _w07_klob(latd,lond,eld,azd,tgps,sc){var phu=latd/180,lmu=lond/180,E=eld/180,A=azd*_W07_D;
    var psi=0.0137/(E+0.11)-0.022,phi=Math.max(-0.416,Math.min(0.416,phu+psi*Math.cos(A)));
    var lam=lmu+psi*Math.sin(A)/Math.cos(phi*Math.PI),phm=phi+0.064*Math.cos((lam-1.617)*Math.PI);
    var t=((4.32e4*lam+tgps)%86400+86400)%86400,F=1+16*Math.pow(0.53-E,3),PER=0,AMP=0;
    for(var n=0;n<4;n++){PER+=_W07_KP[n]*Math.pow(phm,n);AMP+=_W07_KA[n]*Math.pow(phm,n);}
    PER=Math.max(PER,72000);AMP=Math.max((sc==null?1:sc)*AMP,0);var x=2*Math.PI*(t-50400)/PER;
    var Tv=Math.abs(x)<1.57?5e-9+AMP*(1-x*x/2+x*x*x*x/24):5e-9;
    return {F:F,Tv:Tv,T:F*Tv,AMP:AMP,PER:PER,t:t,phm:phm};}
  /* 東京の地方時 lt [時] の L1 の遅れ [m]（方位角は南） */
  function _w07_klt(lt,el,sc){return _w07_klob(_W07_TOK[0],_W07_TOK[1],el,180,(lt-_W07_TOK[1]/15)*3600,sc);}
  function _w07_shell(el){var s=_W07_RE*Math.cos(el*_W07_D)/(_W07_RE+_W07_HI);return 1/Math.sqrt(1-s*s);}
  function _w07_mT(el){var s=Math.sin(el*_W07_D);return 1.001/Math.sqrt(0.002001+s*s);}
  var _W07_ZHD=0.0022768*1013.25/(1-0.00266*Math.cos(2*_W07_TOK[0]*_W07_D)-0.00028*_W07_TOK[2]/1000);
  function _w07_hm(h){h=((h%24)+24)%24;var H=Math.floor(h+1e-9),M=Math.round((h-H)*60);if(M===60){H=(H+1)%24;M=0;}return H+":"+(M<10?"0":"")+M;}

  REG.w07_delay=function(el,U){
    var S=U.S;
    U.head(el,"IONOSPHERE & TROPOSPHERE","電離層と対流圏の遅れ — 時刻・仰角・周波数");
    var r1=U.ctrls(el);
    var lt=U.slider(r1,"地方時（電離層を通る点）",{min:0,max:24,step:0.25,value:14,fmt:function(v){return _w07_hm(v);},onInput:function(){draw();}});
    var th=U.slider(r1,"衛星の仰角 θ",{min:2,max:90,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var fq=U.select(r2,"周波数",["L1（1575.42 MHz）","L2（1227.60 MHz）","L5（1176.45 MHz）"],0,function(){draw();});
    var sc=U.slider(r2,"電離層の強さ（仮の倍率）",{values:[0.5,1,1.5,2,3],value:1,fmt:function(v){return "× "+v;},onInput:function(){draw();}});
    var wt=U.slider(r2,"対流圏の湿潤の部分（天頂）",{min:0,max:0.4,step:0.05,value:0.1,fmt:function(v){return _w07_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=lt.get()+0.25;if(v>24)v-=24;lt.set(v);draw();},90);
    U.button(br,"本文の例（14 時・仰角 30°・L1）",function(){tick.stop();lt.set(14);th.set(30);fq.set(0);sc.set(1);wt.set(0.1);draw();});
    U.button(br,"夜（2 時）",function(){lt.set(2);draw();});
    U.button(br,"低い衛星（仰角 5°）",function(){th.set(5);draw();});
    U.button(br,"再生（1 日を進める）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var pic=U.svgbox(el),box=U.svgbox(el),ro=U.readout(el);
    function fk(){return Math.pow(_W07_F.L1/[_W07_F.L1,_W07_F.L2,_W07_F.L5][fq.get()],2);}
    function draw(){
      var nar=_w07_nar(box),Wd=nar?400:700,t=lt.get(),e=th.get(),k=fk(),s=sc.get(),zw=wt.get();
      var kb=_w07_klt(t,e,s),Iz=kb.Tv*_W07_C*k,Is=kb.T*_W07_C*k,mI=_w07_shell(e),mT=_w07_mT(e),Tz=_W07_ZHD+zw,Ts=Tz*mT;
      var fn=["L1","L2","L5"][fq.get()];
      /* ---- (a) 斜めに通る絵（地球の中心は図の下。層の厚さは誇張） ---- */
      var q=[],gw=nar?400:360,cx=gw/2,R=nar?520:560,cy=96+R,hI=46,tT=16,ang=e*_W07_D;
      q.push(S.T(10,16,"電波が大気を斜めに通る（層の高さは誇張）","start",10.5,"ink",true));
      function arc(rr){var p=[];for(var a=-0.33;a<=0.33001;a+=0.02)p.push([cx+rr*Math.sin(a),cy-rr*Math.cos(a)]);return p;}
      var band=function(r1_,r2_,c){var a=arc(r1_),b=arc(r2_).reverse();return S.PL(a.concat(b),"none",0,U.soft(c));};
      q.push(band(R,R+tT,"green"));q.push(band(R+hI-6,R+hI+6,"gold"));
      q.push(S.PL(arc(R),"signal",1.6));
      q.push(S.T(8,cy-R-hI+20,"電離層","start",9.5,"gold",true));q.push(S.T(8,cy-R-1,"対流圏","start",9.5,"green",true));
      /* 受信機は円の頂点のやや左。右へ仰角 θ の向きに電波が来る */
      var a0=-0.14,rx=cx+R*Math.sin(a0),ry=cy-R*Math.cos(a0),ux=Math.sin(a0),uy=-Math.cos(a0),hx=-uy,hy=ux;
      var dx=hx*Math.cos(ang)+ux*Math.sin(ang),dy=hy*Math.cos(ang)+uy*Math.sin(ang);
      function hit(rr){var bq=2*((rx-cx)*dx+(ry-cy)*dy),cq=(rx-cx)*(rx-cx)+(ry-cy)*(ry-cy)-rr*rr;return (-bq+Math.sqrt(bq*bq-4*cq))/2;}
      var sT=hit(R+tT),sI1=hit(R+hI-6),sI2=hit(R+hI+6),sEnd=Math.min(hit(R+hI+40),900);
      q.push(S.L(rx,ry,rx+dx*sEnd,ry+dy*sEnd,"signal",1.4,"4 3"));
      q.push(S.L(rx,ry,rx+dx*sT,ry+dy*sT,"green",4.5));
      q.push(S.L(rx+dx*sI1,ry+dy*sI1,rx+dx*sI2,ry+dy*sI2,"gold",4.5));
      q.push(S.D(rx,ry-1,"green",4));
      q.push(S.T(rx-8,ry+20,"受信機（仰角 θ = "+e+"°）","start",9.5,"signal",true,false,null,true));
      /* 右の数字 */
      var bx=nar?10:378,by=nar?176:30;
      if(!nar){q.push(S.T(bx,by,"遅れの内訳（"+fn+"）","start",10.5,"ink",true));}
      var rows=[["電離層 天頂（通る点）",Iz,"gold"],["電離層 斜め（× "+_w07_f(kb.F,2)+"）",Is,"gold"],["対流圏 天頂",Tz,"green"],["対流圏 斜め（× "+_w07_f(mT,2)+"）",Ts,"green"]];
      var vmax=Math.max(30,Is+1,Ts+1),bw=nar?200:200,lx=bx+(nar?150:150);
      rows.forEach(function(r,i){var yy=(nar?by:by+14)+i*26;q.push(S.T(lx-6,yy+12,r[0],"end",9.5,r[2],true));
        q.push(S.RECT(lx,yy+2,Math.max(1,bw*r[1]/vmax),13,2,i%2?r[2]:U.soft(r[2]),r[2],1));q.push(S.T(lx+bw*r[1]/vmax+5,yy+13,_w07_f(r[1],2)+" m","start",9.5,r[2],true));});
      var yb=(nar?by:by+14)+4*26+8;
      q.push(S.T(nar?bx:bx,yb+8,"合計（斜め）"+_w07_f(Is+Ts,2)+" m","start",10.5,"ink",true));
      pic.set(S.svg(Wd,nar?yb+20:Math.max(240,yb+20),q));
      /* ---- (b) 1 日の変化 と (c) 仰角と遅れ ---- */
      var g=[],pw=nar?320:280,ph=150,x1=nar?54:60,y1=24;
      var P=U.plot(x1,y1,pw,ph,[0,24],[0,Math.max(6,Math.ceil(_w07_klt(14,e,s).T*_W07_C*k*1.15))]);
      g.push(S.T(x1-44,14,"(b) 1 日の電離層の遅れ（"+fn+"）","start",10,"ink",true));
      g.push(P.axes({xl:"地方時 [時]",yl:"遅れ [m]",xt:[0,6,12,18,24],ylOff:36}));
      var pz=[],ps=[];for(var i=0;i<=192;i++){var h=24*i/192,kk=_w07_klt(h,e,s);pz.push([h,kk.Tv*_W07_C*k]);ps.push([h,kk.T*_W07_C*k]);}
      g.push(P.clip(pz,"gold",2));g.push(P.clip(ps,"gold",1.6,"6 3"));
      g.push(S.L(P.X(t),P.y,P.X(t),P.y+P.h,"ink",1,"3 3"));g.push(S.D(P.X(t),P.Y(Iz),"gold",4.5));g.push(S.D(P.X(t),P.Y(Math.min(Is,P.yr[1])),"gold",4.5));
      g.push(S.LEGL(x1,y1+ph+48,[["gold",null,"通る点の天頂"],["gold","6 3","仰角 "+e+"° の向き"]],9.5,14));
      var x2=nar?54:410,y2=nar?y1+ph+90:y1;
      var Q=U.plot(x2,y2,pw,ph,[0,90],[0.5,60],{ylog:true});
      g.push(S.T(x2-44,y2-10,"(c) 仰角と遅れ（"+fn+"、いまの時刻）","start",10,"ink",true));
      g.push(Q.axes({xl:"仰角 θ [°]",yl:"遅れ [m]",xt:[0,15,30,45,60,75,90],yt:[1,2,5,10,20,50],ylOff:36}));
      var ci=[],ct=[];for(var j=0;j<=88;j++){var ee=2+j;ci.push([ee,_w07_klt(t,ee,s).T*_W07_C*k]);ct.push([ee,Tz*_w07_mT(ee)]);}
      g.push(Q.clip(ci,"gold",2));g.push(Q.clip(ct,"green",2));
      g.push(S.L(Q.X(e),Q.y,Q.X(e),Q.y+Q.h,"ink",1,"3 3"));g.push(S.D(Q.X(e),Q.Y(Math.max(0.5,Is)),"gold",4.5));g.push(S.D(Q.X(e),Q.Y(Ts),"green",4.5));
      g.push(S.LEGL(x2,y2+ph+48,[["gold",null,"電離層（モデル）"],["green",null,"対流圏"]],9.5,14));
      box.set(S.svg(Wd,nar?y2+ph+58:y1+ph+58,g));
      /* ---- 読み出し ---- */
      var h2="<b>電離層</b>（クロブッチャー・モデル、例の係数 × "+s+"、東京から南の空の衛星）: 電離層を通る点の天頂の遅れ I<sub>z</sub> = <b>"+_w07_f(Iz,2)+" m</b>（L1 で "+_w07_f(kb.Tv*_W07_C,2)+" m × 周波数の倍率 (f<sub>L1</sub>/f)<sup>2</sup> = "+_w07_f(k,3)+"）、";
      h2+="振幅 A<sub>I</sub> = "+_w07_f(kb.AMP*_W07_C,2)+" m、周期 P<sub>I</sub> = "+_w07_f(kb.PER/3600,1)+" 時間<br>";
      h2+="マッピング関数: 薄い殻（350 km）の 1/cos z' = "+_w07_f(mI,3)+"、モデルの近似の式 1 + 16(0.53 − θ/180°)<sup>3</sup> = "+_w07_f(kb.F,3)+" → 斜めの遅れ I = <b>"+_w07_f(Is,2)+" m</b>（"+_w07_f(Is/_W07_C*1e9,1)+" ns）<br>";
      h2+="<b>対流圏</b>: 天頂 "+_w07_f(_W07_ZHD,2)+" m（乾燥）+ "+_w07_f(zw,2)+" m（湿潤）= "+_w07_f(Tz,2)+" m、m<sub>T</sub>(θ) = "+_w07_f(mT,3)+"（1/sin θ = "+_w07_f(1/Math.sin(e*_W07_D),3)+"）→ T = <b>"+_w07_f(Ts,2)+" m</b>（周波数によらない）<br>";
      h2+="合計 I + T = <b>"+_w07_f(Is+Ts,2)+" m</b>。クロブッチャー・モデルで直しても、I の約半分（"+_w07_f(Is/2,1)+" m ほど）は残る（代表値）";
      ro.innerHTML=h2+'<div class="wnote">電離層はクロブッチャー・モデル（IS-GPS-200 の手順、例の 8 つの係数）の値で、本当の電離層ではない。電離層を通る点は仰角とともに南へ動くので、その点の天頂の遅れも仰角で少し変わる（真上の衛星では東京の天頂の値）。「電離層の強さ」は、昼の振幅を仮に何倍かにして、太陽活動の違いを見るためのつまみである。対流圏の乾燥の部分は気圧 1013.25 hPa の Saastamoinen の式、マッピング関数は Black と Eisner の近似の式。</div>';
    }
    draw();
  };

  /* ---- 3 節: マルチパス — 反射波で相関がゆがみ、E と L が等しくなる点がずれる ---- */
  function _w07_lam(u){var a=Math.abs(u);return a<1?1-a:0;}
  /* 同じ位相（sgn=+1）・逆の位相（−1）のときの落ち着く点 [チップ]（本文の場合分けの式） */
  function _w07_env(g,tm,d,sgn){
    if(sgn>0){if(tm<(1+g)*d/2)return g*tm/(1+g);if(tm<=1-d/2+g*d/2)return g*d/2;if(tm<=1+d/2)return g*(1+d/2-tm)/(2-g);return 0;}
    if(tm<(1-g)*d/2)return -g*tm/(1-g);if(tm<=1-d/2-g*d/2)return -g*d/2;if(tm<=1+d/2)return -g*(1+d/2-tm)/(2+g);return 0;}
  /* 合わせた相関（直接波の振幅 dir、反射波は振幅 g・遅れ tm チップ・位相 psi [rad]）。[実部, 虚部] */
  function _w07_corr(u,g,tm,psi,dir){var a=dir*_w07_lam(u),b=g*_w07_lam(u-tm);return [a+b*Math.cos(psi),b*Math.sin(psi)];}
  /* E と L の電力の差（5 章 3 節の判別器の分子） */
  function _w07_disc(u,g,tm,psi,d,dir){var E=_w07_corr(u-d/2,g,tm,psi,dir),L=_w07_corr(u+d/2,g,tm,psi,dir);return E[0]*E[0]+E[1]*E[1]-L[0]*L[0]-L[1]*L[1];}
  /* 判別器が負から正へ 0 を横切る点（DLL が落ち着く点）のうち、0 に最も近いもの [チップ] */
  function _w07_track(g,tm,psi,d,dir){var best=null,prev=null,pu=0;
    for(var i=0;i<=1500;i++){var u=-1.2+i*0.002+1e-9,v=_w07_disc(u,g,tm,psi,d,dir);
      if(prev!==null&&prev<0&&v>0){var a=pu,b=u;for(var k=0;k<40;k++){var m=(a+b)/2;if(_w07_disc(m,g,tm,psi,d,dir)<0)a=m;else b=m;}var r=(a+b)/2;if(best===null||Math.abs(r)<Math.abs(best))best=r;}
      prev=v;pu=u;}
    return best===null?0:best;}
  var _W07_DEL=[1,0.5,0.2,0.1];
  REG.w07_multipath=function(el,U){
    var S=U.S;
    U.head(el,"MULTIPATH","反射波で相関がゆがみ、擬似距離がずれる");
    var r1=U.ctrls(el);
    var tmS=U.slider(r1,"反射波の余分の道のり cτ<sub>M</sub>",{min:0,max:480,step:0.5,value:146.5,fmt:function(v){return _w07_f(v,1)+" m（"+_w07_f(v/_W07_CTC,3)+" チップ）";},onInput:function(){draw();}});
    var gS=U.slider(r1,"振幅の比 γ",{min:0,max:0.9,step:0.05,value:0.5,fmt:function(v){return _w07_f(v,2)+(v>0?"（電力で "+_w07_f(20*Math.log10(v),1)+" dB）":"");},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var pS=U.slider(r2,"反射波の位相 ψ<sub>M</sub>",{min:0,max:360,step:1,value:0,fmt:function(v){return Math.round(v)+"°";},onInput:function(){draw();}});
    var dS=U.select(r2,"E と L の間隔",["1 チップ","0.5 チップ","0.2 チップ","0.1 チップ"],0,function(){draw();});
    var r3=U.ctrls(el);
    var nl=U.checkbox(r3,"直接波をさえぎる（NLOS）",false,function(){draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=pS.get()+4;if(v>=360)v-=360;pS.set(v);draw();},70);
    U.button(br,"本文の例（同じ位相）",function(){tick.stop();tmS.set(146.5);gS.set(0.5);pS.set(0);dS.set(0);nl.set(false);draw();});
    U.button(br,"逆の位相（180°）",function(){pS.set(180);draw();});
    U.button(br,"壁 20 m・仰角 30°（34.6 m）",function(){tmS.set(34.6);draw();});
    U.button(br,"位相を回す（再生）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),cache={key:"",ph:null};
    function draw(){
      var nar=_w07_nar(box),Wd=nar?400:700,tm=tmS.get()/_W07_CTC,g=gS.get(),psi=pS.get()*_W07_D,d=_W07_DEL[dS.get()],dir=nl.get()?0:1,o=[];
      var x=_w07_track(g,tm,psi,d,dir),M=x*_W07_CTC;
      var pw=nar?320:280,ph=nar?140:150,xl=nar?54:56,xr=nar?54:406,ya=26,yb=nar?ya+ph+76:ya,yc=nar?yb+ph+76:ya+ph+86,yd=nar?yc+ph+86:yc;
      /* (a) 相関の大きさ */
      var P=U.plot(xl,ya,pw,ph,[-1.5,2.0],[0,1.9]);
      o.push(S.T(xl-40,ya-10,"(a) 相関の大きさ（直接波の山を 1）","start",10,"ink",true));
      o.push(P.axes({xl:"局部の符号のずれ Δτ [チップ]",xt:[-1,-0.5,0,0.5,1,1.5,2],yt:[0,0.5,1,1.5],ylOff:34}));
      var pa=[],pb=[],pc=[];for(var i=0;i<=350;i++){var u=-1.5+i*0.01,c=_w07_corr(u,g,tm,psi,dir);pa.push([u,dir*_w07_lam(u)]);pb.push([u,g*_w07_lam(u-tm)]);pc.push([u,Math.hypot(c[0],c[1])]);}
      if(dir)o.push(P.line(pa,"green",1.5,"5 3"));o.push(P.line(pb,"alias",1.5,"5 3"));o.push(P.line(pc,"signal",2.4));
      o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"green",1,"2 2"));
      [[x-d/2,"E"],[x,"P"],[x+d/2,"L"]].forEach(function(q){var c=_w07_corr(q[0],g,tm,psi,dir),v=Math.hypot(c[0],c[1]);o.push(S.D(P.X(q[0]),P.Y(v),"gold",4.4));o.push(S.T(P.X(q[0]),P.Y(v)-7,q[1],"middle",10,"gold",true,false,null,true));});
      /* (b) S 字 */
      var Q=U.plot(xr,yb,pw,ph,[-1.0,1.8],[-1.0,1.0]);
      o.push(S.T(xr-40,yb-10,"(b) 判別器の S 字（5 章 3 節と同じ正規化）","start",10,"ink",true));
      o.push(Q.axes({xl:"局部の符号のずれ Δτ [チップ]",xt:[-1,-0.5,0,0.5,1,1.5],yt:[-1,-0.5,0,0.5,1],ylOff:34}));
      o.push(S.L(Q.x,Q.Y(0),Q.x+Q.w,Q.Y(0),"muted",1));
      var s0=[],s1=[];for(var j=0;j<=280;j++){var u2=-1+j*0.01;s0.push([u2,_w07_disc(u2,0,tm,psi,d,1)/(2*(2-d))]);s1.push([u2,_w07_disc(u2,g,tm,psi,d,dir)/(2*(2-d))]);}
      o.push(Q.clip(s0,"green",1.5,"5 3"));o.push(Q.clip(s1,"signal",2.2));
      o.push(S.D(Q.X(0),Q.Y(0),"green",4));o.push(S.D(Q.X(Math.max(-1,Math.min(1.8,x))),Q.Y(0),"gold",4.6));
      /* (c) 包絡線 */
      var lim=Math.max(20,Math.ceil(g*d/2*_W07_CTC/10)*10+10,dir?0:Math.ceil(Math.min(480,tmS.get())/50)*50);
      var Rr=U.plot(xl,yc,pw,ph,[0,1.6],[-lim,lim]);
      o.push(S.T(xl-40,yc-24,"(c) 誤差の包絡線（いまの γ と間隔）","start",10,"ink",true));
      o.push(Rr.axes({xl:"反射波の遅れ τ_M [チップ]",yl:"誤差 [m]",xt:[0,0.4,0.8,1.2,1.6],ylOff:34}));
      [0,100,200,300,400].forEach(function(v){var xx=Rr.X(v/_W07_CTC);o.push(S.L(xx,Rr.y,xx,Rr.y-4,"muted",1));o.push(S.T(xx,Rr.y-6,v+" m","middle",8.5,"muted"));});
      var up=[],dn=[];for(var k=0;k<=320;k++){var t2=1.6*k/320;up.push([t2,_w07_env(g,t2,d,1)*_W07_CTC]);dn.push([t2,_w07_env(g,t2,d,-1)*_W07_CTC]);}
      o.push(S.PL(up.map(function(q){return [Rr.X(q[0]),Rr.Y(q[1])];}).concat(dn.slice().reverse().map(function(q){return [Rr.X(q[0]),Rr.Y(q[1])];})),"none",0,U.soft("gold")));
      o.push(Rr.line(up,"gold",1.8));o.push(Rr.line(dn,"gold",1.8));o.push(S.L(Rr.x,Rr.Y(0),Rr.x+Rr.w,Rr.Y(0),"muted",1));
      if(!dir)o.push(Rr.clip([[0,0],[1.6,1.6*_W07_CTC]],"alias",1.4,"5 3"));
      var tmc=Math.min(tm,1.6);o.push(S.L(Rr.X(tmc),Rr.Y(_w07_env(g,tm,d,-1)*_W07_CTC),Rr.X(tmc),Rr.Y(_w07_env(g,tm,d,1)*_W07_CTC),"gold",3));
      o.push(S.D(Rr.X(tmc),Rr.Y(Math.max(-lim,Math.min(lim,M))),"signal",5));
      /* (d) 位相と誤差 */
      var key=[tm,g,d,dir].join(",");if(cache.key!==key){cache.key=key;cache.ph=[];for(var a2=0;a2<=360;a2+=5)cache.ph.push([a2,_w07_track(g,tm,a2*_W07_D,d,dir)*_W07_CTC]);}
      var ymn=Math.min.apply(null,cache.ph.map(function(q){return q[1];})),ymx=Math.max.apply(null,cache.ph.map(function(q){return q[1];})),pl=Math.max(10,Math.ceil(Math.max(Math.abs(ymn),Math.abs(ymx))/10)*10);
      var Dd=U.plot(xr,yd,pw,ph,[0,360],[-pl,pl]);
      o.push(S.T(xr-40,yd-24,"(d) 位相が回るときの誤差（衛星が動くと回る）","start",10,"ink",true));
      o.push(Dd.axes({xl:"反射波の位相 ψ_M [°]",yl:"誤差 [m]",xt:[0,90,180,270,360],ylOff:34}));
      o.push(S.L(Dd.x,Dd.Y(0),Dd.x+Dd.w,Dd.Y(0),"muted",1));
      o.push(Dd.line(cache.ph,"signal",2));o.push(S.D(Dd.X(pS.get()),Dd.Y(M),"signal",5));
      var Hh=yd+ph+56;
      o.push(S.LEGL(nar?xl-40:xl-40,Hh-4,[["green","5 3","直接波"],["alias","5 3","反射波"],["signal",null,"受けた信号"],["gold",null,"包絡線"]],9,12));
      box.set(S.svg(Wd,Hh+6,o));
      /* 読み出し */
      var ev=cache.ph.map(function(q){return q[1];}),mean=0,rms=0;ev.slice(0,-1).forEach(function(v){mean+=v;rms+=v*v;});mean/=ev.length-1;rms=Math.sqrt(rms/(ev.length-1));
      var hU=_w07_env(g,tm,d,1)*_W07_CTC,hD=_w07_env(g,tm,d,-1)*_W07_CTC;
      var h="余分の道のり cτ<sub>M</sub> = "+_w07_f(tmS.get(),1)+" m（"+_w07_f(tm,3)+" チップ）、γ = "+_w07_f(g,2)+"、ψ<sub>M</sub> = "+Math.round(pS.get())+"°、E と L の間隔 "+d+" チップ"+(dir?"":"、<span class=\"warn\">直接波なし（NLOS）</span>")+"<br>";
      h+="落ち着く点のずれ Δτ* = <b>"+_w07_f(x,3)+" チップ</b> → 擬似距離の誤差 M = <b>"+_w07_f(M,1)+" m</b><br>";
      if(dir){h+="包絡線（この遅れで）: 同じ位相 "+_w07_f(hU,1)+" m、逆の位相 "+_w07_f(hD,1)+" m。最大の大きさ γ × 間隔 × cT<sub>c</sub>/2 = "+_w07_f(g*d/2*_W07_CTC,1)+" m<br>";
        if(tm<(1-g)*d/2)h+="遅れが短いので、式 cτ<sub>M</sub>γ/(1 + γ) = "+_w07_f(tmS.get()*g/(1+g),1)+" m、−cτ<sub>M</sub>γ/(1 − γ) = "+_w07_f(-tmS.get()*g/(1-g),1)+" m の範囲<br>";
        h+="位相を 1 周回したとき: "+_w07_f(ymn,1)+"〜"+_w07_f(ymx,1)+" m、RMS "+_w07_f(rms,1)+" m、平均 "+_w07_f(mean,1)+" m";}
      else h+="直接波が無いので、DLL は反射波の山に合わせ、遅れの全部 cτ<sub>M</sub> = "+_w07_f(tmS.get(),1)+" m が誤差になる（包絡線の外）";
      ro.innerHTML=h+'<div class="wnote">搬送波の位相は分からないものとし、E と L の電力の差の判別器（5 章 3 節）が 0 を横切る点を数値で探した。相関の三角形は、受信機の帯域が十分に広い場合（頂点が鋭い）の形。γ・遅れ・位相は、反射する面と衛星の動きで決まる値の例。</div>';
    }
    draw();
  };

  /* ---- 4 節: DOP — スカイプロットの衛星を動かすと、DOP と誤差の楕円が変わる ---- */
  var _W07_ALLSYS=["GPS","GLONASS","Galileo","BeiDou","QZSS"];
  function _w07_vis(U,t,sys,mask){var rx=U.gnss.rx(_W07_TOK[0],_W07_TOK[1],_W07_TOK[2]),out=[];
    U.gnss.constellation().forEach(function(s){if(sys.indexOf(s.sys)<0)return;var ea=U.gnss.elaz(rx,U.gnss.ecef(s,t));if(ea[0]>(mask||0))out.push({nm:s.nm,sys:s.sys,el:ea[0],az:ea[1],s:s});});
    out.sort(function(a,b){return b.el-a.el;});return out;}
  /* 幾何行列（ENU の成分。衛星系ごとに時計の列）と (GᵀG)⁻¹、最小二乗の行列 A。解けないときは null */
  function _w07_geo(U,sats){var us=_W07_ALLSYS.filter(function(y){return sats.some(function(q){return q.sys===y;});});
    var n=3+us.length,m=sats.length;if(m<n||m===0)return null;
    var G=sats.map(function(q){var e=q.el*_W07_D,a=q.az*_W07_D,r=[-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e)];for(var k=0;k<us.length;k++)r.push(q.sys===us[k]?1:0);return r;});
    var M=U.ctl.mat,N=M.mul(M.T(G),G),H;try{H=M.inv(N);}catch(e){return null;}
    for(var i=0;i<n;i++)if(!isFinite(H[i][i])||H[i][i]>1e7||H[i][i]<0)return null;
    return {G:G,H:H,us:us,A:M.mul(H,M.T(G)),nc:us.length};}
  function _w07_ell(a,b,c){var m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);return [Math.sqrt(m+r),Math.sqrt(Math.max(m-r,0)),0.5*Math.atan2(2*b,a-c)/_W07_D];}
  /* 長い半径 s1・短い半径 s2 の 2 次元の正規分布で、半径 R の円に入る確率（5 節） */
  function _w07_pin(U,R,s1,s2){if(s2<1e-9*s1)return 1-U.gnss.erfc(R/(s1*Math.SQRT2));var n=360,sm=0;
    for(var i=0;i<n;i++){var ph=2*Math.PI*i/n,q=Math.cos(ph)*Math.cos(ph)/(s1*s1)+Math.sin(ph)*Math.sin(ph)/(s2*s2);sm+=(1-Math.exp(-R*R*q/2))/q;}return sm/n/(s1*s2);}
  function _w07_rad(U,p,s1,s2){var lo=0,hi=10*(s1+s2);for(var i=0;i<60;i++){var m=(lo+hi)/2;if(_w07_pin(U,m,s1,s2)<p)lo=m;else hi=m;}return (lo+hi)/2;}
  function _w07_nice(v){var c=[0.5,1,2,2.5,5,10,20,25,50,100,200,250,500,1000];for(var i=0;i<c.length;i++)if(c[i]>=v)return c[i];return 1000;}
  function _w07_ellpts(s1,s2,ang,k){var o=[],ca=Math.cos(ang*_W07_D),sa=Math.sin(ang*_W07_D);for(var i=0;i<=96;i++){var t=2*Math.PI*i/96,u=k*s1*Math.cos(t),v=k*s2*Math.sin(t);o.push([u*ca-v*sa,u*sa+v*ca]);}return o;}

  REG.w07_dop=function(el,U){
    var S=U.S;
    U.head(el,"DOP","空の衛星の並びと DOP・誤差の楕円");
    var r1=U.ctrls(el);
    var pre=U.select(r1,"衛星の並び",["1 章の 4 つ（G9・G6・G2・G3）","見えている 8 つ（GPS）","偏った 4 つ（G6・G13・G3・G9）","4 つを同じ仰角 45° に（円錐）","全部の衛星系"],1,function(){tick.stop();setPre();draw();});
    var mk=U.slider(r1,"仰角マスク",{min:0,max:40,step:1,value:0,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var sg=U.slider(r1,"擬似距離の誤差 σ",{values:[0.5,1,2,4],value:1,fmt:function(v){return v+" m";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var selS=U.select(r2,"動かす衛星（図の点をドラッグしてもよい）",["—"],0,function(){sel=selS.input.value;syncCtl();draw();});
    var elS=U.slider(r2,"その衛星の仰角",{min:0,max:90,step:0.5,value:45,fmt:function(v){return _w07_f(v,1)+"°";},onInput:function(v){var q=find(sel);if(q){q.el=v;q.man=true;}draw();}});
    var azS=U.slider(r2,"その衛星の方位角",{min:0,max:359,step:1,value:0,fmt:function(v){return Math.round(v)+"°";},onInput:function(v){var q=find(sel);if(q){q.az=v;q.man=true;}draw();}});
    var useC=U.checkbox(r2,"その衛星を使う（図の点を押しても切り替わる）",true,function(v){var q=find(sel);if(q)q.use=v;draw();});
    var br=U.btnrow(el);
    var tick=U.ticker(function(){tt+=300;refresh();draw();},120);
    U.button(br,"本文の例（見えている 8 つ）",function(){tick.stop();pre.set(1);mk.set(0);sg.set(1);setPre();draw();});
    U.button(br,"再生（時刻を進める）",function(){if(pre.get()===3)return;tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el),sats=[],tt=0,sel=null,SK=null,dragging=false,downAt=null;
    function find(nm){for(var i=0;i<sats.length;i++)if(sats[i].nm===nm)return sats[i];return null;}
    function sysOf(){return pre.get()===4?_W07_ALLSYS:["GPS"];}
    function setPre(){tt=0;var k=pre.get();
      if(k===3){sats=[0,90,180,270].map(function(a,i){return {nm:"C"+(i+1),sys:"GPS",el:45,az:a,use:true,man:true};});}
      else{sats=_w07_vis(U,0,sysOf(),-90).filter(function(q){return q.el>0;}).map(function(q){return {nm:q.nm,sys:q.sys,el:q.el,az:q.az,s:q.s,man:false,
        use:k===0?_W07_N4.indexOf(q.nm)>=0:(k===2?_W07_CL4.indexOf(q.nm)>=0:true)};});}
      sel=sats.length?(k===0||k===2?(k===0?"G2":"G13"):sats[0].nm):null;rebuild();}
    function refresh(){var k=pre.get(),now=_w07_vis(U,tt,sysOf(),-90),keep={};sats.forEach(function(q){keep[q.nm]=q;});var out=[];
      now.forEach(function(q){var o=keep[q.nm];if(o&&o.man){out.push(o);return;}if(q.el<=0)return;
        out.push({nm:q.nm,sys:q.sys,el:q.el,az:q.az,s:q.s,man:false,use:o?o.use:(k===1||k===4)});});
      sats.forEach(function(q){if(q.man&&!q.s)out.push(q);});sats=out;if(!find(sel))sel=sats.length?sats[0].nm:null;rebuild();}
    function rebuild(){var s=selS.input;s.innerHTML="";sats.forEach(function(q){var op=document.createElement("option");op.value=q.nm;op.textContent=q.nm;s.appendChild(op);});if(sel)s.value=sel;syncCtl();}
    function syncCtl(){var q=find(sel);if(!q)return;elS.set(Math.round(q.el*2)/2);azS.set(Math.round(q.az));useC.set(q.use);}
    var GEO={cx:0,cy:0,R:1};
    U.ctl.drag(box,function(type,x,y){
      if(type==="down"){var best=null,bd=16;(SK||[]).forEach(function(p){var d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=p.nm;}});if(!best)return false;sel=best;dragging=false;downAt=[x,y];tick.stop();rebuild();draw();return true;}
      if(type==="move"&&downAt){if(!dragging&&Math.hypot(x-downAt[0],y-downAt[1])<4)return;dragging=true;var q=find(sel);if(!q)return;
        var dx=x-GEO.cx,dy=y-GEO.cy,rr=Math.min(GEO.R,Math.hypot(dx,dy));q.el=Math.max(0,90*(1-rr/GEO.R));q.az=((Math.atan2(dx,-dy)/_W07_D)+360)%360;q.man=true;syncCtl();draw();return;}
      if(type==="up"){if(!dragging&&downAt){var q2=find(sel);if(q2){q2.use=!q2.use;syncCtl();}}dragging=false;downAt=null;draw();}});
    function draw(){
      var nar=_w07_nar(box),Wd=nar?400:700,o=[],m0=mk.get(),sig=sg.get();
      var act=sats.filter(function(q){return q.use&&q.el>m0&&q.el>=0;}),geo=_w07_geo(U,act);
      /* (a) スカイプロット */
      var cx=nar?200:158,cy=nar?150:166,R=nar?104:120;GEO={cx:cx,cy:cy,R:R};
      o.push(S.T(nar?10:14,18,"(a) 空の衛星（ドラッグで動かす・押して切り替える）","start",10,"ink",true));
      var many=sats.length>16,pts=sats.map(function(q){var on=q.use&&q.el>m0;return {el:q.el,az:q.az,name:(!many||q.nm===sel)?q.nm:null,col:on?"purple":"faint",hl:q.nm===sel};});
      o.push(U.gnss.sky(U,cx,cy,R,pts,{dot:4.4,sz:pre.get()===4?8.5:9.5,labels:true}));
      if(m0>0)o.push(S.CIRC(cx,cy,R*(90-m0)/90,"alias",1.3,null,"5 3"));
      SK=sats.map(function(q){var p=U.gnss.skyxy(cx,cy,R,q.el,q.az);return {x:p[0],y:p[1],nm:q.nm};});
      o.push(S.T(cx,cy+R+34,"使う衛星 "+act.length+" 個"+(m0>0?"（赤の破線はマスク "+m0+"°）":"")+(many?"。名前は選んだ衛星だけ":""),"middle",9.5,act.length>=4?"purple":"alias",true));
      /* (b) 誤差の楕円 */
      var ex=nar?60:362,ey=nar?cy+R+66:40,ew=nar?240:210;
      o.push(S.T(ex-46,ey-12,"(b) 水平の誤差の楕円（σ = "+sig+" m）","start",10,"ink",true));
      var dd=null,s1=0,s2=0,ang=0;
      var nu=3;(function(){var us=[];act.forEach(function(q){if(us.indexOf(q.sys)<0)us.push(q.sys);});nu=3+Math.max(1,us.length);})();
      if(geo){var H=geo.H;dd={G:Math.sqrt(H[0][0]+H[1][1]+H[2][2]+H[3][3]),P:Math.sqrt(H[0][0]+H[1][1]+H[2][2]),H:Math.sqrt(H[0][0]+H[1][1]),V:Math.sqrt(H[2][2]),T:Math.sqrt(H[3][3])};
        var e3=_w07_ell(H[0][0]*sig*sig,H[0][1]*sig*sig,H[1][1]*sig*sig);s1=e3[0];s2=e3[1];ang=e3[2];}
      var lim=_w07_nice(dd?Math.max(1.3*dd.H*sig,0.5):1);
      var P=U.plot(ex,ey,ew,ew,[-lim,lim],[-lim,lim]);
      o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));
      o.push(P.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9}));
      o.push(S.T(P.x+P.w/2,P.y+P.h+28,"東西（横）・南北（縦）[m]","middle",9,"muted"));
      if(dd){o.push(P.clip(_w07_ellpts(s1,s2,ang,1),"alias",2.2));
        var cpts=[];for(var j=0;j<=96;j++){var a=2*Math.PI*j/96;cpts.push([dd.H*sig*Math.cos(a),dd.H*sig*Math.sin(a)]);}o.push(P.clip(cpts,"purple",1.4,"5 3"));}
      else o.push(S.T(P.x+P.w/2,P.y+P.h/2,"解けない","middle",11,"alias",true,false,null,true));
      o.push(S.L(P.X(0)-5,P.Y(0),P.X(0)+5,P.Y(0),"green",2));o.push(S.L(P.X(0),P.Y(0)-5,P.X(0),P.Y(0)+5,"green",2));
      /* 上下の棒 */
      var vx=P.x+P.w+(nar?26:30),vlim=_w07_nice(dd?Math.max(1.3*dd.V*sig,0.5):1),Q=U.plot(vx,ey,24,ew,[0,1],[-vlim,vlim]);
      o.push(S.RECT(vx,ey,24,ew,3,"var(--screen)","line",1));
      [-vlim,0,vlim].forEach(function(v){o.push(S.T(vx+30,Q.Y(v)+3,_w07_f(v,v%1?1:0),"start",8.5,"muted"));});
      if(dd){o.push(S.RECT(vx+3,Q.Y(dd.V*sig),18,Q.Y(-dd.V*sig)-Q.Y(dd.V*sig),2,U.soft("alias"),"alias",1.4));}
      o.push(S.T(vx+12,ey-12+(nar?0:0),"上下","middle",9.5,"ink",true));
      /* (c) DOP の棒 */
      var bx=nar?110:362,by=nar?ey+ew+70:ey+ew+64,bw=nar?220:260;
      o.push(S.T(nar?10:bx-46,by-14,"(c) DOP（対数の目盛）","start",10,"ink",true));
      var L=U.plot(bx,by,bw,5*20,[0.3,100],[0,1],{xlog:true});
      [0.5,1,2,5,10,20,50,100].forEach(function(v){o.push(S.L(L.X(v),by,L.X(v),by+100,"grid",1));o.push(S.T(L.X(v),by+112,String(v),"middle",8.5,"muted"));});
      [["GDOP","G"],["PDOP","P"],["HDOP","H"],["VDOP","V"],["TDOP","T"]].forEach(function(r,i){var yy=by+i*20+3;o.push(S.T(bx-6,yy+11,r[0],"end",9.5,"ink",true));
        var v=dd?dd[r[1]]:Infinity,c=r[0]==="HDOP"||r[0]==="VDOP"?"alias":"purple";
        o.push(S.RECT(bx,yy,Math.max(1,Math.min(bw,L.X(Math.min(v,100))-bx)),14,2,U.soft(c),c,1));
        o.push(S.T(Math.min(bx+bw-2,L.X(Math.min(v,100))+4),yy+11,isFinite(v)?_w07_f(v,2):"∞",L.X(Math.min(v,100))+40>bx+bw?"end":"start",9.5,c,true,false,null,true));});
      box.set(S.svg(Wd,by+124,o));
      /* 読み出し */
      var h="使う衛星 "+act.length+" 個: "+(act.length?act.map(function(q){return q.nm;}).join("・"):"なし")+"。未知数は位置 3 つと時計のずれ "+(geo?geo.nc:1)+" つ（衛星系ごと）<br>";
      if(dd){var cep=_w07_rad(U,0.5,s1,s2),r95=_w07_rad(U,0.95,s1,s2),azl=((90-ang)%180+180)%180;
        h+="GDOP <b>"+_w07_f(dd.G,2)+"</b>、PDOP <b>"+_w07_f(dd.P,2)+"</b>、HDOP <b>"+_w07_f(dd.H,2)+"</b>、VDOP <b>"+_w07_f(dd.V,2)+"</b>、TDOP <b>"+_w07_f(dd.T,2)+"</b><br>";
        h+="誤差の楕円: 長い半径 "+_w07_f(s1,2)+" m（方位 "+_w07_f(azl,0)+"° と "+_w07_f((azl+180)%360,0)+"° の向き）、短い半径 "+_w07_f(s2,2)+" m。水平の DRMS = HDOP × σ = <b>"+_w07_f(dd.H*sig,2)+" m</b>（紫の破線の円）、CEP "+_w07_f(cep,2)+" m、R95 "+_w07_f(r95,2)+" m<br>";
        h+="上下: VDOP × σ = <b>"+_w07_f(dd.V*sig,2)+" m</b>（95 % は "+_w07_f(1.96*dd.V*sig,2)+" m）。時計のずれ: TDOP × σ = "+_w07_f(dd.T*sig,2)+" m（"+_w07_f(dd.T*sig/_W07_C*1e9,1)+" ns）";}
      else h+='<span class="warn">'+(act.length<nu?"使う衛星（"+act.length+" 個）が未知数（"+nu+" 個）より少ないので解けない。":"衛星の並びが悪く、GᵀG に逆行列が無いので解けない（同じ仰角に並ぶ円錐の並びなど）。")+'</span>';
      ro.innerHTML=h+'<div class="wnote">東京、1 章の近似の配置（再生では 1 こまで 5 分進む）。ドラッグで動かした衛星は、その位置に止まる。DOP は (GᵀG)<sup>−1</sup> の対角成分から計算し、全部の衛星系では、衛星系ごとに時計のずれの未知数を置いた（TDOP は最初の衛星系の時計）。</div>';
    }
    setPre();draw();
  };

  /* ---- 6 節: 誤差の予算 → UERE → DOP を掛けて位置の散らばり ---- */
  REG.w07_scatter=function(el,U){
    var S=U.S;
    U.head(el,"ERROR BUDGET","誤差の予算から UERE、DOP を掛けて位置の散らばりへ");
    var r1=U.ctrls(el),def=[1.5,3.5,0.4,1.0,0.5],mx=[3,8,2,10,3];
    var sl=_W07_SRC.map(function(sc,i){return U.slider(r1,sc[0]+"の σ",{min:0,max:mx[i],step:mx[i]>2?0.1:0.05,value:def[i],fmt:function(v){return _w07_f(v,2)+" m";},onInput:function(){draw();}});});
    var r2=U.ctrls(el);
    var cfg=U.select(r2,"衛星の並び",["1 章の 4 つ（時刻 0）","見えている 8 つ（時刻 0）","偏った 4 つ（時刻 0）","全部の衛星系（時刻 0・マスク 10°）"],1,function(){geo=null;draw();});
    var nS=U.slider(r2,"解く回数",{values:[500,1000,2000,5000],value:2000,fmt:function(v){return v+" 回";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var cE=U.checkbox(r3,"誤差の楕円",true,function(){draw();}),cC=U.checkbox(r3,"CEP",true,function(){draw();}),cR=U.checkbox(r3,"R95",true,function(){draw();}),c2=U.checkbox(r3,"2DRMS",true,function(){draw();});
    var br=U.btnrow(el),seed=1,geo=null;
    U.button(br,"本文の例（見えている 8 つ）",function(){def.forEach(function(v,i){sl[i].set(v);});cfg.set(1);nS.set(2000);seed=1;geo=null;draw();});
    U.button(br,"電離層を半分に（1.75 m）",function(){sl[1].set(1.75);draw();});
    U.button(br,"ビル街の例（マルチパス 8 m）",function(){sl[3].set(8);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function sats(){var k=cfg.get();if(k===3)return _w07_vis(U,0,_W07_ALLSYS,10);var v=_w07_vis(U,0,["GPS"],0);
      return v.filter(function(q){return k===1||(k===0?_W07_N4:_W07_CL4).indexOf(q.nm)>=0;});}
    function draw(){
      if(!geo)geo=_w07_geo(U,sats());
      var nar=_w07_nar(box),Wd=nar?400:700,o=[],sg=sl.map(function(s){return s.get();}),ue=Math.sqrt(sg.reduce(function(a,v){return a+v*v;},0)),N=nS.get();
      /* (a) 予算 */
      var bx=nar?150:150,by=26,bw=nar?190:170;
      o.push(S.T(nar?10:14,16,"(a) 誤差の予算（1σ）","start",10,"ink",true));
      var vmax=Math.max(4,ue*1.1);
      sg.forEach(function(v,i){var yy=by+i*22,c=_W07_SRC[i][1];o.push(S.T(bx-6,yy+11,_W07_SRC[i][0],"end",9.5,c,true));o.push(S.RECT(bx,yy,Math.max(0.5,bw*v/vmax),14,2,U.soft(c),c,1));o.push(S.T(bx+bw*v/vmax+4,yy+11,_w07_f(v,2)+" m","start",9.5,c,true));});
      var yu=by+5*22+4;o.push(S.T(bx-6,yu+11,"UERE","end",10,"ink",true));o.push(S.RECT(bx,yu,bw*ue/vmax,14,2,"ink","ink",1));o.push(S.T(bx+bw*ue/vmax+4,yu+11,_w07_f(ue,2)+" m","start",10,"ink",true));
      /* 分散の割合 */
      var yv=yu+30,tot=ue*ue||1,xx=nar?10:14,ww=nar?370:310;o.push(S.T(xx,yv,"分散（2 乗）の割合","start",9.5,"muted",true));
      sg.forEach(function(v,i){var w=ww*v*v/tot;if(w>0.3)o.push(S.RECT(xx,yv+6,w,14,0,U.soft(_W07_SRC[i][1]),_W07_SRC[i][1],1));if(w>34)o.push(S.T(xx+w/2,yv+17,_w07_f(100*v*v/tot,0)+" %","middle",9,_W07_SRC[i][1],true));xx+=w;});
      /* 散らばり */
      var px=nar?54:390,py=nar?yv+60:26,pw=nar?260:220;
      o.push(S.T(px-40,py-10,"(b) 水平の位置の誤差","start",10,"ink",true));
      if(!geo){box.set(S.svg(Wd,py+40,o.concat([S.T(px,py+20,"解けない並び","start",11,"alias",true)])));ro.innerHTML="";return;}
      var H=geo.H,A=geo.A,m=A[0].length,HD=Math.sqrt(H[0][0]+H[1][1]),VD=Math.sqrt(H[2][2]);
      var e3=_w07_ell(H[0][0]*ue*ue,H[0][1]*ue*ue,H[1][1]*ue*ue),s1=e3[0],s2=e3[1],drms=HD*ue;
      var cep=s1>0?_w07_rad(U,0.5,s1,s2):0,r95=s1>0?_w07_rad(U,0.95,s1,s2):0,p2=s1>0?_w07_pin(U,2*drms,s1,s2):1;
      var rng=U.rng(seed*7919+11),E=[],cin=[0,0,0],sh=0,ups=[];
      for(var t=0;t<N;t++){var eta=[];for(var i=0;i<m;i++){var s=0;for(var k=0;k<5;k++)s+=sg[k]*rng.normal();eta.push(s);}
        var x=0,y=0,u=0;for(var j=0;j<m;j++){x+=A[0][j]*eta[j];y+=A[1][j]*eta[j];u+=A[2][j]*eta[j];}
        var d=Math.hypot(x,y);if(d<=cep)cin[0]++;if(d<=r95)cin[1]++;if(d<=2*drms)cin[2]++;sh+=d*d;ups.push(Math.abs(u));if(t<1500)E.push([x,y,u]);}
      ups.sort(function(a,b){return a-b;});var u95=ups[Math.floor(0.95*N)];
      var lim=_w07_nice(Math.max(1,2.3*drms)),P=U.plot(px,py,pw,pw,[-lim,lim],[-lim,lim]);
      o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));o.push(P.axes({xt:[-lim,-lim/2,0,lim/2,lim],yt:[-lim,-lim/2,0,lim/2,lim],sz:9}));
      E.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"gold",1.1));});
      function circ(r,c,dash){var p=[];for(var i=0;i<=96;i++){var a=2*Math.PI*i/96;p.push([r*Math.cos(a),r*Math.sin(a)]);}return P.clip(p,c,1.8,dash);}
      if(cE.get())o.push(P.clip(_w07_ellpts(s1,s2,e3[2],1),"purple",1.8));
      if(cC.get())o.push(circ(cep,"signal",null));if(cR.get())o.push(circ(r95,"alias",null));if(c2.get())o.push(circ(2*drms,"ink","5 3"));
      o.push(S.L(P.X(0)-5,P.Y(0),P.X(0)+5,P.Y(0),"green",2));o.push(S.L(P.X(0),P.Y(0)-5,P.X(0),P.Y(0)+5,"green",2));
      o.push(S.T(P.x+P.w/2,P.y+P.h+28,"東西（横）・南北（縦）[m]","middle",9,"muted"));
      /* 上下 */
      var vx=P.x+P.w+(nar?26:30),vl=_w07_nice(Math.max(1,2.4*VD*ue)),Q=U.plot(vx,py,40,pw,[0,1],[-vl,vl]),jr=U.rng(seed+5);
      o.push(S.RECT(vx,py,40,pw,3,"var(--screen)","line",1));o.push(S.T(vx+20,py-10,"上下","middle",10,"ink",true));
      [-vl,0,vl].forEach(function(v){o.push(S.T(vx+44,Q.Y(v)+3,_w07_f(v,v%1?1:0),"start",8.5,"muted"));});
      E.forEach(function(q){if(Math.abs(q[2])<vl)o.push(S.D(vx+6+28*jr.next(),Q.Y(q[2]),"gold",1.0));});
      [1,-1].forEach(function(sgn){o.push(S.L(vx,Q.Y(sgn*1.96*VD*ue),vx+40,Q.Y(sgn*1.96*VD*ue),"alias",1.6,"4 2"));});
      var Hh=py+pw+(nar?44:44);
      o.push(S.LEGL(nar?10:px-40,Hh,[["purple",null,"楕円"],["signal",null,"CEP"],["alias",null,"R95"],["ink","5 3","2DRMS"],["alias","4 2","上下 95 %"]],9,10));
      box.set(S.svg(Wd,Hh+8,o));
      /* 読み出し */
      var rows=[["水平の DRMS",_w07_f(drms,2)+" m",_w07_f(Math.sqrt(sh/N),2)+" m"],["CEP（50 %）",_w07_f(cep,2)+" m","中に "+_w07_f(100*cin[0]/N,1)+" %"],
        ["R95（95 %）",_w07_f(r95,2)+" m","中に "+_w07_f(100*cin[1]/N,1)+" %"],["2DRMS",_w07_f(2*drms,2)+" m（"+_w07_f(100*p2,1)+" %）","中に "+_w07_f(100*cin[2]/N,1)+" %"],
        ["上下の 95 %",_w07_f(1.96*VD*ue,2)+" m",_w07_f(u95,2)+" m"]];
      var h="UERE = √(Σσ²) = <b>"+_w07_f(ue,2)+" m</b>（単純に足すと "+_w07_f(sg.reduce(function(a,v){return a+v;},0),2)+" m）。HDOP "+_w07_f(HD,2)+"・VDOP "+_w07_f(VD,2)+"（衛星 "+m+" 個）";
      h+=U.tbl(["量","式","シミュレーション（"+N+" 回）"],rows,["left","right","right"]);
      ro.innerHTML=h+'<div class="wnote">どの衛星にも、5 つの源の誤差を、それぞれの σ の正規分布で独立に入れ、線形化した式を最小二乗法で解いた位置の誤差。「式」は、4・5 節の σ²(GᵀG)<sup>−1</sup> と誤差の楕円からの計算（DRMS = HDOP × UERE、上下の 95 % = 1.96 × VDOP × UERE）。衛星の並びは 1 章の近似の配置（東京）。</div>';
    }
    draw();
  };

  /* ===== 08 章 アンテナ — 右旋円偏波・パッチ・地板 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w08_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w08_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w08_db(p){return 10*Math.log10(Math.max(p,1e-30));}
  var _W08_D=Math.PI/180,_W08_C=299792458,_W08_F1=1575.42e6,_W08_F5=1176.45e6,_W08_CID=0;
  /* 枠 (x, y, w, h) の外を切って描く */
  function _w08_clip(x,y,w,h,body){var id="w08cp"+(++_W08_CID);return '<clipPath id="'+id+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/></clipPath><g clip-path="url(#'+id+')">'+body+'</g>';}
  /* 例のアンテナ（図と同じ。上の半分は 3 章の値、下の半分と左旋はこの章で足した例の値）。返り値 [右旋, 左旋]（真数） */
  function _w08_ga3(el){return 3-8*Math.pow((90-el)/85,2);}
  function _w08_ex(el){var s=Math.sin(Math.abs(el)*_W08_D),r=(1-s)/(1+s);
    if(el>=0){var gr=Math.pow(10,_w08_ga3(el)/10);return [gr,gr*r*r];}
    var g0=10*Math.log10(2*Math.pow(10,_w08_ga3(0)/10)),gt=Math.pow(10,(g0+(-13-g0)*Math.sqrt(s))/10);
    return [gt*r*r/(1+r*r),gt/(1+r*r)];}
  /* 誘電体（比誘電率 er、損失なし）の面の反射係数 [Γ_H, Γ_V]。psi は面とのなす角 [rad]。er ≥ 1e8 は金属 */
  function _w08_fres(er,psi){if(er>=1e8)return [-1,1];var s=Math.sin(psi),q=Math.sqrt(er-Math.cos(psi)*Math.cos(psi));return [(s-q)/(s+q),(er*s-q)/(er*s+q)];}
  /* 共振の応答 K = 1/(1 + jQ(f/fk − fk/f)) を [実部, 虚部] で */
  function _w08_K(f,fk,Q){var x=Q*(f/fk-fk/f),d=1+x*x;return [1/d,-x/d];}
  /* 1 点給電の円偏波のパッチ（2 つのモードの共振回路を直列。L1 で 50 Ω）。kind: 0 円偏波、1 直線偏波（1 つのモード）。
     返り値 {Z:[R,X], G:[re,im], PR, PL}（PR・PL は 1 V・50 Ω の信号源で送ったときの右旋・左旋の電力。合っているとき PR = 0.25） */
  function _w08_patchZ(f,f0,Q,kind){var ku,kv;
    if(kind===0){ku=_w08_K(f,f0*(1-1/(2*Q)),Q);kv=_w08_K(f,f0*(1+1/(2*Q)),Q);}else{ku=_w08_K(f,f0,Q);kv=[0,0];}
    var Z=[50*(ku[0]+kv[0]),50*(ku[1]+kv[1])];return _w08_zout(Z,ku,kv);}
  function _w08_zout(Z,ku,kv){var nr=Z[0]-50,ni=Z[1],dr=Z[0]+50,di=Z[1],dd=dr*dr+di*di,G=[(nr*dr+ni*di)/dd,(ni*dr-nr*di)/dd];
    var ir=dr/dd,ii=-di/dd,PR=0,PL=0;
    if(ku){var vu=[50*(ir*ku[0]-ii*ku[1]),50*(ir*ku[1]+ii*ku[0])],vv=[50*(ir*kv[0]-ii*kv[1]),50*(ir*kv[1]+ii*kv[0])];
      /* 右旋 ∝ |Vu − jVv|、左旋 ∝ |Vu + jVv| */
      var rr=vu[0]+vv[1],ri=vu[1]-vv[0],lr=vu[0]-vv[1],li=vu[1]+vv[0];PR=(rr*rr+ri*ri)/2;PL=(lr*lr+li*li)/2;}
    return {Z:Z,G:G,PR:PR,PL:PL};}
  function _w08_ar(PR,PL){var a=Math.sqrt(PR),b=Math.sqrt(PL);return 20*Math.log10((a+b)/Math.max(Math.abs(a-b),1e-12));}
  /* 衛星の印（図と同じ見た目） */
  function _w08_sat(U,x,y,c,s){var S=U.S;s=s||1;return S.L(x-9*s,y,x+9*s,y,c,1.1)+S.RECT(x-14*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x+7.5*s,y-3.2*s,6.5*s,6.4*s,1,U.soft(c),c,1)+S.RECT(x-3.6*s,y-3.6*s,7.2*s,7.2*s,1.5,c,c,1);}
  /* 横から見たパッチ（地板・誘電体・パッチ）。(x, y) は地板の上面の中心 */
  function _w08_patchicon(U,x,y,w){var S=U.S;return S.RECT(x-w/2,y,w,4,1,U.soft("muted"),"muted",1)+S.RECT(x-w*0.28,y-7,w*0.56,7,1,U.soft("gold"),"gold",1)+S.L(x-w*0.24,y-7.5,x+w*0.24,y-7.5,"gold",2.2);}

  /* ---- 2 節: 偏波 ---- */
  REG.w08_pol=function(el,U){
    var S=U.S;
    U.head(el,"POLARIZATION","偏波 — 電界の回る向きと、受ける電力");
    var r1=U.ctrls(el);
    var wv=U.select(r1,"電波",["右旋円偏波","左旋円偏波","直線偏波（横）","楕円偏波（右旋 + 左旋）"],0,function(){draw();});
    var an=U.select(r1,"アンテナ",["右旋（理想）","右旋（軸比 3 dB）","直線偏波（横）","左旋（理想）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var kr=U.slider(r2,"楕円の左旋の振幅 a<sub>L</sub>/a<sub>R</sub>",{min:0,max:1,step:0.05,value:0.3,fmt:function(v){var ar=(1+v)/Math.max(1-v,1e-9);return _w08_f(v,2)+"（軸比 "+(v>=0.999?"∞":_w08_f(20*Math.log10(ar),1)+" dB")+"）";},onInput:function(){if(wv.get()!==3)wv.set(3);draw();}});
    var rf=U.checkbox(r2,"金属で反射させてから受ける",false,function(){draw();});
    var br=U.btnrow(el),ph=0;
    var tick=U.ticker(function(){ph=(ph+0.07)%(2*Math.PI);draw();},50);
    U.button(br,"本文の例（右旋の電波を右旋で受ける）",function(){tick.stop();ph=0;wv.set(0);an.set(0);kr.set(0.3);rf.set(false);draw();});
    U.button(br,"直線偏波のアンテナで受ける",function(){wv.set(0);an.set(2);draw();});
    U.button(br,"金属で反射した電波",function(){wv.set(0);an.set(0);rf.set(true);draw();});
    U.button(br,"再生（電界を回す）",function(){tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    var box=U.svgbox(el),ro=U.readout(el);
    var KA=(Math.pow(10,3/20)-1)/(Math.pow(10,3/20)+1);   /* 軸比 3 dB のアンテナの左旋の割合 0.171 */
    /* 電波の横と縦の成分の振幅: 横 = X sin ωt、縦 = Y cos ωt（電力 (X² + Y²)/2 = 1） */
    function wave(k){var w=k==null?wv.get():k,X,Y;
      if(w===0){X=1;Y=1;}else if(w===1){X=-1;Y=1;}else if(w===2){X=Math.SQRT2;Y=0;}
      else{var q=kr.get(),aR=1/Math.sqrt(1+q*q),aL=q/Math.sqrt(1+q*q);X=aR-aL;Y=aR+aL;}
      if(rf.get())X=-X;   /* 金属の反射: 横（面に沿う成分）の符号が変わる */
      return [X,Y];}
    /* アンテナの 2 つの受け口の重み: 出力 = a·横 + b·（90° 遅らせた縦） */
    function antw(k){if(k===0)return [1/Math.SQRT2,1/Math.SQRT2];if(k===3)return [-1/Math.SQRT2,1/Math.SQRT2];if(k===2)return [1,0];
      var n=Math.sqrt(1+KA*KA);return [(1-KA)/Math.SQRT2/n,(1+KA)/Math.SQRT2/n];}
    /* 受ける電力（電波の電力 1 に対する割合）。90° 遅らせた縦は Y cos(ωt − 90°) = Y sin ωt なので、出力は (aX + bY) sin ωt */
    function recv(W,k){var a=antw(k),A=a[0]*W[0]+a[1]*W[1];return A*A/2;}
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],W=wave(),k=an.get(),X=W[0],Y=W[1];
      var aR=(X+Y)/2,aL=(Y-X)/2,ar=(Math.abs(aR)+Math.abs(aL))/Math.max(Math.abs(Math.abs(aR)-Math.abs(aL)),1e-12);
      var sense=Math.abs(Math.abs(aR)-Math.abs(aL))<1e-9?"向きは一定（直線偏波）":(Math.abs(aR)>Math.abs(aL)?"時計回り → 右旋":"反時計回り → 左旋");
      /* (a) 電界の向き */
      var cx=nar?120:130,cy=nar?140:150,R=78;
      o.push(S.T(nar?10:14,18,rf.get()?"(a) 反射した後の電界（反射波の進む向きに見る）":"(a) 電界の向き（電波の進む向きに見る）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,R,"faint",1,null,"3 3"));o.push(S.L(cx-R-10,cy,cx+R+10,cy,"grid",1));o.push(S.L(cx,cy-R-10,cx,cy+R+10,"grid",1));
      o.push(S.T(cx+R+12,cy+4,"横","start",9.5,"muted",true));o.push(S.T(cx,cy-R-14,"縦","middle",9.5,"muted",true));
      var sc=R/Math.SQRT2*0.98,tr=[],i;
      for(i=0;i<=120;i++){var t=2*Math.PI*i/120;tr.push([cx+sc*X*Math.sin(t),cy-sc*Y*Math.cos(t)]);}
      var col=Math.abs(aR)>=Math.abs(aL)+1e-9?"signal":(Math.abs(aL)>Math.abs(aR)+1e-9?"alias":"muted");
      o.push(S.PL(tr,col,1.2,null,"4 3"));
      var ex=cx+sc*X*Math.sin(ph),ey=cy-sc*Y*Math.cos(ph);
      if(Math.hypot(ex-cx,ey-cy)>3)o.push(S.ARR(cx,cy,ex,ey,col,2.6,9));else o.push(S.D(cx,cy,col,3));
      if(Math.abs(Math.abs(aR)-Math.abs(aL))>1e-9){var t2=ph+0.35,fx=cx+sc*X*Math.sin(t2),fy=cy-sc*Y*Math.cos(t2),t1=ph+0.25,gx=cx+sc*X*Math.sin(t1),gy=cy-sc*Y*Math.cos(t1);o.push(S.head(gx,gy,fx,fy,col,8));}
      o.push(S.T(cx,cy+R+30,sense,"middle",10,col,true));
      o.push(S.TX(cx,cy+R+48,"a_R = "+_w08_f(Math.abs(aR),3)+"、a_L = "+_w08_f(Math.abs(aL),3)+"、軸比 "+(ar>1e6?"∞":_w08_f(20*Math.log10(ar),1)+" dB"),"middle",9.5,"ink"));
      /* (b) 2 つの受け口の波形 */
      var px=nar?50:330,py=nar?cy+R+84:40,pw=nar?330:330,phh=150,a=antw(k);
      o.push(S.T(px-36,py-12,"(b) アンテナの 2 つの受け口と出力（"+["右旋","右旋・軸比 3 dB","直線（横）","左旋"][k]+"）","start",10.5,"ink",true));
      var P=U.plot(px,py,pw,phh,[0,2*Math.PI],[-2.1,2.1]);
      o.push(P.axes({xt:[0,Math.PI,2*Math.PI],yt:[-2,-1,0,1,2],xfmt:function(v){return v<0.1?"0":(v<4?"T/2":"T");},yfmt:function(v){return _w08_f(v,0);}}));
      var b1=[],b2=[],sm=[];
      for(i=0;i<=180;i++){var tt=2*Math.PI*i/180,h1=a[0]*X*Math.sin(tt),h2=a[1]*Y*Math.cos(tt-Math.PI/2);b1.push([tt,h1]);b2.push([tt,h2]);sm.push([tt,h1+h2]);}
      o.push(P.line(b1,"teal",1.6));o.push(P.line(b2,"purple",1.6,"4 3"));o.push(P.line(sm,"ink",2.6));
      o.push(S.L(P.X(ph),P.y,P.X(ph),P.y+P.h,"gold",1.2,"2 3"));
      o.push(S.LEGL(px-30,py+phh+40,[["teal",null,"横の受け口"],["purple","4 3","縦（90° 遅らせる）"],["ink",null,"和（出力）"]],9.5,12));
      var p=recv(W,k);
      o.push(S.T(px-30,py+phh+64,"受ける電力: "+_w08_f(p,3)+"（"+(p<1e-9?"−∞":_w08_f(_w08_db(p),2))+" dB）","start",11,p>0.9?"green":(p<0.1?"alias":"gold"),true));
      box.set(S.svg(Wd,nar?py+phh+76:Math.max(cy+R+60,py+phh+76),o));
      /* 読み出し: 4 つのアンテナで受ける電力 */
      var names=["右旋（理想）","右旋（軸比 3 dB）","直線偏波（横）","左旋（理想）"],rows=[];
      for(var j=0;j<4;j++){var pj=recv(W,j);rows.push([(j===k?"<b>":"")+names[j]+(j===k?"</b>":""),_w08_f(pj,3),pj<1e-9?"−∞ dB":_w08_f(_w08_db(pj),2)+" dB"]);}
      var h="電波（"+(rf.get()?"金属で反射した後。":"")+"電力 1）: 右旋の振幅 a<sub>R</sub> = "+_w08_f(Math.abs(aR),3)+"、左旋の振幅 a<sub>L</sub> = "+_w08_f(Math.abs(aL),3)+"、電力の割合は右旋 "+_w08_f(aR*aR,3)+"・左旋 "+_w08_f(aL*aL,3)+"<br>";
      h+=U.tbl(["アンテナ","受ける電力","dB"],rows,["left","right","right"]);
      ro.innerHTML=h+'<div class="wnote">アンテナは、横と縦の 2 つの受け口の出力を、縦を 90° 遅らせて足すもの（2 節）とした。軸比 3 dB のアンテナは、右旋の理想のアンテナと左旋の理想のアンテナを、振幅の比 1 : 0.171 で組み合わせた。金属の反射は、面に沿う横の成分の符号を変える（Γ<sub>H</sub> = −1、Γ<sub>V</sub> = +1）として、反射波の進む向きに見た。</div>';
    }
    draw();
  };

  /* ---- 2 節: 反射と γ ---- */
  REG.w08_reflect=function(el,U){
    var S=U.S;
    U.head(el,"REFLECTION","反射波の偏波と、反射波と直接波の振幅の比 γ");
    var r1=U.ctrls(el);
    var th=U.slider(r1,"衛星の仰角 θ",{min:2,max:88,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var sf=U.seg(r1,["地面で反射","壁で反射"],0,function(){draw();});
    var r2=U.ctrls(el);
    var er=U.slider(r2,"面の比誘電率 ε<sub>r</sub>",{values:[2,3,4,6,10,20,40,80,1e9],value:4,fmt:function(v){return v>=1e8?"金属":String(v);},onInput:function(){draw();}});
    var an=U.select(r2,"アンテナ",["例のアンテナ（右旋）","直線偏波（向きによらず 0 dBi）","例のアンテナの下をさらに 10 dB 下げた"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（地面・εr 4・仰角 30°）",function(){th.set(30);sf.set(0);er.set(4);an.set(0);draw();});
    U.button(br,"低い衛星（仰角 10°）",function(){th.set(10);sf.set(0);er.set(4);draw();});
    U.button(br,"壁（εr 6・仰角 30°）",function(){th.set(30);sf.set(1);er.set(6);draw();});
    U.button(br,"金属の壁",function(){sf.set(1);er.set(1e9);draw();});
    var box=U.svgbox(el),ro=U.readout(el),GEO=null,drg=false;
    function gains(e,k){var g=_w08_ex(e);if(k===1)return [0.5,0.5];if(k===2&&e<0)return [g[0]*0.1,g[1]*0.1];return g;}
    function calc(t,s,e,k){var psi=s===0?t:90-t,G=_w08_fres(e,psi*_W08_D),R=(G[1]+G[0])/2,L=(G[1]-G[0])/2,g=gains(s===0?-t:t,k),gd=gains(t,k)[0];
      return {psi:psi,GH:G[0],GV:G[1],R:R,L:L,g:g,gd:gd,gam:Math.sqrt((R*R*g[0]+L*L*g[1])/gd)};}
    U.ctl.drag(box,function(type,x,y){if(!GEO)return false;
      if(type==="down"){if(Math.hypot(x-GEO.sx,y-GEO.sy)>22)return false;drg=true;return true;}
      if(type==="move"&&drg){var a=Math.atan2(GEO.ay-y,GEO.ax-x)/_W08_D;th.set(Math.max(2,Math.min(88,Math.round(a))));draw();return;}
      if(type==="up")drg=false;});
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],t=th.get(),s=sf.get(),e=er.get(),k=an.get(),c=calc(t,s,e,k);
      /* (a) 反射の向き */
      var gw=nar?400:310,gy=nar?200:210,ax=s===0?(nar?230:190):(nar?200:170),ay=gy-56,Rs=nar?150:150;
      o.push(S.T(10,18,"(a) "+(s===0?"地面で反射（地平線より下から来る）":"壁で反射（上の半分の横から来る）")+"。衛星をドラッグ","start",10.5,"ink",true));
      var q=[],ux=-Math.cos(t*_W08_D),uy=-Math.sin(t*_W08_D),sx=ax+Rs*ux,sy=ay+Rs*uy,wx=gw-28;
      if(s===0){q.push(S.RECT(4,gy,gw-8,10,0,U.soft("muted"),"muted",1));}
      else{q.push(S.RECT(4,gy,gw-8,10,0,U.soft("muted"),"none",0));q.push(S.RECT(wx,30,12,gy-30,0,U.soft("muted"),"muted",1));}
      q.push(S.L(ax,gy,ax,ay+4,"muted",1.4));q.push(_w08_patchicon(U,ax,ay,28));
      /* 反射点: 鏡に映したアンテナの像から、衛星の向きに引いた線と面の交わり */
      var ix,iy,P;
      if(s===0){ix=ax;iy=2*gy-ay;var tp=(iy-gy)/(-uy);P=[ix+tp*ux,gy];}
      else{ix=2*wx-ax;iy=ay;var tq=(ix-wx)/(-ux);P=[wx,iy+tq*uy];}
      var far=600;
      q.push(S.L(P[0]+far*ux,P[1]+far*uy,P[0],P[1],"alias",1.4,"5 3"));
      q.push(S.ARR(P[0],P[1],ax-3*(P[0]>ax?-1:1),ay+(s===0?6:-6),"alias",1.8,8));
      q.push(S.ARR(sx,sy,ax+ux*-8,ay+uy*-8-4,"signal",1.8,8));
      o.push(_w08_clip(0,26,gw,gy+16-26,q.join("")));
      o.push(_w08_sat(U,sx,sy,"signal",1.1));GEO={sx:sx,sy:sy,ax:ax,ay:ay};
      o.push(S.T(sx,sy-12,"θ = "+t+"°","middle",9.5,"signal",true,false,null,true));
      o.push(S.T(10,gy+30,(s===0?"地面":"壁")+"（εr "+(e>=1e8?"金属":e)+"）。面とのなす角 ψ = "+c.psi+"°","start",9.5,"ink",true));
      o.push(S.LEGL(10,gy+50,[["signal",null,"直接波"],["alias","5 3","反射波"]],9.5,14));
      /* (b) 反射係数と ψ */
      var px=nar?50:380,py=nar?gy+86:40,pw=nar?330:290,ph=nar?110:100;
      o.push(S.T(px-40,py-12,"(b) 反射係数（右: 面とのなす角）","start",10.5,"ink",true));
      var P1=U.plot(px,py,pw,ph,[0,90],[-1,1]);
      o.push(P1.axes({xt:[0,15,30,45,60,75,90],yt:[-1,-0.5,0,0.5,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w08_f(v,1);}}));
      var lh=[],lv=[],i;for(i=0;i<=180;i++){var ps=i/2,G=_w08_fres(e,ps*_W08_D);lh.push([ps,G[0]]);lv.push([ps,G[1]]);}
      o.push(P1.line(lh,"teal",1.8,"5 3"));o.push(P1.line(lv,"purple",2.2));
      if(e<1e8){var pb=Math.atan(1/Math.sqrt(e))/_W08_D;o.push(S.D(P1.X(pb),P1.Y(0),"purple",3.6));o.push(S.T(P1.X(pb)+4,P1.Y(0)+13,"ブルースター "+_w08_f(pb,1)+"°","start",9,"purple",true,false,null,true));}
      o.push(S.L(P1.X(c.psi),P1.y,P1.X(c.psi),P1.y+P1.h,"gold",1.2,"3 3"));
      o.push(S.D(P1.X(c.psi),P1.Y(c.GV),"purple",4.4));o.push(S.D(P1.X(c.psi),P1.Y(c.GH),"teal",4.4));
      o.push(S.LEGL(px-10,py+ph+32,[["purple",null,"Γ_V（垂直）"],["teal","5 3","Γ_H（水平）"]],9.5,12));
      /* (c) γ と仰角 */
      var qx=px,qy=nar?py+ph+70:py+ph+70,qh=nar?110:100;
      o.push(S.T(qx-40,qy-12,"(c) γ と衛星の仰角","start",10.5,"ink",true));
      var P2=U.plot(qx,qy,pw,qh,[2,88],[0,1]);
      o.push(P2.axes({xl:"衛星の仰角 θ [°]",xt:[2,20,40,60,88],yt:[0,0.25,0.5,0.75,1],xfmt:function(v){return String(v);},yfmt:function(v){return _w08_f(v,2);}}));
      var l1=[],l2=[];for(i=2;i<=88;i++){l1.push([i,calc(i,s,e,k).gam]);l2.push([i,calc(i,s,e,1).gam]);}
      o.push(S.L(P2.x,P2.Y(0.5),P2.x+P2.w,P2.Y(0.5),"muted",1,"2 3"));
      if(k!==1)o.push(P2.clip(l2,"muted",1.6,"5 3"));
      o.push(P2.clip(l1,k===1?"muted":"gold",2.4));
      o.push(S.D(P2.X(t),P2.Y(Math.min(1,c.gam)),"gold",4.6));
      o.push(S.T(P2.X(t)+6,P2.Y(Math.min(1,c.gam))-7,"γ = "+_w08_f(c.gam,2),"start",9.5,"gold",true,false,null,true));
      if(k!==1)o.push(S.T(P2.x+P2.w,P2.y-3,"破線: 直線偏波のアンテナ","end",9,"muted"));
      box.set(S.svg(Wd,nar?qy+qh+44:Math.max(gy+60,qy+qh+44),o));
      /* 読み出し */
      var dR=20*Math.log10(Math.max(Math.abs(c.R),1e-9)),dL=20*Math.log10(Math.max(Math.abs(c.L),1e-9)),gm=c.gam;
      var h="ψ = "+c.psi+"°: Γ<sub>H</sub> = "+_w08_f(c.GH,3)+"、Γ<sub>V</sub> = "+_w08_f(c.GV,3)+" → 反射波の右旋の分 Γ<sub>R</sub> = (Γ<sub>V</sub> + Γ<sub>H</sub>)/2 = "+_w08_f(c.R,3)+"（"+(Math.abs(c.R)<1e-6?"−∞":_w08_f(dR,1))+" dB）、左旋の分 Γ<sub>L</sub> = (Γ<sub>V</sub> − Γ<sub>H</sub>)/2 = "+_w08_f(c.L,3)+"（"+(Math.abs(c.L)<1e-6?"−∞":_w08_f(dL,1))+" dB）<br>";
      h+="アンテナの利得: 直接波（仰角 "+t+"°、右旋）"+_w08_f(_w08_db(c.gd),1)+" dBi、反射波の来る向き（仰角 "+(s===0?"−":"")+t+"°）の右旋 "+_w08_f(_w08_db(c.g[0]),1)+" dBi・左旋 "+_w08_f(_w08_db(c.g[1]),1)+" dBi<br>";
      h+="反射波と直接波の振幅の比 <b>γ = "+_w08_f(gm,3)+"</b>";
      if(gm<1){h+=" → 7 章の誤差の最大 γ × 146.5 m: 間隔 1 チップで <b>"+_w08_f(gm*146.5,1)+" m</b>、0.1 チップで "+_w08_f(gm*14.65,1)+" m。C/N0 の揺れ 20 log<sub>10</sub>(1 ± γ): <b>+"+_w08_f(20*Math.log10(1+gm),1)+"〜"+_w08_f(20*Math.log10(1-gm),1)+" dB</b>";}
      else h+="（反射波が直接波より強い）";
      ro.innerHTML=h+'<div class="wnote">平らで損失の無い面（フレネルの式）とした。反射波の右旋と左旋の分は、アンテナの出力で電力として足した目安である。例のアンテナは 1 節の図の値（下の半分と左旋は例の値）。7 章の誤差の最大は γΔ<sub>EL</sub>cT<sub>c</sub>/2。</div>';
    }
    draw();
  };

  /* ---- 3・4 節: パッチの寸法・円偏波・地板 ---- */
  /* 地板の一辺ごとの、上下の成分の 2 次元の指向性 [0.1 dB]（無限の地板の真上を 0。仰角 −90〜90° を 1° ごと）。
     比誘電率 20 の L1 のパッチを、地板の中心に置いて 2 次元のモーメント法で計算した値（図 e08_gpsize と同じ。f08.py の _f08_gp） */
  var _W08_GP={"30":[-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-31,-32,-32,-32,-32,-32,-32,-32,-32,-33,-33,-33,-33,-33,-33,-33,-34,-34,-34,-34,-34,-35,-35,-35,-35,-35,-35,-35,-36,-36,-36,-36,-36,-36,-37,-37,-37,-37,-37,-37,-38,-38,-38,-38,-38,-38,-38,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-39,-38,-38,-38,-38,-38,-38,-38,-37,-37,-37,-37,-37,-37,-36,-36,-36,-36,-35,-35,-35,-35,-35,-34,-34,-34,-34,-33,-33,-33,-33,-32,-32,-32,-32,-31,-31,-31,-31,-30,-30,-30,-30,-29,-29,-29,-29,-29,-28,-28,-28,-28,-27,-27,-27,-27,-27,-27,-26,-26,-26,-26,-26,-26,-25,-25,-25,-25,-25,-25,-25,-25,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24,-24],
    "40":[-32,-32,-32,-32,-32,-32,-32,-32,-32,-32,-33,-33,-33,-33,-33,-33,-33,-34,-34,-34,-34,-34,-35,-35,-35,-35,-35,-36,-36,-36,-37,-37,-37,-37,-38,-38,-38,-38,-39,-39,-39,-40,-40,-40,-41,-41,-41,-42,-42,-42,-42,-43,-43,-43,-43,-44,-44,-44,-44,-45,-45,-45,-45,-45,-46,-46,-46,-46,-46,-46,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-47,-46,-46,-46,-46,-46,-46,-46,-45,-45,-45,-44,-44,-44,-44,-43,-43,-43,-42,-42,-42,-41,-41,-41,-40,-39,-39,-39,-38,-38,-38,-37,-36,-36,-36,-35,-35,-34,-34,-33,-33,-32,-32,-31,-31,-30,-30,-29,-29,-28,-28,-27,-27,-27,-26,-25,-25,-25,-24,-24,-23,-23,-23,-22,-22,-21,-21,-21,-20,-20,-20,-19,-19,-19,-19,-18,-18,-18,-17,-17,-17,-17,-17,-16,-16,-16,-16,-16,-16,-15,-15,-15,-15,-15,-15,-15,-15,-15,-15],
    "50":[-36,-36,-36,-36,-36,-36,-36,-37,-37,-37,-37,-37,-37,-38,-38,-38,-38,-38,-39,-39,-40,-40,-40,-40,-41,-41,-41,-42,-42,-43,-43,-43,-44,-44,-45,-45,-46,-46,-47,-47,-48,-48,-49,-49,-50,-50,-51,-51,-52,-52,-52,-53,-53,-54,-54,-54,-55,-55,-56,-56,-56,-57,-57,-57,-57,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-58,-57,-57,-57,-57,-56,-56,-56,-55,-55,-54,-54,-53,-53,-52,-52,-51,-51,-50,-50,-49,-48,-48,-47,-46,-45,-45,-44,-43,-42,-42,-41,-40,-39,-39,-38,-37,-36,-36,-35,-34,-33,-32,-32,-31,-30,-29,-29,-28,-27,-26,-26,-25,-24,-23,-22,-22,-21,-20,-20,-19,-19,-18,-17,-17,-16,-16,-15,-15,-14,-14,-13,-13,-12,-12,-11,-11,-11,-10,-10,-9,-9,-9,-8,-8,-8,-7,-7,-7,-7,-6,-6,-6,-6,-6,-6,-6,-5,-5,-5,-5,-5,-5],
    "60":[-43,-43,-43,-43,-43,-43,-43,-44,-44,-44,-44,-45,-45,-45,-45,-46,-46,-46,-47,-47,-48,-48,-49,-49,-50,-50,-51,-51,-52,-53,-53,-54,-54,-55,-56,-56,-57,-58,-59,-60,-60,-61,-61,-62,-63,-63,-64,-65,-66,-66,-67,-67,-68,-69,-69,-70,-70,-71,-71,-72,-72,-72,-73,-73,-73,-73,-73,-73,-73,-73,-73,-73,-73,-73,-72,-72,-72,-71,-71,-70,-70,-69,-69,-68,-67,-66,-66,-65,-64,-63,-62,-61,-60,-59,-58,-57,-56,-55,-54,-53,-52,-51,-49,-48,-48,-47,-46,-44,-43,-42,-41,-40,-39,-38,-36,-36,-35,-34,-33,-31,-31,-30,-29,-27,-26,-26,-25,-23,-22,-22,-21,-20,-19,-18,-17,-17,-15,-15,-14,-13,-13,-12,-11,-10,-10,-9,-8,-7,-7,-6,-6,-5,-5,-4,-4,-3,-3,-2,-2,-1,-1,-1,0,0,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3],
    "70":[-52,-52,-52,-52,-52,-52,-52,-53,-53,-53,-53,-54,-54,-55,-55,-55,-56,-57,-57,-58,-59,-59,-60,-60,-61,-62,-63,-63,-64,-66,-66,-67,-68,-69,-70,-71,-72,-73,-74,-75,-76,-77,-78,-79,-80,-81,-82,-83,-84,-84,-85,-86,-87,-88,-88,-89,-90,-90,-91,-91,-91,-92,-92,-92,-92,-92,-92,-91,-91,-91,-90,-90,-89,-89,-87,-87,-86,-85,-84,-83,-82,-81,-80,-78,-77,-76,-75,-73,-71,-71,-69,-68,-66,-64,-64,-62,-60,-59,-58,-57,-55,-54,-52,-50,-50,-48,-47,-45,-44,-43,-41,-40,-39,-38,-36,-35,-34,-33,-31,-29,-29,-28,-27,-25,-24,-23,-22,-20,-19,-19,-18,-17,-15,-14,-14,-13,-11,-11,-10,-9,-8,-7,-6,-6,-5,-4,-3,-2,-2,-1,-1,0,1,1,2,2,3,4,4,4,5,5,6,6,6,7,7,8,8,8,8,8,9,9,9,9,9,9,9,9,9],
    "80":[-62,-62,-62,-62,-62,-62,-63,-63,-63,-64,-64,-65,-65,-65,-66,-67,-68,-68,-69,-70,-71,-72,-72,-73,-74,-76,-76,-77,-78,-80,-81,-82,-83,-85,-87,-87,-89,-90,-92,-93,-94,-95,-97,-99,-100,-101,-102,-104,-105,-106,-107,-108,-109,-109,-110,-111,-112,-112,-112,-112,-112,-112,-112,-111,-111,-110,-110,-109,-108,-107,-105,-104,-103,-102,-100,-99,-97,-96,-94,-91,-91,-89,-87,-85,-84,-82,-80,-79,-76,-75,-72,-72,-70,-67,-66,-65,-62,-61,-60,-58,-57,-55,-53,-51,-50,-49,-47,-45,-44,-43,-41,-40,-38,-37,-35,-34,-33,-31,-30,-28,-28,-26,-25,-23,-22,-21,-20,-18,-17,-17,-16,-15,-13,-12,-11,-10,-9,-8,-7,-6,-6,-4,-3,-3,-2,-1,0,1,2,2,3,3,4,5,5,6,6,7,8,8,9,9,10,10,10,11,11,12,12,12,12,13,13,13,13,13,13,13,14,14,14],
    "90":[-72,-72,-72,-72,-72,-73,-73,-73,-74,-74,-75,-76,-76,-77,-77,-78,-79,-80,-81,-82,-84,-85,-85,-87,-88,-90,-91,-92,-94,-96,-98,-98,-100,-102,-104,-105,-107,-109,-112,-114,-114,-116,-118,-121,-122,-123,-125,-127,-128,-129,-130,-131,-132,-132,-133,-133,-133,-133,-132,-132,-131,-129,-129,-128,-126,-124,-123,-121,-119,-117,-114,-113,-111,-109,-106,-105,-103,-101,-99,-96,-95,-92,-90,-87,-86,-84,-82,-80,-77,-76,-74,-73,-71,-68,-67,-65,-63,-62,-60,-58,-57,-55,-53,-51,-50,-49,-47,-45,-44,-42,-41,-39,-38,-36,-34,-34,-32,-31,-30,-28,-27,-26,-24,-22,-21,-20,-19,-17,-16,-16,-15,-13,-12,-11,-10,-9,-7,-6,-5,-5,-4,-3,-2,-1,0,1,2,3,3,4,5,5,6,7,7,8,9,10,10,10,11,11,12,12,13,13,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16],
    "100":[-81,-81,-82,-82,-82,-82,-83,-83,-84,-84,-85,-86,-87,-87,-88,-89,-91,-91,-93,-94,-96,-98,-98,-100,-102,-104,-105,-107,-109,-112,-114,-115,-118,-120,-123,-124,-127,-129,-133,-135,-136,-139,-141,-144,-145,-147,-148,-151,-152,-152,-153,-153,-153,-153,-152,-151,-149,-149,-147,-145,-143,-140,-139,-136,-134,-130,-129,-126,-124,-121,-117,-116,-113,-111,-107,-106,-104,-101,-99,-95,-94,-92,-90,-87,-86,-84,-82,-80,-77,-76,-73,-72,-70,-67,-67,-65,-62,-61,-60,-58,-56,-55,-52,-51,-50,-48,-47,-44,-44,-42,-41,-39,-38,-36,-34,-33,-32,-31,-29,-27,-27,-25,-24,-22,-21,-20,-19,-17,-16,-15,-14,-13,-11,-10,-10,-8,-7,-6,-5,-4,-3,-2,-1,0,1,1,3,4,4,5,6,6,7,8,9,9,10,11,12,12,12,13,13,14,14,15,15,16,16,16,17,17,17,17,18,18,18,18,18,18,18],
    "120":[-97,-97,-98,-98,-98,-99,-99,-100,-101,-101,-102,-104,-105,-106,-107,-109,-112,-112,-114,-116,-120,-122,-123,-126,-128,-133,-134,-137,-140,-145,-149,-151,-154,-158,-164,-166,-169,-173,-178,-181,-182,-185,-186,-188,-188,-188,-187,-184,-182,-181,-178,-174,-169,-167,-163,-159,-154,-152,-148,-145,-141,-136,-134,-131,-128,-123,-122,-119,-116,-114,-110,-108,-106,-104,-100,-99,-97,-95,-92,-89,-88,-86,-85,-82,-81,-79,-77,-75,-73,-72,-70,-69,-67,-65,-64,-62,-60,-59,-58,-56,-55,-53,-51,-50,-49,-48,-46,-44,-43,-42,-41,-39,-38,-36,-34,-34,-32,-31,-30,-28,-27,-26,-25,-23,-21,-21,-20,-18,-16,-16,-15,-13,-12,-10,-10,-9,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,6,7,8,9,10,10,11,12,13,13,14,14,15,15,16,16,17,18,18,18,18,19,19,19,19,20,20,20,20,20,20],
    "150":[-115,-115,-116,-116,-117,-117,-118,-120,-121,-122,-124,-127,-129,-130,-132,-135,-140,-141,-145,-148,-154,-159,-161,-166,-171,-179,-182,-188,-195,-204,-210,-213,-219,-223,-226,-226,-225,-222,-215,-209,-206,-199,-193,-183,-180,-174,-169,-161,-156,-153,-149,-145,-139,-137,-133,-130,-125,-123,-120,-117,-115,-111,-110,-107,-105,-102,-101,-99,-97,-95,-92,-91,-90,-88,-86,-85,-83,-82,-80,-78,-78,-76,-75,-73,-72,-71,-70,-68,-67,-66,-64,-64,-62,-61,-60,-59,-57,-56,-55,-54,-53,-52,-50,-49,-48,-47,-46,-44,-43,-42,-41,-40,-38,-37,-35,-35,-34,-32,-31,-29,-29,-28,-26,-24,-23,-23,-21,-20,-18,-18,-17,-15,-14,-12,-12,-11,-9,-8,-7,-6,-5,-3,-2,-2,-1,0,2,3,4,5,6,6,7,8,9,10,11,12,13,13,14,15,15,16,16,17,18,18,19,19,19,20,20,20,21,21,21,21,21,21,21],
    "175":[-110,-110,-111,-111,-112,-113,-114,-116,-117,-118,-121,-124,-127,-128,-132,-135,-141,-143,-147,-152,-160,-166,-169,-176,-183,-194,-198,-206,-213,-223,-227,-228,-228,-226,-217,-214,-207,-199,-188,-181,-177,-171,-164,-156,-153,-148,-144,-137,-133,-131,-128,-124,-120,-118,-115,-113,-109,-108,-106,-103,-101,-99,-98,-96,-94,-92,-91,-90,-88,-87,-85,-84,-83,-82,-80,-80,-79,-78,-77,-75,-74,-73,-72,-71,-70,-69,-68,-67,-66,-65,-64,-63,-62,-61,-60,-59,-57,-57,-56,-55,-54,-52,-51,-50,-49,-48,-47,-45,-44,-43,-42,-41,-40,-39,-37,-36,-35,-34,-33,-31,-30,-29,-28,-26,-25,-24,-23,-21,-20,-20,-18,-17,-15,-14,-14,-12,-11,-9,-8,-8,-7,-5,-4,-3,-2,-1,1,2,3,4,4,5,6,7,8,9,10,12,12,13,14,14,15,16,17,17,18,19,19,19,20,20,21,21,21,22,22,22,22,22,22],
    "200":[-113,-114,-114,-115,-116,-117,-118,-121,-123,-125,-128,-133,-137,-139,-144,-149,-158,-161,-168,-176,-189,-199,-204,-215,-225,-239,-242,-244,-241,-228,-218,-212,-202,-191,-178,-173,-166,-158,-149,-143,-140,-135,-131,-124,-122,-119,-115,-111,-108,-107,-104,-102,-99,-98,-96,-94,-92,-91,-90,-88,-87,-85,-85,-84,-83,-81,-81,-80,-79,-79,-78,-77,-76,-76,-75,-74,-74,-73,-72,-71,-71,-70,-69,-68,-68,-67,-66,-65,-64,-63,-62,-61,-60,-59,-58,-57,-56,-55,-54,-53,-52,-51,-49,-48,-47,-46,-45,-43,-42,-41,-40,-39,-38,-36,-35,-34,-33,-32,-30,-29,-28,-27,-26,-24,-23,-23,-21,-20,-19,-18,-17,-16,-14,-13,-13,-12,-10,-9,-8,-8,-7,-5,-4,-4,-3,-2,0,1,1,2,3,4,5,6,7,7,8,10,10,11,12,12,13,14,15,15,16,17,17,18,18,18,19,19,20,20,20,20,20,20,20],
    "inf":[-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-400,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-5,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-3,-3,-3,-3,-3,-3,-3,-3,-3,-3,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};
  var _W08_GPS=[30,40,50,60,70,80,90,100,120,150,175,200];
  REG.w08_patch=function(el,U){
    var S=U.S;
    U.head(el,"PATCH ANTENNA","パッチの寸法・2 つのモードと軸比・地板の大きさ");
    var r1=U.ctrls(el);
    var er=U.slider(r1,"誘電体の比誘電率 ε<sub>r</sub>",{values:[1,2.2,3,4.4,6.15,10.2,20,37],value:20,fmt:function(v){return String(v);},onInput:function(){draw();}});
    var fq=U.seg(r1,["L1（1575.42 MHz）","L5（1176.45 MHz）"],0,function(){draw();});
    var r2=U.ctrls(el);
    var qq=U.slider(r2,"共振の鋭さ Q",{values:[20,30,50,70,100,150,200],value:100,fmt:function(v){return String(v);},onInput:function(){draw();}});
    var sp=U.slider(r2,"2 つのモードの共振周波数の差（f<sub>0</sub>/Q の何倍か）",{values:[0,0.25,0.5,0.75,1,1.25,1.5,2],value:1,fmt:function(v){return "× "+v;},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var gp=U.slider(r3,"地板の一辺（2 次元の近似）",{values:_W08_GPS.concat([1e9]),value:70,fmt:function(v){return v>=1e8?"無限":v+" mm";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（εr 20・L1・地板 70 mm）",function(){er.set(20);fq.set(0);qq.set(100);sp.set(1);gp.set(70);draw();});
    U.button(br,"FR-4 の基板（εr 4.4）",function(){er.set(4.4);draw();});
    U.button(br,"L5 で同じ Q",function(){fq.set(1);qq.set(100);draw();});
    U.button(br,"L5 で Q = 20",function(){fq.set(1);qq.set(20);draw();});
    U.button(br,"地板 50 mm",function(){gp.set(50);draw();});
    U.button(br,"地板 150 mm",function(){gp.set(150);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],e=er.get(),L5=fq.get()===1,f0=L5?_W08_F5:_W08_F1,Q=qq.get(),k=sp.get(),g=gp.get();
      var lam=_W08_C/f0,ell=lam/(2*Math.sqrt(e)),lamd=lam/Math.sqrt(e),bwh=f0/Q;
      /* (a) 同じ縮尺のパッチ */
      var ax=14,ay=36,scl=1.5,cx=nar?200:118,cy=ay+96;
      o.push(S.T(ax,18,"(a) パッチ（同じ縮尺。点線は 25 mm 角）","start",10.5,"ink",true));
      var Lp=ell*1000*scl,c5=Math.min(0.3,0.12*Math.sqrt(k))*Lp,hl=Lp/2;
      var pts=[[cx-hl+c5,cy-hl],[cx+hl,cy-hl],[cx+hl,cy+hl-c5],[cx+hl-c5,cy+hl],[cx-hl,cy+hl],[cx-hl,cy-hl+c5]];
      if(c5<0.5)pts=[[cx-hl,cy-hl],[cx+hl,cy-hl],[cx+hl,cy+hl],[cx-hl,cy+hl]];
      o.push(S.PL(pts.concat([pts[0]]),"signal",1.6,U.soft("signal")));
      o.push(S.RECT(cx-12.5*scl,cy-12.5*scl,25*scl,25*scl,0,"none","muted",1,"2 3"));
      o.push(S.D(cx+Lp/6,cy,"alias",3.4));
      o.push(S.L(ax+8,ay+16,ax+8+20*scl,ay+16,"ink",1.6));o.push(S.T(ax+8+20*scl+5,ay+20,"20 mm","start",9,"ink"));
      o.push(S.T(cx,cy+hl+18>cy+76?cy+76:cy+hl+18,"一辺 ℓ = "+_w08_f(ell*1000,1)+" mm","middle",10,"signal",true,false,null,true));
      /* (b) 2 つのモードの振幅と軸比 */
      var span=Math.max(25,Math.ceil(1.6*bwh/1e6/5)*5),px=nar?50:290,py=nar?264:40,pw=nar?330:380,ph1=70,ph2=80;
      o.push(S.T(px-40,py-12,"(b) 2 つのモードの振幅と、軸比（"+(L5?"L5":"L1")+" から ±"+span+" MHz）","start",10.5,"ink",true));
      var fu=f0*(1-k/(2*Q)),fv=f0*(1+k/(2*Q)),P1=U.plot(px,py,pw,ph1,[-span,span],[0,1.05]);
      o.push(P1.axes({yl:"振幅",xt:[-span,-span/2,0,span/2,span],yt:[0,0.5,1],xfmt:function(){return "";},yfmt:function(v){return _w08_f(v,1);}}));
      o.push(S.L(P1.x,P1.Y(Math.SQRT1_2),P1.x+P1.w,P1.Y(Math.SQRT1_2),"muted",1,"3 3"));
      var lu=[],lv=[],la=[],i,n=240,okl=null,okh=null;
      for(i=0;i<=n;i++){var d=-span+2*span*i/n,f=f0+d*1e6,Ku=_w08_K(f,fu,Q),Kv=_w08_K(f,fv,Q);lu.push([d,Math.hypot(Ku[0],Ku[1])]);lv.push([d,Math.hypot(Kv[0],Kv[1])]);
        var aR=Math.hypot(Ku[0]+Kv[1],Ku[1]-Kv[0]),aL=Math.hypot(Ku[0]-Kv[1],Ku[1]+Kv[0]),arv=20*Math.log10((aR+aL)/Math.max(Math.abs(aR-aL),1e-12));la.push([d,arv]);}
      /* 軸比 3 dB 以下の幅（細かく調べる） */
      var arf=function(d){var f=f0+d*1e6,Ku=_w08_K(f,fu,Q),Kv=_w08_K(f,fv,Q),aR=Math.hypot(Ku[0]+Kv[1],Ku[1]-Kv[0]),aL=Math.hypot(Ku[0]-Kv[1],Ku[1]+Kv[0]);return 20*Math.log10((aR+aL)/Math.max(Math.abs(aR-aL),1e-12));};
      for(i=0;i<=4000;i++){var dd=-span+2*span*i/4000;if(arf(dd)<=3){if(okl===null)okl=dd;okh=dd;}}
      o.push(P1.line(lu,"purple",1.8));o.push(P1.line(lv,"teal",1.8));
      var P2=U.plot(px,py+ph1+14,pw,ph2,[-span,span],[0,15]);
      o.push(P2.axes({xl:"中心からの周波数 [MHz]",yl:"軸比 [dB]",xt:[-span,-span/2,0,span/2,span],yt:[0,3,6,10,15],xfmt:function(v){return _w08_f(v,v%1?1:0);},yfmt:function(v){return String(v);}}));
      var mlw=L5?20.46:2.046;
      o.push(S.RECT(P2.X(-mlw/2),P2.y,P2.X(mlw/2)-P2.X(-mlw/2),P2.h,0,U.soft("gold"),"none",0,null,' fill-opacity="0.6"'));
      if(okl!==null)o.push(S.RECT(P2.X(okl),P2.y,P2.X(okh)-P2.X(okl),P2.h,0,U.soft("green"),"none",0,null,' fill-opacity="0.6"'));
      o.push(S.L(P2.x,P2.Y(3),P2.x+P2.w,P2.Y(3),"muted",1,"3 3"));
      o.push(P2.clip(la,"signal",2.2));
      var ar0=arf(0);
      o.push(S.T(P2.x+P2.w-4,P2.y+12,"緑: 軸比 3 dB 以下 "+(okl===null?"なし":_w08_f(okh-okl,1)+" MHz"),"end",9,"green",true,false,null,true));
      o.push(S.T(P2.x+P2.w-4,P2.y+25,"金: 信号の主ローブ "+mlw+" MHz","end",9,"gold",true,false,null,true));
      /* (c) 地板と放射パターン（2 次元の近似） */
      var gx=nar?200:140,gyc=nar?py+ph1+ph2+194:400,GR=nar?100:110,gmin=-25,gmax=5;
      o.push(S.T(nar?10:14,gyc-GR-26,"(c) 地板とパターン（2 次元の近似）","start",10.5,"ink",true));
      o.push(S.CIRC(gx,gyc,GR,"muted",1.2,"screen"));
      [-20,-10,0].forEach(function(v){var rr=GR*(v-gmin)/(gmax-gmin);o.push(S.CIRC(gx,gyc,rr,"faint",0.9,null,"3 3"));o.push(S.T(gx+3,gyc-rr+11,String(v).replace("-","−"),"start",8.5,"muted",false,false,null,true));});
      o.push(S.L(gx-GR-6,gyc,gx+GR+6,gyc,"muted",1.2));o.push(S.L(gx,gyc-GR,gx,gyc+GR,"grid",1));
      o.push(S.T(gx,gyc-GR-6,"真上 [dB]","middle",9,"ink",true));o.push(S.T(gx,gyc+GR+14,"真下","middle",9,"ink",true));
      function curve(arr,c,lw,dash,upOnly){[1,-1].forEach(function(sd){var q=[];for(var j=0;j<181;j++){var elv=j-90;if(upOnly&&elv<0)continue;var v=Math.max(gmin,Math.min(gmax,arr[j]/10)),rr=GR*(v-gmin)/(gmax-gmin);q.push([gx+sd*rr*Math.cos(elv*_W08_D),gyc-rr*Math.sin(elv*_W08_D)]);}o.push(S.PL(q,c,lw,null,dash));});}
      curve(_W08_GP.inf,"muted",1.4,"5 3",true);
      var key=g>=1e8?"inf":String(g),cur=_W08_GP[key];curve(cur,"signal",2.4,null,false);
      var zen=cur[180]/10,hor=cur[90]/10,nad=cur[0]/10;
      /* (d) 地板の一辺と、真上・地平線・真下 */
      var dx=nar?50:330,dy=nar?gyc+GR+60:gyc-GR-4,dw=nar?330:340,dh=nar?120:200;
      o.push(S.T(dx-40,dy-12,"(d) 地板の一辺と向きごとの値 [dB]","start",10.5,"ink",true));
      var P3=U.plot(dx,dy,dw,dh,[30,200],[-16,5]);
      o.push(P3.axes({xl:"地板の一辺 [mm]",xt:[30,50,70,100,150,200],yt:[-15,-10,-5,0,5],xfmt:function(v){return String(v);},yfmt:function(v){return String(v).replace("-","−");}}));
      [[180,"signal","真上"],[90,"gold","地平線"],[0,"alias","真下"]].forEach(function(z){var q=_W08_GPS.map(function(sz){return [sz,_W08_GP[String(sz)][z[0]]/10];});o.push(P3.line(q,z[1],2));
        o.push(S.T(P3.X(200)-2,P3.Y(q[q.length-1][1])+(z[0]===180?-6:14),z[2],"end",9.5,z[1],true,false,null,true));});
      if(g<1e8){o.push(S.L(P3.X(g),P3.y,P3.X(g),P3.y+P3.h,"ink",1.2,"3 3"));[[zen,"signal"],[hor,"gold"],[nad,"alias"]].forEach(function(z){o.push(S.D(P3.X(g),P3.Y(z[0]),z[1],4.4));});}
      box.set(S.svg(Wd,nar?dy+dh+44:Math.max(gyc+GR+30,dy+dh+44),o));
      /* 読み出し */
      var h="波長 λ = "+_w08_f(lam*1000,1)+" mm、誘電体の中の波長 λ/√ε<sub>r</sub> = "+_w08_f(lamd*1000,1)+" mm → 一辺 <b>ℓ = λ/(2√ε<sub>r</sub>) = "+_w08_f(ell*1000,1)+" mm</b>（給電点は中心から ℓ/6 = "+_w08_f(ell*1000/6,2)+" mm）<br>";
      h+="共振の帯域 f<sub>0</sub>/Q = "+_w08_f(bwh/1e6,2)+" MHz。モードの共振周波数 f<sub>u</sub> = "+_w08_f(fu/1e6,2)+" MHz、f<sub>v</sub> = "+_w08_f(fv/1e6,2)+" MHz → 中心で軸比 <b>"+_w08_f(ar0,1)+" dB</b>、3 dB 以下の幅 <b>"+(okl===null?"なし":_w08_f(okh-okl,2)+" MHz")+"</b>（信号の主ローブ "+mlw+" MHz）<br>";
      h+="地板 "+(g>=1e8?"無限":g+" mm")+": 真上 "+_w08_f(zen,1)+" dB、地平線 "+_w08_f(hor,1)+" dB、真下 "+(nad<-39?"−∞":_w08_f(nad,1))+" dB、<b>前後比 "+(g>=1e8?"∞":_w08_f(zen-nad,1)+" dB")+"</b>（無限の地板の真上を 0 dB）";
      ro.innerHTML=h+'<div class="wnote">パッチの一辺は簡単な式（縁ではみ出す電界の分は入れていない）。角の切り方の大きさは目安で、計算には使っていない。2 つのモードは 3 節の共振の式で、差が f<sub>0</sub>/Q のときに中心で軸比 0 dB になる。地板のパターンは、地板の奥行きを無限とした 2 次元の計算（モーメント法）で、比誘電率と周波数のつまみには連動しない。</div>';
    }
    draw();
  };

  /* ---- 6 節: 整合・スミスチャート・S11 ---- */
  REG.w08_match=function(el,U){
    var S=U.S;
    U.head(el,"MATCHING","整合 — スミスチャートと S11、リターンロス・VSWR・軸比");
    var r1=U.ctrls(el);
    var kd=U.seg(r1,["円偏波のパッチ（1 点給電）","直線偏波のパッチ","Z を直接決める"],0,function(){draw();});
    var r2=U.ctrls(el);
    var sh=U.slider(r2,"共振周波数のずれ",{min:-15,max:15,step:0.5,value:0,fmt:function(v){return (v>0?"+":"")+_w08_f(v,1)+" MHz";},onInput:function(){if(kd.get()===2)kd.set(0);draw();}});
    var qq=U.slider(r2,"Q",{values:[30,50,70,100,150,200],value:100,fmt:function(v){return String(v);},onInput:function(){if(kd.get()===2)kd.set(0);draw();}});
    var r3=U.ctrls(el);
    var rr=U.slider(r3,"抵抗 R<sub>A</sub>（直接のとき）",{values:[0,5,10,17,25,35,50,75,100,150,250,500,1e9],value:50,fmt:function(v){return v>=1e8?"∞（開放）":v+" Ω";},onInput:function(){kd.set(2);draw();}});
    var xx=U.slider(r3,"リアクタンス X<sub>A</sub>（直接のとき）",{min:-150,max:150,step:5,value:0,fmt:function(v){return (v>0?"+":"")+_w08_f(v,0)+" Ω";},onInput:function(){kd.set(2);draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（合っている）",function(){kd.set(0);sh.set(0);qq.set(100);draw();});
    U.button(br,"共振が 5 MHz 下がる",function(){kd.set(0);sh.set(-5);draw();});
    U.button(br,"10 MHz 下がる",function(){kd.set(0);sh.set(-10);draw();});
    U.button(br,"25 Ω",function(){kd.set(2);rr.set(25);xx.set(0);draw();});
    U.button(br,"100 Ω",function(){kd.set(2);rr.set(100);xx.set(0);draw();});
    U.button(br,"50 + j50 Ω",function(){kd.set(2);rr.set(50);xx.set(50);draw();});
    U.button(br,"短絡",function(){kd.set(2);rr.set(0);xx.set(0);draw();});
    U.button(br,"開放",function(){kd.set(2);rr.set(1e9);xx.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function at(f){var k=kd.get();if(k===2){var R=rr.get(),X=xx.get();if(R>=1e8)return {Z:[1e9,0],G:[1,0],PR:0,PL:0,open:true};return _w08_zout([R,X],null,null);}
      return _w08_patchZ(f,_W08_F1+sh.get()*1e6,qq.get(),k);}
    function g2(G,cx,cy,R){return [cx+R*G[0],cy-R*G[1]];}
    function zg(r,x){var d=(r+1)*(r+1)+x*x;return [((r*r-1)+x*x)/d,2*x/d];}   /* z = Z/50 → Γ */
    function draw(){
      var nar=_w08_nar(box),Wd=nar?400:700,o=[],k=kd.get(),i;
      /* (a) スミスチャート */
      var cx=nar?200:170,cy=nar?176:186,R=nar?140:146;
      o.push(S.T(10,18,"(a) スミスチャート（青: L1 ± 25 MHz の軌跡、点は L1）","start",10.5,"ink",true));
      o.push(S.CIRC(cx,cy,R,"ink",1.3,"screen"));o.push(S.L(cx-R,cy,cx+R,cy,"muted",1));
      var rs=[0.2,0.5,1,2,5],xs=[0.2,0.5,1,2,5],lg=[];for(i=-40;i<=40;i++)lg.push(Math.pow(10,i/10));
      rs.forEach(function(r){var q=[];lg.forEach(function(x){q.push(g2(zg(r,-x),cx,cy,R));});q.reverse();q.push(g2(zg(r,0),cx,cy,R));lg.forEach(function(x){q.push(g2(zg(r,x),cx,cy,R));});o.push(S.PL(q,r===1?"muted":"faint",r===1?1.1:0.9,null,r===1?null:"3 3"));});
      xs.forEach(function(x){[1,-1].forEach(function(sg){var q=[g2(zg(0,sg*x),cx,cy,R)];lg.forEach(function(r){q.push(g2(zg(r,sg*x),cx,cy,R));});o.push(S.PL(q,"faint",0.9,null,"3 3"));});});
      o.push(S.CIRC(cx,cy,R/3,"purple",1.1,null,"2 3"));
      o.push(S.T(cx-R-4,cy-6,"短絡","end",9,"ink",true));o.push(S.T(cx+R+4,cy-6,"開放","start",9,"ink",true));
      o.push(S.T(cx,cy-R-6,"X > 0","middle",9,"muted"));o.push(S.T(cx,cy+R+14,"X < 0","middle",9,"muted"));
      o.push(S.T(cx+R/3+3,cy+R/3,"VSWR 2","start",9,"purple",false,false,null,true));
      var loc=[],sw=[],arl=[];
      for(i=0;i<=200;i++){var d=-25+50*i/200,r=at(_W08_F1+d*1e6);loc.push(g2(r.G,cx,cy,R));sw.push([d,20*Math.log10(Math.max(Math.hypot(r.G[0],r.G[1]),1e-5))]);if(k===0)arl.push([d,_w08_ar(r.PR,r.PL)]);}
      if(k!==2){o.push(S.PL(loc,"signal",2.2));o.push(S.head(loc[96][0],loc[96][1],loc[104][0],loc[104][1],"signal",8));}
      var r0=at(_W08_F1),G0=r0.G,mg=Math.min(1,Math.hypot(G0[0],G0[1])),p0=g2(G0,cx,cy,R);
      o.push(S.D(p0[0],p0[1],"alias",5.2));
      /* (b) |S11| と (c) 軸比 */
      var px=nar?50:390,py=nar?cy+R+60:40,pw=nar?330:290,ph=nar?120:130;
      o.push(S.T(px-40,py-12,"(b) |S11| [dB]（周波数は L1 から）","start",10.5,"ink",true));
      var P=U.plot(px,py,pw,ph,[-25,25],[-40,0]);
      o.push(P.axes({xt:[-20,-10,0,10,20],yt:[-40,-30,-20,-10,0],xfmt:function(v){return k===0?"":String(v).replace("-","−");},yfmt:function(v){return String(v).replace("-","−");}}));
      o.push(S.L(P.x,P.Y(-10),P.x+P.w,P.Y(-10),"muted",1,"3 3"));o.push(S.L(P.X(0),P.y,P.X(0),P.y+P.h,"ink",1,"2 3"));
      o.push(P.clip(sw,"signal",2.2));
      var s0=20*Math.log10(Math.max(mg,1e-5));o.push(S.D(P.X(0),P.Y(Math.max(-40,s0)),"alias",4.4));
      var yb=py+ph+30;
      if(k===0){var qy=py+ph+26;o.push(S.T(px-40,qy-6,"(c) 軸比 [dB]","start",10.5,"ink",true));
        var P2=U.plot(px,qy+6,pw,ph-30,[-25,25],[0,15]);
        o.push(P2.axes({xl:"L1 からの周波数 [MHz]",xt:[-20,-10,0,10,20],yt:[0,3,6,10,15],xfmt:function(v){return String(v).replace("-","−");},yfmt:function(v){return String(v);}}));
        o.push(S.L(P2.x,P2.Y(3),P2.x+P2.w,P2.Y(3),"muted",1,"3 3"));o.push(S.L(P2.X(0),P2.y,P2.X(0),P2.y+P2.h,"ink",1,"2 3"));
        o.push(P2.clip(arl,"signal",2.2));var a0=_w08_ar(r0.PR,r0.PL);o.push(S.D(P2.X(0),P2.Y(Math.min(15,a0)),"alias",4.4));yb=qy+6+ph-30+44;}
      else o.push(S.T(px+pw/2,py+ph+30,"L1 からの周波数 [MHz]","middle",10,"muted"));
      box.set(S.svg(Wd,nar?yb+10:Math.max(cy+R+30,yb+10),o));
      /* 読み出し */
      var Z=r0.Z,vs=mg>=0.9999?Infinity:(1+mg)/(1-mg),rl=-20*Math.log10(Math.max(mg,1e-12)),ml=mg>=0.9999?Infinity:-10*Math.log10(1-mg*mg);
      var h="L1 で Z<sub>A</sub> = "+(r0.open?"∞（開放）":_w08_f(Z[0],1)+(Z[1]<0?" − j":" + j")+_w08_f(Math.abs(Z[1]),1)+" Ω")+" → Γ = "+_w08_f(G0[0],3)+(G0[1]<0?" − ":" + ")+_w08_f(Math.abs(G0[1]),3)+"j、|Γ| = "+_w08_f(mg,3)+"<br>";
      h+="リターンロス <b>"+(rl>99?"∞":_w08_f(rl,1)+" dB")+"</b>（|S11| = "+(rl>99?"−∞":_w08_f(-rl,1))+" dB）、VSWR <b>"+(isFinite(vs)?_w08_f(vs,2):"∞")+"</b>、不整合損失 <b>"+(isFinite(ml)?_w08_f(ml,2)+" dB":"∞（全部跳ね返る）")+"</b>（渡る電力 "+_w08_f(100*(1-mg*mg),1)+" %）<br>";
      if(k===0){var a1=_w08_ar(r0.PR,r0.PL),pp=r0.PR/(r0.PR+r0.PL),lr=r0.PL/(r0.PR+r0.PL);
        h+="軸比 <b>"+_w08_f(a1,1)+" dB</b>。右旋の電波を受ける強さ: 不整合 "+_w08_f(ml,2)+" dB + 偏波 "+_w08_f(-_w08_db(pp),2)+" dB = <b>"+_w08_f(-_w08_db(r0.PR/0.25),2)+" dB</b> の損失。左旋の反射波は "+(lr<1e-5?"−50 dB より小さく":_w08_f(_w08_db(lr),1)+" dB で")+"受ける（偏波の分だけ）";}
      else if(k===1)h+="直線偏波なので、右旋の電波は偏波でさらに 3.01 dB 損する（合計 "+_w08_f(ml+3.0103,2)+" dB）";
      ro.innerHTML=h+'<div class="wnote">パッチは 3 節の 2 つのモードの共振回路を直列につないだモデル（それぞれ共振で 50 Ω、Q は共通）で、ずれ 0 のとき L1 で 50 Ω・軸比 0 dB になる。直線偏波のパッチは 1 つのモード。基準は 50 Ω。右旋の損失は、1 V・50 Ω の信号源で送ったときの右旋の電力を、合っているときと比べた値（不整合損失と偏波の損失の和に等しい）。</div>';
    }
    draw();
  };

/* ===== 09 章 LNA とフィルタ — 雑音指数は最初の段で決まる ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w09_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w09_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
var _W09_KB=1.380649e-23,_W09_T0=290,_W09_C=-128.5,_W09_L1=1575.42,_W09_HB=1.023;
function _w09_u(d){return Math.pow(10,d/10);}
function _w09_db(x){return 10*Math.log10(x);}
/* 段の列 [{n:名前, g:利得 dB, nf:雑音指数 dB}] をフリスの式で計算する。返り値: 各段の寄与と、その段までの Tsys・C/N0 */
function _w09_chain(st,tant){var g=1,tot=0,rows=[];
  st.forEach(function(s){var te=(_w09_u(s.nf)-1)*_W09_T0,c=te/g;tot+=c;var ts=tant+tot;
    rows.push({n:s.n,te:te,gb:g,c:c,tsys:ts,cn0:_W09_C-(_w09_db(_W09_KB*ts)+30)});g*=_w09_u(s.g);});
  return rows;}

/* ---- 5 節の後: 段の並びと各段の値を変えて、フリスの式で全体の雑音と C/N0 を見る ---- */
REG.w09_friis=function(el,U){
  var S=U.S;
  U.head(el,"FRIIS CASCADE","段の並びと雑音 — フリスの式で、全体の雑音指数と C/N0 を計算する");
  var r1=U.ctrls(el);
  var ta=U.slider(r1,"アンテナの雑音温度 T<sub>ant</sub>",{min:30,max:300,step:5,value:100,fmt:function(v){return v+" K";},onInput:function(){draw();}});
  var lnf=U.slider(r1,"LNA の雑音指数",{min:0.3,max:4,step:0.1,value:1.0,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  var lg=U.slider(r1,"LNA の利得",{min:0,max:30,step:0.5,value:18,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var sl=U.slider(r2,"SAW フィルタの挿入損失",{min:0,max:4,step:0.1,value:1.5,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  var cm=U.slider(r2,"ケーブルの長さ",{min:0,max:30,step:0.5,value:0,fmt:function(v){return _w09_f(v,1)+" m（"+_w09_f(0.5*v,2)+" dB）";},onInput:function(){draw();}});
  var cnf=U.slider(r2,"チップの増幅器の雑音指数",{min:1,max:10,step:0.5,value:3,fmt:function(v){return _w09_f(v,1)+" dB";},onInput:function(){draw();}});
  /* 並び: 0 = LNA、1 = SAW、2 = ケーブル の順番 */
  var order=[0,1,2];
  var br=U.btnrow(el);
  function setAll(o,a,b,c,d,e,f){order=o.slice();ta.set(a);lnf.set(b);lg.set(c);sl.set(d);cm.set(e);cnf.set(f);draw();}
  U.button(br,"本文の例（1 節: 47.5 dB-Hz）",function(){setAll([0,1,2],100,1.0,18,1.5,0,3);});
  U.button(br,"SAW を LNA の前に（3 節 (b)）",function(){setAll([1,0,2],100,1.0,18,1.5,0,3);});
  U.button(br,"パッシブ + ケーブル 3 m（5 節）",function(){setAll([2,0,1],100,1.0,18,1.5,3,3);});
  U.button(br,"LNA の後にケーブル 3 m",function(){setAll([0,1,2],100,1.0,18,1.5,3,3);});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"上の段の箱（LNA・SAW・ケーブル）を左右にドラッグすると、並びが入れ替わる。アンテナは左端、受信用のチップ（20 dB と 68.5 dB の増幅）は右端に固定。ケーブルの損失は 1 m あたり 0.5 dB（例の値）。");
  var NAME=["LNA","SAW","ケーブル"],COLS=["signal","gold","teal"];
  var geo={x0:0,w:0,y:0,h:0,xs:[]},dragI=-1,dragX=0,dragOff=0;
  function stages(){var st=[];order.forEach(function(k){
      if(k===0)st.push({n:"LNA",g:lg.get(),nf:lnf.get(),k:0});
      else if(k===1)st.push({n:"SAW",g:-sl.get(),nf:sl.get(),k:1});
      else st.push({n:"ケーブル",g:-0.5*cm.get(),nf:0.5*cm.get(),k:2});});
    st.push({n:"増幅 1",g:20,nf:cnf.get(),k:3});st.push({n:"増幅 2",g:68.5,nf:cnf.get(),k:4});return st;}
  function draw(){
    var nar=_w09_nar(box),Wd=nar?400:700,o=[],st=stages(),tant=ta.get(),rows=_w09_chain(st,tant);
    var ideal=_W09_C-(_w09_db(_W09_KB*tant)+30),fin=rows[rows.length-1],teAll=fin.tsys-tant,F=1+teAll/_W09_T0;
    /* (a) 段の並び */
    o.push(S.T(nar?6:14,16,"(a) 段の並び（箱をドラッグで入れ替え）","start",11,"ink",true));
    var bw=nar?62:96,gap=nar?14:26,x=nar?50:94,y=30,h=40;
    o.push(S.CIRC(nar?22:40,y+h/2,10,"muted",1.4));o.push(S.T(nar?22:40,y+h+14,"アンテナ","middle",9.5,"muted"));
    geo.xs=[];geo.y=y;geo.h=h;geo.w=bw;
    for(var i=0;i<3;i++){var k=order[i],xx=x+i*(bw+gap);geo.xs.push(xx);
      if(dragI===i)xx=dragX;
      var s=st[i],lab=k===0?_w09_f(s.g,1)+" dB・NF "+_w09_f(s.nf,1):(k===1?(sl.get()>0?"−":"")+_w09_f(sl.get(),1)+" dB":(cm.get()>0?"−":"")+_w09_f(0.5*cm.get(),2)+" dB");
      o.push(S.ARR(xx-gap+2,y+h/2,xx-1,y+h/2,"muted",1.3));
      o.push(S.RECT(xx,y,bw,h,7,U.soft(COLS[k]),COLS[k],dragI===i?2.6:1.4));
      if(nar&&k===0){o.push(S.T(xx+bw/2,y+13,NAME[k],"middle",10,COLS[k],true));
        o.push(S.T(xx+bw/2,y+25,_w09_f(s.g,1)+" dB","middle",8.5,"muted"));o.push(S.T(xx+bw/2,y+36,"NF "+_w09_f(s.nf,1),"middle",8.5,"muted"));}
      else{o.push(S.T(xx+bw/2,y+17,NAME[k],"middle",nar?10:11,COLS[k],true));
        o.push(S.T(xx+bw/2,y+32,lab,"middle",nar?8.5:9.5,"muted"));}}
    var xc=x+3*(bw+gap);
    o.push(S.ARR(xc-gap+2,y+h/2,xc-1,y+h/2,"muted",1.3));
    o.push(S.RECT(xc,y,nar?(Wd-xc-6):(Wd-xc-14),h,7,"panel","line",1.4));
    o.push(S.T(xc+(nar?(Wd-xc-6):(Wd-xc-14))/2,y+17,"チップ","middle",nar?10:11,"ink",true));
    o.push(S.T(xc+(nar?(Wd-xc-6):(Wd-xc-14))/2,y+32,"NF "+_w09_f(cnf.get(),1)+" dB","middle",nar?8.5:9.5,"muted"));
    /* (b) Tsys の内訳 */
    var yb=y+h+44;
    o.push(S.TX(nar?6:14,yb,"(b) システム雑音温度 T_{sys} の内訳（入力に換算）","start",11,"ink",true));
    var tmax=Math.max(200,Math.ceil(fin.tsys/100)*100),P=U.plot(nar?20:60,yb+10,nar?360:600,26,[0,tmax],[0,1]);
    o.push(P.axes({xt:U.nice(0,tmax,nar?4:6),yt:[],grid:false,xfmt:function(v){return v+" K";}}));
    var segs=[{n:"アンテナ",v:tant,c:"teal"}];rows.forEach(function(r,i){segs.push({n:r.n,v:r.c,c:st[i].k<3?COLS[st[i].k]:(st[i].k===3?"alias":"purple")});});
    var acc=0;segs.forEach(function(s){var x1=P.X(acc),x2=P.X(Math.min(tmax,acc+s.v));o.push(S.RECT(x1,P.y+2,Math.max(0.8,x2-x1),22,2,U.soft(s.c),s.c,1.1));
      if(x2-x1>(nar?54:70))o.push(S.T((x1+x2)/2,P.y+17,s.n+" "+_w09_f(s.v,1),"middle",9.5,s.c,true,false,null,true));acc+=s.v;});
    /* (c) 各段の後の C/N0 */
    var yc=yb+76;
    o.push(S.TX(nar?6:14,yc,"(c) 各段を通った後の C/N_0","start",11,"ink",true));
    var lo=Math.floor(Math.min(fin.cn0,ideal)-1),hi=Math.ceil(ideal+0.5);if(hi-lo<4)lo=hi-4;
    var Q=U.plot(nar?54:90,yc+12,nar?330:560,nar?120:130,[-0.5,rows.length+0.5],[lo,hi]);
    o.push(Q.axes({xt:[],yt:U.nice(lo,hi,4),yl:"[dB-Hz]",yfmt:function(v){return _w09_f(v,0);}}));
    var pts=[[0,ideal]];rows.forEach(function(r,i){pts.push([i+1,r.cn0]);});
    o.push(Q.line(pts,"signal",2.2));
    var nm=["アンテナ"].concat(rows.map(function(r){return r.n;}));
    pts.forEach(function(p,i){o.push(S.D(Q.X(p[0]),Q.Y(p[1]),"signal",3.8));
      o.push(S.T(Q.X(p[0]),Q.Y(p[1])-8,_w09_f(p[1],1),"middle",nar?8.5:9.5,"signal",true,false,null,true));
      o.push(S.T(Q.X(p[0]),Q.y+Q.h+14,nm[i],"middle",nar?8:9.5,"muted"));});
    box.set(S.svg(Wd,yc+12+(nar?120:130)+26,o));
    var warn=fin.cn0<ideal-3?' <span class="warn">（LNA が雑音を足さない場合より '+_w09_f(ideal-fin.cn0,1)+' dB 低い）</span>':' <span class="ok">（LNA が雑音を足さない場合より '+_w09_f(ideal-fin.cn0,1)+' dB 低い）</span>';
    ro.innerHTML="全体の雑音温度 T<sub>e</sub> = <b>"+_w09_f(teAll,1)+" K</b>、全体の雑音指数 = <b>"+_w09_f(_w09_db(F),2)+" dB</b>、T<sub>sys</sub> = "+_w09_f(fin.tsys,1)+" K<br>"+
      "C/N0 = <b>"+_w09_f(fin.cn0,1)+" dB-Hz</b>"+warn+"（受信電力 −128.5 dBm）";
  }
  U.ctl.drag(box,function(ev,px,py){
    if(ev==="down"){for(var i=0;i<3;i++){var xx=geo.xs[i];if(px>=xx&&px<=xx+geo.w&&py>=geo.y&&py<=geo.y+geo.h){dragI=i;dragOff=px-xx;dragX=xx;draw();return true;}}return false;}
    if(ev==="move"&&dragI>=0){dragX=px-dragOff;
      /* 中心の位置で並びを決め直す */
      var cx=dragX+geo.w/2,best=0,bd=1e9;for(var j=0;j<3;j++){var d=Math.abs(geo.xs[j]+geo.w/2-cx);if(d<bd){bd=d;best=j;}}
      if(best!==dragI){var k=order.splice(dragI,1)[0];order.splice(best,0,k);dragI=best;}
      draw();return;}
    if(ev==="up"){dragI=-1;draw();}
  });
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 4 節の後: 2 つの強い電波の 3 次の相互変調の積がどこに落ちるか ---- */
REG.w09_imd=function(el,U){
  var S=U.S;
  U.head(el,"INTERMODULATION","相互変調 — 2 つの強い電波から L1 に落ちる成分");
  var r1=U.ctrls(el);
  var f1=U.slider(r1,"電波 1 の周波数 f<sub>1</sub>",{min:1500,max:2100,step:0.01,value:1712.71,fmt:function(v){return _w09_f(v,2)+" MHz";},onInput:function(){draw();}});
  var f2=U.slider(r1,"電波 2 の周波数 f<sub>2</sub>",{min:1500,max:2100,step:0.01,value:1850.00,fmt:function(v){return _w09_f(v,2)+" MHz";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var p1=U.slider(r2,"f<sub>1</sub> の入力の電力",{min:-70,max:0,step:1,value:-40,fmt:function(v){return _w09_f(v,0)+" dBm";},onInput:function(){draw();}});
  var p2=U.slider(r2,"f<sub>2</sub> の入力の電力",{min:-70,max:0,step:1,value:-40,fmt:function(v){return _w09_f(v,0)+" dBm";},onInput:function(){draw();}});
  var ip=U.slider(r2,"LNA の IIP3",{min:-20,max:15,step:0.5,value:0,fmt:function(v){return _w09_f(v,1)+" dBm";},onInput:function(){draw();}});
  var r3=U.ctrls(el);
  var pre=U.checkbox(r3,"LNA の前に SAW フィルタを置く（3 節 (b)。例の通過特性）",false,function(){draw();});
  var br=U.btnrow(el);
  U.button(br,"本文の例（4 節: −40 dBm ずつ）",function(){f1.set(1712.71);f2.set(1850.00);p1.set(-40);p2.set(-40);ip.set(0);pre.set(false);draw();});
  U.button(br,"2f₁ − f₂ が L1 に落ちる f₂ にする",function(){var v=2*f1.get()-_W09_L1;if(v>=1500&&v<=2100){f2.set(+v.toFixed(2));}draw();});
  U.button(br,"電力を 10 dB 下げる",function(){p1.set(Math.max(-70,p1.get()-10));p2.set(Math.max(-70,p2.get()-10));draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  /* SAW の通過特性の例（f09.py と同じ形） */
  function saw(f){return -1.5-45*(1-Math.exp(-Math.pow((f-_W09_L1)/28,4)));}
  var NFL=_w09_db(_W09_KB*183.5*2.046e6)+30;   /* 1 節の例の T_sys で、2.046 MHz の帯域の雑音の電力 */
  function draw(){
    var nar=_w09_nar(box),Wd=nar?400:700,o=[];
    var a1=f1.get(),a2=f2.get(),att1=pre.get()?saw(a1):0,att2=pre.get()?saw(a2):0;
    var q1=p1.get()+att1,q2=p2.get()+att2,iip=ip.get();
    var im=[{f:2*a1-a2,p:2*q1+q2-2*iip,n:"2f_1 − f_2"},{f:2*a2-a1,p:2*q2+q1-2*iip,n:"2f_2 − f_1"}];
    var P=U.plot(nar?56:80,30,nar?330:590,nar?200:220,[1400,2200],[-170,0]);
    o.push(S.T(nar?6:14,16,"LNA の入力に換算した電力のスペクトラム","start",11,"ink",true));
    o.push(S.RECT(P.X(_W09_L1-_W09_HB),P.y,Math.max(3,P.X(_W09_L1+_W09_HB)-P.X(_W09_L1-_W09_HB)),P.h,0,U.soft("green"),"green",0.8));
    o.push(P.axes({xl:"周波数 f [MHz]",yl:"電力 [dBm]",xt:nar?[1400,1600,1800,2000,2200]:[1400,1500,1600,1700,1800,1900,2000,2100,2200],yt:[-160,-120,-80,-40,0],yfmt:function(v){return _w09_f(v,0);}}));
    o.push(S.T(P.X(_W09_L1),P.y-4,"L1","middle",10,"green",true));
    /* 参考の線: 衛星の信号と、L1 の帯域の雑音 */
    o.push(S.L(P.X(1400),P.Y(_W09_C),P.X(2200),P.Y(_W09_C),"signal",1,"4 3"));
    o.push(S.T(P.X(2200)-4,P.Y(_W09_C)+13,"衛星の信号 −128.5","end",9,"signal",false,false,null,true));
    o.push(S.L(P.X(1400),P.Y(NFL),P.X(2200),P.Y(NFL),"teal",1,"4 3"));
    o.push(S.T(P.X(2200)-4,P.Y(NFL)-5,"L1 の帯域の雑音 "+_w09_f(NFL,1),"end",9,"teal",false,false,null,true));
    if(pre.get()){var sp=[];for(var f=1400;f<=2200;f+=2)sp.push([f,saw(f)]);o.push(P.clip(sp,"gold",1.2,"2 3"));
      o.push(S.T(P.X(1640),P.Y(-6),"SAW の通過 [dB]","start",9,"gold",false,false,null,true));}
    [[a1,q1,"f_1"],[a2,q2,"f_2"]].forEach(function(t){if(t[0]<1400||t[0]>2200)return;o.push(S.L(P.X(t[0]),P.Y(-170),P.X(t[0]),P.Y(Math.max(-170,t[1])),"alias",2.6));
      o.push(S.TX(P.X(t[0]),P.Y(Math.max(-170,t[1]))-6,t[2],"middle",10,"alias",true,true));});
    var hit=false;
    im.forEach(function(m){var inb=Math.abs(m.f-_W09_L1)<=_W09_HB;if(inb)hit=true;if(m.f<1400||m.f>2200)return;
      var c=inb?(m.p>NFL-20?"alias":"green"):"gold";o.push(S.L(P.X(m.f),P.Y(-170),P.X(m.f),P.Y(Math.max(-170,m.p)),c,2.2));
      o.push(S.TX(P.X(m.f)+4,P.Y(Math.max(-170,m.p))-6,m.n,"start",10,c,true,true));});
    box.set(S.svg(Wd,30+(nar?200:220)+44,o));
    var p1db=iip-9.6,comp=Math.max(q1,q2)>p1db;
    var h="";
    im.forEach(function(m){var inb=Math.abs(m.f-_W09_L1)<=_W09_HB;
      var dd=m.p-_W09_C,rel=(dd>=0?"衛星の信号より "+_w09_f(dd,1)+" dB 強い":"衛星の信号より "+_w09_f(-dd,1)+" dB 弱い"),big=m.p>NFL-20;
      h+=U.htx(m.n.replace("f_1","f_{1}").replace("f_2","f_{2}"))+" = "+_w09_f(m.f,2)+" MHz、"+_w09_f(m.p,1)+" dBm"+(inb?(big?' <span class="warn">L1 の帯域に落ちる（'+rel+'）</span>':' L1 の帯域に落ちるが、帯域の雑音より '+_w09_f(NFL-m.p,1)+' dB 弱い <span class="ok">（影響は小さい）</span>'):"（L1 から "+_w09_f(Math.abs(m.f-_W09_L1),1)+" MHz 離れている）")+"<br>";});
    h+="LNA の入力: 電波 1 "+_w09_f(q1,1)+" dBm、電波 2 "+_w09_f(q2,1)+" dBm"+(pre.get()?"（SAW で "+_w09_f(-att1,1)+" dB・"+_w09_f(-att2,1)+" dB 弱めた後）":"")+"。P1dB ≈ IIP3 − 9.6 = "+_w09_f(p1db,1)+" dBm"+(comp?' <span class="warn">LNA が圧縮する</span>':' <span class="ok">圧縮しない</span>');
    ro.innerHTML=h;
  }
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 6 節の後: アクティブアンテナの給電と監視の回路 ---- */
REG.w09_bias=function(el,U){
  var S=U.S;
  U.head(el,"ANTENNA SUPERVISOR","アンテナの給電と監視 — 電流から正常・開放・短絡を見分ける");
  var r0=U.ctrls(el);
  var stt=U.seg(r0,["正常","開放（外れた）","短絡（芯線と外側）","パッシブ（直流で地板に短絡）"],0,function(){draw();});
  var r1=U.ctrls(el);
  var vs=U.slider(r1,"給電の電圧 V<sub>s</sub>",{min:2.5,max:5.5,step:0.1,value:3.3,fmt:function(v){return _w09_f(v,1)+" V";},onInput:function(){draw();}});
  var rs=U.slider(r1,"電流制限の抵抗 R<sub>s</sub>",{min:1,max:100,step:1,value:22,fmt:function(v){return _w09_f(v,0)+" Ω";},onInput:function(){draw();}});
  var rc=U.slider(r1,"ケーブルの往復の抵抗 R<sub>c</sub>",{min:0,max:5,step:0.1,value:0.5,fmt:function(v){return _w09_f(v,1)+" Ω";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var ia=U.slider(r2,"アンテナの電流",{min:1,max:40,step:0.5,value:15,fmt:function(v){return _w09_f(v,1)+" mA";},onInput:function(){draw();}});
  var vm=U.slider(r2,"アンテナが動く最低の電圧",{min:1.8,max:4.5,step:0.1,value:2.7,fmt:function(v){return _w09_f(v,1)+" V";},onInput:function(){draw();}});
  var to=U.slider(r2,"開放のしきい値",{min:0.5,max:10,step:0.5,value:3,fmt:function(v){return _w09_f(v,1)+" mA";},onInput:function(){draw();}});
  var ts=U.slider(r2,"短絡のしきい値",{min:20,max:200,step:5,value:50,fmt:function(v){return _w09_f(v,0)+" mA";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  U.button(br,"本文の例（3.3 V・22 Ω・15 mA）",function(){vs.set(3.3);rs.set(22);rc.set(0.5);ia.set(15);vm.set(2.7);to.set(3);ts.set(50);stt.set(0);draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function solve(){var V=vs.get(),R=rs.get(),Rc=rc.get(),I=ia.get()/1000,s=stt.get(),cur,van;
    if(s===1){cur=0;van=V;}                       /* 開放: 電流は流れない（アンテナの端子には V_s がそのまま出る） */
    else if(s===2||s===3){cur=V/(R+Rc);van=0;}     /* 短絡: 抵抗だけで電流が決まる（パッシブの直流の短絡も同じ） */
    else{cur=I;van=V-I*(R+Rc);if(van<0){van=0;cur=V/(R+Rc);}}
    return {V:V,R:R,Rc:Rc,I:cur,van:van,vrs:cur*R,pr:cur*cur*R};}
  function draw(){
    var nar=_w09_nar(box),Wd=nar?400:700,o=[],r=solve(),s=stt.get();
    var Ima=r.I*1000,judge=Ima<to.get()?1:(Ima>ts.get()?2:0);
    var JN=["正常","開放","短絡"],JC=["green","gold","alias"];
    /* 回路 */
    var y=46,x0=nar?10:20,k=nar?0.56:1;
    function X(v){return x0+v*k;}
    o.push(S.T(nar?6:14,18,"給電の回路（値は計算した結果）","start",11,"ink",true));
    o.push(S.RECT(X(0),y-16,70*k,32,6,U.soft("purple"),"purple",1.3));o.push(S.T(X(35),y+4,_w09_f(r.V,1)+" V","middle",nar?9:10.5,"purple",true));
    o.push(S.L(X(70),y,X(110),y,"ink",1.4));
    /* 抵抗 */
    var zz=[];for(var i=0;i<=6;i++)zz.push([X(110+i*10),y+(i===0||i===6?0:(i%2?-6:6))]);o.push(S.PL(zz,"ink",1.6));
    o.push(S.TX(X(140),y-12,"R_s "+_w09_f(r.R,0)+" Ω","middle",nar?9:10,"ink",true,true));
    o.push(S.TX(X(140),y+22,"V_{Rs} = "+_w09_f(r.vrs,3)+" V","middle",nar?9:10,JC[judge],true,true));
    o.push(S.L(X(170),y,X(250),y,"ink",1.4));
    o.push(S.RECT(X(250),y-14,80*k,28,6,"panel","purple",1.2));o.push(S.T(X(290),y+4,"バイアス T","middle",nar?9:10,"purple",true));
    o.push(S.L(X(330),y,X(470),y,"teal",3));
    o.push(S.TX(X(400),y-10,"ケーブル R_c "+_w09_f(r.Rc,1)+" Ω","middle",nar?9:10,"teal",true,true));
    var ac=s===0?"signal":(s===1?"gold":"alias");
    o.push(S.RECT(X(470),y-18,(nar?(Wd-X(470)-6):(Wd-X(470)-14)),36,6,U.soft(ac),ac,1.4));
    var an=["アクティブアンテナ","外れている","短絡","パッシブ（直流で短絡）"][s];
    o.push(S.T((X(470)+(nar?Wd-6:Wd-14))/2,y-1,an,"middle",nar?9:10.5,ac,true));
    o.push(S.T((X(470)+(nar?Wd-6:Wd-14))/2,y+13,"端子 "+_w09_f(r.van,2)+" V","middle",nar?8.5:9.5,"muted"));
    if(s===1){o.push(S.X(X(468),y,6,"gold",2));}
    o.push(S.ARR(X(180),y+38,X(240),y+38,"purple",1.5));o.push(S.T(X(250),y+42,"I = "+_w09_f(Ima,1)+" mA","start",nar?9.5:10.5,"purple",true));
    /* 電流の軸と判定の範囲 */
    var yb=y+80;
    o.push(S.T(nar?6:14,yb,"給電の電流と判定の範囲","start",11,"ink",true));
    var imax=Math.max(200,Math.ceil(Ima/50)*50),P=U.plot(nar?20:40,yb+24,nar?360:620,30,[0,imax],[0,1]);
    o.push(S.RECT(P.X(0),P.y,P.X(to.get())-P.X(0),30,0,U.soft("gold"),"gold",0.8));
    o.push(S.RECT(P.X(to.get()),P.y,P.X(Math.min(imax,ts.get()))-P.X(to.get()),30,0,U.soft("green"),"green",0.8));
    o.push(S.RECT(P.X(Math.min(imax,ts.get())),P.y,P.X(imax)-P.X(Math.min(imax,ts.get())),30,0,U.soft("alias"),"alias",0.8));
    o.push(P.axes({xl:"電流 I [mA]",xt:U.nice(0,imax,nar?4:8),yt:[],grid:false}));
    o.push(S.T(P.X((to.get()+Math.min(imax,ts.get()))/2),P.y+19,"正常","middle",10,"green",true,false,null,true));
    o.push(S.T(P.X((Math.min(imax,ts.get())+imax)/2),P.y+19,"短絡","middle",10,"alias",true,false,null,true));
    o.push(S.L(P.X(Math.min(imax,Ima)),P.y-6,P.X(Math.min(imax,Ima)),P.y+36,JC[judge],2.4));
    o.push(S.D(P.X(Math.min(imax,Ima)),P.y-6,JC[judge],4.5));
    box.set(S.svg(Wd,yb+24+30+44,o));
    var h="判定: <b>"+JN[judge]+"</b>"+(judge===0?' <span class="ok">（給電を続ける）</span>':(judge===2?' <span class="warn">（給電のスイッチを切る）</span>':' <span class="warn">（アンテナがつながっていない、と知らせる）</span>'));
    h+="<br>電流 "+_w09_f(Ima,1)+" mA、V<sub>Rs</sub> = "+_w09_f(r.vrs,3)+" V（開放のしきい値 "+_w09_f(to.get()*r.R/1000,3)+" V、短絡のしきい値 "+_w09_f(ts.get()*r.R/1000,3)+" V）、R<sub>s</sub> の電力 "+_w09_f(r.pr*1000,0)+" mW";
    if(s===0){var ok=r.van>=vm.get();h+="<br>アンテナの電圧 "+_w09_f(r.van,2)+" V"+(ok?' <span class="ok">（最低 '+_w09_f(vm.get(),1)+' V 以上。余裕 '+_w09_f(r.van-vm.get(),2)+' V）</span>':' <span class="warn">（最低 '+_w09_f(vm.get(),1)+' V に足りない。R<sub>s</sub> を小さくする）</span>');
      h+="。R<sub>s</sub> の上限 (V<sub>s</sub> − V<sub>min</sub>)/I − R<sub>c</sub> = "+_w09_f((r.V-vm.get())/(ia.get()/1000)-r.Rc,1)+" Ω";}
    if(s===3)h+='<br>パッシブアンテナは素子が直流で地板につながっている物があり、給電すると短絡と判定される。パッシブアンテナをつなぐ機器では給電を切る。';
    ro.innerHTML=h;
  }
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ===== 10 章 モジュールの回路 — 電源・バックアップ・1PPS・通信 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w10_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w10_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 3 桁ごとに空白を入れた整数（115 200 など） */
function _w10_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
var _W10_CN0=47.5,_W10_L1=1575.42,_W10_HB=1.023;
/* 例のモデルの PSRR [dB] = 20 log10 |1 + A0/(1 + j f/fp)|（図の _f10_psrr と同じ） */
function _w10_psrr(f,a0db,fp){var a0=Math.pow(10,a0db/20),x=f/fp,d=1+x*x;return 20*Math.log10(Math.hypot(1+a0/d,-a0*x/d));}
var _W10_INT=[40,20e3],_W10_EXT=[60,10e3];
/* 揺れ vr [mVpp]・周波数 f [Hz]・LDO の有無・感度 v1 [mVpp] → 各段の値 */
function _w10_model(vr,f,ldo,v1){var pe=_w10_psrr(f,_W10_EXT[0],_W10_EXT[1]),pi=_w10_psrr(f,_W10_INT[0],_W10_INT[1]),att=pi+(ldo?pe:0),
    vp=vr*Math.pow(10,-(ldo?pe:0)/20),v=vr*Math.pow(10,-att/20),q=(v/v1)*(v/v1);
  return {pe:pe,pi:pi,att:att,vp:vp,v:v,q:q,drop:10*Math.log10(1+q),cn0:_W10_CN0-10*Math.log10(1+q)};}
function _w10_hz(v){if(v>=1e6)return _w10_f(v/1e6,v<1e7?2:1).replace(/\.?0+$/,"")+" MHz";if(v>=1e3)return _w10_f(v/1e3,v<1e4?2:(v<1e5?1:0)).replace(/\.0+$/,"")+" kHz";return _w10_f(v,0)+" Hz";}
function _w10_mv(v){return (v>=100?_w10_f(v,0):(v>=10?_w10_f(v,1):(v>=1?_w10_f(v,2):(v>=0.01?_w10_f(v,3):v.toExponential(1).replace("-","−")))))+" mVpp";}

/* ---- 2 節: 電源の雑音の道と C/N0（例のモデル） ---- */
REG.w10_supply=function(el,U){
  var S=U.S;
  U.head(el,"SUPPLY NOISE","電源の雑音と C/N0 — どの道で小さくなり、どこで頭打ちになるか（例のモデル）");
  var r1=U.ctrls(el);
  var fr=U.slider(r1,"雑音の周波数 f（スイッチング周波数）",{min:1e3,max:1e7,log:true,value:2e6,fmt:_w10_hz,onInput:function(){draw();}});
  var vr=U.slider(r1,"スイッチング電源の出力の揺れ",{min:1,max:300,log:true,value:20,fmt:_w10_mv,onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var ldo=U.checkbox(r2,"外付けの LDO を入れる",false,function(){draw();});
  var v1=U.slider(r2,"RF の段の感度 v<sub>1</sub>（例のモデル）",{min:0.3,max:3,step:0.1,value:1,fmt:function(v){return _w10_f(v,1)+" mVpp";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function setAll(f,v,l){fr.set(f);vr.set(v);ldo.set(l);v1.set(1);draw();}
  U.button(br,"本文の例: 2 MHz・LDO なし",function(){setAll(2e6,20,false);});
  U.button(br,"2 MHz・LDO あり",function(){setAll(2e6,20,true);});
  U.button(br,"500 kHz・LDO あり",function(){setAll(5e5,20,true);});
  var box=U.svgbox(el),ro=U.readout(el);
  function verdict(c){return c>=47?["ほとんど下がらない（頭打ち）","green"]:(c>=35?["捕捉もできる（目安 30〜35 dB-Hz 以上）","green"]:(c>=25?["追尾は続くが、捕捉が難しくなる","gold"]:["追尾の目安 25 dB-Hz を下回る","alias"]));}
  function draw(){
    var f=fr.get(),v=vr.get(),l=ldo.get(),s1=v1.get(),m=_w10_model(v,f,l,s1),nar=_w10_nar(box),Wd=nar?400:700,o=[];
    var vd=verdict(m.cn0);
    /* (a) 道 1 の各段 */
    o.push(S.T(nar?6:14,16,"(a) 道 1: 電源の線（各段の揺れと PSRR）","start",11,"ink",true));
    var items=[["スイッチング電源",_w10_mv(v),"alias"],["外付けの LDO",l?"−"+_w10_f(m.pe,1)+" dB":"（なし）","purple"],["電源の端子",_w10_mv(m.vp),"muted"],
      ["中の電源の回路","−"+_w10_f(m.pi,1)+" dB","purple"],["RF の段",_w10_mv(m.v),"signal"],["N_p/N_0",(m.q>=100?_w10_f(m.q,0):(m.q>=0.01?String(+m.q.toPrecision(3)):m.q.toExponential(1).replace("-","−"))),"teal"],
      ["C/N_0",_w10_f(m.cn0,1)+" dB-Hz",vd[1]]];
    var bw=nar?88:88,gap=nar?11:12,perRow=nar?4:7,y0=26,bh=40;
    items.forEach(function(it,i){var row=Math.floor(i/perRow),col=i%perRow,x=(nar?6:6)+col*(bw+gap),y=y0+row*(bh+16);
      var dash=(i===1&&!l)?"4 3":null;
      o.push(S.RECT(x,y,bw,bh,6,U.soft(it[2]),it[2],1.2,dash));
      o.push(S.TX(x+bw/2,y+16,it[0],"middle",9.5,"ink",true));
      o.push(S.T(x+bw/2,y+32,it[1],"middle",9.5,it[2],true));
      if(i<items.length-1){if(col<perRow-1)o.push(S.ARR(x+bw,y+bh/2,x+bw+gap,y+bh/2,"alias",1.4,6));
        else o.push(S.PATH("M"+(x+bw/2)+","+(y+bh)+" v8 H"+(6+bw/2)+" v6",  "alias",1.4));}});
    var ya=y0+(nar?2*(bh+16):bh+16)+6;
    /* (b) PSRR と (c) C/N0 */
    var P,Q,yb=ya+8;
    if(nar){P=U.plot(48,yb+16,330,140,[1e3,1e7],[0,100],{xlog:true});Q=U.plot(48,yb+16+140+84,330,140,[1,300],[15,50],{xlog:true});}
    else{P=U.plot(60,yb+16,260,160,[1e3,1e7],[0,100],{xlog:true});Q=U.plot(420,yb+16,256,160,[1,300],[15,50],{xlog:true});}
    o.push(S.T(nar?6:14,yb+4,"(b) PSRR（例のモデル）","start",11,"ink",true));
    o.push(P.axes({xl:"雑音の周波数 f [Hz]",yl:"PSRR [dB]",xt:[1e3,1e4,1e5,1e6,1e7],yt:[0,20,40,60,80,100],xfmt:function(v){return {1000:"1 k",10000:"10 k",100000:"100 k",1000000:"1 M",10000000:"10 M"}[v]||"";},sz:9}));
    var fs=U.ctl.logspace(3,7,160);
    o.push(P.clip(fs.map(function(x){return [x,_w10_psrr(x,_W10_INT[0],_W10_INT[1])];}),"purple",1.8,"2 3"));
    o.push(P.clip(fs.map(function(x){return [x,_w10_psrr(x,_W10_EXT[0],_W10_EXT[1])];}),l?"signal":"faint",1.8,"6 3"));
    o.push(P.clip(fs.map(function(x){return [x,_w10_psrr(x,_W10_INT[0],_W10_INT[1])+(l?_w10_psrr(x,_W10_EXT[0],_W10_EXT[1]):0)];}),"green",2.4));
    o.push(S.L(P.X(f),P.y,P.X(f),P.y+P.h,"ink",1,"3 3"));
    o.push(S.D(P.X(f),P.Y(Math.min(100,m.att)),"green",4.5));
    o.push(S.T(P.X(f)+(P.X(f)>P.x+P.w-60?-6:6),Math.max(P.y+12,P.Y(Math.min(100,m.att))-7),_w10_f(m.att,1)+" dB",P.X(f)>P.x+P.w-60?"end":"start",9.5,"green",true,false,null,true));
    o.push(S.LEGL(P.x-40,P.y+P.h+(nar?44:46),[["green",null,"合わせた値"],[l?"signal":"faint","6 3","LDO"],["purple","2 3","中の回路"]],9,10));
    var qx=nar?6:372;
    o.push(S.TX(qx,(nar?Q.y-12:yb+4),"(c) 揺れの大きさと C/N_0（いまの f と LDO）","start",11,"ink",true));
    o.push(Q.axes({xl:"スイッチング電源の出力の揺れ [mVpp]",yl:"C/N_0 [dB-Hz]",xt:[1,10,100],yt:[15,20,25,30,35,40,45,50],xfmt:function(v){return String(v);},sz:9}));
    o.push(S.RECT(Q.x,Q.Y(35),Q.w,Q.Y(30)-Q.Y(35),0,U.soft("gold"),"none",0));
    o.push(S.T(Q.x+4,Q.Y(35)+12,"捕捉の目安 30〜35","start",9,"gold",true,false,null,true));
    o.push(S.L(Q.x,Q.Y(25),Q.x+Q.w,Q.Y(25),"alias",1,"4 3"));
    o.push(S.T(Q.x+Q.w-4,Q.Y(25)+12,"追尾の目安 25","end",9,"alias",true,false,null,true));
    o.push(S.L(Q.x,Q.Y(_W10_CN0),Q.x+Q.w,Q.Y(_W10_CN0),"green",1,"5 3"));
    o.push(S.T(Q.x+4,Q.Y(_W10_CN0)-5,"頭打ち 47.5","start",9,"green",true,false,null,true));
    var vs=U.ctl.logspace(0,Math.log10(300),120);
    o.push(Q.clip(vs.map(function(x){return [x,_w10_model(x,f,!l,s1).cn0];}),"faint",1.6,"5 3"));
    o.push(Q.clip(vs.map(function(x){return [x,_w10_model(x,f,l,s1).cn0];}),vd[1],2.4));
    o.push(S.D(Q.X(v),Q.Y(Math.max(15,m.cn0)),vd[1],5));
    o.push(S.T(Q.X(v)+(Q.X(v)>Q.x+Q.w-70?-7:7),Math.max(Q.y+14,Q.Y(Math.max(15,m.cn0))+(m.cn0>40?16:-7)),_w10_f(m.cn0,1),Q.X(v)>Q.x+Q.w-70?"end":"start",9.5,vd[1],true,false,null,true));
    o.push(S.LEGL(Q.x-40,Q.y+Q.h+(nar?44:46),[[vd[1],null,l?"LDO あり（いま）":"LDO なし（いま）"],["faint","5 3",l?"LDO なし":"LDO あり"]],9,10));
    /* (d) 道 2: L1 の近くの高調波 */
    var yd=Q.y+Q.h+(nar?62:66),fM=f/1e6,lo=_W10_L1-3,hi=_W10_L1+3,R=U.plot(nar?20:150,yd+18,nar?360:520,34,[lo,hi],[0,1]);
    o.push(S.T(nar?6:14,yd+6,"(d) 道 2: L1 の近くの高調波（f の整数倍）","start",11,"ink",true));
    o.push(S.RECT(R.X(_W10_L1-_W10_HB),R.y,R.X(_W10_L1+_W10_HB)-R.X(_W10_L1-_W10_HB),R.h,0,U.soft("signal"),"none",0));
    o.push(S.L(R.x,R.y+R.h,R.x+R.w,R.y+R.h,"muted",1.1));
    var n0=Math.ceil(lo/fM),n1=Math.floor(hi/fM),nin=[],dense=(n1-n0)>120;
    if(dense){o.push(S.RECT(R.x,R.y+8,R.w,R.h-8,0,U.soft("alias"),"alias",0.8));o.push(S.T(R.x+R.w/2,R.y+24,"高調波が "+_w10_f(fM*1e3,fM<0.01?1:0)+" kHz おきに密に並ぶ","middle",9,"alias",true,false,null,true));
      for(var n=Math.ceil((_W10_L1-_W10_HB)/fM);n<=Math.floor((_W10_L1+_W10_HB)/fM);n++)nin.push(n);}
    else for(var k=n0;k<=n1;k++){var fh=k*fM,inb=Math.abs(fh-_W10_L1)<=_W10_HB;if(inb)nin.push(k);
      o.push(S.L(R.X(fh),R.y+R.h,R.X(fh),R.y+5,inb?"alias":"muted",inb?2.2:1.3));}
    o.push(S.L(R.X(_W10_L1),R.y,R.X(_W10_L1),R.y+R.h,"signal",1,"3 3"));
    [-3,-2,-1,0,1,2,3].forEach(function(d){var x=R.X(_W10_L1+d);o.push(S.L(x,R.y+R.h,x,R.y+R.h+4,"muted",1));o.push(S.T(x,R.y+R.h+15,d===0?"L1":(d>0?"+":"−")+Math.abs(d),"middle",9,"muted"));});
    o.push(S.T(R.x+R.w/2,R.y+R.h+29,"L1 からの周波数の差 [MHz]（青い帯は主ローブ ±1.023 MHz）","middle",9.5,"muted"));
    if(!nar){o.push(S.T(14,R.y+16,"帯域に入る","start",9.5,nin.length?"alias":"green",true));o.push(S.T(14,R.y+30,nin.length+" 本","start",10,nin.length?"alias":"green",true));}
    box.set(S.svg(Wd,R.y+R.h+38,o));
    /* 読み出し */
    var h="PSRR: 外付けの LDO <b>"+(l?_w10_f(m.pe,1)+" dB":"なし")+"</b>、中の電源の回路 <b>"+_w10_f(m.pi,1)+" dB</b>、合わせて <b>"+_w10_f(m.att,1)+" dB</b>"+
      "（揺れは "+_w10_f(Math.pow(10,m.att/20),m.att>40?0:1)+" 分の 1）<br>";
    h+="RF の段に残る揺れ <b>"+_w10_mv(m.v)+"</b>、N<sub>p</sub>/N<sub>0</sub> = (v/v<sub>1</sub>)<sup>2</sup> = <b>"+(m.q>=0.01?String(+m.q.toPrecision(3)):m.q.toExponential(1).replace("-","−"))+"</b>、"+
      "C/N<sub>0</sub> は 47.5 dB-Hz から <b>"+_w10_f(m.drop,m.drop<0.1?2:1)+" dB</b> 下がって <b>"+_w10_f(m.cn0,1)+" dB-Hz</b>: <span class=\""+(vd[1]==="alias"?"warn":(vd[1]==="green"?"ok":""))+"\">"+vd[0]+"</span><br>";
    h+="道 2: L1 の主ローブに入る高調波 <b>"+nin.length+" 本</b>"+(nin.length?"（n = "+(nin.length>3?_w10_g(nin[0])+"〜"+_w10_g(nin[nin.length-1]):nin.map(_w10_g).join("・"))+"）。LDO では減らせない。強さは基板と置き方で決まる（20 章）":"。この f なら主ローブに落ちない")+
      (fM<2*_W10_HB&&nin.length?"。f が主ローブの幅 2.046 MHz より低いので、必ずどれかが入る":"");
    ro.innerHTML=h+'<div class="wnote">例のモデル: PSRR(f) = 20 log<sub>10</sub>|1 + A/(1 + j f/f<sub>p</sub>)|（外付けの LDO A = 60 dB・f<sub>p</sub> = 10 kHz、中の電源の回路 A = 40 dB・f<sub>p</sub> = 20 kHz）、N<sub>p</sub>/N<sub>0</sub> = (RF の段に残った揺れ ÷ v<sub>1</sub>)<sup>2</sup>。仕組みを見るための例の値で、実際の値は製品と基板で大きく違う（製品の資料の許容できるリップルで確かめる）。(c) の破線は、LDO の有無を逆にしたとき。</div>';
  }
  draw();
};

/* ---- 3 節: バックアップ電源の保持時間と、次のスタート ---- */
var _W10_TOFF=[60,300,600,1800,3600,7200,10800,14400,21600,43200,86400,172800,345600,604800,1209600,2592000,5184000,15552000,31536000];
function _w10_tstr(s){if(s<120)return _w10_f(s,0)+" s";if(s<3600)return _w10_f(s/60,0)+" 分";if(s<172800)return _w10_f(s/3600,s<36000?1:0).replace(/\.0$/,"")+" 時間";
  if(s<60*86400)return _w10_f(s/86400,s<864000?1:0).replace(/\.0$/,"")+" 日";if(s<31536000)return _w10_f(s/2592000,1).replace(/\.0$/,"")+" か月";return _w10_f(s/31536000,1)+" 年";}
/* 電源を切っていた時間 t [s]・保持時間 th [s] → 次のスタート [名前, 色, 説明] */
function _w10_start(t,th){if(t>=th)return ["コールドスタート","alias","バックアップ電源が保てなくなり、時刻も軌道の情報も消えた"];
  if(t<7200)return ["ホットスタート","green","エフェメリスが有効（2〜4 時間。代表値）"];
  if(t<14400)return ["ホットかウォーム","green","エフェメリスが有効な時間（2〜4 時間。代表値）の境目のあたり"];
  if(t<1209600)return ["ウォームスタート","gold","エフェメリスは古いが、アルマナック・時刻・位置がある"];
  if(t<5184000)return ["ウォームかコールド","gold","アルマナックが使える時間（2 週間〜2 か月。代表値）の境目のあたり"];
  return ["コールドスタート","alias","アルマナックが古い"];}
REG.w10_backup=function(el,U){
  var S=U.S;
  U.head(el,"BACKUP SUPPLY","バックアップ電源の保持時間と、次に電源を入れたときのスタート");
  var r0=U.ctrls(el);
  var kind=U.seg(r0,["スーパーキャパシタ","コイン形の電池"],0,function(){sync();draw();});
  var rc=U.ctrls(el);
  var cap=U.slider(rc,"キャパシタの容量 C<sub>b</sub>",{min:0.01,max:2,log:true,value:0.2,fmt:function(v){return (v<0.1?_w10_f(v*1e3,0)+" mF":_w10_f(v,2).replace(/0$/,"")+" F");},onInput:function(){draw();}});
  var v0=U.slider(rc,"充電した電圧 V<sub>0</sub>",{min:2,max:3.3,step:0.05,value:3.0,fmt:function(v){return _w10_f(v,2)+" V";},onInput:function(){draw();}});
  var lk=U.slider(rc,"漏れ電流",{min:0,max:5,step:0.1,value:1,fmt:function(v){return _w10_f(v,1)+" µA";},onInput:function(){draw();}});
  var vm=U.slider(rc,"最低の電圧 V<sub>min</sub>",{min:1.4,max:2.5,step:0.05,value:1.65,fmt:function(v){return _w10_f(v,2)+" V";},onInput:function(){draw();}});
  var rb=U.ctrls(el);
  var qb=U.slider(rb,"電池の容量 Q<sub>b</sub>",{min:20,max:1000,step:10,value:220,fmt:function(v){return v+" mAh";},onInput:function(){draw();}});
  var sd=U.slider(rb,"自己放電（1 年に）",{min:0,max:5,step:0.1,value:1,fmt:function(v){return _w10_f(v,1)+" %";},onInput:function(){draw();}});
  var r3=U.ctrls(el);
  var ib=U.slider(r3,"バックアップの電流 I<sub>bk</sub>",{min:1,max:100,log:true,value:15,fmt:function(v){return _w10_f(v,v<10?1:0)+" µA";},onInput:function(){draw();}});
  var to=U.slider(r3,"電源を切っていた時間",{values:_W10_TOFF,value:3600,fmt:_w10_tstr,onInput:function(){draw();}});
  var br=U.btnrow(el);
  U.button(br,"本文の例（0.2 F）",function(){kind.set(0);cap.set(0.2);v0.set(3.0);lk.set(1);vm.set(1.65);ib.set(15);to.set(3600);sync();draw();});
  U.button(br,"本文の例（CR2032）",function(){kind.set(1);qb.set(220);sd.set(1);ib.set(15);to.set(604800);sync();draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function sync(){var c=kind.get()===0;rc.style.display=c?"":"none";rb.style.display=c?"none":"";}
  function hold(){var I=ib.get()*1e-6;
    if(kind.get()===0){var It=I+lk.get()*1e-6;return {th:cap.get()*Math.max(0,v0.get()-vm.get())/It,I:It};}
    var Isd=sd.get()/100*qb.get()*1e-3/8760,It2=I+Isd;return {th:qb.get()*1e-3*3600/It2,I:It2,Isd:Isd};}
  function draw(){
    var nar=_w10_nar(box),Wd=nar?400:700,o=[],c=kind.get()===0,hd=hold(),th=hd.th,t=to.get(),st=_w10_start(t,th);
    /* (a) 電圧（キャパシタ）か残り（電池）の時間の変化 */
    var tmax=Math.max(th*1.25,t*1.15),uh=tmax<2*86400?3600:(tmax<120*86400?86400:31536000),un=uh===3600?"時間":(uh===86400?"日":"年");
    var P=U.plot(nar?52:66,30,nar?330:262,160,[0,tmax/uh],c?[0,3.4]:[0,100]);
    o.push(S.T(nar?6:14,16,c?"(a) キャパシタの電圧":"(a) 電池の残り","start",11,"ink",true));
    o.push(P.axes({xl:"主の電源を切ってからの時間 ["+un+"]",yl:c?"電圧 v [V]":"残り [%]",yt:c?[0,1,2,3]:[0,25,50,75,100],sz:9}));
    if(c){o.push(S.L(P.x,P.Y(vm.get()),P.x+P.w,P.Y(vm.get()),"alias",1,"5 3"));
      o.push(S.TX(P.x+4,P.Y(vm.get())+13,"V_{min} "+_w10_f(vm.get(),2)+" V","start",9,"alias",true,true));
      var te=Math.min(th,tmax);o.push(P.line([[0,v0.get()],[te/uh,v0.get()-hd.I*te/cap.get()]],"green",2.4));
      if(th<tmax)o.push(P.line([[th/uh,vm.get()],[tmax/uh,Math.max(0,vm.get()-hd.I*(tmax-th)/cap.get())]],"faint",1.6,"4 3"));}
    else{o.push(P.line([[0,100],[Math.min(th,tmax)/uh,100*(1-Math.min(th,tmax)/th)]],"signal",2.4));}
    o.push(S.L(P.X(Math.min(th,tmax)/uh),P.y,P.X(Math.min(th,tmax)/uh),P.y+P.h,"purple",1,"3 3"));
    o.push(S.T(P.X(Math.min(th,tmax)/uh)-4,P.y+12,"保持時間 "+_w10_tstr(th),"end",9.5,"purple",true,false,null,true));
    var vt=c?Math.max(0,v0.get()-hd.I*t/cap.get()):Math.max(0,100*(1-t/th));
    o.push(S.L(P.X(t/uh),P.y,P.X(t/uh),P.y+P.h,st[1],1.6));
    o.push(S.D(P.X(t/uh),P.Y(c?Math.max(0,vt):vt),st[1],4.5));
    o.push(S.T(P.X(t/uh)+5,P.y+P.h-8,"切っていた時間","start",9,st[1],true,false,null,true));
    /* (b) 時間の帯（対数） */
    var bx=nar?6:372,by=nar?P.y+P.h+58:16,L=U.plot(nar?100:470,by+20,nar?290:214,120,[30,4e7],[0,1],{xlog:true}),X=L.X;
    o.push(S.T(bx,by,"(b) 次のスタート（代表値）","start",11,"ink",true));
    var rows=[["保つ間",by+26],["エフェメリス",by+52],["アルマナック",by+78],["スタート",by+104]];
    rows.forEach(function(r){o.push(S.T(L.x-8,r[1]+12,r[0],"end",9.5,"ink",true));});
    o.push(S.RECT(X(30),rows[0][1],Math.max(1,Math.min(X(4e7),X(Math.max(31,th)))-X(30)),16,3,U.soft("purple"),"purple",1.1));
    o.push(S.RECT(X(30),rows[1][1],X(7200)-X(30),16,3,U.soft("green"),"green",1));o.push(S.RECT(X(7200),rows[1][1],X(14400)-X(7200),16,3,"none","green",1,"3 2"));
    o.push(S.RECT(X(30),rows[2][1],X(1209600)-X(30),16,3,U.soft("gold"),"gold",1));o.push(S.RECT(X(1209600),rows[2][1],X(5184000)-X(1209600),16,3,"none","gold",1,"3 2"));
    [[30,7200,"ホット","green"],[14400,1209600,"ウォーム","gold"],[5184000,4e7,"コールド","alias"]].forEach(function(sg){var a=X(sg[0]),b=X(sg[1]);
      o.push(S.RECT(a,rows[3][1],b-a,16,3,U.soft(sg[3]),sg[3],1));if(b-a>U.tw(sg[2],8.5)+4)o.push(S.T((a+b)/2,rows[3][1]+12,sg[2],"middle",8.5,sg[3],true));});
    o.push(S.L(X(Math.max(30,t)),by+20,X(Math.max(30,t)),by+124,st[1],2));
    [[60,"1 分"],[3600,"1 時間"],[86400,"1 日"],[2592000,"1 か月"],[31536000,"1 年"]].forEach(function(tk){o.push(S.L(X(tk[0]),by+122,X(tk[0]),by+126,"muted",1));o.push(S.T(X(tk[0]),by+137,tk[1],"middle",9,"muted"));});
    o.push(S.T(bx,by+160,"→ "+st[0],"start",11,st[1],true));
    o.push(S.T(bx,by+176,st[2],"start",9,"muted"));
    var Hh=nar?by+186:Math.max(P.y+P.h+44,by+186);
    box.set(S.svg(Wd,Hh,o));
    /* 読み出し */
    var h=c?"保持時間 t<sub>h</sub> = C<sub>b</sub>(V<sub>0</sub> − V<sub>min</sub>)/I = "+_w10_f(cap.get(),3).replace(/0+$/,"").replace(/\.$/,"")+" F × "+_w10_f(v0.get()-vm.get(),2)+" V ÷ "+_w10_f(hd.I*1e6,1)+" µA = <b>"+_w10_g(th)+" s（"+_w10_tstr(th)+"）</b><br>"
      :"保持時間 t<sub>h</sub> = Q<sub>b</sub>/I = "+qb.get()+" mAh ÷ （"+_w10_f(ib.get(),1)+" + 自己放電 "+_w10_f(hd.Isd*1e6,2)+"）µA = <b>"+_w10_g(th/3600)+" 時間（"+_w10_tstr(th)+"）</b><br>";
    var er=20e-6*t;h+="電源を切っていた時間 "+_w10_tstr(t)+"・そのときの"+(c?"電圧 "+_w10_f(vt,2)+" V":"残り "+_w10_f(vt,1)+" %")+"・RTC の誤差（20 ppm）"+(er<1?_w10_f(er*1000,er<0.01?2:0)+" ms":_w10_f(er,er<10?1:0)+" s")+"<br>";
    h+="次に電源を入れたとき: <b><span class=\""+(st[1]==="alias"?"warn":"ok")+"\">"+st[0]+"</span></b>。"+st[2];
    ro.innerHTML=h+'<div class="wnote">'+(c?"キャパシタは一定の電流で電圧が直線に下がる（漏れ電流を足した電流で計算）。V<sub>min</sub> を割ると、RTC とメモリが止まる。":"電池は自己放電を電流に直して足した（電源と周辺の制御シリーズ 3 章 5 節）。電圧は終わり近くまでほぼ一定なので、(a) は残りの割合で描いた。")+
      "スタートの境目（エフェメリス 2〜4 時間、アルマナック 2 週間〜2 か月）は代表値で、受信機によって違う。</div>";
  }
  sync();draw();
};

/* ---- 4 節: 出す文・更新レート・ボーレートと、データ量・負荷率 ---- */
var _W10_SATS={GP:[[5,45,123,47],[13,62,45,49],[15,30,210,44],[18,15,300,38],[20,72,280,50],[23,25,150,42],[24,40,330,45],[29,10,60,36],[30,5,250,null],[31,2,100,null]],
  GL:[[66,35,20,43],[67,55,110,46],[76,20,250,40],[77,48,300,44],[82,8,180,null],[83,3,140,null]],
  GA:[[2,40,70,45],[7,65,200,48],[8,22,320,41],[13,30,140,43],[26,50,260,46],[30,12,30,37],[33,4,190,null]],
  GB:[[6,55,190,42],[9,62,210,44],[16,48,170,43],[19,33,60,45],[20,70,320,47],[29,25,280,41],[35,15,110,38],[44,6,40,null]]};
/* 例の文の並び [[種類, 文（$ から CR LF まで）], …]（図の _f10_nmea と同じ作り方） */
function _w10_nmea(nsys,kinds){var talk=["GP","GL","GA","GB"].slice(0,nsys),used=talk.map(function(t){return _W10_SATS[t].filter(function(s){return s[3]!=null;}).map(function(s){return s[0];});}),nused=0;
  used.forEach(function(u){nused+=u.length;});
  function p2(v){return (v<10?"0":"")+v;} function p3(v){return (v<10?"00":(v<100?"0":""))+v;}
  var bodies=[];
  kinds.forEach(function(k){
    if(k==="GGA")bodies.push([k,"GNGGA,092750.00,3540.86000,N,13946.02000,E,1,"+p2(nused)+",0.80,3.3,M,36.7,M,,"]);
    else if(k==="RMC")bodies.push([k,"GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"]);
    else if(k==="GSA")used.forEach(function(u){var f=u.map(p2);while(f.length<12)f.push("");bodies.push([k,"GNGSA,A,3,"+f.join(",")+",1.50,0.80,1.27"]);});
    else if(k==="GSV")talk.forEach(function(t){var ss=_W10_SATS[t],nm=Math.ceil(ss.length/4);for(var m=0;m<nm;m++){var fl=[t+"GSV",String(nm),String(m+1),p2(ss.length)];
      ss.slice(4*m,4*m+4).forEach(function(s){fl.push(p2(s[0]),p2(s[1]),p3(s[2]),s[3]==null?"":p2(s[3]));});bodies.push([k,fl.join(",")]);}});
    else if(k==="VTG")bodies.push([k,"GNVTG,,T,,M,0.012,N,0.022,K,A"]);
    else if(k==="GLL")bodies.push([k,"GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A"]);});
  return bodies.map(function(b){var x=0;for(var i=0;i<b[1].length;i++)x^=b[1].charCodeAt(i);var hx=x.toString(16).toUpperCase();if(hx.length<2)hx="0"+hx;return [b[0],"$"+b[1]+"*"+hx+"\r\n"];});}
var _W10_KINDS=[["GGA","位置","signal"],["RMC","時刻・位置・速度","purple"],["GSA","使った衛星と DOP","green"],["GSV","見えている衛星","gold"],["VTG","速度","teal"],["GLL","緯度・経度","muted"]];
REG.w10_uart=function(el,U){
  var S=U.S;
  U.head(el,"UART LOAD","出す文・更新レート・ボーレートと、データ量・負荷率");
  var r1=U.ctrls(el),ck={};
  _W10_KINDS.forEach(function(k){ck[k[0]]=U.checkbox(r1,k[0]+"（"+k[1]+"）",true,function(){draw();});});
  var r2=U.ctrls(el);
  var sys=U.select(r2,"衛星系",["GPS","GPS + GLONASS","GPS + GLONASS + Galileo","GPS + GLONASS + Galileo + BeiDou"],1,function(){draw();});
  var rate=U.slider(r2,"更新レート（13 章）",{values:[1,2,4,5,10],value:1,fmt:function(v){return v+" 回/s";},onInput:function(){draw();}});
  var bauds=[4800,9600,19200,38400,57600,115200,230400,460800,921600];
  var baud=U.select(r2,"ボーレート",bauds.map(function(b){return {v:String(b),t:_w10_g(b)+" bit/s"};}),"9600",function(){draw();});
  var br=U.btnrow(el),show=false;
  U.button(br,"本文の例（GPS + GLONASS・1 回/s・9600 bit/s）",function(){_W10_KINDS.forEach(function(k){ck[k[0]].set(true);});sys.set(1);rate.set(1);baud.set("9600");draw();});
  U.button(br,"2 回/s にする",function(){rate.set(2);draw();});
  U.button(br,"5 回/s・115 200 bit/s",function(){rate.set(5);baud.set("115200");draw();});
  var sb=U.button(br,"例の文を見る",function(){show=!show;sb.textContent=show?"例の文を隠す":"例の文を見る";draw();});
  var box=U.svgbox(el),ro=U.readout(el),pre=U.mk("div","wnote");el.appendChild(pre);
  function draw(){
    var kinds=_W10_KINDS.map(function(k){return k[0];}).filter(function(k){return ck[k].get();}),ns=sys.get()+1,ss=_w10_nmea(ns,kinds),
      tot=0;ss.forEach(function(s){tot+=s[1].length;});
    var R=rate.get(),B=parseInt(baud.get(),10),D=tot*R,load=10*D/B,burst=tot*10/B,nar=_w10_nar(box),Wd=nar?400:700,o=[];
    var bad=load>1;
    /* (a) 1 回に出す文のバイト数 */
    o.push(S.T(nar?6:14,16,"(a) 1 回に出す文: "+ss.length+" 文・"+tot+" バイト","start",11,"ink",true));
    var x0=nar?6:14,ww=nar?388:672,sc=ww/Math.max(1000,tot),xx=x0,lx=x0,ly=64;
    _W10_KINDS.forEach(function(k){var ls=ss.filter(function(s){return s[0]===k[0];}).map(function(s){return s[1].length;});if(!ls.length)return;
      var sum=0;ls.forEach(function(l){sum+=l;});
      ls.forEach(function(l){o.push(S.RECT(xx,26,l*sc,22,2,U.soft(k[2]),k[2],1));xx+=l*sc;});
      var mid=xx-sum*sc/2;if(sum*sc>22)o.push(S.T(mid,41,k[0],"middle",8.5,k[2],true));
      var lab=k[0]+(ls.length>1?" ×"+ls.length:"")+" "+sum+" B",lw=U.tw(lab,9)+12;if(lx+lw>x0+ww){lx=x0;ly+=14;}
      o.push(S.T(lx,ly,lab,"start",9,k[2],true));lx+=lw;});
    /* (b) 線の上の時間（2 s） */
    var yb=ly+24,P=U.plot(nar?6:14,yb+18,nar?388:672,26,[0,2],[0,1]);
    o.push(S.T(nar?6:14,yb+6,"(b) 線の上の時間（8N1。濃い所が送っている時間、縦の線は位置を出す時刻）","start",nar?9.5:11,"ink",true));
    o.push(S.RECT(P.x,P.y,P.w,P.h,2,"var(--screen)","line",0.8));
    var rb=B/10,q=0,tprev=0,maxq=0,busy=[],ep=[];
    for(var k=0;k<=Math.round(2*R);k++)ep.push(k/R);
    ep.forEach(function(te,i){if(i>0){var dt=te-ep[i-1];if(q>0){var send=Math.min(q,rb*dt);busy.push([ep[i-1],Math.min(2,ep[i-1]+send/rb)]);q-=send;}}if(te<2){q+=tot;maxq=Math.max(maxq,q);}});
    var cl=bad?"alias":"gold";
    busy.forEach(function(b){o.push(S.RECT(P.X(b[0]),P.y,Math.max(1,P.X(b[1])-P.X(b[0])),P.h,0,U.soft(cl),cl,1));});
    ep.forEach(function(te){if(te<2)o.push(S.L(P.X(te),P.y-4,P.X(te),P.y+P.h+4,"ink",1.4));});
    [0,0.5,1,1.5,2].forEach(function(v){o.push(S.T(P.X(v)-(v===2?2:0),P.y+P.h+15,v===2?"2 s":String(v),v===2?"end":"middle",9,"muted"));});
    var back=tot*ep.filter(function(e){return e<2;}).length-2*rb;
    if(bad)o.push(S.T(P.x+P.w,P.y-6,"2 s までに "+_w10_g(back)+" B がたまる","end",9.5,"alias",true,false,null,true));
    /* (c) 負荷率 */
    var yc=yb+80,Q=U.plot(nar?6:14,yc+18,nar?388:672,20,[0,2],[0,1]);
    o.push(S.TX(nar?6:14,yc+6,"(c) 負荷率 = 10 D / R_B = "+_w10_f(load*100,load<0.1?1:0)+" %","start",11,bad?"alias":"ink",true));
    o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,2,"var(--screen)","line",0.8));
    o.push(S.RECT(Q.x,Q.y,Math.max(1,Q.X(Math.min(2,load))-Q.x),Q.h,2,U.soft(bad?"alias":"green"),bad?"alias":"green",1));
    o.push(S.L(Q.X(1),Q.y-4,Q.X(1),Q.y+Q.h+4,"alias",1.6,"4 3"));
    o.push(S.T(Q.X(1),Q.y+Q.h+15,"100 %","middle",9,"alias",true));
    o.push(S.T(Q.x,Q.y+Q.h+15,"0","start",9,"muted"));o.push(S.T(Q.x+Q.w,Q.y+Q.h+15,"200 %","end",9,"muted"));
    box.set(S.svg(Wd,yc+62,o));
    var h="1 回 <b>"+tot+" バイト</b>（"+ss.length+" 文）× "+R+" 回/s = データ量 D = <b>"+_w10_g(D)+" B/s</b>、線の上では "+_w10_g(10*D)+" bit/s<br>";
    h+="ボーレート "+_w10_g(B)+" bit/s で送れるのは "+_w10_g(rb)+" B/s、負荷率 <b>"+_w10_f(load*100,load<0.1?1:0)+" %</b>、1 回の文を出し終えるまで "+_w10_f(burst*1000,burst<0.1?1:0)+" ms<br>";
    h+=bad?'<span class="warn">送り切れない: 1 秒に '+_w10_g(D-rb)+" B ずつたまり、文が遅れるか捨てられる（製品による）。ボーレートを上げるか、出す文を減らす（13 章）</span>"
      :(load>0.8?'<span class="warn">余裕が少ない（文がまとめて出る間、線がほとんど空かない）</span>':'<span class="ok">送り切れる</span>（マイコンは 1 回分 '+tot+" バイトを取りこぼさずに受ける。15 章）");
    ro.innerHTML=h;
    pre.style.display=show?"":"none";
    pre.innerHTML=show?'<div style="font-family:var(--mono);font-size:11px;white-space:pre;overflow-x:auto">'+ss.map(function(s){return U.esc(s[1].replace("\r\n",""))+"  ("+s[1].length+")";}).join("\n")+'</div>文の長さは $ から * とチェックサム、CR LF までを数えた（中身は例。形は 12 章）。':"";
  }
  draw();
};

/* ===== 11 章 RF の基板設計 — 50 Ω の配線と部品の置き方 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w11_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w11_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
var _W11_C=299792458,_W11_F1=1575.42e6,_W11_ER=4.4,_W11_H=0.2,_W11_T=0.035;
/* ---- 線路の式（本文 2 節と同じ） ---- */
/* マイクロストリップ線路の近似式（IPC-2141 の形。基板アートワークシリーズ 10 章 3 節と同じ式）。単位 mm */
function _w11_zipc(w,h,t,er){return 87/Math.sqrt(er+1.41)*Math.log(5.98*h/(0.8*w+t));}
function _w11_eesimple(w,h,er){return (er+1)/2+(er-1)/2/Math.sqrt(1+12*h/w);}
/* Hammerstad と Jensen の式（銅の厚さの補正つき。数値の計算と例の範囲で 1 % 以内で一致する）。返り値 [Z0, 実効比誘電率] */
function _w11_hj(w,h,t,er){var ETA=376.730313668,u=w/h,du1=0,dur=0;
  function z01(u){var f=6+(2*Math.PI-6)*Math.exp(-Math.pow(30.666/u,0.7528));return ETA/(2*Math.PI)*Math.log(f/u+Math.sqrt(1+4/(u*u)));}
  function ee(u){var a=1+Math.log((Math.pow(u,4)+Math.pow(u/52,2))/(Math.pow(u,4)+0.432))/49+Math.log(1+Math.pow(u/18.1,3))/18.7,b=0.564*Math.pow((er-0.9)/(er+3),0.053);return (er+1)/2+(er-1)/2*Math.pow(1+10/u,-a*b);}
  if(t>0){var th=t/h,ct=1/Math.tanh(Math.sqrt(6.517*u));du1=th/Math.PI*Math.log(1+4*Math.E/(th*ct*ct));dur=0.5*(1+1/Math.cosh(Math.sqrt(er-1)))*du1;}
  var u1=u+du1,ur=u+dur;return [z01(ur)/Math.sqrt(ee(ur)),ee(ur)*Math.pow(z01(u1)/z01(ur),2)];}
/* 第 1 種の完全楕円積分 K(k)（算術幾何平均） */
function _w11_K(k){var a=1,b=Math.sqrt(1-k*k);for(var i=0;i<40;i++){var a2=(a+b)/2;b=Math.sqrt(a*b);a=a2;if(Math.abs(a-b)<1e-15)break;}return Math.PI/(2*a);}
function _w11_kk(k){return _w11_K(k)/_w11_K(Math.sqrt(1-k*k));}
/* コプレーナ線路（グラウンド付き）の、上の銅の厚さを 0 とした等角写像の近似式。返り値 [Z0, 実効比誘電率] */
function _w11_gcpw(w,s,h,er){var k1=w/(w+2*s),k2=Math.tanh(Math.PI*w/(4*h))/Math.tanh(Math.PI*(w+2*s)/(4*h)),a=_w11_kk(k1),b=_w11_kk(k2);
  var ee=(1+er*b/a)/(1+b/a);return [60*Math.PI/Math.sqrt(ee)/(a+b),ee];}
/* 例の基板（h）で特性インピーダンス z になるマイクロストリップ線路の幅（Hammerstad と Jensen の式を二分法で解く） */
function _w11_wfor(z,h){var lo=0.005,hi=20;for(var i=0;i<60;i++){var m=Math.sqrt(lo*hi);if(_w11_hj(m,h,_W11_T,_W11_ER)[0]>z)lo=m;else hi=m;}return Math.sqrt(lo*hi);}

/* ---- 断面の 2 次元の静電界（有限体積法。図の計算（f11.py）と同じ考え方で、対称な右半分だけを解く） ---- */
function _w11_grid(keys,lo,hi,fine,grow,cap){keys=keys.filter(function(k){return k>=lo&&k<=hi;}).concat([lo,hi]).sort(function(a,b){return a-b;});
  var pts=[lo];while(pts[pts.length-1]<hi-1e-12){var x=pts[pts.length-1],d=Infinity,nxt=hi;
    keys.forEach(function(k){d=Math.min(d,Math.abs(x-k));if(k>x+1e-12&&k<nxt)nxt=k;});
    var st=Math.min(cap,fine+(grow-1)*d);st=Math.min(st,fine+(grow-1)*Math.max(0,nxt-x-st));st=Math.max(st,fine*0.5);
    if(x+st>nxt-0.3*fine)st=nxt-x;pts.push(x+st);}
  return pts;}
/* 線（幅 w、厚さ t、誘電体の厚さ h、比誘電率 er、隙間 s（null ならマイクロストリップ））の電位を、格子の細かさ fine で解く。
   返り値 {W: 誘電体ありのエネルギー（容量に比例）, Wa: 空気だけ, xs, ys, phi}（右半分） */
function _w11_fd(w,h,t,er,s,fine){
  var X=Math.max(25*h,1.5*w+12*h,(s!=null?w/2+s:0)+12*h),Y=Math.max(25*h,12*h+w),cap=h;
  var xs=_w11_grid([0,w/2].concat(s!=null?[w/2+s]:[]),0,X,fine,1.25,cap),ys=_w11_grid([0,h,h+t],0,Y,fine,1.25,cap);
  var nx=xs.length,ny=ys.length,i,j,k;
  var V=new Float64Array(nx*ny),fix=new Uint8Array(nx*ny);
  for(i=0;i<nx;i++)for(j=0;j<ny;j++){var x=xs[i],y=ys[j],q=i*ny+j,inC=(y>=h-1e-12&&y<=h+t+1e-12);
    if(x<=w/2+1e-12&&inC){fix[q]=1;V[q]=1;}
    else if(y<=1e-12||x>=X-1e-12||y>=Y-1e-12||(s!=null&&x>=w/2+s-1e-12&&inC)){fix[q]=1;V[q]=0;}}
  /* 並べ方: 帯の幅が小さくなる向き */
  var byX=nx<ny,bw=byX?nx:ny,n=nx*ny,B1=bw+1;
  var ID=new Int32Array(nx*ny);for(i=0;i<nx;i++)for(j=0;j<ny;j++)ID[i*ny+j]=byX?j*nx+i:i*ny+j;
  function run(e){
    var GE=new Float64Array(nx*ny),GN=new Float64Array(nx*ny);   /* (i,j)-(i+1,j) と (i,j)-(i,j+1) のコンダクタンス */
    for(i=0;i<nx-1;i++)for(j=0;j<ny;j++){var dx=xs[i+1]-xs[i],lo=0,up=0;
      if(j>0)lo=((ys[j-1]+ys[j]<2*h)?e:1)*(ys[j]-ys[j-1])/2;if(j<ny-1)up=((ys[j]+ys[j+1]<2*h)?e:1)*(ys[j+1]-ys[j])/2;GE[i*ny+j]=(lo+up)/dx;}
    for(i=0;i<nx;i++)for(j=0;j<ny-1;j++){var dy=ys[j+1]-ys[j],em=(ys[j]+ys[j+1]<2*h)?e:1,le=i>0?em*(xs[i]-xs[i-1])/2:0,ri=i<nx-1?em*(xs[i+1]-xs[i])/2:0;GN[i*ny+j]=(le+ri)/dy;}
    var A=new Float64Array(n*B1),b=new Float64Array(n);
    function add(p1,p2,g){var a=ID[p1],c=ID[p2],fa=fix[p1],fc=fix[p2];
      if(!fa){A[a*B1]+=g;if(fc)b[a]+=g*V[p2];}
      if(!fc){A[c*B1]+=g;if(fa)b[c]+=g*V[p1];}
      if(!fa&&!fc){var hi=a>c?a:c,lo2=a>c?c:a;A[hi*B1+(hi-lo2)]-=g;}}
    for(i=0;i<nx-1;i++)for(j=0;j<ny;j++)add(i*ny+j,(i+1)*ny+j,GE[i*ny+j]);
    for(i=0;i<nx;i++)for(j=0;j<ny-1;j++)add(i*ny+j,i*ny+j+1,GN[i*ny+j]);
    for(k=0;k<nx*ny;k++)if(fix[k]){var q2=ID[k];A[q2*B1]=1;b[q2]=V[k];}
    /* 帯の Cholesky 分解 L L^T（L(r, c) を A[r*B1 + (r − c)] に上書きする） */
    var r,c,kk,sm,pr,pc;
    for(r=0;r<n;r++){var r0=r-bw>0?r-bw:0;pr=r*B1+r;
      for(c=r0;c<=r;c++){pc=c*B1+c;sm=A[pr-c];var k0=c-bw>r0?c-bw:r0;
        for(kk=k0;kk<c;kk++)sm-=A[pr-kk]*A[pc-kk];
        if(c===r)A[r*B1]=Math.sqrt(sm>1e-300?sm:1e-300);else A[pr-c]=sm/A[c*B1];}}
    var yv=new Float64Array(n);
    for(r=0;r<n;r++){sm=b[r];pr=r*B1+r;for(kk=(r-bw>0?r-bw:0);kk<r;kk++)sm-=A[pr-kk]*yv[kk];yv[r]=sm/A[r*B1];}
    var xv=new Float64Array(n),nm=n-1;
    for(r=nm;r>=0;r--){sm=yv[r];var ke=r+bw<nm?r+bw:nm;for(kk=r+1;kk<=ke;kk++)sm-=A[kk*B1+(kk-r)]*xv[kk];xv[r]=sm/A[r*B1];}
    var phi=new Float64Array(nx*ny);for(k=0;k<nx*ny;k++)phi[k]=xv[ID[k]];
    var Wd=0,d;
    for(i=0;i<nx-1;i++)for(j=0;j<ny;j++){d=phi[i*ny+j]-phi[(i+1)*ny+j];Wd+=GE[i*ny+j]*d*d;}
    for(i=0;i<nx;i++)for(j=0;j<ny-1;j++){d=phi[i*ny+j]-phi[i*ny+j+1];Wd+=GN[i*ny+j]*d*d;}
    return {W:Wd,phi:phi};}
  var rd=run(er),ra=run(1);
  return {W:rd.W,Wa:ra.W,xs:xs,ys:ys,phi:rd.phi,nx:nx,ny:ny};}
/* 2 つの細かさで解いて外挿した特性インピーダンスと実効比誘電率（誤差は格子の細かさにほぼ比例するので、2 Z(f) − Z(2f)） */
function _w11_line(w,h,t,er,s){var m=Math.min(h,w/2,s!=null?s:9),f=m/16;
  var a=_w11_fd(w,h,t,er,s,f),b=_w11_fd(w,h,t,er,s,2*f),EPS0=8.8541878128e-12;
  function z(r){return 1/(_W11_C*EPS0*2*Math.sqrt(r.W*r.Wa));}   /* 右半分のエネルギーの 2 倍が全体 */
  return {Z0:2*z(a)-z(b),ee:2*(a.W/a.Wa)-(b.W/b.Wa),fd:a};}

/* ---- 共通: スミスチャートの地（50 Ω で正規化） ---- */
function _w11_smith(S,o,cx,cy,R){
  function g2(G){return [cx+R*G[0],cy-R*G[1]];}
  function zg(r,x){var d=(r+1)*(r+1)+x*x;return [((r*r-1)+x*x)/d,2*x/d];}
  o.push(S.CIRC(cx,cy,R,"ink",1.3,"screen"));o.push(S.L(cx-R,cy,cx+R,cy,"muted",1));
  var lg=[],i;for(i=-30;i<=30;i++)lg.push(Math.pow(10,i/10));
  [0.2,0.5,1,2].forEach(function(r){var q=[];lg.forEach(function(x){q.push(g2(zg(r,-x)));});q.reverse();q.push(g2(zg(r,0)));lg.forEach(function(x){q.push(g2(zg(r,x)));});o.push(S.PL(q,r===1?"muted":"faint",r===1?1:0.8,null,r===1?null:"3 3"));});
  [0.5,1,2].forEach(function(x){[1,-1].forEach(function(sg){var q=[g2(zg(0,sg*x))];lg.forEach(function(r){q.push(g2(zg(r,sg*x)));});o.push(S.PL(q,"faint",0.8,null,"3 3"));});});
  o.push(S.T(cx-R-4,cy-5,"短絡","end",9,"ink",true));o.push(S.T(cx+R+4,cy-5,"開放","start",9,"ink",true));
  return g2;}
/* 複素数の小さな計算 */
function _w11_cdiv(a,b){var d=b[0]*b[0]+b[1]*b[1];return [(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];}
function _w11_cmul(a,b){return [a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];}
function _w11_gam(z,zr){return _w11_cdiv([z[0]-zr,z[1]],[z[0]+zr,z[1]]);}
/* ---- 1 節の後: 線の特性インピーダンス・長さ・負荷・周波数と、反射 ---- */
REG.w11_reflect=function(el,U){
  var S=U.S;
  U.head(el,"WHY 50 Ω","50 Ω の部品の間の線 — 線の上の電圧の振幅とスミスチャート、手前から見た反射");
  var r1=U.ctrls(el);
  var brd=U.select(r1,"基板",["例の 4 層の基板（h = 0.2 mm）","2 層の基板（h = 1.6 mm）"],0,function(){zz.refresh();draw();});
  var zz=U.slider(r1,"線の Z<sub>0</sub>",{min:25,max:130,step:1,value:75,fmt:function(v){var w=_w11_wfor(v,hh());return v+" Ω（幅 "+(w<0.03?"0.03 mm 未満で作れない":_w11_f(w,w<1?2:1)+" mm")+"）";},onInput:function(){draw();}});
  var ll=U.slider(r1,"線の長さ ℓ",{min:0,max:60,step:0.1,value:27.8,fmt:function(v){return _w11_f(v,1)+" mm";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var LOADS=[{t:"モジュールの入力（50 Ω）",z:[50,0]},{t:"25 Ω",z:[25,0]},{t:"100 Ω",z:[100,0]},{t:"30 − j20 Ω（6 節の例のアンテナ）",z:[30,-20]},{t:"開放",z:[Infinity,0]},{t:"短絡",z:[0,0]}];
  var ld=U.select(r2,"負荷",LOADS.map(function(L){return L.t;}),0,function(){draw();});
  var FR=[["L1（1575.42 MHz）",1575.42e6],["L5（1176.45 MHz）",1176.45e6],["10 MHz",10e6]];
  var fq=U.select(r2,"周波数",FR.map(function(f){return f[0];}),0,function(){draw();});
  var br=U.btnrow(el);
  function setv(b,z,l,L,f){brd.set(b);zz.set(z);ll.set(l);ld.set(L);fq.set(f);zz.refresh();draw();}
  U.button(br,"本文の例（75 Ω・1/4 波長 27.8 mm）",function(){setv(0,75,27.8,0,0);});
  U.button(br,"50 Ω の線",function(){setv(0,50,27.8,0,0);});
  U.button(br,"75 Ω で 1/10 波長（10 mm）",function(){setv(0,75,10,0,0);});
  U.button(br,"2 層の基板の幅 0.3 mm（126 Ω）",function(){setv(1,126,27.8,0,0);});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"線の寸法と実効比誘電率は、選んだ基板（比誘電率 4.4・銅 35 µm）で Hammerstad と Jensen の式（2 節の数値の計算と 1 % 以内）から求めた。線の損失は無いとした。手前は 50 Ω の部品（アンテナや LNA の出力）で、手前から見た反射は 50 Ω を基準にした値。");
  function hh(){return brd.get()===0?0.2:1.6;}
  function draw(){
    var nar=_w11_nar(box),Wd=nar?400:700,o=[],z0=zz.get(),L=ll.get(),f=FR[fq.get()][1],zl=LOADS[ld.get()].z;
    var w=_w11_wfor(z0,hh()),ee=_w11_hj(w,hh(),_W11_T,_W11_ER)[1],lg=_W11_C/f*1e3/Math.sqrt(ee),beta=2*Math.PI/lg;
    /* 負荷の反射係数（線の Z0 を基準） */
    var gL=isFinite(zl[0])?_w11_gam(zl,z0):[1,0];
    function zinAt(d){var e=[Math.cos(2*beta*d),-Math.sin(2*beta*d)],g=_w11_cmul(gL,e);var den=[1-g[0],-g[1]];if(Math.hypot(den[0],den[1])<1e-12)return [1e12,0];return _w11_cdiv([z0*(1+g[0]),z0*g[1]],den);}
    /* (a) 線と電圧の振幅 */
    var ax=nar?40:44,aw=nar?320:340,ay=36,ah=110;
    o.push(S.T(10,18,"(a) 線の上の電圧の振幅（入ってくる波 = 1）","start",10.5,"ink",true));
    var P=U.plot(ax,ay,aw,ah,[0,60],[0,2.1]);
    o.push(P.axes({xt:[0,10,20,30,40,50,60],yt:[0,1,2],xfmt:function(v){return String(v);},yfmt:function(v){return String(v);}}));
    o.push(S.T(ax+aw/2,ay+ah+31,"信号源からの距離 [mm]","middle",10,"muted"));
    var pts=[],k;for(k=0;k<=240;k++){var x=L*k/240,d=L-x;pts.push([x,Math.hypot(1+gL[0]*Math.cos(2*beta*d)+gL[1]*Math.sin(2*beta*d),-gL[0]*Math.sin(2*beta*d)+gL[1]*Math.cos(2*beta*d))]);}
    if(L>0)o.push(P.line(pts,"purple",2.2));
    /* 線（基板の上） */
    var ly=ay+ah+64;o.push(S.RECT(P.X(0),ly-6,Math.max(P.X(L)-P.X(0),1),12,2,U.soft("gold"),"gold",1));
    o.push(S.L(P.X(0),ly,P.X(L),ly,"signal",3));
    o.push(S.RECT(P.X(0)-26,ly-10,22,20,3,"panel","ink",1.2));o.push(S.T(P.X(0)-15,ly+28,"信号源","middle",9,"ink",true));
    o.push(S.RECT(P.X(L)+4,ly-10,22,20,3,U.soft("alias"),"alias",1.2));o.push(S.T(P.X(L)+15,ly+28,"負荷","middle",9,"alias",true));
    o.push(S.T(P.X(L/2),ly-12,"線 "+z0+" Ω・"+_w11_f(L,1)+" mm","middle",9.5,"signal",true,false,null,true));
    /* (b) スミスチャート */
    var cx=nar?200:560,cy=nar?ly+194:150,R=nar?120:118;
    o.push(S.T(nar?10:430,nar?ly+56:18,"(b) 手前から見たインピーダンス（50 Ω を基準）","start",10.5,"ink",true));
    var g2=_w11_smith(S,o,cx,cy,R);
    var full=[],part=[];for(k=0;k<=200;k++){var d1=lg/2*k/200;full.push(g2(_w11_gam(zinAt(d1),50)));}
    for(k=0;k<=200;k++){var d2=L*k/200;part.push(g2(_w11_gam(zinAt(d2),50)));}
    o.push(S.PL(full,"faint",1.2,null,"4 3"));o.push(S.PL(part,"signal",2.2));
    var zin=zinAt(L),gin=_w11_gam(zin,50),mg=Math.min(1,Math.hypot(gin[0],gin[1]));
    var pL=g2(isFinite(zl[0])?_w11_gam(zl,50):[1,0]),pI=g2(gin);
    o.push(S.D(pL[0],pL[1],"alias",5));o.push(S.D(pI[0],pI[1],"signal",5.5));
    o.push(S.T(pL[0]+7,pL[1]+15,"負荷","start",9.5,"alias",true,false,null,true));
    o.push(S.T(pI[0]+(gin[0]>0.25?-7:7),pI[1]-8,"手前から見た点",gin[0]>0.25?"end":"start",9.5,"signal",true,false,null,true));
    var H=nar?cy+R+20:Math.max(cy+R+24,ly+40);
    box.set(S.svg(Wd,H,o));
    var rl=-20*Math.log10(Math.max(mg,1e-12)),vs=mg>=0.9999?Infinity:(1+mg)/(1-mg),ml=mg>=0.9999?Infinity:-10*Math.log10(1-mg*mg);
    var zt=Math.abs(zin[0])>1e9?"∞（開放）":_w11_f(zin[0],1)+(zin[1]<0?" − j":" + j")+_w11_f(Math.abs(zin[1]),1)+" Ω";
    ro.innerHTML="線の上の波長 λ<sub>g</sub> = "+_w11_f(lg,1)+" mm（実効比誘電率 "+_w11_f(ee,2)+"）、ℓ = "+_w11_f(L/lg,3)+" λ<sub>g</sub>（Γ の回る角 2βℓ = "+_w11_f(720*L/lg%360,0)+"°）<br>"+
      "手前から見たインピーダンス Z<sub>in</sub> = <b>"+zt+"</b>、|Γ| = <b>"+_w11_f(mg,3)+"</b><br>"+
      "リターンロス <b>"+(rl>99?"∞":_w11_f(rl,1)+" dB")+"</b>、VSWR <b>"+(isFinite(vs)?_w11_f(vs,2):"∞")+"</b>、不整合損失 <b>"+(isFinite(ml)?_w11_f(ml,2)+" dB":"∞")+"</b>（負荷に渡る電力 "+_w11_f(100*(1-mg*mg),1)+" %）"+
      (Math.abs(z0-50)<0.5&&ld.get()===0?' <span class="ok">50 Ω の線なので、どの長さでも反射は無い</span>':"");
  }
  draw();
};

/* ---- 2 節の後: 断面の寸法を変えて、数値で解いた電位と特性インピーダンスを近似式と比べる ---- */
REG.w11_line=function(el,U){
  var S=U.S;
  U.head(el,"CROSS SECTION","線の断面 — 数値で解いた電位と特性インピーダンス、近似式との比較");
  var r1=U.ctrls(el);
  var kind=U.seg(r1,["マイクロストリップ線路","コプレーナ線路（グラウンド付き）"],0,function(){upd();});
  var r2=U.ctrls(el);
  var ww=U.slider(r2,"線の幅 w",{min:0.05,max:4,log:true,value:0.351,snap:function(v){return v<1?Math.round(v*1000)/1000:Math.round(v*100)/100;},fmt:function(v){return _w11_f(v,v<1?3:2)+" mm";},onInput:function(){upd();}});
  var ss=U.slider(r2,"隙間 s（コプレーナ）",{min:0.1,max:1.0,step:0.01,value:0.2,fmt:function(v){return _w11_f(v,2)+" mm";},onInput:function(){if(kind.get()===0)kind.set(1);upd();}});
  var r3=U.ctrls(el);
  var hh=U.slider(r3,"誘電体の厚さ h",{values:[0.1,0.15,0.2,0.3,0.4,0.6,0.8,1.0,1.2,1.6],value:0.2,fmt:function(v){return _w11_f(v,2)+" mm";},onInput:function(){upd();}});
  var er=U.slider(r3,"比誘電率 ε<sub>r</sub>",{min:2.2,max:10,step:0.1,value:4.4,fmt:function(v){return _w11_f(v,1);},onInput:function(){upd();}});
  var tt=U.slider(r3,"銅の厚さ t<sub>Cu</sub>",{values:[0,0.018,0.035,0.07],value:0.035,fmt:function(v){return v===0?"0（式と同じ）":_w11_f(v*1000,0)+" µm";},onInput:function(){upd();}});
  var br=U.btnrow(el);
  function setv(k,w,s,h,e,t){kind.set(k);ww.set(w);ss.set(s);hh.set(h);er.set(e);tt.set(t);upd();}
  U.button(br,"本文の例（0.35 mm）",function(){setv(0,0.351,0.2,0.2,4.4,0.035);});
  U.button(br,"近似式の幅（0.33 mm）",function(){setv(0,0.330,0.2,0.2,4.4,0.035);});
  U.button(br,"コプレーナ（0.31 mm・隙間 0.2 mm）",function(){setv(1,0.308,0.2,0.2,4.4,0.035);});
  U.button(br,"コプレーナ（厚さ 0 の式の幅 0.36 mm）",function(){setv(1,0.360,0.2,0.2,4.4,0.035);});
  U.button(br,"2 層の基板（1.6 mm・幅 3.0 mm）",function(){setv(0,3.0,0.2,1.6,4.4,0.035);});
  var b50=U.button(br,"50 Ω の幅を数値の計算で探す",function(){find50();});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"断面の静電界を、細かさの違う 2 つの格子で解いて外挿した（右半分だけを解き、外側の箱は 0 V）。近似式は本文 2 節の式（マイクロストリップ線路は IPC-2141 の形、コプレーナ線路は銅の厚さを 0 とした等角写像の式）。誘電体の損失は、誘電正接 0.02（FR-4 の例の値）として実効比誘電率から求めた（銅の損失は含まない）。");
  var pend=null;
  function upd(){if(pend)return;pend=setTimeout(function(){pend=null;draw();},16);}
  function cur(){return {g:kind.get()===1,w:ww.get(),s:ss.get(),h:hh.get(),e:er.get(),t:tt.get()};}
  function calc(c){return _w11_line(c.w,c.h,c.t,c.e,c.g?c.s:null);}
  function approx(c){if(c.g)return _w11_gcpw(c.w,c.s,c.h,c.e);return [_w11_zipc(c.w,c.h,c.t,c.e),_w11_eesimple(c.w,c.h,c.e)];}
  function find50(){var c=cur(),w0=c.w,f=function(w){var q=cur();q.w=w;return calc(q).Z0-50;};
    /* 近似式の幅から始めて、割線法で数値の計算の 50 Ω の幅を探す */
    var lo=0.02,hi=10;for(var i=0;i<60;i++){var m=Math.sqrt(lo*hi),q=cur();q.w=m;if(approx(q)[0]>50)lo=m;else hi=m;}
    var a=Math.sqrt(lo*hi),b=a*1.06,fa=f(a),fb=f(b);
    for(var it=0;it<6&&Math.abs(fb)>0.005;it++){var nw=b-fb*(b-a)/(fb-fa);if(!(nw>0.02))break;a=b;fa=fb;b=nw;fb=f(b);}
    if(isFinite(b)&&b>0.02&&b<10)ww.set(Math.round(b*1000)/1000);else ww.set(w0);draw();}
  function contours(r,lev){var xs=r.xs,ys=r.ys,ny=r.ny,ph=r.phi,out=[],i,j;
    for(i=0;i<r.nx-1;i++)for(j=0;j<ny-1;j++){var v=[ph[i*ny+j],ph[(i+1)*ny+j],ph[(i+1)*ny+j+1],ph[i*ny+j+1]],p=[[xs[i],ys[j]],[xs[i+1],ys[j]],[xs[i+1],ys[j+1]],[xs[i],ys[j+1]]],q=[];
      for(var k=0;k<4;k++){var a=v[k],b=v[(k+1)%4];if((a-lev)*(b-lev)<0){var tt2=(lev-a)/(b-a),pa=p[k],pb=p[(k+1)%4];q.push([pa[0]+tt2*(pb[0]-pa[0]),pa[1]+tt2*(pb[1]-pa[1])]);}}
      if(q.length===2)out.push(q);else if(q.length===4){out.push([q[0],q[1]]);out.push([q[2],q[3]]);}}
    return out;}
  function draw(){
    var c=cur(),nar=_w11_nar(box),Wd=nar?400:700,o=[];
    ss.el.style.opacity=c.g?"1":"0.55";
    var r=calc(c),ap=approx(c),lg=_W11_C/_W11_F1*1e3/Math.sqrt(r.ee);
    /* 断面（線の周りを拡大） */
    var xr=Math.max(c.w/2+(c.g?c.s:0)+2.2*c.h,c.w/2+3*c.h),top=Math.max(3*c.h,c.w*0.9),pw=nar?370:420,phh=nar?190:230;
    var sc=Math.min(pw/(2*xr),(phh-30)/(top+0.35*c.h)),x0=nar?15:14,y0=46+top*sc;
    function X(v){return x0+pw/2+v*sc;}function Y(v){return y0-v*sc;}
    o.push(S.T(10,18,"(a) 断面と等電位の線（線 1 V・グラウンド 0 V、0.1 V おき）","start",10.5,"ink",true));
    var id="w11cl"+Math.round(Math.random()*1e9),clip='<clipPath id="'+id+'"><rect x="'+X(-xr)+'" y="'+Y(top)+'" width="'+(2*xr*sc)+'" height="'+(top*sc)+'"/></clipPath>';
    var body=[S.RECT(X(-xr),Y(c.h),2*xr*sc,c.h*sc,0,U.soft("gold"),"none",0)];
    for(var lev=0.1;lev<0.95;lev+=0.1){contours(r.fd,lev).forEach(function(sg){var a=sg[0],b=sg[1];if(Math.max(a[0],b[0])>xr+0.5||Math.min(a[1],b[1])>top+0.5)return;
      body.push(S.L(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),"purple",1));body.push(S.L(X(-a[0]),Y(a[1]),X(-b[0]),Y(b[1]),"purple",1));});}
    o.push(clip+'<g clip-path="url(#'+id+')">'+body.join("")+'</g>');
    o.push(S.L(X(-xr),Y(c.h),X(xr),Y(c.h),"gold",0.8));
    o.push(S.RECT(X(-xr),y0,2*xr*sc,7,0,"var(--muted-soft)","muted",1));
    var tp=Math.max(c.t*sc,2);
    o.push(S.RECT(X(-c.w/2),Y(c.h)-tp,c.w*sc,tp,0,"signal","signal",0.6));
    if(c.g){o.push(S.RECT(X(-xr),Y(c.h)-tp,(xr-c.w/2-c.s)*sc,tp,0,"var(--muted-soft)","muted",0.8));o.push(S.RECT(X(c.w/2+c.s),Y(c.h)-tp,(xr-c.w/2-c.s)*sc,tp,0,"var(--muted-soft)","muted",0.8));}
    o.push(S.T(X(0),Y(c.h)-tp-6,"w = "+_w11_f(c.w,c.w<1?3:2)+" mm","middle",9.5,"signal",true,false,null,true));
    o.push(S.T(X(-xr)+4,Y(c.h/2)+4,"h = "+_w11_f(c.h,2)+" mm","start",9.5,"gold",true,false,null,true));
    if(c.g)o.push(S.T(X(c.w/2+c.s/2),Y(c.h)+14,"s","middle",9.5,"ink",true,false,null,true));
    /* (b) 数値（右、狭い画面では下） */
    var bx=nar?20:458,by=nar?y0+40:40,lines=[
      ["数値の計算",null,"ink"],
      ["Z_0 = "+_w11_f(r.Z0,1)+" Ω","Z",Math.abs(r.Z0-50)<=1?"green":"signal"],
      ["ε_{eff} = "+_w11_f(r.ee,2),"e","signal"],
      ["線の上の波長 "+_w11_f(lg,1)+" mm",null,"muted"],
      ["1/10 波長 "+_w11_f(lg/10,1)+" mm",null,"muted"],
      ["近似式（"+(c.g?"厚さ 0 の等角写像":"IPC-2141 の形")+"）",null,"ink"],
      ["Z_0 = "+_w11_f(ap[0],1)+" Ω（差 "+(ap[0]-r.Z0>=0?"+":"")+_w11_f(ap[0]-r.Z0,1)+" Ω）",null,"gold"],
      ["ε_{eff} = "+_w11_f(ap[1],2),null,"gold"]];
    var gap=nar?17:22;
    lines.forEach(function(L,k){var y=by+k*gap+(k>=5?8:0);o.push(S.TX(bx,y,L[0],"start",k===0||k===5?10.5:(L[1]?12:10),L[2],k<3||k===5||k===6));});
    var H=nar?by+lines.length*gap+18:Math.max(y0+28,by+lines.length*gap+20);
    box.set(S.svg(Wd,H,o));
    var ad=27.3*c.e*(r.ee-1)*0.02/(Math.sqrt(r.ee)*(c.e-1)*(_W11_C/_W11_F1));   /* dB/m */
    ro.innerHTML="特性インピーダンス（数値の計算） <b>"+_w11_f(r.Z0,1)+" Ω</b>"+(Math.abs(r.Z0-50)<=0.5?' <span class="ok">50 Ω</span>':(r.Z0>50?"（50 Ω より高い: 幅を広げるか、h を薄く）":"（50 Ω より低い: 幅を狭めるか、h を厚く）"))+
      "、実効比誘電率 <b>"+_w11_f(r.ee,2)+"</b>、L1 の線の上の波長 <b>"+_w11_f(lg,1)+" mm</b><br>"+
      "近似式: "+_w11_f(ap[0],1)+" Ω（数値の計算との差 "+_w11_f(ap[0]-r.Z0,1)+" Ω）。誘電体の損失（誘電正接 0.02）: <b>"+_w11_f(ad/100,3)+" dB/cm</b>";
  }
  draw();
};

/* ---- 5 節の後: 雑音の源を動かして、RF の線との距離・平行な長さ・結合の目安（例のモデル）を見る ---- */
/* 例のモデル: 雑音の源の線の小片 ds と RF の線の小片 dl の結合を cosθ・ds・dl・(h²/2)/(h² + r²)^{3/2} とし、全部を足す。
   無限に長い平行な 2 本では、平行な 1 mm あたり 1/{1 + (d/h)²} になる（本文 5 節の目安と同じ形）。h は 1 層目と 2 層目の間 */
var _W11_RF=[[6,6],[6,20],[44,20]];
function _w11_segpts(a,b,step){var L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/step)),o=[];for(var i=0;i<n;i++){var t=(i+0.5)/n;o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,(b[0]-a[0])/L,(b[1]-a[1])/L,L/n]);}return o;}
function _w11_couple(src,h){var a=[src.x-src.L/2*Math.cos(src.a),src.y-src.L/2*Math.sin(src.a)],b=[src.x+src.L/2*Math.cos(src.a),src.y+src.L/2*Math.sin(src.a)];
  var P=_w11_segpts(a,b,0.25),Q=[],i,j,sum=0,h2=h*h;for(i=0;i<_W11_RF.length-1;i++)Q=Q.concat(_w11_segpts(_W11_RF[i],_W11_RF[i+1],0.25));
  for(i=0;i<P.length;i++)for(j=0;j<Q.length;j++){var dx=P[i][0]-Q[j][0],dy=P[i][1]-Q[j][1],r2=dx*dx+dy*dy,cs=P[i][2]*Q[j][2]+P[i][3]*Q[j][3];
    sum+=cs*P[i][4]*Q[j][4]*(h2/2)/Math.pow(h2+r2,1.5);}
  return {c:Math.abs(sum),a:a,b:b};}
function _w11_dseg(p,a,b){var dx=b[0]-a[0],dy=b[1]-a[1],t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy);t=Math.max(0,Math.min(1,t));var q=[a[0]+t*dx,a[1]+t*dy];return [Math.hypot(p[0]-q[0],p[1]-q[1]),q];}
/* 雑音の源の線と RF の線の最短距離と、その 2 点 */
function _w11_near(a,b){var best=[1e9,null,null],i,k;
  for(i=0;i<_W11_RF.length-1;i++){var A=_W11_RF[i],B=_W11_RF[i+1];
    for(k=0;k<=40;k++){var p=[a[0]+(b[0]-a[0])*k/40,a[1]+(b[1]-a[1])*k/40],d=_w11_dseg(p,A,B);if(d[0]<best[0])best=[d[0],p,d[1]];}
    [A,B].forEach(function(q){var d2=_w11_dseg(q,a,b);if(d2[0]<best[0])best=[d2[0],d2[1],q];});}
  return best;}
/* 平行な長さ: RF の線の各区間と平行（向きの差 10° 以内）で、距離 10 mm 以内の部分の、射影が重なる長さ */
function _w11_par(a,b){var L=0,i,ux=b[0]-a[0],uy=b[1]-a[1],ul=Math.hypot(ux,uy);ux/=ul;uy/=ul;
  for(i=0;i<_W11_RF.length-1;i++){var A=_W11_RF[i],B=_W11_RF[i+1],vx=B[0]-A[0],vy=B[1]-A[1],vl=Math.hypot(vx,vy);vx/=vl;vy/=vl;
    if(Math.abs(ux*vx+uy*vy)<Math.cos(10*Math.PI/180))continue;
    var pa=(a[0]-A[0])*vx+(a[1]-A[1])*vy,pb=(b[0]-A[0])*vx+(b[1]-A[1])*vy,lo=Math.max(0,Math.min(pa,pb)),hi=Math.min(vl,Math.max(pa,pb));
    var dist=Math.abs(((a[0]+b[0])/2-A[0])*(-vy)+((a[1]+b[1])/2-A[1])*vx);
    if(hi>lo&&dist<=10)L+=hi-lo;}
  return L;}
REG.w11_layout=function(el,U){
  var S=U.S;
  U.head(el,"LAYOUT","雑音の源を動かす — RF の線との距離・平行な長さと、結合の目安（例のモデル）");
  var SRC=[{n:"スイッチング電源",c:"alias",L:5},{n:"クロックの線",c:"purple",L:12},{n:"USB の線",c:"gold",L:30}];
  var GOOD=[[84,48,0],[78,12,0],[70,54,0]],BAD=[[18,12,0],[26,24.5,0],[26,22.5,0]];
  function place(P){SRC.forEach(function(s,i){s.x=P[i][0];s.y=P[i][1];s.a=P[i][2];});}
  place(GOOD);
  var r1=U.ctrls(el);
  var sel=U.select(r1,"動かすもの",SRC.map(function(s){return s.n;}),0,function(){sx.set(SRC[sel.get()].x);sy.set(SRC[sel.get()].y);draw();});
  var sx=U.slider(r1,"横の位置",{min:0,max:100,step:0.5,value:SRC[0].x,fmt:function(v){return _w11_f(v,1)+" mm";},onInput:function(v){SRC[sel.get()].x=v;draw();}});
  var sy=U.slider(r1,"縦の位置",{min:0,max:60,step:0.5,value:SRC[0].y,fmt:function(v){return _w11_f(v,1)+" mm";},onInput:function(v){SRC[sel.get()].y=v;draw();}});
  var br=U.btnrow(el);
  U.button(br,"向きを変える（縦・横）",function(){var s=SRC[sel.get()];s.a=s.a?0:Math.PI/2;draw();});
  U.button(br,"本文の例（区分けした配置）",function(){place(GOOD);sx.set(SRC[sel.get()].x);sy.set(SRC[sel.get()].y);draw();});
  U.button(br,"悪い例（RF の線のそば）",function(){place(BAD);sx.set(SRC[sel.get()].x);sy.set(SRC[sel.get()].y);draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"基板は 100 × 60 mm、RF の区画は左上の 50 × 32 mm（どれも例）。雑音の源をドラッグして動かせる。結合の目安は、平行に走る 1 mm を距離 0 で重ねたときを 0 dB とした例のモデル（距離 d で 1/{1 + (d/h)²}、h = 0.2 mm。平行な長さに比例し、直角の向きでは結合しない）。グラウンドの面を挟んだ別の層の線や、源ごとの雑音の強さは入れていない。");
  var geo={sc:5,ox:10,oy:30};
  function draw(){
    var nar=_w11_nar(box),Wd=nar?400:700,sc=nar?3.75:5.2,ox=nar?12:10,oy=30,o=[];geo={sc:sc,ox:ox,oy:oy};
    function X(v){return ox+v*sc;}function Y(v){return oy+v*sc;}
    o.push(S.T(ox,18,"上から見た基板（例: 100 × 60 mm）","start",10.5,"ink",true));
    o.push(S.RECT(X(0),Y(0),100*sc,60*sc,4,"var(--muted-soft)","muted",1.2));
    o.push(S.RECT(X(1),Y(1),49*sc,31*sc,4,U.soft("signal"),"signal",1.2,"5 3"));
    o.push(S.T(X(48),Y(30),"RF の区画","end",9.5,"signal",true,false,null,true));
    /* RF の部品と線 */
    o.push(S.PL(_W11_RF.map(function(p){return [X(p[0]),Y(p[1])];}),"signal",2.6));
    o.push(S.RECT(X(4.4),Y(3.8),3.2*sc,1.6*sc,1,U.soft("alias"),"alias",1.1));o.push(S.T(X(9),Y(5.6),"アンテナ","start",9,"alias",true,false,null,true));
    [[16,"LNA",2.2],[28,"SAW",1.6]].forEach(function(q){o.push(S.RECT(X(q[0])-q[2]*sc/2,Y(20)-q[2]*sc/2,q[2]*sc,q[2]*sc,1,"panel","ink",1.1));o.push(S.T(X(q[0]),Y(20)+q[2]*sc/2+11,q[1],"middle",9,"ink",true,false,null,true));});
    o.push(S.RECT(X(44),Y(12),16*sc,16*sc,3,"panel","ink",1.3));o.push(S.T(X(52),Y(20)+4,"モジュール","middle",9,"ink",true));
    /* 雑音の源 */
    var res=[];
    SRC.forEach(function(s,i){var r=_w11_couple(s,_W11_H),nr=_w11_near(r.a,r.b),par=_w11_par(r.a,r.b),db=20*Math.log10(Math.max(r.c,1e-9));
      var inRF=[r.a,r.b].some(function(p){return p[0]>=1&&p[0]<=50&&p[1]>=1&&p[1]<=32;});
      res.push({s:s,db:db,d:nr[0],par:par,inRF:inRF});
      o.push(S.L(X(nr[1][0]),Y(nr[1][1]),X(nr[2][0]),Y(nr[2][1]),s.c,1,"3 3"));
      o.push(S.L(X(r.a[0]),Y(r.a[1]),X(r.b[0]),Y(r.b[1]),s.c,4.2));
      if(i===sel.get())o.push(S.CIRC(X(s.x),Y(s.y),Math.max(9,s.L*sc/2+4),s.c,1.2,null,"2 3"));
      var lx=X(s.x),ly=Y(s.y)+(s.a?0:-9);if(s.a)lx+=8;
      o.push(S.T(lx,ly,s.n,s.a?"start":"middle",9,s.c,true,false,null,true));
      o.push(S.T((X(nr[1][0])+X(nr[2][0]))/2+4,(Y(nr[1][1])+Y(nr[2][1]))/2+4,_w11_f(nr[0],1)+" mm","start",8.5,s.c,false,false,null,true));});
    /* 結合の目安の棒（右、狭い画面では下） */
    var bx=nar?60:560,by=nar?Y(60)+44:56,bw2=nar?300:120,bh=nar?20:26;
    o.push(S.T(nar?ox:bx-10,by-18,"結合の目安 [dB]（例のモデル）","start",10,"ink",true));
    var P=U.plot(bx,by,bw2,res.length*(bh+12),[-100,0],[0,1]);
    [-100,-75,-50,-25,0].forEach(function(v){o.push(S.L(P.X(v),by-4,P.X(v),by+res.length*(bh+12),"grid",1));o.push(S.T(P.X(v),by+res.length*(bh+12)+12,String(v).replace("-","−"),"middle",9,"muted"));});
    res.forEach(function(q,k){var yy=by+k*(bh+12),v=Math.max(-100,Math.min(0,q.db));
      o.push(S.RECT(P.X(-100),yy,Math.max(P.X(v)-P.X(-100),1),bh,3,U.soft(q.s.c),q.s.c,1.1));
      o.push(S.T(P.X(-100)+4,yy+bh/2+4,_w11_f(q.db,0)+" dB","start",9.5,q.s.c,true,false,null,true));});
    var H=nar?by+res.length*(bh+12)+24:Math.max(Y(60)+12,by+res.length*(bh+12)+24);
    box.set(S.svg(Wd,H,o));
    var rows=res.map(function(q){return [q.s.n,_w11_f(q.d,1)+" mm",_w11_f(q.par,1)+" mm","<b>"+_w11_f(q.db,0)+" dB</b>",q.inRF?'<span class="warn">RF の区画の中</span>':(q.d<0.6?'<span class="warn">RF の線に近すぎる</span>':'<span class="ok">区画の外</span>')];});
    ro.innerHTML=U.tbl(["雑音の源","RF の線までの距離","平行な長さ","結合の目安","区画"],rows,["left","right","right","right","left"])+
      "結合の目安が 20 dB 下がると、RF の線に入る雑音の電圧は 1/10 になる（電力は 1/100）。";
  }
  /* ドラッグ（近い源をつかむ） */
  var dragI=-1;
  U.ctl.drag(box,function(type,px,py){var g=geo,mx=(px-g.ox)/g.sc,my=(py-g.oy)/g.sc;
    if(type==="down"){var best=-1,bd=6;SRC.forEach(function(s,i){var a=[s.x-s.L/2*Math.cos(s.a),s.y-s.L/2*Math.sin(s.a)],b=[s.x+s.L/2*Math.cos(s.a),s.y+s.L/2*Math.sin(s.a)],d=_w11_dseg([mx,my],a,b)[0];if(d<bd){bd=d;best=i;}});
      if(best<0)return false;dragI=best;sel.set(best);return true;}
    if(type==="move"&&dragI>=0){var s=SRC[dragI];s.x=Math.max(0,Math.min(100,Math.round(mx*2)/2));s.y=Math.max(0,Math.min(60,Math.round(my*2)/2));sx.set(s.x);sy.set(s.y);draw();}
    if(type==="up")dragI=-1;});
  draw();
};

/* ===== 12 章 NMEA を読む — 文の形式とチェックサム ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w12_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w12_hex2(v){var s=(v&255).toString(16).toUpperCase();return s.length<2?"0"+s:s;}
function _w12_b8(v){var s=(v&255).toString(2);while(s.length<8)s="0"+s;return s.slice(0,4)+" "+s.slice(4);}
function _w12_cks(body){var x=0;for(var i=0;i<body.length;i++)x^=body.charCodeAt(i)&255;return x;}
function _w12_sent(body){return "$"+body+"*"+_w12_hex2(_w12_cks(body));}
function _w12_pad(v,n){var s=String(v);while(s.length<n)s="0"+s;return s;}
function _w12_g(v){return String(v).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
/* 等幅の文字を 1 文字ずつ位置を決めて描く（フォントの幅の違いで欄の位置がずれないように）。segs = [[文字, 色], …] */
function _w12_mono(U,x,y,segs,sz,cw,b){cw=cw||0.6*sz;var h='<text y="'+y.toFixed(2)+'" font-size="'+sz+'" font-family="var(--mono)" font-weight="'+(b?700:400)+'">',k=0;
  segs.forEach(function(sg){var t=sg[0];if(!t)return;var xs=[];for(var i=0;i<t.length;i++)xs.push((x+(k+i)*cw).toFixed(2));
    h+='<tspan x="'+xs.join(" ")+'" fill="'+U.col(sg[1])+'">'+U.esc(t.replace(/ /g," "))+'</tspan>';k+=t.length;});
  return h+'</text>';}
/* 文をカンマの後で折り返す位置（1 行 maxc 文字まで）。返り値は各行の [始め, 終わり] */
function _w12_wrap(line,maxc){var out=[],a=0;while(line.length-a>maxc){var c=line.lastIndexOf(",",a+maxc-1);var b=c>a?c+1:a+maxc;out.push([a,b]);a=b;}out.push([a,line.length]);return out;}
/* 1 行に、等幅の部分（m = true。1 文字ずつ位置を決める）と、ふつうの文字の部分を左から並べる。segs = [[文字, 色, 等幅か, 太字か], …] */
function _w12_mix(U,x,y,segs,sz){var o=[],cw=0.6*sz;segs.forEach(function(sg){if(!sg[0])return;
    if(sg[2]){o.push(_w12_mono(U,x,y,[[sg[0],sg[1]]],sz,cw,sg[3]));x+=sg[0].length*cw;}
    else{o.push(U.S.T(x,y,sg[0],"start",sz,sg[1],sg[3]));x+=U.tw(sg[0],sz);}});return o.join("");}
/* 3 章 3 節の C/N0 のモデル（例のアンテナ・290 K の熱雑音だけ）。figures の _f12_cn0 と同じ */
var _W12_LAM=299792458/1575.42e6;
function _w12_rng(el){var th=el*Math.PI/180;return Math.sqrt(26560e3*26560e3-Math.pow(6371e3*Math.cos(th),2))-6371e3*Math.sin(th);}
function _w12_lfs(r){return 20*Math.log10(4*Math.PI*r/_W12_LAM);}
var _W12_EIRP=-128.5-30+_w12_lfs(_w12_rng(5))+0.5,_W12_N0=10*Math.log10(1.380649e-23*290)+30;
function _w12_cn0(el){return _W12_EIRP+30-_w12_lfs(_w12_rng(el))-0.5+(3-8*Math.pow((90-el)/85,2))-_W12_N0;}
/* 例の文（図と同じ。6 章・7 章の東京の 8 つの GPS の衛星、時刻と日付は例の値） */
var _W12_GGA="GPGGA,092750.00,3540.86000,N,13946.02000,E,1,08,0.95,3.3,M,36.7,M,,";
var _W12_RMC="GPRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A";
var _W12_GSA="GPGSA,A,3,02,03,05,06,09,13,16,22,,,,,1.61,0.95,1.30";
var _W12_GSV1="GPGSV,2,1,08,02,41,316,47,03,26,125,45,05,09,269,41,06,52,045,48";
var _W12_GSV2="GPGSV,2,2,08,09,75,187,50,13,21,068,44,16,04,171,40,22,46,235,48";
var _W12_VTG="GPVTG,,T,,M,0.012,N,0.022,K,A";
var _W12_GLL="GPGLL,3540.86000,N,13946.02000,E,092750.00,A,A";
/* C の nmea_feed と同じ状態機械。st: 0 待つ・1 中身・2 上の桁・3 下の桁・4 終わり */
var _W12_STN=["待つ","中身","上の桁","下の桁","終わり"],_W12_STC=["muted","signal","purple","purple","gold"],_W12_STE=["ST_WAIT","ST_BODY","ST_CK1","ST_CK2","ST_END"];
function _w12_hexv(c){return /^[0-9A-Fa-f]$/.test(c)?parseInt(c,16):-1;}
function _w12_feed(m,ch){var c=ch.charCodeAt(0),res=null,h;m.prev=m.st;
  if(ch==="$"){res=m.st===0?null:"ERR_CUT";m.st=1;m.len=0;m.sum=0;m.buf="";return res;}
  if(m.st===1){if(ch==="*")m.st=2;else if(c<0x20||c>0x7E){m.st=0;res="ERR_FORM";}else if(m.len>=76){m.st=0;res="ERR_LONG";}else{m.len++;m.sum^=c;m.buf+=ch;}}
  else if(m.st===2||m.st===3){h=_w12_hexv(ch);if(h<0){m.st=0;res="ERR_FORM";}else if(m.st===2){m.got=h<<4;m.st=3;}else{m.got|=h;m.st=4;}}
  else if(m.st===4){if(ch==="\n"){m.st=0;res=m.got===m.sum?"OK":"ERR_SUM";}else if(ch!=="\r"){m.st=0;res="ERR_FORM";}}
  return res;}
/* 度分形式 → 1e-7 度の整数（C の nmea_dm_e7 と同じ）。誤りは null */
function _w12_dm(s,hemi,maxdeg){var m=/^(\d{3,5})(?:\.(\d*))?$/.exec(s||"");if(!m)return null;var ip=+m[1],deg=Math.floor(ip/100),mi=ip%100;if(deg>maxdeg||mi>=60)return null;
  var f6=((m[2]||"")+"000000").slice(0,6),m6=mi*1000000+(+f6),v=deg*10000000+Math.floor((m6+3)/6);if(v>maxdeg*10000000)return null;
  if(hemi==="S"||hemi==="W")return -v;if(hemi!=="N"&&hemi!=="E")return null;return v;}
function _w12_e7s(v){var a=Math.abs(v),s=Math.floor(a/1e7)+"."+_w12_pad(a%1e7,7);return (v<0?"−":"")+s+"°";}

/* ---- 2 節の後: 時刻・衛星系・仰角マスクを変えて、GSV・GSA の文とスカイプロット・C/N0・DOP を一緒に見る ---- */
REG.w12_gsv=function(el,U){
  var S=U.S,G=U.gnss;
  U.head(el,"GSV ↔ SKY","GSV と GSA — 文の欄と、空の衛星の並び・C/N0・DOP");
  var r1=U.ctrls(el);
  var tm=U.slider(r1,"時刻（時刻 0 から）",{min:0,max:24,step:0.25,value:0,fmt:function(v){return v.toFixed(2)+" 時間";},onInput:function(){draw();}});
  var mk=U.slider(r1,"仰角マスク",{min:0,max:30,step:1,value:0,fmt:function(v){return v+"°";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var sy=U.select(r2,"衛星系",["GPS だけ","GPS と GLONASS"],0,function(){sel=null;draw();});
  var bl=U.checkbox(r2,"南の低い空を建物がふさぐ（例）",false,function(){draw();});
  var br=U.btnrow(el);
  var tick=U.ticker(function(){var v=tm.get()+0.25;if(v>24)v=0;tm.set(v);draw();},150);
  U.button(br,"本文の例（時刻 0・GPS・マスク 0°）",function(){tick.stop();tm.set(0);mk.set(0);sy.set(0);bl.set(false);sel=null;draw();});
  U.button(br,"再生",function(){tick.start();});
  U.button(br,"止める",function(){tick.stop();});
  U.button(br,"次の衛星を強調",function(){var L=cur.list;if(!L.length)return;var k=-1;L.forEach(function(q,i){if(q.key===sel)k=i;});sel=L[(k+1)%L.length].key;draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"スカイプロットの衛星を押すと、その衛星の 4 つの欄が文の中で強調される。白抜きの印と棒は、見えているが位置の計算に使わない衛星。");
  var CON=G.constellation(),RX=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),sel=null,cur={list:[]},hit=[];
  function compute(){var t=tm.get()*3600,two=sy.get()===1,mask=mk.get(),L=[];
    CON.forEach(function(s){if(s.sys!=="GPS"&&!(two&&s.sys==="GLONASS"))return;var q=G.elaz(RX,G.ecef(s,t));if(q[0]<=0)return;
      var n=+s.nm.slice(1),blk=bl.get()&&q[1]>=120&&q[1]<=240&&q[0]<35,cn=blk?null:Math.round(_w12_cn0(q[0]));
      L.push({sys:s.sys,id:s.sys==="GPS"?n:64+n,el:q[0],az:q[1],cn0:cn,used:cn!==null&&q[0]>=mask,key:s.nm});});
    L.sort(function(a,b){return (a.sys===b.sys?0:(a.sys==="GPS"?-1:1))||a.id-b.id;});
    /* DOP（衛星系ごとに時計のずれの未知数を 1 つ） */
    var U1=L.filter(function(q){return q.used;}),syss=[];U1.forEach(function(q){if(syss.indexOf(q.sys)<0)syss.push(q.sys);});
    var dop=null;
    if(U1.length>=3+syss.length){var Gm=U1.map(function(q){var e=q.el*Math.PI/180,a=q.az*Math.PI/180,r=[-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e)];syss.forEach(function(sn){r.push(sn===q.sys?1:0);});return r;});
      try{var M=U.ctl.mat,H=M.inv(M.mul(M.T(Gm),Gm));dop={P:Math.sqrt(H[0][0]+H[1][1]+H[2][2]),H:Math.sqrt(H[0][0]+H[1][1]),V:Math.sqrt(H[2][2])};}catch(e){dop=null;}}
    /* 文を作る */
    var lines=[];
    [["GPS","GP"],["GLONASS","GL"]].forEach(function(sp){var V=L.filter(function(q){return q.sys===sp[0];});if(!V.length)return;var nm=Math.ceil(V.length/4);
      for(var m=0;m<nm;m++){var f=[sp[1]+"GSV",String(nm),String(m+1),_w12_pad(V.length,2)],blocks=[];
        V.slice(4*m,4*m+4).forEach(function(q){var st=f.join(",").length+1;f.push(_w12_pad(q.id,2),_w12_pad(Math.round(q.el),2),_w12_pad(Math.round(q.az)%360,3),q.cn0===null?"":_w12_pad(q.cn0,2));
          blocks.push({a:st+1,b:f.join(",").length+1,q:q});});
        lines.push({kind:"GSV",body:f.join(","),blocks:blocks});}});
    var fix=dop?"3":"1",fmt2=function(v){return dop?v.toFixed(2):"99.99";};
    var tails=dop?[fmt2(dop.P),fmt2(dop.H),fmt2(dop.V)]:["99.99","99.99","99.99"];
    (two?[["GPS","GNGSA"],["GLONASS","GNGSA"]]:[["GPS","GPGSA"]]).forEach(function(sp){var ids=U1.filter(function(q){return q.sys===sp[0];}).slice(0,12).map(function(q){return _w12_pad(q.id,2);});
      while(ids.length<12)ids.push("");lines.push({kind:"GSA",body:[sp[1],"A",fix].concat(ids).concat(tails).join(","),blocks:[]});});
    cur={list:L,used:U1,dop:dop,lines:lines};return cur;}
  function draw(){var c=compute(),nar=_w12_nar(box),Wd=nar?400:700,o=[],sz=nar?11:9.5,cw=0.6*sz,x0=nar?6:14,y=18,maxc=Math.floor((Wd-2*x0)/cw);
    o.push(S.T(x0,y,"1 回分の GSV と GSA（* の後はチェックサム）","start",nar?10:11,"ink",true));y+=18;
    c.lines.forEach(function(ln){var line=_w12_sent(ln.body);
      _w12_wrap(line,maxc).forEach(function(rw){var i0=rw[0],i1=rw[1];
        ln.blocks.forEach(function(bk){var col=bk.q.sys==="GPS"?"signal":"purple",on=bk.q.key===sel,a=Math.max(bk.a,i0),b=Math.min(bk.b,i1);if(b<=a)return;
          o.push(S.RECT(x0+(a-i0)*cw-1,y-sz*0.95,(b-a)*cw+2,sz*1.35,2,on?U.soft("alias"):U.soft(col),on?"alias":"none",on?1.4:0));});
        var ck=line.length-3,segs=[[line.slice(i0,Math.min(i1,ck)),ln.kind==="GSA"?"green":"ink"],[line.slice(Math.max(i0,ck),i1),"muted"]];
        o.push(_w12_mono(U,x0+(i0>0?2*cw:0),y,segs,sz,cw,ln.kind==="GSA"));y+=sz*1.5;});
      y+=sz*0.2;});
    /* スカイプロット */
    var R=nar?80:104,cx=nar?Wd/2:150,cy=y+R+40,mask=mk.get();hit=[];
    o.push(S.T(nar?x0:14,y+14,"空の並び（数字は衛星の番号）","start",nar?10:11,"ink",true));
    o.push(G.sky(U,cx,cy,R,[],{}));
    if(mask>0){var rr=R*(90-mask)/90;o.push('<path d="M'+(cx-R)+','+cy+'a'+R+','+R+' 0 1,0 '+(2*R)+',0a'+R+','+R+' 0 1,0 '+(-2*R)+',0M'+(cx-rr)+','+cy+'a'+rr+','+rr+' 0 1,0 '+(2*rr)+',0a'+rr+','+rr+' 0 1,0 '+(-2*rr)+',0" fill="'+U.soft("alias")+'" fill-rule="evenodd" stroke="none" opacity="0.8"/>');
      o.push(S.CIRC(cx,cy,rr,"alias",1.3,null,"5 3"));o.push(S.T(cx+rr*0.72+4,cy+rr*0.72+12,"マスク "+mask+"°","start",9.5,"alias",true,false,null,true));}
    if(bl.get()){var pts=[];for(var a=120;a<=240;a+=4)pts.push(G.skyxy(cx,cy,R,0,a));for(var a2=240;a2>=120;a2-=4)pts.push(G.skyxy(cx,cy,R,35,a2));
      o.push(S.PL(pts,"alias",1.2,"var(--alias-soft)",null,0.9));o.push(S.T(cx,cy+R*0.78,"建物","middle",10,"alias",true,false,null,true));}
    c.list.forEach(function(q){var p=G.skyxy(cx,cy,R,q.el,q.az),col=q.sys==="GPS"?"signal":"purple";hit.push([p[0],p[1],q.key]);
      if(q.key===sel)o.push(S.CIRC(p[0],p[1],9,"alias",2));
      o.push(q.used?S.D(p[0],p[1],col,4.4):S.CIRC(p[0],p[1],4,col,1.6,"var(--screen)"));
      o.push(S.T(p[0]+6,p[1]+3.5,String(q.id),"start",nar?8.5:9.5,col,true,false,null,true));});
    /* C/N0 の棒 */
    var bx=nar?40:330,bw=nar?Wd-56:Wd-350,by=nar?cy+R+44:y+34,bh=nar?150:2*R-10;
    o.push(S.TX(nar?x0:bx-30,by-14,"C/N_0（3 章 3 節の例のアンテナ。空の欄は追尾していない）","start",nar?9.5:10.5,"ink",true));
    var P=U.plot(bx,by,bw,bh,[0,Math.max(1,c.list.length)],[30,55]);
    o.push(P.axes({yl:"C/N_0 [dB-Hz]",xt:[],yt:[30,35,40,45,50,55],ylOff:nar?30:38}));
    c.list.forEach(function(q,k){var xa=P.X(k+0.15),xb=P.X(k+0.85),col=q.sys==="GPS"?"signal":"purple",on=q.key===sel;
      if(q.cn0===null){o.push(S.T((xa+xb)/2,P.Y(31.5),"空","middle",9,"alias",true));}
      else{o.push(S.RECT(xa,P.Y(q.cn0),xb-xa,P.Y(30)-P.Y(q.cn0),2,q.used?U.soft(col):"var(--screen)",on?"alias":col,on?2.2:1,q.used?null:"3 2"));
        if(xb-xa>12)o.push(S.T((xa+xb)/2,P.Y(q.cn0)-4,String(q.cn0),"middle",nar?8:9,col,true));}
      o.push(S.T((xa+xb)/2,P.Y(30)+13,String(q.id),"middle",nar?7.5:9,on?"alias":"ink",true));});
    var hgt=Math.max(cy+R+38,by+bh+30);
    o.push(S.LEGL(nar?x0:14,hgt,[["signal",null,"GPS（番号は PRN 番号）"]].concat(sy.get()===1?[["purple",null,"GLONASS（番号は 64 + 衛星の番号）"]]:[]),nar?9:10));
    box.set(S.svg(Wd,hgt+12,o));
    /* 読み出し */
    var nG=c.list.filter(function(q){return q.sys==="GPS";}).length,nR=c.list.length-nG,nb=0,ns=0;c.lines.forEach(function(l){nb+=_w12_sent(l.body).length+2;if(l.kind==="GSV")ns++;});
    var h="見えている衛星 "+c.list.length+" 機（GPS "+nG+(sy.get()===1?"・GLONASS "+nR:"")+"）→ GSV は "+ns+" 文。GSV と GSA を合わせて 1 回分 "+nb+" バイト。";
    h+="<br>使った衛星 "+c.used.length+" 機（仰角マスク "+mk.get()+"° 以上で、追尾している衛星）→ GSA: "+(c.dop?"PDOP "+c.dop.P.toFixed(2)+"・HDOP "+c.dop.H.toFixed(2)+"・VDOP "+c.dop.V.toFixed(2)+' <span class="ok">（3 次元の位置）</span>':'<span class="warn">衛星が足りず位置が出ない（測位の品質 0）</span>');
    var nb2=c.list.filter(function(q){return q.cn0===null;}).length;if(nb2)h+="<br>建物でさえぎられた "+nb2+" 機は、GSV に書かれるが C/N0 の欄が空で、GSA には入らない。";
    if(sel){var s=c.list.filter(function(q){return q.key===sel;})[0];if(s)h+="<br>強調した衛星: 番号 "+s.id+"・仰角 "+Math.round(s.el)+"°・方位角 "+(Math.round(s.az)%360)+"°・C/N0 "+(s.cn0===null?"（空）":s.cn0+" dB-Hz")+(s.used?"（位置の計算に使った）":"（使わない）");}
    ro.innerHTML=h;}
  box.el.addEventListener("click",function(e){var sv=box.el.querySelector("svg");if(!sv)return;var m=sv.getScreenCTM();if(!m)return;var p=sv.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var q=p.matrixTransform(m.inverse()),best=null,bd=14;
    hit.forEach(function(hq){var d=Math.hypot(hq[0]-q.x,hq[1]-q.y);if(d<bd){bd=d;best=hq[2];}});if(best){sel=best===sel?null:best;draw();}});
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 3 節の後: 文を選ぶか書き換えて、欄の意味とチェックサムを見る ---- */
var _W12_PRE=[
  ["GGA（本文の例）",_w12_sent(_W12_GGA),0],["RMC",_w12_sent(_W12_RMC),1],["GSA",_w12_sent(_W12_GSA),2],["GSV（1/2）",_w12_sent(_W12_GSV1),3],["GSV（2/2）",_w12_sent(_W12_GSV2),4],
  ["VTG",_w12_sent(_W12_VTG),5],["GLL",_w12_sent(_W12_GLL),6],
  ["GGA（位置が出ていない）",_w12_sent("GPGGA,092720.00,,,,,0,00,99.99,,,,,,"),7],["RMC（位置が出ていない）",_w12_sent("GPRMC,092720.00,V,,,,,,,111126,,,N"),8],
  ["3 節 (a): 1 文字が化けた",_w12_sent(_W12_GGA).replace("3540.86000","3540.85000"),0],
  ["3 節 (b): 2 文字の同じビットが反転",_w12_sent(_W12_GGA).replace("3540.86000","3541.87000"),0],
  ["3 節 (c): 2 文字が入れ替わった",_w12_sent(_W12_GGA).replace("3540.86000","3504.86000"),0],
  ["小文字のチェックサム（GSV 1/2）",_w12_sent(_W12_GSV1).replace(/\*7A$/,"*7a"),3]];
var _W12_MEAN={
  GGA:["話者 ID と文の種類","時刻（UTC）","緯度","北緯 N・南緯 S","経度","東経 E・西経 W","測位の品質","使った衛星の数","HDOP","標高","標高の単位（M = m）","ジオイド高","ジオイド高の単位","補正の年齢 [s]（16 章）","基準局の番号（16 章）"],
  RMC:["話者 ID と文の種類","時刻（UTC）","状態（A 有効・V 警告）","緯度","北緯 N・南緯 S","経度","東経 E・西経 W","速さ [ノット]","進む向き [°]（真北から時計回り）","日付（日・月・年）","磁気の偏角 [°]","偏角の向き","モード（2.3 版から）","航法の状態（4.1 版から）"],
  GSA:["話者 ID と文の種類","2 次元・3 次元の切り替え（A 自動・M 固定）","位置の次元（1 なし・2・3）","使った衛星 1","使った衛星 2","使った衛星 3","使った衛星 4","使った衛星 5","使った衛星 6","使った衛星 7","使った衛星 8","使った衛星 9","使った衛星 10","使った衛星 11","使った衛星 12","PDOP","HDOP","VDOP","衛星系の番号（4.1 版から）"],
  VTG:["話者 ID と文の種類","進む向き（真北から）[°]","T（真北）","進む向き（磁北から）[°]","M（磁北）","速さ [ノット]","N（ノット）","速さ [km/h]","K（km/h）","モード（2.3 版から）"],
  GLL:["話者 ID と文の種類","緯度","北緯 N・南緯 S","経度","東経 E・西経 W","時刻（UTC）","状態（A 有効・V 警告）","モード（2.3 版から）"]};
function _w12_mean(type,k,n){if(type==="GSV"){if(k===0)return "話者 ID と文の種類";if(k<=3)return ["","全部の文の数","何番目の文か","見えている衛星の数"][k];
    var j=(k-4)%4,s=Math.floor((k-4)/4)+1;if((n-4)%4===1&&k===n-1)return "信号の番号（4.1 版から）";return ["衛星 "+s+" の番号","衛星 "+s+" の仰角 [°]","衛星 "+s+" の方位角 [°]","衛星 "+s+" の C/N0 [dB-Hz]"][j];}
  var t=_W12_MEAN[type];return t&&k<t.length?t[k]:"（この表に無い欄）";}
function _w12_val(type,k,f,F){if(f==="")return '<span style="color:var(--muted)">（空）</span>';
  var tm=/^(\d\d)(\d\d)(\d\d(?:\.\d+)?)$/;
  function T_(s){var m=tm.exec(s);return m?m[1]+":"+m[2]+":"+m[3]:"（形が違う）";}
  function LL(s,h,md){var v=_w12_dm(s,h,md);if(v===null)return '<span class="warn">読めない（範囲の外・形が違う）</span>';var m=/^(\d+)(\d\d)(\.\d*)?$/.exec(s);
    return (h==="N"?"北緯 ":h==="S"?"南緯 ":h==="E"?"東経 ":"西経 ")+(+m[1])+"°"+m[2]+(m[3]||"")+"′ = "+_w12_e7s(v)+"（整数 "+_w12_g(v)+"）";}
  if(type==="GGA"){if(k===1)return T_(f);if(k===2)return LL(f,F[3],90);if(k===4)return LL(f,F[5],180);
    if(k===6)return f+": "+({"0":"位置が求まっていない","1":"単独で求めた","2":"補正を使って求めた（DGNSS）","4":"RTK・整数が決まった解（17 章）","5":"RTK・整数が決まる前の解（17 章）","6":"推測した（19 章）","7":"手で入れた値","8":"シミュレーション"}[f]||"（この表に無い値）");
    if(k===9||k===11)return f+" m";}
  if(type==="RMC"){if(k===1)return T_(f);if(k===2)return f==="A"?"A: 有効":f==="V"?'<span class="warn">V: 警告（使わない）</span>':f;if(k===3)return LL(f,F[4],90);if(k===5)return LL(f,F[6],180);
    if(k===7)return f+" ノット = "+(+f*1.852).toFixed(3)+" km/h";if(k===9){var d=/^(\d\d)(\d\d)(\d\d)$/.exec(f);return d?"20"+d[3]+" 年 "+(+d[2])+" 月 "+(+d[1])+" 日（年は 20yy とした）":"（形が違う）";}
    if(k===12)return f+": "+({"A":"単独","D":"補正を使った","E":"推測","N":"無効","M":"手で入れた","S":"シミュレーション"}[f]||"（版による）");}
  if(type==="GSA"){if(k===2)return f+": "+({"1":"位置なし","2":"2 次元","3":"3 次元"}[f]||"？");if(k>=3&&k<=14)return "番号 "+(+f);}
  if(type==="GSV"&&k>=4){var j=(k-4)%4;if(j===1)return f+"°";if(j===2)return (+f)+"°";if(j===3)return f+" dB-Hz";}
  if(type==="GLL"){if(k===1)return LL(f,F[2],90);if(k===3)return LL(f,F[4],180);if(k===5)return T_(f);}
  return _w12_esc(f);}
function _w12_esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
REG.w12_decode=function(el,U){
  var S=U.S;
  U.head(el,"NMEA DECODER","文の欄の意味とチェックサム — 1 文字変えると合わなくなる");
  var r1=U.ctrls(el);
  var ps=U.select(r1,"文",_W12_PRE.map(function(p){return p[0];}),0,function(i){ti.set(_W12_PRE[i][1]);base=_W12_PRE[_W12_PRE[i][2]][1];draw();});
  var r2=U.ctrls(el);
  var ti=U.textin(r2,"文（書き換えられる）",_W12_PRE[0][1],function(){draw();},{width:"100%"});
  ti.input.style.fontFamily="var(--mono)";
  var br=U.btnrow(el),rg=U.rng(12),seed=12;
  U.button(br,"本文の例（GGA）",function(){ps.set(0);ti.set(_W12_PRE[0][1]);base=_W12_PRE[0][1];draw();});
  U.button(br,"1 文字をでたらめに変える",function(){var s=ti.get(),a=s.indexOf("$")+1,b=s.indexOf("*");if(a<1||b<=a)return;var i=a+rg.int(b-a),c;
    do{c=String.fromCharCode(0x30+rg.int(0x4B));}while(c===s[i]||"$*".indexOf(c)>=0);ti.set(s.slice(0,i)+c+s.slice(i+1));draw();});
  U.button(br,"見逃す誤りを作る（2 つの数字の同じビット）",function(){var s=ti.get(),a=s.indexOf("$")+1,b=s.indexOf("*"),ds=[];for(var i=a;i<b;i++)if(/\d/.test(s[i]))ds.push(i);if(ds.length<2)return;
    var i1=ds[rg.int(ds.length)],i2;do{i2=ds[rg.int(ds.length)];}while(i2===i1);var arr=s.split("");[i1,i2].forEach(function(i){arr[i]=String.fromCharCode(arr[i].charCodeAt(0)^1);});ti.set(arr.join(""));draw();});
  U.button(br,"チェックサムを付け直す",function(){var s=ti.get(),a=s.indexOf("$"),b=s.indexOf("*");if(a<0)return;var body=s.slice(a+1,b<0?s.length:b);ti.set(_w12_sent(body));draw();});
  U.button(br,"選んだ文に戻す",function(){ti.set(_W12_PRE[ps.get()][1]);draw();});
  var box=U.svgbox(el),ro=U.readout(el),tb=U.mk("div");el.appendChild(tb);
  var base=_W12_PRE[0][1];
  var FC=["signal","gold","green","purple","teal"];
  function draw(){var s=ti.get().replace(/[\r\n]/g,""),nar=_w12_nar(box),Wd=nar?400:700,o=[],sz=11,cw=0.6*sz,x0=nar?6:14;
    var a=s.indexOf("$"),b=s.indexOf("*",a+1),ok=a===0&&b>a;
    var body=ok?s.slice(1,b):"",ck=ok?s.slice(b+1):"",F=ok?body.split(","):[],type=F.length&&F[0].length===5?F[0].slice(2):"";
    var calc=_w12_cks(body),got=/^[0-9A-Fa-f]{2}$/.test(ck)?parseInt(ck,16):null,ts=nar?9.5:10.5;
    o.push(S.T(x0,16,"文（欄ごとに色を変えた。下の数字は欄の番号）","start",nar?10:11,"ink",true));
    var y=40,maxc=Math.floor((Wd-2*x0)/cw);
    /* 色: 欄ごと。選んだ文と違う文字は赤の地 */
    var bs=base.replace(/[\r\n]/g,""),same=bs.length===s.length,cols=[],fi=0,starts=[],pos=1;
    for(var i=0;i<s.length;i++){var ch=s[i];if(i===0||ch==="$")cols.push("signal");else if(b>0&&i>=b)cols.push("muted");else if(ch===","){cols.push("muted");fi++;}else cols.push(FC[fi%FC.length]);}
    F.forEach(function(f){starts.push([pos,pos+f.length]);pos+=f.length+1;});
    _w12_wrap(s,maxc).forEach(function(rw){var i0=rw[0],i1=rw[1],segs=[],xr=-1e9;
      for(var j=i0;j<i1;j++){if(same&&s[j]!==bs[j])o.push(S.RECT(x0+(j-i0)*cw-0.5,y-sz*0.95,cw+1,sz*1.3,1,U.soft("alias"),"alias",0.8));
        if(segs.length&&segs[segs.length-1][1]===cols[j])segs[segs.length-1][0]+=s[j];else segs.push([s[j],cols[j]]);}
      o.push(_w12_mono(U,x0,y,segs,sz,cw,true));
      starts.forEach(function(se,k){var cc=(se[0]+se[1])/2;if(cc<i0||cc>=i1)return;var xc=x0+(cc-i0)*cw,lw=U.tw(String(k),9);if(xc-lw/2<xr+2)return;o.push(S.T(xc,y+sz+3,String(k),"middle",9,"muted"));xr=xc+lw/2;});
      y+=sz*2.4;});
    /* チェックサム */
    y+=4;
    if(!ok){o.push(S.T(x0,y,"$ で始まり、* とチェックサムが付いた形になっていない","start",nar?10:11,"alias",true));box.set(S.svg(Wd,y+12,o));ro.innerHTML='<span class="warn">形が違う（4 節の状態機械では NMEA_ERR_FORM として捨てる）</span>';tb.innerHTML="";return;}
    var match=got!==null&&got===calc;
    o.push(S.T(x0,y,"中身（$ と * の間 "+body.length+" 文字）の排他的論理和","start",ts,"ink",true));y+=nar?17:20;
    o.push(_w12_mix(U,x0+(nar?0:10),y,[["= 0x"+_w12_hex2(calc)+" ("+_w12_b8(calc)+")","purple",true,true],["　付いてきた値 ","ink",false,false],[got===null?"（16 進 2 桁でない）":ck,"ink",got!==null,true]],nar?10:11));y+=nar?18:22;
    o.push(S.T(x0+(nar?0:10),y,match?"合う → 文を受け取る（NMEA_OK）":"合わない → 文を捨てる（NMEA_ERR_SUM）","start",nar?10:11.5,match?"green":"alias",true));
    if(got!==null&&ck!==ck.toUpperCase()){y+=nar?16:18;o.push(S.T(x0+(nar?0:10),y,"（小文字の 16 進。受ける側は大文字と同じに扱う）","start",nar?9:10,"muted"));}
    /* 選んだ文との違い */
    y+=nar?22:26;var diffs=[];
    if(same){for(var k=1;k<b;k++)if(s[k]!==bs[k])diffs.push(k);}
    var ex=0,ms=nar?9.5:10.5;
    if(diffs.length){o.push(S.T(x0,y,"選んだ文と比べて化けた文字と、化けた分 e（反転したビット）","start",ts,"ink",true));y+=nar?16:18;
      diffs.slice(0,6).forEach(function(k){var e=(s.charCodeAt(k)^bs.charCodeAt(k))&255;ex^=e;
        o.push(_w12_mix(U,x0+(nar?0:10),y,[[k+" 文字目 ","ink",false],["'"+bs[k]+"'→'"+s[k]+"'  e = ","ink",true],[_w12_b8(e),"alias",true]],ms));y+=nar?15:17;});
      if(diffs.length>6){o.push(S.T(x0+10,y,"…（ほか "+(diffs.length-6)+" 文字）","start",9.5,"muted"));y+=14;for(var k2=6;k2<diffs.length;k2++)ex^=(s.charCodeAt(diffs[k2])^bs.charCodeAt(diffs[k2]))&255;}
      o.push(_w12_mix(U,x0+(nar?0:10),y,[["e を全部 ⊕ = ","ink",false,true],[_w12_b8(ex),ex?"green":"alias",true,true]],ms));
      y+=nar?16:0;
      o.push(S.T(x0+(nar?0:250),y,ex?"0 でない → チェックサムが変わり、気づく":"0 → チェックサムが変わらず、見逃す","start",nar?9.5:10.5,ex?"green":"alias",true));y+=nar?16:20;}
    box.set(S.svg(Wd,y+8,o));
    var hh=match?'<span class="ok">チェックサムが合う</span>':'<span class="warn">チェックサムが合わない</span>';
    if(diffs.length)hh+="（選んだ文から "+diffs.length+" 文字が変わっている"+(match?"のに合う: 化けた分の排他的論理和が 0 の誤りは見逃す":"")+"）";
    hh+="。欄の数 "+F.length+"、文の種類 "+(type||"？")+"、長さ $ から LF まで "+(s.length+2)+" 文字"+(s.length+2>82?' <span class="warn">（82 文字を超える）</span>':"");
    ro.innerHTML=hh;
    if(nar){var rowsN=F.map(function(f,k){return ["["+k+"] "+'<code>'+(f===""?"":U.esc(f))+'</code>',(type?_w12_mean(type,k,F.length):"")+"<br>"+_w12_val(type,k,f,F)];});
      tb.innerHTML=U.tbl(["欄","意味と、読み取った値"],rowsN,["left","wrap"]);}
    else{var rowsT=F.map(function(f,k){return ["["+k+"]",'<code>'+(f===""?"":U.esc(f))+'</code>',type?_w12_mean(type,k,F.length):"",_w12_val(type,k,f,F)];});
      tb.innerHTML=U.tbl(["番号","欄","意味","読み取った値"],rowsT,["right","left","wrap","wrap"]);}}
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 4 節の後: 状態機械に 1 文字ずつ入れる ---- */
var _W12_VTGS=_w12_sent(_W12_VTG)+"\r\n";
var _W12_CASES=[
  ["正しい文（VTG）",_W12_VTGS],
  ["1 文字が化けた（0.012 → 0.013）",_W12_VTGS.replace("0.012","0.013")],
  ["文の途中から受け始めた",_W12_VTGS.slice(-13)+_W12_VTGS],
  ["文の途中で次の $ が来た（切れた文）",_W12_VTGS.slice(0,17)+_W12_VTGS],
  ["* が + に化けた",_W12_VTGS.replace("*","+")],
  ["取りこぼしで 2 つの文がつながった",_w12_sent(_W12_GGA).slice(0,-4)+_w12_sent(_W12_RMC).slice(1,30)],
  ["小文字のチェックサム（GSV 1/2）",_w12_sent(_W12_GSV1).replace(/\*7A$/,"*7a")+"\r\n"],
  ["続けて 2 つの文（GGA と RMC）",_w12_sent(_W12_GGA)+"\r\n"+_w12_sent(_W12_RMC)+"\r\n"]];
var _W12_RN={OK:"NMEA_OK",ERR_SUM:"NMEA_ERR_SUM",ERR_CUT:"NMEA_ERR_CUT",ERR_FORM:"NMEA_ERR_FORM",ERR_LONG:"NMEA_ERR_LONG"};
REG.w12_fsm=function(el,U){
  var S=U.S;
  U.head(el,"NMEA FSM","1 文字ずつ読む状態機械 — 文を切り出し、誤りに気づく");
  var r1=U.ctrls(el);
  var cs=U.select(r1,"入れる文字の列",_W12_CASES.map(function(c){return c[0];}),0,function(){reset();draw();});
  var sp=U.slider(r1,"速さ",{values:[2,4,8,15,30,60],value:8,fmt:function(v){return v+" 文字/秒";},onInput:function(){if(tick.running()){tick.stop();mkTick();tick.start();}}});
  var br=U.btnrow(el),tick=null;
  function mkTick(){tick=U.ticker(function(){if(!step())tick.stop();draw();},Math.round(1000/sp.get()));}
  mkTick();
  U.button(br,"本文の例（正しい文）",function(){tick.stop();cs.set(0);reset();draw();});
  U.button(br,"1 文字進める",function(){tick.stop();step();draw();});
  U.button(br,"再生",function(){if(pos>=inp().length)reset();tick.start();});
  U.button(br,"止める",function(){tick.stop();});
  U.button(br,"最初から",function(){tick.stop();reset();draw();});
  U.button(br,"最後まで",function(){tick.stop();while(step()){}draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  var m,pos,hist,log,edge;
  function inp(){return _W12_CASES[cs.get()][1];}
  function reset(){m={st:0,len:0,sum:0,got:0,buf:"",prev:0};pos=0;hist=[];log=[];edge=null;}
  function step(){var s=inp();if(pos>=s.length)return false;var ch=s[pos],p=m.st,r=_w12_feed(m,ch);
    if(ch==="$")edge=p===0?"w-b":"cut";else if(r==="OK"||r==="ERR_SUM")edge="done";else if(r)edge="err";
    else edge=p===0?"w-w":(p===1&&m.st===1?"b-b":(p===1?"b-c1":(p===2?"c1-c2":(p===3?"c2-e":"e-e"))));
    hist.push({st:m.st,r:r});if(r)log.push([pos,r]);pos++;return true;}
  reset();
  function draw(){var nar=_w12_nar(box),Wd=nar?400:700,o=[],s=inp();
    /* 状態の図 */
    var bw=nar?66:96,gap=nar?10:38,x0=nar?8:20,y=nar?96:104,h=nar?36:42,X=[];for(var k=0;k<5;k++)X.push(x0+k*(bw+gap));
    var eg=function(id){return edge===id;};
    var ec=function(id,c){return eg(id)?"alias":c;};
    for(var k2=0;k2<5;k2++){var on=m.st===k2,c=_W12_STC[k2];
      o.push(S.RECT(X[k2],y-h/2,bw,h,h/2.6,on?U.soft(c):"var(--panel)",c,on?3:1.3));
      o.push(S.T(X[k2]+bw/2,y-(nar?0:2),_W12_STN[k2],"middle",nar?10:11.5,c,true));
      if(!nar)o.push(S.T(X[k2]+bw/2,y+12,_W12_STE[k2],"middle",8.5,"muted",false,true));}
    var lab=["$","*","16 進","16 進"],ids=["w-b","b-c1","c1-c2","c2-e"];
    for(var k3=0;k3<4;k3++){var c3=eg(ids[k3])?"alias":"ink";o.push(S.ARR(X[k3]+bw,y,X[k3+1],y,c3,eg(ids[k3])?2.6:1.4,6));
      if(!nar||k3<2)o.push(S.T((X[k3]+bw+X[k3+1])/2,y-6,lab[k3],"middle",nar?9:10,c3,true,false,null,true));}
    /* $ はどの状態からでも中身へ */
    var ytop=y-h/2,yc_=ytop-(nar?44:50),cC=eg("cut")?"alias":"var(--signal-soft)",wC=eg("cut")?2.4:1.2;
    [X[2]+bw/2,X[3]+bw/2,X[4]+18].forEach(function(xd){o.push(S.L(xd,ytop,xd,yc_,cC,wC,"5 3"));});
    o.push(S.L(X[4]+18,yc_,X[1]+bw-14,yc_,cC,wC,"5 3"));o.push(S.ARR(X[1]+bw-14,yc_,X[1]+bw-14,ytop-1,cC,wC,6,"5 3"));
    o.push(S.T((X[2]+X[4])/2+bw/2,yc_-6,nar?"$: どこからでも中身へ（ERR_CUT）":"$（どの状態でも）: 途中の文を捨てて中身へ（NMEA_ERR_CUT）","middle",nar?8.5:9.5,eg("cut")?"alias":"signal",true,false,null,true));
    /* 自分への遷移 */
    [[0,"w-w","$ 以外"],[1,"b-b","ためて XOR"],[4,"e-e","CR"]].forEach(function(q){var xc=X[q[0]]+bw/2-(q[0]===1?14:0)+(q[0]===4?14:0),yt=y-h/2,c4=eg(q[1])?"alias":_W12_STC[q[0]];
      o.push(S.PATH("M"+(xc-9)+","+yt+" C"+(xc-20)+","+(yt-30)+" "+(xc+20)+","+(yt-30)+" "+(xc+9)+","+yt,c4,eg(q[1])?2.4:1.3));
      o.push(S.T(xc,yt-26,q[2],"middle",nar?8.5:9.5,c4,eg(q[1]),false,null,true));});
    /* 誤りと、文がそろったとき */
    var yb=y+h/2+(nar?16:20);
    var cE=eg("err")?"alias":"var(--alias-soft)";
    [1,2,3,4].forEach(function(k){o.push(S.L(X[k]+bw/2-(k===4?14:0),y+h/2,X[k]+bw/2-(k===4?14:0),yb,cE,eg("err")?2.4:1.2));});
    o.push(S.L(X[4]+bw/2-14,yb,X[0]+bw/2+12,yb,cE,eg("err")?2.4:1.2));o.push(S.ARR(X[0]+bw/2+12,yb,X[0]+bw/2+12,y+h/2+2,cE,eg("err")?2.4:1.2,6));
    o.push(S.T((X[1]+X[3])/2+bw/2,yb+(nar?11:13),"誤り: 次の $ まで読み捨てる（NMEA_ERR_FORM・NMEA_ERR_LONG）","middle",nar?8:9.5,eg("err")?"alias":"muted",true));
    var yo=yb+(nar?22:28),cD=eg("done")?(hist.length&&hist[hist.length-1].r==="OK"?"green":"alias"):"var(--green-soft)";
    o.push(S.L(X[4]+bw/2+14,y+h/2,X[4]+bw/2+14,yo,cD,eg("done")?2.6:1.2));o.push(S.L(X[4]+bw/2+14,yo,X[0]+bw/2-12,yo,cD,eg("done")?2.6:1.2));o.push(S.ARR(X[0]+bw/2-12,yo,X[0]+bw/2-12,y+h/2+2,cD,eg("done")?2.6:1.2,6));
    o.push(S.T((X[1]+X[3])/2+bw/2,yo+(nar?11:13),"LF: XOR と比べる（合えば NMEA_OK、違えば NMEA_ERR_SUM）","middle",nar?8.5:9.5,eg("done")?cD:"muted",true));
    /* 入れた文字の列 */
    var cw=nar?9:8.6,sz=nar?12:12,per=Math.floor((Wd-16)/cw),ys=yo+(nar?36:44),xs0=8;
    o.push(S.T(xs0,ys-14,"入れた文字の列（下の帯は、その文字を入れた後の状態。▲ は結果）","start",nar?9.5:10.5,"ink",true));
    var nrow=Math.ceil(s.length/per);
    for(var r=0;r<nrow;r++){var yr=ys+r*(nar?40:44)+10;
      for(var i=r*per;i<Math.min(s.length,(r+1)*per);i++){var xx=xs0+(i-r*per)*cw,ch=s[i],done=i<pos;
        if(i===pos)o.push(S.RECT(xx-0.5,yr-sz,cw+1,sz+16,2,"none","alias",1.6));
        if(ch==="\r"||ch==="\n")o.push(S.RECT(xx+0.5,yr-sz+2,cw-1,sz,1,"var(--muted-soft)","muted",0.6));
        else o.push(_w12_mono(U,xx+cw*0.2,yr,[[ch,done?"ink":"faint"]],sz,cw,done));
        if(done){var hs=hist[i];o.push(S.RECT(xx+0.3,yr+3,cw-0.6,7,0,U.soft(_W12_STC[hs.st]),_W12_STC[hs.st],0.6));
          if(hs.r){var cc=hs.r==="OK"?"green":"alias";o.push(S.PL([[xx+cw/2,yr+12],[xx+cw/2-4,yr+19],[xx+cw/2+4,yr+19]],cc,1,cc));}}}}
    var hgt=ys+nrow*(nar?40:44)+8;
    /* 変数 */
    var vy=hgt+6,bufs=m.buf.length>(nar?60:100)?"…"+m.buf.slice(-(nar?59:99)):m.buf;
    o.push(_w12_mix(U,8,vy,[["状態 ","muted",false],[_W12_STE[m.st],_W12_STC[m.st],true,true],["（"+_W12_STN[m.st]+"）",_W12_STC[m.st],false,true],["　len ","muted",true],[String(m.len),"ink",true,true],["  sum ","muted",true],["0x"+_w12_hex2(m.sum)+" ("+_w12_b8(m.sum)+")","purple",true,true]],nar?9.5:10.5));
    o.push(_w12_mix(U,8,vy+(nar?16:19),[["buf ","muted",true],[bufs||"","ink",true],[bufs?"":"（空）","muted",false]],nar?9.5:10.5));
    box.set(S.svg(Wd,vy+(nar?26:30),o));
    var h="入れた文字 "+pos+" / "+s.length+"。";
    if(log.length)h+="結果: "+log.map(function(q){return (q[0]+1)+" 文字目 "+(q[1]==="OK"?'<span class="ok">':'<span class="warn">')+_W12_RN[q[1]]+"</span>";}).join("、");
    else h+="まだ結果は無い（NMEA_NONE）。";
    if(m.st>=2&&m.st<=4)h+="<br>* までの中身 "+m.len+" 文字の XOR は 0x"+_w12_hex2(m.sum)+(m.st>=3?"、届いた上の桁 "+(m.got>>4).toString(16).toUpperCase():"")+(m.st===4?"・下の桁 "+(m.got&15).toString(16).toUpperCase()+"（0x"+_w12_hex2(m.got)+"）":"");
    ro.innerHTML=h;}
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ===== 13 章 バイナリプロトコルと設定 — 更新レート・衛星系・省電力 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w13_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w13_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 3 桁ごとに空白を入れた整数（115 200 など） */
function _w13_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
function _w13_hx(v){return (v<16?"0":"")+v.toString(16).toUpperCase();}
/* フレッチャーのチェックサム（8 bit の和を 2 つ。図の _f13_ck と同じ） */
function _w13_ck(bs){var a=0,b=0;bs.forEach(function(x){a=(a+x)&255;b=(b+a)&255;});return [a,b];}
/* 同期・クラス・ID・長さ（リトルエンディアン）・本体・チェックサムを並べたフレーム（2 節の bin_build と同じ） */
function _w13_frame(cls,id,body){var L=body.length,h=[cls,id,L&255,L>>8],c=_w13_ck(h.concat(body));return [0xB5,0x62].concat(h,body,c);}
/* フレームの i バイト目の欄 */
function _w13_role(i,n){return i<2?"sync":(i===2?"cls":(i===3?"id":(i<6?"len":(i>=n-2?"ck":"body"))));}
var _W13_FC={sync:"muted",cls:"purple",id:"purple",len:"gold",body:"signal",ck:"green"};
var _W13_FN={sync:"同期",cls:"クラス",id:"ID",len:"長さ",body:"本体",ck:"チェックサム"};
/* 2 節の gnss_poll と同じ流れ（フレームの部分だけ）。返り値 {ev:[{ok, a（頭の位置）, b（終わりの位置）, name}], pend（待っているフレーム）} */
function _w13_poll(st,rescan){var ev=[],s=0,raw=[],rpos=[],len=0,back=[],bpos=[],i=0;
  while(true){var c,ci;
    if(back.length){c=back.shift();ci=bpos.shift();}else if(i<st.length){c=st[i];ci=i;i++;}else break;
    if(s===0){if(c===0xB5){s=1;raw=[c];rpos=[ci];}continue;}
    raw.push(c);rpos.push(ci);var res=null;
    if(s===1){if(c===0x62)s=2;else res="BIN_ERR_SYNC";}
    else if(s===2){if(raw.length===6){len=raw[4]|(raw[5]<<8);if(len>256)res="BIN_ERR_LONG";else s=3;}}
    else if(s===3){if(raw.length===8+len){var k=_w13_ck(raw.slice(2,6+len));
      if(k[0]===raw[6+len]&&k[1]===raw[7+len]){ev.push({ok:true,a:rpos[0],b:ci,cls:raw[2],id:raw[3],len:len});s=0;}else res="BIN_ERR_SUM";}}
    if(res){ev.push({ok:false,a:rpos[0],b:ci,name:res});s=0;if(rescan){back=raw.slice(1).concat(back);bpos=rpos.slice(1).concat(bpos);}}}
  return {ev:ev,pend:s!==0?{a:rpos[0],need:(s===3?8+len:6)-raw.length}:null};}

/* ---- 2 節: フレームを組む・チェックサムを 1 バイトずつ・誤りを入れて受ける ---- */
var _W13_MSG=[{t:"間隔の設定（06 08。例の形式の古い版）",cls:6,id:8,rate:true},{t:"読み出し（06 08、本体なし）",cls:6,id:8,body:[]},
  {t:"ACK（05 01、本体 06 08）",cls:5,id:1,body:[6,8]},{t:"NAK（05 00、本体 06 08）",cls:5,id:0,body:[6,8]},{t:"16 進で入れる",free:true}];
var _W13_ERR=["なし","本体の 1 バイト目に 1 を足す","本体の 1・2 バイト目を入れ替える","チェックサムの 1 バイト目に 1 を足す","長さの欄を 0x0400（1024）にする","長さの欄に 16 を足す","8 バイトで切れる"];
REG.w13_frame=function(el,U){
  var S=U.S;
  U.head(el,"BINARY FRAME","フレームを組み、チェックサムを 1 バイトずつ計算し、誤りを入れて受ける側で確かめる");
  var r1=U.ctrls(el);
  var ms=U.select(r1,"送るメッセージ",_W13_MSG.map(function(m){return m.t;}),0,function(){sync();k=0;draw();});
  var rt=U.slider(r1,"更新レート",{values:[1,2,4,5,10,20],value:5,fmt:function(v){return v+" Hz（"+Math.round(1000/v)+" ms）";},onInput:function(){k=0;draw();}});
  var r2=U.ctrls(el);
  var tc=U.textin(r2,"クラス（16 進）","06",function(){k=0;draw();}),ti=U.textin(r2,"ID（16 進）","08",function(){k=0;draw();}),
      tb=U.textin(r2,"本体（16 進。空白で区切る。16 バイトまで）","C8 00 01 00 01 00",function(){k=0;draw();},{width:"260px"});
  var r3=U.ctrls(el);
  var er=U.select(r3,"受ける側に届くまでに入る誤り",_W13_ERR,0,function(){draw();});
  var rs=U.checkbox(r3,"誤りのとき 2 バイト目から探し直す（2 節）",true,function(){draw();});
  var br=U.btnrow(el),k=0;
  U.button(br,"本文の例（5 Hz の設定）",function(){ms.set(0);rt.set(5);er.set(0);rs.set(true);sync();k=0;draw();});
  U.button(br,"1 バイト進める",function(){k++;draw();});
  U.button(br,"最後まで",function(){k=999;draw();});
  U.button(br,"初めから",function(){k=0;draw();});
  U.button(br,"入れ替わり（C8 00 → 00 C8）",function(){ms.set(0);rt.set(5);er.set(2);k=999;draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function sync(){var f=_W13_MSG[ms.get()].free;r2.style.display=f?"":"none";rt.el.style.display=_W13_MSG[ms.get()].rate?"":"none";}
  function parseHex(s,mx){var out=[],ok=true;String(s).trim().split(/[\s,]+/).forEach(function(t){if(!t)return;if(!/^[0-9a-fA-F]{1,2}$/.test(t)){ok=false;return;}out.push(parseInt(t,16));});
    return {v:out.slice(0,mx),ok:ok&&out.length<=mx};}
  function msg(){var m=_W13_MSG[ms.get()];
    if(m.rate){var p=Math.round(1000/rt.get());return {cls:6,id:8,body:[p&255,p>>8,1,0,1,0],ok:true};}
    if(m.free){var c=parseHex(tc.get(),1),d=parseHex(ti.get(),1),b=parseHex(tb.get(),16);
      return {cls:c.v.length?c.v[0]:0,id:d.v.length?d.v[0]:0,body:b.v,ok:c.ok&&d.ok&&b.ok&&c.v.length===1&&d.v.length===1};}
    return {cls:m.cls,id:m.id,body:m.body.slice(),ok:true};}
  sync();
  function draw(){
    var m=msg(),fr=_w13_frame(m.cls,m.id,m.body),n=fr.length,nar=_w13_nar(box),Wd=nar?400:700,o=[],x0=nar?6:14;
    var cr=fr.slice(2,n-2),nk=cr.length;if(k>nk)k=nk;
    /* (a) フレーム */
    o.push(S.T(x0,16,"(a) 組んだフレーム: "+n+" バイト（本体 "+m.body.length+" バイト + 8）","start",nar?10.5:11,"ink",true));
    var cw=Math.min(nar?30:46,(Wd-2*x0)/n),y0=46,h=28;
    var groups=[["sync",0,2],["cls",2,3],["id",3,4],["len",4,6]];if(m.body.length)groups.push(["body",6,6+m.body.length]);groups.push(["ck",n-2,n]);
    groups.forEach(function(g){var c=_W13_FC[g[0]],xa=x0+g[1]*cw,xb=x0+g[2]*cw,nm=_W13_FN[g[0]];
      if(xb-xa>U.tw(nm,9.5)+2)o.push(S.T((xa+xb)/2,y0-6,nm,"middle",9.5,c,true));});
    fr.forEach(function(v,i){var r=_w13_role(i,n),c=_W13_FC[r],cur=(i===k+2&&k<nk),dn=i>=2&&i<n-2&&i-2<k;
      o.push(S.RECT(x0+i*cw+1,y0,cw-2,h,3,U.soft(c),cur?"alias":c,cur?2.6:1.1));
      o.push(S.T(x0+i*cw+cw/2,y0+h/2+4,_w13_hx(v),"middle",cw>30?11:9.5,"ink",true,true));
      if(dn)o.push(S.L(x0+i*cw+3,y0+h+3,x0+(i+1)*cw-3,y0+h+3,"green",2));});
    /* (b) チェックサムの筆算（クラスから本体の終わりまで） */
    var yb=y0+h+24;
    o.push(S.T(x0,yb,nar?"(b) チェックサム（"+k+" / "+nk+" バイト）":"(b) チェックサム: 1 バイトずつ CK_A に足し、CK_A の途中の値を CK_B に足す（"+k+" / "+nk+" バイト）","start",nar?9.5:10.5,"ink",true));
    var ya=yb+18,yB=yb+36;
    o.push(S.TX(x0+2*cw-4,ya+4,"CK_A","end",9.5,"green",true));o.push(S.TX(x0+2*cw-4,yB+4,"CK_B","end",9.5,"green",true));
    var A=0,B=0;
    if(k===0)o.push(S.T(x0+2*cw+4,ya+12,nar?"「1 バイト進める」で足していく":"「1 バイト進める」で、クラスのバイトから順に足していく","start",9.5,"muted"));
    for(var i=0;i<k;i++){A=(A+cr[i])&255;B=(B+A)&255;
      o.push(S.T(x0+(i+2)*cw+cw/2,ya+4,_w13_hx(A),"middle",cw>30?10.5:9,"ink",i===k-1,true));
      o.push(S.T(x0+(i+2)*cw+cw/2,yB+4,_w13_hx(B),"middle",cw>30?10.5:9,"ink",i===k-1,true));}
    if(k===nk){o.push(S.ARR(x0+(nk+1.6)*cw,ya,x0+(n-2)*cw+cw/2-4,ya,"green",1.3,5));o.push(S.ARR(x0+(nk+1.6)*cw,yB,x0+(n-1)*cw+cw/2-4,yB,"green",1.3,5));
      o.push(S.T(x0+(n-2)*cw+cw/2,ya+4,_w13_hx(fr[n-2]),"middle",10.5,"green",true,true));o.push(S.T(x0+(n-1)*cw+cw/2,yB+4,_w13_hx(fr[n-1]),"middle",10.5,"green",true,true));}
    /* (c) 受ける側 */
    var e=er.get(),bad=fr.slice(),mark=[],note="";
    if(e===1){var p1=m.body.length?6:2;bad[p1]=(bad[p1]+1)&255;mark=[p1];}
    else if(e===2){if(m.body.length>=2){var t=bad[6];bad[6]=bad[7];bad[7]=t;mark=[6,7];}else note="本体が 2 バイトより短いので、入れ替えない";}
    else if(e===3){bad[n-2]=(bad[n-2]+1)&255;mark=[n-2];}
    else if(e===4){bad[4]=0;bad[5]=4;mark=[4,5];}
    else if(e===5){var L2=m.body.length+16;bad[4]=L2&255;bad[5]=L2>>8;mark=[4];}
    else if(e===6){bad=fr.slice(0,8);mark=[7];}
    var ack=_w13_frame(5,1,[6,8]),st=bad.concat(ack,fr),parts=[[0,bad.length,"届いたフレーム"],[bad.length,bad.length+ack.length,"ACK"],[bad.length+ack.length,st.length,"同じフレーム"]];
    var P=_w13_poll(st,rs.get());
    var yc=yB+30;
    o.push(S.T(x0,yc,"(c) 受ける側に届いたバイト（後ろに ACK と、同じフレームがもう 1 つ続く）","start",nar?9.5:10.5,"ink",true));
    var per=nar?Math.min(st.length,13):Math.min(st.length,24),cw2=(Wd-2*x0)/per,rows=Math.ceil(st.length/per),yr0=yc+40,rh=70;
    function xy(i){return [x0+(i%per)*cw2,yr0+Math.floor(i/per)*rh];}
    st.forEach(function(v,i){var q=xy(i),pi=i<bad.length?0:(i<bad.length+ack.length?1:2),base=pi===0?bad:(pi===1?ack:fr),j=i-parts[pi][0],c=_W13_FC[_w13_role(j,base.length)],isb=pi===0&&mark.indexOf(j)>=0;
      o.push(S.RECT(q[0]+1,q[1],cw2-2,22,3,isb?U.soft("alias"):U.soft(c),isb?"alias":c,isb?2:1));
      o.push(S.T(q[0]+cw2/2,q[1]+15,_w13_hx(v),"middle",cw2>28?10:8.5,"ink",true,true));});
    /* 取り出したもの・捨てたもの（括弧） */
    function span(a,b,lv,c,lab){for(var rr=Math.floor(a/per);rr<=Math.floor(b/per);rr++){var ia=Math.max(a,rr*per),ib=Math.min(b,rr*per+per-1),qa=xy(ia),qb=xy(ib),yy=qa[1]-6-lv*14;
        o.push(S.W([qa[0]+2,yy+4,qa[0]+2,yy,qb[0]+cw2-2,yy,qb[0]+cw2-2,yy+4],c,1.6));
        if(rr===Math.floor(a/per))o.push(S.T(qa[0]+3,yy-3,lab,"start",9,c,true,false,null,true));}}
    P.ev.forEach(function(ev){if(ev.ok){var nm=ev.cls===5&&ev.id===1?"ACK":(ev.cls===5&&ev.id===0?"NAK":_w13_hx(ev.cls)+" "+_w13_hx(ev.id));span(ev.a,ev.b,0,"green","✓ "+nm);}
      else span(ev.a,ev.b,1,"alias","× "+ev.name);});
    if(P.pend){var qp=xy(P.pend.a);o.push(S.T(qp[0]+2,qp[1]-34,"待っている（あと "+P.pend.need+" バイト）","start",9,"gold",true,false,null,true));}
    var hgt=yr0+(rows-1)*rh+40;
    box.set(S.svg(Wd,hgt,o));
    /* 読み出し */
    var hx=fr.map(_w13_hx).join(" "),h2="フレーム: <b style=\"font-family:var(--mono)\">"+hx+"</b>";
    if(!m.ok)h2+='<br><span class="warn">16 進で読めない欄がある（読めた所だけで組んだ）</span>';
    if(_W13_MSG[ms.get()].rate){var pm=Math.round(1000/rt.get());h2+="<br>本体: 測る間隔 "+pm+" ms（0x"+_w13_hx(pm>>8)+_w13_hx(pm&255)+" を下位のバイトから "+_w13_hx(pm&255)+" "+_w13_hx(pm>>8)+"）・何回測るごとに位置を出すか 1・時刻の基準 1（GPS 時刻）";}
    var ok=P.ev.filter(function(v){return v.ok;}),ng=P.ev.filter(function(v){return !v.ok;});
    h2+="<br>受ける側: 取り出したフレーム "+ok.length+" 個・捨てたもの "+ng.length+" 個"+(ng.length?"（"+ng.map(function(v){return v.name;}).join("・")+"）":"")+(P.pend?"・待っているフレームあり":"");
    if(e===1||e===2||e===3){if(note)h2+="<br>"+note;else{var a0=fr.slice(2,n-2),a1=bad.slice(2,n-2),x0_=0,x1_=0,s0=0,s1=0;a0.forEach(function(v){x0_^=v;s0=(s0+v)&255;});a1.forEach(function(v){x1_^=v;s1=(s1+v)&255;});
      var c1=_w13_ck(a1),got=[bad[n-2],bad[n-1]],fl=!(c1[0]===got[0]&&c1[1]===got[1]);
      if(e===3){x1_=x0_;s1=s0;}
      h2+="<br>3 つの検査: 排他的論理和 "+(x0_!==x1_||e===3?'<span class="ok">気づく</span>':'<span class="warn">気づかない</span>')+"・8 bit の和 "+(s0!==s1||e===3?'<span class="ok">気づく</span>':'<span class="warn">気づかない</span>')+"・フレッチャー "+(fl?'<span class="ok">気づく</span>':'<span class="warn">気づかない</span>');
      if(e===2&&m.body.length>=2)h2+="（CK_B の変化 = (q − p)(a<sub>q</sub> − a<sub>p</sub>) = 1 × ("+bad[6]+" − "+bad[7]+")）";}}
    if(e>=4&&!rs.get())h2+='<br><span class="warn">探し直さないので、誤ったフレームが飲み込んだ後ろのフレームも失う</span>';
    ro.innerHTML=h2;
  }
  draw();
};

/* ---- 3 節: 更新レート・出す文・ボーレートと、負荷率・位置の遅れ ---- */
var _W13_SATS={GP:[[5,45,123,47],[13,62,45,49],[15,30,210,44],[18,15,300,38],[20,72,280,50],[23,25,150,42],[24,40,330,45],[29,10,60,36],[30,5,250,null],[31,2,100,null]],
  GL:[[66,35,20,43],[67,55,110,46],[76,20,250,40],[77,48,300,44],[82,8,180,null],[83,3,140,null]],
  GA:[[2,40,70,45],[7,65,200,48],[8,22,320,41],[13,30,140,43],[26,50,260,46],[30,12,30,37],[33,4,190,null]],
  GB:[[6,55,190,42],[9,62,210,44],[16,48,170,43],[19,33,60,45],[20,70,320,47],[29,25,280,41],[35,15,110,38],[44,6,40,null]]};
/* 例の文の並び（10 章の w10_uart と同じ作り方）。[[種類, 長さ], …] */
function _w13_nmea(nsys,kinds){var talk=["GP","GL","GA","GB"].slice(0,nsys),used=talk.map(function(t){return _W13_SATS[t].filter(function(s){return s[3]!=null;}).map(function(s){return s[0];});}),nused=0;
  used.forEach(function(u){nused+=u.length;});
  function p2(v){return (v<10?"0":"")+v;} function p3(v){return (v<10?"00":(v<100?"0":""))+v;}
  var bodies=[];
  kinds.forEach(function(k){
    if(k==="GGA")bodies.push([k,"GNGGA,092750.00,3540.86000,N,13946.02000,E,1,"+p2(nused)+",0.80,3.3,M,36.7,M,,"]);
    else if(k==="RMC")bodies.push([k,"GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"]);
    else if(k==="GSA")used.forEach(function(u){var f=u.map(p2);while(f.length<12)f.push("");bodies.push([k,"GNGSA,A,3,"+f.join(",")+",1.50,0.80,1.27"]);});
    else if(k==="GSV")talk.forEach(function(t){var ss=_W13_SATS[t],nm=Math.ceil(ss.length/4);for(var m=0;m<nm;m++){var fl=[t+"GSV",String(nm),String(m+1),p2(ss.length)];
      ss.slice(4*m,4*m+4).forEach(function(s){fl.push(p2(s[0]),p2(s[1]),p3(s[2]),s[3]==null?"":p2(s[3]));});bodies.push([k,fl.join(",")]);}});
    else if(k==="VTG")bodies.push([k,"GNVTG,,T,,M,0.012,N,0.022,K,A"]);
    else if(k==="GLL")bodies.push([k,"GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A"]);});
  return bodies.map(function(b){return [b[0],b[1].length+6];});}   /* $ と *XX と CR LF の 6 文字を足す */
var _W13_KINDS=[["GGA","位置","signal"],["RMC","時刻・位置・速度","purple"],["GSA","使った衛星と DOP","green"],["GSV","見えている衛星","gold"],["VTG","速度","teal"],["GLL","緯度・経度","muted"]];
var _W13_POS={BIN:1,GGA:1,RMC:1,GLL:1};   /* 位置を書いたもの */
REG.w13_rate=function(el,U){
  var S=U.S;
  U.head(el,"UPDATE RATE","更新レート・出す文・ボーレートと、負荷率・位置の遅れ・動いている機器が使う位置のずれ");
  var r1=U.ctrls(el),ck={};
  _W13_KINDS.forEach(function(k){ck[k[0]]=U.checkbox(r1,k[0],true,function(){draw();});});
  ck.BIN=U.checkbox(r1,"バイナリの位置のフレーム（100 B）",false,function(){draw();});
  var r2=U.ctrls(el);
  var sys=U.select(r2,"衛星系",["GPS","GPS + GLONASS","GPS + GLONASS + Galileo","GPS + GLONASS + Galileo + BeiDou"],1,function(){draw();});
  var rate=U.slider(r2,"更新レート",{values:[1,2,4,5,10],value:1,fmt:function(v){return v+" Hz";},onInput:function(){draw();}});
  var bauds=[4800,9600,19200,38400,57600,115200,230400,460800,921600];
  var baud=U.select(r2,"ボーレート",bauds.map(function(b){return {v:String(b),t:_w13_g(b)+" bit/s"};}),"9600",function(){draw();});
  var r3=U.ctrls(el);
  var tcs=U.slider(r3,"計算の時間 t<sub>c</sub>（例の値）",{min:0,max:0.3,step:0.01,value:0.12,fmt:function(v){return _w13_f(v,2)+" s";},onInput:function(){draw();}});
  var vs=U.slider(r3,"機器の速さ",{values:[0,4,20,50,100,200,300],value:100,fmt:function(v){return v+" km/h";},onInput:function(){draw();}});
  var tt=U.slider(r3,"時刻 t",{min:0,max:10,step:0.01,value:1.5,fmt:function(v){return _w13_f(v,2)+" s";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function setAll(kinds,bin,s,r,b){_W13_KINDS.forEach(function(k){ck[k[0]].set(kinds.indexOf(k[0])>=0);});ck.BIN.set(bin);sys.set(s);rate.set(r);baud.set(String(b));tcs.set(0.12);draw();}
  var ALL=["GGA","RMC","GSA","GSV","VTG","GLL"];
  U.button(br,"本文の例（11 文・1 Hz・9600）",function(){tick.stop();vs.set(100);tt.set(1.5);setAll(ALL,false,1,1,9600);});
  U.button(br,"2 Hz にする（130 %）",function(){setAll(ALL,false,1,2,9600);});
  U.button(br,"5 Hz・115 200",function(){setAll(ALL,false,1,5,115200);});
  U.button(br,"10 Hz・GGA と RMC だけ・115 200",function(){setAll(["GGA","RMC"],false,1,10,115200);});
  U.button(br,"10 Hz・バイナリだけ・9600",function(){setAll([],true,1,10,9600);});
  var tick=U.ticker(function(){var v=tt.get()+0.05;if(v>10){v=0;}tt.set(v);draw();},50);
  U.button(br,"再生",function(){tick.start();});
  U.button(br,"止める",function(){tick.stop();});
  var box=U.svgbox(el),ro=U.readout(el);
  function draw(){
    var kinds=_W13_KINDS.map(function(k){return k[0];}).filter(function(k){return ck[k].get();}),ns=sys.get()+1,ss=_w13_nmea(ns,kinds);
    if(ck.BIN.get())ss.unshift(["BIN",100]);
    var NB=0,tpos=null;ss.forEach(function(s){NB+=s[1];if(tpos===null&&_W13_POS[s[0]])tpos=NB;});
    var R=rate.get(),Tu=1/R,B=parseInt(baud.get(),10),tc=tcs.get(),ttx=10*NB/B,load=ttx/Tu,tp=tpos===null?null:10*tpos/B,v=vs.get()/3.6,t=tt.get();
    var nar=_w13_nar(box),Wd=nar?400:700,o=[],x0=nar?6:14;
    /* 回ごとの出力: 出し始め・位置の文の終わり・全部の終わり */
    var ep=[],endp=-1e9;for(var m=0;m<=Math.round(10.5*R)+1;m++){var e0=m*Tu,s0=Math.max(e0+tc,endp);endp=s0+ttx;ep.push({e:e0,s:s0,p:tp===null?null:s0+tp,f:endp});}
    /* (a) 線の上の時間（3 s） */
    var Pa=U.plot(nar?40:90,30,Wd-(nar?50:110),40,[0,3],[0,1]);
    o.push(S.T(x0,16,"(a) 線の上の時間（青が位置を書いた文まで、金がその後の文。縦の線は位置を求める時刻）","start",nar?9:10.5,"ink",true));
    o.push(S.RECT(Pa.x,Pa.y,Pa.w,Pa.h,2,"var(--screen)","line",0.8));
    ep.forEach(function(q){if(q.e>3)return;o.push(S.L(Pa.X(q.e),Pa.y-4,Pa.X(q.e),Pa.y+Pa.h+4,"ink",1.3));
      if(q.s<3){var a=q.s,b=Math.min(q.f,3);if(q.p!==null){var pb=Math.min(q.p,3);o.push(S.RECT(Pa.X(a),Pa.y+8,Math.max(1,Pa.X(pb)-Pa.X(a)),Pa.h-16,0,U.soft("signal"),"signal",1));
          if(pb<b)o.push(S.RECT(Pa.X(pb),Pa.y+8,Math.max(1,Pa.X(b)-Pa.X(pb)),Pa.h-16,0,U.soft("gold"),"gold",1));}
        else o.push(S.RECT(Pa.X(a),Pa.y+8,Math.max(1,Pa.X(b)-Pa.X(a)),Pa.h-16,0,U.soft("gold"),"gold",1));}});
    [0,0.5,1,1.5,2,2.5,3].forEach(function(z){o.push(S.T(Pa.X(z),Pa.y+Pa.h+15,z===3?"3 s":String(z),"middle",9,"muted"));});
    if(t<=3)o.push(S.L(Pa.X(t),Pa.y-8,Pa.X(t),Pa.y+Pa.h+8,"alias",1.6,"4 3"));
    o.push(S.T(Pa.x-6,Pa.y+Pa.h/2+4,"TXD","end",9.5,"gold",true));
    /* (b) 回ごとの位置の遅れ（10 s） */
    var yb=Pa.y+Pa.h+40,ymax=1;
    if(tp!==null){ep.forEach(function(q){if(q.e<=10)ymax=Math.max(ymax,q.p-q.e);});}ymax=Math.ceil(ymax*2)/2;
    var Pb=U.plot(nar?40:90,yb+14,nar?Wd-50:300,110,[0,10],[0,ymax]);
    o.push(S.TX(x0,yb,"(b) 回ごとの位置の遅れ t_d","start",nar?9.5:10.5,"ink",true));
    o.push(Pb.axes({xl:"時間 t [s]",yl:"遅れ [s]",ylOff:30,sz:9}));
    if(tp!==null)ep.forEach(function(q){if(q.e<=10)o.push(S.D(Pb.X(q.e),Pb.Y(q.p-q.e),load>1?"alias":"signal",2.4));});
    if(t<=10)o.push(S.L(Pb.X(t),Pb.y,Pb.X(t),Pb.y+Pb.h,"alias",1.2,"4 3"));
    /* (c) 動いている機器 */
    var xc=nar?x0:Pb.x+Pb.w+30,yc=nar?yb+180:yb,wc=nar?Wd-2*x0:Wd-xc-14;
    o.push(S.T(xc,yc,"(c) "+vs.get()+" km/h の機器（時刻 t）","start",nar?9.5:10.5,"ink",true));
    var last=null;if(tp!==null)ep.forEach(function(q){if(q.p<=t)last=q;});
    var sc=wc/60,cx=xc+wc*0.78,ry=yc+50;
    o.push(S.RECT(xc,ry-18,wc,36,4,"var(--screen)","line",0.8));
    var off=(v*t)%10;for(var z=-1;z<8;z++){var mx=cx-(z*10+off)*sc;if(mx>xc+4&&mx<xc+wc-10)o.push(S.L(mx,ry,mx+4*sc,ry,"faint",2));}
    o.push(S.RECT(cx-9,ry-8,18,16,3,U.soft("green"),"green",1.6));o.push(S.T(cx,ry+30,"いま","middle",9,"green",true));
    if(last){var d=v*(t-last.e),gx=cx-d*sc;if(gx>xc+4){o.push(S.CIRC(gx,ry,6,"gold",2,U.soft("gold")));o.push(S.T(gx,ry-12,"使う位置","middle",9,"gold",true,false,null,true));
        if(cx-gx>24)o.push(S.DARR(gx+8,ry+11,cx-11,ry+11,"gold",1.1,5));}
      o.push(S.T(xc+4,ry+30,"後れ "+_w13_f(d,1)+" m（"+_w13_f(t-last.e,2)+" s 前の位置）","start",9.5,"gold",true));}
    else o.push(S.T(xc+4,ry+30,tp===null?"位置を書いた文が無い":"まだ位置が届いていない","start",9.5,"alias",true));
    var H=nar?yc+96:Math.max(Pb.y+Pb.h+40,ry+44);
    box.set(S.svg(Wd,H,o));
    /* 読み出し */
    var h="1 回 <b>"+NB+" バイト</b>（"+ss.length+" 個）× "+R+" 回/s = データ量 "+_w13_g(NB*R)+" B/s、負荷率 <b>"+_w13_f(load*100,load<0.1?1:0)+" %</b>（1 回を送る時間 t<sub>tx</sub> = "+_w13_f(ttx*1000,ttx<0.1?1:0)+" ms）<br>";
    if(tp===null)h+='<span class="warn">位置を書いた文（GGA・RMC・GLL）かバイナリのフレームを選ぶ</span>';
    else{var td=tc+tp;h+="位置の遅れ: 計算 "+_w13_f(tc,2)+" s + 位置を書いたものまで "+_w13_f(tp*1000,tp<0.1?1:0)+" ms = <b>"+_w13_f(td,3)+" s</b>";
      if(load>1)h+='<br><span class="warn">負荷率が 100 % を超えている: 遅れが 1 秒に '+_w13_f(load-1,2)+" s ずつ増える（10 s 後に "+_w13_f(td+10*(load-1),1)+" s。実際はバッファがあふれて文が捨てられる）</span>";
      else{var age=td+Tu/2;h+="。使う位置の古さは平均 "+_w13_f(age,3)+" s（遅れ + 間隔の半分）で、"+vs.get()+" km/h なら平均 <b>"+_w13_f(v*age,1)+" m</b> 後ろ";}}
    ro.innerHTML=h;
  }
  draw();
};

/* ---- 5 節: 省電力の方式と、平均の電流・電池の持ち時間 ---- */
var _W13_IA=35,_W13_IT=25,_W13_IB=0.015,_W13_TH=2,_W13_TW=30;   /* mA・s（10 章・5 章の例の値） */
/* 周期的に起きる方式の平均の電流 [mA]（5 節の式。図の _f13_iavg と同じ） */
function _w13_iavg(Tu,ttrk,teph,agnss){if(Tu<=_W13_TH+ttrk)return _W13_IT;
  if(agnss||Tu<teph){var q=_W13_IA*_W13_TH+_W13_IT*ttrk+_W13_IB*(Tu-_W13_TH-ttrk);return q/Tu+(agnss?0:_W13_IA*(_W13_TW-_W13_TH)/teph);}
  var q2=_W13_IA*_W13_TW+_W13_IT*ttrk+_W13_IB*(Tu-_W13_TW-ttrk);return q2/Tu;}
function _w13_tstr(s){if(s<120)return _w13_f(s,s<10?1:0)+" s";if(s<7200)return _w13_f(s/60,s<600?1:0)+" 分";if(s<172800)return _w13_f(s/3600,s<36000?1:0)+" 時間";if(s<3*365*86400)return _w13_f(s/86400,s<864000?1:0)+" 日";return _w13_f(s/(365*86400),1)+" 年";}
REG.w13_power=function(el,U){
  var S=U.S;
  U.head(el,"POWER SAVE","省電力の方式と周期で、平均の電流・電池の持ち時間・起きるたびの TTFF が変わる");
  var r1=U.ctrls(el);
  var md=U.select(r1,"方式",["連続（追尾を続ける）","周期的に起きる","必要なときだけ（ばらばらの時刻に起こす）"],1,function(){draw();});
  var tu=U.slider(r1,"周期 T<sub>u</sub>（必要なときだけでは、起こす間隔の平均）",{min:2.5,max:86400,log:true,value:60,snap:function(v){return v<10?Math.round(v*10)/10:(v<100?Math.round(v):(v<3600?Math.round(v/10)*10:Math.round(v/600)*600));},fmt:_w13_tstr,onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var tk=U.slider(r2,"位置が出た後の追尾 t<sub>trk</sub>",{min:0,max:60,step:1,value:0,fmt:function(v){return v+" s";},onInput:function(){draw();}});
  var te=U.select(r2,"エフェメリスの有効な時間",[{v:"7200",t:"2 時間（本文の例）"},{v:"10800",t:"3 時間"},{v:"14400",t:"4 時間"}],"7200",function(){draw();});
  var ag=U.checkbox(r2,"A-GNSS でエフェメリスを受け取る",false,function(){draw();});
  var bt=U.select(r2,"電池",[{v:"220",t:"コイン形 220 mAh"},{v:"1000",t:"1000 mAh"},{v:"2000",t:"2000 mAh（本文の例）"},{v:"3000",t:"3000 mAh"}],"2000",function(){draw();});
  var br=U.btnrow(el),seed=13;
  U.button(br,"本文の例（60 s ごと）",function(){md.set(1);tu.set(60);tk.set(0);te.set("7200");ag.set(false);bt.set("2000");draw();});
  U.button(br,"1 時間ごと",function(){md.set(1);tu.set(3600);draw();});
  U.button(br,"4 時間ごと（毎回ウォーム）",function(){md.set(1);tu.set(14400);draw();});
  U.button(br,"2.8 s（損益分岐の近く）",function(){md.set(1);tu.set(2.8);draw();});
  U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  /* 必要なときだけ: 平均 Tu の指数分布の間隔で起こし、エフェメリスの古さでホット・ウォームを決める */
  function ondemand(Tu,ttrk,teph,agn){var r=U.rng(seed),Q=0,T=0,age=0,nw=0,nwarm=0,wakes=[];
    for(var i=0;i<4000;i++){var d=Math.max(1,r.exp(Tu));age+=d;var warm=!agn&&age>=teph,ta=warm?_W13_TW:_W13_TH;if(warm){nwarm++;age=0;}
      var tw=ta+ttrk;Q+=_W13_IA*ta+_W13_IT*ttrk+_W13_IB*Math.max(0,d-tw);T+=Math.max(d,tw);nw++;if(wakes.length<40)wakes.push([T-Math.max(d,tw)+Math.max(0,d-tw),ta,warm]);}
    return {I:Q/T,warmFrac:nwarm/nw,wakes:wakes};}
  function draw(){
    var mode=md.get(),Tu=tu.get(),ttrk=tk.get(),teph=parseInt(te.get(),10),agn=ag.get(),Qb=parseInt(bt.get(),10),nar=_w13_nar(box),Wd=nar?400:700,o=[],x0=nar?6:14;
    var I,warm=false,od=null;
    if(mode===0)I=_W13_IT;else if(mode===1){I=_w13_iavg(Tu,ttrk,teph,agn);warm=!agn&&Tu>=teph;}else{od=ondemand(Tu,ttrk,teph,agn);I=od.I;}
    var life=Qb/I*3600;
    /* (a) 電流の形 */
    var span=mode===0?150:(mode===1?3*Tu:Math.max(3*Tu,60));
    var Pa=U.plot(nar?46:84,30,Wd-(nar?56:104),90,[0,span],[0.01,100],{ylog:true});
    o.push(S.T(x0,16,"(a) 電流の形（縦は対数の目盛）","start",nar?10:11,"ink",true));
    var un=span<=600?[1,"s"]:(span<=6*3600?[60,"分"]:(span<=6*86400?[3600,"時間"]:[86400,"日"]));
    o.push(Pa.axes({yt:[0.01,0.1,1,10,100],xt:[0,span/3,2*span/3,span],xfmt:function(z){var q=z/un[0];return (q===0?"0":(Math.abs(q-Math.round(q))>1e-6?_w13_f(q,1):_w13_f(q,0)))+" "+un[1];},yfmt:function(z){return String(z);},sz:9,ylOff:34}));
    o.push(S.T(Pa.x-40,Pa.y+Pa.h/2-6,"電流","middle",9,"muted"));o.push(S.T(Pa.x-40,Pa.y+Pa.h/2+6,"[mA]","middle",9,"muted"));
    var pts=[];
    if(mode===0){pts=[[0,_W13_IA],[_W13_TH,_W13_IA],[_W13_TH,_W13_IT],[span,_W13_IT]];}
    else{var ws=[];if(mode===1){for(var k=0;k*Tu<=span;k++){var w=!agn&&(Tu>=teph||(k>0&&Math.floor(k*Tu/teph)>Math.floor((k-1)*Tu/teph)));ws.push([k*Tu,w?_W13_TW:_W13_TH,w]);}}
      else od.wakes.forEach(function(q){if(q[0]<=span)ws.push(q);});
      pts=[[0,_W13_IB]];ws.forEach(function(q){var a=q[0],b=q[0]+q[1],c=b+ttrk;pts.push([a,_W13_IB],[a,_W13_IA],[b,_W13_IA]);if(ttrk>0)pts.push([b,_W13_IT],[c,_W13_IT]);pts.push([c,_W13_IB]);});
      pts.push([span,_W13_IB]);}
    var px=pts.map(function(p){return [Pa.X(Math.min(p[0],span)),Pa.Y(p[1])];});
    o.push(S.PL(px,mode===0?"signal":(mode===1?"gold":"purple"),2));
    /* (b) 周期と平均の電流 */
    var yb=Pa.y+Pa.h+48,Pb=U.plot(nar?46:84,yb+14,nar?Wd-56:330,150,[1,86400],[0.01,100],{xlog:true,ylog:true});
    o.push(S.TX(x0,yb,"(b) 周期 T_u と平均の電流（周期的に起きる方式。点は今の値）","start",nar?9.5:10.5,"ink",true));
    o.push(S.RECT(Pb.X(teph),Pb.y,Pb.X(Math.min(86400,teph*2))-Pb.X(teph),Pb.h,0,U.soft("alias"),"none",0));
    o.push(Pb.axes({xt:[1,60,3600,86400],yt:[0.01,0.1,1,10,100],xfmt:function(z){return {1:"1 s",60:"1 分",3600:"1 時間",86400:"1 日"}[z];},yfmt:function(z){return String(z);},sz:9,ylOff:34}));
    var c1=[],c2=[];for(var j=0;j<=200;j++){var T=Math.pow(10,j/200*Math.log10(86400));if(T>_W13_TH+ttrk){c1.push([T,_w13_iavg(T,ttrk,teph,false)]);c2.push([T,_w13_iavg(T,ttrk,teph,true)]);}}
    o.push(Pb.line([[1,_W13_IT],[86400,_W13_IT]],"signal",1.6));
    o.push(Pb.clip(c1,"gold",2.2));o.push(Pb.clip(c2,"green",1.6,"5 3"));
    o.push(S.T(Pb.X(Math.sqrt(teph*Math.min(86400,teph*2))),Pb.y+12,"有効な時間","middle",8.5,"alias",true,false,null,true));
    o.push(S.LEGL(Pb.x,Pb.y+Pb.h+30,[["signal",null,"連続"],["gold",null,"周期的に起きる"],["green","5 3","A-GNSS"]],9,10));
    if(mode>0&&Tu>=1){o.push(S.D(Pb.X(Tu),Pb.Y(Math.max(0.01,Math.min(100,I))),mode===1?"ink":"purple",4));}
    /* (c) 1 周期の電荷の内訳 */
    var xc=nar?x0:Pb.x+Pb.w+40,yc=nar?Pb.y+Pb.h+56:yb,wc=nar?Wd-2*x0:Wd-xc-14;
    o.push(S.T(xc,yc,"(c) 平均の電流の内訳","start",nar?9.5:10.5,"ink",true));
    var parts=[];
    if(mode===0)parts=[["追尾 25 mA",_W13_IT,"signal"]];
    else if(mode===1){var ta=warm?_W13_TW:_W13_TH,Tq=Math.max(Tu,ta+ttrk);parts=[["捕捉（"+(warm?"ウォーム":"ホット")+" "+ta+" s）",_W13_IA*ta/Tq,warm?"alias":"gold"],["追尾 "+ttrk+" s",_W13_IT*ttrk/Tq,"signal"],["眠る",_W13_IB*Math.max(0,Tu-ta-ttrk)/Tq,"muted"]];
      if(!warm&&!agn&&Tu>_W13_TH+ttrk)parts.push(["エフェメリスを受け直す",_W13_IA*(_W13_TW-_W13_TH)/teph,"alias"]);}
    else parts=[["シミュレーションの平均",I,"purple"]];
    var tot=0;parts.forEach(function(p){tot+=p[1];});
    parts=parts.filter(function(p){return p[1]>0;});
    parts.forEach(function(p,i){var yy=yc+30+i*34,ww=Math.max(1,(wc-90)*p[1]/Math.max(tot,1e-9));o.push(S.T(xc,yy-14,p[0],"start",9,"muted"));
      o.push(S.RECT(xc,yy-10,ww,13,2,U.soft(p[2]),p[2],1));
      o.push(S.T(xc+ww+4,yy+1,_w13_f(p[1],p[1]<0.01?4:(p[1]<1?3:2))+" mA","start",9,p[2],true));});
    var H=nar?yc+30+parts.length*34+10:Math.max(Pb.y+Pb.h+44,yc+30+parts.length*34+10);
    box.set(S.svg(Wd,H,o));
    /* 読み出し */
    var h="平均の電流 <b>"+(I>=1?_w13_f(I,2)+" mA":_w13_f(I*1000,I<0.1?1:0)+" µA")+"</b>、"+Qb+" mAh の電池で <b>"+_w13_tstr(life)+"</b>（自己放電は入れていない）<br>";
    if(mode===0)h+="位置は更新レートで出し続ける（TTFF の待ちは最初の 1 回だけ）";
    else if(mode===1){var ttf=warm?_W13_TW:_W13_TH;h+="起きるたびの TTFF: "+(warm?'<span class="warn">ウォーム 30 s（眠る時間がエフェメリスの有効な時間を超える）</span>':"ホット 2 s"+(agn?"":"（有効な時間ごとに 1 回はウォーム 30 s）"))+"、位置の更新の間隔 "+_w13_tstr(Tu);
      if(I>_W13_IT-1e-9)h+='<br><span class="warn">連続より電流が大きい（周期が損益分岐の 2.8 s より短い）</span>';}
    else h+="起こす間隔はばらばら（平均 "+_w13_tstr(Tu)+"）。ウォームスタートになった割合 "+_w13_f(od.warmFrac*100,0)+" %（4000 回のシミュレーション）";
    ro.innerHTML=h;
  }
  draw();
};

/* ===== 14 章 時刻と 1PPS — GNSS で時計を合わせる ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w14_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w14_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 3 桁ごとに空白を入れた整数 */
function _w14_g(v){var s=String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g," ");return (v<0?"−":"")+s;}
/* 時間を見やすい単位で（s を受け取る） */
function _w14_t(s){var a=Math.abs(s);if(a<1e-6)return _w14_f(s*1e9,a<1e-8?2:1)+" ns";if(a<1e-3)return _w14_f(s*1e6,a<1e-5?2:1)+" µs";if(a<1)return _w14_f(s*1e3,a<1e-2?2:1)+" ms";return _w14_f(s,2)+" s";}
var _W14_T0=50;   /* 例の時刻 09:27:50 UTC（10 章・12 章の例の文） */
function _w14_hms(s){var t=_W14_T0+s,m=27+Math.floor(t/60);t=((t%60)+60)%60;return "09:"+(m<10?"0":"")+m+":"+(t<10?"0":"")+Math.floor(t);}

/* ---- 2 節: 1PPS と文の時間の並び（どのパルスに何秒の名前が付くか） ---- */
var _W14_SETS=[{nm:"12 章の例（GPS だけ・7 文・426 B）",bytes:426},{nm:"10 章の例（GPS と GLONASS・11 文・626 B）",bytes:626}];
var _W14_GGA=73;   /* どちらの例も GGA は 73 B（$ から CR LF まで） */
/* 1 秒に rate 回の文の組を、捨てずに順に送るときの組の並び（本文の図と同じ待ち行列） */
function _w14_queue(rate,T,baud,bytes,lat){var out=[],end=-1e9,n=Math.floor(T*rate+1e-9);
  for(var i=0;i<=n;i++){var e=i/rate,st=Math.max(e+lat,end);end=st+bytes*10/baud;out.push({e:e,st:st,en:end,whole:Math.abs(e-Math.round(e))<1e-9,gga:st+_W14_GGA*10/baud});}
  return out;}
REG.w14_pps=function(el,U){
  var S=U.S;
  U.head(el,"PPS AND SENTENCES","1PPS と文の時間の並び — どのパルスに何秒の名前が付くか");
  var r1=U.ctrls(el);
  var set=U.select(r1,"出す文",_W14_SETS.map(function(s){return s.nm;}),1,function(){stop();draw();});
  var bd=U.slider(r1,"ボーレート",{values:[4800,9600,38400,115200],value:9600,fmt:function(v){return _w14_g(v)+" bit/s";},onInput:function(){stop();draw();}});
  var r2=U.ctrls(el);
  var rt=U.slider(r2,"更新レート",{values:[1,2,5,10],value:1,fmt:function(v){return v+" Hz（1 秒に "+v+" 回）";},onInput:function(){stop();draw();}});
  var lt=U.slider(r2,"文が出始めるまでの遅れ",{min:0.02,max:0.6,step:0.01,value:0.12,fmt:function(v){return _w14_f(v,2)+" s";},onInput:function(){stop();draw();}});
  var br=U.btnrow(el),cur=null,tk=U.ticker(function(){cur+=0.05;if(cur>=win()){cur=null;tk.stop();}draw();},40);
  function setAll(a,b,c,d){set.set(a);bd.set(b);rt.set(c);lt.set(d);stop();draw();}
  U.button(br,"本文の例（626 B・9600 bit/s・1 Hz）",function(){setAll(1,9600,1,0.12);});
  U.button(br,"図の (b)（1 秒に 2 回）",function(){setAll(1,9600,2,0.12);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){stop();draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function stop(){tk.stop();cur=null;}
  function win(){return _w14_nar(box)?5:8;}
  function draw(){
    var nar=_w14_nar(box),Wd=nar?400:700,T=win(),s=set.get(),bytes=_W14_SETS[s].bytes,baud=bd.get(),rate=rt.get(),lat=lt.get(),q=_w14_queue(rate,T+1,baud,bytes,lat);
    var now=cur==null?T+0.2:cur,x0=nar?62:84,w=Wd-x0-10,X=function(t){return x0+(t+0.2)/(T+0.4)*w;},o=[];
    var y0=14;
    o.push(S.T(nar?4:10,y0+2,"いま "+(cur==null?"（全部を表示）":_w14_hms(Math.floor(now))+" + "+_w14_f(now-Math.floor(now),2)+" s"),"start",10,"muted"));
    /* 秒の目盛 */
    var ya=y0+18,yb=ya+92;
    for(var k=0;k<=T;k++){o.push(S.L(X(k),ya,X(k),yb,"faint",1,"3 3"));o.push(S.T(X(k),yb+14,(nar?":"+(_W14_T0+k):_w14_hms(k)),"middle",9,"muted"));}
    /* 1PPS */
    var yp=ya+24,pts=[[X(-0.2),yp]];
    for(var k2=0;k2<=T;k2++){if(k2>now)break;pts.push([X(k2),yp]);pts.push([X(k2),yp-18]);var e2=Math.min(k2+0.1,now);pts.push([X(e2),yp-18]);pts.push([X(e2),yp]);}
    pts.push([X(Math.min(now,T+0.2)),yp]);
    o.push(S.PL(pts,"green",2));
    o.push(S.T(x0-6,yp-6,"1PPS","end",10,"green",true));
    /* 文 */
    var yt=yp+16;o.push(S.T(x0-6,yt+13,nar?"文":"文（TXD）","end",10,"gold",true));
    var rows=[];
    q.forEach(function(b){if(b.st>T+0.2||b.st>now)return;var en=Math.min(b.en,T+0.2,now);
      o.push(S.RECT(X(b.st),yt,Math.max(1,X(en)-X(b.st)-1),18,2,U.soft(b.whole?"gold":"muted"),b.whole?"gold":"muted",1));
      if(X(en)-X(b.st)>(nar?30:44))o.push(S.T(X(b.st)+3,yt+13,(_W14_T0+Math.floor(b.e))+"."+_w14_f((b.e-Math.floor(b.e))*100,0).replace(/^(\d)$/,"0$1"),"start",9,b.whole?"gold":"muted",true,true));
      if(b.whole&&b.gga<=T+0.2){var kk=Math.floor(b.gga),ok=kk===Math.round(b.e);rows.push({e:b.e,g:b.gga,k:kk,ok:ok});
        if(b.gga<=now){var c=ok?"green":"alias";o.push(S.D(X(b.gga),yt+26,c,3));o.push(S.L(X(b.gga),yt+26,X(kk)+2,yp-16,c,1.2,ok?null:"4 2"));
          if(!ok)o.push(S.T(X(kk)-4,yp-22,":"+(_W14_T0+Math.round(b.e))+" と誤る","end",9,"alias",true,false,null,true));}}});
    if(nar){o.push(S.T(6,yb+30,"線: GGA が届き終わった時刻 → 直前のパルス","start",9,"muted"));o.push(S.T(6,yb+43,"（文の時刻を名前にする。緑は正しい、赤は誤り）","start",9,"muted"));}
    else o.push(S.T(x0,yb+30,"線: GGA が届き終わった時刻 → その直前のパルスに、文の時刻を名前として付ける（緑は正しい、赤は誤り）","start",9.5,"muted"));
    if(cur!=null)o.push(S.L(X(now),ya-4,X(now),yb,"signal",1.4));
    box.set(S.svg(Wd,yb+(nar?52:40),o));
    /* 読み出し */
    var tx=bytes*10/baud,load=rate*tx,mx=0,bad=null;
    rows.forEach(function(r){mx=Math.max(mx,r.g-r.e);if(!r.ok&&bad==null)bad=r;});
    var h="1 回分 <b>"+bytes+" B</b>、送る時間 <b>"+_w14_f(tx,3)+" s</b>、負荷率 <b>"+_w14_f(load*100,0)+" %</b>"+(load>1?"（<span class=\"warn\">送り切れず、文がたまっていく</span>）":"")+"<br>";
    h+="パルスから GGA が届き終わるまで: 最初 <b>"+_w14_f(rows.length?rows[0].g-rows[0].e:0,3)+" s</b>、この "+T+" 秒の中で最大 <b>"+_w14_f(mx,3)+" s</b>。";
    h+=bad?" <span class=\"warn\">"+_w14_hms(bad.k)+" のパルスに "+_w14_hms(Math.round(bad.e))+" と付けてしまう（1 秒以上遅れた）</span>":" <span class=\"ok\">どのパルスにも正しい名前が付く（1 秒より短い）</span>";
    var tb=nar?U.tbl(["パルス","付けた名前","判定（届くまで）"],rows.slice(0,5).map(function(r){return [_w14_hms(r.k),_w14_hms(Math.round(r.e)),(r.ok?"<span class=\"ok\">正しい</span>":"<span class=\"warn\">ずれる</span>")+"（"+_w14_f(r.g-r.e,2)+" s）"];}),["left","left","left"])
      :U.tbl(["パルス（本当の秒）","付けた名前","パルスから届くまで","判定"],rows.slice(0,8).map(function(r){return [_w14_hms(r.k),_w14_hms(Math.round(r.e)),_w14_f(r.g-r.e,3)+" s",r.ok?"<span class=\"ok\">正しい</span>":"<span class=\"warn\">1 秒以上ずれる</span>"];}),["left","left","right","left"]);
    ro.innerHTML=h+tb+'<div class="wnote">文は、位置を求めた時刻（1 秒に何回か）から「遅れ」の後に出始め、前の組を送り終えるまで待って順に送るとした（捨てない製品の例）。GGA は 73 B で、それが届き終わった時刻に名前を付ける。.00 以外の時刻（1 秒に 2 回以上のときの途中の組）は名前に使わない。名前の付け方の実装は 15 章。</div>';
  }
  draw();
};

/* ---- 3 節: PI で時計を合わせる（本文の式と同じ計算。T_p = 1 s） ---- */
/* o: rm（水晶の誤差、無次元）・a = K_P T_p・b = K_I T_p²・sig（パルスと捕獲の誤差 [s]）・init（2 つ目のパルスで周波数を測る）・n・seed。
   δt[k+1] = δt[k] + rm − r̂[k]、r̂[k] = r0 + a·m[k] + b·Σ m[j]（m は測ったずれ = δt + 雑音） */
function _w14_pi(U,o){var rng=U.rng(o.seed),d=0,s=0,r0=0,D=[],R=[],M=[],RI=[],div=false;
  var n0=o.sig?rng.normal()*o.sig:0;
  if(o.init){var n1=o.sig?rng.normal()*o.sig:0;r0=o.rm+(n1-n0);d=-n1;}
  for(var k=0;k<o.n;k++){var m=d+(o.sig?rng.normal()*o.sig:0);s+=m;var r=r0+o.a*m+o.b*s;
    D.push(d);R.push(r);M.push(m);RI.push(r0+o.b*s);d=d+o.rm-r;if(Math.abs(d)>1e3){d=Math.sign(d)*1e3;div=true;}}
  return {d:D,r:R,m:M,ri:RI,div:div};}
function _w14_roots(a,b){var p=-(2-a-b),q=1-a,dis=p*p-4*q;
  if(dis>=0){var s=Math.sqrt(dis);return {re:true,z:[(-p+s)/2,(-p-s)/2],mag:Math.max(Math.abs((-p+s)/2),Math.abs((-p-s)/2))};}
  return {re:false,z:[-p/2,Math.sqrt(-dis)/2],mag:Math.sqrt(q)};}
REG.w14_discipline=function(el,U){
  var S=U.S;
  U.head(el,"CLOCK DISCIPLINE","PI で時計を合わせる — ずれの収まり方と、安定なゲインの範囲");
  var r1=U.ctrls(el);
  var rm=U.slider(r1,"水晶の周波数の誤差 r<sub>m</sub>",{min:-50,max:50,step:0.5,value:20,fmt:function(v){return _w14_f(v,1)+" ppm";},onInput:function(){run();}});
  var kp=U.slider(r1,"K<sub>P</sub>T<sub>p</sub>（比例）",{min:0.02,max:2.2,step:0.01,value:0.25,fmt:function(v){return _w14_f(v,v<0.1?3:2);},onInput:function(){run();}});
  var ki=U.slider(r1,"K<sub>I</sub>T<sub>p</sub><sup>2</sup>（積分）",{min:0,max:2.12,step:0.001,value:Math.sqrt(1/32),fmt:function(v){var b=v*v;return b===0?"0（P だけ）":(+b.toPrecision(4)).toString();},onInput:function(){run();}});
  var r2=U.ctrls(el);
  var sg=U.slider(r2,"パルスと捕獲の誤差 σ",{values:[0,1,3,10,30,100,300],value:0,fmt:function(v){return v+" ns";},onInput:function(){run();}});
  var ini=U.checkbox(r2,"2 つ目のパルスで周波数を測る（本文のコード）",false,function(){run();});
  var br=U.btnrow(el),seed=1,cur=null,R=null,L=null,N=121;
  var tk=U.ticker(function(){cur+=1;if(cur>=N-1){cur=null;tk.stop();}draw();},50);
  function setAll(r,a,b,s,i){rm.set(r);kp.set(a);ki.set(Math.sqrt(b));sg.set(s);ini.set(i);run();}
  U.button(br,"本文の例（図の (b)）",function(){setAll(20,0.25,1/32,0,false);});
  U.button(br,"P だけ",function(){setAll(20,0.25,0,0,false);});
  U.button(br,"I を強く",function(){setAll(20,0.25,0.25,0,false);});
  U.button(br,"不安定",function(){setAll(20,0.25,4.2,0,false);});
  U.button(br,"雑音 30 ns・本文のコード",function(){setAll(20,0.25,1/32,30,true);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){tk.stop();cur=null;draw();});
  U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
  var box=U.svgbox(el),ro=U.readout(el),PA=null;
  function par(n){var b=ki.get();return {rm:rm.get()*1e-6,a:kp.get(),b:b*b,sig:sg.get()*1e-9,init:ini.get(),n:n||N,seed:seed};}
  function run(){tk.stop();cur=null;R=_w14_pi(U,par());var o=par(3000);L=o.sig>0?_w14_pi(U,o):null;draw();}
  /* 安定な範囲の図で点をドラッグして、2 つのゲインを動かす */
  U.ctl.drag(box,function(type,x,y){if(!PA)return false;if(type==="down"&&!(x>=PA.x-6&&x<=PA.x+PA.w+6&&y>=PA.y-6&&y<=PA.y+PA.h+6))return false;
    if(type==="up")return;var a=Math.max(0.02,Math.min(2.2,PA.ux(x))),sb=Math.max(0,Math.min(2.12,PA.uy(y)));kp.set(+a.toFixed(2));ki.set(+sb.toFixed(3));run();});
  function draw(){
    var nar=_w14_nar(box),Wd=nar?400:700,o=par(),rt=_w14_roots(o.a,o.b),kc=cur==null?N-1:cur,s=[];
    /* (a) 安定な範囲 */
    var ax=nar?52:62,ay=24,aw=nar?140:190,ah=nar?150:190;PA=U.plot(ax,ay,aw,ah,[0,2.2],[0,Math.sqrt(4.6)]);
    s.push(S.T(nar?4:10,14,"(a) 安定な範囲（点をドラッグ）","start",10.5,"ink",true));
    var yt=[0,1/32,0.25,1,2,4],ylab=["0","1/32","0.25","1","2","4"];
    s.push(PA.axes({xl:"K_P T_p",xt:[0,1,2],yt:yt.map(Math.sqrt),xfmt:function(v){return String(v);},yfmt:function(v){var i=0,bd=9;yt.forEach(function(q,j){if(Math.abs(Math.sqrt(q)-v)<bd){bd=Math.abs(Math.sqrt(q)-v);i=j;}});return ylab[i];},sz:9}));
    s.push(S.TX(ax-40,ay+ah/2,"K_I T_p^2","middle",9.5,"muted",false,false,-90));
    var poly=[];for(var i=0;i<=60;i++){var xx=2*i/60;poly.push([PA.X(xx),PA.Y(Math.sqrt(Math.max(0,4-2*xx)))]);}poly.push([PA.X(2),PA.Y(0)]);poly.push([PA.X(0),PA.Y(0)]);
    s.push(S.PL(poly,"green",1.2,U.soft("green")));
    var lo=[],hi=[];for(var j=0;j<=40;j++){var x2=j/40;lo.push([PA.X(x2),PA.Y(1-Math.sqrt(1-x2))]);hi.push([PA.X(x2),PA.Y(1+Math.sqrt(1-x2))]);}
    s.push(S.PL(lo.concat(hi.reverse()),"green",1,"var(--screen)","4 3",0.55));
    s.push(S.T(PA.X(1.5),PA.Y(1.75),"不安定","middle",9.5,"alias",true,false,null,true));
    var stable=o.a>0&&o.b>0&&o.b<4-2*o.a,lim=o.b===0||Math.abs(o.b-(4-2*o.a))<1e-9;
    var pc=stable?"gold":(o.b===0?"muted":"alias");
    s.push(S.D(PA.X(o.a),PA.Y(Math.sqrt(o.b)),pc,5.5));s.push(S.CIRC(PA.X(o.a),PA.Y(Math.sqrt(o.b)),9,pc,1.4));
    /* (b) ずれ、(c) 周波数の補正 */
    var bx=nar?52:330,by=nar?ay+ah+58:24,bw=nar?336:360,bh=nar?150:118;
    var D=R.d,mx=0;D.forEach(function(v){if(isFinite(v))mx=Math.max(mx,Math.abs(v));});
    var lim2=Math.min(1e3,Math.max(1e-7,mx*1.15)),un=lim2<2e-6?1e9:(lim2<2e-3?1e6:1e3),ul=un===1e9?"ns":(un===1e6?"µs":"ms");
    var ymax=lim2*un,P=U.plot(bx,by,bw,bh,[0,N-1],[-ymax,ymax]);
    s.push(S.TX(bx-(nar?48:40),by-10,"(b) マイコンの時計のずれ δt_m","start",10.5,"ink",true));
    s.push(P.axes({yl:"δt_m ["+ul+"]",xt:[0,20,40,60,80,100,120],xfmt:function(v){return "";},yfmt:function(v){return U.sig(v,3);},ny:4,sz:9}));
    s.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
    /* 包絡線（根が複素数のとき）: δt[k] = 2 Re(A z^k) の 2|A||z|^k */
    var env=null;
    if(!rt.re&&!o.init&&o.sig===0&&Math.abs(D[2])>0){var zr=rt.z[0],zi=rt.z[1],c1=D[1],c2=D[2];
      /* A = (d2 − z̄ d1)/((z − z̄) z) */
      var nr=c2-zr*c1,ni=zi*c1,dr=0,di=2*zi;var qr=(nr*dr+ni*di)/(dr*dr+di*di),qi=(ni*dr-nr*di)/(dr*dr+di*di);var m2=zr*zr+zi*zi,Ar=(qr*zr+qi*zi)/m2,Ai=(qi*zr-qr*zi)/m2;
      var amp=2*Math.hypot(Ar,Ai);env=[];for(var k3=0;k3<N;k3++)env.push([k3,amp*Math.pow(rt.mag,k3)*un]);
      s.push(P.clip(env,"gold",1,"4 3"));s.push(P.clip(env.map(function(p){return [p[0],-p[1]];}),"gold",1,"4 3"));}
    if(o.sig>0){var mp=[];for(var k4=0;k4<=kc;k4++)mp.push(S.D(P.X(k4),P.Y(Math.max(-ymax,Math.min(ymax,R.m[k4]*un))),"teal",1.6));s.push(mp.join(""));}
    var dp=[];for(var k5=0;k5<=kc;k5++){dp.push([k5,D[k5]*un]);if(Math.abs(D[k5])*un>ymax*1.5)break;}
    s.push(P.clip(dp,pc==="muted"?"muted":(stable?"gold":"alias"),2.2));
    if(cur!=null)s.push(S.L(P.X(kc),P.y,P.X(kc),P.y+P.h,"signal",1.2));
    var Q=U.plot(bx,by+bh+30,bw,nar?90:84,[0,N-1],[Math.min(0,o.rm*1e6)-Math.abs(o.rm*1e6)*0.6-1,Math.max(0,o.rm*1e6)+Math.abs(o.rm*1e6)*0.6+1]);
    s.push(S.TX(bx-(nar?48:40),Q.y-8,"(c) 周波数の補正 r̂ [ppm]（破線は r_m）","start",10.5,"ink",true));
    s.push(Q.axes({xl:"パルスの番号 k（秒）",xt:[0,20,40,60,80,100,120],xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},ny:3,sz:9}));
    s.push(S.L(Q.x,Q.Y(o.rm*1e6),Q.x+Q.w,Q.Y(o.rm*1e6),"alias",1,"5 3"));
    var rp=[];for(var k6=0;k6<=kc;k6++){rp.push([k6,R.r[k6]*1e6]);if(Math.abs(R.r[k6]*1e6)>1e4)break;}
    s.push(Q.clip(rp,"gold",1.8));
    if(cur!=null)s.push(S.L(Q.X(kc),Q.y,Q.X(kc),Q.y+Q.h,"signal",1.2));
    box.set(S.svg(Wd,Q.y+Q.h+40,s));
    /* 読み出し */
    var h="根 z: "+(rt.re?"<b>"+_w14_f(rt.z[0],3)+"</b> と <b>"+_w14_f(rt.z[1],3)+"</b>（実数）":"<b>"+_w14_f(rt.z[0],3)+" ± j"+_w14_f(rt.z[1],3)+"</b>（複素数）")+"、|z| の大きい方 <b>"+_w14_f(rt.mag,3)+"</b>: ";
    if(o.b===0)h+="<span class=\"warn\">根の 1 つが 1（I が無い）。ずれは r<sub>m</sub>/K<sub>P</sub> = "+_w14_t(Math.abs(o.rm)/o.a)+" に止まって消えない</span>";
    else if(!stable)h+="<span class=\"warn\">不安定（安定の条件 K<sub>I</sub>T<sub>p</sub><sup>2</sup> &lt; 4 − 2K<sub>P</sub>T<sub>p</sub> = "+_w14_f(4-2*o.a,2)+" を外れた）</span>";
    else h+="<span class=\"ok\">安定</span>。振れ幅は 1 秒に <b>"+_w14_f(rt.mag,3)+"</b> 倍、1/100 になるまで <b>"+_w14_f(Math.log(100)/Math.log(1/rt.mag),1)+" s</b>（式）";
    h+="<br>";
    if(!R.div&&o.sig===0){var pk=0,kp2=0;D.forEach(function(v,k){if(Math.abs(v)>Math.abs(pk)){pk=v;kp2=k;}});
      var st=-1;if(stable&&Math.abs(pk)>0){for(var k7=N-1;k7>=0;k7--){if(Math.abs(D[k7])>=Math.abs(pk)/100){st=k7+1;break;}}}
      h+=Math.abs(pk)>0?"シミュレーション: 最大のずれ <b>"+_w14_t(pk)+"</b>（"+kp2+" s）"+(stable&&st>0&&st<N?"、その 1/100 以下に収まるのは <b>"+st+" s</b> から":""):"シミュレーション: ずれは初めから 0（周波数を測って I の分に入れた）";}
    else if(R.div)h+="<span class=\"warn\">シミュレーション: ずれが発散した</span>";
    if(L&&!L.div&&stable){var a1=0,a2=0,b1=0,b2=0,n=0;for(var k8=500;k8<L.d.length;k8++){a1+=L.d[k8];a2+=L.d[k8]*L.d[k8];var e=L.ri[k8]-o.rm;b1+=e;b2+=e*e;n++;}
      var sd=Math.sqrt(Math.max(0,a2/n-(a1/n)*(a1/n))),sr=Math.sqrt(Math.max(0,b2/n-(b1/n)*(b1/n)));
      h+="<br>雑音 σ = "+sg.get()+" ns のとき（3000 回、500 回目から）: 本当のずれの標準偏差 <b>"+_w14_t(sd)+"</b>、I の分で覚えた周波数の誤差の標準偏差 <b>"+_w14_f(sr*1e6,4)+" ppm</b>（衛星が見えない間の時計に使う。5 節）";}
    ro.innerHTML=h+'<div class="wnote">本文 3 節の式（T<sub>p</sub> = 1 s）を 1 秒ずつ計算した。初めは時刻を合わせた直後で、ずれ 0・周波数の補正 0 とし、「2 つ目のパルスで周波数を測る」では、1 秒の数で測った r<sub>m</sub>（パルスの誤差を含む）を初めの補正にした。(b) の金色の破線は、根が複素数のときの振れ幅 C|z|<sup>k</sup>、青緑の点は雑音を含む測ったずれ。積分のつまみは、縦軸と同じ平方根の目盛で動く。</div>';
  }
  run();
};

/* ---- 4 節: 量子化誤差の鋸の歯（本文の式: q_k = T_q (round(x_k) − x_k)、x_k の端数 = x0 + kν） ---- */
function _w14_q(x0,nu,k,tq){var f=((x0+k*nu)%1+1)%1;return f<0.5?-f*tq:(1-f)*tq;}
REG.w14_sawtooth=function(el,U){
  var S=U.S;
  U.head(el,"SAWTOOTH","量子化誤差の鋸の歯 — 刻みと秒の頭の並び方と、補正値");
  var r1=U.ctrls(el);
  var fq=U.slider(r1,"受信機のクロック f<sub>q</sub>",{values:[24,48,100,250],value:48,fmt:function(v){return v+" MHz（"+_w14_f(1000/v,1)+" ns）";},onInput:function(){run();}});
  var rr=U.slider(r1,"受信機の発振器の誤差 r<sub>rx</sub>",{min:0.4,max:0.6,step:0.0001,value:0.501,fmt:function(v){return _w14_f(v,4)+" ppm";},onInput:function(){run();}});
  var r2=U.ctrls(el);
  var sg=U.slider(r2,"解の誤差 σ（2 節）",{values:[0,1,3,10.5],value:0,fmt:function(v){return v+" ns";},onInput:function(){run();}});
  var cp=U.select(r2,"マイコンの捕獲の刻み",["無し（理想）","1 ns","10 ns","100 ns（10 MHz）"],0,function(){run();});
  var cor=U.checkbox(r2,"補正値を引く",false,function(){run();});
  var br=U.btnrow(el),seed=1,cur=null,Dt=null,N=121;
  var tk=U.ticker(function(){cur+=1;if(cur>=N-1){cur=null;tk.stop();}draw();},300);
  function setAll(f,r){fq.set(f);rr.set(r);run();}
  U.button(br,"本文の例（<i style=\"font-family:serif\">ν</i> = 0.048）",function(){fq.set(48);rr.set(0.501);sg.set(0);cp.set(0);cor.set(false);run();});
  U.button(br,"<i style=\"font-family:serif\">ν</i> ≈ 0.5",function(){setAll(48,0.5104);});
  U.button(br,"<i style=\"font-family:serif\">ν</i> ≈ 0（とどまる）",function(){setAll(48,0.50002);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){tk.stop();cur=null;draw();});
  U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
  var box=U.svgbox(el),ro=U.readout(el);
  function run(){tk.stop();cur=null;var o=par(),rng=U.rng(seed),q=[],raw=[],corr=[];
    for(var k=0;k<N;k++){var qk=_w14_q(0.3,o.nu,k,o.tq),n=o.sig?rng.normal()*o.sig:0,c=o.dc?(rng.next()-0.5)*o.dc:0;q.push(qk);raw.push(qk+n+c);corr.push(n+c);}
    Dt={q:q,raw:raw,corr:corr};draw();}
  function par(){var f=fq.get(),r=rr.get(),x=f*r;return {f:f,r:r,tq:1000/f,nu:x-Math.floor(x),nf:x,sig:sg.get(),dc:[0,1,10,100][cp.get()],cor:cor.get()};}
  function draw(){
    var nar=_w14_nar(box),Wd=nar?400:700,o=par(),k=cur==null?0:cur,s=[];
    /* (a) 秒の頭 k の近くの刻み */
    s.push(S.T(nar?4:10,14,"(a) "+(cur==null?"k = 0":"k = "+k)+" の秒の頭（緑）と、クロックの刻み（灰）とパルス（青）","start",10.5,"ink",true));
    var cx=Wd/2,half=Wd/2-30,sc=half/(1.6*o.tq),ya=50,f=((0.3+k*o.nu)%1+1)%1;
    s.push(S.L(cx-half,ya,cx+half,ya,"muted",1));
    for(var m=-3;m<=4;m++){var t=(m-f)*o.tq;if(Math.abs(t)>1.6*o.tq)continue;s.push(S.L(cx+t*sc,ya-8,cx+t*sc,ya+8,"muted",1.4));}
    var qk=_w14_q(0.3,o.nu,k,o.tq);
    s.push(S.L(cx+qk*sc,ya-14,cx+qk*sc,ya+12,"signal",3));
    s.push(S.L(cx,ya-16,cx,ya+14,"green",2));
    s.push(S.DARR(cx,ya+20,cx+qk*sc,ya+20,"alias",1.1,5));
    s.push(S.TX(cx+qk*sc+(qk>=0?6:-6),ya+34,"q_"+k+" = "+_w14_f(qk,2)+" ns",qk>=0?"start":"end",10,"alias",true,true));
    s.push(S.T(cx-half,ya+34,"−"+_w14_f(1.6*o.tq,1)+" ns","start",9,"muted"));s.push(S.T(cx+half,ya+34,"+"+_w14_f(1.6*o.tq,1)+" ns","end",9,"muted"));
    /* (b) 1 秒ごとの誤差 */
    var by=ya+(nar?84:70),P=U.plot(nar?48:62,by,nar?340:620,nar?140:150,[0,N-1],[-Math.max(12,o.tq*0.6+3*o.sig+(o.dc?o.dc*0.55:0)),Math.max(12,o.tq*0.6+3*o.sig+(o.dc?o.dc*0.55:0))]);
    if(nar){s.push(S.T(4,by-22,"(b) 1 秒ごとのパルスの時刻の誤差","start",10.5,"ink",true));s.push(S.T(4,by-9,"赤: 測った値、緑: 補正値を引いた後、金の破線: 60 秒の平均","start",9,"muted"));}
    else s.push(S.T(10,by-10,"(b) 1 秒ごとのパルスの時刻の誤差（赤: 測った値、緑: 補正値を引いた後、金の破線: 60 秒の平均）","start",10.5,"ink",true));
    s.push(P.axes({xl:"時間 [s]",yl:"誤差 [ns]",xt:[0,20,40,60,80,100,120],xfmt:function(v){return String(v);},yfmt:function(v){return U.sig(v,3);},ny:4,sz:9}));
    s.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",1));
    [o.tq/2,-o.tq/2].forEach(function(v){s.push(S.L(P.x,P.Y(v),P.x+P.w,P.Y(v),"faint",0.8,"3 3"));});
    var lim=P.yr[1],dots=[];
    function clampy(v){return Math.max(-lim,Math.min(lim,v));}
    for(var i=0;i<N;i++){dots.push(S.D(P.X(i),P.Y(clampy(Dt.raw[i])),"alias",o.cor?1.4:2));if(o.cor)dots.push(S.D(P.X(i),P.Y(clampy(Dt.corr[i])),"green",1.9));}
    s.push(dots.join(""));
    var src=o.cor?Dt.corr:Dt.raw,avg=[];for(var j=59;j<N;j++){var a=0;for(var jj=j-59;jj<=j;jj++)a+=src[jj];avg.push([j,a/60]);}
    s.push(P.line(avg,"gold",1.8,"5 3"));
    if(cur!=null){s.push(S.L(P.X(k),P.y,P.X(k),P.y+P.h,"signal",1.2));s.push(S.CIRC(P.X(k),P.Y(clampy(Dt.raw[k])),5,"signal",1.6));}
    box.set(S.svg(Wd,P.y+P.h+40,s));
    /* 読み出し */
    function rms(a){var s2=0;a.forEach(function(v){s2+=v*v;});return Math.sqrt(s2/a.length);}
    var per=o.nu<1e-9?Infinity:(o.nu<0.5?1/o.nu:1/(1-o.nu));
    var h="1 秒の刻みの数 "+_w14_g(o.f*1e6)+" × (1 + "+_w14_f(o.r,4)+" × 10<sup>−6</sup>) = "+_w14_g(o.f*1e6)+" + "+_w14_f(o.nf,4)+"、端数 ν = <b>"+_w14_f(o.nu,4)+"</b>。";
    h+=o.nu<0.5?" 誤差は 1 秒に νT<sub>q</sub> = "+_w14_f(o.nu*o.tq,2)+" ns ずつ減り、":" 誤差は 1 秒に (1 − ν)T<sub>q</sub> = "+_w14_f((1-o.nu)*o.tq,2)+" ns ずつ増え、";
    h+=isFinite(per)&&per<1e5?"<b>"+_w14_f(per,1)+" s</b> ごとに反対の端へ跳ぶ"+(Math.abs(o.nu-0.5)<0.05?"（ν が 1/2 に近いので、1 秒ごとに正と負を行き来する）":""):"同じ値にとどまる";
    h+="<br>2 乗平均の平方根: 測った値 <b>"+_w14_f(rms(Dt.raw),1)+" ns</b>"+(o.cor?"、補正値を引いた後 <b>"+_w14_f(rms(Dt.corr),1)+" ns</b>":"（「補正値を引く」で比べられる）")+"。60 秒の平均（最後）"+_w14_f(avg[avg.length-1][1],2)+" ns";
    if(o.cor&&o.dc>=100)h+="。<span class=\"warn\">捕獲の刻み 100 ns が鋸歯状の誤差より大きいので、補正値を引いても、ほとんど小さくならない</span>";
    else if(o.cor&&o.sig<=3)h+="。<span class=\"ok\">鋸歯状の誤差が消えた</span>";
    if(!o.cor&&per>200)h+="。<span class=\"warn\">ν が 0 に近く、平均しても誤差が消えない</span>";
    h=h.replace(/ν/g,"<i style=\"font-family:serif\">ν</i>");
    ro.innerHTML=h+'<div class="wnote">本文 4 節の式で計算した（受信機は秒の頭にいちばん近い刻みでパルスを出し、初めの端数は 0.3 とした）。解の誤差は正規分布、捕獲の刻みの誤差は ±刻み/2 の一様分布の乱数（半カウントの一定のずれは引いた後）。補正値の形式・単位・符号は製品による。</div>';
  }
  run();
};

/* ===== 15 章 組み込みでの実装 — 受信・解析・状態の管理 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w15_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w15_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
function _w15_g(v){var s=String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g," ");return (v<0?"−":"")+s;}
var _W15_SC=["alias","muted","gold","signal","purple","teal","green"];   /* 測位の状態の色（図と同じ） */
var _W15_SN=["文なし","測位なし","2D","3D","補正つき","RTK フロート","RTK フィックス"];
var _W15_WC=["green","muted","gold","gold","alias"];
var _W15_WN=["使う","状態が足りない","衛星の数","HDOP","飛び"];
var _W15_WS=["●","状","衛","H","飛"];

/* ---- 12 章の解析と、この章の組・状態機械・判断（本文の C と、図の Python と同じ手順） ---- */
function _w15_ck(b){var x=0;for(var i=0;i<b.length;i++)x^=b.charCodeAt(i);return x;}
function _w15_hex2(v){return (v<16?"0":"")+v.toString(16).toUpperCase();}
function _w15_sent(b){return "$"+b+"*"+_w15_hex2(_w15_ck(b));}
function _w15_feed(st,c){   /* st = [状態, 中身, 和, 届いた値]。12 章の nmea_feed */
  if(c==="$"){var res=st[0]===0?"NONE":"ERR_CUT";st[0]=1;st[1]="";st[2]=0;return res;}
  var o=c.charCodeAt(0),hv=/^[0-9a-fA-F]$/.test(c)?parseInt(c,16):-1;
  if(st[0]===0)return "NONE";
  if(st[0]===1){if(c==="*"){st[0]=2;return "NONE";}
    if(o>=0x20&&o<=0x7E){if(st[1].length>=76){st[0]=0;return "ERR_LONG";}st[1]+=c;st[2]^=o;return "NONE";}}
  else if(st[0]===2){if(hv>=0){st[3]=hv<<4;st[0]=3;return "NONE";}}
  else if(st[0]===3){if(hv>=0){st[3]|=hv;st[0]=4;return "NONE";}}
  else if(st[0]===4){if(c==="\r")return "NONE";if(c==="\n"){st[0]=0;return st[3]===st[2]?"OK":"ERR_SUM";}}
  st[0]=0;return "ERR_FORM";}
function _w15_tms(s){if(s.length<6||!/^\d{6}/.test(s))return -1;var h=+s.slice(0,2),mi=+s.slice(2,4),se=+s.slice(4,6),r=s.slice(6),ms=0,w=100;
  if(r.charAt(0)==="."){for(var i=1;i<r.length;i++){var ch=r.charAt(i);if(!/\d/.test(ch))return -1;ms+=(+ch)*w;w=Math.floor(w/10);}}else if(r)return -1;
  if(h>23||mi>59||se>60)return -1;return ((h*60+mi)*60+se)*1000+ms;}
function _w15_dm(s,hemi,maxdeg){var i=0,ip=0,nd=0;while(i<s.length&&/\d/.test(s.charAt(i))){nd++;if(nd>5)return null;ip=ip*10+(+s.charAt(i));i++;}
  if(nd<3)return null;var deg=Math.floor(ip/100);if(deg>maxdeg||ip%100>=60)return null;if(s.charAt(i)===".")i++;
  var m6=0;for(var k=0;k<6;k++){m6*=10;if(i<s.length&&/\d/.test(s.charAt(i))){m6+=+s.charAt(i);i++;}}
  while(i<s.length&&/\d/.test(s.charAt(i)))i++;if(i!==s.length)return null;
  m6+=(ip%100)*1000000;var v=deg*10000000+Math.floor((m6+3)/6);if(v>maxdeg*10000000)return null;
  if(hemi==="S"||hemi==="W")v=-v;else if(hemi!=="N"&&hemi!=="E")return null;return v;}
function _w15_fix(s,dec){if(s===""||s==="-"||s==="."||s==="-.")return null;var neg=s.charAt(0)==="-",t=neg?s.slice(1):s;
  if((t.match(/\./g)||[]).length>1||!/^\d*\.?\d*$/.test(t)||!/\d/.test(t))return null;var p=t.split("."),a=p[0]||"0",b=((p[1]||"")+"0000000000").slice(0,dec);
  var v=parseInt(a+b,10);return neg?-v:v;}
function _w15_gga(b){var f=b.split(",");if(f.length<15||f[0].length!==5||f[0].slice(2)!=="GGA")return null;
  var lat=_w15_dm(f[2],f[3].charAt(0),90),lon=_w15_dm(f[4],f[5].charAt(0),180),q=_w15_fix(f[6],0),ns=_w15_fix(f[7],0),hd=_w15_fix(f[8],2);
  return {t:_w15_tms(f[1]),q:q||0,ns:ns||0,pos:lat!==null&&lon!==null,lat:lat,lon:lon,hdop:hd===null?-1:hd};}
function _w15_rmc(b){var f=b.split(",");if(f.length<10||f[0].length!==5||f[0].slice(2)!=="RMC")return null;
  var d=f[9].length===6?_w15_fix(f[9],0):null;return {t:_w15_tms(f[1]),st:f[2].charAt(0),date:d===null?-1:d};}
function _w15_kind(g,st){if(st!=="A"||!g.pos)return 1;return ({1:g.ns>=4?3:2,2:4,5:5,4:6})[g.q]||1;}

/* 状態機械と判断（3 節）。o は時刻 now [ms] を持つ */
function _w15_sm(){return {st:0,cand:0,ncand:0,t_fix:0,t_ok:0,ref:{ok:0,nj:0,lat:0,lon:0,t:0}};}
function _w15_fixEpoch(s,k,now){if(k>=2)s.t_fix=now;
  if(k<s.st){s.st=k;s.ncand=0;}else if(k>s.st){s.cand=(s.ncand===0||k<s.cand)?k:s.cand;s.ncand++;if(s.ncand>=3){s.st=s.cand;s.ncand=0;}}else s.ncand=0;}
function _w15_fixTick(s,now){if(now-s.t_ok>3000){s.st=0;s.ncand=0;}else if(s.st>=2&&now-s.t_fix>2500){s.st=1;s.ncand=0;}}
function _w15_judge(s,g,now){if(s.st<3)return 1;if(g.ns<5)return 2;if(g.hdop<0||g.hdop>200)return 3;var r=s.ref;
  if(r.ok){var dn=(g.lat-r.lat)*0.0111195,de=(g.lon-r.lon)*0.0111195*Math.cos(g.lat*1.745329e-9),lim=50*(now-r.t)/1000+30;
    if(dn*dn+de*de>lim*lim){r.nj++;if(r.nj<3)return 4;}}
  r.ok=1;r.nj=0;r.lat=g.lat;r.lon=g.lon;r.t=now;return 0;}

/* ---- 記録の列（図の _f15_record と同じ）: 12 章の例の文、東へ 10 m/s、9600 bit/s・1 Hz ---- */
var _W15_T0=1000,_W15_TC=120,_W15_N=60;
var _W15_GSA="GPGSA,A,3,02,03,05,06,09,13,16,22,,,,,1.61,0.95,1.30";
var _W15_GSV1="GPGSV,2,1,08,02,41,316,47,03,26,125,45,05,09,269,41,06,52,045,48";
var _W15_GSV2="GPGSV,2,2,08,09,75,187,50,13,21,068,44,16,04,171,40,22,46,235,48";
var _W15_FAULTS=[["bad",5,"GGA の 1 文字が化けた"],["normc",8,"RMC が抜けた"],["cut",11,"GSV の途中の 10 バイトが抜けた"],
  ["gap",14,"1 秒分の文が全部抜けた"],["swap",17,"GGA の緯度の 2 文字が入れ替わった"],["city",20,"ビル街（HDOP 2.6・衛星 4）"],
  ["nopps",25,"パルスが 1 つ抜けた"],["tunnel",26,"トンネル（品質 0）"],["stop",40,"文が 5 秒止まった"],["dgnss",50,"補正つき（品質 2）"]];
function _w15_hms(k){var s=34070+k;function p(v){return (v<10?"0":"")+v;}return p(Math.floor(s/3600))+p(Math.floor(s/60)%60)+p(s%60);}
function _w15_pad(v,w,d){var s=v.toFixed(d);while(s.length<w)s="0"+s;return s;}
function _w15_epochSents(k,on){var t=_w15_hms(k);
  var lon="139"+_w15_pad(46.02+10.0/(111194.9/60.0*Math.cos(35.681*Math.PI/180))*k,8,5);
  if(on.tunnel&&k>=26&&k<=30)return [["GGA","GPGGA,"+t+".00,,,,,0,00,99.99,,,,,,"],["RMC","GPRMC,"+t+".00,V,,,,,,,111126,,,N"],
    ["GSA","GPGSA,A,1,,,,,,,,,,,,,99.99,99.99,99.99"],["GSV","GPGSV,1,1,00"],["VTG","GPVTG,,T,,M,,N,,K,N"],["GLL","GPGLL,,,,,"+t+".00,V,N"]];
  var q="1",ns="08",hd="0.95",gsa=_W15_GSA,md="A",dg=",";
  if(on.city&&(k===20||k===21)){ns="06";hd="2.60";gsa="GPGSA,A,3,02,03,06,09,16,22,,,,,,,3.10,2.60,1.70";}
  if(on.city&&(k===22||k===23)){ns="04";hd="3.50";gsa="GPGSA,A,3,02,06,09,22,,,,,,,,,4.90,3.50,3.40";}
  if(on.dgnss&&k>=50&&k<=53){q="2";md="D";dg="1.0,0000";}
  var lat=(on.swap&&k===17)?"3504.86000":"3540.86000";
  return [["GGA","GPGGA,"+t+".00,"+lat+",N,"+lon+",E,"+q+","+ns+","+hd+",3.3,M,36.7,M,"+dg],
    ["RMC","GPRMC,"+t+".00,A,3540.86000,N,"+lon+",E,19.438,90.0,111126,,,"+md],["GSA",gsa],["GSV",_W15_GSV1],["GSV",_W15_GSV2],
    ["VTG","GPVTG,90.0,T,,M,19.438,N,36.000,K,"+md],["GLL","GPGLL,3540.86000,N,"+lon+",E,"+t+".00,A,"+md]];}
function _w15_record(on){var out=[];
  for(var k=0;k<_W15_N;k++){var t0=_W15_T0+1000*k,nopps=(on.nopps&&k===25)||(on.tunnel&&k>=26&&k<=30);
    if(!nopps)out.push([t0,"PPS",k,""]);
    if((on.gap&&k===14)||(on.stop&&k>=40&&k<=44))continue;
    var cum=0,ss=_w15_epochSents(k,on);
    for(var j=0;j<ss.length;j++){var s=_w15_sent(ss[j][1]),mark="";cum+=s.length+2;var tt=t0+_W15_TC+Math.round(cum*10.0/9600*1000);
      if(on.bad&&k===5&&ss[j][0]==="GGA"){s=s.replace("3540.86000","3540.85000");mark="bad";}
      if(on.normc&&k===8&&ss[j][0]==="RMC")continue;
      if(on.cut&&k===11&&s.indexOf("$GPGSV,2,1")===0){s=s.slice(0,20)+s.slice(30);mark="cut";}
      if(on.swap&&k===17&&ss[j][0]==="GGA")mark="swap";
      out.push([tt,s,k,mark]);}}
  return out;}

/* 記録を流す（6 節の replay と同じ: 1 ms ずつ進め、10 ms ごとに主のループ） */
function _w15_run(rec,tail){var S={ring:[],rx:[0,"",0,0],n_bad:0,n_part:0,n_gap:0,ep:{t:-1,have:0,g:null,r:null},sm:_w15_sm(),
    pps_cap:0,pps_n:0,ep_n:0,n_nolabel:0,late:0,labels:[],out:[],hist:[],lines:[],now:0};
  function epochDone(){var e=S.ep;_w15_fixEpoch(S.sm,_w15_kind(e.g,e.r.st),S.now);var w=_w15_judge(S.sm,e.g,S.now);
    S.out.push({t:e.t,st:S.sm.st,why:w,rx:S.now,g:e.g,r:e.r,kind:_w15_kind(e.g,e.r.st)});
    if(e.t%1000===0&&S.sm.st>=2&&e.r.date>=0){var n=S.pps_n,cap=S.pps_cap,k=n-S.ep_n;S.ep_n=n;
      if(k===1&&S.now*10000-cap>=5000000)S.late=1;if(k!==1||S.late)S.n_nolabel++;else S.labels.push([cap,e.t]);}}
  function epochFeed(b){var ty=(b.length>5&&b.charAt(5)===",")?b.slice(2,5):"",t,bit,g,r;
    if(ty==="GGA"){g=_w15_gga(b);if(!g)return;t=g.t;bit=1;}else if(ty==="RMC"){r=_w15_rmc(b);if(!r)return;t=r.t;bit=2;}else return;
    if(t<0)return;var e=S.ep;
    if(t!==e.t){if(e.t>=0){var d=t-e.t;if(e.have!==3)S.n_part++;if(d!==1000&&d!==1000-86400000)S.n_gap++;}e.t=t;e.have=0;}
    if(e.have&bit)return;if(bit===1)e.g=g;else e.r=r;e.have|=bit;if(e.have===3)epochDone();}
  function poll(){while(S.ring.length){var c=S.ring.shift(),res=_w15_feed(S.rx,c);
      if(res==="OK"){S.sm.t_ok=S.now;if(S.sm.st===0)S.sm.st=1;S.lines.push([S.now,"OK"]);epochFeed(S.rx[1]);}
      else if(res!=="NONE"){S.n_bad++;S.lines.push([S.now,res]);}}
    _w15_fixTick(S.sm,S.now);}
  var all=rec.concat([[null,null]]);
  for(var i=0;i<all.length;i++){var t=all[i][0],s=all[i][1],stop=t!==null?t:S.now+(tail||6000);
    while(S.now<stop){S.now++;if(S.now%10===0){poll();if(S.now%100===0)S.hist.push([S.now,S.sm.st]);}}
    if(t===null)break;
    if(s==="PPS"){S.pps_cap=S.now*10000;S.pps_n++;}
    else{var str=s+"\r\n";for(var j=0;j<str.length;j++)S.ring.push(str.charAt(j));}}
  return S;}

/* ---- 2 節: リングバッファの埋まり方（図の _f15_fillsim と同じ計算。大きさの上限で捨てる） ---- */
var _W15_SETS=[{nm:"10 章の例（GPS と GLONASS・11 文・626 B）",nb:626},{nm:"12 章の例（GPS だけ・7 文・426 B）",nb:426},{nm:"GGA と RMC だけ（141 B）",nb:141}];
function _w15_ntp(tp,nb,tu,rb){var tpb=Math.round(tp*rb),tub=Math.round(tu*rb),k=Math.floor(tpb/tub);return k*nb+Math.min(nb,Math.ceil((tpb-k*tub)/10));}
function _w15_fill(rb,rate,tp,secs,nb,cap){
  var tu=Math.round(rb/rate),tc=Math.round(rb*12/100),tpb=Math.max(1,Math.round(tp*rb)),end=Math.round(secs*rb);
  var ev=[[0,0,0,0]],q=0,head=0,tail=0,m=0,bi=0,start=tc,busy=0,nxt=tc+10,nread=tc+9,mx=0,drop=0,first=null,bursts=[],reads=[],drops=[];
  bursts.push([tc/rb,null]);
  while(true){var t=Math.min(nxt,nread);if(t>end)break;
    if(t===nxt){if(q>=cap){drop++;if(first===null)first=t/rb;if(drops.length<400)drops.push(t/rb);}else{q++;head++;}if(q>mx)mx=q;ev.push([t/rb,q,head,tail]);
      bi++;if(bi===nb){busy=nxt;bi=0;m++;bursts[bursts.length-1][1]=nxt/rb;start=Math.max(m*tu+tc,busy);nxt=start+10;bursts.push([start/rb,null]);}else nxt+=10;}
    if(t===nread){ev.push([t/rb,q,head,tail]);tail+=q;q=0;ev.push([t/rb,0,head,tail]);reads.push(t/rb);nread+=tpb;}}
  if(bursts[bursts.length-1][1]===null)bursts[bursts.length-1][1]=Math.min(secs,bursts[bursts.length-1][0]+nb*10/rb);
  ev.push([secs,q,head,tail]);
  return {ev:ev,max:mx,drop:drop,first:first,bursts:bursts.filter(function(b){return b[0]<secs;}),reads:reads,drops:drops};}
function _w15_at(ev,t){var lo=0,hi=ev.length-1;while(lo<hi){var mid=(lo+hi+1)>>1;if(ev[mid][0]<=t)lo=mid;else hi=mid-1;}return ev[lo];}

REG.w15_ring=function(el,U){
  var S=U.S;
  U.head(el,"RING BUFFER","リングバッファの埋まり方 — 処理の遅れの間に届くバイトと、あふれる時刻");
  var r1=U.ctrls(el);
  var set=U.select(r1,"1 回に出す文",_W15_SETS.map(function(s){return s.nm;}),0,function(){stop();run();});
  var bd=U.slider(r1,"通信の速さ",{values:[4800,9600,19200,38400,57600,115200],value:9600,fmt:function(v){return _w15_g(v)+" bit/s";},onInput:function(){stop();run();}});
  var rt=U.slider(r1,"更新レート",{values:[1,2,5,10],value:1,fmt:function(v){return v+" Hz";},onInput:function(){stop();run();}});
  var r2=U.ctrls(el);
  var tp=U.slider(r2,"処理の遅れ t<sub>p</sub>（読む間隔）",{min:0.01,max:2,log:true,value:0.3,snap:function(v){return v<0.1?+v.toFixed(3):+v.toFixed(2);},fmt:function(v){return _w15_f(v,v<0.1?3:2)+" s";},onInput:function(){stop();run();}});
  var cs=U.slider(r2,"リングバッファの大きさ",{values:[64,128,256,512,1024,2048,4096,8192],value:512,fmt:function(v){return _w15_g(v)+" B";},onInput:function(){stop();run();}});
  var br=U.btnrow(el),cur=null,R=null,win=2.2;
  var tk=U.ticker(function(){cur+=win/120;if(cur>=win){cur=null;tk.stop();}draw();},50);
  function setAll(s,b,r,t,c){set.set(s);bd.set(b);rt.set(r);tp.set(t);cs.set(c);stop();run();}
  U.button(br,"本文の例（9600 bit/s・1 Hz・0.3 s・512 B）",function(){setAll(0,9600,1,0.3,512);});
  U.button(br,"256 B では足りない",function(){setAll(0,9600,1,0.3,256);});
  U.button(br,"更新レートを上げた例（115 200・5 Hz・1024 B）",function(){setAll(0,115200,5,0.3,1024);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){stop();draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function stop(){tk.stop();cur=null;}
  function run(){var rb=bd.get(),rate=rt.get(),t=tp.get(),nb=_W15_SETS[set.get()].nb;
    win=rate<=2?2.2:1.45;win=Math.min(6,Math.max(win,3*t+0.15));
    R=_w15_fill(rb,rate,t,win,nb,cs.get());R.inf=_w15_fill(rb,rate,t,win,nb,1e9);draw();}
  function draw(){
    var nar=_w15_nar(box),Wd=nar?400:700,o=[],rb=bd.get(),rate=rt.get(),t=tp.get(),cap=cs.get(),nb=_W15_SETS[set.get()].nb;
    var now=cur==null?win:cur,a=_w15_at(R.ev,now),used=a[1],head=a[2],tail=a[3];
    /* (a) 輪 */
    var cx=nar?200:124,cy=nar?100:128,Ro=nar?66:80,Ri=nar?44:56,nseg=48;
    o.push(S.T(nar?8:14,16,"(a) リングバッファ（"+nseg+" 区画）","start",10.5,"ink",true));
    for(var i=0;i<nseg;i++){var a0=-Math.PI/2+2*Math.PI*i/nseg,a1=-Math.PI/2+2*Math.PI*(i+1)/nseg,lo=i*cap/nseg,hi=(i+1)*cap/nseg;
      var hp=head%cap,tp0=tail%cap,full=false;
      if(used>=cap)full=true;else if(used>0){var mid=(lo+hi)/2;full=tp0<=hp?(mid>=tp0&&mid<hp):(mid>=tp0||mid<hp);}
      var p=[[cx+Ro*Math.cos(a0),cy+Ro*Math.sin(a0)],[cx+Ro*Math.cos(a1),cy+Ro*Math.sin(a1)],[cx+Ri*Math.cos(a1),cy+Ri*Math.sin(a1)],[cx+Ri*Math.cos(a0),cy+Ri*Math.sin(a0)]];
      o.push(S.PL(p,"teal",0.6,full?U.soft("teal"):"var(--screen)"));}
    function mark(idx,lab,c,out){var an=-Math.PI/2+2*Math.PI*((idx%cap)/cap),r0=out?Ro+2:Ri-2,r1=out?Ro+16:Ri-12,rl=out?Ro+26:Ri-22;
      o.push(S.ARR(cx+r1*Math.cos(an),cy+r1*Math.sin(an),cx+r0*Math.cos(an),cy+r0*Math.sin(an),c,1.6,6));
      o.push(S.T(cx+rl*Math.cos(an),cy+rl*Math.sin(an)+4,lab,"middle",9,c,true,true,null,true));}
    mark(head,"head","gold",true);mark(tail,"tail","signal",false);
    /* 入っている数: 狭い幅では輪の左に置き、輪の中を tail の名前に空ける */
    var qx=nar?cx-Ro-58:cx,qy=nar?cy:cy-6;
    o.push(S.T(qx,qy+2,_w15_g(used)+" B","middle",13,used>=cap?"alias":"teal",true));
    o.push(S.T(qx,qy+16,"入っている","middle",9,"muted"));
    /* (b) 時間の変化 */
    var px=nar?56:292,py=nar?248:52,pw=nar?330:392,ph=nar?140:168;
    var ymax=Math.max(cap,R.inf.max)*1.12,P=U.plot(px,py,pw,ph,[0,win],[0,ymax]);
    o.push(S.T(nar?8:px-40,py-30,"(b) 入っているバイトの数の時間の変化","start",10.5,"ink",true));
    R.bursts.forEach(function(b){o.push(S.RECT(P.X(b[0]),py-20,Math.max(1,P.X(Math.min(b[1],win))-P.X(b[0])),9,1,U.soft("gold"),"gold",0.8));});
    R.reads.forEach(function(r){if(r<=win)o.push(S.PL([[P.X(r),py-4],[P.X(r)-3,py-10],[P.X(r)+3,py-10]],"signal",1,"signal"));});
    o.push(P.axes({xl:"時間 t [s]",yl:"量 [B]",sz:9,ny:4,xfmt:function(v){return U.sig(v,3);}}));
    var pts=[];R.ev.forEach(function(e){if(e[0]<=now)pts.push([e[0],e[1]]);});pts.push([now,used]);
    var pinf=[];R.inf.ev.forEach(function(e){if(e[0]<=now)pinf.push([e[0],e[1]]);});
    if(R.drop>0)o.push(P.clip(pinf,"alias",1,"3 3"));
    o.push(P.clip(pts,"teal",1.5));
    var cc=R.drop>0?"alias":"green";
    o.push(S.L(P.x,P.Y(cap),P.x+P.w,P.Y(cap),cc,1.3,"5 3"));
    o.push(S.T(P.x+P.w-2,P.Y(cap)-4,"大きさ "+_w15_g(cap)+" B","end",9,cc,true,false,null,true));
    if(R.first!==null&&R.first<=now){o.push(S.X(P.X(R.first),P.Y(cap),5,"alias",2));o.push(S.T(P.X(R.first)+6,P.Y(cap)+14,"あふれる "+_w15_f(R.first,3)+" s","start",9,"alias",true,false,null,true));}
    if(cur!=null)o.push(S.L(P.X(now),py-20,P.X(now),py+ph,"signal",1.2));
    if(nar){o.push(S.T(8,py+ph+44,"▼ 主のループが読む（最初は 1 回分の最初のバイトが入る直前）","start",8.5,"muted"));
      o.push(S.T(8,py+ph+58,"■ モジュールが文を送っている時間","start",8.5,"muted"));}
    else o.push(S.T(px-40,py+ph+44,"▼ 主のループが読む（最初は 1 回分の最初のバイトが入る直前）　■ モジュールが文を送っている時間","start",8.5,"muted"));
    box.set(S.svg(Wd,(nar?py+ph+66:py+ph+52),o));
    /* 読み出し */
    var tu=1/rate,ttx=nb*10/rb,load=ttx/tu,h="";
    h+="1 回分 <b>"+nb+" B</b> を <b>"+_w15_f(ttx,3)+" s</b> で受ける（更新の間隔 "+_w15_f(tu,2)+" s、負荷率 <b>"+_w15_f(load*100,0)+" %</b>）<br>";
    if(load<=1){var tpb=Math.round(t*rb),tub=Math.round(tu*rb),k=Math.floor(tpb/tub),tr=(tpb-k*tub)/rb,n=_w15_ntp(t,nb,tu,rb),p2=1;while(p2<n)p2*=2;
      h+="2 節の式: k = "+k+"、t<sub>r</sub> = "+_w15_f(tr,3)+" s → <b>n(t<sub>p</sub>) = "+_w15_g(n)+" B</b>、要る大きさ（2 のべき乗）<b>"+_w15_g(p2)+" B</b><br>";}
    else h+="<span class=\"warn\">負荷率が 100 % を超え、モジュールは送り切れない（13 章 3 節）。文は休みなく届くので、2 節の式は使えない</span><br>";
    h+="バイトごとの計算: 最大の埋まり <b>"+_w15_g(R.max)+" B</b>"+(R.drop>0?"、<span class=\"warn\">捨てたバイト "+_w15_g(R.drop)+" B（最初は "+_w15_f(R.first,3)+" s）</span>":"、<span class=\"ok\">捨てたバイト 0（足りる）</span>")+"（"+_w15_f(win,2)+" s の間）";
    ro.innerHTML=h+'<div class="wnote">主のループは、1 回分の最初のバイトがリングバッファに入る直前に読み、その後 t<sub>p</sub> ごとに読むとした（最も悪い位相）。1 バイトは 10 ビット（8N1）。文はパルスの 0.12 s 後から、前の回を送り終えるまで待って順に送る。満杯のときは新しいバイトを捨てる（赤い点線は、捨てずにためた場合）。</div>';
  }
  run();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 3 節: 状態機械（本文の fix_epoch・fix_tick・fix_judge と同じ規則）。モジュールの出し方は例のモデル ---- */
/* 本文の例（図 e15_judge と同じ筋書き）: 秒ごとの [品質, 衛星の数, HDOP, RMC の状態, 66.6 km の飛び] か null（文が来ない） */
function _w15_scn(k){if(k<=4)return [1,9,0.90,"A",false];if(k<=10)return [k===6?5:4,9,0.90,"A",false];if(k<=12)return [1,4,2.80,"A",false];
  if(k<=17)return [0,0,99.99,"V",false];if(k<=20)return [1,8,1.10,"A",false];if(k<=23)return null;return [1,8,1.00,"A",k===27];}
/* 例のモデル: 衛星の数・HDOP・補正の種類・補正の情報の古さ → モジュールが出す [品質, 衛星の数, HDOP, 状態] */
function _w15_module(ns,hd,corr,age){if(ns<=2)return [0,0,99.99,"V"];if(ns===3)return [1,3,hd,"A"];
  if(corr===1)return [age<=30?2:1,ns,hd,"A"];if(corr===2)return [(age<=5&&ns>=6)?4:(age<=30?5:1),ns,hd,"A"];return [1,ns,hd,"A"];}
REG.w15_state=function(el,U){
  var S=U.S;
  U.head(el,"FIX STATE MACHINE","測位の状態の状態機械 — 組の値を時間とともに変えると、どの状態にいて、位置を使うか");
  var r1=U.ctrls(el);
  var ns=U.slider(r1,"衛星の数",{min:0,max:14,step:1,value:9,fmt:function(v){return v+" 機";}});
  var hd=U.slider(r1,"HDOP",{min:0.5,max:6,step:0.1,value:0.9,fmt:function(v){return _w15_f(v,1);}});
  var r2=U.ctrls(el);
  var co=U.select(r2,"補正",["なし（単独）","DGNSS・SBAS（16 章）","RTK（17 章）"],0);
  var ag=U.slider(r2,"補正の情報の古さ",{min:0,max:60,step:1,value:1,fmt:function(v){return v+" s";}});
  var r3=U.ctrls(el);
  var fl=U.checkbox(r3,"文が届く",true);
  var gr=U.checkbox(r3,"補正が途切れる（古さが 1 秒ごとに増える）",false);
  var br=U.btnrow(el),seed=0,script=false,jump=false;
  var tk=U.ticker(function(){step();if(script&&k>=30){tk.stop();script=false;}draw();},280);
  U.button(br,"本文の例（走行。図と同じ）",function(){reset();script=true;tk.start();});
  U.button(br,"再生（つまみの値で）",function(){script=false;tk.start();});
  U.button(br,"止める",function(){tk.stop();script=false;draw();});
  U.button(br,"初めから",function(){tk.stop();script=false;reset();draw();});
  U.button(br,"66.6 km の飛びを 1 回入れる",function(){jump=true;});
  var box=U.svgbox(el),ro=U.readout(el);
  var sm,k,now,H,E;
  function reset(){sm=_w15_sm();k=0;now=0;H=[];E=[];}
  /* 1 秒分を 10 ms ずつ進める: GGA は 0.20 s、RMC で組がそろうのは 0.28 s、最後の文は 0.48 s に届く（12 章の例の文・9600 bit/s） */
  function step(){var x;
    if(script){x=_w15_scn(k);if(x){ns.set(x[1]);hd.set(Math.min(6,x[2]));co.set(x[0]===4||x[0]===5?"2":"0");fl.set(true);}else fl.set(false);}
    else{if(gr.get())ag.set(Math.min(60,ag.get()+1));
      x=fl.get()?_w15_module(ns.get(),Math.round(hd.get()*100)/100,+co.get(),ag.get()).concat([jump]):null;jump=false;}
    var lat0=356810000,lon=1397670000+Math.round(k*10/(0.0111195*Math.cos(35.681*Math.PI/180)));
    for(var i=1;i<=100;i++){now=k*1000+i*10;
      if(x){if(i===20||i===48)sm.t_ok=now;
        if(i===20&&sm.st===0)sm.st=1;
        if(i===28){sm.t_ok=now;var g={q:x[0],ns:x[1],hdop:Math.round(x[2]*100),pos:x[3]==="A",lat:x[4]?lat0-6000000:lat0,lon:lon},kd=_w15_kind(g,x[3]);
          _w15_fixEpoch(sm,kd,now);var w=_w15_judge(sm,g,now);E.push({k:k,q:x[0],ns:x[1],hd:x[2],kind:kd,st:sm.st,why:w,jump:x[4]});}}
      _w15_fixTick(sm,now);if(i%10===0)H.push([now/1000,sm.st]);}
    k++;}
  function draw(){
    var nar=_w15_nar(box),Wd=nar?400:700,o=[];
    /* (a) 状態のはしご */
    var lx=nar?8:14,lw=nar?118:150,ly=nar?24:30,lh=nar?24:30,gap=nar?3:6;
    o.push(S.T(lx,16,"(a) 状態機械","start",10.5,"ink",true));
    for(var s=6;s>=0;s--){var y=ly+(6-s)*(lh+gap)+(s===0?(nar?6:10):0),on=sm.st===s;
      o.push(S.RECT(lx,y,lw,lh,lh/2.6,on?U.soft(_W15_SC[s]):"var(--panel)",_W15_SC[s],on?2.8:1));
      o.push(S.T(lx+lw/2,y+lh/2+4,_W15_SN[s],"middle",nar?9.5:10.5,_W15_SC[s],on));
      if(sm.ncand>0&&s===sm.cand)o.push(S.T(lx+lw+4,y+lh/2+4,"↑ あと "+(3-sm.ncand),"start",9,"green",true));}
    /* (b) 時間の帯 */
    var x0=nar?190:262,x1=Wd-10,span=nar?16:30,t1=Math.max(span,k),t0=t1-span;
    var X=function(t){return x0+(t-t0)/span*(x1-x0);},cw=(x1-x0)/span;
    o.push(S.T(x0,16,"(b) 組の値と判断（最近 "+span+" s）","start",10.5,"ink",true));
    var rows=nar?{q:40,ns:58,hd:76,kind:108,st:134,why:160}:{q:42,ns:62,hd:82,kind:118,st:146,why:174};
    [["q","品質"],["ns","衛星"],["hd","HDOP"],["kind","組"],["st","状態"],["why","判断"]].forEach(function(r){o.push(S.T(x0-4,rows[r[0]]+4,r[1],"end",9,"ink",true));});
    var hp=U.plot(x0,rows.hd-10,x1-x0,20,[t0,t1],[0,3.2]);
    o.push(S.L(x0,hp.Y(2),x1,hp.Y(2),"alias",0.8,"4 3"));
    E.forEach(function(e){if(e.k<t0)return;var xc=X(e.k+0.28);
      o.push(S.T(xc,rows.q+4,String(e.q),"middle",8.5,"ink",false,true));o.push(S.T(xc,rows.ns+4,String(e.ns),"middle",8.5,"ink",false,true));
      if(e.q>0)o.push(S.L(X(e.k),hp.Y(Math.min(3.2,e.hd)),X(e.k+1),hp.Y(Math.min(3.2,e.hd)),"gold",1.6));
      o.push(S.RECT(xc-cw/2+1,rows.kind-8,cw-2,15,2,U.soft(_W15_SC[e.kind]),_W15_SC[e.kind],0.9));
      o.push(S.T(xc,rows.why+4,_W15_WS[e.why],"middle",e.why?8.5:9,_W15_WC[e.why],true));});
    var seg=null;H.forEach(function(h){if(h[0]<t0)return;if(!seg||seg.st!==h[1]){if(seg)o.push(band(seg));seg={a:h[0]-0.1,b:h[0],st:h[1]};}else seg.b=h[0];});
    if(seg)o.push(band(seg));
    function band(sg){var a=Math.max(t0,sg.a),w=X(sg.b)-X(a),r=S.RECT(X(a),rows.st-9,Math.max(0.5,w),18,0,U.soft(_W15_SC[sg.st]),_W15_SC[sg.st],0.8);
      if(w>U.tw(_W15_SN[sg.st],8.5)+4)r+=S.T(X(a)+w/2,rows.st+4,_W15_SN[sg.st],"middle",8.5,_W15_SC[sg.st],true);return r;}
    for(var tt=Math.ceil(t0/5)*5;tt<=t1;tt+=5){o.push(S.L(X(tt),rows.why+12,X(tt),rows.why+16,"muted",1));o.push(S.T(X(tt),rows.why+28,String(tt),"middle",9,"muted"));}
    o.push(S.T((x0+x1)/2,rows.why+42,"時間 [s]","middle",9.5,"muted"));
    var hgt=Math.max(rows.why+50,ly+7*(lh+gap)+20);
    o.push(S.T(nar?8:14,hgt-4,"判断: ● 使う　状 3D 未満　衛 衛星の数　H HDOP　飛 飛び","start",9,"muted"));
    box.set(S.svg(Wd,hgt+4,o));
    /* 読み出し */
    var last=E.length?E[E.length-1]:null,h="時刻 <b>"+_w15_f(now/1000,1)+" s</b>　状態機械 <b style=\"color:var(--"+(_W15_SC[sm.st]==="muted"?"muted":_W15_SC[sm.st])+")\">"+_W15_SN[sm.st]+"</b>";
    if(sm.st>=2)h+="　位置の年齢 <b>"+_w15_f((now-sm.t_fix)/1000+0.28,2)+" s</b>（上限 2.5 s + 位置の遅れ）";
    else if(sm.st>=1)h+="　最後の正しい文から <b>"+_w15_f((now-sm.t_ok)/1000,1)+" s</b>（3 s で文なし）";
    if(last)h+="<br>最後の組（"+last.k+" s）: 品質 "+last.q+"・衛星 "+last.ns+"・HDOP "+_w15_f(last.hd,2)+" → 種類 "+_W15_SN[last.kind]+"、判断 "+(last.why?"<span class=\"warn\">使わない（"+_W15_WN[last.why]+"）</span>":"<span class=\"ok\">使う</span>");
    ro.innerHTML=h+'<div class="wnote">状態機械と判断は本文のコードと同じ規則（上がるのは 3 組続いてから、下がるのはすぐ、年齢 2.5 s・文なし 3 s、衛星 5 以上・HDOP 2.0 以下・飛び 50 m/s × 時間 + 30 m。どれも例の値）。モジュールの出し方は例のモデル: 衛星 2 以下は品質 0、3 は 2D、補正の情報が DGNSS・SBAS で 30 s、RTK でフィックスは 5 s（衛星 6 以上）・フロートは 30 s より古いと単独に戻る（製品と設定による）。</div>';
  }
  function scriptAll(){reset();script=true;while(k<30)step();script=false;}
  scriptAll();draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 6 節: 記録の再生による試験（本文の replay と同じ手順で、誤りを混ぜた記録を流す） ---- */
REG.w15_replay=function(el,U){
  var S=U.S;
  U.head(el,"REPLAY TEST","記録の再生による試験 — 誤りを混ぜた記録を流し、文ごとの解析と、組・状態・判断を確かめる");
  var r1=U.ctrls(el),cb=[];
  _W15_FAULTS.forEach(function(f,i){cb.push(U.checkbox(r1,(i+1)+". "+f[1]+" s: "+f[2],true,function(){stop();run();draw();}));});
  var br=U.btnrow(el),cur=null,R=null,REC=null,TEND=66;
  var tk=U.ticker(function(){cur+=0.4;if(cur>=TEND){cur=null;tk.stop();}draw();},70);
  U.button(br,"本文の例（誤りを全部）",function(){cb.forEach(function(c){c.set(true);});stop();run();draw();});
  U.button(br,"誤りなし",function(){cb.forEach(function(c){c.set(false);});stop();run();draw();});
  U.button(br,"流す",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){stop();draw();});
  var term=U.mk("div","wnote");term.style.fontFamily="var(--mono)";term.style.whiteSpace="pre";term.style.overflowX="auto";term.style.fontSize="11.5px";term.style.lineHeight="1.45";el.appendChild(term);
  var box=U.svgbox(el),ro=U.readout(el);
  function stop(){tk.stop();cur=null;}
  function run(){var on={};_W15_FAULTS.forEach(function(f,i){if(cb[i].get())on[f[0]]=true;});REC=_w15_record(on);R=_w15_run(REC);
    var j=0;REC.forEach(function(r){if(r[1]!=="PPS"){r[4]=R.lines[j]?R.lines[j][1]:"?";j++;}});}
  function draw(){
    var nar=_w15_nar(box),Wd=nar?400:700,o=[],now=cur==null?TEND:cur,nowms=_W15_T0+now*1000;
    /* 記録（流した所まで） */
    var shown=REC.filter(function(r){return r[0]<=nowms;}).slice(-8),mx=nar?30:58,tl=[];
    shown.forEach(function(r){var tm=_w15_g(r[0]).replace(/ /g,"");
      if(r[1]==="PPS"){tl.push(tm+"  ── PPS ──");return;}
      var s=r[1].length>mx?r[1].slice(0,mx-1)+"…":r[1],res=r[4],c=res==="OK"?(r[3]==="swap"?"var(--alias)":"var(--green)"):"var(--alias)";
      tl.push(tm+"  "+U.esc(s)+'  <b style="color:'+c+'">'+(res==="OK"&&r[3]==="swap"?"OK（見逃し）":res)+"</b>");});
    term.innerHTML="記録の行（時刻 [ms] と文。右は nmea_feed の結果）\n"+tl.join("\n");
    /* 時間の帯 */
    var x0=nar?54:104,x1=Wd-8,X=function(t){return x0+t/TEND*(x1-x0);},cw=X(1)-X(0);
    var rows={f:22,pps:46,ep:68,st:94,why:120};
    [["f","誤り","alias"],["pps","1PPS","green"],["ep","組","signal"],["st","状態","ink"],["why","判断","ink"]].forEach(function(r){o.push(S.T(x0-6,rows[r[0]]+4,r[1],"end",9.5,r[2],true));});
    _W15_FAULTS.forEach(function(f,i){if(!cb[i].get())return;var c=[5,8,11,14,17,21.5,24.6,28,42,51.5][i];
      o.push(S.CIRC(X(c+0.5),rows.f,7,"alias",1.2,U.soft("alias")));o.push(S.T(X(c+0.5),rows.f+3.5,String(i+1),"middle",8.5,"alias",true));});
    REC.forEach(function(r){if(r[1]==="PPS"&&r[0]<=nowms){var t=(r[0]-_W15_T0)/1000;o.push(S.L(X(t),rows.pps-6,X(t),rows.pps+5,"green",1.3));}});
    var done={};R.out.forEach(function(e){if(e.rx<=nowms)done[(e.t-34070000)/1000]=e;});
    var any={};REC.forEach(function(r){if(r[1]!=="PPS"&&r[0]<=nowms)any[r[2]]=true;});
    for(var kk=0;kk<60;kk++){if(done[kk])o.push(S.RECT(X(kk+0.15),rows.ep-6,cw*0.7,12,1,U.soft("green"),"green",0.7));
      else if(any[kk]&&(kk+1)*1000+_W15_T0<=nowms+400)o.push(S.RECT(X(kk+0.15),rows.ep-6,cw*0.7,12,1,U.soft("alias"),"alias",0.7));}
    var seg=null;R.hist.forEach(function(h){var t=(h[0]-_W15_T0)/1000;if(t<0||h[0]>nowms)return;
      if(!seg||seg.st!==h[1]){if(seg)o.push(band(seg));seg={a:t,b:t,st:h[1]};}else seg.b=t;});
    if(seg)o.push(band(seg));
    function band(sg){var w=X(sg.b+0.1)-X(sg.a),r=S.RECT(X(sg.a),rows.st-8,Math.max(0.5,w),16,0,U.soft(_W15_SC[sg.st]),_W15_SC[sg.st],0.7);
      if(w>U.tw(_W15_SN[sg.st],8.5)+4)r+=S.T(X(sg.a)+w/2,rows.st+4,_W15_SN[sg.st],"middle",8.5,_W15_SC[sg.st],true);return r;}
    R.out.forEach(function(e){if(e.rx>nowms)return;var kk=(e.t-34070000)/1000;o.push(S.T(X(kk+0.5),rows.why+4,_W15_WS[e.why],"middle",nar?7:8,_W15_WC[e.why],true));});
    if(cur!=null)o.push(S.L(X(now),10,X(now),rows.why+10,"signal",1.2));
    for(var v=0;v<=60;v+=10){o.push(S.L(X(v),rows.why+12,X(v),rows.why+16,"muted",1));o.push(S.T(X(v),rows.why+28,String(v),"middle",9,"muted"));}
    o.push(S.T((x0+x1)/2,rows.why+42,"記録の時間 [s]","middle",9.5,"muted"));
    box.set(S.svg(Wd,rows.why+50,o));
    /* 数えと、最近の組 */
    var cnt={n_bad:0,n_part:0,n_gap:0};
    if(cur==null)cnt={n_bad:R.n_bad,n_part:R.n_part,n_gap:R.n_gap};
    else{var s2=_w15_run(REC.filter(function(r){return r[0]<=nowms;}),0);cnt={n_bad:s2.n_bad,n_part:s2.n_part,n_gap:s2.n_gap};}
    var outs=R.out.filter(function(e){return e.rx<=nowms;}),lab=R.labels.filter(function(l){return l[0]/10000<=nowms;}).length;
    var h="数え: n_bad <b>"+cnt.n_bad+"</b>・n_part <b>"+cnt.n_part+"</b>・n_gap <b>"+cnt.n_gap+"</b>　渡した組 <b>"+outs.length+"</b>　1PPS の名前 <b>"+lab+"</b>"+(cur==null?"（名前を付けなかった組 "+R.n_nolabel+"）":"");
    var last=outs.slice(-5).reverse().map(function(e){var kk=(e.t-34070000)/1000;
      return [String(kk)+" s",_w15_hms(kk).replace(/(\d\d)(\d\d)(\d\d)/,"$1:$2:$3"),String(e.g.q)+"・"+e.g.ns+"・"+_w15_f(e.g.hdop/100,2),_W15_SN[e.st],e.why?"<span class=\"warn\">使わない（"+_W15_WN[e.why]+"）</span>":"<span class=\"ok\">使う</span>"];});
    ro.innerHTML=h+U.tbl(["組","時刻（UTC）","品質・衛星・HDOP","状態機械","判断"],last,["right","left","left","left","left"])+
      '<div class="wnote">本文の replay と同じく、1 ms ずつ時計を進め、10 ms ごとに主のループを回す（数えと結果は本文の C をホストで動かした値と一致する）。表は最近の 5 組。</div>';
  }
  run();draw();
  window.addEventListener("resize",function(){draw();});
};

  /* ===== 16 章 DGNSS と SBAS ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w16_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w16_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w16_s(v,d){var s=_w16_f(v,d);return (v>=0&&Math.abs(v)>=0.5*Math.pow(10,-d)?"+":"")+s;}
  var _W16_D=Math.PI/180,_W16_C=299792458,_W16_TOK=[35.681,139.767,40.0];
  /* 7 章 6 節の予算（1σ、代表値）と、この章のモデル（例の値。図の f16.py と同じ） */
  var _W16_B7=[1.5,3.5,0.4,1.0,0.5],_W16_SB=[0.5,0.7,0.4,1.0,0.5],_W16_EREF=0.3;
  var _W16_SRC=[["衛星の時計と軌道","purple"],["電離層","gold"],["対流圏","green"],["マルチパス","alias"],["受信機の雑音","teal"]];
  var _W16_M={SI:3.5,DI:1000,TI:1800,ST:0.4,DT:100,TT:3600,SS:1.5,TS:7200,SORB:1.0,RSAT:20200};
  function _w16_res(sig,d,D,tau,Tc){var x=(d/D)*(d/D)+(tau/Tc)*(tau/Tc);return sig*Math.sqrt(2*(1-Math.exp(-x)));}
  /* DGNSS の後に残る共通の誤差 [衛星の時計と軌道, 電離層, 対流圏] */
  function _w16_common(d,tau,DI){var M=_W16_M,s=Math.hypot(M.SORB*d/M.RSAT,_w16_res(M.SS,0,1,tau,M.TS));return [s,_w16_res(M.SI,d,DI||M.DI,tau,M.TI),_w16_res(M.ST,d,M.DT,tau,M.TT)];}
  function _w16_uere(v){var s=0;v.forEach(function(x){s+=x*x;});return Math.sqrt(s);}
  /* 不規則な場（相関係数 exp(−(d/D)²)）の成分。図の _f16_modes と同じ乱数・同じ順 */
  function _w16_modes(U,seed,n){var r=U.rng(seed),o=[];for(var k=0;k<(n||120);k++){var gx=r.normal(),gy=r.normal();o.push([gx,gy,2*Math.PI*r.next()]);}return o;}
  function _w16_field(md,sig,D,x,y){var s=Math.SQRT2/D,a=sig*Math.sqrt(2/md.length),v=0;for(var k=0;k<md.length;k++)v+=Math.cos(s*(md[k][0]*x+md[k][1]*y)+md[k][2]);return a*v;}
  /* 7 章のクロブッチャー・モデル（L1 の遅れ [m]）と薄い殻（350 km） */
  var _W16_KA=[0.1118e-7,-0.7451e-8,-0.5961e-7,0.1192e-6],_W16_KP=[0.1167e6,-0.2294e6,-0.1311e6,0.1049e7],_W16_TG=14*3600-_W16_TOK[1]/15*3600;
  function _w16_klob(latd,lond,eld,azd){var phu=latd/180,lmu=lond/180,E=eld/180,A=azd*_W16_D;
    var psi=0.0137/(E+0.11)-0.022,phi=Math.max(-0.416,Math.min(0.416,phu+psi*Math.cos(A)));
    var lam=lmu+psi*Math.sin(A)/Math.cos(phi*Math.PI),phm=phi+0.064*Math.cos((lam-1.617)*Math.PI);
    var t=((4.32e4*lam+_W16_TG)%86400+86400)%86400,F=1+16*Math.pow(0.53-E,3),PER=0,AMP=0;
    for(var n=0;n<4;n++){PER+=_W16_KP[n]*Math.pow(phm,n);AMP+=_W16_KA[n]*Math.pow(phm,n);}
    PER=Math.max(PER,72000);AMP=Math.max(AMP,0);var x=2*Math.PI*(t-50400)/PER;
    return F*(Math.abs(x)<1.57?5e-9+AMP*(1-x*x/2+x*x*x*x/24):5e-9)*_W16_C;}
  var _W16_RE=6371,_W16_HI=350;
  function _w16_mI(el){var s=_W16_RE*Math.cos(el*_W16_D)/(_W16_RE+_W16_HI);return 1/Math.sqrt(1-s*s);}
  function _w16_ipp(B,L,el,az){var e=el*_W16_D,a=az*_W16_D,psi=Math.PI/2-e-Math.asin(_W16_RE*Math.cos(e)/(_W16_RE+_W16_HI));
    var b=Math.asin(Math.sin(B*_W16_D)*Math.cos(psi)+Math.cos(B*_W16_D)*Math.sin(psi)*Math.cos(a));
    return [b/_W16_D,L+Math.asin(Math.sin(psi)*Math.sin(a)/Math.cos(b))/_W16_D];}
  /* 受信機から見える GPS の衛星（時刻 0、仰角の高い順） */
  function _w16_vis(U,B,L){var rx=U.gnss.rx(B,L,40),out=[];U.gnss.constellation().forEach(function(s){if(s.sys!=="GPS")return;var ea=U.gnss.elaz(rx,U.gnss.ecef(s,0));if(ea[0]>0)out.push({nm:s.nm,el:ea[0],az:ea[1]});});
    out.sort(function(a,b){return b.el-a.el;});return out;}
  /* 色の濃さで値を描く（正は金、負は青。同じ濃さの升を 1 本の path に） */
  function _w16_heat(P,fn,xs,ys,vmax,div,nlev){nlev=nlev||6;var paths={},i,j;
    for(j=0;j<ys.length-1;j++)for(i=0;i<xs.length-1;i++){var v=fn((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2),k,key;
      if(div){k=Math.min(nlev-1,Math.floor(Math.abs(v)/vmax*nlev));key=(v>=0?"p":"n")+k;}else{k=Math.max(0,Math.min(nlev-1,Math.floor((v-vmax[0])/(vmax[1]-vmax[0])*nlev)));key="p"+k;}
      var x0=P.X(xs[i]),x1=P.X(xs[i+1]),y0=P.Y(ys[j+1]),y1=P.Y(ys[j]);
      (paths[key]=paths[key]||[]).push("M"+x0.toFixed(1)+" "+y0.toFixed(1)+"h"+(x1-x0+0.3).toFixed(1)+"v"+(y1-y0+0.3).toFixed(1)+"h"+(-(x1-x0+0.3)).toFixed(1)+"z");}
    var o=[];Object.keys(paths).forEach(function(key){var k=+key.slice(1);o.push('<path d="'+paths[key].join("")+'" fill="var(--'+(key[0]==="p"?"gold":"signal")+')" fill-opacity="'+(0.6*(k+0.5)/nlev).toFixed(3)+'" stroke="none"/>');});
    return o.join("");}
  /* 選んだ点を、ドラッグの代わりにスライダーで動かす（スマートフォン用） */
  function _w16_mover(U,row,names,labs,lim,get,set,redraw){
    var sel=U.select(row,"スライダーで動かす点",names,0,function(){sync();});
    var sx=U.slider(row,labs[0],{min:lim[0],max:lim[1],step:lim[4],value:lim[0],fmt:function(v){return _w16_f(v,lim[5])+labs[2];},onInput:function(v){var p=get(sel.get());set(sel.get(),[v,p[1]]);redraw();}});
    var sy=U.slider(row,labs[1],{min:lim[2],max:lim[3],step:lim[4],value:lim[2],fmt:function(v){return _w16_f(v,lim[5])+labs[2];},onInput:function(v){var p=get(sel.get());set(sel.get(),[p[0],v]);redraw();}});
    function sync(){var p=get(sel.get());sx.set(p[0]);sy.set(p[1]);}
    sync();return {sync:sync,sel:sel};}

  /* ---- 3 節の後: 基準局と移動局を動かして、電離層の遅れの差と基線長 ---- */
  REG.w16_common=function(el,U){
    var S=U.S;
    U.head(el,"COMMON ERRORS","基準局と移動局の距離と、電離層の遅れの差");
    var r1=U.ctrls(el);
    var sD=U.slider(r1,"相関の距離 D（電離層）",{values:[300,500,700,1000,1500,2000,3000],value:1000,fmt:function(v){return v+" km";},onInput:function(){sweep=[];draw();}});
    var sS=U.slider(r1,"モデルで直せずに残る電離層の σ",{min:1,max:6,step:0.5,value:3.5,fmt:function(v){return _w16_f(v,1)+" m";},onInput:function(){sweep=[];draw();}});
    var r2=U.ctrls(el);
    var pos=[[0,0],[100,0]],seed=1,md=null,sweep=[],drag=-1;
    var mv=_w16_mover(U,r2,["基準局","移動局"],["東西","南北"," km"],[-1000,1000,-1000,1000,5,0],function(k){return pos[k];},function(k,p){pos[k]=p;sweep=[];},function(){draw();});
    var br=U.btnrow(el);
    function place(d){var a=Math.atan2(pos[1][1]-pos[0][1],pos[1][0]-pos[0][0]);if(!isFinite(a)||Math.hypot(pos[1][0]-pos[0][0],pos[1][1]-pos[0][1])<1e-6)a=0;
      pos[1]=[Math.max(-1000,Math.min(1000,pos[0][0]+d*Math.cos(a))),Math.max(-1000,Math.min(1000,pos[0][1]+d*Math.sin(a)))];sweep=[];mv.sync();draw();}
    U.button(br,"本文の例（100 km）",function(){tick.stop();sD.set(1000);sS.set(3.5);pos=[[0,0],[100,0]];seed=1;md=null;sweep=[];mv.sync();draw();});
    U.button(br,"10 km",function(){place(10);});U.button(br,"300 km",function(){place(300);});U.button(br,"1000 km",function(){place(1000);});
    var bp=U.button(br,"移動局を遠ざける（再生）",function(){if(tick.running()){tick.stop();bp.textContent="移動局を遠ざける（再生）";return;}
      ang=Math.atan2(pos[1][1]-pos[0][1],pos[1][0]-pos[0][0]);if(Math.hypot(pos[1][0]-pos[0][0],pos[1][1]-pos[0][1])<1e-6)ang=0;dd=1;sweep=[];bp.textContent="止める";tick.start();});
    U.button(br,"別の場（乱数）",function(){seed++;md=null;sweep=[];draw();});
    var ang=0,dd=1;
    var tick=U.ticker(function(){dd*=1.06;var x=pos[0][0]+dd*Math.cos(ang),y=pos[0][1]+dd*Math.sin(ang);
      if(dd>1600||Math.abs(x)>1000||Math.abs(y)>1000){tick.stop();bp.textContent="移動局を遠ざける（再生）";return;}pos[1]=[x,y];mv.sync();draw(true);},60);
    var box=U.svgbox(el),ro=U.readout(el);
    U.ctl.drag(box,function(type,x,y){if(!geo)return false;
      if(type==="down"){var best=-1,bd=24;for(var k=1;k>=0;k--){var dx=geo.P.X(pos[k][0])-x,dy=geo.P.Y(pos[k][1])-y,dl=Math.hypot(dx,dy);if(dl<bd){bd=dl;best=k;}}
        if(best<0)return false;drag=best;tick.stop();bp.textContent="移動局を遠ざける（再生）";sweep=[];mv.sel.set(best);return true;}
      if(type==="move"&&drag>=0){pos[drag]=[Math.max(-1000,Math.min(1000,geo.P.ux(x))),Math.max(-1000,Math.min(1000,geo.P.uy(y)))];mv.sync();draw();}
      if(type==="up")drag=-1;});
    var geo=null,heatKey="",heatSvg="";
    function draw(fromTick){
      if(!md)md=_w16_modes(U,seed,120);
      var D=sD.get(),sig=sS.get(),nar=_w16_nar(box),Wd=nar?400:700,o=[];
      var f=function(x,y){return _w16_field(md,sig,D,x,y);};
      /* (a) 地図 */
      var mw=nar?300:290,P=U.plot(nar?60:58,30,mw,mw,[-1000,1000],[-1000,1000]);geo={P:P};
      var hk=seed+"|"+D+"|"+sig+"|"+nar;
      if(hk!==heatKey){var ed=[];for(var k=0;k<=32;k++)ed.push(-1000+2000*k/32);heatSvg=_w16_heat(P,f,ed,ed,8,true,6);heatKey=hk;}
      o.push(S.T(nar?10:14,16,"(a) 電離層の、モデルで直せずに残る遅れ（金: 大きい・青: 小さい）","start",nar?9.5:10.5,"ink",true));
      o.push(heatSvg);
      o.push(P.axes({xt:[-1000,-500,0,500,1000],yt:[-1000,-500,0,500,1000],grid:false,sz:9,xl:"東西 [km]",yl:"南北 [km]"}));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"none","line",1));
      var d=Math.hypot(pos[1][0]-pos[0][0],pos[1][1]-pos[0][1]),vb=f(pos[0][0],pos[0][1]),vr=f(pos[1][0],pos[1][1]),df=vr-vb;
      o.push(S.L(P.X(pos[0][0]),P.Y(pos[0][1]),P.X(pos[1][0]),P.Y(pos[1][1]),"ink",1.2,"3 3"));
      o.push(S.CIRC(P.X(pos[0][0]),P.Y(pos[0][1]),6,"purple",2.2,"var(--screen)"));
      o.push(S.D(P.X(pos[1][0]),P.Y(pos[1][1]),"green",5));
      o.push(S.T(P.X(pos[0][0]),P.Y(pos[0][1])+19,"基準局","middle",9.5,"purple",true,false,null,true));
      o.push(S.T(P.X(pos[1][0]),P.Y(pos[1][1])-10,"移動局","middle",9.5,"green",true,false,null,true));
      /* (b) 差と基線長 */
      var qx=nar?60:430,qy=nar?P.y+P.h+76:46,qw=nar?310:250,qh=nar?170:230,M=_W16_M;
      var Q=U.plot(qx,qy,qw,qh,[1,3000],[-12,12],{xlog:true});
      o.push(S.T(nar?10:qx-50,qy-14,"(b) 電離層の遅れの差（移動局 − 基準局）","start",nar?9.5:10.5,"ink",true));
      var band=[],k2;for(k2=0;k2<=80;k2++){var dv=Math.pow(10,k2/80*Math.log10(3000));band.push([dv,_w16_res(sig,dv,D,0,1)]);}
      o.push(S.PL(band.map(function(p){return [Q.X(p[0]),Q.Y(p[1])];}).concat(band.slice().reverse().map(function(p){return [Q.X(p[0]),Q.Y(-p[1])];})),"none",0,U.soft("gold"),null,1));
      o.push(Q.axes({xt:[1,10,100,1000,3000],yt:[-12,-6,0,6,12],sz:9,xl:"基線長 d [km]",yl:"差 [m]",ylOff:30}));
      o.push(Q.line(band,"gold",1.6));o.push(Q.line(band.map(function(p){return [p[0],-p[1]];}),"gold",1.6));
      o.push(S.L(Q.X(1),Q.Y(sig),Q.X(3000),Q.Y(sig),"alias",1.2,"5 3"));o.push(S.L(Q.X(1),Q.Y(-sig),Q.X(3000),Q.Y(-sig),"alias",1.2,"5 3"));
      var dx=D*Math.sqrt(Math.log(2));o.push(S.L(Q.X(dx),Q.Y(-12),Q.X(dx),Q.Y(12),"muted",1,"2 2"));
      o.push(S.T(Q.X(dx)+3,Q.Y(11)+4,_w16_f(dx,0)+" km","start",9,"muted",true,false,null,true));
      if(sweep.length>1)o.push(Q.clip(sweep,"green",1.6));
      if(fromTick)sweep.push([Math.max(1,d),df]);
      if(d>=1)o.push(S.D(Q.X(d),Q.Y(Math.max(-12,Math.min(12,df))),"green",4.5));
      o.push(S.LEGL(nar?10:qx-40,qy+qh+46,[["gold",null,"±σ_Δ（モデル）"],["alias","5 3","±σ（補正しない）"],["green",null,"この場の差"]],9,12));
      box.set(S.svg(Wd,(nar?qy+qh+60:Math.max(P.y+P.h+48,qy+qh+60)),o));
      /* 読み出し */
      var sd=_w16_res(sig,d,D,0,1),cm=_w16_common(d,5,D),rx=Math.sqrt(1+0.25+_W16_EREF*_W16_EREF*2);
      var cmS=[cm[0],sd,cm[2]],u=Math.sqrt(cmS[0]*cmS[0]+sd*sd+cmS[2]*cmS[2]+rx*rx),u7=_w16_uere([_W16_B7[0],sig,_W16_B7[2],_W16_B7[3],_W16_B7[4]]);
      var h="基線長 <b>d = "+_w16_f(d,d<10?1:0)+" km</b>。この場の値: 基準局 "+_w16_s(vb,2)+" m・移動局 "+_w16_s(vr,2)+" m・差 <b>"+_w16_s(df,2)+" m</b><br>";
      h+="モデルの差の標準偏差 σ<sub>Δ</sub>(d) = σ√(2{1 − e<sup>−(d/D)²</sup>}) = <b>"+_w16_f(sd,2)+" m</b>（σ = "+_w16_f(sig,1)+" m、D = "+D+" km）。";
      h+=(sd<sig?'<span class="ok">補正したほうが小さい</span>':'<span class="warn">補正しないほうが小さい（d が 0.83 D = '+_w16_f(dx,0)+' km を超えた）</span>')+"<br>";
      h+="同じ d で、対流圏の差 "+_w16_f(cm[2],2)+" m（D = 100 km）・衛星の軌道の差 "+_w16_f(cm[0],3)+" m 以下。受信機ごとの誤差 "+_w16_f(rx,2)+" m を合わせた UERE <b>"+_w16_f(u,2)+" m</b>（補正しない単独 "+_w16_f(u7,2)+" m。補正の年齢 5 s）";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 4 節の後: 電離層の格子の補間 ---- */
  var _W16_GSEED=38;
  REG.w16_sbas=function(el,U){
    var S=U.S;
    U.head(el,"SBAS IONOSPHERIC GRID","電離層の格子の点の値から、電波が通る点の遅れを補間する");
    var r1=U.ctrls(el),rx=[_W16_TOK[0],_W16_TOK[1]],seed=_W16_GSEED,vis=[],selName="G22",md=null,ms=null,drag=false;
    var sSat=U.select(r1,"衛星",["G22"],0,function(){selName=vis[sSat.get()]?vis[sSat.get()].nm:selName;draw();});
    var cSm=U.checkbox(r1,"細かい乱れを足す（相関の距離 150 km・0.4 m）",false,function(){heatKey="";draw();});
    var sMiss=U.select(r1,"使えない格子の点",["なし","南西","南東","北東","北西"],0,function(){draw();});
    var r2=U.ctrls(el);
    var sLat=U.slider(r2,"受信機の緯度",{min:24,max:46,step:0.1,value:rx[0],fmt:function(v){return _w16_f(v,1)+"°";},onInput:function(v){rx[0]=v;draw();}});
    var sLon=U.slider(r2,"受信機の経度",{min:124,max:150,step:0.1,value:rx[1],fmt:function(v){return _w16_f(v,1)+"°";},onInput:function(v){rx[1]=v;draw();}});
    var br=U.btnrow(el);
    U.button(br,"本文の例（東京・G22）",function(){rx=[_W16_TOK[0],_W16_TOK[1]];sLat.set(rx[0]);sLon.set(rx[1]);selName="G22";seed=_W16_GSEED;md=null;cSm.set(false);sMiss.set(0);heatKey="";draw();});
    U.button(br,"別の場（乱数）",function(){seed++;md=null;heatKey="";draw();});
    var box=U.svgbox(el),ro=U.readout(el),geo=null,heatKey="",heatSvg="";
    U.ctl.drag(box,function(type,x,y){if(!geo)return false;var P=geo.P;
      if(type==="down"){if(Math.hypot(P.X(rx[1])-x,P.Y(rx[0])-y)>24)return false;drag=true;return true;}
      if(type==="move"&&drag){rx=[Math.max(24,Math.min(46,P.uy(y))),Math.max(124,Math.min(150,P.ux(x)))];sLat.set(rx[0]);sLon.set(rx[1]);draw();}
      if(type==="up")drag=false;});
    function truth(B,L){var x=(L-137.5)*111.32*Math.cos(35*_W16_D),y=(B-35)*110.6,v=_w16_klob(B,L,90,0)+_w16_field(md,1.2,1000,x,y);
      if(cSm.get())v+=_w16_field(ms,0.4,150,x,y);return v;}
    /* 日本の周りの 500 点（緯度 25.5〜44.5°・経度 125.5〜149.5° の 1° ごと）で、補間とクロブッチャー・モデルの誤差（天頂）の RMS。本文と同じ点 */
    var rmsKey="",rmsVal=null;
    function gridRMS(){var key=seed+"|"+cSm.get();if(key===rmsKey)return rmsVal;var se=0,sk=0,n=0,cache={};
      function igp(B,L){var k=B+","+L;if(cache[k]==null)cache[k]=truth(B,L);return cache[k];}
      for(var j=0;j<20;j++)for(var i=0;i<25;i++){var B=25.5+j,L=125.5+i,B1=Math.floor(B/5)*5,L1=Math.floor(L/5)*5,xi=(L-L1)/5,ze=(B-B1)/5;
        var iv=(1-xi)*(1-ze)*igp(B1,L1)+xi*(1-ze)*igp(B1,L1+5)+xi*ze*igp(B1+5,L1+5)+(1-xi)*ze*igp(B1+5,L1),t=truth(B,L),kk=_w16_klob(B,L,90,0)-t;
        se+=(iv-t)*(iv-t);sk+=kk*kk;n++;}
      rmsKey=key;rmsVal=[Math.sqrt(se/n),Math.sqrt(sk/n)];return rmsVal;}
    function draw(){
      if(!md){md=_w16_modes(U,seed,120);ms=_w16_modes(U,seed+100,120);}
      /* 見える衛星（受信機の位置で変わる） */
      vis=_w16_vis(U,rx[0],rx[1]);var opts=sSat.input;opts.innerHTML="";var si=0;
      vis.forEach(function(q,i){var op=document.createElement("option");op.value=i;op.textContent=q.nm+"（仰角 "+_w16_f(q.el,1)+"°）";opts.appendChild(op);if(q.nm===selName)si=i;});
      sSat.set(si);var sat=vis[si];selName=sat.nm;
      var nar=_w16_nar(box),Wd=nar?400:700,o=[];
      var P=U.plot(nar?46:50,30,nar?300:300,nar?316:316,[120,155],[20,50]);geo={P:P};
      var hk=seed+"|"+cSm.get()+"|"+nar;
      if(hk!==heatKey){var xs=[],ys=[],k;for(k=120;k<=155;k++)xs.push(k);for(k=20;k<=50;k++)ys.push(k);heatSvg=_w16_heat(P,function(L,B){return truth(B,L);},xs,ys,[2.5,7.5],false,10);heatKey=hk;}
      o.push(S.T(nar?8:14,16,"(a) 格子の点（5° ごと）の天頂の遅れ [m]","start",nar?9.5:10.5,"ink",true));
      o.push(heatSvg);
      o.push(P.axes({xt:[120,125,130,135,140,145,150,155],yt:[20,25,30,35,40,45,50],grid:false,sz:9,xl:"経度 [°]",yl:"緯度 [°]",ylOff:32}));
      var L,B;for(L=120;L<=155;L+=5)o.push(S.L(P.X(L),P.Y(20),P.X(L),P.Y(50),"muted",0.6,"2 3"));for(B=20;B<=50;B+=5)o.push(S.L(P.X(120),P.Y(B),P.X(155),P.Y(B),"muted",0.6,"2 3"));
      var ip=_w16_ipp(rx[0],rx[1],sat.el,sat.az),Bp=ip[0],Lp=ip[1],inside=Bp>=20&&Bp<50&&Lp>=120&&Lp<155;
      var B1=Math.floor(Bp/5)*5,L1=Math.floor(Lp/5)*5,xi=(Lp-L1)/5,ze=(Bp-B1)/5;
      var cn=["SW","SE","NE","NW"],cc={SW:"signal",SE:"purple",NE:"green",NW:"alias"},cv={},cw={},miss=["","SW","SE","NE","NW"][sMiss.get()];
      cv.SW=truth(B1,L1);cv.SE=truth(B1,L1+5);cv.NE=truth(B1+5,L1+5);cv.NW=truth(B1+5,L1);
      if(inside)o.push(S.RECT(P.X(L1),P.Y(B1+5),P.X(L1+5)-P.X(L1),P.Y(B1)-P.Y(B1+5),0,"none","signal",2));
      for(L=120;L<=155;L+=5)for(B=20;B<=50;B+=5){var isC=inside&&(L===L1||L===L1+5)&&(B===B1||B===B1+5),isM=false;
        if(isC&&miss){var mk={SW:[L1,B1],SE:[L1+5,B1],NE:[L1+5,B1+5],NW:[L1,B1+5]}[miss];isM=(mk[0]===L&&mk[1]===B);}
        o.push(isM?S.X(P.X(L),P.Y(B),5,"alias",2.2):S.D(P.X(L),P.Y(B),"ink",isC?3.4:2.2));
        if(L<155&&B<50&&!nar)o.push(S.T(P.X(L)+3,P.Y(B)-4,_w16_f(truth(B,L),1),"start",9,"ink",isC,false,null,true));}
      o.push(S.L(P.X(rx[1]),P.Y(rx[0]),P.X(Math.max(120,Math.min(155,Lp))),P.Y(Math.max(20,Math.min(50,Bp))),"gold",1.4,"4 2"));
      if(inside)o.push(S.D(P.X(Lp),P.Y(Bp),"gold",4.5));
      o.push(S.CIRC(P.X(rx[1]),P.Y(rx[0]),6,"green",2.2,"var(--screen)"));
      o.push(S.T(P.X(rx[1])-8,P.Y(rx[0])-8,"受信機","end",9.5,"green",true,false,null,true));
      /* (b) 升の中 */
      var bx0=nar?70:420,by0=nar?P.y+P.h+86:62,SZ=nar?190:190,h="",wts=null;
      o.push(S.T(nar?8:392,nar?P.y+P.h+58:16,"(b) 升（北緯 "+B1+"〜"+(B1+5)+"°・東経 "+L1+"〜"+(L1+5)+"°）の中の補間","start",nar?9.5:10.5,"ink",true));
      if(inside){
        if(!miss)wts={SW:(1-xi)*(1-ze),SE:xi*(1-ze),NE:xi*ze,NW:(1-xi)*ze};
        else{var tri={NE:[xi+ze<=1,{SW:1-xi-ze,SE:xi,NW:ze,NE:0}],SW:[xi+ze>=1,{SE:1-ze,NE:xi+ze-1,NW:1-xi,SW:0}],SE:[ze>=xi,{SW:1-ze,NE:xi,NW:ze-xi,SE:0}],NW:[ze<=xi,{SW:1-xi,SE:xi-ze,NE:ze,NW:0}]}[miss];
          if(tri[0])wts=tri[1];}
        var px=bx0+xi*SZ,py=by0+(1-ze)*SZ;
        if(!miss){[[[bx0,py,px-bx0,by0+SZ-py],"NE"],[[px,py,bx0+SZ-px,by0+SZ-py],"NW"],[[px,by0,bx0+SZ-px,py-by0],"SW"],[[bx0,by0,px-bx0,py-by0],"SE"]].forEach(function(r){var R=r[0],k=r[1];
          o.push(S.RECT(R[0],R[1],Math.max(0,R[2]),Math.max(0,R[3]),0,U.soft(cc[k]),cc[k],0.8));
          if(R[2]>44&&R[3]>22)o.push(S.TX(R[0]+R[2]/2,R[1]+R[3]/2+4,"w_{"+k+"} "+_w16_f(wts[k],3),"middle",9.5,cc[k],true));});}
        else if(wts){var poly={NE:[[0,0],[1,0],[0,1]],SW:[[1,0],[1,1],[0,1]],SE:[[0,0],[1,1],[0,1]],NW:[[0,0],[1,0],[1,1]]}[miss];
          o.push(S.PL(poly.map(function(q){return [bx0+q[0]*SZ,by0+(1-q[1])*SZ];}),"gold",1.4,U.soft("gold"),null,1));}
        else o.push(S.T(bx0+SZ/2,by0+SZ/2,"3 点の三角形の外","middle",10,"alias",true,false,null,true));
        o.push(S.RECT(bx0,by0,SZ,SZ,0,"none","signal",2));
        var cpos={SW:[bx0,by0+SZ,"end",14],SE:[bx0+SZ,by0+SZ,"start",14],NE:[bx0+SZ,by0,"start",-6],NW:[bx0,by0,"end",-6]};
        cn.forEach(function(k){var c=cpos[k];o.push(k===miss?S.X(c[0],c[1],5,"alias",2.2):S.D(c[0],c[1],"ink",3.4));
          o.push(S.TX(c[0]+(c[2]==="end"?-6:6),c[1]+c[3],k===miss?"I_{"+k+"} 使えない":"I_{"+k+"} = "+_w16_f(cv[k],2),c[2],9.5,k===miss?"alias":cc[k],true));});
        o.push(S.D(px,py,"gold",5));
      }else o.push(S.T(bx0,by0+40,"電波が通る点が、この図の格子の外にある","start",10,"alias",true));
      box.set(S.svg(Wd,nar?by0+SZ+40:Math.max(P.y+P.h+44,by0+SZ+40),o));
      /* 読み出し */
      var m=_w16_mI(sat.el),tv=inside?truth(Bp,Lp):NaN,kl=_w16_klob(rx[0],rx[1],sat.el,sat.az);
      h="衛星 "+sat.nm+"（仰角 "+_w16_f(sat.el,1)+"°・方位角 "+_w16_f(sat.az,1)+"°）。電離層を通る点: 北緯 "+_w16_f(Bp,3)+"°・東経 "+_w16_f(Lp,3)+"°";
      if(inside)h+="（ξ = "+_w16_f(xi,3)+"、ζ = "+_w16_f(ze,3)+"）";h+="<br>";
      if(inside&&wts){var iv=0;cn.forEach(function(k){iv+=wts[k]*cv[k];});
        h+="補間した天頂の遅れ <b>"+_w16_f(iv,2)+" m</b>（本当の値 "+_w16_f(tv,2)+" m、差 "+_w16_s(iv-tv,2)+" m）"+(miss?"（3 点の補間）":"")+"<br>";
        h+="斜めの遅れ: m<sub>I</sub>("+_w16_f(sat.el,1)+"°) = "+_w16_f(m,3)+" を掛けて <b>"+_w16_f(m*iv,2)+" m</b>（本当 "+_w16_f(m*tv,2)+" m、差 "+_w16_s(m*(iv-tv),2)+" m）。";
        h+="クロブッチャー・モデルは "+_w16_f(kl,2)+" m（差 "+_w16_s(kl-m*tv,2)+" m）";}
      else if(inside)h+='<span class="warn">電波が通る点が、使える 3 つの格子の点の三角形の外にあるので、この衛星の電離層の補正は使えない</span>';
      else h+='<span class="warn">この図の格子の外（補正は SBAS の格子の範囲による）</span>';
      var rr=gridRMS();
      h+="<br>この場で、日本の周りの 500 点（1° ごと）を調べた天頂の遅れの誤差の RMS: 補間 <b>"+_w16_f(rr[0],2)+" m</b>・クロブッチャー・モデル "+_w16_f(rr[1],2)+" m";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 6 節の後: 単独・SBAS・DGNSS の位置の散らばり ---- */
  REG.w16_dgnss=function(el,U){
    var S=U.S;
    U.head(el,"DGNSS SCATTER","補正の方式・基線長・年齢と、位置の散らばり");
    var r1=U.ctrls(el);
    var mode=U.seg(r1,["単独","SBAS","DGNSS"],2,function(){draw();});
    var cLim=U.checkbox(r1,"年齢が限度（30 s。例）を超えたら補正を使わない",true,function(){draw();});
    var r2=U.ctrls(el);
    var sd=U.slider(r2,"基線長 d",{min:1,max:2000,log:true,value:10,fmt:function(v){return _w16_f(v,v<10?1:0)+" km";},onInput:function(){draw();}});
    var st=U.slider(r2,"補正の年齢 τ",{min:0,max:900,step:5,value:5,fmt:function(v){return v+" s";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var se=U.slider(r3,"基準局の座標の誤差（東へ）",{min:0,max:5,step:0.1,value:0,fmt:function(v){return _w16_f(v,1)+" m";},onInput:function(){draw();}});
    var sm=U.slider(r3,"基準局のマルチパス",{min:0,max:1.5,step:0.05,value:0.3,fmt:function(v){return _w16_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（DGNSS 10 km・5 s）",function(){mode.set(2);sd.set(10);st.set(5);se.set(0);sm.set(0.3);cLim.set(true);seed=1;draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    /* 東京の 8 つの衛星（7 章と同じ）の幾何行列と、最小二乗の行列 A = (GᵀG)⁻¹Gᵀ */
    var vis=_w16_vis(U,_W16_TOK[0],_W16_TOK[1]),Mx=U.ctl.mat;
    var G=vis.map(function(q){var e=q.el*_W16_D,a=q.az*_W16_D;return [-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e),1];});
    var H=Mx.inv(Mx.mul(Mx.T(G),G)),A=Mx.mul(H,Mx.T(G)),m=G.length,HD=Math.sqrt(H[0][0]+H[1][1]),VD=Math.sqrt(H[2][2]);
    function ell(a,b,c){var mm=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);return [Math.sqrt(mm+r),Math.sqrt(Math.max(mm-r,0)),0.5*Math.atan2(2*b,a-c)/_W16_D];}
    function pin(R,s1,s2){var n=360,sm_=0;for(var i=0;i<n;i++){var ph=2*Math.PI*(i+0.5)/n,q=Math.cos(ph)*Math.cos(ph)/(s1*s1)+Math.sin(ph)*Math.sin(ph)/(s2*s2);sm_+=(1-Math.exp(-R*R*q/2))/q;}return sm_/n/(s1*s2);}
    function rad(p,s1,s2){var lo=0,hi=10*(s1+s2);for(var i=0;i<60;i++){var mm=(lo+hi)/2;if(pin(mm,s1,s2)<p)lo=mm;else hi=mm;}return (lo+hi)/2;}
    var E1=ell(H[0][0],H[0][1],H[1][1]),KC=rad(0.5,E1[0],E1[1]),K95=rad(0.95,E1[0],E1[1]);
    function cks(s){var c=0;for(var i=0;i<s.length;i++)c^=s.charCodeAt(i);return (c<16?"0":"")+c.toString(16).toUpperCase();}
    function draw(){
      var md=mode.get(),d=sd.get(),tau=st.get(),dE=se.get(),mref=sm.get(),fall=false;
      if(md===2&&cLim.get()&&tau>30)fall=true;
      var eff=fall?0:md;
      /* 源ごとの 1σ（7 つ: 衛星・電離層・対流圏・移動局の M・移動局の ε・基準局の M・基準局の ε） */
      var sg;if(eff===0)sg=_W16_B7.concat([0,0]);else if(eff===1)sg=_W16_SB.concat([0,0]);else{var c=_w16_common(d,tau);sg=[c[0],c[1],c[2],1.0,0.5,mref,_W16_EREF];}
      var u=_w16_uere(sg),u7=_w16_uere(_W16_B7),bias=(eff===2)?dE:0;
      var nar=_w16_nar(box),Wd=nar?400:700,o=[];
      /* (a) 予算 */
      var bx=nar?132:140,bw=nar?200:190,vmax=Math.max(4,u7*1.05),cols=["purple","gold","green","alias","teal","alias","teal"],nms=["衛星の時計と軌道","電離層","対流圏","マルチパス","受信機の雑音","基準局のマルチパス","基準局の雑音"];
      o.push(S.T(nar?8:14,16,"(a) 源ごとの誤差（1σ）","start",nar?9.5:10.5,"ink",true));
      var yy=26;sg.forEach(function(v,i){if(i>=5&&eff!==2)return;var c=cols[i];o.push(S.T(bx-6,yy+11,nms[i],"end",9.5,c,true));
        o.push(S.RECT(bx,yy,Math.max(0.5,bw*v/vmax),14,2,U.soft(c),c,1,i>=5?"3 2":null));o.push(S.T(bx+bw*v/vmax+4,yy+11,_w16_f(v,2)+" m","start",9.5,c,true));yy+=20;});
      o.push(S.T(bx-6,yy+11,"UERE","end",10,"ink",true));o.push(S.RECT(bx,yy,bw*u/vmax,14,2,"ink","ink",1));o.push(S.T(bx+bw*u/vmax+4,yy+11,_w16_f(u,2)+" m","start",10,"ink",true));
      o.push(S.T(bx-6,yy+31,"単独","end",9.5,"muted",true));o.push(S.RECT(bx,yy+20,bw*u7/vmax,10,2,"none","muted",1,"3 2"));o.push(S.T(bx+bw*u7/vmax+4,yy+29,_w16_f(u7,2)+" m","start",9.5,"muted"));
      /* (b) 散らばり */
      var lim=10,px=nar?44:392,py=nar?yy+80:30,pw=nar?260:232,P=U.plot(px,py,pw,pw,[-lim,lim],[-lim,lim]);
      o.push(S.T(nar?8:px-30,py-12,"(b) 水平の位置の誤差（東西・南北 [m]）","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,3,"var(--screen)","line",1));o.push(P.axes({xt:[-10,-5,0,5,10],yt:[-10,-5,0,5,10],sz:9}));
      var rng=U.rng(seed*7919+16),N=2000,pts=[],p7=[],cin=0,c95=0,sh=0,ups=[],e3=ell(H[0][0]*u*u,H[0][1]*u*u,H[1][1]*u*u),cep=KC*u,r95=K95*u;
      for(var t=0;t<N;t++){var eta=[],e7=[];for(var i=0;i<m;i++){var n5=[];for(var k=0;k<7;k++)n5.push(rng.normal());var s1=0,s7=0;
          for(k=0;k<7;k++)s1+=sg[k]*n5[k];for(k=0;k<5;k++)s7+=_W16_B7[k]*n5[k];eta.push(s1);e7.push(s7);}
        var x=bias,y=0,up=0,x7=0,y7=0;for(var j=0;j<m;j++){x+=A[0][j]*eta[j];y+=A[1][j]*eta[j];up+=A[2][j]*eta[j];x7+=A[0][j]*e7[j];y7+=A[1][j]*e7[j];}
        var dh=Math.hypot(x-bias,y);if(dh<=cep)cin++;if(dh<=r95)c95++;sh+=dh*dh;ups.push(Math.abs(up));if(t<1200){pts.push([x,y,up]);p7.push([x7,y7]);}}
      ups.sort(function(a,b){return a-b;});var u95=ups[Math.floor(0.95*N)];
      if(eff!==0)p7.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"faint",1));});
      pts.forEach(function(q){if(Math.abs(q[0])<lim&&Math.abs(q[1])<lim)o.push(S.D(P.X(q[0]),P.Y(q[1]),"gold",1.1));});
      var ep=[],cp=[];for(var a2=0;a2<=96;a2++){var th=2*Math.PI*a2/96,ca=Math.cos(e3[2]*_W16_D),sa=Math.sin(e3[2]*_W16_D),uu=e3[0]*Math.cos(th),vv=e3[1]*Math.sin(th);ep.push([bias+uu*ca-vv*sa,uu*sa+vv*ca]);cp.push([bias+cep*Math.cos(th),cep*Math.sin(th)]);}
      o.push(P.clip(ep,"alias",1.8));o.push(P.clip(cp,"signal",1.6,"4 2"));
      o.push(S.L(P.X(0)-6,P.Y(0),P.X(0)+6,P.Y(0),"green",2));o.push(S.L(P.X(0),P.Y(0)-6,P.X(0),P.Y(0)+6,"green",2));
      /* 上下 */
      var vx=P.x+P.w+(nar?22:26),Q=U.plot(vx,py,34,pw,[0,1],[-20,20]),jr=U.rng(seed+5);
      o.push(S.RECT(vx,py,34,pw,3,"var(--screen)","line",1));o.push(S.T(vx+17,py-4,"上下","middle",9.5,"ink",true));
      [-20,0,20].forEach(function(v){o.push(S.T(vx+38,Q.Y(v)+3,_w16_f(v,0),"start",8.5,"muted"));});
      pts.forEach(function(q){if(Math.abs(q[2])<20)o.push(S.D(vx+5+24*jr.next(),Q.Y(q[2]),"gold",1.0));});
      [1,-1].forEach(function(g){o.push(S.L(vx,Q.Y(g*1.96*VD*u),vx+34,Q.Y(g*1.96*VD*u),"alias",1.6,"4 2"));});
      var Hh=Math.max(yy+50,py+pw+30);
      o.push(S.LEGL(nar?8:px-30,Hh+6,[["alias",null,"誤差の楕円"],["signal","4 2","CEP"],["alias","4 2","上下 95 %"]],9,12));
      if(eff!==0)o.push(S.T(nar?8:px-30,Hh+24,"灰の点: 同じ乱数で計算した単独の位置","start",9,"muted"));
      box.set(S.svg(Wd,Hh+32,o));
      /* 読み出し */
      var rows=[["UERE",_w16_f(u,2)+" m","—"],["水平の DRMS（HDOP × UERE）",_w16_f(HD*u,2)+" m",_w16_f(Math.sqrt(sh/N),2)+" m"],["CEP（50 %）",_w16_f(cep,2)+" m","中に "+_w16_f(100*cin/N,1)+" %"],
        ["R95（95 %）",_w16_f(r95,2)+" m","中に "+_w16_f(100*c95/N,1)+" %"],["上下の 95 %（1.96 × VDOP × UERE）",_w16_f(1.96*VD*u,2)+" m",_w16_f(u95,2)+" m"]];
      var nm=["単独","SBAS","DGNSS（基線長 "+_w16_f(d,d<10?1:0)+" km・年齢 "+tau+" s）"][md];
      var h="方式: <b>"+nm+"</b>";
      if(fall)h+='　<span class="warn">年齢 '+tau+' s が限度 30 s を超えたので、補正を使わず単独の解になった</span>';
      if(eff===2&&dE>0)h+="　基準局の座標の誤差 "+_w16_f(dE,1)+" m（東）→ 位置の平均が東へ "+_w16_f(dE,1)+" m ずれる";
      h+=U.tbl(["量","式","シミュレーション（"+N+" 回）"],rows,["left","right","right"]);
      /* GGA の文（12 章の例の文の、品質と 13・14 番の欄） */
      var q=eff===0?1:2,age=(eff===2)?_w16_f(tau,1):"",sid=(eff===2)?"0123":"";
      var body="GPGGA,092750.00,3540.86000,N,13946.02000,E,"+q+",08,0.95,3.3,M,36.7,M,"+age+","+sid;
      h+='<div style="font-family:var(--mono);font-size:.82rem;overflow-x:auto;white-space:nowrap">$'+body+"*"+cks(body)+"</div>";
      h+='<div class="wnote">GGA の測位の品質: '+(q===1?"1（単独）":"2（補正を使った）")+(eff===1?"。SBAS のときの 13・14 番の欄の書き方は製品による（ここでは空）":"")+"。散らばりは、どの衛星にも源ごとの誤差を正規分布で独立に入れ、線形化した式を最小二乗法で解いた（7 章のデモと同じ計算）。予算は 6 節の例の値。</div>";
      ro.innerHTML=h;
    }
    draw();
  };

  /* ===== 17 章 搬送波位相と RTK — センチメートル級の仕組み ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w17_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w17_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w17_s(v,d){var s=_w17_f(v,d);return (v>=0&&Math.abs(v)>=0.5*Math.pow(10,-d)?"+":"")+s;}
  /* 3 桁ごとに空白を入れた数（小数 d 桁） */
  function _w17_g(v,d){var neg=v<0,a=Math.abs(v),ip=Math.floor(a+(d?0:0.5)),fr=d?(a-Math.floor(a)).toFixed(d).slice(1):"";
    if(d&&+((a-Math.floor(a)).toFixed(d))>=1){ip+=1;fr="."+new Array(d+1).join("0");}
    return (neg?"−":"")+String(ip).replace(/\B(?=(\d{3})+(?!\d))/g," ")+fr;}
  var _W17_C=299792458,_W17_F1=1575.42e6,_W17_LAM=_W17_C/_W17_F1,_W17_D=Math.PI/180;
  /* 4 節の線路の上の例（図の f17.py と同じ衛星・同じ式） */
  var _W17_TOY={G9:[74.9,186.6],G6:[51.5,45.1],G22:[45.6,234.9]};
  function _w17_lE(ea){return Math.cos(ea[0]*_W17_D)*Math.sin(ea[1]*_W17_D);}
  function _w17_toyg(){var l9=_w17_lE(_W17_TOY.G9);return [-(_w17_lE(_W17_TOY.G6)-l9),-(_w17_lE(_W17_TOY.G22)-l9)];}

  /* ---- 整数の最小二乗（LAMBDA の変換と探索。RTKLIB の lambda.c と同じ手順。図の f17.py の _f17_ils と同じ） ---- */
  function _w17_zeros(n,m){var o=[];for(var i=0;i<n;i++){var r=[];for(var j=0;j<m;j++)r.push(0);o.push(r);}return o;}
  function _w17_LD(Q){var n=Q.length,A=Q.map(function(r){return r.slice();}),L=_w17_zeros(n,n),D=[],i,j,k;
    for(i=n-1;i>=0;i--){D[i]=A[i][i];var a=Math.sqrt(D[i]);for(j=0;j<=i;j++)L[i][j]=A[i][j]/a;
      for(j=0;j<i;j++)for(k=0;k<=j;k++)A[j][k]-=L[i][k]*L[i][j];
      var lii=L[i][i];for(j=0;j<=i;j++)L[i][j]/=lii;}
    return {L:L,D:D};}
  function _w17_reduction(L,D){var n=L.length,Z=_w17_zeros(n,n),i,j,k,q;for(i=0;i<n;i++)Z[i][i]=1;j=n-2;k=n-2;
    while(j>=0){
      if(j<=k)for(i=j+1;i<n;i++){var mu=Math.round(L[i][j]);if(mu!==0){for(q=i;q<n;q++)L[q][j]-=mu*L[q][i];for(q=0;q<n;q++)Z[q][j]-=mu*Z[q][i];}}
      var dl=D[j]+L[j+1][j]*L[j+1][j]*D[j+1];
      if(dl+1e-6<D[j+1]){var eta=D[j]/dl,lam=D[j+1]*L[j+1][j]/dl;D[j]=eta*D[j+1];D[j+1]=dl;
        for(q=0;q<j;q++){var a0=L[j][q],a1=L[j+1][q];L[j][q]=-L[j+1][j]*a0+a1;L[j+1][q]=eta*a0+lam*a1;}
        L[j+1][j]=lam;for(q=j+2;q<n;q++){var t=L[q][j];L[q][j]=L[q][j+1];L[q][j+1]=t;}
        for(q=0;q<n;q++){var t2=Z[q][j];Z[q][j]=Z[q][j+1];Z[q][j+1]=t2;}
        k=j;j=n-2;}
      else j--;}
    return Z;}
  function _w17_search(L,D,zs,m){var n=L.length,S=_w17_zeros(n,n),dist=[],zb=[],z=[],step=[],zn=[],s=[],nn=0,imax=0,maxdist=1e99,i,k,y,c;
    for(i=0;i<n;i++){dist.push(0);zb.push(0);z.push(0);step.push(0);}
    function sg(v){return v>=0?1:-1;}
    k=n-1;zb[k]=zs[k];z[k]=Math.round(zb[k]);y=zb[k]-z[k];step[k]=sg(y);
    for(c=0;c<100000;c++){var nd=dist[k]+y*y/D[k];
      if(nd<maxdist){
        if(k!==0){k--;dist[k]=nd;for(i=0;i<=k;i++)S[k][i]=S[k+1][i]+(z[k+1]-zb[k+1])*L[k+1][i];
          zb[k]=zs[k]+S[k][k];z[k]=Math.round(zb[k]);y=zb[k]-z[k];step[k]=sg(y);}
        else{
          if(nn<m){if(nn===0||nd>s[imax])imax=nn;zn.push(z.slice());s.push(nd);nn++;}
          else{if(nd<s[imax]){zn[imax]=z.slice();s[imax]=nd;imax=0;for(i=0;i<m;i++)if(s[imax]<s[i])imax=i;}maxdist=s[imax];}
          z[0]+=step[0];y=zb[0]-z[0];step[0]=-step[0]-sg(step[0]);}}
      else{if(k===n-1)break;k++;z[k]+=step[k];y=zb[k]-z[k];step[k]=-step[k]-sg(step[k]);}}
    var ord=s.map(function(_,i){return i;}).sort(function(a,b){return s[a]-s[b];});
    return {zn:ord.map(function(i){return zn[i];}),s:ord.map(function(i){return s[i];})};}
  /* 浮動の解 a と共分散 Q から、整数の最小二乗の候補を良い順に m 個と、その J。Z の行列（z = Zᵀa）も返す */
  function _w17_ils(U,a,Q,m,pre){var M=U.ctl.mat,P=pre||_w17_prep(U,Q);
    var zs=[];for(var i=0;i<a.length;i++){var v=0;for(var j=0;j<a.length;j++)v+=P.Z[j][i]*a[j];zs.push(v);}
    var r=_w17_search(P.L,P.D,zs,m||2);
    var F=r.zn.map(function(z){return M.mul(P.ZTi,M.col(z)).map(function(row){return Math.round(row[0]);});});
    return {F:F,s:r.s};}
  function _w17_prep(U,Q){var ld=_w17_LD(Q),L=ld.L.map(function(r){return r.slice();}),D=ld.D.slice(),Z=_w17_reduction(L,D);
    return {L:L,D:D,Z:Z,ZTi:U.ctl.mat.inv(U.ctl.mat.T(Z))};}

  /* ---- 線路の上の例: (e, N6, N22) の共分散。K エポック、雑音はエポックごとに独立（図の _f17_toyQ と同じ） ---- */
  function _w17_toyQ(U,sr,sp,K){var M=U.ctl.mat,g=_w17_toyg(),Qs=[[4,2],[2,4]];
    var Wc=M.inv(M.scale(Qs,sr*sr)),Wp=M.inv(M.scale(Qs,sp*sp));
    var Hc=[[g[0],0,0],[g[1],0,0]],Hp=[[g[0],_W17_LAM,0],[g[1],0,_W17_LAM]];
    var Nm=M.add(M.mul(M.mul(M.T(Hc),Wc),Hc),M.mul(M.mul(M.T(Hp),Wp),Hp));
    return M.inv(M.scale(Nm,K));}
  function _w17_chol(A){var n=A.length,L=_w17_zeros(n,n);for(var i=0;i<n;i++)for(var j=0;j<=i;j++){var s=A[i][j];for(var k=0;k<j;k++)s-=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(s,1e-300)):s/L[j][j];}return L;}
  /* 凸多角形を半平面 n·p ≤ c で切る */
  function _w17_clip(P,n,c){var o=[];for(var i=0;i<P.length;i++){var A=P[i],B=P[(i+1)%P.length],da=n[0]*A[0]+n[1]*A[1]-c,db=n[0]*B[0]+n[1]*B[1]-c;
    if(da<=0)o.push(A);if((da<0&&db>0)||(db<0&&da>0)){var t=da/(da-db);o.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]);}}return o;}
  /* 原点を含む凸多角形の中に、2 次元の標準正規分布の点が入る確率（原点から見た角度で積分。図の _f17_pin と同じ） */
  function _w17_pin(P,ns){ns=ns||3000;var tot=0;for(var i=0;i<P.length;i++){var A=P[i],B=P[(i+1)%P.length],t1=Math.atan2(A[1],A[0]),dt=Math.atan2(B[1],B[0])-t1;
      while(dt<=-Math.PI)dt+=2*Math.PI;while(dt>Math.PI)dt-=2*Math.PI;
      var ex=B[0]-A[0],ey=B[1]-A[1],el=Math.hypot(ex,ey),nx=ey/el,ny=-ex/el,p=nx*A[0]+ny*A[1];if(p<0){nx=-nx;ny=-ny;p=-p;}
      var th0=Math.atan2(ny,nx),s=0;for(var k=0;k<ns;k++){var t=t1+dt*(k+0.5)/ns,r=p/Math.cos(t-th0);s+=1-Math.exp(-r*r/2);}tot+=s*dt/ns;}
    return tot/(2*Math.PI);}
  /* 2 つの整数値バイアスの、丸めの正方形と整数の最小二乗の領域（M があれば z = M a の座標で）と、それぞれの確率 */
  function _w17_regions(U,Qa,Mz){var M=U.ctl.mat,Q=Mz?M.mul(M.mul(Mz,Qa),M.T(Mz)):Qa,R=_w17_chol(Q),Ri=M.inv(R),pre=_w17_prep(U,Q);
    var big=1e4,P=[[-big,-big],[big,-big],[big,big],[-big,big]];
    for(var i=-3;i<=3;i++)for(var j=-3;j<=3;j++){if(!i&&!j)continue;var zv=M.mul(pre.ZTi,[[i],[j]]),v=M.mul(Ri,[[Math.round(zv[0][0])],[Math.round(zv[1][0])]]);
      v=[v[0][0],v[1][0]];P=_w17_clip(P,v,(v[0]*v[0]+v[1]*v[1])/2);}
    var sq=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]].map(function(q){var w=M.mul(Ri,[[q[0]],[q[1]]]);return [w[0][0],w[1][0]];});
    var hexa=P.map(function(q){var w=M.mul(R,[[q[0]],[q[1]]]);return [w[0][0],w[1][0]];});
    return {hexa:hexa,pr:_w17_pin(sq),pi:_w17_pin(P),Q:Q};}

  /* ---- 2 節の後: 波長のものさしで距離を測る ---- */
  REG.w17_phase=function(el,U){
    var S=U.S,LAM=_W17_LAM;
    U.head(el,"CARRIER PHASE","波長 19 cm のものさしで距離を測る: 端数は測れるが、周期の数は分からない");
    var r1=U.ctrls(el);
    var sv=U.slider(r1,"移動局の速さ（衛星から遠ざかる向きが正）",{min:-2,max:2,step:0.1,value:1,fmt:function(v){return _w17_s(v,1)+" m/s";},onInput:function(){draw();}});
    var ss=U.slider(r1,"擬似距離の誤差 σ（代表値 0.3 m）",{min:0.1,max:1.0,step:0.05,value:0.3,fmt:function(v){return _w17_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el);
    /* 本当の距離: 受信機の所で、衛星から数えた周期の数が 113 650 652.37 になる距離から始める（図の e17_ambig と同じ） */
    var NT=113650652,R0=LAM*(NT+0.37),st;
    function reset(){st={t:0,s:0,k0:NT-4,hist:[],rng:U.rng(17)};push();}
    function ctrue(){return (R0+st.s)/LAM;}
    function phi(){return ctrue()-st.k0;}                         /* 受信機の搬送波位相 [周期]（数えた周期 + 端数） */
    function push(){var r=R0+st.s,rho=r+ss.get()*st.rng.normal(),ph=LAM*phi()+0.003*st.rng.normal();st.hist.push([st.t,r,rho,ph]);if(st.hist.length>400)st.hist.shift();}
    var bp=U.button(br,"再生",function(){if(tk.running()){tk.stop();bp.textContent="再生";}else{tk.start();bp.textContent="止める";}});
    U.button(br,"追尾を始め直す",function(){st.k0=Math.floor(ctrue());st.hist=[];push();draw();});
    U.button(br,"本文の例",function(){tk.stop();bp.textContent="再生";sv.set(1);ss.set(0.3);reset();draw();});
    var tk=U.ticker(function(){var dt=0.05;st.t+=dt;st.s+=sv.get()*dt;push();draw();},50);
    var box=U.svgbox(el),ro=U.readout(el);
    reset();
    function draw(){
      var nar=_w17_nar(box),W=nar?400:700,o=[],ph=phi(),k=Math.floor(ph),fr=ph-k,ct=ctrue();
      /* (a) ものさし */
      o.push(S.T(10,16,"(a) 受信機のまわりの目盛（受信機を真ん中に置いて描く）","start",nar?9.5:10.5,"ink",true));
      var cx=nar?250:420,sc=nar?34:52,ytk=64,half=nar?4.2:5.2,base=Math.floor(ct);
      o.push(S.L(cx-half*sc,ytk,cx+half*sc,ytk,"muted",1.2));
      for(var q=-6;q<=7;q++){var cn=base+q,x=cx+(cn-ct)*sc;if(x<cx-half*sc-1||x>cx+half*sc+1)continue;
        o.push(S.L(x,ytk-6,x,ytk+6,"ink",1.2));
        o.push(S.T(x,ytk+19,"…"+String(cn%1000).padStart(3,"0"),"middle",nar?8.5:9,"muted",false,true));
        o.push(S.T(x,ytk+34,String(cn-st.k0).replace("-","−"),"middle",nar?9:10,"purple",true));}
      o.push(S.L(cx,ytk-26,cx,ytk-4,"green",1.6));o.push(S.D(cx,ytk-27,"green",3.6));
      o.push(S.T(cx+7,ytk-24,"受信機","start",9.5,"green",true,false,null,true));
      if(!nar){o.push(S.T(10,ytk+19,"衛星から数えた番号","start",9,"muted"));o.push(S.T(10,ytk+34,"受信機が数えた番号","start",9.5,"purple",true));}
      o.push(S.ARR(cx-half*sc+40,ytk-38,cx-half*sc,ytk-38,"signal",1.2,6));o.push(S.T(cx-half*sc+46,ytk-34,"衛星の向き","start",9,"signal",true));
      /* (b) NCO の端数と数えた周期 */
      var yb=nar?132:126,dx=nar?60:70,dy=yb+58,R=36;
      o.push(S.T(10,yb,"(b) PLL が測るもの","start",nar?9.5:10.5,"ink",true));
      o.push(S.CIRC(dx,dy,R,"muted",1.3,"var(--screen)"));
      var a=2*Math.PI*fr;o.push(S.ARR(dx,dy,dx+(R-6)*Math.sin(a),dy-(R-6)*Math.cos(a),"gold",2.2,7));
      o.push(S.T(dx,dy-R-4,"0","middle",9,"muted"));o.push(S.T(dx,dy+R+14,"端数 "+_w17_f(fr,2),"middle",9.5,"gold",true));
      o.push(S.T(dx+R+16,dy-14,"数えた周期 "+String(k).replace("-","−"),"start",10,"purple",true));
      o.push(S.TX(dx+R+16,dy+4,"φ = "+_w17_f(ph,2)+" 周期","start",10,"ink",true));
      o.push(S.TX(dx+R+16,dy+22,"Φ = λφ = "+_w17_f(LAM*ph,3)+" m","start",10,"ink",true));
      /* (c) 距離の変化（最近の 10 s） */
      var h=st.hist,t1=Math.max(10,st.t),t0=t1-10,pts=h.filter(function(p){return p[0]>=t0-1e-9;});
      var p0=pts.length?pts[0]:h[h.length-1];
      var dv=pts.map(function(p){return [p[0],p[1]-p0[1],p[2]-p0[2],p[3]-p0[3]];}),lo=0,hi=0;
      dv.forEach(function(p){lo=Math.min(lo,p[1],p[2]);hi=Math.max(hi,p[1],p[2]);});lo-=0.6;hi+=0.6;
      var px=nar?60:330,py=nar?yb+152:yb+24,pw=nar?320:350,ph2=nar?120:120;
      o.push(S.T(nar?10:px-40,nar?yb+138:yb,"(c) 追尾の間の、距離の変化（最近の 10 s）","start",nar?9.5:10.5,"ink",true));
      var P=U.plot(px,py,pw,ph2,[t0,t1],[lo,hi]);
      o.push(P.axes({xl:"時間 t [s]",yl:"変化 [m]",sz:9}));
      o.push(P.line(dv.map(function(p){return [p[0],p[2]];}),"signal",1.1));
      o.push(P.line(dv.map(function(p){return [p[0],p[1]];}),"ink",3.4));
      o.push(P.line(dv.map(function(p){return [p[0],p[3]];}),"green",1.6));
      o.push(S.LEGL(nar?10:px-40,py+ph2+46,[["ink",null,"本当の距離"],["green",null,"Φ（重なる）"],["signal",null,"擬似距離"]],9,10));
      /* (d) 候補 */
      var yd=nar?py+ph2+80:yb+214,rho=h[h.length-1][2],r=R0+st.s,Phi=LAM*ph,sg=ss.get();
      o.push(S.T(10,yd,"(d) 擬似距離 ± 3σ の中に入る、19.03 cm ごとの候補（本当の距離からの差）","start",nar?9.5:10.5,"ink",true));
      var Q=U.plot(nar?30:60,yd+16,nar?340:600,40,[-3.2,3.2],[0,1]);
      o.push(S.RECT(Q.X(Math.max(-3.2,rho-r-3*sg)),Q.y,Q.X(Math.min(3.2,rho-r+3*sg))-Q.X(Math.max(-3.2,rho-r-3*sg)),Q.h,2,U.soft("signal"),"none",0));
      o.push(S.L(Q.X(rho-r),Q.y-2,Q.X(rho-r),Q.y+Q.h,"signal",1.6));
      var nin=0,Ntrue=Math.round(ph-ct);
      for(var n=-40;n<=40;n++){var v=n*LAM;if(v<-3.2||v>3.2)continue;var inn=Math.abs(v-(rho-r))<=3*sg;nin+=inn?1:0;
        var c=n===0?"green":(inn?"gold":"faint");o.push(S.L(Q.X(v),Q.y+Q.h-(n===0?24:16),Q.X(v),Q.y+Q.h,c,n===0?2.4:1.5));}
      o.push(S.L(Q.x,Q.y+Q.h,Q.x+Q.w,Q.y+Q.h,"muted",1.2));
      [-3,-2,-1,0,1,2,3].forEach(function(v){o.push(S.T(Q.X(v),Q.y+Q.h+13,String(v).replace("-","−")+" m","middle",9,"muted"));});
      box.set(S.svg(W,yd+80,o));
      ro.innerHTML="本当の距離 r = <b>"+_w17_g(r,3)+" m</b>（衛星から数えて "+_w17_g(ct,2)+" 周期。受信機は知らない）<br>"+
        "受信機の搬送波位相 φ = "+_w17_f(ph,2)+" 周期（数えた周期 "+k+" + 端数 "+_w17_f(fr,2)+"）、Φ = "+_w17_f(Phi,3)+" m<br>"+
        "整数値バイアス N = φ − r/λ = <b>"+_w17_g(Ntrue,0)+"</b> 周期（追尾を始め直すまで一定。受信機には分からない）<br>"+
        "擬似距離 ρ = "+_w17_g(rho,3)+" m。±3σ（±"+_w17_f(3*sg,2)+" m）の中の候補 <b>"+nin+" 個</b>";
    }
    draw();
  };

  /* ---- 3 節の後: 2 つの受信機と 2 つの衛星の、一重差と二重差 ---- */
  REG.w17_dd=function(el,U){
    var S=U.S,G=U.gnss,LAM=_W17_LAM,C=_W17_C;
    U.head(el,"DOUBLE DIFFERENCE","2 つの受信機と 2 つの衛星で差をとると、どの項が消えるか");
    var rx=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),con=G.constellation().filter(function(s){return s.sys==="GPS";});
    var B=G.TOKYO[0]*_W17_D,Lg=G.TOKYO[1]*_W17_D,east=[-Math.sin(Lg),Math.cos(Lg),0];
    function vis(t){var o=[];con.forEach(function(s){var ea=G.elaz(rx,G.ecef(s,t));if(ea[0]>5)o.push({nm:s.nm,s:s,el:ea[0],az:ea[1]});});o.sort(function(a,b){return b.el-a.el;});return o;}
    var r1=U.ctrls(el),tmin=0,vs=vis(0);
    var selI=U.select(r1,"基準の衛星 i",vs.map(function(v){return v.nm;}),0,function(){draw();});
    var selJ=U.select(r1,"衛星 j",vs.map(function(v){return v.nm;}),2,function(){draw();});
    var sT=U.slider(r1,"時刻（衛星が動く）",{min:0,max:60,step:1,value:0,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var sD=U.slider(r1,"基線長 d（移動局は東へ）",{min:0,max:30,step:0.1,value:1,fmt:function(v){return _w17_f(v,1)+" km";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var sBr=U.slider(r2,"基準局の時計のずれ",{min:-1,max:1,step:0.05,value:0.4,fmt:function(v){return _w17_s(v,2)+" ms";},onInput:function(){draw();}});
    var sBv=U.slider(r2,"移動局の時計のずれ",{min:-1,max:1,step:0.05,value:-0.25,fmt:function(v){return _w17_s(v,2)+" ms";},onInput:function(){draw();}});
    var sSi=U.slider(r2,"衛星 i の時計のずれ",{min:-100,max:100,step:5,value:25,fmt:function(v){return _w17_s(v,0)+" μs";},onInput:function(){draw();}});
    var sSj=U.slider(r2,"衛星 j の時計のずれ",{min:-100,max:100,step:5,value:-60,fmt:function(v){return _w17_s(v,0)+" μs";},onInput:function(){draw();}});
    var r3=U.ctrls(el);
    var sI=U.slider(r3,"電離層の天頂の遅れ（基準局）",{min:0,max:15,step:0.5,value:4.06,fmt:function(v){return _w17_f(v,2)+" m";},onInput:function(){draw();}});
    var sG=U.slider(r3,"電離層の場所による増え方（東へ 1 km あたり）",{min:0,max:4,step:0.1,value:1,fmt:function(v){return _w17_f(v,1)+" mm";},onInput:function(){draw();}});
    var Ns={ri:31,vi:5,rj:-12,vj:44},seed=3;
    var br=U.btnrow(el);
    U.button(br,"本文の例",function(){selI.set(0);selJ.set(2);sT.set(0);sD.set(1);sBr.set(0.4);sBv.set(-0.25);sSi.set(25);sSj.set(-60);sI.set(4.06);sG.set(1);Ns={ri:31,vi:5,rj:-12,vj:44};draw();});
    U.button(br,"整数値バイアスを変える（乱数）",function(){var r=U.rng(++seed);Ns={ri:r.int(80)-40,vi:r.int(80)-40,rj:r.int(80)-40,vj:r.int(80)-40};draw();});
    var box=U.svgbox(el),ro=U.readout(el),geo=null,drag=false;
    U.ctl.drag(box,function(type,x,y){if(!geo)return false;
      if(type==="down"){if(Math.hypot(x-geo.xr,y-geo.yr)>22)return false;drag=true;return true;}
      if(type==="move"&&drag){var d=Math.max(0,Math.min(30,(x-geo.x0)/geo.sc));sD.set(Math.round(d*10)/10);draw();}
      if(type==="up")drag=false;});
    function mI(e){var s=6371*Math.cos(e*_W17_D)/(6371+350);return 1/Math.sqrt(1-s*s);}
    function mT(e){return 1.001/Math.sqrt(0.002001+Math.pow(Math.sin(e*_W17_D),2));}
    function terms(t){var sats=vis(t),ni=selI.get(),nj=selJ.get();
      /* 時刻 0 の並びの番号で選んだ衛星を、名前で探す（時刻を進めると並びが変わるので） */
      var nmI=vs[ni]?vs[ni].nm:vs[0].nm,nmJ=vs[nj]?vs[nj].nm:vs[1].nm,si=null,sj=null;
      con.forEach(function(s){if(s.nm===nmI)si=s;if(s.nm===nmJ)sj=s;});
      var d=sD.get()*1000,prov=[rx.r0[0]+d*east[0],rx.r0[1]+d*east[1],rx.r0[2]+d*east[2]],out={};
      [["i",si,sSi.get()*1e-6],["j",sj,sSj.get()*1e-6]].forEach(function(q){var ps=G.ecef(q[1],t),ea=G.elaz(rx,ps);
        [["ref",rx.r0,sBr.get()*1e-3,0],["rov",prov,sBv.get()*1e-3,d]].forEach(function(w){var rr=Math.hypot(ps[0]-w[1][0],ps[1]-w[1][1],ps[2]-w[1][2]);
          var I=(sI.get()+sG.get()*1e-3*w[3]/1000)*mI(ea[0]),Tt=2.41*mT(ea[0]),N=Ns[(w[0]==="ref"?"r":"v")+q[0]];
          out[w[0]+q[0]]={r:rr,b:C*w[2],s:-C*q[2],I:-I,T:Tt,N:LAM*N,n:N,el:ea[0],az:ea[1]};});});
      out.nmI=nmI;out.nmJ=nmJ;return out;}
    function draw(){
      var t=sT.get()*60,X=terms(t),nar=_w17_nar(box),W=nar?400:700,o=[];
      if(X.nmI===X.nmJ){ro.innerHTML='<span class="warn">衛星 i と j に違う衛星を選ぶ</span>';box.set(S.svg(W,40,[S.T(10,24,"衛星 i と j に違う衛星を選ぶ","start",11,"alias",true)]));return;}
      /* (a) 空と、地面の 2 つの受信機 */
      o.push(S.T(10,16,"(a) 東京の空の衛星 i・j と、2 つの受信機","start",nar?9.5:10.5,"ink",true));
      var cx=nar?80:84,cy=96,R=58,sats=vis(t).map(function(v){var hl=v.nm===X.nmI||v.nm===X.nmJ;return {el:v.el,az:v.az,name:hl?(v.nm===X.nmI?"i "+v.nm:"j "+v.nm):null,col:hl?"signal":"faint",hl:hl};});
      o.push(G.sky(U,cx,cy,R,sats,{sz:9,dot:3.4}));
      var x0=nar?206:240,x1=nar?386:440,gy=150,sc=(x1-x0-20)/30;
      o.push(S.L(x0-10,gy+6,x1,gy+6,"muted",1.2));
      [0,10,20,30].forEach(function(v){o.push(S.L(x0+v*sc,gy+6,x0+v*sc,gy+10,"muted",1));o.push(S.T(x0+v*sc,gy+22,v+" km","middle",9,"muted"));});
      var xr=x0+sD.get()*sc;geo={x0:x0,sc:sc,xr:xr,yr:gy-6};
      /* 東西と上下の面に映した視線の向き（移動局は東にいるので、この向きの成分が距離の差を決める） */
      [["i",X.refi],["j",X.refj]].forEach(function(q){var e=q[1].el*_W17_D,a=q[1].az*_W17_D,le=Math.cos(e)*Math.sin(a),lu=Math.sin(e),ln=Math.hypot(le,lu),dx=le/ln,dy=-lu/ln,Lx=80;
        [x0,xr].forEach(function(xx){o.push(S.L(xx,gy-8,xx+dx*Lx,gy-8+dy*Lx,"signal",1,"3 3"));});
        o.push(S.T(xr+dx*Lx+(dx<0?-4:4),gy-8+dy*Lx-2,q[0],(dx<0?"end":"start"),10,"signal",true,false,null,true));});
      o.push(S.CIRC(x0,gy-6,5,"purple",2,"var(--screen)"));o.push(S.T(x0-9,gy-2,"基準局","end",9.5,"purple",true,false,null,true));
      o.push(S.D(xr,gy-6,"green",5.5));o.push(S.T(xr,gy-18,"移動局（ドラッグ）","middle",9.5,"green",true,false,null,true));
      /* (b)・(c) 表 */
      var keys=["r","b","s","I","T","N"],names=["距離 r","受信機の時計 b","衛星の時計 −cδt^s","電離層 −I","対流圏 T","整数値バイアス λN"];
      var sd={i:{},j:{}},dd={};keys.forEach(function(k){sd.i[k]=X.rovi[k]-X.refi[k];sd.j[k]=X.rovj[k]-X.refj[k];dd[k]=sd.j[k]-sd.i[k];});
      function num(v){var a=Math.abs(v);return a>=1e4?_w17_g(v,3):_w17_f(v,3);}
      function table(yt,title,cols,xs,vals,diff){
        o.push(S.T(10,yt,title,"start",nar?9.5:10.5,"ink",true));
        cols.forEach(function(c,k){o.push(S.T(xs[k],yt+18,c,"end",nar?8.5:9,diff?"teal":"ink",true));});
        keys.forEach(function(k,r){var yy=yt+24+r*20;if(r%2===0)o.push(S.RECT(6,yy,W-12,20,0,U.soft("muted"),"none",0,null,' fill-opacity="0.5"'));
          o.push(S.TX(10,yy+14,names[r],"start",nar?8.5:9,"ink",true));
          vals(k).forEach(function(v,c){var gone=diff&&Math.abs(v)<5e-4,small=diff&&!gone&&Math.abs(v)<0.01;
            var txt=gone?((k==="b"||k==="s")?"0（消える）":"0.000"):num(v);
            o.push(S.T(xs[c],yy+14,txt,"end",nar?8.5:9,gone?"green":(small?"teal":"ink"),gone||small,true));});});
        var yy=yt+24+6*20;o.push(S.L(6,yy+2,W-6,yy+2,"muted",1));
        o.push(S.T(10,yy+16,"合計（測った値）","start",nar?8.5:9,"ink",true));
        vals("r").forEach(function(_,c){var tot=0;keys.forEach(function(k){tot+=vals(k)[c];});o.push(S.T(xs[c],yy+16,num(tot),"end",nar?8.5:9,"ink",true,true));});
        return yy+24;}
      var yt=nar?242:206;
      if(!nar)yt=table(yt,"(b) 4 つの観測の各項 [m]",["基準局・i","移動局・i","基準局・j","移動局・j"],[300,430,560,690],function(k){return [X.refi[k],X.rovi[k],X.refj[k],X.rovj[k]];},false)+20;
      var yend=table(yt,nar?"(b) 差をとった後 [m]":"(c) 差をとった後 [m]",["一重差 i","一重差 j","二重差"],nar?[232,314,394]:[400,545,690],function(k){return [sd.i[k],sd.j[k],dd[k]];},true);
      box.set(S.svg(W,yend+6,o));
      var nN=Math.round(dd.N/LAM);
      ro.innerHTML="二重差 ∇ΔΦ<sub>ij</sub> = 距離の差 <b>"+_w17_f(dd.r,3)+" m</b> + 整数値バイアス <b>"+nN+" 周期</b>（"+_w17_f(dd.N,3)+" m） + 電離層の差 <b>"+_w17_f(dd.I*1000,1)+" mm</b>"+
        "（対流圏の差 "+_w17_f(dd.T*1000,1)+" mm）<br>時計の項は、一重差で衛星の分（"+_w17_f(X.refi.s/1000,3)+" km など）が、二重差で受信機の分（一重差に残った "+_w17_f(sd.i.b/1000,3)+" km）が、どの値でも <span class=\"ok\">0</span> になる。"+
        "<br>衛星 i = "+X.nmI+"（仰角 "+_w17_f(X.refi.el,1)+"°）、j = "+X.nmJ+"（仰角 "+_w17_f(X.refj.el,1)+"°）、基線長 "+_w17_f(sD.get(),1)+" km";
    }
    draw();
  };

  /* ---- 4 節の後: フロート解の散らばりと整数の格子、整数の最小二乗と比の検定 ---- */
  REG.w17_fix=function(el,U){
    var S=U.S,M=U.ctl.mat,LAM=_W17_LAM;
    U.head(el,"AMBIGUITY RESOLUTION","実数の解の散らばりと整数の格子（線路の上の例）: 雑音とエポックの数で、正しい整数に決まる割合が変わる");
    var r1=U.ctrls(el);
    var sR=U.slider(r1,"擬似距離の誤差 σ<sub>ρ</sub>",{min:0.1,max:1.0,step:0.05,value:0.3,fmt:function(v){return _w17_f(v,2)+" m";},onInput:function(){run();}});
    var sP=U.slider(r1,"搬送波位相の誤差 σ<sub>Φ</sub>",{min:1,max:10,step:0.5,value:3,fmt:function(v){return _w17_f(v,1)+" mm";},onInput:function(){run();}});
    var sK=U.slider(r1,"平均するエポックの数",{values:[1,2,3,5,10,20,30],value:1,fmt:function(v){return v+" エポック";},onInput:function(){run();}});
    var sTh=U.slider(r1,"比の検定のしきい値",{min:1,max:6,step:0.5,value:3,fmt:function(v){return _w17_f(v,1);},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var view=U.seg(r2,["元の整数値バイアス","組み替えた後（LAMBDA の考え方）"],0,function(){draw();});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例",function(){sR.set(0.3);sP.set(3);sK.set(1);sTh.set(3);view.set(0);seed=1;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el),res=null;
    var ZM=[[1,1],[7,6]];
    function run(){
      var Qt=_w17_toyQ(U,sR.get(),sP.get()/1000,sK.get()),Qa=[[Qt[1][1],Qt[1][2]],[Qt[2][1],Qt[2][2]]],Lc=_w17_chol(Qt),pre=_w17_prep(U,Qa);
      var Qai=M.inv(Qa),qxa=[Qt[0][1],Qt[0][2]],gN=M.mul([qxa],Qai)[0];
      var rg=U.rng(seed),n=2000,smp=[];
      for(var k=0;k<n;k++){var w=[rg.normal(),rg.normal(),rg.normal()],v=[0,0,0];for(var i=0;i<3;i++)for(var j=0;j<=i;j++)v[i]+=Lc[i][j]*w[j];
        var a=[v[1],v[2]],r=_w17_ils(U,a,Qa,2,pre),z=r.F[0],ok=z[0]===0&&z[1]===0,ratio=r.s[0]>0?r.s[1]/r.s[0]:1e9;
        var efix=v[0]-(gN[0]*(a[0]-z[0])+gN[1]*(a[1]-z[1]));
        smp.push({e:v[0],a:a,z:z,ok:ok,ratio:ratio,efix:efix,rnd:Math.round(a[0])===0&&Math.round(a[1])===0});}
      res={Qt:Qt,Qa:Qa,smp:smp,R1:_w17_regions(U,Qa,null),R2:_w17_regions(U,Qa,ZM)};
      draw();}
    function draw(){
      if(!res)return;
      var nar=_w17_nar(box),W=nar?400:700,o=[],th=sTh.get(),z=view.get()===1,R=z?res.R2:res.R1,Qa=res.Qa;
      var nOK=0,nW=0,nN=0,nR=0;res.smp.forEach(function(s){var acc=s.ratio>=th;if(acc&&s.ok)nOK++;else if(acc)nW++;else nN++;if(s.rnd)nR++;});
      var n=res.smp.length;
      /* (a) 整数の格子と、実数の値 */
      var lim=2.5,ps=nar?300:290,P=U.plot(nar?56:56,30,ps,ps,[-lim,lim],[-lim,lim]);
      o.push(S.TX(10,16,z?"(a) 組み替えた後: z_1 = N_6 + N_{22}、z_2 = 7N_6 + 6N_{22}":"(a) 2 つの整数値バイアスの実数の値（誤差）","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(P.x,P.y,P.w,P.h,0,"var(--screen)","muted",1));
      o.push(P.axes({xl:z?"ẑ_1 − z_1 [周期]":"N̂_6 − N_6 [周期]",yl:z?"ẑ_2 − z_2 [周期]":"N̂_{22} − N_{22} [周期]",xt:[-2,-1,0,1,2],yt:[-2,-1,0,1,2],grid:false,sz:9}));
      var H=R.hexa.slice();[[[1,0],lim],[[-1,0],lim],[[0,1],lim],[[0,-1],lim]].forEach(function(q){H=_w17_clip(H,q[0],q[1]);});
      if(H.length>=3)o.push(S.PL(H.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"green",1.3,U.soft("green")));
      var sq=[[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5],[-0.5,-0.5]];o.push(S.PL(sq.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),"signal",1.5,null,"5 3"));
      for(var i=-2;i<=2;i++)for(var j=-2;j<=2;j++)o.push(S.D(P.X(i),P.Y(j),(i||j)?"muted":"ink",(i||j)?1.8:2.4));
      res.smp.slice(0,300).forEach(function(s){var w=z?[ZM[0][0]*s.a[0]+ZM[0][1]*s.a[1],ZM[1][0]*s.a[0]+ZM[1][1]*s.a[1]]:s.a;
        if(Math.abs(w[0])>lim||Math.abs(w[1])>lim)return;var acc=s.ratio>=th;
        if(!acc)o.push(S.CIRC(P.X(w[0]),P.Y(w[1]),2.2,"muted",0.9));else o.push(S.D(P.X(w[0]),P.Y(w[1]),s.ok?"green":"alias",2.2));});
      /* (b) 位置 */
      var qx=nar?56:420,qy=nar?P.y+P.h+70:44,qw=nar?310:260;
      o.push(S.T(nar?10:qx-50,qy-14,"(b) 位置 e の誤差（フロート解とフィックス解）","start",nar?9.5:10.5,"ink",true));
      var Q=U.plot(qx,qy,qw,70,[-1.5,1.5],[0,3]);
      o.push(Q.axes({xl:"誤差 [m]",xt:[-1.5,-1,-0.5,0,0.5,1,1.5],yt:[],grid:false,sz:9}));
      o.push(S.T(Q.x-6,Q.Y(2.2)+4,"フロート","end",9,"gold",true));o.push(S.T(Q.x-6,Q.Y(0.9)+4,"フィックス","end",9,"ink",true));
      res.smp.slice(0,300).forEach(function(s,k){var yj=(k%9)/9*0.5;if(Math.abs(s.e)<1.5)o.push(S.D(Q.X(s.e),Q.Y(1.95+yj),"gold",1.6));
        var acc=s.ratio>=th;if(acc&&Math.abs(s.efix)<1.5)o.push(S.D(Q.X(s.efix),Q.Y(0.65+yj),s.ok?"green":"alias",1.8));});
      /* (c) 割合 */
      var cy=nar?qy+130:qy+128,cw=nar?280:240,cx=nar?96:430;
      o.push(S.T(nar?10:qx-50,cy-16,"(c) 正しい整数に決まる割合","start",nar?9.5:10.5,"ink",true));
      [[nar?(z?"組み替え・丸め":"丸め（式）"):(z?"組み替えた後の丸め（式）":"丸め（式）"),R.pr,"signal"],[nar?"最小二乗（式）":"整数の最小二乗（式）",R.pi,"green"]].forEach(function(q,k){var yy=cy+k*26;
        o.push(S.T(cx-6,yy+12,q[0],"end",9,"ink",true));o.push(S.RECT(cx,yy,cw,16,2,"var(--screen)","line",1));
        o.push(S.RECT(cx,yy,cw*q[1],16,2,U.soft(q[2]),q[2],1));o.push(S.T(cx+cw*q[1]+4>cx+cw-40?cx+cw-4:cx+cw*q[1]+4,yy+12,_w17_f(100*q[1],1)+" %",cx+cw*q[1]+4>cx+cw-40?"end":"start",9.5,q[2],true));});
      var yy=cy+56,xg=cx;
      o.push(S.T(cx-6,yy+12,nar?"比の検定":"比の検定（シミュレーション）","end",9,"ink",true));
      [[nOK/n,"green"],[nW/n,"alias"],[nN/n,"muted"]].forEach(function(q){if(q[0]>0)o.push(S.RECT(xg,yy,cw*q[0],16,0,U.soft(q[1]),q[1],1));xg+=cw*q[0];});
      o.push(S.T(cx,yy+30,"正 "+_w17_f(100*nOK/n,1)+" %・誤 "+_w17_f(100*nW/n,1)+" %・決めない "+_w17_f(100*nN/n,1)+" %","start",9,"ink"));
      if(!nar)o.push(S.LEGL(56,P.y+P.h+50,[["green",null,"正しい整数に決めた"],["alias",null,"誤った整数に決めた"],["muted",null,"比の検定で決めない（○）"]],9,10));
      box.set(S.svg(W,nar?cy+96:Math.max(P.y+P.h+60,yy+40),o));
      var Qz=res.R2.Q,sx=Math.sqrt(res.Qt[0][0]);
      ro.innerHTML="実数の値の標準偏差: N̂<sub>6</sub> "+_w17_f(Math.sqrt(Qa[0][0]),2)+" 周期・N̂<sub>22</sub> "+_w17_f(Math.sqrt(Qa[1][1]),2)+" 周期（相関係数 "+_w17_f(Qa[0][1]/Math.sqrt(Qa[0][0]*Qa[1][1]),4)+"）。"+
        "組み替えた後 "+_w17_f(Math.sqrt(Qz[0][0]),2)+"・"+_w17_f(Math.sqrt(Qz[1][1]),2)+" 周期<br>"+
        "正しい整数に決まる割合（範囲の中の確率の積分）: 丸め <b>"+_w17_f(100*res.R1.pr,1)+" %</b>、整数の最小二乗 <b>"+_w17_f(100*res.R1.pi,1)+" %</b>（組み替えた後の丸め "+_w17_f(100*res.R2.pr,1)+" %）。"+
        "シミュレーション "+n+" 回: 丸め "+_w17_f(100*nR/n,1)+" %<br>"+
        "比の検定（しきい値 "+_w17_f(th,1)+"）: <span class=\"ok\">正しく決めた "+_w17_f(100*nOK/n,1)+" %</span>・<span class=\"warn\">誤って決めた "+_w17_f(100*nW/n,1)+" %</span>・決めない "+_w17_f(100*nN/n,1)+" %"+
        "（決めた解の "+(nOK+nW?_w17_f(100*nW/(nOK+nW),1):"0")+" % が誤り）<br>位置 e の誤差の標準偏差: フロート解 "+_w17_f(sx,3)+" m";
    }
    run();
  };

  /* ===== 18 章 多周波と PPP ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w18_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w18_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  var _W18_C=299792458,_W18_D=Math.PI/180,_W18_F1=1575.42e6;
  /* 2 つ目の周波数の候補（f_1 は L1） */
  var _W18_F2=[["L1 と L2",1227.60e6,"L2"],["L1 と L5（E5a・B2a）",1176.45e6,"L5"],["L1 と E5b（B2b）",1207.14e6,"E5b"],["L1 と L6（E6）",1278.75e6,"L6"]];
  var _W18_B7=[1.5,3.5,0.4,1.0,0.5];   /* 7 章 6 節の予算（代表値） */
  function _w18_coef(f1,f2){var d=f1*f1-f2*f2;return [f1*f1/d,f2*f2/d];}
  function _w18_k(f1,f2){return Math.sqrt(Math.pow(f1,4)+Math.pow(f2,4))/(f1*f1-f2*f2);}
  function _w18_iono(tec,f){return 40.3*tec*1e16/(f*f);}
  /* 7 章 2 節の薄い殻のマッピング関数（R_E = 6371 km、h_I = 350 km） */
  function _w18_mI(el){var s=6371*Math.cos(el*_W18_D)/(6371+350);return 1/Math.sqrt(1-s*s);}

  /* ---- 1 節の後: 2 つの周波数の擬似距離と、電離層フリー結合 ---- */
  REG.w18_ionofree=function(el,U){
    var S=U.S;
    U.head(el,"IONOSPHERE-FREE","2 つの周波数の遅れと雑音、電離層フリー結合");
    var r1=U.ctrls(el);
    var sF=U.select(r1,"周波数の組",_W18_F2.map(function(q){return q[0];}),0,function(){draw();});
    var sT=U.slider(r1,"TEC",{min:1,max:150,step:1,value:25,fmt:function(v){return v+" TECU";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var sE=U.slider(r2,"仰角",{min:5,max:90,step:1,value:30,fmt:function(v){return v+"°";},onInput:function(){draw();}});
    var sS=U.slider(r2,"マルチパスと雑音（1 つの周波数）",{min:0.1,max:3,step:0.01,value:1.12,fmt:function(v){return _w18_f(v,2)+" m";},onInput:function(){draw();}});
    var br=U.btnrow(el),seed=1;
    U.button(br,"本文の例（L1/L2・25 TECU・30°・1.12 m）",function(){sF.set(0);sT.set(25);sE.set(30);sS.set(1.12);seed=1;draw();});
    U.button(br,"L1/L5 にする",function(){sF.set(1);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var q=_W18_F2[sF.get()],f2=q[1],tec=sT.get(),th=sE.get(),sg=sS.get(),nar=_w18_nar(box),Wd=nar?400:700,o=[];
      var cf=_w18_coef(_W18_F1,f2),kk=_w18_k(_W18_F1,f2),mI=_w18_mI(th),I1=_w18_iono(tec,_W18_F1)*mI,I2=I1*Math.pow(_W18_F1/f2,2);
      /* 乱数で 2 つの周波数のマルチパスと雑音を作る */
      var rng=U.rng(seed*7919+18),N=4000,a1=[],a2=[],aI=[],s1=0,s2=0,sI=0,m1=0,m2=0,mIf=0;
      for(var i=0;i<N;i++){var x1=rng.normal()*sg,x2=rng.normal()*sg,p1=I1+x1,p2=I2+x2,pf=cf[0]*p1-cf[1]*p2;
        if(i<200){a1.push(p1);a2.push(p2);aI.push(pf);}m1+=p1;m2+=p2;mIf+=pf;s1+=p1*p1;s2+=p2*p2;sI+=pf*pf;}
      m1/=N;m2/=N;mIf/=N;var d1=Math.sqrt(s1/N-m1*m1),d2=Math.sqrt(s2/N-m2*m2),dI=Math.sqrt(sI/N-mIf*mIf);
      /* (a) 項ごとの帯 */
      var x0=nar?8:14,lw=nar?44:52,xa=x0+lw+52,sc=Math.min(16,(nar?222:212)/Math.max(I2*cf[1],1));
      o.push(S.T(x0,16,"(a) 1 つの衛星の擬似距離（D は共通の項。縮めて描いた）","start",nar?9.5:10.5,"ink",true));
      function bar(y,lab,iono,col,dash,txt){o.push(S.TX(x0+lw,y+13,lab,"end",10.5,col||"ink",true));
        o.push(S.RECT(xa-50,y,48,18,2,U.soft("signal"),"signal",1.1));o.push(S.T(xa-26,y+13,"D","middle",10,"signal",true));
        if(iono>0.0005){o.push(S.RECT(xa,y,iono*sc,18,2,dash?"none":U.soft("gold"),"gold",1.1,dash?"3 2":null));}
        o.push(S.TX(xa+Math.max(iono,0)*sc+5,y+13,txt,"start",9.5,"gold",true,true));}
      bar(28,"ρ_1",I1,null,false,"I_1 = "+_w18_f(I1,2)+" m");
      bar(52,"ρ_2",I2,null,false,"I_2 = "+_w18_f(I2,2)+" m");
      o.push(S.T(x0+lw,90,"× "+_w18_f(cf[0],3),"end",10,"ink",true));o.push(S.RECT(xa,78,I1*cf[0]*sc,14,2,U.soft("gold"),"gold",1));
      o.push(S.T(xa+I1*cf[0]*sc+5,90,"+"+_w18_f(I1*cf[0],2)+" m","start",9.5,"gold",true,false,null,true));
      o.push(S.T(x0+lw,110,"× (−"+_w18_f(cf[1],3)+")","end",10,"ink",true));o.push(S.RECT(xa,98,I2*cf[1]*sc,14,2,"none","gold",1,"3 2"));
      o.push(S.T(xa+I2*cf[1]*sc+5,110,"−"+_w18_f(I2*cf[1],2)+" m","start",9.5,"gold",true,false,null,true));
      o.push(S.L(x0,120,nar?392:396,120,"line",1));
      bar(126,"ρ_IF",0,"green",false,"電離層 "+_w18_f(I1*cf[0]-I2*cf[1],2)+" m");
      /* (b) 乱数で作った 200 回の値 */
      var bx=nar?60:420,by=nar?182:40,bw=nar?320:262,P=U.plot(bx,by,bw,120,[-12,Math.max(16,I2+4*sg)],[0,3]);
      o.push(S.T(nar?x0:bx-40,by-18,"(b) D を引いた残り（200 回）","start",nar?9.5:10.5,"ink",true));
      o.push(P.axes({xt:U.nice(-12,Math.max(16,I2+4*sg),6),yt:[],sz:9,xl:"値 [m]",xfmt:function(v){return _w18_f(v,0);}}));
      var jr=U.rng(seed+5);
      [[a1,"ρ_1 − D","gold",m1,d1],[a2,"ρ_2 − D","gold",m2,d2],[aI,"ρ_IF − D","green",mIf,dI]].forEach(function(r,k){var yc=2.5-k;
        o.push(S.TX(P.x-6,P.Y(yc)+4,r[1],"end",9.5,"ink",true));
        r[0].forEach(function(v){if(v>P.xr[0]&&v<P.xr[1])o.push(S.D(P.X(v),P.Y(yc+0.56*(jr.next()-0.5)),r[2],1.2));});
        o.push(S.L(P.X(Math.max(P.xr[0],Math.min(P.xr[1],r[3]))),P.Y(yc)-12,P.X(Math.max(P.xr[0],Math.min(P.xr[1],r[3]))),P.Y(yc)+12,"ink",2));});
      /* (c) UERE */
      var cy=nar?by+180:200,u1=Math.sqrt(_W18_B7[0]*_W18_B7[0]+Math.pow(0.5*I1,2)+_W18_B7[2]*_W18_B7[2]+sg*sg),uf=Math.sqrt(_W18_B7[0]*_W18_B7[0]+_W18_B7[2]*_W18_B7[2]+Math.pow(kk*sg,2));
      var cx=nar?118:150,cw=nar?200:400,um=Math.max(u1,uf)*1.15;
      o.push(S.T(x0,cy-6,"(c) UERE（7 章の予算。電離層はクロブッチャー・モデルで直した後の半分が残るとした）","start",nar?9:10.5,"ink",true));
      [["L1 だけ",u1,"alias"],["2 周波（"+q[2]+"）",uf,"green"]].forEach(function(r,k){var y=cy+6+k*24;
        o.push(S.T(cx-8,y+13,r[0],"end",10,"ink",true));o.push(S.RECT(cx,y,cw*r[1]/um,18,2,U.soft(r[2]),r[2],1.2));
        o.push(S.T(cx+cw*r[1]/um+5,y+13,_w18_f(r[1],2)+" m","start",10,r[2],true,false,null,true));});
      box.set(S.svg(Wd,cy+60,o));
      var be=Math.sqrt(kk*kk-1)*sg,win=uf<u1;
      var h="係数 "+_w18_f(cf[0],3)+"・−"+_w18_f(cf[1],3)+"（和 "+_w18_f(cf[0]-cf[1],3)+"）。斜めの遅れ（マッピング関数 "+_w18_f(mI,2)+" 倍）I<sub>1</sub> = <b>"+_w18_f(I1,2)+" m</b>、I<sub>2</sub> = "+_w18_f(I2,2)+" m → 結合の後 <b>"+_w18_f(I1*cf[0]-I2*cf[1],2)+" m</b><br>";
      h+="マルチパスと雑音の倍率 κ = √(f<sub>1</sub><sup>4</sup> + f<sub>2</sub><sup>4</sup>)/(f<sub>1</sub><sup>2</sup> − f<sub>2</sub><sup>2</sup>) = <b>"+_w18_f(kk,3)+"</b>、乱数 "+N+" 回で "+_w18_f(dI/Math.sqrt((d1*d1+d2*d2)/2),3)+"（σ: "+_w18_f(d1,2)+" m・"+_w18_f(d2,2)+" m → "+_w18_f(dI,2)+" m）<br>";
      h+="電離層の誤差（遅れの半分）σ<sub>I</sub> = "+_w18_f(0.5*I1,2)+" m。2 周波が得をする境目 √(κ<sup>2</sup> − 1)σ = <b>"+_w18_f(be,2)+" m</b> → "+(win?'<span class="ok">2 周波のほうが UERE が小さい</span>':'<span class="warn">L1 だけのほうが UERE が小さい</span>');
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 4 節の後: PPP の収束（図の f18.py と同じモデル） ---- */
  var _W18_SYSS={GPS:["GPS"],ALL:["GPS","Galileo","BeiDou","QZSS"]},_W18_EPC={};
  function _w18_mT(el){var s=Math.sin(el*_W18_D);return 1.001/Math.sqrt(0.002001+s*s);}
  /* 観測の時刻ごとの、見える衛星 [名前, 仰角, 方位角]（東京、仰角マスク以上） */
  function _w18_epochs(U,sysk,dt,T,mask){var key=sysk+"|"+dt+"|"+T+"|"+mask;if(_W18_EPC[key])return _W18_EPC[key];
    var con=U.gnss.constellation(),rx=U.gnss.rx(U.gnss.TOKYO[0],U.gnss.TOKYO[1],U.gnss.TOKYO[2]),sys=_W18_SYSS[sysk],ep=[];
    for(var k=0;k<=Math.round(T/dt);k++){var t=k*dt,v=[];con.forEach(function(s){if(sys.indexOf(s.sys)<0)return;var ea=U.gnss.elaz(rx,U.gnss.ecef(s,t));if(ea[0]>=mask)v.push([s.nm,ea[0],ea[1]]);});ep.push({t:t,v:v});}
    _W18_EPC[key]=ep;return ep;}
  /* 2 次元の正規分布で 95 % が入る円の半径（f18.py の _f18_r95 と同じ計算） */
  function _w18_r95(a,b,c){var m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b),s1=Math.sqrt(m+r),s2=Math.sqrt(Math.max(m-r,1e-30)),q=[],i;
    for(i=0;i<720;i++){var ph=2*Math.PI*i/720,cc=Math.cos(ph),ss=Math.sin(ph);q.push(cc*cc/(s1*s1)+ss*ss/(s2*s2));}
    var lo=0,hi=10*(s1+s2);for(var it=0;it<60;it++){var md=(lo+hi)/2,sm=0;for(i=0;i<720;i++)sm+=(1-Math.exp(-md*md*q[i]/2))/q[i];if(sm/720/(s1*s2)<0.95)lo=md;else hi=md;}
    return (lo+hi)/2;}
  /* モデル: 位置（東・北・上）・対流圏の湿潤の部分（tropo のとき）・衛星ごとの実数の β を、観測ごとに受信機の時計を消して最小二乗法で推定する。
     返り値 [{t, n（見える衛星の数）, r95, su（上の標準偏差）, e, nn（乱数で作った 1 回の推定の誤差）}] */
  function _w18_conv(U,o){var ep=_w18_epochs(U,o.sys,30,3600,10),names=[],off=o.tropo?4:3,mat=U.ctl.mat;
    ep.forEach(function(e){e.v.forEach(function(q){if(names.indexOf(q[0])<0)names.push(q[0]);});});
    var nx=off+names.length,J=mat.zeros(nx,nx),z=[],seen=[],out=[],rng=U.rng(o.seed||1),i,j;
    for(i=0;i<nx;i++)z.push(0);
    ep.forEach(function(e){var rows=[],W=[],ev=[];
      e.v.forEach(function(q){var jj=off+names.indexOf(q[0]);if(seen.indexOf(jj)<0)seen.push(jj);
        var ce=Math.cos(q[1]*_W18_D),se=Math.sin(q[1]*_W18_D),h=[];for(var k=0;k<nx;k++)h.push(0);
        h[0]=-ce*Math.sin(q[2]*_W18_D);h[1]=-ce*Math.cos(q[2]*_W18_D);h[2]=-se;if(o.tropo)h[3]=_w18_mT(q[1]);
        var g=h.slice();g[jj]=1;rows.push(h);W.push(1/(o.sP*o.sP));ev.push(rng.normal()*o.sP);rows.push(g);W.push(1/(o.sL*o.sL));ev.push(rng.normal()*o.sL);});
      var sw=0,swe=0,u=[];for(i=0;i<nx;i++)u.push(0);
      rows.forEach(function(h,r){sw+=W[r];swe+=W[r]*ev[r];for(i=0;i<nx;i++)if(h[i]!==0)u[i]+=W[r]*h[i];});
      rows.forEach(function(h,r){for(i=0;i<nx;i++){if(h[i]===0)continue;z[i]+=W[r]*h[i]*ev[r];for(j=0;j<nx;j++)if(h[j]!==0)J[i][j]+=W[r]*h[i]*h[j];}});
      for(i=0;i<nx;i++){z[i]-=u[i]*swe/sw;if(u[i]===0)continue;for(j=0;j<nx;j++)if(u[j]!==0)J[i][j]-=u[i]*u[j]/sw;}
      var idx=[];for(i=0;i<off;i++)idx.push(i);seen.slice().sort(function(a,b){return a-b;}).forEach(function(v){idx.push(v);});
      var Js=idx.map(function(a){return idx.map(function(b){return J[a][b];});}),Cv=mat.inv(Js),xe=0,xn=0;
      for(i=0;i<idx.length;i++){xe+=Cv[0][i]*z[idx[i]];xn+=Cv[1][i]*z[idx[i]];}
      out.push({t:e.t,n:e.v.length,r95:_w18_r95(Cv[0][0],Cv[0][1],Cv[1][1]),su:Math.sqrt(Cv[2][2]),e:xe,nn:xn});});
    return out;}
  function _w18_tconv(res,th){for(var i=0;i<res.length;i++){var ok=true;for(var j=i;j<res.length;j++)if(res[j].r95>=th){ok=false;break;}if(ok)return res[i].t;}return null;}
  var _W18_RTK=[10,0.8,0.02],_W18_CLAS=[60,1.5,0.06];   /* 比べる代表値（モデルではない）: 整数が決まる時刻 [s]・それまでと後の R95 [m]。PPP-RTK は 5 節の CLAS の基準の値 */

  REG.w18_converge=function(el,U){
    var S=U.S;
    U.head(el,"PPP CONVERGENCE","PPP の水平の誤差が時間とともに縮む様子（モデル）と、RTK・PPP-RTK の代表値");
    var r1=U.ctrls(el);
    var sSys=U.select(r1,"衛星系",["GPS だけ","4 つ（GPS・Galileo・BeiDou・みちびき）"],0,function(){recalc();});
    var sTr=U.select(r1,"対流圏の湿潤の部分",["推定する","補正で直す"],0,function(){recalc();});
    var r2=U.ctrls(el);
    var sP=U.slider(r2,"擬似距離の誤差 σ（結合の後）",{min:0.3,max:5,step:0.01,value:3.33,fmt:function(v){return _w18_f(v,2)+" m";},onInput:function(){recalc();}});
    var sL=U.slider(r2,"位相の誤差 σ（結合の後）",{min:0.5,max:5,step:0.1,value:2.1,fmt:function(v){return _w18_f(v,1)+" cm";},onInput:function(){recalc();}});
    var br=U.btnrow(el),seed=1,cur=120,res=null;
    function stopT(){tk.stop();}
    U.button(br,"本文の例（PPP・GPS）",function(){stopT();sSys.set(0);sTr.set(0);sP.set(3.33);sL.set(2.1);seed=1;cur=120;recalc();});
    U.button(br,"電離層・対流圏を補正した例",function(){stopT();sSys.set(0);sTr.set(1);sP.set(1.12);sL.set(2.1);cur=120;recalc();});
    U.button(br,"再生",function(){cur=0;draw();tk.start();});
    U.button(br,"止める",function(){stopT();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;recalc();});
    var tk=U.ticker(function(){if(!res)return;cur++;if(cur>=res.length-1){cur=res.length-1;tk.stop();}draw();},70);
    var box=U.svgbox(el),ro=U.readout(el);
    function recalc(){res=_w18_conv(U,{sys:sSys.get()===0?"GPS":"ALL",tropo:sTr.get()===0,sP:sP.get(),sL:sL.get()/100,seed:seed*104729+18});if(cur>res.length-1)cur=res.length-1;draw();}
    function draw(){if(!res)return;
      var nar=_w18_nar(box),Wd=nar?400:700,o=[],k=cur,rk=res[k],tc=_w18_tconv(res,0.10);
      /* (a) R95 と時間 */
      var P=U.plot(nar?56:62,30,nar?320:380,nar?200:230,[0,60],[0.01,10],{ylog:true});
      o.push(S.T(nar?8:14,16,"(a) 水平の R95 と、始めてからの時間","start",nar?9.5:10.5,"ink",true));
      o.push(P.axes({xl:"時間 [分]",yl:"水平の R95 [m]",xt:[0,10,20,30,40,50,60],yt:[0.01,0.1,1,10],sz:9,yfmt:function(v){return v>=1?String(v):String(v);}}));
      o.push(S.L(P.x,P.Y(0.1),P.x+P.w,P.Y(0.1),"alias",1.2,"5 3"));o.push(S.T(P.x+P.w-3,P.Y(0.1)-4,"10 cm","end",9,"alias",true,false,null,true));
      o.push(S.L(P.x,P.Y(6.6),P.x+P.w,P.Y(6.6),"muted",1.1,"2 3"));o.push(S.T(P.x+P.w-3,P.Y(6.6)-4,"単独 6.6 m","end",9,"muted",true,false,null,true));
      [[_W18_RTK,"green"],[_W18_CLAS,"purple"]].forEach(function(r){var q=r[0];o.push(P.clip([[0,q[1]],[q[0]/60,q[1]],[q[0]/60,q[2]],[60,q[2]]],r[1],1.8,"7 3"));});
      o.push(S.T(P.X(2.5),P.Y(0.02)-4,"RTK（代表値）","start",9,"green",true,false,null,true));
      o.push(S.T(P.X(2.5),P.Y(0.06)-4,"PPP-RTK（代表値。5 節）","start",9,"purple",true,false,null,true));
      o.push(P.clip(res.map(function(r){return [r.t/60,r.r95];}),"gold",1.2,"3 3"));
      o.push(P.clip(res.slice(0,k+1).map(function(r){return [r.t/60,r.r95];}),"gold",2.4));
      res.slice(0,k+1).forEach(function(r){var hv=Math.hypot(r.e,r.nn);if(hv>0.01&&hv<10)o.push(S.D(P.X(r.t/60),P.Y(hv),"teal",1.8));});
      o.push(S.L(P.X(rk.t/60),P.y,P.X(rk.t/60),P.y+P.h,"ink",1,"2 2"));
      if(tc!==null){o.push(S.L(P.X(tc/60),P.Y(0.1),P.X(tc/60),P.y+P.h,"gold",1,"2 2"));o.push(S.T(P.X(tc/60)+3,P.y+P.h-5,_w18_f(tc/60,1)+" 分","start",9,"gold",true,false,null,true));}
      o.push(S.LEGL(nar?8:14,P.y+P.h+46,[["gold",null,"R95（モデル）"],["teal",null,"1 回の推定の誤差（点）"]],9,12));
      /* (b) 東西・南北の平面 */
      var lim=1.0,cx=nar?60:500,cy=nar?P.y+P.h+86:44,cw=nar?260:180,Q=U.plot(cx,cy,cw,cw,[-lim,lim],[-lim,lim]);
      o.push(S.T(nar?8:cx-20,cy-14,"(b) 推定した位置の誤差 [m]","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(Q.x,Q.y,Q.w,Q.h,2,"var(--screen)","line",1));o.push(Q.axes({xt:[-1,-0.5,0,0.5,1],yt:[-1,-0.5,0,0.5,1],sz:8.5,xfmt:function(v){return _w18_f(v,1);},yfmt:function(v){return _w18_f(v,1);}}));
      [0.1,0.5].forEach(function(r){var c=[];for(var a=0;a<=72;a++)c.push([r*Math.cos(2*Math.PI*a/72),r*Math.sin(2*Math.PI*a/72)]);o.push(Q.clip(c,"faint",1,"3 3"));});
      var cr=[];for(var a=0;a<=96;a++)cr.push([rk.r95*Math.cos(2*Math.PI*a/96),rk.r95*Math.sin(2*Math.PI*a/96)]);o.push(Q.clip(cr,"gold",1.8,"5 3"));
      var tr=res.slice(Math.max(0,k-40),k+1).map(function(r){return [Math.max(-lim,Math.min(lim,r.e)),Math.max(-lim,Math.min(lim,r.nn))];});
      if(tr.length>1)o.push(Q.line(tr,"teal",1.1));
      o.push(S.L(Q.X(0)-6,Q.Y(0),Q.X(0)+6,Q.Y(0),"green",2));o.push(S.L(Q.X(0),Q.Y(0)-6,Q.X(0),Q.Y(0)+6,"green",2));
      var ex=Math.max(-lim,Math.min(lim,rk.e)),ey=Math.max(-lim,Math.min(lim,rk.nn));o.push(S.D(Q.X(ex),Q.Y(ey),"teal",4.5));
      o.push(S.T(Q.x+Q.w/2,Q.y+Q.h+30,"横: 東西、縦: 南北。破線の円: 10 cm・50 cm","middle",8.5,"muted"));
      o.push(S.T(Q.x+Q.w/2,Q.y+Q.h+43,"金の破線: R95（モデル）","middle",8.5,"gold",true));
      box.set(S.svg(Wd,nar?cy+cw+56:Math.max(P.y+P.h+60,cy+cw+56),o));
      var hv=Math.hypot(rk.e,rk.nn);
      var h="時刻 <b>"+_w18_f(rk.t/60,1)+" 分</b>（"+(k+1)+" 回目のエポック）・見えている衛星 "+rk.n+"・R95（モデル）<b>"+_w18_f(100*rk.r95,1)+" cm</b>・上の標準偏差 "+_w18_f(100*rk.su,1)+" cm・この回の水平の誤差 "+_w18_f(100*hv,1)+" cm<br>";
      h+="R95 が 10 cm を下回って保つまで: "+(tc===null?'<span class="warn">60 分では届かない</span>':"<b>"+_w18_f(tc/60,1)+" 分</b>")+"（RTK は数秒〜数十秒、PPP-RTK は 1 分ほど。どちらも代表値）";
      h+='<div class="wnote">東京の止まった受信機、1 章の配置、仰角 10° 以上、30 s ごとのエポック。未知数は位置・受信機の時計（エポックごと）・'+(sTr.get()===0?"対流圏の湿潤の部分・":"")+'衛星ごとの実数の整数値バイアス。誤差はエポックごとに独立な正規分布（実際の誤差はゆっくり変わるので、収束はこれより遅く、数 cm で止まる）。</div>';
      ro.innerHTML=h;
    }
    recalc();
  };

  /* ---- 6 節の後: 条件に合う方式 ---- */
  /* 名前, 初期化の時間 [s] の範囲, 水平の 95 % [m] の範囲, 色, 受信機（0 L1 だけ・1 多周波・2 多周波と L6）, 通信が要るか, 場所（0 どこでも・1 日本・2 アジア・オセアニア・3 SBAS の範囲） */
  var _W18_METH=[["単独（L1）",[1,35],[3.6,8.2],"signal",0,false,0],["SBAS",[40,300],[1.5,3.0],"signal",0,false,3],["SLAS",[40,300],[0.6,1.0],"signal",0,false,1],
    ["DGNSS",[3,30],[1.5,3.0],"signal",0,true,0],["RTK",[2,60],[0.01,0.04],"green",1,true,0],["CLAS",[20,60],[0.04,0.12],"purple",2,false,1],
    ["PPP（インターネット）",[600,1800],[0.05,0.3],"gold",1,true,0],["PPP（MADOCA の L6E）",[600,1800],[0.05,0.3],"gold",2,false,2]];
  REG.w18_choose=function(el,U){
    var S=U.S;
    U.head(el,"CHOOSE A METHOD","要る精度・待てる時間・通信・受信機・場所から、合う方式を選ぶ");
    var accs=[10,3,1,0.3,0.1,0.03],tms=[10,60,300,1800,3600];
    var r1=U.ctrls(el);
    var sA=U.select(r1,"要る水平の精度（95 %）",["10 m","3 m","1 m","30 cm","10 cm","3 cm"],3,function(){draw();});
    var sT=U.select(r1,"待てる初期化の時間",["10 s","1 分","5 分","30 分","1 時間"],1,function(){draw();});
    var r2=U.ctrls(el);
    var sC=U.select(r2,"通信",["使えない","インターネットか無線がある"],0,function(){draw();});
    var sR=U.select(r2,"受信機",["L1 だけ","多周波","多周波と L6"],2,function(){draw();});
    var sL=U.select(r2,"場所",["日本と沿岸","アジア・オセアニア（日本の外）","そのほか"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（30 cm・1 分・通信なし・L6 も・日本）",function(){sA.set(3);sT.set(1);sC.set(0);sR.set(2);sL.set(0);draw();});
    U.button(br,"ロガーの例（3 m・1 分・通信なし・L1 だけ）",function(){sA.set(1);sT.set(1);sC.set(0);sR.set(0);sL.set(0);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function judge(m){var A=accs[sA.get()],Tm=tms[sT.get()],com=sC.get()===1,rx=sR.get(),loc=sL.get(),why=[];
      var okA=m[2][1]<=A,okT=m[1][1]<=Tm,okR=rx>=m[4],okC=com||!m[5],okL=m[6]===0||(m[6]===1&&loc===0)||(m[6]===2&&loc<=1)||(m[6]===3&&loc===0);
      if(m[6]===3&&loc!==0)okL=null;   /* SBAS は地域による */
      return {a:okA,t:okT,r:okR,c:okC,l:okL,all:okA&&okT&&okR&&okC&&okL===true};}
    function draw(){
      var nar=_w18_nar(box),Wd=nar?400:700,o=[],A=accs[sA.get()],Tm=tms[sT.get()];
      var P=U.plot(nar?66:72,26,nar?310:580,nar?220:250,[1,3600],[0.01,20],{xlog:true,ylog:true});
      o.push(P.axes({xl:"初期化の時間 [s]",yl:"水平の 95 % の値 [m]",xt:[1,10,60,600,3600],yt:[0.01,0.1,1,10],sz:9,
        xfmt:function(v){return {1:"1 s",10:"10 s",60:"1 分",600:"10 分",3600:"1 時間"}[v];},yfmt:function(v){return {0.01:"1 cm",0.1:"10 cm",1:"1 m",10:"10 m"}[v];}}));
      o.push(S.RECT(P.X(1),P.Y(A),P.X(Tm)-P.X(1),P.Y(0.01)-P.Y(A),0,U.soft("green"),"green",1.4,"5 3"));
      o.push(S.T(P.X(1)+4,P.Y(A)+13,"条件を満たす範囲","start",9,"green",true,false,null,true));
      var res=_W18_METH.map(function(m){return judge(m);});
      _W18_METH.forEach(function(m,i){if(i===7)return;var j=res[i],any=j.all||(i===6&&res[7].all),c=any?m[3]:"muted";
        o.push(S.RECT(P.X(m[1][0]),P.Y(m[2][1]),P.X(m[1][1])-P.X(m[1][0]),P.Y(m[2][0])-P.Y(m[2][1]),3,any?U.soft(m[3]):"none",c,any?2.2:1.1,any?null:"3 2"));
        var nm=i===6?"PPP":m[0];o.push(S.T(i===3?P.X(m[1][0])-4:P.X(m[1][1])+4,i===3?P.Y(m[2][0])+12:P.Y(m[2][1])-4,nm,i===3?"end":"start",9.5,c,true,false,null,true));});
      box.set(S.svg(Wd,P.y+P.h+44,o));
      function mk(v){return v===true?'<span class="ok">○</span>':(v===null?"地域による":'<span class="warn">×</span>');}
      var rows=_W18_METH.map(function(m,i){var j=res[i];return [(j.all?"<b>":"")+m[0]+(j.all?"</b>":""),mk(j.a),mk(j.t),mk(j.r),mk(j.c),mk(j.l),j.all?'<span class="ok">合う</span>':"—"];});
      var ok=_W18_METH.filter(function(m,i){return res[i].all;}).map(function(m){return m[0];});
      ro.innerHTML="合う方式: <b>"+(ok.length?ok.join("・"):"なし（条件をゆるめる）")+"</b>"+U.tbl(["方式","精度","時間","受信機","通信","場所","判定"],rows,["left","center","center","center","center","center","center"])+
        '<div class="wnote">精度と時間は、図の範囲の悪い側の端（代表値・公式の基準）で判定した。RTK は多周波の受信機とした（L1 だけの RTK もあるが、初期化が長い）。SBAS は、日本では MSAS が使える。</div>';
    }
    draw();
  };

  /* ===== 19 章 慣性センサとの融合 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w19_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w19_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 例の値（本文・図の f19.py と同じ） */
  var _W19_TS=0.01,_W19_SA=0.02,_W19_SB=3e-4,_W19_SY=2.0,_W19_BA=0.05,_W19_BAN=-0.03,_W19_BGD=0.05,_W19_SGD=0.05,_W19_V0=20,_W19_G=9.8,_W19_D=Math.PI/180,_W19_S0=[2,1,0.1],_W19_SM=3.0;
  /* 4 節の例の本当の加速度: 10 s から加速して 20 m/s、100〜105 s で 10 m/s まで減速、125〜130 s で 20 m/s へ */
  function _w19_acc1(t){if(t<10)return 0;if(t<30)return 1;if(t>=100&&t<105)return -2;if(t>=125&&t<130)return 2;return 0;}
  /* 本当の位置・速度・加速度（1 周期ごと） */
  function _w19_truth(N,accf){var P=new Float64Array(N+1),V=new Float64Array(N+1),A=new Float64Array(N+1),p=0,v=0,T=_W19_TS;
    for(var k=0;k<=N;k++){var a=accf(k*T);P[k]=p;V[k]=v;A[k]=a;p+=v*T+0.5*a*T*T;v+=a*T;}return {P:P,V:V,A:A};}
  /* 予測 1 周期（本文 4 節の A_d・B_d・W。S は対称な 3 行 3 列）。f19.py の _f19_pred と同じ式 */
  function _w19_pred(x,S,u,T,sa2,qb){var h=T*T/2,a=u-x[2];
    var s00=S[0][0],s01=S[0][1],s02=S[0][2],s11=S[1][1],s12=S[1][2],s22=S[2][2];
    var r00=s00+T*s01-h*s02,r01=s01+T*s11-h*s12,r02=s02+T*s12-h*s22,r11=s11-T*s12,r12=s12-T*s22;
    var n00=r00+T*r01-h*r02+sa2*h*h,n01=r01-T*r02+sa2*h*T,n02=r02,n11=r11-T*r12+sa2*T*T,n12=r12,n22=s22+qb;
    return [[x[0]+T*x[1]+h*a,x[1]+T*a,x[2]],[[n00,n01,n02],[n01,n11,n12],[n02,n12,n22]]];}
  /* 更新（状態の j 番目に分散 V の雑音が加わった観測 y）。返り値 [x, S, イノベーション, その分散] */
  function _w19_upd(x,S,j,y,V){var e=y-x[j],Sv=S[j][j]+V,H=[S[0][j]/Sv,S[1][j]/Sv,S[2][j]/Sv],r=[S[j][0],S[j][1],S[j][2]],nx=[],nS=[[0,0,0],[0,0,0],[0,0,0]];
    for(var i=0;i<3;i++){nx.push(x[i]+H[i]*e);for(var k=0;k<3;k++)nS[i][k]=S[i][k]-H[i]*r[k];}return [nx,nS,e,Sv];}
  /* 1 つの軸の融合（f19.py の _f19_kf1 と同じ計算・同じ乱数の列）。
     o: seed・bias（バイアスを状態に入れるか）・wscale（W の倍率）・tun [始, 終]・Tu・sy・ba（本当のバイアス）・sa（本当の雑音）・
        sb・s0（初めの標準偏差）・Tend・acc（本当の加速度の関数）・axis（0: 東、1: 北の乱数を使う）・every。返り値は記録 */
  function _w19_kf1(U,o){
    var T=_W19_TS,N=Math.round(o.Tend/T),m=Math.round(o.Tu/T),rI=U.rng(o.seed*7+1),rG=U.rng(o.seed*7+2),tr=_w19_truth(N,o.acc);
    var sa2=o.sa*o.sa*(o.wscale||1),qb=o.bias?(o.sb*o.sb*T):0,s0=o.s0||_W19_S0,x=[0,0,0],S=[[s0[0]*s0[0],0,0],[0,s0[1]*s0[1],0],[0,0,o.bias?s0[2]*s0[2]:0]],first=true;
    var ev=o.every||10,R={t:[],err:[],sp:[],b:[],sb:[],xe:[],gt:[],ge:[]};
    for(var k=0;k<=N;k++){var t=k*T;
      if(k%m===0){var n1=rG.normal(),n2=rG.normal(),gn=o.axis?n2:n1;
        if(!(t>=o.tun[0]&&t<o.tun[1])){var y=tr.P[k]+o.sy*gn;R.gt.push(t);R.ge.push(o.sy*gn);
          if(first){x[0]=y;first=false;}else{var q=_w19_upd(x,S,0,y,o.sy*o.sy);x=q[0];S=q[1];}}}
      if(k%ev===0){R.t.push(t);R.err.push(x[0]-tr.P[k]);R.sp.push(Math.sqrt(Math.max(S[0][0],0)));R.b.push(x[2]);R.sb.push(Math.sqrt(Math.max(S[2][2],0)));R.xe.push(x[0]);}
      var a1=rI.normal(),a2=rI.normal(),u=tr.A[k]+o.ba+o.sa*(o.axis?a2:a1);
      var pq=_w19_pred(x,S,u,T,sa2,qb);x=pq[0];S=pq[1];}
    R.P=tr.P;R.V=tr.V;return R;}
  /* IMU を使わないフィルタ（13 章 4 節の動きのモデル。f19.py の _f19_kfm と同じ）。0.1 s ごとの予測の値も記録する */
  function _w19_kfm(U,o){
    var T=_W19_TS,N=Math.round(o.Tend/T),m=Math.round(o.Tu/T),Tu=o.Tu,rG=U.rng(o.seed*7+2),tr=_w19_truth(N,o.acc),sm=_W19_SM,sub=Math.max(1,Math.round(Tu/0.1));
    var x=[0,0],S=[[_W19_S0[0]*_W19_S0[0],0],[0,_W19_S0[1]*_W19_S0[1]]],first=true,R={t:[],err:[],sp:[],xe:[],gt:[],ge:[]};
    for(var k=0;k<=N;k+=m){var t=k*T,n1=rG.normal(),n2=rG.normal(),gn=o.axis?n2:n1;
      if(!(t>=o.tun[0]&&t<o.tun[1])){var y=tr.P[k]+o.sy*gn;R.gt.push(t);R.ge.push(o.sy*gn);
        if(first){x=[y,0];first=false;}
        else{var e=y-x[0],Sv=S[0][0]+o.sy*o.sy,H0=S[0][0]/Sv,H1=S[1][0]/Sv;x=[x[0]+H0*e,x[1]+H1*e];
          S=[[S[0][0]-H0*S[0][0],S[0][1]-H0*S[0][1]],[S[1][0]-H1*S[0][0],S[1][1]-H1*S[0][1]]];}}
      for(var j=0;j<sub;j++){var tau=Tu*j/sub,kk=Math.min(N,k+Math.round(tau/T)),s00=S[0][0]+2*tau*S[0][1]+tau*tau*S[1][1]+sm*sm*Math.pow(tau*tau/2,2);
        R.t.push(t+tau);R.err.push(x[0]+x[1]*tau-tr.P[kk]);R.sp.push(Math.sqrt(s00));R.xe.push(x[0]+x[1]*tau);}
      var a2=Tu*Tu/2;x=[x[0]+Tu*x[1],x[1]];
      S=[[S[0][0]+2*Tu*S[0][1]+Tu*Tu*S[1][1]+sm*sm*a2*a2,S[0][1]+Tu*S[1][1]+sm*sm*a2*Tu],[S[0][1]+Tu*S[1][1]+sm*sm*a2*Tu,S[1][1]+sm*sm*Tu*Tu]];}
    return R;}
  /* 記録 R の中で、時刻 tt に最も近い番号 */
  function _w19_at(R,tt){var b=0,bd=1e9;for(var i=0;i<R.t.length;i++){var d=Math.abs(R.t[i]-tt);if(d<bd){bd=d;b=i;}}return b;}
  /* 時間の軸の帯（Plot P の上。xs の各点で lo〜hi） */
  function _w19_band(U,P,xs,lo,hi,c){var y0=Math.min(P.yr[0],P.yr[1]),y1=Math.max(P.yr[0],P.yr[1]),pts=[];
    function cl(v){return Math.max(y0,Math.min(y1,v));}
    for(var i=0;i<xs.length;i++)pts.push([P.X(xs[i]),P.Y(cl(hi[i]))]);for(var j=xs.length-1;j>=0;j--)pts.push([P.X(xs[j]),P.Y(cl(lo[j]))]);
    return U.S.PL(pts,"none",0,U.soft(c),null,0.75);}
  /* 間引いた点の並び */
  function _w19_pts(xs,ys,step,t0,t1){var o=[];for(var i=0;i<xs.length;i+=step){if(t0!=null&&(xs[i]<t0||xs[i]>t1))continue;o.push([xs[i],ys[i]]);}return o;}
  /* 誤差の楕円（7 章と同じ: 2 行 2 列の共分散から、長い半径・短い半径・向き） */
  function _w19_ell(a,b,c){var m=(a+c)/2,r=Math.sqrt((a-c)*(a-c)/4+b*b);return [Math.sqrt(m+r),Math.sqrt(Math.max(m-r,0)),0.5*Math.atan2(2*b,a-c)];}
  function _w19_ellpts(s1,s2,ang,cx,cy,k){var o=[];for(var i=0;i<=72;i++){var t=2*Math.PI*i/72,u=k*s1*Math.cos(t),v=k*s2*Math.sin(t);o.push([cx+u*Math.cos(ang)-v*Math.sin(ang),cy+u*Math.sin(ang)+v*Math.cos(ang)]);}return o;}

  /* ---- 3 節の後: 慣性航法だけで進めた位置のずれ（平面のモデル。f19.py の _f19_dr と同じ計算・同じ乱数の列） ---- */
  /* 街の道（例）: 15 m/s で東へ、左へ 90° 曲がって北へ、減速して右へ 90° 曲がり、加速する */
  function _w19_city(t){if(t>=20&&t<26)return [0,-15*_W19_D];if(t>=34&&t<38)return [-2.5,0];if(t>=40&&t<46)return [0,15*_W19_D];if(t>=46&&t<51)return [2,0];return [0,0];}
  function _w19_dr(U,o){var r=U.rng(o.seed*7+4),T=_W19_TS,N=Math.round(o.Tend/T),G=_W19_G,D=_W19_D;
    var s=o.v0,ps=90*D,e=0,n=0,s2=o.v0,ps2=90*D,e2=0,n2=0,th2=0,R={t:[],e:[],n:[],e2:[],n2:[],al:[],cr:[],ps:[]};
    for(var k=0;k<=N;k++){var t=k*T;
      if(k%10===0){var de=e2-e,dn=n2-n;R.t.push(t);R.e.push(e);R.n.push(n);R.e2.push(e2);R.n2.push(n2);R.al.push(de*Math.sin(ps)+dn*Math.cos(ps));R.cr.push(de*Math.cos(ps)-dn*Math.sin(ps));R.ps.push(ps);}
      var aw=o.route(t),a=aw[0],w=aw[1],z0=r.normal(),z1=r.normal(),z2=r.normal();
      var am=a+o.ba+_W19_SA*o.noise*z0,wm=w+(o.bg+_W19_SGD*o.noise*z1)*D,qm=o.bp?(o.bp+_W19_SGD*o.noise*z2)*D:0;
      th2+=qm*T;var af=am*Math.cos(th2)+G*Math.sin(th2);
      e2+=s2*Math.sin(ps2)*T+0.5*af*Math.sin(ps2)*T*T;n2+=s2*Math.cos(ps2)*T+0.5*af*Math.cos(ps2)*T*T;s2+=af*T;ps2+=wm*T;
      e+=s*Math.sin(ps)*T+0.5*a*Math.sin(ps)*T*T;n+=s*Math.cos(ps)*T+0.5*a*Math.cos(ps)*T*T;s+=a*T;ps+=w*T;}
    return R;}
  REG.w19_dr=function(el,U){
    var S=U.S;
    U.head(el,"DEAD RECKONING","慣性航法だけで進めた位置 — バイアスと雑音で、本当の道からずれていく");
    var r1=U.ctrls(el);
    var sRt=U.select(r1,"道",["まっすぐ東へ（本文の例）","街の道（曲がる・止まる）"],0,function(){run();});
    var sV=U.slider(r1,"速さ（まっすぐの道）",{min:5,max:30,step:1,value:20,fmt:function(v){return v+" m/s";},onInput:function(){run();}});
    var sN=U.slider(r1,"雑音（例の値の何倍か）",{min:0,max:5,step:0.5,value:1,fmt:function(v){return "× "+_w19_f(v,1);},onInput:function(){run();}});
    var r2=U.ctrls(el);
    var sBa=U.slider(r2,U.htx("加速度センサのバイアス b_a"),{min:0,max:0.2,step:0.01,value:0.05,fmt:function(v){return _w19_f(v,2)+" m/s²";},onInput:function(){run();}});
    var sBg=U.slider(r2,"ジャイロのバイアス（向き）",{min:0,max:0.2,step:0.01,value:0.05,fmt:function(v){return _w19_f(v,2)+" °/s";},onInput:function(){run();}});
    var sBp=U.slider(r2,"ジャイロのバイアス（傾き。3 次元）",{min:0,max:0.2,step:0.01,value:0,fmt:function(v){return _w19_f(v,2)+" °/s";},onInput:function(){run();}});
    var br=U.btnrow(el),seed=1,R=null,G=null,cur=60,Tend=60;
    var bp=U.button(br,"再生",function(){if(tick.running()){tick.stop();bp.textContent="再生";return;}if(cur>=Tend-1e-9)cur=0;bp.textContent="止める";tick.start();});
    U.button(br,"本文の例",function(){tick.stop();bp.textContent="再生";sRt.set(0);sV.set(20);sN.set(1);sBa.set(0.05);sBg.set(0.05);sBp.set(0);seed=1;cur=Tend;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var tick=U.ticker(function(){cur=Math.min(Tend,cur+1);draw();if(cur>=Tend){tick.stop();bp.textContent="再生";}},70);
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){var city=sRt.get()===1;
      R=_w19_dr(U,{seed:seed,ba:sBa.get(),bg:sBg.get(),bp:sBp.get(),noise:sN.get(),Tend:Tend,route:city?_w19_city:function(){return [0,0];},v0:city?15:sV.get()});
      var rg=U.rng(seed*7+2);G=[];for(var j=0;j<=Tend;j++){var g1=rg.normal(),g2=rg.normal();G.push([j,_W19_SY*g1,_W19_SY*g2]);}
      draw();}
    function draw(){
      var nar=_w19_nar(box),Wd=nar?400:700,o=[],ic=Math.round(cur*10),city=sRt.get()===1;
      /* (a) 上から見た道の全体 */
      var e0=Infinity,e1=-Infinity,n0=Infinity,n1=-Infinity,i;
      for(i=0;i<R.t.length;i++){e0=Math.min(e0,R.e[i],R.e2[i]);e1=Math.max(e1,R.e[i],R.e2[i]);n0=Math.min(n0,R.n[i],R.n2[i]);n1=Math.max(n1,R.n[i],R.n2[i]);}
      var pw=nar?360:390,ph=nar?190:210,spanE=Math.max(e1-e0,50),spanN=Math.max(n1-n0,50),sc=Math.min(pw/spanE,ph/spanN)*0.9;
      var ce=(e0+e1)/2,cn=(n0+n1)/2,ox=nar?20:14,oy=34,P={X:function(v){return ox+pw/2+(v-ce)*sc;},Y:function(v){return oy+ph/2-(v-cn)*sc;}};
      o.push(S.T(nar?10:14,18,"(a) 上から見た道（"+(city?"街の道":"まっすぐ東へ "+sV.get()+" m/s")+"）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(ox,oy,pw,ph,2,"var(--screen)","line",1));
      var L=Math.pow(10,Math.floor(Math.log10(Math.max(spanE,spanN)/3)));o.push(S.L(ox+10,oy+ph-12,ox+10+L*sc,oy+ph-12,"ink",2));o.push(S.T(ox+10+L*sc/2,oy+ph-17,L+" m","middle",9,"ink",false,false,null,true));
      var tr=[],dr=[],full=[];for(i=0;i<=ic&&i<R.t.length;i+=5){tr.push([P.X(R.e[i]),P.Y(R.n[i])]);dr.push([P.X(R.e2[i]),P.Y(R.n2[i])]);}
      for(i=0;i<R.t.length;i+=10)full.push([P.X(R.e[i]),P.Y(R.n[i])]);
      o.push(S.PL(full,"faint",5,null,null));
      if(tr.length>1){o.push(S.PL(tr,"green",2.2));o.push(S.PL(dr,"alias",2));}
      var kc=Math.min(ic,R.t.length-1);
      o.push(S.D(P.X(R.e[kc]),P.Y(R.n[kc]),"green",5));o.push(S.D(P.X(R.e2[kc]),P.Y(R.n2[kc]),"alias",5));
      o.push(S.LEGL(ox+8,oy+16,[["green",null,"本当の道"],["alias",null,"慣性航法だけ"]],9,12));
      /* (b) 車のまわり（中心が本当の位置、右が進む向き） */
      var al=R.al[kc],crs=R.cr[kc],need=Math.max(Math.abs(al),Math.abs(crs),6)*1.15,half=[10,20,50,100,200,500,1000,3000].find(function(v){return v>=need;})||3000;
      var zx=nar?80:470,zy=nar?oy+ph+50:34,zw=nar?250:200,Z=U.plot(zx,zy,zw,zw,[-half,half],[-half,half]);
      o.push(S.T(nar?10:zx-20,zy-14+(nar?0:-2),"(b) 車のまわり（中心が本当の位置）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(Z.x,Z.y,Z.w,Z.h,2,"var(--screen)","line",1));
      o.push(Z.axes({xt:[-half,0,half],yt:[-half,0,half],sz:9,xl:"進む向き [m]",yl:"左 [m]",ylOff:36}));
      o.push(S.L(Z.X(0)-6,Z.Y(0),Z.X(0)+6,Z.Y(0),"green",2));o.push(S.L(Z.X(0),Z.Y(0)-6,Z.X(0),Z.Y(0)+6,"green",2));
      G.forEach(function(gq){if(gq[0]>cur||gq[0]<=cur-5)return;var k=Math.round(gq[0]*10),ps=R.ps[k],ga=gq[1]*Math.sin(ps)+gq[2]*Math.cos(ps),gc=gq[1]*Math.cos(ps)-gq[2]*Math.sin(ps);
        if(Math.abs(ga)<half&&Math.abs(gc)<half)o.push(S.D(Z.X(ga),Z.Y(-gc),"purple",2.6));});
      o.push(S.ARR(Z.X(0),Z.Y(0),Z.X(Math.max(-half,Math.min(half,al))),Z.Y(Math.max(-half,Math.min(half,-crs))),"alias",1.6,7));
      o.push(S.D(Z.X(Math.max(-half,Math.min(half,al))),Z.Y(Math.max(-half,Math.min(half,-crs))),"alias",4.5));
      o.push(S.D(Z.x+8,Z.y+10,"purple",2.6));o.push(S.T(Z.x+14,Z.y+13,"GNSS（直前の 5 s）","start",9,"purple",false,false,null,true));
      /* (c) 誤差の育ち方（両対数） */
      var qx=nar?60:70,qy=nar?zy+zw+70:Math.max(oy+ph,zy+zw)+64,qw=nar?320:610,qh=nar?190:170;
      var Q=U.plot(qx,qy,qw,qh,[1,60],[0.01,1000],{xlog:true,ylog:true});
      o.push(S.T(nar?10:14,qy-12,"(c) 位置の誤差の大きさ（両対数）","start",nar?10:10.5,"ink",true));
      o.push(Q.axes({xt:[1,2,5,10,20,60],yt:[0.01,0.1,1,10,100,1000],xl:"時間 t [s]",yl:"誤差 [m]",sz:9,xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:36}));
      var ba=sBa.get(),bg=sBg.get()*_W19_D,bpv=sBp.get()*_W19_D,sp=city?15:sV.get(),fa=[],fh=[],k2;
      for(k2=0;k2<=60;k2++){var tt=Math.pow(10,k2/60*Math.log10(60));fa.push([tt,ba*tt*tt/2+_W19_G*bpv*tt*tt*tt/6]);fh.push([tt,sp*bg*tt*tt/2]);}
      o.push(Q.clip(fa,"alias",1.3,"5 3"));o.push(Q.clip(fh,"purple",1.3,"5 3"));
      var aa=[],cc=[];for(i=10;i<=ic&&i<R.t.length;i+=2){aa.push([R.t[i],Math.max(Math.abs(R.al[i]),1e-3)]);cc.push([R.t[i],Math.max(Math.abs(R.cr[i]),1e-3)]);}
      if(aa.length>1){o.push(Q.clip(aa,"alias",2));o.push(Q.clip(cc,"purple",2));}
      o.push(S.LEGL(Q.x+8,Q.y+14,[["alias",null,"進む向き"],["purple",null,"横"],["muted","5 3","まっすぐの道の式（3 節）"]],9,10));
      box.set(S.svg(Wd,qy+qh+44,o));
      /* 読み出し */
      function at(tt){var j=Math.round(tt*10);return [R.al[j],R.cr[j]];}
      var h="時刻 <b>t = "+_w19_f(cur,0)+" s</b>: 進む向きの誤差 <b>"+_w19_f(R.al[kc],1)+" m</b>・横の誤差 <b>"+_w19_f(R.cr[kc],1)+" m</b><br>";
      var r10=at(10),r30=at(30),r60=at(60);
      h+="10 s・30 s・60 s で、進む向き "+_w19_f(r10[0],2)+"・"+_w19_f(r30[0],1)+"・"+_w19_f(r60[0],1)+" m、横 "+_w19_f(r10[1],2)+"・"+_w19_f(r30[1],1)+"・"+_w19_f(r60[1],1)+" m";
      if(!city)h+="<br>式（3 節）: b<sub>a</sub>t²/2"+(bpv?" + g b<sub>g</sub>t³/6":"")+" = "+_w19_f(ba*450+_W19_G*bpv*4500,1)+" m、ṗ b<sub>g</sub>t²/2 = "+_w19_f(sp*bg*450,1)+" m（30 s）";
      ro.innerHTML=h;}
    run();
  };

  /* ---- 4 節の後: 東と北の 2 つの軸に 4 節のフィルタを置き、トンネルを通る（f19.py の _f19_kf1 と同じ計算） ---- */
  /* 曲がる道（例）: 4 節の速さで走り、40〜50 s で左へ 45° 曲がって北東へ、130〜140 s で右へ 45° 曲がって東へ */
  function _w19_heading(t){if(t<40)return 90;if(t<50)return 90-4.5*(t-40);if(t<130)return 45;if(t<140)return 45+4.5*(t-130);return 90;}
  function _w19_road(curve){return function(ax){return function(t){
      var s=_w19_speed(t),a=_w19_acc1(t);
      if(!curve)return ax?0:a;
      var ps=_w19_heading(t)*_W19_D,w=0;if(t>=40&&t<50)w=-4.5*_W19_D;if(t>=130&&t<140)w=4.5*_W19_D;
      return ax?(a*Math.cos(ps)-s*w*Math.sin(ps)):(a*Math.sin(ps)+s*w*Math.cos(ps));};};}
  /* 4 節の速さ（加速度を積分した値） */
  function _w19_speed(t){if(t<10)return 0;if(t<30)return t-10;if(t<100)return 20;if(t<105)return 20-2*(t-100);if(t<125)return 10;if(t<130)return 10+2*(t-125);return 20;}
  var _W19_Q=[{nm:"良い（バイアス 0.01・雑音 0.005 m/s²）",ba:[0.01,-0.006],sa:0.005,sb:1e-4},
              {nm:"本文の例（バイアス 0.05・雑音 0.02 m/s²）",ba:[_W19_BA,_W19_BAN],sa:_W19_SA,sb:_W19_SB},
              {nm:"悪い（バイアス 0.2・雑音 0.05 m/s²）",ba:[0.2,-0.12],sa:0.05,sb:1e-3}];
  REG.w19_kf=function(el,U){
    var S=U.S;
    U.head(el,"GNSS + IMU","トンネルを走る車 — 融合した位置と、誤差の楕円・帯");
    var r1=U.ctrls(el);
    var sRt=U.select(r1,"道",["まっすぐ東へ（本文の例）","曲がる道"],0,function(){run();});
    var sUse=U.select(r1,"使うもの",["IMU と GNSS（本文の例）","GNSS だけ（動きのモデル）"],0,function(){run();});
    var sQ=U.select(r1,"センサの質",_W19_Q.map(function(q){return q.nm;}),1,function(){run();});
    var r2=U.ctrls(el);
    var sTu=U.slider(r2,"GNSS の更新の間隔",{values:[0.2,0.5,1,2,5],value:1,fmt:function(v){return v+" s";},onInput:function(){run();}});
    var sTl=U.slider(r2,"トンネルの長さ",{values:[0,10,30,60,90],value:30,fmt:function(v){return v+" s";},onInput:function(){run();}});
    var sSy=U.slider(r2,"GNSS の誤差 σ（東・北）",{min:0.5,max:5,step:0.5,value:2,fmt:function(v){return _w19_f(v,1)+" m";},onInput:function(){run();}});
    var r3=U.ctrls(el),cIns=U.checkbox(r3,"慣性航法だけの位置も描く",false,function(){draw();});
    var br=U.btnrow(el),seed=1,E=null,Nn=null,I=null,cur=0,Tend=180,tun=[90,120],truthE=null,truthN=null;
    var bp=U.button(br,"再生",function(){if(tick.running()){tick.stop();bp.textContent="再生";return;}if(cur>=Tend-1e-9)cur=0;bp.textContent="止める";tick.start();});
    U.button(br,"本文の例",function(){tick.stop();bp.textContent="再生";sRt.set(0);sUse.set(0);sQ.set(1);sTu.set(1);sTl.set(30);sSy.set(2);cIns.set(false);seed=1;cur=Tend;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var tick=U.ticker(function(){cur=Math.min(Tend,cur+1);draw();if(cur>=Tend){tick.stop();bp.textContent="再生";}},60);
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){var q=_W19_Q[+sQ.get()],L=sTl.get(),road=_w19_road(sRt.get()===1);
      tun=[90,90+L];Tend=150+L;cur=Math.min(cur||Tend,Tend);if(cur===0)cur=Tend;
      var base={seed:seed,bias:true,tun:tun,Tu:sTu.get(),sy:sSy.get(),sa:q.sa,sb:q.sb,Tend:Tend,every:10};
      if(sUse.get()===0){E=_w19_kf1(U,Object.assign({},base,{ba:q.ba[0],acc:road(0),axis:0}));Nn=_w19_kf1(U,Object.assign({},base,{ba:q.ba[1],acc:road(1),axis:1}));}
      else{E=_w19_kfm(U,Object.assign({},base,{acc:road(0),axis:0}));Nn=_w19_kfm(U,Object.assign({},base,{acc:road(1),axis:1}));}
      /* 本当の位置（0.1 s ごと）と、慣性航法だけの位置（同じ IMU の値・初めは正しい） */
      var N=Math.round(Tend/_W19_TS),tE=_w19_truth(N,road(0)),tN=_w19_truth(N,road(1)),rI=U.rng(seed*7+1),pe=0,ve=0,pn=0,vn=0,T=_W19_TS;
      truthE=[];truthN=[];I=[];
      for(var k=0;k<=N;k++){if(k%10===0){truthE.push(tE.P[k]);truthN.push(tN.P[k]);I.push([pe,pn]);}
        var a1=rI.normal(),a2=rI.normal(),ue=tE.A[k]+q.ba[0]+q.sa*a1,un=tN.A[k]+q.ba[1]+q.sa*a2;
        pe+=ve*T+0.5*ue*T*T;ve+=ue*T;pn+=vn*T+0.5*un*T*T;vn+=un*T;}
      draw();}
    function idx(R,t){return _w19_at(R,t);}
    function draw(){
      var nar=_w19_nar(box),Wd=nar?400:700,o=[],it=Math.min(truthE.length-1,Math.round(cur*10)),ie=idx(E,cur),inn=idx(Nn,cur);
      var inT=cur>=tun[0]&&cur<tun[1];
      /* (a) 道の全体 */
      var e0=Infinity,e1=-Infinity,n0=Infinity,n1=-Infinity,i;for(i=0;i<truthE.length;i+=10){e0=Math.min(e0,truthE[i]);e1=Math.max(e1,truthE[i]);n0=Math.min(n0,truthN[i]);n1=Math.max(n1,truthN[i]);}
      var pw=nar?360:390,ph=nar?150:190,sc=Math.min(pw/Math.max(e1-e0,100),ph/Math.max(n1-n0,100))*0.9,ox=nar?20:14,oy=34,ce=(e0+e1)/2,cn=(n0+n1)/2;
      function MX(v){return ox+pw/2+(v-ce)*sc;}function MY(v){return oy+ph/2-(v-cn)*sc;}
      o.push(S.T(nar?10:14,18,"(a) 道の全体（灰色の太い所がトンネル）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(ox,oy,pw,ph,2,"var(--screen)","line",1));
      var road=[],tu=[];for(i=0;i<truthE.length;i+=10){var tt=i/10;road.push([MX(truthE[i]),MY(truthN[i])]);if(tt>=tun[0]&&tt<=tun[1])tu.push([MX(truthE[i]),MY(truthN[i])]);}
      o.push(S.PL(road,"green",1.6));if(tu.length>1)o.push(S.PL(tu,"muted",7));
      o.push(S.D(MX(truthE[it]),MY(truthN[it]),"green",5));
      var Lm=Math.pow(10,Math.floor(Math.log10(Math.max(e1-e0,n1-n0)/3)));o.push(S.L(ox+pw-10-Lm*sc,oy+ph-12,ox+pw-10,oy+ph-12,"ink",2));o.push(S.T(ox+pw-10-Lm*sc/2,oy+ph-17,Lm+" m","middle",9,"ink",false,false,null,true));
      /* (b) 車のまわりの拡大（本当の位置が中心） */
      var se=E.sp[ie],sn=Nn.sp[inn],ee=E.err[ie],en=Nn.err[inn],need=Math.max(3*Math.max(se,sn),Math.abs(ee),Math.abs(en),3),half=[10,30,100,300,1000].find(function(v){return v>=need;})||1000;
      var zx=nar?70:470,zy=nar?oy+ph+48:34,zw=nar?260:200;
      var Z=U.plot(zx,zy,zw,zw,[-half,half],[-half,half]);
      o.push(S.T(nar?10:zx-20,nar?zy-14:18,"(b) 車のまわり（中心が本当の位置）","start",nar?10:10.5,"ink",true));
      o.push(S.RECT(Z.x,Z.y,Z.w,Z.h,2,"var(--screen)","line",1));
      o.push(Z.axes({xt:[-half,0,half],yt:[-half,0,half],sz:9,xl:"東 [m]",yl:"北 [m]",ylOff:34}));
      o.push(S.L(Z.X(0)-6,Z.Y(0),Z.X(0)+6,Z.Y(0),"green",2));o.push(S.L(Z.X(0),Z.Y(0)-6,Z.X(0),Z.Y(0)+6,"green",2));
      /* 最近の GNSS の点（本当の位置からの誤差） */
      for(i=0;i<E.gt.length;i++){if(E.gt[i]<=cur&&E.gt[i]>cur-5){var x=E.ge[i],y=Nn.ge[i];if(Math.abs(x)<half&&Math.abs(y)<half)o.push(S.D(Z.X(x),Z.Y(y),"purple",2.6));}}
      if(cIns.get()){var de=I[it][0]-truthE[it],dn=I[it][1]-truthN[it];if(Math.abs(de)<half&&Math.abs(dn)<half)o.push(S.D(Z.X(de),Z.Y(dn),"alias",4));else o.push(S.T(Z.x+Z.w-4,Z.y+Z.h-6,"慣性航法だけ: "+_w19_f(Math.hypot(de,dn),0)+" m 先","end",9,"alias",true,false,null,true));}
      var el2=_w19_ell(se*se,0,sn*sn);
      o.push(S.PL(_w19_ellpts(el2[0],el2[1],el2[2],ee,en,1).map(function(p){return [Z.X(Math.max(-half,Math.min(half,p[0]))),Z.Y(Math.max(-half,Math.min(half,p[1])))];}),"gold",1.8));
      if(Math.abs(ee)<half&&Math.abs(en)<half)o.push(S.D(Z.X(ee),Z.Y(en),"gold",4.5));
      /* (c)(d) 東と北の誤差の時間の変化 */
      var ty=nar?Z.y+Z.h+70:296,tw=nar?320:610,th=nar?80:84,tx=nar?60:70;
      var lim=Math.max(4,Math.min(400,Math.ceil(Math.max.apply(null,E.sp.concat(Nn.sp).map(function(v){return 2.2*v;}))/2)*2));
      [[E,"(c) 東の誤差","gold"],[Nn,"(d) 北の誤差","teal"]].forEach(function(q,j){var R=q[0],P=U.plot(tx,ty+j*(th+40),tw,th,[0,Tend],[-lim,lim]);
        o.push(S.T(nar?10:14,P.y-8,q[1]+"（帯は ±2σ）","start",nar?9.5:10,"ink",true));
        o.push(S.RECT(P.X(tun[0]),P.y,P.X(tun[1])-P.X(tun[0]),P.h,0,"var(--muted-soft)","none",0));
        o.push(P.axes({xt:U.nice(0,Tend,6),yt:[-lim,0,lim],sz:9,xl:j?"時間 t [s]":null,xfmt:j?null:function(){return "";},yl:"誤差 [m]",ylOff:36}));
        var st=R.t.length>2000?3:1,xs=[],lo=[],hi=[],pts=[];for(var i2=0;i2<R.t.length;i2+=st){xs.push(R.t[i2]);hi.push(2*R.sp[i2]);lo.push(-2*R.sp[i2]);pts.push([R.t[i2],R.err[i2]]);}
        o.push(_w19_band(U,P,xs,lo,hi,q[2]));o.push(P.clip(pts,q[2],1.5));
        o.push(S.L(P.X(cur),P.y,P.X(cur),P.y+P.h,"ink",1,"3 3"));});
      box.set(S.svg(Wd,ty+2*(th+40)+18,o));
      /* 読み出し */
      var i0=idx(E,tun[0]-0.1),i1=idx(E,tun[1]-0.1);
      var h="時刻 <b>t = "+_w19_f(cur,0)+" s</b>（"+(inT?'<span class="warn">トンネルの中: 予測だけ</span>':"GNSS あり")+"）: 位置の誤差 東 "+_w19_f(ee,2)+" m・北 "+_w19_f(en,2)+" m、標準偏差 東 "+_w19_f(se,2)+" m・北 "+_w19_f(sn,2)+" m<br>";
      if(tun[1]>tun[0])h+="東の標準偏差: トンネルの入口の直前 <b>"+_w19_f(E.sp[i0],2)+" m</b> → 出口の直前 <b>"+_w19_f(E.sp[i1],2)+" m</b>（出口の誤差 "+_w19_f(E.err[i1],2)+" m）";
      if(sUse.get()===0){var qb=_W19_Q[+sQ.get()];h+="<br>バイアスの推定（東）: "+_w19_f(E.b[ie],4)+" m/s²（本当は "+_w19_f(qb.ba[0],3)+"、σ "+_w19_f(E.sb[ie],4)+"）";}
      ro.innerHTML=h;}
    run();
  };

  /* ---- 4 節の後: バイアスを状態に入れたフィルタと、入れないフィルタ（同じ IMU と GNSS の値） ---- */
  REG.w19_bias=function(el,U){
    var S=U.S;
    U.head(el,"BIAS STATE","バイアスを状態に入れる・入れない — 同じ値で比べる");
    var r1=U.ctrls(el);
    var sB=U.slider(r1,U.htx("本当のバイアス b_a"),{min:0,max:0.2,step:0.01,value:0.05,fmt:function(v){return _w19_f(v,2)+" m/s²";},onInput:function(){run();}});
    var sTl=U.slider(r1,"トンネルの長さ",{values:[0,10,30,60],value:30,fmt:function(v){return v+" s";},onInput:function(){run();}});
    var sW=U.slider(r1,"入れないフィルタが見込む加速度の雑音",{values:[1,3,10,30,100],value:1,fmt:function(v){return "例の値の "+v+" 倍";},onInput:function(){run();}});
    var br=U.btnrow(el),seed=1,A=null,B=null,tun=[90,120],Tend=180;
    U.button(br,"本文の例",function(){sB.set(0.05);sTl.set(30);sW.set(1);seed=1;run();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;run();});
    var box=U.svgbox(el),ro=U.readout(el);
    function run(){var L=sTl.get();tun=[90,90+L];Tend=150+L;
      var base={seed:seed,tun:tun,Tu:1,sy:_W19_SY,ba:sB.get(),sa:_W19_SA,sb:_W19_SB,Tend:Tend,acc:_w19_acc1,axis:0,every:10};
      A=_w19_kf1(U,Object.assign({},base,{bias:true}));B=_w19_kf1(U,Object.assign({},base,{bias:false,wscale:sW.get()*sW.get()}));draw();}
    function frac(R){var n=0;for(var i=0;i<R.t.length;i++)if(Math.abs(R.err[i])>2*R.sp[i])n++;return n/R.t.length;}
    function draw(){
      var nar=_w19_nar(box),Wd=nar?400:700,o=[],tx=nar?60:70,tw=nar?320:610,th=nar?96:110;
      var mA=0,mB=0,i;for(i=0;i<A.t.length;i++){mA=Math.max(mA,Math.abs(A.err[i]),2*A.sp[i]);mB=Math.max(mB,Math.abs(B.err[i]));}
      function nic(v){var s=[2,4,8,10,20,40,80,100,200,400,800,1000,2000,5000];for(var k=0;k<s.length;k++)if(s[k]>=v)return s[k];return 10000;}
      var la=nic(mA*1.05),lb=nic(mB*1.05);
      [[A,"(a) バイアスを状態に入れる","gold",la],[B,"(b) バイアスを状態に入れない","alias",lb]].forEach(function(q,j){var R=q[0],P=U.plot(tx,30+j*(th+44),tw,th,[0,Tend],[-q[3],q[3]]);
        o.push(S.T(nar?10:14,P.y-10,q[1]+"（線: 誤差、帯: ±2σ）","start",nar?9.5:10.5,"ink",true));
        o.push(S.RECT(P.X(tun[0]),P.y,P.X(tun[1])-P.X(tun[0]),P.h,0,"var(--muted-soft)","none",0));
        o.push(P.axes({xt:U.nice(0,Tend,6),yt:[-q[3],0,q[3]],sz:9,xfmt:function(){return "";},yl:"誤差 [m]",ylOff:36}));
        var xs=[],lo=[],hi=[],pts=[];for(var i2=0;i2<R.t.length;i2+=2){xs.push(R.t[i2]);hi.push(2*R.sp[i2]);lo.push(-2*R.sp[i2]);pts.push([R.t[i2],R.err[i2]]);}
        o.push(_w19_band(U,P,xs,lo,hi,q[2]));o.push(P.clip(pts,q[2],1.6));o.push(S.L(P.x,P.Y(0),P.x+P.w,P.Y(0),"muted",0.8));});
      /* (c) バイアスの推定 */
      var y3=30+2*(th+44),bmax=Math.max(0.1,Math.ceil((sB.get()+0.05)*20)/20),P3=U.plot(tx,y3,tw,th,[0,Tend],[-bmax,bmax]);
      o.push(S.T(nar?10:14,y3-10,"(c) (a) のフィルタのバイアスの推定（±2σ）と、本当の値","start",nar?9.5:10.5,"ink",true));
      o.push(S.RECT(P3.X(tun[0]),P3.y,P3.X(tun[1])-P3.X(tun[0]),P3.h,0,"var(--muted-soft)","none",0));
      o.push(P3.axes({xt:U.nice(0,Tend,6),yt:[-bmax,0,bmax],sz:9,xl:"時間 t [s]",yl:"バイアス [m/s²]",ylOff:40,yfmt:function(v){return _w19_f(v,2);}}));
      var xs=[],lo=[],hi=[],pts=[];for(i=0;i<A.t.length;i+=2){xs.push(A.t[i]);hi.push(A.b[i]+2*A.sb[i]);lo.push(A.b[i]-2*A.sb[i]);pts.push([A.t[i],A.b[i]]);}
      o.push(_w19_band(U,P3,xs,lo,hi,"gold"));o.push(P3.clip(pts,"gold",1.6));o.push(S.L(P3.x,P3.Y(sB.get()),P3.x+P3.w,P3.Y(sB.get()),"green",1.4,"5 3"));
      box.set(S.svg(Wd,y3+th+44,o));
      var i0=_w19_at(A,tun[0]-0.1),i1=_w19_at(A,tun[1]-0.1),fa=frac(A),fb=frac(B);
      var h="入れる: トンネルの入口の直前 誤差 "+_w19_f(A.err[i0],2)+" m（σ "+_w19_f(A.sp[i0],2)+" m）→ 出口の直前 <b>"+_w19_f(A.err[i1],2)+" m</b>（σ "+_w19_f(A.sp[i1],2)+" m）・帯の外 "+_w19_f(fa*100,1)+" %<br>";
      h+="入れない: 入口の直前 誤差 "+_w19_f(B.err[i0],1)+" m（σ "+_w19_f(B.sp[i0],2)+" m）→ 出口の直前 <b>"+_w19_f(B.err[i1],1)+" m</b>（σ "+_w19_f(B.sp[i1],2)+" m）・帯の外 "+(fb>0.05?'<span class="warn">'+_w19_f(fb*100,1)+" %</span>":_w19_f(fb*100,1)+" %");
      ro.innerHTML=h;}
    run();
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
