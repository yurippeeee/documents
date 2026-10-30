  /* ============ 01. clockmod — 整数 a が文字盤のどこに着くか ============ */
  REG.clockmod=function(el){
    head(el,"Clock","整数 a を m で割った商と余り、文字盤の上の位置");
    var row=ctrls(el);
    var sm=slider(row,"法 m",2,24,12,1), sa=slider(row,"整数 a",-40,40,15,1);
    var cv=screen(el,300),cc=cctx(cv), ro=readout(el);
    function md(a,m){return ((a%m)+m)%m;}
    function ns(v){return String(v).replace("-","−");}
    function txt(ctx,t,x,y,col,sz,wt,al){ctx.fillStyle=col;ctx.font=(wt||400)+" "+(sz||12)+"px "+C("--mono");
      ctx.textAlign=al||"left";ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
    function draw(){
      var m=+sm.input.value,a=+sa.input.value; sm.val.textContent=m; sa.val.textContent=ns(a);
      var q=Math.floor(a/m),r=md(a,m);
      var bw=cv.getBoundingClientRect().width, wide=bw>=560, want=wide?300:Math.round(2*Math.min(78,(bw-40)/2)+190);
      if(cv.parentElement.style.height!==want+"px")cv.parentElement.style.height=want+"px";
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var R=wide?Math.min(112,(h-40)/2):Math.min(78,(w-40)/2);
      var cx=wide?R+34:w/2, cy=wide?h/2:R+22;
      function ang(t){return -Math.PI/2+TAU*t/m;}
      // 文字盤
      ctx.fillStyle=C("--panel");ctx.strokeStyle=C("--line");ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fill();ctx.stroke();
      // 進んだ道（内側へ巻く渦）
      var laps=Math.abs(a)/m, r0=R-30, step=Math.min(9,(r0-14)/Math.max(1,laps));
      var col=a>=0?C("--signal"):C("--blue");
      if(a!==0){
        ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();
        var N=Math.max(30,Math.ceil(Math.abs(a)*12));
        for(var i=0;i<=N;i++){var t=a*i/N, rr=r0-step*Math.abs(t)/m;
          var x=cx+rr*Math.cos(ang(t)),y=cy+rr*Math.sin(ang(t));i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.stroke();
        var te=a, re=r0-step*Math.abs(te)/m, xe=cx+re*Math.cos(ang(te)), ye=cy+re*Math.sin(ang(te));
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(xe,ye,4.5,0,TAU);ctx.fill();
      }
      ctx.fillStyle=C("--ink");ctx.beginPath();ctx.arc(cx+r0*Math.cos(ang(0)),cy+r0*Math.sin(ang(0)),3.5,0,TAU);ctx.fill();
      // 目盛りと数字
      var fs=m>16?10.5:12;
      for(var k=0;k<m;k++){
        var xa=cx+R*Math.cos(ang(k)),ya=cy+R*Math.sin(ang(k)),xb=cx+(R-6)*Math.cos(ang(k)),yb=cy+(R-6)*Math.sin(ang(k));
        ctx.strokeStyle=C("--muted");ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(xa,ya);ctx.lineTo(xb,yb);ctx.stroke();
        var xl=cx+(R+14)*Math.cos(ang(k)),yl=cy+(R+14)*Math.sin(ang(k));
        if(k===r){ctx.fillStyle=C("--signal-soft");ctx.strokeStyle=C("--signal");ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(xl,yl,11,0,TAU);ctx.fill();ctx.stroke();}
        txt(ctx,String(k),xl,yl+4,k===r?C("--signal"):C("--ink"),fs,k===r?700:400,"center");
      }
      // 説明
      var X=wide?2*R+90:16, Y=wide?Math.max(44,cy-92):2*R+66;
      txt(ctx,"a = "+ns(a)+" = "+(q<0?"("+ns(q)+")":q)+" × "+m+" + "+r,X,Y,C("--ink"),wide?16:14,700);
      txt(ctx,"商 q = "+ns(q)+"、余り r = "+r,X,Y+(wide?30:24),C("--muted"),12.5);
      txt(ctx,"a mod "+m+" = "+r+"、 "+ns(a)+" ≡ "+r+" (mod "+m+")",X,Y+(wide?54:44),C("--signal"),13,700);
      var dir=a>0?"時計回りに "+a+" 目盛り":(a<0?"反時計回りに "+(-a)+" 目盛り":"動かない");
      var lp=Math.floor(Math.abs(a)/m);
      txt(ctx,"0 から"+dir+(lp>0?"（"+lp+" 周を含む）":""),X,Y+(wide?84:66),C("--muted"),12);
      var cls=[r-2*m,r-m,r,r+m,r+2*m].map(ns).join(", ");
      txt(ctx,"同じ位置: …, "+cls+", …",X,Y+(wide?108:86),C("--muted"),12);
      ro.innerHTML='a = <b>'+ns(a)+'</b> を m = <b>'+m+'</b> で割ると商 <b>'+ns(q)+'</b>、余り <b class="ok">'+r+'</b> ／ '+
        '余りが '+r+' の整数はすべて文字盤の '+r+' に着く（余り '+r+' の剰余類）';
    }
    sm.input.addEventListener("input",draw);sa.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 01. euclidsq — 長方形から正方形を切り取る互除法 ============ */
  REG.euclidsq=function(el){
    head(el,"Euclid","長方形から正方形を切り取ることを繰り返す");
    var row=ctrls(el);
    var ia=textin(row,"a",1071,"120px"), ib=textin(row,"b",462,"120px");
    var cv=screen(el,250),cc=cctx(cv), out=panel(el), ro=readout(el);
    var cols=["--signal","--blue","--alias","--muted"];
    function steps(a,b){var s=[];while(b>0&&s.length<80){var q=Math.floor(a/b),r=a%b;s.push([a,q,b,r]);a=b;b=r;}return {s:s,g:a};}
    function draw(){
      var a=parseInt(ia.value,10),b=parseInt(ib.value,10);
      var s0=cc.fit(),w=s0.w,h=s0.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      if(!(a>0&&b>0&&a<=1e9&&b<=1e9)){out.innerHTML='<span style="color:var(--alias)">1 以上 10 億以下の整数を 2 つ入力する</span>';ro.innerHTML="";return;}
      var A=Math.max(a,b),B=Math.min(a,b),res=steps(A,B),st=res.s;
      var pad=12,sc=Math.min((w-2*pad)/A,(h-2*pad)/B),x0=(w-A*sc)/2,y0=(h-B*sc)/2;
      var x=0,y=0,W=A,H=B;
      st.forEach(function(rw,k){
        var q=rw[1],side=rw[2],col=C(cols[k%4]),ps=side*sc,horiz=W>=H;
        if(ps<2){ctx.globalAlpha=.25;ctx.fillStyle=col;
          if(horiz)ctx.fillRect(x0+x*sc,y0+y*sc,q*side*sc,ps);else ctx.fillRect(x0+x*sc,y0+y*sc,ps,q*side*sc);
          ctx.globalAlpha=1;}
        else for(var j=0;j<q;j++){
          var sx=horiz?x+j*side:x, sy=horiz?y:y+j*side, px=x0+sx*sc, py=y0+sy*sc;
          ctx.globalAlpha=.17;ctx.fillStyle=col;ctx.fillRect(px,py,ps,ps);ctx.globalAlpha=1;
          ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.strokeRect(px+.5,py+.5,ps-1,ps-1);
          if(j===0&&ps>=34){ctx.fillStyle=col;ctx.font="700 "+(ps>=70?13:11)+"px "+C("--mono");ctx.textAlign="center";
            ctx.fillText(String(side),px+ps/2,py+ps/2+4);}
        }
        if(horiz){x+=q*side;W-=q*side;}else{y+=q*side;H-=q*side;}
      });
      ctx.strokeStyle=C("--ink");ctx.lineWidth=1.6;ctx.strokeRect(x0,y0,A*sc,B*sc);
      var hm='<div style="color:var(--muted);margin-bottom:.35rem">横 '+A+'、縦 '+B+' の長方形。1 段ごとに、短い辺を 1 辺とする正方形を取れるだけ取る（色は段ごと）。</div>';
      if(a<b)hm+='<div style="color:var(--muted);margin-bottom:.35rem">a &lt; b なので、商が 0 になる最初の段（a と b が入れ替わるだけ）を省いた。</div>';
      st.forEach(function(rw,k){
        hm+='<div style="color:var('+cols[k%4]+');font-weight:'+(rw[3]===0?700:500)+'">'+rw[0]+' = '+rw[1]+' × '+rw[2]+' + '+rw[3]+
          '<span style="color:var(--muted);font-weight:400">　（'+rw[2]+' の正方形を '+rw[1]+' 個）</span></div>';
      });
      out.innerHTML=hm;
      var kb=B.toString(2).length;
      ro.innerHTML='gcd('+a+', '+b+') = <b class="ok">'+res.g+'</b>（最後の正方形の辺） ／ 割り算 <b>'+st.length+'</b> 回 ／ '+
        '上限: 2 × （'+B+' の 2 進の桁数 '+kb+'）= <b>'+(2*kb)+'</b> 回';
    }
    ia.addEventListener("input",draw);ib.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 01. powbits — 繰り返し二乗法をビットごとに追う ============ */
  REG.powbits=function(el){
    head(el,"Fast Power","指数の 2 進表示に沿って 2 乗し、1 の桁だけ掛ける");
    var row=ctrls(el);
    var ia=textin(row,"底 a","3","100px"), ie=textin(row,"指数 e","13","150px"), im=textin(row,"法 n","17","150px");
    var out=panel(el), ro=readout(el);
    function run(){
      var a,e,n;
      try{a=BigInt(ia.value.trim());e=BigInt(ie.value.trim());n=BigInt(im.value.trim());}
      catch(err){out.innerHTML='<span style="color:var(--alias)">整数を入力する</span>';ro.innerHTML="";return;}
      if(a<0n||e<1n||n<2n){out.innerHTML='<span style="color:var(--alias)">a ≥ 0、e ≥ 1、n ≥ 2 の整数を入力する</span>';ro.innerHTML="";return;}
      var bits=e.toString(2),k=bits.length;
      if(k>64){out.innerHTML='<span style="color:var(--alias)">指数は 64 ビット以下にする（表が長くなりすぎるため）</span>';ro.innerHTML="";return;}
      var x=a%n,prod=null,sq=0,mul=0,rows=[];
      for(var i=0;i<k;i++){
        if(i>0){x=x*x%n;sq++;}
        var b=bits[k-1-i]==="1";
        if(b){if(prod===null)prod=x;else{prod=prod*x%n;mul++;}}
        rows.push([i,b,x,b?prod:null]);
      }
      var sty='padding:.15rem .6rem;text-align:right';
      var h='<div style="margin-bottom:.45rem">e = '+e+' = <b>'+bits+'</b>₂（'+k+' ビット）。i 行目の値は a の 2<sup>i</sup> 乗を n で割った余りで、1 つ上の行の値の 2 乗から作る。</div>'+
        '<table style="border-collapse:collapse"><tr>'+["i","ビット","a の 2ⁱ 乗 mod n","掛け合わせた積"].map(function(t){
          return '<th style="'+sty+';color:var(--muted);font-weight:600">'+t+'</th>';}).join("")+'</tr>';
      rows.forEach(function(r){
        h+='<tr style="'+(r[1]?'':'opacity:.5')+'"><td style="'+sty+'">'+r[0]+'</td><td style="'+sty+';color:'+(r[1]?'var(--signal)':'var(--faint)')+';font-weight:700">'+(r[1]?1:0)+'</td>'+
          '<td style="'+sty+';'+(r[1]?'color:var(--signal);font-weight:700':'')+'">'+r[2]+'</td>'+
          '<td style="'+sty+'">'+(r[3]===null?'<span style="color:var(--faint)">（掛けない）</span>':r[3])+'</td></tr>';
      });
      h+='</table>';
      out.innerHTML=h;
      var tot=sq+mul;
      ro.innerHTML=a+' の '+e+' 乗 mod '+n+' = <b class="ok">'+prod+'</b> ／ 2 乗 <b>'+sq+'</b> 回 + 掛け算 <b>'+mul+'</b> 回 = <b>'+tot+'</b> 回 ／ '+
        '素直に掛けると e − 1 = '+(e-1n)+' 回';
    }
    [ia,ie,im].forEach(function(t){t.addEventListener("input",run);});reg(null,run);run();
  };
