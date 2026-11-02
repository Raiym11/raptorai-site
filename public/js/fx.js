/* RaptorAI visual layer: iridescent WebGL backdrop + glass orb, card tilt and glass sheen.
   Pure WebGL1, no libraries. Falls back to CSS if WebGL is unavailable. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;

  /* ---------- glass sheen + tilt on cards ---------- */
  var CARD_SEL = '.service-card, .why-card, .case-card, .step, .testimonial-card, .contact-form';
  function initCards() {
    var cards = document.querySelectorAll(CARD_SEL);
    for (var i = 0; i < cards.length; i++) {
      (function (el) {
        el.setAttribute('data-glass', '');
        if (!fine || reduce) return;
        var tilt = !el.classList.contains('contact-form') && !el.classList.contains('stat-item') && !el.classList.contains('case-hero');
        var raf = 0, ev = null;
        function apply() {
          raf = 0;
          var r = el.getBoundingClientRect();
          var x = (ev.clientX - r.left) / r.width;
          var y = (ev.clientY - r.top) / r.height;
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          if (tilt) {
            el.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
            el.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
          }
        }
        el.addEventListener('pointermove', function (e) {
          ev = e;
          if (!raf) raf = requestAnimationFrame(apply);
        }, { passive: true });
        el.addEventListener('pointerleave', function () {
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
        });
      })(cards[i]);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCards);
  else initCards();

  /* ---------- WebGL backdrop ---------- */
  var canvas = document.getElementById('fx-canvas');
  if (!canvas) return;
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', premultipliedAlpha: false });
  } catch (e) { gl = null; }
  if (!gl) { root.classList.add('no-gl'); return; }

  var OCT = small ? 3 : 4;
  var vsrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fsrc = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '#define OCT ' + OCT,
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform vec3 uOrb;uniform float uOrbA;',
    'float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<OCT;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return v;}',
    'vec3 irid(float t){t=fract(t);',
    ' vec3 a=vec3(0.,.83,1.),b=vec3(.48,.36,1.),c=vec3(1.,.31,.85),d=vec3(.36,1.,.78);',
    ' float s=t*4.;',
    ' if(s<1.)return mix(a,b,smoothstep(0.,1.,s));',
    ' if(s<2.)return mix(b,c,smoothstep(0.,1.,s-1.));',
    ' if(s<3.)return mix(c,d,smoothstep(0.,1.,s-2.));',
    ' return mix(d,a,smoothstep(0.,1.,s-3.));}',
    /* ring: returns (alpha, hue) for a tilted orbit; side<0 behind the orb, >0 in front */
    'vec3 ring(vec2 d,float ang,float tilt,float t){',
    ' float c=cos(ang),s=sin(ang);vec2 q=vec2(c*d.x+s*d.y,-s*d.x+c*d.y);',
    ' q.y/=tilt;float r=length(q);float e=abs(r-1.55);',
    ' float w=.007+.008*(1.-tilt)+1.4/uOrb.z;',
    ' float line=smoothstep(w,0.,e);',
    ' float glow=exp(-e*22.)*.35;',
    ' float side=q.y;',
    ' float hue=atan(q.y,q.x)/6.2832+t*.05;',
    ' return vec3(line+glow,hue,side);}',
    'void main(){',
    ' vec2 frag=gl_FragCoord.xy;',
    ' vec2 uv=frag/uRes;',
    ' float asp=uRes.x/uRes.y;',
    ' vec2 p=(uv-.5)*vec2(asp,1.);',
    ' float t=uTime;',
    /* backdrop: warped noise ribbons */
    ' vec2 q=vec2(fbm(p*1.5+vec2(0.,t*.035)),fbm(p*1.5+vec2(5.2,1.3)-vec2(t*.03,0.)));',
    ' float f=fbm(p*1.25+2.*q+vec2(t*.02,-t*.015));',
    ' vec3 col=vec3(.026,.036,.050);',
    ' float rib=smoothstep(.42,.86,f);',
    ' col+=irid(f*1.35+t*.012+uv.x*.25)*rib*.115;',
    ' col+=vec3(0.,.55,.8)*.05*smoothstep(1.2,0.,length(p-vec2(.35*asp,.15)));',
    ' col*=1.-.55*pow(length(uv-.5)*1.15,2.);',
    /* orb */
    ' if(uOrbA>.002){',
    '  vec2 d=(frag-uOrb.xy)/uOrb.z;',
    '  float len=length(d);',
    '  float ang=atan(d.y,d.x);',
    '  float rr=1.+.045*sin(3.*ang+t*.6)+.03*sin(5.*ang-t*.45)+.02*sin(2.*ang+t*.3);',
    '  vec2 ms=(uMouse-.5)*2.;',
    '  vec3 L=normalize(vec3(ms.x*.9+.35,ms.y*.9+.55,.8));',
    /* ring behind */
    '  vec3 r1=ring(d,.45+t*.07+ms.x*.1,.30,t);',
    '  vec3 r2=ring(d,-.7-t*.05,.22,t+3.);',
    '  vec3 rc1=irid(r1.y)*r1.x,rc2=irid(r2.y+.4)*r2.x;',
    '  vec3 behind=(r1.z<0.?rc1:vec3(0.))+(r2.z<0.?rc2:vec3(0.));',
    '  col+=behind*uOrbA*.85;',
    '  float edge=smoothstep(rr,rr-2./uOrb.z,len);',
    '  vec2 dd=d/rr;float l2=min(dot(dd,dd),1.);',
    '  vec3 n=vec3(dd,sqrt(1.-l2));',
    '  vec2 w=vec2(fbm(dd*2.2+vec2(t*.12,0.)),fbm(dd*2.2+vec2(7.,-t*.1)))-.5;',
    '  n=normalize(n+vec3(w*.34,0.));',
    '  vec3 v=vec3(0.,0.,1.);',
    '  float nv=clamp(n.z,0.,1.);',
    '  float fres=pow(1.-nv,2.4);',
    '  vec3 rd=refract(-v,n,.72);',
    '  vec2 ip=rd.xy*1.7+dd*.9+vec2(t*.04,0.);',
    '  float inner=fbm(ip*2.1+vec2(0.,t*.07));',
    '  float inner2=fbm(ip*3.4-vec2(t*.05,3.));',
    '  vec3 body=mix(vec3(.012,.03,.055),irid(inner*1.5+t*.03+dot(n.xy,L.xy)*.4)*.82,smoothstep(.28,.82,inner));',
    '  body+=irid(inner2*1.2+.5+t*.02)*smoothstep(.55,.9,inner2)*.35;',
    '  float film=nv*1.25+.35*fbm(n.xy*2.+t*.08)+t*.04+dot(n.xy,L.xy)*.45;',
    '  vec3 sheen=irid(film)*(fres*1.35+.10);',
    '  vec3 R=reflect(-L,n);',
    '  float spec=pow(max(dot(R,v),0.),46.)*1.1;',
    '  float spec2=pow(max(dot(reflect(-normalize(vec3(-.6,-.5,.7)),n),v),0.),30.)*.35;',
    '  float rim=pow(1.-nv,4.5);',
    '  vec3 oc=body*.78+sheen+vec3(spec)+irid(film+.3)*spec2+irid(film+.55)*rim*.9;',
    '  oc*=.86+.14*nv;',
    '  float glow=exp(-max(len-rr,0.)*3.2)*.16;',
    '  col+=irid(t*.05+.1)*glow*uOrbA;',
    '  col=mix(col,oc,edge*uOrbA);',
    /* ring in front */
    '  vec3 front=(r1.z>=0.?rc1:vec3(0.))+(r2.z>=0.?rc2:vec3(0.));',
    '  col+=front*uOrbA;',
    ' }',
    ' col+=(hash(frag+fract(t))-.5)*.012;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('fx shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, vsrc), fs = sh(gl.FRAGMENT_SHADER, fsrc);
  if (!vs || !fs) { root.classList.add('no-gl'); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { root.classList.add('no-gl'); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, 'uRes'),
      uTime = gl.getUniformLocation(prog, 'uTime'),
      uMouse = gl.getUniformLocation(prog, 'uMouse'),
      uOrb = gl.getUniformLocation(prog, 'uOrb'),
      uOrbA = gl.getUniformLocation(prog, 'uOrbA');

  var scale = small ? 0.5 : Math.min(0.8, Math.max(0.55, 1.1 / Math.max(1, window.devicePixelRatio || 1)));
  var W = 0, H = 0;
  function resize() {
    var w = Math.max(1, Math.floor(window.innerWidth * scale));
    var h = Math.max(1, Math.floor(window.innerHeight * scale));
    if (w !== W || h !== H) {
      W = w; H = h; canvas.width = W; canvas.height = H;
      gl.viewport(0, 0, W, H);
    }
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  var anchor = document.getElementById('orb-anchor');
  var mx = 0.62, my = 0.6, tx = 0.62, ty = 0.6;
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth;
    ty = 1 - e.clientY / window.innerHeight;
  }, { passive: true });

  var t0 = performance.now(), last = 0, running = true, drawn = false;
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function frame(now) {
    if (!running) return;
    if (!reduce) requestAnimationFrame(frame);
    if (small && now - last < 33) return; /* ~30fps on phones */
    last = now;
    var el = (now - t0) / 1000;
    var tt = reduce ? 6.5 : el;
    mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
    var ox = -1000, oy = -1000, orad = 1, alpha = 0;
    if (anchor && window.__fxHero && window.__fxHero.mode === 'orb') {
      var r = anchor.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom > 0 && r.top < vh && r.width > 0) {
        var cx = r.left + r.width / 2 + (mx - 0.5) * 18;
        var cy = r.top + r.height / 2 - (my - 0.5) * 14;
        ox = cx * scale; oy = (vh - cy) * scale;
        var intro = reduce ? 1 : ease(Math.min(1, Math.max(0, (el - 0.25) / 1.5)));
        orad = r.width * 0.30 * scale * (0.82 + 0.18 * intro);
        alpha = intro * Math.min(1, Math.max(0, (r.bottom - 40) / (r.height * 0.55)));
      }
    }
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uTime, tt);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform3f(uOrb, ox, oy, orad);
    gl.uniform1f(uOrbA, alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!drawn) { drawn = true; root.classList.add('gl-on'); }
  }
  requestAnimationFrame(frame);
  if (reduce) {
    window.addEventListener('resize', function () { requestAnimationFrame(frame); }, { passive: true });
    window.addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; if (!reduce) requestAnimationFrame(frame); }
  });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; root.classList.remove('gl-on'); root.classList.add('no-gl'); });
})();


