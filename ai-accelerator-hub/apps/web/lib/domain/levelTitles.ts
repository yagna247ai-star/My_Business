/**
 * Earned titles per course (docs/LEVEL_TITLES_SPEC.md). Pure. The title names the skill the highest approved
 * level proves; stars show how deep into the course it is; the next title is always in view.
 */
export type LevelRef = { idx: number; code: string; title: string };

/** AI-Powered Data Analytics: by level code prefix. */
const DA_TITLES: Record<string, string> = {
  DA01: 'Data Explorer', DA02: 'SQL Data Journalist', DA03: 'Python Coder', DA04: 'Python Data Analytics Specialist',
  DA05: 'Dashboard Storyteller', DA06: 'AI-Powered Analyst', DA07: 'Machine Learning Practitioner', DA08: 'Data Quality Engineer', DA09: 'Industry-Ready Data Analyst',
};
const ROLE = /(Explorer|Builder|Developer|Engineer|Architect|Specialist|Analyst|Coder|Creator|Wizard|Hunter|Hacker|Grandmaster|User|Storyteller|Practitioner|Scientist|Designer|Champion)$/;

export function titleFor(level: LevelRef, totalLevels: number): { title: string; stars: number } {
  const stars = Math.min(5, Math.max(1, Math.ceil((level.idx / Math.max(1, totalLevels)) * 5)));
  const da = DA_TITLES[level.code.slice(0, 4)];
  if (da && level.code.startsWith('DA')) return { title: da, stars };
  const clean = level.title.replace(/^Level\s+\d+\s*[—–:-]\s*/i, '').replace(/:.*$/, '').trim();
  return { title: ROLE.test(clean) ? clean : `${clean} Graduate`, stars };
}

/** The learner's title in a course: the highest approved level counts. */
export function learnerTitle(levels: LevelRef[], approvedIdx: number[]) {
  const sorted = [...levels].sort((a, b) => a.idx - b.idx);
  const total = sorted.length;
  const top = approvedIdx.length ? Math.max(...approvedIdx) : 0;
  const nextLevel = sorted.find(l => l.idx > top) ?? null;
  if (!top || !sorted.some(l => l.idx === top)) {
    const first = sorted[0];
    return { current: first ? `Rising ${titleFor(first, total).title}` : 'Rising learner', stars: 0, next: first ? titleFor(first, total).title : null, levelsToNext: first ? 1 : 0, isMax: false, levelIdx: 0 };
  }
  const cur = titleFor(sorted.find(l => l.idx === top)!, total);
  return { current: cur.title, stars: cur.stars, next: nextLevel ? titleFor(nextLevel, total).title : null, levelsToNext: nextLevel ? nextLevel.idx - top : 0, isMax: !nextLevel, levelIdx: top };
}

export const starsText = (n: number) => (n > 0 ? '★'.repeat(n) : '');

/* ---------- level ribbon (docs/LEVEL_RIBBON_SPEC.md) ---------- */
export type RibbonStatus = 'done' | 'review' | 'changes' | 'current' | 'locked';
const RIBBON_TEXT: Record<RibbonStatus, string> = { done: 'Done', review: 'In review', changes: 'Changes asked', current: 'In progress', locked: 'Locked' };
const ribbonStatus = (state: string): RibbonStatus =>
  state === 'approved' ? 'done' : state === 'submitted' ? 'review' : state === 'needs_changes' ? 'changes' : state === 'locked' ? 'locked' : 'current';

/** Every level as "Level N · title · state", plus how far the line between the dots is filled. */
export function ribbonNodes(levels: (LevelRef & { state: string })[]) {
  const sorted = [...levels].sort((a, b) => a.idx - b.idx);
  const total = sorted.length;
  const nodes = sorted.map(l => {
    const status = ribbonStatus(l.state);
    const title = titleFor(l, total).title;
    return { idx: l.idx, code: l.code, label: `Level ${l.idx}`, title, status, statusText: RIBBON_TEXT[status], aria: `Level ${l.idx} · ${title} · ${RIBBON_TEXT[status]}` };
  });
  const lastDone = nodes.reduce((n, x, i) => (x.status === 'done' ? i + 1 : n), 0);
  return { total, nodes, doneUpTo: lastDone, fillPct: lastDone > 1 && total > 1 ? ((lastDone - 1) / (total - 1)) * 100 : 0 };
}
