// docs/DAY_TIME_ESTIMATE_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JOURNEY_SPECS } from '@/lib/domain/daDomains/tracks';
import { buildDomainJourney } from '@/lib/domain/daDomains/curriculum';
import { dayMinutes, fmtMinutes, readMinutes, withDayTime } from '@/lib/domain/dayTime';

const root = join(__dirname, '..');
const head = '# Day 6 — Asking\n\n> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Pinnacle Tools\n\n## The problem\n';

describe('day time estimate', () => {
  it('AC-1: reading time skips code and the answer key; at least 5 minutes', () => {
    expect(readMinutes('short')).toBe(5);
    const long = `${'word '.repeat(1800)}\n\`\`\`sql\n${'SELECT 1; '.repeat(2000)}\n\`\`\`\n## Check yourself (trainer's answer key)\n${'answer '.repeat(5000)}`;
    expect(readMinutes(long)).toBe(10);
  });
  it('AC-2: the day = reading + steps, rounded to 5; formatted like "1 h 35 min"', () => {
    expect(dayMinutes('short', [15, 10, 10, undefined])).toEqual({ total: 40, read: 5, steps: 35, count: 4 });
    expect(dayMinutes('short', [undefined])).toBeNull();
    expect(fmtMinutes(45)).toBe('45 min'); expect(fmtMinutes(60)).toBe('1 h'); expect(fmtMinutes(95)).toBe('1 h 35 min');
  });
  it('AC-3: only the time in the header changes; module and shop stay', () => {
    expect(withDayTime(head, { total: 95, read: 15, steps: 80, count: 8 })).toContain('> **Time:** about 1 h 35 min (lesson 15 min + 8 steps 1 h 20 min) · **Module:** M2 SQL · **Shop:** Pinnacle Tools');
    expect(withDayTime(head, null)).toBe(head);
    expect(withDayTime('# No header\n\nText · more', { total: 30, read: 5, steps: 25, count: 3 })).toBe('# No header\n\nText · more');
  });
  it('AC-4: days no longer all show the same time', () => {
    const spec = JOURNEY_SPECS[0];
    const days = buildDomainJourney(spec).levels.flatMap(l => l.days);
    const mins = days.map(d => dayMinutes(d.body, (d.steps ?? []).map((s: { minutes?: number }) => s.minutes))).filter((m): m is NonNullable<typeof m> => m !== null).map(m => m.total);
    expect(mins.length).toBe(days.length);
    expect(new Set(mins).size).toBeGreaterThan(5);
    for (const m of mins) { expect(m).toBeGreaterThan(10); expect(m).toBeLessThan(8 * 60); }
  });
  it('AC-5: the day page uses it', () => {
    expect(readFileSync(join(root, 'app/(app)/levels/[code]/days/[day]/page.tsx'), 'utf8')).toMatch(/withDayTime\(translated \?\? body, guided \? dayMinutes\(body/);
  });
});