/* ---------- case chart: custom canvas, aggressive reveal ---------- */
(function () {
  'use strict';
  var cv = document.getElementById('caseFx');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var labels = ["Авг '25", "Сен '25", "Окт '25", "Ноя '25", "Дек '25", "Янв '26", "Фев '26", "Мар '26", "Апр '26", "Май '26", "Июн '26", "Июл '26", "Авг '26"];
  var data = [90, 110, 105, 106, 120, 155, 145, 207, 192, 290, 335, 515, 753];
  var N = data.length, LAUNCH = 5, KEY = [0, 4, 5, 9, 11, 12];
  var kpi = document.getElementById('caseKpiValue');
  var W = 0, H = 0, dpr = 1, narrow = false, pad = { l: 14, r: 30, t: 64, b: 38 };
  var pts = [], mTan = [], DUR = 2900;
  var state = 'idle', t0 = 0, visible = false, armed = true, raf = 0, hover = -1, pass = {}, doneAt = 0;

  function ease(u) { return 1 - Math.pow(1 - u, 3.4); }
  function back(u) { var c = 2.2; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function build() {
    var max = 753 * 1.06, i;
    pts = [];
    for (i = 0; i < N; i++) {
      pts.push({ x: pad.l + (W - pad.l - pad.r) * i / (N - 1), y: pad.t + (H - pad.t - pad.b) * (1 - data[i] / max) });
    }
    var d = [], m = [];
    for (i = 0; i < N - 1; i++) d.push(pts[i + 1].y - pts[i].y);
    m[0] = d[0]; m[N - 1] = d[N - 2];
    for (i = 1; i < N - 1; i++) m[i] = (d[i - 1] * d[i] <= 0) ? 0 : (d[i - 1] + d[i]) / 2;
    for (i = 0; i < N - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      var a = m[i] / d[i], b = m[i + 1] / d[i], s2 = a * a + b * b;
      if (s2 > 9) { var tt = 3 / Math.sqrt(s2); m[i] = tt * a * d[i]; m[i + 1] = tt * b * d[i]; }
    }
    mTan = m;
  }
  function at(s) {
    s = clamp(s, 0, N - 1);
    var i = Math.min(Math.floor(s), N - 2), t = s - i, t2 = t * t, t3 = t2 * t;
    var y = (2 * t3 - 3 * t2 + 1) * pts[i].y + (t3 - 2 * t2 + t) * mTan[i] + (-2 * t3 + 3 * t2) * pts[i + 1].y + (t3 - t2) * mTan[i + 1];
    return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: y };
  }
  function valueAt(s) {
    s = clamp(s, 0, N - 1);
    var i = Math.min(Math.floor(s), N - 2), t = s - i;
    return data[i] + (data[i + 1] - data[i]) * t;
  }
  function size() {
    var r = cv.parentNode.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    narrow = W < 520;
    pad = { l: 14, r: narrow ? 24 : 34, t: 64, b: narrow ? 46 : 38 };
    build();
  }

  function pathTo(sHead, close) {
    var steps = Math.max(2, Math.ceil(sHead * 14)), k, p;
    ctx.beginPath();
    for (k = 0; k <= steps; k++) {
      p = at(sHead * k / steps);
      if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    if (close) {
      var e = at(sHead), base = H - pad.b;
      ctx.lineTo(e.x, base); ctx.lineTo(pts[0].x, base); ctx.closePath();
    }
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function draw(now) {
    var u = state === 'idle' ? 0 : (state === 'done' ? 1 : clamp((now - t0) / DUR, 0, 1));
    var p = ease(u);
    var sHead = p * (N - 1);
    var time = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var base = H - pad.b, i;

    /* grid */
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.setLineDash([3, 7]);
    for (i = 1; i <= 3; i++) {
      var gy = pad.t + (base - pad.t) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W - pad.r + 8, gy); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath(); ctx.moveTo(pad.l, base + .5); ctx.lineTo(W - pad.r + 8, base + .5); ctx.stroke();

    /* x labels */
    ctx.font = '600 ' + (narrow ? 11 : 11.5) + 'px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var showIdx = narrow ? [0, 3, 5, 8, 10, 12] : null;
    for (i = 0; i < N; i++) {
      if (showIdx && showIdx.indexOf(i) < 0) continue;
      var reached = sHead >= i - 0.01;
      ctx.fillStyle = reached ? 'rgba(200,214,228,.85)' : 'rgba(136,153,170,.4)';
      if (narrow) {
        var pr = labels[i].split(" '");
        ctx.fillText(pr[0], pts[i].x, base + 9); ctx.fillText('20' + pr[1], pts[i].x, base + 22);
      } else ctx.fillText(labels[i], pts[i].x, base + 10);
    }

    if (sHead > 0.02) {
      /* launch marker */
      var lp = clamp((sHead - LAUNCH + 0.35) / 0.35, 0, 1);
      if (lp > 0) {
        var lx = pts[LAUNCH].x, ly = pts[LAUNCH].y;
        ctx.save(); ctx.globalAlpha = lp;
        var lg = ctx.createLinearGradient(0, 14, 0, base);
        lg.addColorStop(0, 'rgba(255,122,224,.95)'); lg.addColorStop(1, 'rgba(255,122,224,0)');
        ctx.strokeStyle = lg; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx, base); ctx.stroke(); ctx.setLineDash([]);
        var txt = 'Запуск ИИ-агента';
        ctx.font = '700 ' + (narrow ? 11.5 : 12.5) + 'px Inter, sans-serif';
        var tw = ctx.measureText(txt).width + 24, tx = clamp(lx - tw / 2, 4, W - tw - 4);
        var pop = back(lp);
        ctx.translate(tx + tw / 2, 18); ctx.scale(pop, pop); ctx.translate(-(tx + tw / 2), -18);
        rr(tx, 4, tw, 28, 14);
        var bg = ctx.createLinearGradient(tx, 0, tx + tw, 0); bg.addColorStop(0, 'rgba(255,122,224,.9)'); bg.addColorStop(1, 'rgba(140,123,255,.9)');
        ctx.fillStyle = bg; ctx.shadowColor = 'rgba(255,122,224,.7)'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#12081a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, tx + tw / 2, 19);
        ctx.restore();
        /* shock ring when the head crosses launch */
        var pt = pass[LAUNCH];
        if (pt) {
          var age = (now - pt) / 900;
          if (age < 1) {
            ctx.save(); ctx.globalAlpha = (1 - age) * .9; ctx.strokeStyle = '#FF7AE0'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(lx, ly, 8 + age * 70, 0, 6.2832); ctx.stroke(); ctx.restore();
          }
        }
      }

      /* area */
      pathTo(sHead, true);
      var ag = ctx.createLinearGradient(0, pad.t, 0, base);
      ag.addColorStop(0, 'rgba(0,212,255,.42)'); ag.addColorStop(.55, 'rgba(140,123,255,.16)'); ag.addColorStop(1, 'rgba(140,123,255,0)');
      ctx.fillStyle = ag; ctx.fill();
      ctx.save(); pathTo(sHead, true); ctx.clip();
      var sh = ((time * .35) % 1.6 - .3) * W;
      var sg = ctx.createLinearGradient(sh - 120, 0, sh + 120, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.1)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();

      /* line */
      var head = at(sHead);
      var lgrad = ctx.createLinearGradient(pad.l, 0, Math.max(head.x, pad.l + 1), 0);
      lgrad.addColorStop(0, '#00D4FF'); lgrad.addColorStop(.5, '#8C7BFF'); lgrad.addColorStop(1, '#FF7AE0');
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(140,123,255,.9)'; ctx.shadowBlur = 22; ctx.strokeStyle = lgrad; ctx.lineWidth = 4;
      pathTo(sHead, false); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2;
      pathTo(sHead, false); ctx.stroke();

      /* comet tail */
      if (state === 'playing') {
        var tail = Math.max(0, sHead - 1.6), k, steps = 26;
        for (k = 0; k < steps; k++) {
          var a0 = at(tail + (sHead - tail) * k / steps), a1 = at(tail + (sHead - tail) * (k + 1) / steps);
          ctx.strokeStyle = 'rgba(255,255,255,' + (k / steps * .9).toFixed(3) + ')'; ctx.lineWidth = 1 + k / steps * 5;
          ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        }
      }

      /* key points */
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (i = 0; i < KEY.length; i++) {
        var ki = KEY[i];
        if (narrow && (ki === 9 || ki === 11)) continue;
        if (sHead < ki - 0.001 && !(state === 'done')) continue;
        var pt2 = pass[ki] || 0, ag2 = state === 'done' && !pt2 ? 1 : clamp((now - pt2) / 520, 0, 1);
        var sc = back(ag2), q = pts[ki];
        ctx.save(); ctx.translate(q.x, q.y); ctx.scale(sc, sc);
        ctx.fillStyle = '#0a1018'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0,212,255,.9)'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.font = '900 ' + (ki === N - 1 ? 22 : 15) + 'px Inter, sans-serif';
        ctx.fillStyle = ki === N - 1 ? '#fff' : '#bff1ff'; ctx.shadowColor = 'rgba(140,123,255,.9)'; ctx.shadowBlur = ki === N - 1 ? 16 : 8;
        var ty = ki === N - 1 ? -16 : -14;
        var tx2 = ki === N - 1 ? -Math.min(14, W - pad.r - q.x + 14) : 0;
        ctx.fillText(String(data[ki]), tx2 - (ki === N - 1 ? 8 : 0), ty); ctx.restore();
      }

      /* head glow */
      var pulse = 1 + .25 * Math.sin(time * 6);
      var hg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 26 * pulse);
      hg.addColorStop(0, 'rgba(255,255,255,.95)'); hg.addColorStop(.25, 'rgba(255,122,224,.65)'); hg.addColorStop(1, 'rgba(255,122,224,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(head.x, head.y, 26 * pulse, 0, 6.2832); ctx.fill();

      /* ripples on the final point once done */
      if (state === 'done') {
        for (i = 0; i < 3; i++) {
          var rp = ((time * .55) + i / 3) % 1;
          ctx.strokeStyle = 'rgba(0,212,255,' + ((1 - rp) * .6).toFixed(3) + ')'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(head.x, head.y, 8 + rp * 34, 0, 6.2832); ctx.stroke();
        }
      }
    }

    /* hover crosshair */
    if (hover >= 0 && state !== 'idle' && (state === 'done' || sHead >= hover)) {
      var hp = pts[hover];
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(hp.x, pad.t - 18); ctx.lineTo(hp.x, base); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 5, 0, 6.2832); ctx.fill();
      var l1 = labels[hover], l2 = data[hover] + ' клиентов';
      ctx.font = '600 11.5px Inter, sans-serif'; var w1 = ctx.measureText(l1).width;
      ctx.font = '800 15px Inter, sans-serif'; var w2 = ctx.measureText(l2).width;
      var bw = Math.max(w1, w2) + 28, bh = 52, bx = clamp(hp.x - bw / 2, 4, W - bw - 4), by = Math.max(4, hp.y - bh - 18);
      rr(bx, by, bw, bh, 12); ctx.fillStyle = 'rgba(10,16,24,.92)'; ctx.fill();
      ctx.strokeStyle = 'rgba(160,200,255,.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = '600 11.5px Inter, sans-serif'; ctx.fillStyle = '#8899AA'; ctx.fillText(l1, bx + 14, by + 20);
      ctx.font = '800 15px Inter, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(l2, bx + 14, by + 40);
    }

    /* record the moment the head passes each point */
    for (i = 0; i < N; i++) if (!pass[i] && sHead >= i && state !== 'idle') pass[i] = now;
    if (kpi) kpi.textContent = String(Math.round(state === 'idle' ? 0 : valueAt(sHead)));

    if (state === 'playing' && u >= 1) { state = 'done'; doneAt = now; }
  }

  function loop(now) {
    raf = 0;
    if (!visible) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(loop); }
  function play() {
    pass = {}; hover = -1;
    if (reduce) { state = 'done'; draw(performance.now()); return; }
    state = 'playing'; t0 = performance.now(); kick();
  }

  size();
  draw(performance.now());
  if (window.ResizeObserver) new ResizeObserver(function () { size(); draw(performance.now()); }).observe(cv.parentNode);
  else window.addEventListener('resize', function () { size(); draw(performance.now()); });

  cv.addEventListener('pointermove', function (e) {
    if (state === 'idle') return;
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left;
    var idx = Math.round((x - pad.l) / (W - pad.l - pad.r) * (N - 1));
    hover = clamp(idx, 0, N - 1);
    if (reduce) draw(performance.now());
  }, { passive: true });
  cv.addEventListener('pointerleave', function () { hover = -1; if (reduce) draw(performance.now()); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var e = es[0];
      visible = e.isIntersecting;
      if (visible) { if (armed && e.intersectionRatio > .38) { armed = false; play(); } else kick(); }
      else { if (e.intersectionRatio === 0) armed = true; }
    }, { threshold: [0, .38, .6] }).observe(cv);
  } else { visible = true; play(); }
})();


