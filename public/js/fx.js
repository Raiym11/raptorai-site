/* RaptorAI visual layer: iridescent WebGL backdrop + glass orb, card tilt and glass sheen.
   Pure WebGL1, no libraries. Falls back to CSS if WebGL is unavailable. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;

  /* ---------- glass sheen + tilt on cards ---------- */
  var CARD_SEL = '.service-card, .why-card, .case-card, .step, .testimonial-card, .contact-form, .stat-item';
  function initCards() {
    var cards = document.querySelectorAll(CARD_SEL);
    for (var i = 0; i < cards.length; i++) {
      (function (el) {
        el.setAttribute('data-glass', '');
        if (!fine || reduce) return;
        var tilt = !el.classList.contains('contact-form') && !el.classList.contains('stat-item');
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
    if (anchor) {
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
