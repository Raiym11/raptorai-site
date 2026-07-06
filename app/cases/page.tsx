import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кейсы — RaptorAI",
  description: "Реальные проекты автоматизации: ИИ-агенты, n8n, RAG системы.",
};

const cases = [
  {
    tag: "ИИ-АГЕНТ / RAG",
    title: "ИИ-консультант для интернет-магазина запчастей",
    client: "Промышленный дистрибьютор",
    stack: ["n8n", "GPT-4o-mini", "Pinecone", "PostgreSQL", "JavaScript"],
    desc: "Построили агента с базой знаний из 13 379 товаров. Агент отвечает на вопросы покупателей, подбирает аналоги и оформляет заявки без участия менеджера.",
    result: "Снижение нагрузки на менеджеров на 70%",
    result2: "13 379 товаров проиндексировано",
    color: "#00D4FF",
  },
  {
    tag: "АВТОМАТИЗАЦИЯ / 1С",
    title: "Автоматическое сопоставление счетов с каталогом 1С",
    client: "Оптовая компания по крепежу",
    stack: ["n8n", "PostgreSQL", "pgvector", "GPT-4o-mini", "1С"],
    desc: "Система парсит входящие счета (PDF, Excel, скан), сопоставляет позиции с базой из 50 000 товаров через ИИ и записывает результат обратно в 1С без ручного ввода.",
    result: "Экономия 4+ часов ежедневно",
    result2: "50 000+ позиций в каталоге",
    color: "#EA4C89",
  },
  {
    tag: "МОНИТОРИНГ / GPT",
    title: "Мониторинг СМИ для аналитического отдела",
    client: "Политическая фракция",
    stack: ["n8n", "GPT-4o-mini", "Telegram API", "Google Sheets", "RSS"],
    desc: "Автоматически отслеживаем 27 источников, GPT фильтрует и ранжирует топ-6 материалов в день, результат приходит в Google Таблицу — без единого ручного действия.",
    result: "27 источников мониторинга",
    result2: "Дайджест каждый день в 9:00",
    color: "#8B5CF6",
  },
  {
    tag: "ОНЛАЙН-ШКОЛА / РАСПИСАНИЕ",
    title: "Автоматизация расписания онлайн-школы",
    client: "Онлайн-школа 20minschool",
    stack: ["n8n", "GPT-4o", "MoiKlass API", "Telegram Bot"],
    desc: "Бот собирает доступность учителей и учеников, GPT парсит свободный текст, автоматически составляет расписание через API МоиКласс и отправляет уведомления.",
    result: "Полная автоматизация составления расписания",
    result2: "Экономия 3+ часов в неделю",
    color: "#10A37F",
  },
  {
    tag: "TELEGRAM БОТ / AI-SMM",
    title: "Автономный AI-SMM бот для автопостинга",
    client: "Маркетинговое агентство",
    stack: ["n8n", "GPT-4o", "Telegram API", "VK API"],
    desc: "Бот автоматически генерирует контент под нишу клиента, создаёт изображения и публикует посты в Telegram и ВКонтакте по расписанию — без участия контент-менеджера.",
    result: "Публикации в 2 соцсети автоматически",
    result2: "Экономия 10+ часов в неделю",
    color: "#2AABEE",
  },
  {
    tag: "CRM / АВТОМАТИЗАЦИЯ ПРОДАЖ",
    title: "ИИ-агент для квалификации лидов в AmoCRM",
    client: "Строительная компания",
    stack: ["n8n", "GPT-4o-mini", "AmoCRM API", "Telegram"],
    desc: "Агент автоматически отвечает на входящие заявки, квалифицирует потенциальных клиентов по критериям компании и переводит горячие лиды на менеджера.",
    result: "Снижение времени квалификации на 80%",
    result2: "Конверсия лидов выросла на 35%",
    color: "#D97757",
  },
];

export default function CasesPage() {
  return (
    <section style={{ padding: "120px 24px 100px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>Кейсы</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px" }}>
          Реальные <span style={{ color: "var(--cyan)" }}>результаты</span>
        </h1>
        <p style={{ fontSize: "17px", color: "var(--gray)", maxWidth: "540px", lineHeight: 1.7, marginBottom: "60px" }}>
          Системы которые мы построили и которые работают прямо сейчас.
        </p>

        <div style={{ display: "grid", gap: "24px" }}>
          {cases.map((c, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "36px", display: "grid", gridTemplateColumns: "1fr auto", gap: "32px", alignItems: "start" }}>
              <div>
                <div style={{ display: "inline-block", background: `${c.color}18`, border: `1px solid ${c.color}44`, color: c.color, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "4px", marginBottom: "16px", fontFamily: "monospace" }}>{c.tag}</div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{c.title}</h2>
                <p style={{ fontSize: "13px", color: c.color, marginBottom: "12px", fontWeight: 500 }}>Клиент: {c.client}</p>
                <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.7, marginBottom: "20px" }}>{c.desc}</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {c.stack.map(s => (
                    <span key={s} style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--gray)", fontSize: "12px", padding: "4px 10px", borderRadius: "4px", fontFamily: "monospace" }}>{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ minWidth: "200px", background: "var(--bg2)", border: `1px solid ${c.color}33`, borderRadius: "10px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: "var(--gray)", marginBottom: "12px", fontWeight: 600 }}>РЕЗУЛЬТАТ</div>
                <div style={{ fontSize: "14px", color: "var(--white)", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <i className="fa-solid fa-arrow-trend-up" style={{ color: c.color }} /> {c.result}
                </div>
                <div style={{ fontSize: "14px", color: "var(--white)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <i className="fa-solid fa-check" style={{ color: c.color }} /> {c.result2}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
