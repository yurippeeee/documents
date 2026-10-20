  /* ---------- 13: ノンダイアトニックコード（共通） ---------- */
  var _w13_CMAJ=[0,2,4,5,7,9,11];
  function _w13_out(m){return _w13_CMAJ.indexOf(((m%12)+12)%12)<0;}
  function _w13_pc(m){return ((m%12)+12)%12;}
  /* ベース（根音）を E2〜D♯3 に置く（再生カードの bass: on と同じ高さ） */
  function _w13_bass(sym){var c=chordParse(sym),pc=c.bassPc!=null?c.bassPc:c.rootPc;return 40+((pc-40)%12+12)%12;}
  /* 押すと鳴らし、もう一度押すと止めるボタン。steps() は playEvents の列、show(i) は i 番目が鳴り始めたとき（-1 は終わり） */
  function _w13_btn(bar,label,steps,show){
    var b=button(bar,label);
    b.addEventListener("click",function(){
      if(b.getAttribute("aria-pressed")==="true"){stopAll();return;}
      var ev=steps();
      playEvents(ev,{timbre:"piano",onStep:function(i){show(i,b);},onEnd:function(){b.setAttribute("aria-pressed","false");show(-1,b);}});
      b.setAttribute("aria-pressed","true");
      hold(function(){b.setAttribute("aria-pressed","false");show(-1,b);});
    });
    return b;
  }
  /* 和音の列を、ベース付きで順に鳴らす形にする（各和音の長さ d[i] 秒） */
  function _w13_seq(list,d){var t=0;return list.map(function(c,i){var e={t:t,d:d[i]*0.98,m:[c.b].concat(c.m)};t+=d[i];return e;});}
  function _w13_names(ns){return ns.map(function(n){return nname(n,false);});}

  /* ============ 13. w13_secdom — 目標の和音とセカンダリードミナント ============ */
  REG.w13_secdom=function(el){
    head(el,"Secondary","目標の和音 X を選ぶと、X へ向かうセカンダリードミナント V7/X が表示される");
    var T=[
      {x:"Dm",xd:"IIm",v:"A7",k:"ニ短調",same:"Am",vm:[69,73,76,79],xm:[69,74,77],sm:[69,72,76]},
      {x:"Em",xd:"IIIm",v:"B7",k:"ホ短調",same:"Bdim",vm:[59,63,66,69],xm:[59,64,67],sm:[59,62,65]},
      {x:"F",xd:"IV",v:"C7",k:"ヘ長調",same:"C",vm:[60,64,67,70],xm:[60,65,69],sm:[60,64,67]},
      {x:"G",xd:"V",v:"D7",k:"ト長調",same:"Dm",vm:[62,66,69,72],xm:[62,67,71],sm:[62,65,69]},
      {x:"Am",xd:"VIm",v:"E7",k:"イ短調",same:"Em",vm:[64,68,71,74],xm:[64,69,72],sm:[64,67,71]}];
    var row=ctrls(el), sel=select(row,"目標の和音 X（ハ長調）",T.map(function(t){return t.x+"（"+t.xd+"）";})); sel.value="3";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var view=mk("div","wscreen"); view.style.padding=".6rem";
    var ro=readout(el), act=null;   /* act = {seq:"v"|"s", i:0..2} */
    var I={b:_w13_bass("C"),m:[60,64,67]};
    function cur(){return T[+sel.value];}
    function events(kind){var t=cur(),mid=kind==="v"?{b:_w13_bass(t.v),m:t.vm}:{b:_w13_bass(t.same),m:t.sm};
      return _w13_seq([I,mid,{b:_w13_bass(t.x),m:t.xm}],[1.2,1.5,2.2]);}
    function show(kind){return function(i){act=i<0?null:{seq:kind,i:i};draw();};}
    _w13_btn(bar,"▶ I → V7/X → X",function(){return events("v");},show("v"));
    _w13_btn(bar,"▶ I → 同じ根音のダイアトニックコード → X",function(){return events("s");},show("s"));
    el.appendChild(view); el.appendChild(ro);
    function draw(){
      var t=cur(), vn=chordSpell(t.v,t.vm), xn=chordSpell(t.x,t.xm), sn=chordSpell(t.same,t.sm);
      var lt=t.vm[1], root=lt+1;
      /* 鍵盤: 鳴っている和音（鳴っていないときは V7/X）。調の外の音は赤、X の根音は緑 */
      var showM=t.vm, showN=vn, title="V7/X = "+t.v;
      if(act&&act.i===0){showM=I.m;showN=chordSpell("C",I.m);title="I = C";}
      else if(act&&act.i===1){if(act.seq==="s"){showM=t.sm;showN=sn;title=t.same+"（同じ根音のダイアトニックコード）";}}
      else if(act&&act.i===2){showM=t.xm;showN=xn;title="X = "+t.x;}
      var hl={};
      if(!act){hl[root]={c:"green",label:nname(xn[t.xm.indexOf(root)],false),strong:false};}
      showM.forEach(function(m,i){hl[m]={c:_w13_out(m)?"signal":"muted",label:nname(showN[i],false),strong:true};});
      var k=kbd(59,79,{ww:22,wh:84,hl:hl,names:null});
      var kb='<div style="text-align:center"><div style="font-size:.8rem;font-weight:700;margin-bottom:.3rem">'+esc(title)+'</div>'+svgWrap(k.w,k.h,k.svg)+'</div>';
      /* 五線: V7/X → X ‖ 同じ根音のダイアトニックコード → X */
      function lc(seq,i){return act&&act.seq===seq&&act.i===i?V("signal"):V("ink");}
      function fills(ms){return ms.slice().sort(function(a,b){return a-b;}).map(function(m){return _w13_out(m)?V("signal"):V("ink");});}
      var sv=staff({s:9,w:430,clef:"treble",items:[
        {x:70,notes:vn,fills:fills(t.vm),label:t.v,lcol:lc("v",1)},
        {x:150,notes:xn,label:t.x,lcol:lc("v",2)},
        {x:205,bar:"double"},
        {x:270,notes:sn,label:t.same,lcol:lc("s",1)},
        {x:350,notes:xn,label:t.x,lcol:lc("s",2)}]});
      var cap='<div style="display:flex;justify-content:space-around;font-size:.72rem;color:var(--muted);max-width:430px;margin:0 auto">'+
        '<span>V7/X → X</span><span>同じ根音のダイアトニックコード → X</span></div>';
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:flex-end">'+kb+
        '<div>'+svgWrap(sv.w,sv.h,sv.svg)+cap+'</div></div>';
      /* 読み取り */
      var names=_w13_names(vn), outs=[];
      t.vm.forEach(function(m,i){if(_w13_out(m))outs.push(names[i]+"（"+["根音","導音","5 度の音","7 度の音"][i]+"）");});
      var xPc=chordParse(t.x).rootPc, minor=chordParse(t.x).ivs.indexOf(3)>=0, x3=(xPc+(minor?3:4))%12;
      var x3n=nname(xn[t.xm.map(_w13_pc).indexOf(x3)],false), drop=(_w13_pc(t.vm[3])-x3+12)%12;
      var snames=_w13_names(sn), ch=[];
      for(var i=0;i<3;i++)if(snames[i]!==names[i])ch.push(snames[i]+" を "+names[i]+" に");
      var vfun="V7/"+t.xd;
      ro.innerHTML='X = <b>'+t.x+'（'+t.xd+'）</b> を主和音とみなす調: '+t.k+' ／ <b style="color:var(--signal)">'+vfun+' = '+t.v+'</b>（ディグリーネーム '+roman(t.v,"C")+'）<br>'+
        '構成音 <b>'+names.join(" ")+'</b> ／ ハ長調の外の音: <b style="color:var(--signal)">'+outs.join("・")+'</b>'+(t.x==="F"?'（導音 E はハ長調の音）':'')+'<br>'+
        '解決: '+names[1]+' → '+nname(xn[t.xm.indexOf(root)],false)+'（半音上） ／ 7 度の音 '+names[3]+' → '+x3n+'（'+(drop===1?'半音下':'全音下')+'）<br>'+
        '同じ根音のダイアトニックコード '+t.same+'（'+snames.join(" ")+'）'+(ch.length?'の '+ch.join("、")+'上げ、':'に ')+'7 度の音 '+names[3]+' を足した形';
    }
    sel.addEventListener("change",function(){stopAll();act=null;draw();});
    draw();
  };

  /* ============ 13. w13_borrow — ハ長調の和音と、ハ短調から借りた和音 ============ */
  REG.w13_borrow=function(el){
    head(el,"Borrow","同じ番号の和音を、ハ長調のものとハ短調から借りたものとで比べる");
    var DG=["I","II","III","IV","V","VI","VII"];
    var MAJ=[["C","CM7"],["Dm","Dm7"],["Em","Em7"],["F","FM7"],["G","G7"],["Am","Am7"],["Bdim","Bm7(b5)"]];
    var MIN=[["Cm","Cm7"],["Ddim","Dm7(b5)"],["Eb","EbM7"],["Fm","Fm7"],["Gm","Gm7"],["Ab","AbM7"],["Bb","Bb7"]];
    var SMAJ=spellScale("C4",MAJOR,14), SMIN=spellScale("C4",NAT_MINOR,14);
    var row=ctrls(el), sd=select(row,"番号",DG), sf=select(row,"和音の形",["三和音","セブンスコード"]); sd.value="3";
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var view=mk("div","wscreen"); view.style.padding=".6rem";
    var ro=readout(el), act=null;
    var I={b:_w13_bass("C"),m:[60,64,67]};
    function cur(){var j=+sd.value,n=sf.value==="1"?4:3,mj=[],mn=[];
      for(var k=0;k<n;k++){mj.push(SMAJ[j+2*k]);mn.push(SMIN[j+2*k]);}
      var a=MAJ[j][n-3],b=MIN[j][n-3];
      return {a:a,b:b,an:mj,bn:mn,am:mj.map(function(q){return parse(q).midi;}),bm:mn.map(function(q){return parse(q).midi;})};}
    function events(which){var c=cur();var mid=which==="a"?{b:_w13_bass(c.a),m:c.am}:{b:_w13_bass(c.b),m:c.bm};
      return _w13_seq([I,mid,I],[1.2,1.6,2.2]);}
    function show(which){return function(i){act=i<0?null:{w:which,i:i};draw();};}
    _w13_btn(bar,"▶ I → ハ長調の和音 → I",function(){return events("a");},show("a"));
    _w13_btn(bar,"▶ I → 借りた和音 → I",function(){return events("b");},show("b"));
    el.appendChild(view); el.appendChild(ro);
    function disp(s){return s.replace(/b5/g,"♭5").replace(/^([A-G])b/,"$1♭");}
    function draw(){
      var c=cur(), an=_w13_names(c.an), bn=_w13_names(c.bn), ch=[];
      for(var i=0;i<an.length;i++)if(an[i]!==bn[i])ch.push(i);
      function board(ms,ns,isB,title,on){
        var hl={};ms.forEach(function(m,i){var changed=ch.indexOf(i)>=0;hl[m]={c:changed?(isB?"signal":"blue"):"muted",label:nname(ns[i],false),strong:true};});
        var k=kbd(60,83,{ww:16,wh:66,hl:hl,names:null});
        return '<div style="text-align:center"><div style="font-size:.8rem;font-weight:700;margin-bottom:.3rem;color:'+(on?V("signal"):V("ink"))+'">'+esc(title)+'</div>'+svgWrap(k.w,k.h,k.svg)+'</div>';}
      var onA=act&&act.w==="a"&&act.i===1, onB=act&&act.w==="b"&&act.i===1;
      var ra=roman(c.a,"C"), rb=roman(c.b,"C");
      var fa=c.am.map(function(m,i){return ch.indexOf(i)>=0?V("blue"):V("ink");}), fb=c.bm.map(function(m,i){return ch.indexOf(i)>=0?V("signal"):V("ink");});
      var sv=staff({s:9,w:260,clef:"treble",items:[{x:90,notes:c.an,fills:fa,label:disp(c.a)+"（"+ra+"）",lcol:onA?V("signal"):V("ink")},
                                                    {x:200,notes:c.bn,fills:fb,label:disp(c.b)+"（"+rb+"）",lcol:onB?V("signal"):V("ink")}]});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:flex-end">'+
        board(c.am,c.an,false,"ハ長調の和音: "+disp(c.a)+"（"+ra+"）",onA)+board(c.bm,c.bn,true,"ハ短調から借りた和音: "+disp(c.b)+"（"+rb+"）",onB)+
        svgWrap(sv.w,sv.h,sv.svg)+'</div>';
      var hasAb=c.bm.some(function(m){return _w13_pc(m)===8;});
      ro.innerHTML='<b>'+disp(c.a)+'（'+ra+'）</b> '+an.join(" ")+' → <b style="color:var(--signal)">'+disp(c.b)+'（'+rb+'）</b> '+bn.join(" ")+'<br>'+
        '変わる音: '+ch.map(function(i){return an[i]+' → <b style="color:var(--signal)">'+bn[i]+'</b>';}).join("、")+'（どれも半音下がる。'+ch.map(function(i){return bn[i];}).join("・")+' はハ長調の外の音）<br>'+
        (hasAb?'<b style="color:var(--purple)">A♭ を含む</b>: I の 5 度の音であり V の根音でもある G の半音上にあり、I や V へ進むとき G へ半音で下がれる'
              :'A♭ は含まない');
    }
    [sd,sf].forEach(function(s){s.addEventListener("change",function(){stopAll();act=null;draw();});});
    draw();
  };

  /* ============ 13. w13_tritone — ドミナントと裏コード ============ */
  REG.w13_tritone=function(el){
    head(el,"Tritone","ドミナントと裏コードが共有する三全音と、ベースの動き");
    var T=[{x:"C",xd:"I",d:"G7",f:"V7",s:"Db7"},{x:"Dm",xd:"IIm",d:"A7",f:"V7/IIm",s:"Eb7"},{x:"Em",xd:"IIIm",d:"B7",f:"V7/IIIm",s:"F7"},
           {x:"F",xd:"IV",d:"C7",f:"V7/IV",s:"Gb7"},{x:"G",xd:"V",d:"D7",f:"V7/V",s:"Ab7"},{x:"Am",xd:"VIm",d:"E7",f:"V7/VIm",s:"Bb7"}];
    var row=ctrls(el), sel=select(row,"目標の和音（ハ長調）",T.map(function(t){return t.x+"（"+t.xd+"）";}));
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var view=mk("div","wscreen"); view.style.padding=".6rem";
    var ro=readout(el), act=null;
    function inOct(pc,lo){return lo+((pc-lo)%12+12)%12;}
    /* 三全音の 2 音は、ドミナントと裏コードで同じ鍵に置く */
    function cur(){
      var t=T[+sel.value], r=chordParse(t.x).rootPc, minor=chordParse(t.x).ivs.indexOf(3)>=0;
      var lt=inOct(r-1,60), sev=inOct(r+5,60);
      var dm=[lt,sev,inOct(r+2,60)].sort(function(a,b){return a-b;}), sm=[lt,sev,inOct(r+8,60)].sort(function(a,b){return a-b;});
      var x3=sev-(minor?2:1), xr=lt+1, x5=inOct(r+7,55);
      return {t:t,r:r,lt:lt,sev:sev,d:{b:inOct(r+7,48),m:dm},s:{b:inOct(r+1,48),m:sm},x:{b:inOct(r,48),m:[x5,x3,xr].sort(function(a,b){return a-b;})}};}
    function events(which){var c=cur();return _w13_seq([c[which],c.x],[1.6,2.4]);}
    function show(which){return function(i){act=i<0?null:{w:which,i:i};draw();};}
    _w13_btn(bar,"▶ ドミナント → 目標",function(){return events("d");},show("d"));
    _w13_btn(bar,"▶ 裏コード → 目標",function(){return events("s");},show("s"));
    el.appendChild(view); el.appendChild(ro);
    function draw(){
      var c=cur(), t=c.t;
      var dAll=[c.d.b].concat(c.d.m), sAll=[c.s.b].concat(c.s.m);
      var dn=chordSpell(t.d,dAll), sn=chordSpell(t.s,sAll);
      var dPcs=dAll.map(_w13_pc), sPcs=sAll.map(_w13_pc), tri=[_w13_pc(c.lt),_w13_pc(c.sev)];
      var lab={}; dAll.forEach(function(m,i){lab[_w13_pc(m)]=nname(dn[i],false);});
      sAll.forEach(function(m,i){var p=_w13_pc(m),nm=nname(sn[i],false);lab[p]=lab[p]&&lab[p]!==nm?lab[p]+"（"+nm+"）":nm;});
      /* 12 の音の円（半音ずつ、C が上） */
      var W=250,H=250,cx=125,cy=125,R=84,b=[];
      function P(k){var a=(-90+30*k)*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];}
      function poly(pcs,col,fill){var q=pcs.slice().sort(function(a,b){return a-b;});return '<polygon points="'+q.map(function(k){return P(k).join(",");}).join(" ")+'" fill="'+fill+'" stroke="'+col+'" stroke-width="1.8"/>';}
      b.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="'+V("line")+'" stroke-width="1.2"/>');
      b.push(poly(dPcs,V("blue"),V("blue-soft")));b.push(poly(sPcs,V("gold"),V("gold-soft")));
      var p1=P(tri[0]),p2=P(tri[1]);b.push(ln(p1[0],p1[1],p2[0],p2[1],V("signal"),3.4));
      var q1=P(dPcs[0]),q2=P(sPcs[0]);b.push(ln(q1[0],q1[1],q2[0],q2[1],V("muted"),1.2,"4,4"));
      for(var k=0;k<12;k++){var p=P(k),inD=dPcs.indexOf(k)>=0,inS=sPcs.indexOf(k)>=0,sh=tri.indexOf(k)>=0;
        var col=sh?V("signal"):inD?V("blue"):inS?V("gold"):V("muted"),on=inD||inS;
        b.push('<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(on?6.5:3)+'" fill="'+(on?col:V("panel"))+'" stroke="'+col+'" stroke-width="1.4"/>');
        var a=(-90+30*k)*Math.PI/180, txt=lab[k]||(BLACK[k]?NF[k]:NS[k]);
        b.push(tx(cx+(R+20)*Math.cos(a),cy+(R+20)*Math.sin(a)+4,txt,"middle",10.5,on?V("ink"):V("muted"),on));}
      var clk=svgWrap(W,H,b.join(""));
      function board(all,ns,own,title,on){var hl={};all.forEach(function(m,i){hl[m]={c:tri.indexOf(_w13_pc(m))>=0?"signal":own,label:nname(ns[i],false),strong:true};});
        var kk=kbd(48,71,{ww:14,wh:58,hl:hl,names:null});
        return '<div style="text-align:center"><div style="font-size:.8rem;font-weight:700;margin-bottom:.25rem;color:'+(on?V("signal"):V(own))+'">'+esc(title)+'</div>'+svgWrap(kk.w,kk.h,kk.svg)+'</div>';}
      var dd=t.d.replace("b","♭"), ss=t.s.replace("b","♭");
      var boards='<div style="display:flex;flex-direction:column;gap:.5rem">'+board(dAll,dn,"blue","ドミナント "+t.f+" = "+dd,act&&act.w==="d"&&act.i===0)+
        board(sAll,sn,"gold","裏コード "+roman(t.s,"C")+" = "+ss,act&&act.w==="s"&&act.i===0)+'</div>';
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+clk+boards+'</div>';
      var bx=c.x.b, sx=_w13_names(chordSpell(t.x,[bx]))[0];
      var dsteps=bx-c.d.b, ssteps=bx-c.s.b;
      ro.innerHTML='<b style="color:var(--blue)">'+dd+'</b>（'+_w13_names(dn).join(" ")+'） と <b style="color:var(--gold)">'+ss+'</b>（'+_w13_names(sn).join(" ")+'）<br>'+
        '共有する三全音: <b style="color:var(--signal)">'+lab[tri[0]]+' と '+lab[tri[1]]+'</b>（半音 6 つ） ／ 根音 '+_w13_names(dn)[0]+' と '+_w13_names(sn)[0]+' も半音 6 つ離れている<br>'+
        '目標 '+t.x+' への ベース: '+_w13_names(dn)[0]+' → '+sx+'（'+(dsteps>0?'+':'')+dsteps+'） ／ '+_w13_names(sn)[0]+' → '+sx+'（'+(ssteps>0?'+':'')+ssteps+'、半音下）';
    }
    sel.addEventListener("change",function(){stopAll();act=null;draw();});
    draw();
  };

  /* ============ 13. w13_reharm — ダイアトニックな進行を置き換える ============ */
  REG.w13_reharm=function(el){
    head(el,"Reharmonize","ダイアトニックコードだけの進行の一部を、この章の和音に置き換える");
    var row=ctrls(el);
    var sA=select(row,"I と IIm7 の間",["なし","V7/IIm（A7）をはさむ","経過的なディミニッシュ（C♯dim7）をはさむ"]),
        sB=select(row,"IIm7 の次のドミナント",["V7（G7）","裏コード ♭II7（D♭7）"]),
        sC=select(row,"IV と I の間",["なし","IVm（Fm）をはさむ"]);
    var band=mk("div",""); band.style.cssText="display:flex;flex-wrap:wrap;gap:4px;margin-top:.8rem"; el.appendChild(band);
    var card=mk("div","play"); el.appendChild(card);
    var ro=readout(el);
    var ROLE={"C":["I","T","blue"],"A7":["V7/IIm","D","signal"],"C#dim7":["経過的なディミニッシュ","","gold"],"Dm7":["IIm7","SD","green"],
              "G7":["V7","D","signal"],"Db7":["裏コード","D","signal"],"F":["IV","SD","green"],"Fm":["IVm","SDm","purple"]};
    function list(){var L=["C"];if(sA.value==="1")L.push("A7");if(sA.value==="2")L.push("C#dim7");L.push("Dm7");L.push(sB.value==="1"?"Db7":"G7");L.push("C","F");if(sC.value==="1")L.push("Fm");L.push("C");return L;}
    function disp(s){return s.replace("C#","C♯").replace("Db","D♭");}
    function draw(){
      stopAll();
      var L=list();
      band.innerHTML=L.map(function(s){var r=ROLE[s];
        var ms=chordMidis(s,60),sp=chordSpell(s,ms),outN=[];ms.forEach(function(m,i){if(_w13_out(m))outN.push(nname(sp[i],false));});
        return '<div style="flex:1 1 4.2rem;min-width:4.2rem;border:1px solid var(--line);border-radius:8px;padding:.3rem .25rem;text-align:center;background:var(--screen);font-size:.74rem;line-height:1.35">'+
          '<b style="font-size:.9rem">'+esc(disp(s))+'</b><br><span style="color:var(--'+r[2]+');font-weight:700">'+esc(r[0])+(r[1]?'（'+r[1]+'）':'')+'</span><br>'+
          '<span style="color:var(--signal)">'+(outN.length?esc(outN.join("・")):'&nbsp;')+'</span></div>';}).join("");
      card.innerHTML="";
      playMulti(card,{chords:L.join(" "),key:"C",show:"chords kbd staff",bass:"on",tempo:"120",label:"置き換えた進行（ハ長調）"});
      var bs=L.map(_w13_bass), steps=[];
      for(var i=1;i<bs.length;i++)steps.push(bs[i]-bs[i-1]);
      var bn=L.map(function(s){return nname(chordSpell(s,[_w13_bass(s)])[0],false);});
      var nOut=L.filter(function(s){var c=chordParse(s);return c.ivs.some(function(v){return _w13_CMAJ.indexOf((c.rootPc+v)%12)<0;});}).length;
      ro.innerHTML='ベースの動き（半音の数）: '+bn.map(function(n,i){return i?'<span style="color:var(--muted)">('+(steps[i-1]>0?'+':'')+steps[i-1]+')</span> '+n:n;}).join(" → ")+'<br>'+
        '調の外の音を含む和音: <b>'+nOut+'</b> 個（各和音の下の赤い音名が調の外の音）';
    }
    [sA,sB,sC].forEach(function(s){s.addEventListener("change",draw);});
    draw();
  };
