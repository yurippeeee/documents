/* ===== 12 章 NMEA を読む — 文の形式とチェックサム ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w12_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w12_hex2(v){var s=(v&255).toString(16).toUpperCase();return s.length<2?"0"+s:s;}
function _w12_b8(v){var s=(v&255).toString(2);while(s.length<8)s="0"+s;return s.slice(0,4)+" "+s.slice(4);}
function _w12_cks(body){var x=0;for(var i=0;i<body.length;i++)x^=body.charCodeAt(i)&255;return x;}
function _w12_sent(body){return "$"+body+"*"+_w12_hex2(_w12_cks(body));}
function _w12_pad(v,n){var s=String(v);while(s.length<n)s="0"+s;return s;}
function _w12_g(v){return String(v).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
/* 等幅の文字を 1 文字ずつ位置を決めて描く（フォントの幅の違いで欄の位置がずれないように）。segs = [[文字, 色], …] */
function _w12_mono(U,x,y,segs,sz,cw,b){cw=cw||0.6*sz;var h='<text y="'+y.toFixed(2)+'" font-size="'+sz+'" font-family="var(--mono)" font-weight="'+(b?700:400)+'">',k=0;
  segs.forEach(function(sg){var t=sg[0];if(!t)return;var xs=[];for(var i=0;i<t.length;i++)xs.push((x+(k+i)*cw).toFixed(2));
    h+='<tspan x="'+xs.join(" ")+'" fill="'+U.col(sg[1])+'">'+U.esc(t.replace(/ /g," "))+'</tspan>';k+=t.length;});
  return h+'</text>';}
/* 文をカンマの後で折り返す位置（1 行 maxc 文字まで）。返り値は各行の [始め, 終わり] */
function _w12_wrap(line,maxc){var out=[],a=0;while(line.length-a>maxc){var c=line.lastIndexOf(",",a+maxc-1);var b=c>a?c+1:a+maxc;out.push([a,b]);a=b;}out.push([a,line.length]);return out;}
/* 1 行に、等幅の部分（m = true。1 文字ずつ位置を決める）と、ふつうの文字の部分を左から並べる。segs = [[文字, 色, 等幅か, 太字か], …] */
function _w12_mix(U,x,y,segs,sz){var o=[],cw=0.6*sz;segs.forEach(function(sg){if(!sg[0])return;
    if(sg[2]){o.push(_w12_mono(U,x,y,[[sg[0],sg[1]]],sz,cw,sg[3]));x+=sg[0].length*cw;}
    else{o.push(U.S.T(x,y,sg[0],"start",sz,sg[1],sg[3]));x+=U.tw(sg[0],sz);}});return o.join("");}
/* 3 章 3 節の C/N0 のモデル（例のアンテナ・290 K の熱雑音だけ）。figures の _f12_cn0 と同じ */
var _W12_LAM=299792458/1575.42e6;
function _w12_rng(el){var th=el*Math.PI/180;return Math.sqrt(26560e3*26560e3-Math.pow(6371e3*Math.cos(th),2))-6371e3*Math.sin(th);}
function _w12_lfs(r){return 20*Math.log10(4*Math.PI*r/_W12_LAM);}
var _W12_EIRP=-128.5-30+_w12_lfs(_w12_rng(5))+0.5,_W12_N0=10*Math.log10(1.380649e-23*290)+30;
function _w12_cn0(el){return _W12_EIRP+30-_w12_lfs(_w12_rng(el))-0.5+(3-8*Math.pow((90-el)/85,2))-_W12_N0;}
/* 例の文（図と同じ。6 章・7 章の東京の 8 つの GPS の衛星、時刻と日付は例の値） */
var _W12_GGA="GPGGA,092750.00,3540.86000,N,13946.02000,E,1,08,0.95,3.3,M,36.7,M,,";
var _W12_RMC="GPRMC,092750.00,A,3540.86000,N,13946.02000,E,0.012,,111126,,,A";
var _W12_GSA="GPGSA,A,3,02,03,05,06,09,13,16,22,,,,,1.61,0.95,1.30";
var _W12_GSV1="GPGSV,2,1,08,02,41,316,47,03,26,125,45,05,09,269,41,06,52,045,48";
var _W12_GSV2="GPGSV,2,2,08,09,75,187,50,13,21,068,44,16,04,171,40,22,46,235,48";
var _W12_VTG="GPVTG,,T,,M,0.012,N,0.022,K,A";
var _W12_GLL="GPGLL,3540.86000,N,13946.02000,E,092750.00,A,A";
/* C の nmea_feed と同じ状態機械。st: 0 待つ・1 中身・2 上の桁・3 下の桁・4 終わり */
var _W12_STN=["待つ","中身","上の桁","下の桁","終わり"],_W12_STC=["muted","signal","purple","purple","gold"],_W12_STE=["ST_WAIT","ST_BODY","ST_CK1","ST_CK2","ST_END"];
function _w12_hexv(c){return /^[0-9A-Fa-f]$/.test(c)?parseInt(c,16):-1;}
function _w12_feed(m,ch){var c=ch.charCodeAt(0),res=null,h;m.prev=m.st;
  if(ch==="$"){res=m.st===0?null:"ERR_CUT";m.st=1;m.len=0;m.sum=0;m.buf="";return res;}
  if(m.st===1){if(ch==="*")m.st=2;else if(c<0x20||c>0x7E){m.st=0;res="ERR_FORM";}else if(m.len>=76){m.st=0;res="ERR_LONG";}else{m.len++;m.sum^=c;m.buf+=ch;}}
  else if(m.st===2||m.st===3){h=_w12_hexv(ch);if(h<0){m.st=0;res="ERR_FORM";}else if(m.st===2){m.got=h<<4;m.st=3;}else{m.got|=h;m.st=4;}}
  else if(m.st===4){if(ch==="\n"){m.st=0;res=m.got===m.sum?"OK":"ERR_SUM";}else if(ch!=="\r"){m.st=0;res="ERR_FORM";}}
  return res;}
