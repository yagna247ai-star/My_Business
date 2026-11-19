'use client';
import { useEffect, useState } from 'react';
import type { Gap } from '@/lib/domain/gaps';

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
      <div className="stack gap-4"><b>🎉 {title} approved!</b><span>{typeof xp === 'number' ? `You earned ${xp} XP for this level. ` : ''}{last ? 'You have finished the whole journey.' : 'The next level is open.'}</span></div>
    </div>
  );
}

/** Missing items, highlighted, each with the small number of points a fix earns. Keeps the learner moving. */
export function GapList({ gaps, avg }: { gaps: Gap[]; avg?: number | null }) {
  const total = gaps.reduce((s, g) => s + g.points, 0);
  return (
    <div className="callout warn gap-card" role="status">
      <div className="stack gap-8" style={{ width: '100%' }}>
        <b>Almost there{typeof avg === 'number' ? ` · ${avg.toFixed(2)} / 5` : ''}. Fix {gaps.length === 1 ? 'this one thing' : `these ${gaps.length} things`} to earn {total} more points.</b>
        <ul className="stack gap-8" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
          {gaps.map((g, i) => (
            <li key={i} className="row gap-8" style={{ alignItems: 'flex-start' }}>
              <span className="badge badge-gold" style={{ whiteSpace: 'nowrap' }}>+{g.points} pts</span>
              <span><b>{g.area}:</b> {g.text}</span>
            </li>
          ))}
        </ul>
        <span className="small">You keep all the XP you already earned. Resubmit when you are ready.</span>
      </div>
    </div>
  );
}
