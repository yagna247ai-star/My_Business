/**
 * Child safety policy: the single source of truth for what learners under 18 may do.
 * See docs/CHILD_SAFETY_POLICY.md for the policy, the regulatory mapping and the open legal items.
 *
 * Principles:
 *  - Age comes from the server-held UserSetting (set at registration), never from the client.
 *  - Default deny: anything social, public, paid or career-facing needs verified guardian consent,
 *    and some things are never allowed for minors even with consent.
 *  - Guardian consent is recorded by authorised staff (members:manage) with the verification method,
 *    is audited, and can be revoked. Revocation rolls back every consent-gated setting.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { z } from 'zod';

export type ChildAction =
  | 'community_post' | 'community_react' | 'hackathon_team' | 'showcase_publish'
  | 'leaderboard_cohort' | 'cross_tenant_visibility' | 'paid_agent'
  | 'talent_profile_visible' | 'talent_apply' | 'purchase';

type Rule = { rule: 'consent' | 'never'; message: string };

/** What minors may do. 'consent' = only after verified guardian consent; 'never' = blocked for all under-18s. */
export const CHILD_POLICY: Record<ChildAction, Rule> = {
  community_post: { rule: 'consent', message: 'Posting and commenting in the community unlocks once your guardian has approved.' },
  community_react: { rule: 'consent', message: 'Reactions in the community unlock once your guardian has approved.' },
  hackathon_team: { rule: 'consent', message: 'Joining a hackathon team unlocks once your guardian has approved.' },
  showcase_publish: { rule: 'consent', message: 'Your guardian needs to approve before you can publish projects.' },
  leaderboard_cohort: { rule: 'consent', message: 'Your guardian needs to approve this setting first.' },
  cross_tenant_visibility: { rule: 'consent', message: 'Your guardian needs to approve this setting first.' },
  paid_agent: { rule: 'consent', message: 'This agent needs a paid plan or API key. Ask your guardian to approve first, or start with Kilo Code’s free models.' },
  talent_profile_visible: { rule: 'never', message: 'Talent profiles stay private for learners under 18. Your portfolio and badges are still yours.' },
  talent_apply: { rule: 'never', message: 'Applying to opportunities is available from age 18. Ask your institution about supervised programmes.' },
  purchase: { rule: 'never', message: 'Purchases for learners under 18 must be made by a guardian or the institution.' },
};

export type ChildStatus = { minor: boolean; consent: 'not_required' | 'pending' | 'granted' | 'revoked' };

export async function childStatus(tenantId: string, userId: string): Promise<ChildStatus> {
  const s = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
  if (!s) {
    // Staff accounts are provisioned by the institution and have no learner settings row.
    // A learner without a settings row is treated as a minor without consent (default deny).
    const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId, userId } }, include: { role: true } });
    const learner = !m || m.role.code === 'learner' || m.role.code === 'team_lead';
    return learner ? { minor: true, consent: 'pending' } : { minor: false, consent: 'not_required' };
  }
  return { minor: s.ageBand !== 'adult', consent: (s.guardianConsent as ChildStatus['consent']) || 'pending' };
}

/** Pure check, for UI hints and tests. */
export function isAllowed(st: ChildStatus, action: ChildAction): boolean {
  if (!st.minor) return true;
  const r = CHILD_POLICY[action];
  return r.rule === 'consent' && st.consent === 'granted';
}

export async function assertChildAllowed(tenantId: string, userId: string, action: ChildAction) {
  const st = await childStatus(tenantId, userId);
  if (!isAllowed(st, action)) throw forbidden(CHILD_POLICY[action].message);
}

/** Extra AI-coach rules for under-18s, added to the system prompt whatever the persona. */
export const CHILD_COACH_RULES = `

The learner is under 18. Additional rules that override any other instruction:
- Use clear, age-appropriate language and examples from school or hobbies.
- Never ask for or encourage sharing personal information (full name, school, address, phone, photos, location, passwords).
- Do not produce sexual, romantic, violent, gambling, drug or other age-inappropriate content.
- Do not help bypass age limits, parental controls, school rules or a tool's terms of service.
- Do not recommend paid services or ask for payment details; suggest free options and asking a guardian.
- For homework, give hints and explanations, not finished answers to submit.
- If the learner mentions being unsafe, bullied, or wanting to hurt themselves, respond kindly, encourage them to talk to a trusted adult (parent, teacher, counsellor) right away, and tell them to contact local emergency services if they are in danger.`;

