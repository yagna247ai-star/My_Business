/**
 * Integration (Postgres): Content review. Reviewers read every level and leave suggestions; only a Super Admin
 * publishes; suggestions move open → done → reopened; nothing crosses institutions.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { reviewJourneys, reviewJourney, reviewLevel, setLevelPublished, publishAllLevels, addSuggestion, setSuggestionState, openSuggestions, parseTarget } from '@/lib/domain/contentReview';

const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
const ctxFor = async (email: string, superAdmin = false): Promise<Ctx> => {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin };
};

describe('Content review (integration)', () => {
  let learner: Ctx, admin: Ctx, superAdmin: Ctx, otherAdmin: Ctx, journeyId = '', levelId = '';
  beforeAll(async () => {
    [learner, admin, otherAdmin] = await Promise.all(['student@aihub.in', 'tenantadmin@aihub.in', 'admin@northstar.edu'].map(e => ctxFor(e)));
    superAdmin = { ...admin, superAdmin: true };
    const j = await prisma.journey.findFirstOrThrow({ where: { tenantId: admin.tenantId, levels: { some: { idx: 2 } } }, include: { levels: { where: { idx: 2 } } } });
    journeyId = j.id; levelId = j.levels[0].id;
  });

  it('targets are a whole level, a day or an activity', () => {
    expect(parseTarget('level')).toEqual({ kind: 'level' });
    expect(parseTarget('day:7')).toEqual({ kind: 'day', n: 7 });
    expect(parseTarget('activity:3')).toEqual({ kind: 'activity', n: 3 });
    expect(parseTarget('drop table')).toBeNull();
  });

  it('learners cannot open content review; admins can read every level, including answers', async () => {
    expect(await status(reviewJourneys(learner))).toBe(403);
    const list = await reviewJourneys(admin);
    expect(list.some(j => j.id === journeyId)).toBe(true);
    const { levels } = await reviewJourney(admin, journeyId);
    expect(levels.length).toBeGreaterThan(1);
    const lv = await reviewLevel(admin, journeyId, 2);
    expect(lv.activities.length).toBeGreaterThan(0);
    expect(lv.canPublish).toBe(false);
  });

  it('only a Super Admin publishes; unpublish and publish-all are audited', async () => {
    expect(await status(setLevelPublished(admin, levelId, false))).toBe(403);
    await setLevelPublished(superAdmin, levelId, true); // known starting state
    expect((await setLevelPublished(superAdmin, levelId, false)).changed).toBe(true);
    expect((await prisma.level.findUniqueOrThrow({ where: { id: levelId } })).isPublished).toBe(false);
    expect((await publishAllLevels(superAdmin, journeyId)).published).toBeGreaterThanOrEqual(1);
    expect((await prisma.level.findUniqueOrThrow({ where: { id: levelId } })).isPublished).toBe(true);
    expect(await prisma.auditLog.count({ where: { tenantId: admin.tenantId, action: { in: ['level.unpublished', 'level.published_all'] } } })).toBeGreaterThanOrEqual(2);
  });

  it('suggestions on a day or an activity move open → done → reopened, and show in the journey to-do list', async () => {
    expect(await status(addSuggestion(admin, { levelId, target: 'day:7', body: '' }))).toBe(400);
    expect(await status(addSuggestion(admin, { levelId, target: 'nowhere', body: 'Fix the KPI formula.' }))).toBe(400);
    const { id } = await addSuggestion(admin, { levelId, target: 'activity:2', body: 'Quiz question 3 has two correct answers; make option B clearly wrong.' });
    expect((await openSuggestions(admin, journeyId)).some(s => s.id === id)).toBe(true);
    await setSuggestionState(admin, id, 'done', 'Rewrote option B.');
    const done = (await reviewLevel(admin, journeyId, 2)).suggestions.find(s => s.id === id)!;
    expect(done.state).toBe('done'); expect(done.resolvedNote).toBe('Rewrote option B.'); expect(done.resolvedBy).toBeTruthy();
    expect((await openSuggestions(admin, journeyId)).some(s => s.id === id)).toBe(false);
    await setSuggestionState(admin, id, 'open');
    expect((await openSuggestions(admin, journeyId)).some(s => s.id === id)).toBe(true);
  });

  it('nothing crosses institutions', async () => {
    expect(await status(reviewJourney(otherAdmin, journeyId))).toBe(404);
    expect(await status(addSuggestion(otherAdmin, { levelId, target: 'level', body: 'Not my institution.' }))).toBe(404);
    expect(await status(setLevelPublished({ ...otherAdmin, superAdmin: true }, levelId, false))).toBe(404);
  });
});
