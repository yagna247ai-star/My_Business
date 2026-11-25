/**
 * Forgot password (docs/FORGOT_PASSWORD_SPEC.md): request a link by email, then set a new password with it.
 * The request always returns the same answer so nobody can learn which emails have accounts.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/server/audit';
import { badRequest } from '@/lib/server/errors';
import { appUrl, sendMail } from '@/lib/server/mail';
import { clearLoginFailures } from '@/lib/auth';
import { GENERIC_FORGOT_MESSAGE, INVALID_LINK_MESSAGE, RESET_TTL_MS, hashResetToken, newResetToken, overEmailLimit, resetLink, resetSchema, tokenUsable } from './passwordResetCore';

const generic = { ok: true as const, message: GENERIC_FORGOT_MESSAGE };

async function auditTenant(userId?: string) {
  const m = userId ? await prisma.membership.findFirst({ where: { userId, status: 'active' }, orderBy: { createdAt: 'asc' } }) : null;
  return m?.tenantId ?? (await prisma.tenant.findUnique({ where: { slug: process.env.DEFAULT_TENANT_SLUG || 'demo' } }))?.id ?? null;
}

export async function requestPasswordReset(emailRaw: string, ip?: string | null) {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, memberships: { where: { status: 'active' }, select: { tenantId: true }, take: 1 } } });
  const tenantId = await auditTenant(user?.id);
  const log = (outcome: string) => tenantId ? prisma.auditLog.create({ data: { tenantId, actorUserId: user?.id ?? null, action: 'auth.password_reset_requested', resourceType: 'User', resourceId: user?.id ?? null, after: JSON.stringify({ email, outcome }), ip: ip ?? null } }).catch(() => {}) : null;

  if (!user || user.memberships.length === 0) { await log('no_active_account'); return generic; }
  const sent = await prisma.passwordResetToken.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
  if (overEmailLimit(sent)) { await log('email_limit'); return generic; }

  const { raw, hash } = newResetToken();
  await prisma.$transaction([
    // Only the newest link works.
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
  ]);
  const link = resetLink(appUrl(), raw);
  try {
    await sendMail({
      to: user.email,
      subject: 'Reset your AI Accelerator Hub password',
      text: `Hi ${user.name || 'there'},\n\nSomeone (hopefully you) asked to reset the password for this email on AI Accelerator Hub.\n\nSet a new password here (the link works once and expires in 30 minutes):\n${link}\n\nIf you did not ask for this, ignore this email. Your password stays the same.\n`,
      html: `<p>Hi ${escapeHtml(user.name || 'there')},</p><p>Someone (hopefully you) asked to reset the password for this email on AI Accelerator Hub.</p><p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#3878F6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Set a new password</a></p><p style="color:#666;font-size:13px">The link works once and expires in 30 minutes. If you did not ask for this, ignore this email.</p>`,
    });
    await log('sent');
  } catch (e) {
    console.error('[password-reset] email failed', (e as Error).message);
    await log('send_failed');
  }
  return generic;
}

export async function resetPassword(rawToken: string, password: string, ip?: string | null) {
  const parsed = resetSchema.safeParse({ token: rawToken, password });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw badRequest(issue.message, issue.path[0] === 'password' ? { password: issue.message } : undefined);
  }
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(rawToken) }, include: { user: { select: { id: true, email: true, name: true } } } });
  if (!row || !tokenUsable(row)) throw badRequest(INVALID_LINK_MESSAGE);

  const hash = await bcrypt.hash(password, 12);
  const now = new Date();
  // Claim the token atomically so two clicks at once cannot both succeed.
  const claimed = await prisma.$transaction(async tx => {
    const c = await tx.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: now } });
    if (c.count !== 1) return false;
    await tx.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } });
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash: hash, emailVerified: true } });
    const tenantId = await auditTenant(row.userId);
    if (tenantId) await audit(tx, { tenantId, actorUserId: row.userId, action: 'auth.password_reset_completed', resourceType: 'User', resourceId: row.userId, after: { email: row.user.email }, ip: ip ?? null });
    return true;
  });
  if (!claimed) throw badRequest(INVALID_LINK_MESSAGE);
  clearLoginFailures(row.user.email);
  await sendMail({
    to: row.user.email,
    subject: 'Your AI Accelerator Hub password was changed',
    text: `Hi ${row.user.name || 'there'},\n\nThe password for your AI Accelerator Hub account was just changed. If this was you, there is nothing to do.\n\nIf it was not you, reset it now at ${appUrl().replace(/\/+$/, '')}/forgot-password and tell your institution admin.\n`,
  }).catch(e => console.error('[password-reset] confirmation email failed', (e as Error).message));
  return { ok: true as const };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
