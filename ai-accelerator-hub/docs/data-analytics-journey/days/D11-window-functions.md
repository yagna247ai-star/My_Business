# Day 11 — Ranking Inside Groups Without Losing Rows

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Sunita Stores

## The problem
Sunita's owner wants three things:
1. The best-selling product in each branch, each month.
2. How revenue changed from last month, for each branch.
3. Product names cleaned up. Some are in capitals, some have extra spaces.

A normal GROUP BY gives one row per group. But the owner wants to see every product and its rank, not just the winner.

## The big idea
Think of a class exam. Every student keeps their own row. But you also write their rank: 1st, 2nd, 3rd. A **window function** adds a number like that to each row, and keeps every row.

- **ROW_NUMBER()**: 1, 2, 3, 4. Always unique.
- **RANK()**: 1, 2, 2, 4. Two ties share 2, then the next is 4.
- **DENSE_RANK()**: 1, 2, 2, 3. Ties share, but no skipped number.
- **LAG(column)**: the value from the row before. Like "last month's revenue".
- **PARTITION BY**: makes separate groups, like "for each branch".

**Tip:** You cannot filter on a window function directly in WHERE. Put it in a step (a CTE), then filter in the next step.

## Words to know
- **Partition**: a separate group for ranking, like one class.
- **Rank**: a position in a list.
- **Trim**: remove extra spaces at the start and end.

## Let's solve it
Top product in each branch, each month:

```sql
WITH monthly AS (                           -- step 1: revenue per product per month
  SELECT branch,
         month            AS ym,                -- already "2026-10" in this table
         TRIM(UPPER(product)) AS product,        -- clean the name: ' toor dal ' and 'TOOR DAL' become one
         SUM(revenue)     AS revenue
  FROM sales
  GROUP BY branch, ym, TRIM(UPPER(product))
),
ranked AS (                                 -- step 2: rank inside each branch-month
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY branch, ym ORDER BY revenue DESC) AS rn
  FROM monthly
)
SELECT branch, ym, product, revenue         -- step 3: keep only rank 1
FROM ranked
WHERE rn = 1;
```

## Your turn
1. Find the top product in each branch, each month.
2. Create a tie (two products with the same revenue). Compare `RANK` and `DENSE_RANK` on it.
3. For each branch, show revenue and the change from last month.
4. Clean the product names with TRIM and UPPER. How many names changed?

**Hand in:** four queries and a two-sentence note for the owner: which branch-month was strongest, and which was weakest.

## Check yourself (trainer's answer key)
1. You get one row per branch-month.
2. `RANK` skips a number after a tie. `DENSE_RANK` does not.
3. The first month of each branch has a blank change, because there is no month before it.
4. The count of changed names is at least the count of names with extra spaces or capital letters.

**Quick test:** Why can't you write `WHERE ROW_NUMBER() OVER (...) = 1`? (Because window functions run after WHERE. Use a step instead.)

## Why this helps your job
"Find the top item in each group" is one of the most common SQL interview questions. This day gives you the pattern.
