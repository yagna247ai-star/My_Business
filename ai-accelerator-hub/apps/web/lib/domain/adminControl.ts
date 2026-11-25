/**
 * Super Admin control centre (docs/SUPER_ADMIN_CONTROL_SPEC.md): passwords, forced change, bulk actions,
 * CSV import and per-person access. Passwords are bcrypt hashes and are never readable by anyone.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { audit, notify } from '@/lib/server/audit';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { ALL_PERMISSIONS, MATRIX, ROLE_LABEL, effectivePerms, isRole, type Permission, type Role } from '@/lib/server/rbac';
import { clearLoginFailures } from '@/lib/auth';
import { passwordProblem, isAssignable } from './settingsRules';
import { normaliseArea } from './areas';
import { issueResetLink } from './passwordReset';
import { RESET_TTL_MS } from './passwordResetCore';
import { MODULES, levelsOf, moduleLevel, permsForLevels, type Level, type ModuleKey } from './accessModules';
import { BULK_ACTIONS, bulkSkipReason, canUseBulkAction, parseMembersCsv, PERMISSION_INFO, type BulkAction } from './adminControlCore';

const INVITE_TTL_MS = 7 * 24 * 3600_000;
const needManage = (ctx: Ctx) => { if (!hasPerm(ctx, 'members:manage')) throw forbidden('You need the “manage people” permission.'); };
const needSuper = (ctx: Ctx) => { if (!ctx.superAdmin) throw forbidden('Only a Super Admin can do this.'); };

async function memberOrThrow(ctx: Ctx, userId: string) {
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } }, include: { role: true, user: { select: { id: true, email: true, name: true, globalRole: true } } } });
  if (!m) throw notFound('This person is not in this institution.');
  return m;
}

/* ---------- passwords ---------- */

/** Super Admin: set a password (optionally must change at next sign-in), or with no password email a reset link. */
export async function adminSetPassword(ctx: Ctx, userId: string, input: { password?: string; mustChange?: boolean }) {
  needSuper(ctx);
  const m = await memberOrThrow(ctx, userId);
  if (input.password) {
    const why = passwordProblem(input.password);
    if (why) throw badRequest(why, { password: why });
    const hash = await bcrypt.hash(input.password, 12);
    await prisma.$transaction(async tx => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash: hash, mustChangePassword: !!input.mustChange } });
      await tx.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
      await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'admin.password_set', resourceType: 'User', resourceId: userId, after: { email: m.user.email, mustChange: !!input.mustChange } });
      await notify(tx, ctx.tenantId, userId, 'password_set_by_admin', { title: 'An admin set a new password for you', body: input.mustChange ? 'You will be asked to choose your own at your next sign-in.' : undefined, tone: 'info' });
    });
    clearLoginFailures(m.user.email);
    return { ok: true as const, mode: 'set' as const };
  }
  await sendAdminResetLink(ctx, userId);
  return { ok: true as const, mode: 'link' as const };
}

/** Super Admin or Institution Admin: email a reset link (30 minutes). */
export async function sendAdminResetLink(ctx: Ctx, userId: string) {
  needManage(ctx);
  const m = await memberOrThrow(ctx, userId);
  if (m.user.globalRole === 'super_admin' && !ctx.superAdmin) throw forbidden('Only a Super Admin can change a Super Admin.');
  await issueResetLink(m.user, { ttlMs: RESET_TTL_MS, kind: 'admin' });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'admin.password_reset_sent', resourceType: 'User', resourceId: userId, after: { email: m.user.email } });
  return { ok: true as const };
}

export async function forcePasswordChange(ctx: Ctx, userId: string, on = true) {
  needSuper(ctx);
  const m = await memberOrThrow(ctx, userId);
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: userId }, data: { mustChangePassword: on } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: on ? 'admin.force_password_change' : 'admin.force_password_change_cleared', resourceType: 'User', resourceId: userId, after: { email: m.user.email } });
  });
  return { ok: true as const };
}

/** Anyone signed in: change their own password (needed after a forced change). */
export async function changeOwnPassword(ctx: Ctx, current: string, next: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { passwordHash: true, mustChangePassword: true, email: true } });
  // A person who never had a password (GitHub sign-in, CSV import) may set one without a current password.
  if (u.passwordHash && !(await bcrypt.compare(current || '', u.passwordHash))) throw badRequest('Your current password is not right.', { current: 'Check your current password.' });
  const why = passwordProblem(next);
  if (why) throw badRequest(why, { password: why });
  if (u.passwordHash && await bcrypt.compare(next, u.passwordHash)) throw badRequest('Choose a password different from your current one.', { password: 'Use a new password.' });
  const hash = await bcrypt.hash(next, 12);
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: ctx.userId }, data: { passwordHash: hash, mustChangePassword: false } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'auth.password_changed', resourceType: 'User', resourceId: ctx.userId });
  });
  return { ok: true as const };
}

/* ---------- bulk ---------- */

