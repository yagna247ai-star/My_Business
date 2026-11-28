/**
 * One person, one account (docs/IDENTITY_DEDUP_SPEC.md): look up an account by any of its emails, refuse a second
 * account for the same person, report existing duplicates and merge them. Rules live in identityCore.ts.
 */
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError, badRequest, conflict, forbidden } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { can } from '@/lib/server/rbac';
import { rechainLedger } from './xp';
import { pickPrimary, autoMergePlan, protectiveSettings, emailKey, groupDuplicates, maskEmail, mergeScope, nameTokens, pickDisplayName, scorePair, ticketKey, type DuplicateGroup, type IdentityRow } from './identityCore';

type Tx = PrismaClient | Prisma.TransactionClient;

export const isSystemEmail = (e: string) => /@system\.local$|@merged\.invalid$/i.test(e);

/** The account that owns this email as primary or secondary (same mailbox counts), following a merge to the survivor. */
export async function findUserByAnyEmail(emailRaw: string, db: Tx = prisma) {
  const email = emailRaw.trim().toLowerCase();
  // Safety net: sign-in must never depend on the new table. If it cannot be read (not migrated yet, a database hiccup),
  // fall back to the exact primary email, which is how every account signed in before this feature.
  const found = await db.userEmail.findUnique({ where: { emailKey: emailKey(email) }, select: { userId: true, pendingUntil: true } }).catch((e: unknown) => { console.error('[identity] user_emails lookup failed, using primary email only:', (e as Error).message); return null; });
  const hit = found && !found.pendingUntil ? found : null; // an unverified (pending) email proves nothing
  let user = hit ? await db.user.findUnique({ where: { id: hit.userId } }) : await db.user.findUnique({ where: { email } });
  for (let i = 0; user?.mergedIntoId && i < 5; i++) user = await db.user.findUnique({ where: { id: user.mergedIntoId } });
  return user;
}

/** Records the primary email of a new account so the same mailbox can never open a second one. Call inside the create transaction. */
export async function recordPrimaryEmail(tx: Tx, userId: string, email: string, verified = false) {
  const e = email.trim().toLowerCase();
  await tx.userEmail.deleteMany({ where: { emailKey: emailKey(e), pendingUntil: { not: null } } }); // someone's unconfirmed claim never blocks a real sign-up
  await tx.userEmail.upsert({ where: { email: e }, update: {}, create: { userId, email: e, emailKey: emailKey(e), isPrimary: true, verified } });
}

/** An existing account that looks like the same person as this name + email (certain or likely), or null. */
export async function findLikelyDuplicate(input: { name: string | null; email: string }, db: Tx = prisma): Promise<{ id: string; email: string; level: 'certain' | 'likely'; reasons: string[] } | null> {
  const probe: IdentityRow = { id: '__new__', email: input.email, emails: [input.email], name: input.name, githubId: null, hasPassword: true, isSuperAdmin: false, activity: 0, createdAt: new Date() };
  const words = [...new Set(nameTokens(input.name))].filter(t => t.length >= 3).slice(0, 4);
  if (!words.length) return null;
  const candidates = await db.user.findMany({
    where: { mergedIntoId: null, OR: words.map(w => ({ name: { contains: w, mode: 'insensitive' as const } })) },
    select: { id: true, email: true, name: true, githubId: true, passwordHash: true, globalRole: true, createdAt: true, emails: { where: { pendingUntil: null }, select: { email: true } } },
    take: 300,
  });
  let best: { id: string; email: string; level: 'certain' | 'likely'; reasons: string[]; score: number } | null = null;
  for (const c of candidates) {
    if (isSystemEmail(c.email)) continue;
    const m = scorePair(probe, { id: c.id, email: c.email, emails: [c.email, ...c.emails.map(e => e.email)], name: c.name, githubId: c.githubId, hasPassword: !!c.passwordHash, isSuperAdmin: c.globalRole === 'super_admin', activity: 0, createdAt: c.createdAt });
    if ((m.level === 'certain' || m.level === 'likely') && (!best || m.score > best.score)) best = { id: c.id, email: c.email, level: m.level, reasons: m.reasons, score: m.score };
  }
  return best;
}

