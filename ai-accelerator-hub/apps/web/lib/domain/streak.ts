/**
 * Non-punitive streaks (gamification model §7.2), computed on IST calendar days, server-side only.
 * - One increment per IST day, only on a qualifying action (not logins).
 * - Missed days are covered by freeze tokens first; one uncovered day is forgiven (48 h grace).
 * - Longer breaks never zero the streak silently: it is parked for 7 days and a short
 *   recovery quest restores it in full.
 * - Every 7-day milestone earns a freeze token (max 7).
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { notify } from '@/lib/server/audit';

type Tx = PrismaClient | Prisma.TransactionClient;
export const istDay = (t = Date.now()) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10);
export const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400e3);
const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86400e3).toISOString().slice(0, 10);

export type StreakStatus = 'active' | 'frozen' | 'grace' | 'recovery' | 'new';

export async function touchStreak(tx: Tx, tenantId: string, userId: string, today = istDay()) {
  const s = await tx.streak.upsert({ where: { tenantId_userId: { tenantId, userId } }, update: {}, create: { tenantId, userId } });
  if (s.lastActiveDate === today) return { changed: false, current: s.currentStreak };
  let { currentStreak: cur, longestStreak: longest, freezeTokens: freezes, prevStreak, status, recoveryUntil } = s;
  let event = 'active';
  if (!s.lastActiveDate || cur === 0) { cur = 1; status = 'active'; }
  else {
    const missed = dayDiff(s.lastActiveDate, today) - 1;
    if (missed <= 0) { cur += 1; status = 'active'; }
    else if (freezes >= missed) { freezes -= missed; cur += 1; status = 'active'; event = 'freeze_used'; }
    else if (missed - freezes === 1) { freezes = 0; cur += 1; status = 'active'; event = 'grace'; }
    else { prevStreak = cur; cur = 1; status = 'recovery'; recoveryUntil = addDays(today, 7); event = 'recoverable'; }
  }
  longest = Math.max(longest, cur, status === 'recovery' ? prevStreak : 0);
  let earnedFreeze = false;
  if (status === 'active' && cur % 7 === 0 && freezes < 7) { freezes += 1; earnedFreeze = true; }
  await tx.streak.update({ where: { id: s.id }, data: { currentStreak: cur, longestStreak: longest, freezeTokens: freezes, lastActiveDate: today, status, prevStreak, recoveryUntil, graceUntil: null } });
  await tx.streakEvent.create({ data: { tenantId, userId, date: today, type: event } });
  if (event === 'freeze_used') await notify(tx, tenantId, userId, 'streak_frozen', { title: 'A freeze token saved your streak', body: `You're on ${cur} days.`, tone: 'info' });
  if (event === 'recoverable') {
    // Child safety policy §10.3: no countdowns or warning tone for under-18s (no pressure nudges).
    const st = await tx.userSetting.findUnique({ where: { tenantId_userId: { tenantId, userId } }, select: { ageBand: true } });
    if (st && st.ageBand !== 'adult') await notify(tx, tenantId, userId, 'streak_welcome_back', { title: 'Welcome back!', body: `Your best run of ${prevStreak} days is saved. A quick win brings it back whenever you are ready.`, href: '/dashboard', tone: 'info' });
    else await notify(tx, tenantId, userId, 'streak_recovery_available', { title: `Your ${prevStreak}-day streak is paused, not lost`, body: 'Finish a 2-minute quick win within 7 days to restore it.', href: '/dashboard', tone: 'warn' });
  }
  if (earnedFreeze) await notify(tx, tenantId, userId, 'streak_freeze_earned', { title: `${cur}-day streak — freeze token earned`, tone: 'ok' });
  return { changed: true, current: cur, event };
}

/** Read-side view: tells the learner what state they're in right now, without mutating anything. */
export function streakView(s: { currentStreak: number; longestStreak: number; freezeTokens: number; lastActiveDate: string | null; status: string; prevStreak: number; recoveryUntil: string | null } | null, today = istDay()) {
  if (!s || !s.lastActiveDate) return { status: 'new' as StreakStatus, current: 0, longest: 0, freezes: s?.freezeTokens ?? 1, message: 'Finish any activity to start your streak.' };
  const gap = dayDiff(s.lastActiveDate, today);
  if (s.status === 'recovery' && s.recoveryUntil && s.recoveryUntil >= today) return { status: 'recovery' as StreakStatus, current: s.currentStreak, longest: s.longestStreak, freezes: s.freezeTokens, prev: s.prevStreak, until: s.recoveryUntil, message: `Your ${s.prevStreak}-day streak is paused. A 2-minute quick win restores it.` };
  if (gap <= 1) return { status: 'active' as StreakStatus, current: s.currentStreak, longest: s.longestStreak, freezes: s.freezeTokens, message: gap === 0 ? 'Today counts. Nice.' : 'Finish an activity today to keep it going.' };
  if (gap - 1 <= s.freezeTokens) return { status: 'frozen' as StreakStatus, current: s.currentStreak, longest: s.longestStreak, freezes: s.freezeTokens, message: 'A freeze token is covering the missed day.' };
  if (gap - 1 - s.freezeTokens === 1) return { status: 'grace' as StreakStatus, current: s.currentStreak, longest: s.longestStreak, freezes: s.freezeTokens, message: 'At risk — finish any activity today (IST) to keep it.' };
  return { status: 'recovery' as StreakStatus, current: s.currentStreak, longest: s.longestStreak, freezes: s.freezeTokens, prev: s.currentStreak, message: 'Your streak is paused, not lost. Start again and recover it with a quick win.' };
}

export const RECOVERY_QUIZ = { q: 'Which task should stay with rules-based software rather than generative AI?', options: ['Writing a friendly welcome message', 'Checking a password has at least 8 characters', 'Brainstorming product names'], answer: 1 };

export async function recoverStreak(tx: Tx, tenantId: string, userId: string, answer: number, today = istDay()) {
  const s = await tx.streak.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
  if (!s || s.status !== 'recovery' || !s.recoveryUntil || s.recoveryUntil < today) return { ok: false as const, reason: 'nothing_to_recover' as const };
  if (answer !== RECOVERY_QUIZ.answer) return { ok: false as const, reason: 'wrong_answer' as const };
  const restored = s.prevStreak + s.currentStreak;
  await tx.streak.update({ where: { id: s.id }, data: { currentStreak: restored, longestStreak: Math.max(s.longestStreak, restored), status: 'active', prevStreak: 0, recoveryUntil: null, lastActiveDate: today } });
  await tx.streakEvent.create({ data: { tenantId, userId, date: today, type: 'recovery' } });
  return { ok: true as const, current: restored };
}
