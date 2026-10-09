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
