  /* ---------- 16: リズムと拍子（共通の小さな部品） ---------- */
  /* 繰り返し鳴らす: step(i, t) で i 番目を時刻 t に予約し、dur(i) 秒進める。見た目は onVis(i) で合わせる */
  function _w16_loop(o){
    var run=false, tid=null, raf=null, nextT=0, k=0, q=[], cur=-1;
    function sched(){
      if(!run)return; var ctx=ac();
      while(nextT<ctx.currentTime+0.12){o.step(k,nextT); q.push([nextT,k]); nextT+=o.dur(k); k++;}
      tid=setTimeout(sched,25);
    }
    function frame(){
      if(!run)return; var t=AC.currentTime;
      while(q.length>1&&q[1][0]<=t)q.shift();
      if(q.length&&q[0][0]<=t&&q[0][1]!==cur){cur=q[0][1]; o.onVis(cur);}
      raf=requestAnimationFrame(frame);
    }
    function stop(){if(!run)return; run=false; clearTimeout(tid); cancelAnimationFrame(raf); q=[]; cur=-1; o.onStop();}
    return {
      start:function(){stopAll(); run=true; k=0; q=[]; cur=-1; nextT=ac().currentTime+0.1; hold(stop); sched(); frame();},
      stop:function(){if(run)stopAll();},
      restart:function(){if(run){stopAll(); this.start();}},
      running:function(){return run;}
    };
  }
  function _w16_btn(b,on){b.textContent=on?"■ 止める":"▶ 鳴らす"; b.setAttribute("aria-pressed",on?"true":"false");}
  /* 図の幅: 部品の幅に合わせる（スマホでは狭く） */
  function _w16_W(el,mx){return Math.max(300,Math.min(mx||640,(el.clientWidth||640)-34));}
  /* 3 連符のかっこ */
  function _w16_tup(x1,x2,y,col){var xm=(x1+x2)/2;
    return ln(x1,y+5,x1,y,col,1.1)+ln(x1,y,xm-7,y,col,1.1)+ln(xm+7,y,x2,y,col,1.1)+ln(x2,y,x2,y+5,col,1.1)+tx(xm,y+4,"3","middle",10,col,true);}
  /* 再生カードと同じ区切り方: 小節線で分け、書ける音価（付点を含む）に分けてタイでつなぐ */
  var _w16_VALS=[4,3,2,1.5,1,0.75,0.5,0.375,0.25];
  function _w16_pieces(b0,beats,barB){var out=[],bq=b0,end=b0+beats;
    while(bq<end-1e-9){var be=(Math.floor(bq/barB+1e-9)+1)*barB,len=Math.min(end,be)-bq;
      while(len>1e-9){var v=null;for(var i=0;i<_w16_VALS.length;i++)if(_w16_VALS[i]<=len+1e-9){v=_w16_VALS[i];break;}if(v==null)v=len;out.push([bq,v]);bq+=v;len-=v;}}
    return out;}

  /* ============ 16. w16_metro — メトロノーム（拍子と強拍） ============ */
  REG.w16_metro=function(el){
    head(el,"Metronome","テンポと拍子を選ぶと、強拍を強めて拍を刻む");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var row=ctrls(el),sT=slider(row,"テンポ（1 分あたりの拍の数）",40,208,96,1),sM=select(row,"拍子",["2/4","3/4","4/4","6/8"]);sM.value="2";
    var row2=ctrls(el),sD=select(row2,"1 拍を分ける",["分けない"]);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el);
    var MET=[{n:2,str:["強","弱"],time:"2/4",comp:false},{n:3,str:["強","弱","弱"],time:"3/4",comp:false},
             {n:4,str:["強","弱","中強","弱"],time:"4/4",comp:false},{n:2,str:["強","中強"],time:"6/8",comp:true}];
    var SUBS={simple:[[1,"分けない"],[2,"2 つ（8 分音符）"],[3,"3 つ（3 連符）"],[4,"4 つ（16 分音符）"]],comp:[[1,"分けない"],[3,"3 つ（8 分音符）"]]};
    var SC={"強":"signal","中強":"blue","弱":"muted"}, cur=-1;
    function met(){return MET[+sM.value];}
    function subs(){return met().comp?SUBS.comp:SUBS.simple;}
    function sub(){var s=subs();return s[Math.min(+sD.value,s.length-1)][0];}
    function fillSubs(keep){var s=subs(),old=keep?sub():1;sD.innerHTML=s.map(function(x,i){return '<option value="'+i+'">'+x[1]+'</option>';}).join("");
      var idx=0;s.forEach(function(x,i){if(x[0]===old)idx=i;});sD.value=String(idx);}
    function spb(){return 60/(+sT.input.value);}
    var lp=_w16_loop({
      step:function(k,t){var m=met(),n=sub(),N=m.n*n,i=k%N,bi=Math.floor(i/n),kd=m.str[bi];
        if(i%n===0){if(kd==="強")note(-5,t,0.1,"piano",1);else note(-4,t,0.1,"piano",kd==="中強"?1:0.5);}
        else note(-3,t,0.05,"piano",0.32);},
      dur:function(){return spb()/sub();},
      onVis:function(k){var m=met(),n=sub();cur=k%(m.n*n);draw();},
      onStop:function(){cur=-1;_w16_btn(bp,false);draw();}
    });
    function draw(){
      var m=met(),n=sub(),N=m.n*n,W=_w16_W(el,640),s=8,x0=staffStart(s,0,m.time)+10,wb=(W-x0-26)/m.n,its=[],b=[];
      for(var i=0;i<N;i++){
        var on=i===cur,col=on?V("signal"):V("ink"),dur,dot=false;
        if(m.comp)dur=n===1?"quarter":"eighth",dot=n===1;
        else dur=n===1?"quarter":n===4?"16th":"eighth";
        var it={x:x0+i*wb/n,notes:["A4"],dur:dur,dot:dot,fill:col,stem:"up"};
        if(dur==="eighth"||dur==="16th")it.beam=Math.floor(i/n);
        its.push(it);
      }
      its.push({x:x0+m.n*wb-6,bar:"end"});
      var top=4.4*s,stf=staff({s:s,w:x0+m.n*wb-4,clef:"treble",time:m.time,items:its,top:top,bottom:1.5*s});
      b.push(stf.svg);
      if(n===3&&!m.comp)for(var bi=0;bi<m.n;bi++){var xa=2+x0+bi*wb+0.58*s,xb=2+x0+(bi+2/3)*wb+0.58*s;b.push(_w16_tup(xa,xb,top+2.5*s-3.4*s-16,V("ink")));}
      var y=stf.h+20;
      b.push(ln(2+x0-12,y,2+x0+m.n*wb-6,y,V("line"),1.2));
      for(i=0;i<N;i++){var x=2+x0+i*wb/n,bi2=Math.floor(i/n);
        if(i%n===0){var kd=m.str[bi2],R={"強":11,"中強":8.5,"弱":5.5}[kd],c=V(SC[kd]);
          if(i===cur)b.push('<circle cx="'+x+'" cy="'+y+'" r="'+(R+5)+'" fill="none" stroke="'+V("signal")+'" stroke-width="2.4"/>');
          b.push('<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+c+'"/>');
          b.push(tx(x,y+28,kd,"middle",10.5,c,true));b.push(tx(x,y-17,String(bi2+1),"middle",10.5,V("muted"),true));}
        else{b.push('<circle cx="'+x+'" cy="'+y+'" r="'+(i===cur?4.5:3)+'" fill="'+(i===cur?V("signal"):V("muted"))+'"/>');}}
      view.innerHTML=svgWrap(W,y+38,b.join(""));
      var T1=spb(),bn=m.comp?"1 拍（付点 4 分音符）":"1 拍（4 分音符）";
      ro.innerHTML=bn+' = 60 ÷ '+sT.input.value+' = <b>'+f(T1,3)+' 秒</b> ／ 1 小節 = '+m.n+' 拍 = <b>'+f(T1*m.n,2)+' 秒</b>'+
        (n>1?'<br>1 拍を '+n+' つに分けた 1 つ（'+(m.comp?'8 分音符':n===2?'8 分音符':n===3?'3 連符の 1 つ':'16 分音符')+'）= <b>'+f(T1/n,3)+' 秒</b>':'')+
        '<br>音: 強拍は高いクリック、中強拍と弱拍は低いクリック（中強拍のほうが大きい）'+(n>1?'。分けた音は短い「チッ」':'');
    }
    sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;draw();});
    sM.addEventListener("change",function(){fillSubs(true);cur=-1;draw();lp.restart();});
    sD.addEventListener("change",function(){cur=-1;draw();lp.restart();});
    bp.addEventListener("click",function(){if(lp.running()){lp.stop();return;}lp.start();_w16_btn(bp,true);});
    fillSubs(false);sT.val.textContent=sT.input.value;draw();reg(null,draw);
  };

  /* ============ 16. w16_sync — シンコペーション（強拍の音をずらす） ============ */
  REG.w16_sync=function(el){
    head(el,"Syncopation","強拍の音を半拍ずらすと、楽譜と聞こえ方がどう変わるか");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var BASE=[["C5",0,1],["E5",1,1],["G5",2,1],["E5",3,1],["F5",4,1],["D5",5,1],["C5",6,2]];
    var row=ctrls(el),c1=checkbox(row,"1 小節目 3 拍目の G5",true),c2=checkbox(row,"2 小節目 1 拍目の F5",false),c3=checkbox(row,"2 小節目 3 拍目の C5",false);
    var row2=ctrls(el),sm=select(row2,"ずらし方",["半拍早く鳴らし、強拍の上へ伸ばす","強拍を休み、半拍遅れて鳴らす"]),sT=slider(row2,"テンポ",60,150,96,1);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),onI=-1;
    function seq(){
      var a=BASE.map(function(x){return [x[0],x[1],x[2]];}),sel=[c1.checked?2:-1,c2.checked?4:-1,c3.checked?6:-1],late=sm.value==="1",out=[];
      sel.forEach(function(i){if(i<0)return;
        if(late){a[i][1]+=0.5;a[i][2]-=0.5;}
        else{a[i][1]-=0.5;a[i][2]+=0.5;a[i-1][2]-=0.5;}});
      var t=0;a.forEach(function(x){if(x[1]>t+1e-9)out.push(["r",t,x[1]-t]);out.push(x);t=x[1]+x[2];});
      return out;
    }
    function draw(){
      var sq=seq(),W=_w16_W(el,640),s=8,x0=staffStart(s,0,"4/4")+6,G=16,u=(W-x0-G-30)/8,its=[];
      var X=function(q){return x0+q*u+Math.floor(q/4+1e-9)*G;};
      sq.forEach(function(e,i){
        var ps=_w16_pieces(e[1],e[2],4),off=e[0]!=="r"&&Math.abs(e[1]*2-Math.round(e[1]*2))<1e-9&&Math.round(e[1]*2)%2===1;
        var col=i===onI?V("signal"):off?V("alias"):V("ink");
        ps.forEach(function(p,j){var dd=durDot(p[1]),it={x:X(p[0]),dur:dd.dur,dot:dd.dot,fill:col};
          if(e[0]==="r")it.rest=true;else{it.notes=[e[0]];if(dd.dur==="eighth"||dd.dur==="16th")it.beam="b"+Math.floor(p[0]+1e-9);if(j<ps.length-1)it.tie=true;}
          its.push(it);});
      });
      its.push({x:X(4)-G/2-4,bar:true});its.push({x:X(8)-G+4,bar:"end"});
      its.sort(function(p,q){return p.x-q.x;});
      var stf=staff({s:s,w:X(8)-G+6,clef:"treble",time:"4/4",items:its,top:3.6*s,bottom:2*s}),b=[stf.svg];
      /* 時間の格子 */
      var y=stf.h+16,ons={};sq.forEach(function(e){if(e[0]!=="r")ons[Math.round(e[1]*2)]=1;});
      b.push(ln(2+X(0)-8,y,2+X(7.5)+16,y,V("line"),1.2));b.push(tx(2+X(0)-14,y+4,"時間","end",10,V("muted")));
      var sOn=0,offOn=0;
      for(var k=0;k<16;k++){var x=2+X(k/2);
        if(k%2===0)b.push(ln(x,y-6,x,y+6,V("muted"),1));
        if(k%4===0){b.push('<circle cx="'+x+'" cy="'+y+'" r="9" fill="none" stroke="'+V("ink")+'" stroke-width="1.6"/>');if(ons[k])sOn++;}
        if(ons[k]){var off2=k%2===1;if(off2)offOn++;b.push('<circle cx="'+x+'" cy="'+y+'" r="4.5" fill="'+(off2?V("alias"):V("ink"))+'"/>');}}
      view.innerHTML=svgWrap(W,y+16,b.join(""));
      ro.innerHTML='強拍・中強拍（1・3 拍目、全部で 4 つ）のうち、新しい音が鳴り始めるのは <b>'+sOn+'</b> つ ／ 裏拍で鳴り始める音（赤）は <b>'+offOn+'</b> つ'+
        '<br>再生では、最初の 1 小節はクリックだけ鳴る（拍を数え始めるため）';
    }
    function play(){
      var sq=seq(),spb=60/(+sT.input.value),evs=[],idx=[];
      for(var b=0;b<12;b++){var inb=b%4;evs.push({t:b*spb,d:0.1,m:[inb===0?-5:-4],v:inb===0?1:inb===2?0.8:0.5});idx.push(-1);}
      sq.forEach(function(e,i){if(e[0]==="r")return;evs.push({t:(4+e[1])*spb,d:e[2]*spb*0.95,m:[parse(e[0]).midi],v:1});idx.push(i);});
      var ord=evs.map(function(e,i){return i;}).sort(function(a,c){return evs[a].t-evs[c].t;});
      var E=ord.map(function(i){return evs[i];}),I=ord.map(function(i){return idx[i];});
      playEvents(E,{timbre:"piano",onStep:function(i){if(I[i]>=0){onI=I[i];draw();}},onEnd:function(){onI=-1;draw();_w16_btn(bp,false);}});
      _w16_btn(bp,true);
    }
    [c1,c2,c3].forEach(function(c){c.addEventListener("change",draw);});sm.addEventListener("change",draw);
    sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;});
    bp.addEventListener("click",function(){if(bp.getAttribute("aria-pressed")==="true"){stopAll();onI=-1;draw();_w16_btn(bp,false);return;}play();});
    sT.val.textContent=sT.input.value;draw();reg(null,draw);
  };

  /* ---------- 16: ドラムの 16 ステップ ---------- */
  var _w16_KIT=[["%hat","ハイハット","gold",-3],["%snare","スネア","signal",-2],["%kick","バスドラム","blue",-1]];
  /* 16 ステップのパターン（楽器ごとの真偽の配列）を、1 声部（符幹は上向き）の五線の要素にする */
  function _w16_drumItems(P,X,hi){
    var its=[];
    for(var k=0;k<4;k++){
      var on=[];for(var j=0;j<4;j++)if(P.some(function(r){return r[4*k+j];}))on.push(j);
      if(!on.length){its.push({x:X(4*k),rest:true,dur:"quarter"});continue;}
      if(on[0]>0){var dr=durDot(on[0]/4);its.push({x:X(4*k),rest:true,dur:dr.dur,dot:dr.dot});}
      on.forEach(function(j,i){var nx=i+1<on.length?on[i+1]:4,dd=durDot((nx-j)/4),ns=[];
        _w16_KIT.forEach(function(q,r){if(P[r][4*k+j])ns.push(q[0]);});
        var it={x:X(4*k+j),notes:ns,dur:dd.dur,dot:dd.dot,stem:"up",fill:(4*k+j)===hi?V("signal"):V("ink")};
        if(dd.dur==="eighth"||dd.dur==="16th")it.beam=k;
        its.push(it);});
    }
    return its;
  }

  /* ============ 16. w16_grid — 16 ステップのリズム格子 ============ */
  REG.w16_grid=function(el){
    head(el,"Drum grid","格子のます目を押して、ドラムのリズムを組み立てる");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす");
    var row=ctrls(el),sp=select(row,"例",["8 ビート","8 ビート（スネアを 1・3 拍目に）","16 ビート","16 ビート（バスドラムに 16 分音符を足す）","空（自分で作る）"]),sT=slider(row,"テンポ",60,160,100,1);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),cur=-1;
    function st(a){var r=[];for(var i=0;i<16;i++)r.push(a.indexOf(i)>=0);return r;}
    var EV=[0,2,4,6,8,10,12,14],ALL=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    var PRE=[[EV,[4,12],[0,8,10]],[EV,[0,8],[0,8,10]],[ALL,[4,12],[0,8,10]],[ALL,[4,12],[0,7,8]],[[],[],[]]];
    var P=PRE[0].map(st);
    var lp=_w16_loop({
      step:function(k,t){var i=k%16;_w16_KIT.forEach(function(q,r){if(P[r][i])note(q[3],t,0.1,"piano",r===0?(i%2===0?0.6:0.42):r===1?0.95:1);});},
      dur:function(){return 60/(+sT.input.value)/4;},
      onVis:function(k){cur=k%16;draw();},
      onStop:function(){cur=-1;_w16_btn(bp,false);draw();}
    });
    function draw(){
      var W=_w16_W(el,640),lw=W<420?62:84,cw=Math.min(30,(W-lw-12)/16),ch=Math.max(18,Math.min(24,cw)),gx=lw,gy=22,b=[];
      if(cur>=0)b.push('<rect x="'+(gx+cur*cw)+'" y="'+(gy-2)+'" width="'+cw+'" height="'+(3*ch+4)+'" rx="4" fill="'+V("signal-soft")+'"/>');
      for(var j=0;j<16;j++){var lab=j%4===0?String(j/4+1):j%4===2?"と":"";if(lab)b.push(tx(gx+j*cw+cw/2,gy-7,lab,"middle",10.5,j%4===0?V("ink"):V("muted"),j%4===0));}
      _w16_KIT.forEach(function(q,r){
        b.push(tx(gx-6,gy+r*ch+ch/2+4,q[1],"end",W<420?10:11,V(q[2]),true));
        for(var j2=0;j2<16;j2++){var on=P[r][j2];
          b.push('<rect class="w16c" data-r="'+r+'" data-j="'+j2+'" x="'+(gx+j2*cw+1.5)+'" y="'+(gy+r*ch+1.5)+'" width="'+(cw-3)+'" height="'+(ch-3)+'" rx="3" fill="'+(on?V(q[2]):V("panel"))+'" stroke="'+(on?V(q[2]):V("line"))+'" stroke-width="1.2" style="cursor:pointer"/>');}
      });
      for(var k=0;k<5;k++)b.push(ln(gx+4*k*cw,gy-2,gx+4*k*cw,gy+3*ch+2,V("muted"),1.2));
      var s=7,top=gy+3*ch+30,st0=staffStart(s,0,"4/4"),xL=gx+cw/2-st0-2;
      var its=_w16_drumItems(P,function(j){return st0+2+j*cw;},cur);its.push({x:st0+2+16*cw-cw/2+2,bar:"end"});
      var stf=staff({s:s,x:xL,w:st0+16*cw-cw/2+6,clef:"perc",time:"4/4",items:its,top:top,bottom:1.5*s});
      b.push(stf.svg);
      view.innerHTML=svgWrap(W,stf.h,b.join(""));
      var cnt=function(r){return P[r].filter(Boolean).length;},hat=P[0],sn=P[1];
      var h8=hat.every(function(v,i){return v===(i%2===0);}),h16=hat.every(Boolean);
      var back=sn[4]&&sn[12]&&!sn[0]&&!sn[8];
      ro.innerHTML='ハイハット <b>'+cnt(0)+'</b> 回'+(h16?'（16 分音符で刻む → 16 ビート）':h8?'（8 分音符で刻む → 8 ビート）':'')+
        ' ／ スネア <b>'+cnt(1)+'</b> 回'+(back?'（2・4 拍目 = バックビート）':'')+' ／ バスドラム <b>'+cnt(2)+'</b> 回'+
        '<br>1 ます = 16 分音符 = 60 ÷ '+sT.input.value+' ÷ 4 = <b>'+f(60/(+sT.input.value)/4,3)+' 秒</b>';
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".w16c");if(!t)return;var r=+t.getAttribute("data-r"),j=+t.getAttribute("data-j");
      P[r][j]=!P[r][j];draw();if(!lp.running()&&P[r][j])note(_w16_KIT[r][3],ac().currentTime+0.01,0.1,"piano",0.9);});
    sp.addEventListener("change",function(){P=PRE[+sp.value].map(st);draw();});
    sT.input.addEventListener("input",function(){sT.val.textContent=sT.input.value;draw();});
    bp.addEventListener("click",function(){if(lp.running()){lp.stop();return;}lp.start();_w16_btn(bp,true);});
    sT.val.textContent=sT.input.value;draw();reg(null,draw);
  };

  /* ============ 16. w16_swing — スウィングの比率 ============ */
  REG.w16_swing=function(el){
    head(el,"Swing","1 拍の中の 2 つの 8 分音符の長さの比を変える");
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 鳴らす"),b1=button(bar,"1:1"),b2=button(bar,"2:1"),b3=button(bar,"3:1");
    var row=ctrls(el),sR=slider(row,"前の音 : 後ろの音",100,300,200,5),sT=slider(row,"テンポ",60,200,120,1);
    var view=mk("div","wscreen");view.style.padding=".4rem";el.appendChild(view);
    var ro=readout(el),cur=-1;
    function r(){return (+sR.input.value)/100;}
    function pos(){return r()/(r()+1);}
    function spb(){return 60/(+sT.input.value);}
    var lp=_w16_loop({
      step:function(k,t){var i=k%8,bt=Math.floor(i/2);
        if(i%2===0){note(-3,t,0.05,"piano",0.6);if(bt===0||bt===2)note(-1,t,0.1,"piano",1);else note(-2,t,0.1,"piano",0.9);}
        else note(-3,t,0.05,"piano",0.5);},
      dur:function(k){return spb()*(k%2===0?pos():1-pos());},
      onVis:function(k){cur=k%8;draw();},
      onStop:function(){cur=-1;_w16_btn(bp,false);draw();}
    });
    function draw(){
      var W=_w16_W(el,640),x0=W<420?20:36,u=(W-x0-20)/2,y=56,b=[],p=pos(),R=r();
      for(var k=0;k<=2;k++)b.push(ln(x0+k*u,20,x0+k*u,y+46,V("muted"),1.2));
      for(k=0;k<2;k++){b.push(tx(x0+k*u+u/2,14,"拍 "+(k+1),"middle",10.5,V("muted"),true));
        [1/3,2/3].forEach(function(q){b.push(ln(x0+(k+q)*u,26,x0+(k+q)*u,y+46,V("signal"),0.9,"2,3"));});
        b.push(ln(x0+(k+0.5)*u,26,x0+(k+0.5)*u,y+46,V("muted"),1,"1,3"));
        var a=x0+k*u,L1=p*u,on0=cur>=0&&cur%2===0&&Math.floor(cur/2)%2===k,on1=cur>=0&&cur%2===1&&Math.floor(cur/2)%2===k;
        b.push('<rect x="'+(a+2)+'" y="'+y+'" width="'+(L1-4)+'" height="18" rx="3" fill="'+(on0?V("signal"):V("signal-soft"))+'" stroke="'+V("signal")+'" stroke-width="1.3"/>');
        b.push('<rect x="'+(a+L1+2)+'" y="'+y+'" width="'+Math.max(2,u-L1-4)+'" height="18" rx="3" fill="'+(on1?V("signal"):V("signal-soft"))+'" stroke="'+V("signal")+'" stroke-width="1.3"/>');
        [0,p].forEach(function(q){b.push('<path d="M'+(a+q*u)+','+(y-3)+' l-5,-8 l10,0Z" fill="'+V("signal")+'"/>');});}
      b.push(tx(x0+u/3,34,"1/3","middle",9.5,V("signal")));b.push(tx(x0+2*u/3,34,"2/3","middle",9.5,V("signal")));b.push(tx(x0+u/2,y+60,"1/2","middle",9.5,V("muted")));
      /* いちばん近い書き方 */
      var near=Math.abs(R-1)<0.03?1:Math.abs(R-2)<0.03?2:Math.abs(R-3)<0.03?3:0,s=8,stf="",txt="";
      if(near){var its=near===1?[{x:58,notes:["A4"],dur:"eighth",beam:0,stem:"up"},{x:88,notes:["A4"],dur:"eighth",beam:0,stem:"up"}]:
                near===2?[{x:58,notes:["A4"],dur:"quarter",stem:"up"},{x:94,notes:["A4"],dur:"eighth",stem:"up"}]:
                [{x:58,notes:["A4"],dur:"eighth",dot:true,beam:0,stem:"up"},{x:98,notes:["A4"],dur:"16th",beam:0,stem:"up"}];
        var st=staff({s:s,w:120,clef:"treble",items:its,top:4.2*s,bottom:s});stf=st.svg;
        if(near===2)stf+=_w16_tup(2+58+0.58*s,2+94+0.58*s,4.2*s+2.5*s-3.4*s-16,V("ink"));
        txt=near===1?"8 分音符 2 つ（ストレート）":near===2?"3 連符の 4 分音符 + 8 分音符（シャッフル）":"付点 8 分音符 + 16 分音符";}
      view.innerHTML=svgWrap(W,y+70,b.join(""))+(near?'<div style="display:flex;align-items:center;justify-content:center;gap:.6rem;flex-wrap:wrap;padding:.2rem 0 .3rem">'+svgWrap(124,8*s,stf)+'<span style="font-size:.8rem;color:var(--muted)">楽譜では: '+txt+'</span></div>':
        '<div style="text-align:center;font-size:.8rem;color:var(--muted);padding:.3rem 0">この比には、ちょうど当てはまる音符の書き方が無い（1:1・2:1・3:1 のときに表示）</div>');
      var d=(p-0.5)*spb();
      sR.val.textContent=f(R,2)+" : 1";sT.val.textContent=sT.input.value;
      ro.innerHTML='後ろの 8 分音符の位置: 拍の頭から <b>'+f(R,2)+' / ('+f(R,2)+' + 1) = '+f(p,3)+' 拍</b>'+
        '<br>ストレート（0.5 拍）より <b>'+f(p-0.5,3)+' 拍</b> 遅い = テンポ '+sT.input.value+' では <b>'+Math.round(d*1000)+' ミリ秒</b>（1 拍 = '+f(spb(),3)+' 秒）';
    }
    function setR(v){sR.input.value=v;draw();}
    b1.addEventListener("click",function(){setR(100);});b2.addEventListener("click",function(){setR(200);});b3.addEventListener("click",function(){setR(300);});
    sR.input.addEventListener("input",draw);sT.input.addEventListener("input",draw);
    bp.addEventListener("click",function(){if(lp.running()){lp.stop();return;}lp.start();_w16_btn(bp,true);});
    draw();reg(null,draw);
  };
