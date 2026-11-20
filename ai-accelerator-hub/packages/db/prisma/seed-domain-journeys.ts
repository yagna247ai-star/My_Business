/**
 * Seed — 17 domain-based Data Analytics journeys (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md).
 *
 * Content comes from the same catalogue and generator the app uses (apps/web/lib/domain/daDomains), so the
 * database and the code never drift. Each domain becomes one Journey `da-<domain>` with 4 stages, 9 levels,
 * 45 day pages and 54 activities, plus 9 shared rubrics DOMAIN_M<n>_RUBRIC.
 *
 * Idempotent and safe for production builds:
 *  - upserts only; never deletes levels, days, activities or learner progress;
 *  - never changes isPublished on an existing journey or level (a Super Admin controls that);
 *  - skips a domain whose generated content hash is unchanged (fast re-runs).
 * Run:  DATABASE_URL=... TENANT_SLUG=demo npx tsx prisma/seed-domain-journeys.ts
 */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { DOMAINS } from '../../../apps/web/lib/domain/daDomains/catalog';
import { buildDomainJourney, MODULE_PLAN, type DomainJourney } from '../../../apps/web/lib/domain/daDomains/curriculum';

const prisma = new PrismaClient();
const TENANT_SLUG = process.env.TENANT_SLUG || 'demo';
const FORCE = process.env.FORCE_RESEED === '1';

const STAGES = [
  { idx: 1, code: 'STAGE_FRAME_COLLECT', title: 'Frame and Collect', levels: [1, 2] },
  { idx: 2, code: 'STAGE_PLATFORM_INGEST', title: 'Platform and Ingest', levels: [3, 4] },
  { idx: 3, code: 'STAGE_REFINE_MODEL', title: 'Refine and Model', levels: [5, 6] },
  { idx: 4, code: 'STAGE_INSIGHT_DELIVER', title: 'Insight, Predict and Deliver', levels: [7, 8, 9] },
];

const RUBRIC_DIMENSIONS = {
  correct_result: { name: 'Correct result', weight: 0.35, l1: 'Result is wrong or missing.', l3: 'Mostly right; one step is off.', l5: 'Matches the expected result and passes the checks.' },
  domain_reading: { name: 'Domain reading', weight: 0.25, l1: 'No link to the domain problem.', l3: 'Links to the problem but not to a decision.', l5: 'Explains what it means for the domain stakeholders and one action.' },
  method: { name: 'Method', weight: 0.20, l1: 'Unclear steps.', l3: 'Steps work but are hard to follow.', l5: 'Clear, repeatable steps using the right layer (bronze, silver, gold).' },
  data_checks: { name: 'Data checks', weight: 0.10, l1: 'No checks.', l3: 'One check named.', l5: 'Row counts, quality rules and reconciliation shown.' },
  reflection: { name: 'Reflection', weight: 0.10, l1: 'Missing.', l3: 'Short reflection.', l5: 'Names one improvement and one open question.' },
};

const hashOf = (j: DomainJourney) => createHash('sha256').update(JSON.stringify({ t: j.title, d: j.description, l: j.levels })).digest('hex').slice(0, 16);

async function seedRubrics() {
  for (const [i, m] of MODULE_PLAN.entries()) {
    const code = `DOMAIN_M${i + 1}_RUBRIC`;
    const title = `Domain Analytics — Module ${i + 1}: ${m.stage.replace(/^Stage \d of \d · /, '')}`;
    await prisma.rubric.upsert({ where: { code }, update: { title, dimensions: JSON.stringify(RUBRIC_DIMENSIONS), passThreshold: 3.0 }, create: { code, title, dimensions: JSON.stringify(RUBRIC_DIMENSIONS), passThreshold: 3.0 } });
  }
}

async function seedJourney(tenantId: string, j: DomainJourney): Promise<'created' | 'updated' | 'unchanged'> {
  const hash = hashOf(j);
  const existing = await prisma.journey.findUnique({ where: { tenantId_slug: { tenantId, slug: j.slug } } });
  const oldHash = existing?.config ? (JSON.parse(existing.config) as { hash?: string }).hash : undefined;
  if (existing && oldHash === hash && !FORCE) return 'unchanged';

  const config = JSON.stringify({ ...j.config, hash });
  const journey = existing
    ? await prisma.journey.update({ where: { id: existing.id }, data: { title: j.title, description: j.description, config } }) // isPublished untouched
    : await prisma.journey.create({ data: { tenantId, slug: j.slug, title: j.title, description: j.description, config, isPublished: true } });

  const stageIdByLevel: Record<number, string> = {};
  for (const s of STAGES) {
    const st = await prisma.stage.upsert({ where: { journeyId_idx: { journeyId: journey.id, idx: s.idx } }, update: { code: s.code, title: s.title }, create: { journeyId: journey.id, idx: s.idx, code: s.code, title: s.title } });
    for (const l of s.levels) stageIdByLevel[l] = st.id;
  }

  let prevLevelId: string | null = null;
  for (const l of j.levels) {
    const data = { code: l.code, title: l.title, summary: l.summary, description: `Days ${l.days[0].day}–${l.days[l.days.length - 1].day} of the 45-day ${j.config.name} journey.`, xpReward: l.xp, stageId: stageIdByLevel[l.idx], tags: JSON.stringify(['domain', j.config.domain, `module-${l.idx}`]) };
    // Every module is fully authored, so all are published on create; prerequisites still unlock them in order.
    const lv = await prisma.level.upsert({ where: { journeyId_idx: { journeyId: journey.id, idx: l.idx } }, update: data, create: { tenantId, journeyId: journey.id, idx: l.idx, isPublished: true, ...data } });
    if (prevLevelId) await prisma.levelPrerequisite.upsert({ where: { levelId_prerequisiteLevelId: { levelId: lv.id, prerequisiteLevelId: prevLevelId } }, update: {}, create: { levelId: lv.id, prerequisiteLevelId: prevLevelId } });
    prevLevelId = lv.id;

    for (const d of l.days) {
      const payload = JSON.stringify({ body: d.body, day: d.day, module: l.code });
      const title = `Day ${d.day} — ${d.title}`;
      const row = await prisma.content.findFirst({ where: { levelId: lv.id, kind: 'md', position: d.day } });
      if (row) await prisma.content.update({ where: { id: row.id }, data: { title, payload, durationMin: 240 } });
      else await prisma.content.create({ data: { levelId: lv.id, kind: 'md', position: d.day, title, payload, durationMin: 240 } });
    }
    for (const a of l.activities) {
      await prisma.activity.upsert({
        where: { levelId_idx: { levelId: lv.id, idx: a.idx } },
        update: { code: a.code, title: a.title, xpReward: a.xp, position: a.idx, config: JSON.stringify(a.config) },
        create: { tenantId, levelId: lv.id, idx: a.idx, code: a.code, title: a.title, xpReward: a.xp, position: a.idx, config: JSON.stringify(a.config) },
      });
    }
  }
  return existing ? 'updated' : 'created';
}

async function main() {
  const tenant = await prisma.tenant.upsert({ where: { slug: TENANT_SLUG }, update: {}, create: { slug: TENANT_SLUG, name: TENANT_SLUG === 'demo' ? 'Demo Institute' : TENANT_SLUG, plan: 'pro' } });
  await seedRubrics();
  const result: Record<string, number> = { created: 0, updated: 0, unchanged: 0 };
  for (const d of DOMAINS) result[await seedJourney(tenant.id, buildDomainJourney(d))]++;
  console.log(`✓ seed-domain-journeys (tenant ${TENANT_SLUG}): ${DOMAINS.length} domains — ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
