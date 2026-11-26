/**
 * Pure rules for the Super Admin control centre (docs/SUPER_ADMIN_CONTROL_SPEC.md): CSV import parsing,
 * bulk-action rules, and the plain-English meaning of every permission for the Access screen.
 */
import { z } from 'zod';
import type { Permission, Role } from '@/lib/server/rbac';
import { isAssignable } from './settingsRules';
import { DEFAULT_AREA, normaliseArea } from './areas';

export const MAX_IMPORT_ROWS = 2000;

export type ImportRow = { line: number; name: string; email: string; role: Role; cohort: string | null; area: string; institution: string | null };
export type ImportError = { line: number; message: string };

/** RFC 4180-style: quoted fields, doubled quotes, commas and newlines inside quotes, CRLF, BOM. */
function csvRecords(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const email = z.string().trim().toLowerCase().email().max(254);

export function parseMembersCsv(text: string): { rows: ImportRow[]; errors: ImportError[] } {
  const recs = csvRecords(text).filter(r => r.some(c => c.trim() !== ''));
  if (!recs.length) return { rows: [], errors: [{ line: 1, message: 'The file is empty.' }] };
  const head = recs[0].map(h => h.trim().toLowerCase());
  const col = (n: string) => head.indexOf(n);
  if (col('name') < 0 || col('email') < 0) return { rows: [], errors: [{ line: 1, message: 'The first row must name the columns, including name and email (optional: role, cohort, area, institution).' }] };
  if (recs.length - 1 > MAX_IMPORT_ROWS) return { rows: [], errors: [{ line: 1, message: `Import at most 2,000 people at a time (this file has ${(recs.length - 1).toLocaleString('en-IN')}).` }] };

  const rows: ImportRow[] = []; const errors: ImportError[] = []; const seen = new Map<string, number>();
  recs.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (n: string) => (col(n) >= 0 ? (r[col(n)] ?? '').trim() : '');
    const name = get('name');
    if (name.length < 2) { errors.push({ line, message: 'Add the person’s full name.' }); return; }
    const e = email.safeParse(get('email'));
    if (!e.success) { errors.push({ line, message: `“${get('email')}” is not a valid email.` }); return; }
    if (seen.has(e.data)) { errors.push({ line, message: `${e.data} appears twice (first on line ${seen.get(e.data)}).` }); return; }
    seen.set(e.data, line);
    const role = (get('role') || 'learner').toLowerCase();
    if (!isAssignable(role)) { errors.push({ line, message: `Unknown role “${role}”. Use learner, team_lead, mentor, reviewer, instructor, program_mgr, support, finance or tenant_admin.` }); return; }
    const areaRaw = get('area');
    const area = areaRaw ? normaliseArea(areaRaw) : DEFAULT_AREA;
    if (!area) { errors.push({ line, message: `Unknown area “${areaRaw}”. Use a district or city in Telangana or Andhra Pradesh.` }); return; }
    rows.push({ line, name: name.slice(0, 100), email: e.data, role, cohort: get('cohort') || null, area, institution: get('institution') ? get('institution').toUpperCase() : null });
  });
  return { rows, errors };
}

export const BULK_ACTIONS = ['suspend', 'activate', 'reset_link', 'force_change', 'set_role', 'set_cohort', 'set_area', 'remove'] as const;
export type BulkAction = typeof BULK_ACTIONS[number];

/** Why a person is left out of a bulk action, or null. */
export function bulkSkipReason(a: { actorId: string; actorSuper: boolean; targetId: string; targetSuper: boolean }): string | null {
  if (a.actorId === a.targetId) return 'You cannot change yourself in a bulk action.';
  if (a.targetSuper && !a.actorSuper) return 'Only a Super Admin can change a Super Admin.';
  return null;
}

/** Institution Admins may not force password changes or create Institution Admins. */
export function canUseBulkAction(actorSuper: boolean, action: BulkAction, value?: string): boolean {
  if (actorSuper) return true;
  if (action === 'force_change') return false;
  if (action === 'set_role' && value === 'tenant_admin') return false;
  return true;
}

export const PERMISSION_INFO: Record<Permission, string> = {
  'learn:self': 'Learn: take journeys, do activities and hand in proof.',
  'ai:use': 'Use the AI coach and AI helpers.',
  'community:post': 'Post, comment and react in the community feed.',
  'community:moderate': 'Moderate the community and the showcase (hide, remove, feature, handle reports).',
  'review:read': 'See the review queue and submissions.',
  'review:decide': 'Decide submissions (approve or ask for changes) and handle appeals.',
  'cohort:read': 'See cohorts and their members.',
  'cohort:manage': 'Create and edit cohorts, invite codes and schedules.',
  'members:read': 'See people, their progress and profiles.',
  'members:manage': 'Add, edit, suspend and remove people; change roles; bulk actions; CSV import.',
  'content:manage': 'Edit and publish journeys, levels, activities and content.',
  'analytics:read': 'See program analytics and reports.',
  'audit:read': 'Read the audit log.',
  'billing:self': 'Buy plans for themselves.',
  'billing:manage': 'Manage billing: refunds, reconciliation and invoices.',
  'ledger:verify': 'Verify the points (XP) ledger.',
  'talent:discover': 'Search consented talent profiles.',
  'talent:post': 'Post opportunities on behalf of an organisation.',
  'institute:manage': 'Edit the institution’s own details and settings.',
};
