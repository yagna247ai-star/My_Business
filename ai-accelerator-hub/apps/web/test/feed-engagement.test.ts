// docs/FEED_ENGAGEMENT_SPEC.md (pure rules and wiring; the database flows are in test/platform.test.ts)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { afterCursor, asTab, dayPrompt, decodeCursor, encodeCursor, engagement, isDuplicate, tabWhere, winCard } from '@/lib/domain/feedCore';

const root = join(__dirname, '..');
const r = (f: string) => readFileSync(join(root, f), 'utf8');
const T = (iso: string) => new Date(iso);

describe('production fixes', () => {
  it('AC-1: rate limits on every write, and the same text twice in 10 minutes is a duplicate', () => {
    expect(r('app/api/v1/feed/route.ts')).toMatch(/name: 'feed-post', max: 8, windowMs: 10 \* 60_000/);
    expect(r('app/api/v1/feed/[postId]/comments/route.ts')).toMatch(/name: 'feed-reply', max: 30/);
    expect(r('app/api/v1/feed/[postId]/react/route.ts')).toMatch(/name: 'feed-react', max: 90/);
    expect(r('app/api/v1/feed/[postId]/report/route.ts')).toMatch(/name: 'feed-report', max: 10, windowMs: 60 \* 60_000/);
    const now = T('2026-11-26T10:00:00Z');
    expect(isDuplicate([{ body: 'How do  I join?', createdAt: T('2026-11-26T09:55:00Z') }], 'how do i JOIN?', now)).toBe(true);
    expect(isDuplicate([{ body: 'How do I join?', createdAt: T('2026-11-26T09:45:00Z') }], 'How do I join?', now)).toBe(false);
  });
  it('AC-2: the cursor is (time, id), so equal times are not skipped; old time-only cursors still work', () => {
    const c = encodeCursor(T('2026-11-26T10:00:00Z'), 'p9');
    expect(decodeCursor(c)).toEqual({ at: T('2026-11-26T10:00:00Z'), id: 'p9' });
    expect(afterCursor(decodeCursor(c))).toEqual({ OR: [{ createdAt: { lt: T('2026-11-26T10:00:00Z') } }, { createdAt: T('2026-11-26T10:00:00Z'), id: { lt: 'p9' } }] });
    expect(afterCursor(decodeCursor('2026-11-26T10:00:00.000Z'))).toEqual({ createdAt: { lt: T('2026-11-26T10:00:00Z') } });
    expect(decodeCursor('nonsense')).toBeNull();
    expect(decodeCursor(`2026-11-26T10:00:00.000Z|bad id;drop`)?.id).toBeNull();
    const feed = r('lib/domain/feed.ts');
    expect(feed).toMatch(/orderBy: \[\{ createdAt: 'desc' \}, \{ id: 'desc' \}\]/);
    expect(feed).toMatch(/authorId: \{ notIn: \[\.\.\.hidden\] \}/);
  });
  it('AC-3/AC-4/AC-5/AC-7: edit and delete routes, no browser prompt, deep links, batched moderation', () => {
    expect(r('app/api/v1/feed/[postId]/route.ts')).toMatch(/export const PATCH[\s\S]*export const DELETE/);
    expect(r('app/api/v1/feed/comments/[commentId]/route.ts')).toMatch(/updateComment[\s\S]*deleteComment/);
    const ui = r('components/feed/FeedPanels.tsx');
    expect(ui).not.toMatch(/window\.(prompt|confirm|alert)/);
    expect(r('lib/domain/feed.ts')).toMatch(/href: `\/feed\?post=\$\{postId\}`/);
    const mq = r('lib/domain/feed.ts').slice(r('lib/domain/feed.ts').indexOf('export async function moderationQueue'));
    expect(mq.slice(0, mq.indexOf('export async function resolveReport'))).not.toMatch(/for \(const r of rows\)/);
  });
  it('AC-6: times in IST', () => expect(r('components/feed/FeedPanels.tsx')).toMatch(/timeZone: 'Asia\/Kolkata'/));
});

describe('engagement', () => {
  it('AC-8: tabs', () => {
    expect(asTab('unanswered')).toBe('unanswered');
    expect(asTab('drop table')).toBe('all');
    expect(tabWhere('unanswered', 'u1')).toEqual({ kind: 'question', acceptedCommentId: null, comments: { none: { state: 'visible', authorId: { not: 'u1' } } } });
    expect(tabWhere('mine', 'u1')).toEqual({ authorId: 'u1' });
  });
  it('AC-9: accepted answers award 10 XP once per question, outside Ranks', () => {
    const f = r('lib/domain/feed.ts');
    expect(f).toMatch(/amount: 10, source: 'answer_accepted', idempotencyKey: `feed-accept:\$\{post\.id\}`/);
    expect(f.slice(f.indexOf('export async function acceptAnswer'), f.indexOf('export async function setPin'))).not.toMatch(/levelId/);
  });
  it('AC-10/AC-11: the day prompt and the share-your-win card', () => {
    expect(dayPrompt({ levelCode: 'DA02', levelIdx: 2, day: 7, title: 'Joins' })).toEqual({ title: 'Level 2 · Day 7 · Joins', ask: 'Working on Day 7 (Joins)? Share what worked, or ask what is blocking you.', levelCode: 'DA02', day: 7 });
    expect(dayPrompt(null)).toBeNull();
    const levels = [{ idx: 1, code: 'DA01', title: 'L1', state: 'approved' }, { idx: 2, code: 'DA02', title: 'L2', state: 'approved' }, { idx: 3, code: 'DA03', title: 'L3', state: 'in_progress' }];
    const title = (l: { idx: number }) => ['Data Explorer', 'SQL Data Journalist'][l.idx - 1];
    expect(winCard(levels, new Set(), title)).toMatchObject({ levelCode: 'DA02', title: 'Level 2 · SQL Data Journalist' });
    expect(winCard(levels, new Set(['DA02']), title)?.levelCode).toBe('DA01');
    expect(winCard(levels, new Set(['DA01', 'DA02']), title)).toBeNull();
  });
  it('AC-13: announcements and pins are staff-only, at most 3 pinned', () => {
    const f = r('lib/domain/feed.ts');
    expect(f).toMatch(/input\.kind === 'announcement' && !canLead\(ctx\)/);
    expect(f).toMatch(/others\.length >= 3/);
  });
  it('AC-14: engagement: active people, answered share (the asker’s own reply does not count), median first reply', () => {
    const e = engagement({
      posts: [
        { id: 'q1', authorId: 'a', kind: 'question', createdAt: T('2026-11-26T10:00:00Z'), acceptedCommentId: null },
        { id: 'q2', authorId: 'b', kind: 'question', createdAt: T('2026-11-26T10:00:00Z'), acceptedCommentId: null },
        { id: 'q3', authorId: 'c', kind: 'question', createdAt: T('2026-11-26T10:00:00Z'), acceptedCommentId: null },
        { id: 'w1', authorId: 'a', kind: 'win', createdAt: T('2026-11-26T11:00:00Z'), acceptedCommentId: null },
      ],
      replies: [
        { postId: 'q1', authorId: 'b', createdAt: T('2026-11-26T10:10:00Z') },
        { postId: 'q2', authorId: 'c', createdAt: T('2026-11-26T10:30:00Z') },
        { postId: 'q3', authorId: 'c', createdAt: T('2026-11-26T10:05:00Z') }, // the asker's own reply
      ],
    });
    expect(e).toEqual({ activePosters: 3, posts: 4, replies: 3, questions: 3, answeredPct: 67, medianFirstReplyMin: 20 });
  });
});
