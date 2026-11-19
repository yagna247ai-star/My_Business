'use client';
import { useState } from 'react';

type Stage = { idx: number; title: string };
type Level = { idx: number; code: string; title: string; stageIdx: number; summary: string; xp: number };

const blankLevel = (idx: number): Level => ({ idx, code: `L${String(idx).padStart(2, '0')}_`, title: '', stageIdx: 1, summary: '', xp: 100 });

/** Builder for a custom journey: name it, define stages, then add levels in order. */
export function JourneyBuilder({ onCreated }: { onCreated?: () => void }) {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<Stage[]>([{ idx: 1, title: 'Foundations' }]);
  const [levels, setLevels] = useState<Level[]>([blankLevel(1)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const updateLevel = (i: number, patch: Partial<Level>) => setLevels(ls => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const updateStage = (i: number, patch: Partial<Stage>) => setStages(ss => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErrors({}); setMsg(null);
    try {
      const r = await fetch('/api/v1/admin/journeys', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, title, description: description || undefined, stages, levels: levels.map(l => ({ ...l, summary: l.summary || undefined })) }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErrors(j?.error?.details && typeof j.error.details === 'object' ? j.error.details : {});
        setMsg(j?.error?.message || 'Could not create the journey.');
        return;
      }
      setMsg(`Created "${title}" with ${j.levels} levels. It is unpublished until you publish it.`);
      onCreated?.();
    } catch {
      setMsg('Network error. Nothing was saved.');
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => (errors[k] ? <p className="small" role="alert" style={{ color: '#b42318' }}>{errors[k]}</p> : null);

  return (
    <form onSubmit={submit} className="stack gap-16" aria-label="Journey builder">
      <div className="card card-pad stack gap-12">
        <label className="stack gap-4"><span className="bold">Journey name</span>
          <input className="input" value={title} onChange={e => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} placeholder="e.g. Data Analytics for Shops" maxLength={120} required />
          {err('title')}
        </label>
        <label className="stack gap-4"><span className="bold">Web address (slug)</span>
          <input className="input" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} placeholder="data-analytics-shops" maxLength={40} required />
          <span className="muted xs">Letters, numbers and dashes. Used in links.</span>{err('slug')}
        </label>
        <label className="stack gap-4"><span className="bold">What this journey is for</span>
          <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={2000} />
        </label>
      </div>

      <div className="card card-pad stack gap-12">
        <h2 className="h3">Stages</h2>
        <p className="muted small">A stage groups levels, like a term or a module group. Learners see stages as headings.</p>
        {stages.map((s, i) => (
          <div key={i} className="row gap-8 wrap" style={{ alignItems: 'center' }}>
            <span className="bold">Stage {s.idx}</span>
            <input className="input" aria-label={`Stage ${s.idx} title`} value={s.title} onChange={e => updateStage(i, { title: e.target.value })} maxLength={80} />
            {stages.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStages(ss => ss.filter((_, j) => j !== i).map((x, j) => ({ ...x, idx: j + 1 }))); }}>Remove</button>}
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setStages(ss => [...ss, { idx: ss.length + 1, title: `Stage ${ss.length + 1}` }])} disabled={stages.length >= 10}>Add stage</button>
        {err('form')}
      </div>

      <div className="card card-pad stack gap-12">
        <h2 className="h3">Levels</h2>
        <p className="muted small">Levels are numbered 1, 2, 3… with no gaps. Codes are UPPER_CASE and unique across your institution. Each level gets six activity slots. Their content is written and reviewed separately.</p>
        {levels.map((l, i) => (
          <div key={i} className="card card-pad stack gap-8" style={{ background: 'var(--surface-2, #f7f7fb)' }}>
            <div className="row gap-8 wrap">
              <span className="bold">Level {l.idx}</span>
              <label className="small">Stage <select className="input" value={l.stageIdx} onChange={e => updateLevel(i, { stageIdx: Number(e.target.value) })}>{stages.map(s => <option key={s.idx} value={s.idx}>{s.idx} · {s.title}</option>)}</select></label>
              <label className="small">XP <input className="input" type="number" min={0} max={1000} value={l.xp} onChange={e => updateLevel(i, { xp: Number(e.target.value) })} style={{ width: 90 }} /></label>
              {levels.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLevels(ls => ls.filter((_, j) => j !== i).map((x, j) => ({ ...x, idx: j + 1 })))}>Remove</button>}
            </div>
            <label className="stack gap-4"><span className="small">Title</span><input className="input" value={l.title} onChange={e => updateLevel(i, { title: e.target.value })} maxLength={120} required /></label>
            <label className="stack gap-4"><span className="small">Code</span><input className="input" value={l.code} onChange={e => updateLevel(i, { code: e.target.value.toUpperCase() })} maxLength={40} required /></label>
            <label className="stack gap-4"><span className="small">Short summary (topics, optional)</span><input className="input" value={l.summary} onChange={e => updateLevel(i, { summary: e.target.value })} maxLength={400} /></label>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setLevels(ls => [...ls, blankLevel(ls.length + 1)])} disabled={levels.length >= 15}>Add level</button>
        {err('levels')}
      </div>

      <div className="row gap-12 wrap" style={{ alignItems: 'center' }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create journey'}</button>
        {msg && <span className="small" role="status">{msg}</span>}
      </div>
    </form>
  );
}
