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
