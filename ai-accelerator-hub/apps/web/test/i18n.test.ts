/**
 * Pure: site languages. Every row is complete, placeholders survive in every language, unknown text falls back to
 * English, and lesson code is protected from translation.
 */
import { describe, it, expect } from 'vitest';
import { ROWS } from '../lib/i18n/messages';
import { dictFor, makeT, toLocale, LOCALES, interpolate } from '../lib/i18n/core';
import { protectCode, restoreCode } from '../lib/i18n/lessonTranslate';

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

describe('interface translations', () => {
  it('every row has all six languages, no duplicates, and the same {placeholders} in each', () => {
    const seen = new Set<string>();
    for (const r of ROWS) {
      expect(r.length, r[0]).toBe(6);
      for (const cell of r) expect(cell.trim().length, `${r[0]}`).toBeGreaterThan(0);
      expect(seen.has(r[0]), `duplicate: ${r[0]}`).toBe(false); seen.add(r[0]);
      for (const cell of r.slice(1)) expect(holes(cell), `${r[0]} → ${cell}`).toBe(holes(r[0]));
    }
  });
  it('translates by the English text, interpolates, and falls back to English for unknown text', () => {
    const te = makeT(dictFor('te'));
    expect(te('Sign out')).toBe('సైన్ అవుట్');
    expect(te('Day {n} of 45', { n: 7 })).toBe('45లో 7వ రోజు');
    expect(te('A sentence nobody translated')).toBe('A sentence nobody translated');
    expect(makeT(dictFor('en'))('Sign out')).toBe('Sign out');
    expect(interpolate('{a} of {b}', { a: 1 })).toBe('1 of {b}');
  });
  it('unknown or missing languages become English; every language has a dictionary', () => {
    expect(toLocale('xx')).toBe('en'); expect(toLocale(undefined)).toBe('en'); expect(toLocale('ml')).toBe('ml');
    for (const l of LOCALES.filter(x => x !== 'en')) expect(Object.keys(dictFor(l)).length).toBe(ROWS.length);
  });
});

describe('lesson translation keeps code intact', () => {
  const md = '# Day 9\nRun `SELECT 1;` then:\n```sql\nCREATE TABLE t (id INT);\n```\nUse `=COUNTIFS(a,b)`.';
  it('replaces every code span and block with a placeholder, and restores them exactly', () => {
    const { text, parts } = protectCode(md);
    expect(parts).toEqual(['```sql\nCREATE TABLE t (id INT);\n```', '`SELECT 1;`', '`=COUNTIFS(a,b)`']);
    expect(text).not.toContain('CREATE TABLE');
    expect(text).not.toContain('COUNTIFS');
    const translated = text.replace('Run', 'నడపండి').replace('Use', 'ఉపయోగించండి');
    expect(restoreCode(translated, parts)).toBe(md.replace('Run', 'నడపండి').replace('Use', 'ఉపయోగించండి'));
  });
  it('rejects a translation that lost, duplicated or invented a placeholder', () => {
    const { text, parts } = protectCode(md);
    expect(restoreCode(text.replace('⟦C1⟧', ''), parts)).toBeNull();
    expect(restoreCode(text + ' ⟦C0⟧', parts)).toBeNull();
    expect(restoreCode(text + ' ⟦C9⟧', parts)).toBeNull();
  });
});
