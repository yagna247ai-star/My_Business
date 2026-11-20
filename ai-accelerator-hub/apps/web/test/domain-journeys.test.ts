/**
 * Integration: domain journeys end to end on Postgres (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md).
 * Register with a domain → complete activities → screenshot and dataset validation → XP awarded once → standings.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { completeActivity, checkDataset, levelState } from '@/lib/domain/journey';
import { registrationJourneys } from '@/lib/domain/journeyAccess';
import { uploadFile } from '@/lib/domain/files';
import { totalXp } from '@/lib/domain/xp';
import { leaderboard } from '@/lib/domain/insights';
import { DOMAINS } from '@/lib/domain/daDomains/catalog';
import { buildDomainJourney, sampleCsv, DOMAIN_FAMILY } from '@/lib/domain/daDomains/curriculum';
import { makePng } from './helpers/png';

const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
const ctxFor = async (email: string): Promise<Ctx> => {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false };
};
const energy = buildDomainJourney(DOMAINS.find(d => d.slug === 'energy-utilities')!);
const cfgOf = async (levelCode: string, idx: number) => {
  const lv = await prisma.level.findFirstOrThrow({ where: { code: levelCode }, include: { activities: true } });
  return JSON.parse(lv.activities.find(a => a.idx === idx)!.config);
};
/** Complete activities 1 (briefing) and 2 (learn) with the right answers read from the stored config. */
const doBriefingAndLearn = async (c: Ctx, code: string) => {
  const b = await cfgOf(code, 1); await completeActivity(c, code, 1, { choice: b.check.answer });
  const l = await cfgOf(code, 2); const r = await completeActivity(c, code, 2, { answers: l.quiz.map((q: { answer: number }) => q.answer) });
  expect((r as { passed: boolean }).passed).toBe(true);
};

const RUN = Date.now().toString(36); // unique emails per run, so the suite is re-runnable on any database state
const EMAIL = { energy: `energy.learner.${RUN}@example.test`, other: `other.learner.${RUN}@example.test` };

