#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""effects/*.md -> effects/html/NN.html (自己完結・KaTeX数式・図・章間ナビ)。"""
import os, re, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from figures import F as FIGS

SRC = "/home/user/documents/effects"
OUT = "/home/user/documents/effects/html"
os.makedirs(OUT, exist_ok=True)

CHAPTERS = [
    ("01", "01_エフェクターの全体像.md"),
    ("02", "02_音の物理の最小限.md"),
    ("03", "03_ブースターとプリアンプ.md"),
    ("04", "04_オーバードライブとディストーション.md"),
    ("05", "05_ファズ.md"),
    ("06", "06_コンプレッサー.md"),
    ("07", "07_ノイズゲートとノイズ対策.md"),
    ("08", "08_イコライザとトーン回路.md"),
    ("09", "09_ワウとフィルタ系.md"),
    ("10", "10_トレモロとビブラート.md"),
    ("11", "11_コーラス.md"),
    ("12", "12_フランジャー.md"),
    ("13", "13_フェイザー.md"),
    ("14", "14_ロータリースピーカーとユニヴァイブ.md"),
    ("15", "15_ピッチ系.md"),
    ("16", "16_ディレイ.md"),
    ("17", "17_リバーブ.md"),
    ("18", "18_飛び道具と実験系.md"),
    ("19", "19_接続と電源の実務.md"),
    ("20", "20_音作りのレシピ集.md"),
]

# 章ごとのインタラクティブ部品の差し込み: 見出しに含む文字列 -> widget名 (見出し直後に挿入)
WIDGETS = {
    "01": [("つなぎ順で音がどう変わるか", "chain")],
    "02": [("倍音を足して音色を作る", "harmonics")],
    "03": [("ゲインとヘッドルーム", "boost")],
    "04": [("クリッピングと倍音", "clip")],
    "05": [("ファズの潰れ方とゲート", "fuzz")],
    "06": [("コンプの効きを見る", "comp")],
    "07": [("ゲートの開閉を見る", "gate")],
    "08": [("イコライザで音色を彫る", "eq")],
    "09": [("ワウの山を動かす", "wah")],
    "10": [("LFO で音量を揺らす", "trem")],
    "11": [("揺れる遅延を混ぜる", "chorus")],
    "12": [("櫛形フィルタを掃引する", "flanger")],
    "13": [("ノッチの数と動き", "phaser")],
    "14": [("回転を分解する", "rotary")],
    "15": [("オクターブと整流", "pitch")],
    "16": [("タイムとフィードバック", "delay")],
    "17": [("空間を設計する", "reverb")],
    "18": [("飛び道具を鳴らす", "weird")],
    "19": [("接続を設計する", "wiring")],
    "20": [("レシピをつまみに翻訳する", "recipes")],
}

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

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
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: '<a href="%s">%s</a>' % (m.group(2), m.group(1)), s)
    s = re.sub("\x00(\\d+)\x00", lambda m: ph[int(m.group(1))], s)
    return s

def is_listitem(line):
    return re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", line)

def render_list(items):
    # items: list of (indent, kind 'ul'/'ol', inline_html)  -> nested by indent
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
        # skip trailing nav
        if st.startswith("→ 次"):
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
                    raise SystemExit("unknown figure: %r" % name)
                out.append(FIGS[name])
                continue
            cls = ' class="lang-%s"' % lang if lang else ""
            out.append("<pre><code%s>%s</code></pre>" % (cls, esc("\n".join(body))))
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
            out.append("<h%d>%s</h%d>" % (lv, txt, lv))
            i += 1; continue
        # horizontal rule
        if re.match(r"^-{3,}$", st):
            out.append("<hr>"); i += 1; continue
        # image (+ optional italic caption on next non-blank line)
        m = re.match(r"^!\[(.*?)\]\((.*?)\)\s*$", st)
        if m:
            alt, path = m.group(1), m.group(2)
            path = path.replace("figures/", "../figures/")
            cap = ""
            j = i + 1
            while j < n and lines[j].strip() == "":
                j += 1
            if j < n:
                cm = re.match(r"^\*(.+)\*$", lines[j].strip())
                if cm:
                    cap = "<figcaption>%s</figcaption>" % convert_inline(cm.group(1))
                    i = j
            out.append('<figure><img src="%s" alt="%s" loading="lazy">%s</figure>' % (path, esc(alt), cap))
            i += 1; continue
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
                    # checkbox
                    cb = re.match(r"^\[([ xX])\]\s+(.*)$", content)
                    if cb:
                        mark = "☑" if cb.group(1).lower()=="x" else "☐"
                        content = '<span class="task">%s</span> %s' % (mark, cb.group(2))
                        items.append((indent, kind, content if content.startswith('<span') else convert_inline(content)))
                        # note: already partly html; process the tail inline
                        items[-1] = (indent, kind, '<span class="task">%s</span> %s' % (mark, convert_inline(cb.group(2))))
                    else:
                        items.append((indent, kind, convert_inline(content)))
                    i += 1
                elif lines[i].strip() != "" and lines[i].startswith(("  ", "\t")):
                    # continuation of previous item
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
            if s2 == "" or s2.startswith(("#", "```", "$$", ">", "|", "→ 次")) or is_listitem(l) \
               or re.match(r"^!\[", s2) or re.match(r"^-{3,}$", s2):
                break
            para.append(s2); i += 1
        out.append("<p>%s</p>" % convert_inline(" ".join(para)))
    return "".join(out)

