/**
 * Admin Settings: create / read / update / delete for Institute, People, Cohorts and Talent.
 *
 * Who can do what:
 *  - Institute: Institution Admin edits their own institution's name and contact details ('institute:manage').
 *    Super Admin also lists, creates, renames, changes plan/status of, and deletes any institution.
 *  - People: 'members:manage' (Institution Admin, Super Admin). Removing a person ends their membership in
 *    this institution only; their account and other institutions are untouched.
 *  - Cohorts: 'cohort:manage'. Deleting a cohort keeps learners and their progress (enrollments are unlinked).
 *  - Talent: opportunities need 'talent:post'. Talent profiles need 'members:manage', and admins can only
 *    HIDE a profile (make it private) or remove it, never expose it: visibility is the learner's consent.
 * Every change is audited.
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { shareCohortTx } from './sharing';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { ROLE_LABEL, type Role } from '@/lib/server/rbac';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { DEFAULT_CODE, INSTITUTION_TYPES, codeProblem, normaliseCode, suggestCode } from './institutionsCore';
import { audit, notify } from '@/lib/server/audit';
import { defaultJourney, enrollInJourney, parseSettings } from './journeyAccess';
import {
  SLUG_RE, slugify, passwordProblem, mergeInstituteProfile, pickInstituteProfile, memberActionProblem, isAssignable,
  instituteDeleteProblem, cohortDatesProblem, cleanSkills, PLANS, INSTITUTE_STATUSES, OPPORTUNITY_KINDS,
  type InstituteProfile,
} from './settingsRules';

const need = (ok: boolean) => { if (!ok) throw forbidden(); };
const parseList = (raw: string): string[] => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v.filter(s => typeof s === 'string') : []; } catch { return []; } };

/* ─────────────────────────── Institute ─────────────────────────── */

/** Institution logo: a small inline image (PNG, JPEG, WebP or SVG-free), so it shows in every institution's switcher. */
function checkLogo(dataUrl: string): string {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw badRequest('The logo must be a PNG, JPEG or WebP image.', { logo: 'PNG, JPEG or WebP.' });
  if (m[2].length > 270_000) throw badRequest('The logo must be under 200 KB. Use a smaller image (e.g. 256 × 256).', { logo: 'Under 200 KB.' });
  return dataUrl;
}

async function instituteRow(id: string) {
  const t = await prisma.tenant.findUnique({ where: { id }, include: { _count: { select: { memberships: true, cohorts: true, journeys: true, orders: true } } } });
  if (!t) throw notFound('Institution not found.');
  return { id: t.id, name: t.name, slug: t.slug, code: t.code, type: t.type, logoUrl: t.logoUrl, plan: t.plan, status: t.status, createdAt: t.createdAt, profile: pickInstituteProfile(parseSettings(t.settings)), counts: { members: t._count.memberships, cohorts: t._count.cohorts, journeys: t._count.journeys, orders: t._count.orders } };
}

export async function getInstitute(ctx: Ctx) {
  need(hasPerm(ctx, 'institute:manage'));
  return instituteRow(ctx.tenantId);
}

export async function listInstitutes(ctx: Ctx) {
  need(ctx.superAdmin);
  const ts = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { memberships: true, cohorts: true, journeys: true, orders: true } } } });
  return ts.map(t => ({ id: t.id, name: t.name, slug: t.slug, code: t.code, type: t.type, logoUrl: t.logoUrl, city: (pickInstituteProfile(parseSettings(t.settings)).city ?? null), profile: pickInstituteProfile(parseSettings(t.settings)), plan: t.plan, status: t.status, createdAt: t.createdAt, current: t.id === ctx.tenantId, counts: { members: t._count.memberships, cohorts: t._count.cohorts, journeys: t._count.journeys, orders: t._count.orders } }));
}

