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
    head(el,"GF(p)","乗法表の各行に 1 が現れる = 逆元が存在する");
    var row=ctrls(el);
    var sp=slider(row,"法 p",2,17,5,1);
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
      rd.innerHTML='p = <b>'+p+'</b> ／ '+(isPrime(p)
        ? '<span class="ok">素数 → 0 以外の全要素が逆元を持つ（乗法表の各行に緑の 1 がある）= 体</span>'
        : '<span class="warn">合成数 → 逆元を持たない要素: '+noinv.join(", ")+' → 体でない</span>');
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
  REG.polydiv=function(el){
    head(el,"Poly Division","GF(2) 上の割り算 = XOR の筆算");
    var row=ctrls(el);
    var ia=textin(row,"被除数（2進）","1101000","150px"), ib=textin(row,"除数（2進）","1011","110px");
    var out=panel(el), rd=readout(el);
    function run(){
      var A=(ia.value||"").replace(/[^01]/g,""), B=(ib.value||"").replace(/[^01]/g,"");
      if(!A||!B||B.indexOf("1")<0){out.innerHTML="0/1 で入力してください";rd.innerHTML="";return;}
      var a=A.split("").map(Number), b=B.split("").map(Number);
      while(b[0]===0)b.shift();
      var n=a.length, m=b.length, work=a.slice(), q=[], lines=[];
      lines.push([work.join(""),""]);
      for(var i=0;i+m<=n;i++){
        if(work[i]===1){
          q.push(1);
          var sub=new Array(n).fill(0);
          for(var j=0;j<m;j++)sub[i+j]=b[j];
          for(var k=0;k<n;k++)work[k]^=sub[k];
          lines.push([sub.join(""),"XOR"]);
          lines.push([work.join(""),"→"]);
        } else q.push(0);
      }
      var rem=work.slice(n-m+1);
      var h='';
      lines.forEach(function(L){
        h+='<div><span style="color:var(--faint);display:inline-block;width:2.6em">'+L[1]+'</span>'+
           '<span style="letter-spacing:.22em">'+L[0]+'</span></div>';
      });
      out.innerHTML=h;
      rd.innerHTML='商 = <b>'+(q.join("")||"0")+'</b> ／ 余り = <b class="ok">'+rem.join("")+'</b>'+
        (rem.indexOf(1)<0?' ／ <span class="ok">割り切れた（= 正しい符号語）</span>':' ／ <span class="warn">余りが 0 でない（= 誤りあり）</span>');
    }
    ia.addEventListener("input",run);ib.addEventListener("input",run);reg(null,run);run();
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
      var h='<div style="color:var(--muted);margin-bottom:.3rem">'+(mulmode?"乗法":"加法")+'表 mod '+n+'（要素数 '+ord+'）</div>';
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
      h+='<div style="color:var(--muted);margin:.7rem 0 .3rem">各元の位数（e に戻るまでの回数）</div>';
      h+='<table style="border-collapse:collapse"><tr><th style="padding:.1rem .5rem;color:var(--muted);text-align:right">元</th>'+
        G.map(function(a){return '<td style="padding:.1rem .5rem;text-align:right">'+a+'</td>';}).join("")+'</tr>'+
        '<tr><th style="padding:.1rem .5rem;color:var(--muted);text-align:right">位数</th>'+
        orders.map(function(k){return '<td style="padding:.1rem .5rem;text-align:right;color:'+(ord%k===0?'var(--signal)':'var(--alias)')+';font-weight:700">'+k+'</td>';}).join("")+'</tr></table>';
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