def inject_widgets(num, body):
    for key, wname in WIDGETS.get(num, []):
        widget_div = '<div class="widget" data-widget="%s"></div>' % wname
        # fig:NAME → その図の </figure> 直後に挿入
        if key.startswith("fig:"):
            idx = body.find(key[4:])
            if idx != -1:
                end = body.index("</figure>", idx) + len("</figure>")
                body = body[:end] + widget_div + body[end:]
            continue
        # 最初に見つかった見出しの直後に widget を挿入
        pat = re.compile(r"(<h[23]>[^<]*" + re.escape(key) + r"[^<]*</h[23]>)")
        def repl(m):
            return m.group(1) + '<div class="widget" data-widget="%s"></div>' % wname
        body, cnt = pat.subn(repl, body, count=1)
    return body

def parse_file(path):
    raw = open(path, encoding="utf-8").read().split("\n")
    # 先頭 h1 をタイトルに
    title = ""
    lines = []
    for idx, l in enumerate(raw):
        if not title and l.startswith("# "):
            title = l[2:].strip()
            lines = raw[idx+1:]
            break
    body = convert_blocks(lines)
    return title, body

# ---- テンプレート ----
KATEX = (
 '<link rel="stylesheet" href="katex/katex.min.css">\n'
 '<script defer src="katex/katex.min.js"></script>\n'
 '<script defer src="katex/contrib/auto-render.min.js" '
 'onload="renderMathInElement(document.body,{delimiters:[{left:\'$$\',right:\'$$\',display:true},{left:\'\\\\[\',right:\'\\\\]\',display:true},{left:\'\\\\(\',right:\'\\\\)\',display:false}],throwOnError:false});"></script>'
)

def page(num, title, body, prev_c, next_c):
    nav_prev = ('<a class="pn" href="%s.html"><span>←</span><b>%s</b></a>' % (prev_c[0], prev_c[1])) if prev_c else '<span class="pn dis"></span>'
    nav_next = ('<a class="pn nx" href="%s.html"><b>%s</b><span>→</span></a>' % (next_c[0], next_c[1])) if next_c else '<span class="pn dis"></span>'
    has_widget = 'data-widget' in body
    wscript = '<script defer src="widgets.js"></script>' if has_widget else ''
    tshort = re.sub(r'^[0-9]+[.\s]*', '', title)
    tshort_html = convert_inline(tshort)
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} — エフェクター編</title>
<link rel="stylesheet" href="effects.css">
{KATEX}
{wscript}
</head>
<body>
<header class="top">
  <a class="home" href="../../effects.html">Effects</a>
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

metas = []
for num, fn in CHAPTERS:
    t, b = parse_file(os.path.join(SRC, fn))
    metas.append((num, t, b))

def short(t):
    return re.sub(r'^[0-9]+[.\s]*', '', t)

for k, (num, title, body) in enumerate(metas):
    body = inject_widgets(num, body)
    prev_c = (metas[k-1][0], short(metas[k-1][1])) if k > 0 else None
    next_c = (metas[k+1][0], short(metas[k+1][1])) if k < len(metas)-1 else None
    open(os.path.join(OUT, "%s.html" % num), "w", encoding="utf-8").write(page(num, title, body, prev_c, next_c))
    print("wrote", num, title)

print("titles:", [short(m[1]) for m in metas])
