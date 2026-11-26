/** Pure rules for day-wise study materials (docs/DAY_MATERIALS_SPEC.md). */
import { z } from 'zod';
import { normaliseShareUrl, personalDriveView } from './linkHealthCore';

export const MAX_PER_DAY = 12;
export const KINDS = ['slides', 'doc', 'sheet', 'video', 'folder', 'notebook', 'other'] as const;
export type Kind = typeof KINDS[number];

export function detectKind(raw: string): Kind {
  let u: URL; try { u = new URL(raw); } catch { return 'other'; }
  const h = u.hostname.toLowerCase().replace(/^www\./, ''), p = u.pathname;
  if (h === 'docs.google.com') { if (p.startsWith('/presentation')) return 'slides'; if (p.startsWith('/document')) return 'doc'; if (p.startsWith('/spreadsheets')) return 'sheet'; }
  if (h === 'drive.google.com' && /\/drive\/(u\/\d+\/)?folders\//.test(p)) return 'folder';
  if (h === 'colab.research.google.com') return 'notebook';
  if (/(^|\.)(youtube\.com|youtu\.be|loom\.com|vimeo\.com)$/.test(h)) return 'video';
  return 'other';
}

/** "Make a copy to practise" for Google Docs, Sheets and Slides. */
export function copyUrl(raw: string): string | null {
  const m = /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/.exec(raw);
  return m ? `https://docs.google.com/${m[1]}/d/${m[2]}/copy` : null;
}

export const materialSchema = z.object({
  title: z.string().trim().min(3, 'Give it a title of 3–120 characters.').max(120, 'Give it a title of 3–120 characters.'),
  url: z.string().trim().url('Paste the full link, starting with https://').max(1000),
  kind: z.enum(KINDS).optional(),
  note: z.string().trim().max(300, 'Keep the note under 300 characters.').optional().default(''),
});

/** Why this link cannot be added (before the network check), or null. */
export function materialProblem(raw: string, existing: number): string | null {
  if (existing >= MAX_PER_DAY) return `A day can have at most 12 materials.`;
  let u: URL; try { u = new URL(raw); } catch { return 'Paste the full link, starting with https://'; }
  if (u.protocol !== 'https:') return 'Use an https link.';
  if (personalDriveView(normaliseShareUrl(raw))) return 'This is your own Drive view, which only you can open. Open the file or folder → Share → General access “Anyone with the link” → Copy link, and paste that.';
  return null;
}

/** The same day of the same course in other institutions (docs/DAY_MATERIALS_SPEC.md v1.1). */
export type DayRef = { contentId: string; tenantId: string; journeySlug: string; levelCode: string; day: number };
export const matchingDays = (src: DayRef, all: DayRef[]) => all.filter(d => d.contentId !== src.contentId && d.tenantId !== src.tenantId && d.journeySlug === src.journeySlug && d.levelCode === src.levelCode && d.day === src.day);

/** The journey page's Study materials (v1.2): by level and day; locked levels show only how many are waiting. */
type MatRow = { id: string; levelId: string; day: number; title: string; url: string; kind: string; note: string; sortOrder: number };
export function journeyMaterials(rows: MatRow[], levels: { id: string; idx: number; code: string; title: string; locked: boolean }[]) {
  return [...levels].sort((a, b) => a.idx - b.idx).map(l => {
    const mine = rows.filter(r => r.levelId === l.id);
    if (!mine.length) return null;
    if (l.locked) return { levelId: l.id, idx: l.idx, code: l.code, title: l.title, locked: true, count: mine.length, days: [] as { day: number; items: (MatRow & { copyUrl: string | null })[] }[] };
    const days = [...new Set(mine.map(r => r.day))].sort((a, b) => a - b)
      .map(day => ({ day, items: mine.filter(r => r.day === day).sort((a, b) => a.sortOrder - b.sortOrder).map(r => ({ ...r, copyUrl: copyUrl(r.url) })) }));
    return { levelId: l.id, idx: l.idx, code: l.code, title: l.title, locked: false, count: mine.length, days };
  }).filter((x): x is NonNullable<typeof x> => !!x);
}
