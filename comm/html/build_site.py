#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""comm/*.md -> comm/html/NN.html（KaTeX 数式・図・デモ・C コードの色分け・章間ナビ）。"""
import os, re, html, hashlib, sys, argparse, glob, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
_ap = argparse.ArgumentParser(description="組み込み通信シリーズのビルド")
_ap.add_argument("--only", help="ビルドする章（例 05 または 05,06）。指定時は図もその章の fig/fNN.py だけを読む")
_ap.add_argument("--out", help="出力先ディレクトリ（指定時はリポジトリの widgets.js と HTML を書き換えない）")
ARGS = _ap.parse_args()
ONLY = [x.strip() for x in ARGS.only.split(",")] if ARGS.only else None
if ONLY:
    os.environ["COMM_FIGS"] = ",".join(ONLY)
from figures import F as FIGS

SRC = os.path.dirname(HERE)
OUT = ARGS.out or HERE
os.makedirs(OUT, exist_ok=True)
SERIES = "動かして理解する組み込み通信"
HOME_LABEL = "組み込み通信"

# 章は comm/NN_タイトル.md を番号順に自動で集める（00 の目次は入口ページ comm.html が担う）
CHAPTERS = sorted((m.group(1), fn) for fn in os.listdir(SRC)
                  for m in [re.match(r"^(\d\d)_.*\.md$", fn)] if m and m.group(1) != "00")
# まだ書き上がっていない章: 原稿があっても本文を出さず、「準備中」のページにする（他の章からのリンクを切らないため）
PENDING = {
    "03": "03. フレーミングと誤り検出 — バイトの列をメッセージに区切る",
    "05": "05. 状態機械とタイムアウト — 確認応答と再送を組み立てる",
    "09": "09. Wi-Fi — アクセスポイントにつなぎ、眠りながら待つ",
    "10": "10. TCP — 順番どおり確実に届ける仕組み",
    "11": "11. ソケットと組み込みの TCP/IP スタック — UDP と lwIP",
    "12": "12. TLS — 通信路を暗号化し、相手を確かめる",
    "13": "13. MQTT — 小さな機器のためのパブリッシュとサブスクライブ",
    "14": "14. HTTP と CoAP — 要求と応答のプロトコル",
    "15": "15. クラウドとつなぎ続ける — 時刻・再接続・オフライン",
    "16": "16. BLE の全体像 — チャネル・役割・プロトコルスタック",
    "17": "17. アドバタイズとスキャン — 見つける・見つけてもらう",
    "18": "18. 接続と GATT — 属性を読み書きする",
    "19": "19. BLE のスループットと消費電力 — 空中時間から計算する",
    "20": "20. BLE のセキュリティ — ペアリング・ボンディング・プライバシー",
    "21": "21. LPWA — LoRaWAN とセルラーで遠くへ少ない電力で",
    "22": "22. 大きなデータを運ぶ — ファームウェア更新の転送と書き込み",
    "23": "23. 通信コードを検証する — ホストでのテスト・故障注入・キャプチャ",
    "24": "24. 1 つの機器の通信を設計する — ここまでの道具を組み合わせる",
}
if os.environ.get("COMM_SHOW_PENDING"):   # 書きかけの章を隔離ビルドで確かめるとき
    PENDING = {}
CHAPTERS = sorted([(n, fn) for n, fn in CHAPTERS if n not in PENDING] + [(n, None) for n in PENDING])

# ---- デモ（widgets.js）: 共通部品 + wjs/wNN.js を CHAPTER WIDGETS 区間へ流し込む ----
_A = "  /* ===== CHAPTER WIDGETS (build_site.py が wjs/*.js から生成) ===== */\n"
_E = "  /* ===== END CHAPTER WIDGETS ===== */"
def _merged(files):
    s = open(os.path.join(HERE, "widgets.js"), encoding="utf-8").read()
    i, j = s.index(_A) + len(_A), s.index(_E)
    body = "".join(open(q, encoding="utf-8").read().rstrip() + "\n\n" for q in files)
    return s[:i] + body + s[j:]
def _wjs(sel=None):
    return sorted(q for q in glob.glob(os.path.join(HERE, "wjs", "w*.js"))
                  if (sel is None or os.path.basename(q)[1:3] in sel) and os.path.basename(q)[1:3] not in PENDING)
if ARGS.out:
    # 隔離ビルド: 指定章の wjs だけを入れた widgets.js と、CSS・KaTeX を出力先に用意する
    open(os.path.join(ARGS.out, "widgets.js"), "w", encoding="utf-8").write(_merged(_wjs(ONLY)))
    shutil.copy(os.path.join(HERE, "comm.css"), os.path.join(ARGS.out, "comm.css"))
    if not os.path.exists(os.path.join(ARGS.out, "katex")):
        os.symlink(os.path.join(HERE, "katex"), os.path.join(ARGS.out, "katex"))
