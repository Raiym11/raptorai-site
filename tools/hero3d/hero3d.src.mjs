/* RaptorAI: интерактивные 3D-сцены первого экрана страниц услуг.
   Исходник. Сборка в public/hero3d/hero3d.js: см. tools/hero3d/README.md
   Центральный объект рисует Three.js (WebGL), карточки и подписи - обычная вёрстка в 3D-пространстве CSS. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, ACESFilmicToneMapping,
  DirectionalLight, PointLight, AmbientLight, Group, Mesh, Sprite,
  MeshPhysicalMaterial, MeshBasicMaterial, SpriteMaterial,
  SphereGeometry, CylinderGeometry, TorusGeometry, BoxGeometry, CapsuleGeometry,
  BufferGeometry, BufferAttribute, CanvasTexture, Vector3, Shape, ShapeGeometry, ExtrudeGeometry,
  TextureLoader, SRGBColorSpace, AdditiveBlending, DoubleSide
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
const reduce = mq('(prefers-reduced-motion: reduce)');
const small = mq('(max-width: 760px)');
const weak = small && ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2));
const K = 23.33; // % ширины сцены на единицу мира при z = 0
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function it(cls, x, y, z, html) {
  return el('<div class="h3d-it ' + cls + '" style="--x:' + x + '%;--y:' + y + '%;--z:' + z + 'px">' + html + '</div>');
}
function restart(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

/* ---------- WebGL ---------- */
function makeGL(S, acc, acc2) {
  const canvas = document.createElement('canvas');
  canvas.className = 'h3d-gl';
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8);
  const pm = new PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  const key = new DirectionalLight(0xffffff, 1.7); key.position.set(3, 4, 5); scene.add(key);
  const rim = new PointLight(acc2, 40, 20); rim.position.set(-3.2, -1.2, 2.5); scene.add(rim);
  const fill = new PointLight(acc, 26, 20); fill.position.set(3, -2, 3); scene.add(fill);
  scene.add(new AmbientLight(0xffffff, 0.25));
  function size() { const w = S.host.clientWidth || 300; renderer.setSize(w, w, false); }
  size();
  S.stage.appendChild(canvas);
  return { canvas, renderer, scene, camera, size };
}
function glass(color, o) {
  o = o || {};
  return new MeshPhysicalMaterial({
    color, roughness: o.rough == null ? 0.14 : o.rough, metalness: o.metal || 0,
    clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: o.opacity == null ? 0.86 : o.opacity,
    emissive: o.emissive == null ? color : o.emissive, emissiveIntensity: o.glow == null ? 0.16 : o.glow,
    envMapIntensity: o.env == null ? 0.75 : o.env, flatShading: !!o.flat, side: o.side || 0, vertexColors: !!o.vc,
    iridescence: o.irid || 0, iridescenceIOR: 1.6
  });
}
let glowTex = null;
function glow(color, size, opacity) {
  if (!glowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    glowTex = new CanvasTexture(c);
  }
  const s = new Sprite(new SpriteMaterial({ map: glowTex, color, transparent: true, opacity: opacity == null ? 0.6 : opacity, blending: AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1);
  s.position.z = -0.9; s.renderOrder = -1;
  return s;
}
/* объёмная плашка-аватар: стеклянный корпус, на лицевой стороне картинка из /hero3d/logo-*.webp */
function rrect(w, r) {
  const h = w / 2, sh = new Shape();
  sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r);
  sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h); sh.lineTo(-h + r, h);
  sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h);
  return sh;
}
function medal(S, name, color, w, o) {
  o = o || {};
  const g = new Group(), d = w * 0.2, bev = w * 0.045, fc = o.face == null ? color : o.face;
  const body = new ExtrudeGeometry(rrect(w - bev * 2, w * 0.2), { depth: d, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 10 });
  body.translate(0, 0, -d / 2);
  g.add(new Mesh(body, glass(color, { rough: 0.22, opacity: 1, glow: o.glow == null ? 0.22 : o.glow, env: 0.7 })));
  const fw = w - bev * 2.2, geo = new ShapeGeometry(rrect(fw, w * 0.19), 10), pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / fw + 0.5, pos.getY(i) / fw + 0.5);
  const z0 = d / 2 + bev + 0.002;
  /* лицевая сторона: глянцевая подложка в цвете модели */
  const face = new Mesh(geo, new MeshBasicMaterial({ color: fc, toneMapped: false }));
  face.position.z = z0; g.add(face);
  /* знак парит над подложкой и отбрасывает тень: при наклоне видна глубина */
  const tex = new TextureLoader().load('/hero3d/logo-' + name + '.webp?v=3', () => { if (S.redraw) S.redraw(); });
  tex.colorSpace = SRGBColorSpace; tex.anisotropy = 8;
  const ls = o.ls || 1;
  const shadow = new Mesh(geo, new MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }));
  shadow.position.set(w * 0.02, -w * 0.03, z0 + 0.004); shadow.scale.setScalar(ls); shadow.renderOrder = 1; g.add(shadow);
  /* блик, который время от времени пробегает по плашке */
  const c = document.createElement('canvas'); c.width = 256; c.height = 4;
  const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 256, 0);
  gr.addColorStop(0.36, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(0.64, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 4);
  const st = new CanvasTexture(c); st.center.set(0.5, 0.5); st.rotation = 0.5;
  const sheen = new Mesh(geo, new MeshBasicMaterial({ map: st, transparent: true, opacity: o.sheen == null ? 0.42 : o.sheen, blending: AdditiveBlending, depthWrite: false }));
  sheen.position.z = z0 + 0.008; sheen.renderOrder = 2; g.add(sheen);
  const logo = new Mesh(geo, new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  logo.position.z = z0 + w * 0.075; logo.scale.setScalar(ls); logo.renderOrder = 3; g.add(logo);
  const ph = Math.random() * 3;
  S.ticks.push((t) => {
    const k = ((t + ph) % 4.6) / 1.15;
    st.offset.x = k < 1 ? lerp(0.75, -0.75, k) : 0.75;
    logo.position.z = z0 + w * (0.075 + Math.sin(t * 1.4 + ph) * 0.012);
  });
  return g;
}
function fallbackImg(S, x, y, name, k, bg) { S.stage.appendChild(it('h3d-fb', x, y, -20, '<div class="fb fbi h3d-fl" style="--k:' + (k || 1) + ';background-color:' + (bg || 'var(--acc)') + ';background-image:url(/hero3d/logo-' + name + '.webp?v=3)"></div>')); }
function fallback(S, x, y, icon, k) { S.stage.appendChild(it('h3d-fb', x, y, -20, '<div class="fb h3d-fl" style="--k:' + (k || 1) + '"><i class="' + icon + '"></i></div>')); }

/* ---------- 1. ИИ-агент: живой робот ---------- */
function agent(S) {
  const msg = it('it-msg lift', 20, 19, 90, '<div class="h3d-fl" style="--d:-1s"><div class="g bub"><small>02:14 · клиент</small><b>Сколько стоит доставка?</b></div></div>');
  const ans = it('it-ans lift', 77, 80, 130, '<div class="h3d-fl" style="--d:-3s"><div class="g bub"><small><i class="fa-solid fa-robot"></i> ИИ-агент · 10 сек</small><span class="txt">Доставка по городу 300 ₽, от 5 000 ₽ бесплатно. Оформить заказ?</span><span class="dots"><i></i><i></i><i></i></span></div></div>');
  const crm = it('it-crm lift', 19, 76, 60, '<div class="h3d-fl" style="--d:-4.5s"><div class="g chip"><i class="fa-solid fa-circle-check"></i><span>Заявка в CRM</span></div></div>');
  S.stage.append(msg, ans, crm);
  const bub = ans.querySelector('.bub'), crmTxt = crm.querySelector('span');
  let bot = null, head, eyes = [], mouth = [], tip, typing = false, nod = 0;
  if (S.gl) {
    bot = new Group();
    const shell = glass(0x6fd6ff, { rough: 0.34, opacity: 0.66, glow: 0.3, emissive: 0x0090c8, env: 0.9 });
    head = new Group();
    head.add(new Mesh(new RoundedBoxGeometry(1.62, 1.26, 1.12, 6, 0.34), shell));
    const visor = new Mesh(new RoundedBoxGeometry(1.22, 0.66, 0.14, 4, 0.07), new MeshPhysicalMaterial({ color: 0x041a26, roughness: 0.18, clearcoat: 1, envMapIntensity: 1.2 }));
    visor.position.set(0, 0.02, 0.53); head.add(visor);
    const eyeM = new MeshBasicMaterial({ color: 0x8cf0ff });
    [-0.3, 0.3].forEach((x) => { const e = new Mesh(new SphereGeometry(0.115, 20, 16), eyeM); e.position.set(x, 0.1, 0.61); head.add(e); eyes.push(e); });
    [-0.14, 0, 0.14].forEach((x) => { const d = new Mesh(new SphereGeometry(0.036, 12, 10), eyeM); d.position.set(x, -0.16, 0.62); d.visible = false; head.add(d); mouth.push(d); });
    [-0.87, 0.87].forEach((x) => { const ear = new Mesh(new CylinderGeometry(0.2, 0.2, 0.16, 24), shell); ear.rotation.z = Math.PI / 2; ear.position.set(x, 0, 0); head.add(ear); });
    const stem = new Mesh(new CylinderGeometry(0.035, 0.035, 0.36, 12), shell); stem.position.set(0, 0.8, 0); head.add(stem);
    tip = new Mesh(new SphereGeometry(0.1, 16, 12), new MeshBasicMaterial({ color: 0x8cf0ff })); tip.position.set(0, 1.02, 0); head.add(tip);
    const tg = glow(0x00D4FF, 0.9, 0.7); tg.position.copy(tip.position); head.add(tg);
    const core = glow(0x00D4FF, 2.0, 0.32); core.position.set(0, 0, 0); core.material.depthTest = false; head.add(core);
    head.position.y = 0.34;
    const body = new Mesh(new RoundedBoxGeometry(1.14, 0.56, 0.8, 5, 0.24), shell); body.position.y = -0.74;
    const neck = new Mesh(new CylinderGeometry(0.16, 0.2, 0.26, 16), shell); neck.position.y = -0.38;
    const badge = new Mesh(new SphereGeometry(0.075, 14, 10), eyeM); badge.position.set(0, -0.72, 0.42);
    bot.add(head, body, neck, badge);
    bot.scale.setScalar(0.92);
    S.gl.scene.add(bot);
  } else fallback(S, 50, 48, 'fa-solid fa-robot');

  return {
    update(dt, t) {
      if (!bot) return;
      head.rotation.y = lerp(head.rotation.y, S.px * 0.6, 0.1);
      head.rotation.x = lerp(head.rotation.x, S.py * 0.32 + nod, 0.12);
      bot.rotation.y = S.px * 0.16;
      bot.position.y = Math.sin(t * 1.3) * 0.06 + 0.02;
      const blink = (t % 4.2) > 4.05 ? 0.12 : 1;
      eyes.forEach((e) => { e.scale.y = lerp(e.scale.y, typing ? 0.55 : blink, 0.4); });
      mouth.forEach((d, i) => { d.visible = typing; d.position.y = -0.16 + Math.max(0, Math.sin(t * 9 - i * 0.9)) * 0.05; });
      tip.scale.setScalar(1 + Math.sin(t * (typing ? 12 : 3)) * 0.18);
      nod *= 0.92;
    },
    play(done) {
      ans.classList.add('hid'); crm.classList.add('hid'); crmTxt.textContent = 'Заявка в CRM';
      restart(msg.firstChild, 'fly');
      S.after(750, () => { ans.classList.remove('hid'); bub.classList.add('typing'); typing = true; });
      S.after(2100, () => { bub.classList.remove('typing'); typing = false; restart(ans.firstChild, 'pop'); });
      S.after(2900, () => { crm.classList.remove('hid'); crmTxt.textContent = 'Заявка передана'; restart(crm.firstChild, 'pop'); nod = 0.45; });
      S.after(4200, () => { ans.firstChild.classList.remove('pop'); crm.firstChild.classList.remove('pop'); msg.firstChild.classList.remove('fly'); done(); });
    }
  };
}

/* ---------- 2. ChatGPT: голос в ответ ---------- */
function chatgpt(S) {
  const Q = 'Есть ли у вас скидка для опта?';
  const voice = it('it-voice lift', 18, 17, 80, '<div class="h3d-fl" style="--d:-2s"><div class="g chip"><i class="fa-solid fa-microphone"></i><span>Голосовое · 0:07</span></div></div>');
  const cloud = it('it-cloud lift hid', 76, 20, 140, '<div class="g bub"><small><i class="fa-solid fa-comment-dots"></i> ИИ-агент</small>Да, для опта цены ниже. Посчитать под ваш объём?<div class="sug"><span>Рассчитать опт</span><span>Позвать менеджера</span></div></div>');
  const wave = it('it-wave', 50, 79, 60, '');
  const cap = it('it-cap', 50, 95, 90, '<div class="g"></div>');
  S.stage.append(voice, cloud, wave, cap);
  const capTxt = cap.firstChild;
  let over = false, typed = 0, typeT = 0, spin = 0, spinV = 0, boost = 0;
  wave.addEventListener('pointerenter', () => { over = true; });
  wave.addEventListener('pointerleave', () => { over = false; });
  let grp = null, ring, bars = [];
  const N = 19;
  if (S.gl) {
    grp = medal(S, 'chatgpt', 0x10A37F, 1.5, { face: 0x10A37F });
    ring = new Mesh(new TorusGeometry(1.42, 0.022, 10, 90), new MeshBasicMaterial({ color: 0x5CFFC8, transparent: true, opacity: 0.75 }));
    ring.rotation.x = 1.2;
    const holder = new Group(); holder.add(grp, ring, glow(0x10A37F, 4.2, 0.35));
    holder.position.set(0, 0.42, 0);
    S.gl.scene.add(holder);
    const bm = new MeshBasicMaterial({ color: 0x35e0aa, transparent: true, opacity: 0.95 });
    const geo = new BoxGeometry(0.075, 1, 0.075);
    for (let i = 0; i < N; i++) {
      const b = new Mesh(geo, bm);
      const u = i / (N - 1) - 0.5;
      b.position.set(u * 2.9, -1.26, 0.5 - Math.abs(u) * 0.9);
      S.gl.scene.add(b); bars.push(b);
    }
  } else fallbackImg(S, 50, 40, 'chatgpt', 0.9);

  function setCap(n) { if (n !== typed) { typed = n; capTxt.textContent = Q.slice(0, n); cap.classList.toggle('hid', !n); } }
  cap.classList.add('hid');
  return {
    update(dt, t) {
      const playing = over || boost > 0;
      if (playing) { typeT += dt; setCap(Math.min(Q.length, Math.floor(typeT * 22))); }
      else if (typed) { typeT = 0; setCap(0); }
      boost = Math.max(0, boost - dt);
      if (!grp) return;
      spinV *= 0.94; spin += spinV * dt;
      grp.rotation.y = Math.sin(t * 0.6) * 0.3 + S.px * 0.55 + spin;
      grp.rotation.x = S.py * 0.35 + Math.sin(t * 0.8) * 0.06;
      grp.position.y = Math.sin(t * 1.1) * 0.05;
      ring.rotation.z = t * 0.5; ring.rotation.x = 1.2 + S.py * 0.3;
      const wx = (S.lx - 0.5) * 100 / K;
      for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        const near = S.inside ? Math.exp(-Math.pow((b.position.x - wx) * 1.5, 2)) * (0.35 + (1 - clamp(Math.abs(S.ly - 0.8) * 2.2, 0, 1)) * 0.75) : 0;
        const base = 0.14 + (Math.sin(t * 2.2 + i * 0.7) * 0.5 + 0.5) * 0.14;
        const live = playing ? (Math.sin(t * 13 + i * 1.9) * 0.5 + 0.5) * 0.55 * (0.5 + Math.sin(i * 0.33 + t * 3) * 0.5) + 0.12 : 0;
        b.scale.y = lerp(b.scale.y, base + near + live, 0.25);
      }
    },
    play(done) {
      cloud.classList.add('hid');
      boost = 2.2; typeT = 0;
      S.after(1500, () => { spinV = 15.5; });
      S.after(2300, () => { cloud.classList.remove('hid'); restart(cloud.firstChild, 'pop'); });
      S.after(6200, () => { cloud.firstChild.classList.remove('pop'); if (!reduce) cloud.classList.add('hid'); done(); });
    }
  };
}

