'use client';
/**
 * The learner's work on a day page: tick each step, upload one screenshot of their own work, and mark the day done
 * (earns points), or skip it (no points; it can be finished later). The page's day navigation leads on.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, ImageUp, SkipForward } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type Props = { code: string; day: number; steps: string[]; state: 'open' | 'done' | 'skipped'; xp: number; dayXp: number; next: { code: string; day: number } | null; levelHref: string };

export function DayWork({ code, day, steps, state: initialState, xp: initialXp, dayXp }: Props) {
  const router = useRouter();
  // Shown at once after a save, before the page refresh arrives.
  const [state, setState] = useState(initialState);
  const [xp, setXp] = useState(initialXp);
  const [ticks, setTicks] = useState<boolean[]>(steps.map(() => state === 'done'));
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const send = async (body: Record<string, unknown>) => {
    const r = await api<{ xp?: number; advanced?: { next: string | null; message: string } | null }>(`/api/v1/levels/${code}/days/${day}`, { body });
    return r;
  };
  const after = (text: string, advanced?: { next: string | null; message: string } | null) => { setMsg(advanced?.message ? `${text} ${advanced.message}` : text); router.refresh(); };

  async function done() {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('entityType', 'level_evidence'); fd.append('entityId', code);
      const up = await fetch('/api/v1/files', { method: 'POST', body: fd, credentials: 'same-origin' });
      const uj = await up.json().catch(() => ({}));
      if (!up.ok) { setErr(uj?.error?.message || uj?.message || 'The screenshot could not be uploaded.'); return; }
      const r = await send({ action: 'done', steps: ticks, fileId: uj.id });
      setState('done'); if (r.xp) setXp(r.xp);
      after(`Day ${day} done${r.xp ? ` · +${r.xp} points` : ''}.`, r.advanced);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not reach the server. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  async function skip() {
    setBusy(true); setErr('');
    try { const r = await send({ action: 'skip' }); setState('skipped'); after(`Day ${day} skipped. No points for now; you can come back and finish it any time.`, r.advanced); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not reach the server. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="card card-pad stack gap-16" style={{ maxWidth: 820, marginTop: 18 }} aria-labelledby="dayWorkTitle">
      <div className="row between wrap gap-8">
        <h2 className="h3" id="dayWorkTitle" style={{ margin: 0 }}>Your work today</h2>
        <span className={`badge ${state === 'done' ? 'badge-success' : state === 'skipped' ? 'badge-neutral' : 'badge-gold'}`}>{state === 'done' ? `Done · +${xp} points` : state === 'skipped' ? 'Skipped · 0 points' : `+${dayXp} points`}</span>
      </div>
      {msg && <p className="callout ok" role="status"><CheckCircle2 size={18} /><span>{msg}</span></p>}
      {state === 'done' && !msg ? <p className="callout ok small"><CheckCircle2 size={16} /><span>You finished this day and your screenshot is saved. You can replace it with a better one below.</span></p> : null}
      {state === 'skipped' && !msg ? <p className="callout info small"><SkipForward size={16} /><span>You skipped this day. Do the steps and upload a screenshot any time to earn its {dayXp} points.</span></p> : null}

      {steps.length > 0 && <fieldset className="stack gap-8" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Tick each step as you finish it</legend>
        {steps.map((s, i) => (
          <label key={i} className="row gap-12 small" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={ticks[i]} disabled={busy} onChange={e => setTicks(t => t.map((v, k) => (k === i ? e.target.checked : v)))} style={{ marginTop: 3, flex: 'none' }} aria-label={`Step ${i + 1}`} />
            <span><b>{i + 1}.</b> {s.replace(/\*\*/g, '').replace(/`/g, '')}</span>
          </label>
        ))}
      </fieldset>}

      <label className="card card-pad row gap-12 wrap" style={{ alignItems: 'center', cursor: 'pointer' }}>
        <ImageUp size={22} aria-hidden="true" />
        <span style={{ flex: 1, minWidth: 200 }}><b>{file ? file.name : 'Upload a screenshot of your work'}</b><span className="muted xs" style={{ display: 'block' }}>For example Excel with your formulas, or your terminal with the query result. PNG, JPG or WebP, at least 640×360. Hide passwords first.</span></span>
        <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Day screenshot" disabled={busy} onChange={e => { const f = e.target.files?.[0] ?? null; setFile(f); setErr(''); if (preview) URL.revokeObjectURL(preview); setPreview(f ? URL.createObjectURL(f) : ''); }} />
      </label>
      {preview && <img src={preview} alt="Preview of your screenshot" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />}
      {err && <p className="field-err" role="alert">{err}</p>}

      <div className="row gap-12 wrap" style={{ alignItems: 'center' }}>
        <button className="btn btn-gold" type="button" disabled={busy || !file || !ticks.every(Boolean)} onClick={done}>{busy ? 'Saving…' : state === 'done' ? 'Replace screenshot' : `Mark Day ${day} done`}</button>
        {state === 'open' && <button className="btn btn-ghost" type="button" disabled={busy} onClick={skip}><SkipForward size={15} /> Skip this day</button>}
      </div>
      {state === 'open' && !msg && <p className="muted xs" style={{ margin: 0 }}>Skipping is fine: you keep going, the day just earns no points until you finish it.</p>}
    </section>
  );
}
