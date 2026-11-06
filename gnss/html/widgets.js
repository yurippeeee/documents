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
     U.gnss.fft(re, im): 長さが 2 のべきの配列を、その場で離散フーリエ変換する（基数 2） */
  var gnss=(function(){
    var TAPS=[null,[2,6],[3,7],[4,8],[5,9],[1,9],[2,10],[1,8],[2,9],[3,10],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[9,10],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[1,3],[4,6],[5,7],[6,8],[7,9],[8,10],[1,6],[2,7],[3,8],[4,9]];
    var CODES={},PMS={};
    function ca(prn){if(CODES[prn])return CODES[prn];var g1=[1,1,1,1,1,1,1,1,1,1],g2=[1,1,1,1,1,1,1,1,1,1],t=TAPS[prn],o=new Int8Array(1023);
      for(var n=0;n<1023;n++){o[n]=g1[9]^g2[t[0]-1]^g2[t[1]-1];var f1=g1[2]^g1[9],f2=g2[1]^g2[2]^g2[5]^g2[7]^g2[8]^g2[9];g1.unshift(f1);g1.pop();g2.unshift(f2);g2.pop();}
      CODES[prn]=o;return o;}
    function pm(prn){if(PMS[prn])return PMS[prn];var c=ca(prn),o=new Int8Array(1023);for(var n=0;n<1023;n++)o[n]=1-2*c[n];PMS[prn]=o;return o;}
    function fft(re,im){var n=re.length,i,j=0,k,len;for(i=1;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){var t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
      for(len=2;len<=n;len<<=1){var ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang),h=len>>1;for(i=0;i<n;i+=len){var cr=1,ci=0;for(k=0;k<h;k++){var a=i+k,b=a+h,br=re[b]*cr-im[b]*ci,bi=re[b]*ci+im[b]*cr;re[b]=re[a]-br;im[b]=im[a]-bi;re[a]+=br;im[a]+=bi;var t2=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t2;}}}}
    return {TAPS:TAPS,ca:ca,pm:pm,fft:fft};
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
