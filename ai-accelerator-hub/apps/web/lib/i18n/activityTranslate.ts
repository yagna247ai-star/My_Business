/**
 * Activity content in the learner's language: the briefing, lessons, quiz questions and options, build fields,
 * proof checklist, Boss scenarios and choices — exactly what the learner is shown (public, personalised config).
 *
 * Only display text is translated, in place: arrays keep their order and length, so answers (by position) and
 * grading never change. Translated once per activity, language and wording, then cached (content_translations).
 */
import { prisma } from '@/lib/prisma';
import type { Locale } from './core';
import { sha } from './lessonTranslate';
import { translateStrings } from './machine';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Keys whose string values are shown to the learner. Everything else (kind, code, rubric, schema, tools…) is left alone. */
const TEXT_KEYS = new Set(['problem', 'objective', 'outcome', 'criteria', 'q', 'options', 'title', 'body', 'intro', 'choices', 's', 'label', 'hint',
  'checklist', 'shows', 'instructions', 'evidenceTypes', 'task', 'architecture', 'steps', 'description', 'name']);
const NEVER = new Set(['kind', 'code', 'rubric', 'schema', 'tools', 'accept', 'repo', 'resources', 'key', 'url', 'values', 'iterationRules', 'xpSplit']);

/** Paths of every translatable string. Pure: exported for tests. */
export function textPaths(v: Json, path: (string | number)[] = [], under = false): { path: (string | number)[]; text: string }[] {
  if (typeof v === 'string') return under && /[A-Za-z]/.test(v) ? [{ path, text: v }] : [];
  if (Array.isArray(v)) return v.flatMap((x, i) => textPaths(x, [...path, i], under));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (NEVER.has(k) ? [] : textPaths(x, [...path, k], under || TEXT_KEYS.has(k))));
  return [];
}

/** Write translated strings back at their paths, on a copy. Pure. */
export function withTexts<T extends Json>(v: T, items: { path: (string | number)[]; text: string }[]): T {
  const copy = JSON.parse(JSON.stringify(v)) as T;
  for (const { path, text } of items) {
    let o: Json = copy;
    for (const p of path.slice(0, -1)) o = (o as Record<string, Json>)[p as string];
    (o as Record<string, Json>)[path[path.length - 1] as string] = text;
  }
  return copy;
}

type Act = { id: string; title: string; config: Json };
const keyOf = (a: Act) => `act:${a.id}:${sha(a.title + JSON.stringify(a.config)).slice(0, 16)}`;

/** Activities with cached translations applied; untranslated ones come back unchanged. Never calls a model. */
export async function cachedActivities<A extends Act>(acts: A[], locale: Locale): Promise<{ acts: A[]; translated: boolean }> {
  if (locale === 'en' || !acts.length) return { acts, translated: false };
  const rows = await prisma.contentTranslation.findMany({ where: { locale, contentId: { in: acts.map(keyOf) } } });
  const by = new Map(rows.map(r => [r.contentId, r.body]));
  let any = false;
  const out = acts.map(a => {
    const body = by.get(keyOf(a)); if (!body) return a;
    const t = JSON.parse(body) as { title: string; texts: string[] };
    const paths = textPaths(a.config);
    if (t.texts.length !== paths.length) return a;
    any = true;
    return { ...a, title: t.title, config: withTexts(a.config, paths.map((p, i) => ({ path: p.path, text: t.texts[i] }))) };
  });
  return { acts: out, translated: any };
}

/** Translate every activity of a level that is not cached yet. Strings that fail stay English. */
export async function translateActivities(acts: Act[], locale: Locale): Promise<number> {
  if (locale === 'en') return 0;
  const have = new Set((await prisma.contentTranslation.findMany({ where: { locale, contentId: { in: acts.map(keyOf) } }, select: { contentId: true } })).map(r => r.contentId));
  let done = 0;
  for (const a of acts.filter(x => !have.has(keyOf(x)))) {
    const paths = textPaths(a.config);
    const src = [a.title, ...paths.map(p => p.text)];
    const outs: string[] = []; let model = '';
    for (let i = 0; i < src.length; i += 40) {
      const chunk = src.slice(i, i + 40);
      const r = await translateStrings(locale, chunk);
      model = r.model; outs.push(...r.out.map((x, j) => x ?? chunk[j]));
    }
    const body = JSON.stringify({ title: outs[0], texts: outs.slice(1) });
    await prisma.contentTranslation.upsert({ where: { contentId_locale: { contentId: keyOf(a), locale } }, update: { body, sourceHash: keyOf(a), model }, create: { contentId: keyOf(a), locale, body, sourceHash: keyOf(a), model } });
    done++;
  }
  return done;
}
