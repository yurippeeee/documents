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
        var bg=i===k?'var(--signal-soft)':((i===la||i===lb)?'var(--blue-soft)':'var(--panel)');
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
