/**
 * Free progression (pure rules, no database).
 *
 * A level is complete when every activity and every day page is either done or skipped. The Boss counts as done
 * once it has been attempted. Review never blocks: it still scores the proof and awards its points, but the next
 * level opens as soon as the learner has finished or skipped everything. Skipped work earns no points and can be
 * finished later for its points.
 */
import { parseMarkdown } from './lessonMarkdown';

export const DAY_XP = 10;

export type ActivityLike = { idx: number; state: string | null | undefined };
export type DayLike = { state: string | null | undefined };

export const finished = (state: string | null | undefined) => state === 'completed' || state === 'skipped';

export function activityFinished(a: ActivityLike, bossAttempts: number): boolean {
  return finished(a.state) || (a.idx === 6 && bossAttempts > 0);
}

export function levelComplete(x: { activities: ActivityLike[]; bossAttempts: number; days: DayLike[] }): boolean {
  return x.activities.length > 0
    && x.activities.every(a => activityFinished(a, x.bossAttempts))
    && x.days.every(d => d.state === 'done' || d.state === 'skipped');
}

/** Points available in a level: its activities plus every day page. */
export const levelPoints = (activityXp: number, dayCount: number) => activityXp + dayCount * DAY_XP;

/** The message the learner sees when they move on. */
export function moveOnMessage(earned: number, total: number, nextTitle: string | null): string {
  const all = earned >= total;
  const head = `You earned ${earned} of ${total} points in this level.`;
  const rest = all ? '' : ' Skipped steps earned no points; you can go back and finish them any time to add their points.';
  return nextTitle ? `${head} ${nextTitle} is open.${rest}` : `${head} You have finished the journey.${rest}`;
}

/** The steps a learner ticks on a day page: the numbered list under "Steps" (domain journeys) or "Your turn" (generic). */
export function dayStepsFrom(body: string): string[] {
  const blocks = parseMarkdown(body);
  const h = blocks.findIndex(b => b.type === 'h' && /^(steps|your turn)\b/i.test(b.text));
  const from = h >= 0 ? blocks.slice(h + 1) : blocks;
  for (const b of from) {
    if (b.type === 'h' && h >= 0) break;
    if (b.type === 'ol') return b.items.slice(0, 20);
  }
  return h >= 0 ? [] : [];
}
