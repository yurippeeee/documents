  /* ============ 14. 転調 — 共通の部品 ============ */
  var _w14_KJ={C:"ハ",D:"ニ",E:"ホ",F:"ヘ",G:"ト",A:"イ",B:"ロ"};
  var _w14_KEYS=["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B","Cm","C#m","Dm","Ebm","Em","Fm","F#m","Gm","G#m","Am","Bbm","Bm"];
  function _w14_kname(k){var m=/^([A-G])([#b]?)(m?)$/.exec(k);return (m[2]==="#"?"嬰":m[2]==="b"?"変":"")+_w14_KJ[m[1]]+(m[3]?"短調":"長調");}
  function _w14_cn(s){return String(s).replace(/#/g,"♯").replace(/([A-G])b/g,"$1♭");}
  function _w14_strip(n){return String(n).replace(/-?\d+$/,"");}
  function _w14_tones(sym){return chordSpell(sym,chordMidis(sym,48)).map(_w14_strip);}
  function _w14_scale(k){var mi=/m$/.test(k),t=mi?k.slice(0,-1):k;return spellScale(t+"4",mi?NAT_MINOR:MAJOR,7).map(_w14_strip);}
  function _w14_pc(n){return ((parse(n+"4").midi%12)+12)%12;}
  /* 調の 7 つのダイアトニックコード（短調は自然短音階） */
  function _w14_triads(k){var sc=_w14_scale(k),out=[];
    for(var j=0;j<7;j++){var r=sc[j],a=sc[(j+2)%7],c=sc[(j+4)%7],pr=_w14_pc(r),i3=(_w14_pc(a)-pr+12)%12,i5=(_w14_pc(c)-pr+12)%12;
      var q=i3===4&&i5===7?"":i3===3&&i5===7?"m":i3===3&&i5===6?"dim":"aug",sym=r+q;
      out.push({sym:sym,deg:roman(sym,k),key:[pr,_w14_pc(a),_w14_pc(c)].sort(function(x,y){return x-y;}).join(",")});}
    return out;}
  function _w14_v7(k){return _w14_scale(k)[4]+"7";}
  /* 和音の列 → 鳴らす音（なるべく動かない配置 + 根音の低音） */
  function _w14_events(seq,spb){var prev=null,evs=[],t=0;
    seq.forEach(function(e){var v=voiceLead(e.sym,prev,52,67),c=chordParse(e.sym),bm=40+((c.rootPc-40)%12+12)%12;prev=v;
      evs.push({t:t*spb,d:e.b*spb*0.97,m:v.concat([bm]),v:0.9});t+=e.b;});
    return evs;}
  /* 押すと鳴り、もう一度押すと止まるボタン */
  function _w14_player(btn,getEvs,onStep,onReset){
    var label=btn.textContent;
    function reset(){btn.setAttribute("aria-pressed","false");btn.textContent=label;if(onReset)onReset();}
    btn.addEventListener("click",function(){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();reset();return;}
      playEvents(getEvs(),{timbre:"piano",onStep:onStep,onEnd:reset});
      btn.setAttribute("aria-pressed","true");btn.textContent="■ 止める";hold(reset);
    });
  }
  /* 和音の札（HTML）。st = {c: 枠の色, bg: 背景, tc: 下の文字の色, dash: 破線, hot: 再生中} */
  function _w14_chip(name,lines,st){st=st||{};
    return '<span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-start;min-width:2.9rem;padding:.22rem .3rem;border:1.6px '+(st.dash?'dashed':'solid')+' '+(st.c||'var(--line)')+
      ';border-radius:8px;background:'+(st.bg||'var(--screen)')+';font-family:var(--mono);font-size:.7rem;line-height:1.3'+(st.hot?';box-shadow:0 0 0 2.5px var(--signal)':'')+'">'+
      '<b style="font-family:var(--sans);font-size:.88rem;color:var(--ink)">'+esc(name)+'</b>'+
      lines.map(function(l){return '<span style="color:'+(l[1]||st.tc||'var(--muted)')+';white-space:nowrap">'+esc(l[0])+'</span>';}).join("")+'</span>';}

  /* ============ 14. w14_keyset — 和音を含む長調を、完全 5 度の連なりの上で数える ============ */
  REG.w14_keyset=function(el){
    head(el,"Keys","和音を選ぶと、その和音を含む長調が 5 度の連なりの上に表示される");
    var TYPES=[["長三和音","",["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"],"blue"],
               ["短三和音","m",["C","C#","D","Eb","E","F","F#","G","G#","A","Bb","B"],"purple"],
               ["減三和音","dim",["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],"gold"],
               ["属七の和音","7",["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"],"signal"]];
    var row=ctrls(el),st=select(row,"和音の種類",TYPES.map(function(t){return t[0];})),sr=select(row,"根音",TYPES[0][2].map(_w14_cn));
    function fillRoots(){var t=TYPES[+st.value],v=sr.value;sr.innerHTML=t[2].map(function(r,i){return '<option value="'+i+'">'+_w14_cn(r)+'</option>';}).join("");sr.value=v||"0";}
    st.value="1";fillRoots();sr.value="9";
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var view=mk("div","wscreen");view.style.padding=".5rem";el.appendChild(view);
    var ro=readout(el);
    function sym(){var t=TYPES[+st.value];return t[2][+sr.value]+t[1];}
    function P(n){var a=0;for(var i=1;i<n.length;i++)a+=n[i]==="#"?1:n[i]==="b"?-1:0;return "FCGDAEB".indexOf(n[0])-1+7*a;}
    function nameAt(p){var li=((p+1)%7+7)%7,acc=Math.floor((p+1)/7);return "FCGDAEB"[li]+(acc>0?"#":acc<0?"b":"");}
    function num(p){return p<0?"−"+(-p):String(p);}
    function draw(){
      var s=sym(),t=TYPES[+st.value],col=V(t[3]),soft=V(t[3]+"-soft"),tones=_w14_tones(s),ps=tones.map(P);
      var a=Math.min.apply(null,ps),b=Math.max.apply(null,ps),Ws=[];
      for(var w=b-7;w<=a+1;w++){if(w+1<-7||w+1>7)continue;Ws.push({w:w,ok:w>=b-6&&w<=a});}
      var lo=Ws[0].w,hi=Ws[Ws.length-1].w+6,cw=38,x0=8,X=function(p){return x0+(p-lo)*cw+cw/2;},Wd=x0*2+(hi-lo+1)*cw,g=[];
      g.push(ln(X(a),22,X(b),22,col,1.6),ln(X(a),16,X(a),28,col,1.6),ln(X(b),16,X(b),28,col,1.6));
      g.push(tx((X(a)+X(b))/2,15,"幅 "+(b-a),"middle",12,col,true));
      for(var p=lo;p<=hi;p++){var on=ps.indexOf(p)>=0;
        g.push('<circle cx="'+X(p)+'" cy="50" r="14" fill="'+(on?soft:V("panel"))+'" stroke="'+(on?col:V("line"))+'" stroke-width="'+(on?2:1.2)+'"/>');
        g.push(tx(X(p),54.5,_w14_cn(nameAt(p)),"middle",12,on?col:V("ink"),true));
        g.push(tx(X(p),77,num(p),"middle",9.5,V("muted")));}
      Ws.forEach(function(q,k){var y=88+k*20,xa=X(q.w)-16,xb=X(q.w+6)+16,tk=nameAt(q.w+1),kn=_w14_kname(tk);
        g.push('<rect x="'+xa+'" y="'+y+'" width="'+(xb-xa)+'" height="16" rx="8" fill="'+(q.ok?V("green-soft"):"none")+'" stroke="'+(q.ok?V("green"):V("muted"))+'" stroke-width="'+(q.ok?1.4:1)+'"'+(q.ok?'':' stroke-dasharray="3,3"')+'/>');
        g.push(tx((xa+xb)/2,y+12,kn+(q.ok?"（"+roman(s,tk)+"）":"（含まない）"),"middle",10.5,q.ok?V("green"):V("muted"),q.ok));});
      view.innerHTML=svgWrap(Wd,88+Ws.length*20+4,g.join(""));
      var ok=Ws.filter(function(q){return q.ok;});
      ro.innerHTML='<b style="color:'+col+'">'+esc(_w14_cn(s))+'</b>（'+esc(tones.map(_w14_cn).join("・"))+'）の位置 '+ps.map(num).join("・")+
        ' → 幅 s = <b>'+(b-a)+'</b> → 含む長調は 7 − '+(b-a)+' = <b>'+ok.length+'</b> つ<br>'+
        ok.map(function(q){var tk=nameAt(q.w+1);return '<b style="color:var(--green)">'+_w14_kname(tk)+'</b>（'+esc(roman(s,tk))+'）';}).join("・");
    }
    st.addEventListener("change",function(){fillRoots();draw();});sr.addEventListener("change",draw);
    _w14_player(bp,function(){return [{t:0,d:1.8,m:chordMidis(sym(),55)}];});
    draw();
  };

  /* ============ 14. w14_pivot — 2 つの調の共通和音と、転調の作り方 ============ */
  REG.w14_pivot=function(el){
    head(el,"Pivot","2 つの調を選び、共通和音を通る転調と直接転調を作って鳴らす");
    var names=_w14_KEYS.map(function(k){return _w14_kname(k)+"（"+_w14_cn(k.replace(/m$/," マイナー").replace(/^([A-G][#b]?)$/,"$1 メジャー"))+"）";});
    var row=ctrls(el),s1=select(row,"元の調",names),s2=select(row,"転調先の調",names);s1.value="0";s2.value="7";
    var row2=ctrls(el),sm=select(row2,"つなぎ方",["—"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var keysV=mk("div","wscreen");keysV.style.padding=".55rem .6rem";el.appendChild(keysV);
    var bandV=mk("div","wscreen");bandV.style.padding=".55rem .6rem";bandV.style.marginTop=".5rem";el.appendChild(bandV);
    var ro=readout(el),A=null,Q=[],hot=-1;
    function analyze(){var k1=_w14_KEYS[+s1.value],k2=_w14_KEYS[+s2.value],t1=_w14_triads(k1),t2=_w14_triads(k2),com=[];
      t1.forEach(function(a){t2.forEach(function(b){if(a.key===b.key)com.push({a:a,b:b});});});
      var p1=_w14_scale(k1).map(_w14_pc),p2=_w14_scale(k2).map(_w14_pc),cn=p1.filter(function(x){return p2.indexOf(x)>=0;}).length;
      var d=Math.abs(keyCount(k1)-keyCount(k2));if(d>6)d=12-d;
      return {k1:k1,k2:k2,t1:t1,t2:t2,com:com,cn:cn,d:d};}
    function opts(){A=analyze();var o=A.com.map(function(c,i){return ["p"+i,"ピボットコード "+_w14_cn(c.a.sym)+"（"+c.a.deg+" / "+c.b.deg+"）"];});
      o.push(["dI","直接転調（新しい調の I から）"],["dV","直接転調（新しい調の V7 から）"]);
      sm.innerHTML=o.map(function(x){return '<option value="'+x[0]+'">'+esc(x[1])+'</option>';}).join("");
      var sd=-1;[/^(IIm|IVm)$/,/^(IV|IIdim)$/].forEach(function(re){A.com.forEach(function(c,i){if(sd<0&&re.test(c.b.deg))sd=i;});});
      sm.value=A.com.length?"p"+(sd>=0?sd:0):"dI";}
    function build(){var mi2=/m$/.test(A.k2),I1=A.t1[0],IV1=A.t1[3],V1=_w14_v7(A.k1),I2=A.t2[0],IV2=A.t2[3],SD2=mi2?A.t2[3]:A.t2[1],V2=_w14_v7(A.k2),q=[],m=sm.value;
      function add(s,b,z,d1,d2){q.push({sym:s,b:b,z:z,d1:d1,d2:d2});}
      add(I1.sym,2,"o",I1.deg);add(IV1.sym,2,"o",IV1.deg);add(V1,2,"o",roman(V1,A.k1));add(I1.sym,2,"o",I1.deg);
      if(m[0]==="p"){var c=A.com[+m.slice(1)];add(c.a.sym,2,"b",c.a.deg,c.b.deg);add(V2,2,"n",0,"V7");add(I2.sym,2,"n",0,I2.deg);add(SD2.sym,2,"n",0,SD2.deg);add(V2,2,"n",0,"V7");add(I2.sym,4,"n",0,I2.deg);}
      else if(m==="dI"){add(I2.sym,2,"n",0,I2.deg);add(IV2.sym,2,"n",0,IV2.deg);add(V2,2,"n",0,"V7");add(I2.sym,4,"n",0,I2.deg);}
      else{add(V2,2,"n",0,"V7");add(I2.sym,2,"n",0,I2.deg);add(IV2.sym,2,"n",0,IV2.deg);add(V2,2,"n",0,"V7");add(I2.sym,4,"n",0,I2.deg);}
      return q;}
    function drawBand(){
      var st={o:{c:"var(--muted)"},b:{c:"var(--ink)",dash:1,bg:"var(--green-soft)"},n:{c:"var(--signal)",bg:"var(--signal-soft)"}};
      bandV.innerHTML='<div style="font-size:.8rem;font-weight:700;margin-bottom:.35rem">'+_w14_kname(A.k1)+' → '+_w14_kname(A.k2)+'</div><div style="display:flex;flex-wrap:wrap;gap:4px">'+
        Q.map(function(e,i){var s0=st[e.z],s2={c:s0.c,dash:s0.dash,bg:s0.bg,hot:i===hot};
          return _w14_chip(_w14_cn(e.sym),[[e.z==="o"?e.d1:e.z==="n"?e.d2:e.d1+" / "+e.d2]],s2);}).join("")+'</div>'+
        '<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:.4rem">灰色の枠: 元の調 ／ 黒い破線: ピボットコード ／ 色の枠: 転調先の調</div>';}
    function draw(){
      A=analyze();Q=build();
      function rowK(t,k,isNew){return '<div style="font-size:.78rem;font-weight:700;margin:.1rem 0 .3rem;color:'+(isNew?'var(--signal)':'var(--muted)')+'">'+_w14_kname(k)+'のダイアトニックコード</div><div style="display:flex;flex-wrap:wrap;gap:4px">'+
        t.map(function(c){var isC=A.com.some(function(x){return (isNew?x.b:x.a)===c;});return _w14_chip(_w14_cn(c.sym),[[c.deg]],isC?{c:"var(--green)",bg:"var(--green-soft)",tc:"var(--green)"}:{});}).join("")+'</div>';}
      keysV.innerHTML=rowK(A.t1,A.k1,false)+'<div style="height:.5rem"></div>'+rowK(A.t2,A.k2,true)+
        '<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:.4rem">緑の枠: 共通和音（ピボットコードの候補）</div>';
      drawBand();
      ro.innerHTML='五度圏での距離 d = <b>'+A.d+'</b> ／ 共通音 <b>'+A.cn+'</b> ／ 共通和音 <b>'+A.com.length+'</b>'+
        (A.k1===A.k2?'<br><span class="warn">元の調と転調先の調が同じ（転調にならない）</span>':A.com.length?'':'<br>共通和音が無いので、直接転調だけを選べる');
    }
    function changeKeys(){stopAll();opts();draw();}
    s1.addEventListener("change",changeKeys);s2.addEventListener("change",changeKeys);sm.addEventListener("change",function(){stopAll();draw();});
    _w14_player(bp,function(){return _w14_events(Q,0.6);},function(i){hot=i;drawBand();},function(){hot=-1;if(A)drawBand();});
    opts();draw();
  };

  /* ============ 14. w14_compare — 転調を見分ける手がかり ============ */
  REG.w14_compare=function(el){
    head(el,"Clues","例を選んで鳴らし、転調したかどうかを手がかりで確かめる");
    var PRE=[
      {n:"(a) 一時的なドミナント",c:"C F G7 C Am D7 G G7 C:4",z:"ooooooooo",d:"I IV V7 I VIm V7/V V V7 I",cad:{3:"ハ長調",6:"G へ（一時的）",8:"ハ長調"},
       r:"転調していない（ハ長調のまま）。F♯ は D7 の 1 回だけで、すぐ G7 で F に戻る。D7 はセカンダリードミナント（V7/V）。"},
      {n:"(b) 属調（ト長調）へ — ピボットコード Am",c:"C F G7 C Am D7 G Em Am D7 G:4",z:"oooobnnnnnn",d:"I IV V7 I VIm/IIm V7 I VIm IIm V7 I",cad:{3:"ハ長調",6:"ト長調",10:"ト長調"},
       r:"ハ長調 → ト長調。F♯ がくり返し現れて F に戻らず、ト長調の終止（D7 → G）が 2 回ある。"},
      {n:"下属調（ヘ長調）へ — ピボットコード C",c:"C F G7 C C7 F Bb C7 F:4",z:"ooobnnnnn",d:"I IV V7 I/V V7 I IV V7 I",cad:{3:"ハ長調",5:"ヘ長調",8:"ヘ長調"},
       r:"ハ長調 → ヘ長調。ハ長調の I（C）をヘ長調の V と読み替え、7 度の音 B♭ を加えた C7（ヘ長調の V7）から F へ進む。B♭ が続く。"},
      {n:"平行調（イ短調）へ — ピボットコード Dm",c:"C F G7 C Dm E7 Am Dm E7 Am:4",z:"oooobnnnnn",d:"I IV V7 I IIm/IVm V7 Im IVm V7 Im",cad:{3:"ハ長調",6:"イ短調",9:"イ短調"},
       r:"ハ長調 → イ短調。調号は変わらないが、イ短調の導音 G♯ がくり返し現れ、イ短調の終止（E7 → Am）が 2 回ある。"},
      {n:"全音上（ニ長調）へ — ピボットコード Em",c:"C F G7 C Em A7 D G A7 D:4",z:"oooobnnnnn",d:"I IV V7 I IIIm/IIm V7 I IV V7 I",cad:{3:"ハ長調",6:"ニ長調",9:"ニ長調"},
       r:"ハ長調 → ニ長調。ニ長調の導音 C♯ と F♯ が続き、ニ長調の終止（A7 → D）が 2 回ある。"},
      {n:"全音上（ニ長調）へ — 直接転調",c:"C F G7 C D G A7 D:4",z:"oooonnnn",d:"I IV V7 I I IV V7 I",cad:{3:"ハ長調",7:"ニ長調"},
       r:"ハ長調 → ニ長調。共通和音を通らず、C の直後から F♯・C♯ が現れる。"},
      {n:"半音上（変ニ長調）へ — 直接転調",c:"C F G7 C Db Gb Ab7 Db:4",z:"oooonnnn",d:"I IV V7 I I IV V7 I",cad:{3:"ハ長調",7:"変ニ長調"},
       r:"ハ長調 → 変ニ長調。共通和音が無く、ハ長調に無い 5 つの音（D♭・E♭・G♭・A♭・B♭）が一度に現れる。"},
      {n:"半音上（変ニ長調）へ — 新しい調の V7 を先に置く",c:"C F G7 C Ab7 Db Gb Ab7 Db:4",z:"oooonnnnn",d:"I IV V7 I V7 I IV V7 I",cad:{3:"ハ長調",5:"変ニ長調",8:"変ニ長調"},
       r:"ハ長調 → 変ニ長調。A♭7 → D♭（V7 → I）で新しい主音を示してから、変ニ長調の進行が始まる。"}];
    var row=ctrls(el),sp=select(row,"例",PRE.map(function(p){return p.n;}));sp.value="1";
    var row2=ctrls(el),cb=checkbox(row2,"手がかりを表示",true);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var view=mk("div","wscreen");view.style.padding=".55rem .6rem";el.appendChild(view);
    var ro=readout(el),hot=-1;
    var CMAJ=_w14_scale("C");
    function seq(){var p=PRE[+sp.value],ds=p.d.split(" ");return p.c.split(" ").map(function(tok,i){var m=tok.split(":");return {sym:m[0],b:m[1]?+m[1]:2,z:p.z[i],d:ds[i].replace("/"," / ")};});}
    function fixDeg(d){return d==="V7 / V"?"V7/V":d;}
    function draw(){
      var p=PRE[+sp.value],q=seq(),show=cb.checked,cnt={};
      var st={o:{c:"var(--muted)"},b:{c:"var(--ink)",dash:1,bg:"var(--green-soft)"},n:{c:"var(--signal)",bg:"var(--signal-soft)"}};
      var chips=q.map(function(e,i){var nn=_w14_tones(e.sym).filter(function(n){return CMAJ.indexOf(n)<0;});
        nn.forEach(function(n){cnt[n]=(cnt[n]||0)+1;});
        if(!show)return _w14_chip(_w14_cn(e.sym),[],{hot:i===hot});
        var lines=[[fixDeg(e.d)],[nn.length?nn.map(_w14_cn).join(" "):"·",nn.length?"var(--signal)":"var(--faint)"],[p.cad[i]?"終止":"·",p.cad[i]?"var(--green)":"var(--faint)"]];
        var s0=st[e.z];return _w14_chip(_w14_cn(e.sym),lines,{c:s0.c,dash:s0.dash,bg:s0.bg,hot:i===hot});});
      view.innerHTML=(show?'<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-bottom:.35rem">各札: コードネーム ／ ディグリーネーム ／ ハ長調に無い音（①） ／ 終止（②）</div>':'')+
        '<div style="display:flex;flex-wrap:wrap;gap:4px">'+chips.join("")+'</div>'+
        (show?'<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:.4rem">灰色の枠: ハ長調 ／ 黒い破線: ピボットコード ／ 色の枠: 転調先の調</div>':'');
      var ks=Object.keys(cnt);
      ro.innerHTML=show?'<b>'+esc(p.r)+'</b><br>① ハ長調に無い音: '+(ks.length?ks.map(function(n){return _w14_cn(n)+" × "+cnt[n];}).join("、"):"なし")+
        ' ／ ② 終止: '+Object.keys(p.cad).map(function(i){return p.cad[i];}).join(" → "):'和音の名前だけを表示している。聞いて判断してから「手がかりを表示」で確かめる。';
    }
    sp.addEventListener("change",function(){stopAll();draw();});cb.addEventListener("change",draw);
    _w14_player(bp,function(){return _w14_events(seq(),0.6);},function(i){hot=i;draw();},function(){hot=-1;draw();});
    draw();
  };
