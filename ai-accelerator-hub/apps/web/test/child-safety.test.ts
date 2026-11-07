/**
 * Child safety policy (docs/CHILD_SAFETY_POLICY.md §9 acceptance criteria).
 * Runs against the real migrated + seeded test database.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register, updateSettings } from '@/lib/domain/account';
import { CHILD_POLICY, CHILD_COACH_RULES, childStatus, isAllowed, recordGuardianConsent, confirmAdult } from '@/lib/domain/childSafety';
import { touchStreak } from '@/lib/domain/streak';
import { createPost, createComment, toggleReaction } from '@/lib/domain/feed';
import { createTeam } from '@/lib/domain/hackathon';
import { upsertProfile, discoverTalent, applyToOpportunity } from '@/lib/domain/talent';
import { listMembers } from '@/lib/domain/admin';

const expectErr = async (p: Promise<unknown>, status: number) => { await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === status); };
async function ctxFor(email: string): Promise<Ctx> {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: u.globalRole === 'super_admin' };
}
const year = new Date().getFullYear();
const ok = { method: 'school_signed_form', note: 'Signed consent form received by the class teacher on file.' };

let kid: Ctx, adult: Ctx, admin: Ctx, mentor: Ctx, otherAdmin: Ctx;
beforeAll(async () => {
  await register({ name: 'Meera Kid', email: 'meera.kid@example.test', password: 'Youngcoder@123', birthYear: year - 14, inviteCode: 'DEMO-COHORT-07', guardianEmail: 'guardian.meera@example.test', acceptTerms: true });
  await register({ name: 'Ravi Adult', email: 'ravi.adult@example.test', password: 'Adultlearn@123', birthYear: year - 30, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
  [kid, adult, admin, mentor, otherAdmin] = await Promise.all(['meera.kid@example.test', 'ravi.adult@example.test', 'tenantadmin@aihub.in', 'mentor@aihub.in', 'admin@northstar.edu'].map(ctxFor));
});
beforeEach(() => _resetRateLimits());

describe('Policy table (pure)', () => {
  it('denies by default for minors and never allows career or purchase actions', () => {
    const pending = { minor: true, consent: 'pending' as const }, granted = { minor: true, consent: 'granted' as const }, grown = { minor: false, consent: 'not_required' as const };
    for (const a of Object.keys(CHILD_POLICY) as (keyof typeof CHILD_POLICY)[]) {
      expect(isAllowed(grown, a)).toBe(true);
      expect(isAllowed(pending, a)).toBe(false);
      expect(isAllowed(granted, a)).toBe(CHILD_POLICY[a].rule === 'consent');
    }
    expect(isAllowed(granted, 'talent_apply')).toBe(false);
    expect(isAllowed(granted, 'talent_profile_visible')).toBe(false);
    expect(isAllowed(granted, 'purchase')).toBe(false);
    expect(isAllowed({ minor: true, consent: 'revoked' }, 'community_post')).toBe(false);
  });
  it('coach rules cover personal data, harmful content, bypassing limits and getting help', () => {
    for (const k of ['personal information', 'sexual', 'bypass age limits', 'trusted adult', 'emergency services', 'hints']) expect(CHILD_COACH_RULES).toContain(k);
  });
});

describe('Age at registration', () => {
  it('uses the youngest possible age, so a learner born 18 years ago this year is still a minor', async () => {
    await expect(register({ name: 'Edge Case', email: 'edge.case@example.test', password: 'Edgecase@1234', birthYear: year - 18, inviteCode: 'DEMO-COHORT-07', acceptTerms: true })).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === 400);
    const r = await register({ name: 'Edge Case', email: 'edge.case@example.test', password: 'Edgecase@1234', birthYear: year - 18, inviteCode: 'DEMO-COHORT-07', guardianEmail: 'guardian.edge@example.test', acceptTerms: true });
    expect(r.minor).toBe(true);
    expect((await register({ name: 'Grown Up', email: 'grown.up@example.test', password: 'Grownup@12345', birthYear: year - 19, inviteCode: 'DEMO-COHORT-07', acceptTerms: true })).minor).toBe(false);
  });
});

describe('Community, hackathon and talent gates', () => {
  it('blocks a minor without consent from posting, commenting, reacting and joining teams', async () => {
    expect(await childStatus(kid.tenantId, kid.userId)).toEqual({ minor: true, consent: 'pending' });
    await expectErr(createPost(kid, { kind: 'post', body: 'Hello everyone' }), 403);
    const p = await createPost(adult, { kind: 'post', body: 'Adult learner post for the cohort' });
    await expectErr(createComment(kid, p.id, 'Nice!'), 403);
    await expectErr(toggleReaction(kid, p.id, 'like'), 403);
    await expectErr(createTeam(kid, 'any-hackathon', 'Team Kid'), 403);
    expect((await createComment(adult, p.id, 'Adults are unaffected')).id).toBeTruthy();
  });

  it('staff without members:manage, other institutions and self-recording cannot grant consent', async () => {
    await expectErr(recordGuardianConsent(mentor, kid.userId, { decision: 'granted', ...ok }), 403);
    await expectErr(recordGuardianConsent(otherAdmin, kid.userId, { decision: 'granted', ...ok }), 404);
    await expectErr(recordGuardianConsent(admin, adult.userId, { decision: 'granted', ...ok }), 400);
    await expectErr(recordGuardianConsent(admin, kid.userId, { decision: 'granted', method: 'school_signed_form', note: 'Guardian phone 9876543210 called' }), 400);
  });

  it('after verified consent: community opens, contact details stay blocked, career features stay closed', async () => {
    await recordGuardianConsent(admin, kid.userId, { decision: 'granted', ...ok });
    const audit = await prisma.auditLog.findFirst({ where: { tenantId: admin.tenantId, action: 'guardian_consent.granted' }, orderBy: { createdAt: 'desc' } });
    expect(audit?.actorUserId).toBe(admin.userId);
    const row = (await listMembers(admin)).find(m => m.userId === kid.userId)!;
    expect(row).toMatchObject({ minor: true, guardianConsent: 'granted' });

    expect((await createPost(kid, { kind: 'win', body: 'I finished Level 1!' })).id).toBeTruthy();
    await expectErr(createPost(kid, { kind: 'post', body: 'Message me at meera@example.test' }), 400);
    await expectErr(createPost(kid, { kind: 'post', body: 'Call me on 98765 43210' }), 400);
    expect((await createPost(adult, { kind: 'post', body: 'Adults may share a work email: ravi@example.test' })).id).toBeTruthy();

    await expectErr(upsertProfile(kid, { headline: 'Young coder', skills: ['python'], openTo: ['mentorship'], visibility: 'tenant' }), 403);
    expect((await upsertProfile(kid, { headline: 'Young coder', skills: ['python'], openTo: [], visibility: 'private' })).visibility).toBe('private');
    await expectErr(applyToOpportunity(kid, 'any-opportunity', 'I would love to learn more about this role.'), 403);
  });

  it('never shows a minor in talent discovery, even if a profile is marked visible', async () => {
    await prisma.talentProfile.update({ where: { tenantId_userId: { tenantId: kid.tenantId, userId: kid.userId } }, data: { visibility: 'tenant', skills: JSON.stringify(['python']) } });
    const found = await discoverTalent(mentor, { skills: ['python'] });
    expect(found.map(f => f.id)).not.toContain(kid.userId);
  });

  it('revoking consent rolls back every consent-gated setting', async () => {
    await updateSettings(kid, { leaderboardVisibility: 'cohort' });
    await prisma.project.create({ data: { tenantId: kid.tenantId, userId: kid.userId, title: 'Quiz buddy', slug: `kid-quiz-${Date.now()}`, description: 'A Python quiz helper for my club.', isPublic: true } });
    await recordGuardianConsent(admin, kid.userId, { decision: 'revoked', method: 'guardian_in_person', note: 'Guardian asked to withdraw consent at the parent meeting.' });
    const s = await prisma.userSetting.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: kid.tenantId, userId: kid.userId } } });
    expect(s).toMatchObject({ guardianConsent: 'revoked', leaderboardVisibility: 'private', globalOptIn: false });
    expect(await prisma.project.count({ where: { userId: kid.userId, isPublic: true } })).toBe(0);
    expect((await prisma.talentProfile.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: kid.tenantId, userId: kid.userId } } })).visibility).toBe('private');
    await expectErr(createPost(kid, { kind: 'post', body: 'Still here?' }), 403);
    const n = await prisma.notification.findFirst({ where: { userId: kid.userId, template: 'guardian_consent_revoked' } });
    expect(n).toBeTruthy();
  });

  it('treats staff without a learner settings row as adults, and learners without one as minors', async () => {
    expect((await childStatus(mentor.tenantId, mentor.userId)).minor).toBe(false);
    expect((await childStatus(kid.tenantId, 'no-such-user')).minor).toBe(true);
  });

  it('sends under-18s a calm welcome-back message instead of a streak countdown', async () => {
    await prisma.streak.upsert({ where: { tenantId_userId: { tenantId: kid.tenantId, userId: kid.userId } }, update: { currentStreak: 9, lastActiveDate: '2026-01-01', freezeTokens: 0, status: 'active' }, create: { tenantId: kid.tenantId, userId: kid.userId, currentStreak: 9, lastActiveDate: '2026-01-01', freezeTokens: 0, status: 'active' } });
    await touchStreak(prisma, kid.tenantId, kid.userId, '2026-01-10');
    const kidNotes = await prisma.notification.findMany({ where: { userId: kid.userId, template: { in: ['streak_welcome_back', 'streak_recovery_available'] } } });
    expect(kidNotes.map(n => n.template)).toEqual(['streak_welcome_back']);
    expect(kidNotes[0].payload).not.toMatch(/within|days to restore/);
    await prisma.streak.upsert({ where: { tenantId_userId: { tenantId: adult.tenantId, userId: adult.userId } }, update: { currentStreak: 9, lastActiveDate: '2026-01-01', freezeTokens: 0, status: 'active' }, create: { tenantId: adult.tenantId, userId: adult.userId, currentStreak: 9, lastActiveDate: '2026-01-01', freezeTokens: 0, status: 'active' } });
    await touchStreak(prisma, adult.tenantId, adult.userId, '2026-01-10');
    expect(await prisma.notification.count({ where: { userId: adult.userId, template: 'streak_recovery_available' } })).toBe(1);
  });

  it('moves a learner who turned 18 to adult: staff-only, audited, guardian contact erased, privacy unchanged', async () => {
    const ok18 = { method: 'learner_confirmed_with_institution_records', note: 'Matches the date of birth in the school admission register.' };
    await expectErr(confirmAdult(mentor, kid.userId, ok18), 403);
    await expectErr(confirmAdult(otherAdmin, kid.userId, ok18), 404);
    await expectErr(confirmAdult(admin, adult.userId, ok18), 400);
    await expectErr(confirmAdult(admin, kid.userId, { ...ok18, note: 'Checked Aadhaar 123412341234 today' }), 400);
    await confirmAdult(admin, kid.userId, ok18);
    const s = await prisma.userSetting.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: kid.tenantId, userId: kid.userId } } });
    expect(s).toMatchObject({ ageBand: 'adult', guardianConsent: 'not_required', guardianEmail: null, leaderboardVisibility: 'private', globalOptIn: false });
    expect(await prisma.auditLog.count({ where: { action: 'age_band.adult_confirmed', resourceId: s.id } })).toBe(1);
    expect(await childStatus(kid.tenantId, kid.userId)).toEqual({ minor: false, consent: 'not_required' });
    expect((await upsertProfile(kid, { headline: 'Now 18', skills: ['python'], openTo: ['internships'], visibility: 'tenant' })).visibility).toBe('tenant');
  });
});
