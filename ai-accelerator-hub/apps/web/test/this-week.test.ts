// docs/THIS_WEEK_SPEC.md
import { describe, it, expect } from 'vitest';
import { weekPlan, weekStart } from '@/lib/domain/weekPlanCore';

// Thursday 26 Nov 2026, 10:00 IST = 04:30 UTC. The week is Mon 23 Nov – Sun 29 Nov.
const now = new Date('2026-11-26T04:30:00Z');
const at = (iso: string) => new Date(iso).toISOString();
const study = (n: number, state = 'open') => ({ day: n, title: `Day ${n}`, state, href: `/levels/DA02/days/${n}`, materials: n % 2 });

describe('This week', () => {
  it('AC-1/AC-7: real dates Monday to Sunday in IST, today marked, past dimmed', () => {
    expect(new Date(weekStart(now)).toISOString()).toBe('2026-11-22T18:30:00.000Z'); // Mon 23 Nov 00:00 IST
    const w = weekPlan({ now, sessions: [], hackathons: [], studyDays: [] });
    expect(w.range).toBe('23 Nov – 29 Nov');
    expect(w.days.map(d => d.name)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(w.days[3]).toMatchObject({ date: '26 Nov', isToday: true, past: false });
    expect(w.days[4]).toMatchObject({ isToday: false, past: false });
    expect(w.days[0].past).toBe(true);
    // Sunday 23:30 IST still belongs to the same week; Monday 00:00 IST starts the next.
    expect(weekStart(new Date('2026-11-29T18:00:00Z'))).toBe(weekStart(now));
    expect(weekStart(new Date('2026-11-29T18:30:00Z'))).toBe(weekStart(now) + 7 * 86_400_000);
  });
  it('AC-2: this week’s sessions on their day with IST time; other weeks never in the grid', () => {
    const w = weekPlan({ now, hackathons: [], studyDays: [], sessions: [
      { title: 'SQL joins workshop', kind: 'workshop', startsAt: at('2026-11-28T04:30:00Z'), durationMin: 120, liveLink: 'https://meet.example/x' },
      { title: 'Office hours', kind: 'office_hours', startsAt: at('2026-12-02T12:30:00Z') },
      { title: 'Last week', startsAt: at('2026-11-20T04:30:00Z') },
    ] });
    expect(w.days[5].items).toEqual([{ kind: 'live', title: 'SQL joins workshop', sessionKind: 'workshop', time: '10:00 AM IST', status: 'upcoming', href: null, cta: null }]);
    expect(w.days.flatMap(d => d.items).length).toBe(1);
    expect(w.summary.live).toBe(1);
  });
  it('AC-3: Join from 15 minutes before until the end, then the recording or "Ended"', () => {
    const s = (startsAt: string, extra = {}) => weekPlan({ now, hackathons: [], studyDays: [], sessions: [{ title: 'W', startsAt, durationMin: 60, liveLink: 'https://meet.example/x', ...extra }] }).days[3].items[0];
    expect(s(at('2026-11-26T04:40:00Z'))).toMatchObject({ status: 'live', cta: 'Join', href: 'https://meet.example/x' });      // starts in 10 min
    expect(s(at('2026-11-26T05:00:00Z'))).toMatchObject({ status: 'upcoming', cta: null });                                    // in 30 min
    expect(s(at('2026-11-26T03:00:00Z'))).toMatchObject({ status: 'ended', cta: null });                                       // ended, no recording
    expect(s(at('2026-11-26T03:00:00Z'), { recordingUrl: 'https://rec.example/1' })).toMatchObject({ status: 'ended', cta: 'Watch recording', href: 'https://rec.example/1' });
    expect(s(at('2026-11-26T04:40:00Z'), { liveLink: 'http://insecure' })).toMatchObject({ status: 'live', cta: null });
  });
  it('AC-4: hackathon dates this week', () => {
    const w = weekPlan({ now, sessions: [], studyDays: [], hackathons: [{ title: 'Retail sprint', buildStartAt: '2026-11-29T03:30:00Z', submitDueAt: '2026-12-06T12:30:00Z' }] });
    expect(w.days[6].items).toEqual([{ kind: 'hackathon', title: 'Hackathon build starts: Retail sprint', time: '9:00 AM IST' }]);
  });
  it('AC-5: next unfinished days, one per weekday from today, never done or skipped ones', () => {
    const w = weekPlan({ now, sessions: [], hackathons: [], studyDays: [study(1, 'done'), study(2, 'skipped'), study(3), study(4), study(5), study(6)] });
    expect(w.days.map(d => d.items.filter(i => i.kind === 'study').map(i => (i as { day: number }).day))).toEqual([[], [], [], [3], [4], [], []]); // Thursday and Friday: weekends and past days get no plan
    expect(w.summary).toMatchObject({ study: 2, materials: 1 });
    expect(w.days[3].items[0]).toMatchObject({ href: '/levels/DA02/days/3', materials: 1 });
  });
  it('AC-6: no class this week → the next one; no classes at all → the usual rhythm', () => {
    const next = weekPlan({ now, hackathons: [], studyDays: [], sessions: [{ title: 'Office hours', startsAt: at('2026-12-02T12:30:00Z') }] });
    expect(next.nextLive).toEqual({ title: 'Office hours', when: 'Wed 2 Dec, 6:00 PM IST' });
    const none = weekPlan({ now, hackathons: [], studyDays: [], sessions: [], weekly: { mondayToFriday: 'Preparation missions', saturday: 'Live workshop', sunday: '4-hour hackathon' } });
    expect(none).toMatchObject({ nextLive: null, rhythm: 'Preparation missions · Live workshop · 4-hour hackathon' });
  });
});
