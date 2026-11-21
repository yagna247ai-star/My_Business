'use client';
/** Gives every client component the page's language: const t = useT(); t('Sign out'). */
import { createContext, useContext, useMemo } from 'react';
import { LANG_COOKIE, makeT, type Dict, type Locale, type T } from '@/lib/i18n/core';
import { setApiTranslator } from '@/lib/client/api';

const Ctx = createContext<{ locale: Locale; t: T }>({ locale: 'en', t: makeT({}) });

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo(() => { const t = makeT(dict); setApiTranslator(s => t(s)); return { locale, t }; }, [locale, dict]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx).t;
export const useLocale = () => useContext(Ctx).locale;

/** Remember a language for signed-out pages (and as a fallback). Signed-in users also save it to their profile. */
export function rememberLocale(locale: Locale) {
  document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}
