/* ===== 15 章 組み込みでの実装 — 受信・解析・状態の管理 ===== */
/* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
function _w15_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
function _w15_f(v,d){v=+v;if(!isFinite(v))return v>0?"∞":"−∞";if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
function _w15_g(v){var s=String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g," ");return (v<0?"−":"")+s;}
var _W15_SC=["alias","muted","gold","signal","purple","teal","green"];   /* 測位の状態の色（図と同じ） */
var _W15_SN=["文なし","測位なし","2D","3D","補正つき","RTK フロート","RTK フィックス"];
var _W15_WC=["green","muted","gold","gold","alias"];
var _W15_WN=["使う","状態が足りない","衛星の数","HDOP","飛び"];
var _W15_WS=["●","状","衛","H","飛"];

/* ---- 12 章の解析と、この章の組・状態機械・判断（本文の C と、図の Python と同じ手順） ---- */
function _w15_ck(b){var x=0;for(var i=0;i<b.length;i++)x^=b.charCodeAt(i);return x;}
function _w15_hex2(v){return (v<16?"0":"")+v.toString(16).toUpperCase();}
function _w15_sent(b){return "$"+b+"*"+_w15_hex2(_w15_ck(b));}
function _w15_feed(st,c){   /* st = [状態, 中身, 和, 届いた値]。12 章の nmea_feed */
  if(c==="$"){var res=st[0]===0?"NONE":"ERR_CUT";st[0]=1;st[1]="";st[2]=0;return res;}
  var o=c.charCodeAt(0),hv=/^[0-9a-fA-F]$/.test(c)?parseInt(c,16):-1;
  if(st[0]===0)return "NONE";
  if(st[0]===1){if(c==="*"){st[0]=2;return "NONE";}
    if(o>=0x20&&o<=0x7E){if(st[1].length>=76){st[0]=0;return "ERR_LONG";}st[1]+=c;st[2]^=o;return "NONE";}}
  else if(st[0]===2){if(hv>=0){st[3]=hv<<4;st[0]=3;return "NONE";}}
  else if(st[0]===3){if(hv>=0){st[3]|=hv;st[0]=4;return "NONE";}}
  else if(st[0]===4){if(c==="\r")return "NONE";if(c==="\n"){st[0]=0;return st[3]===st[2]?"OK":"ERR_SUM";}}
  st[0]=0;return "ERR_FORM";}
function _w15_tms(s){if(s.length<6||!/^\d{6}/.test(s))return -1;var h=+s.slice(0,2),mi=+s.slice(2,4),se=+s.slice(4,6),r=s.slice(6),ms=0,w=100;
  if(r.charAt(0)==="."){for(var i=1;i<r.length;i++){var ch=r.charAt(i);if(!/\d/.test(ch))return -1;ms+=(+ch)*w;w=Math.floor(w/10);}}else if(r)return -1;
  if(h>23||mi>59||se>60)return -1;return ((h*60+mi)*60+se)*1000+ms;}
function _w15_dm(s,hemi,maxdeg){var i=0,ip=0,nd=0;while(i<s.length&&/\d/.test(s.charAt(i))){nd++;if(nd>5)return null;ip=ip*10+(+s.charAt(i));i++;}
  if(nd<3)return null;var deg=Math.floor(ip/100);if(deg>maxdeg||ip%100>=60)return null;if(s.charAt(i)===".")i++;
  var m6=0;for(var k=0;k<6;k++){m6*=10;if(i<s.length&&/\d/.test(s.charAt(i))){m6+=+s.charAt(i);i++;}}
  while(i<s.length&&/\d/.test(s.charAt(i)))i++;if(i!==s.length)return null;
  m6+=(ip%100)*1000000;var v=deg*10000000+Math.floor((m6+3)/6);if(v>maxdeg*10000000)return null;
  if(hemi==="S"||hemi==="W")v=-v;else if(hemi!=="N"&&hemi!=="E")return null;return v;}
function _w15_fix(s,dec){if(s===""||s==="-"||s==="."||s==="-.")return null;var neg=s.charAt(0)==="-",t=neg?s.slice(1):s;
  if((t.match(/\./g)||[]).length>1||!/^\d*\.?\d*$/.test(t)||!/\d/.test(t))return null;var p=t.split("."),a=p[0]||"0",b=((p[1]||"")+"0000000000").slice(0,dec);
  var v=parseInt(a+b,10);return neg?-v:v;}
function _w15_gga(b){var f=b.split(",");if(f.length<15||f[0].length!==5||f[0].slice(2)!=="GGA")return null;
  var lat=_w15_dm(f[2],f[3].charAt(0),90),lon=_w15_dm(f[4],f[5].charAt(0),180),q=_w15_fix(f[6],0),ns=_w15_fix(f[7],0),hd=_w15_fix(f[8],2);
  return {t:_w15_tms(f[1]),q:q||0,ns:ns||0,pos:lat!==null&&lon!==null,lat:lat,lon:lon,hdop:hd===null?-1:hd};}
function _w15_rmc(b){var f=b.split(",");if(f.length<10||f[0].length!==5||f[0].slice(2)!=="RMC")return null;
  var d=f[9].length===6?_w15_fix(f[9],0):null;return {t:_w15_tms(f[1]),st:f[2].charAt(0),date:d===null?-1:d};}
function _w15_kind(g,st){if(st!=="A"||!g.pos)return 1;return ({1:g.ns>=4?3:2,2:4,5:5,4:6})[g.q]||1;}

/* 状態機械と判断（3 節）。o は時刻 now [ms] を持つ */
function _w15_sm(){return {st:0,cand:0,ncand:0,t_fix:0,t_ok:0,ref:{ok:0,nj:0,lat:0,lon:0,t:0}};}
function _w15_fixEpoch(s,k,now){if(k>=2)s.t_fix=now;
  if(k<s.st){s.st=k;s.ncand=0;}else if(k>s.st){s.cand=(s.ncand===0||k<s.cand)?k:s.cand;s.ncand++;if(s.ncand>=3){s.st=s.cand;s.ncand=0;}}else s.ncand=0;}
