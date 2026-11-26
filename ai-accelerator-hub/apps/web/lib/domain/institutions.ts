/**
 * Institutions (docs/INSTITUTIONS_SPEC.md): codes at registration, switching, joining with a code,
 * and moving people between institutions with their whole learning record.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { audit, notify } from '@/lib/server/audit';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { DEFAULT_CODE, normaliseCode, planJourneyMap, resolveCode } from './institutionsCore';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** The institution for people without a code: AIHUB, else DEFAULT_TENANT_SLUG. */
export async function defaultInstitution() {
  return (await prisma.tenant.findUnique({ where: { code: DEFAULT_CODE } }))
    ?? (await prisma.tenant.findUnique({ where: { slug: process.env.DEFAULT_TENANT_SLUG || 'demo' } }));
}

/** Registration and "Join an institution": what a typed code means. */
export async function institutionForCode(code?: string | null): Promise<{ tenantId: string; cohortId: string | null; via: 'institution' | 'cohort' | 'default' }> {
  const c = (code ?? '').trim();
  const [tenants, cohorts] = await Promise.all([
    prisma.tenant.findMany({ select: { id: true, code: true, status: true } }),
    c ? prisma.cohort.findMany({ where: { inviteCode: { equals: c, mode: 'insensitive' } }, select: { id: true, tenantId: true, inviteCode: true } }) : Promise.resolve([]),
  ]);
  const r = resolveCode(c, tenants, cohorts);
  if (r.kind === 'institution') return { tenantId: r.tenantId, cohortId: null, via: 'institution' };
  if (r.kind === 'cohort') return { tenantId: r.tenantId, cohortId: r.cohortId, via: 'cohort' };
  if (r.kind === 'unknown') throw badRequest(`We don’t know the code “${c}”. Check it with your institution, or leave it empty to join AI Accelerator Hub.`, { inviteCode: 'Unknown institution code.' });
  const d = await defaultInstitution();
  if (!d) throw badRequest('Public registration is not open. Ask your institution for its code.');
  return { tenantId: d.id, cohortId: null, via: 'default' };
}

/* ---------- switching ---------- */

export async function myInstitutions(ctx: Ctx) {
  const rows = ctx.superAdmin
    ? await prisma.tenant.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, logoUrl: true, type: true } })
    : (await prisma.membership.findMany({ where: { userId: ctx.userId, status: 'active', tenant: { status: 'active' } }, include: { tenant: { select: { id: true, name: true, code: true, logoUrl: true, type: true } } } })).map(m => m.tenant);
  return { current: ctx.tenantId, institutions: rows.map(t => ({ ...t, current: t.id === ctx.tenantId })) };
}

/** Checks the person may open this institution; the caller sets the signed cookie. */
export async function canSwitchTo(ctx: Ctx, tenantId: string) {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, status: true, name: true } });
  if (!t || t.status !== 'active') throw notFound('That institution is not available.');
  if (!ctx.superAdmin) {
    const m = await prisma.membership.findFirst({ where: { tenantId, userId: ctx.userId, status: 'active' } });
    if (!m) throw forbidden('You are not a member of that institution.');
  }
  await audit(prisma, { tenantId, actorUserId: ctx.userId, action: 'tenant.switched', resourceType: 'Tenant', resourceId: tenantId, after: { from: ctx.tenantId } });
  return t;
}

