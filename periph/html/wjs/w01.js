  /* ===== 01 章 電源と周辺制御の全体像 ===== */
  /* 動作の例（代表値）: 名前, 説明, 電流 [mA], 時間 [ms], 色 */
  var _w01_OPS=[
    ["処理","起きて計算する",3,4,"signal"],
    ["測定","センサの電源を入れて測る",1,20,"teal"],
    ["送信","無線でデータを送る",10,3,"gold"],
    ["LED","LED を点ける",5,20,"purple"],
    ["モータ","小さなモータを回す",150,300,"alias"]];
  /* 電池の例（代表値）: 名前, 電流を流していないときの電圧 [V], 容量 [mAh], 内部抵抗 [Ω] */
  var _w01_BAT=[
    ["CR2032（コイン形リチウム電池）",3.0,220,20],
    ["単 3 形アルカリ電池 2 本の直列（2000 mAh として）",3.0,2000,0.4],
    ["リチウムイオン電池 1 本（1000 mAh として）",3.7,1000,0.15]];
  function _w01_life(h,U){var d=h/24;return d>=365?U.sig(d/365,3)+" 年":(d>=1?U.sig(d,3)+" 日":U.sig(h,3)+" 時間");}

  /* ---- 4 節: 動作の並びと、平均電流・ピーク電流・電池寿命 ---- */
  REG.w01_profile=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"PROFILE","動作の並びと、平均電流・ピーク電流・電池寿命");
    var r0=U.ctrls(el),on=[];
    _w01_OPS.forEach(function(o,i){on.push(U.checkbox(r0,o[0]+"（"+o[2]+" mA × "+o[3]+" ms）",i===0||i===2,draw));});
    var r1=U.ctrls(el);
    var mode=U.select(r1,"動かし方",["順に動かす","同時に始める（電流が重なる）"],0,draw);
    var Tp=U.slider(r1,"周期 T（何秒ごとに起きるか）",{min:1,max:86400,value:60,log:true,fmt:function(v){return F.time(v);},onInput:draw});
    var Is=U.slider(r1,"眠りの電流",{min:0.5,max:100,value:2,log:true,fmt:function(v){return F.cur(v*1e-6);},onInput:draw});
    var r2=U.ctrls(el);
    var bat=U.select(r2,"電池",_w01_BAT.map(function(b){return b[0];}),0,function(){Rin.set(_w01_BAT[bat.get()][3]);draw();});
    var Rin=U.slider(r2,"電池の内部抵抗",{min:0.05,max:200,value:20,log:true,fmt:function(v){return U.sig(v,3)+" Ω";},onInput:draw});
    var Vmin=U.slider(r2,"マイコンが動ける最低の電圧",{min:1.6,max:3.4,step:0.1,value:2.2,fmt:function(v){return v.toFixed(1)+" V";},onInput:draw});
    var br=U.btnrow(el);
    function preset(ops,m,T,b,R){ops.forEach(function(v,i){on[i].set(v);});mode.set(m);Tp.set(T);Is.set(2);bat.set(b);Rin.set(R);Vmin.set(2.2);draw();}
    U.button(br,"4 節の例（ドアの開閉センサ）",function(){preset([1,0,1,0,0],0,60,0,20);});
    U.button(br,"扉が開いた（LED と送信を同時に、60 Ω）",function(){preset([0,0,1,1,0],1,60,0,60);});
    U.button(br,"同じものを順に",function(){preset([0,0,1,1,0],0,60,0,60);});
    U.button(br,"コイン電池でモータを回す",function(){preset([1,0,0,0,1],0,3600,0,20);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var ops=[];_w01_OPS.forEach(function(o,i){if(on[i].get())ops.push({n:o[0],I:o[2]*1e-3,t:o[3]*1e-3,c:o[4]});});
      var seqm=mode.get()===0,T=Tp.get(),is=Is.get()*1e-6,B=_w01_BAT[bat.get()],E=B[1],cap=B[2],R=Rin.get(),vm=Vmin.get();
      /* 並べ方: 順なら次々に、同時なら全部 0 から（長いものを下に積む） */
      var t=0;
      if(seqm)ops.forEach(function(o){o.s=t;t+=o.t;});
      else{ops.sort(function(a,b){return b.t-a.t;});ops.forEach(function(o){o.s=0;});}
      var L=seqm?t:(ops.length?ops[0].t:0),warn="";
      if(L>T){warn='<span class="warn">動作の時間の合計が周期より長い。周期を '+F.time(L)+' にして計算した。</span><br>';T=L;}
      /* 電流の折れ点 */
      var ts=[0,L];ops.forEach(function(o){ts.push(o.s,o.s+o.t);});ts=ts.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
      function Iat(x){var s=0;ops.forEach(function(o){if(x>=o.s-1e-12&&x<o.s+o.t-1e-12)s+=o.I;});return s;}
      var Ipk=is;ts.forEach(function(x){Ipk=Math.max(Ipk,Iat(x));});
      var Qa=0;ops.forEach(function(o){Qa+=o.I*o.t;});
      var Qs=is*(T-L),Q=Qa+Qs,Iavg=Q/T,lifeH=cap*1e-3/Iavg,Vpk=Math.max(0,E-Ipk*R);
      /* ---- 図 ---- */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,W=nar?380:700,o=[],x0=62,wd=nar?300:330,span=Math.max(L,1e-3)*1.08;
      var yI=26,hI=110,Imax=Math.max(Ipk*1.18,1e-3);
      var X=function(s){return x0+s/span*wd;},YI=function(i){return yI+hI-i/Imax*hI;};
      o.push(S.T(10,14,"起きている間の電流","start",10.5,"ink",true));
      o.push(S.W([x0,yI,x0,yI+hI,x0+wd,yI+hI],"muted",1.1));
      U.nice(0,Imax*1e3,4).forEach(function(v){if(v<=Imax*1e3+1e-9){o.push(S.L(x0-4,YI(v*1e-3),x0,YI(v*1e-3),"muted",1));o.push(S.T(x0-7,YI(v*1e-3)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-40,yI+hI/2,"電流 [mA]","middle",9.5,"muted",false,false,-90));
      if(!ops.length)o.push(S.T(x0+wd/2,yI+hI/2,"動作を 1 つ以上選ぶと表示される","middle",10,"muted"));
      var base=0;
      ops.forEach(function(op){var b0=seqm?0:base;
        o.push(S.RECT(X(op.s),YI(b0+op.I),Math.max(1,X(op.s+op.t)-X(op.s)),YI(b0)-YI(b0+op.I),0,U.soft(op.c),op.c,1));
        var wpx=X(op.s+op.t)-X(op.s),hpx=YI(b0)-YI(b0+op.I);
        if(wpx>30&&hpx>13)o.push(S.T((X(op.s)+X(op.s+op.t))/2,(YI(b0)+YI(b0+op.I))/2+4,op.n,"middle",9.5,op.c,true));
        if(!seqm)base+=op.I;});
      o.push(S.L(x0,YI(Ipk),x0+wd,YI(Ipk),"alias",1,"4 3"));
      o.push(S.T(x0+wd,YI(Ipk)-4,"ピーク "+F.cur(Ipk),"end",9.5,"alias",true,false,null,true));
      var ax=yI+hI;U.nice(0,span*1e3,5).forEach(function(v){if(v*1e-3<=span){o.push(S.L(X(v*1e-3),ax,X(v*1e-3),ax+4,"muted",1));o.push(S.T(X(v*1e-3),ax+15,U.sig(v,4),"middle",9,"muted"));}});
      o.push(S.T(x0+wd,ax+28,"時間 [ms]","end",9,"muted"));
      /* 電池の電圧 */
      var yV=yI+hI+50,hV=90,vlo=Math.max(0,Math.min(Vpk,vm)-0.3),vhi=E+0.15,YV=function(v){return yV+hV-(v-vlo)/(vhi-vlo)*hV;};
      o.push(S.T(10,yV-8,"電池の電圧 = "+E.toFixed(1)+" V − 電流 × 内部抵抗","start",10.5,"ink",true));
      o.push(S.W([x0,yV,x0,yV+hV,x0+wd,yV+hV],"muted",1.1));
      U.nice(vlo,vhi,4).forEach(function(v){if(v>=vlo-1e-9&&v<=vhi+1e-9){o.push(S.L(x0-4,YV(v),x0,YV(v),"muted",1));o.push(S.T(x0-7,YV(v)+3.5,U.sig(v,3),"end",9,"muted"));}});
      o.push(S.T(x0-40,yV+hV/2,"電圧 [V]","middle",9.5,"muted",false,false,-90));
      var pv=[];for(var k=0;k<ts.length-1;k++){var a=ts[k],b=ts[k+1],v=Math.max(0,E-Iat(a)*R);pv.push([X(a),YV(v)],[X(b),YV(v)]);}
      pv.push([X(L),YV(E)],[X(span),YV(E)]);
      if(ops.length)o.push(S.PL(pv,"gold",2));
      o.push(S.L(x0,YV(vm),x0+wd,YV(vm),"alias",1.2,"5 3"));
      o.push(S.T(x0+wd,YV(vm)+12,"最低の電圧 "+vm.toFixed(1)+" V","end",9,"alias",false,false,null,true));
      /* 右: 1 周期の電荷の内訳 */
      var bx=nar?10:450,by=nar?yV+hV+50:0,bw=nar?340:230,parts=[["眠り",Qs,"muted"]];ops.slice().sort(function(a,b){return a.s-b.s;}).forEach(function(op){parts.push([op.n,op.I*op.t,op.c]);});
      o.push(S.T(bx,by+14,"1 周期の電荷の内訳","start",10.5,"ink",true));
      var xx=bx;parts.forEach(function(p){var w=bw*p[1]/Q;o.push(S.RECT(xx,by+24,Math.max(w,0.6),22,2,U.soft(p[2]),p[2],1));xx+=w;});
      parts.forEach(function(p,i){var yy=by+66+i*17;o.push(S.RECT(bx,yy-9,10,10,2,U.soft(p[2]),p[2],1));
        o.push(S.T(bx+16,yy,p[0]+" "+U.sig(p[1]*1e6,3)+" µC（"+U.sig(p[1]/Q*100,3)+" %）","start",9.5,p[2]==="muted"?"ink":p[2]));});
      var ys=by+66+parts.length*17+14;
      o.push(S.T(bx,ys,"平均電流 "+F.cur(Iavg),"start",11,"ink",true));
      o.push(S.T(bx,ys+18,"ピーク電流 "+F.cur(Ipk),"start",11,"alias",true));
      o.push(S.T(bx,ys+36,"電池寿命 "+_w01_life(lifeH,U),"start",11,"ink",true));
      var low=Vpk<vm;
      o.push(S.T(bx,ys+54,"ピークの電圧 "+Vpk.toFixed(2)+" V"+(low?"（下回る）":""),"start",11,low?"alias":"green",true));
      box.set(S.svg(W,nar?ys+64:yV+hV+36,o));
      var terms=ops.slice().sort(function(a,b){return a.s-b.s;}).map(function(op){return F.cur(op.I)+" × "+F.time(op.t);});
      ro.innerHTML=warn+"1 周期の電荷 Q = Σ I_k t_k = "+(terms.length?terms.join(" + ")+" + ":"")+F.cur(is)+" × "+F.time(T-L,4)+" = <b>"+U.sig(Q*1e6,4)+" µC</b><br>"+
        "平均電流 I_avg = Q ÷ T = "+U.sig(Q*1e6,4)+" µC ÷ "+F.time(T)+" = <b>"+F.cur(Iavg)+"</b>（眠りの分 "+U.sig(Qs/Q*100,3)+" %）<br>"+
        "電池寿命 = "+cap+" mAh ÷ "+F.cur(Iavg)+" ≈ <b>"+U.fmt.int(lifeH)+" 時間（"+_w01_life(lifeH,U)+"）</b><br>"+
        "ピーク電流 I_pk = <b>"+F.cur(Ipk)+"</b> → 電池の電圧 ≈ "+E.toFixed(1)+" V − "+F.cur(Ipk)+" × "+U.sig(R,3)+" Ω = <b>"+Vpk.toFixed(2)+" V</b> → "+
        (Vpk<=0.05?'<span class="warn">電池の電圧が 0 V 近くまで下がる計算になる。実際には、この電池からこの電流は流せない。</span>':
         low?'<span class="warn">最低の電圧 '+vm.toFixed(1)+' V を下回り、マイコンはリセットされる</span>':'<span class="ok">最低の電圧 '+vm.toFixed(1)+' V を下回らない</span>')+
        '<div class="wnote">電流と時間は代表値の例。起きている間の電流は、各動作の間の機器全体の電流とし、眠りの電流は起きている間に足していない。容量は電池に表示された値で計算した（温度・電流・自己放電で、実際の寿命は短くなる。03 章）。電池の電圧は、電流を流していないときの電圧から、電流 × 内部抵抗だけ下がるとした（02・03 章）。</div>';
    }
    draw();
  };

  /* ---- 6 節: 使用条件から、気をつけることと読む章 ---- */
  /* 項目: [条件の関数, 気をつけること, 何が起きるか, マイコンでする制御, 章（"s4" "s5" はこの章の節）] */
  var _w01_ITEMS=[
    [function(s){return s.bat;},"平均電流と電池寿命","電池の電荷は限られ、平均電流で何年もつかが決まる","間欠動作にして、眠る時間を長くする",["s4","07"]],
    [function(s){return s.bat;},"ピーク電流と電池の電圧","送信やモータの瞬間に電池の電圧が下がり、マイコンがリセットすることがある","大きな動作を重ねない。コンデンサでピークを助ける",["s4","03","04"]],
    [function(s){return s.bat;},"電池が尽きるとき","電池の電圧が下がりきる前に、マイコンが動けなくなる","負荷をかけた状態で電圧を測り、尽きる前に記録して止まる",["04","05"]],
    [function(s){return s.pw===1||s.pw===6;},"充電と過放電","決まった電流と電圧で充電する。使いすぎると電池を傷める","充電の状態を読み、温度が範囲の外なら充電を止める",["04"]],
    [function(s){return s.pw===2||s.pw===3;},"取り出せる電流の上限","USB や AC アダプタには、取り出してよい電流の上限がある","大きな動作を重ねない。周辺の電源をゆっくり入れる",["02","05"]],
    [function(s){return s.pw===2||s.pw===3;},"抜き差しと電源の途切れ","いつ抜かれるか分からない","電源の電圧を見張り、書き込みの途中で切れても壊れないようにする",["02","05"]],
    [function(s){return s.pw===4;},"感電と火災","非絶縁の回路は、商用電源と同じ電位になる","（マイコンでは守れない）絶縁を回路と筐体で決める。通電中の回路に PC やデバッガを直接つながない",["02","06"]],
    [function(s){return s.pw===4;},"停電と復電","電源が途切れ、また戻る","停電を見つけて後始末し、危険な動作を自動で再開しない",["06"]],
    [function(s){return s.pw===4;},"サージと待機電力","雷などで大きな電圧が入る。使っていない間も電力を使う","異常を記録する。待機中に止めるものを決める",["06"]],
    [function(s){return s.pw===5;},"電源の電圧の大きな変動","エンジンの始動で下がり、一時的に大きく上がることもある","電源の電圧を見張り、下がったら大きな動作を止める",["02","05"]],
    [function(s){return s.pw===5;},"駐車中の電流","エンジンを止めている間も、車の電池から電流を取り続ける","駐車中は眠り、電流を小さくする",["07"]],
    [function(s){return s.pw===6;},"入る電力と使う電力の釣り合い","取れる電力が小さく、天気や時刻で変わる","蓄えた電荷に合わせて、起きる間隔を変える",["02"]],
    [function(s){return s.L[0];},"センサの電源と測り方","測る間だけ電源を入れる。値は基準電圧やノイズでずれる","電源を入れて安定を待ってから測り、平均する。故障を調べる",["08","09","10"]],
    [function(s){return s.L[1];},"送信のピーク電流","送信の瞬間に数 mA〜数百 mA（方式による）が流れる","ほかの大きな動作と重ねない",["s4","04"]],
    [function(s){return s.L[2];},"チャタリングと長い配線","スイッチは押した瞬間に何度も入り切りする。長い配線は静電気やノイズを拾う","時間をおいて読み直して確かめる。入力を保護する",["11"]],
    [function(s){return s.L[3];},"LED の電流と明るさ","抵抗で電流を決める。電池の電圧が下がると暗くなる","PWM で明るさを決める",["12"]],
    [function(s){return s.L[4];},"切ったときの電圧の跳ね上がり","コイルの電流を切ると、大きな電圧が出る","保護のダイオードを付ける。保持の電流を下げる",["12"]],
    [function(s){return s.L[5];},"起動電流と止め方","回り始めに大きな電流が流れ、電源の電圧が下がる","ゆっくり加速する。電流を測って、回らないまま電流が流れ続けるのを見つける",["12","13","15"]],
    [function(s){return s.L[6];},"位置のずれと、動くときの電流","急に加速すると回りきれずに位置がずれる。動くときに大きな電流が流れる","加速と減速をなめらかにする。止まっている間の電流を下げる",["13"]],
    [function(s){return s.L[7];},"過熱","入ったままだと過熱し、火災になる","安全な状態（切）を回路で決め、マイコンに頼らない保護を置く",["s5","14","15"]],
    [function(s){return s.L[7];},"温度の制御","センサの遅れで、温度が目標を行き過ぎる","オンオフ制御や PID 制御で、加える電力を決める",["14"]],
    [function(s){return s.L[7]&&s.pw===4;},"AC のヒータの入れ切り","入れ切りの瞬間に大きな電流やノイズが出る","交流の電圧が 0 の瞬間に合わせて入れ切りする",["06","14"]],
    [function(s){return s.E[0]&&s.bat;},"低温の電池","取り出せる電荷が減り、内部抵抗が大きくなって電圧が下がりやすい","寒いときは大きな動作を減らす",["03","04"]],
    [function(s){return s.E[1];},"部品の温度","周りが暑いと、レギュレータやスイッチの発熱で、さらに温度が上がる","温度を見張り、出力を下げる",["14"]],
    [function(s){return s.E[2];},"静電気・雷・ノイズ","長い配線は、静電気・誘導・雷の電圧を拾う","入力を保護し、値を確かめてから使う",["06","11"]],
    [function(s){return s.U[0];},"眠らせ方と漏れ電流","眠っている間の電流が、平均電流の大部分になりやすい","眠る前にピンと周辺を整え、深く眠る",["05","07"]],
    [function(s){return s.U[1];},"何年も保守しない","電池寿命が足りるか、故障に気づけるかが問われる","平均電流を見積もる。センサの故障を調べる",["s4","10"]],
    [function(s){return s.U[2]||s.L[7];},"安全な状態","リセット・停電・プログラムの停止のとき、アクチュエータが危険な状態のままになりうる","安全な状態を決めて回路で保証し、ウォッチドッグで見張る",["s5","15"]],
    [function(){return true;},"マイコンの電源","電源の電圧が下がると、マイコンはリセットされる","電源の電圧を見張り、リセットする電圧を決める",["05"]]];
  var _w01_SEC={s4:["#平均電流とピーク電流","4 節"],s5:["#安全な状態という考え方","5 節"]};
  var _w01_TITLES=["全体像","電源の種類","電池を知る","電池の制御","電源まわり","AC 電源","眠らせ方","センサ","アナログ値","測り方","スイッチ","出力","モータ","熱","異常","設計ガイド"];

  REG.w01_check=function(el,U){
    var S=U.S;
    U.head(el,"CHECK","使用条件から、気をつけることと読む章");
    var r1=U.ctrls(el);
    var pw=U.select(r1,"電源",["一次電池（交換する）","二次電池（充電する）","USB","AC アダプタ","商用電源に直結","車の電源","太陽電池などの環境発電"],0,draw);
    var r2=U.ctrls(el),L=[];
    ["センサ","無線","スイッチ・ボタン","LED","リレー・ソレノイド","DC モータ","ステッピング・サーボ","ヒータ"].forEach(function(t){L.push(U.checkbox(r2,t,false,draw));});
    var r3=U.ctrls(el),E=[],Us=[];
    ["0 °C より寒くなる","40 °C より暑くなる","屋外・長い配線"].forEach(function(t){E.push(U.checkbox(r3,t,false,draw));});
    var r4=U.ctrls(el);
    ["ほとんど眠って間欠で動く","何年も保守しない","止まると危険・人のそばで動く"].forEach(function(t){Us.push(U.checkbox(r4,t,false,draw));});
    var br=U.btnrow(el);
    function preset(p,l,e,u){pw.set(p);L.forEach(function(c,i){c.set(l.indexOf(i)>=0);});E.forEach(function(c,i){c.set(e.indexOf(i)>=0);});Us.forEach(function(c,i){c.set(u.indexOf(i)>=0);});draw();}
    U.button(br,"ドアの開閉センサ",function(){preset(0,[1,2,3],[],[0,1]);});
    U.button(br,"電気ファンヒータ",function(){preset(4,[0,5,7],[],[2]);});
    U.button(br,"USB の測定器",function(){preset(2,[0,3],[],[]);});
    U.button(br,"屋外の気象計",function(){preset(6,[0,1],[0,1,2],[0,1]);});
    U.button(br,"車の記録計",function(){preset(5,[3],[0,1],[]);});
    var box=U.svgbox(el); var ro=U.readout(el);
    function link(c){if(_w01_SEC[c])return '<a href="'+_w01_SEC[c][0]+'">'+_w01_SEC[c][1]+'</a>';return '<a href="'+c+'.html">'+c+'</a>';}
    function draw(){
      var s={pw:pw.get(),L:L.map(function(c){return c.get();}),E:E.map(function(c){return c.get();}),U:Us.map(function(c){return c.get();})};
      s.bat=s.pw===0||s.pw===1||s.pw===6;
      var hits=_w01_ITEMS.filter(function(it){return it[0](s);}),cnt={};
      hits.forEach(function(it){it[4].forEach(function(c){if(!_w01_SEC[c])cnt[c]=(cnt[c]||0)+1;});});
      cnt["16"]=(cnt["16"]||0)+1;
      /* 章の札 */
      var nar=box.el.clientWidth>0&&box.el.clientWidth<520,nc=nar?4:8,W=nar?360:700,o=[],cw=(W-20)/nc,ch=38,x0=10,PC=function(n){return n<=7?"gold":n<=11?"teal":n<=14?"purple":"green";};
      o.push(S.T(x0,14,nar?"読む章（右上の数は、挙げた項目の数）":"読む章（色の付いた札。右上の数は、その章を挙げた項目の数）","start",10.5,"ink",true));
      for(var n=1;n<=16;n++){var k=(n<10?"0":"")+n,x=x0+((n-1)%nc)*cw,y=24+Math.floor((n-1)/nc)*(ch+6),c=PC(n),hit=cnt[k]||n===1;
        o.push(S.RECT(x+1,y,cw-5,ch,5,hit?U.soft(c):"var(--screen)",hit?c:"line",hit?1.6:1));
        o.push(S.T(x+8,y+16,k,"start",11,hit?c:"faint",true,true));
        o.push(S.T(x+8,y+31,_w01_TITLES[n-1],"start",9.5,hit?"ink":"faint"));
        var tag=n===1?"この章":(n===16?"まとめ":(cnt[k]?"×"+cnt[k]:""));
        if(tag)o.push(S.T(x+cw-10,y+16,tag,"end",9.5,c,true));}
      box.set(S.svg(W,24+(16/nc)*(ch+6),o));
      var rows=hits.map(function(it){return ['<b>'+it[1]+'</b>',it[2],it[3],it[4].map(link).join("・")];});
      ro.innerHTML="当てはまる項目 <b>"+hits.length+"</b> 個"+U.tbl(["気をつけること","何が起きるか","マイコンでする制御","読む章"],rows,["wrap","wrap","wrap","left"])+
        '<div class="wnote">項目と章は目安である。どの機器も、16 章で条件ごとの手順を確かめる。商用電源を扱う回路は、感電と火災の危険があるので、安全規格・法令・資格を確かめること（06 章）。</div>';
    }
    draw();
  };