export async function createInstitute(ctx: Ctx, input: { name: string; slug?: string; plan?: string; adminEmail?: string; code?: string; type?: string; logoUrl?: string | null } & InstituteProfile) {
  need(ctx.superAdmin);
  const name = input.name.trim();
  if (name.length < 3) throw badRequest('Institution name needs at least 3 characters.', { name: 'At least 3 characters.' });
  const slug = input.slug?.trim() ? input.slug.trim().toLowerCase() : slugify(name, 'institute');
  if (!SLUG_RE.test(slug)) throw badRequest('Short name can use lowercase letters, numbers and dashes.', { slug: 'Lowercase letters, numbers and dashes.' });
  const plan = input.plan || 'free';
  if (!(PLANS as readonly string[]).includes(plan)) throw badRequest('Plan is free, pro or enterprise.');
  if (await prisma.tenant.findUnique({ where: { slug } })) throw conflict('An institution with that short name already exists.');
  const codes = new Set((await prisma.tenant.findMany({ select: { code: true } })).map(x => x.code).filter((x): x is string => !!x));
  const code = input.code?.trim() ? normaliseCode(input.code) : suggestCode(name, codes);
  const codeWhy = codeProblem(code); if (codeWhy) throw badRequest(codeWhy, { code: codeWhy });
  if (codes.has(code)) throw conflict(`The code ${code} is already used by another institution.`);
  const type = (INSTITUTION_TYPES as readonly string[]).includes(input.type ?? '') ? input.type! : 'other';
  const logoUrl = input.logoUrl ? checkLogo(input.logoUrl) : null;
  const adminEmail = input.adminEmail?.trim().toLowerCase();
  const admin = adminEmail ? await prisma.user.findUnique({ where: { email: adminEmail } }) : null;
  if (adminEmail && !admin) throw badRequest('No account uses that admin email yet. Leave it empty and add the admin later in People.', { adminEmail: 'No account with this email.' });
  const adminRole = admin ? await prisma.role.findUniqueOrThrow({ where: { code: 'tenant_admin' } }) : null;
  return prisma.$transaction(async tx => {
    const t = await tx.tenant.create({ data: { name, slug, code, type, logoUrl, plan, status: 'active', settings: JSON.stringify(mergeInstituteProfile({}, input)) } });
    if (admin && adminRole) {
      await tx.membership.create({ data: { tenantId: t.id, userId: admin.id, roleId: adminRole.id, status: 'active' } });
      await tx.userSetting.create({ data: { tenantId: t.id, userId: admin.id } });
      await notify(tx, t.id, admin.id, 'role_changed', { title: `You are now an Institution Admin of ${name}`, tone: 'info' });
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'tenant.created', resourceType: 'Tenant', resourceId: t.id, after: { name, slug, plan, admin: adminEmail ?? null } });
    return { id: t.id, slug, code };
  });
}

