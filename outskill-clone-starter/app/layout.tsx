import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outskill · Learning portal",
  description:
    "A practical AI learning space: a guided path, short lessons, workbooks and projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
