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
  alternates: {
    canonical: "https://www.raptorai.ru",
  },
  openGraph: {
    title: "RaptorAI — Автоматизация бизнеса с ИИ",
    description: "Создаём ИИ-агентов, чат-боты и автоматизации на n8n.",
    url: "https://www.raptorai.ru",
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
