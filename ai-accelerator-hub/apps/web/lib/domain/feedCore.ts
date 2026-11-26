/** Pure rules of the community feed (docs/FEED_ENGAGEMENT_SPEC.md). No database: unit-tested directly. */

/* ---------- AC-2: stable paging by (time, id) ---------- */
export const encodeCursor = (at: Date, id: string) => `${at.toISOString()}|${id}`;
export function decodeCursor(raw: string | null | undefined): { at: Date; id: string | null } | null {
  if (!raw) return null;
  const [iso, id] = raw.split('|');
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return { at, id: id && /^[\w-]{1,40}$/.test(id) ? id : null };
}
/** Posts strictly after the cursor in (createdAt desc, id desc) order. An old time-only cursor still works. */
export function afterCursor(c: { at: Date; id: string | null } | null) {
  if (!c) return {};
  return c.id ? { OR: [{ createdAt: { lt: c.at } }, { createdAt: c.at, id: { lt: c.id } }] } : { createdAt: { lt: c.at } };
}

/* ---------- AC-1: the same text twice within 10 minutes ---------- */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
export function isDuplicate(recent: { body: string; createdAt: Date }[], body: string, now = new Date()) {
  const b = norm(body);
  return recent.some(r => now.getTime() - r.createdAt.getTime() < 10 * 60_000 && norm(r.body) === b);
}

/* ---------- AC-8: tabs ---------- */
export const TABS = ['all', 'questions', 'unanswered', 'wins', 'mine'] as const;
export type Tab = (typeof TABS)[number];
export const asTab = (t: string | null | undefined): Tab => (TABS as readonly string[]).includes(t ?? '') ? t as Tab : 'all';
export function tabWhere(tab: Tab, userId: string) {
  switch (tab) {
    case 'questions': return { kind: 'question' };
    case 'unanswered': return { kind: 'question', acceptedCommentId: null, comments: { none: { state: 'visible', authorId: { not: userId } } } };
    case 'wins': return { kind: 'win' };
    case 'mine': return { authorId: userId };
    default: return {};
  }
}

/* ---------- AC-10 / AC-11: prompts ---------- */
export function dayPrompt(d: { levelCode: string; levelIdx: number; day: number; title: string } | null) {
  if (!d) return null;
  return {
    title: `Level ${d.levelIdx} · Day ${d.day} · ${d.title}`,
    ask: `Working on Day ${d.day} (${d.title})? Share what worked, or ask what is blocking you.`,
    levelCode: d.levelCode, day: d.day,
  };
}
export function winCard(levels: { idx: number; code: string; title: string; state: string }[], wonCodes: Set<string>, earnedTitle: (l: { idx: number; code: string; title: string }) => string) {
  const approved = levels.filter(l => l.state === 'approved').sort((a, b) => b.idx - a.idx);
  const l = approved.find(x => !wonCodes.has(x.code));
  if (!l) return null;
  const t = earnedTitle(l);
  return { levelCode: l.code, text: `I finished Level ${l.idx} and earned the title ${t}! The part I am proudest of: …`, title: `Level ${l.idx} · ${t}` };
}

/* ---------- AC-14: this week's engagement ---------- */
export function engagement(p: {
  posts: { id: string; authorId: string; kind: string; createdAt: Date; acceptedCommentId: string | null }[];
  replies: { postId: string; authorId: string; createdAt: Date }[];
}) {
  const authorOf = new Map(p.posts.map(x => [x.id, x.authorId]));
  const posters = new Set([...p.posts.map(x => x.authorId), ...p.replies.map(r => r.authorId)]);
  const questions = p.posts.filter(x => x.kind === 'question');
  const firstReply = new Map<string, number>();
  for (const r of p.replies) {
    if (r.authorId === authorOf.get(r.postId)) continue; // the asker's own reply is not an answer
    const t = r.createdAt.getTime();
    if (!firstReply.has(r.postId) || t < firstReply.get(r.postId)!) firstReply.set(r.postId, t);
  }
  const answered = questions.filter(q => q.acceptedCommentId || firstReply.has(q.id));
  const waits = questions.filter(q => firstReply.has(q.id)).map(q => (firstReply.get(q.id)! - q.createdAt.getTime()) / 60_000).sort((a, b) => a - b);
  const median = waits.length ? (waits.length % 2 ? waits[(waits.length - 1) / 2] : (waits[waits.length / 2 - 1] + waits[waits.length / 2]) / 2) : null;
  return {
    activePosters: posters.size, posts: p.posts.length, replies: p.replies.length, questions: questions.length,
    answeredPct: questions.length ? Math.round((answered.length / questions.length) * 100) : null,
    medianFirstReplyMin: median === null ? null : Math.round(median),
  };
}
