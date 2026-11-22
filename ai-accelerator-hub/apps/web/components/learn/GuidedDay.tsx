'use client';
/**
 * A guided day: the task split into steps, one at a time. Each step explains the concept, says exactly what to do,
 * and checks it (tick, written answer, pasted output or screenshot) before awarding its points. Skipping is allowed.
 */
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, CheckCircle2, ImageUp, Lightbulb, LifeBuoy, Lock, SkipForward } from 'lucide-react';
import { Keys, TermBlock } from '@/components/learn/SetupGuide';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';
import { moveOnText } from '@/lib/domain/levelFlowRules';
import { STEP_POINTS, hasOsItems, type GuidedStep, type StepOS, type StepState } from '@/lib/domain/guidedSteps';

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
  // Windows or Mac: only for steps whose actions differ by computer. Remembered on this device.
  const [os, setOs] = useState<StepOS>('windows');
  useEffect(() => { try { const v = localStorage.getItem('aih_os'); setOs(v === 'macos' || v === 'windows' ? v : /Mac/i.test(navigator.platform || navigator.userAgent) ? 'macos' : 'windows'); } catch { /* keep default */ } }, []);
  const pickOs = (v: StepOS) => { setOs(v); try { localStorage.setItem('aih_os', v); } catch { /* fine */ } };
  const anyOs = steps.some(hasOsItems);

  const onSaved = (i: number, st: StepState, advanced: Advanced) => {
    setStates(x => x.map((v, k) => (k === i ? st : v)));
    if (advanced) setMsg(moveOnText(t, advanced.earned, advanced.total, advanced.nextTitle));
    router.refresh();
  };

  return (
    <section id="steps" className="card card-pad stack gap-12" style={{ maxWidth: 860, marginTop: 18, scrollMarginTop: 80 }} aria-labelledby="gdT">
      <div className="row between wrap gap-8" style={{ alignItems: 'center' }}>
        <h2 className="h3" id="gdT" style={{ margin: 0 }}>{t('Your steps today')}</h2>
        <span className="badge badge-gold">{t('{a} of {b} points', { a: earned, b: total })}</span>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={finished} aria-label={t('Steps finished')}><i style={{ width: `${Math.max(2, (finished / steps.length) * 100)}%` }} /></div>
      <p className="muted small" style={{ margin: 0 }}>{t('{a} of {b} steps done. Each step explains the idea, tells you what to do, and checks your work.', { a: done, b: steps.length })}</p>
      {anyOs && <div className="row gap-8 wrap small" role="radiogroup" aria-label={t('Your computer')} style={{ alignItems: 'center' }}><span className="muted">{t('Your computer')}:</span>{(['windows', 'macos'] as const).map(v => <button key={v} type="button" role="radio" aria-checked={os === v} className={`btn btn-sm ${os === v ? 'btn-gold' : 'btn-outline'}`} onClick={() => pickOs(v)}>{v === 'windows' ? 'Windows' : 'Mac'}</button>)}</div>}
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
                  <span className="muted xs" style={{ display: 'block' }}>{st?.s === 'done' ? t('Done · +{xp} points', { xp: st.xp }) : st?.s === 'skipped' ? t('Skipped · 0 points') : t('+{xp} points', { xp: STEP_POINTS[s.check.kind] })}{s.minutes ? ` · ${t('{n} min', { n: s.minutes })}` : ''}</span></span>
              </button>
              {expanded && <StepBody code={code} day={day} i={i} step={s} state={st} isCurrent={isCur} onSaved={onSaved} os={os} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepBody({ code, day, i, step, state, isCurrent, onSaved, os }: { code: string; day: number; i: number; step: GuidedStep; state: StepState | null; isCurrent: boolean; onSaved: (i: number, s: StepState, a: Advanced) => void; os: StepOS }) {
  const t = useT();
  const [text, setText] = useState(state?.answer ?? state?.paste ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
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
      <div className="callout info small" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><Lightbulb size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" /><span><b>{t('Why')}:</b> <Tv v={step.concept} /></span></div>
      <div><b className="small">{t('Do this')}</b><ol className="small" style={{ margin: '6px 0 0', paddingLeft: 22, lineHeight: 1.7, listStyle: 'decimal', display: 'grid', gap: 6 }}>
        {step.do.filter(d => typeof d === 'string' || !d.os || d.os === os).map((d, k) => typeof d === 'string' ? <li key={k}><Tv v={d} /></li>
          : <li key={k}><Tv v={d.text} />{d.keys && <> <Keys keys={d.keys} /></>}{d.cmd && <TermBlock text={d.cmd} lang={d.lang} shell={d.lang === 'ps' ? 'ps' : 'sh'} />}</li>)}
      </ol></div>
      {step.code && <TermBlock text={step.code.text} lang={step.code.lang} />}
      {!!step.see?.length && <div><b className="small">{t('You should see')}</b><div className="stack gap-6" style={{ marginTop: 6 }}>{step.see.map((x, k) => <div key={k} className="small"><Tv v={x.text} />{x.sample && <TermBlock text={x.sample} output label={t('Example of a working result')} />}</div>)}</div></div>}
      {!!step.fix?.length && <details className="stuck-toggle"><summary className="small"><LifeBuoy size={14} aria-hidden="true" /> {t('Stuck? Common problems and fixes')}</summary><ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18, display: 'grid', gap: 8 }}>{step.fix.map((f, k) => <li key={k}><b><Tv v={f.problem} />:</b> <Tv v={f.solution} />{f.cmd && <TermBlock text={f.cmd} lang={f.lang} />}</li>)}</ul></details>}
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