export async function updateInstitute(ctx: Ctx, id: string, input: { name?: string; slug?: string; plan?: string; status?: string; code?: string; type?: string; logoUrl?: string | null } & InstituteProfile) {
  const own = id === ctx.tenantId;
  need(ctx.superAdmin || (own && hasPerm(ctx, 'institute:manage')));
  if (!ctx.superAdmin && (input.slug !== undefined || input.plan !== undefined || input.status !== undefined || input.code !== undefined)) throw forbidden('Only a Super Admin can change the code, short name, plan or status.');
  const t = await prisma.tenant.findUnique({ where: { id } });
  if (!t) throw notFound('Institution not found.');
  const data: { name?: string; slug?: string; plan?: string; status?: string; settings?: string; code?: string; type?: string; logoUrl?: string | null } = {};
  if (input.code !== undefined && normaliseCode(input.code) !== t.code) {
    const c = normaliseCode(input.code); const why = codeProblem(c); if (why) throw badRequest(why, { code: why });
    if (t.code === DEFAULT_CODE) throw badRequest('AIHUB is the default code for learners without one; it cannot be changed.');
    if (await prisma.tenant.findFirst({ where: { code: c, id: { not: id } } })) throw conflict(`The code ${c} is already used by another institution.`);
    data.code = c;
  }
  if (input.type !== undefined) { if (!(INSTITUTION_TYPES as readonly string[]).includes(input.type)) throw badRequest('Choose the type of institution.'); data.type = input.type; }
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl ? checkLogo(input.logoUrl) : null;
  if (input.name !== undefined) { const n = input.name.trim(); if (n.length < 3) throw badRequest('Institution name needs at least 3 characters.', { name: 'At least 3 characters.' }); data.name = n.slice(0, 120); }
  if (input.slug !== undefined && input.slug !== t.slug) {
    const s = input.slug.trim().toLowerCase();
    if (!SLUG_RE.test(s)) throw badRequest('Short name can use lowercase letters, numbers and dashes.', { slug: 'Lowercase letters, numbers and dashes.' });
    if (await prisma.tenant.findUnique({ where: { slug: s } })) throw conflict('An institution with that short name already exists.');
    data.slug = s;
  }
  if (input.plan !== undefined) { if (!(PLANS as readonly string[]).includes(input.plan)) throw badRequest('Plan is free, pro or enterprise.'); data.plan = input.plan; }
  if (input.status !== undefined) {
    if (!(INSTITUTE_STATUSES as readonly string[]).includes(input.status)) throw badRequest('Status is active or suspended.');
    if (own && input.status !== 'active') throw badRequest('You cannot deactivate the institution you are signed in to.');
    if (t.code === DEFAULT_CODE && input.status !== 'active') throw badRequest('AI Accelerator Hub (AIHUB) is the home for learners without a code; it cannot be suspended.');
    data.status = input.status;
  }
  if (input.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail.trim())) throw badRequest('Enter a valid contact email.', { contactEmail: 'Not a valid email.' });
  if (input.website && !/^https?:\/\/\S+$/i.test(input.website.trim())) throw badRequest('Website must start with http:// or https://', { website: 'Start with https://' });
  for (const k of ['contactEmail', 'phone', 'website', 'city'] as const) if ((input[k]?.length ?? 0) > 200) throw badRequest('That value is too long.');
  if ((input.about?.length ?? 0) > 1500) throw badRequest('Keep the description under 1,500 characters.');
  if (input.pincode && !/^\d{6}$/.test(input.pincode.trim())) throw badRequest('PIN code has 6 digits.', { pincode: '6 digits.' });
  if (input.established && !/^(18|19|20)\d{2}$/.test(input.established.trim())) throw badRequest('Enter the year it was established, e.g. 2009.', { established: 'A year, e.g. 2009.' });
  const before = parseSettings(t.settings);
  const after = mergeInstituteProfile(before, input);
  if (JSON.stringify(after) !== JSON.stringify(before)) data.settings = JSON.stringify(after);
  if (!Object.keys(data).length) return { ok: true as const };
  await prisma.$transaction(async tx => {
    await tx.tenant.update({ where: { id }, data });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'tenant.updated', resourceType: 'Tenant', resourceId: id, before: { name: t.name, slug: t.slug, code: t.code, plan: t.plan, status: t.status }, after: { ...data, settings: undefined, logoUrl: data.logoUrl === undefined ? undefined : !!data.logoUrl } });
  });
  return { ok: true as const };
}

export async function deleteInstitute(ctx: Ctx, id: string) {
  need(ctx.superAdmin);
  const t = await instituteRow(id);
  if (t.code === DEFAULT_CODE) throw conflict('AI Accelerator Hub (AIHUB) is the home for learners without a code; it cannot be deleted.');
  const problem = instituteDeleteProblem({ isCurrent: id === ctx.tenantId, ...t.counts });
  if (problem) throw conflict(problem);
  try {
    await prisma.tenant.delete({ where: { id } });
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2003') throw conflict('This institution still has records linked to it. Deactivate it instead.');
    throw e;
  }
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'tenant.deleted', resourceType: 'Tenant', resourceId: id, before: { name: t.name, slug: t.slug } });
  return { ok: true as const };
}

/* ─────────────────────────── People ─────────────────────────── */

async function cohortInTenant(ctx: Ctx, cohortId: string | null | undefined) {
  if (!cohortId) return null;
  const c = await prisma.cohort.findFirst({ where: { id: cohortId, tenantId: ctx.tenantId }, select: { id: true } });
  if (!c) throw badRequest('That cohort is not in this institution.', { cohortId: 'Choose a cohort from the list.' });
  return c.id;
}

