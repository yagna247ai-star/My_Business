'use client';
/**
 * Prompt Studio (docs/AGENT_LAB_PROMPT_STUDIO_SPEC.md): pick a technique → start from a real case →
 * fill a few blanks with live checks → copy the finished prompt. The same checkPrompt runs on the server.
 */
import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Copy, Check, ShieldAlert, Lightbulb, Info } from 'lucide-react';
import { CATEGORIES, TECHNIQUE, TECHNIQUES, buildPrompt, casesFor, checkPrompt, findCase, readSavedPrompt, words, type TechniqueId } from '@/lib/domain/promptTechniques';
import type { Persona } from '@/lib/domain/personalise';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Props = { saved?: unknown; persona?: Persona | null; onSave: (d: unknown) => void; fe: Record<string, string>; busy?: boolean };

export function PromptStudio({ saved, persona, onSave, fe, busy }: Props) {
  const tr = useT();
  const init = readSavedPrompt(saved);
  const [tech, setTech] = useState<TechniqueId>(init?.technique || 'single_shot');
  const [cat, setCat] = useState(TECHNIQUE[init?.technique || 'single_shot'].category);
  const [caseId, setCaseId] = useState<string | null>(init?.caseId ?? null);
  const [fields, setFields] = useState<Record<string, string>>(init?.fields || {});
  const [before, setBefore] = useState(init?.before || '');
  const [spotted, setSpotted] = useState<number | null>(init?.spotted ?? null);
  const [copied, setCopied] = useState(false);

  const t = TECHNIQUE[tech];
  const cases = useMemo(() => casesFor(tech, persona), [tech, persona]);
  const kase = findCase(tech, caseId);
  const chk = checkPrompt(tech, fields, { caseId, spotted });
  const prompt = buildPrompt(tech, fields, caseId);

  const pickTech = (id: TechniqueId) => { if (id === tech) return; setTech(id); setCaseId(null); setFields({}); setBefore(''); setSpotted(null); };
  const pickCase = (id: string | null) => { const c = id ? findCase(tech, id) : null; setCaseId(id); setFields(c ? { ...c.fields } : {}); setBefore(c?.before || ''); setSpotted(null); };
  const copy = async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the text stays selectable */ } };

  return (<div className="stack gap-16">
    <p className="text-2" style={{ margin: 0 }}><Tr>Good prompts follow a pattern. Pick a technique, start from a real example, and change the blanks to fit</Tr> <b><Tr>your</Tr></b> <Tr>project. We check it as you type.</Tr></p>

    {/* 1. Technique */}
    <section className="stack gap-8" aria-labelledby="ps1"><h3 className="h4" id="ps1" style={{ margin: 0 }}><Tr>1. Choose a technique</Tr></h3>
      <div className="ps-tabs" role="tablist" aria-label={tr('Technique categories')}>{CATEGORIES.map(c => <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={`ps-tab${cat === c.id ? ' on' : ''}`} onClick={() => setCat(c.id)}>{c.id === 'security' && <ShieldAlert size={14} aria-hidden="true" />}{c.name}</button>)}</div>
      <p className="muted xs" style={{ margin: 0 }}><Tv v={CATEGORIES.find(c => c.id === cat)?.blurb} /></p>
      <div className="grid2" style={{ gap: 10 }}>{TECHNIQUES.filter(x => x.category === cat).map(x => (
        <label key={x.id} className={`opt ps-tech${tech === x.id ? ' correct' : ''}`} style={{ alignItems: 'flex-start' }}>
          <input type="radio" name="technique" checked={tech === x.id} onChange={() => pickTech(x.id)} />
          <span className="stack gap-4"><b className="small">{x.name}{x.aka && <span className="muted xs" style={{ fontWeight: 400 }}> · <Tv v={x.aka} /></span>}</b><span className="xs text-2"><Tv v={x.oneLine} /></span></span>
        </label>))}</div>
      <div className="ps-when small"><span><b><Tr>Use it for:</Tr></b> {t.when}</span><span><b><Tr>Avoid:</Tr></b> <Tv v={t.avoid} /></span>{t.honesty && <span className="row gap-6" style={{ alignItems: 'flex-start' }}><Info size={14} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} /><span><b><Tr>Be honest about it:</Tr></b> <Tv v={t.honesty} /></span></span>}</div>
    </section>

    {/* 2. Real case */}
    <section className="stack gap-8" aria-labelledby="ps2"><h3 className="h4" id="ps2" style={{ margin: 0 }}><Tr>2. Start from a real case</Tr></h3>
      <div className="row gap-8 wrap">{cases.map(c => <button key={c.id} type="button" className={`chip${caseId === c.id ? ' on' : ''}`} aria-pressed={caseId === c.id} onClick={() => pickCase(c.id)}><Tv v={c.title} />{persona && c.personas.includes(persona) && <span className="badge badge-gold" style={{ marginLeft: 6 }}><Tr>For you</Tr></span>}</button>)}
        <button type="button" className={`chip${caseId === null ? ' on' : ''}`} aria-pressed={caseId === null} onClick={() => pickCase(null)}><Tr>Start blank (my own project)</Tr></button></div>
      <p className="muted xs" style={{ margin: 0 }}><Tr>Picking a case fills the blanks below — then edit them so they describe what you will really build.</Tr></p>
      {kase?.untrusted && <SpotTheAttack lines={kase.untrusted.text} answer={kase.untrusted.attackLine} explain={kase.untrusted.explain} picked={spotted} onPick={setSpotted} err={fe.spot} />}
    </section>

    {/* 3. Fill the blanks */}
    <section className="stack gap-8" aria-labelledby="ps3"><h3 className="h4" id="ps3" style={{ margin: 0 }}><Tr>3. Fill in the blanks</Tr></h3>
      <div className="grid2" style={{ gap: 12 }}>{t.fields.map(f => {
        const r = chk.rules.find(x => x.key === f.key)!; const n = words(fields[f.key]);
        return (<label key={f.key} className="stack gap-4" style={f.rows && f.rows > 3 ? { gridColumn: '1 / -1' } : undefined}>
          <span className="row between gap-8"><b className="small"><Tv v={f.label} /></b><span className={`xs ps-count ${r.ok ? 'ok' : ''}`} aria-live="polite">{r.ok ? <CheckCircle2 size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}{n}/{f.min}<Tr>+ words</Tr></span></span>
          <span className="muted xs"><Tv v={f.hint} /></span>
          <textarea className="input" rows={f.rows || 2} value={fields[f.key] || ''} placeholder={f.placeholder} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} aria-invalid={!r.ok && n > 0} />
          {!r.ok && n > 0 && <span className="xs field-hint"><Tv v={r.msg} /></span>}
          {fe[f.key] && <p className="field-err" role="alert">{fe[f.key]}</p>}
        </label>);
      })}</div>
      <details className="ps-before"><summary className="small"><Tr>Compare with your first, vague prompt (optional)</Tr></summary>
        <input className="input" value={before} onChange={e => setBefore(e.target.value)} placeholder={tr('e.g. make me a website for my shop')} maxLength={300} style={{ marginTop: 6 }} />
        <p className="muted xs" style={{ margin: '4px 0 0' }}><Tr>Seeing the difference is the lesson: the vague version leaves the AI guessing.</Tr></p></details>
    </section>

    {/* Preview */}
    <section className="stack gap-8" aria-labelledby="ps4">
      <div className="row between wrap gap-8"><h3 className="h4" id="ps4" style={{ margin: 0 }}><Tr>Your prompt — paste this into your agent</Tr></h3>
        <button type="button" className="btn btn-outline btn-sm" onClick={copy}>{copied ? <><Check size={14} /><Tr>Copied</Tr></> : <><Copy size={14} /><Tr>Copy prompt</Tr></>}</button></div>
      <pre className="card card-pad small ps-preview">{prompt}</pre>
      <div className="ps-look small"><Lightbulb size={16} aria-hidden="true" /><span><b><Tr>When the answer comes back, check:</Tr></b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{t.lookFor.map(l => <li key={l}><Tv v={l} /></li>)}</ul></span></div>
    </section>

    <div className="stack gap-8">
      <p className="small" style={{ margin: 0 }} aria-live="polite">{chk.ok ? <span className="row gap-6" style={{ color: 'var(--success)' }}><CheckCircle2 size={16} aria-hidden="true" /><b><Tr>Ready — every part is filled in.</Tr></b></span>
        : <><b><Tv v={chk.passed} /> <Tr>of</Tr> {chk.total} <Tr>ready.</Tr></b> <Tr>Still to do:</Tr> {chk.rules.filter(r => !r.ok).map(r => r.label).join(', ')}.</>}</p>
      {fe.before && <p className="field-err" role="alert"><Tv v={fe.before} /></p>}
      <div><button className="btn btn-gold" type="button" disabled={busy || !chk.ok} onClick={() => onSave({ technique: tech, caseId, fields, before, spotted })}><Tr>Save prompt and continue</Tr></button></div>
    </div>
  </div>);
}