/** Sign-up and admin add: throws when this person already has an account (same mailbox, or the same name with a look-alike email). */
export async function assertNoDuplicate(input: { name: string; email: string }, opts: { forAdmin?: boolean; confirmedNew?: boolean } = {}) {
  if (await findUserByAnyEmail(input.email)) throw conflict('An account with this email already exists. Try signing in.');
  const dup = await findLikelyDuplicate(input);
  // docs/IDENTITY_DEDUP_RESEARCH.md: only a certain match is a hard stop. A likely one asks the person once ("Is this you?")
  // and, if they say they are someone else, goes ahead; the pair then shows in the Super Admin duplicate report.
  if (dup && !opts.forAdmin && opts.confirmedNew) return;
  if (dup && !opts.forAdmin) throw new AppError(409, 'POSSIBLE_DUPLICATE', `You may already have an account (${maskEmail(dup.email)}). Sign in with it, or reset your password. If this is not you, confirm below to create a new account.`);
  if (dup) {
    throw conflict(opts.forAdmin
      ? `This looks like the same person as ${dup.email}. Use that email to add them, or ask a Super Admin to merge the accounts.`
      : `You may already have an account (${maskEmail(dup.email)}). Sign in with it, or reset your password.`);
  }
}

/* ───────────────────────── Report ───────────────────────── */

function needSuper(ctx: Ctx) { if (!ctx.superAdmin) throw forbidden('Only a Super Admin can do that.'); }
const canManage = (ctx: Ctx) => ctx.superAdmin || (ctx.perms ? ctx.perms.includes('members:manage') : can(ctx.role, 'members:manage'));
function needManage(ctx: Ctx) { if (!canManage(ctx)) throw forbidden('You need permission to manage people to do that.'); }

/** Every live account with the institutions it belongs to, grouped into duplicates. */
async function loadGroups() {
  const users = await prisma.user.findMany({
    where: { mergedIntoId: null, NOT: [{ email: { endsWith: '@system.local' } }, { email: { endsWith: '@merged.invalid' } }] },
    select: { id: true, email: true, name: true, githubId: true, passwordHash: true, globalRole: true, createdAt: true, emails: { where: { pendingUntil: null }, select: { email: true } }, memberships: { select: { tenantId: true, role: { select: { code: true } } } }, _count: { select: { enrollments: true, submissions: true } } },
  });
  const rows: IdentityRow[] = users.map(u => ({ id: u.id, email: u.email, emails: [...new Set([u.email, ...u.emails.map(e => e.email)])], name: u.name, githubId: u.githubId, hasPassword: !!u.passwordHash, isSuperAdmin: u.globalRole === 'super_admin', activity: u.memberships.length + u._count.enrollments + u._count.submissions, createdAt: u.createdAt }));
  const minorIds = new Set((await prisma.userSetting.findMany({ where: { ageBand: 'minor' }, select: { userId: true } })).map(m => m.userId));
  const scope = new Map(users.map(u => [u.id, { id: u.id, tenantIds: [...new Set(u.memberships.map(m => m.tenantId))], isSuperAdmin: u.globalRole === 'super_admin' || u.memberships.some(m => m.role.code === 'super_admin') }]));
  return { rows, byId: new Map(rows.map(r => [r.id, r])), scope, minorIds, ...groupDuplicates(rows) };
}

/** The accounts' institutions, for the permission check on a merge or a ticket. */
async function accountScopes(ids: string[]) {
  const us = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, globalRole: true, memberships: { select: { tenantId: true, role: { select: { code: true } } } } } });
  return us.map(u => ({ id: u.id, tenantIds: [...new Set(u.memberships.map(m => m.tenantId))], isSuperAdmin: u.globalRole === 'super_admin' || u.memberships.some(m => m.role.code === 'super_admin') }));
}
const SCOPE_MESSAGE = { no_permission: 'You need permission to manage people to merge accounts.', super_admin_account: 'A Super Admin account can only be merged by a Super Admin. Send it to a Super Admin.', other_institution: 'One of these accounts also belongs to another institution, so only a Super Admin can merge them. Send it to a Super Admin.' } as const;

