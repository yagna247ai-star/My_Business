# Community feed: engagement and production hardening — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 (extends §16 of the platform spec; `lib/domain/feed.ts`) |
| Trigger | "Do your research on how I can make this feed an engaged one, and do an enterprise production-level upgrade for this feed." Approved plan: "ok fix them". |
| Research basis | Learning communities stay active when (1) there is always something to respond to (prompts tied to today's work; empty feeds kill participation), (2) questions get resolved (accepted answers, mentor answers stand out), (3) helping is visible and reciprocal (unanswered questions surfaced to peers; a small reward only for accepted answers, never for volume), (4) wins are recognised (celebrate, a ready "share your win" card at the moment of achievement, staff spotlight pins), (5) content is relevant (own course by default; tabs), and (6) the space is safe (rate limits, duplicate blocking, child-safety rules, moderation without blocking pop-ups). |
| Decisions | Posts get the author's course (`journeyId`); learners see their course's posts plus institution-wide ones; staff see all. Accepted answers give the answerer 10 XP once per question (no level, so Ranks are unaffected). Announcements and pins are for staff with `community:moderate` or `cohort:manage`; at most 3 pins show first. Authors edit or delete their own posts and comments (soft delete, audited). |
| Code | migration `0022_feed_upgrade` · `apps/web/lib/domain/feedCore.ts` (pure) · `apps/web/lib/domain/feed.ts` · routes under `apps/web/app/api/v1/feed` · `apps/web/components/feed/FeedPanels.tsx` · `apps/web/app/(app)/feed/page.tsx` |
| Tests | `apps/web/test/feed-engagement.test.ts` (pure + wiring); existing DB tests in `test/platform.test.ts` and `test/child-safety.test.ts` keep passing |

## 1. Production fixes
- [x] AC-1: Posting, replying, reacting and reporting are rate limited per person (posts 8 / 10 min, replies 30 / min, reactions 90 / min, reports 10 / hour). The same text posted twice by the same person within 10 minutes is refused.
- [x] AC-2: Paging is stable: the cursor is (time, id), so posts with the same time are never skipped; blocked authors are filtered in the query, so a page is never short while more posts exist.
- [x] AC-3: Authors edit their own post or reply (shown as "edited") and delete it (hidden from everyone, kept for audit).
- [x] AC-4: Reporting uses an in-page form, never a browser prompt.
- [x] AC-5: Reply and accepted-answer notifications open that post (`/feed?post=…`); the feed opens it at the top with its replies.
- [x] AC-6: The reply count updates after replying; times show in IST.
- [x] AC-7: The moderation queue loads its targets in two queries, not one per report.

## 2. Engagement
- [x] AC-8: Tabs: All · Questions · Unanswered · Wins · Mine. Learners see their course and institution-wide posts.
- [x] AC-9: Questions: the asker (or a moderator) accepts one reply; the question shows "Answered" and the accepted reply first; the answerer gets 10 XP once and a notification. Replies from staff show a "Mentor" tag.
- [x] AC-10: A day prompt names the learner's current course day ("Day 7 · Joins: what worked, what is blocking you?") and pre-fills the composer tagged with that day.
- [x] AC-11: After a level is approved, a "Share your win" card offers a pre-filled win post for that level until the learner posts a win for it.
- [x] AC-12: A help strip shows how many questions in the learner's course have no reply yet and opens the Unanswered tab.
- [x] AC-13: Staff post announcements and pin or unpin posts; up to 3 pinned posts show first on the first page.
- [x] AC-14: Moderators see this week's engagement: active posters, posts, replies, questions, share answered, and the median time to a first reply.

## 3. Release
Migration `0022_feed_upgrade` (additive columns and an index on `posts`, an `editedAt` on `comments`). No env change.
