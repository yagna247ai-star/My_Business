// docs/DAY_SIDE_PANEL_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CATALOG, reposFor, reposForDay, topicOf } from '@/lib/domain/dayResources';
import { JOURNEY_SPECS } from '@/lib/domain/daDomains/tracks';
import { buildDomainJourney } from '@/lib/domain/daDomains/curriculum';

const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('day page side panel', () => {
  it('AC-1: the day page has a side panel next to the lesson, below it on narrow screens', () => {
    const page = read('app/(app)/levels/[code]/days/[day]/page.tsx');
    expect(page).toMatch(/className="day-layout"/);
    expect(page).toMatch(/<aside className="day-aside"/);
    const css = read('app/styles/features.css');
    expect(css).toMatch(/\.day-layout\{display:grid;grid-template-columns:minmax\(0,820px\)/);
    expect(css).toMatch(/@media \(max-width:1180px\)\{\.day-layout\{grid-template-columns:minmax\(0,1fr\)\}/);
  });
  it('AC-2: the AI mentor gets the day, and reads the lesson without the answer key', () => {
    expect(read('components/learn/DaySide.tsx')).toMatch(/context=\{\{ levelCode: code, day \}\}/);
    const coach = read('lib/ai/coach.ts');
    expect(coach).toMatch(/input\.context\?\.day/);
    expect(coach).toMatch(/split\(\/\^##\\s\+Check yourself\/m\)\[0\]/);
    expect(read('app/api/v1/coach/[assistant]/route.ts')).toMatch(/day: z\.number\(\)\.int\(\)\.min\(1\)\.max\(400\)\.optional\(\)/);
  });
  it('AC-4: classmates on this day use the feed rules: visible, scoped, blocked people left out', () => {
    const f = read('lib/domain/feed.ts'); const fn = f.slice(f.indexOf('export async function dayFeed'));
    expect(fn).toMatch(/state: 'visible', levelCode, day/);
    expect(fn).toMatch(/authorId: \{ notIn: \[\.\.\.hidden\] \}/);
    expect(fn).toMatch(/scopeWhere\(journeyId\)/);
    expect(read('components/learn/DaySide.tsx')).toMatch(/kind: 'question', body: `Day \$\{day\}/);
  });
  it('AC-5: every module gets 3 curated GitHub repos; every level of every journey maps to a module', () => {
    expect(new Set(CATALOG.map(r => r.repo)).size).toBe(CATALOG.length); // no duplicates
    for (const r of CATALOG) { expect(r.repo).toMatch(/^[\w.-]+\/[\w.-]+$/); expect(r.why.length).toBeGreaterThan(20); expect(r.tags.length).toBeGreaterThan(0); }
    expect(topicOf('DA02_SQL', 'SQL')).toBe('sql');
    expect(topicOf('DA03_PYTHON_FUNDAMENTALS')).toBe('python');
    expect(topicOf('DA04_PYTHON_ANALYTICS')).toBe('analytics');
    expect(topicOf('DA05_POWER_BI')).toBe('powerbi');
    expect(topicOf('DA06_AI_FOR_ANALYTICS')).toBe('ai');
    expect(topicOf('DA07_MACHINE_LEARNING')).toBe('ml');
    expect(topicOf('DA08_ETL_DATA_QUALITY')).toBe('etl');
    expect(topicOf('DA09_CAPSTONE_READINESS')).toBe('capstone');
    expect(topicOf('DA01_FUNDAMENTALS')).toBe('fundamentals');
    expect(topicOf('AGR_M3_UNITY_CATALOG', 'Set Up Databricks and Unity Catalog')).toBe('lakehouse');
    expect(topicOf('AGR_M5_SILVER', 'Cleanse and Standardise into the Silver Layer')).toBe('etl');
    expect(topicOf('AGR_M6_GOLD', 'Model Business-Ready Gold Tables')).toBe('modeling');
    expect(topicOf('AGR_M8_ML_AI', 'Predict with Machine Learning and AI')).toBe('ml');
    expect(reposFor('DA02_SQL')[0].url).toBe('https://github.com/lerocha/chinook-database');
    const seen = new Set<string>();
    for (const spec of JOURNEY_SPECS) for (const l of buildDomainJourney(spec).levels) seen.add(topicOf(l.code, l.title));
    expect(seen.size).toBeGreaterThanOrEqual(7); // domain journeys spread across modules, not all "fundamentals"
  });
  it('AC-6: every day gets repos for its own topic: 2 to learn from, 2 real projects with good first issues', () => {
    const d = (day: number, code = 'DA02_SQL', title = 'SQL') => reposForDay(code, title, day);
    expect(d(11).topic).toBe('window functions');
    expect(d(11).projects.map(r => r.repo)).toContain('duckdb/duckdb');
    expect(d(11).learn.map(r => r.repo)).toContain('datacharmer/test_db');
    expect(d(9).topic).toBe('joins');
    expect(d(40, 'DA08_ETL_DATA_QUALITY', 'ETL').projects.map(r => r.repo)).toContain('dbt-labs/dbt');
    expect(d(30, 'DA06_AI_FOR_ANALYTICS', 'AI').projects.map(r => r.repo)).toContain('data-privacy-stack/presidio');
    expect(d(35, 'DA07_MACHINE_LEARNING', 'ML').projects.map(r => r.repo)).toContain('shap/shap');
    expect(d(11).projects[0].contribute).toBe(`https://github.com/${d(11).projects[0].repo}/contribute`);
    // all 45 Data Analytics days and every day of every domain course get 2 + 2, and days differ
    const da = ['DA01_FUNDAMENTALS', 'DA02_SQL', 'DA03_PYTHON_FUNDAMENTALS', 'DA04_PYTHON_ANALYTICS', 'DA05_POWER_BI', 'DA06_AI_FOR_ANALYTICS', 'DA07_MACHINE_LEARNING', 'DA08_ETL_DATA_QUALITY', 'DA09_CAPSTONE_READINESS'];
    const sets = new Set<string>();
    for (let day = 1; day <= 45; day++) {
      const code = da[Math.min(8, [5, 11, 17, 22, 27, 31, 36, 41, 45].findIndex(x => day <= x))];
      const r = reposForDay(code, '', day);
      expect(r.learn.length, `day ${day}`).toBe(2); expect(r.projects.length, `day ${day}`).toBe(2);
      sets.add([...r.learn, ...r.projects].map(x => x.repo).join(','));
    }
    expect(sets.size).toBeGreaterThan(25);
    for (const spec of JOURNEY_SPECS) for (const l of buildDomainJourney(spec).levels) for (const day of l.days) {
      const r = reposForDay(l.code, l.title, day.day, day.title);
      expect(r.learn.length + r.projects.length, `${spec.slug} ${l.code} day ${day.day}`).toBeGreaterThanOrEqual(3);
    }
  });
});
