  /* ============ 15. モード（共通） ============ */
  var _w15_MAJ=[2,2,1,2,2,2,1], _w15_NM=["イオニアン","ドリアン","フリジアン","リディアン","ミクソリディアン","エオリアン","ロクリアン"],
      _w15_ORD=[3,0,4,1,5,2,6], _w15_DEG=["1","♭2","2","♭3","3","4","♯4/♭5","5","♭6","6","♭7","7"], _w15_REF=[0,2,4,5,7,9,11], _w15_L="CDEFGAB";
  function _w15_rot(r){return _w15_MAJ.slice(r).concat(_w15_MAJ.slice(0,r));}
  function _w15_cum(r){var s=_w15_rot(r),c=[0];for(var i=0;i<6;i++)c.push(c[i]+s[i]);return c;}
  function _w15_col(r){var c=_w15_cum(r);return c[2]===4?"blue":c[4]===6?"gold":"purple";}
  function _w15_sc(t,r,n){return spellScale(t,_w15_rot(r),n||8);}
  function _w15_nm(a){return a.map(function(n){return nname(n,false);});}
  var _w15_JL={C:"ハ",D:"ニ",E:"ホ",F:"ヘ",G:"ト",A:"イ",B:"ロ"};
  function _w15_jkey(n){var p=parse(n);return (p.acc>0?"嬰":p.acc<0?"変":"")+_w15_JL[p.letter]+"長調";}
  function _w15_dl(c,i){var d=c-_w15_REF[i];return (d>0?"♯":d<0?"♭":"")+(i+1);}
  function _w15_ivn(i,s){var d=i+1,P={1:0,4:5,5:7},M={2:2,3:4,6:9,7:11},q=P[d]!=null?{0:"完全",1:"増","-1":"減"}[s-P[d]]:{0:"長","-1":"短",1:"増","-2":"減"}[s-M[d]];return q+" "+d+" 度";}
  /* 押すと鳴り、もう一度押すと止まるボタン。run(fin) の中で音を出し、終わったら fin() を呼ぶ */
  function _w15_btn(b,run,reset){
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var fin=function(){b.setAttribute("aria-pressed","false");if(reset)reset();};
      run(fin); b.setAttribute("aria-pressed","true"); hold(fin);
    });
  }
  /* 旋律・和音は playEvents（前の音は止まる）、ドローンは organ で重ねる */
  function _w15_play(evs,drone,o){
    var end=playEvents(evs,o);
    if(drone&&drone.length){var t=ac().currentTime+0.08;drone.forEach(function(m){note(m,t,end+0.4,"organ",0.75);});}
    return end;
  }
  function _w15_arr(x1,y,x2,col){var d=x2>x1?1:-1;return ln(x1,y,x2-d*5,y,col,1.4)+'<polygon points="'+x2+','+y+' '+(x2-d*6)+','+(y-3.5)+' '+(x2-d*6)+','+(y+3.5)+'" fill="'+col+'"/>';}
  /* 主音からの半音の数（12 列）の上に音を点で並べる図
     rows: [{lab, lcol, cum, names, col, hot:{半音:1}, ghost:[[旧,新]], ring, right, rcol, band, small}] */
  function _w15_grid(rows,o){
    o=o||{}; var x0=o.x0||136, cw=34, rh=o.rh||32, y0=60, W=x0+12*cw+(o.rw||92), H=y0+(rows.length-1)*rh+22, b=[];
    for(var k=0;k<12;k++){var cx=x0+k*cw+cw/2;
      b.push(tx(cx,20,String(k),"middle",9.5,V("muted")));
      b.push(tx(cx,40,_w15_DEG[k],"middle",k===6?8.5:10.5,V("ink"),true));
      b.push(ln(cx,48,cx,H-8,V("line"),0.8,"2,4"));}
    b.push(tx(x0-8,20,"主音からの半音の数","end",9.5,V("muted")));
    b.push(tx(x0-8,40,"長音階を基準にした書き方","end",9.5,V("muted")));
    rows.forEach(function(R,i){
      var y=y0+i*rh, rr=R.small?5:11;
      if(R.band)b.push('<rect x="2" y="'+(y-rh/2+1)+'" width="'+(W-4)+'" height="'+(rh-2)+'" rx="7" fill="'+V("signal-soft")+'"/>');
      b.push(tx(x0-8,y+4,R.lab,"end",R.small?10.5:11.5,V(R.lcol||"ink"),true));
      (R.ghost||[]).forEach(function(g){var gx=x0+g[0]*cw+cw/2,nx=x0+g[1]*cw+cw/2,d=g[1]>g[0]?1:-1;
        b.push('<circle cx="'+gx+'" cy="'+y+'" r="11" fill="none" stroke="'+V("muted")+'" stroke-width="1.1" stroke-dasharray="3,3"/>');
        b.push(_w15_arr(gx+d*12,y,nx-d*13,V("signal")));});
      R.cum.forEach(function(c,j){var cx=x0+c*cw+cw/2, hot=R.hot&&R.hot[c], col=hot?"signal":(R.col||"muted");
        if(R.ring===c)b.push('<circle cx="'+cx+'" cy="'+y+'" r="'+(rr+4)+'" fill="none" stroke="'+V("signal")+'" stroke-width="2.2"/>');
        b.push('<circle cx="'+cx+'" cy="'+y+'" r="'+rr+'" fill="'+V(col+"-soft")+'" stroke="'+V(col)+'" stroke-width="'+(hot?2:1.3)+'"/>');
        if(!R.small&&R.names)b.push(tx(cx,y+3.8,R.names[j],"middle",10,V(hot?"signal":"ink"),true));});
      if(R.right)b.push(tx(x0+12*cw+8,y+4,R.right,"start",10.5,V(R.rcol||"muted"),true));
    });
    return {svg:b.join(""),w:W,h:H};
  }
  function _w15_row(){var d=mk("div");d.style.cssText="display:flex;flex-wrap:wrap;gap:.6rem 1rem;justify-content:center;align-items:center";return d;}

  /* ============ 15. w15_white — 白鍵のどれを主音にするか ============ */
  REG.w15_white=function(el){
    head(el,"Modes","白鍵のうち、どの音を主音にするかを選ぶ");
    var L=_w15_L, row=ctrls(el);
    var sel=select(row,"主音にする白鍵",L.split("").map(function(x,i){return x+"（"+_w15_NM[i]+"）";})); sel.value="1";
    var dr=checkbox(row,"ドローン（主音を低く鳴らし続ける）",true);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bp=button(bar,"▶ 上がって下がる");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), act=null;
    function cur(){var r=+sel.value, sc=_w15_sc(L[r]+"4",r,8); return {r:r,sc:sc,ms:sc.map(function(n){return parse(n).midi;})};}
    function draw(){
      var c=cur(), st=_w15_rot(c.r), hl={};
      c.ms.forEach(function(m,i){var t=(i===0||i===7); hl[m]={c:t?"signal":"blue",label:c.sc[i][0],strong:t||m===act};});
      var k=kbd(60,83,{ww:24,wh:80,hl:hl,names:null}), body=k.svg;
      for(var i=0;i<7;i++){var xa=k.pos[c.ms[i]][0],xb=k.pos[c.ms[i+1]][0],y=k.h+5,h=st[i]===1,cl=V(h?"gold":"muted");
        body+='<polyline points="'+(xa+2)+','+y+' '+((xa+xb)/2)+','+(y+10)+' '+(xb-2)+','+y+'" fill="none" stroke="'+cl+'" stroke-width="'+(h?2.2:1.3)+'"/>'+tx((xa+xb)/2,y+25,h?"半":"全","middle",12,cl,h);}
      var s=9, x0=staffStart(s), items=c.sc.map(function(n,i){return {x:x0+i*25,notes:[n],fill:(c.ms[i]===act||i===0||i===7)?V("signal"):V("ink")};});
      var stf=staff({s:s,w:x0+7*25+16,clef:"treble",items:items});
      var rw=_w15_row(); rw.innerHTML=svgWrap(k.w,k.h+32,body)+svgWrap(stf.w,stf.h,stf.svg); view.innerHTML=""; view.appendChild(rw);
      var cum=_w15_cum(c.r), hs=[]; st.forEach(function(v,i){if(v===1)hs.push(i+1);});
      var tag=c.r===0?"（= 長音階）":c.r===5?"（= 自然短音階）":"";
      ro.innerHTML='<b>'+L[c.r]+' '+_w15_NM[c.r]+'</b>'+tag+': '+_w15_nm(c.sc).join(" ")+
        '<br>全・半の並び: '+st.map(function(v){return v===1?'<b style="color:var(--gold)">半</b>':"全";}).join("・")+'（半音は '+hs[0]+' 番目と '+hs[1]+' 番目の間隔）'+
        '<br>主音の上の 3 度: '+nname(c.sc[0],false)+'–'+nname(c.sc[2],false)+' は <b>'+(cum[2]===4?"長 3 度":"短 3 度")+'</b>（半音 '+cum[2]+'）';
    }
    sel.addEventListener("change",function(){if(bp.getAttribute("aria-pressed")==="true")stopAll();act=null;draw();});
    _w15_btn(bp,function(fin){
      var c=cur(), seq=c.ms.concat(c.ms.slice(0,7).reverse()), g=0.3, evs=seq.map(function(m,i){return {t:i*g,d:i===seq.length-1?1.1:g*0.95,m:[m]};});
      _w15_play(evs,dr.checked?[c.ms[0]-12]:[],{timbre:"piano",onStep:function(i){act=seq[i];draw();},onEnd:fin});
    },function(){act=null;draw();});
    draw();
  };

  /* ============ 15. w15_ladder — 明るさの順のはしご ============ */
  REG.w15_ladder=function(el){
    head(el,"Ladder","主音を決めて、明るい順に 1 音ずつ半音下げる");
    var L=_w15_L, row=ctrls(el), sT=select(row,"主音",L.split("")), sR=slider(row,"明るさの段",1,7,4,1), dr=checkbox(row,"ドローン",true);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var b1=button(bar,"▶ この段の音階"), b2=button(bar,"▶ 上の段から順に 7 つ");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), act=null, pr=null;
    function tonic(){return L[+sT.value]+"4";}
    function idx(){return pr!=null?pr:(+sR.input.value)-1;}
    function draw(){
      var t=tonic(), i0=idx(), r=_w15_ORD[i0], rows=[], prev=null, moved=null, old=null;
      sR.val.textContent=(+sR.input.value)+"（"+_w15_NM[_w15_ORD[(+sR.input.value)-1]]+"）";
      _w15_ORD.forEach(function(rr,i){
        var cum=_w15_cum(rr), nms=_w15_nm(_w15_sc(t,rr,7)), hot={}, mv=null, gh=null;
        if(prev){mv=cum.filter(function(c){return prev.indexOf(c)<0;})[0]; gh=prev.filter(function(c){return cum.indexOf(c)<0;})[0]; hot[mv]=1;}
        var alts=cum.filter(function(c,j){return c!==_w15_REF[j];}).length, up=cum[3]===6;
        rows.push({lab:_w15_NM[rr],lcol:_w15_col(rr),cum:cum,names:nms,col:_w15_col(rr),hot:hot,small:i!==i0,band:i===i0,
          ghost:(i===i0&&gh!=null)?[[gh,mv]]:null,ring:(i===i0&&act!=null)?act:null,right:up?"♯ 1 つ":alts?"♭ "+alts+" つ":"なし",rcol:i===i0?"signal":"muted"});
        if(i===i0&&gh!=null){moved=mv;old=gh;}
        prev=cum;
      });
      var g=_w15_grid(rows,{rh:28,rw:70}), sc=_w15_sc(t,r,8), ms=sc.map(function(n){return parse(n).midi;}), lo=12*Math.floor(ms[0]/12), hl={};
      ms.forEach(function(m,j){var c=(m-ms[0])%12, on=(act!=null&&c===act);hl[m]={c:(c===moved)?"signal":(j===0||j===7)?"signal":_w15_col(r),label:nname(sc[j],false),strong:on||j===0||j===7||c===moved};});
      var k=kbd(lo,lo+23,{ww:20,wh:72,hl:hl,names:null}), s=8, x0=staffStart(s);
      var stf=staff({s:s,w:x0+7*24+14,clef:"treble",items:sc.map(function(n,j){var c=(parse(n).midi-ms[0])%12;return {x:x0+j*24,notes:[n],fill:(c===moved||(act!=null&&c===act))?V("signal"):V("ink")};})});
      var rw=_w15_row(); rw.innerHTML='<div style="width:100%">'+svgWrap(g.w,g.h,g.svg)+'</div>'+svgWrap(k.w,k.h,k.svg)+svgWrap(stf.w,stf.h,stf.svg); view.innerHTML=""; view.appendChild(rw);
      var cum=_w15_cum(r), par=sc[(7-r)%7], pn=nname(par,false), kc=keyCount(nacc(pn)), tn=nname(t,false), prevNm=i0>0?_w15_NM[_w15_ORD[i0-1]]:null;
      var nms=_w15_nm(sc.slice(0,7)), oldNm=null, newNm=null;
      if(moved!=null){newNm=nms[cum.indexOf(moved)]; oldNm=_w15_nm(_w15_sc(t,_w15_ORD[i0-1],7))[_w15_cum(_w15_ORD[i0-1]).indexOf(old)];}
      ro.innerHTML='<b>'+tn+' '+_w15_NM[r]+'</b>（'+(i0+1)+' 段目）: '+nms.join(" ")+
        '<br>'+(i0>0?'1 つ上の段（'+tn+' '+prevNm+'）から <b style="color:var(--signal)">'+oldNm+' → '+newNm+'</b> と半音下げた':'いちばん上の段（これより明るい段は無い）')+
        '<br>主音の上の 3 度: <b>'+(cum[2]===4?"長 3 度":"短 3 度")+'</b> ／ 同じ 7 音を使う長調: <b>'+_w15_jkey(par)+'</b>（'+pn+' メジャー、調号 '+(kc===0?"なし":(kc>0?"♯ ":"♭ ")+Math.abs(kc)+" 個")+'）';
    }
    function stopIf(){if(b1.getAttribute("aria-pressed")==="true"||b2.getAttribute("aria-pressed")==="true")stopAll();}
    sT.addEventListener("change",function(){stopIf();act=null;draw();});
    sR.input.addEventListener("input",function(){stopIf();act=null;draw();});
    function reset(){act=null;pr=null;draw();}
    _w15_btn(b1,function(fin){
      var t=tonic(), sc=_w15_sc(t,_w15_ORD[idx()],8), ms=sc.map(function(n){return parse(n).midi;}), seq=ms.concat(ms.slice(0,7).reverse()), g=0.3;
      _w15_play(seq.map(function(m,i){return {t:i*g,d:i===seq.length-1?1.1:g*0.95,m:[m]};}),dr.checked?[ms[0]-12]:[],
        {timbre:"piano",onStep:function(i){act=(seq[i]-ms[0])%12;draw();},onEnd:fin});
    },reset);
    _w15_btn(b2,function(fin){
      var t=tonic(), evs=[], info=[], g=0.2, T=0;
      _w15_ORD.forEach(function(r,i){var ms=_w15_sc(t,r,8).map(function(n){return parse(n).midi;});
        ms.forEach(function(m,j){evs.push({t:T,d:j===7?0.5:g*0.95,m:[m]});info.push([i,(m-ms[0])%12]);T+=g;}); T+=0.35;});
      _w15_play(evs,dr.checked?[parse(t).midi-12]:[],{timbre:"piano",onStep:function(i){pr=info[i][0];act=info[i][1];draw();},onEnd:fin});
    },reset);
    draw();
  };

  /* ============ 15. w15_color — 特性音とモードらしい和音 ============ */
  /* 旋律: [音階の何番目（0〜7）, 長さ]。和音の進行: [音階の何番目, コードネームの後ろ]。c は特性音を比べる音階の音に替えた進行 */
  var _w15_MOT={3:[[0,1],[1,1],[2,1],[3,2],[4,1],[3,1],[2,1],[1,1],[0,2]],0:[[0,1],[1,1],[2,1],[3,1],[4,2],[3,1],[2,1],[1,1],[0,2]],
    4:[[0,1],[2,1],[4,1],[5,1],[6,2],[5,1],[4,1],[2,1],[0,2]],1:[[0,1],[2,1],[3,1],[4,1],[5,2],[4,1],[3,1],[2,1],[0,2]],
    5:[[0,1],[1,1],[2,1],[3,1],[4,2],[3,1],[2,1],[1,1],[0,2]],2:[[0,1],[1,2],[0,1],[2,1],[3,1],[2,1],[1,2],[0,2]],
    6:[[0,1],[2,1],[3,1],[4,2],[3,1],[2,1],[1,2],[0,2]]};
  var _w15_PRG={3:{m:[[0,""],[1,""]],c:[[0,""],[1,"m"]]},0:{m:[[0,""],[3,""],[4,"7"],[0,""]],c:null},4:{m:[[0,""],[6,""]],c:[[0,""],[6,"dim"]]},
    1:{m:[[0,"m7"],[3,"7"]],c:[[0,"m7"],[3,"m7"]]},5:{m:[[0,"m"],[5,""],[6,""],[0,"m"]],c:null},2:{m:[[0,"m"],[1,""]],c:[[0,"m"],[1,"dim"]]},
    6:{m:[[0,"dim"],[1,""]],c:[[0,"m"],[1,"dim"]]}};
  REG.w15_color=function(el){
    head(el,"Color","特性音と、特性音を含む和音を聞く");
    var L=_w15_L, row=ctrls(el), sM=select(row,"モード（明るさの順）",_w15_ORD.map(function(r){return _w15_NM[r];})), sT=select(row,"主音",L.split("")), dr=checkbox(row,"ドローン",true);
    sM.value="3";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var b1=button(bar,"▶ 特性音を含む旋律"), b2=button(bar,"▶ 比べる音階で同じ旋律"), b3=button(bar,"▶ 和音の進行"), b4=button(bar,"▶ 特性音を替えた進行");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), ring=null, ringRow=0, ach=null;   /* ach = [進行 0/1, 和音の番号] */
    function cur(){
      var r=_w15_ORD[+sM.value], t=L[+sT.value]+"4", ref=_w15_cum(r)[2]===4?0:5, cum=_w15_cum(r), rc=_w15_cum(ref);
      var sc=_w15_sc(t,r,8), rs=_w15_sc(t,ref,8), ch=cum.filter(function(c){return rc.indexOf(c)<0;});
      function prog(p,scl){if(!p)return null; return p.map(function(q){var sym=nname(scl[q[0]],false)+q[1], ms=chordMidis(sym,57);return {sym:sym,rom:roman(sym,L[+sT.value]),ms:ms,ns:chordSpell(sym,ms)};});}
      return {r:r,t:t,ref:ref,cum:cum,rc:rc,sc:sc,rs:rs,ch:ch,pm:prog(_w15_PRG[r].m,sc),pc:prog(_w15_PRG[r].c,rs)};
    }
    function stf(p,k,c,title){
      var s=8, x0=staffStart(s), dx=58, pcs=c.ch.map(function(v){return (parse(c.t).midi+v)%12;}), rpcs=c.rc.filter(function(v){return c.cum.indexOf(v)<0;}).map(function(v){return (parse(c.t).midi+v)%12;});
      var items=p.map(function(q,j){var on=ach&&ach[0]===k&&ach[1]===j;return {x:x0+14+j*dx,notes:q.ns,sym:q.sym,symcol:on?V("signal"):V("ink"),label:q.rom,lcol:V("muted"),ldy:4.6*s,
        fills:q.ms.map(function(m){var pc=m%12;return (k===0&&pcs.indexOf(pc)>=0)?V("signal"):(k===1&&rpcs.indexOf(pc)>=0)?V(c.ref===0?"blue":"purple"):on?V("signal"):V("ink");})};});
      var st=staff({s:s,w:x0+14+(p.length-1)*dx+30,clef:"treble",items:items,bottom:5.6*s});
      return '<div style="text-align:center"><div style="font-size:.78rem;color:var(--muted);font-family:var(--mono)">'+title+'</div>'+svgWrap(st.w,st.h,st.svg)+'</div>';
    }
    function draw(){
      var c=cur(), tn=nname(c.t,false), hot={}, gh=[];
      c.ch.forEach(function(v){hot[v]=1; gh.push([c.rc.filter(function(q){return c.cum.indexOf(q)<0&&Math.abs(q-v)===1;})[0],v]);});
      var chn=c.ch.map(function(v){return nname(c.sc[c.cum.indexOf(v)],false);});
      var rows=[{lab:tn+" "+_w15_NM[c.r],lcol:_w15_col(c.r),cum:c.cum,names:_w15_nm(c.sc.slice(0,7)),col:_w15_col(c.r),hot:hot,ghost:gh,ring:ringRow===0?ring:null,
        right:chn.length?"特性音 "+chn.join("・"):"特性音なし",rcol:chn.length?"signal":"muted"}];
      if(c.ch.length)rows.push({lab:"比べる: "+(c.ref===0?"長音階":"自然短音階"),lcol:"muted",cum:c.rc,names:_w15_nm(c.rs.slice(0,7)),col:"muted",ring:ringRow===1?ring:null,
        right:tn+" "+_w15_NM[c.ref],rcol:"muted"});
      var g=_w15_grid(rows,{rh:34});
      var rw=_w15_row(); rw.innerHTML='<div style="width:100%">'+svgWrap(g.w,g.h,g.svg)+'</div>'+stf(c.pm,0,c,"このモードの進行")+(c.pc?stf(c.pc,1,c,"特性音を替えた進行"):"");
      view.innerHTML=""; view.appendChild(rw);
      [b2,b4].forEach(function(b){b.disabled=!c.ch.length;b.style.opacity=c.ch.length?"":".45";});
      var desc=c.ch.map(function(v){var i=c.cum.indexOf(v);return '<b style="color:var(--signal)">'+nname(c.sc[i],false)+'</b>（'+_w15_dl(v,i)+'、主音から'+_w15_ivn(i,v)+'）';}).join("・");
      var pj=function(p){return p.map(function(q){return q.sym;}).join(" → ")+'（'+p.map(function(q){return q.rom;}).join(" → ")+'）';};
      ro.innerHTML='<b>'+tn+' '+_w15_NM[c.r]+'</b>: '+_w15_nm(c.sc.slice(0,7)).join(" ")+'<br>'+
        (c.ch.length?'主音の上の 3 度が'+(c.ref===0?"長 3 度":"短 3 度")+'なので、'+(c.ref===0?"長音階":"自然短音階")+'（'+_w15_nm(c.rs.slice(0,7)).join(" ")+'）と比べる ／ 特性音: '+desc
          :'このモードは'+(c.ref===0?"長音階":"自然短音階")+'そのもので、特性音は無い')+
        '<br>和音の進行: '+pj(c.pm)+(c.pc?' ／ 特性音を替えた進行: '+pj(c.pc):'');
    }
    function reset(){ring=null;ach=null;draw();}
    function stopIf(){if([b1,b2,b3,b4].some(function(b){return b.getAttribute("aria-pressed")==="true";}))stopAll();}
    [sM,sT].forEach(function(s){s.addEventListener("change",function(){stopIf();reset();});});
    function mel(k){return function(fin){
      var c=cur(), scl=k===0?c.sc:c.rs, cm=k===0?c.cum:c.rc, u=0.34, T=0, evs=[], cols=[];
      _w15_MOT[c.r].forEach(function(q){evs.push({t:T,d:q[1]*u*0.95,m:[parse(scl[q[0]]).midi]});cols.push(q[0]===7?0:cm[q[0]]);T+=q[1]*u;});
      _w15_play(evs,dr.checked?[parse(c.t).midi-12]:[],{timbre:"piano",onStep:function(i){ring=cols[i];ringRow=k;draw();},onEnd:fin});
    };}
    function chd(k){return function(fin){
      var c=cur(), p=k===0?c.pm:c.pc, seq=p.length===2?[0,1,0,1,0]:[0,1,2,3], d=1.25, evs=seq.map(function(j,i){return {t:i*d,d:i===seq.length-1?1.9:d*0.97,m:p[j].ms};});
      _w15_play(evs,dr.checked?[parse(c.t).midi-24]:[],{timbre:"piano",onStep:function(i){ach=[k,seq[i]];draw();},onEnd:fin});
    };}
    _w15_btn(b1,mel(0),reset); _w15_btn(b2,mel(1),reset); _w15_btn(b3,chd(0),reset); _w15_btn(b4,chd(1),reset);
    draw();
  };