describe('Domain journeys (integration)', () => {
  let learner: Ctx, other: Ctx;
  beforeAll(async () => {
    const y = new Date().getFullYear();
    await register({ name: 'Energy Learner', email: EMAIL.energy, password: 'Energyxx@1234', birthYear: y - 24, journeySlug: 'da-energy-utilities', acceptTerms: true } as never);
    await register({ name: 'Other Learner', email: EMAIL.other, password: 'Otherxxx@1234', birthYear: y - 25, journeySlug: 'da-education', acceptTerms: true } as never);
    [learner, other] = await Promise.all([EMAIL.energy, EMAIL.other].map(ctxFor));
    const os = await import('os'); const path = await import('path'); const fs = await import('fs');
    process.env.UPLOAD_DIR = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hub-domain-'));
  });
  beforeEach(() => _resetRateLimits());

  it('registration offers all 17 domain journeys, each tagged with its domain', async () => {
    const list = await registrationJourneys(prisma, learner.tenantId);
    const domains = list.filter(j => (j.config as { family?: string } | null)?.family === DOMAIN_FAMILY);
    expect(domains).toHaveLength(17);
    expect(domains.map(d => d.slug)).toContain('da-energy-utilities');
  });

  it('a learner who chose Energy & Utilities is enrolled in that journey with Module 1 open and 45 day pages', async () => {
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: learner.userId, state: 'active' }, include: { journey: { include: { levels: { include: { contents: true } } } } } });
    expect(e.journey.slug).toBe('da-energy-utilities');
    expect(e.journey.levels).toHaveLength(9);
    expect(e.journey.levels.flatMap(l => l.contents)).toHaveLength(45);
    const st = await levelState(learner, energy.levels[0].code);
    expect(st.locked).toBe(false);
  });

  it('screenshot evidence: validated image completes the step and awards XP once; bad uploads are refused', async () => {
    const code = energy.levels[0].code; // ENU_M1_FRAMING
    await doBriefingAndLearn(learner, code);
    const cfg = await cfgOf(code, 3);
    const tick = cfg.checklist.map(() => true);
    const tiny = await uploadFile(learner, { filename: 'tiny.png', mime: 'image/png', bytes: makePng(300, 200, 1) }, { entityType: 'level_evidence', entityId: code });
    expect(await status(completeActivity(learner, code, 3, { fileId: tiny.id, checklist: tick }))).toBe(400);
    const theirs = await uploadFile(other, { filename: 'canvas.png', mime: 'image/png', bytes: makePng(1280, 720, 2) }, { entityType: 'level_evidence', entityId: code });
    expect(await status(completeActivity(learner, code, 3, { fileId: theirs.id, checklist: tick }))).toBe(400);
    const good = await uploadFile(learner, { filename: 'canvas.png', mime: 'image/png', bytes: makePng(1280, 720, 3) }, { entityType: 'level_evidence', entityId: code });
    expect(await status(completeActivity(learner, code, 3, { fileId: good.id, checklist: tick.slice(1) }))).toBe(400); // every item must be ticked
    const before = await totalXp(learner.tenantId, learner.userId);
    const r = await completeActivity(learner, code, 3, { fileId: good.id, checklist: tick }) as { xp: number; first: boolean };
    expect(r.first).toBe(true);
    expect(r.xp).toBe(energy.levels[0].activities[2].xp);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(before + r.xp);
    const again = await completeActivity(learner, code, 3, { fileId: good.id, checklist: tick }) as { xp: number };
    expect(again.xp).toBe(0); // idempotent: no double points
  });

  it('dataset check: failures are reported without points; a valid dataset passes and earns XP', async () => {
    const code = energy.levels[1].code; // ENU_M2_COLLECTION
    // Module 2 opens after Module 1 is approved by review; simulate that approval here.
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: learner.userId, state: 'active' } });
    const lv2 = await prisma.level.findFirstOrThrow({ where: { code } });
    await prisma.progress.upsert({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: lv2.id } }, update: { state: 'available' }, create: { tenantId: learner.tenantId, enrollmentId: e.id, levelId: lv2.id, userId: learner.userId, state: 'available', unlockedAt: new Date() } });
    await doBriefingAndLearn(learner, code);

    const xp0 = await totalXp(learner.tenantId, learner.userId);
    const broken = sampleCsv(energy.schemas.dataset, 120).split('\n').map((line, i) => i === 0 ? line.replace('feeder_id,', '') : line).join('\n'); // header lost a column
    const bad = await checkDataset(learner, code, 3, 'meters.csv', Buffer.from(broken));
    expect(bad.passed).toBe(false);
    expect(bad.report!.checks.find(c => c.id === 'columns')!.ok).toBe(false);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(xp0);

    const withPhone = sampleCsv(energy.schemas.dataset, 120).replace(/\n(MET00001,)[^,]*/, '\n$19876543210');
    const pii = await checkDataset(learner, code, 3, 'meters.csv', Buffer.from(withPhone));
    expect(pii.passed).toBe(false);
    expect(pii.report!.checks.find(c => c.id === 'personal-data')!.ok).toBe(false);

    const notData = await checkDataset(learner, code, 3, 'report.pdf', Buffer.from('%PDF-1.4'));
    expect(notData.passed).toBe(false);
    expect(notData.error).toMatch(/CSV or Excel/);

    const ok = await checkDataset(learner, code, 3, 'meters.csv', Buffer.from(sampleCsv(energy.schemas.dataset, 120)));
    expect(ok.passed).toBe(true);
    expect(ok.xp).toBe(energy.levels[1].activities[2].xp);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(xp0 + ok.xp!);
  });

  it('the dataset activity cannot be completed without uploading a file', async () => {
    expect(await status(completeActivity(learner, energy.levels[1].code, 3, {}))).toBe(400);
  });

  it('points flow into the standings: the learner appears with their XP', async () => {
    const board = await leaderboard(learner, 'tenant');
    expect(board.me).not.toBeNull();
    expect(board.me!.xp).toBe(await totalXp(learner.tenantId, learner.userId));
    expect(board.me!.xp).toBeGreaterThan(0);
  });
});
