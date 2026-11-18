/* RaptorAI: настоящие 3D-объекты вокруг телефона в кейсе «Инстаграм».
   Сборка: NODE_PATH=/tmp/h3/node_modules esbuild tools/ig3d/ig3d.src.mjs --bundle --minify --format=iife --outfile=public/js/ig3d.js */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, ACESFilmicToneMapping,
  DirectionalLight, AmbientLight, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  PlaneGeometry, Shape, ExtrudeGeometry, CanvasTexture, TextureLoader, SRGBColorSpace,
  Raycaster, Vector2, SphereGeometry
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const host = document.querySelector('.ig3d');
const cv = host && host.querySelector('canvas.ig3c');
if (host && cv) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl;
  try { gl = new WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { host.classList.add('ig3-fallback'); return; }
  gl.setClearColor(0, 0);
  gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 0.85;
  gl.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const pm = new PMREMGenerator(gl);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new AmbientLight(0xffffff, 0.35));
  const d1 = new DirectionalLight(0xffffff, 2.6); d1.position.set(-3, 4, 6); scene.add(d1);
  const d2 = new DirectionalLight(0x8c7bff, 1.2); d2.position.set(4, -2, 3); scene.add(d2);
  const cam = new PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0, 14);

  const phys = (color, extra) => new MeshPhysicalMaterial(Object.assign({ color, roughness: 0.28, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.05, envMapIntensity: 0.3 }, extra || {}));
  const textTex = (draw, w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
    t.redraw = (v) => { const x = c.getContext('2d'); x.clearRect(0, 0, w, h); draw(x, v); t.needsUpdate = true; };
    return t;
  };
  const objs = [];
  const add = (g, home, base, kind) => {
    const wrap = new Group(); wrap.add(g); scene.add(wrap);
    const o = { wrap, g, home, base, kind, spin: 0, spinT: 1, bounce: 0, hover: 0, phase: Math.random() * 6 };
    wrap.position.copy(home); objs.push(o); return o;
  };

  // 1. Иконка: полностью объёмная модель (плитка с градиентом, выпуклая рамка, объектив, точка)
  {
    const g = new Group();
    const rr = (w, h, r) => { const s = new Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
    const S = 1.6;
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
    let gr = gx.createRadialGradient(40, 256, 10, 60, 230, 330);
    gr.addColorStop(0, '#ffd56b'); gr.addColorStop(0.25, '#ff8a3d'); gr.addColorStop(0.5, '#ff2e63'); gr.addColorStop(0.7, '#c81ea0'); gr.addColorStop(1, '#5a2bff');
    gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
    const gt = new CanvasTexture(gc); gt.colorSpace = SRGBColorSpace;
    gt.repeat.set(1 / (S + 0.3), 1 / (S + 0.3)); gt.offset.set(0.5, 0.5);
    const tileGeo = new ExtrudeGeometry(rr(S, S, 0.42), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.14, bevelSegments: 10, curveSegments: 24 });
    tileGeo.translate(0, 0, -0.11);
    const capMat = new MeshPhysicalMaterial({ map: gt, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 0.15 });
    const sideMat = phys(0xd81b7a);
    g.add(new Mesh(tileGeo, [capMat, sideMat]));
    const white = phys(0xffffff, { roughness: 0.22, envMapIntensity: 0.45 });
    const frame = rr(1.12, 1.12, 0.32); frame.holes.push(rr(0.88, 0.88, 0.2));
    const fGeo = new ExtrudeGeometry(frame, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.03, bevelSegments: 6, curveSegments: 24 });
    const fm = new Mesh(fGeo, white); fm.position.z = 0.26; g.add(fm);
    const ring = new Shape(); ring.absarc(0, 0, 0.3, 0, Math.PI * 2, false);
    const hole = new Shape(); hole.absarc(0, 0, 0.19, 0, Math.PI * 2, true); ring.holes.push(hole);
    const rm = new Mesh(new ExtrudeGeometry(ring, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.03, bevelSegments: 6, curveSegments: 40 }), white);
    rm.position.z = 0.26; g.add(rm);
    const dot = new Mesh(new SphereGeometry(0.075, 24, 18), white); dot.position.set(0.3, 0.3, 0.33); dot.scale.z = 0.7; g.add(dot);
    g.scale.setScalar(0.68);
    add(g, { x: 0, y: 0, z: 0 }, [-0.25, 0.4, 0], 'logo');
  }
  // 2. Сердце
  {
    const s = new Shape();
    s.moveTo(0, -0.95);
    s.bezierCurveTo(-0.35, -0.62, -1.05, -0.2, -1.05, 0.32);
    s.bezierCurveTo(-1.05, 0.78, -0.72, 1.02, -0.42, 1.02);
    s.bezierCurveTo(-0.16, 1.02, -0.02, 0.86, 0, 0.66);
    s.bezierCurveTo(0.02, 0.86, 0.16, 1.02, 0.42, 1.02);
    s.bezierCurveTo(0.72, 1.02, 1.05, 0.78, 1.05, 0.32);
    s.bezierCurveTo(1.05, -0.2, 0.35, -0.62, 0, -0.95);
    const geo = new ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.16, bevelSegments: 10, curveSegments: 40 });
    geo.center();
    const m = new Mesh(geo, phys(0xe8125f));
    m.scale.setScalar(0.36);
    add(m, { x: 0, y: 0, z: 0 }, [0.15, -0.3, 0.1], 'heart');
  }
  // 3. Облачко комментария с числом
  let bubTex;
  {
    const s = new Shape();
    s.absellipse(0, 0.08, 1.15, 0.86, 0, Math.PI * 2, false);
    const tail = new Shape(); tail.moveTo(-0.65, -0.45); tail.lineTo(-0.95, -1.05); tail.lineTo(-0.15, -0.7);
    const geo1 = new ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.14, bevelSegments: 10, curveSegments: 48 });
    const geo2 = new ExtrudeGeometry(tail, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.12, bevelSegments: 8 });
    const g = new Group(); const mat = phys(0x0090d8);
    g.add(new Mesh(geo1, mat), new Mesh(geo2, mat));
    g.children.forEach((c) => c.position.z = -0.15);
    bubTex = textTex((x, v) => { x.fillStyle = '#fff'; x.font = '900 120px Unbounded, Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(0,40,80,.45)'; x.shadowBlur = 12; x.fillText('+' + v, 256, 128); }, 512, 256);
    bubTex.redraw(24);
    const label = new Mesh(new PlaneGeometry(1.9, 0.95), new MeshBasicMaterial({ map: bubTex, transparent: true, toneMapped: false }));
    label.position.set(0, 0.1, 0.36); g.add(label);
    g.scale.setScalar(0.38);
    add(g, { x: 0, y: 0, z: 0 }, [-0.1, 0.4, 0], 'bubble');
  }
  // 4. Плашка подписчиков
  let badgeTex;
  {
    const g = new Group();
    g.add(new Mesh(new RoundedBoxGeometry(3.3, 0.86, 0.32, 6, 0.3), phys(0x14d6a8, { roughness: 0.22 })));
    badgeTex = textTex((x, v) => {
      x.fillStyle = '#06131c'; x.textBaseline = 'middle';
      x.font = '900 92px Unbounded, Inter, sans-serif'; x.fillText('+' + v, 46, 128);
      const w = x.measureText('+' + v).width;
      x.font = '700 54px Inter, sans-serif'; x.fillText('подписчиков', 46 + w + 26, 134);
    }, 1024, 256);
    badgeTex.redraw('1 000');
    const label = new Mesh(new PlaneGeometry(3.3, 0.825), new MeshBasicMaterial({ map: badgeTex, transparent: true, toneMapped: false }));
    label.position.z = 0.165; g.add(label);
    g.scale.setScalar(0.46);
    add(g, { x: 0, y: 0, z: 0 }, [0.1, -0.35, -0.05], 'badge');
  }

  // Частицы при нажатии
  const parts = [];
  const pGeo = new SphereGeometry(0.07, 12, 10);
  const burst = (o, colors) => {
    for (let i = 0; i < 18; i++) {
      const m = new Mesh(pGeo, phys(colors[i % colors.length]));
      m.position.copy(o.wrap.position);
      const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * 1.2, sp = 0.05 + Math.random() * 0.06;
      m.userData.v = [Math.cos(a) * sp, Math.sin(a) * sp + 0.02, b * sp]; m.userData.life = 1;
      scene.add(m); parts.push(m);
    }
  };

  // Раскладка по экрану: точки привязки в долях от размера блока
  const anchors = { logo: [0.1, 0.1], heart: [0.9, 0.36], bubble: [0.08, 0.72], badge: [0.76, 0.88] };
  let W = 1, H = 1;
  const layout = () => {
    const r = cv.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    gl.setPixelRatio(dpr); gl.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix();
    const vh = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z, vw = vh * cam.aspect;
    const pad = 70; // canvas выступает за блок на 70px с каждой стороны
    objs.forEach((o) => {
      const a = anchors[o.kind];
      const px = pad + a[0] * (W - 2 * pad), py = pad + a[1] * (H - 2 * pad);
      o.home = { x: (px / W - 0.5) * vw, y: (0.5 - py / H) * vh, z: 0 };
    });
  };
  layout(); addEventListener('resize', layout);
  new ResizeObserver(layout).observe(cv);

  // Взаимодействие
  const ray = new Raycaster(), mp = new Vector2(), ptr = { x: 0, y: 0, in: false };
  const pick = (e) => {
    const r = cv.getBoundingClientRect();
    mp.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mp, cam);
    const hit = ray.intersectObjects(objs.map((o) => o.wrap), true)[0];
    if (!hit) return null;
    return objs.find((o) => { let p = hit.object; while (p) { if (p === o.wrap) return true; p = p.parent; } return false; });
  };
  let hovered = null, bubN = 24, folN = 1000;
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1; ptr.in = true;
    hovered = pick(e); cv.style.cursor = hovered ? 'pointer' : '';
    wake();
  });
  host.addEventListener('pointerleave', () => { ptr.in = false; hovered = null; cv.style.cursor = ''; });
  cv.addEventListener('pointerdown', (e) => {
    const o = pick(e); if (!o) return;
    o.spin = 0; o.spinT = 0; o.bounce = 1;
    if (o.kind === 'logo') burst(o, [0xffc94d, 0xff4f8f, 0xc64cff]);
    if (o.kind === 'heart') burst(o, [0xff3d84, 0xff7ae0, 0xffffff]);
    if (o.kind === 'bubble') { bubTex.redraw(++bubN); burst(o, [0x10b8ec, 0x8c7bff, 0xffffff]); }
    if (o.kind === 'badge') { folN += 40 + Math.floor(Math.random() * 60); badgeTex.redraw(fmt(folN)); burst(o, [0x37e8c0, 0x00d4ff, 0xffffff]); }
    wake();
  });
  // Счётчик подписчиков синхронно с анимацией телефона
  window.addEventListener('ig:followers', (e) => { folN = e.detail; badgeTex.redraw(fmt(folN)); });

  // Цикл
  let vis = false, raf = 0, t0 = performance.now(), idleUntil = 0;
  const panel = host.closest('.cx-p');
  const isOn = () => vis && (!panel || panel.classList.contains('on'));
  function wake() { idleUntil = performance.now() + 4000; if (!raf && isOn()) raf = requestAnimationFrame(frame); }
  new IntersectionObserver((es) => { vis = es[0].isIntersecting; if (vis) { layout(); wake(); } }).observe(host);
  if (panel) new MutationObserver(() => { if (isOn()) { layout(); wake(); } }).observe(panel, { attributes: true, attributeFilter: ['class'] });
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    raf = 0;
    if (!isOn()) return;
    const t = (now - t0) / 1000;
    objs.forEach((o, i) => {
      const fl = reduce ? 0 : Math.sin(t * 1.1 + o.phase) * 0.12;
      const px = ptr.in ? ptr.x : 0, py = ptr.in ? ptr.y : 0;
      const tx = o.home.x - px * 0.18 * (i % 2 ? 1 : -1), ty = o.home.y + fl + py * 0.14;
      o.wrap.position.x += (tx - o.wrap.position.x) * 0.12;
      o.wrap.position.y += (ty - o.wrap.position.y) * 0.12;
      o.hover += ((hovered === o ? 1 : 0) - o.hover) * 0.15;
      if (o.spinT < 1) o.spinT = Math.min(1, o.spinT + 0.022);
      o.bounce *= 0.9;
      const sc = 1 + o.hover * 0.12 + Math.sin((1 - o.bounce) * Math.PI) * o.bounce * 0.35;
      o.wrap.scale.setScalar(sc);
      const look = reduce ? 0 : 1;
      o.g.rotation.x = o.base[0] + py * 0.45 * look + Math.sin(t * 0.9 + o.phase) * 0.08 * look;
      o.g.rotation.y = o.base[1] + px * 0.7 * look + Math.sin(t * 0.7 + o.phase) * 0.15 * look + (o.spinT < 1 ? ease(o.spinT) * Math.PI * 2 : 0);
      o.g.rotation.z = o.base[2];
    });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], v = p.userData.v;
      p.position.x += v[0]; p.position.y += v[1]; p.position.z += v[2]; v[1] -= 0.003;
      p.userData.life -= 0.02; p.scale.setScalar(Math.max(0.01, p.userData.life));
      if (p.userData.life <= 0) { scene.remove(p); p.material.dispose(); parts.splice(i, 1); }
    }
    gl.render(scene, cam);
    if (!reduce || performance.now() < idleUntil || parts.length) raf = requestAnimationFrame(frame);
  }
  wake();
}
