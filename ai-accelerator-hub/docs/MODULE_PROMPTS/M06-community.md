# M06 — Community & Creator (BRD-07 · §16 §17 §18 · REQ-COM-01/02)

## 1. Objective
Ship an Instagram-inspired, moderated, private-by-default community that drives growth.

## 2. Prerequisites
- M01 (profiles, privacy), M05 (project cards source data) complete.

## 3. Build steps
1. Build profiles (private by default, granular settings), feed, project cards, reactions, follow, squads, stories, spotlights.
2. Build moderation: report, block, remove, appeal, anti-harassment.
3. Build growth: shareable cards, reels-friendly content, referrals +30 XP, ambassadors, campaign calendar.
4. Build Marketing Studio with human-approval gate before any external publish.
5. Use only authorized Meta APIs. Never promise auto-publish or private analytics.

## 4. ARB gate
- Is personal data private by default with explicit opt-in for public?
- Is moderation a state machine (reported → reviewed → action → appeal), not a delete button?
- Is publishing gated (draft → approval → publish) with brand/asset checks?
- Are social writes tenant-scoped and auditable?

## 5. NFR gate
- Feed p95 < 2s. Abuse actions (report/block) work without login friction loss.
- No targeted ads on sensitive personal data.
- Accessible cards and forms (contrast, keyboard, reduced motion).

## 6. Red-team review
- Try viewing a private profile as a stranger. Must deny.
- Try harassing content then evading via repost. Must remove + restrict + keep appeal path.
- Try publishing via Marketing Studio without approval. Must block.
- Try self-referral farming. Must dedupe (one reward per friend, no self-reward).

## 7. Acceptance
- Feed shows project cards with react/share/report; referral dedup verified.
- Marketing Studio requires human approval (no auto-publish).

## 8. Done criteria
Lively but safe community with moderation, privacy, and gated growth loop.