/** Throws OUT_OF_SCOPE (403) when this person may not merge these accounts. */
async function assertMergeScope(ctx: Ctx, ids: string[]) {
  const r = mergeScope({ superAdmin: ctx.superAdmin, canManage: canManage(ctx), tenantId: ctx.tenantId }, await accountScopes(ids));
  if (!r.allowed) throw new AppError(403, r.reason === 'no_permission' ? 'FORBIDDEN' : 'OUT_OF_SCOPE', SCOPE_MESSAGE[r.reason]);
}

type Loaded = Awaited<ReturnType<typeof loadGroups>>;

/** One group as the caller may see it: emails masked and merge disabled when it reaches beyond their institution. */
function viewOf(ctx: Ctx, L: Loaded, memberIds: string[], primaryId: string, confidence: 'certain' | 'likely' | 'possible', reasons: string[]) {
  const ok = mergeScope({ superAdmin: ctx.superAdmin, canManage: true, tenantId: ctx.tenantId }, memberIds.map(id => L.scope.get(id)!)).allowed;
  return { confidence, reasons, primaryId, canMerge: ok, needsSuperAdmin: !ok,
    members: memberIds.map(id => { const r = L.byId.get(id)!; return { id, name: r.name, email: ok ? r.email : maskEmail(r.email), emails: ok ? r.emails : r.emails.map(maskEmail), hasPassword: r.hasPassword, minor: L.minorIds.has(id), activity: r.activity, createdAt: r.createdAt }; }) };
}
const touchesMine = (ctx: Ctx, L: Loaded, ids: string[]) => ctx.superAdmin || ids.some(id => L.scope.get(id)?.tenantIds.includes(ctx.tenantId));

export async function duplicateReport(ctx: Ctx) {
  needManage(ctx);
  const L = await loadGroups();
  const groups = L.groups.filter(g => touchesMine(ctx, L, g.memberIds)).map(g => viewOf(ctx, L, g.memberIds, g.primaryId, g.confidence, g.reasons));
  // Name-only pairs (docs/IDENTITY_DEDUP_SPEC.md §3.22): shown to a person, never merged by the system.
  const possible = L.possible.filter(p => touchesMine(ctx, L, [p.aId, p.bId])).slice(0, 100).map(p => viewOf(ctx, L, [p.aId, p.bId], p.primaryId, 'possible', p.reasons));
  const tickets = await prisma.duplicateTicket.findMany({ where: ctx.superAdmin ? { status: 'open' } : { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, take: 50 });
  return { possiblePairs: possible.length, groups, possible, tickets: tickets.map(t => ({ id: t.id, status: t.status, reason: t.reason, note: t.note, createdAt: t.createdAt, primaryId: t.primaryId, accountIds: JSON.parse(t.accountIds) as string[], accounts: (JSON.parse(t.accountIds) as string[]).map(id => { const r = L.byId.get(id); return r ? { id, name: r.name, email: ctx.superAdmin ? r.email : maskEmail(r.email) } : { id, name: null, email: '(merged)' }; }) })) };
}

/** Find two accounts by any of their emails, so any pair can be merged (same rules as every merge). */
export async function lookupPair(ctx: Ctx, emailA: string, emailB: string) {
  needManage(ctx);
  const [a, b] = await Promise.all([findUserByAnyEmail(emailA), findUserByAnyEmail(emailB)]);
  const L = await loadGroups();
  const none = () => badRequest('We could not find two different accounts for those emails. Check the spelling, or search the Duplicate accounts list.');
  if (!a || !b || a.id === b.id || !L.byId.has(a.id) || !L.byId.has(b.id)) throw none();
  if (!touchesMine(ctx, L, [a.id, b.id])) throw none(); // an institution admin learns nothing about people outside their institution
  const m = scorePair(L.byId.get(a.id)!, L.byId.get(b.id)!);
  return viewOf(ctx, L, [a.id, b.id], pickPrimary([L.byId.get(a.id)!, L.byId.get(b.id)!]), m.level === 'none' ? 'possible' : m.level, m.reasons.length ? m.reasons : ['chosen by you']);
}

/* ───────────────────────── Tickets ───────────────────────── */

type TicketReason = 'out_of_scope' | 'requested' | 'auto_failed' | 'too_many_accounts' | 'super_admin_account' | 'minor_account';

async function openTicket(input: { tenantId: string | null; requestedById: string | null; accountIds: string[]; primaryId: string | null; reason: TicketReason; note?: string | null }) {
  const accountKey = ticketKey(input.accountIds);
  const existing = () => prisma.duplicateTicket.findFirst({ where: { accountKey, status: 'open' } });
  const found = await existing(); if (found) return found;
  try {
    return await prisma.duplicateTicket.create({ data: { tenantId: input.tenantId, requestedById: input.requestedById, accountIds: JSON.stringify([...new Set(input.accountIds)].sort()), accountKey, primaryId: input.primaryId, reason: input.reason, note: input.note?.slice(0, 500) ?? null } });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2002') { const t = await existing(); if (t) return t; } // two people asked at once: the database allows one open ticket
    throw e;
  }
}

/** An institution admin (or Super Admin) sends a duplicate group to the Super Admin queue. */
export async function createTicket(ctx: Ctx, input: { primaryId: string; secondaryIds: string[]; note?: string }) {
  needManage(ctx);
  const ids = [input.primaryId, ...input.secondaryIds];
  if (new Set(ids).size < 2) throw badRequest('Choose at least two different accounts.');
  const scopes = await accountScopes(ids);
  if (scopes.length !== new Set(ids).size) throw badRequest('One of those accounts no longer exists.');
  if (!ctx.superAdmin && !scopes.some(a => a.tenantIds.includes(ctx.tenantId))) throw forbidden('None of these accounts belong to your institution.');
  const t = await openTicket({ tenantId: ctx.tenantId, requestedById: ctx.userId, accountIds: ids, primaryId: input.primaryId, reason: mergeScope({ superAdmin: false, canManage: true, tenantId: ctx.tenantId }, scopes).allowed ? 'requested' : 'out_of_scope', note: input.note });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'user.merge_ticket_opened', resourceType: 'DuplicateTicket', resourceId: t.id, after: { accounts: ids.length } });
  return { ticketId: t.id, status: t.status };
}

