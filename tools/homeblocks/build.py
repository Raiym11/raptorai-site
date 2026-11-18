"""Переносит блоки главной на страницы услуг: CSS главной с префиксом .hb, секции в обёртке .hb."""
import re, sys, os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'public')
home = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', home, re.S))
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)

def split_blocks(t):
    out, i, n = [], 0, len(t)
    while i < n:
        j = t.find('{', i)
        if j < 0: break
        head = t[i:j].strip(); depth = 1; k = j + 1
        while k < n and depth:
            if t[k] == '{': depth += 1
            elif t[k] == '}': depth -= 1
            k += 1
        out.append((head, t[j + 1:k - 1])); i = k
    return out

def pre(sel):
    s = sel.strip()
    if not s: return s
    if s in (':root', 'html', 'body', '*', '*::before', '*::after') or s.startswith(('html ', 'body ')) and ' .' not in s and '#' not in s:
        return None
    m = re.match(r'(html(?:\.[\w-]+)*)\s+(.*)', s)
    if m: return m.group(1) + ' .hb ' + m.group(2)
    if s.startswith('body '): return '.hb ' + s[5:]
    return '.hb ' + s

def walk(t):
    res = []
    for head, body in split_blocks(t):
        if head.startswith('@media') or head.startswith('@supports'):
            res.append(head + '{' + walk(body) + '}')
        elif head.startswith('@'):
            res.append(head + '{' + body + '}')
        else:
            sels = [pre(x) for x in head.split(',')]
            sels = [x for x in sels if x]
            if sels: res.append(','.join(sels) + '{' + body + '}')
    return '\n'.join(res)

out = walk(css)
# цвета главной -> переменные, чтобы каждая страница подставила свой стиль
for a, b in [(r'rgba\(0,\s*212,\s*255,', 'rgba(var(--hba-rgb),'), (r'rgba\(140,\s*123,\s*255,', 'rgba(var(--hbb-rgb),'),
             (r'#00[Dd]4[Ff][Ff]\b', 'var(--hba)'), (r'#00b4e6\b', 'var(--hba)'), (r'var\(--cyan\)', 'var(--hba)'),
             (r'#8[Cc]7[Bb][Ff][Ff]\b', 'var(--hbb)'), (r'#7a5cff\b', 'var(--hbb)'), (r'#FF7AE0\b', 'var(--hbc)')]:
    out = re.sub(a, b, out)
out = '.hb{--hba:#00D4FF;--hba-rgb:0,212,255;--hbb:#8C7BFF;--hbb-rgb:140,123,255;--hbc:#FF7AE0}\n' + out
open(os.path.join(ROOT, 'css', 'home-blocks.css'), 'w', encoding='utf-8').write('/* сгенерировано tools/homeblocks/build.py из index.html */\n' + out)
print(len(out))

# ---- секции ----
def grab_section(sid):
    m = re.search(r'<section id="%s"[^>]*>' % sid, home); e = home.index('</section>', m.end()) + 10
    return home[m.start():e]
def grab_stats():
    a = home.index('<div class="stats"'); depth = 0; i = a
    for m in re.finditer(r'<div\b|</div>', home[a:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0: return home[a:a + m.end()]
blk = {k: grab_section(k) for k in ['pain', 'how', 'companies', 'compare', 'why', 'calc', 'final-cta', 'checklist']}
blk['compare'] = blk['compare'].replace('<section id="compare"', '<section id="alt-compare"', 1)
blk['stats'] = grab_stats()
pw_js = re.search(r"var pw=document.getElementById\('pw'\).*?observe\(pw\);\}", home, re.S).group(0)
JS = "<script>(function(){" + pw_js + "})();</script>"
W = lambda keys, tag: '\n<!--hb:%s--><div class="hb">\n' % tag + '\n'.join(blk[k] for k in keys) + '\n</div><!--/hb:%s-->\n' % tag
pages = ['ai-agent-dlya-biznesa.html', 'ii-agent-chatgpt.html', 'ii-agent-gemini.html', 'ii-agent-claude.html', 'avtomatizaciya-n8n.html', 'telegram-bot-s-ii.html']
def before(s, pat, ins):
    m = re.search(pat, s); return s[:m.start()] + ins + s[m.start():]
def after_section(s, sid, ins):
    m = re.search(r'<section id="%s"[^>]*>' % sid, s); e = s.index('</section>', m.end()) + 10
    return s[:e] + ins + s[e:]
for f in pages:
    p = os.path.join(ROOT, f); s = open(p, encoding='utf-8').read()
    s = re.sub(r'\n<!--hb:(\w+)-->.*?<!--/hb:\1-->\n', '', s, flags=re.S)
    s = re.sub(r'<script>\(function\(\)\{var pw=.*?</script>\n?', '', s, flags=re.S)
    s = before(s, r'<section id="features"', W(['stats', 'pain'], 'top'))
    s = after_section(s, 'case', W(['how', 'companies'], 'mid'))
    anchor = 'reviews' if re.search(r'<section id="reviews"', s) else 'details'
    s = after_section(s, anchor, W(['why', 'compare', 'calc'], 'low'))
    s = before(s, r'<section id="contact"', W(['final-cta'], 'cta'))
    s = after_section(s, 'contact', W(['checklist'], 'end'))
    acc = re.search(r'--acc:(#[0-9A-Fa-f]{6})', s).group(1); acc2 = re.search(r'--acc2:(#[0-9A-Fa-f]{6})', s).group(1)
    rgb = lambda h: ','.join(str(int(h[i:i + 2], 16)) for i in (1, 3, 5))
    s = re.sub(r'<style id="hb-theme">.*?</style>\n?', '', s, flags=re.S)
    s = s.replace('</head>', '<style id="hb-theme">.hb{--hba:%s;--hba-rgb:%s;--hbb:%s;--hbb-rgb:%s;--hbc:%s}</style>\n</head>' % (acc, rgb(acc), acc2, rgb(acc2), acc2), 1)
    if '/css/home-blocks.css' not in s:
        s = s.replace('</head>', '<link rel="stylesheet" href="/css/home-blocks.css?v=1">\n</head>', 1)
    s = re.sub(r'/js/fx\.js\?v=\d+', '/js/fx.js?v=10', s)
    s = s.replace('</body>', JS + '\n</body>', 1)
    open(p, 'w', encoding='utf-8').write(s); print('ok', f)
