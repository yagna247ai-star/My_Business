/**
 * Sharing courses, cohorts and the class calendar across institutions (docs/INSTITUTION_SHARING_SPEC.md). Pure.
 * The Super Admin's calendar is the shared plan; an institution keeps only the fields its admin changed.
 */
import type { Block, Calendar } from './cohortCalendar';

const BLOCK_FIELDS = ['label', 'start', 'end', 'mode', 'venue', 'link'] as const;
type BlockField = (typeof BLOCK_FIELDS)[number];
export type Local = {
  startDate?: string; classDays?: number[]; halfDay?: number | null; holidays?: string[];
  blocks?: Record<string, Partial<Pick<Block, BlockField>>>;
  blockList?: Block[]; // a different set of blocks: the institution's whole list
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const keys = (bs: Block[]) => bs.map(b => b.key).join(',');
const norm = (v: unknown) => (v === '' ? null : v ?? null);

/** AC-1: what an institution changed against the shared plan. */
export function localChanges(base: Calendar, edited: Calendar): Local {
  const l: Local = {};
  if (edited.startDate !== base.startDate) l.startDate = edited.startDate;
  if (!same([...edited.classDays].sort(), [...base.classDays].sort())) l.classDays = [...edited.classDays].sort();
  if ((edited.halfDay ?? null) !== (base.halfDay ?? null)) l.halfDay = edited.halfDay ?? null;
  if (!same([...edited.holidays].sort(), [...base.holidays].sort())) l.holidays = [...edited.holidays].sort();
  if (keys(edited.blocks) !== keys(base.blocks)) l.blockList = edited.blocks;
  else {
    const out: NonNullable<Local['blocks']> = {};
    edited.blocks.forEach((b, i) => {
      const d: Partial<Pick<Block, BlockField>> = {};
      for (const f of BLOCK_FIELDS) if (!same(norm(b[f]), norm(base.blocks[i][f]))) (d as Record<string, unknown>)[f] = b[f];
      if (Object.keys(d).length) out[b.key] = d;
    });
    if (Object.keys(out).length) l.blocks = out;
  }
  return l;
}

export const hasLocal = (l: Local | null | undefined) => !!l && Object.keys(l).length > 0;

/** AC-2: the institution's calendar = the shared plan with its own changes on top. */
export function applyLocal(base: Calendar, l: Local | null | undefined): Calendar {
  if (!l) return base;
  return {
    startDate: l.startDate ?? base.startDate,
    classDays: l.classDays ?? base.classDays,
    halfDay: 'halfDay' in l ? l.halfDay ?? null : base.halfDay ?? null,
    holidays: l.holidays ?? base.holidays,
    blocks: l.blockList ?? base.blocks.map(b => ({ ...b, ...(l.blocks?.[b.key] ?? {}) })),
  };
}

/** One line for admins: what differs from the shared plan. */
export function describeLocal(base: Calendar, l: Local | null | undefined): string[] {
  if (!l) return [];
  const out: string[] = [];
  if (l.startDate) out.push(`starts ${l.startDate}`);
  if (l.classDays) out.push('own class days');
  if ('halfDay' in l) out.push('own half day');
  if (l.holidays) out.push('own holidays');
  if (l.blockList) out.push('own blocks');
  for (const b of base.blocks) {
    const d = l.blocks?.[b.key]; if (!d) continue;
    const t = d.start || d.end ? ` ${d.start ?? b.start}–${d.end ?? b.end}` : '';
    const m = d.mode ? ` ${d.mode}` : '';
    out.push(`${d.label ?? b.label}${t}${m}${!t && !m ? ' changed' : ''}`);
  }
  return out;
}

/** AC-3: where a shared cohort goes. */
export function planShare(
  slug: string,
  sourceTenantId: string,
  institutions: { id: string; cohorts: { id: string; slug: string; groupId: string | null }[] }[],
  groupId: string,
) {
  const link: { tenantId: string; cohortId: string }[] = [];
  const create: string[] = [];
  for (const t of institutions) {
    if (t.id === sourceTenantId) continue;
    if (t.cohorts.some(c => c.groupId === groupId)) continue;
    const m = t.cohorts.find(c => c.slug === slug && !c.groupId);
    if (m) link.push({ tenantId: t.id, cohortId: m.id });
    else if (t.cohorts.some(c => c.slug === slug)) continue; // same name but already in another group: leave it
    else create.push(t.id);
  }
  return { link, create };
}

/** AC-8: institutions that do not run a course yet. */
export function missingCourse(slug: string, institutions: { id: string; journeySlugs: string[] }[]) {
  return institutions.filter(t => !t.journeySlugs.includes(slug)).map(t => t.id);
}