/** Super Admin: merge the ticket's accounts, or reject it. The requester is told either way. */
export async function resolveTicket(ctx: Ctx, ticketId: string, input: { action: 'merge' | 'reject'; note?: string }) {
  needSuper(ctx);
  const t = await prisma.duplicateTicket.findUnique({ where: { id: ticketId } });
  if (!t) throw badRequest('That ticket does not exist.');
  if (t.status !== 'open') throw conflict('That ticket is already closed.');
  const ids = JSON.parse(t.accountIds) as string[];
  let status: 'merged' | 'rejected' | 'already_merged' = 'rejected';
  if (input.action === 'merge') {
    const live = await prisma.user.findMany({ where: { id: { in: ids }, mergedIntoId: null }, select: { id: true } });
    const liveIds = new Set(live.map(u => u.id));
    if (liveIds.size < 2) status = 'already_merged'; // somebody merged them already: close without error
    else {
      const primary = t.primaryId && liveIds.has(t.primaryId) ? t.primaryId : [...liveIds][0];
      for (const id of liveIds) if (id !== primary) await mergeUsers(ctx, primary, id);
      status = 'merged';
    }
  }
  await prisma.duplicateTicket.update({ where: { id: t.id }, data: { status, note: input.note?.slice(0, 500) ?? t.note, resolvedById: ctx.userId, resolvedAt: new Date() } });
  if (t.requestedById && t.tenantId) await notify(prisma, t.tenantId, t.requestedById, 'duplicate_ticket', { title: status === 'rejected' ? 'Duplicate accounts: not merged' : 'Duplicate accounts merged', body: input.note?.slice(0, 200), tone: status === 'rejected' ? 'warn' : 'ok' });
  return { status };
}

/* ───────────────────────── Merge ───────────────────────── */

type FkPlan = { table: string; fk: string; uniqueSets: string[][]; leaf: boolean };
let planCache: FkPlan[] | null = null;

