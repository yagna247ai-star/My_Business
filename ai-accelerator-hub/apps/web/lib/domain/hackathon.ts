/**
 * Weekend hackathon engine (§8, §11) + team formation + peer review.
 * Status is the schedule: draft → open → building → submit → review → closed (forward only).
 * Judges decide winners; peers give structured feedback that never decides (§12, §27).
 * XP is server-side only, idempotent per entry/member.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { awardXp } from './xp';
import { safePublicUrl } from './journey';
import { assertChildAllowed } from './childSafety';

export const STATUSES = ['draft', 'open', 'building', 'submit', 'review', 'closed'] as const;
type Status = (typeof STATUSES)[number];
const PEER_DIMS = ['problem', 'build', 'teamwork'] as const;
const words = (s: unknown) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

async function hackathonOrThrow(tenantId: string, id: string) {
  const h = await prisma.hackathon.findFirst({ where: { id, tenantId }, include: { entries: { include: { team: { include: { members: true } }, peer: true } } } });
  if (!h) throw notFound('Hackathon not found.');
  return h;
}

/** Teams of this hackathon the caller belongs to (at most one — enforced on join). */
async function myTeams(tenantId: string, userId: string, hackathonId: string) {
  return prisma.team.findMany({ where: { tenantId, entries: { some: { hackathonId } }, members: { some: { userId } } }, include: { members: true, entries: { where: { hackathonId } } } });
}

async function assertCohortScope(ctx: Ctx, cohortId: string | null) {
  if (!cohortId) return;
  const m = await prisma.membership.findFirst({ where: { userId: ctx.userId, tenantId: ctx.tenantId, cohortId, status: 'active' } });
  if (!m) throw forbidden('This hackathon is limited to its cohort.');
}

export async function createHackathon(ctx: Ctx, input: { slug: string; title: string; briefMd?: string; cohortId?: string; maxTeamSize?: number; rubricCode?: string }) {
  if (!hasPerm(ctx, 'cohort:manage')) throw forbidden();
  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) throw badRequest('Slug is 3-40 lowercase letters, numbers or dashes.');
  if (!input.title.trim()) throw badRequest('Title is required.');
  if (input.cohortId) {
    const c = await prisma.cohort.findFirst({ where: { id: input.cohortId, tenantId: ctx.tenantId } });
    if (!c) throw notFound('Cohort not found.');
  }
  const size = input.maxTeamSize ?? 5;
  if (!Number.isInteger(size) || size < 3 || size > 5) throw badRequest('Team size is 3 to 5 (§11).');
  try {
    const h = await prisma.hackathon.create({ data: { tenantId: ctx.tenantId, slug, title: input.title.trim(), briefMd: input.briefMd?.trim() || '', cohortId: input.cohortId || null, maxTeamSize: size, rubricCode: input.rubricCode || null } });
    await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'hackathon.created', resourceType: 'Hackathon', resourceId: h.id, after: { slug } });
    return h;
  } catch (e) { if ((e as { code?: string }).code === 'P2002') throw conflict('Slug is taken in this tenant.'); throw e; }
}

export async function setHackathonStatus(ctx: Ctx, id: string, status: Status) {
  if (!hasPerm(ctx, 'cohort:manage')) throw forbidden();
  if (!STATUSES.includes(status)) throw badRequest('Unknown status.');
  const h = await hackathonOrThrow(ctx.tenantId, id);
  if (STATUSES.indexOf(status) <= STATUSES.indexOf(h.status as Status)) throw conflict(`Hackathon is already ${h.status}; statuses only move forward.`);
  await prisma.hackathon.update({ where: { id }, data: { status } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `hackathon.${status}`, resourceType: 'Hackathon', resourceId: id });
  if (status === 'review') await assignPeerReviews(ctx.tenantId, id);
  return { ok: true as const, status };
}

