import Link from 'next/link';
import { Lock, CheckCircle2, Clock, Unlock } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { journeyOverview } from '@/lib/domain/journey';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Journey' };
async function Journey() {
  const ctx = await requirePerm('learn:self');
  const { levels } = await journeyOverview(ctx);
  const stages = [...new Map(levels.filter(l => l.stage).map(l => [l.stage!.idx, l.stage!.title])).entries()];
  return (
    <>
      <section className="ph ph-cream"><div style={{ position: 'relative' }}><span className="eyebrow">Your journey</span><h1 id="pageTitle">Six stages. Fifteen levels. One portfolio.</h1><p className="desc">Levels unlock on demonstrated competence — a reviewer approves your proof against a published rubric. Time spent never unlocks a level.</p></div></section>
      {stages.map(([idx, title]) => (
        <section key={idx} style={{ marginBottom: 24 }} aria-labelledby={`st-${idx}`}>
          <h2 className="h3" id={`st-${idx}`} style={{ marginBottom: 10 }}>Stage {idx} · {title}</h2>
          <div className="lv-grid">{levels.filter(l => l.stage?.idx === idx).map(l => {
            const locked = l.state === 'locked';
            const status = l.state === 'approved' ? <><CheckCircle2 size={14} />Approved</> : locked ? <><Lock size={14} />After Level {l.idx - 1} is approved</> : !l.published ? <><Unlock size={14} />Unlocked · content coming</> : <><Clock size={14} />{l.state.replace('_', ' ')}</>;
            const inner = <><span className="code">L{String(l.idx).padStart(2, '0')} · {l.xp} XP</span><span className="nm">{l.title}</span><span className="muted xs">{(l.summary || '').split(' · ').slice(0, 3).join(' · ')}</span><span className="st">{status}</span></>;
            return locked ? <div key={l.idx} className="lv-tile locked" aria-label={`Level ${l.idx} ${l.title}, locked`}>{inner}</div> : <Link key={l.idx} href={`/levels/${l.code}`} className="lv-tile current lift">{inner}</Link>;
          })}</div>
        </section>
      ))}
    </>
  );
}

export default guarded(Journey);
