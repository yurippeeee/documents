  /* ============ 18. 共通: 3 曲の旋律と和音付けの一例（fig/f18.py と同じデータ） ============ */
  var _w18_SONGS={
    tw:{name:"きらきら星",tempo:100,
      mel:"C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2",
      ch:"C | F C | F C | G C | C F | C G | C F | C G | C | F C | F C | G C",
      cad:{4:"全終止",8:"半終止",12:"全終止"},form:[[1,4,"a"],[5,8,"b"],[9,12,"a"]]},
    ode:{name:"よろこびの歌",tempo:104,
      mel:"E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2 | D4 D4 E4 C4 | D4 E4:0.5 F4:0.5 E4 C4 | D4 E4:0.5 F4:0.5 E4 D4 | C4 D4 G3 E4~ | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2",
      ch:"C | G7 | C | C G | C | G7 | C | G7 C | G C | G7 C | G7 C | D7 G | C | G7 | C | G7 C",
      deg:{"D7@44":"V7/V"},cad:{4:"半終止",8:"全終止",12:"半終止",16:"全終止"},form:[[1,4,"a"],[5,8,"a'"],[9,12,"b"],[13,16,"a'"]]},
    ex3:{name:"例 3（作例）",tempo:96,
      mel:"C4 D4 E4 G4 | A4 G4 E4 C#4 | D4 E4 F4 D4 | E4 D4 C4:2 | C4 D4 E4 G4 | A4 G4 E4 C4 | D4 E4 F#4 D4 | B3 A3 G3:2 | G4 F#4 G4 D4 | C4 E4 D4 F#4 | G4:4 | G4 F4 D4 B3 | C4 D4 E4 G4 | A4:2 Ab4:2 | G4:2 F4 D4 | E4 D4 C4:2",
      ch:"C | A7 | Dm G7 | C | C | Am7 | D7 | G | G | Am D7 | G | G7 | C | F Fm | C G7 | C",
      key:{6:"G",7:"G",8:"G",9:"G",10:"G",11:"G"},deg:{"A7@4":"V7/IIm","Am7@20":["VIm7","IIm7"],"G@40":["I","V"]},dkey:{"Am7@20":["C","G"],"G@40":["G","C"]},
      cad:{4:"全終止",8:"全終止（ト長調）",11:"全終止（ト長調）",12:"半終止",16:"全終止"},
      band:[[1,5,"ハ長調","C"],[6,6,"ピボット","P"],[7,10,"ト長調","G"],[11,11,"ピボット","P"],[12,16,"ハ長調","C"]],form:[[1,4,"a"],[5,8,"a'"],[9,12,"b"],[13,16,"a''"]]}
  };
  (function(){var o=_w18_SONGS.ode,s={};for(var k in o)s[k]=o[k];
    s.mel=o.mel.replace("C4 D4 G3 E4~ | E4 E4 F4 G4","C4 D4 G3:2 | E4 E4 F4 G4");s.name="よろこびの歌（先取りを省いた形）";_w18_SONGS.odes=s;})();
  var _w18_FNC={T:"blue",SD:"green",D:"signal",SDm:"purple"};
  function _w18_mel(s){var out=[],t=0;s.split("|").forEach(function(b,bi){b.trim().split(/\s+/).forEach(function(tok){if(!tok)return;
    var tie=/~$/.test(tok),p=tok.replace(/~$/,"").split(":"),d=p[1]?parseFloat(p[1]):1;out.push({t:t,d:d,n:p[0],tie:tie,bar:bi+1});t+=d;});});return out;}
  function _w18_ch(s){var out=[],t=0;s.split("|").forEach(function(b,bi){var tk=b.trim().split(/\s+/).filter(Boolean);
    tk.forEach(function(tok){var p=tok.split(":"),d=p[1]?parseFloat(p[1]):4/tk.length;out.push({t:t,d:d,sym:p[0],bar:bi+1});t+=d;});});return out;}
  /* ディグリーネーム → 機能。V7/IIm のようなセカンダリードミナントは D */
  function _w18_fn(deg){if(deg.indexOf("/")>=0)return "D";var m=/^[♭♯]?(VII|VI|V|IV|III|II|I)(.*)$/.exec(deg);if(!m)return "T";
    var n=m[1],q=m[2];if(n==="I"||n==="III"||n==="VI")return "T";if(n==="IV")return /^m/.test(q)?"SDm":"SD";if(n==="II")return "SD";return "D";}
  function _w18_pcs(sym){var c=chordParse(sym);return c.ivs.map(function(v){return (c.rootPc+v)%12;});}
  function _w18_sym(s){return s.replace(/#/g,"♯").replace(/b/g,"♭");}
  /* 旋律と和音を読み、和音にディグリーネーム・機能を、音にコードトーンか非和声音かを付ける（f18.py と同じ規則） */
  function _w18_ana(S){
    var notes=_w18_mel(S.mel),chords=_w18_ch(S.ch);
    chords.forEach(function(c){var k=c.sym+"@"+Math.round(c.t);c.key=(S.key&&S.key[c.bar])||"C";var dg=S.deg&&S.deg[k];if(dg==null)dg=roman(c.sym,c.key);
      c.deg=Array.isArray(dg)?dg:[dg];c.dkey=(S.dkey&&S.dkey[k])||c.deg.map(function(){return c.key;});c.fn=c.deg.map(_w18_fn);c.sec=c.deg[0].indexOf("/")>=0;});
    function at(t){for(var i=0;i<chords.length;i++){var c=chords[i];if(c.t-1e-9<=t&&t<c.t+c.d-1e-9)return c;}return chords[chords.length-1];}
    notes.forEach(function(n,i){var p=parse(n.n),c=at(n.t);n.midi=p.midi;n.dia=p.dia;n.chord=c;n.ct=_w18_pcs(c.sym).indexOf(p.midi%12)>=0;n.cont=i>0&&notes[i-1].tie;n.nct=null;
      if(!n.ct&&i>0&&i<notes.length-1){var a=parse(notes[i-1].n),b=parse(notes[i+1].n),dp=p.dia-a.dia,dn=b.dia-p.dia,cn=at(notes[i+1].t);
        if(Math.abs(dp)===1&&dp===dn)n.nct="経過";else if(Math.abs(dp)===1&&dn===-dp)n.nct="刺繍";
        else if(b.midi===p.midi&&cn!==c&&_w18_pcs(cn.sym).indexOf(p.midi%12)>=0)n.nct="先取";}});
    return {S:S,notes:notes,chords:chords};
  }
  /* 旋律（タイはつないで 1 音に）と和音（低音付き）の再生用の列。拍 t0〜t1 の範囲だけ */
  function _w18_evs(A,spb,t0,t1,withCh){
    var evs=[],prev=null;
    A.notes.forEach(function(n,i){if(n.cont||n.t<t0-1e-9||n.t>=t1-1e-9)return;var d=n.d,j=i;while(A.notes[j].tie&&j+1<A.notes.length){j++;d+=A.notes[j].d;}
      evs.push({t:(n.t-t0)*spb,d:Math.max(0.1,d*spb*0.94),m:[n.midi],v:1,ni:i});});
    if(withCh)A.chords.forEach(function(c,ci){if(c.t<t0-1e-9||c.t>=t1-1e-9)return;var v=voiceLead(c.sym,prev,45,52);prev=v;var cp=chordParse(c.sym),bp=cp.bassPc!=null?cp.bassPc:cp.rootPc;
      evs.push({t:(c.t-t0)*spb,d:c.d*spb*0.98,m:[40+((bp-40)%12+12)%12].concat(v),v:0.8,ci:ci});});
    evs.sort(function(a,b){return a.t-b.t;});return evs;
  }
  /* 押すと鳴り、もう一度押すと止まるボタン。ほかの音が鳴り始めたら表示を戻す */
  function _w18_toggle(b,label,start,onEnd){
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var r=start(); if(!r)return; b.setAttribute("aria-pressed","true"); b.textContent="■ 止める";
      hold(function(){b.setAttribute("aria-pressed","false");b.textContent=label;if(onEnd)onEnd();});
    });
  }
  function _w18_play(evs,timbre,onStep,onEnd,btn,label){
    playEvents(evs,{timbre:timbre||"piano",onStep:onStep,onEnd:function(){if(btn){btn.setAttribute("aria-pressed","false");btn.textContent=label;}if(onEnd)onEnd();}});
  }

  /* ============ 18. w18_phrase — 2 つのまとまりの旋律を重ねて比べる ============ */
  REG.w18_phrase=function(el){
    head(el,"Phrase","2 つのまとまりの旋律を重ねて、同じ所と違う所を見る");
    var row=ctrls(el),sSong=select(row,"曲",["きらきら星","よろこびの歌"]),sLen=select(row,"まとまりの長さ",["4 小節（フレーズ）","2 小節"]);
    var row2=ctrls(el),sX=select(row2,"X（青い太線）",["-"]),sY=select(row2,"Y（紫の細線）",["-"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bX=button(bar,"▶ X を鳴らす"),bY=button(bar,"▶ Y を鳴らす"),bXY=button(bar,"▶ X → Y");
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),A=null,hot=null;
    function units(){var nb=+sLen.value===0?4:2,tot=A.notes[A.notes.length-1].bar,us=[];for(var b=1;b<=tot;b+=nb)us.push({b0:b,nb:nb,label:"第 "+b+"〜"+(b+nb-1)+" 小節"});return us;}
    function opts(sel,us,v){sel.innerHTML="";us.forEach(function(u,i){var o=mk("option");o.value=String(i);o.textContent=u.label;sel.appendChild(o);});sel.value=String(v);}
    function load(vx,vy){A=_w18_ana(_w18_SONGS[["tw","ode"][+sSong.value]]);var us=units();opts(sX,us,vx);opts(sY,us,vy);draw();}
    function grid(u){var a=[],on=[];for(var k=0;k<u.nb*8;k++){var t=4*(u.b0-1)+k/2,n=null;A.notes.forEach(function(q){if(q.t-1e-9<=t&&t<q.t+q.d-1e-9)n=q;});
      a.push(n);on.push(!!(n&&Math.abs(n.t-t)<1e-9&&!n.cont));}return {n:a,on:on};}
    function draw(){
      var us=units(),ux=us[+sX.value]||us[0],uy=us[+sY.value]||us[0],gx=grid(ux),gy=grid(uy),N=gx.n.length;
      var ds=[];gx.n.concat(gy.n).forEach(function(n){if(n)ds.push(n.dia);});
      var lo=Math.min.apply(null,ds)-1,hi=Math.max.apply(null,ds)+1,W=640,rh=15,H=34+(hi-lo)*rh+40,ml=44,mr=10,px=(W-ml-mr)/N,Y=function(d){return 16+(hi-d)*rh;};
      var diff=[],rhy=[],dk=null,shift=true;
      for(var k=0;k<N;k++){var a=gx.n[k],c=gy.n[k];if(!a||!c)continue;if(a.midi!==c.midi)diff.push(k);var d=c.dia-a.dia;if(dk==null)dk=d;else if(d!==dk)shift=false;if(gx.on[k]!==gy.on[k])rhy.push(k);}
      var b=[];
      diff.forEach(function(k){b.push('<rect x="'+(ml+k*px)+'" y="8" width="'+px+'" height="'+((hi-lo)*rh+16)+'" fill="'+V("alias-soft")+'"/>');});
      for(var d=lo;d<=hi;d++){var y=Y(d);b.push(ln(ml,y,W-mr,y,V("line"),0.8));b.push(tx(ml-6,y+4,LETTERS[((d%7)+7)%7]+Math.floor(d/7),"end",10,V("muted")));}
      var yb=Y(lo)+14;
      for(var q=0;q<=ux.nb*4;q++){var x=ml+q*2*px;b.push(ln(x,8,x,yb-8,q%4===0?V("muted"):V("grid"),q%4===0?1.2:1));if(q<ux.nb*4)b.push(tx(x+px,yb+4,String(q%4+1),"middle",10,V("muted")));}
      for(q=0;q<ux.nb;q++)b.push(tx(ml+(q*8+4)*px,yb+20,"X: "+(ux.b0+q)+" / Y: "+(uy.b0+q)+" 小節","middle",10,V("muted")));
      function seg(g,col,w,op,off,dash){for(var k=0;k<N;k++){var n=g.n[k];if(!n)continue;var x1=ml+k*px+2,x2=ml+(k+1)*px-2,y=Y(n.dia-off);
        b.push('<line x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" opacity="'+op+'"'+(dash?' stroke-dasharray="3,3"':'')+'/>');
        if(g.on[k])b.push('<circle cx="'+(x1+1)+'" cy="'+y+'" r="'+(w>4?5:3)+'" fill="'+col+'" opacity="'+op+'"/>');}}
      seg(gx,V("blue"),8,0.42,0);
      if(shift&&dk!==0&&dk!=null)seg(gy,V("purple"),2.2,0.9,dk,true);
      seg(gy,V("purple"),2.4,1,0);
      if(hot){var g=hot.u===0?gx:gy;for(var kk=0;kk<N;kk++)if(g.n[kk]===A.notes[hot.ni]&&(kk===0||g.n[kk-1]!==g.n[kk]))b.push('<circle cx="'+(ml+kk*px+3)+'" cy="'+Y(A.notes[hot.ni].dia)+'" r="7" fill="none" stroke="'+V("signal")+'" stroke-width="2.2"/>');}
      view.innerHTML=svgWrap(W,yb+28,b.join(""));
      var bars=[];diff.forEach(function(k){var bb=uy.b0+Math.floor(k/8);if(bars.indexOf(bb)<0)bars.push(bb);});
      var msg;
      if(!diff.length&&!rhy.length)msg='<b>同じ旋律</b>（同じ文字を付ける）';
      else if(!diff.length)msg='<b>高さは同じ</b>で、発音の位置だけが違う所がある（第 '+(uy.b0+Math.floor(rhy[0]/8))+' 小節の頭。タイで前からつながっている）';
      else if(shift&&!rhy.length)msg='<b>Y は X の各音を、文字 '+Math.abs(dk)+' 個分'+(dk>0?'上':'下')+'へずらした形</b>（リズムも同じ。紫の破線が元の高さに戻したもの）';
      else if(bars.length===1&&bars[0]===uy.b0+uy.nb-1)msg='<b>最後の小節だけが違う</b>（\' を付ける形）';
      else if(diff.length>N/2)msg='<b>大部分が違う</b>（新しい文字を付ける形）';
      else msg='<b>一部が違う</b>（違う小節: Y の第 '+bars.join("・")+' 小節）';
      ro.innerHTML='8 分音符ごとに比べた '+N+' か所のうち、同じ高さ <b>'+(N-diff.length)+'</b> か所・違う高さ <b>'+diff.length+'</b> か所（赤い背景）<br>→ '+msg;
    }
    /* which: 鳴らすまとまり（0 = X、1 = Y）の列 */
    function play(which,btn,label){var us=units(),spb=60/A.S.tempo,evs=[],off=0;which.forEach(function(w){var u=us[+(w?sY:sX).value],t0=4*(u.b0-1);
        _w18_evs(A,spb,t0,t0+4*u.nb,false).forEach(function(e){e.t+=off;e.u=w;evs.push(e);});off+=4*u.nb*spb+0.5;});
      _w18_play(evs,"piano",function(i){hot={u:evs[i].u,ni:evs[i].ni};draw();},function(){hot=null;draw();},btn,label);return true;}
    _w18_toggle(bX,"▶ X を鳴らす",function(){return play([0],bX,"▶ X を鳴らす");},function(){hot=null;draw();});
    _w18_toggle(bY,"▶ Y を鳴らす",function(){return play([1],bY,"▶ Y を鳴らす");},function(){hot=null;draw();});
    _w18_toggle(bXY,"▶ X → Y",function(){return play([0,1],bXY,"▶ X → Y");},function(){hot=null;draw();});
    sSong.addEventListener("change",function(){stopAll();load(0,1);});sLen.addEventListener("change",function(){stopAll();load(0,1);});
    [sX,sY].forEach(function(s){s.addEventListener("change",function(){stopAll();hot=null;draw();});});
    sSong.value="1";load(0,1);
  };

  /* ============ 18. 分析譜の 1 段を SVG で描く（w18_viewer） ============ */
  function _w18_row(A,b0,nb,first,last,L,cur){
    var s=8,U=26,G=14,xs=staffStart(s,0,"4/4"),x0=2,S=A.S;
    function Xr(r){return xs+U*r+G*Math.floor(r/4+1e-9);}
    function X(r){return x0+Xr(r);}
    function BXr(k){return Xr(4*k)-G*0.5-6;}
    var t0=4*(b0-1),t1=t0+4*nb,top=L.sym?42:28,items=[],extra=[];
    var rn=[],rc=[];A.notes.forEach(function(n,i){if(n.t>=t0-1e-9&&n.t<t1-1e-9)rn.push(i);});A.chords.forEach(function(c,i){if(c.t>=t0-1e-9&&c.t<t1-1e-9)rc.push(i);});
    rn.forEach(function(i){var n=A.notes[i],dd=durDot(n.d),col=i===cur.n?V("signal"):(L.nct&&n.nct&&!n.cont?V("gold"):V("ink"));
      var it={x:Xr(n.t-t0),notes:[n.n],dur:dd.dur,dot:dd.dot,fill:col};if(n.tie)it.tie=true;if(dd.dur==="eighth")it.beam="b"+Math.floor(n.t+1e-9);items.push(it);});
    for(var k=1;k<=nb;k++){var end=last&&k===nb;items.push({x:BXr(k)+(end?0.5*s:0),bar:end?"end":true});}
    var wr=BXr(nb)+(last?0.6*s:1),st=staff({s:s,w:wr,clef:"treble",time:first?"4/4":null,items:items,top:top}),b=[st.svg];
    function yn(nm){return top+4*s-(parse(nm).dia-30)*s/2;}
    var xend=x0+wr;
    if(rn.length){var ln_=A.notes[rn[rn.length-1]],fn_=A.notes[rn[0]];
      function half(x1,x2,y){var ya=y-0.55*s,xm=(x1+x2)/2;b.push('<path d="M'+x1+','+ya+' Q'+xm+','+(ya-1.1*s)+' '+x2+','+ya+' Q'+xm+','+(ya-0.8*s)+' '+x1+','+ya+'Z" fill="'+V("ink")+'"/>');}
      if(ln_.tie)half(X(ln_.t-t0)+4,xend-1,yn(ln_.n));if(fn_.cont)half(x0+xs-16,X(0)-4,yn(fn_.n));}
    b.push(tx(x0+2,top-8,String(b0),"start",9,V("muted")));for(k=1;k<nb;k++)b.push(tx(x0+BXr(k)-3,top-8,String(b0+k),"end",9,V("muted")));
    if(L.form)(S.form||[]).forEach(function(f){if(f[0]>=b0&&f[0]<b0+nb){var xf=f[0]===b0?x0+2:x0+BXr(f[0]-b0)+4;b.push(tx(xf+(f[0]===b0?14:0),14,f[2],"start",14,V("signal"),true));}});
    if(L.sym)rc.forEach(function(ci){var c=A.chords[ci];b.push(tx(X(c.t-t0)-5,top-18,_w18_sym(c.sym),"start",12.5,ci===cur.c?V("signal"):V("ink"),true));});
    var yb=top+4*s+12;
    if(L.nct){rn.forEach(function(i){var n=A.notes[i];if(n.nct&&!n.cont)b.push(tx(X(n.t-t0),yb+10,n.nct,"middle",10,V("gold"),true));});yb+=15;}
    if(L.deg){var two=rc.some(function(ci){return A.chords[ci].deg.length>1;});
      rc.forEach(function(ci){var c=A.chords[ci],x=X(c.t-t0)-5;if(c.deg.length===1)b.push(tx(x,yb+11,c.deg[0],"start",11.5,V("ink"),true));
        else c.deg.forEach(function(d,j){b.push(tx(x,yb+11+14*j,d+"（"+(c.dkey[j]==="C"?"ハ":"ト")+"）","start",10,j?V("muted"):V("ink"),true));});});yb+=two?33:19;}
    if(L.fn){rc.forEach(function(ci){var c=A.chords[ci],x1=X(c.t-t0)-9,x2=(c.t+c.d-t0<4*nb-1e-9)?X(c.t+c.d-t0)-12:xend-4,parts=c.fn.length;
        for(var j=0;j<parts;j++){var a=x1+(x2-x1)*j/parts+(j?1.5:0),z=x1+(x2-x1)*(j+1)/parts-(j<parts-1?1.5:0),f=c.fn[j],col=V(_w18_FNC[f]);
          b.push('<rect x="'+a+'" y="'+yb+'" width="'+(z-a)+'" height="16" rx="4" fill="'+V(_w18_FNC[f]+"-soft")+'" stroke="'+col+'" stroke-width="'+(ci===cur.c?2.6:1.2)+'"'+(c.sec?' stroke-dasharray="4,3"':'')+'/>');
          b.push(tx((a+z)/2,yb+12,f,"middle",10.5,col,true));}});yb+=22;}
    if(L.cad){Object.keys(S.cad||{}).forEach(function(k2){var bar=+k2,lab=S.cad[k2];if(bar>=b0&&bar<b0+nb){var xr=x0+BXr(bar-b0+1)-2,tw=12*lab.length+12;
        b.push('<rect x="'+(xr-tw)+'" y="'+(yb+1)+'" width="'+tw+'" height="18" rx="9" fill="'+V("panel")+'" stroke="'+V("ink")+'" stroke-width="1"/>');b.push(tx(xr-tw/2,yb+14,lab,"middle",11,V("ink"),true));}});yb+=24;}
    if(L.key&&S.band){S.band.forEach(function(q){var a=Math.max(q[0],b0),z=Math.min(q[1],b0+nb-1);if(a>z)return;
        var xa=x0+(a>b0?BXr(a-b0):xs-12)+3,xz=x0+BXr(z-b0+1)-3,c=q[3]==="C"?"blue":q[3]==="G"?"gold":"muted";
        b.push('<rect x="'+xa+'" y="'+yb+'" width="'+(xz-xa)+'" height="17" rx="4" fill="'+(q[3]==="P"?V("panel"):V(c+"-soft"))+'" stroke="'+V(c)+'" stroke-width="1.1"'+(q[3]==="P"?' stroke-dasharray="4,3"':'')+'/>');
        b.push(tx((xa+xz)/2,yb+12.5,q[2],"middle",10.5,V(c),true));});yb+=22;}
    return svgWrap(xend+6,yb+4,b.join(""));
  }

  /* ============ 18. w18_viewer — 分析譜を層ごとに切り替えて鳴らす ============ */
  REG.w18_viewer=function(el){
    head(el,"Analysis","曲と層を選び、分析譜を見ながら鳴らす");
    var ids=["tw","ode","ex3"],row=ctrls(el),sSong=select(row,"曲",["きらきら星","よろこびの歌","例 3（作例）"]),sT=slider(row,"テンポ（1 分あたりの拍数）",60,140,100,2);
    var row2=ctrls(el),LAY=[["sym","コードネーム"],["deg","ディグリーネーム"],["fn","機能"],["nct","非和声音"],["cad","終止"],["form","楽式"],["key","調の帯"]],cb={};
    row2.style.gap=".3rem 1rem";LAY.forEach(function(q){cb[q[0]]=checkbox(row2,q[1],true);cb[q[0]].parentNode.parentNode.style.flex="0 1 auto";cb[q[0]].parentNode.parentNode.style.minWidth="0";});
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 全体を鳴らす");
    var hint=mk("span","",'段を押すと、その 4 小節（狭い画面では 2 小節）だけが鳴る');hint.style.cssText="font-family:var(--mono);font-size:.72rem;color:var(--muted);align-self:center";bar.appendChild(hint);
    var view=mk("div","wscreen");view.style.padding=".5rem .3rem";view.style.overflowX="auto";el.appendChild(view);
    var ro=readout(el),A=null,cur={n:-1,c:-1};
    function lay(){var L={};LAY.forEach(function(q){L[q[0]]=cb[q[0]].checked;});return L;}
    function draw(){
      if(!A)return;var L=lay(),W=view.clientWidth||640,bpr=W<560?2:4,tot=A.notes[A.notes.length-1].bar,h=[];sT.val.textContent=sT.input.value;
      for(var b0=1;b0<=tot;b0+=bpr)h.push('<div class="_w18r" data-b0="'+b0+'" data-nb="'+bpr+'" style="cursor:pointer;margin:.1rem 0">'+_w18_row(A,b0,bpr,b0===1,b0+bpr-1>=tot,L,cur)+'</div>');
      view.innerHTML=h.join("");
      var S=A.S,cads=Object.keys(S.cad).map(function(k){return "第 "+k+" 小節: "+S.cad[k];}).join("、");
      ro.innerHTML=S.name+'（'+tot+' 小節）　楽式: <b>'+S.form.map(function(f){return f[2];}).join(" ")+'</b><br>終止: '+cads+(cur.c>=0?'<br>鳴っている和音: <b>'+_w18_sym(A.chords[cur.c].sym)+'</b>（'+A.chords[cur.c].deg.join(" / ")+'、'+A.chords[cur.c].fn.join(" / ")+'）':'');
    }
    function load(){stopAll();A=_w18_ana(_w18_SONGS[ids[+sSong.value]]);sT.input.value=A.S.tempo;cur={n:-1,c:-1};draw();}
    function play(t0,t1,btn,label){var spb=60/(+sT.input.value),evs=_w18_evs(A,spb,t0,t1,true);
      _w18_play(evs,"piano",function(i){var e=evs[i];if(e.ni!=null)cur.n=e.ni;if(e.ci!=null)cur.c=e.ci;draw();},function(){cur={n:-1,c:-1};draw();},btn,label);return true;}
    _w18_toggle(bp,"▶ 全体を鳴らす",function(){return play(0,4*A.notes[A.notes.length-1].bar,bp,"▶ 全体を鳴らす");},function(){cur={n:-1,c:-1};draw();});
    view.addEventListener("click",function(e){var r=e.target.closest&&e.target.closest("._w18r");if(!r)return;var b0=+r.getAttribute("data-b0"),nb=+r.getAttribute("data-nb");
      stopAll();play(4*(b0-1),4*(b0-1+nb),null,null);});
    sSong.addEventListener("change",load);sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;});
    LAY.forEach(function(q){cb[q[0]].addEventListener("change",draw);});
    reg(null,draw);load();
  };

  /* ============ 18. w18_reharm — 2 拍ごとの和音を選び直して聞き比べる ============ */
  REG.w18_reharm=function(el){
    head(el,"Reharmonize","2 拍ごとの和音を選び直し、旋律との重なりと終止を確かめる");
    var ids=["tw","odes"],row=ctrls(el),sSong=select(row,"曲",["きらきら星","よろこびの歌（先取りを省いた形）"]);
    var bar=mk("div","pbtns");el.appendChild(bar);var bEx=button(bar,"この章の例"),bAlt=button(bar,"別の例"),bI=button(bar,"すべて I"),bp=button(bar,"▶ 鳴らす");
    var CANDS=["C","Dm","Em","F","G","G7","Am","Bdim","D7","E7","A7","Fm"],SEC={D7:"V7/V",E7:"V7/VIm",A7:"V7/IIm"},TGT={D7:["G","G7"],E7:["Am"],A7:["Dm"]};
    var ALT={tw:"C C|F C|Dm C|G7 C|Em Dm|C G|Em Dm|Am G|C C|F C|Dm C|G7 C",odes:"C C|G7 G7|Am Am|Em G|C C|G7 G7|Am Am|G7 C|G Em|G7 Am|G7 C|D7 G|C C|G7 G7|Am Am|G7 C"};
    var grid=mk("div","");grid.style.cssText="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.7rem";el.appendChild(grid);
    var ro=readout(el),A=null,slots=[],hot=-1;
    function deg(sym){return SEC[sym]||roman(sym,"C");}
    function fnOf(sym){return _w18_fn(deg(sym));}
    function preset(kind){var S=A.S,nb=A.notes[A.notes.length-1].bar,out=[];
      if(kind==="ex"){A.chords.forEach(function(c){for(var k=0;k<Math.round(c.d/2);k++)out.push(c.sym);});}
      else if(kind==="alt"){ALT[S.id].split("|").forEach(function(b){b.trim().split(/\s+/).forEach(function(x){out.push(x);});});}
      else for(var i=0;i<2*nb;i++)out.push("C");
      slots.forEach(function(s,i){s.sel.value=out[i];});update();}
    function build(){var S=_w18_SONGS[ids[+sSong.value]];S.id=ids[+sSong.value];A=_w18_ana(S);grid.innerHTML="";slots=[];var nb=A.notes[A.notes.length-1].bar;
      for(var b=1;b<=nb;b++){var box=mk("div","");box.style.cssText="flex:1 1 9.4rem;min-width:9.4rem;border:1px solid var(--line);border-radius:8px;padding:.3rem .35rem;background:var(--screen)";
        box.appendChild(mk("div","",'<span style="font-family:var(--mono);font-size:.7rem;color:var(--muted)">第 '+b+' 小節</span>'));
        var two=mk("div","");two.style.cssText="display:flex;gap:.3rem";box.appendChild(two);
        for(var h=0;h<2;h++){var c=mk("div","");c.style.cssText="flex:1;min-width:0";var nt=mk("div","");nt.style.cssText="font-family:var(--mono);font-size:.8rem;min-height:1.3rem;white-space:nowrap";
          var sel=mk("select");sel.style.cssText="width:100%;font-family:var(--mono);font-size:.78rem;padding:.2rem;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink)";
          CANDS.forEach(function(x){var o=mk("option");o.value=x;o.textContent=_w18_sym(x);sel.appendChild(o);});
          var dg=mk("div","");dg.style.cssText="font-family:var(--mono);font-size:.72rem;margin-top:.15rem;min-height:1.1rem";
          c.appendChild(nt);c.appendChild(sel);c.appendChild(dg);two.appendChild(c);
          var t0=4*(b-1)+2*h;slots.push({t0:t0,sel:sel,nt:nt,dg:dg,box:c});sel.addEventListener("change",update);}
        grid.appendChild(box);}
      preset("ex");}
    function update(){
      var strong=0,flows=[],cads=[],nb=A.notes[A.notes.length-1].bar;
      slots.forEach(function(s,i){var sym=s.sel.value,pc=_w18_pcs(sym),h=[];
        A.notes.forEach(function(n){if(n.cont||n.t<s.t0-1e-9||n.t>=s.t0+2-1e-9)return;var ok=pc.indexOf(n.midi%12)>=0,stg=Math.abs(n.t-s.t0)<1e-9;if(!ok&&stg)strong++;
          h.push('<span style="color:'+(ok?'var(--green)':stg?'var(--alias)':'var(--gold)')+';font-weight:'+(ok?400:700)+(stg?';text-decoration:underline':'')+'">'+nname(n.n,false)+'</span>');});
        s.nt.innerHTML=h.join(" ")||"&nbsp;";var f=fnOf(sym);
        s.dg.innerHTML='<b>'+deg(sym)+'</b> <span style="color:var(--'+_w18_FNC[f]+')">'+f+'</span>';
        s.box.style.outline=i===hot?"2px solid var(--signal)":"none";});
      var seq=[];slots.forEach(function(s,i){var sym=s.sel.value;if(!seq.length||seq[seq.length-1].sym!==sym)seq.push({sym:sym,i:i});});
      for(var k=1;k<seq.length;k++){var a=seq[k-1].sym,c=seq[k].sym,fa=fnOf(a),fc=fnOf(c),bb=Math.floor(seq[k].i/2)+1;
        if(SEC[a]){if(TGT[a].indexOf(c)<0)flows.push("第 "+bb+" 小節: "+_w18_sym(a)+"（"+SEC[a]+"）の次が "+TGT[a].join("・")+" でない");}
        else if(fa==="D"&&(fc==="SD"||fc==="SDm"))flows.push("第 "+bb+" 小節: D → "+fc+"（"+_w18_sym(a)+" → "+_w18_sym(c)+"）");}
      for(var e=4;e<=nb;e+=4){var last=slots[2*e-1].sel.value,prev=null;for(var j=2*e-2;j>=0;j--){if(slots[j].sel.value!==last){prev=slots[j].sel.value;break;}}
        var l=fnOf(last),p=prev?fnOf(prev):null,kind;
        if(last==="C"&&p==="D"&&!SEC[prev])kind="全終止";else if(last==="C"&&(p==="SD"||p==="SDm"))kind="変終止";else if(l==="D"&&!SEC[last])kind="半終止";
        else if(last==="Am"&&p==="D")kind="偽終止";else kind="終止の形になっていない";
        cads.push("第 "+e+" 小節: "+(prev?_w18_sym(prev)+" → ":"")+_w18_sym(last)+" <b>"+kind+"</b>");}
      ro.innerHTML='強拍（1・3 拍目）の音で和音に含まれないもの: <b'+(strong?' class="warn"':'')+'>'+strong+'</b> か所（下線付きの赤）<br>'+
        '機能の流れに合わない動き: '+(flows.length?'<span class="warn">'+flows.join("、")+'</span>':'<b>なし</b>')+'<br>フレーズの終わり: '+cads.join("、")+
        '<br><span style="color:var(--green)">緑</span> = 和音の音、<span style="color:var(--gold)">金</span> = 弱拍の非和声音';
    }
    function play(){var spb=60/A.S.tempo,evs=[],prev=null;
      A.notes.forEach(function(n,i){if(n.cont)return;var d=n.d,j=i;while(A.notes[j].tie&&j+1<A.notes.length){j++;d+=A.notes[j].d;}evs.push({t:n.t*spb,d:d*spb*0.94,m:[n.midi],v:1});});
      var k=0;while(k<slots.length){var sym=slots[k].sel.value,j=k;while(j+1<slots.length&&slots[j+1].sel.value===sym)j++;var v=voiceLead(sym,prev,45,52);prev=v;var cp=chordParse(sym);
        evs.push({t:slots[k].t0*spb,d:(j-k+1)*2*spb*0.98,m:[40+((cp.rootPc-40)%12+12)%12].concat(v),v:0.8,si:k});k=j+1;}
      evs.sort(function(a,b){return a.t-b.t;});
      _w18_play(evs,"piano",function(i){if(evs[i].si!=null){hot=evs[i].si;update();}},function(){hot=-1;update();},bp,"▶ 鳴らす");return true;}
    _w18_toggle(bp,"▶ 鳴らす",play,function(){hot=-1;update();});
    bEx.addEventListener("click",function(){preset("ex");});bAlt.addEventListener("click",function(){preset("alt");});bI.addEventListener("click",function(){preset("I");});
    sSong.addEventListener("change",function(){stopAll();build();});
    build();
  };
