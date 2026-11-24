'use client';
/**
 * The "?" Help button in the top bar: opens a side panel with the Simple Guide sections for the page you are on,
 * a link to the full guide (/help) and the PDF. No browser dialogs; Escape or the X closes it.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Download, HelpCircle, X } from 'lucide-react';
import { Markdown } from '@/components/learn/Markdown';
import { useT } from '@/components/i18n/I18nProvider';
import { helpSectionsFor, SECTION_LINK, sectionAnchor, sectionByNumber } from '@/lib/help/routes';

export const HELP_PDF = '/help/AI_Accelerator_Hub_Simple_Guide.pdf';

export function HelpButton() {
  const t = useT(); const path = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const sections = helpSectionsFor(path).map(sectionByNumber).filter(Boolean) as NonNullable<ReturnType<typeof sectionByNumber>>[];
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (<>
    <button className="icon-btn" type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={t('Help for this page')} title={t('Help for this page')} onClick={() => setOpen(o => !o)}><HelpCircle size={18} /></button>
    {open && <>
      <div onClick={() => setOpen(false)} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,.35)', zIndex: 90 }} />
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="helpT" className="card"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 100vw)', zIndex: 91, borderRadius: 0, overflowY: 'auto', padding: '18px 20px 28px', outline: 'none' }}>
        <div className="row between" style={{ alignItems: 'center', marginBottom: 8 }}>
          <h2 id="helpT" className="h3 row gap-8" style={{ margin: 0, alignItems: 'center' }}><HelpCircle size={18} aria-hidden="true" />{t('Help for this page')}</h2>
          <button className="icon-btn" type="button" aria-label={t('Close help')} onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>{t('From the Simple Guide: everything on this page, explained in plain words.')}</p>
        {sections.map(s => <section key={s.n} aria-labelledby={`h-${s.n}`} style={{ marginTop: 18 }}>
          <h3 id={`h-${s.n}`} className="h3" style={{ marginBottom: 6 }}>{s.n}. {s.title}</h3>
          <Markdown md={s.md} />
          <div className="row gap-12 wrap" style={{ alignItems: 'center' }}><Link className="link small" href={`/help#${sectionAnchor(s.n)}`} onClick={() => setOpen(false)}>{t('Open this section in the full guide')}</Link>{SECTION_LINK[s.n] && !path.startsWith(SECTION_LINK[s.n].href) && <Link className="link small" href={SECTION_LINK[s.n].href} onClick={() => setOpen(false)}>{t(SECTION_LINK[s.n].label)} →</Link>}</div>
        </section>)}
        <div className="row gap-8 wrap" style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <Link className="btn btn-gold btn-sm" href="/help" onClick={() => setOpen(false)}><BookOpen size={14} aria-hidden="true" />{t('Read the full guide')}</Link>
          <a className="btn btn-outline btn-sm" href={HELP_PDF} download><Download size={14} aria-hidden="true" />{t('Download the guide (PDF)')}</a>
        </div>
      </aside>
    </>}
  </>);
}
