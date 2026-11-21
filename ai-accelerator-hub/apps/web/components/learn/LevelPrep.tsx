'use client';
/** "Get ready before you start": a short checklist kept on this device, with "I will do this later". */
import { useEffect, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

export function LevelPrep({ code, items }: { code: string; items: { item: string; why?: string }[] }) {
  const t = useT(); const key = `aih_prep_${code}`;
  const [done, setDone] = useState<boolean[]>(items.map(() => false));
  const [later, setLater] = useState(false);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); if (v?.done) setDone(items.map((_, i) => !!v.done[i])); if (v?.later) setLater(true); } catch { /* private mode */ } }, [key, items]);
  const save = (d: boolean[], l: boolean) => { try { localStorage.setItem(key, JSON.stringify({ done: d, later: l })); } catch { /* private mode */ } };
  const n = done.filter(Boolean).length;
  if (later && n < items.length) return <section className="card card-pad"><button type="button" className="btn btn-text btn-sm" onClick={() => { setLater(false); save(done, false); }}><ListChecks size={15} /> {t('Get ready before you start')} ({t('{a} of {b} ready', { a: n, b: items.length })})</button></section>;
  return (
    <section className="card card-pad stack gap-8" aria-labelledby="prepT">
      <h2 className="h3 row gap-8" id="prepT" style={{ margin: 0, alignItems: 'center' }}><ListChecks size={18} aria-hidden="true" />{t('Get ready before you start')}</h2>
      <span className={`badge ${n === items.length ? 'badge-success' : 'badge-gold'}`} style={{ alignSelf: 'flex-start' }}>{t('{a} of {b} ready', { a: n, b: items.length })}</span>
      {items.map((it, i) => (
        <label key={i} className="row gap-8 small" style={{ alignItems: 'flex-start', cursor: 'pointer', paddingTop: 6, borderTop: i ? '1px solid var(--border)' : undefined }}>
          <input type="checkbox" checked={done[i]} onChange={e => { const d = done.map((v, k) => (k === i ? e.target.checked : v)); setDone(d); save(d, later); }} style={{ marginTop: 3, flex: 'none' }} />
          <span><Tv v={it.item} />{it.why && <span className="muted xs" style={{ display: 'block' }}><Tv v={it.why} /></span>}</span>
        </label>
      ))}
      {n < items.length && <button type="button" className="btn btn-text btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setLater(true); save(done, true); }}>{t('I will do this later')}</button>}
    </section>
  );
}
