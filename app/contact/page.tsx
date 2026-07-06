"use client";
import { useState } from "react";
import type { Metadata } from "next";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", surname: "", email: "", phone: "", task: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.name || !form.surname || !form.email || !form.phone) {
      setError("Пожалуйста, заполните все обязательные поля.");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <section style={{ padding: "120px 24px 100px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>

          {/* LEFT */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>Контакт</div>
            <h1 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, lineHeight: 1.2, marginBottom: "20px" }}>
              Нужно <span style={{ color: "var(--cyan)" }}>индивидуальное</span> предложение?
            </h1>
            <p style={{ color: "var(--gray)", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
              Напишите нам — разберём вашу задачу, объясним что реально автоматизировать и предложим решение под ваш бюджет.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "var(--cyan-dim)", border: "1px solid var(--cyan-mid)", color: "var(--cyan)", fontFamily: "monospace", fontSize: "14px", fontWeight: 600, padding: "10px 20px", borderRadius: "8px", marginBottom: "32px" }}>
              <i className="fa-solid fa-headset" /> Консультация — 3 000 ₽
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {["Ответим в течение 2 часов", "Расскажем точную стоимость", "Без навязчивых продаж", "Работаем по всей России и СНГ"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "var(--gray)" }}>
                  <i className="fa-solid fa-check" style={{ color: "var(--cyan)", fontSize: "14px", width: "16px" }} /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT - FORM */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px" }}>
            {!sent ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  {[
                    { id: "name", label: "Имя *", placeholder: "Иван" },
                    { id: "surname", label: "Фамилия *", placeholder: "Иванов" },
                  ].map(f => (
                    <div key={f.id}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--gray)", marginBottom: "8px" }}>{f.label}</label>
                      <input
                        type="text" placeholder={f.placeholder}
                        value={form[f.id as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                        style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", color: "var(--white)", fontSize: "15px", outline: "none" }}
                      />
                    </div>
                  ))}
                </div>
                {[
                  { id: "email", label: "Email *", type: "email", placeholder: "ivan@company.ru" },
                  { id: "phone", label: "Телефон *", type: "tel", placeholder: "+7 900 000 00 00" },
                ].map(f => (
                  <div key={f.id} style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--gray)", marginBottom: "8px" }}>{f.label}</label>
                    <input
                      type={f.type} placeholder={f.placeholder}
                      value={form[f.id as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                      style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", color: "var(--white)", fontSize: "15px", outline: "none" }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--gray)", marginBottom: "8px" }}>Опишите задачу <span style={{ fontWeight: 400 }}>(по желанию)</span></label>
                  <textarea
                    rows={4} placeholder="Например: хочу автоматизировать обработку заявок..."
                    value={form.task}
                    onChange={e => setForm(p => ({ ...p, task: e.target.value }))}
                    style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", color: "var(--white)", fontSize: "15px", outline: "none", resize: "none" }}
                  />
                </div>
                {error && <p style={{ color: "#FF5555", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
                <p style={{ fontSize: "12px", color: "var(--gray)", marginBottom: "20px" }}>
                  <i className="fa-solid fa-lock" style={{ color: "var(--cyan)", marginRight: "6px", fontSize: "11px" }} />
                  Ваши данные в безопасности
                </p>
                <button onClick={submit} style={{ width: "100%", padding: "16px", background: "var(--cyan)", color: "#000", fontWeight: 700, fontSize: "16px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                  Отправить заявку
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: "48px", color: "var(--cyan)", display: "block", marginBottom: "16px" }} />
                <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>Заявка отправлена!</h3>
                <p style={{ color: "var(--gray)", fontSize: "15px" }}>Мы получили ваше сообщение и свяжемся в течение 2 часов.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
