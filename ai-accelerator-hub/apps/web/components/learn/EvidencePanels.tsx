'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Activity panels for domain journeys (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md §3.4–3.5):
 *  - DatasetCheckPanel: upload CSV/XLSX → server validates it against the step's schema → line-by-line report → XP.
 *  - ScreenshotPanel: upload a screenshot for this step + checklist → validated → XP; a reviewer can open it.
 */
import { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, ImageUp, XCircle } from 'lucide-react';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Act = { idx: number; state: string; xp: number; config: any; data: any };
type Props = { a: Act; code: string; onDone: (msg: string) => void };
type Check = { id: string; label: string; ok: boolean; detail: string };

async function readJson(res: Response) { try { return await res.json(); } catch { return null; } }
const errorOf = (j: any, fallback: string) => j?.error?.message || fallback;

const typeLabel = (c: any) => c.type === 'category' && c.values?.length ? `One of: ${c.values.join(', ')}`
  : c.type === 'integer' || c.type === 'number' ? `${c.type === 'integer' ? 'Whole number' : 'Number'}${c.min !== undefined ? ` ${c.min}` : ''}${c.max !== undefined ? ` to ${c.max}` : ''}`
  : c.type === 'date' ? 'Date (YYYY-MM-DD)' : c.type === 'boolean' ? 'true / false' : 'Text';

export function DatasetCheckPanel({ a, code, onDone }: Props) {
  const t = useT();
  const c = a.config;
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ passed: boolean; report?: { rows: number; columns: number; checks: Check[] }; error?: string } | null>(null);
  const [err, setErr] = useState('');

  async function check() {
    if (!file) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('idx', String(a.idx));
      const r = await fetch(`/api/v1/levels/${code}/dataset`, { method: 'POST', body: fd, credentials: 'same-origin' });
      const j = await readJson(r);
      if (!r.ok) { setErr(errorOf(j, 'The dataset could not be checked. Try again.')); return; }
      setRes(j);
      if (j.passed && j.first) onDone(`Dataset check passed: ${j.report.rows} rows${j.xp ? ` · +${j.xp} XP` : ''}.`);
    } catch { setErr('Could not reach the server. Check your connection and try again.'); }
    finally { setBusy(false); }
  }

  return (<div className="stack gap-16">
    <p style={{ fontSize: 16 }}><Tv v={c.instructions} /></p>
    {a.state === 'completed' && a.data?.rows && <p className="callout ok small"><CheckCircle2 size={16} /><span><Tr>Passed with</Tr> {a.data.rows} <Tr>rows (</Tr><Tv v={a.data.filename} /><Tr>). You can upload an improved file any time.</Tr></span></p>}
    <div>
      <h3 className="h3" style={{ marginBottom: 8 }}><Tr>Expected columns ·</Tr> {c.schema.name} <Tr>· at least</Tr> <Tv v={c.schema.minRows} /> <Tr>rows</Tr></h3>
      <div className="table-wrap card"><table className="tbl"><caption className="sr-only"><Tr>Expected columns</Tr></caption>
        <thead><tr><th><Tr>Column</Tr></th><th><Tr>Type and allowed values</Tr></th><th><Tr>Rule</Tr></th></tr></thead>
        <tbody>{c.schema.columns.map((col: any) => <tr key={col.name}><td><code>{col.name}</code></td><td className="small">{typeLabel(col)}</td><td className="small">{col.key ? <Tr>Unique key</Tr> : col.required === false ? <Tr>Optional</Tr> : <Tr>Required</Tr>}</td></tr>)}</tbody>
      </table></div>
    </div>
    <label className="card card-pad row gap-12 wrap" style={{ alignItems: 'center', cursor: 'pointer' }}>
      <FileSpreadsheet size={22} aria-hidden="true" />
      <span style={{ flex: 1, minWidth: 200 }}><b>{file ? file.name : <Tr>Choose your CSV or Excel (.xlsx) file</Tr>}</b><span className="muted xs" style={{ display: 'block' }}><Tr>Max 5 MB, first sheet only. The file is checked and not stored. Use synthetic data only.</Tr></span></span>
      <input type="file" accept=".csv,.xlsx" aria-label={t('Dataset file')} onChange={e => { setFile(e.target.files?.[0] ?? null); setRes(null); setErr(''); }} />
    </label>
    {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
    {res?.error && <p className="callout warn small" role="alert"><Tv v={res.error} /></p>}
    {res?.report && <div className="card card-pad stack gap-8" aria-live="polite">
      <div className="row between wrap gap-8"><h3 className="h3">{res.passed ? <Tr>All checks passed</Tr> : <Tr>Some checks failed</Tr>}</h3><span className="muted small">{res.report.rows} <Tr>rows ·</Tr> {res.report.columns} <Tr>columns</Tr></span></div>
      <ul className="stack gap-8" style={{ listStyle: 'none', padding: 0, margin: 0 }}>{res.report.checks.map(ch => <li key={ch.id} className="row gap-8" style={{ alignItems: 'flex-start' }}>
        {ch.ok ? <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} aria-label={t('passed')} /> : <XCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-label={t('failed')} />}
        <span><b><Tv v={ch.label} /></b> <span className="muted small">— <Tv v={ch.detail} /></span></span>
      </li>)}</ul>
      {!res.passed && <p className="muted xs"><Tr>Fix the file and upload it again. Only a passing file earns XP.</Tr></p>}
    </div>}
    <div><button className="btn btn-gold" type="button" disabled={!file || busy} onClick={check}>{busy ? <Tr>Checking…</Tr> : a.state === 'completed' ? <Tr>Check again</Tr> : <Tr>Check my dataset</Tr>}</button></div>
  </div>);
}

