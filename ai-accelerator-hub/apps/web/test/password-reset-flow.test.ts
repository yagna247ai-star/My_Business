/**
 * Forgot password, end to end against the test database (docs/FORGOT_PASSWORD_SPEC.md).
 * Mail goes to the in-memory outbox in tests (lib/server/mail.ts), so links can be read back.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { register } from '@/lib/domain/account';
import { requestPasswordReset, resetPassword } from '@/lib/domain/passwordReset';
import { hashResetToken, GENERIC_FORGOT_MESSAGE } from '@/lib/domain/passwordResetCore';
import { verifyCredentials, _resetLoginFailures } from '@/lib/auth';
import { _outbox } from '@/lib/server/mail';
import { AppError } from '@/lib/server/errors';
import { DEFAULT_AREA } from '@/lib/domain/areas';

const EMAIL = 'forgetful@test.in', OLD = 'OldPassword-1', NEW = 'NewPassword-2';
const tokenFrom = (text: string) => decodeURIComponent(/reset-password\?token=([^\s"&]+)/.exec(text)![1]);

beforeAll(async () => {
  process.env.APP_URL = 'https://hub.test';
  await register({ name: 'Forgetful Learner', email: EMAIL, password: OLD, birthYear: 1998, acceptTerms: true });
});
beforeEach(async () => {
  _outbox.length = 0; _resetLoginFailures();
  await prisma.passwordResetToken.deleteMany({});
});

describe('new users get the default area (AREA_PICKER_SPEC AC-6)', () => {
  it('registration stores Bhagyanagar', async () => {
    expect((await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } })).area).toBe(DEFAULT_AREA);
  });
});

describe('forgot password', () => {
  it('AC-3: unknown email gets the same answer and no email', async () => {
    const r = await requestPasswordReset('nobody@test.in');
    expect(r).toEqual({ ok: true, message: GENERIC_FORGOT_MESSAGE });
    expect(_outbox).toHaveLength(0);
  });

  it('AC-4: known email gets one link from APP_URL; only the hash is stored', async () => {
    const r = await requestPasswordReset(' Forgetful@Test.in ');
    expect(r).toEqual({ ok: true, message: GENERIC_FORGOT_MESSAGE });
    expect(_outbox).toHaveLength(1);
    expect(_outbox[0].to).toBe(EMAIL);
    expect(_outbox[0].text).toContain('https://hub.test/reset-password?token=');
    const raw = tokenFrom(_outbox[0].text);
    const rows = await prisma.passwordResetToken.findMany({});
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hashResetToken(raw));
    expect(JSON.stringify(rows)).not.toContain(raw);
  });

  it('AC-5: a valid link sets the new password once', async () => {
    await requestPasswordReset(EMAIL);
    const raw = tokenFrom(_outbox[0].text);
    expect(await resetPassword(raw, NEW)).toEqual({ ok: true });
    expect((await verifyCredentials(EMAIL, NEW)).ok).toBe(true);
    expect((await verifyCredentials(EMAIL, OLD)).ok).toBe(false);
    await expect(resetPassword(raw, 'Another-pass-3')).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === 400);
    expect(_outbox.at(-1)!.subject).toMatch(/password was changed/i);
    await resetPasswordBack();
  });

  it('a newer link replaces the older one', async () => {
    await requestPasswordReset(EMAIL); await requestPasswordReset(EMAIL);
    const [first, second] = _outbox.map(m => tokenFrom(m.text));
    await expect(resetPassword(first, NEW)).rejects.toBeInstanceOf(AppError);
    expect(await resetPassword(second, NEW)).toEqual({ ok: true });
    await resetPasswordBack();
  });

  it('AC-6: a weak password is refused and the link still works', async () => {
    await requestPasswordReset(EMAIL);
    const raw = tokenFrom(_outbox[0].text);
    await expect(resetPassword(raw, 'short1')).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === 400);
    const row = await prisma.passwordResetToken.findUniqueOrThrow({ where: { tokenHash: hashResetToken(raw) } });
    expect(row.usedAt).toBeNull();
  });

  it('an expired link is refused', async () => {
    await requestPasswordReset(EMAIL);
    const raw = tokenFrom(_outbox[0].text);
    await prisma.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(resetPassword(raw, NEW)).rejects.toBeInstanceOf(AppError);
  });

  it('AC-7: at most three emails per address per hour', async () => {
    for (let i = 0; i < 4; i++) expect((await requestPasswordReset(EMAIL)).message).toBe(GENERIC_FORGOT_MESSAGE);
    expect(_outbox).toHaveLength(3);
  });

  it('requests and resets are audited without the token', async () => {
    await requestPasswordReset(EMAIL);
    const raw = tokenFrom(_outbox[0].text);
    await resetPassword(raw, NEW); await resetPasswordBack();
    const logs = await prisma.auditLog.findMany({ where: { action: { startsWith: 'auth.password_reset' } } });
    expect(logs.map(l => l.action)).toEqual(expect.arrayContaining(['auth.password_reset_requested', 'auth.password_reset_completed']));
    expect(JSON.stringify(logs)).not.toContain(raw);
  });
});

/** Restore the original password so each test starts from the same account. */
async function resetPasswordBack() {
  _outbox.length = 0;
  await prisma.passwordResetToken.deleteMany({});
  await requestPasswordReset(EMAIL);
  await resetPassword(tokenFrom(_outbox[0].text), OLD);
  await prisma.passwordResetToken.deleteMany({});
  _outbox.length = 0;
}
