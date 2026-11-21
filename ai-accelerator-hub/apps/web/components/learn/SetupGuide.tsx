'use client';
/**
 * Visual setup guide building blocks (docs/AGENT_LAB_SETUP_GUIDE_SPEC.md §3):
 * PathRail · GuideCard (why → do → see → if not) · TermBlock · Keys.
 * Progress ticks are a per-viewer convenience kept in localStorage; the server never relies on them.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { LifeBuoy } from 'lucide-react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import type { GuideStep } from '@/lib/domain/setupGuide';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

export function Keys({ keys }: { keys: string[] }) {
  return <span className="row gap-4" style={{ display: 'inline-flex', flexWrap: 'wrap' }} aria-label={keys.join(' + ')}>{keys.map((k, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{i > 0 && <span aria-hidden="true">+</span>}<kbd className="key">{k}</kbd></span>)}</span>;
}

export function TermBlock({ text, shell = 'sh', output = false, label }: { text: string; shell?: 'sh' | 'ps'; output?: boolean; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };
  return (<div className={`guide-term${output ? ' output' : ''}`}>
    <div className="term-bar"><span>{label || (output ? <Tr>Example output</Tr> : shell === 'ps' ? <Tr>PowerShell</Tr> : <Tr>Terminal</Tr>)}</span>{!output && <button type="button" onClick={copy} aria-label={`Copy command: ${text}`}>{copied ? <><Check size={12} /><Tr>Copied</Tr></> : <><Copy size={12} /><Tr>Copy</Tr></>}</button>}</div>
    <pre>{!output && <span className="ps" aria-hidden="true">{shell === 'ps' ? 'PS> ' : '$ '}</span>}{text}</pre>
  </div>);
}

const load = (k: string): string[] => { try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const store = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable: ticks are a convenience only */ } };

export function SetupGuide({ steps, storageKey, os, stuck }: { steps: GuideStep[]; storageKey: string; os: 'macos' | 'windows' | 'linux'; stuck?: (s: GuideStep) => ReactNode }) {
  const t = useT();
  const sh = os === 'windows' ? 'ps' as const : 'sh' as const;
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string[]>([]); // Stuck panels mount (and load help) only when opened.
  useEffect(() => { setDone(load(storageKey)); }, [storageKey]);
  const toggle = (id: string) => setDone(d => { const n = d.includes(id) ? d.filter(x => x !== id) : [...d, id]; store(storageKey, n); return n; });
  const host = (u: string) => { try { return new URL(u).hostname; } catch { return u; } };
  return (<div className="stack gap-12">
    <ol className="guide-rail" aria-label={t('Setup path')}>{steps.map((s, i) => <li key={s.id}>{i > 0 && <span className="arrow" aria-hidden="true">→</span>}<a href={`#guide-${s.id}`} className={`chip${done.includes(s.id) ? ' done' : ''}`}><span className="n">{done.includes(s.id) ? '✓' : i + 1}</span><Tv v={s.title} /></a></li>)}</ol>
    {steps.map((s, i) => { const isDone = done.includes(s.id); return (
      <article key={s.id} id={`guide-${s.id}`} className={`guide-card${isDone ? ' done' : ''}`} aria-labelledby={`gt-${s.id}`}>
        <header><span className="row gap-10" style={{ alignItems: 'center' }}><span className="num" aria-hidden="true">{isDone ? '✓' : i + 1}</span><b id={`gt-${s.id}`}><Tv v={s.title} /></b></span>
          <label className="row gap-8 small"><input type="checkbox" checked={isDone} onChange={() => toggle(s.id)} /><Tr>Done</Tr></label></header>
        <div className="guide-row"><span className="lbl"><Tr>Why</Tr></span><p className="small" style={{ margin: 0 }}><Tv v={s.why} /></p></div>
        {s.do.length > 0 && <div className="guide-row"><span className="lbl"><Tr>Do</Tr></span><ol>{s.do.map((d, j) => <li key={j} className="small"><span><Tv v={d.text} /></span>{d.keys && <> <Keys keys={d.keys} /></>}{d.cmd && <TermBlock text={d.cmd} shell={d.shell || sh} />}</li>)}</ol></div>}
        {s.see.length > 0 && <div className="guide-row"><span className="lbl"><Tr>You should see</Tr></span><div className="stack gap-8">{s.see.map((x, j) => <div key={j} className="small"><span><Tv v={x.text} /></span>{x.cmd && <TermBlock text={x.cmd} shell={sh} />}{x.sample && <TermBlock text={x.sample} output label="Example of a working result" />}</div>)}</div></div>}
        {s.fix.length > 0 && <div className="guide-row"><span className="lbl"><Tr>If not</Tr></span><ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>{s.fix.map((f, j) => <li key={j} className="small"><b><Tv v={f.problem} />:</b> <Tv v={f.solution} />{f.cmd && <TermBlock text={f.cmd} shell={f.shell || sh} />}</li>)}</ul></div>}
        {stuck && <details className="stuck-toggle" onToggle={e => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen(x => o ? [...new Set([...x, s.id])] : x.filter(i => i !== s.id)); }}><summary><LifeBuoy size={14} aria-hidden="true" /><Tr>Stuck on this step? See common errors, find a fix, or ask for help</Tr></summary>{open.includes(s.id) && stuck(s)}</details>}
        <p className="muted xs" style={{ margin: '10px 0 0', textAlign: 'right' }}><Tr>Source:</Tr> {s.source.map((u, j) => <a key={u} className="link" href={u} target="_blank" rel="noopener noreferrer">{j ? ', ' : ''}{host(u)} <ExternalLink size={10} aria-hidden="true" /></a>)}</p>
      </article>); })}
  </div>);
}
