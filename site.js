/* 配色（ダーク／ライト）切替。トップとシリーズ目次ページ共通。 */
(function(){
  var root=document.documentElement,
      b=document.getElementById('themeBtn'),
      lbl=document.getElementById('themeLbl'),
      ic=document.getElementById('themeIcon');
  if(!b)return;
  var sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>';
  var moon='<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>';
  function dark(){var t=root.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;}
  function sync(){var d=dark();lbl.textContent=d?'ダーク':'ライト';ic.innerHTML=d?moon:sun;}
  b.addEventListener('click',function(){root.setAttribute('data-theme',dark()?'light':'dark');sync();});
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change',sync);
  sync();
})();