export async function bulkPeople(ctx: Ctx, input: { userIds: string[]; action: BulkAction; value?: string }) {
  needManage(ctx);
  if (!BULK_ACTIONS.includes(input.action)) throw badRequest('Unknown action.');
  if (!canUseBulkAction(ctx.superAdmin, input.action, input.value)) throw forbidden(input.action === 'force_change' ? 'Only a Super Admin can force password changes.' : 'Only a Super Admin can make Institution Admins.');
  const ids = [...new Set(input.userIds)].slice(0, 500);
  let value: string | null | undefined = input.value;
  if (input.action === 'set_role' && !isAssignable(value || '')) throw badRequest('Choose a role.');
  if (input.action === 'set_area') { value = normaliseArea(value); if (!value) throw badRequest('Choose your area from the list.'); }
  if (input.action === 'set_cohort' && value) { const c = await prisma.cohort.findFirst({ where: { id: value, tenantId: ctx.tenantId } }); if (!c) throw badRequest('That cohort is not in this institution.'); }
  const roleId = input.action === 'set_role' ? (await prisma.role.findUniqueOrThrow({ where: { code: value! } })).id : null;

  const members = await prisma.membership.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } }, include: { user: { select: { id: true, email: true, name: true, globalRole: true } }, role: true } });
  const skipped: { email: string; reason: string }[] = [];
  let done = 0;
  for (const m of members) {
    const why = bulkSkipReason({ actorId: ctx.userId, actorSuper: ctx.superAdmin, targetId: m.userId, targetSuper: m.user.globalRole === 'super_admin' || m.role.code === 'super_admin' });
    if (why) { skipped.push({ email: m.user.email, reason: why }); continue; }
    try {
      if (input.action === 'reset_link') await issueResetLink(m.user, { ttlMs: RESET_TTL_MS, kind: 'admin' });
      await prisma.$transaction(async tx => {
        switch (input.action) {
          case 'suspend': await tx.membership.update({ where: { id: m.id }, data: { status: 'suspended' } }); break;
          case 'activate': await tx.membership.update({ where: { id: m.id }, data: { status: 'active' } }); break;
          case 'force_change': await tx.user.update({ where: { id: m.userId }, data: { mustChangePassword: true } }); break;
          case 'set_role': await tx.membership.update({ where: { id: m.id }, data: { roleId: roleId! } }); break;
          case 'set_cohort': await tx.membership.update({ where: { id: m.id }, data: { cohortId: value || null } }); await tx.enrollment.updateMany({ where: { tenantId: ctx.tenantId, userId: m.userId, state: 'active' }, data: { cohortId: value || null } }); break;
          case 'set_area': await tx.user.update({ where: { id: m.userId }, data: { area: value! } }); break;
          case 'remove': await tx.membership.delete({ where: { id: m.id } }); break;
          case 'reset_link': break;
        }
        await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `admin.bulk.${input.action}`, resourceType: 'Membership', resourceId: m.id, before: { role: m.role.code, status: m.status }, after: { email: m.user.email, value: value ?? null } });
        if (input.action === 'set_role') await notify(tx, ctx.tenantId, m.userId, 'role_changed', { title: `Your role is now ${ROLE_LABEL[value as Role]}`, tone: 'info' });
      });
      done++;
    } catch (e) { skipped.push({ email: m.user.email, reason: (e as Error).message.slice(0, 160) }); }
  }
  const missing = ids.length - members.length;
  return { done, skipped, notFound: missing };
}

/* ---------- CSV import ---------- */

