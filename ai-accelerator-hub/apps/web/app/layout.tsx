import './globals.css';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

// One type system for every theme. The font files live in app/fonts (SIL OFL, see LICENSES.txt), so builds and
// pages never call Google: no build failure when Google is unreachable, no font flash, no layout shift.
// Inter: body and UI, very readable at small sizes. Plus Jakarta Sans: headings. JetBrains Mono: code.
const sans = localFont({ src: './fonts/inter.woff2', weight: '100 900', display: 'swap', variable: '--font-sans' });
const display = localFont({ src: './fonts/plus-jakarta-sans.woff2', weight: '200 800', display: 'swap', variable: '--font-display' });
const code = localFont({ src: './fonts/jetbrains-mono.woff2', weight: '100 800', display: 'swap', variable: '--font-code' });

export const metadata: Metadata = {
  title: { default: 'AI Accelerator Hub', template: '%s · AI Accelerator Hub' },
  description: 'Learn AI. Build Solutions. Become Future-Ready. A competence-based GenAI learning, hackathon and career platform.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#081830', width: 'device-width', initialScale: 1 };

// Resolve the theme before first paint (no flash). Stored choice → OS preference.
// Same for the collapsed sidebar, so it never flashes open and then snaps shut on page load.
const themeScript = `(function(){var h=document.documentElement;try{var t=localStorage.getItem('aih_theme')||'system';if(t==='sln'){h.setAttribute('data-theme','sln');}else{var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);h.setAttribute('data-theme',d?'dark':'light')}}catch(e){h.setAttribute('data-theme','light')}try{if(localStorage.getItem('aih_sidebar')==='rail')h.setAttribute('data-sidebar','rail')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${code.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
