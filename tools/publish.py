#!/usr/bin/env python3
"""Публикует статьи из queue/ по расписанию: копирует в public/, добавляет карточку в blog.html и запись в sitemap.xml."""
import json, os, shutil, sys, html, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q, PUB = os.path.join(ROOT, 'queue'), os.path.join(ROOT, 'public')
today = os.environ.get('TODAY') or (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=3)).strftime('%Y-%m-%d')  # Москва
sched = json.load(open(os.path.join(Q, 'schedule.json'), encoding='utf-8'))
due = sorted([s for s in sched if s['date'] <= today and not os.path.exists(os.path.join(PUB, s['file']))], key=lambda s: s['date'])
if not due:
    print('нечего публиковать на', today); sys.exit(0)
blog_p, map_p = os.path.join(PUB, 'blog.html'), os.path.join(PUB, 'sitemap.xml')
blog, smap = open(blog_p, encoding='utf-8').read(), open(map_p, encoding='utf-8').read()
marker = '<div class="post-list">'
assert marker in blog, 'в blog.html нет post-list'
for s in due:  # от старых к новым, новая карточка оказывается сверху
    shutil.copy(os.path.join(Q, s['file']), os.path.join(PUB, s['file']))
    d = '.'.join(reversed(s['date'].split('-')))
    card = (f'    <a class="post-card" href="/{s["file"]}"><div class="article-tag"><i class="fa-solid {s["icon"]}" style="font-size:10px"></i> {html.escape(s["tag"])}</div>'
            f'<h2>{html.escape(s["title"])}</h2><p>{html.escape(s["card"])}</p><div class="article-meta"><span><i class="fa-regular fa-calendar" style="margin-right:6px"></i>{d}</span>'
            f'<span><i class="fa-regular fa-clock" style="margin-right:6px"></i>{s["mins"]}</span></div></a>\n')
    blog = blog.replace(marker, marker + '\n' + card, 1)
    url = f'  <url><loc>https://www.raptorai.ru/{s["file"]}</loc><lastmod>{s["date"]}</lastmod></url>\n'
    if s['file'] not in smap:
        smap = smap.replace('</urlset>', url + '</urlset>')
    print('опубликовано:', s['file'])
open(blog_p, 'w', encoding='utf-8').write(blog); open(map_p, 'w', encoding='utf-8').write(smap)