function SpotTheAttack({ lines, answer, explain, picked, onPick, err }: { lines: string[]; answer: number; explain: string; picked: number | null; onPick: (i: number) => void; err?: string }) {
  const right = picked === answer;
  return (<div className="ps-attack stack gap-8" role="group" aria-labelledby="atkT">
    <b className="small row gap-6" id="atkT"><ShieldAlert size={16} aria-hidden="true" /><Tr>Spot the attack: this is the outside text your agent will read. Which line is trying to give the agent orders?</Tr></b>
    <ol className="ps-lines">{lines.map((l, i) => <li key={i}><button type="button" className={`ps-line${picked === i ? (right ? ' right' : ' wrong') : ''}`} aria-pressed={picked === i} onClick={() => onPick(i)}><code>{l}</code></button></li>)}</ol>
    {picked !== null && (right ? <p className="callout ok small" style={{ margin: 0 }}><span><b><Tr>Found it.</Tr></b> <Tv v={explain} /> <Tr>Your prompt below tells the agent to treat this text as data and report it.</Tr></span></p>
      : <p className="callout warn small" style={{ margin: 0 }}><Tr>Not that one — that line is normal content for a reader. Look for text that speaks to the AI instead of the human.</Tr></p>)}
    {err && !right && <p className="field-err" role="alert"><Tv v={err} /></p>}
  </div>);
}
