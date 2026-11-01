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
