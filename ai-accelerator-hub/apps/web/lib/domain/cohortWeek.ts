/**
 * Cohort calendar, attendance and the learner's week: data and rules with the database (docs/COHORT_WEEK_SPEC.md).
 * Pure rules live in cohortCalendar.ts.
 */
import { prisma } from '@/lib/prisma';
import { hasPerm, type Ctx } from '@/lib/server/context';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';
import { zodFieldErrors } from '@/lib/server/http';
import { calendarSchema, checkInOpen, classIndex, cohortWeek, dayKind, weekDates, type Calendar, type CourseDay, type Mark, type Material } from './cohortCalendar';
import { thisWeek } from './weekPlan';

const parseSchedule = (raw: string | null) => { try { return raw ? JSON.parse(raw) as Record<string, unknown> : {}; } catch { return {}; } };
export function calendarOf(raw: string | null): Calendar | null {
  const c = parseSchedule(raw).calendar;
  const r = calendarSchema.safeParse(c);
  return r.success ? r.data : null;
}

/** Mentors, instructors, program managers and admins; never an outside reviewer (review:decide without cohort:read). */
export const canMarkAttendance = (ctx: Ctx) => hasPerm(ctx, 'cohort:manage') || (hasPerm(ctx, 'review:decide') && hasPerm(ctx, 'cohort:read'));

/** Every day of the course in order (levels, then days), with this enrollment's state. */
export async function courseDaysFor(tenantId: string, journeyId: string, enrollmentId: string | null): Promise<CourseDay[]> {
  const levels = await prisma.level.findMany({ where: { tenantId, journeyId }, orderBy: { idx: 'asc' }, select: { id: true, code: true, contents: { where: { kind: 'md' }, orderBy: { position: 'asc' }, select: { id: true, position: true, title: true } } } });
  const rows = enrollmentId ? await prisma.dayProgress.findMany({ where: { enrollmentId }, select: { levelId: true, day: true, state: true } }) : [];
  const st = new Map(rows.map(r => [`${r.levelId}:${r.day}`, r.state]));
  return levels.flatMap(l => l.contents.map(c => ({ levelCode: l.code, day: c.position, title: c.title ?? `Day ${c.position}`, state: st.get(`${l.id}:${c.position}`) ?? 'open', contentId: c.id })));
}

