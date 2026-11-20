import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

// One type system for every theme, bundled with the app (no request to Google at runtime, no font swap flash).
// Inter: body and UI, very readable at small sizes. Plus Jakarta Sans: headings. JetBrains Mono: code.
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], display: 'swap', variable: '--font-display' });
const code = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-code' });

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
