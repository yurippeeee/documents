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
