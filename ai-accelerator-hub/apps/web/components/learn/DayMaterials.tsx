'use client';
/** "Materials for today" on a day page (docs/DAY_MATERIALS_SPEC.md): open, make a practice copy, tick Studied / Practised. */
import { useState } from 'react';
import { BookOpen, Copy, ExternalLink, FileSpreadsheet, FileText, Folder, NotebookPen, Presentation, Video } from 'lucide-react';
import { api } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type M = { id: string; title: string; kind: string; note: string; copyUrl: string | null; studied: boolean; practised: boolean; opened: boolean };
const ICON = { slides: Presentation, doc: FileText, sheet: FileSpreadsheet, video: Video, folder: Folder, notebook: NotebookPen, other: BookOpen } as const;
const KIND: Record<string, string> = { slides: 'Slides', doc: 'Document', sheet: 'Sheet', video: 'Video', folder: 'Folder', notebook: 'Notebook', other: 'Link' };

export function DayMaterials({ items: initial }: { items: M[] }) {
  const t = useT();
  const [items, setItems] = useState(initial); const [err, setErr] = useState('');
  const tick = async (id: string, field: 'studied' | 'practised', on: boolean) => {
    setErr(''); setItems(xs => xs.map(x => x.id === id ? { ...x, [field]: on, opened: true } : x));
    try { await api(`/api/v1/materials/${id}/progress`, { method: 'POST', body: { [field]: on } }); }
    catch (e) { setErr((e as Error).message); setItems(xs => xs.map(x => x.id === id ? { ...x, [field]: !on } : x)); }
  };
  const done = items.filter(x => x.studied).length;
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="matT" style={{ marginBottom: 16 }}>
      <div className="row between wrap gap-8"><h2 className="h3" id="matT"><BookOpen size={18} aria-hidden="true" /> {t('Materials for today')}</h2>{items.length > 0 && <span className="muted small">{t('{n} of {m} studied', { n: done, m: items.length })}</span>}</div>
      {!items.length && <p className="muted small">{t('No materials for this day yet.')}</p>}
      {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
      <ul className="stack gap-8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map(m => { const I = ICON[m.kind as keyof typeof ICON] ?? BookOpen; return (
          <li key={m.id} className="mat-row">
            <span className="mat-ic" aria-hidden="true"><I size={18} /></span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b><Tv v={m.title} /></b> <span className="badge badge-neutral xs">{t(KIND[m.kind] ?? 'Link')}</span>
              {m.note && <div className="muted xs"><Tv v={m.note} /></div>}
              <div className="row gap-12 wrap small" style={{ marginTop: 6 }}>
                <label className="row gap-4"><input type="checkbox" checked={m.studied} onChange={e => tick(m.id, 'studied', e.target.checked)} />{t('Studied')}</label>
                <label className="row gap-4"><input type="checkbox" checked={m.practised} onChange={e => tick(m.id, 'practised', e.target.checked)} />{t('Practised')}</label>
              </div>
            </div>
            <div className="row gap-8 wrap" style={{ justifyContent: 'flex-end' }}>
              <a className="btn btn-gold btn-sm" href={`/api/v1/materials/${m.id}/open`} target="_blank" rel="noopener noreferrer" onClick={() => setItems(xs => xs.map(x => x.id === m.id ? { ...x, opened: true } : x))}>{t('Open')} <ExternalLink size={13} aria-hidden="true" /></a>
              {m.copyUrl && <a className="btn btn-soft btn-sm" href={m.copyUrl} target="_blank" rel="noopener noreferrer" title={t('Make your own copy in Google Drive to practise in')}><Copy size={13} aria-hidden="true" /> {t('Copy to practise')}</a>}
            </div>
          </li>); })}
      </ul>
    </section>
  );
}
