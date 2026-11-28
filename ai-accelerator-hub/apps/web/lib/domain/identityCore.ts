/**
 * One person, one account (docs/IDENTITY_DEDUP_SPEC.md): pure rules, no database.
 * Canonical email key, name matching, duplicate scoring, grouping and primary choice.
 */

export type IdentityRow = {
  id: string;
  email: string;            // primary email
  emails: string[];         // every email of the account, primary included
  name: string | null;
  githubId: string | null;
  hasPassword: boolean;
  isSuperAdmin: boolean;
  activity: number;         // memberships + enrolments + submissions, any measure of "this is the one in use"
  createdAt: Date;
};

export type Level = 'certain' | 'likely' | 'possible' | 'none';
export type Match = { level: Level; score: number; reasons: string[] };

const GMAIL = new Set(['gmail.com', 'googlemail.com']);

/** Same mailbox, same key: lowercase; Gmail ignores dots and googlemail = gmail; every provider ignores +tags. */
export function emailKey(raw: string): string {
  const e = raw.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  let local = e.slice(0, at).split('+')[0];
  let domain = e.slice(at + 1);
  if (GMAIL.has(domain)) { domain = 'gmail.com'; local = local.replace(/\./g, ''); }
  return `${local}@${domain}`;
}

const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'shri', 'smt', 'sri', 'prof']);

/** Words of a name: no accents, case, punctuation or titles. */
export function nameTokens(name: string | null | undefined): string[] {
  if (!name) return [];
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ').filter(t => t && !TITLES.has(t));
}