/* ---------- 3. Gemini: орбита ---------- */
function gemini(S) {
  const DATA = [['fa-solid fa-table', 'Google Таблицы'], ['fa-solid fa-file-lines', 'Документы'], ['fa-solid fa-folder', 'Диск'], ['fa-solid fa-envelope', 'Gmail']];
  const svg = el('<svg class="h3d-svg" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="h3dBeam" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100"><stop offset="0" stop-color="#4285F4"/><stop offset="1" stop-color="#C3A2F0"/></linearGradient></defs></svg>');
  const hit = it('it-hit', 50, 47, 20, '');
  const card = it('it-card hid', 50, 90, 150, '<div class="g bub"><small><i class="fa-solid fa-gem"></i> Ответ по файлу</small>В прайсе <b>2 840 позиций</b>. Дешевле всего: кабель ВВГ 3×2,5 - 84 ₽/м</div>');
  S.stage.append(svg, hit, card);
  const orbs = DATA.map((d, i) => {
    const o = it('it-orb', 50, 50, 0, '<div class="g tile"><i class="' + d[0] + '"></i></div><em>' + d[1] + '</em>');
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x2', 50); ln.setAttribute('y2', 47); svg.appendChild(ln);
    o.addEventListener('pointerenter', () => { hov = i; });
    o.addEventListener('pointerleave', () => { if (hov === i) hov = -1; });
    S.stage.appendChild(o);
    return { o, ln, a: i * Math.PI / 2 + 0.5, on: false };
  });
  let hov = -1, th = 0, flash = 0, pulse = 0, auto = -1;
  let cry = null, halo, spin = 0, spinV = 0;
  if (S.gl) {
    cry = medal(S, 'gemini', 0xC9D6FF, 1.42, { glow: 0.04, face: 0xf6f7fb, sheen: 0.3 });
    halo = glow(0x6f8cff, 4.6, 0.34);
    const holder = new Group(); holder.add(halo, cry); holder.position.set(0, 0.13, 0);
    S.gl.scene.add(holder);
  } else fallbackImg(S, 50, 47, 'gemini', 0.85, '#fff');

  return {
    update(dt, t) {
      const d = Math.hypot(S.lx - 0.5, S.ly - 0.47);
      const fast = S.inside && d < 0.2 ? 3 : 1;
      const active = hov >= 0 ? hov : auto;
      if (active < 0) th += dt * 0.32 * fast;
      flash = Math.max(0, flash - dt); pulse *= 0.93;
      orbs.forEach((b, i) => {
        const a = b.a + th, cs = Math.cos(a), sn = Math.sin(a);
        const x = 50 + cs * 39, y = 47 + sn * 13 + cs * 9, z = sn * 150;
        b.o.style.setProperty('--x', x.toFixed(2) + '%'); b.o.style.setProperty('--y', y.toFixed(2) + '%');
        b.o.style.setProperty('--z', z.toFixed(0) + 'px');
        const on = active === i;
        b.o.style.setProperty('--s', (on ? 1.22 : 0.86 + (sn + 1) * 0.09).toFixed(3));
        if (on !== b.on) { b.on = on; b.o.classList.toggle('on', on); }
        b.ln.setAttribute('x1', x.toFixed(2)); b.ln.setAttribute('y1', y.toFixed(2));
        const lit = on || flash > 0;
        if (lit !== b.lit) { b.lit = lit; b.ln.classList.toggle('on', lit); }
      });
      if (!cry) return;
      spinV *= 0.94; spin += spinV * dt;
      cry.rotation.y = Math.sin(t * 0.6) * 0.3 + S.px * 0.6 + spin; cry.rotation.x = S.py * 0.35; cry.rotation.z = Math.sin(t * 0.7) * 0.04;
      cry.scale.setScalar(1 + pulse * 0.16 + Math.sin(t * 1.6) * 0.012);
      cry.position.y = Math.sin(t * 1.1) * 0.05;
      halo.material.opacity = 0.34 + pulse * 0.5;
    },
    play(done) {
      card.classList.add('hid');
      auto = 0;
      S.after(900, () => { auto = 2; });
      S.after(1800, () => { auto = -1; flash = 1.6; pulse = 1; spinV = 15.5; });
      S.after(2100, () => { pulse = 1; });
      S.after(2400, () => { card.classList.remove('hid'); restart(card.firstChild, 'pop'); });
      S.after(6400, () => { card.firstChild.classList.remove('pop'); if (!reduce) card.classList.add('hid'); done(); });
    }
  };
}

