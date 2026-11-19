/**
 * Admin view of one member: account, safety, journeys and level progress, XP, streak, badges, submissions
 * with review outcomes, talent profile. Staff with 'members:read' only, and only for members of their own
 * institution. Every view is audited (it shows personal and learning data).
 * The guardian's email is never returned; staff see only the consent state.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { ROLE_LABEL, type Role } from '@/lib/server/rbac';
import { forbidden, notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';
import { totalXp } from './xp';
import { streakView } from './streak';
import { RANKS, TIERS } from './insights';

const atLeast = <T extends { min: number }>(list: T[], xp: number) => [...list].reverse().find(x => xp >= x.min) ?? list[0];
const parseList = (raw: string | null | undefined): string[] => { try { const v = JSON.parse(raw ?? '[]'); return Array.isArray(v) ? v.filter(s => typeof s === 'string') : []; } catch { return []; } };

export async function personProfile(ctx: Ctx, userId: string) {
  if (!hasPerm(ctx, 'members:read')) throw forbidden();
  const m = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId: ctx.tenantId, userId } },
    include: { role: true, user: { select: { id: true, name: true, email: true, avatarUrl: true, area: true, preferredLanguage: true, createdAt: true, githubUsername: true } } },
  });
  if (!m) throw notFound('This person is not a member of your institution.');

  const t = ctx.tenantId;
  const [cohort, setting, streak, xp, badges, enrollments, submissions, talent, persona] = await Promise.all([
    m.cohortId ? prisma.cohort.findFirst({ where: { id: m.cohortId, tenantId: t }, select: { name: true } }) : null,
    prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId: t, userId } }, select: { ageBand: true, guardianConsent: true, leaderboardVisibility: true, deletionRequestedAt: true } }),
    prisma.streak.findUnique({ where: { tenantId_userId: { tenantId: t, userId } } }),
    totalXp(t, userId),
    prisma.userBadge.findMany({ where: { userId, badge: { OR: [{ tenantId: t }, { tenantId: null }] } }, include: { badge: true }, orderBy: { earnedAt: 'desc' } }),
    prisma.enrollment.findMany({
      where: { tenantId: t, userId }, orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }],
      include: {
        journey: { select: { title: true, slug: true, _count: { select: { levels: true } } } },
        progress: {
          include: { level: { select: { idx: true, code: true, title: true, _count: { select: { activities: true } } } }, activityProgress: { where: { state: 'completed' }, select: { completedAt: true } } },
          orderBy: { level: { idx: 'asc' } },
        },
      },
    }),
    prisma.submission.findMany({
      where: { tenantId: t, userId }, orderBy: { submittedAt: 'desc' }, take: 25,
      include: { progress: { select: { level: { select: { idx: true, title: true } } } }, reviews: { orderBy: { reviewedAt: 'desc' }, take: 1, select: { verdict: true, feedbackMd: true, weightedAvg: true, isAiReview: true, reviewedAt: true } } },
    }),
    prisma.talentProfile.findUnique({ where: { tenantId_userId: { tenantId: t, userId } }, select: { headline: true, skills: true, openTo: true, visibility: true, updatedAt: true } }),
    prisma.learnerProfile.findFirst({ where: { tenantId: t, userId }, select: { persona: true, updatedAt: true } }),
  ]);

  const journeys = enrollments.map(e => {
    const levels = e.progress.map(p => ({ idx: p.level.idx, code: p.level.code, title: p.level.title, state: p.state, xp: p.xpEarned, attempts: p.attempts, activitiesDone: p.activityProgress.length, activitiesTotal: p.level._count.activities, completedAt: p.completedAt }));
    const lastActivity = e.progress.flatMap(p => p.activityProgress.map(a => a.completedAt)).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    return { id: e.id, title: e.journey.title, slug: e.journey.slug, state: e.state, currentLevelIdx: e.currentLevelIdx, levelsTotal: e.journey._count.levels, approved: levels.filter(l => l.state === 'approved').length, activitiesDone: levels.reduce((n, l) => n + l.activitiesDone, 0), enrolledAt: e.enrolledAt, completedAt: e.completedAt, lastActivity, levels };
  });

  await audit(prisma, { tenantId: t, actorUserId: ctx.userId, action: 'member.profile_viewed', resourceType: 'User', resourceId: userId });

  return {
    userId, name: m.user.name || m.user.email, email: m.user.email, avatarUrl: m.user.avatarUrl, area: m.user.area, language: m.user.preferredLanguage, github: m.user.githubUsername,
    role: m.role.code, roleLabel: ROLE_LABEL[m.role.code as Role] ?? m.role.code, status: m.status, joinedAt: m.joinedAt, accountCreatedAt: m.user.createdAt,
    cohort: cohort?.name ?? null,
    safety: { minor: (setting?.ageBand ?? 'adult') !== 'adult', guardianConsent: setting?.guardianConsent ?? 'not_required', leaderboard: setting?.leaderboardVisibility ?? 'cohort', deletionRequestedAt: setting?.deletionRequestedAt ?? null },
    xp, rank: atLeast(RANKS, xp).name, tier: atLeast(TIERS, xp).name, streak: streakView(streak),
    badges: badges.map(b => ({ code: b.badge.code, name: b.badge.name, tier: b.badge.tier, at: b.earnedAt })),
    journeys,
    submissions: submissions.map(s => ({ id: s.id, level: s.progress?.level ? `L${s.progress.level.idx} · ${s.progress.level.title}` : '—', type: s.type, url: s.deployedUrl || s.url || s.repoUrl, state: s.state, submittedAt: s.submittedAt, review: s.reviews[0] ? { verdict: s.reviews[0].verdict, score: s.reviews[0].weightedAvg, ai: s.reviews[0].isAiReview, at: s.reviews[0].reviewedAt, feedback: (s.reviews[0].feedbackMd ?? '').slice(0, 300) } : null })),
    talent: talent ? { headline: talent.headline, skills: parseList(talent.skills), openTo: parseList(talent.openTo), visibility: talent.visibility, updatedAt: talent.updatedAt } : null,
    persona: persona?.persona ?? null,
  };
}
