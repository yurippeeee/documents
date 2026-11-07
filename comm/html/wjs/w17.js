  /* ===== 17 章 アドバタイズとスキャン ===== */
  /* 1 節: 同じ advInterval の機器どうしの重なり（全台が同じ時刻に送り始める） */
  REG.w17_collide=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"COLLIDE","同じ間隔で送るアドバタイザどうしの重なり");
    var row=U.ctrls(el);
    var nA=U.slider(row,"アドバタイザの台数",{values:[2,3,4,5,6],value:2,fmt:function(v){return v+" 台";},onInput:draw});
    var ai=U.slider(row,"advInterval",{values:[20,50,100,152.5,200,500,1000],value:100,fmt:function(v){return v+" ms";},onInput:draw});
    var row2=U.ctrls(el);
    var dl=U.checkbox(row2,"advDelay（イベントごとに 0〜10 ms の乱数）",true,draw);
    var pp=U.slider(row2,"時計の差（最大）",{values:[0,10,20,40,100,500],value:0,fmt:function(v){return v+" ppm";},onInput:draw});
    var ne=U.slider(row2,"イベントの数",{values:[100,300,1000],value:300,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var L=0.376, COLS=["signal","purple","teal","gold","green","alias"], NAMES="ABCDEF";
    function sl(d){return (d<0?-1:1)*Math.log(1+Math.abs(d)/0.2)/Math.LN10;}   /* 0 付近を拡大する目盛 */
    function near(arr,x){var lo=0,hi=arr.length-1;while(hi-lo>1){var m=(lo+hi)>>1;if(arr[m]<=x)lo=m;else hi=m;}return Math.abs(arr[lo]-x)<=Math.abs(arr[hi]-x)?arr[lo]:arr[hi];}
    function draw(){
      var N=nA.get(),A=ai.get(),useD=dl.get(),ppm=pp.get(),K=ne.get(),R=U.rng(seed*7919+N*31);
      var err=[],t=[],ev=[],i,k;
      for(i=0;i<N;i++){err.push(i===0?0:(R.next()*2-1)*ppm*1e-6);t.push([]);}
      for(i=0;i<N;i++){var tt=0;for(k=0;k<K;k++){t[i].push(tt);ev.push([tt,i,k]);tt+=A*(1+err[i])+(useD?R.range(0,10):0);}}
      ev.sort(function(a,b){return a[0]-b[0];});
      var hit=[];for(i=0;i<N;i++){hit.push([]);for(k=0;k<K;k++)hit[i].push(false);}
      for(var a=0;a<ev.length;a++){for(var b=a+1;b<ev.length&&ev[b][0]-ev[a][0]<L;b++){if(ev[b][1]!==ev[a][1]){hit[ev[a][1]][ev[a][2]]=true;hit[ev[b][1]][ev[b][2]]=true;}}}
      var half=A/2+5,ym=sl(half),W=700,o=[],p=U.plot(78,20,592,200,[0,K],[-ym,ym]);
      o.push(S.RECT(p.x,p.Y(sl(L)),p.w,p.Y(sl(-L))-p.Y(sl(L)),0,U.soft("alias"),"none",0));
      o.push(p.axes({xl:"イベントの番号",yt:[]}));
      [0,L,1,10,100,1000].forEach(function(v){if(v>half)return;(v?[v,-v]:[0]).forEach(function(u){var yy=p.Y(sl(u));
        o.push(S.L(p.x,yy,p.x+p.w,yy,"grid",1));o.push(S.L(p.x-4,yy,p.x,yy,"muted",1));
        o.push(S.T(p.x-7,yy+3.3,(u>0?"+":u<0?"−":"")+(Math.abs(u)===L?"0.376":String(Math.abs(u))),"end",9,"muted"));});});
      o.push(S.T(p.x-50,p.y+p.h/2,"最も近い A のイベントとのずれ [ms]","middle",9.5,"muted",false,false,-90));
      o.push(S.T(p.x+p.w-4,p.Y(sl(L))-4,"|ずれ| < 0.376 ms で重なる","end",9.5,"alias",true,false,null,true));
      for(i=1;i<N;i++){
        var seg=[],c=COLS[i],prev=null,dl_;
        for(k=0;k<K;k++){var d=t[i][k]-near(t[0],t[i][k]);
          if(prev!==null&&Math.abs(d-prev)>half){if(seg.length>1)o.push(p.line(seg,c,1.4));seg=[];}   /* いちばん近い A のイベントが入れ替わった所で線を切る */
          seg.push([k,sl(d)]);prev=d;dl_=d;}
        if(seg.length>1)o.push(p.line(seg,c,1.4));else if(seg.length)o.push(S.D(p.X(seg[0][0]),p.Y(seg[0][1]),c,2));
        o.push(S.T(p.X(K)+4,p.Y(sl(dl_))+4,NAMES[i],"start",10,c,true));
      }
      // 重なったイベントの印
      var y0=262;
      o.push(S.T(p.x,y0-12,"重なったイベント（赤）","start",10,"ink",true));
      var tot=0,runs=[],rates=[];
      for(i=0;i<N;i++){
        var yy=y0+i*16,cnt=0,run=0,best=0;
        o.push(S.T(p.x-8,yy+9,"機器 "+NAMES[i],"end",9.5,COLS[i],true));
        o.push(S.RECT(p.x,yy,p.w,11,2,"var(--screen)","line",0.8));
        for(k=0;k<K;k++){if(hit[i][k]){cnt++;run++;best=Math.max(best,run);o.push(S.RECT(p.X(k),yy,Math.max(1,p.w/K),11,0,"alias","none",0));}else run=0;}
        tot+=cnt;runs.push(best);rates.push(cnt/K);
      }
      box.set(S.svg(W,y0+N*16+8,o));
      var lines=[];
      for(i=0;i<N;i++)lines.push(["機器 "+NAMES[i],i?(err[i]>=0?"+":"−")+Math.abs(err[i]*1e6).toFixed(1)+" ppm":"（基準）",U.fmt.int(Math.round(rates[i]*K))+" / "+K,F.pct(rates[i],3),runs[i]+" 回"]);
      var eb=Math.abs(err[1]),stepUs=eb*A*1000,nmove=stepUs>0?Math.ceil(L*1000/stepUs):Infinity;
      var all=tot/(N*K),msg;
      if(!useD&&ppm===0)msg='<span class="warn">advDelay が無く時計もそろっているので、ずれは 0 のまま変わらず、すべてのイベントが重なる。</span>';
      else if(!useD)msg='<b>advDelay が無いので、ずれは時計の差だけでゆっくり動く。</b> 1 回にずれるのは advInterval × 時計の差で、B（'+(err[1]*1e6).toFixed(1).replace("-","−")+' ppm）は 1 回に '+U.sig(stepUs,3)+' µs、0.376 ms を超えるまでに約 '+(isFinite(nmove)?U.fmt.int(nmove):"∞")+' 回かかる。';
      else msg='<span class="ok">advDelay があるので、ずれは毎回、2 台の乱数の差だけ動く。</span> 同時に始めた 2 台が次のイベントでも重なる確率は 1 − (1 − 0.376/10)² ≈ 7.4 %。';
      ro.innerHTML=msg+"<br>重なったイベントの割合（全台の平均）= <b>"+F.pct(all,3)+"</b>（パケットは AdvData 31 バイトの 0.376 ms とした。縦軸は 0 付近を拡大した目盛）"+
        U.tbl(["機器","A との時計の差","重なったイベント","割合","最長の連続"],lines,["left","right","right","right","right"]);
    }
    draw();
  };

  /* 3 節: AdvData とスキャン応答の組み立て */
  REG.w17_adv=function(el,U){
    var S=U.S,F=U.fmt;
    U.head(el,"ADV DATA","AD 構造を並べて AdvData とスキャン応答を作る");
    var row=U.ctrls(el);
    var pdu=U.select(row,"PDU の種類",["ADV_IND（接続・スキャン可）","ADV_SCAN_IND（スキャン可）","ADV_NONCONN_IND（どちらも不可）"],0,draw);
    var fl=U.select(row,"フラグ",["0x06（いつでも・BR/EDR なし）","0x05（限られた時間・BR/EDR なし）","入れない"],0,draw);
    var mode=U.select(row,"置き方",["すべて AdvData に","入りきらない分をスキャン応答へ"],1,draw);
    var row2=U.ctrls(el);
    var nm=U.textin(row2,"名前（UTF-8）","TH-01",draw,{width:"220px"});
    var uu=U.textin(row2,"16 ビット UUID（16 進、カンマ区切り）","180F",draw,{width:"220px"});
    var row3=U.ctrls(el);
    var u128=U.checkbox(row3,"128 ビット UUID を 1 つ載せる（例の値）",false,draw);
    var txp=U.checkbox(row3,"送信電力（0 dBm）",true,draw);
    var mf=U.checkbox(row3,"メーカー固有データ（会社 ID 0xFFFF + 温度 + 電池）",true,draw);
    var row4=U.ctrls(el);
    var tp=U.slider(row4,"温度",{min:-40,max:85,step:0.05,value:23.45,fmt:function(v){return v.toFixed(2)+" °C";},onInput:draw});
    var bt=U.slider(row4,"電池の残り",{min:0,max:100,step:1,value:87,fmt:function(v){return v+" %";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"本文の例（24 バイト）に戻す",function(){pdu.set(0);fl.set(0);mode.set(1);nm.set("TH-01");uu.set("180F");u128.set(false);txp.set(true);mf.set(true);tp.set(23.45);bt.set(87);draw();});
    U.button(br,"長い名前にする",function(){nm.set("Thermo-Hygrometer-01");draw();});
    var box=U.svgbox(el,{scroll:true}); var ro=U.readout(el);
    var COL={flags:"signal",name:"purple",uuid16:"green",uuid128:"green",tx:"teal",mfr:"gold"};
    var SHORT={flags:"フラグ",name:"名前",uuid16:"UUID",uuid128:"128 ビット UUID",tx:"送信電力",mfr:"メーカー固有"};
    function utf8(s){var out=[];for(var i=0;i<s.length;i++){var c=s.codePointAt(i);if(c>0xFFFF)i++;
      if(c<0x80)out.push(c);else if(c<0x800)out.push(0xC0|c>>6,0x80|c&63);else if(c<0x10000)out.push(0xE0|c>>12,0x80|c>>6&63,0x80|c&63);else out.push(0xF0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63);}return out;}
    function cut(bytes,n){if(n>=bytes.length)return bytes.slice();var k=Math.max(0,n);while(k>0&&(bytes[k]&0xC0)===0x80)k--;return bytes.slice(0,k);}   /* 文字の途中で切らない */
    function ad(type,data,key,label){return {type:type,data:data,key:key,label:label,bytes:[data.length+1,type].concat(data)};}
    function used(a){return a.reduce(function(s,x){return s+x.bytes.length;},0);}
    function draw(){
      var warn=[],items=[];
      var f=fl.get();if(f<2)items.push(ad(1,[f===0?6:5],"flags","フラグ"));
      var us=uu.get().split(/[,\s]+/).filter(function(x){return x.length;}),ud=[];
      us.forEach(function(x){if(!/^[0-9a-fA-F]{1,4}$/.test(x)){warn.push("UUID「"+U.esc(x)+"」は 16 ビットの 16 進ではないので除いた");return;}var v=parseInt(x,16);ud.push(v&255,v>>8);});
      if(ud.length)items.push(ad(3,ud,"uuid16","16 ビット UUID の一覧"));
      if(txp.get())items.push(ad(0x0A,[0],"tx","送信電力"));
      if(mf.get()){var tu=Math.round(tp.get()*100)&0xFFFF;items.push(ad(0xFF,[0xFF,0xFF,tu&255,tu>>8,bt.get()],"mfr","メーカー固有データ"));}
      if(u128.get())items.push(ad(7,[0xF0,0xE1,0xD2,0xC3,0xB4,0xA5,0x96,0x87,0x78,0x69,0x5A,0x4B,0x3C,0x2D,0x1E,0x0F],"uuid128","128 ビット UUID の一覧"));
      var name=utf8(nm.get()),adv=[],rsp=[],at=items.length&&items[0].key==="flags"?1:0;
      if(mode.get()===0){
        items.forEach(function(x){adv.push(x);});
        if(name.length)adv.splice(at,0,ad(9,name,"name","名前（完全）"));
      }else{
        items.forEach(function(x){if(x.key!=="uuid128")adv.push(x);});
        items.forEach(function(x){if(x.key==="uuid128"){if(used(adv)+x.bytes.length<=31)adv.push(x);else rsp.push(x);}});
        if(name.length){
          if(used(adv)+name.length+2<=31)adv.splice(at,0,ad(9,name,"name","名前（完全）"));
          else{
            var room=31-used(adv)-2;
            if(room>=1){var sh=cut(name,room);if(sh.length)adv.splice(at,0,ad(8,sh,"name","名前（短縮）"));}
            var full=cut(name,31-used(rsp)-2);
            if(full.length<name.length)warn.push("完全な名前もスキャン応答の 31 バイトに入りきらないので、途中で切った（AD タイプは短縮の 0x08 にした）");
            if(full.length)rsp.push(ad(full.length<name.length?8:9,full,"name",full.length<name.length?"名前（短縮）":"名前（完全）"));
          }
        }
      }
      var na=used(adv),nr=used(rsp),pd=pdu.get();
      if(pd===2&&nr)warn.push("ADV_NONCONN_IND はスキャン応答を返せないので、スキャン応答の分は誰にも届かない（ADV_SCAN_IND にする）");
      // 図
      var cw=18,x0=92,o=[],y1=34,y2=100,W=Math.max(700,x0+Math.max(31,na,nr)*cw+30),xl=x0+31*cw;
      function rowSvg(list,y,title){
        var x=x0,s=[],n=0;
        s.push(S.T(x0-8,y+15,title,"end",10.5,"ink",true));
        if(!list.length)s.push(S.T(x0+4,y+15,"（なし）","start",10,"muted"));
        list.forEach(function(it){
          var c=COL[it.key],wd=it.bytes.length*cw;
          s.push(S.T(x+wd/2,y-6,wd>=tw(SHORT[it.key],9)+4?SHORT[it.key]:"…","middle",9,c,true));
          it.bytes.forEach(function(b,j){var over=n>=31;
            s.push(S.RECT(x,y,cw,22,2,over?U.soft("alias"):U.soft(c),over?"alias":c,over?1.4:1));
            s.push(S.T(x+cw/2,y+15,F.hex(b),"middle",8.8,"ink",j<2,true));x+=cw;n++;});
        });
        s.push(S.L(xl,y-12,xl,y+28,"alias",1.6,"4 3"));
        return s.join("");
      }
      function tw(s,sz){return U.tw(s,sz);}
      o.push(rowSvg(adv,y1,"AdvData"));
      o.push(rowSvg(rsp,y2,"スキャン応答"));
      o.push(S.T(xl-4,y2+42,"31 バイトの上限 →","end",9.5,"alias"));
      box.set(S.svg(W,y2+50,o));
      var advB=[];adv.forEach(function(x){advB=advB.concat(x.bytes);});
      var tAdv=(16+Math.min(31,na))*8,tRsp=(16+Math.min(31,nr))*8,rows=[];
      adv.concat(rsp).forEach(function(x,i){var mean="";
        if(x.key==="flags")mean=x.data[0]===6?"ビット 1（いつでも）+ ビット 2（BR/EDR なし）":"ビット 0（限られた時間）+ ビット 2（BR/EDR なし）";
        else if(x.key==="name")mean="「"+U.esc(new TextDecoder().decode(new Uint8Array(x.data)))+"」 "+x.data.length+" バイト";
        else if(x.key==="uuid16"){var l=[];for(var j=0;j<x.data.length;j+=2)l.push("0x"+F.hex(x.data[j]|x.data[j+1]<<8,4));mean=l.join("、");}
        else if(x.key==="uuid128")mean="16 バイト（例の値）";
        else if(x.key==="tx")mean="0 dBm";
        else if(x.key==="mfr"){var v=x.data[2]|x.data[3]<<8;if(v>=0x8000)v-=0x10000;mean="会社 ID 0xFFFF、温度 0x"+F.hex(x.data[2]|x.data[3]<<8,4)+" = "+v+" → "+(v/100).toFixed(2)+" °C、電池 "+x.data[4]+" %";}
        rows.push([i<adv.length?"AdvData":"スキャン応答","0x"+F.hex(x.type)+" "+x.label,String(x.bytes[0]),mean]);});
      var ok=na<=31?'<span class="ok">AdvData '+na+' バイト（残り '+(31-na)+'）</span>':'<span class="warn">AdvData '+na+' バイト: 31 バイトを '+(na-31)+' バイト超える（赤のマス）。「入りきらない分をスキャン応答へ」を選ぶか、項目を減らす</span>';
      ro.innerHTML=ok+" ・ スキャン応答 "+nr+" バイト"+(nr>31?' <span class="warn">（31 を超える）</span>':"")+"<br>"+
        "AdvData を載せたパケット = 1 + 4 + 2 + 6 + "+Math.min(31,na)+" + 3 = "+(16+Math.min(31,na))+" バイト → LE 1M で <b>"+tAdv+" µs</b>"+
        (nr&&pd<2?" ・ SCAN_RSP = "+(16+Math.min(31,nr))+" バイト → <b>"+tRsp+" µs</b>":"")+
        (warn.length?'<br><span class="warn">'+warn.join("。<br>")+"。</span>":"")+
        U.tbl(["置き場所","AD タイプ","長さ","中身"],rows,["left","left","right","wrap"])+
        '<div class="wnote">HCI_LE_Set_Advertising_Data の H4 の形（06 章 5 節）: 01 08 20 20 '+F.hex(Math.min(31,na))+" "+advB.slice(0,31).map(function(b){return F.hex(b);}).join(" ")+(na<31?" + 00 × "+(31-na):"")+"</div>";
    }
    draw();
  };

  /* 5 節: 見つかるまでの時間のシミュレーション（モデルは本文と同じ: チャネルの間隔 1 ms、ウィンドウごとに 37・38・39 と替える） */
  REG.w17_disc=function(el,U){
    var S=U.S,F=U.fmt,seed=1;
    U.head(el,"DISCOVERY","スキャンを始めてから初めて受け取るまでの時間");
    var snap=function(v){return Math.max(0.625,Math.round(v/0.625)*0.625);};
    var fms=function(v){return (Math.round(v*1000)/1000)+" ms";};
    var row=U.ctrls(el);
    var ai=U.slider(row,"advInterval",{min:20,max:10240,value:100,log:true,snap:snap,fmt:fms,onInput:draw});
    var ts=U.slider(row,"スキャン間隔 T_s",{min:2.5,max:10240,value:100,log:true,snap:snap,fmt:fms,onInput:draw});
    var row2=U.ctrls(el);
    var ww=U.slider(row2,"スキャンウィンドウ W",{min:2.5,max:10240,value:10,log:true,snap:snap,fmt:fms,onInput:draw});
    var ln=U.slider(row2,"AdvData の長さ",{min:0,max:31,step:1,value:31,fmt:function(v){return v+" バイト";},onInput:draw});
    var row3=U.ctrls(el);
    var dl=U.checkbox(row3,"advDelay（0〜10 ms の乱数）",true,draw);
    var nt=U.slider(row3,"試す回数",{values:[300,1000,3000],value:1000,fmt:function(v){return v+" 回";},onInput:draw});
    var br=U.btnrow(el);
    U.button(br,"もう一度（別の乱数で）",function(){seed++;draw();});
    U.button(br,"例: 100 ms・T_s 100・W 10",function(){ai.set(100);ts.set(100);ww.set(10);dl.set(true);draw();});
    U.button(br,"advInterval 95 ms（r = 0）",function(){ai.set(95);ts.set(100);ww.set(10);draw();});
    U.button(br,"受信し続ける（W = T_s）",function(){ww.set(ts.get());draw();});
    U.button(br,"T_s 10 ms・W 2.5 ms",function(){ts.set(10);ww.set(2.5);draw();});
    var box=U.svgbox(el); var ro=U.readout(el);
    var CAP=600000, G=1.0, NREC=21;   /* 打ち切り 600 s、チャネルの間隔 1 ms、位相を記録する試行の数 */
    function trial(R,A,Ts,W,L,useD,rec){
      var t=R.next()*(A+(useD?R.range(0,10):0)),n=0;
      while(t<CAP&&n<200000){
        n++;
        if(rec&&rec.length<80)rec.push(t);
        for(var c=0;c<3;c++){var s=t+c*G,j=Math.floor(s/Ts);if(j%3===c&&s+L<=j*Ts+W)return [s+L,n];}
        t+=A+(useD?R.range(0,10):0);
      }
      return [null,n];
    }
    function draw(){
      var A=ai.get(),Ts=ts.get(),W=ww.get(),L=(16+ln.get())*8/1000,useD=dl.get(),N=nt.get(),warn="",note="";
      if(W>Ts){W=Ts;warn='<span class="warn">ウィンドウが間隔より長いので、間隔と同じ値で計算した。</span><br>';}
      var cont=W>=Ts,p=cont?1:Math.max(0,W-L)/Ts,Tm=A+(useD?5:0);
      var est=cont?N:N*Math.min(1/Math.max(1e-9,p),CAP/Tm);
      if(est>4e6){N=Math.max(100,Math.floor(N*4e6/est));note="。計算を軽くするため "+N+" 回にした";}
      var R=U.rng(seed*104729+7),res=[],miss=0,ns=0,recs=[];
      for(var i=0;i<N;i++){var rec=i<NREC?[]:null,r=trial(R,A,Ts,W,L,useD,rec);
        if(rec)recs.push({n:r[1],rec:rec,found:r[0]!==null});
        if(r[0]===null)miss++;else{res.push(r[0]);ns+=r[1];}}
      res.sort(function(a,b){return a-b;});
      var mean=res.length?res.reduce(function(s,x){return s+x;},0)/res.length:NaN,
          med=res.length?res[Math.floor(res.length/2)]:NaN,p95=res.length?res[Math.min(res.length-1,Math.floor(res.length*0.95))]:NaN,mx=res.length?res[res.length-1]:NaN;
      var amean=cont?Tm/2:(1/p-0.5)*Tm,n95=cont?1:Math.ceil(Math.log(0.05)/Math.log(1-p)),a95=n95*Tm;
      var rr=((Tm%Ts)+Ts)%Ts,rnear=Math.min(rr,Ts-rr),rhalf=Math.abs(rr-Ts/2);
      // ヒストグラム
      var o=[],Wd=700,xmax=Math.max(p95*1.15,cont?Tm*1.1:Math.min(a95*1.1,mx)),nb=40;
      if(!(xmax>0))xmax=Tm;
      var bins=[],over=0;for(var b=0;b<nb;b++)bins.push(0);
      res.forEach(function(x){var k=Math.floor(x/xmax*nb);if(k>=nb)over++;else bins[k]++;});
      var ymax=Math.max.apply(null,bins.concat([1]));
      var ph=U.plot(70,18,600,170,[0,xmax],[0,ymax*1.12]);
      var tf=function(v){return F.time(v/1000,3);};
      o.push(ph.axes({xl:"発見の時間",yl:"回数",xfmt:tf,yfmt:function(v){return String(Math.round(v));}}));
      bins.forEach(function(c,k){if(c)o.push(S.RECT(ph.X(k*xmax/nb),ph.Y(c),ph.X(xmax/nb)-ph.X(0)-1,ph.Y(0)-ph.Y(c),1,U.soft("signal"),"signal",1));});
      function vline(x,c,lab,dy){if(!(x>=0)||x>xmax)return;var rt=ph.X(x)>560;o.push(S.L(ph.X(x),ph.y,ph.X(x),ph.y+ph.h,c,1.6,c==="alias"?"5 4":null));o.push(S.T(ph.X(x)+(rt?-4:4),ph.y+12+dy,lab,rt?"end":"start",9.5,c,true,false,null,true));}
      vline(mean,"signal","平均",0);vline(p95,"gold","95 %",14);vline(amean,"alias","近似の平均",28);
      if(over)o.push(S.T(ph.x+ph.w,ph.y+ph.h+28,"右の枠外 "+over+" 回","end",9,"muted"));
      // 1 回分の位相（最初の 21 回のうち、かかった回数が真ん中のもの）
      recs.sort(function(a,b){return a.n-b.n;});
      var ex=recs[Math.floor(recs.length/2)],rec=ex?ex.rec:[];
      var y2=240,kx=Math.max(10,Math.min(80,rec.length)),pp=U.plot(70,y2,600,120,[0,kx],[0,Ts]);
      o.push(S.RECT(pp.x,pp.Y(Math.max(0,W-L)),pp.w,pp.Y(0)-pp.Y(Math.max(0,W-L)),0,U.soft("green"),"none",0));
      o.push(pp.axes({xl:"イベントの番号（最初の "+NREC+" 回のうち、かかった回数が真ん中の 1 回）",yl:"位相",xfmt:function(v){return String(Math.round(v));},yfmt:function(v){return F.time(v/1000,2);},ny:4}));
      rec.forEach(function(t,k){o.push(S.D(pp.X(k),pp.Y(t%Ts),ex.found&&k===ex.n-1?"green":"signal",2.6));});
      o.push(S.T(pp.x+6,pp.Y(Math.max(0,W-L))-4,"ウィンドウ（ch 37 の位置）","start",9,"green",false,false,null,true));
      box.set(S.svg(Wd,y2+156,o));
      var adv;
      if(cont)adv='<span class="ok">受信し続けるので、最初のイベントでほぼ受け取れる（上限 ≈ advInterval + 10 ms + イベントの長さ）。</span>';
      else if(Ts<=10&&useD)adv='<span class="ok">スキャン間隔が advDelay の幅 10 ms 以下なので、位相がよく混ざり、近似に近い。</span>';
      else if(rnear<Math.max(2,W/2))adv='<span class="warn">r = '+fms(rr)+' が 0 に近い: 位相がほとんど進まず、近似よりずっと遅くなりやすい。</span>';
      else if(rhalf<Math.max(2,W/2))adv='<span class="warn">r = '+fms(rr)+' がスキャン間隔の半分に近い: 位相が 2 か所を行き来し、遅くなりやすい。</span>';
      else adv='位相は 1 回にほぼ r = '+fms(rr)+' ずつ進む（r = (advInterval'+(useD?' + 5 ms':'')+') mod T_s）。';
      ro.innerHTML=warn+adv+"<br>"+
        "シミュレーション（"+N+" 回"+note+"）: 平均 <b>"+tf(mean)+"</b> ・ 中央値 "+tf(med)+" ・ 95 % <b>"+tf(p95)+"</b> ・ 最大 "+tf(mx)+" ・ 平均のイベント数 "+(res.length?U.sig(ns/res.length,3):"—")+(miss?' ・ <span class="warn">600 s で見つからなかった '+miss+' 回</span>':"")+"<br>"+
        "近似: p = (W − L) / T_s = ("+fms(W)+" − "+fms(L)+") / "+fms(Ts)+" = "+(cont?"1（受信し続ける）":U.sig(p,3))+" ・ 平均 "+(cont?"1":U.sig(1/p,3))+" 回 → <b>"+tf(amean)+"</b> ・ 95 % ≈ "+n95+" 回 → "+tf(a95)+"<br>"+
        "受信の割合 W / T_s = "+F.pct(W/Ts,3)+"（スキャナの平均電流は、ほぼ この割合 × 受信の電流）";
    }
    draw();
  };
