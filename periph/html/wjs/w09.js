  /* ===== 09 章 アナログ値を正しく測る ===== */
  function _w09_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w09_rntc(tc){return 10000*Math.exp(3435*(1/(tc+273.15)-1/298.15));}
  function _w09_tntc(r){return 1/(1/298.15+Math.log(r/10000)/3435)-273.15;}
  function _w09_s(v,d){return (+v).toFixed(d).replace("-","−");}
  function _w09_pm(v,d){return (v>0?"+":"")+_w09_s(v,d);}
  function _w09_ohm(v){return v>=1e6?_w09_g(v/1e6)+" MΩ":(v>=1000?_w09_g(v/1000)+" kΩ":_w09_g(v)+" Ω");}
  function _w09_g(v){return String(+(+v).toPrecision(3));}

  /* ---- 2 節: 基準の選び方 ---- */
  REG.w09_ref=function(el,U){
    var S=U.S;
    U.head(el,"REFERENCE","基準の選び方と、電池の電圧が下がったときの温度センサの読み");
    var r1=U.ctrls(el);
    var mode=U.select(r1,"基準の選び方",["電源電圧を基準（3.0 V として換算）","(A) 内部の基準電圧を基準にする","(B) 電源電圧を基準にし、内部の基準電圧も測る"],0,draw);
    var cal=U.checkbox(r1,"工場で測った値を使う（(A)・(B)）",true,draw);
    var r2=U.ctrls(el);
    var vb=U.slider(r2,"電池の電圧（= 電源電圧）",{min:1.8,max:3.4,step:0.05,value:2.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var tt=U.slider(r2,"本当の温度",{min:-10,max:60,step:1,value:25,fmt:function(v){return v+" °C";},onInput:draw});
    var bits=U.select(r2,"分解能",[{v:"10",t:"10 ビット"},{v:"12",t:"12 ビット"}],"12",draw);
    var r3=U.ctrls(el);
    var dev=U.slider(r3,"内部の基準電圧の、製品ごとのずれ",{min:-3,max:3,step:0.1,value:1.5,fmt:function(v){return _w09_pm(v,1)+" %";},onInput:draw});
    var drift=U.slider(r3,"工場で測った後の変化（温度など）",{min:-0.5,max:0.5,step:0.05,value:0.3,fmt:function(v){return _w09_pm(v,2)+" %";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"新しい CR2032（3.0 V）",function(){vb.set(3.0);draw();});
    U.button(br,"使い終わりの CR2032（2.2 V）",function(){vb.set(2.2);draw();});
    U.button(br,"単 3 形 2 本の終わり（2.0 V）",function(){vb.set(2.0);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    /* m: 0 電源電圧, 1 (A), 2 (B)。温度センサの出力は 0.5 V + 10 mV/°C（例の値） */
    function calc(m,V,T,n,useCal,dv,dr){
      var full=Math.pow(2,n),vin=0.5+0.01*T,vbgCal=1.2*(1+dv/100),vbg=vbgCal*(1+dr/100);
      var Ncal=Math.round(vbgCal/3.0*full),vbgUsed=useCal?3.0*Ncal/full:1.2;
      var q=function(x){return Math.max(0,Math.min(full-1,Math.round(x*full)));};
      var r={vin:vin,full:full,vbg:vbg,vbgUsed:vbgUsed,Ncal:Ncal,clip:false,low:false,Nbg:null,vdd:null};
      if(m===0){r.N=q(vin/V);r.v=r.N*3.0/full;r.clip=vin>=V;}
      else if(m===1){r.N=q(vin/vbg);r.v=r.N*vbgUsed/full;r.clip=vin>=vbg;r.low=V<vbg+0.3;}
      else{r.Nbg=q(vbg/V);r.N=q(vin/V);r.vdd=vbgUsed*full/Math.max(1,r.Nbg);r.v=r.N*r.vdd/full;r.clip=vin>=V;}
      r.t=(r.v-0.5)/0.01;return r;}
    function draw(){
      var m=mode.get(),V=vb.get(),T=tt.get(),n=+bits.get(),uc=cal.get(),dv=dev.get(),dr=drift.get();
      var nar=_w09_nar(box),W=nar?400:700,o=[];
      var cols=["alias","green","signal"],names=["電源電圧（3.0 V として換算）","(A) 内部の基準電圧","(B) 内部の基準電圧も測る"];
      var curves=[0,1,2].map(function(k){var pts=[];for(var i=0;i<=64;i++){var v=3.4-1.6*i/64;var r=calc(k,v,T,n,uc,dv,dr);pts.push([v,Math.max(-20,Math.min(60,r.t-T))]);}return pts;});
      var p=U.plot(nar?56:70,24,nar?320:430,200,[3.4,1.8],[-20,60]);
      o.push(p.axes({xl:"電池の電圧（= 電源電圧）[V]",yl:"求めた温度 − 本当の温度 [°C]",xt:[3.4,3.0,2.6,2.2,1.8],yt:[-20,0,20,40,60],xfmt:function(v){return v.toFixed(1);},yfmt:function(v){return String(v).replace("-","−");},ylOff:nar?42:46}));
      o.push(S.RECT(p.X(3.0),p.y,p.X(2.2)-p.X(3.0),p.h,0,"var(--gold-soft)","none",0," fill-opacity=\"0.5\""));
      o.push(S.T(p.X(2.98),p.y+12,"CR2032 の範囲","start",9.5,"gold",true,false,null,true));
      [0,1,2].forEach(function(k){if(k!==m)o.push(p.line(curves[k],cols[k],1.2,"4 3"));});
      o.push(p.line(curves[m],cols[m],2.6));
      var cur=calc(m,V,T,n,uc,dv,dr),ey=Math.max(-20,Math.min(60,cur.t-T));
      o.push(S.D(p.X(V),p.Y(ey),cols[m],5));
      o.push(S.T(p.X(V)+(p.X(V)>p.x+p.w-90?-8:8),p.Y(ey)-8,_w09_pm(cur.t-T,2)+" °C",p.X(V)>p.x+p.w-90?"end":"start",10,cols[m],true,false,null,true));
      /* 凡例 */
      var lx=nar?56:520,ly=nar?282:40;
      [0,1,2].forEach(function(k,i){var yy=ly+i*(nar?16:22);o.push(S.L(lx,yy-4,lx+22,yy-4,cols[k],k===m?2.6:1.2,k===m?null:"4 3"));o.push(S.T(lx+28,yy,names[k],"start",9.5,cols[k],k===m));});
      box.set(S.svg(W,nar?334:270,o));
      var lsb=(m===1?cur.vbg:V)/cur.full*1000,h="";
      if(cur.clip)h+='<span class="warn">入力の電圧が基準電圧を超え、値が最大に張り付いている。</span><br>';
      if(cur.low)h+='<span class="warn">電源電圧が内部の基準電圧に近すぎる（ここでは 0.3 V 以上の差が要るとした。データシートで確かめる）。</span><br>';
      h+="温度センサの出力 = 0.5 V + 10 mV/°C × "+T+" °C = <b>"+_w09_s(cur.vin,3)+" V</b>、1 LSB = "+_w09_g(lsb)+" mV<br>";
      if(m===0)h+="ADC の値 N = round("+_w09_s(cur.vin,3)+" ÷ "+_w09_s(V,2)+" × "+cur.full+") = <b>"+cur.N+"</b> → N × 3.0 V ÷ "+cur.full+" = "+_w09_s(cur.v,4)+" V<br>";
      else if(m===1)h+="本当の内部の基準電圧 = "+_w09_s(cur.vbg*1000,1)+" mV。N = round("+_w09_s(cur.vin,3)+" ÷ "+_w09_s(cur.vbg,4)+" × "+cur.full+") = <b>"+cur.N+"</b> → N × "+_w09_s(cur.vbgUsed*1000,1)+" mV ÷ "+cur.full+" = "+_w09_s(cur.v,4)+" V<br>";
      else h+="N_bg = round("+_w09_s(cur.vbg,4)+" ÷ "+_w09_s(V,2)+" × "+cur.full+") = <b>"+cur.Nbg+"</b> → V_DD = "+_w09_s(cur.vbgUsed*1000,1)+" mV × "+cur.full+" ÷ N_bg = <b>"+_w09_s(cur.vdd*1000,1)+" mV</b>（本当は "+_w09_s(V*1000,0)+" mV）<br>"+
        "温度センサ: N = <b>"+cur.N+"</b> → N × V_DD ÷ "+cur.full+" = "+_w09_s(cur.v,4)+" V<br>";
      if(m>0)h+=(uc?"工場で測った値 N_cal = "+cur.Ncal+"（3.0 V で測った例）から、換算に使う基準電圧 = "+_w09_s(cur.vbgUsed*1000,1)+" mV":"換算に使う基準電圧 = 公称の 1200 mV")+"<br>";
      h+="求めた温度 = <b>"+_w09_s(cur.t,2)+" °C</b>（誤差 <b>"+_w09_pm(cur.t-T,2)+" °C</b>）";
      h+='<div class="wnote">誤差のグラフの破線は、選んでいないほかの方法。内部の基準電圧の値（1.2 V 前後）、ずれの大きさ、温度センサの出力は例の値で、実際の値はデータシートで確かめる。</div>';
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 4 節: サーミスタの分圧 ---- */
  REG.w09_ntc=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"THERMISTOR","サーミスタの分圧 — 比率測定と、測るときだけ流す");
    var r1=U.ctrls(el);
    var tc=U.slider(r1,"温度",{min:-20,max:80,step:1,value:25,fmt:function(v){return v+" °C";},onInput:draw});
    var rf=U.slider(r1,"固定抵抗 R_f",{values:[2200,3300,4700,10000,22000,33000,47000,100000],value:10000,fmt:_w09_ohm,onInput:draw});
    var vb=U.slider(r1,"電池の電圧（= 基準電圧）",{min:2.0,max:3.2,step:0.05,value:3.0,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var r2=U.ctrls(el);
    var src=U.select(r2,"分圧の上の端",["電源電圧（基準電圧と同じ点）","GPIO の出力（出力の抵抗 40 Ω）","別の 3.0 V の電源"],0,draw);
    var how=U.select(r2,"流し方",["つなぎっぱなし","測るときだけ（1 回 1 ms）"],1,draw);
    var iv=U.slider(r2,"測る間隔",{values:[1,10,60,600,3600],value:60,fmt:function(v){return F.time(v);},onInput:draw});
    var tol=U.slider(r2,"固定抵抗の誤差",{min:-1,max:1,step:0.1,value:0,fmt:function(v){return _w09_pm(v,1)+" %";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"4 節の例に戻す",function(){tc.set(25);rf.set(10000);vb.set(3.0);src.set(0);how.set(1);iv.set(60);tol.set(0);draw();});
    U.button(br,"つなぎっぱなしにする",function(){how.set(0);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var T=tc.get(),Rf=rf.get(),V=vb.get(),s=src.get(),sw=how.get()===1,Ti=iv.get(),Rfa=Rf*(1+tol.get()/100);
      iv.el.style.opacity=sw?"1":"0.5";
      var R=_w09_rntc(T),Vs=s===0?V:(s===1?V*(Rfa+R)/(Rfa+R+40):3.0),I=Vs/(Rfa+R),Vn=Vs*R/(Rfa+R);
      var N=Math.max(0,Math.min(4095,Math.round(Vn/V*4096))),clip=Vn>=V;
      var Rc=N>0&&N<4096?Rf*N/(4096-N):NaN,Tc=Rc>0?_w09_tntc(Rc):NaN;
      var sens=4096*3435/Math.pow(T+273.15,2)*Rf*R/Math.pow(Rf+R,2);
      var Iavg=sw?I*1e-3/Ti:I,base=2.70e-6,life=220e-3/(base+Iavg)/24/365,P=Vn*Vn/R;
      var nar=_w09_nar(box),W=nar?400:700,o=[];
      /* 左: ADC の値と温度 */
      var p=U.plot(nar?60:66,24,nar?320:330,190,[-20,80],[0,4096]);
      o.push(p.axes({xl:"温度 [°C]",yl:"ADC の値",xt:[-20,0,20,40,60,80],yt:[0,1024,2048,3072,4096],xfmt:function(v){return String(v).replace("-","−");},ylOff:48}));
      var pts=[];for(var t=-20;t<=80;t+=2){var r=_w09_rntc(t);pts.push([t,4096*r/(Rf+r)]);}
      o.push(p.line(pts,"signal",2.2));
      o.push(S.D(p.X(T),p.Y(N),"teal",5));
      o.push(S.T(p.X(T)+(T>45?-8:8),p.Y(N)-8,"N = "+N,T>45?"end":"start",10,"teal",true,false,null,true));
      /* 右: 平均電流 */
      var bx=nar?60:450,by=nar?262:40,bw=nar?300:220;
      o.push(S.T(bx,by,"平均電流（対数目盛）","start",10.5,"ink",true));
      var lx=function(a){return bx+(Math.log10(Math.max(a,1e-9))+9)/6*bw;};
      [1e-9,1e-8,1e-7,1e-6,1e-5,1e-4,1e-3].forEach(function(a){o.push(S.L(lx(a),by+10,lx(a),by+76,"grid",1));});
      [[1e-9,"1 nA"],[1e-6,"1 µA"],[1e-3,"1 mA"]].forEach(function(a){o.push(S.T(lx(a[0]),by+90,a[1],"middle",9,"muted"));});
      [["機器（01 章）",base,"green"],["分圧",Iavg,Iavg>base?"alias":"gold"]].forEach(function(b,i){var yy=by+16+i*28;
        o.push(S.RECT(bx,yy,Math.max(1,lx(b[1])-bx),18,2,U.soft(b[2]),b[2],1));
        o.push(S.T(bx+4,yy+13,b[0]+" "+F.cur(b[1]),"start",9.5,"ink",true,false,null,true));});
      box.set(S.svg(W,nar?370:250,o));
      var h="";
      if(clip)h+='<span class="warn">つなぎ目の電圧が基準電圧を超え、値が最大に張り付いている。</span><br>';
      h+="サーミスタ "+_w09_ohm(R)+"、上の端 "+_w09_s(Vs,3)+" V、つなぎ目 "+_w09_s(Vn,3)+" V → ADC の値 <b>"+N+"</b>（感度 "+_w09_g(sens)+" LSB/°C、1 LSB は "+_w09_g(1/sens)+" °C）<br>";
      h+="プログラムが求める抵抗 = R_f × N ÷ (4096 − N) = "+(isFinite(Rc)?_w09_ohm(Rc):"—")+" → 温度 <b>"+(isFinite(Tc)?_w09_s(Tc,2)+" °C":"—")+"</b>（誤差 <b>"+(isFinite(Tc)?_w09_pm(Tc-T,2)+" °C":"—")+"</b>）<br>";
      h+="分圧の電流 "+F.cur(I)+(sw?" を 1 ms、"+F.time(Ti)+" ごと → 平均 <b>"+F.cur(Iavg)+"</b>":"（つなぎっぱなし）")+"。機器と合わせて "+F.cur(base+Iavg)+"、CR2032 の電池寿命 <b>"+(life>=1?_w09_g(life)+" 年":_w09_g(life*365)+" 日")+"</b><br>";
      h+="サーミスタで熱になる電力（流している間）= "+_w09_g(P*1e6)+" µW（自己発熱。10 章 3 節）";
      h+='<div class="wnote">サーミスタは 25 °C で 10 kΩ、B 定数 3435 K（例の値）。基準電圧は電池の電圧（電源電圧）。機器の平均電流 2.70 µA は 01 章 4 節の例。測るときだけ流す場合の、コンデンサを充電する分の電荷は小さいので入れていない。</div>';
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 5 節: 標本化の時間 ---- */
  /* C_sh の電圧の時間変化。Cx = 0 なら 1 つの RC。Cx > 0 なら、ピンの電圧 p と C_sh の電圧 s の 2 つの式を固有値で解く */
  function _w09_sh(o){
    var Rs=o.Rs,Rw=o.Rsw,Cs=o.Csh,Cx=o.Cx,Vin=o.Vin;
    if(!(Cx>0)){var tau=(Rs+Rw)*Cs;return function(t,p0,s0){return {p:Vin,s:Vin+(s0-Vin)*Math.exp(-t/tau)};};}
    var a=-(1/Rs+1/Rw)/Cx,b=1/(Rw*Cx),c=1/(Rw*Cs),d=-1/(Rw*Cs);
    var tr=a+d,det=a*d-b*c,disc=Math.sqrt(Math.max(0,tr*tr/4-det)),l1=tr/2+disc,l2=tr/2-disc;
    return function(t,p0,s0){
      var y1=p0-Vin,y2=s0-Vin;
      /* 固有ベクトル (b, l - a)。y = c1 v1 e^{l1 t} + c2 v2 e^{l2 t} */
      var v1=[b,l1-a],v2=[b,l2-a],D=v1[0]*v2[1]-v1[1]*v2[0];
      var c1=(y1*v2[1]-y2*v2[0])/D,c2=(v1[0]*y2-v1[1]*y1)/D,e1=Math.exp(l1*t),e2=Math.exp(l2*t);
      return {p:Vin+c1*v1[0]*e1+c2*v2[0]*e2,s:Vin+c1*v1[1]*e1+c2*v2[1]*e2};};
  }
  REG.w09_sample=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"SAMPLE & HOLD","信号源抵抗と標本化時間 — 前のチャネルに引きずられる");
    var r1=U.ctrls(el);
    var rs=U.slider(r1,"信号源抵抗 R_s",{min:100,max:2e6,log:true,value:79600,fmt:_w09_ohm,onInput:draw});
    var ts=U.slider(r1,"標本化時間 t_s",{min:0.1,max:100,log:true,value:1.5,fmt:function(v){return _w09_g(v)+" µs";},onInput:draw});
    var bits=U.select(r1,"分解能",[{v:"10",t:"10 ビット"},{v:"12",t:"12 ビット"},{v:"14",t:"14 ビット"}],"12",draw);
    var r2=U.ctrls(el);
    var csh=U.slider(r2,"サンプル・ホールドの容量 C_sh",{min:2,max:20,step:1,value:8,fmt:function(v){return v+" pF";},onInput:draw});
    var rsw=U.slider(r2,"スイッチの抵抗 R_sw",{min:0.2,max:5,step:0.1,value:1,fmt:function(v){return _w09_s(v,1)+" kΩ";},onInput:draw});
    var cx=U.select(r2,"ピンのコンデンサ C_ext",[{v:"0",t:"なし"},{v:"1e-9",t:"1 nF"},{v:"1e-8",t:"10 nF"},{v:"1e-7",t:"100 nF"},{v:"1e-6",t:"1 µF"}],"0",draw);
    var r3=U.ctrls(el);
    var v0=U.slider(r3,"前のチャネルの電圧 V_0",{min:0,max:3.3,step:0.01,value:1.2,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var vi=U.slider(r3,"入力の電圧 V_in",{min:0,max:3.3,step:0.01,value:2.86,fmt:function(v){return v.toFixed(2)+" V";},onInput:draw});
    var dm=U.checkbox(r3,"1 回目を捨てて 2 回目を使う",false,draw);
    var br=U.btnrow(el);
    U.button(br,"5 節の例（車の分圧・1.5 µs）",function(){rs.set(79600);ts.set(1.5);bits.set("12");csh.set(8);rsw.set(1);cx.set("0");v0.set(1.2);vi.set(2.86);dm.set(false);draw();});
    U.button(br,"同じ例に 100 nF を付ける",function(){cx.set("1e-7");draw();});
    U.button(br,"サーミスタの分圧（5 kΩ）",function(){rs.set(5000);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var Rs=rs.get(),t_s=ts.get()*1e-6,n=+bits.get(),Cs=csh.get()*1e-12,Rw=rsw.get()*1e3,Cx=+cx.get(),V0=v0.get(),Vin=vi.get(),two=dm.get();
      var Vref=3.3,half=Vref/Math.pow(2,n+1),lsb=Vref/Math.pow(2,n);
      var f=_w09_sh({Rs:Rs,Rsw:Rw,Csh:Cs,Cx:Cx,Vin:Vin});
      var st1=f(t_s,Vin,V0),st=two?f(t_s,st1.p,st1.s):st1,err=st.s-Vin;
      var tau=(Rs+Rw)*Cs,tWorst=tau*Math.log(Math.pow(2,n+1)),tThis=Math.abs(Vin-V0)>half?tau*Math.log(Math.abs(Vin-V0)/half):0;
      var cNeed=(Math.pow(2,n+1)-1)*Cs;
      var nar=_w09_nar(box),W=nar?400:700,o=[];
      var tmax=Math.max(t_s*(two?2.2:1.25),1e-7);
      /* 左: C_sh の電圧 */
      var lo=Math.min(V0,Vin),hi=Math.max(V0,Vin),pad=Math.max(0.1,(hi-lo)*0.12);
      var p=U.plot(nar?60:66,24,nar?320:300,180,[0,tmax*1e6],[Math.max(0,lo-pad),Math.min(3.4,hi+pad)]);
      o.push(p.axes({xl:"時間 [µs]",yl:"コンデンサの電圧 [V]",xfmt:function(v){return _w09_g(v);},yfmt:function(v){return _w09_s(v,2);},ylOff:50}));
      o.push(p.line([[0,Vin],[tmax*1e6,Vin]],"teal",1.2,"4 3"));
      var pts=[];for(var i=0;i<=200;i++){var t=tmax*i/200,v;
        if(!two||t<=t_s)v=f(Math.min(t,t_s),Vin,V0).s;else v=f(Math.min(t-t_s,t_s),st1.p,st1.s).s;
        if(!two&&t>t_s)v=st1.s;if(two&&t>2*t_s)v=st.s;pts.push([t*1e6,v]);}
      o.push(p.line(pts,"signal",2.2));
      o.push(S.L(p.X(t_s*1e6),p.y,p.X(t_s*1e6),p.y+p.h,"gold",1.3,"4 3"));
      if(two)o.push(S.L(p.X(2*t_s*1e6),p.y,p.X(2*t_s*1e6),p.y+p.h,"gold",1.3,"4 3"));
      o.push(S.T(p.X(t_s*1e6)+4,p.y+12,"t_s","start",9.5,"gold",true,false,null,true));
      o.push(S.T(p.x+p.w-4,p.Y(Vin)-6,"V_in","end",9.5,"teal",true,false,null,true));
      /* 右: 残りの差（対数） */
      var q=U.plot(nar?60:450,nar?262:24,nar?320:230,nar?150:180,[0,tmax*1e6],[1e-5,10],{ylog:true});
      o.push(q.axes({xl:"時間 [µs]",yl:"残りの差",yt:[1e-5,1e-3,1e-1,10],xfmt:function(v){return _w09_g(v);},yfmt:function(v){return v>=1?v+" V":(v>=1e-3?v*1e3+" mV":v*1e6+" µV");},ylOff:50}));
      o.push(q.line([[0,half],[tmax*1e6,half]],"alias",1.2,"5 3"));
      o.push(S.T(q.x+q.w-4,q.Y(half)+13,"1/2 LSB","end",9.5,"alias",true,false,null,true));
      o.push(q.line(pts.map(function(a){return [a[0],Math.max(1e-5,Math.min(10,Math.abs(a[1]-Vin)))];}),"signal",2));
      box.set(S.svg(W,nar?450:250,o));
      var ok=Math.abs(err)<=half,h="";
      h+="時定数 (R_s + R_sw) C_sh = "+F.time(tau)+(Cx>0?"（ピンのコンデンサがあるので、実際は下の 2 つの式を解いた値）":"")+"<br>";
      h+=(two?"2 回目の":"")+"標本化の終わりの電圧 "+_w09_s(st.s,4)+" V、誤差 <b>"+_w09_pm(err*1000,2)+" mV（"+_w09_pm(err/lsb,1)+" LSB）</b> → "+(ok?'<span class="ok">1/2 LSB 以内</span>':'<span class="warn">1/2 LSB を超える</span>')+"<br>";
      h+="要る標本化時間（ピンのコンデンサなし）: 差が基準電圧いっぱいのとき <b>"+F.time(tWorst)+"</b>、いまの差 "+_w09_s(Math.abs(Vin-V0),2)+" V なら "+F.time(tThis)+"<br>";
      h+="ピンのコンデンサで誤差を 1/2 LSB 以内にするには C_ext ≥ (2^(n+1) − 1) C_sh = <b>"+_w09_g(cNeed*1e9)+" nF</b>"+(Cx>0?"。付けたコンデンサが元に戻るまでの時定数 R_s C_ext = "+F.time(Rs*Cx):"");
      h+='<div class="wnote">基準電圧は 3.3 V とした。ピンのコンデンサは、標本化の前に入力の電圧まで充電されているとした。C_sh・R_sw の値は例の値で、実際の値はデータシートで確かめる。</div>';
      ro.innerHTML=h;
    }
    draw();
  };

  /* ---- 6 節: 平均化とノイズ ---- */
  REG.w09_avg=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"AVERAGING","平均化 — ランダムなノイズ・周期的なノイズ・オーバーサンプリング");
    var r1=U.ctrls(el);
    var sg=U.slider(r1,"ランダムなノイズ σ",{min:0,max:5,step:0.1,value:3,fmt:function(v){return _w09_s(v,1)+" LSB";},onInput:draw});
    var nn=U.slider(r1,"平均の回数 N",{values:[1,2,4,8,16,20,32,64,100,128,256],value:16,fmt:function(v){return v+" 回";},onInput:draw});
    var fr=U.slider(r1,"本当の入力",{min:1000,max:1001,step:0.05,value:1000.3,fmt:function(v){return _w09_s(v,2)+" LSB";},onInput:draw});
    var r2=U.ctrls(el);
    var pf=U.select(r2,"周期的なノイズ",["なし","50 Hz","60 Hz","1 MHz（スイッチング電源）"],0,draw);
    var pa=U.slider(r2,"その振幅",{min:0,max:10,step:0.5,value:4,fmt:function(v){return _w09_s(v,1)+" LSB";},onInput:draw});
    var dl=U.slider(r2,"測る間隔 Δ",{values:[1e-6,2e-6,5e-6,1e-5,1.025e-5,1e-4,1e-3,5e-3],value:1e-3,fmt:function(v){return F.time(v,4);},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"50 Hz を 1 ms ごとに 16 回（16 ms）",function(){sg.set(0.5);pf.set(1);pa.set(4);dl.set(1e-3);nn.set(16);draw();});
    U.button(br,"50 Hz を 5 ms ごとに 20 回（100 ms）",function(){sg.set(0.5);pf.set(1);pa.set(4);dl.set(5e-3);nn.set(20);draw();});
    U.button(br,"1 MHz を 10 µs ごと",function(){sg.set(0.5);pf.set(3);pa.set(4);dl.set(1e-5);nn.set(64);draw();});
    U.button(br,"ノイズ 0 で 256 回",function(){sg.set(0);pf.set(0);nn.set(256);fr.set(1000.3);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var sig=sg.get(),N=nn.get(),xt=fr.get(),fk=pf.get(),A=fk?pa.get():0,f=[0,50,60,1e6][fk],D=dl.get();
      pa.el.style.opacity=fk?"1":"0.5";
      var R=U.rng(seed*7919+13),M=200,avgs=[],firsts=[],run0=[],k4=Math.round(Math.log(N)/Math.log(4)),isPow4=Math.pow(4,k4)===N&&N>1;
      for(var m=0;m<M;m++){var ph=R.range(0,2*Math.PI),sum=0;
        for(var k=0;k<N;k++){var x=Math.round(xt+A*Math.sin(ph+2*Math.PI*f*D*k)+sig*R.normal());sum+=x;if(m===0)run0.push(x);if(k===0)firsts.push(x);}
        avgs.push(isPow4?Math.floor((sum+Math.pow(2,k4-1))/Math.pow(2,k4))/Math.pow(2,k4):sum/N);}
      var mean=function(a){return a.reduce(function(s,v){return s+v;},0)/a.length;},sd=function(a){var mu=mean(a);return Math.sqrt(a.reduce(function(s,v){return s+(v-mu)*(v-mu);},0)/a.length);};
      var fd=f*D,alias=fk&&Math.abs(fd-Math.round(fd))<1e-9,rres=!fk?0:(alias?1:Math.abs(Math.sin(Math.PI*f*N*D)/(N*Math.sin(Math.PI*f*D))));
      var theo=Math.sqrt(sig*sig/N+A*A*rres*rres/2);
      var nar=_w09_nar(box),W=nar?400:700,o=[];
      /* 上: 1 回目の試行の値 */
      var lo=Math.floor(xt-Math.max(3*sig+A,1.5)),hi=Math.ceil(xt+Math.max(3*sig+A,1.5));
      var p=U.plot(nar?60:66,24,nar?320:610,120,[0,N],[lo,hi]);
      var stp=[1,2,5,10,20,50,100].filter(function(v){return v>=N/6;})[0]||100,xts=[];for(var xv=0;xv<=N;xv+=stp)xts.push(xv);
      o.push(p.axes({xl:"測った順番（1 回目の試行）",yl:"ADC の値",ny:4,xt:xts,xfmt:function(v){return String(v);},yfmt:function(v){return String(v);},ylOff:50}));
      o.push(p.line([[0,xt],[N,xt]],"green",1.3,"6 4"));
      run0.forEach(function(v,i){o.push(S.D(p.X(i+0.5),p.Y(v),"teal",N>100?1.6:2.6));});
      o.push(p.line([[0,avgs[0]],[N,avgs[0]]],"signal",2.6));
      /* 下: 平均の分布 */
      var y2=nar?196:200,q=U.plot(nar?60:66,y2,nar?320:610,90,[lo,hi],[0,1]);
      o.push(q.axes({xl:"値 [LSB]（"+M+" 回の試行）",yt:[],xfmt:function(v){return String(v);}}));
      var bw=Math.max(0.05,(hi-lo)/80),hist=function(arr){var b={},mx=0;arr.forEach(function(v){var k=Math.floor((v-lo)/bw);b[k]=(b[k]||0)+1;});for(var k in b)mx=Math.max(mx,b[k]);return {b:b,mx:mx};};
      var h1=hist(firsts),h2=hist(avgs),mx=Math.max(h1.mx,h2.mx);
      [[h1,"teal"],[h2,"signal"]].forEach(function(z){for(var k in z[0].b){var x0=lo+k*bw,hh=z[0].b[k]/mx;o.push(S.RECT(q.X(x0),q.Y(hh),Math.max(0.6,q.X(x0+bw)-q.X(x0)),q.Y(0)-q.Y(hh),0,U.soft(z[1]),z[1],0.7));}});
      o.push(S.L(q.X(xt),q.y,q.X(xt),q.y+q.h,"green",1.4,"5 3"));
      o.push(S.T(q.x+4,q.y+12,"1 回の値","start",9.5,"teal",true,false,null,true));
      o.push(S.T(q.x+4,q.y+26,N+" 回の平均","start",9.5,"signal",true,false,null,true));
      box.set(S.svg(W,y2+130,o));
      var h="";
      h+="平均の値の平均 − 本当の入力 = <b>"+_w09_pm(mean(avgs)-xt,3)+" LSB</b>（偏り）、平均のばらつき σ = <b>"+_w09_s(sd(avgs),3)+" LSB</b>（"+M+" 回の試行）<br>";
      h+="式の値: √(σ² ÷ N + 周期的なノイズの残り² ÷ 2) = "+_w09_s(theo,3)+" LSB（ランダムな分 σ ÷ √N = "+_w09_s(sig/Math.sqrt(N),3)+" LSB）<br>";
      if(fk)h+="周期的なノイズ: f Δ = "+_w09_g(fd)+"、平均をとる時間 N Δ = "+F.time(N*D,4)+" → 残る割合（最大）<b>"+_w09_s(rres*100,1)+" %</b>"+(alias?'（<span class="warn">f Δ が整数: 毎回同じ位相で減らない</span>）':(Math.abs(f*N*D-Math.round(f*N*D))<1e-9?'（<span class="ok">周期の整数倍で 0</span>）':""))+"<br>";
      if(isPow4)h+="オーバーサンプリング: "+N+" = 4^"+k4+" 回の和を "+k4+" ビット右にずらすと "+(12+k4)+" ビットの値（1 LSB の 1/"+Math.pow(2,k4)+" の目盛）<br>";
      if(sig<0.3&&!fk)h+='<span class="warn">ランダムなノイズが小さく、毎回ほぼ同じ値が出るので、平均しても 1 LSB より細かくならない。</span>';
      h+='<div class="wnote">ADC の値は、本当の入力に周期的なノイズとランダムなノイズを足して、最も近い整数に丸めたもの。周期的なノイズの位相は、試行ごとに乱数で決めた。</div>';
      ro.innerHTML=h;
    }
    draw();
  };