/* ---------- stats: rolling digits ---------- */
(function () {
  'use strict';
  var els = document.querySelectorAll('.stat-num[data-roll]');
  if (!els.length || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || !('IntersectionObserver' in window)) return;
  var band = els[0].closest('.stats');
  var rows = [];
  els.forEach(function (el, idx) {
    var txt = el.getAttribute('data-roll'), strips = [], k = 0, i;
    el.setAttribute('role', 'img'); el.setAttribute('aria-label', txt); el.textContent = '';
    for (i = 0; i < txt.length; i++) {
      var ch = txt.charAt(i);
      if (/\d/.test(ch)) {
        var d = +ch, n = (2 + k) * 10 + d, html = '', j;
        for (j = 0; j <= n; j++) html += '<i>' + (j % 10) + '</i>';
        var dg = document.createElement('span'); dg.className = 'dg'; dg.setAttribute('aria-hidden', 'true');
        var st = document.createElement('span'); st.className = 'dgi'; st.innerHTML = html;
        dg.appendChild(st); el.appendChild(dg); strips.push({ st: st, n: n, k: k }); k++;
      } else {
        var sx = document.createElement('span'); sx.className = 'sx'; sx.setAttribute('aria-hidden', 'true'); sx.textContent = ch; el.appendChild(sx);
      }
    }
    rows.push({ item: el.closest('.stat-item'), strips: strips, idx: idx });
  });
  if (band) band.classList.add('roll');
  function reset() {
    rows.forEach(function (r) { r.item.classList.remove('go', 'hit'); r.strips.forEach(function (s) { s.st.style.transition = 'none'; s.st.style.transform = 'translateY(0)'; }); });
    if (band) band.classList.remove('fire');
  }
  function play() {
    reset();
    void band.offsetHeight;
    if (band) band.classList.add('fire');
    rows.forEach(function (r) {
      var delay = r.idx * 140, longest = 0;
      r.strips.forEach(function (s) {
        var dur = 1700 + s.k * 420, dl = delay + s.k * 90;
        s.st.style.transition = 'transform ' + dur + 'ms cubic-bezier(.3,.55,.25,1) ' + dl + 'ms';
        s.st.style.transform = 'translateY(-' + (s.n * 1.1) + 'em)';
        longest = Math.max(longest, dur + dl);
      });
      setTimeout(function () { r.item.classList.add('go'); }, delay + 250);
      setTimeout(function () { r.item.classList.add('hit'); }, longest - 150);
    });
  }
  reset();
  var armed = true;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.intersectionRatio >= 0.5 && armed) { armed = false; play(); }
      else if (!e.isIntersecting && e.intersectionRatio === 0 && !armed) { armed = true; reset(); }
    });
  }, { threshold: [0, 0.55] }).observe(band || els[0]);
})();


