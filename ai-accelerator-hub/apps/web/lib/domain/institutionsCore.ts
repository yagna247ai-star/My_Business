/**
 * Pure rules for institutions (docs/INSTITUTIONS_SPEC.md): codes, registration code resolution,
 * the signed institution-switch cookie, journey mapping for transfers, and the profile.
 */
import crypto from 'node:crypto';
import { z } from 'zod';

export const INSTITUTION_TYPES = ['platform', 'skill_centre', 'college', 'school', 'company', 'other'] as const;
export type InstitutionType = typeof INSTITUTION_TYPES[number];
export const TYPE_LABEL: Record<InstitutionType, string> = { platform: 'Platform (AI Accelerator Hub)', skill_centre: 'Skill / training centre', college: 'College / university', school: 'School', company: 'Company / employer', other: 'Other' };
export const DEFAULT_CODE = 'AIHUB';

export const normaliseCode = (c: string) => c.trim().toUpperCase();

export function codeProblem(raw: string): string | null {
  const c = normaliseCode(raw);
  if (c.length < 3 || c.length > 12) return 'Use 3–12 letters or numbers for the institution code.';
  if (!/^[A-Z0-9]+$/.test(c)) return 'Use only letters and numbers (no spaces or symbols) in the institution code.';
  return null;
}

/** Initials of the name (an all-capitals word such as HRD is kept whole); one word → the word. Unique with a number. */
export function suggestCode(name: string, taken: Set<string>): string {
  const words = name.normalize('NFKD').replace(/[^A-Za-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
  let base = words.length > 1 ? words.map(w => (/^[A-Z0-9]{2,}$/.test(w) ? w : w[0].toUpperCase())).join('') : (words[0] ?? '').toUpperCase();
  base = base.slice(0, 10);
  if (base.length < 3) base = 'INST';
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) { const c = `${base.slice(0, 12 - String(i).length)}${i}`; if (!taken.has(c)) return c; }
  return `${base.slice(0, 6)}${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

export type CodeResolution = { kind: 'institution'; tenantId: string } | { kind: 'cohort'; tenantId: string; cohortId: string } | { kind: 'default' } | { kind: 'unknown' };

/** What a code typed at registration (or "Join an institution") means. Institution codes win over cohort codes. */
export function resolveCode(input: string | null | undefined, tenants: { id: string; code: string | null; status: string }[], cohorts: { id: string; tenantId: string; inviteCode: string | null }[]): CodeResolution {
  const c = (input ?? '').trim();
  if (!c) return { kind: 'default' };
  const up = c.toUpperCase();
  const t = tenants.find(x => x.code?.toUpperCase() === up);
  if (t) return t.status === 'active' ? { kind: 'institution', tenantId: t.id } : { kind: 'unknown' };
  if (up === DEFAULT_CODE) return { kind: 'default' }; // docs/REGISTRATION_HOME_SPEC.md AC-2: AIHUB always means the platform's home
  const co = cohorts.find(x => x.inviteCode?.toUpperCase() === up);
  if (co && tenants.find(x => x.id === co.tenantId)?.status !== 'suspended') return { kind: 'cohort', tenantId: co.tenantId, cohortId: co.id };
  return { kind: 'unknown' };
}

/**
 * docs/REGISTRATION_HOME_SPEC.md AC-1: where people without a code go. The institution holding AIHUB; else the
 * platform's own institution (type "platform"); else DEFAULT_TENANT_SLUG. Never a deactivated one.
 */
export function pickHome<T extends { id: string; code: string | null; type: string; slug: string; status: string }>(tenants: T[], envSlug: string | null | undefined): T | null {
  const live = tenants.filter(t => t.status === 'active');
  return live.find(t => t.code?.toUpperCase() === DEFAULT_CODE)
    ?? live.find(t => t.type === 'platform')
    ?? live.find(t => t.slug === (envSlug || 'demo'))
    ?? null;
}

/* ---------- signed switch cookie ---------- */

const mac = (v: string, secret: string) => crypto.createHmac('sha256', secret).update(`tenant:${v}`).digest('base64url');
export const signTenant = (tenantId: string, secret: string) => `${tenantId}.${mac(tenantId, secret)}`;
export function readTenant(cookie: string | undefined | null, secret: string): string | null {
  if (!cookie) return null;
  const i = cookie.lastIndexOf('.');
  if (i <= 0) return null;
  const id = cookie.slice(0, i), sig = cookie.slice(i + 1), want = mac(id, secret);
  return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)) ? id : null;
}

/* ---------- journey mapping (transfers) ---------- */

type Side = { levels: { id: string; code: string }[]; activities: { id: string; levelCode: string; idx: number }[]; contents: { id: string; levelCode: string; position: number }[] };

/** Old → new ids for a journey that exists in both institutions, matched by level code, activity number and day. */
export function planJourneyMap(src: Side, tgt: Side) {
  const lv = new Map(tgt.levels.map(l => [l.code, l.id]));
  const ac = new Map(tgt.activities.map(a => [`${a.levelCode}#${a.idx}`, a.id]));
  const co = new Map(tgt.contents.map(c => [`${c.levelCode}@${c.position}`, c.id]));
  const levels = new Map<string, string>(), activities = new Map<string, string>(), contents = new Map<string, string>(); const missing: string[] = [];
  for (const l of src.levels) { const t = lv.get(l.code); if (t) levels.set(l.id, t); else missing.push(`level ${l.code}`); }
  for (const a of src.activities) { const k = `${a.levelCode}#${a.idx}`; const t = ac.get(k); if (t) activities.set(a.id, t); else missing.push(`activity ${k}`); }
  for (const c of src.contents) { const k = `${c.levelCode}@${c.position}`; const t = co.get(k); if (t) contents.set(c.id, t); else missing.push(`day ${k}`); }
  return { levels, activities, contents, missing };
}

/* ---------- profile ---------- */

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
export const profileSchema = z.object({
  type: z.enum(INSTITUTION_TYPES).optional(),
  legalName: opt(160), address: opt(300), city: opt(80), state: opt(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code has 6 digits.').optional().or(z.literal('')),
  contactName: opt(100), contactEmail: z.string().trim().toLowerCase().email('Enter a valid email.').max(254).optional().or(z.literal('')),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number.').optional().or(z.literal('')),
  website: z.string().trim().url('Enter the full website address, starting with https://').max(200).optional().or(z.literal('')),
  registrationNo: opt(80), about: opt(1500),
  established: z.coerce.number().int().min(1800, 'Enter a real year.').max(new Date().getFullYear(), 'Enter a real year.').optional(),
});
export type InstitutionProfile = z.infer<typeof profileSchema>;
export const PROFILE_FIELDS = ['legalName', 'address', 'city', 'state', 'pincode', 'contactName', 'contactEmail', 'phone', 'website', 'registrationNo', 'about', 'established'] as const;
