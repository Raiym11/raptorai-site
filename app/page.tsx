"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const services = [
  { name: "ИИ-агент для бизнеса", desc: "Умный агент который отвечает клиентам, квалифицирует лиды и работает 24/7.", price: "от 4 990 ₽", old: "9 900 ₽", icon: "fa-robot", color: "#00D4FF", featured: true },
  { name: "ИИ-агент на базе ChatGPT", desc: "GPT-4o агент с памятью, инструментами и интеграциями под вашу задачу.", price: "от 4 990 ₽", old: "11 990 ₽", icon: "fa-microchip", color: "#10A37F" },
  { name: "ИИ-агент на базе Gemini", desc: "Google Gemini — для больших объёмов данных и многоязычных сценариев.", price: "от 4 990 ₽", old: "9 900 ₽", icon: "fa-google", color: "#4285F4", brand: true },
  { name: "ИИ-агент на базе Claude", desc: "Anthropic Claude — лучший для анализа текстов и сложных документов.", price: "от 4 990 ₽", old: "14 990 ₽", icon: "fa-brain", color: "#D97757" },
  { name: "Автоматизация на n8n", desc: "Связываем CRM, мессенджеры, таблицы и почту в единую систему.", price: "от 4 990 ₽", old: "9 900 ₽", icon: "fa-diagram-project", color: "#EA4C89" },
  { name: "Telegram-бот с ИИ", desc: "Умный бот который консультирует клиентов и принимает заявки 24/7.", price: "от 7 000 ₽", old: "12 990 ₽", icon: "fa-telegram", color: "#2AABEE", brand: true },
];

const stats = [
  { num: 57, suffix: "+", label: "Выполненных проектов" },
  { num: 100, suffix: "%", label: "Успешных сдач" },
  { num: 40, suffix: "%", label: "Повторных клиентов" },
  { num: null, static: "24/7", label: "Работают ваши агенты" },
];

