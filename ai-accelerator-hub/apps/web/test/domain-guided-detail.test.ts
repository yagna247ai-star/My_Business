import { describe, it, expect } from 'vitest';
import { JOURNEY_SPECS } from '@/lib/domain/daDomains/tracks';
import { buildDomainJourney } from '@/lib/domain/daDomains/curriculum';
import { RUN_IT } from '@/lib/domain/daDomains/guidedDetail';
import type { GuidedStep } from '@/lib/domain/guidedSteps';

const stepsOf = (slug: string) => buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === slug)!).levels.flatMap(l => l.days.map(d => ({ day: d.day, steps: (d.steps ?? []) as GuidedStep[] })));
const cmds = (s: GuidedStep) => s.do.flatMap(x => (typeof x !== 'string' && x.cmd ? [x] : []));

describe('domain journeys: detailed guided steps (Agent Lab style)', () => {
  it('no step in any journey says only “run the code from the lesson”, and every step has a time estimate', () => {
    for (const spec of JOURNEY_SPECS) for (const { day, steps } of stepsOf(spec.slug)) for (const s of steps) {
      expect(s.do.includes(RUN_IT), `${spec.slug} day ${day}: ${s.title}`).toBe(false);
      expect(s.minutes, `${spec.slug} day ${day}: ${s.title}`).toBeGreaterThan(0);
    }
  });
  it('Databricks steps carry the day’s code to copy, Windows and Mac keys, what you should see, and fixes', () => {
    const ingest = stepsOf('energy-utilities').find(d => d.day === 17)!.steps.find(s => cmds(s).length)!;
    expect(cmds(ingest)[0].lang).toBe('sql');
    expect(ingest.do.some(x => typeof x !== 'string' && x.os === 'windows' && x.keys?.includes('Ctrl'))).toBe(true);
    expect(ingest.do.some(x => typeof x !== 'string' && x.os === 'macos' && x.keys?.includes('⌘'))).toBe(true);
    expect(ingest.see?.length).toBeGreaterThan(0);
    expect(ingest.fix?.some(f => /TABLE_OR_VIEW_NOT_FOUND/.test(f.problem))).toBe(true);
  });
  it('Hard and Critical tracks also get the PySpark notebook version', () => {
    const hard = stepsOf('bfsi').find(d => d.day === 17)!.steps.flatMap(cmds);
    expect(hard.some(c => c.lang === 'python' && /spark/.test(c.cmd!))).toBe(true);
    const easy = stepsOf('bfsi-easy').find(d => d.day === 17)!.steps.flatMap(cmds);
    expect(easy.some(c => c.lang === 'python' && /spark\.read/.test(c.cmd!))).toBe(false);
  });
  it('Power BI days give every DAX measure in a copy box and the connection steps', () => {
    const days = stepsOf('retail-ecommerce');
    const dax = days.find(d => d.day === 33)!.steps.flatMap(cmds).filter(c => c.lang === 'dax');
    expect(dax.length).toBe(JOURNEY_SPECS.find(s => s.slug === 'retail-ecommerce')!.dashboard.measures.length);
    const connect = days.find(d => d.day === 31)!.steps.find(s => s.title.startsWith('Connect Power BI'))!;
    expect(connect.do.some(x => typeof x === 'string' && /HTTP path/.test(x))).toBe(true);
  });
});
