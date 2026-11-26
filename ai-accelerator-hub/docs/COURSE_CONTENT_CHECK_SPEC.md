# Course content check (SQL lessons and steps agree) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "Look for this type of bug all over the platform and fix it" (after `docs/DAY5_SQL_TABLES_SPEC.md`: Day 5 created `customers.city` but inserted phone numbers). |
| Decisions | Lessons are changed to match the guided steps, because the steps are the scripts learners run and their stated results are already checked. A lesson that is only an illustration (no practice tables that day) is listed by name in the test and is not run. |
| Builds on | `docs/DAY5_SQL_TABLES_SPEC.md`, `apps/web/lib/domain/genericGuided/` (steps, `code.ts`), `docs/data-analytics-journey/days/*.md` (lessons), `apps/web/lib/domain/daDomains/dataLab.ts` (generated SQL for the 23 domain journeys) |
| Code | `docs/data-analytics-journey/days/D08-aggregates-group-by.md`, `D10-subqueries-ctes-case.md`, `D11-window-functions.md` · migration `packages/db/prisma/migrations/0020_lesson_sql_days_8_10_11` (fixes every institution's copy; generated from the before and after blocks) |
| Tests | `apps/web/test/course-content-sql.test.ts` (new, pure; uses Node's built-in `node:sqlite`, Node 22.13+ / 24) |

## 1. Audit (2026-11-26)
Every SQL and Python script in the course was run, not read:

| Content | What was run | Result |
|---|---|---|
| Guided SQL steps, Data Analytics (29 scripts) | Each day's scripts in order in SQLite (the DB Browser engine). Setup counts, "N rows returned", the numbers quoted in "You should see", and every inserted value against its column name. | All pass after the Day 5 fix. |
| Guided Python steps (24 scripts) | Each day in order in Python 3 with pandas and scikit-learn, with the inputs the page gives. The output was compared with the page's samples and answer checks. | All pass. Day 15's TypeError is intended; the page says so. |
| Lesson SQL, Data Analytics (13 blocks) | Each block against that day's practice tables. | **3 bugs:** Day 8 used `departments.dept_name`, but the practice table has `name`. Day 10 queried `sales_orders` and `customers`, but the day's table is `orders(customer, amount)`; its band limits also differed from the step (20,000 vs 15,000). Day 11 queried `sales_orders` and `products`, but the day's table is `sales(branch, month, product, revenue)`. |
| Domain journeys (23 journeys, 161 SQL steps, 916 lesson SQL blocks) | The generated SQLite DDL, check, clean-copy and KPI scripts, on 120 sample rows per domain. | All pass: 120 loaded, 120 clean. |
| Domain PySpark (411 blocks) | Static check: every column read exists in the dataset or is made earlier (no Java here to run Spark). | All pass. |

## 2. Acceptance criteria
- [x] AC-1: Given every Data Analytics day, when its guided SQL runs in SQLite in order, then no script errors, every setup count matches, and every "N rows returned" matches.
- [x] AC-2: Given every table a guided day builds, when its rows are read, then no value contradicts its column: no digits-only city or name, every date column holds a date, and every amount, price or quantity column holds a number.
- [x] AC-3: Given a lesson SQL block on a day with practice tables, when it is checked (EXPLAIN) against those tables, then every table and column it uses exists. Illustration-only days (40, 41, 43) are named in the test. Any other lesson without practice tables fails the test.
- [x] AC-4: Given each of the 23 domain journeys, when its generated SQLite scripts run on sample rows that meet the dataset rules, then all rows reach the clean table and the KPI queries run.
- [x] AC-5: Days 8, 10 and 11 lessons run on their own practice tables, in the default institution and (migration 0020) every copy. Day 10's lesson gives the same answer as its step (4 / 4 / 4 bands; Kavya Boutique and Lakshmi Stores above the average).

## 3. Out of scope
Running PySpark (needs Java and Spark), and the PostgreSQL and MySQL variants (no server here). Their column lists come from the same generator that AC-4 checks.

## 4. Release
The lesson text reaches the default institution on the next deploy (`seed:content`). Other institutions' copies are fixed by migrations 0019 (Day 5) and 0020 (Days 8, 10 and 11). Each UPDATE matches only rows that still hold the old text, so both are safe to run twice. The test checks that an old copy becomes exactly what the seed now writes.

Guardrails: Postgres migrations (data only, no schema change). RLS is not involved, because rows are matched by their text. No API, route, env var or UI string is added. `node:sqlite` needs Node 22.13+; this checkout and Vercel use Node 24.
