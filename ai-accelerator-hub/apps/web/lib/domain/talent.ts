/**
 * Talent marketplace (§19): consent-gated discovery, opportunities, applications.
 * Profiles are PRIVATE by default — discovery only ever returns profiles the
 * learner explicitly opted in (tenant) or opted in globally via DPDP consent
 * (public). Minors cannot go public without granted guardian consent.
 * No opaque AI ranking: results are skill/track matches with reasons shown.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { assertChildAllowed } from './childSafety';

const OPEN_TO = ['internships', 'jobs', 'freelance', 'mentorship'] as const;
const KINDS = ['internship', 'job', 'project', 'sponsorship'] as const;
const parseSkills = (raw: string): string[] => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v.filter(s => typeof s === 'string') : []; } catch { return []; } };

async function settingsOf(tenantId: string, userId: string) {
  return prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
}

export async function myProfile(ctx: Ctx) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  const p = await prisma.talentProfile.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } } });
  return p ? { headline: p.headline, skills: parseSkills(p.skills), openTo: parseSkills(p.openTo), visibility: p.visibility } : { headline: '', skills: [] as string[], openTo: [] as string[], visibility: 'private' };
}

export async function upsertProfile(ctx: Ctx, input: { headline: string; skills: string[]; openTo: string[]; visibility: string }) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  if (input.headline.trim().length > 120) throw badRequest('Headline is 120 characters max.');
  const skills = [...new Set(input.skills.map(s => s.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
  const openTo = [...new Set(input.openTo.filter(o => (OPEN_TO as readonly string[]).includes(o)))];
  if (!['private', 'tenant', 'public'].includes(input.visibility)) throw badRequest('Visibility is private, tenant or public.');
  if (input.visibility !== 'private') await assertChildAllowed(ctx.tenantId, ctx.userId, 'talent_profile_visible'); // never for under-18s
  if (input.visibility === 'public') {
    const s = await settingsOf(ctx.tenantId, ctx.userId);
    if (!s?.globalOptIn) throw badRequest('Going public needs explicit cross-tenant consent first (Settings → Privacy).');
  }
  const p = await prisma.talentProfile.upsert({
    where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } },
    create: { tenantId: ctx.tenantId, userId: ctx.userId, headline: input.headline.trim(), skills: JSON.stringify(skills), openTo: JSON.stringify(openTo), visibility: input.visibility },
    update: { headline: input.headline.trim(), skills: JSON.stringify(skills), openTo: JSON.stringify(openTo), visibility: input.visibility },
  });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.profile_updated', resourceType: 'TalentProfile', resourceId: p.id, after: { visibility: input.visibility } });
  return { id: p.id, visibility: p.visibility };
}

export async function discoverTalent(ctx: Ctx, opts: { skills?: string[]; trackCode?: string; take?: number }) {
  if (!hasPerm(ctx, 'talent:discover')) throw forbidden();
  const skills = (opts.skills || []).map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 5);
  // Same tenant: opted-in tenant|public profiles. Cross-tenant: public + globalOptIn only.
  const same = await prisma.talentProfile.findMany({
    where: { tenantId: ctx.tenantId, visibility: { in: ['tenant', 'public'] } },
    include: { user: { select: { id: true, name: true } }, tenant: { select: { slug: true } } }, take: 100,
  });
  // Cross-tenant consent lives on UserSetting.globalOptIn (DPDP explicit opt-in).
  const optedIn = await prisma.userSetting.findMany({ where: { globalOptIn: true }, select: { tenantId: true, userId: true } });
  const opted = new Set(optedIn.map(o => `${o.tenantId}:${o.userId}`));
  const pub = await prisma.talentProfile.findMany({
    where: { tenantId: { not: ctx.tenantId }, visibility: 'public' },
    include: { user: { select: { id: true, name: true } }, tenant: { select: { slug: true } } }, take: 100,
  });
  // Child safety: under-18 profiles are never discoverable, whatever their stored visibility.
  const minors = await prisma.userSetting.findMany({ where: { ageBand: { not: 'adult' } }, select: { tenantId: true, userId: true } });
  const minor = new Set(minors.map(m => `${m.tenantId}:${m.userId}`));
  const visible = pub.filter(p => opted.has(`${p.tenantId}:${p.userId}`) && !minor.has(`${p.tenantId}:${p.userId}`));
  const scored = [...same.filter(p => !minor.has(`${p.tenantId}:${p.userId}`)).map(p => ({ p, cross: false })), ...visible.map(p => ({ p, cross: true }))].map(({ p, cross }) => {
    const have = parseSkills(p.skills).map(s => s.toLowerCase());
    const match = skills.filter(s => have.some(h => h.includes(s) || s.includes(h)));
    return { id: p.userId, name: p.user.name || 'Learner', headline: p.headline, skills: parseSkills(p.skills), openTo: parseSkills(p.openTo), tenant: p.tenant.slug, crossTenant: cross, matchedSkills: match, matchCount: match.length };
  }).filter(r => skills.length === 0 || r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name))
    .slice(0, Math.min(Math.max(opts.take || 20, 1), 50));
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.discovered', resourceType: 'TalentProfile', after: { skills, results: scored.length } });
  return scored;
}

export async function postOpportunity(ctx: Ctx, input: { orgName: string; title: string; kind: string; description: string; skillsWanted: string[] }) {
  if (!hasPerm(ctx, 'talent:post')) throw forbidden();
  if (!input.orgName.trim() || !input.title.trim()) throw badRequest('Organisation and title are required.');
  if (!(KINDS as readonly string[]).includes(input.kind)) throw badRequest('Kind is internship, job, project or sponsorship.');
  if (input.description.trim().length < 50) throw badRequest('Describe the role properly (at least 50 characters).');
  const skills = [...new Set(input.skillsWanted.map(s => s.trim().slice(0, 40)).filter(Boolean))].slice(0, 15);
  const o = await prisma.opportunity.create({ data: { tenantId: ctx.tenantId, posterId: ctx.userId, orgName: input.orgName.trim().slice(0, 120), title: input.title.trim().slice(0, 140), kind: input.kind, description: input.description.trim().slice(0, 8000), skillsWanted: JSON.stringify(skills), status: 'open' } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.opportunity_posted', resourceType: 'Opportunity', resourceId: o.id });
  return { id: o.id };
}

export async function listOpportunities(ctx: Ctx, mine = false) {
  const poster = hasPerm(ctx, 'talent:post');
  const rows = await prisma.opportunity.findMany({
    where: { tenantId: ctx.tenantId, ...(mine && poster ? { posterId: ctx.userId } : { status: 'open' }) },
    orderBy: { createdAt: 'desc' }, take: 50,
    include: { _count: { select: { applications: true } } },
  });
  return rows.map(o => ({ id: o.id, orgName: o.orgName, title: o.title, kind: o.kind, description: o.description, skillsWanted: parseSkills(o.skillsWanted), status: o.status, applications: poster ? o._count.applications : undefined, mine: o.posterId === ctx.userId }));
}

export async function closeOpportunity(ctx: Ctx, id: string) {
  const o = await prisma.opportunity.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!o) throw notFound('Opportunity not found.');
  if (o.posterId !== ctx.userId && !hasPerm(ctx, 'cohort:manage')) throw forbidden();
  await prisma.opportunity.update({ where: { id }, data: { status: 'closed' } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.opportunity_closed', resourceType: 'Opportunity', resourceId: id });
  return { ok: true as const };
}

export async function applyToOpportunity(ctx: Ctx, opportunityId: string, coverNote: string) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'talent_apply'); // never for under-18s
  const o = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId: ctx.tenantId } });
  if (!o || o.status !== 'open') throw notFound('Opportunity not found or closed.');
  if (coverNote.trim().length < 30) throw badRequest('Say why you fit (at least 30 characters).');
  const consent = () => JSON.stringify({ profile: true, contact: true, at: new Date().toISOString(), forOpportunity: opportunityId });
  try {
    const a = await prisma.application.create({ data: { opportunityId, applicantId: ctx.userId, coverNote: coverNote.trim().slice(0, 2000), consentJson: consent(), state: 'applied' } });
    await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.applied', resourceType: 'Application', resourceId: a.id });
    await notify(prisma, ctx.tenantId, o.posterId, 'talent_application', { title: `New applicant for ${o.title}`, body: coverNote.trim().slice(0, 140), href: '/talent', tone: 'info' });
    return { id: a.id };
  } catch (e) {
    if ((e as { code?: string }).code !== 'P2002') throw e;
    const prev = await prisma.application.findUniqueOrThrow({ where: { opportunityId_applicantId: { opportunityId, applicantId: ctx.userId } } });
    if (prev.state !== 'withdrawn') throw conflict('You already applied — withdraw first to re-apply.');
    const a = await prisma.application.update({ where: { id: prev.id }, data: { coverNote: coverNote.trim().slice(0, 2000), consentJson: consent(), state: 'applied' } });
    await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'talent.reapplied', resourceType: 'Application', resourceId: a.id });
    return { id: a.id };
  }
}

export async function myApplications(ctx: Ctx) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  const rows = await prisma.application.findMany({ where: { applicantId: ctx.userId, opportunity: { tenantId: ctx.tenantId } }, orderBy: { createdAt: 'desc' }, include: { opportunity: { select: { id: true, orgName: true, title: true, kind: true, status: true } } } });
  return rows.map(a => ({ id: a.id, state: a.state, coverNote: a.coverNote, createdAt: a.createdAt, opportunity: a.opportunity, consentedAt: (JSON.parse(a.consentJson) as { at: string }).at }));
}

export async function postingApplications(ctx: Ctx, opportunityId: string) {
  const o = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId: ctx.tenantId } });
  if (!o) throw notFound('Opportunity not found.');
  if (o.posterId !== ctx.userId && !hasPerm(ctx, 'cohort:manage')) throw forbidden();
  const rows = await prisma.application.findMany({ where: { opportunityId }, orderBy: { createdAt: 'asc' }, include: { applicant: { select: { id: true, name: true } } } });
  const profiles = await prisma.talentProfile.findMany({ where: { tenantId: ctx.tenantId, userId: { in: rows.map(r => r.applicantId) } } });
  const byUser = new Map(profiles.map(p => [p.userId, p]));
  return rows.map(a => {
    const p = byUser.get(a.applicantId);
    return { id: a.id, state: a.state, coverNote: a.coverNote, createdAt: a.createdAt, applicant: a.applicant.name || 'Learner', headline: p?.headline || '', skills: p ? parseSkills(p.skills) : [] };
  });
}

export async function setApplicationState(ctx: Ctx, applicationId: string, state: 'shortlisted' | 'rejected' | 'withdrawn') {
  const a = await prisma.application.findFirst({ where: { id: applicationId }, include: { opportunity: true } });
  if (!a || a.opportunity.tenantId !== ctx.tenantId) throw notFound('Application not found.');
  const posterSide = a.opportunity.posterId === ctx.userId || hasPerm(ctx, 'cohort:manage');
  if (state === 'withdrawn') {
    if (a.applicantId !== ctx.userId) throw forbidden('Only the applicant can withdraw.');
    if (a.state !== 'applied' && a.state !== 'shortlisted') throw conflict(`Cannot withdraw from ${a.state}.`);
  } else {
    if (!posterSide) throw forbidden('Only the posting organisation decides.');
    if (a.state === 'withdrawn') throw conflict('The applicant withdrew.');
    if (a.state !== 'applied' && a.state !== 'shortlisted') throw conflict(`Already ${a.state}.`);
  }
  await prisma.application.update({ where: { id: applicationId }, data: { state } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `talent.application_${state}`, resourceType: 'Application', resourceId: applicationId });
  const other = state === 'withdrawn' ? a.opportunity.posterId : a.applicantId;
  await notify(prisma, ctx.tenantId, other, 'talent_application_update', { title: `Application ${state}`, body: `${a.opportunity.title} at ${a.opportunity.orgName}`, href: state === 'withdrawn' ? '/talent' : '/career', tone: state === 'shortlisted' ? 'ok' : 'info' });
  return { ok: true as const, state };
}
