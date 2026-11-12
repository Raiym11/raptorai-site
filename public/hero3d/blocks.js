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
  function paintBuddy(b) { if (snapUrl) { b.style.backgroundImage = 'url(' + snapUrl + ')'; b.classList.add('img'); } }
  document.addEventListener('h3d:snap', function (e) { snapUrl = e.detail.url; $$('.bk-buddy').forEach(paintBuddy); });

  /* счёт от нуля */
  function count(el, to, ms) {
    if (reduce) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / (ms || 1800)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
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
  INIT.chart = function (box) {
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
  };

  /* ---------- ИИ-агент: чек-лист ---------- */
  INIT.need = function (box) {
    $$('.need-i', box).forEach(function (el, i) { later(350 + i * 420, function () { el.classList.add('ok'); }); });
  };

  /* ---------- первый блок: возможности в деле ---------- */
  INIT.shw = function (box) {
    var items = $$('.shw-i', box), chat = $('.shw-chat', box), stage = $('.shw-stage', box), desc = $('.shw-desc', box), bud = $('.bk-buddy', box);
    var timers = [], cur = 0, seen = true;
    if (bud) paintBuddy(bud);
    function node(step) {
      var k = step.charAt(0), rest = step.slice(2), el = document.createElement('div'), p;
      if (k === 'u' || k === 'b') { el.className = 'mm ' + k; el.textContent = rest; }
      else if (k === 'v') { el.className = 'sv'; var bars = ''; for (var i = 0; i < 16; i++) bars += '<s style="--k:' + ((i * 7) % 11) + '"></s>'; el.innerHTML = '<i class="fa-solid fa-play"></i><span>' + bars + '</span>' + rest; }
      else { p = rest.indexOf(':'); el.className = k === 'c' ? 'sc' : k === 'f' ? 'sf' : 'sn'; var ic = document.createElement('i'); ic.className = rest.slice(0, p); el.appendChild(ic); el.appendChild(document.createTextNode(rest.slice(p + 1))); }
      return el;
    }
    function play(i) {
      timers.forEach(clearTimeout); timers = []; cur = i;
      items.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      if (desc) desc.textContent = $('span', items[i]).textContent;
      if (items[i].scrollIntoView && items[i].parentNode.scrollWidth > items[i].parentNode.clientWidth) items[i].parentNode.scrollTo({ left: items[i].offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
      chat.innerHTML = '';
      var steps = items[i].getAttribute('data-s').split('|'), t = 350;
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
