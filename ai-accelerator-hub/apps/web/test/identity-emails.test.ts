/**
 * The owner's own emails (docs/IDENTITY_DEDUP_SPEC.md AC-26 to AC-29). Runs on the test database.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { register } from '@/lib/domain/account';
import { _outbox } from '@/lib/server/mail';
import { addEmail, verifyEmail, removeEmail, makePrimaryEmail, listEmails } from '@/lib/domain/emails';
import { findUserByAnyEmail } from '@/lib/domain/identity';
import { verifyCredentials } from '@/lib/auth';

const PW = 'Owner-pass-12345';
let me: Ctx, other: Ctx;
const tokenFor = (to: string) => { const m = [..._outbox].reverse().find(x => x.to === to); return /verifyEmail=([\w-]+)/.exec(m?.text ?? '')?.[1] ?? ''; };
const ctxFor = async (email: string): Promise<Ctx> => { const u = await prisma.user.findUniqueOrThrow({ where: { email } }); const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id } }); return { userId: u.id, email, name: u.name ?? '', tenantId: m.tenantId, tenantSlug: '', tenantName: '', role: 'learner', cohortId: null, superAdmin: false }; };

beforeAll(async () => {
  await register({ name: 'Owner One', email: 'owner.one@test.in', password: PW, birthYear: 1995, acceptTerms: true });
  await register({ name: 'Other Person', email: 'other.person@test.in', password: PW, birthYear: 1995, acceptTerms: true });
  me = await ctxFor('owner.one@test.in'); other = await ctxFor('other.person@test.in');
});

describe('adding a secondary email', () => {
  it('AC-26: it proves nothing until the link is opened by the signed-in owner', async () => {
    await addEmail(me, { email: 'owner.work@test.in' });
    expect((await listEmails(me)).find(e => e.email === 'owner.work@test.in')?.pending).toBe(true);
    expect(await findUserByAnyEmail('owner.work@test.in')).toBeNull();                          // cannot sign in or reset yet
    const token = tokenFor('owner.work@test.in'); expect(token.length).toBeGreaterThan(20);
    await expect(verifyEmail(other, token)).rejects.toThrow(/invalid or has expired/);          // another account cannot confirm it
    await verifyEmail(me, token);
    expect((await findUserByAnyEmail('owner.work@test.in'))?.id).toBe(me.userId);
    expect((await verifyCredentials('owner.work@test.in', PW)).ok).toBe(true);
    await expect(verifyEmail(me, token)).rejects.toThrow(/invalid or has expired/);             // the link works once
  });

  it('AC-26: an address that belongs to someone else is refused, and an unconfirmed claim never blocks the real owner', async () => {
    await expect(addEmail(me, { email: 'other.person@test.in' })).rejects.toThrow(/another account/);
    await addEmail(me, { email: 'victim@test.in' });                                            // a squatter claims it, never confirms
    await register({ name: 'Real Victim', email: 'victim@test.in', password: PW, birthYear: 1995, acceptTerms: true }); // the real owner still signs up
    expect((await findUserByAnyEmail('victim@test.in'))?.id).not.toBe(me.userId);
  });
});

describe('minors', () => {
  it('AC-33: a learner cannot add their parent or guardian\'s email as their own', async () => {
    await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId: other.tenantId, userId: other.userId } }, update: { guardianEmail: 'parent.other@test.in', ageBand: 'minor' }, create: { tenantId: other.tenantId, userId: other.userId, guardianEmail: 'parent.other@test.in', ageBand: 'minor' } });
    await expect(addEmail(other, { email: 'parent.other@test.in' })).rejects.toThrow(/parent or guardian/);
  });
});

describe('removing and changing', () => {
  it('AC-27: the owner removes a secondary email with no verification; the main one cannot be removed', async () => {
    const row = (await listEmails(me)).find(e => e.email === 'owner.work@test.in')!;
    await removeEmail(me, row.id);
    expect(await findUserByAnyEmail('owner.work@test.in')).toBeNull();
    const main = (await listEmails(me)).find(e => e.isPrimary)!;
    await expect(removeEmail(me, main.id)).rejects.toThrow(/main email/);
  });

  it('AC-28: a confirmed secondary becomes the main email; the old one stays as a secondary and still signs in', async () => {
    await addEmail(me, { email: 'owner.new@test.in' }); await verifyEmail(me, tokenFor('owner.new@test.in'));
    const row = (await listEmails(me)).find(e => e.email === 'owner.new@test.in')!;
    await makePrimaryEmail(me, row.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: me.userId } })).email).toBe('owner.new@test.in');
    expect((await listEmails(me)).find(e => e.email === 'owner.one@test.in')?.isPrimary).toBe(false);
    expect((await verifyCredentials('owner.one@test.in', PW)).ok).toBe(true);
    expect(_outbox.some(m => m.to === 'owner.one@test.in' && /main email was changed/.test(m.text))).toBe(true);
  });

  it('AC-29: at most five emails, an unconfirmed one cannot become main', async () => {
    await addEmail(me, { email: 'p1@test.in' });
    const pending = (await listEmails(me)).find(e => e.email === 'p1@test.in')!;
    await expect(makePrimaryEmail(me, pending.id)).rejects.toThrow(/Confirm this email/);
    for (const n of [2, 3]) await addEmail(me, { email: `p${n}@test.in` });
    await expect(addEmail(me, { email: 'p4@test.in' })).rejects.toThrow(/up to 5/);
  });
});
