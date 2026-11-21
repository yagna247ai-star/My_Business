'use client';
import { useEffect, useState } from 'react';
import type { Gap } from '@/lib/domain/gaps';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

const FLOWERS = ['🌸', '🌼', '🌺', '🌷', '💐', '🌻'];

/** A short burst of falling flowers when a level is approved. Respects reduced-motion settings. */
export function FlowerBurst({ title, xp, last = false }: { title: string; xp?: number; last?: boolean }) {
  // Start after the page is interactive, so the burst is seen (not spent while the page loads).
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); const t = setTimeout(() => setShow(false), 6000); return () => clearTimeout(t); }, []);
  return (
    <div className="callout ok celebrate" role="status" aria-live="polite">
      {show && (
        <div className="flower-burst" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 37) % 96}%`, top: `${(i * 23) % 70}%`, animationDelay: `${(i % 7) * 0.15}s`, fontSize: `${18 + (i % 4) * 6}px` }}>{FLOWERS[i % FLOWERS.length]}</span>
          ))}
        </div>
      )}
      <div className="stack gap-4"><b>🎉 <Tv v={title} /> <Tr>approved!</Tr></b><span>{typeof xp === 'number' ? `You earned ${xp} XP for this level. ` : ''}{last ? <Tr>You have finished the whole journey.</Tr> : <Tr>The next level is open.</Tr>}</span></div>
    </div>
  );
}

/** Missing items, highlighted, each with the small number of points a fix earns. Keeps the learner moving. */
export function GapList({ gaps, avg }: { gaps: Gap[]; avg?: number | null }) {
  const total = gaps.reduce((s, g) => s + g.points, 0);
  return (
    <div className="callout warn gap-card" role="status">
      <div className="stack gap-8" style={{ width: '100%' }}>
        <b><Tr>Almost there</Tr>{typeof avg === 'number' ? ` · ${avg.toFixed(2)} / 5` : ''}<Tr>. Fix</Tr> {gaps.length === 1 ? <Tr>this one thing</Tr> : `these ${gaps.length} things`} <Tr>to earn</Tr> {total} <Tr>more points.</Tr></b>
        <ul className="stack gap-8" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {gaps.map((g, i) => (
            <li key={i} className="row gap-8" style={{ alignItems: 'flex-start' }}>
              <span className="badge badge-gold" style={{ whiteSpace: 'nowrap' }}>+<Tv v={g.points} /> <Tr>pts</Tr></span>
              <span><b><Tv v={g.area} />:</b> <Tv v={g.text} /></span>
            </li>
          ))}
        </ul>
        <span className="small"><Tr>You keep all the XP you already earned. Resubmit when you are ready.</Tr></span>
      </div>
    </div>
  );
}
