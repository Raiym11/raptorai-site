import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--bg)", borderTop: "1px solid var(--border)",
      padding: "48px 24px 32px"
    }}>
      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "24px"
      }}>
        <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--white)" }}>
          Raptor<span style={{ color: "var(--cyan)" }}>AI</span>
        </span>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { href: "/services", label: "Услуги" },
            { href: "/cases", label: "Кейсы" },
            { href: "/blog", label: "Блог" },
            { href: "/contact", label: "Контакт" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              color: "var(--gray)", fontSize: "13px",
              textDecoration: "none"
            }}>{label}</Link>
          ))}
        </div>
        <p style={{ color: "var(--gray)", fontSize: "13px" }}>
          © 2026 RaptorAI. Автоматизация с ИИ.
        </p>
      </div>
    </footer>
  );
}
