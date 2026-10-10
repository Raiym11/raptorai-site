import type { NextConfig } from "next";

// Сайт собирается в статику (папка out/) и раздаётся из Yandex Object Storage.
// В режиме export заголовки и rewrites не поддерживаются, поэтому
// Content-Security-Policy задан через <meta> в app/layout.tsx и public/*.html.
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
