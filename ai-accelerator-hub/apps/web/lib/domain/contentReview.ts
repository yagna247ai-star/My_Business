/**
 * Content review for admins: read every journey exactly as learners get it (day lessons and all six activities,
 * including the answers learners never see), leave suggestions on a level, a day or an activity, track them to done,
 * and publish or unpublish levels.
 *
 * Reading and suggesting: content:manage (Super Admin, Institution Admin, Program Manager).
 * Publishing: Super Admin only. Every change is audited. Everything is scoped to the admin's institution.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';

export type SuggestionState = 'open' | 'done' | 'wontfix';
const canRead = (ctx: Ctx) => ctx.superAdmin || hasPerm(ctx, 'content:manage');
const need = (ctx: Ctx) => { if (!canRead(ctx)) throw forbidden('Only content reviewers can open content review.'); };
const needSuper = (ctx: Ctx) => { if (!ctx.superAdmin) throw forbidden('Only a Super Admin can publish or unpublish levels.'); };

/** "level", "day:7" or "activity:3". Pure: exported for tests. */
export function parseTarget(t: string): { kind: 'level' } | { kind: 'day'; n: number } | { kind: 'activity'; n: number } | null {
  if (t === 'level') return { kind: 'level' };
  const m = /^(day|activity):(\d{1,3})$/.exec(t);
  return m ? { kind: m[1] as 'day' | 'activity', n: Number(m[2]) } : null;
}
export const targetLabel = (t: string) => { const p = parseTarget(t); return !p ? t : p.kind === 'level' ? 'Whole level' : p.kind === 'day' ? `Day ${p.n}` : `Activity ${p.n}`; };

/** Every journey with its publish status and open suggestions. */
export async function reviewJourneys(ctx: Ctx) {
  need(ctx);
  const [journeys, open] = await Promise.all([
    prisma.journey.findMany({ where: { tenantId: ctx.tenantId }, orderBy: [{ isPublished: 'desc' }, { title: 'asc' }], select: { id: true, slug: true, title: true, isPublished: true, levels: { select: { isPublished: true } } } }),
    prisma.contentSuggestion.groupBy({ by: ['journeyId'], where: { tenantId: ctx.tenantId, state: 'open' }, _count: true }),
  ]);
  const openBy = new Map(open.map(o => [o.journeyId, o._count]));
  return journeys.map(j => ({ id: j.id, slug: j.slug, title: j.title, published: j.isPublished, levels: j.levels.length, publishedLevels: j.levels.filter(l => l.isPublished).length, openSuggestions: openBy.get(j.id) ?? 0 }));
}

/** One journey: its levels with status, counts and open suggestions. */
export async function reviewJourney(ctx: Ctx, journeyId: string) {
  need(ctx);
  const j = await prisma.journey.findFirst({ where: { id: journeyId, tenantId: ctx.tenantId }, select: { id: true, slug: true, title: true, description: true, isPublished: true } });
  if (!j) throw notFound('Journey not found in this institution.');
  const [levels, open] = await Promise.all([
    prisma.level.findMany({ where: { journeyId }, orderBy: { idx: 'asc' }, select: { id: true, idx: true, code: true, title: true, summary: true, isPublished: true, xpReward: true, stage: { select: { idx: true, title: true } }, _count: { select: { activities: true, contents: true } } } }),
    prisma.contentSuggestion.groupBy({ by: ['levelId'], where: { journeyId, state: 'open' }, _count: true }),
  ]);
  const openBy = new Map(open.map(o => [o.levelId, o._count]));
  return { journey: j, levels: levels.map(l => ({ ...l, days: l._count.contents, activities: l._count.activities, openSuggestions: openBy.get(l.id) ?? 0 })) };
}

/** One level in full: day lessons, activities with their complete configuration (answers included), suggestions. */
export async function reviewLevel(ctx: Ctx, journeyId: string, idx: number) {
  need(ctx);
  const level = await prisma.level.findFirst({ where: { journeyId, idx, journey: { tenantId: ctx.tenantId } }, include: { journey: { select: { id: true, title: true } }, stage: { select: { title: true } }, activities: { orderBy: { idx: 'asc' } }, contents: { where: { kind: 'md' }, orderBy: { position: 'asc' } } } });
  if (!level) throw notFound('Level not found.');
  const [suggestions, levelCount, votes] = await Promise.all([
    prisma.contentSuggestion.findMany({ where: { levelId: level.id }, orderBy: [{ state: 'asc' }, { createdAt: 'desc' }] }),
    prisma.level.count({ where: { journeyId } }),
    prisma.contentFeedback.groupBy({ by: ['target', 'useful'], where: { levelId: level.id }, _count: true }),
  ]);
  const feedback: Record<string, { up: number; down: number }> = {};
  for (const v of votes) { const f = (feedback[v.target] ??= { up: 0, down: 0 }); if (v.useful) f.up += v._count; else f.down += v._count; }
  const people = await prisma.user.findMany({ where: { id: { in: [...new Set(suggestions.flatMap(s => [s.authorId, s.resolvedById].filter(Boolean) as string[]))] } }, select: { id: true, name: true, email: true } });
  const who = new Map(people.map(p => [p.id, p.name || p.email]));
  const parse = (s: string | null) => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
  return {
    level: { id: level.id, idx: level.idx, code: level.code, title: level.title, summary: level.summary, isPublished: level.isPublished, xpReward: level.xpReward, stage: level.stage?.title ?? null, journey: level.journey, levelCount },
    days: level.contents.map(c => ({ contentId: c.id, day: c.position, title: c.title ?? `Day ${c.position}`, body: String(parse(c.payload).body ?? '') })),
    activities: level.activities.map(a => ({ idx: a.idx, code: a.code, title: a.title, xp: a.xpReward, config: parse(a.config) })),
    suggestions: suggestions.map(s => ({ id: s.id, target: s.target, body: s.body, state: s.state as SuggestionState, author: who.get(s.authorId) ?? 'Unknown', createdAt: s.createdAt.toISOString(), resolvedBy: s.resolvedById ? who.get(s.resolvedById) ?? null : null, resolvedNote: s.resolvedNote, resolvedAt: s.resolvedAt?.toISOString() ?? null })),
    canPublish: ctx.superAdmin,
    /** Learners' "Was this useful?" per day or activity. */
    feedback,
  };
}

