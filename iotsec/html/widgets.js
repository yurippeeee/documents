/* IoT セキュリティ — 章内インタラクティブ部品 */
(function(){
  "use strict";
  var root=document.documentElement, TAU=Math.PI*2;
  function C(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var draws=[];
  function redrawAll(){draws.forEach(function(f){try{f();}catch(e){}});}
  window.addEventListener("themechange",function(){requestAnimationFrame(redrawAll);});
  window.addEventListener("resize",function(){requestAnimationFrame(redrawAll);});
  function mk(t,c,h){var d=document.createElement(t);if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
  function head(el,k,t){el.appendChild(mk("div","wc",'<span class="k">'+k+'</span><span class="t">'+t+'</span>'));}
  function ctrls(el){var d=mk("div","ctrls");el.appendChild(d);return d;}
  function slider(row,label,min,max,val,step){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+' <b class="val"></b></label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+step+'">';
    row.appendChild(c);return {input:c.querySelector("input"),val:c.querySelector(".val")};}
  function textin(row,label,val,w){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><input type="text" value="'+val+'" style="font-family:var(--mono);font-size:.85rem;padding:.35rem .5rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:'+(w||"100%")+'">';
    row.appendChild(c);return c.querySelector("input");}
  function select(row,label,opts){var c=mk("div","ctrl");
    c.innerHTML='<label>'+label+'</label><select style="font-family:var(--mono);font-size:.8rem;padding:.35rem;border:1px solid var(--line);border-radius:7px;background:var(--screen);color:var(--ink);width:100%">'+
      opts.map(function(o,i){return '<option value="'+i+'">'+o+'</option>';}).join("")+'</select>';
    row.appendChild(c);return c.querySelector("select");}
  function checkbox(row,label,on){var c=mk("div","ctrl");
    c.innerHTML='<label style="cursor:pointer;justify-content:flex-start;align-items:center;gap:.45rem;'+
      'line-height:1.4"><input type="checkbox"'+(on?" checked":"")+
      ' style="flex:none;margin:0;accent-color:var(--signal)"><span>'+label+'</span></label>';
    row.appendChild(c);return c.querySelector("input");}
  function button(row,t){var b=mk("button","btn",t);b.setAttribute("aria-pressed","false");row.appendChild(b);return b;}
  function readout(el){var r=mk("div","readout");el.appendChild(r);return r;}
  function panel(el,h){var d=mk("div","wscreen");d.style.padding=".8rem";d.style.overflowX="auto";
    d.style.fontFamily="var(--mono)";d.style.fontSize=".8rem";d.style.lineHeight="1.6";
    if(h)d.style.minHeight=h+"px";el.appendChild(d);return d;}
  function screen(el,h){var s=mk("div","wscreen");s.style.height=h+"px";var c=mk("canvas");s.appendChild(c);el.appendChild(s);return c;}
  function cctx(cv){var ctx=cv.getContext("2d");function fit(){var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));
    cv.height=Math.max(1,Math.round(r.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);return {w:r.width,h:r.height};}
    return {ctx:ctx,fit:fit};}
  function reg(cv,draw){draws.push(draw);if(cv)new ResizeObserver(draw).observe(cv);}
  function lab(ctx,t,x,y,c,a,sz){ctx.fillStyle=c;ctx.font=(sz||11)+"px "+C("--mono");ctx.textAlign=a||"left";
    ctx.textBaseline="alphabetic";ctx.fillText(t,x,y);}
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function f(x,d){return (Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toFixed(d);}
  function hex(v,w){var s=(v>>>0).toString(16).toUpperCase();while(s.length<(w||0))s="0"+s;return "0x"+s;}
  function tbl(headers,rows,align){
    var h='<table style="border-collapse:collapse;width:100%"><tr>'+headers.map(function(t,i){
      return '<th style="padding:.25rem .7rem;text-align:'+((align&&align[i])||"left")+
        ';color:var(--muted);font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap">'+t+'</th>';}).join("")+'</tr>';
    rows.forEach(function(r){
      h+='<tr>'+r.map(function(v,i){return '<td style="padding:.22rem .7rem;text-align:'+
        ((align&&align[i])||"left")+';vertical-align:top">'+v+'</td>';}).join("")+'</tr>';});
    return h+'</table>';
  }
  function boxes(items){ // クリック可能なブロック列
    return '<div style="display:flex;flex-direction:column;gap:.25rem">'+items+'</div>';
  }
  function chart(cc,x0,x1,y0,y1,pad){
    var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;
    var p={l:44,r:14,t:16,b:28};
    if(pad)for(var k in pad)p[k]=pad[k];
    ctx.clearRect(0,0,w,h);
    return {ctx:ctx,w:w,h:h,p:p,
      X:function(x){return p.l+(x-x0)/(x1-x0)*(w-p.l-p.r);},
      Y:function(y){return h-p.b-(y-y0)/(y1-y0)*(h-p.t-p.b);},x0:x0,x1:x1,y0:y0,y1:y1};
  }
  function grid(c,ny){var ctx=c.ctx;ctx.strokeStyle=C("--grid");ctx.lineWidth=1;
    for(var i=0;i<=ny;i++){var yy=c.p.t+i/ny*(c.h-c.p.t-c.p.b);
      ctx.beginPath();ctx.moveTo(c.p.l,yy);ctx.lineTo(c.w-c.p.r,yy);ctx.stroke();}}
  function axis(c){var ctx=c.ctx;ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(c.p.l,c.h-c.p.b);ctx.lineTo(c.w-c.p.r,c.h-c.p.b);ctx.stroke();}
  function line(c,pts,col,lw,dash){var ctx=c.ctx;ctx.strokeStyle=col;ctx.lineWidth=lw||2.2;
    if(dash)ctx.setLineDash(dash);ctx.beginPath();
    pts.forEach(function(q,i){i?ctx.lineTo(c.X(q[0]),c.Y(q[1])):ctx.moveTo(c.X(q[0]),c.Y(q[1]));});
    ctx.stroke();ctx.setLineDash([]);}
  function dot(c,x,y,r,col,st){var ctx=c.ctx;ctx.beginPath();ctx.arc(c.X(x),c.Y(y),r,0,TAU);
    if(st){ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}
  function rrect(ctx,x,y,w,h,r){ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  var REG={};

  /* ---------- 共有: 選択式ウィジェットの土台 ---------- */
  /* items: [{k:キー, n:表示名, c:色トークン, ...}]  render(item)->html */
  function picker(el,items,render,opt){
    opt=opt||{};
    var wrap=mk("div","wscreen");wrap.style.padding=".55rem";
    var bar=mk("div");bar.style.cssText="display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.55rem";
    var body=mk("div");
    wrap.appendChild(bar);wrap.appendChild(body);el.appendChild(wrap);
    var _ro=el.querySelector(".readout");if(_ro)el.appendChild(_ro);   /* readout を末尾へ */
    var sel=opt.init||0;
    items.forEach(function(it,i){
      var b=mk("button","btn",it.n);b.style.fontSize=opt.small?".7rem":".74rem";
      b.addEventListener("click",function(){sel=i;draw();});
      bar.appendChild(b);
    });
    function draw(){
      Array.prototype.forEach.call(bar.children,function(b,i){
        var on=(i===sel),col=C(items[i].c||"--signal");
        b.style.background=on?col:"var(--panel)";
        b.style.color=on?"#fff":"var(--muted)";
        b.style.borderColor=on?col:"var(--line)";
      });
      body.innerHTML=render(items[sel],sel);
    }
    reg(null,draw);draw();
    return {redraw:draw,get:function(){return items[sel];}};
  }
  /* 見出し付きブロック */
  function blk(title,html,col){
    return '<div style="margin-bottom:.6rem"><div style="color:var('+(col||"--muted")+
      ');font-size:.82rem;font-weight:700;margin-bottom:.2rem">'+title+'</div>'+html+'</div>';
  }
  /* 箇条書き */
  function ul(items){
    return '<ul style="margin:.1rem 0 .1rem 1.1rem;padding:0;line-height:1.65">'+
      items.map(function(t){return '<li>'+t+'</li>';}).join("")+'</ul>';
  }
  /* タグ列 */
  function tags(items,col){
    return '<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin:.2rem 0">'+
      items.map(function(t){return '<span style="font-family:var(--mono);font-size:.7rem;'+
        'padding:.16rem .45rem;border:1px solid var('+(col||"--line")+');border-radius:5px;'+
        'color:var(--muted)">'+t+'</span>';}).join("")+'</div>';
  }
  /* 段階バー */
  function meter(label,v,max,col){
    var pc=Math.max(0,Math.min(100,100*v/max));
    return '<div style="display:flex;align-items:center;gap:.5rem;margin:.15rem 0">'+
      '<span style="flex:none;width:9rem;color:var(--muted);font-size:.8rem">'+label+'</span>'+
      '<span style="flex:1;height:9px;background:var(--screen);border-radius:5px;overflow:hidden;display:block">'+
      '<span style="display:block;height:100%;width:'+pc.toFixed(0)+'%;background:var('+(col||"--signal")+')"></span></span>'+
      '</div>';
  }

  /* ---------- 01: 攻撃面 ---------- */
  REG.attacksurface=function(el){
    head(el,"Attack Surface","攻撃者は最も安い経路を選ぶ");
    var A=[
      {k:"net",n:"ネットワーク",c:"--blue",cost:"0 円",time:"数分",cls:"クラス 1",
       d:"デフォルトパスワード、既知の CVE、開いたポート、認証前の処理。",
       atk:["デフォルト認証情報の総当たり","既知の脆弱性（CVE）の悪用","認証前のパケット処理の脆弱性","中間者攻撃（TLS 検証の欠如）"],
       def:["デフォルトパスワードの禁止（03 章）","不要なサービスを持たない（02 章）","TLS の正しい設定（16 章）","脆弱性の追跡と更新（13・15 章）"]},
      {k:"fw",n:"公開ファームウェア",c:"--blue",cost:"0 円",time:"数分",cls:"クラス 1",
       d:"サポートサイトの更新ファイル、OTA の傍受。ダウンロードして解析するだけ。",
       atk:["strings で鍵・パスワードを探す","binwalk で展開して解析","パッチ差分から脆弱性を特定"],
       def:["ファームウェアに秘密を埋め込まない（11 章）","イメージの暗号化（13 章）","CI での自動シークレットスキャン（11 章）"]},
      {k:"uart",n:"UART / コンソール",c:"--signal",cost:"数百円",time:"数分",cls:"クラス 1",
       d:"基板上のテストパッドに USB シリアル変換を繋ぐだけ。起動ログやシェルが出る。",
       atk:["起動ログから構成を把握","シェルプロンプトへの侵入","ブートローダの中断と起動引数の改変"],
       def:["量産ビルドからコードごと除去（11 章）","ログレベルを下げる","テストパッドを基板から削除"]},
      {k:"swd",n:"SWD / JTAG",c:"--signal",cost:"数千円",time:"数分",cls:"クラス 2",
       d:"デバッガを繋げばフラッシュも RAM も読める。実行制御もできる。",
       atk:["フラッシュ全体のダンプ","RAM 上の鍵の読み出し","CPU の停止・改変"],
       def:["読み出し保護／デバッグ無効化（06・11 章）","認証付きデバッグ（11 章）","ライフサイクル状態の遷移（14 章）"]},
      {k:"flash",n:"外付けフラッシュ",c:"--signal",cost:"数千円",time:"数十分",cls:"クラス 2",
       d:"SOIC クリップを付けるか、ホットエアで外して読む。SPI バスの盗聴も可能。",
       atk:["フラッシュのフルダンプ","SPI バスのロジアナ観測","内容の差し替え"],
       def:["フラッシュ暗号化（06 章）","オンザフライ復号（OTFDEC / PRINCE / Flash Encryption）","重要部分を内部フラッシュへ"]},
      {k:"glitch",n:"フォールト注入",c:"--alias",cost:"数万円",time:"数時間〜",cls:"クラス 2〜3",
       d:"電圧／クロックのグリッチで、保護の判定分岐を飛ばす。",
       atk:["読み出し保護のバイパス","セキュアブート検証のスキップ","DFA による鍵の抽出"],
       def:["冗長な検証・CFI カウンタ（10 章）","電圧／クロックセンサ","PSA L3 / SESIP 4 以上のチップ（03 章）"]},
      {k:"sca",n:"サイドチャネル",c:"--alias",cost:"数万〜数十万円",time:"数時間〜",cls:"クラス 3〜4",
       d:"消費電力や電磁波の波形から、統計的に鍵を求める。EMA は非接触。",
       atk:["DPA / CPA による AES 鍵の抽出","SPA による RSA 指数の読み取り","タイミング攻撃"],
       def:["DPA 対策済み暗号エンジン（09 章）","定時間実装","鍵の使用回数制限","セキュアエレメント（22 章）"]},
      {k:"lab",n:"開封・プロービング",c:"--alias",cost:"数百万円〜",time:"数週間〜",cls:"クラス 4〜5",
       d:"チップを開封し、顕微鏡・FIB・レーザーで直接操作する。",
       atk:["eFuse の光学的な読み取り","内部配線へのプロービング","レーザーフォルト注入"],
       def:["PUF（06 章）","アクティブシールド・光センサ","CC EAL6+ / AVA_VAN.5 のセキュアエレメント（22 章）"]}
    ];
    var out=readout(el);
    var p=picker(el,A,function(a){
      var h=blk("この経路は",'<div style="line-height:1.7">'+esc(a.d)+'</div>',a.c);
      h+='<div style="display:flex;gap:1.2rem;flex-wrap:wrap;margin:.4rem 0 .6rem;font-family:var(--mono);font-size:.78rem">'+
        '<span style="color:var(--muted)">費用 <b style="color:var('+a.c+')">'+a.cost+'</b></span>'+
        '<span style="color:var(--muted)">時間 <b>'+a.time+'</b></span>'+
        '<span style="color:var(--muted)">攻撃者 <b>'+a.cls+'</b></span></div>';
      h+=blk("具体的な攻撃",ul(a.atk.map(esc)),"--alias");
      h+=blk("対策",ul(a.def.map(esc)),"--signal");
      out.innerHTML='攻撃者は<b>最も安い経路</b>を選ぶ。'+
        (["net","fw","uart","swd","flash"].indexOf(a.k)>=0
          ? '<b class="ok">この経路は追加の部品コストなしで塞げる</b>（設定とビルド構成の見直しだけ）。ここを塞がずに高度な対策を議論しても意味がない'
          : '<span class="warn">この経路への対策は、チップ選定の段階で決まる</span>。基板を起こしてからでは変えられない（01 章）')+
        ' ／ 02 章の攻撃ツリーで見たとおり、<b>一番弱い枝の強度が、システム全体の強度になる</b>';
      return h;
    },{init:2});
  };

  /* ---------- 02: STRIDE ---------- */
  REG.stride=function(el){
    head(el,"STRIDE","信頼境界ごとに 6 分類を機械的に当てる");
    var S=[
      {k:"S",n:"Spoofing",c:"--alias",jp:"なりすまし",prop:"認証 (Authentication)",
       ex:["偽のデバイスがクラウドに接続する","偽のサーバに機器が接続する（中間者）","他人の機器 ID を名乗る","BLE で正規スマホになりすます"],
       def:["機器固有の秘密鍵と証明書（12 章）","TLS 相互認証（16 章）","ID は「秘密鍵の所持」で証明する（12 章）"],w:"最重要"},
      {k:"T",n:"Tampering",c:"--alias",jp:"改ざん",prop:"完全性 (Integrity)",
       ex:["ファームウェアの書き換え","外付けフラッシュの内容の差し替え","設定値・センサ値の偽装","通信内容の改変"],
       def:["セキュアブート（05 章）","セキュア OTA + ロールバック防止（13 章）","AEAD による通信保護（08・16 章）"],w:"最重要"},
      {k:"R",n:"Repudiation",c:"--muted",jp:"否認",prop:"否認防止",
       ex:["「その操作はしていない」と主張される","ログの改ざん・削除"],
       def:["署名付きログ","アテステーション（04 章）","改ざん検出可能な保存"],w:"用途による"},
      {k:"I",n:"Information Disclosure",c:"--alias",jp:"情報漏洩",prop:"機密性 (Confidentiality)",
       ex:["秘密鍵の抽出","ユーザデータの読み出し","通信の盗聴","サイドチャネルからの漏洩"],
       def:["鍵の保管と不可視化（06 章）","フラッシュ暗号化（06 章）","TLS（16 章）","DPA 対策（09 章）"],w:"最重要"},
      {k:"D",n:"Denial of Service",c:"--blue",jp:"サービス妨害",prop:"可用性 (Availability)",
       ex:["電池枯渇攻撃（無意味な通信を送り続ける）","フラッシュ書き換え回数の消費","ブートループの誘発","証明書期限切れによる一斉停止"],
       def:["レート制限","ウォッチドッグとフェイルセーフ","A/B 面による復旧（13 章）","時刻・証明書の運用設計（14・16 章）"],w:"見落とされやすい"},
      {k:"E",n:"Elevation of Privilege",c:"--signal",jp:"権限昇格",prop:"認可 (Authorization)",
       ex:["Non-secure から Secure への越境","一般権限から管理者権限へ","Confused Deputy（Secure 側に自分のメモリを読ませる）"],
       def:["TrustZone による分離（07 章）","ポインタ検証（07 章）","MPU による特権分離"],w:"分離があれば緩和"}
    ];
    var out=readout(el);
    picker(el,S,function(s){
      var h='<div style="display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;margin-bottom:.5rem">'+
        '<span style="font-family:var(--mono);font-size:1.5rem;font-weight:800;color:var('+s.c+')">'+s.k+'</span>'+
        '<b style="font-size:1rem">'+s.n+'</b>'+
        '<span style="color:var(--muted)">'+s.jp+'</span></div>';
      h+='<div style="color:var(--muted);margin-bottom:.5rem">破られる性質: <b>'+s.prop+'</b>'+
         ' ／ IoT での重み: <b style="color:var('+s.c+')">'+s.w+'</b></div>';
      h+=blk("IoT での具体例",ul(s.ex.map(esc)),"--alias");
      h+=blk("主な対策",ul(s.def.map(esc)),"--signal");
      out.innerHTML='IoT では <b>S・T・I が支配的</b>で、しかも<b class="warn">連鎖する</b>: '+
        '秘密鍵が漏れる（I）→ なりすませる（S）→ 偽ファームウェアを送れる（T）'+
        ' ／ 逆に言えば <b class="ok">「鍵をハードウェアから出さない」という 1 つの対策が、3 つの脅威に同時に効く</b>（06 章）'+
        ' ／ 脅威は<b>信頼境界をまたぐところ</b>で発生する。境界を数えると対策の抜けが見える';
      return h;
    },{init:1});
  };

  /* ---------- 02: 攻撃者クラス ---------- */
  REG.attacker=function(el){
    head(el,"Attacker Classes","「誰から守るか」を決めないと設計できない");
    var A=[
      {k:1,n:"クラス 1 好奇心",c:"--blue",budget:1,motive:"遊び・学習",
       cap:"ネット上の情報とツール",cost:"〜1 万円",
       atk:["デフォルトパスワード","既知 CVE の悪用","UART コンソール"],
       need:["デフォルトパスワードの廃止","不要サービスの削除","UART の無効化","脆弱性の更新"],
       prod:"すべての製品が最低限これに耐えるべき"},
      {k:2,n:"クラス 2 愛好家",c:"--blue",budget:2,motive:"機能解放・自作・改造",
       cap:"電子工作、逆アセンブル、公開ツール",cost:"〜10 万円",
       atk:["SWD/JTAG でのダンプ","外付けフラッシュの読み出し","簡単な電圧グリッチ"],
       need:["デバッグ無効化","フラッシュ暗号化","読み出し保護","ファームウェアに秘密を埋めない"],
       prod:"一般消費者向け IoT（照明・家電）はここまで"},
      {k:3,n:"クラス 3 犯罪者",c:"--alias",budget:3,motive:"金銭。★ 規模を求める",
       cap:"手法を買う・雇う。自動化する",cost:"〜100 万円",
       atk:["大量デバイスの乗っ取り","認証情報の窃取","ボットネット化","1 台の解析結果の横展開"],
       need:["★ 機器ごとに違う鍵（これが決定打）","セキュアブート","セキュア OTA","分離（TrustZone）"],
       prod:"スマートロック・防犯カメラ・ゲートウェイ"},
      {k:4,n:"クラス 4 競合・専門ラボ",c:"--alias",budget:4,motive:"模倣・IP 窃取・不正解錠",
       cap:"専門ラボに委託できる。物理攻撃",cost:"〜1000 万円",
       atk:["DPA / 電磁解析","高精度フォールト注入","チップ開封とプロービング"],
       need:["DPA 対策済み暗号エンジン","フォールト耐性のある保護","PUF","セキュアエレメント","第三者認証"],
       prod:"決済端末・電力メータ・自動車・医療機器"},
      {k:5,n:"クラス 5 国家規模",c:"--alias",budget:5,motive:"諜報・破壊工作",
       cap:"ほぼ無制限。ゼロデイを保有。サプライチェーンに介入できる",cost:"無制限",
       atk:["FIB・レーザー","サプライチェーン汚染","未公開の脆弱性"],
       need:["上記すべて + 多層防御 + 検知と対応の体制","そもそも「完全な防御」は成立しない前提で設計する"],
       prod:"重要インフラ・防衛"}
    ];
    var out=readout(el);
    picker(el,A,function(a){
      var h=meter("攻撃能力",a.budget,5,a.c)+
        '<div style="display:flex;gap:1.2rem;flex-wrap:wrap;margin:.5rem 0;font-size:.82rem">'+
        '<span style="color:var(--muted)">動機 <b>'+esc(a.motive)+'</b></span>'+
        '<span style="color:var(--muted)">予算 <b style="color:var('+a.c+')">'+a.cost+'</b></span></div>'+
        '<div style="color:var(--muted);margin-bottom:.5rem">能力: '+esc(a.cap)+'</div>';
      h+=blk("典型的な攻撃",ul(a.atk.map(esc)),"--alias");
      h+=blk("この相手に必要な対策",ul(a.need.map(esc)),"--signal");
      h+=blk("この線を引くべき製品",'<div>'+esc(a.prod)+'</div>',"--blue");
      out.innerHTML=(a.k===3
        ? '<b class="warn">クラス 3 の性質を理解することが最も重要である。</b>犯罪者は<b>規模</b>を求める。1 台を苦労して破っても金にならない'+
          ' ／ <b class="ok">「機器ごとに違う鍵」を使うだけで、この攻撃の経済性が崩壊する</b>（12 章）。'+
          '高価なハードウェアより先に、この設計をすること'
        : (a.k<=2
          ? '<b class="ok">この水準は、追加の部品コストなしで防げる</b>。設定とビルド構成の見直しが中心（11 章のチェックリスト）'
          : '<span class="warn">この水準を想定するなら、SoC 選定の段階で物理攻撃対策が要る</span>（09・10 章）。'+
            '第三者評価（PSA L3 / SESIP 4 / CC AVA_VAN.4 以上）の取得状況で判断する（03 章）'))+
        ' ／ <b>製品カテゴリごとに線を引き、受容するリスクを明記すること</b>';
      return h;
    },{init:2});
  };

  /* ---------- 03: 規制の判定 ---------- */
  REG.regmap=function(el){
    head(el,"Regulations","販売地域と製品カテゴリで決まる");
    var row=ctrls(el);
    var cEU=checkbox(row,"EU で販売する",true);
    var cUK=checkbox(row,"英国で販売する",false);
    var cUS=checkbox(row,"米国で販売する",false);
    var row2=ctrls(el);
    var cRadio=checkbox(row2,"無線（Wi-Fi / BLE / セルラー等）を搭載する",true);
    var cConsumer=checkbox(row2,"消費者向け製品である",true);
    var sInd=select(row2,"分野",["一般 IoT","産業制御 (OT)","自動車","医療機器"]);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var R=[];
      if(cEU.checked){
        R.push({n:"EU Cyber Resilience Act (CRA)",when:"主要義務 2027 年 12 月／報告義務 2026 年 9 月",
          w:"リスク評価・既知脆弱性なしで出荷・サポート期間中の更新提供・SBOM・脆弱性の届出",
          lv:"必須",ch:"03・13・15 章"});
        if(cRadio.checked)R.push({n:"EU RED 委任規則 2022/30（EN 18031）",when:"2025 年 8 月 1 日〜",
          w:"ネットワーク保護 / プライバシー保護 / 不正取引の防止（第 3 条 3 項 d・e・f）",
          lv:"必須（無線機器）",ch:"03・16 章"});
      }
      if(cUK.checked)R.push({n:"UK PSTI Act",when:"2024 年 4 月 29 日〜",
        w:"①共通デフォルトパスワードの禁止 ②脆弱性報告窓口の公開 ③更新提供期間の明示",
        lv:cConsumer.checked?"必須":"消費者向けのみ",ch:"03・15 章"});
      if(cUS.checked)R.push({n:"US Cyber Trust Mark（NIST IR 8425）",when:"運用開始済み",
        w:"消費者向け IoT のラベリング。任意だが小売の要求になりうる",lv:"任意",ch:"03 章"});
      var ind=+sInd.value;
      if(ind===1)R.push({n:"IEC 62443（4-1 / 4-2）",when:"—",
        w:"4-1: セキュア開発ライフサイクル（組織）／ 4-2: コンポーネント要求（製品）。SL1〜SL4",
        lv:"事実上必須",ch:"03・15 章"});
      if(ind===2)R.push({n:"UNECE R155 / R156、ISO/SAE 21434",when:"—",
        w:"CSMS（サイバーセキュリティ管理システム）と SUMS（ソフト更新管理）。型式認証の要件",
        lv:"必須",ch:"03 章"});
      if(ind===3)R.push({n:"FDA サイバーセキュリティガイダンス、IEC 81001-5-1",when:"—",
        w:"市販前申請に SBOM と脆弱性管理計画。市販後の監視",lv:"必須（米国）",ch:"03・15 章"});
      R.push({n:"ETSI EN 303 645（+ TS 103 701）",when:"—",
        w:"世界共通のベースライン 13 項目。上記の多くが参照する",lv:"事実上の前提",ch:"03 章"});
      out2.innerHTML=tbl(["規制・標準","適用時期","主な要求","位置づけ","章"],
        R.map(function(r){return ['<b>'+esc(r.n)+'</b>',esc(r.when),esc(r.w),
          '<b class="'+(r.lv.indexOf("必須")>=0?"warn":"")+'">'+esc(r.lv)+'</b>',esc(r.ch)];}));
      var hard=R.filter(function(r){return r.lv.indexOf("必須")>=0;}).length;
      out.innerHTML='該当する規制・標準 <b>'+R.length+'</b> 件（うち必須級 <b class="warn">'+hard+'</b> 件）'+
        ' ／ '+(cEU.checked&&cRadio.checked
          ? '<b class="warn">無線機器を EU で売るなら、RED 委任規則（2025 年 8 月〜）が最初の関門である</b>。CRA より先に効く'
          : '')+
        ' ／ <b>まず ETSI EN 303 645 の 13 項目を自己点検すること。</b>'+
        '★1 つの項目（デフォルトパスワード廃止・報告窓口・攻撃面の削減）は設計判断だけで達成でき、費用対効果が圧倒的に高い'+
        ' ／ <span class="warn">適用日は変わりうる。必ず規則本文と所管当局の最新情報で確認すること</span>';
    }
    [cEU,cUK,cUS,cRadio,cConsumer].forEach(function(c){c.addEventListener("change",draw);});
    sInd.addEventListener("change",draw);
    reg(null,draw);draw();
  };

  /* ---------- 04: RoT の階層 ---------- */
  REG.rot=function(el){
    head(el,"Root of Trust","検証できないものを、小さく、不変にする");
    var L=[
      {n:"ハードウェア RoT",c:"--alias",sz:"回路",
       what:"暗号エンジン、TRNG、OTP、ライフサイクル制御",
       trust:"シリコンそのもの。検証する手段がない",
       give:"改変不可能な基盤。鍵の物理的な保管先",
       weak:"物理攻撃（開封・プロービング・グリッチ）。シリコンのバグは修正できない",ch:"06・08・10 章"},
      {n:"Immutable RoT（ブート ROM）",c:"--alias",sz:"数 KB",
       what:"OTP の ROTPK ハッシュを読み、次段の署名を検証するだけ",
       trust:"マスク ROM に焼かれている。書き換え不可",
       give:"最初の 1 回の検証。ここから信頼の連鎖が始まる",
       weak:"★ バグがあっても直せない。使う署名アルゴリズムを変えられない",ch:"04・05 章"},
      {n:"Updatable RoT",c:"--signal",sz:"数十〜数百 KB",
       what:"本格的な検証、鍵管理、暗号サービス、アテステーション、OTA 制御",
       trust:"Immutable RoT が署名を検証した",
       give:"★ 暗号アジリティ。アルゴリズムを後から変えられる",
       weak:"大きいのでバグが入りうる。ただし OTA で修正できる",ch:"04・13・17 章"},
      {n:"セキュア側ファームウェア（SPE）",c:"--signal",sz:"数十〜百数十 KB",
       what:"TF-M など。Crypto / ITS / PS / Attestation / Firmware Update",
       trust:"Updatable RoT が検証した",
       give:"鍵を「使えるが読めない」形で提供する（PSA Crypto API）",
       weak:"★ ここにバグがあると分離が無効化される。小さく保つこと",ch:"07・17 章"},
      {n:"非セキュア側（NSPE）",c:"--blue",sz:"数百 KB〜",
       what:"アプリケーション、RTOS、TCP/IP、BLE スタック",
       trust:"SPE が検証した（が、脆弱性は前提とする）",
       give:"製品の機能",
       weak:"★ 脆弱性はここに必ずある。だから分離が要る",ch:"07・15 章"}
    ];
    var out=readout(el);
    picker(el,L,function(x,i){
      var h='<div style="display:flex;gap:.7rem;align-items:baseline;flex-wrap:wrap;margin-bottom:.5rem">'+
        '<b style="color:var('+x.c+');font-size:1rem">'+esc(x.n)+'</b>'+
        '<span style="font-family:var(--mono);font-size:.75rem;color:var(--muted)">規模: '+esc(x.sz)+'</span>'+
        '<span style="font-family:var(--mono);font-size:.75rem;color:var(--muted)">'+esc(x.ch)+'</span></div>';
      h+=tbl(["観点","内容"],[
        ["この層にあるもの",esc(x.what)],
        ["なぜ信じられるか",esc(x.trust)],
        ["上の層に与えるもの",esc(x.give)],
        ["弱点",'<span class="warn">'+esc(x.weak)+'</span>']
      ]);
      /* 階層の図 */
      var fig='<div style="margin-top:.6rem;display:flex;flex-direction:column-reverse;gap:.18rem">';
      L.forEach(function(y,j){
        var on=(j===i);
        fig+='<div style="padding:.3rem .6rem;border-radius:6px;font-size:.8rem;'+
          'background:'+(on?"var("+x.c+")":"var(--panel)")+';color:'+(on?"#fff":"var(--muted)")+';'+
          'border:1px solid var('+(on?x.c:"--line")+')">'+
          (j===0?"⤓ ":"")+esc(y.n)+'</div>';
      });
      fig+='<div style="color:var(--faint);font-size:.75rem;text-align:center">下ほど信頼の根に近い</div></div>';
      out.innerHTML=(i<=1
        ? '<b class="warn">この層は検証できない。</b>だから <b>①改変できない ②できるだけ小さい</b> ことが必要になる'
        : '<b class="ok">この層は下の層に検証されている。</b>だからバグがあっても、原理的には更新で直せる')+
        ' ／ 2 段構成（Immutable + Updatable）にすることで、'+
        '<b>「変えられない部分を最小にしつつ、アルゴリズムは更新できる」</b>を両立している'+
        ' ／ <span class="warn">RoT は「正規に署名された脆弱なファームウェア」を止めない</span>。完全性 ≠ 安全性（15 章）';
      return h+fig;
    },{init:1,small:true});
  };

  /* ---------- 04: 鍵の階層 ---------- */
  REG.keyhier=function(el){
    head(el,"Key Hierarchy","OTP は貴重。派生と公開鍵ハッシュで節約する");
    var K=[
      {n:"ROTPK ハッシュ",c:"--blue",loc:"OTP / eFuse",sz:"32 B",secret:false,
       use:"セキュアブートの署名検証（05 章）",
       why:"公開鍵そのもの（RSA-3072 なら 384 B）ではなく、ハッシュだけを焼く。OTP を 1/12 に節約",
       leak:"<b class=\"ok\">問題なし</b>。公開情報である",
       note:"★ 複数スロットと失効機構があるか確認する（12 章）"},
      {n:"HUK（Hardware Unique Key）",c:"--alias",loc:"OTP または PUF",sz:"16〜32 B",secret:true,
       use:"すべての対称鍵の根。KDF で派生させる",
       why:"1 個だけ持てばよい。他の鍵はこれでラップして通常のフラッシュに置ける（06 章）",
       leak:"<span class=\"warn\">その機器のすべての保護が崩れる</span>",
       note:"★ CPU から読めない構成にすること。暗号エンジンだけが専用配線で読む"},
      {n:"派生鍵（ストレージ暗号鍵など）",c:"--signal",loc:"フラッシュ（ラップ済み）",sz:"任意",secret:true,
       use:"ユーザデータ・NVS の暗号化、用途別の鍵",
       why:"HUK から KDF で派生。または HUK でラップして保存。OTP を消費しない",
       leak:"<span class=\"warn\">その用途のデータが漏れる</span>。他の鍵は無事",
       note:"暗号消去（14 章）にも使える。データを消さず鍵だけ消す"},
      {n:"デバイス秘密鍵（DevID / IAK）",c:"--alias",loc:"SE / ラップ済み / DS ペリフェラル",sz:"32 B（P-256）",secret:true,
       use:"機器の身元証明。TLS クライアント認証、アテステーション（12 章）",
       why:"★ 機器ごとに違う値。これが「1 台破っても全台は破れない」の根拠",
       leak:"<span class=\"warn\">その 1 台になりすませる</span>（全台ではない）",
       note:"★ 理想はチップ内生成（外に出さない）。次点は事前プロビジョニング済み SE"},
      {n:"セッション鍵",c:"--blue",loc:"RAM のみ",sz:"16〜32 B",secret:true,
       use:"TLS のレコード暗号、大量データの暗号化",
       why:"毎回作り直す。長期保存しない",
       leak:"そのセッションのみ。<b class=\"ok\">前方秘匿性があれば過去は守られる</b>",
       note:"使用後は必ず zeroize する（08 章）。memset は最適化で消える"},
      {n:"ファームウェア署名の秘密鍵",c:"--alias",loc:"★ 機器には置かない。HSM のみ",sz:"—",secret:true,
       use:"OTA イメージへの署名（13 章）",
       why:"機器が持つ必要はまったくない。機器は公開鍵で検証するだけ",
       leak:"<span class=\"warn\">最悪の事態。攻撃者が正規のファームウェアを作れる</span>",
       note:"★ オフライン HSM に置く。CI の署名ジョブから承認つきで使う（12・13 章）"}
    ];
    var out=readout(el);
    picker(el,K,function(k){
      var h='<div style="display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem;font-size:.82rem">'+
        '<span style="color:var(--muted)">保管先 <b style="color:var('+k.c+')">'+esc(k.loc)+'</b></span>'+
        '<span style="color:var(--muted)">サイズ <b>'+esc(k.sz)+'</b></span>'+
        '<span style="color:var(--muted)">秘密か <b class="'+(k.secret?"warn":"ok")+'">'+
        (k.secret?"はい（秘密鍵）":"いいえ（公開情報）")+'</b></span></div>';
      h+=tbl(["観点","内容"],[
        ["用途",esc(k.use)],
        ["なぜこの形か",esc(k.why)],
        ["漏洩したら",k.leak],
        ["設計上の注意",esc(k.note)]
      ]);
      out.innerHTML=(k.secret
        ? '<b>秘密鍵は、可能な限り CPU に見せない。</b>暗号エンジンだけが読める鍵スロット、'+
          '鍵ラッピング、PUF、DS ペリフェラル、セキュアエレメント——手段は複数ある（06・20・22 章）'
        : '<b class="ok">公開情報なので、漏れても攻撃に使えない。</b>全機器で同じ値でよい')+
        ' ／ OTP は数百 B〜数 KB しかない。<b>OTP に焼くのは「ROTPK ハッシュ・HUK・ライフサイクル状態・単調カウンタ」に絞る</b>'+
        ' ／ 残りは <b>HUK から派生させるか、HUK でラップしてフラッシュに置く</b>';
      return h;
    },{init:1,small:true});
  };

  /* ---------- 05: セキュアブート ---------- */
  REG.secureboot=function(el){
    head(el,"Secure Boot","検証してから実行、を繰り返す");
    var ST=[
      {n:"① ヘッダの検証",ok:"マジック番号・サイズ・ロードアドレスが妥当",
       ng:"不正なイメージ形式。停止",
       note:"★ サイズフィールドを信じてバッファに使わないこと。上限を固定値で検査してから使う",crit:false},
      {n:"② 公開鍵の照合",ok:"イメージに添付された公開鍵をハッシュし、OTP の ROTPK ハッシュと一致",
       ng:"★ 攻撃者の鍵。停止",
       note:"★★ ここを飛ばすと署名検証が完全に無意味になる。攻撃者は自分の鍵ペアで署名して添付すればよい",crit:true},
      {n:"③ ハッシュの計算",ok:"ヘッダ + ペイロード全体の SHA-256 を計算",
       ng:"—",
       note:"★ ヘッダも署名対象に含めること。含めないとロードアドレスを書き換えられる",crit:false},
      {n:"④ 署名の検証",ok:"公開鍵とハッシュで署名を検証",
       ng:"改ざんまたは偽造。停止",
       note:"★ ハードウェアアクセラレータの有無で 10 倍以上の差（08 章）。毎起動に走ることを忘れない",crit:true},
      {n:"⑤ SVN の確認",ok:"イメージの SVN ≥ デバイスの単調カウンタ",
       ng:"★ ロールバック攻撃。停止",
       note:"★★ 署名検証だけでは古い脆弱な版を防げない。正規に署名されているので通ってしまう（13 章）",crit:true},
      {n:"⑥ 実行",ok:"次段へジャンプ",
       ng:"—",
       note:"★ 検証と実行の間に書き換えられないよう、検証後にメモリを保護する（TOCTOU、04 章）",crit:false}
    ];
    var row=ctrls(el);
    var ss=slider(row,"ステップ",1,6,2,1);
    var sk=select(row,"このステップを",["正しく実装する","★ 省略する（実装ミス）"]);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var k=+ss.input.value-1,skip=(+sk.value===1);
      ss.val.textContent=(k+1)+" / 6";
      var h='<div style="display:flex;flex-direction:column;gap:.22rem">';
      ST.forEach(function(s,i){
        var cur=(i===k),done=(i<k);
        var bad=(cur&&skip);
        h+='<div style="padding:.34rem .6rem;border-radius:6px;'+
          (bad?'background:var(--alias);color:#fff'
             :(cur?'background:var(--signal);color:#fff'
                 :(done?'background:var(--signal-soft)':'opacity:.34')))+'">'+
          '<b>'+esc(s.n)+'</b>'+
          (cur?'<div style="color:rgba(255,255,255,.9);font-size:.86em">'+
              (bad?'✗ 省略された':'✓ '+esc(s.ok))+'</div>':'')+
          '</div>';
      });
      h+='</div>';
      h+='<div style="margin-top:.6rem;color:var(--muted)">実装上の注意</div>'+
         '<div style="line-height:1.65">'+esc(ST[k].note)+'</div>';
      out2.innerHTML=h;
      out.innerHTML=(skip
        ? (ST[k].crit
          ? '<span class="warn">★ このステップの省略は致命的である。</span>'+
            (k===1?'攻撃者は自分の鍵ペアを作り、自分の秘密鍵で署名し、自分の公開鍵を添付すればよい。<b>セキュアブートが完全に無効になる</b>'
             :(k===3?'署名を一切検証しないので、任意のファームウェアが起動する'
                    :'<b>正規に署名された古い脆弱なバージョンに戻される</b>。修正した脆弱性が復活する'))
          : '<span class="warn">このステップの省略も危険である。</span>'+esc(ST[k].note))
        : '<b class="ok">正しく実装されている。</b>'+esc(ST[k].ok))+
        ' ／ <b class="warn">検証の分岐はフォールト耐性を持たせること</b>（10 章）: '+
        'デフォルトを失敗に、二重検証、ハミング距離の大きい成功値、CFI カウンタ'+
        ' ／ <b>自作せず MCUboot などを使うこと。</b>罠が多すぎる';
    }
    ss.input.addEventListener("input",draw);sk.addEventListener("change",draw);
    reg(null,draw);draw();
  };

  /* ---------- 06: 鍵の保管方式 ---------- */
  REG.keystore=function(el){
    head(el,"Key Storage","どこまでの攻撃者に耐えるか");
    var M=[
      {n:"ソースにハードコード",c:"--alias",lv:0,
       d:"ファームウェアのバイナリに直接埋め込む",
       pro:["実装が最も簡単"],
       con:["★ strings で出る","Git に残る","★ 全台同じ鍵になる","規制で明示的に禁止（EN 303 645 / PSTI）"],
       max:"守れない"},
      {n:"通常のフラッシュ",c:"--alias",lv:1,
       d:"内部フラッシュの領域に平文で置く",
       pro:["書き換えられる"],
       con:["SWD で読める","フラッシュを剥がせば読める","RAM にも平文が乗る"],
       max:"クラス 0（誰でも取れる）"},
      {n:"読み出し保護つきフラッシュ",c:"--signal",lv:2,
       d:"RDP / CRP などでデバッガからの読み出しを禁止する",
       pro:["デバッガでは読めない","追加コストなし"],
       con:["★ 電圧グリッチによる突破の実例がある（10 章）","CPU が読むので、脆弱性で漏れる"],
       max:"クラス 1〜2"},
      {n:"OTP / eFuse + 鍵スロット",c:"--signal",lv:3,
       d:"OTP に焼き、暗号エンジンだけが専用配線で読む。CPU からは見えない",
       pro:["★ CPU バスに平文が出ない","ソフトウェア脆弱性で漏れない"],
       con:["OTP は小容量（数百 B〜数 KB）","書き換え不可","物理攻撃には限界"],
       max:"クラス 2〜3"},
      {n:"鍵ラッピング（HUK で暗号化）",c:"--signal",lv:3,
       d:"HUK 1 個で無数の鍵を暗号化し、通常のフラッシュに保存する",
       pro:["★ OTP を節約できる","★ 鍵がチップに縛られる（クローン対策）","平文が CPU に出ない"],
       con:["HUK が破られたら全部","実装がベンダ固有"],
       max:"クラス 2〜3"},
      {n:"PUF から導出",c:"--blue",lv:4,
       d:"製造ばらつきから鍵を再構成する。電源が切れると鍵はどこにも存在しない",
       pro:["★ 鍵が保存されていない","★ 開封すると特性が変わって壊れる","OTP を消費しない"],
       con:["エンロールメント工程が要る","ヘルパーデータの管理","経年劣化・温度依存","起動時間が伸びる"],
       max:"クラス 3〜4"},
      {n:"セキュアエレメント（外付け）",c:"--blue",lv:5,
       d:"独立した耐タンパチップ。CC EAL6+ / AVA_VAN.5 の評価を受けたものがある",
       pro:["★ 物理攻撃対策が設計の前提","★ プロビジョニング済み品が買える（12 章）","第三者評価済み"],
       con:["BOM コスト増","遅い（I2C 経由）","I2C バスの中間者対策が別途要る","供給の長期安定性"],
       max:"クラス 4〜5"}
    ];
    var out=readout(el);
    picker(el,M,function(m){
      var h='<div style="line-height:1.7;margin-bottom:.4rem">'+esc(m.d)+'</div>';
      h+=meter("守れる水準",m.lv,5,m.c);
      h+='<div style="color:var(--muted);font-size:.8rem;margin:.2rem 0 .5rem">耐えられる攻撃者: <b style="color:var('+m.c+')">'+esc(m.max)+'</b></div>';
      h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.6rem">'+
        blk("長所",ul(m.pro.map(esc)),"--signal")+
        blk("短所・制約",ul(m.con.map(esc)),"--alias")+'</div>';
      out.innerHTML=(m.lv<=1
        ? '<span class="warn">この方式は使ってはいけない。</span>ETSI EN 303 645 の規定 4 と UK PSTI が明示的に禁止している'
        : (m.lv>=4
          ? '<b class="ok">物理攻撃を想定するなら、この水準が要る。</b>ただし<b>「めったに使わないが絶対に漏れてはいけない鍵」だけ</b>を置くこと。'+
            'セッション鍵や大量データの暗号化は MCU の暗号エンジンで行う（22 章）'
          : '<b>多くの一般 IoT 製品にとって、この水準が現実的な線である。</b>'+
            'これに<b class="ok">「機器ごとに違う鍵」</b>を組み合わせれば、クラス 3 の大量攻撃は経済的に成立しなくなる（12 章）'))+
        ' ／ <b>鍵の生成場所も重要である</b>: チップ内生成（最も安全）＞ HSM から注入 ＞ 開発 PC で生成（危険）';
      return h;
    },{init:3,small:true});
  };

  /* ---------- 07: TrustZone のメモリ分割 ---------- */
  REG.trustzone=function(el){
    head(el,"TrustZone-M","越境の入口は NSC の SG 命令だけ");
    var cv=screen(el,236),cc=cctx(cv);
    var row=ctrls(el);
    var sfrom=select(row,"アクセス元",["Non-secure のコード","Secure のコード","DMA（分離設定なし）","DMA（Secure に割当）"]);
    var sto=select(row,"アクセス先",["Non-secure フラッシュ","Secure フラッシュ（鍵あり）","NSC 領域","Non-secure SRAM","Secure SRAM","Secure 周辺（暗号エンジン）"]);
    var skind=select(row,"アクセスの種類",["データ読み書き","命令フェッチ（分岐）"]);
    var out=readout(el);
    var REGIONS=[
      {n:"Non-secure フラッシュ",a:"NS",y:0},
      {n:"NSC（Non-secure Callable）",a:"NSC",y:1},
      {n:"Secure フラッシュ（鍵・RoT）",a:"S",y:2},
      {n:"Non-secure SRAM",a:"NS",y:3},
      {n:"Secure SRAM",a:"S",y:4},
      {n:"Secure 周辺（暗号エンジン）",a:"S",y:5}
    ];
    var MAP=[0,2,1,3,4,5];
    function draw(){
      var from=+sfrom.value,to=MAP[+sto.value],kind=+skind.value;
      var tgt=REGIONS[to];
      var allowed,why;
      if(from===1){ allowed=true; why="Secure 状態は Secure と Non-secure の両方にアクセスできる"; }
      else if(from===2){ /* DMA 分離なし */
        allowed=(tgt.a!=="S")||true;
        if(tgt.a==="S"){allowed=true;why="★ DMA が分離されていないと、TrustZone を素通りして Secure メモリを読める";}
        else {allowed=true;why="Non-secure 領域へのアクセス。問題なし";}
      }
      else if(from===3){ allowed=(true); why="DMA を Secure に割り当てた場合。バスフィルタが正しく設定されていれば、Non-secure からは制御できない"; }
      else { /* Non-secure コード */
        if(tgt.a==="NS"){allowed=true;why="Non-secure 領域へのアクセス。許可される";}
        else if(tgt.a==="NSC"){
          if(kind===1){allowed=true;why="★ NSC 領域への分岐は、飛び先の最初の命令が SG である場合にのみ許可される";}
          else {allowed=false;why="NSC 領域はデータとしては読めない。命令フェッチ（分岐）のみ";}
        }
        else {allowed=false;why="★ Secure 領域へのアクセスは SecureFault になる。これが分離の本体";}
      }
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=18,padR=18,y0=44,rh=Math.min(30,(h-y0-16)/REGIONS.length);
      lab(ctx,"メモリマップ（SAU / IDAU + ベンダのメモリ保護コントローラで属性が決まる）",
          padL,20,C("--muted"),"left",10.5);
      var COL={S:"--alias",NSC:"--signal",NS:"--blue"};
      REGIONS.forEach(function(r,i){
        var y=y0+i*rh,cur=(i===to);
        var col=C(COL[r.a]);
        ctx.fillStyle=cur?col:C("--screen");
        rrect(ctx,padL,y,w-padL-padR,rh-6,6);ctx.fill();
        ctx.strokeStyle=cur?col:C("--line");ctx.lineWidth=cur?1.8:1;
        rrect(ctx,padL,y,w-padL-padR,rh-6,6);ctx.stroke();
        lab(ctx,r.n,padL+10,y+(rh-6)/2+4,cur?"#fff":C("--muted"),"left",10.5);
        lab(ctx,r.a,w-padR-14,y+(rh-6)/2+4,cur?"#fff":C("--faint"),"right",10);
      });
      /* アクセス矢印 */
      var ty=y0+to*rh+(rh-6)/2;
      ctx.strokeStyle=allowed?C("--signal"):C("--alias");ctx.lineWidth=2.4;
      if(!allowed)ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(padL-2,ty);ctx.lineTo(padL-2,ty);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,allowed?"✓ 許可":"✗ Fault",w/2,h-6,allowed?C("--signal"):C("--alias"),"center",12);
      out.innerHTML='<b class="'+(allowed?"ok":"warn")+'">'+(allowed?"アクセス許可":"SecureFault")+'</b> ／ '+esc(why)+
        (from===2&&tgt.a==="S"
          ? ' ／ <b class="warn">CPU を分離しても、DMA が分離されていなければ意味がない。</b>'+
            'ST の GTZC、Nordic の SPU、NXP の AHB Secure Controller などで、バスマスタごとに属性を設定する必要がある'
          : '')+
        (from===0&&tgt.a==="S"
          ? ' ／ ただし <b class="warn">Confused Deputy 攻撃</b>に注意: Non-secure が「この Secure アドレスの内容を署名して」と'+
            '依頼した場合、Secure 側が検証を忘れると自分で読んで返してしまう。'+
            '<code>cmse_check_address_range()</code> による<b>ポインタ検証が必須</b>（07 章）'
          : '')+
        ' ／ <b>Secure 側は小さく保つこと。</b>入力を解析するコード（TCP/IP・JSON パーサ）を入れない';
    }
    [sfrom,sto,skind].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);
  };

  /* ---------- 08: 乱数の品質 ---------- */
  REG.trng=function(el){
    head(el,"Entropy","鍵空間はエントロピーで決まる");
    var cv=screen(el,178),cc=cctx(cv);
    var row=ctrls(el);
    var sbits=slider(row,"鍵長（bit）",64,256,128,8);
    var sent=slider(row,"1 bit あたりの min-entropy",0.05,1,1,0.05);
    var ssrc=select(row,"エントロピー源",
      ["ハードウェア TRNG（SP 800-90B 準拠）","ADC のノイズを読んだだけ","時刻をシードにした PRNG","起動直後・エントロピー枯渇"]);
    var out=readout(el);
    var PRESET=[1.0,0.35,0.0001,0.12];
    function draw(){
      var bits=+sbits.input.value;
      var src=+ssrc.value;
      var e=(src===0)?+sent.input.value:PRESET[src];
      if(src!==0){sent.input.value=Math.max(0.05,Math.min(1,e));}
      sbits.val.textContent=bits+" bit";
      sent.val.textContent=f(e,2);
      var eff=Math.max(0.5,bits*e);
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      /* 対数スケールのバー */
      var padL=18,padR=18,BW=w-padL-padR;
      var maxb=256;
      lab(ctx,"実効的な鍵空間（bit）",padL,20,C("--muted"),"left",11);
      var y=36,bh=34;
      ctx.fillStyle=C("--screen");rrect(ctx,padL,y,BW,bh,6);ctx.fill();
      var pw=BW*Math.min(1,eff/maxb);
      var col=eff>=112?C("--signal"):(eff>=64?C("--blue"):C("--alias"));
      ctx.fillStyle=col;rrect(ctx,padL,y,Math.max(3,pw),bh,6);ctx.fill();
      ctx.strokeStyle=C("--line");ctx.lineWidth=1.2;rrect(ctx,padL,y,BW,bh,6);ctx.stroke();
      lab(ctx,f(eff,1)+" bit",padL+Math.max(3,pw)+8,y+bh/2+4,col,"left",12);
      /* 目安ライン */
      [[64,"64: 破られる",0],[112,"112: 最低限",1],[128,"128: 現在の標準",0],[256,"256",1]].forEach(function(t){
        var x=padL+BW*t[0]/maxb;
        ctx.strokeStyle=C("--faint");ctx.setLineDash([3,3]);ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x,y+bh+6);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,t[1],Math.min(x,w-padR-6),y+bh+(t[2]?32:18),C("--faint"),
            (t[0]===256?"right":"center"),9);
      });
      /* 総当たり時間 */
      var rate=1e12;   /* 1 兆回/秒と仮定 */
      var secs=Math.pow(2,Math.min(eff,300))/rate;
      var t;
      if(secs<60)t=f(secs,2)+" 秒";
      else if(secs<3600)t=f(secs/60,1)+" 分";
      else if(secs<86400)t=f(secs/3600,1)+" 時間";
      else if(secs<3.15e7)t=f(secs/86400,1)+" 日";
      else if(secs<3.15e16)t=f(secs/3.15e7,1)+" 年";
      else t="約 10^"+Math.round(Math.log10(secs/3.15e7))+" 年";
      lab(ctx,"1 兆回/秒で総当たりしたときの時間: "+t,padL,h-12,C("--muted"),"left",11);
      var NM=["ハードウェア TRNG","ADC のノイズ","時刻シードの PRNG","起動直後の枯渇"];
      out.innerHTML='鍵長 '+bits+' bit × min-entropy '+f(e,2)+' = <b class="'+
        (eff>=112?"ok":"warn")+'">実効 '+f(eff,1)+' bit</b>'+
        ' ／ 総当たり時間 <b>'+t+'</b>'+
        ' ／ '+(src===0
          ? '<b class="ok">正しい構成。</b>データシートで「NIST SP 800-90B 準拠」または「AIS 31 PTG.2/PTG.3 準拠」を確認すること'
          : '<span class="warn">'+NM[src]+'では、鍵長を伸ばしても実効的な強度は上がらない。</span>'+
            'DRBG はエントロピーを増幅するだけで、作り出さない')+
        ' ／ <b class="warn">組み込みでは起動直後にエントロピー源がない</b>（マウスもディスク I/O もネットワークもない）。'+
        'ハードウェア TRNG が必須である'+
        ' ／ <b>乱数取得に失敗したら止まる設計にすること。</b>0 で埋まった鍵を使う事故が実際に起きている';
    }
    [sbits,sent].forEach(function(s){s.input.addEventListener("input",draw);});
    ssrc.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 08: アクセラレータの効果 ---------- */
  REG.cryptoperf=function(el){
    head(el,"Crypto Acceleration","公開鍵演算の差が設計を決める");
    var cv=screen(el,172),cc=cctx(cv);
    var row=ctrls(el);
    var sop=select(row,"処理",["ECDSA P-256 署名検証","RSA-2048 署名検証","RSA-2048 署名生成","AES-128 暗号化（1 KB）","SHA-256（1 KB）"]);
    var sf=slider(row,"CPU クロック（MHz）",24,600,100,4);
    var sn=slider(row,"起動時の検証回数（多段ブート）",1,6,3,1);
    var out=readout(el);
    /* 100 MHz Cortex-M4 基準の概算値（ms）。あくまで目安 */
    var OPS=[
      {n:"ECDSA P-256 署名検証",sw:200,hw:6},
      {n:"RSA-2048 署名検証",sw:20,hw:2},
      {n:"RSA-2048 署名生成",sw:800,hw:40},
      {n:"AES-128 暗号化（1 KB）",sw:0.3,hw:0.012},
      {n:"SHA-256（1 KB）",sw:0.15,hw:0.01}
    ];
    function draw(){
      var o=OPS[+sop.value],fq=+sf.input.value,n=+sn.input.value;
      sf.val.textContent=fq+" MHz";sn.val.textContent=n+" 回";
      var scale=100/fq;
      var sw=o.sw*scale, hw=o.hw*scale;   /* HW も一部クロック依存とみなす */
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=140,padR=90,BW=w-padL-padR;
      var mx=Math.max(sw*n,0.01);
      lab(ctx,"起動時の合計時間（検証 "+n+" 回）",padL,20,C("--muted"),"left",11);
      var items=[{n:"ソフトウェア実装",v:sw*n,c:C("--alias")},{n:"ハードウェア支援",v:hw*n,c:C("--signal")}];
      items.forEach(function(it,i){
        var y=34+i*46;
        var bw=BW*it.v/mx;
        ctx.fillStyle=it.c;rrect(ctx,padL,y,Math.max(3,bw),30,5);ctx.fill();
        lab(ctx,it.n,padL-6,y+19,C("--muted"),"right",10.5);
        lab(ctx,f(it.v,it.v<1?3:1)+" ms",padL+Math.max(3,bw)+8,y+19,it.c,"left",11);
      });
      /* 100ms ライン */
      if(mx>100){
        var x100=padL+BW*100/mx;
        ctx.strokeStyle=C("--faint");ctx.setLineDash([4,3]);ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(x100,26);ctx.lineTo(x100,126);ctx.stroke();ctx.setLineDash([]);
        lab(ctx,"100 ms",x100,140,C("--faint"),"center",9.5);
      }
      lab(ctx,"※ 目安の概算値。実測値は実装・コンパイラ・品種で大きく変わる",18,h-8,C("--faint"),"left",9.5);
      var ratio=sw/Math.max(hw,1e-6);
      out.innerHTML=esc(o.n)+' ／ ソフトウェア <b class="warn">'+f(sw,sw<1?3:1)+' ms</b>、'+
        'ハードウェア <b class="ok">'+f(hw,hw<1?3:1)+' ms</b>（<b>約 '+f(ratio,0)+' 倍</b>）'+
        ' ／ 起動時に '+n+' 回検証すると、差は <b>'+f((sw-hw)*n,1)+' ms</b>'+
        ' ／ '+(sw*n>100
          ? '<span class="warn">ソフトウェア実装では起動時間の要件を満たせない可能性がある。</span>'+
            '公開鍵アクセラレータ（PKA / CASPER / SCE など）の有無が SoC 選定を決める'
          : '<b class="ok">この構成なら起動時間への影響は許容範囲</b>')+
        ' ／ <b>電池駆動なら、演算時間はそのまま消費電力になる</b>'+
        ' ／ <span class="warn">「AES がある」と「DPA に耐える AES がある」は別</span>（09 章）。認証レベルで確認すること';
    }
    sop.addEventListener("change",draw);
    [sf,sn].forEach(function(s){s.input.addEventListener("input",draw);});
    reg(cv,draw);
  };

  /* ---------- 09: 電力解析 ---------- */
  REG.dpa=function(el){
    head(el,"Power Analysis","16 バイトを 1 バイトずつ独立に求められる");
    var cv=screen(el,210),cc=cctx(cv);
    var row=ctrls(el);
    var sn=slider(row,"取得した波形の本数",50,20000,2000,50);
    var snoise=slider(row,"ノイズの大きさ（相対）",0.5,20,4,0.5);
    var scm=select(row,"実装の対策",["対策なし","隠蔽のみ（シャッフリング・ランダム遅延）","1 次マスキング","高次マスキング + 隠蔽"]);
    var out=readout(el);
    /* 対策ごとの実効的な信号対雑音比の係数 */
    var CM=[1.0,0.25,0.012,0.0012];
    function draw(){
      var N=+sn.input.value,noise=+snoise.input.value,cm=+scm.value;
      sn.val.textContent=N+" 本";snoise.val.textContent="×"+f(noise,1);
      /* 正しい鍵候補の相関の期待値 ~ k/(noise) ; 推定は sqrt(N) で安定する */
      var rho0=CM[cm]*1.2/noise;
      var rhoTrue=Math.min(0.98,rho0);
      /* 相関の推定誤差 ~ 1/sqrt(N) */
      var se=1/Math.sqrt(Math.max(N,2));
      var wrongPeak=3.0*se;                       /* 誤った候補の最大値の目安 */
      var success=rhoTrue>wrongPeak*1.25;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var ch=chart(cc,0,255,0,Math.max(0.12,Math.max(rhoTrue,wrongPeak)*1.35),{l:46,r:14,t:26,b:34});
      grid(ch,4);
      /* 256 個の鍵候補の相関 */
      var seed=12345;
      function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
      var trueKey=173;
      for(var k=0;k<256;k++){
        var v=(k===trueKey)?rhoTrue:Math.abs(se*(rnd()*2.6-1.3)*2);
        var x=ch.X(k);
        ctx.strokeStyle=(k===trueKey)?C("--alias"):C("--faint");
        ctx.lineWidth=(k===trueKey)?2.4:1;
        ctx.beginPath();ctx.moveTo(x,ch.Y(0));ctx.lineTo(x,ch.Y(v));ctx.stroke();
      }
      axis(ch);
      lab(ch.ctx,"各鍵候補との相関係数 |ρ|",ch.p.l+2,14,C("--muted"),"left",10.5);
      lab(ch.ctx,"鍵バイトの候補 0〜255",ch.w-ch.p.r,14,C("--muted"),"right",10.5);
      lab(ch.ctx,"0",ch.p.l,ch.h-ch.p.b+16,C("--muted"),"left",10);
      lab(ch.ctx,"255",ch.w-ch.p.r,ch.h-ch.p.b+16,C("--muted"),"right",10);
      lab(ch.ctx,f(ch.y1,2),ch.p.l-6,ch.p.t+4,C("--muted"),"right",10);
      if(success)lab(ch.ctx,"正しい鍵 = "+trueKey,ch.X(trueKey)+6,ch.Y(rhoTrue)-6,C("--alias"),"left",10.5);
      var CMN=["対策なし","隠蔽のみ","1 次マスキング","高次マスキング + 隠蔽"];
      out.innerHTML='波形 <b>'+N+'</b> 本 ／ 正しい鍵の相関 <b>'+f(rhoTrue,4)+'</b>、'+
        '誤った候補の最大 <b>'+f(wrongPeak,4)+'</b>'+
        ' ／ '+(success
          ? '<b class="warn">★ 鍵バイトが特定できる。</b>これを 16 回繰り返せば AES-128 の鍵が完全に求まる。'+
            '探索は 256 × 16 = <b>4096 通り</b>（総当たりなら 2^128）'
          : '<b class="ok">この本数では特定できない。</b>相関が誤った候補のノイズに埋もれている')+
        ' ／ 対策「'+CMN[cm]+'」'+(cm===0
          ? '<span class="warn">では、数百〜数千本で破られる。1 秒に数百波形取れるので、数分で集まる</span>'
          : (cm===1
            ? 'は<span class="warn">波形数を増やさせるだけ</span>。波形の位置合わせで無効化されうる。マスキングと併用すること'
            : '<b class="ok">は撹乱によって相関そのものを断つ</b>。ただし正しい実装が極めて難しいので、'+
              'DPA 対策済みのハードウェアエンジン（PSA L3 / SESIP 4 / AVA_VAN.4 以上）を使うこと'))+
        ' ／ <b>プロトコル側で「同じ鍵の使用回数を制限する」のも有効</b>。波形が集まらなければ成立しない';
    }
    [sn,snoise].forEach(function(s){s.input.addEventListener("input",draw);});
    scm.addEventListener("change",draw);
    reg(cv,draw);
  };

  /* ---------- 10: グリッチ ---------- */
  REG.glitch=function(el){
    head(el,"Fault Injection","if 文を 1 つ飛ばせば保護は消える");
    var cv=screen(el,196),cc=cctx(cv);
    var row=ctrls(el);
    var st=slider(row,"グリッチのタイミング（µs）",0,100,52,0.5);
    var sw=slider(row,"グリッチの幅（ns）",10,400,120,10);
    var star=select(row,"標的",["セキュアブートの署名検証","読み出し保護の判定","PIN の比較","鍵読み出しのループ"]);
    var sdef=select(row,"実装の対策",["対策なし（単一の if）","二重検証 + 冗長値","二重検証 + CFI カウンタ + ランダム遅延"]);
    var out=readout(el);
    var TGT=[
      {n:"セキュアブートの署名検証",win:[50,56],res:"不正なファームウェアが起動する",ch:"05 章"},
      {n:"読み出し保護の判定",win:[50,56],res:"デバッグポートが開いたまま起動する。フラッシュを吸える",ch:"06・11 章"},
      {n:"PIN の比較",win:[50,56],res:"任意の PIN で認証を通過する",ch:"10 章"},
      {n:"鍵読み出しのループ",win:[50,56],res:"鍵の一部が初期値のまま。探索空間が激減する",ch:"10 章"}
    ];
    function draw(){
      var t=+st.input.value,gw=+sw.input.value,tg=TGT[+star.value],df=+sdef.value;
      st.val.textContent=f(t,1)+" µs";sw.val.textContent=gw+" ns";
      var inWin=(t>=tg.win[0]&&t<=tg.win[1]);
      var widthOk=(gw>=60&&gw<=220);
      /* 対策ごとの成功確率 */
      var base=(inWin&&widthOk)?0.35:(inWin?0.06:0.0);
      var factor=[1,0.02,0.0008][df];
      var p=base*factor;
      var d=cc.fit(),w=d.w,h=d.h,ctx=cc.ctx;ctx.clearRect(0,0,w,h);
      var padL=18,padR=18,T=100;
      var X=function(x){return padL+x/T*(w-padL-padR);};
      /* 電源波形 */
      lab(ctx,"電源電圧（グリッチを注入する）",padL,20,C("--muted"),"left",11);
      var y0=30,vh=52;
      ctx.strokeStyle=C("--blue");ctx.lineWidth=2;
      ctx.beginPath();
      for(var x=0;x<=T;x+=0.25){
        var v=1.0;
        if(x>=t&&x<=t+gw/1000*8)v=0.25;    /* 見やすさのため幅を誇張 */
        var yy=y0+vh-v*vh;
        if(x===0)ctx.moveTo(X(x),yy);else ctx.lineTo(X(x),yy);
      }
      ctx.stroke();
      /* 実行フェーズ */
      var y1=y0+vh+22;
      lab(ctx,"CPU の実行（赤い区間が「保護の判定」）",padL,y1-6,C("--muted"),"left",11);
      var ph=[[0,tg.win[0],"準備・ハッシュ計算",C("--signal")],
              [tg.win[0],tg.win[1],"★ 判定の分岐",C("--alias")],
              [tg.win[1],T,"以降の処理",C("--signal")]];
      ph.forEach(function(p2){
        ctx.fillStyle=p2[3];ctx.globalAlpha=(p2[3]===C("--alias"))?1:.45;
        ctx.fillRect(X(p2[0]),y1,X(p2[1])-X(p2[0]),26);ctx.globalAlpha=1;
        if(X(p2[1])-X(p2[0])>90)lab(ctx,p2[2],(X(p2[0])+X(p2[1]))/2,y1+17,"#fff","center",9.5);
      });
      /* グリッチ位置マーカー */
      ctx.strokeStyle=C("--alias");ctx.lineWidth=1.8;ctx.setLineDash([4,3]);
      ctx.beginPath();ctx.moveTo(X(t),y0-6);ctx.lineTo(X(t),y1+34);ctx.stroke();ctx.setLineDash([]);
      lab(ctx,"グリッチ",X(t)+4,y0-10,C("--alias"),"left",10);
      /* 結果 */
      var ry=y1+52;
      var msg=(p>0.05)?"★ 判定がスキップされうる":(p>0.0005?"低確率だが成立しうる":"成功しない");
      lab(ctx,"推定成功率: "+(p*100<0.01?"< 0.01":f(p*100,2))+" %　"+msg,
          padL,ry+8,(p>0.05)?C("--alias"):C("--signal"),"left",12);
      var DFN=["対策なし（単一の if）","二重検証 + 冗長値","二重検証 + CFI カウンタ + ランダム遅延"];
      out.innerHTML='標的: <b>'+esc(tg.n)+'</b>（'+tg.ch+'）'+
        ' ／ 成功したら: <b class="warn">'+esc(tg.res)+'</b>'+
        ' ／ 対策「'+DFN[df]+'」での推定成功率 <b class="'+(p>0.05?"warn":"ok")+'">'+
        (p*100<0.01?"< 0.01":f(p*100,2))+' %</b>'+
        ' ／ '+(df===0
          ? '<span class="warn">成功率が数 % でも実用になる。</span>攻撃者は何万回でも試せる（レート制限も監視もない）'
          : (df===1
            ? '二重検証と冗長値で成功率が大幅に下がる。<b>2 回とも同じタイミングで飛ばすのは難しい</b>'
            : '<b class="ok">CFI カウンタとランダム遅延を加えると、タイミングを狙うこと自体が困難になる</b>'))+
        ' ／ <b class="warn">電圧グリッチは数万円の機材でできる</b>（クラス 2 の愛好家でも実行可能）'+
        ' ／ <b>最大の防御は「ファームウェアを読ませない」こと</b>。狙う場所が分からなければ攻撃できない（11 章）';
    }
    [st,sw].forEach(function(s){s.input.addEventListener("input",draw);});
    [star,sdef].forEach(function(s){s.addEventListener("change",draw);});
    reg(cv,draw);
  };

  /* ---------- 11: ファームウェア抽出 ---------- */
  REG.extract=function(el){
    head(el,"Firmware Extraction","攻撃はほぼ必ずここから始まる");
    var P=[
      {n:"公開ファームウェア",c:"--blue",lv:1,
       how:["サポートサイトから更新ファイルをダウンロード","binwalk で展開、strings で秘密を探す","v1.0 と v1.1 の差分から脆弱性を特定（パッチ差分解析）"],
       fix:["★ ファームウェアに秘密を埋め込まない（最も重要）","OTA イメージの暗号化（時間稼ぎ）","CI で strings とシークレットスキャンを自動実行"],
       chk:"strings firmware.bin | grep -i -E 'password|secret|api[_-]?key|BEGIN (RSA|EC|PRIVATE)'"},
      {n:"UART コンソール",c:"--blue",lv:1,
       how:["基板の 4 ピンパターンに USB シリアル変換を接続","ボーレートを総当たり（9600〜921600）","起動ログを読む → シェルが出ることがある","ブートローダを中断して起動引数を改変"],
       fix:["★ 量産ビルドからコードごと除去する（実行時フラグでは不十分）","ログレベルを下げる","ブートローダの対話機能を無効化","量産基板からテストパッドを削除"],
       chk:"#ifdef PRODUCTION_BUILD → DEBUG_CONSOLE_ENABLED 0"},
      {n:"SWD / JTAG",c:"--signal",lv:2,
       how:["デバッガを接続してフラッシュを全ダンプ","RAM を読んで実行中の鍵を取得","CPU を停止・改変して任意コードを実行"],
       fix:["読み出し保護（RDP / CRP / FSEC）を有効化","★ デバッグポートを無効化、または認証付きデバッグ（Arm ADAC など）","ライフサイクル状態を Production へ遷移（14 章）","★ 保護判定のフォールト耐性を確認（10 章）"],
       chk:"出荷検査で実際にデバッガを繋いで拒否されることを確認する"},
      {n:"外付けフラッシュ",c:"--signal",lv:2,
       how:["SOIC クリップを付けて、その場で読む","ホットエアで外してプログラマで読む","SPI バスにロジックアナライザを繋いで転送を観測"],
       fix:["★ フラッシュ暗号化（06 章）","オンザフライ復号（OTFDEC / PRINCE / BEE / Flash Encryption）","重要な部分は内部フラッシュに置く","※ 暗号化は機密性のみ。完全性には MAC / AEAD が要る"],
       chk:"実際に外して読んでみて、平文が出ないことを確認する"},
      {n:"ROM ブートローダ / ISP",c:"--signal",lv:2,
       how:["BOOT ピンを操作して ROM ブートローダで起動","ベンダのツールで読み出しを試す","消去してから自分のコードを書き込み、外部メモリを読ませる"],
       fix:["ROM ブートローダを OTP / オプションバイトで無効化","ブートソースを内部フラッシュに固定","BOOT ピンを基板で固定","★ 「保護してもブートローダから読めた」事故に注意"],
       chk:"データシートで「保護レベルと ROM ブートローダの関係」を確認する"},
      {n:"保護のグリッチ突破",c:"--alias",lv:3,
       how:["電圧・クロックのグリッチで保護判定をスキップ","パラメータを総当たりで探索（数千〜数万回）","成功率が数 % でも実用になる"],
       fix:["フォールト耐性のある保護判定を持つチップを選ぶ（10 章）","PSA Certified L3 / SESIP 4 / CC AVA_VAN.4 以上","電圧・クロック・温度・光センサ","試行回数の制限と異常検出"],
       chk:"「チップ名 + glitch」で公知の攻撃事例を検索し、対応状況を確認する"},
      {n:"開封・プロービング",c:"--alias",lv:4,
       how:["チップを開封（脱カプセル化）","顕微鏡で eFuse を観察","FIB でプロービングポイントを作る","レーザーで特定のビットを反転させる"],
       fix:["PUF（鍵が保存されていない）（06 章）","アクティブシールド・光センサ","セキュアエレメント（CC EAL6+ / AVA_VAN.5）（22 章）","※ この水準は「受容する」判断も合理的"],
       chk:"02 章の攻撃者クラス 4〜5 を想定するかどうか"}
    ];
    var out=readout(el);
    picker(el,P,function(p){
      var h=meter("難度",p.lv,4,p.c);
      h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.7rem;margin-top:.5rem">'+
        blk("攻撃者の手順",ul(p.how.map(esc)),"--alias")+
        blk("対策",ul(p.fix.map(esc)),"--signal")+'</div>';
      h+=blk("確認方法",'<code style="font-size:.78rem;word-break:break-all">'+esc(p.chk)+'</code>',"--blue");
      out.innerHTML=(p.lv<=2
        ? '<b class="ok">この経路は追加の部品コストなしで塞げる。</b>設定とビルド構成の見直しだけで済む。'+
          '<b class="warn">ここを塞がずに DPA 対策を議論しても意味がない</b>'
        : '<span class="warn">この経路への対策は、SoC 選定の段階で決まる。</span>基板を起こしてからでは変えられない（01 章）')+
        ' ／ <b>09 章のサイドチャネルも 10 章のフォールトも、まずファームウェアを読んで狙う場所を特定するところから始まる。</b>'+
        'ここを塞ぐことは、それらへの間接的だが強力な対策になる'+
        ' ／ 実務では——<b class="warn">ファームウェアを読まれた時点で、ハードコードされた鍵が出てきて終わる</b>ことが非常に多い';
      return h;
    },{init:2,small:true});
  };

  /* ---------- 12: プロビジョニング ---------- */
  REG.provisioning=function(el){
    head(el,"Provisioning","秘密鍵はどこを通り、誰が知りうるか");
    var M=[
      {n:"A. 外部生成 → 注入",c:"--alias",risk:3,
       flow:["HSM / 鍵生成サーバで秘密鍵と証明書を生成","何らかの経路で工場へ送る","工場の書き込み装置が機器に書き込む"],
       who:["鍵生成サーバの管理者","★ 経路（ファイル・ネットワーク）","★ 工場の書き込み装置とその運用者","★ 製造委託先の従業員"],
       pro:["実装が単純","証明書を事前に用意できる","機器側に鍵生成能力が不要"],
       con:["★ 秘密鍵が機器の外に存在する時間がある","工場を信頼する必要がある","オーバービルドのリスク"]},
      {n:"B. 機器内で生成（CSR）",c:"--signal",risk:1,
       flow:["機器が内部の TRNG で鍵ペアを生成","★ 秘密鍵は一度も外に出ない","公開鍵を含む CSR を出力","CA が検証して証明書を発行","証明書を機器に書き戻す（公開情報）"],
       who:["★ 誰も知りえない"],
       pro:["★ 秘密鍵が一度も外に出ない","工場も委託先も鍵を知りようがない","オーバービルド対策になる"],
       con:["良質な TRNG が必要（08 章）","CSR を CA に送る仕組みが要る","「正規の機器からの CSR か」を保証する手段が別途必要","工程が 2 段階になる"]},
      {n:"C. 事前プロビジョニング済みチップ",c:"--signal",risk:1,
       flow:["シリコンベンダの耐タンパ環境で鍵と証明書を注入","そのまま購入して基板に載せる","自社 CA がベンダの証明書を検証して、自社証明書をチェーンする"],
       who:["★ シリコンベンダのプロセスのみ"],
       pro:["★ 工場に鍵を渡す必要がまったくない","★ 少量生産でも使える","認証取得済みのことが多い","自社で CA を運用しなくてよい"],
       con:["チップ単価が上がる","ベンダのプロセスを信頼する","カスタマイズの自由度が低い場合がある"]},
      {n:"D. 全台共通鍵（★ 参考）",c:"--alias",risk:5,
       flow:["1 つの鍵を全機器に書き込む"],
       who:["★ 1 台を解析した誰でも"],
       pro:["最も簡単"],
       con:["★★ 1 台の解析で全台が破られる","なりすまし・通信の復号・偽ファームウェアの配布がすべて可能に","攻撃の期待利益が出荷台数に比例する"]}
    ];
    var out=readout(el);
    picker(el,M,function(m){
      var h=meter("鍵漏洩のリスク",m.risk,5,m.risk>=3?"--alias":"--signal");
      h+='<div style="margin-top:.5rem">'+blk("流れ",
        '<div style="display:flex;flex-direction:column;gap:.2rem">'+
        m.flow.map(function(t,i){return '<div style="padding:.25rem .55rem;border-radius:5px;'+
          'background:var(--panel);border-left:3px solid var('+m.c+')"><b>'+(i+1)+'.</b> '+esc(t)+'</div>';}).join("")+
        '</div>',m.c)+'</div>';
      h+=blk("秘密鍵を知りうる者",ul(m.who.map(esc)),"--alias");
      h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.6rem">'+
        blk("長所",ul(m.pro.map(esc)),"--signal")+
        blk("短所",ul(m.con.map(esc)),"--alias")+'</div>';
      out.innerHTML=(m.risk>=5
        ? '<b class="warn">★ これは使ってはいけない。</b>攻撃者の期待利益が出荷台数 N に比例する。'+
          'クラス 3（金銭目的の犯罪者）の攻撃が経済的に成立してしまう'
        : (m.risk<=1
          ? '<b class="ok">これが望ましい方式である。</b>'+
            '小〜中規模の製品では、<b>C（事前プロビジョニング済みチップ）が最も現実的</b>——'+
            '自社で HSM と CA を運用する体制構築コストと比べれば、BOM に数十〜数百円足すほうが圧倒的に安い'
          : '<b>やむを得ずこの方式を採る場合</b>は、HSM で鍵を生成・保管し、'+
            '<b class="ok">発行数をカウントしてオーバービルドを検出する</b>。'+
            'ST の SFI のような「工場に平文を渡さない」仕組みも各社が提供している'))+
        ' ／ <b>デバイス ID は「秘密鍵を持っていること」で証明されなければならない。</b>'+
        'UID や MAC アドレスは誰でも読めて誰でも名乗れるので、認証には使えない';
      return h;
    },{init:1,small:true});
  };

  /* ---------- 13: OTA の検証チェーン ---------- */
  REG.otachain=function(el){
    head(el,"Secure OTA","5 つの性質のどれが欠けても破れる");
    var row=ctrls(el);
    var c1=checkbox(row,"署名を検証する（真正性・完全性）",true);
    var c2=checkbox(row,"公開鍵を OTP のハッシュと照合する",true);
    var c3=checkbox(row,"SVN / 単調カウンタを確認する（ロールバック防止）",true);
    var row2=ctrls(el);
    var c4=checkbox(row2,"起動のたびにブートローダが再検証する",true);
    var c5=checkbox(row2,"A/B 面で原子的に更新する",true);
    var c6=checkbox(row2,"イメージを暗号化する（機密性）",false);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var R=[];
      R.push({n:"改ざんされたイメージを送り込む",ok:c1.checked&&c2.checked,
        why:c1.checked?(c2.checked?"署名検証 + 公開鍵の照合で防げる":"★ 攻撃者が自分の鍵ペアで署名し、自分の公開鍵を添付すれば通る"):"★ 署名を検証していないので、任意のファームウェアが通る"});
      R.push({n:"正規に署名された古い脆弱な版に戻す",ok:c3.checked,
        why:c3.checked?"SVN と単調カウンタで防げる":"★ 署名は正しいので検証を通過する。修正した脆弱性が復活する"});
      R.push({n:"検証後・起動前にフラッシュを書き換える（TOCTOU）",ok:c4.checked,
        why:c4.checked?"起動のたびに再検証するので防げる":"★ ダウンロード直後の検証だけでは、その後の書き換えを検出できない"});
      R.push({n:"更新中の電源断で文鎮化させる",ok:c5.checked,
        why:c5.checked?"A/B 面なので、失敗しても旧版から起動できる":"★ 上書き方式では、中断すると起動できなくなる"});
      R.push({n:"更新ファイルを解析して脆弱性を特定する",ok:c6.checked,
        why:c6.checked?"暗号化により、パッチ差分解析が困難になる":"暗号化していないので、v1.0 と v1.1 の差分から修正箇所＝脆弱性を特定できる"});
      var broken=R.filter(function(r){return !r.ok;}).length;
      out2.innerHTML=tbl(["攻撃","防げるか","理由"],
        R.map(function(r){return [esc(r.n),
          '<b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"✓ 防げる":"✗ 成立する")+'</b>',
          esc(r.why)];}));
      out.innerHTML=(broken===0
        ? '<b class="ok">主要な攻撃をすべて防げる構成である。</b>'
        : '<b class="warn">'+broken+' 件の攻撃が成立する。</b>')+
        (!c2.checked&&c1.checked
          ? ' ／ <span class="warn">★ 「署名を検証しているが、公開鍵を OTP と照合していない」は最も危険な実装ミスである。</span>'+
            'セキュアブートが完全に無意味になる（05 章）'
          : '')+
        (!c3.checked
          ? ' ／ <span class="warn">ロールバック防止は最も見落とされる。</span>SVN は「脆弱性を修正したときだけ」上げる（OTP のビット数が上限になるため）'
          : '')+
        ' ／ <b>EU CRA はサポート期間中のセキュリティ更新の提供を義務化した</b>（03 章）。'+
        '更新機能を持たない機器は EU 市場で売れない'+
        ' ／ <b>フラッシュ容量は企画段階で確保すること。</b>'+
        'ブートローダ + アプリ × 2 + スクラッチ + データ。後から変えられない（01 章）'+
        ' ／ <b>実装は MCUboot などを使う。</b>自作は罠が多すぎる';
    }
    [c1,c2,c3,c4,c5,c6].forEach(function(c){c.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 14: ライフサイクル状態 ---------- */
  REG.lifecycle=function(el){
    head(el,"Lifecycle States","時期によって開けるべき穴が違う");
    var S=[
      {n:"Chip Manufacturing",c:"--faint",
       who:"シリコンベンダ",
       can:["すべて開いている","ベンダのテスト機能が使える"],
       cant:[],
       risk:"—",
       vendor:"Arm PSA: Assembly & Test ／ Renesas: CM ／ ST: OPEN ／ NXP: Blank"},
      {n:"Development",c:"--blue",
       who:"開発者",
       can:["デバッグ全開","フラッシュの読み書き自由","★ テスト鍵を使う"],
       cant:["本番鍵を使ってはいけない"],
       risk:"★ この状態のまま出荷する事故が最多",
       vendor:"Renesas: SSD ／ ST: OPEN / PROVISIONING ／ NXP: Development ／ TI: GP"},
      {n:"Non-secure 開発",c:"--blue",
       who:"アプリ開発チーム",
       can:["★ 非セキュア側だけデバッグできる","アプリの開発を継続できる"],
       cant:["Secure 領域は読めない","鍵は保護されている"],
       risk:"実務的に非常に有用な中間状態",
       vendor:"Renesas: NSECSD ／ ST: TZ_CLOSED ／ ADAC の権限指定"},
      {n:"Production / Deployed",c:"--signal",
       who:"市場",
       can:["★ 認証付きデバッグなら開けられる","OTA で更新できる"],
       cant:["通常のデバッガでは接続できない","フラッシュを読み出せない"],
       risk:"多くの製品でこれが最適解",
       vendor:"Renesas: DPL ／ ST: CLOSED ／ NXP: Deployed ／ TI: HS-SE"},
      {n:"RMA（返品分析）",c:"--alias",
       who:"メーカーの解析部門",
       can:["★ 鍵とユーザデータを消去してからデバッグを開く","故障解析ができる"],
       cant:["鍵が絡む不具合は解析できない（消えているので）","不可逆"],
       risk:"14 章のジレンマへの回答",
       vendor:"Renesas: RMA_REQ / RMA_ACK ／ ST: regression ／ NXP: Returned"},
      {n:"Locked / 廃棄",c:"--alias",
       who:"—",
       can:["何もできない"],
       cant:["二度とデバッグできない","故障解析もできない"],
       risk:"最高の安全性。だが品質改善ができない",
       vendor:"Renesas: LCK_DBG / LCK_BOOT ／ ST: LOCKED ／ NXP: Bricked"}
    ];
    var out=readout(el);
    picker(el,S,function(s,i){
      var h='<div style="color:var(--muted);margin-bottom:.4rem">この状態にいるとき: <b>'+esc(s.who)+'</b></div>';
      h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.6rem">'+
        blk("できること",ul(s.can.map(esc)),"--signal")+
        (s.cant.length?blk("できないこと",ul(s.cant.map(esc)),"--alias"):"")+'</div>';
      h+=blk("設計上の注意",'<div style="line-height:1.65">'+esc(s.risk)+'</div>',"--blue");
      h+=blk("各社での呼び名",'<div style="font-family:var(--mono);font-size:.76rem;line-height:1.7;color:var(--muted)">'+
        esc(s.vendor)+'</div>',"--muted");
      /* 遷移図 */
      var fig='<div style="display:flex;flex-wrap:wrap;gap:.2rem;align-items:center;margin-top:.5rem">';
      S.forEach(function(y,j){
        var on=(j===i);
        fig+='<span style="padding:.22rem .5rem;border-radius:5px;font-size:.74rem;'+
          'background:'+(on?"var("+s.c+")":"var(--panel)")+';color:'+(on?"#fff":"var(--muted)")+';'+
          'border:1px solid var('+(on?s.c:"--line")+')">'+esc(y.n)+'</span>';
        if(j<S.length-1)fig+='<span style="color:var(--faint)">→</span>';
      });
      fig+='</div><div style="color:var(--faint);font-size:.74rem;margin-top:.2rem">★ 遷移は不可逆（OTP に記録される）</div>';
      out.innerHTML=(i===1
        ? '<b class="warn">★ 「出荷時に状態を進め忘れる」が最も多い事故である。</b>'+
          '対策は技術ではなくプロセス: ①量産手順書の最後の工程に入れる ②出荷検査で状態を読んで確認する ③抜き取りでデバッガを繋いでみる'
        : (i===3
          ? '<b class="ok">Production / CLOSED が多くの製品にとって最適解である。</b>'+
            '認証付きデバッグがあれば RMA に対応できるので、LOCKED まで進める必要は通常ない'
          : (i===4
            ? '<b>「消してから開ける」という順序が肝である。</b>機密は守られ、解析はできる。'+
              '攻撃者がこの手順を使っても得るものがない'
            : '')))+
        ' ／ <b class="warn">状態遷移の処理そのものが攻撃対象になる</b>（10 章）。'+
        'グリッチで遷移を飛ばされないよう、冗長チェックとハードウェアラッチが要る'+
        ' ／ <b>量産と同じ設定で全機能を検証すること。</b>'+
        '出荷直前に有効化すると必ず問題が出て、「今回は無効のままで」という最悪の判断につながる';
      return h+fig;
    },{init:3,small:true});
  };

  /* ---------- 15: メモリ安全性 ---------- */
  REG.memsafety=function(el){
    head(el,"Memory Safety","組み込みは PC より条件が悪い");
    var B=[
      {n:"バッファオーバーフロー",c:"--alias",
       code:"uint8_t buf[64];\nmemcpy(buf, packet->data, packet->len);   /* ★ len を検査していない */",
       what:"配列の範囲外に書き込み、隣接するメモリ（他の変数、戻りアドレス、他タスクのスタック）を破壊する",
       where:"パケット解析、文字列処理、設定の読み込み",
       def:["長さを必ず検査する（上限は固定値で）","-fstack-protector-strong（カナリア）","_FORTIFY_SOURCE=2","MPU で W^X を設定（07 章）","★ PACBTI（Armv8.1-M）で ROP を防ぐ","Rust で書き直す"]},
      {n:"整数オーバーフロー",c:"--alias",
       code:"uint16_t total = hdr_len + payload_len;  /* ★ 65535 を超えると折り返す */\nbuf = malloc(total);\nmemcpy(buf, src, hdr_len + payload_len);  /* 小さいバッファに大きくコピー */",
       what:"長さ計算がオーバーフローし、確保より大きくコピーする",
       where:"可変長パケット、TLV 解析",
       def:["計算前に上限を検査する","-Wconversion -Wsign-conversion","符号なし／符号付きを混ぜない","静的解析ツール"]},
      {n:"符号の混同",c:"--alias",
       code:"int len = get_length();\nif (len > MAX) return -1;      /* ★ 負値がすり抜ける */\nmemcpy(buf, src, len);         /* size_t に変換され巨大値に */",
       what:"負の値が size_t に変換されて巨大な値になる",
       where:"長さ・インデックスの検査",
       def:["size_t を使う","下限も検査する（len < 0 || len > MAX）","-Wsign-conversion","MISRA C / CERT C の規則"]},
      {n:"Use-after-free",c:"--alias",
       code:"vPortFree(msg->buf);\n...\nprocess(msg->buf);            /* ★ 解放済みを参照 */",
       what:"解放後のポインタを使う。別の用途に再利用された領域を読み書きする",
       where:"動的確保を使う設計、キューでポインタを渡す場合（所有権の設計ミス）",
       def:["解放後にポインタを NULL にする","★ 所有権を設計で明示する（11 章のキュー）","静的確保に切り替える","AddressSanitizer でホストテスト"]},
      {n:"フォーマット文字列",c:"--alias",
       code:'printf(user_input);            /* ★ 書式指定子が解釈される */',
       what:"%n や %x で任意のメモリを読み書きされる",
       where:"ログ出力、エラーメッセージ",
       def:['printf("%s", user_input) と書く','-Wformat=2 -Wformat-security','ユーザ入力を書式文字列にしない']},
      {n:"スタックオーバーフロー",c:"--alias",
       code:"void handler(void) {\n    uint8_t frame[2048];      /* ★ タスクスタックを超える */\n    ...\n}",
       what:"タスクのスタックを超えて、隣のタスクの TCB やスタックを破壊する",
       where:"深い呼び出し、大きなローカル変数、printf、再帰",
       def:["大きな配列を static かヒープへ","再帰・VLA・alloca を使わない","-fstack-usage で静的解析","RTOS のスタック溢れ検出を有効化","MPU でガード領域を作る"]}
    ];
    var out=readout(el);
    picker(el,B,function(b){
      var h='<pre style="margin:.2rem 0 .5rem;padding:.5rem .7rem;background:var(--panel);border-radius:6px;'+
        'overflow-x:auto;font-family:var(--mono);font-size:.78rem;line-height:1.55;border:1px solid var(--line)">'+
        esc(b.code)+'</pre>';
      h+=blk("何が起きるか",'<div style="line-height:1.65">'+esc(b.what)+'</div>',"--alias");
      h+=blk("よく発生する箇所",'<div>'+esc(b.where)+'</div>',"--blue");
      h+=blk("防御",ul(b.def.map(esc)),"--signal");
      out.innerHTML='<b class="warn">組み込みは PC より条件が悪い:</b> '+
        'MMU がない（プロセス分離なし）／ ASLR がない（アドレスが固定）／ '+
        'スタックとヒープが近い ／ <b>クラッシュが「たまに再起動する」で片付けられる</b>'+
        ' ／ <b class="warn">最も危険なのは「認証前に処理されるコード」</b>: '+
        'TCP/IP、BLE のアドバタイズ処理、TLS ハンドシェイク、USB ディスクリプタ。誰からでも攻撃できる'+
        ' ／ <b class="ok">ホスト上でファジングを回すこと。</b>'+
        'プロトコル解析部分は HAL をモックにすればホストでビルドできる。1 秒に数千回実行できるので実機の比ではない'+
        ' ／ <b>セキュアブートは、正規に署名された脆弱なファームウェアを喜んで起動する。</b>完全性 ≠ 安全性（04 章）';
      return h;
    },{init:0,small:true});
  };

  /* ---------- 16: TLS 設定チェック ---------- */
  REG.tlscheck=function(el){
    head(el,"TLS Configuration","「使えば安全」ではなく「正しく使えば安全」");
    var row=ctrls(el);
    var c1=checkbox(row,"サーバ証明書を検証する（VERIFY_REQUIRED）",true);
    var c2=checkbox(row,"ホスト名を検証する（set_hostname を呼ぶ）",true);
    var c3=checkbox(row,"時刻が正しく、有効期限を検証できる",true);
    var row2=ctrls(el);
    var c4=checkbox(row2,"信頼する CA を自社のものに限定する",true);
    var c5=checkbox(row2,"TLS 1.2 以上に限定する",true);
    var c6=checkbox(row2,"ECDHE を使う（前方秘匿性）",true);
    var row3=ctrls(el);
    var c7=checkbox(row3,"クライアント証明書で機器を認証する",true);
    var c8=checkbox(row3,"検証エラーで接続を中止する",true);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var R=[];
      R.push({n:"中間者攻撃（偽サーバ）",ok:c1.checked&&c8.checked,
        why:c1.checked?(c8.checked?"証明書検証で防げる":"★ 検証していてもエラーを無視すれば同じこと"):"★ VERIFY_NONE では、中間者の自己署名証明書を受け入れてしまう"});
      R.push({n:"別ドメインの正規証明書での偽装",ok:c1.checked&&c2.checked,
        why:c2.checked?"ホスト名検証で防げる":"★ チェーンは検証されるが「接続先のものか」は確認されない。攻撃者が正規 CA から取得した別ドメインの証明書で通る"});
      R.push({n:"期限切れ・失効した証明書",ok:c3.checked,
        why:c3.checked?"有効期限を検証できる":"★ 時刻が合っていないと期限検証が機能しない。ビルド時刻を下限にするだけでも効果がある"});
      R.push({n:"侵害された第三者 CA の悪用",ok:c4.checked,
        why:c4.checked?"自社 CA に限定しているので、他の CA の証明書は受け付けない":"パブリック CA を数百個信頼している。どれか 1 つが侵害されると通る"});
      R.push({n:"古い TLS のダウングレード",ok:c5.checked,
        why:c5.checked?"TLS 1.2 以上に限定":"★ TLS 1.0/1.1 には既知の脆弱性がある"});
      R.push({n:"記録した通信の後日復号（Harvest now, decrypt later）",ok:c6.checked,
        why:c6.checked?"ECDHE により前方秘匿性がある。後から鍵が漏れても過去は守られる":"★ 静的 RSA 鍵交換では、鍵が漏れた時点で過去の全通信が復号できる"});
      R.push({n:"偽の機器がクラウドに接続",ok:c7.checked,
        why:c7.checked?"クライアント証明書で機器を認証している":"★ サーバが機器を認証していない。誰でもデータを送り込める"});
      var broken=R.filter(function(r){return !r.ok;}).length;
      out2.innerHTML=tbl(["攻撃","防げるか","理由"],
        R.map(function(r){return [esc(r.n),
          '<b class="'+(r.ok?"ok":"warn")+'">'+(r.ok?"✓":"✗ 成立")+'</b>',esc(r.why)];}));
      out.innerHTML=(broken===0
        ? '<b class="ok">主要な攻撃を防げる構成である。</b>'
        : '<b class="warn">'+broken+' 件の攻撃が成立する。</b>')+
        (!c1.checked
          ? ' ／ <span class="warn">★ 証明書検証の無効化は、組み込みで最も多い実装ミスである。</span>'+
            '理由はいつも同じ——「つながらなかったので、検証を切ったら動いた」。'+
            'これで TLS は「盗聴されない通信路」ですらなくなる'
          : '')+
        (!c2.checked&&c1.checked
          ? ' ／ <span class="warn">mbedtls_ssl_set_hostname() の呼び忘れは非常に多い。</span>'+
            '証明書チェーンは検証されるが、ホスト名は確認されない'
          : '')+
        ' ／ <b>出荷前に必ず実機で試験すること:</b> '+
        '①自己署名証明書 ②有効期限切れ ③<b>別ホスト名の正規証明書</b> ④失効した証明書——'+
        'これらを提示して、すべて接続が拒否されることを確認する'+
        ' ／ <b class="warn">クラウドも侵害されうる。</b>破壊的な操作（OTA・工場出荷リセット）には追加の署名検証を要求すること';
    }
    [c1,c2,c3,c4,c5,c6,c7,c8].forEach(function(c){c.addEventListener("change",draw);});
    reg(null,draw);draw();
  };

  /* ---------- 共有: ベンダ機能表 ---------- */
  function featureTable(rows){
    return tbl(["機能","内容","対応する章"],
      rows.map(function(r){return ['<b>'+esc(r[0])+'</b>',esc(r[1]),esc(r[2])];}));
  }

  /* ---------- 17: Arm の機能マップ ---------- */
  REG.armmap=function(el){
    head(el,"Arm","業界の共通語。各社の機能はこの上に載る");
    var A=[
      {n:"Cortex-M コアの世代",c:"--signal",
       rows:[
        ["Armv6-M（M0/M0+）","MPU（オプション）のみ。TrustZone なし","07 章"],
        ["Armv7-M（M3/M4/M7）","MPU。TrustZone なし。現役だが新規設計では推奨しにくい","07 章"],
        ["Armv8-M Baseline（M23）","★ TrustZone あり。低消費電力","07 章"],
        ["Armv8-M Mainline（M33）","★ TrustZone あり。最も広く使われる。新規設計の第一候補","07 章"],
        ["Cortex-M35P","M33 + 物理セキュリティ機能（パリティ、耐タンパ支援）","10 章"],
        ["Armv8.1-M（M55 / M85）","★ PACBTI（PAC + BTI）。ROP / JOP 攻撃への直接的な対策","15 章"]],
       note:"新規設計で TrustZone が欲しいなら Cortex-M33 が現実的な第一候補。ほぼすべての主要ベンダが M33 品種を持つ"},
      {n:"TrustZone-M",c:"--signal",
       rows:[
        ["Secure / Non-secure","セキュリティ状態の分離。★ 特権レベルとは直交する","07 章"],
        ["SAU","CPU 内蔵。ソフトウェアで設定できる属性ユニット","07 章"],
        ["IDAU","★ チップベンダが固定で実装。アドレスマップで属性が決まる","07・18〜21 章"],
        ["NSC + SG 命令","★ 越境の入口を 1 点に絞る。Secure コードの途中に飛び込めない","07 章"],
        ["CMSE","cmse_nonsecure_entry、cmse_check_address_range によるポインタ検証","07 章"],
        ["周辺・DMA の分離","★ Arm 標準ではない。ベンダ独自（GTZC / SPU / AHB Secure Controller）","07・18〜21 章"]],
       note:"IDAU のエイリアスアドレス（同じ物理メモリが 2 つのアドレスに見える）の理解が最初の壁になる"},
      {n:"PSA（枠組み）",c:"--blue",
       rows:[
        ["Analyze","TMSA による脅威モデリング","02 章"],
        ["Architect","要件を満たすアーキテクチャ設計","02・07 章"],
        ["Implement","TF-M などによる実装","17 章"],
        ["Certify","★ PSA Certified による第三者評価","03 章"],
        ["10 のセキュリティ目標","識別・LCS・アテステーション・セキュアブート・更新・アンチロールバック・分離・相互作用・暗号・ストレージ","本シリーズ全体"]],
       note:"★ PSA の 10 目標は、設計レビューのチェックリストとしてそのまま使える"},
      {n:"PSA Functional API",c:"--blue",
       rows:[
        ["PSA Crypto API","★ 鍵はハンドルでのみ扱う。値を返す関数が存在しない","06・08 章"],
        ["Internal Trusted Storage","チップ内蔵の保護ストレージ","06 章"],
        ["Protected Storage","外部メモリでも使えるよう暗号化して保存","06 章"],
        ["Initial Attestation","アテステーショントークンの生成","04 章"],
        ["Firmware Update","セキュア OTA の制御","13 章"],
        ["移植性","★ Mbed TLS 3.x も PSA Crypto API。TrustZone なしから移行できる","17 章"]],
       note:"★「危険な使い方ができない API」を設計することが最良の防御である。鍵をエクスポートする関数がそもそもない"},
      {n:"TF-M（実装）",c:"--signal",
       rows:[
        ["SPM","セキュアパーティションの管理と IPC","07 章"],
        ["BL1 / BL2","MCUboot ベースのセキュアブート","05・13 章"],
        ["PSA-RoT / ARoT","★ 特権の階層。PSA-RoT を最小限に保つ","04・07 章"],
        ["Isolation Level 1/2/3","分離の粒度。PSA Certified L2 以上では Level 2 以上が必要","03・07 章"],
        ["コスト","★ フラッシュ数十〜百数十 KB、RAM も相応。小さなセンサノードには重いことがある","17 章"]],
       note:"自作しないこと。TrustZone の落とし穴が多すぎる。ただし TF-M の資源消費も認識しておく"},
      {n:"PSA Certified",c:"--alias",
       rows:[
        ["Level 1","質問票ベースの自己評価 + ラボによるレビュー。数日〜数週","03 章"],
        ["Level 2","ラボによる時間制限つき侵入テスト（SESIP 3 相当）。約 1 か月","03 章"],
        ["Level 3","★ 物理攻撃（サイドチャネル・フォールト）への耐性を含む。数か月","03・09・10 章"],
        ["Functional API 認証","API の適合試験。実装が正しいかを確認する","17 章"],
        ["コンポジション","★ チップの認証が、その上の製品の認証を楽にする","03 章"]],
       note:"★ ベンダ資料に「PSA Certified」とだけあっても Level 1 か 3 かで意味が全く違う。公式サイトで確認すること"},
      {n:"Cortex-A / Armv9",c:"--blue",
       rows:[
        ["TrustZone-A","Secure World / Normal World。EL3 のモニタが切り替える","07 章"],
        ["OP-TEE","代表的な TEE OS。GlobalPlatform API 準拠","07 章"],
        ["TF-A","EL3 のファームウェア。BL1/BL2/BL31","05 章"],
        ["PAC / BTI（v8.3/8.5-A）","制御フロー保護","15 章"],
        ["MTE（v8.5-A）","★ メモリタグ付け。再コンパイルだけで Use-after-free 等を検出","15 章"],
        ["CCA / RME（v9-A）","Realm。★ ハイパーバイザからも隔離される","07 章"]],
       note:"MTE は C/C++ のメモリ安全性問題への現実的な緩和策。将来組み込みに降りてくる可能性がある技術"}
    ];
    var out=readout(el);
    picker(el,A,function(a){
      out.innerHTML=esc(a.note);
      return featureTable(a.rows);
    },{init:1,small:true});
  };

  /* ---------- 18: STM32 ---------- */
  REG.stm32=function(el){
    head(el,"STMicroelectronics","世代差が大きい。品種を見分けること");
    var S=[
      {n:"世代の見分け方",c:"--blue",
       rows:[
        ["第 1 世代（F0/F1/F3/F4/L0/L1/L4）","Cortex-M0/M3/M4。RDP・WRP・PCROP。★ TrustZone なし","07 章"],
        ["第 2 世代（F7/H7）","Cortex-M7。上記 + セキュアメモリ、OTFDEC（H7 の一部）","06 章"],
        ["第 3 世代（L5 / U5 / H5 / WBA / N6）","★ Cortex-M33。TrustZone、GTZC、製品状態、RSS、SAES","07・14 章"]],
       note:"★ 新規設計でセキュリティを重視するなら第 3 世代を選ぶこと。第 1・2 世代の RDP Level 2 はグリッチ突破の公開事例がある（10 章）"},
      {n:"保護機能（全世代の基礎）",c:"--signal",
       rows:[
        ["RDP Level 0/1/2","読み出し保護。★ Level 1 は消去すれば戻せる、Level 2 は不可逆","06・14 章"],
        ["WRP","書き込み・消去の保護","06 章"],
        ["PCROP","★ 実行できるが読めない領域。IP 保護用。定数データは同居できない","01 章"],
        ["HDP（Hide Protection）","★ 起動後にアクセスを封じる。初期化用の秘密を隠す（DICE と同じ発想）","04・06 章"],
        ["MPU","Arm 標準の特権分離","07 章"]],
       note:"★ HDP は非常に有用。ブートローダが鍵を読んで初期化した後、その領域を封じれば、後段に脆弱性があっても秘密は漏れない"},
      {n:"GTZC（TrustZone の周辺実装）",c:"--signal",
       rows:[
        ["TZSC","周辺回路ごとに Secure / Non-secure、特権 / 非特権を割り当てる","07 章"],
        ["MPCBB","★ SRAM をブロック単位で分ける","07 章"],
        ["MPCWM","外部メモリ等を境界（ウォーターマーク）で分ける","07 章"],
        ["TZIC","★ 不正アクセスを検出して割り込みを上げる。Arm 標準にない付加価値","07 章"]],
       note:"★ TZIC で攻撃の試行を検知できる。ログに残す、回数を超えたらロックする、サーバにアラートを送る——分離を「検知」まで広げられる"},
      {n:"暗号エンジンと乱数",c:"--signal",
       rows:[
        ["AES / CRYP","AES-128/192/256。モードは品種による（ECB/CBC/CTR/GCM/CCM）","08 章"],
        ["SAES","★ サイドチャネル対策を施した AES。鍵をハードウェアから直接供給できる品種がある","06・09 章"],
        ["HASH","SHA-1/224/256（品種により 384/512、HMAC）","08 章"],
        ["PKA","公開鍵演算アクセラレータ（RSA / ECDSA / ECDH）","05・08 章"],
        ["RNG","TRNG。NIST SP 800-90B 準拠を謳う品種がある","08 章"],
        ["OTFDEC","外部メモリのオンザフライ復号（AES-CTR）。★ 完全性は守らない","06 章"]],
       note:"★ 鍵を扱う処理では必ず SAES（対策版）を使うこと。「AES がある」からといってどちらでも同じではない"},
      {n:"製品状態と Debug Authentication",c:"--alias",
       rows:[
        ["OPEN","全部開いている。開発中","14 章"],
        ["PROVISIONING / iROT_PROVISIONED","プロビジョニング作業中／不変 RoT 注入済み","12・14 章"],
        ["TZ_CLOSED","TrustZone が有効化され、Secure 側が保護されている","14 章"],
        ["CLOSED","★ 通常の運用状態。認証すればデバッグを開けられる。多くの製品の最適解","14 章"],
        ["LOCKED","恒久的にロック。故障解析もできない","14 章"],
        ["Debug Authentication","★ チャレンジ・レスポンスで権限を判定。「Non-secure のみ」も指定できる","11・14 章"],
        ["regression","チップを消去して OPEN に戻す。鍵も消える（RMA 用）","14 章"]],
       note:"★ CLOSED が多くの製品にとって最適解。認証付きデバッグがあれば RMA に対応できるので、LOCKED まで進める必要は通常ない"},
      {n:"SFI / SMI（プロビジョニング）",c:"--blue",
       rows:[
        ["SFI","★ 暗号化イメージ + HSM カード。工場は平文もフラッシュ鍵も見られない","12 章"],
        ["HSM のカウンタ","★ 契約台数以上は書き込めない。オーバービルド対策","12 章"],
        ["SMI","サードパーティのモジュールを、提供元の鍵で保護したまま組み込む","01・12 章"],
        ["SFIx","外部フラッシュを含む構成に対応","12 章"]],
       note:"★ 信頼の必要な範囲を「工場」から「HSM カード」へ縮める仕組み。製造委託が長いサプライチェーンで有用"},
      {n:"ソフトウェアと外付け",c:"--blue",
       rows:[
        ["SBSFU","第 1・2 世代向けのセキュアブート／更新のリファレンス実装","05・13 章"],
        ["TF-M ポート","★ 第 3 世代向け。PSA 準拠。移植性が高い","17 章"],
        ["RSS","システムフラッシュに置かれた ST 提供の RoT サービス","04 章"],
        ["STM32Trust / STM32TRUSTEE","セキュリティ設計の体系・支援","03 章"],
        ["STSAFE-A / STSAFE-TPM","★ 外付けセキュアエレメント／TPM","22 章"]],
       note:"第 1・2 世代は SBSFU、第 3 世代は TF-M。PSA 認証を目指すなら TF-M 一択に近い"}
    ];
    var out=readout(el);
    picker(el,S,function(s){out.innerHTML=esc(s.note);return featureTable(s.rows);},{init:2,small:true});
  };

  /* ---------- 19: NXP ---------- */
  REG.nxp=function(el){
    head(el,"NXP","PUF と EdgeLock が特徴");
    var N=[
      {n:"ファミリの整理",c:"--blue",
       rows:[
        ["Kinetis","Cortex-M0+/M4。汎用（レガシー寄り）","—"],
        ["LPC5500（LPC55S6x など）","★ Cortex-M33 + TrustZone + PUF + PRINCE + CASPER","06・07 章"],
        ["i.MX RT（1050/1060/1170、500/600）","クロスオーバー MCU。Cortex-M7 / M33。BEE / OTFAD","06 章"],
        ["i.MX 6/7/8/9","Cortex-A（+ M）。Linux 系。HAB / AHAB、CAAM、ELE","05・07 章"],
        ["MCX","新世代。Cortex-M33 など。ELS / PKC","08 章"],
        ["S32（自動車）","HSM 搭載。ISO 21434 対応","03 章"]],
       note:"PUF を持つのは LPC55S6x、i.MX RT500/600 など。品種を必ず確認すること"},
      {n:"セキュアブート（HAB / AHAB）",c:"--signal",
       rows:[
        ["HAB","i.MX 6/7、i.MX RT の一部。SRK テーブルのハッシュを eFuse に焼く","05 章"],
        ["AHAB","i.MX 8/9 系。コンテナ形式。ELE が処理","05 章"],
        ["ROM 認証","LPC55、MCX。RoTK ハッシュで検証","05 章"],
        ["SRK 4 個","★ 4 個の鍵スロットを個別に失効できる。鍵漏洩時に運用を継続できる","12 章"],
        ["CSF","柔軟だが ★ 記述ミスで保護が抜ける。検証範囲を試験で確認すること","05 章"],
        ["SEC_CONFIG（Open / Closed）","★ Open では検証失敗でも起動する。イベントログを開発中から確認する","14 章"]],
       note:"★ 「Open では署名検証が失敗しても起動する」ため、Closed にした途端に起動しなくなる事故が起きる。hab_status を必ず確認してから Closed にすること"},
      {n:"PUF",c:"--alias",
       rows:[
        ["SRAM PUF","起動時に SRAM の初期値から鍵を再構成する。★ 電源断時は鍵が存在しない","06 章"],
        ["Activation Code","誤り訂正用のヘルパーデータ。公開してよいが ★ 失うと鍵を復元できない","06 章"],
        ["Key Code","ラップされた鍵。フラッシュに保存できる","06 章"],
        ["エンロールメント","★ 工場で 1 回だけ。やり直せない品種がある","12 章"],
        ["注意点","動作温度全域での安定性、経年劣化、起動時間の増加（数 ms〜数十 ms）","06 章"]],
       note:"★ 鍵が保存されていないので、剥がしても読むものがない。開封すると素子の特性が変わって PUF 出力も変わる（invasive attack への自然な耐性）"},
      {n:"メモリ暗号化",c:"--signal",
       rows:[
        ["PRINCE","★ 内部フラッシュのオンザフライ暗号／復号（LPC55 など）","06 章"],
        ["BEE","外部フラッシュのバス暗号化（i.MX RT の一部）","06 章"],
        ["OTFAD","外部フラッシュのオンザフライ復号。複数領域に対応","06 章"],
        ["CAAM Blob","任意のデータをデバイス固有鍵でラップ。★ 他チップでは復号できない","06 章"]],
       note:"★ 内部フラッシュも暗号化する PRINCE は多層防御の考え方。読み出し保護がグリッチで破られた場合の第 2 の防壁になる"},
      {n:"暗号エンジン",c:"--signal",
       rows:[
        ["CAAM","i.MX。対称・ハッシュ・公開鍵（PKHA）・RNG。★ Black Key / Blob","06・08 章"],
        ["DCP","i.MX RT の一部。AES、SHA（軽量版）","08 章"],
        ["HASHCRYPT","LPC55。AES、SHA","08 章"],
        ["CASPER","★ LPC55 の公開鍵演算コプロセッサ（ECC / RSA）","05・08 章"],
        ["ELS / PKC","MCX、新しい i.MX RT の暗号エンジン","08 章"],
        ["ELE（EdgeLock secure Enclave）","★ 独立したセキュリティサブシステム（i.MX 8ULP / 93 など）","07 章"]],
       note:"★ ELE は 07 章の「レベル 3: 物理的な分離」。メインコアが完全に侵害されても内部の鍵には触れない。高セキュリティ品種の共通の方向性"},
      {n:"Debug Authentication と LCS",c:"--alias",
       rows:[
        ["デバッグ証明書（DC）","ベンダが発行。権限とコアを指定できる","11・14 章"],
        ["★ UUID 限定の DC","★ 特定の 1 台にだけ有効な証明書を発行できる。漏れても他機に使えない","14 章"],
        ["Blank / NXP Provisioned","出荷時","14 章"],
        ["Development","開発中。デバッグ可","14 章"],
        ["Deployed","量産・市場。デバッグは DC が必要","14 章"],
        ["Returned (RMA) / Bricked","返品分析用／恒久無効化","14 章"]],
       note:"★ UUID 限定のデバッグ証明書は、14 章の RMA ジレンマに対する洗練された解である"},
      {n:"EdgeLock ブランド",c:"--blue",
       rows:[
        ["EdgeLock secure enclave","SoC 内蔵のセキュリティサブシステム","07 章"],
        ["EdgeLock SE050 / SE051","★ 外付けセキュアエレメント（CC EAL6+ を公称）","22 章"],
        ["EdgeLock A5000","セキュア認証用","22 章"],
        ["EdgeLock 2GO","★ クラウドのプロビジョニング・鍵管理サービス","12 章"]],
       note:"★ EdgeLock 2GO のようなサービスを使えば、自社で PKI を構築せずに機器固有鍵と証明書を運用できる。小〜中規模には現実的"}
    ];
    var out=readout(el);
    picker(el,N,function(n){out.innerHTML=esc(n.note);return featureTable(n.rows);},{init:2,small:true});
  };

  /* ---------- 20: Espressif ---------- */
  REG.esp32=function(el){
    head(el,"Espressif","機能はある。問題は「有効化されない」こと");
    var E=[
      {n:"品種の整理",c:"--blue",
       rows:[
        ["ESP32（初代）","Xtensa LX6 ×2。★ Secure Boot v2 はリビジョン 3 以降","05 章"],
        ["ESP32-S2","Xtensa LX7 ×1。Secure Boot v2、Flash Encryption（XTS）","05・06 章"],
        ["ESP32-S3","Xtensa LX7 ×2。★ HMAC / DS ペリフェラル","06 章"],
        ["ESP32-C3","RISC-V。低コスト。Secure Boot v2、DS ペリフェラル","06 章"],
        ["ESP32-C6","RISC-V。Wi-Fi 6、Thread/Zigbee。★ ESP-TEE（ESP-IDF v5.4〜）","07 章"],
        ["ESP32-H2 / P4","Thread/Zigbee 専用／高性能（無線なし）","—"]],
       note:"★ 「ESP32」と一括りにしないこと。初代のリビジョン 1 では Secure Boot v2 が使えない。新規設計では S3 / C3 / C6 などを推奨"},
      {n:"eFuse（すべての土台）",c:"--alias",
       rows:[
        ["BLOCK0","各種の設定ビット（機能の有効／無効、保護フラグ）","06 章"],
        ["BLOCK_KEYn","★ ユーザ鍵の格納（S2/S3/C3 などは KEY0〜KEY5 の 6 ブロック）","06 章"],
        ["KEY_PURPOSE","★ 鍵ブロックに用途を宣言する。優れた設計","06 章"],
        ["読み出し保護 / 書き込み保護","焼くと CPU からも読めなくなる／二度と変更できなくなる","06 章"],
        ["SECURE_BOOT_KEY_REVOKE0/1/2","★ 3 個のダイジェストを個別に失効できる","12 章"]],
       note:"★ eFuse の操作はすべて不可逆。量産前に、捨ててよいチップで全手順を通しで検証すること"},
      {n:"Secure Boot v2",c:"--signal",
       rows:[
        ["署名アルゴリズム","RSA-PSS 3072（全世代）／ ECDSA（対応品種）","05 章"],
        ["eFuse に焼くもの","公開鍵のダイジェスト（SHA-256）。鍵本体はブートローダに含まれる","05 章"],
        ["ダイジェスト 3 個","★ 鍵の失効機構を持つ。この価格帯では特筆すべき点","12 章"],
        ["One-time flash","★ 量産ではこちら。以後は署名済みイメージしか書けない","14 章"],
        ["Reflashable","開発専用。★ 量産で使ってはいけない","14 章"]],
       note:"★ Secure Boot を有効にしても、UART ダウンロードモードや JTAG が開いていたら意味がない。DIS_DOWNLOAD_MODE と DIS_*_JTAG を必ず焼くこと"},
      {n:"Flash Encryption",c:"--signal",
       rows:[
        ["アルゴリズム","AES-256 XTS（S2/S3/C3 以降）／初代は AES-256（tweak 付き）","06 章"],
        ["鍵の場所","eFuse の鍵ブロック。読み出し保護をかける","06 章"],
        ["透過性","フラッシュコントローラが自動復号。★ XIP のまま動く","06 章"],
        ["Development モード","★ 平文の書き込みができる。開発専用","14 章"],
        ["Release モード","★★ 量産必須。平文の書き込みも UART での復号もできない","14 章"],
        ["守らないもの","★ 完全性（改ざん検出）。Secure Boot と両方必要","06 章"]],
       note:"★★ Development モードのまま出荷する事故が実際にある。この状態では攻撃者が UART 経由で平文を書き込めるので、Flash Encryption の意味がない"},
      {n:"HMAC / DS ペリフェラル",c:"--alias",
       rows:[
        ["HMAC ペリフェラル","eFuse の鍵で HMAC を計算。★ 鍵は CPU に現れない","06 章"],
        ["用途","チャレンジ・レスポンス認証、鍵導出、JTAG の一時的な有効化","11 章"],
        ["DS ペリフェラル","★ RSA / ECDSA の秘密鍵を、ソフトウェアに見せずに署名させる","06 章"],
        ["仕組み","秘密鍵を HMAC 鍵由来の鍵で暗号化して保存。DS が内部で復号して署名","06 章"],
        ["esp_secure_cert_mgr","★ DS を使った TLS クライアント認証（AWS IoT / Azure IoT 対応）","12・16 章"],
        ["限界","物理攻撃（クラス 4 以上）への耐性は専用 SE に及ばない","22 章"]],
       note:"★ 外付けセキュアエレメントなしで、ある程度の鍵保護が得られる。BOM コストを上げずに 06 章の「鍵の不可視化」を実現できるのは大きな価値"},
      {n:"その他と設定",c:"--blue",
       rows:[
        ["NVS 暗号化","★ Wi-Fi パスワードやトークンを守る。Flash Encryption と併せて有効化する","06 章"],
        ["ESP-TEE","ESP32-C6 以降。APM による Secure / Non-secure の分離（発展途上）","07 章"],
        ["OTA + ロールバック防止","app rollback support、anti-rollback を有効化する","13 章"],
        ["事前プロビジョニング","Espressif のモジュール事前プロビジョニングサービス","12 章"],
        ["起動時間","★ 署名検証と復号で数十〜数百 ms 増える。企画段階で織り込む","05 章"],
        ["確認コマンド","espefuse.py summary で最終状態を必ず確認する","14 章"]],
       note:"★ 出荷前に espefuse.py summary で確認: SECURE_BOOT_EN / SPI_BOOT_CRYPT_CNT（Release 相当）/ DIS_DOWNLOAD_MODE / 鍵ブロックの読み出し保護"}
    ];
    var out=readout(el);
    picker(el,E,function(e){out.innerHTML=esc(e.note);return featureTable(e.rows);},{init:3,small:true});
  };

  /* ---------- 21: その他ベンダ ---------- */
  REG.vendors=function(el){
    head(el,"Other Vendors","特徴の違いを押さえる");
    var V=[
      {n:"Nordic",c:"--blue",
       rows:[
        ["nRF52 シリーズ","Cortex-M4(F)。CryptoCell-310（一部）。★ TrustZone なし","07 章"],
        ["nRF5340","★ Cortex-M33 ×2（アプリ + ネットワーク）。TrustZone、SPU、CryptoCell-312、KMU","07 章"],
        ["nRF9160 / nRF91x","Cortex-M33。セルラー。TrustZone、SPU、KMU","07 章"],
        ["nRF54L / nRF54H","Cortex-M33 など。CRACEN、KMU、PSA 準拠の設計","08・17 章"],
        ["SPU","周辺・DMA の分離。ST の GTZC、NXP の AHB Secure Controller に相当","07 章"],
        ["KMU","★ 鍵を CPU に見せずに暗号エンジンへ供給する","06 章"],
        ["APPROTECT の教訓","★ 2020 年にグリッチ突破が公開実証。後継品種で対策済み","10 章"]],
       note:"★ nRF5340 の 2 コア構成が優れている。最も危険な BLE スタックをネットワークコアに置き、アプリケーションコアから物理的に分離できる（15 章）"},
      {n:"Silicon Labs",c:"--signal",
       rows:[
        ["Secure Vault Base","セキュアブート（RTSL）、セキュアデバッグアンロック、暗号アクセラレータ","05・11 章"],
        ["Secure Vault Mid","+ セキュアな鍵管理（専用セキュリティコア）、TRNG、DPA 対策","06・09 章"],
        ["Secure Vault High","★ + PUF ベースの鍵ラッピング、アンチタンパ、アテステーション、PSA Certified L3","06・10 章"],
        ["Secure Element（HSE / VSE）","★ 独立したコアがセキュリティ機能を担う","07 章"],
        ["アンチタンパ","複数の検出源（電圧・温度・グリッチ・デバッグ）と設定可能な応答（鍵消去）","10・14 章"],
        ["CPMS","★ Silicon Labs の工場でカスタム設定・鍵注入","12 章"]],
       note:"★ 3 段階の分け方が実務的に分かりやすい。02 章の攻撃者クラス 1〜2 → Base、クラス 3 → Mid、クラス 4 → High と対応づけられる"},
      {n:"Texas Instruments",c:"--blue",
       rows:[
        ["CC13xx / CC26xx","無線 MCU。AES、SHA、PKA、TRNG","08 章"],
        ["CC13x4 / CC26x4","★ Cortex-M33 + TrustZone","07 章"],
        ["AM6x / AM2x Sitara","HSM コア、セキュアブート","07 章"],
        ["GP（General Purpose）","セキュアブートなし。開発・評価向け","14 章"],
        ["HS-FS（Field Securable）","★ 後から鍵を焼いてセキュアにできる。在庫を分けなくてよい","14 章"],
        ["HS-SE（Security Enforced）","工場出荷時からセキュアブートが強制される","14 章"],
        ["keywriter","OTP への鍵注入を支援するツール","12 章"]],
       note:"★ HS-FS の中間状態が実用的。ただし「焼き忘れると開いたまま出荷される」ので、出荷検査でデバイスタイプを確認すること（14 章）"},
      {n:"Microchip",c:"--signal",
       rows:[
        ["ATECC608A/B","★ CryptoAuthentication セキュアエレメント。ECC P-256、AES、16 の鍵スロット","22 章"],
        ["Trust&GO","★ 設定済み・鍵注入済み・証明書入り。少量から使える","12 章"],
        ["TrustFLEX","一部カスタマイズ可能（自社 CA の証明書を入れられる）","12 章"],
        ["TrustCUSTOM","完全カスタム。大ロット向け","12 章"],
        ["SAM L11","Cortex-M23 + TrustZone。TrustRAM、データフラッシュ","07 章"],
        ["TrustRAM","★ アドレス／データのスクランブル、サイレントアクセス、タンパ時消去","09・11 章"],
        ["TA100 / TA101","自動車向けセキュア IC","22 章"],
        ["PolarFire SoC","RISC-V + FPGA。PUF、DPA 対策","06・09 章"]],
       note:"★ Trust&GO が小規模メーカーにとって非常に価値がある。数百円の追加で、12 章のプロビジョニングの困難がほぼ解消される"},
      {n:"Renesas",c:"--alias",
       rows:[
        ["RA ファミリ","Cortex-M23/M33/M4/M85。TrustZone、SCE / RSIP、DLM","07 章"],
        ["RX ファミリ","TSIP（Trusted Secure IP）","08 章"],
        ["RZ ファミリ","Cortex-A。TrustZone-A、OP-TEE","07 章"],
        ["DLM: CM → SSD","チップ製造時 → セキュア側の開発中","14 章"],
        ["DLM: NSECSD","★ 非セキュア側だけデバッグ可。実用的な中間状態","14 章"],
        ["DLM: DPL → LCK_DBG / LCK_BOOT","市場投入 → 恒久ロック","14 章"],
        ["DLM: RMA_REQ / RMA_ACK","★ 鍵を消してから開く。故障解析に対応","14 章"],
        ["鍵ラッピング","★ 平文の鍵を扱う API が存在しない。ラップ済み鍵の形でのみ扱う","06 章"]],
       note:"★ DLM の状態設計が丁寧。NSECSD（アプリ開発を続けながら鍵は保護）と RMA（消してから開く）は、14 章の悩みへの直接的な回答"},
      {n:"Infineon",c:"--signal",
       rows:[
        ["PSoC 64","★ Secure MCU。プリプロビジョニング済み。PSA Certified","12・17 章"],
        ["PSoC Edge (E84)","Cortex-M55 + Ethos-U55 + M33。エッジ AI 向け","17 章"],
        ["TRAVEO T2G","自動車向け。HSM 搭載","07 章"],
        ["AURIX TC3xx / TC4x","★ EVITA Full 相当の HSM（独立した Cortex-M コア）","07 章"],
        ["SHE","AUTOSAR の標準的な鍵管理仕様","06 章"],
        ["OPTIGA Trust M / E / Charge","★ セキュアエレメント（CC EAL6+ ハードウェア）","22 章"],
        ["OPTIGA TPM","TPM 2.0（SLB 967x）","22 章"]],
       note:"★ PSoC 64 は「MCU なのにセキュアエレメント並みのプロビジョニングが済んでいる」点が特徴的。PKI 運用の負担が大きく減る"},
      {n:"横断的な傾向",c:"--alias",
       rows:[
        ["PUF","NXP、Silicon Labs、Microchip（PolarFire）。★ 鍵が保存されない","06 章"],
        ["独立セキュリティコア","NXP (ELE)、Silicon Labs (HSE)、Infineon (HSM)、TI (HSM)。★ 最強の分離","07 章"],
        ["鍵ラッピングの徹底","Renesas (SCE/RSIP/TSIP)、NXP (Black Key/Blob)","06 章"],
        ["段階的な製品ライン","Silicon Labs (Vault Base/Mid/High)。攻撃者クラスに対応","02 章"],
        ["プリプロビジョニング","Microchip (Trust&GO)、Infineon (PSoC 64)、NXP (EdgeLock 2GO)","12 章"],
        ["ライフサイクル設計","Renesas (DLM)、ST（製品状態）、TI（デバイスタイプ）","14 章"],
        ["無線スタックの物理分離","Nordic (nRF5340 の 2 コア)","07・15 章"]],
       note:"★「どのベンダが一番安全か」は意味のない問い。①脅威モデルに必要な機能 ②第三者評価 ③攻撃事例への対応 ④ドキュメントとツール ⑤更新提供の姿勢——で判断する。実は ④ と ⑤ が最も差が出る"}
    ];
    var out=readout(el);
    picker(el,V,function(v){out.innerHTML=esc(v.note);return featureTable(v.rows);},{init:0,small:true});
  };

  /* ---------- 22: セキュアエレメントの比較 ---------- */
  REG.secompare=function(el){
    head(el,"Secure Element","めったに使わないが絶対に漏れてはいけない鍵を置く");
    var row=ctrls(el);
    var scls=select(row,"想定する攻撃者（02 章）",
      ["クラス 1〜2（好奇心・愛好家）","クラス 3（犯罪者・金銭目的）","クラス 4（競合・専門ラボ）","クラス 5（国家規模）"]);
    var srot=select(row,"MCU が持つ鍵の不可視化機構",
      ["なし（平文がフラッシュ／CPU に出る）","読み出し保護のみ","鍵スロット／鍵ラッピング／DS ペリフェラル","PUF + 独立セキュリティコア"]);
    var row2=ctrls(el);
    var sprov=checkbox(row2,"自社に HSM と CA の運用体制がある",false);
    var svol=slider(row2,"想定出荷台数（千台）",1,1000,50,1);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var cls=+scls.value+1,rot=+srot.value,prov=sprov.checked,vol=+svol.input.value;
      svol.val.textContent=vol+" 千台";
      /* 判定 */
      var needSE=(cls>=3)||(rot<=1)||(!prov&&rot<=2);
      var reason=[];
      if(cls>=3)reason.push("★ クラス "+cls+" では物理攻撃（DPA・フォールト・開封）が想定される。MCU 内蔵機能の多くは AVA_VAN.4 以上の評価を受けていない（09・10 章）");
      if(rot===0)reason.push("★ 鍵の不可視化機構がないと、ファームウェアの脆弱性ひとつで鍵が漏れる（06 章）");
      if(rot===1)reason.push("読み出し保護だけではグリッチ突破の余地がある（10 章）");
      if(!prov&&rot<=2)reason.push("★ HSM と CA の運用体制がないなら、プロビジョニング済み SE が最も現実的（12 章）");
      if(!needSE)reason.push("MCU 内蔵の機構で、この脅威モデルには対応できる");
      /* コスト比較 */
      var seCost=vol*1000*0.15;               /* 1 個 150 円と仮定（千円単位で表示） */
      var pkiCost=3000+vol*0.5;               /* HSM+CA 構築 300 万円 + 運用 */
      out2.innerHTML=
        tbl(["観点","MCU 内蔵","セキュアエレメント"],[
          ["物理攻撃耐性",rot>=3?"PUF + 専用コアなら高い":"品種による。多くは評価対象外","★ 設計の前提。CC EAL6+ / AVA_VAN.5 の製品がある"],
          ["プロビジョニング",prov?"自社 PKI で対応できる":"★ 体制構築が必要","★ プロビジョニング済み品を買うだけ"],
          ["速度","高速（AES アクセラレータ）","★ 遅い（I2C 経由で ECDSA 1 回に数十〜数百 ms）"],
          ["BOM コスト","追加なし","数十〜数百円"],
          ["適した用途","セッション鍵、大量データの暗号化","★ 長期の機器固有鍵、クラウド認証の証明書"],
          ["注意点","鍵の不可視化機構の有無を確認（06 章）","★ I2C バスの中間者対策、供給の長期安定性"]
        ])+
        '<div style="margin-top:.6rem;color:var(--muted)">概算コスト比較（あくまで目安）</div>'+
        tbl(["方式","初期費用","'+vol+' 千台での総額（概算）"],[
          ["セキュアエレメント（150 円/個 と仮定）","小","約 "+f(seCost/1000,1)+" 百万円"],
          ["自社 PKI（HSM + CA 構築・運用）","★ 大（HSM 数百万円〜）","約 "+f(pkiCost/1000,1)+" 百万円 + 継続的な監査工数"]
        ]);
      out.innerHTML='<b class="'+(needSE?"warn":"ok")+'">'+
        (needSE?"セキュアエレメントの採用を推奨":"MCU 内蔵機能で対応できる可能性が高い")+'</b>'+
        ' ／ '+reason.map(esc).join(' ／ ')+
        ' ／ <b class="warn">「全部 SE に入れる」は間違い。</b>SE は遅い。'+
        '正しい構成は <b>「SE で 1 回だけ鍵共有や署名 → MCU がセッション鍵を得る → 以後は MCU の AES で高速処理」</b>'+
        ' ／ <b>SE があっても MCU 側の対策は不要にならない。</b>'+
        'I2C バスの中間者、ファームウェアの改ざん、デバッグポート——これらは MCU 側で守る'+
        ' ／ <b>SE 故障時に安全側に倒すか可用性側に倒すかを、明示的に決めて文書化すること</b>';
    }
    [scls,srot].forEach(function(s){s.addEventListener("change",draw);});
    sprov.addEventListener("change",draw);
    svol.input.addEventListener("input",draw);
    reg(null,draw);draw();
  };

  /* ---------- 23: SoC 機能セレクタ ---------- */
  REG.selector=function(el){
    head(el,"SoC Selector","要件から必要な機能を導く");
    var row=ctrls(el);
    var scls=select(row,"想定する攻撃者",
      ["クラス 1〜2（好奇心・愛好家）","クラス 3（犯罪者・金銭目的）","クラス 4〜5（専門ラボ・国家）"]);
    var seu=checkbox(row,"EU で販売する（CRA / RED）",true);
    var srad=checkbox(row,"無線を搭載する",true);
    var row2=ctrls(el);
    var sext=checkbox(row2,"外付けフラッシュを使う",false);
    var sbat=checkbox(row2,"電池駆動である",false);
    var srma=checkbox(row2,"返品分析（RMA）が必要",true);
    var row3=ctrls(el);
    var sfw=slider(row3,"アプリのフラッシュ使用量（KB）",64,2048,300,16);
    var scert=checkbox(row3,"第三者認証（PSA / SESIP / CC）を取得したい",false);
    var out2=panel(el);
    var out=readout(el);
    function draw(){
      var cls=+scls.value,fw=+sfw.input.value;
      sfw.val.textContent=fw+" KB";
      var need=[];
      /* レベル A（必須） */
      need.push(["セキュアブート（ROM ベース）","必須","05 章","改ざんされたファームウェアを起動させない。全対策の前提"]);
      need.push(["ROTPK 用の OTP","必須","05・06 章","公開鍵ハッシュ 32 B を焼く。★ 複数スロットと失効機構があるか確認"]);
      need.push(["A/B 面が取れるフラッシュ","必須","13 章","必要量 ≈ "+(fw*2+80)+" KB 以上（ブートローダ + アプリ×2 + 余裕）"]);
      need.push(["単調カウンタ","必須","13 章","ロールバック防止。OTP のビット列でも可"]);
      need.push(["ハードウェア TRNG","必須","08 章","NIST SP 800-90B / AIS 31 準拠を確認する"]);
      need.push(["読み出し保護 / デバッグ無効化","必須","11・14 章","最も安く、最も効果が大きい対策"]);
      need.push(["機器固有鍵の保管先","必須","06・12 章","★ 全台共通鍵は使わない。最大の防御はここ"]);
      if(seu.checked){
        need.push(["セキュア OTA の実装余地","必須","13 章","★ CRA がサポート期間中の更新提供を義務化"]);
        if(srad.checked)need.push(["EN 18031 への適合","必須","03 章","★ RED 委任規則が 2025 年 8 月から適用"]);
      }
      /* レベル B */
      if(cls>=1){
        need.push(["TrustZone-M（Armv8-M）","推奨","07 章","脆弱性を突かれても鍵を守る。Cortex-M23/M33/M55/M85"]);
        need.push(["周辺・DMA の分離機構","推奨","07 章","GTZC / SPU / AHB Secure Controller など。★ CPU だけでは足りない"]);
        need.push(["鍵の不可視化（鍵スロット・ラッピング）","推奨","06 章","平文の鍵を CPU バスに出さない"]);
        need.push(["公開鍵アクセラレータ（PKA）","推奨","05・08 章","ECDSA 検証がソフトウェアだと数百 ms。起動時間と電池に効く"]);
      }
      if(srma.checked)need.push(["認証付きデバッグ","推奨","11・14 章","★ RMA 対応の切り札。完全ロックすると故障解析ができない"]);
      if(sext.checked)need.push(["オンザフライ復号","推奨","06 章","OTFDEC / PRINCE / BEE / Flash Encryption。★ 完全性は別途"]);
      if(sbat.checked)need.push(["低消費電力の暗号エンジン","推奨","08 章","演算時間はそのまま電力。TLS ハンドシェイクの頻度も設計する"]);
      /* レベル C */
      if(cls>=2){
        need.push(["DPA 対策済み暗号エンジン","必須","09 章","ST の SAES など。★ 「AES がある」とは別"]);
        need.push(["フォールト検出（電圧/クロック/温度/光）","必須","10 章","グリッチによる保護バイパスへの対策"]);
        need.push(["PUF または独立セキュリティコア","推奨","06・07 章","鍵が保存されない／メインコアから完全分離"]);
        need.push(["セキュアエレメント","推奨","22 章","長期の機器固有鍵は CC EAL6+ / AVA_VAN.5 の SE へ"]);
      }
      if(scert.checked){
        need.push(["PSA Certified 取得済みチップ","推奨","03・17 章",
          cls>=2?"★ Level 3（物理攻撃耐性を含む）":"★ Level 2 以上（コンポジションで製品認証が楽になる）"]);
        need.push(["TF-M の公式ポート","推奨","17 章","PSA Functional API で書ける。移植性も上がる"]);
      }
      var must=need.filter(function(n){return n[1]==="必須";}).length;
      out2.innerHTML=tbl(["必要な機能","重み","章","理由・注意"],
        need.map(function(n){return ['<b>'+esc(n[0])+'</b>',
          '<b class="'+(n[1]==="必須"?"warn":"")+'">'+n[1]+'</b>',esc(n[2]),esc(n[3])];}));
      var flashNeed=fw*2+80;
      out.innerHTML='必要な機能 <b>'+need.length+'</b> 件（うち必須 <b class="warn">'+must+'</b> 件）'+
        ' ／ フラッシュは最低 <b class="'+(flashNeed>1024?"warn":"")+'">'+flashNeed+' KB</b> 必要'+
        (flashNeed>1024?'（<span class="warn">1 MB を超える。品種選定で制約になる</span>）':'')+
        ' ／ '+(cls>=2
          ? '<b class="warn">物理攻撃対策が要る水準である。</b>MCU 内蔵機能だけでは足りないことが多い。'+
            'PSA Certified L3 / SESIP 4 / CC AVA_VAN.4 以上の取得状況で判断すること'
          : (cls===1
            ? '<b>クラス 3 対策の核心は「機器ごとに違う鍵」である。</b>'+
              'これだけで大量攻撃の経済性が崩壊する。高価なハードウェアより先にこの設計をすること（12 章）'
            : '<b class="ok">この水準なら、追加の部品コストなしで大部分を達成できる。</b>'+
              '設定とビルド構成の見直しが中心（11 章のチェックリスト）'))+
        ' ／ <b class="warn">これらの判断は、基板を起こす前に行うこと。</b>'+
        'SoC・RoT 方式・OTP サイズ・フラッシュ容量は後から変えられない（01 章）';
    }
    [scls].forEach(function(s){s.addEventListener("change",draw);});
    [seu,srad,sext,sbat,srma,scert].forEach(function(c){c.addEventListener("change",draw);});
    sfw.input.addEventListener("input",draw);
    reg(null,draw);draw();
  };

  /* ---------- 23: 設計チェックリスト ---------- */
  REG.checklist=function(el){
    head(el,"Review Checklist","分野を選んで、設計・コードレビューで使う");
    var CL={
      "企画・アーキテクチャ":[
        ["保護資産を定義したか","完全性／機密性／知的財産／可用性。対策が違うので分ける（01 章）"],
        ["想定攻撃者クラスを決めたか","クラス 1〜5。製品カテゴリごとに線を引く（02 章）"],
        ["信頼境界を図示したか","脅威は境界をまたぐところで発生する（02 章）"],
        ["STRIDE で脅威を洗い出したか","IoT では S・T・I が支配的（02 章）"],
        ["受容するリスクを明記したか","「クラス 4 以上は受容する」と書く（02 章）"],
        ["販売地域と適用規制を確認したか","CRA / RED / PSTI / IEC 62443（03 章）"],
        ["サポート期間を決めたか","CRA・PSTI が明示を要求する（03 章）"],
        ["セキュリティ目標を 1 ページで文書化したか","以降の全判断の基準になる（02 章）"]
      ],
      "SoC 選定":[
        ["セキュアブートの方式と ROTPK のスロット数","★ 鍵漏洩時に切り替えられるか（05・12 章）"],
        ["フラッシュ容量が A/B 面 + ブートローダ + セキュア FW に足りるか","★ 後から変えられない（13 章）"],
        ["OTP の容量が必要な鍵とカウンタに足りるか","ROTPK ハッシュ・HUK・LCS・単調カウンタ（06・13 章）"],
        ["鍵の不可視化機構があるか","鍵スロット／ラッピング／PUF／DS ペリフェラル（06 章）"],
        ["TrustZone または相当の分離があるか","Armv8-M / RISC-V の独自機構（07 章）"],
        ["周辺と DMA の分離ができるか","★ CPU だけ分けても DMA が素通りなら無意味（07 章）"],
        ["TRNG が標準準拠か","NIST SP 800-90B / AIS 31（08 章）"],
        ["公開鍵演算の速度が起動時間要件を満たすか","ソフトウェアだと数百 ms（05・08 章）"],
        ["外部フラッシュを使うならオンザフライ復号があるか","OTFDEC / PRINCE / Flash Encryption（06 章）"],
        ["認証付きデバッグがあるか","★ RMA 対応の切り札（11・14 章）"],
        ["PSA Certified / SESIP / CC の取得状況","★ 公式サイトでレベルを確認する（03 章）"],
        ["公知の攻撃事例と対応状況","「チップ名 + glitch」で検索。★ 対応したかを見る（10 章）"],
        ["10〜20 年の供給が見込めるか","長寿命機器では致命的（14 章）"]
      ],
      "鍵とプロビジョニング":[
        ["★ 機器ごとに違う鍵を使うか","最重要。攻撃の経済性が崩壊する（12 章）"],
        ["鍵の生成場所を決めたか","チップ内生成 ＞ HSM 注入 ＞ 開発 PC（危険）（12 章）"],
        ["工場に平文の鍵を渡さない仕組みがあるか","SFI / EdgeLock 2GO / プロビジョニング済み SE（12 章）"],
        ["オーバービルド対策があるか","HSM の発行数カウント（12 章）"],
        ["テスト鍵と本番鍵が分離されているか","★ テスト鍵は全員の PC にある（14 章）"],
        ["本番の署名鍵は HSM にのみあるか","人間が値を見られない。CI の承認つきジョブから使う（12・13 章）"],
        ["ROTPK が漏れたときの切り替え手段があるか","複数スロットと失効機構（12 章）"],
        ["デバイス ID が秘密鍵の所持で証明される形か","★ UID や MAC では認証にならない（12 章）"],
        ["証明書の有効期間が機器寿命と整合しているか","長期の製造証明書 + 短期の運用証明書（12 章）"]
      ],
      "実装":[
        ["★ 署名検証で公開鍵を OTP のハッシュと照合しているか","飛ばすと署名検証が完全に無意味になる（05 章）"],
        ["ヘッダも署名対象に含まれているか","含めないとロードアドレスを書き換えられる（05 章）"],
        ["検証の分岐がフォールト耐性を持つか","デフォルト失敗・二重検証・冗長値・CFI（10 章）"],
        ["秘密値の比較が定時間実装か","ライブラリの ct_memcmp を使う。自作しない（09 章）"],
        ["RSA-CRT の署名後に検証しているか","Bellcore 攻撃対策。1 個の故障で鍵が求まる（10 章）"],
        ["★ TrustZone の入口でポインタ検証をしているか","cmse_check_address_range。Confused Deputy（07 章）"],
        ["Secure 側に入力パーサを入れていないか","TCP/IP・JSON パーサは Non-secure 側へ（07 章）"],
        ["鍵バッファを使用後に zeroize しているか","memset は最適化で消える（08 章）"],
        ["AEAD を使い IV を再利用していないか","GCM / CCM / ChaCha20-Poly1305（08 章）"],
        ["乱数取得の失敗で止まる設計か","0 で埋まった鍵を使う事故がある（08 章）"],
        ["★ TLS の証明書検証とホスト名検証が有効か","set_hostname の呼び忘れが多い（16 章）"],
        ["信頼する CA を自社のものに限定しているか","パブリック CA を全部信頼しない（16 章）"],
        ["★ ファームウェアに秘密が埋まっていないか","strings で出る。規制でも禁止（11 章）"],
        ["デバッグ用コードが量産ビルドから除去されているか","実行時フラグでは不十分（11 章）"],
        ["コンパイラの警告とスタック保護が有効か","-Wall -Wextra -Werror -fstack-protector-strong（15 章）"]
      ],
      "検証・出荷":[
        ["★ 量産と同じ設定で全機能を検証したか","出荷直前の有効化は最悪の判断につながる（14 章）"],
        ["不正な証明書を提示して拒否されるか実機で試験したか","自己署名／期限切れ／別ホスト名／失効（16 章）"],
        ["改ざんしたファームウェアが起動しないか試験したか","意図的に 1 バイト変えて確認する（05 章）"],
        ["古いバージョンへのロールバックが拒否されるか試験したか","SVN の動作確認（13 章）"],
        ["CI で strings とシークレットスキャンを回しているか","人間のレビューでは必ず見落とす（11 章）"],
        ["ファジングをプロトコル処理に実行したか","ホスト上で AFL++ / libFuzzer + ASan（15 章）"],
        ["SBOM を生成したか","CRA の要求。BLE/Wi-Fi スタックが盲点（15 章）"],
        ["既知の脆弱性がないか確認したか","CRA は「既知の脆弱性なしで出荷」を要求（03・15 章）"],
        ["★ LCS を進める工程が量産手順書にあるか","最頻出の事故。進め忘れると全数が開いたまま（14 章）"],
        ["出荷検査で LCS とデバッグ無効化を確認しているか","抜き取りで実際にデバッガを繋いでみる（14 章）"],
        ["eFuse / オプションバイトの最終状態を確認したか","espefuse.py summary 等で（20 章）"],
        ["リカバリ・ISP 経路が無効化されているか","「保護してもブートローダから読めた」事故（11 章）"]
      ],
      "運用":[
        ["脆弱性開示ポリシーと security.txt を公開したか","PSTI・CRA・EN 303 645 が要求（15 章）"],
        ["ベンダのセキュリティアドバイザリを購読しているか","チップ・RTOS・スタックのすべて（15 章）"],
        ["SBOM と脆弱性 DB の照合を自動化したか","Dependency-Track など。VEX で影響評価を記録（15 章）"],
        ["OTA の段階的展開ができるか","1% → 10% → 100%。問題があれば止める（13 章）"],
        ["更新の成否を把握できるか","どれだけ失敗したかを知る手段（13 章）"],
        ["インシデント報告の体制があるか","★ CRA は 24 時間以内の早期警告（03 章）"],
        ["サポート終了後の動作を定義したか","クラウドが止まったらどう動くか（14 章）"],
        ["工場出荷時リセットとクラウド側の紐づけ解除が連動するか","★ 元所有者が新所有者を覗ける事故（14 章）"],
        ["ユーザデータが暗号化されて保存されているか","暗号消去（鍵だけ消す）を可能にする（14 章）"]
      ]
    };
    var keys=Object.keys(CL);
    var row=ctrls(el);
    var ssel=select(row,"分野",keys);
    var wrap=mk("div","wscreen");wrap.style.padding=".7rem";el.appendChild(wrap);
    var out=readout(el);
    var state={};
    function render(){
      var k=keys[+ssel.value],items=CL[k];
      var h='<div style="display:flex;flex-direction:column;gap:.32rem">';
      items.forEach(function(it,i){
        var id=k+"#"+i,on=!!state[id];
        h+='<div data-id="'+esc(id)+'" style="cursor:pointer;padding:.28rem .1rem;display:flex;gap:.5rem;align-items:flex-start">'+
           '<span style="flex:none;color:var('+(on?"--signal":"--faint")+');font-family:var(--mono)">'+
           (on?"☑":"☐")+'</span><span>'+
           '<span style="'+(on?"color:var(--muted);text-decoration:line-through":"")+'">'+esc(it[0])+'</span>'+
           '<div style="color:var(--muted);font-size:.86em">→ '+esc(it[1])+'</div></span></div>';
      });
      h+='</div>';
      wrap.innerHTML=h;
      wrap.querySelectorAll("[data-id]").forEach(function(d){
        d.addEventListener("click",function(){
          var id=d.getAttribute("data-id");state[id]=!state[id];render();});
      });
      var done=items.filter(function(_,i){return state[k+"#"+i];}).length;
      var total=0,alldone=0;
      keys.forEach(function(kk){total+=CL[kk].length;
        CL[kk].forEach(function(_,i){if(state[kk+"#"+i])alldone++;});});
      out.innerHTML='この分野 <b>'+done+' / '+items.length+'</b> ／ 全体 <b>'+alldone+' / '+total+'</b>'+
        (done<items.length?' ／ <span class="warn">未確認 '+(items.length-done)+' 項目</span>':' ／ <span class="ok">この分野は確認済み</span>')+
        ' ／ <b>★ が付いた項目は、実際の事故で頻出するものである</b>'+
        ' ／ 高度な対策より先に、<b class="warn">基本の穴（機器固有鍵・デバッグ遮断・秘密の除去・証明書検証・更新機能）を全部塞ぐこと</b>。'+
        '攻撃者は常に最も安い経路を選ぶ';
    }
    ssel.addEventListener("change",render);
    reg(null,render);render();
  };

  function init(){
    document.querySelectorAll("[data-widget]").forEach(function(el){
      if(el.dataset.done)return; el.dataset.done="1";
      var fn=REG[el.getAttribute("data-widget")];
      if(fn){try{fn(el);}catch(e){el.innerHTML='<div style="color:var(--alias);font-family:var(--mono);font-size:.8rem">demo error: '+esc(e.message)+'</div>';}}
    });
    requestAnimationFrame(redrawAll);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