function _w15_fixTick(s,now){if(now-s.t_ok>3000){s.st=0;s.ncand=0;}else if(s.st>=2&&now-s.t_fix>2500){s.st=1;s.ncand=0;}}
function _w15_judge(s,g,now){if(s.st<3)return 1;if(g.ns<5)return 2;if(g.hdop<0||g.hdop>200)return 3;var r=s.ref;
  if(r.ok){var dn=(g.lat-r.lat)*0.0111195,de=(g.lon-r.lon)*0.0111195*Math.cos(g.lat*1.745329e-9),lim=50*(now-r.t)/1000+30;
    if(dn*dn+de*de>lim*lim){r.nj++;if(r.nj<3)return 4;}}
  r.ok=1;r.nj=0;r.lat=g.lat;r.lon=g.lon;r.t=now;return 0;}

/* ---- 記録の列（図の _f15_record と同じ）: 12 章の例の文、東へ 10 m/s、9600 bit/s・1 Hz ---- */
var _W15_T0=1000,_W15_TC=120,_W15_N=60;
var _W15_GSA="GPGSA,A,3,02,03,05,06,09,13,16,22,,,,,1.61,0.95,1.30";
var _W15_GSV1="GPGSV,2,1,08,02,41,316,47,03,26,125,45,05,09,269,41,06,52,045,48";
var _W15_GSV2="GPGSV,2,2,08,09,75,187,50,13,21,068,44,16,04,171,40,22,46,235,48";
var _W15_FAULTS=[["bad",5,"GGA の 1 文字が化けた"],["normc",8,"RMC が抜けた"],["cut",11,"GSV の途中の 10 バイトが抜けた"],
  ["gap",14,"1 秒分の文が全部抜けた"],["swap",17,"GGA の緯度の 2 文字が入れ替わった"],["city",20,"ビル街（HDOP 2.6・衛星 4）"],
  ["nopps",25,"パルスが 1 つ抜けた"],["tunnel",26,"トンネル（品質 0）"],["stop",40,"文が 5 秒止まった"],["dgnss",50,"補正つき（品質 2）"]];
function _w15_hms(k){var s=34070+k;function p(v){return (v<10?"0":"")+v;}return p(Math.floor(s/3600))+p(Math.floor(s/60)%60)+p(s%60);}
function _w15_pad(v,w,d){var s=v.toFixed(d);while(s.length<w)s="0"+s;return s;}
function _w15_epochSents(k,on){var t=_w15_hms(k);
  var lon="139"+_w15_pad(46.02+10.0/(111194.9/60.0*Math.cos(35.681*Math.PI/180))*k,8,5);
  if(on.tunnel&&k>=26&&k<=30)return [["GGA","GPGGA,"+t+".00,,,,,0,00,99.99,,,,,,"],["RMC","GPRMC,"+t+".00,V,,,,,,,111126,,,N"],
    ["GSA","GPGSA,A,1,,,,,,,,,,,,,99.99,99.99,99.99"],["GSV","GPGSV,1,1,00"],["VTG","GPVTG,,T,,M,,N,,K,N"],["GLL","GPGLL,,,,,"+t+".00,V,N"]];
  var q="1",ns="08",hd="0.95",gsa=_W15_GSA,md="A",dg=",";
  if(on.city&&(k===20||k===21)){ns="06";hd="2.60";gsa="GPGSA,A,3,02,03,06,09,16,22,,,,,,,3.10,2.60,1.70";}
  if(on.city&&(k===22||k===23)){ns="04";hd="3.50";gsa="GPGSA,A,3,02,06,09,22,,,,,,,,,4.90,3.50,3.40";}
  if(on.dgnss&&k>=50&&k<=53){q="2";md="D";dg="1.0,0000";}
  var lat=(on.swap&&k===17)?"3504.86000":"3540.86000";
  return [["GGA","GPGGA,"+t+".00,"+lat+",N,"+lon+",E,"+q+","+ns+","+hd+",3.3,M,36.7,M,"+dg],
    ["RMC","GPRMC,"+t+".00,A,3540.86000,N,"+lon+",E,19.438,90.0,111126,,,"+md],["GSA",gsa],["GSV",_W15_GSV1],["GSV",_W15_GSV2],
    ["VTG","GPVTG,90.0,T,,M,19.438,N,36.000,K,"+md],["GLL","GPGLL,3540.86000,N,"+lon+",E,"+t+".00,A,"+md]];}
function _w15_record(on){var out=[];
  for(var k=0;k<_W15_N;k++){var t0=_W15_T0+1000*k,nopps=(on.nopps&&k===25)||(on.tunnel&&k>=26&&k<=30);
    if(!nopps)out.push([t0,"PPS",k,""]);
    if((on.gap&&k===14)||(on.stop&&k>=40&&k<=44))continue;
    var cum=0,ss=_w15_epochSents(k,on);
    for(var j=0;j<ss.length;j++){var s=_w15_sent(ss[j][1]),mark="";cum+=s.length+2;var tt=t0+_W15_TC+Math.round(cum*10.0/9600*1000);
      if(on.bad&&k===5&&ss[j][0]==="GGA"){s=s.replace("3540.86000","3540.85000");mark="bad";}
      if(on.normc&&k===8&&ss[j][0]==="RMC")continue;
      if(on.cut&&k===11&&s.indexOf("$GPGSV,2,1")===0){s=s.slice(0,20)+s.slice(30);mark="cut";}
      if(on.swap&&k===17&&ss[j][0]==="GGA")mark="swap";
      out.push([tt,s,k,mark]);}}
  return out;}

