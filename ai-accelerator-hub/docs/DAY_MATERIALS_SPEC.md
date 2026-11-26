# Day-wise Study Materials (Drive Links) — Specification

| | |
|---|---|
| Version | 1.1, 2026-11-26 (course-wide materials, easier to find) |
| Trigger | "Each day-wise session should have access to links of materials from Drive, which the learner can open, go through and practise." |
| Decisions | Staff with Content rights (Content & journeys: Manage) add materials to any day from **Content review**. Every link must open for everyone; it is checked on save and daily. Learners see a **Materials** card on the day page, open each one, and tick "Studied" and "Practised". Content review shows how many learners opened each material. |
| Builds on | `docs/SHOWCASE_LINK_HEALTH_SPEC.md` (normalise, probe), `apps/web/app/(app)/levels/[code]/days/[day]/page.tsx`, `apps/web/app/(app)/admin/content/[journeyId]/[idx]/page.tsx`, `DayProgress` |
| Code | `apps/web/lib/domain/dayMaterialsCore.ts` (new, pure) · `apps/web/lib/domain/dayMaterials.ts` (new) · routes `apps/web/app/api/v1/materials/…` (new) · `apps/web/components/learn/DayMaterials.tsx` (new) · `apps/web/components/admin/DayMaterialsAdmin.tsx` (new) · migration `0016_day_materials` |
| Tests | `apps/web/test/day-materials.test.ts` (new, pure) |

---

## 1. Problem
Day lessons are text only. Teachers keep slides, recordings, sheets and practice files in Google Drive, but there is no place to attach them to a day. Learners do not know what to open, and links that are shared privately show "Request access".

## 1a. Problem found after v1.0
Materials a Super Admin added did not show for learners. Each institution has **its own copy** of a course. Content review shows the copy in the admin's current institution, but learners (for example in SLNHRD) read their institution's copy, so the materials sat on a copy they never open. On the day page, the card also sat below a long lesson, where it was easy to miss.

## 1b. v1.1 changes
- **Course-wide:** a material belongs to the same day of the same course (journey slug + level code + day) in **every institution that runs that course**. It is linked by a `groupId`, so editing or removing it updates every copy. A Super Admin's change applies everywhere; an Institution Admin's change applies to their own institution only.
- **Backfill:** migration `0018_course_wide_materials` copies every existing material into the matching day of the other institutions' copies.
- **Easier to find:** the Materials card sits right below the day header (before the lesson), with a count chip in the header ("📎 3 materials"). Each day in the level's day list shows its material count, and enrolled learners get a notification "New material for Day N: *title*".

## 2. Solution
- A **material**: title, link, kind (`slides | doc | sheet | video | folder | notebook | other`, detected from the link and editable), an optional note ("practise questions 1–5"), and an order. It belongs to one day lesson (the day's Content row).
- Staff add, edit, reorder and remove materials on the day in **Content review**. The link is normalised (Drive `/u/N/` and `authuser` removed), refused if it is a personal Drive view, and checked: a link that asks for access is refused with the share instructions. Re-checked daily with the showcase links (status shown to staff).
- Learners: on the day page, a **Materials for today** card lists each item with a kind icon and **Open** (opens in a new tab, through `/api/v1/materials/:id/open`, which records the first open and redirects). There are two ticks per item: **Studied** and **Practised**. Ticks are saved per learner.
- Google Docs, Sheets and Slides links also get a **Make a copy to practise** button (`…/copy`), so learners practise in their own copy.

## 3. Behaviour
1. `detectKind(url)`: `docs.google.com/presentation` → slides, `/document` → doc, `/spreadsheets` → sheet, `drive.google.com/drive/folders` → folder, `colab.research.google.com` → notebook, YouTube / Loom / Vimeo / Drive `.mp4` → video, else other.
2. `copyUrl(url)`: for Docs, Sheets and Slides `/d/<id>/…` → `https://docs.google.com/<type>/d/<id>/copy`; otherwise `null`.
3. Up to 12 materials per day. Title 3–120 characters, note ≤ 300, link https.
4. Only learners whose day is unlocked can open materials (same rule as the day page). Staff with Content rights can always open.
5. `open` records `openedAt` once and redirects with 302 to the stored link (only that link, never a query parameter).
6. Ticks: `studied` and `practised`, each with a timestamp; untick is allowed.
7. Daily link re-check (cron `/api/cron/link-health`) includes materials. When a material turns private or broken, the person who added it is notified.

## 4. Data and API
Migration `0016_day_materials`:
- `day_materials`: `id`, `tenantId`, `contentId` (the day lesson), `title`, `url`, `kind`, `note`, `sortOrder`, `linkStatus`, `linkCheckedAt`, `createdById`, `createdAt`, `updatedAt`; index (`contentId`, `sortOrder`)
- `material_progress`: `id`, `materialId`, `userId`, `openedAt`, `studiedAt`, `practisedAt`; unique (`materialId`, `userId`)

Routes:
- `GET/POST /api/v1/admin/days/:contentId/materials`
- `PATCH/DELETE /api/v1/admin/materials/:id`
- `GET /api/v1/materials/:id/open`
- `POST /api/v1/materials/:id/progress` `{ studied?, practised? }`

## 5. UI
- **Day page:** a Materials card above the steps, with an empty state ("No materials for this day yet.").
- **Content review:** on a day item, a Materials panel with an add form, a list, up/down, edit, remove and a link status badge.

## 6. Acceptance criteria
- [x] AC-5 (v1.1): `matchingDays(source, all)` finds the same journey slug, level code and day in other institutions, and never the source itself.
- [x] AC-6 (v1.1): the day page shows materials before the lesson, and the level page shows per-day counts.

- [x] AC-1: `detectKind` and `copyUrl` behave as described for Docs, Sheets, Slides, folders, Colab, YouTube and others.
- [x] AC-2: Validation refuses non-https links, personal Drive views, more than 12 items, and short titles.
- [ ] AC-3: `open` redirects only to the stored link and records the first open once.
- [ ] AC-4: Learners whose day is locked get 403.

## 7. Out of scope
Uploading files into the app (links only). Quizzes on materials.

## 8. Open questions
None.
