import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: 'var(--bg)' }}>
      <div className="card card-pad" style={{ width: 'min(100%, 460px)' }}>
        <div className="row gap-12" style={{ marginBottom: 18 }}>
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 4 21h8z" fill="#3878F6" /><path d="M12 4l8 17h-8z" fill="#8658E8" /><circle cx="12" cy="3.6" r="2.2" fill="#E8B94F" /></svg>
          <div><div className="bold"><Tr>AI Accelerator Hub</Tr></div><div className="muted xs"><Tr>Learn AI. Build Solutions. Become Future-Ready.</Tr></div></div>
          <LanguageSwitcher />
        </div>
        <h1 className="h2"><Tv v={title} /></h1>
        <p className="text-2 small" style={{ marginTop: 4 }}><Tv v={subtitle} /></p>
        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
}
