/**
 * Lesson pages in the learner's language: machine-translated once per page and language through the
 * provider-agnostic LangChain chain (lib/ai/providers/langchain.ts: Claude, Gemini, OpenAI, OpenRouter, any
 * OpenAI-compatible endpoint), then cached in the database.
 *
 * Code never reaches the model: fenced blocks and `inline code` (SQL, Excel formulas, commands, column names)
 * are swapped for ⟦C0⟧ placeholders and restored afterwards, so they cannot be mistranslated. If the model drops
 * or invents a placeholder, the translation is rejected and the page stays in English.
 */
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { langchainProvider } from '@/lib/ai/providers/langchain';
import { LOCALE_ENGLISH, type Locale } from './core';

export const sha = (s: string) => createHash('sha256').update(s).digest('hex');

/** Replace code with numbered placeholders. Pure: exported for tests. */
export function protectCode(md: string): { text: string; parts: string[] } {
  const parts: string[] = [];
  const keep = (m: string) => { parts.push(m); return `⟦C${parts.length - 1}⟧`; };
  const text = md.replace(/```[\s\S]*?```/g, keep).replace(/`[^`\n]+`/g, keep);
  return { text, parts };
}

/** Put the code back. Null if any placeholder is missing, duplicated or unknown. */
export function restoreCode(text: string, parts: string[]): string | null {
  const found = [...text.matchAll(/⟦C(\d+)⟧/g)].map(m => Number(m[1]));
  if (found.length !== parts.length || new Set(found).size !== parts.length || found.some(i => i >= parts.length)) return null;
  return text.replace(/⟦C(\d+)⟧/g, (_, i) => parts[Number(i)]);
}

const prompt = (lang: string) => [
  `Translate this Markdown lesson from English into ${lang} for Indian college students learning data analytics.`,
  'Rules:',
  '- Keep every placeholder like ⟦C0⟧ exactly as it is, once each, in the right place. They stand for code.',
  '- Keep the Markdown structure: headings (#), numbered and bullet lists, tables (| … |), **bold**.',
  '- Keep these terms in English: Excel, CSV, SQL, Power BI, Databricks, Unity Catalog, Python, JSON, KPI, XP, MySQL, PostgreSQL, SQLite, PGlite, and menu names in **bold** such as **Data → From Text/CSV**.',
  '- Use simple, natural, everyday words, as a friendly teacher would. Keep numbers and names unchanged.',
  '- Output only the translated Markdown, nothing else.',
].join('\n');

export class TranslationUnavailable extends Error {}

/** The cached translation if it matches the current English page, else null. Never calls a model. */
export async function cachedLesson(contentId: string, english: string, locale: Locale): Promise<string | null> {
  if (locale === 'en') return null;
  const row = await prisma.contentTranslation.findUnique({ where: { contentId_locale: { contentId, locale } } });
  return row && row.sourceHash === sha(english) ? row.body : null;
}

/** Translate (or reuse) one lesson page. Throws TranslationUnavailable when no AI provider is set or the output is unusable. */
export async function translateLesson(contentId: string, english: string, locale: Locale): Promise<string> {
  if (locale === 'en') return english;
  const hit = await cachedLesson(contentId, english, locale);
  if (hit) return hit;
  if (!langchainProvider.configured()) throw new TranslationUnavailable('No AI provider is configured for translation.');
  const { text, parts } = protectCode(english);
  let out: { text: string; model: string };
  try { out = await langchainProvider.chat('translation', prompt(LOCALE_ENGLISH[locale]), [{ role: 'user', content: text }]); }
  catch (e) { throw new TranslationUnavailable(`Translation failed: ${(e as Error).message.slice(0, 200)}`); }
  const body = restoreCode(out.text.replace(/^```(?:markdown|md)?\n([\s\S]*)\n```$/, '$1').trim(), parts);
  if (!body) throw new TranslationUnavailable('The translation changed the code placeholders, so it was not used.');
  await prisma.contentTranslation.upsert({
    where: { contentId_locale: { contentId, locale } },
    update: { body, sourceHash: sha(english), model: out.model },
    create: { contentId, locale, body, sourceHash: sha(english), model: out.model },
  });
  return body;
}