/* 記録を流す（6 節の replay と同じ: 1 ms ずつ進め、10 ms ごとに主のループ） */
function _w15_run(rec,tail){var S={ring:[],rx:[0,"",0,0],n_bad:0,n_part:0,n_gap:0,ep:{t:-1,have:0,g:null,r:null},sm:_w15_sm(),
    pps_cap:0,pps_n:0,ep_n:0,n_nolabel:0,late:0,labels:[],out:[],hist:[],lines:[],now:0};
  function epochDone(){var e=S.ep;_w15_fixEpoch(S.sm,_w15_kind(e.g,e.r.st),S.now);var w=_w15_judge(S.sm,e.g,S.now);
    S.out.push({t:e.t,st:S.sm.st,why:w,rx:S.now,g:e.g,r:e.r,kind:_w15_kind(e.g,e.r.st)});
    if(e.t%1000===0&&S.sm.st>=2&&e.r.date>=0){var n=S.pps_n,cap=S.pps_cap,k=n-S.ep_n;S.ep_n=n;
      if(k===1&&S.now*10000-cap>=5000000)S.late=1;if(k!==1||S.late)S.n_nolabel++;else S.labels.push([cap,e.t]);}}
  function epochFeed(b){var ty=(b.length>5&&b.charAt(5)===",")?b.slice(2,5):"",t,bit,g,r;
    if(ty==="GGA"){g=_w15_gga(b);if(!g)return;t=g.t;bit=1;}else if(ty==="RMC"){r=_w15_rmc(b);if(!r)return;t=r.t;bit=2;}else return;
    if(t<0)return;var e=S.ep;
    if(t!==e.t){if(e.t>=0){var d=t-e.t;if(e.have!==3)S.n_part++;if(d!==1000&&d!==1000-86400000)S.n_gap++;}e.t=t;e.have=0;}
    if(e.have&bit)return;if(bit===1)e.g=g;else e.r=r;e.have|=bit;if(e.have===3)epochDone();}
  function poll(){while(S.ring.length){var c=S.ring.shift(),res=_w15_feed(S.rx,c);
      if(res==="OK"){S.sm.t_ok=S.now;if(S.sm.st===0)S.sm.st=1;S.lines.push([S.now,"OK"]);epochFeed(S.rx[1]);}
      else if(res!=="NONE"){S.n_bad++;S.lines.push([S.now,res]);}}
    _w15_fixTick(S.sm,S.now);}
  var all=rec.concat([[null,null]]);
  for(var i=0;i<all.length;i++){var t=all[i][0],s=all[i][1],stop=t!==null?t:S.now+(tail||6000);
    while(S.now<stop){S.now++;if(S.now%10===0){poll();if(S.now%100===0)S.hist.push([S.now,S.sm.st]);}}
    if(t===null)break;
    if(s==="PPS"){S.pps_cap=S.now*10000;S.pps_n++;}
    else{var str=s+"\r\n";for(var j=0;j<str.length;j++)S.ring.push(str.charAt(j));}}
  return S;}

/* ---- 2 節: リングバッファの埋まり方（図の _f15_fillsim と同じ計算。大きさの上限で捨てる） ---- */
var _W15_SETS=[{nm:"10 章の例（GPS と GLONASS・11 文・626 B）",nb:626},{nm:"12 章の例（GPS だけ・7 文・426 B）",nb:426},{nm:"GGA と RMC だけ（141 B）",nb:141}];
function _w15_ntp(tp,nb,tu,rb){var tpb=Math.round(tp*rb),tub=Math.round(tu*rb),k=Math.floor(tpb/tub);return k*nb+Math.min(nb,Math.ceil((tpb-k*tub)/10));}
function _w15_fill(rb,rate,tp,secs,nb,cap){
  var tu=Math.round(rb/rate),tc=Math.round(rb*12/100),tpb=Math.max(1,Math.round(tp*rb)),end=Math.round(secs*rb);
  var ev=[[0,0,0,0]],q=0,head=0,tail=0,m=0,bi=0,start=tc,busy=0,nxt=tc+10,nread=tc+9,mx=0,drop=0,first=null,bursts=[],reads=[],drops=[];
  bursts.push([tc/rb,null]);
  while(true){var t=Math.min(nxt,nread);if(t>end)break;
    if(t===nxt){if(q>=cap){drop++;if(first===null)first=t/rb;if(drops.length<400)drops.push(t/rb);}else{q++;head++;}if(q>mx)mx=q;ev.push([t/rb,q,head,tail]);
      bi++;if(bi===nb){busy=nxt;bi=0;m++;bursts[bursts.length-1][1]=nxt/rb;start=Math.max(m*tu+tc,busy);nxt=start+10;bursts.push([start/rb,null]);}else nxt+=10;}
    if(t===nread){ev.push([t/rb,q,head,tail]);tail+=q;q=0;ev.push([t/rb,0,head,tail]);reads.push(t/rb);nread+=tpb;}}
  if(bursts[bursts.length-1][1]===null)bursts[bursts.length-1][1]=Math.min(secs,bursts[bursts.length-1][0]+nb*10/rb);
  ev.push([secs,q,head,tail]);
  return {ev:ev,max:mx,drop:drop,first:first,bursts:bursts.filter(function(b){return b[0]<secs;}),reads:reads,drops:drops};}
function _w15_at(ev,t){var lo=0,hi=ev.length-1;while(lo<hi){var mid=(lo+hi+1)>>1;if(ev[mid][0]<=t)lo=mid;else hi=mid-1;}return ev[lo];}

