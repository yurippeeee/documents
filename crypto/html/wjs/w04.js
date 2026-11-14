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
