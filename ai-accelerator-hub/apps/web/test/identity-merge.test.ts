/**
 * One person, one account (docs/IDENTITY_DEDUP_SPEC.md AC-8 to AC-12). Runs on the test database.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { register } from '@/lib/domain/account';
import { awardXp, verifyChain } from '@/lib/domain/xp';
import { verifyCredentials } from '@/lib/auth';
import { findUserByAnyEmail, duplicateReport, mergeUsers, mergeDuplicates, createTicket, resolveTicket, autoMergeCertain } from '@/lib/domain/identity';
import { NextRequest } from 'next/server';
import { GET as cronGet } from '@/app/api/cron/identity-merge/route';

const PW = 'Mami-pass-12345';
let tenantId = '', primaryId = '', secondaryId = '';
const ctxOf = (userId: string, superAdmin: boolean): Ctx => ({ userId, email: 'x@test.in', name: 'SA', tenantId, tenantSlug: '', tenantName: '', role: superAdmin ? 'super_admin' : 'learner', cohortId: null, superAdmin });

beforeAll(async () => {
  await register({ name: 'Mami Dala', email: 'mami.dala@gmail.com', password: PW, birthYear: 1995, acceptTerms: true });
  const p = await prisma.user.findUniqueOrThrow({ where: { email: 'mami.dala@gmail.com' } });
  primaryId = p.id;
  tenantId = (await prisma.membership.findFirstOrThrow({ where: { userId: p.id } })).tenantId;
});

describe('refusing a second account', () => {
  it('AC-8: same mailbox, or the same person with a look-alike email, creates nothing', async () => {
    const before = await prisma.user.count();
    await expect(register({ name: 'Mami Dala', email: 'MamiDala+aihub@googlemail.com', password: PW, birthYear: 1995, acceptTerms: true })).rejects.toThrow(/already exists/);
    await expect(register({ name: 'Mami Dala R', email: 'mamidala22@yahoo.com', password: PW, birthYear: 1995, acceptTerms: true })).rejects.toMatchObject({ code: 'POSSIBLE_DUPLICATE', message: expect.stringMatching(/m•••@gmail\.com/) });
    expect(await prisma.user.count()).toBe(before);
  });

  it('AC-13: a likely match may go ahead once the person confirms; the same mailbox never may', async () => {
    await register({ name: 'Ravi Teja', email: 'ravi.teja@gmail.com', password: PW, birthYear: 1995, acceptTerms: true });
    const input = { name: 'Ravi Teja K', email: 'raviteja77@yahoo.com', password: PW, birthYear: 1995, acceptTerms: true as const };
    await expect(register(input)).rejects.toMatchObject({ code: 'POSSIBLE_DUPLICATE' });
    await register({ ...input, confirmNewAccount: true });
    expect(await prisma.user.findUnique({ where: { email: 'raviteja77@yahoo.com' } })).not.toBeNull();
    await expect(register({ ...input, email: 'RaviTeja+x@googlemail.com', confirmNewAccount: true })).rejects.toThrow(/already exists/);
  });

  it('AC-8: a different person who only shares a first name registers fine', async () => {
    await register({ name: 'Mami Kumar', email: 'kumar.m@outlook.com', password: PW, birthYear: 1995, acceptTerms: true });
    expect(await prisma.user.findUnique({ where: { email: 'kumar.m@outlook.com' } })).not.toBeNull();
  });
});

describe('merge', () => {
  beforeAll(async () => {
    // A legacy duplicate that exists from before the rule: created directly, like old data.
    const s = await prisma.user.create({ data: { email: 'mami.dala.reddy@yahoo.com', name: 'Mami Dala Reddy', passwordHash: 'x', githubId: 'gh-mami-1' } });
    secondaryId = s.id;
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
    await prisma.membership.create({ data: { tenantId, userId: s.id, roleId: role.id, status: 'active' } });
    await awardXp(prisma, { tenantId, userId: s.id, amount: 50, source: 'quest', idempotencyKey: 'dup-merge-1' });
  });

  it('AC-9: a secondary email finds the primary account and signs in', async () => {
    await mergeUsers(ctxOf(primaryId, true), primaryId, secondaryId);
    expect((await findUserByAnyEmail('mami.dala.reddy@yahoo.com'))?.id).toBe(primaryId);
    const r = await verifyCredentials('mami.dala.reddy@yahoo.com', PW);
    expect(r.ok && r.user.id).toBe(primaryId);
  });

  it('AC-10: rows moved once, one membership, one name, tombstone cannot sign in, one audit entry', async () => {
    const p = await prisma.user.findUniqueOrThrow({ where: { id: primaryId } });
    const s = await prisma.user.findUniqueOrThrow({ where: { id: secondaryId } });
    expect(p.name).toBe('Mami Dala Reddy');
    expect(p.githubId).toBe('gh-mami-1');
    expect(await prisma.membership.count({ where: { tenantId, userId: primaryId } })).toBe(1);
    expect(await prisma.membership.count({ where: { userId: secondaryId } })).toBe(0);
    expect((await prisma.xpLedger.aggregate({ where: { userId: primaryId }, _sum: { amount: true } }))._sum.amount ?? 0).toBeGreaterThanOrEqual(50);
    expect((await verifyChain(tenantId, primaryId)).ok).toBe(true); // the hash chain still verifies after the merge
    expect(s.mergedIntoId).toBe(primaryId);
    expect(s.passwordHash).toBeNull();
    expect(await prisma.userEmail.count({ where: { userId: primaryId, isPrimary: true } })).toBe(1);
    expect(await prisma.userEmail.count({ where: { userId: primaryId, isPrimary: false } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { action: 'user.merged', resourceId: primaryId } })).toBe(1);
  });

  it('AC-12: merged and system accounts are refused', async () => {
    await expect(mergeUsers(ctxOf(primaryId, true), primaryId, secondaryId)).rejects.toThrow(/already merged/);
    await expect(mergeUsers(ctxOf(primaryId, true), primaryId, primaryId)).rejects.toThrow(/different/);
    const sys = await prisma.user.create({ data: { email: 'bot@system.local', name: 'Bot' } });
    await expect(mergeUsers(ctxOf(primaryId, true), primaryId, sys.id)).rejects.toThrow(/System accounts/);
  });

  it('AC-11: a learner cannot read the report or merge', async () => {
    await expect(duplicateReport(ctxOf(primaryId, false))).rejects.toThrow(/permission/);
    await expect(mergeDuplicates(ctxOf(primaryId, false), { auto: true })).rejects.toThrow(/Super Admin/);
  });

  it('the report finds a legacy duplicate and "merge all certain" leaves a likely one for review', async () => {
    const mk = (email: string, name: string) => prisma.user.create({ data: { email, name, passwordHash: 'x' } });
    const a = await mk('legacy.person@gmail.com', 'Legacy Person'); const b = await mk('legacyperson@gmail.com', 'Legacy P');   // certain (same mailbox)
    const c = await mk('zed.alpha@gmail.com', 'Zed Alpha'); const d = await mk('zedalpha88@yahoo.com', 'Zed Alpha Rao');        // likely
    const sa = ctxOf(primaryId, true);
    const rep = await duplicateReport(sa);
    const has = (x: string, y: string) => rep.groups.find(g => g.members.some(m => m.id === x) && g.members.some(m => m.id === y));
    expect(has(a.id, b.id)?.confidence).toBe('certain');
    expect(has(c.id, d.id)?.confidence).toBe('likely');
    await mergeDuplicates(sa, { auto: true });
    const after = await duplicateReport(sa);
    expect(after.groups.some(g => g.members.some(m => m.id === a.id) && g.members.some(m => m.id === b.id))).toBe(false);
    expect(after.groups.some(g => g.members.some(m => m.id === c.id) && g.members.some(m => m.id === d.id))).toBe(true);
  });
});

describe('institution admin, tickets and the automatic run', () => {
  let t2 = ''; let adminCtx: Ctx; let learnerRole = ''; const sa = () => ctxOf(primaryId, true);
  const mk = async (email: string, name: string, tenants: string[]) => {
    const u = await prisma.user.create({ data: { email, name, passwordHash: 'x' } });
    for (const t of tenants) await prisma.membership.create({ data: { tenantId: t, userId: u.id, roleId: learnerRole, status: 'active' } });
    return u;
  };
  beforeAll(async () => {
    t2 = (await prisma.tenant.create({ data: { name: 'Second Institute', slug: 'dup-second', code: 'DUPSEC', type: 'company', status: 'active' } })).id;
    learnerRole = (await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } })).id;
    const adm = await mk('inst.admin@test.in', 'Inst Admin', [tenantId]);
    adminCtx = { ...ctxOf(adm.id, false), role: 'tenant_admin' };
  });

  it('AC-17: an institution admin merges inside their institution and is refused for another institution', async () => {
    const x1 = await mk('anita.rao@gmail.com', 'Anita Rao', [tenantId]); const x2 = await mk('anitarao9@yahoo.com', 'Anita Rao K', [tenantId]);
    const rep = await duplicateReport(adminCtx);
    expect(rep.groups.find(g => g.members.some(m => m.id === x1.id))?.canMerge).toBe(true);
    await mergeUsers(adminCtx, x1.id, x2.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: x2.id } })).mergedIntoId).toBe(x1.id);
    const y1 = await mk('vikram.sethi@gmail.com', 'Vikram Sethi', [tenantId]); const y2 = await mk('vikramsethi3@yahoo.com', 'Vikram Sethi', [tenantId, t2]);
    await expect(mergeUsers(adminCtx, y1.id, y2.id)).rejects.toMatchObject({ code: 'OUT_OF_SCOPE' });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: y2.id } })).mergedIntoId).toBeNull();
    // the admin of the other institution does not even see a group that has no account of theirs
    expect((await duplicateReport({ ...adminCtx, tenantId: 'some-unrelated-institution' })).groups.some(g => g.members.some(m => m.id === y1.id))).toBe(false);
  });

  it('AC-18: a ticket is merged by a Super Admin, the requester is told, and asking twice gives one ticket', async () => {
    const y1 = await prisma.user.findUniqueOrThrow({ where: { email: 'vikram.sethi@gmail.com' } }); const y2 = await prisma.user.findUniqueOrThrow({ where: { email: 'vikramsethi3@yahoo.com' } });
    const a = await createTicket(adminCtx, { primaryId: y1.id, secondaryIds: [y2.id], note: 'same person' });
    const b = await createTicket(adminCtx, { primaryId: y2.id, secondaryIds: [y1.id] });
    expect(b.ticketId).toBe(a.ticketId);
    expect((await duplicateReport(sa())).tickets.some(t => t.id === a.ticketId)).toBe(true);
    await expect(resolveTicket(adminCtx, a.ticketId, { action: 'merge' })).rejects.toThrow(/Super Admin/);
    expect((await resolveTicket(sa(), a.ticketId, { action: 'merge' })).status).toBe('merged');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: y2.id } })).mergedIntoId).toBe(y1.id);
    expect(await prisma.notification.count({ where: { userId: adminCtx.userId, template: 'duplicate_ticket' } })).toBe(1);
    const z1 = await mk('kiran.babu@gmail.com', 'Kiran Babu', [tenantId]); const z2 = await mk('kiranbabu1@yahoo.com', 'Kiran Babu', [tenantId]);
    const t = await createTicket(adminCtx, { primaryId: z1.id, secondaryIds: [z2.id] });
    expect((await resolveTicket(sa(), t.ticketId, { action: 'reject', note: 'different people' })).status).toBe('rejected');
  });

  it('AC-20: a ticket whose accounts were merged elsewhere closes as already_merged', async () => {
    const w1 = await mk('meena.iyer@gmail.com', 'Meena Iyer', [tenantId]); const w2 = await mk('meenaiyer2@yahoo.com', 'Meena Iyer', [tenantId]);
    const t = await createTicket(adminCtx, { primaryId: w1.id, secondaryIds: [w2.id] });
    await mergeUsers(sa(), w1.id, w2.id);
    expect((await resolveTicket(sa(), t.ticketId, { action: 'merge' })).status).toBe('already_merged');
  });

  it('AC-19: the automatic run merges certain groups, tickets the oversized one, and the cron needs its secret', async () => {
    const pair = [await mk('auto.one@gmail.com', 'Auto One', [tenantId]), await mk('autoone@gmail.com', 'Auto One', [tenantId])];
    const crowd = await Promise.all([1, 2, 3, 4, 5, 6].map(i => mk(`crowd+${i}@outlook.com`, `Crowd Person ${i}`, [tenantId])));
    const r = await autoMergeCertain();
    expect(r.merged).toBeGreaterThanOrEqual(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: pair[1].id } })).mergedIntoId ?? (await prisma.user.findUniqueOrThrow({ where: { id: pair[0].id } })).mergedIntoId).not.toBeNull();
    expect(await prisma.duplicateTicket.count({ where: { reason: 'too_many_accounts', status: 'open' } })).toBe(1);
    expect(crowd.length).toBe(6);
    process.env.CRON_SECRET = 'test-secret';
    expect((await cronGet(new NextRequest('http://localhost/api/cron/identity-merge'))).status).toBe(401);
    expect((await cronGet(new NextRequest('http://localhost/api/cron/identity-merge', { headers: { authorization: 'Bearer test-secret' } }))).status).toBe(200);
    delete process.env.CRON_SECRET;
  });

  it('AC-21: a merge never raises a role: the primary\'s role stays and the higher one is recorded', async () => {
    const a = await mk('gita.nair@gmail.com', 'Gita Nair', [tenantId]); const b = await mk('gitanair5@yahoo.com', 'Gita Nair', []);
    const staff = (await prisma.role.findUniqueOrThrow({ where: { code: 'mentor' } })).id;
    await prisma.membership.create({ data: { tenantId, userId: b.id, roleId: staff, status: 'active' } });
    const r = await mergeUsers(sa(), a.id, b.id);
    expect(r.roleClashes).toEqual([{ tenantId, kept: 'learner', notCarried: 'mentor' }]);
    expect((await prisma.membership.findFirstOrThrow({ where: { userId: a.id, tenantId }, include: { role: true } })).role.code).toBe('learner');
  });

  it('AC-22: the automatic run leaves a group with a Super Admin account to a person', async () => {
    const sup = await mk('sunil.super@gmail.com', 'Sunil Super', [tenantId]); const dup = await mk('sunilsuper@gmail.com', 'Sunil Super', [tenantId]);
    await prisma.user.update({ where: { id: sup.id }, data: { globalRole: 'super_admin' } });
    await autoMergeCertain();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: dup.id } })).mergedIntoId).toBeNull();
    expect(await prisma.duplicateTicket.count({ where: { reason: 'super_admin_account', status: 'open' } })).toBeGreaterThanOrEqual(1);
  });

  it('AC-30: merging a minor with an adult account never loosens the minor\'s settings', async () => {
    const adult = await mk('lata.k@gmail.com', 'Lata K', [tenantId]); const kid = await mk('latak2@yahoo.com', 'Lata K', [tenantId]);
    await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId, userId: adult.id } }, update: {}, create: { tenantId, userId: adult.id, ageBand: 'adult', guardianConsent: 'not_required', leaderboardVisibility: 'cohort', globalOptIn: true } });
    await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId, userId: kid.id } }, update: {}, create: { tenantId, userId: kid.id, ageBand: 'minor', guardianConsent: 'pending', leaderboardVisibility: 'private', globalOptIn: false, guardianEmail: 'parent.k@gmail.com' } });
    await mergeUsers(sa(), adult.id, kid.id);
    expect(await prisma.userSetting.findUniqueOrThrow({ where: { tenantId_userId: { tenantId, userId: adult.id } } })).toMatchObject({ ageBand: 'minor', guardianConsent: 'pending', leaderboardVisibility: 'private', globalOptIn: false, guardianEmail: 'parent.k@gmail.com' });
  });

  it('AC-31: the automatic run leaves a certain group with a minor to a person', async () => {
    const a = await mk('minor.pair@gmail.com', 'Minor Pair', [tenantId]); const b = await mk('minorpair@gmail.com', 'Minor Pair', [tenantId]);
    await prisma.userSetting.create({ data: { tenantId, userId: b.id, ageBand: 'minor', guardianConsent: 'pending', leaderboardVisibility: 'private', guardianEmail: 'parent.m@gmail.com' } });
    await autoMergeCertain();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: b.id } })).mergedIntoId).toBeNull();
    expect(a.id).not.toBe(b.id);
    expect(await prisma.duplicateTicket.count({ where: { reason: 'minor_account', status: 'open' } })).toBeGreaterThanOrEqual(1);
  });

  it('AC-32: report-only mode says what it would merge and changes nothing', async () => {
    const a = await mk('dry.run@gmail.com', 'Dry Run', [tenantId]); const b = await mk('dryrun@gmail.com', 'Dry Run', [tenantId]);
    const r = await autoMergeCertain(undefined, { dryRun: true });
    expect(r).toMatchObject({ dryRun: true });
    expect((r as { wouldMerge: number }).wouldMerge).toBeGreaterThanOrEqual(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: b.id } })).mergedIntoId).toBeNull();
    expect(a.id).not.toBe(b.id);
    process.env.IDENTITY_AUTOMERGE = '';
    const res = await cronGet(new NextRequest('http://localhost/api/cron/identity-merge'));
    expect((await res.json()).dryRun).toBe(true);
  });
});