const phrases = ["ИИ работает за вас.", "Автоматизация 24/7.", "Экономия часов каждый день.", "Агенты которые не спят."];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [typed, setTyped] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0]);
  const statsRef = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  // Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let mouse = { x: W / 2, y: H / 2 };

    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    });
    window.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    class P {
      x = Math.random() * W; y = Math.random() * H;
      vx = (Math.random() - 0.5) * 0.4; vy = (Math.random() - 0.5) * 0.4;
      r = Math.random() * 1.5 + 0.5; a = Math.random() * 0.5 + 0.1;
      update() {
        this.x += this.vx; this.y += this.vy;
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) { this.x -= dx * 0.015; this.y -= dy * 0.015; }
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
          this.x = Math.random() * W; this.y = Math.random() * H;
        }
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${this.a})`; ctx.fill();
      }
    }

    const ps = Array.from({ length: 120 }, () => new P());

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.12 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  // Typing
  useEffect(() => {
    const phrase = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (typed.length < phrase.length) {
        timeout = setTimeout(() => setTyped(phrase.slice(0, typed.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setDeleting(true), 2000);
      }
    } else {
      if (typed.length > 0) {
        timeout = setTimeout(() => setTyped(typed.slice(0, -1)), 30);
      } else {
        setDeleting(false);
        setPhraseIdx(i => (i + 1) % phrases.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [typed, deleting, phraseIdx]);

  // Counters
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const targets = [57, 100, 40];
        targets.forEach((target, i) => {
          const start = performance.now();
          const duration = 1800;
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCounts(prev => { const n = [...prev]; n[i] = Math.round(eased * target); return n; });
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }
    }, { threshold: 0.5 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.4 }} />

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--cyan-dim)", border: "1px solid var(--cyan-mid)", color: "var(--cyan)", fontSize: "13px", fontWeight: 500, padding: "6px 16px", borderRadius: "100px", marginBottom: "32px", fontFamily: "monospace" }}>
            <i className="fa-solid fa-bolt" style={{ fontSize: "11px" }} /> Автоматизация нового поколения
          </div>
          <h1 style={{ fontSize: "clamp(36px,6vw,74px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "24px", maxWidth: "920px" }}>
            Ваш бизнес работает.<br />
            <span style={{ color: "var(--cyan)" }}>{typed}</span>
            <span style={{ color: "var(--cyan)", animation: "blink 1s infinite" }}>|</span>
          </h1>
          <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "var(--gray)", maxWidth: "580px", margin: "0 auto 48px", lineHeight: 1.7 }}>
            Создаём умных ИИ-агентов, чат-боты и автоматизации которые экономят часы каждый день — без найма лишних людей.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/services" style={{ background: "var(--cyan)", color: "#000", fontWeight: 700, fontSize: "15px", padding: "14px 32px", borderRadius: "8px", textDecoration: "none" }}>Смотреть услуги</Link>
            <Link href="/contact" style={{ background: "transparent", color: "var(--white)", fontWeight: 600, fontSize: "15px", padding: "14px 32px", borderRadius: "8px", border: "1px solid var(--border)", textDecoration: "none" }}>Получить консультацию</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div ref={statsRef} style={{ display: "flex", justifyContent: "center", gap: "60px", flexWrap: "wrap", padding: "60px 24px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg2)", position: "relative", zIndex: 1 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <span style={{ fontSize: "42px", fontWeight: 900, color: "var(--cyan)", fontFamily: "monospace", display: "block" }}>
              {s.static || `${counts[i]}${s.suffix}`}
            </span>
            <div style={{ fontSize: "13px", color: "var(--gray)", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* SERVICES */}
      <section style={{ padding: "100px 24px", background: "var(--bg2)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>Услуги</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px" }}>Что мы <span style={{ color: "var(--cyan)" }}>автоматизируем</span></h2>
          <p style={{ fontSize: "17px", color: "var(--gray)", maxWidth: "540px", lineHeight: 1.7, marginBottom: "60px" }}>Выберите готовое решение или опишите задачу — предложим оптимальный вариант.</p>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" }}>
            {services.map((s, i) => (
              <div key={i} style={{
                background: s.featured ? "linear-gradient(135deg,#0F1923,#0a1520)" : "var(--card)",
                border: `1px solid ${s.featured ? "var(--cyan-mid)" : "var(--border)"}`,
                borderRadius: "12px", padding: "32px", position: "relative",
                transition: "transform 0.3s, border-color 0.3s",
                animationDelay: `${i * 0.1}s`
              }}>
                {s.featured && <div style={{ position: "absolute", top: "16px", right: "16px", background: "var(--cyan)", color: "#000", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px" }}>ХИТ</div>}
                <div style={{ width: "48px", height: "48px", background: `${s.color}22`, border: `1px solid ${s.color}55`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <i className={`fa-${s.brand ? "brands" : "solid"} fa-${s.icon}`} style={{ color: s.color, fontSize: "20px" }} />
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>{s.name}</div>
                <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.7, marginBottom: "20px" }}>{s.desc}</p>
                <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "var(--cyan)" }}>
                  <span style={{ color: "var(--gray)", fontSize: "13px", textDecoration: "line-through", fontWeight: 400, marginRight: "8px" }}>{s.old}</span>
                  {s.price} <span style={{ fontSize: "13px", color: "var(--gray)", fontWeight: 400 }}>/ проект</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link href="/services" style={{ background: "transparent", color: "var(--cyan)", border: "1px solid var(--cyan-mid)", padding: "12px 32px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Все услуги →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", background: "var(--card)", border: "1px solid var(--cyan-mid)", borderRadius: "16px", padding: "60px 48px", textAlign: "center" }} className="reveal">
          <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 800, marginBottom: "16px" }}>Нужно индивидуальное предложение?</h2>
          <p style={{ color: "var(--gray)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.7 }}>Напишите нам — разберём вашу задачу и предложим решение под ваш бюджет.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "var(--cyan-dim)", border: "1px solid var(--cyan-mid)", color: "var(--cyan)", fontFamily: "monospace", fontSize: "14px", fontWeight: 600, padding: "10px 20px", borderRadius: "8px", marginBottom: "28px" }}>
            <i className="fa-solid fa-headset" /> Консультация — 3 000 ₽
          </div>
          <br /><br />
          <Link href="/contact" style={{ background: "var(--cyan)", color: "#000", fontWeight: 700, fontSize: "16px", padding: "16px 40px", borderRadius: "8px", textDecoration: "none" }}>Написать нам</Link>
        </div>
      </section>
    </>
  );
}
