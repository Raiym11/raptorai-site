/* RaptorAI: живые блоки страниц услуг (появление, наклон карточек, счётчик цен, интерактивы).
   Без зависимостей. Интерактив запускается, когда блок подходит к экрану. */
(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.add('bxjs');
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, RM ? 0 : ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function json(el, k) { try { return JSON.parse(el.getAttribute(k) || 'null'); } catch (e) { return null; } }
  function onView(el, fn, th) {
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } });
    }, { threshold: th == null ? 0.25 : th, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
  }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* ---------- появление ---------- */
  $$('.bx-stg').forEach(function (g) {
    [].forEach.call(g.children, function (c, i) { c.classList.add('bx-rv'); c.style.setProperty('--dl', i * 80 + 'ms'); });
  });
  $$('.bx-rv').forEach(function (el) { onView(el, function (e) { e.classList.add('in'); }, 0.12); });
  $$('[data-io]').forEach(function (el) { onView(el, function (e) { e.classList.add('in'); }, parseFloat(el.getAttribute('data-io')) || 0.3); });

  /* ---------- наклон карточек за курсором ---------- */
  if (FINE && !RM) $$('.bx-tilt').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      el.classList.add('hov');
    });
    el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('hov'); });
  });
  else $$('.bx-tilt').forEach(function (el) {
    el.addEventListener('touchstart', function () { el.classList.add('hov'); setTimeout(function () { el.classList.remove('hov'); }, 900); }, { passive: true });
  });

  /* ---------- цифры считаются при появлении ---------- */
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count')), from = parseFloat(el.getAttribute('data-from') || '0');
    var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    if (RM) { el.textContent = pre + fmt(to) + suf; return; }
    var t0 = performance.now(), dur = 1500;
    (function f(now) {
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + fmt(from + (to - from) * e) + suf;
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  $$('[data-count]').forEach(function (el) { onView(el, count, 0.6); });

  /* ---------- переписка по сценарию ---------- */
  function Chat(box) { this.box = box; this.run = 0; }
  Chat.prototype.add = function (cls, html) {
    var m = d.createElement('div'); m.className = cls; m.innerHTML = html; this.box.appendChild(m);
    this.box.scrollTop = this.box.scrollHeight; return m;
  };
  Chat.prototype.type = async function (m, text, id) {
    if (RM) { m.textContent = text; return; }
    m.textContent = '';
    for (var i = 1; i <= text.length; i++) {
      if (id !== this.run) return;
      m.textContent = text.slice(0, i); this.box.scrollTop = this.box.scrollHeight;
      await wait(13);
    }
  };
  Chat.prototype.play = async function (script, opt) {
    opt = opt || {};
    var id = ++this.run, me = this, pick = '';
    this.box.innerHTML = '';
    var DOTS = '<span class="bx-dots"><i></i><i></i><i></i></span>';
    for (var k = 0; k < script.length; k++) {
      var s = script[k];
      if (id !== me.run) return;
      if (s.w) await wait(s.w);
      if (id !== me.run) return;
      var tx = function (t) { return String(t).replace('{x}', pick); };
      if (s.u != null) {
        if (s.voice) {
          var v = me.add('bx-m u', '<i class="fa-solid fa-microphone"></i> <span class="bx-wave">' + new Array(15).join('<i></i>') + '</span> 0:07');
          await wait(1500); if (id !== me.run) return;
          v.innerHTML = '<i class="fa-solid fa-microphone"></i> ' + tx(s.u);
        } else me.add('bx-m u', tx(s.u));
        await wait(450);
      } else if (s.b != null) {
        var m = me.add('bx-m b', DOTS);
        await wait(s.d || 850); if (id !== me.run) return;
        if (s.html) m.innerHTML = tx(s.b); else if (opt.type) await me.type(m, tx(s.b), id); else m.textContent = tx(s.b);
        me.box.scrollTop = me.box.scrollHeight;
        await wait(350);
      } else if (s.sys != null) {
        me.add('bx-m sys', '<i class="fa-solid fa-circle-check"></i>' + tx(s.sys)); await wait(350);
      } else if (s.opts) {
        var o = me.add('bx-opts', s.opts.map(function (t) { return '<button type="button">' + t + '</button>'; }).join(''));
        pick = await new Promise(function (res) {
          var done = false, fin = function (t) { if (!done) { done = true; res(t); } };
          $$('button', o).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); fin(b.textContent); }); });
          setTimeout(function () { fin(s.opts[s.auto || 0]); }, RM ? 0 : (s.t || 2600));
        });
        if (id !== me.run) return;
        $$('button', o).forEach(function (b) { b.disabled = true; if (b.textContent === pick) b.classList.add('sel'); });
        await wait(300);
        me.add('bx-m u', pick); await wait(400);
      }
    }
  };

  /* ---------- последовательности ---------- */
  $$('[data-bx="seq"]').forEach(function (box) {
    var gap = parseInt(box.getAttribute('data-gap') || '480', 10), typing = box.hasAttribute('data-typing');
    var fol = box.getAttribute('data-follow') ? $(box.getAttribute('data-follow'), box.parentNode) : null;
    onView(box, async function () {
      var kids = [].slice.call(box.children).filter(function (c) { return !c.hasAttribute('data-skip'); });
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i];
        if (fol) {
          var r = c.getBoundingClientRect(), pr = box.getBoundingClientRect();
          fol.style.setProperty('--fx', (r.left - pr.left + r.width / 2 - 18) + 'px');
          fol.style.setProperty('--fy', (i % 2 ? -6 : 4) + 'px');
          await wait(650);
        }
        if (typing && !RM) {
          var t = d.createElement('div'); t.className = 'bx-m b on'; t.innerHTML = '<span class="bx-dots"><i></i><i></i><i></i></span>';
          box.insertBefore(t, c); await wait(620); box.removeChild(t);
        }
        c.classList.add('on');
        var ic = c.getAttribute('data-icon'); if (ic) { var e = $('.bx-ic i', c); if (e) e.className = ic; }
        await wait(gap);
      }
    }, 0.3);
  });

  /* ---------- цены: счётчик «Какой пакет мой?» ---------- */
  function plural(n) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'подключение' : (a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'подключения' : 'подключений'); }
  function pack(mode, n, cx, start) {
    var k = cx ? 2 : (mode === 'n8n' ? (n <= 3 ? 0 : n <= 6 ? 1 : 2) : (n <= 1 ? 0 : n <= 4 ? 1 : 2));
    return { k: k, name: ['Старт', 'Бизнес', 'Под ключ'][k], price: [start || '4 990', '25 000', '50 000'][k] };
  }
  function resHtml(mode, n, cx, start) {
    var p = pack(mode, n, cx, start);
    return { p: p, html: cx ? 'Есть сложное подключение → пакет <b>«Под ключ»</b>, от <b>50 000 ₽</b>. Точную цену называем в смете до старта.'
      : '<b class="bx-flip bx-num">' + n + '</b> ' + plural(n) + ' → пакет <b>«' + p.name + '»</b>, от <b>' + p.price + ' ₽</b>' };
  }
  $$('[data-bx="calc"]').forEach(function (box) {
    var mode = box.getAttribute('data-mode') || 'std', start = box.getAttribute('data-start');
    var sec = box.closest('section'), res = $('.bx-res', sec), grid = $('.pk-grid', sec), cards = $$('.pk-card', sec);
    var val = {}, sw = $('input[type=checkbox]', box);
    $$('.bx-step', box).forEach(function (st) {
      var key = st.getAttribute('data-k'), min = +st.getAttribute('data-min'), max = +st.getAttribute('data-max') || 9, out = $('b', st);
      val[key] = +out.textContent;
      $$('button', st).forEach(function (b) {
        b.addEventListener('click', function () {
          val[key] = clamp(val[key] + (+b.getAttribute('data-d')), min, max);
          out.textContent = val[key]; out.classList.remove('bx-flip'); void out.offsetWidth; out.classList.add('bx-flip');
          upd();
        });
      });
    });
    function upd() {
      var n = 0; for (var k in val) n += val[k];
      var r = resHtml(mode, Math.max(1, n), sw && sw.checked, start);
      res.innerHTML = r.html;
      grid.classList.add('has-pick');
      cards.forEach(function (c, i) { c.classList.toggle('pick', i === r.p.k); });
    }
    if (sw) sw.addEventListener('change', upd);
    upd();
  });

  /* ---------- вопросы: плавное раскрытие ---------- */
  $$('.bx-faq details').forEach(function (dt) {
    var sum = $('summary', dt), busy = false;
    sum.addEventListener('click', function (e) {
      if (RM || !dt.animate) return;
      e.preventDefault(); if (busy) return; busy = true;
      var h0 = dt.offsetHeight, open = !dt.open;
      if (open) dt.open = true;
      var h1 = open ? dt.offsetHeight : sum.offsetHeight;
      var a = dt.animate({ height: [h0 + 'px', h1 + 'px'] }, { duration: 320, easing: 'cubic-bezier(.3,.7,.2,1)' });
      a.onfinish = a.oncancel = function () { if (!open) dt.open = false; busy = false; };
    });
  });

  /* ---------- спутник страницы: параллакс ---------- */
  var pals = $$('.bx-pal');
  if (pals.length && !RM) {
    var tick = false, upd = function () {
      tick = false; var vh = window.innerHeight;
      pals.forEach(function (p) {
        var r = p.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var k = clamp((vh - r.top) / (vh + r.height), 0, 1);
        p.style.setProperty('--py', ((0.5 - k) * 170).toFixed(1) + 'px');
        p.style.setProperty('--pr', ((k - 0.5) * 16).toFixed(1) + 'deg');
      });
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
  /* снимок робота из первого экрана (страница ИИ-агента) */
  var shots = $$('[data-shot]');
  if (shots.length) {
    var tries = 0;
    (function t() {
      var h = $('.h3d');
      if (h && h.__shot && h.classList.contains('ready')) {
        setTimeout(function () {
          try { var u = h.__shot(); if (u && u.length > 2000) shots.forEach(function (s) { s.innerHTML = '<img alt="" src="' + u + '">'; s.classList.remove('ico'); }); } catch (e) {}
        }, 900);
      } else if (tries++ < 60) setTimeout(t, 500);
    })();
  }

  /* =================== ИИ-агент =================== */
  $$('[data-bx="timeline"]').forEach(function (tl) {
    var track = $('.bx-tl-track', tl), pts = $$('.bx-tl-pt', tl), bot = $('.bx-tl-bot', tl), cur = -1;
    var chats = pts.map(function (p) { return new Chat($('.bx-chat', p)); });
    function act(i, scroll) {
      if (i === cur) return; cur = i;
      pts.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      var p = pts[i];
      tl.style.setProperty('--day', p.getAttribute('data-day')); tl.style.setProperty('--prog', (i / (pts.length - 1)).toFixed(3));
      if (scroll) track.scrollTo({ left: p.offsetLeft - (track.clientWidth - p.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
      place(); chats[i].play(json(p, 'data-script') || []);
    }
    function place() {
      if (cur < 0) return; var p = pts[cur];
      bot.style.setProperty('--bx', clamp(p.offsetLeft - track.scrollLeft + p.offsetWidth / 2 - 52, 8, tl.clientWidth - 112) + 'px');
    }
    var raf = 0;
    track.addEventListener('scroll', function () {
      if (raf) return; raf = requestAnimationFrame(function () {
        raf = 0; var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
        pts.forEach(function (p, k) { var dd = Math.abs(p.offsetLeft + p.offsetWidth / 2 - c); if (dd < bd) { bd = dd; best = k; } });
        if (track.scrollLeft < 8) best = 0; else if (track.scrollLeft > track.scrollWidth - track.clientWidth - 8) best = pts.length - 1;
        act(best, false); place();
      });
    }, { passive: true });
    var down = null, moved = 0;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { down = { x: e.clientX, s: track.scrollLeft }; moved = 0; track.classList.add('drag'); } });
    window.addEventListener('pointermove', function (e) { if (down) { moved = Math.abs(e.clientX - down.x); track.scrollLeft = down.s - (e.clientX - down.x); } });
    window.addEventListener('pointerup', function () { if (down) { down = null; track.classList.remove('drag'); } });
    pts.forEach(function (p, k) { p.addEventListener('click', function () { if (moved < 6) act(k, true); }); });
    window.addEventListener('resize', place);
    onView(tl, function () { act(0, false); }, 0.3);
  });

  $$('[data-bx="tabs"]').forEach(function (box) {
    var bar = $('.bx-tabs', box), btns = $$('button', bar), ind = $('i', bar), chat = new Chat($('.bx-chat', box)), list = $('.bx-do', box), seen = false;
    function go(i, play) {
      btns.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      var b = btns[i]; ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
      list.innerHTML = (json(b, 'data-list') || []).map(function (t) { return '<li><i class="fa-solid fa-check"></i><span>' + t + '</span></li>'; }).join('');
      if (play) chat.play(json(b, 'data-script') || [], { type: true });
    }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { go(k, seen); }); });
    go(0, false);
    window.addEventListener('resize', function () { var k = btns.findIndex(function (b) { return b.classList.contains('on'); }); go(k < 0 ? 0 : k, false); });
    onView(box, function () { seen = true; go(0, true); }, 0.35);
  });

  $$('.bx-chart-wrap').forEach(function (w) {
    var tt = $('.bx-tt', w);
    $$('.pt', w).forEach(function (p) {
      function show() {
        var r = p.getBoundingClientRect(), wr = w.getBoundingClientRect();
        tt.textContent = p.getAttribute('data-t'); tt.style.left = (r.left - wr.left + r.width / 2) + 'px'; tt.style.top = (r.top - wr.top) + 'px'; tt.classList.add('on');
      }
      p.addEventListener('pointerenter', show); p.addEventListener('click', show);
      p.addEventListener('pointerleave', function () { tt.classList.remove('on'); });
    });
  });

  /* =================== ChatGPT =================== */
  $$('[data-bx="demo"]').forEach(function (box) {
    var chat = new Chat($('.bx-chat', box)), hello = json(box, 'data-hello') || [];
    $$('.bx-qs button', box).forEach(function (b) {
      b.addEventListener('click', function () { chat.play(json(b, 'data-script') || [], { type: true }); });
    });
    onView(box, function () { chat.play(hello, { type: true }); }, 0.4);
  });
  $$('[data-bx="fly"]').forEach(function (box) {
    var head = $('.bx-head', box), files = $$('s', head), cards = $$('.bx-know-list .bx-card', box);
    onView(box, async function () {
      for (var i = 0; i < files.length; i++) {
        files[i].classList.add('go'); await wait(820);
        head.classList.add('flash'); if (cards[i]) cards[i].classList.add('on');
        await wait(260); head.classList.remove('flash'); await wait(200);
      }
    }, 0.4);
  });

  /* =================== Gemini =================== */
  $$('[data-bx="feed"]').forEach(function (box) {
    var star = $('.bx-star', box), sm = $('.bx-ans small', box), out = $('.bx-ans b', box), run = 0;
    async function fire(ic) {
      var id = ++run, text = ic.getAttribute('data-a');
      $$('.bx-fi', box).forEach(function (x) { x.classList.toggle('sel', x === ic); });
      star.classList.remove('flash'); void star.offsetWidth; star.classList.add('flash');
      sm.textContent = 'Агент получил: ' + ic.getAttribute('data-t');
      if (RM) { out.textContent = text; return; }
      out.textContent = ''; await wait(350);
      for (var i = 1; i <= text.length; i++) { if (id !== run) return; out.textContent = text.slice(0, i); await wait(16); }
    }
    $$('.bx-fi', box).forEach(function (ic) {
      var st = null;
      ic.addEventListener('pointerdown', function (e) { st = { x: e.clientX, y: e.clientY, m: 0 }; try { ic.setPointerCapture(e.pointerId); } catch (x) {} });
      ic.addEventListener('pointermove', function (e) {
        if (!st) return; var dx = e.clientX - st.x, dy = e.clientY - st.y; st.m = Math.max(st.m, Math.hypot(dx, dy));
        if (st.m > 8) {
          ic.classList.add('drag'); ic.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.06)';
          var r = star.getBoundingClientRect(); star.classList.toggle('over', e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 20 && e.clientY < r.bottom + 20);
        }
      });
      function end(e) {
        if (!st) return; var hit = st.m <= 8 || star.classList.contains('over');
        st = null; ic.classList.remove('drag'); ic.style.transform = ''; star.classList.remove('over');
        if (hit && e.type !== 'pointercancel') fire(ic);
      }
      ic.addEventListener('pointerup', end); ic.addEventListener('pointercancel', end);
    });
    onView(box, function () { var f = $('.bx-fi[data-first]', box); if (f) fire(f); }, 0.45);
  });

  /* =================== Claude =================== */
  $$('.bx-ba').forEach(function (ba) {
    var touched = false;
    function set(p) { ba.style.setProperty('--p', clamp(p, 4, 96).toFixed(1) + '%'); }
    function at(e) { var r = ba.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    var down = false;
    ba.addEventListener('pointerdown', function (e) { down = true; touched = true; at(e); try { ba.setPointerCapture(e.pointerId); } catch (x) {} });
    ba.addEventListener('pointermove', function (e) { if (down) at(e); });
    ba.addEventListener('pointerup', function () { down = false; }); ba.addEventListener('pointercancel', function () { down = false; });
    onView(ba, function () {
      if (RM) return; var t0 = performance.now();
      (function f(now) {
        if (touched) return; var k = (now - t0) / 2400;
        if (k >= 1) { set(50); return; }
        set(50 - Math.sin(k * Math.PI * 2) * 32); requestAnimationFrame(f);
      })(t0);
    }, 0.5);
  });
  $$('.bx-fan').forEach(function (fan) {
    var cards = $$('.bx-card', fan);
    cards.forEach(function (c) { c.addEventListener('click', function () { var on = c.classList.contains('open'); cards.forEach(function (x) { x.classList.remove('open'); }); if (!on) c.classList.add('open'); }); });
  });
  $$('[data-bx="doc"]').forEach(function (box) {
    var sheet = $('.bx-sheet', box), ps = $$('p[data-c]', sheet), cm = $$('.bx-cmt .bx-card', box), lens = $('.bx-lens', sheet);
    function mark(i) { ps.forEach(function (p, k) { p.classList.toggle('on', k === i); }); cm.forEach(function (c, k) { c.classList.toggle('on', k === i); }); }
    ps.forEach(function (p, i) { p.addEventListener('pointerenter', function () { mark(i); }); p.addEventListener('click', function () { mark(i); }); });
    cm.forEach(function (c, i) { c.addEventListener('pointerenter', function () { mark(i); }); });
    sheet.addEventListener('pointermove', function (e) { var r = sheet.getBoundingClientRect(); lens.style.setProperty('--lx', (e.clientX - r.left) + 'px'); lens.style.setProperty('--ly', (e.clientY - r.top) + 'px'); });
    mark(1);
  });

  /* =================== Telegram =================== */
  $$('[data-bx="car"]').forEach(function (car) {
    var phs = $$('.bx-ph', car), nav = car.parentNode.querySelector('.bx-car-nav'), lab = $('span', nav), cur = 0, seen = false;
    var chats = phs.map(function (p) { return new Chat($('.bx-chat', p)); });
    function go(i) {
      cur = (i + phs.length) % phs.length;
      phs.forEach(function (p, k) {
        var o = k - cur; if (o > phs.length / 2) o -= phs.length; if (o < -phs.length / 2) o += phs.length;
        p.style.setProperty('--o', o); p.style.setProperty('--a', Math.min(2.4, Math.abs(o))); p.classList.toggle('cur', o === 0);
        if (o !== 0) chats[k].run++;
      });
      lab.textContent = phs[cur].getAttribute('data-t');
      if (seen) chats[cur].play(json(phs[cur], 'data-script') || []);
    }
    phs.forEach(function (p, k) { p.addEventListener('click', function () { if (k !== cur) go(k); }); });
    $$('button', nav).forEach(function (b) { b.addEventListener('click', function () { go(cur + (+b.getAttribute('data-d'))); }); });
    var sx = null;
    car.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    car.addEventListener('pointerup', function (e) { if (sx != null && Math.abs(e.clientX - sx) > 46) go(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
    go(0);
    onView(car, function () { seen = true; go(cur); }, 0.35);
  });

  /* =================== n8n =================== */
  $$('[data-bx="build"]').forEach(function (box) {
    var cv = $('.bx-canvas', box), svg = $('svg', cv), res = $('.bx-res', box), start = box.getAttribute('data-start');
    var pos = {}, els = {}, sel = { from: [], to: [], note: [] };
    $$('.bx-pick [data-g]', box).forEach(function (g) {
      var key = g.getAttribute('data-g'), single = key === 'note';
      $$('button', g).forEach(function (b) {
        if (b.classList.contains('on')) sel[key].push(b);
        b.addEventListener('click', function () {
          var on = b.classList.contains('on');
          if (single) { sel[key].forEach(function (x) { x.classList.remove('on'); }); sel[key] = [b]; b.classList.add('on'); }
          else if (on) { if (sel[key].length > 1) { b.classList.remove('on'); sel[key] = sel[key].filter(function (x) { return x !== b; }); } }
          else { b.classList.add('on'); sel[key].push(b); }
          render();
        });
      });
    });
    function node(id, html, cls, x, y) {
      if (!pos[id] || !pos[id].u) pos[id] = { x: x, y: y };
      var e = els[id];
      if (!e) {
        e = els[id] = d.createElement('div'); e.className = 'bx-nd ' + (cls || ''); e.innerHTML = html; cv.appendChild(e);
        var st = null;
        e.addEventListener('pointerdown', function (ev) { st = { x: ev.clientX, y: ev.clientY, px: pos[id].x, py: pos[id].y }; e.classList.add('drag'); try { e.setPointerCapture(ev.pointerId); } catch (x) {} });
        e.addEventListener('pointermove', function (ev) {
          if (!st) return; var r = cv.getBoundingClientRect();
          pos[id].u = 1; pos[id].x = clamp(st.px + (ev.clientX - st.x) / r.width * 100, 8, 92); pos[id].y = clamp(st.py + (ev.clientY - st.y) / r.height * 100, 8, 92); draw();
        });
        var up = function () { st = null; e.classList.remove('drag'); };
        e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
      }
      return e;
    }
    var live = [];
    function render() {
      var keep = { hub: 1 }; live = [];
      node('hub', '', 'hub', 50, 48).style.backgroundImage = 'url(/hero3d/logo-n8n.webp?v=3)';
      ['from', 'to', 'note'].forEach(function (key) {
        sel[key].forEach(function (b, i) {
          var id = key + ':' + b.textContent, n = sel[key].length;
          var x = key === 'from' ? 15 : key === 'to' ? 85 : 50, y = key === 'note' ? 88 : 48 + (i - (n - 1) / 2) * (n > 3 ? 21 : 26);
          node(id, (b.getAttribute('data-i') || '') + b.textContent, b.hasAttribute('data-cx') ? 'cx' : '', x, y);
          keep[id] = 1; live.push([key, id]);
        });
      });
      Object.keys(els).forEach(function (id) { if (!keep[id]) { cv.removeChild(els[id]); delete els[id]; delete pos[id]; } });
      draw();
      var n = sel.from.length + sel.to.length, cx = sel.from.concat(sel.to).some(function (b) { return b.hasAttribute('data-cx'); });
      res.innerHTML = resHtml('n8n', n, cx, start).html;
    }
    function draw() {
      var w = cv.clientWidth, h = cv.clientHeight, s = '';
      Object.keys(els).forEach(function (id) { els[id].style.left = pos[id].x + '%'; els[id].style.top = pos[id].y + '%'; });
      var hx = pos.hub.x / 100 * w, hy = pos.hub.y / 100 * h;
      live.forEach(function (l) {
        var p = pos[l[1]], x = p.x / 100 * w, y = p.y / 100 * h, a, b;
        if (l[0] === 'from') { a = [x, y]; b = [hx, hy]; } else { a = [hx, hy]; b = [x, y]; }
        var mx = (a[0] + b[0]) / 2, dd = l[0] === 'note' ? 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1] : 'M' + a[0] + ' ' + a[1] + ' C' + mx + ' ' + a[1] + ',' + mx + ' ' + b[1] + ',' + b[0] + ' ' + b[1];
        s += '<path class="o" d="' + dd + '"/><path d="' + dd + '"/><path class="fl" d="' + dd + '"/>';
      });
      svg.innerHTML = s;
    }
    window.addEventListener('resize', draw);
    onView(box, render, 0.2);
  });

  $$('[data-bx="wall"]').forEach(function (wall) {
    var its = $$('.bx-wi', wall), svg = $('svg', wall);
    var lines = its.map(function (it) {
      var l = d.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', '50%'); l.setAttribute('y1', '50%'); l.setAttribute('x2', it.style.getPropertyValue('--x')); l.setAttribute('y2', it.style.getPropertyValue('--y'));
      svg.appendChild(l);
      it.addEventListener('pointerenter', function () { l.classList.add('on'); });
      it.addEventListener('pointerleave', function () { l.classList.remove('on'); });
      it.addEventListener('click', function () { l.classList.toggle('on'); });
      return l;
    });
    if (!FINE || RM) return;
    wall.addEventListener('pointermove', function (e) {
      var r = wall.getBoundingClientRect();
      its.forEach(function (it) {
        var x = parseFloat(it.style.getPropertyValue('--x')) / 100 * r.width + r.left, y = parseFloat(it.style.getPropertyValue('--y')) / 100 * r.height + r.top;
        var dx = x - e.clientX, dy = y - e.clientY, dist = Math.hypot(dx, dy);
        if (dist < 150 && dist > 44) { var k = (150 - dist) / 150 * 34 / dist; it.style.setProperty('--dx', (dx * k).toFixed(1) + 'px'); it.style.setProperty('--dy', (dy * k).toFixed(1) + 'px'); }
        else { it.style.setProperty('--dx', '0px'); it.style.setProperty('--dy', '0px'); }
      });
    });
    wall.addEventListener('pointerleave', function () { its.forEach(function (it) { it.style.setProperty('--dx', '0px'); it.style.setProperty('--dy', '0px'); }); });
  });

  $$('[data-bx="inv"]').forEach(function (box) {
    var inv = $('.bx-invoice', box), rows = $$('.r', inv), steps = $$('.bx-steps4 .bx-card', box), ask = $('.r[data-ask]', inv);
    onView(box, async function () {
      steps[0].classList.add('on'); await wait(900);
      steps[1].classList.add('on'); inv.classList.add('s2'); await wait(1500);
      steps[2].classList.add('on');
      for (var i = 0; i < rows.length; i++) { if (rows[i] === ask) { ask.classList.add('ask'); $('u', ask).textContent = 'Подтвердить?'; } else rows[i].classList.add('ok'); await wait(380); }
      await new Promise(function (res) { var dn = false, f = function () { if (!dn) { dn = true; res(); } }; ask.addEventListener('click', f); setTimeout(f, RM ? 0 : 3200); });
      ask.classList.remove('ask'); $('u', ask).textContent = '✓'; ask.classList.add('ok');
      steps[3].classList.add('on'); inv.classList.add('s4');
    }, 0.35);
  });
})();
