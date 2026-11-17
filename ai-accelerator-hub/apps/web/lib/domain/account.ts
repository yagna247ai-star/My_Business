/**
 * Accounts: registration (public or via institution invite code), age-aware safety defaults (§21),
 * privacy settings, DPDP-style data export and deletion requests (§28).
 */
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, conflict } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';

export const registerSchema = z.object({
  name: z.string({ error: 'Enter your name.' }).trim().min(2, 'Enter your full name.').max(100, 'Keep your name under 100 characters.'),
  email: z.string({ error: 'Enter your email.' }).trim().toLowerCase().email('Enter a valid email address.').max(254, 'That email is too long.'),
  password: z.string({ error: 'Choose a password.' }).min(10, 'Use at least 10 characters.').max(200, 'Use at most 200 characters.').regex(/[A-Za-z]/, 'Include at least one letter.').regex(/[0-9]/, 'Include at least one number.'),
  // Read the current year per request (a module-level value would go stale across New Year on a long-running server).
  birthYear: z.coerce.number({ error: 'Enter your year of birth.' }).int('Enter a whole year, e.g. 2001.').refine(y => y >= 1920 && y <= new Date().getFullYear(), { error: 'Enter a valid year of birth.' }),
  inviteCode: z.string().trim().max(40, 'That invite code is too long.').optional().or(z.literal('')),
  guardianEmail: z.string().trim().toLowerCase().email('Enter a valid parent or guardian email.').optional().or(z.literal('')),
  acceptTerms: z.literal(true, { error: 'Accept the terms and privacy notice to continue.' }),
}).refine(v => !v.guardianEmail || v.guardianEmail !== v.email, { path: ['guardianEmail'], error: 'Use your parent or guardian’s email, not your own.' });

export async function register(input: z.infer<typeof registerSchema>) {
  // Only the birth year is collected (data minimisation), so use the youngest age the learner could be:
  // someone born in December 2008 is still 17 in January 2026. Child safety policy §2.
  const age = new Date().getFullYear() - input.birthYear - 1;
  if (age < 13) throw badRequest('Learners under 13 must be enrolled by their school or guardian.');
  const minor = age < 18;
  if (minor && !input.guardianEmail) throw badRequest('Learners under 18 need a parent or guardian email for consent.', { guardianEmail: 'Required for learners under 18.' });
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('An account with this email already exists. Try signing in.');

  let tenantId: string, cohortId: string | null = null;
  if (input.inviteCode) {
    const cohort = await prisma.cohort.findUnique({ where: { inviteCode: input.inviteCode.toUpperCase() } });
    if (!cohort) throw badRequest('That invite code is not valid.', { inviteCode: 'Check the code with your institution.' });
    tenantId = cohort.tenantId; cohortId = cohort.id;
  } else {
    const t = await prisma.tenant.findUnique({ where: { slug: process.env.DEFAULT_TENANT_SLUG || 'demo' } });
    if (!t) throw badRequest('Public registration is not open. Ask your institution for an invite code.');
    tenantId = t.id;
  }
  const journey = await prisma.journey.findFirst({ where: { tenantId, isPublished: true } });
  const l1 = journey ? await prisma.level.findFirst({ where: { journeyId: journey.id, idx: 1 } }) : null;
  const learner = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
  const hash = await bcrypt.hash(input.password, 11);

  return prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: { email: input.email, name: input.name, passwordHash: hash, emailVerified: false } });
    await tx.membership.create({ data: { tenantId, userId: user.id, roleId: learner.id, cohortId, status: 'active' } });
    await tx.userSetting.create({ data: { tenantId, userId: user.id, ageBand: minor ? 'minor' : 'adult', guardianEmail: minor ? input.guardianEmail || null : null, guardianConsent: minor ? 'pending' : 'not_required', leaderboardVisibility: minor ? 'private' : 'cohort', globalOptIn: false } });
    await tx.streak.create({ data: { tenantId, userId: user.id } });
    await tx.entitlement.create({ data: { tenantId, userId: user.id, feature: 'ai_credits', remaining: 40 } });
    if (journey && l1) {
      const e = await tx.enrollment.create({ data: { tenantId, userId: user.id, journeyId: journey.id, cohortId, currentLevelIdx: 1 } });
      await tx.progress.create({ data: { tenantId, enrollmentId: e.id, levelId: l1.id, userId: user.id, state: 'available', unlockedAt: new Date() } });
    }
    await audit(tx, { tenantId, actorUserId: user.id, action: 'user.registered', resourceType: 'User', resourceId: user.id, after: { viaInvite: !!cohortId, minor } });
    await notify(tx, tenantId, user.id, 'welcome', { title: 'Welcome to AI Accelerator Hub', body: minor ? 'Guardian consent is pending. Learning is open now; community features unlock once your guardian approves.' : 'Start with Level 1 — AI Explorer.', href: '/levels/L01_AI_EXPLORER', tone: 'gold' });
    return { userId: user.id, minor, guardianConsent: minor ? 'pending' : 'not_required' };
  }, { maxWait: 10_000, timeout: 15_000 }).catch((e: unknown) => {
    // Two submits racing past the findUnique check above: the unique index on email decides.
    if ((e as { code?: string })?.code === 'P2002') throw conflict('An account with this email already exists. Try signing in.');
    throw e;
  });
}

