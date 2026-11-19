import './globals.css';
import type { Metadata, Viewport } from 'next';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
