import { describe, it, expect } from 'vitest';
import { DOMAINS } from '@/lib/domain/daDomains/catalog';
import { buildDomainJourney, MODULE_PLAN, sampleCsv, DOMAIN_FAMILY, groupRegistrationJourneys } from '@/lib/domain/daDomains/curriculum';
import { readTable, validateDataset } from '@/lib/domain/daDomains/datasetCheck';

const journeys = DOMAINS.map(buildDomainJourney);

describe('domain catalogue', () => {
  it('has 17 industry domains, including education, BFSI and energy & utilities', () => {
    expect(DOMAINS).toHaveLength(17);
    for (const s of ['education', 'bfsi', 'energy-utilities']) expect(DOMAINS.map(d => d.slug)).toContain(s);
  });
  it('slugs, level-code prefixes and Unity Catalog names are unique and well-formed', () => {
    for (const key of ['slug', 'code', 'catalog'] as const) expect(new Set(DOMAINS.map(d => d[key])).size).toBe(17);
    for (const d of DOMAINS) {
      expect(d.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(d.code).toMatch(/^[A-Z]{2,5}$/);
      expect(d.catalog).toMatch(/^[a-z][a-z0-9_]{2,30}$/);
    }
  });
  it('every domain has one flagship problem with stakeholders, decisions, questions and at least 5 KPIs', () => {
    for (const d of DOMAINS) {
      expect(d.problem.title.length, d.slug).toBeGreaterThan(5);
      expect(d.problem.statement.split(' ').length, d.slug).toBeGreaterThan(25);
      expect(d.problem.stakeholders.length, d.slug).toBeGreaterThanOrEqual(3);
      expect(d.problem.questions.length, d.slug).toBeGreaterThanOrEqual(3);
      expect(d.kpis.length, d.slug).toBeGreaterThanOrEqual(5);
    }
  });
  it('every domain names structured, semi-structured and unstructured sources', () => {
    for (const d of DOMAINS) {
      expect(d.sources.structured.length, d.slug).toBeGreaterThanOrEqual(2);
      expect(d.sources.semi.length, d.slug).toBeGreaterThanOrEqual(1);
      expect(d.sources.unstructured.length, d.slug).toBeGreaterThanOrEqual(1);
    }
  });
  it('the education domain is the Student 360° evaluation problem', () => {
    const edu = DOMAINS.find(d => d.slug === 'education')!;
    expect(edu.problem.title).toMatch(/360/);
    expect(JSON.stringify(edu)).toMatch(/sport/i);
    expect(JSON.stringify(edu)).toMatch(/cultural/i);
  });
  it('every dataset schema has a key column and enough columns to be realistic', () => {
    for (const d of DOMAINS) {
      expect(d.dataset.columns.filter(c => c.key).length, d.slug).toBe(1);
      expect(d.dataset.columns.length, d.slug).toBeGreaterThanOrEqual(6);
      expect(d.gold.columns.filter(c => c.key).length, d.slug).toBe(1);
    }
  });
  it('every schema is satisfiable: the generated sample passes raw, silver and gold validation', () => {
    for (const j of journeys) for (const layer of ['dataset', 'silver', 'gold'] as const) {
      const schema = j.schemas[layer];
      const report = validateDataset(readTable(Buffer.from(sampleCsv(schema, 60)), 'sample.csv'), schema);
      expect(report.passed, `${j.slug} ${layer}: ${report.checks.filter(c => !c.ok).map(c => c.detail).join(' | ')}`).toBe(true);
    }
  });
});

describe('40-day domain journeys', () => {
  it('each journey is a separate data-analytics-domain journey with its own slug', () => {
    for (const j of journeys) {
      expect(j.slug).toMatch(/^da-[a-z-]+$/);
      expect(j.config.family).toBe(DOMAIN_FAMILY);
      expect(j.title).toMatch(/Data Analytics/);
    }
    expect(new Set(journeys.map(j => j.slug)).size).toBe(17);
  });
  it('has 9 modules × 5 days = 45 days, numbered 1 to 45 in order', () => {
    expect(MODULE_PLAN).toHaveLength(9);
    for (const j of journeys) {
      expect(j.levels).toHaveLength(9);
      const days = j.levels.flatMap(l => l.days.map(d => d.day));
      expect(days).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
      for (const l of j.levels) expect(l.days).toHaveLength(5);
    }
  });
  it('level codes are unique across all 17 journeys', () => {
    const codes = journeys.flatMap(j => j.levels.map(l => l.code));
    expect(new Set(codes).size).toBe(17 * 9);
    for (const c of codes) expect(c).toMatch(/^[A-Z]{2,5}_M[1-9]_[A-Z_]+$/);
  });
  it('every module has the six activities, with dataset checks in collection, silver and gold', () => {
    for (const j of journeys) for (const [n, l] of j.levels.entries()) {
      expect(l.activities.map(a => a.idx)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(l.activities.map(a => a.config.kind)).toEqual(['briefing', 'learn', [1, 4, 5].includes(n) ? 'dataset' : 'screenshot', 'build', 'proof', 'boss']);
      expect(l.activities[5].config.rubric).toBe(`DOMAIN_M${n + 1}_RUBRIC`);
    }
  });
  it('quiz, briefing and boss answers point at real options', () => {
    for (const j of journeys) for (const l of j.levels) {
      const [b, learn, , , , boss] = l.activities.map(a => a.config);
      expect(b.check.answer).toBeLessThan(b.check.options.length);
      expect(learn.quiz.length).toBeGreaterThanOrEqual(5);
      for (const q of learn.quiz) expect(q.answer).toBeLessThan(q.options.length);
      for (const s of boss.scenarios) for (const c of s.correct) expect(c).toBeLessThan(boss.choices.length);
    }
  });
  it('day pages are written for the domain and follow the pipeline', () => {
    const stageWords = ['problem', 'structured', 'Unity Catalog', 'bronze', 'silver', 'gold', 'Power BI', 'machine learning', 'capstone'];
    for (const j of journeys) {
      const d = DOMAINS.find(x => x.slug === j.config.domain)!;
      for (const [n, l] of j.levels.entries()) for (const day of l.days) {
        expect(day.body, `${j.slug} day ${day.day}`).toContain(d.name);
        expect(day.body).toMatch(/^# Day \d+ — /m);
        expect(day.body).toMatch(/## Steps/);
        expect(day.body.toLowerCase()).toContain(stageWords[n].toLowerCase());
      }
      const m2 = j.levels[1].days.map(x => x.body).join('\n');
      for (const w of ['structured', 'semi-structured', 'unstructured']) expect(m2.toLowerCase()).toContain(w);
      expect(j.levels[2].days.map(x => x.body).join('\n')).toContain(d.catalog);
    }
  });
  it('the collection module gives an AI prompt that names every dataset column', () => {
    for (const j of journeys) {
      const prompt = j.levels[1].days.map(x => x.body).join('\n');
      for (const c of j.schemas.dataset.columns) expect(prompt, `${j.slug}: ${c.name}`).toContain(c.name);
    }
  });
});

describe('registration grouping', () => {
  it('separates general journeys from the 17 domain journeys and sorts domains by name', () => {
    const list = [
      { slug: 'data-analytics-journey', title: 'Generic', config: null },
      ...journeys.map(j => ({ slug: j.slug, title: j.title, config: j.config })),
    ];
    const g = groupRegistrationJourneys(list);
    expect(g.general.map(x => x.slug)).toEqual(['data-analytics-journey']);
    expect(g.domains).toHaveLength(17);
    expect(g.domains.map(x => x.name)).toEqual([...g.domains.map(x => x.name)].sort((a, b) => a.localeCompare(b)));
    expect(g.domains[0]).toHaveProperty('problem');
  });
});

describe('enterprise production grade', () => {
  it('every domain has a prediction target for the ML module, taken from its own data', () => {
    for (const d of DOMAINS) {
      expect(['classification', 'regression'], d.slug).toContain(d.enterprise.ml.task);
      const cols = [...d.gold.columns, ...d.dataset.columns].map(c => c.name);
      expect(cols, `${d.slug} target ${d.enterprise.ml.target}`).toContain(d.enterprise.ml.target);
      for (const f of d.enterprise.ml.features) expect(cols, `${d.slug} feature ${f}`).toContain(f);
      expect(d.enterprise.ml.features.length, d.slug).toBeGreaterThanOrEqual(3);
    }
  });
  it('every domain has an enterprise profile: scale, SLA, regulations and PII columns to mask', () => {
    for (const d of DOMAINS) {
      expect(d.enterprise.scale, d.slug).toMatch(/\d/);
      expect(d.enterprise.sla.length, d.slug).toBeGreaterThan(10);
      expect(d.enterprise.regulations.length, d.slug).toBeGreaterThanOrEqual(2);
      expect(d.enterprise.regulations.join(' '), d.slug).toMatch(/DPDP/);
      expect(d.enterprise.piiColumns.length, d.slug).toBeGreaterThanOrEqual(1);
      expect(d.enterprise.scdDimension.length, d.slug).toBeGreaterThan(2);
    }
  });
  it('the journey teaches corporate deployment practices at the right stage', () => {
    const where: [number, RegExp][] = [
      [0, /business case/i], [0, /data contract/i], [0, /DPDP/],
      [2, /_dev/], [2, /_prod/], [2, /column mask/i], [2, /row filter/i],
      [3, /Auto Loader/], [3, /schema evolution/i],
      [4, /EXPECT/], [4, /Lakeflow/],
      [5, /SCD Type 2/], [5, /MERGE INTO/], [5, /CLUSTER BY|OPTIMIZE/],
      [6, /row-level security/i], [6, /deployment pipeline/i], [6, /scheduled refresh/i],
      [7, /MLflow/], [7, /Unity Catalog/], [7, /batch scor/i], [7, /Genie/], [7, /bias|fairness/i],
      [8, /Asset Bundle/i], [8, /Jobs/], [8, /runbook/i], [8, /go-live/i],
    ];
    for (const j of journeys) for (const [m, re] of where) {
      expect(j.levels[m].days.map(x => x.body).join('\n'), `${j.slug} module ${m + 1} ${re}`).toMatch(re);
    }
  });
  it('each domain’s regulations and SLA appear in its own journey', () => {
    for (const j of journeys) {
      const d = DOMAINS.find(x => x.slug === j.config.domain)!;
      const all = j.levels.flatMap(l => l.days.map(x => x.body)).join('\n');
      for (const r of d.enterprise.regulations) expect(all, `${j.slug}: ${r}`).toContain(r);
      expect(all).toContain(d.enterprise.sla);
      for (const p of d.enterprise.piiColumns) expect(all, `${j.slug}: mask ${p}`).toContain(p);
    }
  });
});

describe('generated text quality', () => {
  it('no day page or activity shows raw template code, undefined, NaN or [object Object]', () => {
    const bad: string[] = [];
    const re = /\$\{[^}]*\}|\bundefined\b|\[object Object\]|\bNaN\b/;
    for (const j of journeys) for (const l of j.levels) {
      for (const d of l.days) if (re.test(d.body)) bad.push(`${j.slug} day ${d.day}`);
      for (const a of l.activities) if (re.test(JSON.stringify(a.config))) bad.push(`${j.slug} ${l.code} ${a.code}`);
    }
    expect(bad).toEqual([]);
  });
});
