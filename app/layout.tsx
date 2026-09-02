import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "欧洲纪行 2026｜国庆文化导览",
  description: "巴黎、意大利、梵蒂冈、巴塞罗那与科隆的离线文化行程导览。",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