export function ScreenshotPanel({ a, code, onDone }: Props) {
  const t = useT();
  const c = a.config;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [ticks, setTicks] = useState<boolean[]>(c.checklist.map(() => false));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('entityType', 'level_evidence'); fd.append('entityId', code);
      const up = await fetch('/api/v1/files', { method: 'POST', body: fd, credentials: 'same-origin' });
      const uj = await readJson(up);
      if (!up.ok) { setErr(errorOf(uj, 'The screenshot could not be uploaded.')); return; }
      const r = await fetch(`/api/v1/levels/${code}/activities/${a.idx}`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileId: uj.id, checklist: ticks }) });
      const j = await readJson(r);
      if (!r.ok) { setErr(errorOf(j, 'The screenshot was not accepted.')); return; }
      if (j.first) onDone(`Screenshot evidence accepted${j.xp ? ` · +${j.xp} XP` : ''}. A reviewer can see it with your proof.`);
      else onDone('Screenshot updated.');
    } catch { setErr('Could not reach the server. Check your connection and try again.'); }
    finally { setBusy(false); }
  }

  return (<div className="stack gap-16">
    {a.state === 'completed' && <p className="callout ok small"><CheckCircle2 size={16} /><span><Tr>Accepted (</Tr>{a.data?.width}×{a.data?.height}<Tr>). You can replace it with a better screenshot.</Tr></span></p>}
    <div><h3 className="h3" style={{ marginBottom: 8 }}><Tr>Your screenshot should show</Tr></h3><ul className="checklist">{c.shows.map((x: string) => <li key={x}><CheckCircle2 size={16} aria-hidden="true" /><span><Tv v={x} /></span></li>)}</ul></div>
    <label className="card card-pad row gap-12 wrap" style={{ alignItems: 'center', cursor: 'pointer' }}>
      <ImageUp size={22} aria-hidden="true" />
      <span style={{ flex: 1, minWidth: 200 }}><b>{file ? file.name : <Tr>Choose your screenshot</Tr>}</b><span className="muted xs" style={{ display: 'block' }}><Tr>PNG, JPG or WebP, at least</Tr> <Tv v={c.minWidth} />×<Tv v={c.minHeight} /> <Tr>pixels. Hide passwords and access tokens first.</Tr></span></span>
      <input type="file" accept="image/png,image/jpeg,image/webp" aria-label={t('Screenshot file')} onChange={e => { const f = e.target.files?.[0] ?? null; setFile(f); setErr(''); if (preview) URL.revokeObjectURL(preview); setPreview(f ? URL.createObjectURL(f) : ''); }} />
    </label>
    {preview && <img src={preview} alt={t('Preview of your screenshot')} style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />}
    <fieldset className="stack gap-8" style={{ border: 0, padding: 0 }}><legend className="h3" style={{ marginBottom: 8 }}><Tr>Before you submit</Tr></legend>
      {c.checklist.map((x: string, i: number) => <label key={x} className="row gap-12 small"><input type="checkbox" checked={ticks[i]} onChange={e => setTicks(t => t.map((v, k) => k === i ? e.target.checked : v))} /><Tv v={x} /></label>)}
    </fieldset>
    {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
    <div><button className="btn btn-gold" type="button" disabled={!file || !ticks.every(Boolean) || busy} onClick={submit}>{busy ? <Tr>Uploading…</Tr> : <Tr>Submit screenshot</Tr>}</button></div>
  </div>);
}
