/**
 * The owner's own emails (docs/IDENTITY_DEDUP_SPEC.md §3.16–3.19). Adding needs proof of the mailbox (an emailed link,
 * opened while signed in): without it anyone could claim someone else's address ("pre-hijacking").
 * Removing a secondary email is the owner's own decision and needs no verification.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, conflict, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { appUrl, sendMail } from '@/lib/server/mail';
import { hashResetToken, newResetToken } from './passwordResetCore';
import { EMAIL_VERIFY_TTL_MS, canAddEmail, emailAction, emailKey } from './identityCore';
import { findUserByAnyEmail, recordPrimaryEmail } from './identity';

export const addEmailSchema = z.object({ email: z.string({ error: 'Enter an email.' }).trim().toLowerCase().email('Enter a valid email address.').max(254, 'That email is too long.') });

const REASON = { primary: 'This is your main email. Make another email your main one first.', not_found: 'That email is not on your account.', not_verified: 'Confirm this email with the link we sent before making it your main one.', already_primary: 'This is already your main email.' } as const;

/** My emails, newest state first. Expired unconfirmed ones are cleared here. */
export async function listEmails(ctx: Ctx) {
  await prisma.userEmail.deleteMany({ where: { userId: ctx.userId, pendingUntil: { lt: new Date() } } });
  const me = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { email: true } });
  if (!(await prisma.userEmail.findUnique({ where: { email: me.email.toLowerCase() } }))) await recordPrimaryEmail(prisma, ctx.userId, me.email).catch(() => {}); // legacy account without a row
  const rows = await prisma.userEmail.findMany({ where: { userId: ctx.userId }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] });
  return rows.map(r => ({ id: r.id, email: r.email, isPrimary: r.isPrimary, pending: !!r.pendingUntil }));
}

export async function addEmail(ctx: Ctx, input: z.infer<typeof addEmailSchema>) {
  const email = input.email, key = emailKey(email);
  const mine = await listEmails(ctx);
  if (!canAddEmail(mine.length)) throw badRequest('You can keep up to 5 emails. Remove one first.');
  if (await prisma.userSetting.findFirst({ where: { userId: ctx.userId, guardianEmail: email }, select: { id: true } })) throw badRequest('Use your own email, not your parent or guardian’s.');
  const owner = await findUserByAnyEmail(email);
  if (owner?.id === ctx.userId) throw conflict('That email is already on your account.');
  if (owner) throw conflict('That email already belongs to another account. If both are yours, ask your institution admin to merge them.');
  const { raw, hash } = newResetToken();
  // Somebody else's unconfirmed claim on this mailbox is not ownership: the first person to confirm wins.
  await prisma.userEmail.deleteMany({ where: { emailKey: key, pendingUntil: { not: null } } });
  await prisma.userEmail.create({ data: { userId: ctx.userId, email, emailKey: key, isPrimary: false, verified: false, pendingUntil: new Date(Date.now() + EMAIL_VERIFY_TTL_MS), verifyTokenHash: hash } });
  const link = `${appUrl()}/settings/profile?verifyEmail=${raw}`;
  try {
    await sendMail({ to: email, subject: 'Confirm this email for AI Accelerator Hub', text: `Hi,\n\nSomeone (hopefully you) asked to add this email to an AI Accelerator Hub account.\nOpen this link while signed in to that account to confirm (it expires in 24 hours):\n${link}\n\nIf you did not expect this, ignore this email and nothing changes.\n`, html: `<p>Someone (hopefully you) asked to add this email to an AI Accelerator Hub account.</p><p><a href="${link}">Confirm this email</a> while signed in to that account. It expires in 24 hours.</p><p style="color:#666;font-size:13px">If you did not expect this, ignore this email and nothing changes.</p>` });
  } catch {
    await prisma.userEmail.deleteMany({ where: { verifyTokenHash: hash } });
    throw badRequest('We could not send the confirmation email. Check the address and try again.');
  }
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'user.email_add_requested', resourceType: 'User', resourceId: ctx.userId, after: { email } });
  return { ok: true as const, message: 'We sent a confirmation link to that email. It works for 24 hours.' };
}

export async function verifyEmail(ctx: Ctx, rawToken: string) {
  const bad = () => badRequest('This confirmation link is invalid or has expired. Add the email again.');
  if (!rawToken || rawToken.length > 200) throw bad();
  const hash = hashResetToken(rawToken);
  const row = await prisma.userEmail.findUnique({ where: { verifyTokenHash: hash } });
  if (!row || row.userId !== ctx.userId) throw bad(); // opened while signed in to the same account (Auth0's account-linking rule)
  const c = await prisma.userEmail.updateMany({ where: { id: row.id, pendingUntil: { gt: new Date() } }, data: { verified: true, pendingUntil: null, verifyTokenHash: null } }); // atomic: two clicks cannot both win
  if (c.count !== 1) throw bad();
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'user.email_added', resourceType: 'User', resourceId: ctx.userId, after: { email: row.email } });
  await notify(prisma, ctx.tenantId, ctx.userId, 'email_added', { title: `${row.email} was added to your account`, body: 'You can now sign in with it.', tone: 'ok' });
  return { ok: true as const, email: row.email };
}

export async function removeEmail(ctx: Ctx, id: string) {
  const rows = await listEmails(ctx);
  const r = emailAction(rows, 'remove', id);
  if (!r.ok) { if (r.reason === 'not_found') throw notFound(REASON.not_found); throw badRequest(REASON[r.reason]); }
  const row = rows.find(x => x.id === id)!;
  await prisma.userEmail.deleteMany({ where: { id, userId: ctx.userId, isPrimary: false } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'user.email_removed', resourceType: 'User', resourceId: ctx.userId, after: { email: row.email } });
  return { ok: true as const };
}

export async function makePrimaryEmail(ctx: Ctx, id: string) {
  const rows = await listEmails(ctx);
  const r = emailAction(rows, 'primary', id);
  if (!r.ok) { if (r.reason === 'not_found') throw notFound(REASON.not_found); throw badRequest(REASON[r.reason]); }
  const row = rows.find(x => x.id === id)!, old = rows.find(x => x.isPrimary);
  await prisma.$transaction(async tx => {
    await tx.userEmail.updateMany({ where: { userId: ctx.userId, isPrimary: true }, data: { isPrimary: false } });
    await tx.userEmail.update({ where: { id }, data: { isPrimary: true } });
    await tx.user.update({ where: { id: ctx.userId }, data: { email: row.email } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'user.email_primary_changed', resourceType: 'User', resourceId: ctx.userId, before: { email: old?.email }, after: { email: row.email } });
  });
  // The old main address is told, so a hijacked session cannot quietly move the account away.
  if (old) await sendMail({ to: old.email, subject: 'Your main email on AI Accelerator Hub changed', text: `Your main email was changed to ${row.email}. You can still sign in with ${old.email}. If this was not you, reset your password.\n` }).catch(() => {});
  return { ok: true as const };
}