/* ---------- 4. Claude: разбор договора ---------- */
function claude(S) {
  const W = [94, 88, 91, 70, 0, 92, 84, 90, 62, 0, 93, 86, 78];
  let lines = '';
  W.forEach((w, i) => {
    if (i === 4) lines += '<div class="ln k" data-k="0" style="--w:86%"></div>';
    else if (i === 9) lines += '<div class="ln k" data-k="1" style="--w:74%"></div>';
    else lines += '<div class="ln" style="--w:' + w + '%"></div>';
  });
  const sheet = it('it-sheet', 60, 53, 30, '<div class="h3d-fl" style="--d:-2s"><div class="sheet"><div class="sh-f"><div class="sh-h">ДОГОВОР ПОСТАВКИ № 47</div>' + lines + '<div class="scan"></div></div><div class="sh-b"><small>Итог разбора</small><b>3 риска · 2 вопроса к поставщику</b><ul><li>п. 4.2: штраф 0,5% в день</li><li>п. 7.1: оплата через 60 дней</li></ul></div></div></div>');
  const notes = [
    it('it-note hid', 30, 47, 170, '<div class="g"><i class="fa-solid fa-triangle-exclamation"></i>п. 4.2 - штраф 0,5% в день: риск</div>'),
    it('it-note hid', 33, 68, 170, '<div class="g"><i class="fa-solid fa-clock"></i>п. 7.1 - оплата 60 дней</div>')
  ];
  /* талисман: картинка владельца сайта как есть, оживает за счёт движения */
  const pet = it('it-pet', 52, 93, 150, '<div class="pet-w"><div class="pet-j"><img class="pet" src="/hero3d/mascot-claude.webp?v=4" alt="" draggable="false"></div></div>');
  const petJ = pet.querySelector('.pet-j');
  const hop = () => restart(petJ, 'hop');
  pet.addEventListener('pointerenter', hop);
  S.stage.append(sheet, notes[0], notes[1], pet);
  const ks = sheet.querySelectorAll('.ln.k');
  function mark(i, on) { ks[i].classList.toggle('on', on); notes[i].classList.toggle('hid', !on); }
  ks.forEach((k, i) => {
    k.addEventListener('pointerenter', () => mark(i, true));
    k.addEventListener('pointerleave', () => mark(i, false));
  });
  let lens = null, av = null, tx = -1.15, ty = -0.62, zoom = 0, zx = 0, zy = 0, spin = 0, spinV = 0;
  if (S.gl) {
    lens = new Group();
    const g = glass(0xD97757, { rough: 0.16, opacity: 0.95, glow: 0.3 });
    lens.add(new Mesh(new TorusGeometry(0.74, 0.11, 24, 80), g));
    const gl = new Mesh(new CylinderGeometry(0.72, 0.72, 0.02, 64), new MeshBasicMaterial({ color: 0xffe3d6, transparent: true, opacity: 0.1, depthWrite: false }));
    gl.rotation.x = Math.PI / 2; lens.add(gl);
    const handle = new Mesh(new CapsuleGeometry(0.1, 0.72, 8, 20), g); handle.position.set(-0.86, -0.86, 0); handle.rotation.z = -Math.PI / 4; lens.add(handle);
        lens.add(glow(0xD97757, 1.5, 0.3));
    lens.scale.setScalar(0.6);
    S.gl.scene.add(lens);
    S.gl.canvas.style.setProperty('--glz', '100px');
    av = medal(S, 'claude', 0xD97757, 1.02);
    av.position.set(-1.18, 1.0, 0);
    const ag = glow(0xD97757, 1.8, 0.3); ag.position.set(-1.18, 1.0, -0.9);
    S.gl.scene.add(ag, av);
  } else fallbackImg(S, 21, 26, 'claude', 0.62);

  return {
    update(dt, t) {
      if (!lens) return;
      const wx = (S.lx - 0.5) * 100 / K / 1.14, wy = -(S.ly - 0.5) * 100 / K / 1.14;
      const hx = -1.15, hy = -0.62;
      const over = S.inside && !S.host.classList.contains('flip');
      const pull = over ? 1 : 0;
      const gx = zoom ? zx : clamp(hx + (wx - hx) * pull, -1.5, 1.5), gy = zoom ? zy : clamp(hy + (wy - hy) * pull, -1.3, 1.5);
      const k = 1 - Math.exp(-dt * 7); tx = lerp(tx, gx, k); ty = lerp(ty, gy, k);
      lens.position.set(tx, ty + Math.sin(t * 1.2) * 0.05, 0.3);
      lens.rotation.y = S.px * 0.5 + Math.sin(t * 0.6) * 0.12;
      lens.rotation.x = -S.py * 0.4;
      lens.rotation.z = Math.sin(t * 0.8) * 0.06;
      spinV *= 0.94; spin += spinV * dt;
      av.rotation.y = Math.sin(t * 0.55) * 0.28 + S.px * 0.6 + spin; av.rotation.x = S.py * 0.4;
      av.position.y = 1.0 + Math.sin(t * 1.0 + 1) * 0.05;
    },
    click() { if (S.host.classList.contains('flip')) { hop(); S.clear(); S.host.classList.remove('flip', 'run'); S.playing = false; return true; } return false; },
    play(done, user) {
      if (user) {
        mark(0, false); mark(1, false); S.host.classList.add('flip'); spinV = 15.5; hop();
        if (reduce) { done(); return; }
        S.after(6000, () => { S.host.classList.remove('flip'); done(); });
        return;
      }
      zoom = 1; zx = 0.3; zy = 0.42;
      S.after(500, () => mark(0, true));
      S.after(1500, () => { mark(1, true); zy = -0.2; });
      S.after(2900, () => { mark(0, false); mark(1, false); zoom = 0; spinV = 15.5; hop(); S.host.classList.add('flip'); });
      S.after(6600, () => { if (!reduce) S.host.classList.remove('flip'); done(); });
    }
  };
}