/** Every table with a foreign key to users, from Prisma's own model list, so a new table is never forgotten. */
export function userForeignKeys(): FkPlan[] {
  if (planCache) return planCache;
  const models = Prisma.dmmf.datamodel.models;
  const col = (m: (typeof models)[number], f: string) => m.fields.find(x => x.name === f)?.dbName ?? f;
  const referenced = new Set<string>();
  for (const m of models) for (const f of m.fields) if (f.kind === 'object' && (f.relationFromFields?.length ?? 0) > 0) referenced.add(f.type);
  const plan: FkPlan[] = [];
  for (const m of models) {
    if (m.name === 'User' || m.name === 'UserEmail') continue;
    for (const f of m.fields) {
      if (f.kind !== 'object' || f.type !== 'User' || f.relationFromFields?.length !== 1) continue;
      const fkField = f.relationFromFields[0];
      const sets = [...(m.uniqueFields ?? []), ...(m.uniqueIndexes ?? []).map(u => u.fields), ...(m.primaryKey ? [m.primaryKey.fields] : [])]
        .filter(s => s.includes(fkField)).map(s => s.filter(x => x !== fkField).map(x => col(m, x)));
      const own = m.fields.find(x => x.name === fkField);
      if (own?.isId || own?.isUnique) sets.push([]); // @unique / @id on the user column itself: one row per person
      const seen = new Set<string>(); const unique = sets.filter(x => { const k = x.join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
      sets.length = 0; sets.push(...unique);
      plan.push({ table: m.dbName ?? m.name, fk: col(m, fkField), uniqueSets: sets, leaf: !referenced.has(m.name) });
    }
  }
  return (planCache = plan);
}

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

/** SQL that repoints one table's rows from the second account to the primary, skipping rows that would break a unique rule. */
export function moveSql(p: FkPlan): { move: string; leftovers: string | null } {
  const guards = p.uniqueSets.map(cols => `NOT EXISTS (SELECT 1 FROM ${q(p.table)} x WHERE x.${q(p.fk)} = $1${cols.map(c => ` AND x.${q(c)} IS NOT DISTINCT FROM ${q(p.table)}.${q(c)}`).join('')})`);
  const move = `UPDATE ${q(p.table)} SET ${q(p.fk)} = $1 WHERE ${q(p.fk)} = $2${guards.map(g => ` AND ${g}`).join('')}`;
  return { move, leftovers: p.uniqueSets.length && p.leaf ? `DELETE FROM ${q(p.table)} WHERE ${q(p.fk)} = $1` : null };
}

/** Merge two accounts if this person may (Super Admin: any; institution admin: only inside their institution). */
export async function mergeUsers(ctx: Ctx, primaryId: string, secondaryId: string) {
  if (primaryId === secondaryId) throw badRequest('Choose two different accounts.');
  await assertMergeScope(ctx, [primaryId, secondaryId]);
  return runMerge({ userId: ctx.userId, tenantId: ctx.tenantId }, primaryId, secondaryId, false);
}

async function runMerge(actor: { userId: string | null; tenantId: string | null }, primaryId: string, secondaryId: string, auto: boolean) {
  return prisma.$transaction(async tx => {
    // Lock both accounts in id order: two merges touching the same account run one after the other, never together.
    await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" IN (${primaryId}, ${secondaryId}) ORDER BY "id" FOR UPDATE`;
    const [p, s] = await Promise.all([primaryId, secondaryId].map(id => tx.user.findUnique({ where: { id }, include: { emails: { where: { pendingUntil: null } } } })));
    if (!p || !s) throw badRequest('One of those accounts no longer exists.');
    if (p.mergedIntoId || s.mergedIntoId) throw badRequest('One of those accounts is already merged.');
    if (isSystemEmail(p.email) || isSystemEmail(s.email)) throw badRequest('System accounts cannot be merged.');

    // 1. Emails: the second account's mailboxes become secondary emails of the primary.
    const moved: string[] = [];
    const sEmails = new Set([s.email.toLowerCase(), ...s.emails.map(e => e.email)]);
    const pKeys = new Set([p.email, ...p.emails.map(e => e.email)].map(emailKey));
    if (!p.emails.some(e => e.email === p.email.toLowerCase())) { const owner = await tx.userEmail.findUnique({ where: { emailKey: emailKey(p.email) } }); if (!owner) await recordPrimaryEmail(tx, p.id, p.email, p.emailVerified); }
    await tx.userEmail.updateMany({ where: { userId: p.id, NOT: { email: p.email.toLowerCase() } }, data: { isPrimary: false } });
    await tx.userEmail.deleteMany({ where: { userId: p.id, pendingUntil: { not: null }, emailKey: { in: [...sEmails].map(emailKey) } } }); // the primary's own unconfirmed claim on the same mailbox
    for (const email of sEmails) {
      const key = emailKey(email);
      const owner = await tx.userEmail.findUnique({ where: { emailKey: key } });
      if (owner && owner.userId === p.id) continue;
      if (pKeys.has(key)) continue;
      if (owner && owner.userId !== s.id) continue; // belongs to a third account; its own merge handles it
      if (owner) await tx.userEmail.update({ where: { id: owner.id }, data: { userId: p.id, isPrimary: false } });
      else await tx.userEmail.create({ data: { userId: p.id, email, emailKey: key, isPrimary: false, verified: s.emailVerified } });
      moved.push(email);
    }
    await tx.userEmail.deleteMany({ where: { userId: s.id } });

    // Role clashes (docs/IDENTITY_DEDUP_RESEARCH.md §2c): in an institution both accounts belong to, the primary's role stays.
    // A merge never raises anyone's privileges, so a higher role on the second account is recorded, not carried over.
    const [pm, sm] = await Promise.all([p.id, s.id].map(id => tx.membership.findMany({ where: { userId: id }, select: { tenantId: true, role: { select: { code: true } } } })));
    const roleClashes = sm.flatMap(m => { const k = pm.find(x => x.tenantId === m.tenantId); return k && k.role.code !== m.role.code ? [{ tenantId: m.tenantId, kept: k.role.code, notCarried: m.role.code }] : []; });

    // Minors (docs/CHILD_SAFETY_POLICY.md): the merged person keeps the strictest settings either account had, in every institution.
    const [ps, ss] = await Promise.all([p.id, s.id].map(id => tx.userSetting.findMany({ where: { userId: id } })));
    const anyMinor = [...ps, ...ss].some(r => r.ageBand !== 'adult');

    // 2. Every row the second account owns moves to the primary (primary wins on a unique clash).
    let rowsMoved = 0, rowsSkipped = 0, rowsDeleted = 0;
    for (const plan of userForeignKeys()) {
      const { move, leftovers } = moveSql(plan);
      rowsMoved += await tx.$executeRawUnsafe(move, p.id, s.id);
      if (!plan.uniqueSets.length) continue;
      const left = Number((await tx.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM ${q(plan.table)} WHERE ${q(plan.fk)} = $1`, s.id))[0]?.n ?? 0);
      rowsSkipped += left; // rows the primary already has an equivalent of
      if (leftovers && left) rowsDeleted += await tx.$executeRawUnsafe(leftovers, s.id);
    }

    let minorProtected = 0;
    for (const tenantId of new Set([...ps, ...ss].map(r => r.tenantId))) {
      const rows = [...ps, ...ss].filter(r => r.tenantId === tenantId);
      if (rows.length < 2 && !(anyMinor && rows.every(r => r.ageBand === 'adult'))) continue; // a lone minor row moved unchanged
      const d = protectiveSettings(rows, anyMinor);
      await tx.userSetting.upsert({ where: { tenantId_userId: { tenantId, userId: p.id } }, update: d, create: { tenantId, userId: p.id, ...d } });
      minorProtected++;
    }
    // The XP ledger is hash-chained per person: re-link the combined rows in time order (totals do not change).
    let ledgerRelinked = 0;
    for (const t of await tx.xpLedger.findMany({ where: { userId: p.id }, distinct: ['tenantId'], select: { tenantId: true } })) ledgerRelinked += await rechainLedger(tx, t.tenantId, p.id);

    // 3. The second account becomes a tombstone; the primary keeps one name and everything useful from it.
    const githubId = p.githubId ?? s.githubId;
    await tx.user.update({ where: { id: s.id }, data: { email: `merged-${s.id}@merged.invalid`, passwordHash: null, githubId: null, githubUsername: null, globalRole: null, mergedIntoId: p.id, mergedAt: new Date() } });
    await tx.user.update({ where: { id: p.id }, data: {
      name: pickDisplayName(p.name, s.name),
      githubId, githubUsername: p.githubUsername ?? (p.githubId ? null : s.githubUsername),
      avatarUrl: p.avatarUrl ?? s.avatarUrl,
      passwordHash: p.passwordHash ?? s.passwordHash,
      emailVerified: p.emailVerified || s.emailVerified,
      globalRole: p.globalRole === 'super_admin' || s.globalRole === 'super_admin' ? 'super_admin' : p.globalRole,
    } });
    const auditTenant = actor.tenantId ?? (await tx.membership.findFirst({ where: { userId: p.id }, select: { tenantId: true } }))?.tenantId ?? (await tx.tenant.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } }))?.id;
    if (auditTenant) await audit(tx, { tenantId: auditTenant, actorUserId: actor.userId, action: 'user.merged', resourceType: 'User', resourceId: p.id, before: { primary: p.email, secondary: s.email, secondaryName: s.name }, after: { auto, roleClashes, minorProtected, anyMinor, emailsMoved: moved, rowsMoved, rowsSkipped, rowsDeleted, ledgerRelinked } });
    return { primaryId: p.id, secondaryId: s.id, emailsMoved: moved, rowsMoved, rowsSkipped, roleClashes };
  }, { maxWait: 10_000, timeout: 60_000 });
}

/**
 * The automatic run (docs/IDENTITY_DEDUP_SPEC.md §3.11): certain groups only, capped. A group that cannot be merged
 * becomes a ticket for a Super Admin, and the rest carry on.
 */
export async function autoMergeCertain(actor: { userId: string | null; tenantId: string | null } = { userId: null, tenantId: null }, opts: { dryRun?: boolean } = {}) {
  const { groups, scope, minorIds } = await loadGroups();
  const plan = autoMergePlan(groups, new Set([...scope.values()].filter(a => a.isSuperAdmin).map(a => a.id)), minorIds);
  // Report-only mode (docs/IDENTITY_DEDUP_RESEARCH.md §2e): say what would happen, change nothing, open no tickets.
  if (opts.dryRun) return { dryRun: true as const, wouldMerge: plan.merge.length, wouldMergeAccounts: plan.merge.reduce((n, g) => n + g.memberIds.length - 1, 0), wouldEscalate: plan.escalate.length, deferred: plan.deferred };
  let merged = 0, ticketed = 0;
  const ticket = async (g: DuplicateGroup, reason: TicketReason, note?: string) => { await openTicket({ tenantId: null, requestedById: null, accountIds: g.memberIds, primaryId: g.primaryId, reason, note }); ticketed++; };
  for (const e of plan.escalate) await ticket(e.group, e.reason);
  for (const g of plan.merge) {
    try { for (const id of g.memberIds) if (id !== g.primaryId) { await runMerge(actor, g.primaryId, id, true); merged++; } }
    catch (e) { await ticket(g, 'auto_failed', (e as Error).message); }
  }
  return { merged, ticketed, deferred: plan.deferred };
}

/** Merge one reported group into its primary, or run the automatic merge when `auto` is set (Super Admin). */
export async function mergeDuplicates(ctx: Ctx, input: { primaryId?: string; secondaryIds?: string[]; auto?: boolean }) {
  if (input.auto) { needSuper(ctx); return autoMergeCertain({ userId: ctx.userId, tenantId: ctx.tenantId }); }
  if (!input.primaryId || !input.secondaryIds?.length) throw badRequest('Choose the primary account and the accounts to merge into it.');
  await assertMergeScope(ctx, [input.primaryId, ...input.secondaryIds]); // all or nothing: check every account before moving anything
  const results = [];
  for (const id of input.secondaryIds) results.push(await mergeUsers(ctx, input.primaryId, id));
  return { merged: results.length, results };
}