/** An existing account joins another institution with its code (scenario 5). */
export async function joinWithCode(ctx: Ctx, code: string) {
  if (!code.trim()) throw badRequest('Enter the institution code.', { code: 'Required.' });
  const r = await institutionForCode(code);
  const had = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: r.tenantId, userId: ctx.userId } } });
  if (had?.status === 'active') throw conflict('You are already a member of that institution. Use the switcher at the top to open it.');
  const learner = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
  const age = await prisma.userSetting.findFirst({ where: { userId: ctx.userId }, orderBy: { createdAt: 'asc' } });
  await prisma.$transaction(async tx => {
    if (had) await tx.membership.update({ where: { id: had.id }, data: { status: 'active', leftAt: null, movedToTenantId: null, ...(r.cohortId ? { cohortId: r.cohortId } : {}) } });
    else await tx.membership.create({ data: { tenantId: r.tenantId, userId: ctx.userId, roleId: learner.id, cohortId: r.cohortId, status: 'active' } });
    await tx.userSetting.upsert({ where: { tenantId_userId: { tenantId: r.tenantId, userId: ctx.userId } }, update: {}, create: { tenantId: r.tenantId, userId: ctx.userId, ageBand: age?.ageBand ?? 'adult', guardianConsent: age?.guardianConsent ?? 'not_required', guardianEmail: age?.guardianEmail ?? null, leaderboardVisibility: age?.ageBand === 'minor' ? 'private' : 'cohort', globalOptIn: false } });
    await audit(tx, { tenantId: r.tenantId, actorUserId: ctx.userId, action: 'member.joined_with_code', resourceType: 'Membership', resourceId: ctx.userId, after: { via: r.via } });
  });
  return { tenantId: r.tenantId };
}

/* ---------- copying a journey into another institution ---------- */

async function cloneJourney(tx: Tx, sourceJourneyId: string, toTenantId: string, actorId: string) {
  const j = await tx.journey.findUniqueOrThrow({ where: { id: sourceJourneyId }, include: { stages: true, levels: { include: { contents: true, activities: true, prerequisites: true } } } });
  const clash = await tx.level.findFirst({ where: { tenantId: toTenantId, code: { in: j.levels.map(l => l.code) } }, select: { code: true } });
  if (clash) throw conflict(`The institution already has a level with code ${clash.code} in another journey, so “${j.title}” cannot be copied. Rename that level first.`);
  const nj = await tx.journey.create({ data: { tenantId: toTenantId, slug: j.slug, title: j.title, description: j.description, isPublished: false, config: j.config } });
  const stageMap = new Map<string, string>();
  for (const s of j.stages) stageMap.set(s.id, (await tx.stage.create({ data: { journeyId: nj.id, code: s.code, title: s.title, idx: s.idx } })).id);
  const levelMap = new Map<string, string>();
  for (const l of j.levels) {
    const nl = await tx.level.create({ data: { tenantId: toTenantId, journeyId: nj.id, stageId: l.stageId ? stageMap.get(l.stageId) ?? null : null, idx: l.idx, code: l.code, title: l.title, summary: l.summary, description: l.description, xpReward: l.xpReward, unlockCondition: l.unlockCondition, isPublished: l.isPublished, tags: l.tags } });
    levelMap.set(l.id, nl.id);
    if (l.activities.length) await tx.activity.createMany({ data: l.activities.map(a => ({ tenantId: toTenantId, levelId: nl.id, idx: a.idx, code: a.code, title: a.title, config: a.config, xpReward: a.xpReward, position: a.position })) });
    for (const c of l.contents) {
      const nc = await tx.content.create({ data: { levelId: nl.id, kind: c.kind, title: c.title, payload: c.payload, position: c.position, durationMin: c.durationMin } });
      const mats = await tx.dayMaterial.findMany({ where: { contentId: c.id } });
      if (mats.length) await tx.dayMaterial.createMany({ data: mats.map(m => ({ tenantId: toTenantId, contentId: nc.id, title: m.title, url: m.url, kind: m.kind, note: m.note, sortOrder: m.sortOrder, linkStatus: m.linkStatus, linkCheckedAt: m.linkCheckedAt, createdById: actorId })) });
    }
  }
  for (const l of j.levels) for (const p of l.prerequisites) if (levelMap.has(p.prerequisiteLevelId)) await tx.levelPrerequisite.create({ data: { levelId: levelMap.get(l.id)!, prerequisiteLevelId: levelMap.get(p.prerequisiteLevelId)! } });
  return nj.id;
}

async function journeySide(tx: Tx, journeyId: string) {
  const levels = await tx.level.findMany({ where: { journeyId }, select: { id: true, code: true, activities: { select: { id: true, idx: true } }, contents: { select: { id: true, position: true } } } });
  return { levels: levels.map(l => ({ id: l.id, code: l.code })), activities: levels.flatMap(l => l.activities.map(a => ({ id: a.id, levelCode: l.code, idx: a.idx }))), contents: levels.flatMap(l => l.contents.map(c => ({ id: c.id, levelCode: l.code, position: c.position }))) };
}