/* ---------- 5. Telegram: телефон и самолётик ---------- */
function telegram(S) {
  const phone = it('it-phone', 50, 52, 0, '<div class="ph"><div class="ph-back"></div><div class="ph-side l"></div><div class="ph-side r"></div><div class="ph-face"><div class="ph-top"><span class="av"><i class="fa-solid fa-robot"></i></span><div><b>Студия красоты</b><small>бот · онлайн</small></div></div><div class="ph-chat"><div class="m u">Можно записаться на субботу?</div><div class="m b">Да, в субботу свободно:</div><div class="slots"><span data-t="11:00">11:00</span><span data-t="14:00">14:00</span><span data-t="17:00">17:00</span></div><div class="m u pick hid"></div><div class="m b ok hid"></div></div><div class="ph-in"><span>Сообщение</span><i class="fa-solid fa-paper-plane"></i></div></div></div>');
  const push = it('it-push hid', 50, 6, 150, '<div class="g chip"><span></span></div>');
  S.stage.append(phone, push);
  const slots = phone.querySelector('.slots'), pick = phone.querySelector('.pick'), ok = phone.querySelector('.ok'), pushTxt = push.querySelector('span');
  let plane = null, ang = 0.6, dive = 0, diving = false;
  const P = new Vector3(), Nx = new Vector3();
  if (S.gl) {
    const v = new Float32Array([
      0, 0, 1.25, -1.05, 0.12, -0.85, 0, 0, -0.55,
      0, 0, 1.25, 0, 0, -0.55, 1.05, 0.12, -0.85,
      0, 0, 1.25, 0, 0, -0.55, 0, -0.42, -0.7
    ]);
    const g = new BufferGeometry(); g.setAttribute('position', new BufferAttribute(v, 3)); g.computeVertexNormals();
    plane = new Group();
    const body = new Mesh(g, glass(0x2AABEE, { rough: 0.12, opacity: 0.9, glow: 0.42, flat: true, side: DoubleSide }));
    body.scale.setScalar(0.34);
    const pg = glow(0x2AABEE, 1.0, 0.45); pg.position.z = 0; plane.add(body, pg);
    S.gl.scene.add(plane);
  } else fallback(S, 88, 24, 'fa-solid fa-paper-plane', 0.42);
  function orbit(a, out) {
    const tilt = 0.38 + S.py * 0.35;
    const x = Math.cos(a) * (1.6 + S.px * 0.15), z = Math.sin(a) * 1.25;
    out.set(x, Math.sin(a) * tilt * -1 + Math.sin(a * 2) * 0.22 + 0.05, z);
  }
  function reset() { slots.classList.remove('hid'); pick.classList.add('hid'); ok.classList.add('hid'); push.classList.add('hid'); phone.classList.remove('on'); }

  return {
    update(dt, t) {
      if (!plane) return;
      if (!diving) { ang += dt * 0.95; dive = Math.max(0, dive - dt * 1.4); }
      else dive = Math.min(1, dive + dt * 1.5);
      orbit(ang, P); orbit(ang + 0.12, Nx);
      const e = dive * dive * (3 - 2 * dive);
      plane.position.set(lerp(P.x, 0.05, e), lerp(P.y, 0.1, e), lerp(P.z, 0.25, e));
      Nx.set(lerp(Nx.x, 0, e), lerp(Nx.y, 0.1, e), lerp(Nx.z, -2, e));
      plane.lookAt(Nx);
      plane.rotateZ(Math.cos(ang) * 0.5 * (1 - e));
      plane.scale.setScalar(Math.max(0.001, 1 - e));
      const front = plane.position.z >= -0.05;
      if (front !== S.front) { S.front = front; S.gl.canvas.style.setProperty('--glz', front ? '70px' : '-70px'); }
    },
    click(e) { const s = e.target.closest('.slots span'); return s ? (this._t = s.dataset.t, false) : (this._t = '14:00', false); },
    play(done) {
      const tm = this._t || '14:00'; this._t = null;
      reset(); phone.classList.add('on');
      S.after(350, () => { slots.classList.add('hid'); pick.textContent = tm; pick.classList.remove('hid'); });
      S.after(1150, () => { ok.innerHTML = 'Записал вас <i class="fa-solid fa-check"></i><br>Суббота, ' + tm; ok.classList.remove('hid'); diving = true; });
      S.after(2100, () => { pushTxt.textContent = '🔥 Новая запись: суббота, ' + tm; push.classList.remove('hid'); restart(push.firstChild, 'pop'); });
      S.after(2500, () => { diving = false; ang += 2.4; });
      S.after(6200, () => { push.firstChild.classList.remove('pop'); if (!reduce) reset(); done(); });
    }
  };
}

