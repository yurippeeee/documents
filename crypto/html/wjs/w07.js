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
