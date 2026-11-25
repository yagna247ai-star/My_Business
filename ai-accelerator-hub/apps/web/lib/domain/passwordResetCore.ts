/**
 * Pure rules for Forgot password (docs/FORGOT_PASSWORD_SPEC.md). No database, no mail.
 * The raw token only ever lives in the email link; the database keeps its SHA-256 hash.
 */
import crypto from 'node:crypto';
import { z } from 'zod';
import { registerSchema } from './account';

export const RESET_TTL_MS = 30 * 60_000;
export const MAX_EMAILS_PER_HOUR = 3;
export const GENERIC_FORGOT_MESSAGE = 'If an account exists for that email, we have sent a reset link. It expires in 30 minutes.';
export const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired. Request a new one.';

export function hashResetToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** 32 random bytes → 43 base64url characters. */
export function newResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('base64url');
  return { raw, hash: hashResetToken(raw) };
}

export function tokenUsable(t: { expiresAt: Date; usedAt: Date | null } | null | undefined, now = new Date()): boolean {
  return !!t && !t.usedAt && t.expiresAt.getTime() > now.getTime();
}

/** Always built from the configured site URL, never from the request's Host header. */
export function resetLink(appUrl: string, raw: string): string {
  return `${appUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(raw)}`;
}

export const overEmailLimit = (sentInLastHour: number) => sentInLastHour >= MAX_EMAILS_PER_HOUR;

export const forgotSchema = z.object({ email: registerSchema.shape.email });
export const resetSchema = z.object({
  token: z.string().min(20, INVALID_LINK_MESSAGE).max(200, INVALID_LINK_MESSAGE),
  password: registerSchema.shape.password,
});
