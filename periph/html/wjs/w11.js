  /* ===== 11 章 スイッチと外部入力 ===== */
  /* H・L の波形: pts = [[時刻, 1 か 0], ...]（その時刻から、その値） */
  function _w11_dwave(S,pts,X,yH,yL,c,lw){var q=[];pts.forEach(function(p){var y=p[1]?yH:yL;if(q.length)q.push([X(p[0]),q[q.length-1][1]]);q.push([X(p[0]),y]);});return S.PL(q,c||"teal",lw||1.8);}
  function _w11_ms(v){return (v>=100?Math.round(v):+v.toPrecision(3))+" ms";}
  function _w11_life(uA){var h=220/(uA*1e-3);var d=h/24;return d>=365?_w11_sig(d/365,3)+" 年":(d>=1?_w11_sig(d,3)+" 日":_w11_sig(h,3)+" 時間");}
  function _w11_sig(v,d){d=d||3;if(v===0)return "0";var a=Math.abs(v);var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();return s.replace("-","−");}

  /* ---- 2 節: チャタリングと、その取り除き方 ---- */
  REG.w11_bounce=function(el,U){
    var S=U.S,seed=1,VDD=3.3;
    U.head(el,"DEBOUNCE","チャタリングと、その取り除き方");
    var r1=U.ctrls(el);
    var meth=U.select(r1,"取り除き方",["そのまま（H→L の変化を押した回数として数える）","RC とシュミットトリガ（回路）","続けて N 回（プログラム）","一定時間待つ（プログラム）"],2,draw);
    var tb=U.slider(r1,"はね返りの長さ t_B",{values:[0.5,1,2,3,5,8,12,20],value:3,fmt:function(v){return v+" ms";},onInput:draw});
    var nb=U.slider(r1,"押したときのはね返りの回数",{min:1,max:15,step:1,value:6,fmt:function(v){return v+" 回";},onInput:draw});
    var r2=U.ctrls(el);
    var R1=U.slider(r2,"R1",{values:[1,4.7,10,22,47,100],value:10,fmt:function(v){return v+" kΩ";},onInput:draw});
    var R2=U.slider(r2,"R2",{values:[1,4.7,10,15,22,47],value:15,fmt:function(v){return v+" kΩ";},onInput:draw});
    var Cc=U.slider(r2,"C",{values:[0.1,0.22,0.47,1,2.2],value:1,fmt:function(v){return v+" µF";},onInput:draw});
    var sch=U.checkbox(r2,"シュミットトリガ（しきい値 2 つ）",true,draw);
    var r3=U.ctrls(el);
    var Tp=U.slider(r3,"読む周期 T_p",{values:[1,2,5,10,20],value:5,fmt:function(v){return v+" ms";},onInput:draw});
    var Nn=U.slider(r3,"続けて読む回数 N",{min:1,max:8,step:1,value:3,fmt:function(v){return v+" 回";},onInput:draw});
    var Td=U.slider(r3,"無視する時間 T_d",{values:[5,10,20,50],value:20,fmt:function(v){return v+" ms";},onInput:draw});
    var r4=U.ctrls(el);
    var noise=U.checkbox(r4,"離している間に、幅 2 ms のノイズのパルスを入れる",false,draw);
    var br=U.btnrow(el);
    U.button(br,"2 節の例（RC）",function(){meth.set(1);R1.set(10);R2.set(15);Cc.set(1);sch.set(true);tb.set(5);draw();});
    U.button(br,"2 節の例（続けて 3 回）",function(){meth.set(2);Tp.set(5);Nn.set(3);tb.set(5);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var m=meth.get(),tB=tb.get(),nB=nb.get(),r1v=R1.get(),r2v=R2.get(),cv=Cc.get(),tp=Tp.get(),N=Nn.get(),td=Td.get(),nz=noise.get();
      r2.style.opacity=m===1?"1":"0.45";r3.style.opacity=(m===2||m===3)?"1":"0.45";
      var R=U.rng(seed*7919+13),tP=30,tR=120;
      /* スイッチの区間: [時刻, 閉じているか] */
      var seg=[[0,false]];
      if(nz){seg.push([10,true]);seg.push([12,false]);}
      var ts=[];for(var i=0;i<2*nB;i++)ts.push(tP+R.range(0.02,tB));ts.sort(function(a,b){return a-b;});
      seg.push([tP,true]);var cl=true;ts.forEach(function(t){cl=!cl;seg.push([t,cl]);});
      var pEnd=ts.length?ts[ts.length-1]:tP;
      var nR=Math.max(1,Math.round(nB/2)),tr=[];for(i=0;i<2*nR;i++)tr.push(tR+R.range(0.02,tB*0.6));tr.sort(function(a,b){return a-b;});
      seg.push([tR,false]);cl=false;tr.forEach(function(t){cl=!cl;seg.push([t,cl]);});
      var rEnd=tr.length?tr[tr.length-1]:tR;
      var tauC=(r1v+r2v)*cv,tauD=r2v*cv;                         /* kΩ × µF = ms */
      var TEND=Math.min(800,Math.max(200,m===1?tR+tauC*1.6+15:tR+N*tp+tp+20));
      var dt=0.01,k=0,closed=false,ev=[],vpts=[],raw=[[0,1]];
      var v=VDD,out=1,nzv=0,nzR=U.rng(seed*31+7),state=0,cnt=0,ign=-1,sphase=R.range(0,tp),nexts=sphase,samples=[];
      var stepN=Math.round(TEND/dt);
      for(var s=0;s<=stepN;s++){
        var t=s*dt;
        while(k+1<seg.length&&seg[k+1][0]<=t){k++;var nc=seg[k][1];if(nc!==closed){closed=nc;raw.push([seg[k][0],closed?0:1]);}}
        var lev=closed?0:1;
        if(m===0){
          if(lev!==out){ev.push([t,lev?"R":"P"]);out=lev;}
        }else if(m===1){
          var tgt=closed?0:VDD,tau=closed?tauD:tauC;v=tgt+(v-tgt)*Math.exp(-dt/tau);
          if(s%5===0)nzv=sch.get()?0:nzR.range(-0.06,0.06);
          var vr=v+nzv;
          if(s%20===0)vpts.push([t,vr]);
          var nv=out;
          if(sch.get()){if(out===1&&vr<0.4*VDD)nv=0;else if(out===0&&vr>0.6*VDD)nv=1;}
          else nv=vr>0.5*VDD?1:0;
          if(nv!==out){ev.push([t,nv?"R":"P"]);out=nv;}
        }else if(m===2){
          if(t>=nexts-1e-9){var now=lev?0:1;samples.push([nexts,lev]);
            if(now===state)cnt=0;else if(++cnt>=N){cnt=0;state=now;ev.push([nexts,now?"P":"R"]);}
            nexts+=tp;}
        }else{
          var nowp=lev?0:1;
          if(t>=ign&&nowp!==state){state=nowp;ev.push([t,nowp?"P":"R"]);ign=t+td;}
        }
      }
      /* 判定 */
      var nP=0,nR2=0,falseEv=0,firstP=null,firstR=null;
      ev.forEach(function(e){if(e[1]==="P"){nP++;if(e[0]>=tP&&e[0]<tR&&firstP===null)firstP=e[0];else falseEv++;}else{nR2++;if(e[0]>=tR&&firstR===null)firstR=e[0];else falseEv++;}});
      /* ---- 図 ---- */
      var W=700,o=[],x0=96,x1=684,X=function(t){return x0+t/TEND*(x1-x0);};
      var yA=28,hA=56;
      if(m===1){
        var Y=function(vv){return yA+hA-(vv/VDD)*hA;};
        o.push(S.T(x0-8,yA-6,"C の電圧","end",9.5,"teal",true));
        o.push(S.T(x0-8,yA+hA+3,"0 V","end",9,"muted"));o.push(S.T(x0-8,yA+4,"3.3 V","end",9,"muted"));
        var th=sch.get()?[[0.6,"purple"],[0.4,"purple"]]:[[0.5,"alias"]];
        th.forEach(function(q){o.push(S.L(x0,Y(q[0]*VDD),x1,Y(q[0]*VDD),q[1],1,"5 3"));});
        o.push(S.PL(vpts.map(function(p){return [X(p[0]),Y(Math.max(-0.2,Math.min(VDD+0.2,p[1])))];}),"teal",1.4));
      }else{
        o.push(S.T(x0-8,yA+30,"ピンの値","end",9.5,"teal",true));
        o.push(S.T(x0-8,yA+16,"H","end",9,"muted"));o.push(S.T(x0-8,yA+48,"L","end",9,"muted"));
        o.push(_w11_dwave(S,raw.concat([[TEND,raw[raw.length-1][1]]]),X,yA+12,yA+44,"teal",1.6));
      }
      if(nz)o.push(S.T(X(11),yA-6,"ノイズ","middle",9,"alias",true));
      o.push(S.T(X(tP),yA-6,"押す","middle",9,"ink",true));o.push(S.T(X(tR),yA-6,"離す","middle",9,"ink",true));
      var yS=104;
      if(m===2){o.push(S.T(x0-8,yS+4,"読む","end",9.5,"signal",true));o.push(S.L(x0,yS,x1,yS,"grid",1));
        if(samples.length<400)samples.forEach(function(p){o.push(S.D(X(p[0]),yS,p[1]?"muted":"teal",p[1]?1.8:2.6));});}
      else if(m===3){o.push(S.T(x0-8,yS+4,"無視する間","end",9.5,"muted",true));ev.forEach(function(e){o.push(S.RECT(X(e[0]),yS-5,Math.max(1,X(e[0]+td)-X(e[0])),10,2,U.soft("gold"),"gold",0.8));});}
      else{o.push(S.T(x0-8,yS+4,"読む値","end",9.5,"signal",true));
        var rd=[[0,1]];ev.forEach(function(e){rd.push([e[0],e[1]==="R"?1:0]);});rd.push([TEND,rd[rd.length-1][1]]);o.push(_w11_dwave(S,rd,X,yS-7,yS+7,"signal",1.5));}
      /* 押されている帯 */
      var yB=130,curP=null;o.push(S.T(x0-8,yB+12,"判定","end",9.5,"ink",true));
      ev.forEach(function(e){if(e[1]==="P")curP=e[0];else if(curP!==null){var bad=!(curP>=tP&&curP<tR&&e[0]>=tR);
        o.push(S.RECT(X(curP),yB,Math.max(1.5,X(e[0])-X(curP)),16,2,U.soft(bad?"alias":"green"),bad?"alias":"green",1));curP=null;}});
      if(curP!==null){var bad2=!(curP>=tP&&curP<tR);o.push(S.RECT(X(curP),yB,Math.max(1.5,X(TEND)-X(curP)),16,2,U.soft(bad2?"alias":"green"),bad2?"alias":"green",1));}
      /* 出来事の印 */
      var yE=164;
      ev.forEach(function(e){var ok=(e[1]==="P"&&e[0]===firstP)||(e[1]==="R"&&e[0]===firstR),c=ok?(e[1]==="P"?"signal":"purple"):"alias",xx=X(e[0]);
        o.push(S.PL(e[1]==="P"?[[xx-4,yE-7],[xx+4,yE-7],[xx,yE]]:[[xx-4,yE],[xx+4,yE],[xx,yE-7]],c,1,c));});
      o.push(S.T(x0-8,yE,"出来事","end",9.5,"ink",true));
      var ya=182;o.push(S.L(x0,ya,x1,ya,"muted",1));
      var step=TEND>400?100:(TEND>200?50:25);
      for(var tt=0;tt<=TEND+1e-9;tt+=step){o.push(S.L(X(tt),ya,X(tt),ya+4,"muted",1));o.push(S.T(X(tt),ya+15,tt+(tt+step>TEND?" ms":""),"middle",9,"muted"));}
      o.push(S.PL([[x0,206],[x0+8,206],[x0+4,213]],"signal",1,"signal"));o.push(S.T(x0+14,213,"押した","start",9.5,"muted"));
      o.push(S.PL([[x0+70,213],[x0+78,213],[x0+74,206]],"purple",1,"purple"));o.push(S.T(x0+84,213,"離した","start",9.5,"muted"));
      o.push(S.PL([[x0+140,206],[x0+148,206],[x0+144,213]],"alias",1,"alias"));o.push(S.T(x0+154,213,"誤り（余分・早すぎ）","start",9.5,"muted"));
      box.set(S.svg(W,222,o));
      /* ---- 読み出し ---- */
      var okAll=nP===1&&nR2===1&&falseEv===0;
      var h='押したと決めた回数 <b>'+nP+' 回</b>、離したと決めた回数 <b>'+nR2+' 回</b>（本当はどちらも 1 回）→ '+(okAll?'<span class="ok">正しい</span>':'<span class="warn">誤り</span>')+"<br>";
      h+="押したと決まるまで: "+(firstP!==null?"接点が触れてから <b>"+_w11_ms(firstP-tP)+"</b>（"+(firstP>=pEnd?"はね返りが終わってから "+_w11_ms(firstP-pEnd):"はね返りの途中")+"）":'<span class="warn">決まらない</span>')+"。";
      h+="離したと決まるまで: "+(firstR!==null?"<b>"+_w11_ms(firstR-tR)+"</b>":'<span class="warn">図の範囲では決まらない</span>')+"<br>";
      if(m===0)h+="変化をそのまま数えると、はね返りの H→L をすべて押した回数に数える。";
      if(m===1){var need=tB/Math.log(1/0.7);h+="R2·C = "+_w11_sig(tauD,3)+" ms、条件 R2·C ≥ t_B / ln(1/0.7) = "+_w11_sig(need,3)+" ms → "+(tauD>=need?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"。離すときの時定数 (R1 + R2)·C = "+_w11_sig(tauC,3)+" ms。押している間の電流 3.3 V ÷ R1 = "+_w11_sig(3.3/r1v*1000,3)+" µA"+(sch.get()?"":'。<span class="warn">しきい値 1 つでは、ゆっくり変わる電圧がしきい値の近くにある間、ノイズで何度も入れ替わる</span>');}
      if(m===2)h+="(N − 1)·T_p = "+_w11_sig((N-1)*tp,3)+" ms と t_B = "+tB+" ms → "+((N-1)*tp>tB?'<span class="ok">(N − 1)·T_p のほうが長い</span>':'<span class="warn">はね返りのほうが長い（状態が途中で変わることがある）</span>')+"。遅れは、はね返りが終わってから N·T_p = "+_w11_sig(N*tp,3)+" ms まで";
      if(m===3)h+="最初の変化ですぐに決めるので遅れは無いが、ノイズのパルスでも決めてしまう。T_d がはね返りより短いと、はね返りの途中の値でも決める";
      ro.innerHTML=h+'<div class="wnote">はね返りは、決めた長さの中の乱数の時刻で開閉するとした。離すときのはね返りは、押すときの半分の回数・6 割の長さとした。RC では、しきい値をシュミットトリガで 0.6・0.4 V_DD、1 つのときは 0.5 V_DD とし、1 つのときだけ ±60 mV のノイズを加えた。</div>';
    }
    draw();
  };

  /* ---- 3 節: 割り込みで待つか、周期的に見るか ---- */
  REG.w11_wait=function(el,U){
    var S=U.S;
    U.head(el,"WAIT","スイッチの変化の待ち方と、平均電流・電池寿命");
    var r1=U.ctrls(el);
    var Tp=U.slider(r1,"読む周期 T_p",{values:[1,2,5,10,20,50],value:5,fmt:function(v){return v+" ms";},onInput:draw});
    var Nn=U.slider(r1,"続けて読む回数 N",{min:2,max:8,step:1,value:3,fmt:function(v){return v+" 回";},onInput:draw});
    var tb=U.slider(r1,"はね返りの長さ t_B",{values:[0.5,1,2,5,10],value:2,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var per=U.slider(r2,"1 日に押す回数",{min:1,max:10000,value:20,log:true,int:true,fmt:function(v){return Math.round(v)+" 回";},onInput:draw});
    var eg=U.slider(r2,"1 回の変化のはね返りの変化の数",{min:1,max:40,step:1,value:5,fmt:function(v){return v+" 回";},onInput:draw});
    var fn=U.slider(r2,"ノイズのパルス",{values:[0,0.01,0.1,1,10,100,1000,20000],value:0,fmt:function(v){return v?("1 秒に "+v+" 回"):"なし";},onInput:draw});
    var r3=U.ctrls(el);
    var Is=U.slider(r3,"眠りの電流 I_s",{values:[0.5,1,2,5,10],value:2,fmt:function(v){return v+" µA";},onInput:draw});
    var Qp=U.slider(r3,"1 回起きる電荷 Q_p",{values:[0.02,0.05,0.09,0.2,0.5,1],value:0.09,fmt:function(v){return v+" µC";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"3 節の例",function(){Tp.set(5);Nn.set(3);tb.set(2);per.set(20);eg.set(5);fn.set(0);Is.set(2);Qp.set(0.09);draw();});
    U.button(br,"ノイズが 1 秒に 20,000 回",function(){fn.set(20000);draw();});
    U.button(br,"よく押す（1 日 5,000 回）",function(){per.set(5000);fn.set(0);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var tp=Tp.get(),N=Nn.get(),tB=tb.get(),pd=per.get(),e=eg.get(),f=fn.get(),is=Is.get(),qp=Qp.get();
      var r=pd/86400;
      var extra=Math.floor(tB/tp),ntr=2*N-1+extra;                 /* 変化 1 つで周期的に読む回数（(c)） */
      var Ia=is+qp/(tp/1000);
      var Ib=is+r*2*e*qp+f*qp;
      var cyc=f/(1+f*N*tp/1000),Icn=cyc*(1+N)*qp;
      var Ic=is+r*2*(1+ntr)*qp+Icn;
      /* ---- 図: 1 回押したときの起き方 ---- */
      var W=700,o=[],t0=4,TE=Math.max(40,t0+tB+(2*N+2)*tp+6),x0=150,x1=684,X=function(t){return x0+t/TE*(x1-x0);};
      var bt=[];for(var i=0;i<e;i++)bt.push(t0+(e>1?tB*i/(e-1):0));
      var seq=[[0,1]];bt.forEach(function(t,i){seq.push([t,i%2===0?0:1]);});
      if(seq[seq.length-1][1]!==0)seq.push([t0+tB+0.01,0]);
      seq.push([TE,0]);
      function lev(t){var v=1;seq.forEach(function(p){if(p[0]<=t)v=p[1];});return v;}
      o.push(S.T(x0-10,30,"ピンの値","end",10,"teal",true));
      o.push(_w11_dwave(S,seq,X,22,38,"teal",1.6));
      var rows=[["(a) 周期的に読む","signal"],["(b) 割り込みだけ","alias"],["(c) 割り込み＋周期","green"]];
      var wa=[],st=0,cnt=0,pa=null;for(var t=tp/2;t<TE;t+=tp){wa.push(t);var nw=lev(t)?0:1;if(nw!==st){if(++cnt>=N&&pa===null){pa=t;st=nw;cnt=0;}}else cnt=0;}
      var wb=bt.slice(0);
      var wc=[t0],pc=null;st=0;cnt=0;var q=0;for(t=t0+tp;t<TE;t+=tp){wc.push(t);var nw2=lev(t)?0:1;if(nw2!==st){if(++cnt>=N){st=nw2;cnt=0;pc=t;}}else cnt=0;q=(cnt===0)?q+1:0;if(q>=N)break;}
      [[wa,pa],[wb,null],[wc,pc]].forEach(function(w,i){var yb=82+i*44,c=rows[i][1];
        o.push(S.T(x0-10,yb-4,rows[i][0],"end",9.5,c,true));
        o.push(S.T(x0-10,yb+9,(i===1?w[0].length+" 回（"+Math.ceil(e/2)+" 回押したと数える）":w[0].length+" 回起きる"),"end",9,"muted"));
        o.push(S.L(x0,yb,x1,yb,"faint",1));
        w[0].forEach(function(tt,j){var isr=(i===1)||(i===2&&j===0);o.push(S.RECT(X(tt)-2,yb-18,4,18,1,U.soft(isr?"gold":c),isr?"gold":c,1));});
        if(w[1]!==null){o.push(S.ARR(X(w[1]),yb+14,X(w[1]),yb+3,c,1.2,5));}
      });
      var ya=212;o.push(S.L(x0,ya,x1,ya,"muted",1));
      var stp=TE>150?50:(TE>60?20:10);
      for(t=0;t<=TE+1e-9;t+=stp){o.push(S.L(X(t),ya,X(t),ya+4,"muted",1));o.push(S.T(X(t),ya+15,t+(t+stp>TE?" ms":""),"middle",9,"muted"));}
      /* ---- 図: 平均電流（対数） ---- */
      var vals=[["(a) 周期的に読む",Ia,"signal"],["(b) 割り込みだけ",Ib,"alias"],["(c) 割り込み＋周期",Ic,"green"]];
      var lo=Math.pow(10,Math.floor(Math.log10(Math.min(is,Ia,Ib,Ic)))),hi=Math.pow(10,Math.ceil(Math.log10(Math.max(Ia,Ib,Ic)*1.01)));
      if(hi/lo<100)hi=lo*100;
      var bx0=150,bx1=560,BX=function(v){return bx0+(Math.log10(v)-Math.log10(lo))/(Math.log10(hi)-Math.log10(lo))*(bx1-bx0);};
      var yb0=246;o.push(S.T(14,yb0-6,"平均電流","start",10,"ink",true));
      vals.forEach(function(vv,i){var y=yb0+i*22;o.push(S.T(bx0-8,y+12,vv[0],"end",9.5,vv[2],true));
        o.push(S.RECT(bx0,y+2,Math.max(1,BX(vv[1])-bx0),14,2,U.soft(vv[2]),vv[2],1));
        o.push(S.T(BX(vv[1])+6,y+13,U.fmt.cur(vv[1]*1e-6)+"（"+_w11_life(vv[1])+"）","start",9.5,vv[2],true));});
      var yax=yb0+3*22+4;o.push(S.L(bx0,yax,bx1,yax,"muted",1));
      for(var dd=lo;dd<=hi*1.0001;dd*=10){o.push(S.L(BX(dd),yax,BX(dd),yax+4,"muted",1));o.push(S.T(BX(dd),yax+15,U.fmt.cur(dd*1e-6,2),"middle",9,"muted"));}
      box.set(S.svg(W,yax+24,o));
      ro.innerHTML="(a) I_s + Q_p / T_p = "+_w11_sig(is,3)+" + "+qp+" µC ÷ "+tp+" ms = <b>"+U.fmt.cur(Ia*1e-6)+"</b><br>"+
        "(b) 押すたびに "+2*e+" 回起き、"+e+" 回押したと数える"+(e>1?'（<span class="warn">数え違い</span>）':"")+(f?"。ノイズで 1 秒に "+f+" 回起きる":"")+" → <b>"+U.fmt.cur(Ib*1e-6)+"</b><br>"+
        "(c) 押して離すと 2 + "+2*ntr+" 回起きる"+(f?"。ノイズの間は T_p ごとに読み続ける（"+U.fmt.cur(Icn*1e-6)+"）":"")+" → <b>"+U.fmt.cur(Ic*1e-6)+"</b><br>"+
        "遅れ: (a)・(c) は、はね返りが終わってから N·T_p = "+N*tp+" ms まで。(b) は遅れないが、数え方が正しくない<br>"+
        "(c) が (a) より小さいのは、押す回数が 1 秒に "+_w11_sig(1/((2+2*ntr)*tp/1000),3)+" 回より少ないとき（いまは 1 日に "+Math.round(pd)+" 回）"+
        '<div class="wnote">電池は CR2032（220 mAh）とした。(c) の読む回数は、変化 1 つにつき 2N − 1 回と、はね返りの間の回数とした（3 節のコード）。ノイズのパルスは µs の幅で、周期的な読み取りにはほとんど当たらないとした。</div>';
    }
    draw();
  };

  /* ---- 4 節: ロータリーエンコーダ ---- */
  var _w11_Q=[[0,-1,1,2],[1,0,2,-1],[-1,2,0,1],[2,1,-1,0]];   /* [前][今]: 2 は読み落とし */
  function _w11_enc(R,clicks,P,n,k,tb,tp,keep){
    var dl=1000/(4*P*n),jit=(1-k)/2*dl,a=1,b=1,dir=clicks>0?1:-1,steps=Math.abs(clicks)*4,t0=2,E=[],i;
    for(var s=0;s<steps;s++){var ph=s%4,ch=dir>0?(ph%2===0?0:1):(ph%2===0?1:0),te=t0+s*dl+R.range(-jit,jit),nv;
      if(ch===0){a=1-a;nv=a;}else{b=1-b;nv=b;}
      E.push([te,ch,nv]);
      if(tb>0){var mm=R.int(4)*2,cur=nv;for(i=0;i<mm;i++){cur=1-cur;E.push([te+R.range(0,tb),ch,cur]);}if(mm)E.push([te+tb+1e-6,ch,nv]);}}
    E.sort(function(x,y){return x[0]-y[0];});
    var tend=t0+steps*dl+Math.max(5,2*tp),A=1,B=1,kk=0,prev=3,acc=0,pos=0,err=0,smp=[];
    for(var ts=R.range(0,tp);ts<tend;ts+=tp){
      while(kk<E.length&&E[kk][0]<=ts){if(E[kk][1]===0)A=E[kk][2];else B=E[kk][2];kk++;}
      var ab=(A<<1)|B,d=_w11_Q[prev][ab];prev=ab;
      if(d===2)err++;else{acc+=d;if(ab===3){if(acc>=2)pos++;else if(acc<=-2)pos--;acc=0;}}
      if(keep)smp.push([ts,ab,d]);}
    return {E:E,tend:tend,pos:pos,err:err,smp:smp,dl:dl,t0:t0};
  }
  REG.w11_encoder=function(el,U){
    var S=U.S,seed=1;
    U.head(el,"ENCODER","ロータリーエンコーダを読む速さと、読み落とし");
    var r1=U.ctrls(el);
    var sp=U.slider(r1,"回す速さ n",{min:0.1,max:10,value:2,log:true,fmt:function(v){return v+" 回転/s";},onInput:draw});
    var Pc=U.slider(r1,"1 回転のクリックの数 P",{values:[12,15,18,20,24,30],value:20,fmt:function(v){return v+" クリック";},onInput:draw});
    var Tp=U.slider(r1,"読む周期 T_p",{min:0.1,max:20,value:1,log:true,fmt:function(v){return v+" ms";},onInput:draw});
    var r2=U.ctrls(el);
    var tb=U.slider(r2,"はね返り t_B",{values:[0,0.2,0.5,1,2,3],value:1,fmt:function(v){return v+" ms";},onInput:draw});
    var kk=U.slider(r2,"最も短い間隔の割合 k",{values:[0.3,0.5,0.7,1],value:0.5,fmt:function(v){return String(v);},onInput:draw});
    var cl=U.slider(r2,"回す量",{values:[1,2,3,5,10],value:3,fmt:function(v){return v+" クリック";},onInput:draw});
    var dir=U.select(r2,"向き",["右","左"],0,draw);
    var br=U.btnrow(el);
    U.button(br,"4 節の例（1 ms で読む）",function(){sp.set(2);Pc.set(20);Tp.set(1);tb.set(1);kk.set(0.5);cl.set(3);draw();});
    U.button(br,"遅すぎる（5 ms で読む）",function(){sp.set(2);Pc.set(20);Tp.set(5);tb.set(1);kk.set(0.5);cl.set(10);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var n=sp.get(),P=Pc.get(),tp=Tp.get(),t_b=tb.get(),k=kk.get(),C=cl.get()*(dir.get()===0?1:-1);
      var res=_w11_enc(U.rng(seed*104729+1),C,P,n,k,t_b,tp,true);
      var bound=k*res.dl-t_b;
      /* 40 回の試し */
      var bad=0,errn=0;for(var tr=0;tr<40;tr++){var q=_w11_enc(U.rng(seed*7+tr*131+3),C,P,n,k,t_b,tp,false);if(q.pos!==C)bad++;if(q.err)errn++;}
      /* ---- 図 ---- */
      var W=700,o=[],nshow=Math.min(Math.abs(C)*4,8),TE=res.t0+nshow*res.dl+res.dl*0.8,x0=70,x1=684,X=function(t){return x0+t/TE*(x1-x0);};
      [[0,30,"A"],[1,74,"B"]].forEach(function(r){var pts=[[0,1]];res.E.forEach(function(e){if(e[1]===r[0]&&e[0]<=TE)pts.push([e[0],e[2]]);});pts.push([TE,pts[pts.length-1][1]]);
        o.push(S.T(x0-10,r[1]+14,r[2],"end",11,"teal",true));o.push(_w11_dwave(S,pts,X,r[1],r[1]+20,"teal",1.6));});
      var inwin=res.smp.filter(function(s){return s[0]<=TE;});
      var showSym=inwin.length<=60;
      inwin.forEach(function(s){var c=s[2]===2?"alias":"signal";o.push(S.L(X(s[0]),26,X(s[0]),98,c,s[2]===2?1.2:0.7,"2 2"));o.push(S.D(X(s[0]),112,c,s[2]===2?3.6:2.4));
        if(showSym&&s[2]!==0)o.push(S.T(X(s[0]),130,s[2]===2?"×":(s[2]>0?"+1":"−1"),"middle",9,s[2]===2?"alias":(s[2]>0?"signal":"purple"),true));});
      o.push(S.T(x0-10,116,"読む","end",9.5,"signal",true));
      if(!showSym)o.push(S.T(x0,130,"読む点が多いので、記号は省いた（× だけ赤で示す）","start",9,"muted"));
      var ya=148;o.push(S.L(x0,ya,x1,ya,"muted",1));
      var step=U.nice(0,TE,6);step.forEach(function(t){o.push(S.L(X(t),ya,X(t),ya+4,"muted",1));o.push(S.T(X(t),ya+15,U.sig(t,3),"middle",9,"muted"));});
      o.push(S.T(x1,ya+30,"時間 [ms]（最初の "+(nshow/4)+" クリック分）","end",9,"muted"));
      box.set(S.svg(W,ya+38,o));
      ro.innerHTML="変化の間隔: 理想で 1 / (4Pn) = "+_w11_sig(res.dl,3)+" ms、最も短くて "+_w11_sig(k*res.dl,3)+" ms。読み落とさない条件 T_p < k / (4Pn) − t_B = <b>"+(bound>0?_w11_sig(bound,3)+" ms":"なし（はね返りが間隔より長い）")+"</b> → いまの T_p = "+_w11_sig(tp,3)+" ms は "+(tp<bound?'<span class="ok">満たす</span>':'<span class="warn">満たさない</span>')+"<br>"+
        "この 1 回: 本当は "+C+"、数えたのは <b>"+res.pos+"</b>、× は <b>"+res.err+" 回</b>"+(res.pos===C?' <span class="ok">正しい</span>':' <span class="warn">数え違い</span>')+"<br>"+
        "乱数を変えて 40 回試すと、数え違い <b>"+bad+" 回</b>、× を含む <b>"+errn+" 回</b><br>"+
        "1 秒に読む回数 "+_w11_sig(1000/tp,3)+" 回: 電池の機器で読み続けると、1 回 0.09 µC なら "+U.fmt.cur((2+0.09*1000/tp)*1e-6)+"（回している間だけ読む）"+
        '<div class="wnote">1 クリックで 4 回変わり、クリックの位置で (A, B) = 11 になる製品とした。各変化の時刻は、最も短い間隔が理想の k 倍になる範囲で乱数でずらし、はね返りは変化の後 t_B の間に 0〜3 往復するとした。読み取りの時刻のずれも乱数にした。</div>';
    }
    draw();
  };

  /* ---- 5 節: 長い線の誘導ノイズ ---- */
  REG.w11_noise=function(el,U){
    var S=U.S,VDD=3.3;
    U.head(el,"COUPLING","長い線に入る誘導ノイズと、プルアップ・RC・デバウンス");
    var r1=U.ctrls(el);
    var Rp=U.slider(r1,"プルアップ R_p",{values:[1,2.2,4.7,10,22,47,100],value:47,fmt:function(v){return v+" kΩ";},onInput:draw});
    var Cm=U.slider(r1,"線の間の容量 C_m",{values:[10,22,47,100,220,470],value:100,fmt:function(v){return v+" pF";},onInput:draw});
    var Cg=U.slider(r1,"線の容量 C_g",{values:[100,200,500,1000,2000],value:500,fmt:function(v){return v+" pF";},onInput:draw});
    var r2=U.ctrls(el);
    var dV=U.slider(r2,"相手の線の電圧の変化 ΔV",{values:[5,12,24,48,100,141],value:24,fmt:function(v){return v+" V";},onInput:draw});
    var tr=U.slider(r2,"変化にかかる時間 t_r",{min:0.05,max:20,value:0.5,log:true,fmt:function(v){return v+" µs";},onInput:draw});
    var r3=U.ctrls(el);
    var flt=U.checkbox(r3,"ピンの前に R_s 1 kΩ と C_f",false,draw);
    var Cf=U.slider(r3,"C_f",{values:[1,10,100,1000],value:100,fmt:function(v){return v+" nF";},onInput:draw});
    var Tp=U.slider(r3,"読む周期 T_p",{values:[1,2,5,10],value:5,fmt:function(v){return v+" ms";},onInput:draw});
    var Nn=U.slider(r3,"続けて読む回数 N",{min:2,max:6,step:1,value:3,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"5 節の例（47 kΩ）",function(){Rp.set(47);Cm.set(100);Cg.set(500);dV.set(24);tr.set(0.5);flt.set(false);draw();});
    U.button(br,"プルアップを 4.7 kΩ に",function(){Rp.set(4.7);flt.set(false);draw();});
    U.button(br,"保護の回路（4.7 kΩ・1 kΩ・100 nF）",function(){Rp.set(4.7);flt.set(true);Cf.set(100);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var rp=Rp.get()*1e3,cm=Cm.get()*1e-12,cg=Cg.get()*1e-12,dv=dV.get(),t_r=tr.get()*1e-6,f=flt.get(),cf=Cf.get()*1e-9,Rs=1e3,tp=Tp.get(),N=Nn.get();
      var Cl=cm+cg,Sv=dv/t_r,tauL=(f?(rp*Rs/(rp+Rs)):rp)*Cl,tauP=f?(rp+Rs)*cf:0;
      var TE=Math.min(0.05,Math.max(8*tauL,3*t_r,f?6*Math.min(tauP,Rs*cf*20):0));
      /* 後退オイラーで 2 つの点（線とピン）を解く */
      var vl=VDD,vp=VDD,t=0,dt=Math.min(t_r,tauL)/25,pts=[],minL=VDD,minP=VDD,belowL=[null,null],belowP=[null,null];
      var vih=0.7*VDD,vil=0.3*VDD;
      pts.push([0,vl,vp]);
      var guard=0;
      while(t<TE&&guard<200000){guard++;
        var h=dt,tn=t+h,sl=(tn<=t_r)?-Sv:((t<t_r)?-Sv*(t_r-t)/h:0);
        if(!f){var a=Cl/h+1/rp;vl=(Cl*vl/h+cm*sl+VDD/rp)/a;vp=vl;}
        else{var a11=Cl/h+1/rp+1/Rs,a12=-1/Rs,b1=Cl*vl/h+cm*sl+VDD/rp,a21=-1/Rs,a22=cf/h+1/Rs,b2=cf*vp/h,det=a11*a22-a12*a21;
          var nl=(b1*a22-a12*b2)/det,np=(a11*b2-a21*b1)/det;vl=nl;vp=np;}
        vl=Math.max(vl,-0.6);vp=Math.max(vp,-0.6);
        t=tn;pts.push([t,vl,vp]);
        if(vl<minL)minL=vl;if(vp<minP)minP=vp;
        if(vl<vih){if(belowL[0]===null)belowL[0]=t;belowL[1]=t;}
        if(vp<vih){if(belowP[0]===null)belowP[0]=t;belowP[1]=t;}
        if(t>2*t_r)dt=Math.min(dt*1.03,TE/1500);}
      var durL=belowL[0]===null?0:belowL[1]-belowL[0],durP=belowP[0]===null?0:belowP[1]-belowP[0];
      /* ---- 図: 時間は対数目盛 ---- */
      var W=700,o=[],t0=Math.min(t_r/10,1e-8),p=U.plot(80,20,520,190,[t0,TE],[-1,3.6],{xlog:true});
      var xt=[];for(var e=Math.ceil(Math.log10(t0));e<=Math.floor(Math.log10(TE));e++)xt.push(Math.pow(10,e));
      o.push(p.axes({xl:"相手の線が下がり始めてからの時間（対数目盛）",yl:"電圧 [V]",xt:xt,yt:[0,1,2,3],xfmt:function(v){return U.fmt.time(v,1);},yfmt:function(v){return String(v);}}));
      o.push(S.L(p.X(t0),p.Y(vih),p.X(TE),p.Y(vih),"green",1,"5 3"));o.push(S.T(p.x+p.w+6,p.Y(vih)+4,"V_IH","start",9.5,"green",true));
      o.push(S.L(p.X(t0),p.Y(vil),p.X(TE),p.Y(vil),"gold",1,"5 3"));o.push(S.T(p.x+p.w+6,p.Y(vil)+4,"V_IL","start",9.5,"gold",true));
      var sel=pts.filter(function(q){return q[0]>=t0;});
      o.push(p.line(sel.map(function(q){return [q[0],q[1]];}),"alias",2));
      if(f)o.push(p.line(sel.map(function(q){return [q[0],q[2]];}),"signal",2.2));
      o.push(S.L(p.x+p.w+6,150,p.x+p.w+22,150,"alias",2));o.push(S.T(p.x+p.w+26,154,"線","start",9.5,"alias",true));
      if(f){o.push(S.L(p.x+p.w+6,168,p.x+p.w+22,168,"signal",2.2));o.push(S.T(p.x+p.w+26,172,"ピン","start",9.5,"signal",true));}
      box.set(S.svg(W,260,o));
      var upk=VDD-minL,form=rp*cm*Sv*(1-Math.exp(-t_r/(rp*Cl))),div=dv*cm/Cl;
      var pinDur=f?durP:durL,pinMin=f?minP:minL;
      var h2="線の下がり幅 <b>"+_w11_sig(Math.min(upk,VDD+0.6),3)+" V</b>"+(f?"":"（式 R·C_m·S·(1 − e^(−t_r/τ)) = "+_w11_sig(form,3)+" V、容量の分圧の上限 "+_w11_sig(div,3)+" V）")+"、戻る時定数 τ = "+U.fmt.time(tauL)+(upk>VDD+0.59?"（−0.6 V で保護ダイオードが止める）":"")+"<br>";
      h2+="ピンの電圧の最低 <b>"+_w11_sig(pinMin,3)+" V</b>、H と読めない時間（V_IH を下回る間） <b>"+(pinDur>0?U.fmt.time(pinDur):"0")+"</b><br>";
      h2+="割り込み（変化で起こす）: "+(pinMin<vih?'<span class="warn">入りうる</span>（ノイズのたびに起きる）':'<span class="ok">入らない</span>')+"<br>";
      var hit=Math.min(1,pinDur/(tp*1e-3));
      h2+="周期的に読む（T_p = "+tp+" ms、N = "+N+"）: 1 回の変化で読み取りに当たる確率 "+_w11_sig(hit*100,2)+" %、"+(pinDur>=(N-1)*tp*1e-3?'<span class="warn">N 回続けて当たりうる（押したと読むおそれ）</span>':'<span class="ok">N 回続けては当たらないので、押したとは読まない</span>');
      ro.innerHTML=h2+'<div class="wnote">スイッチが開いている線を、プルアップ R_p・線の容量 C_g・相手の線との容量 C_m の回路とし、相手の線の電圧が t_r の間に一定の速さで ΔV 下がるとした（静電誘導だけ。電磁誘導は含めない）。電源の電圧は 3.3 V、V_IH = 0.7 V_DD、V_IL = 0.3 V_DD。保護ダイオードは −0.6 V で電圧を止める理想のものとした。</div>';
    }
    draw();
  };
