/** The row of levels: "Level 1 · Data Explorer · Done" for every level of the learner's course (docs/LEVEL_RIBBON_SPEC.md). */
import Link from 'next/link';
import { Check, Lock } from 'lucide-react';
import { ribbonNodes } from '@/lib/domain/levelTitles';
import { getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export async function LevelRibbon({ levels }: { levels: { idx: number; code: string; title: string; state: string }[] }) {
  const t = await getT();
  const r = ribbonNodes(levels);
  const text = { done: t('Done'), review: t('In review'), changes: t('Changes asked'), current: t('In progress'), locked: t('Locked') };
  return (
    <div className="rail-scroll" tabIndex={0} aria-label={t('Journey levels, scroll sideways')}>
      <ol className="jrail" style={{ listStyle: 'none', margin: 0, minWidth: Math.max(600, r.total * 118), ['--fill' as string]: r.fillPct / 100 }}>
        {r.nodes.map(n => {
          const dot = n.status === 'done' ? <Check size={18} aria-hidden="true" /> : n.status === 'locked' ? <Lock size={15} aria-hidden="true" /> : String(n.idx).padStart(2, '0');
          const aria = `${t('Level {n}', { n: n.idx })} · ${n.title} · ${text[n.status]}`;
          return (
            <li key={n.idx} className={`jnode ${n.status}`}>
              {n.status === 'locked'
                ? <span className="jdot" role="img" aria-label={aria}>{dot}</span>
                : <Link className="jdot" href={`/levels/${n.code}`} aria-label={aria}>{dot}</Link>}
              <span className="jlv">{t('Level {n}', { n: n.idx })}</span>
              <span className="jl"><Tv v={n.title} /></span>
              <span className={`jst ${n.status}`}>{text[n.status]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
