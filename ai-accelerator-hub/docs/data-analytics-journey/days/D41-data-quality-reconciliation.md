# Day 41 — Checking the Shop Totals Match the Bank Book

> **Time:** 4 h 30 min · **Module:** M8 ETL and Data Quality · **Shop:** Ganesh Micro-Credit Co-op

## The problem
The co-op's warehouse total for last month is ₹4,82,300 less than the core banking total. The board meets on Friday. They want to know: which rows are missing, which are wrong, and whether the report can be trusted.

## The big idea
**Data quality** asks seven simple questions about your data:
- **Complete**: is anything missing?
- **Accurate**: is each value right?
- **Consistent**: is the same thing written the same way everywhere?
- **Unique**: is each record only there once?
- **Valid**: is each value in an allowed range or format?
- **Reconciled**: do the totals match the source?
- **No duplicates**: is any record repeated?

**Reconciliation** is the big check: does the total in the target match the total in the source? Then you find the rows that explain any gap.

Think of a shopkeeper at the end of the day. The cash in the box should match the sales book. If not, find the missing bill.

## Words to know
- **Source**: where the original data lives.
- **Target**: where the cleaned data lives.
- **Reconciliation**: proving two totals match, or explaining the gap.
- **Control total**: a total used to check a load, such as the sum of all amounts.

## Let's solve it
```sql
-- Step 1: compare the totals
SELECT COUNT(*) AS rows, SUM(amount) AS total FROM src.loan_repayments;
SELECT COUNT(*) AS rows, SUM(amount) AS total FROM dw.fact_repayment;

-- Step 2: find rows that are in the source but missing from the target
SELECT s.repayment_id, s.amount
FROM src.loan_repayments s
LEFT JOIN dw.fact_repayment t ON t.repayment_id = s.repayment_id
WHERE t.repayment_id IS NULL;                 -- no match in the target

-- Step 3: find repeats in the target
SELECT repayment_id, COUNT(*) AS n
FROM dw.fact_repayment
GROUP BY repayment_id
HAVING COUNT(*) > 1;                          -- seen more than once
```

In this example, 38 repayments are missing. They all come from one branch. That branch used a date format the program rejected. Now you know where to look.

## Your turn
Use the source and target tables from the practice pack. They have four planted problems: missing rows, a duplicate, a wrong amount, and an invalid date.
1. Compare the row counts and the totals. Write down the difference.
2. Find the missing rows.
3. Find duplicates by ID.
4. Find amounts that do not match for the same ID.
5. Run one validity check (dates and amounts in range) and one consistency check (branch codes).
6. Write the summary: source total, target total, difference, and what explains it.

**Hand in:** your check scripts, a results table (check, what it tests, result, pass or fail), and the summary.

## Check yourself (trainer's answer key)
1. Reconciliation is the big check. The others explain why it fails.
2. The `LEFT JOIN` with `IS NULL` finds rows that are in the source only.
3. If the counts match but the totals differ, look at the amounts: a wrong value, or a rounding issue.

**Expected:** All four planted problems are found. The total difference is explained by the missing rows plus the wrong amounts.

## Why this helps your job
Checking a report against its source, and writing the result as a short summary, is the main job of a data quality analyst.
