/**
 * Pure: free progression rules, day steps, and the Module 2 Excel + SQL lab content for every journey.
 * The SQL itself is executed against SQLite and PostgreSQL in the lab runner; here we check its shape.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { DAY_XP, dayStepsFrom, levelComplete, levelPoints, moveOnMessage, activityFinished } from '../lib/domain/levelFlowRules';
import { trackChangeAllowed } from '../lib/domain/trackRules';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';
import { labCols, ddl, loadCsv, copyClean, excelInsertFormula, excelKpiFormulas, DIALECTS, INSTALL } from '../lib/domain/daDomains/dataLab';

const acts = (states: (string | null)[]) => states.map((state, i) => ({ idx: i + 1, state }));

describe('free progression', () => {
  it('a level is complete when every activity and day is done or skipped', () => {
    const days = [{ state: 'done' }, { state: 'skipped' }];
    expect(levelComplete({ activities: acts(['completed', 'skipped', 'completed', 'skipped', 'completed', 'skipped']), bossAttempts: 0, days })).toBe(true);
    expect(levelComplete({ activities: acts(['completed', 'skipped', 'completed', 'skipped', 'completed', null]), bossAttempts: 0, days })).toBe(false);
    expect(levelComplete({ activities: acts(['completed', 'completed', 'completed', 'completed', 'completed', 'completed']), bossAttempts: 0, days: [{ state: 'open' }] })).toBe(false);
  });
  it('review never blocks: one Boss attempt finishes activity 6, whatever the verdict', () => {
    expect(activityFinished({ idx: 6, state: null }, 1)).toBe(true);
    expect(activityFinished({ idx: 6, state: null }, 0)).toBe(false);
    expect(activityFinished({ idx: 5, state: null }, 3)).toBe(false);
    expect(levelComplete({ activities: acts(['completed', 'completed', 'completed', 'completed', 'completed', null]), bossAttempts: 3, days: [] })).toBe(true);
  });
  it('tells the learner the points they earned out of the total, and that skipped work can be finished later', () => {
    expect(levelPoints(120, 5)).toBe(120 + 5 * DAY_XP);
    expect(moveOnMessage(80, 170, 'Level 2')).toBe('You earned 80 of 170 points in this level. Level 2 is open. Skipped steps earned no points; you can go back and finish them any time to add their points.');
    expect(moveOnMessage(170, 170, 'Level 2')).toBe('You earned 170 of 170 points in this level. Level 2 is open.');
    expect(moveOnMessage(10, 20, null)).toContain('finished the journey');
  });
  it('the track is fixed once Module 1 is approved or finished', () => {
    expect(trackChangeAllowed('in_progress', false)).toBe(true);
    expect(trackChangeAllowed('submitted', true)).toBe(false);
    expect(trackChangeAllowed('approved')).toBe(false);
  });
});

describe('day steps', () => {
  it('reads the numbered steps of every domain day', () => {
    for (const d of JOURNEY_SPECS) for (const l of buildDomainJourney(d).levels) for (const day of l.days) {
      if (day.steps) continue; // guided days show their steps as cards
      const steps = dayStepsFrom(day.body);
      expect(steps.length, `${d.slug} day ${day.day}`).toBeGreaterThanOrEqual(2);
      expect(steps.length).toBeLessThanOrEqual(20);
    }
  });
  it('reads the "Your turn" list of every generic day', () => {
    const dir = join(__dirname, '../../../docs/data-analytics-journey/days');
    for (const f of readdirSync(dir).filter(x => /^D\d{2}-.*\.md$/.test(x))) expect(dayStepsFrom(readFileSync(join(dir, f), 'utf8')).length, f).toBeGreaterThanOrEqual(3);
  });
});

describe('Module 2: Excel and SQL lab', () => {
  it('every journey teaches CSV → Excel → KPIs → install a database → DDL → load → check → query, in that order', () => {
    for (const d of JOURNEY_SPECS) {
      const m2 = buildDomainJourney(d).levels[1];
      expect(m2.days.map(x => x.day)).toEqual([6, 7, 8, 9, 10]);
      const [d6, d7, d8, d9, d10] = m2.days.map(x => x.body + JSON.stringify(x.steps ?? [])); // lesson text plus guided step cards
      expect(d6).toContain('AI prompt 2 (copy)');
      expect(d7).toMatch(/From Text\/CSV/);
      expect(d7).toContain(`tbl_${d.dataset.name}`);
      expect(d8).toMatch(/COUNTIFS/); expect(d8).toMatch(/AVERAGEIFS/); expect(d8).toMatch(/XLOOKUP/); expect(d8).toMatch(/PivotTable/);
      for (const x of DIALECTS) { expect(d9).toContain(`Install ${x.name}`); expect(d9).toContain(`DDL: create the tables · ${x.name}`); expect(d10).toContain(`Load the CSV · ${x.name}`); }
      expect(d10).toMatch(/GROUP BY/);
      expect(d10).toContain('Data dictionary');
    }
  });
  it('generates DDL with a key, types and allowed values from the real columns', () => {
    for (const d of JOURNEY_SPECS) {
      const c = labCols(d);
      for (const x of DIALECTS) {
        const sql = ddl(x.id, c);
        expect(sql).toContain(`CREATE TABLE ${c.table}_raw (`);
        expect(sql).toContain(`${c.key.name} `);
        expect(sql).toMatch(/PRIMARY KEY/);
        for (const col of d.dataset.columns) expect(sql).toContain(col.name);
        if (c.cat.values.length) expect(sql).toContain(`'${c.cat.values[0].replace(/'/g, "''")}'`);
        expect(copyClean(x.id, c)).toContain(`INSERT INTO ${c.table}`);
      }
      expect(loadCsv('mysql', c)).toMatch(/LOAD DATA LOCAL INFILE/);
      expect(loadCsv('postgres', c)).toMatch(/^\\copy /);
      expect(loadCsv('sqlite', c)).toMatch(/^\.import --csv --skip 1/);
      expect(loadCsv('pglite', c)).toContain('INSERT INTO');
    }
  });
  it('the Excel INSERT formula quotes every value, so an empty cell cannot break the SQL', () => {
    const c = labCols(JOURNEY_SPECS[0]);
    const f = excelInsertFormula(c);
    expect(f.startsWith(`="INSERT INTO ${c.table}_raw VALUES (`)).toBe(true);
    expect((f.match(/"'"&(SUBSTITUTE|TEXT)\(/g) ?? []).length).toBe(c.all.length);
    expect(excelKpiFormulas(c).every(k => k.formula.startsWith('='))).toBe(true);
  });
  it('gives install steps for every database on every common computer', () => {
    for (const x of DIALECTS) expect(INSTALL[x.id].length).toBeGreaterThanOrEqual(1);
    expect(INSTALL.mysql.map(o => o.os)).toEqual(['Windows', 'Mac', 'Ubuntu / WSL']);
    expect(INSTALL.postgres.map(o => o.os)).toEqual(['Windows', 'Mac', 'Ubuntu / WSL']);
  });
});

describe('Level 2 field scenes for every domain', () => {
  it('every journey has a “Today in the field” scene on Days 6–10 that names its own table and database', () => {
    for (const d of JOURNEY_SPECS.filter(x => !x.track || x.track.level === 'hard')) {
      const c = labCols(d);
      for (const n of [6, 7, 8, 9, 10]) expect(d.situations?.[n]?.scene, `${d.slug} day ${n}`).toBeTruthy();
      expect(d.situations![7].task, d.slug).toContain(c.table);
      expect(d.situations![9].task, d.slug).toContain(c.db);
      const body = buildDomainJourney(d).levels[1].days.find(x => x.day === 8)!.body;
      expect(body).toContain('## Today in the field');
    }
  });
});

describe('Hard and Critical: PySpark alongside SQL, and reverse engineering', () => {
  const bodies = (slug: string) => buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === slug)!).levels.flatMap(l => l.days.map(d => d.body)).join('\n');
  it('Hard, Critical and untracked journeys get PySpark on the Databricks days; Easy and Intermediate do not', () => {
    for (const s of JOURNEY_SPECS) {
      const n = (bodies(s.slug).match(/## PySpark \(/g) ?? []).length;
      if (s.track && ['easy', 'intermediate'].includes(s.track.level)) expect(n, s.slug).toBe(0); else expect(n, s.slug).toBeGreaterThanOrEqual(14);
    }
  });
  it('advanced journeys inherit a legacy pipeline on Day 16, prove its bugs on Day 21, design the replacement on Day 26 and reconcile on Day 30', () => {
    const j = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'bfsi-critical')!);
    const day = (n: number) => j.levels.flatMap(l => l.days).find(d => d.day === n)!.body;
    expect(day(16)).toContain('CREATE PROCEDURE dbo.usp_daily_payment_txn_kpis');
    expect(day(16)).not.toMatch(/integer division/i); // no hints on the day they read it
    expect(day(21)).toMatch(/Integer division/);
    expect(day(26)).toContain('/Volumes/bfsi_fraud/bronze/raw_files/');
    expect(day(30)).toContain('bfsi_fraud.gold.payment_txn_daily_kpis');
    expect(bodies('bfsi-critical')).toContain('withWatermark'); // Critical: Structured Streaming
    expect(bodies('bfsi')).not.toContain('withWatermark');
  });
});


import { validateStep, STEP_POINTS } from '../lib/domain/guidedSteps';
describe('guided steps (concept → do → check → points)', () => {
  it('Days 1–10 of every domain journey are guided; every step has a concept, instructions and a working check', () => {
    for (const s of JOURNEY_SPECS) {
      const days = buildDomainJourney(s).levels.slice(0, 2).flatMap(l => l.days);
      expect(days.map(d => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (const d of days) {
        expect(d.steps?.length, `${s.slug} day ${d.day}`).toBeGreaterThanOrEqual(3);
        expect(d.body).not.toContain('## Steps');
        for (const st of d.steps!) {
          expect(st.concept.length, `${s.slug} d${d.day} ${st.title}`).toBeGreaterThan(40);
          expect(st.do.length).toBeGreaterThan(0);
          if (st.check.kind === 'paste') {
            expect(() => new RegExp(st.check.kind === 'paste' ? st.check.pattern : '')).not.toThrow();
            if (st.check.sample) expect(validateStep(st, { paste: st.check.sample }).ok, `${s.slug} d${d.day} "${st.title}" sample must pass its own check`).toBe(true);
          }
        }
      }
    }
  });
  it('paste checks reject the wrong output and accept the right one; points are by effort', () => {
    const day7 = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'bfsi-easy')!).levels[1].days.find(d => d.day === 7)!;
    const header = day7.steps![0];
    expect(validateStep(header, { paste: 'emi_id,loan_account_id' }).ok).toBe(false);
    expect(validateStep(header, { paste: 'emi_id,loan_account_id,product,due_date,emi_amount,status,days_late,auto_debit' }).ok).toBe(true);
    expect(validateStep(header, { paste: '' }).ok).toBe(false);
    expect(STEP_POINTS).toEqual({ tick: 2, answer: 3, paste: 5, screenshot: 5 });
  });
});