/* ---------- 6. n8n: живая схема ---------- */
function n8n(S) {
  const C = [50, 50];
  const NODES = [
    { x: 15, y: 28, ic: '<i class="fa-solid fa-globe"></i>', t: 'Сайт', n: 'Заявка с формы → в систему', c: '#00D4FF', dir: 1 },
    { x: 15, y: 73, ic: '<i class="fa-brands fa-telegram"></i>', t: 'Telegram', n: 'Сообщение → заявка', c: '#38BDF8', dir: 1 },
    { x: 85, y: 28, ic: '<i class="fa-solid fa-address-card"></i>', t: 'AmoCRM', n: 'Заявка → карточка в CRM', c: '#8C7BFF', dir: -1 },
    { x: 85, y: 73, ic: '1С', t: '1С', n: 'Накладная → 1С без ввода', c: '#FFB86B', dir: -1 },
    { x: 50, y: 85, ic: '<i class="fa-solid fa-table"></i>', t: 'Google Таблица', n: 'Отчёт собирается сам', c: '#5CFFC8', dir: -1 }
  ];
  let h = '<svg class="h3d-svg" viewBox="0 0 100 100" aria-hidden="true">';
  NODES.forEach((n, i) => {
    const mx = (n.x + C[0]) / 2, d = n.x === 50 ? 'M' + n.x + ' ' + (n.y - 5) + ' L' + C[0] + ' ' + C[1] : 'M' + n.x + ' ' + n.y + ' C' + mx + ' ' + n.y + ',' + mx + ' ' + C[1] + ',' + C[0] + ' ' + C[1];
    h += '<path class="tube o" d="' + d + '"/><path class="tube i" id="h3dT' + i + '" d="' + d + '"/>';
    if (!reduce) [0, 1.2].forEach((off) => {
      h += '<circle r="1.1" fill="#fff"><animateMotion dur="' + (2.1 + (i % 3) * 0.3) + 's" begin="' + (-(off + i * 0.3)).toFixed(1) + 's" repeatCount="indefinite" keyPoints="' + (n.dir > 0 ? '0;1' : '1;0') + '" keyTimes="0;1" calcMode="linear"><mpath href="#h3dT' + i + '"/></animateMotion></circle>';
    });
  });
  h += '</svg>';
  const svg = el(h);
  S.stage.appendChild(svg);
  S.svg = svg;
  const tubes = svg.querySelectorAll('.tube.i');
  const nodes = NODES.map((n, i) => {
    const o = it('it-node lift', n.x, n.y, 40, '<div class="h3d-fl" style="--d:' + (-i * 1.3) + 's;--c:' + n.c + '"><div class="cube"><s>' + n.ic + '</s><s></s><s></s><s></s><s></s><s></s></div><b>' + n.t + '</b></div><em>' + n.n + '</em><u><i class="fa-solid fa-check"></i></u>');
    S.stage.appendChild(o);
    return o;
  });
  const hit = it('it-hit', 50, 50, 30, '');
  const count = it('it-count', 50, 10, 110, '<div class="g chip">Обработано заявок сегодня: <b>47</b></div>');
  S.stage.append(hit, count);
  const num = count.querySelector('b');
  let total = 47, near = -1, hub = null, r1, r2, bump = 0, gem, spin = 0, spinV = 0;
  if (S.gl) {
    hub = new Group();
    gem = medal(S, 'n8n', 0xEA4B71, 1.1, { ls: 1.12 });
    r1 = new Mesh(new TorusGeometry(0.98, 0.026, 10, 80), new MeshBasicMaterial({ color: 0xff9db4, transparent: true, opacity: 0.85 }));
    r2 = new Mesh(new TorusGeometry(1.14, 0.015, 10, 80), new MeshBasicMaterial({ color: 0xEA4B71, transparent: true, opacity: 0.7 }));
    r1.rotation.x = 1.3; r2.rotation.x = 1.05; r2.rotation.y = 0.7;
    hub.add(glow(0xEA4B71, 3.2, 0.34), gem, r1, r2);
    S.gl.scene.add(hub);
  } else fallbackImg(S, 50, 50, 'n8n', 0.7);

  return {
    update(dt, t) {
      let best = -1, bd = 1e9;
      if (S.inside) NODES.forEach((n, i) => { const d = Math.hypot(S.lx * 100 - (n.x + C[0]) / 2, S.ly * 100 - (n.y + C[1]) / 2); if (d < bd) { bd = d; best = i; } });
      if (best !== near) { if (near >= 0) tubes[near].classList.remove('near'); if (best >= 0) tubes[best].classList.add('near'); near = best; }
      if (!hub) return;
      bump *= 0.93;
      spinV *= 0.94; spin += spinV * dt;
      gem.rotation.y = Math.sin(t * 0.6) * 0.3 + S.px * 0.6 + spin; gem.rotation.x = S.py * 0.35;
      r1.rotation.z = t * (0.7 + bump * 6); r2.rotation.z = -t * (0.5 + bump * 5);
      hub.scale.setScalar(1 + bump * 0.3 + Math.sin(t * 2) * 0.02);
    },
    play(done) {
      nodes.forEach((n) => n.classList.remove('ok'));
      bump = 1; spinV = 15.5; S.host.classList.add('wave');
      nodes.forEach((n, i) => S.after(350 + i * 260, () => { n.classList.add('ok'); n.classList.add('on'); S.after(700, () => n.classList.remove('on')); }));
      S.after(1900, () => { total += 1; num.textContent = total; restart(count, 'bump'); bump = 0.6; S.host.classList.remove('wave'); });
      S.after(4600, () => { if (!reduce) nodes.forEach((n) => n.classList.remove('ok')); done(); });
    }
  };
}

