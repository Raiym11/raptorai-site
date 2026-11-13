/* RaptorAI: блоки страниц услуг под первым экраном (без библиотек).
   Каждый интерактив включается, когда блок подходит к экрану. */
(function () {
  'use strict';
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function later(ms, fn) { return setTimeout(fn, reduce ? 0 : ms); }
  function plural(n, a, b, c) { var m = n % 100, k = n % 10; return (m > 10 && m < 20) ? c : k === 1 ? a : (k > 1 && k < 5) ? b : c; }

  /* фон: два медленных пятна в цвете страницы */
  if (!reduce && !mq('(max-width: 760px)')) {
    var gl = document.createElement('div'); gl.className = 'bk-glows'; gl.setAttribute('aria-hidden', 'true');
    gl.innerHTML = '<i></i><i></i>'; document.body.insertBefore(gl, document.body.firstChild);
  }

  /* маленькая копия 3D-объекта из первого экрана */
  var snapUrl = window.__h3dSnap || null;
  function paintBuddy(b) { if (snapUrl && !b.classList.contains('bk-tile')) { b.style.backgroundImage = 'url(' + snapUrl + ')'; b.classList.add('img'); } }
  document.addEventListener('h3d:snap', function (e) { snapUrl = e.detail.url; $$('.bk-buddy').forEach(paintBuddy); });

  /* счёт от нуля */
  function count(el, to, ms) {
    var f = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, ' '); };
    if (reduce) { el.textContent = f(to); return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / (ms || 1800)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = f(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* элементы «живого экрана»: реплики, плашки, файл, узел схемы, форма, кнопки меню, стопка страниц */
  function node(step) {
    var k = step.charAt(0), rest = step.slice(2), el = document.createElement('div'), p;
    if (k === 'u' || k === 'b') { el.className = 'mm ' + k; el.textContent = rest; }
    else if (k === 's') { el.className = 'ss'; el.textContent = rest; }
    else if (k === 'k' || k === 'F') { el.className = k === 'k' ? 'sk' : 'sF'; rest.split(';').forEach(function (x) { var c = document.createElement('span'); c.textContent = x; el.appendChild(c); }); }
    else if (k === 'P') { el.className = 'sP'; el.innerHTML = '<i></i><i></i><i></i><i></i><b></b>'; el.lastChild.textContent = rest; }
    else if (k === 'v') { el.className = 'sv'; var bars = ''; for (var i = 0; i < 16; i++) bars += '<s style="--k:' + ((i * 7) % 11) + '"></s>'; el.innerHTML = '<i class="fa-solid fa-play"></i><span>' + bars + '</span>' + rest; }
    else { p = rest.indexOf(':'); el.className = k === 'c' ? 'sc' : k === 'f' ? 'sf' : k === 'm' ? 'sn sm' : 'sn'; var ic = document.createElement('i'); ic.className = rest.slice(0, p); el.appendChild(ic); el.appendChild(document.createTextNode(rest.slice(p + 1))); }
    return el;
  }

  var INIT = {};

  /* ---------- цены ---------- */
  INIT.pkc = function (box) {
    var n8n = box.getAttribute('data-mode') === 'n8n';
    var cards = $$('.pk-card', box.parentNode);
    var outs = $$('output', box), sw = $('input[type=checkbox]', box);
    var vals = n8n ? [2] : [1, 0], mins = n8n ? [1] : [0, 0];
    var num = $('.pkc-num b', box), word = $('.pkc-word', box), name = $('.pkc-pk', box), price = $('.pkc-price', box), note = $('.pkc-res small', box), lead = $('.pkc-lead', box);
    var last = null;
    function pick() {
      var total = vals.reduce(function (a, b) { return a + b; }, 0), hard = sw.checked, k;
      if (hard) k = 2; else if (n8n) k = total <= 3 ? 0 : total <= 6 ? 1 : 2; else k = total <= 1 ? 0 : total <= 4 ? 1 : 2;
      outs.forEach(function (o, i) { o.textContent = vals[i]; });
      $$('.pkc-step', box).forEach(function (st, i) {
        var b = $$('button', st);
        b[0].disabled = vals[i] <= mins[i] || (!n8n && total <= 1);
        b[1].disabled = vals[i] >= 12;
      });
      var label = hard ? 'Есть сложное подключение' : total + ' ' + plural(total, 'подключение', 'подключения', 'подключений');
      if (hard) { lead.style.display = 'none'; word.textContent = label; }
      else { lead.style.display = ''; word.textContent = plural(total, 'подключение', 'подключения', 'подключений'); if (num.textContent !== String(total)) { num.textContent = total; num.classList.remove('flip'); void num.offsetWidth; num.classList.add('flip'); } }
      var c = cards[k];
      name.textContent = '«' + $('.pk-name', c).textContent.trim() + '»';
      price.textContent = $('.pk-price', c).textContent.replace(/\s+/g, ' ').trim();
      note.style.display = hard ? '' : 'none';
      if (k !== last) { last = k; cards.forEach(function (x, i) { x.classList.toggle('is-pick', i === k); x.classList.toggle('is-dim', i !== k); }); }
    }
    $$('.pkc-step', box).forEach(function (st, i) {
      st.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b || b.disabled) return;
        vals[i] = Math.max(mins[i], Math.min(12, vals[i] + (+b.getAttribute('data-d')))); pick();
      });
    });
    sw.addEventListener('change', pick);
    pick();
  };

  /* ---------- ИИ-агент: один день ---------- */
  INIT.day = function (box) {
    var track = $('.day-track', box), cards = $$('.day-card', box), bud = $('.bk-buddy', box), cur = -1, raf = 0;
    if (bud) paintBuddy(bud);
    function center(c) { return c.offsetLeft + c.offsetWidth / 2; }
    function sync() {
      raf = 0;
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(center(c) - mid); if (d < bd) { bd = d; best = i; } });
      if (best === cur) return;
      cur = best;
      cards.forEach(function (c, i) { c.classList.toggle('on', i === best); });
      box.setAttribute('data-phase', cards[best].getAttribute('data-phase'));
      if (bud) bud.style.left = center(cards[best]) + 'px';
    }
    function go(i) { i = Math.max(0, Math.min(cards.length - 1, i)); track.scrollTo({ left: center(cards[i]) - track.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' }); }
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', function () { cur = -1; sync(); });
    cards.forEach(function (c, i) { c.addEventListener('click', function () { if (!moved) go(i); }); });
    $$('.day-nav button', box).forEach(function (b) { b.addEventListener('click', function () { go(cur + (+b.getAttribute('data-d'))); }); });
    /* перетаскивание мышью */
    var down = false, moved = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5 && !moved) { moved = true; track.classList.add('drag'); }
      if (moved) track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) { track.classList.remove('drag'); go(cur); setTimeout(function () { moved = false; }, 60); }
    });
    track.scrollLeft = 0; sync();
    /* один раз показываем, что ленту можно двигать */
    if (!reduce) later(900, function () { if (cur === 0) { go(1); later(1500, function () { if (cur === 1 && !down) go(0); }); } });
  };

  /* ---------- ИИ-агент: вкладки ---------- */
  INIT.tabs = function (box) {
    var btns = $$('.tabs-bar button', box), run = $('.tabs-run', box), panes = $$('.tab-pane', box), timers = [];
    function show(i) {
      timers.forEach(clearTimeout); timers = [];
      btns.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
      run.style.width = btns[i].offsetWidth + 'px';
      run.style.transform = 'translate(' + btns[i].offsetLeft + 'px,' + (btns[i].offsetTop - 6) + 'px)';
      panes.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      var ms = $$('.mm', panes[i]), t = 150;
      ms.forEach(function (m) { m.classList.remove('in', 'wait'); });
      if (reduce) { ms.forEach(function (m) { m.classList.add('in'); }); return; }
      ms.forEach(function (m) {
        var bot = m.classList.contains('b');
        if (bot) { timers.push(setTimeout(function () { m.classList.add('wait'); }, t)); t += 850; }
        timers.push(setTimeout(function () { m.classList.remove('wait'); m.classList.add('in'); }, t));
        t += 650;
      });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });
    window.addEventListener('resize', function () { var i = btns.findIndex(function (b) { return b.classList.contains('on'); }); run.style.width = btns[i].offsetWidth + 'px'; run.style.transform = 'translate(' + btns[i].offsetLeft + 'px,' + (btns[i].offsetTop - 6) + 'px)'; });
    show(0);
  };

  /* ---------- ИИ-агент: график ---------- */
  function chartInit(box) {
    var data = box.getAttribute('data-points').split(',').map(Number), labels = box.getAttribute('data-labels').split('|');
    var launch = +box.getAttribute('data-launch'), wrap = $('.chart-box', box), tip = $('.chart-tip', box);
    var W = 640, H = 330, L = 10, R = 18, T = 36, B = 34, N = data.length, max = Math.max.apply(null, data) * 1.06;
    var P = data.map(function (v, i) { return [L + (W - L - R) * i / (N - 1), T + (H - T - B) * (1 - v / max)]; });
    var d = 'M' + P[0][0] + ' ' + P[0][1];
    for (var i = 1; i < N; i++) { var mx = (P[i - 1][0] + P[i][0]) / 2; d += ' C' + mx + ' ' + P[i - 1][1] + ',' + mx + ' ' + P[i][1] + ',' + P[i][0] + ' ' + P[i][1]; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + box.getAttribute('data-alt') + '"><defs>' +
      '<linearGradient id="bkLine" x1="0" x2="1"><stop offset="0" stop-color="var(--pacc)"/><stop offset="1" stop-color="var(--pacc2)"/></linearGradient>' +
      '<linearGradient id="bkArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pacc)" stop-opacity=".32"/><stop offset="1" stop-color="var(--pacc)" stop-opacity="0"/></linearGradient></defs>';
    s += '<line class="chart-launch" x1="' + P[launch][0] + '" x2="' + P[launch][0] + '" y1="' + (T - 14) + '" y2="' + (H - B) + '"/><text class="chart-ltxt" x="' + (P[launch][0] + 8) + '" y="' + (T - 4) + '">Запуск агента</text>';
    s += '<path class="chart-area" d="' + d + ' L' + P[N - 1][0] + ' ' + (H - B) + ' L' + P[0][0] + ' ' + (H - B) + ' Z"/><path class="chart-line" pathLength="1" d="' + d + '"/>';
    P.forEach(function (p, k) {
      if (k % 2 === 0) s += '<text class="chart-ax" text-anchor="middle" x="' + p[0] + '" y="' + (H - 10) + '">' + labels[k] + '</text>';
      s += '<circle class="chart-hit" data-k="' + k + '" cx="' + p[0] + '" cy="' + p[1] + '" r="18"/><circle class="chart-pt" style="--i:' + k + '" cx="' + p[0] + '" cy="' + p[1] + '" r="4.5"/>';
    });
    wrap.insertAdjacentHTML('afterbegin', s + '</svg>');
    var pts = $$('.chart-pt', wrap);
    function show(k) {
      pts.forEach(function (c, j) { c.classList.toggle('on', j === k); });
      if (k < 0) { tip.classList.remove('on'); return; }
      tip.innerHTML = labels[k] + ' · <b>' + data[k] + '</b> ' + plural(data[k], 'клиент', 'клиента', 'клиентов');
      tip.style.left = (P[k][0] / W * 100) + '%'; tip.style.top = (P[k][1] / H * 100) + '%'; tip.classList.toggle('r', k > N - 4); tip.classList.toggle('l', k < 2); tip.classList.add('on');
    }
    $$('.chart-hit', wrap).forEach(function (h) {
      var k = +h.getAttribute('data-k');
      h.addEventListener('pointerenter', function () { show(k); });
      h.addEventListener('click', function () { show(k); });
    });
    wrap.addEventListener('pointerleave', function () { show(-1); });
    requestAnimationFrame(function () { box.classList.add('in'); });
    $$('[data-count]', box).forEach(function (el) { count(el, +el.getAttribute('data-count'), 2400); });
    later(2600, function () { show(N - 1); });
  }
  INIT.chart = chartInit;

  /* ---------- ИИ-агент: чек-лист ---------- */
  INIT.need = function (box) {
    $$('.need-i', box).forEach(function (el, i) { later(350 + i * 420, function () { el.classList.add('ok'); }); });
  };

  /* ---------- первый блок: возможности в деле ---------- */
  INIT.shw = function (box) {
    var items = $$('.shw-i', box), chat = $('.shw-chat', box), stage = $('.shw-stage', box), desc = $('.shw-desc', box), bud = $('.bk-buddy', box);
    var timers = [], cur = 0, seen = true, flow = box.getAttribute('data-mode') === 'flow', tile = bud && $('b', bud);
    if (bud) paintBuddy(bud);
    function play(i) {
      timers.forEach(clearTimeout); timers = []; cur = i;
      items.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      if (desc) desc.textContent = $('span', items[i]).textContent;
      if (items[i].scrollIntoView && items[i].parentNode.scrollWidth > items[i].parentNode.clientWidth) items[i].parentNode.scrollTo({ left: items[i].offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
      chat.innerHTML = '';
      if (tile && !reduce) { tile.classList.remove('spin'); void tile.offsetWidth; tile.classList.add('spin'); }
      var steps = items[i].getAttribute('data-s').split('|'), t = 350;
      if (flow) {
        /* схема: узлы зигзагом, между ними рисуются светящиеся связи */
        var W = chat.clientWidth, H = chat.clientHeight, ns = steps.filter(function (x) { return x.charAt(0) === 'n'; }), gap = Math.min(78, (H - 110) / Math.max(1, ns.length - 1));
        var svg = '<svg aria-hidden="true"><defs><linearGradient id="flG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pacc)"/><stop offset="1" stop-color="var(--pacc2)"/></linearGradient></defs>', pos = [];
        ns.forEach(function (x, k) { pos.push({ l: k % 2 ? W * 0.34 : W * 0.04, t: 16 + k * gap }); });
        for (var k = 0; k < pos.length - 1; k++) {
          var x1 = pos[k].l + W * 0.31, y1 = pos[k].t + 50, x2 = pos[k + 1].l + W * 0.31, y2 = pos[k + 1].t + 2;
          svg += '<path class="fl-p" pathLength="1" d="M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + 22) + ',' + x2 + ' ' + (y2 - 22) + ',' + x2 + ' ' + y2 + '"/>';
        }
        chat.innerHTML = svg + '</svg>';
        var paths = $$('.fl-p', chat), els = [], ni = 0;
        steps.forEach(function (st) {
          var el = node(st); chat.appendChild(el);
          if (st.charAt(0) === 'n') { el.style.left = pos[ni].l + 'px'; el.style.top = pos[ni].t + 'px'; el.insertAdjacentHTML('beforeend', '<em><i class="fa-solid fa-check"></i></em>'); (function (el, j) {
            if (reduce) { el.classList.add('in', 'ok'); if (paths[j - 1]) paths[j - 1].classList.add('in'); return; }
            if (j > 0) { timers.push(setTimeout(function () { els[j - 1].classList.add('ok'); paths[j - 1].classList.add('in'); }, t)); t += 520; }
            timers.push(setTimeout(function () { el.classList.add('in'); }, t)); t += 780;
          })(el, ni); els.push(el); ni++; }
          else { if (reduce) { el.classList.add('in'); return; } timers.push(setTimeout(function () { if (els.length) els[els.length - 1].classList.add('ok'); el.classList.add('in'); }, t)); t += 700; }
        });
      } else
      steps.forEach(function (st) {
        var el = node(st); chat.appendChild(el);
        if (reduce) { el.classList.add('in'); return; }
        if (st.charAt(0) === 'b') { timers.push(setTimeout(function () { el.classList.add('wait'); }, t)); t += 800; }
        timers.push(setTimeout(function () { el.classList.remove('wait'); el.classList.add('in'); }, t));
        t += st.charAt(0) === 'n' ? 700 : 850;
      });
      if (reduce) return;
      var dur = t + 2600;
      items[i].style.setProperty('--dur', dur + 'ms');
      var u = $('u', items[i]); u.style.animation = 'none'; void u.offsetWidth; u.style.animation = '';
      timers.push(setTimeout(function tick() { if (seen && !document.hidden) play((cur + 1) % items.length); else timers.push(setTimeout(tick, 800)); }, dur));
    }
    items.forEach(function (b, i) { b.addEventListener('click', function () { play(i); }); });
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.15 }).observe(box);
    if (!reduce && mq('(hover: hover) and (pointer: fine)')) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        stage.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(2));
        stage.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 12).toFixed(2));
      });
      stage.addEventListener('pointerleave', function () { stage.style.setProperty('--ry', 0); stage.style.setProperty('--rx', 0); });
    }
    if (bud && !reduce) window.addEventListener('scroll', function () {
      var r = stage.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      bud.style.setProperty('--par', ((r.top + r.height / 2 - innerHeight / 2) * -0.12).toFixed(1));
    }, { passive: true });
    play(0);
  };

  /* ---------- второй блок: «без / с» с переключателем ---------- */
  INIT.ba = function (box) {
    var btns = $$('.ba-sw button', box), chat = $('.ba-chat', box), timers = [], touched = false;
    function set(v, user) {
      if (user) touched = true;
      timers.forEach(clearTimeout); timers = [];
      box.setAttribute('data-state', v);
      btns.forEach(function (b, i) { b.classList.toggle('on', i === v); b.setAttribute('aria-selected', i === v); });
      chat.innerHTML = '';
      var t = 450;
      chat.getAttribute('data-s' + v).split('|').forEach(function (st) {
        var el = node(st); chat.appendChild(el);
        if (reduce) { el.classList.add('in'); return; }
        if (st.charAt(0) === 'b') { timers.push(setTimeout(function () { el.classList.add('wait'); }, t)); t += 750; }
        timers.push(setTimeout(function () { el.classList.remove('wait'); el.classList.add('in'); }, t));
        t += 700;
      });
      if (!v && !touched && !reduce) timers.push(setTimeout(function () { if (!touched) set(1); }, t + 2200));
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { set(i, true); }); });
    $('.ba-knob', box).parentNode.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') set(1, true); if (e.key === 'ArrowLeft') set(0, true); });
    set(0);
  };

  /* ---------- третий блок: кейсы ---------- */
  var VIS = {
    /* сценки на CSS: класс go запускает анимацию, s1..sN включаются по таймингам из data-t */
    anim: function (el) {
      var box = $('.an', el), ts = (box.getAttribute('data-t') || '').split(',').map(Number), timers = [];
      function run() {
        timers.forEach(clearTimeout); timers = [];
        box.className = box.className.replace(/ (go|s\d)/g, ''); void box.offsetWidth;
        if (reduce) { box.classList.add('go'); ts.forEach(function (t, i) { box.classList.add('s' + (i + 1)); }); return; }
        box.classList.add('go');
        ts.forEach(function (t, i) { timers.push(setTimeout(function () { box.classList.add('s' + (i + 1)); }, t)); });
        timers.push(setTimeout(function loop() { if (document.hidden || !box.offsetParent) { timers.push(setTimeout(loop, 1500)); return; } run(); }, ts[ts.length - 1] + 4200));
      }
      box.addEventListener('click', run);
      run();
      return run;
    },
    chart: function (el) { chartInit($('.chart', el)); },
    scan: function (el) {
      var box = $('.scan', el), grid = $('.scan-grid', el), n = mq('(max-width: 900px)') ? 96 : 144, cells = [], timers = [];
      for (var i = 0; i < n; i++) { var c = document.createElement('s'); grid.appendChild(c); cells.push(c); }
      function run(seed) {
        timers.forEach(clearTimeout); timers = [];
        cells.forEach(function (c) { c.className = ''; }); box.classList.remove('go', 'done'); void box.offsetWidth;
        var hits = [], x = seed * 37 + 11;
        while (hits.length < 9) { x = (x * 73 + 29) % n; if (hits.indexOf(x) < 0) hits.push(x); }
        if (reduce) { hits.forEach(function (h, k) { cells[h].classList.add(k < 3 ? 'win' : 'hit'); }); box.classList.add('done'); return; }
        box.classList.add('go');
        var cols = mq('(max-width: 900px)') ? 12 : 16;
        hits.forEach(function (h) { timers.push(setTimeout(function () { cells[h].classList.add('hit'); }, 150 + (h % cols) / cols * 1100)); });
        timers.push(setTimeout(function () { hits.slice(0, 3).forEach(function (h) { cells[h].classList.add('win'); }); box.classList.add('done'); }, 1700));
      }
      $$('.scan-bar button', el).forEach(function (b, i) { b.addEventListener('click', function () { $$('.scan-bar button', el).forEach(function (o) { o.classList.toggle('on', o === b); }); run(i + 1); }); });
      run(1);
      return function () { run(1); };
    },
    cov: function (el) {
      var box = $('.cov', el), card = $('.cov-card', el), timers = [];
      function run() {
        timers.forEach(clearTimeout); timers = [];
        box.classList.remove('go', 's1', 's2', 's3', 's4'); void box.offsetWidth;
        if (reduce) { box.classList.add('s1', 's2', 's3', 's4'); return; }
        box.classList.add('go');
        [['s1', 650], ['s2', 1250], ['s3', 1850], ['s4', 2700]].forEach(function (x) { timers.push(setTimeout(function () { box.classList.add(x[0]); }, x[1])); });
      }
      $$('.cov-sz button', el).forEach(function (b) { b.addEventListener('click', function () { $$('.cov-sz button', el).forEach(function (o) { o.classList.toggle('on', o === b); }); card.setAttribute('data-r', b.getAttribute('data-r')); run(); }); });
      card.addEventListener('click', run);
      run();
      return run;
    },
    mt: function (el) {
      var box = $('.mt', el), A = $$('.mt-a .mt-r', el), B = $$('.mt-b .mt-r', el), svg = $('.mt-svg', el), st = $('.mt-st b', el), btn = $('.mt-b button', el), timers = [], done = 0, paths = [];
      function draw() {
        var r = svg.getBoundingClientRect(), h = '';
        A.forEach(function (a, i) { var y1 = a.getBoundingClientRect().top + 20 - r.top, y2 = B[i].getBoundingClientRect().top + 20 - r.top, w = r.width; h += '<path pathLength="1" class="' + (a.classList.contains('q') ? 'q' : '') + '" d="M2 ' + y1 + ' C' + w / 2 + ' ' + y1 + ',' + w / 2 + ' ' + y2 + ',' + (w - 2) + ' ' + y2 + '"/>'; });
        svg.innerHTML = h; paths = $$('path', svg);
      }
      function ok(i) { A[i].classList.remove('wait'); B[i].classList.remove('wait'); A[i].classList.add('ok'); B[i].classList.add('ok'); paths[i].classList.remove('q'); paths[i].classList.add('in'); done++; st.textContent = done; }
      function run() {
        timers.forEach(clearTimeout); timers = []; done = 0; st.textContent = 0; draw();
        A.concat(B).forEach(function (x) { x.classList.remove('ok', 'wait'); });
        var t = 500;
        A.forEach(function (a, i) {
          if (a.classList.contains('q')) { timers.push(setTimeout(function () { A[i].classList.add('wait'); B[i].classList.add('wait'); paths[i].classList.add('in'); }, reduce ? 0 : t)); }
          else timers.push(setTimeout(function () { ok(i); }, reduce ? 0 : t));
          t += 620;
        });
        if (!reduce) timers.push(setTimeout(function () { if (B[3].classList.contains('wait')) ok(3); }, t + 4200));
      }
      btn.addEventListener('click', function (e) { e.stopPropagation(); if (B[3].classList.contains('wait')) ok(3); });
      window.addEventListener('resize', draw);
      run();
      return run;
    }
  };
  /* живая переписка: реплики печатаются по одной, в конце собирается заявка менеджеру */
  function dlgInit(p, zone) {
    var box = $('.czd', p), mgr = $('.czd-mgr', p);
    if (!box || !mgr || reduce) return null;
    var ms = $$('.czd-m', box), run = 0;
    var rail = document.createElement('div'); rail.className = 'czd-rail'; rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<span class="czd-n"><i class="fa-solid fa-user"></i>Клиент</span><u class="czd-l"></u><span class="czd-n"><i class="fa-solid fa-robot"></i>Агент</span><u class="czd-l"></u><span class="czd-n"><i class="fa-solid fa-user-check"></i>Менеджер</span>';
    box.parentNode.insertBefore(rail, box);
    var ns = $$('.czd-n', rail), ls = $$('.czd-l', rail);
    ms.forEach(function (m) {
      var v = $('.czd-v', m);
      if (v) { v.insertAdjacentHTML('beforeend', '<em class="czd-bars"><s></s><s></s><s></s><s></s><s></s><s></s><s></s></em>'); return; }
      var b = $('b', m), txt = m.textContent.slice(b.textContent.length).trim(), sp = document.createElement('span');
      m.setAttribute('aria-label', m.textContent); m.innerHTML = ''; m.appendChild(b); m.appendChild(document.createTextNode(' ')); sp.className = 'czd-tx'; m.appendChild(sp); m.__t = txt; m.__s = sp;
    });
    var lab = $('b', mgr), parts = mgr.textContent.slice(lab.textContent.length).split('·');
    mgr.innerHTML = '<b><i class="fa-solid fa-bolt"></i> Менеджер получил</b><span class="czd-chips">' + parts.map(function (x, i) { return '<i style="--i:' + i + '">' + x.trim() + '</i>'; }).join('') + '</span>';
    var typ = document.createElement('p'); typ.className = 'czd-typ'; typ.innerHTML = '<s></s><s></s><s></s>'; box.appendChild(typ);
    box.classList.add('live'); mgr.classList.add('live');
    if (!zone.__io) { zone.__vis = true; zone.__io = new IntersectionObserver(function (es) { zone.__vis = es[0].isIntersecting; }); zone.__io.observe(zone); }
    function who(k) { ns.forEach(function (n, i) { n.classList.toggle('on', i === k); n.classList.toggle('was', i < k); }); }
    function flow(l) { l.classList.remove('run'); void l.offsetWidth; l.classList.add('run'); }
    function play() {
      var id = ++run, t = 350;
      function at(d, fn) { setTimeout(function () { if (id === run && p.classList.contains('on')) fn(); }, d); }
      ms.forEach(function (m) { m.classList.remove('in', 'old'); if (m.__s) m.__s.textContent = ''; });
      mgr.classList.remove('in'); typ.classList.remove('in'); ls.forEach(function (l) { l.classList.remove('run'); }); who(-1);
      ms.forEach(function (m, k) {
        var agent = m.classList.contains('a');
        if (agent) { at(t, function () { flow(ls[0]); who(1); typ.classList.add('in'); }); t += 800; }
        at(t, function () {
          typ.classList.remove('in'); who(agent ? 1 : 0); if (k > 1) ms[k - 2].classList.add('old'); m.classList.add('in');
          if (!m.__s) return;
          var n = 0, txt = m.__t, iv = setInterval(function () {
            if (id !== run) { clearInterval(iv); return; }
            n += 2; m.__s.textContent = txt.slice(0, n); if (n >= txt.length) clearInterval(iv);
          }, agent ? 26 : 38);
        });
        t += (m.__s ? m.__t.length / 2 * (agent ? 26 : 38) : 1500) + 650;
      });
      at(t, function () { flow(ls[1]); who(2); mgr.classList.add('in'); });
      at(t + 9000, function loop() { if (zone.__vis) play(); else at(2000, loop); });
    }
    return play;
  }

  INIT.cz = function (box) {
    var tabs = $$('.cz-t', box), panes = $$('.cz-pane', box), runs = [];
    function show(i) {
      tabs.forEach(function (t, k) { t.classList.toggle('on', k === i); });
      panes.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      var p = panes[i];
      if (!p.__v) { p.__v = true; runs[i] = VIS[p.getAttribute('data-v')]($('.cz-vis', p)); }
      else if (runs[i]) runs[i]();
      if (!p.__d) p.__d = dlgInit(p, box) || function () {};
      p.__d();
      $$('[data-count]', p).forEach(function (el) { count(el, +el.getAttribute('data-count'), 1600); });
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    show(0);
  };

  /* запуск по мере прокрутки */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var k = e.target.getAttribute('data-bk');
      try { if (INIT[k]) INIT[k](e.target); } catch (err) { if (window.console) console.error(err); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  $$('[data-bk]').forEach(function (el) { io.observe(el); });

  var st = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { st.unobserve(e.target); e.target.classList.add('in'); } });
  }, { threshold: 0.12 });
  $$('.bk-st').forEach(function (el) { $$(':scope > *', el).forEach(function (c, i) { c.style.setProperty('--i', i); }); st.observe(el); });
})();
