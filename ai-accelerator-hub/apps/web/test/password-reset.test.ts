import { describe, it, expect } from 'vitest';
import { newResetToken, hashResetToken, tokenUsable, resetLink, RESET_TTL_MS, MAX_EMAILS_PER_HOUR, overEmailLimit, forgotSchema, resetSchema, GENERIC_FORGOT_MESSAGE } from '@/lib/domain/passwordResetCore';

// docs/FORGOT_PASSWORD_SPEC.md
describe('reset tokens', () => {
  it('AC-1: raw token is 43 base64url chars; only a SHA-256 hex hash is kept', () => {
    const { raw, hash } = newResetToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashResetToken(raw));
    expect(hash).not.toContain(raw);
    expect(newResetToken().raw).not.toBe(raw);
  });
  it('AC-2: valid for 30 minutes, once', () => {
    const now = new Date('2026-11-25T10:00:00Z');
    const at = (mins: number) => new Date(now.getTime() - mins * 60_000);
    const exp = (created: Date) => new Date(created.getTime() + RESET_TTL_MS);
    expect(RESET_TTL_MS).toBe(30 * 60_000);
    expect(tokenUsable({ expiresAt: exp(at(29)), usedAt: null }, now)).toBe(true);
    expect(tokenUsable({ expiresAt: exp(at(31)), usedAt: null }, now)).toBe(false);
    expect(tokenUsable({ expiresAt: exp(at(1)), usedAt: at(0) }, now)).toBe(false);
    expect(tokenUsable(null, now)).toBe(false);
  });
});

describe('reset link', () => {
  it('AC-4: built from APP_URL, never from the request host', () => {
    expect(resetLink('https://aiachub.example/', 'abc')).toBe('https://aiachub.example/reset-password?token=abc');
    expect(resetLink('https://aiachub.example', 'a b')).toBe('https://aiachub.example/reset-password?token=a%20b');
  });
});

describe('limits and validation', () => {
  it('AC-7: at most 3 emails per address per hour', () => {
    expect(MAX_EMAILS_PER_HOUR).toBe(3);
    expect(overEmailLimit(2)).toBe(false);
    expect(overEmailLimit(3)).toBe(true);
  });
  it('AC-3: the generic message never says whether the account exists', () => {
    expect(GENERIC_FORGOT_MESSAGE).toMatch(/If an account exists/);
    expect(forgotSchema.parse({ email: '  Ana@Example.COM ' }).email).toBe('ana@example.com');
    expect(forgotSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
  it('AC-6: weak passwords are refused with the registration rule', () => {
    const r = resetSchema.safeParse({ token: 'x'.repeat(43), password: 'short1' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/10/);
    expect(resetSchema.safeParse({ token: 'x'.repeat(43), password: 'Abcdefg-1234' }).success).toBe(true);
    expect(resetSchema.safeParse({ token: '', password: 'Abcdefg-1234' }).success).toBe(false);
  });
});

describe('login page', () => {
  it('AC-8: links to /forgot-password', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync(new URL('../app/(auth)/login/page.tsx', import.meta.url), 'utf8');
    expect(src).toContain("'/forgot-password'");
    expect(src).toContain('Forgot password?');
  });
});
