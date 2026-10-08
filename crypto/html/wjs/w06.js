  /* ============ 06. dmin — 符号語を入力して最小距離を求める ============ */
  REG.dmin=function(el){
    head(el,"Distance","符号語どうしの距離表と最小距離");
    var row=ctrls(el);
    var ti=textin(row,"符号語（カンマ区切り、同じ長さ）","00000,01011,10101,11110");
    var out=panel(el), ro=readout(el);
    function ham(a,b){var n=0;for(var i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;}
    function run(){
      var C=ti.value.split(",").map(function(s){return s.trim();}).filter(function(s){return s.length;});
      var bad=C.some(function(s){return !/^[01]+$/.test(s)||s.length!==C[0].length;});
      if(C.length<2||bad){out.innerHTML='<span style="color:var(--alias)">0 と 1 だけからなる、同じ長さの符号語を 2 個以上入力する</span>';ro.innerHTML="";return;}
      var dm=1e9,pair=null;
      var h='<table style="border-collapse:collapse"><tr><th></th>'+C.map(function(c){return '<th style="padding:.2rem .5rem;color:var(--muted)">'+esc(c)+'</th>';}).join("")+'</tr>';
      for(var i=0;i<C.length;i++){
        h+='<tr><th style="padding:.2rem .5rem;color:var(--muted);text-align:right">'+esc(C[i])+'</th>';
        for(var j=0;j<C.length;j++){
          var d=ham(C[i],C[j]);
          if(i<j&&d<dm){dm=d;pair=[i,j];}
          h+='<td style="padding:.2rem .5rem;text-align:center">'+(i===j?'<span style="color:var(--faint)">—</span>':d)+'</td>';
        }
        h+='</tr>';
      }
      out.innerHTML=h+'</table>';
      // 最小の組を強調
      var cells=out.querySelectorAll("tr");
      for(var i2=0;i2<C.length;i2++)for(var j2=0;j2<C.length;j2++){
        if(i2!==j2&&ham(C[i2],C[j2])===dm){var td=cells[i2+1].children[j2+1];td.style.color="var(--alias)";td.style.fontWeight="700";}
      }
      var dup=dm===0;
      ro.innerHTML=dup?'<span class="warn">同じ符号語が 2 つある（距離 0）。符号語はすべて異なる必要がある</span>':
        'd_min = <b>'+dm+'</b>（赤の組） ／ 検出 <b class="ok">'+(dm-1)+'</b> ビットまで ／ 訂正 <b class="ok">'+Math.floor((dm-1)/2)+'</b> ビットまで';
    }
    ti.addEventListener("input",run);run();
  };

  /* ============ 06. detcorr — 訂正と検出の配分 ============ */
  REG.detcorr=function(el){
    head(el,"Trade-off","訂正範囲と検出範囲の配分");
    var row=ctrls(el);
    var sd=slider(row,"最小距離 d_min",1,9,4,1), st=slider(row,"訂正する範囲 t",0,4,1,1);
    var cv=screen(el,200),cc=cctx(cv), ro=readout(el);
    function draw(){
      var d=+sd.input.value, tmax=Math.floor((d-1)/2);
      st.input.max=tmax; if(+st.input.value>tmax)st.input.value=tmax;
      var t=+st.input.value, e=d-1-t;
      sd.val.textContent=d; st.val.textContent=t;
      var s=cc.fit(),w=s.w,h=s.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var x0=50,x1=w-50,cy=96,X=function(i){return x0+(x1-x0)*i/d;};
      // 訂正範囲（両方の符号語のまわり）
      [[0,"--blue"],[d,"--alias"]].forEach(function(p){
        if(t>0){var a=X(Math.max(0,p[0]-t)),b=X(Math.min(d,p[0]+t));
          ctx.fillStyle=C(p[1]==="--blue"?"--grid":"--alias-soft");ctx.strokeStyle=C(p[1]);ctx.setLineDash([5,3]);ctx.lineWidth=1.4;
          ctx.beginPath();ctx.roundRect?ctx.roundRect(a-16,cy-26,b-a+32,52,22):ctx.rect(a-16,cy-26,b-a+32,52);ctx.fill();ctx.stroke();ctx.setLineDash([]);}
      });
      ctx.strokeStyle=C("--line");ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
      for(var i=0;i<=d;i++){var cw=(i===0||i===d);
        ctx.fillStyle=cw?C(i===0?"--blue":"--alias"):C("--panel");ctx.strokeStyle=cw?C(i===0?"--blue":"--alias"):C("--muted");ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(X(i),cy,cw?8:5,0,TAU);ctx.fill();ctx.stroke();
        lab(ctx,String(i),X(i),cy+40,C("--muted"),"center");}
      lab(ctx,"c₁（送った）",X(0),cy-34,C("--blue"),"center");
      lab(ctx,"c₂（別の符号語）",X(d),cy-34,C("--alias"),"center");
      // 検出で届く範囲
      if(e>0){ctx.strokeStyle=C("--blue");ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(X(0),cy+60);ctx.lineTo(X(e),cy+60);ctx.stroke();
        ctx.beginPath();ctx.moveTo(X(e),cy+60);ctx.lineTo(X(e)-8,cy+55);ctx.lineTo(X(e)-8,cy+65);ctx.closePath();ctx.fillStyle=C("--blue");ctx.fill();
        lab(ctx,"e = "+e+" ビットまでの誤りで届く範囲",X(0),cy+80,C("--blue"),"left");}
      var ok=e+t<=d-1;
      ro.innerHTML='t = <b>'+t+'</b> ビットまで訂正、さらに e = <b>'+e+'</b> ビットまで検出 ／ t + e = '+(t+e)+' ≤ d_min − 1 = '+(d-1)+
        (t===0?' ／ <span class="warn">t = 0 は訂正せず検出だけする運用</span>':'');
    }
    sd.input.addEventListener("input",draw);st.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 06. bounds — 3 つの限界を比べる ============ */
  REG.bounds=function(el){
    head(el,"Bounds","n と k から、最小距離の上限と保証");
    var row=ctrls(el);
    var sn=slider(row,"符号長 n",3,31,7,1), sk=slider(row,"情報ビット数 k",1,30,4,1);
    var out=readout(el);
    function binom(n,r){var v=1;for(var i=1;i<=r;i++)v=v*(n-r+i)/i;return Math.round(v);}
    function V(n,t){var s=0;for(var i=0;i<=t;i++)s+=binom(n,i);return s;}
    function run(){
      var n=+sn.input.value; sk.input.max=n-1; if(+sk.input.value>n-1)sk.input.value=n-1;
      var k=+sk.input.value; sn.val.textContent=n; sk.val.textContent=k;
      var room=Math.pow(2,n-k);
      // ハミング限界: 2^k V(n,t) <= 2^n を満たす最大の t → d <= 2t+2
      var t=0;while(t+1<=n&&V(n,t+1)<=room)t++;
      var single=n-k+1;
      // GV: 2^k V(n,d-1) <= 2^n を満たす最大の d が存在保証
      var g=1;while(g+1<=n&&V(n,g)<=room)g++;
      out.innerHTML=tbl(["","結果","意味"],[
        ["ハミング限界","訂正 t ≤ <b>"+t+"</b>","半径 t の球 2^k 個が 2^n 個に収まる最大の t（V(n,t) = "+V(n,t)+" ≤ 2^(n−k) = "+room+"）"],
        ["シングルトン限界","d_min ≤ <b>"+single+"</b>","n − k + 1"],
        ["ギルバート・ヴァルシャモフ","d_min ≥ <b>"+g+"</b> の符号が存在","V(n, d−1) ≤ 2^(n−k) を満たす最大の d"],
        ["完全符号か",V(n,t)===room?'<b class="ok">等号（完全符号の大きさ）</b>':"いいえ",""+Math.pow(2,k)+" × "+V(n,t)+" = "+Math.pow(2,k)*V(n,t)+" ／ 2^n = "+Math.pow(2,n)]
      ],["left","left","left"]);
    }
    sn.input.addEventListener("input",run);sk.input.addEventListener("input",run);run();
  };

  /* ============ 06. capacity — 2 元対称通信路の容量 ============ */
  REG.capacity=function(el){
    head(el,"Capacity","Cap = 1 − H(p) と符号化率");
    var row=ctrls(el);
    var sp=slider(row,"反転確率 p",0,0.5,0.1,0.005);
    var cv=screen(el,240),cc=cctx(cv), ro=readout(el);
    function H(p){return (p<=0||p>=1)?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);}
    var codes=[["3 回繰り返し",1/3],["(7,4) ハミング",4/7],["(255,223) RS",223/255]];
    function draw(){
      var p=+sp.input.value; sp.val.textContent=p.toFixed(3);
      var c=chart(cc,0,0.5,0,1,{l:44,b:30});grid(c,4);axis(c);
      var pts=[];for(var x=0;x<=0.5001;x+=0.005)pts.push([x,1-H(x)]);
      pline(c,pts,C("--signal"),2.4);
      for(var i=0;i<=5;i++)lab(c.ctx,(i/10).toFixed(1),c.X(i/10),c.h-10,C("--muted"),"center");
      for(var j=0;j<=4;j++)lab(c.ctx,(j/4).toFixed(2),c.p.l-6,c.Y(j/4)+4,C("--muted"),"right");
      lab(c.ctx,"Cap",c.p.l+6,c.p.t+10,C("--signal"),"left");
      codes.forEach(function(cd,k){var y=c.Y(cd[1]);c.ctx.strokeStyle=C("--faint");c.ctx.setLineDash([4,4]);c.ctx.beginPath();c.ctx.moveTo(c.p.l,y);c.ctx.lineTo(c.w-c.p.r,y);c.ctx.stroke();c.ctx.setLineDash([]);
        lab(c.ctx,cd[0]+" R="+cd[1].toFixed(3),c.w-c.p.r-4,y-4,C("--muted"),"right");});
      var cap=1-H(p);dot(c,p,cap,5,C("--alias"));
      ro.innerHTML='H(p) = <b>'+H(p).toFixed(3)+'</b> ／ Cap = 1 − H(p) = <b>'+cap.toFixed(3)+'</b> ／ '+
        codes.map(function(cd){return cd[0]+': '+(cd[1]<cap?'<b class="ok">R &lt; Cap</b>':'<span class="warn">R &gt; Cap</span>');}).join(" ／ ");
    }
    sp.input.addEventListener("input",draw);reg(cv,draw);
  };

  /* ============ 06. interleave — バーストを分散させる ============ */
  REG.interleave=function(el){
    head(el,"Interleave","バースト誤りが各符号語に何ビットずつ届くか");
    var row=ctrls(el);
    var sd=slider(row,"深さ（並べる符号語の数）",1,8,3,1), sb=slider(row,"バーストの長さ",1,16,3,1), ss=slider(row,"バーストの開始位置",0,40,6,1);
    var cv=screen(el,150),cc=cctx(cv), ro=readout(el);
    var L=6;
    function draw(){
      var D=+sd.input.value,B=+sb.input.value,N=D*L; ss.input.max=Math.max(0,N-B); if(+ss.input.value>N-B)ss.input.value=N-B;
      var S=+ss.input.value; sd.val.textContent=D; sb.val.textContent=B; ss.val.textContent=S;
      var s=cc.fit(),w=s.w,ctx=cc.ctx;ctx.clearRect(0,0,w,s.h);
      var cw=Math.min(22,(w-20)/N), x0=10, hits=[];for(var r=0;r<D;r++)hits.push(0);
      lab(ctx,"送る順",x0,16,C("--muted"),"left");
      for(var j=0;j<N;j++){var r2=j%D,i=Math.floor(j/D),hit=j>=S&&j<S+B; if(hit)hits[r2]++;
        ctx.fillStyle=hit?C("--alias-soft"):C("--screen");ctx.strokeStyle=hit?C("--alias"):C("--line");ctx.lineWidth=hit?2:1;
        ctx.fillRect(x0+j*cw,24,cw-2,22);ctx.strokeRect(x0+j*cw,24,cw-2,22);
        if(cw>=16)lab(ctx,String.fromCharCode(65+r2)+(i+1),x0+j*cw+cw/2-1,39,C("--ink"),"center");}
      lab(ctx,"並べ直した後（行 = 符号語）",x0,72,C("--muted"),"left");
      var rh=Math.min(14,70/D);
      for(var r3=0;r3<D;r3++)for(var i3=0;i3<L;i3++){var j3=i3*D+r3,hit3=j3>=S&&j3<S+B;
        ctx.fillStyle=hit3?C("--alias"):C("--screen");ctx.strokeStyle=C("--line");ctx.fillRect(x0+i3*18,80+r3*rh,16,rh-2);ctx.strokeRect(x0+i3*18,80+r3*rh,16,rh-2);
        lab(ctx,String.fromCharCode(65+r3)+": "+hits[r3]+" ビット",x0+L*18+10,80+r3*rh+rh-3,hits[r3]>1?C("--alias"):C("--muted"),"left");}
      var mx=Math.max.apply(null,hits);
      ro.innerHTML='1 つの符号語に届く誤りは最大 <b>'+mx+'</b> ビット（= ⌈バースト長 ÷ 深さ⌉ 以下） ／ '+
        (mx<=1?'<b class="ok">1 ビット訂正の符号ですべて直せる</b>':'<span class="warn">1 ビット訂正の符号では直せない符号語がある。深さを増やす</span>');
    }
    [sd,sb,ss].forEach(function(o){o.input.addEventListener("input",draw);});reg(cv,draw);
  };
