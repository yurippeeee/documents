  /* ===== 12 章 TLS ===== */
  /* 版ごとのレコードの形: ヘッダ, 送るノンス, 中の種類, タグ */
  var _w12_VERS=[{nm:"TLS 1.3（AES-GCM・ChaCha20-Poly1305）",nonce:0,inner:1,tag:16,v13:true},
                 {nm:"TLS 1.2（AES-GCM）",nonce:8,inner:0,tag:16,v13:false},
                 {nm:"TLS 1.2（ChaCha20-Poly1305）",nonce:0,inner:0,tag:16,v13:false}];
  var _w12_MAXPT=16384, _w12_MSS=1460, _w12_LOW=78;
  /* 1 回の書き込み n バイトを、レコードの列にする。pad16: TLS 1.3 で平文 + 種類を 16 の倍数にそろえる */
  function _w12_recs(n,ver,pad16){
    var out=[],left=n;
    do{var d=Math.min(left,_w12_MAXPT),inner=d+ver.inner,p=0;
      if(ver.v13&&pad16){p=Math.ceil(inner/16)*16-inner;p=Math.min(p,_w12_MAXPT+1-inner);}
      out.push({d:d,p:p,wire:5+ver.nonce+d+ver.inner+p+ver.tag});left-=d;}while(left>0);
    return out;}
  /* 欄を横に並べる（幅は px で指定。縮尺どおりでない図に使う）。fields = [[名前, 幅, 色, 値], ...]。返り値 {svg, x}（右端） */
  function _w12_fields(S,U,x,y,fields){var o=[];
    fields.forEach(function(f){o.push(S.RECT(x,y,f[1],34,4,U.soft(f[2]),f[2],1.2));
      if(f[1]>=U.tw(f[0],9.5)+4){o.push(S.T(x+f[1]/2,y+14,f[0],"middle",9.5,f[2],true));o.push(S.T(x+f[1]/2,y+28,f[3],"middle",9,"ink",false,true));}
      else{o.push(S.T(x+f[1]/2,y+22,f[3],"middle",8.5,"ink",false,true));o.push(S.T(x+f[1]/2,y+48,f[0],"middle",9,f[2],true));}
      x+=f[1];});
    return {svg:o.join(""),x:x};}
  function _w12_write(n,ver,pad16){var r=_w12_recs(n,ver,pad16),t=0;r.forEach(function(x){t+=x.wire;});
    return {recs:r,tls:t,segs:Math.ceil(t/_w12_MSS)};}

  REG.w12_record=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"RECORD","書き込みとレコード — TLS が足すバイト");
    var row=U.ctrls(el);
    var nb=U.slider(row,"1 回に書くバイト数",{min:1,max:40000,value:20,log:true,int:true,fmt:function(v){return v+" バイト";},onInput:draw});
    var nw=U.slider(row,"書く回数",{min:1,max:20,step:1,value:5,fmt:function(v){return v+" 回";},onInput:draw});
    var row2=U.ctrls(el);
    var vs=U.select(row2,"版と暗号",_w12_VERS.map(function(v){return v.nm;}),0,draw);
    var pd=U.select(row2,"TLS 1.3 の詰め物",["詰めない（OpenSSL の既定）","16 の倍数にそろえる（Mbed TLS 3.6 の既定）"],0,draw);
    var low=U.checkbox(row2,"TCP より下の層も数える（1 セグメントあたり 78 バイト）",true,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function bar(o,x,y,w,parts,total,label,lc){
      o.push(S.T(x-8,y+15,label,"end",10,lc||"ink",true));
      var xx=x;parts.forEach(function(p){if(p[0]<=0)return;var ww=Math.max(1,w*p[0]/total);o.push(S.RECT(xx,y,ww,22,3,U.soft(p[1]),p[1],1.1));
        if(ww>U.tw(p[2],9)+6)o.push(S.T(xx+ww/2,y+15,p[2],"middle",9,p[1],true));xx+=ww;});
      return xx;}
    function draw(){
      var n=nb.get(),m=nw.get(),ver=_w12_VERS[vs.get()],pad=ver.v13&&pd.get()===1,useLow=low.get();
      var one=_w12_write(n,ver,pad),k=one.recs.length,tlsAdd=one.tls-n,lowAdd=useLow?_w12_LOW*one.segs:0;
      var big=_w12_write(n*m,ver,pad),bigLow=useLow?_w12_LOW*big.segs:0;
      var wireAll=m*(one.tls+lowAdd),wireBig=big.tls+bigLow;
      var W=700,o=[];
      // 1 つ目のレコードの欄（縮尺どおりではない）
      var r0=one.recs[0],fl=[["ヘッダ",50,"teal","5 B"]];
      if(ver.nonce)fl.push(["ノンス",56,"gold","8 B"]);
      fl.push(["データ",Math.max(56,Math.min(220,r0.d*2)),"purple",F.int(r0.d)+" B"]);
      if(ver.inner)fl.push(["種類",26,"purple","1 B"]);
      if(r0.p)fl.push(["詰め物",50,"muted",r0.p+" B"]);
      fl.push(["タグ",90,"alias","16 B"]);
      var fs=_w12_fields(S,U,120,26,fl);
      o.push(S.T(112,47,"1 つ目のレコード","end",10,"ink",true));
      o.push(S.T(120,16,"欄の幅は縮尺どおりではない","start",9,"muted"));
      o.push(fs.svg);
      o.push(S.T(fs.x+10,47,"線の上 "+F.int(r0.wire)+" B","start",10,"teal",true));
      // 1 回の書き込みの内訳（バイト数に比例）
      var y=100,tot1=n+tlsAdd+lowAdd;
      bar(o,120,y,560,[[lowAdd,"muted","下の層 "+lowAdd],[tlsAdd,"teal","TLS "+tlsAdd],[n,"purple","データ "+F.int(n)]],tot1,"1 回の書き込み");
      o.push(S.T(120,y+38,"レコード "+k+" 個・セグメント "+one.segs+" 個・線の上 "+tot1+" バイト（横の長さはバイト数に比例）","start",9.5,"muted"));
      // 分けて書く場合とまとめて書く場合
      y=158;var mx=Math.max(wireAll,wireBig);
      var x1=bar(o,120,y,470*wireAll/mx,[[m*lowAdd,"muted","下の層"],[m*tlsAdd,"teal","TLS"],[m*n,"purple","データ"]],wireAll,m+" 回に分けて");
      o.push(S.T(x1+6,y+15,F.int(wireAll)+" B","start",9.5,"ink",true));
      var x2=bar(o,120,y+32,470*wireBig/mx,[[bigLow,"muted","下の層"],[big.tls-n*m,"teal","TLS"],[n*m,"purple","データ"]],wireBig,"まとめて 1 回で","green");
      o.push(S.T(x2+6,y+47,F.int(wireBig)+" B","start",9.5,"ink",true));
      box.set(S.svg(W,y+64,o));
      var per=5+ver.nonce+ver.inner+ver.tag;
      ro.innerHTML="1 つのレコードで TLS が足すのは 5 + "+(ver.nonce?"8（ノンス）":"")+(ver.inner?"1（種類）":"")+" + 16（タグ）"+(ver.nonce&&ver.inner?"":"")+" = <b>"+per+" バイト</b>"+(pad?"（詰め物を除く。いまのレコードの詰め物は "+r0.p+" バイト）":"")+"<br>"+
        "1 回に "+n+" バイトを書くと、16384 バイトずつのレコード <b>"+k+" 個</b>（⌈"+n+" / 16384⌉）になり、TLS が足すのは "+tlsAdd+" バイト"+(useLow?"、セグメント "+one.segs+" 個で下の層が "+lowAdd+" バイト":"")+"<br>"+
        m+" 回に分けて書くと: 線の上 <b>"+F.int(wireAll)+" バイト</b>、効率 <b>"+U.sig(n*m/wireAll*100,3)+" %</b> ・ まとめて "+(n*m)+" バイトを 1 回で書くと: <b>"+F.int(wireBig)+" バイト</b>、効率 <b>"+U.sig(n*m/wireBig*100,3)+" %</b>"+
        '<div class="wnote">下の層は 07 章 6 節の数え方（TCP 20・IPv4 20・Ethernet 18・線の上の前置きと間 20）。セグメントは MSS 1460 バイトで分け、書き込みごとにすぐ送るとした（10 章の Nagle などで、まとめて送られることもある）。</div>';
    }
    draw();
  };

  /* ---- 証明書の検証 ---- */
  var _w12_SC=[
    {nm:"正しいサーバ",fail:null},
    {nm:"機器の時刻が未設定（1970 年）",fail:"time"},
    {nm:"サーバの証明書の期限切れ",fail:"exp"},
    {nm:"ホスト名が違う（別の名前の正規の証明書）",fail:"host"},
    {nm:"知らない CA（攻撃者が作った CA）",fail:"ca"},
    {nm:"署名が合わない（書き換えた証明書）",fail:"sig"},
    {nm:"秘密鍵を持たない（本物の証明書を写しただけ）",fail:"key"}];
  REG.w12_verify=function(el,U){
    var S=U.S;
    U.head(el,"VERIFY","証明書の検証 — どこで止まるか");
    var row=U.ctrls(el);
    var sc=U.select(row,"場面",_w12_SC.map(function(s){return s.nm;}),0,draw);
    var row2=U.ctrls(el);
    var nohost=U.checkbox(row2,"ホスト名を確かめない（set_hostname に NULL。悪い例）",false,draw);
    var none=U.checkbox(row2,"検証そのものをしない（VERIFY_NONE。悪い例）",false,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function draw(){
      var f=_w12_SC[sc.get()].fail,skipAll=none.get(),skipHost=nohost.get()||skipAll;
      /* 各証明書の確認: [① 署名, ② 有効期間, ③ CA, ④ トラストアンカー, ⑤ ホスト名] の結果 1 = 合格, 0 = 不合格, null = しない/対象外 */
      var certs=[
        {nm:"ルート証明書（機器が持つトラストアンカー）",sub:f==="ca"?"機器のルートとはつながらない":"Example Root CA",c:"signal",chk:[null,1,null,null,null]},
        {nm:"中間の CA の証明書（サーバが送る）",sub:f==="ca"?"Other Issuing CA（攻撃者の CA）":"Example Issuing CA",c:"gold",chk:[1,1,1,f==="ca"?0:1,null]},
        {nm:"サーバの証明書（サーバが送る）",sub:f==="host"?"attacker.example（つなぎたいのは mqtt.example.com）":"mqtt.example.com",c:"green",chk:[f==="sig"?0:1,f==="exp"?0:1,null,null,f==="host"?0:1]}];
      if(f==="time"){certs.forEach(function(c){c.chk[1]=0;});}
      var flags=0,first=null,names=["①署名","②有効期間","③CA","④トラストアンカー","⑤ホスト名"];
      certs.forEach(function(c,ci){c.chk.forEach(function(v,k){
        if(skipAll&&v!==null){c.chk[k]="skip";return;}
        if(k===4&&skipHost&&v!==null){c.chk[k]="skip";return;}
        if(v===0){if(!first)first=[ci,k];
          if(k===0||k===3)flags|=0x08;if(k===1)flags|=(f==="time"?0x200:0x01);if(k===4)flags|=0x04;}});});
      var cvFail=(f==="key");
      var W=700,o=[],x=20,w=400,ys=[20,96,172];
      certs.forEach(function(c,i){var y=ys[i];
        o.push(S.RECT(x,y,w,56,7,U.soft(c.c),c.c,1.4));
        o.push(S.T(x+10,y+18,c.nm,"start",10.5,c.c,true));
        o.push(S.T(x+10,y+34,c.sub,"start",9.5,"ink"));
        var cx=x+10;c.chk.forEach(function(v,k){if(v===null)return;
          var col=v==="skip"?"muted":(v?"green":"alias"),mark=v==="skip"?"しない":(v?"✓":"×"),lab=names[k]+" "+mark;
          var ww=U.tw(lab,9.5)+12;o.push(S.RECT(cx,y+40,ww,13,3,U.soft(col),col,1));o.push(S.T(cx+ww/2,y+50.5,lab,"middle",9,col,true));cx+=ww+6;});
        if(i<2)o.push(S.ARR(x+w-40,y+56,x+w-40,ys[i+1]-1,"teal",1.4));
      });
      var yv=244;o.push(S.RECT(x,yv,w,30,6,U.soft(cvFail?"alias":"teal"),cvFail?"alias":"teal",1.3));
      o.push(S.T(x+10,yv+19,"⑥ CertificateVerify（サーバが秘密鍵を持つか） "+(cvFail?"×":"✓"),"start",10,cvFail?"alias":"teal",true));
      // 右: ハンドシェイクのどこで止まるか
      var mx=450,steps=["ClientHello →","← ServerHello","← {Certificate}（①〜⑤）","← {CertificateVerify}（⑥）","← {Finished}","{Finished} →"];
      var stopAt=(flags&&!skipAll)?2:(cvFail?3:-1);
      o.push(S.T(mx,24,"ハンドシェイクの進み方","start",10.5,"ink",true));
      steps.forEach(function(s,i){var y=44+i*30,col=(stopAt>=0&&i>stopAt)?"faint":(i===stopAt?"alias":"ink");
        o.push(S.RECT(mx,y,220,22,5,i===stopAt?U.soft("alias"):"panel",col,1.1));o.push(S.T(mx+10,y+15,s,"start",9.5,col,i===stopAt));});
      if(stopAt>=0)o.push(S.T(mx,44+6*30+12,"ここで止まり、アラートを送って切る","start",10,"alias",true));
      else o.push(S.T(mx,44+6*30+12,"最後まで進み、接続できる","start",10,(f&&!cvFail)?"alias":"green",true));
      box.set(S.svg(W,284,o));
      var res,expl="";
      var hex=function(v){var s=v.toString(16).toUpperCase();while(s.length<8)s="0"+s;return "0x"+s;};
      if(stopAt===2){res='<span class="warn">接続できない</span>: mbedtls_ssl_handshake() は MBEDTLS_ERR_X509_CERT_VERIFY_FAILED（−0x2700）、mbedtls_ssl_get_verify_result() は <b>'+hex(flags)+'</b>（'+
        [flags&0x01?"0x01 EXPIRED（期限切れ）":"",flags&0x04?"0x04 CN_MISMATCH（ホスト名が違う）":"",flags&0x08?"0x08 NOT_TRUSTED（信頼できる CA の署名がない）":"",flags&0x200?"0x200 FUTURE（有効期間の開始前）":""].filter(Boolean).join("・")+"）";}
      else if(stopAt===3)res='<span class="warn">接続できない</span>: 証明書は正しいが、CertificateVerify の署名が証明書の公開鍵で合わない（アラート decrypt_error）';
      else if(f)res='<span class="warn">接続してしまう（危険）</span>: 偽のサーバとつながり、その者に中身を読まれ、書き換えられる';
      else res='<span class="ok">接続できる</span>: ①〜⑥ がすべて合った';
      var why={time:"機器の時計が 1970 年のままなので、どの証明書も「有効期間の開始前」に見える。TLS の前に SNTP（15 章）で時刻を合わせる。",
        exp:"期限の切れた証明書は、秘密鍵がすでに漏れているかもしれない。サーバの側で証明書を更新する。",
        host:"攻撃者が正規の CA から自分の名前で取った証明書。チェーンは正しいので、⑤ だけが偽物を見分ける。",
        ca:"攻撃者が自分で作った CA で署名した証明書。機器のトラストアンカーにつながらないので ④ で見分ける。",
        sig:"内容を書き換えた証明書。発行者の公開鍵で署名が合わないので ① で見分ける（Mbed TLS は NOT_TRUSTED として知らせる）。",
        key:"本物の証明書を写しても、対応する秘密鍵が無いので、CertificateVerify の署名を作れない。"};
      if(f)expl=why[f];
      if(skipAll)expl+=" 検証をしないと、攻撃者は自分の証明書と秘密鍵で ⑥ も通せるので、どの偽のサーバにもつながってしまう。";
      else if(skipHost&&f==="host")expl+=" ホスト名を確かめないと、正規の CA の証明書を持つ攻撃者は誰でも通ってしまう。";
      ro.innerHTML=res+(expl?"<br>"+expl:"")+'<div class="wnote">理由のビットの値は、Mbed TLS 3.6.5 の機器と OpenSSL のサーバで、わざと合わない証明書を出させて確かめたもの（「秘密鍵を持たない」場面は RFC 8446 の決まりによる）。</div>';
    }
    draw();
  };

  /* ---- 接続にかかる時間 ---- */
  var _w12_PRE=[["ソフトウェア・遅いマイコンの例",400,450,130],["ソフトウェア・速いマイコンの例",60,65,20],["暗号エンジンの例",10,12,4]];
  REG.w12_conn=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"CONNECT","接続にかかる時間 — 往復・計算・送る時間");
    var row=U.ctrls(el);
    var rt=U.slider(row,"往復時間 R",{min:5,max:1000,value:100,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var br=U.slider(row,"ビットレート",{min:1e4,max:1e8,value:1e6,log:true,fmt:function(v){return F.rate(v);},onInput:draw});
    var row2=U.ctrls(el);
    var dd=U.slider(row2,"サーバが送る証明書の枚数 d",{min:1,max:4,step:1,value:2,fmt:function(v){return v+" 枚";},onInput:draw});
    var cs=U.slider(row2,"証明書 1 枚の大きさ",{values:[300,400,470,600,800,1000,1300,1600,2000],value:470,fmt:function(v){return v+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var tk=U.slider(row3,"鍵交換 t_kx",{min:1,max:2000,value:400,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var tv=U.slider(row3,"署名の確認 1 回 t_v",{min:1,max:2000,value:450,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var tsg=U.slider(row3,"署名 1 回 t_sig",{min:1,max:2000,value:130,log:true,int:true,fmt:function(v){return v+" ms";},onInput:draw});
    var bt=U.btnrow(el);
    _w12_PRE.forEach(function(p){U.button(bt,p[0],function(){tk.set(p[1]);tv.set(p[2]);tsg.set(p[3]);draw();});});
    var row4=U.ctrls(el);
    var mu=U.checkbox(row4,"相互認証（機器も証明書を送り、署名する）",false,draw);
    var pk=U.checkbox(row4,"TLS 1.3 の再開で鍵交換も省く（psk_ke。前方秘匿性がなくなる）",false,draw);
    var sel=U.select(row4,"詳しく見る手順",["TLS 1.3（最初の接続）","TLS 1.2（最初の接続）","TLS 1.3 の再開","TLS 1.2 の再開"],0,draw);
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    function model(i,P){
      var certRec13=5+17+8+P.d*(P.cs+5),certRec12=5+7+P.d*(3+P.cs),mu=P.mu&&i<2;
      var M=[{nm:"TLS 1.3",k:1,calc:P.tk+(1+P.d)*P.tv,bytes:250+(161+certRec13+101+74)+80},
             {nm:"TLS 1.2",k:2,calc:P.tk+(1+P.d)*P.tv,bytes:161+(70+certRec12+120+9)+93+242},
             {nm:"TLS 1.3 の再開",k:1,calc:P.pk?0:P.tk,bytes:521+241+80},
             {nm:"TLS 1.2 の再開",k:1,calc:0,bytes:517+141+51}][i];
      if(mu){M.calc+=P.tsig;M.bytes+=1059+(i===0?67:60);}
      M.tx=M.bytes*8/P.br*1000;M.total=(1+M.k)*P.R+M.calc+M.tx;return M;}
    function draw(){
      var P={R:rt.get(),br:br.get(),d:dd.get(),cs:cs.get(),tk:tk.get(),tv:tv.get(),tsig:tsg.get(),mu:mu.get(),pk:pk.get()};
      var Ms=[0,1,2,3].map(function(i){return model(i,P);}),sI=sel.get(),mx=Math.max.apply(null,Ms.map(function(m){return m.total;}));
      var W=700,o=[],x0=120,w=470;
      Ms.forEach(function(M,i){var y=26+i*36,on=i===sI;
        o.push(S.T(x0-8,y+15,M.nm,"end",10,on?"signal":"ink",true));
        // 時間の順: TCP の往復、ClientHello と返事の往復（送る時間を含む）、計算、（TLS 1.2 はもう 1 往復）
        var segs=[[P.R,"green","TCP"],[P.R+M.tx*(M.k===2?0.85:1),"teal","往復"],[M.calc,"signal","計算"]];
        if(M.k===2)segs.push([P.R+M.tx*0.15,"teal","往復"]);
        var x=x0;segs.forEach(function(s){var ww=w*s[0]/mx;if(ww<=0)return;o.push(S.RECT(x,y,Math.max(ww,0.8),24,2,U.soft(s[1]),s[1],on?1.8:1));
          if(ww>U.tw(s[2],9)+6)o.push(S.T(x+ww/2,y+16,s[2],"middle",9,s[1],true));x+=ww;});
        o.push(S.T(x+6,y+16,F.time(M.total/1000),"start",10,on?"signal":"ink",true));});
      o.push(S.T(x0,26+4*36+10,"横の長さは時間に比例。左から順に起きる（TLS 1.2 は計算の後にもう 1 往復）。","start",9.5,"muted"));
      box.set(S.svg(W,26+4*36+20,o));
      var M=Ms[sI],pc=M.calc/M.total*100;
      ro.innerHTML="<b>"+M.nm+"</b>: T = (1 + "+M.k+") × "+P.R+" ms + T_c "+U.sig(M.calc,4)+" ms + T_x "+U.sig(M.tx,3)+" ms = <b>"+F.time(M.total/1000)+"</b>"+
        "（計算が "+U.sig(pc,3)+" %、往復が "+U.sig((1+M.k)*P.R/M.total*100,3)+" %）<br>"+
        "T_c の中身: "+(sI<2?"鍵交換 "+P.tk+" ms + 確認 (1 + "+P.d+") × "+P.tv+" ms"+(P.mu?" + 署名 "+P.tsig+" ms":""):(sI===2?(P.pk?"なし（psk_ke）":"鍵交換 "+P.tk+" ms（確認は 0 回）"):"なし"))+
        " ・ ハンドシェイクで送るバイト ≈ "+F.int(M.bytes)+" バイト"+
        '<div class="wnote">バイト数は、例の ECDSA の証明書で測った値（OpenSSL 同士）をもとに、証明書の枚数と大きさで増減させた目安。サーバの計算と DNS（08 章）は含まない。計算の時間のボタンの値は、説明のための仮定の例である（実際の値は、マイコン・実装・暗号エンジンで大きく変わる）。</div>';
    }
    draw();
  };

  /* ---- RAM とバッファの大きさ ---- */
  REG.w12_ram=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"RAM","バッファの大きさと、受け取れるかどうか");
    var LEN=[16384,8192,4096,2048,1024,512];
    var row=U.ctrls(el);
    var inl=U.select(row,"受信のバッファ（IN_CONTENT_LEN）",LEN.map(function(v){return {v:String(v),t:v+" バイト"};}),"16384",draw);
    var outl=U.select(row,"送信のバッファ（OUT_CONTENT_LEN）",LEN.map(function(v){return {v:String(v),t:v+" バイト"};}),"16384",draw);
    var row2=U.ctrls(el);
    var mfl=U.select(row2,"max_fragment_length",[{v:"0",t:"使わない"},{v:"512",t:"512"},{v:"1024",t:"1024"},{v:"2048",t:"2048"},{v:"4096",t:"4096"}],"0",draw);
    var ver=U.select(row2,"版",["TLS 1.2","TLS 1.3"],0,draw);
    var agree=U.checkbox(row2,"サーバが max_fragment_length に応じる",true,draw);
    var row3=U.ctrls(el);
    var resp=U.slider(row3,"サーバが返すデータ",{min:50,max:20000,value:300,log:true,int:true,fmt:function(v){return v+" B";},onInput:draw});
    var cert=U.slider(row3,"サーバの Certificate",{min:600,max:6000,value:973,log:true,int:true,fmt:function(v){return v+" B";},onInput:draw});
    var row4=U.ctrls(el);
    var mut=U.checkbox(row4,"相互認証（機器も約 1 KB の証明書を送る）",false,draw);
    var box=U.svgbox(el); var ro=U.readout(el);
    function draw(){
      var IN=+inl.get(),OUT=+outl.get(),M=+mfl.get(),v13=ver.get()===1,ag=agree.get(),R=resp.get(),C=cert.get();
      var bin=IN+381,bout=OUT+381,other=OUT>=2048?16537+(25988-16537)*(OUT-2048)/(16384-2048):16537;
      var tot=bin+bout+other,msgs=[],ok=true,mflOk=true,limit;
      if(M&&M>Math.min(IN,OUT)){mflOk=false;msgs.push('<span class="warn">max_fragment_length を '+M+' にできない</span>: 受信と送信の小さいほう（'+Math.min(IN,OUT)+'）以下にする決まり（MBEDTLS_ERR_SSL_BAD_INPUT_DATA）');}
      var neg=M&&mflOk&&ag&&!v13;
      if(M&&mflOk&&ag&&v13){ok=false;msgs.push('<span class="warn">ハンドシェイクが失敗</span>: 試した Mbed TLS 3.6.5 では、TLS 1.3 でこの拡張にサーバが応じると失敗した（record_size_limit を検討する）');}
      limit=neg?M:16384;
      var need=mut.get()?1100:460;
      if(ok&&need>OUT){ok=false;msgs.push('<span class="warn">ハンドシェイクが失敗</span>: 機器が送るいちばん大きなメッセージ（約 '+need+' バイト'+(mut.get()?'、自分の証明書':'、ClientHello')+'）が送信のバッファに入らない');}
      var certRec=Math.min(C,limit),respRec=Math.min(R,limit);
      if(ok&&certRec>IN){ok=false;msgs.push('<span class="warn">ハンドシェイクで切れる</span>: サーバの Certificate のレコード（'+certRec+' バイト）が受信のバッファ（'+IN+'）に入らない');}
      if(ok&&respRec>IN){ok=false;msgs.push('<span class="warn">ハンドシェイクの後で切れる</span>: サーバが '+respRec+' バイトのレコードで返したとき、受信のバッファ（'+IN+'）に入らない');}
      if(ok)msgs.push('<span class="ok">受け取れる</span>: サーバのレコードは最大 '+Math.max(certRec,respRec)+' バイト'+(neg?'（max_fragment_length '+M+' を取り決めた）':(M&&!ag?'（サーバが応じなかったので取り決めは無い）':'')));
      var W=700,o=[],x0=120,sc=520/60000;
      [0,10,20,30,40,50,60].forEach(function(k){var xx=x0+k*1000*sc;o.push(S.L(xx,20,xx,58,"grid",1));o.push(S.T(xx,72,k+" KB","middle",9,"muted"));});
      var kb=function(v){return U.sig(v/1024,3)+" KB";};
      var x=x0;[[bin,"signal","受信 "+kb(bin)],[bout,"gold","送信 "+kb(bout)],[other,"muted","その他（目安）"]].forEach(function(s){var ww=s[0]*sc;o.push(S.RECT(x,26,ww,26,3,U.soft(s[1]),s[1],1.1));
        if(ww>U.tw(s[2],9)+6)o.push(S.T(x+ww/2,43,s[2],"middle",9,s[1],true));x+=ww;});
      o.push(S.T(x+6,43,"約 "+U.sig(tot/1024,3)+" KB","start",10.5,ok?"green":"alias",true));
      o.push(S.T(x0-8,43,"ヒープ","end",10,"ink",true));
      box.set(S.svg(W,82,o));
      ro.innerHTML="受信のバッファ "+IN+" + 381 = "+F.int(bin)+" バイト、送信のバッファ "+OUT+" + 381 = "+F.int(bout)+" バイト、合計の目安 <b>"+U.sig(tot/1024,3)+" KB</b><br>"+msgs.join("<br>")+
        '<div class="wnote">バッファの大きさ（+381 バイト）と「その他」は、Mbed TLS 3.6.5 を PC（64 ビット）で測った値と、その間を直線で結んだ目安。サーバが応じるか、TLS 1.3 で使えるかは、サーバとライブラリの版を確かめる。</div>';
    }
    draw();
  };
