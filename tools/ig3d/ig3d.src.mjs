/* RaptorAI: настоящие 3D-объекты вокруг телефона в кейсе «Инстаграм».
   Сборка: NODE_PATH=/tmp/h3/node_modules esbuild tools/ig3d/ig3d.src.mjs --bundle --minify --format=iife --outfile=public/js/ig3d.js */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, ACESFilmicToneMapping,
  DirectionalLight, AmbientLight, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial,
  PlaneGeometry, Shape, ExtrudeGeometry, CanvasTexture, TextureLoader, SRGBColorSpace,
  Raycaster, Vector2, SphereGeometry, Box3, Vector3, TorusGeometry, CylinderGeometry, CapsuleGeometry, LatheGeometry
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

document.querySelectorAll('.ig3d,.sa3d').forEach((host) => {
  const cv = host.querySelector('canvas.ig3c');
  if (cv) init(host, cv, host.classList.contains('ld3d') ? 'lead' : host.classList.contains('tr3d') ? 'tour' : host.classList.contains('sa3d') ? 'sales' : 'ig');
});

function init(host, cv, mode) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl;
  try { gl = new WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { host.classList.add('ig3-fallback'); return; }
  gl.setClearColor(0, 0);
  gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 0.92;
  gl.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const pm = new PMREMGenerator(gl);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new AmbientLight(0xffffff, 0.35));
  const d1 = new DirectionalLight(0xffffff, 2.6); d1.position.set(-3, 4, 6); scene.add(d1);
  const d2 = new DirectionalLight(0x8c7bff, 1.2); d2.position.set(4, -2, 3); scene.add(d2);
  const cam = new PerspectiveCamera(30, 1, 0.1, 100); cam.position.set(0, 0, 14);

  // «Стекло»: полупрозрачность, перламутровый отлив, яркая подсветка своим цветом
  const phys = (color, extra) => new MeshPhysicalMaterial(Object.assign({
    color, emissive: color, emissiveIntensity: 0.22, roughness: 0.04, metalness: 0.0,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.75,
    iridescence: 0.55, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 480],
    
    transparent: true, opacity: 0.9, ior: 1.5, specularIntensity: 1
  }, extra || {}));
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
    wrap.position.copy(home); const sz = new Box3().setFromObject(g).getSize(new Vector3()); o.unit = Math.max(sz.x, sz.y); o.fit = 1; objs.push(o); return o;
  };

  let bubTex, badgeTex;
  if (mode === 'ig') {
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

  } else if (mode === 'lead') {
    {
      // Мишень со стрелой
      const g = new Group(); const cols = [0xff1f5a, 0xffffff, 0xff1f5a, 0xffffff, 0xff1f5a];
      cols.forEach((c, i) => { const r = 0.85 - i * 0.17; const m = new Mesh(new CylinderGeometry(r, r, 0.16 + i * 0.03, 64), phys(c)); m.rotation.x = Math.PI / 2; m.position.z = i * 0.02; g.add(m); });
      const shaft = new Mesh(new CylinderGeometry(0.035, 0.035, 1.2, 16), phys(0x2b3445)); shaft.rotation.x = Math.PI / 2; shaft.position.z = 0.65; g.add(shaft);
      const fl = new Shape(); fl.moveTo(0, 0); fl.lineTo(0.18, 0.1); fl.lineTo(0.18, 0.28); fl.lineTo(0, 0.18); fl.closePath();
      const flG = new ExtrudeGeometry(fl, { depth: 0.01, bevelEnabled: false });
      [0, 1, 2].forEach((k) => { const f = new Mesh(flG, phys(0x00b8ff)); f.rotation.z = k * 2.09; f.rotation.y = Math.PI / 2; f.position.z = 1.1; g.add(f); });
      g.rotation.y = 0.6;
      add(g, { x: 0, y: 0, z: 0 }, [0.25, -0.5, 0], 'target');
    }
    {
      // Колокольчик уведомления
      const pts = [[0.001, 0.62], [0.12, 0.61], [0.22, 0.57], [0.29, 0.5], [0.33, 0.4], [0.35, 0.25], [0.37, 0.05], [0.4, -0.15], [0.45, -0.3], [0.53, -0.4], [0.58, -0.46], [0.56, -0.5], [0.001, -0.5]].map(([r, y]) => new Vector2(r, y));
      const g = new Group(); const gold = phys(0xffb400, { metalness: 0.55, roughness: 0.22 });
      g.add(new Mesh(new LatheGeometry(pts, 64), gold));
      const top = new Mesh(new SphereGeometry(0.13, 32, 16), gold); top.position.y = 0.66; g.add(top);
      const clap = new Mesh(new SphereGeometry(0.12, 32, 16), gold); clap.position.y = -0.58; g.add(clap);
      const badge = new Mesh(new SphereGeometry(0.17, 32, 16), phys(0xff1f5a)); badge.position.set(0.42, 0.42, 0.1); g.add(badge);
      g.rotation.z = 0.25;
      const o = add(g, { x: 0, y: 0, z: 0 }, [0.2, 0.2, 0.2], 'bell'); o.idle = 0;
    }
    {
      // Документ-заказ с галочкой
      const g = new Group();
      g.add(new Mesh(new RoundedBoxGeometry(1.1, 1.4, 0.12, 4, 0.08), phys(0xf4f7fb, { roughness: 0.3 })));
      for (let i = 0; i < 4; i++) { const l = new Mesh(new RoundedBoxGeometry(i === 0 ? 0.7 : 0.8, 0.07, 0.03, 2, 0.02), phys(i === 0 ? 0x2f8cff : 0xc5cfdd)); l.position.set(i === 0 ? -0.05 : 0, 0.45 - i * 0.2, 0.07); g.add(l); }
      const chk = new Group(); const cm = phys(0x00d68f);
      const c1 = new Mesh(new RoundedBoxGeometry(0.12, 0.32, 0.12, 3, 0.05), cm); c1.rotation.z = 0.8; c1.position.set(-0.1, -0.05, 0); chk.add(c1);
      const c2 = new Mesh(new RoundedBoxGeometry(0.12, 0.6, 0.12, 3, 0.05), cm); c2.rotation.z = -0.65; c2.position.set(0.14, 0.06, 0); chk.add(c2);
      const disc = new Mesh(new CylinderGeometry(0.38, 0.38, 0.1, 48), phys(0xe6fbf4)); disc.rotation.x = Math.PI / 2; chk.add(disc); c1.position.z = c2.position.z = 0.08;
      chk.position.set(0.32, -0.42, 0.12); g.add(chk);
      add(g, { x: 0, y: 0, z: 0 }, [0.1, 0.4, -0.08], 'doc');
    }
  } else if (mode === 'tour') {
    {
      // Глобус: океан с глубиной, материки с мягкими краями, облака отдельной сферой, орбита со спутником
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
      const sea = x.createLinearGradient(0, 0, 0, 512); sea.addColorStop(0, '#1fb6ff'); sea.addColorStop(0.5, '#0a7fe0'); sea.addColorStop(1, '#0756b8'); x.fillStyle = sea; x.fillRect(0, 0, 1024, 512);
      const blob = (cx, cy, r, n, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, rr = r * (0.7 + 0.3 * Math.sin(a * 3 + cx) * Math.cos(a * 2 + cy)); const px = cx + Math.cos(a) * rr * 1.4, py = cy + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); x.fill(); };
      const lands = [[150, 150, 70], [230, 330, 60], [520, 130, 80], [560, 290, 70], [800, 170, 95], [870, 360, 45], [380, 430, 40]];
      lands.forEach(([cx, cy, r]) => blob(cx, cy, r * 1.12, 40, 'rgba(120,230,210,.55)'));
      lands.forEach(([cx, cy, r]) => blob(cx, cy, r, 40, '#2fd18f'));
      lands.forEach(([cx, cy, r]) => blob(cx + 10, cy - 8, r * 0.45, 30, '#ffd77a'));
      const tx = new CanvasTexture(c); tx.colorSpace = SRGBColorSpace; tx.anisotropy = 4;
      const cc = document.createElement('canvas'); cc.width = 1024; cc.height = 512; const cx2 = cc.getContext('2d');
      for (let i = 0; i < 26; i++) { cx2.fillStyle = 'rgba(255,255,255,' + (0.35 + Math.random() * 0.4) + ')'; cx2.beginPath(); cx2.ellipse(Math.random() * 1024, 60 + Math.random() * 390, 30 + Math.random() * 70, 8 + Math.random() * 14, 0, 0, Math.PI * 2); cx2.fill(); }
      const ct = new CanvasTexture(cc); ct.colorSpace = SRGBColorSpace;
      const g = new Group();
      g.add(new Mesh(new SphereGeometry(0.8, 96, 64), new MeshPhysicalMaterial({ map: tx, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.35 })));
      const clouds = new Mesh(new SphereGeometry(0.835, 96, 64), new MeshPhysicalMaterial({ map: ct, transparent: true, depthWrite: false, roughness: 0.9 })); g.add(clouds);
      const ringG = new Group(); ringG.rotation.set(1.2, 0.3, 0);
      ringG.add(new Mesh(new TorusGeometry(1.12, 0.022, 16, 160), phys(0xffd43b, { metalness: 0.5, roughness: 0.2 })));
      const sat = new Mesh(new SphereGeometry(0.08, 24, 16), phys(0xffffff)); sat.position.x = 1.12; ringG.add(sat); g.add(ringG);
      const o = add(g, { x: 0, y: 0, z: 0 }, [0.25, 0, 0.15], 'globe'); o.idle = 0.35;
    }
    {
      // Лайнер: обтекаемый фюзеляж, стреловидные крылья с фаской, двигатели, иллюминаторы
      const g = new Group(); const white = phys(0xf7f9fc, { roughness: 0.22 }), blue = phys(0x1f7cff, { roughness: 0.25 }), dark = phys(0x1c2a44);
      const body = new Mesh(new CapsuleGeometry(0.2, 1.5, 12, 32), white); body.rotation.z = Math.PI / 2; g.add(body);
      const nose = new Mesh(new SphereGeometry(0.205, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), dark); nose.rotation.z = -Math.PI / 2; nose.position.x = 0.93; nose.scale.set(0.55, 0.55, 0.9); g.add(nose);
      const wingS = new Shape(); wingS.moveTo(0.25, 0); wingS.lineTo(-0.15, 0); wingS.lineTo(-0.55, 1.05); wingS.lineTo(-0.35, 1.05); wingS.closePath();
      const wGeo = new ExtrudeGeometry(wingS, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4 });
      [1, -1].forEach((sg) => { const w = new Mesh(wGeo, blue); w.rotation.x = sg * -Math.PI / 2; w.position.set(0.05, -0.04, 0); g.add(w);
        const eng = new Mesh(new CapsuleGeometry(0.07, 0.22, 8, 20), white); eng.rotation.z = Math.PI / 2; eng.position.set(0.02, -0.14, sg * 0.42); g.add(eng); });
      const tailS = new Shape(); tailS.moveTo(0, 0); tailS.lineTo(-0.3, 0); tailS.lineTo(-0.42, 0.45); tailS.lineTo(-0.28, 0.45); tailS.closePath();
      const fin = new Mesh(new ExtrudeGeometry(tailS, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 }), blue); fin.position.set(-0.62, 0.12, -0.015); g.add(fin);
      const stS = new Shape(); stS.moveTo(0, 0); stS.lineTo(-0.2, 0); stS.lineTo(-0.3, 0.38); stS.lineTo(-0.2, 0.38); stS.closePath();
      const stG = new ExtrudeGeometry(stS, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
      [1, -1].forEach((sg) => { const st = new Mesh(stG, blue); st.rotation.x = sg * -Math.PI / 2; st.position.set(-0.68, 0.02, 0); g.add(st); });
      for (let i = 0; i < 8; i++) { const wdw = new Mesh(new SphereGeometry(0.028, 12, 8), dark); wdw.position.set(0.55 - i * 0.14, 0.07, 0.19); wdw.scale.z = 0.4; g.add(wdw); }
      g.rotation.set(0.35, -0.55, 0.18);
      add(g, { x: 0, y: 0, z: 0 }, [0.3, -0.5, 0.15], 'plane');
    }
    {
      // Метка: капля через вращение профиля
      const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI; const r = Math.sin(a) * (0.5 * Math.pow(1 - t, 0.15)) * (t < 0.5 ? 1 : 1 - (t - 0.5) * 0.15); pts.push(new Vector2(Math.max(0.0001, r), 0.55 - t * 1.6 + (t > 0.6 ? 0 : 0))); }
      const g = new Group();
      const body = new Mesh(new LatheGeometry(pts, 64), phys(0xff1f5a, { roughness: 0.22 })); g.add(body);
      const dot = new Mesh(new CylinderGeometry(0.19, 0.19, 0.06, 48), phys(0xffffff)); dot.rotation.x = Math.PI / 2; dot.position.set(0, 0.12, 0.44); g.add(dot);
      const sh = new Mesh(new CylinderGeometry(0.28, 0.28, 0.01, 48), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 })); sh.position.y = -1.1; sh.scale.z = 0.4; g.add(sh);
      add(g, { x: 0, y: 0, z: 0 }, [0.1, 0.3, 0], 'pin');
    }
  } else {
  // Сцена «продажи»: лупа, столбики с ростом, монета
  {
    const g = new Group();
    const rim = new Mesh(new TorusGeometry(0.62, 0.13, 32, 80), phys(0xb9c8ff, { roughness: 0.2 }));
    const glass = new Mesh(new CylinderGeometry(0.6, 0.6, 0.05, 64), new MeshPhysicalMaterial({ color: 0xdff1ff, transmission: 0.9, roughness: 0.05, thickness: 0.4, transparent: true, opacity: 0.55, clearcoat: 1 }));
    glass.rotation.x = Math.PI / 2;
    const handle = new Mesh(new CylinderGeometry(0.13, 0.15, 0.95, 32), phys(0x8fa6ff));
    handle.position.set(0.72, -0.72, 0); handle.rotation.z = Math.PI / 4;
    g.add(rim, glass, handle);
    add(g, { x: 0, y: 0, z: 0 }, [0.2, -0.4, 0], 'lens');
  }
  {
    const g = new Group(); const hs = [0.55, 0.9, 1.3, 1.85]; const cols = [0x8c7bff, 0x6f8dff, 0x2fb7ff, 0x00d68f];
    hs.forEach((h, i) => { const m = new Mesh(new RoundedBoxGeometry(0.42, h, 0.42, 4, 0.1), phys(cols[i])); m.position.set(-0.75 + i * 0.5, h / 2 - 0.9, 0); g.add(m); });
    const arr = new Shape(); arr.moveTo(-0.08, 0); arr.lineTo(0.08, 0); arr.lineTo(0.08, 0.9); arr.lineTo(0.24, 0.9); arr.lineTo(0, 1.22); arr.lineTo(-0.24, 0.9); arr.lineTo(-0.08, 0.9); arr.closePath();
    const am = new Mesh(new ExtrudeGeometry(arr, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4 }), phys(0x00d68f));
    am.position.set(-0.55, -0.35, 0.35); am.rotation.z = -0.75; g.add(am);
    add(g, { x: 0, y: 0, z: 0 }, [0.15, 0.45, 0], 'bars');
  }
  {
    const g = new Group();
    const coin = new Mesh(new CylinderGeometry(0.7, 0.7, 0.2, 64), phys(0xffb400, { metalness: 0.6, roughness: 0.25 }));
    coin.rotation.x = Math.PI / 2; g.add(coin);
    const ct = textTex((x) => { x.fillStyle = '#a86a00'; x.font = '900 170px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₽', 128, 140); }, 256, 256); ct.redraw();
    const f = new Mesh(new PlaneGeometry(1.1, 1.1), new MeshBasicMaterial({ map: ct, transparent: true, toneMapped: false })); f.position.z = 0.105; g.add(f);
    add(g, { x: 0, y: 0, z: 0 }, [0.2, 0.5, 0], 'coin');
  }
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
  const anchors = mode === 'lead' ? { target: [0.92, 0.0], bell: [0.0, 0.05], doc: [0.93, 0.97] } : mode === 'tour' ? { globe: [1.0, 0.04], plane: [0.03, 0.02], pin: [-0.01, 0.9] } : mode === 'ig' ? { logo: [0.05, 0.12], heart: [0.95, 0.38], bubble: [0.05, 0.7], badge: [0.8, 0.89] } : { lens: [1.0, 0.06], bars: [-0.01, 0.95], coin: [0.0, 0.04] };
  const sizePx = mode === 'lead' ? { target: 110, bell: 80, doc: 90 } : mode === 'tour' ? { globe: 125, plane: 150, pin: 74 } : mode === 'ig' ? { logo: 140, heart: 72, bubble: 86, badge: 175 } : { lens: 110, bars: 120, coin: 74 };
  let W = 1, H = 1;
  const layout = () => {
    const r = cv.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    gl.setPixelRatio(dpr); gl.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix();
    const vh = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z, vw = vh * cam.aspect;
    const pad = 110; // canvas выступает за блок на 70px с каждой стороны
    objs.forEach((o) => {
      const a = anchors[o.kind];
      const px = pad + a[0] * (W - 2 * pad), py = pad + a[1] * (H - 2 * pad);
      o.home = { x: (px / W - 0.5) * vw, y: (0.5 - py / H) * vh, z: 0 };
      const ppu = H / vh; o.fit = sizePx[o.kind] * (W < 500 ? 0.8 : 1) / (ppu * o.unit);
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
    if (o.kind === 'target' || o.kind === 'bell' || o.kind === 'doc') burst(o, [0x5cffc8, 0x00b8ff, 0xffb400]);
    if (o.kind === 'globe' || o.kind === 'plane' || o.kind === 'pin') burst(o, [0x36c6ff, 0xffd43b, 0x3fd99a]);
    if (o.kind === 'lens' || o.kind === 'bars' || o.kind === 'coin') burst(o, [0xffb400, 0x8c7bff, 0x00d68f]);
    if (o.kind === 'badge') { folN += 40 + Math.floor(Math.random() * 60); badgeTex.redraw(fmt(folN)); burst(o, [0x37e8c0, 0x00b8ff, 0xffffff]); }
    wake();
  });
  // Счётчик подписчиков синхронно с анимацией телефона
  if (mode === 'ig') window.addEventListener('ig:followers', (e) => { folN = e.detail; badgeTex.redraw(fmt(folN)); });

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
      o.wrap.scale.setScalar(sc * o.fit);
      const look = reduce ? 0 : 1;
      o.g.rotation.x = o.base[0] + py * 0.45 * look + Math.sin(t * 0.9 + o.phase) * 0.08 * look;
      o.g.rotation.y = o.base[1] + px * 0.7 * look + Math.sin(t * 0.7 + o.phase) * 0.15 * look + (o.spinT < 1 ? ease(o.spinT) * Math.PI * 2 : 0) + (o.idle && !reduce ? t * o.idle : 0);
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