/* ---------- admin ---------- */
export async function saveCalendar(ctx: Ctx, cohortId: string, raw: unknown) {
  if (!hasPerm(ctx, 'cohort:manage')) throw forbidden();
  const c = await prisma.cohort.findFirst({ where: { id: cohortId, tenantId: ctx.tenantId } });
  if (!c) throw notFound('Cohort not found.');
  const r = calendarSchema.safeParse(raw);
  if (!r.success) throw badRequest('The calendar needs a few fixes.', zodFieldErrors(r.error));
  const sched = { ...parseSchedule(c.schedule), calendar: { ...r.data, holidays: [...new Set(r.data.holidays)].sort(), classDays: [...new Set(r.data.classDays)].sort() } };
  await prisma.$transaction(async tx => {
    await tx.cohort.update({ where: { id: c.id }, data: { schedule: JSON.stringify(sched), startDate: new Date(`${r.data.startDate}T00:00:00+05:30`) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'cohort.calendar_saved', resourceType: 'Cohort', resourceId: c.id, after: sched.calendar });
  });
  return { ok: true as const, calendar: sched.calendar };
}

/** The course most learners of this cohort follow (a cohort has no course of its own). */
async function cohortJourney(tenantId: string, cohortId: string) {
  const g = await prisma.enrollment.groupBy({ by: ['journeyId'], where: { tenantId, cohortId, state: { in: ['active', 'completed'] } }, _count: { _all: true }, orderBy: { _count: { journeyId: 'desc' } }, take: 1 });
  return g[0]?.journeyId ?? null;
}

/** The cohort week board (AC-3): learners × class dates of the week, day done and attendance per block. */
export async function cohortBoard(ctx: Ctx, cohortId: string, weekOf?: string) {
  if (!canMarkAttendance(ctx) && !hasPerm(ctx, 'cohort:read')) throw forbidden();
  const c = await prisma.cohort.findFirst({ where: { id: cohortId, tenantId: ctx.tenantId }, select: { id: true, name: true, schedule: true } });
  if (!c) throw notFound('Cohort not found.');
  const calendar = calendarOf(c.schedule);
  const now = weekOf && /^\d{4}-\d{2}-\d{2}$/.test(weekOf) ? new Date(`${weekOf}T06:30:00Z`) : new Date();
  const dates = weekDates(now);
  const journeyId = await cohortJourney(ctx.tenantId, c.id);
  const days = journeyId ? await courseDaysFor(ctx.tenantId, journeyId, null) : [];
  const cols = calendar ? dates.map(iso => { const k = classIndex(calendar, iso); return { iso, kind: dayKind(calendar, iso), course: k !== null ? days[k] ?? null : null }; }) : [];
  const enrollments = await prisma.enrollment.findMany({ where: { tenantId: ctx.tenantId, cohortId: c.id, state: { in: ['active', 'completed'] } }, select: { id: true, userId: true, user: { select: { name: true } } }, orderBy: { user: { name: 'asc' } } });
  const levelIds = new Map((journeyId ? await prisma.level.findMany({ where: { journeyId }, select: { id: true, code: true } }) : []).map(l => [l.id, l.code]));
  const [progress, marks] = await Promise.all([
    prisma.dayProgress.findMany({ where: { enrollmentId: { in: enrollments.map(e => e.id) } }, select: { enrollmentId: true, levelId: true, day: true, state: true } }),
    prisma.sessionAttendance.findMany({ where: { tenantId: ctx.tenantId, cohortId: c.id, date: { in: dates } } }),
  ]);
  const done = new Set(progress.filter(p => p.state === 'done' || p.state === 'skipped').map(p => `${p.enrollmentId}:${levelIds.get(p.levelId)}:${p.day}`));
  const markBy = new Map(marks.map(m => [`${m.userId}:${m.date}:${m.block}`, { status: m.status, source: m.source }]));
  return {
    cohort: { id: c.id, name: c.name }, calendar, dates, cols, canMark: canMarkAttendance(ctx),
    learners: enrollments.map(e => ({
      userId: e.userId, name: e.user.name || 'Learner',
      cells: cols.map(col => ({ iso: col.iso, done: col.course ? done.has(`${e.id}:${col.course.levelCode}:${col.course.day}`) : null, marks: calendar && col.kind === 'class' ? Object.fromEntries(calendar.blocks.map(b => [b.key, markBy.get(`${e.userId}:${col.iso}:${b.key}`) ?? null])) : {} })),
    })),
  };
}

export async function mentorMark(ctx: Ctx, cohortId: string, p: { userId: string; date: string; block: string; status: 'present' | 'absent' | 'excused' | 'clear' }) {
  if (!canMarkAttendance(ctx)) throw forbidden();
  const c = await prisma.cohort.findFirst({ where: { id: cohortId, tenantId: ctx.tenantId }, select: { id: true, schedule: true } });
  if (!c) throw notFound('Cohort not found.');
  const cal = calendarOf(c.schedule);
  if (!cal || dayKind(cal, p.date) !== 'class' || !cal.blocks.some(b => b.key === p.block)) throw badRequest('That is not a class block of this cohort.');
  if (p.date > new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10)) throw badRequest('Attendance cannot be marked for a future date.');
  const member = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, cohortId: c.id, userId: p.userId }, select: { id: true } });
  if (!member) throw notFound('This learner is not in the cohort.');
  const key = { cohortId_userId_date_block: { cohortId: c.id, userId: p.userId, date: p.date, block: p.block } };
  await prisma.$transaction(async tx => {
    if (p.status === 'clear') await tx.sessionAttendance.deleteMany({ where: { cohortId: c.id, userId: p.userId, date: p.date, block: p.block } });
    else await tx.sessionAttendance.upsert({ where: key, update: { status: p.status, source: 'mentor', markedById: ctx.userId, markedAt: new Date() }, create: { tenantId: ctx.tenantId, cohortId: c.id, userId: p.userId, date: p.date, block: p.block, status: p.status, source: 'mentor', markedById: ctx.userId } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'attendance.marked', resourceType: 'Cohort', resourceId: c.id, after: p });
  });
  return { ok: true as const };
}

/* ---------- learner ---------- */
async function myCohort(ctx: Ctx) {
  const e = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: { in: ['active', 'completed'] } }, orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }], select: { id: true, journeyId: true, cohortId: true, cohort: { select: { id: true, schedule: true } } } });
  return e;
}