export async function createPerson(ctx: Ctx, input: { name: string; email: string; role: string; password?: string; cohortId?: string | null }) {
  need(hasPerm(ctx, 'members:manage'));
  const name = input.name.trim(); const email = input.email.trim().toLowerCase();
  if (name.length < 2) throw badRequest('Enter the person’s full name.', { name: 'At least 2 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw badRequest('Enter a valid email address.', { email: 'Not a valid email.' });
  if (!isAssignable(input.role)) throw badRequest('That role cannot be assigned here.', { role: 'Choose a role from the list.' });
  const cohortId = await cohortInTenant(ctx, input.cohortId);
  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.role } });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: existing.id } } })) throw conflict('This person is already a member of this institution.');
  let hash: string | null = null;
  if (!existing) {
    const p = passwordProblem(input.password ?? '');
    if (p) throw badRequest(`Starting password: ${p}`, { password: p });
    hash = await bcrypt.hash(input.password!, 11);
  }
  const journey = input.role === 'learner' ? await defaultJourney(prisma, ctx.tenantId) : null;
  return prisma.$transaction(async tx => {
    const user = existing ?? await tx.user.create({ data: { email, name, passwordHash: hash, emailVerified: false } });
    await tx.membership.create({ data: { tenantId: ctx.tenantId, userId: user.id, roleId: role.id, cohortId, status: 'active' } });
    await tx.userSetting.upsert({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: user.id } }, update: {}, create: { tenantId: ctx.tenantId, userId: user.id } });
    if (input.role === 'learner') {
      await tx.streak.upsert({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: user.id } }, update: {}, create: { tenantId: ctx.tenantId, userId: user.id } });
      if (journey) await enrollInJourney(tx, { tenantId: ctx.tenantId, userId: user.id, journeyId: journey.id, cohortId });
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'member.created', resourceType: 'User', resourceId: user.id, after: { email, role: input.role, cohortId, existingAccount: !!existing } });
    await notify(tx, ctx.tenantId, user.id, 'welcome', { title: `You were added to ${ctx.tenantName} as ${ROLE_LABEL[input.role as Role]}`, tone: 'info' });
    return { userId: user.id, existingAccount: !!existing };
  }).catch((e: unknown) => {
    if ((e as { code?: string })?.code === 'P2002') throw conflict('An account with this email already exists.');
    throw e;
  });
}

export async function updatePerson(ctx: Ctx, userId: string, input: { name?: string; role?: string; status?: 'active' | 'suspended'; cohortId?: string | null; area?: string }) {
  need(hasPerm(ctx, 'members:manage'));
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } }, include: { role: true, user: { select: { name: true, area: true } } } });
  if (!m) throw notFound('Member not found in this institution.');
  const problem = memberActionProblem({ actorId: ctx.userId, targetId: userId, targetRole: m.role.code });
  if (problem) throw forbidden(problem);
  const data: { roleId?: string; status?: string; cohortId?: string | null } = {};
  let newRole: string | undefined;
  if (input.role !== undefined && input.role !== m.role.code) {
    if (!isAssignable(input.role)) throw badRequest('That role cannot be assigned here.');
    data.roleId = (await prisma.role.findUniqueOrThrow({ where: { code: input.role } })).id; newRole = input.role;
  }
  if (input.status !== undefined && input.status !== m.status) data.status = input.status;
  if (input.cohortId !== undefined && input.cohortId !== m.cohortId) data.cohortId = await cohortInTenant(ctx, input.cohortId);
  const name = input.name?.trim();
  if (name !== undefined && name.length < 2) throw badRequest('Enter the person’s full name.', { name: 'At least 2 characters.' });
  await prisma.$transaction(async tx => {
    if (Object.keys(data).length) await tx.membership.update({ where: { id: m.id }, data });
    if (data.cohortId !== undefined) await tx.enrollment.updateMany({ where: { tenantId: ctx.tenantId, userId, state: 'active' }, data: { cohortId: data.cohortId } });
    if (name && name !== m.user.name) await tx.user.update({ where: { id: userId }, data: { name: name.slice(0, 100) } });
    const area = input.area !== undefined && input.area !== m.user.area ? input.area : undefined; // already validated by areaSchema
    if (area) await tx.user.update({ where: { id: userId }, data: { area } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'member.updated', resourceType: 'Membership', resourceId: m.id, before: { role: m.role.code, status: m.status, cohortId: m.cohortId, name: m.user.name, area: m.user.area }, after: { role: newRole, status: data.status, cohortId: data.cohortId, name, area } });
    if (newRole) await notify(tx, ctx.tenantId, userId, 'role_changed', { title: `Your role is now ${ROLE_LABEL[newRole as Role]}`, tone: 'info' });
  });
  return { ok: true as const };
}