else:
    p = os.path.join(HERE, "widgets.js")
    t = _merged(_wjs())   # 準備中の章の書きかけは公開しない
    if t != open(p, encoding="utf-8").read():
        tmp = p + ".%d.tmp" % os.getpid()
        open(tmp, "w", encoding="utf-8").write(t)
        os.replace(tmp, p)

def _ver(name):
    """キャッシュ対策: ファイル内容のハッシュを ?v= に付ける。"""
    with open(os.path.join(OUT, name), 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]

def slugify(raw):
    s = raw
    s = re.sub(r"\$`(.+?)`\$", r"\1", s)
    s = s.replace("**", "").replace("`", "")
    s = re.sub(r"^\d+(\.\d+)*[.．]?\s*", "", s)
    s = re.sub(r"[\\{}^_$<>|&]", "", s)
    s = re.sub(r"[（）()「」『』\[\]:：,、。・—–\-―!?！？/\"'’“”…]+", " ", s)
    s = re.sub(r"\s+", "-", s.strip())
    return s.lower() or "sec"

_SEEN_SLUGS = {}
def heading_id(raw):
    b = slugify(raw)
    n = _SEEN_SLUGS.get(b, 0) + 1
    _SEEN_SLUGS[b] = n
    return b if n == 1 else "%s-%d" % (b, n)
def fix_href(h):
    m = re.match(r"^(\d\d)_[^#)]*\.md(#.*)?$", h)
    if m: return m.group(1) + ".html" + (m.group(2) or "")
    m = re.match(r"^\.\./(\w+)/(\d\d)_[^#)]*\.md(#.*)?$", h)
    if m: return "../../%s/html/%s.html%s" % (m.group(1), m.group(2), m.group(3) or "")
    return h

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ---- C コードの色分け（字句だけを見る簡単なもの） ----
_C_KW = set("""if else for while do switch case default break continue return goto sizeof typedef struct union enum
static const volatile extern inline register restrict""".split())
_C_TY = set("""void char short int long float double signed unsigned bool _Bool size_t ssize_t
uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t uintptr_t intptr_t ptrdiff_t socklen_t""".split())
_C_LIT = set("NULL true false".split())
_C_TOK = re.compile(r"""
 (?P<com>/\*.*?\*/|//[^\n]*)
|(?P<pp>^[ \t]*\#[^\n]*)
|(?P<str>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')
|(?P<num>\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)[uUlLfF]*\b)
|(?P<id>\b[A-Za-z_]\w*\b)
""", re.S | re.M | re.X)
def highlight_c(code):
    out, pos = [], 0
    for m in _C_TOK.finditer(code):
        out.append(esc(code[pos:m.start()]))
        kind, tok = m.lastgroup, m.group(0)
        if kind == "id":
            rest = code[m.end():m.end() + 40]
            if tok in _C_KW: cls = "kw"
            elif tok in _C_TY or re.match(r"^[a-z]\w*_t$", tok): cls = "ty"
            elif tok in _C_LIT or re.match(r"^[A-Z][A-Z0-9_]{2,}$", tok): cls = "cn"
            elif re.match(r"^\s*\(", rest): cls = "fn"
            else: cls = None
            out.append('<span class="tk-%s">%s</span>' % (cls, esc(tok)) if cls else esc(tok))
        else:
            out.append('<span class="tk-%s">%s</span>' % (kind, esc(tok)))
        pos = m.end()
    out.append(esc(code[pos:]))
    return "".join(out)

def convert_inline(s):
    ph = []
    def stash(x):
        ph.append(x); return "\x00%d\x00" % (len(ph)-1)
    # inline math  $`...`$  -> \( ... \)
    s = re.sub(r"\$`(.+?)`\$", lambda m: stash("\\(" + esc(m.group(1)) + "\\)"), s)
    # inline code
    s = re.sub(r"`([^`]+?)`", lambda m: stash("<code>" + esc(m.group(1)) + "</code>"), s)
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: '<a href="%s">%s</a>' % (fix_href(m.group(2)), m.group(1)), s)
    s = re.sub("\x00(\\d+)\x00", lambda m: ph[int(m.group(1))], s)
    return s

def is_listitem(line):
    return re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", line)

def render_list(items):
    out = []
    stack = []  # (indent, kind)
    for indent, kind, content in items:
        while stack and indent < stack[-1][0]:
            out.append("</li></%s>" % stack.pop()[1])
        if not stack or indent > stack[-1][0]:
            stack.append((indent, kind))
            out.append("<%s>" % kind)
        else:
            out.append("</li>")
        out.append("<li>" + content)
    while stack:
        out.append("</li></%s>" % stack.pop()[1])
    return "".join(out)