export async function learnerCheckIn(ctx: Ctx, p: { date: string; block: string }) {
  const e = await myCohort(ctx);
  const cal = e?.cohort ? calendarOf(e.cohort.schedule) : null;
  if (!e?.cohort || !cal) throw badRequest('Your cohort has no class calendar yet.');
  if (!checkInOpen(cal, p.date, p.block, new Date())) throw badRequest('Check-in opens 15 minutes before the class and closes at the end of the next day.');
  const key = { cohortId_userId_date_block: { cohortId: e.cohort.id, userId: ctx.userId, date: p.date, block: p.block } };
  const cur = await prisma.sessionAttendance.findUnique({ where: key });
  if (cur?.source === 'mentor') throw badRequest('Your mentor already marked this class. Ask them if it needs a change.');
  await prisma.sessionAttendance.upsert({ where: key, update: { status: 'present', source: 'learner', markedById: ctx.userId, markedAt: new Date() }, create: { tenantId: ctx.tenantId, cohortId: e.cohort.id, userId: ctx.userId, date: p.date, block: p.block, status: 'present', source: 'learner', markedById: ctx.userId } });
  return { ok: true as const };
}

/** Mission Control "This week": the cohort calendar view, or the v1.0 view when the cohort has no calendar (AC-9). */
export async function learnerWeek(ctx: Ctx, current: { id: string; code: string }) {
  const e = await myCohort(ctx);
  const cal = e?.cohort ? calendarOf(e.cohort.schedule) : null;
  if (!e || !e.cohort || !cal) { const w = await thisWeek(ctx, current); return w ? { kind: 'plan' as const, w } : null; }
  const sched = parseSchedule(e.cohort.schedule) as { sessions?: { title: string; startsAt: string }[] };
  const now = new Date();
  const dates = weekDates(now);
  const courseDays = await courseDaysFor(ctx.tenantId, e.journeyId, e.id);
  const week = dates.map(iso => { const k = classIndex(cal, iso); return k !== null ? courseDays[k] ?? null : null; }).filter((x): x is CourseDay => !!x);
  const cohortEnrollments = await prisma.enrollment.findMany({ where: { tenantId: ctx.tenantId, cohortId: e.cohort.id, state: { in: ['active', 'completed'] } }, select: { id: true } });
  const levelIds = new Map((await prisma.level.findMany({ where: { tenantId: ctx.tenantId, journeyId: e.journeyId }, select: { id: true, code: true } })).map(l => [l.code, l.id]));
  const [mats, marks, peerRows, hackathons] = await Promise.all([
    prisma.dayMaterial.findMany({ where: { tenantId: ctx.tenantId, contentId: { in: week.map(w => w.contentId) } }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], select: { id: true, contentId: true, title: true, kind: true, progress: { where: { userId: ctx.userId }, select: { openedAt: true, studiedAt: true, practisedAt: true } } } }),
    prisma.sessionAttendance.findMany({ where: { cohortId: e.cohort.id, userId: ctx.userId, date: { in: dates } } }),
    week.length ? prisma.dayProgress.groupBy({ by: ['levelId', 'day'], where: { enrollmentId: { in: cohortEnrollments.map(x => x.id) }, state: 'done', OR: week.map(w => ({ levelId: levelIds.get(w.levelCode) ?? '-', day: w.day })) }, _count: { _all: true } }) : Promise.resolve([]),
    prisma.hackathon.findMany({ where: { tenantId: ctx.tenantId, status: { not: 'draft' }, OR: [{ cohortId: e.cohort.id }, { cohortId: null }] }, select: { title: true, buildStartAt: true, submitDueAt: true } }),
  ]);
  const materials = new Map<string, Material[]>();
  for (const m of mats) materials.set(m.contentId, [...(materials.get(m.contentId) ?? []), { id: m.id, title: m.title, kind: m.kind, opened: !!m.progress[0]?.openedAt, studied: !!m.progress[0]?.studiedAt, practised: !!m.progress[0]?.practisedAt }]);
  const codeOf = new Map([...levelIds].map(([code, id]) => [id, code]));
  const peers = new Map(peerRows.map(r => [`${codeOf.get(r.levelId)}:${r.day}`, { done: r._count._all, total: cohortEnrollments.length }]));
  return {
    kind: 'cohort' as const,
    w: cohortWeek({ now, calendar: cal, courseDays, materials, attendance: new Map(marks.map(m => [`${m.date}:${m.block}`, { status: m.status, source: m.source } as Mark])), peers, sessions: Array.isArray(sched.sessions) ? sched.sessions : [], hackathons }),
  };
}
