import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Услуги — RaptorAI",
  description: "ИИ-агенты, автоматизация на n8n, Telegram-боты и интеграции для бизнеса.",
};

const services = [
  { name: "ИИ-агент для бизнеса", desc: "Умный агент который отвечает клиентам, квалифицирует лиды, обрабатывает заявки и интегрируется в вашу CRM — работает 24/7 без выходных.", price: "от 4 990 ₽", old: "9 900 ₽", icon: "fa-robot", color: "#00D4FF", featured: true, details: ["Интеграция с CRM (AmoCRM, Bitrix24)", "Память и контекст разговора", "Квалификация лидов по вашим критериям", "Уведомления о заявках в Telegram", "Деплой на ваш или наш сервер"] },
  { name: "ИИ-агент на базе ChatGPT", desc: "Настраиваем мощного агента на основе GPT-4o с памятью, инструментами и интеграциями под вашу конкретную задачу.", price: "от 4 990 ₽", old: "11 990 ₽", icon: "fa-microchip", color: "#10A37F", details: ["GPT-4o — самая умная модель OpenAI", "Инструменты: поиск, калькулятор, API", "Структурированные ответы (JSON)", "Интеграция с вашими данными через RAG"] },
  { name: "ИИ-агент на базе Gemini", desc: "Агент на Google Gemini — отличный выбор для работы с большими объёмами данных, документами и многоязычными сценариями.", price: "от 4 990 ₽", old: "9 900 ₽", icon: "fa-google", color: "#4285F4", brand: true, details: ["Большое контекстное окно (1M токенов)", "Отличная работа с документами", "Многоязычность из коробки", "Интеграция с Google Workspace"] },
  { name: "ИИ-агент на базе Claude", desc: "Агент на Anthropic Claude — лучший выбор для сложного анализа текстов, юридических и финансовых документов.", price: "от 4 990 ₽", old: "14 990 ₽", icon: "fa-brain", color: "#D97757", details: ["Лучший для анализа длинных текстов", "Безопасность и предсказуемость ответов", "Идеален для юридических/финансовых задач", "Минимум галлюцинаций"] },
  { name: "Автоматизация на n8n", desc: "Связываем ваши приложения и сервисы в единую систему: CRM, мессенджеры, таблицы, почта — всё работает само.", price: "от 4 990 ₽", old: "9 900 ₽", icon: "fa-diagram-project", color: "#EA4C89", details: ["500+ готовых интеграций", "Условная логика и ветвления", "Обработка ошибок и повторы", "Self-hosted — ваши данные у вас"] },
  { name: "Telegram-бот с ИИ", desc: "Умный бот в Telegram который консультирует клиентов, принимает заявки и уведомляет вас — всё в одном канале.", price: "от 7 000 ₽", old: "12 990 ₽", icon: "fa-telegram", color: "#2AABEE", brand: true, details: ["Ответы на вопросы клиентов 24/7", "Приём заявок и квалификация", "Меню, кнопки, интерактив", "Уведомления администратору"] },
  { name: "RAG — База знаний для агента", desc: "Подключаем агента к вашим документам, каталогу товаров или базе знаний — агент отвечает на основе ваших данных.", price: "от 8 000 ₽", old: "15 990 ₽", icon: "fa-database", color: "#8B5CF6", details: ["Индексация PDF, Word, Excel, сайтов", "Векторный поиск (Pinecone/pgvector)", "Точные ответы на основе ваших данных", "Автообновление при изменении данных"] },
  { name: "Консультация", desc: "Разберём вашу задачу, предложим оптимальное решение и назовём точную стоимость. Без навязчивых продаж.", price: "3 000 ₽", old: "5 000 ₽", icon: "fa-headset", color: "#00D4FF", details: ["1 час созвона или переписки", "Анализ ваших процессов", "Техническое задание в подарок", "Зачитывается при заказе проекта"] },
];

export default function ServicesPage() {
  return (
    <section style={{ padding: "120px 24px 100px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>Услуги</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px" }}>
          Что мы <span style={{ color: "var(--cyan)" }}>автоматизируем</span>
        </h1>
        <p style={{ fontSize: "17px", color: "var(--gray)", maxWidth: "540px", lineHeight: 1.7, marginBottom: "60px" }}>
          Готовые решения или индивидуальная разработка — под любой бюджет и задачу.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "24px" }}>
          {services.map((s, i) => (
            <div key={i} style={{
              background: s.featured ? "linear-gradient(135deg,#0F1923,#0a1520)" : "var(--card)",
              border: `1px solid ${s.featured ? "var(--cyan-mid)" : "var(--border)"}`,
              borderRadius: "12px", padding: "32px", position: "relative"
            }}>
              {s.featured && <div style={{ position: "absolute", top: "16px", right: "16px", background: "var(--cyan)", color: "#000", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px" }}>ХИТ</div>}
              <div style={{ width: "48px", height: "48px", background: `${s.color}22`, border: `1px solid ${s.color}55`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <i className={`fa-${(s as any).brand ? "brands" : "solid"} fa-${s.icon}`} style={{ color: s.color, fontSize: "20px" }} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>{s.name}</div>
              <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.7, marginBottom: "20px" }}>{s.desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "24px" }}>
                {s.details.map((d, j) => (
                  <li key={j} style={{ fontSize: "13px", color: "var(--gray)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <i className="fa-solid fa-check" style={{ color: "var(--cyan)", fontSize: "11px" }} /> {d}
                  </li>
                ))}
              </ul>
              <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "var(--cyan)", marginBottom: "20px" }}>
                <span style={{ color: "var(--gray)", fontSize: "13px", textDecoration: "line-through", fontWeight: 400, marginRight: "8px" }}>{s.old}</span>
                {s.price}
              </div>
              <Link href="/contact" style={{ display: "block", textAlign: "center", background: s.featured ? "var(--cyan)" : "transparent", color: s.featured ? "#000" : "var(--cyan)", border: `1px solid ${s.featured ? "var(--cyan)" : "var(--cyan-mid)"}`, padding: "10px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
                Заказать
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
