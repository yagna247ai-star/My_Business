'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import type { GuideStep } from '@/lib/github/githubCore';

const KEY = 'aihub.githubGuide.v1';

export function GuideChecklist({ steps }: { steps: GuideStep[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* private window: ticks are not kept */ } }, []);
  const toggle = (id: string) => setDone(d => { const n = { ...d, [id]: !d[id] }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* storage blocked */ } return n; });
  const count = steps.filter(s => done[s.id]).length;
  return (
    <div className="stack gap-12">
      <div className="row gap-8" style={{ alignItems: 'center' }}>
        <b>{count} of {steps.length} done</b>
        <div style={{ flex: 1, height: 8, borderRadius: 8, background: 'var(--surface-3)' }} aria-hidden="true"><div style={{ width: `${(count / steps.length) * 100}%`, height: '100%', borderRadius: 8, background: 'var(--success, #1a7f37)' }} /></div>
      </div>
      {steps.map((s, i) => (
        <section key={s.id} id={s.id} className="card card-pad stack gap-8" aria-labelledby={`g-${s.id}`} style={{ opacity: done[s.id] ? 0.75 : 1 }}>
          <div className="row gap-8" style={{ alignItems: 'flex-start' }}>
            <button type="button" className="btn btn-text btn-sm" aria-pressed={!!done[s.id]} aria-label={done[s.id] ? `Mark “${s.title}” not done` : `Mark “${s.title}” done`} onClick={() => toggle(s.id)}>{done[s.id] ? <CheckCircle2 size={22} color="var(--success, #1a7f37)" /> : <Circle size={22} />}</button>
            <div style={{ flex: 1 }}>
              <h2 className="h4" id={`g-${s.id}`}>{i + 1}. {s.title}</h2>
              <p className="muted small">{s.why}</p>
            </div>
          </div>
          <ol className="stack gap-4" style={{ margin: '0 0 0 44px', paddingLeft: 18 }}>{s.steps.map((t, j) => <li key={j} className="small">{t}</li>)}</ol>
          {s.link && <a className="btn btn-soft btn-sm" style={{ alignSelf: 'flex-start', marginLeft: 44 }} href={s.link.href} target="_blank" rel="noopener noreferrer">{s.link.label} <ExternalLink size={12} /></a>}
        </section>
      ))}
    </div>
  );
}
