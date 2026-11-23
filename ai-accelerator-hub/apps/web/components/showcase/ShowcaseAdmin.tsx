'use client';
/** Admin → Showcase: every project with its status and reports; feature, hide/show, dismiss reports, remove. */
import { useState } from 'react';
import { EyeOff, ExternalLink, Flag, Star } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Item = { id: string; title: string; description: string | null; author: string; link: string | null; at: string; status: 'visible' | 'hidden'; featured: boolean; note: string | null; moderatedAt: string | null; openReports: { id: string; reason: string; at: string }[]; resolvedReports: number };
type Action = 'feature' | 'unfeature' | 'hide' | 'show' | 'dismiss_reports' | 'remove';

export function ShowcaseAdmin({ initial }: { initial: Item[] }) {
  const t = useT();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'reported' | 'hidden' | 'featured'>(initial.some(i => i.openReports.length) ? 'reported' : 'all');
  const shown = items.filter(i => filter === 'all' || (filter === 'reported' ? i.openReports.length > 0 : filter === 'hidden' ? i.status === 'hidden' : i.featured));
  const apply = (id: string, a: Action, reason?: string) => setItems(xs => a === 'remove' ? xs.filter(x => x.id !== id) : xs.map(x => x.id !== id ? x : {
    ...x, featured: a === 'feature' ? true : a === 'unfeature' || a === 'hide' ? false : x.featured,
    status: a === 'hide' ? 'hidden' : a === 'show' ? 'visible' : x.status, note: a === 'hide' ? reason ?? null : a === 'show' ? null : x.note,
    openReports: ['hide', 'show', 'dismiss_reports'].includes(a) ? [] : x.openReports }));
  const count = (f: typeof filter) => items.filter(i => f === 'all' || (f === 'reported' ? i.openReports.length > 0 : f === 'hidden' ? i.status === 'hidden' : i.featured)).length;
  return (<div className="stack gap-12">
    <div className="row gap-8 wrap" role="radiogroup" aria-label={t('Filter')}>{(['reported', 'hidden', 'featured', 'all'] as const).map(f => <button key={f} type="button" role="radio" aria-checked={filter === f} className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-outline'}`} onClick={() => setFilter(f)}>{f === 'reported' ? t('Reported') : f === 'hidden' ? t('Hidden') : f === 'featured' ? t('Featured') : t('All')} ({count(f)})</button>)}</div>
    {shown.length ? shown.map(i => <Row key={i.id} i={i} onDone={apply} />) : <div className="card empty"><p className="text-2">{t('Nothing here.')}</p></div>}
  </div>);
}

function Row({ i, onDone }: { i: Item; onDone: (id: string, a: Action, reason?: string) => void }) {
  const t = useT();
  const [ask, setAsk] = useState<null | 'hide' | 'remove'>(null); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const go = async (a: Action) => {
    setBusy(true); setErr('');
    try { await api(`/api/v1/showcase/${i.id}`, { body: { action: a, reason: a === 'hide' || a === 'remove' ? reason : undefined } }); onDone(i.id, a, reason); setAsk(null); setReason(''); }
    catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };
  return (
    <article className="card card-pad stack gap-8" aria-labelledby={`sa-${i.id}`}>
      <div className="row between wrap gap-8" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row gap-8 wrap">{i.featured && <span className="badge badge-gold"><Star size={12} aria-hidden="true" /> {t('Featured')}</span>}{i.status === 'hidden' ? <span className="badge badge-neutral"><EyeOff size={12} aria-hidden="true" /> {t('Hidden')}</span> : <span className="badge badge-success">{t('Visible')}</span>}{i.openReports.length > 0 && <span className="badge badge-neutral" style={{ color: 'var(--danger, #b42318)' }}><Flag size={12} aria-hidden="true" /> {t('{n} open reports', { n: i.openReports.length })}</span>}</div>
          <h2 className="h3" id={`sa-${i.id}`} style={{ margin: '6px 0 2px' }}><Tv v={i.title} /></h2>
          <p className="muted xs" style={{ margin: 0 }}>{i.author} · {new Date(i.at).toLocaleDateString('en-IN')}{i.resolvedReports ? ` · ${t('{n} earlier reports resolved', { n: i.resolvedReports })}` : ''}</p>
          {i.description && <p className="small text-2" style={{ margin: '6px 0 0' }}><Tv v={i.description} /></p>}
          {i.status === 'hidden' && i.note && <p className="callout warn small" style={{ margin: '6px 0 0' }}>{t('Hidden because')}: {i.note}</p>}
        </div>
        {i.link && <a className="btn btn-outline btn-sm" href={i.link} target="_blank" rel="noopener noreferrer nofollow">{t('Open project')} <ExternalLink size={13} /></a>}
      </div>
      {i.openReports.length > 0 && <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{i.openReports.map(r => <li key={r.id}>“{r.reason}” <span className="muted xs">· {new Date(r.at).toLocaleDateString('en-IN')}</span></li>)}</ul>}
      {ask ? <div className="stack gap-6">
          <label className="small" htmlFor={`why-${i.id}`}>{ask === 'hide' ? t('Why are you hiding it? The author sees this.') : t('Why are you removing it? The author sees this.')}</label>
          <textarea id={`why-${i.id}`} className="textarea" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder={t('For example: the link asks for access. Share it as “Anyone with the link”.')} />
          <div className="row gap-8"><button type="button" className={`btn btn-sm ${ask === 'remove' ? 'btn-danger' : 'btn-outline'}`} disabled={busy || reason.trim().length < 5} onClick={() => go(ask)}>{ask === 'hide' ? t('Hide project') : t('Remove project')}</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => { setAsk(null); setReason(''); }}>{t('Cancel')}</button></div>
        </div>
        : <div className="row gap-8 wrap">
          {i.status === 'visible' && (i.featured ? <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => go('unfeature')}>{t('Unfeature')}</button> : <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => go('feature')}><Star size={13} aria-hidden="true" />{t('Feature')}</button>)}
          {i.status === 'visible' ? <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => setAsk('hide')}><EyeOff size={13} aria-hidden="true" />{t('Hide')}</button> : <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => go('show')}>{t('Show again')}</button>}
          {i.openReports.length > 0 && <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => go('dismiss_reports')}>{t('Dismiss reports (keep it)')}</button>}
          <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setAsk('remove')}>{t('Remove')}</button>
        </div>}
      {err && <p className="field-err" role="alert" style={{ margin: 0 }}>{err}</p>}
    </article>
  );
}