export async function setLevelPublished(ctx: Ctx, levelId: string, published: boolean) {
  needSuper(ctx);
  const lv = await prisma.level.findFirst({ where: { id: levelId, journey: { tenantId: ctx.tenantId } }, select: { id: true, title: true, isPublished: true } });
  if (!lv) throw notFound('Level not found.');
  if (lv.isPublished === published) return { changed: false };
  await prisma.$transaction(async tx => {
    await tx.level.update({ where: { id: lv.id }, data: { isPublished: published } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: published ? 'level.published' : 'level.unpublished', resourceType: 'Level', resourceId: lv.id, after: { title: lv.title } });
  });
  return { changed: true };
}

export async function publishAllLevels(ctx: Ctx, journeyId: string) {
  needSuper(ctx);
  const j = await prisma.journey.findFirst({ where: { id: journeyId, tenantId: ctx.tenantId }, select: { id: true } });
  if (!j) throw notFound('Journey not found in this institution.');
  return prisma.$transaction(async tx => {
    const r = await tx.level.updateMany({ where: { journeyId, isPublished: false }, data: { isPublished: true } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'level.published_all', resourceType: 'Journey', resourceId: journeyId, after: { published: r.count } });
    return { published: r.count };
  });
}

export async function addSuggestion(ctx: Ctx, input: { levelId: string; target: string; body: string }) {
  need(ctx);
  const body = input.body.trim();
  if (body.length < 3) throw badRequest('Write your suggestion first.', { body: 'Write what should change, and why.' });
  if (body.length > 4000) throw badRequest('Keep a suggestion under 4,000 characters.', { body: 'Too long; split it into several suggestions.' });
  if (!parseTarget(input.target)) throw badRequest('Choose what the suggestion is about.');
  const lv = await prisma.level.findFirst({ where: { id: input.levelId, journey: { tenantId: ctx.tenantId } }, select: { id: true, journeyId: true } });
  if (!lv) throw notFound('Level not found.');
  return prisma.$transaction(async tx => {
    const s = await tx.contentSuggestion.create({ data: { tenantId: ctx.tenantId, journeyId: lv.journeyId, levelId: lv.id, target: input.target, body, authorId: ctx.userId } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'content.suggestion_added', resourceType: 'ContentSuggestion', resourceId: s.id, after: { target: input.target } });
    return { id: s.id };
  });
}

export async function setSuggestionState(ctx: Ctx, id: string, state: SuggestionState, note?: string) {
  need(ctx);
  const s = await prisma.contentSuggestion.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!s) throw notFound('Suggestion not found.');
  const resolved = state !== 'open';
  await prisma.$transaction(async tx => {
    await tx.contentSuggestion.update({ where: { id }, data: { state, resolvedById: resolved ? ctx.userId : null, resolvedAt: resolved ? new Date() : null, resolvedNote: resolved ? (note?.trim().slice(0, 1000) || null) : null } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `content.suggestion_${state}`, resourceType: 'ContentSuggestion', resourceId: id, before: { state: s.state }, after: { state } });
  });
  return { ok: true };
}

/** Open suggestions across a journey, newest first: the to-do list for improving content. */
export async function openSuggestions(ctx: Ctx, journeyId: string) {
  need(ctx);
  const rows = await prisma.contentSuggestion.findMany({ where: { tenantId: ctx.tenantId, journeyId, state: 'open' }, orderBy: { createdAt: 'desc' }, take: 200 });
  const levels = await prisma.level.findMany({ where: { id: { in: [...new Set(rows.map(r => r.levelId))] } }, select: { id: true, idx: true, title: true } });
  const byId = new Map(levels.map(l => [l.id, l]));
  return rows.map(r => ({ id: r.id, target: r.target, body: r.body, createdAt: r.createdAt.toISOString(), level: byId.get(r.levelId) ?? null }));
}
