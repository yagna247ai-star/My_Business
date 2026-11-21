-- Owner decision (2026-11-21): publish every draft level of every journey (the AI-Powered Data Analytics journey's
-- Modules 2–9 were seeded as drafts). Runs once. From now on, levels are reviewed and published from
-- Program → Content review; a Super Admin can unpublish any level there.
UPDATE "levels" SET "isPublished" = true WHERE "isPublished" = false;
