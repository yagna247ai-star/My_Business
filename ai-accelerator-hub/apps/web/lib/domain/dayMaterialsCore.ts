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