export async function listHackathons(ctx: Ctx) {
  const hs = await prisma.hackathon.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { entries: true } } } });
  return hs.map(h => ({ id: h.id, slug: h.slug, title: h.title, status: h.status, entries: h._count.entries, submitDueAt: h.submitDueAt }));
}

export async function createTeam(ctx: Ctx, hackathonId: string, name: string) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'hackathon_team');
  const h = await hackathonOrThrow(ctx.tenantId, hackathonId);
  if (!['open', 'building', 'submit'].includes(h.status)) throw conflict(`Teams can only form while the hackathon is open (now: ${h.status}).`);
  await assertCohortScope(ctx, h.cohortId);
  const clean = name.trim();
  if (clean.length < 3 || clean.length > 40) throw badRequest('Team name is 3-40 characters.');
  if ((await myTeams(ctx.tenantId, ctx.userId, hackathonId)).length > 0) throw conflict('You are already on a team in this hackathon.');
  const clash = await prisma.team.findFirst({ where: { tenantId: ctx.tenantId, name: clean, entries: { some: { hackathonId } } } });
  if (clash) throw conflict('A team with this name already exists in this hackathon.');
  const cohort = h.cohortId || (await prisma.cohort.findFirst({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'asc' } }))?.id;
  if (!cohort) throw badRequest('No cohort available for team formation.');
  const team = await prisma.$transaction(async tx => {
    const t = await tx.team.create({ data: { tenantId: ctx.tenantId, cohortId: cohort, name: clean, leadUserId: ctx.userId } });
    await tx.teamMembership.create({ data: { teamId: t.id, userId: ctx.userId, role: 'lead' } });
    await tx.hackathonEntry.create({ data: { hackathonId, teamId: t.id } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'hackathon.team_created', resourceType: 'Team', resourceId: t.id, after: { hackathonId, name: clean } });
    return t;
  });
  return { id: team.id, name: clean };
}

export async function joinTeam(ctx: Ctx, hackathonId: string, teamId: string) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'hackathon_team');
  const h = await hackathonOrThrow(ctx.tenantId, hackathonId);
  if (!['open', 'building', 'submit'].includes(h.status)) throw conflict(`Joining is closed (now: ${h.status}).`);
  await assertCohortScope(ctx, h.cohortId);
  if ((await myTeams(ctx.tenantId, ctx.userId, hackathonId)).length > 0) throw conflict('You are already on a team in this hackathon.');
  const team = await prisma.team.findFirst({ where: { id: teamId, tenantId: ctx.tenantId, entries: { some: { hackathonId } } }, include: { members: true } });
  if (!team) throw notFound('Team not found in this hackathon.');
  if (team.members.length >= h.maxTeamSize) throw conflict(`Teams are capped at ${h.maxTeamSize} (§11).`);
  await prisma.$transaction(async tx => {
    await tx.teamMembership.create({ data: { teamId, userId: ctx.userId, role: 'member' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'hackathon.team_joined', resourceType: 'Team', resourceId: teamId, after: { hackathonId } });
  });
  return { ok: true as const, teamId };
}

export async function submitEntry(ctx: Ctx, hackathonId: string, input: { title: string; repoUrl: string; deployedUrl?: string; reflectionMd: string }) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  const h = await hackathonOrThrow(ctx.tenantId, hackathonId);
  if (h.status !== 'submit') throw conflict('Submissions are only open in the submit window.');
  const mine = await myTeams(ctx.tenantId, ctx.userId, hackathonId);
  if (mine.length === 0) throw forbidden('Join a team before submitting.');
  const repo = safePublicUrl(input.repoUrl);
  if (!repo) throw badRequest('Repo must be a public https URL (SSRF-blocked).');
  const demo = input.deployedUrl ? safePublicUrl(input.deployedUrl) : null;
  if (input.deployedUrl && !demo) throw badRequest('Demo link must be a public https URL.');
  if (!input.title.trim()) throw badRequest('Title is required.');
  if (words(input.reflectionMd) < 50) throw badRequest(`Reflection needs 50+ words (you have ${words(input.reflectionMd)}).`);
  const entry = mine[0].entries[0];
  const updated = await prisma.hackathonEntry.update({ where: { id: entry.id }, data: { title: input.title.trim(), repoUrl: repo, deployedUrl: demo, reflectionMd: input.reflectionMd.trim(), state: 'submitted', submittedAt: new Date() } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'hackathon.submitted', resourceType: 'HackathonEntry', resourceId: entry.id, after: { hackathonId } });
  return { id: updated.id, state: updated.state };
}

