/**
 * The language for this request. Signed in: the learner's saved language (Settings → Profile), so it follows them
 * on every device. Signed out (sign-in, sign-up): the language chosen on that page, kept in a cookie.
 */
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCtx } from '@/lib/server/context';
import { dictFor, LANG_COOKIE, makeT, toLocale, type Dict, type Locale, type T } from './core';

export const getLocale = cache(async (): Promise<Locale> => {
  const ctx = await getCtx().catch(() => null);
  if (ctx) {
    const u = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { preferredLanguage: true } }).catch(() => null);
    if (u?.preferredLanguage) return toLocale(u.preferredLanguage);
  }
  return toLocale((await cookies()).get(LANG_COOKIE)?.value);
});

/** Machine translations from the database, refreshed every 5 minutes per server instance. */
const machine = new Map<Locale, { at: number; dict: Dict }>();
async function machineDict(locale: Locale): Promise<Dict> {
  if (locale === 'en') return {};
  const hit = machine.get(locale);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.dict;
  const rows = await prisma.uiTranslation.findMany({ where: { locale }, select: { key: true, text: true } }).catch(() => []);
  const dict = Object.fromEntries(rows.map(r => [r.key, r.text]));
  machine.set(locale, { at: Date.now(), dict });
  return dict;
}

/** Everything for one language: machine translations, overridden by the reviewed ones in messages.ts. */
export const getDict = cache(async (locale?: Locale): Promise<Dict> => {
  const l = locale ?? (await getLocale());
  return { ...(await machineDict(l)), ...dictFor(l) };
});

export async function getT(): Promise<T> {
  return makeT(await getDict());
}