export async function removePerson(ctx: Ctx, userId: string) {
  need(hasPerm(ctx, 'members:manage'));
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } }, include: { role: true, user: { select: { email: true } } } });
  if (!m) throw notFound('Member not found in this institution.');
  const problem = memberActionProblem({ actorId: ctx.userId, targetId: userId, targetRole: m.role.code });
  if (problem) throw forbidden(problem);
  await prisma.$transaction(async tx => {
    await tx.membership.delete({ where: { id: m.id } });
    await tx.enrollment.updateMany({ where: { tenantId: ctx.tenantId, userId, state: 'active' }, data: { state: 'paused' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'member.removed', resourceType: 'Membership', resourceId: m.id, before: { email: m.user.email, role: m.role.code } });
  });
  return { ok: true as const };
}

/* ─────────────────────────── Cohorts ─────────────────────────── */

export async function listCohortsAdmin(ctx: Ctx) {
  need(hasPerm(ctx, 'cohort:read'));
  const cs = await prisma.cohort.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { enrollments: true, teams: true } } } });
  const manage = hasPerm(ctx, 'cohort:manage');
  return cs.map(c => ({ id: c.id, name: c.name, slug: c.slug, startDate: c.startDate, endDate: c.endDate, maxSize: c.maxSize, inviteCode: manage ? c.inviteCode : null, learners: c._count.enrollments, teams: c._count.teams, createdAt: c.createdAt }));
}

