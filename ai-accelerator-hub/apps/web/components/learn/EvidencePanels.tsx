'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Activity panels for domain journeys (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md §3.4–3.5):
 *  - DatasetCheckPanel: upload CSV/XLSX → server validates it against the step's schema → line-by-line report → XP.
 *  - ScreenshotPanel: upload a screenshot for this step + checklist → validated → XP; a reviewer can open it.
 */
import { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, ImageUp, XCircle } from 'lucide-react';

type Act = { idx: number; state: string; xp: number; config: any; data: any };
type Props = { a: Act; code: string; onDone: (msg: string) => void };
type Check = { id: string; label: string; ok: boolean; detail: string };

async function readJson(res: Response) { try { return await res.json(); } catch { return null; } }
const errorOf = (j: any, fallback: string) => j?.error?.message || fallback;

const typeLabel = (c: any) => c.type === 'category' && c.values?.length ? `One of: ${c.values.join(', ')}`
  : c.type === 'integer' || c.type === 'number' ? `${c.type === 'integer' ? 'Whole number' : 'Number'}${c.min !== undefined ? ` ${c.min}` : ''}${c.max !== undefined ? ` to ${c.max}` : ''}`
  : c.type === 'date' ? 'Date (YYYY-MM-DD)' : c.type === 'boolean' ? 'true / false' : 'Text';

export function DatasetCheckPanel({ a, code, onDone }: Props) {
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
    <p style={{ fontSize: 16 }}>{c.instructions}</p>
    {a.state === 'completed' && a.data?.rows && <p className="callout ok small"><CheckCircle2 size={16} /><span>Passed with {a.data.rows} rows ({a.data.filename}). You can upload an improved file any time.</span></p>}
    <div>
      <h3 className="h3" style={{ marginBottom: 8 }}>Expected columns · {c.schema.name} · at least {c.schema.minRows} rows</h3>
      <div className="table-wrap card"><table className="tbl"><caption className="sr-only">Expected columns</caption>
        <thead><tr><th>Column</th><th>Type and allowed values</th><th>Rule</th></tr></thead>
        <tbody>{c.schema.columns.map((col: any) => <tr key={col.name}><td><code>{col.name}</code></td><td className="small">{typeLabel(col)}</td><td className="small">{col.key ? 'Unique key' : col.required === false ? 'Optional' : 'Required'}</td></tr>)}</tbody>
      </table></div>
    </div>
    <label className="card card-pad row gap-12 wrap" style={{ alignItems: 'center', cursor: 'pointer' }}>
      <FileSpreadsheet size={22} aria-hidden="true" />
      <span style={{ flex: 1, minWidth: 200 }}><b>{file ? file.name : 'Choose your CSV or Excel (.xlsx) file'}</b><span className="muted xs" style={{ display: 'block' }}>Max 5 MB, first sheet only. The file is checked and not stored. Use synthetic data only.</span></span>
      <input type="file" accept=".csv,.xlsx" aria-label="Dataset file" onChange={e => { setFile(e.target.files?.[0] ?? null); setRes(null); setErr(''); }} />
    </label>
    {err && <p className="field-err" role="alert">{err}</p>}
    {res?.error && <p className="callout warn small" role="alert">{res.error}</p>}
    {res?.report && <div className="card card-pad stack gap-8" aria-live="polite">
      <div className="row between wrap gap-8"><h3 className="h3">{res.passed ? 'All checks passed' : 'Some checks failed'}</h3><span className="muted small">{res.report.rows} rows · {res.report.columns} columns</span></div>
      <ul className="stack gap-8" style={{ listStyle: 'none', padding: 0, margin: 0 }}>{res.report.checks.map(ch => <li key={ch.id} className="row gap-8" style={{ alignItems: 'flex-start' }}>
        {ch.ok ? <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} aria-label="passed" /> : <XCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-label="failed" />}
        <span><b>{ch.label}</b> <span className="muted small">— {ch.detail}</span></span>
      </li>)}</ul>
      {!res.passed && <p className="muted xs">Fix the file and upload it again. Only a passing file earns XP.</p>}
    </div>}
    <div><button className="btn btn-gold" type="button" disabled={!file || busy} onClick={check}>{busy ? 'Checking…' : a.state === 'completed' ? 'Check again' : 'Check my dataset'}</button></div>
  </div>);
}

export function ScreenshotPanel({ a, code, onDone }: Props) {
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
    {a.state === 'completed' && <p className="callout ok small"><CheckCircle2 size={16} /><span>Accepted ({a.data?.width}×{a.data?.height}). You can replace it with a better screenshot.</span></p>}
    <div><h3 className="h3" style={{ marginBottom: 8 }}>Your screenshot should show</h3><ul className="checklist">{c.shows.map((x: string) => <li key={x}><CheckCircle2 size={16} aria-hidden="true" /><span>{x}</span></li>)}</ul></div>
    <label className="card card-pad row gap-12 wrap" style={{ alignItems: 'center', cursor: 'pointer' }}>
      <ImageUp size={22} aria-hidden="true" />
      <span style={{ flex: 1, minWidth: 200 }}><b>{file ? file.name : 'Choose your screenshot'}</b><span className="muted xs" style={{ display: 'block' }}>PNG, JPG or WebP, at least {c.minWidth}×{c.minHeight} pixels. Hide passwords and access tokens first.</span></span>
      <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Screenshot file" onChange={e => { const f = e.target.files?.[0] ?? null; setFile(f); setErr(''); if (preview) URL.revokeObjectURL(preview); setPreview(f ? URL.createObjectURL(f) : ''); }} />
    </label>
    {preview && <img src={preview} alt="Preview of your screenshot" style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />}
    <fieldset className="stack gap-8" style={{ border: 0, padding: 0 }}><legend className="h3" style={{ marginBottom: 8 }}>Before you submit</legend>
      {c.checklist.map((x: string, i: number) => <label key={x} className="row gap-12 small"><input type="checkbox" checked={ticks[i]} onChange={e => setTicks(t => t.map((v, k) => k === i ? e.target.checked : v))} />{x}</label>)}
    </fieldset>
    {err && <p className="field-err" role="alert">{err}</p>}
    <div><button className="btn btn-gold" type="button" disabled={!file || !ticks.every(Boolean) || busy} onClick={submit}>{busy ? 'Uploading…' : 'Submit screenshot'}</button></div>
  </div>);
}
