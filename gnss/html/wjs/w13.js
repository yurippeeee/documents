/* ===== 13 章 バイナリプロトコルと設定 — 更新レート・衛星系・省電力 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w13_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w13_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
/* 3 桁ごとに空白を入れた整数（115 200 など） */
function _w13_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
function _w13_hx(v){return (v<16?"0":"")+v.toString(16).toUpperCase();}
/* フレッチャーのチェックサム（8 bit の和を 2 つ。図の _f13_ck と同じ） */
function _w13_ck(bs){var a=0,b=0;bs.forEach(function(x){a=(a+x)&255;b=(b+a)&255;});return [a,b];}
/* 同期・クラス・ID・長さ（リトルエンディアン）・本体・チェックサムを並べたフレーム（2 節の bin_build と同じ） */
function _w13_frame(cls,id,body){var L=body.length,h=[cls,id,L&255,L>>8],c=_w13_ck(h.concat(body));return [0xB5,0x62].concat(h,body,c);}
/* フレームの i バイト目の欄 */
function _w13_role(i,n){return i<2?"sync":(i===2?"cls":(i===3?"id":(i<6?"len":(i>=n-2?"ck":"body"))));}
var _W13_FC={sync:"muted",cls:"purple",id:"purple",len:"gold",body:"signal",ck:"green"};
var _W13_FN={sync:"同期",cls:"クラス",id:"ID",len:"長さ",body:"本体",ck:"チェックサム"};
/* 2 節の gnss_poll と同じ流れ（フレームの部分だけ）。返り値 {ev:[{ok, a（頭の位置）, b（終わりの位置）, name}], pend（待っているフレーム）} */
function _w13_poll(st,rescan){var ev=[],s=0,raw=[],rpos=[],len=0,back=[],bpos=[],i=0;
  while(true){var c,ci;
    if(back.length){c=back.shift();ci=bpos.shift();}else if(i<st.length){c=st[i];ci=i;i++;}else break;
    if(s===0){if(c===0xB5){s=1;raw=[c];rpos=[ci];}continue;}
    raw.push(c);rpos.push(ci);var res=null;
    if(s===1){if(c===0x62)s=2;else res="BIN_ERR_SYNC";}
    else if(s===2){if(raw.length===6){len=raw[4]|(raw[5]<<8);if(len>256)res="BIN_ERR_LONG";else s=3;}}
    else if(s===3){if(raw.length===8+len){var k=_w13_ck(raw.slice(2,6+len));
      if(k[0]===raw[6+len]&&k[1]===raw[7+len]){ev.push({ok:true,a:rpos[0],b:ci,cls:raw[2],id:raw[3],len:len});s=0;}else res="BIN_ERR_SUM";}}
    if(res){ev.push({ok:false,a:rpos[0],b:ci,name:res});s=0;if(rescan){back=raw.slice(1).concat(back);bpos=rpos.slice(1).concat(bpos);}}}
  return {ev:ev,pend:s!==0?{a:rpos[0],need:(s===3?8+len:6)-raw.length}:null};}

/* ---- 2 節: フレームを組む・チェックサムを 1 バイトずつ・誤りを入れて受ける ---- */
var _W13_MSG=[{t:"間隔の設定（06 08。例の形式の古い版）",cls:6,id:8,rate:true},{t:"読み出し（06 08、本体なし）",cls:6,id:8,body:[]},
  {t:"ACK（05 01、本体 06 08）",cls:5,id:1,body:[6,8]},{t:"NAK（05 00、本体 06 08）",cls:5,id:0,body:[6,8]},{t:"16 進で入れる",free:true}];
