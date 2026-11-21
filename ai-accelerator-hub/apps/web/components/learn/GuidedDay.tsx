'use client';
/**
 * A guided day: the task split into steps, one at a time. Each step explains the concept, says exactly what to do,
 * and checks it (tick, written answer, pasted output or screenshot) before awarding its points. Skipping is allowed.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, CheckCircle2, Copy, ImageUp, Lightbulb, Lock, SkipForward } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';
import { moveOnText } from '@/lib/domain/levelFlowRules';
import { STEP_POINTS, type GuidedStep, type StepState } from '@/lib/domain/guidedSteps';

type Advanced = { earned: number; total: number; nextTitle: string | null } | null;

export function GuidedDay({ code, day, steps, states: initial }: { code: string; day: number; steps: GuidedStep[]; states: (StepState | null)[] }) {
  const router = useRouter(); const t = useT();
  const [states, setStates] = useState<(StepState | null)[]>(steps.map((_, i) => initial[i] ?? null));
  const [msg, setMsg] = useState('');
  const current = states.findIndex(s => !s);
  const done = states.filter(s => s?.s === 'done').length;
  const finished = states.filter(Boolean).length;
  const earned = states.reduce((n, s) => n + (s?.xp ?? 0), 0);
  const total = steps.reduce((n, s) => n + STEP_POINTS[s.check.kind], 0);
  const [open, setOpen] = useState<number | null>(null);

  const onSaved = (i: number, st: StepState, advanced: Advanced) => {
    setStates(x => x.map((v, k) => (k === i ? st : v)));
    if (advanced) setMsg(moveOnText(t, advanced.earned, advanced.total, advanced.nextTitle));
    router.refresh();
  };

  return (
    <section className="card card-pad stack gap-12" style={{ maxWidth: 820, marginTop: 18 }} aria-labelledby="gdT">
      <div className="row between wrap gap-8" style={{ alignItems: 'center' }}>
        <h2 className="h3" id="gdT" style={{ margin: 0 }}>{t('Your steps today')}</h2>
        <span className="badge badge-gold">{t('{a} of {b} points', { a: earned, b: total })}</span>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={finished} aria-label={t('Steps finished')}><i style={{ width: `${Math.max(2, (finished / steps.length) * 100)}%` }} /></div>
      <p className="muted small" style={{ margin: 0 }}>{t('{a} of {b} steps done. Each step explains the idea, tells you what to do, and checks your work.', { a: done, b: steps.length })}</p>
      {msg && <p className="callout ok" role="status"><CheckCircle2 size={18} /><span>{msg}</span></p>}
      {current === -1 && !msg && <p className="callout ok small" role="status"><CheckCircle2 size={16} /><span>{t('You finished every step of this day.')}</span></p>}
      <ol className="stack gap-8" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {steps.map((s, i) => {
          const st = states[i]; const isCur = i === current; const locked = current !== -1 && i > current;
          const expanded = isCur || open === i;
          return (
            <li key={i} className="card" style={{ padding: 0, borderColor: isCur ? 'var(--gold, currentColor)' : undefined, opacity: locked ? 0.6 : 1 }}>
              <button type="button" className="row gap-12" style={{ width: '100%', padding: 12, background: 'none', border: 0, textAlign: 'left', cursor: locked || isCur ? 'default' : 'pointer', alignItems: 'center' }}
                onClick={() => !locked && !isCur && setOpen(open === i ? null : i)} aria-expanded={expanded} disabled={locked}>
                <span className="avatar avatar-sm" aria-hidden="true" style={{ background: st?.s === 'done' ? 'var(--success)' : undefined, color: st?.s === 'done' ? '#fff' : undefined, flex: 'none' }}>{st?.s === 'done' ? <Check size={15} /> : locked ? <Lock size={13} /> : i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}><b><Tv v={s.title} /></b>
                  <span className="muted xs" style={{ display: 'block' }}>{st?.s === 'done' ? t('Done · +{xp} points', { xp: st.xp }) : st?.s === 'skipped' ? t('Skipped · 0 points') : t('+{xp} points', { xp: STEP_POINTS[s.check.kind] })}</span></span>
              </button>
              {expanded && <StepBody code={code} day={day} i={i} step={s} state={st} isCurrent={isCur} onSaved={onSaved} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepBody({ code, day, i, step, state, isCurrent, onSaved }: { code: string; day: number; i: number; step: GuidedStep; state: StepState | null; isCurrent: boolean; onSaved: (i: number, s: StepState, a: Advanced) => void }) {
  const t = useT();
  const [text, setText] = useState(state?.answer ?? state?.paste ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [copied, setCopied] = useState(false);
  const c = step.check;

  const send = async (skip = false) => {
    setBusy(true); setErr('');
    try {
      let fileId: string | undefined;
      if (!skip && c.kind === 'screenshot') {
        if (!file) { setErr(t('Upload a screenshot of your work for this step.')); return; }
        const fd = new FormData(); fd.append('file', file); fd.append('entityType', 'level_evidence'); fd.append('entityId', code);
        const up = await fetch('/api/v1/files', { method: 'POST', body: fd, credentials: 'same-origin' });
        const uj = await up.json().catch(() => ({}));
        if (!up.ok) { setErr(uj?.error?.message || t('The screenshot could not be uploaded.')); return; }
        fileId = uj.id;
      }
      const body = skip ? { skip: true } : c.kind === 'answer' ? { answer: text } : c.kind === 'paste' ? { paste: text } : c.kind === 'screenshot' ? { fileId } : {};
      const r = await api<{ xp: number; advanced: Advanced }>(`/api/v1/levels/${code}/days/${day}/steps/${i}`, { body });
      onSaved(i, { s: skip ? 'skipped' : 'done', xp: r.xp, at: new Date().toISOString() }, r.advanced);
    } catch (e) { setErr(e instanceof ApiError ? e.message : t('Could not reach the server. Try again.')); }
    finally { setBusy(false); }
  };

  return (
    <div className="stack gap-12" style={{ padding: '0 14px 14px' }}>
      <div className="callout info small" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Lightbulb size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" /><span><b>{t('The idea')}:</b> <Tv v={step.concept} /></span></div>
      <div><b className="small">{t('Do this')}</b><ol className="small" style={{ margin: '6px 0 0', paddingLeft: 22, lineHeight: 1.7, listStyle: 'decimal' }}>{step.do.map((x, k) => <li key={k}><Tv v={x} /></li>)}</ol></div>
      {step.code && <div style={{ position: 'relative' }}>
        <pre className="mono" style={{ margin: 0, padding: 12, borderRadius: 10, background: 'var(--surface-3)', overflowX: 'auto', fontSize: 12.5, lineHeight: 1.5, maxHeight: 320 }}><code>{step.code.text}</code></pre>
        <button type="button" className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 6, right: 6 }} onClick={() => { navigator.clipboard?.writeText(step.code!.text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy size={13} aria-hidden="true" />{copied ? t('Copied') : t('Copy')}</button>
      </div>}
      {state?.s === 'done' && !isCurrent ? <p className="callout ok small" style={{ margin: 0 }}><CheckCircle2 size={15} /><span>{t('Done · +{xp} points', { xp: state.xp })}</span></p> : (
        <div className="stack gap-8">
          <b className="small">{t('Check')}: <Tv v={c.prompt} /></b>
          {c.kind === 'tick' && <label className="row gap-8 small" style={{ alignItems: 'center' }}><input type="checkbox" checked={ticked} onChange={e => setTicked(e.target.checked)} disabled={busy} /> {t('I did this')}</label>}
          {c.kind === 'answer' && <textarea className="textarea" rows={4} value={text} onChange={e => setText(e.target.value)} disabled={busy} aria-label={c.prompt} placeholder={c.hint ? t('For example: {hint}', { hint: c.hint }) : undefined} />}
          {c.kind === 'paste' && <><textarea className="textarea mono" rows={4} value={text} onChange={e => setText(e.target.value)} disabled={busy} aria-label={c.prompt} spellCheck={false} />{c.sample && <span className="muted xs">{t('It should look like:')} <code className="mono">{c.sample}</code></span>}</>}
          {c.kind === 'screenshot' && <label className="card card-pad row gap-12 wrap" style={{ alignItems: 'center', cursor: 'pointer', padding: 10 }}><ImageUp size={20} aria-hidden="true" /><span className="small" style={{ flex: 1 }}>{file ? file.name : t('Choose your screenshot (PNG, JPG or WebP)')}</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => setFile(e.target.files?.[0] ?? null)} aria-label={t('Screenshot for this step')} /></label>}
          {err && <p className="field-err" role="alert" style={{ margin: 0 }}>{err}</p>}
          {(isCurrent || state?.s === 'skipped') && <div className="row gap-12 wrap" style={{ alignItems: 'center' }}>
            <button type="button" className="btn btn-gold btn-sm" disabled={busy || (c.kind === 'tick' && !ticked) || ((c.kind === 'answer' || c.kind === 'paste') && !text.trim()) || (c.kind === 'screenshot' && !file)} onClick={() => send(false)}>{busy ? t('Checking…') : c.kind === 'tick' ? t('Mark done') : t('Check and continue')}</button>
            {isCurrent && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => send(true)}><SkipForward size={14} aria-hidden="true" />{t('Skip this step')}</button>}
          </div>}
        </div>
      )}
    </div>
  );
}