export async function importPeople(ctx: Ctx, csv: string, dryRun: boolean) {
  needManage(ctx);
  if (csv.length > 1_000_000) throw badRequest('The file is larger than 1 MB. Split it into smaller files.');
  const { rows, errors } = parseMembersCsv(csv);
  if (!ctx.superAdmin) for (const r of rows) if (r.role === 'tenant_admin') errors.push({ line: r.line, message: 'Only a Super Admin can make Institution Admins.' });
  const cohorts = await prisma.cohort.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, name: true, inviteCode: true } });
  const cohortOf = (c: string | null) => c ? cohorts.find(x => x.name.toLowerCase() === c.toLowerCase() || x.inviteCode?.toLowerCase() === c.toLowerCase())?.id ?? undefined : null;
  for (const r of rows) if (r.cohort && cohortOf(r.cohort) === undefined) errors.push({ line: r.line, message: `No cohort called “${r.cohort}” in this institution.` });
  const bad = new Set(errors.map(e => e.line));
  const good = rows.filter(r => !bad.has(r.line));
  if (dryRun || errors.length && !good.length) return { dryRun: true, valid: good.length, errors: errors.sort((a, b) => a.line - b.line), created: 0, updated: 0, emailed: 0 };

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { name: true } });
  const roles = new Map((await prisma.role.findMany()).map(r => [r.code, r.id]));
  let created = 0, updated = 0, emailed = 0; const failed: { line: number; message: string }[] = [];
  for (const r of good) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: r.email }, select: { id: true, email: true, name: true, globalRole: true } });
      if (existing?.globalRole === 'super_admin' && !ctx.superAdmin) { failed.push({ line: r.line, message: 'That is a Super Admin account.' }); continue; }
      const user = existing ?? await prisma.user.create({ data: { email: r.email, name: r.name, area: r.area, emailVerified: false } });
      const cohortId = cohortOf(r.cohort) ?? null;
      const had = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: user.id } } });
      await prisma.$transaction(async tx => {
        if (had) await tx.membership.update({ where: { id: had.id }, data: { roleId: roles.get(r.role)!, ...(r.cohort ? { cohortId } : {}), status: 'active' } });
        else {
          await tx.membership.create({ data: { tenantId: ctx.tenantId, userId: user.id, roleId: roles.get(r.role)!, cohortId, status: 'active' } });
          await tx.userSetting.upsert({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: user.id } }, update: {}, create: { tenantId: ctx.tenantId, userId: user.id, ageBand: 'adult', guardianConsent: 'not_required', leaderboardVisibility: 'cohort', globalOptIn: false } });
        }
        if (existing && r.area) await tx.user.update({ where: { id: user.id }, data: { area: r.area } });
        await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: had ? 'admin.import.updated' : 'admin.import.created', resourceType: 'User', resourceId: user.id, after: { email: r.email, role: r.role } });
      });
      if (had) updated++; else created++;
      if (!existing || !had) {
        try { await issueResetLink({ id: user.id, email: r.email, name: r.name }, { ttlMs: INVITE_TTL_MS, kind: 'invite', institution: tenant.name }); emailed++; }
        catch (e) { failed.push({ line: r.line, message: `Added, but the invite email failed: ${(e as Error).message.slice(0, 120)}` }); }
      }
    } catch (e) { failed.push({ line: r.line, message: (e as Error).message.slice(0, 160) }); }
  }
  return { dryRun: false, valid: good.length, errors: [...errors, ...failed].sort((a, b) => a.line - b.line), created, updated, emailed };
}

/* ---------- access (per-person permissions) ---------- */

export async function getAccess(ctx: Ctx, userId: string) {
  needSuper(ctx);
  const m = await memberOrThrow(ctx, userId);
  const role = m.role.code;
  const eff = new Set(effectivePerms(role, m.grants, m.revokes));
  const roleSet = new Set(isRole(role) ? MATRIX[role] : []);
  const parse = (j: string) => { try { return new Set<string>(JSON.parse(j)); } catch { return new Set<string>(); } };
  const g = parse(m.grants), r = parse(m.revokes);
  return {
    person: { id: m.userId, name: m.user.name || m.user.email, email: m.user.email, role, roleLabel: isRole(role) ? ROLE_LABEL[role] : role },
    modules: MODULES.map(md => ({ key: md.key, label: md.label, info: md.info, hasView: md.view.length > 0, roleLevel: moduleLevel(isRole(role) ? MATRIX[role] : [], md.key), level: moduleLevel([...eff], md.key) })),
    permissions: ALL_PERMISSIONS.map(p => ({ key: p, info: PERMISSION_INFO[p], fromRole: roleSet.has(p), effective: eff.has(p), mode: g.has(p) ? 'grant' : r.has(p) ? 'revoke' : 'role' as 'grant' | 'revoke' | 'role' })),
  };
}

/** Save access as module levels (No access / View / Manage), or the advanced per-permission modes. */
export async function setAccess(ctx: Ctx, userId: string, input: { levels?: Record<string, Level>; modes?: Record<string, 'grant' | 'revoke' | 'role'> }) {
  needSuper(ctx);
  const m = await memberOrThrow(ctx, userId);
  if (m.role.code === 'super_admin') throw badRequest('Super Admins always have every permission.');
  let grants: Permission[] = [], revokes: Permission[] = [];
  if (input.levels) {
    const keys = new Set(MODULES.map(x => x.key));
    const levels = Object.fromEntries(Object.entries(input.levels).filter(([k]) => keys.has(k as ModuleKey))) as Record<ModuleKey, Level>;
    ({ grants, revokes } = permsForLevels(m.role.code, { ...levelsOf(isRole(m.role.code) ? MATRIX[m.role.code] : []), ...levels }));
  } else {
    for (const p of ALL_PERMISSIONS) { const v = input.modes?.[p]; if (v === 'grant') grants.push(p); else if (v === 'revoke') revokes.push(p); }
  }
  await prisma.$transaction(async tx => {
    await tx.membership.update({ where: { id: m.id }, data: { grants: JSON.stringify(grants), revokes: JSON.stringify(revokes) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'admin.access_changed', resourceType: 'Membership', resourceId: m.id, before: { grants: m.grants, revokes: m.revokes }, after: { grants, revokes } });
    await notify(tx, ctx.tenantId, userId, 'access_changed', { title: 'Your access was updated', body: 'A Super Admin changed what you can do. Refresh to see it.', tone: 'info' });
  });
  return getAccess(ctx, userId);
}
