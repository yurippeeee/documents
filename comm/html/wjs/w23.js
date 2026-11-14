  /* ===== 23 章 通信コードを検証する ===== */
  /* xorshift32（本文の C と同じ列を作る） */
  function _w23_x32(seed){var a=(seed>>>0)||1;return function(){a^=a<<13;a>>>=0;a^=a>>>17;a^=a<<5;a>>>=0;return a;};}
  function _w23_seed(k){return ((Math.imul(k,2654435761)|1)>>>0);}
  function _w23_crc16(p,off,n){var c=0xFFFF;for(var i=0;i<n;i++){c^=(p[off+i]<<8)&0xFFFF;for(var b=0;b<8;b++)c=(c&0x8000)?(((c<<1)^0x1021)&0xFFFF):((c<<1)&0xFFFF);}return c;}
  function _w23_payload(idx,p,off){p[off]=(idx>>>24)&255;p[off+1]=(idx>>>16)&255;p[off+2]=(idx>>>8)&255;p[off+3]=idx&255;
    var h=Math.imul(idx,2654435761)>>>0;for(var i=0;i<6;i++){h^=h>>>13;h=Math.imul(h,0x5bd1e995)>>>0;p[off+4+i]=h>>>24;}}
  /* 故障のある通信路（23 章 2 節の chan_send / chan_recv と同じ規則）。tr に記録を残す（乱数は使わない） */
  function _w23_chan(cfg,seed,dir,tr){
    var rnd=_w23_x32(seed),q=[];
    function chance(p){return rnd()<p*4294967296;}
    return {q:q,
      send:function(now,b,meta){
        if(chance(cfg.loss)){if(tr)tr.push({dir:dir,t0:now,t1:null,lost:true,meta:meta});return;}
        var copies=chance(cfg.dup)?2:1;
        for(var k=0;k<copies&&q.length<64;k++){
          var m={at:0,b:b.slice(0),e:null};
          m.at=now+cfg.delay+(rnd()%(cfg.jitter+1));
          var held=false;if(chance(cfg.reorder)){m.at+=cfg.hold;held=true;}
          var cor=false;if(chance(cfg.corrupt)){var pos=rnd()%b.length;m.b[pos]^=(1<<(rnd()%8));cor=true;}
          if(tr){m.e={dir:dir,t0:now,t1:m.at,lost:false,copy:k,held:held,cor:cor,meta:meta,res:null};tr.push(m.e);}
          q.push(m);
        }
      },
      recv:function(now){
        var best=-1;for(var i=0;i<q.length;i++){if(now-q[i].at>=0&&(best<0||q[i].at-q[best].at<0))best=i;}
        if(best<0)return null;var m=q[best];q[best]=q[q.length-1];q.pop();return m;}
    };
  }
  /* 方式 mode（0: 素朴、1: ストップアンドウェイト + CRC・1 ビット、2: 同・16 ビット）で nmsg 個送る */
  function _w23_run(mode,cfg,seed,nmsg,trace){
    var tr=trace?[]:null,ev=trace?[]:null;
    var up=_w23_chan(cfg,seed,"up",tr),down=_w23_chan(cfg,(seed^0x9E3779B9)>>>0,"down",tr);
    var r={ok:0,bad:0,dup:0,order:0,lost:0,gaveup:0,tx:0,end:0,first:null};
    var seen=new Uint8Array(nmsg),maxdel=-1,want=new Uint8Array(10);
    function got(p,off,n,now,m){
      var idx=((p[off]<<24)|(p[off+1]<<16)|(p[off+2]<<8)|p[off+3])>>>0,cls;
      if(n!==10||idx>=nmsg)cls="bad";
      else{_w23_payload(idx,want,0);var same=true;for(var i=0;i<10;i++)if(want[i]!==p[off+i])same=false;
        if(!same)cls="bad";else if(seen[idx])cls="dup";else{seen[idx]=1;cls=(idx<maxdel)?"order":"ok";if(idx>maxdel)maxdel=idx;}}
      r[cls]++;
      if(cls!=="ok"&&!r.first)r.first={t:now,cls:cls,idx:idx,maxdel:maxdel,e:m.e};
      if(m.e)m.e.res=cls;if(m.e)m.e.idx=idx;
    }
    var mod=mode===1?2:65536,sseq=0,rexp=0,deadline=0,idx=0,busy=0,tries=0,f=new Uint8Array(14),now;
    for(now=0;now<2000000;now++){
      var m;
      if(mode===0){
        if(idx<nmsg&&now%10===0){var p=new Uint8Array(10);_w23_payload(idx,p,0);up.send(now,p,{idx:idx});idx++;r.tx++;}
        while((m=up.recv(now)))got(m.b,0,m.b.length,now,m);
        if(idx===nmsg&&up.q.length===0)break;continue;
      }
      if(!busy&&idx<nmsg){
        f[0]=(sseq>>>8)&255;f[1]=sseq&255;_w23_payload(idx,f,2);var c=_w23_crc16(f,0,12);f[12]=c>>>8;f[13]=c&255;
        up.send(now,f,{idx:idx,seq:sseq});r.tx++;busy=1;tries=1;deadline=now+20;
      }else if(busy&&now-deadline>=0){
        if(tries>=8){r.gaveup++;busy=0;idx++;sseq=(sseq+1)%mod;rexp=sseq;}
        else{up.send(now,f,{idx:idx,seq:sseq,re:true});r.tx++;tries++;deadline=now+20;if(ev)ev.push({k:"to",t:now});}
      }
      while((m=up.recv(now))){
        var g=m.b;
        if(g.length!==14||_w23_crc16(g,0,12)!==((g[12]<<8)|g[13])){if(m.e)m.e.res="crcdrop";continue;}
        var s=(g[0]<<8)|g[1];
        if(s===rexp){got(g,2,10,now,m);rexp=(rexp+1)%mod;}else if(m.e)m.e.res="dupdrop";
        var a=new Uint8Array(5);a[0]=0xAC;a[1]=g[0];a[2]=g[1];var c2=_w23_crc16(a,0,3);a[3]=c2>>>8;a[4]=c2&255;
        down.send(now,a,{ack:s});
      }
      while((m=down.recv(now))){
        var h=m.b;
        if(h.length!==5||h[0]!==0xAC||_w23_crc16(h,0,3)!==((h[3]<<8)|h[4])){if(m.e)m.e.res="crcdrop";continue;}
        var s2=(h[1]<<8)|h[2];
        if(busy&&s2===sseq){busy=0;idx++;sseq=(sseq+1)%mod;if(m.e)m.e.res="ackok";}else if(m.e)m.e.res="stale";
      }
      if(idx===nmsg&&!busy&&up.q.length===0&&down.q.length===0)break;
    }
    r.end=now;for(var i=0;i<nmsg;i++)if(!seen[i])r.lost++;
    r.tr=tr;r.ev=ev;return r;
  }

  REG.w23_chan=function(el,U){
    var S=U.S;
    U.head(el,"FAULT","故障のある通信路で 3 つの方式を比べる");
    var row=U.ctrls(el),sl={};
    [["loss","喪失"],["dup","重複"],["corrupt","破損"],["reorder","順番の入れ替え"]].forEach(function(d){
      sl[d[0]]=U.slider(row,d[1],{min:0,max:30,step:1,value:d[0]==="reorder"?10:0,fmt:function(v){return v+" %";},onInput:draw});});
    var row2=U.ctrls(el);
    var md=U.select(row2,"やり取りを描く方式",["(A) 素朴な方式","(B) ストップアンドウェイト + CRC（1 ビットの番号）","(C) (B) の番号を 16 ビットに"],1,draw);
    var br=U.btnrow(el),seedk=1;
    var sb=U.button(br,"もう一度（別の乱数で）",function(){seedk++;draw();});
    function preset(a,b,c,d){sl.loss.set(a);sl.dup.set(b);sl.corrupt.set(c);sl.reorder.set(d);seedk=1;draw();}
    U.button(br,"例: 入れ替えだけ 10 %",function(){preset(0,0,0,10);});
    U.button(br,"例: 喪失だけ 10 %",function(){preset(10,0,0,0);});
    U.button(br,"例: 破損だけ 10 %",function(){preset(0,0,10,0);});
    U.button(br,"例: 4 つを 5 % ずつ",function(){preset(5,5,5,5);});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var NAMES=["(A) 素朴","(B) 1 ビット","(C) 16 ビット"];
    var CLS={ok:"渡す",bad:"壊れたまま渡す ×",dup:"2 回目に渡す ×",order:"順番違いで渡す ×",dupdrop:"重複として捨てる",crcdrop:"CRC が合わず捨てる"};
    function cfg(){return {loss:sl.loss.get()/100,dup:sl.dup.get()/100,corrupt:sl.corrupt.get()/100,reorder:sl.reorder.get()/100,delay:2,jitter:2,hold:50};}
    function draw(){
      var c=cfg(),mode=md.get(),res=[],avg=[];
      for(var k=0;k<3;k++){res.push(_w23_run(k,c,_w23_seed(seedk),1000,k===mode));
        var a={ok:0,bad:0,dup:0,order:0,lost:0,tx:0};
        for(var sd=1;sd<=20;sd++){var q=_w23_run(k,c,_w23_seed(sd),1000,false);for(var key in a)a[key]+=q[key]/20;}
        avg.push(a);}
      render(res[mode],mode);
      function rowOf(n,q,dec){function f(v,warn){var s=dec?U.sig(v,4):String(v);return (warn&&v>0)?'<span class="warn">'+s+'</span>':s;}
        return [n,f(q.ok,false),f(q.bad,true),f(q.dup,true),f(q.order,true),f(q.lost,true),f(q.tx,false)];}
      var H=["方式","正しく渡した","壊れたまま渡した","重複して渡した","順番違い","正しく渡せず","送った回数"],AL=["left","right","right","right","right","right","right"];
      var fr=res[mode].first,msg;
      if(!fr)msg="この種では、"+NAMES[mode]+" に異常は起きなかった（図は始めの部分）。";
      else msg="種の番号 "+seedk+" の "+NAMES[mode]+" では、<b>"+fr.t+" ティック目</b>に、受け手が #"+fr.idx+" を"+
        (fr.cls==="dup"?"<b>2 回目に渡した</b>":fr.cls==="bad"?"<b>壊れたまま渡した</b>":"<b>順番違いで渡した</b>")+
        (fr.maxdel>=0&&fr.cls!=="bad"?"（すでに #"+fr.maxdel+" まで受け取っていた）":"")+"。同じ種なら、何度でも同じ時刻に同じことが起きる。";
      ro.innerHTML=msg+"<br><b>この種（番号 "+seedk+"）で 1000 個を送った結果</b>"+U.tbl(H,res.map(function(q,i){return rowOf(NAMES[i],q,false);}),AL)+
        "<b>種 1〜20 の平均</b>"+U.tbl(H,avg.map(function(q,i){return rowOf(NAMES[i],q,true);}),AL)+
        '<div class="wnote">遅延は 2〜4 ティック、ACK を待つ時間は 20 ティック、入れ替えるメッセージはさらに 50 ティック遅らせる。(B)・(C) は 8 回送っても ACK が来なければ諦める。「正しく渡した」は順番どおりに 1 回だけ渡した数、「正しく渡せず」は一度も正しく渡せなかった数（壊れたまま渡したものを含む）。</div>';
    }
    function render(r,mode){
      var W=700,y0=40,H=440,o=[],xs=170,xr=470;
      var tr=r.tr||[],ft=r.first?r.first.t:30,st;
      if(r.first&&r.first.e&&r.first.e.t0<ft-30)st=Math.max(0,r.first.e.t0-4);else st=Math.max(0,ft-34);
      var en=st+80,sc=H/(en-st),Y=function(t){return y0+(Math.max(st,Math.min(en,t))-st)*sc;};
      o.push(S.RECT(xs-44,6,88,26,7,U.soft("signal"),"signal",1.3));o.push(S.T(xs,24,"送り手","middle",11,"signal",true));
      o.push(S.RECT(xr-44,6,88,26,7,U.soft("green"),"green",1.3));o.push(S.T(xr,24,"受け手","middle",11,"green",true));
      o.push(S.L(xs,32,xs,y0+H+4,"signal",1.2,"3 4"));o.push(S.L(xr,32,xr,y0+H+4,"green",1.2,"3 4"));
      var lastR=-99,lastL=-99;
      function rlab(y,s,c,b){if(y<lastR+11)y=lastR+11;if(y>y0+H+8)return;lastR=y;o.push(S.T(xr+8,y+3,s,"start",9,c,b));}
      function llab(y,s,c,b){if(y<lastL+11)y=lastL+11;if(y>y0+H+8)return;lastL=y;o.push(S.T(xs-8,y+3,s,"end",9,c,b));}
      var items=tr.filter(function(e){var a=e.t0,b=e.t1==null?e.t0:e.t1;return b>=st&&a<=en;});
      items.sort(function(a,b){return (a.t1==null?a.t0:a.t1)-(b.t1==null?b.t0:b.t1);});
      (r.ev||[]).forEach(function(v){if(v.t>=st&&v.t<=en){o.push(S.L(xs-22,Y(v.t),xs,Y(v.t),"teal",1.6));llab(Y(v.t),"時間切れ → 再送","teal",false);}});
      items.forEach(function(e){
        if(!e.held&&(e.t0<st||(e.t1!=null&&e.t1>en)))return;   /* 窓の外にはみ出す矢印は、遅れる写しだけを描く */
        var up=e.dir==="up",x1=up?xs:xr,x2=up?xr:xs,ya=Y(e.t0);
        var lab=up?("#"+e.meta.idx+(mode>0?"（"+e.meta.seq+"）":"")+(e.meta.re?" 再送":"")):("ACK "+e.meta.ack);
        var c=up?(e.held?"purple":(e.cor?"alias":"ink")):"green";
        if(e.lost){var fx=x1+(x2-x1)*0.55,fy=ya+12;o.push(S.L(x1,ya,fx,fy,"alias",1.4,"5 3"));o.push(S.X(fx,fy,4,"alias",2));
          o.push(S.T(x1+(x2-x1)*0.25,ya-3,lab,"middle",8.5,"alias",false,false,null,true));if(mode===0&&up)rlab(fy,"#"+e.meta.idx+" は届かない ×","alias",true);return;}
        var yb=Y(e.t1);
        if(e.t1>en){o.push(S.L(x1,ya,x1+(x2-x1)*((en-e.t0)/(e.t1-e.t0)),y0+H,c,1.4,"4 3"));}
        else o.push(S.ARR(x1,ya,x2,yb,c,1.4,6,up?null:"5 3"));
        o.push(S.T(x1+(x2-x1)*0.22,ya+(yb-ya)*0.22-3,lab+(e.cor?" 壊れた":"")+(e.held?" 遅れる":""),"middle",8.5,c,e.held||e.cor,false,null,true));
        if(e.t1<=en){
          if(up&&e.res){var bad=(e.res==="bad"||e.res==="dup"||e.res==="order");
            var txt=e.res==="ok"?"#"+e.idx+" を渡す":(bad?"#"+e.idx+" を"+CLS[e.res]:CLS[e.res]);
            rlab(yb,txt,bad?"alias":(e.res==="ok"?"green":"gold"),bad);}
          if(!up&&e.res&&e.res!=="ackok")llab(yb,e.res==="stale"?"古い ACK を捨てる":"CRC が合わず捨てる","gold",false);
        }
      });
      o.push(S.T(W/2,y0+H+22,"時間は下へ進む（"+st+"〜"+en+" ティック）。紫は入れ替えで遅れる写し、赤は壊れた写しと誤り、緑の破線は ACK","middle",9.5,"muted"));
      box.set(S.svg(W,y0+H+30,o));
    }
    draw();
  };

  /* ---- 3 節: わざと誤りを入れた解析器と、2 通りの入力の作り方 ---- */
  var _W23_CORPUS=[[0xA5,0x0A,0x01,0x02,0x09,0x2C,0x09,0x04,0x6E,0x6F,0x64,0x65],
    [0xA5,0x1C,0x09,0x04,0x6E,0x6F,0x64,0x65,0x05,0x14,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    [0xA5,0x08,0x02,0x02,0x0F,0xA0,0x03,0x02,0x00,0x64]];
  var _W23_INT=[0x00,0x01,0x7F,0x80,0xFF,0x10,0x20];
  function _w23_parse(b){
    if(b.length<2||b[0]!==0xA5)return "magic";
    if(b[1]!==b.length-2)return "length";
    var i=2;
    while(i<b.length){
      if(b.length-i<2)return "tlv";
      var t=b[i],n=b[i+1];
      if(n>b.length-i-2)return "tlv";
      if(t===0x09){if(n>16)return "crash";if(n>8)return "overflow";}   /* 誤り: n <= 8 を確かめていない */
      i+=2+n;
    }
    return "ok";
  }
  function _w23_mutate(rn){
    var b=_W23_CORPUS[rn()%3].slice(0),k=1+rn()%4;
    for(var j=0;j<k;j++){var op=rn()%5,p;
      if(op===0&&b.length){p=rn()%b.length;b[p]^=1<<(rn()%8);}
      else if(op===1&&b.length){p=rn()%b.length;b[p]=rn()%256;}
      else if(op===2&&b.length){p=rn()%b.length;b[p]=_W23_INT[rn()%7];}
      else if(op===3&&b.length<64){p=rn()%(b.length+1);b.splice(p,0,rn()%256);}
      else if(op===4&&b.length>1){p=rn()%b.length;b.splice(p,1);}
    }
    return b;
  }
  function _w23_random(rn){var n=1+rn()%32,b=[];for(var i=0;i<n;i++)b.push(rn()%256);return b;}

  REG.w23_fuzz=function(el,U){
    var S=U.S;
    U.head(el,"FUZZ","誤りを入れた解析器を、2 通りの入力で試す");
    var row=U.ctrls(el);
    var how=U.select(row,"入力の作り方",["コーパスを変異させる","乱数で作る（長さ 1〜32 バイト）"],0,draw);
    var lim=U.slider(row,"試行の上限",{values:[2000,20000,200000],value:20000,fmt:function(v){return U.fmt.int(v)+" 回";},onInput:draw});
    var row2=U.ctrls(el);
    var san=U.checkbox(row2,"サニタイザ（配列の外に触れたら、その場で止める）",true,draw);
    var br=U.btnrow(el),seedk=1;
    U.button(br,"もう一度（別の乱数で）",function(){seedk++;draw();});
    U.button(br,"種を変えて 20 回試す（変異）",function(){many();});
    var box=U.svgbox(el); var ro=U.readout(el); var ro2=U.readout(el);
    function run(mode,sanOn,seed,limit){
      var rn=_w23_x32(seed),cnt={magic:0,length:0,tlv:0,ok:0,overflow:0,crash:0},found=null,silent=0;
      for(var t=1;t<=limit;t++){
        var b=mode===0?_w23_mutate(rn):_w23_random(rn),r=_w23_parse(b);cnt[r]++;
        if(r==="crash"||(sanOn&&r==="overflow")){found={t:t,b:b,r:r};break;}
        if(r==="overflow")silent++;
      }
      return {cnt:cnt,found:found,silent:silent,n:found?found.t:limit};
    }
    function draw(){
      var mode=how.get(),r=run(mode,san.get(),_w23_seed(seedk),lim.get());
      var c=r.cnt,tot=r.n,st=[["試した入力",tot],["① 印 0xA5 が合う",tot-c.magic],["② 残りの長さが合う",tot-c.magic-c.length],
        ["③ TLV の長さの検査を通る",c.ok+c.overflow+c.crash],["④ 誤りのある所に届く",c.overflow+c.crash]];
      var o=[],p=U.plot(230,30,330,st.length*30,[1e-6,1],[0,st.length],{xlog:true});
      o.push(S.T(395,16,"その段まで届いた入力の割合（対数目盛）","middle",10,"ink",true));
      [1e-6,1e-4,1e-2,1].forEach(function(v){o.push(S.L(p.X(v),24,p.X(v),30+st.length*30,"grid",1));o.push(S.T(p.X(v),44+st.length*30,v===1?"100 %":v===1e-2?"1 %":v===1e-4?"0.01 %":"0.0001 %","middle",9,"muted"));});
      st.forEach(function(s,i){var y=30+i*30,fr=s[1]/tot;o.push(S.T(222,y+19,s[0],"end",9.5,"ink",i===4));
        if(fr>0){o.push(S.RECT(p.x,y+7,Math.max(1,p.X(Math.max(fr,1e-6))-p.x),15,2,U.soft(mode===0?"signal":"muted"),mode===0?"signal":"muted",1.1));
          o.push(S.T(p.X(Math.max(fr,1e-6))+5,y+19,U.fmt.int(s[1])+" 個",'start',9,mode===0?"signal":"muted",true));}
        else o.push(S.T(p.x+4,y+19,"0 個","start",9,"alias",true));});
      var y2=56+st.length*30;
      if(r.found){
        var b=r.found.b,cols=[],i=2;cols[0]="gold";if(b.length>1)cols[1]="teal";
        while(i<b.length){var t=b[i],n=i+1<b.length?b[i+1]:0,badt=(t===9&&n>8);cols[i]=badt?"alias":"purple";if(i+1<b.length)cols[i+1]=badt?"alias":"signal";
          for(var j=i+2;j<Math.min(b.length,i+2+n);j++)cols[j]=badt?"alias":"green";i+=2+n;}
        o.push(S.T(20,y2,"見つかった入力（"+b.length+" バイト）: 金 = 印、青緑 = 残りの長さ、紫 = 型、青 = 長さ、緑 = 値、赤 = 誤りを起こした項目","start",9.5,"muted"));
        var per=Math.min(b.length,24);
        for(var k=0;k<b.length;k++){var col=k%24,rw=Math.floor(k/24),x=20+col*27,yy=y2+10+rw*26,cc=cols[k]||"muted";
          o.push(S.RECT(x,yy,25,22,3,U.soft(cc),cc,1.1));o.push(S.T(x+12.5,yy+15,U.fmt.hex(b[k]),"middle",9.5,"ink",false,true));}
        y2+=10+Math.ceil(b.length/24)*26;
      }
      box.set(S.svg(700,y2+8,o));
      var f=r.found;
      ro.innerHTML=(f?'<span class="ok">'+U.fmt.int(f.t)+' 回目で見つけた</span>（'+(f.r==="crash"?"名前の値が 16 バイトを超え、落ちた":"名前の値が 8 バイトを超えた所で、サニタイザが止めた")+'）':
        '<span class="warn">'+U.fmt.int(lim.get())+' 回試して見つからなかった</span>')+
        "<br>捨てられた段: 印 "+U.fmt.int(c.magic)+" ・ 残りの長さ "+U.fmt.int(c.length)+" ・ TLV の長さ "+U.fmt.int(c.tlv)+" ・ 最後まで正しく読めた "+U.fmt.int(c.ok)+
        (san.get()?"":"<br>サニタイザなし: 名前の値が 9〜16 バイトで、隣の変数を黙って書き換えた（落ちなかった）入力 <b>"+U.fmt.int(r.silent)+"</b> 個");
    }
    function many(){
      var rows=[];
      [true,false].forEach(function(sv){var ts=[];for(var sd=1;sd<=20;sd++){var q=run(0,sv,_w23_seed(sd),200000);ts.push(q.found?q.found.t:Infinity);}
        ts.sort(function(a,b){return a-b;});var med=(ts[9]+ts[10])/2;
        rows.push([sv?"あり":"なし",U.fmt.int(ts[0]),U.fmt.int(med),isFinite(ts[19])?U.fmt.int(ts[19]):"20 万回で見つからず"]);});
      ro2.innerHTML="<b>コーパスを変異させる方法で、種 1〜20 のそれぞれが誤りを見つけるまでの試行の数</b>"+U.tbl(["サニタイザ","最小","中央値","最大"],rows,["left","right","right","right"])+
        '<div class="wnote">乱数で作る方法は、印と長さの 2 つの検査を通る入力が 6 万 5 千回に 1 回ほどしか無く、誤りのある所までは、ここで試せる回数ではまず届かない。</div>';
    }
    draw();
  };
