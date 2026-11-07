  /* ===== 20 章 BLE のセキュリティ ===== */
  /* AES-128 の 1 ブロック暗号化（RPA の hash の計算に使う。FIPS-197 の例と Core Specification の ah の例で確かめた） */
  var _w20_SB=(function(){var s=new Array(256),p=1,q=1;
    do{p=p^((p<<1)&0xff)^((p&0x80)?0x1b:0);
       q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;
       var x=q^(((q<<1)|(q>>7))&0xff)^(((q<<2)|(q>>6))&0xff)^(((q<<3)|(q>>5))&0xff)^(((q<<4)|(q>>4))&0xff);
       s[p]=(x^0x63)&0xff;}while(p!==1);
    s[0]=0x63;return s;})();
  function _w20_xt(a){return ((a<<1)^((a&0x80)?0x1b:0))&0xff;}
  function _w20_aes(key,inp){var S=_w20_SB,rk=key.slice(0,16),rc=1,i,j,r,c;
    for(i=16;i<176;i+=4){var t=[rk[i-4],rk[i-3],rk[i-2],rk[i-1]];
      if(i%16===0){var t0=t[0];t=[S[t[1]]^rc,S[t[2]],S[t[3]],S[t0]];rc=_w20_xt(rc);}
      for(j=0;j<4;j++)rk[i+j]=rk[i-16+j]^t[j];}
    var s=inp.slice(0,16);for(j=0;j<16;j++)s[j]^=rk[j];
    for(r=1;r<=10;r++){
      for(j=0;j<16;j++)s[j]=S[s[j]];
      var u=new Array(16);for(c=0;c<4;c++)for(var k=0;k<4;k++)u[c*4+k]=s[((c+k)%4)*4+k];s=u;
      if(r<10)for(c=0;c<4;c++){var a0=s[c*4],a1=s[c*4+1],a2=s[c*4+2],a3=s[c*4+3];
        s[c*4]=_w20_xt(a0)^_w20_xt(a1)^a1^a2^a3;s[c*4+1]=a0^_w20_xt(a1)^_w20_xt(a2)^a2^a3;
        s[c*4+2]=a0^a1^_w20_xt(a2)^_w20_xt(a3)^a3;s[c*4+3]=_w20_xt(a0)^a0^a1^a2^_w20_xt(a3);}
      for(j=0;j<16;j++)s[j]^=rk[r*16+j];}
    return s;}
  function _w20_hb(h){var o=[];for(var i=0;i+1<h.length;i+=2)o.push(parseInt(h.substr(i,2),16));return o;}
  function _w20_hx(b,sep){return b.map(function(x){return (x<16?"0":"")+x.toString(16).toUpperCase();}).join(sep==null?" ":sep);}

  /* ---- アソシエーションモデル ---- */
  var _w20_IO=["DisplayOnly","DisplayYesNo","KeyboardOnly","NoInputNoOutput","KeyboardDisplay"];
  /* LESC の表（行 = セントラル、列 = ペリフェラル）。"CP" = C 表示 → P 入力、"PC" = P 表示 → C 入力、"BB" = 両方に入力 */
  var _w20_LESC=[["JW","JW","CP","JW","CP"],["JW","NC","CP","JW","NC"],["PC","PC","BB","JW","PC"],["JW","JW","JW","JW","JW"],["PC","NC","CP","JW","NC"]];
  var _w20_LEG =[["JW","JW","CP","JW","CP"],["JW","JW","CP","JW","CP"],["PC","PC","BB","JW","PC"],["JW","JW","JW","JW","JW"],["PC","PC","CP","JW","CP"]];
  var _w20_MN={JW:["Just Works","alias"],NC:["数値比較","green"],CP:["パスキー入力","signal"],PC:["パスキー入力","signal"],BB:["パスキー入力","signal"],OOB:["OOB","teal"]};
  var _w20_DIR={CP:"C 表示 → P 入力",PC:"P 表示 → C 入力",BB:"両方に入力"};

  REG.w20_assoc=function(el,U){
    var S=U.S;
    U.head(el,"PAIRING","IO 能力からアソシエーションモデルを決める");
    var row=U.ctrls(el);
    var ioC=U.select(row,"セントラル（スマートフォン）の IO 能力",_w20_IO,4,draw);
    var ioP=U.select(row,"ペリフェラル（機器）の IO 能力",_w20_IO,3,draw);
    var row2=U.ctrls(el);
    var mC=U.checkbox(row2,"セントラルが MITM を求める",true,draw);
    var mP=U.checkbox(row2,"ペリフェラルが MITM を求める",false,draw);
    var oC=U.checkbox(row2,"セントラルが OOB のデータを持つ",false,draw);
    var oP=U.checkbox(row2,"ペリフェラルが OOB のデータを持つ",false,draw);
    var row3=U.ctrls(el);
    var sC=U.checkbox(row3,"セントラルが LESC に対応",true,draw);
    var sP=U.checkbox(row3,"ペリフェラルが LESC に対応",true,draw);
    var br=U.btnrow(el);
    function preset(a,b,ma,mb,sa,sb){ioC.set(a);ioP.set(b);mC.set(ma);mP.set(mb);oC.set(false);oP.set(false);sC.set(sa);sP.set(sb);draw();}
    U.button(br,"画面もボタンもない機器",function(){preset(4,3,true,false,true,true);});
    U.button(br,"6 桁の表示と「はい」がある機器",function(){preset(4,1,true,true,true,true);});
    U.button(br,"数字を入力できる機器",function(){preset(4,2,true,true,true,true);});
    U.button(br,"レガシーにしか対応しない機器",function(){preset(4,1,true,true,true,false);});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var i=ioC.get(),j=ioP.get(),lesc=sC.get()&&sP.get();
      var oob=lesc?(oC.get()||oP.get()):(oC.get()&&oP.get());
      var noMitm=!mC.get()&&!mP.get();
      var step=oob?0:(noMitm?1:2);
      var m=oob?"OOB":(noMitm?"JW":(lesc?_w20_LESC:_w20_LEG)[i][j]);
      var W=700,o=[];
      /* 決まり方の 3 段 */
      var st=[["OOB のデータ",oob?"ある → OOB":"無い"],["MITM のフラグ",step===0?"（見ない）":(noMitm?"両方 0 → Just Works":"どちらかが 1")],["IO 能力の表",step===2?(lesc?"LESC の表":"レガシーの表"):"（使わない）"]];
      st.forEach(function(s,k){var x=10+k*232,on=k===step,c=on?"signal":"muted";
        o.push(S.RECT(x,8,212,40,6,on?U.soft("signal"):"panel",c,on?2.2:1.1));
        o.push(S.T(x+106,24,s[0],"middle",10.5,c,true));o.push(S.T(x+106,40,s[1],"middle",9.5,on?"ink":"muted"));
        if(k<2)o.push(S.ARR(x+214,28,x+230,28,"muted",1.3,6));});
      /* 表 */
      var T=lesc?_w20_LESC:_w20_LEG,x0=10,y0=62,hw=124,cw=112,hh=30,ch=38;
      o.push(S.T(x0+hw+cw*2.5,y0-2,"ペリフェラル（列）"+(lesc?"・LESC の表":"・レガシーの表"),"middle",10,"signal",true));
      _w20_IO.forEach(function(nm,c){var xx=x0+hw+c*cw;o.push(S.RECT(xx+1,y0+4,cw-2,hh-4,4,c===j?U.soft("signal"):"panel","signal",c===j?1.8:0.8));
        o.push(S.T(xx+cw/2,y0+22,nm,"middle",9,"signal",true));});
      _w20_IO.forEach(function(nm,r){var yy=y0+hh+r*ch;o.push(S.RECT(x0,yy+1,hw-4,ch-2,4,r===i?U.soft("purple"):"panel","purple",r===i?1.8:0.8));
        o.push(S.T(x0+(hw-4)/2,yy+ch/2+4,nm,"middle",9,"purple",true));
        for(var c=0;c<5;c++){var v=T[r][c],mn=_w20_MN[v],xx=x0+hw+c*cw,sel=(r===i&&c===j&&step===2),dim=step!==2;
          o.push('<g opacity="'+(dim?0.35:(sel?1:0.75))+'">');
          o.push(S.RECT(xx+1,yy+1,cw-2,ch-2,4,U.soft(mn[1]),mn[1],sel?3:0.9));
          o.push(S.T(xx+cw/2,yy+(_w20_DIR[v]?16:23),mn[0],"middle",9.5,mn[1],true));
          if(_w20_DIR[v])o.push(S.T(xx+cw/2,yy+30,_w20_DIR[v],"middle",8.5,"ink"));
          o.push('</g>');}});
      o.push(S.T(x0,y0+hh+5*ch+18,"行 = セントラル、列 = ペリフェラル。C = セントラル、P = ペリフェラル。表を使うのは右端の段に来たときだけ。","start",9.5,"muted"));
      box.set(S.svg(W,y0+hh+5*ch+28,o));
      /* 結果 */
      var mn=_w20_MN[m],prot=m!=="JW";
      var act={JW:"数字を確かめない（OS によっては、ペアリングしてよいかだけを尋ねる）",NC:"両方の画面の 6 桁が同じかを見て「はい」を押す",
        CP:"セントラルに出た 6 桁を、ペリフェラルに入力する",PC:"ペリフェラルに出た 6 桁を、セントラルに入力する",BB:"利用者が決めた同じ 6 桁を、両方に入力する",
        OOB:"NFC や QR コードなどで、鍵の材料を受け渡す"}[m];
      var eav,tk;
      if(lesc){eav=true;tk="TK は使わない（鍵は DHKey から導く）";}
      else if(m==="OOB"){eav=true;tk="TK = OOB の 16 バイト（2¹²⁸ 通り）";}
      else if(m==="JW"){eav=false;tk="TK = 0（1 通り）";}
      else{eav=false;tk="TK = 6 桁の数字（10⁶ 通り）";}
      ro.innerHTML="方式: <b>"+(lesc?"LE Secure Connections":"レガシーペアリング")+"</b>（両端の LESC への対応: "+(sC.get()?"C ✓":"C ✗")+" "+(sP.get()?"P ✓":"P ✗")+"）"+
        " ・ アソシエーションモデル: <b style=\"color:var(--"+(mn[1]==="alias"?"alias":mn[1]==="teal"?"teal":mn[1])+")\">"+mn[0]+(_w20_DIR[m]?"（"+_w20_DIR[m]+"）":"")+"</b><br>"+
        "利用者がすること: "+act+"<br>"+
        "鍵のもと: "+tk+"<br>"+
        "ペアリングを記録した受動的な盗聴: "+(eav?'<span class="ok">防げる</span>':'<span class="warn">防げない（候補を全部試せる）</span>')+
        " ・ 中間者攻撃: "+(prot?'<span class="ok">防げる</span>':'<span class="warn">防げない（利用者もほかの経路も確かめない）</span>')+
        (!lesc&&prot&&m!=="OOB"?'<div class="wnote">レガシーのパスキー入力は、規格の上では中間者を防ぐ（認証済み）扱いだが、ペアリングを記録されると鍵が割れる。</div>':"")+
        (oob&&!lesc?'':(!lesc&&(oC.get()!==oP.get())?'<div class="wnote">レガシーでは、OOB は両方がデータを持つときにだけ使われる。</div>':''));
    }
    draw();
  };

  /* ---- 解決可能なプライベートアドレス ---- */
  var _w20_DEV=[["機器 A","ec0234a357c8ad05341010a60a397d9b"],["機器 B","5d1f8b3a0c47e2916fa4d03b8e72c51a"],["機器 C","3c9a71e05b28d4f6a1078e2bd93f4c65"]];
  /* 小さな値を「6.0 × 10⁻⁸」の形にする */
  function _w20_sci(v){if(v===0)return "0";var e=Math.floor(Math.log10(v)),m=v/Math.pow(10,e),sup="⁰¹²³⁴⁵⁶⁷⁸⁹";
    var es=String(Math.abs(e)).split("").map(function(d){return sup[+d];}).join("");return m.toFixed(1)+" × 10"+(e<0?"⁻":"")+es;}
  function _w20_ah(irkHex,pr){return _w20_aes(_w20_hb(irkHex),[0,0,0,0,0,0,0,0,0,0,0,0,0,pr[0],pr[1],pr[2]]);}

  REG.w20_rpa=function(el,U){
    var S=U.S;
    U.head(el,"RPA","解決可能なプライベートアドレスを作り、解決する");
    var row=U.ctrls(el);
    var dv=U.select(row,"アドバタイズする機器",_w20_DEV.map(function(d){return d[0]+"（IRK "+d[1].substr(0,8).toUpperCase()+"…）";}),0,function(){hist[hist.length-1].d=dv.get();draw();});
    var pr=U.textin(row,"prand（16 進 6 桁）","708194",function(){var v=pr.get().replace(/\s/g,"");if(/^[0-9a-fA-F]{6}$/.test(v)){hist[hist.length-1].p=v.toLowerCase();}draw();});
    var row2=U.ctrls(el);
    var has=_w20_DEV.map(function(d,k){return U.checkbox(row2,"スマートフォンが "+d[0]+" の IRK を持つ",k<2,draw);});
    var br=U.btnrow(el);
    var seed=1,rg=U.rng(seed);
    function newPrand(){var a=[0x40|rg.int(64),rg.int(256),rg.int(256)];return _w20_hx(a,"").toLowerCase();}
    U.button(br,"15 分進める（prand を作り直す）",function(){var p=newPrand();hist.push({d:dv.get(),p:p});if(hist.length>6)hist.shift();pr.set(p);draw();});
    U.button(br,"もう一度（別の乱数で）",function(){seed++;rg=U.rng(seed*7919);hist=[{d:dv.get(),p:"708194"}];pr.set("708194");draw();});
    U.button(br,"最初に戻す",function(){seed=1;rg=U.rng(1);dv.set(0);pr.set("708194");hist=[{d:0,p:"708194"}];draw();});
    var hist=[{d:0,p:"708194"}];
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function addrOf(e){var p=_w20_hb(e.p),ct=_w20_ah(_w20_DEV[e.d][1],p);return {p:p,ct:ct,h:ct.slice(13),rpa:(p[0]>>6)===1};}
    function resolve(a){if(!a.rpa)return null;for(var k=0;k<_w20_DEV.length;k++){if(!has[k].get())continue;var h=_w20_ah(_w20_DEV[k][1],a.p).slice(13);
      if(h[0]===a.h[0]&&h[1]===a.h[1]&&h[2]===a.h[2])return k;}return -1;}
    function draw(){
      var cur=hist[hist.length-1],a=addrOf(cur),W=700,o=[];
      var bad=!/^[0-9a-fA-F]{6}$/.test(pr.get().replace(/\s/g,""));
      /* 48 ビット */
      o.push(S.T(10,18,cur.d>=0?_w20_DEV[cur.d][0]+" のいまのアドレス（人が読む順）":"","start",10.5,"ink",true));
      o.push(S.RECT(10,26,250,36,5,U.soft("signal"),"signal",1.3));o.push(S.T(135,41,"prand（上位 24 ビット）","middle",9.5,"signal",true));
      o.push(S.T(135,56,_w20_hx(a.p),"middle",11.5,"ink",true,true));
      o.push(S.RECT(260,26,250,36,5,U.soft("green"),"green",1.3));o.push(S.T(385,41,"hash（下位 24 ビット）","middle",9.5,"green",true));
      o.push(S.T(385,56,_w20_hx(a.h),"middle",11.5,"ink",true,true));
      var b0=a.p[0],bits=("00000000"+b0.toString(2)).slice(-8);
      o.push(S.T(520,40,"最上位の 2 ビット: "+bits.substr(0,2),"start",10,a.rpa?"green":"alias",true));
      o.push(S.T(520,56,a.rpa?"01 → RPA":"01 でない → RPA ではない","start",9.5,a.rpa?"green":"alias",true));
      /* ah の計算 */
      var y=82,xb=118,stp=U.tw("00 ",10.5,true);
      o.push(S.T(10,y,"hash = ah(IRK, prand)","start",10.5,"ink",true));
      var rows=[["IRK",_w20_hb(_w20_DEV[cur.d][1]),-1,"muted"],["入力",[0,0,0,0,0,0,0,0,0,0,0,0,0].concat(a.p),13,"signal"],["AES-128",a.ct,13,"green"]];
      rows.forEach(function(r,k){var yy=y+22+k*22;o.push(S.T(xb-10,yy,r[0],"end",10,"ink",true));
        r[1].forEach(function(b,q){var hl=r[2]>=0&&q>=r[2];if(hl)o.push(S.RECT(xb+q*stp-2,yy-13,stp-2,17,3,U.soft(r[3]),"none",0));
          o.push(S.T(xb+q*stp,yy,_w20_hx([b]),"start",10.5,hl?r[3]:"ink",hl,true));});});
      o.push(S.T(xb+16*stp+6,y+66,"← 下位 3 バイトが hash","start",9.5,"green"));
      o.push(S.T(10,y+92,"電波に乗る順（最下位のバイトから）: "+_w20_hx(a.h.slice().reverse())+" "+_w20_hx(a.p.slice().reverse()),"start",10,"ink",false,true));
      /* 時間とともに */
      var y2=y+118,n=hist.length,cw=112;
      o.push(S.T(10,y2,"15 分ごとのアドレスと、見え方","start",10.5,"ink",true));
      o.push(S.T(10,y2+58,"IRK を持たない観測者","start",9.5,"alias",true));
      o.push(S.T(10,y2+88,"スマートフォン","start",9.5,"green",true));
      var seen={},cnt=0;
      hist.forEach(function(e,k){var ae=addrOf(e),s=_w20_hx(ae.p,":")+":"+_w20_hx(ae.h,":"),x=130+k*cw;
        if(!(s in seen)){cnt++;seen[s]=cnt;}
        var last=k===n-1;
        o.push(S.T(x+cw/2-4,y2+16,"+"+(k*15)+" 分"+(last?"（いま）":""),"middle",9,"muted"));
        o.push(S.RECT(x,y2+22,cw-8,22,4,last?U.soft("signal"):"panel","signal",last?1.6:0.9));
        o.push(S.T(x+cw/2-4,y2+37,s,"middle",8,"ink",false,true));
        o.push(S.RECT(x,y2+48,cw-8,18,4,U.soft("alias"),"alias",0.9));
        o.push(S.T(x+cw/2-4,y2+61,"知らない機器 "+seen[s],"middle",9,"alias",true));
        var r=resolve(ae),ok=r!=null&&r>=0;
        o.push(S.RECT(x,y2+76,cw-8,18,4,U.soft(ok?"green":"muted"),ok?"green":"muted",0.9));
        o.push(S.T(x+cw/2-4,y2+89,r==null?"RPA ではない":(ok?_w20_DEV[r][0]+" と解決":"解決できない"),"middle",9,ok?"green":"muted",true));});
      box.set(S.svg(W,y2+104,o));
      /* 読み出し */
      var lines=[],k=0;
      _w20_DEV.forEach(function(d,q){if(!has[q].get())return;k++;var h=_w20_ah(d[1],a.p).slice(13),m=a.rpa&&h[0]===a.h[0]&&h[1]===a.h[1]&&h[2]===a.h[2];
        lines.push([d[0],_w20_hx(h),m?'<span class="ok">一致 → '+d[0]+'</span>':"不一致"]);});
      ro.innerHTML=(bad?'<span class="warn">prand は 16 進 6 桁で入れる（いまは直前の値で計算している）。</span><br>':"")+
        "アドレス（人が読む順）: <b>"+_w20_hx(a.p,":")+":"+_w20_hx(a.h,":")+"</b> ・ 電波の順: "+_w20_hx(a.h.slice().reverse())+" "+_w20_hx(a.p.slice().reverse())+
        (a.rpa?"":' ・ <span class="warn">最上位の 2 ビットが 01 でないので RPA ではなく、解決しない</span>')+"<br>"+
        "スマートフォンでの解決（受け取った hash = "+_w20_hx(a.h)+"）:"+(lines.length?U.tbl(["IRK","ah(IRK, prand)","結果"],lines,["left","left","left"]):" IRK を 1 つも持っていない")+
        '<div class="wnote">誤った IRK で偶然一致する確率は IRK 1 つあたり 2⁻²⁴（約 1677 万分の 1）。いま '+k+' 件なので、1 回の解決で誤って一致する件数の期待値は '+_w20_sci(k/16777216)+'。'+
        'IRK を持たない観測者には、アドレスが変わるたびに「知らない機器」が増えて見える。</div>';
    }
    draw();
  };

  /* ---- 属性の条件と接続のレベル ---- */
  var _w20_REQ=["条件なし","暗号化が必要（レベル 2 以上）","認証が必要（レベル 3 以上）","LESC の認証が必要（レベル 4）"];
  var _w20_LINK=["暗号化していない（レベル 1）","Just Works で暗号化（レベル 2）","レガシーのパスキー入力で暗号化（レベル 3）","LESC の数値比較で暗号化（レベル 4）"];
  /* 機器の IO 能力（スマートフォンは KeyboardDisplay・LESC、OOB は使わないとする）と、届く最も高いレベル */
  var _w20_DEVIO=[["NoInputNoOutput（画面もボタンもない）",2,"Just Works"],["DisplayYesNo（6 桁と「はい」）",4,"数値比較"],["DisplayOnly（6 桁の表示だけ）",4,"パスキー入力（P 表示 → C 入力）"]];

  REG.w20_perm=function(el,U){
    var S=U.S;
    U.head(el,"PERMISSION","属性の条件と、いまの接続");
    var row=U.ctrls(el);
    var rq=U.select(row,"属性に付けた条件",_w20_REQ,2,draw);
    var lk=U.select(row,"いまの接続",_w20_LINK,0,draw);
    var row2=U.ctrls(el);
    var di=U.select(row2,"機器（ペリフェラル）の IO 能力",_w20_DEVIO.map(function(d){return d[0];}),1,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var need=[1,2,3,4][rq.get()],lv=lk.get()+1,dev=_w20_DEVIO[di.get()],maxLv=dev[1];
      var ok=lv>=need,err=null;
      if(!ok)err=(lv===1&&need===2)?["Insufficient Encryption","0x0F","暗号化が足りない"]:["Insufficient Authentication","0x05","認証が足りない"];
      var lanes=[["GATT クライアント（スマートフォン）","purple"],["GATT サーバ（機器）","signal"]],m=[];
      m.push([0,1,"Write Request"]);
      m.push(["note",1,"条件: "+_w20_REQ[rq.get()]+"\nいまの接続: レベル "+lv,{c:ok?"green":"alias"}]);
      if(ok){m.push([1,0,"Write Response（書き込めた）",{c:"green"}]);}
      else{
        m.push([1,0,"Error Response（"+err[2]+" "+err[1]+"）",{c:"alias"}]);
        if(maxLv>=need){m.push([0,1,"ペアリングと暗号化（"+dev[2]+"）",{c:"teal",dash:true}]);
          m.push(["note",1,"接続はレベル "+maxLv+" になった",{c:"teal"}]);
          m.push([0,1,"Write Request（もう一度）"]);m.push([1,0,"Write Response（書き込めた）",{c:"green"}]);}
        else{m.push(["note",0,"この機器とはレベル "+maxLv+" までしか\n届かないので、書き込めない",{c:"alias"}]);}
      }
      var q=U.seq(lanes,m,{w:680,x:10,y:8});
      box.set(S.svg(700,q.h+16,q.svg));
      ro.innerHTML="属性の条件: レベル "+need+" 以上 ・ いまの接続: レベル "+lv+" → "+(ok?'<span class="ok">通る</span>':'<span class="warn">断られる（ATT の '+err[0]+"、"+err[1]+"）</span>")+"<br>"+
        "この機器とスマートフォン（KeyboardDisplay・LESC・OOB なし）のペアリングで届く最も高いレベル: <b>"+maxLv+"</b>（"+dev[2]+"）"+
        (!ok&&maxLv<need?' ・ <span class="warn">ペアリングし直しても届かない</span>':'')+
        '<div class="wnote">'+(!ok&&maxLv<need?"届かないときは、属性の条件を見直すか、機器に表示か入力の手段・OOB を足すか、アプリケーション層で相手を確かめる。":"")+
        "どちらの誤りを返すか、受けた側がどう動くかは、スタックと OS によって細部が違う。</div>";
    }
    draw();
  };
