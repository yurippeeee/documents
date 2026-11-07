  /* ===== 03 章 一次遅れの応答 ===== */
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w03_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w03_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  function _w03_sig(v,d){d=d||3;if(v===0)return "0";if(!isFinite(v))return v>0?"∞":"−∞";var a=Math.abs(v);
    var s=a>=Math.pow(10,d)?String(Math.round(v)):(+v.toPrecision(d)).toString();if(s.indexOf("e")>=0)s=String(+v.toPrecision(d));return s.replace("-","−");}
  /* 範囲の外に出る所で線を切る折れ線（範囲に戻ればまた描く） */
  function _w03_cut(P,pts,c,lw,dash,S){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),out=[],cur=[],prev=null;
    pts.forEach(function(q){var a=q[0],b=q[1];if(a<P.xr[0]-1e-12||a>P.xr[1]+1e-12){prev=null;if(cur.length>1)out.push(cur);cur=[];return;}
      var ins=b>=lo&&b<=hi;
      if(prev){var pin=prev[1]>=lo&&prev[1]<=hi;
        if(ins&&!pin){var lim=prev[1]>hi?hi:lo,fr=(lim-prev[1])/(b-prev[1]);cur=[[prev[0]+(a-prev[0])*fr,lim]];}
        else if(pin&&!ins){var lim2=b>hi?hi:lo,fr2=(lim2-prev[1])/(b-prev[1]);cur.push([prev[0]+(a-prev[0])*fr2,lim2]);out.push(cur);cur=[];}}
      if(ins)cur.push([a,b]);prev=[a,b];});
    if(cur.length>1)out.push(cur);
    return out.map(function(sg){return S.PL(sg.map(function(q){return [P.X(q[0]),P.Y(q[1])];}),c,lw,null,dash);}).join("");}
  /* 範囲の外に出たところで線を止める（大きくなり続ける応答の描き方） */
  function _w03_stop(P,pts,c,lw,dash,S){var lo=Math.min(P.yr[0],P.yr[1]),hi=Math.max(P.yr[0],P.yr[1]),q=[];
    for(var i=0;i<pts.length;i++){var a=pts[i][0],b=pts[i][1];if(a<P.xr[0]-1e-9||a>P.xr[1]+1e-9)continue;
      if(!(b>=lo&&b<=hi)){q.push([P.X(a),P.Y(b>hi?hi:lo)]);break;}q.push([P.X(a),P.Y(b)]);}
    return q.length>1?S.PL(q,c,lw,null,dash):"";}

  /* ---- 2 節: ステップ応答（対象の動く絵 ↔ 波形） ---- */
  var _W03_OBJ=[
    {nm:"DC モータ（電圧 → 角速度）",K:50,T:0.05,du:12,ysc:1,usc:1,yu:"rad/s",uu:"V",ku:"(rad/s)/V",off:0,yl:"角速度 [rad/s]",d:1,kind:"motor",ru:"rad/s²"},
    {nm:"台車（押す力 → 速度）",K:0.5,T:0.5,du:2,ysc:1,usc:1,yu:"m/s",uu:"N",ku:"(m/s)/N",off:0,yl:"速度 [m/s]",d:3,kind:"cart",ru:"m/s²"},
    {nm:"RC 回路（電圧 → コンデンサの電圧）",K:1,T:0.1,du:5,ysc:1,usc:1,yu:"V",uu:"V",ku:"",off:0,yl:"電圧 [V]",d:3,kind:"rc",ru:"V/s"},
    {nm:"温度の板（ヒータの電力 → 温度）",K:1.25,T:500,du:40,ysc:1,usc:1,yu:"°C",dyu:"K",uu:"W",ku:"K/W",off:25,yl:"温度 [°C]",d:2,kind:"plate",ru:"K/s"},
    {nm:"水槽（流入のずれ → 水位のずれ、線形化）",K:2500,T:50,du:0.02e-3,ysc:100,usc:1000,yu:"cm",uu:"L/s",ku:"s/m²",off:0,yl:"水位のずれ [cm]",d:2,kind:"tank",ru:"cm/s"}
  ];
  REG.w03_step=function(el,U){
    var S=U.S;
    U.head(el,"STEP RESPONSE","一次遅れのステップ応答 — 時定数と定常ゲイン");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W03_OBJ.map(function(o){return o.nm;}),0,function(){kept=[];tm.set(tm.get());km.set(km.get());tt.set(1);draw();});
    var r2=U.ctrls(el);
    var tm=U.slider(r2,"時定数 T",{values:[0.25,0.5,0.75,1,1.5,2,3,4],value:1,fmt:function(v){var o=_W03_OBJ[ob.get()];return _w03_sig(o.T*v,3)+" s（例の "+v+" 倍）";},onInput:draw});
    var km=U.slider(r2,"定常ゲイン K",{values:[0.25,0.5,0.75,1,1.25,1.5,2],value:1,fmt:function(v){var o=_W03_OBJ[ob.get()];return _w03_sig(o.K*v,3)+(o.ku?" "+o.ku:"")+"（例の "+v+" 倍）";},onInput:draw});
    var r3=U.ctrls(el);
    var tt=U.slider(r3,"時刻 t（例の T の何倍か）",{min:0,max:6,step:0.01,value:1,fmt:function(v){var o=_W03_OBJ[ob.get()];return _w03_sig(v*o.T,3)+" s";},onInput:draw});
    tt.el.style.flex="1 1 100%";
    var r4=U.ctrls(el);
    var mk=U.checkbox(r4,"接線・63.2 %・95 % の印",true,draw);
    var tg=U.checkbox(r4,"時刻 t の接線",true,draw);
    var nm=U.checkbox(r4,"横軸 t/T・縦軸 y/(KΔu) で描く",false,draw);
    var br=U.btnrow(el);
    var tick=U.ticker(function(){var v=tt.get()+0.04;if(v>=6){v=6;tick.stop();}tt.set(v);draw();},40);
    U.button(br,"本文の例（モータに 12 V）",function(){tick.stop();ob.set(0);tm.set(1);km.set(1);tt.set(1);mk.set(true);tg.set(true);nm.set(false);kept=[];draw();});
    U.button(br,"再生（0 から）",function(){tt.set(0);draw();tick.start();});
    U.button(br,"止める",function(){tick.stop();});
    U.button(br,"いまの曲線を残す",function(){if(kept.length>=4)kept.shift();kept.push({T:tm.get(),K:km.get()});draw();});
    U.button(br,"残した曲線を消す",function(){kept=[];draw();});
    var pic=U.svgbox(el),box=U.svgbox(el),ro=U.readout(el),kept=[];
    var KC=["muted","teal","purple","gold"];
    /* 時刻 t までに出力を積み上げた量（台車の位置・モータの回転角）: ∫y dt = KΔu (t − T(1 − e^{−t/T})) */
    function integ(Kd,T,t){return Kd*(t-T*(1-Math.exp(-t/T)));}
    function draw(){
      var o=_W03_OBJ[ob.get()],T=o.T*tm.get(),Kv=o.K*km.get(),Kd=Kv*o.du,fin=Kd*o.ysc,fin0=o.K*o.du*o.ysc,t=tt.get()*o.T,N=nm.get();
      var y=fin*(1-Math.exp(-t/T)),sl=(fin-y)/T,nar=_w03_nar(box),Wd=nar?400:700;
      /* ---- 動く絵（左の舞台）と、出力の大きさの棒（右） ---- */
      var q=[],gx2=nar?250:430,cy=78,scx=(14+gx2-20)/2;
      q.push(S.T(nar?10:14,18,"時刻 t = "+_w03_sig(t,3)+" s（"+_w03_f(t/T,2)+" T）","start",11,"ink",true));
      if(o.kind==="motor"){
        var ang=integ(Kd,T,t)*Math.PI/(o.K*o.du*o.T)*0.5;
        q.push(S.RECT(scx-92,cy-22,64,44,6,U.soft("signal"),"signal",1.5));q.push(S.T(scx-60,cy+5,"M","middle",13,"signal",true));
        q.push(S.L(scx-28,cy,scx-6,cy,"ink",3));q.push(S.CIRC(scx+28,cy,34,"muted",1.6,"var(--muted-soft)"));
        for(var k=0;k<3;k++){var a=ang+k*2*Math.PI/3;q.push(S.L(scx+28,cy,scx+28+30*Math.cos(a),cy-30*Math.sin(a),k?"muted":"signal",k?1.4:3));}
        q.push(S.D(scx+28,cy,"ink",3.5));
        q.push(S.T(scx-60,cy+40,"電圧 "+_w03_sig(o.du,3)+" V","middle",9.5,"gold",true));
        q.push(S.T(scx+28,cy+50,"回転は遅くして描いた","middle",9,"muted"));
      }else if(o.kind==="cart"){
        var x0=24,trk=gx2-60,pos=integ(Kd,T,t),gx=x0+22+((pos*120)%(trk-44)+(trk-44))%(trk-44);
        q.push(S.L(x0,cy+22,x0+trk,cy+22,"muted",1.6));
        for(var m=0;m<=trk;m+=30)q.push(S.L(x0+m,cy+22,x0+m-6,cy+30,"faint",1.2));
        q.push(S.RECT(gx-22,cy-8,44,22,4,U.soft("signal"),"signal",1.5));
        var wa=pos*120/6;[gx-12,gx+12].forEach(function(wx){q.push(S.CIRC(wx,cy+16,6,"ink",1.3,"panel"));q.push(S.L(wx,cy+16,wx+5*Math.cos(wa),cy+16-5*Math.sin(wa),"ink",1.2));});
        q.push(S.ARR(gx-46,cy+3,gx-24,cy+3,"gold",2,6));
        q.push(S.T(x0,cy+46,"押す力 "+_w03_sig(o.du,3)+" N で走る（右端に着くと左端から出直す）","start",9,"muted"));
      }else if(o.kind==="rc"){
        var xa=scx-80,xb=scx+50;
        q.push(S.W([xa,cy+22,xa,cy-22,xa+30,cy-22],"ink",1.4));
        var zz=[[xa+30,cy-22]];for(var j=0;j<8;j++)zz.push([xa+34+j*6,cy-22+(j%2?6:-6)]);zz.push([xa+84,cy-22]);q.push(S.PL(zz,"ink",1.4));
        q.push(S.W([xa+84,cy-22,xb,cy-22,xb,cy-6],"ink",1.4));
        q.push(S.L(xb-18,cy-6,xb+18,cy-6,"signal",2.6));q.push(S.L(xb-18,cy+6,xb+18,cy+6,"signal",2.6));
        q.push(S.W([xb,cy+6,xb,cy+22,xa,cy+22],"ink",1.4));
        q.push(S.CIRC(xa,cy,12,"gold",1.6,"screen"));q.push(S.T(xa,cy+4,"+","middle",11,"gold",true));
        var nch=Math.round(10*Math.max(0,Math.min(1,y/(2*fin0))));for(var c2=0;c2<nch;c2++){q.push(S.T(xb-15+c2*3.3,cy-10,"+","middle",8,"alias",true));q.push(S.T(xb-15+c2*3.3,cy+17,"−","middle",8,"signal",true));}
        q.push(S.T(xa-16,cy+4,_w03_sig(o.du,3)+" V","end",9.5,"gold",true));
        q.push(S.TX(scx,cy+44,"コンデンサにたまった電荷（印の数）","middle",9,"muted"));
      }else if(o.kind==="plate"){
        var hf=Math.max(0,Math.min(1,y/(2*fin0)));
        q.push(S.RECT(scx-95,cy-6,190,16,3,"var(--muted-soft)","muted",1.4));
        q.push(S.RECT(scx-95,cy-6,190,16,3,"alias","none",0,null,' fill-opacity="'+(0.9*hf).toFixed(3)+'"'));
        q.push(S.RECT(scx-81,cy+10,162,7,2,U.soft("gold"),"gold",1.1));
        for(var w=0;w<4;w++){var wx2=scx-70+w*44;q.push(S.PATH("M"+wx2+","+(cy-10)+" c-5,-6 5,-10 0,-16 c-5,-6 5,-10 0,-14","muted",1.2));}
        q.push(S.T(scx,cy+36,"ヒータ "+_w03_sig(o.du,3)+" W（板の色が濃いほど熱い）","middle",9,"gold",true));
      }else{
        var lv=Math.max(0,Math.min(1,0.45+y/(fin0*2.2)*0.5)),tx0=scx-55,tw2=110,th=64,ty0=cy-30;
        q.push(S.RECT(tx0,ty0+th*(1-lv),tw2,th*lv,0,U.soft("signal"),"none",0));
        q.push(S.W([tx0,ty0,tx0,ty0+th,tx0+tw2,ty0+th,tx0+tw2,ty0],"ink",1.6));
        q.push(S.L(tx0-6,ty0+th*(1-0.45),tx0+tw2+6,ty0+th*(1-0.45),"muted",1,"4 3"));
        q.push(S.T(tx0+tw2/2,ty0+th+16,"破線: 動作点の水位","middle",9,"muted"));
        q.push(S.ARR(tx0-34,ty0-8,tx0+10,ty0-8,"gold",2,6));q.push(S.T(tx0-34,ty0-14,"流入","start",9,"gold"));
      }
      /* 目盛つきの棒（出力の大きさ） */
      var gw=nar?140:240,gy=58,gh=16;
      q.push(S.T(gx2,gy-10,o.yl.replace(/ \[.*\]/,"")+" "+_w03_f(o.off+y,o.d)+" "+o.yu,"start",11,"signal",true));
      q.push(S.RECT(gx2,gy,gw,gh,3,"screen","line",1));
      var GX=function(v){return gx2+v/(2*fin0)*gw;};
      q.push(S.RECT(gx2,gy,Math.max(0,Math.min(gw,GX(y)-gx2)),gh,3,U.soft("signal"),"signal",1));
      q.push(S.L(GX(fin),gy-4,GX(fin),gy+gh+4,"ink",1.6));
      [[0.632,"63.2 %"],[0.95,"95 %"]].forEach(function(pq,i){var xx=GX(fin*pq[0]);q.push(S.L(xx,gy+gh,xx,gy+gh+6,"signal",1.2));if(!nar||i===0)q.push(S.T(xx,gy+gh+17,pq[1],"middle",9,"signal"));});
      q.push(S.T(GX(fin),gy+gh+30,"落ち着く値 "+_w03_sig(o.off+fin,4),"middle",9,"ink"));
      if(nar){q.push(S.T(gx2,gy+gh+46,"残り "+_w03_f(100*Math.exp(-t/T),1)+" %","start",9.5,"purple",true));q.push(S.T(gx2,gy+gh+60,"変わる速さ "+_w03_sig(sl,3)+" "+o.ru,"start",9.5,"purple",true));}
      else q.push(S.T(gx2,gy+gh+46,"残り "+_w03_f(100*Math.exp(-t/T),1)+" %、変わる速さ "+_w03_sig(sl,3)+" "+o.ru,"start",9.5,"purple",true));
      pic.set(S.svg(Wd,140,q));
      /* ---- 波形 ---- */
      var p,xo=nar?52:66,pw=nar?330:600,ph=nar?190:220,g=[],fmax=Math.max(fin,fin0);kept.forEach(function(kc){fmax=Math.max(fmax,o.K*kc.K*o.du*o.ysc);});var yhi=N?1.1:1.15*fmax;
      var X0=N?6:6*o.T,TT=function(v){return N?v/T:v;},YY=function(v){return N?v/fin:v;};
      p=U.plot(xo,16,pw,ph,[0,N?6:6*o.T],[N?0:o.off,N?1.1:o.off+yhi]);
      var yt=N?[0,0.2,0.4,0.632,1.0]:U.nice(o.off,o.off+yhi,5).filter(function(v){return v>=o.off-1e-9&&v<=o.off+yhi+1e-9;});
      g.push(p.axes({xl:N?"t/T（時間 ÷ 時定数）":"時間 t [s]",yl:N?"y/(KΔu)":o.yl,xt:U.nice(0,X0,6).filter(function(v){return v<=X0+1e-9;}),yt:yt,xfmt:function(v){return _w03_sig(v,3);},yfmt:function(v){return N?(v===0.632?"0.632":_w03_sig(v,3)):_w03_sig(v,4);},ylOff:nar?38:44}));
      var off=N?0:o.off;
      function curve(Tc,Kc){var pts=[],fc=Kc*o.du*o.ysc;for(var i=0;i<=240;i++){var tq=X0*i/240*(N?Tc:1),v=fc*(1-Math.exp(-tq/Tc));pts.push([N?tq/Tc:tq,N?v/fc:off+v]);}return pts;}
      kept.forEach(function(kc,i){g.push(_w03_cut(p,curve(o.T*kc.T,o.K*kc.K),KC[i%4],1.6,"6 3",S));});
      g.push(p.line([[0,N?1:off+fin],[X0,N?1:off+fin]],"muted",1.1,"5 3"));
      if(!N&&Math.abs(km.get()-1)>1e-9){g.push(p.line([[0,off+fin0],[X0,off+fin0]],"faint",1,"2 3"));g.push(S.T(p.X(X0)-4,p.Y(off+fin0)-5,"例の K の落ち着く値","end",9,"muted",false,false,null,true));}
      g.push(_w03_cut(p,curve(T,Kv),"signal",2.6,null,S));
      if(mk.get()){
        var xT=N?1:T;g.push(S.L(p.X(0),p.Y(N?0:off),p.X(xT),p.Y(N?1:off+fin),"gold",1.5,"6 3"));
        g.push(S.D(p.X(xT),p.Y(N?1:off+fin),"gold",4));
        var y63=N?0.632:off+fin*0.632,y95=N?0.95:off+fin*0.95;
        if(xT<=X0){g.push(S.L(p.X(xT),p.Y(y63),p.X(xT),p.y+p.h,"signal",1,"3 3"));g.push(S.D(p.X(xT),p.Y(y63),"signal",4.4));
          g.push(S.T(p.X(xT)+7,p.Y(y63)+16,"63.2 %（t = "+(N?"T":_w03_sig(T,3)+" s")+"）","start",9.5,"signal",true,false,null,true));}
        if(3*xT<=X0){g.push(S.D(p.X(3*xT),p.Y(y95),"signal",4));g.push(S.T(p.X(3*xT)+6,p.Y(y95)+16,"95 %（3T）","start",9.5,"signal",true,false,null,true));}
      }
      /* 時刻 t の点と接線 */
      var xt0=N?t/T:t,yv=N?y/fin:off+y;
      if(xt0<=X0){
        g.push(S.L(p.X(xt0),p.y,p.X(xt0),p.y+p.h,"ink",1.1,"3 3"));
        if(tg.get()){var xe=N?xt0+1:t+T,ye=N?1:off+fin;var xe2=Math.min(xe,X0),ye2=yv+(ye-yv)*(xe2-xt0)/(xe-xt0||1);
          g.push(S.L(p.X(xt0),p.Y(yv),p.X(xe2),p.Y(ye2),"purple",1.6,"5 3"));if(xe<=X0)g.push(S.D(p.X(xe),p.Y(ye),"purple",3.8));}
        g.push(S.D(p.X(xt0),p.Y(yv),"signal",5));
      }
      var leg=[["signal",null,"いまの曲線"]];if(kept.length)leg.push(["muted","6 3","残した曲線"]);if(mk.get())leg.push(["gold","6 3","t = 0 の接線"]);if(tg.get())leg.push(["purple","5 3","時刻 t の接線"]);
      var ly=p.y+p.h+50;
      if(nar&&leg.length>2){g.push(S.LEGL(xo,ly,leg.slice(0,2),9.5,14));g.push(S.LEGL(xo,ly+16,leg.slice(2),9.5,14));ly+=16;}
      else g.push(S.LEGL(xo,ly,leg,9.5,14));
      box.set(S.svg(Wd,ly+8,g));
      /* ---- 読み出し ---- */
      var h="",du2=o.dyu||o.yu;
      h+="T = "+_w03_sig(T,3)+" s、K = "+_w03_sig(Kv,3)+(o.ku?" "+o.ku:"")+"、入力 Δu = "+_w03_sig(o.du*o.usc,3)+" "+o.uu+" → 出力の変化 KΔu = <b>"+_w03_sig(fin,4)+" "+du2+"</b>"+(o.off?"（"+_w03_sig(o.off,3)+" "+o.yu+" から "+_w03_sig(o.off+fin,4)+" "+o.yu+" へ）":"")+"<br>";
      h+="63.2 % に届く時刻 T = <b>"+_w03_sig(T,3)+" s</b>（"+_w03_sig(o.off+fin*0.6321,4)+" "+o.yu+"）、95 % に届く時刻 3T = "+_w03_sig(3*T,3)+" s（"+_w03_sig(o.off+fin*0.9502,4)+" "+o.yu+"）<br>";
      h+="t = 0 の傾き KΔu/T = "+_w03_sig(fin/T,4)+" "+o.ru+"（この傾きのままなら t = T で落ち着く値に届く）<br>";
      h+="時刻 t = "+_w03_sig(t,3)+" s: 出力 <b>"+_w03_f(o.off+y,o.d)+" "+o.yu+"</b>（落ち着く値の "+_w03_f(100*(1-Math.exp(-t/T)),1)+" %）、残り "+_w03_sig(fin-y,3)+" "+du2+"、その時刻の傾き "+_w03_sig(sl,3)+" "+o.ru+" → この傾きの接線は t + T = "+_w03_sig(t+T,3)+" s に落ち着く値に届く";
      if(kept.length)h+="<br>残した曲線: "+kept.map(function(kc,i){return '<span style="color:'+U.col(KC[i%4])+'">T × '+kc.T+"・K × "+kc.K+"</span>";}).join("、");
      ro.innerHTML=h+'<div class="wnote">式 y = KΔu (1 − e<sup>−t/T</sup>) の値。動く絵の速さは実際とは違い、「再生」では 1 s で例の T だけ進む。回転や移動の量も、見やすいように縮めて描いた。値はどれも例の値。</div>';
    }
    draw();
  };

  /* ---- 3 節: 入力をステップに分けて、応答を足し合わせる ---- */
  var _W03_IOBJ=[
    {nm:"台車（押す力 → 速度）",K:0.5,T:0.5,du:2,uu:"N",yu:"m/s",un:"押す力",yn:"速度",d:3},
    {nm:"DC モータ（電圧 → 角速度）",K:50,T:0.05,du:12,uu:"V",yu:"rad/s",un:"電圧",yn:"角速度",d:1},
    {nm:"RC 回路（電圧 → コンデンサの電圧）",K:1,T:0.1,du:1,uu:"V",yu:"V",un:"電圧",yn:"コンデンサの電圧",d:3}
  ];
  REG.w03_inputs=function(el,U){
    var S=U.S;
    U.head(el,"SUPERPOSITION","入力をステップに分けて、応答を足し合わせる");
    var r1=U.ctrls(el);
    var ob=U.select(r1,"対象",_W03_IOBJ.map(function(o){return o.nm;}),0,function(){tm.set(tm.get());tw.set(tw.get());tr.set(tr.get());draw();});
    var ip=U.select(r1,"入力",["ステップ","パルス（一定の幅だけ加える）","インパルスに近づける（面積を保って幅を狭める）","ランプ（一定の速さで上げる）","方形波（入れ切りを繰り返す）"],1,draw);
    var r2=U.ctrls(el);
    function o_(){return _W03_IOBJ[ob.get()];}
    var tm=U.slider(r2,"時定数 T",{values:[0.5,0.75,1,1.5,2],value:1,fmt:function(v){return _w03_sig(o_().T*v,3)+" s（例の "+v+" 倍）";},onInput:draw});
    var tw=U.slider(r2,"幅 t<sub>w</sub>（方形波では半周期）",{values:[0.05,0.1,0.2,0.4,1,2,4],value:2,fmt:function(v){return _w03_sig(o_().T*v,3)+" s（例の T の "+v+" 倍）";},onInput:draw});
    var tr=U.slider(r2,"ランプで上げる時間 t<sub>r</sub>",{values:[1,2,5,10,20],value:10,fmt:function(v){return _w03_sig(o_().T*v,3)+" s";},onInput:draw});
    var ns=U.slider(r2,"ランプを分ける段の数",{values:[4,8,16,32,64],value:8,fmt:function(v){return v+" 段";},onInput:draw});
    var br=U.btnrow(el);
    function set(a,b,c,d){ob.set(a);ip.set(b);tm.set(1);tw.set(c!=null?c:tw.get());tr.set(d!=null?d:tr.get());draw();}
    U.button(br,"本文の例: パルス（台車、2 N を 1 s）",function(){set(0,1,2,null);});
    U.button(br,"インパルス（台車、0.2 N·s を 0.1 s で）",function(){set(0,2,0.2,null);});
    U.button(br,"ランプ（モータ、0.5 s で 12 V）",function(){set(1,3,null,10);});
    U.button(br,"方形波（RC 回路、t<sub>w</sub> = T）",function(){set(2,4,1,null);});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var o=o_(),M=ip.get(),Tb=o.T,T=o.T*tm.get(),K=o.K,du=o.du,w=tw.get()*Tb,trr=tr.get()*Tb,N=ns.get();
      tw.el.style.display=(M===1||M===2||M===4)?"":"none";tr.el.style.display=M===3?"":"none";ns.el.style.display=M===3?"":"none";
      var area=du*0.2*Tb,hImp=area/w;
      /* 成分のステップ [時刻, 高さ] と、入力の関数 */
      var comp=[],uf,win;
      if(M===0){comp=[[0,du]];uf=function(t){return t>=0?du:0;};win=6*Tb;}
      else if(M===1){comp=[[0,du],[w,-du]];uf=function(t){return t<w?du:0;};win=w+5*Tb;}
      else if(M===2){comp=[[0,hImp],[w,-hImp]];uf=function(t){return t<w?hImp:0;};win=w+4*Tb;}
      else if(M===3){for(var j=1;j<=N;j++)comp.push([(j-0.5)*trr/N,du/N]);uf=function(t){return du*Math.min(t,trr)/trr;};win=trr+4*Tb;}
      else{win=Math.max(8*Tb,8*w);for(var k=0;k*w<win&&k<160;k++)comp.push([k*w,k%2?-du:du]);uf=function(t){return Math.floor(t/w)%2?0:du;};}
      /* 応答（成分ごと）と和 */
      var n=400,ts=[],i;for(i=0;i<=n;i++)ts.push(win*i/n);
      function sresp(t,c){return t>=c[0]?c[1]*K*(1-Math.exp(-(t-c[0])/T)):0;}
      var sum=ts.map(function(t){var s0=0;comp.forEach(function(c){s0+=sresp(t,c);});return s0;});
      /* 微分方程式を細かい刻みで解く（4 次のルンゲ・クッタ法） */
      var hh=Math.min(T,(M===1||M===2||M===4)?w:T)/60,nn=Math.ceil(win/hh),yv=[0],ex=[[0,0]],stepEvery=Math.max(1,Math.round(nn/400));
      hh=win/nn;
      for(i=0;i<nn;i++){var tt0=i*hh;yv=U.ctl.rk4(function(tq,x){return [(K*uf(tq)-x[0])/T];},tt0,yv,hh);if((i+1)%stepEvery===0||i===nn-1)ex.push([(i+1)*hh,yv[0]]);}
      /* 図 */
      var nar=_w03_nar(box),Wd=nar?400:700,xo=nar?54:70,pw=nar?330:600,o2=[];
      var umax=M===2?hImp:du,umin=(M===1||M===2||M===4)?-umax:0;
      var P1=U.plot(xo,22,pw,84,[0,win],[umin*1.15,umax*1.2]);
      o2.push(S.T(xo-2,14,"入力 = ステップの和（緑: 増えるステップ、赤: 減るステップ）","start",10,"ink",true));
      o2.push(P1.axes({yl:o.un+" ["+o.uu+"]",xt:U.nice(0,win,6).filter(function(v){return v<=win+1e-9;}),yt:[umin,0,umax].filter(function(v,ix,a){return a.indexOf(v)===ix;}),xfmt:function(){return "";},yfmt:function(v){return _w03_sig(v,3);},ylOff:nar?40:46}));
      o2.push(P1.line([[0,0],[win,0]],"muted",1));
      var up=[];for(i=0;i<=600;i++){var tq=win*i/600;up.push([tq,uf(tq)]);}
      o2.push(P1.line(up,"gold",2));
      if(M===3){var st=[[0,0]],acc=0;comp.forEach(function(c){st.push([c[0],acc]);acc+=c[1];st.push([c[0],acc]);});st.push([win,acc]);o2.push(P1.line(st,"green",1.2));}
      comp.forEach(function(c){if(c[0]>win)return;var x=P1.X(c[0])+(M===3?0:3),y0=P1.Y(0),y1=P1.Y(c[1]*0.92);
        if(Math.abs(y1-y0)>=4)o2.push(S.ARR(x,y0,x,y1,c[1]>0?"green":"alias",1.4,Math.min(6,Math.abs(y1-y0)*0.6)));});
      var r2y=P1.y+P1.h+30,cmax=0,neg=false;comp.forEach(function(c){cmax=Math.max(cmax,Math.abs(c[1])*K);if(c[1]<0)neg=true;});
      var P2=U.plot(xo,r2y,pw,84,[0,win],[neg?-cmax*1.1:-cmax*0.1,cmax*1.1]);
      o2.push(S.T(xo-2,r2y-8,"それぞれのステップの応答（同じ色）","start",10,"ink",true));
      o2.push(P2.axes({yl:o.yn+" ["+o.yu+"]",xt:U.nice(0,win,6).filter(function(v){return v<=win+1e-9;}),yt:neg?[-cmax,0,cmax]:[0,cmax],xfmt:function(){return "";},yfmt:function(v){return _w03_sig(v,3);},ylOff:nar?40:46}));
      o2.push(P2.line([[0,0],[win,0]],"muted",1));
      comp.forEach(function(c){if(c[0]>win)return;var pts=[[c[0],0]];for(var q=0;q<=80;q++){var tq2=c[0]+(win-c[0])*q/80;pts.push([tq2,sresp(tq2,c)]);}o2.push(P2.line(pts,c[1]>0?"green":"alias",comp.length>20?0.9:1.6));});
      var r3y=P2.y+P2.h+30,smax=0,smin=0;sum.forEach(function(v){smax=Math.max(smax,v);smin=Math.min(smin,v);});ex.forEach(function(q){smax=Math.max(smax,q[1]);});
      var lim=M===2?Math.max(smax,K*area/T):smax;
      var P3=U.plot(xo,r3y,pw,nar?120:140,[0,win],[Math.min(0,smin)*1.1,lim*1.15||1]);
      o2.push(S.T(xo-2,r3y-8,"足し合わせた応答（青）と、微分方程式を細かい刻みで解いた応答（破線）","start",10,"ink",true));
      o2.push(P3.axes({xl:"時間 t [s]",yl:o.yn+" ["+o.yu+"]",xt:U.nice(0,win,6).filter(function(v){return v<=win+1e-9;}),xfmt:function(v){return _w03_sig(v,3);},yfmt:function(v){return _w03_sig(v,3);},ylOff:nar?40:46}));
      if(M===3)o2.push(P3.line(up.map(function(q){return [q[0],K*q[1]];}),"gold",1.2,"4 3"));
      if(M===2){var lp=[];for(i=0;i<=200;i++){var tl=win*i/200;lp.push([tl,K*area/T*Math.exp(-tl/T)]);}o2.push(P3.line(lp,"purple",1.6,"6 3"));}
      o2.push(P3.line(ts.map(function(t,ix){return [t,sum[ix]];}),"signal",2.6));
      o2.push(P3.line(ex,"ink",1.3,"4 4"));
      box.set(S.svg(Wd,P3.y+P3.h+42,o2));
      /* 読み出し */
      var h="",yu=o.yu;
      var maxd=0;ex.forEach(function(q){var s0=0;comp.forEach(function(c){s0+=sresp(q[0],c);});maxd=Math.max(maxd,Math.abs(s0-q[1]));});
      if(M===0)h+="ステップ "+_w03_sig(du,3)+" "+o.uu+": 落ち着く値 KΔu = <b>"+_w03_sig(K*du,4)+" "+yu+"</b>、時刻 T = "+_w03_sig(T,3)+" s で 63.2 %<br>";
      if(M===1){var pk=K*du*(1-Math.exp(-w/T));h+="パルス "+_w03_sig(du,3)+" "+o.uu+" を "+_w03_sig(w,3)+" s: 2 つのステップ（時刻 0 に +"+_w03_sig(du,3)+"、時刻 "+_w03_sig(w,3)+" s に −"+_w03_sig(du,3)+"）。最大 <b>"+_w03_f(pk,o.d)+" "+yu+"</b>（時刻 t<sub>w</sub>）、その後は時定数 "+_w03_sig(T,3)+" s で減る<br>";}
      if(M===2){var pk2=K*hImp*(1-Math.exp(-w/T));h+="面積 "+_w03_sig(area,3)+" "+o.uu+"·s を幅 "+_w03_sig(w,3)+" s（高さ "+_w03_sig(hImp,3)+" "+o.uu+"）で: 最大 <b>"+_w03_f(pk2,o.d)+" "+yu+"</b>。幅を 0 に近づけた極限（インパルス応答 × 面積）の最大 K × 面積 ÷ T = "+_w03_f(K*area/T,o.d)+" "+yu+"（紫の破線）の "+_w03_f(100*pk2/(K*area/T),1)+" %<br>";}
      if(M===3){var a=du/trr,vr=K*a*(trr-T+T*Math.exp(-trr/T));h+="ランプ: 傾き α = "+_w03_sig(a,3)+" "+o.uu+"/s を "+_w03_sig(trr,3)+" s。t<sub>r</sub> での値 <b>"+_w03_sig(vr,4)+" "+yu+"</b>（入力 × K の "+_w03_sig(K*du,4)+" より KαT = "+_w03_sig(K*a*T,3)+" "+yu+" 下。時間では T = "+_w03_sig(T,3)+" s 遅れ）<br>";
        var md=0;ex.forEach(function(q){var s0=0;comp.forEach(function(c){s0+=sresp(q[0],c);});md=Math.max(md,Math.abs(s0-q[1]));});
        h+=N+" 段の階段の応答とランプ応答の差: 最大 "+_w03_sig(md,3)+" "+yu+"（段を細かくするほど小さくなる）<br>";}
      if(M===4){var e=Math.exp(-w/T),ymx=K*du/(1+e),ymn=K*du*e/(1+e),lo=Infinity,hi=-Infinity;
        ex.forEach(function(q){if(q[0]>=win-2*w-1e-9){lo=Math.min(lo,q[1]);hi=Math.max(hi,q[1]);}});
        h+="方形波（半周期 "+_w03_sig(w,3)+" s）: 往復の範囲の式 "+_w03_f(ymn,o.d)+"〜"+_w03_f(ymx,o.d)+" "+yu+"、数値で解いた最後の 1 周期 "+_w03_f(lo,o.d)+"〜"+_w03_f(hi,o.d)+" "+yu+"<br>";}
      if(M!==3)h+="足し合わせた応答と、微分方程式を細かい刻みで解いた応答の差: 最大 "+_w03_sig(maxd,2)+" "+yu+"<br>";
      ro.innerHTML=h+'<div class="wnote">K = '+_w03_sig(K,3)+(o.uu==="N"?" (m/s)/N":(o.uu==="V"&&o.yu==="rad/s"?" (rad/s)/V":""))+'、T = '+_w03_sig(T,3)+' s。i 番目のステップ（時刻 t<sub>i</sub>、高さ Δu<sub>i</sub>）の応答は 2 節の式 K Δu<sub>i</sub> (1 − e<sup>−(t − t<sub>i</sub>)/T</sup>)。破線は 4 次のルンゲ・クッタ法（刻み幅は T と t<sub>w</sub> の小さい方の 1/60 以下）。</div>';
    }
    draw();
  };

  /* ---- 5 節: ステップ応答から K・T・L を求める ---- */
  /* 手順 3〜5 で読む（本文の図と同じ手順）。ノイズがあるときは平均・ならし・直線の当てはめを使う */
  function _w03_read(t,y,sig,dq){
    var n=t.length,y0=0,c0=0,i;for(i=0;i<n;i++)if(t[i]<0){y0+=y[i];c0++;}y0=c0?y0/c0:y[0];
    var tend=t[n-1],wa=sig>0?Math.min(500,0.2*tend):0,yi=0,ci=0;for(i=0;i<n;i++)if(t[i]>=tend-wa-1e-9){yi+=y[i];ci++;}yi/=ci;
    var hs=sig>0?4:0,ys=[];for(i=0;i<n;i++){var s=0,c=0;for(var j=Math.max(0,i-hs);j<=Math.min(n-1,i+hs);j++){s+=y[j];c++;}ys.push(s/c);}
    var lev=y0+0.632121*(yi-y0),t63=null;for(i=1;i<n;i++)if(t[i]>=0&&ys[i-1]<lev&&ys[i]>=lev){t63=t[i-1]+(lev-ys[i-1])/(ys[i]-ys[i-1])*(t[i]-t[i-1]);break;}
    var dt=t[1]-t[0],m=Math.round((sig>0?100:10)/dt)+1,best=null;
    for(i=0;i+m<=n;i++){if(t[i]<0||t[i]>0.5*tend)continue;var sx=0,sy=0,sxx=0,sxy=0;for(var k=i;k<i+m;k++){sx+=t[k];sy+=y[k];sxx+=t[k]*t[k];sxy+=t[k]*y[k];}
      var sl=(m*sxy-sx*sy)/(m*sxx-sx*sx),ic=(sy-sl*sx)/m;if(!best||sl>best[0])best=[sl,ic];}
    var L=(y0-best[1])/best[0],ttan=(yi-best[1])/best[0];
    return {y0:y0,yi:yi,K:(yi-y0)/dq,L:L,T63:t63!=null?t63-L:NaN,Ttan:ttan-L,t63:t63,lev:lev,sl:best[0],ic:best[1],ys:ys,wa:wa,win:(m-1)*dt};
  }
  function _w03_model(t,y0,K,T,L,dq){return t<L?y0:y0+K*dq*(1-Math.exp(-(t-L)/T));}
  REG.w03_ident=function(el,U){
    var S=U.S,DQ=40;
    U.head(el,"IDENTIFICATION","ノイズのある記録に、一次遅れ＋むだ時間の曲線を合わせる（温度の板）");
    var r0=U.ctrls(el);
    var tru=U.select(r0,"本当の対象",["一次遅れ＋むだ時間（1.25 K/W・500 s・20 s）","一次遅れが 2 つ重なる（400 s と 100 s、むだ時間なし）"],0,gen);
    tru.el.style.flex="1 1 100%";
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"観測ノイズ（標準偏差）",{values:[0,0.1,0.3,0.5,1],value:0.3,fmt:function(v){return v+" K";},onInput:gen});
    var rl=U.slider(r1,"記録の長さ",{values:[600,1000,1500,2000,2500,3000,4000],value:4000,fmt:function(v){return v+" s";},onInput:gen});
    var r2=U.ctrls(el);
    var kk=U.slider(r2,"定常ゲイン K",{min:0.5,max:2,step:0.005,value:1,fmt:function(v){return _w03_f(v,3)+" K/W";},onInput:draw});
    var tt=U.slider(r2,"時定数 T",{min:50,max:1200,step:1,value:300,fmt:function(v){return Math.round(v)+" s";},onInput:draw});
    var ll=U.slider(r2,"むだ時間 L",{min:0,max:150,step:1,value:0,fmt:function(v){return Math.round(v)+" s";},onInput:draw});
    var r3=U.ctrls(el);
    var sh=U.checkbox(r3,"読み方の線（最後の平均・63.2 %・接線）",false,draw);
    var br=U.btnrow(el);
    U.button(br,"本文の例に戻す",function(){tru.set(0);sg.set(0.3);rl.set(4000);seed=1;kk.set(1);tt.set(300);ll.set(0);sh.set(false);last="";gen();});
    U.button(br,"図で読む（手順 3〜5）",function(){var r=_w03_read(D.t,D.y,sg.get(),DQ);kk.set(Math.max(0.5,Math.min(2,r.K)));tt.set(Math.max(50,Math.min(1200,r.T63)));ll.set(Math.max(0,Math.min(150,r.L)));sh.set(true);
      last="図で読んだ値: K = "+_w03_f(r.K,3)+" K/W、L = "+_w03_f(r.L,1)+" s、T = "+_w03_f(r.T63,1)+" s（63.2 % から）、接線から読んだ T = "+_w03_f(r.Ttan,1)+" s";draw();});
    U.button(br,"自動で合わせる（最小二乗法）",function(){var f=fit();kk.set(f.K);tt.set(f.T);ll.set(f.L);last="最小二乗法で合わせた値: K = "+_w03_f(f.K,3)+" K/W、L = "+_w03_f(f.L,1)+" s、T = "+_w03_f(f.T,1)+" s";draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;gen();});
    var box=U.svgbox(el),ro=U.readout(el),seed=1,D=null,last="";
    function gen(){
      var rg=U.rng(seed*7919+11),two=tru.get()===1,s=sg.get(),te=rl.get(),t=[],y=[];
      for(var tq=-300;tq<=te+1e-9;tq+=5){var v;
        if(two){var a=Math.max(tq,0);v=25+1.25*DQ*(1-(400*Math.exp(-a/400)-100*Math.exp(-a/100))/300);}
        else v=_w03_model(tq,25,1.25,500,20,DQ);
        t.push(tq);y.push(v+s*rg.normal());}
      D={t:t,y:y};last="";draw();
    }
    /* 最小二乗法: L を 0.5 s ごと、T を対数の格子で探し、K は式で決める。最後に細かく探し直す */
    function fit(){
      var t=D.t,y=D.y,n=t.length,y0=0,c0=0,i;for(i=0;i<n;i++)if(t[i]<0){y0+=y[i];c0++;}y0/=c0;
      function bestK(T,L){var sfy=0,sff=0;for(var k=0;k<n;k++){if(t[k]<L)continue;var f=DQ*(1-Math.exp(-(t[k]-L)/T));sfy+=f*(y[k]-y0);sff+=f*f;}var K=sff>0?sfy/sff:1,e=0;
        for(var k2=0;k2<n;k2++){var r=y[k2]-_w03_model(t[k2],y0,K,T,L,DQ);e+=r*r;}return [e,K];}
      var best=[Infinity,1,300,0];
      for(var L=0;L<=150;L+=2)for(var j=0;j<=36;j++){var T=50*Math.pow(24,j/36),r=bestK(T,L);if(r[0]<best[0])best=[r[0],r[1],T,L];}
      for(var it=0;it<3;it++){var b0=best.slice();
        for(var dL=-2;dL<=2;dL+=0.25)for(var j2=-8;j2<=8;j2++){var L2=Math.max(0,b0[3]+dL*(it?0.25:1)),T2=b0[2]*Math.pow(1.02,j2*(it?0.25:1)),r2=bestK(T2,L2);if(r2[0]<best[0])best=[r2[0],r2[1],T2,L2];}}
      return {K:Math.max(0.5,Math.min(2,best[1])),T:Math.max(50,Math.min(1200,best[2])),L:Math.max(0,Math.min(150,best[3]))};
    }
    function draw(){
      if(!D)return;
      var K=kk.get(),T=tt.get(),L=ll.get(),te=rl.get(),t=D.t,y=D.y,n=t.length,i;
      var y0=0,c0=0;for(i=0;i<n;i++)if(t[i]<0){y0+=y[i];c0++;}y0/=c0;
      var nar=_w03_nar(box),Wd=nar?400:700,xo=nar?52:62,pw=nar?336:610,o=[];
      var P=U.plot(xo,16,pw,nar?190:230,[-300,4000],[20,80]);
      o.push(P.axes({xl:"ヒータを 0 W → 40 W にしてからの時間 [s]",yl:"温度 [°C]",xt:[0,1000,2000,3000,4000],yt:[20,30,40,50,60,70,80],xfmt:function(v){return String(v);},ylOff:nar?36:42}));
      if(te<4000)o.push(S.RECT(P.X(te),P.y,P.X(4000)-P.X(te),P.h,0,"var(--muted-soft)","none",0));
      var dots=[];for(i=0;i<n;i++)dots.push(S.D(P.X(t[i]),P.Y(Math.max(20,Math.min(80,y[i]))),"teal",1.3));o.push(dots.join(""));
      var mp=[];for(i=0;i<=430;i++){var tq=-300+4300*i/430;mp.push([tq,_w03_model(tq,y0,K,T,L,DQ)]);}
      if(L>0)mp.push([L,y0]);mp.sort(function(a,b){return a[0]-b[0];});
      o.push(P.line(mp,"signal",2.4));
      if(sh.get()){var r=_w03_read(t,y,sg.get(),DQ);
        o.push(P.line([[te-r.wa,r.yi],[te,r.yi]],"green",2.6));
        o.push(P.line([[-300,r.lev],[r.t63||0,r.lev]],"signal",1,"3 3"));
        if(r.t63!=null)o.push(S.D(P.X(r.t63),P.Y(r.lev),"signal",4));
        var xb=(r.yi-r.ic)/r.sl;o.push(P.line([[r.L,r.y0],[Math.min(4000,xb),r.y0+r.sl*(Math.min(4000,xb)-r.L)]],"gold",1.6,"6 3"));
        o.push(S.D(P.X(r.L),P.Y(r.y0),"gold",3.8));
        if(sg.get()>0)o.push(P.line(t.map(function(tq,ix){return [tq,r.ys[ix]];}).filter(function(q){return q[0]>=0;}),"ink",1,null));}
      if(te<4000)o.push(S.T(P.X(Math.min(3990,te+30)),P.y+14,"記録の外","start",9.5,"muted",true,false,null,true));
      /* 残差 */
      var se=0,cnt=0,res=[];for(i=0;i<n;i++){var e=y[i]-_w03_model(t[i],y0,K,T,L,DQ);res.push([t[i],e]);se+=e*e;cnt++;}var rms=Math.sqrt(se/cnt);
      var rq=Math.max(1,6*sg.get()),Q=U.plot(xo,P.y+P.h+46,pw,60,[-300,4000],[-rq,rq]);
      o.push(Q.axes({yl:"差 [K]",xt:[0,1000,2000,3000,4000],yt:[-rq,0,rq].map(function(v){return +v.toFixed(2);}),xfmt:function(v){return String(v);},ylOff:nar?36:42}));
      o.push(S.T(xo,Q.y-6,"測った点 − 曲線（差。枠の外は端に寄せた）","start",9.5,"ink",true));
      o.push(res.map(function(q){return S.D(Q.X(q[0]),Q.Y(Math.max(-rq,Math.min(rq,q[1]))),"purple",1.1);}).join(""));
      o.push(S.LEGL(xo,Q.y+Q.h+44,[["teal",null,"測った温度（5 s ごと）"],["signal",null,"モデルの曲線"]].concat(sh.get()?[["gold","6 3","接線"]]:[]),9.5,14));
      box.set(S.svg(Wd,Q.y+Q.h+52,o));
      var h="モデルの曲線: K = "+_w03_f(K,3)+" K/W、T = "+Math.round(T)+" s、L = "+Math.round(L)+" s → 差の 2 乗の平均の平方根 <b>"+_w03_f(rms,3)+" K</b>"+(sg.get()>0?"（ノイズの標準偏差 "+sg.get()+" K に近いほど、よく合っている）":"")+"<br>";
      if(last)h+=last+"<br>";
      h+=tru.get()===0?"本当の値: K = 1.25 K/W、T = 500 s、L = 20 s":"本当の対象は一次遅れ 2 つ（時定数 400 s と 100 s、むだ時間なし）で、一次遅れ＋むだ時間の形ではない。合わせた曲線は近似である";
      if(rl.get()<2500)h+='<br><span class="warn">記録が時定数の 5 倍より短い。落ち着く前の値を落ち着いた値と見誤りやすい</span>';
      ro.innerHTML=h+'<div class="wnote">温度の板（周り 25 °C）で、時刻 0 にヒータを 0 W から 40 W にした記録。記録は −300 s から 5 s ごと。「図で読む」は本文 5 節の手順 3〜5（ノイズがあるときは、最後の 500 s（記録の 2 割まで）の平均、前後 9 点の平均でならした曲線、最も急な 100 s の点に当てはめた直線を使う）。「自動で合わせる」は、始めの値を記録の t &lt; 0 の平均に固定し、差の 2 乗の和が最も小さい K・T・L を探す。</div>';
    }
    gen();
  };

  /* ---- 6 節: 一次遅れ（台車の速度）の比例制御 ---- */
  /* 1 章と同じ計算: 刻み h の間は力を一定として、速度の式を厳密に解く。測った速度は L だけ遅れて届く */
  function _w03_psim(Kp,L,m,uff,slope){var c=2,r=1,h=1e-3,n=6000,nd=Math.round(L/h),a=Math.exp(-c*h/m),u0=uff?c*r:0,d3=m*9.81*Math.sin(3*Math.PI/180),hist=new Float64Array(n+1),y=0,T=[],Y=[],Uu=[];
    for(var k=0;k<=n;k++){var t=k*h;hist[k]=y;var ym=k>=nd?hist[k-nd]:0,u=u0+Kp*(r-ym),d=(slope&&t>=3-1e-9)?d3:0;
      if(k%4===0){T.push(t);Y.push(y);Uu.push(u);}if(Math.abs(y)>1e4)break;var yi=(u-d)/c;y=yi+(y-yi)*a;}
    return {t:T,y:Y,u:Uu};}
  REG.w03_pctrl=function(el,U){
    var S=U.S;
    U.head(el,"P CONTROL","一次遅れ（台車の速度）の比例制御 — 6 節の式と数値計算");
    var r1=U.ctrls(el);
    var kp=U.slider(r1,"比例ゲイン K<sub>P</sub>",{min:0,max:30,step:0.5,value:8,fmt:function(v){return v+" N/(m/s)";},onInput:draw});
    var ld=U.slider(r1,"測った速度の遅れ（むだ時間）L",{values:[0,0.02,0.05,0.08,0.1,0.12,0.15,0.2],value:0,fmt:function(v){return v+" s";},onInput:draw});
    var r2=U.ctrls(el);
    var uf=U.checkbox(r2,"決めた力 u<sub>0</sub> = c r を足す",true,draw);
    var sl=U.checkbox(r2,"3 s に上り坂 3°",true,draw);
    var lo=U.checkbox(r2,"荷物 1 kg（質量 2 kg）",false,draw);
    var br=U.btnrow(el);
    function set(k,l,u,s,m){kp.set(k);ld.set(l);uf.set(u);sl.set(s);lo.set(m);draw();}
    U.button(br,"本文の例（K<sub>P</sub> = 8・遅れなし）",function(){set(8,0,true,true,false);});
    U.button(br,"遅れ 0.1 s（K<sub>P</sub> = 8）",function(){set(8,0.1,true,true,false);});
    U.button(br,"遅れ 0.1 s（K<sub>P</sub> = 20）",function(){set(20,0.1,true,true,false);});
    U.button(br,"決めた力なし（K<sub>P</sub> = 8）",function(){set(8,0,false,false,false);});
    var box=U.svgbox(el),ro=U.readout(el),MP=null;
    U.ctl.drag(box,function(type,x,y){
      if(type==="up"||x==null||!MP)return;
      var inA=x>=MP[0].x-6&&x<=MP[0].x+MP[0].w+6&&y>=MP[0].y-6&&y<=MP[1].y+MP[1].h+6;
      if(type==="down"&&!inA)return false;
      kp.set(Math.round(Math.max(0,Math.min(30,MP[0].ux(x)))*2)/2);draw();
    });
    function draw(){
      var K=0.5,m=lo.get()?2:1,T=m/2,Kp=kp.get(),L=ld.get(),u0=uf.get(),sp=sl.get(),g=1+K*Kp,Tcl=T/g,d3=m*9.81*Math.sin(3*Math.PI/180);
      var finR=u0?1:K*Kp/g,eSl=K*d3/g;
      function form(t){var v=finR*(1-Math.exp(-t/Tcl));if(sp&&t>=3)v-=eSl*(1-Math.exp(-(t-3)/Tcl));return v;}
      function eInf(k){var gg=1+K*k;return (u0?0:1/gg)+(sp?K*d3/gg:0);}
      var R=_w03_psim(Kp,L,m,u0,sp);
      var nar=_w03_nar(box),Wd=nar?400:700,o=[];
      /* 左（狭い画面では上）: 比例ゲインの地図 */
      var mx=nar?52:58,mw=nar?140:200,A,B;
      if(nar){A=U.plot(mx,22,mw,80,[0,30],[0,T*1.05]);B=U.plot(mx+190,22,mw,80,[0,30],[0,Math.max(0.05,eInf(0)*1.05)]);}
      else{A=U.plot(mx,22,mw,100,[0,30],[0,T*1.05]);B=U.plot(mx,170,mw,100,[0,30],[0,Math.max(0.05,eInf(0)*1.05)]);}
      MP=[A,B];
      o.push(S.TX(A.x-30,A.y-8,"時定数 T_cl [s]","start",9.5,"signal",true));
      o.push(A.axes({xt:[0,10,20,30],yt:U.nice(0,T,2).filter(function(v){return v<=T*1.05;}),xfmt:nar?String:function(){return "";},yfmt:function(v){return _w03_sig(v,3);},ylOff:36}));
      o.push(S.TX(B.x-30,B.y-8,(sp?"坂の上の":"平らな道の")+"定常偏差 e_∞ [m/s]","start",9.5,"purple",true));
      o.push(B.axes({xt:[0,10,20,30],yt:U.nice(0,eInf(0),2).filter(function(v){return v<=eInf(0)*1.05;}),xfmt:String,yfmt:function(v){return _w03_sig(v,3);},ylOff:36}));
      if(!nar)o.push(S.TX(B.x+B.w/2,B.y+B.h+31,"比例ゲイン K_P [N/(m/s)]","middle",10,"muted"));
      var ca=[],cb=[];for(var k=0;k<=60;k++){var kk2=k/2;ca.push([kk2,T/(1+K*kk2)]);cb.push([kk2,eInf(kk2)]);}
      o.push(A.line(ca,"signal",2));o.push(B.line(cb,"purple",2));
      o.push(S.L(A.X(Kp),A.y,A.X(Kp),A.y+A.h,"ink",1,"3 3"));o.push(S.L(B.X(Kp),B.y,B.X(Kp),B.y+B.h,"ink",1,"3 3"));
      o.push(S.CIRC(A.X(Kp),A.Y(Tcl),7,"ink",2,"screen"));o.push(S.D(A.X(Kp),A.Y(Tcl),"signal",4));
      o.push(S.CIRC(B.X(Kp),B.Y(eInf(Kp)),7,"ink",2,"screen"));o.push(S.D(B.X(Kp),B.Y(eInf(Kp)),"purple",4));
      if(!nar)o.push(S.T(B.x+B.w,B.y+B.h+46,"点を左右にドラッグして変えられる","end",9,"muted"));
      /* 右（狭い画面では下）: 速度と力 */
      var rx=nar?52:330,rw=nar?336:350,ry=nar?(B.y+B.h+50):22,ymax=Math.max(1.4,Math.min(2.0,Math.ceil((Math.max.apply(null,R.y.filter(function(v){return isFinite(v);}))+0.1)*5)/5));
      var P1=U.plot(rx,ry,rw,nar?160:180,[0,6],[0,ymax]);
      if(sp)o.push(S.RECT(P1.X(3),P1.y,P1.X(6)-P1.X(3),P1.h,0,U.soft("purple"),"none",0));
      o.push(P1.axes({yl:"速度 y [m/s]",xt:[0,1,2,3,4,5,6],yt:U.nice(0,ymax,5).filter(function(v){return v<=ymax+1e-9;}),xfmt:function(){return "";},ylOff:38}));
      o.push(P1.line([[0,1],[6,1]],"muted",1.2,"5 3"));
      var fp=[];for(var i=0;i<=600;i++){var tq=6*i/600;fp.push([tq,form(tq)]);}
      o.push(P1.line(fp,"signal",1.6,"6 4"));
      o.push(_w03_stop(P1,R.t.map(function(tq,ix){return [tq,R.y[ix]];}),"signal",2.4,null,S));
      if(finR>0&&Tcl<6){o.push(S.CIRC(P1.X(Tcl),P1.Y(finR*0.632),4.5,"gold",2,"screen"));}
      if(sp)o.push(S.T(P1.X(4.5),P1.y+12,"上り坂 3°","middle",9.5,"purple",true,false,null,true));
      var P2=U.plot(rx,P1.y+P1.h+16,rw,62,[0,6],[-10,25]);
      o.push(P2.axes({xl:"時間 t [s]",yl:"力 [N]",xt:[0,1,2,3,4,5,6],yt:[-10,0,10,20],ylOff:38}));
      o.push(P2.line([[0,0],[6,0]],"faint",1));
      o.push(_w03_cut(P2,R.t.map(function(tq,ix){return [tq,R.u[ix]];}),"gold",1.6,null,S));
      o.push(S.LEGL(rx,P2.y+P2.h+46,[["signal",null,"数値計算"],["signal","6 4","6 節の式"],["gold",null,"押す力 u"]],9.5,12));
      box.set(S.svg(Wd,P2.y+P2.h+54,o));
      /* 読み出し */
      function first(th){for(var j=0;j<R.y.length&&R.t[j]<3;j++)if(R.y[j]>=th)return R.t[j];return null;}
      var t63=finR>0?first(0.632*finR):null,t95=finR>0?first(0.95*finR):null,y3=R.y[Math.min(R.y.length-1,749)],y6=R.y[R.y.length-1],grow=R.t[R.t.length-1]<5.99||Math.abs(y6)>50;
      var pk=-Infinity;for(var j2=0;j2<R.y.length&&R.t[j2]<3;j2++)pk=Math.max(pk,R.y[j2]);
      var hh="1 + K K<sub>P</sub> = 1 + 0.5 × "+Kp+" = <b>"+_w03_sig(g,4)+"</b>（K = 1/c = 0.5 (m/s)/N、T = m/c = "+T+" s）<br>";
      hh+="時定数 T<sub>cl</sub> = T ÷ (1 + K K<sub>P</sub>) = <b>"+_w03_sig(Tcl,3)+" s</b>"+(t63!=null?"（数値計算で 63.2 % に届く時刻 "+_w03_f(t63,3)+" s）":"")+"、95 % に届く時間 3T<sub>cl</sub> = "+_w03_sig(3*Tcl,3)+" s"+(t95!=null?"（数値計算 "+_w03_f(t95,3)+" s）":"")+"<br>";
      hh+=(u0?"平らな道で落ち着く速度（式）1.000 m/s":"平らな道で落ち着く速度（式）K K<sub>P</sub> ÷ (1 + K K<sub>P</sub>) = "+_w03_f(finR,3)+" m/s（定常偏差 "+_w03_f(1-finR,3)+" m/s）")+"、数値計算（3 s）"+(grow?"—":_w03_f(y3,3)+" m/s")+"<br>";
      if(sp)hh+="坂の上で落ち着く速度（式）"+(u0?"r − K d ÷ (1 + K K<sub>P</sub>)":"")+" = <b>"+_w03_f(finR-eSl,3)+" m/s</b>、数値計算（6 s）"+(grow?'<span class="warn">落ち着かない</span>':_w03_f(y6,3)+" m/s")+"<br>";
      if(L>0)hh+=(grow?'<span class="warn">振れが大きくなり続ける。</span>':"最大の速度 "+_w03_f(pk,2)+" m/s。")+'むだ時間があるので、制御器は '+L+' s 前の速度を使う。6 節の式（破線）は、この動きを表せない'+(grow?"":"（落ち着く値だけは式と一致する）");
      else hh+='<span class="ok">遅れが無いので、閉ループも一次遅れになり、数値計算と式が重なる（目標値を越えない）</span>';
      ro.innerHTML=hh+'<div class="wnote">1 章の台車（質量 '+m+' kg、c = 2 N·s/m、目標 1 m/s、坂の力 d = '+_w03_f(d3,3)+' N）。1 ms 刻みで計算した。○ は式の 63.2 % の点（時刻 T<sub>cl</sub>）。</div>';
    }
    draw();
  };