REG.w15_ring=function(el,U){
  var S=U.S;
  U.head(el,"RING BUFFER","リングバッファの埋まり方 — 処理の遅れの間に届くバイトと、あふれる時刻");
  var r1=U.ctrls(el);
  var set=U.select(r1,"1 回に出す文",_W15_SETS.map(function(s){return s.nm;}),0,function(){stop();run();});
  var bd=U.slider(r1,"通信の速さ",{values:[4800,9600,19200,38400,57600,115200],value:9600,fmt:function(v){return _w15_g(v)+" bit/s";},onInput:function(){stop();run();}});
  var rt=U.slider(r1,"更新レート",{values:[1,2,5,10],value:1,fmt:function(v){return v+" Hz";},onInput:function(){stop();run();}});
  var r2=U.ctrls(el);
  var tp=U.slider(r2,"処理の遅れ t<sub>p</sub>（読む間隔）",{min:0.01,max:2,log:true,value:0.3,snap:function(v){return v<0.1?+v.toFixed(3):+v.toFixed(2);},fmt:function(v){return _w15_f(v,v<0.1?3:2)+" s";},onInput:function(){stop();run();}});
  var cs=U.slider(r2,"リングバッファの大きさ",{values:[64,128,256,512,1024,2048,4096,8192],value:512,fmt:function(v){return _w15_g(v)+" B";},onInput:function(){stop();run();}});
  var br=U.btnrow(el),cur=null,R=null,win=2.2;
  var tk=U.ticker(function(){cur+=win/120;if(cur>=win){cur=null;tk.stop();}draw();},50);
  function setAll(s,b,r,t,c){set.set(s);bd.set(b);rt.set(r);tp.set(t);cs.set(c);stop();run();}
  U.button(br,"本文の例（9600 bit/s・1 Hz・0.3 s・512 B）",function(){setAll(0,9600,1,0.3,512);});
  U.button(br,"256 B では足りない",function(){setAll(0,9600,1,0.3,256);});
  U.button(br,"更新レートを上げた例（115 200・5 Hz・1024 B）",function(){setAll(0,115200,5,0.3,1024);});
  U.button(br,"再生",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){stop();draw();});
  var box=U.svgbox(el),ro=U.readout(el);
  function stop(){tk.stop();cur=null;}
  function run(){var rb=bd.get(),rate=rt.get(),t=tp.get(),nb=_W15_SETS[set.get()].nb;
    win=rate<=2?2.2:1.45;win=Math.min(6,Math.max(win,3*t+0.15));
    R=_w15_fill(rb,rate,t,win,nb,cs.get());R.inf=_w15_fill(rb,rate,t,win,nb,1e9);draw();}
  function draw(){
    var nar=_w15_nar(box),Wd=nar?400:700,o=[],rb=bd.get(),rate=rt.get(),t=tp.get(),cap=cs.get(),nb=_W15_SETS[set.get()].nb;
    var now=cur==null?win:cur,a=_w15_at(R.ev,now),used=a[1],head=a[2],tail=a[3];
    /* (a) 輪 */
    var cx=nar?200:124,cy=nar?100:128,Ro=nar?66:80,Ri=nar?44:56,nseg=48;
    o.push(S.T(nar?8:14,16,"(a) リングバッファ（"+nseg+" 区画）","start",10.5,"ink",true));
    for(var i=0;i<nseg;i++){var a0=-Math.PI/2+2*Math.PI*i/nseg,a1=-Math.PI/2+2*Math.PI*(i+1)/nseg,lo=i*cap/nseg,hi=(i+1)*cap/nseg;
      var hp=head%cap,tp0=tail%cap,full=false;
      if(used>=cap)full=true;else if(used>0){var mid=(lo+hi)/2;full=tp0<=hp?(mid>=tp0&&mid<hp):(mid>=tp0||mid<hp);}
      var p=[[cx+Ro*Math.cos(a0),cy+Ro*Math.sin(a0)],[cx+Ro*Math.cos(a1),cy+Ro*Math.sin(a1)],[cx+Ri*Math.cos(a1),cy+Ri*Math.sin(a1)],[cx+Ri*Math.cos(a0),cy+Ri*Math.sin(a0)]];
      o.push(S.PL(p,"teal",0.6,full?U.soft("teal"):"var(--screen)"));}
    function mark(idx,lab,c,out){var an=-Math.PI/2+2*Math.PI*((idx%cap)/cap),r0=out?Ro+2:Ri-2,r1=out?Ro+16:Ri-12,rl=out?Ro+26:Ri-22;
      o.push(S.ARR(cx+r1*Math.cos(an),cy+r1*Math.sin(an),cx+r0*Math.cos(an),cy+r0*Math.sin(an),c,1.6,6));
      o.push(S.T(cx+rl*Math.cos(an),cy+rl*Math.sin(an)+4,lab,"middle",9,c,true,true,null,true));}
    mark(head,"head","gold",true);mark(tail,"tail","signal",false);
    /* 入っている数: 狭い幅では輪の左に置き、輪の中を tail の名前に空ける */
    var qx=nar?cx-Ro-58:cx,qy=nar?cy:cy-6;
    o.push(S.T(qx,qy+2,_w15_g(used)+" B","middle",13,used>=cap?"alias":"teal",true));
    o.push(S.T(qx,qy+16,"入っている","middle",9,"muted"));
    /* (b) 時間の変化 */
    var px=nar?56:292,py=nar?248:52,pw=nar?330:392,ph=nar?140:168;
    var ymax=Math.max(cap,R.inf.max)*1.12,P=U.plot(px,py,pw,ph,[0,win],[0,ymax]);
    o.push(S.T(nar?8:px-40,py-30,"(b) 入っているバイトの数の時間の変化","start",10.5,"ink",true));
    R.bursts.forEach(function(b){o.push(S.RECT(P.X(b[0]),py-20,Math.max(1,P.X(Math.min(b[1],win))-P.X(b[0])),9,1,U.soft("gold"),"gold",0.8));});
    R.reads.forEach(function(r){if(r<=win)o.push(S.PL([[P.X(r),py-4],[P.X(r)-3,py-10],[P.X(r)+3,py-10]],"signal",1,"signal"));});
    o.push(P.axes({xl:"時間 t [s]",yl:"量 [B]",sz:9,ny:4,xfmt:function(v){return U.sig(v,3);}}));
    var pts=[];R.ev.forEach(function(e){if(e[0]<=now)pts.push([e[0],e[1]]);});pts.push([now,used]);
    var pinf=[];R.inf.ev.forEach(function(e){if(e[0]<=now)pinf.push([e[0],e[1]]);});
    if(R.drop>0)o.push(P.clip(pinf,"alias",1,"3 3"));
    o.push(P.clip(pts,"teal",1.5));
    var cc=R.drop>0?"alias":"green";
    o.push(S.L(P.x,P.Y(cap),P.x+P.w,P.Y(cap),cc,1.3,"5 3"));
    o.push(S.T(P.x+P.w-2,P.Y(cap)-4,"大きさ "+_w15_g(cap)+" B","end",9,cc,true,false,null,true));
    if(R.first!==null&&R.first<=now){o.push(S.X(P.X(R.first),P.Y(cap),5,"alias",2));o.push(S.T(P.X(R.first)+6,P.Y(cap)+14,"あふれる "+_w15_f(R.first,3)+" s","start",9,"alias",true,false,null,true));}
    if(cur!=null)o.push(S.L(P.X(now),py-20,P.X(now),py+ph,"signal",1.2));
    if(nar){o.push(S.T(8,py+ph+44,"▼ 主のループが読む（最初は 1 回分の最初のバイトが入る直前）","start",8.5,"muted"));
      o.push(S.T(8,py+ph+58,"■ モジュールが文を送っている時間","start",8.5,"muted"));}
    else o.push(S.T(px-40,py+ph+44,"▼ 主のループが読む（最初は 1 回分の最初のバイトが入る直前）　■ モジュールが文を送っている時間","start",8.5,"muted"));
    box.set(S.svg(Wd,(nar?py+ph+66:py+ph+52),o));
    /* 読み出し */
    var tu=1/rate,ttx=nb*10/rb,load=ttx/tu,h="";
    h+="1 回分 <b>"+nb+" B</b> を <b>"+_w15_f(ttx,3)+" s</b> で受ける（更新の間隔 "+_w15_f(tu,2)+" s、負荷率 <b>"+_w15_f(load*100,0)+" %</b>）<br>";
    if(load<=1){var tpb=Math.round(t*rb),tub=Math.round(tu*rb),k=Math.floor(tpb/tub),tr=(tpb-k*tub)/rb,n=_w15_ntp(t,nb,tu,rb),p2=1;while(p2<n)p2*=2;
      h+="2 節の式: k = "+k+"、t<sub>r</sub> = "+_w15_f(tr,3)+" s → <b>n(t<sub>p</sub>) = "+_w15_g(n)+" B</b>、要る大きさ（2 のべき乗）<b>"+_w15_g(p2)+" B</b><br>";}
    else h+="<span class=\"warn\">負荷率が 100 % を超え、モジュールは送り切れない（13 章 3 節）。文は休みなく届くので、2 節の式は使えない</span><br>";
    h+="バイトごとの計算: 最大の埋まり <b>"+_w15_g(R.max)+" B</b>"+(R.drop>0?"、<span class=\"warn\">捨てたバイト "+_w15_g(R.drop)+" B（最初は "+_w15_f(R.first,3)+" s）</span>":"、<span class=\"ok\">捨てたバイト 0（足りる）</span>")+"（"+_w15_f(win,2)+" s の間）";
    ro.innerHTML=h+'<div class="wnote">主のループは、1 回分の最初のバイトがリングバッファに入る直前に読み、その後 t<sub>p</sub> ごとに読むとした（最も悪い位相）。1 バイトは 10 ビット（8N1）。文はパルスの 0.12 s 後から、前の回を送り終えるまで待って順に送る。満杯のときは新しいバイトを捨てる（赤い点線は、捨てずにためた場合）。</div>';
  }
  run();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 3 節: 状態機械（本文の fix_epoch・fix_tick・fix_judge と同じ規則）。モジュールの出し方は例のモデル ---- */
