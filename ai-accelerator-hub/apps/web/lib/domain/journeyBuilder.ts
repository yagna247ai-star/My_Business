/**
 * Journey builder: lets an admin create a customised journey (stages and levels) for their institution.
 *
 * Mirrors the structure the seeds use (seed-v3.ts for the AI journey, seed-data-analytics.ts for the
 * data analytics journey): a Journey has Stages, Stages hold Levels, and every Level has six activity
 * slots. New slots start as 'unauthored', so the level shows its shape but no invented lessons, the same
 * rule as the AI journey (REQ-LVL-03). Activities are written later, then reviewed.
 *
 * Validation is pure and tested. Persistence checks the tenant and the permission first.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, forbidden } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';

export const SLOT_NAMES: [string, string][] = [
  ['MISSION_BRIEFING', 'Mission Briefing'],
  ['LEARN', 'Learn'],
  ['EXPLORE', 'Explore'],
  ['BUILD', 'Build'],
  ['SUBMIT_PROOF', 'Submit Proof'],
  ['EVALUATION_BOSS', 'Evaluation + Boss'],
];

const slugRe = /^[a-z0-9-]{3,40}$/;
const codeRe = /^[A-Z][A-Z0-9_]{2,39}$/;

const stageSchema = z.object({
  idx: z.number().int().min(1).max(10),
  title: z.string().trim().min(2).max(80),
});
const levelSchema = z.object({
  idx: z.number().int().min(1).max(15),
  code: z.string().trim().toUpperCase(),
  title: z.string().trim().min(2).max(120),
  stageIdx: z.number().int().min(1).max(10),
  summary: z.string().trim().max(400).optional(),
  xp: z.number().int().min(0).max(1000).default(100),
});
export const journeySpecSchema = z.object({
  slug: z.string().trim().toLowerCase(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  stages: z.array(stageSchema).min(1).max(10),
  levels: z.array(levelSchema).min(1).max(15),
});
export type JourneySpec = z.infer<typeof journeySpecSchema>;

/** Pure check of a journey spec. Returns the list of problems (empty when valid). */
export function journeyProblems(spec: JourneySpec): string[] {
  const p: string[] = [];
  if (!slugRe.test(spec.slug)) p.push('Slug is 3–40 lowercase letters, numbers or dashes.');
  const stageIdx = new Set<number>();
  for (const s of spec.stages) {
    if (stageIdx.has(s.idx)) p.push(`Stage ${s.idx} is listed twice.`);
    stageIdx.add(s.idx);
  }
  const levelIdx = new Set<number>();
  const codes = new Set<string>();
  for (const l of spec.levels) {
    if (levelIdx.has(l.idx)) p.push(`Level ${l.idx} is listed twice.`);
    levelIdx.add(l.idx);
    if (!codeRe.test(l.code)) p.push(`Level ${l.idx}: code must be UPPER_CASE with letters, numbers or underscores (e.g. L01_BASICS).`);
    if (codes.has(l.code)) p.push(`Level code ${l.code} is used twice.`);
    codes.add(l.code);
    if (!stageIdx.has(l.stageIdx)) p.push(`Level ${l.idx} is in stage ${l.stageIdx}, which is not defined.`);
  }
  for (let i = 1; i <= Math.max(...levelIdx); i++) {
    if (!levelIdx.has(i)) p.push(`Levels must be numbered without gaps: level ${i} is missing.`);
  }
  for (const s of stageIdx) {
    if (!spec.levels.some(l => l.stageIdx === s)) p.push(`Stage ${s} has no levels.`);
  }
  return p;
}

/** Create the journey for the signed-in admin's institution. Unpublished until the admin publishes it. */
export async function createJourney(ctx: Ctx, raw: unknown) {
  if (!hasPerm(ctx, 'content:manage')) throw forbidden();
  const parsed = journeySpecSchema.safeParse(raw);
  if (!parsed.success) throw badRequest('Check the journey form.', Object.fromEntries(parsed.error.issues.map(i => [i.path.join('.') || 'form', i.message])));
  const spec = parsed.data;
  const problems = journeyProblems(spec);
  if (problems.length) throw badRequest(problems[0], { form: problems.join(' ') });

  const exists = await prisma.journey.findFirst({ where: { tenantId: ctx.tenantId, slug: spec.slug } });
  if (exists) throw badRequest('A journey with this slug already exists in your institution.', { slug: 'Choose another slug.' });
  const codeTaken = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, code: { in: spec.levels.map(l => l.code) } }, select: { code: true } });
  if (codeTaken) throw badRequest(`Level code ${codeTaken.code} is already used in your institution.`, { code: 'Choose unique level codes.' });

  const journey = await prisma.$transaction(async tx => {
    const j = await tx.journey.create({ data: { tenantId: ctx.tenantId, slug: spec.slug, title: spec.title, description: spec.description || null, isPublished: false } });
    const stageIds = new Map<number, string>();
    for (const s of spec.stages) {
      const st = await tx.stage.create({ data: { journeyId: j.id, idx: s.idx, code: `STAGE_${spec.slug.toUpperCase().replace(/-/g, '_')}_${s.idx}`, title: s.title } });
      stageIds.set(s.idx, st.id);
    }
    for (const l of spec.levels) {
      const lv = await tx.level.create({ data: { tenantId: ctx.tenantId, journeyId: j.id, stageId: stageIds.get(l.stageIdx), idx: l.idx, code: l.code, title: l.title, summary: l.summary || null, xpReward: l.xp, isPublished: false } });
      for (let i = 1; i <= 6; i++) {
        const [code, title] = SLOT_NAMES[i - 1];
        await tx.activity.create({ data: { tenantId: ctx.tenantId, levelId: lv.id, idx: i, code, title, position: i, xpReward: 0, config: JSON.stringify({ kind: 'unauthored' }) } });
      }
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'journey.created', resourceType: 'Journey', resourceId: j.id, after: { slug: spec.slug, levels: spec.levels.length } });
    return j;
  });
  return { id: journey.id, slug: journey.slug, levels: spec.levels.length };
}

export async function listJourneys(ctx: Ctx) {
  if (!hasPerm(ctx, 'content:manage')) throw forbidden();
  return prisma.journey.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'desc' }, select: { id: true, slug: true, title: true, isPublished: true, _count: { select: { levels: true } } } });
}