const newInviteCode = (tenantSlug: string) => `${tenantSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'HUB'}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

function cohortSize(maxSize: number | null | undefined) {
  if (maxSize === null || maxSize === undefined) return maxSize;
  if (!Number.isInteger(maxSize) || maxSize < 1 || maxSize > 10000) throw badRequest('Maximum size is a whole number from 1 to 10000.', { maxSize: '1 to 10000.' });
  return maxSize;
}

export async function createCohortAdmin(ctx: Ctx, input: { name: string; startDate?: string | null; endDate?: string | null; maxSize?: number | null }) {
  need(hasPerm(ctx, 'cohort:manage'));
  const name = input.name.trim(); if (name.length < 3) throw badRequest('Cohort name needs at least 3 characters.', { name: 'At least 3 characters.' });
  const dp = cohortDatesProblem(input.startDate, input.endDate); if (dp) throw badRequest(dp);
  const maxSize = cohortSize(input.maxSize);
  const slug = slugify(name, 'cohort');
  if (await prisma.cohort.findUnique({ where: { tenantId_slug: { tenantId: ctx.tenantId, slug } } })) throw conflict('A cohort with that name already exists.');
  const schedule = { weekly: { mondayToFriday: 'Preparation missions', saturday: 'Live workshop', sunday: '4-hour hackathon' }, sessions: [], submissionWindowDays: 7 };
  return prisma.$transaction(async tx => {
    const c = await tx.cohort.create({ data: { tenantId: ctx.tenantId, name: name.slice(0, 120), slug, inviteCode: newInviteCode(ctx.tenantSlug), startDate: input.startDate ? new Date(input.startDate) : null, endDate: input.endDate ? new Date(input.endDate) : null, maxSize: maxSize ?? null, schedule: JSON.stringify(schedule) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'cohort.created', resourceType: 'Cohort', resourceId: c.id, after: { name } });
    if (ctx.superAdmin) await shareCohortTx(tx, ctx, c.id); // docs/INSTITUTION_SHARING_SPEC.md AC-4
    return { id: c.id, inviteCode: c.inviteCode };
  }, { timeout: 30_000, maxWait: 10_000 });
}

export async function updateCohortAdmin(ctx: Ctx, id: string, input: { name?: string; startDate?: string | null; endDate?: string | null; maxSize?: number | null; regenerateInvite?: boolean }) {
  need(hasPerm(ctx, 'cohort:manage'));
  const c = await prisma.cohort.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!c) throw notFound('Cohort not found.');
  const data: { name?: string; slug?: string; startDate?: Date | null; endDate?: Date | null; maxSize?: number | null; inviteCode?: string } = {};
  if (input.name !== undefined && input.name.trim() !== c.name) {
    const name = input.name.trim(); if (name.length < 3) throw badRequest('Cohort name needs at least 3 characters.', { name: 'At least 3 characters.' });
    const slug = slugify(name, 'cohort');
    if (slug !== c.slug && await prisma.cohort.findUnique({ where: { tenantId_slug: { tenantId: ctx.tenantId, slug } } })) throw conflict('A cohort with that name already exists.');
    data.name = name.slice(0, 120); data.slug = slug;
  }
  const start = input.startDate !== undefined ? input.startDate : c.startDate?.toISOString() ?? null;
  const end = input.endDate !== undefined ? input.endDate : c.endDate?.toISOString() ?? null;
  const dp = cohortDatesProblem(start, end); if (dp) throw badRequest(dp);
  if (input.startDate !== undefined) data.startDate = input.startDate ? new Date(input.startDate) : null;
  if (input.endDate !== undefined) data.endDate = input.endDate ? new Date(input.endDate) : null;
  if (input.maxSize !== undefined) data.maxSize = cohortSize(input.maxSize) ?? null;
  if (input.regenerateInvite) data.inviteCode = newInviteCode(ctx.tenantSlug);
  if (!Object.keys(data).length) return { ok: true as const, inviteCode: c.inviteCode };
  const u = await prisma.$transaction(async tx => {
    const u = await tx.cohort.update({ where: { id }, data });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: input.regenerateInvite ? 'cohort.invite_regenerated' : 'cohort.updated', resourceType: 'Cohort', resourceId: id, before: { name: c.name, startDate: c.startDate, endDate: c.endDate, maxSize: c.maxSize }, after: { ...data, inviteCode: undefined } });
    return u;
  });
  return { ok: true as const, inviteCode: u.inviteCode };
}

export async function deleteCohortAdmin(ctx: Ctx, id: string) {
  need(hasPerm(ctx, 'cohort:manage'));
  const c = await prisma.cohort.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { _count: { select: { enrollments: true } } } });
  if (!c) throw notFound('Cohort not found.');
  await prisma.$transaction(async tx => {
    await tx.membership.updateMany({ where: { tenantId: ctx.tenantId, cohortId: id }, data: { cohortId: null } }); // plain column, no foreign key
    await tx.cohort.delete({ where: { id } }); // enrollments and hackathons are unlinked (SET NULL), teams are removed (CASCADE)
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'cohort.deleted', resourceType: 'Cohort', resourceId: id, before: { name: c.name, learners: c._count.enrollments } });
  });
  return { ok: true as const };
}

/* ─────────────────────────── Talent ─────────────────────────── */

export async function listOpportunitiesAdmin(ctx: Ctx) {
  need(hasPerm(ctx, 'talent:post'));
  const rows = await prisma.opportunity.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { applications: true } }, poster: { select: { name: true, email: true } } } });
  return rows.map(o => ({ id: o.id, orgName: o.orgName, title: o.title, kind: o.kind, description: o.description, skillsWanted: parseList(o.skillsWanted), status: o.status, applications: o._count.applications, poster: o.poster.name || o.poster.email, createdAt: o.createdAt }));
}

type OppInput = { orgName: string; title: string; kind: string; description: string; skillsWanted: string[]; status?: 'open' | 'closed' };
function validOpp(input: Partial<OppInput>, full: boolean) {
  if (full || input.orgName !== undefined) { if (!input.orgName?.trim()) throw badRequest('Organisation is required.', { orgName: 'Required.' }); }
  if (full || input.title !== undefined) { if (!input.title?.trim()) throw badRequest('Title is required.', { title: 'Required.' }); }
  if (full || input.kind !== undefined) { if (!(OPPORTUNITY_KINDS as readonly string[]).includes(input.kind ?? '')) throw badRequest('Kind is internship, job, project or sponsorship.'); }
  if (full || input.description !== undefined) { if ((input.description?.trim().length ?? 0) < 50) throw badRequest('Describe the role properly (at least 50 characters).', { description: 'At least 50 characters.' }); }
}

export async function createOpportunityAdmin(ctx: Ctx, input: OppInput) {
  need(hasPerm(ctx, 'talent:post'));
  validOpp(input, true);
  const o = await prisma.opportunity.create({ data: { tenantId: ctx.tenantId, posterId: ctx.userId, orgName: input.orgName.trim().slice(0, 120), title: input.title.trim().slice(0, 140), kind: input.kind, description: input.description.trim().slice(0, 8000), skillsWanted: JSON.stringify(cleanSkills(input.skillsWanted)), status: input.status ?? 'open' } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.opportunity_posted', resourceType: 'Opportunity', resourceId: o.id });
  return { id: o.id };
}

export async function updateOpportunityAdmin(ctx: Ctx, id: string, input: Partial<OppInput>) {
  need(hasPerm(ctx, 'talent:post'));
  const o = await prisma.opportunity.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!o) throw notFound('Opportunity not found.');
  validOpp(input, false);
  const data: Record<string, string> = {};
  if (input.orgName !== undefined) data.orgName = input.orgName.trim().slice(0, 120);
  if (input.title !== undefined) data.title = input.title.trim().slice(0, 140);
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.description !== undefined) data.description = input.description.trim().slice(0, 8000);
  if (input.skillsWanted !== undefined) data.skillsWanted = JSON.stringify(cleanSkills(input.skillsWanted));
  if (input.status !== undefined) data.status = input.status;
  await prisma.opportunity.update({ where: { id }, data });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.opportunity_updated', resourceType: 'Opportunity', resourceId: id, after: { ...data, description: undefined } });
  return { ok: true as const };
}

export async function deleteOpportunityAdmin(ctx: Ctx, id: string) {
  need(hasPerm(ctx, 'talent:post'));
  const o = await prisma.opportunity.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { _count: { select: { applications: true } } } });
  if (!o) throw notFound('Opportunity not found.');
  await prisma.opportunity.delete({ where: { id } }); // applications cascade
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.opportunity_deleted', resourceType: 'Opportunity', resourceId: id, before: { title: o.title, applications: o._count.applications } });
  return { ok: true as const };
}

export async function listTalentProfilesAdmin(ctx: Ctx) {
  need(hasPerm(ctx, 'members:manage'));
  const rows = await prisma.talentProfile.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { updatedAt: 'desc' }, take: 500, include: { user: { select: { name: true, email: true } } } });
  return rows.map(p => ({ id: p.id, userId: p.userId, name: p.user.name || p.user.email, email: p.user.email, headline: p.headline, skills: parseList(p.skills), openTo: parseList(p.openTo), visibility: p.visibility, updatedAt: p.updatedAt }));
}

/** Admins may correct a headline or HIDE a profile. Making it visible again is the learner's own choice (consent). */
export async function updateTalentProfileAdmin(ctx: Ctx, id: string, input: { headline?: string; visibility?: string }) {
  need(hasPerm(ctx, 'members:manage'));
  const p = await prisma.talentProfile.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!p) throw notFound('Talent profile not found.');
  if (input.visibility !== undefined && input.visibility !== p.visibility && input.visibility !== 'private') throw forbidden('Admins can only hide a profile. The learner chooses who can see it.');
  const data: { headline?: string; visibility?: string } = {};
  if (input.headline !== undefined) data.headline = input.headline.trim().slice(0, 140);
  if (input.visibility !== undefined) data.visibility = input.visibility;
  await prisma.talentProfile.update({ where: { id }, data });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.profile_moderated', resourceType: 'TalentProfile', resourceId: id, before: { headline: p.headline, visibility: p.visibility }, after: data });
  return { ok: true as const };
}

export async function deleteTalentProfileAdmin(ctx: Ctx, id: string) {
  need(hasPerm(ctx, 'members:manage'));
  const p = await prisma.talentProfile.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!p) throw notFound('Talent profile not found.');
  await prisma.talentProfile.delete({ where: { id } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.profile_deleted', resourceType: 'TalentProfile', resourceId: id, before: { userId: p.userId, headline: p.headline } });
  await notify(prisma, ctx.tenantId, p.userId, 'talent_profile_removed', { title: 'An admin removed your talent profile', body: 'You can create a new one from Career.', tone: 'info' });
  return { ok: true as const };
}

/** Which Settings sections this person can open. Drives the hub cards and the side menu. */
export function settingsSections(ctx: Ctx) {
  return {
    institute: hasPerm(ctx, 'institute:manage'),
    institutes: ctx.superAdmin,
    people: hasPerm(ctx, 'members:read'),
    cohorts: hasPerm(ctx, 'cohort:manage'),
    talent: hasPerm(ctx, 'talent:post') || hasPerm(ctx, 'members:manage'),
  };
}