/* ---------- hero visual: workflow / network / orb ---------- */
(function () {
  'use strict';
  var host = document.getElementById('orb-anchor');
  if (!host) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var netStop = null, tiltOn = null;
  var q = (location.search.match(/[?&]hero=(flow|net|orb)/) || [])[1];
  window.__fxHero = { mode: q || 'flow' };

  function buildFlow() {
    var N = [
      { x: 16, y: 15, ic: 'fa-solid fa-globe', t: 'Сайт', c: '#00D4FF', c2: '#5CFFC8' },
      { x: 13, y: 50, ic: 'fa-brands fa-telegram', t: 'Telegram', c: '#38BDF8', c2: '#8C7BFF' },
      { x: 16, y: 85, ic: 'fa-solid fa-envelope', t: 'Почта', c: '#5CFFC8', c2: '#00D4FF' },
      { x: 84, y: 15, ic: 'fa-solid fa-address-card', t: 'CRM', c: '#FF7AE0', c2: '#8C7BFF' },
      { x: 87, y: 50, ic: 'fa-solid fa-table', t: 'Таблица', c: '#8C7BFF', c2: '#FF7AE0' },
      { x: 84, y: 85, ic: 'fa-solid fa-user-tie', t: 'Менеджер', c: '#FFB86B', c2: '#FF7AE0' }
    ];
    var P = [
      'M16 15 C36 15, 36 50, 50 50', 'M13 50 L50 50', 'M16 85 C36 85, 36 50, 50 50',
      'M50 50 C64 50, 64 15, 84 15', 'M50 50 L87 50', 'M50 50 C64 50, 64 85, 84 85'
    ];
    var h = '<div class="hv hv-flow"><svg class="hf-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs></defs>';
    P.forEach(function (d, i) { h += '<path id="hfp' + i + '" d="' + d + '"/>'; });
    if (!reduce) P.forEach(function (d, i) {
      var out = i > 2, col = out ? '#FF7AE0' : '#00D4FF';
      [0, 1.3].forEach(function (off) {
        h += '<circle r="1.05" fill="' + col + '"><animateMotion dur="' + (2.2 + (i % 3) * 0.35) + 's" begin="' + (off + i * 0.28) + 's" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#hfp' + i + '"/></animateMotion></circle>';
      });
    });
    h += '</svg>';
    N.forEach(function (n, i) {
      h += '<div class="hn" style="left:' + n.x + '%;top:' + n.y + '%;--i:' + i + ';--c:' + n.c + ';--c2:' + n.c2 + '"><div class="hn-card"><span class="hn-ic"><i class="' + n.ic + '"></i></span><b>' + n.t + '</b></div></div>';
    });
    h += '<div class="hn hn-core" style="left:50%;top:50%;--i:6;--c:#00D4FF;--c2:#8C7BFF"><span class="hn-ring"></span><span class="hn-ring r2"></span><div class="hn-card"><span class="hn-ic"><i class="fa-solid fa-robot"></i></span><b>ИИ-агент</b></div></div>';
    h += '<div class="hn-chip" style="left:50%;top:5%;--d:0s"><i class="fa-solid fa-circle-check"></i>Лид квалифицирован</div>';
    h += '<div class="hn-chip" style="left:50%;top:95%;--d:3.5s"><i class="fa-solid fa-bolt"></i>Ответ клиенту за 2 сек</div>';
    h += '</div>';
    host.innerHTML = h;
    var el = host.firstChild, raf = 0, px = 0, py = 0;
    function mv(e) {
      px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; el.style.setProperty('--px', px.toFixed(3)); el.style.setProperty('--py', py.toFixed(3)); });
    }
    if (!reduce) window.addEventListener('pointermove', mv, { passive: true });
    tiltOn = function () { window.removeEventListener('pointermove', mv); };
  }

  function buildNet() {
    var cv = document.createElement('canvas'); cv.className = 'hv hv-net'; cv.setAttribute('aria-hidden', 'true');
    host.appendChild(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
    var NODES = [], i, j, EDGES = [], PULSES = [];
    var COUNT = 74, ga = Math.PI * (3 - Math.sqrt(5));
    for (i = 0; i < COUNT; i++) {
      var y = 1 - (i / (COUNT - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      var jr = 0.9 + ((i * 37) % 17) / 85;
      NODES.push({ x: Math.cos(th) * r * jr, y: y * jr, z: Math.sin(th) * r * jr, s: 0.7 + ((i * 53) % 10) / 12 });
    }
    for (i = 0; i < COUNT; i++) for (j = i + 1; j < COUNT; j++) {
      var dx = NODES[i].x - NODES[j].x, dy = NODES[i].y - NODES[j].y, dz = NODES[i].z - NODES[j].z;
      if (dx * dx + dy * dy + dz * dz < 0.42) EDGES.push([i, j]);
    }
    for (i = 0; i < 22; i++) PULSES.push({ e: (i * 29) % EDGES.length, p: (i * 0.37) % 1, v: 0.004 + (i % 5) * 0.0016, dir: i % 2 ? 1 : -1 });
    function size() { var r = host.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(host);
    var ang = 0.6, tx = 0, ty = 0, mx = 0, my = 0, run = true, vis = true, raf = 0, last = 0;
    function mv(e) { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2; }
    if (!reduce) window.addEventListener('pointermove', mv, { passive: true });
    var io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && run && !raf) raf = requestAnimationFrame(draw); }, { threshold: 0 }); io.observe(host);
    function col(t, a) { /* cyan -> violet -> pink */
      var h = 190 + 130 * t; return 'hsla(' + h + ',95%,' + (62 + 8 * t) + '%,' + a + ')';
    }
    var proj = [];
    function draw(now) {
      raf = 0; if (!run || !vis) return;
      var dt = Math.min(50, now - last || 16); last = now;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      if (!reduce) ang += dt * 0.00028;
      var cy = Math.cos(ang + mx * 0.5), sy = Math.sin(ang + mx * 0.5), tl = 0.38 + my * 0.22, ct = Math.cos(tl), st = Math.sin(tl);
      var R = Math.min(W, H) * 0.36, cx0 = W / 2, cy0 = H / 2;
      ctx.clearRect(0, 0, W, H);
      var g = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, R * 1.5);
      g.addColorStop(0, 'rgba(140,123,255,.32)'); g.addColorStop(0.5, 'rgba(0,212,255,.1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (i = 0; i < COUNT; i++) {
        var n = NODES[i], x1 = n.x * cy + n.z * sy, z1 = -n.x * sy + n.z * cy, y2 = n.y * ct - z1 * st, z2 = n.y * st + z1 * ct;
        var f = 3.2 / (3.2 - z2);
        proj[i] = { x: cx0 + x1 * R * f, y: cy0 + y2 * R * f, z: z2, f: f, t: (y2 + 1.1) / 2.2 };
      }
      ctx.lineWidth = 1;
      for (i = 0; i < EDGES.length; i++) {
        var a = proj[EDGES[i][0]], b = proj[EDGES[i][1]], al = 0.07 + 0.3 * ((a.z + b.z) / 2 + 1.1) / 2.2;
        ctx.strokeStyle = col((a.t + b.t) / 2, al); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      for (i = 0; i < PULSES.length; i++) {
        var pl = PULSES[i]; if (!reduce) pl.p += pl.v * dt / 16 * pl.dir;
        if (pl.p > 1 || pl.p < 0) { pl.e = (pl.e + 7 + i) % EDGES.length; pl.p = pl.dir > 0 ? 0 : 1; }
        var ea = proj[EDGES[pl.e][0]], eb = proj[EDGES[pl.e][1]], px = ea.x + (eb.x - ea.x) * pl.p, py = ea.y + (eb.y - ea.y) * pl.p, zt = (ea.z + eb.z) / 2;
        var rr = 2.6 + zt * 1.2;
        var gg = ctx.createRadialGradient(px, py, 0, px, py, rr * 4);
        gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(0.25, col((ea.t + eb.t) / 2, 0.8)); gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, rr * 4, 0, 6.2832); ctx.fill();
      }
      var order = proj.map(function (p, k) { return k; }).sort(function (u, v) { return proj[u].z - proj[v].z; });
      for (var k = 0; k < order.length; k++) {
        var pj = proj[order[k]], nd = NODES[order[k]], rad = (1.8 + nd.s * 1.5) * pj.f, aa = 0.45 + 0.55 * (pj.z + 1.1) / 2.2;
        ctx.fillStyle = col(pj.t, aa); ctx.beginPath(); ctx.arc(pj.x, pj.y, rad, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + (aa * 0.7) + ')'; ctx.beginPath(); ctx.arc(pj.x - rad * 0.25, pj.y - rad * 0.25, rad * 0.4, 0, 6.2832); ctx.fill();
      }
      var pulse = 0.5 + 0.5 * Math.sin(now / 420);
      var cg = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, R * 0.34);
      cg.addColorStop(0, 'rgba(255,255,255,.95)'); cg.addColorStop(0.3, 'rgba(160,230,255,' + (0.55 + 0.25 * pulse) + ')'); cg.addColorStop(1, 'rgba(140,123,255,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx0, cy0, R * 0.34, 0, 6.2832); ctx.fill();
      if (!reduce) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    netStop = function () { run = false; if (raf) cancelAnimationFrame(raf); io.disconnect(); if (ro) ro.disconnect(); window.removeEventListener('pointermove', mv); };
  }

  function setMode(m) {
    if (netStop) { netStop(); netStop = null; }
    if (tiltOn) { tiltOn(); tiltOn = null; }
    host.innerHTML = '';
    window.__fxHero.mode = m;
    if (m === 'flow') buildFlow(); else if (m === 'net') buildNet();
  }
  setMode(window.__fxHero.mode);

  if (/[?&]pick\b/.test(location.search)) {
    var bar = document.createElement('div'); bar.className = 'hero-pick';
    [['flow', 'Workflow'], ['net', 'Нейросеть'], ['orb', 'Шар']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1]; if (o[0] === window.__fxHero.mode) b.className = 'on';
      b.onclick = function () { setMode(o[0]); Array.prototype.forEach.call(bar.children, function (x) { x.className = ''; }); b.className = 'on'; };
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
  }
})();
