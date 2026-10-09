/* 暗号と誤り訂正 — 章内インタラクティブ部品 */
(function(){
  "use strict";
  var root=document.documentElement, TAU=Math.PI*2;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var draws=[];
  function redrawAll(){draws.forEach(function(f){try{f();}catch(e){}});}
  window.addEventListener("themechange",function(){requestAnimationFrame(redrawAll);});
  window.addEventListener("resize",function(){requestAnimationFrame(redrawAll);});
  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+k+'</span><span class="t">'+t+'</span>'));}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function slider(row,label,min,max,val,step){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+' <b class="val"></b></label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+step+'">';
    row.appendChild(c);return {input:c.querySelector("input"),val:c.querySelector(".val")};}
  function textin(row,label,val,w){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><input type="text" value="'+val+'" style="font-family:var(--mono);font-size:.85rem;padding:.35rem .5rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:'+(w||"100%")+'">';
    row.appendChild(c);return c.querySelector("input");}
  function button(row,t){var b=mk("button","btn",t);b.setAttribute("aria-pressed","false");row.appendChild(b);return b;}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function panel(el,h){var d=mk("div","wscreen");d.style.padding=".8rem";d.style.overflowX="auto";
    d.style.fontFamily="var(--mono)";d.style.fontSize=".8rem";d.style.lineHeight="1.6";
    if(h)d.style.minHeight=h+"px";el.appendChild(d);return d;}
  function screen(el,h){var s=mk("div","wscreen");s.style.height=h+"px";var c=mk("canvas");s.appendChild(c);el.appendChild(s);return c;}
  function cctx(cv){var ctx=cv.getContext("2d");function fit(){var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));
    cv.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height};}
    return {ctx:ctx,fit:fit};}
  function reg(cv,draw){draws.push(draw);if(cv)new ResizeObserver(draw).observe(cv);}
  function lab(ctx,t,x,y,c,a){ctx.fillStyle=c;ctx.font="11px "+C("--mono");ctx.textAlign=a||"left";ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  /* ---- 追加ヘルパー（グラフ・表） ---- */
  function select(row,label,opts){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:100%">'+
      opts.map(function(o,i){return '<option value="'+i+'">'+o+'</option>';}).join("")+'</select>';
    row.appendChild(c);return c.querySelector("select");}
  function checkbox(row,label,on){var c=mk("div","ctrl");
    c.innerHTML='<label style="cursor:pointer;justify-content:flex-start;align-items:center;gap:.45rem;'+
      'line-height:1.4"><input type="checkbox"'+(on?" checked":"")+
      ' style="flex:none;margin:0;accent-color:var(--signal)"><span>'+label+'</span></label>';
    row.appendChild(c);return c.querySelector("input");}
  function tbl(headers,rows,align){
    var h='<table style="border-collapse:collapse;width:100%"><tr>'+headers.map(function(t,i){
      return '<th style="padding:.25rem .7rem;text-align:'+((align&&align[i])||"left")+
        ';color:var(--muted);font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap">'+t+'</th>';}).join("")+'</tr>';
    rows.forEach(function(r){
      h+='<tr>'+r.map(function(v,i){return '<td style="padding:.22rem .7rem;text-align:'+
        ((align&&align[i])||"left")+';vertical-align:top">'+v+'</td>';}).join("")+'</tr>';});
    return h+'</table>';
  }
  function chart(cc,x0,x1,y0,y1,pad){
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
    var p={l:44,r:14,t:16,b:28};
    if(pad)for(var k in pad)p[k]=pad[k];
    ctx.clearRect(0,0,w,h);
    return {ctx:ctx,w:w,h:h,p:p,
      X:function(x){return p.l+(x-x0)/(x1-x0)*(w-p.l-p.r);},
      Y:function(y){return h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);},x0:x0,x1:x1,y0:y0,y1:y1};
  }
  function grid(c,ny){var ctx=c.ctx;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
    for(var i=0;i<=ny;i++){var yy=c.p.t+i/ny*(c.h-c.p.t-c.p.b);
      ctx.beginPath();ctx.moveTo(c.p.l,yy);ctx.lineTo(c.w-c.p.r,yy);ctx.stroke();}}
  function axis(c){var ctx=c.ctx;ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(c.p.l,c.h-c.p.b);ctx.lineTo(c.w-c.p.r,c.h-c.p.b);ctx.stroke();}
  function dot(c,x,y,r,col,st){var ctx=c.ctx;ctx.beginPath();ctx.arc(c.X(x),c.Y(y),r,0,TAU);
    if(st){ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}
  function rrect(ctx,x,y,w,h,r){ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  function f(x,d){return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);}
  function pline(c,pts,col,lw,dash){var ctx=c.ctx;ctx.strokeStyle=col;ctx.lineWidth=lw||2.2;
    if(dash)ctx.setLineDash(dash);ctx.beginPath();
    pts.forEach(function(q,i){i?ctx.lineTo(c.X(q[0]),c.Y(q[1])):ctx.moveTo(c.X(q[0]),c.Y(q[1]));});
    ctx.stroke();ctx.setLineDash([]);}
  var REG={};

  /* ---------- 01: ユークリッドの互除法 ---------- */
  REG.euclid=function(el){
    head(el,"Euclid","割り算を繰り返して GCD と逆元を求める");
    var row=ctrls(el);
    var ia=textin(row,"a",1071,"110px"), ib=textin(row,"b",462,"110px");
    var out=panel(el), rd=readout(el);
    function run(){
      var a=Math.abs(parseInt(ia.value)||0), b=Math.abs(parseInt(ib.value)||0);
      if(a<1||b<1){out.innerHTML="正の整数を入力してください";rd.innerHTML="";return;}
      var A=a,B=b, rows=[], x0=1,x1=0,y0=0,y1=1, guard=0;
      while(b>0 && guard++<200){
        var q=Math.floor(a/b), r=a%b;
        rows.push([a,b,q,r,x0,y0]);
        var nx=x0-q*x1, ny=y0-q*y1;
        x0=x1;x1=nx;y0=y1;y1=ny;
        a=b;b=r;
      }
      var g=a, x=x0, y=y0;
      rows.push([g,0,"—","—",x,y]);   // 停止した行 (b=0) — ここの a が gcd
      var h='<div style="color:var(--muted);margin-bottom:.4rem">各行の x, y は <b>その行の a</b> を '+
        A+'x + '+B+'y と表したもの。b が 0 になった行の a が gcd。</div>'+
        '<table style="border-collapse:collapse"><tr>'+
        ["a","b","商 q","余り r","x","y"].map(function(t){return '<th style="padding:.2rem .6rem;text-align:right;color:var(--muted);font-weight:600">'+t+'</th>';}).join("")+'</tr>';
      rows.forEach(function(r,i){
        h+='<tr'+(i===rows.length-1?' style="color:var(--signal);font-weight:700"':'')+'>'+
          r.map(function(v){return '<td style="padding:.2rem .6rem;text-align:right">'+v+'</td>';}).join("")+'</tr>';
      });
      h+='</table>';
      out.innerHTML=h;
      var ok=(A*x+B*y===g);
      rd.innerHTML='gcd('+A+','+B+') = <b>'+g+'</b> ／ ベズー: '+A+'×('+x+') + '+B+'×('+y+') = <b>'+(A*x+B*y)+'</b> '+(ok?'<span class="ok">✓</span>':'')+
        (g===1?' ／ '+A+'⁻¹ mod '+B+' = <b class="ok">'+((x%B)+B)%B+'</b>':' ／ <span class="warn">互いに素でないので逆元なし</span>');
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 01: 繰り返し二乗法 ---------- */
  REG.powmod=function(el){
    head(el,"Fast Power","べき乗を O(log e) で計算する");
    var row=ctrls(el);
    var ib=textin(row,"底 a",7,"90px"), ie=textin(row,"指数 e",560,"90px"), im=textin(row,"法 n",561,"90px");
    var out=panel(el), rd=readout(el);
    function run(){
      var a=parseInt(ib.value)||0, e=parseInt(ie.value)||0, n=parseInt(im.value)||1;
      if(n<2||e<0){out.innerHTML="n≥2, e≥0 を入力";return;}
      var bits=e.toString(2), res=1, base=a%n, steps=[];
      var ee=e, i=0;
      while(ee>0){
        var bit=ee&1;
        steps.push([i, bit, base, bit?((res*base)%n):res]);
        if(bit)res=(res*base)%n;
        base=(base*base)%n; ee>>=1; i++;
      }
      var h='<div style="margin-bottom:.4rem">e = '+e+' = <b>'+bits+'</b>₂ （'+bits.length+' ビット → 掛け算は約 '+bits.length+' 回）</div>';
      h+='<table style="border-collapse:collapse"><tr>'+
        ["i","eのbit","a^(2^i) mod n","積算結果"].map(function(t){return '<th style="padding:.2rem .6rem;text-align:right;color:var(--muted)">'+t+'</th>';}).join("")+'</tr>';
      steps.forEach(function(s){
        h+='<tr'+(s[1]?' style="color:var(--signal)"':' style="opacity:.5"')+'>'+
          s.map(function(v){return '<td style="padding:.15rem .6rem;text-align:right">'+v+'</td>';}).join("")+'</tr>';
      });
      h+='</table>';
      out.innerHTML=h;
      var naive=e;
      rd.innerHTML=a+'^'+e+' mod '+n+' = <b>'+res+'</b> ／ 素朴に掛けると <b>'+naive+'</b> 回、繰り返し二乗法なら <b class="ok">'+bits.length+'</b> 回'+
        (res===1&&e===n-1?' ／ <span class="ok">a^(n-1)≡1: フェルマー・テスト通過</span>':'');
    }
    [ib,ie,im].forEach(function(x){x.addEventListener("input",run);});reg(null,run);run();
  };

  /* ---------- 03: GF(p) 演算表 ---------- */
  REG.gftable=function(el){
    head(el,"剰余の演算表","法が素数のときだけ乗法表の各行に 1 が現れる = 体になる");
    var row=ctrls(el);
    var sp=slider(row,"法",2,17,5,1);
    var out=panel(el), rd=readout(el);
    function isPrime(n){if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true;}
    function run(){
      var p=+sp.input.value; sp.val.textContent=p+(isPrime(p)?"（素数）":"（合成数）");
      var h='<div style="display:flex;gap:1.4rem;flex-wrap:wrap">';
      [["加法 +",function(a,b){return (a+b)%p;}],["乗法 ×",function(a,b){return (a*b)%p;}]].forEach(function(t){
        h+='<div><div style="color:var(--muted);margin-bottom:.3rem">'+t[0]+' mod '+p+'</div><table style="border-collapse:collapse">';
        h+='<tr><th style="padding:.15rem .4rem;color:var(--faint)">'+t[0][t[0].length-1]+'</th>';
        for(var j=0;j<p;j++)h+='<th style="padding:.15rem .4rem;color:var(--faint)">'+j+'</th>';
        h+='</tr>';
        for(var i=0;i<p;i++){
          h+='<tr><th style="padding:.15rem .4rem;color:var(--faint)">'+i+'</th>';
          for(var j2=0;j2<p;j2++){
            var v=t[1](i,j2);
            var hi=(t[0][0]==="乗"&&v===1&&i>0);
            h+='<td style="padding:.15rem .4rem;text-align:center;'+(hi?'background:var(--signal);color:var(--panel);font-weight:700;border-radius:4px':'')+'">'+v+'</td>';
          }
          h+='</tr>';
        }
        h+='</table></div>';
      });
      h+='</div>';
      out.innerHTML=h;
      var noinv=[];
      for(var a=1;a<p;a++){var found=false;for(var b=1;b<p;b++)if((a*b)%p===1)found=true;if(!found)noinv.push(a);}
      rd.innerHTML='法 = <b>'+p+'</b> ／ '+(isPrime(p)
        ? '<span class="ok">素数 → 0 以外の全要素が逆元を持つ（乗法表の各行に緑の 1 がある）= 体 GF('+p+')</span>'
        : '<span class="warn">合成数 → 逆元を持たない要素: '+noinv.join(", ")+' → Z_'+p+' は体でない</span>');
    }
    sp.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 03: 原始元と離散対数 ---------- */
  REG.primroot=function(el){
    head(el,"Primitive Root","べき乗が全要素を巡るか");
    var row=ctrls(el);
    var sp=slider(row,"素数 p",5,29,7,1), sg=slider(row,"底 g",2,28,3,1);
    var out=panel(el), rd=readout(el);
    function isPrime(n){if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true;}
    function run(){
      var p=+sp.input.value; while(!isPrime(p)&&p<30)p++;
      var g=+sg.input.value % p; if(g<2)g=2;
      sp.val.textContent=p; sg.val.textContent=g;
      var seen={}, seq=[], v=1;
      for(var i=1;i<=p-1;i++){v=(v*g)%p;seq.push(v);seen[v]=true;}
      var cnt=Object.keys(seen).length, prim=(cnt===p-1);
      var h='<div style="margin-bottom:.4rem">g^1, g^2, … , g^'+(p-1)+' mod '+p+'</div><div style="display:flex;flex-wrap:wrap;gap:.25rem">';
      seq.forEach(function(x,i){
        h+='<span style="padding:.2rem .5rem;border-radius:6px;background:'+(x===1?"var(--alias)":"var(--signal-soft)")+
           ';color:'+(x===1?"var(--panel)":"var(--ink)")+';font-weight:'+(x===1?"700":"400")+'">'+x+'</span>';
      });
      h+='</div>';
      out.innerHTML=h;
      rd.innerHTML='g = <b>'+g+'</b>, p = <b>'+p+'</b> ／ 出た相異なる値: <b>'+cnt+'</b> / '+(p-1)+' ／ '+
        (prim?'<span class="ok">原始元 ✓ 全要素を巡るので離散対数が定義できる</span>'
             :'<span class="warn">原始元でない（周期 '+cnt+' で閉じてしまう）</span>');
    }
    sp.input.addEventListener("input",run);sg.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 04: 多項式除算 ---------- */
  /* 多項式の筆算を HTML にする（polydiv と本文中の静的な筆算 longdiv で共用） */
  function longDiv(A,B){
    var a=A.split("").map(Number), b=B.split("").map(Number);
    while(b[0]===0)b.shift();
    var n=a.length, m=b.length, work=a.slice(), q=[], rows=[], first=true;
    /* rows: {c:列→文字, cls:列→class, lab:左ラベル} */
    function blank(){return {c:{},cls:{},lab:""};}
    for(var i=0;i+m<=n;i++){
      if(work[i]===1){
        q.push(1);
        if(!first){var R=blank();for(var k=i;k<i+m;k++)R.c[k]=work[k];rows.push(R);}
        first=false;
        var S=blank();S.lab="⊕";
        for(var k2=0;k2<m;k2++){S.c[i+k2]=b[k2];S.cls[i+k2]="pd-sub";}
        rows.push(S);
        for(var j=0;j<m;j++)work[i+j]^=b[j];
      } else q.push(0);
    }
    var rs=Math.max(0,n-m+1), rem=work.slice(rs);
    var F=blank();F.lab="余り";
    if(rem.length){for(var r=rs;r<n;r++){F.c[r]=work[r];F.cls[r]="pd-rem";}}
    else{F.c[n-1]=0;F.cls[n-1]="pd-rem";}
    rows.push(F);
    var cell='display:inline-block;width:1.5em;text-align:center;';
    function line(labHtml,labSty,cells){
      return '<div style="display:flex;align-items:stretch;white-space:nowrap">'+
        '<span style="display:inline-block;min-width:'+Math.max(m*1.5+1.2,3.4)+'em;text-align:right;padding-right:.35em;'+labSty+'">'+labHtml+'</span>'+cells+'</div>';
    }
    var h='', qc='', qstart=q.indexOf(1);
    for(var c=0;c<n;c++){
      var qi=c-(m-1), v=(qi>=0&&qi<q.length&&qstart>=0&&qi>=qstart)?q[qi]:"";
      qc+='<span style="'+cell+'color:var(--blue);font-weight:700">'+v+'</span>';
    }
    h+=line('<span style="color:var(--faint)">商</span>','',qc);
    var dc='';
    for(var c2=0;c2<n;c2++)dc+='<span style="'+cell+'border-top:1.5px solid var(--ink)">'+a[c2]+'</span>';
    h+=line(b.join("")+' <span style="display:inline-block;transform:scaleY(1.35);font-weight:300">)</span>','',dc);
    rows.forEach(function(R){
      var cs='';
      for(var c3=0;c3<n;c3++){
        var has=(c3 in R.c), st=cell;
        if(R.cls[c3]==="pd-sub")st+='border-bottom:1.5px solid var(--ink);color:var(--muted);';
        if(R.cls[c3]==="pd-rem")st+='color:var(--signal);font-weight:700;';
        cs+='<span style="'+st+'">'+(has?R.c[c3]:"")+'</span>';
      }
      h+=line(R.lab,'color:var(--faint)',cs);
    });
    return {html:h, q:q.slice(Math.max(0,qstart)), rem:rem};
  }
  function polyStr(bits){
    var d=bits.length-1, t=[];
    bits.forEach(function(v,k){if(v){var e=d-k;t.push(e===0?"1":e===1?"x":"x<sup>"+e+"</sup>");}});
    return t.length?t.join(" + "):"0";
  }
  REG.polydiv=function(el){
    head(el,"Poly Division","GF(2) 上の割り算 = XOR の筆算");
    var row=ctrls(el);
    var ia=textin(row,"被除数（2進）","1101000","150px"), ib=textin(row,"除数（2進）","1011","110px");
    var out=panel(el), rd=readout(el);
    function run(){
      var A=(ia.value||"").replace(/[^01]/g,""), B=(ib.value||"").replace(/[^01]/g,"");
      if(!A||!B||B.indexOf("1")<0){out.innerHTML="0/1 で入力してください";rd.innerHTML="";return;}
      var R=longDiv(A,B);
      out.innerHTML=R.html;
      rd.innerHTML='商 = <b>'+(R.q.join("")||"0")+'</b>（'+polyStr(R.q)+'） ／ 余り = <b class="ok">'+(R.rem.join("")||"0")+'</b>（'+polyStr(R.rem)+'）'+
        (R.rem.indexOf(1)<0?' ／ <span class="ok">割り切れた（= 正しい符号語）</span>':' ／ <span class="warn">余りが 0 でない（= 誤りあり）</span>');
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };
  /* 本文中の静的な筆算（build_site.py が ```longdiv ブロックから data-a/data-b 付きで出力） */
  REG.longdiv=function(el){
    var out=panel(el);
    out.style.display="inline-block";
    out.innerHTML=longDiv(el.getAttribute("data-a"),el.getAttribute("data-b")).html;
  };

  /* ---------- 04: 既約判定（既約多項式で順に割る） ---------- */
  REG.irred=function(el){
    head(el,"Irreducibility","低い次数の既約多項式で順に割ってみる");
    var row=ctrls(el);
    var ia=textin(row,"f（2進）","10101","150px");
    var out=panel(el), rd=readout(el);
    function deg(a){return a.toString(2).length-1;}
    function mod(a,b){var db=deg(b);while(a&&deg(a)>=db)a^=b<<(deg(a)-db);return a;}
    function div(a,b){var q=0,db=deg(b);while(a&&deg(a)>=db){var s=deg(a)-db;q|=1<<s;a^=b<<s;}return q;}
    function poly(a){if(!a)return "0";var d=deg(a),t=[];for(var e=d;e>=0;e--)if((a>>e)&1)t.push(e===0?"1":e===1?"x":"x<sup>"+e+"</sup>");return t.join("+");}
    function irrUpTo(D){var L=[];for(var d=1;d<=D;d++)for(var g=1<<d;g<(1<<(d+1));g++){
      if(L.every(function(h){return deg(h)*2>d||mod(g,h)!==0;}))L.push(g);}return L;}
    var th='style="padding:.15rem .7rem;text-align:right;color:var(--muted);font-weight:600"', td='style="padding:.15rem .7rem;text-align:right"';
    function run(){
      var A=(ia.value||"").replace(/[^01]/g,"").replace(/^0+/,"");
      if(!A||A.length<2||A.length>21){out.innerHTML="次数 1〜20 の多項式を 0/1 で入力してください";rd.innerHTML="";return;}
      var f=parseInt(A,2), n=deg(f), D=Math.floor(n/2);
      var cand=irrUpTo(D), found=null;
      var h='<div style="margin-bottom:.4rem">f = '+poly(f)+'（次数 '+n+'）→ 次数 '+D+' 以下の既約多項式 '+cand.length+' 個で割る</div>';
      h+='<table style="border-collapse:collapse"><tr><th '+th+'>割る多項式 g</th><th '+th+'>ビット</th><th '+th+'>余り</th><th '+th+'>結果</th></tr>';
      cand.forEach(function(g){
        var r=mod(f,g), hit=(r===0);
        if(hit&&!found)found=g;
        h+='<tr><td '+td+'>'+poly(g)+'</td><td '+td+'>'+g.toString(2)+'</td><td '+td+'>'+poly(r)+'</td><td '+td+'>'+
          (hit?'<span style="color:var(--alias);font-weight:700">割り切れる</span>':'<span style="color:var(--faint)">割り切れない</span>')+'</td></tr>';
      });
      h+='</table>';
      if(!cand.length)h='<div>次数 1 の多項式は常に既約（試す相手が無い）</div>';
      out.innerHTML=h;
      rd.innerHTML=found?'<span class="warn">可約</span>: f = ('+poly(found)+') × ('+poly(div(f,found))+')'
                        :'<span class="ok">既約</span>: どれでも割り切れない';
    }
    ia.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 05: GF(2^m) のべき表 ---------- */
  REG.gf2m=function(el){
    head(el,"GF(2^m)","α のべき乗が全要素を巡る");
    var row=ctrls(el);
    var polys=[["x³+x+1 (0x0B)",0x0B,3],["x³+x²+1 (0x0D)",0x0D,3],["x⁴+x+1 (0x13)",0x13,4],["x⁴+x³+x²+x+1 (0x1F)",0x1F,4]];
    var sel=mk("div","ctrl"); sel.innerHTML='<label>既約多項式</label><select style="font-family:var(--mono);font-size:.82rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink)">'+
      polys.map(function(p,i){return '<option value="'+i+'">'+p[0]+'</option>';}).join("")+'</select>';
    row.appendChild(sel); var sl=sel.querySelector("select");
    var out=panel(el), rd=readout(el);
    function run(){
      var P=polys[+sl.value], poly=P[1], m=P[2], N=(1<<m)-1;
      var v=1, rows=[], seen={};
      for(var i=0;i<=N;i++){
        rows.push([i, v, v.toString(2).padStart(m,"0")]);
        if(i<N)seen[v]=true;
        v<<=1; if(v & (1<<m)) v^=poly;
      }
      var cnt=Object.keys(seen).length, prim=(cnt===N);
      var h='<table style="border-collapse:collapse"><tr>'+
        ["べき","10進","ビット"].map(function(t){return '<th style="padding:.2rem .8rem;color:var(--muted);text-align:right">'+t+'</th>';}).join("")+'</tr>';
      rows.forEach(function(r,i){
        var last=(i===rows.length-1);
        h+='<tr'+(last?' style="color:var(--alias);font-weight:700"':'')+'>'+
          '<td style="padding:.15rem .8rem;text-align:right">α^'+r[0]+'</td>'+
          '<td style="padding:.15rem .8rem;text-align:right">'+r[1]+'</td>'+
          '<td style="padding:.15rem .8rem;text-align:right;letter-spacing:.15em">'+r[2]+'</td></tr>';
      });
      h+='</table>';
      out.innerHTML=h;
      rd.innerHTML='要素数 2^'+m+' = <b>'+(1<<m)+'</b> ／ α の巡回で出た非零要素: <b>'+cnt+'</b> / '+N+' ／ '+
        (prim?'<span class="ok">原始多項式 ✓ α^'+N+'=1 で一周し全要素を尽くす</span>'
             :'<span class="warn">既約だが原始でない（周期 '+cnt+'）→ LFSR や RS では最長周期にならない</span>');
    }
    sl.addEventListener("change",run);reg(null,run);run();
  };

  /* ---------- 06: ハミング距離と球 ---------- */
  REG.hamdist=function(el){
    head(el,"Distance","距離が離れているほど直せる");
    var cv=screen(el,230),cc=cctx(cv);var row=ctrls(el);
    var sd=slider(row,"最小距離 d",1,9,5,1);
    var out=readout(el);
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var dm=+sd.input.value; sd.val.textContent=dm;
      var t=Math.floor((dm-1)/2), det=dm-1;
      var cy=h/2, x1=w*0.28, x2=w*0.72, R=(x2-x1)/dm*t;
      // 2つの符号語
      [[x1,"c₁"],[x2,"c₂"]].forEach(function(p){
        if(R>0){ctx.fillStyle=C("--signal-soft");ctx.beginPath();ctx.arc(p[0],cy,R,0,TAU);ctx.fill();
          ctx.strokeStyle=C("--signal");ctx.setLineDash([4,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p[0],cy,R,0,TAU);ctx.stroke();ctx.setLineDash([]);}
        ctx.fillStyle=C("--signal");ctx.beginPath();ctx.arc(p[0],cy,6,0,TAU);ctx.fill();
        lab(ctx,p[1],p[0],cy+24,C("--signal"),"center");
      });
      // 距離の目盛り
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x1,cy-R-22);ctx.lineTo(x2,cy-R-22);ctx.stroke();
      for(var i=0;i<=dm;i++){var xx=x1+(x2-x1)*i/dm;
        ctx.beginPath();ctx.moveTo(xx,cy-R-26);ctx.lineTo(xx,cy-R-18);ctx.stroke();
        if(i>0&&i<dm){ctx.fillStyle=C("--faint");ctx.beginPath();ctx.arc(xx,cy,2.5,0,TAU);ctx.fill();}
      }
      lab(ctx,"d = "+dm+" ビット離れている",(x1+x2)/2,cy-R-32,C("--muted"),"center");
      if(R>0)lab(ctx,"半径 t="+t+" の球",x1,cy-R-6,C("--signal"),"center");
      out.innerHTML='d = <b>'+dm+'</b> ／ 検出 <b class="ok">'+det+'</b> ビットまで ／ 訂正 <b class="ok">'+t+'</b> ビットまで（t=⌊(d−1)/2⌋）'+
        (t===0?' ／ <span class="warn">球が作れないので訂正不可（検出のみ）</span>':' ／ 2 つの球が重ならないので、球の中に落ちた受信語は中心へ訂正できる');
    }
    sd.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 08: ハミング符号 ---------- */
  REG.hamming=function(el){
    head(el,"Hamming (7,4)","シンドロームがそのまま誤り位置");
    var row=ctrls(el);
    var im=textin(row,"情報語 4 ビット","1011","90px");
    var se=slider(row,"誤り位置（0=なし）",0,7,5,1);
    var out=panel(el), rd=readout(el);
    // H の列 = 1..7 の2進 (3行7列), 位置 i は列 i
    function run(){
      var m=(im.value||"").replace(/[^01]/g,"").slice(0,4).padStart(4,"0");
      var d=m.split("").map(Number);
      // 位置1..7, パリティ位置=1,2,4
      var c=new Array(8).fill(0);
      c[3]=d[0];c[5]=d[1];c[6]=d[2];c[7]=d[3];
      c[1]=c[3]^c[5]^c[7];
      c[2]=c[3]^c[6]^c[7];
      c[4]=c[5]^c[6]^c[7];
      var code=c.slice(1).join("");
      var ep=+se.input.value; se.val.textContent=ep===0?"なし":ep;
      var r=c.slice();
      if(ep>0)r[ep]^=1;
      var recv=r.slice(1).join("");
      var s1=r[1]^r[3]^r[5]^r[7], s2=r[2]^r[3]^r[6]^r[7], s4=r[4]^r[5]^r[6]^r[7];
      var syn=s4*4+s2*2+s1;
      var fixed=r.slice(); if(syn>0)fixed[syn]^=1;
      function bits(arr,hi){return arr.slice(1).map(function(v,i){
        var pos=i+1, isP=(pos===1||pos===2||pos===4);
        var mark=(hi&&pos===hi);
        return '<span style="display:inline-block;width:1.6em;text-align:center;border-radius:4px;'+
          (mark?'background:var(--alias);color:var(--panel);font-weight:700;':(isP?'color:var(--muted);':''))+'">'+v+'</span>';
      }).join("");}
      var h='<div>位置　　: <span style="color:var(--faint)">'+[1,2,3,4,5,6,7].map(function(p){return '<span style="display:inline-block;width:1.6em;text-align:center">'+p+'</span>';}).join("")+'</span></div>';
      h+='<div>送信符号語: '+bits(c)+'　<span style="color:var(--faint)">（灰字がパリティ位置 1,2,4）</span></div>';
      h+='<div>受信語　　: '+bits(r,ep>0?ep:0)+'</div>';
      h+='<div style="margin-top:.4rem">シンドローム: s₄s₂s₁ = '+s4+s2+s1+'₂ = <b>'+syn+'</b></div>';
      h+='<div>訂正後　　: '+bits(fixed)+'</div>';
      out.innerHTML=h;
      var ok=(fixed.join("")===c.join(""));
      rd.innerHTML=(ep===0
        ? 'シンドローム <b>0</b> → <span class="ok">誤り無し</span>'
        : 'シンドロームを 2 進数として読むと <b class="ok">'+syn+'</b> = 誤り位置 '+ep+' と一致 ✓ → 訂正 '+(ok?'<span class="ok">成功</span>':'失敗'));
    }
    im.addEventListener("input",run);se.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 09: CRC ---------- */
  REG.crc=function(el){
    head(el,"CRC","データを多項式で割った余りを付ける");
    var row=ctrls(el);
    var im=textin(row,"データ（2進）","1101","120px");
    var ig=textin(row,"生成多項式 g","1011","110px");
    var out=panel(el), rd=readout(el);
    function divide(bits,g){
      var n=bits.length,m=g.length,work=bits.slice(),steps=[];
      for(var i=0;i+m<=n;i++){
        if(work[i]===1){
          var sub=new Array(n).fill(0);
          for(var j=0;j<m;j++)sub[i+j]=g[j];
          for(var k=0;k<n;k++)work[k]^=sub[k];
          steps.push([i,sub.join(""),work.join("")]);
        }
      }
      return {rem:work.slice(n-m+1),steps:steps,work:work};
    }
    function run(){
      var M=(im.value||"").replace(/[^01]/g,""), G=(ig.value||"").replace(/[^01]/g,"");
      if(!M||!G||G[0]!=="1"){out.innerHTML="データと g を 2 進で入力（g の先頭は 1）";rd.innerHTML="";return;}
      var g=G.split("").map(Number), r=g.length-1;
      var padded=M.split("").map(Number).concat(new Array(r).fill(0));
      var res=divide(padded,g);
      var rem=res.rem.join("");
      var T=M+rem;
      var chk=divide(T.split("").map(Number),g);
      var h='<div style="color:var(--muted)">① データを '+r+' ビット左シフト</div>';
      h+='<div style="letter-spacing:.2em;margin-bottom:.4rem">'+M+'<span style="color:var(--alias)">'+"0".repeat(r)+'</span></div>';
      h+='<div style="color:var(--muted)">② g で割る（XOR の筆算）</div>';
      res.steps.forEach(function(s){
        h+='<div><span style="color:var(--faint)">XOR </span><span style="letter-spacing:.2em">'+s[1]+'</span></div>';
        h+='<div><span style="color:var(--faint)">  → </span><span style="letter-spacing:.2em">'+s[2]+'</span></div>';
      });
      h+='<div style="color:var(--muted);margin-top:.4rem">③ 余りをデータの後ろに付ける</div>';
      h+='<div style="letter-spacing:.2em;font-weight:700">'+M+'<span style="color:var(--signal)">'+rem+'</span></div>';
      out.innerHTML=h;
      rd.innerHTML='CRC = <b class="ok">'+rem+'</b>（'+r+' ビット）／ 送信符号語 = <b>'+T+'</b> ／ 受信側で g で割ると余り = <b>'+chk.rem.join("")+'</b> '+
        (chk.rem.indexOf(1)<0?'<span class="ok">✓ 割り切れる</span>':'');
    }
    im.addEventListener("input",run);ig.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 09: バースト誤りの検出 ---------- */
  REG.crcburst=function(el){
    head(el,"Burst Detection","長さ r 以下のバーストは 100% 検出");
    var row=ctrls(el);
    var ig=textin(row,"生成多項式 g","10011","110px");
    var sp=slider(row,"バースト開始位置",0,10,3,1);
    var sb=slider(row,"バースト長",1,10,4,1);
    var out=panel(el), rd=readout(el);
    function divrem(bits,g){var n=bits.length,m=g.length,w=bits.slice();
      for(var i=0;i+m<=n;i++)if(w[i]===1)for(var j=0;j<m;j++)w[i+j]^=g[j];
      return w.slice(n-m+1);}
    function run(){
      var G=(ig.value||"").replace(/[^01]/g,""); if(!G||G[0]!=="1"){out.innerHTML="g を入力";return;}
      var g=G.split("").map(Number), r=g.length-1;
      var M="11010110"; // 固定データ
      var padded=M.split("").map(Number).concat(new Array(r).fill(0));
      var rem=divrem(padded,g);
      var T=M.split("").map(Number).concat(rem);
      var n=T.length;
      var st=Math.min(+sp.input.value,n-1), bl=Math.min(+sb.input.value,n-st);
      sp.val.textContent=st; sb.val.textContent=bl+" ビット";
      // バースト: 両端は必ず反転、中は交互(決定的)にする
      var E=new Array(n).fill(0);
      for(var i=0;i<bl;i++){ if(i===0||i===bl-1) E[st+i]=1; else E[st+i]=(i%2); }
      var R=T.map(function(v,i){return v^E[i];});
      var s=divrem(R,g);
      var detected=(s.indexOf(1)>=0);
      function show(arr,mark){return arr.map(function(v,i){
        var m=mark&&mark[i];
        return '<span style="display:inline-block;width:1.35em;text-align:center;border-radius:3px;'+(m?'background:var(--alias);color:var(--panel);font-weight:700':'')+'">'+v+'</span>';}).join("");}
      var h='<div>送信: '+show(T)+'</div>';
      h+='<div>誤り: '+show(E,E)+'</div>';
      h+='<div>受信: '+show(R,E)+'</div>';
      h+='<div style="margin-top:.4rem">g で割った余り: <b>'+s.join("")+'</b></div>';
      out.innerHTML=h;
      rd.innerHTML='g の次数 r = <b>'+r+'</b>、バースト長 = <b>'+bl+'</b> ／ '+
        (detected?'<span class="ok">検出 ✓</span>':'<span class="warn">見逃し（余り 0 = 誤りが g の倍数）</span>')+
        (bl<=r?' ／ 理論: 長さ ≤ r なので<b class="ok">必ず検出される</b>':' ／ 理論: 長さ > r なので<span class="warn">見逃す可能性がある</span>');
    }
    ig.addEventListener("input",run);sp.input.addEventListener("input",run);sb.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 13: LFSR ---------- */
  REG.lfsr=function(el){
    head(el,"LFSR","特性多項式が原始なら最長周期");
    var row=ctrls(el);
    var polys=[["x⁴+x+1（原始）",0b10011,4],["x⁴+x³+x²+x+1（既約・非原始）",0b11111,4],["x⁴+x²+1（可約）",0b10101,4],["x⁵+x²+1（原始）",0b100101,5]];
    var sel=mk("div","ctrl");
    sel.innerHTML='<label>特性多項式</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink)">'+
      polys.map(function(p,i){return '<option value="'+i+'">'+p[0]+'</option>';}).join("")+'</select>';
    row.appendChild(sel); var sl=sel.querySelector("select");
    var out=panel(el), rd=readout(el);
    function run(){
      var P=polys[+sl.value], poly=P[1], L=P[2], mask=(1<<L)-1;
      // 状態は L ビット。bit0 = 最も古い = 今回の出力、bit(L-1) = 最新。
      // 帰還ビット = Σ c_j s_{n+j} (j=0..L-1)、c_j は特性多項式の係数 = poly の bit j。
      var fbmask = poly & mask;
      var state=1, seen={}, seq=[], states=[], period=0, guard=0;
      while(guard++ < 300){
        if(seen[state]){period=guard-1;break;}
        seen[state]=true;
        states.push(state.toString(2).padStart(L,"0"));
        var v=fbmask & state, fb=0;
        while(v){fb^=v&1;v>>=1;}
        seq.push(state&1);
        state=((state>>1)|(fb<<(L-1)))&mask;
      }
      var maxp=(1<<L)-1;
      var h='<div style="color:var(--muted);margin-bottom:.3rem">状態の遷移（初期 '+"0".repeat(L-1)+'1）</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.25rem">';
      states.forEach(function(s,i){h+='<span style="padding:.15rem .4rem;border-radius:5px;background:var(--signal-soft);letter-spacing:.1em">'+s+'</span>';});
      h+='</div><div style="color:var(--muted);margin-top:.5rem">出力ビット列</div><div style="letter-spacing:.2em;word-break:break-all">'+seq.join("")+'</div>';
      out.innerHTML=h;
      rd.innerHTML='L = <b>'+L+'</b>、周期 = <b>'+period+'</b> / 最大 '+maxp+' ／ '+
        (period===maxp?'<span class="ok">M 系列（最長周期）✓ 原始多項式</span>':'<span class="warn">周期が短い（原始多項式でない）</span>')+
        ' ／ <span class="warn">※ '+(2*L)+' ビット観測されれば解読される（バーレカンプ・マッシー）</span>';
    }
    sl.addEventListener("change",run);reg(null,run);run();
  };

  /* ---------- 14: AES S-box ---------- */
  REG.aesbox=function(el){
    head(el,"AES S-box","GF(2^8) の逆元 + アフィン変換");
    var row=ctrls(el);
    var sv=slider(row,"入力バイト",0,255,0x53,1);
    var out=panel(el), rd=readout(el);
    function gmul(a,b){var p=0;for(var i=0;i<8;i++){if(b&1)p^=a;var hi=a&0x80;a=(a<<1)&0xFF;if(hi)a^=0x1B;b>>=1;}return p;}
    function ginv(a){if(a===0)return 0;var r=1;for(var i=0;i<254;i++)r=gmul(r,a);return r;}
    function sbox(a){var b=ginv(a),c=0;
      for(var i=0;i<8;i++){var bit=((b>>i)&1)^((b>>((i+4)%8))&1)^((b>>((i+5)%8))&1)^((b>>((i+6)%8))&1)^((b>>((i+7)%8))&1)^((0x63>>i)&1);c|=bit<<i;}
      return c;}
    function hex(v){return "0x"+v.toString(16).toUpperCase().padStart(2,"0");}
    function run(){
      var a=+sv.input.value; sv.val.textContent=hex(a);
      var inv=ginv(a), s=sbox(a);
      var h='<div>入力　　　　　: <b>'+hex(a)+'</b> = '+a.toString(2).padStart(8,"0")+'₂</div>';
      h+='<div>① GF(2⁸) 逆元 : <b style="color:var(--signal)">'+hex(inv)+'</b> = '+inv.toString(2).padStart(8,"0")+'₂'+
         (a!==0?'　<span style="color:var(--faint)">検算: '+hex(a)+'×'+hex(inv)+' = '+hex(gmul(a,inv))+'</span>':'　<span style="color:var(--faint)">（0 は例外的に 0）</span>')+'</div>';
      h+='<div>② アフィン変換: <b style="color:var(--alias)">'+hex(s)+'</b> = '+s.toString(2).padStart(8,"0")+'₂</div>';
      out.innerHTML=h;
      rd.innerHTML='S-box('+hex(a)+') = <b class="ok">'+hex(s)+'</b> ／ 逆元写像は差分確率の最大値が 4/256 = 2⁻⁶ で理論最良に近い（差分解読法への耐性）';
    }
    sv.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 16: RSA ---------- */
  REG.rsa=function(el){
    head(el,"RSA","小さな素数で全手順をたどる");
    var row=ctrls(el);
    var ip=textin(row,"素数 p",61,"80px"), iq=textin(row,"素数 q",53,"80px"),
        ie=textin(row,"公開指数 e",17,"80px"), im=textin(row,"平文 M",65,"80px");
    var out=panel(el), rd=readout(el);
    function isPrime(n){if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true;}
    function egcd(a,b){if(b===0)return [a,1,0];var r=egcd(b,a%b);return [r[0],r[2],r[1]-Math.floor(a/b)*r[2]];}
    function powmod(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=(r*b)%m;b=(b*b)%m;e=Math.floor(e/2);}return r;}
    function run(){
      var p=parseInt(ip.value)||0,q=parseInt(iq.value)||0,e=parseInt(ie.value)||0,M=parseInt(im.value)||0;
      if(!isPrime(p)||!isPrime(q)||p===q){out.innerHTML='<span style="color:var(--alias)">p, q は相異なる素数にしてください</span>';rd.innerHTML="";return;}
      var n=p*q, phi=(p-1)*(q-1);
      var g=egcd(e,phi);
      if(g[0]!==1){out.innerHTML='<span style="color:var(--alias)">gcd(e, φ(n)) = '+g[0]+' ≠ 1。e を変えてください</span>';rd.innerHTML="";return;}
      var d=((g[1]%phi)+phi)%phi;
      if(M>=n){out.innerHTML='<span style="color:var(--alias)">平文 M は n='+n+' 未満にしてください</span>';rd.innerHTML="";return;}
      var Cv=powmod(M,e,n), Mv=powmod(Cv,d,n);
      var h='<div>n = p×q = '+p+'×'+q+' = <b>'+n+'</b>　<span style="color:var(--faint)">（公開）</span></div>';
      h+='<div>φ(n) = (p−1)(q−1) = '+(p-1)+'×'+(q-1)+' = <b>'+phi+'</b>　<span style="color:var(--alias)">（秘密）</span></div>';
      h+='<div>e = <b>'+e+'</b>　<span style="color:var(--faint)">（公開、gcd(e,φ)=1 ✓）</span></div>';
      h+='<div>d = e⁻¹ mod φ(n) = <b style="color:var(--alias)">'+d+'</b>　<span style="color:var(--faint)">検算: '+e+'×'+d+' mod '+phi+' = '+((e*d)%phi)+'</span></div>';
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line)">暗号化: C = M^e mod n = '+M+'^'+e+' mod '+n+' = <b style="color:var(--signal)">'+Cv+'</b></div>';
      h+='<div>復号　: M = C^d mod n = '+Cv+'^'+d+' mod '+n+' = <b style="color:var(--signal)">'+Mv+'</b></div>';
      out.innerHTML=h;
      rd.innerHTML=(Mv===M?'<span class="ok">✓ 復号成功（オイラーの定理により M^(ed) ≡ M）</span>':'<span class="warn">復号失敗</span>')+
        ' ／ 公開鍵 ('+n+', '+e+') だけから d を求めるには n の素因数分解が必要';
    }
    [ip,iq,ie,im].forEach(function(x){x.addEventListener("input",run);});reg(null,run);run();
  };

  /* ---------- 17: DH 鍵交換 ---------- */
  REG.dh=function(el){
    head(el,"Diffie-Hellman","鍵は回線を流れていない");
    var row=ctrls(el);
    var ip=textin(row,"素数 p",23,"80px"), ig=textin(row,"原始根 g",5,"80px"),
        ia=textin(row,"Alice の秘密 a",6,"90px"), ib=textin(row,"Bob の秘密 b",15,"90px");
    var out=panel(el), rd=readout(el);
    function powmod(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=(r*b)%m;b=(b*b)%m;e=Math.floor(e/2);}return r;}
    function run(){
      var p=parseInt(ip.value)||23,g=parseInt(ig.value)||5,a=parseInt(ia.value)||1,b=parseInt(ib.value)||1;
      if(p<3){out.innerHTML="p≥3";return;}
      var A=powmod(g,a,p), B=powmod(g,b,p);
      var K1=powmod(B,a,p), K2=powmod(A,b,p);
      var h='<table style="border-collapse:collapse;width:100%">';
      h+='<tr><th style="text-align:left;padding:.2rem .5rem;color:var(--signal)">Alice</th><th style="text-align:center;padding:.2rem;color:var(--muted)">回線（盗聴される）</th><th style="text-align:right;padding:.2rem .5rem;color:var(--alias)">Bob</th></tr>';
      h+='<tr><td style="padding:.2rem .5rem">秘密 a = <b>'+a+'</b></td><td></td><td style="text-align:right;padding:.2rem .5rem">秘密 b = <b>'+b+'</b></td></tr>';
      h+='<tr><td style="padding:.2rem .5rem">A = g^a = <b>'+A+'</b></td><td style="text-align:center;color:var(--muted)">A='+A+' →</td><td></td></tr>';
      h+='<tr><td></td><td style="text-align:center;color:var(--muted)">← B='+B+'</td><td style="text-align:right;padding:.2rem .5rem">B = g^b = <b>'+B+'</b></td></tr>';
      h+='<tr><td style="padding:.2rem .5rem">K = B^a = <b style="color:var(--signal)">'+K1+'</b></td><td style="text-align:center;color:var(--faint)">（K は流れない）</td><td style="text-align:right;padding:.2rem .5rem">K = A^b = <b style="color:var(--signal)">'+K2+'</b></td></tr>';
      h+='</table>';
      out.innerHTML=h;
      rd.innerHTML=(K1===K2?'<span class="ok">✓ 共有鍵 '+K1+' に一致（g^(ab) mod p）</span>':'不一致')+
        ' ／ 盗聴者が知るのは p, g, A, B のみ。K を得るには離散対数 g^x=A を解く必要がある';
    }
    [ip,ig,ia,ib].forEach(function(x){x.addEventListener("input",run);});reg(null,run);run();
  };

  /* ---------- 17: 楕円曲線の点の加法 ---------- */
  REG.ecc=function(el){
    head(el,"Elliptic Curve","有限体上の点の足し算");
    var cv=screen(el,300),cc=cctx(cv);var row=ctrls(el);
    var sp=slider(row,"素数 p",11,97,23,1);
    var sa=slider(row,"a",0,10,1,1), sb=slider(row,"b",0,10,1,1);
    var sk=slider(row,"スカラー倍 k",1,30,5,1);
    var out=readout(el);
    function isPrime(n){if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true;}
    function inv(a,p){a=((a%p)+p)%p;for(var i=1;i<p;i++)if((a*i)%p===1)return i;return 0;}
    function add(P,Q,a,p){
      if(!P)return Q; if(!Q)return P;
      if(P[0]===Q[0] && (P[1]+Q[1])%p===0) return null;
      var lam;
      if(P[0]===Q[0]&&P[1]===Q[1]) lam=((3*P[0]*P[0]+a)%p)*inv(2*P[1],p)%p;
      else lam=(((Q[1]-P[1])%p+p)%p)*inv(((Q[0]-P[0])%p+p)%p,p)%p;
      var x=((lam*lam-P[0]-Q[0])%p+p)%p;
      var y=((lam*(P[0]-x)-P[1])%p+p)%p;
      return [x,y];
    }
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var p=+sp.input.value; while(!isPrime(p)&&p<100)p++;
      var a=+sa.input.value,b=+sb.input.value,k=+sk.input.value;
      sp.val.textContent=p; sa.val.textContent=a; sb.val.textContent=b; sk.val.textContent=k;
      // 曲線上の点を列挙
      var pts=[];
      for(var x=0;x<p;x++){var rhs=((x*x*x+a*x+b)%p+p)%p;
        for(var y=0;y<p;y++) if((y*y)%p===rhs) pts.push([x,y]);}
      var disc=(4*a*a*a+27*b*b)%p;
      var pad=26, S=Math.min((w-pad*2)/p,(h-pad*2)/p);
      var X=function(v){return pad+v*S+S/2;}, Y=function(v){return h-pad-v*S-S/2;};
      // グリッド
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(pad,h-pad);ctx.lineTo(pad+p*S,h-pad);ctx.moveTo(pad,h-pad);ctx.lineTo(pad,h-pad-p*S);ctx.stroke();
      ctx.fillStyle=C("--faint");
      pts.forEach(function(pt){ctx.beginPath();ctx.arc(X(pt[0]),Y(pt[1]),Math.max(2,S*0.22),0,TAU);ctx.fill();});
      // G = 最初の点、kG を計算して軌跡表示
      var G=pts[0], seq=[], P=null;
      if(G){ for(var i=1;i<=k;i++){P=add(P,G,a,p); if(!P)break; seq.push(P.slice());} }
      ctx.strokeStyle=C("--signal-soft");ctx.lineWidth=1.5;
      seq.forEach(function(pt,i){
        if(i>0){ctx.beginPath();ctx.moveTo(X(seq[i-1][0]),Y(seq[i-1][1]));ctx.lineTo(X(pt[0]),Y(pt[1]));ctx.stroke();}
      });
      seq.forEach(function(pt,i){
        var last=(i===seq.length-1);
        ctx.fillStyle=last?C("--alias"):C("--signal");
        ctx.beginPath();ctx.arc(X(pt[0]),Y(pt[1]),last?Math.max(5,S*0.42):Math.max(3,S*0.3),0,TAU);ctx.fill();
      });
      if(G){ctx.strokeStyle=C("--blue");ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(X(G[0]),Y(G[1]),Math.max(6,S*0.5),0,TAU);ctx.stroke();
        lab(ctx,"G",X(G[0])+9,Y(G[1])-8,C("--blue"),"left");}
      lab(ctx,"x",pad+p*S+4,h-pad+4,C("--muted"),"left");
      lab(ctx,"y",pad-4,h-pad-p*S-4,C("--muted"),"right");
      var kG=seq.length?seq[seq.length-1]:null;
      out.innerHTML='y² = x³+'+a+'x+'+b+' over GF('+p+') ／ 点の個数（無限遠点を除く）= <b>'+pts.length+'</b> ／ '+
        (disc===0?'<span class="warn">4a³+27b²≡0 なので特異曲線（使えない）</span>'
        :(kG?'G = ('+G[0]+','+G[1]+')、<b class="ok">'+k+'G = ('+kG[0]+','+kG[1]+')</b> ／ k から kG は簡単、kG から k は困難（ECDLP）'
            :'<span class="warn">'+k+'G = 無限遠点</span>'));
    }
    [sp,sa,sb,sk].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ---------- 18: 誕生日攻撃 ---------- */
  REG.birthday=function(el){
    head(el,"Birthday","衝突は 2^(n/2) で見つかる");
    var cv=screen(el,240),cc=cctx(cv);var row=ctrls(el);
    var sn=slider(row,"ハッシュ長 n（ビット）",8,256,64,8);
    var out=readout(el);
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:44,r:16,t:18,b:26};ctx.clearRect(0,0,w,h);
      var n=+sn.input.value; sn.val.textContent=n+" bit";
      // 横軸: 試行回数の log2, 縦軸: 衝突確率
      var maxk=n; // log2 の上限
      var X=function(lk){return p.l+lk/maxk*(w-p.l-p.r);}, Y=function(pr){return h-p.b-pr*(h-p.t-p.b);};
      ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
      for(var gi=0;gi<=4;gi++){var yy=Y(gi/4);ctx.beginPath();ctx.moveTo(p.l,yy);ctx.lineTo(w-p.r,yy);ctx.stroke();
        lab(ctx,(gi*25)+"%",p.l-6,yy+4,C("--muted"),"right");}
      ctx.strokeStyle=C("--signal");ctx.lineWidth=2.6;ctx.beginPath();
      for(var i=0;i<=300;i++){
        var lk=i/300*maxk, k=Math.pow(2,lk);
        var pr=1-Math.exp(-k*k/(2*Math.pow(2,n)));
        i?ctx.lineTo(X(lk),Y(pr)):ctx.moveTo(X(lk),Y(pr));
      }
      ctx.stroke();
      // n/2 の線
      ctx.strokeStyle=C("--alias");ctx.setLineDash([4,4]);ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(X(n/2),p.t);ctx.lineTo(X(n/2),h-p.b);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"2^"+(n/2),X(n/2),p.t+12,C("--alias"),"center");
      lab(ctx,"試行回数（横軸は 2 のべき）",(p.l+w-p.r)/2,h-p.b+16,C("--muted"),"center");
      lab(ctx,"衝突が見つかる確率",p.l+2,p.t+10,C("--muted"),"left");
      lab(ctx,"2^0",p.l,h-p.b+16,C("--muted"),"left");
      lab(ctx,"2^"+maxk,w-p.r,h-p.b+16,C("--muted"),"right");
      out.innerHTML='n = <b>'+n+'</b> ビット ／ 原像を探すのに <b>2^'+n+'</b> 回、衝突なら <b class="warn">2^'+(n/2)+'</b> 回だけ ／ '+
        (n<128?'<span class="warn">128 ビット安全性に届かない（衝突耐性は n/2）</span>'
              :'<span class="ok">衝突耐性 '+(n/2)+' ビット</span>')+
        (n===160?' ／ SHA-1 は 2^63 で実際に衝突が作られた（2017 SHAttered）':'');
    }
    sn.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ---------- 共有: GF(2^4) ---------- */
  var GF16=(function(){
    var exp=new Array(32), log=new Array(16), x=1;
    for(var i=0;i<15;i++){exp[i]=x;log[x]=i;x<<=1;if(x&16)x^=0b10011;}
    for(i=15;i<30;i++)exp[i]=exp[i-15];
    function mul(a,b){return (a&&b)?exp[(log[a]+log[b])%15]:0;}
    function div(a,b){return a?exp[(log[a]-log[b]+15)%15]:0;}
    function pw(a,e){if(a===0)return 0;return exp[((log[a]*e)%15+15)%15];}
    function pmul(A,B){var R=new Array(A.length+B.length-1).fill(0);
      for(var i=0;i<A.length;i++)for(var j=0;j<B.length;j++)R[i+j]^=mul(A[i],B[j]);return R;}
    function peval(P,v){var s=0;for(var i=P.length-1;i>=0;i--)s=mul(s,v)^P[i];return s;}
    return {exp:exp,log:log,mul:mul,div:div,pow:pw,pmul:pmul,peval:peval};
  })();

  /* ---------- 02: 群と位数（ラグランジュの定理） ---------- */
  REG.grouptable=function(el){
    head(el,"Group","各元の位数は必ず群の位数を割り切る");
    var row=ctrls(el);
    var sn=slider(row,"n",3,14,8,1);
    var sel=mk("div","ctrl");
    sel.innerHTML='<label>群</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink)">'+
      '<option value="add">加法群 (Z_n, +)</option><option value="mul">乗法群 (Z_n)* — 逆元を持つ元だけ</option></select>';
    row.appendChild(sel); var sl=sel.querySelector("select");
    var out=panel(el), rd=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function run(){
      var n=+sn.input.value; sn.val.textContent=n;
      var mulmode=sl.value==="mul";
      var G=[]; for(var i=0;i<n;i++){ if(!mulmode) G.push(i); else if(gcd(i,n)===1) G.push(i); }
      var op=mulmode?function(a,b){return (a*b)%n;}:function(a,b){return (a+b)%n;};
      var e=mulmode?1:0, ord=G.length;
      // 演算表
      var h='<div style="color:var(--muted);margin-bottom:.3rem">'+(mulmode?"乗法":"加法")+'表 mod '+n+'（要素数 '+ord+'）。色付きのマスは a '+(mulmode?'×':'+')+' b = '+e+'（単位元）になる組＝逆元の組</div>';
      h+='<table style="border-collapse:collapse"><tr><th style="padding:.1rem .4rem;color:var(--muted)">'+(mulmode?"×":"+")+'</th>'+
        G.map(function(b){return '<th style="padding:.1rem .4rem;color:var(--muted)">'+b+'</th>';}).join("")+'</tr>';
      G.forEach(function(a){
        h+='<tr><th style="padding:.1rem .4rem;color:var(--muted)">'+a+'</th>'+
          G.map(function(b){var v=op(a,b);
            return '<td style="padding:.1rem .4rem;text-align:center'+(v===e?';background:var(--signal);color:#fff;font-weight:700;border-radius:4px':'')+'">'+v+'</td>';}).join("")+'</tr>';
      });
      h+='</table>';
      // 各元の位数
      var orders=G.map(function(a){var k=1,v=a;while(v!==e&&k<200){v=op(v,a);k++;}return k;});
      var invs=G.map(function(a){for(var j=0;j<G.length;j++){if(op(a,G[j])===e)return G[j];}return "?";});
      // 位数の計算過程: a を 1 個, 2 個, … と並べて初めて e になる個数
      h+='<div style="color:var(--muted);margin:.7rem 0 .3rem">各元の位数の計算: a を 1 個、2 個、3 個…と'+(mulmode?'掛け合わせ':'足し合わせ')+'、<b>初めて単位元 e = '+e+' になったときの a の個数</b>が位数</div>';
      h+='<table style="border-collapse:collapse;font-size:.78rem">'+G.map(function(a,i){
        var seq=[],v=a,k=1; while(v!==e&&k<200){seq.push(v);v=op(v,a);k++;} seq.push(v);
        return '<tr><th style="padding:.1rem .5rem;color:var(--muted);text-align:right">'+a+'</th><td style="padding:.1rem .5rem">'+
          seq.map(function(x,j){return '<span style="'+(j===seq.length-1?'color:var(--signal);font-weight:700':'')+'">'+x+'</span><sub style="color:var(--muted)">'+(j+1)+'個</sub>';}).join('<span style="color:var(--muted)"> '+(mulmode?'×'+a+'→':'+'+a+'→')+' </span>')+
          ' <span style="color:var(--muted)">⇒ 位数</span> <b>'+seq.length+'</b></td></tr>';}).join("")+'</table>';
      h+='<div style="color:var(--muted);margin:.7rem 0 .3rem">まとめ（逆元: a '+(mulmode?'×':'+')+' ? = '+e+' となる相手）</div>';
      h+='<table style="border-collapse:collapse"><tr><th style="padding:.1rem .5rem;color:var(--muted);text-align:right">元</th>'+
        G.map(function(a){return '<td style="padding:.1rem .5rem;text-align:right">'+a+'</td>';}).join("")+'</tr>'+
        '<tr><th style="padding:.1rem .5rem;color:var(--muted);text-align:right">位数</th>'+
        orders.map(function(k){return '<td style="padding:.1rem .5rem;text-align:right;color:'+(ord%k===0?'var(--signal)':'var(--alias)')+';font-weight:700">'+k+'</td>';}).join("")+'</tr>'+
        '<tr><th style="padding:.1rem .5rem;color:var(--muted);text-align:right">逆元</th>'+
        invs.map(function(v){return '<td style="padding:.1rem .5rem;text-align:right;color:var(--muted)">'+v+'</td>';}).join("")+'</tr></table>';
      out.innerHTML=h;
      var divs=[]; for(var d=1;d<=ord;d++) if(ord%d===0) divs.push(d);
      var allok=orders.every(function(k){return ord%k===0;});
      var gen=G.filter(function(a,i){return orders[i]===ord;});
      rd.innerHTML='群の位数 = <b>'+ord+'</b>'+(mulmode?'（= φ('+n+')）':'')+' ／ '+ord+' の約数: <b>'+divs.join(", ")+'</b> ／ '+
        (allok?'<span class="ok">出てきた位数はすべて約数 ✓ ラグランジュの定理</span>':'<span class="warn">?</span>')+
        ' ／ 位数 '+ord+' の元（生成元）: '+(gen.length?'<b class="ok">'+gen.join(", ")+'</b> → 巡回群':'<span class="warn">なし → 巡回群でない</span>');
    }
    sn.input.addEventListener("input",run);sl.addEventListener("change",run);reg(null,run);run();
  };

  /* ---------- 07: 線形符号 G・H・シンドローム ---------- */
  REG.linear=function(el){
    head(el,"Linear Code","G で作り、H で調べる");
    var row=ctrls(el);
    var ip=textin(row,"P の各行（3 ビット × 3 行、カンマ区切り）","011,101,110","240px");
    var se=slider(row,"誤り位置（0=なし）",0,6,3,1);
    var out=panel(el), rd=readout(el);
    var k=3,r=3,n=6;
    function run(){
      var rows=String(ip.value).split(",").map(function(s){return s.trim();});
      if(rows.length!==3||rows.some(function(s){return !/^[01]{3}$/.test(s);})){
        out.innerHTML="3 ビットの 0/1 を 3 行、カンマ区切りで（例 011,101,110）";rd.innerHTML="";return;}
      var P=rows.map(function(s){return s.split("").map(Number);});
      // G = [I_k | P]  (k×n),  H = [P^T | I_r]  (r×n)
      var G=[],H=[];
      for(var i=0;i<k;i++){var g=[];for(var j=0;j<k;j++)g.push(i===j?1:0);G.push(g.concat(P[i]));}
      for(i=0;i<r;i++){var hh=[];for(j=0;j<k;j++)hh.push(P[j][i]);for(j=0;j<r;j++)hh.push(i===j?1:0);H.push(hh);}
      function mstr(M){return M.map(function(rw){return rw.join(" ");}).join("<br>");}
      // 全符号語
      var words=[],minw=99;
      for(var m=0;m<(1<<k);m++){
        var msg=[];for(i=k-1;i>=0;i--)msg.push((m>>i)&1);
        var c=new Array(n).fill(0);
        for(i=0;i<k;i++) if(msg[i]) for(j=0;j<n;j++) c[j]^=G[i][j];
        var w=c.reduce(function(a,b){return a+b;},0);
        if(m>0&&w<minw)minw=w;
        words.push([msg.join(""),c.join(""),w]);
      }
      var h='<div style="display:flex;gap:2rem;flex-wrap:wrap">';
      h+='<div><div style="color:var(--muted)">G = [ I₃ | P ]（3×6）</div><div style="letter-spacing:.15em">'+mstr(G)+'</div></div>';
      h+='<div><div style="color:var(--muted)">H = [ Pᵀ | I₃ ]（3×6）</div><div style="letter-spacing:.15em">'+mstr(H)+'</div></div>';
      h+='</div>';
      h+='<div style="color:var(--muted);margin:.7rem 0 .3rem">全 8 符号語（最小重み = 最小距離）</div>';
      h+='<table style="border-collapse:collapse"><tr>'+["情報語 m","符号語 c = mG","重み"].map(function(t){
        return '<th style="padding:.1rem .8rem;text-align:right;color:var(--muted)">'+t+'</th>';}).join("")+'</tr>';
      words.forEach(function(wd,i){
        h+='<tr'+(i>0&&wd[2]===minw?' style="color:var(--signal);font-weight:700"':'')+'>'+
          wd.map(function(v){return '<td style="padding:.1rem .8rem;text-align:right;letter-spacing:.12em">'+v+'</td>';}).join("")+'</tr>';
      });
      h+='</table>';
      // シンドローム
      var pos=+se.input.value; se.val.textContent=pos;
      var c0=words[5][1].split("").map(Number);   // 適当な符号語 (m=101)
      var rcv=c0.slice(); if(pos>0) rcv[pos-1]^=1;
      var s=[];for(i=0;i<r;i++){var v=0;for(j=0;j<n;j++)v^=rcv[j]&H[i][j];s.push(v);}
      var scol=s.join(""), match=-1;
      for(j=0;j<n;j++){var col=H.map(function(rw){return rw[j];}).join(""); if(col===scol)match=j+1;}
      h+='<div style="color:var(--muted);margin:.7rem 0 .3rem">シンドローム s = rHᵀ</div>';
      h+='送信 c : <b style="letter-spacing:.15em">'+c0.join("")+'</b>（m=101）<br>';
      h+='受信 r : <span style="letter-spacing:.15em">'+rcv.map(function(b,i){return (pos===i+1?'<b style="background:var(--alias);color:#fff;padding:0 .2rem;border-radius:3px">'+b+'</b>':b);}).join("")+'</span><br>';
      h+='s = <b style="letter-spacing:.15em">'+scol+'</b>';
      out.innerHTML=h;
      var t=Math.floor((minw-1)/2);
      rd.innerHTML='最小距離 d = <b>'+minw+'</b> → 検出 <b>'+(minw-1)+'</b> ビット・訂正 <b>'+t+'</b> ビット ／ '+
        (pos===0?'<span class="ok">s = 000 → 誤りなし ✓</span>'
                :(match>0?(match===pos?'<span class="ok">s は H の第 '+match+' 列と一致 → 誤り位置 '+pos+' を特定 ✓</span>'
                                      :'<span class="warn">s は第 '+match+' 列と一致（実際は '+pos+'）— H に同じ列があると特定できない</span>')
                         :'<span class="warn">s がどの列とも一致しない → 検出はできるが位置は不明</span>'));
    }
    ip.addEventListener("input",run);se.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 10: BCH の生成多項式 ---------- */
  REG.bch=function(el){
    head(el,"BCH","訂正したいビット数から g(x) を組み立てる");
    var row=ctrls(el);
    var st=slider(row,"設計訂正能力 t",1,3,2,1);
    var out=panel(el), rd=readout(el);
    function pstr(P){ // GF(2) 係数多項式（昇冪配列）を文字列に
      var ts=[];for(var i=P.length-1;i>=0;i--) if(P[i]) ts.push(i===0?"1":(i===1?"x":"x"+String(i).split("").map(function(d){return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d];}).join("")));
      return ts.join("+")||"0";
    }
    function run(){
      var t=+st.input.value; st.val.textContent=t;
      var used={}, cosets=[], polys=[], g=[1];
      for(var j=1;j<=2*t;j++){
        if(used[j])continue;
        var cs=[], v=j;
        do{ cs.push(v); used[v]=true; v=(v*2)%15; }while(v!==j);
        // m(x) = Π (x + α^i)
        var m=[1];
        cs.forEach(function(i){ m=GF16.pmul(m,[GF16.exp[i],1]); });
        cosets.push(cs); polys.push(m);
        g=GF16.pmul(g,m);
      }
      var h='<div style="color:var(--muted);margin-bottom:.3rem">GF(2⁴), 原始多項式 x⁴+x+1, n = 15</div>';
      h+='<div style="color:var(--muted);margin-bottom:.3rem">α¹ … α<sup>'+(2*t)+'</sup> をすべて根に持たせたい → 共役をまとめる</div>';
      h+='<table style="border-collapse:collapse"><tr>'+["共役類（指数）","最小多項式 m(x)","次数"].map(function(s){
        return '<th style="padding:.15rem .8rem;text-align:left;color:var(--muted)">'+s+'</th>';}).join("")+'</tr>';
      cosets.forEach(function(cs,i){
        var deg=polys[i].length-1;
        h+='<tr><td style="padding:.15rem .8rem">{'+cs.join(", ")+'}</td>'+
           '<td style="padding:.15rem .8rem;color:var(--signal)">'+pstr(polys[i])+'</td>'+
           '<td style="padding:.15rem .8rem">'+deg+'</td></tr>';
      });
      h+='</table>';
      var deg=g.length-1, kk=15-deg;
      h+='<div style="margin-top:.6rem">g(x) = '+polys.map(function(P){return "("+pstr(P)+")";}).join(" · ")+'</div>';
      h+='<div style="margin-top:.3rem">　　 = <b class="ok">'+pstr(g)+'</b>　（次数 '+deg+'）</div>';
      out.innerHTML=h;
      var known={1:"(15,11,3) — ハミング符号と同じ",2:"(15,7,5)",3:"(15,5,7)"};
      rd.innerHTML='検査ビット n−k = deg g = <b>'+deg+'</b> → <b class="ok">('+15+', '+kk+') 符号</b>、設計距離 d ≥ 2t+1 = <b>'+(2*t+1)+'</b> ／ '+
        '<b>'+t+'</b> ビット訂正 ／ 教科書の表と一致: '+known[t]+
        ' ／ <span class="warn">t を上げると k が減る = 訂正能力と情報量のトレードオフ</span>';
    }
    st.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 11: リード・ソロモン RS(15,11) の符号化と復号 ---------- */
  REG.rs=function(el){
    head(el,"Reed-Solomon","RS(15,11) over GF(16) — 誤りを入れて直す");
    var row=ctrls(el);
    var s1=slider(row,"誤り位置 1（0=なし）",0,15,3,1);
    var v1=slider(row,"誤りの値 1",1,15,7,1);
    var s2=slider(row,"誤り位置 2（0=なし）",0,15,9,1);
    var v2=slider(row,"誤りの値 2",1,15,11,1);
    var s3=slider(row,"誤り位置 3（0=なし・訂正能力を超える）",0,15,0,1);
    var out=panel(el), rd=readout(el);
    var t=2, nn=15, kk=11;
    var MSG=[5,3,12,1,8,2,14,6,9,4,10];  // 11 シンボル
    function hex(a){return a.toString(16).toUpperCase();}
    function run(){
      [s1,v1,s2,v2,s3].forEach(function(s){s.val.textContent=s.input.value;});
      // g(x) = Π_{j=1..4} (x + α^j)
      var g=[1];for(var j=1;j<=2*t;j++) g=GF16.pmul(g,[GF16.exp[j],1]);
      // 組織符号化: c(x) = x^4 m(x) + (x^4 m(x) mod g)
      var d=new Array(nn).fill(0);
      for(var i=0;i<kk;i++) d[i+2*t]=MSG[i];          // 昇冪配列、下位 4 個が検査
      var rem=d.slice();
      for(i=nn-1;i>=2*t;i--){
        var co=rem[i]; if(!co)continue;
        for(var q=0;q<g.length;q++) rem[i-(g.length-1)+q]^=GF16.mul(co,g[q]);
      }
      var c=d.slice(); for(i=0;i<2*t;i++) c[i]=rem[i];
      // 誤り注入
      var rcv=c.slice(), injected=[];
      [[+s1.input.value,+v1.input.value],[+s2.input.value,+v2.input.value],[+s3.input.value,7]].forEach(function(pv){
        if(pv[0]>0){ rcv[pv[0]-1]^=pv[1]; injected.push(pv[0]-1); }
      });
      var nerr=injected.filter(function(p,i,a){return a.indexOf(p)===i;}).length;
      // シンドローム
      var S=[];for(j=1;j<=2*t;j++) S.push(GF16.peval(rcv,GF16.exp[j]));
      var allz=S.every(function(x){return x===0;});
      // Berlekamp-Massey
      var C=[1],B=[1],L=0,m=1,b=1;
      for(var nI=0;nI<2*t;nI++){
        var dd=S[nI];
        for(i=1;i<=L;i++) dd^=GF16.mul(C[i]||0,S[nI-i]);
        if(dd===0){m++;}
        else if(2*L<=nI){
          var T=C.slice(), cf=GF16.div(dd,b);
          for(i=0;i<B.length;i++){var ix=i+m;C[ix]=(C[ix]||0)^GF16.mul(cf,B[i]);}
          L=nI+1-L;B=T;b=dd;m=1;
        } else {
          var cf2=GF16.div(dd,b);
          for(i=0;i<B.length;i++){var ix2=i+m;C[ix2]=(C[ix2]||0)^GF16.mul(cf2,B[i]);}
          m++;
        }
      }
      for(i=0;i<C.length;i++) C[i]=C[i]||0;
      // Chien 探索: Λ(α^{-p}) = 0 なる位置 p
      var locs=[];
      for(var p=0;p<nn;p++) if(GF16.peval(C,GF16.pow(GF16.exp[1],-p))===0) locs.push(p);
      // Forney: Ω = S(x)Λ(x) mod x^{2t}
      var Sp=S.slice();
      var Om=GF16.pmul(Sp,C).slice(0,2*t);
      var Cd=[]; for(i=1;i<C.length;i+=2) Cd[i-1]=C[i];   // 標数 2 の形式微分
      for(i=0;i<Cd.length;i++)Cd[i]=Cd[i]||0;
      var fixed=rcv.slice(), okfix=(locs.length===L);
      locs.forEach(function(p){
        var Xi=GF16.pow(GF16.exp[1],p), Xinv=GF16.pow(GF16.exp[1],-p);
        var num=GF16.peval(Om,Xinv), den=GF16.peval(Cd,Xinv);
        if(den===0){okfix=false;return;}
        fixed[p]^=GF16.div(num,den);
      });
      var recovered=fixed.slice(2*t), okmsg=recovered.every(function(v,i){return v===MSG[i];});
      function line(lbl,arr,mark){
        return '<div>'+lbl+' '+arr.map(function(v,i){
          var s=hex(v); return (mark&&mark.indexOf(i)>=0)?'<b style="background:var(--alias);color:#fff;padding:0 .25rem;border-radius:3px">'+s+'</b>':s;
        }).join(" ")+'</div>';
      }
      var h='<div style="color:var(--muted);margin-bottom:.3rem">シンボルは GF(16) の元（16 進 1 桁）。左が低次（検査 4 個）、右が高次（情報 11 個）。</div>';
      h+=line("送信 c :",c);
      h+=line("受信 r :",rcv,injected);
      h+='<div style="margin-top:.4rem;color:var(--muted)">① シンドローム S₁..S₄ = r(α), r(α²), r(α³), r(α⁴)</div>';
      h+='<div>'+S.map(function(v,i){return "S"+(i+1)+"="+hex(v);}).join("　")+(allz?'　<span class="ok">すべて 0 → 誤りなし</span>':'')+'</div>';
      if(!allz){
        h+='<div style="margin-top:.4rem;color:var(--muted)">② 誤り位置多項式 Λ(x)（バーレカンプ・マッシー）</div>';
        h+='<div>Λ(x) = '+C.map(function(v,i){return v?(hex(v)+(i?"·x"+(i>1?"^"+i:""):"")):null;}).filter(function(s){return s;}).join(" + ")+'　（次数 L = '+L+' = 誤りの個数）</div>';
        h+='<div style="margin-top:.4rem;color:var(--muted)">③ チェン探索で根を求める → 誤り位置</div>';
        h+='<div>'+(locs.length?locs.map(function(p){return "位置 "+(p+1);}).join("、"):"根が見つからない")+'</div>';
        h+='<div style="margin-top:.4rem;color:var(--muted)">④ フォーニーの公式で誤りの値 → 訂正</div>';
        h+=line("訂正後 :",fixed,locs);
      }
      out.innerHTML=h;
      rd.innerHTML='注入した誤り <b>'+nerr+'</b> シンボル ／ 訂正能力 t = <b>'+t+'</b> = (n−k)/2 ／ '+
        (nerr===0?'<span class="ok">シンドロームが全 0 → 何もしない ✓</span>'
         :(okmsg?'<span class="ok">情報 11 シンボルが完全に復元 ✓</span>'
                :'<span class="warn">復号失敗 — 誤りが t を超えると直せない（しかも間違った語に「訂正」されうる）</span>'));
    }
    [s1,v1,s2,v2,s3].forEach(function(s){s.input.addEventListener("input",run);});
    reg(null,run);run();
  };

  /* ---------- 12: シーザー暗号と頻度分析 ---------- */
  REG.caesar=function(el){
    head(el,"Frequency Analysis","鍵を知らなくても、文字の出現回数が鍵を教える");
    var row=ctrls(el);
    var sk=slider(row,"鍵（シフト量）",0,25,3,1);
    var cv=screen(el,180),cc=cctx(cv);
    var out=panel(el), rd=readout(el);
    var PT=("IN CRYPTOGRAPHY A CAESAR CIPHER IS ONE OF THE SIMPLEST AND MOST WIDELY KNOWN "+
            "ENCRYPTION TECHNIQUES IT IS A TYPE OF SUBSTITUTION CIPHER IN WHICH EACH LETTER "+
            "IN THE PLAINTEXT IS REPLACED BY A LETTER SOME FIXED NUMBER OF POSITIONS DOWN THE ALPHABET");
    var ENG=[8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07];
    var A="A".charCodeAt(0);
    function enc(s,k){return s.replace(/[A-Z]/g,function(ch){return String.fromCharCode((ch.charCodeAt(0)-A+k)%26+A);});}
    function freq(s){var f=new Array(26).fill(0),tot=0;
      for(var i=0;i<s.length;i++){var c=s.charCodeAt(i)-A;if(c>=0&&c<26){f[c]++;tot++;}}
      return {f:f,tot:tot};}
    var CT="", best=0;
    function run(){
      var k=+sk.input.value; sk.val.textContent=k;
      CT=enc(PT,k);
      var fr=freq(CT);
      // χ² で全 26 通りを試す
      var scores=[];
      for(var g=0;g<26;g++){
        var chi=0;
        for(var i=0;i<26;i++){
          var obs=fr.f[(i+g)%26], exp=fr.tot*ENG[i]/100;
          chi+=(obs-exp)*(obs-exp)/exp;
        }
        scores.push(chi);
      }
      best=scores.indexOf(Math.min.apply(null,scores));
      var h='<div style="color:var(--muted)">平文</div><div style="word-break:break-all">'+PT.slice(0,110)+'…</div>';
      h+='<div style="color:var(--muted);margin-top:.4rem">暗号文（鍵 '+k+'）</div><div style="word-break:break-all;color:var(--alias)">'+CT.slice(0,110)+'…</div>';
      h+='<div style="color:var(--muted);margin-top:.4rem">χ² 最小の鍵で復号した結果</div><div style="word-break:break-all;color:var(--signal)">'+enc(CT,(26-best)%26).slice(0,110)+'…</div>';
      out.innerHTML=h;
      draw();
      rd.innerHTML='鍵 = <b>'+k+'</b> ／ 頻度分析の推定鍵 = <b class="ok">'+best+'</b> '+
        (best===k?'<span class="ok">✓ 一致（鍵空間 26 通りを総当たりするまでもない）</span>':'')+
        ' ／ <span class="warn">シフトしても「山の形」は変わらない — これが古典暗号の致命傷</span>';
    }
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx,p={l:26,r:10,t:14,b:24};ctx.clearRect(0,0,w,h);
      var fr=freq(CT), k=+sk.input.value;
      var bw=(w-p.l-p.r)/26, mx=Math.max.apply(null,fr.f.concat([1]));
      for(var i=0;i<26;i++){
        var pc=fr.f[i]/fr.tot*100;
        var hh=(fr.f[i]/mx)*(h-p.t-p.b);
        ctx.fillStyle=(i===(4+k)%26)?C("--alias"):C("--signal");   // E の行き先を強調
        ctx.fillRect(p.l+i*bw+1,h-p.b-hh,bw-2,hh);
        // 期待値（英語）の点
        var eh=(fr.tot*ENG[i]/100/mx)*(h-p.t-p.b);
        ctx.fillStyle=C("--muted");ctx.globalAlpha=.5;
        ctx.fillRect(p.l+i*bw+1,h-p.b-eh-1,bw-2,2);ctx.globalAlpha=1;
        lab(ctx,String.fromCharCode(A+i),p.l+i*bw+bw/2,h-p.b+13,C("--faint"),"center");
      }
      ctx.strokeStyle=C("--grid");ctx.beginPath();ctx.moveTo(p.l,h-p.b);ctx.lineTo(w-p.r,h-p.b);ctx.stroke();
      lab(ctx,"暗号文の文字頻度（棒）／ 英語の平均頻度（灰線）",p.l+2,p.t,C("--muted"),"left");
      lab(ctx,"E の行き先 = "+String.fromCharCode(A+(4+k)%26),w-p.r,p.t,C("--alias"),"right");
    }
    sk.input.addEventListener("input",run);reg(cv,draw);run();
  };

  /* ---------- 15: オイラーの φ 関数 ---------- */
  REG.phi=function(el){
    head(el,"Euler φ","n と互いに素な数を数える");
    var row=ctrls(el);
    var sn=slider(row,"n",2,120,36,1);
    var out=panel(el), rd=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function run(){
      var n=+sn.input.value; sn.val.textContent=n;
      var f={},m=n;
      for(var p=2;p*p<=m;p++) while(m%p===0){f[p]=(f[p]||0)+1;m/=p;}
      if(m>1)f[m]=(f[m]||0)+1;
      var ps=Object.keys(f).map(Number);
      var phi=n; ps.forEach(function(p){phi=phi/p*(p-1);});
      var units=[]; for(var a=1;a<n;a++) if(gcd(a,n)===1) units.push(a);
      var h='<div>n = <b>'+n+'</b> = '+ps.map(function(p){return p+(f[p]>1?"^"+f[p]:"");}).join(" × ")+'</div>';
      h+='<div style="margin-top:.3rem">φ(n) = n · '+ps.map(function(p){return "(1 − 1/"+p+")";}).join(" · ")+' = <b class="ok">'+phi+'</b></div>';
      h+='<div style="color:var(--muted);margin:.5rem 0 .3rem">0 〜 '+(n-1)+' のうち n と互いに素なもの（= 逆元を持つ = (Z_n)* の元）</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.2rem">';
      for(a=0;a<n;a++){
        var u=gcd(a,n)===1;
        h+='<span style="min-width:1.7rem;text-align:center;padding:.1rem .25rem;border-radius:4px;'+
          (u?'background:var(--signal);color:#fff;font-weight:700':'color:var(--faint)')+'">'+a+'</span>';
      }
      h+='</div>';
      out.innerHTML=h;
      var isp=ps.length===1&&f[ps[0]]===1;
      rd.innerHTML='数え上げた個数 = <b>'+units.length+'</b>、公式の値 = <b>'+phi+'</b> '+
        (units.length===phi?'<span class="ok">✓ 一致</span>':'<span class="warn">不一致</span>')+
        ' ／ '+(isp?'<span class="ok">n は素数なので φ(n) = n−1（0 以外すべて逆元を持つ = 体）</span>'
                  :'<span class="warn">n は合成数なので体にならない（0 を含め '+(n-units.length)+' 個が逆元を持たない）</span>')+
        ' ／ RSA では φ(n)=(p−1)(q−1) が秘密の要';
    }
    sn.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ---------- 15: 中国剰余定理 ---------- */
  REG.crt=function(el){
    head(el,"CRT","バラバラの余りから、もとの数を組み立て直す");
    var row=ctrls(el);
    var a1=textin(row,"x ≡ a₁ (mod n₁)　a₁",2,"70px"), n1=textin(row,"n₁",3,"70px");
    var a2=textin(row,"a₂",3,"70px"), n2=textin(row,"n₂",5,"70px");
    var a3=textin(row,"a₃",2,"70px"), n3=textin(row,"n₃",7,"70px");
    var out=panel(el), rd=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function inv(a,m){a=((a%m)+m)%m;for(var x=1;x<m;x++) if(a*x%m===1)return x;return null;}
    function run(){
      var A=[+a1.value,+a2.value,+a3.value], N=[+n1.value,+n2.value,+n3.value];
      if(N.some(function(v){return !(v>1);})){out.innerHTML="法は 2 以上の整数で";rd.innerHTML="";return;}
      var bad=null;
      for(var i=0;i<3;i++)for(var j=i+1;j<3;j++) if(gcd(N[i],N[j])!==1) bad=[N[i],N[j]];
      var P=N[0]*N[1]*N[2];
      var h='<table style="border-collapse:collapse"><tr>'+
        ["i","aᵢ","nᵢ","Nᵢ = N/nᵢ","yᵢ = Nᵢ⁻¹ mod nᵢ","aᵢ Nᵢ yᵢ"].map(function(s){
          return '<th style="padding:.15rem .7rem;text-align:right;color:var(--muted)">'+s+'</th>';}).join("")+'</tr>';
      var x=0, okall=!bad;
      for(i=0;i<3;i++){
        var Ni=P/N[i], yi=bad?null:inv(Ni%N[i],N[i]);
        var term=(yi==null)?"—":(A[i]*Ni*yi);
        if(yi!=null) x+=A[i]*Ni*yi;
        h+='<tr>'+[i+1,((A[i]%N[i])+N[i])%N[i],N[i],Ni,(yi==null?"—":yi),term].map(function(v){
          return '<td style="padding:.15rem .7rem;text-align:right">'+v+'</td>';}).join("")+'</tr>';
      }
      h+='</table>';
      x=((x%P)+P)%P;
      h+='<div style="margin-top:.5rem">N = n₁n₂n₃ = <b>'+P+'</b>　x = Σ aᵢNᵢyᵢ mod N = <b class="ok">'+x+'</b></div>';
      if(okall){
        h+='<div style="color:var(--muted);margin:.5rem 0 .3rem">検算</div>';
        for(i=0;i<3;i++) h+='<div>'+x+' mod '+N[i]+' = <b>'+(x%N[i])+'</b>　（欲しかったのは '+(((A[i]%N[i])+N[i])%N[i])+'）'+
          (x%N[i]===((A[i]%N[i])+N[i])%N[i]?' <span class="ok">✓</span>':' <span class="warn">✗</span>')+'</div>';
      }
      out.innerHTML=h;
      rd.innerHTML=bad?('<span class="warn">'+bad[0]+' と '+bad[1]+' が互いに素でない → CRT の前提を満たさない（解が無いか一意でない）</span>')
        :('0 〜 '+(P-1)+' の <b>'+P+'</b> 個の数と、余りの組 (a₁,a₂,a₃) の <b>'+P+'</b> 通りが <b class="ok">1 対 1</b> ／ '+
          'だから「大きな法 1 個」を「小さな法 3 個」に分解して計算できる（RSA の高速復号はこれ）');
    }
    [a1,n1,a2,n2,a3,n3].forEach(function(t){t.addEventListener("input",run);});
    reg(null,run);run();
  };

  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */
  /* ============ 01. clockmod — 整数 a が文字盤のどこに着くか ============ */
  REG.clockmod=function(el){
    head(el,"Clock","整数 a を m で割った商と余り、文字盤の上の位置");
    var row=ctrls(el);
    var sm=slider(row,"法 m",2,24,12,1), sa=slider(row,"整数 a",-40,40,15,1);
    var cv=screen(el,300),cc=cctx(cv), ro=readout(el);
    function md(a,m){return ((a%m)+m)%m;}
    function ns(v){return String(v).replace("-","−");}
    function txt(ctx,t,x,y,col,sz,wt,al){ctx.fillStyle=col;ctx.font=(wt||400)+" "+(sz||12)+"px "+C("--mono");
      ctx.textAlign=al||"left";ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
    function draw(){
      var m=+sm.input.value,a=+sa.input.value; sm.val.textContent=m; sa.val.textContent=ns(a);
      var q=Math.floor(a/m),r=md(a,m);
      var bw=cv.getBoundingClientRect().width, wide=bw>=560, want=wide?300:Math.round(2*Math.min(78,(bw-40)/2)+190);
      if(cv.parentElement.style.height!==want+"px")cv.parentElement.style.height=want+"px";
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var R=wide?Math.min(112,(h-40)/2):Math.min(78,(w-40)/2);
      var cx=wide?R+34:w/2, cy=wide?h/2:R+22;
      function ang(t){return -Math.PI/2+TAU*t/m;}
      // 文字盤
      ctx.fillStyle=C("--panel");ctx.strokeStyle=C("--line");ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();ctx.stroke();
      // 進んだ道（内側へ巻く渦）
      var laps=Math.abs(a)/m, r0=R-30, step=Math.min(9,(r0-14)/Math.max(1,laps));
      var col=a>=0?C("--signal"):C("--blue");
      if(a!==0){
        ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();
        var N=Math.max(30,Math.ceil(Math.abs(a)*12));
        for(var i=0;i<=N;i++){var t=a*i/N, rr=r0-step*Math.abs(t)/m;
          var x=cx+rr*Math.cos(ang(t)),y=cy+rr*Math.sin(ang(t));i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.stroke();
        var te=a, re=r0-step*Math.abs(te)/m, xe=cx+re*Math.cos(ang(te)), ye=cy+re*Math.sin(ang(te));
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(xe,ye,4.5,0,TAU);ctx.fill();
      }
      ctx.fillStyle=C("--ink");ctx.beginPath();ctx.arc(cx+r0*Math.cos(ang(0)),cy+r0*Math.sin(ang(0)),3.5,0,TAU);ctx.fill();
      // 目盛りと数字
      var fs=m>16?10.5:12;
      for(var k=0;k<m;k++){
        var xa=cx+R*Math.cos(ang(k)),ya=cy+R*Math.sin(ang(k)),xb=cx+(R-6)*Math.cos(ang(k)),yb=cy+(R-6)*Math.sin(ang(k));
        ctx.strokeStyle=C("--muted");ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(xa,ya);ctx.lineTo(xb,yb);ctx.stroke();
        var xl=cx+(R+14)*Math.cos(ang(k)),yl=cy+(R+14)*Math.sin(ang(k));
        if(k===r){ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(xl,yl,11,0,TAU);ctx.fill();ctx.stroke();}
        txt(ctx,String(k),xl,yl+4,k===r?C("--signal"):C("--ink"),fs,k===r?700:400,"center");
      }
      // 説明
      var X=wide?2*R+90:16, Y=wide?Math.max(44,cy-92):2*R+66;
      txt(ctx,"a = "+ns(a)+" = "+(q<0?"("+ns(q)+")":q)+" × "+m+" + "+r,X,Y,C("--ink"),wide?16:14,700);
      txt(ctx,"商 q = "+ns(q)+"、余り r = "+r,X,Y+(wide?30:24),C("--muted"),12.5);
      txt(ctx,"a mod "+m+" = "+r+"、 "+ns(a)+" ≡ "+r+" (mod "+m+")",X,Y+(wide?54:44),C("--signal"),13,700);
      var dir=a>0?"時計回りに "+a+" 目盛り":(a<0?"反時計回りに "+(-a)+" 目盛り":"動かない");
      var lp=Math.floor(Math.abs(a)/m);
      txt(ctx,"0 から"+dir+(lp>0?"（"+lp+" 周を含む）":""),X,Y+(wide?84:66),C("--muted"),12);
      var cls=[r-2*m,r-m,r,r+m,r+2*m].map(ns).join(", ");
      txt(ctx,"同じ位置: …, "+cls+", …",X,Y+(wide?108:86),C("--muted"),12);
      ro.innerHTML='a = <b>'+ns(a)+'</b> を m = <b>'+m+'</b> で割ると商 <b>'+ns(q)+'</b>、余り <b class="ok">'+r+'</b> ／ '+
        '余りが '+r+' の整数はすべて文字盤の '+r+' に着く（余り '+r+' の剰余類）';
    }
    sm.input.addEventListener("input",draw);sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 01. euclidsq — 長方形から正方形を切り取る互除法 ============ */
  REG.euclidsq=function(el){
    head(el,"Euclid","長方形から正方形を切り取ることを繰り返す");
    var row=ctrls(el);
    var ia=textin(row,"a",1071,"120px"), ib=textin(row,"b",462,"120px");
    var cv=screen(el,250),cc=cctx(cv), out=panel(el), ro=readout(el);
    var cols=["--signal","--blue","--alias","--muted"];
    function steps(a,b){var s=[];while(b>0&&s.length<80){var q=Math.floor(a/b),r=a%b;s.push([a,q,b,r]);a=b;b=r;}return {s:s,g:a};}
    function draw(){
      var a=parseInt(ia.value,10),b=parseInt(ib.value,10);
      var s0=cc.fit(),w=s0.w,h=s0.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(!(a>0&&b>0&&a<=1e9&&b<=1e9)){out.innerHTML='<span style="color:var(--alias)">1 以上 10 億以下の整数を 2 つ入力する</span>';ro.innerHTML="";return;}
      var A=Math.max(a,b),B=Math.min(a,b),res=steps(A,B),st=res.s;
      var pad=12,sc=Math.min((w-2*pad)/A,(h-2*pad)/B),x0=(w-A*sc)/2,y0=(h-B*sc)/2;
      var x=0,y=0,W=A,H=B;
      st.forEach(function(rw,k){
        var q=rw[1],side=rw[2],col=C(cols[k%4]),ps=side*sc,horiz=W>=H;
        if(ps<2){ctx.globalAlpha=.25;ctx.fillStyle=col;
          if(horiz)ctx.fillRect(x0+x*sc,y0+y*sc,q*side*sc,ps);else ctx.fillRect(x0+x*sc,y0+y*sc,ps,q*side*sc);
          ctx.globalAlpha=1;}
        else for(var j=0;j<q;j++){
          var sx=horiz?x+j*side:x, sy=horiz?y:y+j*side, px=x0+sx*sc, py=y0+sy*sc;
          ctx.globalAlpha=.17;ctx.fillStyle=col;ctx.fillRect(px,py,ps,ps);ctx.globalAlpha=1;
          ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.strokeRect(px+.5,py+.5,ps-1,ps-1);
          if(j===0&&ps>=34){ctx.fillStyle=col;ctx.font="700 "+(ps>=70?13:11)+"px "+C("--mono");ctx.textAlign="center";
            ctx.fillText(String(side),px+ps/2,py+ps/2+4);}
        }
        if(horiz){x+=q*side;W-=q*side;}else{y+=q*side;H-=q*side;}
      });
      ctx.strokeStyle=C("--ink");ctx.lineWidth=1.6;ctx.strokeRect(x0,y0,A*sc,B*sc);
      var hm='<div style="color:var(--muted);margin-bottom:.35rem">横 '+A+'、縦 '+B+' の長方形。1 段ごとに、短い辺を 1 辺とする正方形を取れるだけ取る（色は段ごと）。</div>';
      if(a<b)hm+='<div style="color:var(--muted);margin-bottom:.35rem">a &lt; b なので、商が 0 になる最初の段（a と b が入れ替わるだけ）を省いた。</div>';
      st.forEach(function(rw,k){
        hm+='<div style="color:var('+cols[k%4]+');font-weight:'+(rw[3]===0?700:500)+'">'+rw[0]+' = '+rw[1]+' × '+rw[2]+' + '+rw[3]+
          '<span style="color:var(--muted);font-weight:400">　（'+rw[2]+' の正方形を '+rw[1]+' 個）</span></div>';
      });
      out.innerHTML=hm;
      var kb=B.toString(2).length;
      ro.innerHTML='gcd('+a+', '+b+') = <b class="ok">'+res.g+'</b>（最後の正方形の辺） ／ 割り算 <b>'+st.length+'</b> 回 ／ '+
        '上限: 2 × （'+B+' の 2 進の桁数 '+kb+'）= <b>'+(2*kb)+'</b> 回';
    }
    ia.addEventListener("input",draw);ib.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 01. powbits — 繰り返し二乗法をビットごとに追う ============ */
  REG.powbits=function(el){
    head(el,"Fast Power","指数の 2 進表示に沿って 2 乗し、1 の桁だけ掛ける");
    var row=ctrls(el);
    var ia=textin(row,"底 a","3","100px"), ie=textin(row,"指数 e","13","150px"), im=textin(row,"法 n","17","150px");
    var out=panel(el), ro=readout(el);
    function run(){
      var a,e,n;
      try{a=BigInt(ia.value.trim());e=BigInt(ie.value.trim());n=BigInt(im.value.trim());}
      catch(err){out.innerHTML='<span style="color:var(--alias)">整数を入力する</span>';ro.innerHTML="";return;}
      if(a<0n||e<1n||n<2n){out.innerHTML='<span style="color:var(--alias)">a ≥ 0、e ≥ 1、n ≥ 2 の整数を入力する</span>';ro.innerHTML="";return;}
      var bits=e.toString(2),k=bits.length;
      if(k>64){out.innerHTML='<span style="color:var(--alias)">指数は 64 ビット以下にする（表が長くなりすぎるため）</span>';ro.innerHTML="";return;}
      var x=a%n,prod=null,sq=0,mul=0,rows=[];
      for(var i=0;i<k;i++){
        if(i>0){x=x*x%n;sq++;}
        var b=bits[k-1-i]==="1";
        if(b){if(prod===null)prod=x;else{prod=prod*x%n;mul++;}}
        rows.push([i,b,x,b?prod:null]);
      }
      var sty='padding:.15rem .6rem;text-align:right';
      var h='<div style="margin-bottom:.45rem">e = '+e+' = <b>'+bits+'</b>₂（'+k+' ビット）。i 行目の値は a の 2<sup>i</sup> 乗を n で割った余りで、1 つ上の行の値の 2 乗から作る。</div>'+
        '<table style="border-collapse:collapse"><tr>'+["i","ビット","a の 2ⁱ 乗 mod n","掛け合わせた積"].map(function(t){
          return '<th style="'+sty+';color:var(--muted);font-weight:600">'+t+'</th>';}).join("")+'</tr>';
      rows.forEach(function(r){
        h+='<tr style="'+(r[1]?'':'opacity:.5')+'"><td style="'+sty+'">'+r[0]+'</td><td style="'+sty+';color:'+(r[1]?'var(--signal)':'var(--faint)')+';font-weight:700">'+(r[1]?1:0)+'</td>'+
          '<td style="'+sty+';'+(r[1]?'color:var(--signal);font-weight:700':'')+'">'+r[2]+'</td>'+
          '<td style="'+sty+'">'+(r[3]===null?'<span style="color:var(--faint)">（掛けない）</span>':r[3])+'</td></tr>';
      });
      h+='</table>';
      out.innerHTML=h;
      var tot=sq+mul;
      ro.innerHTML=a+' の '+e+' 乗 mod '+n+' = <b class="ok">'+prod+'</b> ／ 2 乗 <b>'+sq+'</b> 回 + 掛け算 <b>'+mul+'</b> 回 = <b>'+tot+'</b> 回 ／ '+
        '素直に掛けると e − 1 = '+(e-1n)+' 回';
    }
    [ia,ie,im].forEach(function(t){t.addEventListener("input",run);});reg(null,run);run();
  };

  /* ============ 02. groupcheck — 集合と演算の組が群になるか ============ */
  REG.groupcheck=function(el){
    head(el,"Group Check","集合と演算の組が群の 4 条件を満たすか");
    var row=ctrls(el);
    var sel=select(row,"集合と演算",["Z_n と足し算","Z_n と掛け算","Z_n から 0 を除いた集合と掛け算",
      "Z_n*（n と互いに素な要素）と掛け算","Z_n と引き算"]);
    sel.value="2";
    var sn=slider(row,"n",2,12,6,1);
    var out=panel(el), ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function run(){
      var n=+sn.input.value, md=+sel.value, S=[], op, sym, i;
      sn.val.textContent=n;
      if(md===0){for(i=0;i<n;i++)S.push(i);op=function(a,b){return (a+b)%n;};sym="+";}
      else if(md===1){for(i=0;i<n;i++)S.push(i);op=function(a,b){return a*b%n;};sym="×";}
      else if(md===2){for(i=1;i<n;i++)S.push(i);op=function(a,b){return a*b%n;};sym="×";}
      else if(md===3){for(i=1;i<n;i++)if(gcd(i,n)===1)S.push(i);op=function(a,b){return a*b%n;};sym="×";}
      else{for(i=0;i<n;i++)S.push(i);op=function(a,b){return ((a-b)%n+n)%n;};sym="−";}
      var inS={};S.forEach(function(v){inS[v]=true;});
      var clos=null,asc=null,e=null,com=null,noinv=null;
      S.forEach(function(a){S.forEach(function(b){
        if(!clos&&!inS[op(a,b)])clos=[a,b,op(a,b)];
        if(!com&&op(a,b)!==op(b,a))com=[a,b];
        S.forEach(function(c){if(!asc&&op(op(a,b),c)!==op(a,op(b,c)))asc=[a,b,c];});
      });});
      S.forEach(function(c){if(e===null&&S.every(function(a){return op(c,a)===a&&op(a,c)===a;}))e=c;});
      var inv={};
      if(e!==null)S.forEach(function(a){
        var f=S.filter(function(b){return op(a,b)===e&&op(b,a)===e;});
        if(f.length)inv[a]=f[0];else if(noinv===null)noinv=a;});
      // 演算表
      var th='padding:.12rem .42rem;color:var(--muted);font-weight:600;text-align:center';
      var h='<div style="color:var(--muted);margin-bottom:.35rem">演算表（行 '+sym+' 列）。赤は集合の外に出た結果、緑は単位元'+
        (e!==null?' '+e:'')+'。</div><table style="border-collapse:collapse"><tr><th style="'+th+'">'+sym+'</th>'+
        S.map(function(b){return '<th style="'+th+'">'+b+'</th>';}).join("")+'</tr>';
      S.forEach(function(a){
        h+='<tr><th style="'+th+'">'+a+'</th>'+S.map(function(b){var v=op(a,b),out=!inS[v],id=(e!==null&&v===e);
          return '<td style="padding:.12rem .42rem;text-align:center;'+(out?'background:var(--alias-soft);color:var(--alias);font-weight:700':
            (id?'background:var(--signal-soft);color:var(--signal);font-weight:700':''))+'">'+v+'</td>';}).join("")+'</tr>';
      });
      h+='</table>';
      function ok(t){return '<span style="color:var(--signal);font-weight:700">✓</span> '+t;}
      function ng(t){return '<span style="color:var(--alias);font-weight:700">✗</span> '+t;}
      var rows=[
        ['<span style="white-space:nowrap">'+"1. 閉性"+'</span>',clos?ng(clos[0]+' '+sym+' '+clos[1]+' = '+clos[2]+' が集合の外'):ok('どの結果も集合の中')],
        ['<span style="white-space:nowrap">'+"2. 結合律"+'</span>',asc?ng('('+asc[0]+' '+sym+' '+asc[1]+') '+sym+' '+asc[2]+' = '+op(op(asc[0],asc[1]),asc[2])+' だが '+
          asc[0]+' '+sym+' ('+asc[1]+' '+sym+' '+asc[2]+') = '+op(asc[0],op(asc[1],asc[2]))):ok('どの 3 つの組でも成り立つ')],
        ['<span style="white-space:nowrap">'+"3. 単位元"+'</span>',e!==null?ok('e = '+e):ng('どの要素を選んでも、すべての a で e '+sym+' a = a '+sym+' e = a にはならない')],
        ['<span style="white-space:nowrap">'+"4. 逆元"+'</span>',e===null?'<span style="color:var(--faint)">— 単位元が無いので調べられない</span>':
          (noinv!==null?ng(noinv+' '+sym+' x = '+e+' となる x が集合の中に無い'):ok('どの要素にも逆元がある'))],
        ['<span style="white-space:nowrap">'+"（参考）交換律"+'</span>',com?ng(com[0]+' '+sym+' '+com[1]+' ≠ '+com[1]+' '+sym+' '+com[0]):ok('どの組でも a '+sym+' b = b '+sym+' a')]];
      h+='<div style="margin-top:.7rem">'+tbl(["条件","結果"],rows,["left","left"])+'</div>';
      out.innerHTML=h;
      var bad=[];if(clos)bad.push("閉性");if(asc)bad.push("結合律");if(e===null)bad.push("単位元");else if(noinv!==null)bad.push("逆元");
      ro.innerHTML='集合 {'+S.join(", ")+'}（'+S.length+' 個）と '+sym+' mod '+n+' ／ '+
        (bad.length?'<span class="warn">群ではない（破れた条件: '+bad.join("、")+'）</span>':
          '<b class="ok">群である'+(com?'':'（可換群）')+'</b>');
    }
    sel.addEventListener("change",run);sn.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 02. cosets — 群を H と同じ大きさの塊に切り分ける ============ */
  REG.cosets=function(el){
    head(el,"Lagrange","群 G を、H をずらした塊に切り分ける");
    var row=ctrls(el);
    var sg=select(row,"群 G",["Z_n と足し算","Z_n* と掛け算"]);
    var sn=slider(row,"n",2,16,8,1);
    var row2=ctrls(el);
    var sh=select(row2,"H の作り方",["a が生成する部分群 〈a〉","要素を自分で入力する"]);
    var sa=slider(row2,"a（G の要素）",0,7,4,1);
    var ti=textin(row2,"H の要素（カンマ区切り）","0,1");
    var out=panel(el), ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function run(){
      var n=+sn.input.value, mul=sg.value==="1", own=sh.value==="1", i;
      sn.val.textContent=n;
      sa.input.parentElement.style.display=own?"none":"";
      ti.parentElement.style.display=own?"":"none";
      var G=[];for(i=0;i<n;i++)if(!mul||gcd(i,n)===1)G.push(i);
      var op=mul?function(a,b){return a*b%n;}:function(a,b){return (a+b)%n;};
      var e=mul?1:0, sym=mul?"·":"+";
      var inG={};G.forEach(function(v){inG[v]=true;});
      sa.input.max=G.length-1; if(+sa.input.value>G.length-1)sa.input.value=G.length-1;
      var H=[],note="";
      if(!own){
        var a=G[+sa.input.value]; sa.val.textContent=a;
        var v=a;H.push(v);var guard=0;while(v!==e&&guard++<64){v=op(v,a);H.push(v);}
        note='〈'+a+'〉 = {'+H.join(", ")+'}（'+a+' を 1 個、2 個、… と並べて'+(mul?'掛けた':'足した')+'もの）';
      }else{
        var seen={};
        ti.value.split(",").forEach(function(s){var t=s.trim();if(!/^-?\d+$/.test(t))return;var x=((parseInt(t,10)%n)+n)%n;
          if(inG[x]&&!seen[x]){seen[x]=1;H.push(x);}});
        if(!H.length){out.innerHTML='<span style="color:var(--alias)">G の要素を 1 つ以上入力する（G = {'+G.join(", ")+'}）</span>';ro.innerHTML="";return;}
        note='H = {'+H.join(", ")+'}';
      }
      var inH={};H.forEach(function(v){inH[v]=true;});
      // 部分群の 3 条件
      var c1=null,c3=null;
      H.forEach(function(x){H.forEach(function(y){if(!c1&&!inH[op(x,y)])c1=[x,y,op(x,y)];});});
      var c2=!!inH[e];
      H.forEach(function(x){if(c3!==null)return;var ix=G.filter(function(y){return op(x,y)===e;})[0];if(!inH[ix])c3=x;});
      var isSub=!c1&&c2&&c3===null;
      // 塊
      var blocks=[],lab="ABCDEFGHIJKLMNOP",rowsH="",partial=false;
      G.forEach(function(g){
        var B=H.map(function(h){return op(g,h);}).filter(function(v,k,arr){return arr.indexOf(v)===k;}).sort(function(p,q){return p-q;});
        var key=B.join(","),same=-1,over=[];
        blocks.forEach(function(b,k){if(b.key===key)same=k;else{var com=B.filter(function(v){return b.set[v];});if(com.length)over.push([k,com]);}});
        var chips,tag;
        if(same>=0){chips='var(--muted)';tag='<span style="color:var(--muted)">= 塊 '+lab[same]+'（'+blocks[same].g+' '+sym+' H）と同じ</span>';}
        else if(over.length){partial=true;chips='var(--alias)';
          tag='<span style="color:var(--alias);font-weight:700">塊 '+lab[over[0][0]]+' と '+over[0][1].join(", ")+' だけを共有（一部だけ重なる）</span>';
          var st={};B.forEach(function(v){st[v]=1;});blocks.push({key:key,set:st,g:g});}
        else{var st2={};B.forEach(function(v){st2[v]=1;});blocks.push({key:key,set:st2,g:g});chips='var(--signal)';
          tag='<span style="color:var(--signal);font-weight:700">新しい塊 '+lab[blocks.length-1]+'</span>';}
        rowsH+='<tr><td style="padding:.12rem .5rem;white-space:nowrap">'+g+' '+sym+' H =</td><td style="padding:.12rem .5rem;white-space:nowrap">'+
          B.map(function(v){return '<span style="display:inline-block;min-width:1.7em;text-align:center;margin:0 .12rem;padding:0 .2rem;border:1.5px solid '+chips+';border-radius:5px">'+v+'</span>';}).join("")+
          '</td><td style="padding:.12rem .5rem">'+tag+'</td></tr>';
      });
      var dist={};var nd=0;blocks.forEach(function(b){if(!dist[b.key]){dist[b.key]=1;nd++;}});
      out.innerHTML='<div style="color:var(--muted);margin-bottom:.35rem">G = {'+G.join(", ")+'}（|G| = '+G.length+'）、'+note+'</div>'+
        '<table style="border-collapse:collapse">'+rowsH+'</table>';
      var why=[];if(c1)why.push(c1[0]+' '+sym+' '+c1[1]+' = '+c1[2]+' が H の外');if(!c2)why.push('単位元 '+e+' を含まない');
      if(c3!==null)why.push(c3+' の逆元が H の外');
      ro.innerHTML=(isSub?'<b class="ok">H は部分群</b>':'<span class="warn">H は部分群でない（'+why.join("、")+'）</span>')+' ／ '+
        (partial?'<span class="warn">一部だけ重なる塊があり、同じ大きさの塊に切り分けられない</span>':
          '塊 '+nd+' 個 × |H| = '+H.length+' → '+nd+' × '+H.length+' = '+(nd*H.length)+(nd*H.length===G.length?' = |G| <span class="ok">✓</span>':'')+
          (isSub?'':'（部分群でないので、この分かれ方は定理では保証されない）'));
    }
    [sg,sh].forEach(function(s){s.addEventListener("change",run);});
    sn.input.addEventListener("input",run);sa.input.addEventListener("input",run);ti.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 02. zerodiv — Z_m の 0 以外は「逆元を持つ」か「零因子」か ============ */
  REG.zerodiv=function(el){
    head(el,"Zero Divisor","Z_m の 0 以外の要素を、逆元を持つものと零因子に分ける");
    var row=ctrls(el);
    var sm=slider(row,"法 m",2,30,12,1);
    var out=panel(el), ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function run(){
      var m=+sm.input.value; sm.val.textContent=m;
      var inv=[],zd=[],h='<div style="display:flex;flex-wrap:wrap;gap:.4rem">';
      for(var a=1;a<m;a++){
        var g=gcd(a,m),ok=g===1,partner,line;
        if(ok){for(var b=1;b<m;b++)if(a*b%m===1){partner=b;break;}line=a+' × '+partner+' ≡ 1';inv.push(a);}
        else{partner=m/g;line=a+' × '+partner+' ≡ 0';zd.push(a);}
        var col=ok?'var(--signal)':'var(--alias)',bg=ok?'var(--signal-soft)':'var(--alias-soft)';
        h+='<div style="border:1.5px solid '+col+';background:'+bg+';border-radius:8px;padding:.25rem .5rem;min-width:6.6em;line-height:1.35">'+
          '<div style="font-weight:700;font-size:.95rem;color:var(--ink)">'+a+'</div>'+
          '<div style="color:var(--muted)">gcd = '+g+'</div><div style="color:'+col+';font-weight:600">'+line+'</div></div>';
      }
      out.innerHTML=h+'</div>';
      ro.innerHTML='逆元を持つ（gcd = 1）: <b class="ok">'+inv.length+'</b> 個 ／ 零因子（gcd &gt; 1）: <b'+(zd.length?' class="warn"':'')+'>'+zd.length+'</b> 個 ／ '+
        (zd.length?'m = '+m+' は合成数。零因子の相手は m ÷ gcd':'<b class="ok">m = '+m+' は素数なので零因子は無く、0 以外のすべてが逆元を持つ</b>');
    }
    sm.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 03. gfpcycle — g^k の位数を指数の円で見る ============ */
  REG.gfpcycle=function(el){
    head(el,"Order","g^k の位数 — 指数の円を k ずつ進み、0 に戻るまでの歩数を数える");
    var PR=[3,5,7,11,13,17,19,23,29,31];
    var row=ctrls(el);
    var sp=slider(row,"素数 p",0,PR.length-1,2,1), sk=slider(row,"指数 k",1,6,2,1);
    var cv=screen(el,330),cc=cctx(cv), ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function pw(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=r*b%m;b=b*b%m;e>>=1;}return r;}
    function primroot(p){for(var g=2;g<p;g++){var v=1,ok=true;for(var i=1;i<p-1;i++){v=v*g%p;if(v===1){ok=false;break;}}if(ok)return g;}return 1;}
    function draw(){
      var p=PR[+sp.input.value], n=p-1;
      sk.input.max=n; if(+sk.input.value>n)sk.input.value=n;
      var k=+sk.input.value, g=primroot(p), d=gcd(k,n), ord=n/d;
      sp.val.textContent=p; sk.val.textContent=k;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var cx=w/2, cy=h/2+4, R=Math.min(w*0.36,h/2-44), nr=n>20?9:12;
      function P(e){var a=-Math.PI/2+TAU*e/n;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];}
      var seen=[0];while(true){var nx=(seen[seen.length-1]+k)%n;if(nx===0)break;seen.push(nx);}
      var on={};seen.forEach(function(e){on[e]=true;});
      var col=d===1?C("--signal"):C("--blue");
      /* 進む向きの矢印 */
      ctx.lineWidth=1.6;
      seen.forEach(function(e,i){
        var f=seen[(i+1)%seen.length], a=P(e), b=P(f), dx=b[0]-a[0], dy=b[1]-a[1], L=Math.sqrt(dx*dx+dy*dy);
        if(L<1)return;
        var ox=0,oy=0; if(seen.length===2){ox=-dy/L*4;oy=dx/L*4;}
        var x1=a[0]+dx/L*(nr+2)+ox, y1=a[1]+dy/L*(nr+2)+oy, x2=b[0]-dx/L*(nr+3)+ox, y2=b[1]-dy/L*(nr+3)+oy;
        ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
        var an=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(x2,y2);
        ctx.lineTo(x2-7*Math.cos(an-0.4),y2-7*Math.sin(an-0.4));ctx.lineTo(x2-7*Math.cos(an+0.4),y2-7*Math.sin(an+0.4));ctx.closePath();ctx.fill();
      });
      /* 位置（指数 e）と、その位置の要素 g^e */
      for(var e=0;e<n;e++){
        var q=P(e), hit=!!on[e];
        ctx.beginPath();ctx.arc(q[0],q[1],nr,0,TAU);
        ctx.fillStyle=hit?(d===1?C("--signal-soft"):"rgba(47,111,158,.16)"):C("--panel");ctx.fill();
        ctx.strokeStyle=hit?col:C("--faint");ctx.lineWidth=hit?1.6:1;ctx.setLineDash(hit?[]:[3,3]);ctx.stroke();ctx.setLineDash([]);
        ctx.font=(n>20?"10px ":"11px ")+C("--mono");ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillStyle=hit?C("--ink"):C("--muted");ctx.fillText(String(e),q[0],q[1]+0.5);
        var a2=-Math.PI/2+TAU*e/n, rx=cx+(R+nr+11)*Math.cos(a2), ry=cy+(R+nr+11)*Math.sin(a2);
        ctx.font="10px "+C("--mono");ctx.fillStyle=C("--faint");ctx.fillText(String(pw(g,e,p)),rx,ry);
      }
      ctx.textBaseline="alphabetic";
      lab(ctx,"内側の数: 指数 e",10,16,C("--muted"),"left");
      lab(ctx,"外側の数: 要素 "+g+"^e mod "+p,10,32,C("--faint"),"left");
      lab(ctx,"×g^k = 1 回ごとに k 進む",w-10,16,col,"right");
      var prims=[];for(var j=1;j<=n;j++)if(gcd(j,n)===1)prims.push(pw(g,j,p));
      prims.sort(function(a,b){return a-b;});
      ro.innerHTML='g = <b>'+g+'</b>（p = '+p+' の最小の原始元） ／ g^k = '+g+'^'+k+' ≡ <b>'+pw(g,k,p)+'</b> ／ gcd('+k+', '+n+') = <b>'+d+
        '</b> ／ 位数 '+n+' / '+d+' = <b>'+ord+'</b> ／ '+
        (d===1?'<span class="ok">原始元</span>':'<span class="warn">原始元でない</span>')+
        '<br>原始元（gcd(k, '+n+') = 1 となる k の g^k）: <b>'+prims.join(", ")+'</b>（'+prims.length+' 個 = φ('+n+')）';
    }
    sp.input.addEventListener("input",draw);sk.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 03. gfpsolve — GF(p) 上の掃き出し法 ============ */
  REG.gfpsolve=function(el){
    head(el,"Elimination","GF(p) で連立 1 次方程式を掃き出す");
    var PS=[2,3,5,7,11,13];
    var row=ctrls(el);
    var sel=select(row,"法 p（素数）",PS.map(String)); sel.value="2";
    var ti=textin(row,"係数と右辺（1 本の式を ; で区切る）","2 3 4; 1 1 3");
    var out=panel(el), ro=readout(el);
    var VN=["x","y","z","w"];
    function md(a,p){return ((a%p)+p)%p;}
    function inv(a,p){for(var x=1;x<p;x++)if(a*x%p===1)return x;return 0;}
    function eq(r,n){var t=[];for(var j=0;j<n;j++)if(r[j])t.push((r[j]===1?"":r[j])+VN[j]);return (t.length?t.join(" + "):"0")+" = "+r[n];}
    function show(A,n,hl){return A.map(function(r,i){
      return '<div style="padding:.05rem .45rem;border-radius:5px;'+(hl&&hl.indexOf(i)>=0?'background:var(--signal-soft);color:var(--ink);font-weight:700':'')+'">'+(i+1)+' 本目: '+esc(eq(r,n))+'</div>';}).join("");}
    function run(){
      var p=PS[+sel.value];
      var rows=(ti.value||"").split(/[;\n]/).map(function(s){return s.trim();}).filter(function(s){return s.length;});
      var M=rows.map(function(s){return s.split(/[\s,]+/).map(Number);});
      var n=M.length;
      if(n<1||n>4||M.some(function(r){return r.length!==n+1||r.some(function(v){return !isFinite(v)||v!==Math.floor(v);});})){
        out.innerHTML='<span style="color:var(--alias)">式の本数を n（1〜4）として、各式に整数を n + 1 個（係数 n 個と右辺）並べる。例: 2 3 4; 1 1 3</span>';ro.innerHTML="";return;}
      var A=M.map(function(r){return r.map(function(v){return md(v,p);});});
      var h='<div style="color:var(--muted)">始め（係数と右辺を '+p+' で割った余りに直したもの）</div>'+show(A,n,null);
      var ok=true, stepNo=0;
      function step(txt,hl){stepNo++;h+='<div style="color:var(--muted);margin-top:.45rem">'+stepNo+'. '+txt+'</div>'+show(A,n,hl);}
      for(var c=0;c<n&&ok;c++){
        var r=-1;for(var i=c;i<n;i++)if(A[i][c]){r=i;break;}
        if(r<0){ok=false;h+='<div style="margin-top:.45rem;color:var(--alias);font-weight:700">'+VN[c]+' の係数が '+(c+1)+' 本目以降のどの式でも 0 なので、'+VN[c]+' で割ることができない</div>';break;}
        if(r!==c){var t=A[r];A[r]=A[c];A[c]=t;step((c+1)+' 本目と '+(r+1)+' 本目を入れ替える（'+(c+1)+' 本目の '+VN[c]+' の係数が 0 だった）',[c,r]);}
        var a=A[c][c];
        if(a!==1){var ia=inv(a,p);A[c]=A[c].map(function(v){return v*ia%p;});step((c+1)+' 本目に '+a+'⁻¹ = '+ia+' を掛ける（'+a+' × '+ia+' = '+(a*ia)+' ≡ 1）',[c]);}
        for(var i2=0;i2<n;i2++){
          if(i2===c||!A[i2][c])continue;
          var f=A[i2][c];
          A[i2]=A[i2].map(function(v,j){return md(v-f*A[c][j],p);});
          step((i2+1)+' 本目から '+(c+1)+' 本目の '+f+' 倍を引く（'+VN[c]+' を消す）',[i2]);
        }
      }
      out.innerHTML=h;
      if(!ok){ro.innerHTML='<span class="warn">解はただ 1 つには決まらない（解が無いか、複数ある）</span>';return;}
      var sol=A.map(function(r){return r[n];});
      var chk=M.map(function(r){var s=0;for(var j=0;j<n;j++)s+=md(r[j],p)*sol[j];var lhs=md(s,p),rhs=md(r[n],p);
        return s+' ≡ '+lhs+'（右辺 '+rhs+'）'+(lhs===rhs?' <span class="ok">✓</span>':' <span class="warn">✗</span>');});
      ro.innerHTML='解: <b>'+sol.map(function(v,j){return VN[j]+' = '+v;}).join(", ")+'</b> ／ 検算（元の式の左辺）: '+chk.join(" ／ ");
    }
    sel.addEventListener("change",run);ti.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 04. 共通: GF(2) 係数の多項式（係数の配列。添字 = 次数） ============ */
  /* 他章の wNN.js と同じスコープに入るので、関数名に w04 を付ける */
  function w04P(s){var a=String(s).replace(/[^01]/g,"").split("").reverse().map(Number);return w04trim(a);}
  function w04trim(a){a=a.slice();while(a.length&&!a[a.length-1])a.pop();return a;}
  function w04S(a){a=w04trim(a);return a.length?a.slice().reverse().join(""):"0";}
  function w04deg(a){a=w04trim(a);return a.length-1;}
  function w04xor(a,b){var n=Math.max(a.length,b.length),r=[];for(var i=0;i<n;i++)r.push((a[i]||0)^(b[i]||0));return w04trim(r);}
  function w04mul(a,b){if(!a.length||!b.length)return [];var r=[];for(var i=0;i<a.length+b.length-1;i++)r.push(0);
    for(var i2=0;i2<a.length;i2++)if(a[i2])for(var j=0;j<b.length;j++)r[i2+j]^=b[j];return w04trim(r);}
  function w04divmod(a,b){a=w04trim(a);b=w04trim(b);var r=a.slice(),q=[],db=b.length-1;
    while(r.length&&r.length-1>=db){var s=r.length-1-db;while(q.length<=s)q.push(0);q[s]=1;
      for(var j=0;j<b.length;j++)r[s+j]^=b[j];r=w04trim(r);}
    return [w04trim(q),r];}
  function w04H(a){a=w04trim(a);if(!a.length)return "0";var t=[];
    for(var e=a.length-1;e>=0;e--)if(a[e])t.push(e===0?"1":e===1?"x":"x<sup>"+e+"</sup>");return t.join(" + ");}
  function w04cells(s,n,sty){var h="",pad=n-s.length;for(var i=0;i<n;i++){var c=i<pad?"":s[i-pad];
      h+='<span style="display:inline-block;width:1.5em;text-align:center;'+(sty?sty(i,c):"")+'">'+c+'</span>';}return h;}
  function w04line(lab,cells,note,labSty){
    return '<div style="display:flex;align-items:center;white-space:nowrap">'+
      '<span style="display:inline-block;min-width:3.2em;text-align:right;padding-right:.4em;color:var(--faint);'+(labSty||"")+'">'+lab+'</span>'+
      cells+(note?'<span style="color:var(--muted);padding-left:.8em;font-size:.92em">'+note+'</span>':'')+'</div>';}

  /* ============ 04. polyarith — 和（XOR）と積（ずらして XOR） ============ */
  REG.polyarith=function(el){
    head(el,"Add / Multiply","GF(2) 係数の多項式の和と積");
    var row=ctrls(el);
    var ia=textin(row,"a（2 進）","1011","140px"), ib=textin(row,"b（2 進）","111","140px");
    var out=panel(el), ro=readout(el);
    function run(){
      var A=w04P(ia.value), B=w04P(ib.value);
      if(!A.length||!B.length||A.length>16||B.length>16){out.innerHTML='<span style="color:var(--alias)">0 でない多項式を、16 ビット以内の 0 と 1 で入力する</span>';ro.innerHTML="";return;}
      var sa=w04S(A), sb=w04S(B), sum=w04xor(A,B), ss=w04S(sum), prod=w04mul(A,B), sp=w04S(prod);
      var h='<div style="color:var(--muted);margin-bottom:.2rem">和: 同じ次数の係数どうしを XOR</div>';
      var n1=Math.max(sa.length,sb.length);
      h+=w04line("a",w04cells(sa,n1),w04H(A));
      h+=w04line("⊕ b",w04cells(sb,n1),w04H(B));
      h+='<div style="margin-left:3.6em;width:'+(1.5*n1)+'em;border-top:1.5px solid var(--ink)"></div>';
      h+=w04line("a + b",w04cells(ss==="0"?"0":ss,n1,function(){return "color:var(--signal);font-weight:700";}),w04H(sum));
      /* 積の筆算: b の 1 の項ごとに a をずらした行 */
      var n2=sp.length, rows=[], cnt=[];
      for(var c=0;c<n2;c++)cnt.push(0);
      h+='<div style="color:var(--muted);margin:.7rem 0 .2rem">積: b の 1 の項ごとに a をずらして並べ、XOR でまとめる</div>';
      h+=w04line("a",w04cells(sa,n2),w04H(A));
      h+=w04line("× b",w04cells(sb,n2),w04H(B));
      h+='<div style="margin-left:3.6em;width:'+(1.5*n2)+'em;border-top:1.5px solid var(--ink)"></div>';
      for(var k=0;k<B.length;k++){
        if(!B[k])continue;
        var sh=sa+new Array(k+1).join("0");
        for(var e=0;e<A.length;e++)if(A[e])cnt[n2-1-(e+k)]++;
        rows.push(w04line("",w04cells(sh,n2,function(i,ch){return (ch===""?"":"color:var(--ink)");}),
          '← '+(k===0?'1 の項':k===1?'x の項':'x<sup>'+k+'</sup> の項')+(k?'（'+k+' 桁左へ）':'（ずらさない）')));
      }
      h+=rows.join("");
      h+='<div style="margin-left:3.6em;width:'+(1.5*n2)+'em;border-top:1.5px solid var(--ink)"></div>';
      h+=w04line("a × b",w04cells(sp,n2,function(i){return cnt[i]>=2&&cnt[i]%2===0?"color:var(--alias);font-weight:700":"color:var(--signal);font-weight:700";}),w04H(prod));
      h+='<div style="color:var(--faint);margin-top:.35rem;font-size:.9em">赤の桁: 1 が偶数個重なって消えた桁（1 ⊕ 1 = 0）</div>';
      out.innerHTML=h;
      ro.innerHTML='a + b = <b>'+ss+'</b> ／ a × b = <b>'+sp+'</b> ／ 積の次数 '+w04deg(prod)+' = '+w04deg(A)+' + '+w04deg(B)+
        ' <span class="ok">（次数は足し算）</span>';
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 04. polydivq — 割り算の筆算と、商・余りの検算 ============ */
  REG.polydivq=function(el){
    head(el,"Division","筆算で商と余りを求め、f = q·g + r を確かめる");
    var row=ctrls(el);
    var ia=textin(row,"被除数 f（2 進）","1101000","150px"), ib=textin(row,"除数 g（2 進）","1011","120px");
    var out=panel(el), ro=readout(el);
    function run(){
      var A=(ia.value||"").replace(/[^01]/g,""), B=(ib.value||"").replace(/[^01]/g,"");
      var F=w04P(A), G=w04P(B);
      if(!F.length||!G.length||A.length>24||B.length>24){out.innerHTML='<span style="color:var(--alias)">0 でない多項式を、24 ビット以内の 0 と 1 で入力する</span>';ro.innerHTML="";return;}
      var R=longDiv(w04S(F),w04S(G));
      out.innerHTML=R.html;
      var qr=w04divmod(F,G), q=qr[0], r=qr[1], back=w04xor(w04mul(q,G),r);
      var same=w04S(back)===w04S(F), dr=w04deg(r), dg=w04deg(G);
      ro.innerHTML='商 q = <b>'+w04S(q)+'</b>（'+w04H(q)+'） ／ 余り r = <b>'+w04S(r)+'</b>（'+w04H(r)+'）<br>'+
        (r.length?'deg r = '+dr+' &lt; deg g = '+dg:'r = 0（割り切れる）')+' ／ 検算 q·g + r = '+w04S(back)+
        (same?' <span class="ok">= f ✓</span>':' <span class="warn">≠ f</span>');
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 04. polyorder — x^i mod f を並べて、x の位数と原始性を見る ============ */
  REG.polyorder=function(el){
    head(el,"Order of x","x, x², x³, … を f で割った余りが 1 に戻るまで");
    var row=ctrls(el);
    var ia=textin(row,"f（2 進、次数 2〜8）","10011","150px");
    var out=panel(el), ro=readout(el);
    function irreducible(f){var n=w04deg(f);
      for(var d=1;d*2<=n;d++)for(var g=(1<<d);g<(1<<(d+1));g++){var G=w04P(g.toString(2));if(!w04divmod(f,G)[1].length)return G;}
      return null;}
    function run(){
      var f=w04P(ia.value), m=w04deg(f);
      if(m<2||m>8){out.innerHTML='<span style="color:var(--alias)">次数 2〜8 の多項式を 0 と 1 で入力する（例: 10011 = x⁴ + x + 1）</span>';ro.innerHTML="";return;}
      var fac=irreducible(f), full=(1<<m)-1;
      var seen={}, seq=[], v=[1], N=0, stuck=false;
      for(var i=1;i<=full+1;i++){
        v=w04divmod([0].concat(v),f)[1];              /* x を掛けて f で割った余り */
        var key=w04S(v);
        if(key==="1"){seq.push(key);N=i;break;}
        if(seen[key]||!v.length){stuck=true;seq.push(key);break;}
        seen[key]=true;seq.push(key);
      }
      var h='<div style="margin-bottom:.4rem;color:var(--muted)">x<sup>i</sup> mod f（i = 1, 2, …）を '+m+' ビットで</div><div style="display:flex;flex-wrap:wrap;gap:.3rem">';
      seq.forEach(function(s,i){
        var bits=(new Array(m+1).join("0")+s).slice(-m), one=(s==="1"&&N===i+1), bad=stuck&&i===seq.length-1;
        h+='<span style="padding:.15rem .4rem;border-radius:6px;background:'+(one?"var(--alias)":bad?"var(--alias-soft)":"var(--signal-soft)")+
          ';color:'+(one?"var(--panel)":"var(--ink)")+';font-weight:'+(one?"700":"400")+'"><span style="font-size:.78em;opacity:.8">x<sup>'+(i+1)+'</sup> </span>'+bits+'</span>';
      });
      h+='</div>';
      out.innerHTML=h;
      var fs='f = '+w04H(f);
      if(!f[0]){ro.innerHTML=fs+' ／ <span class="warn">定数項が 0 なので f は x で割り切れる。x のべき乗を f で割った余りは 1 に戻らない</span>';return;}
      if(stuck){ro.innerHTML=fs+' ／ <span class="warn">x のべき乗の余りが 1 に戻らない</span>';return;}
      var irr=fac?'<span class="warn">可約</span>（'+w04H(fac)+' で割り切れる）':'<span class="ok">既約</span>';
      ro.innerHTML=fs+'（次数 '+m+'） ／ '+irr+' ／ x の位数 N = <b>'+N+'</b> ／ 0 以外の余り '+full+' 通りのうち <b>'+N+'</b> 通りが現れる ／ '+
        (!fac&&N===full?'<span class="ok">原始多項式</span>':!fac?'<span class="warn">既約だが原始多項式ではない</span>':'<span class="warn">既約でないので原始多項式ではない</span>');
    }
    ia.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 04. polygcd — 多項式の互除法（各ステップの筆算と、拡張版の u, v） ============ */
  REG.polygcd=function(el){
    head(el,"Polynomial GCD","互除法の各ステップの筆算と gcd、拡張版の u, v");
    var row=ctrls(el);
    var ia=textin(row,"a（2 進）","11011","150px"), ib=textin(row,"b（2 進）","1011","150px");
    var out=panel(el), ro=readout(el);
    function run(){
      var A=w04P(ia.value), B=w04P(ib.value);
      if(!A.length||!B.length||A.length>20||B.length>20){out.innerHTML='<span style="color:var(--alias)">0 でない多項式を、20 ビット以内の 0 と 1 で入力する</span>';ro.innerHTML="";return;}
      var r0=A, r1=B, s0=[1], s1=[], t0=[], t1=[1], h='', k=0;
      while(r1.length&&k<40){
        k++;
        var qr=w04divmod(r0,r1), q=qr[0], r=qr[1];
        h+='<div style="color:var(--muted);margin:'+(k>1?'.7rem':'0')+' 0 .2rem">ステップ '+k+': '+w04S(r0)+' ÷ '+w04S(r1)+
          '（商 '+w04S(q)+'、余り '+w04S(r)+'）</div>';
        h+='<div style="display:inline-block">'+longDiv(w04S(r0),w04S(r1)).html+'</div>';
        var s2=w04xor(s0,w04mul(q,s1)), t2=w04xor(t0,w04mul(q,t1));
        r0=r1;r1=r;s0=s1;s1=s2;t0=t1;t1=t2;
      }
      out.innerHTML=h;
      var chk=w04xor(w04mul(A,s0),w04mul(B,t0));
      ro.innerHTML='gcd = <b>'+w04S(r0)+'</b>（'+w04H(r0)+'）'+(w04S(r0)==="1"?' <span class="ok">互いに素</span>':'')+
        '<br>拡張版: u = <b>'+w04H(s0)+'</b>、v = <b>'+w04H(t0)+'</b> ／ a·u + b·v = '+w04S(chk)+
        (w04S(chk)===w04S(r0)?' <span class="ok">= gcd ✓</span>':' <span class="warn">≠ gcd</span>');
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 05. 共通: GF(2^8) の小道具 ============ */
  function g5hex(v){return "0x"+("0"+v.toString(16).toUpperCase()).slice(-2);}
  function g5bin(v,n){var s=v.toString(2);while(s.length<n)s="0"+s;return n===8?s.slice(0,4)+" "+s.slice(4):s;}
  function g5sup(n){return String(n).replace(/\d/g,function(d){return "⁰¹²³⁴⁵⁶⁷⁸⁹".charAt(+d);});}
  function g5read(inp){var s=(inp.value||"").trim().replace(/^0x/i,"");return /^[0-9a-fA-F]{1,2}$/.test(s)?parseInt(s,16):null;}
  function g5mul(a,b,poly,m){var top=1<<(m||8),r=0;while(b){if(b&1)r^=a;a<<=1;if(a&top)a^=poly;b>>=1;}return r;}
  function g5th(t,al){return '<th style="padding:.2rem .6rem;color:var(--muted);font-weight:600;text-align:'+(al||"right")+';white-space:nowrap">'+t+'</th>';}
  function g5td(v,al){return '<td style="padding:.18rem .6rem;text-align:'+(al||"right")+';white-space:nowrap">'+v+'</td>';}

  /* ============ 05. xtmul — AES の GF(2^8) の掛け算を xtime の繰り返しで ============ */
  REG.xtmul=function(el){
    head(el,"xtime","a × b を xtime の繰り返しと XOR で計算する（AES、f = 0x11B）");
    var row=ctrls(el);
    var ia=textin(row,"a（16 進 2 桁）","57"), ib=textin(row,"b（16 進 2 桁）","13");
    var out=panel(el), ro=readout(el);
    function run(){
      var a=g5read(ia), b=g5read(ib);
      if(a===null||b===null){out.innerHTML='<span style="color:var(--alias)">a と b は 00〜FF の 16 進数で入力する</span>';ro.innerHTML="";return;}
      var top=-1;for(var k=7;k>=0;k--)if((b>>k)&1){top=k;break;}
      var h='<div style="margin-bottom:.45rem">b = '+g5hex(b)+' = '+g5bin(b,8)+'₂ → 1 のビットは i = '+
        ([0,1,2,3,4,5,6,7].filter(function(i){return (b>>i)&1;}).join(", ")||"（無し）")+'</div>';
      h+='<table style="border-collapse:collapse"><tr>'+g5th("i")+g5th("bᵢ")+g5th("a · xⁱ（2 進）")+g5th("16 進")+g5th("前の行からの xtime","left")+'</tr>';
      var v=a, r=0, nx=0, ovs=[];
      for(var i=0;i<8;i++){
        var ov=false;
        if(i>0){ov=(v&0x80)!==0;v=((v<<1)&0xFF)^(ov?0x1B:0);}
        var on=(b>>i)&1, need=i<=top;
        if(on){r^=v;nx++;}
        if(ov&&need)ovs.push(i);
        var st=on?'background:var(--signal-soft);color:var(--signal);font-weight:700':(need?'color:var(--ink)':'color:var(--faint)');
        var xt=i===0?'—':(ov?'<span style="color:'+(need?'var(--alias)':'var(--faint)')+'">あふれ → ⊕ 0x1B</span>':'シフトのみ');
        h+='<tr style="'+st+'">'+g5td(i)+g5td(on)+g5td(g5bin(v,8))+g5td(g5hex(v))+g5td(xt+(on?'　← 足す':''),"left")+'</tr>';
      }
      h+='<tr style="border-top:1.5px solid var(--ink);color:var(--signal);font-weight:700">'+g5td("")+g5td("")+g5td(g5bin(r,8))+g5td(g5hex(r))+g5td("bᵢ = 1 の行の XOR","left")+'</tr></table>';
      if(top<0)h+='<div style="margin-top:.4rem;color:var(--faint)">b = 0 なので、どの行も足さない（積は 0）</div>';
      else if(top<7)h+='<div style="margin-top:.4rem;color:var(--faint)">薄い行（i &gt; '+top+'）は b のビットが無いので使わない</div>';
      out.innerHTML=h;
      ro.innerHTML=g5hex(a)+' × '+g5hex(b)+' = <b class="ok">'+g5hex(r)+'</b> ／ XOR で足した行: <b>'+nx+'</b>（b の 1 のビットの数） ／ '+
        '使う行で 0x1B を足した xtime: <b>'+ovs.length+'</b> 回'+(ovs.length?'（i = '+ovs.join(", ")+'）':'');
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 05. inv254 — b^254 で逆元、a ÷ b ============ */
  REG.inv254=function(el){
    head(el,"Inverse","b²⁵⁴ で逆元を求め、a ÷ b を計算する（AES、f = 0x11B）");
    var row=ctrls(el);
    var ib=textin(row,"b（16 進 2 桁）","53"), ia=textin(row,"a（16 進 2 桁。a ÷ b に使う）","FE");
    var out=panel(el), ro=readout(el);
    function mul(x,y){return g5mul(x,y,0x11B);}
    function run(){
      var b=g5read(ib), a=g5read(ia);
      if(a===null||b===null){out.innerHTML='<span style="color:var(--alias)">a と b は 00〜FF の 16 進数で入力する</span>';ro.innerHTML="";return;}
      var sq=[b];for(var k=1;k<8;k++)sq.push(mul(sq[k-1],sq[k-1]));
      var h='<div style="margin-bottom:.45rem">254 = 1111 1110₂ = 2 + 4 + 8 + 16 + 32 + 64 + 128（b¹ は使わない）</div>';
      h+='<table style="border-collapse:collapse"><tr>'+g5th("2 乗の列")+g5th("値")+g5th("","center")+g5th("掛け合わせた値")+g5th("値")+'</tr>';
      var prod=0,e=0;
      for(var j=0;j<8;j++){
        var left='b'+(j?g5sup(Math.pow(2,j)):''), lv=g5hex(sq[j]);
        var rt='',rv='',op='';
        if(j===1){prod=sq[1];e=2;rt='b²';rv=g5hex(prod);op='そのまま';}
        else if(j>1){prod=mul(prod,sq[j]);e+=Math.pow(2,j);rt='b'+g5sup(e);rv=g5hex(prod);op='× b'+g5sup(Math.pow(2,j));}
        var last=j===7;
        var st=j===0?'color:var(--faint)':(last?'color:var(--signal);font-weight:700;background:var(--signal-soft)':'');
        h+='<tr style="'+st+'">'+g5td(left)+g5td(lv)+g5td(op,"center")+g5td(rt)+g5td(rv)+'</tr>';
      }
      h+='</table>';
      out.innerHTML=h;
      var inv=prod;
      if(b===0){
        ro.innerHTML='<span class="warn">0 には逆元が無い</span>（b²⁵⁴ = 0x00 となり、0x00 × 0x00 = 0x00 ≠ 0x01）';
        return;
      }
      var q=mul(a,inv);
      ro.innerHTML='b⁻¹ = b²⁵⁴ = <b class="ok">'+g5hex(inv)+'</b>（検算 '+g5hex(b)+' × '+g5hex(inv)+' = <b>'+g5hex(mul(b,inv))+'</b>） ／ '+
        'a ÷ b = '+g5hex(a)+' × '+g5hex(inv)+' = <b class="ok">'+g5hex(q)+'</b>（検算 '+g5hex(q)+' × '+g5hex(b)+' = <b>'+g5hex(mul(q,b))+'</b>） ／ '+
        '2 乗 7 回・掛け算 6 回（b の値によらない）';
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 05. logmul — 対数表と逆対数表で掛け算する ============ */
  REG.logmul=function(el){
    head(el,"Log table","対数表を 2 回、逆対数表を 1 回引いて掛け算する");
    var row=ctrls(el);
    var fields=[["GF(2³)　f = x³ + x + 1、底 α = 010",0xB,3,[6,7]],["GF(2⁴)　f = x⁴ + x + 1、底 α = 0010",0x13,4,[6,11]],
                ["GF(2⁸)　f = 0x11D（QR コード）、底 α = 0x02",0x11D,8,[0x12,0x34]]];
    var sel=select(row,"体",fields.map(function(F){return F[0];}));
    var row2=ctrls(el);
    var sa=slider(row2,"a",1,7,6,1), sb=slider(row2,"b",1,7,7,1);
    var out=panel(el), ro=readout(el);
    var EXP=[],LOG=[],N=7,M=3,P=0xB;
    function build(){
      var F=fields[+sel.value];P=F[1];M=F[2];N=(1<<M)-1;EXP=[];LOG=[];
      var v=1;for(var i=0;i<N;i++){EXP.push(v);LOG[v]=i;v<<=1;if(v&(1<<M))v^=P;}
      sa.input.max=N;sb.input.max=N;
      sa.input.value=F[3][0];sb.input.value=F[3][1];   /* 本文の例の値から始める */
    }
    function nm(v){return M===8?g5hex(v):g5bin(v,M);}
    function run(){
      var a=+sa.input.value,b=+sb.input.value;
      sa.val.textContent=nm(a);sb.val.textContent=nm(b);
      var la=LOG[a],lb=LOG[b],s=la+lb,k=s%N,r=EXP[k];
      var h='<div style="line-height:1.9">'+
        '<span style="color:var(--blue);font-weight:700">① 対数表</span>　log '+nm(a)+' = <b>'+la+'</b>、log '+nm(b)+' = <b>'+lb+'</b><br>'+
        '<span style="color:var(--signal);font-weight:700">② 指数の和</span>　'+la+' + '+lb+' = '+s+(s>=N?' → '+s+' − '+N+' = <b>'+k+'</b>':'（'+N+' 未満なのでそのまま）')+'<br>'+
        '<span style="color:var(--signal);font-weight:700">③ 逆対数表</span>　α'+g5sup(k)+' = <b>'+nm(r)+'</b></div>';
      var cols=M===8?16:(M===4?8:N), cw=M===8?2.6:(M===4?3.8:4.2);
      h+='<div style="margin:.5rem 0 .2rem;color:var(--muted)">逆対数表（指数 i → αⁱ）。青が log a・log b の位置、緑が答えの位置</div>';
      h+='<div style="display:grid;grid-template-columns:repeat('+cols+','+cw+'em);gap:2px">';
      for(var i=0;i<N;i++){
        var c=i===k?'var(--signal)':((i===la||i===lb)?'var(--blue)':'var(--line)');
        var bg=i===k?'var(--signal-soft)':((i===la||i===lb)?'rgba(47,111,158,.16)':'var(--panel)');
        h+='<div title="i = '+i+'" style="border:1.5px solid '+c+';background:'+bg+';border-radius:4px;text-align:center;line-height:1.25;padding:.1rem 0">'+
          '<div style="font-size:.62rem;color:var(--muted)">'+i+'</div><div style="font-size:'+(M===8?'.7rem':'.78rem')+';'+
          ((i===k||i===la||i===lb)?'font-weight:700;color:var(--ink)':'')+'">'+(M===8?("0"+EXP[i].toString(16).toUpperCase()).slice(-2):g5bin(EXP[i],M))+'</div></div>';
      }
      h+='</div>';
      out.innerHTML=h;
      var chk=g5mul(a,b,P,M);
      ro.innerHTML=nm(a)+' × '+nm(b)+' = <b class="ok">'+nm(r)+'</b> ／ 多項式で掛けて f で割った結果: <b>'+nm(chk)+'</b> '+
        (chk===r?'<span class="ok">一致</span>':'<span class="warn">不一致</span>')+' ／ 0 は対数が無いので、表を引かずに 0 を返す';
    }
    sel.addEventListener("change",function(){build();run();});
    sa.input.addEventListener("input",run);sb.input.addEventListener("input",run);
    build();reg(null,run);run();
  };

  /* ============ 05. ctmul — 素直な実装と定数時間の実装で、実行する操作を比べる ============ */
  REG.ctmul=function(el){
    head(el,"Constant time","素直な実装と定数時間の実装で、実行する操作を比べる（AES、f = 0x11B）");
    var row=ctrls(el);
    var ia=textin(row,"a（16 進 2 桁）","57"), ib=textin(row,"b（16 進 2 桁。秘密の値）","13");
    var tr=panel(el);
    var cv=screen(el,190),cc=cctx(cv);
    var ro=readout(el);
    function trace(a,b,ct){
      var t=[];
      for(var i=0;i<8;i++){
        if(!ct&&(b>>i)===0)break;
        var bit=(b>>i)&1, ov=(a&0x80)!==0;
        t.push([bit,ov]);
        a=((a<<1)&0xFF)^(ov?0x1B:0);
      }
      return t;
    }
    function ops(t,ct){var n=0;t.forEach(function(s){n+=1;if(ct||s[0])n++;if(ct||s[1])n++;});return n;}
    function sq(fill,line,dash,lab){
      return '<span title="'+lab+'" style="display:inline-block;width:.95em;height:.95em;margin-right:2px;border-radius:2px;vertical-align:-2px;'+
        'background:'+fill+';border:1.4px '+(dash?'dashed':'solid')+' '+line+'"></span>';
    }
    function lineHtml(t,ct){
      var h='';
      for(var i=0;i<8;i++){
        h+='<span style="display:inline-block;margin-right:.6em">';
        if(i>=t.length){h+='<span style="color:var(--faint)">— — —</span></span>';continue;}
        var bit=t[i][0], ov=t[i][1];
        h+=(ct||bit)?sq(bit?'var(--signal)':'var(--signal-soft)','var(--signal)',false,bit?'r に a を XOR':'r に 0 を XOR'):sq('transparent','var(--line)',true,'実行しない');
        h+=sq('var(--blue)','var(--blue)',false,'左シフト');
        h+=(ct||ov)?sq(ov?'var(--alias)':'var(--alias-soft)','var(--alias)',false,ov?'0x1B を XOR':'0 を XOR'):sq('transparent','var(--line)',true,'実行しない');
        h+='</span>';
      }
      return h;
    }
    var A=0x57,B=0x13;
    function draw(){
      var c=chart(cc,-1,256,0,26,{l:40,b:30,t:14,r:12});grid(c,2);axis(c);
      var ctx=c.ctx;
      for(var b=0;b<256;b++){
        var n=ops(trace(A,b,false),false);
        ctx.fillStyle=b===B?C("--alias"):C("--faint");
        var x0=c.X(b-0.42),x1=c.X(b+0.42),y=c.Y(n);
        if(b===B){x0-=1;x1+=1;}
        ctx.fillRect(x0,y,Math.max(1,x1-x0),c.Y(0)-y);
      }
      var nB=ops(trace(A,B,false),false),xb=c.X(B),yb=c.Y(nB)-4;
      ctx.fillStyle=C("--alias");ctx.beginPath();ctx.moveTo(xb,yb);ctx.lineTo(xb-5,yb-8);ctx.lineTo(xb+5,yb-8);ctx.closePath();ctx.fill();
      var yc=c.Y(24);ctx.strokeStyle=C("--signal");ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(c.p.l,yc);ctx.lineTo(c.w-c.p.r,yc);ctx.stroke();
      lab(ctx,"定数時間の実装: どの b でも 24",c.p.l+6,yc-6,C("--signal"),"left");
      [0,64,128,192,255].forEach(function(v){lab(ctx,g5hex(v),c.X(v),c.h-10,C("--muted"),"center");});
      [0,12,24].forEach(function(v){lab(ctx,String(v),c.p.l-6,c.Y(v)+4,C("--muted"),"right");});
      lab(ctx,"灰色: 素直な実装の操作数（目安）／赤: 今の b",c.p.l+6,c.Y(24)+18,C("--muted"),"left");
    }
    function run(){
      var a=g5read(ia), b=g5read(ib);
      if(a===null||b===null){tr.innerHTML='<span style="color:var(--alias)">a と b は 00〜FF の 16 進数で入力する</span>';ro.innerHTML="";return;}
      A=a;B=b;
      var tn=trace(a,b,false), tc=trace(a,b,true);
      var cnt=function(t,k){return t.filter(function(s){return s[k];}).length;};
      tr.innerHTML='<div style="color:var(--alias);font-weight:700">素直な実装 gf_mul</div><div style="margin:.2rem 0 .6rem">'+lineHtml(tn,false)+'</div>'+
        '<div style="color:var(--signal);font-weight:700">定数時間の実装 gf_mul_ct</div><div style="margin:.2rem 0 .4rem">'+lineHtml(tc,true)+'</div>'+
        '<div style="color:var(--muted)">1 周 = 3 マス: 緑 = r への XOR、青 = 左シフト、赤 = 0x1B の XOR（薄い色は 0 を XOR、点線は実行しない）</div>';
      draw();
      ro.innerHTML='積 = <b>'+g5hex(g5mul(a,b,0x11B))+'</b>（どちらの実装も同じ） ／ 素直な実装: <b class="warn">'+tn.length+'</b> 周・操作 <b class="warn">'+ops(tn,false)+'</b> 回'+
        '（⊕ '+cnt(tn,0)+' 回、0x1B '+cnt(tn,1)+' 回） ／ 定数時間の実装: <b class="ok">8</b> 周・操作 <b class="ok">24</b> 回（b によらない）';
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(cv,draw);run();
  };

  /* ============ 06. dmin — 符号語を入力して最小距離を求める ============ */
  REG.dmin=function(el){
    head(el,"Distance","符号語どうしの距離表と最小距離");
    var row=ctrls(el);
    var ti=textin(row,"符号語（カンマ区切り、同じ長さ）","00000,01011,10101,11110");
    var out=panel(el), ro=readout(el);
    function ham(a,b){var n=0;for(var i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;}
    function run(){
      var C=ti.value.split(",").map(function(s){return s.trim();}).filter(function(s){return s.length;});
      var bad=C.some(function(s){return !/^[01]+$/.test(s)||s.length!==C[0].length;});
      if(C.length<2||bad){out.innerHTML='<span style="color:var(--alias)">0 と 1 だけからなる、同じ長さの符号語を 2 個以上入力する</span>';ro.innerHTML="";return;}
      var dm=1e9,pair=null;
      var h='<table style="border-collapse:collapse"><tr><th></th>'+C.map(function(c){return '<th style="padding:.2rem .5rem;color:var(--muted)">'+esc(c)+'</th>';}).join("")+'</tr>';
      for(var i=0;i<C.length;i++){
        h+='<tr><th style="padding:.2rem .5rem;color:var(--muted);text-align:right">'+esc(C[i])+'</th>';
        for(var j=0;j<C.length;j++){
          var d=ham(C[i],C[j]);
          if(i<j&&d<dm){dm=d;pair=[i,j];}
          h+='<td style="padding:.2rem .5rem;text-align:center">'+(i===j?'<span style="color:var(--faint)">—</span>':d)+'</td>';
        }
        h+='</tr>';
      }
      out.innerHTML=h+'</table>';
      // 最小の組を強調
      var cells=out.querySelectorAll("tr");
      for(var i2=0;i2<C.length;i2++)for(var j2=0;j2<C.length;j2++){
        if(i2!==j2&&ham(C[i2],C[j2])===dm){var td=cells[i2+1].children[j2+1];td.style.color="var(--alias)";td.style.fontWeight="700";}
      }
      var dup=dm===0;
      ro.innerHTML=dup?'<span class="warn">同じ符号語が 2 つある（距離 0）。符号語はすべて異なる必要がある</span>':
        'd_min = <b>'+dm+'</b>（赤の組） ／ 検出 <b class="ok">'+(dm-1)+'</b> ビットまで ／ 訂正 <b class="ok">'+Math.floor((dm-1)/2)+'</b> ビットまで';
    }
    ti.addEventListener("input",run);run();
  };

  /* ============ 06. detcorr — 訂正と検出の配分 ============ */
  REG.detcorr=function(el){
    head(el,"Trade-off","訂正範囲と検出範囲の配分");
    var row=ctrls(el);
    var sd=slider(row,"最小距離 d_min",1,9,4,1), st=slider(row,"訂正する範囲 t",0,4,1,1);
    var cv=screen(el,200),cc=cctx(cv), ro=readout(el);
    function draw(){
      var d=+sd.input.value, tmax=Math.floor((d-1)/2);
      st.input.max=tmax; if(+st.input.value>tmax)st.input.value=tmax;
      var t=+st.input.value, e=d-1-t;
      sd.val.textContent=d; st.val.textContent=t;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=50,x1=w-50,cy=96,X=function(i){return x0+(x1-x0)*i/d;};
      // 訂正範囲（両方の符号語のまわり）
      [[0,"--blue"],[d,"--alias"]].forEach(function(p){
        if(t>0){var a=X(Math.max(0,p[0]-t)),b=X(Math.min(d,p[0]+t));
          ctx.fillStyle=C(p[1]==="--blue"?"--grid":"--alias-soft");ctx.strokeStyle=C(p[1]);ctx.setLineDash([5,3]);ctx.lineWidth=1.4;
          ctx.beginPath();ctx.roundRect?ctx.roundRect(a-16,cy-26,b-a+32,52,22):ctx.rect(a-16,cy-26,b-a+32,52);ctx.fill();ctx.stroke();ctx.setLineDash([]);}
      });
      ctx.strokeStyle=C("--line");ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      for(var i=0;i<=d;i++){var cw=(i===0||i===d);
        ctx.fillStyle=cw?C(i===0?"--blue":"--alias"):C("--panel");ctx.strokeStyle=cw?C(i===0?"--blue":"--alias"):C("--muted");ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(X(i),cy,cw?8:5,0,TAU);ctx.fill();ctx.stroke();
        lab(ctx,String(i),X(i),cy+40,C("--muted"),"center");}
      lab(ctx,"c₁（送った）",X(0),cy-34,C("--blue"),"center");
      lab(ctx,"c₂（別の符号語）",X(d),cy-34,C("--alias"),"center");
      // 検出で届く範囲
      if(e>0){ctx.strokeStyle=C("--blue");ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(X(0),cy+60);ctx.lineTo(X(e),cy+60);ctx.stroke();
        ctx.beginPath();ctx.moveTo(X(e),cy+60);ctx.lineTo(X(e)-8,cy+55);ctx.lineTo(X(e)-8,cy+65);ctx.closePath();ctx.fillStyle=C("--blue");ctx.fill();
        lab(ctx,"e = "+e+" ビットまでの誤りで届く範囲",X(0),cy+80,C("--blue"),"left");}
      var ok=e+t<=d-1;
      ro.innerHTML='t = <b>'+t+'</b> ビットまで訂正、さらに e = <b>'+e+'</b> ビットまで検出 ／ t + e = '+(t+e)+' ≤ d_min − 1 = '+(d-1)+
        (t===0?' ／ <span class="warn">t = 0 は訂正せず検出だけする運用</span>':'');
    }
    sd.input.addEventListener("input",draw);st.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 06. bounds — 3 つの限界を比べる ============ */
  REG.bounds=function(el){
    head(el,"Bounds","n と k から、最小距離の上限と保証");
    var row=ctrls(el);
    var sn=slider(row,"符号長 n",3,31,7,1), sk=slider(row,"情報ビット数 k",1,30,4,1);
    var out=readout(el);
    function binom(n,r){var v=1;for(var i=1;i<=r;i++)v=v*(n-r+i)/i;return Math.round(v);}
    function V(n,t){var s=0;for(var i=0;i<=t;i++)s+=binom(n,i);return s;}
    function run(){
      var n=+sn.input.value; sk.input.max=n-1; if(+sk.input.value>n-1)sk.input.value=n-1;
      var k=+sk.input.value; sn.val.textContent=n; sk.val.textContent=k;
      var room=Math.pow(2,n-k);
      // ハミング限界: 2^k V(n,t) <= 2^n を満たす最大の t → d <= 2t+2
      var t=0;while(t+1<=n&&V(n,t+1)<=room)t++;
      var single=n-k+1;
      // GV: 2^k V(n,d-1) <= 2^n を満たす最大の d が存在保証
      var g=1;while(g+1<=n&&V(n,g)<=room)g++;
      out.innerHTML=tbl(["","結果","意味"],[
        ["ハミング限界","訂正 t ≤ <b>"+t+"</b>","半径 t の球 2^k 個が 2^n 個に収まる最大の t（V(n,t) = "+V(n,t)+" ≤ 2^(n−k) = "+room+"）"],
        ["シングルトン限界","d_min ≤ <b>"+single+"</b>","n − k + 1"],
        ["ギルバート・ヴァルシャモフ","d_min ≥ <b>"+g+"</b> の符号が存在","V(n, d−1) ≤ 2^(n−k) を満たす最大の d"],
        ["完全符号か",V(n,t)===room?'<b class="ok">等号（完全符号の大きさ）</b>':"いいえ",""+Math.pow(2,k)+" × "+V(n,t)+" = "+Math.pow(2,k)*V(n,t)+" ／ 2^n = "+Math.pow(2,n)]
      ],["left","left","left"]);
    }
    sn.input.addEventListener("input",run);sk.input.addEventListener("input",run);run();
  };

  /* ============ 06. capacity — 2 元対称通信路の容量 ============ */
  REG.capacity=function(el){
    head(el,"Capacity","Cap = 1 − H(p) と符号化率");
    var row=ctrls(el);
    var sp=slider(row,"反転確率 p",0,0.5,0.1,0.005);
    var cv=screen(el,240),cc=cctx(cv), ro=readout(el);
    function H(p){return (p<=0||p>=1)?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);}
    var codes=[["3 回繰り返し",1/3],["(7,4) ハミング",4/7],["(255,223) RS",223/255]];
    function draw(){
      var p=+sp.input.value; sp.val.textContent=p.toFixed(3);
      var c=chart(cc,0,0.5,0,1,{l:44,b:30});grid(c,4);axis(c);
      var pts=[];for(var x=0;x<=0.5001;x+=0.005)pts.push([x,1-H(x)]);
      pline(c,pts,C("--signal"),2.4);
      for(var i=0;i<=5;i++)lab(c.ctx,(i/10).toFixed(1),c.X(i/10),c.h-10,C("--muted"),"center");
      for(var j=0;j<=4;j++)lab(c.ctx,(j/4).toFixed(2),c.p.l-6,c.Y(j/4)+4,C("--muted"),"right");
      lab(c.ctx,"Cap",c.p.l+6,c.p.t+10,C("--signal"),"left");
      codes.forEach(function(cd,k){var y=c.Y(cd[1]);c.ctx.strokeStyle=C("--faint");c.ctx.setLineDash([4,4]);c.ctx.beginPath();c.ctx.moveTo(c.p.l,y);c.ctx.lineTo(c.w-c.p.r,y);c.ctx.stroke();c.ctx.setLineDash([]);
        lab(c.ctx,cd[0]+" R="+cd[1].toFixed(3),c.w-c.p.r-4,y-4,C("--muted"),"right");});
      var cap=1-H(p);dot(c,p,cap,5,C("--alias"));
      ro.innerHTML='H(p) = <b>'+H(p).toFixed(3)+'</b> ／ Cap = 1 − H(p) = <b>'+cap.toFixed(3)+'</b> ／ '+
        codes.map(function(cd){return cd[0]+': '+(cd[1]<cap?'<b class="ok">R &lt; Cap</b>':'<span class="warn">R &gt; Cap</span>');}).join(" ／ ");
    }
    sp.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 06. interleave — バーストを分散させる ============ */
  REG.interleave=function(el){
    head(el,"Interleave","バースト誤りが各符号語に何ビットずつ届くか");
    var row=ctrls(el);
    var sd=slider(row,"深さ（並べる符号語の数）",1,8,3,1), sb=slider(row,"バーストの長さ",1,16,3,1), ss=slider(row,"バーストの開始位置",0,40,6,1);
    var cv=screen(el,150),cc=cctx(cv), ro=readout(el);
    var L=6;
    function draw(){
      var D=+sd.input.value,B=+sb.input.value,N=D*L; ss.input.max=Math.max(0,N-B); if(+ss.input.value>N-B)ss.input.value=N-B;
      var S=+ss.input.value; sd.val.textContent=D; sb.val.textContent=B; ss.val.textContent=S;
      var s=cc.fit(),w=s.w,ctx=cc.ctx;ctx.clearRect(0,0,w,s.h);
      var cw=Math.min(22,(w-20)/N), x0=10, hits=[];for(var r=0;r<D;r++)hits.push(0);
      lab(ctx,"送る順",x0,16,C("--muted"),"left");
      for(var j=0;j<N;j++){var r2=j%D,i=Math.floor(j/D),hit=j>=S&&j<S+B; if(hit)hits[r2]++;
        ctx.fillStyle=hit?C("--alias-soft"):C("--screen");ctx.strokeStyle=hit?C("--alias"):C("--line");ctx.lineWidth=hit?2:1;
        ctx.fillRect(x0+j*cw,24,cw-2,22);ctx.strokeRect(x0+j*cw,24,cw-2,22);
        if(cw>=16)lab(ctx,String.fromCharCode(65+r2)+(i+1),x0+j*cw+cw/2-1,39,C("--ink"),"center");}
      lab(ctx,"並べ直した後（行 = 符号語）",x0,72,C("--muted"),"left");
      var rh=Math.min(14,70/D);
      for(var r3=0;r3<D;r3++)for(var i3=0;i3<L;i3++){var j3=i3*D+r3,hit3=j3>=S&&j3<S+B;
        ctx.fillStyle=hit3?C("--alias"):C("--screen");ctx.strokeStyle=C("--line");ctx.fillRect(x0+i3*18,80+r3*rh,16,rh-2);ctx.strokeRect(x0+i3*18,80+r3*rh,16,rh-2);
        lab(ctx,String.fromCharCode(65+r3)+": "+hits[r3]+" ビット",x0+L*18+10,80+r3*rh+rh-3,hits[r3]>1?C("--alias"):C("--muted"),"left");}
      var mx=Math.max.apply(null,hits);
      ro.innerHTML='1 つの符号語に届く誤りは最大 <b>'+mx+'</b> ビット（= ⌈バースト長 ÷ 深さ⌉ 以下） ／ '+
        (mx<=1?'<b class="ok">1 ビット訂正の符号ですべて直せる</b>':'<span class="warn">1 ビット訂正の符号では直せない符号語がある。深さを増やす</span>');
    }
    [sd,sb,ss].forEach(function(o){o.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ============ 07 章 共通: ビット列の表示と GF(2) の計算 ============ */
  var W7={
    xr:function(a,b){var s="";for(var i=0;i<a.length;i++)s+=(a[i]===b[i]?"0":"1");return s;},
    wt:function(a){var n=0;for(var i=0;i<a.length;i++)if(a[i]==="1")n++;return n;},
    dot:function(a,b){var v=0;for(var i=0;i<a.length;i++)if(a[i]==="1"&&b[i]==="1")v^=1;return v;},
    zeros:function(n){return new Array(n+1).join("0");},
    // 生成行列 G の行のうち、m の 1 が立つ行を XOR
    mul:function(m,G){var c=W7.zeros(G[0].length);for(var i=0;i<G.length;i++)if(m[i]==="1")c=W7.xr(c,G[i]);return c;},
    syn:function(r,H){return H.map(function(h){return String(W7.dot(r,h));}).join("");},
    col:function(H,j){return H.map(function(h){return h[j];}).join("");},
    bin:function(v,n){var s=v.toString(2);while(s.length<n)s="0"+s;return s;},
    // [I_k | P] と [P^T | I_r]
    GH:function(P){var k=P.length,r=P[0].length,G=[],H=[],i,j,s;
      for(i=0;i<k;i++){s="";for(j=0;j<k;j++)s+=(i===j?"1":"0");G.push(s+P[i]);}
      for(i=0;i<r;i++){s="";for(j=0;j<k;j++)s+=P[j][i];for(j=0;j<r;j++)s+=(i===j?"1":"0");H.push(s);}
      return {G:G,H:H,k:k,r:r,n:k+r};},
    ST:{n:"background:var(--panel);border-color:var(--line);color:var(--ink)",
        i:"background:var(--signal-soft);border-color:var(--signal);color:var(--ink)",
        p:"background:rgba(47,111,158,.14);border-color:var(--blue);color:var(--ink)",
        e:"background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700",
        h:"background:var(--signal-soft);border-color:var(--signal);color:var(--signal);font-weight:700",
        b:"background:rgba(47,111,158,.14);border-color:var(--blue);color:var(--blue);font-weight:700",
        f:"background:transparent;border-color:var(--line);color:var(--faint)"},
    // ビット列を 1 文字 1 マスの HTML に。sty は位置ごとの記号（W7.ST のキー）を返す関数か文字列
    bits:function(s,sty){var h="";for(var i=0;i<s.length;i++){var k=typeof sty==="function"?sty(i,s[i]):(sty&&sty[i]&&sty[i]!==" "?sty[i]:"n");
      h+='<span style="display:inline-block;min-width:1.45em;text-align:center;margin:0 .07rem;border:1px solid;border-radius:4px;line-height:1.5;'+W7.ST[k||"n"]+'">'+s[i]+'</span>';}
      return '<span style="white-space:nowrap">'+h+'</span>';},
    tog:function(row,label,on,cb){var b=button(row,label);b.style.padding=".3rem .5rem";b.style.minWidth="2.6rem";
      b.setAttribute("aria-pressed",on?"true":"false");b.addEventListener("click",function(){var v=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",v?"true":"false");cb(v);});return b;},
    lbl:function(row,t){var d=mk("div","",t);d.style.cssText="font-family:var(--mono);font-size:.72rem;color:var(--muted);width:100%;margin-bottom:-.4rem";row.appendChild(d);return d;},
    th:'style="padding:.15rem .55rem;color:var(--muted);font-weight:600;text-align:left;min-width:5.5em"',
    td:'style="padding:.15rem .55rem;white-space:nowrap"'
  };

  /* ============ 07. linclosure — XOR で閉じているか。最小距離と最小の重み ============ */
  REG.linclosure=function(el){
    head(el,"Linear?","XOR で閉じているか、最小距離と最小の重み");
    var row=ctrls(el);
    var presets=[["(5,2,3) 符号（本文の例）","00000,01011,10101,11110"],["最後の 1 語を 11111 に変えた符号","00000,01011,10101,11111"],
      ["3 回繰り返し符号","000,111"],["(3,2) 単一パリティ検査符号","000,011,101,110"],["0 を含まない符号","001,010,100,111"]];
    var sel=select(row,"例を選ぶ",presets.map(function(p){return p[0];}));
    var ti=textin(row,"符号語（カンマ区切り、同じ長さ）",presets[0][1]);
    var out=panel(el), ro=readout(el);
    function run(){
      var Cw=ti.value.split(",").map(function(s){return s.trim();}).filter(function(s){return s.length;});
      var bad=Cw.some(function(s){return !/^[01]+$/.test(s)||s.length!==Cw[0].length;});
      if(Cw.length<2||bad||Cw.length>16){out.innerHTML='<span style="color:var(--alias)">0 と 1 だけからなる同じ長さの語を、2 〜 16 個入力する</span>';ro.innerHTML="";return;}
      var set={},dup=false;Cw.forEach(function(c){if(set[c])dup=true;set[c]=1;});
      if(dup){out.innerHTML='<span style="color:var(--alias)">同じ語が 2 回入っている。符号語はすべて異なる必要がある</span>';ro.innerHTML="";return;}
      var nbad=0,h='<table style="border-collapse:collapse;width:auto"><tr><th '+W7.th+'>⊕</th>'+Cw.map(function(c){return '<th '+W7.th+'>'+esc(c)+'</th>';}).join("")+'</tr>';
      Cw.forEach(function(a){
        h+='<tr><th '+W7.th+'>'+esc(a)+'</th>';
        Cw.forEach(function(b){var v=W7.xr(a,b),ok=!!set[v];if(!ok)nbad++;
          h+='<td '+W7.td+'><span style="padding:.05rem .3rem;border-radius:4px;border:1px solid;'+(ok?W7.ST.p:W7.ST.e)+'">'+v+'</span></td>';});
        h+='</tr>';});
      out.innerHTML=h+'</table>';
      var dm=1e9,mw=1e9;
      for(var i=0;i<Cw.length;i++){var w=W7.wt(Cw[i]);if(w>0&&w<mw)mw=w;for(var j=i+1;j<Cw.length;j++)dm=Math.min(dm,W7.wt(W7.xr(Cw[i],Cw[j])));}
      ro.innerHTML=(nbad===0?'<b class="ok">XOR で閉じている → 線形符号</b>':'<span class="warn">XOR で閉じていない（赤の '+nbad+' 欄が符号語でない）→ 線形符号でない</span>')+
        (set[W7.zeros(Cw[0].length)]?'':' ／ <span class="warn">0 を含まない</span>')+
        '<br>最小距離 d_min = <b>'+dm+'</b> ／ 0 でない語の最小の重み = <b>'+mw+'</b> → '+
        (dm===mw?'<b class="ok">一致</b>':'<span class="warn">一致しない</span>');
    }
    sel.addEventListener("change",function(){ti.value=presets[+sel.value][1];run();});
    ti.addEventListener("input",run);run();
  };

  /* ============ 07. genenc — 生成行列による符号化（m の 1 が立つ行を XOR） ============ */
  REG.genenc=function(el){
    head(el,"Generator","情報語の 1 が立つ行を選んで XOR する");
    var row=ctrls(el);
    var tg=textin(row,"G の各行（カンマ区切り）","1000110,0100101,0010011,0001111");
    var brow=ctrls(el);
    var out=panel(el), ro=readout(el);
    var m=[1,0,1,1],btns=[];
    function parse(){var R=tg.value.split(",").map(function(s){return s.trim();}).filter(function(s){return s.length;});
      if(R.length<1||R.length>8||R.some(function(s){return !/^[01]+$/.test(s)||s.length!==R[0].length;})||R[0].length>16)return null;return R;}
    function build(k){brow.innerHTML="";W7.lbl(brow,"情報語 m（押すと 0 と 1 が切り替わる）");btns=[];
      while(m.length<k)m.push(0);m.length=k;
      for(var i=0;i<k;i++)(function(i){btns.push(W7.tog(brow,"m"+(i+1)+" = "+m[i],m[i]===1,function(v){m[i]=v?1:0;run();}));})(i);}
    function run(){
      var G=parse();
      if(!G){out.innerHTML='<span style="color:var(--alias)">0 と 1 だけからなる同じ長さの行を、1 〜 8 本入力する（各行 16 ビットまで）</span>';ro.innerHTML="";return;}
      var k=G.length,n=G[0].length;if(btns.length!==k)build(k);
      btns.forEach(function(b,i){b.textContent="m"+(i+1)+" = "+m[i];});
      var ms=m.join(""),sys=true;
      for(var i=0;i<k;i++)for(var j=0;j<k&&j<n;j++)if(G[i][j]!==(i===j?"1":"0"))sys=false;
      if(n<k)sys=false;
      var sty=function(i){return sys?(i<k?"i":"p"):"b";};
      var h='<div style="color:var(--muted);margin-bottom:.2rem">G の行（m<sub>i</sub> = 1 の行を選ぶ）</div><table style="border-collapse:collapse;width:auto">';
      G.forEach(function(g,i){var on=m[i]===1;
        h+='<tr><td '+W7.td+'><span style="color:'+(on?'var(--signal)':'var(--faint)')+';font-weight:'+(on?700:400)+'">m'+(i+1)+' = '+m[i]+'</span></td><td '+W7.td+'>'+W7.bits(g,on?null:function(){return "f";})+'</td></tr>';});
      h+='</table><div style="color:var(--muted);margin:.6rem 0 .2rem">選んだ行の XOR</div><table style="border-collapse:collapse;width:auto">';
      var c=W7.zeros(n),first=true;
      G.forEach(function(g,i){if(m[i]!==1)return;c=W7.xr(c,g);
        h+='<tr><td '+W7.td+' align="right">'+(first?'':'⊕')+'</td><td '+W7.td+'>'+W7.bits(g)+'</td><td '+W7.td+'><span style="color:var(--muted)">第 '+(i+1)+' 行</span></td></tr>';first=false;});
      if(first)h+='<tr><td '+W7.td+'></td><td '+W7.td+'><span style="color:var(--muted)">（選んだ行が無い → 0）</span></td></tr>';
      h+='<tr><td '+W7.td+' align="right">=</td><td '+W7.td+' style="border-top:1.5px solid var(--ink);padding-top:.3rem">'+W7.bits(c,sty)+'</td><td '+W7.td+'><b>c = mG</b></td></tr></table>';
      out.innerHTML=h;
      // 行が基底になっているか（2^k 通りの m が異なる符号語になるか）
      var seen={},cnt=0;for(var v=0;v<(1<<k);v++){var cc=W7.mul(W7.bin(v,k),G);if(!seen[cc]){seen[cc]=1;cnt++;}}
      ro.innerHTML='c = mG = <b>'+c+'</b> ／ 重み '+W7.wt(c)+' ／ '+
        (sys?'<b class="ok">左 '+k+' 列が単位行列 → 前半 '+k+' ビット = 情報語 '+ms+'</b>':'<span class="warn">左 '+k+' 列が単位行列でない → 前半に情報語が現れるとは限らない</span>')+
        '<br>'+(cnt===(1<<k)?'2<sup>'+k+'</sup> = '+(1<<k)+' 通りの情報語が、すべて異なる符号語になる（行が基底）':
          '<span class="warn">異なる符号語は '+cnt+' 個しかない（2<sup>'+k+'</sup> = '+(1<<k)+' 個に足りない）→ 行が基底になっていない</span>');
    }
    tg.addEventListener("input",run);run();
  };

  /* ============ 07. syndec — シンドロームを列の XOR で求め、表を引いて訂正する ============ */
  REG.syndec=function(el){
    head(el,"Syndrome","シンドロームを H の列の XOR で求め、表を引いて訂正する");
    var row=ctrls(el);
    var codes=[{name:"(5,2,3) 符号（本文の例）",P:["101","011"],m:[0,1],e:[4]},
               {name:"(7,4) 符号（2・3 節の例）",P:["110","101","011","111"],m:[1,0,1,1],e:[5]}];
    var sel=select(row,"符号",codes.map(function(c){return c.name;}));
    var mrow=ctrls(el),erow=ctrls(el);
    var out=panel(el), ro=readout(el);
    var S,m,e,table;
    function setup(){
      var cd=codes[+sel.value];S=W7.GH(cd.P);m=cd.m.slice();e=[];for(var j=0;j<S.n;j++)e.push(cd.e.indexOf(j+1)>=0?1:0);
      // シンドローム表: 重みの小さい順（同じ重みなら文字列の小さい順）に最初に出た誤りパターン
      var all=[];for(var v=0;v<(1<<S.n);v++)all.push(W7.bin(v,S.n));
      all.sort(function(a,b){return W7.wt(a)-W7.wt(b)||(a<b?-1:a>b?1:0);});
      table={};all.forEach(function(x){var s=W7.syn(x,S.H);if(!(s in table))table[s]=x;});
      mrow.innerHTML="";W7.lbl(mrow,"送る情報語 m");
      for(var i=0;i<S.k;i++)(function(i){W7.tog(mrow,"m"+(i+1),m[i]===1,function(v){m[i]=v?1:0;run();});})(i);
      erow.innerHTML="";W7.lbl(erow,"誤りパターン e（押した位置のビットが反転する。複数可）");
      for(var j2=0;j2<S.n;j2++)(function(j){W7.tog(erow,"位置 "+(j+1),e[j]===1,function(v){e[j]=v?1:0;run();});})(j2);
      run();
    }
    function run(){
      var k=S.k,n=S.n,H=S.H,ms=m.join(""),es=e.join("");
      var c=W7.mul(ms,S.G),r=W7.xr(c,es),s=W7.syn(r,H),eh=table[s],ch=W7.xr(r,eh);
      var cs=function(i){return i<k?"i":"p";};
      var h='<div style="display:flex;flex-wrap:wrap;gap:.4rem 2rem"><div><div style="color:var(--muted)">H = [ Pᵀ | I ]（赤 = e の 1 が立つ位置の列）</div><table style="border-collapse:collapse;width:auto;margin-top:.2rem">';
      for(var i=0;i<H.length;i++){h+='<tr>';for(var j=0;j<n;j++){var on=e[j]===1;
        h+='<td style="padding:.05rem .32rem;text-align:center;'+(on?'background:var(--alias-soft);color:var(--alias);font-weight:700':'')+'">'+H[i][j]+'</td>';}h+='</tr>';}
      h+='<tr>';for(var j3=0;j3<n;j3++)h+='<td style="padding:.05rem .32rem;text-align:center;color:var(--faint);font-size:.7rem">'+(j3+1)+'</td>';
      h+='</tr></table></div><div><table style="border-collapse:collapse;width:auto">';
      var rows=[["送った符号語 c = mG",W7.bits(c,cs)],["誤りパターン e",W7.bits(es,function(i,b){return b==="1"?"e":"f";})],
        ["受信語 r = c ⊕ e",W7.bits(r,function(i){return e[i]?"e":"n";})]];
      var picked=[];for(var j4=0;j4<n;j4++)if(e[j4])picked.push(j4+1);
      rows.push(["シンドローム s = rHᵀ",W7.bits(s,function(i,b){return b==="1"?"e":"n";})+' <span style="color:var(--muted)">'+
        (picked.length?'= 第 '+picked.join(", ")+' 列の XOR':'= 0')+'</span>']);
      rows.push(["表から ê",W7.bits(eh,function(i,b){return b==="1"?"b":"f";})]);
      rows.push(["訂正 ĉ = r ⊕ ê",W7.bits(ch,function(i){return ch[i]!==c[i]?"e":cs(i);})]);
      rows.forEach(function(x){h+='<tr><td '+W7.th+'>'+x[0]+'</td><td '+W7.td+'>'+x[1]+'</td></tr>';});
      h+='</table></div></div><div style="color:var(--muted);margin:.6rem 0 .2rem">シンドローム表（s → 重み最小の ê）</div><div style="display:flex;flex-wrap:wrap;gap:.2rem 1.2rem">';
      Object.keys(table).sort().forEach(function(sx){var on=sx===s;
        h+='<span style="padding:.05rem .35rem;border-radius:5px;'+(on?'background:var(--signal-soft);outline:1.5px solid var(--signal)':'')+'">'+sx+' → '+table[sx]+'</span>';});
      out.innerHTML=h+'</div>';
      var we=W7.wt(es),dd=W7.wt(W7.xr(ch,c));
      ro.innerHTML=(we===0?'<b class="ok">誤りなし → s = 0、そのまま受け取る</b>':
        (ch===c?'<b class="ok">ê = e なので訂正できた</b>（誤り '+we+' 個）':
          (s===W7.zeros(H.length)?'<span class="warn">s = 0 → 誤りに気づかない（e が 0 でない符号語になっている）</span>':
            '<span class="warn">表の ê（重み '+W7.wt(eh)+'）が実際の e（重み '+we+'）と違う → ĉ は送った c と '+dd+' か所違う別の符号語（誤訂正）</span>')))+
        ' ／ 情報語の推定 = ĉ の前半 '+k+' ビット = <b>'+ch.slice(0,k)+'</b>';
    }
    sel.addEventListener("change",setup);setup();
  };

  /* ============ 07. lincode — H の列から最小距離と 1 ビット誤りの位置を読む ============ */
  REG.lincode=function(el){
    head(el,"Check matrix","H の列から最小距離と 1 ビット誤りの位置を読む");
    var row=ctrls(el);
    var ip=textin(row,"P の各行（カンマ区切り。行の数 = k、各行のビット数 = n − k）","011,101,110");
    var se=slider(row,"1 ビット誤りの位置（0 = なし）",0,6,2,1);
    var out=panel(el), ro=readout(el);
    function run(){
      var P=ip.value.split(",").map(function(s){return s.trim();}).filter(function(s){return s.length;});
      if(P.length<1||P.length>6||P.some(function(s){return !/^[01]+$/.test(s)||s.length!==P[0].length;})||P[0].length>5){
        out.innerHTML='<span style="color:var(--alias)">0 と 1 だけからなる同じ長さの行を 1 〜 6 本（各行 1 〜 5 ビット）入力する</span>';ro.innerHTML="";return;}
      var S=W7.GH(P),k=S.k,n=S.n,H=S.H,G=S.G;
      se.input.max=n;if(+se.input.value>n)se.input.value=n;var pos=+se.input.value;se.val.textContent=pos===0?"なし":pos;
      var cols=[],zero=[],dup=[],j,i;
      for(j=0;j<n;j++)cols.push(W7.col(H,j));
      for(j=0;j<n;j++){if(cols[j].indexOf("1")<0)zero.push(j+1);for(i=j+1;i<n;i++)if(cols[i]===cols[j])dup.push([j+1,i+1]);}
      var badcol={};zero.forEach(function(x){badcol[x]=1;});dup.forEach(function(p){badcol[p[0]]=1;badcol[p[1]]=1;});
      var words=[],dm=1e9;for(var v=0;v<(1<<k);v++){var c=W7.mul(W7.bin(v,k),G),w=W7.wt(c);words.push([c,w]);if(v>0&&w<dm)dm=w;}
      var s=pos?cols[pos-1]:W7.zeros(H.length),match=[];if(pos)for(j=0;j<n;j++)if(cols[j]===s)match.push(j+1);
      var mat=function(M,title,colsty){var t='<div><div style="color:var(--muted)">'+title+'</div><table style="border-collapse:collapse;width:auto;margin-top:.2rem">';
        M.forEach(function(rw){t+='<tr>';for(var q=0;q<rw.length;q++){var st=colsty?colsty(q):"";t+='<td style="padding:.05rem .32rem;text-align:center;'+st+'">'+rw[q]+'</td>';}t+='</tr>';});
        if(colsty){t+='<tr>';for(var q2=0;q2<n;q2++)t+='<td style="padding:.05rem .32rem;text-align:center;color:var(--faint);font-size:.7rem">'+(q2+1)+'</td>';t+='</tr>';}
        return t+'</table></div>';};
      var h='<div style="display:flex;flex-wrap:wrap;gap:.4rem 2.2rem">'+mat(G,"G = [ I | P ]（"+k+"×"+n+"）")+
        mat(H,"H = [ Pᵀ | I ]（"+H.length+"×"+n+"、赤 = 0 の列・同じ列）",function(q){
          if(pos&&q===pos-1)return "outline:1.5px solid var(--signal);color:var(--signal);font-weight:700";
          return badcol[q+1]?"background:var(--alias-soft);color:var(--alias);font-weight:700":"";})+'</div>';
      h+='<div style="color:var(--muted);margin:.6rem 0 .2rem">全 '+(1<<k)+' 個の符号語と重み（緑 = 最小の重み）</div><div style="display:flex;flex-wrap:wrap;gap:.15rem 1.1rem">';
      words.forEach(function(x,q){var on=q>0&&x[1]===dm;h+='<span style="'+(on?'color:var(--signal);font-weight:700':'')+'">'+x[0]+' <span style="color:var(--muted)">('+x[1]+')</span></span>';});
      out.innerHTML=h+'</div>';
      var hs=zero.length?'<span class="warn">第 '+zero.join(", ")+' 列が 0 → d_min = 1</span>':
        (dup.length?'<span class="warn">第 '+dup[0][0]+' 列と第 '+dup[0][1]+' 列が同じ → d_min ≤ 2</span>':'<b class="ok">0 の列も同じ列も無い → d_min ≥ 3</b>');
      var es='';
      if(pos){es=' ／ 位置 '+pos+' の誤り: s = 第 '+pos+' 列 = <b>'+s+'</b> → '+
        (s.indexOf("1")<0?'<span class="warn">s = 0 なので誤りに気づかない</span>':
          (match.length===1?'<b class="ok">s と同じ列は第 '+pos+' 列だけ → 位置を特定できる</b>':
            '<span class="warn">s と同じ列が第 '+match.join(", ")+' 列にある → どれが誤ったか区別できない</span>'));}
      ro.innerHTML='d_min = <b>'+dm+'</b>（0 でない符号語の最小の重み）→ 検出 '+(dm-1)+' ビット・訂正 '+Math.floor((dm-1)/2)+' ビット ／ '+hs+es;
    }
    ip.addEventListener("input",run);se.input.addEventListener("input",run);run();
  };

  /* ============ 08 章 共通: (7,4) ハミング符号（第 i 列 = i の 2 進表現） ============ */
  var W8={
    // 位置 1..7 の配列 c（c[0] は使わない）
    enc:function(d){var c=[0,0,0,d[0],0,d[1],d[2],d[3]];c[1]=c[3]^c[5]^c[7];c[2]=c[3]^c[6]^c[7];c[4]=c[5]^c[6]^c[7];return c;},
    syn:function(r){var s1=r[1]^r[3]^r[5]^r[7],s2=r[2]^r[3]^r[6]^r[7],s4=r[4]^r[5]^r[6]^r[7];return {s1:s1,s2:s2,s4:s4,v:s4*4+s2*2+s1};},
    str:function(c,a,b){return c.slice(a||1,b||8).join("");},
    cell:function(b,k){var st={n:"background:var(--panel);border-color:var(--line);color:var(--ink)",
        i:"background:var(--signal-soft);border-color:var(--signal);color:var(--ink)",
        p:"background:rgba(47,111,158,.14);border-color:var(--blue);color:var(--ink)",
        e:"background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700",
        b:"background:rgba(47,111,158,.14);border-color:var(--blue);color:var(--blue);font-weight:700",
        f:"background:transparent;border-color:var(--line);color:var(--faint)"}[k||"n"];
      return '<span style="display:inline-block;min-width:1.45em;text-align:center;margin:0 .07rem;border:1px solid;border-radius:4px;line-height:1.5;'+st+'">'+b+'</span>';},
    row:function(c,sty,from,to){var h="";for(var i=from||1;i<(to||8);i++)h+=W8.cell(c[i],sty?sty(i):"n");return '<span style="white-space:nowrap">'+h+'</span>';},
    ck:function(i){return (i===1||i===2||i===4)?"p":"i";},
    tog:function(row,label,on,cb){var b=button(row,label);b.style.padding=".3rem .5rem";b.style.minWidth="2.6rem";
      b.setAttribute("aria-pressed",on?"true":"false");b.addEventListener("click",function(){var v=b.getAttribute("aria-pressed")!=="true";b.setAttribute("aria-pressed",v?"true":"false");cb(v);});return b;},
    lbl:function(row,t){var d=mk("div","",t);d.style.cssText="font-family:var(--mono);font-size:.72rem;color:var(--muted);width:100%;margin-bottom:-.4rem";row.appendChild(d);return d;},
    th:'style="padding:.15rem .55rem;color:var(--muted);font-weight:600;text-align:left;min-width:5.5em"',
    td:'style="padding:.15rem .55rem;white-space:nowrap"',
    sci:function(x){if(x===0)return "0";var e=Math.floor(Math.log10(x)),m=x/Math.pow(10,e);
      if(e>=-2)return x.toPrecision(3);return m.toFixed(2)+"×10<sup>"+e+"</sup>";}
  };

  /* ============ 08. hamparams — 検査ビット数 m と符号の長さ・符号化率 ============ */
  REG.hamparams=function(el){
    head(el,"Parameters","検査ビット数 m と、符号の長さ・符号化率・2 個以上の誤りが入る確率");
    var row=ctrls(el);
    var sm=slider(row,"検査ビット数 m",2,10,3,1), sp=slider(row,"ビットの反転確率 p",-6,-2,-4,0.5);
    var cv=screen(el,165),cc=cctx(cv), ro=readout(el);
    function binom(n,r){var v=1;for(var i=1;i<=r;i++)v=v*(n-r+i)/i;return v;}
    function draw(){
      var m=+sm.input.value,p=Math.pow(10,+sp.input.value),n=Math.pow(2,m)-1,k=n-m;
      sm.val.textContent=m;sp.val.innerHTML=W8.sci(p);
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=62,y0=30,avW=w-x0-14,avH=h-y0-26,cw=Math.min(24,avW/n),rh=Math.min(24,avH/m);
      lab(ctx,"H（"+m+" 行 × "+n+" 列。第 i 列 = i の 2 進表現。濃いマス = 1）",x0,16,C("--muted"),"left");
      for(var r=0;r<m;r++){
        lab(ctx,(Math.pow(2,m-1-r))+" の位",x0-6,y0+r*rh+rh/2+4,C("--muted"),"right");
        for(var j=1;j<=n;j++){var bit=(j>>(m-1-r))&1;
          ctx.fillStyle=bit?C("--signal"):C("--panel");
          var gap=cw>=6?1.5:0;ctx.fillRect(x0+(j-1)*cw+gap/2,y0+r*rh+1,Math.max(cw-gap,0.6),rh-2);
          if(cw>=16){ctx.fillStyle=bit?C("--panel"):C("--muted");ctx.font="11px "+C("--mono");ctx.textAlign="center";ctx.fillText(String(bit),x0+(j-0.5)*cw,y0+r*rh+rh/2+4);}}}
      if(cw>=16)for(var j2=1;j2<=n;j2++)lab(ctx,String(j2),x0+(j2-0.5)*cw,y0+m*rh+14,C("--faint"),"center");
      else lab(ctx,"列が多いので、1 本ずつの番号は省略",x0,y0+m*rh+16,C("--faint"),"left");
      var P2=1-Math.pow(1-p,n)-n*p*Math.pow(1-p,n-1),ap=binom(n,2)*p*p;
      ro.innerHTML='(n, k) = (<b>'+n+'</b>, <b>'+k+'</b>) ／ 符号化率 k/n = <b>'+(k/n).toFixed(3)+'</b> ／ 1 語に 2 個以上の誤りが入る確率 = <b>'+W8.sci(P2)+
        '</b>（≈ C(n,2)p² = '+W8.sci(ap)+'）'+(P2>1e-3?' ／ <span class="warn">1 ビット訂正では足りない語が多い</span>':'');
    }
    sm.input.addEventListener("input",draw);sp.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 08. hamvenn — ベン図の円の偶奇から誤りの位置を読む ============ */
  REG.hamvenn=function(el){
    head(el,"Venn","円の偶奇から誤りの位置を読む（領域を押すとそのビットが反転する）");
    var mrow=ctrls(el);
    var d=[1,0,1,0],err={5:1};
    W8.lbl(mrow,"情報ビット (c₃, c₅, c₆, c₇)");
    var tb=[];["c₃","c₅","c₆","c₇"].forEach(function(nm,i){tb.push(W8.tog(mrow,nm+" = "+d[i],d[i]===1,function(v){d[i]=v?1:0;draw();}));});
    var clr=button(mrow,"誤りを消す");clr.style.padding=".3rem .6rem";
    clr.addEventListener("click",function(){err={};draw();});
    var cv=screen(el,300),cc=cctx(cv), ro=readout(el);
    var geo=null;
    function draw(){
      tb.forEach(function(b,i){b.textContent=["c₃","c₅","c₆","c₇"][i]+" = "+d[i];});
      var c=W8.enc(d),r=c.slice();for(var i=1;i<=7;i++)if(err[i])r[i]^=1;
      var S=W8.syn(r),fix=r.slice();if(S.v)fix[S.v]^=1;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var R=Math.min(h*0.28,w*0.2),dd=0.58*R,cx=Math.min(w/2,R*1.75+24),cy=h*0.5;
      var cen={1:[cx-0.866*dd,cy-0.5*dd],2:[cx+0.866*dd,cy-0.5*dd],4:[cx,cy+dd]};
      geo={cen:cen,R:R};
      var par={1:S.s1,2:S.s2,4:S.s4},names={1:"1 の位",2:"2 の位",4:"4 の位"};
      [1,2,4].forEach(function(k){var p=cen[k];ctx.beginPath();ctx.arc(p[0],p[1],R,0,TAU);
        if(par[k]){ctx.fillStyle=C("--alias-soft");ctx.fill();ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;}
        else{ctx.strokeStyle=C("--signal");ctx.lineWidth=1.8;}ctx.stroke();});
      [1,2,4].forEach(function(k){var p=cen[k],col=par[k]?C("--alias"):C("--signal");
        var t=names[k]+(par[k]?"：奇数 ✗":"：偶数 ✓");
        if(k===1)lab(ctx,t,Math.max(4,p[0]-R),p[1]-R-8,col,"left");
        else if(k===2)lab(ctx,t,p[0]+R,p[1]-R-8,col,"right");
        else lab(ctx,t,p[0]+R*0.82,p[1]+R*0.86,col,"left");});
      var ang={1:150,2:30,4:270,3:90,5:210,6:330};
      for(var q=1;q<=7;q++){var x,y;
        if(q===7){x=cx;y=cy;}else{var t2=(q===1||q===2||q===4)?1.06*R:0.74*R,a=ang[q]*Math.PI/180;x=cx+t2*Math.cos(a);y=cy-t2*Math.sin(a);}
        var isE=!!err[q],isP=(q===1||q===2||q===4);
        ctx.fillStyle=isE?C("--alias-soft"):(isP?"rgba(47,111,158,.18)":C("--signal-soft"));
        ctx.strokeStyle=isE?C("--alias"):(isP?C("--blue"):C("--signal"));ctx.lineWidth=isE?2.4:1.4;
        rrect(ctx,x-14,y-14,28,28,6);ctx.fill();ctx.stroke();
        ctx.fillStyle=isE?C("--alias"):C("--ink");ctx.font="bold 15px "+C("--mono");ctx.textAlign="center";ctx.fillText(String(r[q]),x,y+5);
        lab(ctx,String(q),x+17,y-8,C("--muted"),"left");
        if(S.v===q){ctx.strokeStyle=C("--blue");ctx.lineWidth=2;ctx.setLineDash([4,3]);rrect(ctx,x-19,y-19,38,38,8);ctx.stroke();ctx.setLineDash([]);}}
      var tx=cx+R*2.1;
      if(tx+150<w){var L=[["送った c",W8.str(c)],["受信語 r",W8.str(r)],["s（4,2,1 の位）",""+S.s4+S.s2+S.s1+" = "+S.v],["復号の結果",W8.str(fix)]];
        L.forEach(function(it,k){lab(ctx,it[0],tx,cy-60+k*36,C("--muted"),"left");
          ctx.fillStyle=C("--ink");ctx.font="bold 14px "+C("--mono");ctx.textAlign="left";ctx.fillText(it[1],tx,cy-60+k*36+17);});}
      var ne=0;for(var i2=1;i2<=7;i2++)if(err[i2])ne++;
      var ok=W8.str(fix)===W8.str(c),dist=0;for(var i3=1;i3<=7;i3++)if(fix[i3]!==c[i3])dist++;
      ro.innerHTML='受信語 r = <b>'+W8.str(r)+'</b> ／ s = '+S.s4+S.s2+S.s1+'₂ = <b>'+S.v+'</b>'+(S.v?' → 位置 '+S.v+' を反転（青の点線）':' → 反転しない')+
        ' ／ 復号の結果 <b>'+W8.str(fix)+'</b><br>'+
        (ne===0?'<b class="ok">誤りなし: どの円も偶数</b>':
          (ok?'<b class="ok">誤り 1 個 → 外れた円の組み合わせが誤りの位置を指し、訂正できた</b>':
            (S.v===0?'<span class="warn">誤り '+ne+' 個だが、どの円も偶数になり気づかない</span>':
              '<span class="warn">誤り '+ne+' 個 → 1 個の誤りと区別できず、位置 '+S.v+' を反転して送った c と '+dist+' か所違う語になった（誤訂正）</span>')));
    }
    cv.style.cursor="pointer";
    cv.addEventListener("click",function(ev){if(!geo)return;var b=cv.getBoundingClientRect(),x=ev.clientX-b.left,y=ev.clientY-b.top,pos=0;
      [1,2,4].forEach(function(k){var p=geo.cen[k];if((x-p[0])*(x-p[0])+(y-p[1])*(y-p[1])<=geo.R*geo.R)pos+=k;});
      if(pos){if(err[pos])delete err[pos];else err[pos]=1;draw();}});
    reg(cv,draw);
  };

  /* ============ 08. perfect — 受信語から 16 個の符号語までの距離 ============ */
  REG.perfect=function(el){
    head(el,"Perfect code","受信語から 16 個の符号語までの距離");
    var row=ctrls(el);
    var rv=[1,0,1,1,1,1,0],bt=[];
    W8.lbl(row,"受信語 r（押すと 0 と 1 が切り替わる）");
    for(var i=0;i<7;i++)(function(i){bt.push(W8.tog(row,String(rv[i]),rv[i]===1,function(v){rv[i]=v?1:0;draw();}));})(i);
    var rnd=button(row,"ランダムな受信語");rnd.style.padding=".3rem .6rem";
    rnd.addEventListener("click",function(){for(var q=0;q<7;q++){rv[q]=Math.random()<0.5?1:0;bt[q].setAttribute("aria-pressed",rv[q]?"true":"false");}draw();});
    var cv=screen(el,230),cc=cctx(cv), ro=readout(el);
    var CW=[];for(var v=0;v<16;v++){var d=[(v>>3)&1,(v>>2)&1,(v>>1)&1,v&1];CW.push(W8.str(W8.enc(d)));}
    function draw(){
      bt.forEach(function(b,q){b.textContent=String(rv[q]);});
      var r=rv.join(""),by=[[],[],[],[],[],[],[],[]];
      CW.forEach(function(c){var dd=0;for(var q=0;q<7;q++)if(c[q]!==r[q])dd++;by[dd].push(c);});
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=40,cwid=(w-x0-10)/8,base=h-28,bh=22;
      ctx.fillStyle=C("--signal-soft");ctx.fillRect(x0,8,cwid*2,base-8);
      lab(ctx,"距離 1 以内（半径 1 の球）",x0+4,22,C("--signal"),"left");
      for(var dd2=0;dd2<8;dd2++){var xc=x0+dd2*cwid+cwid/2;
        lab(ctx,String(dd2),xc,base+18,C("--muted"),"center");
        by[dd2].forEach(function(c,k){var y=base-(k+1)*bh;var near=dd2<=1;
          ctx.fillStyle=near?C("--signal"):C("--panel");ctx.strokeStyle=near?C("--signal"):C("--line");ctx.lineWidth=1.2;
          rrect(ctx,xc-Math.min(cwid/2-3,36),y+2,Math.min(cwid-6,72),bh-4,4);ctx.fill();ctx.stroke();
          if(cwid>=58){ctx.fillStyle=near?C("--panel"):C("--ink");ctx.font=(near?"bold ":"")+"11px "+C("--mono");ctx.textAlign="center";ctx.fillText(c,xc,y+bh/2+4);}});}
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x0,base);ctx.lineTo(w-10,base);ctx.stroke();
      lab(ctx,"距離",x0-6,base+18,C("--muted"),"right");
      var near=by[0].concat(by[1]);
      ro.innerHTML='受信語 r = <b>'+r+'</b> ／ 距離 1 以内の符号語: <b class="ok">'+near.length+' 個</b>（'+near[0]+'、距離 '+(by[0].length?0:1)+'）'+
        ' ／ 距離ごとの個数: '+by.map(function(a,q){return q+":"+a.length;}).join(" ")+
        '<br>どの受信語を選んでも、距離 1 以内の符号語はちょうど 1 個になる（16 個の球が 128 語を重なりなく埋める）';
    }
    reg(cv,draw);
  };

  /* ============ 08. secded — 拡張ハミング符号 (8,4) の判定 ============ */
  REG.secded=function(el){
    head(el,"SECDED (8,4)","全体パリティで 2 ビット誤りを見分ける");
    var mrow=ctrls(el),erow=ctrls(el);
    var d=[1,0,1,0],e=[0,0,0,0,0,0,0,0,0];e[2]=1;e[6]=1;
    W8.lbl(mrow,"情報ビット (c₃, c₅, c₆, c₇)");
    var mb=[];["c₃","c₅","c₆","c₇"].forEach(function(nm,i){mb.push(W8.tog(mrow,nm+" = "+d[i],d[i]===1,function(v){d[i]=v?1:0;run();}));});
    W8.lbl(erow,"誤りを入れる位置（複数可。8 は追加した全体パリティ）");
    for(var j=1;j<=8;j++)(function(j){W8.tog(erow,"位置 "+j,e[j]===1,function(v){e[j]=v?1:0;run();});})(j);
    var out=panel(el), ro=readout(el);
    function run(){
      mb.forEach(function(b,i){b.textContent=["c₃","c₅","c₆","c₇"][i]+" = "+d[i];});
      var c=W8.enc(d);c[8]=(c[1]+c[2]+c[3]+c[4]+c[5]+c[6]+c[7])%2;
      var r=c.slice();for(var i=1;i<=8;i++)if(e[i])r[i]^=1;
      var S=W8.syn(r),ones=0;for(var i2=1;i2<=8;i2++)ones+=r[i2];var odd=ones%2===1;
      var ne=0;for(var i3=1;i3<=8;i3++)ne+=e[i3];
      var dec,act=0;
      if(S.v===0&&!odd)dec="誤り無し";else if(S.v!==0&&odd){dec="ハミング部の 1 ビット誤り → 位置 "+S.v+" を反転";act=S.v;}
      else if(S.v===0&&odd){dec="追加したパリティビットの誤り → 位置 8 を反転";act=8;}else dec="2 ビット誤り → 訂正せず、誤りを報告する";
      var fix=r.slice();if(act)fix[act]^=1;
      var pl=r.slice(0,8);var plfix=pl.slice();if(S.v)plfix[S.v]^=1;
      var sty=function(i){return i===8?"b":W8.ck(i);};
      var h='<table style="border-collapse:collapse;width:auto">';
      h+='<tr><td '+W8.th+'>送った符号語（8 = 全体パリティ）</td><td '+W8.td+'>'+W8.row(c,sty,1,9)+'</td></tr>';
      h+='<tr><td '+W8.th+'>受信語 r</td><td '+W8.td+'>'+W8.row(r,function(i){return e[i]?"e":"n";},1,9)+'</td></tr>';
      h+='<tr><td '+W8.th+'>ハミング部のシンドローム s</td><td '+W8.td+'><b>'+S.s4+S.s2+S.s1+'</b>₂ = '+S.v+(S.v?' ≠ 0':' = 0')+'</td></tr>';
      h+='<tr><td '+W8.th+'>全体の 1 の個数</td><td '+W8.td+'><b>'+ones+'</b>（'+(odd?'奇数':'偶数')+'）</td></tr>';
      h+='<tr><td '+W8.th+'>判定</td><td '+W8.td+'><b>'+dec+'</b></td></tr>';
      h+='<tr><td '+W8.th+'>比較: 全体パリティを見ない (7,4) の復号</td><td '+W8.td+'>'+(S.v?'位置 '+S.v+' を反転 → '+W8.row(plfix,function(i){return plfix[i]!==c[i]?"e":"n";},1,8):'何もしない → '+W8.row(pl,function(i){return pl[i]!==c[i]?"e":"n";},1,8))+'</td></tr>';
      out.innerHTML=h+'</table>';
      var okfix=true;for(var i4=1;i4<=8;i4++)if(fix[i4]!==c[i4])okfix=false;
      var msg;
      if(ne===0)msg='<b class="ok">誤りなし</b>';
      else if(ne===1)msg=okfix?'<b class="ok">誤り 1 個 → 訂正できた</b>':'<span class="warn">?</span>';
      else if(ne===2)msg='<b class="ok">誤り 2 個 → 訂正はせず、誤りがあることを検出した</b>（(7,4) のままなら誤訂正になる）';
      else msg=(act&&!okfix)?'<span class="warn">誤り '+ne+' 個 → 1 ビット誤りと判定され、誤訂正になる（d_min = 4 で保証されるのは 1 ビット訂正と 2 ビット検出まで）</span>':
        (S.v===0&&!odd?'<span class="warn">誤り '+ne+' 個 → 受信語が別の符号語になり、気づかない</span>':'<span class="warn">誤り '+ne+' 個 → 2 ビット誤りとして報告される（保証の範囲外）</span>');
      ro.innerHTML=msg;
    }
    run();
  };

  /* ============ 09. 共通の補助関数（GF(2) 係数の多項式を 0/1 の文字列で扱う。左端が最高次） ============ */
  var W09=(function(){
    var SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
    function clean(s){return String(s||"").replace(/[^01]/g,"");}
    function arr(s){return s.split("").map(Number);}
    function str(a){return a.join("");}
    /* a を g で割る。g の先頭は 1。余りは g の次数と同じ桁数 */
    function divmod(A,G){
      var a=arr(A),g=arr(G),n=a.length,m=g.length,q=[];
      for(var i=0;i+m<=n;i++){
        q.push(a[i]);
        if(a[i])for(var j=0;j<m;j++)a[i+j]^=g[j];
      }
      var r=a.slice(Math.max(0,n-m+1));
      while(r.length<m-1)r.unshift(0);
      return {q:str(q).replace(/^0+/,"")||"0",r:str(r)};
    }
    function mul(A,B){
      var a=arr(A),b=arr(B),out=new Array(a.length+b.length-1).fill(0);
      for(var i=0;i<a.length;i++)if(a[i])for(var j=0;j<b.length;j++)out[i+j]^=b[j];
      return str(out);
    }
    function pad(s,n){s=s.replace(/^0+/,"");if(s.length>n)s=s.slice(s.length-n);while(s.length<n)s="0"+s;return s;}
    function sup(e){return String(e).split("").map(function(d){return SUP[+d];}).join("");}
    function poly(s){
      s=s.replace(/^0+/,"");if(!s)return "0";
      var d=s.length-1,t=[];
      for(var i=0;i<s.length;i++)if(s[i]==="1"){var e=d-i;t.push(e===0?"1":e===1?"x":"x"+sup(e));}
      return t.join("+");
    }
    function xor(a,b){var o="";for(var i=0;i<a.length;i++)o+=(a[i]===b[i]?"0":"1");return o;}
    var STY={
      n:"",
      d:"background:var(--signal-soft);",
      c:"background:color-mix(in srgb,var(--blue) 16%,transparent);",
      e:"background:var(--alias-soft);color:var(--alias);font-weight:700;",
      z:"color:var(--faint);",
      h:"background:var(--signal-soft);color:var(--signal);font-weight:700;"
    };
    /* ビット列をマスで並べた HTML。st はスタイル文字の列（1 文字なら全部同じ） */
    function cells(s,st){
      st=st||"n";if(st.length===1)st=new Array(s.length+1).join(st);
      var h="";
      for(var i=0;i<s.length;i++)h+='<span style="display:inline-block;min-width:1.45em;text-align:center;border-radius:4px;margin:0 1px;'+(STY[st[i]]||"")+'">'+esc(s[i])+'</span>';
      return '<span style="white-space:nowrap">'+h+'</span>';
    }
    /* CRC-32（poly 0x04C11DB7）。init / refin / refout / xorout を指定する */
    function rev(v,n){var r=0;for(var i=0;i<n;i++){r=(r<<1)|(v&1);v>>>=1;}return r>>>0;}
    function crc32(bytes,init,refin,refout,xorout){
      var c=init>>>0;
      for(var i=0;i<bytes.length;i++){
        var b=bytes[i];if(refin)b=rev(b,8);
        c=(c^(b<<24))>>>0;
        for(var k=0;k<8;k++)c=(c&0x80000000)?(((c<<1)^0x04C11DB7)>>>0):((c<<1)>>>0);
      }
      if(refout)c=rev(c,32);
      return (c^xorout)>>>0;
    }
    function hex(v,n){var s=(v>>>0).toString(16).toUpperCase();while(s.length<(n||8))s="0"+s;return s;}
    function bytesOf(t){
      if(window.TextEncoder)return Array.prototype.slice.call(new TextEncoder().encode(t));
      var o=[];for(var i=0;i<t.length;i++)o.push(t.charCodeAt(i)&255);return o;
    }
    function bytesHex(b,mark){
      return b.map(function(v,i){var s=hex(v,2);return mark&&mark[i]?'<b style="color:var(--alias)">'+s+'</b>':s;}).join(" ");
    }
    return {clean:clean,divmod:divmod,mul:mul,pad:pad,poly:poly,xor:xor,cells:cells,crc32:crc32,hex:hex,bytesOf:bytesOf,bytesHex:bytesHex,sup:sup};
  })();

  /* ============ 09. cyclic — 符号語を巡回シフトしても g の倍数か ============ */
  REG.cyclic=function(el){
    head(el,"Cyclic","符号語を巡回シフトしても符号語か");
    var row=ctrls(el);
    var opts=[["x³+x+1（1011）","1011"],["x³+x²+1（1101）","1101"],["(x+1)(x³+x+1) = x⁴+x³+x²+1","11101"],
              ["x+1（11）","11"],["(x³+x+1)(x³+x²+1) = x⁶+x⁵+⋯+x+1","1111111"],["(x+1)³ = x³+x²+x+1（x⁷+1 を割り切らない）","1111"]];
    var sg=select(row,"生成多項式 g（符号長 n = 7）",opts.map(function(o){return o[0];}));
    var iu=textin(row,"情報多項式 u（2 進）","1","120px");
    var out=panel(el), rd=readout(el);
    var th='style="padding:.15rem .6rem;text-align:left;color:var(--muted);font-weight:600"', td='style="padding:.12rem .6rem;text-align:left"';
    function rot(s){return s.slice(1)+s[0];}
    function run(){
      var G=opts[+sg.value][1], r=G.length-1, k=7-r;
      var U=W09.clean(iu.value).replace(/^0+/,"")||"0";
      if(U.length>k){out.innerHTML='<span style="color:var(--alias)">この g では k = '+k+' なので、u は '+k+' ビット以内（次数 '+(k-1)+' 以下）にする</span>';rd.innerHTML="";return;}
      var c=W09.pad(W09.mul(U,G),7);
      var h='<div style="margin-bottom:.4rem">符号語 c = u·g = ('+W09.poly(U)+')·('+W09.poly(G)+') = <b>'+c+'</b></div>';
      h+='<table style="border-collapse:collapse"><tr><th '+th+'>シフト回数</th><th '+th+'>ビット列</th><th '+th+'>g で割った余り</th><th '+th+'>判定</th></tr>';
      var w=c, allok=true, first=-1;
      for(var s=0;s<7;s++){
        var dm=W09.divmod(w,G), ok=dm.r.indexOf("1")<0;
        if(!ok){allok=false;if(first<0)first=s;}
        var st="nnnnnnn"; if(s>0)st="nnnnnnh";
        h+='<tr><td '+td+'>'+s+'</td><td '+td+'>'+W09.cells(w,st)+'</td><td '+td+'>'+W09.cells(dm.r,ok?"z":"e")+'</td><td '+td+'>'+
          (ok?'<span style="color:var(--signal)">g の倍数（u = '+W09.poly(dm.q)+'）</span>':'<span style="color:var(--alias);font-weight:700">g の倍数でない</span>')+'</td></tr>';
        w=rot(w);
      }
      h+='</table>';
      out.innerHTML=h;
      var xn=W09.divmod("10000001",G).r, div=xn.indexOf("1")<0;
      // 最小距離（0 でない符号語の重みの最小）
      var dmin=99;
      for(var v=1;v<(1<<k);v++){var cw=W09.mul(v.toString(2),G),wt=(cw.match(/1/g)||[]).length;if(wt<dmin)dmin=wt;}
      rd.innerHTML='x⁷+1 を g で割った余り = <b>'+xn+'</b> ／ '+
        (div?'<span class="ok">g は x⁷+1 を割り切る → (7, '+k+') 巡回符号（最小距離 '+dmin+'）</span>'
            :(allok?'<span class="warn">g は x⁷+1 を割り切らない。この u ではたまたま閉じているが、ほかの u では閉じない</span>'
                   :'<span class="warn">g は x⁷+1 を割り切らない → '+first+' 回シフトしたところで g の倍数でなくなった</span>'));
    }
    sg.addEventListener("change",run);iu.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 09. crcenc — 送信側と受信側の筆算 ============ */
  REG.crcenc=function(el){
    head(el,"CRC","送信側の筆算と、受信語を割る筆算");
    var row=ctrls(el);
    var im=textin(row,"データ（2 進）","1101","130px"), ig=textin(row,"生成多項式 g（2 進）","1011","110px"),
        ie=textin(row,"誤りパターン E（1 の位置が反転）","0010000","150px");
    var out=panel(el), rd=readout(el);
    function ld(A,B){return (typeof longDiv==="function")?longDiv(A,B).html:esc(A)+" ÷ "+esc(B);}
    function run(){
      var M=W09.clean(im.value), G=W09.clean(ig.value).replace(/^0+/,"");
      if(!M||G.length<2){out.innerHTML='<span style="color:var(--alias)">データと g（次数 1 以上）を 0 と 1 で入れる</span>';rd.innerHTML="";return;}
      if(M.length>20||G.length>12){out.innerHTML='<span style="color:var(--alias)">データは 20 ビット、g は 12 ビットまで</span>';rd.innerHTML="";return;}
      var r=G.length-1, aug=M+new Array(r+1).join("0"), R=W09.divmod(aug,G).r, T=M+R, n=T.length;
      var E=W09.pad(W09.clean(ie.value),n), Tp=W09.xor(T,E), Rp=W09.divmod(Tp,G).r, RE=W09.divmod(E,G).r;
      var est="", tst="";
      for(var i=0;i<n;i++){est+=E[i]==="1"?"e":"z";tst+=E[i]==="1"?"e":(i<M.length?"d":"c");}
      var box='style="flex:1 1 300px;min-width:260px"';
      var h='<div style="display:flex;flex-wrap:wrap;gap:1rem 1.6rem">';
      h+='<div '+box+'><div style="color:var(--muted);margin-bottom:.3rem">送信側: x<sup>'+r+'</sup>m(x) を g で割る</div>'+ld(aug,G)+
         '<div style="margin-top:.5rem">符号語 T = '+W09.cells(T,new Array(M.length+1).join("d")+new Array(r+1).join("c"))+'</div></div>';
      h+='<div '+box+'><div style="color:var(--muted);margin-bottom:.3rem">受信側: T′ = T + E を g で割る</div>'+ld(Tp,G)+
         '<div style="margin-top:.5rem">E　= '+W09.cells(E,est)+'</div><div>T′ = '+W09.cells(Tp,tst)+'</div></div>';
      h+='</div>';
      out.innerHTML=h;
      var hasE=E.indexOf("1")>=0, detect=Rp.indexOf("1")>=0;
      rd.innerHTML='R = <b>'+R+'</b> ／ T = <b>'+T+'</b> ／ 受信側の余り = <b>'+Rp+'</b>（E を g で割った余り '+RE+'）／ '+
        (!hasE?'<span class="ok">誤り無し → 余り 0</span>':
          detect?'<span class="ok">余りが 0 でない → 誤りを検出</span>':'<span class="warn">E が g の倍数 → 余り 0 で見逃す</span>');
    }
    [im,ig,ie].forEach(function(x){x.addEventListener("input",run);});reg(null,run);run();
  };

  /* ============ 09. crcreg — シフトレジスタを 1 クロックずつ動かす ============ */
  REG.crcreg=function(el){
    head(el,"Shift Register","1 クロックずつ動かして余りを求める");
    var row=ctrls(el);
    var im=textin(row,"データ（2 進）","1101","120px"), ig=textin(row,"生成多項式 g（2 進）","1011","110px");
    var sm=select(row,"方法",["0 を付け足さない（回路）","0 を r 個付け足す（筆算）"]);
    var row2=ctrls(el);
    var st=slider(row2,"クロック t",0,4,4,1);
    var cv=screen(el,200),cc=cctx(cv);
    var out=panel(el), rd=readout(el);
    var sim=null;
    function simulate(){
      var M=W09.clean(im.value), G=W09.clean(ig.value).replace(/^0+/,"");
      if(!M||G.length<2||G.length>9||M.length>16)return null;
      var r=G.length-1, g=G.split("").map(Number), modeA=(+sm.value===1);
      var inp=(M+(modeA?new Array(r+1).join("0"):"")).split("").map(Number);
      var Q=new Array(r).fill(0), hist=[{Q:Q.slice(),b:null,f:null}];
      for(var t=0;t<inp.length;t++){
        var b=inp[t], top=Q[0], f=modeA?top:(top^b), nQ=new Array(r);
        /* Q[0] が左端（x^(r-1) の位置）、Q[r-1] が右端（x^0 の位置） */
        for(var i=0;i<r;i++){
          var from=(i<r-1)?Q[i+1]:(modeA?b:0);
          nQ[i]=from^(f&g[i+1]);
        }
        Q=nQ;hist.push({Q:Q.slice(),b:b,f:f,top:top});
      }
      var R=W09.divmod(M+new Array(r+1).join("0"),G).r;
      return {M:M,G:G,r:r,g:g,modeA:modeA,inp:inp,hist:hist,R:R};
    }
    function draw(){
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(!sim){lab(ctx,"データは 16 ビット、g は 9 ビット（次数 8）まで",12,24,C("--alias"),"left");return;}
      var t=+st.input.value, r=sim.r, cur=sim.hist[t], nxt=sim.hist[t+1];
      var Q=cur.Q, x0=130, cw=Math.max(26,Math.min(58,(w-x0-130)/(r*1.6))), gap=cw*0.6, y=86, ch=40;
      var X=function(i){return x0+i*(cw+gap);};
      var fOn=nxt?nxt.f:null, ink=C("--ink"), mut=C("--muted"), red=C("--alias"), grn=C("--signal"), blu=C("--blue");
      var fy=h-44, xf=x0-46, xr=X(r-1)+cw+gap/2+16, my=y+ch/2;
      var fc=fOn===1?red:C("--line");
      function xorAt(x,col){ctx.fillStyle=C("--panel");ctx.strokeStyle=col;ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(x,my,9,0,TAU);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(x-5,my);ctx.lineTo(x+5,my);ctx.moveTo(x,my-5);ctx.lineTo(x,my+5);ctx.stroke();}
      function arrowL(x1,x2){ctx.strokeStyle=mut;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x1,my);ctx.lineTo(x2+6,my);ctx.stroke();
        ctx.fillStyle=mut;ctx.beginPath();ctx.moveTo(x2,my);ctx.lineTo(x2+7,my-4);ctx.lineTo(x2+7,my+4);ctx.closePath();ctx.fill();}
      /* 帰還線（左の f から下を通って右へ、XOR のある位置で上へ） */
      ctx.lineWidth=2;ctx.strokeStyle=fc;
      ctx.beginPath();ctx.moveTo(xf,my+(sim.modeA?0:9));ctx.lineTo(xf,fy);ctx.lineTo(X(r-1)+cw+gap/2,fy);ctx.stroke();
      for(var i=0;i<r;i++){
        if(!sim.g[i+1])continue;
        var gx=X(i)+cw+gap/2;
        ctx.strokeStyle=fc;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx,fy);ctx.lineTo(gx,my+9);ctx.stroke();
        ctx.fillStyle=fc;ctx.beginPath();ctx.arc(gx,fy,3.2,0,TAU);ctx.fill();
      }
      /* セル */
      for(var i2=0;i2<r;i2++){
        var x=X(i2);
        ctx.fillStyle=C("--panel");rrect(ctx,x,y,cw,ch,6);ctx.fill();
        ctx.strokeStyle=blu;ctx.lineWidth=1.6;ctx.stroke();
        ctx.fillStyle=ink;ctx.font="bold 18px "+C("--mono");ctx.textAlign="center";ctx.fillText(String(Q[i2]),x+cw/2,my+6);
        lab(ctx,"x"+W09.sup(r-1-i2),x+cw/2,y-9,mut,"center");
        var gx2=x+cw+gap/2, right=(i2<r-1)?X(i2+1):null;
        if(sim.g[i2+1]){
          if(right!==null)arrowL(right,gx2+9);
          arrowL(gx2-9,x+cw);
          xorAt(gx2,fOn===1?red:ink);
        }else if(right!==null){arrowL(right,x+cw);}
        if(right===null&&sim.modeA){
          /* 筆算と同じ方法: 右端から入力が入る */
          var src=xr+14;
          if(sim.g[i2+1])arrowL(src,gx2+9);else arrowL(src,x+cw);
        }
      }
      /* 左端から出る線 */
      if(sim.modeA){
        ctx.strokeStyle=mut;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x0,my);ctx.lineTo(xf,my);ctx.stroke();
        ctx.fillStyle=fc;ctx.beginPath();ctx.arc(xf,my,4,0,TAU);ctx.fill();
        lab(ctx,"はみ出す",xf,my-14,mut,"center");
        lab(ctx,"← 入力",xr+18,my+4,grn,"left");
        lab(ctx,nxt?"b = "+nxt.b:"（終わり）",xr+18,my+22,grn,"left");
      }else{
        arrowL(x0,xf+9);
        xorAt(xf,fOn===1?red:ink);
        ctx.strokeStyle=grn;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(xf,y-26);ctx.lineTo(xf,my-10);ctx.stroke();
        lab(ctx,nxt?"入力 b = "+nxt.b:"入力（終わり）",xf,y-32,grn,"center");
      }
      lab(ctx,"帰還ビット f"+(fOn===null?"":" = "+fOn)+(fOn===1?"（1 の位置に XOR する）":"（XOR しない）"),xf+10,fy+17,fOn===1?red:mut,"left");
      lab(ctx,"t = "+t+" / "+(sim.hist.length-1)+(nxt?"（次のクロックの f を表示）":"（終わり）"),w-12,18,ink,"right");
    }
    function table(){
      if(!sim){out.innerHTML="";return;}
      var t=+st.input.value, th='style="padding:.12rem .55rem;text-align:center;color:var(--muted);font-weight:600"', td='style="padding:.1rem .55rem;text-align:center"';
      var h='<div style="margin-bottom:.35rem">入力: '+W09.cells(sim.inp.join(""),new Array(sim.M.length+1).join("d")+new Array(sim.inp.length-sim.M.length+1).join("z"))+'</div>';
      h+='<table style="border-collapse:collapse"><tr><th '+th+'>t</th><th '+th+'>入れたビット b</th><th '+th+'>'+(sim.modeA?'はみ出したビット':'帰還ビット f')+'</th><th '+th+'>レジスタ</th></tr>';
      for(var k=0;k<=t;k++){
        var H=sim.hist[k], on=k===t;
        h+='<tr'+(on?' style="background:var(--signal-soft)"':'')+'><td '+td+'>'+k+'</td><td '+td+'>'+(H.b===null?'—':H.b)+'</td><td '+td+'>'+
          (H.f===null?'—':(H.f?'<b style="color:var(--alias)">1</b>':'0'))+'</td><td '+td+'>'+W09.cells(H.Q.join(""),k===sim.hist.length-1?"c":"n")+'</td></tr>';
      }
      out.innerHTML=h+'</table>';
      var done=t===sim.hist.length-1, Qs=sim.hist[t].Q.join("");
      rd.innerHTML=done?('レジスタ = <b>'+Qs+'</b> ／ 筆算で求めた余り R = <b>'+sim.R+'</b> '+(Qs===sim.R?'<span class="ok">一致 ✓</span>':'<span class="warn">不一致</span>')+
        ' ／ '+(sim.modeA?'データ + 0 の '+sim.inp.length+' クロック':'データの '+sim.inp.length+' クロックで済む'))
        :('t = '+t+' ／ レジスタ = <b>'+Qs+'</b> ／ クロックを最後（t = '+(sim.hist.length-1)+'）まで進めると余り R が残る');
    }
    function rebuild(keep){
      sim=simulate();
      var N=sim?sim.hist.length-1:0;
      st.input.max=N; if(!keep||+st.input.value>N)st.input.value=Math.min(2,N);
      st.val.textContent=st.input.value;
      draw();table();
    }
    [im,ig].forEach(function(x){x.addEventListener("input",function(){rebuild(false);});});
    sm.addEventListener("change",function(){rebuild(false);});
    st.input.addEventListener("input",function(){st.val.textContent=st.input.value;draw();table();});
    reg(cv,draw);rebuild(false);
  };

  /* ============ 09. crcparam — CRC-32 の実装パラメータ ============ */
  REG.crcparam=function(el){
    head(el,"CRC-32 Parameters","init・refin・refout・xorout を変えると値が変わる");
    var row=ctrls(el);
    var it=textin(row,"データ（文字列。UTF-8 のバイト列にする）","123456789");
    var row2=ctrls(el);
    var cI=checkbox(row2,"init = 0xFFFFFFFF",true), cRi=checkbox(row2,"refin（入力のビット順を反転）",true),
        cRo=checkbox(row2,"refout（出力のビット順を反転）",true), cX=checkbox(row2,"xorout = 0xFFFFFFFF",true);
    var out=panel(el), rd=readout(el);
    var names={"0,0,0,0":"素の CRC（5 節の crc32_plain）","1,0,0,1":"CRC-32/BZIP2","1,0,0,0":"CRC-32/MPEG-2",
               "1,1,1,1":"CRC-32（Ethernet・ZIP・PNG）","1,1,1,0":"CRC-32/JAMCRC","0,0,0,1":"CRC-32/CKSUM"};
    var th='style="padding:.15rem .6rem;text-align:left;color:var(--muted);font-weight:600"', td='style="padding:.12rem .6rem;text-align:left"';
    function run(){
      var data=W09.bytesOf(it.value), I=cI.checked?0xFFFFFFFF:0, ri=cRi.checked, ro=cRo.checked, X=cX.checked?0xFFFFFFFF:0;
      function crc(b){return W09.crc32(b,I,ri,ro,X);}
      var v=crc(data), lead=crc([0].concat(data));
      var cb=[(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]; if(ro)cb.reverse();
      var frame=data.concat(cb), fr=crc(frame), fr0=crc(frame.concat([0]));
      var h='<table style="border-collapse:collapse"><tr><th '+th+'>計算したもの</th><th '+th+'>値</th></tr>';
      h+='<tr><td '+td+'>データ（'+data.length+' バイト）</td><td '+td+'>'+(data.length?W09.bytesHex(data):'（空）')+'</td></tr>';
      h+='<tr><td '+td+'><b>CRC の値</b></td><td '+td+'><b style="color:var(--signal)">0x'+W09.hex(v)+'</b></td></tr>';
      h+='<tr><td '+td+'>先頭に 00 を 1 バイト付けたデータの CRC</td><td '+td+'>0x'+W09.hex(lead)+(lead===v?' <span style="color:var(--alias);font-weight:700">（同じ）</span>':' （違う）')+'</td></tr>';
      h+='<tr><td '+td+'>データ + CRC の値（'+(ro?'下位':'上位')+'バイトから 4 バイト）全体の CRC</td><td '+td+'>0x'+W09.hex(fr)+'</td></tr>';
      h+='<tr><td '+td+'>その後ろに 00 を 1 バイト付けた全体の CRC</td><td '+td+'>0x'+W09.hex(fr0)+(fr0===fr?' <span style="color:var(--alias);font-weight:700">（同じ）</span>':' （違う）')+'</td></tr>';
      out.innerHTML=h+'</table>';
      var key=[cI.checked?1:0,ri?1:0,ro?1:0,cX.checked?1:0].join(","), nm=names[key];
      rd.innerHTML=(nm?'この組み合わせ: <b>'+nm+'</b>':'この組み合わせに広く使われている名前は無い')+' ／ '+
        (lead===v?'<span class="warn">先頭の 0 に気づけない（init = 0）</span>':'<span class="ok">先頭の 0 で値が変わる</span>')+' ／ '+
        (fr0===fr?'<span class="warn">末尾の 0 に気づけない（全体の CRC が '+(fr===0?'0 のまま':'変わらない')+'）</span>':'<span class="ok">末尾の 0 で全体の CRC が変わる</span>');
    }
    it.addEventListener("input",run);[cI,cRi,cRo,cX].forEach(function(c){c.addEventListener("change",run);});reg(null,run);run();
  };

  /* ============ 09. crcforge — m を知らずに CRC を合わせる ============ */
  REG.crcforge=function(el){
    head(el,"Forgery","変更分 Δ だけから CRC の補正値を作る");
    var row=ctrls(el);
    var ia=textin(row,"元のデータ m","PAY 100"), ib=textin(row,"書き換え後 m′（同じバイト数）","PAY 900");
    var out=panel(el), rd=readout(el);
    var th='style="padding:.15rem .6rem;text-align:left;color:var(--muted);font-weight:600"', td='style="padding:.12rem .6rem;text-align:left"';
    function crc(b){return W09.crc32(b,0xFFFFFFFF,true,true,0xFFFFFFFF);}
    function run(){
      var a=W09.bytesOf(ia.value), b=W09.bytesOf(ib.value);
      if(!a.length||a.length!==b.length){out.innerHTML='<span style="color:var(--alias)">m と m′ は同じバイト数にする（いま '+a.length+' バイトと '+b.length+' バイト）</span>';rd.innerHTML="";return;}
      var D=a.map(function(v,i){return v^b[i];}), Z=a.map(function(){return 0;}), mark=D.map(function(v){return v!==0;});
      var cm=crc(a), cD=crc(D), c0=crc(Z), P=(cD^c0)>>>0, forged=(cm^P)>>>0, real=crc(b);
      var h='<table style="border-collapse:collapse"><tr><th '+th+'></th><th '+th+'>バイト列（16 進）</th><th '+th+'>CRC-32</th></tr>';
      h+='<tr><td '+td+'>元のデータ m</td><td '+td+'>'+W09.bytesHex(a)+'</td><td '+td+'>0x'+W09.hex(cm)+'</td></tr>';
      h+='<tr><td '+td+'>Δ = m ⊕ m′</td><td '+td+'>'+W09.bytesHex(D,mark)+'</td><td '+td+'>CRC(Δ) = 0x'+W09.hex(cD)+'</td></tr>';
      h+='<tr><td '+td+'>0 だけのデータ</td><td '+td+'>'+W09.bytesHex(Z)+'</td><td '+td+'>CRC(0⋯0) = 0x'+W09.hex(c0)+'</td></tr>';
      h+='<tr><td '+td+'><b>補正値 P</b></td><td '+td+' colspan="2">CRC(Δ) ⊕ CRC(0⋯0) = <b style="color:var(--alias)">0x'+W09.hex(P)+'</b>（m を使わずに計算した）</td></tr>';
      h+='<tr><td '+td+'>攻撃者が付ける値</td><td '+td+' colspan="2">CRC(m) ⊕ P = <b>0x'+W09.hex(forged)+'</b></td></tr>';
      h+='<tr><td '+td+'>受信者が計算する値</td><td '+td+'>'+W09.bytesHex(b,mark)+'</td><td '+td+'>CRC(m′) = <b>0x'+W09.hex(real)+'</b></td></tr>';
      out.innerHTML=h+'</table>';
      rd.innerHTML=(forged===real?'<span class="warn">一致する → 受信者は改ざんに気づけない</span>':'<span class="ok">一致しない</span>')+
        ' ／ 変えたバイトは '+mark.filter(Boolean).length+' 個 ／ 使った CRC は Ethernet・ZIP と同じパラメータ（init と xorout あり）';
    }
    [ia,ib].forEach(function(x){x.addEventListener("input",run);});reg(null,run);run();
  };

  /* ============ 10. 共通の補助関数（GF(2^m) と GF(2) 係数の多項式） ============ */
  var W10=(function(){
    var SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
    function sup(e){return String(e).split("").map(function(d){return SUP[+d];}).join("");}
    function al(i){return "α"+sup(i);}
    var PRIM={3:0b1011,4:0b10011,5:0b100101,6:0b1000011};
    /* GF(2^m) を原始多項式で作る。exp[i] = α^i、log[v] = i */
    function field(m){
      var n=(1<<m)-1, exp=new Array(2*n), log=new Array(n+1), v=1;
      for(var i=0;i<n;i++){exp[i]=v;log[v]=i;v<<=1;if(v>>m)v^=PRIM[m];}
      for(i=n;i<2*n;i++)exp[i]=exp[i-n];
      function mul(a,b){return (a&&b)?exp[(log[a]+log[b])%n]:0;}
      function pw(e){return exp[((e%n)+n)%n];}
      return {m:m,n:n,exp:exp,log:log,mul:mul,pw:pw,poly:PRIM[m]};
    }
    function bits(v,m){var s=v.toString(2);while(s.length<m)s="0"+s;return s;}
    /* GF(2) 係数の多項式（昇べきの配列 c[i] = x^i の係数）を文字列に */
    function pstr(c){
      var t=[];for(var i=c.length-1;i>=0;i--)if(c[i])t.push(i===0?"1":i===1?"x":"x"+sup(i));
      return t.join("+")||"0";
    }
    function pmul(a,b){var r=new Array(a.length+b.length-1).fill(0);
      for(var i=0;i<a.length;i++)if(a[i])for(var j=0;j<b.length;j++)r[i+j]^=b[j];return r;}
    /* 指数 j の共役類（j, 2j, 4j, … を n で割った余り） */
    function coset(j,n){var c=[],v=j%n;do{c.push(v);v=(2*v)%n;}while(v!==j%n);return c;}
    /* 共役類の最小多項式 Π(x + α^i)。係数は 0 か 1 になる（昇べき） */
    function minpoly(F,cls){
      var P=[1];
      cls.forEach(function(i){var a=F.pw(i),Q=new Array(P.length+1).fill(0);
        for(var k=0;k<P.length;k++){Q[k+1]^=P[k];Q[k]^=F.mul(P[k],a);}P=Q;});
      return P;
    }
    function cellsHTML(s,st){
      var STY={n:"",c:"background:color-mix(in srgb,var(--blue) 16%,transparent);",e:"background:var(--alias-soft);color:var(--alias);font-weight:700;",
               z:"color:var(--faint);",h:"background:var(--signal-soft);color:var(--signal);font-weight:700;"};
      if(!st)st="n";if(st.length===1)st=new Array(s.length+1).join(st);
      var h="";for(var i=0;i<s.length;i++)h+='<span style="display:inline-block;min-width:1.35em;text-align:center;border-radius:4px;margin:0 1px;'+(STY[st[i]]||"")+'">'+s[i]+'</span>';
      return '<span style="white-space:nowrap">'+h+'</span>';
    }
    return {sup:sup,al:al,field:field,bits:bits,pstr:pstr,pmul:pmul,coset:coset,minpoly:minpoly,cells:cellsHTML};
  })();

  /* ============ 10. rootscan — GF(2) 係数の多項式に α^i を代入する ============ */
  REG.rootscan=function(el){
    head(el,"Roots","GF(2) 係数の多項式に α⁰ … α¹⁴ を代入する");
    var row=ctrls(el);
    var ip=textin(row,"多項式（2 進。左端が最高次）","10011","160px");
    var si=slider(row,"計算を表示する αⁱ の i",0,14,1,1);
    var out=panel(el), rd=readout(el);
    var F=W10.field(4);
    function run(){
      var P=(ip.value||"").replace(/[^01]/g,"").replace(/^0+/,"");
      if(!P||P.length>16){out.innerHTML='<span style="color:var(--alias)">0 と 1 で、次数 15 以下の 0 でない多項式を入れる</span>';rd.innerHTML="";return;}
      var d=P.length-1, coef=[];for(var e=0;e<=d;e++)coef[e]=+P[d-e];
      var vals=[], roots=[];
      for(var i=0;i<15;i++){var v=0;for(var e2=0;e2<=d;e2++)if(coef[e2])v^=F.pw(i*e2);vals.push(v);if(v===0)roots.push(i);}
      var sel=+si.input.value; si.val.textContent=W10.al(sel);
      var h='<div style="margin-bottom:.35rem">p(x) = '+W10.pstr(coef)+'（次数 '+d+'）</div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.35rem">';
      for(var k=0;k<15;k++){var z=vals[k]===0;
        h+='<div style="min-width:4.6em;text-align:center;border:1px solid '+(k===sel?'var(--blue)':'var(--line)')+';border-radius:6px;padding:.15rem .3rem;'+(z?'background:var(--signal-soft)':'')+'">'+
          '<div style="color:var(--blue);font-weight:700">'+W10.al(k)+'</div>'+
          '<div style="color:var(--faint);font-size:.72rem">'+W10.bits(F.pw(k),4)+'</div>'+
          '<div style="'+(z?'color:var(--signal);font-weight:700':'')+'">'+W10.bits(vals[k],4)+'</div></div>';}
      h+='</div><div style="color:var(--faint);font-size:.72rem;margin-top:.2rem">各マス: 上から αⁱ、そのビット表現、p(αⁱ) の値（緑のマスが根）</div>';
      /* 選んだ i の計算 */
      var terms=[];for(var e3=d;e3>=0;e3--)if(coef[e3])terms.push(e3);
      h+='<div style="margin-top:.6rem;color:var(--muted)">p('+W10.al(sel)+') の計算（各項 x<sup>e</sup> は α<sup>'+sel+'·e</sup> になる）</div><div>';
      terms.forEach(function(e4,idx){var ex=(sel*e4)%15;
        h+=(idx?' ⊕ ':'')+'<span title="x^'+e4+'">'+W10.al(ex)+'</span> <span style="color:var(--faint)">('+W10.bits(F.pw(ex),4)+')</span>';});
      h+=' = <b>'+W10.bits(vals[sel],4)+'</b>'+(vals[sel]===0?' <span style="color:var(--signal)">→ 根</span>':'')+'</div>';
      out.innerHTML=h;
      var closed=roots.every(function(j){return roots.indexOf((2*j)%15)>=0;});
      rd.innerHTML=(roots.length?'根: <b class="ok">'+roots.map(W10.al).join(", ")+'</b>（'+roots.length+' 個 ≤ 次数 '+d+'）':'GF(2⁴) の 0 以外の要素に根は無い')+
        (roots.length?' ／ 根の指数を 2 倍して 15 で割った余りも、また根の指数 '+(closed?'<span class="ok">✓（2 節）</span>':''):'');
    }
    ip.addEventListener("input",run);si.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 10. bchgen — t から生成多項式を組み立てる ============ */
  REG.bchgen=function(el){
    head(el,"BCH","訂正したいビット数 t から g(x) を組み立てる");
    var row=ctrls(el);
    var sm=select(row,"体 GF(2ᵐ)",["m = 3（n = 7、x³+x+1）","m = 4（n = 15、x⁴+x+1）","m = 5（n = 31、x⁵+x²+1）","m = 6（n = 63、x⁶+x+1）"]);
    sm.value="1";
    var st=slider(row,"訂正したいビット数 t",1,4,2,1);
    var cv=screen(el,250),cc=cctx(cv);
    var out=panel(el), rd=readout(el);
    var th='style="padding:.12rem .6rem;text-align:left;color:var(--muted);font-weight:600"', td='style="padding:.1rem .6rem;text-align:left"';
    var cur=null;
    function build(m,t){
      var F=W10.field(m), n=F.n, need=[], used={}, classes=[];
      for(var j=1;j<=2*t;j++)need.push(j%n);
      need.forEach(function(j){
        var c=W10.coset(j,n), key=Math.min.apply(null,c);
        if(!used[key]){used[key]=true;classes.push({cls:c,M:W10.minpoly(F,c),req:[]});}
        classes.forEach(function(o){if(o.cls.indexOf(j)>=0&&o.req.indexOf(j)<0)o.req.push(j);});
      });
      var g=[1];classes.forEach(function(o){g=W10.pmul(g,o.M);});
      return {F:F,n:n,t:t,need:need,classes:classes,g:g,k:n-(g.length-1)};
    }
    function tmax(m){var n=(1<<m)-1;for(var t=1;t<=n;t++){if(build(m,t).k<=1)return t;}return 1;}
    /* 最小距離（k ≤ 21 なら全符号語の重みを数える） */
    function dmin(B){
      var k=B.k,n=B.n;if(k>21)return null;
      var rows=[];for(var i=0;i<k;i++){var lo=0,hi=0;for(var e=0;e<B.g.length;e++)if(B.g[e]){var p=e+i;if(p<32)lo|=(1<<p);else hi|=(1<<(p-32));}rows.push([lo>>>0,hi>>>0]);}
      function pc(x){x=x-((x>>>1)&0x55555555);x=(x&0x33333333)+((x>>>2)&0x33333333);return (((x+(x>>>4))&0x0F0F0F0F)*0x01010101)>>>24;}
      var lo=0,hi=0,best=n;
      for(var c=1;c<(1<<k);c++){var j=0,v=c;while(!(v&1)){v>>=1;j++;}lo^=rows[j][0];hi^=rows[j][1];var w=pc(lo>>>0)+pc(hi>>>0);if(w<best)best=w;}
      return best;
    }
    function draw(){
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(!cur)return;
      var n=cur.n, cx=w/2, cy=h/2+2, R=Math.min(h/2-34,w/2-40);
      var pal=[C("--signal"),C("--blue"),C("--alias"),C("--muted")];
      var inClass={};cur.classes.forEach(function(o,ci){o.cls.forEach(function(j){inClass[j]=ci;});});
      function P(j){var a=-Math.PI/2+TAU*j/n;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];}
      /* 使う類の中の 2 乗の矢印（j → 2j） */
      cur.classes.forEach(function(o,ci){
        ctx.strokeStyle=pal[ci%pal.length];ctx.lineWidth=1.3;ctx.globalAlpha=0.75;
        o.cls.forEach(function(j){var a=P(j),b=P((2*j)%n);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();});
        ctx.globalAlpha=1;
      });
      var rr=n<=15?11:(n<=31?7:4.2);
      for(var j=0;j<n;j++){
        var p=P(j), ci=inClass[j], col=(ci===undefined)?C("--line"):pal[ci%pal.length];
        ctx.beginPath();ctx.arc(p[0],p[1],rr,0,TAU);ctx.fillStyle=(ci===undefined)?C("--panel"):col;ctx.fill();
        ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.stroke();
        if(cur.need.indexOf(j)>=0){ctx.beginPath();ctx.arc(p[0],p[1],rr+4,0,TAU);ctx.strokeStyle=C("--ink");ctx.lineWidth=1.6;ctx.stroke();}
        if(n<=31||j%3===0){var q=[cx+(R+rr+12)*Math.cos(-Math.PI/2+TAU*j/n),cy+(R+rr+12)*Math.sin(-Math.PI/2+TAU*j/n)+4];
          lab(ctx,String(j),q[0],q[1],ci===undefined?C("--faint"):C("--ink"),"center");}
      }
      lab(ctx,"点 = α の指数（0〜"+(n-1)+"）",10,16,C("--muted"),"left");
      lab(ctx,"輪で囲んだ点 = 要求する根 α¹〜α"+W10.sup(2*cur.t),10,32,C("--muted"),"left");
      lab(ctx,"色 = g に入る共役類",10,48,C("--muted"),"left");
    }
    function run(){
      var m=[3,4,5,6][+sm.value], tm=tmax(m);
      st.input.max=tm; if(+st.input.value>tm)st.input.value=tm;
      var t=+st.input.value; st.val.textContent=t;
      cur=build(m,t);
      var h='<table style="border-collapse:collapse"><tr><th '+th+'>共役類（指数）</th><th '+th+'>要求した根</th><th '+th+'>最小多項式 M(x)</th><th '+th+'>次数</th></tr>';
      cur.classes.forEach(function(o){
        h+='<tr><td '+td+'>{'+o.cls.join(", ")+'}</td><td '+td+'>'+o.req.map(W10.al).join(", ")+'</td><td '+td+' style="padding:.1rem .6rem;color:var(--signal)">'+W10.pstr(o.M)+'</td><td '+td+'>'+(o.M.length-1)+'</td></tr>';
      });
      h+='</table>';
      var gb=cur.g.slice().reverse().join("");
      h+='<div style="margin-top:.5rem">g(x) = '+cur.classes.map(function(o){return "("+W10.pstr(o.M)+")";}).join(" · ")+'</div>';
      h+='<div>　　 = <b>'+W10.pstr(cur.g)+'</b>　<span style="color:var(--faint)">（'+gb+'、次数 '+(cur.g.length-1)+'）</span></div>';
      out.innerHTML=h;
      var d=dmin(cur), des=2*t+1;
      rd.innerHTML='<b class="ok">('+cur.n+', '+cur.k+') 符号</b> ／ 検査ビット n − k = deg g = <b>'+(cur.g.length-1)+'</b> ／ 設計距離 2t + 1 = <b>'+des+'</b> ／ '+
        (d===null?'実際の最小距離: 符号語が多いので数えない（2<sup>'+cur.k+'</sup> 個）':'実際の最小距離（全符号語の重みの最小）= <b>'+d+'</b>'+(d>des?'（設計距離より大きい）':'')+' <span class="ok">≥ '+des+' ✓</span>');
      draw();
    }
    sm.addEventListener("change",run);st.input.addEventListener("input",run);reg(cv,draw);run();
  };

  /* ============ 10. bchdec — (15,7) 符号の復号 ============ */
  REG.bchdec=function(el){
    head(el,"BCH Decode","(15,7) 符号で 2 ビットまでの誤りを訂正する");
    var row=ctrls(el);
    var iu=textin(row,"情報ビット u（7 ビット）","0000001","110px");
    var s1=slider(row,"誤りの位置 1",-1,14,10,1), s2=slider(row,"誤りの位置 2",-1,14,3,1), s3=slider(row,"誤りの位置 3",-1,14,-1,1);
    var out=panel(el), rd=readout(el);
    var F=W10.field(4), G=[1,0,0,0,1,0,1,1,1];  /* g = x^8+x^7+x^6+x^4+1（昇べき） */
    function lg(v){return v===0?"0":W10.al(F.log[v]);}
    function ev(r,i){var v=0;for(var e=0;e<15;e++)if(r[e])v^=F.pw(i*e);return v;}
    function str(a){var s="";for(var i=14;i>=0;i--)s+=a[i];return s;}
    function run(){
      var U=(iu.value||"").replace(/[^01]/g,"");
      if(U.length>7){U=U.slice(U.length-7);}while(U.length<7)U="0"+U;
      var u=[];for(var i=0;i<7;i++)u[i]=+U[6-i];
      var c=W10.pmul(u,G);while(c.length<15)c.push(0);
      var e=new Array(15).fill(0), sl=[s1,s2,s3];
      sl.forEach(function(s){var p=+s.input.value;s.val.textContent=p<0?"なし":p;if(p>=0)e[p]^=1;});
      var r=c.map(function(v,k){return v^e[k];});
      var nerr=e.reduce(function(a,b){return a+b;},0);
      var S1=ev(r,1), S3=ev(r,3), lam=null, kind="";
      if(S1===0&&S3===0){lam=[1];kind="誤り無し";}
      else if(S1===0){lam=null;kind="S₁ = 0 なのに S₃ ≠ 0 → 誤りは 3 個以上";}
      else{
        var S1c=F.mul(S1,F.mul(S1,S1)), sg2=F.mul(S3,F.exp[(15-F.log[S1])%15])^F.mul(S1,S1);
        if(S3===S1c){lam=[1,S1];kind="S₃ = S₁³ なので誤り 1 個として計算";}else{lam=[1,S1,sg2];kind="誤り 2 個として計算（σ₂ = S₃/S₁ + S₁² = "+lg(sg2)+"）";}
      }
      var roots=[], vals=[];
      if(lam){for(var i2=0;i2<15;i2++){var x=F.pw(-i2),v=0,xp=1;for(var k=0;k<lam.length;k++){v^=F.mul(lam[k],xp);xp=F.mul(xp,x);}vals.push(v);if(v===0)roots.push(i2);}}
      var fixed=r.slice(), okRoots=lam&&roots.length===lam.length-1;
      if(okRoots)roots.forEach(function(p){fixed[p]^=1;});
      var est="",cst="",rst="";for(var q=14;q>=0;q--){est+=e[q]?"e":"z";cst+=c[q]?"c":"n";rst+=e[q]?"e":(r[q]?"c":"n");}
      var h='<table style="border-collapse:collapse">';
      function trow(lab,bits,sty){return '<tr><td style="padding:.1rem .5rem;color:var(--muted);white-space:nowrap">'+lab+'</td><td style="padding:.1rem .3rem">'+W10.cells(bits,sty)+'</td></tr>';}
      var posrow="";for(var pp=14;pp>=0;pp--)posrow+='<span style="display:inline-block;min-width:1.35em;text-align:center;border-radius:4px;margin:0 1px;color:var(--faint);letter-spacing:-.06em">'+pp+'</span>';
      h+='<tr><td style="padding:.1rem .5rem;color:var(--muted)">位置</td><td style="padding:.1rem .3rem;white-space:nowrap">'+posrow+'</td></tr>';
      h+=trow("送った c = u·g",str(c),cst)+trow("誤り e",str(e),est)+trow("受信語 r",str(r),rst);
      if(okRoots)h+=trow("訂正後",str(fixed),"n");
      h+='</table>';
      h+='<div style="margin-top:.5rem">S₁ = r(α) = <b>'+lg(S1)+'</b>（'+W10.bits(S1,4)+'） ／ S₃ = r(α³) = <b>'+lg(S3)+'</b>（'+W10.bits(S3,4)+'） ／ 復号器の判断: '+kind+'</div>';
      if(lam){
        var ls=["1"];for(var k2=1;k2<lam.length;k2++)if(lam[k2])ls.push((lam[k2]===1?"":lg(lam[k2]))+(k2===1?"x":"x²"));
        h+='<div>Λ(x) = <b>'+ls.join(" + ")+'</b></div>';
        if(lam.length>1){
          h+='<div style="margin-top:.35rem;color:var(--muted)">チェン探索: Λ(α⁻ⁱ)</div><div style="white-space:nowrap;overflow-x:auto">';
          for(var i3=0;i3<15;i3++){var z=vals[i3]===0;
            h+='<span style="display:inline-block;text-align:center;margin:0 2px;padding:.05rem .15rem;border-radius:4px;'+(z?'background:var(--signal-soft);color:var(--signal);font-weight:700':'')+'"><span style="font-size:.7rem;color:var(--faint)">'+i3+'</span><br>'+W10.bits(vals[i3],4)+'</span>';}
          h+='</div>';
        }
      }
      out.innerHTML=h;
      var same=okRoots&&fixed.join("")===c.join("");
      var msg;
      if(nerr===0)msg='<span class="ok">誤り無し → シンドロームはすべて 0</span>';
      else if(!lam)msg='<span class="warn">訂正できないことが分かる（検出のみ）</span>';
      else if(!okRoots)msg='<span class="warn">Λ の根が '+roots.length+' 個しか見つからない → 訂正できないことが分かる（検出のみ）</span>';
      else if(same)msg='<span class="ok">位置 '+roots.slice().sort(function(a,b){return b-a;}).join(", ")+' を反転して、送った符号語に戻った</span>';
      else msg='<span class="warn">位置 '+roots.join(", ")+' を反転したが、送ったものとは別の符号語になった（誤訂正）</span>';
      rd.innerHTML='誤りの数 <b>'+nerr+'</b> ／ '+msg+(nerr>2?' ／ 訂正能力 t = 2 を超えている':'');
    }
    iu.addEventListener("input",run);[s1,s2,s3].forEach(function(s){s.input.addEventListener("input",run);});reg(null,run);run();
  };

  /* ============ 11. リード・ソロモン符号（共通の計算） ============ */
  /* 他の章のファイルと同じ関数の中に入るので、この章の部品はすべて RS11 の中に置く */
  var RS11=(function(){
    var SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
    function sup(k){return String(k).split("").map(function(d){return SUP[+d];}).join("");}
    function GF(m,poly){
      var n=(1<<m)-1,exp=[],log={},x=1;
      for(var i=0;i<n;i++){exp.push(x);log[x]=i;x<<=1;if(x>>m)x^=poly;}
      function mul(a,b){return (a&&b)?exp[(log[a]+log[b])%n]:0;}
      function div(a,b){return a?exp[((log[a]-log[b])%n+n)%n]:0;}
      function A(k){return exp[((k%n)+n)%n];}
      function name(v){if(!v)return "0";var k=log[v];return k===0?"1":(k===1?"α":"α"+sup(k));}
      function bits(v){var s=v.toString(2);while(s.length<m)s="0"+s;return s;}
      function pmul(P,Q){var R=[];for(var i=0;i<P.length+Q.length-1;i++)R.push(0);
        for(i=0;i<P.length;i++)for(var j=0;j<Q.length;j++)R[i+j]^=mul(P[i],Q[j]);return R;}
      function peval(P,v){var s=0;for(var i=P.length-1;i>=0;i--)s=mul(s,v)^P[i];return s;}
      function term(c,i){var cs=name(c);if(i===0)return cs;var xs=i===1?"x":"x"+sup(i);return cs==="1"?xs:cs+xs;}
      function pasc(P){var t=[];for(var i=0;i<P.length;i++)if(P[i])t.push(term(P[i],i));return t.length?t.join(" + "):"0";}
      function pdesc(P){var t=[];for(var i=P.length-1;i>=0;i--)if(P[i])t.push(term(P[i],i));return t.length?t.join(" + "):"0";}
      var els=[0];for(i=0;i<n;i++)els.push(exp[i]);
      return {m:m,n:n,exp:exp,log:log,mul:mul,div:div,A:A,name:name,bits:bits,pmul:pmul,peval:peval,pasc:pasc,pdesc:pdesc,els:els};
    }
    function trim(P){P=P.slice();while(P.length>1&&!P[P.length-1])P.pop();return P;}
    function gen(F,nk,b){var g=[1];for(var j=b;j<b+nk;j++)g=F.pmul(g,[F.A(j),1]);return g;}
    /* 組織符号化。u は昇冪。各段の記録も返す */
    function encode(F,u,g){
      var nk=g.length-1,k=u.length,n=nk+k,A=[],steps=[],i,j;
      for(i=0;i<n;i++)A.push(i<nk?0:u[i-nk]);
      var start=A.slice();
      for(var top=n-1;top>=nk;top--){
        var q=A[top],sub={};
        for(j=0;j<=nk;j++)sub[top-nk+j]=F.mul(q,g[j]);
        for(var e in sub)A[e]^=sub[e];
        steps.push({top:top,q:q,sub:sub,rem:A.slice()});
      }
      var T=start.slice();for(i=0;i<nk;i++)T[i]=A[i];
      return {T:T,R:A.slice(0,nk),steps:steps,start:start};
    }
    function synd(F,r,nk,b){var S=[];for(var j=b;j<b+nk;j++)S.push(F.peval(r,F.A(j)));return S;}
    /* 本文の手順どおりのバーレカンプ・マッシー法（S は S_1 から並べた配列） */
    function bm(F,S){
      var Lam=[1],B=[1],L=0,dB=1,jB=0,rows=[];
      for(var j=1;j<=S.length;j++){
        var d=S[j-1];
        for(var i=1;i<=L;i++)if(i<Lam.length&&j-1-i>=0)d^=F.mul(Lam[i],S[j-1-i]);
        var row={j:j,d:d,Lold:L,grow:false};
        if(d){
          var coef=F.div(d,dB),sh=[];
          for(i=0;i<j-jB;i++)sh.push(0);
          for(i=0;i<B.length;i++)sh.push(F.mul(coef,B[i]));
          var nw=[];for(i=0;i<Math.max(Lam.length,sh.length);i++)nw.push((Lam[i]||0)^(sh[i]||0));
          if(2*L<=j-1){B=Lam.slice();dB=d;jB=j;L=j-L;row.grow=true;}
          Lam=trim(nw);
        }
        row.Lam=Lam.slice();row.L=L;rows.push(row);
      }
      return {Lam:Lam,L:L,rows:rows};
    }
    function roots(F,P){var R=[];for(var i=0;i<F.n;i++)if(F.peval(P,F.A(-i))===0)R.push(i);return R;}
    function deriv(P){var D=[];for(var i=1;i<P.length;i++)D.push(i%2?P[i]:0);return D.length?D:[0];}
    /* フォニー。Y = X^(1-b)·Ω(X⁻¹)/Λ'(X⁻¹)（標数 2 なので符号は不要） */
    function forney(F,S,Lam,locs,nk,b){
      var Om=F.pmul(S,Lam).slice(0,nk),dL=deriv(Lam),vals={},ok=true;
      locs.forEach(function(i){
        var xi=F.A(-i),num=F.peval(Om,xi),den=F.peval(dL,xi);
        if(!den){ok=false;return;}
        var Y=F.div(num,den);if(b===0)Y=F.mul(Y,F.A(i));
        vals[i]={Y:Y,num:num,den:den};
      });
      return {Om:trim(Om),dL:trim(dL),vals:vals,ok:ok};
    }
    /* 誤りだけの復号。status: "none" | "ok" | "fail" */
    function decode(F,r,nk,b){
      var S=synd(F,r,nk,b),res={S:S};
      if(S.every(function(s){return !s;})){res.status="none";res.c=r.slice();return res;}
      var B=bm(F,S);res.bm=B;res.Lam=B.Lam;res.L=B.L;
      var loc=roots(F,B.Lam);res.locs=loc;
      if(B.L>nk/2||loc.length!==B.L){res.status="fail";return res;}
      var fo=forney(F,S,B.Lam,loc,nk,b);res.fo=fo;
      if(!fo.ok){res.status="fail";return res;}
      var c=r.slice();loc.forEach(function(i){c[i]^=fo.vals[i].Y;});
      res.c=c;res.status="ok";return res;
    }
    /* 誤りと消失の復号（b = 1）。eras は消失の位置 */
    function decodeMixed(F,r,eras,nk){
      var res={},rho=eras.length,i;
      var S=synd(F,r,nk,1);res.S=S;
      var Gam=[1];eras.forEach(function(p){Gam=F.pmul(Gam,[1,F.A(p)]);});res.Gam=Gam;
      if(rho>nk){res.status="fail";res.why="消失が n − k を超えている";return res;}
      var Tm=F.pmul(S,Gam).slice(0,nk);res.Tm=Tm;
      var seq=Tm.slice(rho);res.seq=seq;
      var B=bm(F,seq);res.Lam=B.Lam;res.L=B.L;
      var loc=B.L?roots(F,B.Lam):[];res.locs=loc;
      if(2*B.L>nk-rho){res.status="fail";res.why="誤りを決める式が足りない（2L > 2t − ρ）";return res;}
      if(loc.length!==B.L){res.status="fail";res.why="見つかった根の個数が L と合わない";return res;}
      if(loc.some(function(p){return eras.indexOf(p)>=0;})){res.status="fail";res.why="誤りの位置が消失の位置と重なる";return res;}
      var Psi=F.pmul(B.Lam,Gam);res.Psi=Psi;
      var all=eras.concat(loc);
      if(S.every(function(s){return !s;})&&!loc.length){res.status="ok";res.c=r.slice();res.vals={};eras.forEach(function(p){res.vals[p]={Y:0};});return res;}
      var fo=forney(F,S,Psi,all,nk,1);res.fo=fo;res.vals=fo.vals;
      if(!fo.ok){res.status="fail";res.why="Ψ′ が 0 になる";return res;}
      var c=r.slice();all.forEach(function(p){c[p]^=fo.vals[p].Y;});
      res.c=c;res.status="ok";return res;
    }
    /* ---- 表示の部品 ---- */
    var STY={
      info:["var(--blue)","color-mix(in srgb,var(--blue) 14%,transparent)","var(--ink)"],
      check:["var(--signal)","var(--signal-soft)","var(--ink)"],
      err:["var(--alias)","var(--alias-soft)","var(--alias)"],
      hit:["var(--alias)","var(--alias-soft)","var(--ink)"],
      zero:["var(--line)","var(--panel)","var(--faint)"],
      plain:["var(--line)","var(--panel)","var(--ink)"],
      erase:["var(--faint)","var(--screen)","var(--muted)"]
    };
    function cell(F,v,st,showBits){
      var s=STY[st]||STY.plain,dash=st==="erase"?"dashed":"solid";
      var main=(v===null||v===undefined)?"?":F.name(v);
      return '<div style="display:inline-block;min-width:3.0em;padding:.12em .25em;border:1.5px '+dash+' '+s[0]+';border-radius:6px;background:'+s[1]+';text-align:center;line-height:1.25">'+
        '<div style="font-weight:700;color:'+s[2]+'">'+main+'</div>'+
        (showBits?'<div style="font-size:.72em;color:var(--muted)">'+((v===null||v===undefined)?"???".slice(0,F.m):F.bits(v))+'</div>':'')+'</div>';
    }
    var TB="width:auto;border-collapse:separate;border-spacing:3px 3px;font-size:inherit;margin:0",
        TB2="width:auto;border-collapse:collapse;font-size:inherit;margin:0",
        CL="border:0;background:none;font-family:inherit;letter-spacing:0;font-size:inherit;";
    function th(t,c){return '<th style="'+CL+'padding:.1rem .5rem .1rem 0;text-align:right;white-space:nowrap;color:'+(c||"var(--muted)")+';font-weight:600">'+t+'</th>';}
    function td(h){return '<td style="'+CL+'padding:.1rem .1rem;text-align:center;vertical-align:middle">'+h+'</td>';}
    function hd(t){return '<div style="margin:.7rem 0 .3rem;color:var(--muted);font-weight:600">'+t+'</div>';}
    function optEls(F,sel){return F.els.map(function(v){return '<option value="'+v+'"'+(v===sel?" selected":"")+'>'+F.name(v)+'</option>';}).join("");}
    return {GF:GF,gen:gen,encode:encode,synd:synd,bm:bm,roots:roots,deriv:deriv,forney:forney,decode:decode,decodeMixed:decodeMixed,
      cell:cell,th:th,td:td,hd:hd,optEls:optEls,sup:sup,TB:TB,TB2:TB2,CL:CL,F8:GF(3,11),F16:GF(4,19),F256:GF(8,0x11D)};
  })();

  /* ============ 11. rsenc — 割り算で検査シンボルを作る ============ */
  REG.rsenc=function(el){
    head(el,"RS Encode","RS(7,3) の符号化 — GF(2³) 係数の割り算");
    var F=RS11.F8,g=RS11.gen(F,4,1);
    var row=ctrls(el);
    var su2=select(row,"u₂（x⁶ の位置）",F.els.map(function(v){return F.name(v)+"（"+F.bits(v)+"）";}));
    var su1=select(row,"u₁（x⁵ の位置）",F.els.map(function(v){return F.name(v)+"（"+F.bits(v)+"）";}));
    var su0=select(row,"u₀（x⁴ の位置）",F.els.map(function(v){return F.name(v)+"（"+F.bits(v)+"）";}));
    function idx(v){return F.els.indexOf(v);}
    su2.value=idx(F.A(1));su1.value=idx(F.A(5));su0.value=idx(F.A(2));
    var row2=ctrls(el),cb=checkbox(row2,"ビット表現も表示する",true);
    var out=panel(el),ro=readout(el);
    function run(){
      var u=[F.els[+su0.value],F.els[+su1.value],F.els[+su2.value]],bits=cb.checked;
      var E=RS11.encode(F,u,g),C=RS11.cell,h='';
      h+='<div style="color:var(--muted);margin-bottom:.35rem">g(x) = '+F.pdesc(g)+'。各段で「いまの最高次の係数」× g を引く（XOR）。</div>';
      h+='<table style="'+RS11.TB+'"><tr>'+RS11.th("");
      for(var e=6;e>=0;e--)h+='<th style="'+RS11.CL+'color:var(--muted);font-weight:600;text-align:center">'+(e===0?"1":(e===1?"x":"x"+RS11.sup(e)))+'</th>';
      h+='</tr><tr>'+RS11.th("x⁴u(x)","var(--ink)");
      for(e=6;e>=0;e--)h+=RS11.td(C(F,E.start[e],e>=4?"info":"plain",bits));
      h+='</tr>';
      E.steps.forEach(function(s,k){
        var last=k===E.steps.length-1;
        h+='<tr>'+RS11.th("− "+F.name(s.q)+" × g","var(--alias)");
        for(var e2=6;e2>=0;e2--)h+=RS11.td(e2 in s.sub?C(F,s.sub[e2],"hit",bits):"");
        h+='</tr><tr>'+RS11.th(last?"余り R(x)":"",last?"var(--signal)":"");
        for(e2=6;e2>=0;e2--){
          var cellh="";
          if(e2<=s.top){cellh=e2===s.top?C(F,0,"zero",bits):C(F,s.rem[e2],last?"check":"plain",bits);}
          h+='<td style="'+RS11.CL+'padding:.1rem .1rem;text-align:center;border-top:1.5px solid '+(e2<=s.top?"var(--ink)":"transparent")+'">'+cellh+'</td>';
        }
        h+='</tr>';
      });
      h+='</table>';
      h+=RS11.hd("送る符号語 T(x)（左が最高次。青が情報、緑が検査）");
      h+='<table style="'+RS11.TB+'"><tr>'+RS11.th("位置");
      for(e=6;e>=0;e--)h+='<td style="'+RS11.CL+'text-align:center;color:var(--muted)">'+e+'</td>';
      h+='</tr><tr>'+RS11.th("T","var(--ink)");
      for(e=6;e>=0;e--)h+=RS11.td(C(F,E.T[e],e>=4?"info":"check",bits));
      h+='</tr></table>';
      var chk=[1,2,3,4].map(function(j){return F.peval(E.T,F.A(j));});
      h+=RS11.hd("検算: g の根を代入する");
      h+='<div>'+chk.map(function(v,j){return 'T(α'+(j?RS11.sup(j+1):"")+') = <b style="color:'+(v?"var(--alias)":"var(--signal)")+'">'+F.name(v)+'</b>';}).join("　")+'</div>';
      out.innerHTML=h;
      var q=E.steps.map(function(s){return s.q;});
      ro.innerHTML='商 q(x) = <b>'+F.pdesc([q[2],q[1],q[0]])+'</b> ／ 余り R(x) = <b class="ok">'+F.pdesc(E.R)+'</b> ／ '+
        (chk.every(function(v){return !v;})?'<span class="ok">T(α) = T(α²) = T(α³) = T(α⁴) = 0 → 符号語</span>':'<span class="warn">0 にならない</span>');
    }
    [su2,su1,su0].forEach(function(s){s.addEventListener("change",run);});cb.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 11. rsdec — 誤りを入れて 5 段で直す ============ */
  REG.rsdec=function(el){
    head(el,"RS Decode","シンドローム → BM 法 → チェン探索 → フォニー → 訂正");
    var codes=[{F:RS11.F8,n:7,k:3,lab:"RS(7,3)（GF(2³)、t = 2）"},{F:RS11.F16,n:15,k:11,lab:"RS(15,11)（GF(2⁴)、t = 2）"},
               {F:RS11.F16,n:15,k:9,lab:"RS(15,9)（GF(2⁴)、t = 3）"}];
    var row=ctrls(el);
    var sc=select(row,"符号",codes.map(function(c){return c.lab;}));
    var cb=checkbox(row,"ビット表現も表示する",false);
    var row2=ctrls(el);
    var bEx=button(row2,"本文の例に戻す"),bClr=button(row2,"誤りをすべて消す");
    var out=panel(el),ro=readout(el);
    var err={};
    function setup(){
      var cd=codes[+sc.value],F=cd.F,nk=cd.n-cd.k,u=[];
      if(cd.n===7)u=[F.A(2),F.A(5),F.A(1)];
      else for(var i=0;i<cd.k;i++)u.push(F.A(3*i+1));
      cd.g=RS11.gen(F,nk,1);cd.T=RS11.encode(F,u,cd.g).T;
      return cd;
    }
    function example(){sc.value=0;err={1:RS11.F8.A(5),5:RS11.F8.A(4)};run();}
    function run(){
      var cd=setup(),F=cd.F,n=cd.n,nk=n-cd.k,t=nk/2,bits=cb.checked,C=RS11.cell,i,p;
      var e=[];for(i=0;i<n;i++)e.push(err[i]&&err[i]<=F.n?err[i]:0);
      var r=cd.T.map(function(v,i){return v^e[i];});
      var nerr=e.filter(function(v){return v;}).length;
      var D=RS11.decode(F,r,nk,1),h='';
      h+='<div style="color:var(--muted);margin-bottom:.3rem">誤り e の欄で、各位置に足す値を選ぶ（0 は誤りなし）。左が最高次。</div>';
      h+='<table style="'+RS11.TB+'"><tr>'+RS11.th("位置");
      for(p=n-1;p>=0;p--)h+='<td style="'+RS11.CL+'text-align:center;color:var(--muted)">'+p+'</td>';
      h+='</tr><tr>'+RS11.th("送信 c","var(--blue)");
      for(p=n-1;p>=0;p--)h+=RS11.td(C(F,cd.T[p],p>=nk?"info":"check",bits));
      h+='</tr><tr>'+RS11.th("誤り e","var(--alias)");
      for(p=n-1;p>=0;p--)h+=RS11.td('<select data-p="'+p+'" style="font-family:var(--mono);font-size:.78rem;padding:.15rem;border:1px solid '+(e[p]?"var(--alias)":"var(--line)")+';border-radius:6px;background:'+(e[p]?"var(--alias-soft)":"var(--screen)")+';color:var(--ink)">'+RS11.optEls(F,e[p])+'</select>');
      h+='</tr><tr>'+RS11.th("受信 r","var(--ink)");
      for(p=n-1;p>=0;p--)h+=RS11.td(C(F,r[p],e[p]?"hit":"plain",bits));
      h+='</tr></table>';
      h+=RS11.hd("① シンドローム Sⱼ = r(αʲ)（j = 1, …, "+nk+"）");
      h+='<div>'+D.S.map(function(s,j){return 'S'+"₁₂₃₄₅₆₇₈₉"[j]+' = <b>'+F.name(s)+'</b>';}).join("　")+(D.status==="none"?'　<span style="color:var(--signal);font-weight:700">すべて 0 → 誤りなし</span>':'')+'</div>';
      if(D.status!=="none"){
        h+=RS11.hd("② バーレカンプ・マッシー法（緑の行で長さ L が増える）");
        h+='<table style="'+RS11.TB2+'"><tr>'+["j","ずれ Δ","Λ(x)","L"].map(function(s){return '<th style="'+RS11.CL+'padding:.1rem .7rem;color:var(--muted);text-align:left;font-weight:600;border-bottom:1px solid var(--line)">'+s+'</th>';}).join("")+'</tr>';
        D.bm.rows.forEach(function(rw){
          var tds='style="'+RS11.CL+'padding:.1rem .7rem;'+(rw.grow?"background:var(--signal-soft)":"")+'"';
          h+='<tr><td '+tds+'>'+rw.j+'</td><td '+tds+'>'+F.name(rw.d)+'</td><td '+tds+'>'+F.pasc(rw.Lam)+'</td><td '+tds+'>'+rw.L+(rw.grow?'（増やす）':'')+'</td></tr>';
        });
        h+='</table>';
        h+=RS11.hd(D.status==="ok"?"③ チェン探索 Λ(α⁻ⁱ)、④ フォニー（Ω(x) = "+F.pasc(D.fo.Om)+"、Λ′(x) = "+F.pasc(D.fo.dL)+"）、⑤ 訂正":
          "③ チェン探索 Λ(α⁻ⁱ)（"+(D.L>t?"L が t を超えている":"根の個数が L と合わない")+"ので、④ と ⑤ は行わない）");
        h+='<table style="'+RS11.TB+'"><tr>'+RS11.th("位置");
        for(p=n-1;p>=0;p--)h+='<td style="'+RS11.CL+'text-align:center;color:var(--muted)">'+p+'</td>';
        h+='</tr><tr>'+RS11.th("③ Λ(α⁻ⁱ)");
        for(p=n-1;p>=0;p--){var lv=F.peval(D.Lam,F.A(-p));h+=RS11.td(C(F,lv,lv?"plain":"err",false));}
        h+='</tr>';
        if(D.status==="ok"){
          h+='<tr>'+RS11.th("④ 誤り値 Y","var(--alias)");
          for(p=n-1;p>=0;p--)h+=RS11.td(D.fo.vals[p]?C(F,D.fo.vals[p].Y,"err",bits):"");
          h+='</tr><tr>'+RS11.th("⑤ 訂正後","var(--blue)");
          for(p=n-1;p>=0;p--){var ok=D.c[p]===cd.T[p];h+=RS11.td(C(F,D.c[p],ok?(p>=nk?"info":"check"):"err",bits));}
          h+='</tr>';
        }
        h+='</table>';
      }
      out.innerHTML=h;
      out.querySelectorAll("select[data-p]").forEach(function(s){s.addEventListener("change",function(){err[+s.getAttribute("data-p")]=+s.value;run();});});
      var msg;
      if(D.status==="none")msg=nerr?'<span class="warn">シンドロームが 0: 誤りが別の符号語になっていて検出できない</span>':'<span class="ok">誤りなし</span>';
      else if(D.status==="fail")msg='<span class="warn">'+(D.L>t?'L = '+D.L+' > t = '+t:'根 '+D.locs.length+' 個 ≠ L = '+D.L)+' → 訂正できない誤りを検出</span>';
      else{var same=D.c.every(function(v,i){return v===cd.T[i];});
        msg=same?'<span class="ok">位置 '+D.locs.slice().sort(function(a,b){return b-a;}).join("、")+' を訂正 → 送信語に戻った</span>':
          '<span class="warn">誤訂正: 別の符号語に「訂正」した（送信語と '+D.c.filter(function(v,i){return v!==cd.T[i];}).length+' か所違う）</span>';}
      ro.innerHTML='誤りの個数 ν = <b>'+nerr+'</b> ／ t = <b>'+t+'</b>'+(nerr>t?' <span class="warn">（t を超えている）</span>':'')+' ／ '+msg;
    }
    sc.addEventListener("change",function(){err={};run();});cb.addEventListener("change",run);
    bEx.addEventListener("click",example);bClr.addEventListener("click",function(){err={};run();});
    err={1:RS11.F8.A(5),5:RS11.F8.A(4)};reg(null,run);run();
  };

  /* ============ 11. rserase — 消失と誤りを混ぜる ============ */
  REG.rserase=function(el){
    head(el,"Erasure","消失 ρ 個と誤り ν 個 — 2ν + ρ ≤ 4 なら直せる");
    var F=RS11.F8,nk=4,g=RS11.gen(F,nk,1),T=RS11.encode(F,[F.A(2),F.A(5),F.A(1)],g).T;
    var row=ctrls(el),cb=checkbox(row,"ビット表現も表示する",false);
    var row2=ctrls(el);
    var bEx=button(row2,"本文の例（位置 3〜6 が消失）"),bMix=button(row2,"誤り 1 個 + 消失 2 個"),bClr=button(row2,"すべて正常に");
    var out=panel(el),ro=readout(el);
    /* 状態: 0 = 正常, -1 = 消失, それ以外 = 足す誤り値 */
    var st={3:-1,4:-1,5:-1,6:-1};
    function opts(v){
      var h='<option value="0"'+(v===0?" selected":"")+'>正常</option><option value="-1"'+(v===-1?" selected":"")+'>消失 ?</option>';
      for(var i=1;i<F.els.length;i++){var e=F.els[i];h+='<option value="'+e+'"'+(v===e?" selected":"")+'>誤り +'+F.name(e)+'</option>';}
      return h;
    }
    function run(){
      var bits=cb.checked,C=RS11.cell,p,eras=[],nerr=0,r=T.slice();
      for(p=0;p<7;p++){var s=st[p]||0;if(s===-1){eras.push(p);r[p]=0;}else if(s>0){r[p]^=s;nerr++;}}
      var rho=eras.length,D=RS11.decodeMixed(F,r,eras,nk),h='';
      h+='<table style="'+RS11.TB+'"><tr>'+RS11.th("位置");
      for(p=6;p>=0;p--)h+='<td style="'+RS11.CL+'text-align:center;color:var(--muted)">'+p+'</td>';
      h+='</tr><tr>'+RS11.th("送信 T","var(--blue)");
      for(p=6;p>=0;p--)h+=RS11.td(C(F,T[p],p>=4?"info":"check",bits));
      h+='</tr><tr>'+RS11.th("状態");
      for(p=6;p>=0;p--){var s2=st[p]||0;h+=RS11.td('<select data-p="'+p+'" style="font-family:var(--mono);font-size:.74rem;padding:.15rem;border:1px solid '+(s2?(s2<0?"var(--faint)":"var(--alias)"):"var(--line)")+';border-radius:6px;background:'+(s2>0?"var(--alias-soft)":"var(--screen)")+';color:var(--ink)">'+opts(s2)+'</select>');}
      h+='</tr><tr>'+RS11.th("受信","var(--ink)");
      for(p=6;p>=0;p--){var s3=st[p]||0;h+=RS11.td(s3===-1?C(F,null,"erase",bits):C(F,r[p],s3>0?"hit":"plain",bits));}
      h+='</tr></table>';
      h+='<div style="margin-top:.4rem;color:var(--muted)">消失（?）は 0 として計算する。</div>';
      h+=RS11.hd("① シンドローム");
      h+='<div>'+D.S.map(function(s,j){return 'S'+"₁₂₃₄"[j]+' = <b>'+F.name(s)+'</b>';}).join("　")+'</div>';
      h+=RS11.hd("② 消失の位置から Γ(x)、残りの式で誤りの Λ(x)");
      h+='<div>Γ(x) = <b>'+F.pasc(D.Gam)+'</b>'+(rho?'（位置 '+eras.slice().sort(function(a,b){return b-a;}).join("、")+'）':'（消失なし）')+'</div>';
      if(D.seq&&D.seq.length)h+='<div>Γ を掛けたシンドロームの後ろ '+D.seq.length+' 個（2t − ρ 本の式）: '+D.seq.map(function(v){return F.name(v);}).join(", ")+' → BM 法で誤りの Λ(x) = <b>'+F.pasc(D.Lam)+'</b>（L = '+D.L+'）</div>';
      else if(D.seq)h+='<div>2t − ρ = 0 なので誤りを探す式は残っていない（Λ(x) = 1）</div>';
      if(D.status==="ok"){
        h+=RS11.hd("③〜⑤ Ψ = ΛΓ = "+F.pasc(D.Psi)+" の根の位置で値を求めて訂正");
        h+='<table style="'+RS11.TB+'"><tr>'+RS11.th("値 Y","var(--alias)");
        for(p=6;p>=0;p--)h+=RS11.td(D.vals[p]?C(F,D.vals[p].Y,"err",bits):"");
        h+='</tr><tr>'+RS11.th("復号結果","var(--blue)");
        for(p=6;p>=0;p--){var ok=D.c[p]===T[p];h+=RS11.td(C(F,D.c[p],ok?(p>=4?"info":"check"):"err",bits));}
        h+='</tr></table>';
      }
      out.innerHTML=h;
      out.querySelectorAll("select[data-p]").forEach(function(s){s.addEventListener("change",function(){st[+s.getAttribute("data-p")]=+s.value;run();});});
      var need=2*nerr+rho,msg;
      if(D.status==="ok"){var same=D.c.every(function(v,i){return v===T[i];});
        msg=same?'<span class="ok">送信語に戻った</span>':'<span class="warn">誤訂正（別の符号語）</span>';}
      else msg='<span class="warn">訂正できない（'+(D.why||"")+'）</span>';
      ro.innerHTML='誤り ν = <b>'+nerr+'</b>、消失 ρ = <b>'+rho+'</b> → 2ν + ρ = <b>'+need+'</b> '+(need<=4?'≤':'>')+' n − k = 4 ／ '+msg;
    }
    cb.addEventListener("change",run);
    bEx.addEventListener("click",function(){st={3:-1,4:-1,5:-1,6:-1};run();});
    bMix.addEventListener("click",function(){st={6:-1,2:-1};st[4]=F.A(3);run();});
    bClr.addEventListener("click",function(){st={};run();});
    reg(null,run);run();
  };

  /* ============ 11. rsburst — バーストとインターリーブ ============ */
  REG.rsburst=function(el){
    head(el,"Burst","RS(255,223)（t = 16）で、バーストが各符号語に何シンボル届くか");
    var row=ctrls(el);
    var sb=slider(row,"バーストの長さ b（ビット）",1,1200,121,1),ss=slider(row,"開始位置（バイト内のビット）",0,7,7,1),sd=slider(row,"インターリーブの深さ D",1,8,1,1);
    var cv=screen(el,236),cc=cctx(cv),ro=readout(el);
    var t=16,names="ABCDEFGH";
    function draw(){
      var b=+sb.input.value,s=+ss.input.value,D=+sd.input.value;
      sb.val.textContent=b;ss.val.textContent=s;sd.val.textContent=D;
      var B=Math.floor((s+b-1)/8)+1,worst=Math.ceil((b-1)/8)+1,hits=[],r;
      for(r=0;r<D;r++)hits.push(0);
      for(var j=0;j<B;j++)hits[j%D]++;
      var mx=Math.max.apply(null,hits);
      var z=cc.fit(),w=z.w,ctx=cc.ctx;ctx.clearRect(0,0,w,z.h);
      var cols=[C("--blue"),C("--signal"),C("--alias"),C("--muted"),C("--blue"),C("--signal"),C("--alias"),C("--muted")];
      /* 上: 送る順のバイト列（先頭から表示できる分だけ） */
      lab(ctx,w>=560?"送る順のバイト（色 = どの符号語のシンボルか、赤枠 = バーストがかかったバイト）":"送る順のバイト（赤枠 = バースト）",10,16,C("--muted"),"left");
      var show=Math.min(Math.max(B+4,24),160),cw=(w-20)/show;
      for(j=0;j<show;j++){
        var x=10+j*cw,hit=j<B;
        ctx.globalAlpha=0.28;ctx.fillStyle=cols[j%D];ctx.fillRect(x,26,Math.max(1,cw-1),22);ctx.globalAlpha=1;
        if(hit){ctx.strokeStyle=C("--alias");ctx.lineWidth=cw>6?2:1;ctx.strokeRect(x+0.5,26.5,Math.max(1,cw-2),21);}
        if(cw>=16)lab(ctx,names[j%D],x+cw/2-0.5,41,C("--ink"),"center");
      }
      /* バーストのビット範囲 */
      var bx0=10+(s/8)*cw,bx1=10+((s+b)/8)*cw;
      ctx.fillStyle=C("--alias");ctx.fillRect(bx0,52,Math.max(1,Math.min(bx1,w-10)-bx0),4);
      lab(ctx,"バースト "+b+" ビット → "+B+" バイト",bx0,70,C("--alias"),"left");
      /* 下: 符号語ごとのシンボル誤り */
      var top=92,bh=Math.min(24,(z.h-top-20)/D-4),scale=(w-150)/Math.max(32,mx+4);
      var xt=110+t*scale;
      for(r=0;r<D;r++){
        var y=top+r*(bh+4),bad=hits[r]>t;
        lab(ctx,"符号語 "+names[r],10,y+bh-6,C("--ink"),"left");
        ctx.fillStyle=bad?C("--alias"):C("--signal");ctx.fillRect(110,y,Math.max(1,hits[r]*scale),bh);
        lab(ctx,hits[r]+" 個",114+hits[r]*scale,y+bh-6,bad?C("--alias"):C("--muted"),"left");
      }
      ctx.strokeStyle=C("--ink");ctx.setLineDash([4,3]);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(xt,top-6);ctx.lineTo(xt,top+D*(bh+4));ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"t = 16",xt+4,top-8,C("--ink"),"left");
      var lim=128*D-7;
      ro.innerHTML='壊れたバイト <b>'+B+'</b> 個（この開始位置。最悪の開始位置なら ⌈(b − 1)/8⌉ + 1 = <b>'+worst+'</b> 個） ／ '+
        '1 つの符号語に最大 <b>'+mx+'</b> 個 = ⌈'+B+'/'+D+'⌉ ／ '+(mx<=t?'<b class="ok">すべて訂正できる</b>':'<span class="warn">t = 16 を超える符号語がある</span>')+
        ' ／ 深さ '+D+' なら、どこで起きても直せるのは b ≤ '+lim+' ビット';
    }
    [sb,ss,sd].forEach(function(o){o.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ============ 11. rsqr — QR コード（バージョン 1-M）の汚れ ============ */
  REG.rsqr=function(el){
    head(el,"QR Code","バージョン 1 の汚れがかかるシンボル数と、レベルごとの訂正");
    var N=21,F=RS11.F256;
    /* モジュールの配置（Nayuki の qrcodegen と同じ手順） */
    var fn=[],cw=[],x,y,i;
    for(y=0;y<N;y++){fn.push([]);cw.push([]);for(x=0;x<N;x++){fn[y].push(null);cw[y].push(-1);}}
    function setf(x,y,k){if(x>=0&&x<N&&y>=0&&y<N)fn[y][x]=k;}
    for(i=0;i<N;i++){setf(6,i,"timing");setf(i,6,"timing");}
    [[3,3],[N-4,3],[3,N-4]].forEach(function(c){for(var dy=-4;dy<=4;dy++)for(var dx=-4;dx<=4;dx++)setf(c[0]+dx,c[1]+dy,Math.max(Math.abs(dx),Math.abs(dy))<=3?"finder":"sep");});
    for(i=0;i<6;i++)setf(8,i,"format");setf(8,7,"format");setf(8,8,"format");setf(7,8,"format");
    for(i=9;i<15;i++)setf(14-i,8,"format");for(i=0;i<8;i++)setf(N-1-i,8,"format");for(i=8;i<15;i++)setf(8,N-15+i,"format");setf(8,N-8,"dark");
    var bit=0;
    for(var right=N-1;right>=1;right-=2){if(right===6)right=5;
      for(var vert=0;vert<N;vert++)for(var j=0;j<2;j++){x=right-j;var up=((right+1)&2)===0;y=up?N-1-vert:vert;
        if(fn[y][x]===null&&bit<26*8){cw[y][x]=bit>>3;bit++;}}}
    var DATA=[32,91,11,120,209,114,220,77,67,64,236,17,236,17,236,17];
    var g=RS11.gen(F,10,0),u=DATA.slice().reverse(),T=RS11.encode(F,u,g).T,SYM=T.slice().reverse(); /* SYM[0..25] = D1..D16, E1..E10 */
    var row=ctrls(el);
    var sx=slider(row,"汚れの左端（列）",0,20,8,1),sy=slider(row,"汚れの上端（行）",0,20,9,1);
    var row2=ctrls(el);
    var sw=slider(row2,"汚れの幅",1,21,6,1),sh=slider(row2,"汚れの高さ",1,21,4,1);
    var cv=screen(el,320),cc=cctx(cv),ro=readout(el);
    var AL="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    function parse(bytes){
      var s="";bytes.forEach(function(b){var t=b.toString(2);while(t.length<8)t="0"+t;s+=t;});
      if(s.slice(0,4)!=="0010")return null;
      var n=parseInt(s.slice(4,13),2),p=13,out="";
      if(n>25)return null;
      for(var k=0;k+1<n;k+=2){var v=parseInt(s.slice(p,p+11),2);p+=11;if(v>=45*45)return null;out+=AL[Math.floor(v/45)]+AL[v%45];}
      if(n%2){var v2=parseInt(s.slice(p,p+6),2);if(v2>=45)return null;out+=AL[v2];}
      return out;
    }
    function draw(){
      var X0=+sx.input.value,Y0=+sy.input.value,Wd=+sw.input.value,Ht=+sh.input.value;
      sx.val.textContent=X0;sy.val.textContent=Y0;sw.val.textContent=Wd;sh.val.textContent=Ht;
      var hit={},fhit={finder:0,timing:0,format1:0,format2:0};
      for(y=Y0;y<Math.min(N,Y0+Ht);y++)for(x=X0;x<Math.min(N,X0+Wd);x++){
        if(cw[y][x]>=0)hit[cw[y][x]]=1;
        else{var k=fn[y][x];if(k==="finder")fhit.finder++;else if(k==="timing")fhit.timing++;
          else if(k==="format"){if((x===8&&y<=8)||(y===8&&x<=8))fhit.format1++;else fhit.format2++;}}}
      var hs=Object.keys(hit).map(Number),nd=hs.filter(function(v){return v<16;}).length,nh=hs.length;
      var z=cc.fit(),w=z.w,H=z.h,ctx=cc.ctx;ctx.clearRect(0,0,w,H);
      var wide=w>=520,m=Math.floor(Math.min((H-20)/N,(wide?w-230:w-20)/N)),ox=wide?14:Math.round((w-N*m)/2),oy=10;
      for(y=0;y<N;y++)for(x=0;x<N;x++){
        var k2=fn[y][x],X=ox+x*m,Y=oy+y*m,fill=null,soft=null;
        if(k2==="finder"){var cxx=x<10?3:N-4,cyy=y<10?3:N-4,d=Math.max(Math.abs(x-cxx),Math.abs(y-cyy));fill=(d===0||d===1||d===3)?C("--ink"):C("--panel");}
        else if(k2==="sep")fill=C("--panel");
        else if(k2==="timing")fill=((x+y)%2===0)?C("--ink"):C("--panel");
        else if(k2==="format"||k2==="dark")fill=C("--faint");
        else{var v=cw[y][x];if(hit[v])fill=C("--alias-soft");else if(v<16)soft=C("--blue");else fill=C("--signal-soft");}
        ctx.fillStyle=C("--panel");ctx.fillRect(X,Y,m,m);
        if(soft){ctx.globalAlpha=0.18;ctx.fillStyle=soft;ctx.fillRect(X,Y,m,m);ctx.globalAlpha=1;}
        else{ctx.fillStyle=fill;ctx.fillRect(X,Y,m,m);}
        ctx.strokeStyle=C("--line");ctx.lineWidth=0.5;ctx.strokeRect(X+0.25,Y+0.25,m-0.5,m-0.5);
      }
      /* シンボルの境界（隣と番号が違う辺に線） */
      ctx.lineWidth=1.6;
      for(y=0;y<N;y++)for(x=0;x<N;x++){var v2=cw[y][x];if(v2<0)continue;
        ctx.strokeStyle=hit[v2]?C("--alias"):(v2<16?C("--blue"):C("--signal"));var X2=ox+x*m,Y2=oy+y*m;ctx.beginPath();
        if(y===0||cw[y-1][x]!==v2){ctx.moveTo(X2,Y2);ctx.lineTo(X2+m,Y2);}
        if(y===N-1||cw[y+1][x]!==v2){ctx.moveTo(X2,Y2+m);ctx.lineTo(X2+m,Y2+m);}
        if(x===0||cw[y][x-1]!==v2){ctx.moveTo(X2,Y2);ctx.lineTo(X2,Y2+m);}
        if(x===N-1||cw[y][x+1]!==v2){ctx.moveTo(X2+m,Y2);ctx.lineTo(X2+m,Y2+m);}
        ctx.stroke();}
      /* 汚れ */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=2.4;ctx.setLineDash([6,4]);
      ctx.strokeRect(ox+X0*m,oy+Y0*m,Math.min(Wd,N-X0)*m,Math.min(Ht,N-Y0)*m);ctx.setLineDash([]);
      /* 凡例（幅があるときだけ） */
      if(wide){var lx=ox+N*m+20,items=[[C("--blue"),"情報シンボル D1〜D16",1],[C("--signal"),"検査シンボル E1〜E10",0],[C("--alias"),"汚れがかかったシンボル",0]];
        items.forEach(function(it,q){var yy=oy+16+q*24;ctx.strokeStyle=it[0];ctx.lineWidth=1.6;ctx.strokeRect(lx,yy-11,14,14);lab(ctx,it[1],lx+22,yy,C("--ink"),"left");});
        lab(ctx,"汚れがかかった: "+nh+" 個",lx,oy+108,C("--ink"),"left");
        lab(ctx,"（情報 "+nd+"・検査 "+(nh-nd)+"）",lx,oy+126,C("--muted"),"left");}
      var levels=[["L",7,3],["M",10,5],["Q",13,6],["H",17,8]];
      var warn=fhit.finder?"位置検出パターンが隠れている（RS 符号では守られない部分で、隠すと読み取りに失敗しやすい）":
        (fhit.format1>3&&fhit.format2>3?"形式情報が 2 か所とも 4 モジュール以上隠れている（BCH(15,5) で直せるのは 3 ビットまで）":"");
      /* レベル M で実際に復号: 汚れのかかったシンボルを別の値に置き換える */
      var rcv=SYM.slice();hs.forEach(function(v){rcv[v]^=0xA5;});
      var r=rcv.slice().reverse(),D=RS11.decode(F,r,10,0),res;
      if(D.status==="fail")res='<span class="warn">訂正できない誤りを検出</span>';
      else{var same=D.c.every(function(vv,ii){return vv===T[ii];}),txt=parse(D.c.slice().reverse().slice(0,16));
        res=same?'<b class="ok">復号成功 → "'+txt+'"</b>':'<span class="warn">誤訂正（別の符号語を出力）</span>';}
      ro.innerHTML='汚れがかかったシンボル <b>'+nh+'</b> 個（情報 '+nd+'・検査 '+(nh-nd)+'。すべて誤りとみなす） ／ '+
        levels.map(function(L){var ok=nh<=L[2];return L[0]+'（t = '+L[2]+'）'+(ok?'<b class="ok">○</b>':'<span class="warn">×</span>');}).join(" ")+
        '<br>"HELLO WORLD"（レベル M、RS(26,16)）を実際に復号: '+res+(warn?'<br><span class="warn">注意: '+warn+'</span>':'');
    }
    [sx,sy,sw,sh].forEach(function(o){o.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ============ 12 章で共通に使う英文と道具 ============ */
  var C12TEXT=("THE ART OF SECRET WRITING IS VERY OLD. JULIUS CAESAR SHIFTED EACH LETTER OF HIS MESSAGES BY THREE "+
    "PLACES IN THE ALPHABET, AND FOR CENTURIES SIMILAR METHODS WERE THOUGHT TO BE SAFE. THE WEAKNESS OF "+
    "THESE METHODS IS THAT EACH LETTER OF THE PLAINTEXT IS ALWAYS REPLACED BY THE SAME LETTER OF THE "+
    "CIPHERTEXT. IN ENGLISH THE LETTER E APPEARS MORE OFTEN THAN ANY OTHER LETTER, FOLLOWED BY T AND A, "+
    "SO THE MOST COMMON LETTER IN THE CIPHERTEXT IS PROBABLY THE IMAGE OF E. SCHOLARS IN BAGHDAD "+
    "DESCRIBED THIS METHOD MORE THAN A THOUSAND YEARS AGO, AND IT STILL WORKS AGAINST ANY CIPHER THAT "+
    "KEEPS THE STATISTICS OF THE LANGUAGE. A GOOD CIPHER MUST HIDE THESE STATISTICS COMPLETELY, SO THAT "+
    "THE CIPHERTEXT LOOKS LIKE A RANDOM STRING OF LETTERS TO ANYONE WHO DOES NOT KNOW THE KEY.").replace(/[^A-Z]/g,"");
  var C12AL="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  /* 英文の平均的な文字の出現率（%）。A〜Z の順 */
  var C12ENG=[8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07];
  function c12count(s){var f=[];for(var i=0;i<26;i++)f.push(0);for(var j=0;j<s.length;j++){var c=s.charCodeAt(j)-65;if(c>=0&&c<26)f[c]++;}return f;}
  function c12gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
  /* 文字ごとのずらし量を、英文の平均頻度との重なりが最大になるように選ぶ */
  function c12bestShift(s){var f=c12count(s),best=0,bs=-1;
    for(var k=0;k<26;k++){var sc=0;for(var i=0;i<26;i++)sc+=f[(i+k)%26]*C12ENG[i];if(sc>bs){bs=sc;best=k;}}return best;}
  /* 正解と比べて色を付けた文字列（HTML） */
  function c12mark(got,truth,n){var h="";for(var i=0;i<Math.min(n,got.length);i++){
      h+=got[i]===truth[i]?'<span style="color:var(--signal)">'+got[i]+'</span>':'<span style="color:var(--alias);opacity:.75">'+got[i]+'</span>';}
    return h+(got.length>n?'<span style="color:var(--faint)">…</span>':"");}

  /* ============ 12. keyspace — 鍵のビット数と全数探索の時間 ============ */
  REG.keyspace=function(el){
    head(el,"Brute Force","鍵のビット数と、全数探索にかかる平均の時間");
    var row=ctrls(el);
    var sb=slider(row,"鍵のビット数",8,256,56,8), ss=slider(row,"1 秒に試せる鍵の数（10 の何乗か）",3,18,12,1);
    var cv=screen(el,190),cc=cctx(cv), ro=readout(el);
    var YEAR=365.25*24*3600, L2=Math.log10(2);
    var refs=[["1 秒",0],["1 年",Math.log10(YEAR)],["宇宙の年齢（約 138 億年）",Math.log10(1.38e10*YEAR)]];
    function sci(lg,unit){var e=Math.floor(lg),m=Math.pow(10,lg-e);if(m>=9.95){m=1;e++;}
      return f(m,1)+" × 10<sup>"+e+"</sup> "+unit;}
    function human(lg){ // lg = log10(秒)
      var s=Math.pow(10,lg);
      if(lg<-3)return "1 ミリ秒未満";
      if(s<1)return f(s*1000,0)+" ミリ秒";
      if(s<60)return f(s,1)+" 秒";
      if(s<3600)return f(s/60,1)+" 分";
      if(s<86400)return f(s/3600,1)+" 時間";
      if(s<YEAR)return f(s/86400,1)+" 日";
      var y=lg-Math.log10(YEAR);
      if(y<4)return f(Math.pow(10,y),1)+" 年";
      return sci(y,"年");}
    function draw(){
      var b=+sb.input.value,sp=+ss.input.value; sb.val.textContent=b+" ビット"; ss.val.textContent="10^"+sp;
      var lg=(b-1)*L2-sp;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=-6,x1=78,pl=16,pr=16,X=function(v){return pl+(Math.max(x0,Math.min(x1,v))-x0)/(x1-x0)*(w-pl-pr);};
      var yb=96;
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(pl,yb+20);ctx.lineTo(w-pr,yb+20);ctx.stroke();
      refs.forEach(function(r,i){var x=X(r[1]);ctx.strokeStyle=C("--faint");ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,18+i*14);ctx.lineTo(x,yb+20);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,r[0],x+4,26+i*14,C("--muted"),"left");});
      for(var t=0;t<=70;t+=10){var xt=X(t);ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(xt,yb+20);ctx.lineTo(xt,yb+25);ctx.stroke();
        lab(ctx,"10^"+t,xt,yb+37,C("--faint"),"center");}
      lab(ctx,"秒（対数目盛）",w-pr,yb+52,C("--faint"),"right");
      var col=lg<Math.log10(YEAR)?C("--alias"):(lg<Math.log10(1.38e10*YEAR)?C("--blue"):C("--signal"));
      ctx.fillStyle=col;ctx.globalAlpha=.85;rrect(ctx,X(x0),yb-8,Math.max(3,X(lg)-X(x0)),18,4);ctx.fill();ctx.globalAlpha=1;
      var tl="平均 "+human(lg).replace(/<\/?sup>/g,"").replace(/ × 10/," × 10^"),tx=X(lg)+8;
      ctx.font="11px "+C("--mono");var tw=ctx.measureText(tl).width;if(tx+tw>w-pr)tx=Math.max(pl,X(lg)-tw-8);
      ctx.fillStyle=C("--screen");ctx.fillRect(tx-3,yb-6,tw+6,16);lab(ctx,tl,tx,yb+6,C("--ink"),"left");
      [[56,"DES"],[128,"AES-128"],[256,"AES-256"]].forEach(function(q,i){var x=X((q[0]-1)*L2-sp);
        ctx.fillStyle=C("--muted");ctx.beginPath();ctx.moveTo(x,yb+60);ctx.lineTo(x-5,yb+70);ctx.lineTo(x+5,yb+70);ctx.closePath();ctx.fill();
        lab(ctx,q[1],x,yb+84,C("--muted"),"center");});
      var nk=b*L2;
      ro.innerHTML='鍵の数 2<sup>'+b+'</sup> ≈ '+sci(nk,"")+'／ 平均の試行回数 2<sup>'+(b-1)+'</sup> ／ 平均の時間 <b>'+human(lg)+'</b>'+
        (lg<Math.log10(YEAR)?' ／ <span class="warn">現実的な時間で破れる</span>':(lg>Math.log10(1.38e10*YEAR)?' ／ <b class="ok">宇宙の年齢より長い</b>':''));
    }
    sb.input.addEventListener("input",draw);ss.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 12. affine26 — アフィン暗号の対応表 ============ */
  REG.affine26=function(el){
    head(el,"Affine","アフィン暗号 C = (aP + b) mod 26 の対応");
    var row=ctrls(el);
    var sa=slider(row,"a",0,25,7,1), sb=slider(row,"b",0,25,3,1);
    var row2=ctrls(el); var ti=textin(row2,"平文（A〜Z）","HELLOWORLD");
    var cv=screen(el,150),cc=cctx(cv), out=panel(el), ro=readout(el);
    function run(){
      var a=+sa.input.value,b=+sb.input.value; sa.val.textContent=a; sb.val.textContent=b;
      var img=[],cnt=[],i;for(i=0;i<26;i++)cnt.push(0);
      for(i=0;i<26;i++){img.push((a*i+b)%26);cnt[img[i]]++;}
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var pl=34,cw=(w-pl-10)/26,X=function(k){return pl+cw*k+cw/2;},yt=34,yb=h-34;
      lab(ctx,"P",8,yt+4,C("--muted"),"left");lab(ctx,"C",8,yb+4,C("--muted"),"left");
      for(i=0;i<26;i++){var coll=cnt[img[i]]>1;
        ctx.strokeStyle=coll?C("--alias"):C("--signal");ctx.globalAlpha=coll?.75:.55;ctx.lineWidth=1.3;
        ctx.beginPath();ctx.moveTo(X(i),yt+8);ctx.lineTo(X(img[i]),yb-14);ctx.stroke();ctx.globalAlpha=1;}
      for(i=0;i<26;i++){
        lab(ctx,C12AL[i],X(i),yt,C("--ink"),"center");
        lab(ctx,C12AL[i],X(i),yb,cnt[i]===0?C("--faint"):(cnt[i]>1?C("--alias"):C("--ink")),"center");
        if(cnt[i]>1)lab(ctx,"×"+cnt[i],X(i),yb+16,C("--alias"),"center");}
      var g=c12gcd(a,26),inv=-1;for(i=1;i<26;i++)if((a*i)%26===1)inv=i;
      var p=ti.value.toUpperCase().replace(/[^A-Z]/g,"");
      var ct=p.split("").map(function(ch){return C12AL[img[ch.charCodeAt(0)-65]];}).join("");
      var h2='<div style="color:var(--muted)">暗号化</div><div style="word-break:break-all">'+esc(p)+' → <b>'+ct+'</b></div>';
      if(inv>0){
        var back=ct.split("").map(function(ch){return C12AL[(((inv*(ch.charCodeAt(0)-65-b))%26)+26)%26];}).join("");
        h2+='<div style="color:var(--muted);margin-top:.4rem">復号（a<sup>−1</sup> = '+inv+' を使って P = '+inv+'(C − '+b+') mod 26）</div><div style="word-break:break-all">'+
          ct+' → <b style="color:var(--signal)">'+back+'</b></div>';
      }else{
        var cands=ct.split("").slice(0,6).map(function(ch){var c=ch.charCodeAt(0)-65,ps=[];
          for(var q=0;q<26;q++)if(img[q]===c)ps.push(C12AL[q]);return ch+' ← {'+ps.join(", ")+'}';});
        h2+='<div style="color:var(--muted);margin-top:.4rem">暗号文の各文字に対応しうる平文の文字（先頭 6 文字）</div><div style="color:var(--alias)">'+cands.join("　")+'</div>';
      }
      out.innerHTML=h2;
      var used=cnt.filter(function(v){return v>0;}).length;
      ro.innerHTML='gcd(a, 26) = <b>'+g+'</b> ／ 暗号文に現れる文字 <b>'+used+'</b> 種類 ／ '+
        (inv>0?'<b class="ok">a<sup>−1</sup> = '+inv+' が存在し、1 対 1 に対応する（復号できる）</b>':
               '<span class="warn">a の逆元が無い。'+(26/used)+' 個ずつの平文の文字が同じ暗号文の文字になり、復号できない</span>');
    }
    sa.input.addEventListener("input",run);sb.input.addEventListener("input",run);ti.addEventListener("input",run);reg(cv,run);
  };

  /* ============ 12. freqattack — 頻度分析 ============ */
  REG.freqattack=function(el){
    head(el,"Frequency Analysis","出現回数から置き換え先を推測する");
    var row=ctrls(el);
    var sel=select(row,"暗号",["シーザー暗号","単一換字式暗号"]);
    var sk=slider(row,"シーザー暗号の鍵 k",0,25,3,1);
    var bt=button(row,"換字表を作り直す");
    var cv=screen(el,262),cc=cctx(cv), out=panel(el), ro=readout(el);
    var perm="CWGNBOFRYDJHSKTZUAMELXQVIP".split("");   // 本文の図と同じ対応表から始める
    var ORDER="ETAOINSHRDLCUMWFGYPBVKJXQZ";
    var pc=c12count(C12TEXT), map=[], CT="", guess="", kEst=0;
    function shuffle(){for(var i=25;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=perm[i];perm[i]=perm[j];perm[j]=t;}}
    function run(){
      var mode=+sel.value,k=+sk.input.value; sk.val.textContent=k;
      sk.input.disabled=mode!==0; sk.input.parentNode.style.opacity=mode===0?1:.45;
      bt.disabled=mode!==1; bt.style.opacity=mode===1?1:.45;
      map=[];for(var i=0;i<26;i++)map.push(mode===0?(i+k)%26:perm[i].charCodeAt(0)-65);
      CT=C12TEXT.split("").map(function(ch){return C12AL[map[ch.charCodeAt(0)-65]];}).join("");
      var cc2=c12count(CT);
      if(mode===0){
        var top=cc2.indexOf(Math.max.apply(null,cc2)); kEst=(top-4+26)%26;
        guess=CT.split("").map(function(ch){return C12AL[(ch.charCodeAt(0)-65-kEst+26)%26];}).join("");
      }else{
        var idx=[];for(var j=0;j<26;j++)idx.push(j);
        idx.sort(function(x,y){return cc2[y]-cc2[x]||x-y;});
        var inv=[];idx.forEach(function(c,r){inv[c]=ORDER[r];});
        guess=CT.split("").map(function(ch){return inv[ch.charCodeAt(0)-65];}).join("");
      }
      var ok=0;for(var q=0;q<guess.length;q++)if(guess[q]===C12TEXT[q])ok++;
      out.innerHTML='<div style="color:var(--muted)">暗号文（先頭）</div><div style="word-break:break-all">'+CT.slice(0,96)+'…</div>'+
        '<div style="color:var(--muted);margin-top:.4rem">'+(mode===0?'最も多い暗号文の文字を E とみなして鍵を推定し、復号した結果':'出現回数の多い順に E, T, A, O, I, N, … を当てはめて戻した結果')+
        '（<span style="color:var(--signal)">正しい文字</span>／<span style="color:var(--alias)">誤った文字</span>）</div><div style="word-break:break-all">'+c12mark(guess,C12TEXT,96)+'</div>';
      if(mode===0){
        var top2=cc2.indexOf(Math.max.apply(null,cc2));
        ro.innerHTML='暗号文で最も多い文字 = <b>'+C12AL[top2]+'</b>（'+cc2[top2]+' 回）→ E（4）の置き換え先とみなすと k = '+top2+' − 4 = <b>'+kEst+'</b>'+
          (kEst===k?' ／ <b class="ok">実際の鍵と一致し、全文が戻る</b>':' ／ <span class="warn">実際の鍵 '+k+' と違う</span>');
      }else{
        ro.innerHTML='頻度の順に当てはめただけで正しく戻った文字: <b>'+ok+'</b> / '+guess.length+'（'+Math.round(100*ok/guess.length)+'%） ／ '+
          '出現回数の多い E, T などから当たる。残りは TH, THE などの文字の組を手がかりに直していく';
      }
      draw();
    }
    function draw(){
      var cc2=c12count(CT);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var pl=12,bw=(w-pl-12)/26,mx=Math.max.apply(null,pc),H=70;
      var hl={4:"--signal",19:"--blue",0:"--alias"};   // E, T, A
      function bars(base,cnts,title,colOf,ty){
        lab(ctx,title,pl,ty,C("--muted"),"left");
        ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(pl,base);ctx.lineTo(w-12,base);ctx.stroke();
        for(var i=0;i<26;i++){var hh=cnts[i]/mx*H,c=colOf(i);
          ctx.fillStyle=c?C(c):C("--faint");ctx.globalAlpha=c?1:.45;ctx.fillRect(pl+i*bw+1.5,base-hh,bw-3,hh);ctx.globalAlpha=1;
          lab(ctx,C12AL[i],pl+i*bw+bw/2,base+12,c?C(c):C("--faint"),"center");}
      }
      bars(96,pc,"平文の出現回数",function(i){return hl[i]||null;},14);
      var back={};for(var p in hl)back[map[+p]]=hl[p];
      bars(222,cc2,"暗号文の出現回数",function(i){return back[i]||null;},252);
      for(var p2 in hl){var i0=+p2,j0=map[i0];
        ctx.strokeStyle=C(hl[p2]);ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(pl+i0*bw+bw/2,112);ctx.lineTo(pl+j0*bw+bw/2,222-cc2[j0]/mx*H-4);ctx.stroke();}
    }
    sel.addEventListener("change",run);sk.input.addEventListener("input",run);
    bt.addEventListener("click",function(){shuffle();run();});
    reg(cv,draw);run();
  };

  /* ============ 12. kasiski — カシスキー・テストと列ごとの頻度分析 ============ */
  REG.kasiski=function(el){
    head(el,"Kasiski","繰り返しの間隔から鍵長を推定し、列ごとに頻度分析する");
    var row=ctrls(el);
    var tk=textin(row,"鍵（A〜Z、12 文字まで）","LEMON");
    var sl=slider(row,"鍵長の候補 L",1,12,5,1);
    var cv=screen(el,164),cc=cctx(cv), out=panel(el), ro=readout(el);
    var CT="",key="",reps=[],dists=[],counts=[],Lhat=1,lastKey=null;
    function analyze(){
      key=tk.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,12); if(!key)key="A";
      CT=C12TEXT.split("").map(function(ch,i){return C12AL[(ch.charCodeAt(0)-65+key.charCodeAt(i%key.length)-65)%26];}).join("");
      var pos={};for(var i=0;i+3<=CT.length;i++){var s=CT.substr(i,3);(pos[s]=pos[s]||[]).push(i);}
      reps=[];dists=[];
      for(var s2 in pos)if(pos[s2].length>1){var v=pos[s2],ds=[];for(var j=1;j<v.length;j++){ds.push(v[j]-v[j-1]);dists.push(v[j]-v[j-1]);}reps.push([s2,v,ds]);}
      reps.sort(function(x,y){return y[1].length-x[1].length||x[1][0]-y[1][0];});
      counts=[];var mx=0;for(var L=0;L<=12;L++){var c=0;if(L>=2)dists.forEach(function(d){if(d%L===0)c++;});counts.push(c);if(c>mx)mx=c;}
      Lhat=1;for(var L2=2;L2<=12;L2++)if(mx>0&&counts[L2]>=0.8*mx)Lhat=L2;
    }
    function run(fromKey){
      if(fromKey||lastKey===null){analyze();if(tk.value!==lastKey){sl.input.value=Lhat;}lastKey=tk.value;}
      var L=+sl.input.value; sl.val.textContent=L;
      var shifts=[],kk="";for(var j=0;j<L;j++){var col="";for(var i=j;i<CT.length;i+=L)col+=CT[i];var sh=c12bestShift(col);shifts.push(sh);kk+=C12AL[sh];}
      var dec=CT.split("").map(function(ch,i){return C12AL[(ch.charCodeAt(0)-65-shifts[i%L]+26)%26];}).join("");
      var ok=dec===C12TEXT;
      var h='<div style="color:var(--muted)">暗号文（先頭）</div><div style="word-break:break-all">'+CT.slice(0,96)+'…</div>';
      h+='<div style="color:var(--muted);margin-top:.4rem">繰り返し現れた 3 文字の列（出現位置 → 間隔）</div><div>'+
        reps.slice(0,6).map(function(r){return '<b>'+r[0]+'</b> '+r[1].join(", ")+' → '+r[2].join(", ");}).join("　／　")+(reps.length>6?' …':'')+'</div>';
      h+='<div style="color:var(--muted);margin-top:.4rem">L = '+L+' として、位置を L で割った余りごとに頻度分析した鍵の文字</div><div>'+
        shifts.map(function(s,j){return '余り '+j+': <b>'+C12AL[s]+'</b>';}).join("　")+'</div>';
      h+='<div style="color:var(--muted);margin-top:.4rem">推定した鍵 '+kk+' で復号した結果（<span style="color:var(--signal)">正しい文字</span>／<span style="color:var(--alias)">誤った文字</span>）</div><div style="word-break:break-all">'+c12mark(dec,C12TEXT,96)+'</div>';
      out.innerHTML=h;
      ro.innerHTML='繰り返し <b>'+reps.length+'</b> 組、間隔 <b>'+dists.length+'</b> 個 ／ 多くの間隔を割り切る最大の候補 = <b>'+Lhat+'</b> ／ L = '+L+' での推定鍵 <b>'+kk+'</b> '+
        (ok?'<b class="ok">全文が正しく戻る</b>':'<span class="warn">正しく戻らない（L が違う）</span>');
      draw();
    }
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var pl=40,pr=12,pb=26,pt=40,bw=(w-pl-pr)/11,mx=Math.max(1,Math.max.apply(null,counts));
      var L=+sl.input.value;
      lab(ctx,"間隔のうち L で割り切れるものの数（全 "+dists.length+" 個）",pl,14,C("--muted"),"left");
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(pl,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();
      for(var Lc=2;Lc<=12;Lc++){var x=pl+(Lc-2)*bw,hh=counts[Lc]/mx*(h-pt-pb);
        ctx.fillStyle=Lc===L?C("--signal"):(Lc===Lhat?C("--blue"):C("--line"));
        ctx.fillRect(x+bw*0.18,h-pb-hh,bw*0.64,hh);
        lab(ctx,String(Lc),x+bw/2,h-pb+14,Lc===L?C("--signal"):C("--muted"),"center");
        lab(ctx,String(counts[Lc]),x+bw/2,h-pb-hh-4,C("--muted"),"center");}
      lab(ctx,"L",pl-14,h-pb+14,C("--muted"),"right");
    }
    tk.addEventListener("input",function(){run(true);});sl.input.addEventListener("input",function(){run(false);});
    reg(cv,draw);run(true);
  };

  /* ============ 12. otp — どの平文の候補にも、それを与える鍵がある ============ */
  REG.otp=function(el){
    head(el,"One-Time Pad","暗号文が同じでも、鍵しだいでどの平文にもなる");
    var P="ATTACK AT DAWN";
    var K=[0x3c,0x91,0x5e,0x07,0xd2,0x68,0xa4,0x1f,0x8b,0x63,0xf0,0x29,0x55,0xc7];
    var Cb=[];for(var i=0;i<P.length;i++)Cb.push(P.charCodeAt(i)^K[i]);
    var row=ctrls(el);
    var ti=textin(row,"平文の候補（"+P.length+" 文字）","RETREAT AT SIX");
    var row2=ctrls(el); var ck=checkbox(row2,"実際に使った平文と鍵も表示する",false);
    var out=panel(el), ro=readout(el);
    function hx(v){return ("0"+v.toString(16)).slice(-2);}
    function cellRow(name,vals,col){return '<tr><th style="padding:.15rem .5rem;text-align:right;color:var(--muted);white-space:nowrap">'+name+'</th>'+
      vals.map(function(v){return '<td style="padding:.15rem .28rem;text-align:center;color:'+(col||"var(--ink)")+'">'+v+'</td>';}).join("")+'</tr>';}
    function run(){
      var q=ti.value;
      var h='<table style="border-collapse:collapse">';
      h+=cellRow("暗号文 C（16 進）",Cb.map(hx));
      if(q.length===P.length){
        var kk=[];for(var i=0;i<P.length;i++)kk.push(Cb[i]^q.charCodeAt(i));
        h+=cellRow("平文の候補 P′",q.split("").map(function(ch){return ch===" "?"␣":esc(ch);}),"var(--blue)");
        h+=cellRow("鍵 K′ = C ⊕ P′",kk.map(function(v){return hx(v&255);}),"var(--alias)");
      }
      if(ck.checked){
        h+=cellRow("実際の平文 P",P.split("").map(function(ch){return ch===" "?"␣":ch;}),"var(--signal)");
        h+=cellRow("実際の鍵 K",K.map(hx),"var(--signal)");
      }
      out.innerHTML=h+'</table>';
      if(q.length!==P.length){ro.innerHTML='<span class="warn">候補は暗号文と同じ '+P.length+' 文字にする（いまは '+q.length+' 文字）</span>';return;}
      ro.innerHTML='鍵が K′ だったとすると、この暗号文は「'+esc(q)+'」から作られたことになる ／ '+
        'K′ も実際の鍵も、どちらも確率 2<sup>−'+(8*P.length)+'</sup> で選ばれる → <b class="ok">暗号文からは区別できない</b>';
    }
    ti.addEventListener("input",run);ck.addEventListener("change",run);run();
  };

  /* ============ 13 章で共通に使う道具 ============ */
  /* 漸化式 s_{k+L} = c1 s_{k+L-1} ⊕ … ⊕ cL s_k の出力 s_0 … s_{n-1}。c = [c1..cL]、init = [s_0..s_{L-1}] */
  function c13seq(c,init,n){var s=init.slice(),L=c.length;
    while(s.length<n){var k=s.length-L,v=0;for(var i=0;i<L;i++)v^=c[i]&s[k+L-1-i];s.push(v);}return s.slice(0,n);}
  /* 特性多項式 x^L + c1 x^{L-1} + … + cL を HTML で */
  function c13poly(c){var L=c.length,t=["x<sup>"+L+"</sup>"];
    for(var i=1;i<=L;i++)if(c[i-1]){var e=L-i;t.push(e===0?"1":(e===1?"x":"x<sup>"+e+"</sup>"));}return t.join(" + ");}
  /* 0/1 の配列で表した多項式（下位から）どうしの剰余 */
  function c13pmod(a,m){a=a.slice();var dm=m.length-1;while(dm>=0&&!m[dm])dm--;
    for(var i=a.length-1;i>=dm;i--)if(a[i])for(var j=0;j<=dm;j++)a[i-dm+j]^=m[j];
    var r=a.slice(0,dm);while(r.length&&!r[r.length-1])r.pop();return r;}
  function c13fromInt(v){var r=[];while(v){r.push(v&1);v>>=1;}return r;}
  /* タップから特性多項式の係数（下位から）を作る: f = x^L + Σ c_i x^{L-i} */
  function c13fcoef(c){var L=c.length,f=[];for(var e=0;e<=L;e++)f.push(e===L?1:c[L-e-1]);return f;}
  /* 既約多項式で割り切れるかを順に調べて因数分解（次数の低い順） */
  function c13factor(f){var fs=[],g=f.slice();
    for(var d=1;2*d<=g.length-1||d===1;d++){
      for(var v=1<<d;v<(1<<(d+1));v++){var q=c13fromInt(v);
        while(g.length-1>=d&&c13pmod(g,q).length===0){fs.push(q);g=c13div(g,q);}}
      if(d>16)break;}
    if(g.length>1)fs.push(g);return fs;}
  function c13div(a,m){a=a.slice();var dm=m.length-1,q=[];for(var t=0;t<=a.length-1-dm;t++)q.push(0);
    for(var i=a.length-1;i>=dm;i--)if(a[i]){q[i-dm]=1;for(var j=0;j<=dm;j++)a[i-dm+j]^=m[j];}
    while(q.length&&!q[q.length-1])q.pop();return q;}
  function c13pstr(p){var t=[];for(var e=p.length-1;e>=0;e--)if(p[e])t.push(e===0?"1":(e===1?"x":"x<sup>"+e+"</sup>"));return t.join("+");}
  /* f を法とする x の位数（f(0) = 1 のとき） */
  function c13order(f){var L=f.length-1,v=[0,1],n=1,lim=1<<(L+1);
    while(n<=lim){var r=c13pmod(v,f);if(r.length===1&&r[0]===1)return n;v=r.slice();v.unshift(0);n++;}return 0;}
  /* 状態（左が新しい順の 0/1 配列）を 1 クロック進める */
  function c13step(c,st){var nb=0;for(var i=0;i<c.length;i++)nb^=c[i]&st[i];return [nb].concat(st.slice(0,st.length-1));}
  function c13period(c,st){var cur=st.slice(),n=0,key=st.join("");do{cur=c13step(c,cur);n++;}while(cur.join("")!==key&&n<=(1<<c.length)+1);return n;}

  /* ============ 13. ksreuse — 鍵ストリームの再利用とクリブ・ドラッギング ============ */
  REG.ksreuse=function(el){
    head(el,"Crib Dragging","同じ鍵ストリームで暗号化した 2 つの文を取り出す");
    var P="MEET ME AT THE OLD BRIDGE AT TEN TONIGHT", Q="THE PACKAGE IS HIDDEN UNDER THE BLUE CAR";
    var Z=[],x=0x2545F491,i;
    for(i=0;i<P.length;i++){x^=(x<<13)>>>0;x>>>=0;x^=x>>>17;x^=(x<<5)>>>0;x>>>=0;Z.push(x&255);}
    var X=[];for(i=0;i<P.length;i++)X.push((P.charCodeAt(i)^Z[i])^(Q.charCodeAt(i)^Z[i]));
    var row=ctrls(el);
    var ti=textin(row,"推測する語（クリブ）"," THE ");
    var sj=slider(row,"当てはめる位置 j",0,P.length-5,10,1);
    var row2=ctrls(el); var ck=checkbox(row2,"答え（2 つの平文）を表示する",false);
    var cv=screen(el,92),cc=cctx(cv), out=panel(el), ro=readout(el);
    function ok(v){return (v>=65&&v<=90)||v===32;}
    function vis(v){return v===32?"␣":(v>=33&&v<=126?esc(String.fromCharCode(v)):"·");}
    function hx(v){return ("0"+v.toString(16)).slice(-2);}
    function res(j,g){var r=[];for(var k=0;k<g.length;k++)r.push(X[j+k]^g.charCodeAt(k));return r;}
    function good(j,g){return res(j,g).every(ok);}
    function draw(){
      var g=ti.value.toUpperCase(); if(!g.length)g=" ";
      var max=Math.max(0,P.length-g.length); sj.input.max=max; if(+sj.input.value>max)sj.input.value=max;
      var j=+sj.input.value; sj.val.textContent=j;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var pl=10,cw=(w-2*pl)/P.length,nOk=0;
      lab(ctx,"どの位置 j で結果が英字と空白だけになるか（緑）",pl,16,C("--muted"),"left");
      for(var k=0;k<=max;k++){var gd=good(k,g);if(gd)nOk++;
        ctx.fillStyle=gd?C("--signal"):C("--line");ctx.globalAlpha=gd?.85:1;ctx.fillRect(pl+k*cw+1,28,cw-2,26);ctx.globalAlpha=1;
        if(k===j){ctx.strokeStyle=C("--alias");ctx.lineWidth=2.2;ctx.strokeRect(pl+k*cw,26,cw,30);}
        if(k%5===0)lab(ctx,String(k),pl+k*cw+cw/2,72,C("--faint"),"center");}
      var r=res(j,g);
      function tr(name,vals,col){return '<tr><th style="padding:.15rem .5rem;text-align:right;color:var(--muted);white-space:nowrap">'+name+'</th>'+
        vals.map(function(v){return '<td style="padding:.15rem .35rem;text-align:center;color:'+(col||"var(--ink)")+'">'+v+'</td>';}).join("")+'</tr>';}
      var idx=[];for(k=0;k<g.length;k++)idx.push(j+k);
      var hh='<table style="border-collapse:collapse">'+tr("位置",idx,"var(--faint)")+
        tr("C ⊕ C′（16 進）",idx.map(function(q){return hx(X[q]);}))+
        tr("クリブ",g.split("").map(function(ch){return vis(ch.charCodeAt(0));}),"var(--blue)")+
        tr("XOR した結果",r.map(function(v){return '<b style="color:'+(ok(v)?"var(--signal)":"var(--alias)")+'">'+vis(v)+'</b>';}));
      if(ck.checked)hh+=tr("平文 P",idx.map(function(q){return vis(P.charCodeAt(q));}),"var(--muted)")+tr("平文 P′",idx.map(function(q){return vis(Q.charCodeAt(q));}),"var(--muted)");
      out.innerHTML=hh+'</table>'+(ck.checked?'<div style="margin-top:.5rem;color:var(--muted)">P = '+P.replace(/ /g,"␣")+'<br>P′ = '+Q.replace(/ /g,"␣")+'</div>':'');
      var all=r.every(ok);
      ro.innerHTML='位置 j = '+j+' の結果「'+r.map(vis).join("")+'」 ／ '+
        (all?'<b class="ok">英字と空白だけ: どちらかの平文のこの位置にクリブがあり、もう一方の平文の断片が見えている候補</b>':
             '<span class="warn">読めない値が混ざる: この位置ではない</span>')+' ／ 緑の位置は '+nOk+' 個';
    }
    ti.addEventListener("input",draw);sj.input.addEventListener("input",draw);ck.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 13. lfsrstep — LFSR を 1 クロックずつ動かす ============ */
  REG.lfsrstep=function(el){
    head(el,"LFSR","タップと初期状態を決めて、1 クロックずつ進める");
    var row=ctrls(el);
    var tt=textin(row,"タップ c₁ c₂ …（0 と 1 を L 個。最後は 1）","0011");
    var ts=textin(row,"初期状態（左が新しい）","1000");
    var row2=ctrls(el);
    var b1=button(row2,"1 クロック進める"), b2=button(row2,"自動で進める"), b3=button(row2,"最初に戻す");
    var cv=screen(el,200),cc=cctx(cv), out=panel(el), ro=readout(el);
    var c=[],st=[],init=[],outs=[],hist=[],n=0,per=0,err="",timer=null;
    function parse(){
      var a=tt.value.replace(/[^01]/g,""),b=ts.value.replace(/[^01]/g,"");
      err="";
      if(a.length<2||a.length>12)err="タップは 2〜12 個の 0/1 で入力する";
      else if(a[a.length-1]!=="1")err="最後のタップ c_L は 1 にする（0 なら長さ L − 1 の LFSR と同じになる）";
      else if(b.length!==a.length)err="初期状態はタップと同じ長さ（"+a.length+" ビット）にする";
      else if(b.indexOf("1")<0)err="初期状態がすべて 0 だと、0 しか出力されない";
      c=a.split("").map(Number); init=b.split("").map(Number);
      reset();
    }
    function reset(){st=init.slice();outs=[];hist=[st.join("")];n=0;per=err?0:c13period(c,init);stop();draw();}
    function step(){if(err)return;outs.push(st[st.length-1]);st=c13step(c,st);n++;hist.push(st.join(""));draw();}
    function stop(){if(timer){clearInterval(timer);timer=null;}b2.setAttribute("aria-pressed","false");b2.textContent="自動で進める";}
    function draw(){
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(err){lab(ctx,err,14,30,C("--alias"),"left");out.innerHTML="";ro.innerHTML='<span class="warn">'+err+'</span>';return;}
      var L=c.length,pl=70,pr=96,cw=Math.min(56,(w-pl-pr)/L),y0=48,ch=38,xs=[];
      for(var i=0;i<L;i++)xs.push(pl+i*cw);
      var nb=0;for(i=0;i<L;i++)nb^=c[i]&st[i];
      lab(ctx,"時刻 n = "+n,10,18,C("--ink"),"left");
      lab(ctx,"← 新しい",pl,y0-8,C("--muted"),"left");lab(ctx,"古い →",pl+L*cw-4,y0-8,C("--muted"),"right");
      // バス
      var yb=y0+ch+56,taps=[];for(i=0;i<L;i++)if(c[i])taps.push(xs[i]+cw/2-2);
      ctx.strokeStyle=C("--ink");ctx.lineWidth=1.4;
      taps.forEach(function(x){ctx.beginPath();ctx.moveTo(x,y0+ch);ctx.lineTo(x,y0+ch+4);ctx.moveTo(x,y0+ch+21);ctx.lineTo(x,yb);ctx.stroke();});
      if(taps.length){ctx.beginPath();ctx.moveTo(taps[taps.length-1],yb);ctx.lineTo(36,yb);ctx.lineTo(36,y0+ch/2);ctx.lineTo(xs[0]-6,y0+ch/2);
        ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.stroke();
        ctx.fillStyle=C("--alias");ctx.beginPath();ctx.moveTo(xs[0]-2,y0+ch/2);ctx.lineTo(xs[0]-10,y0+ch/2-5);ctx.lineTo(xs[0]-10,y0+ch/2+5);ctx.closePath();ctx.fill();}
      taps.forEach(function(x){ctx.fillStyle=C("--ink");ctx.beginPath();ctx.arc(x,yb,3,0,TAU);ctx.fill();});
      ctx.fillStyle=C("--screen");ctx.strokeStyle=C("--alias");ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(36,yb,11,0,TAU);ctx.fill();ctx.stroke();
      lab(ctx,"⊕",36,yb+4,C("--alias"),"center");
      lab(ctx,"次に入るビット = "+taps.length+" 個のタップの XOR = "+nb,48,yb+24,C("--alias"),"left");
      for(i=0;i<L;i++){
        ctx.fillStyle=c[i]?C("--signal-soft"):C("--panel");ctx.strokeStyle=c[i]?C("--signal"):C("--line");ctx.lineWidth=1.6;
        rrect(ctx,xs[i],y0,cw-4,ch,6);ctx.fill();ctx.stroke();
        ctx.font="bold 16px "+C("--mono");ctx.fillStyle=C("--ink");ctx.textAlign="center";ctx.fillText(String(st[i]),xs[i]+cw/2-2,y0+ch/2+6);
        lab(ctx,"c"+(i+1)+"="+c[i],xs[i]+cw/2-2,y0+ch+16,c[i]?C("--signal"):C("--muted"),"center");}
      var xo=pl+L*cw;ctx.strokeStyle=C("--blue");ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(xo,y0+ch/2);ctx.lineTo(xo+40,y0+ch/2);ctx.stroke();
      ctx.fillStyle=C("--blue");ctx.beginPath();ctx.moveTo(xo+46,y0+ch/2);ctx.lineTo(xo+38,y0+ch/2-5);ctx.lineTo(xo+38,y0+ch/2+5);ctx.closePath();ctx.fill();
      lab(ctx,"次の出力 "+st[L-1],xo+4,y0+ch/2-10,C("--blue"),"left");
      var back=n>0&&st.join("")===init.join("");
      out.innerHTML='<div style="color:var(--muted)">出力列 s₀ s₁ s₂ …（'+outs.length+' ビット）</div><div style="word-break:break-all;letter-spacing:.12em">'+
        (outs.length?outs.join("").replace(/(.{5})/g,"$1 "):"（まだ出力していない）")+'</div>'+
        '<div style="color:var(--muted);margin-top:.4rem">状態の移り変わり（直近）</div><div style="word-break:break-all">'+
        hist.slice(-9).map(function(s,k,arr){var last=k===arr.length-1;return last?'<b>'+s+'</b>':s;}).join(" → ")+'</div>';
      ro.innerHTML='時刻 n = '+n+' ／ この初期状態に戻るまでの更新回数 <b>'+per+'</b>（0 以外の状態は 2<sup>'+c.length+'</sup> − 1 = '+((1<<c.length)-1)+' 通り）'+
        (back?' ／ <b class="ok">時刻 '+n+' で初期状態に戻った</b>':'');
    }
    b1.addEventListener("click",function(){stop();step();});
    b2.addEventListener("click",function(){if(timer){stop();return;}if(err)return;b2.setAttribute("aria-pressed","true");b2.textContent="止める";
      timer=setInterval(function(){if(!document.body.contains(el)){stop();return;}step();},450);});
    b3.addEventListener("click",reset);
    tt.addEventListener("input",parse);ts.addEventListener("input",parse);reg(cv,draw);parse();
  };

  /* ============ 13. lfsrcycle — 特性多項式と状態の輪 ============ */
  REG.lfsrcycle=function(el){
    head(el,"State Cycles","0 以外の状態が分かれる輪と、その長さ");
    var row=ctrls(el);
    var sL=select(row,"長さ L",["3","4","5"]); sL.value="1";
    var sp=select(row,"特性多項式",["…"]);
    var wrap=mk("div","wscreen");var cv=mk("canvas");wrap.appendChild(cv);el.appendChild(wrap);var cc=cctx(cv);
    var ro=readout(el);
    var list=[];
    function build(){
      var L=3+(+sL.value);list=[];
      for(var v=0;v<(1<<(L-1));v++){var c=[];for(var i=1;i<L;i++)c.push((v>>(L-1-i))&1);c.push(1);
        var f=c13fcoef(c),fs=c13factor(f),irr=fs.length===1,N=c13order(f),kind=irr?(N===(1<<L)-1?"原始":"既約・原始でない"):"可約";
        list.push({c:c,f:f,fs:fs,kind:kind,N:N});}
      var order={"原始":0,"既約・原始でない":1,"可約":2};
      list.sort(function(a,b){return order[a.kind]-order[b.kind];});
      sp.innerHTML=list.map(function(it,k){return '<option value="'+k+'">'+c13poly(it.c).replace(/<sup>(\d+)<\/sup>/g,function(m,d){return d.split("").map(function(q){return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+q];}).join("");})+'（'+it.kind+'）</option>';}).join("");
      sp.value="0";
    }
    function cycles(c){var L=c.length,seen={},res=[];
      for(var v=1;v<(1<<L);v++){var st=[];for(var i=0;i<L;i++)st.push((v>>(L-1-i))&1);if(seen[st.join("")])continue;
        var cyc=[],cur=st;while(!seen[cur.join("")]){seen[cur.join("")]=1;cyc.push(cur.join(""));cur=c13step(c,cur);}res.push(cyc);}
      res.sort(function(a,b){return b.length-a.length;});return res;}
    function draw(){
      var it=list[+sp.value]; if(!it)return;
      var L=it.c.length,cyc=cycles(it.c);
      var w=wrap.getBoundingClientRect().width||600, nodeW=L*7+10, sp1=nodeW+8, pad=16;
      // 輪の大きさと配置
      var items=cyc.map(function(q){var r=q.length<3?(q.length===1?0:nodeW*0.75):Math.max(nodeW,q.length*sp1/(2*Math.PI));return {q:q,r:r,D:2*r+nodeW+2*pad};});
      var rows=[],cur=[],cw0=0;items.forEach(function(o){if(cur.length&&cw0+o.D>w-8){rows.push(cur);cur=[];cw0=0;}cur.push(o);cw0+=o.D;});if(cur.length)rows.push(cur);
      var H=12;rows.forEach(function(r){var m=0;r.forEach(function(o){m=Math.max(m,o.D+(o.q.length===1?26:0));});r.h=m+22;H+=r.h;});
      wrap.style.height=Math.max(120,H+8)+"px";
      var d=cc.fit(),ctx=cc.ctx;ctx.clearRect(0,0,d.w,d.h);
      var col=it.kind==="原始"?C("--signal"):(it.kind==="可約"?C("--alias"):C("--blue"));
      var y=12;
      rows.forEach(function(r){var tot=0;r.forEach(function(o){tot+=o.D;});var x=(d.w-tot)/2;
        r.forEach(function(o){var cx=x+o.D/2,cy=y+(o.q.length===1?26:0)+o.D/2,n=o.q.length,pts=[];
          for(var k=0;k<n;k++){var th=-Math.PI/2+TAU*k/n;pts.push([cx+(n===1?0:o.r*Math.cos(th)),cy+(n===1?0:o.r*Math.sin(th))]);}
          ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1.3;
          if(n===1){ctx.beginPath();ctx.arc(pts[0][0],pts[0][1]-17,10,Math.PI*0.75,Math.PI*2.25);ctx.stroke();}
          else for(k=0;k<n;k++){var p=pts[k],q=pts[(k+1)%n],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/len,uy=dy/len;
            var off=n===2?(k?8:-8):0,ox=-uy*off,oy=ux*off,cut=Math.min(len/2-2,nodeW/2+3);
            var ax=p[0]+ux*cut+ox,ay=p[1]+uy*cut+oy,bx=q[0]-ux*cut+ox,by=q[1]-uy*cut+oy;
            ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
            ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-ux*6-uy*3.5,by-uy*6+ux*3.5);ctx.lineTo(bx-ux*6+uy*3.5,by-uy*6-ux*3.5);ctx.closePath();ctx.fill();}
          for(k=0;k<n;k++){ctx.fillStyle=C("--panel");ctx.strokeStyle=col;ctx.lineWidth=1.3;rrect(ctx,pts[k][0]-nodeW/2,pts[k][1]-9,nodeW,18,4);ctx.fill();ctx.stroke();
            lab(ctx,o.q[k],pts[k][0],pts[k][1]+4,C("--ink"),"center");}
          lab(ctx,"長さ "+n,cx,y+(o.q.length===1?26:0)+o.D-2,col,"center");
          x+=o.D;});
        y+=r.h;});
      var lens=cyc.map(function(q){return q.length;});
      var fstr=it.fs.length>1?' = '+(function(){var m={},o=[];it.fs.forEach(function(p){var s=c13pstr(p);m[s]=(m[s]||0)+1;});for(var s in m)o.push("("+s+")"+(m[s]>1?"<sup>"+m[s]+"</sup>":""));return o.join("");})():'';
      ro.innerHTML='f(x) = '+c13poly(it.c)+fstr+' ／ <b>'+it.kind+'</b> ／ 輪の長さ: <b>'+lens.join(", ")+'</b>'+
        (it.kind==="原始"?' ／ <b class="ok">1 つの輪で周期 2<sup>'+L+'</sup> − 1 = '+((1<<L)-1)+'（M 系列）</b>':
         it.kind==="既約・原始でない"?' ／ どの輪も x の位数 '+it.N+' と同じ長さ':' ／ <span class="warn">初期状態によって周期が変わる</span>');
    }
    sL.addEventListener("change",function(){build();draw();});sp.addEventListener("change",draw);
    build();
    for(var k=0;k<list.length;k++)if(list[k].c.join("")==="0011")sp.value=String(k);
    reg(cv,draw);
  };

  /* ============ 13. lfsrsolve — 観測した出力からタップを求める ============ */
  REG.lfsrsolve=function(el){
    head(el,"Recover LFSR","観測したビットで連立方程式を立て、タップを求める");
    var row=ctrls(el);
    var sL=slider(row,"秘密の LFSR の長さ L",2,16,4,1);
    var sm=slider(row,"観測するビット数 m",1,48,8,1);
    var row2=ctrls(el); var bt=button(row2,"秘密の LFSR を作り直す"); var ck=checkbox(row2,"秘密の LFSR を表示する",false);
    var out=panel(el), ro=readout(el);
    var sec={c:[0,0,1,1],init:[0,0,0,1]};
    function randPrim(L){for(var t=0;t<4000;t++){var c=[];for(var i=1;i<L;i++)c.push(Math.random()<.5?1:0);c.push(1);
        var st=[];for(i=0;i<L;i++)st.push(i===L-1?1:0);if(c13period(c,st)===(1<<L)-1)return c;}return null;}
    function regen(){var L=+sL.input.value,c=randPrim(L);if(!c)return;var init;
      do{init=[];for(var i=0;i<L;i++)init.push(Math.random()<.5?1:0);}while(init.indexOf(1)<0);sec={c:c,init:init};}
    function solve(s,L,m){ // 行 n: [s_{n+L-1} … s_n] · c = s_{n+L}
      var rows=[];for(var n=0;n+L<m;n++){var r=[];for(var i=0;i<L;i++)r.push(s[n+L-1-i]);r.push(s[n+L]);rows.push(r);}
      var A=rows.map(function(r){return r.slice();}),rank=0,piv=[];
      for(var col=0;col<L&&rank<A.length;col++){var p=-1;for(var i=rank;i<A.length;i++)if(A[i][col]){p=i;break;}if(p<0)continue;
        var t=A[p];A[p]=A[rank];A[rank]=t;for(i=0;i<A.length;i++)if(i!==rank&&A[i][col])for(var k=col;k<=L;k++)A[i][k]^=A[rank][k];
        piv.push(col);rank++;}
      var cons=true;for(var i2=rank;i2<A.length;i2++)if(A[i2][L])cons=false;
      var c=[];for(var q=0;q<L;q++)c.push(0);for(var r2=0;r2<rank;r2++)c[piv[r2]]=A[r2][L];
      return {rows:rows,rank:rank,cons:cons,c:c};}
    function run(){
      var L=+sL.input.value; sm.input.max=Math.max(3*L,8); if(+sm.input.value>+sm.input.max)sm.input.value=sm.input.max;
      var m=+sm.input.value; sL.val.textContent=L; sm.val.textContent=m+"（2L = "+(2*L)+"）";
      if(sec.c.length!==L)regen();
      var s=c13seq(sec.c,sec.init,m+40),obs=s.slice(0,m);
      var R=solve(s,L,m),neq=R.rows.length,nsol=R.cons?Math.pow(2,L-R.rank):0;
      var h='<div style="color:var(--muted)">観測したビット s₀ … s<sub>'+(m-1)+'</sub></div><div style="letter-spacing:.12em;word-break:break-all">'+obs.join("").replace(/(.{4})/g,"$1 ")+'</div>';
      if(neq>0&&L<=6){h+='<div style="color:var(--muted);margin-top:.4rem">式（係数 [c<sub>1</sub> … c<sub>'+L+'</sub>] | 右辺 s<sub>n+'+L+'</sub>）</div><div>'+
        R.rows.slice(0,8).map(function(r,n){return 'n='+n+': ['+r.slice(0,L).join(" ")+' | '+r[L]+']';}).join("　")+(R.rows.length>8?" …":"")+'</div>';}
      var pred=[],act=s.slice(m,m+32),hit=0;
      if(neq>0&&R.cons){var t=obs.slice();for(var k=0;k<32;k++){var n0=t.length-L,v=0;for(var i=0;i<L;i++)v^=R.c[i]&t[n0+L-1-i];t.push(v);pred.push(v);if(v===act[k])hit++;}
        h+='<div style="color:var(--muted);margin-top:.4rem">求めたタップ c = '+R.c.join("")+'（f(x) = '+c13poly(R.c)+'）で予測した続き 32 ビット（<span style="color:var(--signal)">一致</span>／<span style="color:var(--alias)">不一致</span>）</div><div style="letter-spacing:.12em">'+
          pred.map(function(v,k){return '<span style="color:'+(v===act[k]?"var(--signal)":"var(--alias)")+'">'+v+'</span>'+((k%4===3)?" ":"");}).join("")+'</div>';}
      if(ck.checked)h+='<div style="color:var(--muted);margin-top:.4rem">秘密の LFSR: タップ '+sec.c.join("")+'、f(x) = '+c13poly(sec.c)+'、初期状態（左が新しい） '+sec.init.slice().reverse().join("")+'</div>';
      out.innerHTML=h;
      if(neq<=0){ro.innerHTML='<span class="warn">式が立たない（m ≤ L）。少なくとも L + 1 ビット要る</span>';return;}
      ro.innerHTML='式 '+neq+' 本（ほかの式の XOR では作れない式は '+R.rank+' 本）、未知数 '+L+' 個 ／ '+
        (nsol===1?'<b class="ok">解はただ 1 つ</b>':'<span class="warn">解が '+nsol+' 個あり、タップが 1 つに決まらない</span>')+
        ' ／ 予測 '+hit+'/32 ビット一致'+(hit===32&&nsol===1?'（以後の鍵ストリームはすべて分かる）':'');
    }
    sL.input.addEventListener("input",function(){regen();run();});sm.input.addEventListener("input",run);
    bt.addEventListener("click",function(){regen();run();});ck.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 13. geffe — 相関攻撃 ============ */
  REG.geffe=function(el){
    head(el,"Correlation Attack","Geffe 生成器の 1 本目の LFSR だけを総当たりする");
    var row=ctrls(el);
    var sn=slider(row,"観測する出力 z のビット数",8,400,120,4);
    var row2=ctrls(el); var bt=button(row2,"秘密の初期状態を作り直す");
    var cv=screen(el,230),cc=cctx(cv), ro=readout(el);
    var C1=[0,0,1,0,1],C2=[0,0,0,0,1,1],C3=[0,0,0,0,0,1,1];   // x⁵+x²+1, x⁶+x+1, x⁷+x+1
    var ia=[0,1,1,0,1],ib=[1,1,0,0,1,1],ic=[1,0,0,1,1,0,1];
    function rnd(L){var a;do{a=[];for(var i=0;i<L;i++)a.push(Math.random()<.5?1:0);}while(a.indexOf(1)<0);return a;}
    function draw(){
      var N=+sn.input.value; sn.val.textContent=N;
      var a=c13seq(C1,ia,N),b=c13seq(C2,ib,N),c=c13seq(C3,ic,N),z=[],i;
      for(i=0;i<N;i++)z.push(b[i]?a[i]:c[i]);
      var cand=[],best=-1,bi=-1,truth=-1;
      for(var v=1;v<32;v++){var init=[];for(i=0;i<5;i++)init.push((v>>i)&1);var s=c13seq(C1,init,N),m=0;for(i=0;i<N;i++)if(s[i]===z[i])m++;
        var r=m/N;cand.push(r);if(init.join("")===ia.join(""))truth=v-1;if(r>best){best=r;bi=v-1;}}
      var other=0;cand.forEach(function(r,k){if(k!==truth&&r>other)other=r;});
      var ch=chart(cc,0,32,0.2,1.0,{l:40,b:30,t:18,r:12});grid(ch,4);axis(ch);
      [[0.5,"1/2"],[0.75,"3/4"]].forEach(function(q){var y=ch.Y(q[0]);ch.ctx.strokeStyle=C("--faint");ch.ctx.setLineDash([4,4]);ch.ctx.beginPath();ch.ctx.moveTo(ch.p.l,y);ch.ctx.lineTo(ch.w-ch.p.r,y);ch.ctx.stroke();ch.ctx.setLineDash([]);
        lab(ch.ctx,q[1],ch.p.l-6,y+4,C("--muted"),"right");});
      cand.forEach(function(r,k){dot(ch,k+1,r,k===truth?6:3.5,k===truth?C("--alias"):C("--blue"));});
      lab(ch.ctx,"正しい初期状態",ch.X(truth+1)+8,ch.Y(cand[truth])-6,C("--alias"),"left");
      lab(ch.ctx,"1 本目の初期状態の候補（31 通り）",ch.X(16),ch.h-8,C("--muted"),"center");
      lab(ch.ctx,"z との一致率",ch.p.l+4,12,C("--muted"),"left");
      var st=ia.slice().reverse().join("");
      ro.innerHTML='正しい初期状態 '+st+' の一致率 <b>'+f(cand[truth],2)+'</b> ／ ほかの候補の最大 <b>'+f(other,2)+'</b> ／ '+
        (bi===truth&&cand[truth]>other?'<b class="ok">一致率が最大の候補が正しい</b>':'<span class="warn">まだ区別できない（観測ビットを増やす）</span>')+
        ' ／ 試した数は 31 通り（3 本まとめて総当たりすると 31 × 63 × 127 = 248031 通り）';
    }
    sn.input.addEventListener("input",draw);bt.addEventListener("click",function(){ia=rnd(5);ib=rnd(6);ic=rnd(7);draw();});reg(cv,draw);
  };

  /* ============ 14. 共通: AES-128 の実装（デモ用。速さより読みやすさを優先） ============ */
  var AES14=(function(){
    function xt(a){return ((a<<1)&0xFF)^((a&0x80)?0x1B:0);}
    function mul(a,b){var r=0;for(var i=0;i<8;i++){if(b&1)r^=a;a=xt(a);b>>=1;}return r;}
    function inv(a){if(!a)return 0;var r=1,e=254,x=a;while(e){if(e&1)r=mul(r,x);x=mul(x,x);e>>=1;}return r;}
    function rotl(x,k){return ((x<<k)|(x>>(8-k)))&0xFF;}
    function aff(b){return b^rotl(b,1)^rotl(b,2)^rotl(b,3)^rotl(b,4)^0x63;}
    var S=[],SI=[],i;
    for(i=0;i<256;i++)S[i]=aff(inv(i));
    for(i=0;i<256;i++)SI[S[i]]=i;
    function sub(s){return s.map(function(x){return S[x];});}
    function isub(s){return s.map(function(x){return SI[x];});}
    function shift(s){var o=[];for(var r=0;r<4;r++)for(var c=0;c<4;c++)o[r+4*c]=s[r+4*((c+r)%4)];return o;}
    function ishift(s){var o=[];for(var r=0;r<4;r++)for(var c=0;c<4;c++)o[r+4*((c+r)%4)]=s[r+4*c];return o;}
    var M=[[2,3,1,1],[1,2,3,1],[1,1,2,3],[3,1,1,2]],MI=[[14,11,13,9],[9,14,11,13],[13,9,14,11],[11,13,9,14]];
    function mixm(s,m){var o=[];for(var c=0;c<4;c++)for(var r=0;r<4;r++){var v=0;for(var k=0;k<4;k++)v^=mul(m[r][k],s[k+4*c]);o[r+4*c]=v;}return o;}
    function xor(a,b){return a.map(function(x,j){return x^b[j];});}
    function keys(key){
      var W=[],j;for(j=0;j<4;j++)W.push(key.slice(4*j,4*j+4));var rc=1;
      for(j=4;j<44;j++){var t=W[j-1].slice();
        if(j%4===0){t=[S[t[1]],S[t[2]],S[t[3]],S[t[0]]];t[0]^=rc;rc=xt(rc);}
        W.push([W[j-4][0]^t[0],W[j-4][1]^t[1],W[j-4][2]^t[2],W[j-4][3]^t[3]]);}
      var K=[];for(var r=0;r<11;r++)K.push(W[4*r].concat(W[4*r+1],W[4*r+2],W[4*r+3]));
      return {W:W,K:K};}
    function enc(p,K){var s=xor(p,K[0]);for(var r=1;r<=10;r++){s=shift(sub(s));if(r<10)s=mixm(s,M);s=xor(s,K[r]);}return s;}
    function dec(c,K){var s=xor(c,K[10]);for(var r=9;r>=0;r--){s=isub(ishift(s));s=xor(s,K[r]);if(r>0)s=mixm(s,MI);}return s;}
    /* 各操作の後の状態を順に記録する（入力・ラウンド 0 の AddRoundKey・…・ラウンド 10 の AddRoundKey の 41 個） */
    function trace(p,key){
      var K=keys(key).K,st=[{r:0,op:"入力",s:p.slice()}],s=xor(p,K[0]);
      st.push({r:0,op:"AddRoundKey",s:s,k:K[0]});
      for(var r=1;r<=10;r++){
        s=sub(s);st.push({r:r,op:"SubBytes",s:s});
        s=shift(s);st.push({r:r,op:"ShiftRows",s:s});
        if(r<10){s=mixm(s,M);st.push({r:r,op:"MixColumns",s:s});}
        s=xor(s,K[r]);st.push({r:r,op:"AddRoundKey",s:s,k:K[r]});
      }
      return st;}
    /* GCM: GF(2^128) の掛け算（ビットの並びは GCM の約束どおり、バイト 0 の最上位ビットが x^0 の係数） */
    function gfmul128(X,Y){
      var Z=[],V=Y.slice(),j,k;for(j=0;j<16;j++)Z.push(0);
      for(j=0;j<128;j++){
        if((X[j>>3]>>(7-(j&7)))&1)for(k=0;k<16;k++)Z[k]^=V[k];
        var lsb=V[15]&1;for(k=15;k>0;k--)V[k]=(V[k]>>1)|((V[k-1]&1)<<7);V[0]>>=1;if(lsb)V[0]^=0xE1;
      }
      return Z;}
    function ctrblk(nonce,n){return nonce.concat([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
    /* data は暗号化なら平文、復号なら暗号文。ノンスは 12 バイト、付随データは無し */
    function gcm(K,nonce,data,encrypt){
      var H=enc([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],K),out=[],j,k,nb=Math.ceil(data.length/16);
      for(j=0;j<nb;j++){var ks=enc(ctrblk(nonce,j+2),K);for(k=0;k<16&&16*j+k<data.length;k++)out.push(data[16*j+k]^ks[k]);}
      var Cx=encrypt?out:data,Y=[];for(j=0;j<16;j++)Y.push(0);
      for(j=0;j<nb;j++){var blk=[];for(k=0;k<16;k++)blk.push(16*j+k<Cx.length?Cx[16*j+k]:0);Y=gfmul128(xor(Y,blk),H);}
      var bits=Cx.length*8,L=[0,0,0,0,0,0,0,0,0,0,0,0,(bits>>>24)&255,(bits>>>16)&255,(bits>>>8)&255,bits&255];
      Y=gfmul128(xor(Y,L),H);
      return {out:out,tag:xor(Y,enc(ctrblk(nonce,1),K))};}
    function h2(v){return (v<16?"0":"")+v.toString(16);}
    function hexs(a,sep){return a.map(h2).join(sep==null?" ":sep);}
    function parse(t){t=String(t||"").replace(/[^0-9a-fA-F]/g,"");if(t.length!==32)return null;
      var o=[];for(var j=0;j<16;j++)o.push(parseInt(t.substr(2*j,2),16));return o;}
    function bits8(v){var s=v.toString(2);while(s.length<8)s="0"+s;return s;}
    return {S:S,SI:SI,xt:xt,mul:mul,inv:inv,rotl:rotl,sub:sub,shift:shift,mix:function(s){return mixm(s,M);},xor:xor,
      keys:keys,enc:enc,dec:dec,trace:trace,gcm:gcm,h2:h2,hexs:hexs,parse:parse,bits8:bits8};
  })();

  /* ============ 14. aesSbox — 段階 1・段階 2 と S-box の表 ============ */
  REG.aesSbox=function(el){
    head(el,"S-box","逆元（段階 1）とアフィン変換（段階 2）で S(a) を求める");
    var A=AES14,row=ctrls(el);
    var sv=slider(row,"入力バイト a",0,255,0x53,1);
    var out=panel(el),ro=readout(el);
    function hx(v){return "0x"+A.h2(v).toUpperCase();}
    function td(t,st){return '<td style="padding:.05rem .45rem;border-bottom:0;'+(st||"")+'">'+t+'</td>';}
    function run(){
      var a=+sv.input.value;sv.val.textContent=hx(a);
      var b=A.inv(a),c=A.S[a],k;
      var h='<div style="display:flex;flex-wrap:wrap;gap:1rem 1.6rem;align-items:flex-start">';
      h+='<div style="flex:1 1 300px;min-width:270px">';
      h+='<div style="color:var(--muted)">段階 1: 逆元 a<sup>−1</sup> = a<sup>254</sup>（2 乗を 7 回して、7 個を掛け合わせる）</div>';
      if(a===0){h+='<div>a = 0 には逆元が無いので、b = 0 とする</div>';}
      else{
        var sq=[],x=a;for(k=1;k<=7;k++){x=A.mul(x,x);sq.push(x);}
        var lab=["2","4","8","16","32","64","128"];
        h+='<table style="border-collapse:collapse;width:auto;margin:.25rem 0"><tr>'+lab.map(function(t){return '<th style="padding:.1rem .4rem;font-size:.7rem">a<sup>'+t+'</sup></th>';}).join("")+'</tr>';
        h+='<tr>'+sq.map(function(v){return td(A.h2(v).toUpperCase(),"text-align:center");}).join("")+'</tr></table>';
        h+='<div>積 = a<sup>254</sup> = <b style="color:var(--blue)">'+hx(b)+'</b>　<span style="color:var(--muted)">検算: '+hx(a)+' × '+hx(b)+' = '+hx(A.mul(a,b))+'</span></div>';
      }
      h+='<div style="color:var(--muted);margin-top:.7rem">段階 2: 回転した b と 0x63 を列ごとに XOR する</div>';
      var rows=[["b",b],["b⋘1",A.rotl(b,1)],["b⋘2",A.rotl(b,2)],["b⋘3",A.rotl(b,3)],["b⋘4",A.rotl(b,4)],["0x63",0x63]];
      h+='<table style="border-collapse:collapse;width:auto;margin-top:.2rem">';
      rows.forEach(function(r,i){var bt=i===5?"border-bottom:1px solid var(--ink);":"";
        h+='<tr>'+td(r[0],"text-align:right;color:var(--muted);"+bt)+td(A.bits8(r[1]),"letter-spacing:.3em;"+bt)+td(A.h2(r[1]).toUpperCase(),bt)+'</tr>';});
      var em="color:var(--signal);font-weight:700;";
      h+='<tr>'+td("S(a)","text-align:right;"+em)+td(A.bits8(c),"letter-spacing:.3em;"+em)+td(A.h2(c).toUpperCase(),em)+'</tr></table>';
      h+='</div>';
      h+='<div style="flex:0 0 auto"><div style="color:var(--muted);margin-bottom:.2rem">S-box の表（行 = a の上位 4 ビット、列 = 下位 4 ビット）</div>';
      h+='<table style="border-collapse:collapse;width:auto;font-size:.66rem;line-height:1.3"><tr><th style="padding:.05rem .2rem"></th>';
      var lo,hi;
      for(lo=0;lo<16;lo++)h+='<th style="padding:.05rem .22rem;text-align:center;font-size:.62rem">'+lo.toString(16).toUpperCase()+'</th>';
      h+='</tr>';
      for(hi=0;hi<16;hi++){
        h+='<tr><th style="padding:.05rem .25rem;font-size:.62rem">'+hi.toString(16).toUpperCase()+'</th>';
        for(lo=0;lo<16;lo++){var v=hi*16+lo,on=v===a,near=hi===(a>>4)||lo===(a&15);
          h+=td(A.h2(A.S[v]),"text-align:center;padding:.05rem .22rem;"+(on?"background:var(--signal);color:var(--panel);font-weight:700;border-radius:3px":(near?"background:var(--signal-soft)":"")));}
        h+='</tr>';}
      h+='</table></div></div>';
      out.innerHTML=h;
      ro.innerHTML='S('+hx(a)+') = <b class="ok">'+hx(c)+'</b> ／ 表の '+(a>>4).toString(16).toUpperCase()+' 行 '+(a&15).toString(16).toUpperCase()+' 列 ／ '+
        (a===c?'<span class="warn">不動点</span>':'S(a) ≠ a（どの a でも不動点にならない）');
    }
    sv.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 14. aesCache — 読まれたキャッシュラインから鍵を絞り込む ============ */
  REG.aesCache=function(el){
    head(el,"Cache","1 ラウンド目の表引きで読まれるキャッシュラインと、鍵の候補");
    var A=AES14,row=ctrls(el);
    var sk=slider(row,"鍵のバイト k（秘密）",0,255,0x2B,1),sp=slider(row,"平文のバイト p（攻撃者が選ぶ）",0,255,0xA0,1);
    var row2=ctrls(el);var cb=checkbox(row2,"毎回すべての項を読む（定数時間の実装）",false);
    var out=panel(el),ro=readout(el);
    function hx(v){return "0x"+A.h2(v).toUpperCase();}
    function b2(v){return (v>>1)+""+(v&1);}
    function tab(fn,lb){
      var h='<table style="border-collapse:separate;border-spacing:2px;width:auto">';
      for(var hi=0;hi<16;hi++){h+='<tr>';
        for(var lo=0;lo<16;lo++){var v=hi*16+lo;h+='<td style="width:.78rem;height:.72rem;padding:0;border-radius:2px;border:1px solid var(--line);'+fn(v)+'"></td>';}
        h+='<td style="padding:0 0 0 .4rem;border:0;font-size:.66rem;color:var(--muted);white-space:nowrap;line-height:1">'+(hi%4===0?lb(hi>>2):"")+'</td></tr>';}
      return h+'</table>';}
    function run(){
      var k=+sk.input.value,p=+sp.input.value,ct=cb.checked;sk.val.textContent=hx(k);sp.val.textContent=hx(p);
      var idx=p^k,line=idx>>6,cand=[],g;
      for(g=0;g<256;g++)if(ct||((p^g)>>6)===line)cand.push(g);
      var h='<div style="display:flex;flex-wrap:wrap;gap:1rem 2rem">';
      h+='<div><div style="color:var(--muted);margin-bottom:.3rem">S-box の表（64 バイトずつ 4 本のライン）</div>'+tab(function(v){
        var ln=v>>6,read=ct||ln===line;
        if(v===idx)return "background:var(--alias);border-color:var(--alias)";
        return read?"background:var(--alias-soft);border-color:var(--alias)":(ln%2?"background:var(--grid)":"background:var(--screen)");},
        function(q){return "ライン "+q;})+'</div>';
      h+='<div><div style="color:var(--muted);margin-bottom:.3rem">鍵 k の候補（色付き。黒枠が本当の k）</div>'+tab(function(v){
        var c=cand.indexOf(v)>=0;
        return (c?"background:var(--signal-soft);border-color:var(--signal)":"background:var(--screen)")+(v===k?";outline:2px solid var(--ink)":"");},
        function(q){return "上位 "+b2(q);})+'</div></div>';
      h+='<div style="margin-top:.5rem">読む位置 p ⊕ k = '+hx(p)+' ⊕ '+hx(k)+' = <b style="color:var(--alias)">'+hx(idx)+'</b>（上位 2 ビット '+b2(idx>>6)+' → ライン '+line+'）</div>';
      out.innerHTML=h;
      ro.innerHTML=ct?'4 本のラインが毎回すべて読まれる → 観測から鍵について何も分からない ／ 候補 <b>256</b> 個':
        '観測: ライン <b>'+line+'</b> ／ k の上位 2 ビット = '+b2(line)+' ⊕ '+b2(p>>6)+'（p の上位 2 ビット）= <b class="warn">'+b2(line^(p>>6))+'</b> ／ 候補 <b>'+cand.length+'</b> 個 ／ p を変えても、分かるのは同じ上位 2 ビットだけ';
    }
    [sk,sp].forEach(function(o){o.input.addEventListener("input",run);});cb.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 14. aesRounds — ラウンドごとの状態とラウンド鍵 ============ */
  REG.aesRounds=function(el){
    head(el,"AES-128","各操作の前後の状態と、使われるラウンド鍵");
    var A=AES14,row=ctrls(el);
    var ip=textin(row,"平文（16 進 32 桁）","3243f6a8885a308d313198a2e0370734");
    var ik=textin(row,"鍵（16 進 32 桁）","2b7e151628aed2a6abf7158809cf4f3c");
    var row2=ctrls(el);
    var ss=slider(row2,"段階",0,40,1,1);
    var sb=slider(row2,"反転するビット（0 = 先頭バイトの最上位）",0,127,7,1);
    var row3=ctrls(el);
    var cb=checkbox(row3,"平文の 1 ビットを反転して比べる",false);
    var out=panel(el),ro=readout(el);
    var desc={"入力":"平文を列ごとに上から詰めた状態","SubBytes":"各バイトを S-box で置き換える","ShiftRows":"第 i 行を左へ i バイト巡回シフトする",
      "MixColumns":"各列に行列を掛ける","AddRoundKey":"ラウンド鍵を XOR する"};
    function grid(s,fn){
      var h='<table style="border-collapse:separate;border-spacing:3px;width:auto">';
      for(var r=0;r<4;r++){h+='<tr>';
        for(var c=0;c<4;c++){var k=r+4*c;
          h+='<td style="width:2rem;padding:.12rem .2rem;text-align:center;border:1px solid var(--line);border-radius:4px;background:var(--panel);'+(fn?fn(k):"")+'">'+A.h2(s[k])+'</td>';}
        h+='</tr>';}
      return h+'</table>';}
    function cap(t,c){return '<div style="font-size:.72rem;color:'+(c||"var(--muted)")+';margin-bottom:.15rem">'+t+'</div>';}
    function run(){
      var P=A.parse(ip.value),K=A.parse(ik.value);
      ss.val.textContent=ss.input.value+" / 40";sb.val.textContent=sb.input.value;sb.input.disabled=!cb.checked;
      if(!P||!K){out.innerHTML='<span style="color:var(--alias)">平文と鍵は 16 進数 32 桁（16 バイト）で入力する</span>';ro.innerHTML="";return;}
      var st=A.trace(P,K),n=+ss.input.value,cur=st[n],prev=n>0?st[n-1]:null;
      var title=cur.op==="入力"?"入力（平文）":"ラウンド "+cur.r+": "+cur.op;
      var h='<div style="margin-bottom:.5rem"><b>'+title+'</b>　<span style="color:var(--muted)">'+desc[cur.op]+'</span></div>';
      h+='<div style="display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center">';
      if(prev){
        h+='<div>'+cap("操作の前")+grid(prev.s)+'</div>';
        if(cur.op==="AddRoundKey"){
          h+='<div style="font-size:1.1rem">⊕</div><div>'+cap("ラウンド鍵 K<sub>"+cur.r+"</sub>","var(--signal)")+
            grid(cur.k,function(){return "background:var(--signal-soft);border-color:var(--signal)";})+'</div><div style="font-size:1.1rem">=</div>';
        }else h+='<div style="font-size:1.1rem">→</div>';
      }
      h+='<div>'+cap(prev?"操作の後（値が変わったマスに色）":"状態")+grid(cur.s,function(k){
        return prev&&prev.s[k]!==cur.s[k]?"background:var(--signal-soft);border-color:var(--signal)":"";})+'</div>';
      var nb=0,diffb=0;
      if(cb.checked){
        var bi=+sb.input.value,P2=P.slice();P2[bi>>3]^=(0x80>>(bi&7));
        var s2=A.trace(P2,K)[n].s;
        for(var j=0;j<16;j++){var x=s2[j]^cur.s[j];if(x)nb++;while(x){diffb+=x&1;x>>=1;}}
        h+='<div>'+cap("1 ビット反転した平文での同じ段階（違うバイトに色）","var(--alias)")+grid(s2,function(k){
          return s2[k]!==cur.s[k]?"background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700":"";})+'</div>';
      }
      h+='</div>';
      out.innerHTML=h;
      ro.innerHTML='暗号文（段階 40 の状態）= <b>'+A.hexs(st[40].s,"")+'</b>'+
        (cb.checked?' ／ 違うバイト <b class="warn">'+nb+'</b> / 16 ・ 違うビット <b class="warn">'+diffb+'</b> / 128':'');
    }
    [ip,ik].forEach(function(t){t.addEventListener("input",run);});
    [ss,sb].forEach(function(o){o.input.addEventListener("input",run);});cb.addEventListener("change",run);reg(null,run);run();
  };

  /* ============ 14. aesEcb — 同じ絵を ECB・CBC・CTR で暗号化する ============ */
  REG.aesEcb=function(el){
    head(el,"Modes","同じ絵を ECB・CBC・CTR で暗号化して比べる");
    var A=AES14,row=ctrls(el);
    var sel=select(row,"利用モード",["ECB","CBC","CTR"]);
    var cv=screen(el,260),cc=cctx(cv),ro=readout(el);
    var Wd=96,Ht=64,K=A.keys(A.parse("000102030405060708090a0b0c0d0e0f")).K;
    var IV=[0x12,0x9a,0x33,0x0c,0xe1,0x57,0x6d,0x2f,0xa4,0x48,0xb5,0x71,0x0e,0xc9,0x26,0x83];
    var BG=0xE6,BODY=0x46,SHK=0x8C,HOLE=0xE6;
    function pix(x,y){
      var dx=x-48,dy=y-24,r2=dx*dx+dy*dy;
      if(y>=30&&y<58&&x>=22&&x<74){
        var hx=x-48,hy=y-40;
        if(hx*hx+hy*hy<=16||(y>=40&&y<51&&x>=46&&x<50))return HOLE;
        return BODY;}
      if(y<=24&&r2<=18*18&&r2>=11*11)return SHK;
      if(y>24&&y<30&&((x>=30&&x<37)||(x>=59&&x<66)))return SHK;
      return BG;}
    var img=[],x,y;for(y=0;y<Ht;y++)for(x=0;x<Wd;x++)img.push(pix(x,y));
    var cache={};
    function encImg(mode){
      if(cache[mode])return cache[mode];
      var out=[],prev=IV.slice(),nb=img.length/16;
      for(var b=0;b<nb;b++){var P=img.slice(16*b,16*b+16),Cb;
        if(mode===0)Cb=A.enc(P,K);
        else if(mode===1){Cb=A.enc(A.xor(P,prev),K);prev=Cb;}
        else{var ctr=IV.slice(0,12).concat([0,0,((b+1)>>8)&255,(b+1)&255]);Cb=A.xor(P,A.enc(ctr,K));}
        for(var j=0;j<16;j++)out.push(Cb[j]);}
      cache[mode]=out;return out;}
    function count(arr){var s={},n=arr.length/16;for(var b=0;b<n;b++)s[A.hexs(arr.slice(16*b,16*b+16),"")]=1;return Object.keys(s).length;}
    function draw(){
      var mode=+sel.value,s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var sc=Math.max(1,Math.min((w-48)/(2*Wd),(h-36)/Ht)),iw=Wd*sc,gap=Math.max(12,(w-2*iw)/3),x1=gap,x2=2*gap+iw,y0=26;
      var enc=encImg(mode);
      function paint(arr,x0){
        for(var yy=0;yy<Ht;yy++)for(var xx=0;xx<Wd;xx++){var v=arr[yy*Wd+xx];
          ctx.fillStyle="rgb("+v+","+v+","+v+")";ctx.fillRect(x0+xx*sc,y0+yy*sc,Math.ceil(sc),Math.ceil(sc));}}
      paint(img,x1);paint(enc,x2);
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(x1-.5,y0-.5,iw+1,Ht*sc+1);ctx.strokeRect(x2-.5,y0-.5,iw+1,Ht*sc+1);
      lab(ctx,"平文の絵（1 画素 = 1 バイト）",x1,16,C("--muted"),"left");
      lab(ctx,["ECB","CBC","CTR"][mode]+" で暗号化した結果",x2,16,C("--muted"),"left");
      var nb=img.length/16,a=count(img),c=count(enc);
      ro.innerHTML='ブロック数 '+nb+' ／ 平文の異なるブロック <b>'+a+'</b> 種類 → 暗号文の異なるブロック <b>'+c+'</b> 種類 ／ '+
        (c<nb?'<span class="warn">同じ平文ブロックが同じ暗号文ブロックになり、形が残る</span>':'<span class="ok">暗号文のブロックがすべて異なり、形が消える</span>');
    }
    sel.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 14. aesTamper — 暗号文を書き換えたときの受信者の復号結果 ============ */
  REG.aesTamper=function(el){
    head(el,"Tamper","暗号文を書き換えると、受信者の復号結果はどうなるか");
    var A=AES14,row=ctrls(el);
    var sm=select(row,"利用モード",["ECB","CBC","CTR","GCM"]);
    var sa=select(row,"攻撃者の改ざん",["なし","1 ビット反転（位置はスライダー）","金額の先頭の桁を 0 → 9 に書き換える"]);
    var row2=ctrls(el);var sb=slider(row2,"反転するビットの位置",0,255,37,1);
    var out=panel(el),ro=readout(el);
    var K=A.keys(A.parse("2b7e151628aed2a6abf7158809cf4f3c")).K;
    var MSG="PAY 0100 YEN TO BOB, FROM ALICE.",P=[],i;
    for(i=0;i<MSG.length;i++)P.push(MSG.charCodeAt(i));
    var IV=[0x5f,0x21,0x9c,0x04,0x7e,0xd3,0x18,0xa6,0x33,0xf0,0x6b,0x92,0x0d,0xc4,0x57,0xe8];
    var N=[0xca,0xfe,0xba,0xbe,0xfa,0xce,0xdb,0xad,0xde,0xca,0xf8,0x88];
    function ctrks(n){return A.enc(N.concat([0,0,0,n]),K);}
    function encrypt(mode){
      if(mode===0)return [["C₁",A.enc(P.slice(0,16),K)],["C₂",A.enc(P.slice(16),K)]];
      if(mode===1){var c1=A.enc(A.xor(P.slice(0,16),IV),K),c2=A.enc(A.xor(P.slice(16),c1),K);return [["IV",IV.slice()],["C₁",c1],["C₂",c2]];}
      if(mode===2)return [["C₁",A.xor(P.slice(0,16),ctrks(1))],["C₂",A.xor(P.slice(16),ctrks(2))]];
      var g=A.gcm(K,N,P,true);return [["C₁",g.out.slice(0,16)],["C₂",g.out.slice(16)],["T",g.tag]];
    }
    function decrypt(mode,pr){
      if(mode===0)return {pt:A.dec(pr[0][1],K).concat(A.dec(pr[1][1],K)),ok:true};
      if(mode===1)return {pt:A.xor(A.dec(pr[1][1],K),pr[0][1]).concat(A.xor(A.dec(pr[2][1],K),pr[1][1])),ok:true};
      if(mode===2)return {pt:A.xor(pr[0][1],ctrks(1)).concat(A.xor(pr[1][1],ctrks(2))),ok:true};
      var g=A.gcm(K,N,pr[0][1].concat(pr[1][1]),false);
      return {pt:g.out,ok:A.hexs(g.tag,"")===A.hexs(pr[2][1],"")};
    }
    function run(){
      var mode=+sm.value,att=+sa.value,pr=encrypt(mode),orig=pr.map(function(q){return q[1].slice();});
      var nbits=pr.length*128;sb.input.max=nbits-1;if(+sb.input.value>nbits-1)sb.input.value=nbits-1;
      sb.input.disabled=att!==1;
      var bi=+sb.input.value;sb.val.textContent=bi+"（"+pr[bi>>7][0]+" の先頭から "+(((bi&127)>>3)+1)+" バイト目）";
      var note="";
      if(att===1){pr[bi>>7][1][(bi&127)>>3]^=0x80>>(bi&7);}
      else if(att===2){
        if(mode===1){pr[0][1][4]^=0x09;note="IV の 5 バイト目に 0x09（'0' と '9' の文字コード 0x30・0x39 の XOR）を XOR した";}
        else if(mode===0){pr[0][1][4]^=0x09;note="ECB では狙った 1 バイトだけを変える方法が無い（試しに C₁ の 5 バイト目に 0x09 を XOR した）";}
        else{pr[0][1][4]^=0x09;note="C₁ の 5 バイト目に 0x09（'0' と '9' の文字コード 0x30・0x39 の XOR）を XOR した";}
      }
      var d=decrypt(mode,pr),changed=0,j;
      for(j=0;j<32;j++)if(d.pt[j]!==P[j])changed++;
      var h='<div><span style="color:var(--muted)">送信者の平文:</span> '+esc(MSG)+'</div>';
      h+='<div style="color:var(--muted);margin-top:.5rem">通信路を流れるデータ（攻撃者が書き換えたバイトに色）</div>';
      pr.forEach(function(q,qi){
        h+='<div style="white-space:nowrap"><span style="display:inline-block;width:2.3rem;color:var(--muted)">'+q[0]+'</span>'+q[1].map(function(v,jj){
          var ch=v!==orig[qi][jj];return '<span style="'+(ch?"background:var(--alias-soft);color:var(--alias);font-weight:700;border-radius:3px":"")+'">'+A.h2(v)+'</span>';}).join(" ")+'</div>';});
      h+='<div style="color:var(--muted);margin-top:.5rem">受信者の復号結果</div>';
      if(mode===3&&!d.ok)h+='<div style="color:var(--alias);font-weight:700">認証タグが一致しない → 復号結果を捨てる（何も受け取らない）</div>';
      else h+='<div style="font-size:.95rem;letter-spacing:.05em">'+d.pt.map(function(v,jj){
          var c=(v>=32&&v<127)?String.fromCharCode(v):"·",ch=v!==P[jj];
          return '<span style="'+(ch?"background:var(--alias-soft);color:var(--alias);font-weight:700;border-radius:2px":"")+'">'+(c===" "?"&nbsp;":esc(c))+'</span>';}).join("")+'</div>';
      out.innerHTML=h;
      var res;
      if(mode===3)res=d.ok?'<span class="ok">タグが一致し、平文は送ったとおり</span>':'<span class="ok">改ざんを検知した（受信者は書き換えられた平文を受け取らない）</span>';
      else res=changed?'<span class="warn">復号の処理は書き換えを検出しない（平文の '+changed+' バイトが変わった）</span>':'<span class="ok">平文は送ったとおり</span>';
      ro.innerHTML=(note?note+' ／ ':'')+res;
    }
    [sm,sa].forEach(function(s){s.addEventListener("change",run);});sb.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 15. phiTable — 1〜mn を m 列に並べて φ(mn) = φ(m)φ(n) を確かめる ============ */
  REG.phiTable=function(el){
    head(el,"Euler φ","1〜mn を m 列に並べ、φ(mn) と φ(m)φ(n) を比べる");
    var row=ctrls(el);
    var sm=slider(row,"列の数 m",2,10,3,1),sn=slider(row,"行の数 n",2,10,5,1);
    var out=panel(el),ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function phi(k){var c=0;for(var a=1;a<=k;a++)if(gcd(a,k)===1)c++;return c;}
    function run(){
      var m=+sm.input.value,n=+sn.input.value,c,i;sm.val.textContent=m;sn.val.textContent=n;
      var h='<table style="border-collapse:separate;border-spacing:3px;width:auto"><tr><th style="padding:.1rem .4rem;font-weight:400">m で割った余り</th>';
      for(c=1;c<=m;c++){var r=c%m,ok=gcd(r,m)===1;
        h+='<th style="padding:.1rem .3rem;text-align:center;color:'+(ok?"var(--signal)":"var(--alias)")+'">'+r+'</th>';}
      h+='</tr>';
      for(i=0;i<n;i++){
        h+='<tr><th style="padding:.1rem .4rem;font-weight:400">'+(i+1)+' 行目</th>';
        for(c=1;c<=m;c++){var x=i*m+c,cm=gcd(x,m)===1,cn=gcd(x,n)===1,st;
          if(cm&&cn)st="background:var(--signal-soft);border-color:var(--signal);font-weight:700";
          else if(cm)st="background:var(--alias-soft);border-color:var(--alias);color:var(--alias)";
          else st="color:var(--faint)";
          h+='<td style="min-width:2.9rem;padding:.12rem .3rem;text-align:center;border:1px solid var(--line);border-radius:4px;'+st+'">'+x+
            '<span style="font-size:.66rem;color:var(--muted);margin-left:.35rem;font-weight:400">'+(x%n)+'</span></td>';}
        h+='</tr>';}
      h+='</table><div style="margin-top:.4rem;color:var(--muted)">マスの右の小さな数字は n で割った余り。緑 = mn と互いに素、赤 = m とは互いに素だが n とは素でない、薄字 = m と互いに素でない列</div>';
      var lines=[];
      for(c=1;c<=m;c++){if(gcd(c%m,m)!==1)continue;
        var rs=[],seen={},dup=false;for(i=0;i<n;i++){var v=(i*m+c)%n;rs.push(v);if(seen[v])dup=true;seen[v]=1;}
        lines.push('<span style="color:'+(dup?"var(--alias)":"var(--signal)")+'">余り '+(c%m)+' の列: '+rs.join(",")+(dup?"（重なりあり）":"")+'</span>');}
      h+='<div style="margin-top:.2rem">n で割った余りの並び　'+lines.join("　")+'</div>';
      out.innerHTML=h;
      var pm=phi(m),pn=phi(n),pmn=phi(m*n),g=gcd(m,n);
      ro.innerHTML='φ(m) = '+pm+'、φ(n) = '+pn+'、φ(m)φ(n) = <b>'+(pm*pn)+'</b> ／ 数えた φ('+(m*n)+') = <b>'+pmn+'</b> ／ '+
        (g===1?'<span class="ok">m と n が互いに素なので一致する</span>':'<span class="warn">gcd(m, n) = '+g+' なので列の中で余りが重なり、一致しない</span>');
    }
    sm.input.addEventListener("input",run);sn.input.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 15. crtGrid — 余りの組のマスに数を書き込む ============ */
  REG.crtGrid=function(el){
    head(el,"CRT","x を (x mod m₁, x mod m₂) のマスに書き込み、解を作る");
    var row=ctrls(el);
    var s1=slider(row,"法 m₁",2,9,3,1),s2=slider(row,"法 m₂",2,9,5,1);
    var row2=ctrls(el);
    var t1=slider(row2,"余り a₁",0,8,2,1),t2=slider(row2,"余り a₂",0,8,3,1);
    var out=panel(el),ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function inv(a,m){a%=m;for(var x=1;x<m;x++)if(a*x%m===1)return x;return null;}
    function run(){
      var m1=+s1.input.value,m2=+s2.input.value,i,j;
      t1.input.max=m1-1;if(+t1.input.value>m1-1)t1.input.value=m1-1;
      t2.input.max=m2-1;if(+t2.input.value>m2-1)t2.input.value=m2-1;
      var a1=+t1.input.value,a2=+t2.input.value;
      s1.val.textContent=m1;s2.val.textContent=m2;t1.val.textContent=a1;t2.val.textContent=a2;
      var M=m1*m2,cells=[];
      for(i=0;i<m1;i++){cells.push([]);for(j=0;j<m2;j++)cells[i].push([]);}
      for(var x=0;x<M;x++)cells[x%m1][x%m2].push(x);
      var h='<div style="color:var(--muted);margin-bottom:.2rem">0〜'+(M-1)+' の各 x を、行 = x mod '+m1+'、列 = x mod '+m2+' のマスに書き込む（黒枠が余りの組 ('+a1+', '+a2+')）</div>';
      h+='<table style="border-collapse:separate;border-spacing:3px;width:auto"><tr><th style="padding:.1rem .3rem"></th>';
      for(j=0;j<m2;j++)h+='<th style="padding:.1rem .3rem;text-align:center">'+j+'</th>';
      h+='</tr>';
      var empty=0,multi=0;
      for(i=0;i<m1;i++){
        h+='<tr><th style="padding:.1rem .3rem;text-align:center">'+i+'</th>';
        for(j=0;j<m2;j++){var c=cells[i][j],st;
          if(!c.length){empty++;st="background:var(--screen);color:var(--faint)";}
          else if(c.length>1){multi++;st="background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700";}
          else st="background:var(--signal-soft);border-color:var(--signal)";
          if(i===a1&&j===a2)st+=";outline:2px solid var(--ink)";
          h+='<td style="min-width:2.3rem;padding:.15rem .3rem;text-align:center;border:1px solid var(--line);border-radius:4px;'+st+'">'+(c.length?c.join(","):"空")+'</td>';}
        h+='</tr>';}
      h+='</table>';
      var g=gcd(m1,m2);
      if(g===1){
        var M1=m2,N1=inv(M1,m1),M2=m1,N2=inv(M2,m2),xx=(a1*M1*N1+a2*M2*N2)%M;
        h+='<div style="margin-top:.5rem">M = '+m1+'·'+m2+' = '+M+'、M₁ = '+M1+'、N₁ = '+M1+'⁻¹ mod '+m1+' = '+N1+'、M₂ = '+M2+'、N₂ = '+M2+'⁻¹ mod '+m2+' = '+N2+'</div>';
        h+='<div>x = a₁M₁N₁ + a₂M₂N₂ mod M = '+a1+'·'+M1+'·'+N1+' + '+a2+'·'+M2+'·'+N2+' mod '+M+' = <b style="color:var(--signal)">'+xx+'</b>'+
          '　<span style="color:var(--muted)">検算: '+xx+' mod '+m1+' = '+(xx%m1)+'、'+xx+' mod '+m2+' = '+(xx%m2)+'</span></div>';
        ro.innerHTML='余りの組 ('+a1+', '+a2+') の解 x = <b class="ok">'+xx+'</b> ／ <span class="ok">'+M+' 個のマスがちょうど 1 回ずつ埋まる</span>';
      }else{
        h+='<div style="margin-top:.5rem;color:var(--alias)">gcd(m₁, m₂) = '+g+' なので、M₁ = '+m2+' が法 '+m1+' で逆元を持たず、上の作り方が使えない</div>';
        var c0=cells[a1][a2];
        ro.innerHTML='<span class="warn">空きのマス '+empty+' 個、2 つ以上の数が入るマス '+multi+' 個</span> ／ 余りの組 ('+a1+', '+a2+') の解: '+
          (c0.length?c0.length+' 個（'+c0.join(", ")+'）':'無い');
      }
      out.innerHTML=h;
    }
    [s1,s2,t1,t2].forEach(function(o){o.input.addEventListener("input",run);});reg(null,run);run();
  };

  /* ============ 15. orderCycle — x → ax mod n の矢印が同じ長さの輪に分かれる ============ */
  REG.orderCycle=function(el){
    head(el,"Order","n と互いに素な数に a を掛け続けると、同じ長さの輪に分かれる");
    var row=ctrls(el);
    var sn=slider(row,"法 n",3,36,10,1),sa=slider(row,"掛ける数 a",1,35,3,1);
    var cv=screen(el,340),cc=cctx(cv),ro=readout(el);
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function ordr(x,n){var d=1,v=x%n;while(v!==1){v=v*x%n;d++;}return d;}
    function arrow(ctx,x1,y1,x2,y2,col,lw,rr){
      var dx=x2-x1,dy=y2-y1,L=Math.sqrt(dx*dx+dy*dy);if(L<1)return;
      var ux=dx/L,uy=dy/L,sx=x1+ux*rr,sy=y1+uy*rr,ex=x2-ux*(rr+2),ey=y2-uy*(rr+2);
      ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex-ux*6,ey-uy*6);ctx.stroke();
      ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-ux*8-uy*4,ey-uy*8+ux*4);ctx.lineTo(ex-ux*8+uy*4,ey-uy*8-ux*4);ctx.closePath();ctx.fill();}
    function draw(){
      var n=+sn.input.value;sa.input.max=n-1;if(+sa.input.value>n-1)sa.input.value=n-1;
      var a=+sa.input.value;sn.val.textContent=n;sa.val.textContent=a;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var U=[],x;for(x=1;x<n;x++)if(gcd(x,n)===1)U.push(x);
      var ph=U.length;
      if(gcd(a,n)!==1){
        lab(ctx,"a = "+a+" は n = "+n+" と互いに素でないので、この群の要素ではない",16,30,C("--alias"),"left");
        ro.innerHTML='<span class="warn">gcd(a, n) = '+gcd(a,n)+' ≠ 1。a を n と互いに素な数にする</span>';return;}
      var d=ordr(a,n),seen={},cycles=[];
      U.forEach(function(u){if(seen[u])return;var cyc=[],y=u;while(!seen[y]){seen[y]=1;cyc.push(y);y=y*a%n;}cycles.push(cyc);});
      var cx=w/2,cy=h/2+4,R=Math.min(w*0.42,h/2-26),rr=ph>16?10:12,pos={};
      U.forEach(function(u,i){var ang=-Math.PI/2+TAU*i/ph;pos[u]=[cx+R*Math.cos(ang),cy+R*Math.sin(ang)];});
      var others=[C("--blue"),C("--alias"),C("--muted")];
      cycles.forEach(function(cyc,ci){
        var col=ci===0?C("--signal"):others[(ci-1)%others.length],lw=ci===0?2.2:1.3;
        cyc.forEach(function(u){var v=u*a%n,p1=pos[u],p2=pos[v];
          if(v===u){ctx.strokeStyle=col;ctx.lineWidth=lw;var ox=(p1[0]-cx)/R,oy=(p1[1]-cy)/R;
            ctx.beginPath();ctx.arc(p1[0]+ox*(rr+6),p1[1]+oy*(rr+6),6,0,TAU);ctx.stroke();}
          else arrow(ctx,p1[0],p1[1],p2[0],p2[1],col,lw,rr);});
      });
      U.forEach(function(u){var p=pos[u],inOne=cycles[0].indexOf(u)>=0;
        ctx.beginPath();ctx.arc(p[0],p[1],rr,0,TAU);ctx.fillStyle=inOne?C("--signal-soft"):C("--panel");ctx.fill();
        ctx.strokeStyle=inOne?C("--signal"):C("--muted");ctx.lineWidth=1.4;ctx.stroke();
        ctx.fillStyle=C("--ink");ctx.font=(ph>16?"10px ":"11px ")+C("--mono");ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(u),p[0],p[1]+.5);});
      ctx.textBaseline="alphabetic";
      lab(ctx,"緑の輪 = 1 を含む輪 ⟨a⟩",12,18,C("--signal"),"left");
      var prs=U.filter(function(u){return ordr(u,n)===ph;});
      var ap=1;for(var k=0;k<ph;k++)ap=ap*a%n;
      ro.innerHTML='φ('+n+') = <b>'+ph+'</b> ／ '+a+' の位数 = <b>'+d+'</b> ／ 輪 <b>'+cycles.length+'</b> 本 × 長さ '+d+' = '+ph+
        ' ／ '+a+'<sup>φ('+n+')</sup> mod '+n+' = '+ap+' ／ 原始根: '+(prs.length?'<b class="ok">'+prs.join(", ")+'</b>（'+prs.length+' 個）':'<span class="warn">無い</span>');
    }
    sn.input.addEventListener("input",draw);sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 15. dlogBsgs — gˣ の並びと Baby-step Giant-step ============ */
  REG.dlogBsgs=function(el){
    head(el,"Discrete Log","gˣ mod p の並びと、Baby-step Giant-step の手順");
    var row=ctrls(el);
    var primes=[23,47,101,233,509,1019,2027];
    var sp=select(row,"素数 p",primes.map(String));
    var sy=slider(row,"y",1,22,8,1);
    var cv=screen(el,220),cc=cctx(cv),out=panel(el),ro=readout(el);
    function pw(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=r*b%m;b=b*b%m;e=Math.floor(e/2);}return r;}
    function proot(p){var f=[],q=p-1,d;for(d=2;d*d<=q;d++)if(q%d===0){f.push(d);while(q%d===0)q/=d;}if(q>1)f.push(q);
      for(var g=2;g<p;g++){if(f.every(function(r){return pw(g,(p-1)/r,p)!==1;}))return g;}return null;}
    function draw(){
      var p=primes[+sp.value],g=proot(p);
      sy.input.max=p-1;if(+sy.input.value>p-1)sy.input.value=p-1;
      var y=+sy.input.value;sy.val.textContent=y;
      var xs=0,v=1;while(v!==y){v=v*g%p;xs++;}
      var c=chart(cc,0,p-2,1,p-1,{l:44,b:26,t:24,r:14}),ctx=c.ctx;
      function labBg(t,x0,y0,col,al){ctx.font="11px "+C("--mono");var tw=ctx.measureText(t).width,lx=al==="right"?x0-tw:x0;
        ctx.fillStyle=C("--screen");ctx.fillRect(lx-3,y0-11,tw+6,15);lab(ctx,t,x0,y0,col,al);}
      grid(c,4);axis(c);
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(c.p.l,c.Y(y));ctx.lineTo(c.w-c.p.r,c.Y(y));ctx.stroke();ctx.setLineDash([]);
      v=1;var rad=p>600?1.6:(p>150?2.2:3);
      for(var x=0;x<p-1;x++){dot(c,x,v,rad,C("--signal"));v=v*g%p;}
      dot(c,xs,y,6,C("--alias"),true);
      lab(ctx,"x",c.X((p-2)/2),c.h-8,C("--muted"),"center");lab(ctx,"gˣ mod p",c.p.l+6,c.p.t-8,C("--muted"),"left");lab(ctx,"0",c.p.l,c.h-8,C("--muted"),"center");lab(ctx,String(p-2),c.X(p-2),c.h-8,C("--muted"),"center");
      lab(ctx,"1",c.p.l-6,c.Y(1)+4,C("--muted"),"right");lab(ctx,String(p-1),c.p.l-6,c.Y(p-1)+4,C("--muted"),"right");
      labBg("y = "+y,c.w-c.p.r-4,c.Y(y)-5,C("--alias"),"right");
      var m=Math.ceil(Math.sqrt(p-1)),baby={},bl=[];v=1;
      for(var i=0;i<m;i++){if(baby[v]===undefined)baby[v]=i;bl.push(v);v=v*g%p;}
      var gm=pw(g,m,p),gim=pw(gm,p-2,p),cur=y,steps=[],found=null;
      for(var j=0;j<=m;j++){var hit=baby[cur];steps.push([j,cur,hit]);if(hit!==undefined){found=j*m+hit;break;}cur=cur*gim%p;}
      var h='<div>p = '+p+'、原始根 g = '+g+'、m = ⌈√'+(p-1)+'⌉ = '+m+'、g<sup>m</sup> = '+gm+'、g<sup>−m</sup> = '+gim+'</div>';
      var hb=steps.length?steps[steps.length-1][2]:-1;
      h+='<div style="margin-top:.35rem;color:var(--muted)">① baby step（g<sup>i</sup>, i = 0〜'+(m-1)+'）</div><div style="display:flex;flex-wrap:wrap;gap:.2rem .5rem">';
      bl.forEach(function(b,k){if(k<14||k===hb)h+='<span style="'+(k===hb?"color:var(--signal);font-weight:700":"")+'">'+k+':'+b+'</span>';else if(k===14)h+='<span>…</span>';});
      h+='</div><div style="margin-top:.35rem;color:var(--muted)">② giant step（y·(g<sup>−m</sup>)<sup>j</sup> を表と照合）</div><div style="display:flex;flex-wrap:wrap;gap:.2rem .6rem">';
      steps.forEach(function(st){h+='<span style="'+(st[2]!==undefined?"color:var(--alias);font-weight:700":"")+'">j='+st[0]+': '+st[1]+(st[2]!==undefined?' → 表の i = '+st[2]:"")+'</span>';});
      h+='</div><div style="margin-top:.35rem">x = j·m + i = '+steps[steps.length-1][0]+'·'+m+' + '+hb+' = <b style="color:var(--alias)">'+found+'</b></div>';
      out.innerHTML=h;
      ro.innerHTML=g+'<sup>'+found+'</sup> mod '+p+' = '+y+' ／ 総当たり: g<sup>0</sup> から順に <b>'+(xs+1)+'</b> 個を計算 ／ BSGS: baby '+m+' 回 + giant '+steps.length+' 回 = <b>'+(m+steps.length)+'</b> 回（最大でも約 2√p ≈ '+Math.round(2*Math.sqrt(p))+' 回）';
    }
    sp.addEventListener("change",draw);sy.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 15. millerRabin — 列 x₀, …, xₛ と判定 ============ */
  REG.millerRabin=function(el){
    head(el,"Miller–Rabin","2 乗を繰り返す列 x₀, x₁, …, xₛ で合成数を見つける");
    var row=ctrls(el);
    var tn=textin(row,"判定する奇数 n","561","130px"),ta=textin(row,"底 a","2","90px");
    var out=panel(el),ro=readout(el);
    function mm(a,b,m){return Number((BigInt(a)*BigInt(b))%BigInt(m));}
    function pw(b,e,m){var r=1;b%=m;while(e>0){if(e&1)r=mm(r,b,m);b=mm(b,b,m);e=Math.floor(e/2);}return r;}
    function gcd(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function seq(n,a){var d=n-1,s=0;while(d%2===0){d/=2;s++;}var xs=[pw(a,d,n)];for(var k=0;k<s;k++)xs.push(mm(xs[k],xs[k],n));return {d:d,s:s,xs:xs};}
    function pass(n,xs,s){if(xs[0]===1)return true;for(var k=0;k<s;k++)if(xs[k]===n-1)return true;return false;}
    function isPrime(n){if(n<2)return false;for(var q=2;q*q<=n;q++)if(n%q===0)return false;return true;}
    function liars(n){var c=0,d=n-1,s=0;while(d%2===0){d/=2;s++;}
      for(var a=2;a<=n-2;a++){var x=1,b=a,e=d;while(e>0){if(e&1)x=x*b%n;b=b*b%n;e=Math.floor(e/2);}
        if(x===1||x===n-1){c++;continue;}for(var k=1;k<s;k++){x=x*x%n;if(x===n-1){c++;break;}}}
      return c;}
    function run(){
      var n=parseInt(tn.value,10),a=parseInt(ta.value,10);
      if(!(n>=5&&n%2===1&&n<1e9)){out.innerHTML='<span style="color:var(--alias)">n は 5 以上 10 億未満の奇数を入れる</span>';ro.innerHTML="";return;}
      if(!(a>=2&&a<=n-2)){out.innerHTML='<span style="color:var(--alias)">a は 2 以上 n − 2 以下の整数を入れる</span>';ro.innerHTML="";return;}
      var r=seq(n,a),ok=pass(n,r.xs,r.s),bad=-1,k;
      for(k=0;k<r.s;k++)if(r.xs[k]!==1&&r.xs[k]!==n-1&&r.xs[k+1]===1){bad=k;break;}
      var h='<div>n − 1 = '+(n-1)+' = 2<sup>'+r.s+'</sup> × '+r.d+'（s = '+r.s+'、d = '+r.d+'）</div><div style="display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;margin-top:.4rem">';
      r.xs.forEach(function(v,i){
        var st=v===1||v===n-1?"background:var(--signal-soft);border-color:var(--signal)":(i===bad?"background:var(--alias-soft);border-color:var(--alias);color:var(--alias);font-weight:700":"");
        h+='<span style="display:inline-block;text-align:center"><span style="display:block;font-size:.68rem;color:var(--muted)">x<sub>'+i+'</sub></span>'+
          '<span style="display:inline-block;min-width:2.4rem;padding:.15rem .4rem;border:1px solid var(--line);border-radius:5px;'+st+'">'+v+(v===n-1&&n>3?" (−1)":"")+'</span></span>';
        if(i<r.xs.length-1)h+='<span style="color:var(--muted)">→²</span>';});
      h+='</div>';
      if(bad>=0){var z=r.xs[bad];
        h+='<div style="margin-top:.4rem;color:var(--alias)">x<sub>'+bad+'</sub> = '+z+' は ±1 でないのに 2 乗すると 1 → (z − 1)(z + 1) ≡ 0 で、gcd('+(z-1)+', '+n+') = '+gcd(z-1,n)+'、gcd('+(z+1)+', '+n+') = '+gcd(z+1,n)+' は n の約数</div>';}
      else if(!ok&&r.xs[r.s]!==1)h+='<div style="margin-top:.4rem;color:var(--alias)">x<sub>'+r.s+'</sub> = a<sup>n−1</sup> mod n が 1 でない → フェルマー・テストの段階で合成数</div>';
      if(gcd(a,n)!==1)h+='<div style="color:var(--muted)">（a と n が共通の約数 '+gcd(a,n)+' を持つ）</div>';
      out.innerHTML=h;
      var pr=isPrime(n),txt='判定: '+(ok?'<b class="ok">たぶん素数</b>':'<b class="warn">確実に合成数</b>')+' ／ 実際は '+(pr?'素数':'合成数');
      if(!pr&&n<=20000){var L=liars(n);txt+=' ／ 誤判定させる a: '+(n-3)+' 個中 <b>'+L+'</b> 個（'+(100*L/(n-3)).toFixed(1)+'%、1/4 以下）';}
      ro.innerHTML=txt;
    }
    tn.addEventListener("input",run);ta.addEventListener("input",run);reg(null,run);run();
  };

  /* ============ 16. 共通: BigInt による整数の計算（ほかの章と名前が衝突しないよう R16 にまとめる） ============ */
  var R16=(function(){
    function big(s){s=String(s).trim();if(!/^\d+$/.test(s))return null;try{return BigInt(s);}catch(e){return null;}}
    function mod(a,m){var r=a%m;return r<0n?r+m:r;}
    function powmod(b,e,m){var r=1n;b=mod(b,m);while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return m===1n?0n:r;}
    function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){var t=a%b;a=b;b=t;}return a;}
    /* 拡張ユークリッド: r0 = a, r1 = b から始め、r_i = a x_i + b y_i を保つ */
    function egcd(a,b){var r=[a,b],x=[1n,0n],y=[0n,1n],q=[];
      while(r[r.length-1]!==0n){var i=r.length-1,qq=r[i-1]/r[i];q.push(qq);
        r.push(r[i-1]-qq*r[i]);x.push(x[i-1]-qq*x[i]);y.push(y[i-1]-qq*y[i]);}
      return {r:r,x:x,y:y,q:q};}
    function inv(a,m){var t=egcd(m,mod(a,m)),k=t.r.length-2;if(t.r[k]!==1n)return null;return mod(t.y[k],m);}
    var SP=[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
    function isPrime(n){if(n<2n)return false;
      for(var i=0;i<SP.length;i++){if(n===SP[i])return true;if(n%SP[i]===0n)return false;}
      var d=n-1n,s=0;while((d&1n)===0n){d>>=1n;s++;}
      for(var j=0;j<SP.length;j++){var x=powmod(SP[j],d,n);if(x===1n||x===n-1n)continue;
        var ok=false;for(var r=1;r<s;r++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}
      return true;}
    function bits(x){return x.toString(2);}
    function ops(x){var b=bits(x);return {sq:b.length-1,mul:(b.match(/1/g)||[]).length-1};}
    function sup(a,b){return a+'<sup>'+b+'</sup>';}
    var RED='color:var(--alias)',BLUE='color:var(--blue)',SIGC='color:var(--signal)',FAINT='color:var(--faint)';
    return {big:big,mod:mod,powmod:powmod,gcd:gcd,egcd:egcd,inv:inv,isPrime:isPrime,bits:bits,ops:ops,sup:sup,
      RED:RED,BLUE:BLUE,SIGC:SIGC,FAINT:FAINT};
  })();

  /* ============ 16. rsaflow — 鍵生成から暗号化・復号まで ============ */
  REG.rsaflow=function(el){
    head(el,"RSA","鍵生成から暗号化・復号まで");
    var row=ctrls(el);
    var ip=textin(row,"素数 p","61"),iq=textin(row,"素数 q","53"),ie=textin(row,"公開指数 e","17"),im=textin(row,"平文 M","65");
    var show=checkbox(ctrls(el),"d を求める拡張ユークリッドの表を表示する",false);
    var out=panel(el),rd=readout(el);
    function bad(msg){out.innerHTML='<span style="'+R16.RED+'">'+msg+'</span>';rd.innerHTML="";}
    function line(t,cls){return '<div>'+t+(cls?' <span style="'+cls[1]+'">（'+cls[0]+'）</span>':'')+'</div>';}
    function run(){
      var p=R16.big(ip.value),q=R16.big(iq.value),e=R16.big(ie.value),M=R16.big(im.value);
      if(p===null||q===null||e===null||M===null)return bad("p、q、e、M には 0 以上の整数を入れる");
      if(p.toString().length>160||q.toString().length>160)return bad("p、q は 160 桁までにする");
      if(!R16.isPrime(p)||!R16.isPrime(q))return bad("p と q はどちらも素数にする（"+(!R16.isPrime(p)?"p":"q")+" が素数でない）");
      if(p===q)return bad("p と q は異なる素数にする");
      var n=p*q,phi=(p-1n)*(q-1n);
      if(e<=1n||e>=phi)return bad("e は 1 < e < φ(n) = "+phi+" の範囲にする");
      var g=R16.gcd(e,phi);
      if(g!==1n)return bad("gcd(e, φ(n)) = gcd("+e+", "+phi+") = "+g+" ≠ 1 なので、e の逆元 d が存在しない。e を変える");
      if(M>=n)return bad("平文 M は n = "+n+" 未満にする");
      var d=R16.inv(e,phi),ct=R16.powmod(M,e,n),back=R16.powmod(ct,d,n);
      var oe=R16.ops(e),od=R16.ops(d);
      var h='<div style="color:var(--muted)">鍵生成（Bob）</div>';
      h+=line('n = p × q = '+p+' × '+q+' = <b style="'+R16.BLUE+'">'+n+'</b>',["公開",R16.BLUE]);
      h+=line('φ(n) = (p − 1)(q − 1) = '+(p-1n)+' × '+(q-1n)+' = <b style="'+R16.RED+'">'+phi+'</b>',["秘密",R16.RED]);
      h+=line('e = <b style="'+R16.BLUE+'">'+e+'</b>、gcd(e, φ(n)) = 1',["公開",R16.BLUE]);
      h+=line('d = e<sup>−1</sup> mod φ(n) = <b style="'+R16.RED+'">'+d+'</b>　<span style="'+R16.FAINT+'">検算: e × d mod φ(n) = '+(e*d%phi)+'</span>',["秘密",R16.RED]);
      if(show.checked){
        var t=R16.egcd(phi,e),rows=[],k=t.r.length-2,N=Math.min(t.r.length,32);
        for(var i=0;i<N;i++){var last=i===t.r.length-1;
          rows.push([i,(i===k?'<b>'+t.r[i]+'</b>':t.r[i]),(i>=1&&i<=t.q.length?t.q[i-1]:"—"),last?"":t.x[i],last?"":(i===k?'<b style="'+R16.RED+'">'+t.y[i]+'</b>':t.y[i])]);}
        h+='<div style="margin:.4rem 0 .2rem;color:var(--muted)">r₀ = φ(n)、r₁ = e から始め、各行で r = φ(n)·x + e·y を保つ（商は 1 行上の r をその行の r で割った商）</div>';
        h+=tbl(["i","r","商","x","y"],rows,["right","right","right","right","right"]);
        if(t.r.length>N)h+='<div style="'+R16.FAINT+'">（表は 32 行までを表示）</div>';
        h+='<div>r = 1 の行の y = '+t.y[k]+' を法 φ(n) で 0 以上にした値が d = '+d+'</div>';
      }
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line);color:var(--muted)">暗号化（Alice、公開鍵だけを使う）</div>';
      h+='<div>C = '+R16.sup('M','e')+' mod n = '+R16.sup(M,e)+' mod '+n+' = <b style="'+R16.SIGC+'">'+ct+'</b>　<span style="'+R16.FAINT+'">2 乗 '+oe.sq+' 回 + 掛け算 '+oe.mul+' 回</span></div>';
      h+='<div style="margin-top:.4rem;color:var(--muted)">復号（Bob、秘密鍵 d を使う）</div>';
      h+='<div>'+R16.sup('C','d')+' mod n = '+R16.sup(ct,d)+' mod '+n+' = <b style="'+R16.SIGC+'">'+back+'</b>　<span style="'+R16.FAINT+'">2 乗 '+od.sq+' 回 + 掛け算 '+od.mul+' 回</span></div>';
      out.innerHTML=h;
      rd.innerHTML=(back===M?'<span class="ok">復号すると M = '+M+' に戻る</span>':'<span class="warn">戻らない</span>')+
        ' ／ 公開されるのは n、e、C だけ（青）。赤の値を知らずに d を求めるには n を素因数分解する必要がある';
    }
    [ip,iq,ie,im].forEach(function(x){x.addEventListener("input",run);});show.addEventListener("change",run);run();
  };

  /* ============ 16. rsacycle — M^k mod n の列が M に戻る ============ */
  REG.rsacycle=function(el){
    head(el,"Cycle","Mᵏ mod n を k = 1 から並べる");
    var row=ctrls(el);
    var PR=[3,5,7,11,13];
    var sp=select(row,"素数 p",PR.map(String)),sq=select(row,"素数 q",PR.map(String));
    sp.value="1";sq.value="3";
    var row2=ctrls(el);
    var sm=slider(row2,"平文 M",0,54,2,1),se=select(row2,"公開指数 e",["3"]);
    var out=panel(el),rd=readout(el);
    function g(a,b){while(b){var t=a%b;a=b;b=t;}return a;}
    function pw(b,e,m){var r=1;b%=m;for(var i=0;i<e;i++)r=r*b%m;return r;}
    function period(M,m){var x=M%m;for(var t=1;t<=m*m;t++){if(pw(M,1+t,m)===x)return t;}return 0;}
    var lastPQ="";
    function run(){
      var p=PR[+sp.value],q=PR[+sq.value];
      if(p===q){out.innerHTML='<span style="'+R16.RED+'">p と q は異なる素数にする</span>';rd.innerHTML="";return;}
      var n=p*q,phi=(p-1)*(q-1);
      if(lastPQ!==p+","+q){lastPQ=p+","+q;
        var es=[];for(var e=3;e<phi&&es.length<12;e++)if(g(e,phi)===1)es.push(e);
        var cur=se.options[se.selectedIndex]?+se.options[se.selectedIndex].text:3;
        se.innerHTML=es.map(function(v,i){return '<option value="'+i+'">'+v+'</option>';}).join("");
        var j=es.indexOf(cur);se.value=String(j>=0?j:0);
        sm.input.max=n-1;if(+sm.input.value>n-1)sm.input.value=n-1;}
      var M=+sm.input.value,e=+se.options[se.selectedIndex].text,d=0;
      for(var x=1;x<phi;x++)if(e*x%phi===1){d=x;break;}
      sm.val.textContent=M;
      var t=period(M,n),tp=period(M,p),tq=period(M,q),L=phi+1;
      var per=(t>=2&&t<=20)?t*Math.floor(20/t):20;
      var h='<div style="color:var(--muted);margin-bottom:.3rem">n = '+n+'、φ(n) = '+phi+'。各行に '+per+' 個ずつ並べる（色付き = M と同じ値、枠 = k = φ(n) + 1）</div>';
      for(var r=0;r*per<L;r++){
        h+='<div style="white-space:nowrap;margin:.12rem 0"><span style="display:inline-block;width:4.6em;color:var(--faint);font-size:.72rem">k='+(r*per+1)+'〜</span>';
        for(var c=0;c<per&&r*per+c<L;c++){var k=r*per+c+1,v=pw(M,k,n),on=v===M%n,fin=k===L;
          h+='<span style="display:inline-block;width:2.2em;text-align:center;margin-right:2px;border-radius:4px;'+
            'border:'+(fin?'2px solid var(--alias)':'1px solid var(--line)')+';background:'+(on?'var(--signal-soft)':'var(--panel)')+
            ';color:'+(on?'var(--signal)':'var(--ink)')+';font-weight:'+(on?'700':'400')+'">'+v+'</span>';}
        h+='</div>';}
      out.innerHTML=h;
      var ed=e*d,kk=(ed-1)/phi;
      function side(m,tt){return (M%m===0)?'法 '+m+' では M ≡ 0 なので常に 0':'法 '+m+' では '+tt+' ごとに M mod '+m+' = '+(M%m)+' に戻る';}
      rd.innerHTML='e = '+e+'、d = '+d+'、ed = '+ed+' = 1 + '+kk+' × '+phi+' ／ '+side(p,tp)+'、'+side(q,tq)+
        ' ／ 全体では <b>'+t+'</b> ごとに M に戻り、'+t+' は φ(n) = '+phi+' の約数 ／ '+
        '<span class="ok">M<sup>ed</sup> mod n = '+pw(M,ed,n)+' = M</span>'+(g(M,n)!==1&&M!==0?' （M は n と互いに素でない: 3 節の場合 2）':'');
    }
    [sp,sq,se].forEach(function(x){x.addEventListener("change",run);});sm.input.addEventListener("input",run);run();
  };

  /* ============ 16. rsasign — 署名と検証 ============ */
  REG.rsasign=function(el){
    head(el,"Signature","秘密鍵で署名し、公開鍵で確かめる");
    var row=ctrls(el);
    var ih=textin(row,"Bob が署名するハッシュ値 h","123"),iv=textin(row,"検証者が計算したハッシュ値","123");
    var tamper=checkbox(ctrls(el),"届いた署名 σ を 1 だけ書き換える",false);
    var out=panel(el),rd=readout(el);
    var n=3233n,e=17n,d=2753n;
    function run(){
      var h=R16.big(ih.value),hv=R16.big(iv.value);
      if(h===null||hv===null||h>=n||hv>=n){out.innerHTML='<span style="'+R16.RED+'">ハッシュ値は 0〜3232 の整数にする（n = 3233 未満）</span>';rd.innerHTML="";return;}
      var s=R16.powmod(h,d,n),sr=tamper.checked?(s+1n)%n:s,back=R16.powmod(sr,e,n),ok=back===hv;
      var H='<div style="color:var(--muted)">鍵: 公開鍵 (n, e) = (3233, 17)、秘密鍵 d = 2753（1 節）</div>';
      H+='<div style="margin-top:.4rem">署名（Bob）: σ = '+R16.sup('h','d')+' mod n = '+R16.sup(h,d)+' mod 3233 = <b style="'+R16.RED+'">'+s+'</b></div>';
      H+='<div>送るもの: メッセージと σ'+(tamper.checked?'　<span style="'+R16.RED+'">→ 途中で σ が '+sr+' に書き換えられた</span>':'')+'</div>';
      H+='<div style="margin-top:.4rem">検証（誰でも）: '+R16.sup('σ','e')+' mod n = '+R16.sup(sr,e)+' mod 3233 = <b style="'+R16.BLUE+'">'+back+'</b>'+
        '　と、届いたメッセージから計算したハッシュ値 <b>'+hv+'</b> を比べる</div>';
      out.innerHTML=H;
      rd.innerHTML=ok?'<span class="ok">一致 → 署名は有効</span> ／ σ を作れるのは d を持つ Bob だけ':
        '<span class="warn">不一致 → 署名は無効（改ざんを検出）</span> ／ '+(hv!==h?'メッセージが書き換えられると、ハッシュ値 '+hv+' に対する正しい署名は '+R16.powmod(hv,d,n)+' だが、それを作るには d が要る':'σ を書き換えると、e 乗しても h に戻らない');
    }
    [ih,iv].forEach(function(x){x.addEventListener("input",run);});tamper.addEventListener("change",run);run();
  };

  /* ============ 16. rsablind — ブラインディング攻撃 ============ */
  REG.rsablind=function(el){
    head(el,"Blinding","復号オラクルから狙いの平文を引き出す");
    var row=ctrls(el);
    var im=textin(row,"狙いの平文 M（Eve は知らない）","65"),sr=slider(row,"Eve が選ぶ r",1,80,2,1);
    var out=panel(el),rd=readout(el);
    var n=3233n,e=17n,d=2753n;
    function run(){
      var M=R16.big(im.value);sr.val.textContent=sr.input.value;
      if(M===null||M>=n){out.innerHTML='<span style="'+R16.RED+'">M は 0〜3232 の整数にする</span>';rd.innerHTML="";return;}
      var r=BigInt(sr.input.value),ct=R16.powmod(M,e,n),re=R16.powmod(r,e,n),c2=ct*re%n;
      var h='<div>① 盗聴した暗号文: C = '+R16.sup(M,17)+' mod 3233 = <b>'+ct+'</b>（Eve は C と公開鍵 (3233, 17) だけを知っている）</div>';
      h+='<div>② Eve: '+R16.sup('r','e')+' mod n = '+R16.sup(r,17)+' mod 3233 = '+re+'、C′ = C × '+R16.sup('r','e')+' mod n = '+ct+' × '+re+' mod 3233 = <b style="'+R16.RED+'">'+c2+'</b></div>';
      var g=R16.gcd(r,n);
      if(c2===ct){h+='<div>③ オラクル: C′ = C なので<b style="'+R16.RED+'">復号を断る</b></div>';out.innerHTML=h;
        rd.innerHTML='<span class="warn">r = 1 では C′ が C と同じになり、断られる。r を変える</span>';return;}
      var m2=R16.powmod(c2,d,n);
      h+='<div>③ オラクル: C′ ≠ C なので復号して返す: '+R16.sup("C′",'d')+' mod n = <b>'+m2+'</b></div>';
      if(g!==1n){h+='<div>④ r と n が共通の約数 '+g+' を持つので r の逆元は無い</div>';out.innerHTML=h;
        rd.innerHTML='<span class="warn">gcd(r, n) = '+g+'。ただしこの場合は gcd から n = '+g+' × '+(n/g)+' と素因数分解できてしまう</span>';return;}
      var ri=R16.inv(r,n),rec=m2*ri%n;
      h+='<div>④ Eve: '+R16.sup('r','−1')+' mod n = '+ri+'、M = '+m2+' × '+ri+' mod 3233 = <b style="'+R16.SIGC+'">'+rec+'</b></div>';
      out.innerHTML=h;
      rd.innerHTML=(rec===M?'<span class="ok">M = '+rec+' を復元</span>':'<span class="warn">失敗</span>')+' ／ オラクルが返したのは M × r mod n = '+M+' × '+r+' mod 3233 = '+(M*r%n)+'。C そのものは一度も復号させていない';
    }
    im.addEventListener("input",run);sr.input.addEventListener("input",run);run();
  };

  /* ============ 16. rsatiming — 繰り返し二乗法の演算の並び ============ */
  REG.rsatiming=function(el){
    head(el,"Side channel","演算の並びから秘密指数を読む");
    var row=ctrls(el);
    var idd=textin(row,"秘密指数 d（10 進）","2753");
    var cst=checkbox(ctrls(el),"定数時間の実装（桁が 0 でも掛け算をして結果を捨てる）",false);
    var cv=screen(el,200),cc=cctx(cv),rd=readout(el);
    function draw(){
      var s=cc.fit(),w=s.w,hh=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,hh);
      var d=R16.big(idd.value);
      if(d===null||d<1n){lab(ctx,"d には 1 以上の整数を入れる",12,24,C("--alias"),"left");rd.innerHTML="";return;}
      var b=d.toString(2).split("").reverse().map(Number);
      if(b.length>64){lab(ctx,"d は 64 ビットまでにする",12,24,C("--alias"),"left");rd.innerHTML="";return;}
      var ops=[];/* [種類, 桁の番号, 見せかけか] */
      b.forEach(function(bit,i){
        if(bit)ops.push(["M",i,false]);else if(cst.checked)ops.push(["M",i,true]);
        if(i<b.length-1)ops.push(["S",i,false]);});
      var x0=12,bw=Math.max(4,Math.min(22,(w-24)/ops.length-2)),gap=Math.min(2,bw/6),y0=40;
      lab(ctx,"演算の並び（時間の順）",x0,18,C("--muted"),"left");
      var trace=[],x=x0;
      ops.forEach(function(op){
        var mul=op[0]==="M",dm=op[2],hgt=mul?44:30,col=mul?(dm?C("--faint"):C("--alias")):C("--blue");
        ctx.fillStyle=mul?(dm?C("--screen"):C("--alias-soft")):"rgba(47,111,158,.16)";ctx.strokeStyle=col;ctx.lineWidth=1.2;
        if(dm)ctx.setLineDash([3,2]);rrect(ctx,x,y0+(44-hgt),bw,hgt,3);ctx.fill();ctx.stroke();ctx.setLineDash([]);
        if(bw>=14)lab(ctx,mul?"掛":"2",x+bw/2,y0+40,col,"center");
        trace.push([x,x+bw,mul&&!dm?1:(mul?1:0.62)]);x+=bw+gap;});
      /* 消費電力の模式図 */
      var yb=hh-26;lab(ctx,"消費電力の波形（模式図）",x0,y0+70,C("--muted"),"left");
      ctx.strokeStyle=C("--signal");ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x0,yb);
      trace.forEach(function(t){var a=t[0],bb=t[1],amp=t[2]*48;ctx.lineTo(a,yb);ctx.lineTo(a+1,yb-amp);ctx.lineTo(bb-1,yb-amp);ctx.lineTo(bb,yb);});
      ctx.lineTo(Math.min(w-8,x+4),yb);ctx.stroke();
      ctx.strokeStyle=C("--line");ctx.beginPath();ctx.moveTo(x0,yb+0.5);ctx.lineTo(w-8,yb+0.5);ctx.stroke();
      var nm=ops.filter(function(o){return o[0]==="M";}).length,ns=ops.length-nm;
      var readBits=[];if(!cst.checked){for(var i=0;i<ops.length;i++){if(ops[i][0]==="S"){var prev=ops[i-1];readBits.push(prev&&prev[0]==="M"&&prev[1]===ops[i][1]?1:0);}}
        readBits.push(1);}
      rd.innerHTML='2 乗 <b>'+ns+'</b> 回、掛け算 <b>'+nm+'</b> 回 → 処理時間はこの回数に比例する ／ '+
        (cst.checked?'<span class="ok">どの桁でも「掛→2」の同じ並びなので、波形からも総時間からも桁は読めない</span>':
          '<span class="warn">掛け算の有無から桁が読める: 下位から '+readBits.join("")+' → d = '+b.slice().reverse().join("")+'₂ = '+d+'</span>（総時間だけでも 1 の個数 '+nm+' が分かる）');
    }
    idd.addEventListener("input",draw);cst.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 17. 共通: 整数と楕円曲線の計算（ほかの章と名前が衝突しないよう E17 にまとめる） ============ */
  var E17=(function(){
    function big(s){s=String(s).trim();if(!/^\d+$/.test(s))return null;try{return BigInt(s);}catch(e){return null;}}
    function bmod(a,m){var r=a%m;return r<0n?r+m:r;}
    function bpow(b,e,m){var r=1n;b=bmod(b,m);while(e>0n){if(e&1n)r=r*b%m;b=b*b%m;e>>=1n;}return m===1n?0n:r;}
    var SP=[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
    function isPrime(n){if(n<2n)return false;
      for(var i=0;i<SP.length;i++){if(n===SP[i])return true;if(n%SP[i]===0n)return false;}
      var d=n-1n,s=0;while((d&1n)===0n){d>>=1n;s++;}
      for(var j=0;j<SP.length;j++){var x=bpow(SP[j],d,n);if(x===1n||x===n-1n)continue;
        var ok=false;for(var r=1;r<s;r++){x=x*x%n;if(x===n-1n){ok=true;break;}}if(!ok)return false;}
      return true;}
    /* g の法 p での位数（p − 1 を素因数分解できたときだけ。できなければ 0n） */
    function order(g,p){var m=p-1n,fs=[],q=2n;
      while(q*q<=m&&q<1000000n){if(m%q===0n){fs.push(q);while(m%q===0n)m/=q;}q+=(q===2n?1n:2n);}
      if(m>1n){if(isPrime(m))fs.push(m);else return 0n;}
      var o=p-1n;fs.forEach(function(f){while(o%f===0n&&bpow(g,o/f,p)===1n)o/=f;});return o;}
    /* 有限体上の楕円曲線（Number で計算。p は 1 万程度まで） */
    function nm(a,p){a%=p;return a<0?a+p:a;}
    function ninv(a,p){a=nm(a,p);var t=0,nt=1,r=p,nr=a;while(nr){var q=Math.floor(r/nr),tmp=t-q*nt;t=nt;nt=tmp;tmp=r-q*nr;r=nr;nr=tmp;}return r===1?nm(t,p):null;}
    function add(P,Q,a,p){if(!P)return Q;if(!Q)return P;
      if(P[0]===Q[0]&&nm(P[1]+Q[1],p)===0)return null;
      var lam=(P[0]===Q[0])?nm(nm(3*P[0]*P[0]+a,p)*ninv(2*P[1],p),p):nm(nm(Q[1]-P[1],p)*ninv(Q[0]-P[0],p),p);
      var x=nm(lam*lam-P[0]-Q[0],p);return [x,nm(lam*(P[0]-x)-P[1],p)];}
    function mul(k,P,a,p){var R=null,B=P;while(k>0){if(k%2===1)R=add(R,B,a,p);B=add(B,B,a,p);k=Math.floor(k/2);}return R;}
    function points(a,b,p){var sq={};for(var y=0;y<p;y++){var v=y*y%p;(sq[v]=sq[v]||[]).push(y);}
      var out=[];for(var x=0;x<p;x++){var r=nm((x*x%p)*x+a*x+b,p),ys=sq[r];if(ys)ys.forEach(function(y){out.push([x,y]);});}return out;}
    function ord(P,a,p){var R=P,k=1;while(R){R=add(R,P,a,p);k++;if(k>4*p+20)return 0;}return k;}
    function ps(P){return P?'('+P[0]+', '+P[1]+')':'O';}
    function eq(P,Q){return (!P&&!Q)||(P&&Q&&P[0]===Q[0]&&P[1]===Q[1]);}
    function sup(a,b){return a+'<sup>'+b+'</sup>';}
    return {big:big,bpow:bpow,isPrime:isPrime,order:order,nm:nm,add:add,mul:mul,points:points,ord:ord,ps:ps,eq:eq,sup:sup};
  })();

  /* ============ 17. dhflow — DH 鍵交換と盗聴者の総当たり ============ */
  REG.dhflow=function(el){
    head(el,"Diffie-Hellman","公開の値だけで同じ鍵に到達する");
    var row=ctrls(el);
    var ip=textin(row,"素数 p","23"),ig=textin(row,"g","5"),ia=textin(row,"Alice の秘密 a","6"),ib=textin(row,"Bob の秘密 b","15");
    var out=panel(el),ro=readout(el);
    function bad(m){out.innerHTML='<span style="color:var(--alias)">'+m+'</span>';ro.innerHTML="";}
    function td(t,al){return '<td style="padding:.25rem .5rem;text-align:'+(al||"left")+'">'+t+'</td>';}
    function run(){
      var p=E17.big(ip.value),g=E17.big(ig.value),a=E17.big(ia.value),b=E17.big(ib.value);
      if(p===null||g===null||a===null||b===null)return bad("p、g、a、b には 0 以上の整数を入れる");
      if(p.toString().length>40)return bad("p は 40 桁までにする");
      if(p<5n||!E17.isPrime(p))return bad("p は 5 以上の素数にする");
      if(g<2n||g>p-2n)return bad("g は 2 以上 p − 2 以下にする");
      if(a<1n||a>p-2n||b<1n||b>p-2n)return bad("a と b は 1 以上 p − 2 以下にする");
      var A=E17.bpow(g,a,p),B=E17.bpow(g,b,p),K1=E17.bpow(B,a,p),K2=E17.bpow(A,b,p),o=E17.order(g,p);
      var h='<div style="color:var(--muted);margin-bottom:.3rem">公開: p = '+p+'、g = '+g+
        (o===0n?'':'（g の位数 '+o+(o===p-1n?' = p − 1 なので原始根）':'。原始根ではないので、K の候補は '+o+' 通りに減る）'))+'</div>';
      h+='<table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:.2rem .5rem;color:var(--muted)">Alice</th>'+
        '<th style="text-align:center;color:var(--muted)">通信路（Eve に見える）</th><th style="text-align:right;padding:.2rem .5rem;color:var(--muted)">Bob</th></tr>';
      h+='<tr>'+td('秘密 a = <b style="color:var(--alias)">'+a+'</b>')+td('')+td('秘密 b = <b style="color:var(--alias)">'+b+'</b>',"right")+'</tr>';
      h+='<tr>'+td('A = '+E17.sup(g,a)+' mod p = <b style="color:var(--blue)">'+A+'</b>')+td('<span style="color:var(--blue)">A = '+A+' →</span>',"center")+td('')+'</tr>';
      h+='<tr>'+td('')+td('<span style="color:var(--blue)">← B = '+B+'</span>',"center")+td('B = '+E17.sup(g,b)+' mod p = <b style="color:var(--blue)">'+B+'</b>',"right")+'</tr>';
      h+='<tr>'+td('K = '+E17.sup('B','a')+' mod p = <b style="color:var(--signal)">'+K1+'</b>')+td('<span style="color:var(--faint)">K は流れない</span>',"center")+
        td('K = '+E17.sup('A','b')+' mod p = <b style="color:var(--signal)">'+K2+'</b>',"right")+'</tr></table>';
      /* Eve の総当たり: g^1, g^2, … を順に計算して A と比べる */
      var small=p<67108864n,lim=small?3000000:300000,found=0,x=1;
      if(small){var pn=Number(p),gn=Number(g),An=Number(A),v=gn;
        while(x<=lim){if(v===An){found=x;break;}v=v*gn%pn;x++;}}
      else{var vb=g%p;while(x<=lim){if(vb===A){found=x;break;}vb=vb*g%p;x++;}}
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line)">Eve の総当たり: '+E17.sup('g','1')+'、'+E17.sup('g','2')+'、… を順に計算して A = '+A+' と比べる → ';
      if(found){var Ke=E17.bpow(B,BigInt(found),p);
        h+='x = <b style="color:var(--alias)">'+found+'</b> で一致（'+found+' 回）。K = '+E17.sup('B','x')+' mod p = <b style="color:var(--alias)">'+Ke+'</b> も計算できる</div>';}
      else h+='<b>'+lim.toLocaleString()+'</b> 回試しても見つからない</div>';
      out.innerHTML=h;
      ro.innerHTML=(K1===K2?'<span class="ok">両者の K が一致（'+K1+'）</span>':'<span class="warn">不一致</span>')+
        ' ／ p は '+p.toString(2).length+' ビット。総当たりでは最悪 p − 2 回、平均でその半分の掛け算が要る（実際の DH の p は 2048 ビット以上）';
    }
    [ip,ig,ia,ib].forEach(function(x){x.addEventListener("input",run);});run();
  };

  /* ============ 17. dhmitm — 中間者攻撃 ============ */
  REG.dhmitm=function(el){
    head(el,"Man-in-the-middle","Mallory が DH に割り込む");
    var row=ctrls(el);
    var sa=slider(row,"Alice の秘密 a",1,21,6,1),sb=slider(row,"Bob の秘密 b",1,21,15,1),sm=slider(row,"Mallory の秘密 m",1,21,9,1);
    var on=checkbox(ctrls(el),"Mallory が通信路に割り込む",true);
    var out=panel(el),ro=readout(el);
    var p=23n,g=5n;
    function P(x,e){return E17.bpow(x,e,p);}
    function cell(t,al){return '<td style="padding:.3rem .5rem;vertical-align:top;text-align:'+(al||"left")+'">'+t+'</td>';}
    function run(){
      var a=BigInt(sa.input.value),b=BigInt(sb.input.value),m=BigInt(sm.input.value),mal=on.checked;
      sa.val.textContent=a;sb.val.textContent=b;sm.val.textContent=mal?m:"—";
      var A=P(g,a),B=P(g,b),Mv=P(g,m);
      var gotA=mal?Mv:B,gotB=mal?Mv:A,KA=P(gotA,a),KB=P(gotB,b);
      var h='<div style="color:var(--muted);margin-bottom:.3rem">公開: p = 23、g = 5</div><table style="border-collapse:collapse;width:100%">';
      h+='<tr><th style="text-align:left;padding:.2rem .5rem;color:var(--muted)">Alice</th><th style="text-align:center;color:'+(mal?'var(--alias)':'var(--muted)')+'">'+
        (mal?'Mallory（通信路の途中）':'通信路')+'</th><th style="text-align:right;padding:.2rem .5rem;color:var(--muted)">Bob</th></tr>';
      h+='<tr>'+cell('秘密 a = <b style="color:var(--alias)">'+a+'</b>')+cell(mal?'秘密 m = <b style="color:var(--alias)">'+m+'</b>':'','center')+cell('秘密 b = <b style="color:var(--alias)">'+b+'</b>','right')+'</tr>';
      h+='<tr>'+cell('A = '+E17.sup(5,a)+' mod 23 = '+A+' を送る')+cell(mal?'A = '+A+' と B = '+B+' を受け取り、<br>両者に '+E17.sup(5,m)+' mod 23 = <b style="color:var(--alias)">'+Mv+'</b> を送る':
        'A = '+A+' →<br>← B = '+B,'center')+cell('B = '+E17.sup(5,b)+' mod 23 = '+B+' を送る','right')+'</tr>';
      h+='<tr>'+cell('受け取った値 '+gotA+(mal?'（Bob の値だと思っている）':''))+cell('','center')+cell('受け取った値 '+gotB+(mal?'（Alice の値だと思っている）':''),'right')+'</tr>';
      h+='<tr>'+cell('鍵 = '+E17.sup(gotA,a)+' mod 23 = <b style="color:var(--signal)">'+KA+'</b>')+
        cell(mal?'鍵 '+E17.sup(A,m)+' mod 23 = <b style="color:var(--alias)">'+P(A,m)+'</b>（Alice と）<br>鍵 '+E17.sup(B,m)+' mod 23 = <b style="color:var(--alias)">'+P(B,m)+'</b>（Bob と）':'','center')+
        cell('鍵 = '+E17.sup(gotB,b)+' mod 23 = <b style="color:var(--signal)">'+KB+'</b>','right')+'</tr></table>';
      out.innerHTML=h;
      if(!mal)ro.innerHTML='<span class="ok">Alice と Bob は同じ鍵 '+KA+' を得る</span>（DH の通常の動作）';
      else ro.innerHTML='<span class="warn">Alice の鍵 '+KA+' と Bob の鍵 '+KB+' は'+(KA===KB?'たまたま同じだが、どちらも Mallory が知っている':'違う')+
        '。2 人はそれぞれ相手と共有したと思っている</span> ／ Mallory は両方の鍵を知っているので、Alice からの暗号文を鍵 '+KA+' で復号して読み、鍵 '+KB+' で暗号化し直して Bob に渡せる';
    }
    [sa,sb,sm].forEach(function(s){s.input.addEventListener("input",run);});on.addEventListener("change",run);run();
  };

  /* ============ 17. ecadd — 実数の曲線での点の足し算 ============ */
  REG.ecadd=function(el){
    head(el,"Point addition","直線を引いて点を足す（実数の曲線）");
    var cv=screen(el,330),cc=cctx(cv);
    var row=ctrls(el);
    var sa=slider(row,"係数 a",-3,3,-1,0.5),sb=slider(row,"係数 b",-2,3,1,0.5);
    var row2=ctrls(el);
    var sP=slider(row2,"P の位置",-100,100,53,1),sQ=slider(row2,"Q の位置",-100,100,-70,1);
    var dbl=checkbox(ctrls(el),"Q を P に重ねる（P + P、接線を使う）",false);
    var ro=readout(el);
    var XR=[-3,4.2],YR=[-6,6];
    function F(x,a,b){return x*x*x+a*x+b;}
    function rootOf(a,b,c){var x=Math.max(4,Math.sqrt(Math.abs(a))+4);/* x^3 + a x + b = c の最大の実数解（ニュートン法） */
      for(var i=0;i<200;i++){var d=3*x*x+a,nx=x-(F(x,a,b)-c)/(Math.abs(d)<1e-9?1e-9:d);if(Math.abs(nx-x)<1e-13){x=nx;break;}x=nx;}return x;}
    function at(s,a,b,x0,xr){var t=s/100,x=x0+(xr-x0)*t*t,y=Math.sqrt(Math.max(0,F(x,a,b)));return [x,t<0?-y:y];}
    function fmt(v){return (Math.abs(v)<5e-4?0:v).toFixed(3);}
    function draw(){
      var a=+sa.input.value,b=+sb.input.value;sa.val.textContent=a;sb.val.textContent=b;
      sP.val.textContent=sP.input.value;sQ.val.textContent=dbl.checked?"P と同じ":sQ.input.value;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var X=function(x){return 12+(x-XR[0])/(XR[1]-XR[0])*(w-24);},Y=function(y){return h-12-(y-YR[0])/(YR[1]-YR[0])*(h-24);};
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.beginPath();
      ctx.moveTo(X(XR[0]),Y(0));ctx.lineTo(X(XR[1]),Y(0));ctx.moveTo(X(0),Y(YR[0]));ctx.lineTo(X(0),Y(YR[1]));ctx.stroke();
      /* 曲線: x を細かく刻み、x^3 + a x + b ≥ 0 の範囲で y = ±√ を描く */
      ctx.strokeStyle=C("--muted");ctx.lineWidth=2;
      [1,-1].forEach(function(sg){var on=false;ctx.beginPath();
        for(var i=0;i<=1400;i++){var x=XR[0]+(XR[1]-XR[0])*i/1400,v=F(x,a,b);
          if(v<0||Math.sqrt(v)>YR[1]){on=false;continue;}
          var y=sg*Math.sqrt(v);if(!on){ctx.moveTo(X(x),Y(y));on=true;}else ctx.lineTo(X(x),Y(y));}
        ctx.stroke();});
      var disc=4*a*a*a+27*b*b,x0=rootOf(a,b,0),xr=Math.min(XR[1]-0.05,rootOf(a,b,YR[1]*YR[1]*0.97));
      /* 曲線の右側の部分が x0 の近くで上下につながるように、y = 0 付近も描き足す */
      ctx.beginPath();for(var j=0;j<=200;j++){var tt=-1+2*j/200,c0=at(tt*25,a,b,x0,xr);j?ctx.lineTo(X(c0[0]),Y(c0[1])):ctx.moveTo(X(c0[0]),Y(c0[1]));}ctx.stroke();
      var P=at(+sP.input.value,a,b,x0,xr),Q=dbl.checked?P.slice():at(+sQ.input.value,a,b,x0,xr);
      var same=dbl.checked||+sP.input.value===+sQ.input.value,vert=false,lam=0;
      if(same){if(Math.abs(P[1])<1e-9)vert=true;else lam=(3*P[0]*P[0]+a)/(2*P[1]);}
      else if(Math.abs(P[0]-Q[0])<1e-9){vert=true;}
      else lam=(Q[1]-P[1])/(Q[0]-P[0]);
      function pt(p,lb,col,fill,dx,dy){var x=X(p[0]),y=Y(p[1]);ctx.beginPath();ctx.arc(x,y,6,0,TAU);
        ctx.fillStyle=fill?col:C("--panel");ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
        ctx.font="bold 12px "+C("--sans");ctx.fillStyle=col;ctx.textAlign="left";ctx.fillText(lb,x+(dx||9),y+(dy||-8));}
      if(vert){
        ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(X(P[0]),Y(YR[0]));ctx.lineTo(X(P[0]),Y(YR[1]));ctx.stroke();
        pt(P,"P",C("--ink"),true);if(!same)pt(Q,"Q",C("--ink"),true,9,16);
        lab(ctx,"垂直線: 3 つ目の交点は無限遠点 O",X(P[0])+8,Y(YR[1])+14,C("--blue"),"left");
        ro.innerHTML=(disc===0?'<span class="warn">4a³ + 27b² = 0（特異な曲線）。特異点の近くでは足し算が定義できない</span> ／ ':'')+
          'P = ('+fmt(P[0])+', '+fmt(P[1])+')'+(same?'':'、Q = ('+fmt(Q[0])+', '+fmt(Q[1])+')')+' ／ 直線が垂直なので <b class="ok">P + '+(same?'P':'Q')+' = O</b>（無限遠点）';
        return;}
      var x3=lam*lam-P[0]-Q[0],y3=lam*(P[0]-x3)-P[1],R=[x3,-y3];
      ctx.strokeStyle=C("--blue");ctx.lineWidth=1.6;ctx.beginPath();
      ctx.moveTo(X(XR[0]),Y(lam*(XR[0]-P[0])+P[1]));ctx.lineTo(X(XR[1]),Y(lam*(XR[1]-P[0])+P[1]));ctx.stroke();
      var inView=x3>=XR[0]&&x3<=XR[1]&&Math.abs(y3)<=YR[1];
      if(inView){ctx.setLineDash([5,4]);ctx.strokeStyle=C("--signal");ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(X(x3),Y(-y3));ctx.lineTo(X(x3),Y(y3));ctx.stroke();ctx.setLineDash([]);
        pt(R,"R′",C("--blue"),false,9,R[1]<0?16:-8);pt([x3,y3],same?"2P":"P + Q",C("--signal"),true,9,y3<0?16:-8);}
      pt(P,"P",C("--ink"),true);if(!same)pt(Q,"Q",C("--ink"),true,9,16);
      if(!inView)lab(ctx,"R′ と P + Q は表示範囲の外",16,22,C("--alias"),"left");
      var chk=y3*y3-F(x3,a,b);
      ro.innerHTML=(disc===0?'<span class="warn">4a³ + 27b² = 0（特異な曲線）。特異点では接線が決まらず、足し算が定義できない</span> ／ ':'')+
        'P = ('+fmt(P[0])+', '+fmt(P[1])+')'+(same?'':'、Q = ('+fmt(Q[0])+', '+fmt(Q[1])+')')+
        ' ／ λ = '+(same?'(3x₁² + a)/(2y₁)':'(y₂ − y₁)/(x₂ − x₁)')+' = '+fmt(lam)+
        ' ／ x₃ = λ² − x₁ − x₂ = '+fmt(x3)+'、y₃ = λ(x₁ − x₃) − y₁ = '+fmt(y3)+
        ' ／ <b class="ok">'+(same?'2P':'P + Q')+' = ('+fmt(x3)+', '+fmt(y3)+')</b>（y₃² − (x₃³ + a x₃ + b) = '+fmt(chk)+' なので曲線上）';
    }
    [sa,sb,sP,sQ].forEach(function(s){s.input.addEventListener("input",draw);});dbl.addEventListener("change",draw);reg(cv,draw);
  };

  /* ============ 17. ecmul — ダブル・アンド・アッドでスカラー倍 ============ */
  REG.ecmul=function(el){
    head(el,"Scalar multiplication","ダブル・アンド・アッドで kG を求める");
    var cv=screen(el,330),cc=cctx(cv);
    var row=ctrls(el);
    var PR=[11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97];
    var sp=select(row,"素数 p",PR.map(String));sp.value=String(PR.indexOf(17));
    var sa=slider(row,"係数 a",0,16,2,1),sb=slider(row,"係数 b",0,16,2,1);
    var row2=ctrls(el);
    var sg=slider(row2,"ベースポイント G（点の番号）",0,17,4,1),sk=slider(row2,"k",1,19,13,1);
    var out=panel(el),ro=readout(el);
    function draw(){
      var p=PR[+sp.value];sa.input.max=p-1;sb.input.max=p-1;
      if(+sa.input.value>p-1)sa.input.value=p-1;if(+sb.input.value>p-1)sb.input.value=p-1;
      var a=+sa.input.value,b=+sb.input.value;sa.val.textContent=a;sb.val.textContent=b;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(E17.nm(4*a*a*a+27*b*b,p)===0){lab(ctx,"4a³ + 27b² ≡ 0 (mod "+p+") なので特異な曲線。a か b を変える",14,24,C("--alias"),"left");
        out.innerHTML="";ro.innerHTML="";sg.val.textContent="—";sk.val.textContent="—";return;}
      var pts=E17.points(a,b,p);sg.input.max=pts.length-1;if(+sg.input.value>pts.length-1)sg.input.value=0;
      var G=pts[+sg.input.value],n=E17.ord(G,a,p);sg.val.textContent=E17.ps(G);
      sk.input.max=n;if(+sk.input.value>n)sk.input.value=n;var k=+sk.input.value;sk.val.textContent=k;
      /* 方眼と点 */
      var pad=22,S=Math.min((w-2*pad-150)/p,(h-2*pad)/p),gx=pad,gy=h-pad;
      var X=function(x){return gx+x*S+S/2;},Y=function(y){return gy-y*S-S/2;};
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(gx,gy-p*S,p*S,p*S);
      ctx.fillStyle=C("--faint");pts.forEach(function(q){ctx.beginPath();ctx.arc(X(q[0]),Y(q[1]),Math.max(1.6,S*0.18),0,TAU);ctx.fill();});
      /* ダブル・アンド・アッド */
      var bits=k.toString(2).split("").reverse(),B=G,acc=null,rows=[],dbl=0,adds=0,chain=[];
      for(var i=0;i<bits.length;i++){chain.push(B);
        if(bits[i]==="1"){acc=acc?E17.add(acc,B,a,p):B;if(rows.some(function(r){return r.added;}))adds++;rows.push({i:i,B:B,bit:1,acc:acc,added:true});}
        else rows.push({i:i,B:B,bit:0,acc:acc,added:false});
        if(i<bits.length-1){B=E17.add(B,B,a,p);dbl++;}}
      function mark(q,col,r,fill,lb,dy){if(!q)return;var x=X(q[0]),y=Y(q[1]);ctx.beginPath();ctx.arc(x,y,r,0,TAU);
        if(fill){ctx.fillStyle=col;ctx.fill();}else{ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();}
        if(lb&&p<=47)lab(ctx,lb,x+r+2,y+(dy||-4),col,"left");}
      chain.forEach(function(q,i){mark(q,C("--blue"),Math.max(5,S*0.42),false,i?Math.pow(2,i)+"G":"G",-6);});
      rows.forEach(function(r){if(r.added&&r.acc&&!E17.eq(r.acc,acc))mark(r.acc,C("--signal"),Math.max(4,S*0.3),true,null);});
      mark(acc,C("--alias"),Math.max(6,S*0.5),true,k+"G",12);
      var lx=gx+p*S+16;lab(ctx,"○ 2 倍した点",lx,gy-p*S+14,C("--blue"),"left");lab(ctx,"● 途中の和",lx,gy-p*S+32,C("--signal"),"left");
      lab(ctx,"● "+k+"G",lx,gy-p*S+50,C("--alias"),"left");lab(ctx,"点の個数 "+pts.length+" + O",lx,gy-p*S+76,C("--muted"),"left");
      lab(ctx,"G の位数 n = "+n,lx,gy-p*S+94,C("--muted"),"left");
      var tb=rows.map(function(r){return ['2<sup>'+r.i+'</sup>G = '+E17.ps(r.B),r.bit?'<b style="color:var(--signal)">1</b>':'0',
        r.added?'<b style="color:var(--signal)">'+E17.ps(r.acc)+'</b>':'<span style="color:var(--faint)">（足さない）</span>'];});
      out.innerHTML='<div style="color:var(--muted);margin-bottom:.2rem">k = '+k+' = '+k.toString(2)+'₂（下の表は 2⁰ の桁から）</div>'+tbl(["2 倍を繰り返した点","k の桁","足した結果"],tb,["left","center","left"]);
      ro.innerHTML='2 倍 <b>'+dbl+'</b> 回 + 足し算 <b>'+adds+'</b> 回 = '+(dbl+adds)+' 回（G を 1 つずつ足すと '+Math.max(0,k-1)+' 回） ／ <b class="ok">'+k+'G = '+E17.ps(acc)+'</b>'+
        (k===n?'（k = n なので無限遠点 O に戻る）':'')+' ／ G の位数 n = '+n;
    }
    sp.addEventListener("change",draw);[sa,sb,sg,sk].forEach(function(s){s.input.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ============ 17. ecdh — 楕円曲線ディフィー・ヘルマン ============ */
  REG.ecdh=function(el){
    head(el,"ECDH","楕円曲線の点で鍵を共有する");
    var cv=screen(el,280),cc=cctx(cv);
    var CUR=[{p:17,a:2,b:2,G:[5,1]},{p:97,a:1,b:4,G:[0,2]},{p:1009,a:5,b:1,G:[0,1]},{p:10007,a:7,b:4,G:[0,2]}];
    var row=ctrls(el);
    var sc=select(row,"曲線（法 p）",CUR.map(function(c){return 'p = '+c.p+': y² = x³ + '+c.a+'x + '+c.b+'、G = ('+c.G[0]+', '+c.G[1]+')';}));
    var row2=ctrls(el);
    var ia=textin(row2,"<span>Alice の秘密 d<sub>A</sub></span>","3"),ib=textin(row2,"<span>Bob の秘密 d<sub>B</sub></span>","7");
    var out=panel(el),ro=readout(el),cache={};
    function info(c){var key=c.p;if(!cache[key])cache[key]={pts:E17.points(c.a,c.b,c.p),n:E17.ord(c.G,c.a,c.p)};return cache[key];}
    function draw(){
      var c=CUR[+sc.value],I=info(c),n=I.n,a=c.a,p=c.p,G=c.G;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var dA=parseInt(ia.value,10),dB=parseInt(ib.value,10);
      var pad=18,S=Math.min((w-2*pad-170)/p,(h-2*pad)/p),gx=pad,gy=h-pad;
      var X=function(x){return gx+x*S+S/2;},Y=function(y){return gy-y*S-S/2;};
      ctx.strokeStyle=C("--line");ctx.lineWidth=1;ctx.strokeRect(gx,gy-p*S,p*S,p*S);
      ctx.fillStyle=C("--faint");var rr=Math.max(0.8,Math.min(2.6,S*0.2));
      I.pts.forEach(function(q){ctx.fillRect(X(q[0])-rr,Y(q[1])-rr,2*rr,2*rr);});
      if(!(dA>=1&&dA<n&&dB>=1&&dB<n)){out.innerHTML='<span style="color:var(--alias)">d_A と d_B は 1 以上 n − 1 = '+(n-1)+' 以下の整数にする</span>';ro.innerHTML="";return;}
      var QA=E17.mul(dA,G,a,p),QB=E17.mul(dB,G,a,p),SA=E17.mul(dA,QB,a,p),SB=E17.mul(dB,QA,a,p);
      function mark(q,col,lb,dy){if(!q)return;var x=X(q[0]),y=Y(q[1]);ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fillStyle=col;ctx.fill();
        lab(ctx,lb,x+9,y+(dy||-6),col,"left");}
      mark(G,C("--blue"),"G");mark(QA,C("--alias"),"Alice の Q");mark(QB,C("--alias"),"Bob の Q",14);mark(SA,C("--signal"),"共有した点",-8);
      var lx=gx+p*S+16;lab(ctx,"点の個数 "+I.pts.length+" + O",lx,gy-p*S+14,C("--muted"),"left");lab(ctx,"G の位数 n = "+n,lx,gy-p*S+32,C("--muted"),"left");
      /* Eve の総当たり: G, 2G, 3G, … と足して Q_A と比べる */
      var R=G,steps=1;while(!E17.eq(R,QA)&&steps<n){R=E17.add(R,G,a,p);steps++;}
      var h2='<table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:.2rem .5rem;color:var(--muted)">Alice</th><th style="text-align:center;color:var(--muted)">通信路（Eve に見える）</th><th style="text-align:right;padding:.2rem .5rem;color:var(--muted)">Bob</th></tr>';
      h2+='<tr><td style="padding:.2rem .5rem">秘密 d<sub>A</sub> = <b style="color:var(--alias)">'+dA+'</b></td><td></td><td style="padding:.2rem .5rem;text-align:right">秘密 d<sub>B</sub> = <b style="color:var(--alias)">'+dB+'</b></td></tr>';
      h2+='<tr><td style="padding:.2rem .5rem">Q<sub>A</sub> = d<sub>A</sub>G = '+E17.ps(QA)+'</td><td style="text-align:center;color:var(--blue)">Q<sub>A</sub> →　← Q<sub>B</sub></td><td style="padding:.2rem .5rem;text-align:right">Q<sub>B</sub> = d<sub>B</sub>G = '+E17.ps(QB)+'</td></tr>';
      h2+='<tr><td style="padding:.2rem .5rem">d<sub>A</sub>Q<sub>B</sub> = <b style="color:var(--signal)">'+E17.ps(SA)+'</b></td><td style="text-align:center;color:var(--faint)">共有した点は流れない</td><td style="padding:.2rem .5rem;text-align:right">d<sub>B</sub>Q<sub>A</sub> = <b style="color:var(--signal)">'+E17.ps(SB)+'</b></td></tr></table>';
      h2+='<div style="margin-top:.4rem;padding-top:.4rem;border-top:1px dashed var(--line)">Eve の総当たり: G、2G、3G、… と G を足していき、Q<sub>A</sub> と比べる → <b style="color:var(--alias)">'+steps+'</b> 個目で一致し、d<sub>A</sub> = '+steps+' が分かる</div>';
      out.innerHTML=h2;
      ro.innerHTML=(E17.eq(SA,SB)?'<span class="ok">両者の点が一致: '+E17.ps(SA)+'</span>':'<span class="warn">不一致</span>')+
        ' ／ n = '+n+' なら総当たりは最大 n − 1 回で終わるが、実際の曲線では n が約 2²⁵⁶ なので、ポラードの ρ 法でも約 2¹²⁸ 回かかる';
    }
    sc.addEventListener("change",draw);[ia,ib].forEach(function(x){x.addEventListener("input",draw);});reg(cv,draw);
  };

  /* ============ 18 章 ハッシュ・MAC・デジタル署名 ============ */

  /* ---- SHA-256（avalanche と rsasig で使う。数値は Python の hashlib と一致） ---- */
  function SHA18_bytes(str){
    try{return Array.from(new TextEncoder().encode(str));}
    catch(e){var u=unescape(encodeURIComponent(str)),a=[];for(var i=0;i<u.length;i++)a.push(u.charCodeAt(i));return a;}
  }
  function SHA18(bytes){
    function rotr(x,n){return (x>>>n)|(x<<(32-n));}
    var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l=bytes.length,bitLen=l*8,withOne=l+1,k=(56-withOne%64+64)%64,total=withOne+k+8;
    var msg=new Array(total);for(var i=0;i<l;i++)msg[i]=bytes[i];for(i=l;i<total;i++)msg[i]=0;
    msg[l]=0x80;for(i=0;i<4;i++)msg[total-1-i]=(bitLen>>>(8*i))&0xff;
    var w=new Array(64);
    for(var off=0;off<total;off+=64){
      for(var t=0;t<16;t++)w[t]=(msg[off+4*t]<<24|msg[off+4*t+1]<<16|msg[off+4*t+2]<<8|msg[off+4*t+3])>>>0;
      for(t=16;t<64;t++){var s0=rotr(w[t-15],7)^rotr(w[t-15],18)^(w[t-15]>>>3);
        var s1=rotr(w[t-2],17)^rotr(w[t-2],19)^(w[t-2]>>>10);w[t]=(w[t-16]+s0+w[t-7]+s1)>>>0;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(t=0;t<64;t++){var S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g);
        var t1=(h+S1+ch+K[t]+w[t])>>>0;var S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c);
        var t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
    }
    var hex="";for(i=0;i<8;i++)hex+=("00000000"+H[i].toString(16)).slice(-8);return hex;
  }
  function SHA18hex(str){return SHA18(SHA18_bytes(str));}

  /* ---- 18. avalanche — 1 文字変えると出力の約半分が変わる ---- */
  REG.avalanche=function(el){
    head(el,"Hash","SHA-256: 1 文字変えるとどれだけ変わるか");
    var row=ctrls(el);
    var i1=textin(row,"メッセージ 1","abc"), i2=textin(row,"メッセージ 2","abd");
    var out=panel(el); var cv=screen(el,150),cc=cctx(cv); var ro=readout(el);
    function bits(hex){var b="";for(var i=0;i<hex.length;i++)b+=("000"+parseInt(hex[i],16).toString(2)).slice(-4);return b;}
    function run(){
      var h1=SHA18hex(i1.value), h2=SHA18hex(i2.value);
      function colored(h,other){var s="";for(var i=0;i<64;i++){var diff=h[i]!==other[i];
        s+='<span style="color:'+(diff?"var(--alias)":"var(--ink)")+';font-weight:'+(diff?700:400)+'">'+h[i]+'</span>';}
        return s;}
      out.innerHTML='<div style="word-break:break-all;line-height:1.7">'+
        '<div style="color:var(--muted);font-size:.72rem">H(メッセージ 1)</div>'+colored(h1,h2)+
        '<div style="color:var(--muted);font-size:.72rem;margin-top:.4rem">H(メッセージ 2)</div>'+colored(h2,h1)+'</div>';
      var b1=bits(h1),b2=bits(h2),nd=0;for(var i=0;i<256;i++)if(b1[i]!==b2[i])nd++;
      var s=cc.fit(),w=s.w,hgt=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,hgt);
      var cols=32,rows=8,y0=24,cell=Math.min((w-16)/cols,(hgt-y0-8)/rows),x0=(w-cell*cols)/2;
      lab(ctx,"値が違うビット（赤）。1 行 32 ビット × 8 行 = 256 ビット",x0,16,C("--muted"),"left");
      for(i=0;i<256;i++){var r=Math.floor(i/cols),c2=i%cols,diff=b1[i]!==b2[i];
        ctx.fillStyle=diff?C("--alias"):C("--screen");ctx.strokeStyle=C("--line");ctx.lineWidth=.5;
        ctx.fillRect(x0+c2*cell,y0+r*cell,cell-1,cell-1);ctx.strokeRect(x0+c2*cell,y0+r*cell,cell-1,cell-1);}
      ro.innerHTML=(i1.value===i2.value?'<span class="warn">2 つのメッセージが同じ</span>':
        'ハミング距離 = <b>'+nd+'</b> / 256 ビット（<b>'+Math.round(nd*100/256)+'%</b>）が違う ／ '+
        (Math.abs(nd-128)<40?'<b class="ok">約半分。入力と無関係なでたらめに見える</b>':''));
    }
    i1.addEventListener("input",run);i2.addEventListener("input",run);reg(cv,run);run();
  };

  /* ---- 18. mdext — 素朴な MAC は長さ拡張で破れ、HMAC は破れない ---- */
  REG.mdext=function(el){
    head(el,"Length Extension","トイのハッシュ（状態 16 ビット・ブロック 8 バイト）で比べる");
    var row=ctrls(el);
    var iK=textin(row,"鍵 K","key!"), iM=textin(row,"メッセージ m","amount=100"), iX=textin(row,"付け足すデータ x","&to=bob");
    var out=panel(el); var ro=readout(el);
    var H0=0x6a09,B=8;
    function by(s){return SHA18_bytes(s);}
    function rotl(x,n){return ((x<<n)|(x>>>(16-n)))&0xffff;}
    function comp(h,blk){for(var i=0;i<8;i++){h=(rotl(h,5)+(blk[i]||0)+0x9e37)&0xffff;h^=rotl(h,7);h&=0xffff;}return h;}
    function pad(L){var bl=L*8,w=L+1,k=(6-w%8+8)%8,p=[0x80];for(var i=0;i<k;i++)p.push(0);p.push((bl>>>8)&0xff,bl&0xff);return p;}
    function hashSeq(bytes){var d=bytes.concat(pad(bytes.length)),h=H0,seq=[h];
      for(var i=0;i<d.length;i+=8){h=comp(h,d.slice(i,i+8));seq.push(h);}return {h:h,seq:seq,blocks:d.length/8};}
    function hashB(bytes){return hashSeq(bytes).h;}
    function cont(st,bytes){var h=st;for(var i=0;i<bytes.length;i+=8)h=comp(h,bytes.slice(i,i+8));return h;}
    function hx(h){return ("0000"+h.toString(16)).slice(-4);}
    function b2(h){return [(h>>>8)&0xff,h&0xff];}
    function k0(K){var kk=K.slice();if(kk.length>B)kk=b2(hashB(kk));while(kk.length<B)kk.push(0);return kk;}
    function xp(kk,p){return kk.map(function(b){return b^p;});}
    function hmac(K,m){var kk=k0(K);var inner=hashB(xp(kk,0x36).concat(m));return hashB(xp(kk,0x5c).concat(b2(inner)));}
    function run(){
      var K=by(iK.value),m=by(iM.value),x=by(iX.value);
      var r=hashSeq(K.concat(m)),t=r.h;
      var innerLen=K.length+m.length,pIn=pad(innerLen),Mlen=innerLen+pIn.length+x.length;
      var forged=cont(t,x.concat(pad(Mlen)));
      var real=hashB(K.concat(m).concat(pIn).concat(x));
      var hm=hmac(K,m),attempt=cont(hm,x.concat(pad(Mlen))),realH=hmac(K,m.concat(pIn).concat(x));
      var h='<div style="color:var(--muted);font-size:.72rem">① 素朴な MAC：t = H(K‖m)</div>';
      h+='<div>内部状態: '+r.seq.map(hx).join(' <span style="color:var(--faint)">→</span> ')+'　<span style="color:var(--faint)">('+r.blocks+' ブロック)</span></div>';
      h+='<div>攻撃者は K を知らずに t から計算: H(K‖m‖pad‖x) = <b style="color:var(--alias)">'+hx(forged)+'</b></div>';
      h+='<div>実際の H(K‖m‖pad‖x) = <b style="color:var(--alias)">'+hx(real)+'</b> '+(forged===real?'<span class="warn">← 一致（偽造成功）</span>':'')+'</div>';
      h+='<div style="margin-top:.5rem;padding-top:.4rem;border-top:1px dashed var(--line);color:var(--muted);font-size:.72rem">② HMAC</div>';
      h+='<div>HMAC_K(m) = <b style="color:var(--signal)">'+hx(hm)+'</b></div>';
      h+='<div>同じやり方で延長を試みる = <b>'+hx(attempt)+'</b></div>';
      h+='<div>実際の HMAC_K(m‖pad‖x) = <b style="color:var(--signal)">'+hx(realH)+'</b> '+(attempt===realH?'':'<span class="ok">← 一致しない（偽造失敗）</span>')+'</div>';
      out.innerHTML=h;
      ro.innerHTML='素朴な MAC は '+(forged===real?'<span class="warn">破れる</span>':'—')+
        ' ／ HMAC は '+(attempt!==realH?'<span class="ok">破れない</span>':'—')+
        '　外に出るのが内部状態そのものか（素朴）、外側のハッシュで隠されているか（HMAC）の違い';
    }
    [iK,iM,iX].forEach(function(o){o.addEventListener("input",run);});reg(null,run);run();
  };

  /* ---- 18. rsasig — 署名して検証し、改ざんを検出する ---- */
  REG.rsasig=function(el){
    head(el,"RSA Signature","σ = H(m)^d mod n を作り、σ^e mod n = H(m) を確かめる");
    var row=ctrls(el);
    var iM=textin(row,"署名するメッセージ m","Alice は Bob に 100 円払う");
    var iR=textin(row,"検証者が受け取ったメッセージ","Alice は Bob に 100 円払う");
    var out=panel(el); var ro=readout(el);
    var n=3233,e=17,d=2753;
    function modexp(b,x,m){var r=1;b%=m;while(x>0){if(x&1)r=(r*b)%m;b=(b*b)%m;x=Math.floor(x/2);}return r;}
    function Hn(s){var hex=SHA18hex(s),v=0;for(var i=0;i<hex.length;i++)v=(v*16+parseInt(hex[i],16))%n;return v;}
    function run(){
      var hm=Hn(iM.value), sig=modexp(hm,d,n);
      var hr=Hn(iR.value), chk=modexp(sig,e,n);
      var h='<div style="color:var(--muted);font-size:.72rem">鍵（16 章の例）: n = '+n+'、e = '+e+'（公開）、d = '+d+'（秘密）</div>';
      h+='<div style="margin-top:.3rem">署名者: H(m) = SHA-256(m) mod '+n+' = <b>'+hm+'</b></div>';
      h+='<div>　　　　σ = H(m)^d mod n = '+hm+'^'+d+' mod '+n+' = <b style="color:var(--blue)">'+sig+'</b>　<span style="color:var(--faint)">← m と一緒に送る</span></div>';
      h+='<div style="margin-top:.4rem;padding-top:.35rem;border-top:1px dashed var(--line)">検証者: 受け取った m\' から H(m\') = <b>'+hr+'</b></div>';
      h+='<div>　　　　σ^e mod n = '+sig+'^'+e+' mod '+n+' = <b style="color:var(--signal)">'+chk+'</b></div>';
      out.innerHTML=h;
      var ok=chk===hr, same=iM.value===iR.value;
      ro.innerHTML=(ok?'<span class="ok">✓ σ^e mod n = H(m\') なので署名は有効</span>':
        '<span class="warn">✗ '+chk+' ≠ '+hr+' なので署名は無効</span>')+' ／ '+
        (same?'メッセージは書き換えられていない':'<span class="warn">メッセージが書き換えられている → ハッシュ値が変わり検出される</span>');
    }
    [iM,iR].forEach(function(o){o.addEventListener("input",run);});reg(null,run);run();
  };

  /* ===== END CHAPTER WIDGETS ===== */

  function init(){
    document.querySelectorAll("[data-widget]").forEach(function(el){
      if(el.dataset.done)return; el.dataset.done="1";
      var fn=REG[el.getAttribute("data-widget")];
      if(fn){try{fn(el);}catch(e){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: '+e.message+'</div>';}}
    });
    requestAnimationFrame(redrawAll);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
