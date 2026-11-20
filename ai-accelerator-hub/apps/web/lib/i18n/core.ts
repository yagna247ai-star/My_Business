/**
 * Site languages. Pure (no server or browser APIs), so it runs everywhere and is easy to test.
 *
 * Interface text is translated by its English wording: t('Sign out'). A text without a translation falls back to
 * English, so a missing row never breaks a page. Variables use {name}: t('{n} min ago', { n: 5 }).
 */
import { ROWS } from './messages';

export const LOCALES = ['en', 'hi', 'te', 'ta', 'kn', 'ml'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు', ta: 'தமிழ்', kn: 'ಕನ್ನಡ', ml: 'മലയാളം' };
/** The language name in English, for prompts and logs. */
export const LOCALE_ENGLISH: Record<Locale, string> = { en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam' };
export const LANG_COOKIE = 'aih_lang';

export const isLocale = (x: unknown): x is Locale => typeof x === 'string' && (LOCALES as readonly string[]).includes(x);
export const toLocale = (x: unknown): Locale => (isLocale(x) ? x : 'en');

export type Dict = Record<string, string>;
const COL: Record<Exclude<Locale, 'en'>, number> = { hi: 1, te: 2, ta: 3, kn: 4, ml: 5 };
const cache = new Map<Locale, Dict>();

/** All translations for one language, keyed by the English text. English has none: the key is the text. */
export function dictFor(locale: Locale): Dict {
  if (locale === 'en') return {};
  const hit = cache.get(locale); if (hit) return hit;
  const d: Dict = {};
  for (const r of ROWS) if (r[COL[locale]]) d[r[0]] = r[COL[locale]];
  cache.set(locale, d);
  return d;
}

export type Vars = Record<string, string | number>;
export const interpolate = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s);
export type T = (en: string, vars?: Vars) => string;
export const makeT = (dict: Dict): T => (en, vars) => interpolate(dict[en] ?? en, vars);