/** exact: same words in any order (or the same letters run together); subset: the shorter name (2+ words) sits inside the longer. */
export function nameMatch(a: string | null | undefined, b: string | null | undefined): 'exact' | 'subset' | 'none' {
  const ta = nameTokens(a), tb = nameTokens(b);
  if (!ta.length || !tb.length) return 'none';
  const sa = [...ta].sort(), sb = [...tb].sort();
  if (sa.join(' ') === sb.join(' ') || sa.join('') === sb.join('')) return ta.length >= 2 || tb.length >= 2 ? 'exact' : 'none';
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (short.length >= 2 && short.length < long.length && short.every(t => long.includes(t))) return 'subset';
  return 'none';
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const localLetters = (email: string) => email.trim().toLowerCase().split('@')[0].split('+')[0].replace(/[^a-z]/g, '');

/** 0..1: how alike two email names are (letters only, so mami.dala and mamidala22 are the same). */
export function emailNameSimilarity(a: string, b: string): number {
  const la = localLetters(a), lb = localLetters(b);
  if (la.length < 3 || lb.length < 3) return 0;
  if (la === lb) return 1;
  const [s, l] = la.length <= lb.length ? [la, lb] : [lb, la];
  if (s.length >= 4 && l.includes(s)) return 0.9;
  return 1 - levenshtein(la, lb) / Math.max(la.length, lb.length);
}

const LIKELY_AT = 0.75;

export function scorePair(a: IdentityRow, b: IdentityRow): Match {
  const keysA = new Set(a.emails.map(emailKey)), keysB = new Set(b.emails.map(emailKey));
  const sharedKey = [...keysA].find(k => keysB.has(k));
  if (sharedKey) return { level: 'certain', score: 1, reasons: [`same mailbox (${sharedKey})`] };
  if (a.githubId && a.githubId === b.githubId) return { level: 'certain', score: 1, reasons: ['same GitHub account'] };
  const nm = nameMatch(a.name, b.name);
  if (nm === 'none') return { level: 'none', score: 0, reasons: [] };
  let sim = 0;
  for (const x of a.emails) for (const y of b.emails) sim = Math.max(sim, emailNameSimilarity(x, y));
  const base = nm === 'exact' ? 0.5 : 0.4;
  const nameReason = nm === 'exact' ? 'same name' : 'one name contains the other';
  if (sim >= LIKELY_AT) return { level: 'likely', score: Math.min(0.99, base + sim * 0.45), reasons: [nameReason, `similar email names (${Math.round(sim * 100)}%)`] };
  return { level: 'possible', score: base * 0.6, reasons: [nameReason] };
}

/** Which account stays: has a password, is Super Admin, most activity, has GitHub, oldest. */
export function pickPrimary(rows: IdentityRow[]): string {
  const rank = (r: IdentityRow) => [r.hasPassword ? 1 : 0, r.isSuperAdmin ? 1 : 0, r.activity, r.githubId ? 1 : 0];
  return [...rows].sort((x, y) => {
    const rx = rank(x), ry = rank(y);
    for (let i = 0; i < rx.length; i++) if (rx[i] !== ry[i]) return ry[i] - rx[i];
    return x.createdAt.getTime() - y.createdAt.getTime();
  })[0].id;
}

/** One name on the profile: the fuller one when one contains the other, else the primary's, else whichever exists. */
export function pickDisplayName(primary: string | null, secondary: string | null): string | null {
  if (!primary) return secondary;
  if (!secondary) return primary;
  const tp = nameTokens(primary), ts = nameTokens(secondary);
  if (ts.length > tp.length && tp.every(t => ts.includes(t))) return secondary;
  return primary;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}•••@${domain ?? ''}`;
}

export type DuplicateGroup = { memberIds: string[]; primaryId: string; confidence: 'certain' | 'likely'; reasons: string[] };

/** Groups certain and likely duplicates (transitively). 'possible' pairs are only counted. */
export function groupDuplicates(rows: IdentityRow[]): { groups: DuplicateGroup[]; possiblePairs: number } {
  const byId = new Map(rows.map(r => [r.id, r]));
  const buckets = new Map<string, string[]>();
  const add = (k: string, id: string) => { const l = buckets.get(k); if (l) l.push(id); else buckets.set(k, [id]); };
  for (const r of rows) {
    for (const e of r.emails) add(`k:${emailKey(e)}`, r.id);
    if (r.githubId) add(`g:${r.githubId}`, r.id);
    for (const t of new Set(nameTokens(r.name))) add(`n:${t}`, r.id);
  }
  const seen = new Set<string>(); const edges: { a: string; b: string; m: Match }[] = [];
  for (const ids of buckets.values()) {
    if (ids.length < 2 || ids.length > 300) continue; // a very common word ("kumar") is no use as a lookup key
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = ids[i] < ids[j] ? [ids[i], ids[j]] : [ids[j], ids[i]];
      if (a === b || seen.has(`${a}|${b}`)) continue;
      seen.add(`${a}|${b}`);
      const m = scorePair(byId.get(a)!, byId.get(b)!);
      if (m.level !== 'none') edges.push({ a, b, m });
    }
  }
  const parent = new Map<string, string>();
  const find = (x: string): string => { let p = parent.get(x) ?? x; if (p !== x) { p = find(p); parent.set(x, p); } return p; };
  const strong = edges.filter(e => e.m.level === 'certain' || e.m.level === 'likely');
  for (const e of strong) parent.set(find(e.a), find(e.b));
  const members = new Map<string, Set<string>>(), weakest = new Map<string, 'certain' | 'likely'>(), why = new Map<string, Set<string>>();
  for (const e of strong) {
    const root = find(e.a);
    (members.get(root) ?? members.set(root, new Set()).get(root)!).add(e.a).add(e.b);
    if (e.m.level === 'likely') weakest.set(root, 'likely'); else if (!weakest.has(root)) weakest.set(root, 'certain');
    const w = why.get(root) ?? why.set(root, new Set()).get(root)!;
    for (const r of e.m.reasons) w.add(r);
  }
  const groups: DuplicateGroup[] = [...members.entries()].map(([root, set]) => {
    const memberIds = [...set];
    return { memberIds, primaryId: pickPrimary(memberIds.map(id => byId.get(id)!)), confidence: weakest.get(root)!, reasons: [...why.get(root)!] };
  }).sort((x, y) => (x.confidence === y.confidence ? 0 : x.confidence === 'certain' ? -1 : 1));
  const possiblePairs = edges.filter(e => e.m.level === 'possible' && find(e.a) !== find(e.b)).length;
  return { groups, possiblePairs };
}

/* ───────── Who may merge, tickets, automatic run (docs/IDENTITY_DEDUP_SPEC.md §3.10–3.13) ───────── */

export type MergeActor = { superAdmin: boolean; canManage: boolean; tenantId: string };
export type MergeAccount = { id: string; tenantIds: string[]; isSuperAdmin: boolean };
export type ScopeResult = { allowed: true } | { allowed: false; reason: 'no_permission' | 'super_admin_account' | 'other_institution' };

/** A Super Admin merges anything. An institution admin only when every account belongs to their institution alone. */
export function mergeScope(actor: MergeActor, accounts: MergeAccount[]): ScopeResult {
  if (actor.superAdmin) return { allowed: true };
  if (!actor.canManage) return { allowed: false, reason: 'no_permission' };
  if (accounts.some(a => a.isSuperAdmin)) return { allowed: false, reason: 'super_admin_account' };
  if (accounts.some(a => !a.tenantIds.length || a.tenantIds.some(t => t !== actor.tenantId))) return { allowed: false, reason: 'other_institution' };
  return { allowed: true };
}

/** One open ticket per set of accounts, whichever is primary and in whatever order. */
export const ticketKey = (ids: string[]) => [...new Set(ids)].sort().join('|');

export const AUTO_MAX_GROUPS = 25, AUTO_MAX_MEMBERS = 5;

/** Which groups the automatic run merges now, which it hands to a Super Admin, and how many wait for the next run. */
export function autoMergePlan(groups: DuplicateGroup[], superIds: ReadonlySet<string> = new Set(), minorIds: ReadonlySet<string> = new Set()): { merge: DuplicateGroup[]; escalate: { group: DuplicateGroup; reason: 'too_many_accounts' | 'super_admin_account' | 'minor_account' }[]; deferred: number } {
  const certain = groups.filter(g => g.confidence === 'certain');
  // A merge must never change anyone's privileges silently: groups with a Super Admin account always go to a person.
  const escalate = certain.flatMap((group): { group: DuplicateGroup; reason: 'too_many_accounts' | 'super_admin_account' | 'minor_account' }[] => group.memberIds.some(id => superIds.has(id)) ? [{ group, reason: 'super_admin_account' as const }] : group.memberIds.some(id => minorIds.has(id)) ? [{ group, reason: 'minor_account' as const }] : group.memberIds.length > AUTO_MAX_MEMBERS ? [{ group, reason: 'too_many_accounts' as const }] : []);
  const held = new Set(escalate.map(e => e.group));
  const ok = certain.filter(g => !held.has(g));
  return { merge: ok.slice(0, AUTO_MAX_GROUPS), escalate, deferred: Math.max(0, ok.length - AUTO_MAX_GROUPS) };
}

/* ───────── The owner's own emails (docs/IDENTITY_DEDUP_SPEC.md §3.16–3.19) ───────── */

export const MAX_EMAILS = 5;
export const EMAIL_VERIFY_TTL_MS = 24 * 3600_000;
export const canAddEmail = (countNow: number) => countNow < MAX_EMAILS;

export type OwnEmail = { id: string; isPrimary: boolean; pending: boolean };
export type EmailActionResult = { ok: true } | { ok: false; reason: 'not_found' | 'primary' | 'not_verified' | 'already_primary' };

/** Removing needs no verification (the owner's own choice) but never the primary. Making primary needs a verified secondary. */
export function emailAction(rows: OwnEmail[], action: 'remove' | 'primary', id: string): EmailActionResult {
  const r = rows.find(x => x.id === id);
  if (!r) return { ok: false, reason: 'not_found' };
  if (action === 'remove') return r.isPrimary ? { ok: false, reason: 'primary' } : { ok: true };
  if (r.isPrimary) return { ok: false, reason: 'already_primary' };
  return r.pending ? { ok: false, reason: 'not_verified' } : { ok: true };
}

/* ───────── Minors (docs/IDENTITY_DEDUP_SPEC.md §3.20, docs/CHILD_SAFETY_POLICY.md) ───────── */

export type Setting = { ageBand: string; guardianConsent: string; leaderboardVisibility: string; globalOptIn: boolean; guardianEmail: string | null };
const CONSENT_RANK: Record<string, number> = { granted: 0, pending: 1, not_required: 1, revoked: 2 };

/**
 * The settings one institution holds for a person after two accounts become one: always the most protective.
 * `anyMinor` is true when either account was a minor anywhere (age is a fact about the person, not the institution).
 * Consent counts only where an institution recorded it for a minor; it is never inferred from an adult record.
 */
export function protectiveSettings(rows: Setting[], anyMinor: boolean): Setting {
  const priv = rows.some(r => r.leaderboardVisibility === 'private');
  const optIn = rows.length > 0 && rows.every(r => r.globalOptIn);
  if (!anyMinor) return { ageBand: 'adult', guardianConsent: 'not_required', leaderboardVisibility: priv ? 'private' : 'cohort', globalOptIn: optIn, guardianEmail: null };
  const minors = rows.filter(r => r.ageBand !== 'adult');
  const consent = minors.length ? minors.reduce((w, r) => (CONSENT_RANK[r.guardianConsent] ?? 1) > (CONSENT_RANK[w] ?? 1) ? r.guardianConsent : w, minors[0].guardianConsent) : 'pending';
  const granted = consent === 'granted';
  return { ageBand: 'minor', guardianConsent: granted ? 'granted' : consent === 'revoked' ? 'revoked' : 'pending', leaderboardVisibility: priv || !granted ? 'private' : 'cohort', globalOptIn: optIn && granted, guardianEmail: minors.find(r => r.guardianEmail)?.guardianEmail ?? null };
}
