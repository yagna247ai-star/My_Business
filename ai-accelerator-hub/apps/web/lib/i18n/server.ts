/**
 * The language for this request. Signed in: the learner's saved language (Settings → Profile), so it follows them
 * on every device. Signed out (sign-in, sign-up): the language chosen on that page, kept in a cookie.
 */
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCtx } from '@/lib/server/context';
import { dictFor, LANG_COOKIE, makeT, toLocale, type Locale, type T } from './core';

export const getLocale = cache(async (): Promise<Locale> => {
  const ctx = await getCtx().catch(() => null);
  if (ctx) {
    const u = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { preferredLanguage: true } }).catch(() => null);
    if (u?.preferredLanguage) return toLocale(u.preferredLanguage);
  }
  return toLocale((await cookies()).get(LANG_COOKIE)?.value);
});

export async function getT(): Promise<T> {
  return makeT(dictFor(await getLocale()));
}