/** Deterministic round-robin: every submitted entry gets 2 reviewers from other teams. Idempotent. */
export async function assignPeerReviews(tenantId: string, hackathonId: string) {
  const h = await hackathonOrThrow(tenantId, hackathonId);
  const submitted = h.entries.filter(e => e.state === 'submitted');
  const rosters = new Map<string, string[]>();
  for (const e of submitted) rosters.set(e.id, e.team.members.map(m => m.userId).sort());
  const allReviewers = [...rosters.values()].flat();
  let n = 0;
  for (const [i, e] of submitted.entries()) {
    const others = allReviewers.filter(u => !rosters.get(e.id)!.includes(u));
    for (let k = 0; k < 2 && others.length > 0; k++) {
      const reviewerId = others[(i + k) % others.length];
      try { await prisma.peerReview.create({ data: { entryId: e.id, reviewerId, scores: '{}', comment: null } }); n++; }
      catch (err) { if ((err as { code?: string }).code !== 'P2002') throw err; }
    }
  }
  return { assigned: n };
}

export async function peerTasks(ctx: Ctx, hackathonId: string) {
  const h = await hackathonOrThrow(ctx.tenantId, hackathonId);
  const tasks = await prisma.peerReview.findMany({ where: { reviewerId: ctx.userId, entry: { hackathonId } }, include: { entry: { include: { team: true } } } });
  return tasks.map(t => ({ entryId: t.entryId, team: t.entry.team.name, title: t.entry.title, repoUrl: t.entry.repoUrl, deployedUrl: t.entry.deployedUrl, reflection: t.entry.reflectionMd, done: t.comment !== null, hackathonStatus: h.status }));
}

export async function submitPeerReview(ctx: Ctx, entryId: string, scores: Record<string, number>, comment: string) {
  if (!hasPerm(ctx, 'learn:self')) throw forbidden();
  const task = await prisma.peerReview.findFirst({ where: { entryId, reviewerId: ctx.userId }, include: { entry: { include: { hackathon: true, team: { include: { members: true } } } } } });
  if (!task) throw forbidden('This peer review is not assigned to you.');
  if (task.entry.hackathon.tenantId !== ctx.tenantId) throw notFound('Entry not found.');
  if (task.entry.hackathon.status !== 'review') throw conflict('Peer review is only open in the review window.');
  if (task.entry.team.members.some(m => m.userId === ctx.userId)) throw forbidden('You cannot peer-review your own team.');
  if (task.comment !== null) throw conflict('You already submitted this peer review.');
  for (const d of PEER_DIMS) { const v = scores[d]; if (!Number.isInteger(v) || v < 1 || v > 5) throw badRequest(`Score "${d}" from 1 to 5.`); }
  if (comment.trim().length < 20) throw badRequest('Explain your feedback (at least 20 characters).');
  await prisma.peerReview.update({ where: { id: task.id }, data: { scores: JSON.stringify(scores), comment: comment.trim() } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'hackathon.peer_reviewed', resourceType: 'HackathonEntry', resourceId: entryId });
  return { ok: true as const };
}