/* ---------- moving people ---------- */

/** Move one person A → B with their learning record (spec §2 scenarios 6–11). Runs inside the caller's transaction. */
async function movePerson(tx: Tx, userId: string, from: string, to: string, actorId: string) {
  const counts: Record<string, number> = {};
  const add = (k: string, n: number) => { counts[k] = (counts[k] ?? 0) + n; };
  const levelMap = new Map<string, string>(); const activityMap = new Map<string, string>(); const contentMap = new Map<string, string>();

  for (const e of await tx.enrollment.findMany({ where: { tenantId: from, userId }, include: { journey: { select: { id: true, slug: true } } } })) {
    const target = await tx.journey.findUnique({ where: { tenantId_slug: { tenantId: to, slug: e.journey.slug } }, select: { id: true } });
    const targetId = target?.id ?? await cloneJourney(tx, e.journey.id, to, actorId);
    const plan = planJourneyMap(await journeySide(tx, e.journey.id), await journeySide(tx, targetId));
    if (plan.missing.some(m => m.startsWith('level'))) throw conflict(`The institution's copy of this journey is missing ${plan.missing.slice(0, 3).join(', ')}. Add them, or move the person after the journeys match.`);
    plan.levels.forEach((v, k) => levelMap.set(k, v)); plan.activities.forEach((v, k) => activityMap.set(k, v)); plan.contents.forEach((v, k) => contentMap.set(k, v));
    const existing = await tx.enrollment.findUnique({ where: { tenantId_userId_journeyId: { tenantId: to, userId, journeyId: targetId } }, select: { id: true } });
    let enrollmentId = e.id;
    if (existing) {
      // Already enrolled in B: their B enrollment keeps B's rows; A's rows move only where B has none.
      enrollmentId = existing.id;
      for (const p of await tx.progress.findMany({ where: { enrollmentId: e.id } })) {
        const lid = levelMap.get(p.levelId); if (!lid) continue;
        const clash = await tx.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId, levelId: lid } } });
        if (clash) { if (clash.state === 'locked' || (clash.state === 'available' && p.state !== 'locked')) { await tx.activityProgress.deleteMany({ where: { progressId: clash.id } }); await tx.progress.delete({ where: { id: clash.id } }); } else continue; }
        await tx.progress.update({ where: { id: p.id }, data: { tenantId: to, enrollmentId, levelId: lid } }); add('levels', 1);
      }
    } else {
      await tx.enrollment.update({ where: { id: e.id }, data: { tenantId: to, journeyId: targetId, cohortId: null } }); add('journeys', 1);
      for (const p of await tx.progress.findMany({ where: { enrollmentId: e.id }, select: { id: true, levelId: true } })) { await tx.progress.update({ where: { id: p.id }, data: { tenantId: to, levelId: levelMap.get(p.levelId) ?? p.levelId } }); add('levels', 1); }
    }
    for (const a of await tx.activityProgress.findMany({ where: { enrollmentId: e.id }, select: { id: true, activityId: true, progressId: true } })) {
      const aid = activityMap.get(a.activityId);
      if (!aid || (existing && await tx.activityProgress.findUnique({ where: { progressId_activityId: { progressId: a.progressId, activityId: aid } } }))) continue;
      await tx.activityProgress.update({ where: { id: a.id }, data: { activityId: aid, enrollmentId } }); add('activities', 1);
    }
    for (const d of await tx.dayProgress.findMany({ where: { enrollmentId: e.id }, select: { id: true, levelId: true, day: true } })) {
      const lid = levelMap.get(d.levelId); if (!lid) continue;
      if (existing && await tx.dayProgress.findUnique({ where: { enrollmentId_levelId_day: { enrollmentId, levelId: lid, day: d.day } } })) continue;
      await tx.dayProgress.update({ where: { id: d.id }, data: { tenantId: to, enrollmentId, levelId: lid } }); add('days', 1);
    }
    if (existing) { await tx.dayProgress.deleteMany({ where: { enrollmentId: e.id } }); await tx.activityProgress.deleteMany({ where: { enrollmentId: e.id } }); await tx.progress.deleteMany({ where: { enrollmentId: e.id } }); await tx.enrollment.delete({ where: { id: e.id } }); }
  }

  // Rows that carry the institution directly.
  add('submissions', (await tx.submission.updateMany({ where: { tenantId: from, userId }, data: { tenantId: to } })).count);
  for (const x of await tx.xpLedger.findMany({ where: { tenantId: from, userId }, select: { id: true, levelId: true, activityId: true } }))
    await tx.xpLedger.update({ where: { id: x.id }, data: { tenantId: to, levelId: x.levelId ? levelMap.get(x.levelId) ?? x.levelId : null, activityId: x.activityId ? activityMap.get(x.activityId) ?? x.activityId : null } });
  add('xp', await tx.xpLedger.count({ where: { tenantId: to, userId } }));
  for (const u of await tx.unlockEvent.findMany({ where: { tenantId: from, userId }, select: { id: true, levelId: true } })) await tx.unlockEvent.update({ where: { id: u.id }, data: { tenantId: to, levelId: levelMap.get(u.levelId) ?? u.levelId } });
  for (const m of ['streakEvent', 'project', 'helpRequest', 'trackChange', 'aiConversation'] as const) {
    const where = m === 'helpRequest' ? { tenantId: from, learnerId: userId } : { tenantId: from, userId };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    add(m, (await (tx[m] as any).updateMany({ where, data: { tenantId: to } })).count);
  }
  add('files', (await tx.file.updateMany({ where: { tenantId: from, ownerId: userId }, data: { tenantId: to } })).count);

  // One row per person per institution: keep the better one.
  const sA = await tx.streak.findUnique({ where: { tenantId_userId: { tenantId: from, userId } } });
  const sB = await tx.streak.findUnique({ where: { tenantId_userId: { tenantId: to, userId } } });
  if (sA) { if (!sB) await tx.streak.update({ where: { id: sA.id }, data: { tenantId: to } }); else { if ((sA.longestStreak ?? 0) > (sB.longestStreak ?? 0)) await tx.streak.update({ where: { id: sB.id }, data: { longestStreak: sA.longestStreak, currentStreak: Math.max(sA.currentStreak, sB.currentStreak) } }); await tx.streak.delete({ where: { id: sA.id } }); } }
  for (const m of ['userSetting', 'learnerProfile', 'talentProfile'] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = tx[m] as any;
    const a = await t.findUnique({ where: { tenantId_userId: { tenantId: from, userId } } });
    if (!a) continue;
    const b = await t.findUnique({ where: { tenantId_userId: { tenantId: to, userId } } });
    if (b && m === 'userSetting') await t.delete({ where: { id: b.id } }); // A's settings carry guardian consent and privacy
    if (b && m !== 'userSetting') { await t.delete({ where: { id: a.id } }); continue; }
    await t.update({ where: { id: a.id }, data: { tenantId: to } });
  }
  for (const r of await tx.agentLabRun.findMany({ where: { tenantId: from, userId }, select: { id: true, agent: true } })) {
    if (await tx.agentLabRun.findUnique({ where: { tenantId_userId_agent: { tenantId: to, userId, agent: r.agent } } })) continue;
    await tx.agentLabRun.update({ where: { id: r.id }, data: { tenantId: to } });
  }
  // Material ticks follow the copied day materials (same link on the mapped day).
  for (const mp of await tx.materialProgress.findMany({ where: { userId, material: { tenantId: from } }, include: { material: { select: { contentId: true, url: true } } } })) {
    const cid = contentMap.get(mp.material.contentId); if (!cid) continue;
    const target = await tx.dayMaterial.findFirst({ where: { contentId: cid, url: mp.material.url }, select: { id: true } });
    if (target && !(await tx.materialProgress.findUnique({ where: { materialId_userId: { materialId: target.id, userId } } }))) await tx.materialProgress.update({ where: { id: mp.id }, data: { materialId: target.id } });
  }
  return counts;
}

