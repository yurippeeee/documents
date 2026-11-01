/* 動かして理解する電源と周辺の制御 — 章内インタラクティブ部品
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
  /* ===== 01 章 電源と周辺制御の全体像 ===== */
  /* 動作の例（代表値）: 名前, 説明, 電流 [mA], 時間 [ms], 色 */
  var _w01_OPS=[
    ["処理","起きて計算する",3,4,"signal"],
    ["測定","センサの電源を入れて測る",1,20,"teal"],
    ["送信","無線でデータを送る",10,3,"gold"],
    ["LED","LED を点ける",5,20,"purple"],
    ["モータ","小さなモータを回す",150,300,"alias"]];
  /* 電池の例（代表値）: 名前, 電流を流していないときの電圧 [V], 容量 [mAh], 内部抵抗 [Ω] */
  var _w01_BAT=[
    ["CR2032（コイン形リチウム電池）",3.0,220,20],
    ["単 3 形アルカリ電池 2 本の直列（2000 mAh として）",3.0,2000,0.4],
    ["リチウムイオン電池 1 本（1000 mAh として）",3.7,1000,0.15]];
  function _w01_life(h,U){var d=h/24;return d>=365?U.sig(d/365,3)+" 年":(d>=1?U.sig(d,3)+" 日":U.sig(h,3)+" 時間");}

  /* ---- 4 節: 動作の並びと、平均電流・ピーク電流・電池寿命 ---- */
  REG.w01_profile=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"PROFILE","動作の並びと、平均電流・ピーク電流・電池寿命");
    var r0=U.ctrls(el),on=[];
    _w01_OPS.forEach(function(o,i){on.push(U.checkbox(r0,o[0]+"（"+o[2]+" mA × "+o[3]+" ms）",i===0||i===2,draw));});
    var r1=U.ctrls(el);
    var mode=U.select(r1,"動かし方",["順に動かす","同時に始める（電流が重なる）"],0,draw);
    var Tp=U.slider(r1,"周期 T（何秒ごとに起きるか）",{min:1,max:86400,value:60,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var Is=U.slider(r1,"眠りの電流",{min:0.5,max:100,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r2=U.ctrls(el);
    var bat=U.select(r2,"電池",_w01_BAT.map(function(b){return b[0];}),0,function(){Rin.set(_w01_BAT[bat.get()][3]);draw();});
    var Rin=U.slider(r2,"電池の内部抵抗",{min:0.05,max:200,value:20,log:true,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var Vmin=U.slider(r2,"マイコンが動ける最低の電圧",{min:1.6,max:3.4,step:0.1,value:2.2,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(ops,m,T,b,R){ops.forEach(function(v,i){on[i].set(v);});mode.set(m);Tp.set(T);Is.set(2);bat.set(b);Rin.set(R);Vmin.set(2.2);draw();}
    U.button(br,"4 節の例（ドアの開閉センサ）",function(){preset([1,0,1,0,0],0,60,0,20);});
    U.button(br,"扉が開いた（LED と送信を同時に、60 Ω）",function(){preset([0,0,1,1,0],1,60,0,60);});
    U.button(br,"同じものを順に",function(){preset([0,0,1,1,0],0,60,0,60);});
    U.button(br,"コイン電池でモータを回す",function(){preset([1,0,0,0,1],0,3600,0,20);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var ops=[];_w01_OPS.forEach(function(o,i){if(on[i].get())ops.push({n:o[0],I:o[2]*1e-3,t:o[3]*1e-3,c:o[4]});});
      var seqm=mode.get()===0,T=Tp.get(),is=Is.get()*1e-6,B=_w01_BAT[bat.get()],E=B[1],cap=B[2],R=Rin.get(),vm=Vmin.get();
      /* 並べ方: 順なら次々に、同時なら全部 0 から（長いものを下に積む） */
      var t=0;
      if(seqm)ops.forEach(function(o){o.s=t;t+=o.t;});
      else{ops.sort(function(a,b){return b.t-a.t;});ops.forEach(function(o){o.s=0;});}
      var L=seqm?t:(ops.length?ops[0].t:0),warn="";
      if(L>T){warn='<span class="warn">動作の時間の合計が周期より長い。周期を '+F.time(L)+' にして計算した。</span><br>';T=L;}
      /* 電流の折れ点 */
      var ts=[0,L];ops.forEach(function(o){ts.push(o.s,o.s+o.t);});ts=ts.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
      function Iat(x){var s=0;ops.forEach(function(o){if(x>=o.s-1e-12&&x<o.s+o.t-1e-12)s+=o.I;});return s;}
      var Ipk=is;ts.forEach(function(x){Ipk=Math.max(Ipk,Iat(x));});
      var Qa=0;ops.forEach(function(o){Qa+=o.I*o.t;});
      var Qs=is*(T-L),Q=Qa+Qs,Iavg=Q/T,lifeH=cap*1e-3/Iavg,Vpk=Math.max(0,E-Ipk*R);
      /* ---- 図 ---- */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?380:700,o=[],x0=62,wd=nar?300:330,span=Math.max(L,1e-3)*1.08;
      var yI=26,hI=110,Imax=Math.max(Ipk*1.18,1e-3);
      var X=function(s){return x0+s/span*wd;},YI=function(i){return yI+hI-i/Imax*hI;};
      o.push(S.T(10,14,"起きている間の電流","start",10.5,"ink",true));
      o.push(S.W([x0,yI,x0,yI+hI,x0+wd,yI+hI],"muted",1.1));
      U.nice(0,Imax*1e3,4).forEach(function(v){if(v<=Imax*1e3+1e-9){o.push(S.L(x0-4,YI(v*1e-3),x0,YI(v*1e-3),"muted",1));o.push(S.T(x0-7,YI(v*1e-3)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-40,yI+hI/2,"電流 [mA]","middle",9.5,"muted",false,false,-90));
      if(!ops.length)o.push(S.T(x0+wd/2,yI+hI/2,"動作を 1 つ以上選ぶと表示される","middle",10,"muted"));
      var base=0;
      ops.forEach(function(op){var b0=seqm?0:base;
        o.push(S.RECT(X(op.s),YI(b0+op.I),Math.max(1,X(op.s+op.t)-X(op.s)),YI(b0)-YI(b0+op.I),0,U.soft(op.c),op.c,1));
        var wpx=X(op.s+op.t)-X(op.s),hpx=YI(b0)-YI(b0+op.I);
        if(wpx>30&&hpx>13)o.push(S.T((X(op.s)+X(op.s+op.t))/2,(YI(b0)+YI(b0+op.I))/2+4,op.n,"middle",9.5,op.c,true));
        if(!seqm)base+=op.I;});
      o.push(S.L(x0,YI(Ipk),x0+wd,YI(Ipk),"alias",1,"4 3"));
      o.push(S.T(x0+wd,YI(Ipk)-4,"ピーク "+F.cur(Ipk),"end",9.5,"alias",true,false,null,true));
      var ax=yI+hI;U.nice(0,span*1e3,5).forEach(function(v){if(v*1e-3<=span){o.push(S.L(X(v*1e-3),ax,X(v*1e-3),ax+4,"muted",1));o.push(S.T(X(v*1e-3),ax+15,U.sig(v,4),"middle",9,"muted"));}});
      o.push(S.T(x0+wd,ax+28,"時間 [ms]","end",9,"muted"));
      /* 電池の電圧 */
      var yV=yI+hI+50,hV=90,vlo=Math.max(0,Math.min(Vpk,vm)-0.3),vhi=E+0.15,YV=function(v){return yV+hV-(v-vlo)/(vhi-vlo)*hV;};
      o.push(S.T(10,yV-8,"電池の電圧 = "+E.toFixed(1)+" V − 電流 × 内部抵抗","start",10.5,"ink",true));
      o.push(S.W([x0,yV,x0,yV+hV,x0+wd,yV+hV],"muted",1.1));
      U.nice(vlo,vhi,4).forEach(function(v){if(v>=vlo-1e-9&&v<=vhi+1e-9){o.push(S.L(x0-4,YV(v),x0,YV(v),"muted",1));o.push(S.T(x0-7,YV(v)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-40,yV+hV/2,"電圧 [V]","middle",9.5,"muted",false,false,-90));
      var pv=[];for(var k=0;k<ts.length-1;k++){var a=ts[k],b=ts[k+1],v=Math.max(0,E-Iat(a)*R);pv.push([X(a),YV(v)],[X(b),YV(v)]);}
      pv.push([X(L),YV(E)],[X(span),YV(E)]);
      if(ops.length)o.push(S.PL(pv,"gold",2));
      o.push(S.L(x0,YV(vm),x0+wd,YV(vm),"alias",1.2,"5 3"));
      o.push(S.T(x0+wd,YV(vm)+12,"最低の電圧 "+vm.toFixed(1)+" V","end",9,"alias",false,false,null,true));
      /* 右: 1 周期の電荷の内訳 */
      var bx=nar?10:450,by=nar?yV+hV+50:0,bw=nar?340:230,parts=[["眠り",Qs,"muted"]];ops.slice().sort(function(a,b){return a.s-b.s;}).forEach(function(op){parts.push([op.n,op.I*op.t,op.c]);});
      o.push(S.T(bx,by+14,"1 周期の電荷の内訳","start",10.5,"ink",true));
      var xx=bx;parts.forEach(function(p){var w=bw*p[1]/Q;o.push(S.RECT(xx,by+24,Math.max(w,0.6),22,2,U.soft(p[2]),p[2],1));xx+=w;});
      parts.forEach(function(p,i){var yy=by+66+i*17;o.push(S.RECT(bx,yy-9,10,10,2,U.soft(p[2]),p[2],1));
        o.push(S.T(bx+16,yy,p[0]+" "+U.sig(p[1]*1e6,3)+" µC（"+U.sig(p[1]/Q*100,3)+" %）","start",9.5,p[2]==="muted"?"ink":p[2]));});
      var ys=by+66+parts.length*17+14;
      o.push(S.T(bx,ys,"平均電流 "+F.cur(Iavg),"start",11,"ink",true));
      o.push(S.T(bx,ys+18,"ピーク電流 "+F.cur(Ipk),"start",11,"alias",true));
      o.push(S.T(bx,ys+36,"電池寿命 "+_w01_life(lifeH,U),"start",11,"ink",true));
      var low=Vpk<vm;
      o.push(S.T(bx,ys+54,"ピークの電圧 "+Vpk.toFixed(2)+" V"+(low?"（下回る）":""),"start",11,low?"alias":"green",true));
      box.set(S.svg(W,nar?ys+64:yV+hV+36,o));
      var terms=ops.slice().sort(function(a,b){return a.s-b.s;}).map(function(op){return F.cur(op.I)+" × "+F.time(op.t);});
      ro.innerHTML=warn+"1 周期の電荷 Q = Σ I_k t_k = "+(terms.length?terms.join(" + ")+" + ":"")+F.cur(is)+" × "+F.time(T-L,4)+" = <b>"+U.sig(Q*1e6,4)+" µC</b><br>"+
        "平均電流 I_avg = Q ÷ T = "+U.sig(Q*1e6,4)+" µC ÷ "+F.time(T)+" = <b>"+F.cur(Iavg)+"</b>（眠りの分 "+U.sig(Qs/Q*100,3)+" %）<br>"+
        "電池寿命 = "+cap+" mAh ÷ "+F.cur(Iavg)+" ≈ <b>"+U.fmt.int(lifeH)+" 時間（"+_w01_life(lifeH,U)+"）</b><br>"+
        "ピーク電流 I_pk = <b>"+F.cur(Ipk)+"</b> → 電池の電圧 ≈ "+E.toFixed(1)+" V − "+F.cur(Ipk)+" × "+U.sig(R,3)+" Ω = <b>"+Vpk.toFixed(2)+" V</b> → "+
        (Vpk<=0.05?'<span class="warn">電池の電圧が 0 V 近くまで下がる計算になる。実際には、この電池からこの電流は流せない。</span>':
         low?'<span class="warn">最低の電圧 '+vm.toFixed(1)+' V を下回り、マイコンはリセットされる</span>':'<span class="ok">最低の電圧 '+vm.toFixed(1)+' V を下回らない</span>')+
        '<div class="wnote">電流と時間は代表値の例。起きている間の電流は、各動作の間の機器全体の電流とし、眠りの電流は起きている間に足していない。容量は電池に表示された値で計算した（温度・電流・自己放電で、実際の寿命は短くなる。03 章）。電池の電圧は、電流を流していないときの電圧から、電流 × 内部抵抗だけ下がるとした（02・03 章）。</div>';
    }
    draw();
  };

  /* ---- 6 節: 使用条件から、気をつけることと読む章 ---- */
  /* 項目: [条件の関数, 気をつけること, 何が起きるか, マイコンでする制御, 章（"s4" "s5" はこの章の節）] */
  var _w01_ITEMS=[
    [function(s){return s.bat;},"平均電流と電池寿命","電池の電荷は限られ、平均電流で何年もつかが決まる","間欠動作にして、眠る時間を長くする",["s4","07"]],
    [function(s){return s.bat;},"ピーク電流と電池の電圧","送信やモータの瞬間に電池の電圧が下がり、マイコンがリセットすることがある","大きな動作を重ねない。コンデンサでピークを助ける",["s4","03","04"]],
    [function(s){return s.bat;},"電池が尽きるとき","電池の電圧が下がりきる前に、マイコンが動けなくなる","負荷をかけた状態で電圧を測り、尽きる前に記録して止まる",["04","05"]],
    [function(s){return s.pw===1||s.pw===6;},"充電と過放電","決まった電流と電圧で充電する。使いすぎると電池を傷める","充電の状態を読み、温度が範囲の外なら充電を止める",["04"]],
    [function(s){return s.pw===2||s.pw===3;},"取り出せる電流の上限","USB や AC アダプタには、取り出してよい電流の上限がある","大きな動作を重ねない。周辺の電源をゆっくり入れる",["02","05"]],
    [function(s){return s.pw===2||s.pw===3;},"抜き差しと電源の途切れ","いつ抜かれるか分からない","電源の電圧を見張り、書き込みの途中で切れても壊れないようにする",["02","05"]],
    [function(s){return s.pw===4;},"感電と火災","非絶縁の回路は、商用電源と同じ電位になる","（マイコンでは守れない）絶縁を回路と筐体で決める。通電中の回路に PC やデバッガを直接つながない",["02","06"]],
    [function(s){return s.pw===4;},"停電と復電","電源が途切れ、また戻る","停電を見つけて後始末し、危険な動作を自動で再開しない",["06"]],
    [function(s){return s.pw===4;},"サージと待機電力","雷などで大きな電圧が入る。使っていない間も電力を使う","異常を記録する。待機中に止めるものを決める",["06"]],
    [function(s){return s.pw===5;},"電源の電圧の大きな変動","エンジンの始動で下がり、一時的に大きく上がることもある","電源の電圧を見張り、下がったら大きな動作を止める",["02","05"]],
    [function(s){return s.pw===5;},"駐車中の電流","エンジンを止めている間も、車の電池から電流を取り続ける","駐車中は眠り、電流を小さくする",["07"]],
    [function(s){return s.pw===6;},"入る電力と使う電力の釣り合い","取れる電力が小さく、天気や時刻で変わる","蓄えた電荷に合わせて、起きる間隔を変える",["02"]],
    [function(s){return s.L[0];},"センサの電源と測り方","測る間だけ電源を入れる。値は基準電圧やノイズでずれる","電源を入れて安定を待ってから測り、平均する。故障を調べる",["08","09","10"]],
    [function(s){return s.L[1];},"送信のピーク電流","送信の瞬間に数 mA〜数百 mA（方式による）が流れる","ほかの大きな動作と重ねない",["s4","04"]],
    [function(s){return s.L[2];},"チャタリングと長い配線","スイッチは押した瞬間に何度も入り切りする。長い配線は静電気やノイズを拾う","時間をおいて読み直して確かめる。入力を保護する",["11"]],
    [function(s){return s.L[3];},"LED の電流と明るさ","抵抗で電流を決める。電池の電圧が下がると暗くなる","PWM で明るさを決める",["12"]],
    [function(s){return s.L[4];},"切ったときの電圧の跳ね上がり","コイルの電流を切ると、大きな電圧が出る","保護のダイオードを付ける。保持の電流を下げる",["12"]],
    [function(s){return s.L[5];},"起動電流と止め方","回り始めに大きな電流が流れ、電源の電圧が下がる","ゆっくり加速する。電流を測って、回らないまま電流が流れ続けるのを見つける",["12","13","15"]],
    [function(s){return s.L[6];},"位置のずれと、動くときの電流","急に加速すると回りきれずに位置がずれる。動くときに大きな電流が流れる","加速と減速をなめらかにする。止まっている間の電流を下げる",["13"]],
    [function(s){return s.L[7];},"過熱","入ったままだと過熱し、火災になる","安全な状態（切）を回路で決め、マイコンに頼らない保護を置く",["s5","14","15"]],
    [function(s){return s.L[7];},"温度の制御","センサの遅れで、温度が目標を行き過ぎる","オンオフ制御や PID 制御で、加える電力を決める",["14"]],
    [function(s){return s.L[7]&&s.pw===4;},"AC のヒータの入れ切り","入れ切りの瞬間に大きな電流やノイズが出る","交流の電圧が 0 の瞬間に合わせて入れ切りする",["06","14"]],
    [function(s){return s.E[0]&&s.bat;},"低温の電池","取り出せる電荷が減り、内部抵抗が大きくなって電圧が下がりやすい","寒いときは大きな動作を減らす",["03","04"]],
    [function(s){return s.E[1];},"部品の温度","周りが暑いと、レギュレータやスイッチの発熱で、さらに温度が上がる","温度を見張り、出力を下げる",["14"]],
    [function(s){return s.E[2];},"静電気・雷・ノイズ","長い配線は、静電気・誘導・雷の電圧を拾う","入力を保護し、値を確かめてから使う",["06","11"]],
    [function(s){return s.U[0];},"眠らせ方と漏れ電流","眠っている間の電流が、平均電流の大部分になりやすい","眠る前にピンと周辺を整え、深く眠る",["05","07"]],
    [function(s){return s.U[1];},"何年も保守しない","電池寿命が足りるか、故障に気づけるかが問われる","平均電流を見積もる。センサの故障を調べる",["s4","10"]],
    [function(s){return s.U[2]||s.L[7];},"安全な状態","リセット・停電・プログラムの停止のとき、アクチュエータが危険な状態のままになりうる","安全な状態を決めて回路で保証し、ウォッチドッグで見張る",["s5","15"]],
    [function(){return true;},"マイコンの電源","電源の電圧が下がると、マイコンはリセットされる","電源の電圧を見張り、リセットする電圧を決める",["05"]]];
  var _w01_SEC={s4:["#平均電流とピーク電流","4 節"],s5:["#安全な状態という考え方","5 節"]};
  var _w01_TITLES=["全体像","電源の種類","電池を知る","電池の制御","電源まわり","AC 電源","眠らせ方","センサ","アナログ値","測り方","スイッチ","出力","モータ","熱","異常","設計ガイド"];

  REG.w01_check=function(el,U){
    var S=U.S;
    U.head(el,"CHECK","使用条件から、気をつけることと読む章");
    var r1=U.ctrls(el);
    var pw=U.select(r1,"電源",["一次電池（交換する）","二次電池（充電する）","USB","AC アダプタ","商用電源に直結","車の電源","太陽電池などの環境発電"],0,draw);
    var r2=U.ctrls(el),L=[];
    ["センサ","無線","スイッチ・ボタン","LED","リレー・ソレノイド","DC モータ","ステッピング・サーボ","ヒータ"].forEach(function(t){L.push(U.checkbox(r2,t,false,draw));});
    var r3=U.ctrls(el),E=[],Us=[];
    ["0 °C より寒くなる","40 °C より暑くなる","屋外・長い配線"].forEach(function(t){E.push(U.checkbox(r3,t,false,draw));});
    var r4=U.ctrls(el);
    ["ほとんど眠って間欠で動く","何年も保守しない","止まると危険・人のそばで動く"].forEach(function(t){Us.push(U.checkbox(r4,t,false,draw));});
    var br=U.btnrow(el);
    function preset(p,l,e,u){pw.set(p);L.forEach(function(c,i){c.set(l.indexOf(i)>=0);});E.forEach(function(c,i){c.set(e.indexOf(i)>=0);});Us.forEach(function(c,i){c.set(u.indexOf(i)>=0);});draw();}
    U.button(br,"ドアの開閉センサ",function(){preset(0,[1,2,3],[],[0,1]);});
    U.button(br,"電気ファンヒータ",function(){preset(4,[0,5,7],[],[2]);});
    U.button(br,"USB の測定器",function(){preset(2,[0,3],[],[]);});
    U.button(br,"屋外の気象計",function(){preset(6,[0,1],[0,1,2],[0,1]);});
    U.button(br,"車の記録計",function(){preset(5,[3],[0,1],[]);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function link(c){if(_w01_SEC[c])return '<a href="'+_w01_SEC[c][0]+'">'+_w01_SEC[c][1]+'</a>';return '<a href="'+c+'.html">'+c+'</a>';}
    function draw(){
      var s={pw:pw.get(),L:L.map(function(c){return c.get();}),E:E.map(function(c){return c.get();}),U:Us.map(function(c){return c.get();})};
      s.bat=s.pw===0||s.pw===1||s.pw===6;
      var hits=_w01_ITEMS.filter(function(it){return it[0](s);}),cnt={};
      hits.forEach(function(it){it[4].forEach(function(c){if(!_w01_SEC[c])cnt[c]=(cnt[c]||0)+1;});});
      cnt["16"]=(cnt["16"]||0)+1;
      /* 章の札 */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,nc=nar?4:8,W=nar?360:700,o=[],cw=(W-20)/nc,ch=38,x0=10,PC=function(n){return n<=7?"gold":n<=11?"teal":n<=14?"purple":"green";};
      o.push(S.T(x0,14,nar?"読む章（右上の数は、挙げた項目の数）":"読む章（色の付いた札。右上の数は、その章を挙げた項目の数）","start",10.5,"ink",true));
      for(var n=1;n<=16;n++){var k=(n<10?"0":"")+n,x=x0+((n-1)%nc)*cw,y=24+Math.floor((n-1)/nc)*(ch+6),c=PC(n),hit=cnt[k]||n===1;
        o.push(S.RECT(x+1,y,cw-5,ch,5,hit?U.soft(c):"var(--screen)",hit?c:"line",hit?1.6:1));
        o.push(S.T(x+8,y+16,k,"start",11,hit?c:"faint",true,true));
        o.push(S.T(x+8,y+31,_w01_TITLES[n-1],"start",9.5,hit?"ink":"faint"));
        var tag=n===1?"この章":(n===16?"まとめ":(cnt[k]?"×"+cnt[k]:""));
        if(tag)o.push(S.T(x+cw-10,y+16,tag,"end",9.5,c,true));}
      box.set(S.svg(W,24+(16/nc)*(ch+6),o));
      var rows=hits.map(function(it){return ['<b>'+it[1]+'</b>',it[2],it[3],it[4].map(link).join("・")];});
      ro.innerHTML="当てはまる項目 <b>"+hits.length+"</b> 個"+U.tbl(["気をつけること","何が起きるか","マイコンでする制御","読む章"],rows,["wrap","wrap","wrap","left"])+
        '<div class="wnote">項目と章は目安である。どの機器も、16 章で条件ごとの手順を確かめる。商用電源を扱う回路は、感電と火災の危険があるので、安全規格・法令・資格を確かめること（06 章）。</div>';
    }
    draw();
  };

  /* ===== 02 章 電源の種類と性質 ===== */

  /* ---- 3 節: 電源の種類とパルスの電流 → 端子電圧 ---- */
  /* 電源の例（代表値）: E 起電力 [V]、R 内部抵抗（ケーブルを含む）[Ω]、lim 取り出せる電流 [A]（0 は決まりなし）、
     kind: bat 電池 / usb 規則で決まる上限 / prot 超えると保護が働く / unreg 安定化していない（超えると熱くなる）、vmin 例の最低の電圧 */
  var _w02_SRC=[
    {t:"コイン形リチウム電池 1 個（3.0 V・20 Ω）",E:3.0,R:20,lim:0,kind:"bat",vmin:1.8},
    {t:"単 3 形アルカリ乾電池 2 本（3.1 V・0.3 Ω）",E:3.1,R:0.3,lim:0,kind:"bat",vmin:1.8},
    {t:"リチウムイオン電池 1 セル（3.8 V・0.1 Ω）",E:3.8,R:0.1,lim:0,kind:"bat",vmin:3.4},
    {t:"USB 2.0 のポート・設定の後（5.0 V・ケーブル 0.4 Ω・500 mA）",E:5.0,R:0.4,lim:0.5,kind:"usb",vmin:3.4},
    {t:"USB 2.0 のポート・設定の前（5.0 V・0.4 Ω・100 mA）",E:5.0,R:0.4,lim:0.1,kind:"usb",vmin:3.4},
    {t:"USB Type-C の 3.0 A の表示（5.0 V・0.2 Ω）",E:5.0,R:0.2,lim:3.0,kind:"usb",vmin:3.4},
    {t:"安定化した AC アダプタ 5 V・1 A（0.15 Ω）",E:5.0,R:0.15,lim:1.0,kind:"prot",vmin:3.4},
    {t:"安定化していない AC アダプタ 9 V・0.5 A（12 V・6 Ω）",E:12.0,R:6.0,lim:0.5,kind:"unreg",vmin:5.0}];

  function _w02_volt(v){var a=Math.abs(v);return a>=1?_w02_s(v,4)+" V":a>=1e-3?_w02_s(v*1e3,3)+" mV":a>=1e-6?_w02_s(v*1e6,3)+" µV":"0 V";}
  function _w02_pow(w){var a=Math.abs(w);return a>=1?_w02_s(w,3)+" W":a>=1e-3?_w02_s(w*1e3,3)+" mW":a>=1e-6?_w02_s(w*1e6,3)+" µW":a>=1e-9?_w02_s(w*1e9,3)+" nW":"0 W";}
  function _w02_s(v,d){var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  REG.w02_supply=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"SUPPLY","電源の種類とピーク電流 — 端子電圧はどこまで下がるか");
    var r1=U.ctrls(el);
    var src=U.select(r1,"電源（値は代表値の例）",_w02_SRC.map(function(s){return s.t;}),1,function(){var s=_w02_SRC[src.get()];E.set(s.E);R.set(s.R);vmin.set(s.vmin);draw();});
    var r2=U.ctrls(el);
    var E=U.slider(r2,"起電力 E",{min:1,max:13,step:0.1,value:3.1,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var R=U.slider(r2,"内部抵抗 R_in",{min:0.01,max:100,log:true,value:0.3,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var vmin=U.slider(r2,"動く最低の電圧（例）",{min:0.5,max:12,step:0.1,value:1.8,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var r3=U.ctrls(el);
    var isl=U.slider(r3,"眠りの電流",{min:1,max:1000,log:true,value:5,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var ish=U.slider(r3,"短いパルス（無線の送信など）",{min:1,max:500,log:true,value:15,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var tsh=U.slider(r3,"短いパルスの長さ",{min:0.5,max:50,log:true,value:3,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var r4=U.ctrls(el);
    var lon=U.checkbox(r4,"長いパルス（モータ・LED など）を入れる",true,draw);
    var ilg=U.slider(r4,"長いパルスの電流",{min:1,max:3000,log:true,value:200,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var tlg=U.slider(r4,"長いパルスの長さ",{min:10,max:1000,log:true,value:300,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* 区間の電流から端子電圧を求める。保護が働く電源は、上限の 1.2 倍を超えると出力を止める（例） */
    function volt(I,s,e,r){
      if(s.kind==="prot"&&I>s.lim*1.2)return {v:0,why:"prot"};
      var v=e-I*r;
      if(v<0)return {v:0,why:"cant"};
      return {v:v,why:""};}
    function draw(){
      var s=_w02_SRC[src.get()],e=E.get(),r=R.get(),vm=vmin.get();
      var Is=isl.get()*1e-6,Ip=ish.get()*1e-3,tp=tsh.get(),useL=lon.get(),IL=ilg.get()*1e-3,tl=tlg.get();
      ilg.el.style.opacity=useL?1:0.45;tlg.el.style.opacity=useL?1:0.45;
      /* 区間の並び: 眠り → 短いパルス → 眠り → 長いパルス → 眠り → 短いパルス → 眠り */
      var t1=100,t2=t1+tp+150,t3=t2+(useL?tl:0)+150,Tend=Math.max(1000,t3+tp+150);
      var segs=[[0,t1,Is,"sleep"],[t1,t1+tp,Ip,"short"],[t1+tp,t2,Is,"sleep"]];
      if(useL)segs.push([t2,t2+tl,IL,"long"]);
      segs.push([t2+(useL?tl:0),t3,Is,"sleep"],[t3,t3+tp,Ip,"short"],[t3+tp,Tend,Is,"sleep"]);
      var W=700,x0=78,wd=592,o=[],X=function(t){return x0+t/Tend*wd;};
      var Imax=Math.max(Ip,useL?IL:0,Is)*1.6;
      var pi=U.plot(x0,26,wd,100,[0,Tend],[1e-6,Math.max(Imax,1e-3)],{ylog:true});
      var pv=U.plot(x0,166,wd,120,[0,Tend],[0,Math.max(e,vm)*1.08]);
      o.push(S.T(x0,16,"負荷の電流（対数目盛）","start",10,"purple",true));
      o.push(pi.axes({yt:[1e-6,1e-5,1e-4,1e-3,1e-2,1e-1,1].filter(function(v){return v<=Math.max(Imax,1e-3);}),xt:[],yfmt:function(v){return F.cur(v,1);},ylOff:60}));
      if(s.lim>0){o.push(pi.line([[0,s.lim],[Tend,s.lim]],"gold",1.3,"6 4"));
        o.push(S.T(x0+wd-4,pi.Y(s.lim)-5,(s.kind==="usb"?"使ってよい電流 ":"定格 ")+F.cur(s.lim),"end",9.5,"gold",true));}
      var pts=[[X(0),pi.Y(Is)]];
      segs.forEach(function(g){var w=Math.max(X(g[1])-X(g[0]),2);pts.push([X(g[0]),pi.Y(g[2])]);pts.push([X(g[0])+w,pi.Y(g[2])]);});
      o.push(S.PL(pts,"purple",1.8));
      o.push(S.T(x0,156,"端子電圧","start",10,"gold",true));
      o.push(pv.axes({xt:U.nice(0,Tend,6),xl:"時間 [ms]",yfmt:function(v){return U.sig(v,3);},yl:"電圧 [V]",ylOff:44}));
      o.push(pv.line([[0,vm],[Tend,vm]],"alias",1.3,"5 4"));
      o.push(S.T(x0+wd-4,pv.Y(vm)+14,"動く最低の電圧 "+vm.toFixed(1)+" V","end",9.5,"alias",true));
      o.push(pv.line([[0,e],[Tend,e]],"faint",1,"2 4"));
      var res={},vp=[];
      segs.forEach(function(g){var q=volt(g[2],s,e,r),w=Math.max(X(g[1])-X(g[0]),2),bad=q.v<vm;
        o.push(S.L(X(g[0]),pv.Y(q.v),X(g[0])+w,pv.Y(q.v),bad?"alias":"gold",2.2));vp.push([X(g[0]),pv.Y(q.v)],[X(g[0])+w,pv.Y(q.v)]);
        if(!res[g[3]])res[g[3]]={I:g[2],q:q};});
      o.push(S.PL(vp,"gold",0.8));
      box.set(S.svg(W,320,o));
      /* 読み出し */
      var names={sleep:"眠り",short:"短いパルス",long:"長いパルス"},rows=[],worst=null;
      ["sleep","short","long"].forEach(function(k){if(!res[k])return;var I=res[k].I,q=res[k].q,v=q.v,dv=e-v;
        var verdict;
        if(q.why==="prot")verdict='<span class="warn">保護が働いて出力が止まる（リセット）</span>';
        else if(q.why==="cant")verdict='<span class="warn">この電流は流せない（電圧が 0 まで下がる）</span>';
        else if(v<vm)verdict='<span class="warn">最低の電圧を割る</span>';
        else verdict='<span class="ok">動く</span>';
        if(s.lim>0&&I>s.lim&&q.why!=="prot")verdict+=s.kind==="usb"?' ・ <span class="warn">使ってよい電流を超える（規格に反する）</span>':' ・ <span class="warn">定格を超える（熱くなる）</span>';
        if(worst===null||v<worst)worst=v;
        rows.push([names[k],F.cur(I),q.why?"—":_w02_volt(v),q.why?"—":_w02_volt(dv),q.why?"—":_w02_pow(I*I*r),verdict]);});
      var imax=(e-vm)/r;
      ro.innerHTML="端子電圧 V = E − I × R_in = "+e.toFixed(2)+" V − I × "+U.sig(r,3)+" Ω"+
        U.tbl(["区間","電流 I","端子電圧 V","下がる電圧","内部抵抗の熱","判定"],rows,["left","right","right","right","right","wrap"])+
        "動く最低の電圧を保てる電流の上限 = (E − 最低の電圧) ÷ R_in = <b>"+(imax>0?F.cur(imax):"0（E が最低の電圧より低い）")+"</b>"+(s.lim>0?"、電源の取り出せる電流 "+F.cur(s.lim):"")+
        '<div class="wnote">内部抵抗の模型（1 節）だけで計算した。実際の電池では内部抵抗が温度と残量で変わり（03 章）、パルスの間に電圧がさらにゆっくり下がることもある。保護が働く電流と動き方は製品による（ここでは定格の 1.2 倍で止まるとした）。ピーク電流をコンデンサで補う方法は 04 章で扱う。</div>';
    }
    draw();
  };

  /* ---- 6 節: 環境発電の収支 ---- */
  REG.w02_harvest=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"HARVEST","環境発電の収支 — 蓄えは暗い間を越せるか");
    var r1=U.ctrls(el);
    var light=U.select(r1,"光",["室内の照明（平日の 8〜18 時、週末は消える）","室内の照明（毎日 8〜18 時）","屋外（晴れ。日中の山 10 mW/cm²）","屋外（曇り。日中の山 2 mW/cm²）"],0,draw);
    var area=U.slider(r1,"太陽電池の面積",{min:1,max:100,log:true,value:10,fmt:function(v){return U.sig(v,3)+" cm²";},onInput:draw});
    var r2=U.ctrls(el);
    var cap=U.slider(r2,"蓄えのコンデンサ",{values:[0.047,0.1,0.22,0.47,0.68,1,2.2,4.7],value:0.47,fmt:function(v){return v<0.1?Math.round(v*1000)+" mF":v+" F";},onInput:draw});
    var pl=U.slider(r2,"機器の平均の消費電力",{min:1,max:3000,log:true,value:30,fmt:function(v){return U.sig(v,3)+" µW";},onInput:draw});
    var r3=U.ctrls(el);
    var voff=U.slider(r3,"止める電圧",{min:1.8,max:3.5,step:0.1,value:2.2,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var von=U.slider(r3,"動かす電圧",{min:1.8,max:4.8,step:0.1,value:3.0,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var wk=U.slider(r3,"期間",{values:[1,2,3],value:1,fmt:function(v){return v+" 週間";},onInput:draw});
    var r4=U.ctrls(el);
    var empty=U.checkbox(r4,"空の蓄え（0 V）から始める（チェックなしは満杯の 5.0 V から）",false,draw);
    var br=U.btnrow(el);
    function preset(a,c,p,n){light.set(0);area.set(a);cap.set(c);pl.set(p);voff.set(2.2);von.set(3.0);wk.set(n);empty.set(false);draw();}
    U.button(br,"例の値（10 cm²・0.47 F・30 µW）",function(){preset(10,0.47,30,1);});
    U.button(br,"1 F にする（3 週間）",function(){preset(10,1,30,3);});
    U.button(br,"15 cm²・1 F（3 週間）",function(){preset(15,1,30,3);});
    var box=U.svgbox(el); var ro=U.readout(el);
    var VMAX=5.0,ETA=0.8,POFF=1e-6;
    /* 時刻 t [s] に太陽電池から取り出せる電力 [W] */
    function ph(t,L,A){var day=Math.floor(t/86400),h=(t%86400)/3600;
      if(L<=1){var on=h>=8&&h<18&&(L===1||day%7<5);return on?A*10e-6:0;}
      var pk=(L===2?10e-3:2e-3)*A;return (h>=6&&h<18)?pk*Math.sin(Math.PI*(h-6)/12):0;}
    function draw(){
      var L=light.get(),A=area.get(),C=cap.get(),P=pl.get()*1e-6,Vf=voff.get(),Vo=von.get(),N=wk.get();
      var warn="";
      if(Vo<Vf){warn='<span class="warn">動かす電圧が止める電圧より低いので、止める電圧と同じにして計算した。</span><br>';Vo=Vf;}
      var dt=60,steps=Math.round(N*7*86400/dt),Emax=0.5*C*VMAX*VMAX,Eoff=0.5*C*Vf*Vf;
      var Ec=empty.get()?0:Emax,run=!empty.get(),stops=0,downT=0,pts=[],red=[],r0=null,inJ=0,outJ=0;
      for(var k=0;k<steps;k++){var t=k*dt,p=ph(t,L,A);
        var add=ETA*p*dt;inJ+=add;Ec=Math.min(Ec+add,Emax);
        if(run){Ec-=P*dt;outJ+=P*dt;if(Ec<Eoff){run=false;stops++;r0=t;}}
        else{Ec-=POFF*dt;downT+=dt;if(Math.sqrt(2*Math.max(Ec,0)/C)>=Vo){run=true;if(r0!==null){red.push([r0,t]);}r0=null;}}
        if(!run&&r0===null)r0=t;
        Ec=Math.max(Ec,0);
        if(k%10===0)pts.push([t/86400,Math.sqrt(2*Ec/C)]);}
      if(r0!==null)red.push([r0,steps*dt]);
      var D=N*7,W=700,o=[],p=U.plot(70,30,600,190,[0,D],[0,5.5]);
      /* 光のある時間 */
      for(var d=0;d<D;d++){if(L<=1){if(L===1||d%7<5)o.push(S.RECT(p.X(d+8/24),p.y,p.X(d+18/24)-p.X(d+8/24),p.h,0,U.soft("gold"),"none",0));}
        else o.push(S.RECT(p.X(d+6/24),p.y,p.X(d+18/24)-p.X(d+6/24),p.h,0,U.soft("gold"),"none",0));}
      red.forEach(function(q){o.push(S.RECT(p.X(q[0]/86400),p.y,Math.max(p.X(q[1]/86400)-p.X(q[0]/86400),1),p.h,0,U.soft("alias"),"none",0));});
      var xt=[];for(var i=0;i<=D;i++)xt.push(i);
      o.push(p.axes({yl:"蓄えの電圧 [V]",xt:xt,yt:[0,1,2,3,4,5],xfmt:function(){return "";},yfmt:function(v){return String(v);}}));
      for(i=0;i<D;i++)o.push(S.T(p.X(i+0.5),p.y+p.h+15,"月火水木金土日".charAt(i%7),"middle",D>7?9:10,"ink",true));
      o.push(p.line([[0,Vf],[D,Vf]],"alias",1.2,"5 4"));o.push(p.line([[0,Vo],[D,Vo]],"muted",1.1,"3 3"));
      o.push(S.T(p.X(D)-4,p.Y(Vf)+13,"止める "+Vf.toFixed(1)+" V","end",9.5,"alias"));
      o.push(S.T(p.X(D)-4,p.Y(Vo)-5,"動かす "+Vo.toFixed(1)+" V","end",9.5,"muted"));
      o.push(p.line(pts,"signal",1.8));
      o.push(S.RECT(70,252,10,10,2,U.soft("gold"),"gold",1.2));o.push(S.T(85,261,"光のある時間","start",10,"muted"));
      o.push(S.RECT(190,252,10,10,2,U.soft("signal"),"signal",1.2));o.push(S.T(205,261,"蓄えの電圧","start",10,"muted"));
      o.push(S.RECT(300,252,10,10,2,U.soft("alias"),"alias",1.2));o.push(S.T(315,261,"機器が止まっている時間","start",10,"muted"));
      box.set(S.svg(W,270,o));
      /* 収支（1 日・1 週） */
      var dayIn=0,weekIn=0;for(var tt=0;tt<7*86400;tt+=60){var e=ETA*ph(tt,L,A)*60;weekIn+=e;if(tt<86400)dayIn+=e;}
      var dayOut=P*86400,weekOut=P*7*86400,use=0.5*C*(VMAX*VMAX-Vf*Vf),hold=use/P/3600;
      ro.innerHTML=warn+"1 日（"+(L===0?"平日":"毎日")+"）に蓄えへ入る "+U.sig(dayIn,3)+" J（取り込みで 2 割を失った後）、出る "+U.sig(dayOut,3)+" J → "+(dayIn>=dayOut?'<span class="ok">足りる</span>':'<span class="warn">足りない</span>')+"<br>"+
        "1 週間に入る "+U.sig(weekIn,3)+" J、出る "+U.sig(weekOut,3)+" J → "+(weekIn>=weekOut?'<span class="ok">足りる</span>':'<span class="warn">足りない（毎週 '+U.sig(weekOut-weekIn,3)+' J 減る）</span>')+"<br>"+
        "蓄え（"+(C<0.1?Math.round(C*1000)+" mF":C+" F")+"）から 5.0 V → "+Vf.toFixed(1)+" V で取り出せる ½ C (5.0² − "+Vf.toFixed(1)+"²) = <b>"+U.sig(use,3)+" J</b> → 光が無くても <b>"+U.sig(hold,3)+" 時間</b>動ける<br>"+
        (stops?'<span class="warn">'+N+' 週間で '+stops+' 回止まり、合わせて '+U.sig(downT/3600,3)+' 時間止まっていた</span>':(empty.get()&&downT>0?'空から始めて '+U.sig(downT/3600,3)+' 時間で動き始め、その後は止まらなかった':'<span class="ok">'+N+' 週間、止まらずに動き続けた</span>'))+
        '<div class="wnote">取り込みで失う割合 2 割、蓄えの上限 5.0 V、止まっている間の電力 1 µW は固定にした。室内は 1 cm² あたり 10 µW、屋外は 6〜18 時の正弦波とした（どれも代表値の例）。コンデンサ自身が失う電荷と、温度による変化は入れていない。</div>';
    }
    draw();
  };

  /* ---- 7 節: OR 接続 ---- */
  var _w02_VT=0.025693;
  var _w02_DI={si:{n:1.8,vf1:0.85,ir:10e-9},sk:{n:1.05,vf1:0.40,ir:10e-6}};
  /* 電源 E・内部抵抗 R・素子 k を通って、電圧 V の点（負荷）へ流れる電流 [A]（負は逆向き） */
  function _w02_br(E,R,V,k){
    if(k==="direct")return (E-V)/R;
    if(k==="ideal")return E-V>0?(E-V)/(R+0.05):0;
    var p=_w02_DI[k],nv=p.n*_w02_VT,Is=Math.exp(-p.vf1/nv);
    if(E-V<=0)return -p.ir;
    var lo=0,hi=(E-V)/R;
    for(var i=0;i<90;i++){var I=(lo+hi)/2,Vd=E-V-I*R,f=Is*(Math.exp(Math.min(Vd/nv,700))-1)-I;if(f>0)lo=I;else hi=I;}
    return (lo+hi)/2;}
  /* 負荷の電流 IL を流すときの負荷の電圧と、各電源の電流。aOn=false なら A を外した状態 */
  function _w02_solve(EA,RA,EB,RB,IL,k,aOn){
    var lo=0,hi=Math.max(EA,EB);
    for(var i=0;i<90;i++){var V=(lo+hi)/2,It=(aOn?_w02_br(EA,RA,V,k):0)+_w02_br(EB,RB,V,k);if(It>IL)lo=V;else hi=V;}
    var Vo=(lo+hi)/2;return {V:Vo,IA:aOn?_w02_br(EA,RA,Vo,k):0,IB:_w02_br(EB,RB,Vo,k)};}

  REG.w02_oring=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"OR","2 つの電源のつなぎ方 — どちらが流し、何が流れ込むか");
    var KN=["直接つなぐ（悪い例）","シリコンダイオード","ショットキーダイオード","理想ダイオード"],KK=["direct","si","sk","ideal"];
    var r0=U.ctrls(el);
    var kind=U.seg(r0,KN,2,draw);
    var r1=U.ctrls(el);
    var ea=U.slider(r1,"主な電源 A の電圧",{min:2,max:15,step:0.05,value:5.0,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var ra=U.slider(r1,"A の内部抵抗（ケーブルを含む）",{min:0.01,max:3,log:true,value:0.4,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var r2=U.ctrls(el);
    var eb=U.slider(r2,"予備の電池 B の電圧",{min:1,max:15,step:0.05,value:3.1,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var rb=U.slider(r2,"B の内部抵抗",{min:0.01,max:50,log:true,value:0.3,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var r3=U.ctrls(el);
    var il=U.slider(r3,"負荷の電流",{min:1,max:3000,log:true,value:300,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var vm=U.slider(r3,"負荷が動く最低の電圧（例）",{min:0.5,max:12,step:0.1,value:2.5,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(a,b,c,d,i,m){ea.set(a);ra.set(b);eb.set(c);rb.set(d);il.set(i);vm.set(m);draw();}
    U.button(br,"USB 5 V と単 3 形 2 本",function(){preset(5.0,0.4,3.1,0.3,300,2.5);});
    U.button(br,"USB 5 V と新しい単 3 形 3 本",function(){preset(5.0,0.4,4.8,0.45,300,3.4);});
    U.button(br,"3.3 V と新しいコイン電池",function(){preset(3.3,0.05,3.2,20,10,2.0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var k=KK[kind.get()],EA=ea.get(),RA=ra.get(),EB=eb.get(),RB=rb.get(),IL=il.get()*1e-3,Vm=vm.get();
      var on=_w02_solve(EA,RA,EB,RB,IL,k,true),off=_w02_solve(EA,RA,EB,RB,IL,k,false);
      var W=700,o=[],x0=86,wd=584,X=function(f){return x0+f*wd;};
      /* 3 つの区間: A あり → A を外す → A が戻る */
      var ph=[[0,0.36,on],[0.36,0.68,off],[0.68,1,on]];
      var vtop=Math.max(EA,EB,Vm)*1.1,pv=U.plot(x0,30,wd,110,[0,1],[0,vtop]);
      o.push(S.T(x0,20,"負荷の電圧","start",10,"signal",true));
      o.push(pv.axes({xt:[],yfmt:function(v){return U.sig(v,3);},yl:"電圧 [V]",ylOff:44}));
      o.push(pv.line([[0,Vm],[1,Vm]],"alias",1.2,"5 4"));o.push(S.T(X(1)-4,pv.Y(Vm)+13,"動く最低の電圧 "+Vm.toFixed(1)+" V","end",9.5,"alias"));
      ph.forEach(function(q){var v=q[2].V,bad=v<Vm;o.push(S.L(X(q[0]),pv.Y(v),X(q[1]),pv.Y(v),bad?"alias":"signal",2.4));
        o.push(S.T((X(q[0])+X(q[1]))/2,pv.Y(v)-6,U.sig(v,3)+" V","middle",10,bad?"alias":"signal",true));});
      for(var j=1;j<3;j++)o.push(S.L(X(ph[j][0]),26,X(ph[j][0]),290,"faint",1,"3 3"));
      [["A と B がある",0.18],["A を外した（停電・抜いた）",0.52],["A が戻った",0.84]].forEach(function(t){o.push(S.T(X(t[1]),14,t[0],"middle",9.5,"ink",true));});
      /* 電流 */
      var imax=Math.max(IL,Math.abs(on.IA),Math.abs(on.IB),Math.abs(off.IB))*1.15,pi=U.plot(x0,170,wd,110,[0,1],[-imax,imax]);
      o.push(S.T(x0,162,"各電源から負荷の側へ流れる電流（負は電源へ流れ込む向き）","start",10,"gold",true));
      o.push(pi.axes({xt:[],yt:U.nice(-imax,imax,4),yfmt:function(v){return v===0?"0":F.cur(v,2);},ylOff:62}));
      ph.forEach(function(q){var r=q[2];
        o.push(S.L(X(q[0]),pi.Y(r.IA),X(q[1]),pi.Y(r.IA),"gold",2.2));
        o.push(S.L(X(q[0]),pi.Y(r.IB),X(q[1]),pi.Y(r.IB),r.IB<0?"alias":"green",2.2,"6 3"));});
      o.push(S.L(x0,312,x0+24,312,"gold",2.2));o.push(S.T(x0+30,316,"A の電流","start",10,"muted"));
      o.push(S.L(x0+110,312,x0+134,312,"green",2.2,"6 3"));o.push(S.T(x0+140,316,"B の電流（赤は B へ流れ込む）","start",10,"muted"));
      box.set(S.svg(W,326,o));
      /* 読み出し */
      function loss(E,R,I){if(I<=0)return 0;if(k==="direct")return I*I*R;if(k==="ideal")return I*I*0.05;return (E-I*R-on.V)*I;}
      var share=on.IB>0?on.IB/IL:0,txt="";
      var bt;
      if(Math.abs(on.IB)<1e-12)bt="B から 0";
      else if(on.IB>0)bt="B から "+F.cur(on.IB)+"（負荷の電流の "+U.sig(share*100,3)+" %）";
      else if(-on.IB>1e-3)bt='<span class="warn">B へ '+F.cur(-on.IB)+" 流れ込む</span>";
      else bt="B から 0（B へは逆向きに "+F.cur(-on.IB)+"）";
      txt+="<b>A と B がある</b>: 負荷の電圧 <b>"+U.sig(on.V,4)+" V</b>、A から "+F.cur(on.IA)+"、"+bt+"<br>";
      if(k!=="direct")txt+="A の側の素子の電圧の低下 "+U.sig((EA-on.IA*RA-on.V)*1000,3)+" mV、熱 "+F.num(loss(EA,RA,on.IA)*1000,3)+" mW<br>";
      else txt+='直接つないだので、電流を制限するのは内部抵抗だけ: 負荷が無くても (E_A − E_B) ÷ (R_A + R_B) = <span class="warn">'+F.cur((EA-EB)/(RA+RB))+"</span><br>";
      txt+="<b>A を外したとき</b>: 負荷の電圧 <b>"+U.sig(off.V,4)+" V</b>"+(off.V<Vm?' <span class="warn">（動く最低の電圧を割る）</span>':' <span class="ok">（動く）</span>')+"、B から "+F.cur(off.IB)+"<br>";
      var msg;
      if(k==="direct")msg='<span class="warn">充電できない電池に電流を流し込むと、発熱・液漏れ・破裂のおそれがある。直接つないではいけない。</span>';
      else if(share>0.01)msg='<span class="warn">A があるのに、B が負荷の電流の '+U.sig(share*100,3)+' % を流し続けて減っていく。A の電圧を B の最も高い電圧より十分に高くする。</span>';
      else if(on.IB<0)msg='B へは逆向きに '+F.cur(-on.IB)+' だけ流れ込む（'+(k==="sk"?"ショットキーの逆向きのわずかな電流。温度が高いと増える":"シリコンの逆向きのわずかな電流")+'）。';
      else msg='<span class="ok">A があるときは、B はほとんど流さない。</span>';
      ro.innerHTML=txt+msg+'<div class="wnote">ダイオードは I = I_S × exp(V ÷ (n V_T))（シリコン n = 1.8・1 A で 0.85 V、ショットキー n = 1.05・1 A で 0.40 V、逆向きの電流はそれぞれ 10 nA と 10 µA）、理想ダイオードは順方向だけ 50 mΩ とした（どれも例の値）。切り替わりの間を出力のコンデンサが支えることと、理想ダイオードが切れるまでの短い逆向きの電流は入れていない。</div>';
    }
    draw();
  };

  /* ===== 03 章 電池を知る ===== */
  /* 電池の模型（1 セルあたり。代表的な形と例の値。fig/f03.py と同じ値）
     Qn: 公称容量 [mAh]、E: 休んでいるときの電圧の点 [x, V]（x は公称容量に対する放電の割合）、
     R: 25 °C の内部抵抗 R0 + R1 の点 [x, Ω]、k10: 10 °C 下がるごとの倍率、tau: R1 と C1 の時定数 [s]、
     sd: 1 年に減る割合（20 °C）、vend: メーカの終止電圧 [V]、N: 例の本数、T: 放電してよい温度、ic: 流し続ける電流の目安の上限 [A] */
  var _w03_B={
    alk:{nm:"アルカリ乾電池（単 3 形）",sh:"アルカリ",Qn:2000,c:"gold",
      E:[[0,1.58],[0.03,1.48],[0.2,1.36],[0.4,1.27],[0.6,1.19],[0.75,1.12],[0.85,1.06],[0.93,1.00],[0.97,0.95],[1.0,0.90]],
      R:[[0,0.15],[0.3,0.19],[0.5,0.26],[0.7,0.37],[0.85,0.48],[1.0,0.60]],k10:1.5,tau:0.010,sd:0.02,vend:0.9,N:2,T:[-20,50],ic:1.0},
    cr:{nm:"コイン形リチウム電池（CR2032）",sh:"CR2032",Qn:220,c:"signal",
      E:[[0,3.20],[0.02,3.05],[0.1,3.00],[0.3,2.96],[0.5,2.92],[0.7,2.87],[0.8,2.82],[0.88,2.74],[0.93,2.60],[0.97,2.40],[1.0,2.00]],
      R:[[0,15],[0.5,17],[0.7,20],[0.8,25],[0.9,40],[0.95,60],[1.0,120]],k10:1.4,tau:0.005,sd:0.01,vend:2.0,N:1,T:[-20,60],ic:0.003},
    soc:{nm:"塩化チオニルリチウム電池（単 3 形の大きさ）",sh:"塩化チオニルリチウム",Qn:2400,c:"purple",
      E:[[0,3.66],[0.02,3.62],[0.3,3.60],[0.6,3.58],[0.85,3.54],[0.92,3.48],[0.96,3.35],[0.985,3.00],[1.0,2.00]],
      R:[[0,4.0],[0.5,4.5],[0.8,6.0],[0.9,9.0],[0.96,15.0],[1.0,40.0]],k10:1.3,tau:0.010,sd:0.01,vend:2.0,N:1,T:[-55,85],ic:0.1},
    nimh:{nm:"ニッケル水素電池（単 3 形）",sh:"ニッケル水素",Qn:2000,c:"teal",
      E:[[0,1.40],[0.03,1.30],[0.15,1.26],[0.5,1.22],[0.75,1.19],[0.88,1.15],[0.95,1.10],[0.98,1.05],[1.0,1.00]],
      R:[[0,0.04],[0.5,0.045],[0.8,0.055],[0.9,0.07],[1.0,0.12]],k10:1.4,tau:0.010,sd:0.20,vend:1.0,N:3,T:[-20,50],ic:2.0},
    li:{nm:"リチウムイオン電池（1000 mAh）",sh:"リチウムイオン",Qn:1000,c:"green",
      E:[[0,4.18],[0.05,4.08],[0.15,3.98],[0.3,3.87],[0.5,3.76],[0.65,3.70],[0.8,3.60],[0.88,3.50],[0.93,3.38],[0.97,3.20],[1.0,3.00]],
      R:[[0,0.12],[0.5,0.12],[0.8,0.14],[0.9,0.17],[1.0,0.25]],k10:1.4,tau:0.010,sd:0.24,vend:3.0,N:1,T:[-20,60],ic:1.0}};
  var _w03_KEYS=["alk","cr","soc","nimh","li"],_w03_R0F=0.55;
  function _w03_ip(p,x){if(x<=p[0][0])return p[0][1];for(var i=1;i<p.length;i++)if(x<=p[i][0])return p[i-1][1]+(p[i][1]-p[i-1][1])*(x-p[i-1][0])/(p[i][0]-p[i-1][0]);return p[p.length-1][1];}
  function _w03_E(t,x){return _w03_ip(_w03_B[t].E,x);}
  function _w03_kT(t,T){return Math.pow(_w03_B[t].k10,(25-T)/10);}
  function _w03_R(t,x,T){return _w03_ip(_w03_B[t].R,x)*_w03_kT(t,T);}
  function _w03_reff(t,x,T,tp){return _w03_R(t,x,T)*(_w03_R0F+(1-_w03_R0F)*(1-Math.exp(-tp/_w03_B[t].tau)));}
  /* f(x) は x とともに減る。0 になる x（f(0) <= 0 なら 0、f(1) > 0 なら 1） */
  function _w03_cross(f){if(f(0)<=0)return 0;if(f(1)>0)return 1;var lo=0,hi=1;for(var i=0;i<50;i++){var m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}return (lo+hi)/2;}
  function _w03_pct(u){return (Math.round(u*1000)/10).toString()+" %";}
  function _w03_V(v,d){return v.toFixed(d==null?2:d)+" V";}

  /* ---- 3 節: 放電曲線と実効容量 ---- */
  REG.w03_discharge=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"DISCHARGE","放電曲線と実効容量 — 終止電圧・電流・温度");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",_w03_KEYS.map(function(k){return {v:k,t:_w03_B[k].nm};}),"alk",function(){Nn.set(_w03_B[bt.get()].N);draw();});
    var Nn=U.slider(r1,"直列の本数 N",{min:1,max:4,step:1,value:2,fmt:function(v){return v+" 本";},onInput:draw});
    var r2=U.ctrls(el);
    var Ic=U.slider(r2,"流し続ける電流 I",{min:0.01,max:3000,value:200,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Tc=U.slider(r2,"温度",{min:-40,max:60,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var r3=U.ctrls(el);
    var Vn=U.slider(r3,"機器が動く最低の電圧 V_need",{min:0.8,max:4.2,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var ldo=U.checkbox(r3,"LDO を通す",false,draw);
    var Vd=U.slider(r3,"ドロップアウト電圧 V_do",{min:0.05,max:0.5,step:0.05,value:0.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(k,n,i,T,vn,l){bt.set(k);Nn.set(n);Ic.set(i);Tc.set(T);Vn.set(vn);ldo.set(l);Vd.set(0.2);draw();}
    U.button(br,"2 節: アルカリ 3 本・LDO で 3.3 V",function(){preset("alk",3,0.01,25,3.3,true);});
    U.button(br,"2 節: CR2032 に直接・2.2 V",function(){preset("cr",1,0.01,25,2.2,false);});
    U.button(br,"3 節: アルカリ 1 本・1 A",function(){preset("alk",1,1000,25,0.9,false);});
    U.button(br,"3 節: アルカリ 1 本・200 mA・−20 °C",function(){preset("alk",1,200,-20,0.9,false);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var t=bt.get(),B=_w03_B[t],N=Nn.get(),I=Ic.get()*1e-3,T=Tc.get(),vn=Vn.get(),vdo=ldo.get()?Vd.get():0;
      Vd.el.style.display=ldo.get()?"":"none";
      var vNeed=vn+vdo,vCell=N*B.vend,vEnd=Math.max(vNeed,vCell),ve1=vEnd/N;
      var u0=_w03_cross(function(x){return _w03_E(t,x)-ve1;});
      var u=_w03_cross(function(x){return _w03_E(t,x)-I*_w03_R(t,x,T)-ve1;});
      var Qn=B.Qn,vmax=N*_w03_E(t,0),vlo=Math.min(vEnd,N*(_w03_E(t,1)-I*_w03_R(t,1,T)));
      var y0=Math.max(0,Math.floor((Math.min(vlo,vEnd)-0.15*N)*10)/10),y1=Math.ceil((vmax+0.05*N)*10)/10;
      var W=700,o=[],p=U.plot(80,22,470,230,[0,Qn],[y0,y1]);
      o.push(p.axes({xl:"取り出した電荷 [mAh]",yl:"電池全体の端子電圧 [V]",xt:U.nice(0,Qn,5),yt:U.nice(y0,y1,5),xfmt:function(v){return String(Math.round(v));},yfmt:function(v){return String(+v.toFixed(2));}}));
      var ref=[],cur=[];
      for(var k=0;k<=200;k++){var x=k/200;ref.push([x*Qn,N*_w03_E(t,x)]);var v=N*(_w03_E(t,x)-I*_w03_R(t,x,T));if(x<=u+1e-9&&v>=y0)cur.push([x*Qn,v]);}
      if(u>0)cur.push([u*Qn,vEnd]);
      o.push(p.line(ref,"muted",1.3,"3 3"));
      if(cur.length>1)o.push(p.line(cur,B.c,2.4));
      if(u>0)o.push(S.RECT(p.X(0),p.Y(y0)-7,p.X(u*Qn)-p.X(0),7,1,U.soft(B.c),B.c,1));
      o.push(p.line([[0,vEnd],[Qn,vEnd]],"alias",1.4,"6 4"));
      o.push(S.T(p.X(Qn)-4,p.Y(vEnd)-6,"終止電圧 "+vEnd.toFixed(2)+" V","end",10,"alias",true,false,null,true));
      if(u>0)o.push(S.D(p.X(u*Qn),p.Y(vEnd),B.c,5));
      o.push(S.T(p.X(Qn*0.02),p.Y(y1)+14,"点線: 小さな電流・25 °C","start",9.5,"muted",false,false,null,true));
      /* 右: 割合の棒 */
      var bx=580,bw=100;
      o.push(S.T(bx,34,"実効容量","start",10.5,"ink",true));
      [[u0,"小さな電流・25 °C","muted"],[u,"この電流・温度",B.c]].forEach(function(r,i){var y=50+i*58;
        o.push(S.T(bx,y+10,r[1],"start",9.5,"muted"));
        o.push(S.RECT(bx,y+16,bw,14,2,"none","muted",1,"3 3"));
        o.push(S.RECT(bx,y+16,bw*r[0],14,2,U.soft(r[2]),r[2],1.2));
        o.push(S.T(bx,y+46,Math.round(r[0]*Qn)+" mAh（"+_w03_pct(r[0])+"）","start",10,r[2],true));});
      box.set(S.svg(W,300,o));
      var warn="";
      if(T<B.T[0]||T>B.T[1])warn+='<span class="warn">'+String(T).replace("-","−")+' °C は、この種類の放電してよい温度の範囲（代表値 '+String(B.T[0]).replace("-","−")+'〜'+B.T[1]+' °C）の外である。</span><br>';
      if(I>B.ic)warn+='<span class="warn">'+F.cur(I)+' は、この種類が流し続けられる電流の目安（代表値 '+F.cur(B.ic)+' 程度）を超える。仕様書で確かめる。</span><br>';
      if(u===0)warn+='<span class="warn">流し始めから端子電圧が終止電圧を下回り、使える電荷は 0 である。</span><br>';
      var tl=u>0?u*Qn*1e-3/I*3600:0;
      ro.innerHTML=warn+"C レート = I ÷ 公称容量 = "+F.cur(I)+" ÷ "+Qn+" mAh = <b>"+U.sig(I*1e3/Qn,3)+"C</b><br>"+
        "終止電圧 V_end = max(V_need + V_do, N V_cell) = max("+vNeed.toFixed(2)+", "+N+" × "+B.vend.toFixed(1)+") = <b>"+vEnd.toFixed(2)+" V</b>（1 本あたり "+ve1.toFixed(3)+" V）<br>"+
        "実効容量 = <b>"+Math.round(u*Qn)+" mAh</b>（公称容量の "+_w03_pct(u)+"）。小さな電流・25 °C なら "+Math.round(u0*Qn)+" mAh（"+_w03_pct(u0)+"）<br>"+
        "内部抵抗（1 本、新しいとき → 終わり）: "+U.sig(_w03_R(t,0,T),3)+" Ω → "+U.sig(_w03_R(t,1,T),3)+" Ω（25 °C の "+U.sig(_w03_kT(t,T),3)+" 倍）<br>"+
        "この電流で使い切るまで: 実効容量 ÷ I = "+(u>0?"<b>"+F.time(tl)+"</b>":"—")+
        '<div class="wnote">模型は、代表的な形の放電曲線と、内部抵抗（10 °C 下がるごとに '+B.k10+' 倍とした）だけを入れたもの。実際の電池は、大きな電流と低温で、これよりさらに減ることがある。値はすべて例で、設計にはデータシートの放電曲線を使う。</div>';
    }
    draw();
  };

  /* ---- 4 節: パルスの電圧降下と BOR ---- */
  REG.w03_pulse=function(el,U){
    var S=U.S,F=U.fmt;
    var PT=[{v:"cr",t:"CR2032 1 個"},{v:"soc",t:"塩化チオニルリチウム電池 1 本"},{v:"alk",t:"アルカリ乾電池 2 本"},{v:"li",t:"リチウムイオン電池 1 本"}];
    var NB={cr:1,soc:1,alk:2,li:1};
    U.head(el,"PULSE","パルスの電圧降下と BOR — 放電の進み具合と温度");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",PT,"cr",draw);
    var Bor=U.slider(r1,"BOR のしきい値",{min:1.6,max:3.6,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var r2=U.ctrls(el);
    var Ip=U.slider(r2,"パルスの電流 I_pk",{min:1,max:1000,value:15,log:true,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Tp=U.slider(r2,"パルスの長さ t_p",{min:0.1,max:100,value:3,log:true,fmt:function(v){return F.time(v*1e-3);},onInput:draw});
    var r3=U.ctrls(el);
    var Xd=U.slider(r3,"放電の進み具合",{min:0,max:100,step:1,value:50,fmt:function(v){return v+" %";},onInput:draw});
    var Tc=U.slider(r3,"温度",{min:-40,max:60,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var br=U.btnrow(el);
    function preset(k,i,tp,x,T,b){bt.set(k);Ip.set(i);Tp.set(tp);Xd.set(x);Tc.set(T);Bor.set(b);draw();}
    U.button(br,"4 節の例（CR2032・15 mA・3 ms）",function(){preset("cr",15,3,50,25,2.2);});
    U.button(br,"順に動かす（10 mA）",function(){Ip.set(10);draw();});
    U.button(br,"−20 °C にする",function(){Tc.set(-20);draw();});
    U.button(br,"放電の 9 割",function(){Xd.set(90);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var t=bt.get(),B=_w03_B[t],N=NB[t],I=Ip.get()*1e-3,tp=Tp.get()*1e-3,x=Xd.get()/100,T=Tc.get(),vb=Bor.get();
      var Rt=N*_w03_R(t,x,T),R0=_w03_R0F*Rt,R1=Rt-R0,tau=B.tau,E=N*_w03_E(t,x);
      var Reff=R0+R1*(1-Math.exp(-tp/tau)),dV=I*Reff,vbot=E-dV,over=vbot<0.3*E;
      if(over)vbot=Math.max(vbot,0);
      var W=700,o=[];
      /* 上: 1 回のパルスの波形 */
      var span=tp+4*tau,t0=-0.2*span,X0=80,WD=450,sc=WD/(span-t0),X=function(s){return X0+(s-t0)*sc;};
      var yI=24,hI=34,yV=86,hV=120;
      var vlo=Math.min(vbot,vb)-0.1*Math.max(0.2,E-Math.min(vbot,vb)),vhi=E+0.08*Math.max(0.2,E-Math.min(vbot,vb));
      var Y=function(v){return yV+hV-(Math.max(v,vlo)-vlo)/(vhi-vlo)*hV;};
      o.push(S.T(X0-8,yI+hI/2+4,"電流","end",9.5,"muted"));
      o.push(S.W([X(t0),yI+hI,X(0),yI+hI,X(0),yI,X(tp),yI,X(tp),yI+hI,X(span),yI+hI],"gold",2));
      o.push(S.T(X(tp)+6,yI+12,F.cur(I),"start",9.5,"gold",true));
      var pts=[[X(t0),Y(E)],[X(0),Y(E)],[X(0),Y(E-I*R0)]];
      for(var k=1;k<=60;k++){var s=tp*k/60;pts.push([X(s),Y(E-I*R0-I*R1*(1-Math.exp(-s/tau)))]);}
      var v1=I*R1*(1-Math.exp(-tp/tau));pts.push([X(tp),Y(E-v1)]);
      for(k=1;k<=60;k++){var s2=tp+(span-tp)*k/60;pts.push([X(s2),Y(E-v1*Math.exp(-(s2-tp)/tau))]);}
      o.push(S.L(X0,yV+hV,X0+WD,yV+hV,"muted",1));o.push(S.L(X0,yV,X0,yV+hV,"muted",1));
      U.nice(vlo,vhi,4).forEach(function(v){if(v>=vlo&&v<=vhi){o.push(S.L(X0-4,Y(v),X0,Y(v),"muted",1));o.push(S.T(X0-7,Y(v)+3.5,String(+v.toFixed(3)),"end",9,"muted"));}});
      o.push(S.T(X0-50,yV+hV/2,"端子電圧 [V]","middle",9.5,"muted",false,false,-90));
      o.push(S.L(X0,Y(vb),X0+WD,Y(vb),"alias",1.3,"6 4"));
      o.push(S.T(X0+WD-2,Y(vb)-5,"BOR "+vb.toFixed(2)+" V","end",9.5,"alias",true,false,null,true));
      o.push(S.PL(pts,vbot<vb?"alias":B.c,2));
      o.push(S.D(X(tp),Y(vbot),vbot<vb?"alias":B.c,4));
      o.push(S.T(X(tp)+6,Y(vbot)+(vbot<vb?-6:14),"底 "+vbot.toFixed(3)+" V","start",9.5,vbot<vb?"alias":B.c,true,false,null,true));
      U.nice(t0,span,5).forEach(function(s){if(s>=t0&&s<=span){o.push(S.L(X(s),yV+hV,X(s),yV+hV+4,"muted",1));o.push(S.T(X(s),yV+hV+15,U.sig(s*1e3,3),"middle",9,"muted"));}});
      o.push(S.T(X0+WD/2,yV+hV+30,"時間 [ms]（パルスの始まりを 0 とした）","middle",9.5,"muted"));
      /* 右上: 数値 */
      var xr=560;
      [["E（休んでいるとき）",E.toFixed(3)+" V"],["R₀ / R₁",U.sig(R0,3)+" / "+U.sig(R1,3)+" Ω"],["τ",F.time(tau)],["R_eff",U.sig(Reff,3)+" Ω"],["電圧降下",U.sig(dV*1e3,3)+" mV"]].forEach(function(r,i){
        o.push(S.T(xr,yV+6+i*24,r[0],"start",9.5,"muted"));o.push(S.T(xr,yV+18+i*24,r[1],"start",10,"ink",true));});
      /* 下: 放電の進み具合とパルスの底 */
      var yP=262,p=U.plot(80,yP,450,150,[0,100],[Math.max(0,Math.min(N*B.vend,vb)-0.2),N*_w03_E(t,0)+0.05*N]);
      var plo=p.yr[0],phi=p.yr[1];
      o.push(p.axes({xl:"放電の進み具合（公称容量の %）",yl:"端子電圧 [V]",xt:[0,25,50,75,100],yt:U.nice(plo,phi,4),xfmt:function(v){return String(v);},yfmt:function(v){return String(+v.toFixed(2));}}));
      var pe=[],pb=[];
      for(k=0;k<=200;k++){var xx=k/200,ee=N*_w03_E(t,xx),bb=ee-I*N*_w03_reff(t,xx,T,tp);pe.push([xx*100,ee]);if(bb>=plo)pb.push([xx*100,bb]);}
      o.push(p.line(pe,"ink",1.6));
      if(pb.length>1)o.push(p.line(pb,B.c,2.2));
      if(vb>=plo&&vb<=phi){o.push(p.line([[0,vb],[100,vb]],"alias",1.3,"6 4"));}
      var ur=_w03_cross(function(z){return N*_w03_E(t,z)-vb;}),up=_w03_cross(function(z){return N*(_w03_E(t,z)-I*_w03_reff(t,z,T,tp))-vb;});
      if(up>0&&up<1&&vb>=plo)o.push(S.D(p.X(up*100),p.Y(vb),"alias",4.5));
      if(vbot>=plo)o.push(S.D(p.X(x*100),p.Y(vbot),vbot<vb?"alias":B.c,4.5));
      o.push(S.T(p.X(2),p.Y(phi)+12,"黒: 休んでいるときの電圧、色: パルスの底","start",9.5,"muted",false,false,null,true));
      o.push(S.T(560,yP+20,"パルスのある機器が","start",9.5,"muted"));
      o.push(S.T(560,yP+34,"使える割合","start",9.5,"muted"));
      o.push(S.T(560,yP+56,_w03_pct(up),"start",14,up<ur-0.05?"alias":"green",true));
      o.push(S.T(560,yP+80,"休んでいるときの電圧","start",9.5,"muted"));
      o.push(S.T(560,yP+94,"だけなら "+_w03_pct(ur),"start",9.5,"muted"));
      box.set(S.svg(W,yP+192,o));
      var warn="";
      if(T<B.T[0]||T>B.T[1])warn+='<span class="warn">'+String(T).replace("-","−")+' °C は、この種類の放電してよい温度の範囲（代表値）の外である。</span><br>';
      if(over)warn+='<span class="warn">電圧降下が起電力の 7 割を超える。この電池から、この電流は実際には流せない（模型の範囲の外。底は 0 V 以上で描いた）。</span><br>';
      ro.innerHTML=warn+"R_eff = R₀ + R₁ (1 − e^(−t_p/τ)) = "+U.sig(R0,3)+" + "+U.sig(R1,3)+" × "+U.sig(1-Math.exp(-tp/tau),3)+" = <b>"+U.sig(Reff,3)+" Ω</b>（電池全体。25 °C の "+U.sig(_w03_kT(t,T),3)+" 倍）<br>"+
        "パルスの底 = E − I_pk R_eff = "+E.toFixed(3)+" V − "+F.cur(I)+" × "+U.sig(Reff,3)+" Ω = <b>"+(E-dV).toFixed(3).replace("-","−")+" V</b> → "+
        (vbot<vb?'<span class="warn">BOR を割る'+(over?'':'（'+U.sig((vb-vbot)*1e3,3)+' mV 足りない）')+'。マイコンはリセットされる</span>':'<span class="ok">BOR を割らない（余裕 '+U.sig((vbot-vb)*1e3,3)+' mV）</span>')+"<br>"+
        "パルスの底で決まる使える割合 <b>"+_w03_pct(up)+"</b>（休んでいるときの電圧だけなら "+_w03_pct(ur)+"）"+
        '<div class="wnote">内部抵抗を、すぐ現れる部分 R₀（55 %）と、時定数 τ で大きくなる部分 R₁（45 %）に分けた模型（4 節）。放電の進み具合と温度による変わり方は代表的な形、値はすべて例。パルスの前は十分に休んでいたとした。</div>';
    }
    draw();
  };

  /* ---- 5 節: 容量の内訳と電池寿命 ---- */
  REG.w03_life=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BUDGET","容量の内訳と電池寿命 — 実効容量・保管・自己放電");
    var r1=U.ctrls(el);
    var bt=U.select(r1,"電池",_w03_KEYS.map(function(k){return {v:k,t:_w03_B[k].nm};}),"cr",function(){var B=_w03_B[bt.get()];Qs.set(B.Qn);Sd.set(B.sd*100);draw();});
    var Qs=U.slider(r1,"公称容量",{min:50,max:5000,value:220,log:true,int:true,fmt:function(v){return v+" mAh";},onInput:draw});
    var Sd=U.slider(r1,"自己放電（20 °C、1 年）",{min:0.2,max:40,value:1,log:true,fmt:function(v){return U.sig(v,2)+" %";},onInput:draw});
    var r2=U.ctrls(el);
    var Uf=U.slider(r2,"使える割合（2〜4 節）",{min:30,max:100,step:1,value:85,fmt:function(v){return v+" %";},onInput:draw});
    var Ia=U.slider(r2,"機器の平均電流",{min:0.5,max:1000,value:2.7,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var Tm=U.slider(r3,"使う場所の平均の温度",{min:-20,max:50,step:1,value:20,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var Tw=U.slider(r3,"温度の変化の幅 ±",{min:0,max:30,step:1,value:0,fmt:function(v){return "± "+v+" °C";},onInput:draw});
    var r4=U.ctrls(el);
    var Sm=U.slider(r4,"出荷までの保管",{min:0,max:24,step:1,value:6,fmt:function(v){return v+" か月";},onInput:draw});
    var St=U.slider(r4,"保管の温度",{min:0,max:50,step:1,value:20,fmt:function(v){return v+" °C";},onInput:draw});
    var r5=U.ctrls(el);
    var On=U.checkbox(r5,"保管の間も機器の電流を流す（絶縁のシート・出荷モードなし）",false,draw);
    var Is=U.slider(r5,"保管の間の機器の電流",{min:0.1,max:100,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var br=U.btnrow(el);
    function preset(k,u,ia,tm,tw,sm,st,on){bt.set(k);var B=_w03_B[k];Qs.set(B.Qn);Sd.set(B.sd*100);Uf.set(u);Ia.set(ia);Tm.set(tm);Tw.set(tw);Sm.set(sm);St.set(st);On.set(on);Is.set(2);draw();}
    U.button(br,"5 節の例（CR2032・ドアの開閉センサ）",function(){preset("cr",85,2.7,20,0,6,20,false);});
    U.button(br,"同じ例で、保管の間も電流を流す",function(){preset("cr",85,2.7,20,0,6,20,true);});
    U.button(br,"塩化チオニルリチウム・屋外（20 ± 20 °C）",function(){preset("soc",95,10,20,20,12,30,false);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function fT(T){return Math.pow(2,(T-20)/10);}
    function draw(){
      Is.el.style.display=On.get()?"":"none";
      var Qn=Qs.get(),r20=Sd.get()/100,u=Uf.get()/100,ia=Ia.get()*1e-3,tm=Tm.get(),tw=Tw.get(),sm=Sm.get(),st=St.get(),on=On.get(),is=Is.get()*1e-3;
      var H=8760,fUse=(fT(tm+tw)+fT(tm-tw))/2,fAvg=fT(tm);
      var q1=u*Qn,lossSd=r20*fT(st)*Qn*sm/12,lossDev=on?is*H*sm/12:0,q2=Math.max(0,q1-lossSd-lossDev);
      var isd=r20*fUse*Qn/H,itot=ia+isd,life=q2/itot/H,life0=q2/ia/H,lifeAvgT=q2/(ia+r20*fAvg*Qn/H)/H;
      var W=700,o=[],x0=200,sc=420/Qn;
      o.push(S.T(14,18,"容量の内訳 [mAh]","start",10.5,"ink",true));
      var rows=[["公称容量",0,Qn,"gold",Math.round(Qn)+""],
        ["使えない分（2〜4 節）",q1,Qn,"alias","− "+U.sig(Qn-q1,3)],
        ["保管の自己放電",q1-lossSd,q1,"alias","− "+U.sig(lossSd,3)]];
      if(on)rows.push(["保管の間の機器の電流",q1-lossSd-lossDev,q1-lossSd,"alias","− "+U.sig(lossDev,3)]);
      rows.push(["使い始めに残る電荷",0,q2,"signal",U.sig(q2,4)]);
      rows.forEach(function(r,i){var y=28+i*26,a=Math.max(0,r[1]),b=Math.max(a,r[2]),wd=(b-a)*sc;
        o.push(S.T(x0-8,y+13,r[0],"end",9.5,"ink"));
        o.push(S.RECT(x0+a*sc,y+2,Math.max(0.8,wd),16,2,U.soft(r[3]),r[3],1.1));
        /* 数値: 棒が広ければ中に、右に余白があれば右に、なければ左に置く */
        var tx,anc;if(wd>70){tx=x0+a*sc+6;anc="start";}else if(x0+b*sc+60<W-10){tx=x0+b*sc+6;anc="start";}else{tx=x0+a*sc-6;anc="end";}
        o.push(S.T(tx,y+14,r[4],anc,9.5,r[3],true,false,null,true));});
      /* 残りの電荷の時間変化 */
      var yP=28+rows.length*26+26,ymax=Math.max(life,life0);
      var tmax=Math.max(1,Math.min(60,ymax*1.15)),p=U.plot(80,yP,470,150,[0,tmax],[0,Math.max(1,q2)*1.05]);
      o.push(p.axes({xl:"使い始めからの年数",yl:"残る電荷 [mAh]",xt:U.nice(0,tmax,6),yt:U.nice(0,Math.max(1,q2)*1.05,4),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);}}));
      o.push(p.line([[0,q2],[Math.min(tmax,life0),Math.max(0,q2-ia*H*Math.min(tmax,life0))]],"muted",1.4,"5 3"));
      o.push(p.line([[0,q2],[Math.min(tmax,life),Math.max(0,q2-itot*H*Math.min(tmax,life))]],"signal",2.4));
      if(life<=tmax){o.push(S.D(p.X(life),p.Y(0),"signal",5));o.push(S.T(p.X(life),p.Y(0)-10,U.sig(life,3)+" 年","middle",10,"signal",true,false,null,true));}
      if(life0<=tmax){o.push(S.D(p.X(life0),p.Y(0),"muted",4));o.push(S.T(p.X(life0)+(life0-life<tmax*0.12?8:0),p.Y(0)-24,U.sig(life0,3)+" 年","middle",9.5,"muted",false,false,null,true));}
      o.push(S.T(570,yP+20,"実線: 機器 + 自己放電","start",9.5,"signal",true));
      o.push(S.T(570,yP+36,"破線: 機器の電流だけ","start",9.5,"muted"));
      box.set(S.svg(W,yP+190,o));
      var warn=q2<=0?'<span class="warn">使い始める前に、使える電荷がなくなる。</span><br>':"";
      ro.innerHTML=warn+"使い始めに残る電荷 = 公称 "+Math.round(Qn)+" × "+Math.round(u*100)+" % − 保管の自己放電 "+U.sig(lossSd,3)+(on?" − 保管の間の機器の電流 "+U.sig(lossDev,3):"")+" = <b>"+U.sig(q2,4)+" mAh</b><br>"+
        "自己放電の倍率 = (2^((T₁ − 20)/10) + 2^((T₂ − 20)/10)) ÷ 2 = <b>"+U.sig(fUse,3)+"</b>（平均の温度 "+String(tm).replace("-","−")+" °C だけで計算すると "+U.sig(fAvg,3)+"）<br>"+
        "I_sd = r Q_n ÷ 8760 h = "+U.sig(r20*100,2)+" % × "+U.sig(fUse,3)+" × "+Math.round(Qn)+" mAh ÷ 8760 h = <b>"+F.cur(isd*1e-3)+"</b>（機器の平均電流 "+F.cur(ia*1e-3)+" の "+U.sig(isd/ia*100,3)+" %）<br>"+
        "電池寿命 = "+U.sig(q2,4)+" mAh ÷ ("+F.cur(ia*1e-3)+" + "+F.cur(isd*1e-3)+") ≈ <b>"+(q2>0?U.sig(life,3)+" 年":"—")+"</b>（自己放電を入れないと "+U.sig(life0,3)+" 年、平均の温度だけで計算すると "+U.sig(lifeAvgT,3)+" 年）"+
        '<div class="wnote">自己放電は、公称容量に対して 1 年に決まった割合が減るとし、温度が 10 °C 上がるごとに 2 倍とする目安で温度を入れた（使う場所の温度は、半分の時間が T₁ = 平均 + 幅、残りが T₂ = 平均 − 幅とした）。値はすべて例。</div>';
    }
    draw();
  };

  /* ===== 04 章 電池で動かす制御 ===== */
  /* 電池（E, R_in）＋コンデンサ（C, ESR）に、区分的に一定の電流 1 A を時刻 0 から流したときの端子電圧の低下 [V] */
  function _w04_r(t,Rin,C,Re){if(t<0)return 0;if(!(C>0))return Rin;var Rp=Rin*Re/(Rin+Re),tau=C*(Rin+Re);return Rin-(Rin-Rp)*Math.exp(-t/tau);}
  /* pulses = [[始まり s, 長さ s, 電流 A], ...] のときの端子電圧（重ね合わせ） */
  function _w04_v(t,E,Rin,C,Re,ps){var d=0;ps.forEach(function(p){d+=p[2]*(_w04_r(t-p[0],Rin,C,Re)-_w04_r(t-p[0]-p[1],Rin,C,Re));});return E-d;}
  /* 3 節の例の模型（03 章 4 節の CR2032 の模型と同じ代表的な形と例の値。実際の電池の値ではない）: 公称容量に対して使った割合 s、温度 T [°C] */
  var _w04_CRE=[[0,3.20],[0.02,3.05],[0.1,3.00],[0.3,2.96],[0.5,2.92],[0.7,2.87],[0.8,2.82],[0.88,2.74],[0.93,2.60],[0.97,2.40],[1.0,2.00]];
  var _w04_CRR=[[0,15],[0.5,17],[0.7,20],[0.8,25],[0.9,40],[0.95,60],[1.0,120]];
  function _w04_ip(pts,x){if(x<=pts[0][0])return pts[0][1];for(var i=0;i+1<pts.length;i++){if(x<=pts[i+1][0])return pts[i][1]+(pts[i+1][1]-pts[i][1])*(x-pts[i][0])/(pts[i+1][0]-pts[i][0]);}return pts[pts.length-1][1];}
  function _w04_ocv(s){return _w04_ip(_w04_CRE,s);}
  function _w04_rin(s,T){return _w04_ip(_w04_CRR,s)*Math.pow(1.4,(25-T)/10);}
  function _w04_vop(s,T){var R=_w04_rin(s,T);return _w04_ocv(s)-15e-3*_w04_r(3e-3,R,100e-6,0.5);}
  var _w04_LIFE_D=0.220*3600/3e-6/86400;            /* 平均 3 µA で 220 mAh を使い切る日数 */
  /* 03 章の例のリチウムイオン電池の起電力の表（残量 % → V） */
  var _w04_LI=[[0,3.00],[3,3.20],[7,3.38],[12,3.50],[20,3.60],[35,3.70],[50,3.76],[70,3.87],[85,3.98],[95,4.08],[100,4.18]];
  function _w04_tab(tab,p){for(var i=0;i+1<tab.length;i++){var a=tab[i],b=tab[i+1];if(p>=a[0]&&p<=b[0])return a[1]+(b[1]-a[1])*(p-a[0])/(b[0]-a[0]);}return p>tab[tab.length-1][0]?tab[tab.length-1][1]:tab[0][1];}
  function _w04_inv(tab,v){for(var i=0;i+1<tab.length;i++){var a=tab[i],b=tab[i+1];if(v>=a[1]&&v<=b[1])return a[0]+(b[0]-a[0])*(v-a[1])/(b[1]-a[1]);}return v>tab[tab.length-1][1]?tab[tab.length-1][0]:tab[0][0];}
  /* コイン形の模型の、休んでいるときの電圧の表（残量 % は 220 mAh に対して） */
  var _w04_COIN=(function(){var t=[];for(var r=0;r<=100;r+=1)t.push([r,_w04_ocv(1-r/100)]);return t;})();
  function _w04_wide(box){var w=box.el.clientWidth;return !(w>0&&w<520);}

  /* ---- 1・2 節: 大容量コンデンサと動作の並べ方 ---- */
  REG.w04_bulk=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BULK CAPACITOR","電池と大容量コンデンサ、2 つの動作の並べ方と端子電圧");
    var r1=U.ctrls(el);
    var cE=U.slider(r1,"電池の起電力 E",{min:2.0,max:3.3,step:0.05,value:2.8,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var cR=U.slider(r1,"内部抵抗 R_in",{min:1,max:1000,value:100,log:true,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var cVm=U.slider(r1,"最低の電圧 V_min",{min:1.6,max:3.0,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var r2=U.ctrls(el);
    var cC=U.slider(r2,"コンデンサの容量 C",{values:[0,10,22,47,100,220,470,1000,2200,4700,10000,47000,100000],value:100,
      fmt:function(v){return v===0?"なし":(v>=1000?U.sig(v/1000,3)+" mF":v+" µF");},onInput:draw});
    var cRe=U.slider(r2,"ESR",{min:0.005,max:100,value:0.5,log:true,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var r3=U.ctrls(el);
    var cIa=U.slider(r3,"送信の電流",{min:1,max:100,value:15,log:true,fmt:function(v){return U.sig(v,3)+" mA";},onInput:draw});
    var cTa=U.slider(r3,"送信の長さ",{min:0.1,max:100,value:3,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var r4=U.ctrls(el);
    var cIb=U.slider(r4,"LED の電流",{min:0,max:50,step:0.5,value:5,fmt:function(v){return v===0?"0（LED なし）":v+" mA";},onInput:draw});
    var cTb=U.slider(r4,"LED の長さ",{min:1,max:500,value:20,log:true,fmt:function(v){return U.sig(v,3)+" ms";},onInput:draw});
    var r5=U.ctrls(el);
    var cM=U.select(r5,"並べ方",["送信だけ","LED の途中（点けてから 85 % の時点）で送信","LED と送信を同時に始める","LED を消した直後に送信","LED を消してから間を空けて送信"],4,draw);
    var cG=U.slider(r5,"間隔 t_gap",{min:0,max:100,step:1,value:25,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.btnrow(el);
    function preset(m,g){cE.set(2.8);cR.set(100);cVm.set(2.2);cC.set(100);cRe.set(0.5);cIa.set(15);cTa.set(3);cIb.set(5);cTb.set(20);cM.set(m);cG.set(g);draw();}
    U.button(br,"2 節の例 (a) LED の途中で送信",function(){preset(1,25);});
    U.button(br,"(b) 直後に送信",function(){preset(3,25);});
    U.button(br,"(c) 25 ms 空ける",function(){preset(4,25);});
    U.button(br,"コンデンサなし",function(){cC.set(0);draw();});
    U.button(br,"ESR の大きい小形の電気二重層（47 mF・30 Ω）",function(){cC.set(47000);cRe.set(30);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var E=cE.get(),R=cR.get(),Vm=cVm.get(),C=cC.get()*1e-6,Re=cRe.get(),Ia=cIa.get()*1e-3,ta=cTa.get()*1e-3,Ib=cIb.get()*1e-3,tb=cTb.get()*1e-3,m=cM.get(),g=cG.get()*1e-3;
      cG.el.style.display=m===4?"":"none";
      var led=Ib>0&&m>0,ps=[],t0=2e-3,txs;
      if(!led)txs=t0;else if(m===1)txs=t0+0.85*tb;else if(m===2)txs=t0;else if(m===3)txs=t0+tb;else txs=t0+tb+g;
      if(led)ps.push([t0,tb,Ib]);
      ps.push([txs,ta,Ia]);
      var tau=C>0?C*(R+Re):0,tend=0;ps.forEach(function(p){tend=Math.max(tend,p[0]+p[1]);});
      var span=Math.min(1.0,Math.max(tend+5*tau,tend+0.01,0.02)),cut=tend+5*tau>span;
      /* 標本: 細かい格子と、各パルスの端の前後 */
      var ts=[],NS=600;for(var k=0;k<=NS;k++)ts.push(k/NS*span);
      ps.forEach(function(p){[p[0],p[0]+p[1]].forEach(function(e){ts.push(Math.max(0,e-1e-9));ts.push(e+1e-9);});});
      ts.sort(function(a,b){return a-b;});
      var Iload=function(t){var s=0;ps.forEach(function(p){if(t>=p[0]&&t<p[0]+p[1])s+=p[2];});return s;};
      var V=ts.map(function(t){return _w04_v(t,E,R,C,Re,ps);}),ib=V.map(function(v){return (E-v)/R;}),il=ts.map(Iload),ic=il.map(function(x,i){return x-ib[i];});
      var vmin=Infinity,tmin=0;V.forEach(function(v,i){if(v<vmin){vmin=v;tmin=ts[i];}});
      var ibmax=Math.max.apply(null,ib),ilmax=Math.max.apply(null,il),icmin=Math.min(0,Math.min.apply(null,ic));
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?70:56,wd=W-x0-24,o=[];
      var X=function(t){return x0+t/span*wd;};
      var yI=24,hI=wide?100:90,Imax=Math.max(ilmax,ibmax)*1.15*1e3,Imin=icmin*1.15*1e3;
      var YI=function(i){return yI+hI-(i*1e3-Imin)/(Imax-Imin)*hI;};
      o.push(S.T(10,14,"電流","start",10.5,"ink",true));
      o.push(S.W([x0,yI,x0,yI+hI,x0+wd,yI+hI],"muted",1.1));
      U.nice(Imin,Imax,4).forEach(function(v){if(v>=Imin-1e-9&&v<=Imax+1e-9){var yy=YI(v*1e-3);o.push(S.L(x0,yy,x0+wd,yy,"grid",1));o.push(S.T(x0-6,yy+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-36,yI+hI/2,"mA","middle",9.5,"muted",false,false,-90));
      if(Imin<0)o.push(S.L(x0,YI(0),x0+wd,YI(0),"muted",1));
      function pl(arr,c,lw,dash){return S.PL(ts.map(function(t,i){return [X(t),YI(arr[i])];}),c,lw,null,dash);}
      o.push(pl(il,"purple",1.4,"5 3"));o.push(pl(ic,"signal",1.6));o.push(pl(ib,"gold",2.2));
      var lg=[["purple","負荷の電流"],["gold","電池の電流"],["signal","コンデンサの電流"]],lx=x0+wd;
      lg.slice().reverse().forEach(function(q){var w=U.tw(q[1],9.5)+18;lx-=w;o.push(S.RECT(lx,8,10,10,2,U.soft(q[0]),q[0],1.1));o.push(S.T(lx+14,17,q[1],"start",9.5,q[0],true));});
      /* 端子電圧 */
      var yV=yI+hI+40,hV=wide?120:110,vlo=Math.min(Vm,vmin)-0.15,vhi=E+0.1;vlo=Math.max(0,Math.floor(vlo*10)/10);
      var YV=function(v){return yV+hV-(v-vlo)/(vhi-vlo)*hV;};
      o.push(S.T(10,yV-8,"端子電圧","start",10.5,"ink",true));
      o.push(S.W([x0,yV,x0,yV+hV,x0+wd,yV+hV],"muted",1.1));
      U.nice(vlo,vhi,4).forEach(function(v){if(v>=vlo-1e-9&&v<=vhi+1e-9){o.push(S.L(x0,YV(v),x0+wd,YV(v),"grid",1));o.push(S.T(x0-6,YV(v)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-34,yV+hV/2+4,"V","middle",9.5,"muted"));
      o.push(S.L(x0,YV(Vm),x0+wd,YV(Vm),"alias",1.2,"5 3"));
      o.push(S.T(x0+wd-2,YV(Vm)+12,"V_min "+Vm.toFixed(2)+" V","end",9,"alias",false,false,null,true));
      o.push(S.PL(ts.map(function(t,i){return [X(t),YV(Math.max(vlo,V[i]))];}),"gold",2.2));
      var bad=vmin<Vm;
      o.push(S.D(X(tmin),YV(Math.max(vlo,vmin)),bad?"alias":"green",4.5));
      var lab="最低 "+vmin.toFixed(3)+" V",rt=X(tmin)>x0+wd*0.6;
      o.push(S.T(X(tmin)+(rt?-8:8),YV(Math.max(vlo,vmin))+(YV(Math.max(vlo,vmin))>yV+hV-20?-8:16),lab,rt?"end":"start",9.5,bad?"alias":"green",true,false,null,true));
      /* 時間軸と動作の帯 */
      var ya=yV+hV;U.nice(0,span*1e3,wide?8:5).forEach(function(v){if(v*1e-3<=span+1e-12){o.push(S.L(X(v*1e-3),ya,X(v*1e-3),ya+4,"muted",1));o.push(S.T(X(v*1e-3),ya+15,U.sig(v,4),"middle",9,"muted"));}});
      o.push(S.T(x0+wd,ya+28,"時間 [ms]"+(cut?"（回復はこの範囲の外まで続く）":""),"end",9,"muted"));
      var yb=ya+38;
      ps.forEach(function(p,i){var isTx=(i===ps.length-1),c=isTx?"gold":"purple",xa=X(p[0]),xb=Math.max(X(p[0]+p[1]),xa+2);
        o.push(S.RECT(xa,yb+(isTx?14:0),xb-xa,11,2,U.soft(c),c,1));
        var nm=(isTx?"送信 ":"LED ")+U.sig(p[2]*1e3,3)+" mA";
        o.push(S.T(xb+4,yb+(isTx?14:0)+9,nm,"start",9,c,true));});
      box.set(S.svg(W,yb+34,o));
      /* ---- 読み出し ---- */
      var dva=Ia*R,dvb=C>0?Math.min(Ia*ta/C+Ia*Re,Ia*R):Ia*R,allow=E-(Vm+0.1),need=allow>Ia*Re&&allow>0?Ia*ta/(allow-Ia*Re):NaN;
      var s="最低の電圧 <b>"+vmin.toFixed(3)+" V</b>（"+F.time(tmin)+"）→ "+(bad?'<span class="warn">V_min を下回る。この時点でマイコンはリセットする</span>':(vmin<Vm+0.1?'<b style="color:var(--gold)">V_min は上回るが、余裕 0.1 V を割る</b>':'<span class="ok">V_min + 0.1 V を保つ</span>'))+"<br>";
      s+="電池の電流の最大 <b>"+F.cur(ibmax)+"</b>（コンデンサが無ければ "+F.cur(ilmax)+"）・ 再充電の時定数 τ = (R_in + ESR) C = <b>"+(C>0?F.time(tau):"—")+"</b>"+(C>0?"（5τ = "+F.time(5*tau)+"）":"")+"<br>";
      s+="送信の低下の上限 min(I t/C + I·ESR, I·R_in) = <b>"+dvb.toFixed(3)+" V</b>（電池だけなら I·R_in = "+dva.toFixed(3)+" V）<br>";
      s+="V_min + 0.1 V を守る容量 C ≥ I t / (ΔV_allow − I·ESR)、ΔV_allow = E − (V_min + 0.1 V) = "+allow.toFixed(2)+" V → "+
        (allow<=0?'<span class="warn">電池の起電力が低すぎる</span>':(!isFinite(need)?'<b style="color:var(--gold)">I·ESR = '+(Ia*Re).toFixed(3)+' V で、この式では決められない（ESR が内部抵抗に近く、電池も電流を出す。波形の最低の電圧で確かめる）</b>':"<b>"+(need>=1e-3?U.sig(need*1e3,3)+" mF":U.sig(need*1e6,3)+" µF")+"</b> 以上"));
      if(C>0)s+="<br>パルスの始まりにコンデンサが受け持つ割合 R_in/(R_in + ESR) = <b>"+U.sig(R/(R+Re)*100,3)+" %</b>"+(Re>0.1*R?'（<b style="color:var(--gold)">ESR が内部抵抗に比べて大きい</b>）':"");
      if(led){var d1=C>0?Math.min(Ib*tb/C+Ib*Re,Ib*R):Ib*R,den=allow-dvb;
        s+="<br>LED の後に送信するときの間隔 t_gap ≥ τ ln(ΔV₁/(ΔV_allow − ΔV₂)) = "+(C<=0?"—（コンデンサなし）":(den<=0?'<span class="warn">送信だけで ΔV_allow を超えるので、間を空けても足りない</span>':"<b>"+(d1<=den?"0（空けなくてよい）":F.time(tau*Math.log(d1/den)))+"</b>（安全側の見積もり。ΔV₁ = "+d1.toFixed(3)+" V）"));}
      ro.innerHTML=s+'<div class="wnote">電池は起電力と内部抵抗、コンデンサは理想の容量と ESR で表した。マイコンが V_min を割ってリセットした後の動きは計算していない。値はすべて例の値。</div>';
    }
    draw();
  };

  /* ---- 3 節: 低電池の判定 ---- */
  REG.w04_lowbat=function(el,U){
    var S=U.S,seed=1;
    U.head(el,"LOW BATTERY","低電池の判定 — 測るとき・ヒステリシス・連続回数");
    var r1=U.ctrls(el);
    var cMs=U.select(r1,"測るとき",["送信の直後（電圧が最も下がるとき）","休んでいるとき（電流 0）"],0,draw);
    var cTh=U.select(r1,"しきい値",["ヒステリシス（2.45 V で入り、2.60 V を超えて戻る）","1 つ（2.45 V）"],0,draw);
    var cN=U.slider(r1,"続けて越える回数 N",{values:[1,2,3,4,5],value:3,fmt:function(v){return v+" 回";},onInput:draw});
    var r2=U.ctrls(el);
    var cTm=U.slider(r2,"気温の平均",{min:-10,max:25,step:1,value:5,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var cDT=U.slider(r2,"1 日の気温の差",{min:0,max:20,step:1,value:14,fmt:function(v){return v+" °C";},onInput:draw});
    var r3=U.ctrls(el);
    var cSg=U.slider(r3,"測る誤差（標準偏差）",{min:0,max:40,step:1,value:10,fmt:function(v){return v+" mV";},onInput:draw});
    var cPo=U.slider(r3,"0.25 V 低く外れる測定の割合",{values:[0,0.1,0.3,1,3],value:1,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);
    function preset(ms,th,n){cMs.set(ms);cTh.set(th);cN.set(n);cTm.set(5);cDT.set(14);cSg.set(10);cPo.set(1);draw();}
    U.button(br,"3 節の例（送信の直後・ヒステリシス・3 回）",function(){preset(0,0,3);});
    U.button(br,"しきい値 1 つ・1 回",function(){preset(0,1,1);});
    U.button(br,"ヒステリシス・1 回",function(){preset(0,0,1);});
    U.button(br,"休んでいるときに測る",function(){preset(1,0,3);});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var rest=cMs.get()===1,single=cTh.get()===1,N=cN.get(),Tm=cTm.get(),dT=cDT.get(),sg=cSg.get()*1e-3,po=cPo.get()/100;
      var R=U.rng(seed),lifeH=_w04_LIFE_D*24,H=Math.floor(lifeH*1.02),exitV=single?2.45:2.60;
      var st=0,nc=0,nl=0,no=0,changes=0,tLow=-1,tCrit=-1,firstBad=-1,resets=0,sCrit=-1;
      var D0=2400,days={},seg=[],cur=0,seg0=0;
      for(var h=0;h<H;h++){
        var s=h/lifeH,T=Tm+dT/2*Math.sin(2*Math.PI*((h%24)-9)/24),vt=_w04_vop(s,T),v=(rest?_w04_ocv(s):vt)+sg*R.normal(),out=false;
        if(po>0&&R.chance(po)){v-=0.25;out=true;}
        nc=v<2.35?nc+1:0; nl=v<2.45?nl+1:0; no=(single?v>=exitV:v>exitV)?no+1:0;
        var prev=st;
        if(st===0){if(nc>=N)st=2;else if(nl>=N)st=1;}
        else if(st===1){if(nc>=N)st=2;else if(no>=N)st=0;}
        if(st!==prev){changes++;if(st===1&&tLow<0)tLow=h/24;if(st===2){tCrit=h/24;sCrit=s;}}
        if(vt<2.2&&firstBad<0)firstBad=h/24;
        if(vt<2.2&&st!==2)resets++;
        if(st!==cur){seg.push([seg0,h/24,cur]);seg0=h/24;cur=st;}
        var d=Math.floor(h/24);
        if(d>=D0){var a=days[d]||(days[d]=[9,0,9,st,0,[]]);if(out)a[5].push(v);else{a[0]=Math.min(a[0],v);a[1]=Math.max(a[1],v);}a[2]=Math.min(a[2],vt);a[3]=Math.max(a[3],st);if(vt<2.2&&st!==2)a[4]++;}
      }
      seg.push([seg0,H/24,cur]);
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?70:56,wd=W-x0-20,o=[],SC=["green","gold","alias"];
      /* 上: 電池の一生の判定の帯 */
      var Xl=function(d){return x0+d/(H/24)*wd;};
      o.push(S.T(10,16,"電池の一生（約 "+U.sig(_w04_LIFE_D/365,2)+" 年）の判定","start",10.5,"ink",true));
      seg.forEach(function(q){o.push(S.RECT(Xl(q[0]),24,Math.max(0.6,Xl(q[1])-Xl(q[0])),14,0,U.soft(SC[q[2]]),SC[q[2]],0.5));});
      for(var y=0;y<=8;y++){var xx=Xl(y*365);o.push(S.L(xx,38,xx,42,"muted",1));o.push(S.T(xx,53,y+(y===0?" 年":""),"middle",9,"muted"));}
      o.push(S.RECT(Xl(D0),22,Xl(H/24)-Xl(D0),18,2,"none","ink",1,"3 2"));
      /* 下: 最後の 520 日 */
      var y0=78,hh=wide?170:150,vlo=2.0,vhi=2.9,d1=H/24;
      var X=function(d){return x0+(d-D0)/(d1-D0)*wd;},Y=function(v){return y0+hh-(Math.max(vlo,Math.min(vhi,v))-vlo)/(vhi-vlo)*hh;};
      o.push(S.T(10,y0-8,"点線の枠の拡大: 測った電圧と判定","start",10.5,"ink",true));
      o.push(S.W([x0,y0,x0,y0+hh,x0+wd,y0+hh],"muted",1.1));
      [2.0,2.2,2.4,2.6,2.8].forEach(function(v){o.push(S.L(x0,Y(v),x0+wd,Y(v),"grid",1));o.push(S.T(x0-6,Y(v)+3.5,v.toFixed(1),"end",9,"muted"));});
      o.push(S.T(x0-34,y0+hh/2+4,"V","middle",9.5,"muted"));
      var ks=Object.keys(days).map(Number).sort(function(a,b){return a-b;}),top=[],bot=[],tl=[];
      ks.forEach(function(d){if(days[d][1]>0){top.push([X(d+0.5),Y(days[d][1])]);bot.unshift([X(d+0.5),Y(days[d][0])]);}tl.push([X(d+0.5),Y(days[d][2])]);});
      if(top.length)o.push(S.PL(top.concat(bot),"signal",0.8,"var(--signal-soft)"));
      ks.forEach(function(d){days[d][5].forEach(function(v){o.push(S.D(X(d+0.5),Y(v),"alias",1.6));});});
      o.push(S.PL(tl,"teal",1.2,null,"4 2"));
      [[2.60,"green","2.60"],[2.45,"gold","2.45"],[2.35,"alias","2.35"],[2.2,"alias","2.2（最低）"]].forEach(function(q){if(single&&q[0]===2.60)return;
        o.push(S.L(x0,Y(q[0]),x0+wd,Y(q[0]),q[1],1.1,q[0]===2.2?"6 3":"4 3"));o.push(S.T(x0+wd-2,Y(q[0])-3,q[2]+" V","end",8.5,q[1],true,false,null,true));});
      var yb=y0+hh+10;
      var g0=ks.length?ks[0]:0,gs=ks.length?days[ks[0]][3]:0;
      ks.concat([null]).forEach(function(d){if(d===null||days[d][3]!==gs){var c=SC[gs],de=d===null?ks[ks.length-1]+1:d;o.push(S.RECT(X(g0),yb,Math.max(0.8,X(de)-X(g0)),11,1,U.soft(c),c,0.8));if(d!==null){g0=d;gs=days[d][3];}}});
      ks.forEach(function(d){if(days[d][4]>0)o.push(S.L(X(d+0.5),yb+13,X(d+0.5),yb+21,"alias",1.4));});
      [0,100,200,300,400,500,600,700].forEach(function(k){var d=D0+k;if(d>d1)return;o.push(S.L(X(d),y0+hh,X(d),y0+hh+4,"muted",1));o.push(S.T(X(d),yb+33,String(d),"middle",9,"muted"));});
      o.push(S.T(x0+wd,yb+46,"電池を入れてからの日数","end",9,"muted"));
      var lx=x0,ly=yb+60;
      [["green","OK"],["gold","LOW"],["alias","CRIT"],["signal","測った電圧（1 日の最小〜最大）"],["teal","本当の電圧（1 日の最小。点線）"]].forEach(function(q,i){var w=U.tw(q[1],9)+26;if(lx+w>x0+wd){lx=x0;ly+=15;}o.push(S.RECT(lx,ly-9,10,10,2,U.soft(q[0]),q[0],1));o.push(S.T(lx+14,ly,q[1],"start",9,q[0],true));lx+=w;});
      if(lx+190>x0+wd){lx=x0;ly+=15;}o.push(S.D(lx+5,ly-4,"alias",2));o.push(S.T(lx+12,ly,"外れた値",'start',9,"alias",true));lx+=62;o.push(S.L(lx+4,ly-8,lx+4,ly,"alias",1.4));o.push(S.T(lx+10,ly,"リセットした日",'start',9,"alias",true));
      box.set(S.svg(W,ly+10,o));
      /* ---- 読み出し ---- */
      var fd=function(d){return d<0?"—":Math.round(d)+" 日（"+U.sig(d/365,3)+" 年）";};
      var sEnd=firstBad>0?firstBad*24/lifeH:1;
      var txt="状態の変化 <b>"+changes+" 回</b>"+(changes>3?'（<span class="warn">ばたついている</span>）':'（<span class="ok">ばたつかない</span>）')+"<br>";
      txt+="LOW に入った: "+fd(tLow)+" ・ CRIT に入った: "+fd(tCrit)+" ・ 送信の直後の電圧が初めて 2.2 V を割った: "+fd(firstBad)+"<br>";
      if(resets>0)txt+='<span class="warn">CRIT に入る前に、送信の直後の電圧が 2.2 V を割った時間が '+resets+' 回ある（その送信でリセットする）</span>';
      else if(tCrit>=0&&firstBad>=0)txt+='<span class="ok">CRIT に入ってから、本当に 2.2 V を割るまで '+Math.round(firstBad-tCrit)+' 日の余裕がある</span>';
      else txt+="（この範囲では CRIT に入らなかった）";
      if(tCrit>=0&&firstBad>=0&&sCrit<sEnd-0.1)txt+='<br><span class="warn">CRIT に入るのが早すぎる: 使える電荷の '+Math.round((1-sCrit/sEnd)*100)+' % を残して止まった</span>';
      ro.innerHTML=txt+'<div class="wnote">03 章 4 節の例の模型（実際の電池の値ではない）に 1 節の 100 µF を付けた機器で、1 時間ごとに測って判定した。CRIT からは戻らない。外れた値は、測定の一部が 0.25 V 低くなるとした。休んでいるときに測る場合も、送信は毎回するので、そのときの電圧でリセットするかどうかを数えた。</div>';
    }
    draw();
  };

  /* ---- 4 節: 残量の推定 ---- */
  REG.w04_soc=function(el,U){
    var S=U.S,seed=1;
    U.head(el,"STATE OF CHARGE","残量の推定 — 電圧から・電荷を数えて・組み合わせて");
    var r1=U.ctrls(el);
    var cB=U.select(r1,"電池",["リチウムイオン電池（放電曲線が傾いている。03 章の例の模型）","コイン形（放電曲線が平ら。03 章の例の模型）"],0,draw);
    var cMs=U.select(r1,"電圧を測るとき",["休ませて（電流 0）","電流を流しながら（リチウムイオン 1 A・コイン形 送信の直後）"],0,draw);
    var r2=U.ctrls(el);
    var cT=U.slider(r2,"温度",{min:-10,max:40,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var cSg=U.slider(r2,"電圧の誤差（標準偏差）",{min:0,max:30,step:1,value:15,fmt:function(v){return v+" mV";},onInput:draw});
    var r3=U.ctrls(el);
    var cK=U.slider(r3,"数えた電荷の誤差",{min:-20,max:20,step:1,value:-10,fmt:function(v){return (v>0?"+":"")+String(v).replace("-","−")+" %";},onInput:draw});
    var cQ=U.slider(r3,"実際の容量 ÷ 見積もった容量",{min:60,max:110,step:1,value:90,fmt:function(v){return v+" %";},onInput:draw});
    var r4=U.ctrls(el);
    var cFx=U.checkbox(r4,"組み合わせる（電圧で合わせ直す）",true,draw);
    var br=U.btnrow(el);
    U.button(br,"誤差なし",function(){cK.set(0);cQ.set(100);cSg.set(0);draw();});
    U.button(br,"例に戻す",function(){cB.set(0);cMs.set(0);cT.set(25);cSg.set(15);cK.set(-10);cQ.set(90);cFx.set(true);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var coin=cB.get()===1,load=cMs.get()===1,T=cT.get(),sg=cSg.get()*1e-3,k=cK.get()/100,qr=cQ.get()/100,fix=cFx.get();
      var R=U.rng(seed),pts=[],NP=200;
      /* p: 本当の残量 [%]（実際に使える電荷に対して）。u: 使った電荷 / 見積もった容量 */
      var rinLi=0.12*Math.pow(1.4,(25-T)/10),sEnd=1;
      if(coin){var lo=0.3,hi=1.0;for(var it=0;it<50;it++){var mm=(lo+hi)/2;if(_w04_vop(mm,T)>2.35)lo=mm;else hi=mm;}sEnd=lo;}   /* 機器が止まる（3 節の CRIT）まで */
      var anchor=null,cAdj=0,lowSeen=false;
      for(var i=0;i<=NP;i++){
        var p=100-100*i/NP,used=(1-p/100)*qr;            /* 見積もった容量に対する、使った割合 */
        var v,pv;
        if(coin){var s=(1-p/100)*sEnd;v=(load?_w04_vop(s,T):_w04_ocv(s))+sg*R.normal();
          /* 220 mAh に対する残量の表で引き、使える電荷に対する割合に直す */
          pv=Math.max(0,Math.min(100,(1-(1-_w04_inv(_w04_COIN,v)/100)/sEnd)*100));}
        else{v=_w04_tab(_w04_LI,p)-(load?1.0*rinLi:0)+sg*R.normal();pv=_w04_inv(_w04_LI,v);}
        var pc=100*(1-(1+k)*used);
        /* 組み合わせ: リチウムイオンは残量 50 % で 1 回休んだとして電圧の値に合わせ直し、使い終わりの近く（電圧の表で 10 % 以下）でも合わせ直す。
           コイン形は、送信の直後の電圧が 2.45 V を下回ったら（3 節の LOW）10 % 以下にし、2.35 V で 0 % にする */
        var pf;
        if(!coin){
          if(anchor===null&&p<=50){anchor=pv-pc;}
          if(pv<=10&&!lowSeen){lowSeen=true;cAdj=pv-(pc+(anchor||0));}
          pf=pc+(anchor||0)+(lowSeen?cAdj:0);
          if(lowSeen)pf=Math.min(pf,pv);
        }else{
          var vl=_w04_vop((1-p/100)*sEnd,T);
          pf=pc;
          if(vl<2.45)pf=Math.min(pc,Math.max(0,10*(vl-2.35)/0.10));
        }
        pts.push([p,pv,Math.max(0,Math.min(100,pc)),Math.max(0,Math.min(100,pf))]);
      }
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?70:56,sz=wide?300:260,o=[];
      var pw=wide?360:W-x0-20,ph=sz-60;
      var X=function(p){return x0+(100-p)/100*pw;},Y=function(q){return 24+ph-q/100*ph;};
      o.push(S.T(10,14,"推定した残量（縦）と本当の残量（横。右へ使っていく）","start",10.5,"ink",true));
      o.push(S.W([x0,24,x0,24+ph,x0+pw,24+ph],"muted",1.1));
      [0,20,40,60,80,100].forEach(function(q){o.push(S.L(x0,Y(q),x0+pw,Y(q),"grid",1));o.push(S.T(x0-6,Y(q)+3.5,String(q),"end",9,"muted"));
        o.push(S.L(X(q),24+ph,X(q),28+ph,"muted",1));o.push(S.T(X(q),40+ph,String(q),"middle",9,"muted"));});
      o.push(S.T(x0+pw,54+ph,"本当の残量 [%]","end",9.5,"muted"));
      o.push(S.T(x0-38,24+ph/2,"推定 [%]","middle",9.5,"muted",false,false,-90));
      o.push(S.L(X(100),Y(100),X(0),Y(0),"ink",1.2));
      pts.forEach(function(q,i){if(i%2===0)o.push(S.D(X(q[0]),Y(Math.max(0,Math.min(100,q[1]))),"teal",1.8));});
      o.push(S.PL(pts.map(function(q){return [X(q[0]),Y(q[2])];}),"gold",1.8,null,"5 3"));
      if(fix)o.push(S.PL(pts.map(function(q){return [X(q[0]),Y(q[3])];}),"signal",2.2));
      var lx=wide?x0+pw+24:x0,ly=wide?40:24+ph+70,L=[["ink","本当の残量（対角線）"],["teal","電圧から（点）"],["gold","電荷を数えて（破線）"]];
      if(fix)L.push(["signal","組み合わせ（実線）"]);
      L.forEach(function(q,i){o.push(S.RECT(lx,ly+i*18-9,10,10,2,U.soft(q[0]),q[0],1));o.push(S.T(lx+14,ly+i*18,q[1],"start",9.5,q[0],true));});
      var errs=[["電圧から",1],["電荷を数えて",2]];if(fix)errs.push(["組み合わせ",3]);
      var ey=ly+L.length*18+14;
      if(wide){o.push(S.T(lx,ey,"誤差の最大（本当 − 推定の絶対値）","start",9.5,"ink",true));
        errs.forEach(function(e,i){var m=0;pts.forEach(function(q){m=Math.max(m,Math.abs(q[e[1]]-q[0]));});o.push(S.T(lx,ey+17+i*16,e[0]+": "+m.toFixed(0)+" %","start",9.5,"muted"));});}
      box.set(S.svg(W,wide?Math.max(24+ph+62,ey+70):ly+L.length*18+6,o));
      /* ---- 読み出し ---- */
      function at(p,idx){var b=pts[0];pts.forEach(function(q){if(Math.abs(q[0]-p)<Math.abs(b[0]-p))b=q;});return b[idx];}
      var s="本当の残量が 50 % のとき: 電圧から "+at(50,1).toFixed(0)+" %・電荷を数えて "+at(50,2).toFixed(0)+" %"+(fix?"・組み合わせ "+at(50,3).toFixed(0)+" %":"")+"<br>";
      var e0=at(0,2),f0=at(0,3);
      s+="本当の残量が 0 % のとき（使い切ったとき）: 電荷を数えて <b>"+e0.toFixed(0)+" %</b>"+(e0>2?'（<span class="warn">残っていると示したまま止まる</span>）':"")+(fix?"・組み合わせ <b>"+f0.toFixed(0)+" %</b>"+(f0>2?'（<span class="warn">まだ残っていると示す</span>）':'（<span class="ok">0 % に近い</span>）'):"");
      s+="<br>電圧からの推定は、"+(coin?"平らな所では誤差が大きい（傾き約 2 mV/% なので、電圧の誤差 "+Math.round(sg*1000)+" mV は約 "+Math.round(sg*1000/2)+" %）":"傾きのある所では誤差が小さい（残量 50 % の近くで約 4.8 mV/%）")+(load?'。<span class="warn">電流を流しながら測ると、内部抵抗の分だけ少なく読める</span>':"");
      ro.innerHTML=s+'<div class="wnote">本当の残量は、実際に使える電荷（コイン形では、機器が止まる 3 節の CRIT まで）に対する割合。「数えた電荷の誤差」は、動作 1 回の電荷や電流の測定の誤差をまとめたもの（負なら本当より少なく数える）。組み合わせは、リチウムイオン電池では残量 50 % の時点で 1 回休み、電圧の表に合わせ直したとし、使い終わりの近く（電圧の表で 10 % 以下）でも合わせ直す。コイン形では、送信の直後の電圧が 2.45 V（3 節の LOW）を下回ったら 10 % 以下に下げ、2.35 V で 0 % とした。値はすべて例の値。</div>';
    }
    draw();
  };

  /* ---- 5 節: 充電器 IC の CC/CV 充電と、パワーパス・温度・マイコンの見張り（簡単な模型） ---- */
  REG.w04_charge=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"CHARGER","充電器 IC の CC/CV 充電とパワーパス（マイコンは見張るだけ）");
    var r1=U.ctrls(el);
    var cQ=U.slider(r1,"電池の容量",{values:[200,500,1000,2000,3000],value:1000,fmt:function(v){return v+" mAh";},onInput:draw});
    var cI=U.slider(r1,"充電の電流（CC）",{values:[0.2,0.3,0.5,0.7,1.0],value:0.5,fmt:function(v){return v+"C";},onInput:draw});
    var cTe=U.slider(r1,"終了電流",{values:[0.05,0.1,0.2],value:0.1,fmt:function(v){return v+"C";},onInput:draw});
    var r2=U.ctrls(el);
    var cSys=U.slider(r2,"機器の電流",{min:0,max:300,step:10,value:150,fmt:function(v){return v+" mA";},onInput:draw});
    var cBud=U.slider(r2,"USB の電流の予算",{values:[100,500,900,1500,3000],value:900,fmt:function(v){return v+" mA";},onInput:draw});
    var cPP=U.checkbox(r2,"パワーパスあり",false,draw);
    var r3=U.ctrls(el);
    var cT=U.slider(r3,"電池の温度",{min:-10,max:60,step:1,value:25,fmt:function(v){return String(v).replace("-","−")+" °C";},onInput:draw});
    var cP0=U.slider(r3,"充電を始めたときの残量",{values:[-2,0,10,30,50,80],value:10,fmt:function(v){return v<0?"−2 %（2.8 V。予備充電から）":v+" %";},onInput:draw});
    var cTm=U.checkbox(r3,"マイコンが時間を見張る（予定の 1.5 倍で止める）",true,draw);
    var br=U.btnrow(el);
    function preset(pp,sys){cQ.set(1000);cI.set(0.5);cTe.set(0.1);cSys.set(sys);cBud.set(900);cPP.set(pp);cT.set(25);cP0.set(10);cTm.set(true);draw();}
    U.button(br,"5 節の図 (a) パワーパスなし・機器 150 mA",function(){preset(false,150);});
    U.button(br,"(b) パワーパスあり",function(){preset(true,150);});
    U.button(br,"機器の電流 0",function(){preset(false,0);});
    U.button(br,"寒い（−5 °C）",function(){cT.set(-5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function ocv(p){return p<0?3.00+(p/2)*0.2:_w04_tab(_w04_LI,Math.min(100,p));}   /* −2 % で 2.8 V（予備充電の範囲を表す例） */
    function draw(){
      var Q=cQ.get(),Icc=cI.get()*Q,Ite=cTe.get()*Q,Isys=cSys.get(),bud=cBud.get(),pp=cPP.get(),T=cT.get(),p0=cP0.get(),tm=cTm.get();
      var R=0.3*1000/Q,Ipre=0.1*Q,Vch=4.2;               /* 充電の間の内部抵抗 [Ω]（1000 mAh で 0.3 Ω とし、容量に反比例させた例） */
      var tempOk=T>=0&&T<=45,exp=(100-Math.max(0,p0))/100*Q/Icc+0.75,tLim=tm?1.5*exp:12,dt=10/3600;
      var p=p0,t=0,log=[],endT=null,endWhy="",hold=0,starve=false;
      while(t<Math.min(tLim,12)+1e-9){
        var E=ocv(p),ib,meas,mode;
        if(!tempOk){mode="temp";ib=pp?0:-Isys;meas=0;}
        else{
          var Iset=E<3.0?Ipre:Icc;mode=E<3.0?"pre":"cc";
          if(pp){var cap=Math.max(0,Math.min(Iset,bud-Isys)),cv=(Vch-E)/R*1000;ib=Math.min(cap,cv);if(mode==="cc"&&cv<cap)mode="cv";meas=ib;}
          else{var lim=Math.min(Iset,bud),cv2=(Vch-E)/R*1000;ib=Math.min(lim-Isys,cv2);if(mode==="cc"&&cv2<lim-Isys)mode="cv";meas=ib+Isys;}
          if(mode==="cv"&&meas<=Ite){endT=t;endWhy="full";break;}
        }
        if(mode==="cv"&&p>=99.5)hold+=dt;
        if((mode==="pre"||mode==="cc")&&ib<=0)starve=true;
        log.push([t,ib,meas,E+ib/1000*R,E,p,mode]);
        p=Math.min(100,p+ib*dt/Q*100);t+=dt;
      }
      if(endT===null){endT=t;endWhy=tempOk?(tm&&t>=tLim-1e-6?"timer":"long"):"temp";}
      /* ---- 図 ---- */
      var wide=_w04_wide(box),W=wide?700:380,x0=wide?66:52,wd=W-x0-(wide?50:40),o=[],span=Math.max(0.5,endT*1.08);
      var X=function(h){return x0+h/span*wd;};
      var MC={pre:"teal",cc:"gold",cv:"signal",temp:"alias"},MN={pre:"予備充電",cc:"定電流（CC）",cv:"定電圧（CV）",temp:"温度で停止"};
      /* 段の帯 */
      var yb=10,seg0=0,sm=log.length?log[0][6]:"temp";
      o.push(S.T(10,yb+11,"段","start",10,"ink",true));
      log.concat([[endT,0,0,0,0,0,null]]).forEach(function(r){if(r[6]!==sm){var c=MC[sm];o.push(S.RECT(X(seg0),yb,Math.max(1,X(r[0])-X(seg0)),14,2,U.soft(c),c,0.8));var w=X(r[0])-X(seg0);if(w>U.tw(MN[sm],9)+6)o.push(S.T((X(seg0)+X(r[0]))/2,yb+11,MN[sm],"middle",9,c,true));seg0=r[0];sm=r[6];}});
      var endC=endWhy==="full"?"green":"alias",endL=endWhy==="full"?"満充電で終了":(endWhy==="timer"?"マイコンのタイマで停止（異常）":(endWhy==="temp"?"温度の範囲の外: 充電しない":"終わらない"));
      /* 電流 */
      var y1=40,h1=wide?100:90,imax=Math.max(Icc,Isys,Ite)*1.15,imin=Math.min(0,-Isys)*1.15;
      var Y1=function(i){return y1+h1-(i-imin)/(imax-imin)*h1;};
      o.push(S.T(10,y1-4,"電流 [mA]","start",10,"ink",true));
      o.push(S.W([x0,y1,x0,y1+h1,x0+wd,y1+h1],"muted",1.1));
      U.nice(imin,imax,4).forEach(function(v){if(v>=imin-1e-9&&v<=imax+1e-9){o.push(S.L(x0,Y1(v),x0+wd,Y1(v),"grid",1));o.push(S.T(x0-6,Y1(v)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.L(x0,Y1(Ite),x0+wd,Y1(Ite),"alias",1,"3 3"));o.push(S.T(x0+wd,Y1(Ite)-4,"終了電流 "+U.sig(Ite,3)+" mA","end",9,"alias",false,false,null,true));
      if(log.length){o.push(S.PL(log.map(function(r){return [X(r[0]),Y1(r[1])];}),"gold",2));
        if(!pp)o.push(S.PL(log.map(function(r){return [X(r[0]),Y1(r[2])];}),"purple",1.6,null,"5 3"));}
      /* 電圧と残量 */
      var y2=y1+h1+34,h2=wide?100:90,Y2=function(v){return y2+h2-(v-2.8)/(4.3-2.8)*h2;},Yp=function(q){return y2+h2-q/100*h2;};
      o.push(S.T(10,y2-4,"電池の電圧 [V]・残量","start",10,"ink",true));
      o.push(S.W([x0,y2,x0,y2+h2,x0+wd,y2+h2],"muted",1.1));
      [2.8,3.2,3.6,4.0,4.2].forEach(function(v){o.push(S.L(x0,Y2(v),x0+wd,Y2(v),"grid",1));o.push(S.T(x0-6,Y2(v)+3.5,v.toFixed(1),"end",9,"muted"));});
      [0,50,100].forEach(function(q){o.push(S.T(x0+wd+6,Yp(q)+3.5,q+" %","start",9,"teal"));});
      o.push(S.L(x0,Y2(Vch),x0+wd,Y2(Vch),"alias",1,"3 3"));
      if(log.length){o.push(S.PL(log.map(function(r){return [X(r[0]),Y2(Math.max(2.8,Math.min(4.3,r[3])))];}),"signal",2));
        o.push(S.PL(log.map(function(r){return [X(r[0]),Yp(Math.max(0,r[5]))];}),"teal",1.6,null,"5 3"));}
      var ya=y2+h2;U.nice(0,span,wide?8:5).forEach(function(v){if(v<=span+1e-9){o.push(S.L(X(v),ya,X(v),ya+4,"muted",1));o.push(S.T(X(v),ya+15,U.sig(v,3),"middle",9,"muted"));}});
      o.push(S.T(x0+wd,ya+28,"時間 [時間]","end",9,"muted"));
      o.push(S.L(X(endT),yb-2,X(endT),ya,endC,1.2,"4 3"));
      var ly=ya+44,lx=x0,L=[["gold","電池へ入る電流"],["signal","電池の端子電圧"],["teal","残量（破線・右の目盛）"]];if(!pp)L.splice(1,0,["purple","充電器 IC が見る電流（電池 + 機器）"]);
      L.forEach(function(q){var w=U.tw(q[1],9)+26;if(lx+w>x0+wd){lx=x0;ly+=15;}o.push(S.RECT(lx,ly-9,10,10,2,U.soft(q[0]),q[0],1));o.push(S.T(lx+14,ly,q[1],"start",9,q[0],true));lx+=w;});
      o.push(S.T(Math.min(X(endT)+4,x0+wd-2),y1+12,endL,X(endT)>x0+wd*0.6?"end":"start",9.5,endC,true,false,null,true));
      box.set(S.svg(W,ly+10,o));
      /* ---- 読み出し ---- */
      var last=log.length?log[log.length-1]:[0,0,0,ocv(p0),ocv(p0),p0,"temp"];
      var s="";
      if(endWhy==="full")s+='<span class="ok">'+U.sig(endT,3)+' 時間で満充電を見分けて終了</span>（残量 '+Math.round(last[5])+' %）';
      else if(endWhy==="temp")s+='<span class="warn">電池の温度 '+String(T).replace("-","−")+' °C は充電してよい範囲（この例では 0〜45 °C）の外なので、充電器 IC は充電しない</span>'+(pp?"":"。機器の電流は電池から流れ、電池は減っていく");
      else if(starve)s+='<span class="warn">機器の電流 '+Isys+' mA が、充電器 IC が出せる電流（'+(pp?"USB の予算の残り":(p0<0?"予備充電の "+U.sig(Ipre,3)+" mA":"設定と USB の予算の小さいほう"))+'）を使い切り、電池は充電されない'+(p0<0&&!pp?"（空の電池では機器が起動できない）":"")+'</span>'+(endWhy==="timer"?"。マイコンのタイマが "+U.sig(endT,3)+" 時間で止めた":"");
      else s+='<span class="warn">充電器 IC は満充電を見分けられない</span>（充電器が見る電流が終了電流の '+U.sig(Ite,3)+' mA まで下がらない）。'+(endWhy==="timer"?"マイコンのタイマが "+U.sig(endT,3)+" 時間で止め、異常として知らせた":"12 時間たっても終わらない")+"。電池が 4.2 V のまま保たれた時間 "+U.sig(hold,2)+" 時間";
      if(tempOk)s+="<br>定電流の間に電池へ入る電流 "+U.sig(Math.max(0,Math.min(Icc,pp?bud-Isys:Math.min(Icc,bud)-Isys)),3)+" mA（設定 "+U.sig(Icc,3)+" mA"+(pp?"、予算 "+bud+" mA から機器の "+Isys+" mA を引いた残りが上限":"。機器の "+Isys+" mA が差し引かれる")+"）・ マイコンの予定の時間 "+U.sig(exp,3)+" 時間（1.5 倍で "+U.sig(1.5*exp,3)+" 時間）";
      ro.innerHTML=s+'<div class="wnote">充電そのものは充電器 IC が行う（この図はその動きの簡単な模型）。マイコンは状態を読み、温度と時間を見張って止めるだけで、充電の電流や電圧を直接作らない。値はすべて例の値で、実際の電池の充電の条件は電池の仕様書で確かめる。</div>';
    }
    draw();
  };

  /* ===== 05 章 マイコンの電源まわり ===== */
  function _w05_life(h,U){var d=h/24;if(d>=365*30)return "30 年を超える";return d>=365?U.sig(d/365,3)+" 年":(d>=1?U.sig(d,3)+" 日":U.sig(h,3)+" 時間");}
  function _w05_v(v,d){return (+v).toFixed(d==null?2:d)+" V";}

  /* ---- 2 節: 静止電流と入力の平均電流 ---- */
  REG.w05_reg=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"QUIESCENT","静止電流と入力の平均電流 — LDO かスイッチング電源か");
    var r1=U.ctrls(el);
    var vin=U.slider(r1,"電池の電圧 V_in",{values:[1.5,2.4,3.0,3.3,3.6,3.7,4.2,5,9,12],value:3.6,fmt:function(v){return v+" V";},onInput:draw});
    var vout=U.slider(r1,"出力の電圧 V_out",{values:[1.2,1.8,2.5,3.0,3.3,5.0],value:1.8,fmt:function(v){return v+" V";},onInput:draw});
    var eta=U.slider(r1,"スイッチング電源の効率 η_0（静止電流の分を除く）",{min:0.6,max:0.98,step:0.01,value:0.9,fmt:function(v){return Math.round(v*100)+" %";},onInput:draw});
    var r2=U.ctrls(el);
    var iql=U.slider(r2,"LDO の静止電流 I_q,L",{min:0.05,max:100,log:true,value:1,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var iqs=U.slider(r2,"スイッチング電源の静止電流 I_q,S",{min:0.1,max:100,log:true,value:10,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r3=U.ctrls(el);
    var is=U.slider(r3,"眠りの電流 I_s",{min:0.1,max:100,log:true,value:2,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var ia=U.slider(r3,"起きている間の電流 I_a",{min:0.1,max:100,log:true,value:6,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var ta=U.slider(r3,"起きている時間 t_a",{min:0.001,max:10,log:true,value:0.02,fmt:function(v){return F.time(v);},onInput:draw});
    var r4=U.ctrls(el);
    var Tp=U.slider(r4,"起きる周期 T",{min:0.1,max:86400,log:true,value:1,fmt:function(v){return F.time(v);},onInput:draw});
    var cap=U.slider(r4,"電池の容量",{values:[220,1000,2000,2400,3000],value:2400,fmt:function(v){return v+" mAh";},onInput:draw});
    var br=U.btnrow(el);
    function preset(T,a){vin.set(a&&a.vin||3.6);vout.set(a&&a.vout||1.8);eta.set(0.9);iql.set(1);iqs.set(a&&a.iqs||10);is.set(2);ia.set(6);ta.set(0.02);Tp.set(T);cap.set(2400);draw();}
    U.button(br,"2 節の例・T = 1 s",function(){preset(1);});
    U.button(br,"2 節の例・T = 60 s",function(){preset(60);});
    U.button(br,"静止電流 0.5 µA のスイッチング電源",function(){preset(60,{iqs:0.5});});
    U.button(br,"3.6 V から 3.3 V（k ≥ 1）",function(){preset(1,{vout:3.3});});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Vi=vin.get(),Vo=vout.get(),e0=eta.get(),qL=iql.get()*1e-6,qS=iqs.get()*1e-6,Is=is.get()*1e-6,Ia=ia.get()*1e-3,ta_=ta.get(),T=Tp.get(),C=cap.get();
      var warn="";
      if(ta_>T){warn+='<span class="warn">起きている時間が周期より長い。周期を t_a にして計算した。</span><br>';T=ta_;}
      var ldoOk=Vi>=Vo+0.2,k=Vo/(e0*Vi);
      var Iout=function(t){return Is+(Ia-Is)*Math.min(ta_,t)/t;};
      var IL=function(t){return Iout(t)+qL;},IS=function(t){return k*Iout(t)+qS;};
      /* 損得の境目: 差 = (qS − qL) − (1 − k) Iout は Iout について一次 */
      var d0=qS-qL,d1=1-k,Ist=null,Tst=null,shortBetter;
      if(Math.abs(d1)>1e-12){Ist=d0/d1;}
      if(Ist!==null&&Ist>Is&&Ist<Ia){Tst=(Ia-Is)*ta_/(Ist-Is);}
      shortBetter=(d0-d1*Ia)<0?"sw":"ldo";               /* 周期が短い（平均が I_a に近い）ときに得なほう */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[];
      /* グラフ: 周期と入力の平均電流 */
      var Ts=[],lo=Infinity,hi=0;for(var j=0;j<=120;j++){var t=Math.pow(10,-1+j*Math.log10(864000)/120);Ts.push(t);
        [IL(t),IS(t)].forEach(function(v){lo=Math.min(lo,v);hi=Math.max(hi,v);});}
      var y0=Math.pow(10,Math.floor(Math.log10(lo*0.8))),y1=Math.pow(10,Math.ceil(Math.log10(hi*1.2)));
      var pw=nar?310:360,p=U.plot(70,20,pw,200,[0.1,86400],[y0,y1],{xlog:true,ylog:true});
      var yt=[];for(var v=y0;v<=y1*1.0001;v*=10)yt.push(v);
      o.push(p.axes({xl:"起きる周期 T",yl:"入力の平均電流",xt:[0.1,1,10,100,1000,1e4,86400],yt:yt,xfmt:function(v){return v===86400?"1 日":(v>=1000?(v/1000)+"k s":v+" s");},yfmt:function(v){return F.cur(v,1);},ylOff:58}));
      if(ldoOk)o.push(p.line(Ts.map(function(t){return [t,IL(t)];}),"signal",2.2));
      o.push(p.line(Ts.map(function(t){return [t,IS(t)];}),"green",2.2));
      if(Tst&&Tst>=0.1&&Tst<=86400){o.push(S.L(p.X(Tst),p.Y(y0),p.X(Tst),p.Y(IL(Tst)),"alias",1,"3 3"));o.push(S.D(p.X(Tst),p.Y(IL(Tst)),"alias",4));
        o.push(S.T(p.X(Tst)+(p.X(Tst)>p.x+p.w-70?-6:6),p.Y(y0)-8,"T* = "+F.time(Tst),p.X(Tst)>p.x+p.w-70?"end":"start",9.5,"alias",true,false,null,true));}
      var tc=Math.max(0.1,Math.min(86400,T));
      if(ldoOk)o.push(S.D(p.X(tc),p.Y(IL(tc)),"signal",5));
      o.push(S.D(p.X(tc),p.Y(IS(tc)),"green",5));
      o.push(S.T(p.x+6,p.y+12,ldoOk?"LDO（青）":"LDO は作れない","start",9.5,ldoOk?"signal":"alias",true,false,null,true));
      o.push(S.T(p.x+6,p.y+26,"スイッチング電源（緑）","start",9.5,"green",true,false,null,true));
      /* 内訳の棒 */
      var bx=nar?20:470,by=nar?270:30,bw=nar?250:150,mx=Math.max(ldoOk?IL(T):0,IS(T));
      o.push(S.T(bx,by,"T = "+F.time(T)+" のときの内訳","start",10.5,"ink",true));
      var rows=[["LDO",ldoOk?Iout(T):0,ldoOk?qL:0,"signal"],["スイッチング",k*Iout(T),qS,"green"]];
      rows.forEach(function(r,i){var yy=by+16+i*46,a=r[1]/mx*bw,b=r[2]/mx*bw;
        o.push(S.T(bx,yy+12,r[0],"start",10,r[3],true));
        if(r[0]==="LDO"&&!ldoOk){o.push(S.T(bx,yy+30,"入力が出力 + 0.2 V より低い","start",9.5,"alias",true));return;}
        o.push(S.RECT(bx,yy+18,Math.max(a,0.6),16,2,U.soft(r[3]),r[3],1));o.push(S.RECT(bx+a,yy+18,Math.max(b,0.6),16,2,U.soft("gold"),"gold",1));
        o.push(S.T(bx+a+b+5,yy+31,F.cur(r[1]+r[2]),"start",9.5,r[3],true));});
      var ly=by+16+2*46+8;
      o.push(S.RECT(bx,ly-9,10,10,2,U.soft("gold"),"gold",1));o.push(S.T(bx+15,ly,"静止電流","start",9.5,"muted"));
      o.push(S.RECT(bx+80,ly-9,10,10,2,U.soft("signal"),"signal",1));o.push(S.T(bx+95,ly,"負荷の分","start",9.5,"muted"));
      box.set(S.svg(W,nar?ly+14:262,o));
      var lifeL=C*1e-3/IL(T),lifeS=C*1e-3/IS(T),better=!ldoOk?"sw":(IS(T)<IL(T)?"sw":"ldo");
      var cs;
      if(!ldoOk)cs="LDO は、入力が出力 + V_do（0.2 V とした）より低いので使えない。";
      else if(Tst)cs="I* = (I_q,S − I_q,L) ÷ (1 − k) = "+F.cur(Ist)+"、T* = (I_a − I_s) t_a ÷ (I* − I_s) = <b>"+F.time(Tst)+"</b>。T* より短い周期では"+(shortBetter==="sw"?"スイッチング電源":" LDO ")+"、長い周期では"+(shortBetter==="sw"?" LDO ":"スイッチング電源")+"が得。";
      else if(k>=1&&d0>=0)cs="k ≥ 1 で静止電流も LDO のほうが小さいので、どの周期でも LDO が得。";
      else if(k<1&&d0<=0)cs="k < 1 で静止電流もスイッチング電源のほうが小さいので、どの周期でもスイッチング電源が得。";
      else if(Ist!==null&&Ist<=Is)cs="I* = "+F.cur(Ist)+" が眠りの電流 I_s 以下なので、周期をいくら延ばしてもスイッチング電源が得。";
      else cs="この範囲では、どの周期でも"+(shortBetter==="sw"?"スイッチング電源":"LDO")+"が得。";
      ro.innerHTML=warn+"負荷の平均電流 I_out,avg = I_s + (I_a − I_s) t_a ÷ T = <b>"+F.cur(Iout(T))+"</b>、k = V_out ÷ (η_0 V_in) = "+U.sig(k,3)+"<br>"+
        (ldoOk?"LDO の入力: I_out,avg + I_q,L = <b>"+F.cur(IL(T))+"</b>（電池寿命 "+_w05_life(lifeL,U)+"）<br>":"")+
        "スイッチング電源の入力: k I_out,avg + I_q,S = "+F.cur(k*Iout(T))+" + "+F.cur(qS)+" = <b>"+F.cur(IS(T))+"</b>（電池寿命 "+_w05_life(lifeS,U)+"）<br>"+
        cs+" いまの周期では <b>"+(better==="sw"?"スイッチング電源":"LDO")+"</b> が得"+(ldoOk?"（"+U.sig(Math.max(IL(T),IS(T))/Math.min(IL(T),IS(T)),3)+" 倍の差）":"")+"。"+
        '<div class="wnote">電池寿命は、容量 ÷ 入力の平均電流で求めた。自己放電（03 章 5 節）と、電池の電圧が下がることは含めていない。電流と静止電流は例の値で、実際は製品のデータシートで確かめる。</div>';
    }
    draw();
  };

  /* ---- 3 節: 負荷スイッチの突入電流 ---- */
  /* 回路: 電池（E, Rin）→ マイコンの側（CA、マイコンの電流 Im）→ 負荷スイッチ（オン抵抗 Ron）→ 周辺の側（CL）。
     trise = 0 は一気に入れる。trise > 0 は、周辺の側の電圧を傾き E/trise の直線に沿わせる（流せる電流はオン抵抗で決まる上限まで）。
     線形の部分は後退オイラー法で解く（時間刻みが大きくても発散しない）。 */
  function _w05_isim(E,Rin,CA,CL,Im,tr,tend,N){
    var Ron=0.1,dt=tend/N,va=Math.max(0,E-Rin*Im),vb=0,S=tr>0?E/tr:0,tc=Math.max(2e-6,3*dt),out=[];
    for(var k=0;k<=N;k++){
      var t=k*dt,isw,ib=(E-va)/Rin;
      out.push([t,va,vb,0,ib]);
      if(k===N)break;
      var want=tr>0?((S*t<va?CL*S:0)+(Math.min(S*t,10)-vb)*CL/tc):Infinity;
      var imax=Math.max(0,(va-vb)/Ron);
      if(want>=imax){ /* スイッチが入りきっている: 抵抗 Ron として 2 つの節点を同時に解く */
        var a11=CA/dt+1/Rin+1/Ron,a12=-1/Ron,b1=CA/dt*va+E/Rin-Im,a21=-1/Ron,a22=CL/dt+1/Ron,b2=CL/dt*vb;
        var det=a11*a22-a12*a21,nva=(b1*a22-a12*b2)/det,nvb=(a11*b2-a21*b1)/det;
        isw=(nva-nvb)/Ron;va=nva;vb=nvb;
      }else{
        isw=Math.max(0,want);
        va=(CA/dt*va+E/Rin-Im-isw)/(CA/dt+1/Rin);vb+=isw*dt/CL;
      }
      if(va<0)va=0;
      out[out.length-1][3]=isw;
    }
    return out;
  }
  var _w05_SRC=[["新しい CR2032（3.0 V・15 Ω）",3.0,15],["使い終わりの CR2032・寒い所（2.8 V・100 Ω）",2.8,100],["単 3 形アルカリ 2 本（3.0 V・0.4 Ω）",3.0,0.4],["自分で決める",null,null]];
  REG.w05_inrush=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"INRUSH","負荷スイッチの突入電流 — マイコンの電圧はどこまで落ちるか");
    var r1=U.ctrls(el);
    var src=U.select(r1,"電源",_w05_SRC.map(function(s){return s[0];}),0,function(){var s=_w05_SRC[src.get()];if(s[1]!==null){E.set(s[1]);R.set(s[2]);}draw();});
    var E=U.slider(r1,"起電力 E",{min:2.0,max:5.5,step:0.05,value:3.0,fmt:function(v){return _w05_v(v);},onInput:function(){src.set(3);draw();}});
    var R=U.slider(r1,"内部抵抗 R_in",{min:0.1,max:300,log:true,value:15,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:function(){src.set(3);draw();}});
    var r2=U.ctrls(el);
    var CA=U.slider(r2,"マイコンの側の容量 C_A",{min:1,max:1000,log:true,value:10,fmt:function(v){return U.sig(v,3)+" µF";},onInput:draw});
    var CL=U.slider(r2,"周辺の側の容量 C_L",{min:0.1,max:1000,log:true,value:10,fmt:function(v){return U.sig(v,3)+" µF";},onInput:draw});
    var tr=U.slider(r2,"立ち上がりの時間 t_rise",{values:[0,0.01,0.03,0.1,0.3,0.69,1,3,10,14,30,100],value:0,fmt:function(v){return v?F.time(v*1e-3):"0（一気に入れる）";},onInput:draw});
    var r3=U.ctrls(el);
    var Im=U.slider(r3,"マイコンの電流 I_m",{min:0.1,max:30,log:true,value:3,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Vm=U.slider(r3,"マイコンが動く最低の電圧 V_min",{min:1.6,max:3.2,step:0.05,value:2.2,fmt:function(v){return _w05_v(v);},onInput:draw});
    var br=U.btnrow(el);
    function preset(s,ca,cl,t){src.set(s);E.set(_w05_SRC[s][1]);R.set(_w05_SRC[s][2]);CA.set(ca);CL.set(cl);tr.set(t);Im.set(3);Vm.set(2.2);draw();}
    U.button(br,"3 節 (a) 一気に入れる",function(){preset(0,10,10,0);});
    U.button(br,"3 節 (b) 1 ms で",function(){preset(0,10,10,1);});
    U.button(br,"古い電池で 1 ms",function(){preset(1,10,10,1);});
    U.button(br,"古い電池で 14 ms",function(){preset(1,10,10,14);});
    U.button(br,"大容量コンデンサ 100 µF を足して一気に",function(){preset(0,110,10,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var e=E.get(),r=R.get(),ca=CA.get()*1e-6,cl=CL.get()*1e-6,t_r=tr.get()*1e-3,im=Im.get()*1e-3,vm=Vm.get();
      var tau=r*(ca+cl),tend=Math.min(0.5,Math.max(2e-4,1.6*t_r+5*tau));
      var res=_w05_isim(e,r,ca,cl,im,t_r,tend,8000);
      var vmin=Infinity,tmin=0,below=0,ipk=0,ibpk=0,dt=tend/8000;
      res.forEach(function(q,i){if(q[1]<vmin){vmin=q[1];tmin=q[0];}if(q[1]<vm)below+=dt;if(i>0)ipk=Math.max(ipk,q[3]);ibpk=Math.max(ibpk,q[4]);});
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[],pw=nar?320:560,x0=nar?62:80;
      var tu=tend<2e-3?1e6:1e3,un=tu===1e6?"µs":"ms",tx=U.nice(0,tend*tu,5);
      var pv=U.plot(x0,16,pw,140,[0,tend*tu],[0,Math.max(e,3.2)*1.05]);
      o.push(pv.axes({yl:"電圧 [V]",xt:tx,yt:U.nice(0,Math.max(e,3.2),4),xfmt:function(){return "";},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      o.push(pv.line([[0,vm],[tend*tu,vm]],"alias",1.1,"5 3"));
      o.push(S.T(pv.x+pv.w-4,pv.Y(vm)+13,"V_min "+_w05_v(vm),"end",9.5,"alias",false,false,null,true));
      var step=Math.max(1,Math.floor(res.length/1500));
      var pts=function(ix,sc,cap){var a=[];for(var i=0;i<res.length;i+=step)a.push([res[i][0]*tu,Math.min(res[i][ix]*sc,cap)]);return a;};
      o.push(pv.line(pts(2,1,99),"purple",1.8));o.push(pv.line(pts(1,1,99),"signal",2.2));
      o.push(S.D(pv.X(tmin*tu),pv.Y(vmin),vmin<vm?"alias":"green",4.5));
      var ymax=Math.max(ibpk,t_r>0?ipk:ibpk)*1e3*1.15||1,cap=ymax;
      var pi=U.plot(x0,196,pw,90,[0,tend*tu],[0,ymax]);
      o.push(pi.axes({xl:"時間 ["+un+"]",yl:"電流 [mA]",xt:tx,yt:U.nice(0,ymax,3),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      o.push(pi.line(pts(3,1e3,cap),"purple",1.6));o.push(pi.line(pts(4,1e3,cap),"gold",2));
      if(t_r===0)o.push(S.T(pi.x+8,pi.y+12,"↑ スイッチの電流のピークは A の桁（軸の外）","start",9,"purple",true,false,null,true));
      var ly=330;
      [["signal","マイコンの側 V_A"],["purple","周辺の側 V_B・スイッチの電流"],["gold","電池の電流"]].forEach(function(l,i){var xx=nar?10:20+i*200,yy=nar?ly+i*16:ly;
        o.push(S.RECT(xx,yy-9,10,10,2,U.soft(l[0]),l[0],1));o.push(S.T(xx+15,yy,l[1],"start",9.5,"muted"));});
      box.set(S.svg(W,nar?ly+40:ly+8,o));
      var den=e-r*im-vm-0.1,need=den>0?r*cl*e/den:Infinity,reset=vmin<vm;
      ro.innerHTML=(t_r>0?"突入電流 C_L V ÷ t_rise ≈ "+F.cur(cl*e/t_r)+"、":"一気に入れる（電荷の分け合いで V_A は "+_w05_v((e-r*im)*ca/(ca+cl))+" まで落ちる計算）、")+
        "マイコンの側の最低 <b>"+_w05_v(vmin)+"</b>（"+F.time(tmin)+" で）、電池の電流の最大 "+F.cur(ibpk)+"<br>"+
        (reset?'<span class="warn">V_min を '+F.time(below)+' 下回り、マイコンはリセットされる</span>':'<span class="ok">V_min を下回らない</span>')+"<br>"+
        "余裕 0.1 V を残すのに要る立ち上がりの時間（3 節の式）: t_rise ≥ R_in C_L E ÷ (E − R_in I_m − V_min − 0.1) = "+(den>0?"<b>"+F.time(need)+"</b>":'<span class="warn">分母が 0 以下で、どれだけゆっくり入れても足りない</span>')+
        "（C_A が電荷を出す分、実際の落ち込みは式より小さい）"+
        '<div class="wnote">負荷スイッチのオン抵抗は 0.1 Ω、周辺は立ち上がりの間は電流を使わないとした。一気に入れたときのスイッチの電流のピークは、配線の抵抗とスイッチの入る速さで決まり、この模型では正しく求まらない。値はすべて例の値。</div>';
    }
    draw();
  };

  /* ---- 5 節: BOR とリセットの繰り返し ---- */
  /* 状態: rst（リセット中）→ por（t_POR を待つ）→ boot（起動の処理 1 ms）→ run（動く）。backoff なら BOR からの起動の後に slp（眠る）を挟む。
     どの状態でも、V が V_BOR を下回ったら rst に戻る（rst 以外から移ったら BOR 1 回）。電圧は後退オイラー法で解く。 */
  function _w05_bsim(o){
    var N=60000,dt=o.tend/N,v=o.Vb,st="rst",tt=0,streak=0,cb=true,sleep=0,resets=0,q=0,tr=[];
    for(var k=0;k<N;k++){
      var I=(st==="rst"||st==="por")?o.Irst:(st==="slp"?o.Islp:o.Irun);
      if(st!=="rst"&&v<o.Vb){st="rst";resets++;cb=true;tt=0;}
      else if(st==="rst"&&v>o.Vb+o.Vh){st="por";tt=0;}
      else if(st==="por"&&tt>=o.tpor){st="boot";tt=0;}
      else if(st==="boot"&&tt>=1e-3){if(o.bo&&cb){streak=Math.min(streak+1,9);sleep=0.05*Math.pow(2,streak-1);st="slp";}else{streak=0;st="run";}cb=false;tt=0;}
      else if(st==="slp"&&tt>=sleep){st="run";tt=0;}
      var nv=(o.C/dt*v+o.E/o.R-I)/(o.C/dt+1/o.R);
      q+=(o.E-nv)/o.R*dt;v=nv;tt+=dt;
      if(k%20===0)tr.push([k*dt,v,st]);
    }
    return {n:resets,iav:q/o.tend,tr:tr};
  }
  REG.w05_bor=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"BOR","BOR のしきい値・ヒステリシスとリセットの繰り返し");
    var r1=U.ctrls(el);
    var E=U.slider(r1,"電池の起電力 E",{min:2.0,max:3.2,step:0.01,value:2.45,fmt:function(v){return _w05_v(v);},onInput:draw});
    var R=U.slider(r1,"内部抵抗 R_in",{min:1,max:300,log:true,value:100,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var C=U.slider(r1,"電源の線の容量",{min:1,max:1000,log:true,value:100,fmt:function(v){return U.sig(v,3)+" µF";},onInput:draw});
    var r2=U.ctrls(el);
    var Irun=U.slider(r2,"動いている間の電流 I_run",{min:0.3,max:20,log:true,value:3,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var Irst=U.slider(r2,"リセット中の電流 I_rst",{min:0.01,max:1,log:true,value:0.1,fmt:function(v){return F.cur(v*1e-3);},onInput:draw});
    var r3=U.ctrls(el);
    var Vb=U.slider(r3,"BOR のしきい値 V_BOR",{min:1.8,max:2.8,step:0.05,value:2.2,fmt:function(v){return _w05_v(v);},onInput:draw});
    var Vh=U.slider(r3,"ヒステリシス V_hys",{min:0.02,max:0.5,step:0.01,value:0.1,fmt:function(v){return U.sig(v*1000,3)+" mV";},onInput:draw});
    var tp=U.slider(r3,"待ち時間 t_POR",{min:0.5,max:20,log:true,value:2,fmt:function(v){return F.time(v*1e-3);},onInput:draw});
    var r4=U.ctrls(el);
    var bo=U.checkbox(r4,"BOR から起動したら眠り、BOR が続くたびに眠る時間を 2 倍にする（50 ms から 12.8 s まで）",false,draw);
    var win=U.select(r4,"表示する時間",["0.1 秒","1 秒","10 秒"],0,draw);
    var br=U.btnrow(el);
    function preset(e,r,h,b,w){E.set(e);R.set(r);C.set(100);Irun.set(3);Irst.set(0.1);Vb.set(2.2);Vh.set(h);tp.set(2);bo.set(b);win.set(w);draw();}
    U.button(br,"5 節 (a) 繰り返す",function(){preset(2.45,100,0.1,false,0);});
    U.button(br,"5 節 (b) 眠る時間を延ばす",function(){preset(2.45,100,0.1,true,1);});
    U.button(br,"ヒステリシス 0.35 V",function(){preset(2.45,100,0.35,false,0);});
    U.button(br,"新しい電池（3.0 V・15 Ω）",function(){preset(3.0,15,0.1,false,0);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var o_={E:E.get(),R:R.get(),C:C.get()*1e-6,Irun:Irun.get()*1e-3,Irst:Irst.get()*1e-3,Vb:Vb.get(),Vh:Vh.get(),tpor:tp.get()*1e-3,bo:bo.get(),Islp:2e-6,tend:[0.1,1,10][win.get()]};
      var r=_w05_bsim(o_),sc=o_.tend<=0.1?1e3:(o_.tend<=1?1e3:1),un=sc===1e3?"ms":"s";
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?400:700,o=[],pw=nar?320:560,x0=nar?62:80;
      var lo=Math.min(o_.Vb-0.15,o_.E-o_.R*o_.Irun-0.05),hi=Math.max(o_.Vb+o_.Vh+0.1,o_.E+0.05);
      var p=U.plot(x0,16,pw,170,[0,o_.tend*sc],[lo,hi]);
      o.push(p.axes({xl:"時間 ["+un+"]",yl:"電源電圧 [V]",xt:U.nice(0,o_.tend*sc,5),yt:U.nice(lo,hi,5),xfmt:function(v){return U.sig(v,3);},yfmt:function(v){return U.sig(v,3);},ylOff:44}));
      var hl=[[o_.Vb,"alias","V_BOR"],[o_.Vb+o_.Vh,"gold","V_BOR + V_hys"],[o_.E-o_.R*o_.Irst,"faint","E − R_in I_rst"],[o_.E-o_.R*o_.Irun,"faint","E − R_in I_run"]];
      hl.forEach(function(h,i){if(h[0]<lo||h[0]>hi)return;o.push(p.line([[0,h[0]],[o_.tend*sc,h[0]]],h[1],1.1,"5 3"));
        var left=i>=2,dy=(i===0||i===3)?12:-4;
        o.push(S.T(left?p.x+4:p.x+p.w-4,p.Y(h[0])+dy,h[2]+" "+_w05_v(h[0]),left?"start":"end",9,h[1]==="faint"?"muted":h[1],false,false,null,true));});
      o.push(p.line(r.tr.map(function(q){return [q[0]*sc,q[1]];}),"signal",1.6));
      /* 状態の帯 */
      var yb=p.y+p.h+38,prev=null,t0=0;
      var put=function(a,b,g){var c={rst:"alias",run:"signal",slp:"green"}[g];o.push(S.RECT(p.X(a*sc),yb,Math.max(p.X(b*sc)-p.X(a*sc),0.6),12,1,U.soft(c),c,0.8));};
      r.tr.forEach(function(q){var g=(q[2]==="rst"||q[2]==="por")?"rst":(q[2]==="slp"?"slp":"run");if(g!==prev){if(prev)put(t0,q[0],prev);prev=g;t0=q[0];}});
      if(prev)put(t0,o_.tend,prev);
      o.push(S.T(p.x-8,yb+10,"状態","end",9.5,"muted"));
      var ly=yb+34;
      [["alias","リセット"],["signal","動く"],["green","眠る"]].forEach(function(l,i){var xx=x0+i*100;o.push(S.RECT(xx,ly-9,10,10,2,U.soft(l[0]),l[0],1));o.push(S.T(xx+15,ly,l[1],"start",9.5,"muted"));});
      box.set(S.svg(W,ly+8,o));
      var a=o_.Vb+o_.Vh+o_.R*o_.Irst,b=o_.Vb+o_.R*o_.Irun,inWin=o_.E>a&&o_.E<b,need=o_.R*(o_.Irun-o_.Irst);
      ro.innerHTML="リセットを繰り返す E の範囲: V_BOR + V_hys + R_in I_rst = "+_w05_v(a)+" ＜ E ＜ V_BOR + R_in I_run = "+_w05_v(b)+
        (a<b?"（いまの E = "+_w05_v(o_.E)+" は"+(inWin?'<span class="warn">範囲の中</span>':"範囲の外")+"）":"（範囲が無い: V_hys ≥ R_in (I_run − I_rst) = "+U.sig(need*1000,3)+" mV）")+"<br>"+
        "リセットの回数 <b>"+r.n+" 回</b>（"+F.time(o_.tend)+" の間）、電池の平均の電流 <b>"+F.cur(r.iav)+"</b>"+
        (o_.E<=o_.Vb+o_.Vh+o_.R*o_.Irst?" ・ リセットが解けない（電池の電圧が V_BOR + V_hys に届かない）":"")+
        '<div class="wnote">起動の処理は 1 ms（I_run）、眠っている間は 2 µA とした。ここでの「動く」は、動き続ける仕事（例: 受信を続ける）を表す。値はすべて例の値で、しきい値の働き方の細部は製品による。</div>';
    }
    draw();
  };

  /* ===== END CHAPTER WIDGETS ===== */

  window.PERIPH=U;
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
