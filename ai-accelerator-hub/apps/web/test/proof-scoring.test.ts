/**
 * Screenshot proof, validation and scoring (docs/AGENT_LAB_PROOF_SCORING_SPEC.md §7, P1–P7).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { startRun, saveStep, submitRun, verifyRun, precheck, KEY_QUIZ } from '@/lib/domain/agentLab';
import { uploadFile } from '@/lib/domain/files';
import { readImage } from '@/lib/domain/imageProof';
import { scoreAuto, scoreReview, type AutoInput } from '@/lib/domain/proofScore';
import { totalXp } from '@/lib/domain/xp';
import { makePng } from './helpers/png';

const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
const w = (n: number, x = 'word') => Array.from({ length: n }, (_, i) => `${x}${i}`).join(' ');
const parts = { goal: 'Build a script that renames my holiday photos by date', context: 'I have two hundred JPG photos in one folder on my laptop', constraints: 'Python only, do not delete any files', output: 'One script file and a short readme', check: 'Run it on a copy of the folder first' };
const Y = { agentRunning: 'yes', matchesResult: 'yes', noSensitiveData: 'yes' } as const;

describe('Image validation (pure)', () => {
  it('P1: reads real PNG, JPEG, WebP and GIF headers; rejects non-images', () => {
    expect(readImage(makePng(1280, 720))).toEqual({ type: 'image/png', width: 1280, height: 720 });
    // Minimal JPEG: SOI, APP0 (len 16), SOF0 with height 360 and width 640, EOI.
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x68, 0x02, 0x80, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9]);
    expect(readImage(jpg)).toEqual({ type: 'image/jpeg', width: 640, height: 360 });
    // WebP VP8L: RIFF size WEBP VP8L size 0x2f + 14-bit (w-1), 14-bit (h-1).
    const v = (1023) | (767 << 14); const webp = Buffer.alloc(30); webp.write('RIFF', 0); webp.writeUInt32LE(22, 4); webp.write('WEBP', 8); webp.write('VP8L', 12); webp.writeUInt32LE(10, 16); webp[20] = 0x2f; webp.writeUInt32LE(v, 21);
    expect(readImage(webp)).toEqual({ type: 'image/webp', width: 1024, height: 768 });
    const gif = Buffer.from('GIF89a\x20\x03\x58\x02', 'latin1');
    expect(readImage(gif)).toEqual({ type: 'image/gif', width: 800, height: 600 });
    expect(readImage(Buffer.from('this is not an image at all, just text'))).toBeNull();
    expect(readImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]))).toBeNull(); // truncated PNG
  });
});

describe('Scoring (pure)', () => {
  const base: AutoInput = { agent: 'kilo_code', os: 'macos', versionOutput: '7.8.27', install: { method: 'cli', nodeVersion: 'v24.22.2' }, promptParts: parts, resultSummary: w(35), verifiedNote: w(16), screenshot: { exists: true, isImage: true, width: 1280, height: 720, avStatus: 'skipped', reused: false } };
  it('P4: documented points per check, and gates', () => {
    const full = scoreAuto(base);
    expect(full.items.map(x => [x.id, x.points])).toEqual([['A1', 20], ['A2', 5], ['A3', 15], ['A4', 10], ['A5', 10]]);
    expect(full.total).toBe(60); expect(full.gatesOk).toBe(true);
    const weak = scoreAuto({ ...base, promptParts: { ...parts, constraints: 'none' }, resultSummary: w(10), screenshot: { ...base.screenshot, width: 500, height: 300 } });
    expect(weak.items.find(x => x.id === 'A3')!.points).toBe(12);
    expect(weak.items.find(x => x.id === 'A4')!.points).toBe(4);
    expect(weak.items.find(x => x.id === 'A5')!.points).toBe(7);
    expect(weak.gatesOk).toBe(true);
    expect(scoreAuto({ ...base, versionOutput: 'npm ERR!' }).items[0]).toMatchObject({ id: 'A1', points: 0, gateFailed: true });
    expect(scoreAuto({ ...base, screenshot: { ...base.screenshot, reused: true } }).gatesOk).toBe(false);
    expect(scoreAuto({ ...base, install: { method: 'cli', nodeVersion: '' } }).items[1].points).toBe(0);
    expect(scoreAuto({ ...base, agent: 'codex_cli', install: { method: 'npm', nodeVersion: 'v14.21.3' }, versionOutput: 'OpenAI Codex (v0.167.0)' }).items[1].points).toBe(0);
  });
  it('P6 (pure): outcome and XP are computed', () => {
    expect(scoreReview(60, true, Y)).toMatchObject({ total: 100, pass: true, xp: 40 });
    expect(scoreReview(45, true, { agentRunning: 'yes', matchesResult: 'partly', noSensitiveData: 'yes' })).toMatchObject({ total: 78, pass: true, xp: 31 });
    expect(scoreReview(60, true, { ...Y, noSensitiveData: 'partly' }).pass).toBe(false); // gate
    expect(scoreReview(60, true, { ...Y, agentRunning: 'no' }).pass).toBe(false); // gate
    expect(scoreReview(25, true, Y)).toMatchObject({ total: 65, pass: false, xp: 0 });
    expect(scoreReview(60, false, Y).pass).toBe(false);
  });
});

describe('Upload, pre-check, submit and review (integration)', () => {
  let a: Ctx, b: Ctx, reviewer: Ctx;
  const ctxFor = async (email: string): Promise<Ctx> => { const u = await prisma.user.findUniqueOrThrow({ where: { email } }); const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } }); return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false }; };
  const prep = async (c: Ctx, agent: 'kilo_code' | 'opencode') => {
    const r = await startRun(c, { agent, os: 'macos' });
    await saveStep(c, r.id, 'prepare', { checked: [] });
    if (agent === 'kilo_code') await saveStep(c, r.id, 'install', { method: 'cli', versionOutput: '7.8.27', nodeVersion: 'v24.22.2' });
    else await saveStep(c, r.id, 'install', { method: 'brew', versionOutput: 'opencode-v2 2.2.6' });
    await saveStep(c, r.id, 'connect', { quiz: KEY_QUIZ.answer, noKeyShared: true });
    await saveStep(c, r.id, 'prompt', { before: 'rename my photos please', parts });
    return r.id;
  };
  beforeAll(async () => {
    const y = new Date().getFullYear();
    await register({ name: 'Proof A', email: 'proof.a@example.test', password: 'Proofaaaa@123', birthYear: y - 30, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
    await register({ name: 'Proof B', email: 'proof.b@example.test', password: 'Proofbbbb@123', birthYear: y - 31, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
    [a, b, reviewer] = await Promise.all(['proof.a@example.test', 'proof.b@example.test', 'reviewer@aihub.in'].map(ctxFor));
    const os = await import('os'); const path = await import('path'); const fs = await import('fs');
    process.env.UPLOAD_DIR = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hub-proof-'));
  });
  beforeEach(() => _resetRateLimits());

  it('P2: upload stores hash and size; a fake image is rejected', async () => {
    const up = await uploadFile(a, { filename: 'shot.png', mime: 'image/png', bytes: makePng(1024, 640, 11) });
    expect(up).toMatchObject({ width: 1024, height: 640 });
    const f = await prisma.file.findUniqueOrThrow({ where: { id: up.id } });
    expect(f.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(await status(uploadFile(a, { filename: 'fake.png', mime: 'image/png', bytes: Buffer.from('definitely not a png file') }))).toBe(400);
    expect(await status(uploadFile(a, { filename: 'liar.png', mime: 'image/png', bytes: Buffer.from('GIF89a\x20\x03\x58\x02', 'latin1') }))).toBe(400);
  });

  it('P3 + P5: reuse is a gate; small screenshot needs acknowledgement; then submit works', async () => {
    const runA = await prep(a, 'kilo_code');
    const img = makePng(1280, 720, 21);
    const shotA = await uploadFile(a, { filename: 'a.png', mime: 'image/png', bytes: img }, { entityType: 'agent_lab', entityId: runA });
    await saveStep(a, runA, 'result', { summary: w(35), verified: w(16), screenshotId: shotA.id });
    // Re-uploading the same image to the same run is fine.
    await uploadFile(a, { filename: 'a-again.png', mime: 'image/png', bytes: img }, { entityType: 'agent_lab', entityId: runA });
    expect((await precheck(a, runA)).gatesOk).toBe(true);

    // Learner B reuses A's exact image → gate fails, submit blocked.
    const runB = await prep(b, 'kilo_code');
    const shotB = await uploadFile(b, { filename: 'copied.png', mime: 'image/png', bytes: img }, { entityType: 'agent_lab', entityId: runB });
    await saveStep(b, runB, 'result', { summary: w(35), verified: w(16), screenshotId: shotB.id });
    const pb = await precheck(b, runB);
    expect(pb.gatesOk).toBe(false); expect(pb.items.find(x => x.id === 'A5')!.detail).toContain('already used');
    expect(await status(submitRun(b, runB))).toBe(400);

    // Learner A reusing their own Kilo screenshot for a different agent is also caught.
    const runA2 = await prep(a, 'opencode');
    const own = await uploadFile(a, { filename: 'same.png', mime: 'image/png', bytes: img }, { entityType: 'agent_lab', entityId: runA2 });
    await saveStep(a, runA2, 'result', { summary: w(35), verified: w(16), screenshotId: own.id });
    expect((await precheck(a, runA2)).gatesOk).toBe(false);

    // B replaces with a small but genuine screenshot → gates pass, acknowledgement needed.
    const small = await uploadFile(b, { filename: 'small.png', mime: 'image/png', bytes: makePng(500, 300, 33) }, { entityType: 'agent_lab', entityId: runB });
    await saveStep(b, runB, 'result', { summary: w(35), verified: w(16), screenshotId: small.id });
    const pb2 = await precheck(b, runB);
    expect(pb2).toMatchObject({ gatesOk: true, needsAck: true, total: 57 });
    expect(await status(submitRun(b, runB))).toBe(409);
    const sub = await submitRun(b, runB, { acknowledge: true });
    expect(sub.state).toBe('submitted');
    expect(sub.autoChecks).toMatchObject({ total: 57, acknowledged: ['A5'] });
    // A's full-marks proof submits without acknowledgement.
    expect((await submitRun(a, runA)).state).toBe('submitted');
  });

  it('P6 + P7: computed outcome, prorated XP once, retry after needs changes', async () => {
    const runA = (await prisma.agentLabRun.findFirstOrThrow({ where: { userId: a.userId, agent: 'kilo_code' } })).id;
    const runB = (await prisma.agentLabRun.findFirstOrThrow({ where: { userId: b.userId, agent: 'kilo_code' } })).id;
    // B: screenshot shows a key → gate fails → needs changes, no XP.
    const xb0 = await totalXp(b.tenantId, b.userId);
    const r1 = await verifyRun(reviewer, runB, { answers: { ...Y, noSensitiveData: 'no' }, note: 'An API key is visible in the corner; crop it and revoke the key.' });
    expect(r1).toMatchObject({ state: 'needs_changes', xp: 0, proofScore: 87 });
    expect(r1.reasons.join(' ')).toContain('secrets');
    expect(await totalXp(b.tenantId, b.userId)).toBe(xb0);
    // Retry with a new, big screenshot → full marks → verified, XP 40.
    const fresh = await uploadFile(b, { filename: 'fresh.png', mime: 'image/png', bytes: makePng(1440, 900, 44) }, { entityType: 'agent_lab', entityId: runB });
    await saveStep(b, runB, 'result', { summary: w(35), verified: w(16), screenshotId: fresh.id });
    const again = await submitRun(b, runB);
    expect(again.attempts).toBe(2);
    expect(await verifyRun(reviewer, runB, { answers: Y, note: 'Kilo panel and the renamed files are both visible.' })).toMatchObject({ state: 'verified', xp: 40, proofScore: 100 });
    expect(await totalXp(b.tenantId, b.userId)).toBe(xb0 + 40);
    // A: partial review → 60 + 15 + 7.5 + 10 = 92.5 → 93 → XP round(40*93/100)=37.
    const xa0 = await totalXp(a.tenantId, a.userId);
    expect(await verifyRun(reviewer, runA, { answers: { ...Y, matchesResult: 'partly' }, note: 'Agent visible; result only partly shown.' })).toMatchObject({ state: 'verified', proofScore: 93, xp: 37 });
    expect(await totalXp(a.tenantId, a.userId)).toBe(xa0 + 37);
    const stored = await prisma.agentLabRun.findUniqueOrThrow({ where: { id: runA } });
    expect(stored.proofScore).toBe(93); expect(JSON.parse(stored.reviewScores!).answers.matchesResult).toBe('partly');
  });
});
