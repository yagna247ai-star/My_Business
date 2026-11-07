# M08 — Career Tracks & Talent Marketplace (BRD-09 · §7 §19 · REQ-CAR/TAL)

## 1. Objective
Ship 8 explorable tracks (pick 1, history preserved) and a consent-gated talent marketplace.

## 2. Prerequisites
- M02 (levels feed tracks), M05 (portfolio source) complete.

## 3. Build steps
1. Seed 8 tracks (App Dev, Automation, Agent Dev, GenAI Eng, Product Mgr, Data Analyst, Solutions Architect, Quality/Eval).
2. Each track: prereqs, Beginner/Intermediate/Advanced, competencies, challenges, capstone, rubric, portfolio rules, readiness score.
3. Allow track switch with history preserved (`TrackEnrollment` history, not overwrite).
4. Build student side: skill profile, resume builder, verified portfolio, mock interviews.
5. Build corporate side: company profiles, skill-based discovery, listings — consent-gated only.

## 4. ARB gate
- Is track history append-only (switch never deletes prior work)?
- Is talent discovery consent-gated at query time (no bulk export of non-consented profiles)?
- Is ranking transparent and skill-based (no opaque AI score as sole basis)?
- Are readiness scores derived from verified artifacts (portfolio + reviews)?

## 5. NFR gate
- Profile data minimization: companies see only authorized fields.
- Resume export is accurate (matches verified portfolio, no embellishment).
- No guaranteed-jobs copy anywhere in UI or docs.

## 6. Red-team review
- Try browsing non-consented student profiles as corporate. Must deny.
- Try opaque ranking deciding a shortlist. Must show skill breakdown instead.
- Try switching tracks to erase a failed capstone. Must preserve history.
- Try forging a verified badge on portfolio. Must reconcile against ledger/reviews.

## 7. Acceptance
- `GET /api/tracks` returns 8 tracks; enroll preserves history.
- Marketplace queries return only consented profiles with skill breakdown.

## 8. Done criteria
8 tracks with capstones; marketplace trusted because consent is enforced.
