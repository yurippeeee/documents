  /* ===== 12 章 出力をスイッチする ===== */
  REG.w12_led=function(el,U){U.head(el,"LED","（作成中）");U.readout(el).innerHTML="作成中";};
  REG.w12_flyback=function(el,U){U.head(el,"FLYBACK","（作成中）");U.readout(el).innerHTML="作成中";};
  REG.w12_hold=function(el,U){U.head(el,"HOLD","（作成中）");U.readout(el).innerHTML="作成中";};
  REG.w12_soft=function(el,U){U.head(el,"SOFT","（作成中）");U.readout(el).innerHTML="作成中";};