def convert_blocks(lines):
    out = []
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        st = line.strip()
        if st == "":
            i += 1; continue
        # 末尾のナビ（→ 次 / → 目次）は HTML では章間ナビが担う
        if st.startswith("→ 次") or st.startswith("→ 目次"):
            i += 1; continue
        # 本文中の好きな位置にデモを置く: <!-- widget:NAME -->（GitHub 上の Markdown では表示されない）
        m = re.match(r"^<!--\s*widget:(\w+)\s*-->$", st)
        if m:
            out.append('<div class="widget" data-widget="%s"></div>' % m.group(1))
            i += 1; continue
        # code fence
        if st.startswith("```"):
            lang = st[3:].strip()
            body = []
            i += 1
            while i < n and lines[i].strip() != "```":
                body.append(lines[i]); i += 1
            i += 1
            if lang == "fig":
                name = (body[0].strip() if body else "")
                if name not in FIGS:
                    # 他の章が書きかけでも全体のビルドを止めない（警告して目立つ印を出す）
                    print("WARNING: unknown figure %r" % name, file=sys.stderr)
                    out.append('<div class="katex-error" style="color:var(--alias)">[unknown figure: %s]</div>' % esc(name))
                    continue
                out.append(FIGS[name])
                continue
            code = "\n".join(body)
            if lang in ("c", "h", "cpp"):
                out.append('<pre class="code"><code class="lang-c">%s</code></pre>' % highlight_c(code))
            else:
                cls = ' class="lang-%s"' % lang if lang else ""
                out.append('<pre class="code"><code%s>%s</code></pre>' % (cls, esc(code)))
            continue
        # display math
        if st == "$$":
            body = []
            i += 1
            while i < n and lines[i].strip() != "$$":
                body.append(lines[i].strip()); i += 1
            i += 1
            tex = esc(" ".join(body))
            out.append('<div class="eqn">\\[ %s \\]</div>' % tex)
            continue
        # heading
        m = re.match(r"^(#{1,6})\s+(.*)$", st)
        if m:
            lv = len(m.group(1)); txt = convert_inline(m.group(2))
            out.append(("<h%d id=\"%s\">%s</h%d>" % (lv, heading_id(m.group(2)), txt, lv)) if lv in (2, 3) else ("<h%d>%s</h%d>" % (lv, txt, lv)))
            i += 1; continue
        # horizontal rule
        if re.match(r"^-{3,}$", st):
            out.append("<hr>"); i += 1; continue
        # blockquote
        if st.startswith(">"):
            inner = []
            while i < n and (lines[i].strip().startswith(">") or (lines[i].strip()=="" and i+1<n and lines[i+1].strip().startswith(">"))):
                l = lines[i]
                l = re.sub(r"^\s*>\s?", "", l)
                inner.append(l); i += 1
            out.append("<blockquote>%s</blockquote>" % convert_blocks(inner))
            continue
        # table
        if st.startswith("|") and i+1 < n and re.match(r"^\s*\|[\s:\-|]+\|\s*$", lines[i+1]):
            header = [c.strip() for c in st.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            th = "".join("<th>%s</th>" % convert_inline(c) for c in header)
            trs = []
            for r in rows:
                tds = "".join("<td>%s</td>" % convert_inline(c) for c in r)
                trs.append("<tr>%s</tr>" % tds)
            out.append('<div class="tablewrap"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (th, "".join(trs)))
            continue
        # list
        if is_listitem(line):
            items = []
            while i < n:
                lm = is_listitem(lines[i])
                if lm:
                    indent = len(lm.group(1))
                    kind = "ol" if re.match(r"\d+\.", lm.group(2)) else "ul"
                    content = lm.group(3)
                    cb = re.match(r"^\[([ xX])\]\s+(.*)$", content)
                    if cb:
                        mark = "☑" if cb.group(1).lower()=="x" else "☐"
                        items.append((indent, kind, '<span class="task">%s</span> %s' % (mark, convert_inline(cb.group(2)))))
                    else:
                        items.append((indent, kind, convert_inline(content)))
                    i += 1
                elif lines[i].strip() != "" and lines[i].startswith(("  ", "\t")):
                    if items:
                        ind, kind, c = items[-1]
                        items[-1] = (ind, kind, c + " " + convert_inline(lines[i].strip()))
                    i += 1
                else:
                    break
            out.append(render_list(items))
            continue
        # paragraph
        para = [st]
        i += 1
        while i < n:
            l = lines[i]; s2 = l.strip()
            if s2 == "" or s2.startswith(("#", "```", "$$", ">", "|", "→ 次", "→ 目次", "<!--")) or is_listitem(l) \
               or re.match(r"^-{3,}$", s2):
                break
            para.append(s2); i += 1
        out.append("<p>%s</p>" % convert_inline(" ".join(para)))
    return "".join(out)

def parse_file(path):
    _SEEN_SLUGS.clear()
    raw = open(path, encoding="utf-8").read().split("\n")
    title = ""
    lines = []
    for idx, l in enumerate(raw):
        if not title and l.startswith("# "):
            title = l[2:].strip()
            lines = raw[idx+1:]
            break
    return title, convert_blocks(lines)

# ---- テンプレート ----
KATEX = (
 '<link rel="stylesheet" href="katex/katex.min.css">\n'
 '<script defer src="katex/katex.min.js"></script>\n'
 '<script defer src="katex/contrib/auto-render.min.js" '
 'onload="renderMathInElement(document.body,{delimiters:[{left:\'$$\',right:\'$$\',display:true},{left:\'\\\\[\',right:\'\\\\]\',display:true},{left:\'\\\\(\',right:\'\\\\)\',display:false}],throwOnError:false});"></script>\n'
 '<script defer src="katex/contrib/copy-tex.min.js"></script>'
)

def page(num, title, body, prev_c, next_c):
    nav_prev = ('<a class="pn" href="%s.html"><span>←</span><b>%s</b></a>' % (prev_c[0], prev_c[1])) if prev_c else '<span class="pn dis"></span>'
    nav_next = ('<a class="pn nx" href="%s.html"><b>%s</b><span>→</span></a>' % (next_c[0], next_c[1])) if next_c else '<span class="pn dis"></span>'
    has_widget = 'data-widget' in body
    wscript = '<script defer src="widgets.js?v=%s"></script>' % _ver("widgets.js") if has_widget else ''
    tshort = re.sub(r'^[0-9]+[.\s]*', '', title)
    tshort_html = convert_inline(tshort)
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} — {SERIES}</title>
<link rel="stylesheet" href="comm.css?v={_ver('comm.css')}">
{KATEX}
{wscript}
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{{"token": "7b6e9d2633b64a6bba9a294bb612c422"}}'></script><!-- End Cloudflare Web Analytics -->
</head>
<body>
<header class="top">
  <a class="home" href="../../comm.html">{HOME_LABEL}</a>
  <span class="cur">{esc(num)} · {esc(tshort)}</span>
  <span class="sp"></span>
  <button class="toggle" id="themeBtn" aria-label="配色切替"><svg id="themeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg><span id="themeLbl">テーマ</span></button>
</header>
<main class="doc">
  <p class="chno">Chapter {esc(num)}</p>
  <h1 class="doctitle">{tshort_html}</h1>
  {body}
  <nav class="chnav">{nav_prev}{nav_next}</nav>
</main>
<script>
(function(){{
  var root=document.documentElement,b=document.getElementById('themeBtn'),lbl=document.getElementById('themeLbl'),ic=document.getElementById('themeIcon');
  var sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>';
  var moon='<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>';
  function dark(){{var t=root.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;}}
  function sync(){{var d=dark();lbl.textContent=d?'ダーク':'ライト';ic.innerHTML=d?moon:sun;}}
  b.addEventListener('click',function(){{root.setAttribute('data-theme',dark()?'light':'dark');sync();window.dispatchEvent(new Event('themechange'));}});
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(){{sync();window.dispatchEvent(new Event('themechange'));}});
  sync();
}})();
</script>
</body>
</html>
"""

def _title_of(path):
    if path is None:
        return ""
    for l in open(path, encoding="utf-8"):
        if l.startswith("# "):
            return l[2:].strip()
    return ""

metas = []
for num, fn in CHAPTERS:
    if num in PENDING:
        metas.append((num, PENDING[num], None if (ONLY and num not in ONLY) else
                      '<blockquote><p>この章は準備中である。公開まで、<a href="../../comm.html">目次</a>から前後の章を読んでほしい。</p></blockquote>'))
        continue
    if ONLY and num not in ONLY:
        metas.append((num, _title_of(os.path.join(SRC, fn)), None))
        continue
    t, b = parse_file(os.path.join(SRC, fn))
    metas.append((num, t, b))

def short(t):
    return re.sub(r'^[0-9]+[.\s]*', '', t)

for k, (num, title, body) in enumerate(metas):
    if body is None:
        continue
    prev_c = (metas[k-1][0], short(metas[k-1][1])) if k > 0 else None
    next_c = (metas[k+1][0], short(metas[k+1][1])) if k < len(metas)-1 else None
    open(os.path.join(OUT, "%s.html" % num), "w", encoding="utf-8").write(page(num, title, body, prev_c, next_c))
    print("wrote", os.path.join(OUT, "%s.html" % num), title)

print("titles:", [short(m[1]) for m in metas])
