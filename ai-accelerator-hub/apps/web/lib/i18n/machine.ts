/**
 * Machine translation for interface text and activity content, through the provider-agnostic LangChain chain
 * (lib/ai/providers/langchain.ts). Batches of strings go out as a JSON array and must come back as an array of
 * the same length, with every {placeholder} and ⟦C0⟧ code token intact; anything else is rejected and stays English.
 */
import { prisma } from '@/lib/prisma';
import { langchainProvider } from '@/lib/ai/providers/langchain';
import { LOCALE_ENGLISH, LOCALES, type Locale } from './core';
import { ROWS } from './messages';
import { UI_KEYS } from './keys.generated';
import { protectCode, restoreCode } from './lessonTranslate';

const tokens = (s: string) => [...s.matchAll(/\{\w+\}/g)].map(m => m[0]).sort().join('|');

/** Pure: does a translated string keep the original's {placeholders}? */
export const keepsPlaceholders = (en: string, out: string) => tokens(en) === tokens(out);

const system = (lang: string) => [
  `Translate each English string in the JSON array into ${lang}, for the interface of a learning platform used by Indian students.`,
  'Return ONLY a JSON array of strings, the same length and order as the input.',
  'Keep every {placeholder} and every ⟦C0⟧-style token exactly. Keep these terms in English: XP, Boss, CSV, Excel, SQL, Power BI, Databricks, Unity Catalog, JSON, KPI, AI, MySQL, PostgreSQL, SQLite, PGlite, GitHub.',
  'Use short, simple, natural words, as a friendly teacher would. Do not add quotes, notes or explanations.',
].join('\n');

/** Translate a batch of strings. Returns null for any string whose translation is unusable. */
export async function translateStrings(locale: Locale, strings: string[]): Promise<{ out: (string | null)[]; model: string }> {
  if (locale === 'en' || !strings.length) return { out: strings, model: 'none' };
  const prot = strings.map(s => protectCode(s));
  const r = await langchainProvider.chat('translation', system(LOCALE_ENGLISH[locale]), [{ role: 'user', content: JSON.stringify(prot.map(p => p.text)) }]);
  let arr: unknown;
  try { arr = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { arr = null; }
  if (!Array.isArray(arr) || arr.length !== strings.length) return { out: strings.map(() => null), model: r.model };
  const out = arr.map((x, i) => {
    if (typeof x !== 'string' || !x.trim()) return null;
    const back = restoreCode(x.trim(), prot[i].parts);
    return back && keepsPlaceholders(strings[i], back) ? back : null;
  });
  return { out, model: r.model };
}

const REVIEWED = new Set(ROWS.map(r => r[0]));

/**
 * Machine-translate every interface text that has neither a reviewed nor a stored translation. Safe to rerun:
 * each batch is saved as soon as it is done, so a run that stops early continues next time.
 * Languages run in parallel with a few batches at a time each, inside a time budget so a deploy is never held up.
 */
export async function fillUiTranslations(opts: { locales?: Locale[]; batch?: number; concurrency?: number; budgetMs?: number; log?: (s: string) => void } = {}) {
  if (!langchainProvider.configured()) { opts.log?.('i18n:fill — no AI provider configured; interface text stays English where not reviewed.'); return { added: 0, left: 0 }; }
  const locales = opts.locales ?? LOCALES.filter((l): l is Exclude<Locale, 'en'> => l !== 'en');
  const size = opts.batch ?? 40, conc = opts.concurrency ?? 3;
  const deadline = Date.now() + (opts.budgetMs ?? Number(process.env.I18N_FILL_BUDGET_MS || 6 * 60_000));
  let added = 0, left = 0;
  await Promise.all(locales.map(async locale => {
    const have = new Set((await prisma.uiTranslation.findMany({ where: { locale }, select: { key: true } })).map(r => r.key));
    const todo = UI_KEYS.filter(k => !REVIEWED.has(k) && !have.has(k));
    const chunks: string[][] = [];
    for (let i = 0; i < todo.length; i += size) chunks.push(todo.slice(i, i + size));
    let next = 0, done = 0;
    const worker = async () => {
      while (next < chunks.length && Date.now() < deadline) {
        const chunk = chunks[next++];
        try {
          const { out, model } = await translateStrings(locale, chunk);
          const rows = chunk.flatMap((key, j) => (out[j] ? [{ locale, key, text: out[j]!, model }] : []));
          if (rows.length) await prisma.uiTranslation.createMany({ data: rows, skipDuplicates: true });
          added += rows.length; done += rows.length;
        } catch (e) { opts.log?.(`i18n:fill — ${locale} batch failed: ${(e as Error).message.slice(0, 160)}`); }
      }
    };
    await Promise.all(Array.from({ length: conc }, worker));
    left += todo.length - done;
    opts.log?.(`i18n:fill — ${locale}: ${done} added, ${todo.length - done} still to do`);
  }));
  return { added, left };
}
