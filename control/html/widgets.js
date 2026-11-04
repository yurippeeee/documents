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
  function tw(s,sz,mono){var w=0;s=String(s);for(var i=0;i<s.length;i++){var o=s.charCodeAt(i);w+=o<128?sz*(mono?0.6:0.56):(o>=0xFF61&&o<=0xFF9F?sz*0.55:((o===0xB2||o===0xB3||o===0xB9||(o>=0x2070&&o<=0x209F))?sz*0.4:sz));}return w;}
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
    /* 添字付きの文字: "K_P" "u_0" "ω_gc" のように、1 文字の後の _ に続く英数字を添字にする */
    TX:function(x,y,s,a,sz,c,b,halo){sz=sz||10;s=String(s);var segs=[],re=/([A-Za-zα-ωΑ-Ω])_([A-Za-z0-9∞]+)/g,m,pos=0;
      while((m=re.exec(s))){if(m.index>pos)segs.push([s.slice(pos,m.index),null]);segs.push([m[1],m[2]]);pos=re.lastIndex;}
      if(pos<s.length)segs.push([s.slice(pos),null]);
      var ss=sz*0.72,w=0;segs.forEach(function(g){w+=tw(g[0],sz)+(g[1]?tw(g[1],ss):0);});
      var x0=x-(a==="middle"?w/2:(a==="end"?w:0)),pend=0;
      var h='<text x="'+r2(x0)+'" y="'+r2(y)+'" text-anchor="start" font-size="'+sz+'" fill="'+col(c||"ink")+'" font-family="var(--sans)" font-weight="'+(b?700:400)+'"'+
        (halo?' stroke="var(--screen)" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"':'')+'>';
      segs.forEach(function(g){h+='<tspan'+(pend?' dy="'+pend+'"':'')+'>'+esc(g[0])+'</tspan>';pend=0;if(g[1]){h+='<tspan dy="3" font-size="'+r2(ss)+'">'+esc(g[1])+'</tspan>';pend=-3;}});
      return h+'</text>';},
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
    CHIPL:function(x,y,t,c,sz){sz=sz||10;var w=tw(t,sz)+10;return S.CHIP(x+w/2,y,t,c,sz);}
  };
  function r2(v){return Math.round(v*100)/100;}

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
        if(a.xl)s.push(S.T(x+w/2,y+h+31,a.xl,"middle",sz+0.5,"muted"));
        if(a.yl)s.push(S.T(x-(a.ylOff||40),y+h/2,a.yl,"middle",sz+0.5,"muted",false,false,-90));
        return s.join("");},
      line:function(pts,c,lw,dash){return S.PL(pts.map(function(p){return [P.X(p[0]),P.Y(p[1])];}),c||"signal",lw||2,null,dash);},
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
    return {cx:cx,c:c,poly:poly,tf:tf,freq:freq,bode:bode,series:series,parallel:parallel,feedback:feedback,poles:poles,zeros:zeros,dcgain:dcgain,
      ss:ss,lsim:lsim,step:step,impulse:impulse,margins:margins,mat:mat,rk4:rk4,linspace:linspace,logspace:logspace,splane:splane,pz:pz,bodeSvg:bodeSvg,drag:drag};
  })();
  /* ===== END 制御の計算部品 ===== */

  var REG={};
  var U={C:C,col:col,soft:soft,mk:mk,esc:esc,head:head,ctrls:ctrls,btnrow:btnrow,readout:readout,note:note,slider:slider,select:select,checkbox:checkbox,textin:textin,
    button:button,seg:seg,svgbox:svgbox,tbl:tbl,fmt:fmt,sig:sig,tw:tw,S:S,plot:plot,nice:nice,seq:seq,hexView:hexView,fieldsSvg:fieldsSvg,rng:rng,ticker:ticker,ctl:ctl};

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
