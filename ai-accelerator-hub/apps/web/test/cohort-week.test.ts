// docs/COHORT_WEEK_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { calendarSchema, classIndex, cohortWeek, dayKind, defaultCalendar, type CourseDay, type Mark } from '@/lib/domain/cohortCalendar';

const root = join(__dirname, '..');
// Thursday 26 Nov 2026, 10:30 IST (during the 10:00–12:00 session).
const now = new Date('2026-11-26T05:00:00Z');
const cal = { ...defaultCalendar('2026-11-16'), holidays: ['2026-11-24'] };
const courseDays: CourseDay[] = [...[1, 2, 3, 4, 5, 6].map(d => ({ levelCode: 'DA01', day: d, title: `L1 Day ${d}`, state: 'done', contentId: `c1-${d}` })), ...[1, 2, 3, 4, 5, 6].map(d => ({ levelCode: 'DA02', day: d, title: `L2 Day ${d}`, state: 'open', contentId: `c2-${d}` }))];
const mats = new Map([['c2-3', [{ id: 'm1', title: 'Joins slides', kind: 'slides', opened: false, studied: false, practised: false }]]]);
const view = (over: Partial<Parameters<typeof cohortWeek>[0]> = {}) => cohortWeek({ now, calendar: cal, courseDays, materials: mats, attendance: new Map(), ...over });

describe('cohort calendar (admin)', () => {
  it('AC-1: the SLN defaults, and invalid input is refused per field', () => {
    expect(defaultCalendar('2026-12-01')).toMatchObject({ classDays: [1, 2, 3, 4, 5, 6], halfDay: 7, blocks: [{ label: 'Session', start: '10:00', end: '12:00', mode: 'offline' }, { label: 'Lab', start: '12:30', end: '13:30' }] });
    expect(calendarSchema.safeParse(defaultCalendar('2026-12-01')).success).toBe(true);
    const bad = (patch: object) => calendarSchema.safeParse({ ...defaultCalendar('2026-12-01'), ...patch });
    expect(bad({ startDate: '2026-02-31x' }).success).toBe(false);
    expect(bad({ blocks: [{ key: 'session', label: 'Session', start: '12:00', end: '10:00', mode: 'offline' }] }).success).toBe(false);
    expect(bad({ blocks: [{ key: 'session', label: 'Session', start: '10:00', end: '12:00', mode: 'online', link: 'http://meet' }] }).success).toBe(false);
    expect(bad({ classDays: [] }).success).toBe(false);
  });
  it('AC-2: class dates map to course days in order; holidays shift; the half day never takes one', () => {
    expect(classIndex(cal, '2026-11-16')).toBe(0);
    expect(classIndex(cal, '2026-11-21')).toBe(5);  // Saturday
    expect(dayKind(cal, '2026-11-22')).toBe('halfday'); // Sunday
    expect(classIndex(cal, '2026-11-22')).toBeNull();
    expect(classIndex(cal, '2026-11-23')).toBe(6);
    expect(dayKind(cal, '2026-11-24')).toBe('holiday');
    expect(classIndex(cal, '2026-11-25')).toBe(7);  // shifted by the holiday
    expect(dayKind(cal, '2026-11-15')).toBe('before');
  });
});

