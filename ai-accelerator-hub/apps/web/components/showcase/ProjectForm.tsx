'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { Field } from '@/components/settings/ui';

type Init = { id?: string; title: string; problem: string; solution: string; tech: string[]; links: { url: string; label: string }[] };
const EMPTY: Init = { title: '', problem: '', solution: '', tech: [], links: [] };

export function ProjectForm({ initial = EMPTY }: { initial?: Init }) {
  const router = useRouter();
  const [f, setF] = useState(initial); const [techText, setTechText] = useState(initial.tech.join(', '));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [fe, setFe] = useState<Record<string, string>>({});
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErr(''); setFe({});
    const body = { ...f, tech: techText.split(',').map(t => t.trim()).filter(Boolean), links: f.links.filter(l => l.url.trim()) };
    try {
      if (f.id) { await api(`/api/v1/projects/${f.id}`, { method: 'PATCH', body }); router.push(`/showcase/${f.id}`); }
      else { const r = await api<{ id: string }>('/api/v1/projects', { method: 'POST', body }); router.push(`/showcase/${r.id}`); }
      router.refresh();
    } catch (x) { const a = x as ApiError; setErr(a.message); setFe(a.details || {}); setBusy(false); }
  };
  return (
    <form className="card card-pad stack gap-16" onSubmit={save} aria-busy={busy}>
      <Field label="Project title" error={fe.title} hint="4–90 characters, e.g. Weekly Sales Insight Dashboard"><input className="input" required minLength={4} maxLength={90} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="The problem" error={fe.problem} hint="Who has the problem, and why it matters (30–1,000 characters)."><textarea className="textarea" rows={4} required minLength={30} maxLength={1000} value={f.problem} onChange={e => setF({ ...f, problem: e.target.value })} /></Field>
      <Field label="Your solution" error={fe.solution} hint="What you will build and how it solves the problem (30–1,000 characters)."><textarea className="textarea" rows={4} required minLength={30} maxLength={1000} value={f.solution} onChange={e => setF({ ...f, solution: e.target.value })} /></Field>
      <Field label="Built with" error={fe.tech} hint="Tools and languages, separated by commas (up to 12): Python, SQL, Power BI"><input className="input" value={techText} onChange={e => setTechText(e.target.value)} /></Field>
      <fieldset className="stack gap-8" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Links (Drive, Docs, slides, demo video): optional, up to 6</legend>
        <p className="muted xs">Each link must open for anyone: in Drive or Docs use Share → General access → “Anyone with the link” → Viewer, then Copy link.</p>
        {f.links.map((l, i) => <div key={i} className="row gap-8">
          <input className="input" style={{ maxWidth: 160 }} placeholder="Label (Slides)" aria-label={`Link ${i + 1} label`} maxLength={60} value={l.label} onChange={e => setF({ ...f, links: f.links.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
          <input className="input" type="url" placeholder="https://drive.google.com/…" aria-label={`Link ${i + 1} address`} maxLength={500} value={l.url} onChange={e => setF({ ...f, links: f.links.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} />
          <button type="button" className="btn btn-text btn-sm" aria-label={`Remove link ${i + 1}`} onClick={() => setF({ ...f, links: f.links.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
        </div>)}
        {fe.links && <p className="field-err">{fe.links}</p>}
        {f.links.length < 6 && <button type="button" className="btn btn-soft btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setF({ ...f, links: [...f.links, { url: '', label: '' }] })}><Plus size={14} />Add a link</button>}
      </fieldset>
      {err && <p className="callout warn small" role="alert">{err}</p>}
      <div className="actions"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Checking links and saving…' : f.id ? 'Save changes' : 'Define project'}</button></div>
    </form>
  );
}
