// MOBILE NAV
function toggleMobileNav() {
  document.getElementById('nav-hamburger').classList.toggle('open');
  document.getElementById('mobile-nav-panel').classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('nav-hamburger').classList.remove('open');
  document.getElementById('mobile-nav-panel').classList.remove('open');
}

// FORM
function toggleSubmitState() {
  const btn = document.getElementById('form-submit-btn');
  const consent = document.getElementById('f-consent');
  btn.disabled = !consent.checked;
}

const CONTACT_FORM_WEBHOOK_URL = 'https://n8n.raptorai.ru/webhook/contact-form';
const CONTACT_FORM_WEBHOOK_SECRET = '6f28d42d47e4ef822578b38add66af30c3c4aba234db8eaf';

async function submitForm() {
  const honeypot = document.getElementById('f-website').value.trim();
  if (honeypot) {
    document.getElementById('form-body').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    return;
  }
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const telegram = document.getElementById('f-telegram').value.trim();
  const task = document.getElementById('f-task').value.trim();
  const consent = document.getElementById('f-consent').checked;
  if (!consent) {
    alert('Пожалуйста, подтвердите согласие на обработку данных.');
    return;
  }
  if (!name) {
    alert('Пожалуйста, укажите, как к вам обращаться.');
    return;
  }
  if (!phone && !telegram) {
    alert('Пожалуйста, укажите телефон или Telegram, чтобы мы могли с вами связаться.');
    return;
  }

  const btn = document.getElementById('form-submit-btn');
  btn.disabled = true;
  const originalBtnText = btn.textContent;
  btn.textContent = 'Отправка...';

  try {
    const response = await fetch(CONTACT_FORM_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': CONTACT_FORM_WEBHOOK_SECRET
      },
      body: JSON.stringify({ name, email, phone, telegram, task })
    });
    if (!response.ok) throw new Error('Request failed with status ' + response.status);
    document.getElementById('form-body').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
    if (typeof ym !== 'undefined') {
      ym(112281876, 'reachGoal', 'form_submit');
    }
  } catch (err) {
    alert('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам напрямую.');
    btn.disabled = false;
    btn.textContent = originalBtnText;
  }
}

// SCROLL REVEAL
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.08 });
reveals.forEach(el => observer.observe(el));

// PARTICLES
const canvas = document.getElementById('particles-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  let mouse = { x: W/2, y: H/2 };
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  class P {
    constructor() { this.reset(); }
    reset() { this.x=Math.random()*W; this.y=Math.random()*H; this.vx=(Math.random()-.5)*.4; this.vy=(Math.random()-.5)*.4; this.r=Math.random()*1.5+.5; this.a=Math.random()*.5+.1; }
    update() {
      this.x+=this.vx; this.y+=this.vy;
      const dx=mouse.x-this.x, dy=mouse.y-this.y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){this.x-=dx*.015;this.y-=dy*.015;}
      if(this.x<0||this.x>W||this.y<0||this.y>H)this.reset();
    }
    draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=`rgba(0,212,255,${this.a})`; ctx.fill(); }
  }
  const ps = Array.from({length:100},()=>new P());
  const animate = () => {
    ctx.clearRect(0,0,W,H);
    ps.forEach(p=>{p.update();p.draw();});
    for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){
      const dx=ps[i].x-ps[j].x, dy=ps[i].y-ps[j].y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<100){ctx.beginPath();ctx.moveTo(ps[i].x,ps[i].y);ctx.lineTo(ps[j].x,ps[j].y);ctx.strokeStyle=`rgba(0,212,255,${.12*(1-d/100)})`;ctx.lineWidth=.5;ctx.stroke();}
    }
    requestAnimationFrame(animate);
  };
  animate();
}

// TYPING
const typingEl = document.getElementById('typing-text');
if (typingEl) {
  const phrases = ['ИИ работает за вас.','Автоматизация 24/7.','Экономия часов каждый день.','Агенты которые не спят.'];
  // Первая фраза уже есть в HTML — начинаем с паузы и стирания
  let pi=0, ci=phrases[0].length, del=true;
  const type = () => {
    const phrase = phrases[pi];
    if(!del){ ci++; typingEl.textContent=phrase.slice(0,ci); if(ci===phrase.length){del=true;setTimeout(type,2000);return;} setTimeout(type,60); }
    else { ci--; typingEl.textContent=phrase.slice(0,ci); if(ci===0){del=false;pi=(pi+1)%phrases.length;setTimeout(type,400);return;} setTimeout(type,30); }
  };
  setTimeout(type,2000);
}

// COUNTERS
const counted = {};
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting && !counted[e.target.id]) {
      counted[e.target.id] = true;
      const target = parseInt(e.target.dataset.target);
      const suffix = e.target.dataset.suffix||'';
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now-start)/1800,1);
        const eased = 1-Math.pow(1-p,3);
        e.target.textContent = Math.round(eased*target)+suffix;
        if(p<1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
},{threshold:0.5});
document.querySelectorAll('.stat-num[data-target]').forEach((el,i)=>{ el.id='counter-'+i; counterObs.observe(el); });

