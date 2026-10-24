/* 動かして理解する組み込み通信 — 章内インタラクティブ部品
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
  function tbl(headers,rows,align){
    var h='<div class="wtable"><table><thead><tr>'+headers.map(function(t,i){return '<th style="text-align:'+((align&&align[i])||"left")+'">'+t+'</th>';}).join("")+'</tr></thead><tbody>';
    rows.forEach(function(r){h+='<tr>'+r.map(function(v,i){return '<td style="text-align:'+((align&&align[i])||"left")+'">'+v+'</td>';}).join("")+'</tr>';});
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
    bytes:function(n,d){var a=Math.abs(n);if(a>=1048576)return sig(n/1048576,d)+" MiB";if(a>=1024)return sig(n/1024,d)+" KiB";return Math.round(n)+" B";},
    cur:function(A,d){var a=Math.abs(A);if(a>=1)return sig(A,d)+" A";if(a>=1e-3)return sig(A*1e3,d)+" mA";if(a>=1e-6)return sig(A*1e6,d)+" µA";return sig(A*1e9,d)+" nA";},
    pct:function(x,d){return sig(x*100,d||3)+" %";},
    hex:function(v,n){var s=(v>>>0).toString(16).toUpperCase();while(s.length<(n||2))s="0"+s;return s;}
  };

  /* ---- SVG の部品（figures.py と同じ見た目） ---- */
  function tw(s,sz,mono){var w=0;s=String(s);for(var i=0;i<s.length;i++){var o=s.charCodeAt(i);w+=o<128?sz*(mono?0.6:0.56):(o>=0xFF61&&o<=0xFF9F?sz*0.55:sz);}return w;}
  var S={
    svg:function(w,h,body,cls){return '<svg viewBox="0 0 '+w+' '+h+'" width="'+w+'" role="img"'+(cls?' class="'+cls+'"':'')+'>'+(Array.isArray(body)?body.join(""):body)+'</svg>';},
    T:function(x,y,s,a,sz,c,b,mono,rot){return '<text x="'+r2(x)+'" y="'+r2(y)+'" text-anchor="'+(a||"middle")+'" font-size="'+(sz||11)+'" fill="'+col(c||"muted")+
      '" font-family="var('+(mono?"--mono":"--sans")+')" font-weight="'+(b?700:400)+'"'+(rot!=null?' transform="rotate('+rot+' '+r2(x)+' '+r2(y)+')"':'')+'>'+esc(s)+'</text>';},
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
    X:function(x,y,r,c,lw){r=r||5;return S.L(x-r,y-r,x+r,y+r,c||"alias",lw||2)+S.L(x-r,y+r,x+r,y-r,c||"alias",lw||2);}
  };
  function r2(v){return Math.round(v*100)/100;}

  /* ---- グラフの座標系（figures.py の Plot と同じ） ----
     var p=plot(x,y,w,h,[x0,x1],[y0,y1],{xlog:false,ylog:false}); p.X(v), p.Y(v), p.axes({xl,yl,xt,yt,xfmt,yfmt}) */
  function nice(lo,hi,n){n=n||5;var span=hi-lo;if(span<=0)return [lo];var raw=span/n,p=Math.pow(10,Math.floor(Math.log10(raw)));
    var st=[1,2,2.5,5,10].map(function(s){return s*p;}).reduce(function(a,b){return Math.abs(b-raw)<Math.abs(a-raw)?b:a;});
    var out=[];for(var v=Math.ceil(lo/st-1e-9)*st;v<=hi+1e-9*Math.abs(st);v+=st)out.push(+v.toPrecision(12));return out;}
  function plot(x,y,w,h,xr,yr,o){o=o||{};
    function t(v,r,lg){return lg?(Math.log10(v)-Math.log10(r[0]))/(Math.log10(r[1])-Math.log10(r[0])):(v-r[0])/(r[1]-r[0]);}
    function lt(r){var out=[];for(var k=Math.floor(Math.log10(r[0])+1e-9);k<=Math.ceil(Math.log10(r[1])-1e-9);k++){var v=Math.pow(10,k);if(v>=r[0]*(1-1e-9)&&v<=r[1]*(1+1e-9))out.push(v);}return out;}
    var P={x:x,y:y,w:w,h:h,xr:xr,yr:yr,
      X:function(v){return x+t(v,xr,o.xlog)*w;},
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
     lanes: [[名前, 色], ...]  msgs: [frm, to, ラベル, {c, dash, lost, at, sub, dy, slant, b, mono}] / ["note", lane, 文字, {c}] / ["gap", 文字] / ["span", lane, 行数, 文字, {c, side}] / ["space", 高さ]
     返り値 {svg: 中身, h: 高さ}。全体は S.svg(w, h, svg) で包む。 */
  function seq(lanes,msgs,o){o=o||{};var x=o.x||10,y=o.y||10,w=o.w||620,hh=o.headH||30,dy=o.dy||34,lsz=o.labelSz||10.5;
    var n=lanes.length,lw=w/n,xs=lanes.map(function(_,i){return x+lw*(i+0.5);}),out=[],body=[],rows=[],yy=y+hh+16;
    lanes.forEach(function(L,i){var bw=Math.min(lw-10,Math.max(64,tw(L[0],11.5)+18));out.push(S.RECT(xs[i]-bw/2,y,bw,hh,7,soft(L[1]),col(L[1]),1.3));out.push(S.T(xs[i],y+hh/2+4.2,L[0],"middle",11.5,L[1],true));});
    msgs.forEach(function(m){
      if(m[0]==="note"){var op=m[3]||{},c=op.c||"muted",lines=String(m[2]).split("\n"),bw=Math.max.apply(null,lines.map(function(l){return tw(l,10);}))+14,bh=lines.length*13.5+8;
        body.push(S.RECT(xs[m[1]]-bw/2,yy-6,bw,bh,5,soft(c),col(c),1));lines.forEach(function(l,k){body.push(S.T(xs[m[1]],yy+6+k*13.5,l,"middle",10,c));});rows.push(yy);yy+=bh+10;return;}
      if(m[0]==="gap"){xs.forEach(function(xx){body.push(S.L(xx-6,yy-3,xx+6,yy+3,"faint",1.2));body.push(S.L(xx-6,yy+3,xx+6,yy+9,"faint",1.2));});
        if(m[1])body.push(S.T(x+w-2,yy+7,m[1],"end",10,"faint"));rows.push(yy);yy+=22;return;}
      if(m[0]==="space"){yy+=m[1];return;}
      if(m[0]==="span"){var op2=m[4]||{},c2=op2.c||"teal",side=op2.side||1,y0=rows[Math.max(0,rows.length-m[2])],y1=rows[rows.length-1],xb=xs[m[1]]+side*10;
        body.push(S.W([xb,y0,xb+side*5,y0,xb+side*5,y1,xb,y1],c2,1.3));String(m[3]).split("\n").forEach(function(l,q,arr){body.push(S.T(xb+side*9,(y0+y1)/2+4+(q-(arr.length-1)/2)*12.5,l,side>0?"start":"end",9.5,c2));});return;}
      var op3=m[3]||{},c3=op3.c||"ink",h3=op3.dy||dy,sl=op3.slant||0,x1=xs[m[0]],x2=xs[m[1]],y1b=yy+8,y2b=yy+8+sl;
      if(m[0]===m[1]){body.push(S.PATH("M"+x1+","+y1b+" h26 v12 h-20",c3,1.5));body.push(S.head(x1+26,y1b+12,x1+4,y1b+12,c3,6));body.push(S.T(x1+32,y1b+10,m[2],"start",lsz,c3));rows.push(y1b);yy+=h3+6;return;}
      if(op3.lost){var at=op3.at||0.62,fx=x1+(x2-x1)*at,fy=y1b+(y2b-y1b)*at;body.push(S.L(x1,y1b,fx,fy,"alias",1.6,"5 3"));body.push(S.X(fx,fy,5,"alias",2));c3="alias";}
      else body.push(S.ARR(x1,y1b,x2,y2b,c3,1.6,7,op3.dash?"5 3":null));
      body.push(S.T((x1+x2)/2,Math.min(y1b,y2b)-5,m[2],"middle",lsz,c3,op3.b,op3.mono));
      if(op3.sub)body.push(S.T((x1+x2)/2,Math.max(y1b,y2b)+13,op3.sub,"middle",lsz-1,"muted",false,op3.mono));
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
      body.push(S.T(xx+wd/2,yy+h+13,f[1]+" B","middle",9,"muted"));xx+=wd;wmax=Math.max(wmax,xx);});
    return {svg:body.join(""),w:wmax+x,h:yy-y+rowH+y};}

  /* ---- 乱数（同じ種なら同じ列。シミュレーションを再現できるようにする） ---- */
  function rng(seed){var a=(seed>>>0)||1;function nx(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
    return {next:nx,int:function(n){return Math.floor(nx()*n);},range:function(a,b){return a+(b-a)*nx();},chance:function(p){return nx()<p;},
      normal:function(){var u=1-nx(),v=nx();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);},
      exp:function(mean){return -Math.log(1-nx())*mean;},pick:function(arr){return arr[Math.floor(nx()*arr.length)];}};}

  /* ---- 一定間隔の繰り返し（アニメーション）。画面外や停止中は動かさない ---- */
  function ticker(fn,ms){var id=null;return {start:function(){if(id==null)id=setInterval(fn,ms||100);},stop:function(){if(id!=null){clearInterval(id);id=null;}},running:function(){return id!=null;}};}

  var REG={};
  var U={C:C,col:col,soft:soft,mk:mk,esc:esc,head:head,ctrls:ctrls,btnrow:btnrow,readout:readout,note:note,slider:slider,select:select,checkbox:checkbox,textin:textin,
    button:button,seg:seg,svgbox:svgbox,tbl:tbl,fmt:fmt,sig:sig,tw:tw,S:S,plot:plot,nice:nice,seq:seq,hexView:hexView,fieldsSvg:fieldsSvg,rng:rng,ticker:ticker};

  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */
  /* ===== 01 章 組み込み通信の全体像 ===== */
  /* 方式の一覧（代表値）: 名前, 種類, 距離の上限 [m], 延長 [m], 速さ [bps], 1 日のデータ量の目安の上限 [B], 電池 (2 適 / 1 条件付き / 0 不向き), 必要なもの */
  var _w01_T=[
    ["UART","wired",5,null,[9600,3e6],Infinity,2,"wire"],
    ["RS-485","wired",1200,null,[1e5,1e7],Infinity,1,"wire"],
    ["Ethernet","wired",100,null,[1e7,1e9],Infinity,0,"wire"],
    ["BLE","short",50,400,[1.25e5,2e6],1e8,2,"phone"],
    ["IEEE 802.15.4","short",50,300,[2.2e5,2.8e5],1e7,2,"gw"],
    ["Wi-Fi","short",50,null,[1e6,1.5e8],Infinity,1,"ap"],
    ["LoRaWAN","lpwa",15000,null,[250,1.1e4],5e4,2,"lorawan"],
    ["LTE-M","lpwa",10000,null,[1e5,1e6],1e8,2,"cell"],
    ["NB-IoT","lpwa",15000,null,[2e4,1.5e5],1e7,2,"cell"]];
  var _w01_CC={wired:"gold",short:"signal",lpwa:"green"};
  var _w01_NEED={wire:"配線",phone:"スマートフォンかゲートウェイ",gw:"中継とインターネットへの出口",ap:"アクセスポイント",lorawan:"LoRaWAN のゲートウェイ",cell:"携帯電話の回線"};
  function _w01_bytes(v){v=+v.toPrecision(2);return v>=1e8?(v/1e8)+" 億バイト":v>=1e4?(+(v/1e4).toPrecision(3))+" 万バイト":v+" バイト";}
  function _w01_dist(v){return v<1000?(v<1?v.toFixed(1):Math.round(v))+" m":(+(v/1000).toPrecision(2))+" km";}

  REG.w01_select=function(el,U){
    var S=U.S;
    U.head(el,"SELECT","要求から通信方式の候補をしぼる（目安）");
    var row=U.ctrls(el);
    var dist=U.slider(row,"必要な距離",{min:0.5,max:20000,value:20,log:true,step:0.01,fmt:_w01_dist,onInput:draw});
    var data=U.slider(row,"1 日に送るデータ量",{min:100,max:1e8,value:1e4,log:true,step:0.01,fmt:_w01_bytes,onInput:draw});
    var row2=U.ctrls(el);
    var pw=U.select(row2,"電源",["電池","外部の電源"],0,draw);
    var have={};
    var row3=U.ctrls(el);
    [["wire","配線できる",false],["phone","スマートフォンかゲートウェイがある",true],["gw","Thread などの中継とインターネットへの出口がある",false],["ap","Wi-Fi のアクセスポイントがある",true],
     ["lorawan","LoRaWAN のゲートウェイを使える",false],["cell","携帯電話の回線を契約できる",false]].forEach(function(o){have[o[0]]=U.checkbox(row3,o[1],o[2],draw);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function mark(v){return v===2?'<span class="ok">✓</span>':v===1?'<b style="color:var(--gold)">△</b>':'<span class="warn">×</span>';}
    function draw(){
      var D=dist.get(),B=data.get(),bat=pw.get()===0,avg=B*8/86400;
      var W=700,rh=27,y0=50,n=_w01_T.length,o=[];
      var pd=U.plot(118,y0,270,n*rh,[0.1,30000],[0,n],{xlog:true}), pr=U.plot(420,y0,268,n*rh,[1,1e9],[0,n],{xlog:true});
      o.push(S.T(pd.x+pd.w/2,18,"届く距離","middle",11.5,"ink",true));
      o.push(S.T(pr.x+pr.w/2,18,"物理層の速さ [bps]","middle",11.5,"ink",true));
      [[pd,[0.1,1,10,100,1000,10000],_w01_dist],[pr,[1,100,1e4,1e6,1e8],function(v){return v>=1e6?(v/1e6)+" M":v>=1e3?(v/1e3)+" k":String(v);}]].forEach(function(q){
        q[1].forEach(function(v){var xx=q[0].X(v);o.push(S.L(xx,y0-4,xx,y0+n*rh,"grid",1));o.push(S.T(xx,y0+n*rh+15,q[2](v),"middle",9.5,"muted"));});
        o.push(S.L(q[0].x,y0+n*rh,q[0].x+q[0].w,y0+n*rh,"muted",1.1));});
      var res=[];
      _w01_T.forEach(function(t,i){
        var okD=D<=t[2]?2:(t[3]&&D<=t[3]?1:0), okB=B<=t[5]?2:0, okP=bat?t[6]:2, okN=have[t[7]].get()?2:0;
        var all=Math.min(okD,okB,okP,okN), c=_w01_CC[t[1]], yy=y0+i*rh+5, op=all>0?1:0.3;
        o.push('<g opacity="'+op+'">');
        o.push(S.T(108,yy+12,t[0],"end",11,"ink",true));
        var d0=t[1]==="lpwa"?(t[0]==="LoRaWAN"?1000:100):(t[0]==="UART"?0.1:1);
        o.push(S.RECT(pd.X(d0),yy,pd.X(t[2])-pd.X(d0),rh-10,4,U.soft(c),c,1.3));
        if(t[3])o.push(S.RECT(pd.X(t[2]),yy,pd.X(t[3])-pd.X(t[2]),rh-10,4,"none",c,1.1,"4 3"));
        o.push(S.RECT(pr.X(t[4][0]),yy,Math.max(pr.X(t[4][1])-pr.X(t[4][0]),4),rh-10,4,U.soft(c),c,1.3));
        o.push('</g>');
        res.push([t[0],mark(okD),mark(okB),bat?mark(okP):"—",mark(okN),all===2?'<span class="ok">候補</span>':all===1?'<b style="color:var(--gold)">条件付き</b>':'<span class="warn">外れる</span>']);
      });
      var xd=pd.X(Math.min(D,30000));
      o.push(S.L(xd,y0-6,xd,y0+n*rh,"alias",1.6,"5 3"));o.push(S.T(xd,y0-8,"必要な距離","middle",9.5,"alias",true));
      var xa=pr.X(Math.max(1,Math.min(avg,1e9)));
      o.push(S.L(xa,y0-6,xa,y0+n*rh,"alias",1.6,"5 3"));o.push(S.T(xa,y0-8,"平均の速さ","middle",9.5,"alias",true));
      box.set(S.svg(W,y0+n*rh+26,o));
      ro.innerHTML="必要な平均の速さ = "+_w01_bytes(B)+" × 8 ÷ 86400 秒 = <b>"+U.fmt.rate(avg)+"</b>（どの方式もこれを大きく上回る）"+
        U.tbl(["方式","距離","データ量","電池","必要なもの","判定"],res,["left","center","center","center","center","left"])+
        '<div class="wnote">△ の距離は、BLE の LE Coded や IEEE 802.15.4 の中継で広げた場合。電池の △ は、間欠動作（5 節）にすれば使えるが工夫が要るもの。'+
        'データ量の上限は目安（LoRaWAN は電波の規則による。21 章）。値はすべて代表値で、実際の選定は各章の計算で確かめる。</div>';
    }
    draw();
  };

  REG.w01_battery=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BATTERY","間欠動作の平均電流と電池寿命");
    var row=U.ctrls(el);
    var Is=U.slider(row,"眠っている間の電流 I_s",{min:0.1,max:200,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var Ia=U.slider(row,"起きている間の電流 I_a",{min:0.5,max:300,value:8,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var row2=U.ctrls(el);
    var ta=U.slider(row2,"起きている時間 t_a",{min:0.001,max:10,value:0.05,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var Tp=U.slider(row2,"周期 T",{min:1,max:86400,value:60,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var row3=U.ctrls(el);
    var cap=U.slider(row3,"電池の容量",{min:10,max:5000,value:220,log:true,fmt:function(v){return Math.round(v)+" mAh";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"CR2032（220 mAh）",function(){cap.set(220);draw();});
    U.button(br,"単 3 形 2 本（2000 mAh として）",function(){cap.set(2000);draw();});
    U.button(br,"例の値に戻す",function(){Is.set(2);Ia.set(8);ta.set(0.05);Tp.set(60);cap.set(220);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var is=Is.get()*1e-6, ia=Ia.get()*1e-3, t=ta.get(), T=Tp.get(), C=cap.get()*1e-3;
      var warn="";
      if(t>T){warn='<span class="warn">起きている時間が周期より長い。周期を t_a 以上にした値で計算した。</span><br>';T=t;}
      var act=(ia-is)*t/T, avg=is+act, lifeH=C/avg;   // 容量 [Ah] ÷ 平均電流 [A] = 寿命 [時間]
      var Ts=t*(ia-is)/is;
      var yr=function(TT){return C/(is+(ia-is)*t/TT)/24/365;};
      var W=700,o=[],p=U.plot(80,24,590,220,[1,86400],[1e-3,100],{xlog:true,ylog:true});
      o.push(p.axes({xl:"周期 T",yl:"電池寿命 [年]",xt:[1,10,60,600,3600,86400],yt:[0.001,0.01,0.1,1,10,100],
        xfmt:function(v){return F.time(v,2);},yfmt:function(v){return v>=1?String(v):String(v);}}));
      var pts=[];for(var k=0;k<=120;k++){var TT=Math.pow(10,k/120*Math.log10(86400));if(TT>=t)pts.push([TT,Math.max(1e-3,Math.min(100,yr(TT)))]);}
      o.push(p.line([[1,Math.min(100,C/is/24/365)],[86400,Math.min(100,C/is/24/365)]],"green",1.3,"6 4"));
      o.push(p.line(pts,"signal",2.4));
      if(Ts>=1&&Ts<=86400){o.push(S.L(p.X(Ts),p.Y(1e-3),p.X(Ts),p.Y(Math.max(1e-3,yr(Ts))),"faint",1,"3 3"));
        o.push(S.D(p.X(Ts),p.Y(Math.max(1e-3,yr(Ts))),"alias",4));o.push(S.T(p.X(Ts)+6,p.Y(Math.max(1e-3,yr(Ts)))+15,"T* = "+F.time(Ts),"start",10,"alias"));}
      var ly=Math.max(1e-3,Math.min(100,yr(T)));
      o.push(S.D(p.X(T),p.Y(ly),"signal",5));
      var rt=p.X(T)>560;
      o.push(S.T(p.X(T)+(rt?-8:8),p.Y(ly)+18,"いまの値",rt?"end":"start",10,"signal",true));
      o.push(S.T(p.X(1)+6,p.Y(Math.min(100,C/is/24/365))-6,"眠っている間の電流で決まる上限","start",9.5,"green"));
      // 内訳の帯
      var y2=290,bw=590,fs=is/avg;
      o.push(S.T(80,y2-8,"平均電流の内訳","start",10.5,"ink",true));
      o.push(S.RECT(80,y2,bw*fs,22,3,U.soft("green"),"green",1.2));
      o.push(S.RECT(80+bw*fs,y2,bw*(1-fs),22,3,U.soft("signal"),"signal",1.2));
      if(bw*fs>120)o.push(S.T(80+bw*fs/2,y2+15,"眠っている間 "+Math.round(fs*100)+" %","middle",10,"green",true));
      if(bw*(1-fs)>120)o.push(S.T(80+bw*fs+bw*(1-fs)/2,y2+15,"起きている分 "+Math.round((1-fs)*100)+" %","middle",10,"signal",true));
      box.set(S.svg(W,y2+34,o));
      var years=lifeH/24/365;
      ro.innerHTML=warn+"平均電流 I_avg = "+F.cur(is)+" + ("+F.cur(ia)+" − "+F.cur(is)+") × "+F.time(t)+" ÷ "+F.time(T)+" = <b>"+F.cur(avg)+"</b><br>"+
        "電池寿命 = "+Math.round(cap.get())+" mAh ÷ "+F.cur(avg)+" ≈ <b>"+U.fmt.int(lifeH)+" 時間</b>（"+(years>=1?U.sig(years,3)+" 年":U.sig(lifeH/24,3)+" 日")+"）<br>"+
        "T* = t_a (I_a − I_s) / I_s = <b>"+F.time(Ts)+"</b> → 周期が T* より"+(T<Ts?'<b>短い</b>ので、起きている分を減らす（t_a を短く、T を長く）のが効く':'<b>長い</b>ので、眠っている間の電流を減らすのが効く');
    }
    draw();
  };

  /* ===== 02 章 UART ===== */
  REG.w02_uart=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"UART","1 文字のフレームと、受け手が読む時刻");
    var row=U.ctrls(el);
    var ch=U.textin(row,"送る文字（1 文字）","A",draw);
    var db=U.select(row,"データビット",["8","7"],0,draw);
    var pa=U.select(row,"パリティ",["なし（N）","偶数（E）","奇数（O）"],0,draw);
    var sb=U.select(row,"ストップビット",["1","2"],0,draw);
    var row2=U.ctrls(el);
    var er=U.slider(row2,"受け手のビット時間の誤差 e",{min:-8,max:8,step:0.1,value:0,fmt:function(v){return (v>0?"+":"")+v.toFixed(1)+" %";},onInput:draw});
    var dl=U.checkbox(row2,"立ち下がりを見つける遅れ（1/16 ビット）を含める",true,draw);
    var nx=U.checkbox(row2,"すぐ後に次の文字が続く",false,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function frame(v,nd,par,ns){var b=[0];for(var i=0;i<nd;i++)b.push((v>>i)&1);
      if(par){var c=0;for(var j=0;j<nd;j++)c+=(v>>j)&1;b.push(par===1?(c&1):((c&1)^1));}for(var k=0;k<ns;k++)b.push(1);return b;}
    function draw(){
      var s=ch.get(),code=s.length?s.charCodeAt(0):65,nd=db.get()===0?8:7,par=pa.get(),ns=sb.get()+1;
      var warn="";
      if(code>255){warn='<span class="warn">1 バイトで表せない文字なので、下位 8 ビットを送る。</span><br>';}
      var v=code&(nd===8?255:127); if(nd===7&&code>127)warn+='<span class="warn">7 ビットに収まらないので、下位 7 ビットを送る。</span><br>';
      var bits=frame(v,nd,par,ns),n=bits.length;
      var after=nx.get()?frame(0x42,nd,par,ns):[1,1,1];       // 次の文字 'B' か、アイドル
      var line=bits.concat(after);
      var e=er.get()/100,d=dl.get()?1/16:0;
      var bw=46,x0=80,y0=48,h=34,W=x0+(n+3)*bw+40,o=[];
      // 線の上の信号（送り手）
      var pts=[[x0-40,y0],[x0,y0]],prev=1;
      line.slice(0,n+3).forEach(function(b,k){var x=x0+k*bw,yy=b?y0:y0+h;if(b!==prev)pts.push([x,yy]);else pts.push([x,yy]);pts.push([x+bw,yy]);prev=b;});
      for(var k=0;k<=n+3;k++)o.push(S.L(x0+k*bw,y0-14,x0+k*bw,y0+h+6,"grid",1));
      o.push(S.PL(pts,"signal",2.4));
      var names=["S"];for(var i=0;i<nd;i++)names.push("b"+i);if(par)names.push("P");for(var j=0;j<ns;j++)names.push("ストップ");
      names.forEach(function(nm,k){o.push(S.T(x0+(k+0.5)*bw,y0+h+20,nm,"middle",nm==="ストップ"?8.5:10,k===0?"alias":(nm==="ストップ"?"green":(nm==="P"?"gold":"signal")),true));
        o.push(S.T(x0+(k+0.5)*bw,y0-4,String(bits[k]),"middle",10.5,"ink",true,true));});
      for(var q=0;q<3;q++)o.push(S.T(x0+(n+q+0.5)*bw,y0+h+20,nx.get()?(q===0?"次の S":""):"アイドル","middle",9,"muted"));
      // 受け手が読む時刻
      var read=[],okAll=true,yt=y0+h+40;
      o.push(S.T(x0-8,yt+4,"受け手が","end",9.5,"muted"));o.push(S.T(x0-8,yt+17,"読む時刻","end",9.5,"muted"));
      for(var k2=0;k2<n;k2++){var t=(k2+0.5)*(1+e)+d,idx=Math.floor(t),val=idx<line.length?line[idx]:1,ok=idx===k2;
        if(!ok)okAll=false;read.push(val);
        var x=x0+t*bw;o.push(S.L(x,y0-10,x,yt,ok?"green":"alias",ok?1.4:2.2,ok?"3 3":null));
        o.push(S.D(x,yt,ok?"green":"alias",4));o.push(S.T(x,yt+16,String(val),"middle",10,ok?"green":"alias",true,true));}
      box.set(S.svg(W,yt+30,o));
      // 読み取った結果
      var rv=0;for(var i2=0;i2<nd;i2++)rv|=read[1+i2]<<i2;
      var perr=false;if(par){var c2=0;for(var j2=0;j2<nd;j2++)c2+=(rv>>j2)&1;var pb=read[1+nd];perr=par===1?((c2+pb)%2!==0):((c2+pb)%2!==1);}
      var ferr=false;for(var j3=0;j3<ns;j3++)if(read[1+nd+(par?1:0)+j3]!==1)ferr=true;
      var startBad=read[0]!==0;
      var lim=(0.5-d)/(n-0.5)*100;
      ro.innerHTML=warn+"送ったバイト 0x"+F.hex(v)+"（"+(v>=32&&v<127?"'"+String.fromCharCode(v)+"'":"制御文字")+"）・ フレーム "+n+" ビット時間 ・ 115200 bps なら "+F.time(n/115200)+"<br>"+
        "読み取ったバイト <b>0x"+F.hex(rv)+"</b>（"+(rv>=32&&rv<127?"'"+String.fromCharCode(rv)+"'":"制御文字")+"）"+
        (rv===v?' <span class="ok">一致</span>':' <span class="warn">送ったものと違う</span>')+
        (ferr?' ・ <span class="warn">フレーミングエラー</span>':'')+(perr?' ・ <span class="warn">パリティエラー</span>':(par?' ・ パリティ OK':''))+(startBad?' ・ <span class="warn">スタートビットが 1</span>':'')+"<br>"+
        "最後のビット（k = "+(n-1)+"）を読む時刻のずれ = ("+(n-1)+" + 1/2) × e"+(d?" + 1/16":"")+" = "+(((n-0.5)*e+d)>=0?"+":"")+U.sig((n-0.5)*e+d,3)+" ビット時間 ・ このフレームの形で読める e の範囲 ≈ "+
        (d?"−"+U.sig((0.5+d)/(n-0.5)*100,3)+" %〜+"+U.sig(lim,3)+" %":"±"+U.sig(lim,3)+" %")+(okAll?' <span class="ok">すべて正しいビットを読んだ</span>':' <span class="warn">隣のビットを読んだ所がある（赤）</span>');
    }
    draw();
  };

  REG.w02_baud=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BAUD","クロックからボーレートを作ったときの誤差");
    var CLK=[1.8432,4,8,12,14.7456,16,18.432,24,32,36,48,64,72,80,84,100,120,168];
    var BAUD=[9600,19200,38400,57600,115200,230400,460800,921600];
    var row=U.ctrls(el);
    var cl=U.select(row,"周辺回路のクロック",CLK.map(function(f){return {v:String(f),t:f+" MHz"};}),"16",draw);
    var bd=U.select(row,"ボーレート",BAUD.map(function(b){return {v:String(b),t:b+" bps"};}),"115200",draw);
    var row2=U.ctrls(el);
    var ov=U.select(row2,"オーバーサンプリング",["16 倍","8 倍"],0,draw);
    var fr=U.select(row2,"分周の値",["整数だけ","1/16 刻みの小数も使える"],0,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function calc(f,b,ovs,frac){var raw=f/(ovs*b),n=frac?Math.max(1,Math.round(raw*16)/16):Math.max(1,Math.round(raw));var act=f/(ovs*n);return {raw:raw,n:n,act:act,err:(act-b)/b*100};}
    function cls(e){var a=Math.abs(e);return a<=2?"green":a<=4.61?"gold":"alias";}
    function draw(){
      var f=parseFloat(cl.get())*1e6,b=parseInt(bd.get(),10),ovs=ov.get()===0?16:8,frac=fr.get()===1;
      var r=calc(f,b,ovs,frac);
      var W=700,o=[],p=U.plot(110,20,560,190,[-0.5,BAUD.length-0.5],[-10,10]);
      o.push(p.axes({yl:"誤差 [%]",xt:[],yt:[-8,-4,-2,0,2,4,8],yfmt:function(v){return v>0?"+"+v:String(v).replace("-","−");}}));
      o.push(S.RECT(p.x,p.Y(2),p.w,p.Y(-2)-p.Y(2),0,U.soft("green"),"none",0));
      [4.61,-4.61].forEach(function(v){o.push(S.L(p.x,p.Y(v),p.x+p.w,p.Y(v),"alias",1.2,"5 4"));});
      o.push(S.T(p.x+6,p.Y(4.61)-5,"±4.6 %（両側の合計の限界）","start",9.5,"alias"));
      o.push(S.T(p.x+6,p.Y(-2)-4,"±2 %（片側の目安）","start",9.5,"green"));
      BAUD.forEach(function(bb,i){var q=calc(f,bb,ovs,frac),e=Math.max(-10,Math.min(10,q.err)),c=cls(q.err),x=p.X(i),sel=bb===b;
        o.push(S.RECT(x-22,Math.min(p.Y(0),p.Y(e)),44,Math.max(1,Math.abs(p.Y(e)-p.Y(0))),2,U.soft(c),c,sel?2.6:1.2));
        o.push(S.T(x,p.Y(e)+(e>=0?-6:14),(q.err>0?"+":"")+q.err.toFixed(2)+(Math.abs(q.err)>10?"（枠外）":""),"middle",9,c,true));
        o.push(S.T(x,p.y+p.h+16,String(bb),"middle",9.5,sel?"signal":"ink",sel,true));});
      o.push(S.T(p.x+p.w/2,p.y+p.h+32,"ボーレート [bps]（太い枠が選んだもの）","middle",10,"muted"));
      box.set(S.svg(W,260,o));
      var v=Math.abs(r.err)<=2?'<span class="ok">片側の目安 ±2 % 以内</span>':Math.abs(r.err)<=4.61?'<b style="color:var(--gold)">±2 % を超える（相手の誤差によっては読み誤る）</b>':'<span class="warn">両側の合計の限界 ±4.6 % を超える（読めない）</span>';
      ro.innerHTML="分周の値 = "+U.sig(f/1e6,6)+" MHz ÷ ("+ovs+" × "+b+") = "+r.raw.toFixed(4)+" → <b>"+(frac?r.n.toFixed(4):r.n)+"</b><br>"+
        "実際のボーレート = "+U.sig(f/1e6,6)+" MHz ÷ ("+ovs+" × "+(frac?r.n.toFixed(4):r.n)+") = <b>"+U.sig(r.act,7)+" bps</b> ・ 誤差 <b>"+(r.err>0?"+":"")+r.err.toFixed(3)+" %</b> ・ "+v;
    }
    draw();
  };

  /* ===== 04 章 割り込み・DMA・リングバッファ ===== */

  /* ---- 2 節: 受信の ISR が待たされたときの FIFO ---- */
  REG.w04_overrun=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"OVERRUN","受信の ISR が待たされると、FIFO はどこまでもつか");
    var row=U.ctrls(el);
    var bd=U.select(row,"ボーレート（8N1）",[{v:"9600",t:"9600 bps"},{v:"115200",t:"115200 bps"},{v:"460800",t:"460800 bps"},{v:"921600",t:"921600 bps"},{v:"3000000",t:"3 Mbps"}],"115200",draw);
    var dp=U.select(row,"FIFO の深さ D",["1","4","8","16","32","64"].map(function(v){return {v:v,t:v+" バイト"};}),"16",draw);
    var row2=U.ctrls(el);
    var bl=U.slider(row2,"ISR が待たされる最長の時間",{min:1e-6,max:2e-2,value:3.6e-3,log:true,fmt:function(v){return v<=1.05e-6?"ほぼ 0":F.time(v);},onInput:draw});
    var ti=U.slider(row2,"ISR が 1 バイトに使う時間",{min:0.5,max:20,step:0.5,value:2,fmt:function(v){return v+" µs";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"2 節の printf の例",function(){bd.set("115200");dp.set("16");bl.set(3.6e-3);ti.set(2);draw();});
    U.button(br,"FIFO なし・100 µs 待たされる",function(){bd.set("115200");dp.set("1");bl.set(1e-4);ti.set(2);draw();});
    U.button(br,"3 Mbps・ISR 5 µs",function(){bd.set("3000000");dp.set("16");bl.set(1e-6);ti.set(5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var baud=+bd.get(),D=+dp.get(),blk=bl.get(),tisr=ti.get()*1e-6;
      if(blk<=1.05e-6)blk=0;
      var Tb=10/baud;
      var t0=Math.max(4*Tb,0.15*(blk+D*Tb));
      var W=t0+blk+Math.max(10*Tb,0.35*blk,1.2*D*Tb);
      if(tisr>Tb)W=Math.max(W,t0+1.6*D/(1/Tb-1/tisr)+10*Tb);   /* ISR が追いつけないときは、FIFO があふれる所まで見せる */
      var dt=Math.min(Tb,tisr)/4,n=Math.ceil(W/dt);
      if(n>400000){dt=W/400000;n=400000;}
      var fifo=0,lost=0,busy=0,nextArr=Tb,lv=[[0,0]],lostT=[],spans=[],maxf=0;
      for(var i=0;i<=n;i++){
        var t=i*dt;
        while(nextArr<=t){if(fifo<D){fifo++;lv.push([nextArr,fifo-1]);lv.push([nextArr,fifo]);}else{lost++;lostT.push(nextArr);}nextArr+=Tb;}
        if(fifo>maxf)maxf=fifo;
        var blocked=(t>=t0&&t<t0+blk);
        if(busy>0)busy-=dt;
        if(busy<=0&&!blocked&&fifo>0){
          lv.push([t,fifo]);fifo--;lv.push([t,fifo]);busy=tisr;
          if(spans.length&&t-spans[spans.length-1][1]<=dt*1.5)spans[spans.length-1][1]=t+tisr;else spans.push([t,t+tisr]);
        }
      }
      lv.push([W,fifo]);
      var au=W<2e-3?1e6:1e3,ax={u:au,un:W<2e-3?"µs":"ms",ticks:U.nice(0,W*au,6)},o=[],x0=110,pw=560;
      var X=function(t){return x0+t/W*pw;};
      // 待たされる区間
      o.push(S.T(x0-8,34,"待たされる","end",9.5,"teal"));
      if(blk>0){o.push(S.RECT(X(t0),22,Math.max(1,X(t0+blk)-X(t0)),16,2,U.soft("teal"),"teal",1));
        if(X(t0+blk)-X(t0)>200)o.push(S.T((X(t0)+X(t0+blk))/2,34,"ほかの ISR・割り込みの禁止など","middle",9.5,"teal",true));}
      // 受信の ISR
      o.push(S.T(x0-8,58,"受信の ISR","end",9.5,"gold"));
      spans.forEach(function(s){o.push(S.RECT(X(s[0]),46,Math.max(1.2,X(s[1])-X(s[0])),16,1,U.soft("gold"),"gold",0.8));});
      // FIFO の量
      var p=U.plot(x0,84,pw,120,[0,W],[0,D*1.12]);
      o.push(p.axes({yl:"FIFO の量",xt:ax.ticks.map(function(v){return v/ax.u;}),yt:[0,D],xfmt:function(v){return (+(v*ax.u).toPrecision(6))+" "+ax.un;},yfmt:function(v){return String(v);},ylOff:44}));
      o.push(p.line([[0,D],[W,D]],"alias",1.1,"5 4"));
      o.push(S.T(p.X(W)+4,p.Y(D)+4,"D","start",9.5,"alias",true));
      o.push(p.line(lv,"signal",1.8));
      if(lostT.length){
        o.push(S.T(x0-8,76,"失われた","end",9.5,"alias",true));
        var step=Math.max(1,Math.ceil(lostT.length/80));
        for(var k=0;k<lostT.length;k+=step)o.push(S.X(X(lostT[k]),72,3.5,"alias",1.6));
      }
      box.set(S.svg(700,246,o));
      var load=tisr/Tb,margin=D*Tb;
      var verdict=lost?'<span class="warn">'+lost+' バイトがオーバーランで失われた（この図の範囲）</span>':'<span class="ok">失われたバイトはない</span>';
      ro.innerHTML="1 バイトの時間 T_B = 10 ÷ "+baud+" = <b>"+F.time(Tb)+"</b> ・ FIFO の猶予 D × T_B = "+D+" × "+F.time(Tb)+" = <b>"+F.time(margin)+"</b><br>"+
        "ISR が待たされる時間 "+(blk?F.time(blk):"ほぼ 0")+" は猶予より"+(blk<margin?"<b>短い</b>":"<b>長い</b>")+" → "+verdict+"<br>"+
        "受信の ISR が CPU を使う割合 = "+F.time(tisr)+" ÷ "+F.time(Tb)+" = <b>"+U.sig(load*100,3)+" %</b>"+
        (load>=1?' <span class="warn">1 バイトの時間より ISR が長く、待たされなくても追いつけない（DMA を考える）</span>':(load>0.3?' <b style="color:var(--gold)">CPU の多くを受信に使っている</b>':''))+
        "<br>FIFO にたまった最大 = <b>"+maxf+"</b> バイト（深さ "+D+"）";
    }
    draw();
  };

  /* ---- 4 節: 読み書きの順番と、割り込みが入る位置 ---- */
  var _w04_POS=["① の前","① と ② の間","② と ③ の間","③ と ④ の間","④ の後"];
  /* 受信: タスクが ring_get、ISR が ring_put('E')。送信: タスクが ring_put('X')、ISR が ring_get して送る */
  function _w04_run(scene,good,full,at){
    var N=4,st,steps,isrLines=[],out={};
    var tr=[];   /* タスクの各文と、そのときの値 */
    if(scene===0){
      st={buf:full?["A","B","C","D"]:["A","B","C",""],head:full?4:3,tail:0};
      out.before={buf:st.buf.slice(),head:st.head,tail:st.tail};
      var loc={},got=[],dropped=false;
      var S1=function(){loc.t=st.tail;return "t = tail;  → t = "+loc.t;},
          S2=function(){return "if (head == t) …  → "+st.head+" ≠ "+loc.t+"（空でない）";},
          SR=function(){loc.b=st.buf[loc.t%N];return "*b = buf[t & 3];  → b = "+loc.b;},
          ST=function(){st.tail=loc.t+1;return "tail = t + 1;  → tail = "+st.tail;};
      steps=good?[S1,S2,SR,ST]:[S1,S2,ST,SR];
      var isr=function(){var h=st.head;isrLines.push("h = head;  → h = "+h);
        if(h-st.tail===N){dropped=true;isrLines.push("h − tail = "+h+" − "+st.tail+" = 4 → 満杯: E を捨てる（数える）");}
        else{isrLines.push("h − tail = "+h+" − "+st.tail+" = "+(h-st.tail)+" → 空きあり");st.buf[h%N]="E";isrLines.push("buf[h & 3] = buf["+(h%N)+"] = E");st.head=h+1;isrLines.push("head = h + 1;  → head = "+st.head);}};
      for(var i=0;i<4;i++){if(i===at)isr();tr.push(steps[i]());}
      if(at===4)isr();
      out.after={buf:st.buf.slice(),head:st.head,tail:st.tail};
      got.push(loc.b);
      while(st.head!==st.tail){got.push(st.buf[st.tail%N]);st.tail++;}
      var g=got.join("");
      out.result=g;out.dropped=dropped;
      out.ok=full?((g==="ABCD"&&dropped)||g==="ABCDE"):(g==="ABCE");
      out.what="タスクが受け取るバイトの列（この後、空になるまで読んだもの）";
      out.expect=full?"A B C D（E は満杯で捨てて数える）か A B C D E":"A B C E";
    }else{
      st={buf:["p","q","r","s"],head:4,tail:4};
      out.before={buf:st.buf.slice(),head:st.head,tail:st.tail};
      var lc={},sent=[];
      var P1=function(){lc.h=st.head;return "h = head;  → h = "+lc.h;},
          P2=function(){return "if (h − tail == 4) …  → "+(lc.h-st.tail)+"（満杯でない）";},
          PW=function(){st.buf[lc.h%N]="X";return "buf[h & 3] = X;  → buf["+(lc.h%N)+"] = X";},
          PH=function(){st.head=lc.h+1;return "head = h + 1;  → head = "+st.head;};
      steps=good?[P1,P2,PW,PH]:[P1,P2,PH,PW];
      var isr2=function(){var t=st.tail;isrLines.push("t = tail;  → t = "+t);
        if(st.head===t){isrLines.push("head == t → 空なので何もしない");}
        else{var b=st.buf[t%N];isrLines.push("b = buf[t & 3] = buf["+(t%N)+"] = "+b);st.tail=t+1;isrLines.push("tail = t + 1;  → tail = "+st.tail);sent.push(b);isrLines.push("送信データレジスタに "+b+" を書く");}};
      for(var j=0;j<4;j++){if(j===at)isr2();tr.push(steps[j]());}
      if(at===4)isr2();
      out.after={buf:st.buf.slice(),head:st.head,tail:st.tail};
      while(st.head!==st.tail){sent.push(st.buf[st.tail%N]);st.tail++;}
      out.result=sent.join("");out.ok=(out.result==="X");
      out.what="線に送られたバイト（この後、ISR が空になるまで送ったもの）";
      out.expect="X";
    }
    out.trace=tr;out.isr=isrLines;
    return out;
  }
  REG.w04_order=function(el,U){
    var S=U.S;
    U.head(el,"ORDER","読み書きの順番と、ISR が割り込む位置");
    var row=U.ctrls(el);
    var sc=U.select(row,"場面",["受信（ISR → タスク）","送信（タスク → ISR）"],0,draw);
    var od=U.select(row,"タスクの文の順番",["正しい（データ → 添字）","逆（添字 → データ）"],0,draw);
    var stt=U.select(row,"始めの受信バッファ",["満杯（A B C D）","3 個（A B C）"],0,draw);
    var row2=U.ctrls(el);
    var at=U.slider(row2,"ISR が割り込む位置",{min:0,max:4,step:1,value:3,fmt:function(v){return _w04_POS[v];},onInput:draw});
    var br=U.btnrow(el);
    var allOn=false;
    U.button(br,"すべての位置で試す",function(){allOn=true;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function cells(o,x,y,st,hl){
      for(var i=0;i<4;i++){var v=st.buf[i],c=v===""?null:(hl&&hl[i]?"gold":"signal");
        o.push(S.RECT(x+i*30,y,30,24,2,c?U.soft(c):"panel",c||"line",1.1));
        if(v!=="")o.push(S.T(x+i*30+15,y+16,v,"middle",11,c,true,true));
        o.push(S.T(x+i*30+15,y-4,String(i),"middle",8.5,"faint",false,true));}
      o.push(S.T(x+128,y+16,"tail = "+st.tail+"、head = "+st.head,"start",9.5,"muted"));
    }
    function draw(){
      var scene=sc.get(),good=od.get()===0,full=stt.get()===0,a=at.get();
      stt.el.style.opacity=scene===0?"1":"0.4";
      var r=_w04_run(scene,good,full,a),o=[];
      var who=scene===0?"タスク（ring_get で 1 バイト取り出す）":"タスク（ring_put で X を入れる）";
      var isrWho=scene===0?"ISR（E を受け取り、ring_put(E)）":"ISR（送信データレジスタが空いた。ring_get して送る）";
      o.push(S.T(16,18,who,"start",10.5,"purple",true));
      var y=40,nums=["①","②","③","④"];
      for(var i=0;i<=4;i++){
        if(i===a){
          var h=20+r.isr.length*16;
          o.push(S.RECT(36,y-12,400,h,6,U.soft("gold"),"gold",1.3));
          o.push(S.T(46,y+3,isrWho,"start",10,"gold",true));
          r.isr.forEach(function(l,k){o.push(S.T(56,y+20+k*16,l,"start",9.5,"ink",false,true));});
          y+=h+8;
        }
        if(i<4){
          var bad=(!r.ok&&((scene===0&&!good&&i===3)||(scene===1&&!good&&i===3)));
          o.push(S.T(20,y+4,nums[i],"start",10.5,bad?"alias":"purple",true));
          o.push(S.T(40,y+4,r.trace[i],"start",9.5,bad?"alias":"ink",bad,true));
          y+=22;
        }
      }
      var xr=470;
      o.push(S.T(xr,18,"バッファ（大きさ 4）","start",10.5,"signal",true));
      o.push(S.T(xr,44,"始め","start",9.5,"muted"));
      cells(o,xr,56,r.before);
      o.push(S.T(xr,104,"タスクの 4 つの文の後（金: ISR が書いた所）","start",9.5,"muted"));
      var hl=r.before.buf.map(function(v,i){return v!==r.after.buf[i];});
      cells(o,xr,116,r.after,hl);
      var hgt=Math.max(y+10,160);
      o.push(S.T(xr,hgt-6,r.ok?"結果: 正しい":"結果: 壊れた","start",11,r.ok?"green":"alias",true));
      box.set(S.svg(700,hgt+4,o));
      var html=r.what+": <b>"+r.result.split("").join(" ")+"</b> "+(r.ok?'<span class="ok">正しい</span>':'<span class="warn">壊れた</span>')+"（正しい結果: "+r.expect+"）";
      if(!r.ok)html+="<br>"+(scene===0?"タスクが tail を進めた後、データを読む前に ISR が割り込み、空いたと判断した位置に E を書いた。A は失われ、E は 2 回読まれる。":"タスクが head を進めた後、データを書く前に ISR が割り込み、まだ書かれていない位置の古いバイトを送った。X は送られない。");
      if(allOn){
        var rows=[],nbad=0;
        for(var k=0;k<=4;k++){var q=_w04_run(scene,good,full,k);if(!q.ok)nbad++;rows.push([_w04_POS[k],q.result.split("").join(" "),q.ok?'<span class="ok">正しい</span>':'<span class="warn">壊れた</span>']);}
        html+="<br>5 か所のうち <b>"+nbad+"</b> か所で壊れる"+U.tbl(["ISR が割り込む位置",scene===0?"タスクが受け取る列":"送られた列","結果"],rows,["left","left","left"]);
      }
      ro.innerHTML=html;
      allOn=false;
    }
    draw();
  };

  /* ---- 5 節: 受信バッファの中の量 ---- */
  REG.w04_ring=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"RING","受信バッファの中の量の時間変化");
    var row=U.ctrls(el);
    var bd=U.select(row,"届く速さ（8N1）",[{v:"9600",t:"9600 bps"},{v:"115200",t:"115200 bps"},{v:"460800",t:"460800 bps"},{v:"921600",t:"921600 bps"}],"115200",draw);
    var md=U.select(row,"届き方",["続けて届く","まとまって届く"],0,draw);
    var bs=U.select(row,"1 回のまとまり",[64,128,256,512,1024,2048,4096].map(function(v){return {v:String(v),t:v+" バイト"};}),"1024",draw);
    var bi=U.slider(row,"まとまりの間隔",{min:5,max:1000,value:200,log:true,fmt:function(v){return F.time(v/1000);},onInput:draw});
    var row2=U.ctrls(el);
    var per=U.slider(row2,"読み手の周期",{min:1,max:100,value:10,log:true,fmt:function(v){return F.time(v/1000);},onInput:draw});
    var cap=U.slider(row2,"1 回に取り出せる上限",{min:16,max:8192,value:8192,log:true,fmt:function(v){return v>=8000?"制限なし":Math.round(v)+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var stl=U.slider(row3,"ときどき止まる長さ",{min:0,max:200,step:1,value:10,fmt:function(v){return v+" ms";},onInput:draw});
    var stf=U.select(row3,"止まる頻度",["止まらない","2 秒に 1 回","1 秒に 1 回","0.5 秒に 1 回"],1,draw);
    var nb=U.select(row3,"バッファの大きさ N",[64,128,256,512,1024,2048,4096,8192].map(function(v){return {v:String(v),t:v+" バイト"};}),"256",draw);
    var brw=U.btnrow(el);
    U.button(brw,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(brw,"5 節の例（読まない時間が最長 20 ms）",function(){bd.set("115200");md.set(0);per.set(10);cap.set(8192);stl.set(10);stf.set(2);nb.set("256");draw();});
    U.button(brw,"平均の速さが足りない例",function(){bd.set("115200");md.set(0);per.set(10);cap.set(100);stl.set(0);stf.set(0);nb.set("256");draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var r=(+bd.get())/10/1000;            /* 届く速さ [バイト/ms] */
      var burst=md.get()===1,B=+bs.get(),BI=bi.get(),P=per.get(),C=cap.get()>=8000?Infinity:cap.get();
      var SL=stl.get(),fq=[0,0.5,1,2][stf.get()],N=+nb.get();
      bs.el.style.opacity=bi.el.style.opacity=burst?"1":"0.4";
      var Wms=1000,dt=0.05,rg=U.rng(seed*7919+13);
      /* 止まる区間（乱数で置く） */
      var stalls=[];
      if(SL>0&&fq>0){var k=Math.round(fq*Wms/1000);for(var i=0;i<k;i++){var ts=(i+rg.range(0.15,0.85))*Wms/k;stalls.push([ts,ts+SL]);}}
      function stalled(t){for(var i=0;i<stalls.length;i++)if(t>=stalls[i][0]&&t<stalls[i][1])return true;return false;}
      var lvl=0,pts=[[0,0]],drops=0,dropT=[],maxl=0,nextRead=P,inSum=0,wasStall=false,arrOn=null,longest=0,lastRead=0,pinned=false;
      var n=Math.round(Wms/dt);
      for(var s=1;s<=n;s++){
        var t=s*dt,on;
        if(!burst)on=true;else{var ph=t%BI;on=ph<B/r;}
        if(on!==arrOn){pts.push([t-dt,lvl]);arrOn=on;}
        if(on){lvl+=r*dt;inSum+=r*dt;}
        if(lvl>N){if(!pinned){pts.push([t,N]);pinned=true;}drops+=lvl-N;if(!dropT.length||t-dropT[dropT.length-1]>2)dropT.push(t);lvl=N;}else pinned=false;
        if(lvl>maxl)maxl=lvl;
        var stl_=stalled(t);
        if(wasStall&&!stl_){pts.push([t,lvl]);var take=Math.min(lvl,C);lvl-=take;pts.push([t,lvl]);longest=Math.max(longest,t-lastRead);lastRead=t;nextRead=t+P;}
        else if(t>=nextRead-1e-9){if(!stl_){pts.push([t,lvl]);var tk=Math.min(lvl,C);lvl-=tk;pts.push([t,lvl]);longest=Math.max(longest,t-lastRead);lastRead=t;}nextRead+=P;}
        wasStall=stl_;
      }
      pts.push([Wms,lvl]);
      var o=[],p=U.plot(80,30,580,170,[0,Wms],[0,N*1.15]);
      stalls.forEach(function(q){o.push(S.RECT(p.X(q[0]),p.y,Math.max(1,p.X(Math.min(q[1],Wms))-p.X(q[0])),p.h,0,U.soft("teal"),"none",0));});
      o.push(p.axes({xl:"時間 [ms]",yl:"量 [バイト]",xt:[0,200,400,600,800,1000],yt:[0,N/2,N],yfmt:function(v){return String(Math.round(v));},xfmt:function(v){return String(v);}}));
      o.push(p.line([[0,N],[Wms,N]],"alias",1.1,"5 4"));
      o.push(S.T(p.X(Wms)+4,p.Y(N)+4,"N","start",9.5,"alias",true));
      o.push(p.line(pts,"signal",1.4));
      dropT.forEach(function(t){o.push(S.X(p.X(t),p.y-8,3.5,"alias",1.6));});
      if(stalls.length)o.push(S.T(p.x+4,p.y-8,"青緑の帯: 読み手が止まっている","start",9.5,"teal"));
      box.set(S.svg(700,246,o));
      var avgIn=inSum/Wms*1000,capAvg=C===Infinity?Infinity:C/P*1000;
      var Ts=P+(SL>0&&fq>0?SL:0),est=r*1000*Ts/1000;
      if(burst)est=Math.min(est,B);
      var html="届く速さ（届いている間）v = "+U.fmt.int(r*1000)+" バイト/秒 ・ 平均 "+U.fmt.int(avgIn)+" バイト/秒 ・ 読み手が取り出せる平均 "+(capAvg===Infinity?"制限なし":U.fmt.int(capAvg)+" バイト/秒")+"<br>"+
        "最大の量 <b>"+Math.round(maxl)+"</b> バイト（N = "+N+"） ・ あふれて失われた "+(drops>0.5?'<span class="warn">'+U.fmt.int(drops)+" バイト</span>":'<span class="ok">0 バイト</span>')+"<br>"+
        "読み手が読まない最長の時間 T_s = 周期 + 止まる長さ = "+F.time(Ts/1000)+"（この図の中の最長 "+F.time(longest/1000)+"） ・ 見積もり v × T_s = <b>"+U.fmt.int(est)+"</b> バイト"+(burst?"（まとまりの大きさ "+Math.round(B)+" バイトを上限とする）":"");
      if(capAvg<avgIn*0.999)html+='<br><span class="warn">読み手の平均の速さが、届く平均の速さより小さい。どの大きさでもいつかはあふれる</span>';
      ro.innerHTML=html;
    }
    draw();
  };

  /* ---- 6 節: 循環モードの DMA ---- */
  REG.w04_dma=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"DMA","循環モードの DMA と、知らせのたびに処理する範囲");
    var row=U.ctrls(el);
    var nb=U.select(row,"DMA のバッファの大きさ N",["32","64","128","256"].map(function(v){return {v:v,t:v+" バイト"};}),"64",draw);
    var ln=U.slider(row,"メッセージの長さ",{min:1,max:200,step:1,value:20,fmt:function(v){return v+" バイト";},onInput:draw});
    var gp=U.slider(row,"メッセージの間隔",{min:2,max:100,step:1,value:20,fmt:function(v){return v+" バイト分";},onInput:draw});
    var row2=U.ctrls(el);
    var vr=U.checkbox(row2,"長さを乱数で変える（半分〜1.5 倍）",true,draw);
    var idl=U.checkbox(row2,"アイドルライン検出を使う",true,draw);
    var dl=U.slider(row2,"割り込みが待たされる時間",{min:0,max:200,step:1,value:10,fmt:function(v){return v+" バイト分";},onInput:draw});
    var brw=U.btnrow(el);
    U.button(brw,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var N=+nb.get(),L=ln.get(),G=gp.get(),useIdle=idl.get(),d=dl.get(),rg=U.rng(seed*104729+7);
      var TE=Math.max(320,6*N);
      /* メッセージの列（時刻は 1 バイトの時間を単位とする。バイトは整数の時刻に受け取り終わる） */
      var msgs=[],t=2;
      while(true){var l=vr.get()?Math.max(1,Math.round(L*rg.range(0.5,1.5))):L;if(t+l>TE-8)break;msgs.push([t,t+l]);t+=l+G;}
      /* 割り込みが待たされる区間: 2N ごとに 1 回、長さ d、置く位置は乱数 */
      var blocks=[];
      if(d>0){var per=Math.max(2*N,d+N/2);for(var b0=0;b0<TE;b0+=per){var bs0=Math.round(b0+rg.range(0,per-d));if(bs0<TE)blocks.push([bs0,bs0+d]);}}
      function blockEnd(tq){for(var i=0;i<blocks.length;i++)if(tq>=blocks[i][0]&&tq<blocks[i][1])return blocks[i][1];return null;}
      var arrT=[],msgOf=[],pos=0,ev=[];
      msgs.forEach(function(m,mi){for(var tt=m[0]+1;tt<=m[1];tt++){arrT.push(tt);msgOf.push(mi);pos++;
          if(pos===N/2)ev.push([tt,"半分"]);if(pos===N){pos=0;ev.push([tt,"全部"]);}}
        if(useIdle)ev.push([m[1]+1,"アイドル"]);});
      ev.sort(function(a,b){return a[0]-b[0];});
      /* 各知らせを処理する時刻: 待たされる区間の中なら区間の終わり（まとめて 1 回）、そうでなければすぐ */
      var procs=[];
      ev.forEach(function(e){var be=blockEnd(e[0]),tp=be==null?e[0]:be;
        if(procs.length&&procs[procs.length-1].t===tp)procs[procs.length-1].ev.push(e);else procs.push({t:tp,ev:[e]});});
      function stateAt(tq){var p=0,sl=[];for(var i=0;i<N;i++)sl.push(-1);for(var k=0;k<arrT.length&&arrT[k]<=tq;k++){sl[p]=k;p=(p+1)%N;}return {pos:p,slot:sl};}
      var last=0,deliv=[],rows=[],deliveredAt=[];
      procs.forEach(function(q){var stt=stateAt(q.t),p=stt.pos,rngs=[];
        function take(a,b){for(var k=a;k<b;k++){var sq=stt.slot[k];deliv.push(sq);if(sq>=0&&deliveredAt[sq]==null)deliveredAt[sq]=q.t;}rngs.push(a+"〜"+(b-1));}
        if(p>last)take(last,p);else if(p<last){take(last,N);if(p>0)take(0,p);}
        last=p;q.pos=p;
        rows.push([q.ev.map(function(e){return e[0];}).join("・"),q.ev.map(function(e){return e[1];}).join("・"),String(q.t),String(p),rngs.length?rngs.join("、"):"（なし）"]);});
      /* 処理した列を、送った順（0, 1, 2, …）と比べる。最後に処理したものより後は「まだ処理していない」 */
      var okSeq=true,seen={},maxD=-1;
      for(var k=0;k<deliv.length;k++){if(deliv[k]!==k)okSeq=false;if(deliv[k]>=0){seen[deliv[k]]=1;maxD=Math.max(maxD,deliv[k]);}}
      var miss=0,pend=arrT.length-1-maxD;
      for(var s2=0;s2<=maxD;s2++)if(!seen[s2])miss++;
      var dup=deliv.length-Object.keys(seen).length;
      var dls=[];msgs.forEach(function(m,mi){var ls=-1;for(var k=0;k<msgOf.length;k++)if(msgOf[k]===mi)ls=k;if(ls>=0&&deliveredAt[ls]!=null)dls.push(deliveredAt[ls]-m[1]);});
      /* 処理と処理の間に書かれたバイト数の最大 */
      var maxGap=0,prevCnt=0;procs.forEach(function(q){var c=0;for(var k=0;k<arrT.length&&arrT[k]<=q.t;k++)c++;maxGap=Math.max(maxGap,c-prevCnt);prevCnt=c;});
      var o=[],p=U.plot(110,56,560,120,[0,TE],[0,N]);
      o.push(S.T(100,34,"RX の線","end",9.5,"muted"));
      msgs.forEach(function(m){o.push(S.RECT(p.X(m[0]),24,Math.max(1.5,p.X(m[1])-p.X(m[0])),14,2,U.soft("signal"),"signal",1));});
      blocks.forEach(function(q){if(q[0]<TE)o.push(S.RECT(p.X(q[0]),p.y,Math.max(1,p.X(Math.min(q[1],TE))-p.X(q[0])),p.h,0,U.soft("teal"),"none",0));});
      o.push(p.axes({xl:"時間（1 バイトの時間を単位とする。115200 bps なら 1 = 86.8 µs）",yl:"次に書く位置",xt:U.nice(0,TE,6),yt:[0,N/2,N],yfmt:function(v){return String(v);}}));
      o.push(p.line([[0,N/2],[TE,N/2]],"faint",1,"3 3"));
      var pl=[[0,0]],pp=0;
      msgs.forEach(function(m){pl.push([m[0],pp]);for(var tt=m[0]+1;tt<=m[1];tt++){pp++;if(pp===N){pl.push([tt,N]);pp=0;pl.push([tt,0]);}}pl.push([m[1],pp]);});
      pl.push([TE,pp]);
      o.push(p.line(pl,"gold",1.8));
      var ye=228;
      o.push(S.T(100,ye+4,"知らせ","end",9.5,"muted"));
      ev.forEach(function(e){var c=e[1]==="アイドル"?"signal":"gold";o.push(S.L(p.X(e[0]),ye-6,p.X(e[0]),ye+6,c,2));});
      o.push(S.T(100,ye+26,"処理","end",9.5,"muted"));
      procs.forEach(function(q){o.push(S.D(p.X(q.t),ye+22,"purple",2.6));});
      o.push(S.T(p.x,ye+44,"金: 半分完了・全部完了、青: アイドルライン、紫の点: 処理した時刻、青緑の帯: ときどき割り込みが待たされる間","start",9.5,"muted"));
      box.set(S.svg(700,ye+54,o));
      var cond=d<N/2;
      var mx=dls.length?Math.max.apply(null,dls):0,av=dls.length?dls.reduce(function(a,b){return a+b;},0)/dls.length:0;
      var html="知らせ: 半分 "+ev.filter(function(e){return e[1]==="半分";}).length+" 回、全部 "+ev.filter(function(e){return e[1]==="全部";}).length+" 回、アイドル "+ev.filter(function(e){return e[1]==="アイドル";}).length+" 回 ・ "+
        "メッセージの最後のバイトから処理まで: 平均 <b>"+U.sig(av,3)+"</b>、最大 <b>"+Math.round(mx)+"</b> バイト分（115200 bps なら最大 "+F.time(mx*10/115200)+"）<br>"+
        "処理と処理の間に書かれたバイト数の最大 <b>"+maxGap+"</b>（N = "+N+" 未満なら失わない） ・ 条件 L_max < (N/2) T_B: 待たされる時間 "+d+" バイト分、N/2 = "+(N/2)+" バイト分 → "+(cond?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"<br>"+
        (okSeq&&miss===0&&dup===0?'<span class="ok">送ったバイトを、順番どおりに抜けなく処理した</span>':'<span class="warn">上書きされて失われたバイト '+miss+(dup>0?"、2 回処理したバイト "+dup:"")+'（処理した順番も乱れた）</span>')+
        (pend>0?" ・ 図の終わりの時点で、まだ処理されていないバイト "+pend:"");
      if(!useIdle)html+="<br>アイドルライン検出がないので、メッセージの終わりは、次の「半分」か「全部」まで処理されない。";
      html+=U.tbl(["知らせの時刻","種類","処理した時刻","pos","処理した範囲"],rows.slice(0,8),["right","left","right","right","left"])+(rows.length>8?'<div class="wnote">（最初の 8 回だけを表示）</div>':"");
      ro.innerHTML=html;
    }
    draw();
  };

  /* ===== 05 章 状態機械とタイムアウト ===== */
  /* 曲がった矢印（figures.py の CARR と同じ形） */
  function _w05_carr(S,x1,y1,x2,y2,bend,c,lw,op){
    var mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,cx=mx+bend*dy,cy=my-bend*dx,a=Math.atan2(y2-cy,x2-cx),hd=7;
    var xe=x2-hd*0.6*Math.cos(a),ye=y2-hd*0.6*Math.sin(a);
    return '<g opacity="'+(op==null?1:op)+'">'+S.PATH("M"+x1+","+y1+" Q"+cx+","+cy+" "+xe+","+ye,c,lw)+S.head(cx,cy,x2,y2,c,hd)+'</g>';
  }

  /* ---- デモ 1: 状態機械のステップ実行 ---- */
  REG.w05_fsm=function(el,U){
    var S=U.S;
    U.head(el,"FSM","センサを読む手順の状態機械を、イベントで 1 回ずつ動かす");
    var br=U.btnrow(el);
    var EVN=["依頼","応答（正常）","応答（エラー）","時間切れ"];
    EVN.forEach(function(n,i){U.button(br,n,function(){step(i);});});
    U.button(br,"最初に戻す",function(){st=0;tries=0;last=null;log=[];draw();});
    var box=U.svgbox(el); var tb=U.mk("div","readout"); el.appendChild(tb); var ro=U.readout(el);
    var st=0,tries=0,last=null,log=[];
    var SN=["待機","応答待ち","リセット待ち"];
    /* 1 回の遷移: 戻り値 {act, next, edge, cell} */
    function trans(s,e){
      if(s===0){
        if(e===0)return {act:"送る、回数 = 1、タイマ 100 ms",next:1,edge:"start",tr:1};
        if(e===3)return {act:"起きない（待機中はタイマが止まっている）",next:0,edge:null,none:true};
        return {act:"捨てる（遅れて届いた応答など）",next:0,edge:null};
      }
      if(s===1){
        if(e===0)return {act:"「使用中」と答える",next:1,edge:null};
        if(e===1)return {act:"結果を渡す",next:0,edge:"resp"};
        if(e===2)return {act:"エラーを渡す",next:0,edge:"resp"};
        if(tries<3)return {act:"送り直す、回数 = "+(tries+1)+"、タイマ 100 ms",next:1,edge:"retry",cond:"回数 "+tries+" < 3",tr:tries+1};
        return {act:"子機をリセット、タイマ 500 ms",next:2,edge:"reset",cond:"回数 3 = 3"};
      }
      if(e===0)return {act:"「使用中」と答える",next:2,edge:null};
      if(e===3)return {act:"失敗を渡す",next:0,edge:"fail"};
      return {act:"捨てる",next:2,edge:null};
    }
    function step(e){
      var r=trans(st,e);
      last={from:st,ev:e,r:r};
      if(r.tr!=null)tries=r.tr;
      log.unshift(SN[st]+" で「"+EVN[e]+"」"+(r.cond?" ["+r.cond+"]":"")+" → "+r.act+(r.next!==st?" → "+SN[r.next]:""));
      if(log.length>6)log.pop();
      st=r.next; draw();
    }
    function draw(){
      var o=[],y=124,h=40,P=[[110,96],[360,112],[600,124]],E=last&&last.r.edge;
      function op(id){return E===id?1:0.42;} function lw(id){return E===id?3:1.6;}
      o.push(_w05_carr(S,158,y-8,304,y-8,0.28,"green",lw("start"),op("start")));
      o.push(S.T(239,y-52,"依頼 / 送る、タイマ開始","middle",10,"green",true));
      o.push(_w05_carr(S,304,y+8,158,y+8,0.28,"green",lw("resp"),op("resp")));
      o.push(S.T(239,y+60,"応答 / 結果を渡す","middle",10,"green",true));
      var sx=360,sy=y-h/2;
      o.push('<g opacity="'+op("retry")+'">'+S.PATH("M"+(sx-10)+","+sy+" C"+(sx-22)+","+(sy-43)+" "+(sx+22)+","+(sy-43)+" "+(sx+10)+","+(sy-1),"gold",lw("retry"))+S.head(sx+16,sy-12,sx+10,sy-1,"gold",6)+'</g>');
      o.push(S.T(sx,y-78,"時間切れ [回数 < 3] /","middle",10,"gold",true));
      o.push(S.T(sx,y-64,"送り直す、タイマ開始","middle",10,"gold",true));
      o.push('<g opacity="'+op("reset")+'">'+S.ARR(418,y,536,y,"alias",lw("reset"))+'</g>');
      o.push(S.T(477,y-24,"時間切れ [回数 = 3]","middle",10,"alias",true));
      o.push(S.T(477,y-10,"/ 子機をリセット","middle",10,"alias",true));
      var yb=y+118;
      o.push('<g opacity="'+op("fail")+'">'+S.PATH("M600,"+(y+h/2)+" C600,"+yb+" 110,"+yb+" 112,"+(y+h/2+8),"alias",lw("fail"))+S.PL([[112,y+h/2+1],[107,y+h/2+10],[117,y+h/2+10]],"alias",1,"alias")+'</g>');
      o.push(S.T(355,y+108,"時間切れ / 失敗を渡す","middle",10,"alias",true));
      P.forEach(function(p,i){var cur=i===st,x=p[0];
        o.push(S.RECT(x-p[1]/2,y-h/2,p[1],h,h/2.6,cur?"signal":U.soft("signal"),"signal",cur?3:1.6));
        o.push(S.T(x,y+4,SN[i],"middle",11.5,cur?"panel":"signal",true));});
      o.push(S.D(42,y,"ink",5));o.push(S.ARR(48,y,60,y,"ink",1.4,6));
      if(last&&!last.r.edge){var x0=P[last.from][0];o.push(S.T(x0,y+38,last.r.none?"（何も起きない）":"（同じ状態のまま）","middle",9.5,"muted"));}
      o.push(S.T(640,y+52,"回数 = "+tries,"middle",11,"ink",true,true));
      box.set(S.svg(700,y+124,o));
      /* 状態遷移表（使った欄を強調） */
      var cells=[["送る → 応答待ち","捨てる","捨てる","（起きない）"],
                 ["使用中と答える","結果 → 待機","エラー → 待機","回数 &lt; 3: 送り直す<br>回数 = 3: → リセット待ち"],
                 ["使用中と答える","捨てる","捨てる","失敗 → 待機"]];
      var rows=cells.map(function(r,i){return ['<b>'+SN[i]+'</b>'].concat(r.map(function(c,j){
        var hl=last&&last.from===i&&last.ev===j;
        return hl?'<span style="background:var(--signal-soft);border:1px solid var(--signal);border-radius:4px;padding:0 .3em;color:var(--ink)">'+c+'</span>':c;}));});
      tb.innerHTML='状態遷移表（今の遷移の欄を囲む）'+U.tbl(["状態 ＼ イベント"].concat(EVN),rows);
      ro.innerHTML=(last?"直前の遷移: <b>"+U.esc(log[0])+"</b>":"イベントのボタンを押すと、今の状態（塗りつぶした箱）から遷移する。")+
        (log.length>1?'<div class="wnote">'+log.slice(1).map(U.esc).join("<br>")+'</div>':"");
    }
    draw();
  };

  /* ---- デモ 2: ストップアンドウェイトの模擬 ---- */
  /* 送り始めから To で再送。データは送り終えて RTT/2 後に届き、ACK はその RTT/2 後に届く（05 章 4 節のモデル） */
  function _w05_saw(U,N,Tf,RTT,To,pd,pa,useSeq,seed){
    var r=U.rng(seed),ev=[],cnt=0,log=[];
    function push(t,k,a,b,c){ev.push({t:t,n:cnt++,k:k,a:a,b:b,c:c});}
    function pop(){var bi=0;for(var i=1;i<ev.length;i++){if(ev[i].t<ev[bi].t||(ev[i].t===ev[bi].t&&ev[i].n<ev[bi].n))bi=i;}return ev.splice(bi,1)[0];}
    var st={next:0,busy:false,seq:0,cur:-1,line:0,deadline:null,tx:0,resend:0},rx={expect:0,got:{},ndeliv:0};
    var s={dupDrop:0,dupDeliv:0,staleAck:0,wrongAck:0,end:0};
    function send(t,re){var start=Math.max(t,st.line);st.line=start+Tf;st.tx++;if(re)st.resend++;
      st.deadline=start+To;push(st.deadline,"timer",st.cur,st.tx);
      var lost=r.next()<pd,at=start+Tf+RTT/2;
      log.push({k:"data",m:st.cur,seq:st.seq,t0:start,t1:at,lost:lost,re:re});
      if(!lost)push(at,"data",st.cur,st.seq,log.length-1);}
    function startNext(t){if(st.next>=N)return;st.cur=st.next++;st.busy=true;send(t,false);}
    startNext(0);var guard=0;
    while(ev.length&&guard++<200000){
      var e=pop(),t=e.t;
      if(e.k==="data"){var m=e.a,sq=e.b,res;
        if(useSeq){if(sq===rx.expect){rx.got[m]=1;rx.ndeliv++;rx.expect^=1;res="new";}else{s.dupDrop++;res="drop";}}
        else{if(rx.got[m]){s.dupDeliv++;res="dupdeliv";}else{rx.got[m]=1;res="new";}rx.ndeliv++;}
        log[e.c].res=res;
        var al=r.next()<pa;log.push({k:"ack",m:m,seq:sq,t0:t,t1:t+RTT/2,lost:al});
        if(!al)push(t+RTT/2,"ack",m,sq,log.length-1);}
      else if(e.k==="ack"){var ok=st.busy&&(!useSeq||e.b===st.seq);
        if(ok){if(e.a!==st.cur){s.wrongAck++;log[e.c].res="wrong";}else log[e.c].res="ok";
          st.busy=false;st.seq^=1;st.deadline=null;s.end=t;startNext(t);}
        else{s.staleAck++;log[e.c].res="stale";}}
      else if(e.k==="timer"){if(st.busy&&st.cur===e.a&&st.deadline===t){log.push({k:"to",m:st.cur,t0:t});send(t,true);}}
    }
    var uniq=0;for(var q=0;q<N;q++)if(rx.got[q])uniq++;
    return {log:log,tx:st.tx,resend:st.resend,uniq:uniq,lost:N-uniq,dupDrop:s.dupDrop,dupDeliv:s.dupDeliv,staleAck:s.staleAck,wrongAck:s.wrongAck,end:s.end};
  }
  function _w05_p4(v){return +v.toPrecision(4);}   /* 対数目盛のスライダーを有効数字 4 桁に丸める */
  REG.w05_saw=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ARQ","ストップアンドウェイトで 20 個のメッセージを送る");
    var row=U.ctrls(el);
    var pd=U.slider(row,"データが失われる確率 p_d",{min:0,max:50,step:1,value:10,fmt:function(v){return v+" %";},onInput:draw});
    var pa=U.slider(row,"ACK が失われる確率 p_a",{min:0,max:50,step:1,value:10,fmt:function(v){return v+" %";},onInput:draw});
    var row2=U.ctrls(el);
    var tf=U.slider(row2,"送る時間 T_f",{min:0.5,max:50,value:5.556,log:true,snap:_w05_p4,fmt:function(v){return F.time(v/1000,4);},onInput:draw});
    var rt=U.slider(row2,"往復時間 RTT",{min:0.5,max:500,value:1.694,log:true,snap:_w05_p4,fmt:function(v){return F.time(v/1000,4);},onInput:draw});
    var to=U.slider(row2,"タイムアウト T_o",{min:1,max:1000,value:20,log:true,snap:_w05_p4,fmt:function(v){return F.time(v/1000);},onInput:draw});
    var row3=U.ctrls(el);
    var sq=U.select(row3,"シーケンス番号",["使う（データと ACK に 1 ビット）","使わない"],0,draw);
    var br=U.btnrow(el);
    var seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例 1: UART",function(){tf.set(5.556);rt.set(1.694);to.set(20);draw();});
    U.button(br,"例 2: 遠くのサーバ",function(){tf.set(0.8);rt.set(100);to.set(300);draw();});
    U.button(br,"T_o を短すぎる値に",function(){to.set(Math.max(1,+((tf.get()+rt.get())*0.6).toPrecision(3)));draw();});
    var play=U.button(br,"▶ 再生",function(){if(tk.running()){tk.stop();play.textContent="▶ 再生";cursor=null;render();}else{cursor=0;tk.start();play.textContent="■ 止める";}});
    var box=U.svgbox(el); var ro=U.readout(el);
    var res=null,cursor=null,win=1,SHOW=8;
    var tk=U.ticker(function(){cursor+=win/90;if(cursor>=win){cursor=null;tk.stop();play.textContent="▶ 再生";}render();},50);
    function draw(){
      var Tf=tf.get(),R=rt.get(),To=to.get();
      res=_w05_saw(U,20,Tf,R,To,pd.get()/100,pa.get()/100,sq.get()===0,seed);
      /* 図に描く範囲: 最初の SHOW 個のメッセージが終わるまで */
      win=0;res.log.forEach(function(g){if(g.m<SHOW)win=Math.max(win,g.t1!=null?g.t1:g.t0);});
      if(!(win>0))win=Tf+R;
      render();
      var s=(1-pd.get()/100)*(1-pa.get()/100),eta0=Tf/(Tf+R),ET=(1/s-1)*To+Tf+R,etaSim=20*Tf/res.end;
      var big=_w05_saw(U,1000,Tf,R,To,pd.get()/100,pa.get()/100,sq.get()===0,seed+1000);
      var etaBig=1000*Tf/big.end;
      var warn=To<=Tf+R?'<span class="warn">T_o が T_f + RTT（'+F.time((Tf+R)/1000)+'）より短いので、失われていなくても再送する。</span><br>':"";
      ro.innerHTML=warn+"送ったデータ <b>"+res.tx+"</b>（うち再送 "+res.resend+"）・ 受け手が受け取ったメッセージ <b>"+res.uniq+" / 20</b>"+
        (sq.get()===0?" ・ 重複として捨てた <b>"+res.dupDrop+"</b> ・ 古い ACK を捨てた "+res.staleAck:
          " ・ <span class=\"warn\">重複して渡した "+res.dupDeliv+"</span> ・ <span class=\"warn\">ACK を取り違えた "+res.wrongAck+"</span>"+(res.lost?' ・ <span class="warn">気づかれずに失われた '+res.lost+"</span>":""))+"<br>"+
        "全部の ACK が届くまで "+F.time(res.end/1000)+" ・ 効率（この 20 個）"+U.sig(etaSim*100,3)+" % ・ 1000 個で測ると "+U.sig(etaBig*100,3)+" %"+
        (sq.get()===1&&big.wrongAck>0?'（取り違えた ACK で先へ進むので、見かけだけの値）':"")+"<br>"+
        "式: 喪失なし T_f / (T_f + RTT) = "+U.sig(eta0*100,3)+" %"+(To>Tf+R?" ・ 喪失あり T_f / E[T] = "+U.sig(Tf/ET*100,3)+" %（s = "+U.sig(s,4)+"、E[T] = "+F.time(ET/1000)+"）":" ・ 喪失ありの式は T_o > T_f + RTT のときだけ使える");
    }
    function render(){
      var o=[],xs=150,xr=520,y0=44,H=470,sc=H/win,Y=function(t){return y0+Math.min(t,win)*sc;};
      o.push(S.RECT(xs-42,8,84,26,7,U.soft("signal"),"signal",1.3));o.push(S.T(xs,25,"送り手","middle",11,"signal",true));
      o.push(S.RECT(xr-42,8,84,26,7,U.soft("green"),"green",1.3));o.push(S.T(xr,25,"受け手","middle",11,"green",true));
      o.push(S.L(xs,34,xs,y0+H+6,"signal",1.2,"3 4"));o.push(S.L(xr,34,xr,y0+H+6,"green",1.2,"3 4"));
      var lim=cursor==null?win:cursor;
      res.log.forEach(function(g){
        if(g.m>=SHOW||g.t0>lim)return;
        var tEnd=Math.min(g.t1!=null?g.t1:g.t0,lim),frac=g.t1!=null&&g.t1>g.t0?(tEnd-g.t0)/(g.t1-g.t0):1;
        if(g.k==="to"){o.push(S.L(xs-26,Y(g.t0),xs,Y(g.t0),"teal",1.6));o.push(S.T(xs-30,Y(g.t0)+4,"時間切れ","end",9,"teal",true));return;}
        var data=g.k==="data",x1=data?xs:xr,x2=data?xr:xs,c=data?(g.re?"purple":"signal"):"green";
        var xe=x1+(x2-x1)*frac,ye=Y(g.t0)+(Y(g.t1)-Y(g.t0))*frac;
        var lab=data?((g.re?"再送 ":"")+"#"+(g.m+1)+(sq.get()===0?"（"+g.seq+"）":"")):("ACK"+(sq.get()===0?" "+g.seq:""));
        if(g.lost){var fx=x1+(x2-x1)*0.55,fy=Y(g.t0)+(Y(g.t1)-Y(g.t0))*0.55;if(frac>=0.55){o.push(S.L(x1,Y(g.t0),fx,fy,"alias",1.5,"5 3"));o.push(S.X(fx,fy,5,"alias",2));}else o.push(S.L(x1,Y(g.t0),xe,ye,"alias",1.5,"5 3"));}
        else if(frac>=1)o.push(S.ARR(x1,Y(g.t0),x2,Y(g.t1),c,1.5,6));else o.push(S.L(x1,Y(g.t0),xe,ye,c,1.5));
        if(frac>=0.5){var lx=(x1+x2)/2,ly=(Y(g.t0)+Y(g.t1))/2;o.push(S.T(lx+(data?0:0),ly-4,lab,"middle",9,g.lost?"alias":c,data));}
        if(frac>=1&&!g.lost){
          if(data){var t2=g.res==="new"?"受け取る":g.res==="drop"?"重複 → 捨てる":g.res==="dupdeliv"?"重複を渡す ×":"";
            if(t2)o.push(S.T(xr+8,Y(g.t1)+3,t2,"start",9,g.res==="new"?"green":(g.res==="drop"?"gold":"alias"),g.res!=="new"));}
          else{var t3=g.res==="stale"?"古い ACK → 捨てる":g.res==="wrong"?"ACK を取り違え ×":"";
            if(t3)o.push(S.T(xs-8,Y(g.t1)+3,t3,"end",9,g.res==="stale"?"muted":"alias",g.res==="wrong"));}
        }
      });
      if(cursor!=null)o.push(S.L(60,Y(cursor),660,Y(cursor),"faint",1,"2 3"));
      o.push(S.T(350,y0+H+24,"時間は下へ進む（0 から "+U.fmt.time(win/1000)+" まで。最初の "+SHOW+" 個のメッセージ）","middle",9.5,"muted"));
      box.set(S.svg(700,y0+H+32,o));
    }
    draw();
  };

  /* ---- デモ 3: 一斉の再接続 ---- */
  function _w05_heap(){var a=[];return {size:function(){return a.length;},
    push:function(x){a.push(x);var i=a.length-1;while(i>0){var p=(i-1)>>1;if(a[p][0]<a[i][0]||(a[p][0]===a[i][0]&&a[p][1]<=a[i][1]))break;var t=a[p];a[p]=a[i];a[i]=t;i=p;}},
    pop:function(){var top=a[0],last=a.pop();if(a.length){a[0]=last;var i=0;for(;;){var l=2*i+1,r=l+1,m=i;
      if(l<a.length&&(a[l][0]<a[m][0]||(a[l][0]===a[m][0]&&a[l][1]<a[m][1])))m=l;if(r<a.length&&(a[r][0]<a[m][0]||(a[r][0]===a[m][0]&&a[r][1]<a[m][1])))m=r;
      if(m===i)break;var t=a[m];a[m]=a[i];a[i]=t;i=m;}}return top;}};}
  function _w05_storm(U,N,C,Td,b,cap,pol,seed,horizon){
    var r=U.rng(seed),h=_w05_heap();
    function wait(k){var w=pol===0?b:Math.min(cap,b*Math.pow(2,k));return pol===2?r.next()*w:w;}
    for(var i=0;i<N;i++)h.push([wait(0),i,0]);
    var att={},ok={},used={},last=0,total=0,maxAfter=0,done=0;
    while(h.size()){var e=h.pop(),t=e[0];if(t>horizon){h.push(e);break;}
      var bk=Math.floor(t);att[bk]=(att[bk]||0)+1;total++;
      if(t>=Td&&(used[bk]||0)<C){used[bk]=(used[bk]||0)+1;ok[bk]=(ok[bk]||0)+1;last=t;done++;continue;}
      h.push([t+wait(e[2]+1),e[1],e[2]+1]);}
    for(var k in att)if(+k>=Td&&att[k]>maxAfter)maxAfter=att[k];
    return {att:att,ok:ok,last:last,total:total,done:done,left:N-done,maxAfter:maxAfter};
  }
  REG.w05_storm=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BACKOFF","止まったサーバに、多くの機器が一斉につながり直す");
    var row=U.ctrls(el);
    var nn=U.slider(row,"台数 N",{min:10,max:2000,value:1000,log:true,snap:function(v){return Math.round(v);},fmt:function(v){return Math.round(v)+" 台";},onInput:draw});
    var td=U.slider(row,"サーバが止まる時間",{min:0,max:120,step:5,value:30,fmt:function(v){return v+" s";},onInput:draw});
    var cc=U.slider(row,"受け付けられる数 C",{min:5,max:500,value:50,log:true,snap:function(v){return Math.round(v);},fmt:function(v){return Math.round(v)+" 件/s";},onInput:draw});
    var rp=U.ctrls(el),cp0=U.mk("div","ctrl",'<label><span>方式</span></label>');cp0.style.flex="1 1 100%";rp.appendChild(cp0);
    var pol=U.seg(cp0,["固定の間隔","指数バックオフ","指数バックオフ + 全部をランダムに"],2,draw);
    var row2=U.ctrls(el);
    var bb=U.slider(row2,"最初の待ち時間 b",{min:0.5,max:10,step:0.5,value:1,fmt:function(v){return v+" s";},onInput:draw});
    var cp=U.slider(row2,"上限 c",{min:2,max:300,value:64,log:true,snap:function(v){return Math.round(v);},fmt:function(v){return Math.round(v)+" s";},onInput:draw});
    var ys=U.select(row2,"縦軸",["自動","200 件/s で切る（拡大）"],0,draw);
    var br=U.btnrow(el); var seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var N=Math.round(nn.get()),C=Math.round(cc.get()),Td=td.get(),b=bb.get(),cap=Math.max(cp.get(),b),P=pol.get(),HZ=3600;
      var r=_w05_storm(U,N,C,Td,b,cap,P,seed,HZ);
      var tEnd=r.left?HZ:Math.max(r.last,Td+5);
      var span=Math.max(10,Math.ceil(tEnd*1.05/10)*10),bw=Math.max(1,Math.ceil(span/240));
      var bars=[],ymax=1;
      for(var t0=0;t0<span;t0+=bw){var a=0,g=0;for(var k=t0;k<t0+bw;k++){a=Math.max(a,r.att[k]||0);g=Math.max(g,r.ok[k]||0);}bars.push([t0,a,g]);if(a>ymax)ymax=a;}
      var clip=ys.get()===1,yTop=clip?200:Math.max(10,U.nice(0,ymax*1.08,4).slice(-1)[0]);
      if(yTop<ymax*1.0001&&!clip)yTop=ymax*1.1;
      var o=[],p=U.plot(70,20,600,220,[0,span],[0,yTop]);
      o.push(S.RECT(p.X(0),p.y,p.X(Math.min(Td,span))-p.X(0),p.h,0,"var(--muted-soft)","none",0));
      o.push(p.axes({xl:"時刻 [s]（灰色: サーバが止まっている間）",yl:"1 秒あたりの試み"+(bw>1?"（"+bw+" 秒ごとの最大）":""),xfmt:function(v){return String(v);},yfmt:function(v){return String(Math.round(v));}}));
      bars.forEach(function(q){var x=p.X(q[0]),w=Math.max(0.6,p.X(q[0]+bw)-x-0.6),a=Math.min(q[1],yTop),g=Math.min(q[2],yTop);
        if(q[1]>0)o.push(S.RECT(x+0.3,p.Y(a),w,p.Y(0)-p.Y(a),0,U.soft("alias"),"alias",0.6));
        if(q[2]>0)o.push(S.RECT(x+0.3,p.Y(g),w,p.Y(0)-p.Y(g),0,U.soft("green"),"green",0.6));});
      if(C<=yTop)o.push(S.L(p.x,p.Y(C),p.x+p.w,p.Y(C),"green",1.1,"4 3"));
      var lx=70;[["green","つながった試み"],["alias","断られた試み"]].forEach(function(q){o.push(S.RECT(lx,281,10,10,2,U.soft(q[0]),q[0],1.2));o.push(S.T(lx+15,290,q[1],"start",9.5,"muted"));lx+=15+U.tw(q[1],9.5)+18;});
      o.push(S.L(lx,286,lx+22,286,"green",1.2,"4 3"));o.push(S.T(lx+28,290,"サーバが 1 秒に受け付けられる数 C = "+C+" 件","start",9.5,"muted"));
      if(!r.left){var xl=p.X(r.last),rt=xl>560;o.push(S.L(xl,p.y,xl,p.y+p.h,"signal",1.4,"5 3"));o.push(S.T(xl+(rt?-4:4),p.y+12,"全台がつながった",rt?"end":"start",9.5,"signal",true));}
      if(clip&&ymax>200)o.push(S.T(p.x+4,p.y+12,"200 件を超える所は切っている","start",9.5,"alias"));
      box.set(S.svg(700,300,o));
      var per=r.total/N;
      ro.innerHTML=(r.left?'<span class="warn">1 時間たっても '+r.left+' 台がつながっていない。</span>':"全台がつながった時刻 <b>"+U.sig(r.last,4)+" s</b>（サーバが戻ってから "+U.sig(r.last-Td,3)+" s）")+"<br>"+
        "サーバに届いた試みの合計 <b>"+U.fmt.int(r.total)+" 件</b>（1 台あたり "+U.sig(per,3)+" 回）・ サーバが戻った後の 1 秒あたりの最大 "+r.maxAfter+" 件"+
        '<div class="wnote">モデル: 全台が 0 s に切断に気づき、最初の待ち時間の後に 1 回目を試みる（固定の方式では b を間隔に使う）。サーバは戻った後、1 秒ごとの区切りに '+C+' 件まで受け付け、それを超える試みと止まっている間の試みは断る（断られた機器はすぐ次の待ちに入る）。</div>';
    }
    draw();
  };

  /* ---- デモ 4: ウォッチドッグをどこでキックするか ---- */
  REG.w05_wdt=function(el,U){
    var S=U.S;
    U.head(el,"WATCHDOG","キックする場所と、起こした故障で、リセットされるかを見る");
    function segRow(label,opts,v){var r=U.ctrls(el),c=U.mk("div","ctrl",'<label><span>'+label+'</span></label>');c.style.flex="1 1 100%";r.appendChild(c);return U.seg(c,opts,v,draw);}
    var place=segRow("キックする場所",["タイマ割り込み","アイドルタスク","監視（チェックイン）","監視 + 手順の進み具合"],3);
    var fail=segRow("3 s に起こす故障",["なし","CPU ごと止まる","通信タスクの無限ループ","通信タスクが永久に待つ","手順が進まない"],2);
    var box=U.svgbox(el); var ro=U.readout(el);
    var TF=3,TW=1,PS=0.25,MB=1,TEND=8,DT=0.05;
    function draw(){
      var pl=place.get(),f=fail.get();
      var X=function(t){return 150+(684-150)*t/TEND;};
      var o=[],rows=[["タイマ割り込み",30,"gold"],["通信タスク（優先度 高）",58,"signal"],["センサのタスク（中）",86,"purple"],["監視タスク（低）",114,"green"],["アイドルタスク（最低）",142,"muted"],["キック",170,"teal"]];
      rows.forEach(function(q){o.push(S.T(142,q[1]+4,q[0],"end",10,q[2],true));o.push(S.L(150,q[1],684,q[1],"grid",1));});
      var left=TW,resetAt=null,alive={c:0,s:0},stuck=null,kicks=[],pts=[[0,TW]],lastK=0;
      var commSince=null;
      for(var i=0;i<Math.round(TEND/DT);i++){
        var t=i*DT,tn=+(t+DT).toFixed(6);if(resetAt!=null)break;
        var failed=f!==0&&t>=TF-1e-9,cpuHalt=failed&&f===1,loop=failed&&f===2,block=failed&&f===3,noProg=failed&&f===4;
        var tick=Math.abs(t*10-Math.round(t*10))<1e-6;
        /* タイマ割り込み */
        if(!cpuHalt&&tick){o.push(S.L(X(t),25,X(t),35,"gold",1.2));if(pl===0)kicks.push(t);}
        /* 通信タスク: 0.1 s ごとに動く（無限ループなら CPU を使い続ける） */
        var commRuns=!cpuHalt&&!block&&(loop||tick);
        if(loop&&!cpuHalt)o.push(S.RECT(X(t),52,X(tn)-X(t),12,0,U.soft("alias"),"alias",0.5));
        else if(commRuns&&tick){o.push(S.RECT(X(t),52,3,12,0,U.soft("signal"),"signal",1));
          var inWait=noProg?true:((t%1)>=0.3&&(t%1)<0.36);   /* 正常時は毎秒 0.3 s から短い間だけ応答待ち */
          if(inWait){if(commSince==null)commSince=t;}else commSince=null;
          var progOK=!(pl===3&&commSince!=null&&t-commSince>=MB-1e-9);
          if(progOK)alive.c=1;}
        /* センサのタスク: 0.2 s ごと（無限ループの間は CPU がもらえない） */
        var other=!cpuHalt&&!loop;
        if(other&&Math.abs(t*5-Math.round(t*5))<1e-6){o.push(S.RECT(X(t),80,3,12,0,U.soft("purple"),"purple",1));alive.s=1;}
        /* 監視タスク: 0.25 s ごと */
        if(other&&Math.abs(t*4-Math.round(t*4))<1e-6){
          o.push(S.RECT(X(t),108,3,12,0,U.soft("green"),"green",1));
          if(pl>=2){if(alive.c&&alive.s)kicks.push(t);alive.c=0;alive.s=0;}}
        /* アイドル: ほかのタスクが動いていない間 */
        if(other){o.push(S.RECT(X(t)+3,137,X(tn)-X(t)-3,10,0,"var(--muted-soft)","muted",0.5));if(pl===1&&tick)kicks.push(t);}
        /* ウォッチドッグの残り */
        var k=kicks.length&&Math.abs(kicks[kicks.length-1]-t)<1e-9;
        if(k){pts.push([t,left]);left=TW;pts.push([t,TW]);lastK=t;o.push(S.D(X(t),170,"teal",3));}
        left-=DT;
        if(left<=1e-9){resetAt=tn;pts.push([tn,0]);}
      }
      if(resetAt==null)pts.push([TEND,Math.max(0,left)]);
      if(f===3&&TF<TEND)o.push(S.T(X(TF)+6,62,"眠ったまま（来ない合図を待つ）","start",9,"muted"));
      if(f===4)o.push(S.T(X(TF)+30,48,"ループは回るが、状態機械は応答待ちのまま","start",9,"alias"));
      if(f!==0){o.push(S.L(X(TF),20,X(TF),268,"alias",1.2,"4 3"));o.push(S.T(X(TF)+3,16,"故障","start",9.5,"alias",true));}
      var p=U.plot(150,190,534,70,[0,TEND],[0,1.1]);
      o.push(p.axes({xt:[0,1,2,3,4,5,6,7,8],yt:[0,0.5,1],xfmt:function(v){return v+" s";},yfmt:function(v){return String(v);},sz:9}));
      o.push(S.T(126,220,"ウォッチドッグ","end",10,"gold",true));o.push(S.T(126,234,"の残り時間 [s]","end",10,"gold",true));
      o.push(p.line(pts,"gold",2));
      if(resetAt!=null){var rr=resetAt>6.5;o.push(S.D(p.X(resetAt),p.Y(0),"alias",5));o.push(S.T(p.X(resetAt)+(rr?-8:8),p.Y(0)-8,"リセット",rr?"end":"start",10.5,"alias",true));}
      box.set(S.svg(700,284,o));
      var PL=["タイマ割り込み","アイドルタスク","監視タスク（チェックイン）","監視タスク（手順の進み具合も確かめる）"];
      var why=["",
        "CPU ごと止まると、割り込みもタスクも動かないので、どこでキックしていても止まる。",
        pl===0?"タイマ割り込みは、通信タスクが CPU を使い続けても動くので、キックし続けてしまう。":"通信タスクが CPU を使い続けると、優先度の低いタスクとアイドルタスクが動けず、キックが止まる。",
        pl<=1?"通信タスクは眠ったまま待っているので、CPU は空いており、"+(pl===0?"タイマ割り込み":"アイドルタスク")+"はキックし続ける。":"通信タスクがチェックインしなくなるので、監視タスクはキックしない。",
        pl<=2?"通信タスクのループは回り、チェックインもするので、手順が止まっていることに気づかない。":"状態機械が応答待ちに 1 s を超えていると、通信タスクがチェックインしなくなる。"];
      ro.innerHTML="キックする場所: <b>"+PL[pl]+"</b> ・ "+(f===0?"故障なし: ":"")+(resetAt!=null?'<span class="warn">'+(f===0?"誤ってリセットされた":"検出した")+"</span>: 故障から "+U.sig(resetAt-TF,3)+" s 後にリセット（最後のキックから 1 s）":(f===0?'<span class="ok">リセットされない（正常）</span>':'<span class="warn">検出しない</span>: 8 s までキックが続き、機器は止まったまま'))+
        (why[f]?"<br>"+why[f]:"")+'<div class="wnote">ウォッチドッグの時間 1 s、監視の周期 0.25 s。通信タスクは 0.1 s ごと、センサのタスクは 0.2 s ごとに仕事をする。「手順の進み具合」では、通信タスクは待機以外の状態に 1 s を超えているとチェックインしない。</div>';
    }
    draw();
  };

  /* ===== 06 章 無線モジュールとつなぐ — AT コマンドと HCI ===== */
  /* 振り分けの色（図 f06.py と同じ） */
  var _w06_KC={echo:"muted",interim:"green",ok:"signal",err:"alias",urc:"gold",data:"purple",prompt:"teal",nl:"faint"};
  var _w06_KN={echo:"エコー",interim:"中間応答",ok:"最終応答（成功）",err:"最終応答（失敗）",urc:"URC",data:"データ",prompt:"プロンプト"};

  /* 本文の at_classify と同じ順番で 1 行を振り分ける */
  function _w06_classify(cmd,s){
    if(cmd){
      if(s===cmd.text)return "echo";
      if(s==="OK"||s==="SEND OK")return "ok";
      if(s==="ERROR"||s==="SEND FAIL"||s.indexOf("+CME ERROR:")===0)return "err";
      if(cmd.prefix&&s.indexOf(cmd.prefix)===0)return "interim";
    }
    var H=["WIFI ","CONNECT","CLOSED","+CEREG:","ready"];
    for(var i=0;i<H.length;i++)if(s.indexOf(H[i])===0)return "urc";
    return cmd?"interim":"urc";
  }
  function _w06_str(a){var s="";for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return s;}
  function _w06_bytes(s){var a=[];for(var i=0;i<s.length;i++)a.push(s.charCodeAt(i)&255);return a;}
  function _w06_wrap(h){return h?'<span style="white-space:normal;display:inline-block;min-width:12em;max-width:24em">'+h+'</span>':"";}
  function _w06_show(s){return s.replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\0/g,"\\0");}

  /* 本文の at_feed と同じ手順の解析器。ev(種類, 中身, 位置の配列) で知らせる */
  function _w06_feeder(ev){
    var P={line:[],idx:[],left:0,MAX:256};
    function ipdLen(a){if(!a.length)return 0;var v=0;for(var i=0;i<a.length;i++){if(a[i]<48||a[i]>57||v>100000)return 0;v=v*10+(a[i]-48);}return v;}
    P.feed=function(b,base){
      var i=0,n=b.length;
      while(i<n){
        if(P.left>0){var k=Math.min(n-i,P.left),ix=[];for(var j=0;j<k;j++)ix.push(base+i+j);ev("data",b.slice(i,i+k),ix);P.left-=k;i+=k;continue;}
        var c=b[i],g=base+i;i++;
        if(c===13||c===10){if(P.line.length)ev("line",P.line.slice(),P.idx.slice());ev("nl",null,[g]);P.line=[];P.idx=[];}
        else if(c===62&&P.line.length===0){ev("prompt",null,[g]);}
        else{
          if(P.line.length<P.MAX){P.line.push(c);P.idx.push(g);}
          if(c===58&&P.line.length>6&&_w06_str(P.line.slice(0,5))==="+IPD,"){
            var v=ipdLen(P.line.slice(5,P.line.length-1));
            if(v>0){P.left=v;ev("ipd",v,P.idx.slice());P.line=[];P.idx=[];}
          }
        }
      }
    };
    return P;
  }

  REG.w06_at=function(el,U){
    var SC=[
      {t:"AT+CSQ（電波の強さを聞く）",st:[{cmd:"AT+CSQ",pre:"+CSQ:"},{rx:"\r\n+CSQ: 20,99\r\n\r\nOK\r\n"}]},
      {t:"AT+CSQ の途中に +IPD（データに OK を含む）",st:[{cmd:"AT+CSQ",pre:"+CSQ:"},{rx:"\r\n+IPD,12:T=23.5\r\nOK\r\n\r\n+CSQ: 20,99\r\n\r\nOK\r\n"}]},
      {t:"AT+CWJAP（AP につなぐ）",st:[{cmd:'AT+CWJAP="home","secret12"',pre:"+CWJAP:"},{rx:"WIFI CONNECTED\r\nWIFI GOT IP\r\n\r\nOK\r\n"}]},
      {t:"AT+CWJAP（つながらなかった）",st:[{cmd:'AT+CWJAP="home","wrong"',pre:"+CWJAP:"},{rx:"\r\n+CWJAP:1\r\n\r\nERROR\r\n"}]},
      {t:"AT+CIPSEND=5（プロンプトとデータ）",st:[{cmd:"AT+CIPSEND=5",pre:null,two:true},{rx:"\r\nOK\r\n\r\n+IPD,5:>\r\nOK\r\n>"},{host:"hello"},{rx:"\r\nSEND OK\r\n"}]},
      {t:"+CEREG（同じ頭の URC と応答）",st:[{rx:"\r\n+CEREG: 2\r\n\r\n+CEREG: 1\r\n"},{cmd:"AT+CEREG?",pre:"+CEREG:"},{rx:"\r\n+CEREG: 1,1\r\n\r\nOK\r\n"}]}
    ];
    U.head(el,"AT PARSER","AT の応答の解析器 — 分かれて届いても結果は同じ");
    var row=U.ctrls(el);
    var sc=U.select(row,"場面",SC.map(function(s){return s.t;}),1,rebuild);
    var ck=U.select(row,"解析器に渡す 1 回分の大きさ",["受信ごとにまとめて","1 バイトずつ","乱数（1〜5 バイト）","乱数（1〜20 バイト）"],2,rebuild);
    var row2=U.ctrls(el);
    var ec=U.checkbox(row2,"エコーあり（ATE1）",true,rebuild);
    var nv=U.checkbox(row2,"長さを見ない解析器の結果も出す",false,function(){render();});
    var br=U.btnrow(el);
    U.button(br,"最初から",function(){reset();render();});
    U.button(br,"1 回分ずつ進める",function(){step();render();});
    U.button(br,"最後まで",function(){while(pos<acts.length)step();render();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rebuild();});
    var stream=U.mk("div","wsvg");stream.style.padding=".5rem";el.appendChild(stream);
    var ro=U.readout(el);
    var seed=6,acts=[],pos=0,S;
    function rebuild(){
      var s=SC[sc.get()],r=U.rng(seed*7919+sc.get()*31+ck.get()),base=0,pend=null;acts=[];
      s.st.forEach(function(x){
        if(x.cmd){pend=x;acts.push({k:"cmd",c:{text:x.cmd,prefix:x.pre,two:!!x.two}});return;}
        if(x.host){acts.push({k:"host",s:x.host});return;}
        var txt=(pend&&ec.get()?pend.cmd+"\r\n":"")+x.rx;pend=null;
        var b=_w06_bytes(txt),i=0;
        while(i<b.length){var m=ck.get(),n=m===0?b.length:m===1?1:m===2?1+r.int(5):1+r.int(20);n=Math.min(n,b.length-i);
          acts.push({k:"rx",b:b.slice(i,i+n),base:base+i});i+=n;}
        acts.push({k:"bytes",b:b,base:base});base+=b.length;
      });
      reset();while(pos<acts.length)step();render();
    }
    function reset(){
      pos=0;S={kind:{},cmd:null,phase:0,events:[],chunk:0,calls:0,done:[]};
      S.P=_w06_feeder(function(k,v,ix){
        if(k==="nl"){ix.forEach(function(g){if(!S.kind[g])S.kind[g]="nl";});return;}
        if(k==="line"){var s=_w06_str(v),c=_w06_classify(S.cmd,s);ix.forEach(function(g){S.kind[g]=c;});
          var note="";
          if(S.cmd&&(c==="ok"||c==="err")){
            if(S.cmd.two&&c==="ok"&&S.phase===0){S.phase=1;note="受け付けた。プロンプトを待つ";}
            else{note="命令の終わり";S.done.push({cmd:S.cmd.text,ok:c==="ok"});S.cmd=null;}
          }
          S.events.push({k:c,s:s,cmd:S.lastCmd,ch:S.chunk,note:note});return;}
        if(k==="prompt"){ix.forEach(function(g){S.kind[g]="prompt";});var nt="";if(S.cmd&&S.cmd.two&&S.phase===1){S.phase=2;nt="データを送ってよい";}
          S.events.push({k:"prompt",s:">",cmd:S.lastCmd,ch:S.chunk,note:nt});return;}
        if(k==="ipd"){ix.forEach(function(g){S.kind[g]="urc";});S.events.push({k:"urc",s:"+IPD,"+v+":",cmd:S.lastCmd,ch:S.chunk,note:"後に "+v+" バイトのデータ"});S.dataEv={k:"data",s:"",n:0,cmd:S.lastCmd,ch:S.chunk,note:"",pieces:[]};S.events.push(S.dataEv);return;}
        if(k==="data"){ix.forEach(function(g){S.kind[g]="data";});S.dataEv.s+=_w06_str(v);S.dataEv.n+=v.length;S.dataEv.pieces.push(v.length);S.dataEv.note="分けて渡された大きさ: "+S.dataEv.pieces.join(" + ")+" バイト";return;}
      });
      S.lastCmd="—";
    }
    function step(){
      if(pos>=acts.length)return;var a=acts[pos++];
      if(a.k==="cmd"){S.cmd=a.c;S.phase=0;S.lastCmd=a.c.text;S.events.push({k:"host",s:a.c.text,cmd:"",ch:"",note:"ホストが命令を送る"});return;}
      if(a.k==="host"){S.events.push({k:"host",s:a.s,cmd:"",ch:"",note:"ホストが "+a.s.length+" バイトのデータを送る"});return;}
      if(a.k==="rx"){S.chunk++;S.calls++;S.P.feed(a.b,a.base);if(pos<acts.length&&acts[pos].k==="bytes")pos++;return;}
      if(a.k==="bytes"){step();}
    }
    function cellHtml(b,g,first,done){
      var k=S.kind[g],lab=b===13?"CR":b===10?"LF":b===32?"SP":b===0?"00":U.esc(String.fromCharCode(b));
      var small=(b===13||b===10||b===32||b===0);
      var st="";if(k&&k!=="nl"){st+="background:"+U.soft(_w06_KC[k])+";border-color:"+U.col(_w06_KC[k])+";";}
      else if(k==="nl"){st+="border-color:var(--line);color:var(--muted);";}
      else if(done){st+="border:1px dashed var(--muted);";}
      if(!done)st+="opacity:.35;";
      if(first)st+="box-shadow:-3px 0 0 0 var(--signal);margin-left:5px;";
      if(small)st+="font-size:.62rem;";
      return '<span style="'+st+'" title="0x'+U.fmt.hex(b)+(k?" "+(_w06_KN[k]||"改行"):"")+'">'+lab+'</span>';
    }
    function render(){
      var h="",cnt=0,done=0;
      /* どこまで処理したか: 処理済みのバイトの位置 */
      for(var i=0;i<pos;i++){var a=acts[i];if(a.k==="rx")done=a.base+a.b.length;}
      var starts={};acts.forEach(function(a){if(a.k==="rx")starts[a.base]=1;});
      acts.forEach(function(a,ai){
        if(a.k==="cmd")h+='<div style="margin:.35rem 0;font-family:var(--mono);font-size:.76rem;color:var(--signal)'+(ai>=pos?';opacity:.35':'')+'">→ ホストが送る: <b>'+U.esc(a.c.text)+'</b></div>';
        else if(a.k==="host")h+='<div style="margin:.35rem 0;font-family:var(--mono);font-size:.76rem;color:var(--purple)'+(ai>=pos?';opacity:.35':'')+'">→ ホストがデータを送る: <b>'+U.esc(a.s)+'</b></div>';
        else if(a.k==="bytes"){h+='<div class="hex" style="margin:.2rem 0">';a.b.forEach(function(b,j){var g=a.base+j;h+=cellHtml(b,g,starts[g]&&j>0,g<done);});h+='</div>';}
      });
      stream.innerHTML='<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-bottom:.3rem">モジュールから届いたバイト（青い縦線 = 解析器に渡す 1 回分の区切り。薄いバイトはまだ渡していない）</div>'+h+
        '<div class="legend">'+["echo","interim","ok","err","urc","data","prompt"].map(function(k){return '<span><b style="color:'+U.col(_w06_KC[k])+'">■</b> '+_w06_KN[k]+'</span>';}).join("")+'</div>';
      var P=S.P,stt=P.left>0?"データを読んでいる（残り <b>"+P.left+"</b> バイト）":"行を読んでいる（読みかけ: <b>"+(P.line.length?U.esc(_w06_show(_w06_str(P.line))):"なし")+"</b>）";
      var rows=S.events.map(function(e,i){var c=e.k==="host"?"signal":_w06_KC[e.k];
        return [String(i+1),'<span style="color:'+U.col(c)+';font-weight:700">'+(e.k==="host"?"ホスト":_w06_KN[e.k])+'</span>',U.esc(_w06_show(e.s)),_w06_wrap(U.esc(e.note||"")),e.ch===""?"":String(e.ch)];});
      var html="解析器に渡した回数: <b>"+S.calls+"</b> 回 ・ 解析器の状態: "+stt+" ・ 応答を待っている命令: <b>"+(S.cmd?U.esc(S.cmd.text)+(S.cmd.two?(S.phase===1?"（プロンプト待ち）":S.phase===2?"（SEND OK 待ち）":""):""):"なし")+"</b>"+
        U.tbl(["#","振り分け","中身","メモ","何回目に"],rows,["right","left","left","left","right"]);
      if(S.done.length)html+=S.done.map(function(d){return "命令 "+U.esc(d.cmd)+" は "+(d.ok?'<span class="ok">成功</span>':'<span class="warn">失敗</span>')+" で終わった";}).join(" ・ ");
      if(nv.get())html+=naive();
      html+='<div class="wnote">区切り方を変えても、振り分けの列は変わらない（解析器が読みかけの行とデータの読み残しを覚えているため）。データは届いた分ずつ渡すので、分け方によって「メモ」の大きさの内訳だけが変わる。</div>';
      ro.innerHTML=html;
    }
    /* 長さを見ずに、CR・LF で区切った行だけで振り分ける解析器（+IPD は URC として扱う） */
    function naive(){
      var s=SC[sc.get()],cmd=null,rows=[],pend=null;
      s.st.forEach(function(x){
        if(x.cmd){cmd={text:x.cmd,prefix:x.pre,two:!!x.two,phase:0};pend=x;return;}
        if(x.host)return;
        var txt=(pend&&ec.get()?pend.cmd+"\r\n":"")+x.rx;pend=null;
        txt.split(/[\r\n]/).forEach(function(l){
          if(!l.length)return;
          var lines=[];if(l.charAt(0)===">"){lines.push(">");l=l.slice(1);}if(l.length)lines.push(l);
          lines.forEach(function(L){
            if(L===">"){rows.push(['<span style="color:var(--teal)">プロンプト</span>',">",""]);if(cmd&&cmd.two&&cmd.phase===1)cmd.phase=2;return;}
            var c=L.indexOf("+IPD,")===0?"urc":_w06_classify(cmd,L),nt="";
            if(cmd&&(c==="ok"||c==="err")){if(cmd.two&&c==="ok"&&cmd.phase===0){cmd.phase=1;}else{nt="命令の終わり";cmd=null;}}
            else if(!cmd&&L.indexOf("+IPD,")!==0&&!/^(WIFI |CONNECT|CLOSED|\+CEREG:|ready)/.test(L))nt="どの命令も待っていない行（取り違えのもと）";
            rows.push(['<span style="color:'+U.col(_w06_KC[c])+';font-weight:700">'+_w06_KN[c]+'</span>',U.esc(L),nt]);
          });
        });
      });
      return '<div style="margin-top:.6rem"><b>長さを見ない解析器（悪い例）</b>の振り分け:</div>'+U.tbl(["振り分け","行","メモ"],rows,["left","left","left"]);
    }
    rebuild();
  };

  /* ---- 4 節: ガードタイム ---- */
  REG.w06_guard=function(el,U){
    var S=U.S,F=U.fmt;
    var GV=[5,10,20,50,100,200,500,1000,1500,2000];               /* ms */
    var XV=[0,0.05,0.1,0.2,0.5,1,2,5,10,15,19,20,21,25,30,50,100,200,300,500,800,999.7,1000,1001,1500,2000,3000];
    function ms(v){return v===0?"0（続けて送る）":v>=1000?String(+(v/1000).toFixed(4))+" s":String(+v.toFixed(2))+" ms";}
    U.head(el,"GUARD TIME","+++ がコマンドモードに戻る合図になる条件");
    var row=U.ctrls(el);
    var g=U.slider(row,"ガードタイム G",{min:0,max:GV.length-1,step:1,value:2,fmt:function(i){return ms(GV[i]);},onInput:draw});
    var row2=U.ctrls(el);
    var a=U.slider(row2,"最初の + の前の空き",{min:0,max:XV.length-1,step:1,value:22,fmt:function(i){return ms(XV[i]);},onInput:draw});
    var b=U.slider(row2,"+ と + の間の空き",{min:0,max:XV.length-1,step:1,value:0,fmt:function(i){return ms(XV[i]);},onInput:draw});
    var c=U.slider(row2,"3 つ目の + の後の空き",{min:0,max:XV.length-1,step:1,value:22,fmt:function(i){return ms(XV[i]);},onInput:draw});
    function setv(gi,ai,bi,ci){if(gi!=null)g.set(gi);a.set(ai);b.set(bi);c.set(ci);draw();}
    function ix(v){return XV.indexOf(v);}
    var br=U.btnrow(el);
    U.button(br,"ESP-AT の条件（G = 20 ms）",function(){g.set(2);draw();});
    U.button(br,"G = 1 s の製品",function(){g.set(7);draw();});
    var br2=U.btnrow(el);
    U.button(br2,"連続したデータの途中の +++",function(){setv(null,ix(0),ix(0),ix(0));});
    U.button(br2,"前後を 1.5 s 空けた +++",function(){setv(null,ix(1500),ix(0),ix(1500));});
    U.button(br2,"1 秒ごとの 3 バイトが 2B 2B 2B",function(){setv(null,ix(999.7),ix(0),ix(999.7));});
    U.button(br2,"人が端末から手で打つ（間 300 ms）",function(){setv(null,ix(1500),ix(300),ix(1500));});
    U.button(br2,"+++ の直後に命令を送る",function(){setv(null,ix(1500),ix(0),ix(5));});
    var box=U.svgbox(el);var ro=U.readout(el);
    function wraw(v){return 20+30*Math.log10(1+v/0.05);}
    function draw(){
      var G=GV[g.get()],A=XV[a.get()],B=XV[b.get()],C=XV[c.get()];
      var okA=A>G,okB=B<G,okC=C>G,ok=okA&&okB&&okC;
      var o=[],x=14,y=46,bw=30,sum=wraw(A)+2*wraw(B)+wraw(C),sc=Math.min(1,(700-14-58-90-58-14)/sum);
      function gap(v,good,lab){var w=Math.max(16,wraw(v)*sc);o.push(S.L(x+2,y+40,x+w-2,y+40,good?"green":"alias",1.6));
        o.push(S.L(x+2,y+34,x+2,y+46,good?"green":"alias",1.2));o.push(S.L(x+w-2,y+34,x+w-2,y+46,good?"green":"alias",1.2));
        o.push(S.T(x+w/2,y+60,(v>=1000?String(+(v/1000).toFixed(4))+" s":String(+v.toFixed(2))+" ms"),"middle",10,good?"green":"alias",true));
        o.push(S.T(x+w/2,y+74,lab+(good?" ✓":" ✗"),"middle",9.5,good?"green":"alias"));x+=w;}
      o.push(S.RECT(x,y,58,28,4,U.soft("purple"),"purple",1.2));o.push(S.T(x+29,y+19,"前のデータ","middle",9.5,"purple",true));x+=58;
      gap(A,okA,"> G");
      for(var k=0;k<3;k++){o.push(S.RECT(x,y,bw,28,4,U.soft(ok?"teal":"purple"),ok?"teal":"purple",1.2));o.push(S.T(x+bw/2,y+20,"+","middle",14,"ink",true,true));x+=bw;if(k<2)gap(B,okB,"< G");}
      gap(C,okC,"> G");
      o.push(S.RECT(x,y,58,28,4,U.soft("signal"),"signal",1.2));o.push(S.T(x+29,y+19,"次のバイト","middle",9.5,"signal",true));x+=58;
      var W=700;
      o.push(S.T(14,22,"G = "+ms(G)+"（ガードタイム）。空きの長さは対数で描いた（時間に比例しない）。","start",10.5,"muted"));
      o.push(S.T(14,y+104,ok?"→ モジュールはコマンドモードに戻る（+++ は TCP に流れない）":"→ +++ はデータとして TCP に流れる（モードは変わらない）","start",12,ok?"teal":"purple",true));
      box.set(S.svg(W,y+118,o));
      var bt=10/115200*1000,tmin=A+3*bt+2*B+C;
      var why=[];if(!okA)why.push("前の空き "+ms(A)+" が G 以下");if(!okB)why.push("+ の間の空き "+ms(B)+" が G 以上");if(!okC)why.push("後の空き "+ms(C)+" が G 以下");
      ro.innerHTML="条件: 前の空き > G "+(okA?'<span class="ok">✓</span>':'<span class="warn">✗</span>')+" ・ + の間の空き < G "+(okB?'<span class="ok">✓</span>':'<span class="warn">✗</span>')+" ・ 後の空き > G "+(okC?'<span class="ok">✓</span>':'<span class="warn">✗</span>')+
        "<br>結果: "+(ok?'<b style="color:var(--teal)">コマンドモードに戻る</b>':'<b style="color:var(--purple)">データとして送る</b>（'+why.join("、")+"）")+
        "<br>+++ の 3 バイトを 115200 bps・8N1 で送る時間 = 3 × 86.8 µs = 0.26 ms ・ 前の空きから後の空きまでの合計 = <b>"+(tmin>=1000?U.sig(tmin/1000,4)+" s":U.sig(tmin,4)+" ms")+"</b>"+(ok?"（ESP-AT ではさらに 1 秒待ってから次の命令を送る）":"")+
        '<div class="wnote">条件は ESP-AT の説明書の書き方（前と後は G より長い空き、+ の間は G より短い空き）に合わせた。G の値と細かな条件は製品ごとに違う。「1 秒ごとの 3 バイト」では、空きは 1 秒から 3 バイトの 0.26 ms を引いた 999.7 ms になる。</div>';
    }
    draw();
  };

  /* ---- 5 節: HCI の解読 ---- */
  var _w06_OP={0x0C03:["HCI_Reset","コントローラをリセットする"],0x0C01:["HCI_Set_Event_Mask","知らせてほしいイベントを選ぶ"],0x1001:["HCI_Read_Local_Version_Information","版を聞く"],
    0x1009:["HCI_Read_BD_ADDR","自分のアドレスを聞く"],0x2002:["HCI_LE_Read_Buffer_Size","ACL データを置く場所の大きさと数を聞く"],0x2006:["HCI_LE_Set_Advertising_Parameters","アドバタイズの設定"],
    0x2008:["HCI_LE_Set_Advertising_Data","アドバタイズのデータを設定"],0x200A:["HCI_LE_Set_Advertising_Enable","アドバタイズを始める・止める"],0x200B:["HCI_LE_Set_Scan_Parameters","スキャンの設定"],
    0x200C:["HCI_LE_Set_Scan_Enable","スキャンを始める・止める"],0x200D:["HCI_LE_Create_Connection","接続を始める"],0x0406:["HCI_Disconnect","接続を切る"]};
  var _w06_EV={0x05:["Disconnection Complete","接続が切れた"],0x0E:["Command Complete","命令の処理が終わった"],0x0F:["Command Status","命令を受け付けた（結果は後で）"],
    0x10:["Hardware Error","コントローラのハードウェアの誤り"],0x13:["Number Of Completed Packets","ACL データを置く場所が空いた"],0x3E:["LE Meta","LE のイベント（サブイベントで種類を示す）"]};
  var _w06_SUB={0x01:["LE Connection Complete","接続ができた"],0x02:["LE Advertising Report","アドバタイズを受けた"],0x03:["LE Connection Update Complete","接続の設定が変わった"]};
  var _w06_ST={0x00:"成功",0x01:"知らない命令",0x08:"接続のタイムアウト",0x0C:"今は受け付けられない命令",0x12:"パラメータが正しくない",0x13:"相手が接続を切った",0x16:"ホストが接続を切った"};
  var _w06_ATT={0x01:"Error Response",0x02:"Exchange MTU Request",0x03:"Exchange MTU Response",0x0A:"Read Request",0x0B:"Read Response",0x12:"Write Request",0x13:"Write Response",0x1B:"Handle Value Notification（通知）",0x1D:"Handle Value Indication（指示）",0x1E:"Handle Value Confirmation",0x52:"Write Command"};
  function _w06_hx(a){return a.map(function(b){var s=b.toString(16).toUpperCase();return s.length<2?"0"+s:s;}).join(" ");}
  function _w06_le(a,i,n){var v=0;for(var k=n-1;k>=0;k--)v=v*256+(a[i+k]||0);return v;}
  function _w06_addr(a,i){var s=[];for(var k=5;k>=0;k--){var h=a[i+k].toString(16).toUpperCase();s.push(h.length<2?"0"+h:h);}return s.join(":");}
  function _w06_st(v){if(v==null)return "?";return "0x"+(v<16?"0":"")+v.toString(16).toUpperCase()+(_w06_ST[v]!=null?" = "+_w06_ST[v]:"");}
  /* 1 つのパケットを解読する。返り値 {f:[[欄, バイト数, 色, 値, 意味]], sum, len, bad} */
  function _w06_decode(a){
    var f=[],t=a[0],i=1,bad="";
    function need(n){if(a.length<i+n){bad="バイトが足りない（あと "+(i+n-a.length)+" バイト）";return false;}return true;}
    function fld(name,n,c,mean,val){if(!need(n))return false;var v=a.slice(i,i+n);f.push([name,n,c,val!=null?val:_w06_hx(v),mean]);i+=n;return true;}
    if(t===0x01){
      f.push(["種類",1,"signal","01","HCI コマンド（ホスト → コントローラ）"]);
      if(!need(3))return {f:f,bad:bad,len:a.length,sum:"コマンド（途中まで）"};
      var op=_w06_le(a,1,2),ogf=op>>10,ocf=op&1023,nm=_w06_OP[op];
      fld("命令の番号",2,"gold","0x"+_w06_h4(op)+" = OGF 0x"+_w06_h2(ogf)+"・OCF 0x"+_w06_h3(ocf)+(nm?": "+nm[0]+"（"+nm[1]+"）":"（この解読器が知らない命令）"));
      var pl=a[i];fld("長さ",1,"teal","パラメータ "+pl+" バイト");
      var end=i+pl;
      if(op===0x200A){fld("Advertising_Enable",1,"purple",a[i]===1?"1 = 始める":a[i]===0?"0 = 止める":"?");}
      else if(op===0x200C){fld("LE_Scan_Enable",1,"purple",a[i]===1?"1 = 始める":"0 = 止める");fld("Filter_Duplicates",1,"purple","1 = 同じ相手の報告をまとめる");}
      else if(op===0x0406){fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("理由",1,"purple",_w06_st(a[i]));}
      else if(op===0x200D){
        fld("スキャン間隔",2,"purple",U.sig(_w06_le(a,i,2)*0.625,4)+" ms（0.625 ms 単位）");fld("スキャンウィンドウ",2,"purple",U.sig(_w06_le(a,i,2)*0.625,4)+" ms");
        fld("フィルタ",1,"purple","0 = 相手のアドレスで選ぶ");fld("相手のアドレスの種類",1,"purple",a[i]===1?"1 = ランダム（17 章）":"0 = 公開");
        if(need(6)){f.push(["相手のアドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)+"（下位のバイトが先）"]);i+=6;}
        fld("自分のアドレスの種類",1,"purple",a[i]===1?"1 = ランダム":"0 = 公開");
        fld("接続間隔の最小",2,"purple",U.sig(_w06_le(a,i,2)*1.25,4)+" ms（1.25 ms 単位。18 章）");fld("接続間隔の最大",2,"purple",U.sig(_w06_le(a,i,2)*1.25,4)+" ms");
        fld("レイテンシ",2,"purple",String(_w06_le(a,i,2)));fld("監視タイムアウト",2,"purple",U.sig(_w06_le(a,i,2)*10,4)+" ms（10 ms 単位）");
        fld("接続イベントの長さの最小",2,"purple","");fld("接続イベントの長さの最大",2,"purple","");
      }
      else if(pl>0){fld("パラメータ",Math.min(pl,a.length-i),"purple","（この解読器では細かく読まない）");}
      if(i<end&&!bad){f.push(["残り",end-i,"purple",_w06_hx(a.slice(i,end)),""]);i=end;}
      return {f:f,bad:bad,len:i,sum:"HCI コマンド "+(nm?nm[0]:"0x"+_w06_h4(op))};
    }
    if(t===0x04){
      f.push(["種類",1,"signal","04","HCI イベント（コントローラ → ホスト）"]);
      if(!need(2))return {f:f,bad:bad,len:a.length,sum:"イベント（途中まで）"};
      var ev=a[1],en=_w06_EV[ev];
      fld("イベントの番号",1,"gold","0x"+_w06_h2(ev)+(en?" = "+en[0]+"（"+en[1]+"）":"（この解読器が知らないイベント）"));
      var L=a[i];fld("長さ",1,"teal","パラメータ "+L+" バイト");
      var e2=i+L,sum="HCI イベント "+(en?en[0]:"0x"+_w06_h2(ev));
      if(ev===0x0E){fld("送ってよい命令の数",1,"purple",String(a[i]));var op2=need(2)?_w06_le(a,i,2):0,n2=_w06_OP[op2];
        fld("終わった命令",2,"purple","0x"+_w06_h4(op2)+(n2?" = "+n2[0]:""));fld("状態",1,"purple",_w06_st(a[i]));
        if(op2===0x2002){fld("置き場所の大きさ",2,"purple",_w06_le(a,i,2)+" バイト");fld("置き場所の数",1,"purple",String(a[i]));}
        else if(op2===0x1009){if(need(6)){f.push(["自分のアドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)]);i+=6;}}
        sum+="（"+(n2?n2[0]:"0x"+_w06_h4(op2))+"）";}
      else if(ev===0x0F){fld("状態",1,"purple",_w06_st(a[i]));fld("送ってよい命令の数",1,"purple",String(a[i]));var op3=need(2)?_w06_le(a,i,2):0,n3=_w06_OP[op3];
        fld("受け付けた命令",2,"purple","0x"+_w06_h4(op3)+(n3?" = "+n3[0]:""));sum+="（"+(n3?n3[0]:"0x"+_w06_h4(op3))+"）";}
      else if(ev===0x05){fld("状態",1,"purple",_w06_st(a[i]));fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("理由",1,"purple",_w06_st(a[i]));}
      else if(ev===0x10){fld("ハードウェアの番号",1,"purple","製品ごとの意味");}
      else if(ev===0x13){var nh=a[i];fld("ハンドルの数",1,"purple",String(nh));for(var k=0;k<nh&&!bad;k++){fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("空いた数",2,"purple",String(_w06_le(a,i,2)));}}
      else if(ev===0x3E){var se=a[i],sn=_w06_SUB[se];fld("サブイベント",1,"purple","0x"+_w06_h2(se)+(sn?" = "+sn[0]+"（"+sn[1]+"）":""));sum="HCI イベント "+(sn?sn[0]:"LE Meta");
        if(se===0x01){fld("状態",1,"purple",_w06_st(a[i]));fld("接続ハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));fld("役割",1,"purple",a[i]===0?"0 = セントラル（16 章）":"1 = ペリフェラル");
          fld("相手のアドレスの種類",1,"purple",a[i]===1?"1 = ランダム":"0 = 公開");if(need(6)){f.push(["相手のアドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)]);i+=6;}
          fld("接続間隔",2,"purple",U.sig(_w06_le(a,i,2)*1.25,4)+" ms（18 章）");fld("レイテンシ",2,"purple",String(_w06_le(a,i,2)));fld("監視タイムアウト",2,"purple",U.sig(_w06_le(a,i,2)*10,4)+" ms");fld("クロックの精度",1,"purple","");}
        else if(se===0x02){var nr=a[i];fld("報告の数",1,"purple",String(nr)+(nr!==1?"（この解読器は 1 つだけ読む）":""));
          fld("パケットの種類",1,"purple",["0 = ADV_IND（17 章）","1 = ADV_DIRECT_IND","2 = ADV_SCAN_IND","3 = ADV_NONCONN_IND","4 = SCAN_RSP"][a[i]]||"?");
          fld("アドレスの種類",1,"purple",a[i]===1?"1 = ランダム":"0 = 公開");if(need(6)){f.push(["アドレス",6,"purple",_w06_hx(a.slice(i,i+6)),_w06_addr(a,i)]);i+=6;}
          var dl=a[i];fld("データの長さ",1,"purple",dl+" バイト");if(dl>0&&need(dl)){var tx="";a.slice(i,i+dl).forEach(function(b){tx+=b>=32&&b<127?String.fromCharCode(b):".";});f.push(["アドバタイズのデータ",dl,"purple",_w06_hx(a.slice(i,i+dl)),"中身は 17 章（文字にすると "+tx+"）"]);i+=dl;}
          if(need(1)){var rs=a[i]>127?a[i]-256:a[i];f.push(["RSSI",1,"purple",_w06_hx([a[i]]),rs+" dBm（受けた電波の強さ）"]);i++;}}
      }
      if(i<e2&&!bad){f.push(["残りのパラメータ",e2-i,"purple",_w06_hx(a.slice(i,e2)),""]);i=e2;}
      if(i>e2&&!bad)bad="長さの欄より多く読んだ（形が正しくない）";
      return {f:f,bad:bad,len:Math.max(i,e2),sum:sum};
    }
    if(t===0x02){
      f.push(["種類",1,"signal","02","ACL データ（両方向）"]);
      if(!need(4))return {f:f,bad:bad,len:a.length,sum:"ACL データ（途中まで）"};
      var hf=_w06_le(a,1,2),hd=hf&0x0FFF,pb=(hf>>12)&3,bc=(hf>>14)&3;
      fld("ハンドル・フラグ",2,"gold","接続ハンドル 0x"+_w06_h3(hd)+" ・ PB = 0b"+("0"+pb.toString(2)).slice(-2)+"（"+(pb===1?"続きの断片":pb===3?"この章では扱わない値":"上の層のパケットの先頭")+"）・ BC = "+bc);
      var dl2=_w06_le(a,i,2);fld("データの長さ",2,"teal",dl2+" バイト");
      var e3=i+dl2;
      if(dl2>=4&&need(4)){var l2=_w06_le(a,i,2),cid=_w06_le(a,i+2,2);fld("L2CAP の長さ",2,"purple",l2+" バイト");
        fld("チャネルの番号",2,"purple","0x"+_w06_h4(cid)+(cid===4?" = ATT（18 章）":cid===6?" = SMP（20 章）":cid===5?" = LE の信号":""));
        if(cid===4&&i<e3&&need(1)){var ao=a[i];fld("ATT の命令",1,"purple","0x"+_w06_h2(ao)+(_w06_ATT[ao]?" = "+_w06_ATT[ao]:""));
          if((ao===0x1B||ao===0x1D||ao===0x12||ao===0x52||ao===0x0A)&&need(2)){fld("属性のハンドル",2,"purple","0x"+_w06_h4(_w06_le(a,i,2)));}}}
      if(i<e3&&!bad&&a.length>=e3){f.push(["値",e3-i,"purple",_w06_hx(a.slice(i,e3)),"アプリケーションのデータ（18 章）"]);i=e3;}
      if(a.length<e3&&!bad)bad="バイトが足りない（データの長さの欄は "+dl2+"）";
      return {f:f,bad:bad,len:Math.max(i,e3),sum:"ACL データ（ハンドル 0x"+_w06_h3(hd)+"、"+dl2+" バイト）"};
    }
    return {f:[["種類",1,"alias",_w06_hx([t]),"H4 の種類として知らない値（01・02・04 のどれでもない）"]],bad:"種類のバイトが正しくない",len:1,sum:"不明"};
  }
  function _w06_h2(v){v=v||0;var s=v.toString(16).toUpperCase();return s.length<2?"0"+s:s;}
  function _w06_h3(v){v=v||0;var s=v.toString(16).toUpperCase();while(s.length<3)s="0"+s;return s;}
  function _w06_h4(v){v=v||0;var s=v.toString(16).toUpperCase();while(s.length<4)s="0"+s;return s;}

  REG.w06_hci=function(el,U){
    var EX=[["HCI_Reset","01 03 0C 00"],["リセットの完了","04 0E 04 01 03 0C 00"],["置き場所を聞く","01 02 20 00"],["その答え","04 0E 07 01 02 20 00 FB 00 03"],
      ["アドバタイズを始める","01 0A 20 01 01"],["接続を始める","01 0D 20 19 60 00 30 00 00 01 66 55 44 33 22 C1 00 18 00 28 00 00 00 C8 00 00 00 00 00"],
      ["受け付けた","04 0F 04 00 01 0D 20"],["接続できた","04 3E 13 01 00 40 00 00 01 66 55 44 33 22 C1 18 00 00 00 C8 00 00"],
      ["アドバタイズの報告","04 3E 15 02 01 00 01 66 55 44 33 22 C1 09 02 01 06 05 09 54 45 4D 50 C4"],["ACL データ（通知）","02 40 20 09 00 05 00 04 00 1B 12 00 0B 09"],
      ["場所が空いた","04 13 05 01 40 00 01 00"],["接続が切れた","04 05 04 00 40 00 13"]];
    var STREAM="04 0E 04 01 03 0C 00 04 0E 07 01 02 20 00 FB 00 03 04 13 05 01 40 00 01 00 04 05 04 00 40 00 13";
    U.head(el,"HCI","H4 のパケットを解読する");
    var row=U.ctrls(el);
    var tx=U.textin(row,"16 進のバイト（H4 の種類のバイトから）","01 03 0C 00",function(){draw();},{width:"100%"});
    var br=U.btnrow(el);
    EX.forEach(function(e){U.button(br,e[0],function(){mode.set(false);tx.set(e[1]);draw();});});
    var row2=U.ctrls(el);
    var mode=U.checkbox(row2,"並んだパケットの流れとして読む（ホストの側: 02 と 04 だけを区切る）",false,function(){draw();});
    var drop=U.slider(row2,"落とすバイト",{min:0,max:32,step:1,value:0,fmt:function(v){return v===0?"なし":v+" バイト目";},onInput:function(){draw();}});
    var br2=U.btnrow(el);
    U.button(br2,"流れの例（4 つのイベント）",function(){mode.set(true);tx.set(STREAM);drop.set(0);draw();});
    U.button(br2,"2 つ目の先頭の 04 を落とす",function(){mode.set(true);tx.set(STREAM);drop.set(8);draw();});
    var box=U.svgbox(el,{scroll:true});var ro=U.readout(el);
    function parse(){var s=tx.get().replace(/0x/gi," ").replace(/[,;]/g," ").trim(),a=[],badc=false;if(!s)return {a:a,bad:false};
      s.split(/\s+/).forEach(function(w){if(!/^[0-9a-fA-F]{1,2}$/.test(w)){if(/^[0-9a-fA-F]+$/.test(w)&&w.length%2===0){for(var k=0;k<w.length;k+=2)a.push(parseInt(w.substr(k,2),16));}else badc=true;}else a.push(parseInt(w,16));});
      return {a:a,bad:badc};}
    function draw(){
      var p=parse(),a=p.a,warn=p.bad?'<span class="warn">16 進の 2 桁でない語を読み飛ばした。</span><br>':"";
      drop.input.max=Math.max(1,a.length);
      if(!a.length){box.set("");ro.innerHTML=warn+"バイトを入れる。";return;}
      if(!mode.get()){
        var d=_w06_decode(a),o=[],cw=26,per=24,x0=8,y0=26,pos=0,maxr=0;
        o.push(U.S.T(x0,12,"ます目は 1 バイト（16 進）。色は欄、上の数は下の表の番号。","start",9.5,"muted"));
        d.f.forEach(function(x,k){for(var j=0;j<x[1]&&pos<a.length;j++,pos++){var r=Math.floor(pos/per),q=pos%per,xx=x0+q*cw,yy=y0+r*52;maxr=Math.max(maxr,r);
            o.push(U.S.RECT(xx+1,yy+12,cw-2,24,3,U.soft(x[2]),x[2],k%2?1.8:1.1));o.push(U.S.T(xx+cw/2,yy+28,_w06_hx([a[pos]]),"middle",9.5,"ink",true,true));
            if(j===0)o.push(U.S.T(xx+3,yy+8,String(k+1),"start",8.5,x[2],true));}});
        for(;pos<a.length;pos++){var r2=Math.floor(pos/per),q2=pos%per;maxr=Math.max(maxr,r2);o.push(U.S.RECT(x0+q2*cw+1,y0+r2*52+12,cw-2,24,3,"panel","line",1,"3 2"));o.push(U.S.T(x0+q2*cw+cw/2,y0+r2*52+28,_w06_hx([a[pos]]),"middle",9.5,"muted",false,true));}
        box.set(U.S.svg(x0*2+per*cw,y0+(maxr+1)*52,o));
        var rows=d.f.map(function(x,k){return [String(k+1),'<span style="color:'+U.col(x[2])+';font-weight:700">'+U.esc(x[0])+'</span>',String(x[1]),'<span style="font-family:var(--mono)">'+U.esc(x[3])+'</span>',_w06_wrap(U.esc(x[4]||""))];});
        var rest=a.length-d.len;
        ro.innerHTML=warn+"<b>"+U.esc(d.sum)+"</b> ・ 全体 "+Math.min(d.len,a.length)+" バイト"+(d.bad?' ・ <span class="warn">'+U.esc(d.bad)+'</span>':' <span class="ok">形どおり</span>')+
          (rest>0?" ・ 後に "+rest+" バイト残っている（「流れとして読む」で続きを区切れる）":"")+U.tbl(["#","欄","バイト数","値","意味"],rows,["right","left","right","left","left"]);
        return;
      }
      /* 流れ: 本文の h4_feed と同じ手順で区切る */
      var dp=drop.get(),b=a.slice();if(dp>0&&dp<=b.length)b.splice(dp-1,1);
      var st=0,typ=0,got=0,need=0,cur=[],pk=[],skipped=[],role=[];
      for(var i=0;i<b.length;i++){var c=b[i];
        if(st===0){if(c===4)need=2;else if(c===2)need=4;else{skipped.push(i);role[i]=-1;continue;}typ=c;got=0;st=1;cur=[i];role[i]=pk.length;continue;}
        cur.push(i);role[i]=pk.length;got++;
        if(st===1&&got===need){need+=typ===4?b[cur[2]]:(b[cur[3]]|(b[cur[4]]<<8));st=2;}
        if(st===2&&got===need){pk.push({ix:cur.slice(),type:typ});st=0;}}
      var pend=st!==0?{ix:cur.slice(),need:need,got:got}:null;
      var cols=["signal","green","gold","purple","teal"],o=[],cw=24,per=26,x0=8,y0=22,W=x0*2+per*cw;
      var ref=null;if(dp>0){/* 落とさない場合の区切り */var r0=[];(function(){var s2=0,t2=0,g2=0,n2=0,c2=[];for(var j=0;j<a.length;j++){var v=a[j];if(s2===0){if(v===4)n2=2;else if(v===2)n2=4;else continue;t2=v;g2=0;s2=1;c2=[j];continue;}c2.push(j);g2++;if(s2===1&&g2===n2){n2+=t2===4?a[c2[2]]:(a[c2[3]]|(a[c2[4]]<<8));s2=2;}if(s2===2&&g2===n2){r0.push(_w06_hx(c2.map(function(q){return a[q];})));s2=0;}}})();ref=r0;}
      o.push(U.S.T(x0,14,"届いた "+b.length+" バイト（色 = 受け手が区切ったパケット、灰色 = 種類として読めずに捨てたバイト、点線 = 読みかけ）","start",10,"muted"));
      var rowsN=Math.ceil(b.length/per);
      for(var j=0;j<b.length;j++){var r=Math.floor(j/per),q=j%per,xx=x0+q*cw,yy=y0+r*44,ro2=role[j],c3;
        var inPend=pend&&pend.ix.indexOf(j)>=0;
        if(ro2===-1)c3="muted";else if(inPend)c3="alias";else c3=cols[ro2%cols.length];
        o.push(U.S.RECT(xx+1,yy,cw-2,24,3,ro2===-1?"panel":U.soft(c3),c3,1.1,inPend?"3 2":null));
        o.push(U.S.T(xx+cw/2,yy+16,_w06_hx([b[j]]),"middle",9,"ink",true,true));
        if(dp>0&&j===dp-1){o.push(U.S.L(xx,yy-4,xx,yy+30,"alias",2));o.push(U.S.T(xx,yy+38,"↑ ここで 1 バイト欠けた","start",8.5,"alias",true));}
      }
      box.set(U.S.svg(W,y0+rowsN*44+12,o));
      var rows=pk.map(function(p,k){var bs=p.ix.map(function(q){return b[q];}),d=_w06_decode(bs),h=_w06_hx(bs),ok=!ref||ref.indexOf(h)>=0;
        return [String(k+1),'<span style="color:'+U.col(cols[k%cols.length])+';font-weight:700">'+U.esc(d.sum)+'</span>','<span style="font-family:var(--mono)">'+h+'</span>',ok?'<span class="ok">正しい</span>':'<span class="warn">誤った内容</span>'];});
      ro.innerHTML=warn+"区切ったパケット <b>"+pk.length+"</b> 個 ・ 種類として読めずに捨てたバイト <b>"+skipped.length+"</b> 個"+
        (pend?' ・ <span class="warn">読みかけ: あと '+(pend.need-pend.got)+' バイトを待っている</span>':"")+
        U.tbl(["#","受け手が読んだもの","バイト","落とさない場合と比べて"],rows,["right","left","left","left"])+
        '<div class="wnote">H4 には区切り文字も CRC も無いので、受け手は誤った内容のパケットにも気づけない。本文の 4 つのイベントの列では、落とす位置を 32 通り変えると、欠けたパケットが失われるだけで済むのは 1 通りだけである。</div>';
    }
    draw();
  };

  /* ===== 07 章 階層とカプセル化 ===== */
  /* MQTT の PUBLISH（QoS 0）のヘッダ: 固定ヘッダ 1 + 残りの長さ 1〜4 + トピック名の長さ 2 + トピック名 */
  function _w07_mqtt(n,topic){var rem=2+topic+n,rl=rem<128?1:rem<16384?2:rem<2097152?3:4;return 1+rl+2+topic;}
  /* HTTP の POST の最小限のヘッダ: "POST /data HTTP/1.1\r\n" 21 + "Host: example.com\r\n" 19 + "Content-Length: " 16 + 桁 + "\r\n" 2 + 空行 2 */
  function _w07_http(n){return 60+String(n).length;}
  function _w07_bytes(v){return Math.round(v).toLocaleString("en-US")+" バイト";}
  function _w07_num(U,v){return !isFinite(v)?"∞":v>=1e4?Math.round(v).toLocaleString("en-US"):U.sig(v,3);}
  /* 横に並んだ欄の中に文字が入るなら入れる */
  function _w07_lab(S,x,w,y,nm,b,c){var t1=nm+" "+b,t2=String(b);
    var sz=9.5,tw=function(s){var q=0;for(var i=0;i<s.length;i++)q+=s.charCodeAt(i)<128?sz*0.56:sz;return q;};
    if(w>=tw(t1)+4)return S.T(x+w/2,y,t1,"middle",sz,c,true);sz=9;if(w>=tw(t1)+3)return S.T(x+w/2,y,t1,"middle",sz,c,true);
    sz=9.5;if(w>=tw(t2)+3)return S.T(x+w/2,y,t2,"middle",sz,c,true);return "";}

  REG.w07_encap=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ENCAP","1 つのメッセージを送るとき、各層が足すバイト");
    var row=U.ctrls(el);
    var nS=U.slider(row,"データの大きさ n",{min:1,max:1000,value:20,log:true,step:0.0001,snap:function(v){return Math.max(1,Math.round(v));},fmt:function(v){return v+" バイト";},onInput:draw});
    var app=U.select(row,"アプリケーション層",["なし（データだけ）","MQTT（トピック名 10 バイト）","HTTP の POST（最小限のヘッダ）"],1,draw);
    var tls=U.checkbox(row,"TLS 1.3 で暗号化する（12 章）",false,draw);
    var row2=U.ctrls(el);
    var tr=U.select(row2,"トランスポート層",["TCP","UDP"],0,draw);
    var nw=U.select(row2,"ネットワーク層",["IPv4","IPv6"],0,draw);
    var lk=U.select(row2,"リンク層",["Ethernet","Wi-Fi（WPA2 で暗号化）"],0,draw);
    var rt=U.select(row2,"Ethernet の速さ",["10 Mbps","100 Mbps"],1,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例に戻す",function(){nS.set(20);app.set(1);tls.set(false);tr.set(0);nw.set(0);lk.set(0);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var n=nS.get(),a=app.get(),useTLS=tls.get(),t=tr.get(),v6=nw.get()===1,wifi=lk.get()===1,rate=rt.get()===0?10e6:100e6;
      rt.input.disabled=wifi;
      var notes=[];
      if(a>0&&t===1){t=0;notes.push("MQTT と HTTP は TCP の上で動くので、TCP で計算した。");}
      if(useTLS&&t===1){useTLS=false;notes.push("UDP の上では TLS ではなく DTLS を使う（14 章）。ここでは TLS を外して計算した。");}
      var appH=a===1?_w07_mqtt(n,10):a===2?_w07_http(n):0, appN=a===1?"MQTT":a===2?"HTTP":"";
      var trH=t===0?20:8, trN=t===0?"TCP":"UDP", ipH=v6?40:20, ipN=v6?"IPv6":"IPv4";
      var ipLen=ipH+trH+(useTLS?22:0)+appH+n;
      var pad=wifi?0:Math.max(0,46-ipLen);
      /* 一番下の行の並び（外側から内側へ、データ、内側から外側へ）。lv はその欄が属する層 */
      var P=[];
      if(!wifi)P.push({nm:"前",b:8,c:"muted",lv:6});
      P.push(wifi?{nm:"Wi-Fi",b:42,c:"signal",lv:5}:{nm:"Ethernet",b:14,c:"signal",lv:5});
      P.push({nm:ipN,b:ipH,c:"gold",lv:4});
      P.push({nm:trN,b:trH,c:"green",lv:3});
      if(useTLS)P.push({nm:"TLS",b:5,c:"teal",lv:2});
      if(appH)P.push({nm:appN,b:appH,c:"purple",lv:1});
      P.push({nm:"データ",b:n,c:"ink",lv:0});
      if(useTLS)P.push({nm:"TLS",b:17,c:"teal",lv:2});
      if(pad)P.push({nm:"詰め物",b:pad,c:"muted",lv:5});
      P.push(wifi?{nm:"MIC・FCS",b:12,c:"signal",lv:5}:{nm:"FCS",b:4,c:"signal",lv:5});
      if(!wifi)P.push({nm:"空き",b:12,c:"muted",lv:6});
      var total=0;P.forEach(function(p){total+=p.b;});
      var X0=120,BW=500,s=BW/total,x=X0;P.forEach(function(p){p.x=x;p.w=p.b*s;x+=p.w;});
      var levels=[0];if(appH)levels.push(1);if(useTLS)levels.push(2);levels.push(3,4,5);if(!wifi)levels.push(6);
      var names={0:"データ",1:appN+" のメッセージ",2:"TLS のレコード",3:t===0?"TCP のセグメント":"UDP のデータグラム",4:"IP パケット",5:wifi?"Wi-Fi のフレーム":"Ethernet フレーム",6:"線の上"};
      var o=[],rh=26,gap=10,y0=8;
      levels.forEach(function(L,i){
        var y=y0+i*(rh+gap),inc=P.filter(function(p){return p.lv<=L;}),tot=0;
        inc.forEach(function(p){tot+=p.b;
          var fill=p.c==="ink"?"panel":(p.c==="muted"?"screen":U.soft(p.c));
          o.push(S.RECT(p.x,y,Math.max(p.w,0.6),rh,3,fill,p.c,1.1,p.c==="muted"?"3 2":null));
          o.push(_w07_lab(S,p.x,p.w,y+rh/2+3.6,p.nm,p.b,p.c==="muted"?"ink":p.c));});
        var xl=inc[0].x,xr=inc[inc.length-1].x+inc[inc.length-1].w;
        o.push(S.T(xl-8,y+rh/2+4,names[L],"end",10.5,"ink",true));
        o.push(S.T(xr+8,y+rh/2+4,tot+(L===6?" バイト分":" バイト"),"start",10,"ink"));
      });
      box.set(S.svg(700,y0+levels.length*(rh+gap)+4,o));
      var N=total,H=N-n,eta=n/N;
      var parts=[];
      if(appH)parts.push(appN+" "+appH);
      if(useTLS)parts.push("TLS 22");
      parts.push(trN+" "+trH,ipN+" "+ipH);
      parts.push(wifi?"Wi-Fi 54":"Ethernet 18");
      if(pad)parts.push("詰め物 "+pad);
      if(!wifi)parts.push("線の上 20");
      var h=(wifi?"フレームのバイト数":"線の上のバイト数")+" N = データ "+n+" + オーバーヘッド H（"+parts.join(" + ")+" = "+H+"） = <b>"+N+" バイト"+(wifi?"":"分")+"</b><br>"+
        "効率 η = n / N = "+n+" / "+N+" = <b>"+U.fmt.pct(eta,3)+"</b>"+(eta<0.5?' <span class="warn">データより、各層が足すバイトのほうが多い</span>':'')+"<br>";
      if(!wifi)h+="線の上の時間 = "+N+" × 8 ÷ "+(rate/1e6)+" Mbps = <b>"+F.time(N*8/rate)+"</b>"+(pad?" ・ IP パケットが "+ipLen+" バイトで 46 バイトに満たないので、詰め物が "+pad+" バイト入った":"");
      else h+="Wi-Fi の 54 バイトの内訳: ヘッダ 26・暗号化のヘッダ 8・LLC/SNAP 8・暗号化の検査値（MIC）8・FCS 4。電波の上の前置きの信号や ACK の時間は含まない（09 章）";
      if(notes.length)h+='<br><span class="warn">'+notes.join(" ")+"</span>";
      ro.innerHTML=h;
    }
    draw();
  };

  /* 大きなデータを TCP で送るときの線の上のバイト数（Ethernet。セグメントごとに IP・TCP のヘッダ、Ethernet の 18 と線の上の 20） */
  function _w07_tcpWire(n,mss,ipH){var k=Math.ceil(n/mss),last=n-(k-1)*mss;
    return {k:k,last:last,N:(k-1)*(mss+ipH+20+38)+Math.max(46,ipH+20+last)+38};}

  REG.w07_mss=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"MSS","大きなデータを MSS ごとのセグメントに分けて送る");
    var row=U.ctrls(el);
    var nS=U.slider(row,"送るデータの量 n",{min:1,max:1e6,value:10000,log:true,step:0.0001,snap:function(v){return Math.max(1,Math.round(v));},fmt:_w07_bytes,onInput:draw});
    var mt=U.select(row,"MTU",[{v:"1500",t:"1500（Ethernet）"},{v:"1492",t:"1492（PPPoE の回線）"},{v:"1280",t:"1280（IPv6 の最小）"},{v:"576",t:"576"}],"1500",draw);
    var nw=U.select(row,"ネットワーク層",["IPv4","IPv6"],0,draw);
    var rt=U.select(row,"Ethernet の速さ",["10 Mbps","100 Mbps"],1,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var n=nS.get(),mtu=parseInt(mt.get(),10),v6=nw.get()===1,ipH=v6?40:20,rate=rt.get()===0?10e6:100e6,note="";
      if(v6&&mtu<1280){mtu=1280;note='<br><span class="warn">IPv6 では MTU を 1280 バイト以上にする決まりがあるので、1280 で計算した。</span>';}
      var mss=mtu-ipH-20,r=_w07_tcpWire(n,mss,ipH),eta=n/r.N,emax=mss/(mss+ipH+20+38);
      var o=[],p=U.plot(70,14,600,170,[1,1e6],[0,100],{xlog:true});
      o.push(p.axes({xl:"送るデータの量 n [バイト]（対数目盛）",yl:"効率 [%]",xt:[1,10,100,1e3,1e4,1e5,1e6],yt:[0,25,50,75,100],
        xfmt:function(v){return v>=1e6?"1M":v>=1e3?(v/1e3)+"k":String(v);},yfmt:function(v){return String(v);}}));
      var xs=[];for(var i=0;i<=600;i++)xs.push(Math.max(1,Math.round(Math.pow(10,i/100))));
      for(var k=1;k*mss<=1e6&&k<=60;k++){xs.push(k*mss);xs.push(k*mss+1);}
      xs.sort(function(a,b){return a-b;});
      var pts=[],prev=-1;xs.forEach(function(v){if(v===prev)return;prev=v;pts.push([v,100*v/_w07_tcpWire(v,mss,ipH).N]);});
      o.push(S.L(p.X(1),p.Y(100*emax),p.X(1e6),p.Y(100*emax),"green",1.2,"5 4"));
      o.push(S.T(p.X(1)+6,p.Y(100*emax)-5,"上限 MSS / (MSS + "+(ipH+20+38)+") = "+U.fmt.pct(emax,3),"start",9.5,"green"));
      o.push(p.line(pts,"signal",2));
      o.push(S.D(p.X(n),p.Y(100*eta),"alias",5));
      o.push(S.T(p.X(n)+(p.X(n)>560?-8:8),p.Y(100*eta)+16,"いまの値 "+U.fmt.pct(eta,3),p.X(n)>560?"end":"start",10,"alias",true));
      /* セグメントの並び */
      var ys=248,segs=[],kk=r.k;
      for(var j=0;j<kk;j++){if(kk<=8||j<3||j>=kk-2)segs.push(j);else if(j===3)segs.push(-1);}
      var unitW=600/segs.length,xx=70;
      o.push(S.T(70,ys-8,"セグメントの並び（全部で "+kk+" 個。1 つの箱が 1 つのフレーム）","start",10,"ink",true));
      segs.forEach(function(j){
        if(j<0){o.push(S.T(xx+unitW/2,ys+18,"…","middle",14,"muted",true));xx+=unitW;return;}
        var d=j===kk-1?r.last:mss,hdr=ipH+20+18,bw=unitW-6,hw=Math.max(4,bw*hdr/(mtu+18)),dw=Math.max(3,bw*d/(mtu+18)-0);
        o.push(S.RECT(xx,ys,hw,26,3,U.soft("gold"),"gold",1));
        o.push(S.RECT(xx+hw,ys,dw,26,3,"panel","ink",1));
        if(dw>34)o.push(S.T(xx+hw+dw/2,ys+17,String(d),"middle",9.5,"ink",true));
        xx+=unitW;});
      o.push(S.T(70,ys+44,"金色: そのセグメントの IP・TCP・Ethernet のヘッダと FCS（"+(ipH+20+18)+" バイト）、白: データ（数字はバイト数）","start",9.5,"muted"));
      box.set(S.svg(700,ys+54,o));
      ro.innerHTML="MSS = MTU − IP ヘッダ − TCP ヘッダ = "+mtu+" − "+ipH+" − 20 = <b>"+mss+" バイト</b><br>"+
        "セグメントの数 k = ⌈"+n+" / "+mss+"⌉ = <b>"+kk+"</b>（最後のセグメントのデータは "+r.last+" バイト）<br>"+
        "線の上のバイト数 N = <b>"+U.fmt.int(r.N)+" バイト分</b> ・ 効率 n / N = <b>"+U.fmt.pct(eta,3)+"</b>（上限 "+U.fmt.pct(emax,3)+"）<br>"+
        "線の上の時間 = N × 8 ÷ "+(rate/1e6)+" Mbps = <b>"+F.time(r.N*8/rate)+"</b> ・ 続けて送るときのデータのスループットの上限 = 効率 × "+(rate/1e6)+" Mbps = <b>"+F.rate(eta*rate)+"</b>"+note;
    }
    draw();
  };

  REG.w07_frag=function(el,U){
    var S=U.S,F=U.fmt,seed=7;
    U.head(el,"FRAG","UDP の大きなデータが IP のフラグメントに分かれるとき");
    var row=U.ctrls(el);
    var nS=U.slider(row,"UDP のデータの大きさ",{min:100,max:65507,value:3000,log:true,step:0.0001,snap:function(v){v=Math.round(v);return v>65480?65507:Math.max(1,v);},fmt:_w07_bytes,onInput:draw});
    var mt=U.select(row,"MTU",[{v:"1500",t:"1500（Ethernet）"},{v:"1492",t:"1492（PPPoE の回線）"},{v:"1280",t:"1280（IPv6 の最小）"},{v:"576",t:"576"}],"1500",draw);
    var nw=U.select(row,"ネットワーク層",["IPv4","IPv6"],0,draw);
    var row2=U.ctrls(el);
    var pS=U.slider(row2,"1 つのフラグメントが失われる確率 p",{min:0,max:20,step:0.1,value:1,fmt:function(v){return v.toFixed(1)+" %";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var TRIALS=1000;
    function draw(){
      var n=nS.get(),mtu=parseInt(mt.get(),10),v6=nw.get()===1,p=pS.get()/100,note="";
      if(v6&&mtu<1280){mtu=1280;note='<br><span class="warn">IPv6 では MTU を 1280 バイト以上にする決まりがあるので、1280 で計算した。</span>';}
      var ipH=v6?40:20,L=8+n,fh=v6?8:0,k,per;
      if(ipH+L<=mtu){k=1;per=L;}else{per=Math.floor((mtu-ipH-fh)/8)*8;k=Math.ceil(L/per);}
      var P=Math.pow(1-p,k),maxD=mtu-ipH-8,k2=Math.ceil(n/maxD);
      /* 乱数で TRIALS 個のパケットを送ってみる */
      var R=U.rng(seed),ok=0,res=[];
      for(var t=0;t<TRIALS;t++){var all=true;for(var j=0;j<k;j++)if(R.next()<p)all=false;if(all)ok++;if(t<200)res.push(all);}
      var o=[];
      /* フラグメントの並び */
      o.push(S.T(10,16,k===1?"MTU に収まるので分けない（1 つの IP パケット）":"IP のペイロード "+L+" バイトを "+k+" 個のフラグメントに分ける（1 つに "+per+" バイトまで）","start",10.5,"ink",true));
      var x0=10,W=680,hdrW=Math.max(3,Math.min(14,W/k*0.2)),dataW=(W-k*hdrW)/L,xx=x0;
      for(var i=0;i<k;i++){var d=i<k-1?per:L-(k-1)*per,dw=d*dataW;
        o.push(S.RECT(xx,26,hdrW,26,2,U.soft("gold"),"gold",1));xx+=hdrW;
        o.push(S.RECT(xx,26,Math.max(dw,1),26,2,i===0?U.soft("green"):"panel",i===0?"green":"ink",1));
        if(dw>46)o.push(S.T(xx+dw/2,43,String(d),"middle",9.5,"ink",true));
        if(i<3&&k>1&&dw>70)o.push(S.T(xx+dw/2,66,"オフセット "+(i*per/8),"middle",9,"muted"));
        xx+=dw;}
      o.push(S.T(10,k>1?84:70,"金色: 各フラグメントの IP ヘッダ"+(v6?"（IPv6 では、さらにフラグメント用の 8 バイト）":"")+"、緑: UDP のヘッダを含む最初のフラグメント","start",9.5,"muted"));
      /* 試した結果 */
      var gy=112,cs=13;
      o.push(S.T(10,gy-6,"1000 個送ったうちの最初の 200 個（緑: 全部届いた、赤: どれかが失われて全体が届かなかった）","start",10,"ink",true));
      res.forEach(function(a,q){var r=Math.floor(q/40),c=q%40;o.push(S.RECT(10+c*17,gy+r*(cs+3),cs,cs,2,a?U.soft("green"):U.soft("alias"),a?"green":"alias",1));});
      /* 送り直したときのフラグメントの数 */
      var by=gy+5*(cs+3)+26,e1=P>0?k/P:Infinity,e2=k2/(1-p),mx=Math.max(isFinite(e1)?e1:0,e2,1);
      o.push(S.T(10,by-8,"届くまで送り直したときに送る IP パケットの数の平均","start",10,"ink",true));
      [["丸ごと送り直す",e1,"alias"],["MTU に収まる "+k2+" 個に分ける",e2,"green"]].forEach(function(b,q){
        var yy=by+q*30,w=isFinite(b[1])?480*Math.min(b[1],mx)/mx:480;
        o.push(S.RECT(190,yy,Math.max(w,1),20,3,U.soft(b[2]),b[2],1.1));
        o.push(S.T(182,yy+14,b[0],"end",10,"ink"));
        var wx=190+Math.max(w,1),inR=wx+6>600;
        o.push(S.T(inR?wx-6:wx+6,yy+14,_w07_num(U,b[1])+" 個",inR?"end":"start",10,b[2],true));});
      box.set(S.svg(700,by+66,o));
      var h="フラグメントの数 k = "+(k===1?"1（IP パケットが MTU に収まるので分けない）":"⌈"+L+" / "+per+"⌉ = <b>"+k+"</b>")+"<br>"+
        "全部届く確率 (1 − p)<sup>k</sup> = (1 − "+U.sig(p,3)+")<sup>"+k+"</sup> = <b>"+U.sig(P,4)+"</b> ・ 乱数で 1000 個試した結果: "+ok+" 個が届いた（"+U.sig(ok/TRIALS,3)+"）<br>";
      if(k===1)h+="届くまで送り直すと、平均 1 / (1 − p) = <b>"+_w07_num(U,e1)+" 回</b>";
      else h+="届くまで丸ごと送り直すと平均 "+_w07_num(U,1/P)+" 回、送るフラグメントは平均 <b>"+_w07_num(U,e1)+" 個</b> ・ "+
        "MTU に収まる大きさ（データ "+maxD+" バイト以下）の "+k2+" 個のデータグラムに分けて、失われた分だけ送り直すと、平均 <b>"+_w07_num(U,e2)+" 個</b>";
      ro.innerHTML=h+note;
    }
    draw();
  };

  /* ===== 08 章 ネットワークに参加する ===== */
  /* IPv4 アドレスの文字列 → 32 ビットの数（不正なら null） */
  function _w08_ip(s){var m=/^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/.exec(String(s));if(!m)return null;
    var v=0;for(var i=1;i<=4;i++){var k=+m[i];if(k>255)return null;v=v*256+k;}return v>>>0;}
  function _w08_ips(v){return [v>>>24,(v>>>16)&255,(v>>>8)&255,v&255].join(".");}
  /* プレフィックス長 → マスク。JS のシフトも 32 で割った余りを使うので、0 を分ける（C と同じ注意） */
  function _w08_mask(n){return n===0?0:((0xFFFFFFFF<<(32-n))>>>0);}
  function _w08_bits(v){var s=(v>>>0).toString(2);while(s.length<32)s="0"+s;return s;}

  REG.w08_subnet=function(el,U){
    var S=U.S;
    U.head(el,"SUBNET","同じサブネットか、次に誰へ渡すか");
    var row=U.ctrls(el);
    var me=U.textin(row,"自分の IP アドレス","192.168.1.23",draw);
    var pf=U.slider(row,"プレフィックス長",{min:0,max:32,step:1,value:24,fmt:function(v){return "/"+v+"（"+_w08_ips(_w08_mask(v))+"）";},onInput:draw});
    var row2=U.ctrls(el);
    var gw=U.textin(row2,"デフォルトゲートウェイ","192.168.1.1",draw);
    var dst=U.textin(row2,"宛先の IP アドレス","203.0.113.10",draw);
    var br=U.btnrow(el);
    function ex(a,n,g,d){me.set(a);pf.set(n);gw.set(g);dst.set(d);draw();}
    U.button(br,"PC へ（同じサブネット）",function(){ex("192.168.1.23",24,"192.168.1.1","192.168.1.40");});
    U.button(br,"外のサーバへ",function(){ex("192.168.1.23",24,"192.168.1.1","203.0.113.10");});
    U.button(br,"/26 で外になる例",function(){ex("192.168.1.23",26,"192.168.1.1","192.168.1.100");});
    U.button(br,"ゲートウェイの設定の誤り",function(){ex("192.168.1.23",26,"192.168.1.100","203.0.113.10");});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var a=_w08_ip(me.get()),g=_w08_ip(gw.get()),d=_w08_ip(dst.get()),n=pf.get(),m=_w08_mask(n);
      var bad=[];
      if(a===null)bad.push("自分の IP アドレス");if(g===null)bad.push("デフォルトゲートウェイ");if(d===null)bad.push("宛先");
      if(bad.length){box.set(S.svg(520,40,[S.T(260,24,"入力を a.b.c.d（各 0〜255）の形にしてください","middle",11,"alias",true)]));
        ro.innerHTML='<span class="warn">'+bad.join("・")+' の形が正しくない</span>';return;}
      var am=(a&m)>>>0,dm=(d&m)>>>0,gm=(g&m)>>>0,same=am===dm;
      var cw=6.9,xb=148,og=8,W=540,o=[];
      function bx(i){return xb+i*cw+Math.floor(i/8)*og+cw/2;}
      var xr=bx(31)+cw/2+12,rh=18,y=34;
      o.push(S.T(bx(0)-cw/2,16,"ネットワーク部（上位 "+n+" ビット）","start",9.5,"gold",true));
      if(n>0)o.push(S.RECT(bx(0)-cw/2-3,22,bx(n-1)-bx(0)+cw+6,5*rh+8,4,U.soft("gold"),"none",0));
      function row(lab,v,kind,ref,lc){var b=_w08_bits(v);o.push(S.T(xb-10,y,lab,"end",10,lc||"ink",kind!=="addr"));
        for(var i=0;i<32;i++){var ch=b.charAt(i),c;
          if(kind==="mask")c=ch==="1"?"gold":"faint";
          else if(kind==="res")c=i<n?((ref!=null&&_w08_bits(ref).charAt(i)!==ch)?"alias":"signal"):"faint";
          else c=i<n?"ink":"muted";
          o.push(S.T(bx(i),y,ch,"middle",11.5,c,kind==="res"&&i<n,true));}
        o.push(S.T(xr,y,_w08_ips(v),"start",10.5,kind==="res"?(ref!=null&&ref!==v?"alias":"signal"):(kind==="mask"?"gold":"ink"),kind==="res",true));
        y+=rh;}
      row("マスク /"+n,m,"mask",null,"gold");
      o.push(S.L(xb-110,y-13,bx(31)+6,y-13,"line",1));
      row("自分 "+_w08_ips(a),a,"addr");row("AND マスク",am,"res",null,"signal");
      o.push(S.L(xb-110,y-13,bx(31)+6,y-13,"line",1));
      row("宛先 "+_w08_ips(d),d,"addr");row("AND マスク",dm,"res",am,"signal");
      y+=8;
      var bcast=(am|(~m>>>0))>>>0;
      var isB=(d===0xFFFFFFFF)||(d===bcast&&n<31);
      var hop=isB?null:(same?d:g);
      var verdict=d===a?"自分あて":(isB?"ブロードキャスト（リンクの全員）":(same?"同じサブネット → 宛先へ直接渡す":"外 → デフォルトゲートウェイへ渡す"));
      o.push(S.T(20,y+4,verdict,"start",11.5,same||isB?"green":"gold",true));
      y+=14;
      box.set(S.svg(W,y,o));
      var gwIn=((g&m)>>>0)===am, nAddr=Math.pow(2,32-n);
      var msg="自分 AND マスク = <b>"+_w08_ips(am)+"</b>、宛先 AND マスク = <b>"+_w08_ips(dm)+"</b> → "+(same?'<span class="ok">等しい: 同じサブネット</span>':'<b style="color:var(--gold)">違う: 外</b>')+"<br>";
      if(d===a)msg+="宛先は自分自身なので、リンクには出さない。<br>";
      else if(isB)msg+="宛先はブロードキャストのアドレスなので、ARP は使わず、宛先 MAC を FF:FF:FF:FF:FF:FF にして送る。<br>";
      else msg+="次に渡す相手 = <b>"+_w08_ips(hop)+"</b>"+(same?"（宛先そのもの）":"（デフォルトゲートウェイ）")+" → ARP でこの IP アドレスの MAC アドレスを聞く。IP パケットの宛先は "+_w08_ips(d)+" のまま。<br>";
      msg+="このサブネット: "+_w08_ips(am)+"/"+n+"、ブロードキャストのアドレス "+_w08_ips(bcast)+"、アドレスの数 2<sup>"+(32-n)+"</sup> = "+U.fmt.int(nAddr)+
        (n<=30?"、機器に割り当てられる数 "+U.fmt.int(nAddr-2):"（/31 と /32 は特別な使い方をするので、ここでは扱わない）");
      var w=[];
      if(n<=30&&(a===am||a===bcast))w.push("自分のアドレスがサブネットそのもの（後ろが全部 0）かブロードキャスト（全部 1）のアドレスになっている。機器には割り当てない値である");
      if(!gwIn)w.push("デフォルトゲートウェイ "+_w08_ips(g)+" が自分のサブネットの外にある（AND の結果 "+_w08_ips(gm)+"）。ゲートウェイにもフレームを直接届けられないので、外の宛先へは送れない（設定の誤り）");
      if(w.length)msg+='<br><span class="warn">'+w.join("。<br>")+"。</span>";
      ro.innerHTML=msg;
    }
    draw();
  };

  /* DNS の質問を組み立てる（本文の dns_build_query と同じ規則）。返り値 {bytes, kinds, err} */
  function _w08_dnsq(id,name,qtype){
    var b=[],k=[];function put(v,kind){b.push(v&255);k.push(kind);}
    put(id>>8,"id");put(id,"id");put(0x01,"flags");put(0x00,"flags");
    put(0,"cnt");put(1,"cnt");for(var i=0;i<6;i++)put(0,"cnt");
    var labs=String(name).split("."),total=0;
    for(var j=0;j<labs.length;j++){var L=labs[j];
      if(L.length===0)return {err:"空のラベルがある（. が続いている、先頭か末尾が . など）"};
      var enc=[];for(var c=0;c<L.length;c++){var cc=L.charCodeAt(c);if(cc>126||cc<33)return {err:"ラベルに使えない文字がある（この図では ASCII の文字だけを扱う）"};enc.push(cc);}
      if(enc.length>63)return {err:"ラベル「"+_w08_esc(L.slice(0,20))+"…」が "+enc.length+" バイトで、63 バイトを超える"};
      put(enc.length,"len");enc.forEach(function(v){put(v,"lab");});total+=1+enc.length;}
    if(total+1>255)return {err:"名前が全体で "+(total+1)+" バイトになり、255 バイトを超える"};
    put(0,"len");put(qtype>>8,"tc");put(qtype,"tc");put(0,"tc");put(1,"tc");
    return {bytes:b,kinds:k};
  }
  function _w08_esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}
  var _w08_KC={id:"signal",flags:"gold",cnt:null,len:"gold",lab:"signal",tc:"purple",ptr:"gold",ttl:"teal",rdl:null,addr:"green"};

  REG.w08_dns=function(el,U){
    U.head(el,"DNS","名前解決の質問のバイト列");
    var row=U.ctrls(el);
    var nm=U.textin(row,"名前","mqtt.example.com",draw,{width:"260px"});
    var ty=U.select(row,"型",[{v:"1",t:"A（IPv4 アドレス）"},{v:"28",t:"AAAA（IPv6 アドレス）"}],"1",draw);
    var idt=U.textin(row,"ID（16 進 4 桁）","1A2B",draw);
    var br=U.btnrow(el);
    var seed=12345;
    U.button(br,"ID を乱数で決める",function(){var r=U.rng(seed++);var v=r.int(65536);idt.set(U.fmt.hex(v,4));draw();});
    U.button(br,"長すぎるラベルの例",function(){nm.set(new Array(65).join("a")+".example.com");draw();});
    U.button(br,"空のラベルの例",function(){nm.set("mqtt..example.com");draw();});
    U.button(br,"元に戻す",function(){nm.set("mqtt.example.com");idt.set("1A2B");ty.set("1");draw();});
    var ans=U.checkbox(br,"答えの例も表示する",true,draw);
    var out=U.mk("div");el.appendChild(out);
    var ro=U.readout(el);
    function draw(){
      var idv=parseInt(idt.get(),16),qt=+ty.get();
      if(!/^[0-9a-fA-F]{1,4}$/.test(idt.get().trim())||isNaN(idv)){out.innerHTML="";ro.innerHTML='<span class="warn">ID は 16 進 1〜4 桁で入れてください</span>';return;}
      var q=_w08_dnsq(idv,nm.get().trim(),qt);
      if(q.err){out.innerHTML="";ro.innerHTML='<span class="warn">組み立てられない: '+q.err+'。</span>本文の関数は、この場合 0 を返す。';return;}
      var names={id:"ID",flags:"フラグ",cnt:"数",len:"ラベルの長さ",lab:"ラベルの文字",tc:"型とクラス"};
      var h='<div class="wnote">質問（'+q.bytes.length+' バイト）: <span style="color:var(--signal)">ID</span>・<span style="color:var(--gold)">フラグ</span>・数・<span style="color:var(--gold)">長さ</span>・<span style="color:var(--signal)">文字</span>・<span style="color:var(--purple)">型とクラス</span></div>'+
        U.hexView(q.bytes,function(i){return _w08_KC[q.kinds[i]];},function(i){var k=q.kinds[i],v=q.bytes[i];return i+" バイト目: "+names[k]+(k==="lab"?"「"+String.fromCharCode(v)+"」":"");});
      // 名前の部分の読み方（筆算風に: 長さ → 文字）
      var parts=[],i=12;
      while(q.bytes[i]!==0){var L=q.bytes[i],s="";for(var j=1;j<=L;j++)s+=String.fromCharCode(q.bytes[i+j]);parts.push('<b style="color:var(--gold)">'+U.fmt.hex(L)+"</b> → 次の "+L+" バイト「"+_w08_esc(s)+"」");i+=1+L;}
      parts.push('<b style="color:var(--gold)">00</b> → 名前の終わり');
      var rows=[["0〜1","ID",U.fmt.hex(q.bytes[0])+" "+U.fmt.hex(q.bytes[1]),"答えに同じ値が入る"],["2〜3","フラグ","01 00","RD = 1（最後まで調べてほしい）"],
        ["4〜11","数","00 01 00 00 00 00 00 00","質問 1・答え 0・権威 0・追加 0"],["12〜"+(i),"名前",(i-11)+" バイト",parts.join("<br>")],
        [(i+1)+"〜"+(i+4),"型・クラス",U.fmt.hex(qt>>8)+" "+U.fmt.hex(qt)+" 00 01",(qt===1?"A":"AAAA")+"・IN"]];
      h+=U.tbl(["位置","欄","値","意味"],rows,["left","left","left","left"]);
      if(ans.get()){
        var a=q.bytes.slice(),k=q.kinds.slice();a[2]=0x81;a[3]=0x80;a[7]=1;   /* QR=1 RD=1 RA=1、答えの数 = 1 */
        function put(v,kind){a.push(v&255);k.push(kind);}
        put(0xC0,"ptr");put(0x0C,"ptr");put(qt>>8,"tc");put(qt,"tc");put(0,"tc");put(1,"tc");
        put(0,"ttl");put(0,"ttl");put(1,"ttl");put(0x2C,"ttl");
        var addr=qt===1?[203,0,113,10]:[0x20,0x01,0x0d,0xb8,0,0,0,0,0,0,0,0,0,0,0,0x10];
        put(0,"rdl");put(addr.length,"rdl");addr.forEach(function(v){put(v,"addr");});
        var nmA=qt===1?"203.0.113.10":"2001:db8::10";
        h+='<div class="wnote" style="margin-top:.8rem">答えの例（'+a.length+' バイト。アドレスは文書の例のための値）: フラグ <b>81 80</b>（QR = 1・RD = 1・RA = 1・RCODE = 0）、答えの数 1、同じ質問の後に答えのレコード</div>'+
          U.hexView(a,function(i){return i<q.bytes.length?(i===2||i===3||i===7?"alias":null):_w08_KC[k[i]];},function(i){return i+" バイト目";});
        h+=U.tbl(["欄","値","意味"],[["名前","C0 0C","12 バイト目の名前（質問の名前）を指す"],["型・クラス",U.fmt.hex(qt>>8)+" "+U.fmt.hex(qt)+" 00 01",(qt===1?"A":"AAAA")+"・IN"],
          ["TTL","00 00 01 2C","300 秒覚えてよい"],["データの長さ","00 "+U.fmt.hex(addr.length),addr.length+" バイト"],["データ",addr.map(function(v){return U.fmt.hex(v);}).join(" "),nmA]],["left","left","left"]);
      }
      out.innerHTML=h;
      ro.innerHTML="質問の長さ = ヘッダ 12 + 名前 "+(i-11)+" + 型とクラス 4 = <b>"+q.bytes.length+" バイト</b>（UDP のポート 53 へ送る）。ID = 0x"+U.fmt.hex(idv,4)+"。"+
        (ans.get()?" 赤で示した 3 バイトが、質問から答えに変わった所（フラグと答えの数）。":"");
    }
    draw();
  };

  /* NAT の変換表の行のシミュレーション（1 時間）。行は 0 秒に接続して作られる。
     キープアライブ（T_k ごと）がルータに届くと時計が 0 に戻り、T_h 届かないと行が消える。
     行が消えた後、ルータに届いたキープアライブで機器は切断に気づき、すぐに接続し直す（新しい行）。 */
  function _w08_natsim(Tk,Th,p,M,r,H){
    var ka=[],alive=[],last=0,start=0,up=true,deaths=0,recon=0;
    for(var t=Tk;t<=H+1e-9;t+=Tk){
      var lost=r.chance(p);ka.push([t,lost]);
      if(up&&t-last>=Th){alive.push([start,last+Th]);up=false;deaths++;}
      if(!lost){if(up)last=t;else{up=true;start=t;last=t;recon++;}}
    }
    if(up){if(H-last>=Th){alive.push([start,last+Th]);deaths++;}else alive.push([start,H]);}
    var nt=[],t2=r.exp(M);
    while(t2<H){var ok=alive.some(function(a){return t2>=a[0]&&t2<a[1];});nt.push([t2,ok]);t2+=r.exp(M);}
    var at=alive.reduce(function(s,a){return s+(a[1]-a[0]);},0);
    return {ka:ka,alive:alive,deaths:deaths,recon:recon,nt:nt,aliveFrac:at/H};
  }

  REG.w08_nat=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"NAT","変換表の行の保持時間とキープアライブ（1 時間のシミュレーション）");
    var row=U.ctrls(el);
    var sec=function(v){return Math.round(v);};
    var tk=U.slider(row,"キープアライブの間隔 T_k",{min:5,max:600,value:25,log:true,step:0.0001,snap:sec,fmt:function(v){return F.time(v);},onInput:draw});
    var th=U.slider(row,"変換表の保持時間 T_h",{min:10,max:1800,value:60,log:true,step:0.0001,snap:sec,fmt:function(v){return F.time(v);},onInput:draw});
    var row2=U.ctrls(el);
    var pl=U.slider(row2,"キープアライブがルータに届く前に失われる確率 p",{min:0,max:50,step:1,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var mn=U.slider(row2,"サーバからの通知の平均の間隔",{min:10,max:600,value:60,log:true,step:0.0001,snap:sec,fmt:function(v){return F.time(v);},onInput:draw});
    var row3=U.ctrls(el);
    var qk=U.slider(row3,"1 回のキープアライブの電荷 Q_k（代表値）",{min:0.1,max:10,value:2.4,log:true,fmt:function(v){return U.sig(v,3)+" mC";},onInput:draw});
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"25 秒と 60 秒（条件を満たす）",function(){tk.set(25);th.set(60);draw();});
    U.button(br,"90 秒と 60 秒（間隔が長すぎる）",function(){tk.set(90);th.set(60);draw();});
    U.button(br,"保持時間が長い（300 秒と 1800 秒）",function(){tk.set(300);th.set(1800);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Tk=tk.get(),Th=th.get(),p=pl.get()/100,M=mn.get(),H=3600;
      var s=_w08_natsim(Tk,Th,p,M,U.rng(seed*104729+7),H);
      var W=700,x0=110,w=570,o=[],X=function(t){return x0+t/H*w;};
      var y1=26;
      o.push(S.T(x0-10,y1+15,"変換表の行","end",10.5,"ink",true));
      o.push(S.RECT(x0,y1,w,22,3,"screen","line",1));
      var prev=0;s.alive.forEach(function(a){if(a[0]>prev)o.push(S.RECT(X(prev),y1,Math.max(1,X(a[0])-X(prev)),22,2,U.soft("alias"),"alias",1));
        o.push(S.RECT(X(a[0]),y1,Math.max(1,X(a[1])-X(a[0])),22,2,U.soft("green"),"green",1));prev=a[1];});
      if(prev<H)o.push(S.RECT(X(prev),y1,Math.max(1,X(H)-X(prev)),22,2,U.soft("alias"),"alias",1));
      o.push(S.T(x0+4,y1-6,"緑: 行がある　赤: 行が無い（サーバからのパケットは捨てられる）","start",9.5,"muted"));
      var y2=y1+44;
      o.push(S.T(x0-10,y2+4,"キープアライブ","end",10,"signal",true));
      s.ka.forEach(function(k){if(k[1])o.push(S.X(X(k[0]),y2,3.2,"alias",1.6));else o.push(S.L(X(k[0]),y2-7,X(k[0]),y2+7,"signal",1.3));});
      var y3=y2+30;
      o.push(S.T(x0-10,y3+4,"サーバからの通知","end",10,"purple",true));
      s.nt.forEach(function(n){o.push(S.D(X(n[0]),y3,n[1]?"green":"alias",3.4));});
      var ya=y3+20;
      o.push(S.L(x0,ya,x0+w,ya,"muted",1));
      for(var m=0;m<=60;m+=10){o.push(S.L(X(m*60),ya,X(m*60),ya+4,"muted",1));o.push(S.T(X(m*60),ya+16,m+" 分","middle",9.5,"muted"));}
      box.set(S.svg(W,ya+26,o));
      var nOk=s.nt.filter(function(n){return n[1];}).length,nLost=s.nt.length-nOk;
      var jmax=Math.ceil(Th/Tk-1e-9)-2;
      var cond=Tk<Th?'<span class="ok">'+U.sig(Tk,3)+" s < "+U.sig(Th,3)+" s で満たす</span>":'<span class="warn">'+U.sig(Tk,3)+" s ≧ "+U.sig(Th,3)+" s で満たさない（間隔ごとに行が消える）</span>";
      var jtxt=Tk<Th?"続けて失われても行を保てる回数の最大 j = ⌈T_h / T_k⌉ − 2 = <b>"+jmax+"</b>（(j + 1) T_k < T_h を満たす最大の j。"+(jmax+1)+" 回続けて失われると消える）"+
        "。1 時間に行が消える回数の目安 ≈ (3600 / T_k) × (1 − p) × p<sup>"+(jmax+1)+"</sup> = "+U.sig(3600/Tk*(1-p)*Math.pow(p,jmax+1),3)+" 回（"+(jmax+1)+" 回以上続けて失われる並びの数）":"";
      ro.innerHTML="条件 T_k < T_h: "+cond+"<br>"+(jtxt?jtxt+"<br>":"")+
        "シミュレーション: 行があった時間 <b>"+U.sig(s.aliveFrac*100,4)+" %</b>、行が消えた回数 <b>"+s.deaths+"</b>"+(s.deaths?"（そのうち "+s.recon+" 回は、その後のキープアライブで気づいて接続し直した）":"")+"<br>"+
        "サーバからの通知 "+s.nt.length+" 件のうち、届いた <b>"+nOk+"</b> 件、捨てられた "+(nLost?'<span class="warn">'+nLost+" 件</span>":"0 件")+"<br>"+
        "キープアライブで増える平均電流 = Q_k / T_k = "+U.sig(qk.get(),3)+" mC ÷ "+U.sig(Tk,3)+" s = <b>"+F.cur(qk.get()*1e-3/Tk)+"</b>（接続し直す電力は含まない）"+
        '<div class="wnote">機器は、行が消えた後にルータに届いたキープアライブに答えが来ないことで切断に気づき、すぐに接続し直す（新しい行ができる）とした。その前に届いた通知は捨てられる。通知は平均の間隔の指数分布で、乱数で発生させた。</div>';
    }
    draw();
  };

  /* 起動から接続までの 1 回の試行（本文の join_on と同じ段・期限・回数）。時間の単位は秒 */
  function _w08_trial(P,r){
    var t=0,segs=[],marks=[],fails=0,state="DHCP",MAXT=600;
    function seg(a,b,k){if(b>a)segs.push([a,b,k]);}
    function rt(base){return base*(0.8+0.4*r.next());}            /* 往復の時間に ±20 % の揺らぎ */
    function ok(){return !r.chance(P.p)&&!r.chance(P.p);}          /* 往きと帰りの両方が届けば成り立つ */
    function wait(){fails++;var w=r.next()*Math.pow(2,Math.min(fails,6));seg(t,t+w,"wait");t+=w;}   /* 0〜上限の一様乱数 */
    while(t<MAXT){
      var t0=t,got=false,i;
      if(state==="DHCP"){
        var dl=t+30,need=P.reuse?1:2,e=0;
        while(e<need&&t<dl){
          for(var k=0;;k++){marks.push([t,"dhcp"]);
            if(ok()){t+=rt(P.lan);e++;break;}
            var iv=Math.min(4*Math.pow(2,k),64)+r.range(-1,1);
            if(t+iv>=dl){t=dl;break;} t+=iv;}
        }
        seg(t0,t,"dhcp");
        if(e<need){wait();continue;}
        if(P.acd){var c=r.range(0,1)+r.range(1,2)+r.range(1,2)+2;seg(t,t+c,"acd");t+=c;}
        state="ARP";continue;
      }
      if(state==="ARP"){
        for(i=0;i<3;i++){marks.push([t,"arp"]);if(ok()){t+=rt(P.lan);got=true;break;}t+=1;}
        seg(t0,t,"arp");state=got?"DNS":"DHCP";continue;
      }
      if(state==="DNS"){
        for(i=0;i<4;i++){marks.push([t,"dns"]);if(ok()){t+=rt(P.dns);got=true;break;}t+=2;}
        seg(t0,t,"dns");
        if(!got){wait();continue;}
        state="TCP";continue;
      }
      var rto=1,el=0;
      for(;;){marks.push([t,"tcp"]);if(ok()){t+=rt(P.srv);got=true;break;}if(el+rto>=10){t=t0+10;break;}t+=rto;el+=rto;rto*=2;}
      seg(t0,t,"tcp");
      if(!got){wait();state="DNS";continue;}
      return {total:t,segs:segs,marks:marks};
    }
    return {total:t,segs:segs,marks:marks,cut:true};
  }
  var _w08_JK={dhcp:["DHCP","gold"],acd:["重複の確認","teal"],arp:["ARP","signal"],dns:["DNS","purple"],tcp:["接続","green"],wait:["待つ","alias"]};

  REG.w08_join=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"JOIN","起動から接続までの時間（リンクアップから。2000 回の試行）");
    var row=U.ctrls(el);
    var pl=U.slider(row,"1 つのメッセージが失われる確率 p",{min:0,max:30,step:0.5,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var lan=U.slider(row,"LAN の中の往復",{min:1,max:50,value:5,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var row2=U.ctrls(el);
    var dns=U.slider(row2,"DNS サーバの答えまで",{min:5,max:500,value:30,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var srv=U.slider(row2,"サーバまでの往復",{min:10,max:1000,value:100,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var row3=U.ctrls(el);
    var reuse=U.checkbox(row3,"前に借りたアドレスで REQUEST から始める",false,draw);
    var acd=U.select(row3,"受け取ったアドレスの重複の確認",["しない","RFC 5227 の手順（4〜7 秒）"],0,draw);
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),box2=U.svgbox(el); var ro=U.readout(el);
    function q(a,f){var k=Math.min(a.length-1,Math.floor(f*a.length));return a[k];}
    function draw(){
      var P={p:pl.get()/100,lan:lan.get()/1000,dns:dns.get()/1000,srv:srv.get()/1000,reuse:reuse.get(),acd:acd.get()===1};
      var r=U.rng(seed*7919+13),N=2000,tot=[],one=null;
      for(var n=0;n<N;n++){var tr=_w08_trial(P,r);if(n===0)one=tr;tot.push(tr.total);}
      // 1 回分の内訳
      var W=700,x0=20,w=600,T1=Math.max(one.total*1.04,0.2),X=function(t){return x0+t/T1*w;},o=[];
      o.push(S.T(x0,16,"1 回分の内訳（全体 "+F.time(one.total)+"）","start",10.5,"ink",true));
      var y=26;o.push(S.RECT(x0,y,w,24,3,"screen","line",1));
      one.segs.forEach(function(sg){var k=_w08_JK[sg[2]],ww=Math.max(1.2,X(sg[1])-X(sg[0]));
        o.push(S.RECT(X(sg[0]),y,ww,24,2,U.soft(k[1]),k[1],1,sg[2]==="wait"?"4 3":null));
        if(ww>U.tw(k[0],9.5)+6)o.push(S.T(X(sg[0])+ww/2,y+16,k[0],"middle",9.5,k[1],true));});
      one.marks.forEach(function(m){o.push(S.L(X(m[0]),y+24,X(m[0]),y+30,_w08_JK[m[1]][1],1.4));});
      var lx=x0;["dhcp","acd","arp","dns","tcp","wait"].forEach(function(k){var c=_w08_JK[k];o.push(S.RECT(lx,y+38,10,10,2,U.soft(c[1]),c[1],1));o.push(S.T(lx+14,y+47,c[0]+(k==="wait"?"（バックオフ）":""),"start",9.5,"muted"));lx+=U.tw(c[0]+(k==="wait"?"（バックオフ）":""),9.5)+30;});
      o.push(S.T(x0+w,y+47,"下の短い線: 送った時刻","end",9.5,"muted"));
      o.push(S.T(x0,y+66,"0","start",9,"muted"));o.push(S.T(x0+w,y+66,F.time(T1),"end",9,"muted"));
      box.set(S.svg(W,y+72,o));
      // 分布（対数の横軸）
      var s=tot.slice().sort(function(a,b){return a-b;}),lo=0.05,hi=600,nb=48,bins=[];for(var b=0;b<nb;b++)bins.push(0);
      s.forEach(function(v){var k=Math.floor((Math.log10(Math.max(lo,Math.min(hi*0.999,v)))-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*nb);bins[k]++;});
      var bmax=Math.max.apply(null,bins),p=U.plot(60,14,600,120,[lo,hi],[0,bmax*1.1],{xlog:true}),o2=[];
      o2.push(p.axes({xl:"リンクアップから接続までの時間（対数目盛）",yl:"回数",xt:[0.1,1,10,100],xfmt:function(v){return v<1?(v*1000)+" ms":v+" s";},yt:[0,Math.round(bmax/2),bmax],ylOff:42}));
      bins.forEach(function(c,k){if(!c)return;var a=lo*Math.pow(hi/lo,k/nb),bb=lo*Math.pow(hi/lo,(k+1)/nb);o2.push(S.RECT(p.X(a),p.Y(c),Math.max(1,p.X(bb)-p.X(a)-1),p.Y(0)-p.Y(c),1,U.soft("signal"),"signal",1));});
      var med=q(s,0.5),p95=q(s,0.95),mean=s.reduce(function(a,v){return a+v;},0)/N;
      [[med,"中央値","green"],[p95,"95 %","alias"]].forEach(function(m,i){var xx=p.X(Math.max(lo,m[0]));o2.push(S.L(xx,p.Y(bmax*1.1),xx,p.Y(0),m[2],1.6,"5 3"));o2.push(S.T(xx+4,p.Y(bmax*1.05)+i*13,m[1]+" "+F.time(m[0]),"start",9.5,m[2],true));});
      box2.set(S.svg(W,180,o2));
      var base=(P.reuse?1:2)*P.lan+P.lan+P.dns+P.srv,over1=s.filter(function(v){return v>1;}).length/N,over10=s.filter(function(v){return v>10;}).length/N;
      var qq=Math.pow(1-P.p,2);
      ro.innerHTML="1 つも失われないときの時間 = DHCP "+(P.reuse?"1":"2")+" 往復 + ARP 1 往復 + DNS + 接続 ≈ <b>"+F.time(base)+"</b>"+(P.acd?" + 重複の確認 4〜7 s":"")+"<br>"+
        "1 回の往復が成り立つ確率 q = (1 − p)<sup>2</sup> = "+U.sig(qq,4)+"、1 つの段の平均の試行回数 1/q = "+U.sig(1/qq,4)+"<br>"+
        "2000 回の試行: 平均 <b>"+F.time(mean)+"</b>・中央値 <b>"+F.time(med)+"</b>・95 % <b>"+F.time(p95)+"</b>・99 % "+F.time(q(s,0.99))+"・最大 "+F.time(s[N-1])+"<br>"+
        "1 秒を超えた試行 "+U.sig(over1*100,3)+" %、10 秒を超えた試行 "+U.sig(over10*100,3)+" %"+
        '<div class="wnote">段・期限・回数は本文の表のとおり（DHCP は RFC 2131 の間隔で全体 30 秒、ARP は 1 秒ごとに 3 回、DNS は 2 秒ごとに 4 回、接続は 10 秒まで）。接続の要求は、TCP が中で 1・2・4 秒と倍の間隔で送り直すものとした（10 章）。失敗した段の後の待ち時間は、0 秒から 2 秒・4 秒・…・64 秒までの一様な乱数（05 章 5 節）。往復の時間には ±20 % の揺らぎを入れた。リンクアップまでの時間（09 章）は含まない。値はすべて仮定である。</div>';
    }
    draw();
  };

  /* ===== END CHAPTER WIDGETS ===== */

  window.COMM=U;
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
