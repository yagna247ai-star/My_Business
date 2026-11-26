/** Mission Control "This week" (docs/THIS_WEEK_SPEC.md). Pure: everything is passed in, including "now". IST, Monday first. */
export type Session = { title: string; kind?: string; startsAt: string; durationMin?: number; liveLink?: string | null; recordingUrl?: string | null };
export type HackathonDates = { title: string; buildStartAt?: string | Date | null; submitDueAt?: string | Date | null };
export type StudyDay = { day: number; title: string; state: string; href: string; materials: number };
export type WeekItem =
  | { kind: 'live'; title: string; sessionKind: string; time: string; status: 'upcoming' | 'live' | 'ended'; href: string | null; cta: 'Join' | 'Watch recording' | null }
  | { kind: 'hackathon'; title: string; time: string }
  | { kind: 'study'; title: string; day: number; href: string; materials: number };

const IST = 330 * 60_000;
const DAY = 86_400_000;
const NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Midnight IST (as a UTC instant) of the Monday of the week containing `now`. */
export function weekStart(now: Date): number {
  const local = now.getTime() + IST;
  const midnight = local - (local % DAY);
  const dow = (new Date(midnight).getUTCDay() + 6) % 7; // 0 = Monday
  return midnight - dow * DAY - IST;
}
const istParts = (t: number) => { const d = new Date(t + IST); return { day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], h: d.getUTCHours(), m: d.getUTCMinutes() }; };
const clock = (t: number) => { const { h, m } = istParts(t); const h12 = h % 12 || 12; return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const date = (t: number) => { const p = istParts(t); return `${p.day} ${p.month}`; };

export function weekPlan(p: { now: Date; sessions: Session[]; hackathons: HackathonDates[]; studyDays: StudyDay[]; weekly?: Record<string, string> | null }) {
  const now = p.now.getTime();
  const start = weekStart(p.now);
  const end = start + 7 * DAY;
  const todayIdx = Math.floor((now - start) / DAY);
  const days = NAMES.map((name, i) => ({ name, date: date(start + i * DAY), isToday: i === todayIdx, past: i < todayIdx, items: [] as WeekItem[] }));
  const slot = (t: number) => Math.floor((t - start) / DAY);

  const sessions = p.sessions.filter(s => !Number.isNaN(Date.parse(s.startsAt))).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  for (const s of sessions) {
    const t = Date.parse(s.startsAt);
    if (t < start || t >= end) continue;
    const finish = t + (s.durationMin ?? 60) * 60_000;
    const status = now > finish ? 'ended' : now >= t - 15 * 60_000 ? 'live' : 'upcoming';
    const link = s.liveLink && /^https:\/\//.test(s.liveLink) ? s.liveLink : null;
    const rec = s.recordingUrl && /^https:\/\//.test(s.recordingUrl) ? s.recordingUrl : null;
    const [href, cta] = status === 'live' && link ? [link, 'Join' as const] : status === 'ended' && rec ? [rec, 'Watch recording' as const] : [null, null];
    days[slot(t)].items.push({ kind: 'live', title: s.title, sessionKind: (s.kind || 'workshop').replace('_', ' '), time: `${clock(t)} IST`, status, href, cta });
  }
  for (const h of p.hackathons) {
    for (const [at, label] of [[h.buildStartAt, 'Hackathon build starts'], [h.submitDueAt, 'Hackathon submissions due']] as const) {
      const t = at ? new Date(at).getTime() : NaN;
      if (Number.isNaN(t) || t < start || t >= end) continue;
      days[slot(t)].items.push({ kind: 'hackathon', title: `${label}: ${h.title}`, time: `${clock(t)} IST` });
    }
  }
  // Study plan: next unfinished days, one per weekday from today (AC-5).
  const todo = p.studyDays.filter(d => d.state !== 'done' && d.state !== 'skipped').sort((a, b) => a.day - b.day);
  let k = 0;
  for (let i = Math.max(0, todayIdx); i < 5 && k < todo.length; i++) {
    const d = todo[k++];
    days[i].items.push({ kind: 'study', title: d.title, day: d.day, href: d.href, materials: d.materials });
  }
  const inWeek = days.flatMap(d => d.items);
  const live = inWeek.filter(i => i.kind === 'live').length;
  const study = inWeek.filter((i): i is Extract<WeekItem, { kind: 'study' }> => i.kind === 'study');
  const nextLive = live ? null : sessions.find(s => Date.parse(s.startsAt) >= end) ?? null;
  return {
    range: `${days[0].date} – ${days[6].date}`,
    days,
    summary: { live, study: study.length, materials: study.reduce((n, s) => n + s.materials, 0) },
    nextLive: nextLive ? { title: nextLive.title, when: `${NAMES[(new Date(Date.parse(nextLive.startsAt) + IST).getUTCDay() + 6) % 7]} ${date(Date.parse(nextLive.startsAt))}, ${clock(Date.parse(nextLive.startsAt))} IST` } : null,
    rhythm: !sessions.length && p.weekly ? Object.values(p.weekly).join(' · ') : null,
  };
}
