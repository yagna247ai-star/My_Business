/** Institution administration: cohorts, invite codes, members/roles, nudges, audit log. Tenant-scoped. */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { ASSIGNABLE, ROLE_LABEL, type Role } from '@/lib/server/rbac';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';

export async function listCohorts(ctx: Ctx) {
  if (!hasPerm(ctx, 'cohort:read')) throw forbidden();
  const cs = await prisma.cohort.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { enrollments: true } } } });
  return cs.map(c => ({ id: c.id, name: c.name, slug: c.slug, inviteCode: hasPerm(ctx, 'cohort:manage') ? c.inviteCode : null, startDate: c.startDate, learners: c._count.enrollments, schedule: c.schedule ? JSON.parse(c.schedule) : null }));
}

export async function createCohort(ctx: Ctx, input: { name: string; startDate?: string | null }) {
  if (!hasPerm(ctx, 'cohort:manage')) throw forbidden();
  const name = input.name.trim(); if (name.length < 3) throw badRequest('Cohort name needs at least 3 characters.');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cohort';
  if (await prisma.cohort.findUnique({ where: { tenantId_slug: { tenantId: ctx.tenantId, slug } } })) throw conflict('A cohort with that name already exists.');
  const inviteCode = `${ctx.tenantSlug.toUpperCase().slice(0, 8)}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const schedule = { weekly: { mondayToFriday: 'Preparation missions', saturday: 'Live workshop', sunday: '4-hour hackathon' }, sessions: [], submissionWindowDays: 7 };
  return prisma.$transaction(async tx => {
    const c = await tx.cohort.create({ data: { tenantId: ctx.tenantId, name, slug, inviteCode, startDate: input.startDate ? new Date(input.startDate) : null, schedule: JSON.stringify(schedule) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'cohort.created', resourceType: 'Cohort', resourceId: c.id, after: { name } });
    return { id: c.id, inviteCode };
  });
}

export async function addSession(ctx: Ctx, cohortId: string, s: { title: string; kind: 'workshop' | 'hackathon' | 'office_hours'; startsAt: string; durationMin: number; liveLink?: string | null }) {
  if (!hasPerm(ctx, 'cohort:manage') && !hasPerm(ctx, 'content:manage')) throw forbidden();
  const c = await prisma.cohort.findFirst({ where: { id: cohortId, tenantId: ctx.tenantId } }); if (!c) throw notFound('Cohort not found.');
  if (Number.isNaN(Date.parse(s.startsAt))) throw badRequest('Give a valid start time.');
  if (s.liveLink && !/^https:\/\/[^\s]+$/.test(s.liveLink)) throw badRequest('Live link must be an https URL.');
  const sched = c.schedule ? JSON.parse(c.schedule) : { sessions: [] };
  sched.sessions = [...(sched.sessions || []), { levelIdx: 1, kind: s.kind, title: s.title.trim(), startsAt: new Date(s.startsAt).toISOString(), durationMin: s.durationMin, liveLink: s.liveLink || null, recordingUrl: null }].sort((a: { startsAt: string }, b: { startsAt: string }) => a.startsAt.localeCompare(b.startsAt));
  await prisma.$transaction(async tx => { await tx.cohort.update({ where: { id: c.id }, data: { schedule: JSON.stringify(sched) } }); await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'session.scheduled', resourceType: 'Cohort', resourceId: c.id, after: s }); });
  return { ok: true };
}

export async function listMembers(ctx: Ctx) {
  if (!hasPerm(ctx, 'members:read')) throw forbidden();
  const ms = await prisma.membership.findMany({ where: { tenantId: ctx.tenantId }, include: { user: { select: { id: true, name: true, email: true, createdAt: true } }, role: true }, orderBy: { createdAt: 'asc' } });
  const settings = await prisma.userSetting.findMany({ where: { tenantId: ctx.tenantId }, select: { userId: true, ageBand: true, guardianConsent: true } });
  const st = new Map(settings.map(s => [s.userId, s]));
  return ms.map(m => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role.code, roleLabel: ROLE_LABEL[m.role.code as Role] || m.role.code, status: m.status, cohortId: m.cohortId, joinedAt: m.joinedAt, minor: (st.get(m.userId)?.ageBand || 'adult') !== 'adult', guardianConsent: st.get(m.userId)?.guardianConsent || 'not_required' }));
}

export async function changeRole(ctx: Ctx, userId: string, role: string) {
  if (!hasPerm(ctx, 'members:manage')) throw forbidden();
  if (userId === ctx.userId) throw forbidden('You cannot change your own role.');
  if (!ASSIGNABLE.includes(role as Role)) throw badRequest('That role cannot be assigned here.');
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } }, include: { role: true } });
  if (!m) throw notFound('Member not found in this institution.');
  if (m.role.code === 'super_admin') throw forbidden('Platform administrators are managed centrally.');
  const r = await prisma.role.findUniqueOrThrow({ where: { code: role } });
  await prisma.$transaction(async tx => {
    await tx.membership.update({ where: { id: m.id }, data: { roleId: r.id } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'member.role_changed', resourceType: 'Membership', resourceId: m.id, before: { role: m.role.code }, after: { role } });
    await notify(tx, ctx.tenantId, userId, 'role_changed', { title: `Your role is now ${ROLE_LABEL[role as Role]}`, tone: 'info' });
  });
  return { ok: true };
}

export async function setMemberStatus(ctx: Ctx, userId: string, status: 'active' | 'suspended') {
  if (!hasPerm(ctx, 'members:manage')) throw forbidden();
  if (userId === ctx.userId) throw forbidden('You cannot suspend yourself.');
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!m) throw notFound('Member not found in this institution.');
  await prisma.$transaction(async tx => { await tx.membership.update({ where: { id: m.id }, data: { status } }); await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `member.${status}`, resourceType: 'Membership', resourceId: m.id }); });
  return { ok: true };
}

export async function nudge(ctx: Ctx, userId: string, message: string) {
  if (!hasPerm(ctx, 'members:read')) throw forbidden();
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!m) throw notFound('Learner not found in this institution.');
  const recent = await prisma.notification.findFirst({ where: { tenantId: ctx.tenantId, userId, template: 'mentor_nudge', createdAt: { gte: new Date(Date.now() - 24 * 3600e3) } } });
  if (recent) throw conflict('This learner was already nudged in the last 24 hours.');
  const text = message.trim().slice(0, 500); if (text.length < 10) throw badRequest('Write a short message (10+ characters).');
  await prisma.$transaction(async tx => { await notify(tx, ctx.tenantId, userId, 'mentor_nudge', { title: `A message from ${ctx.name}`, body: text, href: '/dashboard', tone: 'info' }); await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'mentor.nudge_sent', resourceType: 'User', resourceId: userId }); });
  return { ok: true };
}

export async function auditLog(ctx: Ctx, q = '', take = 200) {
  if (!hasPerm(ctx, 'audit:read')) throw forbidden();
  const rows = await prisma.auditLog.findMany({ where: { tenantId: ctx.tenantId, ...(q ? { OR: [{ action: { contains: q } }, { resourceType: { contains: q } }] } : {}) }, orderBy: { createdAt: 'desc' }, take, include: { actor: { select: { name: true, email: true } } } });
  return rows.map(r => ({ id: r.id, at: r.createdAt, actor: r.actor?.name || r.actor?.email || 'system', action: r.action, resource: r.resourceType, resourceId: r.resourceId }));
}