/* 本文の例（図 e15_judge と同じ筋書き）: 秒ごとの [品質, 衛星の数, HDOP, RMC の状態, 66.6 km の飛び] か null（文が来ない） */
function _w15_scn(k){if(k<=4)return [1,9,0.90,"A",false];if(k<=10)return [k===6?5:4,9,0.90,"A",false];if(k<=12)return [1,4,2.80,"A",false];
  if(k<=17)return [0,0,99.99,"V",false];if(k<=20)return [1,8,1.10,"A",false];if(k<=23)return null;return [1,8,1.00,"A",k===27];}
/* 例のモデル: 衛星の数・HDOP・補正の種類・補正の情報の古さ → モジュールが出す [品質, 衛星の数, HDOP, 状態] */
function _w15_module(ns,hd,corr,age){if(ns<=2)return [0,0,99.99,"V"];if(ns===3)return [1,3,hd,"A"];
  if(corr===1)return [age<=30?2:1,ns,hd,"A"];if(corr===2)return [(age<=5&&ns>=6)?4:(age<=30?5:1),ns,hd,"A"];return [1,ns,hd,"A"];}
REG.w15_state=function(el,U){
  var S=U.S;
  U.head(el,"FIX STATE MACHINE","測位の状態の状態機械 — 組の値を時間とともに変えると、どの状態にいて、位置を使うか");
  var r1=U.ctrls(el);
  var ns=U.slider(r1,"衛星の数",{min:0,max:14,step:1,value:9,fmt:function(v){return v+" 機";}});
  var hd=U.slider(r1,"HDOP",{min:0.5,max:6,step:0.1,value:0.9,fmt:function(v){return _w15_f(v,1);}});
  var r2=U.ctrls(el);
  var co=U.select(r2,"補正",["なし（単独）","DGNSS・SBAS（16 章）","RTK（17 章）"],0);
  var ag=U.slider(r2,"補正の情報の古さ",{min:0,max:60,step:1,value:1,fmt:function(v){return v+" s";}});
  var r3=U.ctrls(el);
  var fl=U.checkbox(r3,"文が届く",true);
  var gr=U.checkbox(r3,"補正が途切れる（古さが 1 秒ごとに増える）",false);
  var br=U.btnrow(el),seed=0,script=false,jump=false;
  var tk=U.ticker(function(){step();if(script&&k>=30){tk.stop();script=false;}draw();},280);
  U.button(br,"本文の例（走行。図と同じ）",function(){reset();script=true;tk.start();});
  U.button(br,"再生（つまみの値で）",function(){script=false;tk.start();});
  U.button(br,"止める",function(){tk.stop();script=false;draw();});
  U.button(br,"初めから",function(){tk.stop();script=false;reset();draw();});
  U.button(br,"66.6 km の飛びを 1 回入れる",function(){jump=true;});
  var box=U.svgbox(el),ro=U.readout(el);
  var sm,k,now,H,E;
  function reset(){sm=_w15_sm();k=0;now=0;H=[];E=[];}
  /* 1 秒分を 10 ms ずつ進める: GGA は 0.20 s、RMC で組がそろうのは 0.28 s、最後の文は 0.48 s に届く（12 章の例の文・9600 bit/s） */
  function step(){var x;
    if(script){x=_w15_scn(k);if(x){ns.set(x[1]);hd.set(Math.min(6,x[2]));co.set(x[0]===4||x[0]===5?"2":"0");fl.set(true);}else fl.set(false);}
    else{if(gr.get())ag.set(Math.min(60,ag.get()+1));
      x=fl.get()?_w15_module(ns.get(),Math.round(hd.get()*100)/100,+co.get(),ag.get()).concat([jump]):null;jump=false;}
    var lat0=356810000,lon=1397670000+Math.round(k*10/(0.0111195*Math.cos(35.681*Math.PI/180)));
    for(var i=1;i<=100;i++){now=k*1000+i*10;
      if(x){if(i===20||i===48)sm.t_ok=now;
        if(i===20&&sm.st===0)sm.st=1;
        if(i===28){sm.t_ok=now;var g={q:x[0],ns:x[1],hdop:Math.round(x[2]*100),pos:x[3]==="A",lat:x[4]?lat0-6000000:lat0,lon:lon},kd=_w15_kind(g,x[3]);
          _w15_fixEpoch(sm,kd,now);var w=_w15_judge(sm,g,now);E.push({k:k,q:x[0],ns:x[1],hd:x[2],kind:kd,st:sm.st,why:w,jump:x[4]});}}
      _w15_fixTick(sm,now);if(i%10===0)H.push([now/1000,sm.st]);}
    k++;}
  function draw(){
    var nar=_w15_nar(box),Wd=nar?400:700,o=[];
    /* (a) 状態のはしご */
    var lx=nar?8:14,lw=nar?118:150,ly=nar?24:30,lh=nar?24:30,gap=nar?3:6;
    o.push(S.T(lx,16,"(a) 状態機械","start",10.5,"ink",true));
    for(var s=6;s>=0;s--){var y=ly+(6-s)*(lh+gap)+(s===0?(nar?6:10):0),on=sm.st===s;
      o.push(S.RECT(lx,y,lw,lh,lh/2.6,on?U.soft(_W15_SC[s]):"var(--panel)",_W15_SC[s],on?2.8:1));
      o.push(S.T(lx+lw/2,y+lh/2+4,_W15_SN[s],"middle",nar?9.5:10.5,_W15_SC[s],on));
      if(sm.ncand>0&&s===sm.cand)o.push(S.T(lx+lw+4,y+lh/2+4,"↑ あと "+(3-sm.ncand),"start",9,"green",true));}
    /* (b) 時間の帯 */
    var x0=nar?190:262,x1=Wd-10,span=nar?16:30,t1=Math.max(span,k),t0=t1-span;
    var X=function(t){return x0+(t-t0)/span*(x1-x0);},cw=(x1-x0)/span;
    o.push(S.T(x0,16,"(b) 組の値と判断（最近 "+span+" s）","start",10.5,"ink",true));
    var rows=nar?{q:40,ns:58,hd:76,kind:108,st:134,why:160}:{q:42,ns:62,hd:82,kind:118,st:146,why:174};
    [["q","品質"],["ns","衛星"],["hd","HDOP"],["kind","組"],["st","状態"],["why","判断"]].forEach(function(r){o.push(S.T(x0-4,rows[r[0]]+4,r[1],"end",9,"ink",true));});
    var hp=U.plot(x0,rows.hd-10,x1-x0,20,[t0,t1],[0,3.2]);
    o.push(S.L(x0,hp.Y(2),x1,hp.Y(2),"alias",0.8,"4 3"));
    E.forEach(function(e){if(e.k<t0)return;var xc=X(e.k+0.28);
      o.push(S.T(xc,rows.q+4,String(e.q),"middle",8.5,"ink",false,true));o.push(S.T(xc,rows.ns+4,String(e.ns),"middle",8.5,"ink",false,true));
      if(e.q>0)o.push(S.L(X(e.k),hp.Y(Math.min(3.2,e.hd)),X(e.k+1),hp.Y(Math.min(3.2,e.hd)),"gold",1.6));
      o.push(S.RECT(xc-cw/2+1,rows.kind-8,cw-2,15,2,U.soft(_W15_SC[e.kind]),_W15_SC[e.kind],0.9));
      o.push(S.T(xc,rows.why+4,_W15_WS[e.why],"middle",e.why?8.5:9,_W15_WC[e.why],true));});
    var seg=null;H.forEach(function(h){if(h[0]<t0)return;if(!seg||seg.st!==h[1]){if(seg)o.push(band(seg));seg={a:h[0]-0.1,b:h[0],st:h[1]};}else seg.b=h[0];});
    if(seg)o.push(band(seg));
    function band(sg){var a=Math.max(t0,sg.a),w=X(sg.b)-X(a),r=S.RECT(X(a),rows.st-9,Math.max(0.5,w),18,0,U.soft(_W15_SC[sg.st]),_W15_SC[sg.st],0.8);
      if(w>U.tw(_W15_SN[sg.st],8.5)+4)r+=S.T(X(a)+w/2,rows.st+4,_W15_SN[sg.st],"middle",8.5,_W15_SC[sg.st],true);return r;}
    for(var tt=Math.ceil(t0/5)*5;tt<=t1;tt+=5){o.push(S.L(X(tt),rows.why+12,X(tt),rows.why+16,"muted",1));o.push(S.T(X(tt),rows.why+28,String(tt),"middle",9,"muted"));}
    o.push(S.T((x0+x1)/2,rows.why+42,"時間 [s]","middle",9.5,"muted"));
    var hgt=Math.max(rows.why+50,ly+7*(lh+gap)+20);
    o.push(S.T(nar?8:14,hgt-4,"判断: ● 使う　状 3D 未満　衛 衛星の数　H HDOP　飛 飛び","start",9,"muted"));
    box.set(S.svg(Wd,hgt+4,o));
    /* 読み出し */
    var last=E.length?E[E.length-1]:null,h="時刻 <b>"+_w15_f(now/1000,1)+" s</b>　状態機械 <b style=\"color:var(--"+(_W15_SC[sm.st]==="muted"?"muted":_W15_SC[sm.st])+")\">"+_W15_SN[sm.st]+"</b>";
    if(sm.st>=2)h+="　位置の年齢 <b>"+_w15_f((now-sm.t_fix)/1000+0.28,2)+" s</b>（上限 2.5 s + 位置の遅れ）";
    else if(sm.st>=1)h+="　最後の正しい文から <b>"+_w15_f((now-sm.t_ok)/1000,1)+" s</b>（3 s で文なし）";
    if(last)h+="<br>最後の組（"+last.k+" s）: 品質 "+last.q+"・衛星 "+last.ns+"・HDOP "+_w15_f(last.hd,2)+" → 種類 "+_W15_SN[last.kind]+"、判断 "+(last.why?"<span class=\"warn\">使わない（"+_W15_WN[last.why]+"）</span>":"<span class=\"ok\">使う</span>");
    ro.innerHTML=h+'<div class="wnote">状態機械と判断は本文のコードと同じ規則（上がるのは 3 組続いてから、下がるのはすぐ、年齢 2.5 s・文なし 3 s、衛星 5 以上・HDOP 2.0 以下・飛び 50 m/s × 時間 + 30 m。どれも例の値）。モジュールの出し方は例のモデル: 衛星 2 以下は品質 0、3 は 2D、補正の情報が DGNSS・SBAS で 30 s、RTK でフィックスは 5 s（衛星 6 以上）・フロートは 30 s より古いと単独に戻る（製品と設定による）。</div>';
  }
  function scriptAll(){reset();script=true;while(k<30)step();script=false;}
  scriptAll();draw();
  window.addEventListener("resize",function(){draw();});
};

