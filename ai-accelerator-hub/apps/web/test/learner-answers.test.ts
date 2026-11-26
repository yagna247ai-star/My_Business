// docs/LEARNER_ANSWER_CHECK_SPEC.md AC-6 — every guided answer step in every course, entered with its own example.
import { describe, it, expect } from 'vitest';
import { GENERIC_GUIDED } from '@/lib/domain/genericGuided';
import { JOURNEY_SPECS } from '@/lib/domain/daDomains/tracks';
import { buildDomainJourney } from '@/lib/domain/daDomains/curriculum';
import { validateStep, type GuidedStep } from '@/lib/domain/guidedSteps';

const steps: [string, GuidedStep][] = [];
for (const [d, ss] of Object.entries(GENERIC_GUIDED)) for (const s of ss) steps.push([`data-analytics day ${d}`, s]);
for (const j of JOURNEY_SPECS) for (const lv of buildDomainJourney(j).levels) for (const day of lv.days) for (const s of day.steps ?? []) steps.push([`${j.slug} day ${day.day}`, s]);
const answers = steps.filter(([, s]) => s.check.kind === 'answer' && 'hint' in s.check && s.check.hint) as [string, GuidedStep & { check: { kind: 'answer'; prompt: string; hint: string } }][];
const hasResult = (h: string) => (h.match(/\d/g) ?? []).length >= 2;

describe('AC-6: answer steps and their examples', () => {
  it('finds the course answer steps', () => expect(answers.length).toBeGreaterThan(600));
  it('an answer matching an example that holds a result is accepted', () => {
    const refused = answers.filter(([, s]) => hasResult(s.check.hint) && !validateStep(s, { answer: s.check.hint }).ok).map(([w, s]) => `${w}: ${s.check.prompt}`);
    expect([...new Set(refused)]).toEqual([]);
  });
  it('a copy of a prose example is still refused', () => {
    const passed = answers.filter(([, s]) => !hasResult(s.check.hint) && s.check.hint.split(/\s+/).length >= 4 && validateStep(s, { answer: s.check.hint }).ok).map(([w, s]) => `${w}: ${s.check.prompt}`);
    expect([...new Set(passed)]).toEqual([]);
  });
});