export async function hackathonBoard(ctx: Ctx, hackathonId: string) {
  const h = await hackathonOrThrow(ctx.tenantId, hackathonId);
  const judge = hasPerm(ctx, 'review:decide');
  const mine = new Set((await myTeams(ctx.tenantId, ctx.userId, hackathonId)).map(t => t.id));
  const reveal = h.status === 'closed' || judge;
  return {
    id: h.id, slug: h.slug, title: h.title, briefMd: h.briefMd, status: h.status,
    windows: { buildStartAt: h.buildStartAt, submitDueAt: h.submitDueAt, reviewDueAt: h.reviewDueAt },
    result: h.status === 'closed' && h.resultJson ? JSON.parse(h.resultJson) : null,
    entries: h.entries.map(e => ({
      team: e.team.name, memberCount: e.team.members.length, title: e.title, state: e.state,
      repoUrl: reveal || mine.has(e.teamId) ? e.repoUrl : null,
      peerCount: e.peer.filter(p => p.comment !== null).length,
    })),
    myTeam: mine.size > 0,
  };
}

export async function hackathonDetail(ctx: Ctx, slug: string) {
  const h = await prisma.hackathon.findFirst({ where: { slug, tenantId: ctx.tenantId } });
  if (!h) throw notFound('Hackathon not found.');
  const [board, mine, tasks] = await Promise.all([hackathonBoard(ctx, h.id), myTeams(ctx.tenantId, ctx.userId, h.id), peerTasks(ctx, h.id)]);
  return { board, myTeam: mine[0] ? { id: mine[0].id, name: mine[0].name, role: mine[0].members.find(m => m.userId === ctx.userId)?.role, members: mine[0].members.length, entry: mine[0].entries[0] ? { state: mine[0].entries[0].state, title: mine[0].entries[0].title } : null } : null, peerTasks: tasks, canManage: hasPerm(ctx, 'cohort:manage'), canJudge: hasPerm(ctx, 'review:decide') };
}

export async function decideHackathon(ctx: Ctx, hackathonId: string, placements: { entryId: string; place: number }[], note?: string) {
  if (!hasPerm(ctx, 'review:decide')) throw forbidden();
  const h = await hackathonOrThrow(ctx.tenantId, hackathonId);
  if (h.status !== 'review') throw conflict('Decisions happen in the review window.');
  const submitted = h.entries.filter(e => e.state === 'submitted');
  if (submitted.length === 0) throw badRequest('Nothing submitted to judge.');
  const ids = new Set(submitted.map(e => e.id));
  const places = placements.map(p => p.place).sort((a, b) => a - b);
  if (placements.length !== submitted.length || placements.some(p => !ids.has(p.entryId)) || new Set(placements.map(p => p.entryId)).size !== placements.length)
    throw badRequest('Placements must rank every submitted entry exactly once.');
  if (places.some((p, i) => p !== i + 1)) throw badRequest('Places must run 1..N with no ties.');
  return prisma.$transaction(async tx => {
    for (const e of submitted) {
      for (const m of e.team.members) {
        await awardXp(tx, { tenantId: ctx.tenantId, userId: m.userId, amount: 10, source: 'hackathon_submitted', idempotencyKey: `hackathon:${e.id}:${m.userId}` });
      }
      await tx.hackathonEntry.update({ where: { id: e.id }, data: { state: 'reviewed' } });
    }
    const winners = submitted.filter(e => placements.find(p => p.entryId === e.id && p.place === 1));
    for (const e of winners) for (const m of e.team.members) {
      await awardXp(tx, { tenantId: ctx.tenantId, userId: m.userId, amount: 25, source: 'hackathon_win', idempotencyKey: `hackathon-win:${hackathonId}:${m.userId}` });
    }
    await tx.hackathon.update({ where: { id: hackathonId }, data: { status: 'closed', resultJson: JSON.stringify({ placements, note: note?.trim() || null, decidedAt: new Date() }) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'hackathon.decided', resourceType: 'Hackathon', resourceId: hackathonId, after: { placements } });
    for (const e of submitted) for (const m of e.team.members) {
      await notify(tx, ctx.tenantId, m.userId, 'hackathon_decided', { title: `${h.title} — results are in`, body: note?.trim().slice(0, 140) || 'Judging is complete. See the board.', href: `/hackathons/${h.slug}`, tone: 'ok' });
    }
    return { ok: true as const, placements };
  });
}
