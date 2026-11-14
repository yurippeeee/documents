  /* ============ 12. 共通の部品 ============ */
  var _w12_FN={I:"T",II:"SD",III:"T",IV:"SD",V:"D",VI:"T",VII:"D"};
  var _w12_FC={T:"blue",SD:"green",D:"signal"};
  var _w12_VC={S:"ink",A:"blue",T:"green",B:"gold"};
  var _w12_VJ={S:"ソプラノ",A:"アルト",T:"テノール",B:"バス"};
  var _w12_MOVE={0:"同じ根音",1:"2 度上",2:"3 度上",3:"4 度上",4:"4 度下",5:"3 度下",6:"2 度下"};
  var _w12_RANGE={S:[60,79],A:[55,72],T:[48,67],B:[40,60]};
  function _w12_deg(d){return /^(VII|VI|V|IV|III|II|I)/.exec(d)[1];}
  function _w12_fn(d){return _w12_FN[_w12_deg(d)];}
  function _w12_selStyle(s){s.style.cssText="font-family:var(--mono);font-size:.76rem;padding:.25rem .15rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:100%";return s;}
  /* ハ長調の白鍵の音の、音階の上の番号（C4 = 28。7 つで 1 オクターブ） */
  function _w12_dia(m){return [0,0,1,1,2,3,3,4,4,5,5,6][((m%12)+12)%12]+7*(Math.floor(m/12)-1);}
  /* 連続 5 度・連続 8 度: [種類, 声部, 声部]。c は [B,T,A,S] の MIDI。2 つの声部がどちらも動くときだけ数える */
  function _w12_par(c1,c2){var out=[],N="BTAS";
    for(var p=0;p<4;p++)for(var q=p+1;q<4;q++){
      if(c1[p]===c2[p]||c1[q]===c2[q])continue;
      var i1=Math.abs(c1[q]-c1[p])%12,i2=Math.abs(c2[q]-c2[p])%12;
      if(i1===7&&i2===7)out.push(["5",N[p],N[q]]);
      if(i1===0&&i2===0)out.push(["8",N[p],N[q]]);}
    return out;}
  function _w12_up(c1,c2){var s=0;for(var k=1;k<4;k++)s+=Math.abs(c2[k]-c1[k]);return s;}
  /* 4 声部の列（[B,T,A,S] の MIDI）を大譜表に全音符で書く。返り値 {svg, w, h, pos[列][声部] = [x, y]} */
  function _w12_grand(cols,o){
    o=o||{}; var s=o.s||8, dx=o.dx||64, x0=o.x0||(staffStart(s,0,null)+1.6*s), top=3.4*s+(o.padTop||0), X=2, hw=0.78*s;
    var W=o.w||(x0+(cols.length-1)*dx+3.6*s), items=[], pos=[], N="BTAS";
    cols.forEach(function(c,ci){
      var cx=x0+ci*dx, P={};
      [["treble",2,3],["bass",0,1]].forEach(function(g){
        var vs=[g[1],g[2]].sort(function(a,b){return c[a]-c[b];});   /* 低い音から */
        var nm=vs.map(function(k){return nname(c[k]);});
        items.push({x:cx,notes:nm,staff:g[0],fills:vs.map(function(k){return V(_w12_VC[N[k]]);})});
        var yt=g[0]==="treble"?top:top+8*s, pp=nm.map(function(n){return parse(n).dia-(g[0]==="bass"?18:30);});
        vs.forEach(function(k,i){var sh=i===1&&pp[1]-pp[0]===1, x=X+cx+(sh?2*hw-0.1*s:0); P[N[k]]=[x,yt+4*s-pp[i]*s/2];});
      });
      pos.push(P);
    });
    var st=staff({s:s,w:W,clef:"grand",items:items,top:top,x:X,bottom:o.bottom||4*s});
    var b=[st.svg];
    if(o.lines!==false)for(var ci=0;ci<cols.length-1;ci++)"BTAS".split("").forEach(function(v,k){
      var p1=pos[ci][v],p2=pos[ci+1][v],held=cols[ci][k]===cols[ci+1][k];
      if(held&&o.held!==false)b.push(ln(p1[0]+hw+2,p1[1],p2[0]-hw-2,p2[1],V("signal"),3.2));
      else b.push(ln(p1[0]+hw+2,p1[1],p2[0]-hw-2,p2[1],V(_w12_VC[v]),1.5).replace("<line",'<line stroke-opacity="0.75"'));
    });
    return {svg:b.join(""),w:st.w,h:st.h,pos:pos,s:s,top:top,hw:hw};
  }
  /* 連続 5 度・8 度の印（赤い破線）を 2 つの列の間に描く */
  function _w12_parMarks(g,ci,list){var b=[];
    list.forEach(function(q,k){var off=g.hw+6+k*6;
      [ci,ci+1].forEach(function(cj,side){var a=g.pos[cj][q[1]],c=g.pos[cj][q[2]],x=side?a[0]+off:a[0]-off;
        b.push(ln(x,a[1],x,c[1],V("alias"),1.8,"4,3"));});});
    return b.join("");}
  function _w12_parText(list){var nm={"5":"連続 5 度","8":"連続 8 度"};
    return list.map(function(q){return nm[q[0]]+"（"+_w12_VJ[q[1]]+"–"+_w12_VJ[q[2]]+"）";}).join("、");}
  /* ボタンの押した状態を、ほかの音が鳴ったときにも戻す */
  function _w12_toggle(btn,label,playFn){
    function reset(){btn.textContent=label;btn.setAttribute("aria-pressed","false");}
    btn.addEventListener("click",function(){
      if(btn.getAttribute("aria-pressed")==="true"){stopAll();reset();return;}
      playFn(reset); btn.textContent="■ 止める"; btn.setAttribute("aria-pressed","true"); hold(reset);
    });
    return reset;
  }

  /* ============ 12. w12_prog — 定番の進行の機能と根音の動き ============ */
  REG.w12_prog=function(el){
    head(el,"Progression","進行と調を選ぶと、機能と根音の動きが表示され、ベース付きで鳴る");
    var P=[["小室進行（VIm–IV–V–I）",[["VIm"],["IV"],["V"],["I"]]],
           ["ツーファイブワン（IIm7–V7–IM7）",[["IIm7"],["V7"],["IM7"]]],
           ["王道進行（IVM7–V7–IIIm7–VIm）",[["IVM7"],["V7"],["IIIm7"],["VIm"]]],
           ["カノン進行",[["I"],["V"],["VIm"],["IIIm"],["IV"],["I"],["IV"],["V"]]],
           ["カノン進行（ベースを 2 度ずつ下げる）",[["I"],["V","VII"],["VIm"],["IIIm","V"],["IV"],["I","III"],["IV"],["V"]]],
           ["循環進行（IIIm–VIm–IIm–V–I）",[["IIIm"],["VIm"],["IIm"],["V"],["I"]]],
           ["循環進行（I–VIm–IIm–V）",[["I"],["VIm"],["IIm"],["V"]]]];
    var K=[["C","ハ長調（C）"],["G","ト長調（G）"],["D","ニ長調（D）"],["F","ヘ長調（F）"],["Bb","変ロ長調（B♭）"]];
    var row=ctrls(el),sp=select(row,"進行",P.map(function(x){return x[0];})),sk=select(row,"調",K.map(function(x){return x[1];}));
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 再生");
    var band=mk("div");band.style.cssText="display:flex;flex-wrap:wrap;align-items:stretch;gap:.35rem .2rem;margin-top:.7rem";el.appendChild(band);
    var view=mk("div","wscreen");view.style.cssText+="padding:.5rem;margin-top:.6rem;display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;align-items:center";el.appendChild(view);
    var ro=readout(el),cur=-1;
    function prog(){
      var p=P[+sp.value],key=K[+sk.value][0],sc=spellScale(key+"4",MAJOR,7).map(function(n){return nname(n,false);}),prev=null;
      return p[1].map(function(c){
        var r=_w12_deg(c[0]),i=["I","II","III","IV","V","VI","VII"].indexOf(r),suf=c[0].slice(r.length),root=sc[i];
        var bi=c[1]?["I","II","III","IV","V","VI","VII"].indexOf(c[1]):-1,sym=root+suf+(bi>=0?"/"+sc[bi]:"");
        var cp=chordParse(sym),up=voiceLead(sym,prev,52,67);prev=up;
        var bpc=cp.bassPc!=null?cp.bassPc:cp.rootPc,bass=40+((bpc-40)%12+12)%12;
        return {deg:c[0],sym:sym,fn:_w12_fn(c[0]),li:"CDEFGAB".indexOf(root[0]),pc:cp.rootPc,pcs:cp.ivs.map(function(v){return (cp.rootPc+v)%12;}),m:[bass].concat(up),bassName:bi>=0?sc[bi]:root};
      });
    }
    function moveOf(a,b){var d=((b.li-a.li)%7+7)%7,st=((b.pc-a.pc)%12+12)%12,com=a.pcs.filter(function(p){return b.pcs.indexOf(p)>=0;}).length;
      var lab=_w12_MOVE[d]; if(d===3&&st===6)lab="増 4 度上"; if(d===4&&st===6)lab="増 4 度下";
      return {d:d,lab:lab,strong:d===3&&st===5,com:com};}
    function draw(){
      var ch=prog(),key=K[+sk.value][0],h=[];
      ch.forEach(function(c,i){
        var fc=_w12_FC[c.fn],on=i===cur;
        if(i>0){var mv=moveOf(ch[i-1],c);
          h.push('<div style="display:flex;flex:0 0 auto;align-items:stretch;gap:.2rem"><div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:3.1rem;font-family:var(--mono);font-size:.66rem;line-height:1.3;color:'+(mv.strong?V("ink"):V("muted"))+'">'+
            '<span style="font-weight:'+(mv.strong?700:400)+'">'+mv.lab+'</span><span style="font-size:'+(mv.strong?"1.15rem":".95rem")+';line-height:1">→</span><span>共通 '+mv.com+'</span>'+(mv.strong?'<span style="font-weight:700">強進行</span>':'')+'</div>');}
        h.push('<div data-i="'+i+'" style="cursor:pointer;min-width:3.9rem;flex:0 0 auto;text-align:center;padding:.3rem .35rem;border-radius:9px;border:'+(on?'2.5px solid '+V("ink"):'1.5px solid '+V(fc))+';background:'+V(fc+"-soft")+';line-height:1.35">'+
          '<div style="font-weight:700;font-size:.95rem">'+esc(c.sym)+'</div><div style="font-family:var(--mono);font-size:.72rem">'+esc(c.deg)+'</div>'+
          '<div style="font-family:var(--mono);font-size:.7rem;font-weight:700;color:'+V(fc)+'">'+c.fn+'</div></div>'+(i>0?'</div>':''));
      });
      band.innerHTML=h.join("");
      /* 円（五度圏と同じ並び）と鍵盤 */
      var R=86,cx=118,cy=112,flat=key==="F"||key==="Bb",lab=flat?NF:["C","D♭","D","E♭","E","F","F♯","G","A♭","A","B♭","B"],fills={};
      ch.forEach(function(c){fills[c.pc]=V(_w12_FC[c.fn]);});
      var b=[clock(cx,cy,R,{order:"fifths",active:ch.map(function(c){return c.pc;}),fills:fills,labels:lab,poly:false,sz:11.5})];
      var pt=function(pc){var a=(-90+30*((7*pc)%12))*Math.PI/180;return [cx+R*Math.cos(a),cy+R*Math.sin(a)];};
      for(var i=0;i<ch.length-1;i++){var a=pt(ch[i].pc),c2=pt(ch[i+1].pc),mv=moveOf(ch[i],ch[i+1]);
        if(ch[i].pc===ch[i+1].pc)continue;
        var dx=c2[0]-a[0],dy=c2[1]-a[1],L=Math.sqrt(dx*dx+dy*dy),ux=dx/L,uy=dy/L,sx=a[0]+ux*11,sy=a[1]+uy*11,ex=c2[0]-ux*11,ey=c2[1]-uy*11;
        var on=cur===i+1,col=on?V("signal"):mv.strong?V("ink"):V("muted"),lw=on?3.2:mv.strong?2.6:1.3,hd=on||mv.strong?8:6,hx=ex-ux*hd,hy=ey-uy*hd;
        b.push(ln(sx,sy,hx,hy,col,lw));
        b.push('<polygon points="'+ex+','+ey+' '+(hx-uy*hd*0.45)+','+(hy+ux*hd*0.45)+' '+(hx+uy*hd*0.45)+','+(hy-ux*hd*0.45)+'" fill="'+col+'"/>');}
      b.push(tx(cx,cy-4,"根音の動き","middle",10.5,V("muted")));b.push(tx(cx,cy+12,"太い矢印 = 強進行","middle",10,V("muted")));
      var kb=null;
      if(cur>=0){var c=ch[cur],hl={},names=chordSpell(c.sym,c.m);c.m.forEach(function(m,k){hl[m]={c:k===0?"gold":"purple",label:nname(names[k],false),strong:true};});kb=kbd(36,83,{ww:11.5,wh:50,hl:hl,names:"c"});}
      else kb=kbd(36,83,{ww:11.5,wh:50,names:"c"});
      view.innerHTML=svgWrap(236,228,b.join(""))+'<div style="text-align:center">'+svgWrap(kb.w,kb.h,kb.svg,"kbd")+'<div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-top:.3rem">'+(cur>=0?esc(ch[cur].sym)+'（金: ベース、紫: 上の音）':'和音の箱を押すと、その和音が鳴る')+'</div></div>';
      var cnt={s:0,f:0,t:0,w:0,o:0};
      for(var j=0;j<ch.length-1;j++){var m2=moveOf(ch[j],ch[j+1]);if(m2.strong)cnt.s++;else if(m2.d===4)cnt.f++;else if(m2.d===2||m2.d===5)cnt.t++;else if(m2.d===1||m2.d===6)cnt.w++;else cnt.o++;}
      ro.innerHTML='根音の動き: 強進行（4 度上）<b>'+cnt.s+'</b> 回 ・ 4 度下 <b>'+cnt.f+'</b> 回 ・ 3 度 <b>'+cnt.t+'</b> 回 ・ 2 度 <b>'+cnt.w+'</b> 回'+(cnt.o?' ・ そのほか '+cnt.o+' 回':'')+
        '<br>ベース: '+ch.map(function(c){return esc(c.bassName);}).join(' → ');
    }
    band.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest("[data-i]");if(!t)return;var ch=prog(),i=+t.getAttribute("data-i");
      cur=i;draw();playEvents([{t:0,d:1.6,m:ch[i].m}],{timbre:"piano",onEnd:function(){if(cur===i){cur=-1;draw();}}});});
    _w12_toggle(bp,"▶ 再生",function(reset){var ch=prog(),evs=ch.map(function(c,i){return {t:i*1.15,d:i===ch.length-1?2.2:1.1,m:c.m};});
      playEvents(evs,{timbre:"piano",onStep:function(i){cur=i;draw();},onEnd:function(){cur=-1;draw();reset();}});});
    [sp,sk].forEach(function(s){s.addEventListener("change",function(){cur=-1;draw();});});
    draw();
  };

  /* ============ 12. w12_pair — 2 つの和音の声部を動かして、連続 5 度・8 度を調べる ============ */
  var _w12_CHORD={"C":[0,4,7],"Dm":[2,5,9],"Em":[4,7,11],"F":[5,9,0],"G":[7,11,2],"Am":[9,0,4],"G7":[7,11,2,5]};
  function _w12_dbl(pcs,have){   /* 構成音がそろっていれば重複の罰点、そろわなければ -1 */
    var cnt={};have.forEach(function(p){cnt[p]=(cnt[p]||0)+1;});
    if(pcs.length===3){if(pcs.some(function(p){return !cnt[p];}))return -1;
      var d=pcs.filter(function(p){return cnt[p]>1;})[0];return d===pcs[0]?0:d===pcs[2]?1:(d===11?6:3);}
    if(!cnt[pcs[0]]||!cnt[pcs[1]]||!cnt[pcs[3]])return -1;
    return cnt[pcs[2]]?0:(cnt[pcs[0]]===2?1:-1);}
  function _w12_cands(pcs,bass){var out=[];
    for(var t=48;t<=67;t++){if(pcs.indexOf(t%12)<0||t<=bass)continue;
      for(var a=Math.max(55,t+1);a<=72;a++){if(pcs.indexOf(a%12)<0||a-t>12)continue;
        for(var s=Math.max(60,a+1);s<=79;s++){if(pcs.indexOf(s%12)<0||s-a>12)continue;
          var v=[bass,t,a,s],pen=_w12_dbl(pcs,v.map(function(m){return m%12;}));if(pen>=0)out.push({v:v,pen:pen});}}}
    return out;}
  /* つなぎ方の評価: mode 1 = 音階の上の動きの数を優先して近い音へ、mode 2 = さらに連続 5 度・8 度を避ける */
  function _w12_cost(c1,c2,mode){var st=0,se=0;for(var k=1;k<4;k++){st+=Math.abs(_w12_dia(c2[k])-_w12_dia(c1[k]));se+=Math.abs(c2[k]-c1[k]);}
    return 10*st+se+(mode===2?1000*_w12_par(c1,c2).length:0);}
  function _w12_bassOf(pc){return 40+((pc-40)%12+12)%12;}

  REG.w12_pair=function(el){
    head(el,"Voice leading","2 つ目の和音の各声部を動かして、動きの合計と連続 5 度・8 度を調べる");
    var PAIRS=[["IV → V（F → G）","F","G",[41,57,60,65]],["V → VIm（G → Am）","G","Am",[43,59,62,67]],["I → IV（C → F）","C","F",[48,55,60,64]],
               ["IIm → V（Dm → G）","Dm","G",[50,57,62,65]],["VIm → IIm（Am → Dm）","Am","Dm",[45,57,60,64]],["V → I（G → C）","G","C",[43,59,62,67]]];
    var row=ctrls(el),sp=select(row,"2 つの和音（ハ長調）",PAIRS.map(function(x){return x[0];}));
    var bar=mk("div","pbtns");el.appendChild(bar);
    var bp=button(bar,"▶ 鳴らす"),b1=button(bar,"2 度以内に動かす"),b2=button(bar,"連続を避ける");
    var vb=mk("div");vb.style.cssText="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.4rem;margin-top:.7rem";el.appendChild(vb);
    var view=mk("div","wscreen");view.style.cssText+="padding:.5rem;margin-top:.6rem";el.appendChild(view);
    var ro=readout(el),c2=null;
    var V4=["S","A","T","B"],IDX={B:0,T:1,A:2,S:3};
    V4.forEach(function(v){var d=mk("div");d.style.cssText="display:flex;flex-direction:column;align-items:center;gap:.25rem";
      d.innerHTML='<span style="font-family:var(--mono);font-size:.72rem;font-weight:700;color:'+V(_w12_VC[v])+'">'+_w12_VJ[v]+'</span>';
      var r=mk("div");r.style.cssText="display:flex;gap:.3rem";d.appendChild(r);
      var u=button(r,"▲"),w=button(r,"▼");u.style.padding=w.style.padding=".35rem .6rem";
      u.addEventListener("click",function(){shift(v,1);});w.addEventListener("click",function(){shift(v,-1);});vb.appendChild(d);});
    function cur(){var p=PAIRS[+sp.value];return {p:p,c1:p[3],pcs:_w12_CHORD[p[2]],pcs1:_w12_CHORD[p[1]]};}
    function preset(mode){var c=cur(),bass=_w12_bassOf(c.pcs[0]),best=null,bv=1e18;
      _w12_cands(c.pcs,bass).forEach(function(q){var v=_w12_cost(c.c1,q.v,mode)+10*q.pen;if(v<bv){bv=v;best=q.v;}});c2=best.slice();draw();}
    function shift(v,dir){var c=cur(),k=IDX[v],m=c2[k],rg=_w12_RANGE[v];
      for(var x=m+dir;x>=rg[0]&&x<=rg[1];x+=dir){if(c.pcs.indexOf(((x%12)+12)%12)>=0){c2[k]=x;break;}}draw();}
    function draw(){
      var c=cur(),c1=c.c1,par=_w12_par(c1,c2);
      var g=_w12_grand([c1,c2],{s:8,dx:150,x0:staffStart(8,0,null)+5*8,bottom:7*8});
      var b=[g.svg,_w12_parMarks(g,0,par)];
      [c.p[1],c.p[2]].forEach(function(nm,i){b.push(tx(g.pos[i].S[0],g.top-1.6*g.s,nm,"middle",12,V("ink"),true));});
      view.innerHTML='<div style="display:flex;justify-content:center">'+svgWrap(g.w,g.h,b.join(""))+'</div>';
      var mv=V4.map(function(v){var k=IDX[v],d=c2[k]-c1[k],st=Math.abs(_w12_dia(c2[k])-_w12_dia(c1[k]));
        return '<span style="color:'+V(_w12_VC[v])+'">'+_w12_VJ[v]+'</span> '+nname(c1[k])+'→'+nname(c2[k])+(d?'（'+(d>0?"+":"")+d+' 半音・'+(st+1)+' 度）':'（保持）');});
      var warn=[],have=c2.map(function(m){return m%12;});
      c.pcs.forEach(function(p,i){if(have.indexOf(p)<0&&!(c.pcs.length===4&&i===2))warn.push(c.p[2]+' の構成音 '+NS[p]+' が無い');});
      if(!(c2[0]<c2[1]&&c2[1]<c2[2]&&c2[2]<c2[3]))warn.push('声部の高さの順が入れ替わっている（または同じ高さ）');
      if(c2[3]-c2[2]>12||c2[2]-c2[1]>12)warn.push('上の 3 声部の隣どうしが 1 オクターブを超えている');
      ro.innerHTML=mv.slice(0,2).join(' ・ ')+'<br>'+mv.slice(2).join(' ・ ')+'<br>上の 3 声部の動きの合計 <b>'+_w12_up(c1,c2)+'</b> 半音 ／ '+
        (par.length?'<span class="warn">'+_w12_parText(par)+'</span>':'連続 5 度・連続 8 度: <b>なし</b>')+(warn.length?'<br><span class="warn">'+warn.join('。')+'</span>':'');
    }
    _w12_toggle(bp,"▶ 鳴らす",function(reset){var c=cur();playEvents([{t:0,d:1.3,m:c.c1},{t:1.4,d:1.9,m:c2.slice()}],{timbre:"piano",onEnd:reset});});
    b1.addEventListener("click",function(){preset(1);});b2.addEventListener("click",function(){preset(2);});
    sp.addEventListener("change",function(){preset(1);});
    preset(1);
  };

  /* ============ 12. w12_build — 手順どおりに進行を組み立てる ============ */
  REG.w12_build=function(el){
    head(el,"Build","機能 → 和音 → ベース → 上の 3 声部 の順に選ぶと、4 つの声部の進行ができる");
    var FLOWS=[["T","SD","D","T"],["T","T","SD","D","T"]];
    var OPT={T:[["I","C"],["VIm","Am"],["IIIm","Em"]],SD:[["IV","F"],["IIm","Dm"]],D:[["V","G"],["V7","G7"]]};
    var DEF=[[0,0,0,0],[0,1,0,0,0]];
    var row=ctrls(el),sf=select(row,"① 機能の流れ",FLOWS.map(function(f){return f.join(" → ");})),sm=select(row,"④ 上の 3 声部のつなぎ方",["基本形のまま","近い音へ（2 度以内を優先）","近い音へ・連続 5 度と 8 度を避ける"]);
    sf.value="1";sm.value="2";
    var lab=mk("div");lab.style.cssText="font-family:var(--mono);font-size:.72rem;color:var(--muted);margin-top:.75rem";lab.textContent="② 和音 と ③ ベース（各和音）";el.appendChild(lab);
    var slots=mk("div");slots.style.cssText="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.35rem";el.appendChild(slots);
    var bar=mk("div","pbtns");el.appendChild(bar);var bp=button(bar,"▶ 再生");
    var view=mk("div","wscreen");view.style.cssText+="padding:.5rem;margin-top:.6rem";el.appendChild(view);
    var ro=readout(el),sel=[],cur=-1;
    function makeSlots(){
      var fl=FLOWS[+sf.value];slots.innerHTML="";sel=[];
      fl.forEach(function(f,i){var fc=_w12_FC[f],d=mk("div");
        d.style.cssText="flex:1 1 6.3rem;min-width:6.3rem;max-width:8.5rem;display:flex;flex-direction:column;gap:.25rem;padding:.35rem;border-radius:9px;border:1.5px solid "+V(fc)+";background:"+V(fc+"-soft");
        d.innerHTML='<span style="font-family:var(--mono);font-size:.72rem;font-weight:700;color:'+V(fc)+'">'+(i+1)+'. '+f+'</span>';
        var a=_w12_selStyle(mk("select")),b=_w12_selStyle(mk("select"));
        OPT[f].forEach(function(o,k){var op=mk("option");op.value=k;op.textContent=o[0]+"（"+o[1]+"）";a.appendChild(op);});
        ["根音","3 度の音"].forEach(function(t,k){var op=mk("option");op.value=k;op.textContent=t;b.appendChild(op);});
        var cap=mk("span");cap.style.cssText="font-family:var(--mono);font-size:.64rem;color:var(--muted);margin-top:.1rem";cap.textContent="ベース";
        a.value=String(DEF[+sf.value][i]||0);
        a.addEventListener("change",draw);b.addEventListener("change",draw);
        d.appendChild(a);d.appendChild(cap);d.appendChild(b);slots.appendChild(d);sel.push([f,a,b]);});
    }
    function chords(){return sel.map(function(q){var o=OPT[q[0]][+q[1].value],pcs=_w12_CHORD[o[1]],bpc=+q[2].value?pcs[1]:pcs[0];
      return {deg:o[0],sym:o[1]+(+q[2].value?"/"+NS[pcs[1]]:""),name:o[1],fn:q[0],pcs:pcs,bass:_w12_bassOf(bpc)};});}
    function rootpos(c){var first=c.pcs.length===3?c.pcs[0]:c.pcs[1],t=53+((first-53)%12+12)%12,rest=c.pcs.length===3?[c.pcs[1],c.pcs[2]]:[c.pcs[2],c.pcs[3]],v=[c.bass,t];
      rest.forEach(function(p){var l=v[v.length-1];v.push(l+((((p-l)%12)+12)%12||12));});return v;}
    function solve(ch,mode){
      if(mode===0)return ch.map(rootpos);
      var C=ch.map(function(c){return _w12_cands(c.pcs,c.bass);}),best=[],back=[];
      best[0]=C[0].map(function(q){return Math.abs(q.v[1]-55)+Math.abs(q.v[2]-60)+Math.abs(q.v[3]-64)+10*q.pen;});
      for(var i=1;i<C.length;i++){best[i]=[];back[i]=[];
        for(var j=0;j<C[i].length;j++){var bv=1e18,bk=0;
          for(var k=0;k<C[i-1].length;k++){var v=best[i-1][k]+_w12_cost(C[i-1][k].v,C[i][j].v,mode)+10*C[i][j].pen;if(v<bv){bv=v;bk=k;}}
          best[i][j]=bv;back[i][j]=bk;}}
      var n=C.length-1,jj=0;for(var q=1;q<best[n].length;q++)if(best[n][q]<best[n][jj])jj=q;
      var out=[];for(var i2=n;i2>=0;i2--){out.unshift(C[i2][jj].v);if(i2>0)jj=back[i2][jj];}
      return out;}
    function draw(){
      var ch=chords(),mode=+sm.value,cols=solve(ch,mode),n=cols.length;
      var g=_w12_grand(cols,{s:8,dx:n>4?72:84,bottom:8*8,padTop:16});
      var b=[g.svg],tot=0,allp=[],lines=[];
      ch.forEach(function(c,i){var x=g.pos[i].S[0],on=i===cur;
        if(on)b.push('<rect x="'+(x-18)+'" y="4" width="36" height="'+(g.h-8)+'" rx="8" fill="'+V("signal-soft")+'"/>');
        b.push(tx(x,g.top-2.9*g.s,c.sym,"middle",11.5,V("ink"),true));b.push(tx(x,g.top-1.3*g.s,c.deg,"middle",9.5,V("muted")));});
      for(var i=0;i<n-1;i++){var u=_w12_up(cols[i],cols[i+1]),p=_w12_par(cols[i],cols[i+1]);tot+=u;
        var xm=(g.pos[i].S[0]+g.pos[i+1].S[0])/2;b.push(tx(xm,g.top+12*g.s+4.6*g.s,String(u),"middle",11,V("ink"),true));
        if(p.length){b.push(_w12_parMarks(g,i,p));allp.push(ch[i].name+' → '+ch[i+1].name+': '+_w12_parText(p));}}
      b.push(tx(4,g.top+12*g.s+4.6*g.s,"動き","start",9.5,V("muted")));
      view.innerHTML='<div style="display:flex;justify-content:center">'+svgWrap(g.w,g.h,b.join(""))+'</div>';
      ro.innerHTML='上の 3 声部の動きの合計 <b>'+tot+'</b> 半音（下の数字は、隣の和音へ移るときの動き）<br>'+
        (allp.length?'<span class="warn">'+allp.join(' ／ ')+'</span>':'連続 5 度・連続 8 度: <b>なし</b>')+
        '<br>五線の色 — 黒: ソプラノ、青: アルト、緑: テノール、金: バス。赤い太線は共通音の保持';
      return cols;
    }
    _w12_toggle(bp,"▶ 再生",function(reset){var cols=draw(),evs=cols.map(function(c,i){return {t:i*1.25,d:i===cols.length-1?2.2:1.2,m:c.slice()};});
      playEvents(evs,{timbre:"piano",onStep:function(i){cur=i;draw();},onEnd:function(){cur=-1;draw();reset();}});});
    sf.addEventListener("change",function(){makeSlots();cur=-1;draw();});sm.addEventListener("change",function(){cur=-1;draw();});
    makeSlots();draw();
  };
