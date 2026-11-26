/**
 * Cohort calendar and the learner's week (docs/COHORT_WEEK_SPEC.md). Pure: "now" and all data are passed in.
 * Dates are IST calendar days as "YYYY-MM-DD"; weekdays are 1 = Monday … 7 = Sunday.
 */
import { z } from 'zod';
import { weekStart, type HackathonDates, type Session, type WeekItem, weekPlan } from './weekPlanCore';

const IST = 330 * 60_000;
const DAY = 86_400_000;
const NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 10:00.');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-12-01.').refine(s => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Not a real date.');
export const blockSchema = z.object({
  key: z.string().trim().min(1).max(20).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits or -.'),
  label: z.string().trim().min(1, 'Name the block, e.g. Session or Lab.').max(40),
  start: hhmm, end: hhmm,
  mode: z.enum(['offline', 'online']),
  venue: z.string().trim().max(120).optional().default(''),
  link: z.string().trim().max(500).regex(/^https:\/\/\S+$/, 'The online link must start with https://').nullable().optional().or(z.literal('')),
}).refine(b => b.start < b.end, { message: 'The end time must be after the start time.', path: ['end'] });
export const calendarSchema = z.object({
  startDate: isoDate,
  classDays: z.array(z.number().int().min(1).max(7)).min(1, 'Pick at least one class day.').max(7),
  blocks: z.array(blockSchema).min(1, 'Add at least one block.').max(4),
  holidays: z.array(isoDate).max(120).default([]),
  halfDay: z.number().int().min(1).max(7).nullable().optional().default(null),
}).refine(c => new Set(c.blocks.map(b => b.key)).size === c.blocks.length, { message: 'Each block needs its own key.', path: ['blocks'] });
export type Calendar = z.infer<typeof calendarSchema>;
export type Block = Calendar['blocks'][number];

/** The SLN plan: Monday–Saturday classes, Session 10:00–12:00 and Lab 12:30–13:30, Sunday half day. */
export const defaultCalendar = (startDate: string): Calendar => ({
  startDate, classDays: [1, 2, 3, 4, 5, 6], holidays: [], halfDay: 7,
  blocks: [
    { key: 'session', label: 'Session', start: '10:00', end: '12:00', mode: 'offline', venue: '', link: null },
    { key: 'lab', label: 'Lab', start: '12:30', end: '13:30', mode: 'offline', venue: '', link: null },
  ],
});

export const isoOf = (t: number) => new Date(t + IST).toISOString().slice(0, 10);
const midnight = (iso: string) => Date.parse(`${iso}T00:00:00Z`) - IST; // IST midnight as an instant
export const weekdayOf = (iso: string) => ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
const at = (iso: string, time: string) => midnight(iso) + (Number(time.slice(0, 2)) * 60 + Number(time.slice(3))) * 60_000;
const label12 = (time: string) => { const h = Number(time.slice(0, 2)); return `${h % 12 || 12}:${time.slice(3)} ${h < 12 ? 'AM' : 'PM'}`; };
const dateLabel = (iso: string) => `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

export type DayKind = 'class' | 'halfday' | 'holiday' | 'off' | 'before';
export function dayKind(cal: Calendar, iso: string): DayKind {
  if (iso < cal.startDate) return 'before';
  const wd = weekdayOf(iso);
  if (cal.halfDay === wd) return 'halfday';
  if (!cal.classDays.includes(wd)) return 'off';
  if (cal.holidays.includes(iso)) return 'holiday';
  return 'class';
}

/** 0-based number of the class date from the start (AC-2): the course day it teaches. null when it is not a class date. */
export function classIndex(cal: Calendar, iso: string): number | null {
  if (dayKind(cal, iso) !== 'class') return null;
  let k = 0;
  for (let t = midnight(cal.startDate); isoOf(t) < iso; t += DAY) if (dayKind(cal, isoOf(t)) === 'class') k++;
  return k;
}

/* ---------- the learner's week ---------- */
export type CourseDay = { levelCode: string; day: number; title: string; state: string; contentId: string }; // state: done | skipped | open
export type Material = { id: string; title: string; kind: string; opened: boolean; studied: boolean; practised: boolean };
export type Mark = { status: 'present' | 'absent' | 'excused'; source: 'learner' | 'mentor' };

export function cohortWeek(p: {
  now: Date; calendar: Calendar; courseDays: CourseDay[];
  materials: Map<string, Material[]>;          // by contentId
  attendance: Map<string, Mark>;               // by `${iso}:${blockKey}`
  peers?: Map<string, { done: number; total: number }>; // by `${levelCode}:${day}`
  sessions?: Session[]; hackathons?: HackathonDates[];
}) {
  const now = p.now.getTime();
  const start = weekStart(p.now);
  const today = isoOf(now);
  // One-off sessions and hackathons (AC-9) reuse the v1.0 placement.
  const extras = weekPlan({ now: p.now, sessions: p.sessions ?? [], hackathons: p.hackathons ?? [], studyDays: [] }).days.map(d => d.items as WeekItem[]);
  const days = NAMES.map((name, i) => {
    const iso = isoOf(start + i * DAY);
    const kind = dayKind(p.calendar, iso);
    const k = classIndex(p.calendar, iso);
    const cd = k !== null ? p.courseDays[k] ?? null : null;
    const past = iso < today;
    const blocks = kind === 'class' ? p.calendar.blocks.map(b => {
      const s = at(iso, b.start), e = at(iso, b.end);
      const status = now > e ? 'ended' as const : now >= s - 15 * 60_000 ? 'live' as const : 'upcoming' as const;
      const mark = p.attendance.get(`${iso}:${b.key}`) ?? null;
      const link = b.mode === 'online' && b.link && /^https:\/\//.test(b.link) ? b.link : null;
      return {
        key: b.key, label: b.label, time: `${label12(b.start)} – ${label12(b.end)}`, mode: b.mode, venue: b.venue || '',
        join: status === 'live' ? link : null, status, mark,
        // AC-7: from 15 min before the start until the end of the next day; never over a mentor's mark.
        canCheckIn: mark?.source !== 'mentor' && mark?.status !== 'present' && checkInOpen(p.calendar, iso, b.key, p.now),
      };
    }) : [];
    const done = !!cd && (cd.state === 'done' || cd.state === 'skipped');
    const state = kind !== 'class' || !cd ? null : done ? 'done' as const : iso < today ? 'missed' as const : iso === today ? 'today' as const : 'upcoming' as const;
    const peer = cd ? p.peers?.get(`${cd.levelCode}:${cd.day}`) : undefined;
    return {
      iso, name, date: dateLabel(iso), isToday: iso === today, past, kind, state, blocks,
      course: cd ? { levelCode: cd.levelCode, day: cd.day, title: cd.title, href: `/levels/${cd.levelCode}/days/${cd.day}` } : null,
      materials: cd ? p.materials.get(cd.contentId) ?? [] : [],
      // AC-8: counts only, only when at least half of a cohort of 5+ did it.
      peer: peer && peer.total >= 5 && peer.done / peer.total >= 0.5 ? peer : null,
      extras: extras[i],
    };
  });
  const classDays = days.filter(d => d.kind === 'class' && d.course);
  const doneCount = classDays.filter(d => d.state === 'done').length;
  const missed = classDays.find(d => d.state === 'missed');
  const todayDay = classDays.find(d => d.state === 'today');
  const upcoming = classDays.find(d => d.state === 'upcoming');
  // AC-6: one next step — the earliest missed day, else today's, else the next class.
  const next = missed ? { why: 'catchup' as const, d: missed } : todayDay ? { why: 'today' as const, d: todayDay } : upcoming ? { why: 'next' as const, d: upcoming } : null;
  const held = days.flatMap(d => d.blocks).filter(b => b.status !== 'upcoming');
  return {
    range: `${days[0].date} – ${days[6].date}`,
    days,
    progress: { done: doneCount, total: classDays.length, pct: classDays.length ? Math.round((doneCount / classDays.length) * 100) : 0 },
    attendance: { attended: held.filter(b => b.mark?.status === 'present').length, held: held.length },
    next: next ? { why: next.why, iso: next.d.iso, title: next.d.course!.title, day: next.d.course!.day, href: next.d.course!.href, materials: next.d.materials.length } : null,
  };
}
export type CohortWeekView = ReturnType<typeof cohortWeek>;

/** AC-7, the one rule the server and the week view share: a learner may check in to a block of a class date from 15 minutes before it starts until the end of the next day. */
export function checkInOpen(cal: Calendar, iso: string, blockKey: string, now: Date): boolean {
  const b = cal.blocks.find(x => x.key === blockKey);
  if (!b || dayKind(cal, iso) !== 'class') return false;
  const t = now.getTime();
  return t >= at(iso, b.start) - 15 * 60_000 && t < midnight(iso) + 2 * DAY;
}

/** Monday..Sunday ISO dates of the week containing `now` (IST). */
export const weekDates = (now: Date) => { const s = weekStart(now); return NAMES.map((_, i) => isoOf(s + i * DAY)); };
