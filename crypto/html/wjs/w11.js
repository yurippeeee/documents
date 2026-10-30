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
      info:["var(--blue)","var(--blue-soft)","var(--ink)"],
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
