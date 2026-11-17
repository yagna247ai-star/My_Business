import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BANGI — Hermes-Powered Computer-Use Agent",
  description: "Bangi v0.5 — Next.js + Flutter + Gateway — Meta SOM + Hermes 10 skills + 70 tools",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-ink">{children}</body>
    </html>
  );
}
