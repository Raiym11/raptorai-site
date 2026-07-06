import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "RaptorAI — Автоматизация бизнеса с ИИ",
  description: "Создаём ИИ-агентов, чат-боты и автоматизации на n8n. 57+ проектов, 100% успешных сдач.",
  keywords: "ИИ агент, автоматизация бизнеса, n8n, ChatGPT, Claude, Gemini, чат-бот",
  openGraph: {
    title: "RaptorAI — Автоматизация бизнеса с ИИ",
    description: "Создаём ИИ-агентов, чат-боты и автоматизации на n8n.",
    url: "https://raptorai.ru",
    siteName: "RaptorAI",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </head>
      <body className={`${inter.className} ${mono.variable}`}>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
