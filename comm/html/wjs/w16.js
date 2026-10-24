  /* ===== 16 章 BLE の全体像 ===== */
  /* チャネルの番号 → 中心の周波数 [MHz] */
  function _w16_f(i){if(i===37)return 2402;if(i===38)return 2426;if(i===39)return 2480;return i<=10?2404+2*i:2406+2*i;}
  /* BLE のチャネル（中心 f、±1 MHz）と、中心 fc・幅 w の Wi-Fi の信号の関係 */
  function _w16_rel(f,fc,w){var d=Math.abs(f-fc);if(d<=w/2-1)return "over";if(d<w/2+1)return "edge";return "clear";}
  /* Wi-Fi の AP の信号: 40 MHz は主のチャネルの上か下の 20 MHz を足す（09 章のデモと同じく、7 以下なら上） */
  function _w16_sig(ch,w){var f=2407+5*ch;if(w===40)f+=ch<=7?10:-10;return {ch:ch,f:f,w:w};}
  /* チャネル選択アルゴリズム #2 の擬似乱数（Core Specification の手順。Zephyr の lll_chan.c と同じ計算） */
  function _w16_rev8(b){var r=0;for(var i=0;i<8;i++)r=(r<<1)|((b>>i)&1);return r;}
  function _w16_perm(i){return (_w16_rev8((i>>8)&255)<<8)|_w16_rev8(i&255);}
  function _w16_prn(counter,cid){var p=(counter^cid)&65535;for(var k=0;k<3;k++){p=_w16_perm(p);p=(p*17+cid)&65535;}return (p^cid)&65535;}
  /* 接続イベント n 回分のチャネル。used はチャネルの番号の配列（小さい順）。返り値 [{u, c, rm}] */
  function _w16_seq(alg,hop,used,cid,n){
    var isU={},N=used.length,out=[],last=0;used.forEach(function(c){isU[c]=true;});
    for(var k=0;k<n;k++){
      if(alg===0){var u=(last+hop)%37;last=u;out.push(isU[u]?{u:u,c:u,rm:false}:{u:u,c:used[u%N],rm:true});}
      else{var pe=_w16_prn(k,cid),u2=pe%37;out.push(isU[u2]?{u:u2,c:u2,rm:false}:{u:u2,c:used[Math.floor(N*pe/65536)],rm:true});}
    }
    return out;
  }

  /* ---- 2 節: Wi-Fi の AP のチャネルと BLE のチャネルの重なり ---- */
  REG.w16_band=function(el,U){
    var S=U.S;
    U.head(el,"BAND","Wi-Fi の AP のチャネルと、BLE のチャネルの重なり");
    var chs=[{v:"0",t:"なし"}];for(var n=1;n<=13;n++)chs.push({v:String(n),t:n+"（"+(2407+5*n)+" MHz）"});
    var row=U.ctrls(el);
    var a1=U.select(row,"Wi-Fi の AP 1",chs,"1",draw);
    var a2=U.select(row,"AP 2",chs,"6",draw);
    var a3=U.select(row,"AP 3",chs,"11",draw);
    var row2=U.ctrls(el);
    var wd=U.select(row2,"Wi-Fi の信号の幅",[{v:"20",t:"20 MHz（802.11g・n）"},{v:"22",t:"22 MHz（802.11b）"},{v:"40",t:"40 MHz（802.11n、2 チャネル分）"}],"20",draw);
    var br=U.btnrow(el);
    function ex(x,y,z,w){a1.set(String(x));a2.set(String(y));a3.set(String(z));wd.set(String(w));draw();}
    U.button(br,"1・6・11（よくある組）",function(){ex(1,6,11,20);});
    U.button(br,"6 だけ",function(){ex(0,6,0,20);});
    U.button(br,"1・7・13",function(){ex(1,7,13,20);});
    U.button(br,"40 MHz の AP が 1 台",function(){ex(3,0,0,40);});
    U.button(br,"Wi-Fi なし",function(){ex(0,0,0,20);});
    var box=U.svgbox(el); var ro=U.readout(el);
    var COL={over:"alias",edge:"gold",clear:"green"},NAME={over:"重なる",edge:"端にかかる",clear:"重ならない"};
    function draw(){
      var w=+wd.get(),aps=[];
      [a1,a2,a3].forEach(function(s,k){var c=+s.get();if(c>0)aps.push({s:_w16_sig(c,w),name:"AP "+(k+1)});});
      var W=700,o=[],p=U.plot(70,0,610,1,[2400,2484],[0,1]),yt=40,yb=112;
      o.push(S.RECT(p.X(2400),24,p.X(2483.5)-p.X(2400),yb-24,0,"var(--screen)","none",0));
      o.push(S.T(p.X(2400)+4,36,"2.4 GHz 帯","start",9.5,"muted"));
      aps.forEach(function(a,k){var s=a.s,e=Math.min(2,s.w*0.12),y=yt+k*12;
        o.push(S.PL([[p.X(s.f-s.w/2),yb],[p.X(s.f-s.w/2+e),y],[p.X(s.f+s.w/2-e),y],[p.X(s.f+s.w/2),yb]],"muted",1.4,"var(--muted-soft)",null,0.5));
        o.push(S.T(p.X(s.f),y+18,a.name+"（"+s.ch+(w===40?(s.ch<=7?"+上":"+下"):"")+"）","middle",10,"ink",true,false,null,true));
        [s.f-s.w/2,s.f+s.w/2].forEach(function(fe){o.push(S.L(p.X(fe),yb,p.X(fe),yb+42,"faint",1,"3 3"));});});
      var st=[],cnt={over:0,edge:0,clear:0},clr=[];
      for(var i=0;i<40;i++){var f=_w16_f(i),r="clear";
        aps.forEach(function(a){var q=_w16_rel(f,a.s.f,a.s.w);if(q==="over")r="over";else if(q==="edge"&&r!=="over")r="edge";});
        st.push(r);if(i<37){cnt[r]++;if(r==="clear")clr.push(i);}
        var x0=p.X(f-0.9),x1=p.X(f+0.9),adv=i>=37;
        o.push(S.RECT(x0,yb+10,x1-x0,24,2,U.soft(COL[r]),COL[r],adv?2.2:1));
        o.push(S.T((x0+x1)/2,yb+47,String(i),"middle",8.5,adv?"purple":COL[r],adv,true));}
      o.push(S.T(62,yb+26,"BLE","end",10,"ink",true));o.push(S.T(62,yb+47,"番号","end",9,"muted"));
      var ya=yb+58;o.push(S.L(p.X(2400),ya,p.X(2484),ya,"muted",1.1));
      [2400,2420,2440,2460,2480].forEach(function(fr){o.push(S.L(p.X(fr),ya,p.X(fr),ya+4,"muted",1));o.push(S.T(p.X(fr),ya+16,String(fr),"middle",9.5,"muted"));});
      o.push(S.T(p.X(2484),ya+30,"周波数 [MHz]","end",9.5,"muted"));
      var lx=70;[["over","重なる"],["edge","端にかかる"],["clear","重ならない"]].forEach(function(L){
        o.push(S.RECT(lx,ya+40,10,10,2,U.soft(COL[L[0]]),COL[L[0]],1.2));o.push(S.T(lx+15,ya+49,L[1],"start",10,COL[L[0]],true));lx+=U.tw(L[1],10)+40;});
      o.push(S.T(lx,ya+49,"太枠: アドバタイズチャネル（37・38・39 番）","start",10,"purple"));
      box.set(S.svg(W,ya+60,o));
      var adv=[37,38,39].map(function(i){return i+" 番（"+_w16_f(i)+" MHz）: <b style=\"color:var(--"+(COL[st[i]]==="alias"?"alias":COL[st[i]])+")\">"+NAME[st[i]]+"</b>";}).join("、");
      ro.innerHTML=(aps.length?"":"近くに Wi-Fi の AP は無い。<br>")+
        "データチャネル 37 本: <span class=\"warn\">重なる "+cnt.over+" 本</span> ・ <b style=\"color:var(--gold)\">端にかかる "+cnt.edge+" 本</b> ・ <span class=\"ok\">重ならない "+cnt.clear+" 本</span>"+
        (clr.length&&clr.length<37?"（"+clr.join("・")+" 番）":"")+"<br>アドバタイズチャネル: "+adv+
        '<div class="wnote">BLE の信号は中心から ±1 MHz、Wi-Fi の信号は台形の幅（中心から ±幅/2）とみなした。実際の Wi-Fi の信号の裾はもっと広いので、この数え方は目安である。</div>';
    }
    draw();
  };

  /* ---- 3 節: PHY の比較 ---- */
  var _w16_PHY=[{n:"LE 1M",rs:1,S:1,c:"signal"},{n:"LE 2M",rs:2,S:1,c:"purple"},{n:"LE Coded S = 2",rs:1,S:2,c:"teal"},{n:"LE Coded S = 8",rs:1,S:8,c:"green"}];
  function _w16_Phi(x){var t=1/(1+0.2316419*Math.abs(x)),d=0.3989423*Math.exp(-x*x/2),p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>=0?1-p:p;}
  function _w16_gtrace(bits,t){var sg=Math.sqrt(Math.log(2))/(2*Math.PI*0.5),v=0,ext=[bits[0],bits[0],bits[0]].concat(bits,[bits[bits.length-1],bits[bits.length-1],bits[bits.length-1]]);
    for(var k=0;k<ext.length;k++){var a=ext[k]?1:-1,t0=k-3;v+=a*(_w16_Phi((t-t0)/sg)-_w16_Phi((t-t0-1)/sg));}return v;}
  REG.w16_phy=function(el,U){
    var S=U.S;
    U.head(el,"PHY","PHY ごとの周波数の動き・1 ビットの時間・届く距離の比");
    var row=U.ctrls(el);
    var ph=U.seg(row,_w16_PHY.map(function(q){return q.n;}),0,draw);
    var row2=U.ctrls(el);
    var by=U.textin(row2,"送るバイト（16 進）","4D",draw);
    var nn=U.slider(row2,"電波の弱まり方 n（P ∝ 1/dⁿ）",{values:[2,2.5,3,3.5,4],value:2,fmt:function(v){return v+(v===2?"（何もない空間）":v===3?"（建物の中の目安）":"");},onInput:draw});
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var q=_w16_PHY[ph.get()],tb=q.S/q.rs,n=nn.get(),warn="",txt=by.get().trim().replace(/^0x/i,"");
      var v=parseInt(txt,16);if(!/^[0-9a-fA-F]{1,2}$/.test(txt)||isNaN(v)){warn='<span class="warn">1 バイトの 16 進（00〜FF）を入れること。0x4D で表示した。</span><br>';v=0x4D;}
      var bits=[];for(var i=0;i<8;i++)bits.push((v>>i)&1);       /* 最下位ビットから送る */
      var W=700,o=[],x0=118,x1=618,T8=8*tb,X=function(t){return x0+(x1-x0)*t/T8;};
      o.push(S.T(x0,16,q.n+": 0x"+U.fmt.hex(v)+" を最下位ビットから送る（8 ビットで "+U.sig(T8,3)+" µs）","start",10.5,q.c,true));
      bits.forEach(function(b,k){o.push(S.RECT(X(k*tb)+1,24,X((k+1)*tb)-X(k*tb)-2,22,3,b?U.soft(q.c):"var(--panel)",b?q.c:"var(--line)",1));
        o.push(S.T((X(k*tb)+X((k+1)*tb))/2,40,String(b),"middle",11,b?q.c:"muted",true,true));});
      o.push(S.T(x0-10,40,"ビット","end",10,"ink",true));
      var yc=104,A=36;
      if(q.S===1){
        var dev=250*q.rs,Ay=A*dev/500;      /* 縦軸は ±500 kHz を ±A で描く */
        o.push(S.T(x0-10,yc-8,"周波数","end",10,"ink",true));o.push(S.T(x0-10,yc+7,"のずれ","end",10,"ink",true));
        o.push(S.L(x0,yc,x1,yc,"muted",1.1));
        [500,250,-250,-500].forEach(function(kh){var yy=yc-A*kh/500;o.push(S.L(x0,yy,x1,yy,"grid",1));o.push(S.T(x1+4,yy+3,(kh>0?"+":"−")+Math.abs(kh)+" kHz","start",9,"muted"));});
        var pts=[];for(var s=0;s<=8*40;s++){var t=s/40;pts.push([X(t*tb),yc-Ay*_w16_gtrace(bits,t)]);}
        o.push(S.PL(pts,q.c,2.4));
        o.push(S.T(x0,yc+A+16,"1 シンボル = 1 ビット = "+U.sig(tb,2)+" µs。周波数のずれは ±"+dev+" kHz（変調指数 0.5 のとき）","start",9.5,"muted"));
      }else{
        o.push(S.T(x0-10,yc-4,"シンボル","end",10,"ink",true));
        for(var k=0;k<8;k++)for(var j=0;j<q.S;j++){var a=X(k*tb+j),e=X(k*tb+j+1);
          o.push(S.RECT(a+0.5,yc-18,Math.max(0.5,e-a-1),30,1,U.soft(q.c),q.c,0.6));}
        o.push(S.T(x0,yc+A+2,"1 ビットを "+q.S+" シンボル（1 シンボル 1 µs）で送る。シンボルの並びは誤り訂正の符号で決まる（ここでは区切りだけを描いた）","start",9.5,"muted"));
      }
      /* 4 つの PHY の 8 ビットの時間の比較 */
      var yb0=yc+A+34,Xc=function(t){return x0+(x1-x0)*t/64;};
      o.push(S.T(x0-10,yb0+12,"8 ビットの","end",10,"ink",true));o.push(S.T(x0-10,yb0+26,"時間","end",10,"ink",true));
      _w16_PHY.forEach(function(r,k){var t=8*r.S/r.rs,y=yb0+k*18,sel=r===q;
        o.push(S.RECT(x0,y,Xc(t)-x0,13,2,U.soft(r.c),r.c,sel?2.2:1));
        var lab=r.n+"  "+U.sig(t,3)+" µs",inside=Xc(t)+6+U.tw(lab,9.5)>W-6;
        o.push(S.T(inside?Xc(t)-6:Xc(t)+6,y+11,lab,inside?"end":"start",9.5,r.c,sel,false,null,inside));});
      var ya=yb0+4*18+4;o.push(S.L(x0,ya,x1,ya,"muted",1));
      [0,16,32,48,64].forEach(function(t){o.push(S.L(Xc(t),ya,Xc(t),ya+4,"muted",1));o.push(S.T(Xc(t),ya+15,String(t),"middle",9,"muted"));});
      o.push(S.T(x1,ya+28,"時間 [µs]","end",9.5,"muted"));
      box.set(S.svg(W,ya+34,o));
      var rows=_w16_PHY.map(function(r){var t=r.S/r.rs,db=-10*Math.log10(t),sel=r===q,b=function(s){return sel?"<b>"+s+"</b>":s;};
        return [b('<span style="color:var(--'+r.c+')">'+r.n+'</span>'),b(r.rs+" Msym/s"),b(String(r.S)),b(U.fmt.rate(r.rs*1e6/r.S)),b(U.sig(t,2)+" µs"),
          b((db>0.05?"+":db<-0.05?"−":"")+Math.abs(db).toFixed(1)+" dB"),b(Math.pow(t,1/n).toFixed(2)+" 倍")];});
      ro.innerHTML=warn+U.tbl(["PHY","シンボルの速さ","S","ビットレート","ビット時間","要る受信電力","届く距離（n = "+n+"）"],rows,["left","right","center","right","right","right","right"])+
        '<div class="wnote">S は 1 ビットを送るシンボルの数。要る受信電力は LE 1M との差で、ビット時間に反比例するとして 10 log₁₀ で dB にした。届く距離は LE 1M を 1 とした比で、ビット時間の 1/n 乗に比例するとした見積もり。LE Coded の誤り訂正の符号の効果は含めていない。</div>';
    }
    draw();
  };

  /* ---- 6 節: チャネル選択アルゴリズム ---- */
  REG.w16_hop=function(el,U){
    var S=U.S;
    U.head(el,"HOP","チャネル選択アルゴリズムとチャネルマップ");
    var map=[];for(var i=0;i<37;i++)map.push(true);
    var seed=1,cid=0x305F,msg="";
    var row=U.ctrls(el);
    var hop=U.slider(row,"ホップ量 h（#1 で使う）",{min:5,max:16,step:1,value:7,onInput:draw});
    var ne=U.select(row,"表示する接続イベントの数",[{v:"37",t:"37 回"},{v:"74",t:"74 回"},{v:"111",t:"111 回"}],"37",draw);
    var row2=U.ctrls(el);
    var alg=U.seg(row2,["#1（4.0 から）","#2（5.0 から。比較用）"],0,draw);
    var br=U.btnrow(el);
    function setUsed(list){for(var i=0;i<37;i++)map[i]=list.indexOf(i)>=0;msg="";draw();}
    var WIFI=[0,1,2,3,4,5,6,7,8,11,12,13,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32];
    U.button(br,"全部使う",function(){setUsed(Array.apply(null,{length:37}).map(function(_,i){return i;}));});
    U.button(br,"Wi-Fi 1・6・11 に重なる 28 本を外す",function(){setUsed([9,10,21,22,23,33,34,35,36]);});
    U.button(br,"Wi-Fi 6 に重なる 10 本を外す",function(){var a=[];for(var i=0;i<37;i++)if(i<11||i>20)a.push(i);setUsed(a);});
    U.button(br,"2 本だけ使う（10・36 番）",function(){setUsed([10,36]);});
    U.button(br,"別の接続にする（#2 の値を変える）",function(){seed++;cid=U.rng(seed*7919).int(65536);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    box.el.addEventListener("click",function(ev){var t=ev.target.closest?ev.target.closest("[data-ch]"):null;if(!t)return;
      var i=+t.getAttribute("data-ch"),n=map.filter(Boolean).length;
      if(map[i]&&n<=2){msg='<span class="warn">使うチャネルは 2 本以上残す決まりなので、これ以上は外せない。</span><br>';draw();return;}
      map[i]=!map[i];msg="";draw();});
    function draw(){
      var used=[];for(var i=0;i<37;i++)if(map[i])used.push(i);
      var a=alg.get(),h=hop.get(),E=+ne.get(),N=used.length,sq=_w16_seq(a,h,used,cid,E);
      var W=700,o=[],x0=64,cw=16.4,yc=40;
      /* Wi-Fi 1・6・11 の範囲の目安 */
      [[0,9,"Wi-Fi 1"],[11,20,"Wi-Fi 6"],[23,33,"Wi-Fi 11"]].forEach(function(r){var xa=x0+r[0]*cw+1,xb=x0+(r[1]+1)*cw-1;
        o.push(S.RECT(xa,14,xb-xa,8,2,"var(--muted-soft)","muted",0.8));o.push(S.T((xa+xb)/2,11,r[2],"middle",9,"muted"));});
      for(var c=0;c<37;c++){var u=map[c],col=u?"green":"alias";
        o.push('<g data-ch="'+c+'" style="cursor:pointer">'+S.RECT(x0+c*cw+1,yc-12,cw-2,24,2,U.soft(col),col,u?1.3:0.8)+
          S.T(x0+c*cw+cw/2,yc+4,String(c),"middle",8.5,col,u,true)+'</g>');}
      o.push(S.T(x0-6,yc+4,"マップ","end",9.5,"ink",true));
      o.push(S.T(x0,yc+28,"升目を押すと、使う（緑）・使わない（赤）が切り替わる","start",9.5,"muted"));
      /* 接続イベントごとのチャネル */
      var p=U.plot(x0+4,yc+48,600,200,[0,E+1],[-1,37]);
      o.push(p.axes({xl:"接続イベント（何回目か）",yl:"チャネルの番号",xt:E===37?[1,10,20,30,37]:(E===74?[1,20,40,60,74]:[1,30,60,90,111]),yt:[0,9,18,27,36],
        xfmt:function(v){return String(v);},yfmt:function(v){return String(v);}}));
      o.push(p.line(sq.map(function(s,k){return [k+1,s.c];}),"faint",1));
      sq.forEach(function(s,k){var x=p.X(k+1);
        if(s.rm){o.push(S.CIRC(x,p.Y(s.u),2.2,"alias",0.9));o.push(S.L(x,p.Y(s.u),x,p.Y(s.c),"gold",0.8,"2 2"));o.push(S.D(x,p.Y(s.c),"gold",E>74?2.4:3));}
        else o.push(S.D(x,p.Y(s.c),"signal",E>74?2.4:3));});
      /* 使った回数 */
      var cnt=[];for(var c2=0;c2<37;c2++)cnt.push(0);sq.forEach(function(s){cnt[s.c]++;});
      var mx=Math.max.apply(null,cnt),yh=yc+362,hh=54;
      o.push(S.T(x0-6,yh-hh/2,"使った","end",9.5,"ink",true));o.push(S.T(x0-6,yh-hh/2+13,"回数","end",9.5,"ink",true));
      for(var c3=0;c3<37;c3++){var bh=mx?hh*cnt[c3]/mx:0;
        if(cnt[c3])o.push(S.RECT(x0+c3*cw+2,yh-bh,cw-4,bh,1,U.soft("green"),"green",1));
        o.push(S.T(x0+c3*cw+cw/2,yh+12,String(c3),"middle",8,map[c3]?"green":"faint",false,true));
        if(cnt[c3]&&mx<=99)o.push(S.T(x0+c3*cw+cw/2,yh-bh-3,String(cnt[c3]),"middle",8,"ink"));}
      o.push(S.L(x0,yh,x0+37*cw,yh,"muted",1));
      var lg=yh+30;
      o.push(S.D(x0+6,lg-4,"signal",3.5));o.push(S.T(x0+14,lg,"そのまま使った","start",9.5,"signal"));
      o.push(S.D(x0+124,lg-4,"gold",3.5));o.push(S.T(x0+132,lg,"割り当て直した","start",9.5,"gold"));
      o.push(S.CIRC(x0+242,lg-4,2.6,"alias",1));o.push(S.T(x0+250,lg,"割り当て直す前の番号（使わないチャネル）","start",9.5,"alias"));
      box.set(S.svg(W,lg+8,o));
      /* 読み出し */
      var rm=0,same=0;sq.forEach(function(s,k){if(s.rm)rm++;if(k&&s.c===sq[k-1].c)same++;});
      var uc=used.map(function(c){return cnt[c];}),mn=Math.min.apply(null,uc),mxu=Math.max.apply(null,uc);
      var first=sq.slice(0,12).map(function(s){return s.rm?'<span style="color:var(--gold)">'+s.u+"→"+s.c+"</span>":String(s.c);}).join(" ・ ");
      var note="";
      if(a===0&&N<37&&h%N===0)note='<br><span class="warn">h = '+h+' が N = '+N+' で割り切れるので、割り当て直しが続くと同じチャネルが続く。</span>';
      if(a===0&&N===37)note='<br>使わないチャネルが無いので、37 回で 37 本を 1 回ずつ使い、38 回目からは同じ列を繰り返す。';
      ro.innerHTML=msg+"使うチャネル N = <b>"+N+"</b> 本"+(N<37?"（"+used.join("・")+" 番）":"")+"<br>"+
        "1〜12 回目: "+first+"（金は 割り当て直す前 → 使ったチャネル）<br>"+
        "割り当て直した回数 <b>"+rm+"</b> / "+E+" 回 ・ 続く 2 回で同じチャネルになった回数 <b>"+same+"</b> / "+(E-1)+" ・ 使うチャネルごとの使った回数: 最少 "+mn+" 回、最多 "+mxu+" 回"+
        (a===1?"<br>#2 の接続ごとの 16 ビットの値 = 0x"+U.fmt.hex(cid,4)+(cid===0x305F?"（Core Specification の計算例と同じ値。全部使うとき 1〜4 回目は 25・20・6・21 番）":""):"")+note;
    }
    draw();
  };
