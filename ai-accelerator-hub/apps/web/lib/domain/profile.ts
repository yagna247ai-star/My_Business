/** Learner onboarding profile: validate answers, derive persona server-side, store, audit. */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';
import { buildPlan, onboardingSchema, RULES_VERSION, type Answers, type Persona, type Plan, type Safety } from './personalise';

export async function safetyOf(tenantId: string, userId: string): Promise<Safety> {
  const s = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
  return { minor: s?.ageBand === 'minor', guardianConsent: (s?.guardianConsent as Safety['guardianConsent']) || 'not_required' };
}

export async function getProfile(ctx: Ctx): Promise<{ answers: Answers; persona: Persona; contextCard: string | null; plan: Plan; updatedAt: Date } | null> {
  const p = await prisma.learnerProfile.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } } });
  if (!p) return null;
  const parsed = onboardingSchema.safeParse(JSON.parse(p.answers));
  if (!parsed.success) return null; // answers from an older form version: ask again
  const plan = buildPlan(parsed.data, await safetyOf(ctx.tenantId, ctx.userId)); // recomputed so consent changes apply at once
  return { answers: parsed.data, persona: plan.persona, contextCard: p.contextCard, plan, updatedAt: p.updatedAt };
}

/** Persona for content variants; null when the learner has not onboarded (base content is shown). */
export async function personaOf(tenantId: string, userId: string): Promise<Persona | null> {
  const p = await prisma.learnerProfile.findUnique({ where: { tenantId_userId: { tenantId, userId } }, select: { persona: true } });
  return (p?.persona as Persona) || null;
}

export async function saveProfile(ctx: Ctx, raw: unknown) {
  if (ctx.role !== 'learner' && ctx.role !== 'team_lead') throw forbidden('Only learners have a learning profile.');
  const a = onboardingSchema.parse(raw);
  const safety = await safetyOf(ctx.tenantId, ctx.userId);
  const plan = buildPlan(a, safety);
  const { contextCard, ...answers } = a;
  const key = { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } };
  const before = await prisma.learnerProfile.findUnique({ where: key, select: { persona: true } });
  await prisma.$transaction(async tx => {
    const row = await tx.learnerProfile.upsert({ where: key, update: { persona: plan.persona, answers: JSON.stringify(answers), contextCard: contextCard || null, rulesVer: RULES_VERSION }, create: { tenantId: ctx.tenantId, userId: ctx.userId, persona: plan.persona, answers: JSON.stringify(answers), contextCard: contextCard || null, rulesVer: RULES_VERSION } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: before ? 'profile.updated' : 'profile.created', resourceType: 'LearnerProfile', resourceId: row.id, before: before ? { persona: before.persona } : undefined, after: { persona: plan.persona, rulesVer: RULES_VERSION } });
  });
  return { persona: plan.persona, plan };
}
