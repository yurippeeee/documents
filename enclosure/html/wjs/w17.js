  /* ============ 17. checklist — 全章のチェックリスト ============ */
  REG.checklist=function(el){
    head(el,"17","全章のチェックリスト");
    var CH=[
      ["01","筐体設計とは",["使用環境・作る数・目標コスト・守る規格を書き出した","作る数から製法を選んだ（初期費用 F と変動費 v）","EVT / DVT / PVT の日程と評価項目を決めた"]],
      ["02","力と変形",["荷重がかかる部分の応力 σ と安全率を確かめた","たわみ δ と剛性 k を見積もった"]],
      ["03","材料",["使用温度に対して荷重たわみ温度に余裕がある","長時間荷重がかかる部分のクリープを考えた","必要な難燃性の等級を確かめた"]],
      ["04","射出成形",["すべての立ち壁に抜き勾配がある","肉厚が均一で急変が無い","アンダーカットを無くしたか、スライドの費用を見込んだ"]],
      ["05","リブとボス",["リブの厚さと高さが目安の範囲にある","ボスを壁やガセットで支えた","外面のひけを確かめた"]],
      ["06","板金",["曲げ半径が最小曲げ半径以上","展開長を曲げ代から計算した","穴と曲げの距離を確保した"]],
      ["07","公差",["重要な寸法の積み上げを計算した（ワーストケースと RSS）","一般公差と個別の公差を図面で区別した"]],
      ["08","ねじ締結",["締付トルクと軸力を決めた","ボスの下穴を業者の基準で決めた","ゆるみ対策を決めた"]],
      ["09","スナップフィット",["根元ひずみが許容ひずみ以下","組み付け力と外し方を確かめた"]],
      ["10","内部の収め方",["基板の固定とクリアランスを決めた","熱膨張差を見積もった","コネクタと穴の位置合わせを確かめた"]],
      ["11","落下と衝撃",["落下の高さから速度と加速度を見積もった","角落下・面落下で弱い所を確かめた"]],
      ["12","防水と防塵",["目標の IP コードを決めた","ガスケットのつぶし率と溝を決めた","温度変化による内部圧力を考えた"]],
      ["13","熱設計",["発熱と許容温度から熱抵抗の目標を決めた","表面温度を確かめた"]],
      ["14","EMC",["開口（スロット）の長さと遮蔽効果を確かめた","接地と導電ガスケットの経路を決めた","ESD の経路を考えた"]],
      ["15","安全と規格",["エネルギー源を分類し、安全防護を決めた","防火用筐体の要否と材料の難燃性を確かめた","空間距離・沿面距離と試験指を確かめた"]],
      ["16","外観と操作部",["意匠面を決め、成形の跡の位置を合意した","見切りを段や溝にした","印刷の摩耗を確かめた","ボタンの押し荷重とひずみを計算した","導光の曲げと光漏れを確かめた"]]
    ];
    var KEY="enclosure-17-checklist", st={};
    try{var raw=window.localStorage.getItem(KEY);if(raw)st=JSON.parse(raw)||{};}catch(e){st={};}
    function save(){try{window.localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
    var row=ctrls(el), bAll=button(row,"すべてチェック"), bClr=button(row,"すべて外す");
    var cv=screen(el,170), cc=cctx(cv), ro=readout(el);
    var list=mk("div");list.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.6rem 1rem;margin-top:.8rem";
    el.appendChild(list);
    var boxes=[];
    CH.forEach(function(ch,ci){
      var g=mk("div");g.style.cssText="border:1px solid var(--line);border-radius:10px;padding:.5rem .7rem;background:var(--screen)";
      g.appendChild(mk("div",null,'<b style="font-family:var(--mono);color:var(--signal)">'+ch[0]+'</b> <span style="font-size:.85rem;font-weight:700">'+esc(ch[1])+'</span>'));
      ch[2].forEach(function(t,ti){
        var id=ch[0]+"-"+ti, lb=mk("label");
        lb.style.cssText="display:flex;gap:.45rem;align-items:flex-start;font-size:.82rem;line-height:1.45;margin-top:.3rem;cursor:pointer";
        var cb=mk("input");cb.type="checkbox";cb.checked=!!st[id];cb.style.cssText="flex:none;margin:.2rem 0 0;accent-color:var(--signal)";
        lb.appendChild(cb);lb.appendChild(mk("span",null,esc(t)));g.appendChild(lb);
        cb.addEventListener("change",function(){if(cb.checked)st[id]=1;else delete st[id];save();draw();});
        boxes.push([id,cb,ci]);
      });
      list.appendChild(g);
    });
    function setAll(v){boxes.forEach(function(b){b[1].checked=v;if(v)st[b[0]]=1;else delete st[b[0]];});save();draw();}
    bAll.addEventListener("click",function(){setAll(true);});
    bClr.addEventListener("click",function(){setAll(false);});
    function draw(){
      var n=CH.map(function(){return 0;}),m=CH.map(function(c){return c[2].length;}),tot=0;
      boxes.forEach(function(b){if(b[1].checked){n[b[2]]++;tot++;}});
      var c=chart(cc,-0.5,CH.length-0.5,0,100,{l:40,r:10,t:24,b:26});
      grid(c,4); axis(c);
      for(var k=0;k<=4;k++)lab(c.ctx,(k*25)+"",c.p.l-6,c.Y(k*25)+4,C("--muted"),"right",10);
      lab(c.ctx,"達成率 [%]",c.p.l-30,c.p.t-12,C("--muted"),"left",10);
      var bw=Math.max(4,(c.X(1)-c.X(0))*0.62);
      CH.forEach(function(ch,i){
        var p=100*n[i]/m[i], x=c.X(i)-bw/2;
        c.ctx.fillStyle=C("--line");rrect(c.ctx,x,c.Y(100),bw,c.Y(0)-c.Y(100),3);c.ctx.globalAlpha=0.35;c.ctx.fill();c.ctx.globalAlpha=1;
        if(p>0){c.ctx.fillStyle=p>=100?C("--signal"):C("--blue");rrect(c.ctx,x,c.Y(p),bw,c.Y(0)-c.Y(p),3);c.ctx.fill();}
        lab(c.ctx,ch[0],c.X(i),c.h-10,C("--muted"),"center",10);
      });
      var all=boxes.length, pc=Math.round(100*tot/all), done=n.filter(function(v,i){return v===m[i];}).length;
      ro.innerHTML='<div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap">'+
        '<div style="flex:1;min-width:180px;height:12px;border-radius:6px;background:var(--line);overflow:hidden">'+
        '<div style="height:100%;width:'+pc+'%;background:var(--signal)"></div></div>'+
        '<b>'+tot+' / '+all+' 項目（'+pc+' %）</b><span style="color:var(--muted)">全項目チェック済みの章: '+done+' / '+CH.length+'</span></div>';
    }
    reg(cv,draw); draw();
  };
