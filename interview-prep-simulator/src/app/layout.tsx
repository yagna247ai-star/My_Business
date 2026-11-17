import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architect Interview Prep Simulator",
  description: "Assessment and mock interview simulator for architects, data engineers, and GenAI developers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
