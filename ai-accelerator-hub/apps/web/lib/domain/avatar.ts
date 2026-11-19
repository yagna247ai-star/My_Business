/**
 * Profile photos. An avatar is an uploaded image (see lib/domain/files.ts) that the user chose as their picture.
 * Pure helpers here; the database write lives in setAvatar / clearAvatar below.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';

export const AVATAR_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const FILE_ID = /^[a-z0-9]{20,40}$/i; // cuid-shaped ids from the File table

/** The URL the app uses to show an avatar. Served by /api/v1/files/[fileId] with ?inline=1. */
export function avatarUrlFor(fileId: string): string {
  if (!FILE_ID.test(fileId)) throw badRequest('That file id is not valid.');
  return `/api/v1/files/${fileId}?inline=1`;
}

/** Extract the file id from an avatar URL that this app created. Returns null for any other URL. */
export function fileIdFromAvatarUrl(url: string | null | undefined): string | null {
  const m = url?.match(/^\/api\/v1\/files\/([a-z0-9]{20,40})\?inline=1$/i);
  return m ? m[1] : null;
}

/** Set the signed-in user's photo to an image they uploaded in this tenant. */
export async function setAvatar(ctx: Ctx, fileId: string) {
  const file = await prisma.file.findFirst({ where: { id: fileId, tenantId: ctx.tenantId, ownerId: ctx.userId } });
  if (!file) throw notFound('Upload the photo first, then choose it.');
  if (!AVATAR_MIMES.includes(file.mime)) throw badRequest('Profile photos must be PNG, JPEG, WebP or GIF.');
  if (file.avStatus === 'infected') throw badRequest('This photo was blocked by the virus scan. Choose another.');
  if (file.avStatus === 'pending') throw badRequest('This photo is still being checked. Try again in a minute.');
  // Same rule as serving a file (uploadPolicy.servable): 'validated' images are fine; unscanned 'skipped' files are not, in production.
  if (file.avStatus === 'skipped' && process.env.NODE_ENV === 'production') throw badRequest('This photo was uploaded before checks were on. Upload it again.');
  const avatarUrl = avatarUrlFor(file.id);
  await prisma.$transaction(async tx => {
    const before = await tx.user.findUnique({ where: { id: ctx.userId }, select: { avatarUrl: true } });
    await tx.user.update({ where: { id: ctx.userId }, data: { avatarUrl } });
    await tx.file.update({ where: { id: file.id }, data: { entityType: 'avatar' } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'avatar.set', resourceType: 'User', resourceId: ctx.userId, before: { avatar: !!before?.avatarUrl }, after: { avatar: true } });
  });
  return { avatarUrl };
}

/** Remove the photo. The uploaded file stays on record for the audit trail. */
export async function clearAvatar(ctx: Ctx) {
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: ctx.userId }, data: { avatarUrl: null } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'avatar.cleared', resourceType: 'User', resourceId: ctx.userId, after: { avatar: false } });
  });
  return { avatarUrl: null };
}
