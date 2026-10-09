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
