# Day 5 SQL tables match (customers.city) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "In level 2 the customer table has a city column, and in the insert statements we are inserting phone numbers. Please correct it." |
| Decisions | `customers` keeps **city** (the lesson and the course data dictionary `docs/data-analytics-journey/00-INDEX.md` both define it) and the sample rows get real cities. This also stops the course from teaching learners to store phone numbers. The lesson's CREATE script is aligned with the guided steps (`products.price`, `orders.ordered_on`), so either script works with the step INSERTs. |
| Builds on | `docs/data-analytics-journey/days/D05-databases-rdbms-keys.md` (lesson body), `apps/web/lib/domain/genericGuided/days.ts` day 5 (guided steps), `packages/db/prisma/seed-data-analytics.ts` |
| Code | the two files above · migration `packages/db/prisma/migrations/0019_day5_customers_city` (fixes every institution's copy of the day page) |
| Tests | `apps/web/test/day5-sql-tables.test.ts` (new, pure) |

## 1. Problem
The Day 5 page shows two scripts. The lesson creates `customers(customer_id, name, city)`, `products(…, unit_price)` and `sales_orders(…, order_date)`. The guided steps create `customers(…, phone)`, `products(…, price)` and `orders(…, ordered_on)`, then insert phone numbers. A learner who builds the lesson's tables gets phone numbers in `city`, and the orders INSERT fails because there is no `orders` table.

Each institution has its own copy of the course, written when it was copied. A deploy re-seeds only the default institution, so the copies need a data migration.

## 2. Solution
The steps use `city` with the sample rows Hyderabad, Vijayawada and Warangal. The lesson's CREATE script uses the same table and column names as the steps. Migration 0019 makes the same text replacements in every Day 5 page that still has the old text. It only touches rows that contain the old step script, so it is safe to run twice.

Guardrails: Postgres migration, no RLS change (content rows are not tenant-filtered here; each copy is matched by its text), no new API, routes, env vars or UI strings.

## 3. Acceptance criteria
- [x] AC-1: Given the Day 5 guided steps, when the customers INSERT runs, then its third value in every row is a city name, not a number, and the CREATE has `city TEXT`, not `phone`.
- [x] AC-2: Given the Day 5 lesson and the guided steps, when their CREATE TABLE statements are compared, then they create the same tables with the same columns.
- [x] AC-3: Given an institution's existing copy of Day 5 with the old text, when migration 0019 runs (once or twice), then the page has the city columns and city rows, and no other day changes.
