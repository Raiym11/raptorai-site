/* Первый экран главной: ИИ-ядро из жидкого стекла, вокруг кружат капли */
(function () {
  var box = document.querySelector('.hx-drops'); if (!box) return;
  var cv = box.querySelector('canvas');
  var gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) { box.style.display = 'none'; return; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 760px)').matches;
  var FS = [
    'precision highp float;uniform vec2 R;uniform float T,C;uniform vec2 M;uniform float H;',
    'vec3 pal(float t){vec3 a=vec3(0.,.83,1.),b=vec3(.55,.48,1.),c=vec3(1.,.48,.88),d=vec3(.36,1.,.78);',
    ' t=fract(t);return t<.25?mix(a,b,t*4.):t<.5?mix(b,c,(t-.25)*4.):t<.75?mix(c,d,(t-.5)*4.):mix(d,a,(t-.75)*4.);}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'mat2 r2(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    'float map(vec3 p){p.xz*=r2(M.x*.55*H);p.yz*=r2(-M.y*.4*H);',
    ' float d=length(p)-.55-.05*sin(p.x*5.+T*1.5)*sin(p.y*5.-T)*sin(p.z*5.+T*.7)-C*.12;',
    ' for(int i=0;i<6;i++){float fi=float(i);float a=T*(.6+fi*.07)+fi*1.05;float r=.95+.45*sin(T*.7+fi*1.9)+C*.25;',
    '  vec3 c=vec3(cos(a)*r,sin(a)*r*sin(fi*1.1+.6),sin(a)*r*cos(fi*1.1+.6));d=smin(d,length(p-c)-.16,.38);}',
    ' return d;}',
    'vec3 nor(vec3 p){vec2 e=vec2(.0015,0);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}',
    'void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;vec3 ro=vec3(0,0,5.5),rd=normalize(vec3(uv,-1.55));',
    ' float b=dot(ro,rd),h0=b*b-dot(ro,ro)+6.8;if(h0<0.){gl_FragColor=vec4(0.);return;}',
    ' float t=max(0.,-b-sqrt(h0)),mh=1e5,mt=0.;bool hit=false;',
    ' for(int i=0;i<90;i++){float h=map(ro+rd*t);if(h<mh){mh=h;mt=t;}if(h<.0008){hit=true;break;}t+=h*.9;if(t>10.)break;}',
    ' float px=2.2/R.y*mt*.62;float a=hit?1.:1.-smoothstep(0.,px,mh);if(a<.003){gl_FragColor=vec4(0.);return;}',
    ' vec3 p=ro+rd*(hit?t:mt),n=nor(p),v=-rd;',
    ' vec3 L=normalize(vec3(-.6,.8,.7)),L2=normalize(vec3(.8,-.35,.5));',
    ' float df=max(dot(n,L),0.),fr=pow(1.-max(dot(n,v),0.),2.2),sp=pow(max(dot(reflect(-L,n),v),0.),80.),sp2=pow(max(dot(reflect(-L2,n),v),0.),22.);',
    ' vec3 f=pal(dot(n,v)*.85+n.y*.25+T*.025);f=pow(f,vec3(.85))*1.15;',
    ' vec3 col=vec3(.03,.04,.06)+f*(.34+.5*df)+f*fr*1.6+vec3(1.)*sp*1.05+pal(T*.025+.5)*sp2*.5;',
    ' gl_FragColor=vec4(col,a);}'
  ].join('\n');
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { box.style.display = 'none'; return; }
  gl.useProgram(pr);
  var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['R', 'T', 'C', 'M', 'H'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  function size() { var d = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.25), s = box.clientWidth; cv.width = s * d; cv.height = s * d; gl.viewport(0, 0, cv.width, cv.height); }
  size(); window.addEventListener('resize', size);
  var hero = box.closest('section') || document.body, mx = 0, my = 0, cx = 0, cy = 0, hov = 0, hv = 0, c = 0, vis = true, t0 = performance.now();
  hero.addEventListener('pointermove', function (e) {
    var r = box.getBoundingClientRect();
    mx = Math.max(-1.3, Math.min(1.3, ((e.clientX - r.left) / r.width * 2 - 1) * 1.15));
    my = Math.max(-1.3, Math.min(1.3, -((e.clientY - r.top) / r.height * 2 - 1) * 1.15)); hv = 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { hv = 0; });
  box.addEventListener('click', function () { c = 1; });
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(box);
  function frame(now) {
    if (!reduce) requestAnimationFrame(frame);
    if (!vis && !reduce) return;
    cx += (mx - cx) * .06; cy += (my - cy) * .06; hov += (hv - hov) * .04; c = Math.max(0, c - .012);
    var cc = c * c * (3 - 2 * c);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, reduce ? 4 : (now - t0) / 1000);
    gl.uniform1f(U.C, cc); gl.uniform2f(U.M, cx, cy); gl.uniform1f(U.H, hov);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
})();