var _W13_ERR=["なし","本体の 1 バイト目に 1 を足す","本体の 1・2 バイト目を入れ替える","チェックサムの 1 バイト目に 1 を足す","長さの欄を 0x0400（1024）にする","長さの欄に 16 を足す","8 バイトで切れる"];
REG.w13_frame=function(el,U){
  var S=U.S;
  U.head(el,"BINARY FRAME","フレームを組み、チェックサムを 1 バイトずつ計算し、誤りを入れて受ける側で確かめる");
  var r1=U.ctrls(el);
  var ms=U.select(r1,"送るメッセージ",_W13_MSG.map(function(m){return m.t;}),0,function(){sync();k=0;draw();});
  var rt=U.slider(r1,"更新レート",{values:[1,2,4,5,10,20],value:5,fmt:function(v){return v+" Hz（"+Math.round(1000/v)+" ms）";},onInput:function(){k=0;draw();}});
  var r2=U.ctrls(el);
  var tc=U.textin(r2,"クラス（16 進）","06",function(){k=0;draw();}),ti=U.textin(r2,"ID（16 進）","08",function(){k=0;draw();}),
      tb=U.textin(r2,"本体（16 進。空白で区切る。16 バイトまで）","C8 00 01 00 01 00",function(){k=0;draw();},{width:"260px"});
  var r3=U.ctrls(el);
  var er=U.select(r3,"受ける側に届くまでに入る誤り",_W13_ERR,0,function(){draw();});
  var rs=U.checkbox(r3,"誤りのとき 2 バイト目から探し直す（2 節）",true,function(){draw();});
  var br=U.btnrow(el),k=0;
  U.button(br,"本文の例（5 Hz の設定）",function(){ms.set(0);rt.set(5);er.set(0);rs.set(true);sync();k=0;draw();});
  U.button(br,"1 バイト進める",function(){k++;draw();});
  U.button(br,"最後まで",function(){k=999;draw();});
  U.button(br,"初めから",function(){k=0;draw();});
  U.button(br,"入れ替わり（C8 00 → 00 C8）",function(){ms.set(0);rt.set(5);er.set(2);k=999;draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function sync(){var f=_W13_MSG[ms.get()].free;r2.style.display=f?"":"none";rt.el.style.display=_W13_MSG[ms.get()].rate?"":"none";}
  function parseHex(s,mx){var out=[],ok=true;String(s).trim().split(/[\s,]+/).forEach(function(t){if(!t)return;if(!/^[0-9a-fA-F]{1,2}$/.test(t)){ok=false;return;}out.push(parseInt(t,16));});
    return {v:out.slice(0,mx),ok:ok&&out.length<=mx};}
  function msg(){var m=_W13_MSG[ms.get()];
    if(m.rate){var p=Math.round(1000/rt.get());return {cls:6,id:8,body:[p&255,p>>8,1,0,1,0],ok:true};}
    if(m.free){var c=parseHex(tc.get(),1),d=parseHex(ti.get(),1),b=parseHex(tb.get(),16);
      return {cls:c.v.length?c.v[0]:0,id:d.v.length?d.v[0]:0,body:b.v,ok:c.ok&&d.ok&&b.ok&&c.v.length===1&&d.v.length===1};}
    return {cls:m.cls,id:m.id,body:m.body.slice(),ok:true};}
  sync();
  function draw(){
    var m=msg(),fr=_w13_frame(m.cls,m.id,m.body),n=fr.length,nar=_w13_nar(box),Wd=nar?400:700,o=[],x0=nar?6:14;
    var cr=fr.slice(2,n-2),nk=cr.length;if(k>nk)k=nk;
    /* (a) フレーム */
    o.push(S.T(x0,16,"(a) 組んだフレーム: "+n+" バイト（本体 "+m.body.length+" バイト + 8）","start",nar?10.5:11,"ink",true));
    var cw=Math.min(nar?30:46,(Wd-2*x0)/n),y0=46,h=28;
    var groups=[["sync",0,2],["cls",2,3],["id",3,4],["len",4,6]];if(m.body.length)groups.push(["body",6,6+m.body.length]);groups.push(["ck",n-2,n]);
    groups.forEach(function(g){var c=_W13_FC[g[0]],xa=x0+g[1]*cw,xb=x0+g[2]*cw,nm=_W13_FN[g[0]];
      if(xb-xa>U.tw(nm,9.5)+2)o.push(S.T((xa+xb)/2,y0-6,nm,"middle",9.5,c,true));});
    fr.forEach(function(v,i){var r=_w13_role(i,n),c=_W13_FC[r],cur=(i===k+2&&k<nk),dn=i>=2&&i<n-2&&i-2<k;
      o.push(S.RECT(x0+i*cw+1,y0,cw-2,h,3,U.soft(c),cur?"alias":c,cur?2.6:1.1));
      o.push(S.T(x0+i*cw+cw/2,y0+h/2+4,_w13_hx(v),"middle",cw>30?11:9.5,"ink",true,true));
      if(dn)o.push(S.L(x0+i*cw+3,y0+h+3,x0+(i+1)*cw-3,y0+h+3,"green",2));});
    /* (b) チェックサムの筆算（クラスから本体の終わりまで） */
    var yb=y0+h+24;
    o.push(S.T(x0,yb,nar?"(b) チェックサム（"+k+" / "+nk+" バイト）":"(b) チェックサム: 1 バイトずつ CK_A に足し、CK_A の途中の値を CK_B に足す（"+k+" / "+nk+" バイト）","start",nar?9.5:10.5,"ink",true));
    var ya=yb+18,yB=yb+36;
    o.push(S.TX(x0+2*cw-4,ya+4,"CK_A","end",9.5,"green",true));o.push(S.TX(x0+2*cw-4,yB+4,"CK_B","end",9.5,"green",true));
    var A=0,B=0;
    if(k===0)o.push(S.T(x0+2*cw+4,ya+12,nar?"「1 バイト進める」で足していく":"「1 バイト進める」で、クラスのバイトから順に足していく","start",9.5,"muted"));
    for(var i=0;i<k;i++){A=(A+cr[i])&255;B=(B+A)&255;
      o.push(S.T(x0+(i+2)*cw+cw/2,ya+4,_w13_hx(A),"middle",cw>30?10.5:9,"ink",i===k-1,true));
      o.push(S.T(x0+(i+2)*cw+cw/2,yB+4,_w13_hx(B),"middle",cw>30?10.5:9,"ink",i===k-1,true));}
    if(k===nk){o.push(S.ARR(x0+(nk+1.6)*cw,ya,x0+(n-2)*cw+cw/2-4,ya,"green",1.3,5));o.push(S.ARR(x0+(nk+1.6)*cw,yB,x0+(n-1)*cw+cw/2-4,yB,"green",1.3,5));
      o.push(S.T(x0+(n-2)*cw+cw/2,ya+4,_w13_hx(fr[n-2]),"middle",10.5,"green",true,true));o.push(S.T(x0+(n-1)*cw+cw/2,yB+4,_w13_hx(fr[n-1]),"middle",10.5,"green",true,true));}
    /* (c) 受ける側 */
    var e=er.get(),bad=fr.slice(),mark=[],note="";
    if(e===1){var p1=m.body.length?6:2;bad[p1]=(bad[p1]+1)&255;mark=[p1];}
    else if(e===2){if(m.body.length>=2){var t=bad[6];bad[6]=bad[7];bad[7]=t;mark=[6,7];}else note="本体が 2 バイトより短いので、入れ替えない";}
    else if(e===3){bad[n-2]=(bad[n-2]+1)&255;mark=[n-2];}
    else if(e===4){bad[4]=0;bad[5]=4;mark=[4,5];}
    else if(e===5){var L2=m.body.length+16;bad[4]=L2&255;bad[5]=L2>>8;mark=[4];}
    else if(e===6){bad=fr.slice(0,8);mark=[7];}
    var ack=_w13_frame(5,1,[6,8]),st=bad.concat(ack,fr),parts=[[0,bad.length,"届いたフレーム"],[bad.length,bad.length+ack.length,"ACK"],[bad.length+ack.length,st.length,"同じフレーム"]];
    var P=_w13_poll(st,rs.get());
    var yc=yB+30;
    o.push(S.T(x0,yc,"(c) 受ける側に届いたバイト（後ろに ACK と、同じフレームがもう 1 つ続く）","start",nar?9.5:10.5,"ink",true));
    var per=nar?Math.min(st.length,13):Math.min(st.length,24),cw2=(Wd-2*x0)/per,rows=Math.ceil(st.length/per),yr0=yc+40,rh=70;
    function xy(i){return [x0+(i%per)*cw2,yr0+Math.floor(i/per)*rh];}
    st.forEach(function(v,i){var q=xy(i),pi=i<bad.length?0:(i<bad.length+ack.length?1:2),base=pi===0?bad:(pi===1?ack:fr),j=i-parts[pi][0],c=_W13_FC[_w13_role(j,base.length)],isb=pi===0&&mark.indexOf(j)>=0;
      o.push(S.RECT(q[0]+1,q[1],cw2-2,22,3,isb?U.soft("alias"):U.soft(c),isb?"alias":c,isb?2:1));
      o.push(S.T(q[0]+cw2/2,q[1]+15,_w13_hx(v),"middle",cw2>28?10:8.5,"ink",true,true));});
    /* 取り出したもの・捨てたもの（括弧） */
    function span(a,b,lv,c,lab){for(var rr=Math.floor(a/per);rr<=Math.floor(b/per);rr++){var ia=Math.max(a,rr*per),ib=Math.min(b,rr*per+per-1),qa=xy(ia),qb=xy(ib),yy=qa[1]-6-lv*14;
        o.push(S.W([qa[0]+2,yy+4,qa[0]+2,yy,qb[0]+cw2-2,yy,qb[0]+cw2-2,yy+4],c,1.6));
        if(rr===Math.floor(a/per))o.push(S.T(qa[0]+3,yy-3,lab,"start",9,c,true,false,null,true));}}
    P.ev.forEach(function(ev){if(ev.ok){var nm=ev.cls===5&&ev.id===1?"ACK":(ev.cls===5&&ev.id===0?"NAK":_w13_hx(ev.cls)+" "+_w13_hx(ev.id));span(ev.a,ev.b,0,"green","✓ "+nm);}
      else span(ev.a,ev.b,1,"alias","× "+ev.name);});
    if(P.pend){var qp=xy(P.pend.a);o.push(S.T(qp[0]+2,qp[1]-34,"待っている（あと "+P.pend.need+" バイト）","start",9,"gold",true,false,null,true));}
    var hgt=yr0+(rows-1)*rh+40;
    box.set(S.svg(Wd,hgt,o));
    /* 読み出し */
    var hx=fr.map(_w13_hx).join(" "),h2="フレーム: <b style=\"font-family:var(--mono)\">"+hx+"</b>";
    if(!m.ok)h2+='<br><span class="warn">16 進で読めない欄がある（読めた所だけで組んだ）</span>';
    if(_W13_MSG[ms.get()].rate){var pm=Math.round(1000/rt.get());h2+="<br>本体: 測る間隔 "+pm+" ms（0x"+_w13_hx(pm>>8)+_w13_hx(pm&255)+" を下位のバイトから "+_w13_hx(pm&255)+" "+_w13_hx(pm>>8)+"）・何回測るごとに位置を出すか 1・時刻の基準 1（GPS 時刻）";}
    var ok=P.ev.filter(function(v){return v.ok;}),ng=P.ev.filter(function(v){return !v.ok;});
    h2+="<br>受ける側: 取り出したフレーム "+ok.length+" 個・捨てたもの "+ng.length+" 個"+(ng.length?"（"+ng.map(function(v){return v.name;}).join("・")+"）":"")+(P.pend?"・待っているフレームあり":"");
    if(e===1||e===2||e===3){if(note)h2+="<br>"+note;else{var a0=fr.slice(2,n-2),a1=bad.slice(2,n-2),x0_=0,x1_=0,s0=0,s1=0;a0.forEach(function(v){x0_^=v;s0=(s0+v)&255;});a1.forEach(function(v){x1_^=v;s1=(s1+v)&255;});
      var c1=_w13_ck(a1),got=[bad[n-2],bad[n-1]],fl=!(c1[0]===got[0]&&c1[1]===got[1]);
      if(e===3){x1_=x0_;s1=s0;}
      h2+="<br>3 つの検査: 排他的論理和 "+(x0_!==x1_||e===3?'<span class="ok">気づく</span>':'<span class="warn">気づかない</span>')+"・8 bit の和 "+(s0!==s1||e===3?'<span class="ok">気づく</span>':'<span class="warn">気づかない</span>')+"・フレッチャー "+(fl?'<span class="ok">気づく</span>':'<span class="warn">気づかない</span>');
      if(e===2&&m.body.length>=2)h2+="（CK_B の変化 = (q − p)(a<sub>q</sub> − a<sub>p</sub>) = 1 × ("+bad[6]+" − "+bad[7]+")）";}}
    if(e>=4&&!rs.get())h2+='<br><span class="warn">探し直さないので、誤ったフレームが飲み込んだ後ろのフレームも失う</span>';
    ro.innerHTML=h2;
  }
  draw();
};

/* ---- 3 節: 更新レート・出す文・ボーレートと、負荷率・位置の遅れ ---- */
var _W13_SATS={GP:[[5,45,123,47],[13,62,45,49],[15,30,210,44],[18,15,300,38],[20,72,280,50],[23,25,150,42],[24,40,330,45],[29,10,60,36],[30,5,250,null],[31,2,100,null]],
  GL:[[66,35,20,43],[67,55,110,46],[76,20,250,40],[77,48,300,44],[82,8,180,null],[83,3,140,null]],
  GA:[[2,40,70,45],[7,65,200,48],[8,22,320,41],[13,30,140,43],[26,50,260,46],[30,12,30,37],[33,4,190,null]],
  GB:[[6,55,190,42],[9,62,210,44],[16,48,170,43],[19,33,60,45],[20,70,320,47],[29,25,280,41],[35,15,110,38],[44,6,40,null]]};
/* 例の文の並び（10 章の w10_uart と同じ作り方）。[[種類, 長さ], …] */
function _w13_nmea(nsys,kinds){var talk=["GP","GL","GA","GB"].slice(0,nsys),used=talk.map(function(t){return _W13_SATS[t].filter(function(s){return s[3]!=null;}).map(function(s){return s[0];});}),nused=0;
  used.forEach(function(u){nused+=u.length;});
  function p2(v){return (v<10?"0":"")+v;} function p3(v){return (v<10?"00":(v<100?"0":""))+v;}
  var bodies=[];
  kinds.forEach(function(k){
    if(k==="GGA")bodies.push([k,"GNGGA,092750.00,3540.86000,N,13946.02000,E,1,"+p2(nused)+",0.80,3.3,M,36.7,M,,"]);
    else if(k==="RMC")bodies.push([k,"GNRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A"]);
    else if(k==="GSA")used.forEach(function(u){var f=u.map(p2);while(f.length<12)f.push("");bodies.push([k,"GNGSA,A,3,"+f.join(",")+",1.50,0.80,1.27"]);});
    else if(k==="GSV")talk.forEach(function(t){var ss=_W13_SATS[t],nm=Math.ceil(ss.length/4);for(var m=0;m<nm;m++){var fl=[t+"GSV",String(nm),String(m+1),p2(ss.length)];
      ss.slice(4*m,4*m+4).forEach(function(s){fl.push(p2(s[0]),p2(s[1]),p3(s[2]),s[3]==null?"":p2(s[3]));});bodies.push([k,fl.join(",")]);}});
    else if(k==="VTG")bodies.push([k,"GNVTG,,T,,M,0.012,N,0.022,K,A"]);
    else if(k==="GLL")bodies.push([k,"GNGLL,3540.86000,N,13946.02000,E,092750.00,A,A"]);});
  return bodies.map(function(b){return [b[0],b[1].length+6];});}   /* $ と *XX と CR LF の 6 文字を足す */
var _W13_KINDS=[["GGA","位置","signal"],["RMC","時刻・位置・速度","purple"],["GSA","使った衛星と DOP","green"],["GSV","見えている衛星","gold"],["VTG","速度","teal"],["GLL","緯度・経度","muted"]];
var _W13_POS={BIN:1,GGA:1,RMC:1,GLL:1};   /* 位置を書いたもの */
REG.w13_rate=function(el,U){
  var S=U.S;
  U.head(el,"UPDATE RATE","更新レート・出す文・ボーレートと、負荷率・位置の遅れ・動いている機器が使う位置のずれ");
  var r1=U.ctrls(el),ck={};
  _W13_KINDS.forEach(function(k){ck[k[0]]=U.checkbox(r1,k[0],true,function(){draw();});});
  ck.BIN=U.checkbox(r1,"バイナリの位置のフレーム（100 B）",false,function(){draw();});
  var r2=U.ctrls(el);
  var sys=U.select(r2,"衛星系",["GPS","GPS + GLONASS","GPS + GLONASS + Galileo","GPS + GLONASS + Galileo + BeiDou"],1,function(){draw();});
  var rate=U.slider(r2,"更新レート",{values:[1,2,4,5,10],value:1,fmt:function(v){return v+" Hz";},onInput:function(){draw();}});
  var bauds=[4800,9600,19200,38400,57600,115200,230400,460800,921600];
  var baud=U.select(r2,"ボーレート",bauds.map(function(b){return {v:String(b),t:_w13_g(b)+" bit/s"};}),"9600",function(){draw();});
  var r3=U.ctrls(el);
  var tcs=U.slider(r3,"計算の時間 t<sub>c</sub>（例の値）",{min:0,max:0.3,step:0.01,value:0.12,fmt:function(v){return _w13_f(v,2)+" s";},onInput:function(){draw();}});
  var vs=U.slider(r3,"機器の速さ",{values:[0,4,20,50,100,200,300],value:100,fmt:function(v){return v+" km/h";},onInput:function(){draw();}});
  var tt=U.slider(r3,"時刻 t",{min:0,max:10,step:0.01,value:1.5,fmt:function(v){return _w13_f(v,2)+" s";},onInput:function(){draw();}});
  var br=U.btnrow(el);
  function setAll(kinds,bin,s,r,b){_W13_KINDS.forEach(function(k){ck[k[0]].set(kinds.indexOf(k[0])>=0);});ck.BIN.set(bin);sys.set(s);rate.set(r);baud.set(String(b));tcs.set(0.12);draw();}
  var ALL=["GGA","RMC","GSA","GSV","VTG","GLL"];
  U.button(br,"本文の例（11 文・1 Hz・9600）",function(){tick.stop();vs.set(100);tt.set(1.5);setAll(ALL,false,1,1,9600);});
  U.button(br,"2 Hz にする（130 %）",function(){setAll(ALL,false,1,2,9600);});
  U.button(br,"5 Hz・115 200",function(){setAll(ALL,false,1,5,115200);});
  U.button(br,"10 Hz・GGA と RMC だけ・115 200",function(){setAll(["GGA","RMC"],false,1,10,115200);});
  U.button(br,"10 Hz・バイナリだけ・9600",function(){setAll([],true,1,10,9600);});
  var tick=U.ticker(function(){var v=tt.get()+0.05;if(v>10){v=0;}tt.set(v);draw();},50);
  U.button(br,"再生",function(){tick.start();});
  U.button(br,"止める",function(){tick.stop();});
  var box=U.svgbox(el),ro=U.readout(el);
  function draw(){
    var kinds=_W13_KINDS.map(function(k){return k[0];}).filter(function(k){return ck[k].get();}),ns=sys.get()+1,ss=_w13_nmea(ns,kinds);
    if(ck.BIN.get())ss.unshift(["BIN",100]);
    var NB=0,tpos=null;ss.forEach(function(s){NB+=s[1];if(tpos===null&&_W13_POS[s[0]])tpos=NB;});
    var R=rate.get(),Tu=1/R,B=parseInt(baud.get(),10),tc=tcs.get(),ttx=10*NB/B,load=ttx/Tu,tp=tpos===null?null:10*tpos/B,v=vs.get()/3.6,t=tt.get();
    var nar=_w13_nar(box),Wd=nar?400:700,o=[],x0=nar?6:14;
    /* 回ごとの出力: 出し始め・位置の文の終わり・全部の終わり */
    var ep=[],endp=-1e9;for(var m=0;m<=Math.round(10.5*R)+1;m++){var e0=m*Tu,s0=Math.max(e0+tc,endp);endp=s0+ttx;ep.push({e:e0,s:s0,p:tp===null?null:s0+tp,f:endp});}
    /* (a) 線の上の時間（3 s） */
    var Pa=U.plot(nar?40:90,30,Wd-(nar?50:110),40,[0,3],[0,1]);
    o.push(S.T(x0,16,"(a) 線の上の時間（青が位置を書いた文まで、金がその後の文。縦の線は位置を求める時刻）","start",nar?9:10.5,"ink",true));
    o.push(S.RECT(Pa.x,Pa.y,Pa.w,Pa.h,2,"var(--screen)","line",0.8));
    ep.forEach(function(q){if(q.e>3)return;o.push(S.L(Pa.X(q.e),Pa.y-4,Pa.X(q.e),Pa.y+Pa.h+4,"ink",1.3));
      if(q.s<3){var a=q.s,b=Math.min(q.f,3);if(q.p!==null){var pb=Math.min(q.p,3);o.push(S.RECT(Pa.X(a),Pa.y+8,Math.max(1,Pa.X(pb)-Pa.X(a)),Pa.h-16,0,U.soft("signal"),"signal",1));
          if(pb<b)o.push(S.RECT(Pa.X(pb),Pa.y+8,Math.max(1,Pa.X(b)-Pa.X(pb)),Pa.h-16,0,U.soft("gold"),"gold",1));}
        else o.push(S.RECT(Pa.X(a),Pa.y+8,Math.max(1,Pa.X(b)-Pa.X(a)),Pa.h-16,0,U.soft("gold"),"gold",1));}});
    [0,0.5,1,1.5,2,2.5,3].forEach(function(z){o.push(S.T(Pa.X(z),Pa.y+Pa.h+15,z===3?"3 s":String(z),"middle",9,"muted"));});
    if(t<=3)o.push(S.L(Pa.X(t),Pa.y-8,Pa.X(t),Pa.y+Pa.h+8,"alias",1.6,"4 3"));
    o.push(S.T(Pa.x-6,Pa.y+Pa.h/2+4,"TXD","end",9.5,"gold",true));
    /* (b) 回ごとの位置の遅れ（10 s） */
    var yb=Pa.y+Pa.h+40,ymax=1;
    if(tp!==null){ep.forEach(function(q){if(q.e<=10)ymax=Math.max(ymax,q.p-q.e);});}ymax=Math.ceil(ymax*2)/2;
    var Pb=U.plot(nar?40:90,yb+14,nar?Wd-50:300,110,[0,10],[0,ymax]);
    o.push(S.TX(x0,yb,"(b) 回ごとの位置の遅れ t_d","start",nar?9.5:10.5,"ink",true));
    o.push(Pb.axes({xl:"時間 t [s]",yl:"遅れ [s]",ylOff:30,sz:9}));
    if(tp!==null)ep.forEach(function(q){if(q.e<=10)o.push(S.D(Pb.X(q.e),Pb.Y(q.p-q.e),load>1?"alias":"signal",2.4));});
    if(t<=10)o.push(S.L(Pb.X(t),Pb.y,Pb.X(t),Pb.y+Pb.h,"alias",1.2,"4 3"));
    /* (c) 動いている機器 */
    var xc=nar?x0:Pb.x+Pb.w+30,yc=nar?yb+180:yb,wc=nar?Wd-2*x0:Wd-xc-14;
    o.push(S.T(xc,yc,"(c) "+vs.get()+" km/h の機器（時刻 t）","start",nar?9.5:10.5,"ink",true));
    var last=null;if(tp!==null)ep.forEach(function(q){if(q.p<=t)last=q;});
    var sc=wc/60,cx=xc+wc*0.78,ry=yc+50;
    o.push(S.RECT(xc,ry-18,wc,36,4,"var(--screen)","line",0.8));
    var off=(v*t)%10;for(var z=-1;z<8;z++){var mx=cx-(z*10+off)*sc;if(mx>xc+4&&mx<xc+wc-10)o.push(S.L(mx,ry,mx+4*sc,ry,"faint",2));}
    o.push(S.RECT(cx-9,ry-8,18,16,3,U.soft("green"),"green",1.6));o.push(S.T(cx,ry+30,"いま","middle",9,"green",true));
    if(last){var d=v*(t-last.e),gx=cx-d*sc;if(gx>xc+4){o.push(S.CIRC(gx,ry,6,"gold",2,U.soft("gold")));o.push(S.T(gx,ry-12,"使う位置","middle",9,"gold",true,false,null,true));
        if(cx-gx>24)o.push(S.DARR(gx+8,ry+11,cx-11,ry+11,"gold",1.1,5));}
      o.push(S.T(xc+4,ry+30,"後れ "+_w13_f(d,1)+" m（"+_w13_f(t-last.e,2)+" s 前の位置）","start",9.5,"gold",true));}
    else o.push(S.T(xc+4,ry+30,tp===null?"位置を書いた文が無い":"まだ位置が届いていない","start",9.5,"alias",true));
    var H=nar?yc+96:Math.max(Pb.y+Pb.h+40,ry+44);
    box.set(S.svg(Wd,H,o));
    /* 読み出し */
    var h="1 回 <b>"+NB+" バイト</b>（"+ss.length+" 個）× "+R+" 回/s = データ量 "+_w13_g(NB*R)+" B/s、負荷率 <b>"+_w13_f(load*100,load<0.1?1:0)+" %</b>（1 回を送る時間 t<sub>tx</sub> = "+_w13_f(ttx*1000,ttx<0.1?1:0)+" ms）<br>";
    if(tp===null)h+='<span class="warn">位置を書いた文（GGA・RMC・GLL）かバイナリのフレームを選ぶ</span>';
    else{var td=tc+tp;h+="位置の遅れ: 計算 "+_w13_f(tc,2)+" s + 位置を書いたものまで "+_w13_f(tp*1000,tp<0.1?1:0)+" ms = <b>"+_w13_f(td,3)+" s</b>";
      if(load>1)h+='<br><span class="warn">負荷率が 100 % を超えている: 遅れが 1 秒に '+_w13_f(load-1,2)+" s ずつ増える（10 s 後に "+_w13_f(td+10*(load-1),1)+" s。実際はバッファがあふれて文が捨てられる）</span>";
      else{var age=td+Tu/2;h+="。使う位置の古さは平均 "+_w13_f(age,3)+" s（遅れ + 間隔の半分）で、"+vs.get()+" km/h なら平均 <b>"+_w13_f(v*age,1)+" m</b> 後ろ";}}
    ro.innerHTML=h;
  }
  draw();
};

/* ---- 5 節: 省電力の方式と、平均の電流・電池の持ち時間 ---- */
var _W13_IA=35,_W13_IT=25,_W13_IB=0.015,_W13_TH=2,_W13_TW=30;   /* mA・s（10 章・5 章の例の値） */
/* 周期的に起きる方式の平均の電流 [mA]（5 節の式。図の _f13_iavg と同じ） */
function _w13_iavg(Tu,ttrk,teph,agnss){if(Tu<=_W13_TH+ttrk)return _W13_IT;
  if(agnss||Tu<teph){var q=_W13_IA*_W13_TH+_W13_IT*ttrk+_W13_IB*(Tu-_W13_TH-ttrk);return q/Tu+(agnss?0:_W13_IA*(_W13_TW-_W13_TH)/teph);}
  var q2=_W13_IA*_W13_TW+_W13_IT*ttrk+_W13_IB*(Tu-_W13_TW-ttrk);return q2/Tu;}
function _w13_tstr(s){if(s<120)return _w13_f(s,s<10?1:0)+" s";if(s<7200)return _w13_f(s/60,s<600?1:0)+" 分";if(s<172800)return _w13_f(s/3600,s<36000?1:0)+" 時間";if(s<3*365*86400)return _w13_f(s/86400,s<864000?1:0)+" 日";return _w13_f(s/(365*86400),1)+" 年";}
REG.w13_power=function(el,U){
  var S=U.S;
  U.head(el,"POWER SAVE","省電力の方式と周期で、平均の電流・電池の持ち時間・起きるたびの TTFF が変わる");
  var r1=U.ctrls(el);
  var md=U.select(r1,"方式",["連続（追尾を続ける）","周期的に起きる","必要なときだけ（ばらばらの時刻に起こす）"],1,function(){draw();});
  var tu=U.slider(r1,"周期 T<sub>u</sub>（必要なときだけでは、起こす間隔の平均）",{min:2.5,max:86400,log:true,value:60,snap:function(v){return v<10?Math.round(v*10)/10:(v<100?Math.round(v):(v<3600?Math.round(v/10)*10:Math.round(v/600)*600));},fmt:_w13_tstr,onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var tk=U.slider(r2,"位置が出た後の追尾 t<sub>trk</sub>",{min:0,max:60,step:1,value:0,fmt:function(v){return v+" s";},onInput:function(){draw();}});
  var te=U.select(r2,"エフェメリスの有効な時間",[{v:"7200",t:"2 時間（本文の例）"},{v:"10800",t:"3 時間"},{v:"14400",t:"4 時間"}],"7200",function(){draw();});
  var ag=U.checkbox(r2,"A-GNSS でエフェメリスを受け取る",false,function(){draw();});
  var bt=U.select(r2,"電池",[{v:"220",t:"コイン形 220 mAh"},{v:"1000",t:"1000 mAh"},{v:"2000",t:"2000 mAh（本文の例）"},{v:"3000",t:"3000 mAh"}],"2000",function(){draw();});
  var br=U.btnrow(el),seed=13;
  U.button(br,"本文の例（60 s ごと）",function(){md.set(1);tu.set(60);tk.set(0);te.set("7200");ag.set(false);bt.set("2000");draw();});
  U.button(br,"1 時間ごと",function(){md.set(1);tu.set(3600);draw();});
  U.button(br,"4 時間ごと（毎回ウォーム）",function(){md.set(1);tu.set(14400);draw();});
  U.button(br,"2.8 s（損益分岐の近く）",function(){md.set(1);tu.set(2.8);draw();});
  U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  /* 必要なときだけ: 平均 Tu の指数分布の間隔で起こし、エフェメリスの古さでホット・ウォームを決める */
  function ondemand(Tu,ttrk,teph,agn){var r=U.rng(seed),Q=0,T=0,age=0,nw=0,nwarm=0,wakes=[];
    for(var i=0;i<4000;i++){var d=Math.max(1,r.exp(Tu));age+=d;var warm=!agn&&age>=teph,ta=warm?_W13_TW:_W13_TH;if(warm){nwarm++;age=0;}
      var tw=ta+ttrk;Q+=_W13_IA*ta+_W13_IT*ttrk+_W13_IB*Math.max(0,d-tw);T+=Math.max(d,tw);nw++;if(wakes.length<40)wakes.push([T-Math.max(d,tw)+Math.max(0,d-tw),ta,warm]);}
    return {I:Q/T,warmFrac:nwarm/nw,wakes:wakes};}
  function draw(){
    var mode=md.get(),Tu=tu.get(),ttrk=tk.get(),teph=parseInt(te.get(),10),agn=ag.get(),Qb=parseInt(bt.get(),10),nar=_w13_nar(box),Wd=nar?400:700,o=[],x0=nar?6:14;
    var I,warm=false,od=null;
    if(mode===0)I=_W13_IT;else if(mode===1){I=_w13_iavg(Tu,ttrk,teph,agn);warm=!agn&&Tu>=teph;}else{od=ondemand(Tu,ttrk,teph,agn);I=od.I;}
    var life=Qb/I*3600;
    /* (a) 電流の形 */
    var span=mode===0?150:(mode===1?3*Tu:Math.max(3*Tu,60));
    var Pa=U.plot(nar?46:84,30,Wd-(nar?56:104),90,[0,span],[0.01,100],{ylog:true});
    o.push(S.T(x0,16,"(a) 電流の形（縦は対数の目盛）","start",nar?10:11,"ink",true));
    var un=span<=600?[1,"s"]:(span<=6*3600?[60,"分"]:(span<=6*86400?[3600,"時間"]:[86400,"日"]));
    o.push(Pa.axes({yt:[0.01,0.1,1,10,100],xt:[0,span/3,2*span/3,span],xfmt:function(z){var q=z/un[0];return (q===0?"0":(Math.abs(q-Math.round(q))>1e-6?_w13_f(q,1):_w13_f(q,0)))+" "+un[1];},yfmt:function(z){return String(z);},sz:9,ylOff:34}));
    o.push(S.T(Pa.x-40,Pa.y+Pa.h/2-6,"電流","middle",9,"muted"));o.push(S.T(Pa.x-40,Pa.y+Pa.h/2+6,"[mA]","middle",9,"muted"));
    var pts=[];
    if(mode===0){pts=[[0,_W13_IA],[_W13_TH,_W13_IA],[_W13_TH,_W13_IT],[span,_W13_IT]];}
    else{var ws=[];if(mode===1){for(var k=0;k*Tu<=span;k++){var w=!agn&&(Tu>=teph||(k>0&&Math.floor(k*Tu/teph)>Math.floor((k-1)*Tu/teph)));ws.push([k*Tu,w?_W13_TW:_W13_TH,w]);}}
      else od.wakes.forEach(function(q){if(q[0]<=span)ws.push(q);});
      pts=[[0,_W13_IB]];ws.forEach(function(q){var a=q[0],b=q[0]+q[1],c=b+ttrk;pts.push([a,_W13_IB],[a,_W13_IA],[b,_W13_IA]);if(ttrk>0)pts.push([b,_W13_IT],[c,_W13_IT]);pts.push([c,_W13_IB]);});
      pts.push([span,_W13_IB]);}
    var px=pts.map(function(p){return [Pa.X(Math.min(p[0],span)),Pa.Y(p[1])];});
    o.push(S.PL(px,mode===0?"signal":(mode===1?"gold":"purple"),2));
    /* (b) 周期と平均の電流 */
    var yb=Pa.y+Pa.h+48,Pb=U.plot(nar?46:84,yb+14,nar?Wd-56:330,150,[1,86400],[0.01,100],{xlog:true,ylog:true});
    o.push(S.TX(x0,yb,"(b) 周期 T_u と平均の電流（周期的に起きる方式。点は今の値）","start",nar?9.5:10.5,"ink",true));
    o.push(S.RECT(Pb.X(teph),Pb.y,Pb.X(Math.min(86400,teph*2))-Pb.X(teph),Pb.h,0,U.soft("alias"),"none",0));
    o.push(Pb.axes({xt:[1,60,3600,86400],yt:[0.01,0.1,1,10,100],xfmt:function(z){return {1:"1 s",60:"1 分",3600:"1 時間",86400:"1 日"}[z];},yfmt:function(z){return String(z);},sz:9,ylOff:34}));
    var c1=[],c2=[];for(var j=0;j<=200;j++){var T=Math.pow(10,j/200*Math.log10(86400));if(T>_W13_TH+ttrk){c1.push([T,_w13_iavg(T,ttrk,teph,false)]);c2.push([T,_w13_iavg(T,ttrk,teph,true)]);}}
    o.push(Pb.line([[1,_W13_IT],[86400,_W13_IT]],"signal",1.6));
    o.push(Pb.clip(c1,"gold",2.2));o.push(Pb.clip(c2,"green",1.6,"5 3"));
    o.push(S.T(Pb.X(Math.sqrt(teph*Math.min(86400,teph*2))),Pb.y+12,"有効な時間","middle",8.5,"alias",true,false,null,true));
    o.push(S.LEGL(Pb.x,Pb.y+Pb.h+30,[["signal",null,"連続"],["gold",null,"周期的に起きる"],["green","5 3","A-GNSS"]],9,10));
    if(mode>0&&Tu>=1){o.push(S.D(Pb.X(Tu),Pb.Y(Math.max(0.01,Math.min(100,I))),mode===1?"ink":"purple",4));}
    /* (c) 1 周期の電荷の内訳 */
    var xc=nar?x0:Pb.x+Pb.w+40,yc=nar?Pb.y+Pb.h+56:yb,wc=nar?Wd-2*x0:Wd-xc-14;
    o.push(S.T(xc,yc,"(c) 平均の電流の内訳","start",nar?9.5:10.5,"ink",true));
    var parts=[];
    if(mode===0)parts=[["追尾 25 mA",_W13_IT,"signal"]];
    else if(mode===1){var ta=warm?_W13_TW:_W13_TH,Tq=Math.max(Tu,ta+ttrk);parts=[["捕捉（"+(warm?"ウォーム":"ホット")+" "+ta+" s）",_W13_IA*ta/Tq,warm?"alias":"gold"],["追尾 "+ttrk+" s",_W13_IT*ttrk/Tq,"signal"],["眠る",_W13_IB*Math.max(0,Tu-ta-ttrk)/Tq,"muted"]];
      if(!warm&&!agn&&Tu>_W13_TH+ttrk)parts.push(["エフェメリスを受け直す",_W13_IA*(_W13_TW-_W13_TH)/teph,"alias"]);}
    else parts=[["シミュレーションの平均",I,"purple"]];
    var tot=0;parts.forEach(function(p){tot+=p[1];});
    parts=parts.filter(function(p){return p[1]>0;});
    parts.forEach(function(p,i){var yy=yc+30+i*34,ww=Math.max(1,(wc-90)*p[1]/Math.max(tot,1e-9));o.push(S.T(xc,yy-14,p[0],"start",9,"muted"));
      o.push(S.RECT(xc,yy-10,ww,13,2,U.soft(p[2]),p[2],1));
      o.push(S.T(xc+ww+4,yy+1,_w13_f(p[1],p[1]<0.01?4:(p[1]<1?3:2))+" mA","start",9,p[2],true));});
    var H=nar?yc+30+parts.length*34+10:Math.max(Pb.y+Pb.h+44,yc+30+parts.length*34+10);
    box.set(S.svg(Wd,H,o));
    /* 読み出し */
    var h="平均の電流 <b>"+(I>=1?_w13_f(I,2)+" mA":_w13_f(I*1000,I<0.1?1:0)+" µA")+"</b>、"+Qb+" mAh の電池で <b>"+_w13_tstr(life)+"</b>（自己放電は入れていない）<br>";
    if(mode===0)h+="位置は更新レートで出し続ける（TTFF の待ちは最初の 1 回だけ）";
    else if(mode===1){var ttf=warm?_W13_TW:_W13_TH;h+="起きるたびの TTFF: "+(warm?'<span class="warn">ウォーム 30 s（眠る時間がエフェメリスの有効な時間を超える）</span>':"ホット 2 s"+(agn?"":"（有効な時間ごとに 1 回はウォーム 30 s）"))+"、位置の更新の間隔 "+_w13_tstr(Tu);
      if(I>_W13_IT-1e-9)h+='<br><span class="warn">連続より電流が大きい（周期が損益分岐の 2.8 s より短い）</span>';}
    else h+="起こす間隔はばらばら（平均 "+_w13_tstr(Tu)+"）。ウォームスタートになった割合 "+_w13_f(od.warmFrac*100,0)+" %（4000 回のシミュレーション）";
    ro.innerHTML=h;
  }
  draw();
};
