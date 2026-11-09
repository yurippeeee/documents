  /* ===== 03 章 実例 システム仕様書（温湿度ロガー LG-SYS-001 版 1.0） ===== */
  /* 要求の表（4・5 節）と対応表（6 節）のデータ。$SP/s03/gen.py が本文の表と同じデータから書き出す */
  var _W03_REQ=[{"id":"SR-F01","c":"F","g":"測定と記録","t":"記録中は、記録の間隔ごとに温度と相対湿度を測定すること","why":"保管と輸送の間の温度と湿度の履歴を、後で確かめるため（要求仕様書）","m":"T","st":"ST-001","pt":"記録の間隔 10 分で 24 時間記録し、144 件の記録が 10 分ごとにあり、どの記録にも温度と湿度があること"},{"id":"SR-F02","c":"F","g":"測定と記録","t":"記録の間隔を 1〜60 分の範囲で 1 分きざみに設定できること（初期値は 10 分）","why":"品目と期間に合わせて間隔を選ぶため。10 分は要求仕様書のふつうの使い方","m":"T","st":"ST-002","pt":"1 分と 60 分を設定でき、0 分と 61 分は受け付けないこと。初期値が 10 分であること"},{"id":"SR-F03","c":"F","g":"測定と記録","t":"測定ごとに、時刻・温度・湿度・状態の印（警報・時刻未設定・電池少・測定異常）を 1 件の記録として保存すること","why":"1 件の記録だけで、いつ・何度で・何が起きていたかが分かるようにするため","m":"T","st":"ST-003","pt":"読み出した記録に時刻・温度・湿度と 4 つの印があること。センサの応答を止めたときの記録に測定異常の印が付くこと"},{"id":"SR-F04","c":"F","g":"測定と記録","t":"52 560 件（記録の間隔 10 分で 365 日分）以上の記録を保存できること","why":"1 年の保管の間、読み出さずに記録を残すため（要求仕様書）","m":"T","st":"ST-004","pt":"記録の間隔 1 分で 52 560 件（36.5 日）記録し、全部を読み出せること"},{"id":"SR-F05","c":"F","g":"測定と記録","t":"記録が記録の容量に達したときの動作を、「上書き」と「記録を止める」から設定できること（初期値は上書き）","why":"新しい記録を残したい使い方と、始めからの記録を残したい使い方があるため","m":"T","st":"ST-005","pt":"容量に達した後、「上書き」では最も古い記録から置き換わって記録が続き、「記録を止める」では停止中になること。初期値が上書きであること"},{"id":"SR-F06","c":"F","g":"開始・停止・読み出し・時刻","t":"ボタンの長押しで、記録を開始・停止できること","why":"アプリの無い場所でも、その場で開始・停止できるようにするため","m":"T","st":"ST-006","pt":"停止中に長押しすると記録中に、記録中に長押しすると停止中になること"},{"id":"SR-F07","c":"F","g":"開始・停止・読み出し・時刻","t":"アプリから、記録を全部、または前回の読み出しより後に保存した分だけ読み出せること","why":"毎回全部を読むと時間がかかるので、新しい分だけを読めるようにするため","m":"T","st":"ST-007","pt":"全部の読み出しで全件を、差分の読み出しで前回の読み出しの後の記録だけを受け取ること"},{"id":"SR-F08","c":"F","g":"開始・停止・読み出し・時刻","t":"アプリと接続するたびに、ロガーの時計を、アプリから受け取った時刻に 1 秒以内の差で合わせること","why":"時計のずれ（SR-P04）が、使うたびに戻るようにするため","m":"T","st":"ST-008","pt":"ロガーの時計を 1 時間ずらしておき、接続した後のロガーの時計とアプリの時刻の差が 1 秒以内であること"},{"id":"SR-F09","c":"F","g":"開始・停止・読み出し・時刻","t":"電池を入れてから最初に時刻を合わせるまでに保存した記録には、時刻未設定の印を付けること","why":"時刻の正しくない記録を、正しい記録と取り違えないため","m":"T","st":"ST-009","pt":"電池を入れてから接続するまでの記録に時刻未設定の印があり、接続の後の記録には無いこと"},{"id":"SR-F10","c":"F","g":"警報","t":"記録の温度が警報の上限より高いか、警報の下限より低いときは、その記録に警報の印を付けること（初期値は上限 8.0 °C・下限 2.0 °C）","why":"範囲を外れた記録を、後で見分けられるようにするため。初期値は冷蔵の医薬品の範囲（要求仕様書）","m":"T","st":"ST-010","pt":"上限と下限の前後の温度（上限 8.0 °C ちょうどは印なし、8.1 °C は印あり。下限も同じ）の記録で、警報の印が要求どおりに付くこと。初期値が 8.0 °C と 2.0 °C であること"},{"id":"SR-F11","c":"F","g":"警報","t":"警報の表示は、アプリで記録を読み出した利用者が確認の操作をするまで続けること","why":"温度が一時だけ外れて戻ったときも、受け取った人が見逃さないため","m":"T","st":"ST-011","pt":"温度を上限の外へ出して戻した後も、確認の操作まで警報の表示が続き、確認の後に止まること"},{"id":"SR-F12","c":"F","g":"設定と電池","t":"アプリから、記録の間隔・容量に達したときの動作・警報の上限と下限を設定できること","why":"品目ごとに設定を変えるため","m":"T","st":"ST-012","pt":"3 つの設定を、アプリからそれぞれ変えられること"},{"id":"SR-F13","c":"F","g":"設定と電池","t":"電池の残りが少ないことを、記録を止める 14 日以上前（SR-W02 の使い方の条件で）に、LED とアプリで知らせること","why":"記録が途切れる前に電池を手配して替えるため（手配に 14 日。要求仕様書）","m":"A","st":"ST-013","pt":"電池の残りを模擬して、電池少の印が付く時と記録を止める時を試験で求め、SR-W02 の使い方の条件で、その間が 14 日以上あることを計算で示す"},{"id":"SR-F14","c":"F","g":"開始・停止・読み出し・時刻","t":"アプリから、記録を開始・停止できること","why":"ロガーに触れずに（箱に入れたまま）開始・停止できるようにするため","m":"T","st":"ST-014","pt":"接続中にアプリから開始と停止を指示し、主のモードがそのとおりに変わること"},{"id":"SR-F15","c":"F","g":"警報","t":"警報の印を付けた記録を保存したときは、LED で知らせること（警報の表示。表 3-5）","why":"受け取った場所で、アプリが無くても範囲を外れたことが分かるようにするため","m":"T","st":"ST-015","pt":"警報の印の付く記録を保存した後、表 3-5 の警報の表示が始まること"},{"id":"SR-F16","c":"F","g":"警報","t":"警報の上限と下限を、−20.0〜+60.0 °C の範囲で 0.1 °C きざみに設定できること","why":"品目ごとの保管の温度に合わせるため（要求仕様書）","m":"T","st":"ST-016","pt":"−20.0 °C と +60.0 °C を設定でき、−20.1 °C と +60.1 °C は受け付けないこと。0.1 °C きざみで設定できること"},{"id":"SR-F17","c":"F","g":"設定と電池","t":"アプリで設定した値を、電池を外した後も保持すること","why":"電池の交換で初期値に戻ると、気付かずに違う設定で記録するため","m":"T","st":"ST-017","pt":"3 つの設定を変えてから電池を外して入れ直し、変えた値のままであること"},{"id":"SR-U01","c":"U","g":"操作と表示","t":"ボタンは 1 個とし、短押し（1 秒未満）と長押し（3 秒以上）を区別すること","why":"部品と穴を減らし（SR-E03）、1 つのボタンで 2 つの操作をするため","m":"T","st":"ST-018","pt":"ボタンが 1 個であること。0.5 秒押して離すと短押しとして、3.5 秒押すと 3 秒の時点で長押しとして扱うこと"},{"id":"SR-U02","c":"U","g":"操作と表示","t":"短押しで、今の状態を LED で示すこと（状態の応答。表 3-5）","why":"アプリが無くても、記録しているかをその場で確かめられるようにするため","m":"T","st":"ST-019","pt":"停止中と記録中のそれぞれで短押しし、表 3-5 の状態の応答が出ること"},{"id":"SR-U03","c":"U","g":"操作と表示","t":"LED の表示は、表 3-5 の表示と表 3-6 の決まり（重なるときの優先順位を含む）のとおりにすること","why":"説明書と試験で、表示の意味を同じにするため","m":"T","st":"ST-020","pt":"表 3-5 の各行の表示と、表 3-6 の決まり（30 秒ごとの表示の選び方・重なったときに省く表示）が表のとおりであること"},{"id":"SR-U04","c":"U","g":"操作と表示","t":"長押しで記録を開始したら、緑を 3 回点滅させること","why":"開始を受け付けたことを、その場で確かめられるようにするため","m":"T","st":"ST-021","pt":"長押しで記録を開始したときに、緑を 3 回点滅すること"},{"id":"SR-U05","c":"U","g":"操作と表示","t":"1 秒以上 3 秒未満押して離したときは、押す前の主のモード・通信の状態・LED の表示のまま動作を続けること","why":"押し間違いで、記録の開始・停止や接続の受付をしないようにするため","m":"T","st":"ST-022","pt":"1.5 秒押して離したとき、主のモード・通信の状態・LED の表示が変わらないこと"},{"id":"SR-U06","c":"U","g":"操作と表示","t":"短押しから 2 分間、アプリからの接続を受け付けること","why":"受け付ける時間を限り、電池を節約して、知らない相手から接続される機会を減らすため","m":"T","st":"ST-023","pt":"短押しから 1 分 50 秒後には接続でき、2 分 10 秒後には接続できないこと"},{"id":"SR-U07","c":"U","g":"操作と表示","t":"長押しで記録を停止したら、赤を 3 回点滅させること","why":"停止を受け付けたことを、その場で確かめられるようにするため","m":"T","st":"ST-024","pt":"長押しで記録を停止したときに、赤を 3 回点滅すること"},{"id":"SR-I01","c":"I","g":"外部インタフェース","t":"アプリとの通信は BLE（Bluetooth 4.2 以上の機能）で行うこと","why":"アプリを動かすスマートフォン（要求仕様書で決めた機種）が使える方式にするため","m":"I","st":"ST-025","pt":"無線の部分の資料と Bluetooth の認定の記録で、Bluetooth 4.2 以上の機能に対応していることを確かめる"},{"id":"SR-I02","c":"I","g":"外部インタフェース","t":"見通し 10 m の距離から、例のスマートフォンで接続し、記録を読み出せること","why":"倉庫の棚の上のロガーに、通路から接続できるようにするため（要求仕様書）","m":"T","st":"ST-026","pt":"見通し 10 m で、例のスマートフォンから接続し、記録を読み出せること"},{"id":"SR-I03","c":"I","g":"外部インタフェース","t":"アプリとやり取りするデータの形式は、LG-ICD-001 に従うこと","why":"ロガーとアプリを別の担当者が作っても、つながるようにするため","m":"T","st":"ST-027","pt":"試験用のアプリで LG-ICD-001 のすべてのやり取りを行い、データの形式が文書どおりであること"},{"id":"SR-P01","c":"P","g":"性能","t":"温度の誤差は、0 °C 以上 40 °C 以下で ±0.5 °C 以内、−20 °C 以上 0 °C 未満と 40 °C より高く 60 °C 以下で ±1.0 °C 以内であること（分解能 0.1 °C）","why":"冷蔵（2〜8 °C）を含む範囲を厳しくして、保管の温度の判定に使えるようにするため（要求仕様書）","m":"T","st":"ST-028","pt":"恒温槽の −20・0・25・40・60 °C で基準の温度計と比べ、誤差がその温度の許容差以内であること。分解能が 0.1 °C であること"},{"id":"SR-P02","c":"P","g":"性能","t":"25 °C・20〜80 %RH での湿度の誤差は、±3 %RH 以内であること（分解能 1 %RH）","why":"湿度は目安として記録するので（要求仕様書）、条件を 1 つに絞った","m":"T","st":"ST-029","pt":"25 °C の 20・50・80 %RH で基準の湿度計と比べ、誤差が ±3 %RH 以内であること"},{"id":"SR-P03","c":"P","g":"性能","t":"各記録の時刻は、ロガーの時計で予定した測定の時刻から ±2 秒以内であること","why":"記録を、記録の間隔どおりに並んだ値として扱えるようにするため","m":"T","st":"ST-030","pt":"24 時間の記録で、各記録の時刻が予定の時刻から ±2 秒以内であること"},{"id":"SR-P04","c":"P","g":"性能","t":"時刻を合わせてから 30 日後の時刻のずれは、25 °C で ±60 秒以内であること","why":"読み出しの間が最も長い使い方（30 日。要求仕様書）でも、ほかの記録と時刻を比べられるようにするため","m":"T","st":"ST-031","pt":"時刻を合わせて 25 °C に 30 日置き、ロガーの時計と基準の時計の差が ±60 秒以内であること"},{"id":"SR-P05","c":"P","g":"性能","t":"接続してから、記録 52 560 件の読み出しを 60 秒以内に終えること（例のスマートフォンで、見通し 2 m）","why":"受け取りの現場で、読み出しの待ち時間を 1 分以内にするため（要求仕様書）","m":"T","st":"ST-032","pt":"見通し 2 m で、例のスマートフォンが 52 560 件を、接続から 60 秒以内に読み出すこと"},{"id":"SR-P06","c":"P","g":"性能","t":"短押しから 10 秒以内に、アプリが接続を始められること","why":"短押しの後、アプリを操作する人を待たせないため","m":"T","st":"ST-033","pt":"短押しから例のスマートフォンが接続を始めるまでの時間が、くり返したどの回も 10 秒以内であること"},{"id":"SR-W01","c":"W","g":"電源","t":"電源はコイン形リチウム電池 CR2032 1 個とすること","why":"手に入りやすく、利用者が自分で替えられる電池にするため","m":"I","st":"ST-034","pt":"電池の入れ物と部品表で、CR2032 1 個で動くことを確かめる"},{"id":"SR-W02","c":"W","g":"電源","t":"次の使い方の条件で、新しい電池で 1 年以上記録を続けられること: 記録の間隔 10 分、周囲 25 °C（警報の印が付かない上限と下限に設定する）、読み出しは 1 週間に 1 回（接続 1 分）、短押しは 1 日に 1 回","why":"1 年の間、電池を替えずに済むようにするため。条件が無いと電池寿命が決まらない","m":"A","st":"ST-035","pt":"状態ごとの電流を測り、使い方の条件の平均電流と電池の使える容量（LG-TST-001 で決める）から、1 年以上もつことを計算で示す"},{"id":"SR-W03","c":"W","g":"電源","t":"利用者が工具を使わずに電池を交換できること","why":"現場で、利用者が自分で電池を替えられるようにするため","m":"D","st":"ST-036","pt":"利用者が工具を使わずに電池を外し、新しい電池を入れられることを見せる"},{"id":"SR-W04","c":"W","g":"電源","t":"電池を交換した後も、交換の前に保存した記録と設定を保持していること","why":"現場で電池を替えても、それまでの記録と設定を失わないため","m":"T","st":"ST-037","pt":"記録と設定のある状態で電池を外して入れ直し、記録と設定が変わっていないことをアプリで確かめる"},{"id":"SR-E01","c":"E","g":"環境","t":"−20〜+60 °C・0〜95 %RH（結露しないこと）で、すべての要求を満たすこと","why":"冷凍の輸送から夏の車の中までの使われ方を見込むため（要求仕様書）","m":"T","st":"ST-038","pt":"−20 °C・+60 °C・95 %RH（結露なし）の中で、選んだ機能と性能の試験（選び方は LG-TST-001）に合格すること"},{"id":"SR-E02","c":"E","g":"環境","t":"電池を外して −30〜+70 °C で保存した後に、すべての要求を満たすこと","why":"電池を外して倉庫に置く間と、運ぶ間の温度を見込むため","m":"T","st":"ST-039","pt":"電池を外して −30 °C と +70 °C に置いた後、選んだ機能と性能の試験に合格すること"},{"id":"SR-E03","c":"E","g":"環境","t":"防塵・防水は IP54 相当とすること（例の値）","why":"荷さばきの場所で、ほこりと水しぶきにさらされるため","m":"T","st":"ST-040","pt":"IP コード（IEC 60529）の IP54 の試験に合格すること"},{"id":"SR-E04","c":"E","g":"環境","t":"高さ 1.0 m からコンクリートの床へ、6 面をそれぞれ 1 回落としても、記録を失わずに動き続けること","why":"荷の積み下ろしで落とすことがあるため","m":"T","st":"ST-041","pt":"1.0 m からコンクリートの床へ 6 面を 1 回ずつ落とした後、記録が残り、記録を続けていること"},{"id":"SR-R01","c":"R","g":"信頼性","t":"電池を外しても、保存した記録を 10 年以上保持すること","why":"読み出す前に電池が切れても、記録を失わないため","m":"A","st":"ST-042","pt":"記録を保存する部品の資料にある保持の期間と、保存の温度から、10 年以上保持できることを示す"},{"id":"SR-R02","c":"R","g":"信頼性","t":"読み出した記録に誤りがあれば、アプリがそれを検出できるようにすること（検出に使う情報の形式は LG-ICD-001）","why":"品質の証拠に使う記録なので、壊れた記録を正しい記録として使わないため","m":"T","st":"ST-043","pt":"読み出しの途中のデータの一部を試験用の装置で書き換え、アプリが誤りを検出すること"},{"id":"SR-R03","c":"R","g":"信頼性","t":"ソフトウェアが止まったときは、10 秒以内に自動で、止まる前の主のモードの動作に戻ること","why":"止まったまま記録が途切れることを防ぐため","m":"T","st":"ST-044","pt":"試験用の手段でソフトウェアを止め、10 秒以内に、短押しに止まる前と同じ状態の応答を返すようになること"},{"id":"SR-R04","c":"R","g":"信頼性","t":"記録の間隔 1 分で 5 年間使っても（電池は途中で交換してよい）、すべての要求を満たすこと","why":"最も短い記録の間隔でも、製品の寿命（5 年。要求仕様書）の間使えるようにするため","m":"A","st":"ST-045","pt":"記録の間隔 1 分で 5 年分（2 628 000 件）を書いても、記録を保存する部品の書き換えの回数の上限に達しないことを計算で示す"},{"id":"SR-R05","c":"R","g":"信頼性","t":"ソフトウェアが止まって戻った後も、止まる前に保存した記録と設定を保持していること","why":"止まるたびに記録や設定を失うと、品質の証拠が欠け、違う設定で記録するため","m":"T","st":"ST-046","pt":"SR-R03 の試験でソフトウェアを止めて戻した後、記録と設定が止まる前と同じであること"},{"id":"SR-S01","c":"S","g":"安全とセキュリティ・制約","t":"設定の変更と記録の消去は、ロガーごとの 6 桁の PIN を知っているアプリからだけ受け付けること","why":"知らない人に設定を変えられたり、記録を消されたりしないため","m":"T","st":"ST-047","pt":"PIN が無いときと違うときは設定の変更と記録の消去を受け付けず、正しいときだけ受け付けること"},{"id":"SR-S02","c":"S","g":"安全とセキュリティ・制約","t":"日本の電波法の技術基準に適合すること","why":"日本で無線の機器として使うため（法規）","m":"I","st":"ST-048","pt":"電波法の技術基準適合証明または工事設計認証の記録を確かめる"},{"id":"SR-C01","c":"C","g":"安全とセキュリティ・制約","t":"大きさは 60 × 40 × 15 mm 以内、重さは電池を含めて 30 g 以下であること","why":"輸送の箱の中のすき間に入れるため（要求仕様書）","m":"I","st":"ST-049","pt":"大きさが 60 × 40 × 15 mm 以内、電池を含めた重さが 30 g 以下であることを測って確かめる"},{"id":"SR-C02","c":"C","g":"安全とセキュリティ・制約","t":"部品の費用は 1 台 1 500 円以下であること（月 1 000 台の生産で。例の値）","why":"販売の価格の目標から決めた（要求仕様書）","m":"A","st":"ST-050","pt":"部品表と月 1 000 台の見積もりから、1 台の部品の費用が 1 500 円以下であることを示す"}];
  var _W03_CATN={"F":"機能","U":"操作と表示","I":"外部インタフェース","P":"性能","W":"電源","E":"環境","R":"信頼性","S":"安全とセキュリティ","C":"制約"};
  var _W03_CAP=52560;
  /* 狭い画面（表示枠が 520 px 未満）では、図を幅 400 に組み替える */
  function _w03_nar(box){var w=box.el.clientWidth;return w>0&&w<520;}
  function _w03_f(v,d){v=+v;if(Math.abs(v)<0.5*Math.pow(10,-d))v=0;return v.toFixed(d).replace("-","−");}
  /* 3 桁ごとに空白を入れた整数（52 560 など） */
  function _w03_g(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g," ");}
  /* ボタンの並びの頭に置く小さな見出し */
  function _w03_lab(row,t){var s=document.createElement("span");s.className="wnote";s.style.margin="0 .2rem 0 0";s.style.minWidth="4.5em";s.textContent=t;row.appendChild(s);}

  /* ---- 4 節: 記録の容量と、容量に達したときの動作（SR-F02・SR-F04・SR-F05） ---- */
  REG.w03_capacity=function(el,U){
    var S=U.S;
    U.head(el,"CAPACITY","記録の容量 — 記録の間隔と、容量に達したときの動作（SR-F02・SR-F04・SR-F05）");
    var r1=U.ctrls(el);
    var iv=U.slider(r1,"記録の間隔（SR-F02）",{min:1,max:60,step:1,value:10,fmt:function(v){return v+" 分";},onInput:function(){draw();}});
    var rd=U.slider(r1,"読み出す日（記録を始めてから）",{min:0,max:1100,step:1,value:400,fmt:function(v){return v+" 日目";},onInput:function(){draw();}});
    var r2=U.ctrls(el);
    var pol=U.seg(r2,["容量に達したら上書き（初期値）","容量に達したら記録を止める"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（10 分・上書き・400 日目）",function(){iv.set(10);rd.set(400);pol.set(0);draw();});
    U.button(br,"記録の間隔 1 分",function(){iv.set(1);draw();});
    U.button(br,"記録の間隔 60 分",function(){iv.set(60);draw();});
    var box=U.svgbox(el),ro=U.readout(el);
    function draw(){
      var v=iv.get(),per=1440/v,full=_W03_CAP/per,day=rd.get(),stop=pol.get()===1,nar=_w03_nar(box),Wd=nar?400:700,o=[];
      var x0=nar?92:132,x1=Wd-16,Dm=Math.max(30,Math.max(day,full,365)*1.08),X=function(d){return x0+(x1-x0)*d/Dm;};
      var rows=[["記録した期間",42],["残っている記録",84]],kept0,kept1,lost0=null,lost1=null,gap0=null,gap1=null,recEnd;
      rows.forEach(function(r){o.push(S.T(nar?8:14,r[1]+5,r[0],"start",nar?9.5:10,"ink",true));});
      recEnd=stop?Math.min(day,full):day;
      if(stop){kept0=0;kept1=Math.min(day,full);if(day>full){gap0=full;gap1=day;}}
      else{kept0=Math.max(0,day-full);kept1=day;if(day>full){lost0=0;lost1=day-full;}}
      /* 1 段目: 記録した期間 */
      if(recEnd>0)o.push(S.RECT(X(0),33,X(recEnd)-X(0),16,3,U.soft("signal"),"signal",1.2));
      if(gap0!=null){o.push(S.RECT(X(gap0),33,X(gap1)-X(gap0),16,3,U.soft("alias"),"alias",1.2,"4 3"));
        if(X(gap1)-X(gap0)>70)o.push(S.T((X(gap0)+X(gap1))/2,45,"停止中","middle",9.5,"alias",true));}
      /* 2 段目: 読み出す日に残っている記録 */
      if(lost0!=null){o.push(S.RECT(X(lost0),75,X(lost1)-X(lost0),16,3,"var(--muted-soft)","muted",1,"3 3"));
        if(X(lost1)-X(lost0)>60)o.push(S.T((X(lost0)+X(lost1))/2,87,"上書きで消えた","middle",9.5,"muted",true));}
      if(kept1>kept0){o.push(S.RECT(X(kept0),75,X(kept1)-X(kept0),16,3,U.soft("green"),"green",1.3));
        if(X(kept1)-X(kept0)>90)o.push(S.T((X(kept0)+X(kept1))/2,87,"読み出せる記録","middle",9.5,"green",true));}
      if(gap0!=null){o.push(S.RECT(X(gap0),75,X(gap1)-X(gap0),16,3,U.soft("alias"),"alias",1,"4 3"));
        if(X(gap1)-X(gap0)>70)o.push(S.T((X(gap0)+X(gap1))/2,87,"記録が無い","middle",9.5,"alias",true));}
      /* 印: 容量に達する日・1 年・読み出す日 */
      var ya=110;
      o.push(S.L(X(full),24,X(full),ya,"gold",1.6,"5 3"));
      function cx(x,s){var w=U.tw(s,9.5);return Math.max(x0+w/2,Math.min(x1-w/2,x));}
      var lf="容量に達する "+_w03_f(full,1)+" 日目",ld="読み出す日 "+day+" 日目";
      o.push(S.T(cx(X(full),lf),ya+46,lf,"middle",9.5,"gold",true,false,null,true));
      if(Math.abs(X(365)-X(full))>4){o.push(S.L(X(365),24,X(365),ya,"faint",1.2,"2 3"));o.push(S.T(X(365),20,"1 年","middle",9.5,"muted",false,false,null,true));}
      o.push(S.L(X(day),24,X(day),ya,"ink",1.8));
      o.push(S.T(cx(X(day),ld),ya+30,ld,"middle",9.5,"ink",true,false,null,true));
      o.push(S.L(x0,ya,x1,ya,"muted",1));
      U.nice(0,Dm,nar?4:6).forEach(function(d){if(d>Dm)return;o.push(S.L(X(d),ya,X(d),ya+4,"muted",1));o.push(S.T(X(d),ya+15,String(d),"middle",9.5,"muted"));});
      o.push(S.T(x1,ya+62,"記録を始めてからの日数 [日]","end",9.5,"muted"));
      box.set(S.svg(Wd,ya+70,o));
      /* 読み出し */
      var n=Math.min(_W03_CAP,Math.round(day*per)),h="";
      h+="1 日の記録 = 1 440 分 ÷ 記録の間隔 "+v+" 分 = "+_w03_f(per,per%1?2:0)+" 件<br>";
      h+="容量に達するまで = 記録の容量 52 560 件 × "+v+" 分 = <b>"+_w03_f(full,1)+" 日</b>（記録 1 件が "+v+" 分を受け持つとして数えた）<br>";
      if(day<=full)h+=day+" 日目に読み出すと: 0〜"+day+" 日目の記録 <b>"+_w03_g(n)+" 件</b>が残っている（まだ容量に達していない）<br>";
      else if(stop)h+=day+" 日目に読み出すと: 0〜"+_w03_f(full,1)+" 日目の記録 <b>52 560 件</b>が残っている。<span class=\"warn\">"+_w03_f(full,1)+" 日目から停止中になり、"+_w03_f(day-full,1)+" 日分の記録が無い</span>（SR-F05 の「記録を止める」）<br>";
      else h+=day+" 日目に読み出すと: "+_w03_f(day-full,1)+"〜"+day+" 日目の記録 <b>52 560 件</b>が残っている。<span class=\"warn\">最初の "+_w03_f(day-full,1)+" 日分は上書きで消えた</span>（SR-F05 の「上書き」）<br>";
      h+="保存できる記録の長さ "+_w03_f(full,1)+" 日は 1 年（365 日）"+(full>=365-1e-9?'<span class="ok">以上</span>':'<span class="warn">より短い</span>')+"。1 年分を残せるのは、記録の間隔が 10 分以上のとき（SR-F04 の件数の決め方）";
      ro.innerHTML=h+'<div class="wnote">記録の容量は SR-F04 の下限の 52 560 件とした（実際の容量はこれ以上ならよい）。記録は開始の時刻に 1 件目を保存し、以後は記録の間隔ごとに保存する（表 3-3）。</div>';
    }
    draw();
  };

  /* ---- 4 節: 仕様書どおりに動くロガーの模型（表 3-3〜3-6） ---- */
  var _W03_MAINCOL=["長押し","アプリから開始","アプリから停止","記録の時刻","記録が容量に達する","電池の残りで記録を続けられなくなる","電池を替える"];
  var _W03_MAINROW={stop:"停止中",rec:"記録中",dead:"電池切れ"};
  var _W03_MAINTXT={stop:["記録中へ ※","記録中へ ※","無視","—","—","電池切れへ","停止中のまま"],rec:["停止中へ","無視","停止中へ","1 件保存","上書き／停止中へ","電池切れへ","停止中へ"],dead:["無視","—","—","—","—","—","停止中へ"]};
  var _W03_COMMCOL=["短押し","アプリが接続する","接続が切れる","2 分たつ","主のモードが電池切れになる","電池を替える"];
  var _W03_COMMROW={none:"通信なし",adv:"接続の受付中",conn:"接続中"};
  var _W03_COMMTXT={none:["受付中へ（電池切れなら無視）","—","—","—","そのまま","そのまま"],adv:["2 分を数え直す","接続中へ・時刻合わせ","—","通信なしへ","通信なしへ","通信なしへ"],conn:["接続中のまま","—","通信なしへ","—","通信なしへ","通信なしへ"]};
  var _W03_PAT={start:"GGG",stop:"RRR",stR:"G",stS:"R",alarm:"RR",low:"RG",comm:"G"};
  var _W03_PRI={start:1,stop:1,stR:2,stS:2,alarm:3,low:4,comm:5};
  var _W03_SHN={start:"開始",stop:"停止",stR:"状態",stS:"状態",alarm:"警報",low:"電池少",comm:""};
  REG.w03_device=function(el,U){
    var S=U.S,M=null;
    U.head(el,"LOGGER MODEL","仕様書どおりに動くロガーの模型 — 操作と、表 3-3〜3-6 のマス");
    var bA=U.btnrow(el);_w03_lab(bA,"ボタン");
    U.button(bA,"短押し（0.5 秒）",function(){act("short");});
    U.button(bA,"1.5 秒押す",function(){act("mid");});
    U.button(bA,"長押し（3 秒）",function(){act("long");});
    var bB=U.btnrow(el);_w03_lab(bB,"アプリ");
    U.button(bB,"接続する",function(){act("conn");});
    U.button(bB,"記録を開始",function(){act("astart");});
    U.button(bB,"記録を停止",function(){act("astop");});
    U.button(bB,"読み出して確認の操作",function(){act("read");});
    U.button(bB,"切断",function(){act("disc");});
    var bC=U.btnrow(el);_w03_lab(bC,"時間");
    var tick=U.ticker(function(){advance(0.1*spd.get(),false);draw();},100);
    U.button(bC,"再生",function(){tick.start();});
    U.button(bC,"止める",function(){tick.stop();});
    U.button(bC,"+10 秒",function(){advance(10,true);draw();});
    U.button(bC,"+2 分",function(){advance(120,true);draw();});
    U.button(bC,"+10 分",function(){advance(600,true);draw();});
    U.button(bC,"+1 日",function(){advance(86400,true);draw();});
    U.button(bC,"+30 日",function(){advance(30*86400,true);draw();});
    var bD=U.btnrow(el);_w03_lab(bD,"電池");
    U.button(bD,"電池の残りが少なくなる",function(){act("low");});
    U.button(bD,"電池が尽きる",function(){act("dead");});
    U.button(bD,"電池を替える",function(){act("batt");});
    var r1=U.ctrls(el);
    var tmp=U.slider(r1,"周囲の温度",{min:-20,max:60,step:0.1,value:5,fmt:function(v){return _w03_f(v,1)+" °C";},onInput:function(){draw();}});
    var spd=U.select(r1,"再生の速さ",["実時間","10 倍","60 倍"],0,function(){});
    var spdv=[1,10,60];spd.get0=spd.get;spd.get=function(){return spdv[spd.get0()];};
    var r2=U.ctrls(el);
    var ivs=U.select(r2,"記録の間隔（設定）",["1 分","10 分（初期値）","60 分"],1,function(){var iv=ivv();if(M.mode==="rec"){M.next=(M.lastMeas!=null?M.lastMeas:M.t)+iv*60;if(M.next<=M.t)M.next=M.t+iv*60;}draw();});
    var pol=U.select(r2,"容量に達したときの動作（設定）",["上書き（初期値）","記録を止める"],0,function(){draw();});
    var r3=U.ctrls(el);
    var sens=U.checkbox(r3,"センサが応答しない（測定異常）",false,function(){draw();});
    var bE=U.btnrow(el);
    U.button(bE,"本文の例（電池を入れた直後）に戻す",function(){tick.stop();tmp.set(5);ivs.set(1);pol.set(0);sens.set(false);spd.input.value=0;reset();draw();});
    U.button(bE,"記録を容量の手前まで進める",function(){if(M.mode!=="rec"){note("記録中のときに使う（容量の手前 3 件まで記録を進める）");draw();return;}var need=_W03_CAP-3-M.count;if(need>0&&M.next!=null){advance(M.next+(need-1)*ivv()*60-M.t+0.001,true);}draw();});
    var box=U.svgbox(el),ro=U.readout(el),tb=U.mk("div");el.appendChild(tb);
    function ivv(){return [1,10,60][ivs.get()];}
    function reset(){M={t:0,ins:0,mode:"stop",comm:"none",advEnd:0,clock:false,next:null,lastMeas:null,count:0,total:0,over:0,lastRead:0,recent:[],unack:false,low:false,lowT:null,
      fl:[],shows:[],sid:0,alt:0,pm:null,pc:null,cm:null,cc:null,ev:"電池を入れた",lines:["主のモードは停止中、通信の状態は通信なし、時計は未設定から始まる（表 3-2）"],judge:null};}
    function note(s){M.ev="—";M.lines=[s];M.cm=null;M.cc=null;M.pm=null;M.pc=null;M.judge=null;}
    /* 表示（表 3-5・3-6）: 重なったら、優先順位の高い表示をし、低い表示はその回は省く */
    function show(nm,t){var pat=_W03_PAT[nm],pri=_W03_PRI[nm],dur=0.3*(pat.length-1)+0.02,i;
      for(i=0;i<M.shows.length;i++){var s=M.shows[i];if(s.t1<t-1e-6||s.t0>t+dur+1e-6)continue;if(s.pri<=pri)return false;}
      for(i=0;i<M.shows.length;i++){var s2=M.shows[i];if(s2.t1<t-1e-6||s2.t0>t+dur+1e-6)continue;M.fl=M.fl.filter(function(f){return !(f.s===s2.id&&f.t>=t-1e-9);});s2.cut=true;}
      var id=++M.sid;M.shows.push({id:id,t0:t,t1:t+dur,pri:pri,nm:nm});
      for(i=0;i<pat.length;i++)M.fl.push({t:t+0.3*i,c:pat.charAt(i)==="G"?"green":"alias",s:id});
      return true;}
    function prune(){var lim=M.t-60;M.fl=M.fl.filter(function(f){return f.t>=lim;});M.shows=M.shows.filter(function(s){return s.t1>=lim;});}
    function tick10(t){if(M.mode==="dead")return;if(M.unack&&M.low){show(M.alt%2===0?"alarm":"low",t);M.alt++;}else if(M.unack)show("alarm",t);else if(M.low)show("low",t);}
    function tick2(t){if(M.mode!=="dead"&&M.comm!=="none")show("comm",t);}
    /* 記録を 1 件保存する（表 3-3: 記録中 × 記録の時刻） */
    function record(t){var T=tmp.get(),err=sens.get(),mk=[];
      if(!err&&(T>8.0+1e-9||T<2.0-1e-9))mk.push("警報");
      if(!M.clock)mk.push("時刻未設定");if(M.low)mk.push("電池少");if(err)mk.push("測定異常");
      M.total++;if(M.count<_W03_CAP)M.count++;else M.over++;
      if(mk.indexOf("警報")>=0)M.unack=true;
      M.recent.unshift({n:M.total,t:t,clk:M.clock,ins:M.ins,T:err?null:T,mk:mk});if(M.recent.length>6)M.recent.pop();
      M.lastMeas=t;
      if(M.count>=_W03_CAP&&M.over===0&&pol.get()===1){M.mode="stop";M.next=null;return "full";}
      return M.count>=_W03_CAP&&M.over===0?"fullover":"";}
    /* 時間を進める。表示は最後の 40 秒の分だけを作る */
    function advance(dt,user){var tEnd=M.t+dt,tFrom=tEnd-40,guard=0,nrec=0,nal=0,evd=false;
      while(guard++<200000){var best=null,bt=Infinity;
        if(M.mode==="rec"&&M.next!=null&&M.next<bt){bt=M.next;best="meas";}
        if(M.comm==="adv"&&M.advEnd<bt){bt=M.advEnd;best="adv";}
        if(M.mode!=="dead"&&(M.unack||M.low)){var k=(Math.floor(M.t/10+1e-9)+1)*10;if(k<tFrom)k=Math.ceil(tFrom/10)*10;if(k<bt){bt=k;best="t10";}}
        if(M.mode!=="dead"&&M.comm!=="none"){var k2=(Math.floor(M.t/2+1e-9)+1)*2;if(k2<tFrom)k2=Math.ceil(tFrom/2)*2;if(k2<bt-1e-9){bt=k2;best="t2";}}
        if(best===null||bt>tEnd+1e-9)break;
        M.t=bt;
        if(best==="meas"){var r=record(bt);M.next=M.mode==="rec"?bt+ivv()*60:null;nrec++;if(M.recent[0].mk.indexOf("警報")>=0)nal++;if(r)evd=true;
          if(r==="full"){M.ev="記録が容量に達する";M.pm="rec";M.cm=["rec",4];M.cc=null;M.lines=["表 3-3: 記録中 × 記録が容量に達する → 「記録を止める」なので停止中へ（SR-F05）"];M.judge=null;}
          else if(r==="fullover"){M.ev="記録が容量に達する";M.pm=null;M.cm=["rec",4];M.cc=null;M.lines=["表 3-3: 記録中 × 記録が容量に達する → 「上書き」なので記録中のまま。次からは最も古い記録に上書きする（SR-F05）"];M.judge=null;}
          if(M.t>=tFrom&&Math.abs(bt/10-Math.round(bt/10))<1e-9){/* 同じ時刻の 10 秒の表示は、記録の後に作る */}}
        else if(best==="adv"){evd=true;M.comm="none";M.ev="受付を始めてから 2 分たつ";M.pc="adv";M.cc=["adv",3];M.cm=null;M.pm=null;M.lines=["表 3-4: 接続の受付中 × 2 分たつ → 通信なしへ（SR-U02）"];M.judge=null;}
        else if(best==="t10"){tick10(bt);if(Math.abs(bt/2-Math.round(bt/2))<1e-9&&M.comm!=="none")tick2(bt);}
        else if(best==="t2")tick2(bt);
        if(best==="t10"||best==="t2"){/* 時刻を少しだけ進めて、同じ刻みを 2 度作らない */}
      }
      M.t=tEnd;prune();
      if(!evd&&(user||nrec>0)){var dl=dt>=86400?_w03_f(dt/86400,dt%86400?1:0)+" 日":(dt>=60?_w03_f(dt/60,dt%60?1:0)+" 分":_w03_f(dt,0)+" 秒");
        setEv(user?"時間を進めた（+"+dl+"）":"記録の時刻",nrec?["表 3-3: 記録中 × 記録の時刻 → 記録を 1 件保存する（SR-F01・SR-F03）。この間に "+_w03_g(nrec)+" 件"+(M.over?"（容量に達しているので、最も古い記録に上書き）":"")+(nal?"。うち "+_w03_g(nal)+" 件に警報の印（SR-F10）":"")]:["この間に、表のマスに当たる出来事は無かった"],nrec?["rec",3]:null,null,null,null);}}
    function setEv(ev,lines,cm,cc,pm,pc){M.ev=ev;M.lines=lines;M.cm=cm;M.cc=cc;M.pm=pm;M.pc=pc;M.judge=null;}
    function act(a){var t=M.t,md=M.mode,cs=M.comm;
      if(a==="short"){
        if(md==="dead"){setEv("短押し（0.5 秒）",["表 3-4: 通信なし × 短押し → 主のモードが電池切れなので無視。LED も点けない（表 3-5 の電池切れ）"],null,["none",0],null,null);return draw();}
        show(md==="rec"?"stR":"stS",t);
        var l=["LED: 状態の応答（"+(md==="rec"?"記録中なので緑を 1 回":"停止中なので赤を 1 回")+"。SR-U02・表 3-5）"];
        if(cs==="none"){M.comm="adv";M.advEnd=t+120;l.unshift("表 3-4: 通信なし × 短押し → 接続の受付中へ。2 分を数え始める（SR-U02）");}
        else if(cs==="adv"){M.advEnd=t+120;l.unshift("表 3-4: 接続の受付中 × 短押し → 2 分を数え直す");}
        else l.unshift("表 3-4: 接続中 × 短押し → 接続中のまま");
        setEv("短押し（0.5 秒）",l,null,[cs,0],null,cs);return draw();}
      if(a==="mid"){setEv("1.5 秒押して離す",["1 秒以上 3 秒未満の押し方には応えない。モード・通信の状態・LED は変わらない（SR-U01）"],null,null,null,null);return draw();}
      if(a==="long"||a==="astart"||a==="astop"){
        var app=a!=="long",nm=a==="long"?"長押し（3 秒）":(a==="astart"?"アプリから開始":"アプリから停止"),col=a==="long"?0:(a==="astart"?1:2);
        if(app&&cs!=="conn"){note("アプリの操作は、接続中でないと送れない（まず短押しして、アプリから接続する）");return draw();}
        if(md==="dead"){setEv(nm,["表 3-3: 電池切れ × "+_W03_MAINCOL[col]+" → "+(app?"—（通信しないので起こらない）":"無視")],["dead",col],null,null,null);return draw();}
        if(md==="stop"&&a!=="astop"){
          if(M.count>=_W03_CAP&&pol.get()===1){if(!app)show("stop",t);setEv(nm,["表 3-3: 停止中 × "+_W03_MAINCOL[col]+" ※ → 記録が容量に達していて「記録を止める」なので、開始しない"+(app?"":"（停止の応答: 赤を 3 回。SR-U04）")],["stop",col],null,null,null);return draw();}
          M.mode="rec";if(!app)show("start",t);var r=record(t);M.next=M.mode==="rec"?t+ivv()*60:null;
          setEv(nm,["表 3-3: 停止中 × "+_W03_MAINCOL[col]+" → 記録中へ。すぐに 1 件目を記録する（SR-F06）",app?"アプリの操作では LED の応答はしない":"LED: 開始の応答（緑を 3 回。SR-U04）"],["stop",col],null,"stop",null);return draw();}
        if(md==="stop"&&a==="astop"){setEv(nm,["表 3-3: 停止中 × アプリから停止 → 無視"],["stop",2],null,null,null);return draw();}
        if(md==="rec"&&a==="astart"){setEv(nm,["表 3-3: 記録中 × アプリから開始 → 無視"],["rec",1],null,null,null);return draw();}
        M.mode="stop";M.next=null;if(!app)show("stop",t);
        setEv(nm,["表 3-3: 記録中 × "+_W03_MAINCOL[col]+" → 停止中へ（SR-F06）",app?"アプリの操作では LED の応答はしない":"LED: 停止の応答（赤を 3 回。SR-U04）"],["rec",col],null,"rec",null);return draw();}
      if(a==="conn"){
        if(cs==="none"){setEv("アプリが接続しようとする",["表 3-4: 通信なし × アプリが接続する → —（受け付けていないので、アプリからは見えない）。まず短押しする"],null,["none",1],null,null);return draw();}
        if(cs==="conn"){note("すでに接続中");return draw();}
        M.comm="conn";M.clock=true;
        setEv("アプリが接続する",["表 3-4: 接続の受付中 × アプリが接続する → 接続中へ。時刻を合わせる（SR-F08）。これより後の記録には時刻未設定の印を付けない（SR-F09）"],null,["adv",1],null,"adv");return draw();}
      if(a==="read"){
        if(cs!=="conn"){note("読み出しは接続中にだけできる（まず短押しして、アプリから接続する）");return draw();}
        var n=Math.min(M.total-M.lastRead,M.count),had=M.unack;M.lastRead=M.total;M.unack=false;
        setEv("読み出して確認の操作",["差分の読み出し: 前回の読み出しの後に保存した記録 "+_w03_g(n)+" 件（SR-F07）",had?"確認の操作で、警報の表示を止めた（SR-F11）。次に警報の印の付いた記録を保存すると、また表示する":"確認していない警報の印は無かった"],null,null,null,null);return draw();}
      if(a==="disc"){
        if(cs!=="conn"){note("接続していない");return draw();}
        M.comm="none";setEv("接続が切れる",["表 3-4: 接続中 × 接続が切れる → 通信なしへ"],null,["conn",2],null,"conn");return draw();}
      if(a==="low"){
        if(md==="dead"){note("電池切れになっている");return draw();}
        if(M.low){note("すでに電池少と判定している");return draw();}
        M.low=true;M.lowT=t;setEv("電池の残りが少なくなる",["これより後の記録に電池少の印を付け、電池少の表示（赤と緑を 1 回ずつ、10 秒ごと）を始める（SR-F13・表 3-5）"],null,null,null,null);return draw();}
      if(a==="dead"){
        if(md==="dead"){note("すでに電池切れ");return draw();}
        M.mode="dead";M.next=null;M.comm="none";
        setEv("電池の残りで記録を続けられなくなる",["表 3-3: "+_W03_MAINROW[md]+" × 電池の残りで記録を続けられなくなる → 電池切れへ","表 3-4: "+_W03_COMMROW[cs]+" × 主のモードが電池切れになる → "+(cs==="none"?"そのまま":"通信なしへ")],[md,5],[cs,4],md,cs==="none"?null:cs);
        if(!M.low)M.judge='<span class="warn">電池少を知らせずに記録が止まった。SR-F13 を満たさない</span>';
        else{var d=(t-M.lowT)/86400;M.judge=d>=14-1e-9?'<span class="ok">電池少を '+_w03_f(d,1)+' 日前に知らせた。SR-F13（14 日以上前）を満たす</span>':'<span class="warn">電池少から '+_w03_f(d,1)+' 日で記録が止まった。SR-F13（14 日以上前）を満たさない</span>';}
        return draw();}
      if(a==="batt"){
        M.mode="stop";M.next=null;M.comm="none";M.clock=false;M.low=false;M.lowT=null;M.ins=t;
        setEv("電池を替える",["表 3-3: "+_W03_MAINROW[md]+" × 電池を替える → 停止中"+(md==="stop"?"のまま":"へ")+"。時刻未設定にする","記録 "+_w03_g(M.count)+" 件と設定"+(M.unack?"と、確認していない警報の印":"")+"は残る（SR-W03・SR-F12）"],[md,6],[cs,5],md==="stop"?null:md,cs==="none"?null:cs);return draw();}
    }
    function hms(s){s=Math.max(0,Math.floor(s+1e-6));var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),c=s%60;return (d?d+" 日 ":"")+h+":"+(m<10?"0":"")+m+":"+(c<10?"0":"")+c;}
    function clk(t,set,ins){if(!set)return "未設定（電池を入れてから "+hms(t-ins)+"）";var b=Date.UTC(2026,10,2,8,0,0)+t*1000,D=new Date(b);function z(v){return (v<10?"0":"")+v;}
      return D.getUTCFullYear()+"-"+z(D.getUTCMonth()+1)+"-"+z(D.getUTCDate())+" "+z(D.getUTCHours())+":"+z(D.getUTCMinutes())+":"+z(D.getUTCSeconds());}
    function stateBoxes(o,x,y,w,keys,names,cur,prev,nar){var n=keys.length,gap=nar?10:16,bw=(w-gap*(n-1))/n,pos={};
      keys.forEach(function(k,i){var bx=x+i*(bw+gap),on=k===cur,c=k==="dead"?"alias":"signal";pos[k]=bx+bw/2;
        o.push(S.RECT(bx,y,bw,26,12,on?c:U.soft(c),c,on?2:1.2));o.push(S.T(bx+bw/2,y+17,names[k],"middle",nar?9.5:10.5,on?"panel":c,true));});
      if(prev&&prev!==cur&&pos[prev]!=null){var a=pos[prev],b=pos[cur],yy=y+36;o.push(S.L(a,y+26,a,yy,"gold",1.6));o.push(S.L(a,yy,b,yy,"gold",1.6));o.push(S.ARR(b,yy,b,y+28,"gold",1.6,6));}}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],t=M.t;
      /* ロガーの絵 */
      var lx=nar?10:16,ly=14,lw=nar?110:150,lh=nar?80:96,since=Math.max(0.12,0.1*spd.get()),lit=null;
      M.fl.forEach(function(f){if(f.t<=t+1e-9&&f.t>t-since)lit=f.c;});
      o.push(S.RECT(lx,ly,lw,lh,14,U.soft("signal"),"signal",1.8));
      o.push(S.T(lx+12,ly+20,"ロガー","start",10.5,"signal",true));
      var ledx=lx+lw-28,ledy=ly+26;
      if(lit)o.push(S.CIRC(ledx,ledy,17,lit,0,U.soft(lit)));
      o.push(S.CIRC(ledx,ledy,10,lit||"muted",1.4,lit||"var(--screen)"));
      o.push(S.T(ledx,ledy+26,"LED","middle",9.5,"muted"));
      o.push(S.CIRC(lx+34,ly+lh-26,14,"signal",1.4,"var(--panel)"));o.push(S.T(lx+34,ly+lh-22,"ボタン","middle",8.5,"muted"));
      /* 状態の文字 */
      var sx=nar?132:184,sz=nar?9.5:10.5,lh2=nar?16:19,ys=ly+14;
      var cn=M.comm==="adv"?"接続の受付中（残り "+hms(M.advEnd-t).replace(/^0:/,"")+"）":_W03_COMMROW[M.comm];
      var st=[["主のモード",_W03_MAINROW[M.mode],M.mode==="dead"?"alias":"signal"],["通信の状態",cn,"signal"],["時計",clk(t,M.clock,M.ins),M.clock?"ink":"gold"],
        ["記録",_w03_g(M.count)+" 件（容量 52 560 件"+(M.over?"・上書き "+_w03_g(M.over)+" 件":"")+"）","ink"],["印・表示",(M.unack?"確認していない警報あり":"警報なし")+"・"+(M.low?"電池少":"電池は足りる"),M.unack||M.low?"alias":"green"]];
      st.forEach(function(r,i){o.push(S.T(sx,ys+i*lh2,r[0],"start",sz-1,"muted"));o.push(S.T(sx+(nar?62:72),ys+i*lh2,r[1],"start",sz,r[2],true));});
      /* LED の帯（最近の 30 秒） */
      var bx0=16,bx1=Wd-16,by=nar?132:140,X=function(tt){return bx1-(bx1-bx0)*(t-tt)/30;};
      o.push(S.T(bx0,by-6,"LED（最近の 30 秒。右端が今）","start",9.5,"ink",true));
      o.push(S.RECT(bx0,by,bx1-bx0,26,3,"var(--screen)","line",1));
      var labs=[];M.shows.forEach(function(s){if(s.t0<t-30||s.t0>t+1e-9||!_W03_SHN[s.nm])return;if(!M.fl.some(function(f){return f.s===s.id;}))return;var x=X(s.t0);if(labs.some(function(q){return Math.abs(q-x)<32;}))return;labs.push(x);o.push(S.T(x,by+40,_W03_SHN[s.nm],"middle",9,"muted"));});
      M.fl.forEach(function(f){if(f.t<t-30||f.t>t+1e-9)return;var cm=M.shows.filter(function(s){return s.id===f.s;})[0],thin=cm&&cm.nm==="comm";o.push(S.RECT(X(f.t)-(thin?0.8:1.6),by+(thin?7:3),thin?1.6:3.2,thin?12:20,0.5,f.c,f.c,0));});
      [30,20,10,0].forEach(function(v){o.push(S.T(X(t-v),by+(labs.length?52:40),v?"−"+v+" 秒":"今",v===30?"start":(v===0?"end":"middle"),9,"muted"));});
      /* 2 つの状態（表 3-2） */
      var yb=by+(labs.length?66:56),hw=(Wd-32-(nar?0:24))/(nar?1:2);
      o.push(S.T(16,yb,"主のモード","start",9.5,"ink",true));
      stateBoxes(o,16,yb+6,hw,["stop","rec","dead"],_W03_MAINROW,M.mode,M.pm,nar);
      var xb=nar?16:16+hw+24,yb2=nar?yb+58:yb;
      o.push(S.T(xb,yb2,"通信の状態","start",9.5,"ink",true));
      stateBoxes(o,xb,yb2+6,hw,["none","adv","conn"],{none:"通信なし",adv:"受付中",conn:"接続中"},M.comm,M.pc,nar);
      box.set(S.svg(Wd,yb2+50,o));
      /* 読み出し */
      var h="<b>直前の出来事: "+M.ev+"</b><br>"+M.lines.join("<br>")+(M.judge?"<br>"+M.judge:"");
      ro.innerHTML=h+'<div class="wnote">1 回の点灯は短いので、帯では太く描いた。「+1 日」などで時間を大きく進めたときは、最後の 40 秒の表示だけを作る。設定は、アプリから PIN を入れて変えたとする（SR-S01）。時計は、接続のときにアプリの時刻（ここでは 2026-11-02 08:00 に電池を入れたとした時刻）に合わせる。</div>';
      /* 状態遷移表（使ったマスを色で示す） */
      function table(title,rows,cols,txt,cur,cell){var hd=['主のモード ＼ 出来事'];
        var hh='<div class="wnote" style="margin-top:.6rem"><b>'+title+'</b></div><div class="wtable"><table><thead><tr><th>'+(rows===_W03_MAINROW?"主のモード":"通信の状態")+'</th>'+cols.map(function(c){return '<th class="wrap" style="min-width:5.5em">'+c+'</th>';}).join("")+'</tr></thead><tbody>';
        Object.keys(rows).forEach(function(k){hh+='<tr><td style="'+(k===cur?'font-weight:700;color:var(--signal)':'')+'">'+(k===cur?"▶ ":"")+rows[k]+'</td>';
          txt[k].forEach(function(v,j){var on=cell&&cell[0]===k&&cell[1]===j;hh+='<td class="wrap" style="min-width:5.5em;'+(on?'background:var(--gold-soft);outline:2px solid var(--gold);font-weight:700':'')+'">'+v+'</td>';});hh+='</tr>';});
        return hh+'</tbody></table></div>';}
      var rec='<div class="wnote" style="margin-top:.6rem"><b>最近の記録（新しい順。SR-F03）</b></div>'+U.tbl(["番号","時刻","温度","湿度","状態の印"],M.recent.map(function(r){return [String(r.n),clk(r.t,r.clk,r.ins).replace("未設定（電池を入れてから ","未設定 +").replace("）",""),r.T==null?"—":_w03_f(r.T,1)+" °C",r.T==null?"—":"50 %RH",r.mk.length?r.mk.map(function(m){return '<span class="'+(m==="時刻未設定"?"":"warn")+'">'+m+'</span>';}).join("・"):"—"];}),["right","left","right","right","left"]);
      tb.innerHTML=table("表 3-3 主のモードの状態遷移表（※ は容量に達していて「記録を止める」なら開始しない）",_W03_MAINROW,_W03_MAINCOL,_W03_MAINTXT,M.mode,M.cm)+table("表 3-4 通信の状態の状態遷移表",_W03_COMMROW,_W03_COMMCOL,_W03_COMMTXT,M.comm,M.cc)+(M.recent.length?rec:"");
    }
    reset();draw();
  };

  /* ---- 6 節: 要求と試験の対応表（表 6-1） ---- */
  REG.w03_vtable=function(el,U){
    var S=U.S,MN={T:"試験",A:"解析",I:"検査",D:"実演"},cats=["F","U","I","P","W","E","R","S","C"];
    U.head(el,"VERIFICATION","要求と試験の対応 — 41 件の要求の検証の方法（表 6-1）");
    var r1=U.ctrls(el);
    var cs=U.select(r1,"区分",["全部"].concat(cats.map(function(c){return "SR-"+c+"（"+_W03_CATN[c]+"）";})),0,function(){draw();});
    var r2=U.ctrls(el);
    var ms=U.seg(r2,["全部の方法","T 試験","A 解析","I 検査","D 実演"],0,function(){draw();});
    var br=U.btnrow(el);
    U.button(br,"本文の例（SR-F10）",function(){cs.set(0);ms.set(0);sel="SR-F10";draw();});
    var box=U.svgbox(el),ro=U.readout(el),sel="SR-F10",HIT=[];
    U.ctl.drag(box,function(type,x,y){if(type!=="down")return false;var h=null;HIT.forEach(function(q){if(x>=q[0]&&x<=q[0]+q[2]&&y>=q[1]&&y<=q[1]+q[3])h=q[4];});if(h){sel=h;draw();}return false;});
    function match(r){var c=cs.get(),m=ms.get();return (c===0||r.c===cats[c-1])&&(m===0||r.m==="TAID".charAt(m-1));}
    function draw(){
      var nar=_w03_nar(box),Wd=nar?400:700,o=[],lx=nar?8:14,cx0=nar?50:140,cw=nar?23:38,ch=nar?24:26,gap=nar?2:3,y0=30,cnt={T:0,A:0,I:0,D:0},n=0;
      HIT=[];
      o.push(S.T(lx,16,"要求の地図（行は区分、札の文字は検証の方法。札を押すと下に示す）","start",nar?9:10,"ink",true));
      if(!_W03_REQ.some(function(r){return r.id===sel&&match(r);})){var f=_W03_REQ.filter(match)[0];if(f)sel=f.id;}
      cats.forEach(function(c,i){var y=y0+i*(ch+gap+2),rs=_W03_REQ.filter(function(r){return r.c===c;});
        o.push(S.T(lx,y+ch*0.66,"SR-"+c,"start",nar?9.5:10.5,"signal",true));
        if(!nar)o.push(S.T(lx+38,y+ch*0.66,_W03_CATN[c],"start",9,"muted"));
        rs.forEach(function(r,j){var x=cx0+j*(cw+gap),on=match(r),me=r.id===sel;if(on){n++;cnt[r.m]++;}
          var col=on?"green":"faint",fill=on?(r.m==="T"?U.soft("green"):"var(--panel)"):"var(--screen)";
          o.push(S.RECT(x,y,cw,ch,4,fill,me?"gold":col,me?2.6:1.2,on&&r.m!=="T"?"3 2":null));
          o.push(S.T(x+cw/2,y+(nar?ch*0.62:11),nar?r.id.slice(4):r.id.slice(3),"middle",nar?8.5:9.5,on?"ink":"faint",true));
          if(!nar)o.push(S.T(x+cw/2,y+22,r.m,"middle",9,on?"green":"faint",true));
          HIT.push([x,y,cw,ch,r.id]);});});
      var yb=y0+9*(ch+gap+2)+8;
      o.push(S.RECT(lx,yb,14,12,3,U.soft("green"),"green",1.2));o.push(S.T(lx+20,yb+10,"試験（T）","start",9.5,"muted"));
      o.push(S.RECT(lx+(nar?86:100),yb,14,12,3,"var(--panel)","green",1.2,"3 2"));o.push(S.T(lx+(nar?106:120),yb+10,"解析・検査・実演（A・I・D）","start",9.5,"muted"));
      if(!nar)o.push(S.T(Wd-14,yb+10,"薄い札は、絞り込みの外","end",9.5,"muted"));
      box.set(S.svg(Wd,yb+20,o));
      var cur=_W03_REQ.filter(function(r){return r.id===sel;})[0],h="絞り込んだ要求 <b>"+n+" 件</b>（試験 "+cnt.T+"・解析 "+cnt.A+"・検査 "+cnt.I+"・実演 "+cnt.D+"）<br>";
      if(cur&&match(cur))h+="<b>"+cur.id+"</b>（"+_W03_CATN[cur.c]+(cur.g!==_W03_CATN[cur.c]?"・"+cur.g:"")+"）／ 検証の方法 <b>"+cur.m+" "+MN[cur.m]+"</b> ／ <b>"+cur.st+"</b><br>要求: "+cur.t+"<br>理由: "+cur.why+"<br>確かめること（合格の基準）: "+cur.pt;
      else h+='<span class="warn">この区分には、この方法の要求が無い</span>';
      ro.innerHTML=h+'<div class="wnote">ST の番号は要求の順に 1 件に 1 つ振った。どの札にも方法と ST があるので、試験の無い要求は無い。</div>';
    }
    draw();
  };