const SCENES = {
  agent: [agent, 0x00D4FF, 0x8C7BFF], chatgpt: [chatgpt, 0x10A37F, 0x5CFFC8], gemini: [gemini, 0x4285F4, 0x9B72CB],
  claude: [claude, 0xD97757, 0xF2B39B], telegram: [telegram, 0x2AABEE, 0x7FD4FF], n8n: [n8n, 0xEA4B71, 0xFF8FA8]
};

/* ---------- движок ---------- */
function boot(host) {
  const def = SCENES[host.dataset.scene];
  if (!def || host.__h3d) return;
  host.__h3d = true;
  host.classList.add('h3d-' + host.dataset.scene);
  const stage = el('<div class="h3d-stage"></div>');
  const hint = el('<div class="h3d-hint"><i class="fa-solid fa-hand-pointer"></i>Нажмите, чтобы увидеть в деле</div>');
  host.append(stage, hint);
  const S = { host, stage, gl: null, px: 0, py: 0, tx: 0, ty: 0, lx: 0.5, ly: 0.5, inside: false, playing: false, timers: [], ticks: [], lastUser: 0, clicked: false };
  S.after = (ms, fn) => { S.timers.push(setTimeout(fn, reduce ? 0 : ms)); };
  S.clear = () => { S.timers.forEach(clearTimeout); S.timers = []; };
  if (!weak) { try { S.gl = makeGL(S, def[1], def[2]); } catch (e) { S.gl = null; } }
  const sc = def[0](S);

  function fit() { host.style.setProperty('--u', (host.clientWidth / 100).toFixed(3) + 'px'); if (S.gl) S.gl.size(); if (reduce) once(); }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else window.addEventListener('resize', fit);

  let raf = 0, last = 0, vis = false, t = 0;
  function tick(dt) {
    t += dt;
    const k = 1 - Math.exp(-dt * 5.5); S.px += (S.tx - S.px) * k; S.py += (S.ty - S.py) * k;
    host.style.setProperty('--px', S.px.toFixed(3)); host.style.setProperty('--py', S.py.toFixed(3));
    for (let i = 0; i < S.ticks.length; i++) S.ticks[i](t);
    sc.update(dt, t);
    if (S.gl) S.gl.renderer.render(S.gl.scene, S.gl.camera);
  }
  function frame(now) {
    raf = 0;
    if (!vis) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    tick(dt);
    raf = requestAnimationFrame(frame);
  }
  function once() { requestAnimationFrame(() => tick(0.016)); }
  S.redraw = () => { if (reduce || !raf) once(); };
  function setVis(v) {
    v = v && !document.hidden;
    if (v === vis) return;
    vis = v; host.classList.toggle('paused', !v);
    if (S.svg && S.svg.pauseAnimations) { if (v) S.svg.unpauseAnimations(); else S.svg.pauseAnimations(); }
    if (v && !reduce && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  let onScreen = false;
  new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; setVis(onScreen); }, { threshold: 0.05 }).observe(host);
  document.addEventListener('visibilitychange', () => setVis(onScreen));

  function move(e) {
    const r = host.getBoundingClientRect();
    S.lx = (e.clientX - r.left) / r.width; S.ly = (e.clientY - r.top) / r.height;
    S.inside = S.lx > -0.05 && S.lx < 1.05 && S.ly > -0.05 && S.ly < 1.05;
    if (S.inside) S.lastUser = performance.now();
    if (reduce) return;
    S.tx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5), -1, 1);
    S.ty = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.5), -1, 1);
  }
  window.addEventListener('pointermove', move, { passive: true });
  host.addEventListener('pointerleave', () => { S.inside = false; });

  /* телефон: наклон по гироскопу */
  let gyro = false;
  function tiltEv(e) {
    if (e.gamma == null || reduce) return;
    S.tx = clamp(e.gamma / 28, -1, 1); S.ty = clamp((e.beta - 42) / 28, -1, 1);
  }
  function gyroOn() {
    if (gyro || !window.DeviceOrientationEvent || mq('(hover: hover) and (pointer: fine)')) return;
    gyro = true;
    const D = window.DeviceOrientationEvent;
    if (typeof D.requestPermission === 'function') D.requestPermission().then((r) => { if (r === 'granted') window.addEventListener('deviceorientation', tiltEv, { passive: true }); }).catch(() => {});
    else window.addEventListener('deviceorientation', tiltEv, { passive: true });
  }
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') gyroOn();

  function play(user) {
    if (S.playing) return;
    S.playing = true; S.clear(); host.classList.add('run');
    sc.play(() => { S.playing = false; host.classList.remove('run'); if (reduce) once(); }, user);
    if (reduce) once();
  }
  host.addEventListener('click', (e) => {
    S.lastUser = performance.now(); S.clicked = true; hint.classList.add('off'); gyroOn();
    if (sc.click && sc.click(e)) { if (reduce) once(); return; }
    play(true);
  });

  fit();
  requestAnimationFrame(() => { host.classList.add('ready'); if (reduce) once(); });
  if (!reduce && !/[?&]h3d=manual/.test(location.search)) {
    setTimeout(() => { if (vis && !S.clicked) play(false); }, 3000);
    setInterval(() => { if (vis && !S.playing && !S.inside && performance.now() - S.lastUser > 9000) play(false); }, 12000);
  }
}

function init() { document.querySelectorAll('.h3d[data-scene]').forEach(boot); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