export async function getSettings(ctx: Ctx) {
  return prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } }, update: {}, create: { tenantId: ctx.tenantId, userId: ctx.userId } });
}

export const settingsSchema = z.object({ leaderboardVisibility: z.enum(['cohort', 'private']).optional(), globalOptIn: z.boolean().optional(), quietHours: z.boolean().optional(), preferredLanguage: z.enum(['en', 'hi', 'te', 'ta', 'kn', 'ml']).optional() });
export async function updateSettings(ctx: Ctx, input: z.infer<typeof settingsSchema>) {
  const cur = await getSettings(ctx);
  if (cur.ageBand === 'minor' && (input.globalOptIn || input.leaderboardVisibility === 'cohort') && cur.guardianConsent !== 'granted') throw badRequest('Your guardian needs to approve this setting first.');
  const { preferredLanguage, ...rest } = input;
  return prisma.$transaction(async tx => {
    const s = await tx.userSetting.update({ where: { id: cur.id }, data: rest });
    if (preferredLanguage) await tx.user.update({ where: { id: ctx.userId }, data: { preferredLanguage } });
    if (input.globalOptIn !== undefined && input.globalOptIn !== cur.globalOptIn) await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: input.globalOptIn ? 'consent.global_granted' : 'consent.global_withdrawn', resourceType: 'UserSetting', resourceId: s.id });
    if (input.leaderboardVisibility && input.leaderboardVisibility !== cur.leaderboardVisibility) await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'privacy.visibility_changed', resourceType: 'UserSetting', resourceId: s.id, after: { v: input.leaderboardVisibility } });
    return s;
  });
}

export async function exportMyData(ctx: Ctx) {
  const where = { tenantId: ctx.tenantId, userId: ctx.userId };
  const [user, settings, enrollments, progress, submissions, xp, streak, badges, notifications, ai] = await Promise.all([
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { id: true, email: true, name: true, preferredLanguage: true, createdAt: true } }),
    prisma.userSetting.findUnique({ where: { tenantId_userId: where } }),
    prisma.enrollment.findMany({ where }), prisma.progress.findMany({ where, include: { activityProgress: true } }),
    prisma.submission.findMany({ where, include: { reviews: { select: { verdict: true, weightedAvg: true, rubricScores: true, feedbackMd: true, reviewedAt: true } } } }),
    prisma.xpLedger.findMany({ where, orderBy: { createdAt: 'asc' } }), prisma.streak.findUnique({ where: { tenantId_userId: where } }),
    prisma.userBadge.findMany({ where: { userId: ctx.userId }, include: { badge: { select: { code: true, name: true } } } }),
    prisma.notification.findMany({ where }), prisma.aiConversation.findMany({ where, include: { messages: { select: { role: true, contentMd: true, createdAt: true } } } }),
  ]);
  const [learnerProfile, agentLabRuns, helpRequests] = await Promise.all([prisma.learnerProfile.findUnique({ where: { tenantId_userId: where } }), prisma.agentLabRun.findMany({ where }), prisma.helpRequest.findMany({ where: { tenantId: where.tenantId, learnerId: where.userId }, include: { messages: true } })]);
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'privacy.data_exported', resourceType: 'User', resourceId: ctx.userId });
  return { exportedAt: new Date().toISOString(), institution: ctx.tenantName, user, settings, enrollments, progress, submissions, xpLedger: xp, streak, badges, notifications, aiConversations: ai, learnerProfile, agentLabRuns, helpRequests };
}

export async function requestDeletion(ctx: Ctx) {
  const s = await getSettings(ctx);
  if (s.deletionRequestedAt) throw conflict('A deletion request is already in progress.');
  await prisma.$transaction(async tx => { await tx.userSetting.update({ where: { id: s.id }, data: { deletionRequestedAt: new Date() } }); await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'privacy.deletion_requested', resourceType: 'User', resourceId: ctx.userId }); });
  return { ok: true, note: 'Your request is recorded. Personal data is deleted within 30 days after institution review; you can cancel within 7 days.' };
}