/* 度分形式 → 1e-7 度の整数（C の nmea_dm_e7 と同じ）。誤りは null */
function _w12_dm(s,hemi,maxdeg){var m=/^(\d{3,5})(?:\.(\d*))?$/.exec(s||"");if(!m)return null;var ip=+m[1],deg=Math.floor(ip/100),mi=ip%100;if(deg>maxdeg||mi>=60)return null;
  var f6=((m[2]||"")+"000000").slice(0,6),m6=mi*1000000+(+f6),v=deg*10000000+Math.floor((m6+3)/6);if(v>maxdeg*10000000)return null;
  if(hemi==="S"||hemi==="W")return -v;if(hemi!=="N"&&hemi!=="E")return null;return v;}
function _w12_e7s(v){var a=Math.abs(v),s=Math.floor(a/1e7)+"."+_w12_pad(a%1e7,7);return (v<0?"−":"")+s+"°";}

/* ---- 2 節の後: 時刻・衛星系・仰角マスクを変えて、GSV・GSA の文とスカイプロット・C/N0・DOP を一緒に見る ---- */
REG.w12_gsv=function(el,U){
  var S=U.S,G=U.gnss;
  U.head(el,"GSV ↔ SKY","GSV と GSA — 文の欄と、空の衛星の並び・C/N0・DOP");
  var r1=U.ctrls(el);
  var tm=U.slider(r1,"時刻（時刻 0 から）",{min:0,max:24,step:0.25,value:0,fmt:function(v){return v.toFixed(2)+" 時間";},onInput:function(){draw();}});
  var mk=U.slider(r1,"仰角マスク",{min:0,max:30,step:1,value:0,fmt:function(v){return v+"°";},onInput:function(){draw();}});
  var r2=U.ctrls(el);
  var sy=U.select(r2,"衛星系",["GPS だけ","GPS と GLONASS"],0,function(){sel=null;draw();});
  var bl=U.checkbox(r2,"南の低い空を建物がふさぐ（例）",false,function(){draw();});
  var br=U.btnrow(el);
  var tick=U.ticker(function(){var v=tm.get()+0.25;if(v>24)v=0;tm.set(v);draw();},150);
  U.button(br,"本文の例（時刻 0・GPS・マスク 0°）",function(){tick.stop();tm.set(0);mk.set(0);sy.set(0);bl.set(false);sel=null;draw();});
  U.button(br,"再生",function(){tick.start();});
  U.button(br,"止める",function(){tick.stop();});
  U.button(br,"次の衛星を強調",function(){var L=cur.list;if(!L.length)return;var k=-1;L.forEach(function(q,i){if(q.key===sel)k=i;});sel=L[(k+1)%L.length].key;draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  U.note(el,"スカイプロットの衛星を押すと、その衛星の 4 つの欄が文の中で強調される。白抜きの印と棒は、見えているが位置の計算に使わない衛星。");
  var CON=G.constellation(),RX=G.rx(G.TOKYO[0],G.TOKYO[1],G.TOKYO[2]),sel=null,cur={list:[]},hit=[];
  function compute(){var t=tm.get()*3600,two=sy.get()===1,mask=mk.get(),L=[];
    CON.forEach(function(s){if(s.sys!=="GPS"&&!(two&&s.sys==="GLONASS"))return;var q=G.elaz(RX,G.ecef(s,t));if(q[0]<=0)return;
      var n=+s.nm.slice(1),blk=bl.get()&&q[1]>=120&&q[1]<=240&&q[0]<35,cn=blk?null:Math.round(_w12_cn0(q[0]));
      L.push({sys:s.sys,id:s.sys==="GPS"?n:64+n,el:q[0],az:q[1],cn0:cn,used:cn!==null&&q[0]>=mask,key:s.nm});});
    L.sort(function(a,b){return (a.sys===b.sys?0:(a.sys==="GPS"?-1:1))||a.id-b.id;});
    /* DOP（衛星系ごとに時計のずれの未知数を 1 つ） */
    var U1=L.filter(function(q){return q.used;}),syss=[];U1.forEach(function(q){if(syss.indexOf(q.sys)<0)syss.push(q.sys);});
    var dop=null;
    if(U1.length>=3+syss.length){var Gm=U1.map(function(q){var e=q.el*Math.PI/180,a=q.az*Math.PI/180,r=[-Math.cos(e)*Math.sin(a),-Math.cos(e)*Math.cos(a),-Math.sin(e)];syss.forEach(function(sn){r.push(sn===q.sys?1:0);});return r;});
      try{var M=U.ctl.mat,H=M.inv(M.mul(M.T(Gm),Gm));dop={P:Math.sqrt(H[0][0]+H[1][1]+H[2][2]),H:Math.sqrt(H[0][0]+H[1][1]),V:Math.sqrt(H[2][2])};}catch(e){dop=null;}}
    /* 文を作る */
    var lines=[];
    [["GPS","GP"],["GLONASS","GL"]].forEach(function(sp){var V=L.filter(function(q){return q.sys===sp[0];});if(!V.length)return;var nm=Math.ceil(V.length/4);
      for(var m=0;m<nm;m++){var f=[sp[1]+"GSV",String(nm),String(m+1),_w12_pad(V.length,2)],blocks=[];
        V.slice(4*m,4*m+4).forEach(function(q){var st=f.join(",").length+1;f.push(_w12_pad(q.id,2),_w12_pad(Math.round(q.el),2),_w12_pad(Math.round(q.az)%360,3),q.cn0===null?"":_w12_pad(q.cn0,2));
          blocks.push({a:st+1,b:f.join(",").length+1,q:q});});
        lines.push({kind:"GSV",body:f.join(","),blocks:blocks});}});
    var fix=dop?"3":"1",fmt2=function(v){return dop?v.toFixed(2):"99.99";};
    var tails=dop?[fmt2(dop.P),fmt2(dop.H),fmt2(dop.V)]:["99.99","99.99","99.99"];
    (two?[["GPS","GNGSA"],["GLONASS","GNGSA"]]:[["GPS","GPGSA"]]).forEach(function(sp){var ids=U1.filter(function(q){return q.sys===sp[0];}).slice(0,12).map(function(q){return _w12_pad(q.id,2);});
      while(ids.length<12)ids.push("");lines.push({kind:"GSA",body:[sp[1],"A",fix].concat(ids).concat(tails).join(","),blocks:[]});});
    cur={list:L,used:U1,dop:dop,lines:lines};return cur;}
  function draw(){var c=compute(),nar=_w12_nar(box),Wd=nar?400:700,o=[],sz=nar?11:9.5,cw=0.6*sz,x0=nar?6:14,y=18,maxc=Math.floor((Wd-2*x0)/cw);
    o.push(S.T(x0,y,"1 回分の GSV と GSA（* の後はチェックサム）","start",nar?10:11,"ink",true));y+=18;
    c.lines.forEach(function(ln){var line=_w12_sent(ln.body);
      _w12_wrap(line,maxc).forEach(function(rw){var i0=rw[0],i1=rw[1];
        ln.blocks.forEach(function(bk){var col=bk.q.sys==="GPS"?"signal":"purple",on=bk.q.key===sel,a=Math.max(bk.a,i0),b=Math.min(bk.b,i1);if(b<=a)return;
          o.push(S.RECT(x0+(a-i0)*cw-1,y-sz*0.95,(b-a)*cw+2,sz*1.35,2,on?U.soft("alias"):U.soft(col),on?"alias":"none",on?1.4:0));});
        var ck=line.length-3,segs=[[line.slice(i0,Math.min(i1,ck)),ln.kind==="GSA"?"green":"ink"],[line.slice(Math.max(i0,ck),i1),"muted"]];
        o.push(_w12_mono(U,x0+(i0>0?2*cw:0),y,segs,sz,cw,ln.kind==="GSA"));y+=sz*1.5;});
      y+=sz*0.2;});
    /* スカイプロット */
    var R=nar?80:104,cx=nar?Wd/2:150,cy=y+R+40,mask=mk.get();hit=[];
    o.push(S.T(nar?x0:14,y+14,"空の並び（数字は衛星の番号）","start",nar?10:11,"ink",true));
    o.push(G.sky(U,cx,cy,R,[],{}));
    if(mask>0){var rr=R*(90-mask)/90;o.push('<path d="M'+(cx-R)+','+cy+'a'+R+','+R+' 0 1,0 '+(2*R)+',0a'+R+','+R+' 0 1,0 '+(-2*R)+',0M'+(cx-rr)+','+cy+'a'+rr+','+rr+' 0 1,0 '+(2*rr)+',0a'+rr+','+rr+' 0 1,0 '+(-2*rr)+',0" fill="'+U.soft("alias")+'" fill-rule="evenodd" stroke="none" opacity="0.8"/>');
      o.push(S.CIRC(cx,cy,rr,"alias",1.3,null,"5 3"));o.push(S.T(cx+rr*0.72+4,cy+rr*0.72+12,"マスク "+mask+"°","start",9.5,"alias",true,false,null,true));}
    if(bl.get()){var pts=[];for(var a=120;a<=240;a+=4)pts.push(G.skyxy(cx,cy,R,0,a));for(var a2=240;a2>=120;a2-=4)pts.push(G.skyxy(cx,cy,R,35,a2));
      o.push(S.PL(pts,"alias",1.2,"var(--alias-soft)",null,0.9));o.push(S.T(cx,cy+R*0.78,"建物","middle",10,"alias",true,false,null,true));}
    c.list.forEach(function(q){var p=G.skyxy(cx,cy,R,q.el,q.az),col=q.sys==="GPS"?"signal":"purple";hit.push([p[0],p[1],q.key]);
      if(q.key===sel)o.push(S.CIRC(p[0],p[1],9,"alias",2));
      o.push(q.used?S.D(p[0],p[1],col,4.4):S.CIRC(p[0],p[1],4,col,1.6,"var(--screen)"));
      o.push(S.T(p[0]+6,p[1]+3.5,String(q.id),"start",nar?8.5:9.5,col,true,false,null,true));});
    /* C/N0 の棒 */
    var bx=nar?40:330,bw=nar?Wd-56:Wd-350,by=nar?cy+R+44:y+34,bh=nar?150:2*R-10;
    o.push(S.TX(nar?x0:bx-30,by-14,"C/N_0（3 章 3 節の例のアンテナ。空の欄は追尾していない）","start",nar?9.5:10.5,"ink",true));
    var P=U.plot(bx,by,bw,bh,[0,Math.max(1,c.list.length)],[30,55]);
    o.push(P.axes({yl:"C/N_0 [dB-Hz]",xt:[],yt:[30,35,40,45,50,55],ylOff:nar?30:38}));
    c.list.forEach(function(q,k){var xa=P.X(k+0.15),xb=P.X(k+0.85),col=q.sys==="GPS"?"signal":"purple",on=q.key===sel;
      if(q.cn0===null){o.push(S.T((xa+xb)/2,P.Y(31.5),"空","middle",9,"alias",true));}
      else{o.push(S.RECT(xa,P.Y(q.cn0),xb-xa,P.Y(30)-P.Y(q.cn0),2,q.used?U.soft(col):"var(--screen)",on?"alias":col,on?2.2:1,q.used?null:"3 2"));
        if(xb-xa>12)o.push(S.T((xa+xb)/2,P.Y(q.cn0)-4,String(q.cn0),"middle",nar?8:9,col,true));}
      o.push(S.T((xa+xb)/2,P.Y(30)+13,String(q.id),"middle",nar?7.5:9,on?"alias":"ink",true));});
    var hgt=Math.max(cy+R+38,by+bh+30);
    o.push(S.LEGL(nar?x0:14,hgt,[["signal",null,"GPS（番号は PRN 番号）"]].concat(sy.get()===1?[["purple",null,"GLONASS（番号は 64 + 衛星の番号）"]]:[]),nar?9:10));
    box.set(S.svg(Wd,hgt+12,o));
    /* 読み出し */
    var nG=c.list.filter(function(q){return q.sys==="GPS";}).length,nR=c.list.length-nG,nb=0,ns=0;c.lines.forEach(function(l){nb+=_w12_sent(l.body).length+2;if(l.kind==="GSV")ns++;});
    var h="見えている衛星 "+c.list.length+" 機（GPS "+nG+(sy.get()===1?"・GLONASS "+nR:"")+"）→ GSV は "+ns+" 文。GSV と GSA を合わせて 1 回分 "+nb+" バイト。";
    h+="<br>使った衛星 "+c.used.length+" 機（仰角マスク "+mk.get()+"° 以上で、追尾している衛星）→ GSA: "+(c.dop?"PDOP "+c.dop.P.toFixed(2)+"・HDOP "+c.dop.H.toFixed(2)+"・VDOP "+c.dop.V.toFixed(2)+' <span class="ok">（3 次元の位置）</span>':'<span class="warn">衛星が足りず位置が出ない（測位の品質 0）</span>');
    var nb2=c.list.filter(function(q){return q.cn0===null;}).length;if(nb2)h+="<br>建物でさえぎられた "+nb2+" 機は、GSV に書かれるが C/N0 の欄が空で、GSA には入らない。";
    if(sel){var s=c.list.filter(function(q){return q.key===sel;})[0];if(s)h+="<br>強調した衛星: 番号 "+s.id+"・仰角 "+Math.round(s.el)+"°・方位角 "+(Math.round(s.az)%360)+"°・C/N0 "+(s.cn0===null?"（空）":s.cn0+" dB-Hz")+(s.used?"（位置の計算に使った）":"（使わない）");}
    ro.innerHTML=h;}
  box.el.addEventListener("click",function(e){var sv=box.el.querySelector("svg");if(!sv)return;var m=sv.getScreenCTM();if(!m)return;var p=sv.createSVGPoint();p.x=e.clientX;p.y=e.clientY;var q=p.matrixTransform(m.inverse()),best=null,bd=14;
    hit.forEach(function(hq){var d=Math.hypot(hq[0]-q.x,hq[1]-q.y);if(d<bd){bd=d;best=hq[2];}});if(best){sel=best===sel?null:best;draw();}});
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 3 節の後: 文を選ぶか書き換えて、欄の意味とチェックサムを見る ---- */
var _W12_PRE=[
  ["GGA（本文の例）",_w12_sent(_W12_GGA),0],["RMC",_w12_sent(_W12_RMC),1],["GSA",_w12_sent(_W12_GSA),2],["GSV（1/2）",_w12_sent(_W12_GSV1),3],["GSV（2/2）",_w12_sent(_W12_GSV2),4],
  ["VTG",_w12_sent(_W12_VTG),5],["GLL",_w12_sent(_W12_GLL),6],
  ["GGA（位置が出ていない）",_w12_sent("GPGGA,092720.00,,,,,0,00,99.99,,,,,,"),7],["RMC（位置が出ていない）",_w12_sent("GPRMC,092720.00,V,,,,,,,111126,,,N"),8],
  ["3 節 (a): 1 文字が化けた",_w12_sent(_W12_GGA).replace("3540.86000","3540.85000"),0],
  ["3 節 (b): 2 文字の同じビットが反転",_w12_sent(_W12_GGA).replace("3540.86000","3541.87000"),0],
  ["3 節 (c): 2 文字が入れ替わった",_w12_sent(_W12_GGA).replace("3540.86000","3504.86000"),0],
  ["小文字のチェックサム（GSV 1/2）",_w12_sent(_W12_GSV1).replace(/\*7A$/,"*7a"),3]];
var _W12_MEAN={
  GGA:["話者 ID と文の種類","時刻（UTC）","緯度","北緯 N・南緯 S","経度","東経 E・西経 W","測位の品質","使った衛星の数","HDOP","標高","標高の単位（M = m）","ジオイド高","ジオイド高の単位","補正の年齢 [s]（16 章）","基準局の番号（16 章）"],
  RMC:["話者 ID と文の種類","時刻（UTC）","状態（A 有効・V 警告）","緯度","北緯 N・南緯 S","経度","東経 E・西経 W","速さ [ノット]","進む向き [°]（真北から時計回り）","日付（日・月・年）","磁気の偏角 [°]","偏角の向き","モード（2.3 版から）","航法の状態（4.1 版から）"],
  GSA:["話者 ID と文の種類","2 次元・3 次元の切り替え（A 自動・M 固定）","位置の次元（1 なし・2・3）","使った衛星 1","使った衛星 2","使った衛星 3","使った衛星 4","使った衛星 5","使った衛星 6","使った衛星 7","使った衛星 8","使った衛星 9","使った衛星 10","使った衛星 11","使った衛星 12","PDOP","HDOP","VDOP","衛星系の番号（4.1 版から）"],
  VTG:["話者 ID と文の種類","進む向き（真北から）[°]","T（真北）","進む向き（磁北から）[°]","M（磁北）","速さ [ノット]","N（ノット）","速さ [km/h]","K（km/h）","モード（2.3 版から）"],
  GLL:["話者 ID と文の種類","緯度","北緯 N・南緯 S","経度","東経 E・西経 W","時刻（UTC）","状態（A 有効・V 警告）","モード（2.3 版から）"]};
function _w12_mean(type,k,n){if(type==="GSV"){if(k===0)return "話者 ID と文の種類";if(k<=3)return ["","全部の文の数","何番目の文か","見えている衛星の数"][k];
    var j=(k-4)%4,s=Math.floor((k-4)/4)+1;if((n-4)%4===1&&k===n-1)return "信号の番号（4.1 版から）";return ["衛星 "+s+" の番号","衛星 "+s+" の仰角 [°]","衛星 "+s+" の方位角 [°]","衛星 "+s+" の C/N0 [dB-Hz]"][j];}
  var t=_W12_MEAN[type];return t&&k<t.length?t[k]:"（この表に無い欄）";}
function _w12_val(type,k,f,F){if(f==="")return '<span style="color:var(--muted)">（空）</span>';
  var tm=/^(\d\d)(\d\d)(\d\d(?:\.\d+)?)$/;
  function T_(s){var m=tm.exec(s);return m?m[1]+":"+m[2]+":"+m[3]:"（形が違う）";}
  function LL(s,h,md){var v=_w12_dm(s,h,md);if(v===null)return '<span class="warn">読めない（範囲の外・形が違う）</span>';var m=/^(\d+)(\d\d)(\.\d*)?$/.exec(s);
    return (h==="N"?"北緯 ":h==="S"?"南緯 ":h==="E"?"東経 ":"西経 ")+(+m[1])+"°"+m[2]+(m[3]||"")+"′ = "+_w12_e7s(v)+"（整数 "+_w12_g(v)+"）";}
  if(type==="GGA"){if(k===1)return T_(f);if(k===2)return LL(f,F[3],90);if(k===4)return LL(f,F[5],180);
    if(k===6)return f+": "+({"0":"位置が求まっていない","1":"単独で求めた","2":"補正を使って求めた（DGNSS）","4":"RTK・整数が決まった解（17 章）","5":"RTK・整数が決まる前の解（17 章）","6":"推測した（19 章）","7":"手で入れた値","8":"シミュレーション"}[f]||"（この表に無い値）");
    if(k===9||k===11)return f+" m";}
  if(type==="RMC"){if(k===1)return T_(f);if(k===2)return f==="A"?"A: 有効":f==="V"?'<span class="warn">V: 警告（使わない）</span>':f;if(k===3)return LL(f,F[4],90);if(k===5)return LL(f,F[6],180);
    if(k===7)return f+" ノット = "+(+f*1.852).toFixed(3)+" km/h";if(k===9){var d=/^(\d\d)(\d\d)(\d\d)$/.exec(f);return d?"20"+d[3]+" 年 "+(+d[2])+" 月 "+(+d[1])+" 日（年は 20yy とした）":"（形が違う）";}
    if(k===12)return f+": "+({"A":"単独","D":"補正を使った","E":"推測","N":"無効","M":"手で入れた","S":"シミュレーション"}[f]||"（版による）");}
  if(type==="GSA"){if(k===2)return f+": "+({"1":"位置なし","2":"2 次元","3":"3 次元"}[f]||"？");if(k>=3&&k<=14)return "番号 "+(+f);}
  if(type==="GSV"&&k>=4){var j=(k-4)%4;if(j===1)return f+"°";if(j===2)return (+f)+"°";if(j===3)return f+" dB-Hz";}
  if(type==="GLL"){if(k===1)return LL(f,F[2],90);if(k===3)return LL(f,F[4],180);if(k===5)return T_(f);}
  return _w12_esc(f);}
function _w12_esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
REG.w12_decode=function(el,U){
  var S=U.S;
  U.head(el,"NMEA DECODER","文の欄の意味とチェックサム — 1 文字変えると合わなくなる");
  var r1=U.ctrls(el);
  var ps=U.select(r1,"文",_W12_PRE.map(function(p){return p[0];}),0,function(i){ti.set(_W12_PRE[i][1]);base=_W12_PRE[_W12_PRE[i][2]][1];draw();});
  var r2=U.ctrls(el);
  var ti=U.textin(r2,"文（書き換えられる）",_W12_PRE[0][1],function(){draw();},{width:"100%"});
  ti.input.style.fontFamily="var(--mono)";
  var br=U.btnrow(el),rg=U.rng(12),seed=12;
  U.button(br,"本文の例（GGA）",function(){ps.set(0);ti.set(_W12_PRE[0][1]);base=_W12_PRE[0][1];draw();});
  U.button(br,"1 文字をでたらめに変える",function(){var s=ti.get(),a=s.indexOf("$")+1,b=s.indexOf("*");if(a<1||b<=a)return;var i=a+rg.int(b-a),c;
    do{c=String.fromCharCode(0x30+rg.int(0x4B));}while(c===s[i]||"$*".indexOf(c)>=0);ti.set(s.slice(0,i)+c+s.slice(i+1));draw();});
  U.button(br,"見逃す誤りを作る（2 つの数字の同じビット）",function(){var s=ti.get(),a=s.indexOf("$")+1,b=s.indexOf("*"),ds=[];for(var i=a;i<b;i++)if(/\d/.test(s[i]))ds.push(i);if(ds.length<2)return;
    var i1=ds[rg.int(ds.length)],i2;do{i2=ds[rg.int(ds.length)];}while(i2===i1);var arr=s.split("");[i1,i2].forEach(function(i){arr[i]=String.fromCharCode(arr[i].charCodeAt(0)^1);});ti.set(arr.join(""));draw();});
  U.button(br,"チェックサムを付け直す",function(){var s=ti.get(),a=s.indexOf("$"),b=s.indexOf("*");if(a<0)return;var body=s.slice(a+1,b<0?s.length:b);ti.set(_w12_sent(body));draw();});
  U.button(br,"選んだ文に戻す",function(){ti.set(_W12_PRE[ps.get()][1]);draw();});
  var box=U.svgbox(el),ro=U.readout(el),tb=U.mk("div");el.appendChild(tb);
  var base=_W12_PRE[0][1];
  var FC=["signal","gold","green","purple","teal"];
  function draw(){var s=ti.get().replace(/[\r\n]/g,""),nar=_w12_nar(box),Wd=nar?400:700,o=[],sz=11,cw=0.6*sz,x0=nar?6:14;
    var a=s.indexOf("$"),b=s.indexOf("*",a+1),ok=a===0&&b>a;
    var body=ok?s.slice(1,b):"",ck=ok?s.slice(b+1):"",F=ok?body.split(","):[],type=F.length&&F[0].length===5?F[0].slice(2):"";
    var calc=_w12_cks(body),got=/^[0-9A-Fa-f]{2}$/.test(ck)?parseInt(ck,16):null,ts=nar?9.5:10.5;
    o.push(S.T(x0,16,"文（欄ごとに色を変えた。下の数字は欄の番号）","start",nar?10:11,"ink",true));
    var y=40,maxc=Math.floor((Wd-2*x0)/cw);
    /* 色: 欄ごと。選んだ文と違う文字は赤の地 */
    var bs=base.replace(/[\r\n]/g,""),same=bs.length===s.length,cols=[],fi=0,starts=[],pos=1;
    for(var i=0;i<s.length;i++){var ch=s[i];if(i===0||ch==="$")cols.push("signal");else if(b>0&&i>=b)cols.push("muted");else if(ch===","){cols.push("muted");fi++;}else cols.push(FC[fi%FC.length]);}
    F.forEach(function(f){starts.push([pos,pos+f.length]);pos+=f.length+1;});
    _w12_wrap(s,maxc).forEach(function(rw){var i0=rw[0],i1=rw[1],segs=[],xr=-1e9;
      for(var j=i0;j<i1;j++){if(same&&s[j]!==bs[j])o.push(S.RECT(x0+(j-i0)*cw-0.5,y-sz*0.95,cw+1,sz*1.3,1,U.soft("alias"),"alias",0.8));
        if(segs.length&&segs[segs.length-1][1]===cols[j])segs[segs.length-1][0]+=s[j];else segs.push([s[j],cols[j]]);}
      o.push(_w12_mono(U,x0,y,segs,sz,cw,true));
      starts.forEach(function(se,k){var cc=(se[0]+se[1])/2;if(cc<i0||cc>=i1)return;var xc=x0+(cc-i0)*cw,lw=U.tw(String(k),9);if(xc-lw/2<xr+2)return;o.push(S.T(xc,y+sz+3,String(k),"middle",9,"muted"));xr=xc+lw/2;});
      y+=sz*2.4;});
    /* チェックサム */
    y+=4;
    if(!ok){o.push(S.T(x0,y,"$ で始まり、* とチェックサムが付いた形になっていない","start",nar?10:11,"alias",true));box.set(S.svg(Wd,y+12,o));ro.innerHTML='<span class="warn">形が違う（4 節の状態機械では NMEA_ERR_FORM として捨てる）</span>';tb.innerHTML="";return;}
    var match=got!==null&&got===calc;
    o.push(S.T(x0,y,"中身（$ と * の間 "+body.length+" 文字）の排他的論理和","start",ts,"ink",true));y+=nar?17:20;
    o.push(_w12_mix(U,x0+(nar?0:10),y,[["= 0x"+_w12_hex2(calc)+" ("+_w12_b8(calc)+")","purple",true,true],["　付いてきた値 ","ink",false,false],[got===null?"（16 進 2 桁でない）":ck,"ink",got!==null,true]],nar?10:11));y+=nar?18:22;
    o.push(S.T(x0+(nar?0:10),y,match?"合う → 文を受け取る（NMEA_OK）":"合わない → 文を捨てる（NMEA_ERR_SUM）","start",nar?10:11.5,match?"green":"alias",true));
    if(got!==null&&ck!==ck.toUpperCase()){y+=nar?16:18;o.push(S.T(x0+(nar?0:10),y,"（小文字の 16 進。受ける側は大文字と同じに扱う）","start",nar?9:10,"muted"));}
    /* 選んだ文との違い */
    y+=nar?22:26;var diffs=[];
    if(same){for(var k=1;k<b;k++)if(s[k]!==bs[k])diffs.push(k);}
    var ex=0,ms=nar?9.5:10.5;
    if(diffs.length){o.push(S.T(x0,y,"選んだ文と比べて化けた文字と、化けた分 e（反転したビット）","start",ts,"ink",true));y+=nar?16:18;
      diffs.slice(0,6).forEach(function(k){var e=(s.charCodeAt(k)^bs.charCodeAt(k))&255;ex^=e;
        o.push(_w12_mix(U,x0+(nar?0:10),y,[[k+" 文字目 ","ink",false],["'"+bs[k]+"'→'"+s[k]+"'  e = ","ink",true],[_w12_b8(e),"alias",true]],ms));y+=nar?15:17;});
      if(diffs.length>6){o.push(S.T(x0+10,y,"…（ほか "+(diffs.length-6)+" 文字）","start",9.5,"muted"));y+=14;for(var k2=6;k2<diffs.length;k2++)ex^=(s.charCodeAt(diffs[k2])^bs.charCodeAt(diffs[k2]))&255;}
      o.push(_w12_mix(U,x0+(nar?0:10),y,[["e を全部 ⊕ = ","ink",false,true],[_w12_b8(ex),ex?"green":"alias",true,true]],ms));
      y+=nar?16:0;
      o.push(S.T(x0+(nar?0:250),y,ex?"0 でない → チェックサムが変わり、気づく":"0 → チェックサムが変わらず、見逃す","start",nar?9.5:10.5,ex?"green":"alias",true));y+=nar?16:20;}
    box.set(S.svg(Wd,y+8,o));
    var hh=match?'<span class="ok">チェックサムが合う</span>':'<span class="warn">チェックサムが合わない</span>';
    if(diffs.length)hh+="（選んだ文から "+diffs.length+" 文字が変わっている"+(match?"のに合う: 化けた分の排他的論理和が 0 の誤りは見逃す":"")+"）";
    hh+="。欄の数 "+F.length+"、文の種類 "+(type||"？")+"、長さ $ から LF まで "+(s.length+2)+" 文字"+(s.length+2>82?' <span class="warn">（82 文字を超える）</span>':"");
    ro.innerHTML=hh;
    if(nar){var rowsN=F.map(function(f,k){return ["["+k+"] "+'<code>'+(f===""?"":U.esc(f))+'</code>',(type?_w12_mean(type,k,F.length):"")+"<br>"+_w12_val(type,k,f,F)];});
      tb.innerHTML=U.tbl(["欄","意味と、読み取った値"],rowsN,["left","wrap"]);}
    else{var rowsT=F.map(function(f,k){return ["["+k+"]",'<code>'+(f===""?"":U.esc(f))+'</code>',type?_w12_mean(type,k,F.length):"",_w12_val(type,k,f,F)];});
      tb.innerHTML=U.tbl(["番号","欄","意味","読み取った値"],rowsT,["right","left","wrap","wrap"]);}}
  draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 4 節の後: 状態機械に 1 文字ずつ入れる ---- */
var _W12_VTGS=_w12_sent(_W12_VTG)+"\r\n";
var _W12_CASES=[
  ["正しい文（VTG）",_W12_VTGS],
  ["1 文字が化けた（0.012 → 0.013）",_W12_VTGS.replace("0.012","0.013")],
  ["文の途中から受け始めた",_W12_VTGS.slice(-13)+_W12_VTGS],
  ["文の途中で次の $ が来た（切れた文）",_W12_VTGS.slice(0,17)+_W12_VTGS],
  ["* が + に化けた",_W12_VTGS.replace("*","+")],
  ["取りこぼしで 2 つの文がつながった",_w12_sent(_W12_GGA).slice(0,-4)+_w12_sent(_W12_RMC).slice(1,30)],
  ["小文字のチェックサム（GSV 1/2）",_w12_sent(_W12_GSV1).replace(/\*7A$/,"*7a")+"\r\n"],
  ["続けて 2 つの文（GGA と RMC）",_w12_sent(_W12_GGA)+"\r\n"+_w12_sent(_W12_RMC)+"\r\n"]];
var _W12_RN={OK:"NMEA_OK",ERR_SUM:"NMEA_ERR_SUM",ERR_CUT:"NMEA_ERR_CUT",ERR_FORM:"NMEA_ERR_FORM",ERR_LONG:"NMEA_ERR_LONG"};
REG.w12_fsm=function(el,U){
  var S=U.S;
  U.head(el,"NMEA FSM","1 文字ずつ読む状態機械 — 文を切り出し、誤りに気づく");
  var r1=U.ctrls(el);
  var cs=U.select(r1,"入れる文字の列",_W12_CASES.map(function(c){return c[0];}),0,function(){reset();draw();});
  var sp=U.slider(r1,"速さ",{values:[2,4,8,15,30,60],value:8,fmt:function(v){return v+" 文字/秒";},onInput:function(){if(tick.running()){tick.stop();mkTick();tick.start();}}});
  var br=U.btnrow(el),tick=null;
  function mkTick(){tick=U.ticker(function(){if(!step())tick.stop();draw();},Math.round(1000/sp.get()));}
  mkTick();
  U.button(br,"本文の例（正しい文）",function(){tick.stop();cs.set(0);reset();draw();});
  U.button(br,"1 文字進める",function(){tick.stop();step();draw();});
  U.button(br,"再生",function(){if(pos>=inp().length)reset();tick.start();});
  U.button(br,"止める",function(){tick.stop();});
  U.button(br,"最初から",function(){tick.stop();reset();draw();});
  U.button(br,"最後まで",function(){tick.stop();while(step()){}draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  var m,pos,hist,log,edge;
  function inp(){return _W12_CASES[cs.get()][1];}
  function reset(){m={st:0,len:0,sum:0,got:0,buf:"",prev:0};pos=0;hist=[];log=[];edge=null;}
  function step(){var s=inp();if(pos>=s.length)return false;var ch=s[pos],p=m.st,r=_w12_feed(m,ch);
    if(ch==="$")edge=p===0?"w-b":"cut";else if(r==="OK"||r==="ERR_SUM")edge="done";else if(r)edge="err";
    else edge=p===0?"w-w":(p===1&&m.st===1?"b-b":(p===1?"b-c1":(p===2?"c1-c2":(p===3?"c2-e":"e-e"))));
    hist.push({st:m.st,r:r});if(r)log.push([pos,r]);pos++;return true;}
  reset();
  function draw(){var nar=_w12_nar(box),Wd=nar?400:700,o=[],s=inp();
    /* 状態の図 */
    var bw=nar?66:96,gap=nar?10:38,x0=nar?8:20,y=nar?96:104,h=nar?36:42,X=[];for(var k=0;k<5;k++)X.push(x0+k*(bw+gap));
    var eg=function(id){return edge===id;};
    var ec=function(id,c){return eg(id)?"alias":c;};
    for(var k2=0;k2<5;k2++){var on=m.st===k2,c=_W12_STC[k2];
      o.push(S.RECT(X[k2],y-h/2,bw,h,h/2.6,on?U.soft(c):"var(--panel)",c,on?3:1.3));
      o.push(S.T(X[k2]+bw/2,y-(nar?0:2),_W12_STN[k2],"middle",nar?10:11.5,c,true));
      if(!nar)o.push(S.T(X[k2]+bw/2,y+12,_W12_STE[k2],"middle",8.5,"muted",false,true));}
    var lab=["$","*","16 進","16 進"],ids=["w-b","b-c1","c1-c2","c2-e"];
    for(var k3=0;k3<4;k3++){var c3=eg(ids[k3])?"alias":"ink";o.push(S.ARR(X[k3]+bw,y,X[k3+1],y,c3,eg(ids[k3])?2.6:1.4,6));
      if(!nar||k3<2)o.push(S.T((X[k3]+bw+X[k3+1])/2,y-6,lab[k3],"middle",nar?9:10,c3,true,false,null,true));}
    /* $ はどの状態からでも中身へ */
    var ytop=y-h/2,yc_=ytop-(nar?44:50),cC=eg("cut")?"alias":"var(--signal-soft)",wC=eg("cut")?2.4:1.2;
    [X[2]+bw/2,X[3]+bw/2,X[4]+18].forEach(function(xd){o.push(S.L(xd,ytop,xd,yc_,cC,wC,"5 3"));});
    o.push(S.L(X[4]+18,yc_,X[1]+bw-14,yc_,cC,wC,"5 3"));o.push(S.ARR(X[1]+bw-14,yc_,X[1]+bw-14,ytop-1,cC,wC,6,"5 3"));
    o.push(S.T((X[2]+X[4])/2+bw/2,yc_-6,nar?"$: どこからでも中身へ（ERR_CUT）":"$（どの状態でも）: 途中の文を捨てて中身へ（NMEA_ERR_CUT）","middle",nar?8.5:9.5,eg("cut")?"alias":"signal",true,false,null,true));
    /* 自分への遷移 */
    [[0,"w-w","$ 以外"],[1,"b-b","ためて XOR"],[4,"e-e","CR"]].forEach(function(q){var xc=X[q[0]]+bw/2-(q[0]===1?14:0)+(q[0]===4?14:0),yt=y-h/2,c4=eg(q[1])?"alias":_W12_STC[q[0]];
      o.push(S.PATH("M"+(xc-9)+","+yt+" C"+(xc-20)+","+(yt-30)+" "+(xc+20)+","+(yt-30)+" "+(xc+9)+","+yt,c4,eg(q[1])?2.4:1.3));
      o.push(S.T(xc,yt-26,q[2],"middle",nar?8.5:9.5,c4,eg(q[1]),false,null,true));});
    /* 誤りと、文がそろったとき */
    var yb=y+h/2+(nar?16:20);
    var cE=eg("err")?"alias":"var(--alias-soft)";
    [1,2,3,4].forEach(function(k){o.push(S.L(X[k]+bw/2-(k===4?14:0),y+h/2,X[k]+bw/2-(k===4?14:0),yb,cE,eg("err")?2.4:1.2));});
    o.push(S.L(X[4]+bw/2-14,yb,X[0]+bw/2+12,yb,cE,eg("err")?2.4:1.2));o.push(S.ARR(X[0]+bw/2+12,yb,X[0]+bw/2+12,y+h/2+2,cE,eg("err")?2.4:1.2,6));
    o.push(S.T((X[1]+X[3])/2+bw/2,yb+(nar?11:13),"誤り: 次の $ まで読み捨てる（NMEA_ERR_FORM・NMEA_ERR_LONG）","middle",nar?8:9.5,eg("err")?"alias":"muted",true));
    var yo=yb+(nar?22:28),cD=eg("done")?(hist.length&&hist[hist.length-1].r==="OK"?"green":"alias"):"var(--green-soft)";
    o.push(S.L(X[4]+bw/2+14,y+h/2,X[4]+bw/2+14,yo,cD,eg("done")?2.6:1.2));o.push(S.L(X[4]+bw/2+14,yo,X[0]+bw/2-12,yo,cD,eg("done")?2.6:1.2));o.push(S.ARR(X[0]+bw/2-12,yo,X[0]+bw/2-12,y+h/2+2,cD,eg("done")?2.6:1.2,6));
    o.push(S.T((X[1]+X[3])/2+bw/2,yo+(nar?11:13),"LF: XOR と比べる（合えば NMEA_OK、違えば NMEA_ERR_SUM）","middle",nar?8.5:9.5,eg("done")?cD:"muted",true));
    /* 入れた文字の列 */
    var cw=nar?9:8.6,sz=nar?12:12,per=Math.floor((Wd-16)/cw),ys=yo+(nar?36:44),xs0=8;
    o.push(S.T(xs0,ys-14,"入れた文字の列（下の帯は、その文字を入れた後の状態。▲ は結果）","start",nar?9.5:10.5,"ink",true));
    var nrow=Math.ceil(s.length/per);
    for(var r=0;r<nrow;r++){var yr=ys+r*(nar?40:44)+10;
      for(var i=r*per;i<Math.min(s.length,(r+1)*per);i++){var xx=xs0+(i-r*per)*cw,ch=s[i],done=i<pos;
        if(i===pos)o.push(S.RECT(xx-0.5,yr-sz,cw+1,sz+16,2,"none","alias",1.6));
        if(ch==="\r"||ch==="\n")o.push(S.RECT(xx+0.5,yr-sz+2,cw-1,sz,1,"var(--muted-soft)","muted",0.6));
        else o.push(_w12_mono(U,xx+cw*0.2,yr,[[ch,done?"ink":"faint"]],sz,cw,done));
        if(done){var hs=hist[i];o.push(S.RECT(xx+0.3,yr+3,cw-0.6,7,0,U.soft(_W12_STC[hs.st]),_W12_STC[hs.st],0.6));
          if(hs.r){var cc=hs.r==="OK"?"green":"alias";o.push(S.PL([[xx+cw/2,yr+12],[xx+cw/2-4,yr+19],[xx+cw/2+4,yr+19]],cc,1,cc));}}}}
    var hgt=ys+nrow*(nar?40:44)+8;
    /* 変数 */
    var vy=hgt+6,bufs=m.buf.length>(nar?60:100)?"…"+m.buf.slice(-(nar?59:99)):m.buf;
    o.push(_w12_mix(U,8,vy,[["状態 ","muted",false],[_W12_STE[m.st],_W12_STC[m.st],true,true],["（"+_W12_STN[m.st]+"）",_W12_STC[m.st],false,true],["　len ","muted",true],[String(m.len),"ink",true,true],["  sum ","muted",true],["0x"+_w12_hex2(m.sum)+" ("+_w12_b8(m.sum)+")","purple",true,true]],nar?9.5:10.5));
    o.push(_w12_mix(U,8,vy+(nar?16:19),[["buf ","muted",true],[bufs||"","ink",true],[bufs?"":"（空）","muted",false]],nar?9.5:10.5));
    box.set(S.svg(Wd,vy+(nar?26:30),o));
    var h="入れた文字 "+pos+" / "+s.length+"。";
    if(log.length)h+="結果: "+log.map(function(q){return (q[0]+1)+" 文字目 "+(q[1]==="OK"?'<span class="ok">':'<span class="warn">')+_W12_RN[q[1]]+"</span>";}).join("、");
    else h+="まだ結果は無い（NMEA_NONE）。";
    if(m.st>=2&&m.st<=4)h+="<br>* までの中身 "+m.len+" 文字の XOR は 0x"+_w12_hex2(m.sum)+(m.st>=3?"、届いた上の桁 "+(m.got>>4).toString(16).toUpperCase():"")+(m.st===4?"・下の桁 "+(m.got&15).toString(16).toUpperCase()+"（0x"+_w12_hex2(m.got)+"）":"");
    ro.innerHTML=h;}
  draw();
  window.addEventListener("resize",function(){draw();});
};
