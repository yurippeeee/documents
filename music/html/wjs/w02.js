  /* ============ 02. keyinfo — 鍵を押して、名前・番号・周波数を見る ============ */
  REG.keyinfo=function(el){
    head(el,"Keys","鍵を押すと、音名・オクターブ番号・MIDI 番号・周波数が表示される");
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), cur=69;
    function names(m){var pc=m%12,o=Math.floor(m/12)-1;return BLACK[pc]?[NS[pc]+o,NF[pc]+o]:[NS[pc]+o];}
    function draw(){
      var hl={}; hl[cur]={c:"signal",label:BLACK[cur%12]?"":NS[cur%12],strong:true};
      var k=kbd(48,72,{ww:26,wh:104,hl:hl,names:"c"});
      var nm=names(cur), items=[{x:64,notes:[nm[0].replace("♯","#")],fill:V("signal")}];
      if(nm[1])items.push({x:128,notes:[nm[1].replace("♭","b")],fill:V("purple")});
      var st=staff({s:10,w:nm[1]?170:110,clef:cur>=60?"treble":"bass",items:items});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(k.w,k.h,k.svg)+svgWrap(st.w,st.h,st.svg)+'</div>';
      var n=cur-69, fq=mfreq(cur);
      ro.innerHTML='音名 <b>'+nm.join(' ／ ')+'</b>'+(BLACK[cur%12]?'（同じ鍵の 2 つの名前）':'（'+DOREMI[NS[cur%12]]+'）')+
        ' ／ MIDI 番号 <b>'+cur+'</b><br>A4（69）から <b>'+(n>=0?'+':'')+n+'</b> 半音 ／ 周波数 = 440 × 2<sup>('+cur+' − 69)/12</sup> = <b>'+f(fq,2)+' Hz</b>';
    }
    view.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".kbd-key");if(!t)return;cur=+t.getAttribute("data-m");
      stopAll();note(cur,ac().currentTime+0.01,1.4,"piano",0.9);draw();});
    draw();
  };

  /* ============ 02. staffkbd — 五線の位置と鍵盤の対応 ============ */
  REG.staffkbd=function(el){
    head(el,"Staff","五線の上で音を動かすと、鍵盤のどこに当たるかが分かる");
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bUp=button(bar,"▲ 1 段上へ"), bDn=button(bar,"▼ 1 段下へ"), bPlay=button(bar,"▶ 鳴らす");
    var row=ctrls(el), sc=select(row,"音部記号",["ト音記号","ヘ音記号"]), sa=select(row,"臨時記号",["なし","♯（半音上げる）","♭（半音下げる）"]);
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var ro=readout(el), pos=2;   // 第 1 線からの位置（線・間を 1 つずつ数える）
    function cur(){var tr=sc.value==="0",dia=pos+(tr?30:18),li=((dia%7)+7)%7,oc=Math.floor(dia/7),a=[0,1,-1][+sa.value];
      return {name:LETTERS[li]+(a===1?"#":a===-1?"b":"")+oc,disp:LETTERS[li]+accs(a)+oc,midi:12*(oc+1)+PCL[li]+a,tr:tr};}
    function draw(){
      var c=cur(),hl={};hl[c.midi]={c:"signal",label:BLACK[c.midi%12]?"":NS[c.midi%12],strong:true};
      var st=staff({s:11,w:140,clef:c.tr?"treble":"bass",items:[{x:84,notes:[c.name],fill:V("signal")}]});
      var lo=c.tr?55:36,hi=c.tr?88:69,k=kbd(lo,hi,{ww:19,wh:80,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
      var where=pos<0||pos>8?'加線の'+(pos%2===0?'上':'間')+'（五線の'+(pos<0?'下':'上')+'）':(pos%2===0?'第 '+(pos/2+1)+' 線':'第 '+((pos+1)/2)+' 間');
      ro.innerHTML='位置: <b>'+where+'</b> ／ 音名 <b>'+c.disp+'</b> ／ MIDI '+c.midi+' ／ '+f(mfreq(c.midi),2)+' Hz';
      bUp.disabled=pos>=12;bDn.disabled=pos<=-4;
    }
    function play(){stopAll();note(cur().midi,ac().currentTime+0.01,1.2,"piano",0.9);}
    bUp.addEventListener("click",function(){if(pos<12){pos++;draw();play();}});
    bDn.addEventListener("click",function(){if(pos>-4){pos--;draw();play();}});
    bPlay.addEventListener("click",play);
    sc.addEventListener("change",function(){draw();play();});sa.addEventListener("change",function(){draw();play();});
    draw();
  };

  /* ============ 02. readquiz — 五線の音を読む練習 ============ */
  REG.readquiz=function(el){
    head(el,"Quiz","五線の音符を読んで、音名を選ぶ");
    var row=ctrls(el), sc=select(row,"音部記号",["ト音記号","ヘ音記号","両方"]);
    var view=mk("div","wscreen"); view.style.padding=".6rem"; el.appendChild(view);
    var bar=mk("div","pbtns"); el.appendChild(bar);
    var bs=LETTERS.split("").map(function(L){var b=button(bar,L+"（"+DOREMI[L]+"）");b.addEventListener("click",function(){answer(L);});return b;});
    var bNext=button(bar,"次の問題 →");
    var ro=readout(el), q=null, done=false, ok=0, total=0;
    function newQ(){
      var mode=+sc.value, tr=mode===0?true:mode===1?false:Math.random()<0.5, prev=q;
      do{var pos=Math.floor(Math.random()*15)-3, dia=pos+(tr?30:18);q={tr:tr,dia:dia,L:LETTERS[((dia%7)+7)%7],oc:Math.floor(dia/7)};}
      while(prev&&prev.dia===q.dia&&prev.tr===q.tr);
      done=false;draw(null);ro.innerHTML='正解 '+ok+' / '+total+'　音符の音名を、下のボタンから選ぶ';
    }
    function draw(res){
      var name=q.L+q.oc, col=res==null?V("ink"):res?V("green"):V("alias");
      var st=staff({s:12,w:150,clef:q.tr?"treble":"bass",items:[{x:96,notes:[name],fill:col,label:res==null?"":q.L+q.oc+"（"+DOREMI[q.L]+"）",lcol:col}],bottom:5.2*12});
      var mid=12*(q.oc+1)+PCL[LETTERS.indexOf(q.L)], hl={}; if(res!=null)hl[mid]={c:res?"green":"alias",label:q.L,strong:true};
      var k=kbd(q.tr?57:36,q.tr?84:64,{ww:16,wh:66,hl:hl,names:"c"});
      view.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;align-items:center">'+svgWrap(st.w,st.h,st.svg)+svgWrap(k.w,k.h,k.svg)+'</div>';
    }
    function answer(L){
      if(done)return; done=true; total++; var good=L===q.L; if(good)ok++;
      stopAll(); note(12*(q.oc+1)+PCL[LETTERS.indexOf(q.L)],ac().currentTime+0.01,1.2,"piano",0.9);
      draw(good);
      ro.innerHTML=(good?'<span class="ok">正解</span>':'<span class="warn">ちがう</span>（選んだのは '+L+'）')+' — この音符は <b>'+q.L+q.oc+'</b>（'+DOREMI[q.L]+'） ／ 正解 '+ok+' / '+total;
    }
    bNext.addEventListener("click",newQ); sc.addEventListener("change",newQ);
    newQ();
  };