/* ---- 6 節: 記録の再生による試験（本文の replay と同じ手順で、誤りを混ぜた記録を流す） ---- */
REG.w15_replay=function(el,U){
  var S=U.S;
  U.head(el,"REPLAY TEST","記録の再生による試験 — 誤りを混ぜた記録を流し、文ごとの解析と、組・状態・判断を確かめる");
  var r1=U.ctrls(el),cb=[];
  _W15_FAULTS.forEach(function(f,i){cb.push(U.checkbox(r1,(i+1)+". "+f[1]+" s: "+f[2],true,function(){stop();run();draw();}));});
  var br=U.btnrow(el),cur=null,R=null,REC=null,TEND=66;
  var tk=U.ticker(function(){cur+=0.4;if(cur>=TEND){cur=null;tk.stop();}draw();},70);
  U.button(br,"本文の例（誤りを全部）",function(){cb.forEach(function(c){c.set(true);});stop();run();draw();});
  U.button(br,"誤りなし",function(){cb.forEach(function(c){c.set(false);});stop();run();draw();});
  U.button(br,"流す",function(){cur=0;tk.start();});
  U.button(br,"止める",function(){stop();draw();});
  var term=U.mk("div","wnote");term.style.fontFamily="var(--mono)";term.style.whiteSpace="pre";term.style.overflowX="auto";term.style.fontSize="11.5px";term.style.lineHeight="1.45";el.appendChild(term);
  var box=U.svgbox(el),ro=U.readout(el);
  function stop(){tk.stop();cur=null;}
  function run(){var on={};_W15_FAULTS.forEach(function(f,i){if(cb[i].get())on[f[0]]=true;});REC=_w15_record(on);R=_w15_run(REC);
    var j=0;REC.forEach(function(r){if(r[1]!=="PPS"){r[4]=R.lines[j]?R.lines[j][1]:"?";j++;}});}
  function draw(){
    var nar=_w15_nar(box),Wd=nar?400:700,o=[],now=cur==null?TEND:cur,nowms=_W15_T0+now*1000;
    /* 記録（流した所まで） */
    var shown=REC.filter(function(r){return r[0]<=nowms;}).slice(-8),mx=nar?30:58,tl=[];
    shown.forEach(function(r){var tm=_w15_g(r[0]).replace(/ /g,"");
      if(r[1]==="PPS"){tl.push(tm+"  ── PPS ──");return;}
      var s=r[1].length>mx?r[1].slice(0,mx-1)+"…":r[1],res=r[4],c=res==="OK"?(r[3]==="swap"?"var(--alias)":"var(--green)"):"var(--alias)";
      tl.push(tm+"  "+U.esc(s)+'  <b style="color:'+c+'">'+(res==="OK"&&r[3]==="swap"?"OK（見逃し）":res)+"</b>");});
    term.innerHTML="記録の行（時刻 [ms] と文。右は nmea_feed の結果）\n"+tl.join("\n");
    /* 時間の帯 */
    var x0=nar?54:104,x1=Wd-8,X=function(t){return x0+t/TEND*(x1-x0);},cw=X(1)-X(0);
    var rows={f:22,pps:46,ep:68,st:94,why:120};
    [["f","誤り","alias"],["pps","1PPS","green"],["ep","組","signal"],["st","状態","ink"],["why","判断","ink"]].forEach(function(r){o.push(S.T(x0-6,rows[r[0]]+4,r[1],"end",9.5,r[2],true));});
    _W15_FAULTS.forEach(function(f,i){if(!cb[i].get())return;var c=[5,8,11,14,17,21.5,24.6,28,42,51.5][i];
      o.push(S.CIRC(X(c+0.5),rows.f,7,"alias",1.2,U.soft("alias")));o.push(S.T(X(c+0.5),rows.f+3.5,String(i+1),"middle",8.5,"alias",true));});
    REC.forEach(function(r){if(r[1]==="PPS"&&r[0]<=nowms){var t=(r[0]-_W15_T0)/1000;o.push(S.L(X(t),rows.pps-6,X(t),rows.pps+5,"green",1.3));}});
    var done={};R.out.forEach(function(e){if(e.rx<=nowms)done[(e.t-34070000)/1000]=e;});
    var any={};REC.forEach(function(r){if(r[1]!=="PPS"&&r[0]<=nowms)any[r[2]]=true;});
    for(var kk=0;kk<60;kk++){if(done[kk])o.push(S.RECT(X(kk+0.15),rows.ep-6,cw*0.7,12,1,U.soft("green"),"green",0.7));
      else if(any[kk]&&(kk+1)*1000+_W15_T0<=nowms+400)o.push(S.RECT(X(kk+0.15),rows.ep-6,cw*0.7,12,1,U.soft("alias"),"alias",0.7));}
    var seg=null;R.hist.forEach(function(h){var t=(h[0]-_W15_T0)/1000;if(t<0||h[0]>nowms)return;
      if(!seg||seg.st!==h[1]){if(seg)o.push(band(seg));seg={a:t,b:t,st:h[1]};}else seg.b=t;});
    if(seg)o.push(band(seg));
    function band(sg){var w=X(sg.b+0.1)-X(sg.a),r=S.RECT(X(sg.a),rows.st-8,Math.max(0.5,w),16,0,U.soft(_W15_SC[sg.st]),_W15_SC[sg.st],0.7);
      if(w>U.tw(_W15_SN[sg.st],8.5)+4)r+=S.T(X(sg.a)+w/2,rows.st+4,_W15_SN[sg.st],"middle",8.5,_W15_SC[sg.st],true);return r;}
    R.out.forEach(function(e){if(e.rx>nowms)return;var kk=(e.t-34070000)/1000;o.push(S.T(X(kk+0.5),rows.why+4,_W15_WS[e.why],"middle",nar?7:8,_W15_WC[e.why],true));});
    if(cur!=null)o.push(S.L(X(now),10,X(now),rows.why+10,"signal",1.2));
    for(var v=0;v<=60;v+=10){o.push(S.L(X(v),rows.why+12,X(v),rows.why+16,"muted",1));o.push(S.T(X(v),rows.why+28,String(v),"middle",9,"muted"));}
    o.push(S.T((x0+x1)/2,rows.why+42,"記録の時間 [s]","middle",9.5,"muted"));
    box.set(S.svg(Wd,rows.why+50,o));
    /* 数えと、最近の組 */
    var cnt={n_bad:0,n_part:0,n_gap:0};
    if(cur==null)cnt={n_bad:R.n_bad,n_part:R.n_part,n_gap:R.n_gap};
    else{var s2=_w15_run(REC.filter(function(r){return r[0]<=nowms;}),0);cnt={n_bad:s2.n_bad,n_part:s2.n_part,n_gap:s2.n_gap};}
    var outs=R.out.filter(function(e){return e.rx<=nowms;}),lab=R.labels.filter(function(l){return l[0]/10000<=nowms;}).length;
    var h="数え: n_bad <b>"+cnt.n_bad+"</b>・n_part <b>"+cnt.n_part+"</b>・n_gap <b>"+cnt.n_gap+"</b>　渡した組 <b>"+outs.length+"</b>　1PPS の名前 <b>"+lab+"</b>"+(cur==null?"（名前を付けなかった組 "+R.n_nolabel+"）":"");
    var last=outs.slice(-5).reverse().map(function(e){var kk=(e.t-34070000)/1000;
      return [String(kk)+" s",_w15_hms(kk).replace(/(\d\d)(\d\d)(\d\d)/,"$1:$2:$3"),String(e.g.q)+"・"+e.g.ns+"・"+_w15_f(e.g.hdop/100,2),_W15_SN[e.st],e.why?"<span class=\"warn\">使わない（"+_W15_WN[e.why]+"）</span>":"<span class=\"ok\">使う</span>"];});
    ro.innerHTML=h+U.tbl(["組","時刻（UTC）","品質・衛星・HDOP","状態機械","判断"],last,["right","left","left","left","left"])+
      '<div class="wnote">本文の replay と同じく、1 ms ずつ時計を進め、10 ms ごとに主のループを回す（数えと結果は本文の C をホストで動かした値と一致する）。表は最近の 5 組。</div>';
  }
  run();draw();
  window.addEventListener("resize",function(){draw();});
};
