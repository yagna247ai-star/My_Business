-- docs/AREA_PICKER_SPEC.md: one spelling for the default area. Every existing user becomes Bhagyanagar
-- (learners outside it pick their own area again from the list), and new users start there.
-- Safe to run twice.
UPDATE "users" SET "area" = 'Bhagyanagar' WHERE "area" IS DISTINCT FROM 'Bhagyanagar';
ALTER TABLE "users" ALTER COLUMN "area" SET DEFAULT 'Bhagyanagar';