// SEASONAL THEME — Новый год (24 дек — 5 янв)
function buildXmasGarland() {
  const el = document.querySelector('.xmas-garland');
  if (!el) return;
  const width = window.innerWidth;
  const height = 34;
  const midY = 10;
  const amp = 9;
  const wavelength = 84;
  const spacing = 42;
  const colors = ['#E14B4B', '#2ECC71', '#3B9EF5', '#F5C400'];
  const waveY = x => midY + amp * Math.sin((x / wavelength) * Math.PI * 2);

  let wire = `M0 ${waveY(0).toFixed(1)}`;
  for (let x = 6; x <= width; x += 6) wire += ` L${x} ${waveY(x).toFixed(1)}`;

  let bulbs = '';
  let i = 0;
  for (let x = spacing / 2; x <= width; x += spacing, i++) {
    const y = waveY(x);
    const color = colors[i % colors.length];
    const delay = (i % 7) * 0.25;
    bulbs += `<circle class="bulb" cx="${x}" cy="${(y + 5).toFixed(1)}" r="4.5" fill="${color}" filter="url(#bulbGlow)" style="animation-delay:${delay}s"></circle>`;
  }

  el.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <defs><filter id="bulbGlow" x="-150%" y="-150%" width="400%" height="400%">
      <feGaussianBlur stdDeviation="2.2" result="blur"></feGaussianBlur>
      <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
    </filter></defs>
    <path d="${wire}" fill="none" stroke="#2A3542" stroke-width="1.5"></path>
    ${bulbs}
  </svg>`;
}
let garlandResizeTimer;
window.addEventListener('resize', () => {
  if (!document.body.classList.contains('theme-newyear')) return;
  clearTimeout(garlandResizeTimer);
  garlandResizeTimer = setTimeout(buildXmasGarland, 200);
});

function applyNewYearTheme() {
  const body = document.body;
  body.classList.add('theme-newyear');
  buildXmasGarland();

  // Меняем логотип на новогоднюю версию (в шапке и футере)
  document.querySelectorAll('img[src="assets/logo.png"]').forEach(img => {
    img.src = 'assets/logo-newyear.png';
  });
  document.getElementById('seasonal-style').textContent = `
    :root {
      --bg: #060C14;
      --bg2: #081018;
      --bg3: #0A1420;
      --cyan: #A8D8FF;
      --cyan-dim: #A8D8FF14;
      --cyan-mid: #A8D8FF44;
      --border: #152030;
      --card: #0A1520;
    }
    .hero::before { background: radial-gradient(circle, #A8D8FF0C 0%, transparent 70%) !important; }
    .hero h1 span { color: #A8D8FF; }
    .section-title span { color: #A8D8FF; }
    .stat-num { color: #A8D8FF; }
    .nav-cta { background: #A8D8FF !important; color: #060C14 !important; }
    .btn-primary { background: #A8D8FF; color: #060C14; }
    .btn-primary:hover { box-shadow: 0 8px 32px #A8D8FF30; }
    .service-card.featured { border-color: #A8D8FF44; }
    .service-card.featured::before { background: linear-gradient(90deg, transparent, #A8D8FF, transparent); }
    .featured-badge { background: #A8D8FF; color: #060C14; }
    .service-icon { background: #A8D8FF14; border-color: #A8D8FF44; }
    .service-icon i { color: #A8D8FF; }
    .why-icon { background: #A8D8FF14; border-color: #A8D8FF44; }
    .why-icon i { color: #A8D8FF; }
    .step-num { border-color: #A8D8FF44; color: #A8D8FF; }
    .stars { color: #A8D8FF; }
    .section-label { color: #A8D8FF; }
    .hero-badge { background: #A8D8FF14; border-color: #A8D8FF44; color: #A8D8FF; }
    .consult-badge { background: #A8D8FF14; border-color: #A8D8FF44; color: #A8D8FF; }
    .form-perk i { color: #A8D8FF; }
    .form-group input:focus, .form-group textarea:focus { border-color: #A8D8FF; box-shadow: 0 0 0 3px #A8D8FF14; }
    .case-tag { background: #A8D8FF14; border-color: #A8D8FF44; color: #A8D8FF; }
    .case-result i { color: #A8D8FF; }
    .nav-links a:hover { color: #A8D8FF; }
    .btn-secondary:hover { border-color: #A8D8FF; color: #A8D8FF; }
    .footer-links a:hover { color: #A8D8FF; }
    .service-card:hover { border-color: #A8D8FF44; }
    .why-card:hover { border-color: #A8D8FF44; }
    .step:hover { border-color: #A8D8FF44; }
    .testimonial-card:hover { border-color: #A8D8FF44; }
    .testimonial-card::before { color: #A8D8FF20; }
  `;

  // Continuous falling snow across the whole site
  const overlay = document.getElementById('seasonal-overlay');
  overlay.innerHTML = '';
  const flakes = ['❄', '❅', '❆'];
  const count = window.innerWidth < 768 ? 35 : 60;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = flakes[Math.floor(Math.random() * flakes.length)];
    el.style.left = (Math.random() * 100) + '%';
    el.style.fontSize = (8 + Math.random() * 16) + 'px';
    el.style.color = '#A8D8FF';
    el.style.opacity = (0.15 + Math.random() * 0.35).toFixed(2);
    el.style.animationDuration = (9 + Math.random() * 12) + 's';
    el.style.animationDelay = (-Math.random() * 20) + 's';
    overlay.appendChild(el);
  }
}

// Активна с 24 декабря по 5 января
const now = new Date();
const month = now.getMonth() + 1;
const day = now.getDate();
const isNewYearPeriod = (month === 12 && day >= 24) || (month === 1 && day <= 5);
if (isNewYearPeriod) applyNewYearTheme();

