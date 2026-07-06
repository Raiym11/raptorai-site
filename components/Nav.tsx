"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: "68px",
      background: "rgba(8,11,15,0.9)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)"
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <span style={{ fontSize: "20px", fontWeight: 900, color: "var(--white)", letterSpacing: "-0.02em" }}>
          Raptor<span style={{ color: "var(--cyan)" }}>AI</span>
        </span>
      </Link>

      <ul style={{ display: "flex", gap: "32px", listStyle: "none", alignItems: "center" }}>
        {[
          { href: "/", label: "Главная" },
          { href: "/services", label: "Услуги" },
          { href: "/cases", label: "Кейсы" },
          { href: "/blog", label: "Блог" },
          { href: "/contact", label: "Контакт" },
        ].map(({ href, label }) => (
          <li key={href}>
            <Link href={href} style={{
              color: path === href ? "var(--cyan)" : "var(--gray)",
              textDecoration: "none", fontSize: "14px", fontWeight: 500,
              transition: "color 0.2s"
            }}>{label}</Link>
          </li>
        ))}
        <li>
          <Link href="/contact" style={{
            background: "var(--cyan)", color: "#000",
            padding: "8px 20px", borderRadius: "6px",
            fontWeight: 700, fontSize: "14px", textDecoration: "none"
          }}>Консультация</Link>
        </li>
      </ul>
    </nav>
  );
}
