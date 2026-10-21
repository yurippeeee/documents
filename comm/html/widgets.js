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
  /* スライダー: o = {min, max, step, value, fmt(v)→文字列, log:true で対数目盛（値は有効数字 3 桁に丸める。o.snap(v) で丸め方を変えられる）, onInput(v)}
     返り値 {get(), set(v), input} 。log のときも get() は実際の値を返す。 */
  function slider(row,label,o){
    var c=mk("div","ctrl"); var lg=!!o.log;
    var mn=lg?Math.log10(o.min):o.min, mx=lg?Math.log10(o.max):o.max, st=lg?(o.step||0.001):(o.step||1);
    c.innerHTML='<label><span>'+label+'</span><b class="val"></b></label><input type="range">';
    var inp=c.querySelector("input"), val=c.querySelector(".val");
    inp.min=mn; inp.max=mx; inp.step=st;
    function raw2v(r){var v=lg?Math.pow(10,+r):+r; if(lg)v=o.snap?o.snap(v):+v.toPrecision(3); return v;}   /* 対数目盛は有効数字 3 桁に丸める */
    function show(){val.textContent=o.fmt?o.fmt(api.get()):String(api.get());}
    var api={input:inp,el:c,
      get:function(){return raw2v(inp.value);},
      set:function(v){inp.value=lg?Math.log10(v):v;show();}};
    inp.addEventListener("input",function(){show();if(o.onInput)o.onInput(api.get());});
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
