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
    var ob=U.select(r1,"対象",_W03_OBJ.map(function(o){return o.nm;}),0,function(){kept=[];tt.set(1);draw();});
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
      q.push(S.T(gx2,gy+gh+46,"残り "+_w03_f(100*Math.exp(-t/T),1)+" %、変わる速さ "+_w03_sig(sl,3)+" "+o.ru,"start",9.5,"purple",true));
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
      g.push(S.LEGL(xo,p.y+p.h+50,leg,9.5,14));
      box.set(S.svg(Wd,p.y+p.h+58,g));
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
