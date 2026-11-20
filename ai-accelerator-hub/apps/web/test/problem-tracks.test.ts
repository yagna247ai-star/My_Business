import { describe, it, expect } from 'vitest';
import { EDUCATION_CANDIDATES, EDUCATION_TRACKS, IKIGAI_QUIZ, rankedCandidates, recommendTrack, ikigaiScore } from '../lib/domain/daDomains/dossiers/education-tracks';

describe('education problem tracks', () => {
  it('ranks candidates by Ikigai score, feasibility breaking ties', () => {
    const r = rankedCandidates();
    expect(r[0].id).toBe('early-warning');
    for (let i = 1; i < r.length; i++) expect(ikigaiScore(r[i - 1])).toBeGreaterThanOrEqual(ikigaiScore(r[i]));
    expect(r.findIndex(c => c.id === 'talent-360')).toBeLessThan(r.findIndex(c => c.id === 'safeguarding')); // tie → feasibility
  });
  it('has exactly one track per level, each tied to a candidate, with 9 module deliverables', () => {
    expect(EDUCATION_TRACKS.map(t => t.level)).toEqual(['easy', 'intermediate', 'hard', 'critical']);
    for (const t of EDUCATION_TRACKS) {
      expect(EDUCATION_CANDIDATES.find(c => c.id === t.problemId)?.track).toBe(t.level);
      expect(t.steps).toHaveLength(9);
      expect(t.question.length).toBeGreaterThan(60);
    }
    expect(EDUCATION_TRACKS.find(t => t.level === 'critical')?.gate).toBeTruthy();
  });
  it('recommends a track from the quiz; ties go to the easier track', () => {
    expect(IKIGAI_QUIZ).toHaveLength(5);
    expect(recommendTrack([0, 0, 0, 0, 0]).level).toBe('easy');
    expect(recommendTrack([1, 1, 1, 1, 1]).level).toBe('intermediate');
    expect(recommendTrack([2, 2, 2, 2, 2]).level).toBe('hard');
    expect(recommendTrack([3, 3, 3, 3, 3]).level).toBe('critical');
    expect(recommendTrack([]).level).toBe('easy');
  });
});

import { JOURNEY_SPECS, TRACKED_DOMAINS, trackChangeAllowed, TRACK_ORDER } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney, sampleCsv } from '../lib/domain/daDomains/curriculum';
import { readTable, validateDataset } from '../lib/domain/daDomains/datasetCheck';

describe('track journeys (Education: easy, intermediate, hard, critical)', () => {
  const specs = JOURNEY_SPECS.filter(s => s.track?.of === 'education');
  const built = specs.map(buildDomainJourney);
  it('builds four Education journeys, the Hard one keeping the original slug', () => {
    expect(specs.map(s => s.track!.level).sort()).toEqual([...TRACK_ORDER].sort());
    expect(built.map(j => j.slug).sort()).toEqual(['da-education', 'da-education-critical', 'da-education-easy', 'da-education-intermediate']);
    expect(JOURNEY_SPECS).toHaveLength(20);
    expect(TRACKED_DOMAINS.education.tracks).toHaveLength(4);
  });
  it('slugs, level-code prefixes and catalogs are unique across every journey', () => {
    for (const k of ['slug', 'code', 'catalog'] as const) expect(new Set(JOURNEY_SPECS.map(s => s[k])).size).toBe(JOURNEY_SPECS.length);
    const codes = JOURNEY_SPECS.map(buildDomainJourney).flatMap(j => j.levels.map(l => l.code));
    expect(new Set(codes).size).toBe(codes.length);
  });
  it('each track has 9 modules, 45 days, its own track block on every day, and a tagged config', () => {
    for (const j of built) {
      const spec = specs.find(s => `da-${s.slug}` === j.slug)!;
      expect(j.levels).toHaveLength(9);
      const days = j.levels.flatMap(l => l.days);
      expect(days).toHaveLength(45);
      for (const d of days) {
        expect(d.body, `${j.slug} day ${d.day}`).toContain(`## Your ${spec.track!.label} track this module`);
        expect(d.body).not.toMatch(/\$\{|undefined/);
      }
      expect(j.config).toMatchObject({ domain: 'education', track: spec.track!.level });
    }
  });
  it('the Hard track opens every day with the real-world situation from the case file', () => {
    const hard = built.find(j => j.slug === 'da-education')!;
    const day22 = hard.levels.flatMap(l => l.days).find(d => d.day === 22)!;
    expect(day22.body).toContain('## Today in the field');
    expect(day22.body).toContain('ARJUN K');
  });
  it('tracks change the problem, data and validation, not just the label', () => {
    expect(new Set(built.map(j => j.schemas.dataset.name)).size).toBe(4);
    expect(new Set(built.map(j => j.schemas.gold.name)).size).toBe(4);
    expect(new Set(specs.map(s => s.problem.title)).size).toBe(4);
  });
  it('every track schema is satisfiable and its ML target and features come from its own data', () => {
    for (const s of specs) {
      const j = buildDomainJourney(s);
      for (const layer of ['dataset', 'silver', 'gold'] as const) {
        const r = validateDataset(readTable(Buffer.from(sampleCsv(j.schemas[layer], 60)), 'sample.csv'), j.schemas[layer]);
        expect(r.passed, `${j.slug} ${layer}: ${r.checks.filter(c => !c.ok).map(c => c.detail).join(' | ')}`).toBe(true);
      }
      const cols = [...s.gold.columns, ...s.dataset.columns].map(c => c.name);
      for (const f of [s.enterprise.ml.target, ...s.enterprise.ml.features]) expect(cols, `${s.slug} ${f}`).toContain(f);
    }
  });
  it('a track can change only until Module 1 is approved', () => {
    for (const st of [null, undefined, 'locked', 'available', 'in_progress', 'submitted', 'needs_review', 'rejected']) expect(trackChangeAllowed(st)).toBe(true);
    expect(trackChangeAllowed('approved')).toBe(false);
  });
});

import { canChangeLearnerTracks, canEditTrackSettings, trackChangeRoles, DEFAULT_TRACK_CHANGE_ROLES } from '../lib/domain/trackRules';
describe('track-change permissions', () => {
  it('defaults to Institution Admin, Program Manager and Instructor; Super Admin always', () => {
    expect(trackChangeRoles({})).toEqual(DEFAULT_TRACK_CHANGE_ROLES);
    expect(canChangeLearnerTracks({ role: 'instructor', superAdmin: false }, {})).toBe(true);
    expect(canChangeLearnerTracks({ role: 'mentor', superAdmin: false }, {})).toBe(false);
    expect(canChangeLearnerTracks({ role: 'learner', superAdmin: true }, { trackChangeRoles: [] })).toBe(true);
  });
  it('follows the institution setting, ignoring unknown or unsafe roles', () => {
    const s = { trackChangeRoles: ['mentor', 'learner', 'super_admin'] };
    expect(trackChangeRoles(s)).toEqual(['mentor']);
    expect(canChangeLearnerTracks({ role: 'instructor', superAdmin: false }, s)).toBe(false);
    expect(canChangeLearnerTracks({ role: 'mentor', superAdmin: false }, s)).toBe(true);
  });
  it('the setting itself is editable by Super Admin, Institution Admin and Program Manager only', () => {
    expect(canEditTrackSettings({ role: 'program_mgr', superAdmin: false })).toBe(true);
    expect(canEditTrackSettings({ role: 'tenant_admin', superAdmin: false })).toBe(true);
    expect(canEditTrackSettings({ role: 'instructor', superAdmin: false })).toBe(false);
  });
});