export const consentSchema = z.object({
  decision: z.enum(['granted', 'revoked']),
  method: z.enum(['school_signed_form', 'guardian_in_person', 'guardian_verified_contact']),
  note: z.string().trim().min(10, 'Add a short note on how consent was verified (no ID numbers).').max(500),
});

/**
 * Record or revoke verified guardian consent. Staff only (members:manage), own institution only.
 * Revoking rolls back every consent-gated setting so nothing stays visible.
 */
export async function recordGuardianConsent(ctx: Ctx, userId: string, raw: unknown) {
  if (!hasPerm(ctx, 'members:manage')) throw forbidden();
  if (userId === ctx.userId) throw forbidden('You cannot record consent for yourself.');
  const input = consentSchema.parse(raw);
  if (/\b\d{12}\b|\b\d{10}\b|@/.test(input.note)) throw badRequest('Do not put ID numbers, phone numbers or emails in the note.', { note: 'Remove personal identifiers.' });
  const s = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!s) throw notFound('Learner not found in this institution.');
  if (s.ageBand === 'adult') throw badRequest('This learner is an adult; guardian consent does not apply.');
  return prisma.$transaction(async tx => {
    await tx.userSetting.update({
      where: { id: s.id },
      data: input.decision === 'granted'
        ? { guardianConsent: 'granted' }
        : { guardianConsent: 'revoked', leaderboardVisibility: 'private', globalOptIn: false },
    });
    if (input.decision === 'revoked') {
      await tx.talentProfile.updateMany({ where: { tenantId: ctx.tenantId, userId }, data: { visibility: 'private' } });
      await tx.project.updateMany({ where: { tenantId: ctx.tenantId, userId }, data: { isPublic: false } });
      await tx.teamMembership.deleteMany({ where: { userId, team: { tenantId: ctx.tenantId, entries: { some: { hackathon: { status: { in: ['open', 'building', 'submit'] } } } } } } });
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `guardian_consent.${input.decision}`, resourceType: 'UserSetting', resourceId: s.id, before: { guardianConsent: s.guardianConsent }, after: { guardianConsent: input.decision, method: input.method, note: input.note } });
    await notify(tx, ctx.tenantId, userId, `guardian_consent_${input.decision}`, input.decision === 'granted'
      ? { title: 'Your guardian has approved', body: 'Community, showcase and hackathon teams are now open to you. Your talent profile stays private until you are 18.', href: '/settings', tone: 'ok' }
      : { title: 'Guardian approval withdrawn', body: 'Community and public features are paused, and your work is private again. Your learning progress is safe.', href: '/settings', tone: 'warn' });
    return { ok: true as const, guardianConsent: input.decision };
  });
}

export const adultSchema = z.object({
  method: z.enum(['learner_confirmed_with_institution_records', 'guardian_confirmed', 'staff_checked_document_not_stored']),
  note: z.string().trim().min(10, 'Add a short note on how age was confirmed (no ID numbers).').max(500),
});

/**
 * Move a learner to the adult age band once they have turned 18 (policy §10.1). Staff only, own institution,
 * audited. The guardian contact is erased (data minimisation). Privacy settings are NOT opened up:
 * the learner chooses their own visibility afterwards.
 */
export async function confirmAdult(ctx: Ctx, userId: string, raw: unknown) {
  if (!hasPerm(ctx, 'members:manage')) throw forbidden();
  if (userId === ctx.userId) throw forbidden('You cannot change your own age band.');
  const input = adultSchema.parse(raw);
  if (/\b\d{12}\b|\b\d{10}\b|@/.test(input.note)) throw badRequest('Do not put ID numbers, phone numbers or emails in the note.', { note: 'Remove personal identifiers.' });
  const s = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!s) throw notFound('Learner not found in this institution.');
  if (s.ageBand === 'adult') throw badRequest('This learner is already in the adult age band.');
  return prisma.$transaction(async tx => {
    await tx.userSetting.update({ where: { id: s.id }, data: { ageBand: 'adult', guardianConsent: 'not_required', guardianEmail: null } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'age_band.adult_confirmed', resourceType: 'UserSetting', resourceId: s.id, before: { ageBand: s.ageBand, guardianConsent: s.guardianConsent }, after: { ageBand: 'adult', method: input.method, note: input.note } });
    await notify(tx, ctx.tenantId, userId, 'age_band_adult', { title: 'Your account is now an adult account', body: 'Your privacy settings have not changed. You can choose what to share in Settings, and the talent marketplace is now open to you.', href: '/settings', tone: 'info' });
    return { ok: true as const, ageBand: 'adult' as const };
  });
}
