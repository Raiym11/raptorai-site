import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.raptorai.ru"),
  title: "RaptorAI — Автоматизация бизнеса с ИИ",
  description: "Создаём ИИ-агентов, чат-боты и автоматизации на n8n. 100+ проектов, 100% успешных сдач.",
  keywords: "ИИ агент, автоматизация бизнеса, n8n, ChatGPT, Claude, Gemini, чат-бот",
  icons: {
    icon: "/assets/favicon.png",
  },
  // Страницы app/ — черновая многостраничная версия без навигации, дублирующая главную
  // (public/index.html). Закрыты от индексации, чтобы не конкурировать с основным сайтом.
  robots: { index: false, follow: true },
  openGraph: {
    title: "RaptorAI — Автоматизация бизнеса с ИИ",
    description: "Создаём ИИ-агентов, чат-боты и автоматизации на n8n.",
    url: "https://www.raptorai.ru",
    siteName: "RaptorAI",
    locale: "ru_RU",
    type: "website",
  },
};

// Та же политика, что в <meta> файлов public/*.html
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://n8n.raptorai.ru https://mc.yandex.ru https://mc.yandex.md https://mc.yandex.com https://yandex.ru https://ya.ru wss://mc.yandex.ru",
  "frame-src 'self' https://mc.yandex.ru https://mc.yandex.md",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="stylesheet" href="/vendor/fontawesome/css/all.min.css" />
                <script dangerouslySetInnerHTML={{ __html: `
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=112281876', 'ym');
          ym(112281876, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
        `}} />
        <noscript><div><img src="https://mc.yandex.ru/watch/112281876" style={{position:'absolute', left:'-9999px'}} alt="" /></div></noscript>
      </head>
      <body className={`${inter.className} ${mono.variable}`} style={{ margin: 0, padding: 0 }}>
        <main style={{ margin: 0, padding: 0 }}>{children}</main>
      </body>
    </html>
  );
}
