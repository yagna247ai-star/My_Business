# Day 6 — Asking the Database for Exactly What You Need

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Pinnacle Tools

## The problem
Pinnacle Tools' manager, Meena (a made-up name), has a 300-row staff sheet. Meena wants three things:
1. The 10 newest workers.
2. A list of departments that have people in them (no repeats).
3. Active workers in the Machining department who earn more than 25,000.

Right now Meena scrolls through the whole sheet.

## The big idea
SQL is a way to ask a database a question. You write the question in plain steps:
- **SELECT**: which columns you want. Like choosing which parts of a report to read.
- **FROM**: which table to look in.
- **WHERE**: which rows to keep. Like a filter on a photo app.
- **ORDER BY**: how to sort the rows. Like sorting a class list by roll number.
- **LIMIT**: how many rows to show. Like "show me only the top 10".

## Words to know
- **Query**: a question you ask a database, written in SQL.
- **DISTINCT**: removes repeats. Like writing each class name only once on a board.
- **Filter**: keeps only some rows.

## Let's solve it
Meena's first question, step by step:

```sql
SELECT name, salary, joined_on   -- the columns I want to see
FROM employees                   -- look in the employees table
WHERE status = 'active'          -- keep only current workers
ORDER BY joined_on DESC          -- newest first (DESC means biggest first)
LIMIT 10;                        -- show only 10 rows
```

Now the second question: which departments have people in them?
```sql
SELECT DISTINCT dept_id          -- each department number once
FROM employees
WHERE status = 'active';
```

`DISTINCT` is why this gives fewer rows than the full table. Many workers share a department.

## Your turn
1. Show the name, department number, and salary of every active worker.
2. List each department that has at least one active worker, once each.
3. Show the 10 newest active workers.
4. Show active workers in department 3 who earn more than 25,000.

**Hand in:** four queries, the number of rows each one returns, and one sentence for Meena about what each result means.

## Check yourself (trainer's answer key)
1. `DISTINCT` removes the repeats, so the result has fewer rows.
2. `LIMIT` only makes sense with `ORDER BY`. Otherwise, the rows come back in any order.
3. For names starting with R: `WHERE name LIKE 'R%'`. The `%` means "any letters after R".

**Common mistake:** `WHERE status = active` without quotes. SQL thinks "active" is a column name. Use `'active'`.

## Why this helps your job
These five words appear in almost every analyst query. Interviewers often start with them.
