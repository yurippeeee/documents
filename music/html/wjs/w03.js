  /* ---------- 03: 音程の名前（共通） ---------- */
  var QREF_P={1:0,4:5,5:7}, QREF_M={2:2,3:4,6:9,7:11};
  function ivName(lo,hi){
    var a=parse(lo),b=parse(hi),d=b.dia-a.dia+1,s=b.midi-a.midi;
    if(d<1)return null;
    var d0=(d-1)%7+1,k=Math.floor((d-1)/7),s0=s-12*k,q=null,df;
    if(QREF_P[d0]!=null){df=s0-QREF_P[d0];q={0:"完全",1:"増","-1":"減",2:"重増","-2":"重減"}[df];}
    else{df=s0-QREF_M[d0];q={0:"長","-1":"短",1:"増","-2":"減",2:"重増","-3":"重減"}[df];}
    return {d:d,s:s,q:q||"?",d0:d0,k:k,s0:s0};
  }
  var QC={"完全":"green","長":"blue","短":"purple","増":"alias","減":"gold","重増":"alias","重減":"gold"};
  function noteSel(row,label,L,a,o){
    var c=mk("div","ctrl");c.innerHTML='<label>'+label+'</label><div style="display:flex;gap:.35rem"></div>';row.appendChild(c);var box=c.querySelector("div");
    function sel(opts,v){var s=mk("select");s.style.cssText="font-family:var(--mono);font-size:.82rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);flex:1";
      opts.forEach(function(x){var op=mk("option");op.value=x[0];op.textContent=x[1];s.appendChild(op);});s.value=v;box.appendChild(s);return s;}
    var sL=sel(LETTERS.split("").map(function(x){return [x,x+"（"+DOREMI[x]+"）"];}),L),
        sA=sel([["","♮"],["#","♯"],["b","♭"]],a),
        sO=sel([["3","3"],["4","4"],["5","5"]],o);
    return {get:function(){return sL.value+sA.value+sO.value;},els:[sL,sA,sO]};
  }

  /* ============ 03. intname — 2 つの音から音程の名前を求める ============ */
  REG.intname=function(el){
    head(el,"Interval","2 つの音を選ぶと、手順どおりに音程の名前が求まる");
    var row=ctrls(el), lo=noteSel(row,"下の音","C","","4"), hi=noteSel(row,"上の音","E","","4");
    var bar=mk("div","pbtns");el.appendChild(bar);
    var b1=button(bar,"▶ 順に"),b2=button(bar,"▶ 同時に");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function draw(){
      var A=lo.get(),B=hi.get(),pa=parse(A),pb=parse(B),r=ivName(A,B);
      if(!r||pb.midi<pa.midi){view.innerHTML='<div style="padding:1rem;color:var(--alias)">上の音を、下の音以上の高さにしてください</div>';ro.innerHTML="";return null;}
      var col=V(QC[r.q]||"signal"),hl={};hl[pa.midi]={c:"signal",label:nname(A,false),strong:true};hl[pb.midi]={c:QC[r.q]||"signal",label:nname(B,false),strong:true};
      var clf=pa.midi>=55?"treble":pb.midi<=64?"bass":"grand";
      var st=staff({s:10,w:250,clef:clf,items:[{x:62,notes:[A],fill:V("signal")},{x:112,notes:[B],fill:col},{x:190,notes:[A,B],fills:[V("signal"),col],label:"同時に",lcol:V("muted"),lbold:false}]});
      var klo=Math.floor(pa.midi/12)*12,khi=Math.max(klo+11,Math.floor(pb.midi/12)*12+11),k=kbd(klo,khi,{ww:khi-klo>23?13:19,wh:72,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
      var letters=[];for(var i=0;i<r.d;i++)letters.push(LETTERS[(pa.li+i)%7]);
      var nm=r.q+" "+r.d+" 度",extra=r.k>0&&r.d!==8?'（= '+r.q+' '+r.d0+' 度 + '+r.k+' オクターブ）':'';
      ro.innerHTML='① 文字を数える: '+letters.join(" ")+' → <b>'+r.d+' 度</b><br>② 半音を数える: '+nname(A)+' から '+nname(B)+' まで <b>'+r.s+'</b> 個'+
        '<br>③ '+r.d0+' 度で半音 '+r.s0+' 個 → <b style="color:'+col+'">'+nm+'</b>'+extra;
      return {a:pa.midi,b:pb.midi};
    }
    function go(sim){var r=draw();if(!r)return;playEvents(sim?[{t:0,d:1.8,m:[r.a,r.b]}]:[{t:0,d:0.6,m:[r.a]},{t:0.62,d:1.1,m:[r.b]}],{timbre:"piano"});}
    lo.els.concat(hi.els).forEach(function(s){s.addEventListener("change",draw);});
    b1.addEventListener("click",function(){go(false);});b2.addEventListener("click",function(){go(true);});
    draw();
  };

  /* ============ 03. invert — 音程の転回 ============ */
  REG.invert=function(el){
    head(el,"Inversion","下の音を 1 オクターブ上げて、上下を入れ替える");
    var LIST=[["D4","長 2 度"],["Eb4","短 3 度"],["E4","長 3 度"],["F4","完全 4 度"],["F#4","増 4 度"],["G4","完全 5 度"],["A4","長 6 度"],["Bb4","短 7 度"],["B4","長 7 度"]];
    var row=ctrls(el),sel=select(row,"元の音程（下の音は C4）",LIST.map(function(x){return x[1]+"（C–"+nname(x[0],false)+"）";}));sel.value="2";
    var bar=mk("div","pbtns");el.appendChild(bar);
    var b1=button(bar,"▶ 元の音程"),b2=button(bar,"▶ 転回した音程");
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    function cur(){var u=LIST[+sel.value][0];return {u:u,a:ivName("C4",u),b:ivName(u,"C5")};}
    function draw(){
      var c=cur(),ca=V(QC[c.a.q]),cb=V(QC[c.b.q]);
      var st=staff({s:10,w:280,clef:"treble",items:[{x:70,notes:["C4",c.u],fill:ca,label:c.a.q+" "+c.a.d+" 度",lcol:ca},{x:200,notes:[c.u,"C5"],fill:cb,label:c.b.q+" "+c.b.d+" 度",lcol:cb}]});
      var hl={};hl[60]={c:QC[c.a.q],label:"C"};hl[parse(c.u).midi]={c:"signal",label:nname(c.u,false),strong:true};hl[72]={c:QC[c.b.q],label:"C"};
      var k=kbd(60,72,{ww:22,wh:76,hl:hl,names:null});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
      ro.innerHTML='元: <b style="color:'+ca+'">'+c.a.q+' '+c.a.d+' 度</b>（半音 '+c.a.s+'） → 転回: <b style="color:'+cb+'">'+c.b.q+' '+c.b.d+' 度</b>（半音 '+c.b.s+'）'+
        '<br>度数の和 '+c.a.d+' + '+c.b.d+' = <b>'+(c.a.d+c.b.d)+'</b> ／ 半音の和 '+c.a.s+' + '+c.b.s+' = <b>'+(c.a.s+c.b.s)+'</b>';
    }
    sel.addEventListener("change",draw);
    b1.addEventListener("click",function(){var c=cur();playEvents([{t:0,d:1.8,m:[60,parse(c.u).midi]}],{timbre:"piano"});});
    b2.addEventListener("click",function(){var c=cur();playEvents([{t:0,d:1.8,m:[parse(c.u).midi,72]}],{timbre:"piano"});});
    draw();
  };

  /* ============ 03. intquiz — 音程の聞き分け ============ */
  REG.intquiz=function(el){
    head(el,"Ear","鳴った 2 つの音の音程を聞き分ける");
    var row=ctrls(el),sm=select(row,"聞き方",["順に（旋律的）","同時に（和声的）"]),sr=select(row,"出題の範囲",["短 3 度・長 3 度・完全 5 度・完全 8 度","1 オクターブ内のすべて"]);
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bQ=button(bar,"▶ 出題"),bR=button(bar,"もう一度");
    var abar=mk("div","pbtns");el.appendChild(abar);
    var view=mk("div","wscreen");view.style.padding=".6rem";el.appendChild(view);
    var ro=readout(el);
    var ALL=[[1,"短 2 度"],[2,"長 2 度"],[3,"短 3 度"],[4,"長 3 度"],[5,"完全 4 度"],[6,"増 4 度"],[7,"完全 5 度"],[8,"短 6 度"],[9,"長 6 度"],[10,"短 7 度"],[11,"長 7 度"],[12,"完全 8 度"]];
    var q=null,done=false,ok=0,total=0;
    function pool(){return sr.value==="0"?ALL.filter(function(x){return [3,4,7,12].indexOf(x[0])>=0;}):ALL;}
    function buttons(){abar.innerHTML="";pool().forEach(function(x){var b=button(abar,x[1]);b.addEventListener("click",function(){answer(x);});});}
    function play(){if(!q)return;var sim=sm.value==="1";playEvents(sim?[{t:0,d:1.8,m:[q.r,q.r+q.iv[0]]}]:[{t:0,d:0.6,m:[q.r]},{t:0.65,d:1.1,m:[q.r+q.iv[0]]}],{timbre:"piano"});}
    function newQ(){var p=pool(),iv=p[Math.floor(Math.random()*p.length)],r=48+Math.floor(Math.random()*20);q={r:r,iv:iv};done=false;view.innerHTML='<div style="padding:.8rem;color:var(--muted);text-align:center">聞いて、下のボタンから音程を選ぶ</div>';
      ro.innerHTML='正解 '+ok+' / '+total;play();}
    function answer(x){
      if(!q||done)return;done=true;total++;var good=x[0]===q.iv[0];if(good)ok++;
      var hl={};hl[q.r]={c:"signal",label:NS[q.r%12],strong:true};hl[q.r+q.iv[0]]={c:good?"green":"alias",label:NS[(q.r+q.iv[0])%12],strong:true};
      var lo=Math.floor(q.r/12)*12,k=kbd(lo,lo+23,{ww:15,wh:62,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;justify-content:center">'+svgWrap(k.w,k.h,k.svg)+'</div>';
      ro.innerHTML=(good?'<span class="ok">正解</span>':'<span class="warn">ちがう</span>（選んだのは '+x[1]+'）')+' — 答えは <b>'+q.iv[1]+'</b>（半音 '+q.iv[0]+'） ／ 正解 '+ok+' / '+total;
    }
    bQ.addEventListener("click",newQ);bR.addEventListener("click",play);sr.addEventListener("change",function(){buttons();q=null;view.innerHTML="";ro.innerHTML='正解 '+ok+' / '+total;});
    buttons();view.innerHTML='<div style="padding:.8rem;color:var(--muted);text-align:center">「▶ 出題」を押すと 2 つの音が鳴る</div>';ro.innerHTML='正解 0 / 0';
  };
