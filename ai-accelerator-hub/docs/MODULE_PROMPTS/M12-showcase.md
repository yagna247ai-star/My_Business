# M12 — Showcase + Standalone (BRD-01 · §1 §3 §5 · REQ-VIS)

## 1. Objective
Deliver the CEO showcase: live product demo plus `standalone.html` anti-gravity shell.

## 2. Prerequisites
- M01–M11 complete (showcase demos real state, never fakes).

## 3. Build steps
1. Confirm landing (`app/page.tsx`) carries tagline and philosophy (no job guarantees).
2. Confirm `standalone.html`: nebula + planet + 40 stars (opacity 0.15), orbit 80s, functional cards.
3. Confirm sidebar: 5 collapsible groups (260ms ease, chevron rotate, localStorage) + bottom rail 272↔64px (`#railToggleBtn`, `ah_sidebar_rail`).
4. Confirm all 17 sidebar links use real routes (`/dashboard`, `/levels`, …); keep `#levels/#graph/#leaderboard` anchors only.
5. Add `● Live from DB` badges on XP/streak/rank sourced from ledger.

## 4. ARB gate
- Does every showcased number trace to DB/ledger (no hard-coded progress)?
- Is standalone a demo shell (real product lives in `apps/web`), clearly labeled?
- Is branding original (no copied protected assets)?
- Is Gen Z delight restrained (no bounce, no clutter, no gradient spam)?

## 5. NFR gate
- Contrast 4.5:1 on dark; reduced-motion respected; keyboard navigable.
- `standalone.html` opens via `file://` (CDN ok) and gracefully notes full-app routes.
- Mobile drawer works; rail is desktop-only.

## 6. Red-team review
- Click every sidebar link in `file://`. None may jump to top (`href="#"` = 0).
- Toggle rail and reload. State must persist. Labels must not overlap icons.
- Check showcased XP vs ledger. Any mismatch = defect.
- Check copy for "guaranteed jobs". Any occurrence = defect.

## 7. Acceptance
- `grep 'href="#"' standalone.html` → 0; 17 real `/routes` present.
- Rail toggle persists; groups collapse with chevron rotation.

## 8. Done criteria
Showcase excites without lying. Every pixel traces to something real.
