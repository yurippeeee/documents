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

  /* ===== 03 章 フレーミングと誤り検出 ===== */
  /* 本文の C と同じ計算（SLIP・COBS・チェックサム・CRC） */
  function _w03_slip(d){var o=[0xC0];d.forEach(function(b){if(b===0xC0)o.push(0xDB,0xDC);else if(b===0xDB)o.push(0xDB,0xDD);else o.push(b);});o.push(0xC0);return o;}
  function _w03_cobs(d){var out=[0],cp=0,code=1,n=d.length;
    for(var i=0;i<n;i++){var b=d[i];
      if(b===0){out[cp]=code;cp=out.length;out.push(0);code=1;}
      else{out.push(b);code++;if(code===0xFF){out[cp]=code;code=1;if(i+1===n)return out;cp=out.length;out.push(0);}}}
    out[cp]=code;return out;}
  /* COBS の列（区切りの 0 を除く）を戻す。形が壊れていれば null */
  function _w03_uncobs(e){var i=0,k=[],n=e.length;
    while(i<n){var c=e[i++];if(c===0||c-1>n-i)return null;
      for(var j=1;j<c;j++){if(e[i]===0)return null;k.push(e[i++]);}
      if(c!==0xFF&&i<n)k.push(0);}
    return k;}
  function _w03_sum8(d){var s=0;for(var i=0;i<d.length;i++)s=(s+d[i])&255;return s;}
  var _w03_T8=[],_w03_T16=[],_w03_T32=[];
  (function(){for(var i=0;i<256;i++){var a=i;for(var b=0;b<8;b++)a=(a&0x80)?((a<<1)^0x07)&255:(a<<1)&255;_w03_T8.push(a);
    var c=i<<8;for(b=0;b<8;b++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF;_w03_T16.push(c);
    var d=i;for(b=0;b<8;b++)d=(d&1)?((d>>>1)^0xEDB88320)>>>0:d>>>1;_w03_T32.push(d>>>0);}})();
  function _w03_crc8(d){var c=0;for(var i=0;i<d.length;i++)c=_w03_T8[c^d[i]];return c;}
  function _w03_crc16(d){var c=0xFFFF;for(var i=0;i<d.length;i++)c=((c<<8)^_w03_T16[((c>>8)^d[i])&255])&0xFFFF;return c;}
  function _w03_crc32(d){var c=0xFFFFFFFF;for(var i=0;i<d.length;i++)c=(c>>>8)^_w03_T32[(c^d[i])&255];return (c^0xFFFFFFFF)>>>0;}
  var _w03_M=[{n:"8 ビットの和",f:_w03_sum8,w:2},{n:"CRC-8",f:_w03_crc8,w:2},{n:"CRC-16",f:_w03_crc16,w:4},{n:"CRC-32",f:_w03_crc32,w:8}];
  function _w03_hx(v,w){return "0x"+("00000000"+(v>>>0).toString(16).toUpperCase()).slice(-w);}
  /* 16 進の文字列を読む。返り値 {b: バイトの配列, bad: 読めなかった部分} */
  function _w03_parseHex(s){var b=[],bad=[];String(s).replace(/0x/gi," ").split(/[\s,;:]+/).forEach(function(t){if(!t)return;
      if(!/^[0-9a-fA-F]+$/.test(t)){bad.push(t);return;}if(t.length%2)t="0"+t;for(var i=0;i<t.length;i+=2)b.push(parseInt(t.substr(i,2),16));});
    return {b:b,bad:bad};}

  /* ---- デモ 1: SLIP と COBS の符号化 ---- */
  REG.w03_stuff=function(el,U){
    var S=U.S;
    U.head(el,"STUFF","SLIP と COBS で置き換えたバイトの列");
    var row=U.ctrls(el);
    var tx=U.textin(row,"データ（16 進。空白で区切る）","11 22 00 33 C0 DB 44",draw,{width:"100%"});
    var br=U.btnrow(el),seed=1;
    function set(a){tx.set(a.map(function(v){return U.fmt.hex(v);}).join(" "));draw();}
    U.button(br,"本文の COBS の例",function(){set([0x11,0x22,0x00,0x33,0x00,0x00,0x44]);});
    U.button(br,"本文の SLIP の例",function(){set([0x01,0xC0,0x02,0xDB,0x03]);});
    U.button(br,"0xC0・0xDB だけ 20 バイト",function(){var a=[];for(var i=0;i<20;i++)a.push(i%2?0xDB:0xC0);set(a);});
    U.button(br,"0x00 だけ 20 バイト",function(){var a=[];for(var i=0;i<20;i++)a.push(0);set(a);});
    U.button(br,"0x00 を含まない 300 バイト",function(){var a=[];for(var i=0;i<300;i++)a.push(i%255+1);set(a);});
    U.button(br,"乱数 100 バイト（押すたびに変わる）",function(){var r=U.rng(seed++),a=[];for(var i=0;i<100;i++)a.push(r.int(256));set(a);});
    var hv=U.mk("div");hv.style.marginTop=".6rem";el.appendChild(hv);
    var box=U.svgbox(el,{scroll:true});box.el.style.marginTop=".7rem";
    var ro=U.readout(el);
    function lab(t){return '<div style="font-family:var(--mono);font-size:.74rem;color:var(--muted);margin:.55rem 0 .2rem">'+t+'</div>';}
    function draw(){
      var p=_w03_parseHex(tx.get()),d=p.b.slice(0,1000),warn="";
      if(p.bad.length)warn+='<span class="warn">16 進として読めない所を飛ばした: '+U.esc(p.bad.slice(0,3).join(" "))+'</span><br>';
      if(p.b.length>1000)warn+='<span class="warn">先頭の 1000 バイトだけを使う。</span><br>';
      var n=d.length,sl=_w03_slip(d),cb=_w03_cobs(d),co=cb.concat([0]);
      var k=d.filter(function(v){return v===0xC0||v===0xDB;}).length;
      /* SLIP の各バイトの色: END = gold、置き換えた 2 バイト（ESC とその次）= purple */
      var slc=[],esc=false;sl.forEach(function(v,i){if(i===0||i===sl.length-1){slc[i]="gold";return;}if(esc){slc[i]="purple";esc=false;return;}if(v===0xDB){slc[i]="purple";esc=true;return;}slc[i]=null;});
      /* COBS のコードバイトの位置 */
      var codes={},j=0;while(j<cb.length){codes[j]=1;var c=cb[j];j+=c;}
      var coc=co.map(function(v,i){return i===co.length-1?"gold":(codes[i]?"purple":null);});
      hv.innerHTML=lab("データ（"+n+" バイト）: 0x00 は青緑、0xC0・0xDB は紫")+U.hexView(d,function(i){return d[i]===0?"teal":(d[i]===0xC0||d[i]===0xDB?"purple":null);})+
        lab("SLIP（"+sl.length+" バイト、+"+(sl.length-n)+"）: END は金、置き換えた 2 バイトは紫")+U.hexView(sl,function(i){return slc[i];})+
        lab("COBS（区切りを含めて "+co.length+" バイト、+"+(co.length-n)+"）: コードバイトは紫、区切りの 00 は金")+U.hexView(co,function(i){return coc[i];});
      /* 短いときは、COBS のコードバイトが指す先を矢印で */
      if(n>=1&&n<=24){
        var cw=34,x0=12,y=62,W=Math.max(600,x0*2+co.length*cw),o=[];
        o.push(S.T(x0,18,"COBS の列: コードバイトの値だけ先へ飛ぶ（飛んだ先が、元のデータの 00 の位置）","start",11,"ink",true));
        co.forEach(function(v,i){var c=coc[i]||"line";o.push(S.RECT(x0+i*cw+2,y,cw-4,24,3,coc[i]?U.soft(coc[i]):"panel",c,1.2));o.push(S.T(x0+i*cw+cw/2,y+16,U.fmt.hex(v),"middle",11,"ink",!!coc[i],true));});
        var q=0;while(q<cb.length){var to=q+cb[q],xa=x0+q*cw+cw/2,xb=x0+to*cw+cw/2,h=Math.min(26,8+(to-q)*4);
          o.push(S.PATH("M"+xa+","+(y-2)+" Q"+((xa+xb)/2)+","+(y-2-2*h)+" "+(xb-2)+","+(y-4),"purple",1.4));
          o.push(S.head((xa+xb)/2,y-2-2*h,xb-2,y-4,"purple",6));
          o.push(S.T((xa+xb)/2,y-6-h,String(cb[q]),"middle",10,"purple",true));
          q=to;}
        box.el.style.display="";box.set(S.svg(W,y+34,o));
      }else{box.el.style.display="none";box.set("");}
      /* 元に戻せるか */
      var back=_w03_uncobs(cb),okC=back&&back.length===n&&back.every(function(v,i){return v===d[i];});
      var sb=[],e2=false;for(var i=1;i<sl.length-1;i++){var v=sl[i];if(e2){sb.push(v===0xDC?0xC0:0xDB);e2=false;}else if(v===0xDB)e2=true;else sb.push(v);}
      var okS=sb.length===n&&sb.every(function(v,i){return v===d[i];});
      var lim=n>=1?Math.ceil(n/254):1;
      ro.innerHTML=warn+"データ n = <b>"+n+"</b> バイト（うち 0xC0・0xDB が "+k+" 個、0x00 が "+d.filter(function(v){return v===0;}).length+" 個）<br>"+
        "SLIP: n + k + 2 = "+n+" + "+k+" + 2 = <b>"+sl.length+"</b> バイト（最悪 2n + 2 = "+(2*n+2)+"）・ 戻すと "+(okS?'<span class="ok">一致</span>':'<span class="warn">不一致</span>')+"<br>"+
        "COBS: <b>"+co.length+"</b> バイト = n + "+(cb.length-n)+"（増える量）+ 1（区切り）・ 増える量の上限 ⌈n/254⌉ = "+lim+" ・ 戻すと "+(okC?'<span class="ok">一致</span>':'<span class="warn">不一致</span>');
    }
    draw();
  };

  /* ---- デモ 2: 1 バイトが壊れたとき、何フレームを失うか ---- */
  REG.w03_resync=function(el,U){
    var S=U.S;
    var PAY=[[0x01,0x17,0x2D,0x64],[0x02,0xC0,0x00,0x63],[0x03,0xAA,0x55,0x10],[0x04,0x18,0xDB,0x64]];
    U.head(el,"RESYNC","1 バイトが壊れたとき、受け手は何フレームを失うか");
    var row=U.ctrls(el);
    var md=U.seg(row,["SLIP","COBS","長さフィールド"],0,function(){clampPos();draw();});
    var row2=U.ctrls(el);
    var ev=U.select(row2,"起きること",["何も起きない","1 バイトを書き換える","1 バイトが失われる","途中から聞き始める"],1,draw);
    var how=U.select(row2,"書き換え方",["ビット 0 を反転（XOR 0x01）","ビット 3 を反転（XOR 0x08）","ビット 6 を反転（XOR 0x40）","0x00 にする","0xC0 にする","0xAA にする"],2,draw);
    var row3=U.ctrls(el);
    var pos=U.slider(row3,"位置（何バイト目か。0 から数える）",{min:0,max:40,step:1,value:2,fmt:function(v){return String(v);},onInput:draw});
    var row4=U.ctrls(el);
    var cMax=U.checkbox(row4,"長さの上限（16）を確かめる",true,draw);
    var cHdr=U.checkbox(row4,"ヘッダの CRC を付ける",false,draw);
    var cRes=U.checkbox(row4,"捨てたら同期パターンの次から探し直す",false,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    /* フレームを作る。返り値 {s: バイト, role: 役割, fr: どのメッセージか} */
    function build(m){
      var s=[],role=[],fr=[];
      PAY.forEach(function(p,k){
        if(m===2){var body=[p.length].concat(p),c=_w03_crc16(body);
          var f=[0xAA,0x55,p.length],r=["y","y","l"];
          if(cHdr.get()){f.push(_w03_crc8([0xAA,0x55,p.length]));r.push("h");}
          p.forEach(function(v){f.push(v);r.push("p");});f.push(c>>8,c&255);r.push("c","c");
          f.forEach(function(v,i){s.push(v);role.push(r[i]);fr.push(k);});return;}
        var c2=_w03_crc16(p),src=p.concat([c2>>8,c2&255]),srole=["p","p","p","p","c","c"];
        if(m===0){s.push(0xC0);role.push("y");fr.push(k);
          src.forEach(function(v,i){if(v===0xC0||v===0xDB){s.push(0xDB,v===0xC0?0xDC:0xDD);role.push("e","e");fr.push(k,k);}else{s.push(v);role.push(srole[i]);fr.push(k);}});
          s.push(0xC0);role.push("y");fr.push(k);}
        else{var e=_w03_cobs(src),cs={},j=0;while(j<e.length){cs[j]=1;j+=e[j];}
          var si=0;e.forEach(function(v,i){s.push(v);fr.push(k);if(cs[i]){role.push("e");if(i>0)si++;}else{role.push(srole[si]);si++;}});
          s.push(0);role.push("y");fr.push(k);}
      });
      return {s:s,role:role,fr:fr};
    }
    function clampPos(){var b=build(md.get());pos.input.max=b.s.length-1;if(pos.get()>b.s.length-1)pos.set(b.s.length-1);}
    /* 受け手。返り値 [{a: 始まり, b: 終わり（含む）, k: 種類, t: 説明, p: 渡したペイロード}] （a, b は届いた列の位置） */
    function rxSlip(r){var out=[],buf=[],esc=false,bad=false,st=0;
      for(var i=0;i<r.length;i++){var c=r[i];
        if(c===0xC0){if(buf.length&&!bad&&!esc)out.push(check(st,i,buf));else if(buf.length||bad||esc)out.push({a:st,b:i,k:"x",t:"規則にない並びで捨てた"});
          buf=[];esc=false;bad=false;st=i+1;continue;}
        if(esc){esc=false;if(c===0xDC)buf.push(0xC0);else if(c===0xDD)buf.push(0xDB);else bad=true;}
        else if(c===0xDB)esc=true;else buf.push(c);}
      if(st<r.length)out.push({a:st,b:r.length-1,k:"w",t:"END が来ないまま終わった（待つ時間の上限で捨てる）"});
      return out;}
    function rxCobs(r){var out=[],st=0;
      for(var i=0;i<r.length;i++){if(r[i]!==0)continue;
        if(i>st){var d=_w03_uncobs(r.slice(st,i));out.push(d?check(st,i,d):{a:st,b:i,k:"x",t:"コードバイトが壊れていて戻せない"});}
        st=i+1;}
      if(st<r.length)out.push({a:st,b:r.length-1,k:"w",t:"00 が来ないまま終わった（待つ時間の上限で捨てる）"});
      return out;}
    function check(a,b,d){if(d.length<3)return {a:a,b:b,k:"x",t:"短すぎるので捨てた"};
      var p=d.slice(0,d.length-2),c=_w03_crc16(p);
      if((c>>8)===d[d.length-2]&&(c&255)===d[d.length-1])return {a:a,b:b,k:"ok",t:"CRC が合った",p:p};
      return {a:a,b:b,k:"x",t:"CRC が合わず捨てた"};}
    function rxLen(r){var out=[],i=0,hdr=cHdr.get()?1:0,MAX=16,n=r.length;
      while(i<n){var j=-1;for(var q=i;q+1<n;q++)if(r[q]===0xAA&&r[q+1]===0x55){j=q;break;}
        if(j<0){if(i<n)out.push({a:i,b:n-1,k:"s",t:"同期パターンが無いので読み捨てた"});break;}
        if(j>i)out.push({a:i,b:j-1,k:"s",t:"同期パターンを探して読み捨てた"});
        if(j+2>=n){out.push({a:j,b:n-1,k:"w",t:"途中で終わった（待つ時間の上限で捨てる）"});break;}
        var L=r[j+2];
        if(hdr){if(j+3>=n){out.push({a:j,b:n-1,k:"w",t:"途中で終わった（待つ時間の上限で捨てる）"});break;}
          if(_w03_crc8([0xAA,0x55,L])!==r[j+3]){out.push({a:j,b:j+3,k:"x",t:"ヘッダの CRC が合わず捨てた"});i=j+1;continue;}}
        if(cMax.get()&&L>MAX){out.push({a:j,b:j+2+hdr,k:"x",t:"長さ "+L+" が上限 16 を超えるので捨てた"});i=j+1;continue;}
        var end=j+3+hdr+L+2;
        if(end>n){out.push({a:j,b:n-1,k:"w",t:"長さ "+L+" の分が届かないまま終わった（待つ時間の上限で捨てる）"});
          if(cRes.get()){i=j+1;continue;}break;}
        var body=[L].concat(r.slice(j+3+hdr,j+3+hdr+L)),c=_w03_crc16(body);
        if((c>>8)===r[end-2]&&(c&255)===r[end-1]){out.push({a:j,b:end-1,k:"ok",t:"CRC が合った",p:body.slice(1)});i=end;}
        else{out.push({a:j,b:end-1,k:"x",t:"CRC が合わず捨てた"});i=cRes.get()?j+1:end;}}
      return out;}
    function draw(){
      var m=md.get(),B=build(m),s=B.s,N=s.length,e=ev.get(),P=Math.min(pos.get(),N-1),mask=[0x01,0x08,0x40][how.get()];
      var lenOpt=(m===2);[cMax,cHdr,cRes].forEach(function(c){c.el.style.opacity=lenOpt?1:0.4;c.input.disabled=!lenOpt;});
      how.el.style.opacity=e===1?1:0.4;how.input.disabled=e!==1;
      /* 届いた列: map[届いた位置] = 送った位置 */
      var recv=[],map=[],newv=null;
      for(var i=0;i<N;i++){
        if(e===2&&i===P)continue;
        if(e===3&&i<P)continue;
        var v=s[i];
        if(e===1&&i===P){v=how.get()<3?(v^mask):[0x00,0xC0,0xAA][how.get()-3];newv=v;}
        recv.push(v);map.push(i);}
      var res=m===0?rxSlip(recv):m===1?rxCobs(recv):rxLen(recv);
      /* 描く */
      var cw=24,x0=14,y1=50,o=[],W=x0*2+N*cw;
      var col={y:"gold",l:"purple",h:"teal",p:"signal",c:"green",e:"purple"};
      var names=["メッセージ 1","メッセージ 2","メッセージ 3","メッセージ 4"];
      for(var k=0;k<4;k++){var a=B.fr.indexOf(k),b=B.fr.lastIndexOf(k);
        o.push(S.W([x0+a*cw+3,y1-6,x0+a*cw+3,y1-11,x0+(b+1)*cw-3,y1-11,x0+(b+1)*cw-3,y1-6],"faint",1.1));
        o.push(S.T(x0+(a+b+1)*cw/2,y1-16,names[k],"middle",10,"ink",true));}
      o.push(S.T(x0,14,"送った列","start",10,"muted",true));
      s.forEach(function(v,i){var c=col[B.role[i]];o.push(S.RECT(x0+i*cw+1,y1,cw-2,22,3,U.soft(c),c,1.1));o.push(S.T(x0+i*cw+cw/2,y1+15,U.fmt.hex(v),"middle",9.5,"ink",false,true));});
      var y2=y1+56;
      o.push(S.T(x0,y2-10,"受け手に届いた列（位置は送った列にそろえた）","start",10,"muted",true));
      for(i=0;i<N;i++){var ri=map.indexOf(i),xx=x0+i*cw;
        if(ri<0){if(e===2&&i===P){o.push(S.RECT(xx+1,y2,cw-2,22,3,"none","alias",1.2,"3 3"));o.push(S.X(xx+cw/2,y2+11,5,"alias",1.6));}
          else{o.push(S.RECT(xx+1,y2,cw-2,22,3,"none","faint",1,"2 3"));}continue;}
        var bad=(e===1&&i===P),c2=bad?"alias":col[B.role[i]];
        o.push(S.RECT(xx+1,y2,cw-2,22,3,U.soft(c2),c2,bad?2:1.1));o.push(S.T(xx+cw/2,y2+15,U.fmt.hex(recv[ri]),"middle",9.5,bad?"alias":"ink",bad,true));}
      /* 受け手の動き（括弧）。重ならないように段を分ける */
      var lv=[],y3=y2+58,got={},wrong=0;
      o.push(S.T(x0,y3-16,"受け手が切り出したもの（✓ = CRC が合って渡した、× = 捨てた、灰色 = 同期パターンを探して読み捨てた）","start",10,"muted",true));
      res.forEach(function(r){var xa=x0+map[r.a]*cw+2,xb=x0+(map[r.b]+1)*cw-2,L=0;
        while(lv[L]!=null&&lv[L]>xa-1)L++;lv[L]=xb;
        var c=r.k==="ok"?"green":(r.k==="s"?"faint":(r.k==="w"?"gold":"alias")),yy=y3+L*34;
        o.push(S.W([xa,yy-5,xa,yy,xb,yy,xb,yy-5],c,1.5));
        var t=r.k==="ok"?"✓":(r.k==="s"?"":"×");
        if(r.k==="ok"){var idx=-1;PAY.forEach(function(p,k){if(p.length===r.p.length&&p.every(function(v,q){return v===r.p[q];}))idx=k;});
          if(idx>=0){got[idx]=1;t="✓ "+(idx+1);}else{wrong++;t="✓? 送っていない内容";c="alias";}}
        o.push(S.T((xa+xb)/2,yy+13,t,"middle",10,c,true));});
      var H=y3+Math.max(1,lv.length)*34+8;
      box.set(S.svg(W,H,o));
      var lost=[];for(k=0;k<4;k++)if(!got[k])lost.push(k+1);
      var lines=res.map(function(r){var a=map[r.a],b=map[r.b];return "位置 "+a+"〜"+b+": "+(r.k==="ok"?'<span class="ok">'+r.t+"</span>":(r.k==="s"?r.t:'<span class="warn">'+r.t+"</span>"));});
      var what=e===0?"何も起きていない":(e===1?"位置 "+P+" の "+U.fmt.hex(s[P])+" が "+U.fmt.hex(newv)+" に変わった":(e===2?"位置 "+P+" の "+U.fmt.hex(s[P])+" が失われた":"位置 "+P+" から聞き始めた"));
      ro.innerHTML=what+" ・ 受け取ったメッセージ <b>"+(4-lost.length)+" / 4</b>"+(lost.length?'（<span class="warn">失った: '+lost.join("・")+"</span>）":' <span class="ok">すべて受け取った</span>')+
        (wrong?' ・ <span class="warn">CRC が偶然合った誤ったフレームがある</span>':"")+"<br>"+lines.join("<br>");
    }
    clampPos();draw();
  };

  /* ---- デモ 3: チェックサムと CRC が誤りに気づくか ---- */
  REG.w03_detect=function(el,U){
    var S=U.S;
    U.head(el,"DETECT","誤りを入れて、チェックサムと CRC が気づくかを試す");
    var row=U.ctrls(el);
    var tx=U.textin(row,"データ（文字）","TEMP=23.45;HUM=45",function(){shot();},{width:"100%"});
    var row2=U.ctrls(el);
    var KIND=["1 ビットの反転","2 ビットの反転（ばらばらの位置）","3 ビットの反転","長さ b のバースト","2 バイトの入れ替え","打ち消し合う 2 ビット（同じ桁を逆向きに）"];
    var kd=U.select(row2,"誤りの形",KIND,1,function(){upd();shot();});
    var bl=U.slider(row2,"バーストの長さ b",{min:2,max:48,step:1,value:12,fmt:function(v){return v+" ビット";},onInput:function(){shot();}});
    var br=U.btnrow(el),seed=7,mcSeed=1;
    U.button(br,"誤りを入れる（別の乱数で）",function(){seed++;shot();});
    U.button(br,"1 万回試す",function(){mc();});
    var hv=U.mk("div");el.appendChild(hv);
    var tb=U.mk("div");el.appendChild(tb);
    var box=U.svgbox(el);box.el.style.marginTop=".7rem"; var ro=U.readout(el);
    var last=null;
    function upd(){var b=kd.get()===3;bl.el.style.opacity=b?1:0.4;bl.input.disabled=!b;}
    function bytesOf(s){var a=[];try{a=Array.prototype.slice.call(new TextEncoder().encode(s));}catch(e){for(var i=0;i<s.length;i++)a.push(s.charCodeAt(i)&255);}return a.slice(0,64);}
    /* d に誤りを入れた列を返す（ビットは各バイトを MSB から並べた順番で数える）。入れられなければ null */
    function corrupt(d,k,b,r){var f=d.slice(),nb=d.length*8;
      function fl(i){f[i>>3]^=0x80>>(i&7);}
      if(k<=2){var need=k+1;if(nb<need)return null;var used={};for(var q=0;q<need;q++){var x;do x=r.int(nb);while(used[x]);used[x]=1;fl(x);}return f;}
      if(k===3){var L=Math.min(b,nb);if(L<2)return null;var st=r.int(nb-L+1);fl(st);fl(st+L-1);for(var j=st+1;j<st+L-1;j++)if(r.next()<0.5)fl(j);return f;}
      /* 入れ替えと打ち消し合う 2 ビットは、条件に合う組を乱数で探す（見つからなければ null） */
      for(var tries=0;tries<2000;tries++){var a=r.int(d.length),c=r.int(d.length);if(a===c)continue;
        if(k===4){if(d[a]===d[c])continue;var t=f[a];f[a]=f[c];f[c]=t;return f;}
        var bit=r.int(8);if(((d[a]>>bit)&1)||!((d[c]>>bit)&1))continue;f[a]^=1<<bit;f[c]^=1<<bit;return f;}
      return null;}
    function shot(){
      var d=bytesOf(tx.get()),k=kd.get(),r=U.rng(seed*7919+k);
      if(d.length<2){hv.innerHTML='<div class="wnote">2 文字以上を入れてほしい。</div>';return;}
      var f=corrupt(d,k,bl.get(),r);
      if(!f){hv.innerHTML='<div class="wnote">このデータには、この形の誤りを入れられない（同じ値のバイトばかり、など）。</div>';last=null;show();return;}
      var ch=function(i){return f[i]!==d[i]?"alias":null;};
      var bits=[];d.forEach(function(v,i){if(f[i]!==v)bits.push("位置 "+i+": "+("0000000"+v.toString(2)).slice(-8)+" → "+("0000000"+f[i].toString(2)).slice(-8));});
      hv.innerHTML='<div class="wnote">送ったデータ（'+d.length+' バイト）</div>'+U.hexView(d,null)+'<div class="wnote">届いたデータ（変わったバイトは赤）</div>'+U.hexView(f,ch)+
        '<div class="wnote" style="font-family:var(--mono)">'+bits.slice(0,6).join("<br>")+(bits.length>6?"<br>…":"")+'</div>';
      last={rows:_w03_M.map(function(M){var a=M.f(d),b=M.f(f);return [M.n,_w03_hx(a,M.w),_w03_hx(b,M.w),a===b?'<b style="color:var(--alias)">見逃した</b>':'<b style="color:var(--green)">気づいた</b>'];})};
      show();
    }
    var mcRes=null;
    function mc(){
      var n=Math.max(2,bytesOf(tx.get()).length),k=kd.get(),b=bl.get(),N=10000,r=U.rng(1000+mcSeed++),miss=[0,0,0,0],tried=0;
      for(var t=0;t<N;t++){var d=[];for(var i=0;i<n;i++)d.push(r.int(256));var f=corrupt(d,k,b,r);if(!f)continue;tried++;
        for(var m=0;m<4;m++)if(_w03_M[m].f(d)===_w03_M[m].f(f))miss[m]++;}
      mcRes={miss:miss,tried:tried,n:n,k:k,b:b};show();
    }
    function show(){
      tb.innerHTML=last?U.tbl(["方法","送り手が付けた値","受け手が計算した値","判定"],last.rows,["left","left","left","left"]):"";
      var o=[],W=700;
      if(mcRes){var p=U.plot(150,30,400,120,[1e-5,1],[0,4],{xlog:true});
        o.push(S.T(20,18,"見逃した割合（"+mcRes.tried+" 回。データ "+mcRes.n+" バイト、誤りの形: "+KIND[mcRes.k]+(mcRes.k===3?"、b = "+mcRes.b:"")+"）","start",10.5,"ink",true));
        [1e-5,1e-4,1e-3,1e-2,0.1,1].forEach(function(v){var x=p.X(v);o.push(S.L(x,30,x,150,"grid",1));o.push(S.T(x,166,v>=0.01?(v*100)+" %":(v*100).toPrecision(1)+" %","middle",9,"muted"));});
        _w03_M.forEach(function(M,m){var y=34+m*29,v=mcRes.miss[m]/Math.max(1,mcRes.tried),c=v===0?"green":(v>=0.01?"alias":"gold");
          o.push(S.T(142,y+15,M.n,"end",10.5,"ink",true));
          if(v>0){var x=p.X(Math.max(v,1e-5));o.push(S.RECT(150,y+2,x-150,18,3,U.soft(c),c,1.1));o.push(S.T(x+6,y+15,mcRes.miss[m]+" 回（"+U.sig(v*100,2)+" %）","start",10,c,true));}
          else o.push(S.T(156,y+15,"0 回（一度も見逃さなかった）","start",10,"green",true));});
        o.push(S.T(20,190,"誤りの形がでたらめなときの目安: 8 ビットの値なら 1/256 ≈ 0.39 %、16 ビットなら 1/65536 ≈ 0.0015 %（1 万回では 0 回が多い）","start",9.5,"muted"));
        box.el.style.display="";box.set(S.svg(W,200,o));
      }else{box.el.style.display="none";}
      ro.innerHTML=mcRes?"同じ形の誤りを 1 万回入れたとき、4 つの方法が見逃した回数（上のグラフ）。「1 万回試す」をもう一度押すと、別の乱数で試す。":"「1 万回試す」を押すと、データを毎回乱数で作って同じ形の誤りを 1 万回入れ、見逃した割合のグラフが表示される。";
    }
    upd();shot();
  };

  /* ---- デモ 4: TLV の組み立てと、壊れた列の解析 ---- */
  REG.w03_tlv=function(el,U){
    var S=U.S;
    U.head(el,"TLV","TLV を組み立て、壊れた列を 2 つの解析で読む");
    var row=U.ctrls(el);
    var iT=U.checkbox(row,"温度（型 01）",true,draw),iH=U.checkbox(row,"湿度（型 02）",true,draw),iB=U.checkbox(row,"電池（型 03）",true,draw),iU=U.checkbox(row,"新しい型 20（3 バイト）",false,draw);
    var row2=U.ctrls(el);
    var tC=U.slider(row2,"温度",{min:-40,max:60,step:0.05,value:23.45,fmt:function(v){return v.toFixed(2)+" °C";},onInput:draw});
    var hP=U.slider(row2,"湿度",{min:0,max:100,step:1,value:45,fmt:function(v){return v+" %";},onInput:draw});
    var bV=U.slider(row2,"電池",{min:2000,max:4200,step:10,value:3700,fmt:function(v){return v+" mV";},onInput:draw});
    var row3=U.ctrls(el);
    var bk=U.select(row3,"壊し方",["壊さない","2 つ目の項目の長さを 0x41 にする","1 つ目の項目の長さを 1 増やす","1 つ目の項目の長さを 0xFF にする","最後の 3 バイトが届かない"],1,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function items(){var a=[],t=Math.round(tC.get()*100);t=Math.max(-32768,Math.min(32767,t));var u=t&0xFFFF;
      if(iT.get())a.push({t:1,v:[u&255,u>>8],n:"温度"});
      if(iU.get())a.push({t:0x20,v:[0xAA,0xBB,0xCC],n:"新しい型"});
      if(iH.get())a.push({t:2,v:[hP.get()],n:"湿度"});
      if(iB.get()){var b=bV.get();a.push({t:3,v:[b&255,b>>8],n:"電池"});}
      return a;}
    function meaning(t,v){
      if(t===1&&v.length===2){var u=v[0]|(v[1]<<8),s=u>=0x8000?u-0x10000:u;return "温度 "+(s/100).toFixed(2).replace("-","−")+" °C";}
      if(t===2&&v.length===1)return "湿度 "+v[0]+" %";
      if(t===3&&v.length===2)return "電池 "+(v[0]|(v[1]<<8))+" mV";
      if(t>=1&&t<=3)return '<span class="warn">型 '+U.fmt.hex(t)+" なのに長さ "+v.length+"（型の決まりと違う → -1）</span>";
      return "型 "+U.fmt.hex(t)+"（知らない型なので読み飛ばす）";}
    function draw(){
      var it=items(),buf=[],role=[];
      it.forEach(function(x){buf.push(x.t,x.v.length);role.push(x.t>3?"u":"t",x.t>3?"u":"l");x.v.forEach(function(b){buf.push(b);role.push(x.t>3?"u":"v");});});
      var b=bk.get(),badAt=-1;
      if(b===1){var off=0;if(it.length>=2){off=2+it[0].v.length;buf[off+1]=0x41;badAt=off+1;}}
      if(b===2&&it.length){buf[1]=buf[1]+1;badAt=1;}
      if(b===3&&it.length){buf[1]=0xFF;badAt=1;}
      if(b===4){buf=buf.slice(0,Math.max(0,buf.length-3));role=role.slice(0,buf.length);}
      var n=buf.length;
      /* 長さを確かめる解析（tlv_next と sensor_parse） */
      var good=[],i=0,stop="",gEnd=0;
      while(true){if(i===n){stop='<span class="ok">最後まで読めた（0）</span>';break;}
        if(n-i<2){stop='<span class="warn">位置 '+i+" で止めた（-1）: 型と長さの 2 バイトが無い</span>";break;}
        var L=buf[i+1];if(L>n-i-2){stop='<span class="warn">位置 '+i+" で止めた（-1）: 長さ "+L+" が残り "+(n-i-2)+" バイトを越える</span>";break;}
        var v=buf.slice(i+2,i+2+L),mm=meaning(buf[i],v);good.push({a:i,b:i+1+L,m:mm});
        if(/-1/.test(mm)){stop='<span class="warn">型の決まりと違う長さなので止めた（-1）</span>';break;}
        i+=2+L;}
      gEnd=i;
      /* 長さを確かめない解析 */
      var naive=[],j=0,out=null;
      while(j<n){var Lb=(j+1<n)?buf[j+1]:null;
        if(Lb===null){out={a:j+1,b:j+1};naive.push({a:j,b:j+1,m:"長さを配列の外から読んだ"});break;}
        var e=j+1+Lb;naive.push({a:j,b:e,m:e>=n?"値の途中から配列の外":meaning(buf[j],buf.slice(j+2,j+2+Lb))});
        if(e>=n){out={a:n,b:e};break;}j=e+1;}
      /* 描く */
      var cw=28,x0=14,y=34,ext=out?Math.min(out.b-n+1,24):0,W=x0*2+(n+ext+1)*cw,o=[];
      var col={t:"signal",l:"purple",v:"green",u:"muted"};
      o.push(S.T(x0,20,"届いた列（"+n+" バイト）","start",10.5,"ink",true));
      buf.forEach(function(v,k){var bad=(k===badAt),c=bad?"alias":col[role[k]];o.push(S.RECT(x0+k*cw+1,y,cw-2,22,3,U.soft(c),c,bad?2:1.1));o.push(S.T(x0+k*cw+cw/2,y+15,U.fmt.hex(v),"middle",10,bad?"alias":"ink",bad,true));});
      for(var q=n;q<n+ext;q++){o.push(S.RECT(x0+q*cw+1,y,cw-2,22,3,"none","faint",1,"2 3"));o.push(S.T(x0+q*cw+cw/2,y+15,"??","middle",9.5,"faint",false,true));}
      if(ext)o.push(S.T(x0+(n+ext/2)*cw,y+40,"配列の外（ほかの変数などの場所）","middle",9.5,"alias"));
      o.push(S.L(x0+n*cw,y-8,x0+n*cw,y+30,"alias",1.2,"4 3"));
      function brs(list,yy,c,title){o.push(S.T(x0,yy-10,title,"start",10,c,true));
        list.forEach(function(g){var xa=x0+g.a*cw+2,xb=x0+(Math.min(g.b,n+ext-1)+1)*cw-2;o.push(S.W([xa,yy-4,xa,yy,xb,yy,xb,yy-4],g.b>=n?"alias":c,1.5));});}
      brs(good,y+72,"green","長さを確かめる解析");
      if(gEnd<n)o.push(S.T(x0+gEnd*cw+cw/2,y+88,"ここで止める","middle",9.5,"green",true));
      brs(naive,y+122,"alias","長さを確かめない解析");
      box.set(S.svg(W,y+136,o));
      ro.innerHTML="<b>長さを確かめる解析</b>: "+(good.length?good.map(function(g){return g.m;}).join("、"):"（読めた項目なし）")+" → "+stop+"<br>"+
        "<b>長さを確かめない解析</b>: "+naive.map(function(g){return g.m;}).join("、")+(out?' → <span class="warn">配列の外を '+(out.b-out.a+1)+" バイト読んだ（C なら、ほかの変数の値を読むか、例外で止まる）</span>":' → <span class="ok">配列の外は読まなかった</span>');
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

  /* ===== 09 章 Wi-Fi ===== */
  function _w09_fc(n){return 2407+5*n;}                       /* チャネル n の中心の周波数 [MHz] */
  function _w09_sig(v){return String(+v.toPrecision(3));}
  function _w09_life(h){var d=h/24;return d>=730?_w09_sig(d/365)+" 年":(d>=2?Math.round(d)+" 日":_w09_sig(h)+" 時間");}

  /* ---- 1 節: チャネルの重なり ---- */
  REG.w09_channels=function(el,U){
    var S=U.S;
    U.head(el,"CHANNELS","2.4 GHz 帯のチャネルの重なり");
    var chs=[];for(var n=1;n<=13;n++)chs.push({v:String(n),t:n+"（"+_w09_fc(n)+" MHz）"});
    var none=[{v:"0",t:"なし"}].concat(chs);
    var row=U.ctrls(el);
    var me=U.select(row,"自分の家の AP",chs,"6",draw);
    var a1=U.select(row,"近くの AP 1",none,"1",draw);
    var a2=U.select(row,"近くの AP 2",none,"3",draw);
    var row2=U.ctrls(el);
    var wd=U.select(row2,"自分の AP の信号の幅",[{v:"20",t:"20 MHz（802.11g・n）"},{v:"22",t:"22 MHz（802.11b）"},{v:"40",t:"40 MHz（802.11n、2 チャネル分）"}],"20",draw);
    var br=U.btnrow(el);
    function ex(m,x,y,w){me.set(String(m));a1.set(String(x));a2.set(String(y));wd.set(String(w));draw();}
    U.button(br,"1・6・11 に分ける",function(){ex(6,1,11,20);});
    U.button(br,"一部が重なる",function(){ex(6,1,3,20);});
    U.button(br,"同じチャネルを分け合う",function(){ex(6,6,11,20);});
    U.button(br,"自分だけ 40 MHz にする",function(){ex(6,1,11,40);});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* 信号の中心と幅。40 MHz は、主のチャネルの上か下の 20 MHz を足す（ここでは 7 以下なら上） */
    function sg(ch,w){var f=_w09_fc(ch);if(w===40)f+=ch<=7?10:-10;return {ch:ch,f:f,w:w,lo:f-w/2,hi:f+w/2};}
    function rel(a,b){if(a.ch===b.ch)return "same";return Math.abs(a.f-b.f)<(a.w+b.w)/2-1e-9?"over":"none";}
    var TXT={same:'<b style="color:var(--green)">同じチャネル</b>: 互いの送信を聞き取って待ち合い、時間を分け合う',
             over:'<span class="warn">一部が重なる</span>: 相手の信号が雑音として届き、フレームが壊れやすい',
             none:'<span class="ok">重ならない</span>: 互いに影響しない（信号の裾の分を除く）'};
    function draw(){
      var w=+wd.get(),m=sg(+me.get(),w),nb=[];
      [[a1,"近くの AP 1","purple"],[a2,"近くの AP 2","teal"]].forEach(function(q){var c=+q[0].get();if(c>0)nb.push({s:sg(c,20),name:q[1],col:q[2]});});
      var W=700,o=[],p=U.plot(40,40,640,150,[2398,2496],[0,1]),yb=190,yt=80;
      o.push(S.RECT(p.X(2400),30,p.X(2483.5)-p.X(2400),yb-30,0,"var(--muted-soft)","none",0));
      o.push(S.T(p.X(2400)+4,46,"2.4 GHz 帯","start",9.5,"muted"));
      for(var k=1;k<=13;k++){var x=p.X(_w09_fc(k));o.push(S.L(x,yb,x,yb+4,"muted",1));o.push(S.T(x,yt-26,String(k),"middle",10,"muted",false,true));}
      o.push(S.L(p.X(2398),yb,p.X(2496),yb,"muted",1.2));
      [2400,2420,2440,2460,2480].forEach(function(f){o.push(S.T(p.X(f),yb+16,String(f),"middle",9.5,"muted"));});
      o.push(S.T(p.X(2496),yb+32,"周波数 [MHz]","end",9.5,"muted"));
      function hump(s,c,y,lw){var e=Math.min(2,s.w*0.12);return S.PL([[p.X(s.lo),yb],[p.X(s.lo+e),y],[p.X(s.hi-e),y],[p.X(s.hi),yb]],c,lw,U.soft(c),null,0.45);}
      nb.forEach(function(q,i){o.push(hump(q.s,q.col,yt+14+i*14,1.6));});
      o.push(hump(m,"gold",yt,2.4));
      /* 重なりの範囲 */
      nb.forEach(function(q){if(rel(m,q.s)==="over"){var lo=Math.max(m.lo,q.s.lo),hi=Math.min(m.hi,q.s.hi);
        o.push(S.RECT(p.X(lo),yb-12,p.X(hi)-p.X(lo),12,1,U.soft("alias"),"alias",1.2));}});
      var lx=60;
      [[ "自分の AP（"+m.ch+(w===40?(m.ch<=7?"+上":"+下"):"")+"、"+w+" MHz）","gold"]].concat(nb.map(function(q){return [q.name+"（"+q.s.ch+"）",q.col];})).forEach(function(L){
        o.push(S.RECT(lx,yb+40,10,10,2,U.soft(L[1]),L[1],1.2));o.push(S.T(lx+15,yb+49,L[0],"start",10,L[1],true));lx+=U.tw(L[0],10)+40;});
      o.push(S.RECT(lx,yb+40,10,10,2,U.soft("alias"),"alias",1.2));o.push(S.T(lx+15,yb+49,"一部が重なる範囲","start",10,"alias",true));
      box.set(S.svg(W,yb+60,o));
      var rows=nb.map(function(q){return ["自分の AP と "+q.name,TXT[rel(m,q.s)]];});
      if(nb.length===2)rows.push(["近くの AP 1 と 2",TXT[rel(nb[0].s,nb[1].s)]]);
      /* 自分の AP に選ぶとよいチャネル */
      var good=[],ok=[];
      for(var c=1;c<=13;c++){var s=sg(c,w),ov=0,same=0;nb.forEach(function(q){var r=rel(s,q.s);if(r==="over")ov++;if(r==="same")same++;});
        if(!ov&&!same)good.push(c);else if(!ov)ok.push(c);}
      ro.innerHTML=(rows.length?U.tbl(["組","関係"],rows):"近くの AP は無い。")+
        "近くの AP と重ならないチャネル（この幅で）: <b>"+(good.length?good.join("・"):"なし")+"</b>"+
        (ok.length?" ・ 一部は重ならず、同じチャネルを分け合うもの: <b>"+ok.join("・")+"</b>":"")+
        (w===40?'<div class="wnote">40 MHz の信号は 2.4 GHz 帯の 83.5 MHz の半分ほどを占めるので、近くに AP があると、ほとんどの選び方で重なる。</div>':
         '<div class="wnote">20 MHz 幅の信号どうしは、中心が 20 MHz 以上（番号の差が 4 以上）離れていれば重ならない。22 MHz 幅の 802.11b を含めるなら差を 5 以上にする。台形は簡単にした形で、実際の信号の裾はもっと広い。</div>');
    }
    draw();
  };

  /* ---- 2 節: スキャン ---- */
  var _w09_APS=[{s:"home",b:"00:00:5E:00:53:A0",ch:6,r:-52},{s:"home-guest",b:"00:00:5E:00:53:A1",ch:6,r:-53},
    {s:"home",b:"00:00:5E:00:53:B0",ch:11,r:-71},{s:"next-door",b:"00:00:5E:00:53:C0",ch:1,r:-80},{s:"",b:"00:00:5E:00:53:D0",ch:11,r:-86,hid:true}];
  REG.w09_scan=function(el,U){
    var S=U.S;
    U.head(el,"SCAN","スキャンにかかる時間と、見つかる AP");
    var row=U.ctrls(el);
    var md=U.seg(row,["パッシブ","アクティブ","前回のチャネル 6 だけ（アクティブ）"],0,draw);
    var row1=U.ctrls(el);
    var nc=U.slider(row1,"調べるチャネル",{min:1,max:13,step:1,value:13,fmt:function(v){return "1〜"+v;},onInput:draw});
    var bi=U.select(row1,"ビーコン間隔",[{v:"50",t:"50 TU（51.2 ms）"},{v:"100",t:"100 TU（102.4 ms）"},{v:"200",t:"200 TU（204.8 ms）"}],"100",draw);
    var row2=U.ctrls(el);
    var td=U.slider(row2,"パッシブの待ち時間 t_d",{min:10,max:300,step:0.2,value:104.4,fmt:function(v){return v.toFixed(1)+" ms";},onInput:draw});
    var mn=U.slider(row2,"アクティブの最小",{min:5,max:60,step:1,value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var mx=U.slider(row2,"アクティブの最大",{min:10,max:120,step:1,value:40,fmt:function(v){return v+" ms";},onInput:draw});
    var row3=U.ctrls(el);
    var pl=U.slider(row3,"フレームが失われる確率",{min:0,max:60,step:1,value:0,fmt:function(v){return v+" %";},onInput:draw});
    var seed=1,br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例の値に戻す",function(){md.set(0);nc.set(13);bi.set("100");td.set(104.4);mn.set(20);mx.set(40);pl.set(0);seed=1;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var TB_=2,TS=2;     /* ビーコン 1 つを受ける時間・チャネルの切り替え [ms] */
    function draw(){
      var mode=md.get(),R=U.rng(seed*7919+13),TB=+bi.get()*1.024,p=pl.get()/100,dmin=mn.get(),dmax=Math.max(mx.get(),dmin);
      var phase=_w09_APS.map(function(){return R.range(0,TB);});
      var chans=[];if(mode===2)chans=[6];else for(var c=1;c<=nc.get();c++)chans.push(c);
      var t=0,rows=[],found={};
      chans.forEach(function(ch){
        var t0=t+TS,ev=[],end,heard=false;          /* チャネルを切り替えてから聞き始める */
        var aps=_w09_APS.map(function(a,i){return {a:a,i:i};}).filter(function(q){return q.a.ch===ch;});
        var probeLost=false;
        if(mode>0){probeLost=R.chance(p);ev.push({t:t0+0.3,k:"probe",lost:probeLost});
          aps.forEach(function(q){var ans=mode===2?(q.a.s==="home"):!q.a.hid;if(!ans)return;
            var tr=t0+R.range(1,6),lost=probeLost||R.chance(p);ev.push({t:tr,k:"resp",lost:lost,ap:q.i,pl:probeLost});
            if(!lost&&tr<=t0+dmin){heard=true;}
            if(!lost){found[q.i]=found[q.i]||"プローブ応答";}});
          end=t0+(heard?dmax:dmin);
        }else end=t0+td.get();
        /* その間に聞こえたビーコン（パッシブでもアクティブでも受け取れる） */
        aps.forEach(function(q){for(var s=phase[q.i]+Math.ceil((t0-phase[q.i])/TB)*TB;s<end;s+=TB){
          var full=s+TB_<=end,lost=R.chance(p);ev.push({t:s,k:"beacon",lost:lost,ap:q.i,full:full});
          if(full&&!lost)found[q.i]=found[q.i]||"ビーコン";}});
        rows.push({ch:ch,t0:t0,end:end,ev:ev,has:aps.length>0});
        t=end;
      });
      var total=t;
      /* 図: チャネルごとの時間の帯 */
      var W=700,x0=90,x1=W-20,sc=(x1-x0)/Math.max(total,1),rh=mode===2?40:20,y0=24,o=[];
      function X(v){return x0+v*sc;}
      rows.forEach(function(r,i){var y=y0+i*rh;
        o.push(S.T(x0-8,y+rh/2+4,"チャネル "+r.ch,"end",9.5,r.has?"signal":"muted",r.has));
        o.push(S.L(x0,y+rh-2,x1,y+rh-2,"grid",1));
        o.push(S.RECT(X(r.t0),y+3,Math.max(1.5,(r.end-r.t0)*sc),rh-8,2,mode===0?U.soft("signal"):U.soft("purple"),mode===0?"signal":"purple",1));
        r.ev.forEach(function(e){var x=X(e.t);
          if(e.k==="probe"){o.push(S.RECT(x,y+1,2.5,rh-4,0,"purple","purple",0.5));if(e.lost)o.push(S.X(x+1,y+rh/2,4,"alias",1.6));}
          else if(e.lost||(e.k==="beacon"&&!e.full)){o.push(S.X(x+1,y+rh/2,4,e.lost?"alias":"faint",1.6));}
          else o.push(S.RECT(x,y+2,Math.max(2,2*sc),rh-6,1,"gold","gold",0.6));});
      });
      var ya=y0+rows.length*rh+4;
      o.push(S.L(x0,ya,x1,ya,"muted",1.1));
      U.nice(0,total,6).forEach(function(v){o.push(S.L(X(v),ya,X(v),ya+4,"muted",1));o.push(S.T(X(v),ya+16,String(v),"middle",9.5,"muted"));});
      o.push(S.T(x1,ya+32,"時間 [ms]","end",9.5,"muted"));
      o.push(S.T(x0,ya+48,"帯: そのチャネルにいる時間　金: 受け取ったビーコン・応答　赤の ×: 失われた　灰色の ×: 帯からはみ出したビーコン","start",9.5,"muted"));
      box.set(S.svg(W,ya+58,o));
      /* 読み出し */
      var fl=[],ms=[];
      _w09_APS.forEach(function(a,i){var scanned=chans.indexOf(a.ch)>=0;
        if(found[i])fl.push([a.s||"（空）",a.b,String(a.ch),a.r+" dBm",found[i]]);else if(scanned)ms.push((a.s||"（空）")+"（"+a.b.slice(-5)+"、ch "+a.ch+"）");});
      var best=null;_w09_APS.forEach(function(a,i){if(found[i]&&a.s==="home"&&(!best||a.r>best.r))best=a;});
      var f="";
      if(mode===0){var miss=Math.max(0,1-(td.get()-TB_)/TB);
        f="式: n (t_d + 切り替え 2 ms) = "+chans.length+" × ("+td.get().toFixed(1)+" + 2) = "+(chans.length*(td.get()+TS)).toFixed(1)+" ms<br>"+
          "ビーコンが失われないとき、1 つの AP を見落とす確率 = max(0, 1 − (t_d − t_b)/T_B) = <b>"+U.fmt.pct(miss)+"</b>（t_b = 2 ms、T_B = "+TB.toFixed(1)+" ms）<br>";}
      else f="AP の答えが聞こえたチャネルは最大の時間まで、聞こえなければ最小の時間で次へ移る（各チャネルの前に切り替え 2 ms。SSID を出さない AP は、SSID を空にしたプローブ要求には答えない）<br>";
      ro.innerHTML="かかった時間 = <b>"+total.toFixed(1)+" ms</b><br>"+f+
        (fl.length?U.tbl(["SSID","BSSID","チャネル","RSSI","聞こえたもの"],fl):"見つかった AP は無い。")+
        (ms.length?'<span class="warn">見落とした AP: '+ms.join("、")+'</span><br>':"")+
        (best?'つなぐ AP: <span class="ok">home（'+best.b+"、"+best.r+" dBm）</span>":'<span class="warn">home の AP が見つからない'+(mode===2?" → 全部のチャネルを調べ直す":"")+'</span>');
    }
    draw();
  };

  /* ---- 4 節: 省電力の計算機 ---- */
  REG.w09_power=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"POWER","省電力モードの平均電流と、送るときだけつなぐ場合との比べ");
    var r1=U.ctrls(el);
    var dt=U.slider(r1,"DTIM 周期 D（何回に 1 回起きるか）",{values:[1,2,3,4,5,10,20],value:3,fmt:function(v){return String(v);},onInput:draw});
    var bi=U.select(r1,"ビーコン間隔",[{v:"100",t:"100 TU（102.4 ms）"},{v:"200",t:"200 TU（204.8 ms）"},{v:"300",t:"300 TU（307.2 ms）"}],"100",draw);
    var r2=U.ctrls(el);
    var ta=U.slider(r2,"1 回起きている時間 t_a",{min:0.5,max:20,log:true,value:3,fmt:function(v){return v+" ms";},onInput:draw});
    var ia=U.slider(r2,"起きている間の電流 I_a",{min:10,max:150,step:1,value:50,fmt:function(v){return v+" mA";},onInput:draw});
    var is=U.slider(r2,"眠っている間の電流 I_s",{min:1,max:2000,log:true,value:100,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var tk=U.slider(r3,"キープアライブの間隔 T_k",{values:[10,20,30,60,120,300,600,1800,3600],value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var qk=U.slider(r3,"キープアライブの電荷 Q_k",{min:0.1,max:20,log:true,value:2.4,fmt:function(v){return v+" mC";},onInput:draw});
    var cap=U.slider(r3,"電池の容量",{min:100,max:10000,log:true,int:true,value:2000,fmt:function(v){return v+" mAh";},onInput:draw});
    var r4=U.ctrls(el);
    var tr=U.slider(r4,"測定値を送る間隔 T_r",{min:10,max:86400,log:true,int:true,value:3600,fmt:function(v){return F.time(v);},onInput:draw});
    var qc=U.slider(r4,"1 回の接続の電荷 Q_c",{min:10,max:2000,log:true,value:150,fmt:function(v){return v+" mC";},onInput:draw});
    var id=U.slider(r4,"深く眠る電流 I_d",{min:0.5,max:100,log:true,value:5,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"DTIM 1",function(){dt.set(1);draw();});
    U.button(br,"DTIM 3",function(){dt.set(3);draw();});
    U.button(br,"DTIM 10",function(){dt.set(10);draw();});
    U.button(br,"例の値に戻す",function(){dt.set(3);bi.set("100");ta.set(3);ia.set(50);is.set(100);tk.set(60);qk.set(2.4);cap.set(2000);tr.set(3600);qc.set(150);id.set(5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var D=dt.get(),TB=+bi.get()*1.024e-3,Ta=ta.get()*1e-3,Ia=ia.get()*1e-3,Is=is.get()*1e-6,Tk=tk.get(),Qk=qk.get()*1e-3,C=cap.get()*1e-3*3600,
          Tr=tr.get(),Qc=qc.get()*1e-3,Id=id.get()*1e-6;
      var warn="";if(Ta>=D*TB){warn='<span class="warn">起きている時間が起きる間隔より長い。値を見直してほしい。</span><br>';}
      var Ib=(Ia-Is)*Ta/(D*TB),Ik=Qk/Tk,IA=Is+Ib+Ik,IB=Id+Qc/Tr,Ts=Qc/(IA-Id);
      var W=700,o=[];
      /* 上: 内訳の棒 */
      var bx=150,bw=440,mxv=Math.max(IA,IB),sc=bw/mxv;
      function bar(y,label,segs,tot){o.push(S.T(bx-10,y+15,label,"end",10.5,"ink",true));var xx=bx;
        segs.forEach(function(s){var w=s[0]*sc;o.push(S.RECT(xx,y,Math.max(0.8,w),22,2,U.soft(s[1]),s[1],1.1));if(w>70)o.push(S.T(xx+w/2,y+15,s[2],"middle",9.5,s[1],true));xx+=w;});
        o.push(S.T(xx+6,y+15,F.cur(tot),"start",10.5,"ink",true));}
      bar(14,"つなぎ続ける",[[Is,"green","眠り"],[Ib,"signal","ビーコン"],[Ik,"teal","キープアライブ"]],IA);
      bar(46,"送るときだけ",[[Id,"green","深い眠り"],[Qc/Tr,"purple","接続"]],IB);
      /* 下: 送る間隔と平均電流 */
      var p=U.plot(110,100,540,170,[10,86400],[1e-6,0.05],{xlog:true,ylog:true});
      o.push(p.axes({xl:"測定値を送る間隔 T_r",yl:"平均電流",xt:[10,60,600,3600,86400],yt:[1e-6,1e-5,1e-4,1e-3,1e-2],
        xfmt:function(v){return {10:"10 秒",60:"1 分",600:"10 分",3600:"1 時間",86400:"1 日"}[v];},yfmt:function(v){return F.cur(v,1);},ylOff:62}));
      var pts=[];for(var k=0;k<=80;k++){var t=Math.pow(10,1+k*(Math.log10(86400)-1)/80),v=Id+Qc/t;if(v<=0.05&&v>=1e-6)pts.push([t,v]);}
      o.push(p.line(pts,"purple",2.2));
      if(IA<=0.05&&IA>=1e-6){o.push(p.line([[10,IA],[86400,IA]],"signal",2));o.push(S.T(p.X(86400)-4,p.Y(IA)-6,"つなぎ続ける "+F.cur(IA),"end",9.5,"signal",true));}
      if(Ts>=10&&Ts<=86400){o.push(S.L(p.X(Ts),p.Y(1e-6),p.X(Ts),p.Y(IA),"faint",1,"3 3"));o.push(S.D(p.X(Ts),p.Y(IA),"alias",4.2));
        o.push(S.T(p.X(Ts)+(p.X(Ts)>520?-6:6),p.Y(1e-6)-8,"T_r* = "+F.time(Ts),p.X(Ts)>520?"end":"start",9.5,"alias",true));}
      var vb=Math.min(0.05,Math.max(1e-6,IB));o.push(S.D(p.X(Tr),p.Y(vb),"purple",5));
      o.push(S.T(p.X(Tr)+(p.X(Tr)>520?-8:8),p.Y(vb)-8,"いまの T_r",p.X(Tr)>520?"end":"start",9.5,"purple",true));
      var yl=Math.min(0.05,Id+Qc/14);if(yl>1e-6)o.push(S.T(p.X(14),Math.max(p.y+12,p.Y(yl)-8),"送るときだけつなぐ","start",9.5,"purple",true));
      box.set(S.svg(W,312,o));
      var lifeA=C/IA/3600,lifeB=C/IB/3600;
      ro.innerHTML=warn+"つなぎ続ける: I_avg = I_s + Q_b/(D T_B) + Q_k/T_k = "+F.cur(Is)+" + "+F.cur(Ib)+" + "+F.cur(Ik)+" = <b>"+F.cur(IA)+"</b>"+
        "（Q_b = (I_a − I_s) t_a = "+U.sig((Ia-Is)*Ta*1e3,3)+" mC、D T_B = "+F.time(D*TB,4)+"）<br>"+
        "　電池寿命 <b>"+_w09_life(lifeA)+"</b> ・ 下りのデータが届くまでの遅れ: 最大 <b>"+F.time(D*TB,4)+"</b>、平均 "+F.time(D*TB/2,4)+"<br>"+
        "送るときだけつなぐ: I_avg = I_d + Q_c/T_r = "+F.cur(Id)+" + "+F.cur(Qc/Tr)+" = <b>"+F.cur(IB)+"</b>"+
        " ・ 電池寿命 <b>"+_w09_life(lifeB)+"</b> ・ 下りの遅れ: 最大 <b>"+F.time(Tr)+"</b>（次に接続するまで）<br>"+
        "T_r* = Q_c / (I_A − I_d) = <b>"+(Ts>0?Math.round(Ts)+" 秒（"+F.time(Ts)+"）":"—")+"</b> → いまの T_r（"+F.time(Tr)+"）では"+
        (IB<IA?'<span class="ok">送るときだけつなぐほうが小さい</span>':'<b style="color:var(--signal)">つなぎ続けるほうが小さい</b>')+
        '<div class="wnote">どちらも、測定値を送る電荷そのものは含めていない（同じなので）。電流と時間はすべて代表値で、製品によって大きく違う。</div>';
    }
    draw();
  };

  /* ---- 5 節: ビーコンロスの判定 ---- */
  REG.w09_loss=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BEACON LOSS","N 回続けて失われたら切断と判断する: 誤った判断と、気づくまでの時間");
    var r1=U.ctrls(el);
    var pl=U.slider(r1,"ビーコンが失われる確率 p",{min:0,max:50,step:0.5,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var nn=U.slider(r1,"切断と判断する回数 N",{min:1,max:20,step:1,value:7,onInput:draw});
    var iv=U.select(r1,"ビーコンを聞く間隔",[{v:"1",t:"102.4 ms（DTIM 1）"},{v:"3",t:"307.2 ms（DTIM 3）"},{v:"10",t:"1024 ms（DTIM 10）"}],"1",draw);
    var r2=U.ctrls(el);
    var md=U.seg(r2,["互いに関係なく失われる","続けて失われやすい（平均 3 回続く）","（平均 10 回続く）"],0,draw);
    var seed=1,br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var cache={key:null};
    function sim(p,L,n){ /* 2 つの状態（受け取れる・失われる）の間を移る失われ方。L は失われる区間の平均の長さ（L = 0 なら互いに関係なく） */
      var key=[p,L,n,seed].join(",");if(cache.key===key)return cache;
      var R=U.rng(seed*104729+7),bits=new Uint8Array(n),a,b;
      if(L===0){a=p;b=1-p;}else{b=1/L;a=p*b/Math.max(1e-12,1-p);if(a>1)a=1;}
      var bad=R.chance(p),run=0,runs=[],first={};
      for(var i=0;i<n;i++){
        if(i>0)bad=bad?!R.chance(b):R.chance(a);
        bits[i]=bad?1:0;
        if(bad){run++;}else if(run){runs.push(run);for(var k=1;k<=run;k++)if(first[k]===undefined)first[k]=i-run;run=0;}
      }
      if(run){runs.push(run);for(var k2=1;k2<=run;k2++)if(first[k2]===undefined)first[k2]=n-run;}
      cache={key:key,bits:bits,runs:runs,first:first,a:a,b:b};return cache;
    }
    function draw(){
      var p=pl.get()/100,N=nn.get(),D=+iv.get(),T=0.1024*D,n=Math.floor(86400/T),Lm=[0,3,10][md.get()];
      if(Lm>0&&Lm<1/(1-p))Lm=1/(1-p);      /* 平均の長さは、互いに関係ない場合の 1/(1−p) より短くできない */
      var r=sim(p,Lm,n);
      var cnt=0;r.runs.forEach(function(x){if(x>=N)cnt++;});
      var fIndep=n*(1-p)*Math.pow(p,N), fModel=Lm>0?n*(1-p)*r.a*Math.pow(1-r.b,N-1):fIndep;
      var W=700,o=[];
      /* 上: 1 回目の誤った判断の前後のビーコンの列 */
      var M=56,st=r.first[N]!==undefined?Math.max(0,Math.min(n-M,r.first[N]-12)):0,dx=11.5,x0=30;
      o.push(S.T(14,16,r.first[N]!==undefined?"1 回目の誤った判断の前後（"+F.time(st*T)+" から）":"この日は、N 回続けて失われることが 1 回も無かった（先頭の部分）","start",10,"ink",true));
      var c=0;for(var i=0;i<M&&st+i<n;i++){var lost=r.bits[st+i],x=x0+i*dx;
        if(i===0&&st>0){var j=st-1;c=0;while(j>=0&&r.bits[j]){c++;j--;}}
        if(lost){c++;o.push(S.X(x,36,3.6,"alias",1.6));}else{c=0;o.push(S.D(x,36,"green",3.6));}
        if(c>=N&&c===N){o.push(S.L(x,24,x,58,"alias",1.6));o.push(S.T(x+4,66,"切断と判断","start",9.5,"alias",true));}
        if(lost&&c<N&&c>0)o.push(S.T(x,54,String(c),"middle",8.5,"muted",false,true));}
      /* 下: N と 1 日の回数 */
      var p2=U.plot(110,92,450,170,[1,20],[1e-6,1e5],{ylog:true});
      o.push(p2.axes({xl:"切断と判断する回数 N",yl:"1 日の誤った判断",xt:[1,5,10,15,20],yt:[1e-6,1e-4,1e-2,1,100,1e4],xfmt:function(v){return String(v);},
        yfmt:function(v){var e=Math.round(Math.log10(v));return v>=1?String(v):(e===-2?"0.01":"10"+(e===-4?"⁻⁴":"⁻⁶"));},ylOff:56}));
      [[1,"1 日に 1 回"],[1/365,"1 年に 1 回"]].forEach(function(q){o.push(p2.line([[1,q[0]],[20,q[0]]],"muted",1,"4 3"));o.push(S.T(p2.X(20)+6,p2.Y(q[0])+4,q[1],"start",9.5,"muted"));});
      function curve(f,c,dash){var pts=[];for(var k=0;k<=190;k++){var x=1+k*0.1,v=f(x);if(v>=1e-6&&v<=1e5)pts.push([x,v]);}if(pts.length>1)o.push(p2.line(pts,c,2,dash));}
      if(p>0){curve(function(x){return n*(1-p)*Math.pow(p,x);},"signal");
        if(Lm>0)curve(function(x){return n*(1-p)*r.a*Math.pow(1-r.b,x-1);},"gold","5 3");}
      var yv=Math.max(1e-6,Math.min(1e5,cnt||1e-6));
      o.push(S.D(p2.X(N),p2.Y(yv),"alias",5));
      o.push(S.T(p2.X(N)+7,p2.Y(yv)-7,"シミュレーション "+cnt+" 回","start",9.5,"alias",true));
      o.push(S.T(p2.X(20)+6,p2.y+12,"青: 互いに関係ないときの式","start",9.5,"signal"));
      if(Lm>0)o.push(S.T(p2.X(20)+6,p2.y+28,"金: 続けて失われやすい場合","start",9.5,"gold"));
      box.set(S.svg(W,300,o));
      ro.innerHTML="1 日に聞くビーコン n = 86400 s ÷ "+F.time(T,4)+" = "+F.int(n)+"<br>"+
        "式（互いに関係ないとき）n(1 − p)p^N = "+F.int(n)+" × "+(1-p).toFixed(3)+" × "+U.sig(p,3)+"^"+N+" = <b>"+U.sig(fIndep,3)+" 回/日</b>"+(fIndep>0&&fIndep<1?"（"+F.time(86400/fIndep)+"に 1 回）":"")+"<br>"+
        (Lm>0?"続けて失われやすい場合の期待値 = <b>"+U.sig(fModel,3)+" 回/日</b>（式の "+U.sig(fModel/Math.max(fIndep,1e-300),3)+" 倍）<br>":"")+
        "シミュレーション（1 日分）: <b>"+cnt+" 回</b> ・ AP が消えてから気づくまで N × "+F.time(T,4)+" = <b>"+F.time(N*T,4)+"</b>";
    }
    draw();
  };

  /* ===== 10 章 TCP ===== */
  /* RFC 6298 の RTO の推定（時間はミリ秒）。floor: 下限（0 なら下限なし）、G: 時計の細かさ */
  function _w10_est(floor){
    var e={srtt:0,var_:0,rto:1000,have:false,floor:floor,G:10};
    e.clamp=function(v){return Math.min(60000,Math.max(e.floor,v));};
    e.sample=function(r){
      if(!e.have){e.srtt=r;e.var_=r/2;e.have=true;}
      else{e.var_=0.75*e.var_+0.25*Math.abs(e.srtt-r);e.srtt=0.875*e.srtt+0.125*r;}
      e.rto=e.clamp(e.srtt+Math.max(e.G,4*e.var_));};
    e.backoff=function(){e.rto=Math.min(60000,2*e.rto);};
    return e;
  }
  var _W10_EX=[800,600,1000,700,1500,900,850,800,780,820,800,790];

  REG.w10_rto=function(el,U){
    var S=U.S,F=U.fmt,N=60;
    U.head(el,"RTO","RTT の測定値の列から RTO を決める（RFC 6298）");
    var row=U.ctrls(el);
    var pat=U.select(row,"RTT の測定値の列",["本文の表の例（800, 600, 1000, 700, 1500, 900 ms …）","近くのサーバ（100 ms 前後）",
      "携帯電話の網（平均 800 ms、揺らぎが大きい）","途中で急に増える（200 ms → 1.5 s）","途中で急に減る（1.5 s → 200 ms）"],3,draw);
    var row2=U.ctrls(el);
    var fl=U.checkbox(row2,"1 秒未満は 1 秒に切り上げる（RFC の推奨）",true,draw);
    var ka=U.checkbox(row2,"Karn のアルゴリズム（再送したセグメントの RTT は測らない）",true,draw);
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function series(k,R){
      var a=[];
      for(var i=0;i<N;i++){var u=R.next(),v;
        if(k===0)v=i<_W10_EX.length?_W10_EX[i]:Math.round(800*(0.88+0.24*u));
        else if(k===1)v=100*(0.85+0.3*u)+(R.chance(0.08)?50+100*R.next():0);
        else if(k===2)v=Math.min(4000,Math.max(250,800*Math.exp(0.3*R.normal())))*(R.chance(0.05)?2:1);
        else if(k===3)v=(i<25?200:1500)*(0.9+0.2*u);
        else v=(i<25?1500:200)*(0.9+0.2*u);
        a.push(Math.round(v));}
      return a;
    }
    function draw(){
      var R=U.rng(seed*7919+pat.get()),rs=series(pat.get(),R),e=_w10_est(fl.get()?1000:0),rows=[],spur=0,segsp=0,sumRto=0,sumR=0;
      rs.forEach(function(r,i){
        var used=e.rto,t=0,cur=e.rto,n=0;
        while(r>t+cur){t+=cur;n++;e.backoff();cur=e.rto;}      /* 時間切れ: 再送して RTO を 2 倍 */
        if(n===0)e.sample(r);
        else if(!ka.get())e.sample(r-t);                         /* 再送からの時間を測ってしまう */
        spur+=n;if(n)segsp++;sumRto+=used;sumR+=r;
        rows.push({r:r,used:used,n:n,srtt:e.srtt,var_:e.var_,rto:e.rto,have:e.have,meas:n===0?r:(ka.get()?null:r-t)});
      });
      var top=0;rows.forEach(function(q){top=Math.max(top,q.used,q.r);});var ymax=top<=8000?10000:60000;
      var W=700,o=[],p=U.plot(80,24,580,250,[0.5,N+0.5],[50,ymax],{ylog:true});
      o.push(p.axes({xl:"何個目のセグメントか（1 つずつ送り、ACK が来てから次を送る）",yl:"時間",xt:[1,10,20,30,40,50,60],yt:ymax>10000?[100,300,1000,3000,10000,30000]:[100,300,1000,3000,10000],
        xfmt:function(v){return String(v);},yfmt:function(v){return v>=1000?(v/1000)+" s":String(v);}}));
      if(fl.get())o.push(p.line([[0.5,1000],[N+0.5,1000]],"muted",1.1,"2 3"));
      o.push(p.line(rows.map(function(q,i){return [i+1,Math.max(50,q.used)];}),"teal",2.2));
      o.push(p.line(rows.map(function(q,i){return q.have?[i+1,Math.max(50,q.srtt)]:null;}).filter(function(v){return v;}),"green",1.8));
      rows.forEach(function(q,i){var c=q.n?"alias":"ink";o.push(S.D(p.X(i+1),p.Y(q.r),c,q.n?4.2:3));
        if(q.n)o.push(S.T(p.X(i+1),p.Y(q.r)-8,q.n>1?"×"+q.n:"×","middle",9.5,"alias",true));});
      var ly=24+250+44,xx=80;
      [["ink","測定値（実際の RTT）",null],["alias","RTO より長く、不要な再送が起きた",null],["green","SRTT",2],["teal","送ったときの RTO",2]].forEach(function(L){
        if(L[2]){o.push(S.L(xx,ly-4,xx+20,ly-4,L[0],2));xx+=26;}else{o.push(S.D(xx+4,ly-4,L[0],3.6));xx+=12;}
        o.push(S.T(xx,ly,L[1],"start",10,"muted"));xx+=U.tw(L[1],10)+18;});
      box.set(S.svg(W,ly+10,o));
      var head6=rows.slice(0,6).map(function(q,i){return [String(i+1),q.r+" ms",q.n?'<span class="warn">'+q.n+" 回</span>":"0",q.meas==null?"使わない":Math.round(q.meas)+" ms",
        q.have?U.sig(q.var_,4)+" ms":"（まだ無い）",q.have?U.sig(q.srtt,4)+" ms":"（まだ無い）",Math.round(q.rto)+" ms"];});
      ro.innerHTML="不要な再送: <b>"+spur+" 回</b>"+(spur?"（"+N+" 個のうち "+segsp+" 個で。このデモではセグメントは失われないので、再送はすべて不要なもの）":"（RTO は、いつも実際の RTT より長かった）")+"<br>"+
        "送ったときの RTO の平均 "+F.time(sumRto/N/1000)+" ・ 実際の RTT の平均 "+F.time(sumR/N/1000)+" → 本当に失われたときは、再送まで RTT の平均の <b>"+U.sig(sumRto/sumR,3)+" 倍</b> 待つ"+
        (!ka.get()&&spur?'<br><span class="warn">Karn のアルゴリズムを外すと、再送からの短い時間を RTT として測るので、RTO が上がらず、不要な再送が続く。</span>':"")+
        U.tbl(["回","測定値（実際）","不要な再送","RTT として使った値","RTTVAR","SRTT","次の RTO"],head6,["right","right","right","right","right","right","right"]);
    }
    draw();
  };

  /* TCP の転送の模擬（送り手 1 つ・受け手 1 つ）。o = {N, mss, rwnd, rtt[ms], rate[bps], loss, cc, R(乱数)}
     ・回線（送り手から受け手の向き）は速さ rate の 1 本で、送るセグメントは並んで順に送り出される。片道の伝わる時間は RTT/2。
     ・失われるのはデータのセグメントだけ（確率 loss）。受け手は順番の外れたセグメントを取っておき、届くたびにすぐ ACK を返す。
     ・送り手: 実効のウィンドウ = min(rwnd, cwnd)。RTO は RFC 6298（下限 1 秒）、重複 ACK 3 つで高速再送（NewReno の形）、
       輻輳制御ありなら RFC 5681 のスロースタート・輻輳回避・半減・時間切れで 1 MSS。 */
  function _w10_xsim(o){
    var R=o.R,d=o.rtt/2000,mss=Math.min(o.mss,o.rwnd),N=o.N,HDR=40;
    var IW=mss<=1095?4*mss:(mss<=2190?3*mss:2*mss);
    var now=0,ev=[],evn=0;
    function push(e){var i=ev.length;ev.push(e);while(i>0&&ev[i-1].t>e.t){ev[i]=ev[i-1];i--;}ev[i]=e;}
    var una=0,nxt=0,high=0,cwnd=o.cc?IW:1e12,ssth=1e12,dup=0,inRec=false,recover=0,timed=null,linkFree=0;
    var est=_w10_est(1000),tgen=0,tOn=false;
    var rnxt=0,ooo=[];
    var segs=[],acks=[],cw=[],done=null,nFast=0,nRto=0,nDup=0,nLost=0,nRetx=0;
    function logCw(){cw.push([now,cwnd,Math.min(cwnd,o.rwnd)]);}
    function startTimer(){tgen++;tOn=true;push({t:now+est.rto/1000,k:"to",g:tgen});}
    function stopTimer(){tgen++;tOn=false;}
    function sendSeg(seq,len,kind){
      var ts=(len+HDR)*8/o.rate,st=Math.max(now,linkFree);linkFree=st+ts;
      var lost=R.chance(o.loss),retx=seq<high;
      if(retx)nRetx++;if(lost)nLost++;
      segs.push({t:st,a:st+ts+d,seq:seq,len:len,retx:retx,lost:lost});
      if(!lost)push({t:st+ts+d,k:"data",seq:seq,len:len});
      if(!retx&&!timed)timed={seq:seq,t:now};
      if(seq+len>high)high=seq+len;
      if(!tOn)startTimer();
    }
    function trySend(){
      var win=Math.min(cwnd,o.rwnd);
      while(nxt<N){var len=Math.min(mss,N-nxt);
        if(nxt+len-una>win+1e-9)break;          /* 確認されていない量がウィンドウを超えるなら待つ */
        sendSeg(nxt,len);nxt+=len;}
    }
    function onAck(ack){
      if(ack>una){
        var newly=ack-una;
        if(timed&&ack>timed.seq){est.sample((now-timed.t)*1000);timed=null;}
        if(inRec){
          if(ack>=recover){inRec=false;if(o.cc)cwnd=ssth;}
          else{if(o.cc)cwnd=Math.max(mss,cwnd-newly+mss);sendSeg(ack,Math.min(mss,N-ack),"fast");}
        }else if(o.cc){if(cwnd<ssth)cwnd+=Math.min(newly,mss);else cwnd+=mss*mss/cwnd;}
        una=ack;dup=0;if(nxt<una)nxt=una;
        if(una>=N){done=now;stopTimer();logCw();return;}
        startTimer();
      }else if(ack===una&&nxt>una){
        dup++;nDup++;
        if(!inRec&&dup===3){
          nFast++;
          if(o.cc){ssth=Math.max((nxt-una)/2,2*mss);cwnd=ssth+3*mss;}
          inRec=true;recover=nxt;
          if(timed&&timed.seq>=una&&timed.seq<una+mss)timed=null;
          sendSeg(una,Math.min(mss,N-una),"fast");
        }else if(inRec&&o.cc)cwnd+=mss;
      }
      logCw();trySend();
    }
    function onTimeout(){
      nRto++;
      if(o.cc){ssth=Math.max((nxt-una)/2,2*mss);cwnd=mss;}
      inRec=false;dup=0;timed=null;est.backoff();nxt=una;
      logCw();trySend();startTimer();
    }
    function onData(seq,len){
      if(seq<=rnxt&&seq+len>rnxt){rnxt=seq+len;
        var moved=true;while(moved){moved=false;for(var i=0;i<ooo.length;i++){if(ooo[i][0]<=rnxt){if(ooo[i][1]>rnxt)rnxt=ooo[i][1];ooo.splice(i,1);moved=true;break;}}}}
      else if(seq>rnxt&&seq+len<=rnxt+o.rwnd){ooo.push([seq,seq+len]);}
      acks.push({t:now,a:now+d,ack:rnxt});
      push({t:now+d,k:"ack",ack:rnxt});
    }
    logCw();trySend();
    while(ev.length&&done===null&&evn<400000){
      var e=ev.shift();evn++;now=e.t;if(now>3600)break;
      if(e.k==="data")onData(e.seq,e.len);
      else if(e.k==="ack")onAck(e.ack);
      else if(e.k==="to"&&e.g===tgen&&tOn)onTimeout();
    }
    return {segs:segs,acks:acks,cw:cw,done:done,end:now,nFast:nFast,nRto:nRto,nDup:nDup,nLost:nLost,nRetx:nRetx,mss:mss,IW:IW};
  }

  REG.w10_xfer=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"TCP","スライディングウィンドウ・再送・輻輳制御で、データを送り切るまで");
    var row=U.ctrls(el);
    var nb=U.slider(row,"データの量",{values:[10000,20000,50000,100000,200000,500000],value:50000,fmt:function(v){return F.int(v)+" バイト";},onInput:draw});
    var ms=U.select(row,"MSS",["536 バイト","1460 バイト"],0,draw);
    var rw=U.slider(row,"受信ウィンドウ",{values:[536,1072,2144,4288,8760,17520,32768,65535],value:2144,fmt:function(v){return F.int(v)+" バイト";},onInput:draw});
    var row2=U.ctrls(el);
    var rt=U.slider(row2,"RTT（回線を送る時間を除く）",{min:5,max:1000,log:true,int:true,value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var rate=U.slider(row2,"回線の速さ",{values:[0.1,0.25,0.5,1,2,5,10,20,50,100],value:10,fmt:function(v){return v+" Mbps";},onInput:draw});
    var ls=U.slider(row2,"データのセグメントが失われる確率",{min:0,max:20,step:0.5,value:2,fmt:function(v){return v+" %";},onInput:draw});
    var row3=U.ctrls(el);
    var cc=U.checkbox(row3,"輻輳制御（スロースタート・輻輳回避）",true,draw);
    var br=U.btnrow(el),seed=1;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"小さな機器（MSS 536・ウィンドウ 2144）",function(){ms.set("0");rw.set(2144);draw();});
    U.button(br,"大きなウィンドウ（MSS 1460・65535）",function(){ms.set("1");rw.set(65535);draw();});
    var box=U.svgbox(el),box2=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var mss=ms.get()===0?536:1460,o={N:nb.get(),mss:mss,rwnd:rw.get(),rtt:rt.get(),rate:rate.get()*1e6,loss:ls.get()/100,cc:cc.get(),R:U.rng(seed*104729+7)};
      var r=_w10_xsim(o),T=r.done||r.end,mssE=r.mss;
      /* 1 枚目: 最初の部分のシーケンス図 */
      var first=r.segs.slice(0,18),T1=0;first.forEach(function(s){T1=Math.max(T1,s.a+o.rtt/2000);});T1=Math.min(T1,T);
      var W=700,xa=236,xb=540,y0=58,H=320,Y=function(t){return y0+t/T1*H;},q=[];
      q.push(S.RECT(xa-44,8,88,26,7,U.soft("signal"),"signal",1.3));q.push(S.T(xa,25,"送り手（機器）","middle",10.5,"signal",true));
      q.push(S.RECT(xb-44,8,88,26,7,U.soft("green"),"green",1.3));q.push(S.T(xb,25,"受け手","middle",10.5,"green",true));
      q.push(S.L(xa,34,xa,y0+H+6,"signal",1.2,"3 4"));q.push(S.L(xb,34,xb,y0+H+6,"green",1.2,"3 4"));
      var tk=U.nice(0,T1*1000,5);tk.forEach(function(v){var yy=Y(v/1000);q.push(S.L(40,yy,46,yy,"muted",1));q.push(S.T(52,yy+3.5,F.time(v/1000),"start",9,"muted"));});
      q.push(S.L(43,y0,43,y0+H,"muted",1));
      r.acks.forEach(function(a){if(a.t<=T1)q.push(S.ARR(xb,Y(a.t),xa,Y(Math.min(a.a,T1)),"green",1.1,5));});
      var groups=[];
      r.segs.forEach(function(s){if(s.t>T1)return;var c=s.retx?"alias":"ink";
        if(s.lost){var fx=xa+(xb-xa)*0.55,fy=Y(s.t)+(Y(s.a)-Y(s.t))*0.55;q.push(S.L(xa,Y(s.t),fx,fy,"alias",1.4,"5 3"));q.push(S.X(fx,fy,4.5,"alias",2));}
        else q.push(S.ARR(xa,Y(s.t),xb,Y(Math.min(s.a,T1)),c,1.4,6));
        var g=groups[groups.length-1];
        if(g&&Y(s.t)-g.y<11&&g.retx===s.retx){g.n++;g.e=Math.max(g.e,s.seq+s.len);}else groups.push({y:Y(s.t),s:s.seq,e:s.seq+s.len,n:1,retx:s.retx});});
      groups.forEach(function(g){q.push(S.T(xa-8,g.y+3.5,(g.retx?"再送 ":"")+F.int(g.s+1)+"〜"+F.int(g.e)+(g.n>1?"（"+g.n+" 個）":""),"end",9,g.retx?"alias":"ink",g.retx,true));});
      q.push(S.T(W/2,y0+H+24,"最初の部分（0〜"+F.time(T1)+"）。黒: データ（左は運んだバイトの番号。ISN + 1 を 1 とした）、赤: 再送、×: 失われた、緑: ACK","middle",9.5,"muted"));
      box.set(S.svg(W,y0+H+34,q));
      /* 2 枚目: 番号と時間、ウィンドウの推移 */
      var z=[],p=U.plot(90,16,560,190,[0,T],[0,o.N]);
      z.push(p.axes({xl:"",yl:"バイトの番号",xt:U.nice(0,T,6),yt:U.nice(0,o.N,4),xfmt:function(v){return F.time(v);},yfmt:function(v){return F.int(v);}}));
      var ap=[[0,0]];var cur=0;r.acks.forEach(function(a){if(a.ack>cur){ap.push([a.a,cur]);ap.push([a.a,a.ack]);cur=a.ack;}});ap.push([T,cur]);
      z.push(p.line(ap,"green",1.8));
      r.segs.forEach(function(s){var x=p.X(s.t);z.push(S.L(x,p.Y(s.seq),x,p.Y(s.seq+s.len),s.retx?"alias":(s.lost?"faint":"signal"),s.retx?2.2:1.6));
        if(s.lost)z.push(S.X(x,p.Y(s.seq+s.len/2),3,"alias",1.4));});
      z.push(S.T(p.x+8,p.y+14,"縦の短い線: 送ったセグメント（赤は再送、× は失われたもの） 緑: 確認された番号","start",9.5,"muted"));
      var wy=16+190+50,ymax=Math.max(o.rwnd*1.25,Math.min(o.rwnd*3,Math.max.apply(null,r.cw.map(function(c){return c[1];}))*1.05));
      if(!o.cc)ymax=o.rwnd*1.25;
      var p2=U.plot(90,wy,560,110,[0,T],[0,ymax]);
      z.push(p2.axes({xl:"時間",yl:"ウィンドウ [バイト]",xt:U.nice(0,T,6),yt:U.nice(0,ymax,3),xfmt:function(v){return F.time(v);},yfmt:function(v){return F.int(v);}}));
      z.push(p2.line([[0,o.rwnd],[T,o.rwnd]],"green",1.3,"6 4"));
      if(o.cc){var cp=[];r.cw.forEach(function(c,i){if(i)cp.push([c[0],Math.min(ymax,r.cw[i-1][1])]);cp.push([c[0],Math.min(ymax,c[1])]);});cp.push([T,Math.min(ymax,r.cw[r.cw.length-1][1])]);
        z.push(p2.line(cp,"signal",1.3,"3 3"));}
      var ep=[];r.cw.forEach(function(c,i){if(i)ep.push([c[0],r.cw[i-1][2]]);ep.push([c[0],c[2]]);});ep.push([T,r.cw[r.cw.length-1][2]]);
      z.push(p2.line(ep,"ink",2));
      z.push(S.T(p2.x+p2.w-4,p2.Y(o.rwnd)-5,"受信ウィンドウ","end",9.5,"green",true));
      z.push(S.T(p2.x+8,p2.y+12,"太線: 実効のウィンドウ = min(受信ウィンドウ, cwnd)"+(o.cc?"　点線: cwnd":"（輻輳制御なし）"),"start",9.5,"muted"));
      box2.set(S.svg(700,wy+110+44,z));
      var ts=(mssE+40)*8/o.rate,bound=Math.min(o.rate/8,o.rwnd/(ts+o.rtt/1000)),thr=r.done?o.N/r.done:0;
      ro.innerHTML=(r.done?"送り切るまで <b>"+F.time(r.done)+"</b> ・ スループット <b>"+F.int(thr)+" B/s</b>（"+F.rate(thr*8)+"）":'<span class="warn">1 時間で送り切れなかった</span>')+"<br>"+
        "上限 min(回線の速さ, 受信ウィンドウ ÷ (T_s + RTT)) = min("+F.int(o.rate/8)+", "+F.int(o.rwnd)+" ÷ "+F.time(ts+o.rtt/1000)+") = <b>"+F.int(bound)+" B/s</b>"+
        "（"+(o.rate/8<=o.rwnd/(ts+o.rtt/1000)?"回線の速さで決まる":"受信ウィンドウで決まる")+"） ・ ストップアンドウェイトなら "+F.int(mssE/(ts+o.rtt/1000))+" B/s<br>"+
        "送ったセグメント "+r.segs.length+"（うち再送 <b>"+r.nRetx+"</b>）・ 失われた "+r.nLost+" ・ 重複 ACK "+r.nDup+" ・ 高速再送 <b>"+r.nFast+"</b> 回 ・ 時間切れ <b>"+r.nRto+"</b> 回"+
        (o.cc?" ・ 始めの cwnd "+F.int(r.IW)+" バイト":"")+
        (r.done&&o.cc&&r.nRetx===0&&thr<0.8*bound?'<br>上限に届かないのは、cwnd が小さい始めの部分（スロースタート）が、転送の時間の多くを占めるため。データを増やすと上限に近づく。':"");
    }
    draw();
  };

  /* Nagle アルゴリズムと遅延 ACK の模擬（失われることは考えない）。時間は ms。
     p = {pat: 0 書く・書く・読む / 1 1 回で書く / 2 大きなデータ, nagle, delack, rtt, D, cap(送信バッファ [MSS])}
     機器（A）が要求を送り、サーバ（B）が応答する。Nagle アルゴリズムは機器の側にだけ働かせ、遅延 ACK は両方の受け手に働かせる。 */
  function _w10_dsim(p){
    var MSS=536,RATE=125,d=p.rtt/2,K=4,M=12*MSS,now=0,ev=[],segs=[],spans=[],ex=[],done=null;
    function push(e){var i=ev.length;ev.push(e);while(i>0&&ev[i-1].t>e.t){ev[i]=ev[i-1];i--;}ev[i]=e;}
    function host(nm){return {nm:nm,una:0,nxt:0,wr:0,rcv:0,pend:false,full:0,tmr:null,lf:0,hold:null};}
    var A=host("A"),B=host("B");A.peer=B;B.peer=A;
    function tx(h,len,lab){
      var st=Math.max(now,h.lf),ts=(len+40)/RATE;h.lf=st+ts;
      var s={from:h.nm,t:st,a:st+ts+d,seq:h.nxt,len:len,ack:h.rcv,lab:lab};segs.push(s);
      push({t:s.a,k:"seg",to:h.peer,s:s});
      if(h.tmr!==null){spans.push({h:h.nm,t0:h.tmr.t0,t1:now,k:"d"});h.tmr.dead=true;h.tmr=null;}
      h.pend=false;h.full=0;
    }
    function label(h,len){
      if(p.pat===2)return h===A?len+" B":"ACK";
      if(h===B)return "応答 "+len+" B";
      return p.pat===1?"要求 "+len+" B":(len===10?"ヘッダ 10 B":(len===20?"本体 20 B":"ヘッダ+本体 30 B"));
    }
    function output(h){
      for(;;){
        var un=h.wr-h.nxt;if(un<=0)break;
        var len=Math.min(un,MSS);
        if(h===A&&p.nagle&&h.nxt>h.una&&len<MSS){if(h.hold===null)h.hold=now;break;}
        if(h.hold!==null){spans.push({h:h.nm,t0:h.hold,t1:now,k:"n"});h.hold=null;}
        /* 書き込みの区切りどおりに送る（ためていない限り）: 機器の書き込みは 10 B と 20 B */
        if(h===A&&p.pat===0&&!p.nagle){var w=h.chunks.shift();if(w)len=w;}
        else if(h===A&&p.pat===0&&p.nagle){var tot=0;while(h.chunks.length&&tot+h.chunks[0]<=len){tot+=h.chunks.shift();}len=tot||len;}
        var lab=label(h,len);tx(h,len,lab);h.nxt+=len;
      }
    }
    function ackDecide(h){
      if(!h.pend)return;
      if(!p.delack||h.full>=2){tx(h,0,"ACK");return;}
      if(h.tmr===null){h.tmr={t0:now};push({t:now+p.D,k:"tmr",h:h,o:h.tmr});}
    }
    var k=0,t0=0;
    function appA(){
      if(p.pat===2){while(A.wr<M&&A.wr-A.una<p.cap*MSS){A.wr+=Math.min(MSS,M-A.wr);}if(A.una>=M&&done===null)done=now;return;}
      if(A.rcv>=30*(k+1)){ex.push(now-t0);k++;}
      if(k<K&&A.wr<30*(k+1)){t0=now;
        if(p.pat===0){A.wr+=10;A.chunks.push(10);output(A);A.wr+=20;A.chunks.push(20);}   /* 2 回に分けて書く */
        else{A.wr+=30;A.chunks.push(30);}}
    }
    function appB(){if(p.pat!==2&&B.rcv>=30*(B.done||0)+30){B.done=(B.done||0)+1;B.wr+=30;}}
    A.chunks=[];B.chunks=[];
    appA();output(A);
    var guard=0;
    while(ev.length&&guard++<20000){
      var e=ev.shift();now=e.t;
      if(e.k==="tmr"){if(!e.o.dead&&e.h.tmr===e.o){spans.push({h:e.h.nm,t0:e.o.t0,t1:now,k:"d"});e.h.tmr=null;tx(e.h,0,"ACK");}continue;}
      var h=e.to,s=e.s;
      if(s.ack>h.una)h.una=s.ack;
      if(s.len>0){if(s.seq===h.rcv)h.rcv+=s.len;h.pend=true;if(s.len>=MSS)h.full++;}
      if(h===A)appA();else appB();
      output(h);ackDecide(h);
      if(p.pat!==2&&k>=K&&ev.length===0)break;
      if(p.pat===2&&done!==null)break;
    }
    return {segs:segs,spans:spans,ex:ex,done:done,M:M,MSS:MSS};
  }

  REG.w10_delack=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"DELAYED ACK","Nagle アルゴリズムと遅延 ACK が重なると");
    var row=U.ctrls(el);
    var pt=U.select(row,"送り方",["書く・書く・読む（10 B と 20 B を書き、30 B の応答を読む）","1 回で書く（30 B を書き、30 B の応答を読む）","大きなデータを流す（536 B の満杯のセグメント 12 個）"],0,draw);
    var row2=U.ctrls(el);
    var ng=U.checkbox(row2,"Nagle アルゴリズム（機器）",true,draw);
    var da=U.checkbox(row2,"遅延 ACK（受け手）",true,draw);
    var row3=U.ctrls(el);
    var rt=U.slider(row3,"RTT",{min:1,max:200,log:true,int:true,value:40,fmt:function(v){return v+" ms";},onInput:draw});
    var dd=U.slider(row3,"遅延 ACK の待ち時間 D",{values:[40,100,200,300,500],value:200,fmt:function(v){return v+" ms";},onInput:draw});
    var cp=U.select(row3,"送信バッファ（大きなデータのとき）",["MSS 1 つ分","MSS 2 つ分","MSS 4 つ分"],0,draw);
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var p={pat:pt.get(),nagle:ng.get(),delack:da.get(),rtt:rt.get(),D:dd.get(),cap:[1,2,4][cp.get()]};
      var r=_w10_dsim(p);
      var T1;
      if(p.pat===2){var cnt=0;T1=0;r.segs.forEach(function(s){if(s.from==="A"&&s.len>0&&cnt<6){cnt++;T1=Math.max(T1,s.a);}});T1+=p.rtt/2+(p.delack?p.D:0)+5;}
      else T1=(r.ex.length>=2?r.ex[0]+r.ex[1]:(r.ex[0]||100))+2;
      if(r.done!==null)T1=Math.min(T1,r.done+1);
      var W=700,xa=230,xb=500,y0=58,H=330,Y=function(t){return y0+t/T1*H;},q=[];
      q.push(S.RECT(xa-40,8,80,26,7,U.soft("signal"),"signal",1.3));q.push(S.T(xa,25,"機器","middle",11,"signal",true));
      q.push(S.RECT(xb-40,8,80,26,7,U.soft("green"),"green",1.3));q.push(S.T(xb,25,"サーバ","middle",11,"green",true));
      q.push(S.L(xa,34,xa,y0+H+6,"signal",1.2,"3 4"));q.push(S.L(xb,34,xb,y0+H+6,"green",1.2,"3 4"));
      U.nice(0,T1,5).forEach(function(v){var yy=Y(v);q.push(S.L(40,yy,46,yy,"muted",1));q.push(S.T(52,yy+3.5,F.time(v/1000),"start",9,"muted"));});
      q.push(S.L(43,y0,43,y0+H,"muted",1));
      r.spans.forEach(function(sp){if(sp.t0>T1)return;var x=sp.h==="A"?xa-10:xb+10,s=sp.h==="A"?-1:1,y1=Y(sp.t0),y2=Y(Math.min(sp.t1,T1));if(y2-y1<3)return;
        var c=sp.k==="d"?"teal":"signal";q.push(S.W([x,y1,x+s*5,y1,x+s*5,y2,x,y2],c,1.4));
        q.push(S.T(x+s*9,(y1+y2)/2+4,sp.k==="d"?"遅延 ACK":"Nagle でためる","start"===(s>0?"start":"end")?"start":(s>0?"start":"end"),9.5,c,true));});
      var lastA=-99,lastB=-99;
      r.segs.forEach(function(sg){if(sg.t>T1)return;var fromA=sg.from==="A",x1=fromA?xa:xb,x2=fromA?xb:xa,c=sg.len===0?"green":(fromA?"ink":"purple");
        q.push(S.ARR(x1,Y(sg.t),x2,Y(Math.min(sg.a,T1)),c,1.4,6));
        var ly=(Y(sg.t)+Y(Math.min(sg.a,T1)))/2-5;
        if(fromA){if(ly-lastA>=12){q.push(S.T((x1+x2)/2-40,ly,sg.lab,"middle",9.5,c,sg.len>0));lastA=ly;}}
        else{if(ly-lastB>=12){q.push(S.T((x1+x2)/2+40,ly,sg.lab,"middle",9.5,c,sg.len>0));lastB=ly;}}});
      q.push(S.T(W/2,y0+H+24,(p.pat===2?"最初の 6 つのセグメントまで":"最初の 2 回の要求")+"（縮尺どおり。黒: 機器のデータ、紫: サーバのデータ、緑: ACK だけのセグメント）","middle",9.5,"muted"));
      box.set(S.svg(W,y0+H+34,q));
      if(p.pat===2){
        var thr=r.done?r.M/r.done*1000:0;
        ro.innerHTML="12 個（"+F.int(r.M)+" バイト）を送り切るまで <b>"+F.time((r.done||0)/1000)+"</b> ・ スループット <b>"+F.int(thr)+" B/s</b>（回線 1 Mbps として、送る時間も含む）"+
          (p.cap===1&&p.delack?' ・ <span class="warn">送信バッファが 1 つ分なので、受け手は 2 つ目を待って ACK を遅らせる: MSS ÷ (RTT + D) = '+F.int(536/((p.rtt+p.D)/1000))+" B/s（送る時間を除く）</span>":"");
      }else{
        var av=r.ex.reduce(function(a,b){return a+b;},0)/Math.max(1,r.ex.length);
        var f=(p.pat===0&&p.nagle)?(p.delack?"2RTT + D = "+F.time((2*p.rtt+p.D)/1000):"2RTT = "+F.time(2*p.rtt/1000)+"（本体はヘッダの ACK を待つ）"):"RTT = "+F.time(p.rtt/1000);
        ro.innerHTML="1 回の要求にかかる時間 <b>"+F.time(av/1000)+"</b>（"+r.ex.length+" 回の平均。回線 1 Mbps として送る時間も含む）・ 1 秒に <b>"+U.sig(1000/av,3)+" 回</b> ・ 式では "+f+"（送る時間を除く）"+
          (p.pat===0&&p.nagle&&p.delack?'<br><span class="warn">本体が Nagle アルゴリズムにためられ、ヘッダの ACK が遅延 ACK で D だけ遅れる。1 回で書くか、Nagle アルゴリズムを止める（TCP_NODELAY）と RTT で済む。</span>':"");
      }
    }
    draw();
  };

  /* ===== 11 章 ソケットと組み込みの TCP/IP スタック ===== */
  var _w11_COL=["signal","purple","gold","teal"];

  /* (1) TCP のバイトの列とメッセージの境目 */
  REG.w11_stream=function(el,U){
    var S=U.S;
    U.head(el,"STREAM","TCP のバイトの列と、メッセージの境目");
    var row=U.ctrls(el);
    var nmsg=U.slider(row,"メッセージの数",{values:[2,3,4,5,6,7,8],value:4,fmt:function(v){return v+" 個";},onInput:draw});
    var lmax=U.slider(row,"本体の長さ（最大）",{values:[2,4,8,12,16,24],value:12,fmt:function(v){return v+" バイト";},onInput:draw});
    var row2=U.ctrls(el);
    var mode=U.select(row2,"recv への届き方",["送った単位どおり（たまたま合う）","ランダムな位置で分かれる","受け手が遅れ、たまった分をまとめて読む","1 バイトずつ"],1,draw);
    var cap=U.slider(row2,"recv に渡す配列の大きさ",{values:[4,8,16,32,64,128],value:32,fmt:function(v){return v+" バイト";},onInput:draw});
    var br=U.btnrow(el),seed=11;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el,{scroll:true}),ro=U.readout(el);
    var AL="ABCDEFGHJKLMNPRSTUVWXYZ0123456789=.,";
    function txt(bs){return bs.map(function(b){return String.fromCharCode(b);}).join("");}
    function hex2(b){return U.fmt.hex(b,2);}
    function draw(){
      var r=U.rng(seed),N=nmsg.get(),LM=lmax.get(),C=cap.get(),m=mode.get();
      var msgs=[],bytes=[],own=[],hdr=[],start=[];
      for(var i=0;i<N;i++){
        var L=1+r.int(LM),body=[];
        for(var k=0;k<L;k++)body.push(AL.charCodeAt(r.int(AL.length)));
        msgs.push(body);start.push(bytes.length);
        bytes.push(L>>8,L&255);own.push(i,i);hdr.push(1,1);
        for(var k2=0;k2<L;k2++){bytes.push(body[k2]);own.push(i);hdr.push(0);}
      }
      var total=bytes.length,chunks=[],pos=0;
      if(m===0){for(var a=0;a<N;a++){var e=a+1<N?start[a+1]:total,p=start[a];while(p<e){var c=Math.min(C,e-p);chunks.push([p,p+c]);p+=c;}}}
      else if(m===1){while(pos<total){var c1=Math.min(total-pos,1+r.int(C));chunks.push([pos,pos+c1]);pos+=c1;}}
      else if(m===2){while(pos<total){var c2=Math.min(total-pos,C);chunks.push([pos,pos+c2]);pos+=c2;}}
      else{for(var q=0;q<total;q++)chunks.push([q,q+1]);}
      /* 「1 回の recv = 1 つのメッセージ」と読む */
      var naiveOk={},naiveRows=[];
      chunks.forEach(function(ch){
        var n=ch[1]-ch[0],s;
        if(n<2){s='<span class="warn">長さを読めない（×）</span>';}
        else{var L=bytes[ch[0]]<<8|bytes[ch[0]+1];
          if(n<2+L)s='<span class="warn">長さを '+L+' と読むが、足りない（×）</span>';
          else{var idx=start.indexOf(ch[0]),good=idx>=0&&msgs[idx].length===L;
            if(good)naiveOk[idx]=1;
            s=(good?'<span class="ok">'+String.fromCharCode(65+idx)+' を読む（○）</span>':'<span class="warn">長さ '+L+' の「'+U.esc(txt(bytes.slice(ch[0]+2,ch[0]+2+L)))+'」と読む（×）</span>')+
              (n>2+L?' <span class="warn">残り '+(n-2-L)+' バイトを捨てる</span>':'');}}
        naiveRows.push(s);
      });
      /* 長さで切り出す */
      var acc=0,got=0,goodRows=[];
      chunks.forEach(function(ch){
        acc=ch[1];var done=[];
        while(got<N&&acc>=start[got]+2+msgs[got].length){done.push(String.fromCharCode(65+got));got++;}
        var rest=acc-(got<N?start[got]:total);
        goodRows.push(done.length?'<span class="ok">'+done.join("・")+' がそろう</span>'+(rest>0?'（'+rest+' バイトを残す）':''):'足りないので待つ（'+rest+' バイトを残す）');
      });
      /* 図: バイトのます目と recv の区切り */
      var W=700,unit=18,x0=16,per=Math.floor((W-2*x0)/unit),rows=Math.ceil(total/per),rh=50,o=[];
      function cx(b){return x0+(b%per)*unit;} function cy(b){return 28+Math.floor(b/per)*rh;}
      for(var i2=0;i2<N;i2++){var b0=start[i2];o.push(S.T(cx(b0)+2,cy(b0)-5,String.fromCharCode(65+i2),"start",10,_w11_COL[i2%4],true));}
      for(var b=0;b<total;b++){
        var col=_w11_COL[own[b]%4],x=cx(b),y=cy(b);
        o.push(S.RECT(x,y,unit,20,2,hdr[b]?"panel":U.soft(col),col,hdr[b]?1.6:1.1));
        o.push(S.T(x+unit/2,y+14,hdr[b]?hex2(bytes[b]):String.fromCharCode(bytes[b]),"middle",hdr[b]?7.5:9.5,hdr[b]?col:"ink",!!hdr[b],true));
      }
      chunks.forEach(function(ch,j){
        for(var s=ch[0];s<ch[1];){var e2=Math.min(ch[1],(Math.floor(s/per)+1)*per),xa=cx(s)+2,xb=cx(e2-1)+unit-2,yb=cy(s)+25;
          o.push(S.W([xa,yb,xa,yb+5,xb,yb+5,xb,yb],"ink",1.3));
          if(xb-xa>=14&&s===ch[0])o.push(S.T((xa+xb)/2,yb+16,String(j+1),"middle",9,"ink",true));
          s=e2;}
      });
      box.set(S.svg(W,28+rows*rh,o));
      var nOk=Object.keys(naiveOk).length,lim=12,trs=[];
      for(var j=0;j<Math.min(lim,chunks.length);j++)trs.push([String(j+1),String(chunks[j][1]-chunks[j][0]),naiveRows[j],goodRows[j]]);
      var more=chunks.length>lim?'<div class="wnote">（表は最初の '+lim+' 回だけ。recv は全部で '+chunks.length+' 回）</div>':'';
      ro.innerHTML="メッセージ "+N+" 個、合わせて "+total+" バイト（長さ 2 バイト + 本体）を、recv "+chunks.length+" 回で受け取った<br>"+
        "正しく読めたメッセージ: 「1 回の recv = 1 つ」と読むと <b>"+nOk+" / "+N+"</b>"+(nOk<N?' <span class="warn">誤り</span>':'')+
        " ・ 長さで切り出すと <b>"+got+" / "+N+"</b> <span class=\"ok\">すべて</span>"+
        U.tbl(["recv","バイト数","「1 回 = 1 つ」と読むと","長さで切り出すと"],trs,["center","right","left","left"])+more;
    }
    draw();
  };

  /* (2) 送信バッファと send の戻り値 */
  REG.w11_sendbuf=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"SEND","送信バッファの量と、send の戻り値");
    var row=U.ctrls(el);
    var sb=U.slider(row,"送信バッファの大きさ",{values:[1024,2048,4096,8192,16384,32768],value:4096,fmt:function(v){return v+" バイト";},onInput:draw});
    var rate=U.slider(row,"スタックが送り出せる速さ",{min:1000,max:1000000,log:true,int:true,value:20000,fmt:function(v){return U.sig(v,3)+" B/s";},onInput:draw});
    var row2=U.ctrls(el);
    var msz=U.slider(row2,"1 回に書く量",{values:[256,512,1024,2048,4096,8192,16384],value:8192,fmt:function(v){return v+" バイト";},onInput:draw});
    var per=U.slider(row2,"書く間隔",{values:[10,20,50,100,200,500],value:500,fmt:function(v){return v+" ms";},onInput:draw});
    var row3=U.ctrls(el);
    var mode=U.seg(row3,["ブロッキング（send_all）","ノンブロッキング + select","戻り値を見ない（悪い例）"],0,draw);
    var box=U.svgbox(el),ro=U.readout(el);
    U.note(el,"送り出せる速さは、ウィンドウ ÷ RTT（10 章 3 節）や回線の速さで決まる。select が「書ける」を返すのは、空きが送信バッファの半分以上になったときか、残りが全部入るときとした（実際のしきい値はスタックによって違う）。2 秒間を 1 ms ずつ計算する。");
    function draw(){
      var Sz=sb.get(),v=rate.get()/1000,M=msz.get(),P=per.get(),md=mode.get(),T=2000;
      var L=0,q=[],lev=[],ev=[],blkMs=[],offered=0,acc=0,lost=0,calls=0,part=0,eag=0,maxDelay=0,sent=0;
      for(var t=0;t<T;t++){
        var d=Math.min(L,v);L-=d;sent+=d;
        if(t%P===0){offered+=M;
          if(md===2){calls++;var fr=Math.floor(Sz-L),a=Math.min(fr,M);
            if(a<=0){eag++;lost+=M;ev.push([t,2]);}
            else{L+=a;acc+=a;if(a<M){part++;lost+=M-a;ev.push([t,1]);}else ev.push([t,0]);}}
          else q.push([M,t,M]);}
        if(md!==2&&q.length){
          var free=Math.floor(Sz-L),rem=q[0][0];
          if(md===0){var c=Math.min(free,rem);if(c>0){L+=c;acc+=c;q[0][0]-=c;}
            if(q[0][0]===0){maxDelay=Math.max(maxDelay,t-q[0][1]);ev.push([t,t>q[0][1]?1:0]);q.shift();}
            if(q.length)blkMs.push(t);}
          else if(free>=Math.min(Sz/2,rem)){var c2=Math.min(free,rem);calls++;L+=c2;acc+=c2;q[0][0]-=c2;
            if(c2<rem){part++;ev.push([t,1]);}else ev.push([t,0]);
            if(q[0][0]===0){maxDelay=Math.max(maxDelay,t-q[0][1]);q.shift();}}
        }
        lev.push(L);
      }
      var qb=q.reduce(function(s,x){return s+x[0];},0);
      if(md===0)calls=ev.length;
      var W=700,x0=70,pw=600,y0=40,ph=150,o=[];
      var p=U.plot(x0,y0,pw,ph,[0,T],[0,Sz*1.08]);
      o.push(p.axes({xl:"時間 [ms]",yl:"送信バッファの中の量",xt:[0,500,1000,1500,2000],yt:[0,Sz/2,Sz],yfmt:function(y){return U.sig(y,3);},ylOff:58}));
      var pts=[[p.X(0),p.Y(0)]];for(var t2=0;t2<T;t2+=4)pts.push([p.X(t2),p.Y(lev[t2])]);pts.push([p.X(T-1),p.Y(lev[T-1])],[p.X(T-1),p.Y(0)]);
      o.push(S.PL(pts,"green",1.4,U.soft("green")));
      o.push(S.L(p.X(0),p.Y(Sz),p.X(T),p.Y(Sz),"alias",1.2,"5 4"));
      o.push(S.T(p.X(T)-4,p.Y(Sz)-5,"送信バッファの大きさ","end",9.5,"alias"));
      if(md===1){o.push(S.L(p.X(0),p.Y(Sz/2),p.X(T),p.Y(Sz/2),"faint",1,"3 3"));}
      /* 書いた時刻 */
      for(var t3=0;t3<T;t3+=P)o.push(S.PL([[p.X(t3)-3,y0-14],[p.X(t3)+3,y0-14],[p.X(t3),y0-8]],"purple",1,"purple"));
      o.push(S.T(x0-6,y0-8,"書く","end",9,"purple"));
      /* send の結果 */
      var yr=y0+ph+44;
      o.push(S.T(x0-6,yr+4,md===0?"send_all":"send","end",9,"muted",false,true));
      ev.forEach(function(e){var c=e[1]===0?"green":e[1]===1?"gold":"alias";o.push(S.L(p.X(e[0]),yr-6,p.X(e[0]),yr+6,c,md===1?1:2));});
      if(md===0){var iv=[];
        blkMs.forEach(function(t4){if(iv.length&&iv[iv.length-1][1]===t4-1)iv[iv.length-1][1]=t4;else iv.push([t4,t4]);});
        iv.forEach(function(a){o.push(S.RECT(p.X(a[0]),yr+12,Math.max(1,p.X(a[1]+1)-p.X(a[0])),8,1,U.soft("alias"),"alias",0.8));});
        o.push(S.T(x0-6,yr+20,"止まる","end",9,"alias"));}
      var lg=md===0?[["green","待たずに入った"],["gold","空くまで待って入った"]]:md===1?[["green","残りが全部入った"],["gold","部分送信（残りは次に）"]]:[["green","全部入った"],["gold","部分送信（残りを失う）"],["alias","EAGAIN（全部を失う）"]];
      var lx=x0;lg.forEach(function(g){o.push(S.RECT(lx,yr+30,10,10,2,U.soft(g[0]),g[0],1.2));o.push(S.T(lx+14,yr+39,g[1],"start",9.5,"muted"));lx+=24+U.tw(g[1],9.5);});
      if(md===0){o.push(S.RECT(lx,yr+30,10,10,2,U.soft("alias"),"alias",1.2));o.push(S.T(lx+14,yr+39,"タスクが send_all の中で止まっている間","start",9.5,"muted"));}
      box.set(S.svg(W,yr+48,o));
      var blk=blkMs.length,inRate=M/P*1000,over=inRate>rate.get();
      var h="書いた量 "+F.int(offered)+" バイト（"+U.sig(inRate,3)+" B/s） ・ 送信バッファが受け付けた量 "+F.int(acc)+" バイト ・ 送り出した量 "+F.int(Math.round(sent))+" バイト<br>";
      if(md===0)h+="send_all の回数 "+calls+" ・ タスクが止まっていた時間 <b>"+blk+" ms</b>（2 秒のうち "+Math.round(blk/T*100)+" %） ・ 書いてから入り終わるまでの最大の遅れ "+maxDelay+" ms";
      else if(md===1)h+="send を呼んだ回数 "+calls+"（うち部分送信 <b>"+part+"</b> 回） ・ タスクは止まらない ・ 書いてから入り終わるまでの最大の遅れ "+maxDelay+" ms";
      else h+="send を呼んだ回数 "+calls+" ・ 部分送信 "+part+" 回 ・ EAGAIN "+eag+" 回 ・ <b>失われた量 "+F.int(lost)+" バイト</b>"+(lost>0?' <span class="warn">受け手のバイトの列は途中が抜け、区切りを誤る</span>':' <span class="ok">いまは失われていない（空きが足りれば誤りに気づかない）</span>');
      if(md!==2&&qb>0)h+="<br>2 秒の終わりにまだ送り待ちの量 "+F.int(qb)+" バイト";
      if(over)h+='<br><span class="warn">書く速さ '+U.sig(inRate,3)+' B/s が、送り出せる速さ '+U.sig(rate.get(),3)+' B/s を超えている。どの書き方でも、いずれは待つか捨てるしかない（04 章 5 節と同じ）。</span>';
      ro.innerHTML=h;
    }
    draw();
  };

  /* (3) lwIP の RAM の見積もりと速さの上限 */
  REG.w11_lwipram=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"LWIP RAM","lwIP の受信のプール・送信のヒープと、速さの上限");
    var row=U.ctrls(el);
    var mss=U.select(row,"TCP_MSS",[{v:"536",t:"536 バイト"},{v:"1460",t:"1460 バイト"}],"1460",draw);
    var wnd=U.slider(row,"TCP_WND",{values:[1,2,3,4,6,8,11],value:4,fmt:function(k){return k+" × TCP_MSS";},onInput:draw});
    var snd=U.slider(row,"TCP_SND_BUF",{values:[1,2,3,4,6,8],value:4,fmt:function(k){return k+" × TCP_MSS";},onInput:draw});
    var row2=U.ctrls(el);
    var ncon=U.slider(row2,"同時に受け取る接続の数",{values:[1,2,3,4,6,8],value:2,fmt:function(v){return v+" 個";},onInput:draw});
    var pool=U.slider(row2,"PBUF_POOL_SIZE",{values:[4,6,8,10,12,16,20,24,32,48,64],value:12,fmt:function(v){return v+" 個";},onInput:draw});
    var rtt=U.slider(row2,"RTT",{min:1,max:500,log:true,int:true,value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var box=U.svgbox(el),ro=U.readout(el);
    U.note(el,"32 ビットのマイコン・IPv4・Ethernet として、PBUF_POOL_BUFSIZE は TCP_MSS + 54 を 4 の倍数に切り上げた値、pbuf の構造体は 16 バイトとした。送信のヒープは送るデータの写しの分だけで、実際にはセグメントごとのヘッダの空きなどが加わる。PCB・タスクのスタック・ドライバの領域は含めていない。設定名は lwIP 2.x のもの。");
    function kb(b){return U.sig(b/1024,3)+" KB";}
    function bps(b){return F.int(b)+" B/s（"+F.rate(b*8)+"）";}
    function draw(){
      var M=+mss.get(),W=wnd.get()*M,SB=snd.get()*M,n=ncon.get(),P=pool.get(),R=rtt.get()/1000;
      var bs=Math.ceil((M+54)/4)*4,elt=bs+16,poolRAM=P*elt,per=Math.ceil(W/M),need=n*per,heap=n*SB;
      var rx=W/R,tx=SB/R,poolOk=P>=need,check1=W<=P*(bs-54),check2=SB>=2*M;
      var o=[],Wd=700;
      /* 左: RAM の積み上げ */
      var mx=Math.max(16384,poolRAM+heap)*1.1,x0=20,bw=250,X=function(b){return x0+bw*b/mx;};
      o.push(S.T(x0,18,"RAM（バッファの分）","start",11,"ink",true));
      o.push(S.RECT(X(0),34,X(poolRAM)-X(0),30,3,U.soft("green"),"green",1.2));
      o.push(S.RECT(X(poolRAM),34,X(poolRAM+heap)-X(poolRAM),30,3,U.soft("purple"),"purple",1.2));
      if(X(poolRAM)-X(0)>60)o.push(S.T((X(0)+X(poolRAM))/2,53,"プール","middle",9.5,"green",true));
      if(X(poolRAM+heap)-X(poolRAM)>50)o.push(S.T((X(poolRAM)+X(poolRAM+heap))/2,53,"ヒープ","middle",9.5,"purple",true));
      o.push(S.T(x0,84,"受信のプール "+kb(poolRAM),"start",10,"green",true));
      o.push(S.T(x0,100,"送信のヒープ "+kb(heap)+" 以上","start",10,"purple",true));
      o.push(S.T(x0,118,"合計 "+kb(poolRAM+heap)+" 以上","start",10.5,"ink",true));
      var pc=poolOk?"green":"alias";
      o.push(S.T(x0,140,"ウィンドウいっぱいに受け取るのに","start",9.5,pc));
      o.push(S.T(x0,154,"要る pbuf: "+n+" × "+per+" = "+need+" 個（プールは "+P+" 個）","start",9.5,pc,true));
      /* 右: 速さと RTT */
      var p=U.plot(370,24,300,140,[1,500],[1e3,1e7],{xlog:true,ylog:true});
      o.push(p.axes({xl:"RTT [ms]",yl:"速さの上限 [B/s]",xt:[1,10,100,500],yt:[1e3,1e4,1e5,1e6,1e7],xfmt:function(v){return String(v);},yfmt:function(v){return v>=1e6?(v/1e6)+"M":v>=1e3?(v/1e3)+"k":String(v);},ylOff:44}));
      function ln(Wb,c,dsh){var pts=[];for(var k=0;k<=40;k++){var rt=Math.pow(10,k/40*Math.log10(500));var y=Wb/(rt/1000);pts.push([rt,Math.max(1e3,Math.min(1e7,y))]);}o.push(p.line(pts,c,2,dsh?"6 4":null));}
      ln(W,"green");ln(SB,"purple",true);
      var xr=p.X(rtt.get());o.push(S.L(xr,24,xr,164,"faint",1,"3 3"));
      o.push(S.D(xr,p.Y(Math.max(1e3,Math.min(1e7,rx))),"green",4.5));o.push(S.D(xr,p.Y(Math.max(1e3,Math.min(1e7,tx))),"purple",4.5));
      o.push(S.L(370,214,392,214,"green",2));o.push(S.T(398,218,"受信 ≤ TCP_WND ÷ RTT","start",9.5,"muted"));
      o.push(S.L(530,214,552,214,"purple",2,"6 4"));o.push(S.T(558,218,"送信 ≤ TCP_SND_BUF ÷ RTT","start",9.5,"muted"));
      box.set(S.svg(Wd,228,o));
      var h="PBUF_POOL_BUFSIZE = "+M+" + 54 を 4 の倍数に = <b>"+bs+"</b> バイト ・ 受信のプール = "+P+" × ("+bs+" + 16) = <b>"+F.int(poolRAM)+" バイト</b>（"+kb(poolRAM)+"）<br>"+
        "送信のヒープ ≥ 接続の数 × TCP_SND_BUF = "+n+" × "+SB+" = <b>"+F.int(heap)+" バイト</b> ・ 1 つの接続の速さの上限（RTT "+rtt.get()+" ms）: 受信 "+bps(rx)+"、送信 "+bps(tx)+"<br>";
      h+=poolOk?'<span class="ok">プールは '+n+' 個の接続のウィンドウを持てる</span>':'<span class="warn">プールが足りない: '+(n>1?n+' 個の接続が同時に':'接続が')+'ウィンドウいっぱいに受け取ると pbuf が尽き、ドライバがフレームを捨てて、TCP の再送で遅くなる</span>';
      if(!check1)h+='<br><span class="warn">TCP_WND（'+W+'）が PBUF_POOL_SIZE × (PBUF_POOL_BUFSIZE − 54) = '+P*(bs-54)+' を超える: lwIP 2.x はコンパイルのときにエラーにする</span>';
      if(!check2)h+='<br><span class="warn">TCP_SND_BUF が 2 × TCP_MSS より小さい: lwIP 2.x はコンパイルのときにエラーにする</span>';
      ro.innerHTML=h;
    }
    draw();
  };

  /* ===== 12 章 TLS ===== */
  /* 版ごとのレコードの形: ヘッダ, 送るノンス, 中の種類, タグ */
  var _w12_VERS=[{nm:"TLS 1.3（AES-GCM・ChaCha20-Poly1305）",nonce:0,inner:1,tag:16,v13:true},
                 {nm:"TLS 1.2（AES-GCM）",nonce:8,inner:0,tag:16,v13:false},
                 {nm:"TLS 1.2（ChaCha20-Poly1305）",nonce:0,inner:0,tag:16,v13:false}];
  var _w12_MAXPT=16384, _w12_MSS=1460, _w12_LOW=78;
  /* 1 回の書き込み n バイトを、レコードの列にする。pad16: TLS 1.3 で平文 + 種類を 16 の倍数にそろえる */
  function _w12_recs(n,ver,pad16){
    var out=[],left=n;
    do{var d=Math.min(left,_w12_MAXPT),inner=d+ver.inner,p=0;
      if(ver.v13&&pad16){p=Math.ceil(inner/16)*16-inner;p=Math.min(p,_w12_MAXPT+1-inner);}
      out.push({d:d,p:p,wire:5+ver.nonce+d+ver.inner+p+ver.tag});left-=d;}while(left>0);
    return out;}
  /* 欄を横に並べる（幅は px で指定。縮尺どおりでない図に使う）。fields = [[名前, 幅, 色, 値], ...]。返り値 {svg, x}（右端） */
  function _w12_fields(S,U,x,y,fields){var o=[];
    fields.forEach(function(f){o.push(S.RECT(x,y,f[1],34,4,U.soft(f[2]),f[2],1.2));
      if(f[1]>=U.tw(f[0],9.5)+4){o.push(S.T(x+f[1]/2,y+14,f[0],"middle",9.5,f[2],true));o.push(S.T(x+f[1]/2,y+28,f[3],"middle",9,"ink",false,true));}
      else{o.push(S.T(x+f[1]/2,y+22,f[3],"middle",8.5,"ink",false,true));o.push(S.T(x+f[1]/2,y+48,f[0],"middle",9,f[2],true));}
      x+=f[1];});
    return {svg:o.join(""),x:x};}
  function _w12_write(n,ver,pad16){var r=_w12_recs(n,ver,pad16),t=0;r.forEach(function(x){t+=x.wire;});
    return {recs:r,tls:t,segs:Math.ceil(t/_w12_MSS)};}

  REG.w12_record=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"RECORD","書き込みとレコード — TLS が足すバイト");
    var row=U.ctrls(el);
    var nb=U.slider(row,"1 回に書くバイト数",{min:1,max:40000,value:20,log:true,int:true,fmt:function(v){return v+" バイト";},onInput:draw});
    var nw=U.slider(row,"書く回数",{min:1,max:20,step:1,value:5,fmt:function(v){return v+" 回";},onInput:draw});
    var row2=U.ctrls(el);
    var vs=U.select(row2,"版と暗号",_w12_VERS.map(function(v){return v.nm;}),0,draw);
    var pd=U.select(row2,"TLS 1.3 の詰め物",["詰めない（OpenSSL の既定）","16 の倍数にそろえる（Mbed TLS 3.6 の既定）"],0,draw);
    var low=U.checkbox(row2,"TCP より下の層も数える（1 セグメントあたり 78 バイト）",true,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function bar(o,x,y,w,parts,total,label,lc){
      o.push(S.T(x-8,y+15,label,"end",10,lc||"ink",true));
      var xx=x;parts.forEach(function(p){if(p[0]<=0)return;var ww=Math.max(1,w*p[0]/total);o.push(S.RECT(xx,y,ww,22,3,U.soft(p[1]),p[1],1.1));
        if(ww>U.tw(p[2],9)+6)o.push(S.T(xx+ww/2,y+15,p[2],"middle",9,p[1],true));xx+=ww;});
      return xx;}
    function draw(){
      var n=nb.get(),m=nw.get(),ver=_w12_VERS[vs.get()],pad=ver.v13&&pd.get()===1,useLow=low.get();
      var one=_w12_write(n,ver,pad),k=one.recs.length,tlsAdd=one.tls-n,lowAdd=useLow?_w12_LOW*one.segs:0;
      var big=_w12_write(n*m,ver,pad),bigLow=useLow?_w12_LOW*big.segs:0;
      var wireAll=m*(one.tls+lowAdd),wireBig=big.tls+bigLow;
      var W=700,o=[];
      // 1 つ目のレコードの欄（縮尺どおりではない）
      var r0=one.recs[0],fl=[["ヘッダ",50,"teal","5 B"]];
      if(ver.nonce)fl.push(["ノンス",56,"gold","8 B"]);
      fl.push(["データ",Math.max(56,Math.min(220,r0.d*2)),"purple",F.int(r0.d)+" B"]);
      if(ver.inner)fl.push(["種類",26,"purple","1 B"]);
      if(r0.p)fl.push(["詰め物",50,"muted",r0.p+" B"]);
      fl.push(["タグ",90,"alias","16 B"]);
      var fs=_w12_fields(S,U,120,26,fl);
      o.push(S.T(112,47,"1 つ目のレコード","end",10,"ink",true));
      o.push(S.T(120,16,"欄の幅は縮尺どおりではない","start",9,"muted"));
      o.push(fs.svg);
      o.push(S.T(fs.x+10,47,"線の上 "+F.int(r0.wire)+" B","start",10,"teal",true));
      // 1 回の書き込みの内訳（バイト数に比例）
      var y=100,tot1=n+tlsAdd+lowAdd;
      bar(o,120,y,560,[[lowAdd,"muted","下の層 "+lowAdd],[tlsAdd,"teal","TLS "+tlsAdd],[n,"purple","データ "+F.int(n)]],tot1,"1 回の書き込み");
      o.push(S.T(120,y+38,"レコード "+k+" 個・セグメント "+one.segs+" 個・線の上 "+tot1+" バイト（横の長さはバイト数に比例）","start",9.5,"muted"));
      // 分けて書く場合とまとめて書く場合
      y=158;var mx=Math.max(wireAll,wireBig);
      var x1=bar(o,120,y,470*wireAll/mx,[[m*lowAdd,"muted","下の層"],[m*tlsAdd,"teal","TLS"],[m*n,"purple","データ"]],wireAll,m+" 回に分けて");
      o.push(S.T(x1+6,y+15,F.int(wireAll)+" B","start",9.5,"ink",true));
      var x2=bar(o,120,y+32,470*wireBig/mx,[[bigLow,"muted","下の層"],[big.tls-n*m,"teal","TLS"],[n*m,"purple","データ"]],wireBig,"まとめて 1 回で","green");
      o.push(S.T(x2+6,y+47,F.int(wireBig)+" B","start",9.5,"ink",true));
      box.set(S.svg(W,y+64,o));
      var per=5+ver.nonce+ver.inner+ver.tag;
      ro.innerHTML="1 つのレコードで TLS が足すのは 5 + "+(ver.nonce?"8（ノンス）":"")+(ver.inner?"1（種類）":"")+" + 16（タグ）"+(ver.nonce&&ver.inner?"":"")+" = <b>"+per+" バイト</b>"+(pad?"（詰め物を除く。いまのレコードの詰め物は "+r0.p+" バイト）":"")+"<br>"+
        "1 回に "+n+" バイトを書くと、16384 バイトずつのレコード <b>"+k+" 個</b>（⌈"+n+" / 16384⌉）になり、TLS が足すのは "+tlsAdd+" バイト"+(useLow?"、セグメント "+one.segs+" 個で下の層が "+lowAdd+" バイト":"")+"<br>"+
        m+" 回に分けて書くと: 線の上 <b>"+F.int(wireAll)+" バイト</b>、効率 <b>"+U.sig(n*m/wireAll*100,3)+" %</b> ・ まとめて "+(n*m)+" バイトを 1 回で書くと: <b>"+F.int(wireBig)+" バイト</b>、効率 <b>"+U.sig(n*m/wireBig*100,3)+" %</b>"+
        '<div class="wnote">下の層は 07 章 6 節の数え方（TCP 20・IPv4 20・Ethernet 18・線の上の前置きと間 20）。セグメントは MSS 1460 バイトで分け、書き込みごとにすぐ送るとした（10 章の Nagle などで、まとめて送られることもある）。</div>';
    }
    draw();
  };

  /* ---- 証明書の検証 ---- */
  var _w12_SC=[
    {nm:"正しいサーバ",fail:null},
    {nm:"機器の時刻が未設定（1970 年）",fail:"time"},
    {nm:"サーバの証明書の期限切れ",fail:"exp"},
    {nm:"ホスト名が違う（別の名前の正規の証明書）",fail:"host"},
    {nm:"知らない CA（攻撃者が作った CA）",fail:"ca"},
    {nm:"署名が合わない（書き換えた証明書）",fail:"sig"},
    {nm:"秘密鍵を持たない（本物の証明書を写しただけ）",fail:"key"}];
  REG.w12_verify=function(el,U){
    var S=U.S;
    U.head(el,"VERIFY","証明書の検証 — どこで止まるか");
    var row=U.ctrls(el);
    var sc=U.select(row,"場面",_w12_SC.map(function(s){return s.nm;}),0,draw);
    var row2=U.ctrls(el);
    var nohost=U.checkbox(row2,"ホスト名を確かめない（set_hostname に NULL。悪い例）",false,draw);
    var none=U.checkbox(row2,"検証そのものをしない（VERIFY_NONE。悪い例）",false,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var f=_w12_SC[sc.get()].fail,skipAll=none.get(),skipHost=nohost.get()||skipAll;
      /* 各証明書の確認: [① 署名, ② 有効期間, ③ CA, ④ トラストアンカー, ⑤ ホスト名] の結果 1 = 合格, 0 = 不合格, null = しない/対象外 */
      var certs=[
        {nm:"ルート証明書（機器が持つトラストアンカー）",sub:f==="ca"?"機器のルートとはつながらない":"Example Root CA",c:"signal",chk:[null,1,null,null,null]},
        {nm:"中間の CA の証明書（サーバが送る）",sub:f==="ca"?"Other Issuing CA（攻撃者の CA）":"Example Issuing CA",c:"gold",chk:[1,1,1,f==="ca"?0:1,null]},
        {nm:"サーバの証明書（サーバが送る）",sub:f==="host"?"attacker.example（つなぎたいのは mqtt.example.com）":"mqtt.example.com",c:"green",chk:[f==="sig"?0:1,f==="exp"?0:1,null,null,f==="host"?0:1]}];
      if(f==="time"){certs.forEach(function(c){c.chk[1]=0;});}
      var flags=0,first=null,names=["①署名","②有効期間","③CA","④トラストアンカー","⑤ホスト名"];
      certs.forEach(function(c,ci){c.chk.forEach(function(v,k){
        if(skipAll&&v!==null){c.chk[k]="skip";return;}
        if(k===4&&skipHost&&v!==null){c.chk[k]="skip";return;}
        if(v===0){if(!first)first=[ci,k];
          if(k===0||k===3)flags|=0x08;if(k===1)flags|=(f==="time"?0x200:0x01);if(k===4)flags|=0x04;}});});
      var cvFail=(f==="key");
      var W=700,o=[],x=20,w=400,ys=[20,96,172];
      certs.forEach(function(c,i){var y=ys[i];
        o.push(S.RECT(x,y,w,56,7,U.soft(c.c),c.c,1.4));
        o.push(S.T(x+10,y+18,c.nm,"start",10.5,c.c,true));
        o.push(S.T(x+10,y+34,c.sub,"start",9.5,"ink"));
        var cx=x+10;c.chk.forEach(function(v,k){if(v===null)return;
          var col=v==="skip"?"muted":(v?"green":"alias"),mark=v==="skip"?"しない":(v?"✓":"×"),lab=names[k]+" "+mark;
          var ww=U.tw(lab,9.5)+12;o.push(S.RECT(cx,y+40,ww,13,3,U.soft(col),col,1));o.push(S.T(cx+ww/2,y+50.5,lab,"middle",9,col,true));cx+=ww+6;});
        if(i<2)o.push(S.ARR(x+w-40,y+56,x+w-40,ys[i+1]-1,"teal",1.4));
      });
      var yv=244;o.push(S.RECT(x,yv,w,30,6,U.soft(cvFail?"alias":"teal"),cvFail?"alias":"teal",1.3));
      o.push(S.T(x+10,yv+19,"⑥ CertificateVerify（サーバが秘密鍵を持つか） "+(cvFail?"×":"✓"),"start",10,cvFail?"alias":"teal",true));
      // 右: ハンドシェイクのどこで止まるか
      var mx=450,steps=["ClientHello →","← ServerHello","← {Certificate}（①〜⑤）","← {CertificateVerify}（⑥）","← {Finished}","{Finished} →"];
      var stopAt=(flags&&!skipAll)?2:(cvFail?3:-1);
      o.push(S.T(mx,24,"ハンドシェイクの進み方","start",10.5,"ink",true));
      steps.forEach(function(s,i){var y=44+i*30,col=(stopAt>=0&&i>stopAt)?"faint":(i===stopAt?"alias":"ink");
        o.push(S.RECT(mx,y,220,22,5,i===stopAt?U.soft("alias"):"panel",col,1.1));o.push(S.T(mx+10,y+15,s,"start",9.5,col,i===stopAt));});
      if(stopAt>=0)o.push(S.T(mx,44+6*30+12,"ここで止まり、アラートを送って切る","start",10,"alias",true));
      else o.push(S.T(mx,44+6*30+12,"最後まで進み、接続できる","start",10,(f&&!cvFail)?"alias":"green",true));
      box.set(S.svg(W,284,o));
      var res,expl="";
      var hex=function(v){var s=v.toString(16).toUpperCase();while(s.length<8)s="0"+s;return "0x"+s;};
      if(stopAt===2){res='<span class="warn">接続できない</span>: mbedtls_ssl_handshake() は MBEDTLS_ERR_X509_CERT_VERIFY_FAILED（−0x2700）、mbedtls_ssl_get_verify_result() は <b>'+hex(flags)+'</b>（'+
        [flags&0x01?"0x01 EXPIRED（期限切れ）":"",flags&0x04?"0x04 CN_MISMATCH（ホスト名が違う）":"",flags&0x08?"0x08 NOT_TRUSTED（信頼できる CA の署名がない）":"",flags&0x200?"0x200 FUTURE（有効期間の開始前）":""].filter(Boolean).join("・")+"）";}
      else if(stopAt===3)res='<span class="warn">接続できない</span>: 証明書は正しいが、CertificateVerify の署名が証明書の公開鍵で合わない（アラート decrypt_error）';
      else if(f)res='<span class="warn">接続してしまう（危険）</span>: 偽のサーバとつながり、その者に中身を読まれ、書き換えられる';
      else res='<span class="ok">接続できる</span>: ①〜⑥ がすべて合った';
      var why={time:"機器の時計が 1970 年のままなので、どの証明書も「有効期間の開始前」に見える。TLS の前に SNTP（15 章）で時刻を合わせる。",
        exp:"期限の切れた証明書は、秘密鍵がすでに漏れているかもしれない。サーバの側で証明書を更新する。",
        host:"攻撃者が正規の CA から自分の名前で取った証明書。チェーンは正しいので、⑤ だけが偽物を見分ける。",
        ca:"攻撃者が自分で作った CA で署名した証明書。機器のトラストアンカーにつながらないので ④ で見分ける。",
        sig:"内容を書き換えた証明書。発行者の公開鍵で署名が合わないので ① で見分ける（Mbed TLS は NOT_TRUSTED として知らせる）。",
        key:"本物の証明書を写しても、対応する秘密鍵が無いので、CertificateVerify の署名を作れない。"};
      if(f)expl=why[f];
      if(skipAll)expl+=" 検証をしないと、攻撃者は自分の証明書と秘密鍵で ⑥ も通せるので、どの偽のサーバにもつながってしまう。";
      else if(skipHost&&f==="host")expl+=" ホスト名を確かめないと、正規の CA の証明書を持つ攻撃者は誰でも通ってしまう。";
      ro.innerHTML=res+(expl?"<br>"+expl:"")+'<div class="wnote">理由のビットの値は、Mbed TLS 3.6.5 の機器と OpenSSL のサーバで、わざと合わない証明書を出させて確かめたもの（「秘密鍵を持たない」場面は RFC 8446 の決まりによる）。</div>';
    }
    draw();
  };

  /* ---- 接続にかかる時間 ---- */
  var _w12_PRE=[["ソフトウェア・遅いマイコンの例",400,450,130],["ソフトウェア・速いマイコンの例",60,65,20],["暗号エンジンの例",10,12,4]];
  REG.w12_conn=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"CONNECT","接続にかかる時間 — 往復・計算・送る時間");
    var row=U.ctrls(el);
    var rt=U.slider(row,"往復時間 R",{min:5,max:1000,value:100,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.slider(row,"ビットレート",{min:1e4,max:1e8,value:1e6,log:true,fmt:function(v){return F.rate(v);},onInput:draw});
    var row2=U.ctrls(el);
    var dd=U.slider(row2,"サーバが送る証明書の枚数 d",{min:1,max:4,step:1,value:2,fmt:function(v){return v+" 枚";},onInput:draw});
    var cs=U.slider(row2,"証明書 1 枚の大きさ",{values:[300,400,470,600,800,1000,1300,1600,2000],value:470,fmt:function(v){return v+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var tk=U.slider(row3,"鍵交換 t_kx",{min:1,max:2000,value:400,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var tv=U.slider(row3,"署名の確認 1 回 t_v",{min:1,max:2000,value:450,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var tsg=U.slider(row3,"署名 1 回 t_sig",{min:1,max:2000,value:130,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var bt=U.btnrow(el);
    _w12_PRE.forEach(function(p){U.button(bt,p[0],function(){tk.set(p[1]);tv.set(p[2]);tsg.set(p[3]);draw();});});
    var row4=U.ctrls(el);
    var mu=U.checkbox(row4,"相互認証（機器も証明書を送り、署名する）",false,draw);
    var pk=U.checkbox(row4,"TLS 1.3 の再開で鍵交換も省く（psk_ke。前方秘匿性がなくなる）",false,draw);
    var sel=U.select(row4,"詳しく見る手順",["TLS 1.3（最初の接続）","TLS 1.2（最初の接続）","TLS 1.3 の再開","TLS 1.2 の再開"],0,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function model(i,P){
      var certRec13=5+17+8+P.d*(P.cs+5),certRec12=5+7+P.d*(3+P.cs),mu=P.mu&&i<2;
      var M=[{nm:"TLS 1.3",k:1,calc:P.tk+(1+P.d)*P.tv,bytes:250+(161+certRec13+101+74)+80},
             {nm:"TLS 1.2",k:2,calc:P.tk+(1+P.d)*P.tv,bytes:161+(70+certRec12+120+9)+93+242},
             {nm:"TLS 1.3 の再開",k:1,calc:P.pk?0:P.tk,bytes:521+241+80},
             {nm:"TLS 1.2 の再開",k:1,calc:0,bytes:517+141+51}][i];
      if(mu){M.calc+=P.tsig;M.bytes+=1059+(i===0?67:60);}
      M.tx=M.bytes*8/P.br*1000;M.total=(1+M.k)*P.R+M.calc+M.tx;return M;}
    function draw(){
      var P={R:rt.get(),br:br.get(),d:dd.get(),cs:cs.get(),tk:tk.get(),tv:tv.get(),tsig:tsg.get(),mu:mu.get(),pk:pk.get()};
      var Ms=[0,1,2,3].map(function(i){return model(i,P);}),sI=sel.get(),mx=Math.max.apply(null,Ms.map(function(m){return m.total;}));
      var W=700,o=[],x0=120,w=470;
      Ms.forEach(function(M,i){var y=26+i*36,on=i===sI;
        o.push(S.T(x0-8,y+15,M.nm,"end",10,on?"signal":"ink",true));
        // 時間の順: TCP の往復、ClientHello と返事の往復（送る時間を含む）、計算、（TLS 1.2 はもう 1 往復）
        var segs=[[P.R,"green","TCP"],[P.R+M.tx*(M.k===2?0.85:1),"teal","往復"],[M.calc,"signal","計算"]];
        if(M.k===2)segs.push([P.R+M.tx*0.15,"teal","往復"]);
        var x=x0;segs.forEach(function(s){var ww=w*s[0]/mx;if(ww<=0)return;o.push(S.RECT(x,y,Math.max(ww,0.8),24,2,U.soft(s[1]),s[1],on?1.8:1));
          if(ww>U.tw(s[2],9)+6)o.push(S.T(x+ww/2,y+16,s[2],"middle",9,s[1],true));x+=ww;});
        o.push(S.T(x+6,y+16,F.time(M.total/1000),"start",10,on?"signal":"ink",true));});
      o.push(S.T(x0,26+4*36+10,"横の長さは時間に比例。左から順に起きる（TLS 1.2 は計算の後にもう 1 往復）。","start",9.5,"muted"));
      box.set(S.svg(W,26+4*36+20,o));
      var M=Ms[sI],pc=M.calc/M.total*100;
      ro.innerHTML="<b>"+M.nm+"</b>: T = (1 + "+M.k+") × "+P.R+" ms + T_c "+U.sig(M.calc,4)+" ms + T_x "+U.sig(M.tx,3)+" ms = <b>"+F.time(M.total/1000)+"</b>"+
        "（計算が "+U.sig(pc,3)+" %、往復が "+U.sig((1+M.k)*P.R/M.total*100,3)+" %）<br>"+
        "T_c の中身: "+(sI<2?"鍵交換 "+P.tk+" ms + 確認 (1 + "+P.d+") × "+P.tv+" ms"+(P.mu?" + 署名 "+P.tsig+" ms":""):(sI===2?(P.pk?"なし（psk_ke）":"鍵交換 "+P.tk+" ms（確認は 0 回）"):"なし"))+
        " ・ ハンドシェイクで送るバイト ≈ "+F.int(M.bytes)+" バイト"+
        '<div class="wnote">バイト数は、例の ECDSA の証明書で測った値（OpenSSL 同士）をもとに、証明書の枚数と大きさで増減させた目安。サーバの計算と DNS（08 章）は含まない。計算の時間のボタンの値は、説明のための仮定の例である（実際の値は、マイコン・実装・暗号エンジンで大きく変わる）。</div>';
    }
    draw();
  };

  /* ---- RAM とバッファの大きさ ---- */
  REG.w12_ram=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"RAM","バッファの大きさと、受け取れるかどうか");
    var LEN=[16384,8192,4096,2048,1024,512];
    var row=U.ctrls(el);
    var inl=U.select(row,"受信のバッファ（IN_CONTENT_LEN）",LEN.map(function(v){return {v:String(v),t:v+" バイト"};}),"16384",draw);
    var outl=U.select(row,"送信のバッファ（OUT_CONTENT_LEN）",LEN.map(function(v){return {v:String(v),t:v+" バイト"};}),"16384",draw);
    var row2=U.ctrls(el);
    var mfl=U.select(row2,"max_fragment_length",[{v:"0",t:"使わない"},{v:"512",t:"512"},{v:"1024",t:"1024"},{v:"2048",t:"2048"},{v:"4096",t:"4096"}],"0",draw);
    var ver=U.select(row2,"版",["TLS 1.2","TLS 1.3"],0,draw);
    var agree=U.checkbox(row2,"サーバが max_fragment_length に応じる",true,draw);
    var row3=U.ctrls(el);
    var resp=U.slider(row3,"サーバが返すデータ",{min:50,max:20000,value:300,log:true,int:true,fmt:function(v){return v+" B";},onInput:draw});
    var cert=U.slider(row3,"サーバの Certificate",{min:600,max:6000,value:973,log:true,int:true,fmt:function(v){return v+" B";},onInput:draw});
    var row4=U.ctrls(el);
    var mut=U.checkbox(row4,"相互認証（機器も約 1 KB の証明書を送る）",false,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var IN=+inl.get(),OUT=+outl.get(),M=+mfl.get(),v13=ver.get()===1,ag=agree.get(),R=resp.get(),C=cert.get();
      var bin=IN+381,bout=OUT+381,other=OUT>=2048?16537+(25988-16537)*(OUT-2048)/(16384-2048):16537;
      var tot=bin+bout+other,msgs=[],ok=true,mflOk=true,limit;
      if(M&&M>Math.min(IN,OUT)){mflOk=false;msgs.push('<span class="warn">max_fragment_length を '+M+' にできない</span>: 受信と送信の小さいほう（'+Math.min(IN,OUT)+'）以下にする決まり（MBEDTLS_ERR_SSL_BAD_INPUT_DATA）');}
      var neg=M&&mflOk&&ag&&!v13;
      if(M&&mflOk&&ag&&v13){ok=false;msgs.push('<span class="warn">ハンドシェイクが失敗</span>: 試した Mbed TLS 3.6.5 では、TLS 1.3 でこの拡張にサーバが応じると失敗した（record_size_limit を検討する）');}
      limit=neg?M:16384;
      var need=mut.get()?1100:460;
      if(ok&&need>OUT){ok=false;msgs.push('<span class="warn">ハンドシェイクが失敗</span>: 機器が送るいちばん大きなメッセージ（約 '+need+' バイト'+(mut.get()?'、自分の証明書':'、ClientHello')+'）が送信のバッファに入らない');}
      var certRec=Math.min(C,limit),respRec=Math.min(R,limit);
      if(ok&&certRec>IN){ok=false;msgs.push('<span class="warn">ハンドシェイクで切れる</span>: サーバの Certificate のレコード（'+certRec+' バイト）が受信のバッファ（'+IN+'）に入らない');}
      if(ok&&respRec>IN){ok=false;msgs.push('<span class="warn">ハンドシェイクの後で切れる</span>: サーバが '+respRec+' バイトのレコードで返したとき、受信のバッファ（'+IN+'）に入らない');}
      if(ok)msgs.push('<span class="ok">受け取れる</span>: サーバのレコードは最大 '+Math.max(certRec,respRec)+' バイト'+(neg?'（max_fragment_length '+M+' を取り決めた）':(M&&!ag?'（サーバが応じなかったので取り決めは無い）':'')));
      var W=700,o=[],x0=120,sc=520/60000;
      [0,10,20,30,40,50,60].forEach(function(k){var xx=x0+k*1000*sc;o.push(S.L(xx,20,xx,58,"grid",1));o.push(S.T(xx,72,k+" KB","middle",9,"muted"));});
      var kb=function(v){return U.sig(v/1024,3)+" KB";};
      var x=x0;[[bin,"signal","受信 "+kb(bin)],[bout,"gold","送信 "+kb(bout)],[other,"muted","その他（目安）"]].forEach(function(s){var ww=s[0]*sc;o.push(S.RECT(x,26,ww,26,3,U.soft(s[1]),s[1],1.1));
        if(ww>U.tw(s[2],9)+6)o.push(S.T(x+ww/2,43,s[2],"middle",9,s[1],true));x+=ww;});
      o.push(S.T(x+6,43,"約 "+U.sig(tot/1024,3)+" KB","start",10.5,ok?"green":"alias",true));
      o.push(S.T(x0-8,43,"ヒープ","end",10,"ink",true));
      box.set(S.svg(W,82,o));
      ro.innerHTML="受信のバッファ "+IN+" + 381 = "+F.int(bin)+" バイト、送信のバッファ "+OUT+" + 381 = "+F.int(bout)+" バイト、合計の目安 <b>"+U.sig(tot/1024,3)+" KB</b><br>"+msgs.join("<br>")+
        '<div class="wnote">バッファの大きさ（+381 バイト）と「その他」は、Mbed TLS 3.6.5 を PC（64 ビット）で測った値と、その間を直線で結んだ目安。サーバが応じるか、TLS 1.3 で使えるかは、サーバとライブラリの版を確かめる。</div>';
    }
    draw();
  };

  /* ===== 13 章 MQTT ===== */
  /* ---- デモ 1: トピックの照合 ---- */
  function _w13_badFilter(f){
    if(!f.length)return "空のフィルタは使えない";
    var lv=f.split("/");
    for(var i=0;i<lv.length;i++){
      if(lv[i].indexOf("#")>=0&&(lv[i]!=="#"||i!==lv.length-1))return "# は最後のレベルに、それだけで置く";
      if(lv[i].indexOf("+")>=0&&lv[i]!=="+")return "+ はレベル全体を占める";
    }
    return "";
  }
  function _w13_badName(t){
    if(!t.length)return "空のトピック名は使えない";
    if(/[+#]/.test(t))return "トピック名にワイルドカードは使えない";
    return "";
  }
  /* フィルタ f とトピック名 t を、先頭からレベルごとに比べる（MQTT 3.1.1 の規則） */
  function _w13_match(f,t){
    var fl=f.split("/"),tl=t.split("/"),st=[];
    if((f[0]==="+"||f[0]==="#")&&t[0]==="$")return {ok:false,st:st,why:"$ で始まる名前に、ワイルドカードで始まるフィルタは一致しない"};
    for(var i=0;i<fl.length;i++){
      if(fl[i]==="#"){st.push({i:i,k:"hash"});return {ok:true,st:st,why:(i+1)+" つ目から後のレベル（"+Math.max(0,tl.length-i)+" 個）は # が引き受ける"};}
      if(i>=tl.length){st.push({i:i,k:"miss"});return {ok:false,st:st,why:"トピック名に "+(i+1)+" つ目のレベルが無い"};}
      if(fl[i]==="+"){st.push({i:i,k:"plus"});continue;}
      if(fl[i]===tl[i]){st.push({i:i,k:"eq"});continue;}
      st.push({i:i,k:"ne"});return {ok:false,st:st,why:(i+1)+" つ目のレベルが違う"};
    }
    if(tl.length>fl.length){for(var j=fl.length;j<tl.length;j++)st.push({i:j,k:"extra"});return {ok:false,st:st,why:"トピック名のレベルが "+(tl.length-fl.length)+" 個多い"};}
    return {ok:true,st:st,why:"すべてのレベルが合い、レベルの数も等しい"};
  }
  var _w13_NAMES=["dev/1/temp","dev/2/temp","dev/1/hum","dev/1","dev/1/temp/raw","/dev/1/temp","Dev/1/temp","$SYS/broker/uptime"];

  REG.w13_topic=function(el,U){
    var S=U.S;
    U.head(el,"TOPIC","購読のフィルタとトピック名の照合");
    var row=U.ctrls(el);
    var fs=[U.textin(row,"フィルタ A","dev/+/temp",draw),U.textin(row,"フィルタ B","dev/1/#",draw),U.textin(row,"フィルタ C","#",draw)];
    var row2=U.ctrls(el);
    var add=U.textin(row2,"トピック名を足す","dev/7/temp",draw);
    var pf=U.select(row2,"詳しく比べるフィルタ",["A","B","C"],0,draw);
    var pt=U.select(row2,"詳しく比べるトピック名",_w13_NAMES.concat(["（足したトピック名）"]),8,draw);
    var br=U.btnrow(el);
    U.button(br,"例: 機器ごと・量ごと",function(){fs[0].set("dev/+/temp");fs[1].set("dev/1/#");fs[2].set("#");draw();});
    U.button(br,"例: 空のレベルと親",function(){fs[0].set("dev/+");fs[1].set("+/+/temp");fs[2].set("dev/#");draw();});
    U.button(br,"例: 規則に反するフィルタ",function(){fs[0].set("dev+");fs[1].set("dev/#/temp");fs[2].set("$SYS/#");draw();});
    var box=U.svgbox(el,{scroll:true});var tb=U.mk("div");el.appendChild(tb);var ro=U.readout(el);
    function lvText(s){return s===""?"（空）":s;}
    function draw(){
      var F=fs.map(function(x){return x.get();}),extra=add.get(),names=_w13_NAMES.concat([extra]);
      var bad=F.map(_w13_badFilter),badN=names.map(_w13_badName);
      var head=["トピック名"].concat(F.map(function(f,j){return "ABC"[j]+": <code>"+U.esc(f)+"</code>"+(bad[j]?'<br><span class="warn">'+U.esc(bad[j])+'</span>':"");}));
      var rows=names.map(function(t,i){
        var c=["<code>"+U.esc(t)+"</code>"+(i===names.length-1?"（足した）":"")+(badN[i]?' <span class="warn">'+U.esc(badN[i])+'</span>':"")];
        F.forEach(function(f,j){
          if(bad[j]||badN[i]){c.push("—");return;}
          var m=_w13_match(f,t);c.push(m.ok?'<span class="ok">✓ 一致</span>':'<span style="color:var(--muted)">×</span>');});
        return c;});
      tb.innerHTML=U.tbl(head,rows,["left","center","center","center"]);
      /* 選んだ組をレベルごとに並べる */
      var j=pf.get(),f=F[j],t=names[pt.get()],o=[];
      if(bad[j]||badN[pt.get()]){
        box.set(S.svg(700,40,[S.T(14,24,bad[j]?"フィルタ "+"ABC"[j]+" は規則に反する: "+bad[j]:"このトピック名は使えない: "+badN[pt.get()],"start",11,"alias",true)]));
        ro.innerHTML="規則に反するフィルタやトピック名を送ると、ブローカは接続を切る。";return;
      }
      var m=_w13_match(f,t),fl=f.split("/"),tl=t.split("/"),n=Math.max(fl.length,tl.length),xs=[],x=110;
      for(var i=0;i<n;i++){var w=Math.max(54,U.tw(lvText(fl[i]||""),11,true)+18,U.tw(lvText(tl[i]||""),11,true)+18);xs.push([x,w]);x+=w+14;}
      var W=Math.max(700,x+20),yf=40,yt=118,h=28;
      o.push(S.T(100,yf+19,"フィルタ "+"ABC"[j],"end",11,"purple",true));
      o.push(S.T(100,yt+19,"トピック名","end",11,"signal",true));
      var hashAt=-1;m.st.forEach(function(s){if(s.k==="hash")hashAt=s.i;});
      for(var i2=0;i2<n;i2++){
        var X=xs[i2][0],Wd=xs[i2][1];
        if(i2<fl.length&&!(hashAt>=0&&i2>hashAt)){
          var isH=fl[i2]==="#",isP=fl[i2]==="+";
          var cw=isH?(xs[n-1][0]+xs[n-1][1]-X):Wd;
          o.push(S.RECT(X,yf,Math.max(cw,Wd),h,5,U.soft(isH?"gold":isP?"purple":"panel"),isH?"gold":"purple",1.3));
          o.push(S.T(X+(isH?Math.max(cw,Wd):Wd)/2,yf+19,lvText(fl[i2]),"middle",11,"ink",true,true));
        }
        if(i2<tl.length){
          o.push(S.RECT(X,yt,Wd,h,5,U.soft("signal"),"signal",1.3));
          o.push(S.T(X+Wd/2,yt+19,lvText(tl[i2]),"middle",11,"ink",false,true));
        }
      }
      m.st.forEach(function(s){
        var X=xs[s.i][0]+xs[s.i][1]/2;
        if(s.k==="eq"){o.push(S.L(X,yf+h,X,yt,"green",2));o.push(S.T(X+6,(yf+h+yt)/2+4,"同じ","start",9.5,"green"));}
        else if(s.k==="plus"){o.push(S.L(X,yf+h,X,yt,"purple",2,"4 3"));o.push(S.T(X+6,(yf+h+yt)/2+4,"+ が一致","start",9.5,"purple"));}
        else if(s.k==="ne"){o.push(S.L(X,yf+h,X,yt,"alias",2));o.push(S.X(X,(yf+h+yt)/2,6,"alias",2.2));o.push(S.T(X+9,(yf+h+yt)/2+4,"違う","start",9.5,"alias",true));}
        else if(s.k==="miss"){o.push(S.RECT(xs[s.i][0],yt,xs[s.i][1],h,5,"none","alias",1.3,"4 3"));o.push(S.T(X,yt+19,"（無い）","middle",10,"alias"));o.push(S.L(X,yf+h,X,yt,"alias",1.6,"4 3"));}
        else if(s.k==="extra"){o.push(S.RECT(xs[s.i][0]-2,yt-2,xs[s.i][1]+4,h+4,6,"none","alias",1.8));o.push(S.T(X,yt-8,"余る","middle",9.5,"alias",true));}
        else if(s.k==="hash"){var x0=xs[s.i][0],x1=xs[n-1][0]+xs[n-1][1];o.push(S.RECT(x0,yt+h+6,x1-x0,5,2,U.soft("gold"),"gold",1));o.push(S.T((x0+x1)/2,yt+h+22,"# が残り（"+Math.max(0,tl.length-s.i)+" 個）を引き受ける","middle",9.5,"gold",true));}
      });
      o.push(S.T(14,yt+h+48,(m.ok?"一致する": "一致しない")+": "+m.why,"start",11.5,m.ok?"green":"alias",true));
      box.set(S.svg(W,yt+h+58,o));
      ro.innerHTML="フィルタ "+"ABC"[j]+" <code>"+U.esc(f)+"</code> と <code>"+U.esc(t)+"</code>: <b>"+(m.ok?'<span class="ok">一致する</span>':'<span class="warn">一致しない</span>')+"</b>（"+U.esc(m.why)+"）";
    }
    draw();
  };

  /* ---- デモ 2: PUBLISH の組み立て ---- */
  function _w13_utf8(s){try{return Array.prototype.slice.call(new TextEncoder().encode(s));}catch(e){var o=[];for(var i=0;i<s.length;i++)o.push(s.charCodeAt(i)&255);return o;}}
  function _w13_remlen(n){var o=[];do{var d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d);}while(n>0);return o;}
  function _w13_bin7(v){var s=v.toString(2);while(s.length<7)s="0"+s;return s;}

  REG.w13_publish=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"PUBLISH","PUBLISH（QoS 0）のバイト列と、残りの長さの符号化");
    var row=U.ctrls(el);
    var tp=U.textin(row,"トピック名","dev/1/temp",draw);
    var pl=U.textin(row,"ペイロード（文字）","{\"t\":23.5,\"h\":41.25}",draw,{width:"240px"});
    var row2=U.ctrls(el);
    var ex=U.slider(row2,"ペイロードに足すバイト（中身は 00）",{min:0,max:300,step:1,value:0,fmt:function(v){return F.int(v)+" バイト";},onInput:draw});
    var br=U.btnrow(el);
    function setRem(R){var e=R-2-_w13_utf8(tp.get()).length-_w13_utf8(pl.get()).length;ex.set(Math.max(0,e));draw();}
    U.button(br,"07 章の例に戻す",function(){tp.set("dev/1/temp");pl.set("{\"t\":23.5,\"h\":41.25}");ex.set(0);draw();});
    U.button(br,"残りの長さを 127 に",function(){setRem(127);});
    U.button(br,"128 に",function(){setRem(128);});
    U.button(br,"16,383 に",function(){setRem(16383);});
    U.button(br,"16,384 に",function(){setRem(16384);});
    var hx=U.mk("div");el.appendChild(hx);var box=U.svgbox(el);var ro=U.readout(el);
    function draw(){
      var t=tp.get(),tb=_w13_utf8(t),pb=_w13_utf8(pl.get()),add=ex.get();
      var bad=_w13_badName(t)||(tb.length>65535?"トピック名が 65535 バイトを超える":"");
      var P=pb.length+add,R=2+tb.length+P,rl=_w13_remlen(R),N=1+rl.length+R;
      var head=[0x30].concat(rl,[tb.length>>8,tb.length&255],tb),bytes=head.concat(pb);
      var nh=head.length,show=Math.min(N,nh+Math.min(P,40));
      var cols=["teal"],k;for(k=0;k<rl.length;k++)cols.push("gold");cols.push("muted","muted");for(k=0;k<tb.length;k++)cols.push("purple");
      var names=["1 バイト目（PUBLISH・QoS 0）"];for(k=0;k<rl.length;k++)names.push("残りの長さ（"+(k+1)+" バイト目）");names.push("トピック名の長さ","トピック名の長さ");for(k=0;k<tb.length;k++)names.push("トピック名");
      var shown=[];for(k=0;k<show;k++)shown.push(k<bytes.length?bytes[k]:0);
      hx.innerHTML=U.hexView(shown,function(i){return i<nh?cols[i]:"green";},function(i){return i<nh?names[i]:"ペイロード";})+
        (N>show?'<div class="wnote">… 以下 '+F.int(N-show)+" バイト（ペイロードの続き）は省略</div>":"");
      /* 残りの長さの筆算 */
      var o=[],x0=12,y0=22;
      o.push(S.T(x0,y0,"残りの長さ R = 2 + "+tb.length+" + "+F.int(P)+" = "+F.int(R),"start",11.5,"ink",true));
      o.push(S.T(x0,y0+17,"（トピック名の長さの欄 + トピック名 + ペイロード）","start",9.5,"muted"));
      var g=[],v=R;do{g.push(v%128);v=Math.floor(v/128);}while(v>0);
      o.push(S.T(x0,y0+37,"R = "+g.map(function(d,i){return d+(i?" × 128"+(i>1?"^"+i:""):"");}).join(" + ")+" → 下の桁から 7 ビットずつ","start",10,"muted"));
      var cw=14,bx=x0+74;
      g.forEach(function(d,i){
        var y=y0+50+i*32,more=i<g.length-1,bits=(more?"1":"0")+_w13_bin7(d);
        o.push(S.T(bx-10,y+16,(i+1)+" バイト目","end",10,"ink",true));
        for(var b=0;b<8;b++){var c=b===0?(more?"alias":"green"):"gold";o.push(S.RECT(bx+b*cw,y,cw,24,2,U.soft(c),c,1));o.push(S.T(bx+b*cw+cw/2,y+16,bits[b],"middle",10,"ink",false,true));}
        o.push(S.T(bx+8*cw+10,y+16,"= 0x"+F.hex(rl[i])+"（"+d+"、"+(more?"続く":"終わり")+"）","start",10.5,more?"alias":"green",true));
      });
      var yb=y0+50+g.length*32+10;
      o.push(S.T(x0,yb+4,"最上位ビット: 1 = 続きがある、0 = 終わり。残りの長さの欄は "+rl.length+" バイト","start",10,"ink"));
      o.push(S.T(x0,yb+20,"（"+(R<=127?"127 以下なので 1 バイト":R<=16383?"16,383 以下なので 2 バイト":R<=2097151?"2,097,151 以下なので 3 バイト":"4 バイト")+"）","start",10,"muted"));
      box.set(S.svg(470,yb+30,o));
      var wire=N+78*Math.max(1,Math.ceil(N/1460));
      ro.innerHTML=(bad?'<span class="warn">'+U.esc(bad)+"（ブローカは接続を切る）</span><br>":"")+
        "全体 <b>"+F.int(N)+" バイト</b> = 1 バイト目 1 + 残りの長さの欄 "+rl.length+" + 残り "+F.int(R)+" ・ データ以外 <b>"+F.int(N-P)+" バイト</b> ・ データの割合 "+(N?U.sig(P/N*100,3):0)+" %<br>"+
        "07 章 5 節の数え方（Ethernet・IPv4・TCP。セグメント "+Math.max(1,Math.ceil(N/1460))+" 個）では、線の上で約 "+F.int(wire)+" バイト";
    }
    draw();
  };

  /* ---- デモ 3: QoS ごとの届き方 ---- */
  /* 送り手（機器）からブローカまでの 1 区間。メッセージは 1 つずつ送る（確認待ちは 1 個）。
     どのパケットも確率 p で、送っている途中で接続が切れて失われる。切れたらつなぎ直し、
     永続セッションなら確認の済んでいない PUBLISH（DUP = 1）か PUBREL を送り直す。クリーンセッションなら両方の側で捨てる。 */
  function _w13_qsim(U,N,qos,pers,p,seed){
    var r=U.rng(seed),ev=[],deliv=[],pkts=0,bytes=0,cuts=0,stored={};
    function send(name,up,pid,dup,m){var lost=r.chance(p);pkts++;bytes+=name==="PUBLISH"?(qos?36:34):4;ev.push({k:"p",name:name,up:up,pid:pid,dup:dup,lost:lost,m:m});return !lost;}
    function cut(m){cuts++;bytes+=19+4;ev.push({k:"cut",m:m});if(!pers)stored={};}
    function note(m,t,c){ev.push({k:"n",m:m,t:t,c:c});}
    for(var m=0;m<N;m++){
      deliv[m]=0;var pid=m%65535+1;
      if(qos===0){if(send("PUBLISH",1,0,0,m)){deliv[m]++;note(m,"渡す","green");}else{cut(m);note(m,"失われた","alias");}continue;}
      var st="pub",dup=0,guard=0;
      while(st!=="done"&&guard++<80){
        if(st==="pub"){
          if(!send("PUBLISH",1,pid,dup,m)){cut(m);if(!pers){note(m,deliv[m]?"":"失われた（捨てた）","alias");st="done";}else dup=1;continue;}
          if(qos===1){deliv[m]++;note(m,deliv[m]>1?"重複して渡す":"渡す",deliv[m]>1?"alias":"green");
            if(!send("PUBACK",0,pid,0,m)){cut(m);if(!pers)st="done";else dup=1;continue;}st="done";}
          else{if(stored[pid])note(m,"番号を覚えている → 渡さない","green");else{stored[pid]=1;deliv[m]++;note(m,"番号を覚えて渡す","green");}
            if(!send("PUBREC",0,pid,0,m)){cut(m);if(!pers)st="done";else dup=1;continue;}st="rel";}
        }else{
          if(!send("PUBREL",1,pid,0,m)){cut(m);if(!pers)st="done";continue;}
          if(stored[pid]){delete stored[pid];note(m,"番号を忘れる","purple");}
          if(!send("PUBCOMP",0,pid,0,m)){cut(m);if(!pers)st="done";continue;}st="done";
        }
      }
    }
    var once=0,dupN=0,lostN=0;deliv.forEach(function(d){if(d===1)once++;else if(d>1)dupN++;else lostN++;});
    return {ev:ev,once:once,dup:dupN,lost:lostN,pkts:pkts,bytes:bytes,cuts:cuts,N:N};
  }

  REG.w13_qos=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"QOS","QoS ごとの届き方（接続が切れると、つなぎ直す）");
    var row=U.ctrls(el);
    var q=U.seg(row,["QoS 0","QoS 1","QoS 2"],1,draw);
    var se=U.select(row,"セッション",["永続セッション（送り直す）","クリーンセッション（捨てる）"],0,draw);
    var row2=U.ctrls(el);
    var pp=U.slider(row2,"1 つのパケットの途中で接続が切れる確率",{min:0,max:40,step:1,value:15,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);var seed=13;
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el);var ro=U.readout(el);
    function draw(){
      var qos=q.get(),pers=se.get()===0,p=pp.get()/100;
      var res=_w13_qsim(U,20,qos,pers,p,seed),big=_w13_qsim(U,10000,qos,pers,p,seed+7777);
      /* シーケンス図: 最初のいくつかのメッセージ */
      var xa=170,xb=470,y0=40,dy=21,o=[],y=y0+16,last=null,maxRows=22,rows=0,shownM=0;
      o.push(S.RECT(xa-44,6,88,26,7,U.soft("signal"),"signal",1.3));o.push(S.T(xa,23,"機器","middle",11,"signal",true));
      o.push(S.RECT(xb-44,6,88,26,7,U.soft("green"),"green",1.3));o.push(S.T(xb,23,"ブローカ","middle",11,"green",true));
      var body=[];
      for(var i=0;i<res.ev.length;i++){
        var e=res.ev[i];
        if(e.k!=="n"&&rows>=maxRows)break;
        if(e.k==="p"){
          var x1=e.up?xa:xb,x2=e.up?xb:xa,y1=y,y2=y+8,lab=e.name+"（#"+(e.m+1)+(e.dup?", DUP":"")+"）";
          if(e.lost){var fx=x1+(x2-x1)*0.55,fy=y1+(y2-y1)*0.55;body.push(S.L(x1,y1,fx,fy,"alias",1.5,"5 3"));body.push(S.X(fx,fy,5,"alias",2));}
          else body.push(S.ARR(x1,y1,x2,y2,e.up?"ink":"green",1.5,6));
          body.push(S.T((x1+x2)/2,y1-3,lab,"middle",9.5,e.lost?"alias":(e.up?"ink":"green"),e.name==="PUBLISH"));
          last=y2;y+=dy;rows++;shownM=Math.max(shownM,e.m+1);
        }else if(e.k==="cut"){
          body.push(S.L(60,y-4,640,y-4,"faint",1.1,"6 4"));body.push(S.T(640,y-8,"切断 → つなぎ直す（CONNECT・CONNACK）","end",9,"muted"));
          y+=dy*0.8;rows++;
        }else if(e.k==="n"&&e.t&&last!=null){
          body.push(S.T(xb+10,last+3,e.t,"start",9.5,e.c,e.c==="alias"));
        }
      }
      o.push(S.L(xa,32,xa,y,"signal",1.2,"3 4"));o.push(S.L(xb,32,xb,y,"green",1.2,"3 4"));
      o=o.concat(body);
      o.push(S.T(350,y+14,"時間は下へ進む（最初の "+shownM+" 個のメッセージ。番号 #k は k 番目のメッセージ）","middle",9.5,"muted"));
      box.set(S.svg(700,y+22,o));
      function rate(n,N){return U.sig(n/N*100,3)+" %";}
      ro.innerHTML="20 個のうち: 1 回だけ届いた <b>"+res.once+"</b> ・ "+(res.dup?'<span class="warn">2 回以上届いた '+res.dup+"</span>":"2 回以上届いた 0")+" ・ "+(res.lost?'<span class="warn">届かなかった '+res.lost+"</span>":"届かなかった 0")+
        " ・ パケット "+res.pkts+" 個 ・ 切断 "+res.cuts+" 回 ・ MQTT の層で "+F.int(res.bytes)+" バイト（つなぎ直しの CONNECT 19・CONNACK 4 を含む）<br>"+
        "1 万個で数えると: 重複 "+rate(big.dup,big.N)+" ・ 失われた "+rate(big.lost,big.N)+" ・ 1 個あたりのパケット "+U.sig(big.pkts/big.N,3)+" 個<br>"+
        '<span style="color:var(--muted)">'+(qos===0?"QoS 0 は確認が無いので、PUBLISH の途中で切れると失われる。":qos===1?(pers?"QoS 1 は PUBACK の途中で切れると、届いていたものを送り直すので重複する。":"クリーンセッションでは確認待ちを捨てるので、PUBLISH の途中で切れたものは失われる。"):(pers?"QoS 2 は受け手が番号を覚えているので、送り直しても重複しない。":"クリーンセッションでは確認待ちを捨てるので、QoS 2 でも失われうる。"))+"</span>";
    }
    draw();
  };

  /* ---- デモ 4: キープアライブと切断に気づくまで ---- */
  /* 1 秒刻みで動かす。機器は時刻 0 につながり、per 秒ごとに QoS 0 の PUBLISH を送る（0 なら送らない）。
     PINGREQ は、送っていない時間（mode 1 では、受け取っていない時間も）が K に達したら送る。
     NAT の行は、行を通って外へ出たパケットで数え直し、Th 秒たつと消える。消えた後のパケット（CONNECT 以外）は NAT で捨てられる。
     fault: 0 なし、1 時刻 300 s に機器の電源が切れる、2 時刻 300 s に回線（NAT より先）が切れる。 */
  function _w13_kasim(K,per,Th,Tr,fault,mode,Tend){
    var TF=300,ev=[],ok=[0],line=true,alive=true;
    var dev={conn:true,lastTx:0,lastRx:0,ping:null,retry:null},natOut=0,brk={conn:true,lastRx:0};
    var res={detect:null,bclose:null,take:[],pings:0,natDead:[]};
    ev.push({t:0,k:"tx",n:"CONNECT",ok:true});
    function natAlive(t){return Th===Infinity||t-natOut<Th;}
    function send(t,n){
      dev.lastTx=t;var why=null;
      if(!natAlive(t))why="nat";else{natOut=t;ok.push(t);if(!line)why="line";}
      ev.push({t:t,k:"tx",n:n,ok:!why,why:why});
      if(!why&&brk.conn)brk.lastRx=t;
      return !why;
    }
    for(var t=1;t<=Tend;t++){
      if(fault===1&&t===TF)alive=false;
      if(fault===2&&t===TF)line=false;
      if(alive&&dev.conn){
        if(per>0&&t%per===0)send(t,"PUBLISH");
        if(dev.ping===null&&(t-dev.lastTx>=K||(mode===1&&t-dev.lastRx>=K))){
          dev.ping=t;res.pings++;
          if(send(t,"PINGREQ")){dev.lastRx=t;dev.ping=null;ev.push({t:t,k:"rx"});}
        }
        if(dev.ping!==null&&t-dev.ping>=Tr){
          ev.push({t:t,k:"detect"});if(res.detect===null&&t>=TF)res.detect=t;if(t<TF)res.early=res.early||t;
          dev.conn=false;dev.ping=null;dev.retry=t+1;
        }
      }
      if(alive&&!dev.conn&&t>=dev.retry){
        if(line){
          natOut=t;ok.push(t);dev.conn=true;dev.lastTx=t;dev.lastRx=t;
          ev.push({t:t,k:"tx",n:"CONNECT",ok:true});
          if(brk.conn)res.take.push(t);
          brk.conn=true;brk.lastRx=t;
        }else{ev.push({t:t,k:"tx",n:"CONNECT",ok:false,why:"line"});dev.retry=t+30;}
      }
      if(brk.conn&&t-brk.lastRx>=1.5*K){brk.conn=false;ev.push({t:t,k:"bclose"});if(res.bclose===null)res.bclose=t;}
    }
    /* NAT の行が消えていた区間 */
    if(Th!==Infinity){for(var i=0;i<ok.length;i++){var a=ok[i]+Th,b=i+1<ok.length?ok[i+1]:Tend;if(b>a)res.natDead.push([a,Math.min(b,Tend)]);}}
    res.ev=ev;res.TF=TF;return res;
  }

  REG.w13_ka=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"KEEPALIVE","キープアライブと、切断に気づくまでの時間");
    var row=U.ctrls(el);
    var kk=U.slider(row,"キープアライブ K",{values:[10,20,30,45,60,90,120,180,300,600],value:60,fmt:function(v){return v+" s";},onInput:draw});
    var pe=U.slider(row,"測定値を送る間隔（QoS 0）",{values:[0,10,30,60,120,300],value:0,fmt:function(v){return v?v+" s":"送らない";},onInput:draw});
    var row2=U.ctrls(el);
    var th=U.slider(row2,"NAT の保持時間 T_h",{values:[30,60,120,300,600,1800,0],value:300,fmt:function(v){return v?F.time(v):"NAT なし";},onInput:draw});
    var tr=U.slider(row2,"PINGRESP を待つ時間 T_r",{values:[2,5,10,20,30],value:10,fmt:function(v){return v+" s";},onInput:draw});
    var row3=U.ctrls(el);
    var fa=U.select(row3,"故障（時刻 300 s）",["なし","機器の電源が切れる","回線が切れる（NAT より先）"],2,draw);
    var md=U.select(row3,"PINGREQ を送る条件",["送っていない時間が K に達したら（規格の最低限）","送っていない時間か、受け取っていない時間が K に達したら"],0,draw);
    var box=U.svgbox(el,{scroll:true});var ro=U.readout(el);
    function draw(){
      var K=kk.get(),per=pe.get(),Th=th.get()||Infinity,Tr=tr.get(),fault=fa.get(),mode=md.get();
      var Tend=Math.min(1800,Math.max(900,300+1.5*K+150));
      var r=_w13_kasim(K,per,Th,Tr,fault,mode,Tend);
      var x0=150,x1=680,X=function(t){return x0+t/Tend*(x1-x0);},o=[];
      var rowsY=[46,92,134,176],names=["機器が送る","機器が受け取る","NAT の行","ブローカの接続"];
      names.forEach(function(nm,i){o.push(S.T(x0-12,rowsY[i]+4,nm,"end",10.5,"ink",true));o.push(S.L(X(0),rowsY[i],X(Tend),rowsY[i],"grid",1));});
      /* NAT の行 */
      if(Th===Infinity)o.push(S.T(X(0)+4,rowsY[2]-6,"NAT なし","start",9.5,"muted"));
      else{o.push(S.RECT(X(0),rowsY[2]-5,X(Tend)-X(0),10,2,U.soft("green"),"green",1));
        r.natDead.forEach(function(d){o.push(S.RECT(X(d[0]),rowsY[2]-5,Math.max(1.5,X(d[1])-X(d[0])),10,2,U.soft("alias"),"alias",1.2));});}
      /* ブローカの接続 */
      var bOn=0,segs=[];r.ev.forEach(function(e){if(e.k==="bclose"){segs.push([bOn,e.t]);bOn=null;}if(e.k==="tx"&&e.n==="CONNECT"&&e.ok&&bOn===null)bOn=e.t;});
      if(bOn!==null)segs.push([bOn,Tend]);
      segs.forEach(function(sg){o.push(S.RECT(X(sg[0]),rowsY[3]-5,Math.max(1.5,X(sg[1])-X(sg[0])),10,2,U.soft("teal"),"teal",1));});
      /* 送ったもの・受け取ったもの */
      r.ev.forEach(function(e){
        if(e.k==="tx"){var x=X(e.t),c=e.n==="PUBLISH"?"signal":e.n==="PINGREQ"?"teal":"purple";
          if(e.ok){if(e.n==="CONNECT")o.push(S.RECT(x-4,rowsY[0]-4,8,8,1,U.soft(c),c,1.4));else o.push(S.D(x,rowsY[0],c,e.n==="PINGREQ"?3.6:2.4));}
          else o.push(S.X(x,rowsY[0],4,e.why==="nat"?"gold":"alias",1.8));}
        else if(e.k==="rx")o.push(S.D(X(e.t),rowsY[1],"green",3));
        else if(e.k==="detect"){o.push(S.D(X(e.t),rowsY[1],"alias",5));}
        else if(e.k==="bclose"){o.push(S.D(X(e.t),rowsY[3],"alias",5));}
      });
      r.take.forEach(function(t){o.push(S.D(X(t),rowsY[3],"gold",5));});
      if(fault){o.push(S.L(X(r.TF),24,X(r.TF),rowsY[3]+10,"alias",1.5,"5 3"));o.push(S.T(X(r.TF),18,fault===1?"電源が切れる":"回線が切れる","middle",10,"alias",true));}
      /* 時間軸 */
      var ya=rowsY[3]+28,step=Tend<=900?100:200;
      o.push(S.L(X(0),ya,X(Tend),ya,"muted",1.1));
      for(var t=0;t<=Tend;t+=step){o.push(S.L(X(t),ya,X(t),ya+4,"muted",1));o.push(S.T(X(t),ya+16,String(t),"middle",9.5,"muted"));}
      o.push(S.T(x0-12,ya+16,"時刻 [s]","end",9.5,"muted"));
      var lg=[[["signal","● PUBLISH"],["teal","● PINGREQ"],["purple","■ CONNECT"],["green","● PINGRESP"]],
              [["gold","× NAT で捨てられた"],["alias","× 回線で失われた"],["alias","● 機器が気づく・ブローカが切る"],["gold","● つなぎ直しで古い接続を切る"]]];
      lg.forEach(function(line,li){var lx=14;line.forEach(function(l){o.push(S.T(lx,ya+30+li*15,l[1],"start",9.5,l[0],true));lx+=U.tw(l[1],9.5)+14;});});
      box.set(S.svg(700,ya+54,o));
      /* 読み出し */
      var gap=per>0?Math.min(per,K):K,msg=[];
      if(fault){
        msg.push("ブローカが切断に気づく: "+(r.bclose!==null&&r.bclose>=r.TF?"故障から <b>"+(r.bclose-r.TF)+" s</b>":"この範囲では気づかない")+"（上限 1.5 K = "+(1.5*K)+" s）。ウィルメッセージはこのとき出る");
        if(fault===1)msg.push("機器は電源が切れたので、何も気づかない");
        else msg.push("機器が切断に気づく: "+(r.detect!==null?"故障から <b>"+(r.detect-r.TF)+" s</b>（上限 K + T_r = "+(K+Tr)+" s）":'<span class="warn">この範囲では気づかない</span>'+(mode===0&&per>0&&per<K?"。測定値を K より短い間隔で送り続けるので PINGREQ を送らず、QoS 0 の PUBLISH には答えが無い（TCP があきらめるまで気づかない）":"")));
      }else msg.push("故障なし: ブローカの期限 1.5 K = "+(1.5*K)+" s、機器の PINGRESP の期限 T_r = "+Tr+" s");
      if(Th!==Infinity){
        if(gap>=Th)msg.push('<span class="warn">外へ送る間隔が最大 '+gap+" s で、保持時間 "+F.time(Th)+" 以上なので、NAT の行が消える（赤）。消えている間の下りは捨てられ、次のパケットも NAT で捨てられる</span>");
        else msg.push("外へ送る間隔は最大 "+gap+" s で、保持時間 "+F.time(Th)+" より短いので、NAT の行は消えない");
      }
      if(r.take.length)msg.push('<span class="warn">つなぎ直したとき、ブローカはまだ古い接続を持っていたので、それを切った（その接続のウィル offline が出る）: '+r.take.length+" 回</span>");
      msg.push("PINGREQ の数: "+r.pings+"（"+Tend+" s の間）");
      ro.innerHTML=msg.join("<br>");
    }
    draw();
  };

  /* ===== 14 章 HTTP と CoAP ===== */
  /* ---- 2 節: チャンク形式の解析器（本文の chunk_feed と同じ動き。状態の番号も同じ順） ---- */
  var _w14_SN=["長さの行（CK_SIZE）","拡張（CK_EXT）","LF を待つ（CK_LF）","データ（CK_DATA）","データの後（CK_DATA_CR）",
    "トレーラ（CK_TRAILER）","トレーラの行（CK_TRAILER_LINE）","終わり（CK_DONE）","誤り（CK_ERR）"];
  function _w14_hexv(c){if(c>=48&&c<=57)return c-48;if(c>=97&&c<=102)return c-87;if(c>=65&&c<=70)return c-55;return -1;}
  function _w14_parser(onData){
    var r={st:0,next:0,left:0,seen:0};
    r.feed=function(s,base){var i=0,n=s.length;
      while(i<n&&r.st!==7&&r.st!==8){
        if(r.st===3){var k=Math.min(n-i,r.left);onData(s.slice(i,i+k),base+i);r.left-=k;i+=k;if(r.left===0)r.st=4;continue;}
        var c=s[i++],h=_w14_hexv(c);
        switch(r.st){
          case 0: if(h>=0&&r.left<=0x0FFFFFF){r.left=r.left*16+h;r.seen=1;}
                  else if(!r.seen)r.st=8;
                  else if(c===13){r.next=r.left?3:5;r.st=2;}
                  else if(c===59||c===32||c===9)r.st=1;
                  else r.st=8; break;
          case 1: if(c===13){r.next=r.left?3:5;r.st=2;} break;
          case 2: r.st=(c===10)?r.next:8; r.seen=0; break;
          case 4: if(c===13){r.next=0;r.st=2;}else r.st=8; break;
          case 5: if(c===13){r.next=7;r.st=2;}else r.st=6; break;
          case 6: if(c===13){r.next=5;r.st=2;} break;
        }
      }
      return i;};
    return r;
  }
  function _w14_bytes(s){var b=[];for(var i=0;i<s.length;i++)b.push(s.charCodeAt(i)&255);return b;}
  function _w14_show(arr){return arr.map(function(c){return c===13?"\\r":c===10?"\\n":(c>=32&&c<127)?String.fromCharCode(c):"\\x"+("0"+c.toString(16).toUpperCase()).slice(-2);}).join("");}
  var _w14_RC={size:"gold",ext:"teal",data:"green",crlf:"muted",last:"purple",trailer:"purple",end:"purple",next:"muted"};
  var _w14_RN={size:"長さの行",ext:"拡張",data:"データ",crlf:"データの後の CR LF",last:"最後のチャンク",trailer:"トレーラ",end:"最後の空行",next:"次の応答（本文ではない）"};

  REG.w14_chunk=function(el,U){
    var BODIES=[
      {t:"測定値の記録 2 行（30 バイト、CR LF を含む）",b:_w14_bytes("t=23.5,h=41.2\r\nt=23.6,h=41.0\r\n")},
      {t:"JSON（40 バイト）",b:_w14_bytes('{"seq":1024,"t":23.5,"h":41.25,"bat":87}')},
      {t:"バイナリ（0 CR LF CR LF を含む 12 バイト）",b:[0x00,0x30,0x0D,0x0A,0x0D,0x0A,0xFF,0x41,0x0D,0x0A,0x30,0x0D]},
      {t:"長い記録（200 バイト）",b:(function(){var s="";for(var k=0;k<13;k++)s+="t="+(21+k%5)+"."+(k%10)+",h="+(40+k%7)+"."+((k*3)%10)+"\r\n";return _w14_bytes(s+"end\r\n");})()}];
    U.head(el,"CHUNKED","チャンク形式 — どこで分かれて届いても、取り出す本文は同じ");
    var row=U.ctrls(el);
    var bd=U.select(row,"本文",BODIES.map(function(x){return x.t;}),0,rebuild);
    var cs=U.slider(row,"チャンクの大きさ",{values:[1,2,4,8,15,16,32,64,256],value:15,fmt:function(v){return v+" バイト";},onInput:rebuild});
    var row2=U.ctrls(el);
    var md=U.select(row2,"TCP から受け取る 1 回分",["まとめて 1 回","1 バイトずつ","乱数（1〜5 バイト）","乱数（1〜20 バイト）"],3,rebuild);
    var cr=U.select(row2,"壊し方",["壊さない","1 つ目の長さの行に 1 を足す（F → 1F）","1 つ目のデータの後の CR LF を落とす","最後のチャンクが届く前に切れる","長さに 16 進でない文字（G）"],0,rebuild);
    var et=U.checkbox(row2,"拡張とトレーラを付ける（正しい形）",false,rebuild);
    var br=U.btnrow(el);
    U.button(br,"最初から",function(){reset();render();});
    U.button(br,"1 回分ずつ進める",function(){step();render();});
    U.button(br,"最後まで",function(){while(pos<pieces.length)step();render();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rebuild();});
    var stream=U.mk("div","wsvg");stream.style.padding=".5rem";el.appendChild(stream);
    var ro=U.readout(el);
    var seed=3,enc=null,pieces=[],pos=0,P=null,out=[],calls=[],used=0;
    function build(body,c,extTr,corrupt){
      var b=[],role=[];
      function push(arr,rl){arr.forEach(function(x){b.push(x);role.push(rl);});}
      var i=0,first=true;
      while(i<body.length){var n=Math.min(c,body.length-i),hx=n.toString(16).toUpperCase();
        if(first&&corrupt===1)hx="1"+hx;
        if(first&&corrupt===4)hx="G"+hx.slice(1);
        push(_w14_bytes(hx),"size");
        if(extTr&&first)push(_w14_bytes(";q=1"),"ext");
        push([13,10],"size");
        push(body.slice(i,i+n),"data");
        if(!(first&&corrupt===2))push([13,10],"crlf");
        i+=n;first=false;}
      if(corrupt!==3){
        push(_w14_bytes("0"),"last");push([13,10],"last");
        if(extTr)push(_w14_bytes("X-Count: 2\r\n"),"trailer");
        push([13,10],"end");
        push(_w14_bytes("HTTP/1.1 200 OK\r\n"),"next");}
      return {b:b,role:role};
    }
    function rebuild(){
      var body=BODIES[bd.get()].b;
      enc=build(body,cs.get(),et.get(),cr.get());enc.body=body;
      var r=U.rng(seed*7919+bd.get()*31+md.get()*7+cs.get()),m=md.get(),i=0;pieces=[];
      while(i<enc.b.length){var n=m===0?enc.b.length:m===1?1:m===2?1+r.int(5):1+r.int(20);n=Math.min(n,enc.b.length-i);pieces.push({a:i,n:n});i+=n;}
      reset();while(pos<pieces.length)step();render();
    }
    function reset(){pos=0;out=[];calls=[];used=0;P=_w14_parser(function(arr,base){out=out.concat(arr);calls.length&&calls[calls.length-1].d.push(arr.length);});}
    function step(){
      if(pos>=pieces.length)return;
      var pc=pieces[pos++],s=enc.b.slice(pc.a,pc.a+pc.n),before=P.st;
      if(P.st===7||P.st===8){calls.push({n:pc.n,u:0,d:[],st:P.st,skip:true});return;}
      calls.push({n:pc.n,u:0,d:[],st:0});
      var u=P.feed(s,pc.a);calls[calls.length-1].u=u;calls[calls.length-1].st=P.st;used+=u;
    }
    function render(){
      var starts={};pieces.forEach(function(p){starts[p.a]=1;});
      var done=pos>0?pieces[pos-1].a+pieces[pos-1].n:0;
      var h='<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-bottom:.3rem">届いたバイト（青い縦線 = 解析器に渡す 1 回分の区切り。薄いバイトはまだ渡していない。点線の枠は、解析器が使わずに残したバイト）</div><div class="hex">';
      enc.b.forEach(function(c,i){var rl=enc.role[i],col=_w14_RC[rl],lab=c===13?"CR":c===10?"LF":c===32?"SP":(c>=33&&c<127)?U.esc(String.fromCharCode(c)):U.fmt.hex(c);
        var small=(c===13||c===10||c===32||!(c>=33&&c<127));
        var st="background:"+(rl==="next"?"var(--screen)":U.soft(col))+";border-color:"+U.col(col)+";";
        if(i>=done)st+="opacity:.35;";
        else if(i>=used)st+="border-style:dashed;border-color:var(--alias);";
        if(starts[i]&&i>0)st+="box-shadow:-3px 0 0 0 var(--signal);margin-left:5px;";
        if(small)st+="font-size:.62rem;";
        h+='<span style="'+st+'" title="'+(_w14_RN[rl]||"")+' 0x'+U.fmt.hex(c)+'">'+lab+'</span>';});
      h+='</div><div class="legend">'+["size","ext","data","crlf","last","next"].map(function(k){return '<span><b style="color:'+U.col(_w14_RC[k])+'">■</b> '+_w14_RN[k]+'</span>';}).join("")+'</div>';
      stream.innerHTML=h;
      var body=enc.body,same=out.length===body.length&&out.every(function(x,i){return x===body[i];});
      var allIn=pos>=pieces.length,st=P.st,msg;
      if(st===7)msg='<span class="ok">本文の終わり（CK_DONE）</span>。使ったバイト '+used+'、渡したバイトのうち残りの '+(done-used)+' バイトは、次の応答の解析に回す';
      else if(st===8)msg='<span class="warn">誤り（CK_ERR）</span>。形が規格と違うので、この応答は捨ててコネクションを閉じる';
      else if(allIn)msg='<span class="warn">届いたバイトが尽きたが、本文はまだ終わっていない</span>（最後のチャンクが来ていないので、途中で切れたと分かる）';
      else msg="まだ途中（次の 1 回分を待つ）";
      var rows=[],skipped=0,skipB=0;
      calls.forEach(function(c,i){if(c.skip){skipped++;skipB+=c.n;return;}rows.push([String(i+1),c.n+" バイト",c.u+" バイト",c.d.length?c.d.join(" + ")+" バイト":"—",_w14_SN[c.st]]);});
      if(skipped)rows.push(["…",skipB+" バイト","—","—","（"+skipped+" 回分は、次の応答の解析へ渡す）"]);
      ro.innerHTML="本文 "+body.length+" バイト → チャンク形式で "+enc.role.filter(function(r){return r!=="next";}).length+" バイト ・ 解析器に渡した回数 <b>"+calls.length+"</b> / "+pieces.length+
        " ・ いまの状態 <b>"+_w14_SN[st]+"</b>"+(st===3?"（データの読み残し "+P.left+" バイト）":"")+"<br>"+msg+"<br>"+
        "取り出した本文（"+out.length+" バイト。\\r\\n は CR LF）: <code>"+U.esc(_w14_show(out))+"</code>"+(st===7?(same?' <span class="ok">元の本文と一致</span>':' <span class="warn">元の本文と違う</span>'):"")+
        U.tbl(["#","渡した大きさ","使った大きさ","on_data で渡した大きさ","渡した後の状態"],rows,["right","right","right","left","left"])+
        '<div class="wnote">区切り方を変えても、取り出す本文・使ったバイトの数・最後の状態は変わらない（解析器が、読みかけの状態を覚えているため）。分け方によって変わるのは、データを何回に分けて渡したかだけである。</div>';
    }
    rebuild();
  };

  /* ---- 5 節: CoAP の再送 ---- */
  /* 1 回の交換。p: 1 回の送信が失われる確率、rtt [s]、at・rf・mr: ACK_TIMEOUT・ACK_RANDOM_FACTOR・MAX_RETRANSMIT */
  function _w14_exchange(r,p,rtt,at,rf,mr,log){
    var T0=at*(1+(rf-1)*r.next()),tg=(Math.pow(2,mr+1)-1)*T0,done=Infinity,got=false,dup=0,sent=0,okAt=0;
    for(var j=0;j<=mr;j++){var tj=(Math.pow(2,j)-1)*T0;if(tj>=done)break;sent++;
      var conOk=!r.chance(p),ackOk=false,isDup=false;
      if(conOk){if(got){dup++;isDup=true;}else got=true;ackOk=!r.chance(p);if(ackOk&&tj+rtt<done){done=tj+rtt;okAt=j+1;}}
      if(log)log.push({t:tj,conOk:conOk,ackOk:ackOk,dup:isDup});}
    var ok=done<=tg;
    return {T0:T0,tg:tg,ok:ok,t:ok?done:tg,k:ok?okAt:0,sent:sent,dup:dup};
  }

  REG.w14_coap=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"COAP","CON の再送 — 喪失の確率と 3 つの定数を変える");
    var row=U.ctrls(el);
    var pl=U.slider(row,"1 回の送信が失われる確率 p（往き・帰りとも）",{min:0,max:60,step:1,value:20,fmt:function(v){return v+" %";},onInput:draw});
    var rt=U.slider(row,"往復時間 RTT",{values:[0.05,0.1,0.2,0.5,1,2],value:0.2,fmt:function(v){return F.time(v);},onInput:draw});
    var row2=U.ctrls(el);
    var at=U.slider(row2,"ACK_TIMEOUT",{values:[1,1.5,2,3,4],value:2,fmt:function(v){return v+" s";},onInput:draw});
    var rf=U.slider(row2,"ACK_RANDOM_FACTOR",{values:[1,1.25,1.5,2],value:1.5,fmt:function(v){return String(v);},onInput:draw});
    var mr=U.slider(row2,"MAX_RETRANSMIT",{min:0,max:8,step:1,value:4,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"規格の既定値に戻す",function(){at.set(2);rf.set(1.5);mr.set(4);draw();});
    var box=U.svgbox(el),box2=U.svgbox(el),ro=U.readout(el);
    var seed=1;
    for(var sd=1;sd<500;sd++){var lg=[],ex=_w14_exchange(U.rng(sd*101+7),0.2,0.2,2,1.5,4,lg);
      if(ex.ok&&lg.length>=3&&lg.some(function(a){return a.dup;})){seed=sd;break;}}
    function draw(){
      var p=pl.get()/100,rtt=rt.get(),A=at.get(),R=rf.get(),M=mr.get();
      var span=A*(Math.pow(2,M)-1)*R,wait=A*(Math.pow(2,M+1)-1)*R;
      /* 1 回の交換の様子 */
      var log=[],e=_w14_exchange(U.rng(seed*101+7),p,rtt,A,R,M,log);
      var tmax=Math.max(e.ok?e.t:e.tg,1)*1.08,x0=110,x1=680,X=function(t){return x0+(x1-x0)*Math.min(t,tmax)/tmax;};
      var ys=46,yc=118,o=[];
      o.push(S.T(x0-10,ys+4,"サーバ","end",10.5,"green",true));o.push(S.T(x0-10,yc+4,"クライアント","end",10.5,"signal",true));
      o.push(S.L(x0,ys,x1,ys,"green",1.4));o.push(S.L(x0,yc,x1,yc,"signal",1.4));
      log.forEach(function(a,j){var t1=a.t,t2=a.t+rtt/2,t3=a.t+rtt;
        o.push(S.T(X(t1),yc+16,String(j+1),"middle",9.5,"gold",true));
        if(a.conOk){o.push(S.ARR(X(t1),yc-2,X(t2),ys+3,"ink",1.5,6));
          if(a.dup)o.push(S.T(X(t2),ys-8,"重複: 同じ ACK","middle",9,"gold",true));
          if(a.ackOk)o.push(S.ARR(X(t2),ys+3,X(t3),yc-3,"green",1.5,6));
          else{var fx=X(t2)+(X(t3)-X(t2))*0.55,fy=ys+(yc-ys)*0.55;o.push(S.L(X(t2),ys+3,fx,fy,"alias",1.5,"4 3"));o.push(S.X(fx,fy,4,"alias",2));}}
        else{var gx=X(t1)+(X(t2)-X(t1))*0.55,gy=yc-(yc-ys)*0.55;o.push(S.L(X(t1),yc-2,gx,gy,"alias",1.5,"4 3"));o.push(S.X(gx,gy,4,"alias",2));}
      });
      var lx=function(x){return Math.max(x0+70,Math.min(x,x1-70));};
      if(e.ok){o.push(S.D(X(e.t),yc,"green",5));o.push(S.T(lx(X(e.t)),yc+30,"ACK が届いた（"+F.time(e.t)+"）","middle",10,"green",true));}
      else{o.push(S.X(X(e.tg),yc,6,"alias",2.4));o.push(S.T(lx(X(e.tg)),yc+30,"諦める（"+F.time(e.tg)+"）","middle",10,"alias",true));}
      var ya=yc+44;o.push(S.L(x0,ya,x1,ya,"muted",1));
      U.nice(0,tmax,6).forEach(function(t){o.push(S.L(X(t),ya,X(t),ya+4,"muted",1));o.push(S.T(X(t),ya+15,F.time(t,2),"middle",9,"muted"));});
      o.push(S.T(x0,18,"1 回の交換（この乱数では最初の待ち時間が "+F.time(e.T0,3)+"。番号は何回目の送信か）","start",10,"ink",true));
      box.set(S.svg(700,ya+24,o));
      /* たくさんの交換 */
      var N=20000,r=U.rng(seed*7919+3),cnt=[],fail=0,times=[],sent=0,dup=0;for(var k=0;k<=M+1;k++)cnt.push(0);
      for(var i=0;i<N;i++){var q=_w14_exchange(r,p,rtt,A,R,M,null);sent+=q.sent;dup+=q.dup;if(q.ok){cnt[q.k]++;times.push(q.t);}else fail++;}
      times.sort(function(a,b){return a-b;});
      var s=(1-p)*(1-p),pf=Math.pow(1-s,M+1);
      var o2=[],bx0=60,bw=Math.min(36,240/(M+2)),pk=U.plot(bx0,24,(M+2)*(bw+6),150,[0,M+2],[0,1]);
      o2.push(S.T(bx0,14,"何回目の送信で ACK が届いたか（点は式の値）","start",10,"ink",true));
      for(var m2=0;m2<=M+1;m2++){var frac=m2<=M?cnt[m2+1]/N:fail/N,th=m2<=M?Math.pow(1-s,m2)*s:pf,xx=bx0+m2*(bw+6),hh=150*frac,c=m2<=M?"green":"alias";
        o2.push(S.RECT(xx,24+150-hh,bw,Math.max(hh,0.5),2,U.soft(c),c,1.1));
        o2.push(S.D(xx+bw/2,24+150-150*th,"ink",3));
        o2.push(S.T(xx+bw/2,24+150+14,m2<=M?String(m2+1):"失敗","middle",9.5,c,true));}
      o2.push(S.L(bx0,174,bx0+(M+2)*(bw+6),174,"muted",1));
      o2.push(S.T(bx0-6,28,"100 %","end",9,"muted"));o2.push(S.T(bx0-6,178,"0","end",9,"muted"));
      /* 完了までの時間のヒストグラム */
      var hx0=380,hw=300,nb=40,tm=Math.max(wait,1),bins=[];for(var b=0;b<nb;b++)bins.push(0);
      times.forEach(function(t){bins[Math.min(nb-1,Math.floor(t/tm*nb))]++;});
      var bmax=Math.max.apply(null,bins.concat([fail,1]));
      o2.push(S.T(hx0,14,"ACK が届くまでの時間の分布（縦は対数）","start",10,"ink",true));
      var Y=function(c){return c<=0?174:174-150*Math.log10(1+c)/Math.log10(1+bmax);};
      bins.forEach(function(c,b){if(c>0)o2.push(S.RECT(hx0+b*hw/nb,Y(c),hw/nb-1,174-Y(c),1,U.soft("green"),"green",0.8));});
      o2.push(S.L(hx0,174,hx0+hw,174,"muted",1));
      U.nice(0,tm,5).forEach(function(t){var xx=hx0+hw*t/tm;o2.push(S.L(xx,174,xx,178,"muted",1));o2.push(S.T(xx,189,F.time(t,2),"middle",9,"muted"));});
      var xs=hx0+hw*span/tm;o2.push(S.L(xs,20,xs,174,"gold",1.2,"4 3"));o2.push(S.T(xs-4,34,"最後の再送 "+F.time(span,3),"end",9,"gold"));
      box2.set(S.svg(700,198,o2));
      var pct=function(a){return times.length?F.time(times[Math.min(times.length-1,Math.floor(a*times.length))],3):"—";};
      ro.innerHTML="最初の待ち時間 T<sub>0</sub> = "+A+"〜"+U.sig(A*R,3)+" s の乱数 ・ 最後の再送は "+U.sig(span,3)+" s 以内（MAX_TRANSMIT_SPAN） ・ 諦めるのは "+U.sig(wait,3)+" s 以内（MAX_TRANSMIT_WAIT）<br>"+
        "1 回の送信で ACK まで届く確率 s = (1 − p)² = <b>"+U.sig(s,3)+"</b> ・ "+N.toLocaleString("en-US")+" 回の交換のうち失敗 <b>"+F.pct(fail/N,3)+"</b>（式 (1 − s)<sup>"+(M+1)+"</sup> = "+F.pct(pf,3)+"）<br>"+
        "1 回の交換で送った CON の平均 <b>"+U.sig(sent/N,3)+"</b> 回 ・ サーバに届いた重複の平均 "+U.sig(dup/N,3)+" 個 ・ 成功したときの時間: 中央 "+pct(0.5)+"、95 % "+pct(0.95)+
        '<div class="wnote">重複は、CON は届いたが ACK が失われたときに起きる。サーバはメッセージ ID で重複に気づき、要求を処理し直さずに同じ ACK を返す。式の値は、往復時間が待ち時間より短いときのもの。</div>';
    }
    draw();
  };

  /* ---- 6 節: 3 つのプロトコルの比較 ---- */
  function _w14_wire(ip){return Math.max(ip,46)+38;}          /* IPv4 のパケットの長さ → Ethernet の線の上のバイト（07 章 5 節） */
  function _w14_B(v){return Math.round(v).toLocaleString("en-US")+" バイト";}
  function _w14_coapOpts(name){var n=0;name.split("/").forEach(function(sg){if(!sg.length)return;var L=sg.length;n+=1+(L>=269?2:L>=13?1:0)+L;});return n;}

  REG.w14_cmp=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"COMPARE","1 回の報告と 1 日に送るバイト — HTTP・MQTT・CoAP");
    var row=U.ctrls(el);
    var dz=U.slider(row,"データの大きさ",{min:1,max:1000,value:20,log:true,int:true,fmt:function(v){return v+" バイト";},onInput:draw});
    var nm=U.textin(row,"名前（パス・トピック）","dev/1/temp",draw);
    var row2=U.ctrls(el);
    var iv=U.slider(row2,"報告の間隔",{values:[10,30,60,300,600,1800,3600],value:600,fmt:function(v){return F.time(v);},onInput:draw});
    var dl=U.select(row2,"下りの命令",["待たない","待つ"],1,draw);
    var row3=U.ctrls(el);
    var tk=U.slider(row3,"キープアライブ・問い合わせの間隔 Tk",{values:[10,30,60,120,300,600],value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var hc=U.select(row3,"HTTP のコネクション",["報告や問い合わせのたびに張って閉じる","張ったまま使い続ける"],1,draw);
    var box=U.svgbox(el),box2=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var n=dz.get(),name=nm.get().replace(/^\/+/,"").slice(0,200)||"x",I=iv.get(),Tk=tk.get(),down=dl.get()===1,reconn=hc.get()===0;
      var ACK=84,CONN=7*84,D=86400,Rn=D/I;
      var httpH=(6+name.length+11)+19+(16+String(n).length+2)+2,rsp204=64,poll=46;
      var rl=function(x){return x<128?1:x<16384?2:x<2097152?3:4;};
      var mq0=1+rl(2+name.length+n)+2+name.length+n,mq1=1+rl(4+name.length+n)+4+name.length+n;
      var co=4+1+_w14_coapOpts(name)+2+(n>0?1+n:0);
      /* 1 回の報告: [名前, アプリ層のヘッダ, データ, 下の層, 応答と確認応答のフレーム, フレームの数] */
      var V=[["HTTP",httpH,n,_w14_wire(40+httpH+n)-httpH-n,[_w14_wire(40+rsp204),ACK],"HTTP"],
             ["MQTT QoS 0",mq0-n,n,_w14_wire(40+mq0)-mq0,[ACK],"MQTT"],
             ["MQTT QoS 1",mq1-n,n,_w14_wire(40+mq1)-mq1,[ACK,ACK],"MQTT"],
             ["CoAP NON",co-n,n,_w14_wire(28+co)-co,[],"CoAP"],
             ["CoAP CON",co-n,n,_w14_wire(28+co)-co,[ACK],"CoAP"]];
      var per=V.map(function(v){return v[1]+v[2]+v[3]+v[4].reduce(function(a,b){return a+b;},0);});
      var pmax=Math.max.apply(null,per),o=[],x0=120,sc=520/pmax;
      o.push(S.T(x0,14,"1 回の報告で線の上に出るバイト（IPv4・Ethernet。07 章 5 節の数え方）","start",10,"muted"));
      V.forEach(function(v,i){var y=24+i*34,x=x0;o.push(S.T(x0-8,y+15,v[0],"end",10.5,"ink",true));
        [[v[1],"purple"],[v[2],"ink"],[v[3],"muted"]].forEach(function(q){o.push(S.RECT(x,y,q[0]*sc,20,2,q[1]==="ink"?"panel":U.soft(q[1]),q[1],1));x+=q[0]*sc;});
        v[4].forEach(function(f){o.push(S.RECT(x,y,f*sc,20,2,U.soft("green"),"green",1));x+=f*sc;});
        o.push(S.T(x+6,y+15,String(per[i]),"start",10,"ink",true));});
      var yl=24+5*34+8,lx=x0;
      [["purple","アプリケーション層のヘッダ"],["ink","データ"],["muted","下の層のヘッダと線の上の分"],["green","応答・確認応答"]].forEach(function(q){
        o.push(S.RECT(lx,yl-9,10,10,2,q[0]==="ink"?"panel":U.soft(q[0]),q[0],1.1));o.push(S.T(lx+15,yl,q[1],"start",9.5,"muted"));lx+=25+U.tw(q[1],9.5)+8;});
      box.set(S.svg(700,yl+10,o));
      /* 1 日 */
      var pingsPerInt=I>Tk?Math.ceil(I/Tk-1e-9)-1:0,pings=Rn*pingsPerInt,polls=down?D/Tk:0;
      var pollB=_w14_wire(40+poll)+_w14_wire(40+rsp204)+ACK;
      var rowsD=V.map(function(v,i){var rep=Rn*per[i],con=0,ka=0,fr=Rn*(1+v[4].length),dly;
        if(v[5]==="HTTP"){if(reconn){con=Rn*CONN;fr+=Rn*7;}if(down){ka=polls*pollB+(reconn?polls*CONN:0);fr+=polls*(3+(reconn?7:0));dly=F.time(Tk);}else dly="届けられない";}
        else if(v[5]==="MQTT"){ka=pings*3*ACK;fr+=pings*3;dly="すぐ（RTT 程度）";}
        else{if(down){ka=pings*2*ACK;fr+=pings*2;dly="すぐ（行が保たれていれば）";}else dly="届けられない";}
        return {name:v[0],rep:rep,con:con,ka:ka,tot:rep+con+ka,fr:fr,dly:dly};});
      var dmax=Math.max.apply(null,rowsD.map(function(r){return r.tot;})),o2=[],sc2=470/dmax;
      o2.push(S.T(x0,14,"1 日に線の上に出るバイト（報告 "+U.fmt.int(Rn)+" 回、問い合わせ・キープアライブの間隔 "+F.time(Tk)+"）","start",10,"muted"));
      rowsD.forEach(function(r,i){var y=24+i*30,x=x0;o2.push(S.T(x0-8,y+14,r.name,"end",10.5,"ink",true));
        [[r.rep,"purple"],[r.con,"gold"],[r.ka,"teal"]].forEach(function(q){if(q[0]>0){o2.push(S.RECT(x,y,q[0]*sc2,18,2,U.soft(q[1]),q[1],1));x+=q[0]*sc2;}});
        o2.push(S.T(x+6,y+14,_w14_B(r.tot),"start",10,"ink",true));});
      var yl2=24+5*30+8;lx=x0;
      [["purple","報告"],["gold","コネクションを張る・閉じる"],["teal","問い合わせ・キープアライブ"]].forEach(function(q){
        o2.push(S.RECT(lx,yl2-9,10,10,2,U.soft(q[0]),q[0],1.1));o2.push(S.T(lx+15,yl2,q[1],"start",9.5,"muted"));lx+=25+U.tw(q[1],9.5)+8;});
      box2.set(S.svg(700,yl2+10,o2));
      ro.innerHTML="アプリケーション層のヘッダ: HTTP "+httpH+" バイト（POST の要求行・Host・Content-Length と空行）、MQTT "+(mq0-n)+"〜"+(mq1-n)+" バイト、CoAP "+(co-n)+" バイト（トークン 1 バイト・Uri-Path・Content-Format）"+
        U.tbl(["方式","1 回の報告","1 日の合計","1 日のフレームの数","下りの命令の最大の遅れ"],
          rowsD.map(function(r,i){return [r.name,_w14_B(per[i]),"<b>"+_w14_B(r.tot)+"</b>",U.fmt.int(r.fr),r.dly];}),
          ["left","right","right","right","left"])+
        '<div class="wnote">仮定: 応答や確認応答だけのセグメント・データグラムは、詰め物をして 1 つ 84 バイト分。HTTP の応答は Date の欄だけの 204（64 バイト）、命令の問い合わせは GET /dev/1/cmd（46 バイト）で、その応答も 204 とした。'+
        'コネクションを張る・閉じるのは小さなセグメント 7 つ（10 章）。MQTT はコネクションを保ち、報告の無い Tk ごとにキープアライブの往復（MQTT の 2 バイトのパケットを運ぶセグメント 2 つと、TCP の ACK）を送る。CoAP で下りを待つときは、Tk ごとに空の CON を送り、RST が返る（変換表の行を保つ）。'+
        'TLS・DTLS は含めていない（使うと、1 レコードごとの増加と、コネクションを張るたびのハンドシェイク（楕円曲線の証明書でも 1.6 KB ほど。12 章 3 節）が加わる）。</div>';
    }
    draw();
  };

  /* ===== 15 章 クラウドとつなぎ続ける ===== */
  function _w15_s(v){return (v>0?"+":v<0?"−":"")+Math.abs(v).toFixed(3)+" s";}

  /* ---- 1 節: 4 つの時刻からずれと往復の遅延を求める ---- */
  REG.w15_sntp=function(el,U){
    var S=U.S;
    U.head(el,"SNTP","4 つの時刻から、ずれ θ と往復の遅延 δ を求める");
    var r1=U.ctrls(el);
    var th=U.slider(r1,"本当のずれ θ（サーバ − 機器）",{min:-3,max:3,step:0.01,value:1.5,fmt:function(v){return (v>0?"+":v<0?"−":"")+Math.abs(v).toFixed(2)+" s";},onInput:draw});
    var pr=U.slider(r1,"サーバの処理時間",{min:0,max:50,step:1,value:2,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var d1=U.slider(r2,"往きの遅延 d1",{min:1,max:500,log:true,int:true,value:30,fmt:function(v){return v+" ms";},onInput:draw});
    var d2=U.slider(r2,"帰りの遅延 d2",{min:1,max:500,log:true,int:true,value:10,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"例の値（1.5 s・30 ms・10 ms・2 ms）",function(){th.set(1.5);d1.set(30);d2.set(10);pr.set(2);draw();});
    U.button(br,"往きと帰りを等しくする",function(){var m=Math.round((d1.get()+d2.get())/2);d1.set(m);d2.set(m);draw();});
    U.button(br,"帰りだけ遅い（往き 1 ms・帰り 200 ms）",function(){d1.set(1);d2.set(200);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var TH=th.get(),D1=d1.get()/1000,D2=d2.get()/1000,P=pr.get()/1000;
      var T1=10,T2=T1+D1+TH,T3=T2+P,T4=T3-TH+D2;
      var est=((T2-T1)+(T3-T4))/2,del=(T4-T1)-(T3-T2),err=est-TH;
      var W=700,o=[],yd=58,ys=158,x0=150,x1=470,tot=D1+P+D2,sc=(x1-x0)/tot;
      var X=function(t){return x0+t*sc;};
      var a1=X(0),a2=X(D1),a3=X(D1+P),a4=X(tot);
      o.push(S.T(16,yd-8,"機器の時計","start",11,"signal",true));
      o.push(S.T(16,ys-8,"サーバの時計","start",11,"green",true));
      o.push(S.ARR(16,yd,x1+40,yd,"signal",1.5,6));o.push(S.ARR(16,ys,x1+40,ys,"green",1.5,6));
      o.push(S.ARR(a1,yd,a2,ys,"signal",1.8));o.push(S.ARR(a3,ys,a4,yd,"green",1.8));
      [[a1,yd],[a4,yd],[a2,ys],[a3,ys]].forEach(function(p){o.push(S.D(p[0],p[1],"ink",3.6));});
      o.push(S.T(a1,yd-10,"T1 = "+T1.toFixed(3),"middle",10.5,"signal",true,true));
      o.push(S.T(Math.max(a4,a1+100),yd-10,"T4 = "+T4.toFixed(3),"middle",10.5,"signal",true,true));
      var close=(a3-a2)<100;
      o.push(S.T(a2-(close?4:0),ys+17,"T2 = "+T2.toFixed(3),close?"end":"middle",10.5,"green",true,true));
      o.push(S.T(a3+(close?4:0),ys+(close?17:31),"T3 = "+T3.toFixed(3),close?"start":"middle",10.5,"green",true,true));
      o.push(S.T((a1+a2)/2-6,(yd+ys)/2-4,"d1 = "+Math.round(D1*1000)+" ms","end",10,"signal"));
      o.push(S.T((a3+a4)/2+6,(yd+ys)/2-4,"d2 = "+Math.round(D2*1000)+" ms","start",10,"green"));
      /* 右: 計算 */
      var xr=530,yr=58,lh=19;
      var L=[["T2 − T1 = θ + d1",_w15_s(T2-T1),"ink"],["T3 − T4 = θ − d2",_w15_s(T3-T4),"ink"],["求めたずれ = 2 つの和 ÷ 2",_w15_s(est),"signal"],
             ["δ = (T4 − T1) − (T3 − T2)",(del*1000).toFixed(0)+" ms","teal"],["誤差 = 求めたずれ − θ",_w15_s(err),Math.abs(err)>1e-9?"alias":"green"]];
      L.forEach(function(r,i){o.push(S.T(xr,yr+i*2*lh,r[0],"start",9.5,"muted"));o.push(S.T(xr+8,yr+i*2*lh+15,r[1],"start",11,r[2],true,true));});
      /* 下: ずれの数直線 */
      var yl=250,lx0=120,lx1=640,R=Math.max(1.1*del,0.004),c0=TH;
      var XN=function(v){return lx0+(v-(c0-R))/(2*R)*(lx1-lx0);};
      o.push(S.L(lx0,yl,lx1,yl,"muted",1.2));
      [-R,0,R].forEach(function(k){var xx=XN(c0+k);o.push(S.L(xx,yl-4,xx,yl+4,"muted",1));o.push(S.T(xx,yl+17,(c0+k>=0?"+":"−")+Math.abs(c0+k).toFixed(3)+" s","middle",9.5,"muted",false,true));});
      var lo=XN(est-del/2),hi=XN(est+del/2);
      o.push(S.RECT(Math.max(lx0,lo),yl-9,Math.max(2,Math.min(lx1,hi)-Math.max(lx0,lo)),18,3,U.soft("signal"),"signal",1.2));
      o.push(S.D(XN(TH),yl,"green",5.5));o.push(S.D(XN(est),yl,"signal",4));
      o.push(S.T(XN(TH),yl-14,"本当の θ","middle",10,"green",true));
      o.push(S.T(Math.min(lx1-40,Math.max(lx0+40,XN(est))),yl+34,"求めたずれ ± δ/2（機器に分かる範囲）","middle",10,"signal",true));
      o.push(S.T(16,yl+4,"ずれ","start",10.5,"ink",true));
      box.set(S.svg(W,298,o));
      var inside=Math.abs(err)<=del/2+1e-9;
      ro.innerHTML="求めたずれ = ((T2 − T1) + (T3 − T4)) / 2 = ("+_w15_s(T2-T1)+" + "+_w15_s(T3-T4)+") / 2 = <b>"+_w15_s(est)+"</b>"+
        " ・ δ = "+((T4-T1)*1000).toFixed(0)+" ms − "+((T3-T2)*1000).toFixed(0)+" ms = <b>"+(del*1000).toFixed(0)+" ms</b><br>"+
        "誤差 = 求めたずれ − θ = (d1 − d2) / 2 = <b>"+_w15_s(err)+"</b>（大きさの上限 δ/2 = "+(del*500).toFixed(1)+" ms）"+
        (inside?' <span class="ok">本当のずれは、求めたずれ ± δ/2 の中にある</span>':' <span class="warn">範囲の外</span>')+
        (Math.abs(err)>=del/2-1e-9&&del>0?' ・ 遅延が片方の向きだけにあるので、誤差がちょうど上限になる':'')+
        '<div class="wnote">機器の時計を基準に、T1 = 10.000 s とした。サーバの処理時間は T3 − T2 として除かれるので、ずれにも遅延にも入らない。</div>';
    }
    draw();
  };

  /* ---- 2 節: 再接続の方針のシミュレーション ---- */
  var _w15_L=["Wi-Fi","DHCP","DNS","SNTP","TCP","TLS","MQTT"];
  var _w15_LC=["signal","gold","purple","purple","green","teal","purple"];
  var _w15_OK=[2.0,0.5,0.1,0.1,0.1,1.0,0.2];   /* 成功したときにかかる時間 [s]（代表値） */
  var _w15_SC=[
    {t:"ブローカが 20 分止まる（接続を断られる）",start:4,clear:1200,hz:2400},
    {t:"AP の電源が 15 分切れる",start:0,clear:900,hz:1800},
    {t:"DNS サーバが 10 分答えない",start:2,clear:600,hz:1200},
    {t:"サーバのアドレスが変わった（古いアドレスを使い続ける）",start:4,clear:0,hz:240},
    {t:"RTC が戻っていた（機器は時刻が正しいと思っている）",start:4,clear:0,hz:60},
    {t:"ブローカがクライアント ID を拒む（設定の誤り）",start:4,clear:Infinity,hz:8000}];
  function _w15_sim(sc,b,cap,esc,jit,seed,rng){
    var R=rng(seed),st={fresh:false,timeok:false},ev=[],wt=[],t=0,cur=sc.start,fails=0,up=null,notify=false,count=[0,0,0,0,0,0,0];
    var si=_w15_SC.indexOf(sc);
    function attempt(L){
      if(si===0&&L===4&&t<sc.clear)return {ok:false,c:"temp",d:0.1};
      if(si===1&&L===0&&t<sc.clear)return {ok:false,c:"temp",d:5};
      if(si===2&&L===2&&t<sc.clear)return {ok:false,c:"temp",d:8};
      if(si===3){if(L===2)st.fresh=true;if(L===4&&!st.fresh)return {ok:false,c:"temp",d:10};}
      if(si===4){if(L===3)st.timeok=true;if(L===5&&!st.timeok)return {ok:false,c:"time",d:1};}
      if(si===5&&L===6)return {ok:false,c:"config",d:0.3};
      return {ok:true,d:_w15_OK[L]};
    }
    var guard=0;
    while(t<sc.hz&&up===null&&guard++<5000){
      var L=cur,r=attempt(L);count[L]++;
      ev.push([L,t,t+r.d,r.ok?"ok":r.c]);t+=r.d;
      if(r.ok){
        if(L===6){up=t;break;}
        cur=(L===2||L===3)?4:L+1;      /* どの場面も時刻は分かっている（と機器は思っている）ので、DNS の次は TCP */
        continue;
      }
      var base=L>=4?4:L,w;fails++;
      if(r.c==="time"){cur=3;}
      else if(r.c==="config"){cur=base;notify=true;}
      else if(esc&&fails>=6){cur=0;}
      else if(esc&&fails>=3&&base>2){cur=2;}
      else cur=base;
      if(r.c==="config")w=3600;
      else{w=Math.min(cap,b*Math.pow(2,fails-1));if(jit)w=R.next()*w;}
      wt.push([t,t+w,r.c==="config"?"config":"temp",fails]);t+=w;
    }
    return {ev:ev,wt:wt,up:up,count:count,fails:fails,notify:notify};
  }
  REG.w15_reconn=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"RECONNECT","故障を起こして、どの層からやり直すかを見る");
    var r1=U.ctrls(el);
    var sc=U.select(r1,"故障",_w15_SC.map(function(s){return s.t;}),0,draw);
    var r2=U.ctrls(el);
    var bb=U.slider(r2,"最初の待ち時間",{values:[0.5,1,2,5,10],value:1,fmt:function(v){return v+" s";},onInput:draw});
    var cp=U.slider(r2,"上限",{values:[30,60,120,300,600,1800],value:300,fmt:function(v){return F.time(v);},onInput:draw});
    var r3=U.ctrls(el);
    var es=U.checkbox(r3,"続けて失敗したら下の層から（3 回目から DNS、6 回目から Wi-Fi）",true,draw);
    var ji=U.checkbox(r3,"ジッタ（全部をランダムに）",true,draw);
    var seed=1,br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var s=_w15_SC[sc.get()],res=_w15_sim(s,bb.get(),cp.get(),es.get(),ji.get(),seed*7919+3,U.rng);
      var W=700,x0=110,x1=672,hz=s.hz,rh=24,y0=26,o=[];
      var X=function(t){return x0+(x1-x0)*Math.min(t,hz)/hz;};
      var rows=_w15_L.concat(["待つ"]);
      rows.forEach(function(nm,i){var y=y0+i*rh;o.push(S.RECT(x0,y,x1-x0,rh-6,2,"screen","line",0.8));
        o.push(S.T(x0-8,y+13,nm,"end",10.5,i<7?_w15_LC[i]:"gold",true));});
      res.wt.forEach(function(w){var y=y0+7*rh;o.push(S.RECT(X(w[0]),y+2,Math.max(1.5,X(w[1])-X(w[0])),rh-10,1,U.soft(w[2]==="config"?"alias":"gold"),w[2]==="config"?"alias":"gold",0.8));});
      res.ev.forEach(function(e){var y=y0+e[0]*rh,c=e[3]==="ok"?"green":"alias";
        o.push(S.RECT(X(e[1]),y+1,Math.max(2.2,X(e[2])-X(e[1])),rh-8,1,U.soft(c),c,1));});
      var yb=y0+8*rh;
      o.push(S.L(x0,yb,x1,yb,"muted",1));
      var tk=U.nice(0,hz/60,6);
      tk.forEach(function(m){var xx=X(m*60);o.push(S.L(xx,yb,xx,yb+4,"muted",1));o.push(S.T(xx,yb+16,U.sig(m,3)+" 分","middle",9.5,"muted"));});
      if(s.clear>0&&isFinite(s.clear)){var xc=X(s.clear);o.push(S.L(xc,y0-6,xc,yb,"muted",1.3,"4 3"));o.push(S.T(xc,y0-10,"故障が直る","middle",9.5,"muted",true));}
      if(res.up!==null){var xu=X(res.up);o.push(S.L(xu,y0-6,xu,yb,"green",1.6));o.push(S.T(Math.min(xu+4,x1-60),y0-10,"つながった","start",9.5,"green",true));}
      box.set(S.svg(W,yb+26,o));
      var tot=res.count.reduce(function(a,c){return a+c;},0);
      var tbl=U.tbl(_w15_L,[res.count.map(String)],_w15_L.map(function(){return "center";}));
      var msg;
      if(res.up!==null){
        msg="つながった時刻 <b>"+F.time(res.up)+"</b>"+(s.clear>0&&isFinite(s.clear)?"（故障が直ってから <b>"+F.time(Math.max(0,res.up-s.clear))+"</b> 後）":"");
      } else msg='<span class="warn">'+F.time(hz)+" の間につながらなかった</span>";
      ro.innerHTML=msg+" ・ 試みの合計 <b>"+tot+" 回</b>・ 待った回数 "+res.wt.length+"<br>"+tbl+
        (res.notify?'<div class="wnote"><span class="warn">設定の誤り</span>: 繰り返しても直らないので、1 時間待ってから同じ層で試し、利用者に知らせる（デモでは 1 時間ごとに試みる様子を見る）。</div>':"")+
        '<div class="wnote">緑は成功した試み、赤は失敗した試み、金は待っている時間（赤枠は設定の誤りの長い待ち）。各段にかかる時間は代表値（Wi-Fi 2 s、DHCP 0.5 s、TLS 1 s など。失敗に気づくまで: Wi-Fi 5 s、DNS 8 s、TCP のタイムアウト 10 s）。</div>';
    }
    draw();
  };

  /* ---- 3 節: つながらない間の蓄積 ---- */
  REG.w15_store=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"STORE","つながらない間にためる: 何が残り、何を失うか");
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"測る間隔",{values:[60,300,600,1800,3600],value:600,fmt:function(v){return F.time(v);},onInput:draw});
    var sz=U.slider(r1,"1 件の大きさ",{values:[16,32,64,128],value:32,fmt:function(v){return v+" バイト";},onInput:draw});
    var r2=U.ctrls(el);
    var kb=U.slider(r2,"列の大きさ（4 KB のまとまり）",{values:[8,16,24,36,64,128,256],value:36,fmt:function(v){return v+" KB（"+(v/4)+" つ）";},onInput:draw});
    var ou=U.slider(r2,"切れている時間",{values:[3600,6*3600,86400,3*86400,7*86400,10*86400,14*86400,30*86400],value:10*86400,fmt:function(v){return F.time(v);},onInput:draw});
    var r3=U.ctrls(el);
    var po=U.seg(r3,["古いものを捨てる","新しいものを捨てる","間引く"],0,draw);
    var li=U.select(r3,"書き込み回数の上限",["1 万回","10 万回"],0,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Tm=tm.get(),s=sz.get(),nb=kb.get()/4,per=Math.floor(4096/s),slots=nb*per,nd=86400/Tm,N=Math.round(ou.get()/Tm),pol=po.get();
      var keep=[],fill=[],k,i;
      for(i=0;i<N;i++){
        if(keep.length>=slots){
          if(pol===0)keep=keep.slice(per);                         /* 最も古いまとまりを消す */
          else if(pol===1){fill.push(keep.length);continue;}       /* 新しいものを書かない */
          else keep=keep.filter(function(_,j){return j%2===0;});   /* 1 件おきに減らす */
        }
        keep.push(i);fill.push(keep.length);
      }
      var K=keep.length,Lost=N-K;
      /* 図 */
      var W=700,x0=150,x1=680,o=[],X=function(n){return x0+(x1-x0)*n/Math.max(1,N);};
      o.push(S.T(x0-10,40,"作ったデータ","end",10.5,"ink",true));
      o.push(S.RECT(x0,26,x1-x0,22,3,U.soft("signal"),"signal",1.2));
      o.push(S.T((x0+x1)/2,41,N+" 件（"+F.time(Tm)+"おき）","middle",10,"signal",true));
      o.push(S.T(x0-10,82,"残ったもの","end",10.5,"ink",true));
      o.push(S.RECT(x0,68,x1-x0,22,3,U.soft("alias"),"alias",1,"4 3"));
      /* 同じ間隔の続きごとに塗る */
      i=0;
      while(i<K){var g=(i+1<K)?keep[i+1]-keep[i]:1,j=i;while(j+1<K&&keep[j+1]-keep[j]===g)j++;
        var a=X(keep[i]),bx=X(keep[j]+g),c=g===1?"green":"teal";
        o.push(S.RECT(a,68,Math.max(1.5,bx-a),22,2,U.soft(c),c,1.2,g===1?null:"2 2"));
        if(bx-a>90)o.push(S.T((a+bx)/2,83,(g===1?"":"")+(j-i+1)+" 件（"+F.time(g*Tm)+"おき）","middle",9.5,c,true));
        i=j+1;}
      if(Lost>0)o.push(S.T(x1,104,"赤い破線: 失った部分","end",9.5,"alias"));
      /* 列の量の変化 */
      var p=U.plot(x0,124,x1-x0,90,[0,Math.max(1,N)],[0,slots*1.1]);
      o.push(p.axes({yl:"列の件数",xt:[0,N/2,N].map(Math.round),yt:[0,slots],xfmt:function(v){return F.time(v*Tm);},yfmt:function(v){return String(Math.round(v));},ylOff:48}));
      var pts=[[0,0]];var step=Math.max(1,Math.floor(N/400));for(k=0;k<fill.length;k+=step)pts.push([k+1,fill[k]]);pts.push([N,fill[N-1]||0]);
      o.push(p.line(pts,"signal",1.8));
      o.push(p.line([[0,slots],[N,slots]],"alias",1.2,"5 4"));
      o.push(S.T(x0+6,p.Y(slots)-5,"列の大きさ "+slots+" 件","start",9.5,"alias"));
      box.set(S.svg(W,250,o));
      var limit=li.get()===0?1e4:1e5,cyc=slots/nd,years=limit*cyc/365.25,inplace=limit/nd;
      ro.innerHTML="1 日に <b>"+U.sig(nd,4)+" 件・"+F.bytes(nd*s)+"</b> ・ 列に入るのは <b>"+slots+" 件</b>（"+U.sig(slots/nd,3)+" 日分。消すまとまりの分を除いて必ず残るのは "+((nb-1)*per)+" 件 = "+U.sig((nb-1)*per/nd,3)+" 日分）<br>"+
        "切れていた "+F.time(ou.get())+" に作った "+N+" 件のうち、残ったのは <b>"+K+" 件</b>、失ったのは <b>"+Lost+" 件</b>"+(Lost?"（"+U.sig(Lost/nd,3)+" 日分）":' <span class="ok">（すべて残った）</span>')+"<br>"+
        "書き込み回数の上限まで: 順に書けば <b>"+(years>=1000?"1000 年以上":U.sig(years,3)+" 年")+"</b>（一巡 "+U.sig(cyc,3)+" 日ごとに 1 回消す）・ 同じまとまりを書き直せば <b>"+U.sig(inplace,3)+" 日</b>（1 日 "+U.sig(nd,4)+" 回消す）"+
        '<div class="wnote">古いものを捨てるときは、消すまとまり 1 つ分（'+per+' 件）をまとめて捨てる。間引くときは、満杯になるたびに 1 件おきに減らす（フラッシュでは書き写しが要る）。</div>';
    }
    draw();
  };

  /* ---- 7 節: まとめて送る ---- */
  REG.w15_batch=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BATCH","まとめて送る件数と、平均電流・遅れ");
    var r1=U.ctrls(el);
    var tm=U.slider(r1,"測る間隔 T_m",{values:[60,120,300,600,1200,1800,3600],value:600,fmt:function(v){return F.time(v);},onInput:draw});
    var bb=U.slider(r1,"まとめる件数 B",{values:[1,2,3,4,6,12,24,36,72,144],value:6,fmt:function(v){return v+" 件";},onInput:draw});
    var r2=U.ctrls(el);
    var qc=U.slider(r2,"接続 1 回の電荷 Q_c",{min:10,max:1000,log:true,int:true,value:150,fmt:function(v){return v+" mC";},onInput:draw});
    var qm=U.slider(r2,"メッセージ 1 つの電荷 Q_m",{min:0.1,max:20,log:true,value:2.4,fmt:function(v){return v+" mC";},onInput:draw});
    var r3=U.ctrls(el);
    var is=U.slider(r3,"眠っている間の電流 I_s",{min:1,max:200,log:true,value:5,fmt:function(v){return v+" µA";},onInput:draw});
    var cap=U.slider(r3,"電池の容量",{values:[220,1000,2000,3000,6000],value:2000,fmt:function(v){return v+" mAh";},onInput:draw});
    var ne=U.slider(r3,"すぐ送る出来事（1 日あたり）",{values:[0,1,2,5,10,24,48],value:0,fmt:function(v){return v+" 回";},onInput:draw});
    var r4=U.ctrls(el);
    var pk=U.checkbox(r4,"B 件を 1 つのメッセージにまとめる",false,draw);
    var br=U.btnrow(el);
    U.button(br,"例の値に戻す",function(){tm.set(600);bb.set(6);qc.set(150);qm.set(2.4);is.set(5);cap.set(2000);ne.set(0);pk.set(false);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var QR=0.05e-3;   /* 1 件分のバイトを足して送る電荷（代表値） */
    function cur(B,Tm,Qc,Qm,Is,Ne,pack){
      var Nc=86400/(B*Tm),Nm=pack?Nc:86400/Tm,qmsg=pack?Qm+(B-1)*QR:Qm;
      var qday=Nc*Qc+Nm*qmsg+Ne*(Qc+Qm);return {Nc:Nc,Nm:Nm,qmsg:qmsg,qday:qday,I:Is+qday/86400};}
    function draw(){
      var Tm=tm.get(),B=bb.get(),Qc=qc.get()*1e-3,Qm=qm.get()*1e-3,Is=is.get()*1e-6,C=cap.get()*3.6,Ne=ne.get(),pack=pk.get();
      var r=cur(B,Tm,Qc,Qm,Is,Ne,pack);
      var W=700,o=[];
      /* 上: 時間の帯（B を 2 回分、ただし 2〜48 時間） */
      var win=Math.min(48*3600,Math.max(2*3600,2*B*Tm)),x0=110,x1=680,X=function(t){return x0+(x1-x0)*t/win;};
      var n=Math.floor(win/Tm),y=40;
      o.push(S.T(x0-10,y+4,"測る・送る","end",10.5,"ink",true));
      o.push(S.L(x0,y,x1,y,"line",1.2));
      var dot=n>150?1.6:3.2;
      for(var k=0;k<n;k++){o.push(S.D(X(k*Tm),y,"signal",dot));if(k%B===B-1)o.push(S.RECT(X(k*Tm)+1,y-13,6,26,2,U.soft("green"),"green",1.2));}
      var R=U.rng(5),ev=Ne*win/86400;for(var e=0;e<Math.round(ev);e++){var te=R.next()*win;o.push(S.RECT(X(te)-3,y-13,6,26,2,U.soft("alias"),"alias",1.2));}
      if(B>1){o.push(S.DARR(X(0),y+22,X((B-1)*Tm)+1,y+22,"gold",1.2,5));o.push(S.T(X(0),y+38,"最大の遅れ "+F.time((B-1)*Tm),"start",9.5,"gold",true));}
      o.push(S.L(x0,y+46,x1,y+46,"muted",1));
      [0,0.25,0.5,0.75,1].forEach(function(f){o.push(S.L(X(f*win),y+46,X(f*win),y+50,"muted",1));o.push(S.T(X(f*win),y+62,F.time(f*win),"middle",9,"muted"));});
      /* 下: B と平均電流 */
      var p=U.plot(110,140,560,180,[Tm,Tm*1000],[1e-6,1e-3],{xlog:true,ylog:true});
      var xt=[60,600,3600,6*3600,86400,7*86400,30*86400].filter(function(v){return v>=Tm&&v<=1000*Tm;});
      var xl={60:"1 分",600:"10 分",3600:"1 時間",21600:"6 時間",86400:"1 日",604800:"7 日",2592000:"30 日"};
      o.push(p.axes({xl:"報告の間隔 B × T_m",yl:"平均電流",xt:xt,yt:[1e-6,1e-5,1e-4,1e-3],xfmt:function(v){return xl[v];},yfmt:function(v){return F.cur(v,1);},ylOff:52}));
      var pts=[];for(var q=0;q<=90;q++){var Bq=Math.pow(10,q/30);var I=cur(Bq,Tm,Qc,Qm,Is,Ne,pack).I;if(I>=1e-6&&I<=1e-3)pts.push([Bq*Tm,I]);}
      o.push(p.line(pts,"signal",2.2));
      var IA=290e-6;o.push(p.line([[Tm,IA],[1000*Tm,IA]],"teal",1.2,"6 4"));o.push(S.T(p.X(1000*Tm)-4,p.Y(IA)-5,"つなぎ続ける（09 章 4 節の例）約 290 µA","end",9.5,"teal",true));
      var fl=Is+(pack?QR/Tm:Qm/Tm)+Ne*(Qc+Qm)/86400;
      if(fl>=1e-6&&fl<=1e-3){o.push(p.line([[Tm,fl],[1000*Tm,fl]],"green",1.2,"6 4"));o.push(S.T(p.X(1000*Tm)-4,p.Y(fl)+13,"B を大きくしても下がらない分 "+F.cur(fl),"end",9.5,"green",true,false,null,true));}
      var Iy=Math.min(1e-3,Math.max(1e-6,r.I));o.push(S.D(p.X(B*Tm),p.Y(Iy),"alias",5));
      o.push(S.T(p.X(B*Tm)+8,p.Y(Iy)-8,"B = "+B+": "+F.cur(r.I),"start",10,"alias",true,false,null,true));
      box.set(S.svg(W,358,o));
      var life=C/r.I/86400;
      ro.innerHTML="1 日の電荷 = 接続 "+U.sig(r.Nc,3)+" 回 × "+U.sig(Qc*1e3,3)+" mC + メッセージ "+U.sig(r.Nm,3)+" 個 × "+U.sig(r.qmsg*1e3,3)+" mC"+(Ne?" + すぐ送る "+Ne+" 回 × "+U.sig((Qc+Qm)*1e3,3)+" mC":"")+" = <b>"+U.sig(r.qday,3)+" C</b><br>"+
        "平均電流 = "+F.cur(Is)+" + "+U.sig(r.qday,3)+" C ÷ 86400 s = <b>"+F.cur(r.I)+"</b> ・ 電池寿命 <b>"+(life>=365?U.sig(life/365.25,3)+" 年":U.sig(life,3)+" 日")+"</b><br>"+
        "最大の遅れ（上り）<b>"+F.time((B-1)*Tm)+"</b>（平均 "+F.time((B-1)*Tm/2)+"）＋接続の時間 ・ 下りの設定が届くまで最大 <b>"+F.time(B*Tm)+"</b>"+
        '<div class="wnote">電荷と電流は代表値。電池が使わなくても減る分は含めていない。1 つのメッセージにまとめるときは、1 件増えるごとに '+(QR*1e3)+' mC を足した。</div>';
    }
    draw();
  };

  /* ===== 16 章 BLE の全体像 ===== */
  /* チャネルの番号 → 中心の周波数 [MHz] */
  function _w16_f(i){if(i===37)return 2402;if(i===38)return 2426;if(i===39)return 2480;return i<=10?2404+2*i:2406+2*i;}
  /* BLE のチャネル（中心 f、±1 MHz）と、中心 fc・幅 w の Wi-Fi の信号の関係 */
  function _w16_rel(f,fc,w){var d=Math.abs(f-fc);if(d<=w/2-1)return "over";if(d<w/2+1)return "edge";return "clear";}
  /* Wi-Fi の AP の信号: 40 MHz は主のチャネルの上か下の 20 MHz を足す（09 章のデモと同じく、7 以下なら上） */
  function _w16_sig(ch,w){var f=2407+5*ch;if(w===40)f+=ch<=7?10:-10;return {ch:ch,f:f,w:w};}
  /* チャネル選択アルゴリズム #2 の擬似乱数（Core Specification の手順。Zephyr の lll_chan.c と同じ計算） */
  function _w16_rev8(b){var r=0;for(var i=0;i<8;i++)r=(r<<1)|((b>>i)&1);return r;}
  function _w16_perm(i){return (_w16_rev8((i>>8)&255)<<8)|_w16_rev8(i&255);}
  function _w16_prn(counter,cid){var p=(counter^cid)&65535;for(var k=0;k<3;k++){p=_w16_perm(p);p=(p*17+cid)&65535;}return (p^cid)&65535;}
  /* 接続イベント n 回分のチャネル。used はチャネルの番号の配列（小さい順）。返り値 [{u, c, rm}] */
  function _w16_seq(alg,hop,used,cid,n){
    var isU={},N=used.length,out=[],last=0;used.forEach(function(c){isU[c]=true;});
    for(var k=0;k<n;k++){
      if(alg===0){var u=(last+hop)%37;last=u;out.push(isU[u]?{u:u,c:u,rm:false}:{u:u,c:used[u%N],rm:true});}
      else{var pe=_w16_prn(k,cid),u2=pe%37;out.push(isU[u2]?{u:u2,c:u2,rm:false}:{u:u2,c:used[Math.floor(N*pe/65536)],rm:true});}
    }
    return out;
  }

  /* ---- 2 節: Wi-Fi の AP のチャネルと BLE のチャネルの重なり ---- */
  REG.w16_band=function(el,U){
    var S=U.S;
    U.head(el,"BAND","Wi-Fi の AP のチャネルと、BLE のチャネルの重なり");
    var chs=[{v:"0",t:"なし"}];for(var n=1;n<=13;n++)chs.push({v:String(n),t:n+"（"+(2407+5*n)+" MHz）"});
    var row=U.ctrls(el);
    var a1=U.select(row,"Wi-Fi の AP 1",chs,"1",draw);
    var a2=U.select(row,"AP 2",chs,"6",draw);
    var a3=U.select(row,"AP 3",chs,"11",draw);
    var row2=U.ctrls(el);
    var wd=U.select(row2,"Wi-Fi の信号の幅",[{v:"20",t:"20 MHz（802.11g・n）"},{v:"22",t:"22 MHz（802.11b）"},{v:"40",t:"40 MHz（802.11n、2 チャネル分）"}],"20",draw);
    var br=U.btnrow(el);
    function ex(x,y,z,w){a1.set(String(x));a2.set(String(y));a3.set(String(z));wd.set(String(w));draw();}
    U.button(br,"1・6・11（よくある組）",function(){ex(1,6,11,20);});
    U.button(br,"6 だけ",function(){ex(0,6,0,20);});
    U.button(br,"1・7・13",function(){ex(1,7,13,20);});
    U.button(br,"40 MHz の AP が 1 台",function(){ex(3,0,0,40);});
    U.button(br,"Wi-Fi なし",function(){ex(0,0,0,20);});
    var box=U.svgbox(el); var ro=U.readout(el);
    var COL={over:"alias",edge:"gold",clear:"green"},NAME={over:"重なる",edge:"端にかかる",clear:"重ならない"};
    function draw(){
      var w=+wd.get(),aps=[];
      [a1,a2,a3].forEach(function(s,k){var c=+s.get();if(c>0)aps.push({s:_w16_sig(c,w),name:"AP "+(k+1)});});
      var W=700,o=[],p=U.plot(70,0,610,1,[2400,2484],[0,1]),yt=40,yb=112;
      o.push(S.RECT(p.X(2400),24,p.X(2483.5)-p.X(2400),yb-24,0,"var(--screen)","none",0));
      o.push(S.T(p.X(2400)+4,36,"2.4 GHz 帯","start",9.5,"muted"));
      aps.forEach(function(a,k){var s=a.s,e=Math.min(2,s.w*0.12),y=yt+k*12;
        o.push(S.PL([[p.X(s.f-s.w/2),yb],[p.X(s.f-s.w/2+e),y],[p.X(s.f+s.w/2-e),y],[p.X(s.f+s.w/2),yb]],"muted",1.4,"var(--muted-soft)",null,0.5));
        o.push(S.T(p.X(s.f),y+18,a.name+"（"+s.ch+(w===40?(s.ch<=7?"+上":"+下"):"")+"）","middle",10,"ink",true,false,null,true));
        [s.f-s.w/2,s.f+s.w/2].forEach(function(fe){o.push(S.L(p.X(fe),yb,p.X(fe),yb+42,"faint",1,"3 3"));});});
      var st=[],cnt={over:0,edge:0,clear:0},clr=[];
      for(var i=0;i<40;i++){var f=_w16_f(i),r="clear";
        aps.forEach(function(a){var q=_w16_rel(f,a.s.f,a.s.w);if(q==="over")r="over";else if(q==="edge"&&r!=="over")r="edge";});
        st.push(r);if(i<37){cnt[r]++;if(r==="clear")clr.push(i);}
        var x0=p.X(f-0.9),x1=p.X(f+0.9),adv=i>=37;
        o.push(S.RECT(x0,yb+10,x1-x0,24,2,U.soft(COL[r]),COL[r],adv?2.2:1));
        o.push(S.T((x0+x1)/2,yb+48,String(i),"middle",9.5,adv?"purple":COL[r],adv,true));}
      o.push(S.T(62,yb+26,"BLE","end",10,"ink",true));o.push(S.T(62,yb+47,"番号","end",9,"muted"));
      var ya=yb+58;o.push(S.L(p.X(2400),ya,p.X(2484),ya,"muted",1.1));
      [2400,2420,2440,2460,2480].forEach(function(fr){o.push(S.L(p.X(fr),ya,p.X(fr),ya+4,"muted",1));o.push(S.T(p.X(fr),ya+16,String(fr),"middle",9.5,"muted"));});
      o.push(S.T(p.X(2484),ya+30,"周波数 [MHz]","end",9.5,"muted"));
      var lx=70;[["over","重なる"],["edge","端にかかる"],["clear","重ならない"]].forEach(function(L){
        o.push(S.RECT(lx,ya+40,10,10,2,U.soft(COL[L[0]]),COL[L[0]],1.2));o.push(S.T(lx+15,ya+49,L[1],"start",10,COL[L[0]],true));lx+=U.tw(L[1],10)+40;});
      o.push(S.T(lx,ya+49,"太枠: アドバタイズチャネル（37・38・39 番）","start",10,"purple"));
      box.set(S.svg(W,ya+60,o));
      var adv=[37,38,39].map(function(i){return i+" 番（"+_w16_f(i)+" MHz）: <b style=\"color:var(--"+(COL[st[i]]==="alias"?"alias":COL[st[i]])+")\">"+NAME[st[i]]+"</b>";}).join("、");
      ro.innerHTML=(aps.length?"":"近くに Wi-Fi の AP は無い。<br>")+
        "データチャネル 37 本: <span class=\"warn\">重なる "+cnt.over+" 本</span> ・ <b style=\"color:var(--gold)\">端にかかる "+cnt.edge+" 本</b> ・ <span class=\"ok\">重ならない "+cnt.clear+" 本</span>"+
        (clr.length&&clr.length<37?"（"+clr.join("・")+" 番）":"")+"<br>アドバタイズチャネル: "+adv+
        '<div class="wnote">BLE の信号は中心から ±1 MHz、Wi-Fi の信号は台形の幅（中心から ±幅/2）とみなした。実際の Wi-Fi の信号の裾はもっと広いので、この数え方は目安である。</div>';
    }
    draw();
  };

  /* ---- 3 節: PHY の比較 ---- */
  var _w16_PHY=[{n:"LE 1M",rs:1,S:1,c:"signal"},{n:"LE 2M",rs:2,S:1,c:"purple"},{n:"LE Coded S = 2",rs:1,S:2,c:"teal"},{n:"LE Coded S = 8",rs:1,S:8,c:"green"}];
  function _w16_Phi(x){var t=1/(1+0.2316419*Math.abs(x)),d=0.3989423*Math.exp(-x*x/2),p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>=0?1-p:p;}
  function _w16_gtrace(bits,t){var sg=Math.sqrt(Math.log(2))/(2*Math.PI*0.5),v=0,ext=[bits[0],bits[0],bits[0]].concat(bits,[bits[bits.length-1],bits[bits.length-1],bits[bits.length-1]]);
    for(var k=0;k<ext.length;k++){var a=ext[k]?1:-1,t0=k-3;v+=a*(_w16_Phi((t-t0)/sg)-_w16_Phi((t-t0-1)/sg));}return v;}
  REG.w16_phy=function(el,U){
    var S=U.S;
    U.head(el,"PHY","PHY ごとの周波数の動き・1 ビットの時間・届く距離の比");
    var row=U.ctrls(el);
    var ph=U.seg(row,_w16_PHY.map(function(q){return q.n;}),0,draw);
    var row2=U.ctrls(el);
    var by=U.textin(row2,"送るバイト（16 進）","4D",draw);
    var nn=U.slider(row2,"電波の弱まり方 n（P ∝ 1/dⁿ）",{values:[2,2.5,3,3.5,4],value:2,fmt:function(v){return v+(v===2?"（何もない空間）":v===3?"（建物の中の目安）":"");},onInput:draw});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var q=_w16_PHY[ph.get()],tb=q.S/q.rs,n=nn.get(),warn="",txt=by.get().trim().replace(/^0x/i,"");
      var v=parseInt(txt,16);if(!/^[0-9a-fA-F]{1,2}$/.test(txt)||isNaN(v)){warn='<span class="warn">1 バイトの 16 進（00〜FF）を入れること。0x4D で表示した。</span><br>';v=0x4D;}
      var bits=[];for(var i=0;i<8;i++)bits.push((v>>i)&1);       /* 最下位ビットから送る */
      var W=700,o=[],x0=118,x1=618,T8=8*tb,X=function(t){return x0+(x1-x0)*t/T8;};
      o.push(S.T(x0,16,q.n+": 0x"+U.fmt.hex(v)+" を最下位ビットから送る（8 ビットで "+U.sig(T8,3)+" µs）","start",10.5,q.c,true));
      bits.forEach(function(b,k){o.push(S.RECT(X(k*tb)+1,24,X((k+1)*tb)-X(k*tb)-2,22,3,b?U.soft(q.c):"var(--panel)",b?q.c:"var(--line)",1));
        o.push(S.T((X(k*tb)+X((k+1)*tb))/2,40,String(b),"middle",11,b?q.c:"muted",true,true));});
      o.push(S.T(x0-10,40,"ビット","end",10,"ink",true));
      var yc=104,A=36;
      if(q.S===1){
        var dev=250*q.rs,Ay=A*dev/500;      /* 縦軸は ±500 kHz を ±A で描く */
        o.push(S.T(x0-10,yc-8,"周波数","end",10,"ink",true));o.push(S.T(x0-10,yc+7,"のずれ","end",10,"ink",true));
        o.push(S.L(x0,yc,x1,yc,"muted",1.1));
        [500,250,-250,-500].forEach(function(kh){var yy=yc-A*kh/500;o.push(S.L(x0,yy,x1,yy,"grid",1));o.push(S.T(x1+4,yy+3,(kh>0?"+":"−")+Math.abs(kh)+" kHz","start",9,"muted"));});
        var pts=[];for(var s=0;s<=8*40;s++){var t=s/40;pts.push([X(t*tb),yc-Ay*_w16_gtrace(bits,t)]);}
        o.push(S.PL(pts,q.c,2.4));
        o.push(S.T(x0,yc+A+16,"1 シンボル = 1 ビット = "+U.sig(tb,2)+" µs。周波数のずれは ±"+dev+" kHz（変調指数 0.5 のとき）","start",9.5,"muted"));
      }else{
        o.push(S.T(x0-10,yc-4,"シンボル","end",10,"ink",true));
        for(var k=0;k<8;k++)for(var j=0;j<q.S;j++){var a=X(k*tb+j),e=X(k*tb+j+1);
          o.push(S.RECT(a+0.5,yc-18,Math.max(0.5,e-a-1),30,1,U.soft(q.c),q.c,0.6));}
        o.push(S.T(x0,yc+A+2,"1 ビットを "+q.S+" シンボル（1 シンボル 1 µs）で送る。シンボルの並びは誤り訂正の符号で決まる（ここでは区切りだけを描いた）","start",9.5,"muted"));
      }
      /* 4 つの PHY の 8 ビットの時間の比較 */
      var yb0=yc+A+34,Xc=function(t){return x0+(x1-x0)*t/64;};
      o.push(S.T(x0-10,yb0+12,"8 ビットの","end",10,"ink",true));o.push(S.T(x0-10,yb0+26,"時間","end",10,"ink",true));
      _w16_PHY.forEach(function(r,k){var t=8*r.S/r.rs,y=yb0+k*18,sel=r===q;
        o.push(S.RECT(x0,y,Xc(t)-x0,13,2,U.soft(r.c),r.c,sel?2.2:1));
        var lab=r.n+"  "+U.sig(t,3)+" µs",inside=Xc(t)+6+U.tw(lab,9.5)>W-6;
        o.push(S.T(inside?Xc(t)-6:Xc(t)+6,y+11,lab,inside?"end":"start",9.5,r.c,sel,false,null,inside));});
      var ya=yb0+4*18+4;o.push(S.L(x0,ya,x1,ya,"muted",1));
      [0,16,32,48,64].forEach(function(t){o.push(S.L(Xc(t),ya,Xc(t),ya+4,"muted",1));o.push(S.T(Xc(t),ya+15,String(t),"middle",9,"muted"));});
      o.push(S.T(x1,ya+28,"時間 [µs]","end",9.5,"muted"));
      box.set(S.svg(W,ya+34,o));
      var rows=_w16_PHY.map(function(r){var t=r.S/r.rs,db=-10*Math.log10(t),sel=r===q,b=function(s){return sel?"<b>"+s+"</b>":s;};
        return [b('<span style="color:var(--'+r.c+')">'+r.n+'</span>'),b(r.rs+" Msym/s"),b(String(r.S)),b(U.fmt.rate(r.rs*1e6/r.S)),b(U.sig(t,2)+" µs"),
          b((db>0.05?"+":db<-0.05?"−":"")+Math.abs(db).toFixed(1)+" dB"),b(Math.pow(t,1/n).toFixed(2)+" 倍")];});
      ro.innerHTML=warn+U.tbl(["PHY","シンボルの速さ","S","ビットレート","ビット時間","要る受信電力","届く距離（n = "+n+"）"],rows,["left","right","center","right","right","right","right"])+
        '<div class="wnote">S は 1 ビットを送るシンボルの数。要る受信電力は LE 1M との差で、ビット時間に反比例するとして 10 log₁₀ で dB にした。届く距離は LE 1M を 1 とした比で、ビット時間の 1/n 乗に比例するとした見積もり。LE Coded の誤り訂正の符号の効果は含めていない。</div>';
    }
    draw();
  };

  /* ---- 6 節: チャネル選択アルゴリズム ---- */
  REG.w16_hop=function(el,U){
    var S=U.S;
    U.head(el,"HOP","チャネル選択アルゴリズムとチャネルマップ");
    var map=[];for(var i=0;i<37;i++)map.push(true);
    var seed=1,cid=0x305F,msg="";
    var row=U.ctrls(el);
    var hop=U.slider(row,"ホップ量 h（#1 で使う）",{min:5,max:16,step:1,value:7,onInput:draw});
    var ne=U.select(row,"表示する接続イベントの数",[{v:"37",t:"37 回"},{v:"74",t:"74 回"},{v:"111",t:"111 回"}],"37",draw);
    var row2=U.ctrls(el);
    var alg=U.seg(row2,["#1（4.0 から）","#2（5.0 から。比較用）"],0,draw);
    var br=U.btnrow(el);
    function setUsed(list){for(var i=0;i<37;i++)map[i]=list.indexOf(i)>=0;msg="";draw();}
    var WIFI=[0,1,2,3,4,5,6,7,8,11,12,13,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32];
    U.button(br,"全部使う",function(){setUsed(Array.apply(null,{length:37}).map(function(_,i){return i;}));});
    U.button(br,"Wi-Fi 1・6・11 に重なる 28 本を外す",function(){setUsed([9,10,21,22,23,33,34,35,36]);});
    U.button(br,"Wi-Fi 6 に重なる 10 本を外す",function(){var a=[];for(var i=0;i<37;i++)if(i<11||i>20)a.push(i);setUsed(a);});
    U.button(br,"2 本だけ使う（10・36 番）",function(){setUsed([10,36]);});
    U.button(br,"別の接続にする（#2 の値を変える）",function(){seed++;cid=U.rng(seed*7919).int(65536);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    box.el.addEventListener("click",function(ev){var t=ev.target.closest?ev.target.closest("[data-ch]"):null;if(!t)return;
      var i=+t.getAttribute("data-ch"),n=map.filter(Boolean).length;
      if(map[i]&&n<=2){msg='<span class="warn">使うチャネルは 2 本以上残す決まりなので、これ以上は外せない。</span><br>';draw();return;}
      map[i]=!map[i];msg="";draw();});
    function draw(){
      var used=[];for(var i=0;i<37;i++)if(map[i])used.push(i);
      var a=alg.get(),h=hop.get(),E=+ne.get(),N=used.length,sq=_w16_seq(a,h,used,cid,E);
      var W=700,o=[],x0=64,cw=16.4,yc=40;
      /* Wi-Fi 1・6・11 の範囲の目安 */
      [[0,9,"Wi-Fi 1"],[11,20,"Wi-Fi 6"],[23,33,"Wi-Fi 11"]].forEach(function(r){var xa=x0+r[0]*cw+1,xb=x0+(r[1]+1)*cw-1;
        o.push(S.RECT(xa,14,xb-xa,8,2,"var(--muted-soft)","muted",0.8));o.push(S.T((xa+xb)/2,11,r[2],"middle",9,"muted"));});
      for(var c=0;c<37;c++){var u=map[c],col=u?"green":"alias";
        o.push('<g data-ch="'+c+'" style="cursor:pointer">'+S.RECT(x0+c*cw+1,yc-12,cw-2,24,2,U.soft(col),col,u?1.3:0.8)+
          S.T(x0+c*cw+cw/2,yc+4,String(c),"middle",9.5,col,u,true)+'</g>');}
      o.push(S.T(x0-6,yc+4,"マップ","end",9.5,"ink",true));
      o.push(S.T(x0,yc+28,"升目を押すと、使う（緑）・使わない（赤）が切り替わる","start",9.5,"muted"));
      /* 接続イベントごとのチャネル */
      var p=U.plot(x0+4,yc+48,600,200,[0,E+1],[-1,37]);
      o.push(p.axes({xl:"接続イベント（何回目か）",yl:"チャネルの番号",xt:E===37?[1,10,20,30,37]:(E===74?[1,20,40,60,74]:[1,30,60,90,111]),yt:[0,9,18,27,36],
        xfmt:function(v){return String(v);},yfmt:function(v){return String(v);}}));
      o.push(p.line(sq.map(function(s,k){return [k+1,s.c];}),"faint",1));
      sq.forEach(function(s,k){var x=p.X(k+1);
        if(s.rm){o.push(S.CIRC(x,p.Y(s.u),2.2,"alias",0.9));o.push(S.L(x,p.Y(s.u),x,p.Y(s.c),"gold",0.8,"2 2"));o.push(S.D(x,p.Y(s.c),"gold",E>74?2.4:3));}
        else o.push(S.D(x,p.Y(s.c),"signal",E>74?2.4:3));});
      /* 使った回数 */
      var cnt=[];for(var c2=0;c2<37;c2++)cnt.push(0);sq.forEach(function(s){cnt[s.c]++;});
      var mx=Math.max.apply(null,cnt),yh=yc+362,hh=54;
      o.push(S.T(x0-6,yh-hh/2,"使った","end",9.5,"ink",true));o.push(S.T(x0-6,yh-hh/2+13,"回数","end",9.5,"ink",true));
      for(var c3=0;c3<37;c3++){var bh=mx?hh*cnt[c3]/mx:0;
        if(cnt[c3])o.push(S.RECT(x0+c3*cw+2,yh-bh,cw-4,bh,1,U.soft("green"),"green",1));
        o.push(S.T(x0+c3*cw+cw/2,yh+13,String(c3),"middle",9.5,map[c3]?"green":"faint",false,true));
        if(cnt[c3]&&mx<=99)o.push(S.T(x0+c3*cw+cw/2,yh-bh-3,String(cnt[c3]),"middle",9.5,"ink"));}
      o.push(S.L(x0,yh,x0+37*cw,yh,"muted",1));
      var lg=yh+30;
      o.push(S.D(x0+6,lg-4,"signal",3.5));o.push(S.T(x0+14,lg,"そのまま使った","start",9.5,"signal"));
      o.push(S.D(x0+124,lg-4,"gold",3.5));o.push(S.T(x0+132,lg,"割り当て直した","start",9.5,"gold"));
      o.push(S.CIRC(x0+242,lg-4,2.6,"alias",1));o.push(S.T(x0+250,lg,"割り当て直す前の番号（使わないチャネル）","start",9.5,"alias"));
      box.set(S.svg(W,lg+8,o));
      /* 読み出し */
      var rm=0,same=0;sq.forEach(function(s,k){if(s.rm)rm++;if(k&&s.c===sq[k-1].c)same++;});
      var uc=used.map(function(c){return cnt[c];}),mn=Math.min.apply(null,uc),mxu=Math.max.apply(null,uc);
      var first=sq.slice(0,12).map(function(s){return s.rm?'<span style="color:var(--gold)">'+s.u+"→"+s.c+"</span>":String(s.c);}).join(" ・ ");
      var note="";
      if(a===0&&N<37&&h%N===0)note='<br><span class="warn">h = '+h+' が N = '+N+' で割り切れるので、割り当て直しが続くと同じチャネルが続く。</span>';
      if(a===0&&N===37)note='<br>使わないチャネルが無いので、37 回で 37 本を 1 回ずつ使い、38 回目からは同じ列を繰り返す。';
      ro.innerHTML=msg+"使うチャネル N = <b>"+N+"</b> 本"+(N<37?"（"+used.join("・")+" 番）":"")+"<br>"+
        "1〜12 回目: "+first+"（金は、割り当て直す前の番号 → 使ったチャネル）<br>"+
        "割り当て直した回数 <b>"+rm+"</b> / "+E+" 回 ・ 続く 2 回で同じチャネルになった回数 <b>"+same+"</b> / "+(E-1)+" ・ 使うチャネルごとの使った回数: 最少 "+mn+" 回、最多 "+mxu+" 回"+
        (a===1?"<br>#2 の接続ごとの 16 ビットの値 = 0x"+U.fmt.hex(cid,4)+(cid===0x305F?"（Core Specification の計算例と同じ値。全部使うとき 1〜4 回目は 25・20・6・21 番）":""):"")+note;
    }
    draw();
  };

  /* ===== 17 章 アドバタイズとスキャン ===== */
  /* 1 節: 同じ advInterval の機器どうしの重なり（全台が同じ時刻に送り始める） */
  REG.w17_collide=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"COLLIDE","同じ間隔で送るアドバタイザどうしの重なり");
    var row=U.ctrls(el);
    var nA=U.slider(row,"アドバタイザの台数",{values:[2,3,4,5,6],value:2,fmt:function(v){return v+" 台";},onInput:draw});
    var ai=U.slider(row,"advInterval",{values:[20,50,100,152.5,200,500,1000],value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var row2=U.ctrls(el);
    var dl=U.checkbox(row2,"advDelay（イベントごとに 0〜10 ms の乱数）",true,draw);
    var pp=U.slider(row2,"時計の差（最大）",{values:[0,10,20,40,100,500],value:0,fmt:function(v){return v+" ppm";},onInput:draw});
    var ne=U.slider(row2,"イベントの数",{values:[100,300,1000],value:300,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var L=0.376, COLS=["signal","purple","teal","gold","green","alias"], NAMES="ABCDEF";
    function sl(d){return (d<0?-1:1)*Math.log(1+Math.abs(d)/0.2)/Math.LN10;}   /* 0 付近を拡大する目盛 */
    function near(arr,x){var lo=0,hi=arr.length-1;while(hi-lo>1){var m=(lo+hi)>>1;if(arr[m]<=x)lo=m;else hi=m;}return Math.abs(arr[lo]-x)<=Math.abs(arr[hi]-x)?arr[lo]:arr[hi];}
    function draw(){
      var N=nA.get(),A=ai.get(),useD=dl.get(),ppm=pp.get(),K=ne.get(),R=U.rng(seed*7919+N*31);
      var err=[],t=[],ev=[],i,k;
      for(i=0;i<N;i++){err.push(i===0?0:(R.next()*2-1)*ppm*1e-6);t.push([]);}
      for(i=0;i<N;i++){var tt=0;for(k=0;k<K;k++){t[i].push(tt);ev.push([tt,i,k]);tt+=A*(1+err[i])+(useD?R.range(0,10):0);}}
      ev.sort(function(a,b){return a[0]-b[0];});
      var hit=[];for(i=0;i<N;i++){hit.push([]);for(k=0;k<K;k++)hit[i].push(false);}
      for(var a=0;a<ev.length;a++){for(var b=a+1;b<ev.length&&ev[b][0]-ev[a][0]<L;b++){if(ev[b][1]!==ev[a][1]){hit[ev[a][1]][ev[a][2]]=true;hit[ev[b][1]][ev[b][2]]=true;}}}
      var half=A/2+5,ym=sl(half),W=700,o=[],p=U.plot(78,20,592,200,[0,K],[-ym,ym]);
      o.push(S.RECT(p.x,p.Y(sl(L)),p.w,p.Y(sl(-L))-p.Y(sl(L)),0,U.soft("alias"),"none",0));
      o.push(p.axes({xl:"イベントの番号",yt:[]}));
      [0,L,1,10,100,1000].forEach(function(v){if(v>half)return;(v?[v,-v]:[0]).forEach(function(u){var yy=p.Y(sl(u));
        o.push(S.L(p.x,yy,p.x+p.w,yy,"grid",1));o.push(S.L(p.x-4,yy,p.x,yy,"muted",1));
        o.push(S.T(p.x-7,yy+3.3,(u>0?"+":u<0?"−":"")+(Math.abs(u)===L?"0.376":String(Math.abs(u))),"end",9,"muted"));});});
      o.push(S.T(p.x-50,p.y+p.h/2,"最も近い A のイベントとのずれ [ms]","middle",9.5,"muted",false,false,-90));
      o.push(S.T(p.x+p.w-4,p.Y(sl(L))-4,"|ずれ| < 0.376 ms で重なる","end",9.5,"alias",true,false,null,true));
      for(i=1;i<N;i++){
        var seg=[],c=COLS[i],prev=null,dl_;
        for(k=0;k<K;k++){var d=t[i][k]-near(t[0],t[i][k]);
          if(prev!==null&&Math.abs(d-prev)>half){if(seg.length>1)o.push(p.line(seg,c,1.4));seg=[];}   /* いちばん近い A のイベントが入れ替わった所で線を切る */
          seg.push([k,sl(d)]);prev=d;dl_=d;}
        if(seg.length>1)o.push(p.line(seg,c,1.4));else if(seg.length)o.push(S.D(p.X(seg[0][0]),p.Y(seg[0][1]),c,2));
        o.push(S.T(p.X(K)+4,p.Y(sl(dl_))+4,NAMES[i],"start",10,c,true));
      }
      // 重なったイベントの印
      var y0=262;
      o.push(S.T(p.x,y0-12,"重なったイベント（赤）","start",10,"ink",true));
      var tot=0,runs=[],rates=[];
      for(i=0;i<N;i++){
        var yy=y0+i*16,cnt=0,run=0,best=0;
        o.push(S.T(p.x-8,yy+9,"機器 "+NAMES[i],"end",9.5,COLS[i],true));
        o.push(S.RECT(p.x,yy,p.w,11,2,"var(--screen)","line",0.8));
        for(k=0;k<K;k++){if(hit[i][k]){cnt++;run++;best=Math.max(best,run);o.push(S.RECT(p.X(k),yy,Math.max(1,p.w/K),11,0,"alias","none",0));}else run=0;}
        tot+=cnt;runs.push(best);rates.push(cnt/K);
      }
      box.set(S.svg(W,y0+N*16+8,o));
      var lines=[];
      for(i=0;i<N;i++)lines.push(["機器 "+NAMES[i],i?(err[i]>=0?"+":"−")+Math.abs(err[i]*1e6).toFixed(1)+" ppm":"（基準）",U.fmt.int(Math.round(rates[i]*K))+" / "+K,F.pct(rates[i],3),runs[i]+" 回"]);
      var eb=Math.abs(err[1]),stepUs=eb*A*1000,nmove=stepUs>0?Math.ceil(L*1000/stepUs):Infinity;
      var all=tot/(N*K),msg;
      if(!useD&&ppm===0)msg='<span class="warn">advDelay が無く時計もそろっているので、ずれは 0 のまま変わらず、すべてのイベントが重なる。</span>';
      else if(!useD)msg='<b>advDelay が無いので、ずれは時計の差だけでゆっくり動く。</b> 1 回にずれるのは advInterval × 時計の差で、B（'+(err[1]*1e6).toFixed(1).replace("-","−")+' ppm）は 1 回に '+U.sig(stepUs,3)+' µs、0.376 ms を超えるまでに約 '+(isFinite(nmove)?U.fmt.int(nmove):"∞")+' 回かかる。';
      else msg='<span class="ok">advDelay があるので、ずれは毎回、2 台の乱数の差だけ動く。</span> 同時に始めた 2 台が次のイベントでも重なる確率は 1 − (1 − 0.376/10)² ≈ 7.4 %。';
      ro.innerHTML=msg+"<br>重なったイベントの割合（全台の平均）= <b>"+F.pct(all,3)+"</b>（パケットは AdvData 31 バイトの 0.376 ms とした。縦軸は 0 付近を拡大した目盛）"+
        U.tbl(["機器","A との時計の差","重なったイベント","割合","最長の連続"],lines,["left","right","right","right","right"]);
    }
    draw();
  };

  /* 3 節: AdvData とスキャン応答の組み立て */
  REG.w17_adv=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ADV DATA","AD 構造を並べて AdvData とスキャン応答を作る");
    var row=U.ctrls(el);
    var pdu=U.select(row,"PDU の種類",["ADV_IND（接続・スキャン可）","ADV_SCAN_IND（スキャン可）","ADV_NONCONN_IND（どちらも不可）"],0,draw);
    var fl=U.select(row,"フラグ",["0x06（いつでも・BR/EDR なし）","0x05（限られた時間・BR/EDR なし）","入れない"],0,draw);
    var mode=U.select(row,"置き方",["すべて AdvData に","入りきらない分をスキャン応答へ"],1,draw);
    var row2=U.ctrls(el);
    var nm=U.textin(row2,"名前（UTF-8）","TH-01",draw,{width:"220px"});
    var uu=U.textin(row2,"16 ビット UUID（16 進、カンマ区切り）","180F",draw,{width:"220px"});
    var row3=U.ctrls(el);
    var u128=U.checkbox(row3,"128 ビット UUID を 1 つ載せる（例の値）",false,draw);
    var txp=U.checkbox(row3,"送信電力（0 dBm）",true,draw);
    var mf=U.checkbox(row3,"メーカー固有データ（会社 ID 0xFFFF + 温度 + 電池）",true,draw);
    var row4=U.ctrls(el);
    var tp=U.slider(row4,"温度",{min:-40,max:85,step:0.05,value:23.45,fmt:function(v){return v.toFixed(2)+" °C";},onInput:draw});
    var bt=U.slider(row4,"電池の残り",{min:0,max:100,step:1,value:87,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（24 バイト）に戻す",function(){pdu.set(0);fl.set(0);mode.set(1);nm.set("TH-01");uu.set("180F");u128.set(false);txp.set(true);mf.set(true);tp.set(23.45);bt.set(87);draw();});
    U.button(br,"長い名前にする",function(){nm.set("Thermo-Hygrometer-01");draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var COL={flags:"signal",name:"purple",uuid16:"green",uuid128:"green",tx:"teal",mfr:"gold"};
    var SHORT={flags:"フラグ",name:"名前",uuid16:"UUID",uuid128:"128 ビット UUID",tx:"送信電力",mfr:"メーカー固有"};
    function utf8(s){var out=[];for(var i=0;i<s.length;i++){var c=s.codePointAt(i);if(c>0xFFFF)i++;
      if(c<0x80)out.push(c);else if(c<0x800)out.push(0xC0|c>>6,0x80|c&63);else if(c<0x10000)out.push(0xE0|c>>12,0x80|c>>6&63,0x80|c&63);else out.push(0xF0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63);}return out;}
    function cut(bytes,n){if(n>=bytes.length)return bytes.slice();var k=Math.max(0,n);while(k>0&&(bytes[k]&0xC0)===0x80)k--;return bytes.slice(0,k);}   /* 文字の途中で切らない */
    function ad(type,data,key,label){return {type:type,data:data,key:key,label:label,bytes:[data.length+1,type].concat(data)};}
    function used(a){return a.reduce(function(s,x){return s+x.bytes.length;},0);}
    function draw(){
      var warn=[],items=[];
      var f=fl.get();if(f<2)items.push(ad(1,[f===0?6:5],"flags","フラグ"));
      var us=uu.get().split(/[,\s]+/).filter(function(x){return x.length;}),ud=[];
      us.forEach(function(x){if(!/^[0-9a-fA-F]{1,4}$/.test(x)){warn.push("UUID「"+U.esc(x)+"」は 16 ビットの 16 進ではないので除いた");return;}var v=parseInt(x,16);ud.push(v&255,v>>8);});
      if(ud.length)items.push(ad(3,ud,"uuid16","16 ビット UUID の一覧"));
      if(txp.get())items.push(ad(0x0A,[0],"tx","送信電力"));
      if(mf.get()){var tu=Math.round(tp.get()*100)&0xFFFF;items.push(ad(0xFF,[0xFF,0xFF,tu&255,tu>>8,bt.get()],"mfr","メーカー固有データ"));}
      if(u128.get())items.push(ad(7,[0xF0,0xE1,0xD2,0xC3,0xB4,0xA5,0x96,0x87,0x78,0x69,0x5A,0x4B,0x3C,0x2D,0x1E,0x0F],"uuid128","128 ビット UUID の一覧"));
      var name=utf8(nm.get()),adv=[],rsp=[],at=items.length&&items[0].key==="flags"?1:0;
      if(mode.get()===0){
        items.forEach(function(x){adv.push(x);});
        if(name.length)adv.splice(at,0,ad(9,name,"name","名前（完全）"));
      }else{
        items.forEach(function(x){if(x.key!=="uuid128")adv.push(x);});
        items.forEach(function(x){if(x.key==="uuid128"){if(used(adv)+x.bytes.length<=31)adv.push(x);else rsp.push(x);}});
        if(name.length){
          if(used(adv)+name.length+2<=31)adv.splice(at,0,ad(9,name,"name","名前（完全）"));
          else{
            var room=31-used(adv)-2;
            if(room>=1){var sh=cut(name,room);if(sh.length)adv.splice(at,0,ad(8,sh,"name","名前（短縮）"));}
            var full=cut(name,31-used(rsp)-2);
            if(full.length<name.length)warn.push("完全な名前もスキャン応答の 31 バイトに入りきらないので、途中で切った（AD タイプは短縮の 0x08 にした）");
            if(full.length)rsp.push(ad(full.length<name.length?8:9,full,"name",full.length<name.length?"名前（短縮）":"名前（完全）"));
          }
        }
      }
      var na=used(adv),nr=used(rsp),pd=pdu.get();
      if(pd===2&&nr)warn.push("ADV_NONCONN_IND はスキャン応答を返せないので、スキャン応答の分は誰にも届かない（ADV_SCAN_IND にする）");
      // 図
      var cw=18,x0=92,o=[],y1=34,y2=100,W=Math.max(700,x0+Math.max(31,na,nr)*cw+30),xl=x0+31*cw;
      function rowSvg(list,y,title){
        var x=x0,s=[],n=0;
        s.push(S.T(x0-8,y+15,title,"end",10.5,"ink",true));
        if(!list.length)s.push(S.T(x0+4,y+15,"（なし）","start",10,"muted"));
        list.forEach(function(it){
          var c=COL[it.key],wd=it.bytes.length*cw;
          s.push(S.T(x+wd/2,y-6,wd>=tw(SHORT[it.key],9)+4?SHORT[it.key]:"…","middle",9,c,true));
          it.bytes.forEach(function(b,j){var over=n>=31;
            s.push(S.RECT(x,y,cw,22,2,over?U.soft("alias"):U.soft(c),over?"alias":c,over?1.4:1));
            s.push(S.T(x+cw/2,y+15,F.hex(b),"middle",8.8,"ink",j<2,true));x+=cw;n++;});
        });
        s.push(S.L(xl,y-12,xl,y+28,"alias",1.6,"4 3"));
        return s.join("");
      }
      function tw(s,sz){return U.tw(s,sz);}
      o.push(rowSvg(adv,y1,"AdvData"));
      o.push(rowSvg(rsp,y2,"スキャン応答"));
      o.push(S.T(xl-4,y2+42,"31 バイトの上限 →","end",9.5,"alias"));
      box.set(S.svg(W,y2+50,o));
      var advB=[];adv.forEach(function(x){advB=advB.concat(x.bytes);});
      var tAdv=(16+Math.min(31,na))*8,tRsp=(16+Math.min(31,nr))*8,rows=[];
      adv.concat(rsp).forEach(function(x,i){var mean="";
        if(x.key==="flags")mean=x.data[0]===6?"ビット 1（いつでも）+ ビット 2（BR/EDR なし）":"ビット 0（限られた時間）+ ビット 2（BR/EDR なし）";
        else if(x.key==="name")mean="「"+U.esc(new TextDecoder().decode(new Uint8Array(x.data)))+"」 "+x.data.length+" バイト";
        else if(x.key==="uuid16"){var l=[];for(var j=0;j<x.data.length;j+=2)l.push("0x"+F.hex(x.data[j]|x.data[j+1]<<8,4));mean=l.join("、");}
        else if(x.key==="uuid128")mean="16 バイト（例の値）";
        else if(x.key==="tx")mean="0 dBm";
        else if(x.key==="mfr"){var v=x.data[2]|x.data[3]<<8;if(v>=0x8000)v-=0x10000;mean="会社 ID 0xFFFF、温度 0x"+F.hex(x.data[2]|x.data[3]<<8,4)+" = "+v+" → "+(v/100).toFixed(2)+" °C、電池 "+x.data[4]+" %";}
        rows.push([i<adv.length?"AdvData":"スキャン応答","0x"+F.hex(x.type)+" "+x.label,String(x.bytes[0]),mean]);});
      var ok=na<=31?'<span class="ok">AdvData '+na+' バイト（残り '+(31-na)+'）</span>':'<span class="warn">AdvData '+na+' バイト: 31 バイトを '+(na-31)+' バイト超える（赤のマス）。「入りきらない分をスキャン応答へ」を選ぶか、項目を減らす</span>';
      ro.innerHTML=ok+" ・ スキャン応答 "+nr+" バイト"+(nr>31?' <span class="warn">（31 を超える）</span>':"")+"<br>"+
        "AdvData を載せたパケット = 1 + 4 + 2 + 6 + "+Math.min(31,na)+" + 3 = "+(16+Math.min(31,na))+" バイト → LE 1M で <b>"+tAdv+" µs</b>"+
        (nr&&pd<2?" ・ SCAN_RSP = "+(16+Math.min(31,nr))+" バイト → <b>"+tRsp+" µs</b>":"")+
        (warn.length?'<br><span class="warn">'+warn.join("。<br>")+"。</span>":"")+
        U.tbl(["置き場所","AD タイプ","長さ","中身"],rows,["left","left","right","wrap"])+
        '<div class="wnote">HCI_LE_Set_Advertising_Data の H4 の形（06 章 5 節）: 01 08 20 20 '+F.hex(Math.min(31,na))+" "+advB.slice(0,31).map(function(b){return F.hex(b);}).join(" ")+(na<31?" + 00 × "+(31-na):"")+"</div>";
    }
    draw();
  };

  /* 5 節: 見つかるまでの時間のシミュレーション（モデルは本文と同じ: チャネルの間隔 1 ms、ウィンドウごとに 37・38・39 と替える） */
  REG.w17_disc=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"DISCOVERY","スキャンを始めてから初めて受け取るまでの時間");
    var snap=function(v){return Math.max(0.625,Math.round(v/0.625)*0.625);};
    var fms=function(v){return (Math.round(v*1000)/1000)+" ms";};
    var row=U.ctrls(el);
    var ai=U.slider(row,"advInterval",{min:20,max:10240,value:100,log:true,snap:snap,fmt:fms,onInput:draw});
    var ts=U.slider(row,"スキャン間隔 T_s",{min:2.5,max:10240,value:100,log:true,snap:snap,fmt:fms,onInput:draw});
    var row2=U.ctrls(el);
    var ww=U.slider(row2,"スキャンウィンドウ W",{min:2.5,max:10240,value:10,log:true,snap:snap,fmt:fms,onInput:draw});
    var ln=U.slider(row2,"AdvData の長さ",{min:0,max:31,step:1,value:31,fmt:function(v){return v+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var dl=U.checkbox(row3,"advDelay（0〜10 ms の乱数）",true,draw);
    var nt=U.slider(row3,"試す回数",{values:[300,1000,3000],value:1000,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例: 100 ms・T_s 100・W 10",function(){ai.set(100);ts.set(100);ww.set(10);dl.set(true);draw();});
    U.button(br,"advInterval 95 ms（r = 0）",function(){ai.set(95);ts.set(100);ww.set(10);draw();});
    U.button(br,"受信し続ける（W = T_s）",function(){ww.set(ts.get());draw();});
    U.button(br,"T_s 10 ms・W 2.5 ms",function(){ts.set(10);ww.set(2.5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var CAP=600000, G=1.0, NREC=21;   /* 打ち切り 600 s、チャネルの間隔 1 ms、位相を記録する試行の数 */
    function trial(R,A,Ts,W,L,useD,rec){
      var t=R.next()*(A+(useD?R.range(0,10):0)),n=0;
      while(t<CAP&&n<200000){
        n++;
        if(rec&&rec.length<80)rec.push(t);
        for(var c=0;c<3;c++){var s=t+c*G,j=Math.floor(s/Ts);if(j%3===c&&s+L<=j*Ts+W)return [s+L,n];}
        t+=A+(useD?R.range(0,10):0);
      }
      return [null,n];
    }
    function draw(){
      var A=ai.get(),Ts=ts.get(),W=ww.get(),L=(16+ln.get())*8/1000,useD=dl.get(),N=nt.get(),warn="",note="";
      if(W>Ts){W=Ts;warn='<span class="warn">ウィンドウが間隔より長いので、間隔と同じ値で計算した。</span><br>';}
      var cont=W>=Ts,p=cont?1:Math.max(0,W-L)/Ts,Tm=A+(useD?5:0);
      var est=cont?N:N*Math.min(1/Math.max(1e-9,p),CAP/Tm);
      if(est>4e6){N=Math.max(100,Math.floor(N*4e6/est));note="。計算を軽くするため "+N+" 回にした";}
      var R=U.rng(seed*104729+7),res=[],miss=0,ns=0,recs=[];
      for(var i=0;i<N;i++){var rec=i<NREC?[]:null,r=trial(R,A,Ts,W,L,useD,rec);
        if(rec)recs.push({n:r[1],rec:rec,found:r[0]!==null});
        if(r[0]===null)miss++;else{res.push(r[0]);ns+=r[1];}}
      res.sort(function(a,b){return a-b;});
      var mean=res.length?res.reduce(function(s,x){return s+x;},0)/res.length:NaN,
          med=res.length?res[Math.floor(res.length/2)]:NaN,p95=res.length?res[Math.min(res.length-1,Math.floor(res.length*0.95))]:NaN,mx=res.length?res[res.length-1]:NaN;
      var amean=cont?Tm/2:(1/p-0.5)*Tm,n95=cont?1:Math.ceil(Math.log(0.05)/Math.log(1-p)),a95=n95*Tm;
      var rr=((Tm%Ts)+Ts)%Ts,rnear=Math.min(rr,Ts-rr),rhalf=Math.abs(rr-Ts/2);
      // ヒストグラム
      var o=[],Wd=700,xmax=Math.max(p95*1.15,cont?Tm*1.1:Math.min(a95*1.1,mx)),nb=40;
      if(!(xmax>0))xmax=Tm;
      var bins=[],over=0;for(var b=0;b<nb;b++)bins.push(0);
      res.forEach(function(x){var k=Math.floor(x/xmax*nb);if(k>=nb)over++;else bins[k]++;});
      var ymax=Math.max.apply(null,bins.concat([1]));
      var ph=U.plot(70,18,600,170,[0,xmax],[0,ymax*1.12]);
      var tf=function(v){return F.time(v/1000,3);};
      o.push(ph.axes({xl:"発見の時間",yl:"回数",xfmt:tf,yfmt:function(v){return String(Math.round(v));}}));
      bins.forEach(function(c,k){if(c)o.push(S.RECT(ph.X(k*xmax/nb),ph.Y(c),ph.X(xmax/nb)-ph.X(0)-1,ph.Y(0)-ph.Y(c),1,U.soft("signal"),"signal",1));});
      function vline(x,c,lab,dy){if(!(x>=0)||x>xmax)return;var rt=ph.X(x)>560;o.push(S.L(ph.X(x),ph.y,ph.X(x),ph.y+ph.h,c,1.6,c==="alias"?"5 4":null));o.push(S.T(ph.X(x)+(rt?-4:4),ph.y+12+dy,lab,rt?"end":"start",9.5,c,true,false,null,true));}
      vline(mean,"signal","平均",0);vline(p95,"gold","95 %",14);vline(amean,"alias","近似の平均",28);
      if(over)o.push(S.T(ph.x+ph.w,ph.y+ph.h+28,"右の枠外 "+over+" 回","end",9,"muted"));
      // 1 回分の位相（最初の 21 回のうち、かかった回数が真ん中のもの）
      recs.sort(function(a,b){return a.n-b.n;});
      var ex=recs[Math.floor(recs.length/2)],rec=ex?ex.rec:[];
      var y2=240,kx=Math.max(10,Math.min(80,rec.length)),pp=U.plot(70,y2,600,120,[0,kx],[0,Ts]);
      o.push(S.RECT(pp.x,pp.Y(Math.max(0,W-L)),pp.w,pp.Y(0)-pp.Y(Math.max(0,W-L)),0,U.soft("green"),"none",0));
      o.push(pp.axes({xl:"イベントの番号（最初の "+NREC+" 回のうち、かかった回数が真ん中の 1 回）",yl:"位相",xfmt:function(v){return String(Math.round(v));},yfmt:function(v){return F.time(v/1000,2);},ny:4}));
      rec.forEach(function(t,k){o.push(S.D(pp.X(k),pp.Y(t%Ts),ex.found&&k===ex.n-1?"green":"signal",2.6));});
      o.push(S.T(pp.x+6,pp.Y(Math.max(0,W-L))-4,"ウィンドウ（ch 37 の位置）","start",9,"green",false,false,null,true));
      box.set(S.svg(Wd,y2+156,o));
      var adv;
      if(cont)adv='<span class="ok">受信し続けるので、最初のイベントでほぼ受け取れる（上限 ≈ advInterval + 10 ms + イベントの長さ）。</span>';
      else if(Ts<=10&&useD)adv='<span class="ok">スキャン間隔が advDelay の幅 10 ms 以下なので、位相がよく混ざり、近似に近い。</span>';
      else if(rnear<Math.max(2,W/2))adv='<span class="warn">r = '+fms(rr)+' が 0 に近い: 位相がほとんど進まず、近似よりずっと遅くなりやすい。</span>';
      else if(rhalf<Math.max(2,W/2))adv='<span class="warn">r = '+fms(rr)+' がスキャン間隔の半分に近い: 位相が 2 か所を行き来し、遅くなりやすい。</span>';
      else adv='位相は 1 回にほぼ r = '+fms(rr)+' ずつ進む（r = (advInterval'+(useD?' + 5 ms':'')+') mod T_s）。';
      ro.innerHTML=warn+adv+"<br>"+
        "シミュレーション（"+N+" 回"+note+"）: 平均 <b>"+tf(mean)+"</b> ・ 中央値 "+tf(med)+" ・ 95 % <b>"+tf(p95)+"</b> ・ 最大 "+tf(mx)+" ・ 平均のイベント数 "+(res.length?U.sig(ns/res.length,3):"—")+(miss?' ・ <span class="warn">600 s で見つからなかった '+miss+' 回</span>':"")+"<br>"+
        "近似: p = (W − L) / T_s = ("+fms(W)+" − "+fms(L)+") / "+fms(Ts)+" = "+(cont?"1（受信し続ける）":U.sig(p,3))+" ・ 平均 "+(cont?"1":U.sig(1/p,3))+" 回 → <b>"+tf(amean)+"</b> ・ 95 % ≈ "+n95+" 回 → "+tf(a95)+"<br>"+
        "受信の割合 W / T_s = "+F.pct(W/Ts,3)+"（スキャナの平均電流は、ほぼ この割合 × 受信の電流）";
    }
    draw();
  };

  /* ===== 18 章 接続と GATT ===== */
  function _w18_ms(v){return v>=1000?(+(v/1000).toPrecision(4))+" s":(+v.toPrecision(4))+" ms";}

  /* ---- (1) 接続パラメータ: 接続間隔・ペリフェラルレイテンシ・監視タイムアウト ---- */
  REG.w18_conn=function(el,U){
    var S=U.S;
    U.head(el,"CONNECTION","接続パラメータと監視タイムアウト");
    var row=U.ctrls(el);
    var iv=U.slider(row,"接続間隔 I",{min:7.5,max:4000,value:30,log:true,snap:function(v){return Math.max(7.5,Math.min(4000,Math.round(v/1.25)*1.25));},fmt:_w18_ms,onInput:draw});
    var lt=U.slider(row,"ペリフェラルレイテンシ L",{values:[0,1,2,3,4,5,6,8,10,15,20,30,50,100,200,499],value:4,fmt:function(v){return String(v);},onInput:draw});
    var row2=U.ctrls(el);
    var to=U.slider(row2,"監視タイムアウト",{min:100,max:32000,value:4000,log:true,snap:function(v){return Math.max(100,Math.min(32000,Math.round(v/10)*10));},fmt:_w18_ms,onInput:draw});
    var pl=U.slider(row2,"1 回の機会が失われる確率 p",{values:[0,0.01,0.02,0.05,0.1,0.2,0.3,0.5,0.7],value:0.1,fmt:function(v){return Math.round(v*100)+" %";},onInput:draw});
    var br=U.btnrow(el);
    var seed=1;
    U.button(br,"例: 30 ms・L 4・4 s",function(){iv.set(30);lt.set(4);to.set(4000);draw();});
    U.button(br,"悪い例: 50 ms・L 3・300 ms",function(){iv.set(50);lt.set(3);to.set(300);pl.set(0.1);draw();});
    U.button(br,"良い例: 50 ms・L 3・1 s",function(){iv.set(50);lt.set(3);to.set(1000);pl.set(0.1);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var I=iv.get(),L=lt.get(),TO=to.get(),p=pl.get(),E=(1+L)*I,lim=2*E,ok=TO>lim;
      var M=Math.ceil(TO/E-1e-9)-1;               /* 期限より前に来る機会の数 */
      var r=U.rng(seed*7919+13);
      /* 時間軸に描く範囲: 監視タイムアウトの 3 倍か、機会 12 回分の長いほう（機会は最大 90 回まで描く） */
      var span=Math.min(Math.max(3*TO,12*E),90*E), W=700, x0=86, x1=684, o=[];
      var X=function(t){return x0+(x1-x0)*t/span;};
      var yc=44,yp=84,yt=134,th=40;
      o.push(S.T(10,yc+4,"セントラル","start",10,"purple",true));
      o.push(S.T(10,yp+4,"ペリフェラル","start",10,"signal",true));
      o.push(S.T(10,yt-6,"監視の","start",10,"teal",true));o.push(S.T(10,yt+8,"タイマ","start",10,"teal",true));
      var nev=Math.floor(span/I);
      if(nev<=240){for(var k=0;k<=nev;k++){o.push(S.L(X(k*I),yc-6,X(k*I),yc+6,"purple",1));}}
      else o.push(S.RECT(x0,yc-5,x1-x0,10,2,U.soft("purple"),"purple",1));
      o.push(S.T(x1,yc-12,nev<=240?"どの接続イベントでも送る（"+nev+" 回）":"どの接続イベントでも送る（"+nev+" 回。線は省略）","end",9.5,"muted"));
      /* 機会ごとに失われるかを決め、タイマを進める */
      var last=0,pts=[[X(0),yt+th]],drops=[];
      var nOp=Math.floor(span/E);
      for(var m=1;m<=nOp;m++){
        var t=m*E;
        while(t-last>=TO){                         /* 機会より先に期限が来た（切断と判断し、すぐ接続し直したとする） */
          var td=last+TO; pts.push([X(td),yt]);pts.push([X(td),yt+th]);drops.push(td);last=td;
        }
        var lost=r.chance(p), x=X(t);
        if(lost){o.push(S.X(x,yp,5,"alias",1.8));}
        else{o.push(S.RECT(x-5,yp-7,10,14,2,U.soft("signal"),"signal",1.2));}
        if(!lost){var hh=Math.min(1,(t-last)/TO)*th;pts.push([x,yt+th-hh]);pts.push([x,yt+th]);last=t;}
      }
      /* 最後の機会から右端まで */
      while(span-last>=TO){var td2=last+TO;pts.push([X(td2),yt]);pts.push([X(td2),yt+th]);drops.push(td2);last=td2;}
      pts.push([X(span),yt+th-Math.min(1,(span-last)/TO)*th]);
      o.push(S.L(x0,yt,x1,yt,"alias",1.2,"5 3"));o.push(S.T(x1,yt-4,"監視タイムアウト","end",9.5,"alias"));
      o.push(S.PL(pts,"teal",1.6));
      drops.forEach(function(td){o.push(S.L(X(td),yp-14,X(td),yt+th,"alias",2));o.push(S.T(X(td)+3,yp-16,"切断","start",9.5,"alias",true));});
      /* 目盛 */
      var tk=U.nice(0,span,6);
      tk.forEach(function(t){o.push(S.L(X(t),yt+th,X(t),yt+th+4,"muted",1));o.push(S.T(X(t),yt+th+16,_w18_ms(t),"middle",9.5,"muted"));});
      o.push(S.L(x0,yt+th,x1,yt+th,"muted",1));
      box.set(S.svg(W,yt+th+26,o));
      /* 1 時間の模擬 */
      var r2=U.rng(seed*104729+7),nh=Math.floor(3600000/E),run=0,disc=0;
      if(M>=1){for(var q=0;q<nh;q++){if(r2.chance(p)){run++;if(run>=M){disc++;run=0;}}else run=0;}}
      var Lmax=Math.ceil(TO/(2*I)-1-1e-9)-1;
      var cond=ok?'<span class="ok">満たす</span>':'<span class="warn">満たさない（Core Specification の要件に反する）</span>';
      ro.innerHTML="Interval = "+U.fmt.int(I/1.25)+"（× 1.25 ms）・Latency = "+L+"・Timeout = "+U.fmt.int(TO/10)+"（× 10 ms）<br>"+
        "条件: 監視タイムアウト "+_w18_ms(TO)+" &gt; 2(1 + L)I = "+_w18_ms(lim)+" … "+cond+
        (Lmax>=0?"（この I と監視タイムアウトで使える L は "+Math.min(499,Lmax)+" まで）":"（この I では L = 0 でも満たさない）")+"<br>"+
        "ペリフェラルが受信する間隔（最も少ない場合）(1 + L)I = <b>"+_w18_ms(E)+"</b> ・ セントラル → ペリフェラルの最大の待ち <b>"+_w18_ms(E)+"</b> ・ ペリフェラル → セントラル <b>"+_w18_ms(I)+"</b><br>"+
        (M>=1?"期限より前に来る機会 "+M+" 回 → 続けて <b>"+(M-1)+" 回</b>まで失っても保つ":"<span class=\"warn\">次の機会より先に期限が来る（何も失わなくても切断と判断する）</span>")+"<br>"+
        (M>=1?"模擬した 1 時間（機会 "+U.fmt.int(nh)+" 回、p = "+Math.round(p*100)+" %）で切断と判断した回数: <b>"+disc+"</b>":"")+
        '<div class="wnote">ペリフェラルは送るものが無く、(1 + L) 回に 1 回だけ受信するとした。各機会のやり取りは、互いに関係なく確率 p で失われるとした（実際の干渉は続けて起きやすい）。切断と判断した後は、すぐに接続し直したとして続けた。セントラルの行の縦線は、接続イベントごとの送信。</div>';
    }
    draw();
  };

  /* ---- (2) GATT のクライアントとサーバのやり取り ---- */
  var _w18_U1="45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 01 00 3A 5C",_w18_U2="45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 02 00 3A 5C",_w18_U3="45 B8 27 0D 9E 3F C6 A1 7D 4B 2F 8E 03 00 3A 5C";
  function _w18_hx(s){return s.split(" ").filter(function(x){return x;}).map(function(x){return parseInt(x,16);});}
  function _w18_le(v){return [v&255,(v>>8)&255];}
  function _w18_h4(v){return "0x"+("000"+v.toString(16).toUpperCase()).slice(-4);}
  function _w18_table(){
    /* [ハンドル, 型（16 ビット）か 128 ビットの型の名前, 値, 読める, 書ける, 種類, 名前] */
    return [
      [0x0001,0x2800,[0x00,0x18],1,0,"svc","Generic Access（0x1800）"],
      [0x0002,0x2803,[0x02,0x03,0x00,0x00,0x2A],1,0,"decl","宣言: Read・値 0x0003・0x2A00"],
      [0x0003,0x2A00,[0x54,0x48,0x2D,0x30,0x31],1,0,"val","機器の名前 \"TH-01\""],
      [0x0004,0x2800,[0x0F,0x18],1,0,"svc","Battery Service（0x180F）"],
      [0x0005,0x2803,[0x12,0x06,0x00,0x19,0x2A],1,0,"decl","宣言: Read・Notify・値 0x0006・0x2A19"],
      [0x0006,0x2A19,[87],1,0,"val","電池の残り"],
      [0x0007,0x2902,[0,0],1,1,"desc","CCCD（電池）"],
      [0x0008,0x2800,_w18_hx(_w18_U1),1,0,"svc","独自のサービス 5C3A0001-…"],
      [0x0009,0x2803,[0x32,0x0A,0x00].concat(_w18_hx(_w18_U2)),1,0,"decl","宣言: Read・Notify・Indicate・値 0x000A"],
      [0x000A,"5C3A0002-…",_w18_le(2345),1,0,"val","温度"],
      [0x000B,0x2902,[0,0],1,1,"desc","CCCD（温度）"],
      [0x000C,0x2803,[0x0A,0x0D,0x00].concat(_w18_hx(_w18_U3)),1,0,"decl","宣言: Read・Write・値 0x000D"],
      [0x000D,"5C3A0003-…",_w18_le(60),1,1,"val","測定の間隔"]];
  }
  var _w18_OPN={0x01:"Error Response",0x04:"Find Information Request",0x05:"Find Information Response",0x08:"Read By Type Request",0x09:"Read By Type Response",
    0x0A:"Read Request",0x0B:"Read Response",0x10:"Read By Group Type Request",0x11:"Read By Group Type Response",0x12:"Write Request",0x13:"Write Response",
    0x52:"Write Command",0x1B:"Handle Value Notification",0x1D:"Handle Value Indication",0x1E:"Handle Value Confirmation"};
  var _w18_ERR={0x01:"Invalid Handle",0x02:"Read Not Permitted",0x03:"Write Not Permitted",0x04:"Invalid PDU",0x06:"Request Not Supported",0x0A:"Attribute Not Found",0x0D:"Invalid Attribute Value Length"};
  var _w18_KC={svc:"purple",decl:"gold",val:"signal",desc:"teal"};

  REG.w18_gatt=function(el,U){
    var S=U.S,MTU=23;
    U.head(el,"GATT","スマートフォン（クライアント）と TH-01（サーバ）のやり取り");
    var tbl,log,hl,known,seedT,pendInd,opn;
    function reset(){tbl=_w18_table();log=[];hl={};known={svc:[],chr:[],dsc:[]};seedT=0;pendInd=false;opn=0;}
    reset();
    function find(h){for(var i=0;i<tbl.length;i++)if(tbl[i][0]===h)return tbl[i];return null;}
    function g16(b,i){return b[i]|(b[i+1]<<8);}
    function err(op,h,code){return [0x01,op].concat(_w18_le(h),[code]);}
    /* サーバ: 要求を 1 つ処理して返す PDU（無ければ null） */
    function server(q){
      var op=q[0],cmd=op&0x40;
      if(op===0x10||op===0x08||op===0x04){
        var s=g16(q,1),e=g16(q,3),out=[],el=0;
        if(op===0x04){out=[0x05,0];for(var i=0;i<tbl.length;i++){var a=tbl[i];if(a[0]<s||a[0]>e)continue;var ul=typeof a[1]==="number"?2:16;if(!el)el=ul;if(ul!==el||out.length+2+ul>MTU)break;
            out=out.concat(_w18_le(a[0]),typeof a[1]==="number"?_w18_le(a[1]):_w18_hx(a[1]===tbl[9][1]?_w18_U2:_w18_U3));hl[a[0]]="read";}
          if(!el)return err(op,s,0x0A);out[1]=el===2?1:2;return out;}
        var t=g16(q,5);out=[op+1,0];
        for(var j=0;j<tbl.length;j++){var b=tbl[j];if(b[0]<s||b[0]>e||b[1]!==t)continue;
          var item;
          if(op===0x10){var end=tbl[tbl.length-1][0];for(var k=j+1;k<tbl.length;k++)if(tbl[k][1]===0x2800){end=tbl[k][0]-1;break;}item=_w18_le(b[0]).concat(_w18_le(end),b[2]);}
          else item=_w18_le(b[0]).concat(b[2]);
          if(!el)el=item.length;if(item.length!==el||out.length+el>MTU)break;out=out.concat(item);hl[b[0]]="read";}
        if(!el)return err(op,s,0x0A);out[1]=el;return out;}
      if(op===0x0A||op===0x12||op===0x52){
        var h=g16(q,1),at=find(h);
        if(!at)return cmd?null:err(op,h,0x01);
        if(op===0x0A){if(!at[3])return err(op,h,0x02);hl[h]="read";return [0x0B].concat(at[2].slice(0,MTU-1));}
        var v=q.slice(3);
        if(!at[4]){hl[h]="bad";return cmd?null:err(op,h,0x03);}
        if(v.length!==at[2].length){hl[h]="bad";return cmd?null:err(op,h,0x0D);}
        at[2]=v;hl[h]="write";
        return cmd?null:[0x13];}
      if(op===0x1E){pendInd=false;return null;}
      return cmd?null:err(op,0,0x06);
    }
    /* PDU の解読（欄ごとの色と説明） */
    function decode(b){
      var op=b[0],n=_w18_OPN[op]||"0x"+U.fmt.hex(op),f=[["opc",1]],d=n;
      function hrange(i){return _w18_h4(g16(b,i))+"〜"+_w18_h4(g16(b,i+2));}
      if(op===0x10||op===0x08){f.push(["hdl",4],["typ",b.length-5]);d+=": 範囲 "+hrange(1)+"、型 "+_w18_h4(g16(b,5))+(g16(b,5)===0x2800?"（サービス宣言）":"（キャラクタリスティック宣言）");}
      else if(op===0x04){f.push(["hdl",4]);d+=": 範囲 "+hrange(1);}
      else if(op===0x11){var L=b[1];f.push(["len",1]);var parts=[];for(var i=2;i+L<=b.length;i+=L){f.push(["hdl",4],["val",L-4]);parts.push(hrange(i)+" = "+(L===6?_w18_h4(g16(b,i+4)):"5C3A"+U.fmt.hex(b[i+L-3])+U.fmt.hex(b[i+L-4])+"-…"));}d+=": 組の長さ "+L+"、"+parts.join("、");}
      else if(op===0x09){var L2=b[1];f.push(["len",1]);var ps=[];for(var j=2;j+L2<=b.length;j+=L2){f.push(["hdl",2],["val",L2-2]);ps.push("宣言 "+_w18_h4(g16(b,j))+": プロパティ 0x"+U.fmt.hex(b[j+2])+"・値のハンドル "+_w18_h4(g16(b,j+3)));}d+=": 組の長さ "+L2+"、"+ps.join("、");}
      else if(op===0x05){f.push(["len",1],["hdl",2],["typ",b.length-4]);d+=": "+_w18_h4(g16(b,2))+" の型は "+(b[1]===1?_w18_h4(g16(b,4)):"128 ビット")+(g16(b,4)===0x2902?"（CCCD）":"");}
      else if(op===0x0A){f.push(["hdl",2]);d+=": ハンドル "+_w18_h4(g16(b,1));}
      else if(op===0x0B){f.push(["val",b.length-1]);d+=": 値 "+b.slice(1).map(function(x){return U.fmt.hex(x);}).join(" ");}
      else if(op===0x12||op===0x52||op===0x1B||op===0x1D){f.push(["hdl",2],["val",b.length-3]);d+=": ハンドル "+_w18_h4(g16(b,1))+"、値 "+b.slice(3).map(function(x){return U.fmt.hex(x);}).join(" ");}
      else if(op===0x01){f.push(["opc",1],["hdl",2],["err",1]);d+=": 要求 0x"+U.fmt.hex(b[1])+"・ハンドル "+_w18_h4(g16(b,2))+"・0x"+U.fmt.hex(b[4])+" "+(_w18_ERR[b[4]]||"");}
      var col={opc:"purple",hdl:"gold",typ:"teal",val:"signal",len:"muted",err:"alias"},cs=[];
      f.forEach(function(x){for(var k=0;k<x[1];k++)cs.push(col[x[0]]);});
      return {name:n,desc:d,colors:cs};
    }
    function send(q,note){
      log.push({dir:0,b:q,note:note||"",op:opn});
      var r=server(q);
      if(r)log.push({dir:1,b:r,note:"",op:opn});
      return r;
    }
    function act(fn){hl={};opn++;fn();draw();}
    var r1=U.btnrow(el);
    U.button(r1,"① サービスを探す",function(){act(function(){known.svc=[];var s=1;for(var i=0;i<5;i++){var r=send([0x10].concat(_w18_le(s),[0xFF,0xFF,0x00,0x28]));if(r[0]===0x01)break;var L=r[1];var last=r.length-L;var e=g16(r,last+2);
      for(var j=2;j+L<=r.length;j+=L)known.svc.push(_w18_h4(g16(r,j))+"〜"+_w18_h4(g16(r,j+2)));s=e+1;}});});
    U.button(r1,"② キャラクタリスティックを探す（独自のサービス）",function(){act(function(){known.chr=[];var s=8;for(var i=0;i<5;i++){var r=send([0x08].concat(_w18_le(s),[0x0D,0x00,0x03,0x28]));if(r[0]===0x01)break;
      known.chr.push("値 "+_w18_h4(g16(r,5))+"（プロパティ 0x"+U.fmt.hex(r[4])+"）");s=g16(r,2)+1;}});});
    U.button(r1,"③ 記述子を探す（温度）",function(){act(function(){known.dsc=[];var r=send([0x04,0x0B,0x00,0x0B,0x00]);if(r[0]===0x05)known.dsc.push(_w18_h4(g16(r,2))+" CCCD");});});
    var r2=U.btnrow(el);
    U.button(r2,"温度を読む",function(){act(function(){send([0x0A,0x0A,0x00]);});});
    U.button(r2,"電池の残りを読む",function(){act(function(){send([0x0A,0x06,0x00]);});});
    var ivSel=U.select(r2,"書く測定の間隔",[{v:"10",t:"10 s"},{v:"60",t:"60 s"},{v:"600",t:"600 s"}],"10",null);
    U.button(r2,"間隔を書く（Write Request）",function(){act(function(){send([0x12,0x0D,0x00].concat(_w18_le(+ivSel.get())));});});
    U.button(r2,"間隔を書く（Write Command）",function(){act(function(){send([0x52,0x0D,0x00].concat(_w18_le(+ivSel.get())),"応答なし");});});
    var r3=U.btnrow(el);
    U.button(r3,"温度に書いてみる",function(){act(function(){send([0x12,0x0A,0x00,0x00,0x00]);});});
    U.button(r3,"無いハンドルを読む",function(){act(function(){send([0x0A,0x20,0x00]);});});
    U.button(r3,"通知を有効に（CCCD ← 01 00）",function(){act(function(){send([0x12,0x0B,0x00,0x01,0x00]);});});
    U.button(r3,"指示を有効に（CCCD ← 02 00）",function(){act(function(){send([0x12,0x0B,0x00,0x02,0x00]);});});
    U.button(r3,"止める（CCCD ← 00 00）",function(){act(function(){send([0x12,0x0B,0x00,0x00,0x00]);});});
    var r4=U.btnrow(el);
    U.button(r4,"温度が変わる（TH-01 の側）",function(){act(function(){
      var t=find(0x000A),v=g16(t[2],0);if(v>=0x8000)v-=0x10000;var rr=U.rng(++seedT*31+5);v+=Math.round((rr.next()-0.5)*40);t[2]=_w18_le(v&0xFFFF);hl[0x000A]="write";
      var c=find(0x000B)[2][0];
      if(c&1)log.push({dir:1,b:[0x1B,0x0A,0x00].concat(t[2]),note:"",op:opn});
      else if(c&2){log.push({dir:1,b:[0x1D,0x0A,0x00].concat(t[2]),note:"",op:opn});pendInd=true;send([0x1E],"受け取ったので確認を返す");}
      else log.push({dir:-1,b:[],note:"CCCD が 00 00 なので、TH-01 は何も送らない（値は "+(v/100).toFixed(2)+" °C に変わった）",op:opn});});});
    U.button(r4,"初めから",function(){reset();draw();});
    var ro=U.readout(el);
    var tb=U.mk("div","");el.appendChild(tb);
    function draw(){
      /* 属性の表（強調つき） */
      var hc={read:"signal",write:"gold",bad:"alias"};
      var h='<div class="wtable"><table><thead><tr><th>ハンドル</th><th>型</th><th>値</th><th style="text-align:left">意味</th></tr></thead><tbody>';
      tbl.forEach(function(a){var k=hl[a[0]],st=k?' style="background:'+U.soft(hc[k])+';outline:1.5px solid '+U.col(hc[k])+'"':'';
        var val=a[2].length>6?a[2].slice(0,3).map(function(x){return U.fmt.hex(x);}).join(" ")+" …（"+a[2].length+" バイト）":a[2].map(function(x){return U.fmt.hex(x);}).join(" ");
        var mean=a[6];if(a[0]===0x000A){var v=g16(a[2],0);if(v>=0x8000)v-=0x10000;mean+=" "+(v/100).toFixed(2)+" °C";}
        if(a[0]===0x0006)mean+=" "+a[2][0]+" %";if(a[0]===0x000D)mean+=" "+g16(a[2],0)+" s";
        if(a[1]===0x2902){var cv=g16(a[2],0);mean+=cv===1?"・通知する":cv===2?"・指示する":cv===0?"・送らない":"";}
        h+='<tr'+st+'><td style="color:var(--'+_w18_KC[a[5]]+')">'+_w18_h4(a[0])+'</td><td>'+(typeof a[1]==="number"?_w18_h4(a[1]):a[1])+'</td><td>'+val+'</td><td style="text-align:left">'+U.esc(mean)+'</td></tr>';});
      h+='</tbody></table></div><div class="wnote">TH-01（GATT のサーバ）の属性の表。最後の操作で読まれた行は青、書き換わった行は金、拒んだ行は赤。</div>';
      tb.innerHTML=h;
      /* やり取りの記録（時刻の順、最大 8 個。最後の操作のものを濃く） */
      var lines=log.slice(-8).map(function(e){
        var fade=e.op!==opn?' opacity:.5;':'';
        if(e.dir<0)return '<div class="wnote" style="'+fade+'">'+U.esc(e.note)+'</div>';
        var dd=decode(e.b);
        return '<div style="margin:.35rem 0;'+fade+'"><b style="color:var(--'+(e.dir?"signal":"purple")+')">'+(e.dir?"TH-01 → スマートフォン":"スマートフォン → TH-01")+'</b> '+U.esc(dd.name)+(e.note?'（'+U.esc(e.note)+'）':'')+
          U.hexView(e.b,function(i){return dd.colors[i]||null;})+'<span style="font-size:.76rem">'+U.esc(dd.desc)+'</span></div>';}).join("");
      var kn="スマートフォンが探索で知ったこと: サービス "+(known.svc.length?known.svc.join("・"):"（まだ）")+" ／ キャラクタリスティック "+(known.chr.length?known.chr.join("・"):"（まだ）")+" ／ 記述子 "+(known.dsc.length?known.dsc.join("・"):"（まだ）");
      ro.innerHTML=(lines||'<div class="wnote">上のボタンでスマートフォンの操作を選ぶ。</div>')+'<div class="wnote">'+kn+'。薄い行は前の操作のもの。ATT の PDU の長さの上限は既定の 23 バイト（5 節）。16 進の色: 紫 = オペコード、金 = ハンドル（範囲）、青 = 値、青緑 = 型、赤 = 誤りの番号。</div>';
    }
    draw();
  };

  /* ---- (3) MTU と長い値 ---- */
  REG.w18_mtu=function(el,U){
    var S=U.S;
    U.head(el,"ATT_MTU","1 回に運べる大きさと、長い値の読み書き");
    var row=U.ctrls(el);
    var mt=U.slider(row,"ATT_MTU",{values:[23,27,50,65,100,128,158,185,247,251,512,517],value:23,fmt:function(v){return v+" バイト";},onInput:draw});
    var ln=U.slider(row,"値の長さ",{min:1,max:512,step:1,value:50,fmt:function(v){return v+" バイト";},onInput:draw});
    var row2=U.ctrls(el);
    var c1=U.mk("div","ctrl",'<label><span>操作</span></label>');c1.style.flex="1 1 100%";row2.appendChild(c1);
    var op=U.seg(c1,["読む（Read と Read Blob）","書く（Write か Prepare・Execute）","通知"],0,draw);
    var row3=U.ctrls(el);
    var c2=U.mk("div","ctrl",'<label><span>リンク層のペイロードの上限</span></label>');c2.style.flex="1 1 100%";row3.appendChild(c2);
    var ll=U.seg(c2,["27 バイト（既定）","251 バイト（広げた場合。19 章）"],0,draw);
    var box=U.svgbox(el); var tb=U.mk("div","");el.appendChild(tb); var ro=U.readout(el);
    function draw(){
      var M=mt.get(),n=ln.get(),o=op.get(),LL=ll.get()?251:27;
      var pdus=[],segs=[],warn="";
      if(o===0){var c=M-1,off=0,first=true;
        while(true){var k=Math.min(c,n-off);
          pdus.push([0,first?"Read Request":"Read Blob Request（オフセット "+off+"）",first?3:5]);
          pdus.push([1,(first?"Read Response":"Read Blob Response")+"（"+(k?off+"〜"+(off+k-1):"0 バイト")+"）",1+k]);
          if(k)segs.push([off,k]);off+=k;first=false;if(k<c)break;}
      }else if(o===1){
        if(n<=M-3){pdus.push([0,"Write Request（0〜"+(n-1)+"）",3+n]);pdus.push([1,"Write Response",1]);segs.push([0,n]);}
        else{var c3=M-5,off2=0;while(off2<n){var k2=Math.min(c3,n-off2);pdus.push([0,"Prepare Write Request（"+off2+"〜"+(off2+k2-1)+"）",5+k2]);pdus.push([1,"Prepare Write Response（同じ内容）",5+k2]);segs.push([off2,k2]);off2+=k2;}
          pdus.push([0,"Execute Write Request（書く）",2]);pdus.push([1,"Execute Write Response",1]);}
      }else{var k3=Math.min(n,M-3);pdus.push([1,"Handle Value Notification（0〜"+(k3-1)+"）",3+k3]);segs.push([0,k3]);
        if(n>M-3)warn='<span class="warn">値の '+n+' バイトのうち、通知で送られるのは先頭の '+(M-3)+' バイトだけ（残り '+(n-M+3)+' バイトは送られない）。MTU を交換するか、アプリケーションで分ける。</span><br>';}
      var trips=o===2?0:pdus.length/2,llp=0;
      pdus.forEach(function(p){p.push(Math.ceil((p[2]+4)/LL));llp+=p[3];});
      /* 図: 値の帯と PDU の列 */
      var W=700,x0=60,x1=680,out=[],X=function(b){return x0+(x1-x0)*b/n;};
      out.push(S.T(x0,18,"値（"+n+" バイト）の分け方","start",10.5,"ink",true));
      out.push(S.RECT(x0,26,x1-x0,22,3,"var(--screen)","line",1));
      var cols=["signal","green"];
      segs.forEach(function(s,i){var c=cols[i%2];out.push(S.RECT(X(s[0]),26,Math.max(1,X(s[0]+s[1])-X(s[0])),22,2,U.soft(c),c,1.1));
        if(X(s[0]+s[1])-X(s[0])>26&&segs.length<=24)out.push(S.T((X(s[0])+X(s[0]+s[1]))/2,41,String(s[1]),"middle",9,c,true));});
      if(o===2&&n>M-3){out.push(S.RECT(X(M-3),26,x1-X(M-3),22,2,U.soft("alias"),"alias",1.1,"4 3"));out.push(S.T((X(M-3)+x1)/2,41,"送られない","middle",9.5,"alias",true));}
      out.push(S.T(x0,62,"0","middle",9,"muted"));out.push(S.T(x1,62,String(n),"middle",9,"muted"));
      box.set(S.svg(W,70,out));
      var show=pdus.length<=16?pdus:pdus.slice(0,10).concat([null]).concat(pdus.slice(-4));
      tb.innerHTML=U.tbl(["向き","ATT の PDU","長さ","リンク層のパケット"],show.map(function(p){
        if(!p)return ["","…（"+(pdus.length-14)+" 個を省略）","",""];
        var c=p[0]?"signal":"purple";
        return ['<b style="color:var(--'+c+')">'+(p[0]?"← サーバ":"→ クライアント")+'</b>','<span style="color:var(--'+c+')">'+U.esc(p[1])+'</span>',p[2]+" バイト",(p[3]>1?'<b style="color:var(--gold)">'+p[3]+'</b>':p[3])];}),["left","wrap","right","right"]);
      ro.innerHTML=warn+"ATT_MTU "+M+": 通知・書き込みの値は "+(M-3)+" バイト、Read Response は "+(M-1)+" バイト、Prepare Write は "+(M-5)+" バイトまで<br>"+
        (o===2?"通知 1 つ（確認は無い）":"要求と応答の往復 <b>"+trips+" 回</b>")+" ・ ATT の PDU "+pdus.length+" 個 ・ リンク層のパケット <b>"+llp+" 個</b>（L2CAP の 4 バイトを足し、"+LL+" バイトずつに分けた数。空パケットは数えない）"+
        (o===0?"<br>読む往復の数 = ⌊"+n+" / "+(M-1)+"⌋ + 1 = "+trips+(n%(M-1)===0?"（割り切れるので、最後の応答は 0 バイト）":""):"")+
        (M+4>LL?'<br><span class="warn">ATT の PDU（最大 '+M+' バイト）+ L2CAP 4 バイトが、リンク層の上限 '+LL+' バイトを超えるので、L2CAP が分けて運ぶ。</span>':"");
    }
    draw();
  };

  /* ===== 19 章 BLE のスループットと消費電力 ===== */
  /* リンク層のパケットの空中時間 [µs]。P はペイロード（MIC を除く）のバイト数、phy は "1M" "2M" "S2" "S8" */
  function _w19_air(P,phy,mic){var m=(mic&&P>0)?4:0;
    if(phy==="1M")return (1+4+2+P+m+3)*8;
    if(phy==="2M")return (2+4+2+P+m+3)*4;
    var S=phy==="S8"?8:2;return 80+296+S*(8*(2+P+m)+27);}
  var _w19_PHYNAME={"1M":"LE 1M","2M":"LE 2M","S2":"LE Coded（S = 2）","S8":"LE Coded（S = 8）"};
  function _w19_life(h){var d=h/24;return d>=365?_w19_sig(d/365,3)+" 年":(d>=1?_w19_sig(d,3)+" 日":_w19_sig(h,3)+" 時間");}
  function _w19_sig(v,d){d=d||3;if(v===0)return "0";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  /* ---- 3 節: スループットの計算機 ---- */
  REG.w19_tput=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"THROUGHPUT","1 回の接続イベントと、理論値から実効値の目安まで");
    var r1=U.ctrls(el);
    var phy=U.select(r1,"PHY",[{v:"1M",t:"LE 1M"},{v:"2M",t:"LE 2M"},{v:"S2",t:"LE Coded（S = 2）"},{v:"S8",t:"LE Coded（S = 8）"}],"2M",draw);
    var ll=U.slider(r1,"ペイロードの最大（DLE）",{values:[27,60,100,123,160,200,251],value:251,fmt:function(v){return v+" バイト"+(v===27?"（DLE なし）":"");},onInput:draw});
    var mtu=U.slider(r1,"ATT_MTU",{values:[23,50,100,158,185,247,300,512],value:247,fmt:function(v){return String(v);},onInput:draw});
    var r2=U.ctrls(el);
    var how=U.select(r2,"送り方",["通知・Write Command（待たない）","Write Request・指示（1 回に接続間隔 1 回分）","Write Request・指示（1 回に接続間隔 2 回分）"],0,draw);
    var enc=U.checkbox(r2,"暗号化（MIC 4 バイト）",true,draw);
    var r3=U.ctrls(el);
    var ci=U.slider(r3,"接続間隔",{values:[7.5,10,15,20,30,45,50,75,100,200,500,1000,4000],value:15,fmt:function(v){return v+" ms";},onInput:draw});
    var cap=U.slider(r3,"1 イベントの往復の上限",{values:[1,2,3,4,5,6,7,8,10,12,16,20,30,0],value:7,fmt:function(v){return v?v+" 往復":"制限なし";},onInput:draw});
    var loss=U.slider(r3,"失われる往復の割合",{min:0,max:30,step:1,value:5,fmt:function(v){return v+" %";},onInput:draw});
    var r4=U.ctrls(el);
    var pess=U.checkbox(r4,"失われたら、そのイベントを終える（悲観的な見積もり）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"3 節の例 (a)",function(){phy.set("2M");ll.set(251);mtu.set(247);how.set(0);enc.set(true);ci.set(15);cap.set(7);loss.set(5);pess.set(false);draw();});
    U.button(br,"3 節の例 (b)",function(){phy.set("1M");ll.set(27);mtu.set(23);how.set(0);enc.set(true);ci.set(30);cap.set(4);loss.set(5);pess.set(false);draw();});
    U.button(br,"理論値の条件（上限なし・失われない）",function(){cap.set(0);loss.set(0);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);

    /* frags: データのパケットの空中時間の列（L2CAP のパケット 1 つ分）、t0: 空パケット、k: 書き込みなら 1・2、通知なら 0 */
    function simulate(o){
      var R=U.rng(o.seed),fi=0,pdus=0,lost=0,rounds=0,next=0,ev0=[];
      for(var e=0;e<o.Nev;e++){
        if(o.k&&e<next)continue;
        var used=0,k=0,log=[];
        for(;;){
          var d=o.frags[fi],rt=d+300+o.t0;
          if(used+rt>o.Tci+1e-6)break;
          if(o.cap&&k>=o.cap)break;
          var bad=o.p>0&&R.chance(o.p);
          log.push({t:used,d:d,bad:bad,first:fi===0});
          used+=rt;k++;rounds++;
          if(bad){lost++;if(o.pess)break;continue;}
          fi++;
          if(fi===o.frags.length){fi=0;pdus++;if(o.k){next=e+o.k;break;}}
        }
        if(e===0)ev0=log;
      }
      return {kbps:pdus*o.D*8/(o.Nev*o.Tci)*1000,ev0:ev0,lost:lost,rounds:rounds,pdus:pdus};
    }
    function draw(){
      var P=phy.get(),LL=ll.get(),M=mtu.get(),k=how.get(),E=enc.get(),Tci=ci.get()*1000,NC=cap.get(),p=loss.get()/100;
      var D=M-3,Lm=M+4,f=Math.ceil(Lm/LL),sizes=[];
      for(var i=0;i<f;i++)sizes.push(i<f-1?LL:Lm-LL*(f-1));
      var t0=_w19_air(0,P,false);
      var frE=sizes.map(function(s){return _w19_air(s,P,E);}),fr0=sizes.map(function(s){return _w19_air(s,P,false);});
      var sum=function(a){return a.reduce(function(x,y){return x+y;},0);};
      var Tpdu0=sum(fr0)+f*(300+t0),TpduE=sum(frE)+f*(300+t0);
      var th0=D*8/Tpdu0*1000,thE=D*8/TpduE*1000;
      var base={frags:frE,t0:t0,D:D,Tci:Tci,seed:seed,Nev:400,pess:pess.get()};
      function run(o){var q={};for(var a in base)q[a]=base[a];for(var b in o)q[b]=o[b];return simulate(q);}
      var sQ=run({cap:0,p:0,k:0}),sC=run({cap:NC,p:0,k:0}),sW=k?run({cap:NC,p:0,k:k}):null,sL=run({cap:NC,p:p,k:k});
      var steps=[["理論値（暗号化なし）",th0,"signal","8D ÷ T_ex（2 節）"]];
      if(E)steps.push(["暗号化（MIC 4 バイト）",thE,"gold","データのパケットだけ 4 バイト長い"]);
      steps.push(["接続間隔の端数",sQ.kbps,"gold","間隔に入る往復だけ"]);
      if(NC)steps.push(["1 イベント "+NC+" 往復まで",sC.kbps,"gold","コントローラの上限"]);
      if(k)steps.push(["応答を待つ（間隔 "+k+" 回に 1 回）",sW.kbps,"gold","ATT のストップアンドウェイト"]);
      if(p>0)steps.push([Math.round(p*100)+" % の往復が失われる",sL.kbps,"alias","乱数で 400 イベントを試した値"]);
      var fin=steps[steps.length-1][1];
      steps[steps.length-1][2]="alias";
      /* ---- 図: 1 回目の接続イベント ---- */
      var W=700,o=[],ev=sL.ev0,used=ev.length?ev[ev.length-1].t+ev[ev.length-1].d+300+t0:0;
      var span=Math.min(Tci,Math.max(used*1.15,600)),cut=span<Tci,x0=96,wd=560,sc=wd/span,X=function(t){return x0+t*sc;};
      var yC=30,yP=62,hh=14,dataUp=k>0;
      o.push(S.T(10,yC+11,"セントラル","start",10,"purple",true));o.push(S.T(10,yP+11,"ペリフェラル","start",10,"signal",true));
      o.push(S.L(x0,yC+hh,x0+wd,yC+hh,"faint",1));o.push(S.L(x0,yP+hh,x0+wd,yP+hh,"faint",1));
      o.push(S.L(X(0),14,X(0),yP+hh+6,"muted",1,"3 3"));o.push(S.T(X(0)+2,12,"アンカーポイント","start",9,"muted"));
      ev.forEach(function(r){
        /* 通知: セントラルの空パケット → IFS → ペリフェラルのデータ。書き込み: セントラルのデータ → IFS → ペリフェラルの空パケット */
        var tc=r.t,cD=dataUp?r.d:t0,tp=r.t+cD+150,pD=dataUp?t0:r.d;
        var cBad=dataUp&&r.bad,pBad=!dataUp&&r.bad;
        o.push(S.RECT(X(tc),yC,Math.max(cD*sc,1),hh,1,cBad?U.soft("alias"):U.soft("purple"),cBad?"alias":"purple",0.9));
        o.push(S.RECT(X(tp),yP,Math.max(pD*sc,1),hh,1,pBad?U.soft("alias"):U.soft("signal"),pBad?"alias":"signal",0.9));
        if(r.bad)o.push(S.X(X(dataUp?tc+cD/2:tp+pD/2),(dataUp?yC:yP)+hh/2,4,"alias",1.6));
      });
      if(cut){o.push(S.T(x0+wd+4,yC+hh+12,"…","start",12,"muted"));o.push(S.T(x0+wd,yP+hh+28,"次のアンカーポイントは "+F.time(Tci*1e-6)+" 後","end",9.5,"muted"));}
      else{o.push(S.L(X(Tci),14,X(Tci),yP+hh+6,"alias",1.2,"4 3"));o.push(S.T(X(Tci)-2,12,"次のアンカーポイント","end",9,"alias"));}
      o.push(S.T(x0,yP+hh+28,ev.length?"このイベントは "+ev.length+" 往復（"+F.time(used*1e-6)+"）":"1 往復も入らない","start",9.5,ev.length?"ink":"alias",true));
      /* ---- 図: 落ち方の棒 ---- */
      var yb=yP+hh+46,vmax=steps[0][1],bx=200,bw=220;
      steps.forEach(function(s,i){var y=yb+i*22,v=Math.max(0,s[1]),w=bw*v/vmax;
        o.push(S.T(bx-8,y+12,s[0],"end",9.5,"ink"));
        o.push(S.RECT(bx,y+1,Math.max(w,0.8),15,2,U.soft(s[2]),s[2],1));
        o.push(S.T(bx+w+6,y+12,_w19_sig(v,4)+" kbps","start",9.5,s[2],true));
        o.push(S.T(bx+w+72,y+12,s[3],"start",8.5,"muted"));});
      box.set(S.svg(W,yb+steps.length*22+8,o));
      var warn="";
      if(!sQ.rounds)warn='<span class="warn">1 往復（'+F.time((frE[0]+300+t0)*1e-6)+'）が接続間隔より長く、1 つも送れない。実際には、データ長の更新で、間隔に入る長さのパケットに決まる。</span><br>';
      ro.innerHTML=warn+_w19_PHYNAME[P]+": データのパケット t_d = "+_w19_sig(frE[0],5)+" µs（ペイロード "+sizes[0]+" バイト"+(E?"・MIC あり":"")+"）、空パケット t_0 = "+t0+" µs、1 往復 T_ex = "+_w19_sig(frE[0]+300+t0,5)+" µs<br>"+
        "値 D = ATT_MTU − 3 = <b>"+D+" バイト</b>、L2CAP のパケット "+Lm+" バイト → リンク層のパケット <b>"+f+" 個</b>"+(f>1?'（<span class="warn">分かれる</span>。ATT_MTU を '+(LL-4)+' 以下にするか DLE を大きくすると 1 個に収まる）':"")+(LL>Lm?'（ペイロードの最大 '+LL+' のうち '+Lm+' バイトしか使わない）':"")+"<br>"+
        "理論値 <b>"+_w19_sig(th0,4)+" kbps</b>"+(E?"（暗号化で "+_w19_sig(thE,4)+" kbps）":"")+" → 実効値の目安 <b>"+_w19_sig(fin,4)+" kbps</b>（理論値の "+_w19_sig(fin/th0*100,3)+" %）<br>"+
        "100 KB（102,400 バイト）を送る時間: 理論値で "+F.time(102400*8/(th0*1000))+"、目安で <b>"+(fin>0?F.time(102400*8/(fin*1000)):"—")+"</b>"+
        '<div class="wnote">失われ方は、往復ごとに無関係に、決めた割合で失われるとした。失われた往復は次の往復で送り直す。Write Request・指示では、1 回の後、次を送るまで接続間隔 1〜2 回分待つとした（実装による）。</div>';
    }
    draw();
  };

  /* ---- 4 節: 1 回のイベントの電流の波形 ---- */
  REG.w19_event=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"EVENT","1 回のイベントの電流の波形と電荷");
    var r1=U.ctrls(el);
    var kind=U.select(r1,"イベントの種類",["アドバタイズ ADV_IND（接続可能。受信あり）","アドバタイズ ADV_NONCONN_IND（受信なし）","接続イベント（ペリフェラル）"],0,draw);
    var adl=U.slider(r1,"AdvData の長さ",{min:0,max:31,step:1,value:31,fmt:function(v){return v+" バイト";},onInput:draw});
    var rC=U.ctrls(el);
    var nd=U.slider(rC,"ペリフェラルが送る通知の数",{min:0,max:8,step:1,value:0,fmt:function(v){return v?v+" 個":"0（空パケットだけ）";},onInput:draw});
    var pl=U.select(rC,"通知のパケット",[{v:"1M27",t:"LE 1M・ペイロード 27"},{v:"1M251",t:"LE 1M・ペイロード 251"},{v:"2M251",t:"LE 2M・ペイロード 251"}],"1M27",draw);
    var rC2=U.ctrls(el);
    var te=U.slider(rC2,"前回の起床からの時間 T_e",{values:[0.0075,0.015,0.03,0.1,0.3,1,2,4],value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var ep=U.slider(rC2,"時計の誤差の合計 ε",{values:[40,70,100,200,300,550,1000],value:100,fmt:function(v){return v+" ppm";},onInput:draw});
    var r3=U.ctrls(el);
    var itx=U.slider(r3,"送信の電流",{min:3,max:20,step:0.5,value:7,fmt:function(v){return v+" mA";},onInput:draw});
    var irx=U.slider(r3,"受信の電流",{min:3,max:20,step:0.5,value:6,fmt:function(v){return v+" mA";},onInput:draw});
    var r4=U.ctrls(el);
    var tw=U.slider(r4,"起床（発振器の立ち上がり）",{min:0.1,max:1.5,step:0.05,value:0.4,fmt:function(v){return _w19_sig(v,3)+" ms（1.5 mA）";},onInput:draw});
    var tp=U.slider(r4,"処理の時間",{min:0.05,max:2,step:0.05,value:0.3,fmt:function(v){return _w19_sig(v,3)+" ms（3 mA）";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"4 節の例の値に戻す",function(){adl.set(31);nd.set(0);pl.set("1M27");te.set(1);ep.set(100);itx.set(7);irx.set(6);tw.set(0.4);tp.set(0.3);draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var KC={w:"gold",r:"muted",t:"signal",x:"teal",p:"purple"},KN={w:"起床",r:"立ち上げ・切り替え",t:"送信",x:"受信",p:"処理"};
    function segs(){
      var K=kind.get(),Itx=itx.get(),Irx=irx.get(),s=[["起床",tw.get(),1.5,"w"]];
      if(K<2){var L=adl.get(),ta=_w19_air(6+L,"1M")/1000;
        [37,38,39].forEach(function(ch){s.push(["立ち上げ",0.1,4,"r"]);s.push(["送信 "+ch,ta,Itx,"t"]);if(K===0)s.push(["受信",0.2,Irx,"x"]);});}
      else{var c=pl.get(),phy=c.slice(0,2),P=+c.slice(2),t0=_w19_air(0,phy)/1000,td=_w19_air(P,phy)/1000,n=nd.get(),w=ep.get()*1e-6*te.get()*1000;
        s.push(["立ち上げ",0.1,4,"r"]);s.push(["受信（窓 "+_w19_sig(w*1000,3)+" µs + 空パケット）",w+t0,Irx,"x"]);
        var m=Math.max(n,1);
        for(var i=0;i<m;i++){s.push(["切り替え",0.15,5,"r"]);s.push([n?"送信（通知 "+(i+1)+"）":"送信（空パケット）",n?td:t0,Itx,"t"]);
          if(i<m-1)s.push(["受信（IFS + 空パケット）",0.15+t0,Irx,"x"]);}}
      s.push(["処理",tp.get(),3,"p"]);return s;}
    function draw(){
      var K=kind.get();adl.el.style.display=K<2?"":"none";rC.style.display=K===2?"":"none";rC2.style.display=K===2?"":"none";
      var s=segs(),tot=0,Q=0,agg={};s.forEach(function(x){tot+=x[1];Q+=x[1]*x[2];agg[x[3]]=agg[x[3]]||[0,0];agg[x[3]][0]+=x[1];agg[x[3]][1]+=x[1]*x[2];});
      var Imax=Math.max(8,Math.ceil(Math.max(itx.get(),irx.get())/2)*2),W=700,x0=60,wd=600,sc=wd/Math.max(tot,0.5),h=110,y0=24,o=[];
      var Y=function(i){return y0+h-i/Imax*h;};
      o.push(S.W([x0,y0,x0,y0+h,x0+wd+10,y0+h],"muted",1.1));
      for(var m=0;m<=Imax;m+=Imax>12?4:2){o.push(S.L(x0-4,Y(m),x0,Y(m),"muted",1));o.push(S.T(x0-7,Y(m)+3.5,String(m),"end",9,"muted"));}
      o.push(S.T(x0-34,y0+h/2,"mA","middle",9.5,"muted",false,false,-90));
      var t=0,pts=[[x0,Y(0)]];
      s.forEach(function(x,i){var xa=x0+t*sc,xb=x0+(t+x[1])*sc;o.push(S.RECT(xa,Y(x[2]),xb-xa,Y(0)-Y(x[2]),0,U.soft(KC[x[3]]),"none",0));pts.push([xa,Y(x[2])]);pts.push([xb,Y(x[2])]);
        if(xb-xa>34&&x[3]!=="r")o.push(S.T((xa+xb)/2,Y(x[2])-4,x[0].replace(/（.*$/,""),"middle",9,KC[x[3]],true));
        if(xb-xa>16)o.push(S.T((xa+xb)/2,y0+h+13+(i%2?10:0),_w19_sig(x[1]*x[2],3),"middle",8.5,KC[x[3]]));
        t+=x[1];});
      pts.push([x0+t*sc,Y(0)]);o.push(S.PL(pts,"signal",1.6));
      var ya=y0+h+34,nt=U.nice(0,tot,6);o.push(S.L(x0,ya,x0+wd,ya,"muted",1));
      nt.forEach(function(v){if(v<=tot+1e-9){o.push(S.L(x0+v*sc,ya,x0+v*sc,ya+4,"muted",1));o.push(S.T(x0+v*sc,ya+16,_w19_sig(v,3),"middle",9.5,"muted"));}});
      o.push(S.T(x0+wd,ya+30,"時間 [ms]（波形の下の数字は各段の電荷 [µC]）","end",9.5,"muted"));
      box.set(S.svg(W,ya+38,o));
      var rows=["w","r","t","x","p"].filter(function(k){return agg[k];}).map(function(k){return ['<b style="color:var(--'+(KC[k]==="muted"?"muted":KC[k])+')">'+KN[k]+"</b>",_w19_sig(agg[k][0],3)+" ms",_w19_sig(agg[k][1],3)+" µC",_w19_sig(agg[k][1]/Q*100,3)+" %"];});
      ro.innerHTML="1 回のイベントの電荷 Q = Σ I_k t_k = <b>"+_w19_sig(Q,4)+" µC</b>（長さ "+_w19_sig(tot,4)+" ms）"+
        (K===2?" ・ 受信の窓 t_w = ε T_e = "+_w19_sig(ep.get()*te.get(),3)+" µs":"")+
        U.tbl(["段","時間の合計","電荷","割合"],rows,["left","right","right","right"])+
        '<div class="wnote">立ち上げ 0.1 ms・4 mA、切り替え（IFS）0.15 ms・5 mA は固定にした。アドバタイズの受信（応答を待つ時間）は 0.2 ms とした。値はすべて代表値の例。</div>';
    }
    draw();
  };

  /* ---- 5 節: 平均電流と電池寿命 ---- */
  REG.w19_power=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"POWER","起きる間隔と平均電流・電池寿命");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"動作",["アドバタイズ","接続"],0,function(){q0.set(mode.get()===0?14.2:3.69);draw();});
    var q0=U.slider(r1,"1 回の電荷（窓の分を除く）Q",{min:1,max:60,log:true,value:14.2,fmt:function(v){return _w19_sig(v,3)+" µC";},onInput:draw});
    var rA=U.ctrls(el);
    var adv=U.slider(rA,"advInterval",{values:[0.02,0.05,0.1,0.2,0.5,1,1.28,2,5,10.24],value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var rC=U.ctrls(el);
    var ci=U.slider(rC,"接続間隔",{values:[0.0075,0.015,0.03,0.05,0.1,0.2,0.5,1,2,4],value:0.03,fmt:function(v){return F.time(v);},onInput:draw});
    var lat=U.slider(rC,"ペリフェラルレイテンシ L",{values:[0,1,2,4,9,19,49,99,199,499],value:0,fmt:function(v){return String(v);},onInput:draw});
    var ep=U.slider(rC,"時計の誤差の合計 ε",{values:[40,70,100,200,300,550,1000],value:100,fmt:function(v){return v+" ppm";},onInput:draw});
    var r3=U.ctrls(el);
    var is=U.slider(r3,"眠りの電流 I_s",{min:0.3,max:50,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var irx=U.slider(r3,"受信の電流（窓の分）",{min:3,max:20,step:0.5,value:6,fmt:function(v){return v+" mA";},onInput:draw});
    var cap=U.slider(r3,"電池の容量",{values:[100,220,620,1000,2000,3000],value:220,fmt:function(v){return v+" mAh"+(v===220?"（CR2032）":"");},onInput:draw});
    var br=U.btnrow(el);
    function preset(m,q,a,c,l){mode.set(m);q0.set(q);if(a)adv.set(a);if(c)ci.set(c);lat.set(l||0);ep.set(100);is.set(2);irx.set(6);cap.set(220);draw();}
    U.button(br,"アドバタイズ 1 s",function(){preset(0,14.2,1);});
    U.button(br,"接続 30 ms",function(){preset(1,3.69,0,0.03,0);});
    U.button(br,"接続 30 ms・L 9",function(){preset(1,3.69,0,0.03,9);});
    U.button(br,"接続 1 s・毎回通知",function(){preset(1,5.2,0,1,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var M=mode.get();rA.style.display=M===0?"":"none";rC.style.display=M===1?"":"none";
      var Q=q0.get()*1e-6,Is=is.get()*1e-6,Ir=irx.get()*1e-3,E=ep.get()*1e-6,C=cap.get()*1e-3*3600;
      var Te=M===0?adv.get()+0.005:(1+lat.get())*ci.get(),Iw=M===1?Ir*E:0;
      var Iev=Q/Te,I=Is+Iw+Iev,lifeH=C/I/3600,Ts=Q/(Is+Iw);
      var W=700,o=[];
      /* 上: 内訳 */
      var bx=110,bw=470,sc=bw/I;
      o.push(S.T(bx-10,26,"内訳","end",10.5,"ink",true));var xx=bx;
      [[Is,"green","眠り"],[Iw,"teal","受信の窓"],[Iev,M===0?"gold":"signal","イベント"]].forEach(function(s){if(s[0]<=0)return;var w=s[0]*sc;
        o.push(S.RECT(xx,12,Math.max(0.8,w),22,2,U.soft(s[1]),s[1],1.1));if(w>64)o.push(S.T(xx+w/2,27,s[2]+" "+F.cur(s[0]),"middle",9.5,s[1],true));xx+=w;});
      o.push(S.T(xx+6,27,F.cur(I),"start",10.5,"ink",true));
      /* 下: 間隔と平均電流 */
      var p=U.plot(110,58,470,190,[0.005,20],[1e-7,2e-3],{xlog:true,ylog:true});
      o.push(p.axes({xl:"起きる間隔 T_e",yl:"平均電流",xt:[0.01,0.1,1,10],yt:[1e-7,1e-6,1e-5,1e-4,1e-3],xfmt:function(v){return F.time(v);},yfmt:function(v){return F.cur(v,1);},ylOff:58}));
      var pts=[];for(var k=0;k<=80;k++){var t=Math.pow(10,Math.log10(0.005)+k/80*(Math.log10(20)-Math.log10(0.005))),v=Is+Iw+Q/t;if(v<=2e-3&&v>=1e-7)pts.push([t,v]);}
      o.push(p.line([[0.005,Is+Iw],[20,Is+Iw]],"green",1.2,"6 4"));o.push(p.line(pts,M===0?"gold":"signal",2.2));
      if(Ts>=0.005&&Ts<=20){o.push(S.L(p.X(Ts),p.Y(1e-7),p.X(Ts),p.Y(Is+Iw+Q/Ts),"faint",1,"3 3"));o.push(S.D(p.X(Ts),p.Y(Is+Iw+Q/Ts),"alias",4));
        o.push(S.T(p.X(Ts)+(p.X(Ts)>500?-6:6),p.Y(1e-7)-8,"T* = "+F.time(Ts),p.X(Ts)>500?"end":"start",9.5,"alias",true));}
      if(Te>=0.005&&Te<=20&&I<=2e-3){o.push(S.D(p.X(Te),p.Y(I),M===0?"gold":"signal",5.5));o.push(S.T(p.X(Te)+(p.X(Te)>500?-8:8),p.Y(I)-8,"いまの値",p.X(Te)>500?"end":"start",9.5,M===0?"gold":"signal",true));}
      o.push(S.T(p.X(0.0055),p.Y(Is+Iw)+13,"眠り"+(M===1?" + 窓":"")+" "+F.cur(Is+Iw),"start",9,"green"));
      [[1e-6,"CR2032 で 25 年"],[1e-5,"2.5 年"],[1e-4,"92 日"],[1e-3,"9.2 日"]].forEach(function(r){o.push(S.T(p.x+p.w+8,p.Y(r[0])+3.5,cap.get()===220?r[1]:"","start",9,"muted"));});
      box.set(S.svg(W,290,o));
      var warn="",sto=2*Te;
      if(M===1&&sto>32)warn='<span class="warn">(1 + L) × 接続間隔 × 2 = '+F.time(sto)+' が、監視タイムアウトの上限 32 s を超える。この組み合わせは使えない（18 章 1 節）。</span><br>';
      ro.innerHTML=warn+"平均の間隔 T_e = "+(M===0?"advInterval + 5 ms = "+F.time(Te,4):"(1 + L) × 接続間隔 = "+(1+lat.get())+" × "+F.time(ci.get())+" = "+F.time(Te,4))+"<br>"+
        "I_avg = I_s"+(M===1?" + I_rx ε":"")+" + Q ÷ T_e = "+F.cur(Is)+(M===1?" + "+F.cur(Iw):"")+" + "+F.cur(Iev)+" = <b>"+F.cur(I)+"</b><br>"+
        "電池寿命 = "+cap.get()+" mAh ÷ "+F.cur(I)+" ≈ <b>"+_w19_life(lifeH)+"</b> ・ T* = Q ÷ (I_s"+(M===1?" + I_rx ε":"")+") = <b>"+F.time(Ts)+"</b> → "+
        (Te<Ts?'間隔が T* より<b>短い</b>ので、間隔を延ばす（1 回の電荷を減らす）のが効く':'間隔が T* より<b>長い</b>ので、眠りの電流'+(M===1?"と時計の誤差":"")+'を減らすのが効く')+
        (M===1?"<br>上りの遅れ（ペリフェラル → セントラル）は最大 "+F.time(ci.get())+"、下りの遅れ（セントラル → ペリフェラル）は最大 "+F.time(Te)+" ・ 監視タイムアウト（100 ms〜32 s）は 2 × (1 + L) × 接続間隔 = "+F.time(sto)+" より長くする":"")+
        '<div class="wnote">1 回の電荷は 4 節の例（アドバタイズ ADV_IND 14.2 µC、送るもののない接続イベント 3.69 µC + 窓の分、通知 20 バイトを毎回送るなら約 5.2 µC）。接続では、窓の分を受信の電流 × ε × T_e として別に数える。</div>';
    }
    draw();
  };

  /* ===== 20 章 BLE のセキュリティ ===== */
  /* AES-128 の 1 ブロック暗号化（RPA の hash の計算に使う。FIPS-197 の例と Core Specification の ah の例で確かめた） */
  var _w20_SB=(function(){var s=new Array(256),p=1,q=1;
    do{p=p^((p<<1)&0xff)^((p&0x80)?0x1b:0);
       q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;
       var x=q^(((q<<1)|(q>>7))&0xff)^(((q<<2)|(q>>6))&0xff)^(((q<<3)|(q>>5))&0xff)^(((q<<4)|(q>>4))&0xff);
       s[p]=(x^0x63)&0xff;}while(p!==1);
    s[0]=0x63;return s;})();
  function _w20_xt(a){return ((a<<1)^((a&0x80)?0x1b:0))&0xff;}
  function _w20_aes(key,inp){var S=_w20_SB,rk=key.slice(0,16),rc=1,i,j,r,c;
    for(i=16;i<176;i+=4){var t=[rk[i-4],rk[i-3],rk[i-2],rk[i-1]];
      if(i%16===0){var t0=t[0];t=[S[t[1]]^rc,S[t[2]],S[t[3]],S[t0]];rc=_w20_xt(rc);}
      for(j=0;j<4;j++)rk[i+j]=rk[i-16+j]^t[j];}
    var s=inp.slice(0,16);for(j=0;j<16;j++)s[j]^=rk[j];
    for(r=1;r<=10;r++){
      for(j=0;j<16;j++)s[j]=S[s[j]];
      var u=new Array(16);for(c=0;c<4;c++)for(var k=0;k<4;k++)u[c*4+k]=s[((c+k)%4)*4+k];s=u;
      if(r<10)for(c=0;c<4;c++){var a0=s[c*4],a1=s[c*4+1],a2=s[c*4+2],a3=s[c*4+3];
        s[c*4]=_w20_xt(a0)^_w20_xt(a1)^a1^a2^a3;s[c*4+1]=a0^_w20_xt(a1)^_w20_xt(a2)^a2^a3;
        s[c*4+2]=a0^a1^_w20_xt(a2)^_w20_xt(a3)^a3;s[c*4+3]=_w20_xt(a0)^a0^a1^a2^_w20_xt(a3);}
      for(j=0;j<16;j++)s[j]^=rk[r*16+j];}
    return s;}
  function _w20_hb(h){var o=[];for(var i=0;i+1<h.length;i+=2)o.push(parseInt(h.substr(i,2),16));return o;}
  function _w20_hx(b,sep){return b.map(function(x){return (x<16?"0":"")+x.toString(16).toUpperCase();}).join(sep==null?" ":sep);}

  /* ---- アソシエーションモデル ---- */
  var _w20_IO=["DisplayOnly","DisplayYesNo","KeyboardOnly","NoInputNoOutput","KeyboardDisplay"];
  /* LESC の表（行 = セントラル、列 = ペリフェラル）。"CP" = C 表示 → P 入力、"PC" = P 表示 → C 入力、"BB" = 両方に入力 */
  var _w20_LESC=[["JW","JW","CP","JW","CP"],["JW","NC","CP","JW","NC"],["PC","PC","BB","JW","PC"],["JW","JW","JW","JW","JW"],["PC","NC","CP","JW","NC"]];
  var _w20_LEG =[["JW","JW","CP","JW","CP"],["JW","JW","CP","JW","CP"],["PC","PC","BB","JW","PC"],["JW","JW","JW","JW","JW"],["PC","PC","CP","JW","CP"]];
  var _w20_MN={JW:["Just Works","alias"],NC:["数値比較","green"],CP:["パスキー入力","signal"],PC:["パスキー入力","signal"],BB:["パスキー入力","signal"],OOB:["OOB","teal"]};
  var _w20_DIR={CP:"C 表示 → P 入力",PC:"P 表示 → C 入力",BB:"両方に入力"};

  REG.w20_assoc=function(el,U){
    var S=U.S;
    U.head(el,"PAIRING","IO 能力からアソシエーションモデルを決める");
    var row=U.ctrls(el);
    var ioC=U.select(row,"セントラル（スマートフォン）の IO 能力",_w20_IO,4,draw);
    var ioP=U.select(row,"ペリフェラル（機器）の IO 能力",_w20_IO,3,draw);
    var row2=U.ctrls(el);
    var mC=U.checkbox(row2,"セントラルが MITM を求める",true,draw);
    var mP=U.checkbox(row2,"ペリフェラルが MITM を求める",false,draw);
    var oC=U.checkbox(row2,"セントラルが OOB のデータを持つ",false,draw);
    var oP=U.checkbox(row2,"ペリフェラルが OOB のデータを持つ",false,draw);
    var row3=U.ctrls(el);
    var sC=U.checkbox(row3,"セントラルが LESC に対応",true,draw);
    var sP=U.checkbox(row3,"ペリフェラルが LESC に対応",true,draw);
    var br=U.btnrow(el);
    function preset(a,b,ma,mb,sa,sb){ioC.set(a);ioP.set(b);mC.set(ma);mP.set(mb);oC.set(false);oP.set(false);sC.set(sa);sP.set(sb);draw();}
    U.button(br,"画面もボタンもない機器",function(){preset(4,3,true,false,true,true);});
    U.button(br,"6 桁の表示と「はい」がある機器",function(){preset(4,1,true,true,true,true);});
    U.button(br,"数字を入力できる機器",function(){preset(4,2,true,true,true,true);});
    U.button(br,"レガシーにしか対応しない機器",function(){preset(4,1,true,true,true,false);});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var i=ioC.get(),j=ioP.get(),lesc=sC.get()&&sP.get();
      var oob=lesc?(oC.get()||oP.get()):(oC.get()&&oP.get());
      var noMitm=!mC.get()&&!mP.get();
      var step=oob?0:(noMitm?1:2);
      var m=oob?"OOB":(noMitm?"JW":(lesc?_w20_LESC:_w20_LEG)[i][j]);
      var W=700,o=[];
      /* 決まり方の 3 段 */
      var st=[["OOB のデータ",oob?"ある → OOB":"無い"],["MITM のフラグ",step===0?"（見ない）":(noMitm?"両方 0 → Just Works":"どちらかが 1")],["IO 能力の表",step===2?(lesc?"LESC の表":"レガシーの表"):"（使わない）"]];
      st.forEach(function(s,k){var x=10+k*232,on=k===step,c=on?"signal":"muted";
        o.push(S.RECT(x,8,212,40,6,on?U.soft("signal"):"panel",c,on?2.2:1.1));
        o.push(S.T(x+106,24,s[0],"middle",10.5,c,true));o.push(S.T(x+106,40,s[1],"middle",9.5,on?"ink":"muted"));
        if(k<2)o.push(S.ARR(x+214,28,x+230,28,"muted",1.3,6));});
      /* 表 */
      var T=lesc?_w20_LESC:_w20_LEG,x0=10,y0=62,hw=124,cw=112,hh=30,ch=38;
      o.push(S.T(x0+hw+cw*2.5,y0-2,"ペリフェラル（列）"+(lesc?"・LESC の表":"・レガシーの表"),"middle",10,"signal",true));
      _w20_IO.forEach(function(nm,c){var xx=x0+hw+c*cw;o.push(S.RECT(xx+1,y0+4,cw-2,hh-4,4,c===j?U.soft("signal"):"panel","signal",c===j?1.8:0.8));
        o.push(S.T(xx+cw/2,y0+22,nm,"middle",9,"signal",true));});
      _w20_IO.forEach(function(nm,r){var yy=y0+hh+r*ch;o.push(S.RECT(x0,yy+1,hw-4,ch-2,4,r===i?U.soft("purple"):"panel","purple",r===i?1.8:0.8));
        o.push(S.T(x0+(hw-4)/2,yy+ch/2+4,nm,"middle",9,"purple",true));
        for(var c=0;c<5;c++){var v=T[r][c],mn=_w20_MN[v],xx=x0+hw+c*cw,sel=(r===i&&c===j&&step===2),dim=step!==2;
          o.push('<g opacity="'+(dim?0.35:(sel?1:0.75))+'">');
          o.push(S.RECT(xx+1,yy+1,cw-2,ch-2,4,U.soft(mn[1]),mn[1],sel?3:0.9));
          o.push(S.T(xx+cw/2,yy+(_w20_DIR[v]?16:23),mn[0],"middle",9.5,mn[1],true));
          if(_w20_DIR[v])o.push(S.T(xx+cw/2,yy+30,_w20_DIR[v],"middle",8.5,"ink"));
          o.push('</g>');}});
      o.push(S.T(x0,y0+hh+5*ch+18,"行 = セントラル、列 = ペリフェラル。C = セントラル、P = ペリフェラル。表を使うのは右端の段に来たときだけ。","start",9.5,"muted"));
      box.set(S.svg(W,y0+hh+5*ch+28,o));
      /* 結果 */
      var mn=_w20_MN[m],prot=m!=="JW";
      var act={JW:"数字を確かめない（OS によっては、ペアリングしてよいかだけを尋ねる）",NC:"両方の画面の 6 桁が同じかを見て「はい」を押す",
        CP:"セントラルに出た 6 桁を、ペリフェラルに入力する",PC:"ペリフェラルに出た 6 桁を、セントラルに入力する",BB:"利用者が決めた同じ 6 桁を、両方に入力する",
        OOB:"NFC や QR コードなどで、鍵の材料を受け渡す"}[m];
      var eav,tk;
      if(lesc){eav=true;tk="TK は使わない（鍵は DHKey から導く）";}
      else if(m==="OOB"){eav=true;tk="TK = OOB の 16 バイト（2¹²⁸ 通り）";}
      else if(m==="JW"){eav=false;tk="TK = 0（1 通り）";}
      else{eav=false;tk="TK = 6 桁の数字（10⁶ 通り）";}
      ro.innerHTML="方式: <b>"+(lesc?"LE Secure Connections":"レガシーペアリング")+"</b>（両端の LESC への対応: "+(sC.get()?"C ✓":"C ✗")+" "+(sP.get()?"P ✓":"P ✗")+"）"+
        " ・ アソシエーションモデル: <b style=\"color:var(--"+(mn[1]==="alias"?"alias":mn[1]==="teal"?"teal":mn[1])+")\">"+mn[0]+(_w20_DIR[m]?"（"+_w20_DIR[m]+"）":"")+"</b><br>"+
        "利用者がすること: "+act+"<br>"+
        "鍵のもと: "+tk+"<br>"+
        "ペアリングを記録した受動的な盗聴: "+(eav?'<span class="ok">防げる</span>':'<span class="warn">防げない（候補を全部試せる）</span>')+
        " ・ 中間者攻撃: "+(prot?'<span class="ok">防げる</span>':'<span class="warn">防げない（利用者もほかの経路も確かめない）</span>')+
        (!lesc&&prot&&m!=="OOB"?'<div class="wnote">レガシーのパスキー入力は、規格の上では中間者を防ぐ（認証済み）扱いだが、ペアリングを記録されると鍵が割れる。</div>':"")+
        (oob&&!lesc?'':(!lesc&&(oC.get()!==oP.get())?'<div class="wnote">レガシーでは、OOB は両方がデータを持つときにだけ使われる。</div>':''));
    }
    draw();
  };

  /* ---- 解決可能なプライベートアドレス ---- */
  var _w20_DEV=[["機器 A","ec0234a357c8ad05341010a60a397d9b"],["機器 B","5d1f8b3a0c47e2916fa4d03b8e72c51a"],["機器 C","3c9a71e05b28d4f6a1078e2bd93f4c65"]];
  /* 小さな値を「6.0 × 10⁻⁸」の形にする */
  function _w20_sci(v){if(v===0)return "0";var e=Math.floor(Math.log10(v)),m=v/Math.pow(10,e),sup="⁰¹²³⁴⁵⁶⁷⁸⁹";
    var es=String(Math.abs(e)).split("").map(function(d){return sup[+d];}).join("");return m.toFixed(1)+" × 10"+(e<0?"⁻":"")+es;}
  function _w20_ah(irkHex,pr){return _w20_aes(_w20_hb(irkHex),[0,0,0,0,0,0,0,0,0,0,0,0,0,pr[0],pr[1],pr[2]]);}

  REG.w20_rpa=function(el,U){
    var S=U.S;
    U.head(el,"RPA","解決可能なプライベートアドレスを作り、解決する");
    var row=U.ctrls(el);
    var dv=U.select(row,"アドバタイズする機器",_w20_DEV.map(function(d){return d[0]+"（IRK "+d[1].substr(0,8).toUpperCase()+"…）";}),0,function(){hist[hist.length-1].d=dv.get();draw();});
    var pr=U.textin(row,"prand（16 進 6 桁）","708194",function(){var v=pr.get().replace(/\s/g,"");if(/^[0-9a-fA-F]{6}$/.test(v)){hist[hist.length-1].p=v.toLowerCase();}draw();});
    var row2=U.ctrls(el);
    var has=_w20_DEV.map(function(d,k){return U.checkbox(row2,"スマートフォンが "+d[0]+" の IRK を持つ",k<2,draw);});
    var br=U.btnrow(el);
    var seed=1,rg=U.rng(seed);
    function newPrand(){var a=[0x40|rg.int(64),rg.int(256),rg.int(256)];return _w20_hx(a,"").toLowerCase();}
    U.button(br,"15 分進める（prand を作り直す）",function(){var p=newPrand();hist.push({d:dv.get(),p:p});if(hist.length>6)hist.shift();pr.set(p);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rg=U.rng(seed*7919);hist=[{d:dv.get(),p:"708194"}];pr.set("708194");draw();});
    U.button(br,"最初に戻す",function(){seed=1;rg=U.rng(1);dv.set(0);pr.set("708194");hist=[{d:0,p:"708194"}];draw();});
    var hist=[{d:0,p:"708194"}];
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function addrOf(e){var p=_w20_hb(e.p),ct=_w20_ah(_w20_DEV[e.d][1],p);return {p:p,ct:ct,h:ct.slice(13),rpa:(p[0]>>6)===1};}
    function resolve(a){if(!a.rpa)return null;for(var k=0;k<_w20_DEV.length;k++){if(!has[k].get())continue;var h=_w20_ah(_w20_DEV[k][1],a.p).slice(13);
      if(h[0]===a.h[0]&&h[1]===a.h[1]&&h[2]===a.h[2])return k;}return -1;}
    function draw(){
      var cur=hist[hist.length-1],a=addrOf(cur),W=700,o=[];
      var bad=!/^[0-9a-fA-F]{6}$/.test(pr.get().replace(/\s/g,""));
      /* 48 ビット */
      o.push(S.T(10,18,cur.d>=0?_w20_DEV[cur.d][0]+" のいまのアドレス（人が読む順）":"","start",10.5,"ink",true));
      o.push(S.RECT(10,26,250,36,5,U.soft("signal"),"signal",1.3));o.push(S.T(135,41,"prand（上位 24 ビット）","middle",9.5,"signal",true));
      o.push(S.T(135,56,_w20_hx(a.p),"middle",11.5,"ink",true,true));
      o.push(S.RECT(260,26,250,36,5,U.soft("green"),"green",1.3));o.push(S.T(385,41,"hash（下位 24 ビット）","middle",9.5,"green",true));
      o.push(S.T(385,56,_w20_hx(a.h),"middle",11.5,"ink",true,true));
      var b0=a.p[0],bits=("00000000"+b0.toString(2)).slice(-8);
      o.push(S.T(520,40,"最上位の 2 ビット: "+bits.substr(0,2),"start",10,a.rpa?"green":"alias",true));
      o.push(S.T(520,56,a.rpa?"01 → RPA":"01 でない → RPA ではない","start",9.5,a.rpa?"green":"alias",true));
      /* ah の計算 */
      var y=82,xb=118,stp=U.tw("00 ",10.5,true);
      o.push(S.T(10,y,"hash = ah(IRK, prand)","start",10.5,"ink",true));
      var rows=[["IRK",_w20_hb(_w20_DEV[cur.d][1]),-1,"muted"],["入力",[0,0,0,0,0,0,0,0,0,0,0,0,0].concat(a.p),13,"signal"],["AES-128",a.ct,13,"green"]];
      rows.forEach(function(r,k){var yy=y+22+k*22;o.push(S.T(xb-10,yy,r[0],"end",10,"ink",true));
        r[1].forEach(function(b,q){var hl=r[2]>=0&&q>=r[2];if(hl)o.push(S.RECT(xb+q*stp-2,yy-13,stp-2,17,3,U.soft(r[3]),"none",0));
          o.push(S.T(xb+q*stp,yy,_w20_hx([b]),"start",10.5,hl?r[3]:"ink",hl,true));});});
      o.push(S.T(xb+16*stp+6,y+66,"← 下位 3 バイトが hash","start",9.5,"green"));
      o.push(S.T(10,y+92,"電波に乗る順（最下位のバイトから）: "+_w20_hx(a.h.slice().reverse())+" "+_w20_hx(a.p.slice().reverse()),"start",10,"ink",false,true));
      /* 時間とともに */
      var y2=y+118,n=hist.length,cw=112;
      o.push(S.T(10,y2,"15 分ごとのアドレスと、見え方","start",10.5,"ink",true));
      o.push(S.T(10,y2+58,"IRK を持たない観測者","start",9.5,"alias",true));
      o.push(S.T(10,y2+88,"スマートフォン","start",9.5,"green",true));
      var seen={},cnt=0;
      hist.forEach(function(e,k){var ae=addrOf(e),s=_w20_hx(ae.p,":")+":"+_w20_hx(ae.h,":"),x=130+k*cw;
        if(!(s in seen)){cnt++;seen[s]=cnt;}
        var last=k===n-1;
        o.push(S.T(x+cw/2-4,y2+16,"+"+(k*15)+" 分"+(last?"（いま）":""),"middle",9,"muted"));
        o.push(S.RECT(x,y2+22,cw-8,22,4,last?U.soft("signal"):"panel","signal",last?1.6:0.9));
        o.push(S.T(x+cw/2-4,y2+37,s,"middle",8,"ink",false,true));
        o.push(S.RECT(x,y2+48,cw-8,18,4,U.soft("alias"),"alias",0.9));
        o.push(S.T(x+cw/2-4,y2+61,"知らない機器 "+seen[s],"middle",9,"alias",true));
        var r=resolve(ae),ok=r!=null&&r>=0;
        o.push(S.RECT(x,y2+76,cw-8,18,4,U.soft(ok?"green":"muted"),ok?"green":"muted",0.9));
        o.push(S.T(x+cw/2-4,y2+89,r==null?"RPA ではない":(ok?_w20_DEV[r][0]+" と解決":"解決できない"),"middle",9,ok?"green":"muted",true));});
      box.set(S.svg(W,y2+104,o));
      /* 読み出し */
      var lines=[],k=0;
      _w20_DEV.forEach(function(d,q){if(!has[q].get())return;k++;var h=_w20_ah(d[1],a.p).slice(13),m=a.rpa&&h[0]===a.h[0]&&h[1]===a.h[1]&&h[2]===a.h[2];
        lines.push([d[0],_w20_hx(h),m?'<span class="ok">一致 → '+d[0]+'</span>':"不一致"]);});
      ro.innerHTML=(bad?'<span class="warn">prand は 16 進 6 桁で入れる（いまは直前の値で計算している）。</span><br>':"")+
        "アドレス（人が読む順）: <b>"+_w20_hx(a.p,":")+":"+_w20_hx(a.h,":")+"</b> ・ 電波の順: "+_w20_hx(a.h.slice().reverse())+" "+_w20_hx(a.p.slice().reverse())+
        (a.rpa?"":' ・ <span class="warn">最上位の 2 ビットが 01 でないので RPA ではなく、解決しない</span>')+"<br>"+
        "スマートフォンでの解決（受け取った hash = "+_w20_hx(a.h)+"）:"+(lines.length?U.tbl(["IRK","ah(IRK, prand)","結果"],lines,["left","left","left"]):" IRK を 1 つも持っていない")+
        '<div class="wnote">誤った IRK で偶然一致する確率は IRK 1 つあたり 2⁻²⁴（約 1677 万分の 1）。いま '+k+' 件なので、1 回の解決で誤って一致する件数の期待値は '+_w20_sci(k/16777216)+'。'+
        'IRK を持たない観測者には、アドレスが変わるたびに「知らない機器」が増えて見える。</div>';
    }
    draw();
  };

  /* ---- 属性の条件と接続のレベル ---- */
  var _w20_REQ=["条件なし","暗号化が必要（レベル 2 以上）","認証が必要（レベル 3 以上）","LESC の認証が必要（レベル 4）"];
  var _w20_LINK=["暗号化していない（レベル 1）","Just Works で暗号化（レベル 2）","レガシーのパスキー入力で暗号化（レベル 3）","LESC の数値比較で暗号化（レベル 4）"];
  /* 機器の IO 能力（スマートフォンは KeyboardDisplay・LESC、OOB は使わないとする）と、届く最も高いレベル */
  var _w20_DEVIO=[["NoInputNoOutput（画面もボタンもない）",2,"Just Works"],["DisplayYesNo（6 桁と「はい」）",4,"数値比較"],["DisplayOnly（6 桁の表示だけ）",4,"パスキー入力（P 表示 → C 入力）"]];

  REG.w20_perm=function(el,U){
    var S=U.S;
    U.head(el,"PERMISSION","属性の条件と、いまの接続");
    var row=U.ctrls(el);
    var rq=U.select(row,"属性に付けた条件",_w20_REQ,2,draw);
    var lk=U.select(row,"いまの接続",_w20_LINK,0,draw);
    var row2=U.ctrls(el);
    var di=U.select(row2,"機器（ペリフェラル）の IO 能力",_w20_DEVIO.map(function(d){return d[0];}),1,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var need=[1,2,3,4][rq.get()],lv=lk.get()+1,dev=_w20_DEVIO[di.get()],maxLv=dev[1];
      var ok=lv>=need,err=null;
      if(!ok)err=(lv===1&&need===2)?["Insufficient Encryption","0x0F","暗号化が足りない"]:["Insufficient Authentication","0x05","認証が足りない"];
      var lanes=[["GATT クライアント（スマートフォン）","purple"],["GATT サーバ（機器）","signal"]],m=[];
      m.push([0,1,"Write Request"]);
      m.push(["note",1,"条件: "+_w20_REQ[rq.get()]+"\nいまの接続: レベル "+lv,{c:ok?"green":"alias"}]);
      if(ok){m.push([1,0,"Write Response（書き込めた）",{c:"green"}]);}
      else{
        m.push([1,0,"Error Response（"+err[2]+" "+err[1]+"）",{c:"alias"}]);
        if(maxLv>=need){m.push([0,1,"ペアリングと暗号化（"+dev[2]+"）",{c:"teal",dash:true}]);
          m.push(["note",1,"接続はレベル "+maxLv+" になった",{c:"teal"}]);
          m.push([0,1,"Write Request（もう一度）"]);m.push([1,0,"Write Response（書き込めた）",{c:"green"}]);}
        else{m.push(["note",0,"この機器とはレベル "+maxLv+" までしか\n届かないので、書き込めない",{c:"alias"}]);}
      }
      var q=U.seq(lanes,m,{w:680,x:10,y:8});
      box.set(S.svg(700,q.h+16,q.svg));
      ro.innerHTML="属性の条件: レベル "+need+" 以上 ・ いまの接続: レベル "+lv+" → "+(ok?'<span class="ok">通る</span>':'<span class="warn">断られる（ATT の '+err[0]+"、"+err[1]+"）</span>")+"<br>"+
        "この機器とスマートフォン（KeyboardDisplay・LESC・OOB なし）のペアリングで届く最も高いレベル: <b>"+maxLv+"</b>（"+dev[2]+"）"+
        (!ok&&maxLv<need?' ・ <span class="warn">ペアリングし直しても届かない</span>':'')+
        '<div class="wnote">'+(!ok&&maxLv<need?"届かないときは、属性の条件を見直すか、機器に表示か入力の手段・OOB を足すか、アプリケーション層で相手を確かめる。":"")+
        "どちらの誤りを返すか、受けた側がどう動くかは、スタックと OS によって細部が違う。</div>";
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