export async function transferPeople(ctx: Ctx, input: { userIds: string[]; toTenantId: string; mode: 'move' | 'add' }) {
  if (!ctx.superAdmin) throw forbidden('Only a Super Admin can move people between institutions.');
  const to = await prisma.tenant.findUnique({ where: { id: input.toTenantId }, select: { id: true, name: true, status: true } });
  if (!to || to.status !== 'active') throw badRequest('Choose an active institution.');
  if (to.id === ctx.tenantId) throw badRequest('These people are already in this institution.');
  const ids = [...new Set(input.userIds)].slice(0, 200);
  const done: { email: string; counts?: Record<string, number> }[] = []; const skipped: { email: string; reason: string }[] = [];
  for (const userId of ids) {
    const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } }, include: { user: { select: { email: true, globalRole: true } } } });
    if (!m) { skipped.push({ email: userId, reason: 'Not in this institution.' }); continue; }
    if (m.userId === ctx.userId || m.user.globalRole === 'super_admin') { skipped.push({ email: m.user.email, reason: 'Super Admins are not moved.' }); continue; }
    try {
      const counts = await prisma.$transaction(async tx => {
        const there = await tx.membership.findUnique({ where: { tenantId_userId: { tenantId: to.id, userId } } });
        if (there) await tx.membership.update({ where: { id: there.id }, data: { status: 'active', leftAt: null, movedToTenantId: null } });
        else await tx.membership.create({ data: { tenantId: to.id, userId, roleId: m.roleId, status: 'active' } });
        let c: Record<string, number> = {};
        if (input.mode === 'move') {
          c = await movePerson(tx, userId, ctx.tenantId, to.id, ctx.userId);
          await tx.membership.update({ where: { id: m.id }, data: { status: 'alumni', leftAt: new Date(), movedToTenantId: to.id, cohortId: null } });
        } else {
          const s = await tx.userSetting.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
          await tx.userSetting.upsert({ where: { tenantId_userId: { tenantId: to.id, userId } }, update: {}, create: { tenantId: to.id, userId, ageBand: s?.ageBand ?? 'adult', guardianConsent: s?.guardianConsent ?? 'not_required', guardianEmail: s?.guardianEmail ?? null, leaderboardVisibility: s?.ageBand === 'minor' ? 'private' : (s?.leaderboardVisibility ?? 'cohort'), globalOptIn: false } });
        }
        await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: input.mode === 'move' ? 'member.moved' : 'member.added_to_institution', resourceType: 'Membership', resourceId: m.id, after: { to: to.id, toName: to.name, counts: c } });
        await notify(tx, to.id, userId, 'institution_changed', { title: input.mode === 'move' ? `You are now part of ${to.name}` : `You were added to ${to.name}`, body: input.mode === 'move' ? 'Your progress, points and projects moved with you.' : 'Switch institutions from the top bar.', tone: 'info' });
        return c;
      }, { timeout: 60_000, maxWait: 10_000 });
      done.push({ email: m.user.email, counts });
    } catch (e) { skipped.push({ email: m.user.email, reason: (e as Error).message.slice(0, 200) }); }
  }
  return { done: done.length, moved: done, skipped };
}

/** Institution history for a person (the learning passport). */
export async function institutionHistory(userId: string) {
  const ms = await prisma.membership.findMany({ where: { userId }, orderBy: { joinedAt: 'asc' }, include: { tenant: { select: { name: true, code: true } }, role: { select: { code: true } } } });
  const names = new Map((await prisma.tenant.findMany({ where: { id: { in: ms.map(m => m.movedToTenantId).filter((x): x is string => !!x) } }, select: { id: true, name: true } })).map(t => [t.id, t.name]));
  return ms.map(m => ({ institution: m.tenant.name, code: m.tenant.code, role: m.role.code, status: m.status, joinedAt: m.joinedAt.toISOString(), leftAt: m.leftAt?.toISOString() ?? null, movedTo: m.movedToTenantId ? names.get(m.movedToTenantId) ?? null : null }));
}

export const codeTaken = async (code: string, exceptId?: string) => !!(await prisma.tenant.findFirst({ where: { code: normaliseCode(code), ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } }));