describe('This week (learner)', () => {
  it('AC-4: course day, blocks with IST times, Join only in its window, and that day’s materials', () => {
    const w = view();
    const thu = w.days[3];
    expect(thu).toMatchObject({ iso: '2026-11-26', isToday: true, kind: 'class', course: { levelCode: 'DA02', day: 3, title: 'L2 Day 3', href: '/levels/DA02/days/3' } });
    expect(thu.blocks.map(b => [b.label, b.time, b.status])).toEqual([['Session', '10:00 AM – 12:00 PM', 'live'], ['Lab', '12:30 PM – 1:30 PM', 'upcoming']]);
    expect(thu.materials.map(m => m.title)).toEqual(['Joins slides']);
    const online = view({ calendar: { ...cal, blocks: [{ key: 'session', label: 'Session', start: '10:00', end: '12:00', mode: 'online', venue: '', link: 'https://meet.example/x' }, { key: 'lab', label: 'Lab', start: '12:30', end: '13:30', mode: 'online', venue: '', link: 'https://meet.example/y' }] } }).days[3];
    expect(online.blocks.map(b => b.join)).toEqual(['https://meet.example/x', null]);
  });
  it('AC-5: done, missed, today, upcoming; half day and holiday', () => {
    const w = view({ courseDays: courseDays.map(c => c.levelCode === 'DA02' && c.day === 1 ? { ...c, state: 'done' } : c) });
    expect(w.days.map(d => d.kind)).toEqual(['class', 'holiday', 'class', 'class', 'class', 'class', 'halfday']);
    expect(w.days.map(d => d.state)).toEqual(['done', null, 'missed', 'today', 'upcoming', 'upcoming', null]);
  });
  it('AC-6: progress and one next step (earliest missed, else today)', () => {
    const w = view();
    expect(w.progress).toEqual({ done: 0, total: 5, pct: 0 });
    expect(w.next).toMatchObject({ why: 'catchup', iso: '2026-11-23', day: 1, title: 'L2 Day 1' });
    const caught = view({ courseDays: courseDays.map(c => c.levelCode === 'DA02' && c.day <= 2 ? { ...c, state: 'done' } : c) });
    expect(caught.progress).toEqual({ done: 2, total: 5, pct: 40 });
    expect(caught.next).toMatchObject({ why: 'today', day: 3, materials: 1 });
  });
  it('AC-7: check-in window, never over a mentor’s mark; attendance count', () => {
    const thu = view().days[3];
    expect(thu.blocks.map(b => b.canCheckIn)).toEqual([true, false]); // session live; lab not yet
    expect(view().days[2].blocks[0].canCheckIn).toBe(true);           // yesterday: until the end of today
    expect(view().days[0].blocks[0].canCheckIn).toBe(false);          // Monday: too late
    const attendance = new Map<string, Mark>([['2026-11-26:session', { status: 'absent', source: 'mentor' }], ['2026-11-25:session', { status: 'present', source: 'learner' }]]);
    const w = view({ attendance });
    expect(w.days[3].blocks[0]).toMatchObject({ canCheckIn: false, mark: { status: 'absent', source: 'mentor' } });
    expect(w.days[2].blocks[0].canCheckIn).toBe(false);
    expect(w.attendance).toEqual({ attended: 1, held: 5 }); // Mon 2 + Wed 2 + Thu session (live); Tue is a holiday, Thu lab not yet
  });
  it('AC-8: the peer line only when at least half of 5+ did it', () => {
    const peers = new Map([['DA02:3', { done: 18, total: 25 }], ['DA02:4', { done: 4, total: 25 }], ['DA02:5', { done: 3, total: 4 }]]);
    const w = view({ peers });
    expect(w.days[3].peer).toEqual({ done: 18, total: 25 });
    expect(w.days[4].peer).toBeNull();
    expect(w.days[5].peer).toBeNull();
  });
  it('AC-9: one-off sessions still appear; without a calendar the v1.0 view is used', () => {
    const w = view({ sessions: [{ title: 'Guest talk', startsAt: '2026-11-28T09:30:00Z' }] });
    expect(w.days[5].extras).toMatchObject([{ kind: 'live', title: 'Guest talk' }]);
    expect(readFileSync(join(root, 'lib/domain/cohortWeek.ts'), 'utf8')).toMatch(/thisWeek\(/);
  });
});

describe('wiring', () => {
  it('AC-3: routes and pages exist and check permissions', () => {
    const r = (f: string) => readFileSync(join(root, f), 'utf8');
    expect(r('app/api/v1/admin/cohorts/[id]/calendar/route.ts')).toMatch(/saveCalendar/);
    expect(r('app/api/v1/admin/cohorts/[id]/attendance/route.ts')).toMatch(/mentorMark/);
    expect(r('app/api/v1/attendance/route.ts')).toMatch(/requirePerm\('learn:self'\)/);
    expect(existsSync(join(root, 'app/(app)/admin/cohorts/[id]/week/page.tsx'))).toBe(true);
    expect(r('lib/domain/cohortWeek.ts')).toMatch(/canMarkAttendance/);
    expect(readFileSync(join(root, '../../packages/db/prisma/migrations/0021_session_attendance/migration.sql'), 'utf8')).toMatch(/CREATE TABLE "session_attendance"/);
  });
});
